/** CASE — hạng mục, phân loại nguyên nhân, phương án, phê duyệt và kết quả. */

import { ENTRY_SKILLS, ENTRY_SKILL_LABEL, type EntrySkill } from './skills.ts';
import { REGULAR_SKILLS } from './normal.ts';

// ------------------------------------------------ Chủ đề của một case học thuật

/**
 * CHỦ ĐỀ CASE THEO CHƯƠNG TRÌNH (F07) — MỘT hàm cho cả máy chủ (`reportIssue`,
 * `GET /students/:id/case-topics`) và form (`QuickReport.tsx`), để hai nơi không lệch bộ.
 *
 * `ratio` = lớp thường (chấm theo tỷ lệ đạt/tổng): bốn môn L · R · W · S, đúng thứ tự này.
 * Không phải lớp thường (Fast Track): năm ô L · R · W1 · W2 · S.
 */
export function caseTopicsFor(ratio: boolean): readonly string[] {
  return ratio ? REGULAR_SKILLS : ENTRY_SKILLS;
}

/*
 * CASE CHỈ CÒN LÀ HỌC THUẬT (chốt 21/09/2026, rule book mục 18).
 *
 * Trước đó mọi việc theo dõi một học viên rơi vào hai đầu mục — Học thuật và Ý thức — và cột `track` của `sos_cases` gọi tên
 * chúng. Ý thức nay là VI PHẠM và BIỆN PHÁP XỬ LÝ (`./yThuc.ts`): mỗi sự việc một dòng độc lập, không còn đợt, không còn hạn, không
 * còn "case Ý thức". Vì vậy `sos_cases` chỉ chứa case học thuật và KHÔNG còn cột `track`; nhóm chủ đề "Tham gia trên lớp" cũng đã
 * bỏ (dữ liệu cũ đổi sang "Thái độ / hành vi").
 */

/**
 * Chủ đề của một case = kỹ năng nhập điểm.
 *
 * Học thuật dùng NĂM ô L · R · W1 · W2 · S chứ không phải bốn kỹ năng có band: một giáo viên chỉ dạy Task 2 thì việc hỗ trợ của họ
 * phải nằm ở W2, không lẫn vào "Writing".
 */
export function caseTopicLabel(topic: string): string {
  return ENTRY_SKILL_LABEL[topic as EntrySkill] ?? topic;
}

/**
 * CÁC HẠNG MỤC — ĐƠN VỊ CỦA MỘT CASE TỪ VÒNG 4.
 *
 *     một case = MỘT HỌC VIÊN × MỘT HẠNG MỤC
 *
 * Đây là thay đổi nền của vòng 4, đảo lại vòng 3a. Trước đây case gắn với MỘT LƯỢT MT × MỘT KỸ NĂNG: thi ba lần trượt Listening ba
 * lần thì sinh ba case rời rạc, mở cái nào cũng không biết đã làm gì cho em. Nay một cặp (học viên, hạng mục) chỉ có MỘT case sống
 * suốt khoá; MT sau trượt lại thì ghi thêm một MỐC vào chính case đó.
 *
 * Hạng mục là KỸ NĂNG: Fast Track có năm (L · R · W1 · W2 · S), lớp Normal có bốn (L · R · W · S). Ý thức KHÔNG có hạng mục ở
 * đây — từ 21/09/2026 nó là vi phạm và biện pháp xử lý, không còn là một loại case.
 */
export const CASE_CATEGORIES = [
  'listening', 'reading', 'writing1', 'writing2', 'writing', 'speaking',
] as const;
export type CaseCategory = (typeof CASE_CATEGORIES)[number];

export const CASE_CATEGORY_LABEL: Record<CaseCategory, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing1: 'Writing Task 1',
  writing2: 'Writing Task 2',
  writing: 'Writing',
  speaking: 'Speaking',
};
/**
 * HẠNG MỤC CASE → KỸ NĂNG ĐƯỢC PHÂN CÔNG.
 *
 * Dùng để gợi ý người phụ trách case: case Reading thì gợi ý giáo viên đang dạy Reading của lớp đó.
 */
export const CASE_CATEGORY_SKILL: Record<string, string> = {
  listening: 'listening', reading: 'reading', speaking: 'speaking',
  writing1: 'writing1', writing2: 'writing2',
  /* Lớp Normal chỉ có MỘT môn Writing, và phân công cũng chỉ có một ô `writing`. */
  writing: 'writing',
};

export const CASE_CATEGORY_SHORT: Record<CaseCategory, string> = {
  listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', writing: 'W', speaking: 'S',
};

/**
 * HẠNG MỤC HIỆN RA TUỲ CHƯƠNG TRÌNH EM ĐANG HỌC.
 *
 * Fast Track chấm Writing thành hai bài riêng (Task 1 và Task 2, hai giáo viên khác nhau),
 * còn lớp Normal chỉ có MỘT môn Writing. Bày cả W1 lẫn W2 trên hồ sơ một em lớp Foundation
 * là bày hai dòng vĩnh viễn trống; bày một dòng W cho em lớp FT thì mất mất một nửa thông tin.
 * Nên mỗi bên thấy đúng bộ của mình.
 */
export const FT_CASE_CATEGORIES = [
  'listening', 'reading', 'writing1', 'writing2', 'speaking',
] as const;
export const NORMAL_CASE_CATEGORIES = [
  'listening', 'reading', 'writing', 'speaking',
] as const;

/** `ratio` = lớp Normal. Không rõ chương trình thì lấy bộ của Fast Track. */
export function caseCategoriesFor(scoringMode: string | null | undefined): readonly CaseCategory[] {
  return scoringMode === 'ratio' ? NORMAL_CASE_CATEGORIES : FT_CASE_CATEGORIES;
}

/**
 * BỘ TAB CỦA BẢNG PHÂN TÍCH VẤN ĐỀ — mục 13.4: Normal L/R/W/S, Fast Track L/R/W1/W2/S.
 *
 * Giao diện và máy chủ phải bày ĐÚNG MỘT bộ tab; hai nơi tự lọc lấy là cách để một hôm nào đó bảng có một tab mà máy chủ không trả
 * số nào. (Trước 21/09/2026 hàm này còn phải loại nhóm Ý thức ra; nay hạng mục chỉ còn kỹ năng nên nó trùng `caseCategoriesFor`,
 * giữ lại để nơi gọi không phải đổi.)
 */
