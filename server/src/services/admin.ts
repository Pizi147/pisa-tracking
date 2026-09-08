import { db, tx } from '../db.ts';
import { PERMISSIONS, TEACHING_SKILLS } from '../../../shared/domain.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from './audit.ts';
import { setConfig } from '../demoConfig.ts';

export function listBranches(includeArchived = false) {
  return db()
    .prepare(`SELECT * FROM branches ${includeArchived ? '' : "WHERE status != 'archived'"} ORDER BY name`)
    .all() as any[];
}

export function listReportingUnits() {
  return db()
    .prepare(
      `SELECT ru.*, b.name AS branch_name FROM reporting_units ru
         LEFT JOIN branches b ON b.id = ru.branch_id WHERE ru.status != 'archived' ORDER BY ru.kind, ru.name`,
    )
    .all() as any[];
}

export function listClassTypes() {
  return db().prepare("SELECT * FROM class_types WHERE status != 'archived' ORDER BY category, code").all() as any[];
}

export function upsertBranch(p: Principal, input: any) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, {}, 'Chỉ quản trị viên mới sửa được danh mục chi nhánh.');
  return tx(() => {
    const conn = db();
    if (input.id) {
      const before = conn.prepare('SELECT * FROM branches WHERE id = ?').get(input.id);
      conn.prepare('UPDATE branches SET name = ?, address = ?, status = ? WHERE id = ?')
        .run(input.name, input.address ?? null, input.status ?? 'active', input.id);
      const after = conn.prepare('SELECT * FROM branches WHERE id = ?').get(input.id);
      writeAudit({ actorUserId: p.userId, action: 'branch.update', entityType: 'branch', entityId: input.id, entityLabel: input.name, before, after });
      return after;
    }
    if (!input.code || !input.name) throw badRequest('Cần mã và tên chi nhánh.');
    const info = conn.prepare('INSERT INTO branches (code, name, address, status, created_at) VALUES (?,?,?,?,?)')
      .run(input.code, input.name, input.address ?? null, 'active', nowIso());
    const id = Number(info.lastInsertRowid);
    conn.prepare("INSERT INTO reporting_units (code, name, branch_id, kind, status, created_at) VALUES (?,?,?, 'branch', 'active', ?)")
      .run(input.code, input.name, id, nowIso());
    writeAudit({ actorUserId: p.userId, action: 'branch.create', entityType: 'branch', entityId: id, entityLabel: input.name, after: input });
    return conn.prepare('SELECT * FROM branches WHERE id = ?').get(id);
  });
}

export function archiveEntity(p: Principal, table: 'branches' | 'classes' | 'class_types' | 'course_templates' | 'users' | 'students', id: number) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, {}, 'Chỉ quản trị viên mới lưu trữ được dữ liệu này.');
  const before = db().prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!before) throw notFound();
  db().prepare(`UPDATE ${table} SET status = 'archived', archived_at = ? WHERE id = ?`).run(nowIso(), id);
  writeAudit({ actorUserId: p.userId, action: `${table}.archive`, entityType: table, entityId: id, before, after: { status: 'archived' } });
}

// ---------- Template & versioning ----------

export function listTemplates() {
  const conn = db();
  const templates = conn.prepare("SELECT * FROM course_templates WHERE status != 'archived' ORDER BY category, name").all() as any[];
  return templates.map((t) => ({
    ...t,
    versions: (conn
      .prepare('SELECT * FROM course_template_versions WHERE template_id = ? ORDER BY version_no DESC')
      .all(t.id) as any[]).map((v) => ({
        ...v,
        stageCount: (conn.prepare('SELECT COUNT(*) AS n FROM template_stages WHERE template_version_id = ?').get(v.id) as any).n,
        classCount: (conn.prepare('SELECT COUNT(*) AS n FROM classes WHERE template_version_id = ?').get(v.id) as any).n,
      })),
  }));
}

export function getTemplateVersion(versionId: number) {
  const conn = db();
  const v = conn
    .prepare(
      `SELECT tv.*, t.name AS template_name, t.category, t.code AS template_code FROM course_template_versions tv
         JOIN course_templates t ON t.id = tv.template_id WHERE tv.id = ?`,
    )
    .get(versionId) as any;
  if (!v) throw notFound('Không tìm thấy phiên bản chương trình');
  return {
    ...v,
    stages: conn.prepare('SELECT * FROM template_stages WHERE template_version_id = ? ORDER BY seq').all(versionId) as any[],
    classes: conn.prepare('SELECT id, code, name FROM classes WHERE template_version_id = ?').all(versionId) as any[],
  };
}

