import { t } from '@shared/i18n/index.ts';
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

/** ◐ tiến bộ một phần. */
export function IconMotPhan(p: P) {
  return (
    <svg {...khung(p)}>
      <circle cx="6" cy="6" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 1.9a4.1 4.1 0 0 1 0 8.2z" fill="currentColor" />
    </svg>
  );
}

/** ✗ không tiến bộ. */
export function IconKhong(p: P) {
  return <svg {...khung(p)}><path d="M3.4 3.4 8.6 8.6M8.6 3.4 3.4 8.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

/** ▶ đang làm. */
export function IconDangLam(p: P) {
  return <svg {...khung(p)}><path d="M4.2 2.9v6.2L9.1 6z" fill="currentColor" /></svg>;
}

/** ↑ lên lớp. */
export function IconLen(p: P) {
  return (
    <svg {...khung(p)}>
      <path d="M6 10V2.6M2.8 5.6 6 2.4l3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** ⇄ chuyển lớp. */
export function IconChuyenLop(p: P) {
  return (
    <svg {...khung(p)}>
      <path d="M2 4h7.2M7.4 2.2 9.2 4 7.4 5.8M10 8H2.8M4.6 6.2 2.8 8l1.8 1.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** › mũi tên sang phải (giữa hai thẻ chương). */
export function IconSang(p: P) {
  return (
    <svg {...khung(p)}>
      <path d="M4.5 3 7.5 6 4.5 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * KÝ HIỆU KẾT QUẢ ĐIỂM (OV-15a, C05 + mục 6 chủ SP 19/10): ✓ / ✗ nét trơn, không vòng tròn — vượt kỳ vọng ✓ xanh lá · bằng ✓ xanh dương ·
 * dưới ✗ đỏ. Không chữ "thiếu / vượt", không "=". "Chưa đủ điểm" chỉ ghi chữ (không ký hiệu) — chỗ gọi tự xử lý `null`.
 */
export function DauKetQua({ kq, size = 12 }: { kq: 'vuot' | 'bang' | 'duoi'; size?: number }) {
  const ten = kq === 'duoi' ? t('Dưới kỳ vọng') : kq === 'bang' ? t('Bằng kỳ vọng') : t('Vượt kỳ vọng');
  return (
    <span className={`inline-flex ${kq === 'duoi' ? 'text-bad' : kq === 'bang' ? 'text-doing' : 'text-ok'}`} title={ten}>
      {kq === 'duoi' ? <IconKhong size={size} /> : <IconDat size={size} />}<span className="sr-only">{ten}</span>
    </span>
  );
}

/** ▲ trên / ▼ dưới kỳ vọng cạnh band — chỉ ở chỗ KHÔNG có cột kỳ vọng (hộp nhập điểm lẻ); bằng kỳ vọng: không mũi tên. */
export function MuiTenKyVong({ kq }: { kq: 'vuot' | 'bang' | 'duoi' | null }) {
  if (kq !== 'vuot' && kq !== 'duoi') return null;
  const ten = kq === 'duoi' ? t('Dưới kỳ vọng') : t('Vượt kỳ vọng');
  return (
    <span className={`inline-flex ${kq === 'duoi' ? 'text-bad' : 'text-ok'}`} title={ten}>
      <svg {...khung({ size: 10 })}><path d={kq === 'duoi' ? 'M6 10 1.2 2.4h9.6z' : 'M6 2 10.8 9.6H1.2z'} fill="currentColor" /></svg>
      <span className="sr-only">{ten}</span>
    </span>
  );
}
