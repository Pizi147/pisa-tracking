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

/** Bốn tiêu chí IELTS theo từng kỹ năng. */
export const CRITERIA: Record<'writing' | 'speaking', [string, string, string, string]> = {
  writing: ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'],
  speaking: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'],
};
export const CRITERIA_SHORT: Record<'writing' | 'speaking', [string, string, string, string]> = {
  writing: ['TA', 'CC', 'LR', 'GRA'],
  speaking: ['FC', 'LR', 'GRA', 'P'],
};

export function criteriaSetFor(skill: EntrySkill): 'writing' | 'speaking' | null {
  if (skill === 'writing1' || skill === 'writing2') return 'writing';
  if (skill === 'speaking') return 'speaking';
  return null;
}
