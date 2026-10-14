import { t } from '../i18n/index.ts';
/**
 * NGỮ PHÁP TRẠNG THÁI §7.3 — một dòng một nhãn; màu điểm/SOS không mượn.
 * Sáu nhãn dùng chung cho việc, Case, phối hợp: Cần làm · Đang làm · Chờ duyệt · Quá hạn · Xong · Đã huỷ.
 */
export const TRANG_THAI = ['can-lam', 'dang-lam', 'cho-duyet', 'qua-han', 'xong', 'da-huy'] as const;
export type TrangThai = (typeof TRANG_THAI)[number];

/**
 * MỘT BẢNG TRẠNG THÁI → TONE (UX-G G2; PR-GVb U01 chuyển từ `web/src/ui/Nhan.tsx` sang shared): cùng một trạng thái thì cùng một màu ở mọi
 * chỗ — `Nhan` (web) và luật badge lớp (`badgeLop`) cùng đọc. `wait` (tím) = đang chờ một người làm: chờ chấm, chờ duyệt.
 */
export const TONE_TRANG_THAI = { 'cho-cham': 'wait', 'cho-duyet': 'wait' } as const;
/** Bản cho tone badge lớp (`'danger'|'warn'|'info'|'wait'|'muted'`) — hai bảng hiện trùng giá trị, giữ hai tên để mỗi phía đọc đúng kiểu. */
export const TONE_BADGE_TRANG_THAI = TONE_TRANG_THAI;

/** Có chữ ký chỉ mục `string` để chỗ gọi đọc được bằng mã trạng thái thô (mã lạ → `undefined` lúc chạy). */
export const NHAN_TRANG_THAI: Readonly<Record<TrangThai, string>> & Readonly<Record<string, string>> = {
  'can-lam': t('Cần làm'),
  'dang-lam': t('Đang làm'),
  'cho-duyet': t('Chờ duyệt'),
  'qua-han': t('Quá hạn'),
  xong: t('Xong'),
  'da-huy': t('Đã huỷ'),
};

/** Chữ hiện của nhãn; "Quá hạn" kèm số ngày khi biết (`Quá hạn · 2 ngày`). */
export function chuTrangThai(tt: TrangThai, soNgayQuaHan?: number | null): string {
  if (tt === 'qua-han' && soNgayQuaHan && soNgayQuaHan > 0) return t('Quá hạn · {n} ngày', { n: soNgayQuaHan });
  return NHAN_TRANG_THAI[tt];
}

/** Trạng thái việc phối hợp SOS (`pending` | `done` | `removed`) → nhãn chung. */
export function trangThaiPhoiHop(status: string | null | undefined): TrangThai {
  if (status === 'done') return 'xong';
  if (status === 'removed') return 'da-huy';
  return 'can-lam';
}

/** Trạng thái Case (đóng/huỷ/mở/chưa xử lý/chưa có kế hoạch/đang xử lý) → nhãn chung. `chua_xu_ly`: Case từ SOS chưa đủ nguyên nhân (N1 Q28-5). */
export function trangThaiCaseDong(state: string | null | undefined): TrangThai {
  if (state === 'done' || state === 'closed') return 'xong';
  if (state === 'dismissed' || state === 'cancelled') return 'da-huy';
  if (!state || state === 'open' || state === 'chua_xu_ly' || state === 'no_plan') return 'can-lam';
  return 'dang-lam';
}
