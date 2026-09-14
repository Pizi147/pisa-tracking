import crypto from 'node:crypto';
import { db, recreateSchema, tx } from '../db.ts';
import {
  BRANCH_REPORT_CATEGORIES, CONTACT_KINDS, CONTACT_KIND_LABEL, ENTRY_SKILLS, cycleDeadline,
  PERMISSION_LABEL, PROGRAMME_TEMPLATES, categoryOf,
  TUTOR_REPORT_CATEGORIES, programmeOf,
  type EntrySkill,
} from '../../../shared/domain/index.ts';
import { addDays, normalizeName, nowIso, padCode } from '../util.ts';
import { setConfig } from '../demoConfig.ts';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, EMAIL_SUFFIX } from '../platform/accounts.ts';
import { seedRoutes } from '../platform/sysconfig.ts';
import { LISTENING_BY_RAW, READING_BY_RAW, roundToHalf } from '../fasttrack/scoring.ts';
import { ensurePeriod, mondayOf, weekInfo } from '../platform/week.ts';
import {
  BRANCHES, CASE_PATTERNS, CLASSES, DEMO_DATE, GIVEN_NAMES, MIDDLE_NAMES, MT_OUTCOMES,
  ROLES, ROLE_PERMISSIONS, SURNAMES, TARGET_SCORES, TEACHER_GAPS,
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
    const rand = rng(20260914);
    let userSeq = 0;
    const usedNames = new Set<string>();
    const fakeName = () => {
      for (;;) {
        const n = `${SURNAMES[Math.floor(rand() * SURNAMES.length)]} ${MIDDLE_NAMES[Math.floor(rand() * MIDDLE_NAMES.length)]} ${GIVEN_NAMES[Math.floor(rand() * GIVEN_NAMES.length)]}`;
        if (!usedNames.has(n)) { usedNames.add(n); return n; }
      }
    };
    /*
     * MỌI TÀI KHOẢN DEMO ĐỀU ĐĂNG NHẬP ĐƯỢC THẬT.
     *
     * Email suy từ tên, đúng quy ước `ten.pisa@gmail.com` owner chốt ở mục 7.1. Mật khẩu
     * chung một chuỗi và ghi rõ ở README lẫn màn đăng nhập — bản demo nội bộ mà mỗi tài khoản
     * một mật khẩu riêng thì không ai thử được vai nào ngoài vai của mình.
     *
     * Có mật khẩu thật ngay ở dữ liệu mẫu là điều kiện để thử ĐÚNG luồng đăng nhập, chứ không
     * chỉ thử nút "Đổi tài khoản demo".
     */
    const usedEmails = new Set<string>();
    const emailFor = (name: string) => {
      const base = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, 'd').toLowerCase().split(/\s+/).filter(Boolean);
      const stem = (base[base.length - 1] ?? 'gv') + (base[0] ? `.${base[0]}` : '');
      let local = stem.replace(/[^a-z0-9.]/g, '');
      let n = 1;
      while (usedEmails.has(local)) { n += 1; local = `${stem.replace(/[^a-z0-9.]/g, '')}${n}`; }
      usedEmails.add(local);
      return `${local}${EMAIL_SUFFIX}`;
    };
    const addUser = (name: string, title: string, email?: string) => {
      userSeq += 1;
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
      const info = conn
        .prepare(
          `INSERT INTO users (code, full_name, email, title, password_hash, password_salt,
                              approval_state, status, created_at)
           VALUES (?,?,?,?,?,?, 'approved', 'active', ?)`,
        )
        .run(padCode('NV', userSeq, 3), name, email ?? emailFor(name), title, hash, salt, NOW);
      return Number(info.lastInsertRowid);
    };
    const grant = (userId: number, role: string, branch: string | null) =>
      conn.prepare('INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,?,?,?)')
        .run(userId, roleId.get(role)!, branch ? branchId.get(branch)! : null, 'active', NOW);

    /* Tài khoản Quản trị hệ thống MẶC ĐỊNH của owner, đúng địa chỉ owner chỉ định (mục 7.1). */
    const adminId = addUser('Đỗ Vũ Tuấn Phong', 'Quản trị hệ thống', DEFAULT_ADMIN_EMAIL);
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

    /*
     * LỘ TRÌNH nay là DỮ LIỆU (mục 7.3) — nạp lần đầu từ danh sách viết cứng, sau đó Quản trị
     * hệ thống thêm sửa trong màn quản trị mà không phải đụng vào mã nguồn.
     */
    seedRoutes(conn);

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
          `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, start_date,
                                start_period_id, status, note, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        )
        /*
         * TUẦN KHAI GIẢNG suy thẳng từ ngày khai giảng. Lớp Normal dùng mốc này để biết đang
         * ở tuần thứ mấy và tuần nào là Progress/Final Test — thiếu nó thì cả ba thông báo
         * của lớp không có căn cứ nào để tính.
         */
        .run(c.code, branchId.get(c.branch)!, c.kind, programme, c.route, c.isFastTrack ? 1 : 0,
             c.startDate, c.startDate ? ensurePeriod(c.startDate).id : null,
             'active', null, NOW);
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

      /*
       * VÀI LỚP CỐ TÌNH THIẾU NGƯỜI. Nhãn "Thiếu GV W1, W2" và nhãn "Chưa có GVCN" chỉ
       * chứng minh được là nó chạy khi có lớp thật đang thiếu — xem `TEACHER_GAPS`.
       */
      const gap = TEACHER_GAPS[c.code] ?? {};
      const missing = new Set(gap.skills ?? []);
      const taught = skills.filter((sk) => !missing.has(sk));

      // Phân công theo ĐÚNG kỹ năng của chương trình lớp đó: lớp Normal có bốn môn L/R/W/S,
      // không có Writing task 1/2, nên không giao những ô không tồn tại.
      taught.forEach((skill, i) => assign(pick(1 + (i % 4)), skill, false));

      /*
       * GVCN PHẢI DẠY ÍT NHẤT MỘT KỸ NĂNG Ở CHÍNH LỚP ĐÓ (luật ở `services/classes.ts`).
       * Nên chọn chủ nhiệm TỪ những người đã được giao kỹ năng của lớp này, chứ không bốc
       * một cái tên bất kỳ trong nhóm — dữ liệu mẫu mà phạm luật của chính nó thì vô nghĩa.
       */
      if (!gap.noCore && taught.length) {
        const core = (conn
          .prepare(`SELECT user_id FROM teacher_assignments
                      WHERE class_id = ? AND skill IS NOT NULL ORDER BY id LIMIT 1`)
          .get(id) as any).user_id;
        assign(core, null, true);              // GVCN — được dời lịch, KHÔNG tự có quyền sửa mọi điểm
      }
    });

    // ---------------------------------------------------------------- kỳ báo cáo
    // Đủ các tuần từ lớp mở sớm nhất tới ba tháng sau ngày demo, để còn lập kế hoạch trước.
    let cursor = mondayOf('2026-04-27');
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

    const counts = { students: 0, cycles: 0, attempts: 0, scores: 0, cases: 0, checkins: 0, skips: 0 };
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
            `INSERT INTO learning_cycles (student_id, seq, route, target_score, exam_period_id, exam_month,
                                          start_period_id, started_at, status, created_at)
             VALUES (?, 1, ?, ?, ?, ?, ?, ?, 'active', ?)`,
          )
          /*
           * TUẦN BẮT ĐẦU HỌC, và DỰ KIẾN THI ở BA MỨC CHẮC CHẮN KHÁC NHAU.
           *
           * Cứ năm em thì một em chưa khai tuần bắt đầu, một em chưa khai gì về kỳ thi, và
           * một em mới biết THÁNG chứ chưa biết TUẦN — để cả ba cách hiển thị "Dự kiến thi"
           * đều có dữ liệu thật mà xem, chứ không phải chỉ tồn tại trên lý thuyết.
           */
          .run(sid, c.route, target,
               i % 5 === 3 || i % 5 === 2 ? null : ensurePeriod(addDays(c.startDate, 200)).id,
               i % 5 === 3 ? null : String(addDays(c.startDate, 200)).slice(0, 7),
               i % 5 === 1 ? null : ensurePeriod(c.startDate).id,
               c.startDate, NOW);
        const cycleId = Number(cycleInfo.lastInsertRowid);
        counts.cycles += 1;
        conn
          .prepare(
            `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, ref_table, ref_id, created_by, created_at)
             VALUES (?, 'cycle_start', ?, ?, ?, 'learning_cycles', ?, ?, ?)`,
          )
          .run(sid, c.startDate, `Bắt đầu lộ trình ${c.route}`, `Target ${target}`, cycleId, adminId, NOW);

        seedAttempts(conn, { c, classIdx, cid, sid, cycleId, studentIdx: i, target, adminId, branchAdmins, counts });
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
      'Case SOS từ điểm': counts.cases,
      'Giáo viên báo vấn đề': (conn.prepare("SELECT COUNT(*) AS n FROM sos_cases WHERE origin_kind='teacher_report'").get() as any).n,
      'Tác động đã ghi': (conn.prepare('SELECT COUNT(*) AS n FROM case_interventions').get() as any).n,
      'Lần xem lại': (conn.prepare('SELECT COUNT(*) AS n FROM case_followups').get() as any).n,
      'Mốc case': (conn.prepare('SELECT COUNT(*) AS n FROM case_milestones').get() as any).n,
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
  counts: { students: number; cycles: number; attempts: number; scores: number; cases: number; checkins: number; skips: number };
}) {
  const { c, classIdx, cid, sid, cycleId, studentIdx, target, adminId, counts } = ctx;
  if (!c.plan.length) return;
  const recorder = ctx.branchAdmins.get(c.branch)!;
  /*
   * VĂN PHÒNG nhập lịch và điểm; NGƯỜI DẠY mới là người ghi phương án hỗ trợ.
   *
   * Bản trước để Admin chi nhánh làm người ghi cho mọi thứ, kể cả "Xếp tự học một tháng".
   * Hậu quả lộ ra ngay ở màn việc: Admin mở lên thấy một danh sách "cập nhật kết quả sau
   * hỗ trợ" của những việc chuyên môn họ không làm, còn giáo viên thì không thấy gì.
   */
  const teacherRecorder = (conn
    .prepare(`SELECT user_id FROM teacher_assignments
                WHERE class_id = ? AND is_core = 1 AND status = 'active' ORDER BY id LIMIT 1`)
    .get(cid) as any)?.user_id ?? recorder;
  const manager = ctx.adminId;

  for (const step of c.plan) {
    const outcome: Outcome = MT_OUTCOMES[studentIdx % MT_OUTCOMES.length][step.attemptNo - 1] ?? { fails: 0 };
    const periodId = (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(step.week) as any)?.id ?? null;
    const info = conn
      .prepare(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                          status, target_at_attempt, created_by, created_at)
         VALUES (?,?,?, 'mock', ?,?,?,?,?,?)`,
      )
      .run(cycleId, sid, step.attemptNo, cid, periodId,
           step.done ? 'done' : 'planned', target, manager, NOW);
    const attemptId = Number(info.lastInsertRowid);
    counts.attempts += 1;

    // Lịch sử: Quản lý chốt tuần. Đây là thao tác xếp lịch duy nhất của một lượt.
    conn.prepare(
      `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, reason, actor_user_id, created_at)
       VALUES (?, 'created', 'planned_period', ?, ?, ?, ?)`,
    ).run(attemptId, step.week, 'Kế hoạch đầu khoá', manager, NOW);
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
    const assessedOrder = OUTCOME_SKILL_ORDER.filter((sk) => sk !== skipped);
    const failing = new Set(assessedOrder.slice(Math.max(0, assessedOrder.length - outcome.fails)));

    const bandOf = (assessed: string) =>
      failing.has(assessed as any) ? Math.max(1, expectation - 0.5) : expectation + (studentIdx % 2 === 0 ? 0.5 : 0);
    /* Band từng Ô NHẬP, để suy ra đúng những ô dưới kỳ vọng — W1 và W2 so riêng. */
    const entryBand: Record<string, number> = {};

    for (const skill of ENTRY_SKILLS) {
      const assessed = skill === 'writing1' || skill === 'writing2' ? 'writing' : skill;
      if (assessed === skipped) continue;          // không mock thì không có dòng điểm
      if (missing.has(skill)) continue;            // chưa nhập điểm: không có dòng nào

      // Ngày có kết quả tính từ HẾT TUẦN MT — mốc duy nhất còn lại sau khi bỏ ngày thi.
      const weekEnd = addDays(step.week, 6);
      const resultDate = addDays(weekEnd, 1 + (studentIdx % 3));
      if (skill === 'listening' || skill === 'reading') {
        const band = bandOf(skill);
        const raw = rawFor(skill, band);
        const realBand = (skill === 'listening' ? LISTENING_BY_RAW : READING_BY_RAW)[raw];
        conn
          .prepare(
            `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, result_date, entered_by, entered_at)
             VALUES (?,?,?,40,?,?,?,?)`,
          )
          .run(attemptId, skill, raw, realBand, resultDate, recorder, NOW);
        entryBand[skill] = realBand;
      } else {
        const target2 = bandOf(skill === 'speaking' ? 'speaking' : 'writing');
        /*
         * Band Writing = (W1 + W2×2)/3, nên có nhiều cặp W1/W2 cùng cho ra một band. Dùng
         * điều đó để tạo CẢ HAI CHIỀU yếu: đa số em yếu Task 2, một phần ba yếu Task 1.
         *
         * Bản trước luôn đặt W1 cao hơn W2 đúng nửa band, nên W1 KHÔNG BAO GIỜ dưới kỳ vọng
         * — và từ vòng 3, khi Học thuật tách W1/W2 thành hai ô riêng, ô W1 sẽ trống trơn và
         * không ai kiểm chứng được nó có chạy hay không.
         *
         * Cặp (W1 = t−0.5, W2 = t+0.5) và cặp (W1 = t+0.5, W2 = t) đều cho band gộp bằng t.
         */
        const weakTask1 = studentIdx % 3 === 0;
        const band = weakTask1
          ? (skill === 'writing1' ? Math.max(1, target2 - 0.5) : Math.min(9, target2 + 0.5))
          : (skill === 'writing1' ? Math.min(9, target2 + 0.5) : target2);
        const crit = criteriaFor(band);
        conn
          .prepare(
            `INSERT INTO assessment_scores (attempt_id, skill, c1, c2, c3, c4, band, result_date, entered_by, entered_at)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
          )
          .run(attemptId, skill, crit[0], crit[1], crit[2], crit[3],
               roundToHalf((crit[0] + crit[1] + crit[2] + crit[3]) / 4), resultDate, recorder, NOW);
        entryBand[skill] = roundToHalf((crit[0] + crit[1] + crit[2] + crit[3]) / 4);
      }
      counts.scores += 1;
    }

    /*
     * Ô nào dưới kỳ vọng thì sinh một vấn đề cho CHÍNH ô đó — W1 và W2 tách riêng, đúng
     * như lúc chạy thật. Mức SOS vẫn đếm trên bốn kỹ năng có band, nên số vấn đề và mức
     * SOS là hai con số khác nhau và không cộng khớp; đó là chủ ý.
     */
    const failingEntry = ENTRY_SKILLS.filter((k) => entryBand[k] !== undefined && entryBand[k] < expectation);
    if (missing.size === 0 && failingEntry.length > 0) {
      const pattern = CASE_PATTERNS[(classIdx + studentIdx + step.attemptNo) % CASE_PATTERNS.length];
      const testDate = String(step.week).slice(0, 10);
      const level = Math.min(3, outcome.fails) || 1;
      for (const topic of failingEntry) {
        seedCase(conn, {
          attemptId, sid, cycleId, attemptNo: step.attemptNo, level, topic,
          testDate, pattern, recorder: teacherRecorder, counts,
        });
      }
      seedBehaviourCase(conn, {
        attemptId, attemptNo: step.attemptNo, sid, cycleId, testDate, level,
        failedCount: outcome.fails, gvcn: teacherRecorder, counts,
      });
    }
  }
}

/*
 * "Ghi nhận nhanh của giáo viên" ĐÃ BỎ HẲN Ở VÒNG 4 — không còn dữ liệu mẫu cho nó nữa.
 * Xem chú thích ở `server/src/schema.sql`, phần bảng `skill_checkins` đã gỡ.
 */

/** Chữ gọn để ghép vào mô tả phương án: "Xếp tự học Listening đến lúc thi". */
const SKILL_WORD: Record<string, string> = {
  listening: 'Listening', reading: 'Reading',
  writing1: 'Writing Task 1', writing2: 'Writing Task 2', speaking: 'Speaking',
};

/**
 * CASE Ý THỨC/KHÁC TỰ SINH SAU MỘT ĐỢT MT CÓ SOS, mang đúng hai phương án trao đổi.
 *
 * Từ vòng 4 đây là một CASE bình thường, không còn bảng Liên hệ riêng. Một phần đã làm, một
 * phần còn treo, để màn việc có cả hai trạng thái thật.
 *
 * Hạn làm theo mức SOS (7/5/3 ngày), dùng chung thang với mọi phương án khác.
 */
function seedBehaviourCase(conn: any, o: {
  attemptId: number; attemptNo: number; sid: number; cycleId: number | null;
  testDate: string; level: number; failedCount: number;
  gvcn: number; counts: { cases: number };
}) {
  const info = conn
    .prepare(
      `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category,
                              origin_kind, detected_at, sos_level, status, dedup_key, created_at)
       VALUES (?,?,?, 'behaviour', 'other', 'behaviour', 'mock', ?,?,?,?,?)
       ON CONFLICT(dedup_key) DO NOTHING`,
    )
    .run(o.attemptId, o.sid, o.cycleId, o.testDate, o.level,
         // Xong cả hai việc thì case đóng; còn treo thì vẫn đang xử lý.
         (o.attemptId + o.level) % 3 === 0 ? 'done' : 'in_progress',
         `bm:${o.attemptId}`, NOW);
  const caseId = Number(info.lastInsertRowid);
  if (!caseId) return;
  o.counts.cases += 1;

  conn
    .prepare(
      `INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, sos_level,
                                    occurred_on, created_at, dedup_key)
       VALUES (?, 'opened', ?,?,?,?,?,?)`,
    )
    .run(caseId, o.attemptId, o.attemptNo, o.level, o.testDate, NOW, `mt:${o.attemptId}:${caseId}:opened`);

  const due = cycleDeadline(o.testDate, 'behaviour');
  /*
   * ĐỢT MT CŨ THÌ HAI VIỆC TRAO ĐỔI COI NHƯ ĐÃ LÀM XONG.
   *
   * Bản trước để tình trạng rải đều theo `attemptId`, bất kể đợt MT cách đây một tuần hay
   * ba tháng. Hậu quả trên màn việc: 97% hàng đợi "phương án tới hạn làm" là màu đỏ, và một
   * hàng đợi toàn đỏ thì không nói được gì — người dùng không phân biệt nổi "quá hạn", "tới
   * hạn hôm nay" và "còn hạn", đúng ba thứ giao diện đang cố nói, nên họ thôi nhìn nó.
   *
   * Một trung tâm có thật thì gọi phụ huynh trong vài tuần chứ không để treo ba tháng. Nên
   * đợt MT cách ngày demo quá 35 ngày được coi là đã làm xong; việc còn treo chỉ nằm ở
   * những đợt gần đây — đúng chỗ người dùng cần nhìn.
   */
  const stale = addDays(o.testDate, 35) < DEMO_DATE;
  const donePart = stale ? 0 : (o.attemptId + o.level) % 3;   // 0 = xong cả hai, 1 = xong một, 2 = chưa
  for (const [i, kind] of CONTACT_KINDS.entries()) {
    const done = donePart === 0 || (donePart === 1 && i === 0);
    conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, performer_name,
                                         status, completed_date, action_due, migration_key, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(migration_key) DO NOTHING`,
      )
      .run(caseId, kind,
           done ? (kind === 'talk_student' ? 'Em nhận là chưa ôn kỹ' : 'PH nắm được tình hình')
                : CONTACT_KIND_LABEL[kind],
           done && kind === 'talk_student' ? o.gvcn : null,
           done && kind === 'talk_parent' ? 'Chị Hương (CS)' : null,
           done ? 'completed' : 'planned',
           // Việc đã làm không bao giờ mang ngày ở tương lai — xem `notFuture` ở seedCase.
           done ? (addDays(o.testDate, 5 + i) > DEMO_DATE ? DEMO_DATE : addDays(o.testDate, 5 + i)) : null,
           due, `auto:${o.attemptId}:${kind}`, NOW);
  }
}

