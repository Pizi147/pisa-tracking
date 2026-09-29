/** Nhận xét W/S + GV chấm Speaking (YC-13.5, T39) — luật một chỗ cho máy chủ, lưới, hồ sơ Mock và xuất Excel (PR-XUAT). */
export const NHAN_XET_TOI_DA = 1000;
export const BAI_CO_NHAN_XET = ['writing1', 'writing2', 'speaking'] as const;

/** `null` = xoá. Trả chuỗi đã cắt (rỗng → null) hoặc câu lỗi. */
export function kiemNhanXet(s: unknown): { gt: string | null } | { loi: string } {
  if (s === null) return { gt: null };
  if (typeof s !== 'string') return { loi: 'Nhận xét phải là chữ.' };
  const t = s.trim();
  if (t.length > NHAN_XET_TOI_DA) return { loi: `Nhận xét tối đa ${NHAN_XET_TOI_DA} ký tự (đang ${t.length}).` };
  return { gt: t || null };
}

/** Gộp nhận xét hai task Writing thành một ô (Excel): bỏ phần trống, cả hai trống → null. */
export function nhanXetW(w1: string | null, w2: string | null): string | null {
  const d = [w1 ? `Task 1: ${w1}` : null, w2 ? `Task 2: ${w2}` : null].filter(Boolean);
  return d.length ? d.join('\n') : null;
}

/** Tên GV chấm Speaking: tài khoản trước, tên người ngoài sau. */
export const tenGvCham = (o: { examinerUserName?: string | null; examinerName?: string | null }) =>
  o.examinerUserName ?? o.examinerName ?? null;
