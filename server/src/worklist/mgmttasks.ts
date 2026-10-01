import { db, tx } from '../db.ts';
import {
  PERMISSIONS, TASK_GROUPS, TASK_PROGRESS, TASK_PROGRESS_CLOSED, TASK_PROGRESS_LABEL,
  TASK_PROGRESS_NEEDS_REASON, facetVanHanh, locVanHanh,
  type DongVanHanh, type HangSo, type TaskGroup, type TaskProgress, type TrangThaiLoc,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, isIsoDate, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { ensurePeriod } from '../platform/week.ts';
import { writeAudit } from '../platform/audit.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';

/**
 * TIẾN ĐỘ CÔNG VIỆC — công việc quản lý vận hành (mục 8).
 *
 * KHÔNG phải case của học viên, và cố ý không có tầng "phương án xử lý": Quản lý tạo việc,
 * giao việc, cập nhật tiến độ. Thêm một quy trình xin duyệt vào đây là biến một cuốn sổ tay
 * thành một thủ tục hành chính.
 *
 * BỐN QUYẾT ĐỊNH VỀ MÔ HÌNH:
 *
 * 1. MỘT CÔNG VIỆC = MỘT ĐỊNH DANH, XUYÊN NHIỀU TUẦN (mục 8.4). Không nhân bản mỗi tuần
 *    một bản sao. Tuần chỉ dùng để LỌC các lần cập nhật — và mỗi lần cập nhật là một dòng
 *    riêng có người, có thời điểm, có ghi chú.
 * 2. CÔNG VIỆC CON CHỈ MỘT TẦNG (mục 8.6). Cây nhiều tầng nghe thì linh hoạt, nhưng đọc
 *    một bảng lồng bốn tầng thì không ai biết việc nào của ai.
 * 3. TẠM NGƯNG KHÁC DỪNG HẲN (mục 8.5). Tạm ngưng là còn sống, tiếp tục được bất kỳ lúc
 *    nào; dừng hẳn là đã quyết định không làm. Cả hai bắt buộc ghi lý do (PR-Ra: Tạm ngưng
 *    còn bắt buộc thêm người cần hỗ trợ + ngày xem lại — Q10).
 * 4. LIÊN KẾT CASE LÀ CĂN CỨ, KHÔNG PHẢI ĐIỀU KHIỂN (mục 8.7). Hoàn thành việc quản lý
 *    KHÔNG đóng case nào, và cũng không tự tạo phương án cho em nào.
 */

export type TaskFilter = {
  branchId?: number | null;
  group?: string | null;
  /**
   * PR-Ra: `undefined` = TẤT CẢ (giữ nghĩa cũ — `listMgmtTasks(p, {})` của các phép kiểm trước
   * PR-Ra không được đổi ý). `'mo'` = chưa khép (mặc định GIAO DIỆN, route tự điền khi thiếu).
   * `'tat-ca'` = tường minh tất cả. Ngoài ra nhận đúng một trong năm trạng thái cụ thể.
   */
  progress?: string | null;
  /** PR-Ra: một trong bốn hàng số (Q8), hoặc `'tat-ca'`. */
  hang?: string | null;
  assigneeUserId?: number | null;
  /** Tuần cập nhật — lọc theo các lần cập nhật, không lọc theo ngày tạo công việc. */
  periodId?: number | null;
};

/**
 * PR-UXF-a Q16 (G-10): hạn gốc + số lần DỜI từ lịch sử `due_date` (sắp theo id tăng). Dòng `old` null = lần ĐẶT hạn đầu — không phải dời.
 * `hanGoc` = hạn đặt đầu tiên (`old` của dòng dời đầu, hoặc `new` của dòng đặt); chỉ có khi đã dời ít nhất một lần.
 */
export function hanGocCua(hist: readonly { old: string | null; new: string | null; reason: string | null }[]):
  { hanGoc: string | null; lyDoDoiHan: string | null; soLanDoiHan: number } {
  const doi = hist.filter((h) => h.old !== null);
  if (!doi.length) return { hanGoc: null, lyDoDoiHan: null, soLanDoiHan: 0 };
  return { hanGoc: hist[0].old ?? hist[0].new, lyDoDoiHan: doi[doi.length - 1].reason, soLanDoiHan: doi.length };
}

/** Toàn bộ tab chỉ dành cho Quản trị hệ thống và Quản lý chi nhánh (mục 8.3). */
export function canSeeBoard(p: Principal): boolean {
  return can(p, PERMISSIONS.MEETING_EDIT, { anyScope: true })
    || can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true });
}

