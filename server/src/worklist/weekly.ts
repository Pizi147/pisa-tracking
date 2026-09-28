import { db } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { addDays, badRequest } from '../util.ts';
import { mondayOf, weekInfo } from '../platform/week.ts';
import { loadBundle } from '../fasttrack/attempts.ts';
import { allProgrammes } from '../normal/regular.ts';
import { evaluateAttemptRow } from './danhGia.ts';
import { phanLoaiLuot, trangThaiXuLy, type PhanLoaiLuot } from '../phanTich/tongHop.ts';

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

/**
 * MỖI CỘT LÀ MỘT TẬP ID (hợp đồng số liệu, PR-N N2). Số của ô là `.size` của tập — không có đường đếm riêng — và danh sách
 * khi bấm số (`weeklyDrill`) trả CHÍNH tập đó. Đơn vị từng cột:
 *   lượt (attempt id)  attempts · onTarget · sos1 · sos2 · sos3 · provisional · pending
 *   case (case id)     cases · withSupport · untouched
 *   học viên           caseStudents
 *   phương án          pendingApproval
 */
export const WEEKLY_COLS = [
  'attempts', 'onTarget', 'sos1', 'sos2', 'sos3', 'provisional', 'pending',
  'cases', 'caseStudents', 'withSupport', 'untouched', 'pendingApproval',
] as const;
export type WeeklyCol = (typeof WEEKLY_COLS)[number];
export const WEEKLY_COL_UNIT: Record<WeeklyCol, 'dot-test' | 'case' | 'hoc-vien' | 'phuong-an'> = {
  attempts: 'dot-test', onTarget: 'dot-test', sos1: 'dot-test', sos2: 'dot-test', sos3: 'dot-test',
  provisional: 'dot-test', pending: 'dot-test', cases: 'case', withSupport: 'case', untouched: 'case',
  caseStudents: 'hoc-vien', pendingApproval: 'phuong-an',
};
/** Đúng tên cột của bảng tuần (Q17, PR-Pb) ứng với mỗi kết quả phân loại thuần `phanLoaiLuot`. */
const PHAN_LOAI_TO_WEEKLY_COL: Record<PhanLoaiLuot, WeeklyCol> = {
  dat: 'onTarget', sos1: 'sos1', sos2: 'sos2', sos3: 'sos3', tamThoi: 'provisional', chuaDu: 'pending',
};
type WeeklySets = Record<WeeklyCol, Set<number>>;
const emptySets = (): WeeklySets =>
  Object.fromEntries(WEEKLY_COLS.map((c) => [c, new Set<number>()])) as unknown as WeeklySets;

type WeeklyMeta = Omit<WeeklyRow, WeeklyCol>;

