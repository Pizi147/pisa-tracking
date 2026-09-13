/** CASE — hạng mục, phân loại nguyên nhân, phương án, phê duyệt và kết quả. */

import { ENTRY_SKILLS, ENTRY_SKILL_LABEL, type EntrySkill } from './skills.ts';

// ------------------------------------------------ Mạch theo dõi và phân loại vấn đề

/**
 * HAI ĐẦU MỤC, KHÔNG HƠN.
 *
 * Mọi việc theo dõi một học viên rơi vào đúng một trong hai: HỌC THUẬT (theo kỹ năng) hoặc
 * Ý THỨC. Vấn đề về giáo viên và về giáo trình KHÔNG còn ở đây — đó không phải vấn đề của
 * học viên, và nay nằm ở Báo cáo tuần chi nhánh, nơi vốn đã có sẵn đúng ba nhóm ấy.
 * (Owner chốt 10/09/2026, đảo một phần quyết định cũ về ba nhóm gốc.)
 */
export const THREAD_TRACKS = ['academic', 'behaviour'] as const;
export type ThreadTrack = (typeof THREAD_TRACKS)[number];
export const THREAD_TRACK_LABEL: Record<ThreadTrack, string> = {
  academic: 'Học thuật',
  behaviour: 'Ý thức',
};

/**
 * Ý THỨC chỉ có bốn nhóm, và bốn nhóm này CHÍNH LÀ chủ đề của mạch — không có tầng chi
 * tiết bên dưới. "Em hay nghỉ học" đã đủ để bắt đầu làm việc; ép chọn thêm một nhánh con
 * chỉ làm chậm người ghi mà không thêm thông tin nào dùng được.
 */
export const BEHAVIOUR_TOPICS = ['attendance', 'homework', 'participation', 'other'] as const;
export type BehaviourTopic = (typeof BEHAVIOUR_TOPICS)[number];
export const BEHAVIOUR_TOPIC_LABEL: Record<BehaviourTopic, string> = {
  attendance: 'Chuyên cần',
  homework: 'BTVN',
  participation: 'Tham gia trên lớp',
  other: 'Khác',
};

/**
 * Chủ đề của một mạch: kỹ năng nhập điểm với Học thuật, nhóm ý thức với Ý thức.
 *
 * Học thuật dùng NĂM ô L · R · W1 · W2 · S chứ không phải bốn kỹ năng có band: một giáo
 * viên chỉ dạy Task 2 thì việc hỗ trợ của họ phải nằm ở W2, không lẫn vào "Writing".
 */
export function threadTopicLabel(track: ThreadTrack, topic: string): string {
  return track === 'behaviour'
    ? BEHAVIOUR_TOPIC_LABEL[topic as BehaviourTopic] ?? topic
    : ENTRY_SKILL_LABEL[topic as EntrySkill] ?? topic;
}

export function threadTopicsOf(track: ThreadTrack): readonly string[] {
  return track === 'behaviour' ? BEHAVIOUR_TOPICS : ENTRY_SKILLS;
}

/**
 * SÁU HẠNG MỤC — ĐƠN VỊ CỦA MỘT CASE TỪ VÒNG 4.
 *
 *     một case = MỘT HỌC VIÊN × MỘT HẠNG MỤC
 *
 * Đây là thay đổi nền của vòng 4, đảo lại vòng 3a. Trước đây case gắn với MỘT LƯỢT MT ×
 * MỘT KỸ NĂNG: thi ba lần trượt Listening ba lần thì sinh ba case rời rạc, mở cái nào cũng
 * không biết đã làm gì cho em. Nay một cặp (học viên, hạng mục) chỉ có MỘT case sống suốt
 * khoá; MT sau trượt lại thì ghi thêm một MỐC vào chính case đó.
 *
 * Bốn nhóm ý thức (chuyên cần, BTVN, tham gia, khác) KHÔNG còn là hạng mục riêng — chúng
 * gộp chung vào hạng mục `behaviour` và chỉ còn là mô tả bên trong case. Lý do: chúng luôn
 * được xử lý bằng cùng một bộ phương án (gặp em, gặp phụ huynh), nên tách ra thành bốn mạch
 * sống song song chỉ làm bảng dài ra mà không đổi việc phải làm.
 */
