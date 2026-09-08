import { db, recreateSchema, tx } from '../db.ts';
import {
  BRANCH_REPORT_CATEGORIES, ENTRY_SKILLS, PERMISSION_LABEL, TUTOR_REPORT_CATEGORIES,
  type EntrySkill,
} from '../../../shared/domain.ts';
import { addDays, normalizeName, nowIso, padCode } from '../util.ts';
import { setConfig } from '../demoConfig.ts';
import { LISTENING_BY_RAW, READING_BY_RAW, roundToHalf } from '../services/scoring.ts';
import { ensurePeriod, mondayOf, weekInfo } from '../services/week.ts';
import {
  BRANCHES, CASE_PATTERNS, CLASSES, COMMITTED_SCORES, DEMO_DATE, GIVEN_NAMES,
  MIDDLE_NAMES, MT_OUTCOMES, ROLES, ROLE_PERMISSIONS, SURNAMES,
  type CasePattern, type ClassSeed, type Outcome,
} from './data.ts';

/** Bộ sinh số giả ngẫu nhiên có hạt giống cố định: chạy lại seed cho ra đúng dữ liệu cũ. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const NOW = nowIso();

export function runSeed() {
  recreateSchema();
  const conn = db();

  return tx(() => {
    // ---------------------------------------------------------------- tổ chức
    const branchId = new Map<string, number>();
    for (const b of BRANCHES) {
      const info = conn.prepare('INSERT INTO branches (code, name, status, created_at) VALUES (?,?,?,?)')
        .run(b.code, b.name, 'active', NOW);
      branchId.set(b.code, Number(info.lastInsertRowid));
    }

    // Đơn vị báo cáo = 5 chi nhánh + Tutor part-time. Tutor KHÔNG phải chi nhánh thứ sáu.
    let seq = 0;
    for (const b of BRANCHES) {
      conn.prepare('INSERT INTO reporting_units (code, name, branch_id, kind, seq, status) VALUES (?,?,?,?,?,?)')
        .run(b.code, b.name, branchId.get(b.code)!, 'branch', seq++, 'active');
    }
    conn.prepare('INSERT INTO reporting_units (code, name, branch_id, kind, seq, status) VALUES (?,?,?,?,?,?)')
      .run('TUTOR', 'Tutor part-time', null, 'department', seq++, 'active');

    // ---------------------------------------------------------------- vai trò & quyền
    const permId = new Map<string, number>();
    for (const [key, label] of Object.entries(PERMISSION_LABEL)) {
      const info = conn.prepare('INSERT INTO permissions (key, name_vi) VALUES (?,?)').run(key, label);
      permId.set(key, Number(info.lastInsertRowid));
    }
    const roleId = new Map<string, number>();
    for (const r of ROLES) {
      const info = conn.prepare('INSERT INTO roles (key, name_vi) VALUES (?,?)').run(r.key, r.name);
      roleId.set(r.key, Number(info.lastInsertRowid));
      for (const p of ROLE_PERMISSIONS[r.key]) {
        conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)')
          .run(Number(info.lastInsertRowid), permId.get(p)!);
      }
    }

    // ---------------------------------------------------------------- người dùng
    const rand = rng(20260923);
    let userSeq = 0;
    const usedNames = new Set<string>();
    const fakeName = () => {
      for (;;) {
        const n = `${SURNAMES[Math.floor(rand() * SURNAMES.length)]} ${MIDDLE_NAMES[Math.floor(rand() * MIDDLE_NAMES.length)]} ${GIVEN_NAMES[Math.floor(rand() * GIVEN_NAMES.length)]}`;
        if (!usedNames.has(n)) { usedNames.add(n); return n; }
      }
    };
    const addUser = (name: string, title: string) => {
      userSeq += 1;
      const info = conn.prepare('INSERT INTO users (code, full_name, email, title, status, created_at) VALUES (?,?,?,?,?,?)')
        .run(padCode('NV', userSeq, 3), name, null, title, 'active', NOW);
      return Number(info.lastInsertRowid);
    };
    const grant = (userId: number, role: string, branch: string | null) =>
      conn.prepare('INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,?,?)')
        .run(userId, roleId.get(role)!, branch ? branchId.get(branch)! : null, 'active', NOW);

    const adminId = addUser(fakeName(), 'Admin hệ thống');
    grant(adminId, 'admin', null);

    const branchAdmins = new Map<string, number>();
    const managers = new Map<string, number[]>();
    const teacherPool = new Map<string, number[]>();
    // 2–3 quản lý mỗi chi nhánh, đúng thực tế vận hành nhiều quản lý cùng một nơi.
    const MANAGER_COUNT: Record<string, number> = { MB: 3, BC: 2, CP: 3, HD: 2, UB: 2 };

    for (const b of BRANCHES) {
      const ba = addUser(fakeName(), `Admin chi nhánh ${b.name}`);
      grant(ba, 'branch_admin', b.code);
      branchAdmins.set(b.code, ba);

      const ms: number[] = [];
      for (let i = 0; i < MANAGER_COUNT[b.code]; i += 1) {
        const m = addUser(fakeName(), `Quản lý ${b.name}`);
        grant(m, 'manager', b.code);
        ms.push(m);
      }
      managers.set(b.code, ms);

      const ts: number[] = [];
      for (let i = 0; i < 5; i += 1) {
        const t = addUser(fakeName(), 'Giáo viên');
        grant(t, 'teacher', b.code);
        ts.push(t);
      }
      teacherPool.set(b.code, ts);
    }

    // ---------------------------------------------------------------- lớp & phân công
    const classId = new Map<string, number>();
    CLASSES.forEach((c, idx) => {
      const info = conn
        .prepare(
          `INSERT INTO classes (code, branch_id, kind, route, is_fulltime, start_date, status, note, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)`,
        )
        .run(c.code, branchId.get(c.branch)!, c.kind, c.route, c.isFulltime ? 1 : 0, c.startDate, 'active', null, NOW);
      const id = Number(info.lastInsertRowid);
      classId.set(c.code, id);

      // Kỹ năng lớp học do quản lý cấu hình. Ở demo mọi lớp học đủ năm ô nhập điểm.
      for (const skill of ENTRY_SKILLS) {
        conn.prepare('INSERT INTO class_skills (class_id, skill, sessions_per_week) VALUES (?,?,?)')
          .run(id, skill, skill === 'writing1' || skill === 'writing2' ? 1 : 2);
      }

      // GVCN và GVBM là PHÂN CÔNG trong lớp, không phải hai loại tài khoản.
      // W1 và W2 giao cho hai người khác nhau — có giáo viên chỉ dạy một trong hai task.
      const pool = teacherPool.get(c.branch)!;
      const pick = (offset: number) => pool[(idx + offset) % pool.length];
      const assign = (userId: number, skill: string | null, isCore: boolean) =>
        conn
          .prepare(
            `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
             VALUES (?,?,?,?,?,?,?)`,
          )
          .run(userId, id, skill, isCore ? 1 : 0, c.startDate, 'active', NOW);

      assign(pick(0), null, true);              // GVCN — được dời lịch, KHÔNG tự có quyền sửa mọi điểm
      assign(pick(1), 'listening', false);
      assign(pick(1), 'reading', false);
      assign(pick(2), 'writing1', false);
      assign(pick(3), 'writing2', false);
      assign(pick(4), 'speaking', false);
    });

    // ---------------------------------------------------------------- kỳ báo cáo
    // Đủ các tuần từ lớp mở sớm nhất tới một tháng sau ngày demo.
    let cursor = mondayOf('2026-05-25');
    const lastWeek = mondayOf(addDays(DEMO_DATE, 35));
    while (cursor <= lastWeek) {
      ensurePeriod(cursor);
      cursor = addDays(cursor, 7);
    }
    const currentPeriod = ensurePeriod(DEMO_DATE);

    // ---------------------------------------------------------------- học viên & Mock
    conn.prepare('INSERT INTO student_code_seq (id, next_value) VALUES (1, 1)').run();
    const nextStudentCode = () => {
      const row = conn.prepare('SELECT next_value FROM student_code_seq WHERE id = 1').get() as any;
      conn.prepare('UPDATE student_code_seq SET next_value = next_value + 1 WHERE id = 1').run();
      return padCode('PISA', row.next_value);
    };

    const counts = { students: 0, attempts: 0, scores: 0, cases: 0 };
    const allStudents: { id: number; classCode: string; branch: string }[] = [];

    CLASSES.forEach((c, classIdx) => {
      const cid = classId.get(c.code)!;
      for (let i = 0; i < c.students; i += 1) {
        const name = fakeName();
        // Chỉ lớp FT LT1/LT2 có điểm cam kết — kỳ vọng và SOS chỉ áp dụng cho lộ trình này.
        const committed = c.route ? COMMITTED_SCORES[i % COMMITTED_SCORES.length] : null;
        const info = conn
          .prepare(
            `INSERT INTO students (student_code, full_name, normalized_name, dob, committed_score, route,
                                   exam_date, branch_id, status, note, created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          )
          .run(nextStudentCode(), name, normalizeName(name), null, committed, c.route,
               c.route ? addDays(c.startDate, 200) : null, branchId.get(c.branch)!, 'active', null, NOW);
        const sid = Number(info.lastInsertRowid);
        counts.students += 1;
        allStudents.push({ id: sid, classCode: c.code, branch: c.branch });

        conn.prepare('INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?,?,?,?)')
          .run(sid, cid, 'active', c.startDate, NOW);
        conn
          .prepare(
            `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at)
             VALUES (?,?,?,?,?,?,?)`,
          )
          .run(sid, 'enrollment', c.startDate, `Vào lớp ${c.code}`, null, adminId, NOW);

        seedMocks(conn, { c, classIdx, cid, sid, studentIdx: i, committed, adminId, branchAdmins, counts });
      }
    });

    // ---------------------------------------------------------------- tình huống riêng
    seedSpecialCases(conn, { classId, allStudents, adminId, branchAdmins, managers, counts });

    // ---------------------------------------------------------------- họp tuần
    const tasks = seedMeeting(conn, { branchId, managers, branchAdmins, adminId, currentPeriodId: currentPeriod.id });

    setConfig('demo_date', DEMO_DATE);
    setConfig('scenario_mode', 'normal');
    setConfig('seeded_at', NOW);

    return {
      'Chi nhánh': BRANCHES.length,
      'Lớp': CLASSES.length,
      'Người dùng': userSeq,
      'Học viên': counts.students,
      'Lượt Mock': counts.attempts,
      'Ô điểm': counts.scores,
      'Case SOS': counts.cases,
      'Kỳ họp tuần': (conn.prepare('SELECT COUNT(*) AS n FROM report_periods').get() as any).n,
      'Công việc': tasks,
      'Ngày demo': DEMO_DATE,
    };
  });
}

// ==================================================================== Mock & điểm

/** Tìm số câu đúng cho một band; dùng để dựng dữ liệu điểm thô hợp lệ. */
function rawFor(skill: 'listening' | 'reading', band: number): number {
  const table = skill === 'listening' ? LISTENING_BY_RAW : READING_BY_RAW;
  const idx = table.indexOf(band);
  return idx >= 0 ? idx : table.findIndex((b) => b >= band);
}

