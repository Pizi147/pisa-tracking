/**
 * P13 KET-PET (plan.md 1.6 N18, chủ SP chốt Q10) — KỲ THI CAMBRIDGE của chương trình liên tục: Target + kết quả thi thật theo điểm Cambridge English Scale,
 * KHÔNG quy đổi sang band IELTS. Kỳ thi suy từ mã chương trình (không cột riêng); chương trình không có ở đây (FOU, FT, mã Quản trị tạo…) = không kỳ thi.
 * Nguồn thang (đặc tả 3.10 mục 7; session P13 không mở được trang này từ cloud): https://www.cambridgeenglish.org/exams-and-tests/qualifications/key/results/ ·
 * https://www.cambridgeenglish.org/exams-and-tests/qualifications/preliminary/results/ — điểm từng kỹ năng và Overall là số nguyên trên cùng thang,
 * Overall = trung bình 4 kỹ năng (làm tròn). Grade A / B / C; dưới C vẫn có chứng nhận một bậc CEFR thấp hơn.
 * Chừa chỗ: B2 First (140–190, 5 điểm) / TOEFL chưa mở lớp → chưa thêm mục (First cần bảng điểm riêng khi mở).
 */
export type KyThi = {
  ma: 'KET' | 'PET'; ten: string; min: number; max: number;
  /** Mức Grade: điểm Overall ≥ `tu` (giảm dần). */
  grade: readonly { grade: 'A' | 'B' | 'C'; tu: number }[];
  /** Bậc CEFR theo Overall ≥ `tu` (giảm dần; mức cuối = điểm sàn của thang). */
  cefr: readonly { cefr: string; tu: number }[];
};

export const KY_THI: Record<KyThi['ma'], KyThi> = {
  KET: {
    ma: 'KET', ten: 'A2 Key', min: 100, max: 150,
    grade: [{ grade: 'A', tu: 140 }, { grade: 'B', tu: 133 }, { grade: 'C', tu: 120 }],
    cefr: [{ cefr: 'B1', tu: 140 }, { cefr: 'A2', tu: 120 }, { cefr: 'A1', tu: 100 }],
  },
  PET: {
    ma: 'PET', ten: 'B1 Preliminary', min: 120, max: 170,
    grade: [{ grade: 'A', tu: 160 }, { grade: 'B', tu: 153 }, { grade: 'C', tu: 140 }],
    cefr: [{ cefr: 'B2', tu: 160 }, { cefr: 'B1', tu: 140 }, { cefr: 'A2', tu: 120 }],
  },
};

export const kyThiCuaChuongTrinh = (ct: string | null | undefined): KyThi | null =>
  KY_THI[(ct ?? '').trim().toUpperCase() as KyThi['ma']] ?? null;

/** "A2 Key: 100–150" — một câu cho nhãn ô và lỗi 400. */
export const thangKyThi = (kt: KyThi): string => `${kt.ten}: ${kt.min}–${kt.max}`;

/** null = hợp lệ (số nguyên trong thang); còn lại = câu lỗi gắn ô. */
export const kiemDiemKyThi = (kt: KyThi, x: number): string | null =>
  Number.isInteger(x) && x >= kt.min && x <= kt.max ? null : thangKyThi(kt);

/** Overall = trung bình 4 kỹ năng, làm tròn số nguyên. Thiếu kỹ năng → null. */
export function tongKyThi(_kt: KyThi, d: { l: number | null; r: number | null; w: number | null; s: number | null }): number | null {
  const ds = [d.l, d.r, d.w, d.s];
  if (ds.some((x) => x === null || x === undefined)) return null;
  return Math.round((ds as number[]).reduce((a, b) => a + b, 0) / 4);
}

/** Grade theo Overall; dưới C → null. */
export const gradeKyThi = (kt: KyThi, tong: number): 'A' | 'B' | 'C' | null => kt.grade.find((g) => tong >= g.tu)?.grade ?? null;
export const cefrKyThi = (kt: KyThi, tong: number): string | null => kt.cefr.find((c) => tong >= c.tu)?.cefr ?? null;
