/** CASE — hạng mục, phân loại nguyên nhân, phương án, phê duyệt và kết quả. */

import { ENTRY_SKILLS, ENTRY_SKILL_LABEL, type EntrySkill } from './skills.ts';
import { C03_CUA_SO_GOP_CASE_Y_THUC_NGAY } from './policy.ts';

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
/*
 * Thứ tự này là thứ tự BÀY RA: BTVN · Chuyên cần · Tham gia trên lớp · Khác (mục 13.3).
 * Không chỗ nào dựa vào vị trí trong mảng, nên đổi thứ tự chỉ đổi cách đọc trên màn hình.
 */
export const BEHAVIOUR_TOPICS = ['homework', 'attendance', 'participation', 'other'] as const;
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
  'listening', 'reading', 'writing1', 'writing2', 'writing', 'speaking', 'behaviour',
] as const;
export type CaseCategory = (typeof CASE_CATEGORIES)[number];

export const CASE_CATEGORY_LABEL: Record<CaseCategory, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing1: 'Writing Task 1',
  writing2: 'Writing Task 2',
  writing: 'Writing',
  speaking: 'Speaking',
  behaviour: 'Ý thức/Khác',
};
/**
 * HẠNG MỤC CASE → KỸ NĂNG ĐƯỢC PHÂN CÔNG.
 *
 * Dùng để gợi ý người phụ trách case: case Reading thì gợi ý giáo viên đang dạy Reading của
 * lớp đó. Hạng mục Ý thức/Khác không gắn với kỹ năng nào nên không có mặt ở đây — nó về
 * giáo viên chủ nhiệm.
 */
export const CASE_CATEGORY_SKILL: Record<string, string> = {
  listening: 'listening', reading: 'reading', speaking: 'speaking',
  writing1: 'writing1', writing2: 'writing2',
  /* Lớp Normal chỉ có MỘT môn Writing, và phân công cũng chỉ có một ô `writing`. */
  writing: 'writing',
};

export const CASE_CATEGORY_SHORT: Record<CaseCategory, string> = {
  listening: 'L', reading: 'R', writing1: 'W1', writing2: 'W2', writing: 'W', speaking: 'S',
  behaviour: 'Ý thức',
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
  'listening', 'reading', 'writing1', 'writing2', 'speaking', 'behaviour',
] as const;
export const NORMAL_CASE_CATEGORIES = [
  'listening', 'reading', 'writing', 'speaking', 'behaviour',
] as const;

/** `ratio` = lớp Normal. Không rõ chương trình thì lấy bộ của Fast Track. */
export function caseCategoriesFor(scoringMode: string | null | undefined): readonly CaseCategory[] {
  return scoringMode === 'ratio' ? NORMAL_CASE_CATEGORIES : FT_CASE_CATEGORIES;
}

/**
 * BỘ TAB CỦA BẢNG PHÂN TÍCH VẤN ĐỀ — mục 13.4: Normal L/R/W/S, Fast Track L/R/W1/W2/S.
 *
 * Ý THỨC/KHÁC CỐ Ý KHÔNG CÓ TAB Ở ĐÂY. Bảng đó báo cáo hiệu quả phương án bằng tỷ lệ thành
 * công, và nhóm ý thức không có thứ đó: gia đình đã nhận report không chứng minh em tiến bộ.
 * Nhóm ấy có chỗ riêng — dạng xem "Ý thức" ở mục 13.3, nơi đếm SỐ ĐỢT và SỐ LẦN ĐÃ LÀM.
 *
 * Để ở đây vì giao diện và máy chủ phải bày ĐÚNG MỘT bộ tab; hai nơi tự lọc lấy là cách để
 * một hôm nào đó bảng có một tab mà máy chủ không trả số nào.
 */
export function issueBoardCategoriesFor(scoringMode: string | null | undefined): readonly CaseCategory[] {
  return caseCategoriesFor(scoringMode).filter((c) => c !== 'behaviour');
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
  originKind?: string | null; failedCount?: number | null;
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
  /** Một câu giải thích khi nhãn dễ bị hiểu lẫn với nhãn bên cạnh. */
  hint?: string;
};

