import { useEffect, useId, useRef, useState } from 'react';
import { ApiError } from '../lib/api.ts';
import { ONgay } from './ONgay.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { HAN_GAN_NGAY, daysBetween, shortDate } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { BadgeHan } from './Nhan.tsx';

/**
 * DÒNG HẠN + SỬA HẠN TẠI CHỖ (HAN-BAO-PH, chủ SP 03/11 N34; mockup `thiet-ke/audit-0311/u10-y-thuc.html` K5 · K8) — dùng chung việc Báo PH và Meeting CX.
 * Xem: "10/11 · còn 7 ngày · đã chỉnh · mặc định 07/11 · Sửa hạn". Sửa: ô ngày (gõ + lịch) · Lưu hạn · Huỷ · Về mặc định — lưu RIÊNG, không lý do,
 * không trần; ngày đã qua vẫn nhận (hiện quá hạn). 409 (người khác vừa sửa): ngày đang gõ giữ trong ô + Tải lại. Quyền kiểm ở máy chủ (`suaHanBaoPh`, `suaHanPhoiHop`).
 * GV-2 (N58, mockup v22 G1 / G2b): dòng 2 của khối Phụ trách · Hạn · Theo dõi (`khoi` — hai ô lưới: giá trị · nút "Sửa hạn"); việc không hạn → "Chưa có hạn" · "Đặt hạn".
 */