/** Bốn tiêu chí có trung bình đúng bằng band, biến thiên nhẹ cho giống thật. */
function criteriaFor(band: number): [number, number, number, number] {
  const up = Math.min(9, band + 0.5);
  const down = Math.max(0, band - 0.5);
  return [band, up, down, band];
}

const OUTCOME_SKILL_ORDER: ('listening' | 'reading' | 'writing' | 'speaking')[] =
  ['listening', 'reading', 'writing', 'speaking'];

function seedMocks(conn: any, ctx: {
  c: ClassSeed; classIdx: number; cid: number; sid: number; studentIdx: number;
  committed: number | null; adminId: number; branchAdmins: Map<string, number>;
  counts: { students: number; attempts: number; scores: number; cases: number };
}) {
  const { c, classIdx, cid, sid, studentIdx, committed, adminId, counts } = ctx;
  if (!c.plan.length || committed === null) return;
  const recorder = ctx.branchAdmins.get(c.branch)!;

  for (const step of c.plan) {
    const outcome: Outcome = MT_OUTCOMES[studentIdx % MT_OUTCOMES.length][step.attemptNo - 1] ?? { fails: 0 };
    const info = conn
      .prepare(
        `INSERT INTO mock_attempts (student_id, attempt_no, class_id, planned_date, status,
                                    committed_score_at_test, note, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .run(sid, step.attemptNo, cid, step.date, step.taken ? 'completed' : 'planned', committed, null, adminId, NOW);
    const attemptId = Number(info.lastInsertRowid);
    counts.attempts += 1;
    conn
      .prepare(
        `INSERT INTO mock_schedule_history (attempt_id, action, new_date, reason, actor_user_id, created_at)
         VALUES (?, 'created', ?, ?, ?, ?)`,
      )
      .run(attemptId, step.date, 'Kế hoạch đầu khoá', adminId, NOW);
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, ref_table, ref_id, created_by, created_at)
         VALUES (?, 'mock_scheduled', ?, ?, 'mock_attempts', ?, ?, ?)`,
      )
      .run(sid, step.date, `Lên lịch MT${step.attemptNo}`, attemptId, adminId, NOW);

    if (!step.taken) continue;

    const expectation = committed - (step.attemptNo === 1 ? 1 : step.attemptNo === 2 ? 0.5 : 0);
    const missing = new Set(outcome.missing ?? []);
    // Kỹ năng trượt lấy từ cuối danh sách để mỗi mức SOS có tổ hợp kỹ năng khác nhau.
    const failing = new Set(OUTCOME_SKILL_ORDER.slice(4 - outcome.fails));

    const bandOf = (assessed: string) =>
      failing.has(assessed as any) ? Math.max(1, expectation - 0.5) : expectation + (studentIdx % 2 === 0 ? 0.5 : 0);

    // Speaking thi trước một tuần khi splitWeek — mỗi kỹ năng có ngày thi riêng.
    const dateOf = (skill: EntrySkill) =>
      outcome.splitWeek && skill === 'speaking' ? addDays(step.date, -7) : step.date;

    for (const skill of ENTRY_SKILLS) {
      if (missing.has(skill)) continue;
      const testDate = dateOf(skill);
      const resultDate = addDays(testDate, 2 + (studentIdx % 3));
      if (skill === 'listening' || skill === 'reading') {
        const band = bandOf(skill);
        const raw = rawFor(skill, band);
        const realBand = (skill === 'listening' ? LISTENING_BY_RAW : READING_BY_RAW)[raw];
        conn
          .prepare(
            `INSERT INTO mock_scores (attempt_id, skill, test_date, raw_score, band, result_date, entered_by, entered_at)
             VALUES (?,?,?,?,?,?,?,?)`,
          )
          .run(attemptId, skill, testDate, raw, realBand, resultDate, recorder, NOW);
      } else {
        const assessed = skill === 'speaking' ? 'speaking' : 'writing';
        const target = bandOf(assessed);
        // Band Writing = (W1 + W2×2)/3: đặt W1 cao hơn nửa band vẫn cho ra đúng band mục tiêu.
        const band = skill === 'writing1' ? Math.min(9, target + 0.5) : target;
        const crit = criteriaFor(band);
        conn
          .prepare(
            `INSERT INTO mock_scores (attempt_id, skill, test_date, c1, c2, c3, c4, band, result_date, entered_by, entered_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          )
          .run(attemptId, skill, testDate, crit[0], crit[1], crit[2], crit[3],
               roundToHalf((crit[0] + crit[1] + crit[2] + crit[3]) / 4), resultDate, recorder, NOW);
      }
      counts.scores += 1;
    }

    if (missing.size === 0 && outcome.fails > 0) {
      const pattern = CASE_PATTERNS[(classIdx + studentIdx + step.attemptNo) % CASE_PATTERNS.length];
      seedCase(conn, {
        attemptId, sid, attemptNo: step.attemptNo, level: Math.min(3, outcome.fails),
        testDate: step.date, pattern, recorder, counts,
      });
    }
  }
}

/** Tên người thực hiện từng bước. CS làm ngoài hệ thống nên chỉ ghi tên, không cần tài khoản. */
const TEACHER_HANDLERS = ['GVCN Thu Trang', 'GVBM Minh Khoa', 'GVCN Bảo Nam', 'GVBM Gia Hân', 'GVCN Quang Duy'];
const CS_HANDLERS = ['CS Ngọc Diệp', 'CS Hải Yến', 'CS Thanh Vân', 'CS Bảo Ngân'];

function seedCase(conn: any, o: {
  attemptId: number; sid: number; attemptNo: number; level: number; testDate: string;
  pattern: CasePattern; recorder: number;
  counts: { students: number; attempts: number; scores: number; cases: number };
}) {
  const cols: Record<string, unknown> = { status: 'open' };
  const h = TEACHER_HANDLERS[(o.attemptId + o.level) % TEACHER_HANDLERS.length];
  const cs = CS_HANDLERS[(o.attemptId + 2) % CS_HANDLERS.length];

  if (o.pattern === 'named_only') {
    // Có tên người làm nhưng CHƯA có ngày → chưa được tính là đã thực hiện.
    cols.talk_student_person = h;
    cols.talk_parent_person = cs;
    cols.status = 'open';
  } else if (o.pattern === 'in_progress') {
    cols.talk_student_person = h;
    cols.talk_student_date = addDays(o.testDate, 4);
    cols.talk_parent_person = cs;
    cols.talk_parent_date = addDays(o.testDate, 5);
    cols.academic_support = o.level === 3 ? 'Học tutor đến lần mock sau' : 'Xếp tự học 1 tháng';
    cols.academic_person = h;
    cols.academic_start_date = addDays(o.testDate, 7);
    cols.status = 'in_progress';
  } else if (o.pattern === 'done') {
    cols.talk_student_person = h;
    cols.talk_student_date = addDays(o.testDate, 3);
    cols.talk_parent_person = cs;
    cols.talk_parent_date = addDays(o.testDate, 3);
    cols.academic_support = o.level === 3 ? 'Học tutor đến lúc thi' : 'Xếp tự học 1 tháng';
    cols.academic_person = h;
    cols.academic_start_date = addDays(o.testDate, 6);
    if (o.attemptNo >= 3 && o.level >= 2) {
      cols.ops_policy = 'Buổi bổ trợ với tutor';
      cols.ops_date = addDays(o.testDate, 8);
    }
    if (o.level === 3 && o.attemptNo >= 2) { cols.meeting_kind = 'CX / GĐCN meeting HS'; cols.meeting_date = addDays(o.testDate, 5); }
    else if (o.level === 3 || (o.level === 2 && o.attemptNo >= 2)) { cols.meeting_kind = 'GVCN meeting HS'; cols.meeting_date = addDays(o.testDate, 5); }
    cols.status = 'done';
    cols.head_confirmed_by = o.recorder;
    cols.head_confirmed_at = addDays(o.testDate, 10);
  }

  const keys = ['attempt_id', 'sos_level', ...Object.keys(cols), 'created_at'];
  const values = [o.attemptId, o.level, ...Object.values(cols), NOW];
  conn.prepare(`INSERT INTO sos_cases (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...values);
  o.counts.cases += 1;

  conn
    .prepare(
      `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, ref_table, ref_id, created_by, created_at)
       VALUES (?, 'mock_result', ?, ?, ?, 'mock_attempts', ?, ?, ?)`,
    )
    .run(o.sid, o.testDate, `MT${o.attemptNo}: SOS ${o.level}`, `${o.level} kỹ năng dưới kỳ vọng`,
         o.attemptId, o.recorder, NOW);
}

// ==================================================================== tình huống riêng

function seedSpecialCases(conn: any, ctx: {
  classId: Map<string, number>;
  allStudents: { id: number; classCode: string; branch: string }[];
  adminId: number; branchAdmins: Map<string, number>; managers: Map<string, number[]>;
  counts: { students: number; attempts: number; scores: number; cases: number };
}) {
  const { classId, allStudents, adminId, managers } = ctx;
  const inClass = (code: string) => allStudents.filter((s) => s.classCode === code);

  // 1) Dời lịch: cùng một lần MT, đổi ngày, giữ lịch sử — KHÔNG tạo lượt thi mới.
  const rescheduled = inClass('CP-FT 110')[0];
  if (rescheduled) {
    const a = conn.prepare(`SELECT * FROM mock_attempts WHERE student_id = ? AND status='planned' LIMIT 1`)
      .get(rescheduled.id) as any;
    if (a) {
      const newDate = addDays(a.planned_date, 2);
      conn.prepare('UPDATE mock_attempts SET planned_date = ?, updated_at = ? WHERE id = ?').run(newDate, NOW, a.id);
      conn
        .prepare(
          `INSERT INTO mock_schedule_history (attempt_id, action, old_date, new_date, reason, actor_user_id, created_at)
           VALUES (?, 'rescheduled', ?, ?, ?, ?, ?)`,
        )
        .run(a.id, a.planned_date, newDate, 'Trùng lịch phòng thi', managers.get('CP')![0], NOW);
      conn
        .prepare(
          `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, ref_table, ref_id, created_by, created_at)
           VALUES (?, 'mock_rescheduled', ?, ?, ?, 'mock_attempts', ?, ?, ?)`,
        )
        .run(rescheduled.id, newDate, 'Dời lịch MT2', 'Trùng lịch phòng thi', a.id, managers.get('CP')![0], NOW);
    }
  }

  // 2) Huỷ lịch: giữ nguyên dấu vết, không tính vào "đã thi" hay "thiếu điểm".
  const cancelled = inClass('HD-FT 302')[1];
  if (cancelled) {
    const a = conn.prepare(`SELECT * FROM mock_attempts WHERE student_id = ? AND status='planned' LIMIT 1`)
      .get(cancelled.id) as any;
    if (a) {
      conn.prepare(`UPDATE mock_attempts SET status='cancelled', cancel_reason=?, cancelled_at=?, updated_at=? WHERE id=?`)
        .run('Học sinh nghỉ ốm dài ngày', NOW, NOW, a.id);
      conn
        .prepare(
          `INSERT INTO mock_schedule_history (attempt_id, action, old_date, reason, actor_user_id, created_at)
           VALUES (?, 'cancelled', ?, ?, ?, ?)`,
        )
        .run(a.id, a.planned_date, 'Học sinh nghỉ ốm dài ngày', managers.get('HD')![0], NOW);
    }
  }

  // 3) Chuyển lớp: lần Mock ĐÃ THI giữ lớp cũ, lịch chưa thi chuyển sang lớp mới.
  const moved = inClass('MB-FT 101')[2];
  const toClass = classId.get('MB-FT 102');
  if (moved && toClass) {
    const cur = conn.prepare(`SELECT * FROM enrollments WHERE student_id = ? AND status='active'`).get(moved.id) as any;
    conn.prepare(`UPDATE enrollments SET status='transferred', ended_at=?, end_reason=? WHERE id=?`)
      .run('2026-09-14', 'Chuyển ca học buổi chiều', cur.id);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
      .run(moved.id, toClass, '2026-09-14', NOW);
    conn.prepare(`UPDATE mock_attempts SET class_id = ? WHERE student_id = ? AND status = 'planned'`)
      .run(toClass, moved.id);
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at)
         VALUES (?, 'transfer', ?, ?, ?, ?, ?)`,
      )
      .run(moved.id, '2026-09-14', 'Chuyển sang lớp MB-FT 102', 'Chuyển ca học buổi chiều', adminId, NOW);
  }

  // 4) Tạm dừng rồi quay lại học — hai sự kiện này phải còn trong bộ lọc "Tất cả".
  const paused = inClass('BC-FT 205')[4];
  if (paused) {
    for (const e of [
      { type: 'pause', date: '2026-08-24', title: 'Tạm dừng học', detail: 'Gia đình xin nghỉ 2 tuần' },
      { type: 'resume', date: '2026-09-07', title: 'Quay lại học', detail: null },
    ]) {
      conn
        .prepare(
          `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .run(paused.id, e.type, e.date, e.title, e.detail, adminId, NOW);
    }
  }

  // 5) Warning / WL và ước lượng giáo viên: dữ liệu lịch sử để thử bộ lọc hành trình.
  //    MVP không phát hành WL mới, chỉ đọc lại những gì đã có.
  const warned = inClass('UB-FT 401')[5];
  if (warned) {
    for (const e of [
      { type: 'estimate', date: '2026-08-31', title: 'Ước lượng giáo viên: 5.5', detail: 'GVCN đánh giá giữa kỳ' },
      { type: 'warning', date: '2026-09-07', title: 'Cảnh báo chuyên cần', detail: 'Vắng 3 buổi liên tiếp' },
    ]) {
      conn
        .prepare(
          `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .run(warned.id, e.type, e.date, e.title, e.detail, adminId, NOW);
    }
  }
}

// ==================================================================== họp tuần

function seedMeeting(conn: any, ctx: {
  branchId: Map<string, number>; managers: Map<string, number[]>;
  branchAdmins: Map<string, number>; adminId: number; currentPeriodId: number;
}) {
  const { branchId, managers, adminId, currentPeriodId } = ctx;
  const units = conn.prepare('SELECT * FROM reporting_units ORDER BY seq').all() as any[];
  const prev = conn
    .prepare('SELECT * FROM report_periods WHERE id < ? ORDER BY id DESC LIMIT 1')
    .get(currentPeriodId) as any;

  const NOTES: Record<string, string[]> = {
    ok: ['Không có vấn đề nổi bật trong tuần.', 'Lịch dạy chạy đúng kế hoạch.'],
    watch: ['Hai lớp thiếu giáo viên dự phòng ca tối.', 'Một số học viên nghỉ nhiều, đã liên hệ phụ huynh.'],
    problem: ['Giáo trình Writing bản mới thiếu đáp án, cần in bổ sung.', 'Ba học viên chưa nộp bài Speaking hai tuần liền.'],
  };

  const cellsOf = (u: any) => (u.kind === 'branch' ? BRANCH_REPORT_CATEGORIES : TUTOR_REPORT_CATEGORIES);
  const save = (unit: any, periodId: number, key: string, label: string, status: string | null, note: string | null, by: number) =>
    conn
      .prepare(
        `INSERT INTO unit_reports (reporting_unit_id, period_id, category_key, category_label, status, note, reporter_user_id, updated_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .run(unit.id, periodId, key, label, status, note, by, NOW);

  units.forEach((u, ui) => {
    const reporter = u.branch_id
      ? (managers.get(BRANCHES[ui]?.code ?? 'MB')?.[0] ?? adminId)
      : adminId;
    // Kỳ trước: báo cáo đầy đủ, để so sánh với kỳ hiện tại còn ô "Chưa báo cáo".
    if (prev) {
      cellsOf(u).forEach((cat, ci) => {
        const status = ci === 2 && ui % 2 === 0 ? 'problem' : ci === 1 ? 'watch' : 'ok';
        save(u, prev.id, cat.key, cat.label, status, NOTES[status][ci % 2], reporter);
      });
    }
    // Kỳ hiện tại: cố tình để trống một số ô. Ô trống là CHƯA BÁO CÁO, không phải "Ổn".
    cellsOf(u).forEach((cat, ci) => {
      if ((ui + ci) % 3 === 0) return;
      const status = (ui + ci) % 4 === 1 ? 'problem' : (ui + ci) % 4 === 2 ? 'watch' : 'ok';
      save(u, currentPeriodId, cat.key, cat.label, status, NOTES[status][ci % 2], reporter);
    });
  });

  // ---------------------------------------------------------------- công việc
  let n = 0;
  const addTask = (t: {
    title: string; unit?: any; branch?: string | null; assignee: number; due: string | null;
    progress: string; type: string; periodId: number | null; note?: string | null; completedAt?: string | null;
  }) => {
    n += 1;
    conn
      .prepare(
        `INSERT INTO tasks (code, period_id, task_type, title, reporting_unit_id, branch_id, assignee_user_id,
                            due_date, progress, note, source_type, created_by, created_at, completed_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(padCode('CV', n, 4), t.periodId, t.type, t.title, t.unit?.id ?? null,
           t.branch ? branchId.get(t.branch)! : null, t.assignee, t.due, t.progress, t.note ?? null,
           'manual', adminId, NOW, t.completedAt ?? null);
  };

  const unitOf = (code: string) => units.find((u) => u.code === code);
  const prevId = prev?.id ?? currentPeriodId;

  // Quá hạn từ kỳ trước — vẫn phải xuất hiện khi xem tuần này, giữ nguyên ID và lịch sử.
  addTask({ title: 'In bổ sung đáp án Writing bản mới cho 3 lớp FT', unit: unitOf('MB'), branch: 'MB',
    assignee: managers.get('MB')![0], due: '2026-09-18', progress: 'doing', type: 'in_period', periodId: prevId });
  addTask({ title: 'Bổ sung giáo viên dự phòng ca tối', unit: unitOf('BC'), branch: 'BC',
    assignee: managers.get('BC')![0], due: '2026-09-16', progress: 'not_started', type: 'in_period', periodId: prevId });
  // Sắp đến hạn trong 3 ngày.
  addTask({ title: 'Chốt danh sách học viên thi thật tháng 11', unit: unitOf('CP'), branch: 'CP',
    assignee: managers.get('CP')![1], due: '2026-09-25', progress: 'doing', type: 'in_period', periodId: currentPeriodId });
  // Hoàn thành sau hạn — KHÔNG được đánh dấu quá hạn nữa.
  addTask({ title: 'Rà soát lịch Mock tuần W3 SEP', unit: unitOf('HD'), branch: 'HD',
    assignee: managers.get('HD')![0], due: '2026-09-15', progress: 'done', type: 'in_period', periodId: prevId,
    completedAt: '2026-09-19T09:00:00.000Z' });
  // Không có hạn — không bao giờ tự tính quá hạn.
  addTask({ title: 'Sưu tầm đề Speaking part 2 theo chủ đề mới', unit: unitOf('TUTOR'), branch: null,
    assignee: adminId, due: null, progress: 'doing', type: 'long_term', periodId: currentPeriodId });
  // Dài hạn chưa xong — xét xuyên kỳ, không clone sang tuần mới.
  addTask({ title: 'Chuẩn hoá quy trình bàn giao lớp giữa các ca', unit: unitOf('UB'), branch: 'UB',
    assignee: managers.get('UB')![0], due: '2026-11-30', progress: 'doing', type: 'long_term', periodId: prevId });
  addTask({ title: 'Tuyển thêm 2 tutor part-time cho ca cuối tuần', unit: unitOf('TUTOR'), branch: null,
    assignee: adminId, due: '2026-10-15', progress: 'not_started', type: 'long_term', periodId: currentPeriodId });
  addTask({ title: 'Tạm dừng: đổi phần mềm chấm Speaking', unit: unitOf('MB'), branch: 'MB',
    assignee: managers.get('MB')![1], due: '2026-09-20', progress: 'paused', type: 'in_period', periodId: prevId,
    note: 'Chờ báo giá nhà cung cấp' });

  // Việc sinh ra từ một case SOS, giữ liên kết nguồn để mở lại đúng lần Mock.
  const someCase = conn.prepare('SELECT * FROM sos_cases WHERE sos_level = 3 ORDER BY id LIMIT 1').get() as any;
  if (someCase) {
    const at = conn
      .prepare('SELECT a.*, c.branch_id, c.code AS class_code, s.full_name FROM mock_attempts a JOIN classes c ON c.id=a.class_id JOIN students s ON s.id=a.student_id WHERE a.id = ?')
      .get(someCase.attempt_id) as any;
    const unit = units.find((u) => u.branch_id === at.branch_id) ?? null;
    n += 1;
    conn
      .prepare(
        `INSERT INTO tasks (code, period_id, task_type, title, reporting_unit_id, branch_id, assignee_user_id,
                            due_date, progress, note, source_type, source_sos_case_id, created_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(padCode('CV', n, 4), currentPeriodId, 'in_period',
           `Xếp lịch tutor cho ${at.full_name} (${at.class_code})`, unit?.id ?? null, at.branch_id, adminId,
           '2026-09-26', 'not_started', 'Sinh từ case SOS 3', 'sos_case', someCase.id, adminId, NOW);
  }
  return n;
}

export { weekInfo };
