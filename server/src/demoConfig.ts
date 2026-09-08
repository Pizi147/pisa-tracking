import { db } from './db.ts';
import { nowIso, todayInBusinessTz, isIsoDate } from './util.ts';

/**
 * Đồng hồ demo: mọi phép tính hạn/tuần dùng ngày này thay cho ngày thật,
 * để dữ liệu seed và các trạng thái quá hạn ổn định khi review.
 */
export type ScenarioMode = 'normal' | 'loading' | 'empty' | 'error' | 'save_failure';

const DEFAULTS: Record<string, string> = {
  demo_date: '',
  scenario_mode: 'normal',
  seeded_at: '',
  signal_policy_version: '2',
};

export function getConfig(key: string): string {
  const row = db().prepare('SELECT value FROM demo_config WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? DEFAULTS[key] ?? '';
}

export function setConfig(key: string, value: string) {
  db()
    .prepare(
      `INSERT INTO demo_config (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(key, value, nowIso());
}

/** Ngày nghiệp vụ đang dùng: ngày demo nếu đã đặt, nếu không thì hôm nay theo giờ VN. */
export function demoToday(): string {
  const v = getConfig('demo_date');
  return isIsoDate(v) ? v : todayInBusinessTz();
}

export function scenarioMode(): ScenarioMode {
  const v = getConfig('scenario_mode');
  return (['normal', 'loading', 'empty', 'error', 'save_failure'].includes(v)
    ? v
    : 'normal') as ScenarioMode;
}

export type SignalPolicy = {
  id: number;
  version: number;
  label: string;
  attendance_min_rate: number;
  homework_min_rate: number;
  lookback_weeks: number;
  due_soon_days: number;
  long_running_days: number;
  is_experimental: number;
  status: string;
};

export function activeSignalPolicy(): SignalPolicy {
  const row = db()
    .prepare("SELECT * FROM signal_policies WHERE status = 'active' ORDER BY version DESC LIMIT 1")
    .get() as SignalPolicy | undefined;
  if (row) return row;
  return {
    id: 0, version: 0, label: 'Mặc định',
    attendance_min_rate: 0.8, homework_min_rate: 0.7,
    lookback_weeks: 4, due_soon_days: 3, long_running_days: 21,
    is_experimental: 1, status: 'active',
  };
}
