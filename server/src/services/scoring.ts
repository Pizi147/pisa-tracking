import {
  ASSESSED_SKILLS, CRITERIA_SKILLS, EXPECTATION_DELTA, RAW_SCORE_SKILLS,
  type AssessedSkill, type EntrySkill, type SosLevel,
} from '../../../shared/domain.ts';

/**
 * Bảng quy đổi số câu đúng → band, lấy nguyên từ sheet 'Bang quy doi' của trung tâm.
 * Index là số câu đúng 0–40. Không thay bằng bảng IELTS phổ biến trên mạng.
 */
export const LISTENING_BY_RAW = [
  0, 0, 1, 2.5, 2.5, 3, 3, 3.5, 3.5, 3.5, 4, 4, 4, 4.5, 4.5, 4.5, 5, 5, 5, 5,
  5.5, 5.5, 5.5, 6, 6, 6, 6, 6.5, 6.5, 6.5, 7, 7, 7, 7.5, 7.5, 8, 8, 8.5, 8.5, 9, 9,
];
export const READING_BY_RAW = [
  0, 0, 1, 1.5, 2.5, 2.5, 3, 3, 3.5, 3.5, 4, 4, 4, 4.5, 4.5, 5, 5, 5, 5, 5.5,
  5.5, 5.5, 5.5, 6, 6, 6, 6, 6.5, 6.5, 6.5, 7, 7, 7, 7.5, 7.5, 8, 8, 8.5, 8.5, 9, 9,
];

export class ScoreError extends Error {}

/** Làm tròn về mức 0.5 gần nhất, .25 và .75 làm tròn LÊN như Excel (không làm tròn về số chẵn). */
export function roundToHalf(value: number): number {
  return Math.round(value * 2 + 1e-9) / 2;
}

export function bandFromRaw(skill: 'listening' | 'reading', raw: number): number {
  if (!Number.isInteger(raw)) throw new ScoreError('Số câu đúng phải là số nguyên.');
  if (raw < 0 || raw > 40) throw new ScoreError('Số câu đúng phải nằm trong khoảng 0–40.');
  return skill === 'listening' ? LISTENING_BY_RAW[raw] : READING_BY_RAW[raw];
}

/** Band của một kỹ năng chấm theo tiêu chí = trung bình 4 tiêu chí, làm tròn về 0.5. */
export function bandFromCriteria(c: (number | null)[]): number | null {
  const vals = c.filter((v): v is number => v !== null && v !== undefined);
  if (vals.length !== 4) return null;
  for (const v of vals) {
    if (v < 0 || v > 9) throw new ScoreError('Điểm tiêu chí phải nằm trong khoảng 0–9.');
  }
  return roundToHalf(vals.reduce((a, b) => a + b, 0) / 4);
}

/**
 * Band Writing = (W1 + W2 × 2) / 3, làm tròn về 0.5.
 * W1 và W2 là hai kỹ năng riêng vì có giáo viên chỉ dạy một trong hai.
 */
export function writingBand(w1: number | null, w2: number | null): number | null {
  if (w1 === null || w2 === null) return null;
  return roundToHalf((w1 + w2 * 2) / 3);
}

export type EntryBands = Partial<Record<EntrySkill, number | null>>;

/** Gộp 5 ô nhập thành 4 band đánh giá. Trả về null cho kỹ năng chưa đủ dữ liệu. */
export function assessedBands(entry: EntryBands): Record<AssessedSkill, number | null> {
  return {
    listening: entry.listening ?? null,
    reading: entry.reading ?? null,
    writing: writingBand(entry.writing1 ?? null, entry.writing2 ?? null),
    speaking: entry.speaking ?? null,
  };
}

export function expectationFor(committedScore: number | null, attemptNo: number): number | null {
  if (committedScore === null || committedScore === undefined) return null;
  const delta = EXPECTATION_DELTA[attemptNo];
  if (delta === undefined) return null;
  return committedScore - delta;
}

export type SkillVerdict = { skill: AssessedSkill; band: number | null; passed: boolean | null };

export type MockResult = {
  expectation: number | null;
  bands: Record<AssessedSkill, number | null>;
  verdicts: SkillVerdict[];
  /** Số kỹ năng đã có band, trên tổng 4. */
  completed: number;
  complete: boolean;
  failedCount: number | null;
  /** null khi chưa đủ 4 kỹ năng — SOS chỉ chốt khi đủ điểm. */
  sosLevel: SosLevel | null;
  overall: number | null;
};

/**
 * Kết luận của một lần Mock.
 *
 * SOS CHỈ được chốt khi đủ cả bốn kỹ năng. Học sinh có thể thi Speaking một tuần và ba
 * kỹ năng còn lại tuần sau, nên trong lúc chờ phải hiển thị tiến độ n/4 thay vì kết luận
 * sớm là "Đạt kỳ vọng".
 */
export function evaluateMock(committedScore: number | null, attemptNo: number, entry: EntryBands): MockResult {
  const expectation = expectationFor(committedScore, attemptNo);
  const bands = assessedBands(entry);
  const verdicts: SkillVerdict[] = ASSESSED_SKILLS.map((skill) => {
    const band = bands[skill];
    return {
      skill,
      band,
      passed: band === null || expectation === null ? null : band >= expectation,
    };
  });
  const completed = verdicts.filter((v) => v.band !== null).length;
  const complete = completed === 4 && expectation !== null;
  const failedCount = complete ? verdicts.filter((v) => v.passed === false).length : null;
  const sosLevel: SosLevel | null =
    failedCount === null ? null : failedCount === 0 ? 0 : failedCount === 1 ? 1 : failedCount === 2 ? 2 : 3;

  // Overall chỉ có khi đủ bốn band, theo đúng công thức của form.
  const all = ASSESSED_SKILLS.map((s) => bands[s]);
  const overall = all.every((b) => b !== null)
    ? roundToHalf((all as number[]).reduce((a, b) => a + b, 0) / 4)
    : null;

  return { expectation, bands, verdicts, completed, complete, failedCount, sosLevel, overall };
}

export function isRawSkill(skill: string): skill is 'listening' | 'reading' {
  return (RAW_SCORE_SKILLS as string[]).includes(skill);
}
export function isCriteriaSkill(skill: string): boolean {
  return (CRITERIA_SKILLS as string[]).includes(skill);
}
