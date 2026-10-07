import { useState } from 'react';
import { CHE_DO_KHOA, docCheDo } from '@shared/domain/index.ts';

/** Chế độ sáng/tối hiện tại + hàm đặt (lưu theo máy). Mỗi chỗ vẽ công tắc tự đọc `<html data-theme>` lúc mở nên không lệch nhau. */
function useCheDo() {
  const [sang, setSang] = useState(() => docCheDo(document.documentElement.dataset.theme) === 'light');
  const dat = (moi: boolean) => {
    if (moi) document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(CHE_DO_KHOA, moi ? 'light' : 'dark'); } catch { /* không lưu được thì thôi — lần sau về Tối */ }
    setSang(moi);
  };
  return [sang, dat] as const;
}

/**
 * NÚT ◐ ĐỔI TỐI ↔ SÁNG (T15, M12) — thanh đầu, giữa Thông báo và tên tài khoản. Mặc định Tối; nhớ THEO MÁY (`localStorage`,
 * bọc try/catch — chặn lưu trữ thì vẫn đổi được trong phiên, lần sau về Tối). Chế độ sáng = `data-theme="light"` trên `<html>`
 * (tối = không thuộc tính); script nội dòng ở `index.html` đặt nó TRƯỚC khi vẽ nên không nháy tối. Không hiệu ứng chuyển màu (§7.1).
 * `kieu="menu"` (PR-HK2, Q2 = A): điện thoại < 640 px — hàng "Giao diện · Tối | Sáng" trong menu Tài khoản thay cho nút trên thanh.
 */
export function CongTacGiaoDien({ kieu = 'nut' }: { kieu?: 'nut' | 'menu' }) {
  const [sang, dat] = useCheDo();
  if (kieu === 'menu') {
    return (
      <div className="flex min-h-[44px] items-center justify-between gap-3 px-1">
        <span className="text-sm text-slate-300" id="nhan-giao-dien">Giao diện</span>
        <div role="group" aria-labelledby="nhan-giao-dien" className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
          {([[false, 'Tối'], [true, 'Sáng']] as const).map(([la, ten]) => (
            <button key={ten} type="button" aria-pressed={sang === la} onClick={() => dat(la)}
              className={`min-h-[44px] min-w-[64px] border-0 px-4 text-[12.5px] ${sang === la ? 'bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent)]' : 'bg-transparent text-slate-300'}`}>{ten}</button>
          ))}
        </div>
      </div>
    );
  }
  const nhan = sang ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng';
  return (
    <button type="button" className="btn btn-sm justify-center" onClick={() => dat(!sang)}
      aria-label={nhan} title={nhan} aria-pressed={sang}>
      {/* ◐ vẽ bằng SVG 14 px nét 1.5 (ký tự ◐ của phông quá nhỏ, dễ thành dấu chấm): vòng + nửa trái tô đặc. */}
      <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" /><path d="M8 2a6 6 0 0 0 0 12Z" fill="currentColor" />
      </svg>
    </button>
  );
}
