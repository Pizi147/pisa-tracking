/** FAST TRACK — lịch Mock Test, kỳ vọng theo lượt và mức SOS. */

import type { ProgrammeCode } from './normal.ts';

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
 * LỚP FT CHỈ ĐỀ XUẤT SẴN BA LƯỢT.
 *
 * Đa số học viên chỉ thi ba lượt MT; MT4 và MT5 là dự phòng cho em cần kéo dài. Đề xuất
 * sẵn cả năm lượt thì lịch của mọi em dài gấp rưỡi sự thật, và Quản lý phải đi xoá bớt —
 * việc không ai muốn làm nên sẽ không ai làm.
 */
export const MOCK_FT_DEFAULT_ATTEMPTS = 3;

/**
 * BẬC THANG LỚP NORMAL — học xong một lớp thì em đi đâu tiếp.
 *
 *     FOU  →  BE  →  ELE  →  (hết bậc Normal)
 *
 * Và ở BẤT KỲ bậc nào, em cũng có thể lên thẳng FT nếu đủ trình. Nên khi một lớp Normal
 * học hết chương trình, mỗi em luôn có ĐÚNG HAI đường (owner chốt 13/09/2026):
 *
 *     1. lên FT
 *     2. lên bậc Normal kế tiếp
 *
 * Riêng lớp ELE chỉ còn một đường, vì trên ELE không còn bậc Normal nào nữa.
 *
 * Đây KHÔNG phải một quyết định hệ thống tự làm. Nó chỉ nói "em này học xong rồi, phải xếp
 * lớp cho em" và bày sẵn hai lựa chọn; người xếp lớp mới là người quyết.
 */
export const NORMAL_LADDER: Partial<Record<ProgrammeCode, ProgrammeCode>> = {
  FOU: 'BE',
  BE: 'ELE',
};

/** Hai đường đi tiếp của một em vừa học xong lớp Normal. Luôn có 'FT'. */
export function nextStepsAfter(code: ProgrammeCode | null): ProgrammeCode[] {
  if (!code || code === 'FT') return [];
  const up = NORMAL_LADDER[code];
  return up ? [up, 'FT'] : ['FT'];
}

/**
 * CHẶNG CỦA MỘT LỚP NORMAL trong chương trình của nó.
 *
 * Sáu chặng, và mỗi chặng dẫn tới một việc khác nhau cho người vận hành — đó là lý do
 * chúng phải tách ra chứ không gộp thành "đang học / đã xong":
 *
 *   not_started    chưa tới tuần khai giảng
 *   running        đang học bình thường, chưa tới mốc nào
 *   progress_soon  tuần sau là Progress Test  → chuẩn bị đề, nhắc giáo viên
 *   progress_week  ĐANG trong tuần Progress Test
 *   final_soon     tuần sau là Final Test      → chuẩn bị đề, nhắc phụ huynh
 *   final_week     ĐANG trong tuần Final Test
 *   finished       hết chương trình            → PHẢI xếp lớp tiếp theo cho từng em
 *   unknown        chưa khai tuần bắt đầu nên chưa tính được gì
 */
export const CLASS_PHASES = [
  'unknown', 'not_started', 'running',
  'progress_soon', 'progress_week', 'final_soon', 'final_week', 'finished',
] as const;
export type ClassPhase = (typeof CLASS_PHASES)[number];

export const CLASS_PHASE_LABEL: Record<ClassPhase, string> = {
  unknown: 'Chưa khai tuần bắt đầu',
  not_started: 'Chưa khai giảng',
  running: 'Đang học',
  progress_soon: 'Tuần sau Progress Test',
  progress_week: 'Progress Test tuần này',
  final_soon: 'Tuần sau Final Test',
  final_week: 'Final Test tuần này',
  finished: 'Đã hết chương trình',
};

/** Chặng nào đáng nổi lên màn hình, và nổi ở mức nào. */
export const CLASS_PHASE_TONE: Record<ClassPhase, 'ok' | 'info' | 'warn' | 'danger' | 'muted'> = {
  unknown: 'warn',
  not_started: 'muted',
  running: 'ok',
  progress_soon: 'info',
  progress_week: 'warn',
  final_soon: 'info',
  final_week: 'warn',
  finished: 'danger',
};

/**
 * Tuần học thứ mấy, tính từ TUẦN BẮT ĐẦU HỌC (tuần bắt đầu là tuần thứ 1).
 *
 * Cả hai mốc đều là thứ Hai của tuần, nên phép trừ luôn ra số nguyên tuần. Trả về `null`
 * khi thiếu một trong hai — thiếu căn cứ thì để trống, không đoán ra tuần 1.
 */
