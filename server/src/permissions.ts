import { db } from './db.ts';
import { PERMISSIONS } from '../../shared/domain.ts';
import { demoToday } from './demoConfig.ts';
import { forbidden } from './util.ts';

/**
 * Mô hình quyền: Permission + Scope + Assignment.
 *
 * Nguyên tắc bất biến: quyền được xét theo TỪNG GRANT.
 * Một grant chỉ mở các permission của role trong grant đó, và chỉ trong scope của
 * chính grant đó. Không bao giờ lấy permission của role này ghép scope của role khác.
 */

export type ScopeType =
  | 'global' | 'branch' | 'reporting_unit'
  | 'assignment' | 'consultant_caseload' | 'consultant_team';

export type Grant = {
  id: number;
  role_key: string;
  role_name: string;
  scope_type: ScopeType;
  scope_id: number | null;
  scope_label: string | null;
  permissions: Set<string>;
};

export type TeacherAssignment = {
  id: number;
  class_id: number;
  skill: string | null;
  is_core: number;
  effective_from: string;
  effective_to: string | null;
  status: string;
};

export type Principal = {
  userId: number;
  code: string;
  fullName: string;
  email: string | null;
  title: string | null;
  grants: Grant[];
  roleKeys: string[];
  teacherAssignments: TeacherAssignment[];
  consultantStudentIds: Set<number>;
  teamConsultantIds: number[];
  teamStudentIds: Set<number>;
};

export type PermissionContext = {
  branchId?: number | null;
  reportingUnitId?: number | null;
  classId?: number | null;
  studentId?: number | null;
  skill?: string | null;
  date?: string;
  /**
   * Kiểm tra ở mức "có được vào màn hình này không", khi bản thân đối tượng không
   * thuộc riêng một chi nhánh (ví dụ kỳ họp toàn hệ thống). Nội dung bên trong VẪN
   * phải được lọc lại theo viewScope — cờ này không nới quyền đọc dữ liệu.
   */
  scopeLevel?: boolean;
};

/** Với scope 'assignment', mỗi permission cần loại phân công nào. */
const ASSIGNMENT_REQUIREMENT: Record<string, 'any' | 'skill' | 'core'> = {
  [PERMISSIONS.ACADEMIC_VIEW]: 'any',
  [PERMISSIONS.NOTE_INTERNAL_VIEW]: 'any',
  [PERMISSIONS.WEEKLY_EDIT]: 'skill',
  [PERMISSIONS.ESTIMATE_EDIT]: 'skill',
  [PERMISSIONS.SUMMARY_EDIT]: 'core',
  [PERMISSIONS.ISSUE_VIEW]: 'any',
  [PERMISSIONS.TASK_VIEW]: 'any',
  [PERMISSIONS.TASK_UPDATE_ASSIGNED]: 'any',
};

function assignmentActive(a: TeacherAssignment, date: string): boolean {
  if (a.status !== 'active') return false;
  if (a.effective_from > date) return false;
  if (a.effective_to && a.effective_to < date) return false;
  return true;
}

export function loadPrincipal(userId: number): Principal {
  const conn = db();
  const user = conn.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) throw forbidden('Tài khoản không tồn tại');

  const grantRows = conn
    .prepare(
      `SELECT g.id, g.scope_type, g.scope_id, g.label, r.key AS role_key, r.name_vi AS role_name
         FROM user_role_grants g JOIN roles r ON r.id = g.role_id
        WHERE g.user_id = ? AND g.status = 'active'
        ORDER BY g.id`,
    )
    .all(userId) as any[];

  const permsByRole = new Map<string, Set<string>>();
  for (const row of conn
    .prepare(
      `SELECT r.key AS role_key, p.key AS perm_key
         FROM role_permissions rp
         JOIN roles r ON r.id = rp.role_id
         JOIN permissions p ON p.id = rp.permission_id`,
    )
    .all() as any[]) {
    if (!permsByRole.has(row.role_key)) permsByRole.set(row.role_key, new Set());
    permsByRole.get(row.role_key)!.add(row.perm_key);
  }

  const grants: Grant[] = grantRows.map((g) => ({
    id: g.id,
    role_key: g.role_key,
    role_name: g.role_name,
    scope_type: g.scope_type,
    scope_id: g.scope_id,
    scope_label: g.label,
    permissions: permsByRole.get(g.role_key) ?? new Set<string>(),
  }));

  const teacherAssignments = conn
    .prepare(
      `SELECT id, class_id, skill, is_core, effective_from, effective_to, status
         FROM teacher_assignments WHERE user_id = ?`,
    )
    .all(userId) as TeacherAssignment[];

  const today = demoToday();
  const consultantStudentIds = new Set<number>(
    (conn
      .prepare(
        `SELECT student_id FROM consultant_assignments
          WHERE user_id = ? AND status = 'active'
            AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`,
      )
      .all(userId, today, today) as any[]).map((r) => r.student_id),
  );

  const teamConsultantIds = (conn
    .prepare(
      `SELECT consultant_user_id FROM consultant_team_members
        WHERE manager_user_id = ? AND status = 'active'`,
    )
    .all(userId) as any[]).map((r) => r.consultant_user_id);

  const teamStudentIds = new Set<number>();
  if (teamConsultantIds.length) {
    const ph = teamConsultantIds.map(() => '?').join(',');
    for (const r of conn
      .prepare(
        `SELECT DISTINCT student_id FROM consultant_assignments
          WHERE user_id IN (${ph}) AND status = 'active'
            AND effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?)`,
      )
      .all(...teamConsultantIds, today, today) as any[]) {
      teamStudentIds.add(r.student_id);
    }
  }

  return {
    userId: user.id,
    code: user.code,
    fullName: user.full_name,
    email: user.email,
    title: user.title,
    grants,
    roleKeys: [...new Set(grants.map((g) => g.role_key))],
    teacherAssignments,
    consultantStudentIds,
    teamConsultantIds,
    teamStudentIds,
  };
}