/**
 * `canSeeBoard` chỉ hỏi "có vai trò Quản lý/Quản trị KHÔNG, bất kỳ chi nhánh nào" — đúng cho
 * việc mở TAB (mục 8.3), nhưng dùng làm cửa chặn một VIỆC CỤ THỂ thì rò: Quản lý chi nhánh A
 * qua được cửa này rồi xem/sửa được việc của chi nhánh B (lỗ đã có trên `main`, không phải PR
 * này sinh ra, nhưng PR đang chạm đúng những đường này nên sửa luôn). Ràng đúng theo CHI NHÁNH
 * CỦA VIỆC — như `createMgmtTask`/`editMgmtTask` (PATCH) đã làm: việc "Toàn hệ thống"
 * (`branch_id IS NULL`) thì `anyScope`, việc có chi nhánh thì phải đúng chi nhánh đó.
 */
function coQuyenViec(p: Principal, t: { branch_id: number | null }): boolean {
  const ctx = { branchId: t.branch_id, anyScope: !t.branch_id };
  return can(p, PERMISSIONS.MEETING_EDIT, ctx) || can(p, PERMISSIONS.ADMIN_CONFIG, ctx);
}

const closed = (pr: string) => (TASK_PROGRESS_CLOSED as readonly string[]).includes(pr);

/** Tối đa hai tên, phần còn lại gộp "và n việc khác" (Q11) — dòng phụ ở giao diện không được dài vô hạn. */
function tenViecConMo(titles: string[]): string {
  const shown = titles.slice(0, 2).map((t) => `"${t}"`);
  const rest = titles.length - shown.length;
  return shown.join(', ') + (rest > 0 ? ` và ${rest} việc khác` : '');
}

/**
 * Bảng công việc quản lý (PR-Ra: viết lại theo "tải một lần, lọc bằng JS" — bốn câu SQL cố
 * định thay vì một câu chính + N câu đếm facet riêng từng cột):
 *   (1) dòng gốc trong phạm vi (chi nhánh + người phụ trách), kèm tên người và help_*.
 *   (2) việc con của các dòng đó.
 *   (3) lần cập nhật mới nhất của các dòng đó.
 *   (4) lịch sử dời hạn (`task_history.field = 'due_date'`) của các dòng đó.
 * Lọc nhóm/trạng thái/hàng số và tính facet đều chạy trong JS qua `shared/domain/congViec.ts`,
 * để LUẬT chỉ có một chỗ (dùng lại y hệt Task 2, đã kiểm riêng ở đó).
 */
