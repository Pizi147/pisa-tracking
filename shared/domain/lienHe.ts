/**
 * LIÊN HỆ HỌC VIÊN (OV-10b, chủ SP 13/10) — SĐT em · phụ huynh (tên, quan hệ, SĐT). Không bắt buộc, trống = xoá; KHÔNG tính "Thiếu thông tin".
 * Mọi vai xem (dòng Liên hệ đầu hồ sơ HV); chỉ nhập ở Sửa thông tin hồ sơ HV + Sửa thông tin cả lớp; GV không thấy ô nhập.
 * Một phụ huynh / em — cần hai người thì ghi chung ô tên ("Long (bố) / Hoa (mẹ)").
 */
export type LienHe = { phone: string | null; parentName: string | null; parentRelation: string | null; parentPhone: string | null };
export const TRUONG_LIEN_HE = ['phone', 'parentName', 'parentRelation', 'parentPhone'] as const;
export const NHAN_LIEN_HE: Record<(typeof TRUONG_LIEN_HE)[number], string> = {
  phone: 'SĐT em', parentName: 'Tên phụ huynh', parentRelation: 'Quan hệ', parentPhone: 'SĐT phụ huynh',
};
/** Trần ký tự của ô chữ (sau khi bỏ khoảng trắng hai đầu). */
export const LIEN_HE_TOI_DA = { parentName: 100, parentRelation: 30, sdt: 25 } as const;
/** Gợi ý ô Quan hệ — gõ tự do, không danh mục. */
export const QUAN_HE_GOI_Y = ['Bố', 'Mẹ', 'Ông', 'Bà', 'Anh', 'Chị'] as const;

/**
 * SĐT: chỉ chữ số, dấu cách, `+` (đầu số), `.`, `-`; 8–15 chữ số. Trống → null. Lưu như người gõ (gộp dấu cách thừa).
 * Câu lỗi KHÔNG lặp lại số đã gõ (dữ liệu cá nhân không vào log máy chủ).
 */
export function docSoDienThoai(raw: unknown): { sdt: string | null; loi: string | null } {
  const s = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (!s) return { sdt: null, loi: null };
  const so = s.replace(/\D/g, '').length;
  if (s.length > LIEN_HE_TOI_DA.sdt || !/^\+?[\d .-]+$/.test(s) || so < 8 || so > 15) return { sdt: null, loi: 'chỉ gồm chữ số (cho phép dấu cách, +, ., -), 8–15 chữ số' };
  return { sdt: s, loi: null };
}

/** "Phạm Văn Long (bố)" · "Phạm Văn Long" · "(bố)" · null. */
export function chuPhuHuynh(l: Pick<LienHe, 'parentName' | 'parentRelation'> | null | undefined): string | null {
  const ten = l?.parentName?.trim() || null;
  const qh = l?.parentRelation?.trim().toLowerCase() || null;
  return ten && qh ? `${ten} (${qh})` : ten ?? (qh ? `(${qh})` : null);
}
