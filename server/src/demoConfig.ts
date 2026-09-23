import { db } from './db.ts';
import { nowIso, todayInBusinessTz, isIsoDate } from './util.ts';
import { laBanChinh } from './moiTruong.ts';
import { nho } from './platform/nguCanhRequest.ts';

/**
 * Đồng hồ demo: mọi phép tính hạn/tuần dùng ngày này thay cho ngày thật,
 * để dữ liệu seed và các trạng thái quá hạn ổn định khi review.
 */
export type ScenarioMode = 'normal' | 'loading' | 'empty' | 'error' | 'save_failure';

const DEFAULTS: Record<string, string> = {
  demo_date: '',
  scenario_mode: 'normal',
  seeded_at: '',
};

/**
 * PR-TD: qua bộ nhớ request (GET) — `demoToday()`/`scenarioMode()` gọi hàm này liên tục trong một lượt (mỗi tra cứu
 * hạn, mỗi dòng danh sách…), mỗi lần một câu SQL. Ngoài request GET (không có kho, hoặc có ghi ở giữa) vẫn hỏi DB
 * mỗi lần như cũ — `setConfig` đi qua `run()` nên tự làm mất bộ nhớ, không cần lo đọc phải giá trị cũ.
 */
export function getConfig(key: string): string {
  return nho('cfg:' + key, () => {
    // Database có thể chưa được seed (chưa có bảng nào). Khi đó dùng giá trị mặc định
    // thay vì ném lỗi, để ứng dụng vẫn mở được và hiển thị hướng dẫn tạo dữ liệu.
    try {
      const row = db().prepare('SELECT value FROM demo_config WHERE key = ?').get(key) as
        | { value: string }
        | undefined;
      return row?.value ?? DEFAULTS[key] ?? '';
    } catch {
      return DEFAULTS[key] ?? '';
    }
  });
}

export function setConfig(key: string, value: string) {
  db()
    .prepare(
      `INSERT INTO demo_config (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(key, value, nowIso());
}

/** Ngày nghiệp vụ đang dùng: ngày demo nếu đã đặt, nếu không thì hôm nay theo giờ VN. Bản chính: LUÔN là ngày thật. */
export function demoToday(): string {
  if (laBanChinh()) return todayInBusinessTz();
  const v = getConfig('demo_date');
  return isIsoDate(v) ? v : todayInBusinessTz();
}

export function scenarioMode(): ScenarioMode {
  /* Bản chính không có kịch bản giả lập lỗi — và trả sớm để khỏi tốn một lượt mạng tới Turso mỗi lần gọi. */
  if (laBanChinh()) return 'normal';
  const v = getConfig('scenario_mode');
  return (['normal', 'loading', 'empty', 'error', 'save_failure'].includes(v)
    ? v
    : 'normal') as ScenarioMode;
}
