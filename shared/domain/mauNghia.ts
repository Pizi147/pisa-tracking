/**
 * MÀU NGHĨA — luật thuần cho phép kiểm tương phản (PR-UX0, N-1).
 *
 * Token màu khai báo MỘT CHỖ ở `web/src/index.css :root`. Ở đây chỉ có phần kiểm được:
 * đọc token từ chính file CSS đó, tính độ tương phản WCAG 2.x. Không phụ thuộc React.
 */

export type RGB = [number, number, number];

/**
 * Đọc mọi token màu tĩnh trong một đoạn CSS: `--x-rgb: 12 34 56;` → `x-rgb`, `--x: #rrggbb;` → `x`.
 * Bí danh (`--dat-rgb: var(--ok-rgb)`, `--ok: rgb(var(--ok-rgb))`) được giải ra qua `var()` một cấp.
 */
export function docMauCss(css: string): Record<string, RGB> {
  const tho: Record<string, string> = {};
  for (const m of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) tho[m[1]] = m[2].trim();
  const giai = (ten: string, sau = 0): RGB | null => {
    const v = tho[ten];
    if (v === undefined || sau > 4) return null;
    const bien = /^var\(--([a-z0-9-]+)\)$/i.exec(v);
    if (bien) return giai(bien[1], sau + 1);
    const ba = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/.exec(v);
    if (ba && ten.endsWith('-rgb')) return [Number(ba[1]), Number(ba[2]), Number(ba[3])];
    const hex = /^#([0-9a-f]{6})$/i.exec(v);
    if (hex) return hexRgb(`#${hex[1]}`);
    return null;
  };
  const out: Record<string, RGB> = {};
  for (const ten of Object.keys(tho)) {
    const c = giai(ten);
    if (c) out[ten] = c;
  }
  return out;
}

function hexRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Độ sáng tương đối theo WCAG 2.x. */
export function doSang([r, g, b]: RGB): number {
  const k = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
}

/** Tỉ số tương phản của hai màu (`[r,g,b]` hoặc `#rrggbb`), làm tròn 2 chữ số. */
export function tuongPhan(a: RGB | string, b: RGB | string): number {
  const x = doSang(typeof a === 'string' ? hexRgb(a) : a);
  const y = doSang(typeof b === 'string' ? hexRgb(b) : b);
  const [hi, lo] = x >= y ? [x, y] : [y, x];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Thân khối CSS ĐẦU TIÊN có đúng bộ chọn (`:root` không khớp `:root[data-theme="light"]`); không có thì ''. */
export function docKhoiCss(css: string, boChon: string): string {
  const goc = boChon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|[\\s}])${goc}\\s*\\{`).exec(css);
  if (!m) return '';
  const dau = m.index + m[0].length;
  return css.slice(dau, css.indexOf('}', dau));
}

/**
 * Bảng token hai chế độ. Sáng = khối `:root` ghi đè bởi khối sáng, giải bí danh SAU khi ghi đè
 * (`--dat-rgb: var(--ok-rgb)` ở `:root` tự theo `--ok-rgb` sáng).
 */
export function docMauHaiCheDo(css: string): { toi: Record<string, RGB>; sang: Record<string, RGB> } {
  const goc = docKhoiCss(css, ':root');
  return { toi: docMauCss(goc), sang: docMauCss(`${goc}\n${docKhoiCss(css, ':root[data-theme="light"]')}`) };
}

/** Khoá `localStorage` nhớ chế độ giao diện theo máy (PR-SANG, T15). */
export const CHE_DO_KHOA = 'pisa-giao-dien';

/** OV-15a (C11): lựa chọn giao diện lưu theo máy — 'light' / 'dark' do người dùng chọn; thiếu, lạ, hỏng → 'may' (theo máy). */
export type LuaChonGiaoDien = 'may' | 'light' | 'dark';
export function docLuaChonGiaoDien(v: unknown): LuaChonGiaoDien {
  return v === 'light' || v === 'dark' ? v : 'may';
}
/** Chế độ vẽ thật: chọn tay thắng; "Theo máy" đi theo `prefers-color-scheme` (`mayToi` = máy đang tối). */
export function cheDoThuc(chon: LuaChonGiaoDien, mayToi: boolean): 'dark' | 'light' {
  return chon === 'may' ? (mayToi ? 'dark' : 'light') : chon;
}
