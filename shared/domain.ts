/** Từ vựng nghiệp vụ dùng chung cho API và giao diện. */

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

// ---------------------------------------------------------------- Học viên

/** Chỉ ba trạng thái. LT1/LT2 là lộ trình, không phải trạng thái học viên. */
export const STUDENT_STATUSES = ['active', 'inactive', 'finished'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];
export const STUDENT_STATUS_LABEL: Record<StudentStatus, string> = {
  active: 'Đang học', inactive: 'Tạm dừng', finished: 'Đã kết thúc',
};

/** Học viên kết thúc bao lâu thì đưa vào lưu trữ. Mốc chính xác còn chờ chốt — xem O08. */
export const ARCHIVE_AFTER_DAYS = 14;

// ---------------------------------------------------------------- Lộ trình học

/**
 * Một lộ trình (cycle) có target và ngày thi IELTS riêng.
 *
 * Học tiếp / học lại TRONG cùng một lộ trình thì số MT tăng tiếp và target giữ nguyên.
 * Chỉ khi sang lộ trình mới (LT1 → LT2) mới đánh số lại từ MT1, vì lúc đó đã có target mới.
 */
export const ROUTES = ['LT1', 'LT2'] as const;
export type Route = (typeof ROUTES)[number];

export const CYCLE_STATUSES = ['active', 'completed', 'abandoned'] as const;
export type CycleStatus = (typeof CYCLE_STATUSES)[number];
export const CYCLE_STATUS_LABEL: Record<CycleStatus, string> = {
  active: 'Đang học', completed: 'Đã hoàn thành', abandoned: 'Đã dừng',
};

// ---------------------------------------------------------------- Mock Test

export const mockLabel = (n: number) => `MT${n}`;

/**
 * Kỳ vọng của một lần MT = target của lộ trình − mức trừ theo LẦN THỨ MẤY trong lộ trình đó.
 * MT1 trừ 1.0, MT2 trừ 0.5, từ MT3 trở đi bằng đúng target (nguồn: Quy trình SOS mục 3).
 * Học lại trong cùng lộ trình làm số MT tăng tiếp, nên MT6, MT7… cũng bằng target.
 */
export function expectationDelta(attemptNo: number): number {
  if (attemptNo <= 0) return 0;
  return attemptNo === 1 ? 1.0 : attemptNo === 2 ? 0.5 : 0;
}

/** Tuần HỌC của chương trình FT, chỉ dùng để gợi ý tuần lịch khi lập kế hoạch. */
export const MOCK_FT_STUDY_WEEK: Record<number, number> = { 1: 6, 2: 12, 3: 16, 4: 20, 5: 24 };

/**
 * Trạng thái một lượt đánh giá.
 * KHÔNG dùng từ "thi" cho Mock — "thi" chỉ dành cho kỳ thi IELTS chính thức.
 */
export const ATTEMPT_STATUSES = ['planned', 'done', 'cancelled'] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];
export const ATTEMPT_STATUS_LABEL: Record<AttemptStatus, string> = {
  planned: 'Đã lên lịch', done: 'Đã xong', cancelled: 'Đã huỷ',
};

/** Kỹ năng của một lượt: mặc định bắt buộc, chỉ Quản lý/Admin CN mới đánh dấu không mock. */
export const SKILL_REQUIREMENTS = ['required', 'skipped'] as const;
export type SkillRequirement = (typeof SKILL_REQUIREMENTS)[number];
export const SKILL_REQUIREMENT_LABEL: Record<SkillRequirement, string> = {
  required: 'Có mock', skipped: 'Không mock',
};

/** Tiến độ thực hiện của một kỹ năng — tách rõ "chưa mock" với "đã mock, chưa nhập điểm". */
export const SKILL_PROGRESS = ['skipped', 'not_scheduled', 'upcoming', 'due', 'performed', 'scored'] as const;
export type SkillProgress = (typeof SKILL_PROGRESS)[number];
export const SKILL_PROGRESS_LABEL: Record<SkillProgress, string> = {
  skipped: 'Không mock',
  not_scheduled: 'Chờ xếp lịch',
  upcoming: 'Sắp tới',
  /** Đã tới ngày trong lịch nhưng chưa có ghi nhận nào — ngày trôi qua KHÔNG chứng minh đã mock. */
  due: 'Chưa ghi nhận',
  performed: 'Đã mock, chưa nhập điểm',
  scored: 'Đã có điểm',
};

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

