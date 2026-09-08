import {
  ATTENDANCE_LABEL, BRANCH_REPORT_STATUS_LABEL, DEADLINE_LABEL, ENROLLMENT_STATUS_LABEL,
  HOMEWORK_LABEL, ISSUE_STATUS_LABEL, PRIORITY_LABEL, RISK_LABEL, TASK_STATUS_LABEL,
  TEACHING_SKILL_LABEL, type TeachingSkill,
} from '@shared/domain.ts';

export const skillLabel = (s: string) => TEACHING_SKILL_LABEL[s as TeachingSkill] ?? s;
export const taskStatusLabel = (s: string) => TASK_STATUS_LABEL[s as keyof typeof TASK_STATUS_LABEL] ?? s;
export const deadlineLabel = (s: string) => DEADLINE_LABEL[s as keyof typeof DEADLINE_LABEL] ?? s;
export const issueStatusLabel = (s: string) => ISSUE_STATUS_LABEL[s as keyof typeof ISSUE_STATUS_LABEL] ?? s;
export const riskLabel = (s: string) => RISK_LABEL[s as keyof typeof RISK_LABEL] ?? s;
export const priorityLabel = (s: string) => PRIORITY_LABEL[s as keyof typeof PRIORITY_LABEL] ?? s;
export const branchStatusLabel = (s: string) => BRANCH_REPORT_STATUS_LABEL[s as keyof typeof BRANCH_REPORT_STATUS_LABEL] ?? s;
export const enrollmentStatusLabel = (s: string) => ENROLLMENT_STATUS_LABEL[s as keyof typeof ENROLLMENT_STATUS_LABEL] ?? s;
export const attendanceLabel = (s: string) => ATTENDANCE_LABEL[s as keyof typeof ATTENDANCE_LABEL] ?? s;
export const homeworkLabel = (s: string) => HOMEWORK_LABEL[s as keyof typeof HOMEWORK_LABEL] ?? s;

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

export function fmtBand(n: number | null | undefined): string {
  return n === null || n === undefined ? 'Chưa có' : Number(n).toFixed(1);
}

export function fmtScore(n: number | null | undefined, scale: string): string {
  if (n === null || n === undefined) return 'Chưa có';
  if (scale === 'ielts') return Number(n).toFixed(1);
  return String(n);
}

export function fmtPercent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return '—';
  return `${Math.round(rate * 1000) / 10}%`;
}

export function fmtRatePct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return '—';
  return `${pct}%`;
}

export function scaleLabel(scale: string): string {
  return { ielts: 'Thang IELTS', score10: 'Thang 10', score100: 'Thang 100' }[scale] ?? scale;
}

export function testTypeLabel(t: string): string {
  return { entrance: 'Entrance Test', mock: 'Mock Test', progress: 'Progress Test', final: 'Final Test' }[t] ?? t;
}

export function weekRangeLabel(weekStart: string): string {
  const end = addDaysStr(weekStart, 6);
  return `${weekStart.slice(8, 10)}/${weekStart.slice(5, 7)} – ${end.slice(8, 10)}/${end.slice(5, 7)}`;
}

export function addDaysStr(d: string, days: number): string {
  const dt = new Date(d + 'T00:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function mondayOf(d: string): string {
  const dt = new Date(d + 'T00:00:00Z');
  const dow = dt.getUTCDay();
  return addDaysStr(d, dow === 0 ? -6 : 1 - dow);
}

/** Nhãn cho ô dữ liệu chưa nhập / không áp dụng — phân biệt rõ với số 0. */
export function dataStateLabel(state: string): string {
  return {
    not_applicable: 'Không áp dụng',
    not_updated: 'Chưa có dữ liệu',
    partial: 'Nhập một phần',
    updated: 'Đã cập nhật',
  }[state] ?? state;
}
