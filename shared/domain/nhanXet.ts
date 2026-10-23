import { issuesForTopic } from './cases.ts';
import { t } from '../i18n/index.ts';

/** Nhận xét (OV-4b: mọi bài nhập L/R/W1/W2/S; MT nên có — `thieuNhanXetMt`, chỉ nhắc) + GV chấm Speaking (YC-13.5, T39) — luật một chỗ cho máy chủ, lưới, hồ sơ Mock và xuất Excel (PR-XUAT). */
export const NHAN_XET_TOI_DA = 1000;

/** `null` = xoá. Trả chuỗi đã cắt (rỗng → null) hoặc câu lỗi. */
export function kiemNhanXet(s: unknown): { gt: string | null } | { loi: string } {
  if (s === null) return { gt: null };
  if (typeof s !== 'string') return { loi: t('Nhận xét phải là chữ.') };
  const gon = s.trim();
  if (gon.length > NHAN_XET_TOI_DA) return { loi: t('Nhận xét tối đa {x} ký tự (đang {length}).', { x: NHAN_XET_TOI_DA, length: gon.length }) };
  return { gt: gon || null };
}

/**
 * OV-12b → LUAT-NX-MT (chủ SP 22/10, `10` mục 7.2) — NHẬN XÉT MT: NÊN CÓ, KHÔNG BẮT BUỘC CỨNG. Ô MT (kind `mock`, không MT0, không MT cũ / nhập bù
 * `lich_su`) có điểm mà thiếu nhận xét ≥ 10 ký tự, hoặc band của CHÍNH ô (W1, W2 theo từng task) dưới kỳ vọng mà chưa có nhóm nguyên nhân → chỉ NHẮC
 * (ô vàng + chữ). Không 400, không tắt nút Lưu, không thành việc / nợ, dán Excel không báo lỗi dòng. Ô xong = có band (`oXongCua`).
 */
export const NHAN_XET_MT_TOI_THIEU = 10;
export type ThieuNhanXet = 'ghi-nhan-xet' | 'nhan-xet-ngan' | 'chon-nhom';
/** Dòng nhắc ngay trên nút Lưu (hộp chấm) — nút vẫn bấm được. */
export const CAU_THIEU_NHAN_XET: Record<ThieuNhanXet, string> = {
  'ghi-nhan-xet': t('Nên có nhận xét — dùng làm mô tả vấn đề trên Case'), 'nhan-xet-ngan': t('Nên có nhận xét — dùng làm mô tả vấn đề trên Case'),
  'chon-nhom': t('Nên chọn nhóm nguyên nhân'),
};
/** Chữ nhắc dưới ô điểm trên lưới (ô vàng) — không chỉ bằng màu. */
export const CHU_O_THIEU: Record<ThieuNhanXet, string> = {
  'ghi-nhan-xet': t('nên có nhận xét'), 'nhan-xet-ngan': t('nên có nhận xét'), 'chon-nhom': t('nên chọn nguyên nhân'),
};
/** LUAT-NX-MT: lượt MT thường NÊN có nhận xét (chỉ nhắc, không chặn) — không MT cũ / MT0. */
export const nenCoNhanXetMt = (a: { kind?: string | null; lichSu: boolean }): boolean => a.kind === 'mock' && !a.lichSu;
/** Ô cần chip "Nhóm nguyên nhân": band của chính ô dưới kỳ vọng của lượt. */
export const canNhomNguyenNhan = (band: number | null | undefined, kyVong: number | null | undefined): boolean =>
  band !== null && band !== undefined && kyVong !== null && kyVong !== undefined && band < kyVong;

export function thieuNhanXetMt(o: {
  nenCo: boolean; coDiem: boolean; band: number | null; kyVong: number | null;
  nhanXet: string | null | undefined; nhom: readonly string[] | null | undefined;
}): ThieuNhanXet | null {
  if (!o.nenCo || !o.coDiem) return null;
  const t = (o.nhanXet ?? '').trim();
  if (!t) return 'ghi-nhan-xet';
  if (t.length < NHAN_XET_MT_TOI_THIEU) return 'nhan-xet-ngan';
  if (canNhomNguyenNhan(o.band, o.kyVong) && !o.nhom?.length) return 'chon-nhom';
  return null;
}

/**
 * "Ô FT ĐÃ XONG" cho câu SQL (`sc` = assessment_scores, `a` = lượt) — cùng luật `oXongCua`: xong = có band (LUAT-NX-MT, chủ SP 22/10 — thiếu nhận xét
 * chỉ nhắc, không làm ô thành chưa xong). Giữ tham số `a` để mọi nơi gọi không đổi.
 */
export const O_FT_XONG_SQL = (sc: string, _a: string) => `(${sc}.band IS NOT NULL)`;

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
  if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) return { loi: t('Nhóm nguyên nhân không hợp lệ.') };
  const hopLe = new Set(issuesForTopic(skill).map((i) => i.code));
  if (new Set(v).size !== v.length || v.some((x) => !hopLe.has(x))) return { loi: t('Nhóm nguyên nhân không thuộc kỹ năng này.') };
  return { gt: v as string[] };
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
