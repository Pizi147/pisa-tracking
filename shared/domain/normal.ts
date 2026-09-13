/** NORMAL — chương trình FOU/BE/ELE, mốc kiểm tra và cách chấm theo tỷ lệ. */

import { ENTRY_SKILLS } from './skills.ts';

// ------------------------------------------------- Chương trình và lớp thường

/**
 * Chương trình học. FT dùng Mock Test và band IELTS; lớp thường (FOU/BE/ELE) dùng
 * bài kiểm tra chấm theo `số câu đúng / tổng số câu`, KHÔNG đi qua bảng quy đổi IELTS.
 *
 * `FOU` là mã canonical của Foundation. `FOUND` là mã đã từng dùng — chỉ ánh xạ khi
 * đọc dữ liệu cũ, KHÔNG tự đổi mã lớp lịch sử.
 */
export const PROGRAMME_CODES = ['FT', 'FOU', 'BE', 'ELE'] as const;
export type ProgrammeCode = (typeof PROGRAMME_CODES)[number];
export const LEGACY_PROGRAMME_CODE: Record<string, ProgrammeCode> = { FOUND: 'FOU' };

/** Cách chấm của một chương trình. Tách khỏi chương trình để sau này thêm loại khác. */
export const SCORING_MODES = ['ielts_band', 'ratio'] as const;
export type ScoringMode = (typeof SCORING_MODES)[number];
export const SCORING_MODE_LABEL: Record<ScoringMode, string> = {
  ielts_band: 'Band IELTS (Mock Test)',
  ratio: 'Số câu đúng / tổng số câu',
};

/** Ngưỡng đạt của cách chấm theo tỷ lệ. Xét trên tỷ lệ CHÍNH XÁC, không làm tròn % rồi mới xét. */
export const RATIO_PASS_THRESHOLD = 0.6;

/**
 * Loại lượt đánh giá. `mock` là MT của FT; lớp thường có bài giữa và bài cuối khoá.
 * Vẫn KHÔNG dùng từ "thi" — đây là bài kiểm tra, "thi" dành cho kỳ IELTS chính thức.
 */
export const ATTEMPT_KINDS = ['mock', 'progress', 'final'] as const;
export type AttemptKind = (typeof ATTEMPT_KINDS)[number];
export const ATTEMPT_KIND_LABEL: Record<AttemptKind, string> = {
  mock: 'Mock Test', progress: 'Bài kiểm tra giữa khoá', final: 'Bài kiểm tra cuối khoá',
};
export const ATTEMPT_KIND_SHORT: Record<AttemptKind, string> = {
  mock: 'MT', progress: 'Giữa khoá', final: 'Cuối khoá',
};

/**
 * Kỹ năng riêng của lớp Normal, không nằm trong bộ bốn kỹ năng IELTS.
 *
 * TÊN "Prep-Writing" ĐÃ BỎ Ở VÒNG 4 — gọi là **W** (`writing`), owner chốt 13/09/2026.
 * Cái tên cũ gợi ý đây là môn "chuẩn bị cho Writing", trong khi thực tế các em đang viết
 * đoạn và viết bài thật. Mã cũ `prep_writing` chỉ còn trong dữ liệu chưa di trú và trong
 * bảng ánh xạ ở `LEGACY_REGULAR_SKILL_MAP`.
 */
export const REGULAR_SKILLS = ['listening', 'reading', 'writing', 'pronunciation', 'speaking'] as const;
export type RegularSkill = (typeof REGULAR_SKILLS)[number];
export const REGULAR_SKILL_LABEL: Record<RegularSkill, string> = {
  listening: 'Listening', reading: 'Reading', writing: 'W',
  pronunciation: 'Pronunciation', speaking: 'Speaking',
};

/** Mã kỹ năng cũ → mã mới. Dữ liệu chưa di trú vẫn đọc đúng tên môn. */
export const LEGACY_REGULAR_SKILL_MAP: Record<string, RegularSkill> = {
  prep_writing: 'writing',
};

/**
 * Viết tắt dùng trên badge, ví dụ `L R` hay `R W1`.
 * Gộp cả kỹ năng của lớp FT và lớp thường vào một bảng để nơi hiển thị không phải đoán
 * lớp nào dùng bộ nào.
 */
export const SKILL_SHORT: Record<string, string> = {
  listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', speaking: 'S',
  writing: 'W', pronunciation: 'Pron',
  prep_writing: 'W',   // mã cũ, giữ để dữ liệu chưa di trú không hiện mã thô
};
export const skillShort = (k: string) => SKILL_SHORT[k] ?? k;

/**
 * Mốc kiểm tra tính theo TUẦN HỌC của lớp, không phải tuần thứ mấy của tháng.
 * FOU 8 tuần: giữa khoá tuần 4, cuối khoá tuần 8.
 * BE/ELE 10 tuần: giữa khoá tuần 5, cuối khoá tuần 10.
 */
