import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { useSession } from '../../lib/session.tsx';
import { Field, SectionNote, Skeleton } from '../../ui/ui.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MOC_KIEM_TRA_NORMAL } from '../../ui/chu.ts';
import { kyHieuLop, tuanLich, type LoiTruong } from '@shared/domain/index.ts';
import { DongXem, PhanThongTin } from './ThongTinLopPanel.tsx';

type Progress = {
  programmeCode: string | null; programmeName: string | null;
  totalWeeks: number | null; currentWeek: number | null;
  startPeriodId: number | null; startWeekStart: string | null;
  progressWeek: number | null; finalWeek: number | null;
  progressOverridden: boolean; finalOverridden: boolean;
  progressWeekStart: string | null; finalWeekStart: string | null;
  phase: string; phaseLabel: string; weeksLeft: number | null;
  needsPlacement: boolean;
  placementOptions: { code: string; name: string }[];
  activeStudents: number;
  label: string | null;
  /** K2-23: chương trình có mốc Giữa khoá (Pre FOU không có). */
  coGiuaKhoa: boolean;
  lichMt: number[];
  /** K2-22: tóm tắt MT của lớp FT (null với lớp thường / người không xem được lớp). */
  tomTatMt: { soEm: number; coMocSapToi: number; daXongMtCuoi: number } | null;
};

/**
 * PHẦN "LỊCH TEST CỦA LỚP" / "TUẦN KHAI GIẢNG" (FT) của panel Thông tin lớp (PR-OV3a; trước là panel riêng — mục 7.6, E7, K2-22, K2-23).
 * Sửa: Admin CN / Quản lý CN (`canEditProgress`); máy chủ kiểm lại.
 * FT: chỉ tuần khai giảng — là tuần bắt đầu MẶC ĐỊNH khi thêm học viên; lịch MT do từng em (Test › Kế hoạch Test). Lớp thường: tuần khai giảng +
 * hai mốc kiểm tra (ô Giữa khoá chỉ khi chương trình có mốc đó).
 *
 * Hai ô mốc tính sẵn theo chương trình, nên phần lớn lớp không ai phải đụng vào — chỉ lớp nghỉ lễ hoặc học bù mới
 * cần xê dịch. Đặt ô về trống là QUAY LẠI mốc mặc định, không phải xoá mốc: cần có đường
 * quay lại, nếu không thì một lần gõ nhầm là lớp đó vĩnh viễn lệch chuẩn.
 *
 * Lớp đã hết chương trình (owner 13/09/2026): phần nói thẳng còn bao nhiêu em cần xếp lớp và hai đường đi tiếp của các em.
 */
