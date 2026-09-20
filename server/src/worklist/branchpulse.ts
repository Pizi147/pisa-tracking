import { db } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { listCases } from '../cases/cases.ts';
import { listAttempts } from '../fasttrack/attempts.ts';
import { addDays } from '../util.ts';

/**
 * "VIỆC CẦN LƯU Ý" — bảng trả lời câu hỏi AI PHẢI LÀM GÌ (mục 9.2).
 *
 * Khác hẳn bảng ở tab Thực trạng, vốn trả lời HỌC VIÊN ĐANG YẾU Ở ĐÂU. Owner giữ cả hai và
 * phân vai rõ (Q10), nên hai bảng cố tình không dùng chung bộ cột.
 *
 * Hai góc nhìn, đổi theo chỗ đứng của người xem:
 *
 *   CHƯA CHỌN CHI NHÁNH  → mỗi hàng một CHI NHÁNH, và một hàng tổng ở cuối.
 *   ĐÃ CHỌN CHI NHÁNH    → hàng đầu là tổng cả chi nhánh, dưới là hai nhóm Normal và FT
 *                          (mặc định thu gọn), mở ra mới thấy từng lớp.
 *
 * Bảng theo người CỐ TÌNH không có màu tốt/xấu và không xếp hạng. Một bảng "giáo viên nào
 * chậm nhất" là thứ ai cũng hiểu ngay và không ai muốn bị đưa vào; nó biến một công cụ điều
 * phối thành một công cụ đánh giá, và giáo viên sẽ học cách làm đẹp số thay vì làm việc.
 */

/** Sáu con số của một hàng lớp / nhóm / chi nhánh. */
export type PulseMetrics = {
  /** Sĩ số — học viên đang học. */
  size: number;
  /** HỌC VIÊN cần hỗ trợ: một em có ba case vẫn chỉ đếm một lần. */
  needSupport: number;
  /** Tổng số CASE đang mở — đơn vị khác cột trên, và cố ý khác. */
  cases: number;
  /** Case chưa ai ghi sẽ làm gì. */
  noPlan: number;
  /** Đã qua hẹn xem lại mà chưa cập nhật kết quả. */
  overdueUpdate: number;
  /** Phương án giáo viên đề xuất, đang chờ Quản lý trả lời. */
  pendingApproval: number;
};

const zero = (): PulseMetrics =>
  ({ size: 0, needSupport: 0, cases: 0, noPlan: 0, overdueUpdate: 0, pendingApproval: 0 });

const add = (a: PulseMetrics, b: PulseMetrics) => {
  a.size += b.size; a.needSupport += b.needSupport; a.cases += b.cases;
  a.noPlan += b.noPlan; a.overdueUpdate += b.overdueUpdate; a.pendingApproval += b.pendingApproval;
};