// ---------- tra cứu ngữ cảnh ----------

function classInfo(classId: number) {
  return db()
    .prepare(
      `SELECT c.id, c.branch_id, ru.id AS reporting_unit_id
         FROM classes c
         LEFT JOIN reporting_units ru ON ru.branch_id = c.branch_id AND ru.kind = 'branch'
        WHERE c.id = ?`,
    )
    .get(classId) as { id: number; branch_id: number; reporting_unit_id: number | null } | undefined;
}

function studentBranchIds(studentId: number): number[] {
  const rows = db()
    .prepare(
      `SELECT DISTINCT c.branch_id AS b FROM enrollments e
         JOIN classes c ON c.id = e.class_id WHERE e.student_id = ?
       UNION SELECT branch_id AS b FROM students WHERE id = ? AND branch_id IS NOT NULL`,
    )
    .all(studentId, studentId) as any[];
  return rows.map((r) => r.b).filter((b) => b != null);
}

function studentClassIds(studentId: number): number[] {
  return (db().prepare('SELECT DISTINCT class_id FROM enrollments WHERE student_id = ?').all(studentId) as any[])
    .map((r) => r.class_id);
}

/** Bổ sung branch/unit suy ra từ class hoặc student vào ngữ cảnh. */
function resolveContext(ctx: PermissionContext) {
  const branchIds = new Set<number>();
  const unitIds = new Set<number>();
  const classIds = new Set<number>();
  if (ctx.branchId) branchIds.add(ctx.branchId);
  if (ctx.reportingUnitId) unitIds.add(ctx.reportingUnitId);
  if (ctx.classId) {
    classIds.add(ctx.classId);
    const ci = classInfo(ctx.classId);
    if (ci) {
      branchIds.add(ci.branch_id);
      if (ci.reporting_unit_id) unitIds.add(ci.reporting_unit_id);
    }
  }
  if (ctx.studentId) {
    for (const b of studentBranchIds(ctx.studentId)) branchIds.add(b);
    for (const c of studentClassIds(ctx.studentId)) classIds.add(c);
  }
  if (ctx.branchId) {
    const u = db()
      .prepare("SELECT id FROM reporting_units WHERE branch_id = ? AND kind = 'branch'")
      .get(ctx.branchId) as any;
    if (u) unitIds.add(u.id);
  }
  if (ctx.reportingUnitId) {
    const u = db().prepare('SELECT branch_id FROM reporting_units WHERE id = ?').get(ctx.reportingUnitId) as any;
    if (u?.branch_id) branchIds.add(u.branch_id);
  }
  return { branchIds, unitIds, classIds };
}