const TEACHER_HANDLERS = ['GVCN Thu Trang', 'GVBM Minh Khoa', 'GVCN Bảo Nam', 'GVBM Gia Hân', 'GVCN Quang Duy'];
const CS_HANDLERS = ['CS Ngọc Diệp', 'CS Hải Yến', 'CS Thanh Vân', 'CS Bảo Ngân'];

function seedCase(conn: any, o: {
  attemptId: number; sid: number; cycleId: number | null; attemptNo: number; level: number; testDate: string;
  /** Ô nhập điểm dưới kỳ vọng — mỗi ô một vấn đề riêng. */
  topic: string;
  pattern: CasePattern; recorder: number;
  counts: { students: number; attempts: number; scores: number; cases: number };
}) {
  const h = TEACHER_HANDLERS[(o.attemptId + o.level) % TEACHER_HANDLERS.length];
  const cs = CS_HANDLERS[(o.attemptId + 2) % CS_HANDLERS.length];

  /*
   * VIẾT THẲNG VÀO MÔ HÌNH MỚI.
   *
   * Bản cũ nhét mọi việc đã làm vào năm cột cố định của `sos_cases` — trao đổi HS, trao
   * đổi PH, hỗ trợ học thuật, chính sách, buổi gặp. Năm cột ấy không tả được một case có
   * hai buổi tutor, và cũng không phân biệt được "đã hẹn" với "đã làm". Những cột đó nay
   * chỉ còn để nâng cấp dữ liệu cũ; dữ liệu mẫu mới đi thẳng vào `case_interventions`.
   */
  const status = o.pattern === 'named_only' ? 'open' : o.pattern === 'in_progress' ? 'in_progress' : 'done';
  const disposition = o.pattern === 'done'
    ? (o.level >= 2 ? 'action' : 'monitor')
    : o.pattern === 'in_progress' ? 'action' : null;

  /*
   * MỘT HỌC VIÊN × MỘT HẠNG MỤC = MỘT CASE, sống suốt khoá.
   *
   * Tra TRƯỚC rồi mới quyết định thêm hay cập nhật, thay vì dùng `INSERT ... ON CONFLICT`.
   * Lý do: sau một câu upsert rơi vào nhánh CẬP NHẬT, `lastInsertRowid` KHÔNG về 0 mà giữ
   * nguyên giá trị của lần thêm gần nhất trước đó — tức là id của một case KHÁC. Mốc và
   * phương án sẽ lặng lẽ gắn nhầm sang em khác, không có lỗi nào báo ra.
   *
   * Một em trượt Listening ở cả MT1 lẫn MT2 thì lần thứ hai CẬP NHẬT case đang có sang lượt
   * mới (mở lại nếu nó đã đóng) rồi thêm một mốc — đúng như hệ thống thật làm. Nhờ vậy dữ
   * liệu mẫu có sẵn tình huống case kéo dài qua hai lượt MT mà owner cần nhìn thấy.
   */
  const category = categoryOf('academic', o.topic);
  const dedupKey = `a:${o.sid}:${o.cycleId ?? 0}:${category}`;
  const prior = conn.prepare('SELECT id, status FROM sos_cases WHERE dedup_key = ?').get(dedupKey) as any;

  let caseId: number;
  const reopened = !!prior;
  if (prior) {
    conn
      .prepare(
        `UPDATE sos_cases
            SET attempt_id = ?, sos_level = ?,
                status = CASE WHEN status = 'done' THEN 'in_progress' ELSE status END,
                closed_at = NULL, closed_by = NULL, updated_at = ?
          WHERE id = ?`,
      )
      .run(o.attemptId, o.level, NOW, prior.id);
    caseId = prior.id;
  } else {
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category, origin_kind,
                                detected_at, sos_level, status, disposition, disposition_note,
                                closed_by, closed_at, dedup_key, created_at)
         VALUES (?,?,?, 'academic', ?,?, 'mock', ?,?,?,?,?,?,?,?,?)`,
      )
      .run(o.attemptId, o.sid, o.cycleId, o.topic, category,
           o.testDate, o.level, status, disposition,
           o.pattern === 'done' ? 'Đã hỗ trợ xong đợt này, theo dõi tiếp ở lần đánh giá sau' : null,
           o.pattern === 'done' ? o.recorder : null,
           o.pattern === 'done' ? addDays(o.testDate, 10) : null,
           dedupKey, NOW);
    caseId = Number(info.lastInsertRowid);
    o.counts.cases += 1;
  }

  const kind = reopened ? 'repeat' : 'opened';
  conn
    .prepare(
      `INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, sos_level,
                                    occurred_on, created_at, dedup_key)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(dedup_key) DO NOTHING`,
    )
    .run(caseId, kind, o.attemptId, o.attemptNo, o.level,
         o.testDate, NOW, `mt:${o.attemptId}:${caseId}:${kind}`);

  /*
   * KHÔNG BAO GIỜ GHI "ĐÃ XONG" VÀO MỘT NGÀY CHƯA TỚI.
   *
   * Kịch bản mẫu tính ngày xong theo "ngày thi + 30", nên case của lượt MT gần ngày demo
   * cho ra ngày xong ở TƯƠNG LAI — hồ sơ học viên hiện "xong 10/10" trong khi hôm nay mới
   * 14/09. Máy chủ đã chặn người dùng nhập ngày tương lai; dữ liệu mẫu phải theo cùng một
   * luật, nếu không thì chính bản demo là thứ dạy người dùng rằng luật ấy không có thật.
   */
  const notFuture = (d: string | undefined) =>
    (d && d > DEMO_DATE ? DEMO_DATE : d);

  const iv = (
    kind: string, description: string, performerName: string,
    st: 'planned' | 'started' | 'completed', dates: { started?: string; completed?: string; due?: string } = {},
  ) => conn
    .prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_name, recorded_by,
                                       status, started_date, completed_date, followup_due, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(caseId, kind, description, performerName, o.recorder, st,
         notFuture(dates.started) ?? null, notFuture(dates.completed) ?? null,
         dates.due ?? null, NOW);

  if (o.pattern === 'named_only') {
    /*
     * CÓ TÊN NGƯỜI LÀM NHƯNG CHƯA CÓ NGÀY = MỚI LÊN KẾ HOẠCH, chưa phải đã làm.
     * Đây đúng là chỗ mô hình cũ nói sai: điền tên vào ô là case trông như đã xử lý.
     */
    iv('teaching_adjust', `Sẽ tăng luyện ${SKILL_WORD[o.topic] ?? o.topic} trên lớp`, h, 'planned');
  } else if (o.pattern === 'in_progress') {
    /*
     * Hỗ trợ học thuật MỚI BẮT ĐẦU: có ngày bắt đầu, chưa có ngày xong.
     *
     * NGÀY HẸN XEM LẠI neo quanh NGÀY DEMO, không neo vào ngày thi.
     *
     * Neo vào ngày thi thì mọi case sinh từ MT1 (tháng 7) đều quá hạn hai tháng, và màn
     * việc mở lên chỉ toàn một màu đỏ — không nhìn ra được sự khác nhau giữa "quá hạn",
     * "tới hạn hôm nay" và "còn hạn", cũng là ba thứ mà giao diện đang cố nói. Rải theo
     * `attemptId` nên chạy lại seed vẫn ra đúng dữ liệu cũ.
     */
    const spread = [-11, -4, 0, 5, 12][o.attemptId % 5];
    iv(o.level === 3 ? 'tutor' : 'self_study',
       `${o.level === 3 ? 'Học tutor' : 'Xếp tự học'} ${SKILL_WORD[o.topic] ?? o.topic} đến lần đánh giá sau`,
       h, 'started',
       { started: addDays(o.testDate, 7), due: addDays(DEMO_DATE, spread) });
  } else {
    iv(o.level === 3 ? 'tutor' : 'self_study',
       `${o.level === 3 ? 'Học tutor' : 'Xếp tự học'} ${SKILL_WORD[o.topic] ?? o.topic} đến lúc thi`,
       h, 'completed',
       { started: addDays(o.testDate, 6), completed: addDays(o.testDate, 30) });
    if (o.attemptNo >= 3 && o.level >= 2) {
      iv('extra_support', 'Xin thêm buổi bổ trợ với tutor', h, 'completed', { completed: addDays(o.testDate, 8) });
    }
    if (o.level === 3 && o.attemptNo >= 2) {
      iv('meeting_cx', 'CX / GĐCN gặp riêng học viên', cs, 'completed', { completed: addDays(o.testDate, 5) });
    }
    // Case đã đóng thì phải có ít nhất một lần XEM LẠI, nếu không thì đóng dựa trên cái gì.
    conn
      .prepare(
        `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id, outcome, note, created_at)
         VALUES (?, NULL, ?, ?, ?, ?, ?)`,
      )
      .run(caseId, notFuture(addDays(o.testDate, 28))!, o.recorder,
           o.level === 3 ? 'partial' : 'improved',
           o.level === 3 ? 'Có chuyển biến ở một kỹ năng, hai kỹ năng còn lại chưa rõ'
             : 'Làm bài đều hơn, kết quả trên lớp khá hơn', NOW);
  }

  /*
   * MỘT LƯỢT = MỘT SỰ KIỆN HÀNH TRÌNH, dù lượt đó sinh ra mấy vấn đề. Mức SOS là kết luận
   * của cả lượt; ghi thành ba dòng cho ba kỹ năng thì hành trình đọc như em thi ba lần.
   */
  conn
    .prepare(
      `INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, detail,
                                   ref_table, ref_id, dedup_key, created_by, created_at)
       VALUES (?,?, 'mock_result', ?, ?, ?, 'assessment_attempts', ?, ?, ?, ?)
       ON CONFLICT(dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING`,
    )
    .run(o.sid, o.cycleId, o.testDate, `MT${o.attemptNo}: SOS ${o.level}`,
         `${o.level} kỹ năng dưới kỳ vọng`, o.attemptId, `mock_result:${o.attemptId}`, o.recorder, NOW);
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
    track?: string; topic: string;
    primary?: string; secondary?: string[]; note?: string | null;
    observation?: string | null;
  }) => {
    const cyc = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status='active' LIMIT 1`)
      .get(o.studentId) as any;
    /*
     * CASE TRÙNG — giáo viên báo một hạng mục mà em đã có case chưa xong.
     *
     * Đây chính là tình huống mục 7.13. Hệ thống thật hiện pop-up hỏi "ghi vào case đang có"
     * hay "mở case riêng"; dữ liệu mẫu chọn vế mặc định là GHI VÀO CASE ĐANG CÓ, vì đó là
     * điều đúng trong đa số trường hợp và là thứ owner cần nhìn thấy: mở case ra là có cả
     * lịch sử tự sinh từ điểm lẫn phần giáo viên viết tay.
     *
     * `parallel = 1` để dành cho case mở song song CÓ CHỦ Ý; seed không tự ý dùng nó.
     */
    const track = o.track ?? 'academic';
    const dedupKey = track === 'behaviour'
      ? `bt:${o.studentId}:${cyc?.id ?? 0}`
      : `a:${o.studentId}:${cyc?.id ?? 0}:${categoryOf('academic', o.topic)}`;
    const prior = conn.prepare('SELECT id FROM sos_cases WHERE dedup_key = ?').get(dedupKey) as any;

    let id: number;
    if (prior) {
      conn
        .prepare(
          `UPDATE sos_cases
              SET summary = COALESCE(summary, ?), urgency = COALESCE(?, urgency),
                  reported_by = COALESCE(reported_by, ?),
                  note = TRIM(COALESCE(note || ' · ', '') || COALESCE(?, '')),
                  status = CASE WHEN status = 'done' THEN 'in_progress' ELSE status END,
                  updated_at = ?
            WHERE id = ?`,
        )
        .run(o.summary, o.urgency, o.reporter, o.note ?? '', NOW, prior.id);
      id = prior.id;
    } else {
      const info = conn
        .prepare(
          `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category, origin_kind,
                                  detected_at, reported_by, summary, urgency, sos_level, status,
                                  note, dedup_key, created_at)
           VALUES (NULL, ?,?,?,?,?, 'teacher_report', ?,?,?,?, NULL, 'open', ?,?,?)`,
        )
        .run(o.studentId, cyc?.id ?? null, track, o.topic, categoryOf(track, o.topic),
             o.detectedAt, o.reporter, o.summary, o.urgency, o.note ?? null, dedupKey, NOW);
      id = Number(info.lastInsertRowid);
      conn
        .prepare(
          `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)
           VALUES (?, 'opened', ?,?,?,?,?)`,
        )
        .run(id, o.detectedAt, 'Giáo viên tự báo', o.reporter, NOW, `open:${id}`);
      counts.reports += 1;
    }
    const addIssue = (code: string, role: string, skill?: string | null, obs?: string | null) =>
      conn.prepare(
        `INSERT INTO case_issues (case_id, role, taxonomy_code, taxonomy_version, skill, observation, created_by, created_at)
         VALUES (?,?,?,1,?,?,?,?)`,
      ).run(id, role, code, skill ?? null, obs ?? null, o.reporter, NOW);
    if (o.primary) addIssue(o.primary, 'primary', o.topic, o.observation);
    for (const c of o.secondary ?? []) addIssue(c, 'secondary', o.topic);
    conn.prepare(
      `INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, detail,
                                   ref_table, ref_id, dedup_key, created_by, created_at)
       VALUES (?,?, 'case_opened', ?,?,?, 'sos_cases', ?, ?, ?, ?)
       ON CONFLICT(dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING`,
    ).run(o.studentId, cyc?.id ?? null, o.detectedAt, 'Giáo viên ghi nhận cần hỗ trợ', o.summary,
          id, `case_open:${id}:${o.detectedAt}`, o.reporter, NOW);
    return id;
  };

  const addIntervention = (caseId: number, o: {
    kind: string; description: string; performerUser?: number | null; performerName?: string | null;
    recorder: number; status: string; started?: string | null; completed?: string | null; due?: string | null;
    /* Phần duyệt. `approvalState` để trống nghĩa là KHÔNG cần duyệt, khác hẳn 'pending'. */
    approvalState?: 'pending' | 'approved' | 'declined' | null;
    approvalDue?: string | null; approvalBy?: number | null; approvalAt?: string | null;
    approvalNote?: string | null;
  }) => {
    const info = conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, performer_name,
                                         recorded_by, status, started_date, completed_date, followup_due,
                                         needs_approval, approval_state, approval_due, approval_by,
                                         approval_at, approval_note, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(caseId, o.kind, o.description, o.performerUser ?? null, o.performerName ?? null,
           o.recorder, o.status, o.started ?? null, o.completed ?? null, o.due ?? null,
           o.approvalState ? 1 : 0, o.approvalState ?? null, o.approvalDue ?? null,
           o.approvalBy ?? null, o.approvalAt ?? null, o.approvalNote ?? null, NOW);
    conn.prepare(`UPDATE sos_cases SET status = 'in_progress', updated_at = ? WHERE id = ? AND status = 'open'`)
      .run(NOW, caseId);
    counts.interventions += 1;
    return Number(info.lastInsertRowid);
  };

  /**
   * Một lần trao đổi giáo viên CHỦ ĐỘNG ghi, ngoài hai việc bắt buộc khi có SOS.
   *
   * Từ vòng 4 nó là một PHƯƠNG ÁN nằm trong case Ý thức/Khác của em, không còn bảng riêng.
   * Đã làm rồi nên ghi thẳng "đã xong" kèm ngày, và không có hạn — hạn chỉ có nghĩa với
   * việc chưa làm.
   */
  const addContact = (caseId: number, o: {
    kind: string; on: string; by?: number | null; performerName?: string | null; note?: string | null;
  }) => {
    conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, performer_name,
                                       status, completed_date, created_at)
       VALUES (?,?,?,?,?, 'completed', ?,?)`,
    ).run(caseId, o.kind, o.note ?? null, o.by ?? null, o.performerName ?? null, o.on, NOW);
    counts.interventions += 1;
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
      studentId: a.id, classCode: 'MB-FT 101', reporter: gv, detectedAt: '2026-09-05',
      summary: 'Em nghe không kịp phần chi tiết, hay bỏ trống 5–6 câu cuối',
      urgency: 'attention',
      topic: 'listening',
      primary: 'student.listening.sound',
      observation: 'Bài luyện trên lớp phần 3 và 4 sai nhiều, phần 1 vẫn tốt',
      secondary: ['student.listening.distractor'],
    });
    const iv = addIntervention(c1, {
      kind: 'teaching_adjust', description: 'Thêm 15 phút luyện nghe chi tiết mỗi buổi',
      performerUser: gv, recorder: gv, status: 'started', started: '2026-09-06', due: '2026-09-20',
    });
    addFollowUp(c1, { interventionId: iv, on: '2026-09-11', observer: gv, outcome: 'partial',
      note: 'Phần 3 đỡ hơn, phần 4 vẫn còn trống nhiều' });
  }

  // --- 2. Case nhiều yếu tố, có cả phía giáo viên và hoàn cảnh gia đình.
  const b = inClass('MB-FT 102')[0];
  if (b) {
    const core = coreOf('MB-FT 102');
    const c2 = openCase({
      studentId: b.id, classCode: 'MB-FT 102', reporter: core, detectedAt: '2026-08-30',
      summary: 'Em nghỉ nhiều buổi, bài về nhà không nộp',
      urgency: 'urgent',
      track: 'behaviour', topic: 'attendance',
      observation: 'Nghỉ 4/8 buổi trong hai tuần',
      note: 'Nhà xa, bố mẹ đi làm ca nên không đưa đón được buổi tối',
    });
    /*
     * Hai lần trao đổi này là PHƯƠNG ÁN của chính case Ý thức ở trên — giáo viên chủ động
     * gọi ngoài SOS, đã làm xong rồi nên không có hạn.
     */
    addContact(c2, { kind: 'talk_parent', on: '2026-09-01',
      performerName: 'Chị Hương (CS)', note: 'PH nói em phải trông em nhỏ buổi tối' });
    addContact(c2, { kind: 'talk_student', on: '2026-09-02', by: core,
      note: 'Em hứa đi đủ, xin đổi sang ca sáng' });
    const iv2 = addIntervention(c2, {
      kind: 'teaching_adjust', description: 'Điểm danh sát và nhắn GVCN ngay khi vắng',
      performerUser: core, recorder: core, status: 'completed', completed: '2026-09-02', due: '2026-09-09',
    });
    addFollowUp(c2, { interventionId: iv2, on: '2026-09-09', observer: core, outcome: 'improved',
      note: 'Hai tuần gần đây đi đủ, đã nộp bài' });
    addFollowUp(c2, { on: '2026-09-13', observer: core, outcome: 'unchanged',
      note: 'Tuần này lại nghỉ một buổi, tiếp tục theo dõi' });
  }

  // --- 3. Case CHỈ THEO DÕI, không hẹn ngày — không bao giờ được coi là quá hạn.
  const c = inClass('BC-FT 205')[0];
  if (c) {
    const gv = teacherOf('BC-FT 205', 'writing1');
    const c3 = openCase({
      studentId: c.id, classCode: 'BC-FT 205', reporter: gv, detectedAt: '2026-09-07',
      summary: 'Bài viết task 1 hay thiếu câu tổng quan',
      urgency: 'normal',
      topic: 'writing1',
      primary: 'student.writing.task',
    });
    conn.prepare(`UPDATE sos_cases SET disposition = 'monitor', disposition_note = ?, updated_at = ? WHERE id = ?`)
      .run('Nhắc trong giờ chữa bài, chưa cần hỗ trợ riêng', NOW, c3);
  }

  // --- 4. Case đã hẹn xem lại và QUÁ HẠN — để hàng đợi "tới hạn" có dữ liệu thật.
  const d = inClass('CP-FT 110')[0];
  if (d) {
    const gv = teacherOf('CP-FT 110', 'speaking');
    const c4 = openCase({
      studentId: d.id, classCode: 'CP-FT 110', reporter: gv, detectedAt: '2026-08-23',
      summary: 'Phát âm đuôi và trọng âm sai nhiều, người nghe khó hiểu',
      urgency: 'attention',
      topic: 'speaking',
      primary: 'student.speaking.pronunciation',
    });
    addIntervention(c4, {
      kind: 'tutor', description: 'Học tutor phát âm 2 buổi/tuần',
      performerName: 'Tutor Ngọc', recorder: gv, status: 'started',
      started: '2026-08-27', due: '2026-09-10',       // hẹn xem lại 10/09, nay đã 14/09 — quá hạn
    });
  }

  // --- 5. Case đóng với "không cần xử lý thêm" — có kết luận rõ, không phải bỏ quên.
  const e = inClass('HD-FT 302')[0];
  if (e) {
    const core = coreOf('HD-FT 302');
    const mgr = managers.get('HD')?.[0] ?? adminId;
    const c5 = openCase({
      studentId: e.id, classCode: 'HD-FT 302', reporter: core, detectedAt: '2026-08-15',
      summary: 'Em có vẻ mất tập trung mấy buổi liền',
      urgency: 'normal',
      track: 'behaviour', topic: 'participation',
      note: 'Em bị ốm mấy hôm, đã khỏi',
    });
    addContact(c5, { kind: 'talk_student', on: '2026-08-17', by: core,
      note: 'Hỏi thăm, em bị ốm nên mệt' });
    addFollowUp(c5, { on: '2026-08-24', observer: core, outcome: 'improved', note: 'Em khỏi ốm, đã tập trung lại' });
    conn.prepare(
      `UPDATE sos_cases SET status = 'done', disposition = 'no_action', disposition_note = ?,
              closed_by = ?, closed_at = ?, updated_at = ? WHERE id = ?`,
    ).run('Nguyên nhân là sức khoẻ, đã ổn định — không cần hỗ trợ học thuật', mgr, NOW, NOW, c5);
  }

  /*
   * --- 5b. ĐỀ XUẤT CHỜ DUYỆT.
   *
   * Giáo viên tự quyết phương án của mình có cần Quản lý duyệt hay không. Dữ liệu mẫu phải
   * có đủ BỐN trạng thái, nếu không thì mở màn hình lên chỉ thấy một kiểu và không biết
   * các kiểu còn lại trông thế nào:
   *   - chờ duyệt, CÒN hạn      → Quản lý thấy việc nhưng chưa đỏ
   *   - chờ duyệt, ĐÃ quá hạn   → đúng chỗ nhãn "Quá hạn duyệt" xuất hiện
   *   - đã duyệt                → giáo viên làm tiếp, có hẹn xem lại
   *   - không duyệt             → có lý do, và phương án dừng lại
   */
  const p1 = inClass('CP-FT 110')[1];
  if (p1) {
    const gv = teacherOf('CP-FT 110', 'writing1');
    const c6 = openCase({
      studentId: p1.id, classCode: 'CP-FT 110', reporter: gv, detectedAt: '2026-09-08',
      summary: 'Task 2 lạc đề hai bài liên tiếp, viết không kịp giờ',
      urgency: 'attention',
      topic: 'writing2',
      primary: 'student.writing.task',
    });
    // Còn hạn: đề xuất 10/09, mức "cần chú ý" nên Quản lý có 7 ngày → 17/09.
    addIntervention(c6, {
      kind: 'tutor', description: 'Xin 4 buổi tutor Writing task 2 trước MT tới',
      performerUser: gv, recorder: gv, status: 'planned',
      approvalState: 'pending', approvalDue: '2026-09-17',
    });
  }

  const p2 = inClass('BC-FT 205')[1];
  if (p2) {
    const gv = teacherOf('BC-FT 205', 'listening');
    const c7 = openCase({
      studentId: p2.id, classCode: 'BC-FT 205', reporter: gv, detectedAt: '2026-09-03',
      summary: 'Em xin lùi lịch thi vì trùng lịch thi học kỳ ở trường',
      urgency: 'urgent',
      topic: 'reading',
      primary: 'student.reading.technique',
      note: 'Trùng lịch thi học kỳ ở trường, em xin lùi MT3',
    });
    // Quá hạn: case GẤP nên Quản lý chỉ có 3 ngày, hạn 06/09 mà nay đã 14/09.
    addIntervention(c7, {
      kind: 'reschedule_mt', description: 'Đề nghị lùi MT3 sang tuần sau, giữ nguyên ngày thi thật',
      performerUser: gv, recorder: gv, status: 'planned',
      approvalState: 'pending', approvalDue: '2026-09-06',
    });
  }

  const p3 = inClass('MB-FT 102')[1];
  if (p3) {
    const gv = teacherOf('MB-FT 102', 'speaking');
    const mgr = managers.get('MB')?.[0] ?? adminId;
    const c8 = openCase({
      studentId: p3.id, classCode: 'MB-FT 102', reporter: gv, detectedAt: '2026-08-27',
      summary: 'Nói ngắn, hết ý sau 20 giây ở part 2',
      urgency: 'attention',
      topic: 'speaking',
      primary: 'student.speaking.fluency',
    });
    addIntervention(c8, {
      kind: 'tutor', description: 'Tutor Speaking 1 buổi/tuần trong 4 tuần',
      performerName: 'Tutor Minh', recorder: gv, status: 'started', started: '2026-09-03',
      due: '2026-09-24',                                  // hẹn xem lại còn xa, CHƯA quá hạn
      approvalState: 'approved', approvalDue: '2026-09-03', approvalBy: mgr,
      approvalAt: '2026-09-01', approvalNote: 'Duyệt 4 buổi, ưu tiên part 2',
    });
  }

  const p4 = inClass('HD-FT 302')[1];
  if (p4) {
    const gv = teacherOf('HD-FT 302', 'reading');
    const mgr = managers.get('HD')?.[0] ?? adminId;
    const c9 = openCase({
      studentId: p4.id, classCode: 'HD-FT 302', reporter: gv, detectedAt: '2026-08-24',
      summary: 'Đọc chậm, phần 3 gần như bỏ trống',
      urgency: 'normal',
      topic: 'reading',
      primary: 'student.reading.technique',
    });
    addIntervention(c9, {
      kind: 'tutor', description: 'Xin 8 buổi tutor Reading',
      performerUser: gv, recorder: gv, status: 'cancelled',
      approvalState: 'declined', approvalDue: '2026-08-31', approvalBy: mgr,
      approvalAt: '2026-08-30',
      approvalNote: 'Chưa cần tutor, thử tăng bài luyện có bấm giờ trên lớp trước 3 tuần',
    });
    addIntervention(c9, {
      kind: 'teaching_adjust', description: 'Luyện đọc bấm giờ 10 phút mỗi buổi',
      performerUser: gv, recorder: gv, status: 'started', started: '2026-08-31', due: '2026-09-21',
    });
  }

  /*
   * Hai khối "Ghi nhận nhanh" của vòng trước ĐÃ BỎ. Vòng 4 chỉ còn MỘT nguồn điểm — điểm
   * các lượt MT — nên không dựng thêm một đường số liệu song song vào dữ liệu mẫu nữa.
   */
}

function seedRegularClasses(conn: any, ctx: {
  classId: Map<string, number>;
  allStudents: { id: number; classCode: string; branch: string }[];
  adminId: number; managers: Map<string, number[]>;
  counts: { students: number; cycles: number; attempts: number; scores: number; cases: number; checkins: number; skips: number };
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
  /*
   * TỔNG ĐIỂM khác nhau giữa các môn — đúng như ngoài đời, và cũng là lý do ô nhập bắt gõ
   * CẢ tổng: L/R chấm trên 40, W trên 20, S trên 25.
   */
  const TOTALS: Record<string, number> = {
    listening: 40, reading: 40, writing: 20, speaking: 25,
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
          `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score,
                                        start_period_id, started_at, status, note, created_at)
           VALUES (?, 1, NULL, ?, NULL, ?, ?, 'active', ?, ?)`,
        )
        /* Lớp Normal: tuần bắt đầu của em chính là tuần khai giảng của lớp. */
        .run(st.id, programme, ensurePeriod(cls.startDate).id, cls.startDate,
             `Khoá ${tpl.name} — lớp ${cls.code}`, NOW);
      counts.cycles += 1;
      const cycleId = Number(cyc.lastInsertRowid);

      tpl.checkpoints.forEach((cp, ci) => {
        // Tuần học N bắt đầu sau (N-1) tuần kể từ ngày khai giảng.
        const week = mondayOf(addDays(cls.startDate, (cp.studyWeek - 1) * 7));
        const period = ensurePeriod(week);
        // Tuần đã bắt đầu thì bài đã làm — không cần một ngày cụ thể để biết điều đó.
        const past = week <= DEMO_DATE;

        const info = conn
          .prepare(
            `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                              status, created_by, created_at)
             VALUES (?,?,?,?,?,?,?,?,?)`,
          )
          .run(cycleId, st.id, ci + 1, cp.kind, cid, period.id, 'planned', manager, NOW);
        counts.attempts += 1;
        const attemptId = Number(info.lastInsertRowid);
        if (!past) return;                            // bài của tuần sau: chỉ có kế hoạch

        const script = SCRIPT[(idx + ci) % SCRIPT.length];
        let scored = 0;
        let failed = 0;
        const failingSkills: string[] = [];
        tpl.skills.forEach((skill, si) => {
          const ratio = script[si % script.length];
          if (ratio === null) return;                 // chưa nhập điểm kỹ năng này
          const total = TOTALS[skill] ?? 40;
          const score = Math.round(ratio * total);
          conn
            .prepare(
              `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_by, entered_at)
               VALUES (?,?,?,?,?,?)`,
            )
            .run(attemptId, skill, score, total, manager, NOW);
          counts.scores += 1;
          scored += 1;
          if (score / total < 0.6) { failed += 1; failingSkills.push(skill); }
        });

        // Đủ điểm mọi kỹ năng mới chốt. Thiếu một môn thì vẫn đang chờ, KHÔNG kết luận.
        if (scored === tpl.skills.length) {
          conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = ?`).run(attemptId);
          if (failed > 0) {
            const level = failed >= 3 ? 3 : failed;
            /*
             * MỘT VẤN ĐỀ CHO MỖI KỸ NĂNG, kỹ năng của chính chương trình lớp đó
             * (môn W của Normal), không ép về bộ năm ô IELTS.
             */
            for (const skill of failingSkills) {
              conn
                .prepare(
                  `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category,
                                          origin_kind, detected_at, sos_level, status, dedup_key, created_at)
                   VALUES (?,?,?, 'academic', ?,?, 'mock', ?,?,?,?,?)
                   ON CONFLICT(dedup_key) DO NOTHING`,
                )
                .run(attemptId, st.id, cycleId, skill, categoryOf('academic', skill),
                     week, level, ci === 0 ? 'in_progress' : 'open',
                     `a:${st.id}:${cycleId ?? 0}:${categoryOf('academic', skill)}`, NOW);
              counts.cases += 1;
            }
            /* Lớp thường CÓ hai việc trao đổi, nhưng KHÔNG tự sinh phương án hỗ trợ. */
            seedBehaviourCase(conn, {
              attemptId, attemptNo: 1, sid: st.id, cycleId, testDate: week, level,
              failedCount: failed, gvcn: manager, counts,
            });
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
  counts: { students: number; cycles: number; attempts: number; scores: number; cases: number; checkins: number; skips: number };
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
      const newWeek = '2026-11-02';
      conn.prepare('UPDATE assessment_attempts SET planned_period_id = ?, updated_at = ? WHERE id = ?')
        .run(periodOf(newWeek), NOW, a.id);
      conn.prepare(
        `INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)
         VALUES (?, 'week_set', 'planned_period', ?, ?, ?, ?, ?)`,
      ).run(a.id, '2026-10-12', newWeek, 'Trùng lịch phòng thi', managers.get('CP')![0], NOW);
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
      ).run('2026-09-21', ctx.branchAdmins.get('MB')!, NOW, 'Giáo viên Writing nghỉ phép, gia hạn thêm một tuần', a.id);
      conn.prepare(
        `INSERT INTO attempt_schedule_history (attempt_id, action, field, new_value, reason, actor_user_id, created_at)
         VALUES (?, 'deadline_set', 'deadline_override', '2026-09-21', ?, ?, ?)`,
      ).run(a.id, 'Giáo viên Writing nghỉ phép, gia hạn thêm một tuần', ctx.branchAdmins.get('MB')!, NOW);
    }
  }

  // 4) Chuyển lớp: lượt ĐÃ XONG giữ lớp cũ, lượt chưa xong chuyển sang lớp mới.
  const transferred = inClass('MB-FT 101')[2];
  const toClass = classId.get('MB-FT 102');
  if (transferred && toClass) {
    const cur = conn.prepare(`SELECT * FROM enrollments WHERE student_id = ? AND status='active'`).get(transferred.id) as any;
    conn.prepare(`UPDATE enrollments SET status='transferred', ended_at=?, end_reason=? WHERE id=?`)
      .run('2026-09-07', 'Chuyển ca học buổi chiều', cur.id);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
      .run(transferred.id, toClass, '2026-09-07', NOW);
    conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE student_id = ? AND status = 'planned'`)
      .run(toClass, transferred.id);
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at)
         VALUES (?, 'transfer', ?, ?, ?, ?, ?)`,
      )
      .run(transferred.id, '2026-09-07', 'Chuyển sang lớp MB-FT 102', 'Chuyển ca học buổi chiều', adminId, NOW);
  }

  // 5) Tạm dừng rồi quay lại học.
  const paused = inClass('BC-FT 205')[4];
  if (paused) {
    for (const e of [
      { type: 'pause', date: '2026-08-17', title: 'Tạm dừng học', detail: 'Gia đình xin nghỉ 2 tuần' },
      { type: 'resume', date: '2026-08-31', title: 'Quay lại học', detail: null },
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
   * 5b) NGHĨA VỤ HÀNG TUẦN CỦA ADMIN CHI NHÁNH — nay nằm THẲNG trong lịch của lớp.
   *
   * Bản trước dựng thêm vài lượt MT rời chỉ để màn "Cần cập nhật ngày MT" có gì hiện. Hậu
   * quả là số lượt MT của một em ở màn này không khớp với kế hoạch của lớp em đó, và owner
   * đã báo đúng chỗ ấy. Nay hai tình huống đó là lịch thật của hai lớp thật:
   *
   *   MB-FT 101 · MT3 tuần W3 SEP (tuần này) chưa có ngày  → Admin CN cần làm ngay
   *   BC-FT 205 · MT2 tuần W2 SEP (tuần trước) chưa có ngày → đã quá hạn
   *
   * Các lượt của tuần sau vẫn KHÔNG hiện, vì chưa đến lượt.
   */

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

  /*
   * 5e) MA TRẬN TÌNH HUỐNG VÒNG 5 (mục 8.2) — thêm đúng những ô mà dữ liệu nền chưa có.
   */
  seedVong5(conn, { classId, allStudents, adminId, branchAdmins: ctx.branchAdmins, managers, counts });

  /*
   * 6) Cảnh báo — dữ liệu lịch sử để thử bộ lọc hành trình.
   *
   * Dòng "Đánh giá GV" của bản trước đã bỏ cùng với chức năng ghi nhận của giáo viên: để
   * lại thì nhật ký còn một loại sự kiện mà không màn nào mở ra được.
   */
  const warned = inClass('UB-FT 401')[5];
  if (warned) {
    for (const e of [
      { type: 'warning', date: '2026-08-31', title: 'Cảnh báo chuyên cần', detail: 'Vắng 3 buổi liên tiếp' },
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
      .run(repeater.id, '2026-09-12', 'Học tiếp lộ trình LT2', 'Chưa đạt target, học thêm trước khi thi', adminId, NOW);
  }

  // 8) SANG LỘ TRÌNH MỚI: LT1 xong, thi thật, mở LT2 với target mới nên MT đánh lại từ 1.
  const promoted = inClass('MB-FT 101')[3];
  if (promoted) {
    const old = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1')
      .get(promoted.id) as any;
    conn.prepare(`UPDATE learning_cycles SET status='completed', ended_at=? WHERE id=?`).run('2026-09-05', old.id);
    const newTarget = (old.target_score ?? 6) + 0.5;
    const cyc = conn
      .prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, target_score, exam_period_id, exam_month,
                                      start_period_id, started_at, status, note, created_at)
         VALUES (?,?, 'LT2', ?, ?, '2027-03', ?, ?, 'active', ?, ?)`,
      )
      .run(promoted.id, old.seq + 1, newTarget, ensurePeriod('2027-03-01').id,
           ensurePeriod('2026-09-07').id, '2026-09-07',
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
      .run(promoted.id, '2026-09-07', 'Bắt đầu lộ trình LT2', `Target mới ${newTarget}`, cycleId, adminId, NOW);
  }

  // 9) Hai học viên đã kết thúc: một em mới xong (còn hiện, làm dịu màu), một em đã quá
  //    hai tuần nên tới lượt vào lưu trữ. Lưu trữ chỉ ẩn khỏi danh sách, không xoá gì.
  for (const [idx, date] of [[6, '2026-08-24'], [7, '2026-09-09']] as [number, string][]) {
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
    assignee: managers.get('MB')![0], due: '2026-09-09', progress: 'doing', type: 'in_period', periodId: prevId });
  addTask({ title: 'Bổ sung giáo viên dự phòng ca tối', unit: unitOf('BC'), branch: 'BC',
    assignee: managers.get('BC')![0], due: '2026-09-07', progress: 'not_started', type: 'in_period', periodId: prevId });
  // Sắp đến hạn trong 3 ngày.
  addTask({ title: 'Chốt danh sách học viên thi thật tháng 11', unit: unitOf('CP'), branch: 'CP',
    assignee: managers.get('CP')![0], due: '2026-09-16', progress: 'doing', type: 'in_period', periodId: currentPeriodId });
  // Hoàn thành sau hạn — KHÔNG được đánh dấu quá hạn nữa.
  addTask({ title: 'Rà soát lịch Mock tuần W2 SEP', unit: unitOf('HD'), branch: 'HD',
    assignee: managers.get('HD')![0], due: '2026-09-06', progress: 'done', type: 'in_period', periodId: prevId,
    completedAt: '2026-09-10T09:00:00.000Z' });
  // Không có hạn — không bao giờ tự tính quá hạn.
  addTask({ title: 'Sưu tầm đề Speaking part 2 theo chủ đề mới', unit: unitOf('TUTOR'), branch: null,
    assignee: adminId, due: null, progress: 'doing', type: 'long_term', periodId: currentPeriodId });
  // Dài hạn chưa xong — xét xuyên kỳ, không clone sang tuần mới.
  addTask({ title: 'Chuẩn hoá quy trình bàn giao lớp giữa các ca', unit: unitOf('UB'), branch: 'UB',
    assignee: managers.get('UB')![0], due: '2026-11-30', progress: 'doing', type: 'long_term', periodId: prevId });
  addTask({ title: 'Tuyển thêm 2 tutor part-time cho ca cuối tuần', unit: unitOf('TUTOR'), branch: null,
    assignee: adminId, due: '2026-10-15', progress: 'not_started', type: 'long_term', periodId: currentPeriodId });
  addTask({ title: 'Tạm dừng: đổi phần mềm chấm Speaking', unit: unitOf('MB'), branch: 'MB',
    assignee: managers.get('MB')![0], due: '2026-09-11', progress: 'paused', type: 'in_period', periodId: prevId,
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
           '2026-09-17', 'not_started', 'Sinh từ case SOS 3', 'sos_case', someCase.id, adminId, NOW);
  }
  return n;
}

export { weekInfo };

// ==================================================================== vòng 5 · ma trận mục 8.2

/**
 * MA TRẬN TÌNH HUỐNG CỦA VÒNG 5 (mục 8.2).
 *
 * Phần seed cũ đã dựng sẵn phần lớn dữ liệu nền: lớp, điểm, case sinh từ điểm, mức SOS các
 * loại. Hàm này KHÔNG dựng lại những thứ đó. Nó chỉ thêm đúng những tình huống mà kiểm tra
 * bằng truy vấn thấy CHƯA CÓ ô nào trong dữ liệu — và thêm trên những em đã có sẵn, vì thêm
 * bản ghi chỉ để bảng trông nhiều số là đúng thứ mục 8.1 cấm.
 *
 * Mười ba tình huống, mỗi tình huống một em, ghi rõ ở tài liệu bàn giao:
 *
 *   A  case tên tự nhập, chưa có phương án nào
 *   B  hai case CÙNG một kỹ năng, mở song song có chủ ý
 *   C  case đã chốt xong rồi tái phát → case MỚI nối vào case cũ
 *   D  một phương án đi qua ba chu kỳ nối tiếp
 *   E  phương án bị THAY THẾ, không phải đã thành công
 *   F  xin hỗ trợ Quản lý — chu kỳ dừng lại chờ người khác
 *   G  case mở đúng ngày demo 14/09/2026, hạn phải ra 27/09/2026
 *   H  phương án cần duyệt: chu kỳ chỉ chạy TỪ LÚC ĐƯỢC DUYỆT
 *   I  Quản lý KHÔNG duyệt, có lý do và hướng sửa
 *   J  điểm giáo viên tự chấm, khác điểm chính thức
 *   K  case Ý thức/Khác đủ vòng: hạn một tuần, kết quả xấu, vẫn đóng được
 *   L  FOU → BE: chuyển tiếp cả lớp, giữ nguyên lịch sử lớp cũ
 *   M  BE → FT: chuyển một em vào lớp Fast Track đang chạy
 */
function seedVong5(conn: any, ctx: {
  classId: Map<string, number>;
  allStudents: { id: number; classCode: string; branch: string }[];
  adminId: number; branchAdmins: Map<string, number>; managers: Map<string, number[]>;
  counts: Record<string, number>;
}) {
  const { classId, allStudents, adminId, managers, counts } = ctx;
  const inClass = (code: string) => allStudents.filter((s) => s.classCode === code);
  const cycleOf = (sid: number) =>
    (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status='active' ORDER BY seq DESC LIMIT 1`)
      .get(sid) as any)?.id ?? null;
  const coreOf = (classCode: string) =>
    (conn.prepare(
      `SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status='active' LIMIT 1`,
    ).get(classId.get(classCode)) as any)?.user_id ?? adminId;

  /*
   * CHỌN MỘT EM CÒN TRỐNG HẠNG MỤC ĐÓ.
   *
   * Seed nền đã mở sẵn rất nhiều case sinh từ điểm, nên chọn em theo số thứ tự trong lớp là
   * đâm thẳng vào luật chống trùng hạng mục. Hàm này chọn em ĐẦU TIÊN trong lớp chưa có case
   * nào ở hạng mục cần dùng — nhờ vậy mỗi tình huống dưới đây đứng một mình, đọc ra đúng cái
   * nó muốn minh hoạ, và chạy lại seed vẫn cho ra đúng em cũ.
   */
  const pick = (classCode: string, track: string, topic: string) => {
    const category = categoryOf(track, topic);
    return inClass(classCode).find((st) => {
      const cycleId = cycleOf(st.id);
      const key = track === 'behaviour'
        ? `bt:${st.id}:${cycleId ?? 0}`
        : `a:${st.id}:${cycleId ?? 0}:${category}`;
      return !conn.prepare('SELECT 1 FROM sos_cases WHERE dedup_key = ?').get(key);
    }) ?? null;
  };

  /** Mở một case với TÊN TỰ NHẬP — không dùng tên tự sinh kiểu "MT2 - Reading dưới kỳ vọng". */
  const named = (o: {
    sid: number; classCode: string; title: string; summary: string;
    track?: string; topic: string; detectedAt: string;
    parallel?: boolean; previousCaseId?: number | null; status?: string;
  }): number => {
    const track = o.track ?? 'academic';
    const cycleId = cycleOf(o.sid);
    const category = categoryOf(track, o.topic);
    const dedupKey = o.parallel ? null
      : track === 'behaviour' ? `bt:${o.sid}:${cycleId ?? 0}` : `a:${o.sid}:${cycleId ?? 0}:${category}`;
    const info = conn
      .prepare(
        `INSERT INTO sos_cases (student_id, cycle_id, track, topic, category, title, summary,
                                origin_kind, detected_at, urgency, status, dedup_key, parallel,
                                previous_case_id, reported_by, created_at)
         VALUES (?,?,?,?,?,?,?, 'teacher_report', ?, 'normal', ?, ?, ?, ?, ?, ?)`,
      )
      .run(o.sid, cycleId, track, o.topic, category, o.title, o.summary,
           o.detectedAt, o.status ?? 'open', dedupKey, o.parallel ? 1 : 0,
           o.previousCaseId ?? null, coreOf(o.classCode), NOW);
    counts.cases += 1;
    return Number(info.lastInsertRowid);
  };

  /** Thêm một phương án. `cycleStart` quyết định hạn — đúng luật chu kỳ hai tuần. */
  const plan = (o: {
    caseId: number; kind: string; description: string; performer: number;
    cycleStart: string; cycleNo?: number; status?: string; track?: string;
    needsApproval?: boolean; approvalState?: string | null; approvalNote?: string | null;
    approvalAt?: string | null; approver?: number | null;
    completedDate?: string | null; closedReason?: string | null;
  }): number => {
    const due = cycleDeadline(o.cycleStart, o.track ?? 'academic');
    const running = (o.status ?? 'started') !== 'completed' && o.approvalState !== 'pending';
    const info = conn
      .prepare(
        `INSERT INTO case_interventions (case_id, kind, description, performer_user_id,
                                         status, planned_date, started_date, completed_date,
                                         cycle_no, cycle_started_on, action_due, followup_due,
                                         needs_approval, approval_state, approval_due, approval_note,
                                         approval_by, approval_at, closed_reason,
                                         recorded_by, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(o.caseId, o.kind, o.description, o.performer,
           o.status ?? 'started', o.cycleStart,
           o.approvalState === 'pending' ? null : o.cycleStart,
           o.completedDate ?? null,
           o.cycleNo ?? 1, o.approvalState === 'pending' ? null : o.cycleStart,
           running ? due : null, running ? due : null,
           o.needsApproval ? 1 : 0, o.approvalState ?? null,
           o.approvalState === 'pending' ? cycleDeadline(o.cycleStart, o.track ?? 'academic') : null,
           o.approvalNote ?? null, o.approver ?? null, o.approvalAt ?? null,
           o.closedReason ?? null, adminId, NOW);
    counts.interventions += 1;
    return Number(info.lastInsertRowid);
  };

  /** Ghi một lần cập nhật kết quả, kèm bước tiếp theo và (tuỳ chọn) điểm giáo viên tự chấm. */
  const result = (o: {
    caseId: number; ivId: number | null; observedOn: string;
    outcome: string; nextStep: string | null; note: string;
    cycleNo?: number; cycleDue?: string | null; late?: boolean;
    metrics?: { skill: string; score: number; total: number | null }[] | null;
    observer: number;
  }) => {
    conn
      .prepare(
        `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id,
                                     outcome, note, next_step, cycle_no, cycle_due, late, metrics, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(o.caseId, o.ivId, o.observedOn, o.observer, o.outcome, o.note,
           o.nextStep, o.cycleNo ?? 1, o.cycleDue ?? null, o.late ? 1 : 0,
           o.metrics ? JSON.stringify(o.metrics) : null, NOW);
    counts.followups += 1;
  };

  const journey = (sid: number, type: string, date: string, title: string, detail: string | null) =>
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, detail, created_by, created_at)
         VALUES (?,?,?,?,?,?,?)`,
      )
      .run(sid, type, date, title, detail, adminId, NOW);

  // ───────────────────────────────────────────── A · case tên tự nhập, chưa có phương án
  /*
   * Nút "Hoàn thành case" phải MỜ ĐI và nói rõ vì sao: chưa làm gì cho em thì chưa có gì để
   * kết luận. Đây là em để thử đúng chỗ đó.
   */
  const a = pick('CP-FT 110', 'academic', 'reading');
  if (a) {
    named({
      sid: a.id, classCode: 'CP-FT 110', topic: 'reading',
      title: 'Đọc chậm, không kịp bài Reading',
      summary: 'Em làm hết passage 1 thì đã hết 25 phút, hai passage sau đoán bừa.',
      detectedAt: '2026-09-09',
    });
  }

  // ───────────────────────────────────────────── B · hai case CÙNG kỹ năng, song song
  /*
   * Bảng tóm tắt theo kỹ năng chỉ trỏ được vào MỘT case mỗi hạng mục. Em này có hai case
   * Speaking cùng lúc — một về phát âm, một về vốn từ — nên là chỗ chứng minh khối "Các case
   * của em" mở được cả hai, còn bảng phía trên thì không.
   */
  const bStudent = pick('MB-FT 101', 'academic', 'speaking');
  if (bStudent) {
    named({
      sid: bStudent.id, classCode: 'MB-FT 101', topic: 'speaking',
      title: 'Phát âm đuôi -s, -ed chưa rõ',
      summary: 'Giám khảo phải hỏi lại hai lần trong phần 2.',
      detectedAt: '2026-08-24', status: 'in_progress',
    });
    named({
      sid: bStudent.id, classCode: 'MB-FT 101', topic: 'speaking',
      title: 'Vốn từ Speaking chủ đề học thuật còn mỏng',
      summary: 'Phần 3 em lặp lại ý của phần 2, chưa mở rộng được.',
      detectedAt: '2026-09-07', parallel: true,
    });
  }

  // ───────────────────────────────────────────── C · tái phát sau khi đã chốt xong
  const c = pick('UB-FT 401', 'academic', 'listening');
  if (c) {
    const old = named({
      sid: c.id, classCode: 'UB-FT 401', topic: 'listening',
      title: 'Nghe sót số và tên riêng',
      summary: 'Mất điểm đều ở phần 1 và phần 4.',
      detectedAt: '2026-06-08', status: 'done',
    });
    conn.prepare(
      `UPDATE sos_cases SET dedup_key = NULL, disposition = 'action', outcome = 'improved',
              outcome_decision = 'end', outcome_at = ?, closed_by = ?, closed_at = ?
        WHERE id = ?`,
    ).run(NOW, adminId, '2026-07-20', old);
    const ivOld = plan({
      caseId: old, kind: 'tutor', description: 'Học tutor Listening hai buổi mỗi tuần',
      performer: coreOf('UB-FT 401'), cycleStart: '2026-06-08',
      status: 'completed', completedDate: '2026-07-20', closedReason: 'done',
    });
    result({
      caseId: old, ivId: ivOld, observedOn: '2026-07-20', outcome: 'improved', nextStep: 'complete',
      note: 'MT3 em bắt được cả số lẫn tên riêng, Listening lên 0.5.',
      cycleDue: cycleDeadline('2026-06-08'), observer: coreOf('UB-FT 401'),
    });
    conn.prepare(
      `INSERT INTO case_milestones (case_id, kind, occurred_on, note, created_by, created_at, dedup_key)
       VALUES (?, 'recurrence', ?, ?, ?, ?, ?)`,
    ).run(old, '2026-09-07', 'Vấn đề quay lại ở MT4 — đã mở case mới nối tiếp case này.',
          adminId, NOW, `recurrence:${old}:2026-09-07`);

    const fresh = named({
      sid: c.id, classCode: 'UB-FT 401', topic: 'listening',
      title: 'Nghe sót số và tên riêng — tái phát sau MT4',
      summary: 'Đợt hỗ trợ trước đã có kết quả, nhưng MT4 lỗi cũ quay lại.',
      detectedAt: '2026-09-07', previousCaseId: old, status: 'in_progress',
    });
    plan({
      caseId: fresh, kind: 'self_study', description: 'Luyện nghe số và tên riêng 15 phút mỗi ngày',
      performer: coreOf('UB-FT 401'), cycleStart: '2026-09-07',
    });
    journey(c.id, 'case_opened', '2026-09-07', 'Vấn đề Listening tái phát',
      'Case cũ đã chốt xong từ 20/07; mở case mới nối vào case cũ.');
  }

  // ───────────────────────────────────────────── D · ba chu kỳ nối tiếp trên một phương án
  /*
   * Chu kỳ 1 tiến bộ một phần → theo dõi thêm. Chu kỳ 2 chưa thay đổi → tiếp tục phương án
   * cũ. Chu kỳ 3 đang chạy. Lịch sử hai chu kỳ trước GIỮ NGUYÊN hạn và kết quả của chính nó.
   */
  const d = pick('CP-FT 110', 'academic', 'writing2');
  if (d) {
    const cs = named({
      sid: d.id, classCode: 'CP-FT 110', topic: 'writing2',
      title: 'Writing Task 2 lạc đề ở dạng hai phía',
      summary: 'Em chỉ bàn một phía của đề, mất điểm Task Response.',
      detectedAt: '2026-07-06', status: 'in_progress',
    });
    const iv = plan({
      caseId: cs, kind: 'extra_homework',
      description: 'Mỗi tuần một bài Task 2 dạng hai phía, cô chữa tay',
      performer: coreOf('CP-FT 110'), cycleStart: '2026-08-17', cycleNo: 3,
    });
    result({
      caseId: cs, ivId: iv, observedOn: '2026-07-19', outcome: 'partial', nextStep: 'monitor',
      note: 'Em đã nêu được cả hai phía nhưng phần kết luận còn bỏ lửng.',
      cycleNo: 1, cycleDue: cycleDeadline('2026-07-06'), observer: coreOf('CP-FT 110'),
    });
    result({
      caseId: cs, ivId: iv, observedOn: '2026-08-19', outcome: 'unchanged', nextStep: 'continue',
      note: 'Hai bài gần nhất vẫn quên phần kết luận. Giữ nguyên cách làm, thêm một vòng nữa.',
      cycleNo: 2, cycleDue: cycleDeadline('2026-07-19'), late: true, observer: coreOf('CP-FT 110'),
    });
  }

  // ───────────────────────────────────────────── E · phương án bị THAY THẾ
  const e = pick('BC-FT 205', 'academic', 'reading');
  if (e) {
    const cs = named({
      sid: e.id, classCode: 'BC-FT 205', topic: 'reading',
      title: 'Reading sai dạng True/False/Not Given',
      summary: 'Em chọn False cho mọi câu không thấy thông tin.',
      detectedAt: '2026-08-10', status: 'in_progress',
    });
    const oldIv = plan({
      caseId: cs, kind: 'self_study', description: 'Tự luyện 20 câu T/F/NG mỗi tuần',
      performer: coreOf('BC-FT 205'), cycleStart: '2026-08-10',
      status: 'completed', completedDate: '2026-08-24', closedReason: 'superseded',
    });
    const newIv = plan({
      caseId: cs, kind: 'tutor', description: 'Học tutor Reading, tập trung riêng dạng T/F/NG',
      performer: coreOf('BC-FT 205'), cycleStart: '2026-08-24',
    });
    conn.prepare('UPDATE case_interventions SET superseded_by = ? WHERE id = ?').run(newIv, oldIv);
    result({
      caseId: cs, ivId: oldIv, observedOn: '2026-08-24', outcome: 'worse', nextStep: 'propose',
      note: 'Tự luyện không ăn thua, em vẫn giữ nguyên cách hiểu sai. Đổi sang học tutor.',
      cycleDue: cycleDeadline('2026-08-10'), observer: coreOf('BC-FT 205'),
    });
  }

  // ───────────────────────────────────────────── F · xin hỗ trợ Quản lý
  const f = pick('BC-FT 205', 'academic', 'speaking');
  if (f) {
    const cs = named({
      sid: f.id, classCode: 'BC-FT 205', topic: 'speaking',
      title: 'Em gần như không nói trong giờ Speaking',
      summary: 'Ba buổi liền em chỉ trả lời một câu rồi im.',
      detectedAt: '2026-08-31', status: 'in_progress',
    });
    const iv = plan({
      caseId: cs, kind: 'teacher_change', description: 'Xin đổi giờ Speaking sang lớp nhỏ hơn',
      performer: coreOf('BC-FT 205'), cycleStart: '2026-09-07',
      status: 'planned', needsApproval: true, approvalState: 'pending',
    });
    result({
      caseId: cs, ivId: iv, observedOn: '2026-09-07', outcome: 'insufficient', nextStep: 'ask_manager',
      note: 'Chưa đủ căn cứ nói em tiến bộ hay không — cần Quản lý quyết định việc đổi lớp trước.',
      cycleDue: cycleDeadline('2026-08-31'), observer: coreOf('BC-FT 205'),
    });
  }

  // ───────────────────────────────────────────── G · case mở 14/09 → hạn phải là 27/09
  /*
   * ĐÂY LÀ Ô KIỂM TRA LUẬT HẠN đã chốt ở mục 7.7, viết thẳng vào dữ liệu mẫu để mở màn hình
   * lên là đối chiếu được bằng mắt: case mở ngày demo, hạn hiện 27/09/2026 — KHÔNG phải
   * 04/10/2026.
   */
  const g = pick('MB-FT 102', 'academic', 'writing1');
  if (g) {
    const cs = named({
      sid: g.id, classCode: 'MB-FT 102', topic: 'writing1',
      title: 'Writing Task 1 thiếu câu tổng quan',
      summary: 'Hai bài gần nhất em vào thẳng số liệu, không có overview.',
      detectedAt: DEMO_DATE, status: 'in_progress',
    });
    plan({
      caseId: cs, kind: 'extra_homework', description: 'Viết lại phần overview của ba bài cũ',
      performer: coreOf('MB-FT 102'), cycleStart: DEMO_DATE,
    });
  }

  // ───────────────────────────────────────────── H · chu kỳ chỉ chạy TỪ LÚC ĐƯỢC DUYỆT
  /*
   * Đề xuất gửi 24/08, Quản lý duyệt 07/09. Chu kỳ hai tuần tính từ 07/09 — thời gian chờ
   * Quản lý KHÔNG bị tính là giáo viên đã có thời gian làm.
   */
  const h = pick('UB-FT 401', 'academic', 'writing2');
  if (h) {
    const cs = named({
      sid: h.id, classCode: 'UB-FT 401', topic: 'writing2',
      title: 'Cần học thêm ngoài giờ cho Writing',
      summary: 'Em kẹt ở 5.5 suốt ba lượt MT.',
      detectedAt: '2026-08-24', status: 'in_progress',
    });
    plan({
      caseId: cs, kind: 'tutor', description: 'Tutor Writing 1 kèm 1, hai buổi mỗi tuần',
      performer: coreOf('UB-FT 401'), cycleStart: '2026-09-07',
      needsApproval: true, approvalState: 'approved',
      approvalNote: 'Duyệt, xếp vào khung tối thứ Ba và thứ Năm.',
      approver: managers.get('UB')?.[0] ?? adminId, approvalAt: '2026-09-07',
    });
    journey(h.id, 'case_action', '2026-09-07', 'Quản lý duyệt phương án tutor Writing',
      'Đề xuất gửi 24/08, được duyệt 07/09 — chu kỳ thực hiện bắt đầu từ ngày duyệt.');
  }

  // ───────────────────────────────────────────── I · Quản lý KHÔNG duyệt, có lý do
  const i = pick('HD-FT 302', 'academic', 'listening');
  if (i) {
    const cs = named({
      sid: i.id, classCode: 'HD-FT 302', topic: 'listening',
      title: 'Đề nghị chuyển em sang lớp khác',
      summary: 'Giáo viên thấy em theo không kịp tốc độ lớp.',
      detectedAt: '2026-09-01', status: 'in_progress',
    });
    plan({
      caseId: cs, kind: 'class_change', description: 'Chuyển em sang lớp chậm hơn',
      performer: coreOf('HD-FT 302'), cycleStart: '2026-09-01',
      status: 'cancelled', needsApproval: true, approvalState: 'declined',
      approvalNote: 'Chưa chuyển lớp khi mới có một lượt MT. Thử kèm thêm hai tuần rồi báo lại.',
      approver: managers.get('HD')?.[0] ?? adminId, approvalAt: '2026-09-04',
    });
    plan({
      caseId: cs, kind: 'extra_homework', description: 'Kèm thêm 15 phút cuối mỗi buổi, hai tuần',
      performer: coreOf('HD-FT 302'), cycleStart: '2026-09-04',
    });
  }

  // ───────────────────────────────────────────── J · điểm giáo viên tự chấm
  /*
   * Cô đọc bài viết ở nhà rồi ước lượng 6.0, trong khi điểm mock chính thức là 5.5. Hai con
   * số cùng nằm trên biểu đồ tiến bộ nhưng KHÔNG nối chung một đường.
   */
  const j = pick('MB-FT 101', 'academic', 'writing1');
  if (j) {
    const cs = named({
      sid: j.id, classCode: 'MB-FT 101', topic: 'writing1',
      title: 'Task 1 mô tả số liệu rời rạc',
      summary: 'Em liệt kê từng con số, chưa nhóm được xu hướng.',
      detectedAt: '2026-08-10', status: 'in_progress',
    });
    const iv = plan({
      caseId: cs, kind: 'extra_homework', description: 'Mỗi tuần một bài Task 1 nhóm xu hướng',
      performer: coreOf('MB-FT 101'), cycleStart: '2026-08-24', cycleNo: 2,
    });
    result({
      caseId: cs, ivId: iv, observedOn: '2026-08-23', outcome: 'partial', nextStep: 'monitor',
      note: 'Cô chấm thử hai bài ở nhà: đã nhóm được xu hướng, còn thiếu so sánh cuối.',
      cycleDue: cycleDeadline('2026-08-10'),
      metrics: [{ skill: 'writing1', score: 6, total: null }],
      observer: coreOf('MB-FT 101'),
    });
    /* Điểm cô chấm khi kết luận — vẫn là ước lượng của cô, không đụng vào điểm mock. */
    result({
      caseId: cs, ivId: null, observedOn: '2026-09-07', outcome: 'partial', nextStep: null,
      note: 'Chấm lại toàn bộ bài viết trong tháng.',
      cycleNo: 2, metrics: [{ skill: 'writing1', score: 6.5, total: null }],
      observer: coreOf('MB-FT 101'),
    });
  }

  // ───────────────────────────────────────────── K · Ý thức/Khác đủ vòng, kết quả xấu vẫn đóng
  /*
   * Case Ý thức/Khác dùng chu kỳ MỘT TUẦN và ba mức kết quả riêng. Em này kết thúc ở "Kém
   * hơn" mà case vẫn đóng được — vì mọi phương án đã khép lại và giáo viên đã ghi kết luận.
   * Quan trọng: case đóng KHÔNG được tô xanh như thể đã giải quyết xong tốt đẹp.
   */
  const k = pick('CP-FT 110', 'behaviour', 'homework');
  if (k) {
    const cs = named({
      sid: k.id, classCode: 'CP-FT 110', track: 'behaviour', topic: 'homework',
      title: 'Không làm bài về nhà ba tuần liền',
      summary: 'Em nhận bài nhưng không nộp, hỏi thì nói quên.',
      detectedAt: '2026-08-10', status: 'done',
    });
    const iv1 = plan({
      caseId: cs, kind: 'talk_student', description: 'GVCN trao đổi riêng với em cuối buổi',
      performer: coreOf('CP-FT 110'), cycleStart: '2026-08-10', track: 'behaviour',
      status: 'completed', completedDate: '2026-08-17', closedReason: 'done',
    });
    result({
      caseId: cs, ivId: iv1, observedOn: '2026-08-17', outcome: 'unchanged', nextStep: 'continue',
      note: 'Em hứa sẽ nộp nhưng tuần đó vẫn trống hai bài.',
      cycleDue: cycleDeadline('2026-08-10', 'behaviour'), observer: coreOf('CP-FT 110'),
    });
    const iv2 = plan({
      caseId: cs, kind: 'talk_parent', description: 'CS gọi trao đổi với phụ huynh',
      performer: coreOf('CP-FT 110'), cycleStart: '2026-08-17', cycleNo: 2, track: 'behaviour',
      status: 'completed', completedDate: '2026-08-24', closedReason: 'done',
    });
    result({
      caseId: cs, ivId: iv2, observedOn: '2026-08-24', outcome: 'worse', nextStep: 'complete',
      note: 'Sau buổi gọi em nghỉ thêm một buổi. Gia đình đang có việc riêng, xin tạm dừng can thiệp.',
      cycleNo: 2, cycleDue: cycleDeadline('2026-08-17', 'behaviour'), observer: coreOf('CP-FT 110'),
    });
    conn.prepare(
      `UPDATE sos_cases SET disposition = 'action', disposition_note = ?,
              outcome = 'no_change', outcome_decision = 'end', outcome_note = ?,
              outcome_by = ?, outcome_at = ?, closed_by = ?, closed_at = ?
        WHERE id = ?`,
    ).run('Đã làm hết những gì trong khả năng của lớp',
          'Kết thúc đợt này với kết quả KÉM HƠN. Gia đình xin tạm dừng; sẽ mở case mới khi em quay lại nhịp học.',
          adminId, NOW, adminId, '2026-08-24', cs);
  }

  /*
   * HAI MỐC CỦA CHƯƠNG TRÌNH BEGINNER cho một em vừa chuyển lên.
   *
   * Điểm đặt nhỉnh hơn giai đoạn Foundation của chính em — đó là cả lý do em được lên lớp —
   * nhưng KHÔNG nối vào một đường điểm chung với giai đoạn trước: hai chương trình chấm trên
   * hai thang khác nhau, và hồ sơ tách chúng bằng bộ chọn lộ trình.
   */
  const beCheckpoints = (sid: number, cycleId: number, classIdOf: number, startDate: string) => {
    const tpl = PROGRAMME_TEMPLATES.BE;
    const totals: Record<string, number> = { listening: 40, reading: 40, writing: 20, speaking: 25 };
    const ratios: Record<string, number> = { listening: 0.72, reading: 0.70, writing: 0.65, speaking: 0.68 };
    tpl.checkpoints.forEach((cp, ci) => {
      const week = mondayOf(addDays(startDate, (cp.studyWeek - 1) * 7));
      const period = ensurePeriod(week);
      const info = conn
        .prepare(
          `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id,
                                            planned_period_id, status, created_by, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)`,
        )
        .run(cycleId, sid, ci + 1, cp.kind, classIdOf, period.id,
             week <= DEMO_DATE ? 'done' : 'planned', adminId, NOW);
      counts.attempts += 1;
      if (week > DEMO_DATE) return;                 // bài của tuần sau: chỉ có kế hoạch
      const attemptId = Number(info.lastInsertRowid);
      for (const skill of tpl.skills) {
        const total = totals[skill] ?? 40;
        conn
          .prepare(
            `INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_by, entered_at)
             VALUES (?,?,?,?,?,?)`,
          )
          .run(attemptId, skill, Math.round((ratios[skill] ?? 0.7) * total), total, adminId, NOW);
        counts.scores += 1;
      }
    });
  };

  // ───────────────────────────────────────────── L · FOU → BE, giữ nguyên lịch sử lớp cũ
  /*
   * Bốn trong sáu em của HD-FOU 05 được chuyển sang HD-BE 21 sau khi hết chương trình. Lớp
   * cũ GIỮ NGUYÊN: vẫn là lớp Foundation, ghi danh cũ chuyển sang trạng thái "đã chuyển",
   * điểm và case cũ vẫn gắn với lớp cũ. Hai em còn lại cố ý chưa xếp lớp.
   */
  const beId = classId.get('HD-BE 21');
  const fouStudents = inClass('HD-FOU 05');
  if (beId && fouStudents.length >= 4) {
    const moveOn = '2026-08-03';
    for (const st of fouStudents.slice(0, 4)) {
      const cur = conn.prepare(`SELECT id FROM enrollments WHERE student_id = ? AND status='active'`).get(st.id) as any;
      if (!cur) continue;
      conn.prepare(`UPDATE enrollments SET status='transferred', ended_at=?, end_reason=? WHERE id=?`)
        .run(moveOn, 'Hết chương trình Foundation, lên Beginner', cur.id);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
        .run(st.id, beId, moveOn, NOW);
      /* Khoá Foundation ĐÓNG LẠI có kết luận; khoá Beginner là một lộ trình MỚI. */
      conn.prepare(
        `UPDATE learning_cycles SET status='ended', ended_at=?, outcome='completed',
                outcome_note='Hoàn thành chương trình Foundation, lên Beginner'
          WHERE student_id = ? AND status='active'`,
      ).run(moveOn, st.id);
      conn.prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score,
                                      start_period_id, started_at, status, note, created_at)
         VALUES (?, 2, NULL, 'BE', NULL, ?, ?, 'active', ?, ?)`,
      ).run(st.id, ensurePeriod(moveOn).id, moveOn, 'Khoá Beginner — lớp HD-BE 21', NOW);
      counts.cycles += 1;
      const beCycle = Number(
        (conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY id DESC LIMIT 1')
          .get(st.id) as any).id,
      );
      /*
       * KHOÁ MỚI PHẢI CÓ BÀI CỦA CHÍNH NÓ.
       *
       * Chuyển em sang lớp mới mà lộ trình mới trống trơn thì bảng lớp không có gì để hiện,
       * và biểu đồ tiến bộ của giai đoạn Beginner cũng rỗng. Dựng đủ hai mốc của chương
       * trình Beginner: Progress Test tuần học 5 đã có điểm, Final Test tuần học 10 còn ở
       * phía trước.
       */
      beCheckpoints(st.id, beCycle, beId, moveOn);
      journey(st.id, 'transfer', moveOn, 'Lên lớp Beginner HD-BE 21',
        'Hết chương trình Foundation. Điểm và case của lớp cũ vẫn xem được ở "Toàn bộ hành trình".');
      /* Danh sách tình huống này cũng chính là "học viên đi qua nhiều chương trình". */
      ctx.allStudents.push({ id: st.id, classCode: 'HD-BE 21', branch: st.branch });
    }
  }

  // ───────────────────────────────────────────── M · BE → FT, chuyển một em vào lớp đang chạy
  /*
   * Không phải ai học xong Beginner cũng lên Elementary: em này đủ sức vào thẳng Fast Track.
   * Đây là "chuyển cá nhân vào lớp có sẵn", khác hẳn "mở lớp mới và chuyển cả lớp".
   */
  const ftId = classId.get('HD-FT 302');
  const mover = fouStudents[0];
  if (ftId && mover) {
    const moveOn = '2026-08-31';
    const cur = conn.prepare(`SELECT id FROM enrollments WHERE student_id = ? AND status='active'`).get(mover.id) as any;
    if (cur) {
      conn.prepare(`UPDATE enrollments SET status='transferred', ended_at=?, end_reason=? WHERE id=?`)
        .run(moveOn, 'Đủ trình độ vào Fast Track sớm', cur.id);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
        .run(mover.id, ftId, moveOn, NOW);
      conn.prepare(
        `UPDATE learning_cycles SET status='ended', ended_at=?, outcome='completed',
                outcome_note='Chuyển sang Fast Track sớm'
          WHERE student_id = ? AND status='active'`,
      ).run(moveOn, mover.id);
      conn.prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score,
                                      start_period_id, started_at, status, note, created_at)
         VALUES (?, 3, 'LT1', 'FT', 6.5, ?, ?, 'active', ?, ?)`,
      ).run(mover.id, ensurePeriod(moveOn).id, moveOn, 'Vào Fast Track giữa chừng — lớp HD-FT 302', NOW);
      counts.cycles += 1;
      journey(mover.id, 'transfer', moveOn, 'Vào thẳng lớp Fast Track HD-FT 302',
        'Chuyển cá nhân vào một lớp đang chạy, không mở lớp mới.');
    }
  }
}
