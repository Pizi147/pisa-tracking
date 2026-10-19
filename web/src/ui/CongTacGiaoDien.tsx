import { useState } from 'react';
import { CHE_DO_KHOA, cheDoThuc, docLuaChonGiaoDien, type LuaChonGiaoDien } from '@shared/domain/index.ts';
import { t } from '@shared/i18n/index.ts';

const mayToi = () => !window.matchMedia?.('(prefers-color-scheme: light)').matches;
const docLuu = (): LuaChonGiaoDien => { try { return docLuaChonGiaoDien(localStorage.getItem(CHE_DO_KHOA)); } catch { return 'may'; } };
/** Sáng = `data-theme="light"` trên `<html>`; tối = không thuộc tính (script nội dòng ở `index.html` đặt lần đầu, không nháy). */
function apDung(chon: LuaChonGiaoDien) {
  if (cheDoThuc(chon, mayToi()) === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
}
/* "Theo máy": máy đổi sáng ↔ tối khi đang mở trang thì đổi theo ngay. */
window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => apDung(docLuu()));

/**
 * GIAO DIỆN · Theo máy | Sáng | Tối (OV-15a, C11 — mockup OV-14 1 §2a) — hàng trong menu Tài khoản, mọi kích thước màn.
 * Mặc định Theo máy (`prefers-color-scheme`); chọn tay thì nhớ THEO MÁY (`localStorage`, bọc try/catch — chặn lưu trữ vẫn đổi được trong phiên).
 * Không hiệu ứng chuyển màu (§7.1).
 */
export function CongTacGiaoDien() {
  const [chon, setChon] = useState<LuaChonGiaoDien>(docLuu);
  const dat = (moi: LuaChonGiaoDien) => {
    try { if (moi === 'may') localStorage.removeItem(CHE_DO_KHOA); else localStorage.setItem(CHE_DO_KHOA, moi); } catch { /* không lưu được thì chỉ đổi trong phiên */ }
    apDung(moi);
    setChon(moi);
  };
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-3 px-1">
      <span className="text-sm text-slate-300" id="nhan-giao-dien">{t('Giao diện')}</span>
      <div role="group" aria-labelledby="nhan-giao-dien" className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
        {([['may', t('Theo máy')], ['light', t('Sáng')], ['dark', t('Tối')]] as const).map(([la, ten]) => (
          <button key={la} type="button" aria-pressed={chon === la} onClick={() => dat(la)}
            className={`min-h-[44px] border-0 px-3 text-[12.5px] sm:min-h-[36px] ${chon === la ? 'bg-[color:var(--accent-soft)] font-semibold text-slate-100 shadow-[inset_0_0_0_2px_var(--accent)]' : 'bg-transparent text-slate-300'}`}>{ten}</button>
        ))}
      </div>
    </div>
  );
}