export const CASE_CATEGORIES = [
  'listening', 'reading', 'writing1', 'writing2', 'speaking', 'behaviour',
] as const;
export type CaseCategory = (typeof CASE_CATEGORIES)[number];

export const CASE_CATEGORY_LABEL: Record<CaseCategory, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing1: 'Writing 1',
  writing2: 'Writing 2',
  speaking: 'Speaking',
  behaviour: 'Ý thức/Khác',
};
export const CASE_CATEGORY_SHORT: Record<CaseCategory, string> = {
  listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', speaking: 'S',
  behaviour: 'Ý thức',
};

/**
 * Lớp Normal quy về CÙNG sáu hạng mục, để mọi bảng tổng hợp dùng chung một bộ cột.
 *
 *   Pronunciation (lớp FOU)  → Speaking
 *   W của lớp Normal         → Writing 2
 *
 * Quy tắc thứ hai là chữ của owner: Writing ở trình độ Normal là viết đoạn/bài, gần Task 2
 * hơn Task 1. Đây là ánh xạ ĐỂ GOM BÁO CÁO, không đổi cách chấm của lớp Normal.
 */
const REGULAR_TO_CATEGORY: Record<string, CaseCategory> = {
  listening: 'listening',
  reading: 'reading',
  writing: 'writing2',
  prep_writing: 'writing2',   // tên cũ, còn trong dữ liệu chưa di trú
  pronunciation: 'speaking',
  speaking: 'speaking',
};

/** Đưa một chủ đề bất kỳ (kỹ năng FT, kỹ năng lớp Normal, nhóm ý thức) về đúng một hạng mục. */
export function categoryOf(track: string | null | undefined, topic: string | null | undefined): CaseCategory | null {
  if (track === 'behaviour') return 'behaviour';
  if (!topic) return null;
  if ((CASE_CATEGORIES as readonly string[]).includes(topic)) return topic as CaseCategory;
  return REGULAR_TO_CATEGORY[topic] ?? null;
}

export function caseCategoryLabel(category: string | null | undefined): string {
  return CASE_CATEGORY_LABEL[category as CaseCategory] ?? String(category ?? '—');
}

/**
 * KHOÁ CHỐNG TRÙNG của một case — MỘT chỉ mục duy nhất thay cho bốn chỉ mục một phần.
 *
 * Bốn quy tắc gộp khác nhau cùng tồn tại, và nếu mỗi quy tắc một chỉ mục duy nhất một phần
 * thì mọi câu `ON CONFLICT` phải chép lại đúng mệnh đề `WHERE` của chỉ mục đó — cái bẫy đã
 * làm mất thời gian ở vòng trước. Nên gói cả bốn vào MỘT chuỗi, và chỉ cần MỘT chỉ mục.
 *
 *   a:{học viên}:{lộ trình}:{hạng mục}   case học thuật chính — sống suốt khoá
 *   bt:{học viên}:{lộ trình}             case Ý thức do giáo viên báo — cũng sống suốt khoá
 *   bm:{lượt MT}                         case Ý thức tự sinh sau một đợt MT — chết theo lượt
 *   null                                 case mở SONG SONG có chủ ý (xem cảnh báo case trùng)
 *
 * `null` không vướng chỉ mục duy nhất vì SQLite coi mỗi NULL là một giá trị khác nhau —
 * đúng thứ cần cho case song song: hợp lệ, nhưng phải là quyết định có ý thức của người mở.
 */
