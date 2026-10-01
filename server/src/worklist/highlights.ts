import { db } from '../db.ts';
import { PERMISSIONS, type ChuongTrinh } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';
import { classScopeSql, scopeFor, type Principal } from '../permissions.ts';
import { mondayOf, weekInfo } from '../platform/week.ts';
import { classProgressMany } from '../classes/schedule.ts';

/**
 * SỰ KIỆN NỔI BẬT — thay cho khối "Mốc của lớp" cũ (mục 3.5).
 *
 * Khối cũ nằm trong danh sách VIỆC CẦN LÀM, và đó là chỗ sai: "lớp sắp tới tuần Progress
 * Test" không phải một việc ai đó đang nợ, nó là một chuyện SẮP XẢY RA. Trộn hai thứ vào
 * nhau thì danh sách việc lúc nào cũng dài, và người mở lên học cách bỏ qua cả danh sách.
 *
 * Nay tách hẳn ra một khối nhỏ, thu gọn được, trả lời đúng một câu hỏi: **tuần này (hoặc
 * tuần tới, tuần nữa) có gì đáng để ý?**
 *
 * BỐN NGUYÊN TẮC, viết thẳng vào code vì chúng là chỗ dễ làm sai nhất:
 *
 *   1. Normal và FT TÁCH RIÊNG. Hai loại lớp có hai loại sự kiện, gộp lại thì con số không
 *      trả lời được câu hỏi nào.
 *   2. Sự kiện CHƯA ĐẾN không phải việc quá hạn. Ở đây không có nhãn đỏ nào.
 *   3. CHỈ BIẾT THÁNG THI thì KHÔNG xếp giả vào một tuần. Những em đó đếm riêng, và nói rõ
 *      là chưa xác định tuần.
 *   4. Lớp đã hết chương trình mà chưa xếp lớp tiếp là VIỆC, không phải sự kiện — nó nằm ở
 *      danh sách việc cần làm, không nằm ở đây.
 */

export type HighlightWeek = {
  /** Thứ Hai của tuần — khoá thật, dùng để mở danh sách. */
  weekStart: string;
  code: string;
  range: string;
  /** 0 = tuần này, 1 = tuần tới, 2 = tuần nữa. */
  offset: number;
  normal: {
    progressClasses: { id: number; code: string; students: number }[];
    finalClasses: { id: number; code: string; students: number }[];
    /** Lớp kết thúc chương trình trong tuần này — để chuẩn bị kế hoạch chuyển tiếp trước. */
    endingClasses: { id: number; code: string; students: number }[];
  };
  ft: {
    /** Học viên có MT rơi vào tuần này, gom theo lớp để mở đúng bảng điểm. */
    mockClasses: { id: number | null; code: string; students: number; attemptNo: number | null }[];
    mockStudents: number;
    /** Học viên có TUẦN dự kiến thi rơi đúng tuần này. */
    examStudents: number;
  };
};

export type Highlights = {
  weeks: HighlightWeek[];
  /**
   * Học viên chỉ mới biết THÁNG thi, chưa chốt tuần — đếm riêng cho cả ba tuần đang xem,
   * kèm danh sách tháng, và KHÔNG được xếp vào tuần nào.
   */
  examMonthOnly: { months: string[]; students: number };
  scopeEmpty: boolean;
};

/** Lớp mà người đang xem được nhìn, đã lọc theo chi nhánh và chương trình đang chọn. */
export function visibleClasses(p: Principal, branchId: number | null, program: ChuongTrinh | null = null) {
  const scope = scopeFor(p, PERMISSIONS.STUDENT_VIEW);
  if (scope.none) return null;
  const conn = db();
  const where: string[] = ["c.status = 'active'"];
  const args: any[] = [];
  if (branchId) { where.push('c.branch_id = ?'); args.push(branchId); }
  if (program) { where.push('c.is_fast_track = ?'); args.push(program === 'ft' ? 1 : 0); }
  /* PR-Dọn (quét #3): đúng phạm vi người xem — GV thuần chỉ lớp mình dạy (trước đây bỏ qua `scope.classIds`: GV thấy mọi lớp). */
  const ps = classScopeSql(scope);
  where.push(ps.sql);
  args.push(...ps.params);
  return conn
    .prepare(`SELECT c.id, c.code, c.is_fast_track, c.branch_id FROM classes c WHERE ${where.join(' AND ')}`)
    .all(...args) as any[];
}

