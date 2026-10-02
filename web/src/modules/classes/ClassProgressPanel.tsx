import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { api, invalidate } from '../../lib/api.ts';
import { KhungPanel } from '../../ui/KhungPanel.tsx';
import { WeekPicker } from '../../ui/Filters.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { Field, SectionNote, Skeleton, Status } from '../../ui/ui.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MOC_KIEM_TRA_NORMAL } from '../../ui/chu.ts';
import { kyHieuLop, lichMtMacDinh, tuanLich, type LoiTruong } from '@shared/domain/index.ts';

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
  /** K2-22: tóm tắt MT của lớp FT (null với lớp thường / người không xem được lớp). */
  tomTatMt: { soEm: number; coMocSapToi: number; daXongMtCuoi: number } | null;
};

/**
 * TIẾN ĐỘ CỦA MỘT LỚP — mục 7.6, quyền của Admin CN và Quản lý CN.
 *
 * Nằm ở: Học viên & Lớp → Hồ sơ lớp → ⋮ → Tuần khai giảng (lớp FT) / Lịch kiểm tra (lớp thường) (E7, K2-22, K2-23).
 * FT: chỉ tuần khai giảng — là tuần bắt đầu MẶC ĐỊNH khi thêm học viên; lịch MT do từng em (Test › Kế hoạch Test). Lớp thường: tuần khai giảng +
 * hai mốc kiểm tra (ô Giữa khoá chỉ khi chương trình có mốc đó).
 *
 * Ba ô: tuần khai giảng, tuần thi Giữa khoá, tuần thi Cuối khoá. Hai ô sau tính sẵn theo
 * chương trình, nên phần lớn lớp không ai phải đụng vào — chỉ lớp nghỉ lễ hoặc học bù mới
 * cần xê dịch. Đặt ô về trống là QUAY LẠI mốc mặc định, không phải xoá mốc: cần có đường
 * quay lại, nếu không thì một lần gõ nhầm là lớp đó vĩnh viễn lệch chuẩn.
 *
 * Phần dưới cùng là thứ owner yêu cầu thêm ngày 13/09/2026: khi lớp đã hết chương trình,
 * panel nói thẳng còn bao nhiêu em cần xếp lớp và hai đường đi tiếp của các em.
 */