export function issueBoardCategoriesFor(scoringMode: string | null | undefined): readonly CaseCategory[] {
  return caseCategoriesFor(scoringMode);
}

/**
 * CÁC THÀNH PHẦN CÓ THỂ GHI Ở PHẦN KẾT LUẬN CASE — mục 9.3, và luôn là TUỲ CHỌN.
 *
 * Trước vòng 7, phần kết luận mời người dùng chấm CẢ NĂM kỹ năng, kể cả khi case chỉ về
 * Listening. Kết quả là bốn ô trống vô nghĩa, hoặc tệ hơn, bốn con số bịa cho đủ form.
 *
 * Nay chỉ hiện đúng thành phần của KỸ NĂNG CASE ĐANG NÓI TỚI, và chỉ phần nào thật sự được
 * đánh giá mới phải điền. Đây là QUAN SÁT của người dạy lúc kết luận: nó KHÔNG ghi đè điểm
 * Test chính thức và không đổi mức SOS.
 *
 * Lớp Normal không áp rubric IELTS: W của Normal chấm theo bài của chương trình, nên không
 * có bộ bốn tiêu chí band ở đây.
 */
export const SKILL_COMPONENTS: Record<string, readonly string[]> = {
  listening: ['Section 1', 'Section 2', 'Section 3', 'Section 4'],
  reading: ['Passage 1', 'Passage 2', 'Passage 3'],
  writing1: ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'],
  writing2: ['Task Response', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'],
  speaking: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'],
};

/**
 * L/R ghi theo ĐƠN VỊ ĐẠT/TỔNG, không phải band.
 *
 * "Section 3: 5/10" là một câu đọc được. "Section 3: 5.0" thì người đọc sau ba tháng sẽ
 * tưởng em được band 5 ở Section 3 — một con số không tồn tại trong IELTS.
 */
export function componentsAreCounts(skill: string | null | undefined): boolean {
  return skill === 'listening' || skill === 'reading';
}

/** Thành phần chấm được của một hạng mục case; rỗng nghĩa là không có bộ nào để gợi ý. */
export function componentsFor(
  category: string | null | undefined,
  scoringMode?: string | null,
): readonly string[] {
  if (!category) return [];
  if (scoringMode === 'ratio') return componentsAreCounts(category) ? SKILL_COMPONENTS[category] ?? [] : [];
  return SKILL_COMPONENTS[category] ?? [];
}

/**
 * Môn của lớp Normal → hạng mục case.
 *
 * W CỦA NORMAL LÀ HẠNG MỤC RIÊNG, KHÔNG PHẢI W2 CỦA FAST TRACK. Vòng 4 từng gộp chúng để
 * bảng tổng hợp bớt một cột; owner bác bỏ ở vòng 5. Hai môn khác nhau: W2 là bài luận IELTS
 * chấm theo bốn tiêu chí band, W là bài viết của lớp Normal chấm theo điểm đạt/tổng điểm.
 * Cộng chúng vào một cột thì con số ấy không trả lời được câu hỏi nào.
 *
 * Hai mã dưới cùng là mã CŨ, chỉ để đọc dữ liệu chưa di trú.
 */
const REGULAR_TO_CATEGORY: Record<string, CaseCategory> = {
  listening: 'listening',
  reading: 'reading',
  writing: 'writing',
  speaking: 'speaking',
  prep_writing: 'writing',
  pronunciation: 'speaking',
};

/** Đưa một chủ đề bất kỳ (kỹ năng FT, kỹ năng lớp Normal) về đúng một hạng mục. */
export function categoryOf(topic: string | null | undefined): CaseCategory | null {
  if (!topic) return null;
  if ((CASE_CATEGORIES as readonly string[]).includes(topic)) return topic as CaseCategory;
  return REGULAR_TO_CATEGORY[topic] ?? null;
}

export function caseCategoryLabel(category: string | null | undefined): string {
  return CASE_CATEGORY_LABEL[category as CaseCategory] ?? String(category ?? '—');
}

/**
 * KHOÁ CHỐNG TRÙNG của một case — MỘT chỉ mục duy nhất, gói mọi quy tắc gộp vào một chuỗi để `ON CONFLICT` không phải chép lại
 * mệnh đề `WHERE` của từng chỉ mục một phần.
 *
 *   a:{học viên}:{lộ trình}:{hạng mục}   case học thuật — sống suốt khoá
 *   null                                 case mở SONG SONG có chủ ý (xem cảnh báo case trùng)
 *
 * (Trước 21/09/2026 còn hai dạng khoá cho case Ý thức — theo học viên và theo lượt MT; mô hình đó đã bỏ.)
 *
 * `null` không vướng chỉ mục duy nhất vì SQLite coi mỗi NULL là một giá trị khác nhau — đúng thứ cần cho case song song: hợp lệ,
 * nhưng phải là quyết định có ý thức của người mở.
 */
export function caseDedupKey(input: {
  category: CaseCategory | null;
  studentId: number | null; cycleId: number | null;
  parallel?: boolean;
}): string | null {
  if (input.parallel) return null;
  if (!input.studentId || !input.category) return null;
  return `a:${input.studentId}:${input.cycleId ?? 0}:${input.category}`;
}

/**
 * MỐC trong vòng đời một case. Case sống suốt khoá nên phải đọc được nó đã đi qua những gì.
 *
 * `repeat` và `recurrence` khác nhau ở chỗ case lúc đó đang mở hay đã đóng — và đó là khác
 * biệt người dùng cần thấy: "vẫn chưa đạt kết quả" khác hẳn "tưởng xong rồi mà hỏng lại".
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
 * cái tên cũ nói sai sự thật. Tiền tố (MT{n} với Fast Track, "Giữa khoá"/"Cuối khoá" với
 * lớp Normal) là cách nhận ra case sinh từ điểm; case do giáo viên tự báo không có tiền tố.
 */
export function caseTitle(c: {
  category: string | null; latestAttemptNo?: number | null;
  /** `mock` | `progress` | `final`. Lớp Normal KHÔNG được gọi bài của mình là "MT". */
  latestAttemptKind?: string | null;
}): string {
  const label = caseCategoryLabel(c.category);
  /*
   * TIỀN TỐ GỌI ĐÚNG TÊN BÀI. Trước vòng 5 mọi case đều mang tiền tố "MT{n}", kể cả case
   * sinh từ một bài Progress Test của lớp Foundation — người đọc thấy "MT1" ở một lớp
   * không hề có Mock Test nào.
   */
  const kind = c.latestAttemptKind ?? 'mock';
  const prefix = !c.latestAttemptNo ? ''
    : kind === 'final' ? 'Cuối khoá - '
    : kind === 'progress' ? 'Giữa khoá - '
    : `MT${c.latestAttemptNo} - `;
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
  much_better: 'Tiến bộ rõ',
  improved: 'Tiến bộ một phần',
  unchanged: 'Không tiến bộ',
  worse: 'Kém hơn',
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
  /** Một câu giải thích khi nhãn dễ bị hiểu lẫn với nhãn bên cạnh. */
  hint?: string;
};

export type IssueBranch = {
  /** Khớp với chủ đề mạch. Writing dùng chung cho `writing1` và `writing2`. */
  key: 'listening' | 'reading' | 'writing' | 'speaking';
  label: string;
  items: IssueNode[];
};

const other = (code: string): IssueNode => ({ code, label: 'Khác' });

/**
 * DANH MỤC PHÂN LOẠI VẤN ĐỀ — bộ của vòng 7 (mục 6.4).
 *
 * Đây là câu trả lời cho "vấn đề của em thuộc loại gì", và nó **bắt buộc** khi mở case:
 * không có phân loại thì case không vào được bảng tổng hợp nào, và ba tháng sau không ai
 * trả lời được "trung tâm mình hay vướng cái gì nhất".
 *
 * Bộ cũ bị THAY, không phải bổ sung. Để hai bộ cùng sống thì cùng một vấn đề sẽ được đếm
 * dưới hai cái tên và mọi báo cáo đều sai — mục 6.4 nói rõ điều này.
 */
export const ISSUE_TAXONOMY: IssueBranch[] = [
  {
    key: 'listening', label: 'Listening',
    items: [
      { code: 'student.listening.language', label: 'Từ vựng / ngữ pháp' },
      { code: 'student.listening.technique', label: 'Tư duy và kỹ năng làm bài' },
      { code: 'student.listening.focus', label: 'Tâm lý và độ tập trung' },
      {
        code: 'student.listening.sound',
        label: 'Ngôn ngữ',
        /*
         * "Ngôn ngữ" ở Listening KHÔNG phải vốn từ — nó là chuyện tai nghe ra được gì.
         * Không giải thích thì nó và "Từ vựng / ngữ pháp" sẽ bị chọn lẫn lộn, và hai hạng
         * mục lẫn nhau thì bảng tổng hợp mất nghĩa.
         */
        hint: 'Nhận diện âm, nối âm, trọng âm, tốc độ lời nói — khác với vốn từ và ngữ pháp.',
      },
      other('student.listening.other'),
    ],
  },
  {
    key: 'reading', label: 'Reading',
    items: [
      { code: 'student.reading.language', label: 'Từ vựng / ngữ pháp' },
      { code: 'student.reading.technique', label: 'Kỹ năng làm bài' },
      { code: 'student.reading.logic', label: 'Tư duy logic' },
      { code: 'student.reading.time', label: 'Quản lý thời gian' },
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

/**
 * Bộ phân loại dùng được cho một chủ đề.
 *
 * W1 và W2 cùng dùng bộ Writing — hai task chấm riêng nhưng nguyên nhân thì cùng một họ.
 */
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
/**
 * HAI MỨC, KHÔNG BA (mục 6.3). "Bình thường" đã bỏ.
 *
 * Lý do bỏ: một vấn đề đã được mở thành case thì tự nó đã là việc phải làm — gắn nhãn "bình
 * thường" cho nó chỉ nói được một điều là người báo không muốn chọn gì cả. Và vì nó là mặc
 * định nên gần như mọi case đều mang nhãn đó, khiến cột Mức độ không phân biệt được gì.
 *
 * Hai mức còn lại đều DẪN TỚI MỘT HẠN KHÁC NHAU, nên chúng có việc để làm.
 */
export const URGENCY_LEVELS = ['attention', 'urgent'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

/** Mức mặc định khi người báo không chọn gì — vẫn là một mức có hạn, không phải "không sao". */
export const DEFAULT_URGENCY: UrgencyLevel = 'attention';

/**
 * Nhãn CÓ CẢ MỨC ĐÃ BỎ, để dữ liệu và nhật ký cũ đọc ra được chữ chứ không ra mã thô.
 * Danh sách chọn thì chỉ lấy từ `URGENCY_LEVELS`.
 */
export const URGENCY_LABEL: Record<string, string> = {
  /*
   * ĐỔI TÊN 21/09/2026 (rulebook v3, T7): mức `attention` đổi tên hiển thị thành "Bình thường" (lịch sử tên cũ: xem plan.md mục 14). Chỉ đổi CHỮ:
   * mã `attention` giữ nguyên. Mức cũ `normal` (đã chuyển sang `attention` khi nâng cấp) đọc ra cùng chữ, không ra mã thô.
   */
  normal: 'Bình thường', attention: 'Bình thường', urgent: 'Gấp',
};
export const URGENCY_TONE: Record<string, 'neutral' | 'warn' | 'danger'> = {
  /* PR-N1 A8: "Bình thường" không tô màu cảnh báo — chỉ "Gấp" có màu. */
  normal: 'neutral', attention: 'neutral', urgent: 'danger',
};

// ---------------------------------------------------------------- Ý thức KHÔNG còn nằm ở đây

/*
 * HẾT HIỆU LỰC 21/09/2026: cửa sổ gộp báo cáo Ý thức ba ngày (C03), hạn hoàn thành case Ý thức 7 ngày, luật "đợt Ý thức đã đóng thì
 * tạo đợt mới liên kết" (C04) và cột `episode_no`. Lý do: rule book mục 18 bỏ hẳn mô hình Case Ý thức — mỗi vi phạm là một dòng
 * độc lập, không còn đợt để gộp hay để đóng. Hằng số C03/C04 ở `policy.ts` được GIỮ kèm chú thích hết hiệu lực, không xoá dấu vết.
 */

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
 * HỆ THỐNG TỰ ĐÓNG CASE — S16 (em kết thúc khoá) và S17 (em đổi chương trình), chủ sản phẩm chốt 21/09/2026 đêm; §3.9 bảng luật lộ
 * trình thêm chiều lớp thường → FT. Case đóng kiểu này KHÔNG có kết quả: việc đóng không phải một kết quả hỗ trợ, và PA bị huỷ vì nó
 * không tính. PA đã xong có kết quả thật trước đó VẪN tính hiệu quả (planning review 22/09, Q7). Lịch sử giữ nguyên.
 * Chữ "lớp thường" thay "Normal" theo đặc tả §2 (không viết "Normal" trên màn).
 */
export const SYSTEM_CLOSE_REASONS = ['course_ended', 'moved_to_normal', 'moved_to_ft'] as const;
export type SystemCloseReason = (typeof SYSTEM_CLOSE_REASONS)[number];
export const SYSTEM_CLOSE_REASON_LABEL: Record<SystemCloseReason, string> = {
  course_ended: 'Học viên kết thúc khoá',
  moved_to_normal: 'Chuyển sang lớp thường',
  moved_to_ft: 'Chuyển sang Fast Track',
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
 * HỌ THỨ BA (gặp em, gọi phụ huynh, thư cảnh cáo) TỪNG LÀ phương án của case Ý thức/Khác — HẾT HIỆU LỰC 21/09/2026: Ý thức không
 * còn là case nên không còn phương án; việc đó nay là BIỆN PHÁP XỬ LÝ (`./yThuc.ts`), một bảng riêng nối nhiều–nhiều với vi phạm.
 *
 * `meeting_cx` và `reschedule_mt` còn ở `PROPOSAL_KINDS` chỉ để ĐỌC dữ liệu cũ; form của case học thuật không còn cho chọn chúng.
 */
export const SUPPORT_KINDS = ['self_study', 'tutor', 'teaching_adjust', 'extra_homework', 'other'] as const;
export const PROPOSAL_KINDS = ['reschedule_mt', 'extra_support', 'meeting_cx', 'other_proposal'] as const;
export const INTERVENTION_KINDS = [...SUPPORT_KINDS, ...PROPOSAL_KINDS] as const;
export type InterventionKind = (typeof INTERVENTION_KINDS)[number];
export const INTERVENTION_KIND_LABEL: Record<InterventionKind, string> = {
  self_study: 'Xếp tự học',
  tutor: 'Học tutor',
  teaching_adjust: 'Điều chỉnh cách dạy',
  extra_homework: 'Tăng cường bài tập',
  /* Mã cũ: "Khác" tự thực hiện đã bỏ khỏi danh sách chọn (mục 8.1), giữ để đọc dữ liệu cũ. */
  other: 'Khác (mục cũ)',
  reschedule_mt: 'Lùi lịch thi',
  extra_support: 'Hỗ trợ học thuật',
  /* Giữ ĐÚNG chức danh của trung tâm, không tự đổi thành "Ban giám đốc" hay tên khác. */
  meeting_cx: 'Meeting CX / GĐCN',
  other_proposal: 'Khác',
};

/**
 * DANH MỤC PHƯƠNG ÁN CỦA CASE HỌC THUẬT (mục 8.1).
 *
 * Hai họ việc: việc GIÁO VIÊN TỰ LÀM ĐƯỢC, và việc PHẢI CÓ QUẢN LÝ TRẢ LỜI. Chọn một mục ở họ thứ hai TỨC LÀ đang xin ý kiến —
 * không cần tick thêm ô nào. "Khác" chỉ còn ở họ đề xuất: một việc không gọi được tên mà giáo viên tự làm luôn thì không ai biết đã
 * làm gì; nếu nó thật sự cần thiết, nó đáng để Quản lý biết.
 *
 * (Trước 21/09/2026 danh mục còn tách theo nhóm case và có bộ riêng cho Ý thức — gặp em, gặp phụ huynh, thư cảnh cáo. Bộ đó đã
 * thay bằng chín loại BIỆN PHÁP XỬ LÝ ở `./yThuc.ts`, một bảng riêng, không còn là phương án của case.)
 */
export const SELF_SERVE_KINDS: readonly InterventionKind[] = ['self_study', 'tutor', 'teaching_adjust', 'extra_homework'];
export const ACADEMIC_PROPOSAL_KINDS: readonly InterventionKind[] = ['extra_support', 'other_proposal'];

/** Toàn bộ phương án chọn được cho một case học thuật, theo đúng thứ tự bày ra trên form. */
export function interventionKindsFor(): { selfServe: readonly InterventionKind[]; proposals: readonly InterventionKind[] } {
  return { selfServe: SELF_SERVE_KINDS, proposals: ACADEMIC_PROPOSAL_KINDS };
}

/**
 * "Lùi lịch thi" phải nói rõ LÙI CÁI GÌ (mục 8.1).
 *
 * Hai thứ hoàn toàn khác nhau cùng được gọi là "lịch thi": kế hoạch thi IELTS thật của em,
 * và một phần thi trong một đợt MT. Chúng có quy tắc khác nhau, người quyết khác nhau, và
 * hệ quả khác nhau. Một đề xuất không nói rõ đối tượng thì người duyệt không biết mình đang
 * đồng ý với chuyện gì.
 */
export const RESCHEDULE_TARGETS = ['real_exam', 'mock_skill'] as const;
export type RescheduleTarget = (typeof RESCHEDULE_TARGETS)[number];
export const RESCHEDULE_TARGET_LABEL: Record<RescheduleTarget, string> = {
  real_exam: 'Kế hoạch thi thật của em',
  mock_skill: 'Một phần thi trong đợt MT',
};

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
 * QUY ĐỊNH CŨ "SOS 1–2 tự học, SOS 3 tutor" — GIỮ ĐỂ ĐỌC LẠI DỮ LIỆU CŨ, KHÔNG CÒN TỰ SINH.
 *
 * Từ vòng 7, điểm dưới kỳ vọng KHÔNG tự tạo phương án hỗ trợ nào nữa (mục 6.2). Hàm này chỉ
 * còn dùng để giải thích những phương án đã được sinh tự động trước đây, và để bước nâng cấp
 * nhận ra chúng. Đừng gọi nó để tạo phương án mới: quy định này nói em PHẢI được hỗ trợ, chứ
 * không nói ai làm, làm cái gì cụ thể và làm khi nào — ba thứ mà một phương án thật phải có.
 */
export function autoSupportKind(sosLevel: number, attemptNo: number): 'self_study' | 'tutor' {
  if (attemptNo >= 3) return 'tutor';
  return sosLevel >= 3 ? 'tutor' : 'self_study';
}

/**
 * Mức ưu tiên suy ra từ SOS. SUY LÚC HIỂN THỊ, không ghi vào case — xem Q11.
 *
 * Ba mức SOS ánh xạ MỘT–MỘT sang ba mức độ ưu tiên, theo đúng bảng 3.1 của tài liệu chốt vòng 4:
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
 * CHU KỲ XỬ LÝ CỦA PHƯƠNG ÁN HỌC THUẬT: HAI TUẦN.
 *
 * Owner chốt ở vòng 5, và luật này THAY THẾ hẳn luật cũ (hạn 3/5/7 ngày theo mức độ ưu tiên, hạn theo mức SOS, hạn theo lượt MT kế
 * tiếp).
 *
 *   Hạn = CHỦ NHẬT CỦA TUẦN THỨ HAI, tính tuần bắt đầu là tuần thứ nhất.
 *   Ví dụ: bắt đầu 14/09/2026 (thứ Hai) → hạn 27/09/2026. KHÔNG phải 04/10.
 *
 * Đếm theo tuần chứ không phải "cộng 14 ngày" là có lý do: mọi thứ khác của hệ thống — lịch MT, hạn nhập điểm, báo cáo — đều chạy
 * theo tuần thứ Hai→Chủ nhật. Một cái hạn rơi vào giữa tuần thì người ta phải nhớ riêng nó.
 *
 * Quá hạn KHÔNG chặn gì cả — nó là CẢNH BÁO BỔ SUNG, không thay trạng thái của phương án. (Ý thức không có chu kỳ hay hạn nào từ
 * 21/09/2026 — chỉ có một cảnh báo mềm 5 ngày, xem `./yThuc.ts`.)
 */
export const ACADEMIC_CYCLE_WEEKS = 2;

/** Thứ Hai của tuần chứa ngày đó. Chép lại ở đây để `shared/` không phụ thuộc máy chủ. */
function mondayOfIso(date: string): string {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;          // thứ Hai = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

function addDaysIso(date: string, n: number): string {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** HẠN "n NGÀY" DÙNG CHUNG (T24, T66, M-16): n ngày liên tiếp theo lịch, TÍNH CẢ ngày bắt đầu. Quá hạn khi hôm nay > hạn. */
export function hanTheoNgay(batDau: string, n: number): string {
  if (!Number.isInteger(n) || n < 1) throw new Error(`hanTheoNgay: số ngày phải ≥ 1 (nhận ${n})`);
  return addDaysIso(batDau, n - 1);
}
/** Quản lý trả lời Đề xuất PA / Xin hỗ trợ trong 5 ngày, tính cả ngày gửi (T54, K3-18). */
export const HAN_DUYET_NGAY = 5;

/**
 * Hạn của một chu kỳ xử lý, tính từ ngày chu kỳ BẮT ĐẦU. Phương án cần duyệt thì ngày bắt đầu là NGÀY ĐƯỢC DUYỆT, không phải
 * ngày gửi — thời gian chờ Quản lý không được tính là giáo viên đã có thời gian làm.
 */
export function cycleDeadline(startDate: string): string {
  // Thứ Hai tuần bắt đầu + 13 ngày = Chủ nhật của tuần kế tiếp.
  return addDaysIso(mondayOfIso(startDate), ACADEMIC_CYCLE_WEEKS * 7 - 1);
}

/**
 * Câu giải thích cho giao diện, để người dùng không phải tự đoán luật. PR-N1 (T54, K3 §4c #3): nói hạn Quản lý trả lời theo
 * `HAN_DUYET_NGAY`; `cycleDeadline` ở trên chỉ còn bộ demo dùng.
 */
export function cycleDeadlineHint(): string {
  return `Hạn Quản lý trả lời: ${HAN_DUYET_NGAY} ngày, tính cả ngày gửi.`;
}

/**
 * TÍN HIỆU — thứ mà một kết quả dưới kỳ vọng sinh ra, và nó KHÔNG phải một case (mục 6.2).
 *
 * Trước vòng 7, điểm dưới kỳ vọng tự mở ra một case hoàn chỉnh kèm phương án hỗ trợ. Nghe
 * thì tiện, nhưng nó nói dối ở hai chỗ:
 *
 *   1. Máy KHÔNG chẩn đoán được nguyên nhân. Nó chỉ biết "band 5.5 < kỳ vọng 6.0". Một case
 *      hoàn chỉnh phải có tên, mô tả và phân loại vấn đề — ba thứ chỉ người dạy mới biết.
 *   2. Máy KHÔNG xếp được tutor thay người. Một phương án tự sinh trông như đã có ai đó lo,
 *      trong khi thật ra chưa ai đụng vào.
 *
 * Nên từ nay điểm chỉ sinh TÍN HIỆU: "môn này dưới kỳ vọng, ai đó phải xem". Giáo viên bộ
 * môn xác minh môn mình. Chỉ khi có người xác minh thì mới thành case — hoặc được ghi nhận là
 * không có vấn đề thật. (Tín hiệu Ý thức/Khác cho GVCN đã bỏ 21/09/2026: SOS chỉ sinh từ Mock Test và chỉ thuộc Học thuật.)
 */
export const SIGNAL_STATUSES = ['pending', 'linked', 'noted', 'withdrawn'] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];
export const SIGNAL_STATUS_LABEL: Record<SignalStatus, string> = {
  pending: 'Chờ xác minh',
  linked: 'Đã thành case',
  /*
   * BỎ QUA (S1, chủ sản phẩm chốt 22/09/2026, đặc tả §3.10 + §5): tín hiệu lớp thường được đóng mà KHÔNG tạo Case, một bấm, lý do
   * KHÔNG bắt buộc. `resolution_note` luôn có chữ (`SIGNAL_DISMISS_NOTE`, kèm lý do nếu có). Dòng `noted` cũ của bộ demo ("đã xem")
   * đọc ra cùng nhãn — cùng nghĩa: đã có người xem và không mở Case.
   */
  noted: 'Đã bỏ qua',
  withdrawn: 'Đã thu hồi',
};

/**
 * HẠN XÁC MINH MỘT TÍN HIỆU: **3 ngày, TÍNH CẢ NGÀY ĐẦU** (mục 6.2).
 *
 * Tín hiệu ghi nhận thứ Hai thì hết thứ Tư, không phải hết thứ Năm. Đây là chỗ rất dễ lệch
 * một ngày, nên con số cộng thêm là 2 chứ không phải 3.
 */
export const SIGNAL_VERIFY_DAYS = 3;

/**
 * Hạn xác minh, tính từ NGÀY TÍN HIỆU ĐƯỢC GHI NHẬN — không phải từ thứ Hai của tuần thi.
 *
 * Điều này quan trọng với điểm nhập muộn: một bài thi tuần trước mà hôm nay mới có điểm thì
 * giáo viên vẫn có đủ ba ngày kể từ hôm nay. Neo vào tuần thi sẽ làm họ quá hạn ngay tại
 * giây điểm được công bố — phạt người ta vì việc của người khác.
 */
export function signalVerifyDue(raisedOn: string): string {
  return hanTheoNgay(raisedOn, SIGNAL_VERIFY_DAYS);
}

/** Lý do chuẩn khi một tín hiệu mất căn cứ vì điểm được sửa lại (mục 9.4). */
export const SIGNAL_WITHDRAW_SCORE_FIXED = 'Không còn hợp lệ do sửa điểm';

/** Chữ ghi vào `resolution_note` khi GV bấm "Bỏ qua" tín hiệu (S1). Có lý do thì thêm " — {lý do}". */
export const SIGNAL_DISMISS_NOTE = 'Bỏ qua';

/**
 * BẢNG HẠN CỦA MỤC 8.3 — mọi hạn theo ngày đều TÍNH CẢ NGÀY ĐẦU.
 *
 * Ba ngày là ngày đầu + 2, năm ngày là + 4, bảy ngày là + 6. Đây là chỗ rất dễ lệch một
 * ngày, nên con số cộng thêm luôn nhỏ hơn số ngày đúng một đơn vị, và không nơi nào được
 * tự cộng lấy.
 *
 * Hạn phụ thuộc MỨC ĐỘ, và đó là lý do mức độ chỉ còn hai bậc chứ không phải ba: mỗi bậc
 * dẫn tới một con số khác nhau, nên nó có việc để làm.
 */
export const PLAN_DUE_DAYS: Record<string, number> = { urgent: 3, attention: 5 };

/**
 * HẠN PHẢI CÓ PHƯƠNG ÁN, tính từ lúc case được xác định và giao trách nhiệm.
 *
 * Chỉ áp cho case học thuật (mục 8.3). Ý thức không có hạn nào từ 21/09/2026.
 *
 * Đổi người phụ trách hay chuyển lớp KHÔNG đặt lại hạn này: nơi gọi luôn truyền vào mốc
 * gốc, vì một nghĩa vụ đã phát sinh thì không biến mất khi người giữ nó đổi tên.
 */
export function planDueDate(assignedOn: string, urgency: string | null | undefined): string {
  const days = PLAN_DUE_DAYS[urgency ?? DEFAULT_URGENCY] ?? PLAN_DUE_DAYS.attention;
  return hanTheoNgay(assignedOn, days);
}

/**
 * HẠN GHI KẾT QUẢ PA HẰNG TUẦN (§5.6 R-PA1, chủ sản phẩm 27/09): kết quả của tuần Thứ Hai → Chủ nhật chứa `fromDate` phải ghi
 * xong trước HẾT THỨ HAI tuần kế tiếp. Máy chủ gọi `weeklyUpdateDue(ngàyGhi + 1)` sau mỗi lần ghi → ghi ngày CN hay T2 đều khép
 * đúng tuần vừa hết, hạn mới là Thứ Hai tuần sau nữa.
 */
export function weeklyUpdateDue(fromDate: string): string {
  return addDaysIso(mondayOfIso(fromDate), 7);
}
/** DỰ KIẾN KẾT THÚC mặc định: Chủ nhật tuần tiếp theo (mục 8.3). Không phải hạn (T53 Q1) — không theo hạn Thứ Hai. */
export function planEndDefault(startDate: string): string {
  return addDaysIso(mondayOfIso(startDate), 13);
}

export const INTERVENTION_STATUSES = ['planned', 'started', 'completed', 'cancelled'] as const;
export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];
export const INTERVENTION_STATUS_LABEL: Record<InterventionStatus, string> = {
  planned: 'Đã lên kế hoạch', started: 'Đang thực hiện', completed: 'Đã xong', cancelled: 'Đã huỷ',
};

/**
 * KẾT QUẢ SAU MỘT CHU KỲ HỖ TRỢ. Là QUAN SÁT, không phải khẳng định phương án gây ra
 * thay đổi — nên nhãn nói "kết quả", không nói "nhờ phương án X".
 *
 * Case học thuật có năm kết quả. (Ý thức không đo kết quả — từ 21/09/2026 nó chỉ ghi nhận việc đã làm và bằng chứng.)
 */
export const FOLLOWUP_OUTCOMES = ['improved', 'partial', 'unchanged', 'worse', 'insufficient'] as const;
export type FollowUpOutcome = (typeof FOLLOWUP_OUTCOMES)[number];
export const FOLLOWUP_OUTCOME_LABEL: Record<FollowUpOutcome, string> = {
  improved: 'Tiến bộ rõ',
  partial: 'Tiến bộ một phần',
  unchanged: 'Không tiến bộ',
  worse: 'Kém hơn',
  insufficient: 'Chưa đủ dữ liệu',
};
export function outcomeLabelFor(outcome: string): string {
  return FOLLOWUP_OUTCOME_LABEL[outcome as FollowUpOutcome] ?? outcome;
}

/**
 * MÀU VÀ DẤU CỦA MỘT KẾT QUẢ — owner chốt bảng này ở mục 7.10.
 *
 * TRẠNG THÁI và KẾT QUẢ là hai thông tin khác nhau: một phương án "Đã hoàn thành" với kết
 * quả "Kém hơn" vẫn phải hiện màu đỏ. Tô xanh mọi thứ đã hoàn thành là nói dối.
 */
export const OUTCOME_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'muted'> = {
  improved: 'ok', partial: 'warn', unchanged: 'warn', worse: 'danger', insufficient: 'muted',
};
export const OUTCOME_MARK: Record<string, string> = {
  improved: '✓', partial: '↗', unchanged: '–', worse: '↓', insufficient: '?',
};

/**
 * BƯỚC TIẾP THEO sau khi ghi kết quả — và đây là chỗ luật nghiệp vụ nằm, không phải ở
 * giao diện.
 *
 * Kết quả TỐT thì được phép khép lại hoặc theo dõi thêm. Kết quả CHƯA TỐT thì BẮT BUỘC
 * chọn một trong ba đường đi tiếp — không có đường "ghi nhận rồi thôi". Đó là cả lý do
 * bảng này tồn tại: một kết quả "Kém hơn" mà không ai phải làm gì tiếp là một kết quả sẽ
 * bị quên.
 */
export const NEXT_STEPS = ['complete', 'monitor', 'continue', 'adjust', 'propose', 'ask_manager'] as const;
export type NextStep = (typeof NEXT_STEPS)[number];
export const NEXT_STEP_LABEL: Record<NextStep, string> = {
  complete: 'Kết thúc phương án',
  monitor: 'Theo dõi thêm',
  continue: 'Giữ nguyên',
  adjust: 'Điều chỉnh',
  propose: 'Thay phương án',
  ask_manager: 'Xin hỗ trợ từ Quản lý',
};
export const NEXT_STEP_HINT: Record<NextStep, string> = {
  complete: 'Khép lại phương án này. Case chỉ đóng được khi mọi phương án đã khép.',
  monitor: 'Ghi kết quả chu kỳ vừa rồi và mở một chu kỳ theo dõi mới.',
  continue: 'Giữ nguyên phương án, mở đợt mới để làm tiếp.',
  adjust: 'Cùng phương án, sửa mô tả, người thực hiện hoặc ngày dự kiến kết thúc. Bản cũ giữ trong lịch sử.',
  propose: 'Khép phương án cũ với lý do "Được thay thế" và mở phương án mới.',
  ask_manager: 'Chuyển sang chờ Quản lý quyết định. Thời gian chờ tính cho Quản lý.',
};

/** Kết quả tốt được phép khép lại; kết quả chưa tốt BẮT BUỘC đi tiếp. */
const GOOD_OUTCOMES = ['improved', 'partial'];
export function nextStepsFor(outcome: string): NextStep[] {
  return GOOD_OUTCOMES.includes(outcome)
    ? ['complete', 'monitor']
    : ['continue', 'propose', 'ask_manager'];
}

/**
 * HAI TAB CỦA BẢNG CẬP NHẬT KẾT QUẢ (mục 9.1).
 *
 * Trước vòng 7, mọi lần ghi kết quả đều bắt chọn thêm "bước tiếp theo", kể cả khi người
 * dạy chỉ muốn nói "tuần này em có tiến bộ một phần, tôi làm tiếp". Hệ quả là để sang được
 * tuần mới, người ta phải khai một bước đi tiếp không có thật — hoặc tệ hơn, mở một phương
 * án thứ hai giống hệt phương án cũ.
 *
 * Tách làm hai việc rõ ràng:
 *
 *   · THEO DÕI TIẾP — ghi kết quả chu kỳ vừa rồi rồi lưu, hết. Phương án vẫn đang chạy.
 *   · KẾT THÚC PHƯƠNG ÁN — mới cần ngày hoàn thành thật và một bước tiếp theo.
 *
 * Và chỉ hai đường đó khép được một phương án: thao tác kết thúc, hoặc nhập lịch sử "đã
 * xong" có ngày thật. Không còn nút "đánh dấu đã làm" chạy song song mà không hỏi kết quả.
 */
export const RESULT_MODES = ['monitor', 'end'] as const;
export type ResultMode = (typeof RESULT_MODES)[number];
export const RESULT_MODE_LABEL: Record<ResultMode, string> = {
  monitor: 'Tiếp tục theo dõi',
  end: 'Kết thúc phương án',
};

/**
 * "Chưa đủ dữ liệu" KHÔNG đóng được phương án (mục 9.1).
 *
 * Nó là một câu trung thực khi chưa có bài mới để nhìn, nhưng nó không phải một kết luận.
 * Cho phép nó khép phương án là mở đúng cái cửa mà cả mục này muốn đóng: khép việc lại mà
 * chưa ai biết em khá hơn hay kém đi.
 */
export function canEndWithOutcome(outcome: string): boolean {
  return outcome !== 'insufficient';
}

/**
 * Các bước ở TAB KẾT THÚC. PR-S2 (Q2, planning review 22/09): "Chưa đủ dữ liệu" chỉ đi được bằng THAY (PA cũ Được thay thế, kết quả
 * cuối không xác định nên không vào thống kê và không vào F05). Kết thúc suông và Xin hỗ trợ từ Quản lý với Chưa đủ dữ liệu vẫn không cho.
 */
export function endStepsFor(outcome: string): NextStep[] {
  if (!canEndWithOutcome(outcome)) return ['propose'];
  return GOOD_OUTCOMES.includes(outcome)
    ? ['complete', 'propose', 'ask_manager']
    : ['propose', 'ask_manager'];
}

/** Bước tiếp theo hợp lệ theo tab đang đứng. */
export function stepsForMode(mode: string, outcome: string): NextStep[] {
  return mode === 'end' ? endStepsFor(outcome) : ['continue', 'adjust'];
}

/**
 * QUYẾT ĐỊNH CỦA MỘT LẦN GHI KẾT QUẢ (PR-S2 · S4 · nguồn §8, rulebook §18.2 điểm 4).
 *
 * Giữ nguyên / Điều chỉnh / Thay là ba lựa chọn của nguồn; Kết thúc phương án giữ theo rulebook §5; Xin hỗ trợ từ Quản lý là
 * đường cũ, hiện thành nút chữ phụ. Mỗi quyết định dịch về đúng MỘT cặp (mode, nextStep) đã có, nên mọi luật của
 * `updateResult` vẫn kiểm như trước. Payload cũ `{ mode, nextStep }` vẫn nhận.
 */
export const PLAN_DECISIONS = ['keep', 'adjust', 'replace', 'end', 'ask_manager'] as const;
export type PlanDecision = (typeof PLAN_DECISIONS)[number];
/** Bốn nút chính, đúng thứ tự nguồn §8. `ask_manager` là nút chữ phụ. */
export const PLAN_DECISION_CHIPS: readonly PlanDecision[] = ['keep', 'adjust', 'replace', 'end'];
export const PLAN_DECISION_LABEL: Record<PlanDecision, string> = {
  keep: 'Giữ nguyên',
  adjust: 'Điều chỉnh',
  replace: 'Thay phương án',
  end: 'Kết thúc phương án',
  ask_manager: 'Xin hỗ trợ từ Quản lý',
};
export const PLAN_DECISION_HINT: Record<PlanDecision, string> = {
  keep: 'Phương án chạy tiếp như cũ. Kết quả tuần sau ghi trước hết Thứ Hai kế tiếp.',
  adjust: 'Cùng phương án, sửa mô tả, người thực hiện hoặc ngày dự kiến kết thúc. Bản cũ giữ trong lịch sử.',
  replace: 'Khép phương án này (Được thay thế) và mở phương án mới. Đổi loại phương án thì chọn ở đây.',
  end: 'Khép phương án này. Case chỉ hoàn thành được khi mọi phương án đã khép.',
  ask_manager: 'Chuyển sang chờ Quản lý quyết định. Thời gian chờ tính cho Quản lý.',
};

/** Bản NGẮN cho danh sách dọc trong panel Ghi kết quả (PR-UX3, mockup 15 §4): tên một dòng + `PLAN_DECISION_NGHIA` một dòng nghĩa. */
export const PLAN_DECISION_NGAN: Record<PlanDecision, string> = {
  keep: 'Giữ nguyên', adjust: 'Điều chỉnh', replace: 'Thay PA', end: 'Kết thúc PA', ask_manager: 'Xin hỗ trợ QL',
};
export const PLAN_DECISION_NGHIA: Record<PlanDecision, string> = {
  keep: 'Tiếp tục PA này, hẹn ghi kết quả tuần sau',
  adjust: 'Cùng PA, sửa nội dung, người làm hoặc hạn',
  replace: 'Khép PA này, mở PA khác thay vào',
  end: 'Khép PA này; Case chỉ xong khi mọi PA đã khép',
  ask_manager: 'Chuyển Quản lý quyết định',
};
/** Nút chính ở chân panel theo quyết định đang chọn. */
export const NUT_LUU_KET_QUA: Record<PlanDecision, string> = {
  keep: 'Lưu kết quả', adjust: 'Lưu điều chỉnh', replace: 'Thay PA', end: 'Kết thúc PA', ask_manager: 'Gửi Quản lý',
};

export function decisionToStep(d: PlanDecision): { mode: ResultMode; nextStep: NextStep } {
  switch (d) {
    case 'keep': return { mode: 'monitor', nextStep: 'continue' };
    case 'adjust': return { mode: 'monitor', nextStep: 'adjust' };
    case 'replace': return { mode: 'end', nextStep: 'propose' };
    case 'end': return { mode: 'end', nextStep: 'complete' };
    case 'ask_manager': return { mode: 'end', nextStep: 'ask_manager' };
  }
}

/** Quyết định hợp lệ theo kết quả. Suy từ `endStepsFor`, không viết luật lần hai. */
export function decisionsFor(outcome: string): PlanDecision[] {
  const out: PlanDecision[] = ['keep', 'adjust'];
  const steps = endStepsFor(outcome);
  if (steps.includes('propose')) out.push('replace');
  if (steps.includes('complete')) out.push('end');
  if (steps.includes('ask_manager')) out.push('ask_manager');
  return out;
}

/** Vì sao một quyết định đang bị chặn với kết quả này (dùng cho `title` của nút mờ, G-7). `null` = được chọn. */
export function decisionBlockedReason(outcome: string, d: PlanDecision): string | null {
  if (decisionsFor(outcome).includes(d)) return null;
  if (!canEndWithOutcome(outcome)) return '"Chưa đủ dữ liệu" thì chưa kết thúc phương án được. Chọn Giữ nguyên, Điều chỉnh hoặc Thay phương án.';
  return 'Kết quả chưa tốt thì chưa khép suông được. Chọn Thay phương án hoặc Xin hỗ trợ từ Quản lý.';
}

/** Điều chỉnh và Thay bắt buộc ghi lý do (rulebook §18.2: "vì sao đổi"). */
export function decisionNeedsReason(d: string): boolean {
  return d === 'adjust' || d === 'replace';
}

/** Lý do mặc định khi GV sửa gợi ý tự động ngay lúc xác nhận mà không ghi lý do (PR-S2, Q7). */
export const CONFIRM_EDIT_REASON = 'Chỉnh khi xác nhận gợi ý tự động';

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
  'Buổi bổ trợ với GV cơ hữu',
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

/**
 * MỘT ĐỊNH NGHĨA DUY NHẤT CỦA "CASE THIẾU PHƯƠNG ÁN" (hợp đồng số liệu, PR-N).
 *
 * Case đang mở mà CHƯA CÓ HƯỚNG XỬ LÝ và CHƯA CÓ TÁC ĐỘNG NÀO (kể cả tác động đã huỷ). Case đã chọn hướng "chỉ theo dõi
 * thêm" thì cố ý không có phương án — không phải một chỗ thiếu; case từng có phương án rồi huỷ đã có người bắt tay vào,
 * nên cũng không nằm ở "chưa ai ghi sẽ làm gì". Chỉ số `case-thieu-pa`, cột "Thiếu phương án" của bảng "Việc cần lưu ý"
 * và của bảng phân tích theo kỹ năng đều gọi hàm này — trước PR-N bảng phân tích tự định nghĩa lại và lệch ở hai khe trên.
 */
export function isNoPlanCase(c: { status: string; disposition?: string | null; interventionCount: number }): boolean {
  return c.status !== 'done' && !c.disposition && c.interventionCount === 0;
}