export function listMgmtTasks(p: Principal, f: TaskFilter = {}) {
  if (!canSeeBoard(p)) return { rows: [], canEdit: false, scopeEmpty: true };
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.MEETING_EDIT);
  const today = demoToday();

  const base: string[] = ['t.parent_task_id IS NULL', "t.kind = 'branch_ops'"];
  const baseParams: unknown[] = [];
  if (f.branchId) { base.push('t.branch_id = ?'); baseParams.push(f.branchId); }
  else if (!scope.all && scope.branchIds?.length) {
    base.push(`(t.branch_id IS NULL OR t.branch_id IN (${scope.branchIds.map(() => '?').join(',')}))`);
    baseParams.push(...scope.branchIds);
  }
  if (f.assigneeUserId) { base.push('t.assignee_user_id = ?'); baseParams.push(f.assigneeUserId); }
  /*
   * LỌC THEO TUẦN CẬP NHẬT: giữ những việc CÓ cập nhật trong tuần đó. Việc chưa xong mà tuần
   * đó không ai động vào thì VẪN HIỆN — đó chính là việc cần hỏi "tuần rồi sao không ai làm".
   */
  if (f.periodId) {
    base.push(`(EXISTS (SELECT 1 FROM task_updates u WHERE u.task_id = t.id AND u.period_id = ?)
                 OR t.progress NOT IN ('done','stopped'))`);
    baseParams.push(f.periodId);
  }

  // (1) dòng gốc
  const rows = conn
    .prepare(
      `SELECT t.*, b.name AS branch_name,
              COALESCE(a.full_name, t.assignee_name) AS assignee_name, t.assignee_name AS ten_ngoai,
              w.full_name AS watcher_name, h.full_name AS help_user_name,
              (SELECT COUNT(*) FROM task_case_links l WHERE l.task_id = t.id) AS case_links
         FROM tasks t
         LEFT JOIN branches b ON b.id = t.branch_id
         LEFT JOIN users a ON a.id = t.assignee_user_id
         LEFT JOIN users w ON w.id = t.watcher_user_id
         LEFT JOIN users h ON h.id = t.help_user_id
        WHERE ${base.join(' AND ')}
        ORDER BY (t.progress IN ('done','stopped')), t.due_date IS NULL, t.due_date, t.id DESC`,
    )
    .all(...baseParams) as any[];

  const ids = rows.map((r) => r.id);
  const ph = ids.length ? ids.map(() => '?').join(',') : null;

  // (2) việc con
  const childrenOf = new Map<number, any[]>();
  if (ph) {
    for (const c of conn
      .prepare(`SELECT parent_task_id, id, title, progress, due_date FROM tasks WHERE parent_task_id IN (${ph})`)
      .all(...ids) as any[]) {
      (childrenOf.get(c.parent_task_id) ?? childrenOf.set(c.parent_task_id, []).get(c.parent_task_id)!).push(c);
    }
  }

  // (3) lần cập nhật mới nhất
  const lastOf = new Map<number, any>();
  if (ph) {
    for (const u of conn
      .prepare(
        `SELECT u.*, us.full_name AS actor_name FROM task_updates u
           LEFT JOIN users us ON us.id = u.actor_user_id
          WHERE u.task_id IN (${ph}) ORDER BY u.updated_on DESC, u.id DESC`,
      )
      .all(...ids) as any[]) {
      if (!lastOf.has(u.task_id)) lastOf.set(u.task_id, u);
    }
  }

  // (4) lịch sử hạn (đặt hạn + dời hạn)
  const dueHistOf = new Map<number, { old_value: string; new_value: string; reason: string | null; created_at: string }[]>();
  if (ph) {
    for (const h of conn
      .prepare(
        `SELECT task_id, old_value, new_value, reason, created_at FROM task_history
          WHERE field = 'due_date' AND task_id IN (${ph}) ORDER BY task_id, id ASC`,
      )
      .all(...ids) as any[]) {
      (dueHistOf.get(h.task_id) ?? dueHistOf.set(h.task_id, []).get(h.task_id)!).push(h);
    }
  }

  const withDomain = rows.map((r) => {
    const children = childrenOf.get(r.id) ?? [];
    return {
      raw: r,
      progress: r.progress as TaskProgress,
      due: r.due_date as string | null,
      reviewOn: r.review_on as string | null,
      completedAt: r.completed_at as string | null,
      subOpen: children.filter((c) => !closed(c.progress)).length,
      subTotal: children.length,
      group: r.group_key as TaskGroup,
      assigneeUserId: r.assignee_user_id as number | null,
    };
  });

  /* `undefined` (không truyền progress) = TẤT CẢ — giữ nghĩa cũ của `listMgmtTasks(p, {})`. */
  const filterOpts = {
    group: (f.group as TaskGroup) || undefined,
    progress: (f.progress as TrangThaiLoc) || 'tat-ca',
    hang: (f.hang as HangSo) || undefined,
  };
  const filtered = locVanHanh(withDomain as unknown as DongVanHanh[], filterOpts, today) as unknown as typeof withDomain;
  const facets = facetVanHanh(withDomain as unknown as DongVanHanh[], filterOpts, today);

  const rowsOut = filtered.map((w) => {
    const r = w.raw;
    const children = childrenOf.get(r.id) ?? [];
    const subDone = children.filter((c) => c.progress === 'done').length;
    const overdueChildren = children.filter((c) => !closed(c.progress) && c.due_date && c.due_date < today);
    const hist = dueHistOf.get(r.id) ?? [];
    const lu = lastOf.get(r.id);
    return {
      id: r.id, code: r.code, title: r.title,
      group: r.group_key as TaskGroup | null,
      taskType: r.task_type as string,
      branchId: r.branch_id, branchName: r.branch_name ?? 'Toàn hệ thống',
      assigneeUserId: r.assignee_user_id, assigneeName: r.assignee_name ?? null,
      /** PR-DUYET: người phụ trách là tên gõ tay, không phải tài khoản — hiện nhãn "ngoài hệ thống". */
      assigneeNgoai: !r.assignee_user_id && !!r.ten_ngoai,
      watcherUserId: r.watcher_user_id, watcherName: r.watcher_name ?? null,
      due: r.due_date as string | null,
      progress: r.progress as TaskProgress,
      progressLabel: TASK_PROGRESS_LABEL[r.progress as TaskProgress] ?? r.progress,
      stopReason: r.stop_reason ?? null,
      reviewOn: r.review_on ?? null,
      helpUserId: r.help_user_id ?? null,
      helpName: r.help_user_name ?? r.help_name ?? null,
      /* QUÁ HẠN là THUỘC TÍNH của việc, không phải một bản ghi riêng (mục 2.2). */
      overdue: !closed(r.progress) && !!r.due_date && r.due_date < today,
      /* "2/4 việc con hoàn thành" — KHÔNG quy thành 50% khối lượng (mục 8.6). */
      subTotal: children.length,
      subDone,
      subOpen: w.subOpen,
      subOverdue: overdueChildren.length > 0,
      subOverdueCount: overdueChildren.length,
      subOverdueTitles: overdueChildren.slice(0, 2).map((c: any) => c.title as string),
      caseLinks: r.case_links as number,
      /* Q9: hạn ĐẦU TIÊN trước mọi lần dời, và lý do của lần dời GẦN NHẤT. PR-UXF-a Q16: lần ĐẶT hạn đầu không phải "dời". */
      ...hanGocCua(hist.map((h) => ({ old: h.old_value ?? null, new: h.new_value ?? null, reason: h.reason ?? null }))),
      lastUpdate: lu
        ? {
          on: lu.updated_on, progress: lu.progress,
          progressLabel: TASK_PROGRESS_LABEL[lu.progress as TaskProgress] ?? lu.progress,
          note: lu.note ?? null, by: lu.actor_name ?? null,
        }
        : null,
    };
  });

  return {
    canEdit: true,
    scopeEmpty: false,
    facets,
    /* Bốn câu hỏi chồng nhau có chủ ý (Q8) — KHÔNG phải một phép chia cộng bằng tổng. */
    hangSo: facets.hang,
    rows: rowsOut,
  };
}

