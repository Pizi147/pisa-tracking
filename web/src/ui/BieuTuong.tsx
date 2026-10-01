/**
 * BIỂU TƯỢNG SVG 12 px dùng chung (PR-VAI-b) — ký tự nhỏ của Inter (▾ ▸ ✓ ⚠) ở cỡ 11–12 px chỉ còn như một dấu chấm, nên vẽ SVG.
 * Nét theo `currentColor`: màu đi theo chữ bao quanh.
 */
type P = { className?: string; size?: number };
const khung = ({ className = '', size = 12 }: P) => ({
  'aria-hidden': true, viewBox: '0 0 12 12', width: size, height: size, className: `inline-block shrink-0 align-[-2px] ${className}`,
});

/** ⚠ — chỉ nghĩa QUÁ HẠN (G-4). */
export function IconCanhBao(p: P) {
  return (
    <svg {...khung(p)}>
      <path d="M6 1.7 10.9 10.2H1.1z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 5v2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="6" cy="8.7" r=".75" fill="currentColor" />
    </svg>
  );
}

/** Mũi tên gập/mở xuống (mở thì lật lên). */
export function IconGap({ mo, ...p }: P & { mo: boolean }) {
  return (
    <svg {...khung(p)} className={`${khung(p).className} transition-transform ${mo ? 'rotate-180' : ''}`}>
      <path d="M3 4.6 6 7.6 9 4.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** ✓ đạt. */
export function IconDat(p: P) {
  return (
    <svg {...khung(p)}>
      <path d="M2.4 6.3 5 8.7 9.7 3.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** ‖ tạm dừng. */
export function IconTamDung(p: P) {
  return (
    <svg {...khung(p)}>
      <rect x="3" y="2.5" width="2" height="7" rx=".6" fill="currentColor" />
      <rect x="7" y="2.5" width="2" height="7" rx=".6" fill="currentColor" />
    </svg>
  );
}
