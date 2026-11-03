/** KỸ NĂNG — năm ô nhập của Fast Track và bốn môn của Normal. */

// ---------------------------------------------------------------- Kỹ năng

/** Kỹ năng NHẬP ĐIỂM. Writing tách W1/W2 vì giáo viên được phân công riêng từng task. */
export const ENTRY_SKILLS = ['listening', 'reading', 'writing1', 'writing2', 'speaking'] as const;
export type EntrySkill = (typeof ENTRY_SKILLS)[number];

export const ENTRY_SKILL_LABEL: Record<EntrySkill, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing1: 'Writing Task 1',
  writing2: 'Writing Task 2',
  speaking: 'Speaking',
};
export const ENTRY_SKILL_SHORT: Record<EntrySkill, string> = {
  listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', speaking: 'S',
};

/** Lớp thường có hai kỹ năng riêng, cũng cần viết tắt để badge không tràn dòng. */
export const REGULAR_SKILL_SHORT: Record<string, string> = {
  listening: 'L', reading: 'R', writing: 'W', pronunciation: 'Pron', speaking: 'S',
  prep_writing: 'W',   // mã cũ, giữ để dữ liệu chưa di trú không hiện mã thô
};

/** Kỹ năng ĐÁNH GIÁ dùng để xét kỳ vọng và SOS. Writing gộp từ W1 + W2. */
export const ASSESSED_SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;
export type AssessedSkill = (typeof ASSESSED_SKILLS)[number];

export const ASSESSED_SKILL_LABEL: Record<AssessedSkill, string> = {
  listening: 'Listening', reading: 'Reading', writing: 'Writing', speaking: 'Speaking',
};

/** Kỹ năng nhập bằng số câu đúng 0–40; các kỹ năng còn lại nhập theo 4 tiêu chí. */
export const RAW_SCORE_SKILLS: EntrySkill[] = ['listening', 'reading'];
export const CRITERIA_SKILLS: EntrySkill[] = ['writing1', 'writing2', 'speaking'];

/** Bốn tiêu chí IELTS theo từng BÀI NHẬP (một nguồn cho lưới, hộp tiêu chí, hồ sơ Mock, Excel). */
const TIEU_CHI = {
  writing1: ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'],
  writing2: ['Task Response', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'],
  speaking: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'],
} as const;
const TIEU_CHI_NGAN = { writing1: ['TA', 'CC', 'LR', 'GRA'], writing2: ['TR', 'CC', 'LR', 'GRA'], speaking: ['FC', 'LR', 'GRA', 'P'] } as const;
/** K4-25: Task 2 là Task Response (TR), không phải Task Achievement. `null` với L/R (nhập số câu). */
export const tieuChiCua = (s: EntrySkill): readonly string[] | null => (s in TIEU_CHI ? TIEU_CHI[s as keyof typeof TIEU_CHI] : null);
export const tieuChiNganCua = (s: EntrySkill): readonly string[] | null =>
  (s in TIEU_CHI_NGAN ? TIEU_CHI_NGAN[s as keyof typeof TIEU_CHI_NGAN] : null);
/**
 * U03 / U04 (audit 03/11): dòng tiêu chí của MỘT ô W1 · W2 · S — `[['TA', '6'], ['CC', '6.5'], …]`, nơi vẽ ghép "TA 6 · CC 6.5 · … → 6.0".
 * Ô chỉ có band (không tiêu chí nào) hoặc L / R → null: không thẻ, không dòng, không chữ thêm. Một hàm cho mọi màn.
 */
export function dongTieuChi(s: EntrySkill, tc: readonly (number | null)[] | null | undefined): [string, string][] | null {
  const ten = tieuChiNganCua(s);
  if (!ten || !tc || tc.every((v) => v === null || v === undefined)) return null;
  return ten.map((k, i) => [k, tc[i] === null || tc[i] === undefined ? '—' : String(tc[i])]);
}