export function branchPulse(p: Principal, f: { branchId?: number | null } = {}) {
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) return null;
  const today = demoToday();

  const cases = listCases(p, { branchId: f.branchId ?? undefined }).rows.filter((c) => c.state !== 'done');
  const attempts = listAttempts(p, { branchId: f.branchId ?? undefined }).rows
    .filter((a: any) => a.status !== 'cancelled');

  /*
   * LỚP TRONG PHẠM VI NGƯỜI ĐANG XEM — không phải mọi lớp của trung tâm.
   *
   * Trước vòng này câu lệnh lấy hết lớp đang hoạt động, nên Quản lý một chi nhánh mở bảng ra
   * thấy hàng của chi nhánh mình ghi 11 học viên mà hàng "Tất cả chi nhánh" ngay dưới ghi 40.
   * Hai con số ấy nói với người đọc rằng bảng này đếm sai — và họ đúng.
   */
  const scopeArgs: unknown[] = [];
  let scopeSql = '';
  if (!scope.all && scope.branchIds?.length) {
    scopeSql = ` AND c.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`;
    scopeArgs.push(...scope.branchIds);
  }
  const classRows = conn
    .prepare(
      `SELECT c.id, c.code, c.branch_id, c.is_fast_track, b.name AS branch_name,
              (SELECT COUNT(*) FROM enrollments e JOIN students s ON s.id = e.student_id
                WHERE e.class_id = c.id AND e.status = 'active' AND s.archived_at IS NULL) AS size
         FROM classes c JOIN branches b ON b.id = c.branch_id
        WHERE c.status = 'active'${scopeSql} ORDER BY b.id, c.code`,
    )
    .all(...scopeArgs) as any[];

  const perClass = new Map<number, PulseMetrics>();
  const supportStudents = new Map<number, Set<number>>();
  const info = new Map<number, { id: number; code: string; branchId: number; branchName: string; isFt: boolean }>();
  for (const c of classRows) {
    perClass.set(c.id, { ...zero(), size: c.size });
    supportStudents.set(c.id, new Set());
    info.set(c.id, {
      id: c.id, code: c.code, branchId: c.branch_id, branchName: c.branch_name, isFt: !!c.is_fast_track,
    });
  }

  for (const c of cases) {
    if (!c.classId || !perClass.has(c.classId)) continue;
    const m = perClass.get(c.classId)!;
    m.cases += 1;
    if (c.studentId) supportStudents.get(c.classId)!.add(c.studentId);
    if (c.state === 'no_plan') m.noPlan += 1;
    if (c.dueOverdue) m.overdueUpdate += 1;
  }
  for (const r of conn
    .prepare(
      `SELECT sc.id AS case_id, COUNT(*) n FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE iv.approval_state = 'pending' GROUP BY sc.id`,
    )
    .all() as any[]) {
    const c = cases.find((x) => x.id === r.case_id);
    if (c?.classId && perClass.has(c.classId)) perClass.get(c.classId)!.pendingApproval += r.n;
  }
  for (const [id, set] of supportStudents) perClass.get(id)!.needSupport = set.size;

  /*
   * CHỈ GIỮ LỚP CÓ VIỆC. Bảng này tên là "Việc cần lưu ý" — một lớp đang chạy êm mà vẫn có
   * mặt ở đây thì mỗi sáng người đọc phải quét qua nó để kết luận "không có gì", đúng thứ
   * bảng này sinh ra để khỏi phải làm.
   */
  const busy = (m: PulseMetrics) => m.needSupport + m.cases + m.noPlan + m.overdueUpdate + m.pendingApproval > 0;

  /* ---------------------------------------------------------------- hai góc nhìn */
  const total = zero();
  let mode: 'branches' | 'groups';
  let rows: any[];

  if (!f.branchId) {
    /* Chưa chọn chi nhánh: gộp thẳng lên mức chi nhánh, KHÔNG liệt kê từng lớp (mục 9.2). */
    mode = 'branches';
    const byBranch = new Map<number, { id: number; label: string; metrics: PulseMetrics }>();
    for (const [id, m] of perClass) {
      const i = info.get(id)!;
      if (!byBranch.has(i.branchId)) {
        byBranch.set(i.branchId, { id: i.branchId, label: i.branchName, metrics: zero() });
      }
      add(byBranch.get(i.branchId)!.metrics, m);
      add(total, m);
    }
    rows = [...byBranch.values()].filter((r) => busy(r.metrics));
  } else {
    /*
     * Đã chọn chi nhánh: hai NHÓM LOẠI LỚP, mặc định thu gọn, mở ra mới thấy từng lớp.
     * Normal và FT vận hành khác nhau tới mức trộn chung một danh sách là bắt người đọc
     * tự phân loại lại bằng mắt ở mỗi dòng.
     */
    mode = 'groups';
    const groups: Record<'normal' | 'ft', { key: string; label: string; metrics: PulseMetrics; classes: any[] }> = {
      normal: { key: 'normal', label: 'Normal', metrics: zero(), classes: [] },
      ft: { key: 'ft', label: 'Fast Track', metrics: zero(), classes: [] },
    };
    for (const [id, m] of perClass) {
      const i = info.get(id)!;
      if (i.branchId !== f.branchId) continue;
      add(total, m);
      const g = groups[i.isFt ? 'ft' : 'normal'];
      add(g.metrics, m);
      if (busy(m)) g.classes.push({ id, label: i.code, metrics: m });
    }
    rows = [groups.normal, groups.ft].filter((g) => g.classes.length > 0);
  }

  return {
    mode,
    rows,
    total,
    people: peopleOf(p, conn, cases, attempts, today, f.branchId ?? null),
    /** Người xem có quyền trả lời đề xuất hay không — quyết định cột "Đề xuất chờ duyệt". */
    canApprove: can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true }),
  };
}

