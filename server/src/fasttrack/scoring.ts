import {
  ASSESSED_SKILLS, CRITERIA_SKILLS, ENTRY_SKILLS, RAW_SCORE_SKILLS, expectationDelta,
  type AssessedSkill, type EntrySkill, type SosLevel,
} from '../../../shared/domain/index.ts';

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

/**
 * NĂM Ô nào dưới kỳ vọng — khác với bốn kỹ năng dùng để đếm mức SOS.
 *
 * SOS đếm trên bốn kỹ năng CÓ BAND (Writing gộp theo công thức 1:2), vì đó là thang chính
 * thức. Nhưng việc hỗ trợ thì phải về đúng ô: một giáo viên chỉ dạy Task 2 không làm gì
 * được với một vấn đề ghi là "Writing".
 *
 * WRITING XÉT HAI TẦNG — owner đảo lại quy tắc cũ, chốt 13/09/2026:
 *
 *     band W tổng hợp ĐẠT kỳ vọng  →  KHÔNG sinh case nào, kể cả khi riêng W1 dưới kỳ vọng
 *     band W tổng hợp TRƯỢT        →  so W1 và W2 với CÙNG kỳ vọng đó, task nào trượt thì
 *                                     task đó một case (có thể ra hai case)
 *
 * Vòng trước so W1 và W2 riêng lẻ ngay từ đầu, nên W1 = 5.0 với W2 = 6.5 (band Writing 6.0,
 * ĐẠT kỳ vọng 6.0, không tính vào SOS) vẫn sinh ra một case W1. Owner bỏ cách đó: em đã đạt
 * kỳ vọng môn Writing thì không mở việc cho em, còn chênh lệch giữa hai task là chuyện giáo
 * viên điều chỉnh trong lớp chứ không phải một case phải theo dõi và chốt kết quả.
 *
 * Thiếu một trong hai task thì chưa có band tổng hợp, nên chưa kết luận gì về Writing —
 * chờ nhập đủ, không đoán.
 */
export function failingEntrySkills(
  expectation: number | null,
  entry: EntryBands,
  skippedSkills: readonly string[] = [],
): EntrySkill[] {
  if (expectation === null) return [];
  const writingSkipped = skippedSkills.includes('writing');
  const w1 = entry.writing1 ?? null;
  const w2 = entry.writing2 ?? null;
  const wBand = writingBand(w1, w2);
  /* Cổng tầng một: band Writing tổng hợp có trượt không. */
  const writingFails = !writingSkipped && wBand !== null && wBand < expectation;

  return ENTRY_SKILLS.filter((skill) => {
    if (skill === 'writing1' || skill === 'writing2') {
      if (!writingFails) return false;
      const band = skill === 'writing1' ? w1 : w2;
      return band !== null && band < expectation;
    }
    if (skippedSkills.includes(assessedSkillOf(skill))) return false;
    const band = entry[skill];
    return band !== null && band !== undefined && band < expectation;
  });
}

export function expectationFor(target: number | null, attemptNo: number): number | null {
  if (target === null || target === undefined) return null;
  return target - expectationDelta(attemptNo);
}

export type SkillVerdict = {
  skill: AssessedSkill;
  band: number | null;
  /** true đạt, false dưới kỳ vọng, null chưa đủ căn cứ. */
  passed: boolean | null;
  required: boolean;
};

export type AttemptResult = {
  expectation: number | null;
  bands: Record<AssessedSkill, number | null>;
  verdicts: SkillVerdict[];
  /** Các kỹ năng phải mock ở lượt này (đã trừ kỹ năng được đánh dấu không mock). */
  required: AssessedSkill[];
  skipped: AssessedSkill[];
  /** Đã nhập điểm bao nhiêu trên tổng số kỹ năng BẮT BUỘC. */
  scoredRequired: number;
  /** Đủ điểm mọi kỹ năng bắt buộc — đây là "hoàn thành", chưa nói gì về SOS. */
  complete: boolean;
  /** Đủ điểm MỌI kỹ năng bắt buộc VÀ đã biết kỳ vọng — kết luận cuối cùng. */
  evaluable: boolean;
  /**
   * Đã kết luận được nhưng CHƯA đủ điểm mọi kỹ năng, nên mức SOS còn có thể tăng.
   * Giao diện phải ghi rõ điều này thay vì hiện một con số trông như đã chốt.
   */
  provisional: boolean;
  failedCount: number | null;
  sosLevel: SosLevel | null;
  /** Chỉ có khi đủ CẢ BỐN kỹ năng — không dựng Overall từ hai/ba kỹ năng. */
  overall: number | null;
  /** Nhãn cho biết đang đánh giá trên mấy kỹ năng, ví dụ "Đánh giá trên 3 kỹ năng". */
  scopeNote: string | null;
  scopeDetail: string | null;
};

/**
 * Kết luận của một lượt đánh giá.
 *
 * Mặc định phải đủ CẢ BỐN kỹ năng mới chốt SOS. Khi Quản lý/Admin chi nhánh đã đánh dấu
 * một kỹ năng là KHÔNG MOCK, kỹ năng đó rời khỏi mẫu số và SOS tính trên các kỹ năng còn
 * lại. Không ai đánh dấu thì hệ thống chờ đủ, không tự suy.
 *
 * Ngưỡng giữ nguyên: 1 kỹ năng dưới kỳ vọng → SOS 1, 2 → SOS 2, từ 3 → SOS 3.
 */
