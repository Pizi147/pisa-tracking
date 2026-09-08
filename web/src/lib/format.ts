import {
  ASSESSED_SKILL_LABEL, CASE_STATUS_LABEL, DUE_LABEL, ENTRY_SKILL_LABEL, ENTRY_SKILL_SHORT,
  MOCK_STATUS_LABEL, ROLE_LABEL, SOS_LABEL, TASK_PROGRESS_LABEL, TASK_TYPE_LABEL,
  UNIT_STATUS_LABEL, type AssessedSkill, type EntrySkill, type SosLevel,
} from '@shared/domain.ts';

export const skillLabel = (s: string) => ENTRY_SKILL_LABEL[s as EntrySkill] ?? ASSESSED_SKILL_LABEL[s as AssessedSkill] ?? s;
export const skillShort = (s: string) => ENTRY_SKILL_SHORT[s as EntrySkill] ?? s;
export const roleLabel = (s: string) => ROLE_LABEL[s as keyof typeof ROLE_LABEL] ?? s;
export const mockStatusLabel = (s: string) => MOCK_STATUS_LABEL[s as keyof typeof MOCK_STATUS_LABEL] ?? s;
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
/** Ngày ngắn dùng trong bảng, bỏ năm khi cùng năm với ngày tham chiếu. */
export function fmtDay(d?: string | null): string {
  if (!d) return '—';
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
}

export function fmtDateTime(d?: string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return fmtDate(d);
  return `${fmtDate(d)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
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
export function dueTone(state: string): Tone {
  return state === 'overdue' ? 'danger' : state === 'due_soon' ? 'warn' : state === 'closed' ? 'ok' : 'neutral';
}
export function unitTone(status: string | null): Tone {
  return status === null ? 'muted' : status === 'problem' ? 'danger' : status === 'watch' ? 'warn' : 'ok';
}
export function caseTone(status: string | null): Tone {
  return status === 'done' ? 'ok' : status === 'in_progress' ? 'info' : 'warn';
}
