import { db } from './db.ts';
import { PERMISSIONS, type WorkScope } from '../../shared/domain/index.ts';
import { demoToday } from './demoConfig.ts';
import { forbidden } from './util.ts';

/**
 * Quyền = Permission của role × Phạm vi chi nhánh của CHÍNH grant đó × Phân công lớp/kỹ năng.
 *
 * Không có role nào mặc định thấy toàn hệ thống: chỉ grant có branch_id = NULL mới toàn hệ thống,
 * và điều đó do dữ liệu quyết định chứ không suy từ tên role.
 */

export type Grant = {
  id: number;
  roleKey: string;
  roleName: string;
  branchId: number | null;      // null = toàn hệ thống
  branchName: string | null;
  permissions: Set<string>;
};

export type Assignment = {
  id: number;
  classId: number;
  skill: string | null;
  isCore: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type Principal = {
  userId: number;
  code: string;
  fullName: string;
  title: string | null;
  grants: Grant[];
  roleKeys: string[];
  assignments: Assignment[];
};

export type Ctx = {
  branchId?: number | null;
  classId?: number | null;
  studentId?: number | null;
  skill?: string | null;
  /** Kiểm tra ở mức màn hình: nội dung bên trong vẫn được lọc lại theo phạm vi. */
  anyScope?: boolean;
  date?: string;
};

export function loadPrincipal(userId: number): Principal {
  const conn = db();
  const user = conn.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw forbidden('Tài khoản không tồn tại');

  const permsByRole = new Map<string, Set<string>>();
  for (const row of conn
    .prepare(
      `SELECT r.key AS role_key, p.key AS perm_key FROM role_permissions rp
         JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id`,
    )
    .all() as any[]) {
    if (!permsByRole.has(row.role_key)) permsByRole.set(row.role_key, new Set());
    permsByRole.get(row.role_key)!.add(row.perm_key);
  }

  const grants: Grant[] = (conn
    .prepare(
      `SELECT ur.id, ur.branch_id, r.key AS role_key, r.name_vi AS role_name, b.name AS branch_name
         FROM user_roles ur JOIN roles r ON r.id = ur.role_id
         LEFT JOIN branches b ON b.id = ur.branch_id
        WHERE ur.user_id = ? AND ur.status = 'active' ORDER BY ur.id`,
    )
    .all(userId) as any[]).map((g) => ({
      id: g.id,
      roleKey: g.role_key,
      roleName: g.role_name,
      branchId: g.branch_id,
      branchName: g.branch_name,
      permissions: permsByRole.get(g.role_key) ?? new Set<string>(),
    }));

  /*
   * QUYỀN CẤP RIÊNG CHO CÁ NHÂN (mục 7.3) — thêm vào dưới dạng một GRANT nữa.
   *
   * Ví dụ owner đưa ra: một Quản lý CN Monbay được cấp thêm quyền quan sát toàn hệ thống.
   * Đưa chúng vào cùng danh sách `grants` chứ không thành một đường kiểm tra thứ hai: mọi
   * chỗ hỏi quyền đã đi qua `grants`, nên thêm một đường song song là chắc chắn có chỗ quên
   * kiểm — và chỗ quên kiểm ở một hệ thống phân quyền thì không ai phát hiện ra cho tới lúc
   * ai đó nhìn thấy thứ họ không được nhìn.
   */
  for (const row of conn
    .prepare(
      `SELECT up.branch_id, p.key AS perm_key, b.name AS branch_name
         FROM user_permissions up
         JOIN permissions p ON p.id = up.permission_id
         LEFT JOIN branches b ON b.id = up.branch_id
        WHERE up.user_id = ?`,
    )
    .all(userId) as any[]) {
    grants.push({
      id: -1,
      roleKey: 'granted',
      roleName: 'Quyền cấp riêng',
      branchId: row.branch_id,
      branchName: row.branch_name,
      permissions: new Set<string>([row.perm_key]),
    });
  }

  const assignments: Assignment[] = (conn
    .prepare(
      `SELECT id, class_id, skill, is_core, effective_from, effective_to
         FROM teacher_assignments WHERE user_id = ? AND status = 'active'`,
    )
    .all(userId) as any[]).map((a) => ({
      id: a.id,
      classId: a.class_id,
      skill: a.skill,
      isCore: a.is_core === 1,
      effectiveFrom: a.effective_from,
      effectiveTo: a.effective_to,
    }));

  return {
    userId: user.id,
    code: user.code,
    fullName: user.full_name,
    title: user.title,
    grants,
    /* `granted` không phải một vai trò — nó chỉ là chỗ chứa quyền cấp riêng. */
    roleKeys: [...new Set(grants.map((g) => g.roleKey).filter((k) => k !== 'granted'))],
    assignments,
  };
}

const activeAt = (a: Assignment, date: string) =>
  a.effectiveFrom <= date && (!a.effectiveTo || a.effectiveTo >= date);

function branchOfClass(classId: number): number | null {
  const r = db().prepare('SELECT branch_id FROM classes WHERE id = ?').get(classId) as any;
  return r?.branch_id ?? null;
}

function branchesOfStudent(studentId: number): number[] {
  const rows = db()
    .prepare(
      `SELECT DISTINCT c.branch_id AS b FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = ?
       UNION SELECT branch_id AS b FROM students WHERE id = ? AND branch_id IS NOT NULL`,
    )
    .all(studentId, studentId) as any[];
  return rows.map((r) => r.b).filter((b) => b != null);
}

function classesOfStudent(studentId: number): number[] {
  return (db().prepare('SELECT DISTINCT class_id FROM enrollments WHERE student_id = ?').all(studentId) as any[])
    .map((r) => r.class_id);
}

/** Chi nhánh mà ngữ cảnh đang nói tới. */
function ctxBranches(ctx: Ctx): number[] {
  const set = new Set<number>();
  if (ctx.branchId) set.add(ctx.branchId);
  if (ctx.classId) { const b = branchOfClass(ctx.classId); if (b) set.add(b); }
  if (ctx.studentId) for (const b of branchesOfStudent(ctx.studentId)) set.add(b);
  return [...set];
}

/** Giáo viên có được phân công đúng lớp (và đúng kỹ năng nếu ngữ cảnh nêu kỹ năng) không? */
export function hasAssignment(p: Principal, ctx: Ctx, need: 'any' | 'skill' | 'core'): boolean {
  const date = ctx.date ?? demoToday();
  const classIds = ctx.classId ? [ctx.classId] : ctx.studentId ? classesOfStudent(ctx.studentId) : [];
  if (!classIds.length) return false;
  const mine = p.assignments.filter((a) => activeAt(a, date) && classIds.includes(a.classId));
  if (!mine.length) return false;
  if (need === 'core') return mine.some((a) => a.isCore);
  if (need === 'skill') return ctx.skill ? mine.some((a) => a.skill === ctx.skill) : false;
  return true;
}

/** Grant này có phủ ngữ cảnh không? Grant toàn hệ thống phủ mọi thứ. */
function grantCovers(g: Grant, ctx: Ctx): boolean {
  if (g.branchId === null) return true;
  const branches = ctxBranches(ctx);
  if (!branches.length) return ctx.anyScope === true;
  return branches.every((b) => b === g.branchId);
}

/**
 * Ràng buộc thêm cho vai trò Giáo viên. Giáo viên không có quyền nào về lịch, và GVCN
 * không vì chủ nhiệm mà có quyền sửa mọi kỹ năng.
 */
function teacherAllows(p: Principal, permission: string, ctx: Ctx): boolean {
  switch (permission) {
    // Nhập điểm: phải đúng kỹ năng được phân công ở đúng lớp.
    case PERMISSIONS.SCORE_EDIT:
    case PERMISSIONS.ESTIMATE_EDIT:
      return hasAssignment(p, ctx, 'skill');

    // Xem: chỉ trong lớp được phân công, bất kỳ môn nào (xem KHÔNG cần đúng môn).
    case PERMISSIONS.ATTEMPT_VIEW:
    case PERMISSIONS.STUDENT_VIEW:
      return ctx.anyScope === true || hasAssignment(p, ctx, 'any');

    /*
     * BÁO VẤN ĐỀ MỚI (sổ §13.12: "GV trong lớp có thể báo vấn đề") — rộng, bất kỳ môn nào
     * trong lớp, khớp `ATTEMPT_VIEW`/`STUDENT_VIEW`. Đây KHÔNG phải AUTH-01 — báo được không
     * có nghĩa sửa/xử lý được, đó là `SOS_EDIT` ngay dưới.
     */
    case PERMISSIONS.SOS_REPORT:
      return ctx.anyScope === true || hasAssignment(p, ctx, 'any');

    /*
     * SỬA/XỬ LÝ MỘT CASE ĐÃ CÓ (AUTH-01) — tách khỏi cụm "xem", siết đúng phạm vi:
     *
     *   Học thuật (ctx.skill có giá trị)  → đúng kỹ năng mình dạy (`hasAssignment(..., 'skill')`)
     *   Ý thức (ctx.skill rỗng)           → chỉ GVCN (`hasAssignment(..., 'core')`)
     *
     * GVCN luôn qua được ở cả hai nhánh (dạy kỹ năng nào cũng là GVCN của lớp), nên viết một
     * điều kiện OR duy nhất là đủ, không cần biết trước đang ở nhánh nào. `hasAssignment`
     * với `need='skill'` đã tự trả `false` khi `ctx.skill` rỗng — nên thiếu truyền `ctx.skill`
     * ở nơi gọi là KHOÁ HẾT chứ không phải MỞ HẾT; nơi gọi phải truyền đúng.
     */
    case PERMISSIONS.SOS_EDIT:
      return ctx.anyScope === true || hasAssignment(p, ctx, 'core') || hasAssignment(p, ctx, 'skill');

    /*
     * SỬA HỒ SƠ HỌC VIÊN: CHỈ GVCN, và chỉ học viên của chính lớp mình chủ nhiệm.
     *
     * Trước PR15 việc này thuộc Admin chi nhánh. Vai đó đã bỏ, và người thật sự nắm tình
     * hình từng em là giáo viên chủ nhiệm, nên quyền về tay họ. GVBM thì KHÔNG: dạy một kỹ
     * năng không cho ai căn cứ để sửa target, đầu vào hay kế hoạch thi của học viên.
     *
     * Đây cũng không phải cửa sau để nhập điểm hay chốt lịch MT — hai quyền đó vẫn đứng
     * riêng và vẫn theo phân công kỹ năng / vai Quản lý như cũ.
     */
    case PERMISSIONS.STUDENT_EDIT:
      return ctx.anyScope === true || hasAssignment(p, ctx, 'core');

    default:
      return true;
  }
}

export function can(p: Principal, permission: string, ctx: Ctx = {}): boolean {
  for (const g of p.grants) {
    if (!g.permissions.has(permission)) continue;
    if (!grantCovers(g, ctx)) continue;
    if (g.roleKey === 'teacher' && !teacherAllows(p, permission, ctx)) continue;
    return true;
  }
  return false;
}

export function require_(p: Principal, permission: string, ctx: Ctx = {}, message?: string) {
  if (!can(p, permission, ctx)) {
    throw forbidden(message ?? 'Bạn không có quyền thực hiện thao tác này.', {
      hint: explain(p, permission, ctx),
    });
  }
}

export function explain(p: Principal, permission: string, ctx: Ctx): string {
  const holders = p.grants.filter((g) => g.permissions.has(permission));
  if (!holders.length) {
    if (permission === PERMISSIONS.PLAN_WEEK) return 'Chỉ Quản lý mới chốt được tuần MT.';
    return 'Vai trò hiện tại của bạn không có chức năng này.';
  }
  if (holders.every((g) => g.roleKey === 'teacher')) {
    if (permission === PERMISSIONS.SCORE_EDIT) return 'Bạn chỉ nhập được điểm của kỹ năng mình được phân công.';
    if (permission === PERMISSIONS.ESTIMATE_EDIT) return 'Bạn chỉ ước lượng được kỹ năng mình được phân công.';
    if (permission === PERMISSIONS.SOS_EDIT) {
      return 'Bạn chỉ sửa/xử lý được case đúng kỹ năng mình dạy — case Ý thức thì chỉ GVCN.';
    }
    return 'Bạn chỉ thao tác được trong lớp mình được phân công.';
  }
  return 'Đối tượng này nằm ngoài chi nhánh bạn được cấp quyền.';
}

// ---------------------------------------------------------------- phạm vi cho danh sách

export type Scope = { all: boolean; branchIds: number[]; classIds: number[]; none: boolean };

/** Tập chi nhánh/lớp người dùng được xem với một permission. */
export function scopeFor(p: Principal, permission: string, date = demoToday()): Scope {
  const branchIds = new Set<number>();
  const classIds = new Set<number>();
  let all = false;
  let found = false;

  for (const g of p.grants) {
    if (!g.permissions.has(permission)) continue;
    found = true;
    if (g.roleKey === 'teacher') {
      for (const a of p.assignments) if (activeAt(a, date)) classIds.add(a.classId);
      continue;
    }
    if (g.branchId === null) all = true;
    else branchIds.add(g.branchId);
  }
  return {
    all,
    branchIds: [...branchIds],
    classIds: [...classIds],
    none: !found || (!all && !branchIds.size && !classIds.size),
  };
}

/** Mảnh SQL lọc theo phạm vi, dùng alias lớp `c`. */
export function classScopeSql(scope: Scope, alias = 'c'): { sql: string; params: unknown[] } {
  if (scope.all) return { sql: '1=1', params: [] };
  const parts: string[] = [];
  const params: unknown[] = [];
  if (scope.branchIds.length) {
    parts.push(`${alias}.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`);
    params.push(...scope.branchIds);
  }
  if (scope.classIds.length) {
    parts.push(`${alias}.id IN (${scope.classIds.map(() => '?').join(',')})`);
    params.push(...scope.classIds);
  }
  return parts.length ? { sql: '(' + parts.join(' OR ') + ')', params } : { sql: '1=0', params: [] };
}

/**
 * Các kỹ năng người dùng được nhập điểm ở một lớp.
 * Gồm cả đường nhập bù (`score.override`) để văn phòng còn sửa được khi GVBM vắng — xem O05.
 */
export function editableSkills(p: Principal, classId: number, skills: readonly string[]): string[] {
  return skills.filter(
    (skill) => can(p, PERMISSIONS.SCORE_EDIT, { classId, skill }) || can(p, PERMISSIONS.SCORE_OVERRIDE, { classId }),
  );
}

/**
 * KỸ NĂNG LÀ VIỆC CỦA CHÍNH NGƯỜI NÀY — chỉ đường PHÂN CÔNG, không tính đường sửa hộ.
 *
 * Khác `editableSkills` ở đúng một chỗ, và chỗ đó là cả vấn đề (mục 3.3):
 *
 *   ĐƯỢC PHÉP SỬA  Quản trị hệ thống và Quản lý có quyền sửa điểm mọi kỹ năng để gỡ sự cố.
 *   LÀ VIỆC CỦA TÔI  chỉ kỹ năng người đó được PHÂN CÔNG dạy ở chính lớp đó.
 *
 * Trộn hai thứ này lại thì mở màn Tổng quan lên, Quản trị hệ thống thấy mình đang nợ điểm
 * của cả trung tâm — kể cả những lớp chưa phân công ai. Một danh sách việc như thế không ai
 * đọc, và lớp thật sự thiếu giáo viên thì chìm nghỉm trong đó. Lớp thiếu người đã có nhãn
 * "Thiếu GV ..." riêng ở danh sách lớp; đó mới là việc cần làm, và nó là việc PHÂN CÔNG.
 */
export function mySkills(p: Principal, classId: number, skills: readonly string[]): string[] {
  return skills.filter((skill) => can(p, PERMISSIONS.SCORE_EDIT, { classId, skill }));
}

/**
 * PHẠM VI MỞ RA MẶC ĐỊNH. Ai có dạy thì thấy việc của mình trước — người vừa dạy vừa quản
 * vẫn mở ở "việc của tôi", vì việc của mình mới là thứ không ai làm thay được.
 */
export function defaultWorkScope(p: Principal): WorkScope {
  const today = demoToday();
  return p.assignments.some((a) => activeAt(a, today)) ? 'mine' : 'managed';
}

/** Người dùng đang sửa điểm bằng đường nào — dùng để ghi nhật ký cho đúng. */
export function scoreEditPath(p: Principal, classId: number, skill: string): 'assigned' | 'override' | null {
  if (can(p, PERMISSIONS.SCORE_EDIT, { classId, skill })) return 'assigned';
  if (can(p, PERMISSIONS.SCORE_OVERRIDE, { classId })) return 'override';
  return null;
}

export function isCoreTeacherOf(p: Principal, classId: number, date = demoToday()): boolean {
  return p.assignments.some((a) => a.classId === classId && a.isCore && activeAt(a, date));
}

/**
 * Người này CÓ DẠY lớp đó không — chủ nhiệm hay bộ môn đều tính.
 *
 * Khác hẳn "có quyền ghi nhận xử lý": Admin chi nhánh ghi hộ được việc CS gọi phụ huynh,
 * nhưng không phải người quyết phương án học thuật cho một em. Màn việc dùng đúng cái này
 * để không giao cho văn phòng một việc chuyên môn mà họ không có căn cứ để làm.
 */
export function teachesClass(p: Principal, classId: number | null, date = demoToday()): boolean {
  if (!classId) return false;
  return p.assignments.some((a) => a.classId === classId && activeAt(a, date));
}

export function permissionSummary(p: Principal) {
  return p.grants.map((g) => ({
    id: g.id,
    role: g.roleKey,
    roleName: g.roleName,
    branchId: g.branchId,
    branchName: g.branchName,
    permissions: [...g.permissions].sort(),
  }));
}