/** Một công việc, kèm việc con, lịch sử cập nhật, lịch sử dời hạn và các case làm căn cứ. */
export function mgmtTaskDetail(p: Principal, taskId: number) {
  const conn = db();
  const t = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!t) throw notFound('Không tìm thấy công việc.');
  /*
   * NGƯỜI ĐƯỢC GIAO XEM ĐƯỢC VIỆC CỦA MÌNH, kể cả khi không thấy toàn bộ tab (mục 8.3).
   * Giao việc cho giáo viên rồi không cho họ mở ra xem là giao việc bằng miệng.
   */
  const mine = t.assignee_user_id === p.userId || t.watcher_user_id === p.userId;
  const sub = conn.prepare('SELECT assignee_user_id, watcher_user_id FROM tasks WHERE parent_task_id = ?')
    .all(taskId) as any[];
  const inSub = sub.some((x) => x.assignee_user_id === p.userId || x.watcher_user_id === p.userId);
  const coQuyen = coQuyenViec(p, t);
  if (!coQuyen && !mine && !inSub) {
    throw badRequest('Công việc này không được giao cho bạn.');
  }

  const people = (ids: (number | null)[]) => {
    const list = [...new Set(ids.filter((x): x is number => !!x))];
    const m = new Map<number, string>();
    if (!list.length) return m;
    for (const r of conn
      .prepare(`SELECT id, full_name FROM users WHERE id IN (${list.map(() => '?').join(',')})`)
      .all(...list) as any[]) m.set(r.id, r.full_name);
    return m;
  };

  const subs = conn
    .prepare('SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY due_date IS NULL, due_date, id')
    .all(taskId) as any[];
  const names = people([
    t.assignee_user_id, t.watcher_user_id, t.help_user_id,
    ...subs.flatMap((x) => [x.assignee_user_id, x.watcher_user_id]),
  ]);
  const today = demoToday();
  const openSubs = subs.filter((x) => !closed(x.progress));

  const dueHistory = (conn
    .prepare(
      `SELECT h.*, us.full_name AS actor_name FROM task_history h
         LEFT JOIN users us ON us.id = h.actor_user_id
        WHERE h.task_id = ? AND h.field = 'due_date' ORDER BY h.id ASC`,
    )
    .all(taskId) as any[]).map((h) => ({
      old: h.old_value ?? null, new: h.new_value ?? null, reason: h.reason ?? null,
      by: names.get(h.actor_user_id) ?? h.actor_name ?? null, at: h.created_at,
    }));

  return {
    id: t.id, code: t.code, title: t.title, note: t.note ?? null,
    group: t.group_key ?? null, taskType: t.task_type,
    branchId: t.branch_id,
    assigneeUserId: t.assignee_user_id, assigneeName: names.get(t.assignee_user_id) ?? t.assignee_name ?? null,
    assigneeNgoai: !t.assignee_user_id && !!t.assignee_name,
    watcherUserId: t.watcher_user_id, watcherName: names.get(t.watcher_user_id) ?? null,
    due: t.due_date ?? null, progress: t.progress,
    progressLabel: TASK_PROGRESS_LABEL[t.progress as TaskProgress] ?? t.progress,
    stopReason: t.stop_reason ?? null, reviewOn: t.review_on ?? null,
    helpUserId: t.help_user_id ?? null,
    helpName: (t.help_user_id ? names.get(t.help_user_id) : null) ?? t.help_name ?? null,
    overdue: !closed(t.progress) && !!t.due_date && t.due_date < today,
    /* PR-UXF-a Q16 (G-10): chi tiết trả CÙNG `hanGoc` với danh sách (web đang đọc `data.hanGoc` mà trước đây không có). */
    ...hanGocCua(dueHistory),
    dueHistory,
    openSubTitles: openSubs.map((x) => x.title as string),
    subtasks: subs.map((x) => ({
      id: x.id, title: x.title, due: x.due_date ?? null, progress: x.progress,
      progressLabel: TASK_PROGRESS_LABEL[x.progress as TaskProgress] ?? x.progress,
      assigneeUserId: x.assignee_user_id, assigneeName: names.get(x.assignee_user_id) ?? null,
      stopReason: x.stop_reason ?? null,
      overdue: !closed(x.progress) && !!x.due_date && x.due_date < today,
    })),
    updates: (conn
      .prepare(
        `SELECT u.*, us.full_name AS actor_name FROM task_updates u
           LEFT JOIN users us ON us.id = u.actor_user_id
          WHERE u.task_id = ? ORDER BY u.updated_on DESC, u.id DESC`,
      )
      .all(taskId) as any[]).map((u) => ({
        id: u.id, on: u.updated_on, progress: u.progress,
        progressLabel: TASK_PROGRESS_LABEL[u.progress as TaskProgress] ?? u.progress,
        note: u.note ?? null, by: u.actor_name ?? null,
      })),
    /* Case làm CĂN CỨ — chỉ để tra, không điều khiển gì (mục 8.7). */
    cases: conn
      .prepare(
        `SELECT sc.id, sc.title, s.full_name AS student_name
           FROM task_case_links l JOIN sos_cases sc ON sc.id = l.case_id
           LEFT JOIN students s ON s.id = sc.student_id
          WHERE l.task_id = ? ORDER BY sc.id`,
      )
      .all(taskId) as any[],
    viewer: { canEdit: coQuyen, canUpdate: coQuyen || mine || inSub },
  };
}

