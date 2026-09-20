import { db } from '../db.ts';
import { PERMISSIONS, metricById, type ChiSo } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { forbidden, HttpError, notFound } from '../util.ts';
import { listCases } from '../cases/cases.ts';
import { listSignals } from '../cases/signals.ts';
import { improvementRate, planOutcomes } from '../cases/effectiveness.ts';

/**
 * TẬP ID CỦA TỪNG CHỈ SỐ — nơi duy nhất sinh ra cả CON SỐ lẫn DANH SÁCH KHI BẤM VÀO (hợp đồng số liệu).
 *
 * Mỗi hàm trả về một TẬP ID (`ids`); số là `ids.length`. Không có đường nào đếm riêng — nên không có
 * chuyện ô ghi 7 mà bấm vào ra 5 dòng, và cũng không có chuyện hai màn cùng tên số mà khác tập (F10).
 *
 * MỖI HÀM DỰA VÀO MỘT HÀM ĐÃ CÓ VÀ ĐÃ LỌC QUYỀN (`listCases`, `listSignals`, `planOutcomes`) chứ không
 * tự viết lại bộ lọc phạm vi. Bộ lọc quyền chỉ có một nơi, nên drill-down không thể xem được nhiều
 * hơn ô số tổng — đúng luật 6 của hợp đồng.
 *
 * CHỈ SỐ NÀO CHƯA CÓ HÀM Ở ĐÂY thì đã khai báo trong sổ (`shared/domain/metrics.ts`) nhưng chưa dùng
 * được: `metricSet` nói thẳng "chưa có danh sách" thay vì trả một con số không kiểm chứng được.
 */

export type MetricResult = {
  id: string;
  metric: ChiSo;
  /** Đơn vị của các phần tử trong `ids`. */
  unit: ChiSo['donVi'];
  /** TẬP ID sinh ra con số. Số = `ids.length` = `n`. */
  ids: number[];
  n: number;
  /** Chỉ số dạng tỷ lệ: tử số là tập con của `ids` (mẫu số). */
  numeratorIds?: number[];
  /** Phạm vi rỗng — không có gì để đếm. KHÔNG được hiểu thành toàn hệ thống. */
  empty: boolean;
  note: string | null;
  today: string;
};

const EMPTY_NOTE = 'Không có dữ liệu trong phạm vi';

/** Một dòng của panel danh sách: đủ để người đọc nhận ra bản ghi và bấm sang đúng chỗ. */
export type MetricRow = { id: number; title: string; sub: string; href: string };

/**
 * DỰNG DÒNG CHO MỘT TẬP ID — chỉ "tô màu" tập đã có (tên, lớp, đường dẫn), KHÔNG lọc thêm gì.
 * Tập ID đã qua quyền ở `metricSet`; hàm này không nhận phạm vi nên không thể mở rộng hay thu hẹp nó.
 */