export function caseDedupKey(input: {
  track: string; category: CaseCategory | null; originKind: string;
  studentId: number | null; cycleId: number | null; attemptId: number | null;
  parallel?: boolean;
}): string | null {
  if (input.parallel) return null;
  if (input.track === 'behaviour') {
    if (input.originKind === 'mock') {
      return input.attemptId ? `bm:${input.attemptId}` : null;
    }
    return input.studentId ? `bt:${input.studentId}:${input.cycleId ?? 0}` : null;
  }
  if (!input.studentId || !input.category) return null;
  return `a:${input.studentId}:${input.cycleId ?? 0}:${input.category}`;
}

/**
 * MỐC trong vòng đời một case. Case sống suốt khoá nên phải đọc được nó đã đi qua những gì.
 *
 * `repeat` và `recurrence` khác nhau ở chỗ case lúc đó đang mở hay đã đóng — và đó là khác
 * biệt người dùng cần thấy: "vẫn chưa ăn thua" khác hẳn "tưởng xong rồi mà hỏng lại".
 */
export const MILESTONE_KINDS = [
  'opened', 'repeat', 'recurrence', 'passed', 'closed', 'extended',
] as const;
export type MilestoneKind = (typeof MILESTONE_KINDS)[number];
export const MILESTONE_KIND_LABEL: Record<MilestoneKind, string> = {
  opened: 'Mở case',
  repeat: 'Trượt lại',
  recurrence: 'Tái phát',
  passed: 'Đã đạt kỳ vọng',
  closed: 'Chốt kết quả',
  extended: 'Kéo dài theo dõi',
};

/**
 * TÊN CASE TỰ SINH, cập nhật theo MỐC MỚI NHẤT.
 *
 * Suy lúc hiển thị chứ không ghi vào database: sửa điểm thì tên đổi theo, không để lại một
 * cái tên cũ nói sai sự thật. Tiền tố MT{n} là cách nhận ra case sinh từ điểm; case do giáo
 * viên tự báo không có tiền tố.
 */
export function caseTitle(c: {
  category: string | null; latestAttemptNo?: number | null;
  originKind?: string | null; failedCount?: number | null;
}): string {
  const label = caseCategoryLabel(c.category);
  const prefix = c.latestAttemptNo ? `MT${c.latestAttemptNo} - ` : '';
  if (c.category === 'behaviour' && c.originKind === 'mock') {
    /*
     * CASE Ý THỨC SINH SAU MỘT ĐỢT MT CÓ SOS — việc của nó là hai lần trao đổi bắt buộc.
     *
     * Bản trước đặt tên là "MT1 - 1 kỹ năng dưới kỳ vọng", và trên bảng case dòng đó nằm
     * cạnh một ô kỹ năng ghi "Khác" — đọc lên thành hai câu đá nhau, còn người đọc thì
     * không biết mình phải làm gì với nó. Tên mới nói đúng VIỆC: trao đổi sau đợt SOS đó.
     */
    const n = c.failedCount ?? 0;
    return `${prefix}Trao đổi sau SOS ${n}`;
  }
  if (c.category === 'behaviour') return 'Ý thức/Khác';
  return `${prefix}${label} dưới kỳ vọng`;
}

/**
 * KẾT QUẢ CHUNG CỦA CẢ CASE — bốn mức bấm nhanh, owner chọn 13/09/2026.
 *
 * Khác với `FOLLOWUP_OUTCOMES` (quan sát sau MỘT phương án), đây là kết luận cho CẢ case
 * sau khi mọi phương án đã có kết quả. Bốn mức cố định để sau này trả lời được câu hỏi
 * "phương án nào hay ăn thua", thứ mà một ô gõ tự do không bao giờ trả lời được.
 */
export const CASE_OUTCOMES = ['much_better', 'improved', 'unchanged', 'worse'] as const;
export type CaseOutcome = (typeof CASE_OUTCOMES)[number];
export const CASE_OUTCOME_LABEL: Record<CaseOutcome, string> = {
  much_better: 'Đã tốt hơn hẳn',
  improved: 'Có tiến bộ',
  unchanged: 'Chưa chuyển biến',
  worse: 'Tệ hơn',
};
export const CASE_OUTCOME_TONE: Record<CaseOutcome, 'ok' | 'info' | 'warn' | 'danger'> = {
  much_better: 'ok', improved: 'info', unchanged: 'warn', worse: 'danger',
};

