import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Truong } from '../../ui/KhungPanel.tsx';
import { HopBoChu, Modal } from '../../ui/Drawer.tsx';
import { ONgay } from '../../ui/ONgay.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { addDaysStr } from '../../lib/format.ts';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { CHIP_TRON, Nhan } from '../../ui/Nhan.tsx';
import { chipSauThi, chuSauThi, ngay, type GiaiDoanSauThi } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/** Thông tin hạn sau thi mà nơi gọi đã có (việc Công việc, panel Bước tiếp, panel một em, hồ sơ). */
export type HanSauThi = { cycleId: number; han: string | null; daGiaHan: boolean };

/**
 * HỘP GIA HẠN SAU THI (OV-13q, mẫu "Dời hạn chấm" + hộp nhỏ "Kết thúc PA"): Hạn mới (ô gõ được + lịch, mặc định hạn đang áp dụng + 7) · Lý do tuỳ chọn ·
 * Lưu / Bỏ gia hạn (khi đã gia hạn). Hộp nhỏ (`Modal`) trong panel đang mở — không đóng, không phủ panel (6c lỗi 9). Máy chủ kiểm lại (hạn trước hôm nay → câu lỗi hiện trong hộp, giữ chữ).
 */
export function HopGiaHan({ x, hocVien, lop, onClose, onDone }: { x: HanSauThi; hocVien?: string | null; lop?: string | null; onClose: () => void; onDone?: () => void }) {
  const toast = useToast();
  const { homNay } = useNgayNghiepVu();
  const goc = x.han && homNay && x.han > homNay ? x.han : homNay;
  const [han, setHan] = useState(goc ? addDaysStr(goc, 7) : '');
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const lf = useLoiForm();
  const loiO = !han ? [{ khoa: 'han', nhan: t('Hạn mới'), lyDo: t('Chưa chọn') }] : [];
  const gui = async (moi: string | null) => {
    if (moi !== null) { lf.bam(); if (loiO.length) return; }
    setBusy(true); setLoi(null);
    try {
      await api.put(`/cycles/${x.cycleId}/han-sau-thi`, { han: moi, lyDo: lyDo.trim() || null });
      ['/my-work', '/students', '/hoc-vien-lop', '/tong-quan', '/cycles', '/lo-trinh'].forEach((k) => invalidate(k));
      toast.push('ok', moi ? t('Đã gia hạn tới {ngay}', { ngay: ngay(moi, homNay) }) : t('Đã bỏ gia hạn'));
      onDone?.(); onClose();
    } catch (e: any) { setLoi(e?.message ?? t('Không lưu được')); } finally { setBusy(false); }
  };
  /* 6c (bảng kê lỗi 9): việc một ô → HỘP NHỎ (G5 bậc 2) trong panel đang mở, không ngăn 480 phủ panel. Đang chạy thì không đóng; còn lý do đang gõ → hỏi một lần. */
  const [hoi, setHoi] = useState(false);
  const dong = () => { if (busy) return; if (lyDo.trim()) setHoi(true); else onClose(); };
  const ngu = [hocVien, lop].filter(Boolean).join(' · ');
  return (
    <Modal open onClose={dong} width="max-w-[440px]" z="z-[60]"
      title={<>{t('Gia hạn')}{ngu && <span className="ml-2 font-normal text-slate-400">{ngu}</span>}</>}
      footer={<>
        <button type="button" className="btn min-h-[44px] sm:min-h-0" onClick={dong} disabled={busy}>{lyDo.trim() ? t('Huỷ thay đổi') : t('Đóng')}</button>
        {x.daGiaHan && <button type="button" className="btn min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void gui(null)}>{t('Bỏ gia hạn')}</button>}
        <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={() => void gui(han)}>{busy ? t('Đang lưu…') : t('Lưu')}</button>
      </>}>
      {hoi && <HopBoChu viec={t('Gia hạn')} nut={t('Bỏ chữ, đóng')} onO={() => setHoi(false)} onBo={onClose} />}
      <div className="space-y-3">
        <Truong nhan={t('Hạn mới')} batBuoc loi={lf.loiCua(loiO, 'han')}>
          <ONgay kieu="ngay" value={han} onChange={setHan} toiThieu={homNay ?? undefined} id={lf.oId('han')} onBlur={lf.roi('han')} invalid={!!lf.loiCua(loiO, 'han')} />
          {x.han && <span className="mt-1 block text-xs text-slate-500">{t('Hạn đang áp dụng')}{' '}{ngay(x.han, homNay)}{x.daGiaHan ? ` · ${t('đã gia hạn')}` : ''}</span>}
        </Truong>
        <Truong nhan={t('Lý do')} tuyChon>
          <textarea className="field w-full" rows={2} maxLength={300} value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder={t('Ví dụ: em chờ phiếu điểm từ IDP')} />
        </Truong>
        {loi && <p className="m-0 text-xs font-semibold text-bad" role="alert">{loi}</p>}
      </div>
    </Modal>
  );
}

/**
 * "Đã thi · chờ kết quả" + "hạn 23/10" (· "quá hạn" đỏ / "đã gia hạn") — MỘT nhãn cho đầu hồ sơ, panel một em, Học viên & Lớp (chữ + màu, không chỉ màu).
 * `gon`: ô bảng hẹp — chữ màu thay chip, xuống dòng được.
 */
export function NhanSauThi({ s, gon }: { s: { giaiDoan: GiaiDoanSauThi; han: string | null; quaHan: boolean; daGiaHan: boolean }; gon?: boolean }) {
  const { homNay } = useNgayNghiepVu();
  const chu = chuSauThi(s);
  if (!chu) return null;
  const tone = s.quaHan ? 'late' : s.giaiDoan === 'cho_buoc_tiep' ? 'ok' : 'soon';
  const han = s.han ? (
    <span className={`text-xs tabular-nums ${s.quaHan ? 'font-semibold text-late' : 'text-slate-400'}`}>
      {[t('hạn {ngay}', { ngay: ngay(s.han, homNay) }), s.quaHan ? `⚠ ${t('quá hạn')}` : s.daGiaHan ? t('đã gia hạn') : null].filter(Boolean).join(' · ')}
    </span>
  ) : null;
  /* OV-15a: ô bảng — chip viền xanh "Đã thi · chờ KQ" / "Có KQ · chờ bước tiếp" (hàng tô nền đã thi ở chỗ gọi), trễ thêm ⚠ trong chip. */
  if (gon) return (
    <span className="block text-xs leading-snug">
      <span className={`${CHIP_TRON} border-ok bg-[color:var(--surface)] font-semibold text-slate-100`}>{s.quaHan && <span aria-hidden className="mr-1 text-late">⚠</span>}{chipSauThi(s)}</span>
      <span className="block">{han}</span>
    </span>
  );
  return <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5"><Nhan tone={tone}>{chu}</Nhan>{han}</span>;
}