/** Kỹ năng riêng của lớp thường, không nằm trong bộ bốn kỹ năng IELTS. */
export const REGULAR_SKILLS = ['listening', 'reading', 'prep_writing', 'pronunciation', 'speaking'] as const;
export type RegularSkill = (typeof REGULAR_SKILLS)[number];
export const REGULAR_SKILL_LABEL: Record<RegularSkill, string> = {
  listening: 'Listening', reading: 'Reading', prep_writing: 'Prep-Writing',
  pronunciation: 'Pronunciation', speaking: 'Speaking',
};

/**
 * Viết tắt dùng trên badge, ví dụ `L R` hay `R W1`.
 * Gộp cả kỹ năng của lớp FT và lớp thường vào một bảng để nơi hiển thị không phải đoán
 * lớp nào dùng bộ nào.
 */
export const SKILL_SHORT: Record<string, string> = {
  listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', speaking: 'S',
  prep_writing: 'PrepW', pronunciation: 'Pron',
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
    skills: ['listening', 'reading', 'prep_writing', 'pronunciation'],
    checkpoints: [{ kind: 'progress', studyWeek: 4 }, { kind: 'final', studyWeek: 8 }],
  },
  BE: {
    code: 'BE', name: 'Beginner', weeks: 10, scoringMode: 'ratio',
    skills: ['listening', 'reading', 'prep_writing', 'speaking'],
    checkpoints: [{ kind: 'progress', studyWeek: 5 }, { kind: 'final', studyWeek: 10 }],
  },
  ELE: {
    code: 'ELE', name: 'Elementary', weeks: 10, scoringMode: 'ratio',
    skills: ['listening', 'reading', 'prep_writing', 'speaking'],
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

// ------------------------------------------------ Phân loại vấn đề học vụ

/**
 * BỘ PHÂN LOẠI VẤN ĐỀ — ba nhóm gốc, không hơn.
 *
 * Phụ huynh, sức khoẻ, gia đình, đi lại, lịch cá nhân KHÔNG phải nhóm thứ tư: chúng là
 * HOÀN CẢNH kèm theo. Một em nghỉ nhiều vì nhà xa thì vấn đề học vụ vẫn là "đi học không
 * đều", còn "nhà xa" là hoàn cảnh giải thích cho nó.
 *
 * Đây là bộ phân loại VẬN HÀNH của trung tâm, không phải bộ chẩn đoán chính thức của IELTS.
 * Mỗi nhánh luôn có "Khác" để không ép người ghi chọn bừa.
 */
export const ISSUE_GROUPS = ['student', 'teacher', 'curriculum'] as const;
export type IssueGroup = (typeof ISSUE_GROUPS)[number];
export const ISSUE_GROUP_LABEL: Record<IssueGroup, string> = {
  student: 'Học sinh', teacher: 'Giáo viên', curriculum: 'Giáo trình',
};

export type IssueNode = {
  /** Mã ỔN ĐỊNH. Đổi nhãn hiển thị được, đổi mã thì mất lịch sử. */
  code: string;
  label: string;
  /** Kỹ năng liên quan, để lọc theo kỹ năng ở màn quản lý. */
  skill?: string;
};

export type IssueBranch = {
  group: IssueGroup;
  /** Nhánh con, ví dụ "Thói quen học" hay "Listening". */
  key: string;
  label: string;
  skill?: string;
  items: IssueNode[];
};

const other = (code: string): IssueNode => ({ code, label: 'Khác' });

export const ISSUE_TAXONOMY: IssueBranch[] = [
  {
    group: 'student', key: 'behaviour', label: 'Thói quen học',
    items: [
      { code: 'student.behaviour.attendance', label: 'Đi học / đúng giờ' },
      { code: 'student.behaviour.homework', label: 'Chuẩn bị bài / bài tập' },
      { code: 'student.behaviour.selfstudy', label: 'Tự học theo kế hoạch' },
      { code: 'student.behaviour.focus', label: 'Tập trung / tham gia trên lớp' },
      { code: 'student.behaviour.organisation', label: 'Hợp tác / tổ chức việc học' },
      other('student.behaviour.other'),
    ],
  },
  {
    group: 'student', key: 'listening', label: 'Listening', skill: 'listening',
    items: [
      { code: 'student.listening.recognition', label: 'Nhận diện lời nói', skill: 'listening' },
      { code: 'student.listening.detail', label: 'Hiểu chi tiết / paraphrase', skill: 'listening' },
      { code: 'student.listening.mainidea', label: 'Ý chính / quan hệ ý', skill: 'listening' },
      { code: 'student.listening.follow', label: 'Theo mạch / phân biệt người nói', skill: 'listening' },
      { code: 'student.listening.strategy', label: 'Chiến lược / độ chính xác khi trả lời', skill: 'listening' },
      { ...other('student.listening.other'), skill: 'listening' },
    ],
  },
  {
    group: 'student', key: 'reading', label: 'Reading', skill: 'reading',
    items: [
      { code: 'student.reading.detail', label: 'Tìm chi tiết / paraphrase', skill: 'reading' },
      { code: 'student.reading.structure', label: 'Ý chính / cấu trúc bài', skill: 'reading' },
      { code: 'student.reading.inference', label: 'Lập luận / quan điểm / suy luận', skill: 'reading' },
      { code: 'student.reading.language', label: 'Từ vựng / cấu trúc câu', skill: 'reading' },
      { code: 'student.reading.strategy', label: 'Chiến lược / độ chính xác khi trả lời', skill: 'reading' },
      { ...other('student.reading.other'), skill: 'reading' },
    ],
  },
  {
    group: 'student', key: 'writing', label: 'Writing', skill: 'writing',
    items: [
      { code: 'student.writing.task', label: 'Đáp ứng yêu cầu đề', skill: 'writing' },
      { code: 'student.writing.organisation', label: 'Tổ chức bài / liên kết ý', skill: 'writing' },
      { code: 'student.writing.lexical', label: 'Từ vựng', skill: 'writing' },
      { code: 'student.writing.grammar', label: 'Ngữ pháp', skill: 'writing' },
      { ...other('student.writing.other'), skill: 'writing' },
    ],
  },
  {
    group: 'student', key: 'speaking', label: 'Speaking', skill: 'speaking',
    items: [
      { code: 'student.speaking.fluency', label: 'Trôi chảy / mạch lạc', skill: 'speaking' },
      { code: 'student.speaking.lexical', label: 'Từ vựng', skill: 'speaking' },
      { code: 'student.speaking.grammar', label: 'Ngữ pháp', skill: 'speaking' },
      { code: 'student.speaking.pronunciation', label: 'Phát âm', skill: 'speaking' },
      { ...other('student.speaking.other'), skill: 'speaking' },
    ],
  },
  {
    group: 'teacher', key: 'teaching', label: 'Quá trình dạy',
    items: [
      { code: 'teacher.explain', label: 'Giải thích / kiểm tra mức hiểu' },
      { code: 'teacher.adjust', label: 'Điều chỉnh cách dạy theo lớp' },
      { code: 'teacher.feedback', label: 'Chữa bài / phản hồi' },
      { code: 'teacher.followup', label: 'Theo sát việc thực hiện hỗ trợ' },
      { code: 'teacher.tracking', label: 'Theo dõi / đánh giá tiến độ' },
      { code: 'teacher.classroom', label: 'Quản lý lớp / phối hợp' },
      other('teacher.other'),
    ],
  },
  {
    group: 'curriculum', key: 'programme', label: 'Chương trình',
    items: [
      { code: 'curriculum.level', label: 'Mức độ / trình tự bài' },
      { code: 'curriculum.pace', label: 'Tốc độ / khối lượng' },
      { code: 'curriculum.balance', label: 'Nội dung / cân đối giữa các kỹ năng' },
      { code: 'curriculum.materials', label: 'Bài luyện / học liệu' },
      { code: 'curriculum.alignment', label: 'Độ khớp giữa bài kiểm tra và mục tiêu' },
      other('curriculum.other'),
    ],
  },
];

/** Hoàn cảnh kèm theo — GHI CHÚ, không phải nguyên nhân đã được xác minh. */
export const ISSUE_CONTEXTS = [
  { code: 'context.parent', label: 'Phía phụ huynh' },
  { code: 'context.health', label: 'Sức khoẻ' },
  { code: 'context.family', label: 'Hoàn cảnh gia đình' },
  { code: 'context.travel', label: 'Đi lại / khoảng cách' },
  { code: 'context.schedule', label: 'Lịch cá nhân / trường lớp' },
  { code: 'context.pressure', label: 'Áp lực bên ngoài' },
  { code: 'context.other', label: 'Khác' },
] as const;

const ISSUE_INDEX: Record<string, { label: string; group: IssueGroup; branch: string; skill?: string }> = {};
for (const b of ISSUE_TAXONOMY) {
  for (const it of b.items) {
    ISSUE_INDEX[it.code] = { label: it.label, group: b.group, branch: b.label, skill: it.skill };
  }
}
for (const c of ISSUE_CONTEXTS) {
  ISSUE_INDEX[c.code] = { label: c.label, group: 'student', branch: 'Hoàn cảnh' };
}

/** Mã lạ (dữ liệu cũ, hoặc mã đã ngừng dùng) vẫn đọc được thay vì hiện ra trống. */
export function issueLabel(code: string | null | undefined): string {
  if (!code) return 'Chưa phân loại';
  return ISSUE_INDEX[code]?.label ?? code;
}
export function issueGroupOf(code: string | null | undefined): IssueGroup | null {
  return code ? ISSUE_INDEX[code]?.group ?? null : null;
}
export function issueBranchOf(code: string | null | undefined): string | null {
  return code ? ISSUE_INDEX[code]?.branch ?? null : null;
}

export const ISSUE_ROLES = ['primary', 'secondary', 'context'] as const;
export type IssueRole = (typeof ISSUE_ROLES)[number];
export const ISSUE_ROLE_LABEL: Record<IssueRole, string> = {
  primary: 'Vấn đề chính', secondary: 'Yếu tố đi kèm', context: 'Hoàn cảnh',
};

// ------------------------------------------------ Nguồn case, hướng xử lý, tác động

export const CASE_ORIGINS = ['mock', 'teacher_report'] as const;
export type CaseOrigin = (typeof CASE_ORIGINS)[number];
export const CASE_ORIGIN_LABEL: Record<CaseOrigin, string> = {
  mock: 'Từ kết quả đánh giá', teacher_report: 'Giáo viên báo',
};

/**
 * MỨC ĐỘ GẤP do người báo nhận định. KHÁC HẲN `sos_level`.
 *
 * `sos_level` là số kỹ năng dưới kỳ vọng ở một bài — một con số đo được. Mức độ gấp là
 * cảm nhận của người báo. Nếu để giáo viên gõ thẳng "SOS 2" mà không có bài nào, thì con
 * số SOS trên mọi báo cáo sẽ mang hai nghĩa khác nhau và không cộng được nữa.
 */
export const URGENCY_LEVELS = ['normal', 'attention', 'urgent'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];
export const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  normal: 'Bình thường', attention: 'Cần chú ý', urgent: 'Gấp',
};
export const URGENCY_TONE: Record<UrgencyLevel, 'neutral' | 'warn' | 'danger'> = {
  normal: 'neutral', attention: 'warn', urgent: 'danger',
};

