import { db, recreateSchema, tx } from '../db.ts';
import { TEACHING_SKILLS, PERMISSION_LABEL } from '../../../shared/domain.ts';
import { addDays, normalizeName, nowIso, padCode, weekStartOf, weekLabel } from '../util.ts';
import { setConfig } from '../demoConfig.ts';
import {
  BRANCHES, CLASSES, CLASS_TYPES, DEMO_DATE, FIRST_NAMES, LAST_NAMES, MIDDLE_NAMES,
  PERMISSION_GROUPS, REPORT_CATEGORIES, ROLE_PERMISSIONS, SKILL_CONFIG, TEMPLATES, WEEKS,
} from './data.ts';

/** PRNG cố định: seed lại nhiều lần vẫn ra cùng dữ liệu. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = {
  rand: () => number;
  now: string;
  weeks: string[];
  ids: {
    branch: Record<string, number>;
    unit: Record<string, number>;
    classType: Record<string, number>;
    class: Record<string, number>;
    templateVersion: Record<string, number>;
    user: Record<string, number>;
    role: Record<string, number>;
    student: Record<string, number>;
    enrollment: Record<string, number>;
    period: number[];
    meeting: number[];
  };
};

export function runSeed() {
  recreateSchema();
  const conn = db();
  const ctx: Ctx = {
    rand: rng(20260910),
    now: nowIso(),
    weeks: Array.from({ length: WEEKS }, (_, i) => weekStartOf(addDays(DEMO_DATE, -7 * (WEEKS - 1 - i)))),
    ids: {
      branch: {}, unit: {}, classType: {}, class: {}, templateVersion: {},
      user: {}, role: {}, student: {}, enrollment: {}, period: [], meeting: [],
    },
  };

  tx(() => {
    seedConfig(ctx);
    seedIdentity(ctx);
    seedOrganization(ctx);
    seedCurriculum(ctx);
    seedClasses(ctx);
    seedUsersAndGrants(ctx);
    seedStudents(ctx);
    seedWeeklyData(ctx);
    seedAssessments(ctx);
    seedOperations(ctx);
  });

  conn.pragma('wal_checkpoint(TRUNCATE)');
  return summarise();
}

function seedConfig(ctx: Ctx) {
  setConfig('demo_date', DEMO_DATE);
  setConfig('scenario_mode', 'normal');
  setConfig('seeded_at', ctx.now);
  db()
    .prepare(
      `INSERT INTO signal_policies
        (version, label, attendance_min_rate, homework_min_rate, lookback_weeks, due_soon_days, long_running_days, is_experimental, status, created_at)
       VALUES (1, 'Ngưỡng khởi tạo (thử nghiệm)', 0.75, 0.65, 4, 3, 21, 1, 'archived', ?),
              (2, 'Ngưỡng thử nghiệm hiện hành', 0.8, 0.7, 4, 3, 21, 1, 'active', ?)`,
    )
    .run(ctx.now, ctx.now);
  db().prepare('INSERT INTO student_code_seq (id, next_value) VALUES (1, 1)').run();
  for (const c of REPORT_CATEGORIES) {
    db()
      .prepare("INSERT INTO report_category_defs (version, key, label, seq, status) VALUES (1, ?, ?, ?, 'active')")
      .run(c.key, c.label, c.seq);
  }
}

function seedIdentity(ctx: Ctx) {
  const conn = db();
  const roles = [
    { key: 'admin', name: 'Quản trị viên', description: 'Toàn quyền theo permission được cấp' },
    { key: 'manager', name: 'Quản lý / Head', description: 'Quản lý theo chi nhánh hoặc đơn vị được giao' },
    { key: 'teacher', name: 'Giáo viên', description: 'Quyền theo lớp và skill được phân công' },
    { key: 'consultant', name: 'Tư vấn viên', description: 'Xem học viên được phân công' },
    { key: 'consultant_manager', name: 'Quản lý tư vấn', description: 'Xem phạm vi nhóm tư vấn được cấp' },
  ];
  for (const r of roles) {
    const info = conn.prepare('INSERT INTO roles (key, name_vi, description) VALUES (?,?,?)').run(r.key, r.name, r.description);
    ctx.ids.role[r.key] = Number(info.lastInsertRowid);
  }
  const permIds: Record<string, number> = {};
  for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
    const info = conn.prepare('INSERT INTO permissions (key, name_vi, group_key) VALUES (?,?,?)')
      .run(key, PERMISSION_LABEL[key] ?? key, group);
    permIds[key] = Number(info.lastInsertRowid);
  }
  for (const [roleKey, perms] of Object.entries(ROLE_PERMISSIONS)) {
    for (const perm of perms) {
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)').run(ctx.ids.role[roleKey], permIds[perm]);
    }
  }
}

function seedOrganization(ctx: Ctx) {
  const conn = db();
  for (const b of BRANCHES) {
    const info = conn.prepare("INSERT INTO branches (code, name, address, status, created_at) VALUES (?,?,?, 'active', ?)")
      .run(b.code, b.name, b.address, ctx.now);
    const id = Number(info.lastInsertRowid);
    ctx.ids.branch[b.code] = id;
    const u = conn
      .prepare("INSERT INTO reporting_units (code, name, branch_id, kind, status, created_at) VALUES (?,?,?, 'branch', 'active', ?)")
      .run(b.code, b.name, id, ctx.now);
    ctx.ids.unit[b.code] = Number(u.lastInsertRowid);
  }
  const tutor = conn
    .prepare("INSERT INTO reporting_units (code, name, branch_id, kind, status, created_at) VALUES ('TUTOR', 'Tutor Part-time', NULL, 'department', 'active', ?)")
    .run(ctx.now);
  ctx.ids.unit['TUTOR'] = Number(tutor.lastInsertRowid);

  for (const t of CLASS_TYPES) {
    const info = conn.prepare("INSERT INTO class_types (code, name, category, status, created_at) VALUES (?,?,?, 'active', ?)")
      .run(t.code, t.name, t.category, ctx.now);
    ctx.ids.classType[t.code] = Number(info.lastInsertRowid);
  }
}

function seedCurriculum(ctx: Ctx) {
  const conn = db();
  for (const t of TEMPLATES) {
    const info = conn.prepare("INSERT INTO course_templates (code, name, category, status, created_at) VALUES (?,?,?, 'active', ?)")
      .run(t.code, t.name, t.category, ctx.now);
    const templateId = Number(info.lastInsertRowid);
    for (const v of t.versions) {
      const vi = conn
        .prepare(
          `INSERT INTO course_template_versions (template_id, version_no, status, notes, published_at, created_at)
           VALUES (?,?, 'published', ?, ?, ?)`,
        )
        .run(templateId, v.versionNo, v.notes, ctx.now, ctx.now);
      const versionId = Number(vi.lastInsertRowid);
      ctx.ids.templateVersion[`${t.code}:v${v.versionNo}`] = versionId;
      for (const [i, s] of v.stages.entries()) {
        conn
          .prepare(
            `INSERT INTO template_stages (template_version_id, stage_key, seq, name, kind, week_from, week_to, due_offset_days, description)
             VALUES (?,?,?,?,?,?,?,?,?)`,
          )
          .run(versionId, s.stageKey, i + 1, s.name, s.kind, (s as any).weekFrom ?? null, (s as any).weekTo ?? null, s.dueOffsetDays ?? null, null);
      }
    }
  }
}

function seedClasses(ctx: Ctx) {
  const conn = db();
  for (const c of CLASSES) {
    const startDate = weekStartOf(addDays(DEMO_DATE, c.startOffsetWeeks * 7));
    const info = conn
      .prepare(
        `INSERT INTO classes (code, name, branch_id, class_type_id, template_version_id, start_date, status, created_at)
         VALUES (?,?,?,?,?,?, 'active', ?)`,
      )
      .run(c.code, c.name, ctx.ids.branch[c.branch], ctx.ids.classType[c.type],
           ctx.ids.templateVersion[`${c.template}:v${c.versionNo}`], startDate, ctx.now);
    const classId = Number(info.lastInsertRowid);
    ctx.ids.class[c.code] = classId;
    for (const [skill, n] of Object.entries(SKILL_CONFIG[c.type])) {
      conn.prepare('INSERT INTO class_skill_config (class_id, skill, expected_main_sessions_per_week) VALUES (?,?,?)')
        .run(classId, skill, n);
    }
  }

  // NM-B01: override riêng lớp — bỏ hạn của một checkpoint và đổi tên, không ảnh hưởng lớp khác.
  conn
    .prepare(
      `INSERT INTO class_stage_overrides (class_id, stage_key, action, name, clear_due, reason, created_at)
       VALUES (?, 'f1-w4', 'modify', 'Tuần 4 — Progress Test (lùi lịch theo tình hình lớp)', 1, 'Lớp nghỉ 1 tuần do lịch thi của trường', ?)`,
    )
    .run(ctx.ids.class['NM-B01'], ctx.now);

  // Tiến độ thực tế do người nhập.
  const progress: [string, string, string][] = [
    ['FT-A01', 'ft-s1', 'done'], ['FT-A01', 'ft-s2', 'done'], ['FT-A01', 'ft-m1', 'done'], ['FT-A01', 'ft-s3', 'in_progress'],
    ['FT-A02', 'ftm-s1', 'done'], ['FT-A02', 'ftm-m1', 'done'], ['FT-A02', 'ftm-s2', 'in_progress'],
    ['FT-B01', 'ft-s1', 'done'], ['FT-B01', 'ft-s2', 'in_progress'],
    ['FT-B02', 'ft-s1', 'done'], ['FT-B02', 'ft-s2', 'in_progress'],
    ['FT-C01', 'ftm-s1', 'done'], ['FT-C01', 'ftm-m1', 'done'], ['FT-C01', 'ftm-s2', 'done'], ['FT-C01', 'ftm-m2', 'in_progress'],
    ['FT-D01', 'ft-s1', 'done'], ['FT-D01', 'ft-s2', 'in_progress'],
    ['NM-A01', 'f1-w1', 'done'], ['NM-A01', 'f1-w2', 'done'], ['NM-A01', 'f1-w3', 'done'], ['NM-A01', 'f1-w4', 'done'], ['NM-A01', 'f1-w5', 'in_progress'],
    ['NM-A02', 'e1-w1', 'done'], ['NM-A02', 'e1-w2', 'done'], ['NM-A02', 'e1-w3', 'done'], ['NM-A02', 'e1-w4', 'done'], ['NM-A02', 'e1-w5', 'in_progress'],
    ['NM-B01', 'f1-w1', 'done'], ['NM-B01', 'f1-w2', 'done'], ['NM-B01', 'f1-w3', 'done'], ['NM-B01', 'f1-w4', 'in_progress'],
    ['NM-B02', 'p1-w1', 'done'], ['NM-B02', 'p1-w2', 'done'], ['NM-B02', 'p1-w3', 'in_progress'],
    ['NM-C01', 'f2-w1', 'done'], ['NM-C01', 'f2-w2', 'done'], ['NM-C01', 'f2-w3', 'in_progress'],
    ['NM-D01', 'e1-w1', 'done'], ['NM-D01', 'e1-w2', 'done'], ['NM-D01', 'e1-w3', 'done'], ['NM-D01', 'e1-w4', 'in_progress'],
  ];
  for (const [code, stageKey, status] of progress) {
    conn
      .prepare(
        `INSERT INTO class_stage_progress (class_id, stage_key, status, actual_date, updated_at) VALUES (?,?,?,?,?)`,
      )
      .run(ctx.ids.class[code], stageKey, status, status === 'done' ? addDays(DEMO_DATE, -14) : null, ctx.now);
  }
}

const USERS = [
  { code: 'U001', name: 'Trần Quốc Bảo', title: 'Giám đốc học vụ' },
  { code: 'U002', name: 'Nguyễn Thu Hà', title: 'Quản lý chi nhánh Cầu Giấy' },
  { code: 'U003', name: 'Phạm Đức Anh', title: 'Quản lý Cầu Giấy kiêm GV Speaking' },
  { code: 'U004', name: 'Lê Minh Tú', title: 'Giáo viên Listening' },
  { code: 'U005', name: 'Vũ Hải Yến', title: 'GVCN FT-A01, GV Speaking' },
  { code: 'U006', name: 'Đặng Kim Chi', title: 'Tư vấn viên' },
  { code: 'U007', name: 'Hoàng Lan Phương', title: 'Quản lý tư vấn' },
  { code: 'U008', name: 'Bùi Thanh Trúc', title: 'Tư vấn viên' },
  { code: 'U009', name: 'Đỗ Trung Kiên', title: 'Quản lý chi nhánh Hà Đông' },
  { code: 'U010', name: 'Ngô Bích Ngọc', title: 'Quản lý chi nhánh Thanh Xuân' },
  { code: 'U011', name: 'Trịnh Văn Hùng', title: 'Quản lý chi nhánh Long Biên' },
  { code: 'U012', name: 'Phan Gia Hân', title: 'Giáo viên Reading' },
  { code: 'U013', name: 'Nguyễn Hoàng Nam', title: 'Giáo viên Writing' },
  { code: 'U014', name: 'Lý Thu Trang', title: 'GVCN FT-B01, GV Reading' },
  { code: 'U015', name: 'Trương Nhật Minh', title: 'Giáo viên Thanh Xuân' },
  { code: 'U016', name: 'Cao Mỹ Duyên', title: 'GVCN NM-A01' },
  { code: 'U017', name: 'Hà Anh Quân', title: 'Phụ trách Tutor Part-time' },
  { code: 'U018', name: 'Mai Đình Phúc', title: 'Giáo viên dạy thay' },
  { code: 'U019', name: 'Lâm Hoài An', title: 'Quản lý chi nhánh Vinh' },
];

function seedUsersAndGrants(ctx: Ctx) {
  const conn = db();
  for (const u of USERS) {
    const email = `${u.code.toLowerCase()}@example.com`;
    const info = conn.prepare("INSERT INTO users (code, full_name, email, title, status, created_at) VALUES (?,?,?,?, 'active', ?)")
      .run(u.code, u.name, email, u.title, ctx.now);
    ctx.ids.user[u.code] = Number(info.lastInsertRowid);
  }

  const grant = (userCode: string, roleKey: string, scopeType: string, scopeId: number | null, label: string) =>
    conn
      .prepare(
        `INSERT INTO user_role_grants (user_id, role_id, scope_type, scope_id, label, status, created_at)
         VALUES (?,?,?,?,?, 'active', ?)`,
      )
      .run(ctx.ids.user[userCode], ctx.ids.role[roleKey], scopeType, scopeId, label, ctx.now);

  grant('U001', 'admin', 'global', null, 'Toàn hệ thống');
  grant('U002', 'manager', 'branch', ctx.ids.branch['CG'], 'PISA Cầu Giấy');
  // Đa vai trò: quyền quản lý chỉ ở CG, quyền giáo viên chỉ theo phân công (lớp ở HD).
  grant('U003', 'manager', 'branch', ctx.ids.branch['CG'], 'PISA Cầu Giấy');
  grant('U003', 'teacher', 'assignment', null, 'Theo lớp/skill được phân công');
  grant('U004', 'teacher', 'assignment', null, 'Theo lớp/skill được phân công');
  grant('U005', 'teacher', 'assignment', null, 'Theo lớp/skill được phân công');
  grant('U006', 'consultant', 'consultant_caseload', null, 'Học viên được phân công');
  grant('U007', 'consultant_manager', 'consultant_team', null, 'Nhóm tư vấn được cấp');
  grant('U008', 'consultant', 'consultant_caseload', null, 'Học viên được phân công');
  grant('U009', 'manager', 'branch', ctx.ids.branch['HD'], 'PISA Hà Đông');
  grant('U010', 'manager', 'branch', ctx.ids.branch['TX'], 'PISA Thanh Xuân');
  grant('U011', 'manager', 'branch', ctx.ids.branch['LB'], 'PISA Long Biên');
  grant('U012', 'teacher', 'assignment', null, 'Theo lớp/skill được phân công');
  grant('U013', 'teacher', 'assignment', null, 'Theo lớp/skill được phân công');
  grant('U014', 'teacher', 'assignment', null, 'Theo lớp/skill được phân công');
  grant('U015', 'teacher', 'assignment', null, 'Theo lớp/skill được phân công');
  grant('U016', 'teacher', 'assignment', null, 'Theo lớp/skill được phân công');
  grant('U017', 'manager', 'reporting_unit', ctx.ids.unit['TUTOR'], 'Tutor Part-time');
  grant('U018', 'teacher', 'assignment', null, 'Theo lớp/skill được phân công');
  grant('U019', 'manager', 'branch', ctx.ids.branch['VI'], 'PISA Vinh');

  conn.prepare('INSERT INTO consultant_team_members (manager_user_id, consultant_user_id, status) VALUES (?,?, \'active\')')
    .run(ctx.ids.user['U007'], ctx.ids.user['U006']);
  conn.prepare('INSERT INTO consultant_team_members (manager_user_id, consultant_user_id, status) VALUES (?,?, \'active\')')
    .run(ctx.ids.user['U007'], ctx.ids.user['U008']);

  const start = addDays(DEMO_DATE, -200);
  const assign = (userCode: string, classCode: string, skill: string | null, isCore = false, from = start, to: string | null = null) =>
    conn
      .prepare(
        `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, effective_to, status, created_at)
         VALUES (?,?,?,?,?,?, 'active', ?)`,
      )
      .run(ctx.ids.user[userCode], ctx.ids.class[classCode], skill, isCore ? 1 : 0, from, to, ctx.now);

  // FT-A01: GVCN U005 (chỉ dạy Speaking), các skill khác do GV khác.
  assign('U005', 'FT-A01', null, true);
  assign('U005', 'FT-A01', 'speaking');
  assign('U005', 'FT-B01', 'speaking');            // dạy Speaking ở FT-B01 nhưng KHÔNG chủ nhiệm
  assign('U004', 'FT-A01', 'listening');           // chỉ Listening của FT-A01
  assign('U012', 'FT-A01', 'reading');
  assign('U012', 'NM-A01', 'reading');
  assign('U013', 'FT-A01', 'writing1');
  assign('U013', 'FT-A01', 'writing2');
  assign('U003', 'FT-B01', 'speaking');            // manager CG kiêm GV Speaking lớp HD
  assign('U014', 'FT-B01', null, true);
  assign('U014', 'FT-B01', 'reading');
  assign('U014', 'FT-B02', 'reading');
  assign('U013', 'FT-B01', 'writing1');
  assign('U004', 'FT-B01', 'listening');
  assign('U015', 'FT-C01', null, true);
  assign('U015', 'FT-C01', 'listening');
  assign('U015', 'NM-C01', 'listening');
  assign('U016', 'NM-A01', null, true);
  assign('U016', 'NM-A01', 'listening');
  assign('U016', 'NM-A01', 'speaking');
  assign('U016', 'NM-A02', 'speaking');
  assign('U012', 'FT-A02', 'reading');
  assign('U013', 'FT-A02', 'writing1');
  assign('U004', 'FT-D01', 'listening');
  assign('U015', 'NM-B02', 'listening');
  assign('U014', 'NM-B01', null, true);
  assign('U014', 'NM-B01', 'listening');
  assign('U015', 'NM-D01', 'listening');
  assign('U005', 'FT-B02', 'speaking');
  // Giáo viên dạy thay: phân công đã HẾT hiệu lực -> không còn quyền sửa.
  assign('U018', 'FT-A01', 'reading', false, addDays(DEMO_DATE, -60), addDays(DEMO_DATE, -30));
}

/** Học viên theo kịch bản, đặt tên rõ ràng để dễ tra trong DEMO_SCENARIOS.md */
const SCENARIO_STUDENTS = [
  { key: 'GOOD', name: 'Nguyễn Minh Anh', dob: '2007-04-12', target: 7.0, cls: 'FT-A01', profile: 'good' },
  { key: 'LOW_ATT', name: 'Trần Bảo Long', dob: '2007-09-03', target: 6.5, cls: 'FT-A01', profile: 'low_attendance' },
  { key: 'LOW_HW', name: 'Lê Thu Phương', dob: '2006-12-21', target: 6.5, cls: 'FT-A01', profile: 'low_homework' },
  { key: 'WARNED', name: 'Phạm Nhật Duy', dob: '2007-02-17', target: 6.0, cls: 'FT-A01', profile: 'low_attendance' },
  { key: 'TRANSFER', name: 'Hoàng Diệu Linh', dob: '2008-06-30', target: 6.5, cls: 'NM-A01', profile: 'good' },
  { key: 'PAUSED', name: 'Vũ Đăng Khoa', dob: '2007-11-08', target: 6.0, cls: 'FT-A01', profile: 'mixed' },
  { key: 'REPEAT', name: 'Đỗ Khánh Chi', dob: '2006-08-25', target: 7.0, cls: 'FT-A01', profile: 'good' },
  { key: 'PARTIAL_SKILL', name: 'Ngô Tuấn Kiệt', dob: '2007-07-14', target: 6.0, cls: 'FT-A01', profile: 'good', skills: ['listening', 'speaking'] },
  { key: 'SUPPLEMENTAL', name: 'Bùi Hà My', dob: '2007-01-19', target: 7.5, cls: 'FT-A01', profile: 'good' },
  { key: 'WRITING_SPLIT', name: 'Dương Quốc Việt', dob: '2006-05-05', target: 6.5, cls: 'FT-A01', profile: 'mixed' },
  { key: 'NO_OFFICIAL', name: 'Lý Thảo Nguyên', dob: '2008-03-11', target: 6.0, cls: 'FT-A01', profile: 'good' },
  { key: 'PARTIAL_TEST', name: 'Đinh Gia Huy', dob: '2007-10-02', target: 6.5, cls: 'FT-A01', profile: 'mixed' },
  { key: 'DUP_A', name: 'Nguyễn Văn Hải', dob: '2007-03-08', target: 6.0, cls: 'FT-A01', profile: 'good' },
  { key: 'DUP_B', name: 'Nguyễn Văn Hải', dob: '2007-03-08', target: 6.5, cls: 'FT-B01', profile: 'good' },
  { key: 'NOT_UPDATED', name: 'Trịnh Bảo Trâm', dob: '2007-12-15', target: 6.5, cls: 'FT-A01', profile: 'not_updated' },
  { key: 'ZERO_ATT', name: 'Cao Minh Quang', dob: '2007-06-27', target: 6.0, cls: 'FT-A01', profile: 'zero' },
];