export function evaluateAttempt(
  target: number | null,
  attemptNo: number,
  entry: EntryBands,
  skippedSkills: readonly string[] = [],
): AttemptResult {
  const expectation = expectationFor(target, attemptNo);
  const bands = assessedBands(entry);
  const skipped = ASSESSED_SKILLS.filter((s) => skippedSkills.includes(s));
  const required = ASSESSED_SKILLS.filter((s) => !skippedSkills.includes(s));

  const verdicts: SkillVerdict[] = ASSESSED_SKILLS.map((skill) => {
    const band = bands[skill];
    const isRequired = required.includes(skill);
    return {
      skill,
      band,
      passed: !isRequired || band === null || expectation === null ? null : band >= expectation,
      required: isRequired,
    };
  });

  const scoredRequired = verdicts.filter((v) => v.required && v.band !== null).length;
  const complete = required.length > 0 && scoredRequired === required.length;
  const evaluable = complete && expectation !== null;

  /*
   * SOS TÍNH NGAY, KHÔNG CHỜ ĐỦ KỸ NĂNG (owner chốt 09/09/2026).
   *
   * Trước đây phải đủ mọi kỹ năng bắt buộc mới kết luận. Nhưng chờ như thế nghĩa là một
   * giáo viên nhập điểm muộn thì cả việc hỗ trợ học viên cũng phải dừng theo. Nay chỉ cần
   * CÓ ÍT NHẤT MỘT kỹ năng đã chấm và đã biết kỳ vọng là kết luận được trên phần đang có.
   *
   * Mức SOS vì thế là kết luận TẠM THỜI và có thể tăng khi các kỹ năng còn lại vào —
   * `provisional` cho giao diện biết để ghi rõ "mới có 2/4 kỹ năng", không để người đọc
   * tưởng đây đã là con số cuối.
   *
   * Thiếu điểm vẫn KHÁC trượt: kỹ năng chưa chấm không bị đếm vào số môn dưới kỳ vọng.
   */
  const hasAnyScore = scoredRequired > 0;
  const canConclude = hasAnyScore && expectation !== null;
  const failedCount = canConclude ? verdicts.filter((v) => v.passed === false).length : null;
  /*
   * Fast Track KẾT LUẬN TẠM THỜI ngay trên phần điểm đang có, kể cả khi kết luận đó là
   * "đạt" — owner chốt ở vòng 3, và cờ `provisional` bên dưới nói rõ đó là tạm thời.
   *
   * LỚP NORMAL THÌ KHÁC, CÓ CHỦ Ý: ở đó thiếu điểm KHÔNG được suy thành "đạt mọi môn"
   * (mục 6.3 — xem `evaluateRegular`). Lý do khác nhau: một lượt Mock Test luôn đủ bốn
   * kỹ năng và chỉ chờ chấm, còn một bài kiểm tra lớp Normal có thể thiếu môn vì em vắng
   * buổi đó — hai chuyện khác nhau, nên kết luận tạm thời mang nghĩa khác nhau.
   */
  const sosLevel: SosLevel | null =
    failedCount === null ? null : failedCount === 0 ? 0 : failedCount === 1 ? 1 : failedCount === 2 ? 2 : 3;
  const provisional = canConclude && !complete;

  /*
   * Overall IELTS chỉ có nghĩa khi lượt này thực sự đánh giá đủ BỐN kỹ năng.
   * Kỹ năng đã bị loại khỏi phạm vi đánh giá thì lượt không còn là bài bốn kỹ năng nữa,
   * nên không dựng Overall — kể cả khi điểm cũ của kỹ năng đó vẫn còn để tra lại.
   */
  const all = ASSESSED_SKILLS.map((s) => bands[s]);
  const overall = skipped.length === 0 && all.every((b) => b !== null)
    ? roundToHalf((all as number[]).reduce((a, b) => a + b, 0) / 4)
    : null;

  return {
    expectation, bands, verdicts, required, skipped,
    scoredRequired, complete, evaluable, failedCount, sosLevel, overall,
    provisional,
    /*
     * Ở danh sách chỉ cần con số. "Đánh giá trên 3 kỹ năng" là một câu giải thích, và giải
     * thích thuộc về màn chi tiết — ở overview nó chỉ làm dòng dài ra và khó quét.
     */
    scopeNote: skipped.length ? `${required.length} kỹ năng` : null,
    scopeDetail: skipped.length
      ? `Đánh giá trên ${required.length} kỹ năng — ${skipped.length} kỹ năng không yêu cầu ở lượt này`
      : null,
  };
}

export function isRawSkill(skill: string): skill is 'listening' | 'reading' {
  return (RAW_SCORE_SKILLS as string[]).includes(skill);
}
export function isCriteriaSkill(skill: string): boolean {
  return (CRITERIA_SKILLS as string[]).includes(skill);
}

/** Kỹ năng nhập điểm nào thuộc về một kỹ năng đánh giá. Writing gồm cả hai task. */
export function entrySkillsOf(assessed: AssessedSkill): EntrySkill[] {
  if (assessed === 'writing') return ['writing1', 'writing2'];
  return [assessed as EntrySkill];
}

/** Kỹ năng đánh giá tương ứng với một ô nhập điểm. */
export function assessedSkillOf(entry: string): AssessedSkill {
  return entry === 'writing1' || entry === 'writing2' ? 'writing' : (entry as AssessedSkill);
}