/** Bảng theo giáo viên — cột riêng, và chỉ tính dữ liệu trong chi nhánh đang xem (mục 9.2). */
function peopleOf(
  p: Principal, conn: any, cases: any[], attempts: any[], today: string, branchId: number | null,
) {
  const people = new Map<number, {
    id: number; name: string; classCount: number;
    mtPending: number; mtOverdue: number;
    cases: number; noPlan: number; overdueUpdate: number; pendingApproval: number;
  }>();
  const person = (id: number, name: string) => {
    if (!people.has(id)) {
      people.set(id, {
        id, name, classCount: 0, mtPending: 0, mtOverdue: 0,
        cases: 0, noPlan: 0, overdueUpdate: 0, pendingApproval: 0,
      });
    }
    return people.get(id)!;
  };
  const branchIds = [...new Set(cases.map((c) => c.branchId).filter(Boolean))] as number[];
  const scopeSql = branchId ? 'AND cl.branch_id = ?' : (branchIds.length
    ? `AND cl.branch_id IN (${branchIds.map(() => '?').join(',')})` : 'AND 1=0');
  const scopeArgs = branchId ? [branchId] : branchIds;

  /* Lớp của từng người TRONG chi nhánh đang xem — cùng một người ở chi nhánh khác không tính. */
  const classesOf = new Map<number, Set<number>>();
  for (const r of conn
    .prepare(
      `SELECT u.id, u.full_name, ta.class_id
         FROM teacher_assignments ta
         JOIN users u ON u.id = ta.user_id
         JOIN classes cl ON cl.id = ta.class_id
        WHERE ta.status = 'active' AND u.status = 'active' ${scopeSql}
        ORDER BY u.full_name`,
    )
    .all(...scopeArgs) as any[]) {
    person(r.id, r.full_name);
    if (!classesOf.has(r.id)) classesOf.set(r.id, new Set());
    classesOf.get(r.id)!.add(r.class_id);
  }
  for (const [id, set] of classesOf) people.get(id)!.classCount = set.size;

  /*
   * MT CHƯA NHẬP và MT QUÁ HẠN NHẬP là HAI CỘT, không phải một.
   *
   * Gộp lại thì một giáo viên vừa được giao điểm hôm qua nhìn giống hệt một người nợ điểm
   * từ ba tuần trước. Cột đầu là khối lượng, cột sau là nợ — chỉ cột sau mới đáng đi nhắc.
   */
  for (const r of conn
    .prepare(
      /*
       * Một ô "còn nợ điểm" = một kỹ năng người này được phân công, ở một lượt MT mà TUẦN
       * đã bắt đầu, mà chưa có band. Đếm theo phân công chứ không theo dòng điểm có sẵn:
       * chưa ai gõ gì thì chưa có dòng nào, và đó chính là trường hợp phải đếm.
       */
      `SELECT ta.user_id, a.deadline_override, rp.week_end
         FROM assessment_attempts a
         JOIN classes cl ON cl.id = a.class_id
         JOIN teacher_assignments ta ON ta.class_id = a.class_id AND ta.status = 'active'
         JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN assessment_scores s ON s.attempt_id = a.id AND s.skill = ta.skill
        WHERE a.status != 'cancelled' AND ta.skill IS NOT NULL
          AND rp.week_start <= ? AND s.band IS NULL
          /* Ô đã báo "-" (PR-G) không còn nợ điểm. Ước lượng thô: không xét W1/W2 ghép đôi như bảng chấm. */
          AND s.no_show_period_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM attempt_skill_skips k
                           WHERE k.attempt_id = a.id AND k.skill = ta.skill) ${scopeSql}`,
    )
    .all(today, ...scopeArgs) as any[]) {
    const row = people.get(r.user_id);
    if (!row) continue;
    row.mtPending += 1;
    // Hạn mặc định là hết thứ Tư tuần kế tiếp = Chủ nhật của tuần MT + 3 ngày.
    const due = r.deadline_override ?? (r.week_end ? addDays(r.week_end, 3) : null);
    if (due && due < today) row.mtOverdue += 1;
  }

  /*
   * CASE "ĐANG PHỤ TRÁCH" = case CÓ TÊN NGƯỜI NÀY LÀ NGƯỜI PHỤ TRÁCH (mục 2.3 · 3.4).
   *
   * Trước vòng này, một case được cộng cho MỌI giáo viên dạy lớp đó — một lớp bốn giáo viên
   * thì một case hoá thành bốn, và không ai trong bốn người thật sự chịu trách nhiệm. Từ khi
   * mỗi case có một người phụ trách, con số phải đi theo đúng người ấy.
   *
   * Case chưa có ai nhận thì KHÔNG cộng vào đầu ai cả — nó đã là một dòng việc riêng ở
   * Toàn cảnh ("Chưa có người phụ trách"), và gán bừa cho giáo viên dạy lớp là ghi sai
   * trách nhiệm cho cả trăm bản ghi.
   */
  for (const c of cases) {
    const uid = (c as any).ownerUserId ?? null;
    if (!uid) continue;
    const row = people.get(uid);
    if (!row) continue;
    row.cases += 1;
    if (c.state === 'no_plan') row.noPlan += 1;
    if (c.dueOverdue) row.overdueUpdate += 1;
  }

  /*
   * ĐỀ XUẤT CHỜ DUYỆT tính cho NGƯỜI ĐỀ XUẤT, không cho người nhập hộ (mục 3.4) — và chỉ
   * trong phạm vi chi nhánh đang xem (mục 4.4), không lấy cả hệ thống như trước.
   */
  for (const r of conn
    .prepare(
      `SELECT COALESCE(iv.performer_user_id, iv.recorded_by) AS uid, COUNT(*) n
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN enrollments cur ON cur.student_id = sc.student_id AND cur.status = 'active'
         JOIN classes cl ON cl.id = COALESCE(a.class_id, cur.class_id)
        WHERE iv.approval_state = 'pending' ${scopeSql}
        GROUP BY uid`,
    )
    .all(...scopeArgs) as any[]) {
    if (r.uid && people.has(r.uid)) people.get(r.uid)!.pendingApproval = r.n;
  }

  return [...people.values()]
    .filter((x) => x.mtPending + x.mtOverdue + x.cases + x.pendingApproval > 0)
    .sort((a, b) => (b.mtOverdue + b.overdueUpdate) - (a.mtOverdue + a.overdueUpdate)
      || a.name.localeCompare(b.name, 'vi'));
}