/** Grant này có mở `permission` trong ngữ cảnh `ctx` không? */
function grantAllows(
  p: Principal,
  grant: Grant,
  permission: string,
  ctx: PermissionContext,
  resolved: ReturnType<typeof resolveContext>,
): boolean {
  if (!grant.permissions.has(permission)) return false;
  const date = ctx.date ?? demoToday();

  switch (grant.scope_type) {
    case 'global':
      return true;

    case 'branch': {
      if (!grant.scope_id) return false;
      if (resolved.branchIds.size === 0) return ctx.scopeLevel === true;
      // Ngữ cảnh phải nằm hoàn toàn trong chi nhánh được cấp.
      return [...resolved.branchIds].every((b) => b === grant.scope_id);
    }

    case 'reporting_unit': {
      if (!grant.scope_id) return false;
      if (resolved.unitIds.size === 0) return ctx.scopeLevel === true;
      return [...resolved.unitIds].some((u) => u === grant.scope_id);
    }

    case 'assignment': {
      const need = ASSIGNMENT_REQUIREMENT[permission];
      if (!need) return false;
      const targetClasses = ctx.classId
        ? [ctx.classId]
        : ctx.studentId
          ? studentClassIds(ctx.studentId)
          : [];
      if (targetClasses.length === 0) return false;
      const active = p.teacherAssignments.filter(
        (a) => assignmentActive(a, date) && targetClasses.includes(a.class_id),
      );
      if (active.length === 0) return false;
      if (need === 'core') return active.some((a) => a.is_core === 1);
      if (need === 'skill') {
        if (!ctx.skill) return false;
        return active.some((a) => a.skill === ctx.skill);
      }
      return true;
    }

    case 'consultant_caseload': {
      if (!ctx.studentId) return false;
      return p.consultantStudentIds.has(ctx.studentId);
    }

    case 'consultant_team': {
      if (!ctx.studentId) return false;
      if (!p.teamStudentIds.has(ctx.studentId)) return false;
      if (grant.scope_id) {
        // Grant giới hạn thêm theo chi nhánh: giao của chính grant này, không mượn scope khác.
        return studentBranchIds(ctx.studentId).includes(grant.scope_id);
      }
      return true;
    }
  }
  return false;
}

export function can(p: Principal, permission: string, ctx: PermissionContext = {}): boolean {
  const resolved = resolveContext(ctx);
  return p.grants.some((g) => grantAllows(p, g, permission, ctx, resolved));
}

export function require_(p: Principal, permission: string, ctx: PermissionContext = {}, message?: string) {
  if (!can(p, permission, ctx)) {
    throw forbidden(message ?? 'Bạn không có quyền thực hiện thao tác này.', {
      permission,
      context: ctx,
      hint: explainDenial(p, permission, ctx),
    });
  }
}

/** Câu giải thích ngắn để hiển thị tại chỗ trong UI, không lộ mã permission. */
export function explainDenial(p: Principal, permission: string, ctx: PermissionContext): string {
  const holders = p.grants.filter((g) => g.permissions.has(permission));
  if (holders.length === 0) return 'Vai trò hiện tại của bạn không có chức năng này.';
  const scopes = holders.map((g) => g.scope_type);
  if (scopes.includes('assignment')) {
    const need = ASSIGNMENT_REQUIREMENT[permission];
    if (need === 'skill') return 'Bạn chỉ được sửa skill mình được phân công tại lớp này.';
    if (need === 'core') return 'Thao tác này dành cho giáo viên chủ nhiệm (GVCN) của lớp.';
    return 'Bạn chỉ thao tác được trong lớp mình được phân công.';
  }
  if (scopes.includes('branch') || scopes.includes('reporting_unit'))
    return 'Đối tượng này nằm ngoài chi nhánh/đơn vị bạn được cấp quyền.';
  if (scopes.includes('consultant_caseload') || scopes.includes('consultant_team'))
    return 'Bạn chỉ xem được học viên mình phụ trách và không sửa dữ liệu học vụ.';
  return 'Ngoài phạm vi được cấp quyền.';
}

// ---------- scope cho truy vấn danh sách ----------

export type ViewScope = {
  all: boolean;
  branchIds: number[];
  unitIds: number[];
  classIds: number[];
  studentIds: number[];
  /** true nếu mọi grant đều là kiểu chỉ-xem-việc-của-mình (assignment/caseload). */
  selfOnly: boolean;
  none: boolean;
};

