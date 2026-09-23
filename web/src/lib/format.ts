import {
  ASSESSED_SKILL_LABEL, ATTEMPT_STATUS_LABEL, CASE_STATUS_LABEL, CASE_STATUS_TONE, DUE_LABEL, ENTRY_SKILL_LABEL,
  ENTRY_SKILL_SHORT, REGULAR_SKILL_LABEL, REGULAR_SKILL_SHORT, ROLE_LABEL, SKILL_PROGRESS_LABEL, SOS_LABEL, STUDENT_STATUS_LABEL,
  TASK_PROGRESS_LABEL, TASK_TYPE_LABEL, UNIT_STATUS_LABEL,
  type AssessedSkill, type EntrySkill, type SkillProgress, type SosLevel, type StudentStatus,
} from '@shared/domain/index.ts';

/*
 * Tên đầy đủ của một kỹ năng, tra qua CẢ BA bộ.
 *
 * Thiếu `REGULAR_SKILL_LABEL` thì môn của lớp Normal rơi xuống nhánh cuối và hiện nguyên mã
 * máy trên giao diện — chữ thường, không dấu, giữa một danh sách tên riêng viết hoa.
 */
export const skillLabel = (s: string) =>
  ENTRY_SKILL_LABEL[s as EntrySkill] ?? ASSESSED_SKILL_LABEL[s as AssessedSkill]
  ?? REGULAR_SKILL_LABEL[s as keyof typeof REGULAR_SKILL_LABEL] ?? s;
export const skillShort = (s: string) => ENTRY_SKILL_SHORT[s as EntrySkill] ?? REGULAR_SKILL_SHORT[s] ?? s;
export const roleLabel = (s: string) => ROLE_LABEL[s as keyof typeof ROLE_LABEL] ?? s;
/** Không dùng từ "thi" cho Mock — "thi" chỉ dành cho kỳ IELTS chính thức. */
export const attemptStatusLabel = (s: string) => ATTEMPT_STATUS_LABEL[s as keyof typeof ATTEMPT_STATUS_LABEL] ?? s;
export const progressLabel = (s: string) => SKILL_PROGRESS_LABEL[s as SkillProgress] ?? s;
export const studentStatusLabel = (s: string) => STUDENT_STATUS_LABEL[s as StudentStatus] ?? s;
export const caseStatusLabel = (s: string) => CASE_STATUS_LABEL[s as keyof typeof CASE_STATUS_LABEL] ?? s;
export const unitStatusLabel = (s: string | null) => (s === null ? 'Chưa báo cáo' : UNIT_STATUS_LABEL[s as keyof typeof UNIT_STATUS_LABEL] ?? s);
export const taskProgressLabel = (s: string) => TASK_PROGRESS_LABEL[s as keyof typeof TASK_PROGRESS_LABEL] ?? s;
export const taskTypeLabel = (s: string) => TASK_TYPE_LABEL[s as keyof typeof TASK_TYPE_LABEL] ?? s;
export const dueLabel = (s: string) => DUE_LABEL[s as keyof typeof DUE_LABEL] ?? s;
export const sosLabel = (l: number | null) => (l === null ? 'Chưa đủ điểm' : SOS_LABEL[l as SosLevel] ?? `SOS ${l}`);

export function fmtDate(d?: string | null): string {
  if (!d) return '—';
  const s = d.slice(0, 10);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
}