export type ProgrammeTemplate = {
  code: ProgrammeCode;
  name: string;
  weeks: number | null;
  scoringMode: ScoringMode;
  skills: readonly string[];
  checkpoints: readonly { kind: AttemptKind; studyWeek: number }[];
};

export const PROGRAMME_TEMPLATES: Record<ProgrammeCode, ProgrammeTemplate> = {
  FT: {
    code: 'FT', name: 'Fulltime IELTS', weeks: null, scoringMode: 'ielts_band',
    skills: ENTRY_SKILLS,
    checkpoints: [],   // MT theo mốc riêng của FT, xem MOCK_FT_STUDY_WEEK
  },
  FOU: {
    code: 'FOU', name: 'Foundation', weeks: 8, scoringMode: 'ratio',
    skills: ['listening', 'reading', 'writing', 'pronunciation'],
    checkpoints: [{ kind: 'progress', studyWeek: 4 }, { kind: 'final', studyWeek: 8 }],
  },
  BE: {
    code: 'BE', name: 'Beginner', weeks: 10, scoringMode: 'ratio',
    skills: ['listening', 'reading', 'writing', 'speaking'],
    checkpoints: [{ kind: 'progress', studyWeek: 5 }, { kind: 'final', studyWeek: 10 }],
  },
  ELE: {
    code: 'ELE', name: 'Elementary', weeks: 10, scoringMode: 'ratio',
    skills: ['listening', 'reading', 'writing', 'speaking'],
    checkpoints: [{ kind: 'progress', studyWeek: 5 }, { kind: 'final', studyWeek: 10 }],
  },
};

/** Đưa mã chương trình về mã canonical. Nhận cả mã cũ, nhưng không sửa dữ liệu gốc. */
export function programmeOf(kind: string | null | undefined): ProgrammeCode | null {
  if (!kind) return null;
  const k = kind.trim().toUpperCase();
  if ((PROGRAMME_CODES as readonly string[]).includes(k)) return k as ProgrammeCode;
  return LEGACY_PROGRAMME_CODE[k] ?? null;
}

/**
 * Kết quả một kỹ năng của lớp thường.
 *
 * Ba trạng thái, KHÔNG hai: thiếu điểm KHÁC trượt. Chưa nhập thì chưa kết luận được,
 * không được đếm thành một môn trượt rồi đẩy học viên lên SOS oan.
 */
export type RatioOutcome = 'pass' | 'fail' | 'missing';

export function ratioResult(score: number | null, total: number | null): {
  outcome: RatioOutcome; ratio: number | null;
} {
  if (score === null || total === null) return { outcome: 'missing', ratio: null };
  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total) {
    return { outcome: 'missing', ratio: null };
  }
  const ratio = score / total;
  // Xét trên tỷ lệ chính xác. Làm tròn % để hiển thị rồi mới so là sai:
  // 23/40 = 57.5% hiển thị "58%" nhưng vẫn dưới ngưỡng.
  return { outcome: ratio >= RATIO_PASS_THRESHOLD ? 'pass' : 'fail', ratio };
}

/** Số môn trượt → mức SOS. Dùng chung ngưỡng 1/2/≥3 với FT, chỉ khác cách sinh ra "trượt". */
export function sosFromFailCount(failCount: number): SosLevel {
  if (failCount <= 0) return 0;
  return failCount >= 3 ? 3 : (failCount as SosLevel);
}

export type SosLevel = 0 | 1 | 2 | 3;
export const SOS_LABEL: Record<SosLevel, string> = {
  0: 'Đạt kỳ vọng', 1: 'SOS 1', 2: 'SOS 2', 3: 'SOS 3',
};

/**
 * DÒNG MÔ TẢ của một vấn đề học vụ.
 *
 * Vấn đề do giáo viên báo luôn có một câu do người báo viết. Vấn đề sinh từ điểm thì
 * KHÔNG — không ai gõ gì cả, vì nó sinh ra từ một phép tính. Hiển thị "chưa có tóm tắt"
 * ở đó là đúng sự thật nhưng vô dụng: người đọc vẫn phải mở ra mới biết chuyện gì.
 *
 * Nên với vấn đề sinh từ điểm, dựng một câu TỪ CHÍNH DỮ LIỆU đã có. Đây là suy ra khi
 * hiển thị, không phải một câu được ghi vào database — sửa điểm thì câu này đổi theo.
 */
export function caseHeadline(c: {
  summary?: string | null; originKind?: string | null;
  sosLevel?: number | null; attemptNo?: number | null;
}): string {
  const written = (c.summary ?? '').trim();
  if (written) return written;
  if (c.originKind === 'teacher_report') return 'Chưa có tóm tắt';
  const level = c.sosLevel ?? null;
  const where = c.attemptNo ? `MT${c.attemptNo}` : 'Bài đánh giá';
  if (level === null) return `${where}: chưa đủ căn cứ kết luận`;
  if (level === 0) return `${where}: đạt kỳ vọng ở mọi kỹ năng`;
  return `${where}: ${level} kỹ năng dưới kỳ vọng`;
}