/**
 * Sửa template = tạo version MỚI (bản cũ bất biến).
 * Lớp đang dùng version cũ giữ nguyên; version mới chỉ áp cho lớp được chọn về sau.
 */
export function createTemplateVersion(p: Principal, templateId: number, input: { basedOnVersionId?: number; notes?: string; stages?: any[]; publish?: boolean }) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, {}, 'Chỉ quản trị viên mới tạo được phiên bản chương trình.');
  return tx(() => {
    const conn = db();
    const t = conn.prepare('SELECT * FROM course_templates WHERE id = ?').get(templateId) as any;
    if (!t) throw notFound('Không tìm thấy chương trình');
    const maxV = (conn.prepare('SELECT MAX(version_no) AS m FROM course_template_versions WHERE template_id = ?').get(templateId) as any)?.m ?? 0;
    const nextNo = maxV + 1;
    const info = conn
      .prepare(
        `INSERT INTO course_template_versions (template_id, version_no, status, notes, published_at, created_by, created_at)
         VALUES (?,?,?,?,?,?,?)`,
      )
      .run(templateId, nextNo, input.publish === false ? 'draft' : 'published', input.notes ?? null,
           input.publish === false ? null : nowIso(), p.userId, nowIso());
    const versionId = Number(info.lastInsertRowid);

    const stages = input.stages?.length
      ? input.stages
      : input.basedOnVersionId
        ? (conn.prepare('SELECT * FROM template_stages WHERE template_version_id = ? ORDER BY seq').all(input.basedOnVersionId) as any[]).map((s) => ({
            stageKey: s.stage_key, seq: s.seq, name: s.name, kind: s.kind,
            weekFrom: s.week_from, weekTo: s.week_to, dueOffsetDays: s.due_offset_days, description: s.description,
          }))
        : [];
    if (!stages.length) throw badRequest('Phiên bản cần ít nhất một giai đoạn/mốc.');

    for (const [i, s] of stages.entries()) {
      conn
        .prepare(
          `INSERT INTO template_stages (template_version_id, stage_key, seq, name, kind, week_from, week_to, due_offset_days, description)
           VALUES (?,?,?,?,?,?,?,?,?)`,
        )
        .run(versionId, s.stageKey ?? `stage-${i + 1}`, s.seq ?? i + 1, s.name, s.kind ?? 'stage',
             s.weekFrom ?? null, s.weekTo ?? null, s.dueOffsetDays ?? null, s.description ?? null);
    }
    writeAudit({
      actorUserId: p.userId, action: 'template_version.create', entityType: 'course_template_version',
      entityId: versionId, entityLabel: `${t.name} v${nextNo}`, after: { versionNo: nextNo, stages: stages.length },
    });
    return getTemplateVersion(versionId);
  });
}

export function assignTemplateVersionToClass(p: Principal, classId: number, versionId: number) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, {}, 'Chỉ quản trị viên mới đổi được phiên bản chương trình của lớp.');
  const conn = db();
  const before = conn.prepare('SELECT template_version_id FROM classes WHERE id = ?').get(classId);
  conn.prepare('UPDATE classes SET template_version_id = ? WHERE id = ?').run(versionId, classId);
  writeAudit({
    actorUserId: p.userId, action: 'class.template_version.assign', entityType: 'class', entityId: classId,
    before, after: { template_version_id: versionId },
  });
  return conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
}

// ---------- Users / roles / grants / assignments ----------

export function listUsers(p: Principal) {
  require_(p, PERMISSIONS.ADMIN_USERS, {}, 'Chỉ quản trị viên mới xem được danh sách người dùng.');
  const conn = db();
  const users = conn.prepare("SELECT * FROM users WHERE status != 'archived' ORDER BY full_name").all() as any[];
  return users.map((u) => ({
    ...u,
    grants: conn
      .prepare(
        `SELECT g.id, g.scope_type, g.scope_id, g.label, r.key AS role_key, r.name_vi AS role_name
           FROM user_role_grants g JOIN roles r ON r.id = g.role_id WHERE g.user_id = ? AND g.status = 'active'`,
      )
      .all(u.id),
    teacherAssignments: conn
      .prepare(
        `SELECT ta.*, c.code AS class_code FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
          WHERE ta.user_id = ? AND ta.status = 'active'`,
      )
      .all(u.id),
    consultantCount: (conn
      .prepare(`SELECT COUNT(*) AS n FROM consultant_assignments WHERE user_id = ? AND status = 'active'`)
      .get(u.id) as any).n,
  }));
}