function nextCode(conn: any): string {
  const n = (conn.prepare("SELECT COUNT(*) AS n FROM tasks").get() as any).n as number;
  return padCode('CV', n + 1, 4);
}

/** ID gửi lên phải là một tài khoản nhân_vien (giáo viên/quản lý) đang hoạt động, nếu có gửi. */
function kiemNguoi(label: string, userId: number | null | undefined) {
  if (userId && !laNguoiHopLe(userId, 'nhan_vien')) throw badRequest(`${label} không hợp lệ.`);
}

/**
 * PR-DUYET (PR-NEN Q12, YC-10): người phụ trách NGOÀI hệ thống — tên gõ tay (ví dụ "Tổ chuyên môn"), CHỈ khi không chọn tài khoản.
 * Không nhận thông báo, không sinh dòng việc cho ai. Người theo dõi vẫn chỉ là tài khoản (NEN Q13).
 */
function tenNgoai(userId: number | null | undefined, ten: unknown): string | null {
  if (userId) return null;
  const s = typeof ten === 'string' ? ten.trim() : '';
  if (!s) return null;
  if (s.length < 2) throw badRequest('Tên người phụ trách ngoài hệ thống cần ít nhất 2 ký tự.');
  if (s.length > 80) throw badRequest('Tên người phụ trách ngoài hệ thống tối đa 80 ký tự.');
  return s;
}

