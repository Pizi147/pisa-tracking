import { db, tx } from '../db.ts';
import {
  PERMISSIONS, TASK_GROUPS, TASK_PROGRESS, TASK_PROGRESS_CLOSED, TASK_PROGRESS_LABEL,
  TASK_PROGRESS_NEEDS_REASON, type TaskGroup, type TaskProgress,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, isIsoDate, notFound, nowIso, padCode } from '../util.ts';
import { can, require_, scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { ensurePeriod } from '../platform/week.ts';
import { writeAudit } from '../platform/audit.ts';

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
 *    nào; dừng hẳn là đã quyết định không làm. Cả hai bắt buộc ghi lý do.
 * 4. LIÊN KẾT CASE LÀ CĂN CỨ, KHÔNG PHẢI ĐIỀU KHIỂN (mục 8.7). Hoàn thành việc quản lý
 *    KHÔNG đóng case nào, và cũng không tự tạo phương án cho em nào.
 */

export type TaskFilter = {
  branchId?: number | null;
  group?: string | null;
  progress?: string | null;
  assigneeUserId?: number | null;
  /** Tuần cập nhật — lọc theo các lần cập nhật, không lọc theo ngày tạo công việc. */
  periodId?: number | null;
};

/** Toàn bộ tab chỉ dành cho Quản trị hệ thống và Quản lý chi nhánh (mục 8.3). */
export function canSeeBoard(p: Principal): boolean {
  return can(p, PERMISSIONS.MEETING_EDIT, { anyScope: true })
    || can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true });
}

const closed = (pr: string) => (TASK_PROGRESS_CLOSED as readonly string[]).includes(pr);

/**
 * Bảng công việc quản lý.
 *
 * Việc CHƯA XONG vẫn hiện sang tuần sau, kể cả khi hạn còn xa (mục 8.4) — chỉ giữ lại việc
 * cũ khi nó đã quá hạn là cách chắc chắn nhất để một việc dài hạn biến mất khỏi tầm mắt.
 */