/** Tập đối tượng người dùng được XEM với một permission, để dựng WHERE cho list. */
export function viewScope(p: Principal, permission: string, date = demoToday()): ViewScope {
  const scope: ViewScope = {
    all: false, branchIds: [], unitIds: [], classIds: [], studentIds: [], selfOnly: true, none: false,
  };
  const branchIds = new Set<number>();
  const unitIds = new Set<number>();
  const classIds = new Set<number>();
  const studentIds = new Set<number>();
  let found = false;

  for (const g of p.grants) {
    if (!g.permissions.has(permission)) continue;
    found = true;
    switch (g.scope_type) {
      case 'global':
        scope.all = true;
        scope.selfOnly = false;
        break;
      case 'branch':
        if (g.scope_id) branchIds.add(g.scope_id);
        scope.selfOnly = false;
        break;
      case 'reporting_unit':
        if (g.scope_id) unitIds.add(g.scope_id);
        scope.selfOnly = false;
        break;
      case 'assignment':
        for (const a of p.teacherAssignments) {
          if (assignmentActive(a, date)) classIds.add(a.class_id);
        }
        break;
      case 'consultant_caseload':
        for (const s of p.consultantStudentIds) studentIds.add(s);
        break;
      case 'consultant_team':
        for (const s of p.teamStudentIds) {
          if (!g.scope_id || studentBranchIds(s).includes(g.scope_id)) studentIds.add(s);
        }
        break;
    }
  }

  // Đơn vị báo cáo dạng chi nhánh: mở kèm chi nhánh tương ứng.
  for (const u of unitIds) {
    const row = db().prepare('SELECT branch_id FROM reporting_units WHERE id = ?').get(u) as any;
    if (row?.branch_id) branchIds.add(row.branch_id);
  }
  for (const b of branchIds) {
    const row = db().prepare("SELECT id FROM reporting_units WHERE branch_id = ? AND kind='branch'").get(b) as any;
    if (row) unitIds.add(row.id);
  }

  scope.branchIds = [...branchIds];
  scope.unitIds = [...unitIds];
  scope.classIds = [...classIds];
  scope.studentIds = [...studentIds];
  scope.none = !found || (!scope.all && !scope.branchIds.length && !scope.classIds.length && !scope.studentIds.length && !scope.unitIds.length);
  return scope;
}

/**
 * Mảnh SQL lọc học viên theo scope.
 * Yêu cầu truy vấn có alias `s` (students) và cho phép subquery trên enrollments.
 */
export function studentScopeSql(scope: ViewScope): { sql: string; params: unknown[] } {
  if (scope.all) return { sql: '1=1', params: [] };
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (scope.branchIds.length) {
    const ph = scope.branchIds.map(() => '?').join(',');
    clauses.push(
      `EXISTS (SELECT 1 FROM enrollments e2 JOIN classes c2 ON c2.id = e2.class_id
                WHERE e2.student_id = s.id AND c2.branch_id IN (${ph}))`,
    );
    params.push(...scope.branchIds);
    clauses.push(`s.branch_id IN (${ph})`);
    params.push(...scope.branchIds);
  }
  if (scope.classIds.length) {
    const ph = scope.classIds.map(() => '?').join(',');
    clauses.push(
      `EXISTS (SELECT 1 FROM enrollments e3 WHERE e3.student_id = s.id AND e3.class_id IN (${ph}))`,
    );
    params.push(...scope.classIds);
  }
  if (scope.studentIds.length) {
    const ph = scope.studentIds.map(() => '?').join(',');
    clauses.push(`s.id IN (${ph})`);
    params.push(...scope.studentIds);
  }
  if (!clauses.length) return { sql: '1=0', params: [] };
  return { sql: '(' + clauses.join(' OR ') + ')', params };
}

export function classScopeSql(scope: ViewScope, alias = 'c'): { sql: string; params: unknown[] } {
  if (scope.all) return { sql: '1=1', params: [] };
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (scope.branchIds.length) {
    clauses.push(`${alias}.branch_id IN (${scope.branchIds.map(() => '?').join(',')})`);
    params.push(...scope.branchIds);
  }
  if (scope.classIds.length) {
    clauses.push(`${alias}.id IN (${scope.classIds.map(() => '?').join(',')})`);
    params.push(...scope.classIds);
  }
  if (scope.studentIds.length) {
    clauses.push(
      `EXISTS (SELECT 1 FROM enrollments e4 WHERE e4.class_id = ${alias}.id AND e4.student_id IN (${scope.studentIds
        .map(() => '?')
        .join(',')}))`,
    );
    params.push(...scope.studentIds);
  }
  if (!clauses.length) return { sql: '1=0', params: [] };
  return { sql: '(' + clauses.join(' OR ') + ')', params };
}

/** Các skill người dùng được sửa tại một lớp (rỗng nếu không được sửa gì). */
export function editableSkills(p: Principal, classId: number, allSkills: readonly string[]): string[] {
  return allSkills.filter((skill) => can(p, PERMISSIONS.WEEKLY_EDIT, { classId, skill }));
}

export function isCoreTeacherOf(p: Principal, classId: number, date = demoToday()): boolean {
  return p.teacherAssignments.some(
    (a) => a.class_id === classId && a.is_core === 1 && assignmentActive(a, date),
  );
}

/** Danh sách permission + scope để hiển thị trong UI (không dùng để quyết định quyền ở backend). */
export function permissionSummary(p: Principal) {
  return p.grants.map((g) => ({
    id: g.id,
    role: g.role_key,
    roleName: g.role_name,
    scopeType: g.scope_type,
    scopeId: g.scope_id,
    scopeLabel: g.scope_label,
    permissions: [...g.permissions].sort(),
  }));
}