/** Sau khi đã chấm mức độ thành công thì case đi đâu. */
export const CASE_DECISIONS = ['end', 'extend'] as const;
export type CaseDecision = (typeof CASE_DECISIONS)[number];
export const CASE_DECISION_LABEL: Record<CaseDecision, string> = {
  end: 'Kết thúc hẳn',
  extend: 'Kéo dài theo dõi + thêm phương án',
};

/**
 * BỘ PHÂN LOẠI NGUYÊN NHÂN — chỉ dùng cho mạch HỌC THUẬT.
 *
 * Mạch nói em vướng ở KỸ NĂNG nào (dữ liệu điểm biết được điều đó). Bộ này nói VÌ SAO, và
 * đó là nhận định của người dạy — hệ thống không tự chẩn đoán. Mỗi nhánh luôn có "Khác" để
 * không ép người ghi chọn bừa.
 *
 * Writing dùng CHUNG một bộ cho cả W1 và W2: bốn tiêu chí chấm là như nhau, chỉ khác đề bài.
 */
export type IssueNode = {
  /** Mã ỔN ĐỊNH. Đổi nhãn hiển thị được, đổi mã thì mất lịch sử. */
  code: string;
  label: string;
};

export type IssueBranch = {
  /** Khớp với chủ đề mạch. Writing dùng chung cho `writing1` và `writing2`. */
  key: 'listening' | 'reading' | 'writing' | 'speaking';
  label: string;
  items: IssueNode[];
};

const other = (code: string): IssueNode => ({ code, label: 'Khác' });

export const ISSUE_TAXONOMY: IssueBranch[] = [
  {
    key: 'listening', label: 'Listening',
    items: [
      { code: 'student.listening.language', label: 'Từ vựng / ngữ pháp' },
      { code: 'student.listening.technique', label: 'Kỹ năng làm bài' },
      { code: 'student.listening.sound', label: 'Cảm âm' },
      { code: 'student.listening.distractor', label: 'Hay dính bẫy distractors' },
      { code: 'student.listening.focus', label: 'Tâm lý / khả năng tập trung' },
      { code: 'student.listening.mainidea', label: 'Nghe hiểu ý chính' },
      other('student.listening.other'),
    ],
  },
  {
    key: 'reading', label: 'Reading',
    items: [
      { code: 'student.reading.language', label: 'Từ vựng / ngữ pháp' },
      { code: 'student.reading.technique', label: 'Kỹ năng làm bài' },
      { code: 'student.reading.mainidea', label: 'Mơ hồ ý chính' },
      { code: 'student.reading.logic', label: 'Tư duy logic' },
      other('student.reading.other'),
    ],
  },
  {
    key: 'writing', label: 'Writing',
    items: [
      { code: 'student.writing.task', label: 'Đáp ứng yêu cầu đề' },
      { code: 'student.writing.organisation', label: 'Tổ chức bài / liên kết ý' },
      { code: 'student.writing.lexical', label: 'Từ vựng' },
      { code: 'student.writing.grammar', label: 'Ngữ pháp' },
      other('student.writing.other'),
    ],
  },
  {
    key: 'speaking', label: 'Speaking',
    items: [
      { code: 'student.speaking.fluency', label: 'Trôi chảy / mạch lạc' },
      { code: 'student.speaking.lexical', label: 'Từ vựng' },
      { code: 'student.speaking.grammar', label: 'Ngữ pháp' },
      { code: 'student.speaking.pronunciation', label: 'Phát âm' },
      other('student.speaking.other'),
    ],
  },
];

const ISSUE_INDEX: Record<string, { label: string; branch: IssueBranch['key'] }> = {};
for (const b of ISSUE_TAXONOMY) {
  for (const it of b.items) ISSUE_INDEX[it.code] = { label: it.label, branch: b.key };
}