export function listRolesAndPermissions() {
  const conn = db();
  const roles = conn.prepare('SELECT * FROM roles ORDER BY id').all() as any[];
  return {
    roles: roles.map((r) => ({
      ...r,
      permissions: (conn
        .prepare('SELECT p.key FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = ?')
        .all(r.id) as any[]).map((x) => x.key),
    })),
    permissions: conn.prepare('SELECT * FROM permissions ORDER BY group_key, key').all() as any[],
  };
}

export function upsertGrant(p: Principal, input: any) {
  require_(p, PERMISSIONS.ADMIN_USERS, {}, 'Chỉ quản trị viên mới phân quyền được.');
  return tx(() => {
    const conn = db();
    const role = conn.prepare('SELECT * FROM roles WHERE key = ?').get(input.roleKey) as any;
    if (!role) throw badRequest('Vai trò không tồn tại.');
    if (input.id) {
      const before = conn.prepare('SELECT * FROM user_role_grants WHERE id = ?').get(input.id);
      conn.prepare('UPDATE user_role_grants SET role_id = ?, scope_type = ?, scope_id = ?, label = ?, status = ? WHERE id = ?')
        .run(role.id, input.scopeType, input.scopeId ?? null, input.label ?? null, input.status ?? 'active', input.id);
      writeAudit({ actorUserId: p.userId, action: 'grant.update', entityType: 'user_role_grant', entityId: input.id, before, after: input });
      return conn.prepare('SELECT * FROM user_role_grants WHERE id = ?').get(input.id);
    }
    const info = conn
      .prepare(
        `INSERT INTO user_role_grants (user_id, role_id, scope_type, scope_id, label, status, created_at)
         VALUES (?,?,?,?,?, 'active', ?)`,
      )
      .run(input.userId, role.id, input.scopeType, input.scopeId ?? null, input.label ?? null, nowIso());
    const id = Number(info.lastInsertRowid);
    writeAudit({ actorUserId: p.userId, action: 'grant.create', entityType: 'user_role_grant', entityId: id, after: input });
    return conn.prepare('SELECT * FROM user_role_grants WHERE id = ?').get(id);
  });
}

export function removeGrant(p: Principal, grantId: number) {
  require_(p, PERMISSIONS.ADMIN_USERS, {});
  const before = db().prepare('SELECT * FROM user_role_grants WHERE id = ?').get(grantId);
  db().prepare("UPDATE user_role_grants SET status = 'archived' WHERE id = ?").run(grantId);
  writeAudit({ actorUserId: p.userId, action: 'grant.remove', entityType: 'user_role_grant', entityId: grantId, before, after: null });
}

export function upsertTeacherAssignment(p: Principal, input: any) {
  require_(p, PERMISSIONS.ADMIN_USERS, {}, 'Chỉ quản trị viên mới phân công giáo viên được.');
  if (input.skill && !TEACHING_SKILLS.includes(input.skill)) throw badRequest('Skill không hợp lệ.');
  if (!input.skill && !input.isCore) throw badRequest('Phân công phải có skill hoặc là chủ nhiệm (GVCN).');
  return tx(() => {
    const conn = db();
    if (input.id) {
      const before = conn.prepare('SELECT * FROM teacher_assignments WHERE id = ?').get(input.id);
      conn
        .prepare('UPDATE teacher_assignments SET skill = ?, is_core = ?, effective_from = ?, effective_to = ?, status = ? WHERE id = ?')
        .run(input.skill ?? null, input.isCore ? 1 : 0, input.effectiveFrom, input.effectiveTo ?? null, input.status ?? 'active', input.id);
      writeAudit({ actorUserId: p.userId, action: 'teacher_assignment.update', entityType: 'teacher_assignment', entityId: input.id, before, after: input });
      return conn.prepare('SELECT * FROM teacher_assignments WHERE id = ?').get(input.id);
    }
    const info = conn
      .prepare(
        `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, effective_to, status, note, created_at)
         VALUES (?,?,?,?,?,?, 'active', ?, ?)`,
      )
      .run(input.userId, input.classId, input.skill ?? null, input.isCore ? 1 : 0,
           input.effectiveFrom, input.effectiveTo ?? null, input.note ?? null, nowIso());
    const id = Number(info.lastInsertRowid);
    writeAudit({ actorUserId: p.userId, action: 'teacher_assignment.create', entityType: 'teacher_assignment', entityId: id, after: input });
    return conn.prepare('SELECT * FROM teacher_assignments WHERE id = ?').get(id);
  });
}