export function rowsFor(unit: ChiSo['donVi'], ids: number[]): MetricRow[] {
  const conn = db();
  const byId = new Map<number, MetricRow>();
  const chunks = <T>(list: T[]) => Array.from({ length: Math.ceil(list.length / 400) }, (_, i) => list.slice(i * 400, i * 400 + 400));
  for (const chunk of chunks(ids)) {
    const ph = chunk.map(() => '?').join(',');
    if (unit === 'hoc-vien') {
      for (const r of conn.prepare(
        `SELECT s.id, s.full_name, s.student_code,
                (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
                  WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS class_code
           FROM students s WHERE s.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: r.full_name, sub: [r.student_code, r.class_code].filter(Boolean).join(' · '), href: `/hoc-vien/${r.id}` });
      }
    } else if (unit === 'case') {
      for (const r of conn.prepare(
        `SELECT sc.id, COALESCE(sc.title, sc.category, sc.topic) AS title, s.full_name, s.student_code, sc.status
           FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
           LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
          WHERE sc.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: r.title ?? `Case ${r.id}`, sub: [r.full_name, r.student_code].filter(Boolean).join(' · '), href: `/hoc-thuat/case/${r.id}` });
      }
    } else if (unit === 'phuong-an') {
      for (const r of conn.prepare(
        `SELECT iv.id, iv.case_id, COALESCE(NULLIF(iv.description, ''), iv.kind) AS title, s.full_name, s.student_code
           FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
           LEFT JOIN students s ON s.id = sc.student_id
          WHERE iv.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: r.title, sub: [r.full_name, r.student_code].filter(Boolean).join(' · '), href: `/hoc-thuat/case/${r.case_id}` });
      }
    } else if (unit === 'tin-hieu') {
      for (const r of conn.prepare(
        `SELECT sg.id, sg.student_id, sg.skill, sg.track, sg.verify_due, s.full_name, s.student_code
           FROM case_signals sg JOIN students s ON s.id = sg.student_id WHERE sg.id IN (${ph})`,
      ).all(...chunk) as any[]) {
        byId.set(r.id, { id: r.id, title: `Tín hiệu cần xác minh · ${r.skill ?? r.track}`, sub: [r.full_name, r.student_code, `hạn ${String(r.verify_due).slice(8, 10)}/${String(r.verify_due).slice(5, 7)}`].filter(Boolean).join(' · '), href: `/hoc-vien/${r.student_id}` });
      }
    }
  }
  /* Giữ đúng thứ tự của tập ID; ID không tra được vẫn hiện — không im lặng làm rơi bản ghi khỏi danh sách. */
  return ids.map((id) => byId.get(id) ?? { id, title: `#${id}`, sub: '', href: '#' });
}

/** Các chỉ số ĐÃ CÓ hàm tập ID. Chỉ số khác trong sổ chưa dùng được. */
export const LISTED_METRICS: readonly string[] = [
  'hv-co-case-mo', 'case-mo', 'case-thieu-pa', 'tin-hieu-cho-xac-minh',
  'pa-can-cap-nhat', 'pa-co-ket-qua', 'ty-le-co-cai-thien',
];

/**
 * Phạm vi của người gọi ∩ chi nhánh được hỏi. Hỏi chi nhánh NGOÀI phạm vi thì TỪ CHỐI — không được
 * âm thầm trả một tập rút gọn (rỗng) như thể người đó có quyền mà không có dữ liệu.
 */
function resolveScope(p: Principal, branchId: number | null | undefined): { empty: boolean; branchId: number | null } {
  const sc = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (sc.none) return { empty: true, branchId: null };
  if (branchId && !sc.all) {
    const allowed = new Set<number>(sc.branchIds);
    /* Giáo viên có phạm vi theo LỚP: chi nhánh của các lớp mình phụ trách cũng là phạm vi của họ. */
    if (sc.classIds.length) {
      for (const r of db()
        .prepare(`SELECT DISTINCT branch_id FROM classes WHERE id IN (${sc.classIds.map(() => '?').join(',')})`)
        .all(...sc.classIds) as any[]) allowed.add(r.branch_id);
    }
    if (!allowed.has(branchId)) {
      throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
    }
  }
  return { empty: false, branchId: branchId ?? null };
}

const RUNNING = `('planned','started')`;

/**
 * PHƯƠNG ÁN CẦN CẬP NHẬT: đang theo dõi, KHÔNG chờ duyệt, và quá hạn cập nhật tuần. Khác "quá hạn
 * làm" (F11) — đây là hạn cập nhật KẾT QUẢ, không phải hạn thực hiện.
 */
function overdueUpdatePlans(caseIds: number[], today: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    out.push(...(db()
      .prepare(
        `SELECT iv.id FROM case_interventions iv
          WHERE iv.case_id IN (${chunk.map(() => '?').join(',')})
            AND iv.status IN ${RUNNING}
            AND COALESCE(iv.approval_state, '') != 'pending'
            AND iv.action_due IS NOT NULL AND iv.action_due < ?
          ORDER BY iv.id`,
      )
      .all(...chunk, today) as any[]).map((r) => r.id as number));
  }
  return out;
}

/** Phạm vi cho hàm hiệu quả: chi nhánh được hỏi, hoặc giao của quyền; rỗng nghĩa là KHÔNG có gì. */
function effectivenessScope(p: Principal, branchId: number | null) {
  const sc = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const allowed = sc.all ? null : [...new Set([
    ...sc.branchIds,
    ...(sc.classIds.length
      ? (db().prepare(`SELECT DISTINCT branch_id FROM classes WHERE id IN (${sc.classIds.map(() => '?').join(',')})`)
        .all(...sc.classIds) as any[]).map((r) => r.branch_id as number)
      : []),
  ])];
  return { branchIds: branchId ? [branchId] : allowed, ratio: null as boolean | null };
}

/**
 * MỘT CHỈ SỐ → MỘT TẬP ID, đã áp quyền của người gọi. Đây là hàm DUY NHẤT mà cả ô số lẫn panel danh sách gọi.
 */
export function metricSet(p: Principal, id: string, f: { branchId?: number | null } = {}): MetricResult {
  const metric = metricById(id);
  if (!metric) throw notFound(`Không tìm thấy chỉ số "${id}".`);
  if (!LISTED_METRICS.includes(id)) {
    throw new HttpError(501, `Chỉ số "${metric.ten}" đã được khai báo nhưng chưa có danh sách — chưa dùng được ở màn hình.`);
  }
  const today = demoToday();
  const scope = resolveScope(p, f.branchId);
  const done = (ids: number[], extra: Partial<MetricResult> = {}): MetricResult => ({
    id, metric, unit: metric.donVi, ids, n: ids.length, empty: ids.length === 0 && scope.empty,
    note: scope.empty ? EMPTY_NOTE : null, today, ...extra,
  });
  if (scope.empty) return done([]);

  const branchId = scope.branchId ?? undefined;
  const openCases = () => listCases(p, { branchId }).rows.filter((c: any) => c.state !== 'done');

  switch (id) {
    case 'case-mo':
      return done(openCases().map((c: any) => c.id as number));
    case 'hv-co-case-mo': {
      /* ĐẾM DUY NHẤT học viên, chỉ từ case CHƯA kết luận (F02) — không gộp case đã đóng. */
      const students = new Set<number>();
      for (const c of openCases()) if (c.studentId) students.add(c.studentId as number);
      return done([...students].sort((a, b) => a - b));
    }
    case 'case-thieu-pa':
      /* Case CHỜ DUYỆT có `state` riêng — không quy chậm cho giáo viên (hợp đồng §2). */
      return done(openCases().filter((c: any) => c.state === 'no_plan').map((c: any) => c.id as number));
    case 'tin-hieu-cho-xac-minh':
      return done(listSignals(p, { branchId, status: 'open' }).rows.map((s) => s.id));
    case 'pa-can-cap-nhat':
      return done(overdueUpdatePlans(openCases().map((c: any) => c.id as number), today));
    case 'pa-co-ket-qua': {
      const rows = planOutcomes(effectivenessScope(p, scope.branchId))
        .filter((r) => r.track !== 'behaviour' && r.group !== 'undetermined');
      return done(rows.map((r) => r.id));
    }
    case 'ty-le-co-cai-thien': {
      const r = improvementRate(effectivenessScope(p, scope.branchId));
      return done(r.denominatorIds, { numeratorIds: r.numeratorIds });
    }
    default:
      throw new HttpError(501, `Chỉ số "${metric.ten}" chưa có danh sách.`);
  }
}