export function issueLabel(code: string | null | undefined): string {
  if (!code) return 'Chưa phân loại';
  return ISSUE_INDEX[code]?.label ?? code;
}

/** Nhánh phân loại của một mã. NULL nghĩa là mã không còn dùng — không đoán bừa. */
export function issueBranchOf(code: string | null | undefined): IssueBranch['key'] | null {
  return code ? ISSUE_INDEX[code]?.branch ?? null : null;
}

/** Bộ phân loại dùng được cho một chủ đề mạch. W1 và W2 cùng dùng bộ Writing. */
export function issuesForTopic(topic: string): IssueNode[] {
  const key = topic === 'writing1' || topic === 'writing2' ? 'writing' : topic;
  return ISSUE_TAXONOMY.find((b) => b.key === key)?.items ?? [];
}

/**
 * CHUYỂN MÃ CŨ SANG MÃ MỚI.
 *
 * Giữ lại để dữ liệu cũ đọc được và để bước nâng cấp chạy đúng một lần. Hai dòng đầu của
 * mỗi nhánh là SUY ĐOÁN chứ không phải ánh xạ hiển nhiên — owner đã được báo trước:
 * "nghe chi tiết / số liệu / chính tả" gần với CẢM ÂM nhất, còn "tìm chi tiết / paraphrase"
 * của Reading thực chất là chuyện TỪ VỰNG.
 */
export const LEGACY_ISSUE_CODE_MAP: Record<string, string> = {
  'student.listening.detail': 'student.listening.sound',
  'student.listening.recognition': 'student.listening.sound',
  'student.listening.follow': 'student.listening.distractor',
  'student.listening.strategy': 'student.listening.technique',
  'student.reading.detail': 'student.reading.language',
  'student.reading.structure': 'student.reading.mainidea',
  'student.reading.inference': 'student.reading.logic',
  'student.reading.strategy': 'student.reading.technique',
};

/**
 * "Hoàn cảnh kèm theo" đã BỎ (owner chốt 10/09/2026) — thay bằng một ô Ghi chú không bắt
 * buộc. Bắt người ghi chọn hoàn cảnh từ một danh sách là thêm một bước cho thứ mà một câu
 * chữ nói rõ hơn nhiều.
 */