function weeklySets(
  p: Principal,
  f: { branchId?: number | null; weeks?: number; track?: 'normal' | 'ft' | null },
): { periods: (WeeklyMeta & { sets: WeeklySets })[]; scopeEmpty: boolean; today: string; track: 'normal' | 'ft' | null } {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { anyScope: true }, 'Bạn không có quyền xem tổng hợp tuần.');
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const track = f.track ?? null;
  if (scope.none) return { periods: [], scopeEmpty: true, today: demoToday(), track };

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
   * bộ máy chấm mà các màn khác dùng — FT theo band, lớp thường theo tỷ lệ (`evaluateAttemptRow`).
   */
  const bundle = loadBundle(attempts.map((a) => a.id));
  const programmes = allProgrammes();

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

  const byPeriod = new Map<number, WeeklyMeta & { sets: WeeklySets }>();
  const rowOf = (a: any) => {
    let row = byPeriod.get(a.period_id);
    if (!row) {
      const info = weekInfo(a.week_start);
      row = {
        periodId: a.period_id, code: a.code,
        month: MONTHS[info.month - 1] ?? '',
        weekLabel: `Tuần ${info.weekNo}`,
        range: info.range, weekStart: a.week_start, weekEnd: a.week_end,
        isCurrent: a.week_start <= today && a.week_end >= today,
        sets: emptySets(),
      };
      byPeriod.set(a.period_id, row);
    }
    return row;
  };

  for (const a of attempts) {
    const row = rowOf(a);
    if (!scored.has(a.id)) continue;          // chưa chấm gì thì chưa phải một lượt có kết quả
    row.sets.attempts.add(a.id);

    /*
     * SÁU CỘT LOẠI TRỪ NHAU. Thứ tự xét quan trọng: kiểm tra ĐỦ ĐIỂM TRƯỚC, vì một lượt
     * chưa đủ điểm mà đã kết luận được thì là kết luận TẠM THỜI — không được rơi vào cột
     * "Đạt" hay cột SOS chắc chắn, và cũng không được đếm thêm lần nữa ở cột "chưa đủ điểm".
     */
    const ev = evaluateAttemptRow(a, bundle, programmes);
    row.sets[PHAN_LOAI_TO_WEEKLY_COL[phanLoaiLuot(ev)]].add(a.id);
  }

  /*
   * BA TRUY VẤN DƯỚI ĐÂY NHẬN CHÍNH TẬP LƯỢT ĐÃ ĐƯỢC LỌC (F01, P0 — hợp đồng số liệu).
   *
   * Lỗi cũ: `attempts` ở trên đã lọc chi nhánh / chương trình / quyền, nhưng ba truy vấn sau đó
   * chỉ lọc `planned_period_id IN (...)` — tức LẠI LẤY MỌI LƯỢT CỦA TUẦN ĐÓ, bất kể chi nhánh. Hai
   * chi nhánh cùng tuần vì thế cộng lẫn số case, số học viên và đề xuất chờ duyệt của nhau, và
   * người xem một chi nhánh không có cách nào phát hiện: con số cứ lớn hơn thực tế.
   *
   * Nay ba truy vấn lọc theo `a.id IN (các lượt được phép)`. Bộ lọc chi nhánh/track/quyền chỉ có
   * MỘT nơi (câu truy vấn `attempts`), nên không thể có hai bộ lọc lệch nhau.
   */
  if (attempts.length) {
    const ids = attempts.map((a) => a.id);
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      const ph = chunk.map(() => '?').join(',');
      /*
       * CASE — ĐẾM TỪNG CASE, và học viên đếm riêng (mục 2.2). Một case thuộc tuần của LƯỢT sinh
       * ra nó, nên nó chỉ nằm ở một tuần duy nhất — hàng tổng cộng các tuần lại vẫn là số case
       * duy nhất.
       */
      for (const r of conn
        .prepare(
          `SELECT a.planned_period_id AS pid, sc.id AS case_id, sc.student_id, sc.status, sc.disposition,
                  (SELECT MAX(COALESCE(i.completed_date, i.started_date))
                     FROM case_interventions i
                    WHERE i.case_id = sc.id AND i.status != 'cancelled') AS support_done,
                  (SELECT COUNT(*) FROM case_interventions i2 WHERE i2.case_id = sc.id) AS iv_count
             FROM sos_cases sc
             JOIN assessment_attempts a ON a.id = sc.attempt_id
            WHERE a.id IN (${ph})
              AND COALESCE(sc.sos_level, 1) > 0`,
        )
        .all(...chunk) as any[]) {
        const row = byPeriod.get(r.pid);
        if (!row) continue;
        row.sets.cases.add(r.case_id);
        /* Q17 (PR-Pb): `trangThaiXuLy` gói cùng luật "thiếu phương án" của chỉ số `case-thieu-pa`, một nơi cho cả hai bảng. */
        const trang = trangThaiXuLy({ supportDone: r.support_done, status: r.status, disposition: r.disposition, ivCount: r.iv_count }, today);
        if (trang === 'dangXuLy') row.sets.withSupport.add(r.case_id);
        else if (trang === 'thieuPa') row.sets.untouched.add(r.case_id);
        /* Số HỌC VIÊN có case — một em ba case vẫn là một em. */
        if (r.student_id) row.sets.caseStudents.add(r.student_id);
      }

      /*
       * ĐỀ XUẤT CHỜ DUYỆT là TRẠNG THÁI HIỆN TẠI, không phải chuyện đã xảy ra trong tuần đó —
       * nhãn cột phải nói rõ vậy. Quy về tuần của lượt sinh ra case, và LỌC ĐÚNG PHẠM VI đang xem.
       */
      for (const r of conn
        .prepare(
          `SELECT a.planned_period_id AS pid, iv.id AS iv_id
             FROM case_interventions iv
             JOIN sos_cases sc ON sc.id = iv.case_id
             JOIN assessment_attempts a ON a.id = sc.attempt_id
            WHERE iv.approval_state = 'pending' AND iv.status != 'cancelled' AND sc.status != 'done' AND a.id IN (${ph})`,
        )
        .all(...chunk) as any[]) {
        byPeriod.get(r.pid)?.sets.pendingApproval.add(r.iv_id);
      }
    }
  }

  /*
   * CHỈ HIỆN TUẦN CÓ DỮ LIỆU.
   *
   * Một tuần có lượt đã XẾP LỊCH nhưng chưa ai chấm không phải là một tuần có dữ liệu — hàng
   * của nó toàn số 0, và một bảng đầy dòng 0 chính là thứ file Excel cũ làm mà không ai đọc.
   * Lượt chưa chấm đã có chỗ riêng ở danh sách việc cần làm.
   */
  const periods = [...byPeriod.values()]
    .filter((r) => r.sets.attempts.size > 0 || r.sets.cases.size > 0)
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
  return { periods, scopeEmpty: false, today, track };
}

