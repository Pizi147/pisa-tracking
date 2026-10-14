import { issuesForTopic } from './cases.ts';

/** Nhận xét (OV-4b: mọi bài nhập L/R/W1/W2/S; OV-12b: MT bắt buộc — `thieuNhanXetMt`) + GV chấm Speaking (YC-13.5, T39) — luật một chỗ cho máy chủ, lưới, hồ sơ Mock và xuất Excel (PR-XUAT). */
export const NHAN_XET_TOI_DA = 1000;

/** `null` = xoá. Trả chuỗi đã cắt (rỗng → null) hoặc câu lỗi. */
export function kiemNhanXet(s: unknown): { gt: string | null } | { loi: string } {
  if (s === null) return { gt: null };
  if (typeof s !== 'string') return { loi: 'Nhận xét phải là chữ.' };
  const t = s.trim();
  if (t.length > NHAN_XET_TOI_DA) return { loi: `Nhận xét tối đa ${NHAN_XET_TOI_DA} ký tự (đang ${t.length}).` };
  return { gt: t || null };
}

/**
 * OV-12b (chủ SP 14/10) — NHẬN XÉT MT BẮT BUỘC. Ô MT (kind `mock`, không MT0, không MT cũ / nhập bù `lich_su`) có điểm phải có nhận xét
 * ≥ 10 ký tự; band của CHÍNH ô đó (W1, W2 theo từng task) dưới kỳ vọng → ≥ 1 nhóm nguyên nhân (chip, thứ tự chọn: 1 = chính).
 * Ô Vắng / "-" / Không dự thi / huỷ phần thi không có điểm → không đòi. Một luật cho máy chủ (`saveScore` → 400), hộp chấm, hồ sơ MT, lưới.
 */
export const NHAN_XET_MT_TOI_THIEU = 10;
export type ThieuNhanXet = 'ghi-nhan-xet' | 'nhan-xet-ngan' | 'chon-nhom';
/** Dòng lý do ngay trên nút Lưu (hộp chấm). */
export const CAU_THIEU_NHAN_XET: Record<ThieuNhanXet, string> = {
  'ghi-nhan-xet': 'Ghi nhận xét', 'nhan-xet-ngan': `Nhận xét ≥ ${NHAN_XET_MT_TOI_THIEU} ký tự`, 'chon-nhom': 'Chọn nhóm nguyên nhân',
};
/** Chữ dưới ô điểm trên lưới (dữ liệu trước luật) — không chỉ bằng màu. */
export const CHU_O_THIEU: Record<ThieuNhanXet, string> = {
  'ghi-nhan-xet': 'thiếu nhận xét', 'nhan-xet-ngan': 'thiếu nhận xét', 'chon-nhom': 'thiếu nhóm nguyên nhân',
};
/** Câu 400 của máy chủ. */
export const LOI_THIEU_NHAN_XET: Record<ThieuNhanXet, string> = {
  'ghi-nhan-xet': `Bài Mock Test có điểm phải có nhận xét (≥ ${NHAN_XET_MT_TOI_THIEU} ký tự).`,
  'nhan-xet-ngan': `Nhận xét cần ≥ ${NHAN_XET_MT_TOI_THIEU} ký tự.`,
  'chon-nhom': 'Điểm dưới kỳ vọng — chọn ít nhất một nhóm nguyên nhân.',
};
export const batBuocNhanXetMt = (a: { kind?: string | null; lichSu: boolean }): boolean => a.kind === 'mock' && !a.lichSu;
/** Ô cần chip "Nhóm nguyên nhân": band của chính ô dưới kỳ vọng của lượt. */
export const canNhomNguyenNhan = (band: number | null | undefined, kyVong: number | null | undefined): boolean =>
  band !== null && band !== undefined && kyVong !== null && kyVong !== undefined && band < kyVong;

export function thieuNhanXetMt(o: {
  batBuoc: boolean; coDiem: boolean; band: number | null; kyVong: number | null;
  nhanXet: string | null | undefined; nhom: readonly string[] | null | undefined;
}): ThieuNhanXet | null {
  if (!o.batBuoc || !o.coDiem) return null;
  const t = (o.nhanXet ?? '').trim();
  if (!t) return 'ghi-nhan-xet';
  if (t.length < NHAN_XET_MT_TOI_THIEU) return 'nhan-xet-ngan';
  if (canNhomNguyenNhan(o.band, o.kyVong) && !o.nhom?.length) return 'chon-nhom';
  return null;
}

/** Cột `assessment_scores.nhom_nguyen_nhan` (JSON mảng mã theo thứ tự) → mảng; hỏng / trống → []. */
export function docNhomNguyenNhan(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

/** Kiểm nhóm gửi lên cho một ô (W1 / W2 dùng bộ Writing): mảng mã khác nhau của đúng kỹ năng, theo thứ tự chọn. */
export function kiemNhomNguyenNhan(v: unknown, skill: string): { gt: string[] } | { loi: string } {
  if (v === null) return { gt: [] };
  if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) return { loi: 'Nhóm nguyên nhân không hợp lệ.' };
  const hopLe = new Set(issuesForTopic(skill).map((i) => i.code));
  if (new Set(v).size !== v.length || v.some((x) => !hopLe.has(x))) return { loi: 'Nhóm nguyên nhân không thuộc kỹ năng này.' };
  return { gt: v as string[] };
}

/** Gộp nhận xét hai task Writing thành một ô (Excel): bỏ phần trống, cả hai trống → null. */
export function nhanXetW(w1: string | null, w2: string | null): string | null {
  const d = [w1 ? `Task 1: ${w1}` : null, w2 ? `Task 2: ${w2}` : null].filter(Boolean);
  return d.length ? d.join('\n') : null;
}

/** Tên GV chấm Speaking: tài khoản trước, tên người ngoài sau. */
export const tenGvCham = (o: { examinerUserName?: string | null; examinerName?: string | null }) =>
  o.examinerUserName ?? o.examinerName ?? null;

/**
 * VIEC-NHO-2: "đợt" nhớ GV chấm S trên máy — lưới theo tuần: id tuần (khoá cũ giữ nguyên); Điểm theo lớp xem theo MT (không tuần, cả
 * lưới một MT): "mt{n}". Trộn nhiều MT không tuần → null (không có nút).
 */
export function dotGvCham(periodId: number | null | undefined, attemptNos: readonly number[]): string | null {
  if (periodId) return String(periodId);
  const mt = new Set(attemptNos);
  return mt.size === 1 ? `mt${[...mt][0]}` : null;
}