export function studyWeekOf(startMonday: string | null | undefined, monday: string | null | undefined): number | null {
  if (!startMonday || !monday) return null;
  const a = Date.parse(startMonday + 'T00:00:00Z');
  const b = Date.parse(monday + 'T00:00:00Z');
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.floor((b - a) / (7 * 86400000)) + 1;
}

/** Tháng/năm dạng 'YYYY-MM' → '11/2026'. Trống thì trả về chuỗi rỗng. */
export function fmtExamMonth(v: string | null | undefined): string {
  if (!v || !/^\d{4}-\d{2}$/.test(v)) return '';
  return `${v.slice(5, 7)}/${v.slice(0, 4)}`;
}

/**
 * Trạng thái một lượt đánh giá.
 * KHÔNG dùng từ "thi" cho Mock — "thi" chỉ dành cho kỳ thi IELTS chính thức.
 */
export const ATTEMPT_STATUSES = ['planned', 'done', 'cancelled'] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];
export const ATTEMPT_STATUS_LABEL: Record<AttemptStatus, string> = {
  planned: 'Đã lên lịch', done: 'Đã xong', cancelled: 'Đã huỷ',
};

/**
 * PHẠM VI YÊU CẦU của một kỹ năng trong một đợt (mục 10.1).
 *
 * Mặc định MỌI kỹ năng đều nằm trong phạm vi. Quản lý có thể chốt TRƯỚC là đợt này chỉ
 * mock một số kỹ năng — trường hợp rất hiếm. Lớp Normal thì không: Progress/Final Test
 * luôn phải đủ bốn môn, không có thao tác miễn môn.
 *
 * "Ngoài phạm vi" KHÁC "vắng": vắng là em đã được xếp lịch mà không thi, và đợt đó vẫn
 * còn thiếu kết quả. Bỏ một môn khỏi phạm vi SAU khi em vắng chính là cách hợp thức hoá
 * một đợt thiếu thành hoàn tất, nên hệ thống chặn.
 */
export const SKILL_REQUIREMENTS = ['required', 'skipped'] as const;
export type SkillRequirement = (typeof SKILL_REQUIREMENTS)[number];
export const SKILL_REQUIREMENT_LABEL: Record<SkillRequirement, string> = {
  required: 'Trong phạm vi', skipped: 'Ngoài phạm vi',
};

/**
 * TRẠNG THÁI THI của một kỹ năng trong một đợt — thứ được LƯU, không suy ra từ điểm.
 *
 * Ô điểm trống KHÔNG đủ để kết luận em vắng (mục 10.6): có thể giáo viên chưa chấm, có
 * thể bài thất lạc. Vì thế trạng thái thi là một bản ghi riêng, do người xác nhận.
 */
export const SIT_STATUSES = ['scheduled', 'sat', 'absent', 'cancelled'] as const;
export type SitStatus = (typeof SIT_STATUSES)[number];
export const SIT_STATUS_LABEL: Record<SitStatus, string> = {
  scheduled: 'Theo lịch',
  sat: 'Đã thi',
  absent: 'Đã xác nhận vắng',
  cancelled: 'Đã huỷ phần thi',
};

/**
 * TIẾN ĐỘ của một kỹ năng trong một đợt — mỗi giá trị là MỘT việc khác nhau của người dùng.
 *
 * Từ vòng 7 mỗi kỹ năng có LỊCH RIÊNG, nên bảy câu hỏi dưới đây không còn gộp được nữa
 * (mục 10.5). Đặc biệt "chưa đến lịch" phải tách khỏi "đã đến lịch mà chưa ai xác nhận":
 * môn thi tuần sau thì chưa nợ ai cái gì, còn môn thi tuần trước thì đang nợ.
 */