const union = (list: Set<number>[]) => new Set<number>(list.flatMap((x) => [...x]));

export function weeklyRollup(
  p: Principal,
  f: { branchId?: number | null; weeks?: number; track?: 'normal' | 'ft' | null } = {},
): {
  rows: WeeklyRow[]; scopeEmpty: boolean; today: string; track: 'normal' | 'ft' | null;
  /**
   * HỌC VIÊN KHÔNG CỘNG THEO TUẦN (luật 4): một em có case ở hai tuần là MỘT em ở hàng tháng và hàng tổng. `caseStudents`
   * ở đây là số DUY NHẤT của cả bảng và `byMonth` là số duy nhất của từng tháng — giao diện dùng hai số này, không tự cộng.
   */
  totals: { caseStudents: number; byMonth: Record<string, number> };
} {
  const r = weeklySets(p, f);
  const rows = r.periods.map(({ sets, ...meta }) => ({
    ...meta,
    ...(Object.fromEntries(WEEKLY_COLS.map((c) => [c, sets[c].size])) as Record<WeeklyCol, number>),
  })) as WeeklyRow[];
  const months = new Map<string, Set<number>[]>();
  for (const per of r.periods) {
    if (!months.has(per.month)) months.set(per.month, []);
    months.get(per.month)!.push(per.sets.caseStudents);
  }
  return {
    rows, scopeEmpty: r.scopeEmpty, today: r.today, track: r.track,
    totals: {
      caseStudents: union(r.periods.map((x) => x.sets.caseStudents)).size,
      byMonth: Object.fromEntries([...months].map(([m, list]) => [m, union(list).size])),
    },
  };
}

/**
 * DANH SÁCH KHI BẤM MỘT SỐ CỦA BẢNG TUẦN — CHÍNH tập ID đã sinh ra số đó (cùng hàm `weeklySets`, cùng quyền, cùng bộ lọc).
 * `periodId` rỗng nghĩa là cả bảng: hợp của mọi tuần đang hiện, đếm duy nhất.
 */
export function weeklyDrill(
  p: Principal,
  f: { branchId?: number | null; weeks?: number; track?: 'normal' | 'ft' | null },
  periodId: number | null,
  col: string,
): { ids: number[]; unit: (typeof WEEKLY_COL_UNIT)[WeeklyCol]; empty: boolean } {
  if (!(WEEKLY_COLS as readonly string[]).includes(col)) throw badRequest(`Cột "${col}" không có trong bảng tuần.`);
  const c = col as WeeklyCol;
  const r = weeklySets(p, f);
  const picked = periodId === null ? r.periods : r.periods.filter((x) => x.periodId === periodId);
  return { ids: [...union(picked.map((x) => x.sets[c]))].sort((x, y) => x - y), unit: WEEKLY_COL_UNIT[c], empty: r.scopeEmpty };
}
