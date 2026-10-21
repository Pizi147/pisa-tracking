import { issuesForTopic } from './cases.ts';
import { t } from '../i18n/index.ts';

/** Nhận xét (OV-4b: mọi bài nhập L/R/W1/W2/S; OV-12b: MT bắt buộc — `thieuNhanXetMt`) + GV chấm Speaking (YC-13.5, T39) — luật một chỗ cho máy chủ, lưới, hồ sơ Mock và xuất Excel (PR-XUAT). */
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
 * OV-12b (chủ SP 14/10) — NHẬN XÉT MT BẮT BUỘC. Ô MT (kind `mock`, không MT0, không MT cũ / nhập bù `lich_su`) có điểm phải có nhận xét
 * ≥ 10 ký tự; band của CHÍNH ô đó (W1, W2 theo từng task) dưới kỳ vọng → ≥ 1 nhóm nguyên nhân (chip, thứ tự chọn: 1 = chính).
 * Ô Vắng / "-" / Không dự thi / huỷ phần thi không có điểm → không đòi. Một luật cho máy chủ (`saveScore` → 400), hộp chấm, hồ sơ MT, lưới.
 */
export const NHAN_XET_MT_TOI_THIEU = 10;
export type ThieuNhanXet = 'ghi-nhan-xet' | 'nhan-xet-ngan' | 'chon-nhom';
/** Dòng lý do ngay trên nút Lưu (hộp chấm). */
export const CAU_THIEU_NHAN_XET: Record<ThieuNhanXet, string> = {
  'ghi-nhan-xet': t('Ghi nhận xét'), 'nhan-xet-ngan': t('Nhận xét ≥ {x} ký tự', { x: NHAN_XET_MT_TOI_THIEU }), 'chon-nhom': t('Chọn nhóm nguyên nhân'),
};
/** Chữ dưới ô điểm trên lưới (dữ liệu trước luật) — không chỉ bằng màu. */
export const CHU_O_THIEU: Record<ThieuNhanXet, string> = {
  'ghi-nhan-xet': t('thiếu nhận xét'), 'nhan-xet-ngan': t('thiếu nhận xét'), 'chon-nhom': t('thiếu nhóm nguyên nhân'),
};
/** Câu 400 của máy chủ. */
export const LOI_THIEU_NHAN_XET: Record<ThieuNhanXet, string> = {
  'ghi-nhan-xet': t('Bài Mock Test có điểm phải có nhận xét (≥ {x} ký tự).', { x: NHAN_XET_MT_TOI_THIEU }),
  'nhan-xet-ngan': t('Nhận xét cần ≥ {x} ký tự.', { x: NHAN_XET_MT_TOI_THIEU }),
  'chon-nhom': t('Điểm dưới kỳ vọng — chọn ít nhất một nhóm nguyên nhân.'),
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

/**
 * V5 SV-SO1 — "Ô FT ĐÃ XONG" cho câu SQL (`sc` = assessment_scores, `a` = lượt): có band VÀ không thiếu nhận xét bắt buộc — cùng luật `thieuNhanXetMt`
 * (MT thường, không MT cũ; nhận xét ≥ 10 ký tự; band dưới kỳ vọng của lượt → có nhóm nguyên nhân). Dùng ở câu LỌC TRƯỚC (cờ `o_cho_tu`, hàng đợi
 * Speaking): lệch chỉ được về phía "chưa xong" (đọc thừa), luật thật vẫn ở `skillCells`.
 */
export const O_FT_XONG_SQL = (sc: string, a: string) => `(${sc}.band IS NOT NULL AND (${a}.kind != 'mock' OR COALESCE(${a}.lich_su, 0) = 1 OR (
    length(trim(COALESCE(${sc}.comment, ''), ' ' || char(9) || char(10) || char(13))) >= ${NHAN_XET_MT_TOI_THIEU}
    AND NOT (${a}.target_at_attempt IS NOT NULL AND COALESCE(${sc}.nhom_nguyen_nhan, '') IN ('', '[]')
      AND ${sc}.band < ${a}.target_at_attempt - (CASE WHEN ${a}.attempt_no <= 0 OR (SELECT cy.route FROM learning_cycles cy WHERE cy.id = ${a}.cycle_id) = 'RF' THEN 0
        WHEN ${a}.attempt_no = 1 THEN 1.0 WHEN ${a}.attempt_no = 2 THEN 0.5 ELSE 0 END)))))`;

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
