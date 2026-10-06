import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Hang2, Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { ChonThang } from '../../ui/ChonNgay.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { Level } from '../../ui/ui.tsx';
import { sosTone } from '../../lib/format.ts';
import {
  dsLoi, huongTiepKhaDung, ketQuaGanNhat, nhanHuong, nhanMt0, tenMonNgan, xepHuongTheoGoiY, type GoiYCuoiKhoa, type Huong, type KetQuaVao,
} from '@shared/domain/index.ts';

type LoTrinhTiepData = {
  lop: { id: number; code: string; ma: string | null; maKe: string | null; laLopThuong: boolean; dangHoc: boolean } | null;
  banGhi: { huong: Huong; lopDuKienId: number | null; mucTieu: number | null; thangThi: string | null; ghiChu: string | null; ngayXemLai: string | null } | null;
  lopDuKien: { id: number; code: string; ma: string | null; ft: boolean }[];
  coTheGhi: boolean;
  /** B9: kết quả gần nhất của em (`standingFor`). */
  ketQua: KetQuaVao | null;
  /** PR-LT2b (K2-26): % Cuối khoá + hướng gợi ý (không lưu) của em. */
  cuoiKhoa?: { tyLe: number | null; scored: number; required: number; monTruot: string[]; goiY: GoiYCuoiKhoa | null } | null;
  /** PR-MT0: MT0 của em (đã lưu Lên FT) — dòng phụ `MT0 · W4 OCT` dưới lựa chọn Lên FT (mockup ①). */
  mt0?: { maTuan: string | null; trangThai: 'cho' | 'dung' | 'khong_dung' | 'huy' } | null;
};

/** Khối "Kết quả gần nhất" của em: số chính + tối đa hai dòng chữ (cùng `ketQuaGanNhat` với cột Kết quả ở Học viên & Lớp). */
function KetQuaGanNhatEm({ ketQua }: { ketQua: KetQuaVao | null }) {
  const k = ketQuaGanNhat(ketQua);
  return (
    <Khoi tieuDe="Kết quả gần nhất">
      <div className="flex flex-wrap items-center gap-x-2">
        <span className="text-sm font-bold tabular-nums text-slate-100">{k.chinh}</span>
        {k.lech && <span className="text-xs font-semibold tabular-nums text-bad" title={`Dưới kỳ vọng ${k.lech.replace('−', '')}`}>{k.lech}</span>}
        {k.sos && <Level tone={sosTone(ketQua?.sosLevel ?? null)} dut={k.sosTamThoi}>{k.sos}{k.sosTamThoi ? ' tạm thời' : ''}</Level>}
      </div>
      {k.dong1 && <span className="block text-[12px] leading-4 text-slate-500">{k.dong1}</span>}
      {k.dong2 && <span className="block text-[12px] leading-4 text-slate-500">{k.dong2}</span>}
    </Khoi>
  );
}

/** Một dòng nghĩa (≤ 60 ký tự) dưới mỗi hướng — để người chọn khỏi đoán "Học lại" hay "Tạm dừng học (bảo lưu)" là gì. */
const NGHIA_HUONG: Record<Huong, string> = {
  len_lop: 'Học tiếp chương trình kế của lớp thường',
  fast_track: 'Chuyển sang lộ trình luyện thi Fast Track',
  hoc_lai: 'Học lại chương trình đang học',
  bao_luu: 'Tạm nghỉ, giữ chỗ để quay lại sau',
  dung_hoc: 'Em thôi học sau lớp này',
  chua_quyet: 'Chưa quyết định, hẹn ngày xem lại',
};

/**
 * LỘ TRÌNH TIẾP THEO (mockup 11-1, §3.9.1; PR-UX3 mockup 15 §8) — dự định cho một em SAU lớp đang học, ghi trước khi thật sự chuyển. Chỉ lớp
 * thường. MỘT panel `KhungPanel`: khối **Hướng đi** là danh sách dọc (nhãn đầy đủ + một dòng nghĩa), khối **Chi tiết** (lớp dự kiến ·
 * Fast Track: Target + tháng thi 2 ô một hàng · Chưa quyết: ngày xem lại · ghi chú). PR-HVL (B9): đầu panel có khối **Kết quả gần nhất**.
 * PR-K26: hướng Hệ thống gợi ý theo Cuối khoá đứng đầu, các hướng khác thu vào "Hướng khác"; em 50–59% thì GVCN ghi ĐỀ XUẤT, Quản lý quyết lúc
 * chuyển lớp (không thẻ Chờ duyệt). Nằm ở: Học viên & Lớp / hồ sơ lớp → ⋯ dòng em → Lộ trình tiếp theo.
 */
export function LoTrinhTiepPanel({ open, onClose, studentId, studentName, lop, onDone }: {
  open: boolean; onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
}) {
  if (!open) return null;
  return <NoiDungLoTrinhTiep onClose={onClose} studentId={studentId} studentName={studentName} lop={lop} onDone={onDone} />;
}