export function listMgmtTasks(p: Principal, f: TaskFilter = {}) {
  if (!canSeeBoard(p)) return { rows: [], canEdit: false, scopeEmpty: true };
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.MEETING_EDIT);

  const where: string[] = ['t.parent_task_id IS NULL', "t.kind = 'branch_ops'"];
  const params: unknown[] = [];
  if (f.branchId) { where.push('t.branch_id = ?'); params.push(f.branchId); }
  else if (!scope.all && scope.branchIds?.length) {
    where.push(`(t.branch_id IS NULL OR t.branch_id IN (${scope.branchIds.map(() => '?').join(',')}))`);
    params.push(...scope.branchIds);
  }
  if (f.group) { where.push('t.group_key = ?'); params.push(f.group); }
  if (f.progress) { where.push('t.progress = ?'); params.push(f.progress); }
  if (f.assigneeUserId) { where.push('t.assignee_user_id = ?'); params.push(f.assigneeUserId); }
  /*
   * LỌC THEO TUẦN CẬP NHẬT: giữ những việc CÓ cập nhật trong tuần đó. Việc chưa xong mà tuần
   * đó không ai động vào thì VẪN HIỆN — đó chính là việc cần hỏi "tuần rồi sao không ai làm".
   */
  if (f.periodId) {
    where.push(`(EXISTS (SELECT 1 FROM task_updates u WHERE u.task_id = t.id AND u.period_id = ?)
                 OR t.progress NOT IN ('done','stopped'))`);
    params.push(f.periodId);
  }

  const rows = conn
    .prepare(
      `SELECT t.*, b.name AS branch_name,
              a.full_name AS assignee_name, w.full_name AS watcher_name,
              (SELECT COUNT(*) FROM tasks c WHERE c.parent_task_id = t.id) AS sub_total,
              (SELECT COUNT(*) FROM tasks c WHERE c.parent_task_id = t.id AND c.progress = 'done') AS sub_done,
              (SELECT MIN(c.due_date) FROM tasks c
                WHERE c.parent_task_id = t.id AND c.progress NOT IN ('done','stopped')
                  AND c.due_date IS NOT NULL AND c.due_date < ?) AS sub_overdue_due,
              (SELECT COUNT(*) FROM task_case_links l WHERE l.task_id = t.id) AS case_links
         FROM tasks t
         LEFT JOIN branches b ON b.id = t.branch_id
         LEFT JOIN users a ON a.id = t.assignee_user_id
         LEFT JOIN users w ON w.id = t.watcher_user_id
        WHERE ${where.join(' AND ')}
        ORDER BY (t.progress IN ('done','stopped')), t.due_date IS NULL, t.due_date, t.id DESC`,
    )
    .all(demoToday(), ...params) as any[];

  const today = demoToday();
  const lastOf = new Map<number, any>();
  if (rows.length) {
    const ph = rows.map(() => '?').join(',');
    for (const u of conn
      .prepare(
        `SELECT u.*, us.full_name AS actor_name FROM task_updates u
           LEFT JOIN users us ON us.id = u.actor_user_id
          WHERE u.task_id IN (${ph}) ORDER BY u.updated_on DESC, u.id DESC`,
      )
      .all(...rows.map((r) => r.id)) as any[]) {
      if (!lastOf.has(u.task_id)) lastOf.set(u.task_id, u);
    }
  }

  return {
    canEdit: true,
    scopeEmpty: false,
    rows: rows.map((r) => ({
      id: r.id, code: r.code, title: r.title,
      group: r.group_key as TaskGroup | null,
      branchId: r.branch_id, branchName: r.branch_name ?? 'Toàn hệ thống',
      assigneeUserId: r.assignee_user_id, assigneeName: r.assignee_name ?? null,
      watcherUserId: r.watcher_user_id, watcherName: r.watcher_name ?? null,
      due: r.due_date as string | null,
      progress: r.progress as TaskProgress,
      progressLabel: TASK_PROGRESS_LABEL[r.progress as TaskProgress] ?? r.progress,
      stopReason: r.stop_reason ?? null,
      reviewOn: r.review_on ?? null,
      /*
       * QUÁ HẠN là THUỘC TÍNH của việc, không phải một bản ghi riêng (mục 2.2). Việc đã
       * khép lại thì không còn quá hạn — nó đã xong hoặc đã dừng.
       */
      overdue: !closed(r.progress) && !!r.due_date && r.due_date < today,
      /* "2/4 việc con hoàn thành" — KHÔNG quy thành 50% khối lượng (mục 8.6). */
      subTotal: r.sub_total as number,
      subDone: r.sub_done as number,
      /* Việc con quá hạn trong khi việc cha chưa tới hạn — một tình huống phải nhìn thấy. */
      subOverdue: r.sub_overdue_due !== null,
      caseLinks: r.case_links as number,
      lastUpdate: lastOf.get(r.id)
        ? {
          on: lastOf.get(r.id).updated_on,
          progress: lastOf.get(r.id).progress,
          progressLabel: TASK_PROGRESS_LABEL[lastOf.get(r.id).progress as TaskProgress]
            ?? lastOf.get(r.id).progress,
          note: lastOf.get(r.id).note ?? null,
          by: lastOf.get(r.id).actor_name ?? null,
        }
        : null,
    })),
  };
}

/** Một công việc, kèm việc con, lịch sử cập nhật và các case làm căn cứ. */
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
  if (!canSeeBoard(p) && !mine && !inSub) {
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
  const names = people([t.assignee_user_id, t.watcher_user_id, ...subs.flatMap((x) => [x.assignee_user_id, x.watcher_user_id])]);
  const today = demoToday();

  return {
    id: t.id, code: t.code, title: t.title, note: t.note ?? null,
    group: t.group_key ?? null,
    branchId: t.branch_id,
    assigneeUserId: t.assignee_user_id, assigneeName: names.get(t.assignee_user_id) ?? null,
    watcherUserId: t.watcher_user_id, watcherName: names.get(t.watcher_user_id) ?? null,
    due: t.due_date ?? null, progress: t.progress,
    progressLabel: TASK_PROGRESS_LABEL[t.progress as TaskProgress] ?? t.progress,
    stopReason: t.stop_reason ?? null, reviewOn: t.review_on ?? null,
    overdue: !closed(t.progress) && !!t.due_date && t.due_date < today,
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
    viewer: { canEdit: canSeeBoard(p), canUpdate: canSeeBoard(p) || mine || inSub },
  };
}

function nextCode(conn: any): string {
  const n = (conn.prepare("SELECT COUNT(*) AS n FROM tasks").get() as any).n as number;
  return padCode('CV', n + 1, 4);
}

