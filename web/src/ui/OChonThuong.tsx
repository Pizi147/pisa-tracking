import type { SelectHTMLAttributes } from 'react';

/** Ô CHỌN THƯỜNG (⑤ A6, `.o-chon`) — danh sách ngắn cố định (≤ 7–8 mục, không phải người / lớp): ô chọn gốc (bàn phím, đọc màn hình) dáng ô nhập cao 36, chữ 14, mũi tên nét mảnh; `dangLoc` = viền nhấn khi đang lọc. */
export function OChonThuong({ className = '', dangLoc = false, children, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { dangLoc?: boolean }) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <select {...p} className={`h-9 w-full cursor-pointer appearance-none rounded-lg border bg-[color:var(--o-nhap-nen)] pl-3 pr-8 text-sm text-[color:var(--text)] max-sm:h-11 ${
        dangLoc ? 'border-[color:var(--accent)] font-bold shadow-[inset_0_0_0_1px_var(--accent)]' : 'border-[color:var(--o-nhap-vien)] font-medium'}`}>{children}</select>
      <svg aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1l4 4 4-4" /></svg>
    </span>
  );
}