export const SKILL_PROGRESS = [
  'skipped', 'not_scheduled', 'upcoming', 'due', 'sat', 'absent', 'scored',
  'reschedule_pending', 'cancelled',
] as const;
export type SkillProgress = (typeof SKILL_PROGRESS)[number];
export const SKILL_PROGRESS_LABEL: Record<SkillProgress, string> = {
  skipped: 'Ngoài phạm vi',
  not_scheduled: 'Chưa xếp tuần',
  upcoming: 'Chưa đến lịch',
  /**
   * Tuần thi của CHÍNH kỹ năng này đã tới hoặc đã qua mà chưa có điểm. KHÔNG nói "chưa xác nhận đã thi" (MT-P03): có
   * lịch và đúng quyền là nhập được, không có bước xác nhận bắt buộc trước khi chấm.
   */
  due: 'Chờ nhập điểm',
  sat: 'Đã thi, chờ nhập điểm',
  absent: 'Đã xác nhận vắng',
  scored: 'Đã có điểm',
  reschedule_pending: 'Chờ duyệt dời',
  cancelled: 'Đã huỷ phần thi',
};

/**
 * Kỹ năng này có đang NỢ ĐIỂM không — tức là đã đến lúc phải có điểm mà chưa có.
 *
 * Một nơi trả lời, để hàng đợi "cần nhập điểm", con số quá hạn và badge trên hồ sơ không
 * bao giờ đếm lệch nhau.
 */
export function awaitingScore(progress: SkillProgress): boolean {
  return progress === 'due' || progress === 'sat';
}

/**
 * DỰ KIẾN THI của một lộ trình, ở đúng mức chắc chắn mà người ta thực sự biết.
 *
 *   `week`  đã chốt tuần   → "W2 FEB 2027"                  — có đếm ngược
 *   `month` mới biết tháng → "FEB 2027" — KHÔNG đếm ngược, và KHÔNG kèm chú thích dài dòng
 *   `none`  chưa biết gì   → "Chưa xác định"
 *
 * Máy chủ dựng sẵn cả nhãn lẫn mức chắc chắn, để không màn hình nào tự bịa ra cách nói
 * riêng của mình — và để không chỗ nào lỡ hiển thị "còn 134 ngày" từ một cái tháng.
 */
export type ExamPlan = {
  confidence: 'week' | 'month' | 'none';
  periodId: number | null;
  /** Thứ Hai của tuần thi. CHỈ có khi `confidence = 'week'`. */
  weekStart: string | null;
  month: string | null;
  label: string;
};

/**
 * BÀI CẦN CHẤM — MỘT LUẬT DUY NHẤT, dùng cho CẢ badge và danh sách.
 *
 * Đây là chỗ lỗi cũ sinh ra: badge đếm theo "được phép sửa", danh sách lọc theo "được phân
 * công", nên Quản trị thấy badge 28 rồi bấm vào ra rỗng. Hai phép đếm riêng thì dù có sửa
 * cho khớp hôm nay, lần sửa sau chúng lại lệch. Nên chỉ có một hàm, và hai nơi cùng gọi nó.
 *
 * `mine`     kỹ năng người đang xem ĐƯỢC PHÂN CÔNG dạy — việc của chính họ.
 * `managed`  mọi bài chưa chấm trong phạm vi họ được xem, ai phụ trách cũng tính. Đây là
 *            con số để ĐÔN ĐỐC, nên nó không phụ thuộc việc người xem có quyền sửa hay không.
 */
export type PendingCell = {
  skill: string;
  required: boolean;
  scored: boolean;
  progress: SkillProgress;
  mine: boolean;
  /** Đã báo '-' (không có bài): không phải bài cần chấm. */
  noShow?: boolean;
};

export function pendingSkillsOf(cells: PendingCell[], scope: 'mine' | 'managed'): string[] {
  return cells
    .filter((c) => c.required && !c.scored && !c.noShow && awaitingScore(c.progress))
    .filter((c) => (scope === 'mine' ? c.mine : true))
    .map((c) => c.skill);
}

// ---------------------------------------------------------------- dấu '-' và chốt không dự thi (PR-G)

/**
 * DẤU '-' Ở Ô ĐIỂM VÀ VIỆC CHỐT "KHÔNG DỰ THI" CUỐI CHỦ NHẬT — rule book §17.1 (chốt mới nhất, thay mọi
 * mô tả cũ mâu thuẫn).
 *
 * GV được phân công nhập '-' để báo em có lịch Mock tuần đó nhưng KHÔNG LÀM BÀI. Sửa lại được trước khi
 * tuần kết thúc; nếu '-' vẫn còn khi hết Chủ nhật thì xác lập KHÔNG DỰ THI. Không còn bước GVCN xác minh
 * thường lệ.
 *
 * "KỂ CẢ KHÔNG AI MỞ WEB" — và dự án này không có cron. Nên kết quả chốt là HÀM THUẦN THEO THỜI GIAN:
 * hàm của (dấu '-' đang có · TUẦN LỊCH CỦA CHÍNH BÀI ĐÓ · ngày nghiệp vụ hiện tại), KHÔNG phải hàm của
 * thời điểm chạy. Chạy Chủ nhật 23:59, sáng thứ Hai, hay thứ Năm tuần sau đều ra CÙNG MỘT kết quả và
 * CÙNG MỘT ngày hiệu lực (cuối Chủ nhật của tuần đó). Nhờ vậy chỉ cần gọi nó ở đường đọc.
 *
 * Ba điều nó KHÔNG làm: không suy ô trống thành vắng (ô trống chỉ là chưa nhập); không coi '-' là điểm 0;
 * không đụng bài khác (W1 báo '-' không xoá W2 hay S).
 */