/**
 * HƯỚNG XỬ LÝ — khác với TRẠNG THÁI.
 * Trạng thái nói case đang mở hay đã xong. Hướng xử lý nói định làm gì với nó.
 * "Chỉ theo dõi" là hướng xử lý hợp lệ mà case vẫn đang mở.
 */
export const DISPOSITIONS = ['monitor', 'offline', 'no_action', 'action', 'other'] as const;
export type Disposition = (typeof DISPOSITIONS)[number];
export const DISPOSITION_LABEL: Record<Disposition, string> = {
  monitor: 'Chỉ theo dõi thêm',
  offline: 'Đã trao đổi ngoài hệ thống',
  no_action: 'Không cần xử lý thêm',
  action: 'Có kế hoạch hỗ trợ',
  other: 'Khác',
};

export const INTERVENTION_KINDS = [
  'talk_student', 'talk_parent', 'tutor', 'self_study',
  'teaching_adjust', 'meeting', 'ops_policy', 'other',
] as const;
export type InterventionKind = (typeof INTERVENTION_KINDS)[number];
export const INTERVENTION_KIND_LABEL: Record<InterventionKind, string> = {
  talk_student: 'Trao đổi với học sinh',
  talk_parent: 'Trao đổi với phụ huynh',
  tutor: 'Học tutor',
  self_study: 'Xếp tự học',
  teaching_adjust: 'Điều chỉnh cách dạy',
  meeting: 'Buổi gặp riêng',
  ops_policy: 'Chính sách vận hành',
  other: 'Khác',
};

