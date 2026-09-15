import { db } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { mondayOf, weekInfo } from '../platform/week.ts';
import { loadBundle, resultOf } from '../fasttrack/attempts.ts';
import { allProgrammes, evaluateRegular } from '../normal/regular.ts';

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
  code: string;          // "W2 SEP 2026"
  month: string;         // "SEPTEMBER" — dùng gom nhóm
  weekLabel: string;     // "Tuần 2"
  range: string;
  weekStart: string;
  weekEnd: string;
  isCurrent: boolean;

  /**
   * SÁU CỘT LOẠI TRỪ NHAU, CỘNG LẠI ĐÚNG BẰNG `attempts` (mục 4.2).
   *
   * `attempts` là số LƯỢT đã chấm ít nhất một kỹ năng — chưa chấm gì thì chưa phải một lượt
   * có kết quả. Năm cột kết luận chia hết số đó, không cột nào chồng lên cột nào:
   *
   *   onTarget     đủ điểm, không kỹ năng nào dưới kỳ vọng — kết luận CHẮC CHẮN
   *   sos1/2/3     đủ điểm, 1 / 2 / từ 3 kỹ năng dưới kỳ vọng — kết luận CHẮC CHẮN
   *   provisional  CHƯA đủ điểm nhưng phần đã chấm đã đủ để kết luận (có kỹ năng trượt,
   *                hoặc Fast Track đã kết luận trên phần đang có) — mức còn có thể tăng
   *   pending      CHƯA đủ điểm và phần đã chấm chưa kết luận được gì
   *
   * Một lượt chưa đủ điểm chỉ nằm ở ĐÚNG MỘT trong hai cột cuối — không đếm hai lần.
   * Và không lượt nào chưa đủ điểm bị ghi thành "Đạt".
   */
  attempts: number;
  onTarget: number;
  sos1: number;
  sos2: number;
  sos3: number;
  provisional: number;
  pending: number;

  /**
   * ĐẾM CASE, KHÔNG PHẢI "LƯỢT CÓ CASE" (mục 2.2).
   *
   * Trước vòng này cột tên "Case" thực ra đếm số LƯỢT MT có ít nhất một case: một lượt sinh
   * ba case vẫn chỉ ra số 1. Nay đếm đúng từng case.
   *
   * Một case thuộc về tuần của lượt sinh ra nó, nên nó chỉ xuất hiện ở MỘT tuần — cộng các
   * tuần lại vẫn là số case duy nhất, không phải cộng trùng.
   */
  cases: number;
  /** Số HỌC VIÊN có case trong tuần đó — đơn vị khác cột trên, và cố ý khác. */
  caseStudents: number;
  withSupport: number;   // case đã có ít nhất một việc hỗ trợ thực sự diễn ra
  untouched: number;     // case chưa ai ghi sẽ làm gì
  /** Phương án giáo viên đề xuất, đang chờ Quản lý trả lời — TRẠNG THÁI HIỆN TẠI. */
  pendingApproval: number;
};

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