export function DongHan({ han, hanMacDinh, hanChon, xong, suaDuoc, onLuu, onTaiLai, gon, khoi }: {
  /** Hạn hiệu lực (`YYYY-MM-DD`); null = việc không hạn (GV-2: đặt hạn được). */
  han: string | null;
  /** null = việc không có hạn theo luật (Meeting, việc không hạn) — không "mặc định", không "Về mặc định". */
  hanMacDinh: string | null;
  hanChon: string | null;
  /** Việc đã xong / đã bỏ — chỉ hiện ngày, không đếm ngày, không Sửa hạn. */
  xong?: boolean;
  suaDuoc: boolean;
  /** `han` null = về mặc định; `hanCu` = hạn chọn đang thấy (máy chủ so để báo 409). */
  onLuu: (han: string | null, hanCu: string | null) => Promise<void>;
  onTaiLai: () => void;
  /** Trong dòng việc (Phối hợp SOS): không nhãn "Hạn", chữ nhỏ. */
  gon?: boolean;
  /** GV-2: trong khối ba dòng (`KhoiGiaoViec`) — trả hai ô lưới (giá trị · nút), sửa thì ô giá trị trải hết hai cột. */
  khoi?: boolean;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  const [sua, setSua] = useState(false);
  const [nhap, setNhap] = useState(han ?? '');
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<{ chu: string; xungDot: boolean } | null>(null);
  /* Bàn phím: mở sửa → focus ô ngày; đóng (Lưu / Huỷ / Esc) → focus lại "Sửa hạn". Lỗi → focus ô ngày. */
  const idO = useId();
  const nutSua = useRef<HTMLButtonElement>(null);
  const daMo = useRef(false);
  useEffect(() => {
    if (sua) document.getElementById(idO)?.focus();
    else if (daMo.current) nutSua.current?.focus();
    daMo.current = sua;
  }, [sua, idO]);

  const luu = async (moi: string | null) => {
    setDang(true); setLoi(null);
    try { await onLuu(moi, hanChon); setSua(false); }
    catch (e: any) { setLoi({ chu: e?.message ?? t('Không lưu được'), xungDot: e instanceof ApiError && e.status === 409 }); document.getElementById(idO)?.focus(); }
    finally { setDang(false); }
  };
  const moSua = () => { setNhap(han ?? hn); setLoi(null); setSua(true); };
  const conNgay = han ? daysBetween(hn, han) : 0;
  /* BADGE-QUA-HAN (chủ SP 15/11): quá hạn badge đỏ · ≤ 3 ngày badge vàng (`BadgeHan`) · xa chữ thường (V22). */
  const tinh = xong || !hn || !han ? null
    : conNgay < 0 ? <BadgeHan muc="qua">{t('quá hạn {n} ngày', { n: -conNgay })}</BadgeHan>
    : conNgay <= HAN_GAN_NGAY ? <BadgeHan muc="gan">{conNgay === 0 ? t('hôm nay') : t('còn {n} ngày', { n: conNgay })}</BadgeHan>
    : <span className="whitespace-nowrap text-xs text-slate-400">{t('còn {n} ngày', { n: conNgay })}</span>;
  /* Mockup v22 G1: "mặc định" là thẻ viền nhỏ trong khối; dòng hạn cũ (Phối hợp) giữ chữ thường. */
  const nguon = !han || (!hanMacDinh && !hanChon) ? null : hanChon && hanMacDinh
    ? <span className="text-xs text-slate-500">{t('đã chỉnh · mặc định {ngay}', { ngay: shortDate(hanMacDinh, hn) })}</span>
    : khoi ? <span className="inline-flex h-5 items-center rounded border px-1.5 text-xs text-dim" style={{ borderColor: 'var(--line-strong)' }}>{t('mặc định')}</span>
      : <span className="text-xs text-slate-500">{t('mặc định')}</span>;

  const giaTri = sua ? (
    /* Esc chỉ đóng ô sửa (giữ panel) — KhungPanel bỏ qua Esc đã `preventDefault`. */
    <span className="flex flex-col gap-2" onKeyDown={(e) => { if (e.key === 'Escape' && !dang) { e.preventDefault(); setSua(false); } }}>
      <span className="flex flex-wrap items-center gap-2">
        <span className="w-[200px] max-sm:w-full"><ONgay kieu="ngay" id={idO} value={nhap} onChange={setNhap} ariaLabel={t('Hạn mới')} /></span>
        <button type="button" className="btn btn-sm btn-primary min-h-[44px] sm:min-h-[36px] max-sm:flex-1" disabled={dang || !nhap || nhap === han} onClick={() => void luu(nhap)}>{dang ? t('Đang lưu…') : t('Lưu hạn')}</button>
        <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-[36px] max-sm:flex-1" disabled={dang} onClick={() => setSua(false)}>{t('Huỷ sửa')}</button>
        {!hanChon && hanMacDinh && <span className="text-xs text-slate-500">{t('mặc định')} {shortDate(hanMacDinh, hn)}</span>}
        {hanChon && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0" disabled={dang}
          onClick={() => void luu(null)}>{hanMacDinh ? t('Về mặc định {ngay}', { ngay: shortDate(hanMacDinh, hn) }) : t('Bỏ hạn')}</button>}
      </span>
      {loi && (
        <span role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-late-line bg-late-bg px-3 py-2 text-sm">
          <b className="text-late">{t('Chưa lưu.')}</b><span className="min-w-0 flex-1 text-slate-200">{loi.chu}{loi.xungDot && ` ${t('Ngày bạn gõ vẫn giữ trong ô.')}`}</span>
          {loi.xungDot && <button type="button" className="link min-h-[44px] appearance-none border-0 bg-transparent p-0 font-semibold sm:min-h-0" onClick={() => { setLoi(null); onTaiLai(); }}>{t('Tải lại')}</button>}
        </span>
      )}
    </span>
  ) : (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {han ? <b className={`tabular-nums text-slate-100 ${gon ? 'text-sm' : khoi ? 'text-[15px]' : 'text-base'}`}>{shortDate(han, hn)}</b>
        : <span className="text-sm text-faint">{t('Chưa có hạn')}</span>}
      {tinh && <span className="text-[13px] tabular-nums">{tinh}</span>}
      {!xong && nguon}
      {suaDuoc && !xong && !khoi && <button ref={nutSua} type="button" className={`link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0 ${gon ? '' : 'ml-auto'}`} onClick={moSua}>{t('Sửa hạn')}</button>}
    </span>
  );
  if (gon) return giaTri;
  if (khoi) {
    const o = 'flex min-h-[46px] min-w-0 items-center border-t px-3 py-[7px] max-sm:min-h-[52px] max-sm:px-2.5';
    return sua ? <div className={`${o} col-span-2`} style={{ borderColor: 'var(--line)' }}>{giaTri}</div> : <>
      <div className={o} style={{ borderColor: 'var(--line)' }}>{giaTri}</div>
      <div className={`${o} justify-end pl-0`} style={{ borderColor: 'var(--line)' }}>
        {suaDuoc && !xong && <button ref={nutSua} type="button" className="btn btn-sm min-h-[44px] sm:min-h-[30px]" onClick={moSua}>{han ? t('Sửa hạn') : t('Đặt hạn')}</button>}
      </div>
    </>;
  }
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-x-3 border-b pb-3 max-sm:grid-cols-1 max-sm:gap-y-1.5" style={{ borderColor: 'var(--line)' }}>
      <span className="text-[13px] font-medium text-slate-400">{t('Hạn')}</span>
      {giaTri}
    </div>
  );
}
