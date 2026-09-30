import { useState } from 'react';
import { CHE_DO_KHOA, docCheDo } from '@shared/domain/index.ts';

/**
 * NÚT ◐ ĐỔI TỐI ↔ SÁNG (T15, M12) — thanh đầu, giữa Thông báo và tên tài khoản. Mặc định Tối; nhớ THEO MÁY (`localStorage`,
 * bọc try/catch — chặn lưu trữ thì vẫn đổi được trong phiên, lần sau về Tối). Chế độ sáng = `data-theme="light"` trên `<html>`
 * (tối = không thuộc tính); script nội dòng ở `index.html` đặt nó TRƯỚC khi vẽ nên không nháy tối. Không hiệu ứng chuyển màu (§7.1).
 */
export function CongTacGiaoDien() {
  const [sang, setSang] = useState(() => docCheDo(document.documentElement.dataset.theme) === 'light');
  const doi = () => {
    const moi = !sang;
    if (moi) document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(CHE_DO_KHOA, moi ? 'light' : 'dark'); } catch { /* không lưu được thì thôi — lần sau về Tối */ }
    setSang(moi);
  };
  const nhan = sang ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng';
  return (
    <button type="button" className="btn btn-sm justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0" onClick={doi}
      aria-label={nhan} title={nhan} aria-pressed={sang}>
      {/* ◐ vẽ bằng SVG 14 px nét 1.5 (ký tự ◐ của phông quá nhỏ, dễ thành dấu chấm): vòng + nửa trái tô đặc. */}
      <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" /><path d="M8 2a6 6 0 0 0 0 12Z" fill="currentColor" />
      </svg>
    </button>
  );
}