function seedStudents(ctx: Ctx) {
  const conn = db();
  const usedNames = new Set<string>();

  const createStudent = (name: string, dob: string, target: number, branchCode: string) => {
    const code = padCode('PISA', (conn.prepare('SELECT next_value FROM student_code_seq WHERE id = 1').get() as any).next_value);
    conn.prepare('UPDATE student_code_seq SET next_value = next_value + 1 WHERE id = 1').run();
    const info = conn
      .prepare(
        `INSERT INTO students (student_code, full_name, normalized_name, dob, target_band, branch_id, status, created_at)
         VALUES (?,?,?,?,?,?, 'active', ?)`,
      )
      .run(code, name, normalizeName(name), dob, target, ctx.ids.branch[branchCode], ctx.now);
    return Number(info.lastInsertRowid);
  };

  const enrol = (
    studentId: number, classCode: string, opts: { status?: string; attemptNo?: number; enrolledAt?: string; endedAt?: string | null; endReason?: string | null; skills?: string[] } = {},
  ) => {
    const classId = ctx.ids.class[classCode];
    const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
    const info = conn
      .prepare(
        `INSERT INTO enrollments (student_id, class_id, status, attempt_no, enrolled_at, starts_at, ended_at, end_reason, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .run(studentId, classId, opts.status ?? 'active', opts.attemptNo ?? 1,
           opts.enrolledAt ?? cls.start_date, opts.enrolledAt ?? cls.start_date,
           opts.endedAt ?? null, opts.endReason ?? null, ctx.now);
    const enrollmentId = Number(info.lastInsertRowid);
    const classSkills = conn.prepare('SELECT skill FROM class_skill_config WHERE class_id = ?').all(classId) as any[];
    for (const cs of classSkills) {
      const registered = opts.skills ? (opts.skills.includes(cs.skill) ? 1 : 0) : 1;
      conn.prepare('INSERT INTO enrollment_skills (enrollment_id, skill, registered) VALUES (?,?,?)')
        .run(enrollmentId, cs.skill, registered);
    }
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, enrollment_id, event_type, event_date, title, visibility, created_at)
         VALUES (?,?,?,?,?, 'shared', ?)`,
      )
      .run(studentId, enrollmentId, 'enrollment_start', opts.enrolledAt ?? cls.start_date, `Bắt đầu học lớp ${classCode}`, ctx.now);
    return enrollmentId;
  };

  const profiles: Record<number, string> = {};

  for (const s of SCENARIO_STUDENTS) {
    const branchCode = CLASSES.find((c) => c.code === s.cls)!.branch;
    const id = createStudent(s.name, s.dob, s.target, branchCode);
    ctx.ids.student[s.key] = id;
    usedNames.add(s.name);
    const enrollmentId = enrol(id, s.cls, { skills: s.skills });
    ctx.ids.enrollment[s.key] = enrollmentId;
    profiles[enrollmentId] = s.profile;
  }

  // Kịch bản chuyển lớp Normal -> FT: giữ cả hai enrollment.
  const transferId = ctx.ids.student['TRANSFER'];
  const oldEnr = ctx.ids.enrollment['TRANSFER'];
  const transferDate = weekStartOf(addDays(DEMO_DATE, -28));
  conn.prepare("UPDATE enrollments SET status = 'transferred', ended_at = ?, end_reason = ? WHERE id = ?")
    .run(transferDate, 'Chuyển lên lộ trình FT sau khi hoàn thành Foundation', oldEnr);
  const newEnr = enrol(transferId, 'FT-A01', { enrolledAt: transferDate, attemptNo: 1 });
  conn.prepare('UPDATE enrollments SET transferred_from_enrollment_id = ? WHERE id = ?').run(oldEnr, newEnr);
  conn.prepare('UPDATE enrollments SET transferred_to_enrollment_id = ? WHERE id = ?').run(newEnr, oldEnr);
  conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(ctx.ids.branch['CG'], transferId);
  conn
    .prepare(`INSERT INTO journey_events (student_id, enrollment_id, event_type, event_date, title, detail, visibility, created_at)
              VALUES (?,?, 'transfer', ?, ?, ?, 'shared', ?)`)
    .run(transferId, newEnr, transferDate, 'Chuyển từ NM-A01 sang FT-A01', 'Giữ nguyên lịch sử học và điểm cũ của lớp Foundation', ctx.now);
  ctx.ids.enrollment['TRANSFER_NEW'] = newEnr;
  profiles[newEnr] = 'good';
  profiles[oldEnr] = 'good';

  // Tạm dừng rồi quay lại: enrollment cũ paused, enrollment mới active.
  const pausedId = ctx.ids.student['PAUSED'];
  const pausedEnr = ctx.ids.enrollment['PAUSED'];
  const pauseDate = weekStartOf(addDays(DEMO_DATE, -42));
  const resumeDate = weekStartOf(addDays(DEMO_DATE, -21));
  conn.prepare("UPDATE enrollments SET status = 'paused', ended_at = ?, end_reason = ? WHERE id = ?")
    .run(pauseDate, 'Tạm dừng vì lý do gia đình', pausedEnr);
  const resumeEnr = enrol(pausedId, 'FT-A01', { enrolledAt: resumeDate, attemptNo: 2 });
  ctx.ids.enrollment['PAUSED_RESUME'] = resumeEnr;
  profiles[resumeEnr] = 'mixed';
  for (const [type, date, title] of [
    ['pause', pauseDate, 'Tạm dừng học'],
    ['resume', resumeDate, 'Quay lại học lớp FT-A01'],
  ] as const) {
    conn.prepare(`INSERT INTO journey_events (student_id, enrollment_id, event_type, event_date, title, visibility, created_at)
                  VALUES (?,?,?,?,?, 'shared', ?)`)
      .run(pausedId, pausedEnr, type, date, title, ctx.now);
  }

  // Học lại lần 2 tại cùng lớp.
  const repeatId = ctx.ids.student['REPEAT'];
  const firstEnr = ctx.ids.enrollment['REPEAT'];
  const repeatDate = weekStartOf(addDays(DEMO_DATE, -35));
  conn.prepare("UPDATE enrollments SET status = 'completed', ended_at = ?, end_reason = ? WHERE id = ?")
    .run(repeatDate, 'Kết thúc lần học thứ nhất', firstEnr);
  const secondEnr = enrol(repeatId, 'FT-A01', { enrolledAt: repeatDate, attemptNo: 2 });
  ctx.ids.enrollment['REPEAT_2'] = secondEnr;
  profiles[secondEnr] = 'good';
  conn.prepare(`INSERT INTO journey_events (student_id, enrollment_id, event_type, event_date, title, detail, visibility, created_at)
                VALUES (?,?, 'repeat', ?, ?, ?, 'shared', ?)`)
    .run(repeatId, secondEnr, repeatDate, 'Học lại lần 2 để nâng band', 'Giữ nguyên lịch sử lần học thứ nhất', ctx.now);

  // Học viên còn lại: sinh theo PRNG cố định.
  const fillTargets: { cls: string; count: number }[] = [
    { cls: 'FT-A01', count: 3 }, { cls: 'FT-A02', count: 11 }, { cls: 'FT-B01', count: 9 },
    { cls: 'FT-B02', count: 10 }, { cls: 'FT-C01', count: 9 }, { cls: 'FT-D01', count: 10 },
    { cls: 'NM-A01', count: 10 }, { cls: 'NM-A02', count: 9 }, { cls: 'NM-B01', count: 9 },
    { cls: 'NM-B02', count: 8 }, { cls: 'NM-C01', count: 8 }, { cls: 'NM-D01', count: 9 },
  ];
  const profilePool = ['good', 'good', 'good', 'mixed', 'mixed', 'low_attendance', 'low_homework', 'not_updated'];
  let counter = 0;
  for (const t of fillTargets) {
    const branchCode = CLASSES.find((c) => c.code === t.cls)!.branch;
    for (let i = 0; i < t.count; i++) {
      let name = '';
      let guard = 0;
      do {
        const last = LAST_NAMES[Math.floor(ctx.rand() * LAST_NAMES.length)];
        const mid = MIDDLE_NAMES[Math.floor(ctx.rand() * MIDDLE_NAMES.length)];
        const first = FIRST_NAMES[Math.floor(ctx.rand() * FIRST_NAMES.length)];
        name = `${last} ${mid} ${first}`;
      } while (usedNames.has(name) && guard++ < 40);
      usedNames.add(name);
      const year = 2005 + Math.floor(ctx.rand() * 5);
      const month = 1 + Math.floor(ctx.rand() * 12);
      const day = 1 + Math.floor(ctx.rand() * 27);
      const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const target = [5.5, 6.0, 6.5, 7.0, 7.5][Math.floor(ctx.rand() * 5)];
      const id = createStudent(name, dob, target, branchCode);
      const enrollmentId = enrol(id, t.cls);
      profiles[enrollmentId] = profilePool[counter % profilePool.length];
      counter++;
    }
  }

  (ctx as any).profiles = profiles;

  // Phân công tư vấn viên.
  const allStudents = conn.prepare('SELECT id FROM students ORDER BY id').all() as any[];
  const cons1 = allStudents.slice(0, 12);         // đúng ~12 học viên cho tư vấn viên U006
  const cons2 = allStudents.slice(12, 26);
  for (const s of cons1) {
    conn.prepare(`INSERT INTO consultant_assignments (user_id, student_id, effective_from, status, created_at) VALUES (?,?,?, 'active', ?)`)
      .run(ctx.ids.user['U006'], s.id, addDays(DEMO_DATE, -120), ctx.now);
  }
  for (const s of cons2) {
    conn.prepare(`INSERT INTO consultant_assignments (user_id, student_id, effective_from, status, created_at) VALUES (?,?,?, 'active', ?)`)
      .run(ctx.ids.user['U008'], s.id, addDays(DEMO_DATE, -120), ctx.now);
  }
}