export type NoShowState =
  /** Không có dấu '-' nào còn hiệu lực. */
  | 'none'
  /** Đã báo '-', tuần chưa kết thúc — còn sửa được đến hết Chủ nhật. */
  | 'khong-co-bai'
  /** '-' còn nguyên khi hết Chủ nhật → đã xác lập không dự thi. */
  | 'khong-du-thi'
  /** '-' nhập cho một tuần ĐÃ kết thúc từ trước: chờ Quản lý hiệu chỉnh (C10), chưa tự chốt. */
  | 'cho-ql-hieu-chinh';

export type NoShowView = {
  state: NoShowState;
  /** Ngày hiệu lực của việc chốt = cuối Chủ nhật của tuần lịch của bài. Không phụ thuộc lúc chạy. */
  effectiveOn: string | null;
  /** Còn sửa được đến hết ngày này (chỉ khi `khong-co-bai`). */
  editableUntil: string | null;
};

export function noShowStateOf(i: {
  /** Có dấu '-' được lưu cho ô này. */
  marked: boolean;
  /** Đã có ĐIỂM (band hoặc số câu đúng) — điểm thật luôn thắng dấu '-'. */
  hasScore: boolean;
  /** Dấu '-' được lưu cho ĐÚNG tuần lịch hiện tại của bài. Lịch đã dời sang tuần khác thì dấu cũ hết nghĩa. */
  sameWeek: boolean;
  /** Chủ nhật của tuần lịch của bài. */
  weekEnd: string | null;
  /** Ngày nghiệp vụ hiện tại. */
  today: string;
  /** Dấu '-' được nhập KHI tuần đó đã kết thúc từ trước (ngoại lệ C10). */
  enteredAfterWeekEnd: boolean;
  /** Luật C10 đang dùng — truyền từ `policy.ts`, không tự chọn ở đây. */
  lateRule: 'cho-ql-hieu-chinh' | 'chot-ngay';
}): NoShowView {
  const none: NoShowView = { state: 'none', effectiveOn: null, editableUntil: null };
  if (!i.marked || i.hasScore || !i.sameWeek || !i.weekEnd) return none;
  const end = i.weekEnd.slice(0, 10);
  if (i.enteredAfterWeekEnd && i.lateRule === 'cho-ql-hieu-chinh') {
    return { state: 'cho-ql-hieu-chinh', effectiveOn: null, editableUntil: null };
  }
  if (i.enteredAfterWeekEnd || i.today > end) return { state: 'khong-du-thi', effectiveOn: end, editableUntil: null };
  return { state: 'khong-co-bai', effectiveOn: null, editableUntil: end };
}

/** Gợi ý trong ô nhập điểm (rule book §17.1, TU_DIEN_VA_CHU §3). */
export const NO_SHOW_HINT = 'Nhập - nếu học viên không làm bài';

/** Câu trạng thái của một ô có dấu '-'. `weekCode` là mã tuần đầy đủ, ví dụ `W3 SEP 2026`. */
export function noShowText(v: NoShowView, weekCode: string | null, today: string): string | null {
  const day = (iso: string) => {
    const s = iso.slice(0, 10);
    const dm = `${s.slice(8, 10)}/${s.slice(5, 7)}`;
    return s.slice(0, 4) === today.slice(0, 4) ? dm : `${dm}/${s.slice(0, 4)}`;
  };
  switch (v.state) {
    case 'khong-co-bai': return `Không có bài · Có thể sửa đến hết Chủ nhật ${day(v.editableUntil!)}`;
    case 'khong-du-thi': return `Không dự thi · Tuần ${weekCode ?? ''}`.trim();
    case 'cho-ql-hieu-chinh': return 'Chờ quản lý hiệu chỉnh';
    default: return null;
  }
}
