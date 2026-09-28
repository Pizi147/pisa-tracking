import { useEffect, useRef, useState } from 'react';
import { docONgay, hienONgay, phuONgay, type KieuONgay, type LuatONgay } from '@shared/domain/index.ts';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';
import { LichNho } from './LichNho.tsx';

/**
 * Ô NGÀY THỐNG NHẤT (T11, YC-9, HE §9) — một ô cho mọi ngày/tuần/tháng: gõ `dd/mm/yyyy` (tháng `mm/yyyy`) hoặc bấm biểu tượng
 * lịch mở `LichNho`. Ô hiện chữ người đọc, `value`/`onChange` luôn là ISO (`2026-09-28`, tháng `2026-09`) — thứ máy chủ đọc.
 * Luật khoảng từng chỗ (`toiThieu`/`toiDa`, tuần `moc`/`catHomNay`) đi qua `LuatONgay`; chữ lỗi đến từ `docONgay`.
 * "Hôm nay" là ngày nghiệp vụ (`useNgayNghiepVu`), không đọc đồng hồ trình duyệt.
 */
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
};

export function ONgay({ kieu, value, onChange, toiThieu, toiDa, moc, catHomNay, goiY, disabled, ariaLabel, id, onBlur, invalid }: Props) {
  const { homNay } = useNgayNghiepVu();
  const luat: LuatONgay = { toiThieu, toiDa, moc, catHomNay };
  const [text, setText] = useState(hienONgay(value, kieu));
  const [loi, setLoi] = useState<string | null>(null);
  const [mo, setMo] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  useEffect(() => { setText(hienONgay(value, kieu)); setLoi(null); }, [value, kieu]);
  const chot = () => {
    /* Chữ chưa sửa thì không kiểm lại: giá trị cũ ngoài luật (hạn đã qua) không được báo lỗi khi chỉ Tab qua. */
    if (text === hienONgay(value, kieu)) { setLoi(null); return; }
    const r = docONgay(text, kieu, homNay, luat);
    if (r.iso) { if (r.iso !== value) onChange(r.iso); setText(hienONgay(r.iso, kieu)); }
    /* Xoá chữ: báo '' rồi hiện lại theo `value` — nơi gọi có mặc định (`detectedAt || homNay`) thì ô không trống mà form vẫn gửi
       mặc định; nơi gọi xoá thật thì hiệu ứng đồng bộ `value` đưa chữ về ''. */
    else if (!text.trim() && value) { onChange(''); setText(hienONgay(value, kieu)); }
    setLoi(r.loi);
  };
  const phu = phuONgay(value, kieu, homNay);
  return (
    <span className="block min-w-0">
      <span className="flex min-w-0 items-stretch gap-1.5">
        <input id={id} className="field min-w-0 flex-1 tabular-nums" inputMode="numeric" autoComplete="off" value={text} disabled={disabled}
          placeholder={goiY ?? (kieu === 'thang' ? 'mm/yyyy' : 'dd/mm/yyyy')} aria-label={ariaLabel} aria-invalid={invalid || !!loi || undefined}
          onChange={(e) => setText(e.target.value)} onBlur={() => { chot(); onBlur?.(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); chot(); } else if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); setMo(true); } }} />
        <button ref={nut} type="button" className="btn flex-none min-h-[44px] min-w-[44px] justify-center px-0 sm:min-h-0 sm:min-w-[36px]"
          aria-label={kieu === 'thang' ? 'Mở lịch tháng' : 'Mở lịch'} aria-haspopup="dialog" aria-expanded={mo} disabled={disabled}
          onClick={() => setMo((v) => !v)}><BieuTuongLich /></button>
      </span>
      {phu && <span className="mt-1 block truncate text-[11.5px] tabular-nums text-slate-400">{phu}</span>}
      {loi && <span className="mt-1 block text-[11px] text-late" role="alert">{loi}</span>}
      {mo && <LichNho kieu={kieu} value={value || null} homNay={homNay} luat={luat} neo={nut}
        onChon={(iso) => { if (iso !== value) onChange(iso); setText(hienONgay(iso, kieu)); setLoi(null); setMo(false); nut.current?.focus(); }} onDong={() => setMo(false)} />}
    </span>
  );
}

/** Biểu tượng lịch nét mảnh 14 px (không emoji — luật "dấu nhỏ gọn"). */
function BieuTuongLich() {
  return <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" /></svg>;
}
