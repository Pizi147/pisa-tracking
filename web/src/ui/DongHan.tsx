import { useState } from 'react';
import { ApiError } from '../lib/api.ts';
import { ONgay } from './ONgay.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { daysBetween, shortDate } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

/**
 * DÒNG HẠN + SỬA HẠN TẠI CHỖ (HAN-BAO-PH, chủ SP 03/11 N34; mockup `thiet-ke/audit-0311/u10-y-thuc.html` K5 · K8) — dùng chung việc Báo PH và Meeting CX.
 * Xem: "10/11 · còn 7 ngày · đã chỉnh · mặc định 07/11 · Sửa hạn". Sửa: ô ngày (gõ + lịch) · Lưu hạn · Huỷ · Về mặc định — lưu RIÊNG, không lý do,
 * không trần; ngày đã qua vẫn nhận (hiện quá hạn). 409 (người khác vừa sửa): ngày đang gõ giữ trong ô + Tải lại. Quyền kiểm ở máy chủ (`suaHanBaoPh`, `suaHanPhoiHop`).
 */
export function DongHan({ han, hanMacDinh, hanChon, xong, suaDuoc, onLuu, onTaiLai, gon }: {
  /** Hạn hiệu lực (`YYYY-MM-DD`). */
  han: string;
  hanMacDinh: string;
  hanChon: string | null;
  /** Việc đã xong / đã bỏ — chỉ hiện ngày, không đếm ngày, không Sửa hạn. */
  xong?: boolean;
  suaDuoc: boolean;
  /** `han` null = về mặc định; `hanCu` = hạn chọn đang thấy (máy chủ so để báo 409). */
  onLuu: (han: string | null, hanCu: string | null) => Promise<void>;
  onTaiLai: () => void;
  /** Trong dòng việc (Phối hợp SOS): không nhãn "Hạn", chữ nhỏ. */
  gon?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const [sua, setSua] = useState(false);
  const [nhap, setNhap] = useState(han);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<{ chu: string; xungDot: boolean } | null>(null);

  const luu = async (moi: string | null) => {
    setDang(true); setLoi(null);
    try { await onLuu(moi, hanChon); setSua(false); }
    catch (e: any) { setLoi({ chu: e?.message ?? t('Không lưu được'), xungDot: e instanceof ApiError && e.status === 409 }); }
    finally { setDang(false); }
  };
  const moSua = () => { setNhap(han); setLoi(null); setSua(true); };
  const conNgay = daysBetween(hn, han);
  /* Badge khung + chấm (mockup U10 `.bv`, chủ SP 03/11 U04): quá hạn ⚠ đỏ · ≤ 3 ngày vàng · xa xám (#814 hạn xa = viên xám). */
  const BV = 'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-xs font-semibold';
  const cham = (mau: string) => <span aria-hidden className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: mau }} />;
  const tinh = xong ? null
    : conNgay < 0 ? <span className={`${BV} border-late-line bg-late-bg text-late`}><span aria-hidden>⚠</span>{t('quá hạn {n} ngày', { n: -conNgay })}</span>
    : conNgay <= 3 ? <span className={`${BV} border-soon-line bg-soon-bg text-soon`}>{cham('currentColor')}{conNgay === 0 ? t('hôm nay') : t('còn {n} ngày', { n: conNgay })}</span>
    : <span className={`${BV} text-slate-400`} style={{ borderColor: 'var(--line-strong)' }}>{cham('var(--text-faint)')}{t('còn {n} ngày', { n: conNgay })}</span>;
  const nguon = <span className="text-xs text-slate-500">{hanChon ? t('đã chỉnh · mặc định {ngay}', { ngay: shortDate(hanMacDinh, hn) }) : t('mặc định')}</span>;

  const giaTri = sua ? (
    <span className="flex flex-col gap-2">
      <span className="flex flex-wrap items-center gap-2">
        <span className="w-[200px] max-sm:w-full"><ONgay kieu="ngay" value={nhap} onChange={setNhap} ariaLabel={t('Hạn mới')} /></span>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-[36px] max-sm:flex-1" disabled={dang || !nhap} onClick={() => void luu(nhap)}>{dang ? t('Đang lưu…') : t('Lưu hạn')}</button>
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[36px] max-sm:flex-1" disabled={dang} onClick={() => setSua(false)}>{t('Huỷ')}</button>
        {!hanChon && <span className="text-xs text-slate-500">{t('mặc định')} {shortDate(hanMacDinh, hn)}</span>}
        {hanChon && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" disabled={dang}
          onClick={() => void luu(null)}>{t('Về mặc định {ngay}', { ngay: shortDate(hanMacDinh, hn) })}</button>}
      </span>
      {loi && (
        <span role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-late-line bg-late-bg px-3 py-2 text-sm">
          <b className="text-late">{t('Chưa lưu.')}</b><span className="min-w-0 flex-1 text-slate-200">{loi.chu}{loi.xungDot && ` ${t('Ngày bạn gõ vẫn giữ trong ô.')}`}</span>
          {loi.xungDot && <button type="button" className="link appearance-none border-0 bg-transparent p-0 font-semibold" onClick={onTaiLai}>{t('Tải lại')}</button>}
        </span>
      )}
    </span>
  ) : (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <b className={`tabular-nums text-slate-100 ${gon ? 'text-sm' : 'text-base'}`}>{shortDate(han, hn)}</b>
      {tinh && <span className="text-[13px] tabular-nums">{tinh}</span>}
      {!xong && nguon}
      {suaDuoc && !xong && <button type="button" className={`link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0 ${gon ? '' : 'ml-auto'}`} onClick={moSua}>{t('Sửa hạn')}</button>}
    </span>
  );
  if (gon) return giaTri;
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-x-3 border-b pb-3 max-sm:grid-cols-1 max-sm:gap-y-1.5" style={{ borderColor: 'var(--line)' }}>
      <span className="text-[13px] font-medium text-slate-400">{t('Hạn')}</span>
      {giaTri}
    </div>
  );
}