/** Sinh dữ liệu học tập theo tuần cho mọi enrollment đang hoạt động trong khoảng seed. */
function seedWeeklyData(ctx: Ctx) {
  const conn = db();
  const profiles: Record<number, string> = (ctx as any).profiles;
  const enrollments = conn
    .prepare(
      `SELECT e.*, c.start_date, c.id AS class_id FROM enrollments e JOIN classes c ON c.id = e.class_id`,
    )
    .all() as any[];

  const insertRecord = conn.prepare(
    `INSERT INTO weekly_learning_records
      (enrollment_id, student_id, class_id, skill, week_start, applicable, expected_main_sessions, expected_source,
       attended_main_sessions, supplemental_sessions, homework_assigned, homework_completed, note_short, updated_by, updated_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );

  for (const e of enrollments) {
    const skills = conn.prepare('SELECT skill, registered FROM enrollment_skills WHERE enrollment_id = ?').all(e.id) as any[];
    const profile = profiles[e.id] ?? 'good';
    const teacherId = (conn
      .prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' LIMIT 1`)
      .get(e.class_id) as any)?.user_id ?? null;

    for (const week of ctx.weeks) {
      // Chỉ sinh tuần nằm trong khoảng enrollment thực sự hoạt động.
      const startedBy = e.starts_at ?? e.enrolled_at;
      if (startedBy > addDays(week, 6)) continue;
      if (e.ended_at && e.ended_at < week) continue;

      for (const sk of skills) {
        const cfg = conn
          .prepare('SELECT expected_main_sessions_per_week FROM class_skill_config WHERE class_id = ? AND skill = ?')
          .get(e.class_id, sk.skill) as any;
        const expected = cfg?.expected_main_sessions_per_week ?? null;
        if (sk.registered === 0) {
          insertRecord.run(e.id, e.student_id, e.class_id, sk.skill, week, 0, expected, 'enrollment',
                           null, null, null, null, null, null, null, ctx.now);
          continue;
        }
        const values = generateWeekValues(ctx, profile, expected ?? 0);
        insertRecord.run(
          e.id, e.student_id, e.class_id, sk.skill, week, 1, expected, 'class',
          values.attended, values.supplemental, values.hwAssigned, values.hwCompleted, values.note,
          values.attended === null ? null : teacherId, values.attended === null ? null : ctx.now, ctx.now,
        );
      }
    }
  }

  // Kịch bản: 5 buổi chính + 7 buổi bổ trợ trong một tuần, tỷ lệ tham dự vẫn tính trên buổi chính.
  const suppEnr = ctx.ids.enrollment['SUPPLEMENTAL'];
  const lastWeek = ctx.weeks[ctx.weeks.length - 1];
  const suppRows = conn
    .prepare('SELECT * FROM weekly_learning_records WHERE enrollment_id = ? AND week_start = ?')
    .all(suppEnr, lastWeek) as any[];
  // Dọn buổi bổ trợ ở các tuần khác để kịch bản "5 buổi chính + 7 buổi bổ trợ trong MỘT tuần" rõ ràng khi review.
  conn.prepare('UPDATE weekly_learning_records SET supplemental_sessions = 0 WHERE enrollment_id = ? AND week_start != ?')
    .run(suppEnr, lastWeek);
  const suppPlan: Record<string, number> = { listening: 2, reading: 1, writing1: 1, writing2: 1, speaking: 2 };
  for (const r of suppRows) {
    const n = suppPlan[r.skill] ?? 0;
    conn.prepare('UPDATE weekly_learning_records SET attended_main_sessions = ?, supplemental_sessions = ? WHERE id = ?')
      .run(r.expected_main_sessions, n, r.id);
    for (let i = 0; i < n; i++) {
      conn
        .prepare(
          `INSERT INTO learning_activities (enrollment_id, weekly_record_id, skill, activity_date, sessions, kind, teacher_name_text, note, created_at)
           VALUES (?,?,?,?,1,?,?,?,?)`,
        )
        .run(suppEnr, r.id, r.skill, addDays(lastWeek, i + 1),
             i === 0 ? 'tutor' : 'one_to_one', 'Giáo viên bổ trợ (ghi tay)', 'Buổi bổ trợ ngoài lớp chính', ctx.now);
    }
  }

  // Kịch bản: chưa cập nhật (NULL) khác với đã nhập 0 buổi.
  const notUpdated = ctx.ids.enrollment['NOT_UPDATED'];
  conn
    .prepare(
      `UPDATE weekly_learning_records
          SET attended_main_sessions = NULL, supplemental_sessions = NULL,
              homework_assigned = NULL, homework_completed = NULL, updated_by = NULL, updated_at = NULL
        WHERE enrollment_id = ? AND week_start >= ?`,
    )
    .run(notUpdated, ctx.weeks[ctx.weeks.length - 3]);

  const zero = ctx.ids.enrollment['ZERO_ATT'];
  conn
    .prepare(
      `UPDATE weekly_learning_records
          SET attended_main_sessions = 0, supplemental_sessions = 0, homework_assigned = 2, homework_completed = 0
        WHERE enrollment_id = ? AND week_start >= ?`,
    )
    .run(zero, ctx.weeks[ctx.weeks.length - 3]);

  // Ghi chú nội bộ: Teacher/Manager thấy, Tư vấn viên không nhận được.
  const notes: [string, string, string][] = [
    ['LOW_ATT', 'internal', 'Học viên nghỉ nhiều vào ca tối, phụ huynh chưa phản hồi. Cần GVCN trao đổi trước khi ghi nhận cảnh báo.'],
    ['LOW_HW', 'internal', 'Bài Writing nộp muộn liên tục, nghi do trùng lịch học thêm ở trường.'],
    ['GOOD', 'shared', 'Tiến bộ tốt ở Listening, có thể cân nhắc nâng mục tiêu lên 7.5.'],
    ['WARNED', 'internal', 'Đã trao đổi trực tiếp với phụ huynh ngày 20/08 (ghi chú nội bộ, không chia sẻ ra ngoài).'],
  ];
  for (const [key, visibility, body] of notes) {
    const studentId = ctx.ids.student[key];
    conn
      .prepare(
        `INSERT INTO teacher_notes (student_id, class_id, body, visibility, author_user_id, created_at)
         VALUES (?,?,?,?,?,?)`,
      )
      .run(studentId, ctx.ids.class['FT-A01'], body, visibility, ctx.ids.user['U005'], ctx.now);
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, visibility, created_by, created_at)
         VALUES (?, 'note', ?, ?, ?, ?, ?, ?)`,
      )
      .run(studentId, addDays(DEMO_DATE, -10), 'Ghi chú của giáo viên',
           visibility === 'internal' ? 'Ghi chú nội bộ' : body, visibility, ctx.ids.user['U005'], ctx.now);
  }
}

/**
 * Sinh số buổi tham dự theo xác suất từng buổi, thay vì nhân tỷ lệ rồi làm tròn.
 * Với lớp chỉ có 1 buổi/tuần, cách nhân-rồi-làm-tròn sẽ luôn ra 0 hoặc luôn ra đủ,
 * khiến dữ liệu demo không giống thực tế.
 */
function drawAttended(ctx: Ctx, expected: number, rate: number): number {
  let attended = 0;
  for (let i = 0; i < expected; i++) if (ctx.rand() < rate) attended++;
  return attended;
}

function generateWeekValues(ctx: Ctx, profile: string, expected: number) {
  const r = ctx.rand();
  const hwAssigned = 1 + Math.floor(ctx.rand() * 2);
  switch (profile) {
    case 'good':
      return { attended: expected, supplemental: r > 0.85 ? 1 : 0, hwAssigned, hwCompleted: hwAssigned, note: null };
    case 'mixed':
      return {
        attended: drawAttended(ctx, expected, 0.9),
        supplemental: 0, hwAssigned,
        hwCompleted: r > 0.5 ? hwAssigned : Math.max(0, hwAssigned - 1),
        note: null,
      };
    case 'low_attendance':
      return {
        attended: drawAttended(ctx, expected, 0.55),
        supplemental: 0, hwAssigned,
        hwCompleted: r > 0.4 ? hwAssigned : Math.max(0, hwAssigned - 1),
        note: r > 0.6 ? 'Nghỉ buổi trong tuần' : null,
      };
    case 'low_homework':
      return {
        attended: expected, supplemental: 0, hwAssigned,
        hwCompleted: r > 0.7 ? hwAssigned : 0,
        note: r > 0.7 ? null : 'Chưa nộp bài',
      };
    case 'not_updated':
      return { attended: null, supplemental: null, hwAssigned: null, hwCompleted: null, note: null };
    case 'zero':
      return { attended: 0, supplemental: 0, hwAssigned, hwCompleted: 0, note: null };
    default:
      return { attended: expected, supplemental: 0, hwAssigned, hwCompleted: hwAssigned, note: null };
  }
}

function seedAssessments(ctx: Ctx) {
  const conn = db();
  const addAssessment = (
    studentId: number, enrollmentId: number | null, testType: string, scale: string, date: string,
    scores: Record<string, number | null>, title?: string,
  ) => {
    const info = conn
      .prepare(
        `INSERT INTO assessments (student_id, enrollment_id, test_type, scale, test_date, title, entered_by, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .run(studentId, enrollmentId, testType, scale, date, title ?? null, ctx.ids.user['U002'], ctx.now);
    const id = Number(info.lastInsertRowid);
    for (const [skill, score] of Object.entries(scores)) {
      if (score === null || score === undefined) continue;   // skill thiếu -> "Chưa có"
      conn.prepare('INSERT INTO assessment_scores (assessment_id, skill, score) VALUES (?,?,?)').run(id, skill, score);
    }
    conn
      .prepare(`INSERT INTO journey_events (student_id, enrollment_id, event_type, event_date, title, detail, visibility, created_at)
                VALUES (?,?, 'assessment', ?, ?, ?, 'shared', ?)`)
      .run(studentId, enrollmentId, date,
           testType === 'entrance' ? 'Entrance Test' : testType === 'mock' ? 'Mock Test' : testType === 'progress' ? 'Progress Test' : 'Final Test',
           Object.entries(scores).filter(([, v]) => v != null).map(([k, v]) => `${k}: ${v}`).join(' · '), ctx.now);
    return id;
  };

  const S = ctx.ids.student;
  const E = ctx.ids.enrollment;

  addAssessment(S['GOOD'], E['GOOD'], 'entrance', 'ielts', addDays(DEMO_DATE, -70), { listening: 5.5, reading: 5.0, writing: 5.0, speaking: 5.5, overall: 5.5 });
  addAssessment(S['GOOD'], E['GOOD'], 'mock', 'ielts', addDays(DEMO_DATE, -21), { listening: 6.5, reading: 6.0, writing: 5.5, speaking: 6.0, overall: 6.0 });
  addAssessment(S['LOW_ATT'], E['LOW_ATT'], 'entrance', 'ielts', addDays(DEMO_DATE, -63), { listening: 5.0, reading: 5.0, writing: 4.5, speaking: 5.0, overall: 5.0 });
  addAssessment(S['LOW_HW'], E['LOW_HW'], 'entrance', 'ielts', addDays(DEMO_DATE, -63), { listening: 5.5, reading: 5.5, writing: 5.0, speaking: 5.0, overall: 5.5 });
  addAssessment(S['WARNED'], E['WARNED'], 'entrance', 'ielts', addDays(DEMO_DATE, -63), { listening: 4.5, reading: 4.5, writing: 4.0, speaking: 4.5, overall: 4.5 });

  // Chuyển lớp: điểm Progress Test thang 10 của lớp Normal cũ VẪN giữ, không quy đổi sang band.
  addAssessment(S['TRANSFER'], E['TRANSFER'], 'progress', 'score10', addDays(DEMO_DATE, -56), { listening: 9.5, reading: 7.5, writing: 7, speaking: 8 }, 'Progress Test Foundation tuần 4');
  addAssessment(S['TRANSFER'], E['TRANSFER'], 'final', 'score10', addDays(DEMO_DATE, -30), { listening: 9.5, reading: 8, writing: 7.5, speaking: 9 }, 'Final Test Foundation');
  addAssessment(S['TRANSFER'], E['TRANSFER_NEW'], 'entrance', 'ielts', addDays(DEMO_DATE, -26), { listening: 5.5, reading: 5.0, writing: 5.0, speaking: 5.5, overall: 5.5 });

  // Writing 1/2 có hai ước lượng riêng; official Writing là một điểm độc lập.
  // Writing chính thức 6.5 — cố ý KHÁC trung bình của hai ước lượng Writing 1 (5.0) và Writing 2 (6.0),
  // để thấy rõ hệ thống không lấy trung bình ước lượng làm điểm official.
  addAssessment(S['WRITING_SPLIT'], E['WRITING_SPLIT'], 'mock', 'ielts', addDays(DEMO_DATE, -14), { listening: 6.0, reading: 6.0, writing: 6.5, speaking: 6.0, overall: 6.0 });
  // Bài official thiếu skill Speaking -> hiển thị "Chưa có".
  addAssessment(S['PARTIAL_TEST'], E['PARTIAL_TEST'], 'mock', 'ielts', addDays(DEMO_DATE, -10), { listening: 6.0, reading: 5.5, writing: 5.5, speaking: null, overall: null }, 'Mock Test (thiếu phần Speaking do vắng buổi thi nói)');
  // NO_OFFICIAL: cố ý không có bài official nào.

  addAssessment(S['REPEAT'], E['REPEAT'], 'mock', 'ielts', addDays(DEMO_DATE, -40), { listening: 6.0, reading: 6.0, writing: 5.5, speaking: 6.0, overall: 6.0 });
  addAssessment(S['REPEAT'], E['REPEAT_2'], 'mock', 'ielts', addDays(DEMO_DATE, -7), { listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.5, overall: 6.5 });
  addAssessment(S['PARTIAL_SKILL'], E['PARTIAL_SKILL'], 'entrance', 'ielts', addDays(DEMO_DATE, -60), { listening: 5.5, reading: null, writing: null, speaking: 5.0, overall: null }, 'Entrance Test (chỉ thi Listening và Speaking)');
  addAssessment(S['SUPPLEMENTAL'], E['SUPPLEMENTAL'], 'mock', 'ielts', addDays(DEMO_DATE, -14), { listening: 7.0, reading: 6.5, writing: 6.0, speaking: 6.5, overall: 6.5 });

  // Ước lượng giáo viên theo skill GIẢNG DẠY (Writing 1 và Writing 2 tách riêng).
  const addEstimate = (studentKey: string, enrollmentKey: string, skill: string, band: number, weeksAgo: number, teacher: string, note?: string) => {
    const date = addDays(DEMO_DATE, -7 * weeksAgo);
    const info = conn
      .prepare(
        `INSERT INTO teacher_estimates (student_id, enrollment_id, teaching_skill, band, week_start, estimate_date, teacher_user_id, note, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .run(ctx.ids.student[studentKey], ctx.ids.enrollment[enrollmentKey], skill, band,
           weekStartOf(date), date, ctx.ids.user[teacher], note ?? null, ctx.now);
    conn
      .prepare(`INSERT INTO journey_events (student_id, enrollment_id, event_type, event_date, title, visibility, created_at)
                VALUES (?,?, 'estimate', ?, ?, 'shared', ?)`)
      .run(ctx.ids.student[studentKey], ctx.ids.enrollment[enrollmentKey], date, `Ước lượng ${skill}: ${band}`, ctx.now);
    return Number(info.lastInsertRowid);
  };

  addEstimate('WRITING_SPLIT', 'WRITING_SPLIT', 'writing1', 5.0, 1, 'U013', 'Task 1 còn yếu phần mô tả xu hướng');
  addEstimate('WRITING_SPLIT', 'WRITING_SPLIT', 'writing2', 6.0, 1, 'U013', 'Task 2 lập luận tốt hơn rõ rệt');
  addEstimate('WRITING_SPLIT', 'WRITING_SPLIT', 'listening', 6.0, 1, 'U004');
  addEstimate('WRITING_SPLIT', 'WRITING_SPLIT', 'speaking', 6.0, 1, 'U005');
  addEstimate('NO_OFFICIAL', 'NO_OFFICIAL', 'listening', 5.5, 1, 'U004');
  addEstimate('NO_OFFICIAL', 'NO_OFFICIAL', 'reading', 5.5, 1, 'U012');
  addEstimate('NO_OFFICIAL', 'NO_OFFICIAL', 'writing1', 5.0, 1, 'U013');
  addEstimate('NO_OFFICIAL', 'NO_OFFICIAL', 'writing2', 5.0, 1, 'U013');
  addEstimate('NO_OFFICIAL', 'NO_OFFICIAL', 'speaking', 5.5, 1, 'U005');
  addEstimate('GOOD', 'GOOD', 'listening', 6.5, 1, 'U004');
  addEstimate('GOOD', 'GOOD', 'speaking', 6.5, 1, 'U005');
  addEstimate('LOW_ATT', 'LOW_ATT', 'listening', 5.0, 2, 'U004', 'Khó đánh giá do vắng nhiều');
  addEstimate('PARTIAL_SKILL', 'PARTIAL_SKILL', 'listening', 5.5, 1, 'U004');
  addEstimate('PARTIAL_SKILL', 'PARTIAL_SKILL', 'speaking', 5.5, 1, 'U005');

  // Ghi nhận cảnh báo do người nhập, kèm lịch sử theo dõi.
  const warnInfo = conn
    .prepare(
      `INSERT INTO warning_references (student_id, issued_date, level, reason, description, status, follow_up, created_by, created_at)
       VALUES (?,?, 'warning', ?, ?, 'monitoring', ?, ?, ?)`,
    )
    .run(ctx.ids.student['WARNED'], addDays(DEMO_DATE, -24),
         'Vắng học nhiều buổi liên tiếp và không hoàn thành bài tập',
         'GVCN đã trao đổi với phụ huynh. Nội dung chi tiết chỉ hiển thị cho giáo viên và quản lý.',
         'Theo dõi thêm 3 tuần, xem lại vào kỳ họp tới.', ctx.ids.user['U005'], ctx.now);
  conn
    .prepare(`INSERT INTO journey_events (student_id, event_type, event_date, title, detail, visibility, created_by, created_at)
              VALUES (?, 'warning_reference', ?, ?, ?, 'shared', ?, ?)`)
    .run(ctx.ids.student['WARNED'], addDays(DEMO_DATE, -24), 'Ghi nhận cảnh báo mức Warning',
         'Lý do: vắng nhiều buổi liên tiếp', ctx.ids.user['U005'], ctx.now);
  conn
    .prepare(
      `INSERT INTO incident_references (student_id, incident_date, type, reason, description, status, created_by, created_at)
       VALUES (?,?, 'attendance', ?, ?, 'monitoring', ?, ?)`,
    )
    .run(ctx.ids.student['WARNED'], addDays(DEMO_DATE, -31), 'Vắng 3 buổi liên tiếp không báo',
         'Ghi nhận nội bộ chi tiết về buổi học và trao đổi với phụ huynh.', ctx.ids.user['U005'], ctx.now);

  // Báo cáo tiến độ học viên (object riêng với Branch Report).
  const reports: [string, string, string, string, string, string][] = [
    ['GOOD', 'GOOD', 'Tháng 8/2026', 'Tiến bộ đều ở cả 4 kỹ năng, Listening tăng 1.0 band so với đầu vào.',
      'Thái độ học tập tích cực, chủ động hỏi bài.', 'Học viên tiến bộ tốt, dự kiến đạt mục tiêu đúng hạn.'],
    ['LOW_ATT', 'LOW_ATT', 'Tháng 8/2026', 'Tiến độ chậm do vắng nhiều, Reading gần như không đổi.',
      'Cần nhắc nhở về chuyên cần; ghi chú chi tiết trong phần nội bộ.',
      'Chuyên cần chưa ổn định, trung tâm đang theo dõi và sẽ trao đổi thêm với gia đình.'],
    ['WARNED', 'WARNED', 'Tháng 8/2026', 'Chưa cải thiện so với kỳ trước.',
      'Đã ghi nhận cảnh báo và đang theo dõi.',
      'Học viên cần hỗ trợ thêm về chuyên cần; trung tâm đã có kế hoạch theo dõi.'],
  ];
  for (const [sKey, eKey, period, progress, attitude, shared] of reports) {
    const info = conn
      .prepare(
        `INSERT INTO student_progress_reports
          (student_id, enrollment_id, period_label, report_date, progress_summary, attitude_summary, next_steps, shared_summary, author_user_id, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(ctx.ids.student[sKey], ctx.ids.enrollment[eKey], period, addDays(DEMO_DATE, -12),
           progress, attitude, 'Tiếp tục theo dõi trong 4 tuần tới.', shared, ctx.ids.user['U005'], ctx.now);
    conn
      .prepare(`INSERT INTO journey_events (student_id, enrollment_id, event_type, event_date, title, visibility, created_by, created_at)
                VALUES (?,?, 'progress_report', ?, ?, 'shared', ?, ?)`)
      .run(ctx.ids.student[sKey], ctx.ids.enrollment[eKey], addDays(DEMO_DATE, -12),
           `Báo cáo tiến độ ${period}`, ctx.ids.user['U005'], ctx.now);
    void info;
  }
}

function seedOperations(ctx: Ctx) {
  const conn = db();
  const B = ctx.ids.branch;
  const U = ctx.ids.user;
  const UN = ctx.ids.unit;

  // Kỳ báo cáo tuần, dùng chung cho báo cáo đơn vị và kỳ họp.
  for (const [i, week] of ctx.weeks.entries()) {
    const info = conn
      .prepare(
        `INSERT INTO report_periods (code, label, period_start, period_end, status, created_at)
         VALUES (?,?,?,?,?,?)`,
      )
      .run(`W${String(i + 1).padStart(2, '0')}`, `Tuần ${weekLabel(week)}`, week, addDays(week, 6),
           i === ctx.weeks.length - 1 ? 'open' : 'closed', ctx.now);
    ctx.ids.period.push(Number(info.lastInsertRowid));
  }

  // Kỳ họp gắn 1-1 với kỳ báo cáo cho 4 tuần gần nhất.
  for (let i = ctx.weeks.length - 4; i < ctx.weeks.length; i++) {
    const week = ctx.weeks[i];
    const info = conn
      .prepare(
        `INSERT INTO meeting_periods (report_period_id, label, meeting_date, status, created_at)
         VALUES (?,?,?,?,?)`,
      )
      .run(ctx.ids.period[i], `Họp vận hành tuần ${weekLabel(week)}`, addDays(week, 5),
           i === ctx.weeks.length - 1 ? 'planned' : 'done', ctx.now);
    ctx.ids.meeting.push(Number(info.lastInsertRowid));
  }

  const categories = conn.prepare("SELECT * FROM report_category_defs WHERE version = 1 ORDER BY seq").all() as any[];

  /** Trạng thái báo cáo theo kịch bản; một đơn vị cố ý CHƯA GỬI để phân biệt với "Ổn". */
  const reportPlan: Record<string, Record<string, string>> = {
    CG: { enrollment_class: 'ok', teaching_quality: 'ok', students_parents: 'watch', teacher_staffing: 'ok', curriculum: 'ok' },
    HD: { enrollment_class: 'watch', teaching_quality: 'problem', students_parents: 'watch', teacher_staffing: 'problem', curriculum: 'ok' },
    TX: { enrollment_class: 'ok', teaching_quality: 'watch', students_parents: 'ok', teacher_staffing: 'ok', curriculum: 'watch' },
    LB: { enrollment_class: 'ok', teaching_quality: 'ok', students_parents: 'ok', teacher_staffing: 'watch', curriculum: 'ok' },
    TUTOR: { enrollment_class: 'ok', teaching_quality: 'watch', students_parents: 'ok', teacher_staffing: 'problem', curriculum: 'ok' },
  };
  const notePlan: Record<string, Record<string, string>> = {
    HD: {
      teaching_quality: 'Phản hồi của học viên về lớp FT-B02 giảm; cần dự giờ trong tuần tới.',
      teacher_staffing: 'Thiếu 1 giáo viên Writing, đang dùng giáo viên dạy thay.',
    },
    CG: { students_parents: 'Có 2 phụ huynh phản hồi về lịch bổ trợ chưa rõ ràng.' },
    TUTOR: { teacher_staffing: 'Ba tutor part-time xin giảm giờ trong tháng.' },
  };

  const unitAuthor: Record<string, number> = { CG: U['U002'], HD: U['U009'], TX: U['U010'], LB: U['U011'], TUTOR: U['U017'] };
  const reportIds: Record<string, number> = {};

  for (const [pi, periodId] of ctx.ids.period.entries()) {
    // 3 kỳ gần nhất mới có báo cáo, kỳ mới nhất thiếu HD và TUTOR để thử "chưa báo cáo".
    if (pi < ctx.ids.period.length - 3) continue;
    const isLatest = pi === ctx.ids.period.length - 1;
    for (const unitCode of ['CG', 'HD', 'TX', 'LB', 'TUTOR']) {
      if (isLatest && (unitCode === 'HD' || unitCode === 'TUTOR')) continue;   // chưa gửi
      const info = conn
        .prepare(
          `INSERT INTO branch_reports (reporting_unit_id, report_period_id, status, category_version, summary, submitted_at, author_user_id, created_at, updated_at)
           VALUES (?,?,?,1,?,?,?,?,?)`,
        )
        .run(UN[unitCode], periodId, isLatest ? 'draft' : 'submitted',
             null, isLatest ? null : ctx.now, unitAuthor[unitCode], ctx.now, ctx.now);
      const reportId = Number(info.lastInsertRowid);
      if (isLatest) reportIds[unitCode] = reportId;
      for (const c of categories) {
        conn
          .prepare(
            `INSERT INTO branch_report_categories (branch_report_id, category_key, category_label_snapshot, seq, status, note)
             VALUES (?,?,?,?,?,?)`,
          )
          .run(reportId, c.key, c.label, c.seq, reportPlan[unitCode][c.key] ?? 'ok', notePlan[unitCode]?.[c.key] ?? null);
      }
    }
  }

  // ---- Issues (12) ----
  const issueSpecs: {
    title: string; branch: string; risk: string; status: string; owner: string;
    classCode?: string; studentKey?: string; scopeType: string; source?: string; unitCode?: string; description: string;
  }[] = [
    { title: 'Học viên FT-A01 không hoàn thành bài tập nhiều tuần', branch: 'CG', risk: 'high', status: 'in_progress', owner: 'U002', classCode: 'FT-A01', studentKey: 'LOW_HW', scopeType: 'student', source: 'student', description: 'Bài Writing và Reading không nộp trong 4 tuần gần nhất. Cần GVCN trao đổi với phụ huynh.' },
    { title: 'Chuyên cần lớp FT-A01 giảm ở ca tối', branch: 'CG', risk: 'medium', status: 'discussing', owner: 'U002', classCode: 'FT-A01', scopeType: 'class', source: 'class', description: 'Tỷ lệ tham dự buổi chính giảm rõ ở hai tuần gần nhất.' },
    { title: 'Thiếu giáo viên Writing tại Hà Đông', branch: 'HD', risk: 'high', status: 'in_progress', owner: 'U009', scopeType: 'branch', source: 'branch_report', description: 'Đang phải dùng giáo viên dạy thay cho lớp FT-B01 và FT-B02.' },
    { title: 'Phản hồi chất lượng dạy học lớp FT-B02', branch: 'HD', risk: 'medium', status: 'open', owner: 'U009', classCode: 'FT-B02', scopeType: 'class', source: 'branch_report', description: 'Cần dự giờ và khảo sát nhanh học viên.' },
    { title: 'Giáo trình Foundation cần rà soát lại tuần 5–8', branch: 'TX', risk: 'medium', status: 'discussing', owner: 'U010', scopeType: 'branch', source: 'branch_report', description: 'Nội dung tuần 5 đến tuần 8 trùng lặp với phần đã học.' },
    { title: 'Học viên có ghi nhận cảnh báo cần theo dõi sát', branch: 'CG', risk: 'high', status: 'in_progress', owner: 'U005', classCode: 'FT-A01', studentKey: 'WARNED', scopeType: 'student', source: 'student', description: 'Đã ghi nhận cảnh báo, cần theo dõi 3 tuần.' },
    { title: 'Sĩ số lớp NM-B01 giảm sau tuần 4', branch: 'HD', risk: 'medium', status: 'open', owner: 'U009', classCode: 'NM-B01', scopeType: 'class', source: 'branch_report', description: 'Ba học viên xin bảo lưu trong cùng một tuần.' },
    { title: 'Lịch bổ trợ chưa rõ ràng với phụ huynh', branch: 'CG', risk: 'low', status: 'open', owner: 'U002', scopeType: 'branch', source: 'branch_report', description: 'Phụ huynh phản ánh không biết buổi bổ trợ diễn ra khi nào.' },
    { title: 'Tutor Part-time giảm giờ trong tháng', branch: 'CG', risk: 'medium', status: 'discussing', owner: 'U017', unitCode: 'TUTOR', scopeType: 'branch', source: 'branch_report', description: 'Ba tutor xin giảm giờ, ảnh hưởng lịch bổ trợ của các chi nhánh.' },
    { title: 'Tiến độ lớp FT-C01 chậm so với mốc đã đặt', branch: 'TX', risk: 'high', status: 'open', owner: 'U010', classCode: 'FT-C01', scopeType: 'class', source: 'class', description: 'Mốc Mock Test giữa kỳ đã quá hạn nhưng chưa hoàn thành.' },
    { title: 'Dữ liệu tuần chưa được cập nhật đầy đủ ở Long Biên', branch: 'LB', risk: 'low', status: 'resolved', owner: 'U011', scopeType: 'branch', source: 'manual', description: 'Đã nhắc giáo viên và bổ sung xong.' },
    { title: 'Cần rà soát lại phân công GVCN các lớp mới', branch: 'CG', risk: 'low', status: 'resolved', owner: 'U001', scopeType: 'branch', source: 'manual', description: 'Đã hoàn tất rà soát trong kỳ họp trước.' },
  ];

  const issueIds: number[] = [];
  for (const [i, spec] of issueSpecs.entries()) {
    const info = conn
      .prepare(
        `INSERT INTO issues
          (code, title, description, scope_type, branch_id, class_id, student_id, reporting_unit_id, risk_level,
           owner_user_id, status, source_type, source_branch_report_id, created_by, created_at, updated_at, resolved_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        padCode('ISS', i + 1, 4), spec.title, spec.description, spec.scopeType, B[spec.branch],
        spec.classCode ? ctx.ids.class[spec.classCode] : null,
        spec.studentKey ? ctx.ids.student[spec.studentKey] : null,
        spec.unitCode ? UN[spec.unitCode] : null,
        spec.risk, U[spec.owner], spec.status, spec.source ?? 'manual',
        spec.source === 'branch_report' ? (reportIds[spec.unitCode ?? spec.branch] ?? null) : null,
        U['U001'], addDays(DEMO_DATE, -20 + i), ctx.now,
        spec.status === 'resolved' ? addDays(DEMO_DATE, -5) : null,
      );
    issueIds.push(Number(info.lastInsertRowid));
  }
  conn.prepare('INSERT INTO issue_notes (issue_id, body, author_user_id, created_at) VALUES (?,?,?,?)')
    .run(issueIds[0], 'Đã liên hệ phụ huynh lần 1, chưa nhận phản hồi.', U['U005'], addDays(DEMO_DATE, -8) + 'T09:00:00Z');
  conn.prepare('INSERT INTO issue_notes (issue_id, body, author_user_id, created_at) VALUES (?,?,?,?)')
    .run(issueIds[2], 'Đã tuyển được 1 ứng viên, đang chờ xếp lịch dạy thử.', U['U009'], addDays(DEMO_DATE, -4) + 'T09:00:00Z');

  // Liên kết issue vào kỳ họp.
  const meetings = ctx.ids.meeting;
  const linkPlan: [number, number][] = [
    [0, meetings[1]], [1, meetings[2]], [2, meetings[0]], [2, meetings[1]], [2, meetings[3]],
    [3, meetings[2]], [4, meetings[2]], [5, meetings[3]], [6, meetings[3]], [8, meetings[2]], [9, meetings[3]],
  ];
  for (const [issueIdx, meetingId] of linkPlan) {
    conn.prepare('INSERT OR IGNORE INTO issue_meeting_links (issue_id, meeting_period_id) VALUES (?,?)').run(issueIds[issueIdx], meetingId);
  }

  const decisions: [number, number, string][] = [
    [meetings[0], issueIds[2], 'Ưu tiên tuyển giáo viên Writing cho Hà Đông trong 2 tuần, tạm thời phân công giáo viên dạy thay có hiệu lực rõ ràng.'],
    [meetings[1], issueIds[0], 'GVCN liên hệ phụ huynh trong tuần, nếu không cải thiện thì đưa vào diện theo dõi.'],
    [meetings[2], issueIds[3], 'Dự giờ lớp FT-B02 trước kỳ họp sau và khảo sát nhanh học viên.'],
    [meetings[2], issueIds[4], 'Rà soát nội dung tuần 5–8 của Foundation, đề xuất phiên bản chương trình mới nếu cần.'],
    [meetings[3], issueIds[5], 'Giữ chế độ theo dõi 3 tuần với học viên đã có ghi nhận cảnh báo.'],
  ];
  for (const [meetingId, issueId, decision] of decisions) {
    conn.prepare('INSERT INTO meeting_decisions (meeting_period_id, issue_id, decision, decided_by, created_at) VALUES (?,?,?,?,?)')
      .run(meetingId, issueId, decision, U['U001'], ctx.now);
  }
  const agenda: [number, string][] = [
    [meetings[2], 'Rà soát báo cáo các chi nhánh'],
    [meetings[2], 'Nhân sự giáo viên Hà Đông'],
    [meetings[2], 'Tiến độ chương trình Foundation'],
    [meetings[3], 'Rà soát báo cáo các chi nhánh'],
    [meetings[3], 'Việc còn tồn từ kỳ trước'],
    [meetings[3], 'Học viên cần chú ý'],
  ];
  for (const [i, [meetingId, title]] of agenda.entries()) {
    conn.prepare('INSERT INTO meeting_agenda_items (meeting_period_id, seq, title, created_by, created_at) VALUES (?,?,?,?,?)')
      .run(meetingId, (i % 3) + 1, title, U['U001'], ctx.now);
  }

  // ---- Tasks (20) ----
  const taskSpecs: {
    title: string; branch: string; assignee: string; status: string; deadlineOffset: number | null;
    priority: string; issueIdx?: number; studentKey?: string; classCode?: string; meetingIdx?: number;
    createdOffset: number; pausedReason?: string; unitCode?: string;
  }[] = [
    { title: 'Liên hệ phụ huynh học viên không nộp bài 4 tuần', branch: 'CG', assignee: 'U005', status: 'in_progress', deadlineOffset: -6, priority: 'high', issueIdx: 0, studentKey: 'LOW_HW', classCode: 'FT-A01', meetingIdx: 1, createdOffset: -18 },
    { title: 'Tuyển giáo viên Writing cho Hà Đông', branch: 'HD', assignee: 'U009', status: 'in_progress', deadlineOffset: -3, priority: 'high', issueIdx: 2, meetingIdx: 0, createdOffset: -25 },
    { title: 'Dự giờ lớp FT-B02 và ghi nhận phản hồi', branch: 'HD', assignee: 'U014', status: 'not_started', deadlineOffset: 2, priority: 'normal', issueIdx: 3, classCode: 'FT-B02', meetingIdx: 2, createdOffset: -6 },
    { title: 'Rà soát nội dung Foundation tuần 5–8', branch: 'TX', assignee: 'U010', status: 'paused', deadlineOffset: -9, priority: 'normal', issueIdx: 4, meetingIdx: 2, createdOffset: -14, pausedReason: 'Chờ ý kiến bộ phận chuyên môn về khung nội dung mới' },
    { title: 'Theo dõi học viên đã có ghi nhận cảnh báo trong 3 tuần', branch: 'CG', assignee: 'U005', status: 'in_progress', deadlineOffset: 9, priority: 'high', issueIdx: 5, studentKey: 'WARNED', classCode: 'FT-A01', meetingIdx: 3, createdOffset: -4 },
    { title: 'Làm rõ lịch bổ trợ và thông báo tới phụ huynh', branch: 'CG', assignee: 'U002', status: 'not_started', deadlineOffset: 5, priority: 'normal', issueIdx: 7, meetingIdx: 3, createdOffset: -3 },
    { title: 'Xác nhận lại giờ dạy của tutor part-time tháng này', branch: 'CG', assignee: 'U017', status: 'in_progress', deadlineOffset: 1, priority: 'normal', issueIdx: 8, unitCode: 'TUTOR', meetingIdx: 2, createdOffset: -9 },
    { title: 'Cập nhật tiến độ thực tế lớp FT-C01', branch: 'TX', assignee: 'U015', status: 'not_started', deadlineOffset: -1, priority: 'high', issueIdx: 9, classCode: 'FT-C01', meetingIdx: 3, createdOffset: -5 },
    { title: 'Bổ sung dữ liệu tuần còn thiếu ở Long Biên', branch: 'LB', assignee: 'U011', status: 'completed', deadlineOffset: -10, priority: 'normal', issueIdx: 10, meetingIdx: 0, createdOffset: -21 },
    { title: 'Rà soát phân công GVCN các lớp mới', branch: 'CG', assignee: 'U001', status: 'completed', deadlineOffset: -12, priority: 'low', issueIdx: 11, meetingIdx: 0, createdOffset: -23 },
    { title: 'Chuẩn bị báo cáo tiến độ học viên tháng 8', branch: 'CG', assignee: 'U005', status: 'completed', deadlineOffset: -8, priority: 'normal', classCode: 'FT-A01', meetingIdx: 1, createdOffset: -16 },
    { title: 'Khảo sát nhanh mức độ hài lòng học viên Hà Đông', branch: 'HD', assignee: 'U014', status: 'not_started', deadlineOffset: 12, priority: 'low', meetingIdx: 3, createdOffset: -2 },
    { title: 'Cập nhật ngưỡng tín hiệu sau khi thử nghiệm', branch: 'CG', assignee: 'U001', status: 'not_started', deadlineOffset: null, priority: 'low', createdOffset: -30 },
    { title: 'Kiểm tra danh sách học viên trùng tên trước khi nhập liệu', branch: 'CG', assignee: 'U002', status: 'in_progress', deadlineOffset: 3, priority: 'normal', createdOffset: -7 },
    { title: 'Đối chiếu sĩ số lớp NM-B01 sau bảo lưu', branch: 'HD', assignee: 'U009', status: 'not_started', deadlineOffset: 4, priority: 'normal', issueIdx: 6, classCode: 'NM-B01', meetingIdx: 3, createdOffset: -3 },
    { title: 'Lên kế hoạch bổ trợ Speaking cho nhóm band thấp', branch: 'CG', assignee: 'U005', status: 'not_started', deadlineOffset: 7, priority: 'normal', classCode: 'FT-A01', createdOffset: -2 },
    { title: 'Xác nhận lịch thi thử tháng 10', branch: 'TX', assignee: 'U010', status: 'not_started', deadlineOffset: 14, priority: 'low', createdOffset: -1 },
    { title: 'Rà soát dữ liệu bài tập của lớp FT-D01', branch: 'LB', assignee: 'U011', status: 'in_progress', deadlineOffset: 6, priority: 'normal', classCode: 'FT-D01', createdOffset: -11 },
    { title: 'Chuẩn hoá mô tả buổi bổ trợ trong ghi nhận hoạt động', branch: 'CG', assignee: 'U002', status: 'paused', deadlineOffset: 8, priority: 'low', createdOffset: -28, pausedReason: 'Chờ chốt cách ghi nhận buổi bổ trợ sau khi dùng thử bản demo' },
    { title: 'Chuẩn bị nội dung họp vận hành tuần tới', branch: 'CG', assignee: 'U001', status: 'in_progress', deadlineOffset: 2, priority: 'normal', meetingIdx: 3, createdOffset: -2 },
  ];

  for (const [i, t] of taskSpecs.entries()) {
    const deadline = t.deadlineOffset === null ? null : addDays(DEMO_DATE, t.deadlineOffset);
    const info = conn
      .prepare(
        `INSERT INTO tasks
          (code, title, detail, assignee_user_id, branch_id, reporting_unit_id, scope_type, student_id, class_id, issue_id,
           source_type, source_meeting_period_id, priority, status, deadline, original_deadline, paused_reason,
           created_by, created_at, updated_at, completed_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        padCode('TASK', i + 1, 4), t.title, null, U[t.assignee], B[t.branch],
        t.unitCode ? UN[t.unitCode] : null, t.unitCode ? 'reporting_unit' : 'branch',
        t.studentKey ? ctx.ids.student[t.studentKey] : null,
        t.classCode ? ctx.ids.class[t.classCode] : null,
        t.issueIdx !== undefined ? issueIds[t.issueIdx] : null,
        t.meetingIdx !== undefined ? 'meeting' : t.issueIdx !== undefined ? 'issue' : 'manual',
        t.meetingIdx !== undefined ? meetings[t.meetingIdx] : null,
        t.priority, t.status, deadline, deadline, t.pausedReason ?? null,
        U['U001'], addDays(DEMO_DATE, t.createdOffset) + 'T08:00:00Z', ctx.now,
        t.status === 'completed' ? addDays(DEMO_DATE, (t.deadlineOffset ?? -5) + 1) + 'T10:00:00Z' : null,
      );
    const taskId = Number(info.lastInsertRowid);
    if (t.status === 'completed') {
      conn.prepare('INSERT INTO task_history (task_id, field, old_value, new_value, actor_user_id, created_at) VALUES (?,?,?,?,?,?)')
        .run(taskId, 'status', 'in_progress', 'completed', U[t.assignee], ctx.now);
    }
    if (t.pausedReason) {
      conn.prepare('INSERT INTO task_history (task_id, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?,?,?,?,?,?,?)')
        .run(taskId, 'status', 'in_progress', 'paused', t.pausedReason, U[t.assignee], ctx.now);
    }
    conn
      .prepare(
        `INSERT OR IGNORE INTO notifications (user_id, kind, title, body, entity_type, entity_id, source, dedup_key, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .run(U[t.assignee], 'task_assigned', `Bạn được giao công việc ${padCode('TASK', i + 1, 4)}`, t.title,
           'task', taskId, t.meetingIdx !== undefined ? 'meeting' : 'manual', `task_assigned:${taskId}`, ctx.now);
  }

  conn
    .prepare(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, created_at)
       VALUES (?, 'seed.load', 'system', NULL, 'Nạp dữ liệu demo', ?)`,
    )
    .run(U['U001'], ctx.now);
}

function summarise() {
  const conn = db();
  const count = (t: string) => (conn.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as any).n as number;
  return {
    demoDate: DEMO_DATE,
    branches: count('branches'),
    reportingUnits: count('reporting_units'),
    classes: count('classes'),
    students: count('students'),
    enrollments: count('enrollments'),
    users: count('users'),
    weeklyRecords: count('weekly_learning_records'),
    assessments: count('assessments'),
    estimates: count('teacher_estimates'),
    issues: count('issues'),
    tasks: count('tasks'),
    reportPeriods: count('report_periods'),
    meetingPeriods: count('meeting_periods'),
    branchReports: count('branch_reports'),
  };
}