export function ClassProgressPanel({ classId, classCode, tieuDe, onClose, onDone, onChuyenTiep }: {
  classId: number; classCode: string; tieuDe: string; onClose: () => void; onDone?: () => void;
  /** Lớp hết khoá: nút "Chuyển tiếp lớp" ngay trong khung (chỉ khi người xem chuyển tiếp được). */
  onChuyenTiep?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const { data, loading, reload } = useApi<Progress>(`/classes/${classId}/progress`, [classId]);
  const [startPeriodId, setStartPeriodId] = useState<number | null>(null);
  const [progressWeek, setProgressWeek] = useState<string>('');
  const [finalWeek, setFinalWeek] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
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
    ...(laLopThuong && data.coGiuaKhoa && ngoaiKhoa(progressWeek) ? [{ khoa: 'giua-khoa', nhan: 'Tuần thi Giữa khoá', lyDo: `Từ 1 đến ${data.totalWeeks}` }] : []),
    ...(laLopThuong && ngoaiKhoa(finalWeek) ? [{ khoa: 'cuoi-khoa', nhan: 'Tuần thi Cuối khoá', lyDo: `Từ 1 đến ${data.totalWeeks}` }] : []),
  ];

  const save = async () => {
    lf.bam();
    if (loi.length > 0 || busy) return;
    setBusy(true);
    try {
      await api.patch(`/classes/${classId}/progress`, {
        startPeriodId: startPeriodId ?? null,
        progressWeek: progressWeek.trim() === '' ? null : Number(progressWeek),
        finalWeek: finalWeek.trim() === '' ? null : Number(finalWeek),
      });
      invalidate('/classes');
      toast.push('ok', 'Đã lưu tiến độ lớp');
      reload(); onDone?.();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={tieuDe} lop={classCode} onDong={onClose}
      chan={{
        huy: { nhan: 'Đóng', onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={save} disabled={busy}>Lưu</button>,
      }}>
      {loading || !data ? <div className="pt-3"><Skeleton rows={5} /></div> : (
        <div className="space-y-4 pt-3">
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
            <p className="text-sm text-slate-100 m-0">{data.label ?? 'Chưa tính được tiến độ'}</p>
            {data.startWeekStart && (
              <p className="text-xs text-slate-500 mt-1 mb-0">Tuần khai giảng {tuanLich(data.startWeekStart, homNay)}</p>
            )}
          </div>

          <Field as="div" label="Tuần khai giảng" required={laLopThuong} loi={lf.loiCua(loi, 'khai-giang')}
            hint={laLopThuong ? `Tuần này là tuần học 1 của lớp. ${MOC_KIEM_TRA_NORMAL}` : 'Tuần bắt đầu mặc định khi thêm học viên vào lớp.'}>
            <div {...lf.o(loi, 'khai-giang')}>
              <WeekPicker periodId={startPeriodId} label={null} scope="planning"
                onPeriod={(id) => { setTouched(true); setStartPeriodId(id); }} />
            </div>
          </Field>

          {laLopThuong ? (
            <>
              <div className={`grid gap-3 ${data.coGiuaKhoa ? 'sm:grid-cols-2' : ''}`}>
                {/* K2-23: Pre FOU chỉ có Cuối khoá — không vẽ ô Giữa khoá. */}
                {data.coGiuaKhoa && (
                  <Field label="Tuần thi Giữa khoá (tuần học)" loi={lf.loiCua(loi, 'giua-khoa')}
                    hint={`Mặc định của ${kyHieuLop(data.programmeCode, null) ?? data.programmeCode}: tuần ${data.progressOverridden ? '—' : data.progressWeek ?? '—'}. Để trống là dùng mặc định.`}>
                    <input type="number" min={1} max={data.totalWeeks ?? undefined} className="field w-full"
                      {...lf.o(loi, 'giua-khoa')} value={progressWeek} placeholder={String(data.progressWeek ?? '')}
                      onChange={(e) => { setTouched(true); setProgressWeek(e.target.value); }} />
                  </Field>
                )}
                <Field label="Tuần thi Cuối khoá (tuần học)" loi={lf.loiCua(loi, 'cuoi-khoa')}
                  hint="Để trống là dùng mốc mặc định của chương trình.">
                  <input type="number" min={1} max={data.totalWeeks ?? undefined} className="field w-full"
                    {...lf.o(loi, 'cuoi-khoa')} value={finalWeek} placeholder={String(data.finalWeek ?? '')}
                    onChange={(e) => { setTouched(true); setFinalWeek(e.target.value); }} />
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.coGiuaKhoa && data.progressWeekStart && (
                  <Status kind={data.phase === 'progress_week' ? 'doing' : 'idle'}>
                    Giữa khoá: {tuanLich(data.progressWeekStart, homNay)} (tuần học {data.progressWeek})
                    {data.progressOverridden ? ' · đã xếp lại' : ''}
                  </Status>
                )}
                {data.finalWeekStart && (
                  <Status kind={data.phase === 'final_week' ? 'doing' : 'idle'}>
                    Cuối khoá: {tuanLich(data.finalWeekStart, homNay)} (tuần học {data.finalWeek})
                    {data.finalOverridden ? ' · đã xếp lại' : ''}
                  </Status>
                )}
              </div>

              {/*
                LỚP ĐÃ HỌC XONG → MỖI EM PHẢI ĐƯỢC XẾP LỚP TIẾP.
                Hệ thống KHÔNG tự chuyển ai: nó chỉ nói "đến lúc rồi" và bày sẵn hai đường.
              */}
              {data.needsPlacement && (
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--line)' }}>
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
                    <button type="button" className="btn btn-sm btn-primary mt-2 min-h-[44px] sm:min-h-0" onClick={onChuyenTiep}>Chuyển tiếp lớp…</button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {data.tomTatMt && (
                <p className="m-0 text-sm tabular-nums text-slate-200">
                  {data.tomTatMt.soEm} em · {data.tomTatMt.coMocSapToi} em có MT sắp tới · {data.tomTatMt.daXongMtCuoi} em đã xong MT cuối
                  {' '}<Link to={`/test/ke-hoach?loai=ft&classId=${classId}`} className="link">Xem ở Kế hoạch Test →</Link>
                </p>
              )}
              <SectionNote>
                Tuần khai giảng là tuần bắt đầu mặc định khi thêm học viên. Lịch MT của từng em tính từ tuần bắt đầu của em
                (FT: tuần {lichMtMacDinh('LT1').join(' · ')}; RF: {lichMtMacDinh('RF').join(' · ')}) — xem ở Test › Kế hoạch Test.
                Đổi tuần khai giảng không dời lịch MT của em đã có.
              </SectionNote>
            </div>
          )}
        </div>
      )}
    </KhungPanel>
  );
}