export function highlights(p: Principal, f: { branchId?: number | null; program?: ChuongTrinh | null } = {}): Highlights {
  const conn = db();
  const today = demoToday();
  const classes = visibleClasses(p, f.branchId ?? null, f.program ?? null);
  if (classes === null) return { weeks: [], examMonthOnly: { months: [], students: 0 }, scopeEmpty: true };

  const thisMonday = mondayOf(today);
  const mondays = [0, 1, 2].map((i) => addDays(thisMonday, i * 7));
  const classIds = classes.map((c) => c.id);
  const byId = new Map<number, any>(classes.map((c) => [c.id, c]));

  /*
   * MỐC CỦA LỚP NORMAL. `classProgressMany` đã biết tuần Progress/Final và tuần kết thúc,
   * nên ở đây chỉ việc đối chiếu tuần — không tự tính lại một lần nữa với luật khác.
   */
  const progress = classIds.length ? classProgressMany(classIds) : new Map();

  /* Sĩ số đang học của từng lớp, lấy một lần cho cả ba tuần. */
  const size = new Map<number, number>();
  if (classIds.length) {
    for (const r of conn
      .prepare(
        `SELECT class_id, COUNT(*) n FROM enrollments
          WHERE status = 'active' AND class_id IN (${classIds.map(() => '?').join(',')})
          GROUP BY class_id`,
      )
      .all(...classIds) as any[]) size.set(r.class_id, r.n);
  }

  const weeks: HighlightWeek[] = mondays.map((weekStart, offset) => {
    const info = weekInfo(weekStart);
    const w: HighlightWeek = {
      weekStart, code: info.code, range: info.range, offset,
      normal: { progressClasses: [], finalClasses: [], endingClasses: [] },
      ft: { mockClasses: [], mockStudents: 0, examStudents: 0 },
    };

    for (const c of classes) {
      if (c.is_fast_track) continue;
      const pr = progress.get(c.id);
      if (!pr) continue;
      const row = { id: c.id, code: c.code, students: size.get(c.id) ?? 0 };
      if (pr.progressWeekStart === weekStart) w.normal.progressClasses.push(row);
      if (pr.finalWeekStart === weekStart) w.normal.finalClasses.push(row);
      /*
       * TUẦN KẾT THÚC CHƯƠNG TRÌNH tính từ tuần bắt đầu cộng tổng số tuần. Chỉ tính khi
       * biết CẢ HAI — thiếu một trong hai thì không đoán, vì đoán sai ở đây là cả lớp bị
       * chuẩn bị chuyển tiếp nhầm thời điểm.
       */
      if (pr.startWeekStart && pr.totalWeeks) {
        const endWeek = addDays(pr.startWeekStart, (pr.totalWeeks - 1) * 7);
        if (endWeek === weekStart) w.normal.endingClasses.push(row);
      }
    }
    return w;
  });

  /*
   * MT CỦA LỚP FT, theo TUẦN KẾ HOẠCH. Một lượt MT thuộc đúng một tuần (không có ngày cụ
   * thể), nên chỉ cần so tuần kế hoạch với ba tuần đang xem.
   *
   * Lượt đã huỷ không phải sự kiện. Lượt đã chấm xong vẫn giữ lại — "tuần này lớp nào có
   * MT" là câu hỏi về LỊCH, và lịch không đổi vì điểm đã nhập.
   */
  if (classIds.length) {
    const rows = conn
      .prepare(
        `SELECT a.class_id, a.attempt_no, rp.week_start, COUNT(DISTINCT a.student_id) AS n
           FROM assessment_attempts a
           JOIN report_periods rp ON rp.id = a.planned_period_id
          WHERE a.status != 'cancelled' AND a.kind = 'mock'
            AND rp.week_start IN (${mondays.map(() => '?').join(',')})
            AND a.class_id IN (${classIds.map(() => '?').join(',')})
          GROUP BY a.class_id, a.attempt_no, rp.week_start`,
      )
      .all(...mondays, ...classIds) as any[];
    for (const r of rows) {
      const w = weeks.find((x) => x.weekStart === r.week_start);
      if (!w) continue;
      const cls = byId.get(r.class_id);
      w.ft.mockClasses.push({
        id: r.class_id ?? null, code: cls?.code ?? 'Không rõ lớp',
        students: r.n, attemptNo: r.attempt_no ?? null,
      });
      w.ft.mockStudents += r.n;
    }
  }

  /*
   * DỰ KIẾN THI IELTS.
   *
   * Chỉ những em đã chốt TUẦN thi mới được xếp vào một tuần. Em mới biết tháng thì đếm
   * riêng ở `examMonthOnly` — xếp bừa các em đó vào tuần đầu tháng là bịa ra một lịch mà
   * không ai từng chốt, và người đọc sẽ tin vào nó.
   */
  if (classIds.length) {
    for (const r of conn
      .prepare(
        `SELECT rp.week_start, COUNT(DISTINCT lc.student_id) AS n
           FROM learning_cycles lc
           JOIN report_periods rp ON rp.id = lc.exam_period_id
           JOIN enrollments e ON e.student_id = lc.student_id AND e.status = 'active'
          WHERE lc.status = 'active'
            AND rp.week_start IN (${mondays.map(() => '?').join(',')})
            AND e.class_id IN (${classIds.map(() => '?').join(',')})
          GROUP BY rp.week_start`,
      )
      .all(...mondays, ...classIds) as any[]) {
      const w = weeks.find((x) => x.weekStart === r.week_start);
      if (w) w.ft.examStudents = r.n;
    }
  }

  /* Ba tuần đang xem rơi vào những tháng nào — chỉ hỏi về đúng những tháng đó. */
  const months = [...new Set(mondays.map((m) => {
    const info = weekInfo(m);
    return `${info.year}-${String(info.month).padStart(2, '0')}`;
  }))];
  let monthOnly = 0;
  if (classIds.length) {
    monthOnly = (conn
      .prepare(
        `SELECT COUNT(DISTINCT lc.student_id) AS n
           FROM learning_cycles lc
           JOIN enrollments e ON e.student_id = lc.student_id AND e.status = 'active'
          WHERE lc.status = 'active'
            AND lc.exam_period_id IS NULL
            AND lc.exam_month IN (${months.map(() => '?').join(',')})
            AND e.class_id IN (${classIds.map(() => '?').join(',')})`,
      )
      .get(...months, ...classIds) as any).n ?? 0;
  }

  return {
    weeks,
    examMonthOnly: { months, students: monthOnly },
    scopeEmpty: false,
  };
}
