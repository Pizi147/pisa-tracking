import { db, recreateSchema, tx } from '../db.ts';
import {
  BRANCH_REPORT_CATEGORIES, ENTRY_SKILLS, PERMISSION_LABEL, PROGRAMME_TEMPLATES,
  TUTOR_REPORT_CATEGORIES, programmeOf,
  type EntrySkill,
} from '../../../shared/domain.ts';
import { addDays, normalizeName, nowIso, padCode } from '../util.ts';
import { setConfig } from '../demoConfig.ts';
import { LISTENING_BY_RAW, READING_BY_RAW, roundToHalf } from '../services/scoring.ts';
import { ensurePeriod, mondayOf, weekInfo } from '../services/week.ts';
import {
  BRANCHES, CASE_PATTERNS, CLASSES, DEMO_DATE, GIVEN_NAMES, MIDDLE_NAMES, MT_OUTCOMES,
  ROLES, ROLE_PERMISSIONS, SURNAMES, TARGET_SCORES,
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

    const adminId = addUser(fakeName(), 'Quản trị hệ thống');
    grant(adminId, 'system_admin', null);

    const branchAdmins = new Map<string, number>();
    const managers = new Map<string, number[]>();
    const teacherPool = new Map<string, number[]>();
    // 2–3 quản lý mỗi chi nhánh, đúng thực tế vận hành nhiều quản lý cùng một nơi.
    /*
     * BẢN DEMO CỐ TÌNH ÍT NGƯỜI: mỗi chi nhánh đúng MỘT Quản lý và MỘT Admin văn phòng,
     * và một nhóm nhỏ giáo viên dạy nhiều lớp. Người dùng thử demo cần theo dõi được ai
     * đang làm gì, chứ không phải đọc một danh sách bốn mươi cái tên giả.
     *
     * Hệ thống vẫn CHO PHÉP một chi nhánh có nhiều quản lý — đó là dữ liệu, không phải luật.
     */
    const MANAGER_COUNT: Record<string, number> = { MB: 1, BC: 1, CP: 1, HD: 1, UB: 1 };
    // Ba giáo viên mỗi chi nhánh, mỗi người ôm vài kỹ năng ở nhiều lớp — giống thực tế
    // hơn là mỗi lớp một bộ giáo viên riêng, và dễ theo dõi hơn hẳn.
    const TEACHERS_PER_BRANCH = 3;

    for (const b of BRANCHES) {
      const ba = addUser(fakeName(), `Admin văn phòng ${b.name}`);
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
      for (let i = 0; i < TEACHERS_PER_BRANCH; i += 1) {
        const t = addUser(fakeName(), 'Giáo viên');
        grant(t, 'teacher', b.code);
        ts.push(t);
      }
      teacherPool.set(b.code, ts);
    }

    // ---------------------------------------------------------------- lớp & phân công
    /*
     * Chương trình học nằm trong BẢNG chứ không viết cứng trong mã: sau này trung tâm mở
     * một chương trình mới thì thêm dữ liệu, không phải sửa mã nguồn.
     */
    for (const t of Object.values(PROGRAMME_TEMPLATES)) {
      conn.prepare('INSERT INTO programmes (code, name, weeks, scoring_mode, status, created_at) VALUES (?,?,?,?,?,?)')
        .run(t.code, t.name, t.weeks, t.scoringMode, 'active', NOW);
      t.skills.forEach((skill, i) => {
        conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(t.code, skill, i);
      });
      for (const cp of t.checkpoints) {
        conn.prepare('INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES (?,?,?)')
          .run(t.code, cp.kind, cp.studyWeek);
      }
    }

    const classId = new Map<string, number>();
    CLASSES.forEach((c, idx) => {
      // `kind` giữ nguyên chữ người dùng gõ (kể cả mã cũ "FOUND"); `programme_code` là mã
      // đã chuẩn hoá mà mọi tính toán đọc vào. Không đổi mã lớp lịch sử.
      const programme = programmeOf(c.kind);
      const info = conn
        .prepare(
          `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fulltime, start_date, status, note, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(c.code, branchId.get(c.branch)!, c.kind, programme, c.route, c.isFulltime ? 1 : 0,
             c.startDate, 'active', null, NOW);
      const id = Number(info.lastInsertRowid);
      classId.set(c.code, id);

      // Kỹ năng lớp học do quản lý cấu hình, lấy theo chương trình của lớp.
      const skills = programme ? PROGRAMME_TEMPLATES[programme].skills : ENTRY_SKILLS;
      for (const skill of skills) {
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
      // Phân công theo ĐÚNG kỹ năng của chương trình lớp đó: lớp Foundation có
      // Pronunciation chứ không có Writing task 1/2, nên không giao những ô không tồn tại.
      skills.forEach((skill, i) => assign(pick(1 + (i % 4)), skill, false));
    });

    // ---------------------------------------------------------------- kỳ báo cáo
    // Đủ các tuần từ lớp mở sớm nhất tới ba tháng sau ngày demo, để còn lập kế hoạch trước.
    let cursor = mondayOf('2026-05-25');
    const lastWeek = mondayOf(addDays(DEMO_DATE, 98));
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

    const counts = { students: 0, cycles: 0, attempts: 0, scores: 0, cases: 0, estimates: 0, skips: 0 };
    const allStudents: { id: number; classCode: string; branch: string }[] = [];

    CLASSES.forEach((c, classIdx) => {
      const cid = classId.get(c.code)!;
      for (let i = 0; i < c.students; i += 1) {
        const name = fakeName();
        const info = conn
          .prepare(
            `INSERT INTO students (student_code, full_name, normalized_name, dob, branch_id, status,
                                   consultant_name, note, created_at)
             VALUES (?,?,?,?,?, 'active', ?,?,?)`,
          )
          .run(nextStudentCode(), name, normalizeName(name), null, branchId.get(c.branch)!,
               `TV ${SURNAMES[i % SURNAMES.length]}`, null, NOW);
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

        // Lộ trình: chỉ lớp FT mới có target và kỳ vọng. Lớp thường chưa áp dụng ở PR này.
        if (!c.route) continue;
        const target = TARGET_SCORES[i % TARGET_SCORES.length];
        const cycleInfo = conn
          .prepare(
            `INSERT INTO learning_cycles (student_id, seq, route, target_score, exam_date, started_at, status, created_at)
             VALUES (?, 1, ?, ?, ?, ?, 'active', ?)`,
          )
          .run(sid, c.route, target, addDays(c.startDate, 200), c.startDate, NOW);
        const cycleId = Number(cycleInfo.lastInsertRowid);
        counts.cycles += 1;
        conn
          .prepare(
            `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, ref_table, ref_id, created_by, created_at)
             VALUES (?, 'cycle_start', ?, ?, ?, 'learning_cycles', ?, ?, ?)`,
          )
          .run(sid, c.startDate, `Bắt đầu lộ trình ${c.route}`, `Target ${target}`, cycleId, adminId, NOW);

        seedAttempts(conn, { c, classIdx, cid, sid, cycleId, studentIdx: i, target, adminId, branchAdmins, counts });
        seedEstimates(conn, { sid, cid, target, studentIdx: i, teacherPool: teacherPool.get(c.branch)!, classIdx, counts });
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
      'Lộ trình': counts.cycles,
      'Lượt Mock': counts.attempts,
      'Ô điểm': counts.scores,
      'Kỹ năng không mock': counts.skips,
      'Đánh giá GV': counts.estimates,
      'Case SOS từ điểm': counts.cases,
      'Giáo viên báo vấn đề': (conn.prepare("SELECT COUNT(*) AS n FROM sos_cases WHERE origin_kind='teacher_report'").get() as any).n,
      'Tác động đã ghi': (conn.prepare('SELECT COUNT(*) AS n FROM case_interventions').get() as any).n,
      'Lần xem lại': (conn.prepare('SELECT COUNT(*) AS n FROM case_followups').get() as any).n,
      'Ghi nhận nhanh': (conn.prepare('SELECT COUNT(*) AS n FROM skill_checkins').get() as any).n,
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

function seedAttempts(conn: any, ctx: {
  c: ClassSeed; classIdx: number; cid: number; sid: number; cycleId: number; studentIdx: number;
  target: number; adminId: number; branchAdmins: Map<string, number>;
  counts: { students: number; cycles: number; attempts: number; scores: number; cases: number; estimates: number; skips: number };
}) {
  const { c, classIdx, cid, sid, cycleId, studentIdx, target, adminId, counts } = ctx;
  if (!c.plan.length) return;
  const recorder = ctx.branchAdmins.get(c.branch)!;
  const manager = ctx.adminId;

  for (const step of c.plan) {
    const outcome: Outcome = MT_OUTCOMES[studentIdx % MT_OUTCOMES.length][step.attemptNo - 1] ?? { fails: 0 };
    const periodId = (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(step.week) as any)?.id ?? null;
    const info = conn
      .prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                          lrw_scheduled_at, speaking_scheduled_at, status, target_at_attempt,
                                          created_by, created_at)
         VALUES (?,?,?, 'mock', ?,?,?,?,?,?,?,?)`,
      )
      .run(cycleId, sid, step.attemptNo, cid, periodId, step.lrwAt ?? null, step.speakingAt ?? null,
           step.done ? 'done' : 'planned', target, manager, NOW);
    const attemptId = Number(info.lastInsertRowid);
    counts.attempts += 1;

    // Lịch sử: Quản lý chốt tuần trước, Admin chi nhánh chốt ngày sau.
    conn.prepare(
      `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, reason, actor_user_id, created_at)
       VALUES (?, 'created', 'planned_period', ?, ?, ?, ?)`,
    ).run(attemptId, step.week, 'Kế hoạch đầu khoá', manager, NOW);
    if (step.lrwAt) {
      conn.prepare(
        `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, actor_user_id, created_at)
         VALUES (?, 'lrw_set', 'lrw_scheduled_at', ?, ?, ?)`,
      ).run(attemptId, step.lrwAt, recorder, NOW);
    }
    if (step.speakingAt) {
      conn.prepare(
        `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, actor_user_id, created_at)
         VALUES (?, 'speaking_set', 'speaking_scheduled_at', ?, ?, ?)`,
      ).run(attemptId, step.speakingAt, recorder, NOW);
    }
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, ref_table, ref_id, created_by, created_at)
         VALUES (?, 'mock_scheduled', ?, ?, 'assessment_attempts', ?, ?, ?)`,
      )
      .run(sid, step.week, `Lên kế hoạch MT${step.attemptNo}`, attemptId, manager, NOW);

    // Kỹ năng được đánh dấu KHÔNG MOCK. Đây là ngoại lệ do Quản lý ghi, không phải mặc định.
    const skipped = outcome.skip ?? null;
    if (skipped) {
      conn.prepare(
        'INSERT INTO attempt_skill_skips (attempt_id, skill, reason, created_by, created_at) VALUES (?,?,?,?,?)',
      ).run(attemptId, skipped, 'Học viên vắng buổi kỹ năng này', manager, NOW);
      conn.prepare(
        `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, reason, actor_user_id, created_at)
         VALUES (?, 'skill_skipped', ?, 'skipped', ?, ?, ?)`,
      ).run(attemptId, skipped, 'Học viên vắng buổi kỹ năng này', manager, NOW);
      counts.skips += 1;
    }

    if (!step.done) continue;

    const expectation = target - (step.attemptNo === 1 ? 1 : step.attemptNo === 2 ? 0.5 : 0);
    const missing = new Set(outcome.missing ?? []);
    const performedOnly = new Set(outcome.performedOnly ?? []);
    const assessedOrder = OUTCOME_SKILL_ORDER.filter((sk) => sk !== skipped);
    const failing = new Set(assessedOrder.slice(Math.max(0, assessedOrder.length - outcome.fails)));

    const bandOf = (assessed: string) =>
      failing.has(assessed as any) ? Math.max(1, expectation - 0.5) : expectation + (studentIdx % 2 === 0 ? 0.5 : 0);

    for (const skill of ENTRY_SKILLS) {
      const assessed = skill === 'writing1' || skill === 'writing2' ? 'writing' : skill;
      if (assessed === skipped) continue;          // không mock thì không có dòng điểm
      if (missing.has(skill)) continue;            // chưa mock: không có dòng nào

      // Ngày mock thực tế: Speaking theo lịch Speaking nếu có, còn lại theo buổi chính.
      const scheduled = (skill === 'speaking' ? step.speakingAt : step.lrwAt) ?? step.lrwAt ?? step.week;
      const takenOn = String(scheduled).slice(0, 10);

      if (performedOnly.has(skill)) {
        // Đã mock nhưng CHƯA nhập điểm — có dòng, có ngày, chưa có band.
        conn.prepare(
          'INSERT INTO assessment_scores (attempt_id, skill, taken_on, entered_by, entered_at) VALUES (?,?,?,?,?)',
        ).run(attemptId, skill, takenOn, recorder, NOW);
        continue;
      }

      const resultDate = addDays(takenOn, 2 + (studentIdx % 3));
      if (skill === 'listening' || skill === 'reading') {
        const band = bandOf(skill);
        const raw = rawFor(skill, band);
        const realBand = (skill === 'listening' ? LISTENING_BY_RAW : READING_BY_RAW)[raw];
        conn
          .prepare(
            `INSERT INTO assessment_scores (attempt_id, skill, taken_on, raw_score, raw_total, band, result_date, entered_by, entered_at)
             VALUES (?,?,?,?,40,?,?,?,?)`,
          )
          .run(attemptId, skill, takenOn, raw, realBand, resultDate, recorder, NOW);
      } else {
        const target2 = bandOf(skill === 'speaking' ? 'speaking' : 'writing');
        // Band Writing = (W1 + W2×2)/3: đặt W1 cao hơn nửa band vẫn ra đúng band mục tiêu.
        const band = skill === 'writing1' ? Math.min(9, target2 + 0.5) : target2;
        const crit = criteriaFor(band);
        conn
          .prepare(
            `INSERT INTO assessment_scores (attempt_id, skill, taken_on, c1, c2, c3, c4, band, result_date, entered_by, entered_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          )
          .run(attemptId, skill, takenOn, crit[0], crit[1], crit[2], crit[3],
               roundToHalf((crit[0] + crit[1] + crit[2] + crit[3]) / 4), resultDate, recorder, NOW);
      }
      counts.scores += 1;
    }

    if (missing.size === 0 && performedOnly.size === 0 && outcome.fails > 0) {
      const pattern = CASE_PATTERNS[(classIdx + studentIdx + step.attemptNo) % CASE_PATTERNS.length];
      seedCase(conn, {
        attemptId, sid, attemptNo: step.attemptNo, level: Math.min(3, outcome.fails),
        testDate: String(step.lrwAt ?? step.week).slice(0, 10), pattern, recorder, counts,
      });
    }
  }
}

