import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../lib/api.ts';
import { ONgay } from './ONgay.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { HAN_GAN_NGAY, daysBetween, mucHan, shortDate } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';
import { BadgeHan, DauQuaHan, LOP_MUC_HAN, NhanChoGv } from './Nhan.tsx';

/**
 * DÒNG HẠN + SỬA HẠN TẠI CHỖ (HAN-BAO-PH, chủ SP 03/11 N34; mockup `thiet-ke/audit-0311/u10-y-thuc.html` K5 · K8) — dùng chung việc Báo PH và Meeting CX.
 * Xem: "10/11 · còn 7 ngày · đã chỉnh · mặc định 07/11 · Sửa hạn". Sửa: ô ngày (gõ + lịch) · Lưu hạn · Huỷ · Về mặc định — lưu RIÊNG, không lý do,
 * không trần; ngày đã qua vẫn nhận (hiện quá hạn). 409 (người khác vừa sửa): ngày đang gõ giữ trong ô + Tải lại. Quyền kiểm ở máy chủ (`suaHanBaoPh`, `suaHanPhoiHop`).
 * GV-2 (N58, mockup v22 G1 / G2b): cụm Hạn của khối Phụ trách · Hạn · Theo dõi (`khoi` — nơi gọi dựng cụm từ giá trị · nút "Sửa hạn"); việc không hạn → "Chưa có hạn" · "Đặt hạn".
 * NHẸ HƠN PR-2b (v23 `.pht1`, luật hạn): trong khối chỉ ngày dd/mm/yyyy tô theo `mucHan` (+ ⚠ khi quá hạn) — không "quá hạn / còn n ngày" (chỉ ở đầu panel), không thẻ "mặc định" trần.
 */
export function DongHan({ han, hanMacDinh, hanChon, xong, suaDuoc: suaDuocGoc, onLuu, onTaiLai, gon, khoi, tamDung, tinhLai }: {
  /** TL-1 / GV-2: hạn đang tạm dừng (Báo PH "Chờ GV sửa", cờ máy chủ) — không đếm ngày / không tô quá hạn. */
  tamDung?: boolean;
  /** TL-2 (mockup v22 T6b): hạn đang có do MÁY tính lại sau khi GV gửi lại — ghi "tính lại sau khi GV gửi lại" thay "đã chỉnh". */
  tinhLai?: boolean;
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
  /** GV-2 / PR-2b: trong khối `KhoiGiaoViec` — nơi gọi dựng cụm từ (giá trị, nút); `sua` = đang sửa (cụm trải hết hàng). */
  khoi?: (giaTri: ReactNode, nut: ReactNode, sua: boolean) => ReactNode;
}) {
  const { homNay } = useNgayNghiepVu();
  const hn = homNay ?? '';
  /* TL-2 (mockup v22 T3a): hạn đang tạm dừng (chờ GV sửa) — không Sửa hạn; GV gửi lại / TVV rút thì sửa lại được. */
  const suaDuoc = suaDuocGoc && !tamDung;
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
  const tinh = tamDung && !xong ? <NhanChoGv>{t('tạm dừng')}</NhanChoGv>
    : xong || !hn || !han || khoi ? null
    : conNgay < 0 ? <BadgeHan muc="qua">{t('quá hạn {n} ngày', { n: -conNgay })}</BadgeHan>
    : conNgay <= HAN_GAN_NGAY ? <BadgeHan muc="gan">{conNgay === 0 ? t('hôm nay') : t('còn {n} ngày', { n: conNgay })}</BadgeHan>
    : <span className="whitespace-nowrap text-xs text-slate-400">{t('còn {n} ngày', { n: conNgay })}</span>;
  /* Mockup v22 G1: "mặc định" là thẻ viền nhỏ trong khối; dòng hạn cũ (Phối hợp) giữ chữ thường. */
  const nguon = tamDung ? null : tinhLai && hanChon ? <span className="text-xs text-slate-500">{t('tính lại sau khi GV gửi lại')}</span>
    : !han || (!hanMacDinh && !hanChon) ? null : hanChon && hanMacDinh && khoi
    ? <span className="whitespace-nowrap text-xs text-slate-500" title={t('đã chỉnh · mặc định {ngay}', { ngay: shortDate(hanMacDinh, hn) })}>{t('đã chỉnh')}</span>
    : hanChon && hanMacDinh
    ? <span className="text-xs text-slate-500">{t('đã chỉnh · mặc định {ngay}', { ngay: shortDate(hanMacDinh, hn) })}</span>
    : khoi ? null
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
      {han && khoi ? (() => {
        /* PR-2b: màu theo `mucHan` (PR-1) — việc đã xong / tạm dừng không tô. */
        const muc = xong || tamDung || !hn ? 'xa' : mucHan(han, hn);
        return <span className={`whitespace-nowrap text-sm tabular-nums ${LOP_MUC_HAN[muc]}`}>{muc === 'qua' && <DauQuaHan />}{shortDate(han, hn)}</span>;
      })()
        : han ? <b className={`tabular-nums text-slate-100 ${gon ? 'text-sm' : 'text-base'}`}>{shortDate(han, hn)}</b>
        : <span className="text-sm text-faint">{t('Chưa có hạn')}</span>}
      {tinh && <span className="text-[13px] tabular-nums">{tinh}</span>}
      {!xong && nguon}
      {suaDuoc && !xong && !khoi && <button ref={nutSua} type="button" className={`link min-h-[44px] appearance-none border-0 bg-transparent p-0 text-sm font-semibold sm:min-h-0 ${gon ? '' : 'ml-auto'}`} onClick={moSua}>{t('Sửa hạn')}</button>}
    </span>
  );
  if (gon) return giaTri;
  if (khoi) return khoi(giaTri, sua || !suaDuoc || xong ? null
    : <button ref={nutSua} type="button" className="btn btn-sm min-h-[44px] sm:h-[28px] sm:min-h-[28px]" onClick={moSua}>
      {/* v23 P3: 375 ghi "Sửa" (cột nút hẹp) — tên đọc vẫn đủ "Sửa hạn". */}
      {han ? <><span className="sm:hidden" aria-hidden>{t('Sửa')}</span><span className="max-sm:sr-only">{t('Sửa hạn')}</span></> : t('Đặt hạn')}</button>, sua);
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-x-3 border-b pb-3 max-sm:grid-cols-1 max-sm:gap-y-1.5" style={{ borderColor: 'var(--line)' }}>
      <span className="text-[13px] font-medium text-slate-400">{t('Hạn')}</span>
      {giaTri}
    </div>
  );
}