export function weeklyRollup(
  p: Principal,
  f: { branchId?: number | null; weeks?: number; track?: 'normal' | 'ft' | null } = {},
): { rows: WeeklyRow[]; scopeEmpty: boolean; today: string; track: 'normal' | 'ft' | null } {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { anyScope: true }, 'Bạn không có quyền xem tổng hợp tuần.');
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const track = f.track ?? null;
  if (scope.none) return { rows: [], scopeEmpty: true, today: demoToday(), track };

  const conn = db();
  const today = demoToday();
  // Cửa sổ mặc định: 12 tuần gần nhất tính tới tuần hiện tại. Đủ để thấy xu hướng một quý.
  const weeks = Math.min(Math.max(f.weeks ?? 12, 1), 52);
  const from = addDays(mondayOf(today), -7 * (weeks - 1));

  const cs = classScopeSql(scope);
  const where: string[] = [cs.sql, 'rp.week_start >= ?', 'rp.week_start <= ?'];
  const params: unknown[] = [...cs.params, from, mondayOf(today)];
  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }
  /*
   * NORMAL VÀ FT ĐẾM HAI THỨ KHÁC NHAU (mục 4.2).
   *
   * Lớp Normal làm BÀI KIỂM TRA giữa khoá / cuối khoá; lớp Fast Track làm MOCK TEST. Trộn
   * chung một cột "Lượt" thì con số không trả lời được câu hỏi nào: "tuần này 30 lượt" là
   * 30 bài kiểm tra hay 30 MT? Nên lọc ngay từ đây, và nhãn cột đổi theo.
   */
  if (track === 'ft') where.push("a.kind = 'mock'");
  if (track === 'normal') where.push("a.kind IN ('progress','final')");

  const attempts = conn
    .prepare(
      `SELECT a.id, a.status, a.kind, a.attempt_no, a.class_id, a.planned_period_id, a.target_at_attempt,
              c.programme_code,
              rp.id AS period_id, rp.code, rp.week_start, rp.week_end
         FROM assessment_attempts a
         JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN classes c ON c.id = a.class_id
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
  const resultOfAttempt = (a: any): { sosLevel: number | null; complete: boolean } => {
    const scores = bundle.scores.get(a.id) ?? [];
    const prog = a.programme_code ? programmes.get(a.programme_code) : null;
    if (prog?.scoringMode === 'ratio') {
      const r = evaluateRegular(prog.skills, scores);
      return { sosLevel: r.sosLevel, complete: r.complete };
    }
    const r = resultOf(a, scores, bundle.skips.get(a.id) ?? []);
    return { sosLevel: r.sosLevel, complete: r.complete };
  };

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
  const rowOf = (a: any): WeeklyRow => {
    let row = byPeriod.get(a.period_id);
    if (!row) {
      const info = weekInfo(a.week_start);
      row = {
        periodId: a.period_id, code: a.code,
        month: MONTHS[info.month - 1] ?? '',
        weekLabel: `Tuần ${info.weekNo}`,
        range: info.range, weekStart: a.week_start, weekEnd: a.week_end,
        isCurrent: a.week_start <= today && a.week_end >= today,
        attempts: 0, onTarget: 0, sos1: 0, sos2: 0, sos3: 0, provisional: 0, pending: 0,
        cases: 0, caseStudents: 0, withSupport: 0, untouched: 0, pendingApproval: 0,
      };
      byPeriod.set(a.period_id, row);
    }
    return row;
  };

  for (const a of attempts) {
    const row = rowOf(a);
    if (!scored.has(a.id)) continue;          // chưa chấm gì thì chưa phải một lượt có kết quả
    row.attempts += 1;

    /*
     * SÁU CỘT LOẠI TRỪ NHAU. Thứ tự xét quan trọng: kiểm tra ĐỦ ĐIỂM TRƯỚC, vì một lượt
     * chưa đủ điểm mà đã kết luận được thì là kết luận TẠM THỜI — không được rơi vào cột
     * "Đạt" hay cột SOS chắc chắn, và cũng không được đếm thêm lần nữa ở cột "chưa đủ điểm".
     */
    const { sosLevel, complete } = resultOfAttempt(a);
    if (!complete) {
      if (sosLevel === null) row.pending += 1;
      else row.provisional += 1;
    } else if (sosLevel === null) row.pending += 1;
    else if (sosLevel === 0) row.onTarget += 1;
    else if (sosLevel === 1) row.sos1 += 1;
    else if (sosLevel === 2) row.sos2 += 1;
    else row.sos3 += 1;
  }

  /*
   * CASE — ĐẾM TỪNG CASE, và học viên đếm riêng (mục 2.2).
   *
   * Một câu truy vấn riêng thay vì nối vào câu lớn ở trên: nối vào sẽ nhân số dòng lượt lên
   * theo số case, và mọi cột kết luận ở trên đếm sai theo.
   *
   * Một case thuộc tuần của LƯỢT sinh ra nó, nên nó chỉ nằm ở một tuần duy nhất — hàng tổng
   * cộng các tuần lại vẫn là số case duy nhất.
   */
  if (byPeriod.size) {
    const pids = [...byPeriod.keys()];
    for (const r of conn
      .prepare(
        `SELECT a.planned_period_id AS pid, sc.id AS case_id, sc.student_id, sc.status,
                (SELECT MAX(COALESCE(i.completed_date, i.started_date))
                   FROM case_interventions i
                  WHERE i.case_id = sc.id AND i.status != 'cancelled') AS support_done,
                (SELECT COUNT(*) FROM case_interventions i2
                  WHERE i2.case_id = sc.id AND i2.status != 'cancelled') AS iv_count
           FROM sos_cases sc
           JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE a.planned_period_id IN (${pids.map(() => '?').join(',')})
            AND COALESCE(sc.sos_level, 1) > 0`,
      )
      .all(...pids) as any[]) {
      const row = byPeriod.get(r.pid);
      if (!row) continue;                     // lượt bị bộ lọc Normal/FT loại ra
      row.cases += 1;
      if (r.support_done && r.support_done <= today) row.withSupport += 1;
      else if (r.iv_count === 0 && r.status !== 'done') row.untouched += 1;
    }
    /* Số HỌC VIÊN có case — đếm riêng, vì một em ba case vẫn là một em. */
    for (const r of conn
      .prepare(
        `SELECT a.planned_period_id AS pid, COUNT(DISTINCT sc.student_id) AS n
           FROM sos_cases sc
           JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE a.planned_period_id IN (${pids.map(() => '?').join(',')})
            AND COALESCE(sc.sos_level, 1) > 0
          GROUP BY a.planned_period_id`,
      )
      .all(...pids) as any[]) {
      const row = byPeriod.get(r.pid);
      if (row) row.caseStudents = r.n;
    }

    /*
     * ĐỀ XUẤT CHỜ DUYỆT là TRẠNG THÁI HIỆN TẠI, không phải chuyện đã xảy ra trong tuần đó —
     * nhãn cột phải nói rõ vậy. Quy về tuần của lượt sinh ra case, cùng quy ước với các cột
     * khác, và LỌC ĐÚNG PHẠM VI đang xem (mục 4.4) thay vì lấy cả hệ thống như trước.
     */
    for (const r of conn
      .prepare(
        `SELECT a.planned_period_id AS pid, COUNT(*) AS n
           FROM case_interventions iv
           JOIN sos_cases sc ON sc.id = iv.case_id
           JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE iv.approval_state = 'pending'
            AND a.planned_period_id IN (${pids.map(() => '?').join(',')})
          GROUP BY a.planned_period_id`,
      )
      .all(...pids) as any[]) {
      const row = byPeriod.get(r.pid);
      if (row) row.pendingApproval = r.n;
    }
  }

  /*
   * CHỈ HIỆN TUẦN CÓ DỮ LIỆU.
   *
   * Một tuần có lượt đã XẾP LỊCH nhưng chưa ai chấm không phải là một tuần có dữ liệu — hàng
   * của nó toàn số 0, và một bảng đầy dòng 0 chính là thứ file Excel cũ làm mà không ai đọc.
   * Lượt chưa chấm đã có chỗ riêng ở danh sách việc cần làm.
   */
  const rows = [...byPeriod.values()]
    .filter((r) => r.attempts > 0 || r.cases > 0)
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
  return { rows, scopeEmpty: false, today, track };
}