/** Đánh giá GV: dữ liệu RIÊNG, không bao giờ ghi đè điểm Mock. */
function seedEstimates(conn: any, o: {
  sid: number; cid: number; target: number; studentIdx: number; teacherPool: number[]; classIdx: number;
  counts: { estimates: number };
}) {
  const cycle = conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1').get(o.sid) as any;
  const plan: [string, number, string][] = [
    ['listening', o.target - 0.5, '2026-08-28'],
    ['reading', o.target, '2026-08-28'],
    ['writing1', o.target - 0.5, '2026-09-04'],
    ['writing2', o.target - 0.5, '2026-09-04'],
    ['speaking', o.target + (o.studentIdx % 2 === 0 ? 0.5 : 0), '2026-09-11'],
  ];
  /*
   * Đọc THẲNG phân công đã ghi trong database, không chép lại bảng phân công ở đây.
   * Chép lại là hai nguồn sự thật: đổi cách phân công một chỗ thì chỗ kia lệch, và người
   * ghi đánh giá hoá ra lại không phải giáo viên phụ trách kỹ năng đó.
   */
  const owner: Record<string, number> = {};
  for (const r of conn
    .prepare(`SELECT skill, user_id FROM teacher_assignments WHERE class_id = ? AND skill IS NOT NULL AND status='active'`)
    .all(o.cid) as any[]) owner[r.skill] = r.user_id;

  for (const [skill, band, on] of plan) {
    if (!owner[skill]) continue;                            // lớp này không dạy kỹ năng đó
    if ((o.studentIdx + skill.length) % 3 === 0) continue;   // không phải em nào cũng có đủ đánh giá
    conn
      .prepare(
        `INSERT INTO teacher_estimates (student_id, cycle_id, skill, band, assessed_on, assessed_by, class_id, created_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .run(o.sid, cycle?.id ?? null, skill, Math.max(1, Math.min(9, band)), on, owner[skill], o.cid, NOW);
    o.counts.estimates += 1;
  }
}

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
       VALUES (?, 'mock_result', ?, ?, ?, 'assessment_attempts', ?, ?, ?)`,
    )
    .run(o.sid, o.testDate, `MT${o.attemptNo}: SOS ${o.level}`, `${o.level} kỹ năng dưới kỳ vọng`,
         o.attemptId, o.recorder, NOW);
}

// ==================================================================== tình huống riêng

/**
 * Dữ liệu mẫu cho lớp thường. Tự tạo lộ trình (khoá học), hai bài kiểm tra theo mốc tuần
 * học, rồi nhập điểm theo một kịch bản cố định để mỗi mức SOS đều có mặt.
 */
/**
 * Dữ liệu mẫu cho mô hình case học vụ mới. Dùng mốc ngày cố định để chạy lại seed cho ra
 * đúng dữ liệu cũ.
 */
function seedAcademicCases(conn: any, ctx: {
  classId: Map<string, number>;
  allStudents: { id: number; classCode: string; branch: string }[];
  adminId: number; managers: Map<string, number[]>;
  counts: Record<string, number>;
}) {
  const { classId, allStudents, adminId, managers, counts } = ctx;
  counts.reports = 0; counts.interventions = 0; counts.followups = 0; counts.checkins = 0;

  const teacherOf = (classCode: string, skill: string) =>
    (conn.prepare(
      `SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status='active' LIMIT 1`,
    ).get(classId.get(classCode), skill) as any)?.user_id ?? adminId;
  const coreOf = (classCode: string) =>
    (conn.prepare(
      `SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status='active' LIMIT 1`,
    ).get(classId.get(classCode)) as any)?.user_id ?? adminId;

  const openCase = (o: {
    studentId: number; classCode: string; reporter: number; detectedAt: string;
    summary: string; urgency: string;
    primary?: string; secondary?: string[]; context?: string[]; skill?: string | null;
    observation?: string | null;
  }) => {
    const cyc = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status='active' LIMIT 1`)
      .get(o.studentId) as any;
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, origin_kind, detected_at, reported_by,
                                summary, urgency, sos_level, status, created_at)
         VALUES (NULL, ?,?, 'teacher_report', ?,?,?,?, NULL, 'open', ?)`,
      )
      .run(o.studentId, cyc?.id ?? null, o.detectedAt, o.reporter, o.summary, o.urgency, NOW);
    const id = Number(info.lastInsertRowid);
    counts.reports += 1;
    const addIssue = (code: string, role: string, skill?: string | null, obs?: string | null) =>
      conn.prepare(
        `INSERT INTO case_issues (case_id, role, taxonomy_code, taxonomy_version, skill, observation, created_by, created_at)
         VALUES (?,?,?,1,?,?,?,?)`,
      ).run(id, role, code, skill ?? null, obs ?? null, o.reporter, NOW);
    if (o.primary) addIssue(o.primary, 'primary', o.skill, o.observation);
    for (const c of o.secondary ?? []) addIssue(c, 'secondary', o.skill);
    for (const c of o.context ?? []) addIssue(c, 'context');
    conn.prepare(
      `INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, detail,
                                   ref_table, ref_id, dedup_key, created_by, created_at)
       VALUES (?,?, 'case_opened', ?,?,?, 'sos_cases', ?, ?, ?, ?)`,
    ).run(o.studentId, cyc?.id ?? null, o.detectedAt, 'Giáo viên ghi nhận vấn đề', o.summary,
          id, `case_open:${id}`, o.reporter, NOW);
    return id;
  };

  const addIntervention = (caseId: number, o: {
    kind: string; description: string; performerUser?: number | null; performerName?: string | null;
    recorder: number; status: string; started?: string | null; completed?: string | null; due?: string | null;
  }) => {
    const info = conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, performer_name,
                                         recorded_by, status, started_date, completed_date, followup_due, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(caseId, o.kind, o.description, o.performerUser ?? null, o.performerName ?? null,
           o.recorder, o.status, o.started ?? null, o.completed ?? null, o.due ?? null, NOW);
    conn.prepare(`UPDATE sos_cases SET status = 'in_progress', updated_at = ? WHERE id = ? AND status = 'open'`)
      .run(NOW, caseId);
    counts.interventions += 1;
    return Number(info.lastInsertRowid);
  };

  const addFollowUp = (caseId: number, o: {
    interventionId?: number | null; on: string; observer: number; outcome: string; note?: string;
  }) => {
    conn.prepare(
      `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id, outcome, note, created_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(caseId, o.interventionId ?? null, o.on, o.observer, o.outcome, o.note ?? null, NOW);
    counts.followups += 1;
  };

  const inClass = (code: string) => allStudents.filter((s) => s.classCode === code);

  // --- 1. Giáo viên báo trước khi có bài nào: em mới vào lớp, chưa tới lịch MT.
  const a = inClass('MB-FT 101')[0];
  if (a) {
    const gv = teacherOf('MB-FT 101', 'listening');
    const c1 = openCase({
      studentId: a.id, classCode: 'MB-FT 101', reporter: gv, detectedAt: '2026-09-14',
      summary: 'Em nghe không kịp phần chi tiết, hay bỏ trống 5–6 câu cuối',
      urgency: 'attention',
      primary: 'student.listening.detail', skill: 'listening',
      observation: 'Bài luyện trên lớp phần 3 và 4 sai nhiều, phần 1 vẫn tốt',
      secondary: ['student.behaviour.selfstudy'],
    });
    const iv = addIntervention(c1, {
      kind: 'teaching_adjust', description: 'Thêm 15 phút luyện nghe chi tiết mỗi buổi',
      performerUser: gv, recorder: gv, status: 'started', started: '2026-09-15', due: '2026-09-29',
    });
    addFollowUp(c1, { interventionId: iv, on: '2026-09-22', observer: gv, outcome: 'partial',
      note: 'Phần 3 đỡ hơn, phần 4 vẫn còn trống nhiều' });
  }

  // --- 2. Case nhiều yếu tố, có cả phía giáo viên và hoàn cảnh gia đình.
  const b = inClass('MB-FT 102')[0];
  if (b) {
    const core = coreOf('MB-FT 102');
    const c2 = openCase({
      studentId: b.id, classCode: 'MB-FT 102', reporter: core, detectedAt: '2026-09-08',
      summary: 'Em nghỉ nhiều buổi, bài về nhà không nộp',
      urgency: 'urgent',
      primary: 'student.behaviour.attendance',
      secondary: ['student.behaviour.homework', 'teacher.followup'],
      context: ['context.family', 'context.travel'],
      observation: 'Nghỉ 4/8 buổi trong hai tuần',
    });
    // CS trao đổi với phụ huynh: người thực hiện ở ngoài hệ thống, người ghi là Admin.
    addIntervention(c2, {
      kind: 'talk_parent', description: 'CS gọi trao đổi với phụ huynh về việc đi học',
      performerName: 'Chị Hương (CS)', recorder: adminId, status: 'completed', completed: '2026-09-10',
    });
    const iv2 = addIntervention(c2, {
      kind: 'talk_student', description: 'GVCN gặp riêng em sau buổi học',
      performerUser: core, recorder: core, status: 'completed', completed: '2026-09-11', due: '2026-09-18',
    });
    addFollowUp(c2, { interventionId: iv2, on: '2026-09-18', observer: core, outcome: 'improved',
      note: 'Hai tuần gần đây đi đủ, đã nộp bài' });
    addFollowUp(c2, { on: '2026-09-25', observer: core, outcome: 'unchanged',
      note: 'Tuần này lại nghỉ một buổi, tiếp tục theo dõi' });
  }

  // --- 3. Case CHỈ THEO DÕI, không hẹn ngày — không bao giờ được coi là quá hạn.
  const c = inClass('BC-FT 205')[0];
  if (c) {
    const gv = teacherOf('BC-FT 205', 'writing1');
    const c3 = openCase({
      studentId: c.id, classCode: 'BC-FT 205', reporter: gv, detectedAt: '2026-09-16',
      summary: 'Bài viết task 1 hay thiếu câu tổng quan',
      urgency: 'normal',
      primary: 'student.writing.task', skill: 'writing',
    });
    conn.prepare(`UPDATE sos_cases SET disposition = 'monitor', disposition_note = ?, updated_at = ? WHERE id = ?`)
      .run('Nhắc trong giờ chữa bài, chưa cần hỗ trợ riêng', NOW, c3);
  }

  // --- 4. Case đã hẹn xem lại và QUÁ HẠN — để hàng đợi "tới hạn" có dữ liệu thật.
  const d = inClass('CP-FT 110')[0];
  if (d) {
    const gv = teacherOf('CP-FT 110', 'speaking');
    const c4 = openCase({
      studentId: d.id, classCode: 'CP-FT 110', reporter: gv, detectedAt: '2026-09-01',
      summary: 'Phát âm đuôi và trọng âm sai nhiều, người nghe khó hiểu',
      urgency: 'attention',
      primary: 'student.speaking.pronunciation', skill: 'speaking',
    });
    addIntervention(c4, {
      kind: 'tutor', description: 'Học tutor phát âm 2 buổi/tuần',
      performerName: 'Tutor Ngọc', recorder: gv, status: 'started',
      started: '2026-09-05', due: '2026-09-19',       // đã quá ngày demo 23/09
    });
  }

  // --- 5. Case đóng với "không cần xử lý thêm" — có kết luận rõ, không phải bỏ quên.
  const e = inClass('HD-FT 302')[0];
  if (e) {
    const core = coreOf('HD-FT 302');
    const mgr = managers.get('HD')?.[0] ?? adminId;
    const c5 = openCase({
      studentId: e.id, classCode: 'HD-FT 302', reporter: core, detectedAt: '2026-08-24',
      summary: 'Em có vẻ mất tập trung mấy buổi liền',
      urgency: 'normal',
      primary: 'student.behaviour.focus', context: ['context.health'],
    });
    addIntervention(c5, {
      kind: 'talk_student', description: 'Hỏi thăm, em bị ốm nên mệt',
      performerUser: core, recorder: core, status: 'completed', completed: '2026-08-26',
    });
    addFollowUp(c5, { on: '2026-09-02', observer: core, outcome: 'improved', note: 'Em khỏi ốm, đã tập trung lại' });
    conn.prepare(
      `UPDATE sos_cases SET status = 'done', disposition = 'no_action', disposition_note = ?,
              closed_by = ?, closed_at = ?, updated_at = ? WHERE id = ?`,
    ).run('Nguyên nhân là sức khoẻ, đã ổn định — không cần hỗ trợ học thuật', mgr, NOW, NOW, c5);
  }

  // --- 6. Ghi nhận nhanh ĐỊNH TÍNH, không có điểm — lớp thường không quy ra band IELTS.
  const fou = inClass('MB-FOUND 12').slice(0, 4);
  const fouTeacher = teacherOf('MB-FOUND 12', 'listening');
  for (const [i, st] of fou.entries()) {
    const cyc = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? LIMIT 1`).get(st.id) as any;
    conn.prepare(
      `INSERT INTO skill_checkins (student_id, cycle_id, class_id, skill, observed_on, author_user_id,
                                   judgement, strengths, weaknesses, estimate_basis, created_at)
       VALUES (?,?,?, 'listening', ?,?,?,?,?, 'judgement', ?)`,
    ).run(st.id, cyc?.id ?? null, classId.get('MB-FOUND 12'), '2026-09-1' + (i + 2), fouTeacher,
          ['Nghe được ý chính, chưa bắt được chi tiết',
           'Tiến bộ rõ ở phần nghe số và tên riêng',
           'Còn nhầm khi người nói nhắc lại ý',
           'Theo kịp bài trên lớp, cần luyện thêm ở nhà'][i] ?? 'Theo dõi tiếp',
          i % 2 === 0 ? 'Chăm chỉ, hỏi bài chủ động' : null,
          i % 2 === 0 ? null : 'Hay quên bài về nhà', NOW);
    counts.checkins += 1;
  }

  // --- 7. Ghi nhận nhanh CÓ ĐIỂM cho lớp FT, để so với điểm Mock.
  const ft = inClass('MB-FT 101').slice(0, 5);
  const lrTeacher = teacherOf('MB-FT 101', 'listening');
  for (const [i, st] of ft.entries()) {
    const cyc = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status='active' LIMIT 1`)
      .get(st.id) as any;
    const raw = 26 + (i % 5);
    conn.prepare(
      `INSERT INTO skill_checkins (student_id, cycle_id, class_id, skill, observed_on, author_user_id,
                                   judgement, band, raw_score, estimate_basis, created_at)
       VALUES (?,?,?, 'listening', ?,?,?,?,?, 'raw', ?)`,
    ).run(st.id, cyc?.id ?? null, classId.get('MB-FT 101'), '2026-09-19', lrTeacher,
          'Ước lượng theo bài luyện trên lớp', LISTENING_BY_RAW[raw], raw, NOW);
    counts.checkins += 1;
  }
}

function seedRegularClasses(conn: any, ctx: {
  classId: Map<string, number>;
  allStudents: { id: number; classCode: string; branch: string }[];
  adminId: number; managers: Map<string, number[]>;
  counts: { students: number; cycles: number; attempts: number; scores: number; cases: number; estimates: number; skips: number };
}) {
  const { classId, allStudents, adminId, managers, counts } = ctx;

  /*
   * Kịch bản điểm theo VỊ TRÍ học viên trong lớp, để chạy lại seed cho ra đúng dữ liệu cũ.
   * Mỗi phần tử là tỷ lệ đúng của từng kỹ năng; `null` nghĩa là CHƯA NHẬP — dùng để chứng
   * minh "thiếu điểm" khác "trượt".
   */
  const SCRIPT: (number | null)[][] = [
    [0.85, 0.80, 0.75, 0.90],   // đạt hết
    [0.55, 0.80, 0.70, 0.75],   // trượt 1 môn  -> SOS 1
    [0.50, 0.45, 0.70, 0.80],   // trượt 2 môn  -> SOS 2
    [0.40, 0.45, 0.50, 0.55],   // trượt 3 môn  -> SOS 3
    [0.75, 0.65, null, null],   // mới nhập một nửa -> chưa kết luận
  ];
  const TOTALS: Record<string, number> = {
    listening: 40, reading: 40, prep_writing: 20, pronunciation: 25, speaking: 25,
  };

  for (const cls of CLASSES) {
    const programme = programmeOf(cls.kind);
    if (!programme || PROGRAMME_TEMPLATES[programme].scoringMode !== 'ratio') continue;
    const tpl = PROGRAMME_TEMPLATES[programme];
    const cid = classId.get(cls.code)!;
    const manager = managers.get(cls.branch)?.[0] ?? adminId;
    const students = allStudents.filter((s) => s.classCode === cls.code);

    students.forEach((st, idx) => {
      // Lớp thường vẫn cần một "lộ trình" để gắn bài kiểm tra vào — đó chính là khoá học này.
      const cyc = conn
        .prepare(
          `INSERT INTO learning_cycles (student_id, seq, route, target_score, started_at, status, note, created_at)
           VALUES (?, 1, NULL, NULL, ?, 'active', ?, ?)`,
        )
        .run(st.id, cls.startDate, `Khoá ${tpl.name} — lớp ${cls.code}`, NOW);
      counts.cycles += 1;
      const cycleId = Number(cyc.lastInsertRowid);

      tpl.checkpoints.forEach((cp, ci) => {
        // Tuần học N bắt đầu sau (N-1) tuần kể từ ngày khai giảng.
        const week = mondayOf(addDays(cls.startDate, (cp.studyWeek - 1) * 7));
        const period = ensurePeriod(week);
        const taken = addDays(week, 2);              // làm bài vào thứ Tư của tuần đó
        const past = taken <= DEMO_DATE;

        const info = conn
          .prepare(
            `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                              lrw_scheduled_at, status, created_by, created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
          )
          .run(cycleId, st.id, ci + 1, cp.kind, cid, period.id, past ? taken : null,
               'planned', manager, NOW);
        counts.attempts += 1;
        const attemptId = Number(info.lastInsertRowid);
        if (!past) return;                            // bài của tuần sau: chỉ có kế hoạch

        const script = SCRIPT[(idx + ci) % SCRIPT.length];
        let scored = 0;
        let failed = 0;
        tpl.skills.forEach((skill, si) => {
          const ratio = script[si % script.length];
          if (ratio === null) return;                 // chưa nhập điểm kỹ năng này
          const total = TOTALS[skill] ?? 40;
          const score = Math.round(ratio * total);
          conn
            .prepare(
              `INSERT INTO assessment_scores (attempt_id, skill, taken_on, raw_score, raw_total, entered_by, entered_at)
               VALUES (?,?,?,?,?,?,?)`,
            )
            .run(attemptId, skill, taken, score, total, manager, NOW);
          counts.scores += 1;
          scored += 1;
          if (score / total < 0.6) failed += 1;
        });

        // Đủ điểm mọi kỹ năng mới chốt. Thiếu một môn thì vẫn đang chờ, KHÔNG kết luận.
        if (scored === tpl.skills.length) {
          conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = ?`).run(attemptId);
          if (failed > 0) {
            const level = failed >= 3 ? 3 : failed;
            conn
              .prepare(`INSERT INTO sos_cases (attempt_id, sos_level, status, created_at) VALUES (?,?,?,?)`)
              .run(attemptId, level, ci === 0 ? 'in_progress' : 'open', NOW);
            counts.cases += 1;
          }
        }
      });
    });
  }
}

function seedSpecialCases(conn: any, ctx: {
  classId: Map<string, number>;
  allStudents: { id: number; classCode: string; branch: string }[];
  adminId: number; branchAdmins: Map<string, number>; managers: Map<string, number[]>;
  counts: { students: number; cycles: number; attempts: number; scores: number; cases: number; estimates: number; skips: number };
}) {
  const { classId, allStudents, adminId, managers, counts } = ctx;
  const inClass = (code: string) => allStudents.filter((s) => s.classCode === code);
  const periodOf = (week: string) =>
    (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(week) as any)?.id ?? null;

  // 1) Đổi TUẦN kế hoạch: cùng một lượt, giữ lịch sử, KHÔNG tạo lượt mới.
  const moved = inClass('CP-FT 110')[0];
  if (moved) {
    const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE student_id = ? AND status='planned' LIMIT 1`)
      .get(moved.id) as any;
    if (a) {
      const newWeek = '2026-10-26';
      conn.prepare('UPDATE assessment_attempts SET planned_period_id = ?, updated_at = ? WHERE id = ?')
        .run(periodOf(newWeek), NOW, a.id);
      conn.prepare(
        `INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)
         VALUES (?, 'week_set', 'planned_period', ?, ?, ?, ?, ?)`,
      ).run(a.id, '2026-10-19', newWeek, 'Trùng lịch phòng thi', managers.get('CP')![0], NOW);
    }
  }

  // 2) Huỷ lượt: giữ nguyên dấu vết, không tính vào "đã xong" hay "thiếu điểm".
  const cancelled = inClass('HD-FT 302')[1];
  if (cancelled) {
    const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE student_id = ? AND status='planned' LIMIT 1`)
      .get(cancelled.id) as any;
    if (a) {
      conn.prepare(`UPDATE assessment_attempts SET status='cancelled', cancel_reason=?, cancelled_at=?, updated_at=? WHERE id=?`)
        .run('Học viên nghỉ ốm dài ngày', NOW, NOW, a.id);
      conn.prepare(
        `INSERT INTO attempt_schedule_history (attempt_id, action, reason, actor_user_id, created_at)
         VALUES (?, 'cancelled', ?, ?, ?)`,
      ).run(a.id, 'Học viên nghỉ ốm dài ngày', managers.get('HD')![0], NOW);
    }
  }

  // 3) Hạn nhập điểm riêng do Admin chi nhánh đặt, thay cho hạn mặc định.
  const overridden = inClass('MB-FT 101')[1];
  if (overridden) {
    const a = conn.prepare(`SELECT * FROM assessment_attempts WHERE student_id = ? AND attempt_no = 2`)
      .get(overridden.id) as any;
    if (a) {
      conn.prepare(
        `UPDATE assessment_attempts SET deadline_override=?, deadline_override_by=?, deadline_override_at=?,
                deadline_override_reason=? WHERE id=?`,
      ).run('2026-09-30', ctx.branchAdmins.get('MB')!, NOW, 'Giáo viên Writing nghỉ phép, gia hạn tới cuối tháng', a.id);
      conn.prepare(
        `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, reason, actor_user_id, created_at)
         VALUES (?, 'deadline_set', 'deadline_override', '2026-09-30', ?, ?, ?)`,
      ).run(a.id, 'Giáo viên Writing nghỉ phép, gia hạn tới cuối tháng', ctx.branchAdmins.get('MB')!, NOW);
    }
  }

  // 4) Chuyển lớp: lượt ĐÃ XONG giữ lớp cũ, lượt chưa xong chuyển sang lớp mới.
  const transferred = inClass('MB-FT 101')[2];
  const toClass = classId.get('MB-FT 102');
  if (transferred && toClass) {
    const cur = conn.prepare(`SELECT * FROM enrollments WHERE student_id = ? AND status='active'`).get(transferred.id) as any;
    conn.prepare(`UPDATE enrollments SET status='transferred', ended_at=?, end_reason=? WHERE id=?`)
      .run('2026-09-14', 'Chuyển ca học buổi chiều', cur.id);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
      .run(transferred.id, toClass, '2026-09-14', NOW);
    conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE student_id = ? AND status = 'planned'`)
      .run(toClass, transferred.id);
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at)
         VALUES (?, 'transfer', ?, ?, ?, ?, ?)`,
      )
      .run(transferred.id, '2026-09-14', 'Chuyển sang lớp MB-FT 102', 'Chuyển ca học buổi chiều', adminId, NOW);
  }

  // 5) Tạm dừng rồi quay lại học.
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

  /*
   * 5b) NGHĨA VỤ HÀNG TUẦN CỦA ADMIN CHI NHÁNH.
   *
   * Ngày demo là 23/09/2026, tức W4 SEP. Phải có sẵn cả ba tình huống của §11 thì màn
   * "Cần cập nhật ngày MT" mới thể hiện được đúng việc thật:
   *   - MT tuần này (W4 SEP) chưa có ngày  → Admin chi nhánh cần làm ngay;
   *   - MT tuần trước (W3 SEP) vẫn thiếu   → đã quá hạn;
   *   - MT các tuần sau                     → KHÔNG hiện, vì chưa đến lượt.
   */
  const dutyWeeks: { week: string; classCode: string; take: number }[] = [
    { week: '2026-09-21', classCode: 'MB-FT 101', take: 3 },   // W4 SEP — tuần hiện tại
    { week: '2026-09-21', classCode: 'MB-FT 102', take: 2 },
    { week: '2026-09-14', classCode: 'CP-FT 110', take: 2 },   // W3 SEP — đã quá hạn
  ];
  for (const d of dutyWeeks) {
    const pid = periodOf(d.week);
    const cid = classId.get(d.classCode);
    if (!pid || !cid) continue;
    for (const st of inClass(d.classCode).slice(0, d.take)) {
      const cycle = conn.prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status='active' LIMIT 1`)
        .get(st.id) as any;
      if (!cycle) continue;
      const nextNo = ((conn.prepare('SELECT MAX(attempt_no) m FROM assessment_attempts WHERE cycle_id = ?')
        .get(cycle.id) as any)?.m ?? 0) + 1;
      const info = conn
        .prepare(
          `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                            status, target_at_attempt, created_by, created_at)
           VALUES (?,?,?, 'mock', ?,?, 'planned', ?,?,?)`,
        )
        .run(cycle.id, st.id, nextNo, cid, pid, cycle.target_score, managers.get(st.branch)?.[0] ?? adminId, NOW);
      conn
        .prepare(
          `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, reason, actor_user_id, created_at)
           VALUES (?, 'created', 'planned_period', ?, ?, ?, ?)`,
        )
        .run(Number(info.lastInsertRowid), d.week, 'Kế hoạch tuần, chờ cập nhật ngày thực tế',
             managers.get(st.branch)?.[0] ?? adminId, NOW);
      counts.attempts += 1;
    }
  }

  /*
   * 5c) LỚP THƯỜNG — Foundation / Beginner / Elementary.
   *
   * Chấm theo `số câu đúng / tổng số câu`, đạt từ 60%. Mốc kiểm tra tính theo TUẦN HỌC của
   * lớp (FOU tuần 4 và 8; BE/ELE tuần 5 và 10), không phải theo lịch MT của FT.
   *
   * Dữ liệu mẫu cần đủ ba tình huống thì màn hình mới có gì để xem:
   *   - bài đã chấm xong, đạt hết;
   *   - bài đã chấm xong, trượt 1–3 môn để thấy SOS 1/2/3 sinh ra từ chính engine cũ;
   *   - bài mới nhập một phần, để thấy "thiếu điểm" KHÁC "trượt".
   */
  seedRegularClasses(conn, { classId, allStudents, adminId, managers, counts });

  /*
   * 5d) CASE HỌC VỤ THEO MÔ HÌNH MỚI.
   *
   * Cần đủ các tình huống thì màn hình mới có gì để xem và để thử:
   *   - giáo viên báo vấn đề khi CHƯA có bài đánh giá nào;
   *   - case nhiều yếu tố: vấn đề chính + yếu tố đi kèm + hoàn cảnh;
   *   - một case nhiều đợt hỗ trợ, mỗi đợt xem lại nhiều lần;
   *   - case chỉ theo dõi, không có hẹn xem lại (nên KHÔNG bao giờ quá hạn);
   *   - case đã hẹn xem lại và quá hạn;
   *   - case đóng với "không cần xử lý thêm";
   *   - ghi nhận nhanh định tính, không có điểm.
   */
  seedAcademicCases(conn, { classId, allStudents, adminId, managers, counts });

  // 6) Warning/WL và đánh giá cũ — dữ liệu lịch sử để thử bộ lọc hành trình.
  const warned = inClass('UB-FT 401')[5];
  if (warned) {
    for (const e of [
      { type: 'estimate', date: '2026-08-31', title: 'Đánh giá GV: 5.5', detail: 'GVCN đánh giá giữa kỳ' },
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

  // 7) HỌC LẠI TRONG CÙNG LỘ TRÌNH: số MT tăng tiếp (MT5), target giữ nguyên,
  //    nên kỳ vọng vẫn bằng target chứ không quay lại mức trừ của MT1.
  const repeater = inClass('UB-FT 401')[6];
  if (repeater) {
    const cycle = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1')
      .get(repeater.id) as any;
    const info = conn
      .prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                          status, target_at_attempt, note, created_by, created_at)
         VALUES (?,?,5,'mock',?,?, 'planned', ?, ?, ?, ?)`,
      )
      .run(cycle.id, repeater.id, classId.get('UB-FT 401'), periodOf('2026-11-02'), cycle.target_score,
           'Học tiếp lộ trình sau khi chưa đạt aim', adminId, NOW);
    conn.prepare(
      `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, reason, actor_user_id, created_at)
       VALUES (?, 'created', 'planned_period', '2026-11-02', ?, ?, ?)`,
    ).run(Number(info.lastInsertRowid), 'Học tiếp lộ trình, MT tăng tiếp', managers.get('UB')![0], NOW);
    counts.attempts += 1;
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at)
         VALUES (?, 'repeat', ?, ?, ?, ?, ?)`,
      )
      .run(repeater.id, '2026-09-21', 'Học tiếp lộ trình LT2', 'Chưa đạt target, học thêm trước khi thi', adminId, NOW);
  }

  // 8) SANG LỘ TRÌNH MỚI: LT1 xong, thi thật, mở LT2 với target mới nên MT đánh lại từ 1.
  const promoted = inClass('MB-FT 101')[3];
  if (promoted) {
    const old = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1')
      .get(promoted.id) as any;
    conn.prepare(`UPDATE learning_cycles SET status='completed', ended_at=? WHERE id=?`).run('2026-09-14', old.id);
    const newTarget = (old.target_score ?? 6) + 0.5;
    const cyc = conn
      .prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, target_score, exam_date, started_at, status, note, created_at)
         VALUES (?,?, 'LT2', ?, ?, ?, 'active', ?, ?)`,
      )
      .run(promoted.id, old.seq + 1, newTarget, '2027-03-06', '2026-09-15',
           'Đã thi xong LT1, sang lộ trình mới với target cao hơn', NOW);
    const cycleId = Number(cyc.lastInsertRowid);
    counts.cycles += 1;
    const info = conn
      .prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                          status, target_at_attempt, created_by, created_at)
         VALUES (?,?,1,'mock',?,?, 'planned', ?, ?, ?)`,
      )
      .run(cycleId, promoted.id, classId.get('MB-FT 102'), periodOf('2026-11-02'), newTarget, adminId, NOW);
    conn.prepare(
      `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, reason, actor_user_id, created_at)
       VALUES (?, 'created', 'planned_period', '2026-11-02', ?, ?, ?)`,
    ).run(Number(info.lastInsertRowid), 'Lộ trình mới, MT đánh lại từ 1', managers.get('MB')![0], NOW);
    counts.attempts += 1;
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, ref_table, ref_id, created_by, created_at)
         VALUES (?, 'cycle_start', ?, ?, ?, 'learning_cycles', ?, ?, ?)`,
      )
      .run(promoted.id, '2026-09-15', 'Bắt đầu lộ trình LT2', `Target mới ${newTarget}`, cycleId, adminId, NOW);
  }

  // 9) Hai học viên đã kết thúc: một em mới xong (còn hiện, làm dịu màu), một em đã quá
  //    hai tuần nên tới lượt vào lưu trữ. Lưu trữ chỉ ẩn khỏi danh sách, không xoá gì.
  for (const [idx, date] of [[6, '2026-09-04'], [7, '2026-09-18']] as [number, string][]) {
    const finished = inClass('BC-FT 205')[idx];
    if (!finished) continue;
    conn.prepare(`UPDATE students SET status='finished', finished_at=? WHERE id=?`).run(date, finished.id);
    conn.prepare(`UPDATE enrollments SET status='completed' WHERE student_id=? AND status='active'`).run(finished.id);
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at)
         VALUES (?, 'finish', ?, ?, ?, ?, ?)`,
      )
      .run(finished.id, date, 'Kết thúc học', 'Đã thi IELTS chính thức', adminId, NOW);
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
      .prepare('SELECT a.*, c.branch_id, c.code AS class_code, s.full_name FROM assessment_attempts a JOIN classes c ON c.id=a.class_id JOIN students s ON s.id=a.student_id WHERE a.id = ?')
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