export const INTERVENTION_STATUSES = ['planned', 'started', 'completed', 'cancelled'] as const;
export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];
export const INTERVENTION_STATUS_LABEL: Record<InterventionStatus, string> = {
  planned: 'Đã lên kế hoạch', started: 'Đang thực hiện', completed: 'Đã xong', cancelled: 'Đã huỷ',
};

/** Quan sát sau tác động. KHÔNG phải khẳng định tác động gây ra thay đổi. */
export const FOLLOWUP_OUTCOMES = ['improved', 'partial', 'unchanged', 'worse', 'insufficient'] as const;
export type FollowUpOutcome = (typeof FOLLOWUP_OUTCOMES)[number];
export const FOLLOWUP_OUTCOME_LABEL: Record<FollowUpOutcome, string> = {
  improved: 'Có tiến bộ',
  partial: 'Tiến bộ một phần',
  unchanged: 'Chưa thay đổi',
  worse: 'Kém hơn',
  insufficient: 'Chưa đủ căn cứ',
};

/** Nguồn của điểm xuất phát. Thiếu căn cứ thì để trống, KHÔNG lấy MT1 làm điểm đầu vào. */
export const BASELINE_SOURCES = ['entrance', 'previous_cycle', 'external', 'manual'] as const;
export type BaselineSource = (typeof BASELINE_SOURCES)[number];
export const BASELINE_SOURCE_LABEL: Record<BaselineSource, string> = {
  entrance: 'Bài kiểm tra đầu vào',
  previous_cycle: 'Kết quả cuối lộ trình trước',
  external: 'Điểm bên ngoài (IELTS, nơi khác)',
  manual: 'Nhập tay có ghi chú',
};