export function createMgmtTask(p: Principal, input: {
  title: string; group: string; branchId?: number | null;
  assigneeUserId?: number | null; watcherUserId?: number | null;
  /** Tên người phụ trách ngoài hệ thống — chỉ khi không có `assigneeUserId`. */
  assigneeName?: string | null;
  due?: string | null; note?: string | null;
  parentTaskId?: number | null;
  caseIds?: number[];
  /** PR-Ra (R6): tạo từ ô báo cáo đơn vị — tự nối vào `unit_report_task_links`. */
  unitReportId?: number | null;
}) {
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId: input.branchId ?? null, anyScope: !input.branchId },
    'Chỉ Quản lý mới tạo được công việc quản lý.');
  const title = (input.title ?? '').trim();
  if (!title) throw badRequest('Công việc phải có tên.');
  if (!(TASK_GROUPS as readonly string[]).includes(input.group)) {
    throw badRequest('Công việc phải thuộc một trong bốn nhóm quản lý.');
  }
  if (input.due && !isIsoDate(input.due)) throw badRequest('Hạn không hợp lệ.');
  kiemNguoi('Người phụ trách', input.assigneeUserId);
  kiemNguoi('Người theo dõi', input.watcherUserId);
  const assigneeName = tenNgoai(input.assigneeUserId, input.assigneeName);

  const conn = db();
  let parent: any = null;
  if (input.parentTaskId) {
    parent = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(input.parentTaskId) as any;
    if (!parent) throw notFound('Không tìm thấy công việc cha.');
    /* MỘT TẦNG (mục 8.6): việc con của một việc con là chỗ bảng bắt đầu không đọc được nữa. */
    if (parent.parent_task_id) throw badRequest('Công việc con chỉ có một tầng.');
  }

  const taskBranchId = input.branchId ?? parent?.branch_id ?? null;
  let sourceType = 'manual';
  let sourceUnitReportId: number | null = null;
  if (input.unitReportId) {
    const ur = conn
      .prepare(
        `SELECT ur.id, ru.branch_id AS unit_branch_id, ru.kind AS unit_kind
           FROM unit_reports ur JOIN reporting_units ru ON ru.id = ur.reporting_unit_id
          WHERE ur.id = ?`,
      )
      .get(input.unitReportId) as any;
    if (!ur) throw notFound('Không tìm thấy báo cáo đơn vị.');
    /* Đơn vị Tutor không có chi nhánh — việc nối vào phải là việc "Toàn hệ thống" (branch_id NULL). */
    const wantBranch = ur.unit_kind === 'department' ? null : ur.unit_branch_id;
    if (taskBranchId !== wantBranch) throw badRequest('Việc phải cùng chi nhánh với đơn vị báo cáo.');
    sourceType = 'unit_report';
    sourceUnitReportId = input.unitReportId;
  }

  return tx(() => {
    const info = conn
      .prepare(
        `INSERT INTO tasks (code, title, kind, task_type, group_key, parent_task_id,
                            branch_id, assignee_user_id, assignee_name, watcher_user_id, due_date,
                            progress, note, source_type, source_unit_report_id, created_by, created_at)
         VALUES (?,?, 'branch_ops', 'long_term', ?,?,?,?,?,?,?, 'not_started', ?,?,?,?,?)`,
      )
      .run(nextCode(conn), title, parent?.group_key ?? input.group, input.parentTaskId ?? null,
           taskBranchId,
           input.assigneeUserId ?? null, assigneeName, input.watcherUserId ?? null,
           input.due ?? null, (input.note ?? '').trim() || null, sourceType, sourceUnitReportId, p.userId, nowIso());
    const id = Number(info.lastInsertRowid);

    for (const caseId of input.caseIds ?? []) {
      conn.prepare('INSERT OR IGNORE INTO task_case_links (task_id, case_id, created_at) VALUES (?,?,?)')
        .run(id, caseId, nowIso());
    }
    if (sourceUnitReportId) {
      conn.prepare(
        `INSERT OR IGNORE INTO unit_report_task_links (unit_report_id, task_id, created_by, created_at) VALUES (?,?,?,?)`,
      ).run(sourceUnitReportId, id, p.userId, nowIso());
    }
    writeAudit({
      actorUserId: p.userId, action: 'mgmt_task.create', entityType: 'task', entityId: id,
      entityLabel: title,
    });
    return mgmtTaskDetail(p, id);
  });
}

/**
 * HẠN MẶC ĐỊNH CỦA VIỆC CON = hạn cha trừ MỘT NGÀY (mục 8.6).
 *
 * Chỉ là GỢI Ý lúc tạo, sửa được ngay. Và đổi hạn cha về sau KHÔNG kéo theo hạn con đã chốt:
 * người ta chốt hạn con vì một lý do riêng, dời hộ là xoá mất lý do đó.
 *
 * Hạn cha đã là quá khứ thì trừ một ngày ra một ngày còn quá khứ hơn — trường hợp đó trả về
 * NULL để người tạo tự chọn, thay vì đưa ra một mặc định vô nghĩa.
 */
export function defaultSubDue(parentDue: string | null): string | null {
  if (!parentDue) return null;
  const d = addDays(parentDue, -1);
  return d < demoToday() ? null : d;
}

/**
 * GHI MỘT LẦN CẬP NHẬT — đây là cách DUY NHẤT trạng thái công việc đổi.
 *
 * Không có đường nào sửa thẳng `progress` mà không để lại dấu vết: một bảng tiến độ mà không
 * biết ai đổi lúc nào thì đến cuối quý không ai dựng lại được chuyện gì đã xảy ra.
 */
