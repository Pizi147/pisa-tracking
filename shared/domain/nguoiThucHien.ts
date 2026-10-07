/**
 * NGƯỜI THỰC HIỆN — MỘT kiểu chọn dùng chung cho mọi ô "Người thực hiện" / "Phụ trách" (PR-Form, F-2).
 *
 * Trước PR-Form mỗi ô tự làm theo cách riêng: có ô ghi tên tự do (`performerName`), có ô ngầm định
 * "bỏ trống = chính người ghi" mà không lưu ai. Nay một ô chọn — `ChonNguoi` (`web/src/ui/PeoplePicker.tsx`) —
 * dùng chung một kiểu dữ liệu và một luật đổi ra payload, để máy chủ chỉ phải kiểm ở MỘT chỗ
 * (`server/src/cases/nguoiThucHien.ts`).
 */

import { chuanTieuDe } from './nhapHocVien.ts';

/** Lọc danh sách người CÓ SẴN của ô `ChonNguoi` kiểu `ds` (phân công GV, học viên của lớp) theo chữ gõ — không dấu, giữ thứ tự. */
export function locNguoiChon<T extends { ten: string }>(ds: readonly T[], go: string): T[] {
  const q = chuanTieuDe(go);
  return q ? ds.filter((x) => chuanTieuDe(x.ten).includes(q)) : [...ds];
}

/** Rời ô gõ mà chưa chọn: chữ gõ khớp ĐÚNG MỘT người → người đó; còn lại → null (xoá chữ gõ, không chọn bừa). */
export function chotChuGo<T>(go: string, khop: readonly T[]): T | null {
  return go.trim() && khop.length === 1 ? khop[0] : null;
}

/** Nhóm người hợp lệ cho một ô chọn: PA học thuật chỉ nhận giáo viên, Ý thức nhận cả giáo viên lẫn quản lý. */
export const NHOM_NGUOI = ['giao_vien', 'nhan_vien'] as const;
export type NhomNguoi = (typeof NHOM_NGUOI)[number];

export type NguoiChon =
  | { kieu: 'toi' }
  | { kieu: 'tai_khoan'; id: number; ten: string; phu?: string }
  | { kieu: 'ngoai'; ten: string };

/** Payload gửi máy chủ cho PA HỌC THUẬT — cột `performer_user_id` / `performer_name`. */
export function nguoiThanhPayload(v: NguoiChon | null): {
  performerSelf?: true; performerUserId?: number; performerName?: string;
} {
  if (!v) return {};
  if (v.kieu === 'toi') return { performerSelf: true };
  if (v.kieu === 'tai_khoan') return { performerUserId: v.id };
  return { performerName: v.ten.trim() };
}

/**
 * Payload gửi máy chủ cho Ý THỨC — cột `performed_by` / `performer_name`.
 *
 * `toi` gửi KHÔNG GÌ CẢ: máy chủ tự lấy người đang đăng nhập khi thiếu người (K2-6d) — khác PA
 * học thuật, nơi `performerSelf: true` là một lựa chọn tường minh.
 */
export function nguoiThanhPayloadYThuc(v: NguoiChon | null): { performedBy?: number; performerName?: string } {
  if (!v || v.kieu === 'toi') return {};
  if (v.kieu === 'tai_khoan') return { performedBy: v.id };
  return { performerName: v.ten.trim() };
}

/** Câu báo thiếu gì, hoặc `null` nếu đã đủ. */
export function nguoiThieu(v: NguoiChon | null, batBuoc: boolean): string | null {
  if (!v) return batBuoc ? 'Chọn người thực hiện.' : null;
  if (v.kieu === 'ngoai' && v.ten.trim().length < 2) return 'Gõ tên ngoài hệ thống (ít nhất 2 ký tự).';
  return null;
}