export const ISSUE_ROLES = ['primary', 'secondary'] as const;
export type IssueRole = (typeof ISSUE_ROLES)[number];
export const ISSUE_ROLE_LABEL: Record<IssueRole, string> = {
  primary: 'Vấn đề chính', secondary: 'Yếu tố đi kèm',
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

/**
 * HAI HỌ VIỆC, TÁCH BẠCH — và chính sự tách bạch đó bỏ được một câu hỏi cho giáo viên.
 *
 * PHƯƠNG ÁN HỖ TRỢ là việc giáo viên tự xoay được. ĐỀ XUẤT là việc phải có Quản lý trả
 * lời — lùi lịch thi, xin nguồn lực ngoài định mức, mời CX/GĐCN vào cuộc. Vì chọn nhóm
 * Đề xuất TỨC LÀ đang xin ý kiến, ô tick "cần Quản lý duyệt" chỉ còn hiện ở nhóm thứ nhất.
 *
 * Đã bỏ: `meeting` và `ops_policy` (owner chốt 10/09/2026; việc lùi lịch thi nay có ô riêng
 * trong nhóm Đề xuất).
 *
 * HỌ THỨ BA, quay lại từ vòng 4: TRAO ĐỔI. Vòng 3a từng đưa `talk_student` và `talk_parent`
 * ra một bảng riêng, tách hẳn khỏi việc học. Vòng 4 đảo lại: chúng là HAI PHƯƠNG ÁN của
 * case "Ý thức/Khác", vì nói cho cùng chúng cũng là việc phải làm cho một em, có người thực
 * hiện và có ngày thực hiện — đúng thứ bảng phương án vốn đã tả được. Tách ra hai bảng chỉ
 * khiến mọi màn hình phải hỏi hai nơi rồi cộng lại, và sẽ có chỗ cộng thiếu.
 *
 * Khác với phương án học thuật, phương án trao đổi thường chỉ cần ĐÃ HOÀN THÀNH + NGÀY
 * THỰC HIỆN, ghi chú tuỳ chọn — không duyệt, không hẹn xem lại.
 */
export const SUPPORT_KINDS = ['self_study', 'tutor', 'teaching_adjust', 'other'] as const;
export const CONTACT_KINDS = ['talk_student', 'talk_parent'] as const;
export const PROPOSAL_KINDS = ['reschedule_mt', 'extra_support', 'meeting_cx', 'other_proposal'] as const;
export const INTERVENTION_KINDS = [...SUPPORT_KINDS, ...CONTACT_KINDS, ...PROPOSAL_KINDS] as const;
export type InterventionKind = (typeof INTERVENTION_KINDS)[number];
export const INTERVENTION_KIND_LABEL: Record<InterventionKind, string> = {
  self_study: 'Xếp tự học',
  tutor: 'Học tutor',
  teaching_adjust: 'Điều chỉnh cách dạy',
  other: 'Khác',
  talk_student: 'Trao đổi với học viên',
  talk_parent: 'Trao đổi với phụ huynh',
  reschedule_mt: 'Lùi lịch thi',
  extra_support: 'Hỗ trợ học thuật ngoài định mức',
  meeting_cx: 'Meeting CX / GĐCN',
  other_proposal: 'Khác',
};

/**
 * Phương án trao đổi chỉ cần xác nhận ĐÃ DIỄN RA — không có kết quả chuyên môn để ghi,
 * nên giao diện của nó gọn hơn hẳn phương án học thuật.
 */
export function isContactKind(kind: string): boolean {
  return (CONTACT_KINDS as readonly string[]).includes(kind);
}

/** Chọn một loại trong nhóm Đề xuất TỨC LÀ đang xin ý kiến — không phải tick thêm gì. */
export function isProposalKind(kind: string): boolean {
  return (PROPOSAL_KINDS as readonly string[]).includes(kind);
}

/** Chuyển loại cũ sang loại mới, để 26 bản ghi đã có không mất nghĩa. */
export const LEGACY_INTERVENTION_KIND_MAP: Record<string, InterventionKind> = {
  meeting: 'meeting_cx',
  ops_policy: 'other_proposal',
};

/**
 * HAI VIỆC TRAO ĐỔI BẮT BUỘC KHI CÓ SOS — nay là hai PHƯƠNG ÁN của case Ý thức/Khác,
 * không còn là một bảng riêng. Xem khối `INTERVENTION_KINDS` ở trên.
 *
 * Nhãn dài ghi rõ AI làm, vì đó là thứ hay bị hiểu nhầm: việc gặp em là của GVCN và GVBM,
 * còn việc gọi phụ huynh là của bộ phận CS.
 */
export type ContactKind = (typeof CONTACT_KINDS)[number];
export const CONTACT_KIND_LABEL: Record<ContactKind, string> = {
  talk_student: 'GVCN + GVBM trao đổi với học viên',
  talk_parent: 'CS trao đổi với phụ huynh',
};
export const CONTACT_KIND_SHORT: Record<ContactKind, string> = {
  talk_student: 'Trao đổi với học viên',
  talk_parent: 'Trao đổi với phụ huynh',
};

/**
 * PHƯƠNG ÁN TỰ SINH THEO MỨC SOS — quy định cũ của trung tâm, owner xác nhận giữ 10/09/2026.
 *
 * Từ MT3 trở đi luôn là tutor bất kể mức: gần ngày thi thì tự học không kịp sửa.
 * Phương án sinh ra ở trạng thái ĐÃ LÊN KẾ HOẠCH, chưa có người thực hiện, chưa gửi duyệt —
 * máy không tự đặt tutor thay người, nó chỉ nói "theo quy định em này phải có cái này".
 */
export function autoSupportKind(sosLevel: number, attemptNo: number): 'self_study' | 'tutor' {
  if (attemptNo >= 3) return 'tutor';
  return sosLevel >= 3 ? 'tutor' : 'self_study';
}

/**
 * Mức ưu tiên suy ra từ SOS. SUY LÚC HIỂN THỊ, không ghi vào case — xem Q11.
 *
 * Ba mức SOS ánh xạ MỘT–MỘT sang ba mức gấp, theo đúng bảng 3.1 của tài liệu chốt vòng 4:
 * SOS 1 → 7 ngày · SOS 2 → 5 ngày · SOS 3 → 3 ngày. Bản trước gộp SOS 1 và SOS 2 vào cùng
 * mức "cần chú ý", nên một em trượt đúng một kỹ năng bị thúc gấp như em trượt hai kỹ năng.
 */
export function urgencyFromSos(sosLevel: number | null): 'normal' | 'attention' | 'urgent' {
  if (sosLevel === null || sosLevel <= 0) return 'normal';
  if (sosLevel >= 3) return 'urgent';
  return sosLevel === 2 ? 'attention' : 'normal';
}

/**
 * PHƯƠNG ÁN HỖ TRỢ CÓ CẦN QUẢN LÝ DUYỆT KHÔNG — do CHÍNH giáo viên quyết định.
 *
 * Giáo viên là người biết rõ nhất việc mình định làm có tự xoay được hay cần trung tâm
 * đứng sau: trao đổi với em sau buổi học thì làm luôn, còn xếp tutor hay lùi lịch thi thì
 * phải có người quyết. Bắt duyệt hết là biến phần mềm thành cửa xin phép; không duyệt gì
 * thì những việc tốn tiền lại không ai chịu trách nhiệm.
 *
 * Việc hỗ trợ thật diễn ra NGOÀI phần mềm, nên "chờ duyệt" không làm chậm điều gì — nó chỉ
 * để lại dấu vết ai đang chờ ai, và chờ bao lâu.
 */
export const APPROVAL_STATES = ['pending', 'approved', 'declined'] as const;
export type ApprovalState = (typeof APPROVAL_STATES)[number];
export const APPROVAL_LABEL: Record<ApprovalState, string> = {
  pending: 'Đang chờ duyệt', approved: 'Đã duyệt', declined: 'Không duyệt',
};

/**
 * HẠN SUY THẲNG TỪ MỨC ĐỘ GẤP — một thang duy nhất cho cả hệ thống (owner chốt 10/09/2026).
 *
 * Trước đó có hai ngưỡng rời nhau: hạn Quản lý trả lời đề xuất (3 hoặc 7 ngày) và ngưỡng
 * coi một vấn đề là bị bỏ quên (cũng 3 hoặc 7). Hai con số nói cùng một chuyện — "việc này
 * gấp đến đâu" — nên nay dùng chung một bảng ba mức, và ai đọc cũng đoán đúng ngay.
 *
 * Vấn đề sinh từ điểm không tự ghi mức gấp vào database (hai thang cố tình tách nhau, xem
 * Q11); mức của nó suy từ SOS lúc cần: SOS 1-2 là cần chú ý, SOS 3 là gấp.
 *
 * Quá hạn KHÔNG chặn gì cả — chỉ nổi lên màn việc để không ai bị bỏ quên.
 */
export const URGENCY_DUE_DAYS: Record<UrgencyLevel, number> = {
  normal: 7,
  attention: 5,
  urgent: 3,
};

export function dueDaysFor(urgency: string | null | undefined, sosLevel?: number | null): number {
  const level = urgency && urgency !== 'normal' ? urgency : urgencyFromSos(sosLevel ?? null);
  return URGENCY_DUE_DAYS[level as UrgencyLevel] ?? URGENCY_DUE_DAYS.normal;
}

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