export function updateMgmtTask(p: Principal, taskId: number, input: {
  progress: string; note?: string | null; reason?: string | null;
  on?: string | null; reviewOn?: string | null;
  /** PR-Ra Q10: người cần hỗ trợ khi Tạm ngưng — một tài khoản (nhóm nhân_vien) hoặc người ngoài. */
  helpUserId?: number | null; helpName?: string | null;
}) {
  const conn = db();
  const t = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!t) throw notFound('Không tìm thấy công việc.');

  /* Người được giao cập nhật được việc của mình; người THEO DÕI thì không (mục 8.3). */
  const isAssignee = t.assignee_user_id === p.userId;
  if (!coQuyenViec(p, t) && !isAssignee) {
    throw badRequest('Chỉ người được giao hoặc Quản lý mới cập nhật được công việc này.');
  }
  if (!(TASK_PROGRESS as readonly string[]).includes(input.progress)) {
    throw badRequest('Trạng thái không hợp lệ.');
  }
  const needReason = (TASK_PROGRESS_NEEDS_REASON as readonly string[]).includes(input.progress);
  const reason = (input.reason ?? '').trim();
  if (needReason && !reason) {
    throw badRequest(
      `"${TASK_PROGRESS_LABEL[input.progress as TaskProgress]}" phải ghi lý do — `
      + 'một việc tự nhiên im lặng mà không ai biết vì sao là thứ vài tháng sau không ai giải thích được.',
    );
  }
  const on = input.on ?? demoToday();
  if (!isIsoDate(on)) throw badRequest('Ngày cập nhật không hợp lệ.');
  if (on > demoToday()) throw badRequest('Không ghi được ngày cập nhật ở tương lai.');

  /* PR-Ra Q10: TẠM NGƯNG bắt buộc BA Ý — lý do (đã kiểm ở trên), người cần hỗ trợ, ngày xem lại. */
  let helpUserId: number | null = null;
  let helpName: string | null = null;
  if (input.progress === 'paused') {
    helpUserId = input.helpUserId ?? null;
    helpName = (input.helpName ?? '').trim() || null;
    if (!helpUserId && !helpName) throw badRequest('Tạm ngưng phải ghi cần ai hỗ trợ.');
    if (helpUserId) {
      kiemNguoi('Người cần hỗ trợ', helpUserId);
      helpName = null;   // một trong hai — có tài khoản thì không lưu thêm tên gõ tay.
    }
    if (!input.reviewOn || !isIsoDate(input.reviewOn) || input.reviewOn < on) {
      throw badRequest('Tạm ngưng phải có ngày xem lại (từ ngày cập nhật trở đi).');
    }
  }

  /*
   * HOÀN THÀNH và DỪNG HẲN việc CHA đều cần việc con đã khép lại trước (mục 8.6, Q11) — đánh
   * dấu cha xong hoặc dừng hẳn trong khi con còn dở là nói dối bảng tiến độ, và con sẽ treo
   * mãi ở "Việc cần làm" của người được giao mà không ai còn nhớ tới cha của nó nữa.
   */
  if ((input.progress === 'done' || input.progress === 'stopped') && !t.parent_task_id) {
    const openSubs = conn
      .prepare(`SELECT title FROM tasks WHERE parent_task_id = ? AND progress NOT IN ('done','stopped') ORDER BY id`)
      .all(taskId) as any[];
    if (openSubs.length > 0) {
      const verb = input.progress === 'done' ? 'hoàn thành' : 'dừng hẳn';
      throw badRequest(
        `Còn ${openSubs.length} công việc con chưa khép lại: ${tenViecConMo(openSubs.map((s) => s.title))}. `
        + `Khép chúng trước rồi mới ${verb} việc này.`,
      );
    }
  }

  return tx(() => {
    const before = t.progress;
    conn
      .prepare(
        `UPDATE tasks SET progress = ?, stop_reason = ?, review_on = ?,
                help_user_id = ?, help_name = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      )
      .run(input.progress, needReason ? reason : null,
           input.progress === 'paused' ? (input.reviewOn ?? null) : null,
           input.progress === 'paused' ? helpUserId : null,
           input.progress === 'paused' ? helpName : null,
           input.progress === 'done' ? on : null, nowIso(), taskId);
    conn
      .prepare(
        `INSERT INTO task_updates (task_id, period_id, progress, note, actor_user_id, updated_on, created_at)
         VALUES (?,?,?,?,?,?,?)`,
      )
      .run(taskId, ensurePeriod(on).id, input.progress,
           [reason || null, (input.note ?? '').trim() || null].filter(Boolean).join(' — ') || null,
           p.userId, on, nowIso());
    conn
      .prepare(
        `INSERT INTO task_history (task_id, field, old_value, new_value, actor_user_id, created_at)
         VALUES (?, 'progress', ?, ?, ?, ?)`,
      )
      .run(taskId, before, input.progress, p.userId, nowIso());
    return mgmtTaskDetail(p, taskId);
  });
}

/** Sửa phần mô tả của một công việc: tên, người, hạn, nhóm. Không đụng vào tiến độ. */
export function editMgmtTask(p: Principal, taskId: number, patch: {
  title?: string; group?: string; branchId?: number | null;
  assigneeUserId?: number | null; watcherUserId?: number | null;
  assigneeName?: string | null;
  due?: string | null; note?: string | null;
  /** PR-Ra Q9: bắt buộc khi đổi hạn ĐANG CÓ sang ngày khác (2–200 ký tự). */
  lyDoDoiHan?: string | null;
}) {
  const conn = db();
  const t = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!t) throw notFound('Không tìm thấy công việc.');
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId: t.branch_id, anyScope: !t.branch_id },
    'Chỉ Quản lý mới sửa được công việc quản lý.');

  const sets: string[] = [];
  const params: unknown[] = [];
  const put = (col: string, v: unknown) => { sets.push(`${col} = ?`); params.push(v); };
  const historyRows: { field: string; oldValue: string | null; newValue: string | null; reason: string | null }[] = [];

  if (patch.title !== undefined) {
    const v = (patch.title ?? '').trim();
    if (!v) throw badRequest('Công việc phải có tên.');
    put('title', v);
  }
  if (patch.group !== undefined) {
    if (!(TASK_GROUPS as readonly string[]).includes(patch.group)) throw badRequest('Nhóm không hợp lệ.');
    put('group_key', patch.group);
  }
  if (patch.branchId !== undefined) put('branch_id', patch.branchId);
  if (patch.assigneeUserId !== undefined) {
    kiemNguoi('Người phụ trách', patch.assigneeUserId);
    if (patch.assigneeUserId !== t.assignee_user_id) {
      historyRows.push({
        field: 'assignee_user_id', oldValue: t.assignee_user_id ? String(t.assignee_user_id) : null,
        newValue: patch.assigneeUserId ? String(patch.assigneeUserId) : null, reason: null,
      });
    }
    put('assignee_user_id', patch.assigneeUserId);
  }
  if (patch.assigneeUserId !== undefined || patch.assigneeName !== undefined) {
    const uid = patch.assigneeUserId !== undefined ? patch.assigneeUserId : t.assignee_user_id;
    const ten = tenNgoai(uid, patch.assigneeName !== undefined ? patch.assigneeName : t.assignee_name);
    if ((ten ?? null) !== (t.assignee_name ?? null)) {
      historyRows.push({ field: 'assignee_name', oldValue: t.assignee_name ?? null, newValue: ten, reason: null });
    }
    put('assignee_name', ten);
  }
  if (patch.watcherUserId !== undefined) {
    kiemNguoi('Người theo dõi', patch.watcherUserId);
    if (patch.watcherUserId !== t.watcher_user_id) {
      historyRows.push({
        field: 'watcher_user_id', oldValue: t.watcher_user_id ? String(t.watcher_user_id) : null,
        newValue: patch.watcherUserId ? String(patch.watcherUserId) : null, reason: null,
      });
    }
    put('watcher_user_id', patch.watcherUserId);
  }
  if (patch.due !== undefined) {
    if (patch.due && !isIsoDate(patch.due)) throw badRequest('Hạn không hợp lệ.');
    /*
     * Q9: ĐỔI HẠN ĐANG CÓ sang ngày khác bắt buộc lý do — quá hạn vẫn tính theo hạn HIỆN TẠI
     * (giữ nguyên luật SLA cũ), lịch sử chỉ để giải thích, không đổi cách đếm quá hạn.
     * Đặt hạn LẦN ĐẦU (NULL → ngày) không cần lý do — chưa có gì để "dời" cả.
     *
     * ĐỔI HẠN CHA KHÔNG DỜI HẠN CON (mục 8.6) — nên ở đây cố tình không đụng gì tới việc con.
     */
    if (t.due_date && patch.due !== t.due_date) {
      const ly = (patch.lyDoDoiHan ?? '').trim();
      if (ly.length < 2 || ly.length > 200) {
        throw badRequest('Dời hạn phải ghi lý do (2–200 ký tự).');
      }
      historyRows.push({ field: 'due_date', oldValue: t.due_date, newValue: patch.due, reason: ly });
    } else if (!t.due_date && patch.due) {
      historyRows.push({ field: 'due_date', oldValue: null, newValue: patch.due, reason: null });
    }
    put('due_date', patch.due);
  }
  if (patch.note !== undefined) put('note', (patch.note ?? '').trim() || null);
  if (!sets.length) return mgmtTaskDetail(p, taskId);

  return tx(() => {
    sets.push('updated_at = ?'); params.push(nowIso(), taskId);
    conn.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    for (const h of historyRows) {
      conn.prepare(
        `INSERT INTO task_history (task_id, field, old_value, new_value, reason, actor_user_id, created_at)
         VALUES (?,?,?,?,?,?,?)`,
      ).run(taskId, h.field, h.oldValue, h.newValue, h.reason, p.userId, nowIso());
    }
    return mgmtTaskDetail(p, taskId);
  });
}

/** Công việc được giao cho CHÍNH người đang xem — để hiện ở Toàn cảnh, không cần mở tab quản lý. */
export function myMgmtTasks(p: Principal) {
  const conn = db();
  const today = demoToday();
  return (conn
    .prepare(
      `SELECT t.*, pt.title AS parent_title FROM tasks t
         LEFT JOIN tasks pt ON pt.id = t.parent_task_id
        WHERE t.kind = 'branch_ops' AND t.assignee_user_id = ?
          AND t.progress NOT IN ('done','stopped')
        ORDER BY t.due_date IS NULL, t.due_date`,
    )
    .all(p.userId) as any[]).map((t) => ({
      id: t.id, title: t.title, parentTitle: t.parent_title ?? null,
      due: t.due_date ?? null, progress: t.progress,
      progressLabel: TASK_PROGRESS_LABEL[t.progress as TaskProgress] ?? t.progress,
      overdue: !closed(t.progress) && !!t.due_date && t.due_date < today,
      group: t.group_key ?? null,
    }));
}
