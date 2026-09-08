import { db } from './db.ts';
import { PERMISSIONS } from '../../shared/domain.ts';
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
    roleKeys: [...new Set(grants.map((g) => g.roleKey))],
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

export function can(p: Principal, permission: string, ctx: Ctx = {}): boolean {
  for (const g of p.grants) {
    if (!g.permissions.has(permission)) continue;
    if (!grantCovers(g, ctx)) continue;

    // Giáo viên bị giới hạn thêm bởi phân công lớp/kỹ năng.
    if (g.roleKey === 'teacher') {
      if (permission === PERMISSIONS.SCORE_EDIT) {
        if (!hasAssignment(p, ctx, 'skill')) continue;
      } else if (permission === PERMISSIONS.MOCK_SCHEDULE) {
        if (!hasAssignment(p, ctx, 'core')) continue;      // chỉ GVCN được dời lịch
      } else if (
        permission === PERMISSIONS.MOCK_VIEW ||
        permission === PERMISSIONS.STUDENT_VIEW ||
        permission === PERMISSIONS.SOS_EDIT
      ) {
        if (ctx.anyScope !== true && !hasAssignment(p, ctx, 'any')) continue;
      }
    }
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
  if (!holders.length) return 'Vai trò hiện tại của bạn không có chức năng này.';
  if (holders.every((g) => g.roleKey === 'teacher')) {
    if (permission === PERMISSIONS.SCORE_EDIT) return 'Bạn chỉ nhập được điểm của kỹ năng mình được phân công.';
    if (permission === PERMISSIONS.MOCK_SCHEDULE) return 'Chỉ giáo viên chủ nhiệm của lớp mới dời được lịch Mock.';
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

/** Các kỹ năng người dùng được nhập điểm ở một lớp. */
export function editableSkills(p: Principal, classId: number, skills: readonly string[]): string[] {
  return skills.filter((skill) => can(p, PERMISSIONS.SCORE_EDIT, { classId, skill }));
}

export function isCoreTeacherOf(p: Principal, classId: number, date = demoToday()): boolean {
  return p.assignments.some((a) => a.classId === classId && a.isCore && activeAt(a, date));
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
