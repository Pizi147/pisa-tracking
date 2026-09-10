import { db } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { addDays, diffDays } from '../util.ts';
import { mondayOf, weekInfo } from './week.ts';
import { loadBundle, resultOf } from './attempts.ts';
import { allProgrammes, evaluateRegular } from './regular.ts';

/**
 * TỔNG HỢP THEO TUẦN cho Quản lý — thay cho sheet "Tổng hợp theo tuần" của workbook cũ.
 *
 * Ba khác biệt có chủ đích so với file Excel:
 *
 *   1. CHỈ HIỆN TUẦN CÓ DỮ LIỆU. File cũ in sẵn 12 tháng × 5 tuần nên phần lớn màn hình là
 *      số 0 — người đọc phải cuộn qua hàng chục dòng rỗng mới tới chỗ có thật.
 *   2. GỘP BA CỘT "đã trao đổi HS / đã trao đổi PH / P.HT đã xếp hỗ trợ" thành MỘT cột
 *      "đã có hỗ trợ". Ba ô cố định không mô tả được một em có nhiều đợt hỗ trợ khác nhau,
 *      và cái Quản lý cần biết là "case này đã có ai động vào chưa".
 *   3. MỌI CON SỐ ĐỀU BẤM ĐƯỢC, mở đúng danh sách tạo nên nó.
 *
 * Tuần của một lượt là TUẦN KẾ HOẠCH, không phải ngày từng kỹ năng — nếu không một lượt có
 * Speaking lệch ngày sẽ bị đếm thành hai.
 */

export type WeeklyRow = {
  periodId: number;
  code: string;          // "W2 SEP"
  month: string;         // "SEPTEMBER" — dùng gom nhóm
  weekLabel: string;     // "Tuần 2"
  range: string;
  weekStart: string;
  weekEnd: string;
  isCurrent: boolean;

  /** Số lượt đã có ít nhất một kỹ năng được chấm. Chưa chấm gì thì chưa phải "lượt có kết quả". */
  attempts: number;
  onTarget: number;      // đạt kỳ vọng (SOS 0)
  sos1: number;
  sos2: number;
  sos3: number;
  cases: number;         // tổng case SOS mở trong tuần này
  withSupport: number;   // case đã có ít nhất một ghi nhận hỗ trợ
  untouched: number;     // case chưa ai động vào
  /** Số ngày trung bình từ ngày làm bài đến ngày nhập điểm. null khi chưa đủ dữ liệu. */
  scoreLagDays: number | null;
};

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

/**
 * Đã có ít nhất một việc hỗ trợ THỰC SỰ diễn ra, hoặc một lần trao đổi đã xong.
 * Ngày trong tương lai là hẹn, chưa phải đã làm.
 */
function hasSupport(c: any, today: string): boolean {
  return (!!c.support_done && c.support_done <= today)
    || (!!c.contact_done && c.contact_done <= today);
}