export function createMgmtTask(p: Principal, input: {
  title: string; group: string; branchId?: number | null;
  assigneeUserId?: number | null; watcherUserId?: number | null;
  due?: string | null; note?: string | null;
  parentTaskId?: number | null;
  caseIds?: number[];
}) {
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId: input.branchId ?? null, anyScope: !input.branchId },
    'Chỉ Quản lý mới tạo được công việc quản lý.');
  const title = (input.title ?? '').trim();
  if (!title) throw badRequest('Công việc phải có tên.');
  if (!(TASK_GROUPS as readonly string[]).includes(input.group)) {
    throw badRequest('Công việc phải thuộc một trong bốn nhóm quản lý.');
  }
  if (input.due && !isIsoDate(input.due)) throw badRequest('Hạn không hợp lệ.');

  const conn = db();
  let parent: any = null;
  if (input.parentTaskId) {
    parent = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(input.parentTaskId) as any;
    if (!parent) throw notFound('Không tìm thấy công việc cha.');
    /* MỘT TẦNG (mục 8.6): việc con của một việc con là chỗ bảng bắt đầu không đọc được nữa. */
    if (parent.parent_task_id) throw badRequest('Công việc con chỉ có một tầng.');
  }

  return tx(() => {
    const info = conn
      .prepare(
        `INSERT INTO tasks (code, title, kind, task_type, group_key, parent_task_id,
                            branch_id, assignee_user_id, watcher_user_id, due_date,
                            progress, note, created_by, created_at)
         VALUES (?,?, 'branch_ops', 'long_term', ?,?,?,?,?,?, 'not_started', ?,?,?)`,
      )
      .run(nextCode(conn), title, parent?.group_key ?? input.group, input.parentTaskId ?? null,
           input.branchId ?? parent?.branch_id ?? null,
           input.assigneeUserId ?? null, input.watcherUserId ?? null,
           input.due ?? null, (input.note ?? '').trim() || null, p.userId, nowIso());
    const id = Number(info.lastInsertRowid);

    for (const caseId of input.caseIds ?? []) {
      conn.prepare('INSERT OR IGNORE INTO task_case_links (task_id, case_id, created_at) VALUES (?,?,?)')
        .run(id, caseId, nowIso());
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
}) {
  const conn = db();
  const t = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!t) throw notFound('Không tìm thấy công việc.');

  /* Người được giao cập nhật được việc của mình; người THEO DÕI thì không (mục 8.3). */
  const isAssignee = t.assignee_user_id === p.userId;
  if (!canSeeBoard(p) && !isAssignee) {
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

  /*
   * HOÀN THÀNH VIỆC CHA cần người phụ trách chính xác nhận (mục 8.6) — và chỉ xác nhận được
   * khi việc con đã khép lại. Đánh dấu cha xong trong khi con còn dở là nói dối bảng tiến độ.
   */
  if (input.progress === 'done' && !t.parent_task_id) {
    const openSub = conn
      .prepare(`SELECT COUNT(*) AS n FROM tasks WHERE parent_task_id = ? AND progress NOT IN ('done','stopped')`)
      .get(taskId) as any;
    if (openSub.n > 0) {
      throw badRequest(`Còn ${openSub.n} công việc con chưa khép lại. Khép chúng trước rồi mới hoàn thành việc này.`);
    }
  }

  return tx(() => {
    const before = t.progress;
    conn
      .prepare(
        `UPDATE tasks SET progress = ?, stop_reason = ?, review_on = ?,
                completed_at = ?, updated_at = ? WHERE id = ?`,
      )
      .run(input.progress, needReason ? reason : null,
           input.progress === 'paused' ? (input.reviewOn ?? null) : null,
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
  due?: string | null; note?: string | null;
}) {
  const conn = db();
  const t = conn.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as any;
  if (!t) throw notFound('Không tìm thấy công việc.');
  require_(p, PERMISSIONS.MEETING_EDIT, { branchId: t.branch_id, anyScope: !t.branch_id },
    'Chỉ Quản lý mới sửa được công việc quản lý.');

  const sets: string[] = [];
  const params: unknown[] = [];
  const put = (col: string, v: unknown) => { sets.push(`${col} = ?`); params.push(v); };
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
  if (patch.assigneeUserId !== undefined) put('assignee_user_id', patch.assigneeUserId);
  if (patch.watcherUserId !== undefined) put('watcher_user_id', patch.watcherUserId);
  if (patch.due !== undefined) {
    if (patch.due && !isIsoDate(patch.due)) throw badRequest('Hạn không hợp lệ.');
    /*
     * ĐỔI HẠN CHA KHÔNG DỜI HẠN CON (mục 8.6) — nên ở đây cố tình không đụng gì tới việc con.
     * Người ta chốt hạn con vì một lý do riêng; dời hộ là xoá mất lý do đó mà không ai hay.
     */
    put('due_date', patch.due);
  }
  if (patch.note !== undefined) put('note', (patch.note ?? '').trim() || null);
  if (!sets.length) return mgmtTaskDetail(p, taskId);

  sets.push('updated_at = ?'); params.push(nowIso(), taskId);
  conn.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return mgmtTaskDetail(p, taskId);
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