/** Kết thúc hành chính KHÁC đạt mục tiêu. */
export const CYCLE_OUTCOMES = ['reached', 'not_reached', 'unknown'] as const;
export type CycleOutcome = (typeof CYCLE_OUTCOMES)[number];
export const CYCLE_OUTCOME_LABEL: Record<CycleOutcome, string> = {
  reached: 'Đạt mục tiêu', not_reached: 'Chưa đạt mục tiêu', unknown: 'Chưa có căn cứ kết luận',
};

// ---------------------------------------------------------------- Xử lý SOS

export const ACADEMIC_SUPPORTS = [
  'Xếp tự học 1 tháng',
  'Học tutor đến lần mock sau',
  'Học tutor đến lúc thi',
  'Đề xuất lùi lịch thi',
  'Khác',
] as const;

export const OPS_POLICIES = [
  'Buổi bổ trợ với tutor',
  'Buổi bổ trợ với GV fulltime',
  'Tặng thêm mock test',
  'Khác',
] as const;

export const MEETING_KINDS = ['Không cần', 'GVCN meeting HS', 'CX / GĐCN meeting HS'] as const;

export const CASE_STATUSES = ['open', 'in_progress', 'done'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];
export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  open: 'Chưa xử lý', in_progress: 'Đang xử lý', done: 'Đã xử lý',
};