export function removeTeacherAssignment(p: Principal, id: number) {
  require_(p, PERMISSIONS.ADMIN_USERS, {});
  const before = db().prepare('SELECT * FROM teacher_assignments WHERE id = ?').get(id);
  db().prepare("UPDATE teacher_assignments SET status = 'archived' WHERE id = ?").run(id);
  writeAudit({ actorUserId: p.userId, action: 'teacher_assignment.remove', entityType: 'teacher_assignment', entityId: id, before, after: null });
}

export function upsertConsultantAssignment(p: Principal, input: any) {
  require_(p, PERMISSIONS.ADMIN_USERS, {});
  const info = db()
    .prepare(`INSERT INTO consultant_assignments (user_id, student_id, effective_from, status, created_at) VALUES (?,?,?, 'active', ?)`)
    .run(input.userId, input.studentId, input.effectiveFrom, nowIso());
  const id = Number(info.lastInsertRowid);
  writeAudit({ actorUserId: p.userId, action: 'consultant_assignment.create', entityType: 'consultant_assignment', entityId: id, studentId: input.studentId, after: input });
  return id;
}

export function removeConsultantAssignment(p: Principal, id: number) {
  require_(p, PERMISSIONS.ADMIN_USERS, {});
  const before = db().prepare('SELECT * FROM consultant_assignments WHERE id = ?').get(id);
  db().prepare("UPDATE consultant_assignments SET status = 'archived' WHERE id = ?").run(id);
  writeAudit({ actorUserId: p.userId, action: 'consultant_assignment.remove', entityType: 'consultant_assignment', entityId: id, before, after: null });
}

// ---------- Ngưỡng tín hiệu (versioned, gắn nhãn thử nghiệm) ----------

export function listSignalPolicies() {
  return db().prepare('SELECT * FROM signal_policies ORDER BY version DESC').all() as any[];
}

export function createSignalPolicy(p: Principal, input: any) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, {}, 'Chỉ quản trị viên mới đổi được ngưỡng tín hiệu.');
  const attendance = Number(input.attendanceMinRate);
  const homework = Number(input.homeworkMinRate);
  if (!(attendance > 0 && attendance <= 1) || !(homework > 0 && homework <= 1)) {
    throw badRequest('Ngưỡng phải là tỷ lệ trong khoảng 0–1 (ví dụ 0.8 = 80%).');
  }
  return tx(() => {
    const conn = db();
    const maxV = (conn.prepare('SELECT MAX(version) AS m FROM signal_policies').get() as any)?.m ?? 0;
    conn.prepare("UPDATE signal_policies SET status = 'archived' WHERE status = 'active'").run();
    const info = conn
      .prepare(
        `INSERT INTO signal_policies
          (version, label, attendance_min_rate, homework_min_rate, lookback_weeks, due_soon_days, long_running_days, is_experimental, status, created_at)
         VALUES (?,?,?,?,?,?,?,?, 'active', ?)`,
      )
      .run(maxV + 1, input.label ?? `Ngưỡng thử nghiệm v${maxV + 1}`, attendance, homework,
           input.lookbackWeeks ?? 4, input.dueSoonDays ?? 3, input.longRunningDays ?? 21,
           input.isExperimental === false ? 0 : 1, nowIso());
    const id = Number(info.lastInsertRowid);
    setConfig('signal_policy_version', String(maxV + 1));
    writeAudit({ actorUserId: p.userId, action: 'signal_policy.create', entityType: 'signal_policy', entityId: id, after: input });
    return conn.prepare('SELECT * FROM signal_policies WHERE id = ?').get(id);
  });
}

export function listAuditLogs(p: Principal, limit = 100) {
  require_(p, PERMISSIONS.AUDIT_VIEW, {}, 'Bạn không có quyền xem nhật ký thay đổi.');
  return db()
    .prepare(
      `SELECT a.*, u.full_name AS actor_name FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
        ORDER BY a.id DESC LIMIT ?`,
    )
    .all(limit) as any[];
}