export function fmtDateTime(d?: string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return fmtDate(d);
  return `${fmtDate(d)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

/** Chỉ giờ:phút — dòng "✓ Đã nhắc HH:mm" (PR-Ra G-1) không cần lặp lại ngày (luôn là hôm nay). */
export function fmtTime(d?: string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}

const TEN_THU = ['Chủ nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];
/** Tên thứ trong tuần từ một ngày ISO — đọc ĐÚNG ngày đưa vào, không viết cứng một thứ cố định (G-6). */
export function fmtThu(d?: string | null): string {
  if (!d) return '';
  const dt = new Date(`${d.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return '';
  return TEN_THU[dt.getUTCDay()];
}

/** Band trống KHÁC điểm 0 — luôn hiện dấu gạch, không bao giờ hiện 0 thay cho ô trống. */
export function fmtBand(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : Number(n).toFixed(1);
}

export function fmtNum(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : String(n);
}

export function addDaysStr(d: string, days: number): string {
  const dt = new Date(d + 'T00:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'muted';

export function sosTone(level: number | null): Tone {
  if (level === null) return 'muted';
  return level === 0 ? 'ok' : level === 1 ? 'info' : level === 2 ? 'warn' : 'danger';
}
/** Ba trạng thái case phải khác nhau ngay từ màu, không cần mở chi tiết mới biết. */
export function caseStatusTone(status: string | null): Tone {
  return (CASE_STATUS_TONE[status as keyof typeof CASE_STATUS_TONE] ?? 'neutral') as Tone;
}
export function dueTone(state: string): Tone {
  return state === 'overdue' ? 'danger' : state === 'due_soon' ? 'warn' : state === 'closed' ? 'ok' : 'neutral';
}
/**
 * Màu của tiến độ một kỹ năng. Mỗi màu là một việc khác nhau của người đọc:
 *
 *   đỏ    đang nợ — đã đến tuần thi mà chưa xác nhận đã thi, hoặc đã thi mà chưa chấm
 *   vàng  cần một quyết định — đã vắng, hoặc đang chờ duyệt dời
 *   xanh  xong
 *   lam   chưa đến lịch, chưa phải việc của ai
 *   xám   ngoài phạm vi, chưa xếp tuần, hoặc đã huỷ phần thi
 */
export function progressTone(p: string): Tone {
  return p === 'scored' ? 'ok'
    : p === 'due' || p === 'sat' ? 'danger'
    : p === 'absent' || p === 'reschedule_pending' ? 'warn'
    : p === 'upcoming' ? 'info'
    : p === 'skipped' || p === 'cancelled' ? 'muted'
    : 'neutral';
}

export function attemptStatusTone(s: string): Tone {
  return s === 'cancelled' ? 'muted' : s === 'done' ? 'info' : 'neutral';
}

/**
 * Ô họp tuần là một KẾT QUẢ (ổn · cần theo dõi · có vấn đề), nên chỉ nhận bốn tông của họ
 * nhãn kết quả — không có `info`, vì "đang thực hiện" không phải một kết luận về lớp.
 */
export function unitTone(status: string | null): 'ok' | 'warn' | 'danger' | 'muted' {
  return status === null ? 'muted' : status === 'problem' ? 'danger' : status === 'watch' ? 'warn' : 'ok';
}
export function caseTone(status: string | null): Tone {
  return status === 'done' ? 'ok' : status === 'in_progress' ? 'info' : 'warn';
}

/**
 * ĐƯỜNG DẪN TỚI ĐIỂM CỦA MỘT LƯỢT ĐÁNH GIÁ — chọn ĐÚNG MÀN theo loại bài.
 *
 * Đây là lỗi owner chỉ ra ở mục 6.3: hồ sơ một em lớp Normal, bấm vào bài giữa khoá thì màn
 * Mock Test mở ra và hiện "MT1" cho một bài Progress Test. Hai loại bài có hai màn riêng vì
 * chúng chấm theo hai cách khác nhau; mở nhầm màn là đọc sai cả kết quả.
 *
 * Một chỗ quyết định duy nhất. Màn nào tự ghép đường dẫn lấy thì sớm muộn lại ghép sai.
 */
export function attemptHref(a: { id: number; kind?: string | null; classId?: number | null }): string {
  if (!a.kind || a.kind === 'mock') return `/mock-test/${a.id}`;
  return a.classId ? `/bang-diem-thuong/${a.classId}?kind=${a.kind}` : `/mock-test/${a.id}`;
}