/**
 * Ba trạng thái phải NHÌN LÀ BIẾT, không phải mở chi tiết mới rõ đã có ai làm gì chưa.
 * "GVCN đã nhận" là metadata gắn kèm, KHÔNG phải trạng thái thứ tư — nhận tài liệu không
 * tự nó nghĩa là đã xử lý.
 */
export const CASE_STATUS_TONE: Record<CaseStatus, 'danger' | 'warn' | 'ok'> = {
  open: 'danger', in_progress: 'warn', done: 'ok',
};

// ---------------------------------------------------------------- Họp tuần

/** Ba nhóm báo cáo cho chi nhánh (chốt theo DANH MỤC của workbook họp). */
export const BRANCH_REPORT_CATEGORIES = [
  { key: 'teachers', label: 'Giáo viên', hint: 'Thái độ làm việc, chất lượng giảng dạy' },
  // Vấn đề vận hành đến từ cả hai phía, nên một nhóm chung thay vì tách hai module.
  { key: 'students', label: 'Học sinh / Phụ huynh', hint: 'Lịch học, thái độ, lực học, phản hồi từ phụ huynh' },
  { key: 'curriculum', label: 'Giáo trình', hint: 'Mức độ phù hợp, đề xuất điều chỉnh' },
] as const;

/** Tutor part-time là đơn vị báo cáo riêng, không phải chi nhánh thứ sáu. */
export const TUTOR_REPORT_CATEGORIES = [
  { key: 'tutor_count', label: 'Số lượng tutor', hint: '' },
  { key: 'tutor_quality', label: 'Chất lượng dạy học', hint: '' },
  { key: 'tutor_other', label: 'Các vấn đề khác', hint: '' },
] as const;

export const UNIT_STATUSES = ['ok', 'watch', 'problem'] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];
export const UNIT_STATUS_LABEL: Record<UnitStatus, string> = {
  ok: 'Ổn', watch: 'Cần theo dõi', problem: 'Có vấn đề',
};

export const TASK_TYPES = ['in_period', 'long_term'] as const;
export type TaskType = (typeof TASK_TYPES)[number];
export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  in_period: 'Trong kỳ', long_term: 'Dài hạn',
};

export const TASK_PROGRESS = ['not_started', 'doing', 'done', 'paused'] as const;
export type TaskProgress = (typeof TASK_PROGRESS)[number];
export const TASK_PROGRESS_LABEL: Record<TaskProgress, string> = {
  not_started: 'Chưa bắt đầu', doing: 'Đang làm', done: 'Hoàn thành', paused: 'Tạm dừng',
};

export type DueState = 'overdue' | 'due_soon' | 'on_track' | 'no_due' | 'closed';
export const DUE_LABEL: Record<DueState, string> = {
  overdue: 'Quá hạn', due_soon: 'Sắp đến hạn', on_track: 'Trong hạn',
  no_due: 'Chưa có hạn', closed: 'Đã đóng',
};

// ---------------------------------------------------------------- Quyền

/*
 * Bốn nhóm tài khoản.
 *
 * `system_admin` là người quản trị PHẦN MỀM (tài khoản, vai trò, cấu hình).
 * `branch_admin` là nhân sự VĂN PHÒNG của chi nhánh: quản danh sách lớp, giáo viên và
 * tổng hợp việc trung gian giữa các phòng ban. Hai vai trò này khác hẳn nhau nên không
 * dùng chung chữ "Admin" trong nhãn hiển thị.
 */
export const ROLES = ['system_admin', 'branch_admin', 'manager', 'teacher'] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = {
  system_admin: 'Quản trị hệ thống', branch_admin: 'Admin chi nhánh',
  manager: 'Quản lý', teacher: 'Giáo viên',
};

