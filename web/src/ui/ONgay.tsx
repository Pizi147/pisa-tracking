import { Children, createContext, isValidElement, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { canDongBoONgay, chotONgay, hienONgay, phuONgay, type KieuONgay, type LuatONgay } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { LichNho } from './LichNho.tsx';
import { t } from '@shared/i18n/index.ts';

/**
 * Ô NGÀY THỐNG NHẤT (T11, YC-9, HE §9) — một ô cho mọi ngày/tuần/tháng: gõ `dd/mm/yyyy` (tháng `mm/yyyy`) hoặc bấm biểu tượng
 * lịch mở `LichNho`. Ô hiện chữ người đọc, `value`/`onChange` luôn là ISO (`2026-09-28`, tháng `2026-09`) — thứ máy chủ đọc.
 * Luật khoảng từng chỗ (`toiThieu`/`toiDa`, tuần `moc`/`catHomNay`) đi qua `LuatONgay`; chữ lỗi đến từ `docONgay`.
 * "Hôm nay" là ngày nghiệp vụ (`useNgayNghiepVu`), không đọc đồng hồ trình duyệt.
 */
/**
 * `Truong`/`Field` báo cho ô ngày biết nó nằm dưới một nhãn: ô báo lại `id` của ô gõ, nhãn đổi từ `<label>` BỌC (bọc luôn nút lịch,
 * dòng phụ, dòng lỗi — HTML sai, tên truy cập lẫn "Mở lịch") sang `<div>` + `<label htmlFor>`. Nơi gọi không phải sửa gì.
 */
export const BaoOTrongNhan = createContext<((id: string | null) => void) | null>(null);
/**
 * Ô tự vẽ nhãn riêng (ô ngày, ô chọn người — gắn `tuNhan = true`) nằm TRỰC TIẾP dưới `Truong`/`Field` → khung là `<div>` ngay từ lần
 * vẽ đầu. Thẻ khung quyết từ props, không từ id ô báo lên: đổi thẻ sau khi vẽ làm React dựng lại ô (hiệu ứng chạy hai lần).
 */
export const coOTuNhan = (children: ReactNode) =>
  Children.toArray(children).some((c) => isValidElement(c) && !!(c.type as { tuNhan?: boolean }).tuNhan);

type Props = {
  kieu: KieuONgay;
  value: string | null;
  onChange: (iso: string) => void;
  toiThieu?: string | null;
  toiDa?: string | null;
  moc?: 'dau' | 'cuoi';
  catHomNay?: boolean;
  /** Chữ mờ trong ô trống (mặc định `dd/mm/yyyy` / `mm/yyyy`). */
  goiY?: string;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  onBlur?: () => void;
  invalid?: boolean;
  /** Trong lưới (Thêm học viên): không vẽ dòng phụ tuần và dòng lỗi dưới ô — hàng cao đều; hai dòng đó vào `title` của ô gõ. */
  gon?: boolean;
  /** V8-PT (mockup `.o-tuan`): nút lịch nằm TRONG ô (mép phải), ô cao 36 chữ 14 — hàng lọc Phân tích. */
  nutTrong?: boolean;
  /** `gon`: id dòng lỗi người gọi vẽ dưới ô (lưới) — nối vào `aria-describedby` (D11). */
  moTa?: string;
};

export function ONgay({ kieu, value, onChange, toiThieu, toiDa, moc, catHomNay, goiY, disabled, ariaLabel, id, onBlur, invalid, gon, moTa, nutTrong }: Props) {
  const { homNay } = useNgayNghiepVu();
  const luat: LuatONgay = { toiThieu, toiDa, moc, catHomNay };
  const [text, setText] = useState(hienONgay(value, kieu, homNay));
  const [loi, setLoi] = useState<string | null>(null);
  const [mo, setMo] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const idTu = useId();
  const idO = id ?? idTu;
  const bao = useContext(BaoOTrongNhan);
  useLayoutEffect(() => { bao?.(idO); return () => bao?.(null); }, [bao, idO]);
  /* Chỉ `value`/`kieu` đổi mới chạy; đọc `text` lúc đó để không xoá chữ gõ sai sau khi chính ô báo '' (chotONgay). */
  useEffect(() => {
    if (canDongBoONgay(text, value, kieu, homNay, luat)) { setText(hienONgay(value, kieu, homNay)); setLoi(null); }
  }, [value, kieu]); // eslint-disable-line react-hooks/exhaustive-deps
  const chot = () => {
    const c = chotONgay(text, value, kieu, homNay, luat);
    if (c.phat !== null) onChange(c.phat);
    setText(c.text); setLoi(c.loi);
  };
  const phu = phuONgay(value, kieu, homNay);
  return (
    <span className="block min-w-0">
      <span className={`flex min-w-0 items-stretch ${nutTrong ? 'relative' : 'gap-1.5'}`}>
        <input id={idO} className={`field min-w-0 flex-1 tabular-nums${gon && (invalid || loi) ? ' border-late' : ''}${nutTrong ? ' h-9 !py-0 pr-10 text-sm font-medium max-sm:h-11' : ''}`}
          title={gon ? [phu, loi].filter(Boolean).join(' · ') || undefined : undefined} inputMode={kieu === 'tuan' ? 'text' : 'numeric'} autoComplete="off" value={text} disabled={disabled}
          placeholder={goiY ?? (kieu === 'thang' ? 'mm/yyyy' : kieu === 'tuan' ? t('W4 SEP hoặc dd/mm') : 'dd/mm/yyyy')} aria-label={ariaLabel} aria-invalid={invalid || !!loi || undefined}
          aria-describedby={gon ? moTa : [phu && `${idO}-phu`, loi && `${idO}-loi`].filter(Boolean).join(' ') || undefined}
          onChange={(e) => setText(e.target.value)} onBlur={() => { chot(); onBlur?.(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); chot(); } else if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); setMo(true); } }} />
        <button ref={nut} type="button" className={nutTrong
          ? 'absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center border-0 bg-transparent text-[color:var(--text-dim)] max-sm:w-11'
          : 'btn flex-none min-h-[44px] min-w-[44px] justify-center px-0 sm:min-h-0 sm:min-w-[36px]'}
          aria-label={kieu === 'thang' ? t('Mở lịch tháng') : t('Mở lịch')} aria-haspopup="dialog" aria-expanded={mo} disabled={disabled}
          onClick={() => setMo((v) => !v)}><BieuTuongLich /></button>
      </span>
      {phu && !gon && <span id={`${idO}-phu`} className="mt-1 block truncate text-[12px] tabular-nums text-slate-400">{phu}</span>}
      {loi && !gon && <span id={`${idO}-loi`} className="mt-1 block text-xs text-late" role="alert">{loi}</span>}
      {mo && <LichNho kieu={kieu} value={value || null} homNay={homNay} luat={luat} neo={nut}
        onChon={(iso) => { if (iso !== value) onChange(iso); setText(hienONgay(iso, kieu, homNay)); setLoi(null); setMo(false); nut.current?.focus(); }} onDong={() => setMo(false)} />}
    </span>
  );
}
ONgay.tuNhan = true;

/** Biểu tượng lịch nét mảnh 14 px (không emoji — luật "dấu nhỏ gọn"). */
function BieuTuongLich() {
  return <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" /></svg>;
}