export type IssueBranch = {
  /** Khớp với chủ đề mạch. Writing dùng chung cho `writing1` và `writing2`. */
  key: 'listening' | 'reading' | 'writing' | 'speaking' | 'behaviour';
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
  {
    /*
     * Ý THỨC/KHÁC CŨNG PHẢI CÓ PHÂN LOẠI (mục 6.4).
     *
     * Trước đây nhóm ý thức chỉ có "chủ đề" (chuyên cần / BTVN / tham gia) và không có tầng
     * phân loại, nên nó nằm ngoài mọi bảng tổng hợp nguyên nhân. Nay nó dùng chung một cơ
     * chế với học thuật — và đó cũng là khoá để gộp báo cáo theo đợt ở mục 7.
     */
    key: 'behaviour', label: 'Ý thức / Khác',
    items: [
      { code: 'student.behaviour.homework', label: 'BTVN' },
      { code: 'student.behaviour.attendance', label: 'Chuyên cần' },
      { code: 'student.behaviour.participation', label: 'Tham gia trên lớp' },
      other('student.behaviour.other'),
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
 * Bốn nhóm ý thức (chuyên cần / BTVN / tham gia / khác) cùng dùng bộ Ý thức/Khác.
 */
export function issuesForTopic(topic: string): IssueNode[] {
  const key = topic === 'writing1' || topic === 'writing2' ? 'writing'
    : (BEHAVIOUR_TOPICS as readonly string[]).includes(topic) ? 'behaviour'
    : topic;
  return ISSUE_TAXONOMY.find((b) => b.key === key)?.items ?? [];
}

/**
 * SUY CHỦ ĐỀ TỪ MÃ PHÂN LOẠI — CASE-01 làm nốt (PR-C).
 *
 * Nhóm Ý thức chỉ có MỘT tầng phân loại (bốn nhóm BTVN/Chuyên cần/Tham gia/Khác cũng chính
 * là bốn mã `student.behaviour.*`), nên form không cần hỏi "Về việc gì" rồi hỏi tiếp "Phân
 * loại vấn đề" ra cùng một câu trả lời — sổ CASE-01 cấm rõ "không cần dropdown nguyên nhân
 * thứ hai dư thừa". Suy `topic` thẳng từ `primaryCode` thay vì bắt người dùng chọn hai lần.
 *
 * CHỖ DỄ HỎNG NHẤT CỦA PR-C: `topic` là khoá gộp báo cáo theo đợt (sổ §13.12) — ánh xạ lệch
 * một mã là hai báo cáo cùng loại rơi vào hai đợt khác nhau, không ai nhìn màn hình mà thấy
 * được. Phải phủ hết `BEHAVIOUR_TOPICS`, và giao diện lẫn máy chủ dùng ĐÚNG MỘT hàm này.
 */
export function topicFromBehaviourCode(code: string): BehaviourTopic | null {
  const found = BEHAVIOUR_TOPICS.find((t) => code === `student.behaviour.${t}`);
  return found ?? null;
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
  normal: 'Bình thường (mức cũ)', attention: 'Cần chú ý', urgent: 'Gấp',
};
export const URGENCY_TONE: Record<string, 'neutral' | 'warn' | 'danger'> = {
  normal: 'neutral', attention: 'warn', urgent: 'danger',
};

// ---------------------------------------------------------------- gộp báo cáo Ý thức/Khác

/**
 * CỬA SỔ GỘP BÁO CÁO Ý THỨC/KHÁC — BA NGÀY LỊCH ĐẦU, TÍNH CẢ NGÀY MỞ (C03, chủ sản phẩm chốt 20/09/2026; trước đó là bốn).
 *
 * Case mở 14/9 thì báo cáo ngày 14, 15, 16 gộp vào chính nó; từ 17/9 là một ĐỢT MỚI.
 *
 * Vì sao phải có cửa sổ: "em không làm bài tập" báo ba lần trong một tuần là MỘT chuyện, và
 * mở ba case thì ba người cùng theo dõi mà không ai thấy việc của người kia. Nhưng cùng
 * chuyện đó tái diễn sau nửa tháng lại là một đợt khác — gộp hết vào một case thì cái case
 * ấy không bao giờ đóng được và không đo được gì.
 */
export const BEHAVIOUR_MERGE_WINDOW_DAYS: number = C03_CUA_SO_GOP_CASE_Y_THUC_NGAY;

/** Ngày CUỐI CÙNG còn gộp được vào một case mở ngày `openedOn`. */
export function behaviourMergeUntil(openedOn: string): string {
  return addDaysIso(openedOn, BEHAVIOUR_MERGE_WINDOW_DAYS - 1);
}

/**
 * Hạn kết luận của một case Ý thức/Khác: ngày mở + 6 ngày (mục 7.2).
 * KHÔNG đặt lại theo báo cáo gộp thêm sau đó — nếu không thì một case cứ có báo cáo mới là
 * hạn lại lùi ra, và nó sẽ không bao giờ tới hạn.
 */
export const BEHAVIOUR_CASE_DAYS = 6;
export function behaviourCaseDeadline(openedOn: string): string {
  return addDaysIso(openedOn, BEHAVIOUR_CASE_DAYS);
}

/*
 * ĐÃ BỎ (C03, 20/09/2026): luật "nâng mức thì siết hạn phương án về ngày nâng + 2". Chủ sản phẩm bỏ hẳn câu hỏi này —
 * hạn mặc định của case Ý thức luôn là 1 tuần từ ngày mở (`behaviourCaseDeadline`); nâng mức ưu tiên không đổi hạn.
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
export const SUPPORT_KINDS = ['self_study', 'tutor', 'teaching_adjust', 'extra_homework', 'other'] as const;
export const CONTACT_KINDS = ['talk_student', 'talk_parent', 'warning_letter'] as const;
export const PROPOSAL_KINDS = ['reschedule_mt', 'extra_support', 'meeting_cx', 'other_proposal'] as const;
export const INTERVENTION_KINDS = [...SUPPORT_KINDS, ...CONTACT_KINDS, ...PROPOSAL_KINDS] as const;
export type InterventionKind = (typeof INTERVENTION_KINDS)[number];
export const INTERVENTION_KIND_LABEL: Record<InterventionKind, string> = {
  self_study: 'Xếp tự học',
  tutor: 'Học tutor',
  teaching_adjust: 'Điều chỉnh cách dạy',
  extra_homework: 'Tăng cường bài tập',
  /* Mã cũ: "Khác" tự thực hiện đã bỏ khỏi danh sách chọn (mục 8.1), giữ để đọc dữ liệu cũ. */
  other: 'Khác (mục cũ)',
  talk_student: 'Meeting với học sinh',
  talk_parent: 'Report cho gia đình',
  warning_letter: 'Gửi thư cảnh cáo',
  reschedule_mt: 'Lùi lịch thi',
  extra_support: 'Hỗ trợ học thuật',
  /* Giữ ĐÚNG chức danh của trung tâm, không tự đổi thành "Ban giám đốc" hay tên khác. */
  meeting_cx: 'Meeting CX / GĐCN',
  other_proposal: 'Khác',
};

/**
 * DANH MỤC PHƯƠNG ÁN THEO NHÓM CASE (mục 8.1).
 *
 * Hai nhóm case cần hai bộ phương án khác nhau, và bày nhầm bộ là mời người dùng chọn sai:
 * "Xếp tự học" không giải quyết được chuyện em hay nghỉ học, còn "Gửi thư cảnh cáo" thì
 * không phải cách chữa một lỗ hổng ngữ pháp.
 *
 * Trong mỗi nhóm lại tách hai họ: việc GIÁO VIÊN TỰ LÀM ĐƯỢC, và việc PHẢI CÓ QUẢN LÝ TRẢ
 * LỜI. Chọn một mục ở cột thứ hai TỨC LÀ đang xin ý kiến — không cần tick thêm ô nào.
 *
 * "Khác" chỉ còn ở cột đề xuất. Một việc không gọi được tên mà giáo viên tự làm luôn thì
 * không ai biết đã làm gì; nếu nó thật sự cần thiết, nó đáng để Quản lý biết.
 */
export const SELF_SERVE_KINDS_BY_TRACK: Record<string, readonly InterventionKind[]> = {
  academic: ['self_study', 'tutor', 'teaching_adjust', 'extra_homework'],
  behaviour: ['talk_parent', 'talk_student', 'warning_letter'],
};
export const PROPOSAL_KINDS_BY_TRACK: Record<string, readonly InterventionKind[]> = {
  academic: ['extra_support', 'other_proposal'],
  behaviour: ['meeting_cx', 'reschedule_mt', 'other_proposal'],
};

/** Toàn bộ phương án chọn được cho một nhóm case, theo đúng thứ tự bày ra trên form. */
export function interventionKindsFor(track: string | null | undefined): {
  selfServe: readonly InterventionKind[]; proposals: readonly InterventionKind[];
} {
  const t = track === 'behaviour' ? 'behaviour' : 'academic';
  return { selfServe: SELF_SERVE_KINDS_BY_TRACK[t], proposals: PROPOSAL_KINDS_BY_TRACK[t] };
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
  talk_student: 'GVCN + GVBM meeting với học sinh',
  talk_parent: 'Report cho gia đình',
  warning_letter: 'Gửi thư cảnh cáo',
};
export const CONTACT_KIND_SHORT: Record<ContactKind, string> = {
  talk_student: 'Meeting với học sinh',
  talk_parent: 'Report cho gia đình',
  warning_letter: 'Thư cảnh cáo',
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
 * CHU KỲ XỬ LÝ: HAI TUẦN VỚI CASE HỌC THUẬT, MỘT TUẦN VỚI Ý THỨC/KHÁC.
 *
 * Owner chốt ở vòng 5, và luật này THAY THẾ hẳn luật cũ (hạn 3/5/7 ngày theo mức độ ưu tiên,
 * hạn theo mức SOS, hạn theo lượt MT kế tiếp).
 *
 * CASE HỌC THUẬT — chu kỳ hai tuần:
 *
 *   Hạn = CHỦ NHẬT CỦA TUẦN THỨ HAI, tính tuần bắt đầu là tuần thứ nhất.
 *   Ví dụ: bắt đầu 14/09/2026 (thứ Hai) → hạn 27/09/2026. KHÔNG phải 04/10.
 *
 * Đếm theo tuần chứ không phải "cộng 14 ngày" là có lý do: mọi thứ khác của hệ thống —
 * lịch MT, hạn nhập điểm, báo cáo — đều chạy theo tuần thứ Hai→Chủ nhật. Một cái hạn rơi
 * vào giữa tuần thì người ta phải nhớ riêng nó.
 *
 * CASE Ý THỨC/KHÁC — một tuần TỪ LÚC PHƯƠNG ÁN BẮT ĐẦU, không căn theo tuần lịch. Việc
 * trao đổi với em hay gọi phụ huynh là việc làm xong trong vài ngày; bắt chờ đến Chủ nhật
 * tuần sau mới phải báo lại là kéo dài một việc ngắn một cách vô ích.
 *
 * Quá hạn KHÔNG chặn gì cả — nó là CẢNH BÁO BỔ SUNG, không thay trạng thái của phương án.
 */
export const ACADEMIC_CYCLE_WEEKS = 2;
export const BEHAVIOUR_CYCLE_DAYS = 7;

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

/**
 * Hạn của một chu kỳ xử lý, tính từ ngày chu kỳ BẮT ĐẦU.
 *
 * `track` quyết định độ dài: học thuật hai tuần theo lịch, Ý thức/Khác bảy ngày kể từ lúc
 * bắt đầu. Phương án cần duyệt thì ngày bắt đầu là NGÀY ĐƯỢC DUYỆT, không phải ngày gửi —
 * thời gian chờ Quản lý không được tính là giáo viên đã có thời gian làm.
 */
export function cycleDeadline(startDate: string, track: string = 'academic'): string {
  if (track === 'behaviour') return addDaysIso(startDate, BEHAVIOUR_CYCLE_DAYS);
  // Thứ Hai tuần bắt đầu + 13 ngày = Chủ nhật của tuần kế tiếp.
  return addDaysIso(mondayOfIso(startDate), ACADEMIC_CYCLE_WEEKS * 7 - 1);
}

/** Câu giải thích cho giao diện, để người dùng không phải tự đoán luật. */
export function cycleDeadlineHint(track: string = 'academic'): string {
  return track === 'behaviour'
    ? 'Hạn mặc định: một tuần kể từ lúc phương án bắt đầu.'
    : 'Hạn mặc định: hết Chủ nhật của tuần kế tiếp (chu kỳ hai tuần, tính tuần bắt đầu là tuần thứ nhất).';
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
 * môn xác minh môn mình; GVCN nhận tín hiệu Ý thức/Khác để xem tình hình chung. Chỉ khi có
 * người xác minh thì mới thành case — hoặc được ghi nhận là không có vấn đề thật.
 */
export const SIGNAL_STATUSES = ['pending', 'linked', 'noted', 'withdrawn'] as const;
export type SignalStatus = (typeof SIGNAL_STATUSES)[number];
export const SIGNAL_STATUS_LABEL: Record<SignalStatus, string> = {
  pending: 'Chờ xác minh',
  linked: 'Đã thành case',
  /*
   * TRẠNG THÁI CŨ, CHỈ CÒN ĐỂ ĐỌC LẠI LỊCH SỬ.
   *
   * Đề bài mục 6.2 cho phép GVCN "ghi nhận đã xem" một mốc Ý thức/Khác mà không mở case.
   * Chủ sản phẩm chốt ngược lại (16/09/2026): xác minh một tín hiệu nghĩa là MỞ CASE, không
   * có lối ra nào khác. Nên không thao tác nào còn sinh ra trạng thái này; nó chỉ nằm trên
   * dữ liệu có từ trước và trên bộ demo lịch sử.
   */
  noted: 'Đã xem (dữ liệu cũ)',
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
  return addDaysIso(raisedOn, SIGNAL_VERIFY_DAYS - 1);
}

/** Lý do chuẩn khi một tín hiệu mất căn cứ vì điểm được sửa lại (mục 9.4). */
export const SIGNAL_WITHDRAW_SCORE_FIXED = 'Không còn hợp lệ do sửa điểm';

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
 * Áp cho CẢ case học thuật lẫn Ý thức/Khác (mục 8.3) — với Ý thức/Khác thì đây vừa là hạn
 * phải có phương án, vừa là hạn phải LÀM XONG nó.
 *
 * Đổi người phụ trách hay chuyển lớp KHÔNG đặt lại hạn này: nơi gọi luôn truyền vào mốc
 * gốc, vì một nghĩa vụ đã phát sinh thì không biến mất khi người giữ nó đổi tên.
 */
export function planDueDate(assignedOn: string, urgency: string | null | undefined): string {
  const days = PLAN_DUE_DAYS[urgency ?? DEFAULT_URGENCY] ?? PLAN_DUE_DAYS.attention;
  return addDaysIso(assignedOn, days - 1);
}

/**
 * HẠN CẬP NHẬT PHƯƠNG ÁN HỌC THUẬT: trước hết CHỦ NHẬT hằng tuần (mục 8.3).
 *
 * Bắt đầu 19/9 (thứ Bảy) thì vẫn phải cập nhật ngày 20/9 — chưa đủ dữ liệu thì ghi đúng là
 * chưa đủ, chứ không được bỏ qua một tuần. Đó là điều kiện để bảng theo tuần nói đúng.
 */
export function weeklyUpdateDue(fromDate: string): string {
  const d = new Date(`${fromDate.slice(0, 10)}T00:00:00Z`);
  const dow = d.getUTCDay();                    // 0 = Chủ nhật
  return addDaysIso(fromDate, dow === 0 ? 0 : 7 - dow);
}

/**
 * NGÀY DỰ KIẾN KẾT THÚC PHƯƠNG ÁN HỌC THUẬT khi người dùng không chọn: CHỦ NHẬT TUẦN TIẾP
 * THEO tính từ lúc bắt đầu thực hiện (mục 8.3).
 *
 * Bắt đầu 19/9 → kết thúc mặc định 27/9. Trùng đúng Chủ nhật thì MỘT lần cập nhật kết thúc
 * đáp ứng cả hai nghĩa vụ; không bắt người dùng bấm hai lần cho cùng một ngày.
 */
export function planEndDefault(startDate: string): string {
  return addDaysIso(weeklyUpdateDue(startDate), 7);
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
 * Case HỌC THUẬT có năm kết quả; case Ý THỨC/KHÁC chỉ ba, vì bản chất vấn đề khác: em có
 * đi học đều hơn không, chứ không phải em lên được mấy band.
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
/** Ba kết quả của case Ý thức/Khác. `improved` ở đây đọc là "Đã tiến bộ". */
export const BEHAVIOUR_OUTCOMES = ['improved', 'unchanged', 'worse'] as const;
export const BEHAVIOUR_OUTCOME_LABEL: Record<string, string> = {
  improved: 'Đã tiến bộ', unchanged: 'Không thay đổi', worse: 'Kém hơn',
};

export function outcomesFor(track: string): readonly string[] {
  return track === 'behaviour' ? BEHAVIOUR_OUTCOMES : FOLLOWUP_OUTCOMES;
}
export function outcomeLabelFor(track: string, outcome: string): string {
  return track === 'behaviour'
    ? BEHAVIOUR_OUTCOME_LABEL[outcome] ?? outcome
    : FOLLOWUP_OUTCOME_LABEL[outcome as FollowUpOutcome] ?? outcome;
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
export const NEXT_STEPS = ['complete', 'monitor', 'continue', 'propose', 'ask_manager'] as const;
export type NextStep = (typeof NEXT_STEPS)[number];
export const NEXT_STEP_LABEL: Record<NextStep, string> = {
  complete: 'Kết thúc phương án',
  monitor: 'Theo dõi thêm',
  continue: 'Tiếp tục phương án cũ',
  propose: 'Đề xuất phương án mới',
  ask_manager: 'Xin hỗ trợ từ Quản lý',
};
export const NEXT_STEP_HINT: Record<NextStep, string> = {
  complete: 'Khép lại phương án này. Case chỉ đóng được khi mọi phương án đã khép.',
  monitor: 'Ghi kết quả chu kỳ vừa rồi và mở một chu kỳ theo dõi mới.',
  continue: 'Giữ nguyên phương án, mở chu kỳ mới để làm tiếp.',
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
 * Các bước tiếp theo ở TAB KẾT THÚC. "Tiếp tục chính phương án này" không nằm ở đây — nhu
 * cầu đó thuộc tab theo dõi, và để nó ở cả hai chỗ là mời người dùng chọn nhầm.
 */
export function endStepsFor(outcome: string): NextStep[] {
  return GOOD_OUTCOMES.includes(outcome)
    ? ['complete', 'propose', 'ask_manager']
    : ['propose', 'ask_manager'];
}

/** Bước tiếp theo hợp lệ theo tab đang đứng. */
export function stepsForMode(mode: string, outcome: string): NextStep[] {
  return mode === 'end' ? endStepsFor(outcome) : ['continue'];
}

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