function NoiDungLoTrinhTiep({ onClose, studentId, studentName, lop, onDone }: {
  onClose: () => void; studentId: number; studentName?: string; lop?: string | null; onDone?: () => void;
}) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const info = useApi<LoTrinhTiepData>(`/students/${studentId}/lo-trinh-tiep`, [studentId]);
  const [huong, setHuong] = useState<Huong | ''>('');
  const [lopDuKienId, setLopDuKienId] = useState<number | ''>('');
  const [mucTieu, setMucTieu] = useState('');
  const [thangThi, setThangThi] = useState('');
  const [ngayXemLai, setNgayXemLai] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [daSua, setDaSua] = useState(false);
  const lf = useLoiForm();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const bg = info.data?.banGhi;
    setHuong(bg?.huong ?? '');
    setLopDuKienId(bg?.lopDuKienId ?? '');
    setMucTieu(bg?.mucTieu != null ? String(bg.mucTieu) : '');
    setThangThi(bg?.thangThi ?? '');
    setNgayXemLai(bg?.ngayXemLai ?? '');
    setGhiChu(bg?.ghiChu ?? '');
    setDaSua(false);
  }, [info.data]);
  /** Mọi ô đổi đi qua đây — chân panel theo luật S3 ("Đóng" khi chưa sửa, "Huỷ thay đổi" khi đã sửa). */
  const doi = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDaSua(true); };

  const data = info.data;
  const goiY = data?.cuoiKhoa?.goiY ?? null;
  const cacHuong = useMemo(() => huongTiepKhaDung((data?.lop?.ma ?? null) as any), [data?.lop?.ma]);
  const { dau, khac } = useMemo(() => xepHuongTheoGoiY(cacHuong, goiY), [cacHuong, goiY]);
  const thongBao = info.loading ? 'Đang tải…'
    : !data?.lop ? 'Học viên không đang học lớp nào.'
    : !data.lop.laLopThuong ? 'Lộ trình tiếp theo chỉ áp dụng cho lớp thường.'
    : !data.coTheGhi ? 'Bạn không có quyền ghi lộ trình tiếp theo cho học viên này.'
    : null;
  if (thongBao || !data?.lop) {
    return <KhungPanel tieuDe="Lộ trình tiếp theo" hocVien={studentName} lop={lop} onDong={onClose}><p className="mt-3 text-sm text-slate-400">{thongBao}</p></KhungPanel>;
  }
  const lopHoc = data.lop;
  const deXuat = !!goiY?.canQuanLy;
  /** "Hướng khác" mở sẵn khi hướng ĐÃ LƯU nằm trong đó — không giấu lựa chọn cũ (Review Focus 4). */
  const moHuongKhac = !!data.banGhi && khac.includes(data.banGhi.huong);

  const lopHopLe = data.lopDuKien.filter((l) => (
    huong === 'fast_track' ? l.ft
      : huong === 'hoc_lai' ? !l.ft && l.ma === lopHoc.ma
      : !l.ft && l.ma === lopHoc.maKe
  ));
  /** Lớp dự kiến chỉ có nghĩa với hướng đổi lớp. */
  const coLopDuKien = huong === 'len_lop' || huong === 'hoc_lai' || huong === 'fast_track';
  const nhanCua = (h: Huong) => `${nhanHuong(h, { ma: lopHoc.ma as any, maKe: lopHoc.maKe as any })}${h === 'len_lop' && goiY?.boTroNeuLen ? ' + bổ trợ' : ''}`;

  const loi = dsLoi([{ khoa: 'huong', nhan: deXuat ? 'Hướng đề xuất' : 'Hướng đi', chon: true }], { huong });
  const luu = async () => {
    lf.bam();
    if (loi.length > 0) return;
    setBusy(true);
    try {
      await api.put(`/students/${studentId}/lo-trinh-tiep`, {
        huong, lopDuKienId: coLopDuKien && lopDuKienId ? lopDuKienId : null,
        mucTieu: huong === 'fast_track' && mucTieu ? Number(mucTieu) : null,
        thangThi: huong === 'fast_track' && thangThi ? thangThi : null,
        ngayXemLai: huong === 'chua_quyet' && ngayXemLai ? ngayXemLai : null,
        ghiChu: ghiChu || null,
      });
      invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/my-work');
      toast.push('ok', deXuat ? 'Đã lưu đề xuất. Quản lý quyết khi chuyển lớp.' : 'Đã ghi lộ trình tiếp theo');
      onDone?.(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  /* PR-MT0: chữ đúng mockup ① — `MT0 · W4 OCT`; MT0 có điểm mà đang chọn hướng khác → `MT0 · không dùng`. */
  const mt0 = data?.mt0 ?? null;
  const mt0Chu = !mt0 ? null : mt0.trangThai === 'khong_dung' ? nhanMt0('khong_dung') : mt0.maTuan ? `MT0 · ${mt0.maTuan}` : 'MT0';
  const oHuong = (h: Huong, coGoiY: boolean) => {
    const chon = huong === h;
    return (
      <button key={h} type="button" role="radio" aria-checked={chon}
        onClick={() => { doi(setHuong)(h); setLopDuKienId(''); }}
        className={`flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 text-left ${
          chon ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]' : 'border-[color:var(--line)] hover:border-[color:var(--line-strong)]'}`}
        style={{ background: chon ? undefined : 'transparent' }}>
        <span aria-hidden className={`mt-[3px] inline-block h-3 w-3 shrink-0 rounded-full border ${chon ? 'border-[color:var(--accent)] bg-[color:var(--accent)]' : 'border-slate-500'}`} />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-100">{nhanCua(h)}</span>
          <span className="block text-xs text-slate-500">{NGHIA_HUONG[h]}</span>
          {h === 'fast_track' && mt0Chu && <span className="block text-xs font-semibold tabular-nums text-slate-300">{mt0Chu}</span>}
        </span>
        {coGoiY && <span className="ml-auto shrink-0 self-center text-xs font-semibold text-teal-300">Hệ thống gợi ý</span>}
      </button>
    );
  };

  return (
    <KhungPanel tieuDe="Lộ trình tiếp theo" hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        daSua, huy: { onClick: onClose, disabled: busy },
        conThieu: lf.conThieu(loi),
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy}>{busy ? 'Đang lưu…' : deXuat ? 'Lưu đề xuất' : 'Lưu'}</button>,
      }}>
      <KetQuaGanNhatEm ketQua={data.ketQua} />
      {goiY && (
        <Khoi tieuDe="Hệ thống gợi ý theo Cuối khoá">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-bold tabular-nums text-slate-100">Cuối khoá {Math.round((data.cuoiKhoa?.tyLe ?? 0) * 100)}%</span>
            {(data.cuoiKhoa?.monTruot.length ?? 0) > 0 && <span className="text-[12px] text-slate-500">không đạt {data.cuoiKhoa!.monTruot.map((m) => tenMonNgan(lopHoc.ma, m)).join(', ')}</span>}
          </div>
          <span className="block text-[12px] leading-4 text-slate-400">{goiY.nhan}</span>
        </Khoi>
      )}
      <Khoi tieuDe={deXuat ? 'Hướng bạn đề xuất (Quản lý quyết)' : 'Hướng đi'}>
        <p className="m-0 mb-2 text-xs text-slate-400">
          {deXuat
            ? 'Cuối khoá 50–59%: bạn ghi đề xuất, Quản lý chọn hướng cuối cùng khi chuyển lớp. Chưa đổi lớp.'
            : 'Chỉ là dự định, chưa đổi lớp. Ghi trước để người kế nhiệm biết em sẽ đi đâu sau lớp này.'}
        </p>
        <div {...lf.o(loi, 'huong')} tabIndex={-1} role="radiogroup" aria-label={deXuat ? 'Hướng đề xuất' : 'Hướng đi'} className="space-y-1.5 outline-none">
          {dau.length === 0 ? cacHuong.map((h) => oHuong(h, false)) : (
            <>
              {dau.map((h) => oHuong(h, true))}
              <details open={moHuongKhac || khac.includes(huong as Huong) || undefined} className="group pt-1">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-slate-300 sm:min-h-[32px]">
                  Hướng khác <span aria-hidden className="text-slate-500 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="space-y-1.5 pt-1">{khac.map((h) => oHuong(h, false))}</div>
              </details>
            </>
          )}
        </div>
        {lf.loiCua(loi, 'huong') && <span className="block text-xs text-late">{lf.loiCua(loi, 'huong')}</span>}
      </Khoi>

      {huong && (
        <Khoi tieuDe="Chi tiết">
          {coLopDuKien && (
            <Truong nhan="Lớp dự kiến" tuyChon phu="Chưa biết thì để trống">
              <select className="field w-full" value={lopDuKienId} onChange={(e) => doi(setLopDuKienId)(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Chưa chọn</option>
                {lopHopLe.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
              </select>
            </Truong>
          )}
          {huong === 'fast_track' && (
            <Hang2>
              <Truong nhan="Target" tuyChon>
                <input className="field w-full" type="number" step="0.5" min={0} max={9} value={mucTieu} onChange={(e) => doi(setMucTieu)(e.target.value)} />
              </Truong>
              <Truong nhan="Dự kiến thi" tuyChon>
                <ChonThang value={thangThi} onChange={doi(setThangThi)} chuaChon="Chưa chọn" />
              </Truong>
            </Hang2>
          )}
          {huong === 'chua_quyet' && (
            <Truong nhan="Ngày xem lại" tuyChon phu="Để trống thì hệ thống nhắc lại em này ở hai tuần cuối khoá">
              <ONgay kieu="ngay" value={ngayXemLai} onChange={doi(setNgayXemLai)} toiThieu={homNay || undefined} ariaLabel="Ngày xem lại" />
            </Truong>
          )}
          <Truong nhan="Ghi chú" tuyChon>
            <textarea className="field w-full" rows={2} value={ghiChu} onChange={(e) => doi(setGhiChu)(e.target.value)} />
          </Truong>
        </Khoi>
      )}
    </KhungPanel>
  );
}