export function PhanLichTest({ classId, tieuDe, suaDuoc, onDone, onChuyenTiep }: {
  classId: number; tieuDe: string; suaDuoc: boolean; onDone?: () => void;
  /** Lớp hết khoá: nút "Lộ trình tiếp theo" ngay trong phần (chỉ khi người xem chuyển tiếp được). */
  onChuyenTiep?: () => void;
}) {
  const toast = useToast();
  const { session } = useSession();
  const { homNay } = useNgayNghiepVu();
  const { data, loading, error, reload } = useApi<Progress>(`/classes/${classId}/progress`, [classId]);
  const [dangSua, setDangSua] = useState(false);
  const [startPeriodId, setStartPeriodId] = useState<number | null>(null);
  const [progressWeek, setProgressWeek] = useState<string>('');
  const [finalWeek, setFinalWeek] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loiLuu, setLoiLuu] = useState<string | null>(null);
  const lf = useLoiForm();

  /* Nạp giá trị hiện tại MỘT LẦN — nếu không thì mỗi lần tải lại sẽ xoá cái người đang gõ. */
  if (data && !touched) {
    if (startPeriodId === null && data.startPeriodId) setStartPeriodId(data.startPeriodId);
    if (progressWeek === '' && data.progressOverridden && data.progressWeek) setProgressWeek(String(data.progressWeek));
    if (finalWeek === '' && data.finalOverridden && data.finalWeek) setFinalWeek(String(data.finalWeek));
  }

  const laLopThuong = !!data?.totalWeeks;
  /* Báo sớm dưới ô — máy chủ vẫn kiểm (tuần trong khoá, Giữa khoá trước Cuối khoá). */
  const ngoaiKhoa = (v: string) => v.trim() !== '' && (!Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > (data?.totalWeeks ?? 0));
  const loi: LoiTruong[] = !data ? [] : [
    ...(laLopThuong && !startPeriodId ? [{ khoa: 'khai-giang', nhan: 'Tuần khai giảng', lyDo: 'Chưa chọn' }] : []),
    ...(laLopThuong && data.coGiuaKhoa && ngoaiKhoa(progressWeek) ? [{ khoa: 'giua-khoa', nhan: 'Tuần Progress Test', lyDo: `Từ 1 đến ${data.totalWeeks}` }] : []),
    ...(laLopThuong && ngoaiKhoa(finalWeek) ? [{ khoa: 'cuoi-khoa', nhan: 'Tuần Final Test', lyDo: `Từ 1 đến ${data.totalWeeks}` }] : []),
  ];

  /* Huỷ: về giá trị đã lưu (nạp lại một lần ở lượt vẽ sau). */
  const huy = () => {
    setDangSua(false); setLoiLuu(null); setTouched(false);
    setStartPeriodId(null); setProgressWeek(''); setFinalWeek('');
  };

  const save = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true); setLoiLuu(null);
    try {
      await api.patch(`/classes/${classId}/progress`, {
        startPeriodId: startPeriodId ?? null,
        progressWeek: progressWeek.trim() === '' ? null : Number(progressWeek),
        finalWeek: finalWeek.trim() === '' ? null : Number(finalWeek),
      });
      invalidate('/classes');
      toast.push('ok', `Đã lưu ${tieuDe.toLowerCase()}`);
      setDangSua(false); setTouched(false);
      reload(); onDone?.();
    } catch (e: any) { setLoiLuu(e.message); toast.push('error', e.message); } finally { setBusy(false); }
  };

  const hetKhoa = data?.needsPlacement && (
    /* LỚP ĐÃ HỌC XONG → MỖI EM PHẢI ĐƯỢC XẾP LỚP TIẾP. Hệ thống KHÔNG tự chuyển ai: chỉ nói "đến lúc rồi" và bày sẵn hai đường. */
    <div className="mt-3 rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
      <p className="text-sm text-slate-100 m-0">
        Lớp đã học hết {data.totalWeeks} tuần. <strong>{data.activeStudents} học viên</strong> cần
        được xếp lớp tiếp theo.
      </p>
      <p className="text-xs text-slate-300 mt-1.5 mb-0">
        Hai đường đi:
        {' '}{data.placementOptions.map((o) => `${o.name} (${o.code})`).join(' — hoặc — ')}
      </p>
      <p className="m-0 mt-1.5 text-xs text-slate-500">Hệ thống không tự chuyển em nào.</p>
      {onChuyenTiep && (
        <button type="button" className="btn btn-sm btn-primary mt-2 min-h-[44px] sm:min-h-0" onClick={onChuyenTiep}>Lộ trình tiếp theo</button>
      )}
    </div>
  );
  const tuanMoc = (tuan: number | null, ws: string | null, xepLai: boolean) => (
    <span className="tabular-nums">{tuan ? `tuần ${tuan}` : '—'}{ws ? ` · ${tuanLich(ws, homNay)}` : ''}{xepLai ? ' · đã xếp lại' : ''}</span>
  );

  return (
    <PhanThongTin tieuDe={tieuDe} suaDuoc={suaDuoc && !!data} dangSua={dangSua} busy={busy} loi={loiLuu}
      onSua={() => setDangSua(true)} onHuy={huy} onLuu={save}>
      {error ? <p className="m-0 text-xs text-rose-200">{error.message}</p> : loading || !data ? <Skeleton rows={3} /> : !dangSua ? (
        <>
          <DongXem dong={[
            ['Khai giảng', data.startWeekStart ? <span className="tabular-nums">{tuanLich(data.startWeekStart, homNay)}</span> : <span className="text-amber-200">Chưa chọn</span>],
            ...(laLopThuong ? [
              ...(data.coGiuaKhoa ? [['Progress Test', tuanMoc(data.progressWeek, data.progressWeekStart, data.progressOverridden)] as [string, ReactNode]] : []),
              ['Final Test', tuanMoc(data.finalWeek, data.finalWeekStart, data.finalOverridden)] as [string, ReactNode],
            ] : []),
          ]} />
          {!laLopThuong && data.tomTatMt && (
            <p className="m-0 mt-2 text-sm tabular-nums text-slate-200">
              {data.tomTatMt.soEm} em · {data.tomTatMt.coMocSapToi} em có MT sắp tới · {data.tomTatMt.daXongMtCuoi} em đã xong MT cuối
              {session?.nav?.testPlan && <>{' '}<Link to={`/test/ke-hoach?loai=ft&classId=${classId}`} className="link">Xem ở Kế hoạch Test →</Link></>}
            </p>
          )}
          {laLopThuong && hetKhoa}
        </>
      ) : (
        <div className="space-y-4">
          <p className="m-0 text-xs text-slate-400">{data.label ?? 'Chưa tính được tiến độ'}</p>
          <Field as="div" label="Tuần khai giảng" required={laLopThuong} loi={lf.loiCua(loi, 'khai-giang')}
            hint={laLopThuong ? `Tuần khai giảng = tuần học 1. ${MOC_KIEM_TRA_NORMAL}` : 'Tuần bắt đầu mặc định khi thêm học viên vào lớp.'}>
            <div {...lf.o(loi, 'khai-giang')}>
              <WeekPicker periodId={startPeriodId} label={null} scope="planning"
                onPeriod={(id) => { setTouched(true); setStartPeriodId(id); }} />
            </div>
          </Field>

          {laLopThuong ? (
            <div className={`grid gap-3 ${data.coGiuaKhoa ? 'sm:grid-cols-2' : ''}`}>
              {/* K2-23: Pre FOU chỉ có Cuối khoá — không vẽ ô Giữa khoá. */}
              {data.coGiuaKhoa && (
                <Field label="Tuần Progress Test (tuần học)" loi={lf.loiCua(loi, 'giua-khoa')}
                  hint={`Mặc định của ${kyHieuLop(data.programmeCode, null) ?? data.programmeCode}: tuần ${data.progressOverridden ? '—' : data.progressWeek ?? '—'}. Để trống là dùng mặc định.`}>
                  <input type="number" min={1} max={data.totalWeeks ?? undefined} className="field w-full"
                    {...lf.o(loi, 'giua-khoa')} value={progressWeek} placeholder={String(data.progressWeek ?? '')}
                    onChange={(e) => { setTouched(true); setProgressWeek(e.target.value); }} />
                </Field>
              )}
              <Field label="Tuần Final Test (tuần học)" loi={lf.loiCua(loi, 'cuoi-khoa')}
                hint="Để trống là dùng mốc mặc định của chương trình.">
                <input type="number" min={1} max={data.totalWeeks ?? undefined} className="field w-full"
                  {...lf.o(loi, 'cuoi-khoa')} value={finalWeek} placeholder={String(data.finalWeek ?? '')}
                  onChange={(e) => { setTouched(true); setFinalWeek(e.target.value); }} />
              </Field>
            </div>
          ) : (
            <SectionNote>
              Tuần khai giảng là tuần bắt đầu mặc định khi thêm học viên. Lịch MT của từng em tính từ tuần bắt đầu của em
              (MT ở tuần học {data.lichMt.join(' · ')}) — xem ở Test › Kế hoạch Test.
              Đổi tuần khai giảng không dời lịch MT của em đã có.
            </SectionNote>
          )}
        </div>
      )}
    </PhanThongTin>
  );
}