export function weeklyRollup(
  p: Principal,
  f: { branchId?: number | null; weeks?: number } = {},
): { rows: WeeklyRow[]; scopeEmpty: boolean; today: string } {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { anyScope: true }, 'Bạn không có quyền xem tổng hợp tuần.');
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true, today: demoToday() };

  const conn = db();
  const today = demoToday();
  // Cửa sổ mặc định: 12 tuần gần nhất tính tới tuần hiện tại. Đủ để thấy xu hướng một quý.
  const weeks = Math.min(Math.max(f.weeks ?? 12, 1), 52);
  const from = addDays(mondayOf(today), -7 * (weeks - 1));

  const cs = classScopeSql(scope);
  const where: string[] = [cs.sql, 'rp.week_start >= ?', 'rp.week_start <= ?'];
  const params: unknown[] = [...cs.params, from, mondayOf(today)];
  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }

  const attempts = conn
    .prepare(
      `SELECT a.id, a.status, a.kind, a.attempt_no, a.class_id, a.planned_period_id, a.target_at_attempt,
              c.programme_code,
              rp.id AS period_id, rp.code, rp.week_start, rp.week_end,
              sc.case_id, sc.sos_level, sc.case_status, sc.support_done,
              ct.contact_done
         FROM assessment_attempts a
         JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN classes c ON c.id = a.class_id
         /* Một lượt nay có nhiều vấn đề — gộp lại thành một dòng cho lượt. */
         LEFT JOIN (
           SELECT s.attempt_id, MIN(s.id) AS case_id, MAX(s.sos_level) AS sos_level,
                  MIN(s.status) AS case_status,
                  MAX((SELECT MAX(COALESCE(i.completed_date, i.started_date))
                         FROM case_interventions i
                        WHERE i.case_id = s.id AND i.status != 'cancelled')) AS support_done
             FROM sos_cases s WHERE s.attempt_id IS NOT NULL GROUP BY s.attempt_id
         ) sc ON sc.attempt_id = a.id
         LEFT JOIN (
           SELECT attempt_id, MAX(done_on) AS contact_done FROM student_contacts
            WHERE attempt_id IS NOT NULL GROUP BY attempt_id
         ) ct ON ct.attempt_id = a.id
        WHERE ${where.join(' AND ')} AND a.status != 'cancelled'`,
    )
    .all(...params) as any[];

  /*
   * "Đạt kỳ vọng" KHÔNG đọc được từ bảng case: case chỉ tồn tại khi SOS ≥ 1, nên đếm theo
   * case thì cột này vĩnh viễn bằng 0. Phải tính lại kết quả của từng lượt, đúng bằng cùng
   * bộ máy chấm mà các màn khác dùng — FT theo band, lớp thường theo tỷ lệ.
   */
  const bundle = loadBundle(attempts.map((a) => a.id));
  const programmes = allProgrammes();
  const resultOfAttempt = (a: any): { sosLevel: number | null } => {
    const scores = bundle.scores.get(a.id) ?? [];
    const prog = a.programme_code ? programmes.get(a.programme_code) : null;
    if (prog?.scoringMode === 'ratio') return evaluateRegular(prog.skills, scores);
    return resultOf(a, scores, bundle.skips.get(a.id) ?? []);
  };

  // Độ trễ chấm: ngày làm bài → ngày nhập điểm, tính trên từng ô điểm rồi lấy trung bình tuần.
  const lag = new Map<number, { sum: number; n: number }>();
  if (attempts.length) {
    const ids = attempts.map((a) => a.id);
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      for (const r of conn
        .prepare(
          `SELECT s.attempt_id, s.taken_on, s.entered_at, a.planned_period_id
             FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id
            WHERE s.attempt_id IN (${chunk.map(() => '?').join(',')})
              AND s.taken_on IS NOT NULL AND s.entered_at IS NOT NULL`,
        )
        .all(...chunk) as any[]) {
        const days = diffDays(r.taken_on, String(r.entered_at).slice(0, 10));
        if (days < 0 || days > 120) continue;          // dữ liệu lệch thì bỏ, không kéo trung bình
        const cur = lag.get(r.planned_period_id) ?? { sum: 0, n: 0 };
        cur.sum += days; cur.n += 1;
        lag.set(r.planned_period_id, cur);
      }
    }
  }

  const scored = new Set<number>();
  if (attempts.length) {
    const ids = attempts.map((a) => a.id);
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      for (const r of conn
        .prepare(
          `SELECT DISTINCT attempt_id FROM assessment_scores
            WHERE attempt_id IN (${chunk.map(() => '?').join(',')})
              AND (band IS NOT NULL OR raw_score IS NOT NULL)`,
        )
        .all(...chunk) as any[]) scored.add(r.attempt_id);
    }
  }

  const byPeriod = new Map<number, WeeklyRow>();
  for (const a of attempts) {
    if (!byPeriod.has(a.period_id)) {
      const info = weekInfo(a.week_start);
      byPeriod.set(a.period_id, {
        periodId: a.period_id, code: a.code,
        month: MONTHS[info.month - 1] ?? '',
        weekLabel: `Tuần ${info.weekNo}`,
        range: info.range, weekStart: a.week_start, weekEnd: a.week_end,
        isCurrent: a.week_start <= today && a.week_end >= today,
        attempts: 0, onTarget: 0, sos1: 0, sos2: 0, sos3: 0,
        cases: 0, withSupport: 0, untouched: 0, scoreLagDays: null,
      });
    }
    const row = byPeriod.get(a.period_id)!;
    if (!scored.has(a.id)) continue;          // chưa chấm gì thì chưa phải một lượt có kết quả
    row.attempts += 1;

    const level = resultOfAttempt(a).sosLevel;
    if (level === 0) row.onTarget += 1;
    else if (level === 1) row.sos1 += 1;
    else if (level === 2) row.sos2 += 1;
    else if (level === 3) row.sos3 += 1;

    // Case là bản ghi theo dõi xử lý — đếm riêng với mức SOS, vì một lượt có thể đã đạt
    // trở lại sau khi sửa điểm mà case vẫn còn để tra lịch sử.
    if (a.case_id && a.sos_level > 0) {
      row.cases += 1;
      if (hasSupport(a, today)) row.withSupport += 1;
      else if (a.case_status !== 'done') row.untouched += 1;
    }
  }

  for (const [pid, row] of byPeriod) {
    const l = lag.get(pid);
    row.scoreLagDays = l && l.n > 0 ? Math.round((l.sum / l.n) * 10) / 10 : null;
  }

  const rows = [...byPeriod.values()].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
  return { rows, scopeEmpty: false, today };
}