export const PERMISSIONS = {
  // --- Lịch: tuần và ngày là hai quyền KHÁC NHAU ---
  /** Chốt và đổi TUẦN kế hoạch của một lượt MT. Việc của Quản lý. */
  PLAN_WEEK: 'plan.week',
  /** Chốt và đổi NGÀY–GIỜ trong tuần đã được duyệt. Việc của Admin chi nhánh. */
  SCHEDULE_DATE: 'schedule.date',
  /** Đổi riêng lịch Speaking. Giáo viên Speaking được cấp trong phạm vi phân công. */
  SCHEDULE_SPEAKING: 'schedule.speaking',
  ATTEMPT_CANCEL: 'attempt.cancel',
  /** Đánh dấu một kỹ năng là KHÔNG MOCK cho chính lượt đó. */
  ATTEMPT_SKIP_SKILL: 'attempt.skip_skill',
  /** Đặt hạn nhập điểm khác mặc định. */
  DEADLINE_OVERRIDE: 'deadline.override',

  // --- Điểm và đánh giá ---
  ATTEMPT_VIEW: 'attempt.view',
  /** Nhập điểm ĐÚNG kỹ năng được phân công. Không kèm quyền sửa lịch. */
  SCORE_EDIT: 'score.edit',
  /** Nhập bù / sửa điểm NGOÀI phân công. Tách riêng để còn siết lại được — xem O05. */
  SCORE_OVERRIDE: 'score.override',
  /** Giáo viên cập nhật đánh giá của kỹ năng mình phụ trách. */
  ESTIMATE_EDIT: 'estimate.edit',

  // --- Sau đánh giá ---
  SOS_EDIT: 'sos.edit',
  /** Kết thúc theo dõi một case. GVCN của lớp và Quản lý — không phải mọi giáo viên. */
  CASE_CLOSE: 'case.close',

  // --- Hồ sơ và vận hành ---
  STUDENT_VIEW: 'student.view',
  STUDENT_EDIT: 'student.edit',
  MEETING_VIEW: 'meeting.view',
  MEETING_EDIT: 'meeting.edit',
  ADMIN_CONFIG: 'admin.config',
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABEL: Record<string, string> = {
  'plan.week': 'Chốt tuần kế hoạch MT',
  'schedule.date': 'Chốt ngày giờ trong tuần',
  'schedule.speaking': 'Đổi lịch Speaking',
  'attempt.cancel': 'Huỷ lượt MT',
  'attempt.skip_skill': 'Đánh dấu kỹ năng không mock',
  'deadline.override': 'Đặt hạn nhập điểm riêng',
  'attempt.view': 'Xem lịch và kết quả MT',
  'score.edit': 'Nhập điểm kỹ năng được phân công',
  'score.override': 'Nhập bù điểm ngoài phân công',
  'estimate.edit': 'Cập nhật Đánh giá GV',
  'sos.edit': 'Ghi nhận xử lý case học vụ',
  'case.close': 'Đóng case học vụ',
  'student.view': 'Xem hồ sơ học viên',
  'student.edit': 'Sửa hồ sơ học viên',
  'meeting.view': 'Xem tiến trình công việc',
  'meeting.edit': 'Cập nhật báo cáo và ghi chú',
  'admin.config': 'Quản trị hệ thống',
};

/** Sự kiện hành trình học viên. Bộ lọc chỉ có 3 lựa chọn, xem JOURNEY_FILTERS. */
export const JOURNEY_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'warning', label: 'Warning / WL' },
] as const;

export const JOURNEY_EVENT_LABEL: Record<string, string> = {
  enrollment: 'Vào lớp',
  transfer: 'Chuyển lớp',
  pause: 'Tạm dừng học',
  resume: 'Quay lại học',
  finish: 'Kết thúc học',
  cycle_start: 'Bắt đầu lộ trình',
  repeat: 'Học tiếp lộ trình',
  exam_date_changed: 'Đổi ngày thi IELTS',
  mock_scheduled: 'Lên kế hoạch MT',
  mock_rescheduled: 'Đổi lịch MT',
  mock_cancelled: 'Huỷ lượt MT',
  mock_result: 'Kết quả MT',
  estimate: 'Đánh giá GV',
  warning: 'Cảnh báo',
  wl: 'Warning Letter',
};

/** Nhóm sự kiện theo bộ lọc — giữ đúng ba lựa chọn đã chốt. */
export const JOURNEY_GROUP: Record<string, 'assessment' | 'warning' | 'other'> = {
  mock_result: 'assessment',
  estimate: 'assessment',
  warning: 'warning',
  wl: 'warning',
};
