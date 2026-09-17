import crypto from 'node:crypto';
import { db, recreateSchema, tx } from '../db.ts';
import {
  BRANCH_REPORT_CATEGORIES, ENTRY_SKILLS, PERMISSION_LABEL, PROGRAMME_TEMPLATES,
  TUTOR_REPORT_CATEGORIES, programmeOf,
} from '../../../shared/domain/index.ts';
import { addDays, nowIso, padCode } from '../util.ts';
import { setConfig } from '../demoConfig.ts';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, EMAIL_SUFFIX } from '../platform/accounts.ts';
import { seedRoutes } from '../platform/sysconfig.ts';
import { ensurePeriod, mondayOf, weekInfo } from '../platform/week.ts';
import { BRANCHES, RETIRED_ROLES, ROLES, ROLE_PERMISSIONS } from './data.ts';
import { CLASSES, DEMO_DATE, TEACHERS } from './journeys.ts';
import { buildJourneys } from './build.ts';

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
      const info = conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES (?,?,'active')")
        .run(r.key, r.name);
      roleId.set(r.key, Number(info.lastInsertRowid));
      for (const p of ROLE_PERMISSIONS[r.key]) {
        conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)')
          .run(Number(info.lastInsertRowid), permId.get(p)!);
      }
    }
    /*
     * VAI TRÒ ĐÃ BỎ vẫn có dòng trong bảng, ở trạng thái `retired` và KHÔNG kèm quyền nào.
     *
     * Bộ demo cần nó để chứng minh đúng một điều: một database đã chạy thật, có người từng
     * mang vai đó, thì sau khi bỏ vai vẫn đọc được lịch sử. Không tài khoản demo nào được
     * giao vai này.
     */
    for (const r of RETIRED_ROLES) {
      const info = conn.prepare("INSERT INTO roles (key, name_vi, status) VALUES (?,?,'retired')")
        .run(r.key, r.name);
      roleId.set(r.key, Number(info.lastInsertRowid));
    }

    // ---------------------------------------------------------------- người dùng
    let userSeq = 0;
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

    /*
     * BỘ MÃ NGƯỜI DÙNG dùng chung với kịch bản hành trình.
     *
     *   T_*    giáo viên      MGR_*  Quản lý chi nhánh
     *
     * Kịch bản trong `students.ts` gọi người bằng những mã này, nên đổi một cái tên chỉ cần
     * sửa đúng một chỗ và mọi hành trình vẫn trỏ đúng người.
     *
     * KHÔNG CÒN MÃ `ADM_*`. Vai Admin chi nhánh đã bỏ sau PR15; những việc trước đây ghi
     * tên văn phòng nay ghi tên Quản lý chi nhánh, vì đó mới là người quyết định thật.
     */
    const userId = new Map<string, number>();
    const managers = new Map<string, number[]>();

    const MANAGER_NAME: Record<string, string> = {
      MB: 'Nguyễn Khánh Vy', BC: 'Trần Hải Đăng', CP: 'Lê Ngọc Mai',
      HD: 'Phạm Quang Anh', UB: 'Hoàng Thanh Bình',
    };

    for (const b of BRANCHES) {

      const m = addUser(MANAGER_NAME[b.code], `Quản lý ${b.name}`);
      grant(m, 'manager', b.code);
      managers.set(b.code, [m]);
      userId.set(`MGR_${b.code}`, m);
    }

    /*
     * CHÍN GIÁO VIÊN CHO CẢ TRUNG TÂM, và hai người trong số đó dạy ở HAI chi nhánh.
     *
     * Người dạy hai nơi nhận quyền ở CẢ HAI chi nhánh, nhưng số liệu của họ ở mỗi nơi phải
     * đứng riêng — đó chính là chỗ bảng "Theo giáo viên" phải chứng minh là mình đếm đúng.
     */
    for (const t of TEACHERS) {
      const id = addUser(t.name, 'Giáo viên');
      for (const b of t.branches) grant(id, 'teacher', b);
      userId.set(t.code, id);
    }

    /*
     * LỘ TRÌNH nay là DỮ LIỆU (mục 7.3) — nạp lần đầu từ danh sách viết cứng, sau đó Quản trị
     * hệ thống thêm sửa trong màn quản trị mà không phải đụng vào mã nguồn.
     */
    seedRoutes(conn);

    // ---------------------------------------------------------------- chương trình học
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

    // ---------------------------------------------------------------- kỳ báo cáo
    /*
     * Đủ tuần từ lớp mở sớm nhất (12/2025) tới ba tháng sau ngày demo. Lịch sử dài chín
     * tháng cần đủ tuần để mọi mốc cũ có chỗ đứng.
     */
    let cursor = mondayOf('2025-12-01');
    const lastWeek = mondayOf(addDays(DEMO_DATE, 140));
    while (cursor <= lastWeek) {
      ensurePeriod(cursor);
      cursor = addDays(cursor, 7);
    }
    const currentPeriod = ensurePeriod(DEMO_DATE);

    // ---------------------------------------------------------------- lớp & phân công
    const classId = new Map<string, number>();
    const classBranch = new Map<string, string>();
    for (const c of CLASSES) {
      /*
       * `kind` giữ nguyên chữ người dùng gõ (kể cả mã cũ "FOUND"); `programme_code` là mã đã
       * chuẩn hoá mà mọi tính toán đọc vào. KHÔNG đổi mã lớp lịch sử chỉ vì phần mềm muốn
       * chuẩn hoá — tên lớp là thứ của trung tâm, không phải của phần mềm.
       */
      const programme = programmeOf(c.kind);
      const info = conn
        .prepare(
          `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, start_date,
                                start_period_id, status, note, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(c.code, branchId.get(c.branch)!, c.kind, programme, c.route, c.isFastTrack ? 1 : 0,
             c.startDate, ensurePeriod(c.startDate).id,
             c.status === 'ended' ? 'ended' : 'active', c.note ?? null, NOW);
      const id = Number(info.lastInsertRowid);
      classId.set(c.code, id);
      classBranch.set(c.code, c.branch);

      const skills = programme ? PROGRAMME_TEMPLATES[programme].skills : ENTRY_SKILLS;
      for (const skill of skills) {
        conn.prepare('INSERT INTO class_skills (class_id, skill, sessions_per_week) VALUES (?,?,?)')
          .run(id, skill, skill === 'writing1' || skill === 'writing2' ? 1 : 2);
      }

      /*
       * PHÂN CÔNG VIẾT THẲNG TRONG KỊCH BẢN, không bốc theo thứ tự.
       *
       * Nhờ vậy "cô Hà dạy Listening và Reading ở lớp 101" là một sự thật cố định, và mọi
       * câu chuyện trong `students.ts` gọi đúng tên người đó mà không sợ lệch.
       */
      const assign = (uidNum: number, skill: string | null, isCore: boolean) =>
        conn
          .prepare(
            `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
             VALUES (?,?,?,?,?,?,?)`,
          )
          .run(uidNum, id, skill, isCore ? 1 : 0, c.startDate, 'active', NOW);

      for (const [skill, code] of Object.entries(c.teachers)) {
        const t = userId.get(code);
        if (t) assign(t, skill, false);
      }
      /* GVCN phải dạy ít nhất một kỹ năng ở chính lớp đó — luật ở `classes.ts`. */
      if (c.core && userId.has(c.core) && Object.values(c.teachers).includes(c.core)) {
        assign(userId.get(c.core)!, null, true);
      }
    }

    // ---------------------------------------------------------------- học viên & hành trình
    conn.prepare('INSERT INTO student_code_seq (id, next_value) VALUES (1, 1)').run();
    const nextStudentCode = () => {
      const row = conn.prepare('SELECT next_value FROM student_code_seq WHERE id = 1').get() as any;
      conn.prepare('UPDATE student_code_seq SET next_value = next_value + 1 WHERE id = 1').run();
      return padCode('PISA', row.next_value);
    };

    const counts = buildJourneys({
      conn, adminId, branchId, classId, userId, classBranch, nextStudentCode,
    });

    // ---------------------------------------------------------------- công việc quản lý
    const tasks = seedMeeting(conn, {
      branchId, managers, adminId, userId, currentPeriodId: currentPeriod.id,
    });

    setConfig('demo_date', DEMO_DATE);
    setConfig('scenario_mode', 'normal');
    setConfig('seeded_at', NOW);

    return {
      'Chi nhánh': BRANCHES.length,
      'Lớp': CLASSES.length,
      'Người dùng': userSeq,
      'Giáo viên': TEACHERS.length,
      'Học viên': counts.students,
      'Lộ trình': counts.cycles,
      'Lượt đánh giá': counts.attempts,
      'Ô điểm': counts.scores,
      'Kỹ năng ngoài phạm vi': counts.skips,
      /*
       * TÍN HIỆU ĐẾM RIÊNG, KHÔNG GỘP VÀO CASE (mục 6.2). Một tín hiệu chưa ai xác minh
       * không phải một vấn đề đã được xác định; cộng chung là nói quá số việc đang có.
       */
      'Tín hiệu từ điểm': (conn.prepare('SELECT COUNT(*) AS n FROM case_signals').get() as any).n,
      '— trong đó chờ xác minh': (conn.prepare("SELECT COUNT(*) AS n FROM case_signals WHERE status = 'pending'").get() as any).n,
      /*
       * ĐẾM TỪ CHÍNH DATABASE, không cộng dồn trong lúc dựng.
       *
       * Case Ý thức/Khác sinh tự động qua engine chứ không qua kịch bản, nên bộ đếm nội bộ
       * không biết tới chúng — và một bản tóm tắt nói ít hơn sự thật thì tệ hơn là không có.
       */
      'Case': (conn.prepare('SELECT COUNT(*) AS n FROM sos_cases').get() as any).n,
      'Phương án': (conn.prepare('SELECT COUNT(*) AS n FROM case_interventions').get() as any).n,
      'Lần cập nhật kết quả': (conn.prepare('SELECT COUNT(*) AS n FROM case_followups').get() as any).n,
      'Mốc case': (conn.prepare('SELECT COUNT(*) AS n FROM case_milestones').get() as any).n,
      'Tuần trong lịch': (conn.prepare('SELECT COUNT(*) AS n FROM report_periods').get() as any).n,
      'Công việc quản lý': tasks,
      'Ngày demo': DEMO_DATE,
    };
  });
}

export { weekInfo };

/**
 * BÁO CÁO TUẦN VÀ CÔNG VIỆC QUẢN LÝ.
 *
 * Hai thứ khác nhau nằm chung một hàm vì chúng dùng chung bộ đơn vị báo cáo:
 *
 *   BÁO CÁO TUẦN    mỗi đơn vị một ô tình trạng cho từng hạng mục, theo tuần.
 *   CÔNG VIỆC       việc vận hành của Quản lý — có nhóm, có việc con, có lịch sử cập nhật.
 */
function seedMeeting(conn: any, ctx: {
  branchId: Map<string, number>; managers: Map<string, number[]>; adminId: number;
  userId: Map<string, number>; currentPeriodId: number;
}) {
  const { branchId, adminId, userId, currentPeriodId } = ctx;
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
        `INSERT INTO unit_reports (period_id, reporting_unit_id, category_key, category_label,
                                   status, note, reporter_user_id, updated_at)
         VALUES (?,?,?,?,?,?,?,?)`,
      )
      .run(periodId, unit.id, key, label, status, note, by, NOW);

  units.forEach((u, ui) => {
    const reporter = u.branch_id
      ? (ctx.managers.get([...branchId.entries()].find(([, id]) => id === u.branch_id)?.[0] ?? '')?.[0] ?? adminId)
      : adminId;
    /* Kỳ trước: báo cáo đầy đủ, để so với kỳ hiện tại còn ô "Chưa báo cáo". */
    if (prev) {
      cellsOf(u).forEach((cat, ci) => {
        const status = ci === 2 && ui % 2 === 0 ? 'problem' : ci === 1 ? 'watch' : 'ok';
        save(u, prev.id, cat.key, cat.label, status, NOTES[status][ci % 2], reporter);
      });
    }
    /* Kỳ hiện tại: cố tình để trống một số ô. Ô trống là CHƯA BÁO CÁO, không phải "Ổn". */
    cellsOf(u).forEach((cat, ci) => {
      if ((ui + ci) % 3 === 0) return;
      const status = (ui + ci) % 4 === 1 ? 'problem' : (ui + ci) % 4 === 2 ? 'watch' : 'ok';
      save(u, currentPeriodId, cat.key, cat.label, status, NOTES[status][ci % 2], reporter);
    });
  });

  // ================================================================== công việc quản lý
  /*
   * TÁM CÔNG VIỆC CHÍNH, đủ bốn nhóm và trải trên nhiều chi nhánh (mục 11.5).
   *
   * Bộ này cố tình nhỏ nhưng phủ hết những gì bảng Tiến độ công việc phải chứng minh:
   * việc mới chưa bắt đầu · việc chạy qua ba tuần vẫn một định danh · việc tạm ngưng có lý do ·
   * việc từng tạm ngưng rồi tiếp tục · việc dừng hẳn có lý do · việc hoàn thành có kết quả ·
   * việc con quá hạn trong khi việc cha chưa tới hạn · người theo dõi khác người phụ trách ·
   * việc gắn case làm căn cứ mà KHÔNG tự tạo phương án và KHÔNG tự đóng case nào.
   */
  let n = 0;
  const unitOf = (code: string) => units.find((u) => u.code === code);
  const prevId = prev?.id ?? currentPeriodId;

  const addTask = (t: {
    title: string; unit?: any; branch?: string | null; assignee: string; due: string | null;
    progress: string; type: string; periodId: number | null; note?: string | null;
    completedAt?: string | null;
    group: string; parentId?: number | null; watcher?: string | null;
    stopReason?: string | null; reviewOn?: string | null;
    updates?: { progress: string; note?: string | null; on: string; by?: string }[];
    cases?: number[];
  }): number => {
    n += 1;
    const id = Number(
      conn
        .prepare(
          `INSERT INTO tasks (code, period_id, task_type, title, reporting_unit_id, branch_id, assignee_user_id,
                              due_date, progress, note, source_type, created_by, created_at, completed_at,
                              group_key, parent_task_id, watcher_user_id, stop_reason, review_on)
           VALUES (?,?,?,?,?,?,?,?,?,?, 'manual', ?,?,?,?,?,?,?,?)`,
        )
        .run(padCode('CV', n, 4), t.periodId, t.type, t.title, t.unit?.id ?? null,
             t.branch ? branchId.get(t.branch)! : null, userId.get(t.assignee) ?? adminId,
             t.due, t.progress, t.note ?? null, adminId, NOW, t.completedAt ?? null,
             t.group, t.parentId ?? null, t.watcher ? userId.get(t.watcher) ?? null : null,
             t.stopReason ?? null, t.reviewOn ?? null).lastInsertRowid,
    );
    for (const u of t.updates ?? []) {
      conn
        .prepare(
          `INSERT INTO task_updates (task_id, period_id, progress, note, actor_user_id, updated_on, created_at)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .run(id, t.periodId, u.progress, u.note ?? null,
             userId.get(u.by ?? t.assignee) ?? adminId, u.on, NOW);
    }
    for (const cid of t.cases ?? []) {
      conn.prepare('INSERT OR IGNORE INTO task_case_links (task_id, case_id, created_at) VALUES (?,?,?)')
        .run(id, cid, NOW);
    }
    return id;
  };

  /* ── 1. Giáo trình: việc CHA chia bốn việc con theo kỹ năng, người và hạn khác nhau ── */
  const curriculum = addTask({
    title: 'Xây dựng giáo trình Beginner bản 2027', unit: unitOf('HD'), branch: 'HD',
    /*
     * NGƯỜI LÀM khác NGƯỜI THEO DÕI. Giáo viên biên soạn là người làm; Quản lý chi nhánh
     * theo dõi để biết việc còn kịp hạn không. Hai vai này phải tách được trên màn hình,
     * nếu không thì không ai biết hỏi ai khi việc chậm.
     */
    assignee: 'T_YEN', due: '2026-10-30', progress: 'doing', type: 'long_term',
    periodId: prevId, group: 'curriculum', watcher: 'MGR_HD',
    updates: [
      { progress: 'not_started', note: 'Đã chốt khung bốn kỹ năng và số buổi.', on: '2026-08-24' },
      { progress: 'doing', note: 'Listening và Reading xong bản nháp, đang soát.', on: '2026-08-31' },
      { progress: 'doing', note: 'Writing chậm vì thiếu đề mẫu, đã nhờ tutor hỗ trợ.', on: '2026-09-07' },
    ],
  });
  addTask({
    title: 'Giáo trình BE — Listening', unit: unitOf('HD'), branch: 'HD',
    assignee: 'T_YEN', due: '2026-09-11', progress: 'done', type: 'long_term',
    periodId: prevId, group: 'curriculum', parentId: curriculum,
    completedAt: '2026-09-10T10:00:00.000Z',
    updates: [{ progress: 'done', note: '10 bài nghe kèm transcript, đã gửi Quản lý duyệt.', on: '2026-09-10' }],
  });
  addTask({
    title: 'Giáo trình BE — Reading', unit: unitOf('HD'), branch: 'HD',
    assignee: 'T_YEN', due: '2026-09-18', progress: 'doing', type: 'long_term',
    periodId: currentPeriodId, group: 'curriculum', parentId: curriculum,
    updates: [{ progress: 'doing', note: 'Xong 6/10 bài.', on: '2026-09-11' }],
  });
  /* VIỆC CON QUÁ HẠN trong khi việc CHA còn hạn tới 30/10 — hai mốc độc lập với nhau. */
  addTask({
    title: 'Giáo trình BE — Writing', unit: unitOf('HD'), branch: 'HD',
    assignee: 'T_DUNG', due: '2026-09-04', progress: 'doing', type: 'long_term',
    periodId: prevId, group: 'curriculum', parentId: curriculum,
    updates: [{ progress: 'doing', note: 'Thiếu đề mẫu Task 1, đang nhờ tutor soạn thêm.', on: '2026-09-04' }],
  });
  addTask({
    title: 'Giáo trình BE — Speaking', unit: unitOf('HD'), branch: 'HD',
    assignee: 'T_DUNG', due: '2026-09-25', progress: 'not_started', type: 'long_term',
    periodId: currentPeriodId, group: 'curriculum', parentId: curriculum,
  });

  /* ── 2. Việc MỚI, chưa ai bắt đầu ── */
  addTask({
    title: 'Chuẩn bị bộ đề Progress Test cho lớp Elementary khoá tới',
    unit: unitOf('BC'), branch: 'BC', assignee: 'MGR_BC', due: '2026-10-09',
    progress: 'not_started', type: 'in_period', periodId: currentPeriodId, group: 'curriculum',
  });

  /* ── 3. Việc chạy qua BA TUẦN, vẫn MỘT định danh, không nhân bản theo tuần ── */
  addTask({
    title: 'Gọi phụ huynh xác nhận danh sách thi thật tháng 11',
    unit: unitOf('CP'), branch: 'CP', assignee: 'MGR_CP', due: '2026-09-18',
    progress: 'doing', type: 'in_period', periodId: currentPeriodId, group: 'student_parent',
    updates: [
      { progress: 'not_started', note: 'Đã lọc được 18 em đủ điều kiện đăng ký.', on: '2026-08-31' },
      { progress: 'doing', note: 'Gọi được 9/18 phụ huynh, 2 em xin lùi sang tháng 12.', on: '2026-09-07' },
      { progress: 'doing', note: 'Gọi thêm 3 em. Còn 6 em chưa liên lạc được.', on: '2026-09-11' },
    ],
  });

  /* ── 4. Việc TẠM NGƯNG có lý do và có ngày xem lại ── */
  addTask({
    title: 'Đổi phần mềm chấm Speaking', unit: unitOf('MB'), branch: 'MB',
    assignee: 'MGR_MB', due: '2026-09-11', progress: 'paused', type: 'in_period',
    periodId: prevId, group: 'teacher',
    stopReason: 'Chờ báo giá nhà cung cấp, dự kiến có trong tháng 10.', reviewOn: '2026-10-05',
    updates: [
      { progress: 'doing', note: 'Đã thử hai phần mềm, cả hai đều thiếu phần chấm theo tiêu chí.', on: '2026-09-04' },
      { progress: 'paused', note: 'Chờ báo giá nhà cung cấp, dự kiến có trong tháng 10.', on: '2026-09-11' },
    ],
  });

  /* ── 5. Việc TỪNG TẠM NGƯNG rồi TIẾP TỤC — cùng một định danh, lịch sử giữ đủ cả hai chặng ── */
  addTask({
    title: 'Chuẩn hoá quy trình bàn giao lớp giữa các ca', unit: unitOf('UB'), branch: 'UB',
    assignee: 'T_KIEN', due: '2026-11-30', progress: 'doing', type: 'long_term',
    periodId: prevId, group: 'teacher', watcher: 'MGR_UB',
    updates: [
      { progress: 'doing', note: 'Viết xong bản nháp quy trình bốn bước.', on: '2026-07-20' },
      { progress: 'paused', note: 'Tạm ngưng vì đang vào mùa thi, giáo viên không họp được.', on: '2026-08-03' },
      { progress: 'doing', note: 'Qua mùa thi, họp lại và bắt đầu thử ở hai lớp.', on: '2026-09-07' },
    ],
  });

  /* ── 6. Việc DỪNG HẲN có lý do — không bao giờ hiện trong danh sách việc đang chạy ── */
  addTask({
    title: 'Mở lớp Speaking club tối thứ Sáu', unit: unitOf('BC'), branch: 'BC',
    assignee: 'MGR_BC', due: '2026-09-30', progress: 'stopped', type: 'long_term',
    periodId: prevId, group: 'student_parent',
    stopReason: 'Chỉ 4 em đăng ký, không đủ mở lớp. Gộp vào buổi tutor cuối tuần.',
    updates: [
      { progress: 'doing', note: 'Đã khảo sát ba lớp Fast Track.', on: '2026-08-24' },
      { progress: 'stopped', note: 'Chỉ 4 em đăng ký, không đủ mở lớp.', on: '2026-09-04' },
    ],
  });

  /* ── 7. Việc HOÀN THÀNH, có kết quả cụ thể chứ không chỉ một dấu tích ── */
  addTask({
    title: 'Rà soát lịch Mock Test tuần W2 SEP', unit: unitOf('MB'), branch: 'MB',
    assignee: 'MGR_MB', due: '2026-09-06', progress: 'done', type: 'in_period',
    periodId: prevId, group: 'teacher', completedAt: '2026-09-05T09:00:00.000Z',
    updates: [
      { progress: 'doing', note: 'Đối chiếu lịch của bốn lớp Fast Track.', on: '2026-09-02' },
      { progress: 'done', note: 'Khớp lịch xong. Dời MT2 của BC-FT 205 sang W2 SEP theo yêu cầu Quản lý.', on: '2026-09-05' },
    ],
  });

  /* ── 8. Nhóm TUTOR — việc dài hạn không có hạn, nên không bao giờ tự tính quá hạn ── */
  addTask({
    title: 'Sưu tầm đề Speaking Part 2 theo chủ đề mới', unit: unitOf('TUTOR'), branch: null,
    assignee: 'MGR_MB', due: null, progress: 'doing', type: 'long_term',
    periodId: currentPeriodId, group: 'tutor',
    updates: [{ progress: 'doing', note: 'Đã gom 40 đề, đang phân theo chủ đề.', on: '2026-09-07' }],
  });
  addTask({
    title: 'Tuyển thêm 2 tutor part-time cho ca cuối tuần', unit: unitOf('TUTOR'), branch: null,
    assignee: 'MGR_MB', due: '2026-10-15', progress: 'not_started', type: 'long_term',
    periodId: currentPeriodId, group: 'tutor',
  });

  /*
   * ── 9. VIỆC GẮN CASE LÀM CĂN CỨ ──
   *
   * Nó liên kết tới những case đang cần tutor để người đọc biết con số này từ đâu ra. Nhưng
   * nó KHÔNG tự tạo phương án trong case nào và KHÔNG tự đóng case nào: một việc quản lý và
   * một phương án hỗ trợ học viên là hai thứ khác nhau, gộp lại thì lịch sử của em sẽ có
   * những dòng không ai từng ghi.
   */
  const tutorCases = (conn
    .prepare(
      `SELECT sc.id FROM sos_cases sc
        WHERE sc.status != 'done'
          AND EXISTS (SELECT 1 FROM case_interventions iv
                       WHERE iv.case_id = sc.id AND iv.kind IN ('tutor','extra_support'))
        ORDER BY sc.id LIMIT 4`,
    )
    .all() as any[]).map((r) => r.id);
  addTask({
    title: 'Xếp lịch tutor tháng 10 cho các em đang cần hỗ trợ',
    unit: unitOf('CP'), branch: 'CP', assignee: 'MGR_CP', due: '2026-09-25',
    progress: 'doing', type: 'in_period', periodId: currentPeriodId, group: 'student_parent',
    note: 'Căn cứ là các case đang dùng phương án tutor — xem danh sách liên kết bên dưới.',
    cases: tutorCases,
    updates: [{ progress: 'doing', note: `Đã rà ${tutorCases.length} case đang dùng tutor, còn chờ phòng trống.`, on: '2026-09-11' }],
  });

  return n;
}
