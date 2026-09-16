import { db, isInitialised } from './db.ts';
import { nowIso } from './util.ts';
import crypto from 'node:crypto';
import { PERMISSION_LABEL } from '../../shared/domain/index.ts';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, EMAIL_SUFFIX } from './platform/accounts.ts';
import { seedRoutes } from './platform/sysconfig.ts';
import { ROLE_PERMISSIONS } from './seed/data.ts';

/**
 * Nâng cấp database ĐANG CÓ lên schema mới, không xoá dữ liệu.
 *
 * Overhaul lần này tách lộ trình (learning_cycles) ra khỏi hồ sơ học viên và đổi lịch MT từ
 * một ngày bắt buộc sang "tuần kế hoạch + ngày giờ chốt sau". Migration giữ nguyên Student ID,
 * enrollment, từng lượt MT, điểm W1/W2 và toàn bộ lịch sử SOS.
 *
 * Những giá trị KHÔNG suy ra được từ dữ liệu cũ thì để trống thay vì bịa:
 *  - Lượt cũ chỉ có một ngày, nên ngày đó vào `lrw_scheduled_at`; không tự tách lịch Speaking.
 *  - Không có bản ghi "kỹ năng không mock" nào được tạo: dữ liệu cũ luôn yêu cầu đủ bốn kỹ năng.
 *  - Không có ước lượng giáo viên nào được suy ra từ điểm Mock.
 */
export function migrate(): { applied: string[]; skipped: string[] } {
  const applied: string[] = [];
  const skipped: string[] = [];
  if (!isInitialised()) return { applied, skipped: ['Database chưa có bảng nào — hãy chạy `npm run seed`.'] };

  const conn = db();
  const has = (table: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(table);

  if (has('assessment_attempts') && !has('mock_attempts')) {
    // Đã qua bước nâng cấp lớn; chỉ cần bổ sung phần case học vụ nếu chưa có.
    return migrateCaseEngine(applied, skipped);
  }
  if (!has('mock_attempts')) {
    return { applied, skipped: ['Không tìm thấy dữ liệu cũ để nâng cấp.'] };
  }

  conn.pragma('foreign_keys = OFF');
  conn.transaction(() => {
    // 1. Lộ trình: mỗi học viên cũ có đúng một lộ trình, lấy target/ngày thi từ hồ sơ.
    conn.exec(`
      CREATE TABLE IF NOT EXISTS learning_cycles (
        id INTEGER PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id),
        seq INTEGER NOT NULL, route TEXT, target_score REAL, exam_date TEXT,
        started_at TEXT NOT NULL, ended_at TEXT,
        status TEXT NOT NULL DEFAULT 'active', note TEXT, created_at TEXT NOT NULL,
        UNIQUE (student_id, seq));
    `);
    conn.exec(`
      INSERT INTO learning_cycles (student_id, seq, route, target_score, exam_date, started_at, status, created_at)
      SELECT s.id, 1, s.route, s.committed_score, s.exam_date,
             COALESCE((SELECT MIN(started_at) FROM enrollments e WHERE e.student_id = s.id), s.created_at),
             'active', s.created_at
        FROM students s
       WHERE NOT EXISTS (SELECT 1 FROM learning_cycles lc WHERE lc.student_id = s.id);
    `);
    applied.push('Tạo lộ trình từ hồ sơ học viên cũ');

    // 2. Lượt đánh giá: ngày cũ trở thành ngày buổi chính; tuần kế hoạch suy từ chính ngày đó.
    conn.exec(`
      CREATE TABLE assessment_attempts (
        id INTEGER PRIMARY KEY,
        cycle_id INTEGER NOT NULL REFERENCES learning_cycles(id),
        student_id INTEGER NOT NULL REFERENCES students(id),
        attempt_no INTEGER NOT NULL, kind TEXT NOT NULL DEFAULT 'mock',
        class_id INTEGER REFERENCES classes(id),
        planned_period_id INTEGER REFERENCES report_periods(id),
        lrw_scheduled_at TEXT, speaking_scheduled_at TEXT,
        status TEXT NOT NULL DEFAULT 'planned', cancel_reason TEXT, cancelled_at TEXT,
        target_at_attempt REAL,
        deadline_override TEXT, deadline_override_by INTEGER REFERENCES users(id),
        deadline_override_at TEXT, deadline_override_reason TEXT,
        note TEXT, created_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL, updated_at TEXT,
        UNIQUE (cycle_id, attempt_no));
    `);
    conn.exec(`
      INSERT INTO assessment_attempts (id, cycle_id, student_id, attempt_no, kind, class_id, planned_period_id,
                                       lrw_scheduled_at, status, cancel_reason, cancelled_at, target_at_attempt,
                                       note, created_by, created_at, updated_at)
      SELECT a.id, lc.id, a.student_id, a.attempt_no, 'mock', a.class_id,
             (SELECT p.id FROM report_periods p WHERE a.planned_date BETWEEN p.week_start AND p.week_end),
             a.planned_date,
             CASE a.status WHEN 'completed' THEN 'done' ELSE a.status END,
             a.cancel_reason, a.cancelled_at, a.committed_score_at_test,
             a.note, a.created_by, a.created_at, a.updated_at
        FROM mock_attempts a JOIN learning_cycles lc ON lc.student_id = a.student_id AND lc.seq = 1;
    `);
    applied.push('Chuyển lượt Mock sang mô hình tuần kế hoạch + ngày giờ');

    // 3. Điểm: giữ nguyên id và từng ô, kể cả W1/W2.
    conn.exec(`
      CREATE TABLE assessment_scores (
        id INTEGER PRIMARY KEY,
        attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
        skill TEXT NOT NULL, taken_on TEXT, raw_score INTEGER, raw_total INTEGER,
        c1 REAL, c2 REAL, c3 REAL, c4 REAL, band REAL, result_date TEXT,
        entered_by INTEGER REFERENCES users(id), entered_at TEXT, note TEXT,
        UNIQUE (attempt_id, skill));
    `);
    conn.exec(`
      INSERT INTO assessment_scores (id, attempt_id, skill, taken_on, raw_score, c1, c2, c3, c4, band,
                                     result_date, entered_by, entered_at, note)
      SELECT id, attempt_id, skill, test_date, raw_score, c1, c2, c3, c4, band,
             result_date, entered_by, entered_at, note
        FROM mock_scores;
    `);
    applied.push('Giữ nguyên toàn bộ điểm từng kỹ năng, gồm cả W1/W2');

    // 4. Lịch sử lịch thi.
    conn.exec(`
      CREATE TABLE attempt_schedule_history (
        id INTEGER PRIMARY KEY,
        attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
        action TEXT NOT NULL, field TEXT, old_value TEXT, new_value TEXT, reason TEXT,
        actor_user_id INTEGER REFERENCES users(id), created_at TEXT NOT NULL);
    `);
    conn.exec(`
      INSERT INTO attempt_schedule_history (id, attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)
      SELECT id, attempt_id,
             CASE action WHEN 'rescheduled' THEN 'lrw_set' WHEN 'created' THEN 'created' ELSE action END,
             'lrw_scheduled_at', old_date, new_date, reason, actor_user_id, created_at
        FROM mock_schedule_history;
    `);
    applied.push('Giữ lịch sử dời/huỷ lịch');

    // 5. Bảng mới chưa có dữ liệu cũ tương ứng — tạo rỗng, KHÔNG bịa dữ liệu.
    conn.exec(`
      CREATE TABLE IF NOT EXISTS attempt_skill_skips (
        id INTEGER PRIMARY KEY,
        attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
        skill TEXT NOT NULL, reason TEXT,
        created_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL,
        UNIQUE (attempt_id, skill));
      CREATE TABLE IF NOT EXISTS teacher_estimates (
        id INTEGER PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id),
        cycle_id INTEGER REFERENCES learning_cycles(id),
        skill TEXT NOT NULL, band REAL NOT NULL, assessed_on TEXT NOT NULL,
        assessed_by INTEGER REFERENCES users(id), class_id INTEGER REFERENCES classes(id),
        note TEXT, created_at TEXT NOT NULL);
    `);
    skipped.push('Chưa tạo bản ghi "kỹ năng không mock": dữ liệu cũ luôn yêu cầu đủ bốn kỹ năng');
    skipped.push('Chưa tạo ước lượng giáo viên: không suy được từ điểm Mock');
    skipped.push('Chưa tách lịch Speaking: lượt cũ chỉ lưu một ngày duy nhất');

    // 6. Hồ sơ học viên: bỏ cột đã chuyển sang lộ trình, thêm lifecycle ba trạng thái.
    conn.exec(`
      CREATE TABLE students_new (
        id INTEGER PRIMARY KEY, student_code TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL,
        normalized_name TEXT NOT NULL, dob TEXT, branch_id INTEGER REFERENCES branches(id),
        status TEXT NOT NULL DEFAULT 'active', finished_at TEXT, archived_at TEXT,
        consultant_name TEXT, note TEXT, created_at TEXT NOT NULL);
      INSERT INTO students_new (id, student_code, full_name, normalized_name, dob, branch_id, status, note, created_at)
      SELECT id, student_code, full_name, normalized_name, dob, branch_id,
             CASE status WHEN 'archived' THEN 'finished' WHEN 'paused' THEN 'inactive'
                         WHEN 'active' THEN 'active' ELSE 'inactive' END,
             note, created_at FROM students;
      DROP TABLE students;
      ALTER TABLE students_new RENAME TO students;
      CREATE INDEX IF NOT EXISTS idx_student_name ON students(normalized_name);
    `);
    applied.push('Rút hồ sơ học viên về ba trạng thái, target chuyển sang lộ trình');

    conn.exec('DROP TABLE mock_scores; DROP TABLE mock_schedule_history; DROP TABLE mock_attempts;');
    conn.exec(`
      CREATE INDEX IF NOT EXISTS idx_cycle_student ON learning_cycles(student_id);
      CREATE INDEX IF NOT EXISTS idx_attempt_student ON assessment_attempts(student_id);
      CREATE INDEX IF NOT EXISTS idx_attempt_period ON assessment_attempts(planned_period_id);
      CREATE INDEX IF NOT EXISTS idx_attempt_class ON assessment_attempts(class_id);
      CREATE INDEX IF NOT EXISTS idx_score_attempt ON assessment_scores(attempt_id);
      CREATE INDEX IF NOT EXISTS idx_ash_attempt ON attempt_schedule_history(attempt_id);
      CREATE INDEX IF NOT EXISTS idx_estimate_student ON teacher_estimates(student_id, skill);
    `);

    // 7. Quyền: bộ permission cũ đã đổi tên và tách đôi quyền lịch.
    conn.prepare("INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES ('migrated_at', ?, ?)")
      .run(nowIso(), nowIso());
  })();
  conn.pragma('foreign_keys = ON');

  skipped.push('Vai trò và quyền lấy lại từ seed: chạy `npm run seed` nếu muốn bộ quyền mới đầy đủ');
  migrateCaseEngine(applied, skipped);
  return { applied, skipped };
}

/**
 * NÂNG CẤP TẠI CHỖ SANG MÔ HÌNH CASE HỌC VỤ.
 *
 * Chạy được trên database đang dùng, KHÔNG xoá và tạo lại. Chạy lại lần hai là no-op.
 *
 * Ba việc chính:
 *   1. Thêm cột/bảng mới, giữ nguyên mọi id cũ để các liên kết đã lưu không gãy.
 *   2. Điền `student_id`/`cycle_id` cho case cũ, lấy từ chính lượt đánh giá của nó.
 *   3. Chuyển các cột checklist cố định (trao đổi HS/PH, hỗ trợ học thuật, chính sách,
 *      buổi gặp) thành các bản ghi tác động — mỗi cột đúng MỘT lần, có khoá chống trùng.
 *
 * Nguyên tắc khi chuyển: NGÀY BẮT ĐẦU KHÔNG PHẢI NGÀY HOÀN THÀNH. Dữ liệu cũ chỉ ghi ngày
 * bắt đầu hỗ trợ học thuật, nên chuyển thành trạng thái "đang thực hiện", không tự nhận là
 * đã xong. Thiếu người thực hiện thì để trống chứ không lấy người nhập làm người làm.
 */
function migrateCaseEngine(applied: string[], skipped: string[]) {
  const conn = db();
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c) => c.name);
  const has = (table: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(table);
  const addCol = (table: string, col: string, decl: string) => {
    if (!cols(table).includes(col)) conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
  };

  if (!has('sos_cases')) return { applied, skipped };

  conn.pragma('foreign_keys = OFF');
  conn.transaction(() => {
    // 1. Cột mới trên các bảng đang có.
    for (const [col, decl] of [
      ['student_id', 'INTEGER REFERENCES students(id)'],
      ['cycle_id', 'INTEGER REFERENCES learning_cycles(id)'],
      ['origin_kind', "TEXT NOT NULL DEFAULT 'mock'"],
      ['detected_at', 'TEXT'], ['reported_by', 'INTEGER REFERENCES users(id)'],
      ['summary', 'TEXT'], ['urgency', 'TEXT'],
      ['disposition', 'TEXT'], ['disposition_note', 'TEXT'],
      ['closed_by', 'INTEGER REFERENCES users(id)'], ['closed_at', 'TEXT'],
      ['acknowledged_by', 'INTEGER REFERENCES users(id)'], ['acknowledged_at', 'TEXT'],
      ['idempotency_key', 'TEXT'],
    ] as const) addCol('sos_cases', col, decl);

    for (const [col, decl] of [
      ['programme_code', 'TEXT'],
      ['baseline_attempt_id', 'INTEGER'], ['baseline_score', 'REAL'],
      ['baseline_source', 'TEXT'], ['baseline_note', 'TEXT'],
      ['outcome', 'TEXT'], ['outcome_attempt_id', 'INTEGER'],
      ['outcome_score', 'REAL'], ['outcome_note', 'TEXT'],
    ] as const) addCol('learning_cycles', col, decl);

    for (const [col, decl] of [['cycle_id', 'INTEGER'], ['dedup_key', 'TEXT']] as const) {
      addCol('journey_events', col, decl);
    }
    if (cols('classes').length && !cols('classes').includes('programme_code')) {
      conn.exec('ALTER TABLE classes ADD COLUMN programme_code TEXT');
    }

    // 2. Bảng mới.
    conn.exec(`
      CREATE TABLE IF NOT EXISTS programmes (
        code TEXT PRIMARY KEY, name TEXT NOT NULL, weeks INTEGER,
        scoring_mode TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS programme_skills (
        programme_code TEXT NOT NULL, skill TEXT NOT NULL, seq INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (programme_code, skill));
      CREATE TABLE IF NOT EXISTS programme_checkpoints (
        programme_code TEXT NOT NULL, kind TEXT NOT NULL, study_week INTEGER NOT NULL,
        PRIMARY KEY (programme_code, kind));
      CREATE TABLE IF NOT EXISTS cycle_target_revisions (
        id INTEGER PRIMARY KEY, cycle_id INTEGER NOT NULL, old_target REAL, new_target REAL,
        effective_from TEXT NOT NULL, reason TEXT, actor_user_id INTEGER, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS case_issues (
        id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'primary',
        taxonomy_code TEXT NOT NULL, taxonomy_version INTEGER NOT NULL DEFAULT 1,
        skill TEXT, observation TEXT, created_by INTEGER, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS case_interventions (
        id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL, kind TEXT NOT NULL, description TEXT,
        performer_user_id INTEGER, performer_name TEXT, recorded_by INTEGER,
        status TEXT NOT NULL DEFAULT 'planned', planned_date TEXT, started_date TEXT,
        completed_date TEXT, followup_due TEXT, migration_key TEXT UNIQUE,
        created_at TEXT NOT NULL, updated_at TEXT);
      CREATE TABLE IF NOT EXISTS case_followups (
        id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL, intervention_id INTEGER,
        observed_on TEXT NOT NULL, observer_user_id INTEGER, outcome TEXT, note TEXT,
        evidence_attempt_id INTEGER, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS case_sources (
        id INTEGER PRIMARY KEY, case_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'support',
        source_type TEXT NOT NULL, source_id INTEGER NOT NULL, note TEXT,
        created_by INTEGER, created_at TEXT NOT NULL,
        UNIQUE (case_id, source_type, source_id, role));
      CREATE INDEX IF NOT EXISTS idx_case_student ON sos_cases(student_id, status);
      CREATE INDEX IF NOT EXISTS idx_case_issue_case ON case_issues(case_id);
      CREATE INDEX IF NOT EXISTS idx_intervention_case ON case_interventions(case_id);
      CREATE INDEX IF NOT EXISTS idx_followup_case ON case_followups(case_id);
    `);

    // 3. Điền học viên/lộ trình cho case cũ, lấy từ chính lượt đánh giá của nó.
    const filled = conn
      .prepare(
        `UPDATE sos_cases SET
           student_id = COALESCE(student_id, (SELECT a.student_id FROM assessment_attempts a WHERE a.id = sos_cases.attempt_id)),
           cycle_id   = COALESCE(cycle_id,   (SELECT a.cycle_id   FROM assessment_attempts a WHERE a.id = sos_cases.attempt_id)),
           detected_at = COALESCE(detected_at, substr(created_at, 1, 10))
         WHERE attempt_id IS NOT NULL AND (student_id IS NULL OR cycle_id IS NULL OR detected_at IS NULL)`,
      )
      .run();
    if (filled.changes) applied.push(`Điền học viên/lộ trình cho ${filled.changes} case cũ`);

    /*
     * 4. Chuyển checklist cố định thành tác động.
     *
     * `migration_key` đảm bảo chạy lại không nhân đôi. Ngày trong dữ liệu cũ chỉ chứng minh
     * việc ĐÃ BẮT ĐẦU với hỗ trợ học thuật — không nâng thành "đã xong".
     */
    const legacy: { field: string; kind: string; dateCol: string; personCol?: string; status: string; label: string }[] = [
      { field: 'talk_student', kind: 'talk_student', dateCol: 'talk_student_date', personCol: 'talk_student_person', status: 'completed', label: 'Trao đổi với học viên' },
      { field: 'talk_parent', kind: 'talk_parent', dateCol: 'talk_parent_date', personCol: 'talk_parent_person', status: 'completed', label: 'Trao đổi với phụ huynh' },
      { field: 'academic', kind: 'tutor', dateCol: 'academic_start_date', personCol: 'academic_person', status: 'started', label: 'Hỗ trợ học thuật' },
      { field: 'ops', kind: 'ops_policy', dateCol: 'ops_date', status: 'completed', label: 'Chính sách vận hành' },
      { field: 'meeting', kind: 'meeting', dateCol: 'meeting_date', status: 'completed', label: 'Buổi gặp riêng' },
    ];
    const caseCols = cols('sos_cases');
    let moved = 0;
    for (const l of legacy) {
      if (!caseCols.includes(l.dateCol)) continue;
      const person = l.personCol && caseCols.includes(l.personCol) ? l.personCol : null;
      const extra = l.field === 'academic' && caseCols.includes('academic_support') ? 'academic_support'
        : l.field === 'ops' && caseCols.includes('ops_policy') ? 'ops_policy'
        : l.field === 'meeting' && caseCols.includes('meeting_kind') ? 'meeting_kind' : null;
      for (const r of conn
        .prepare(`SELECT id, ${l.dateCol} AS d${person ? `, ${person} AS who` : ''}${extra ? `, ${extra} AS what` : ''}
                    FROM sos_cases WHERE ${l.dateCol} IS NOT NULL AND ${l.dateCol} != ''`)
        .all() as any[]) {
        const key = `legacy:${l.field}:${r.id}`;
        const dup = conn.prepare('SELECT 1 FROM case_interventions WHERE migration_key = ?').get(key);
        if (dup) continue;
        conn
          .prepare(
            `INSERT INTO case_interventions (case_id, kind, description, performer_name, status,
                                             started_date, completed_date, migration_key, created_at)
             VALUES (?,?,?,?,?,?,?,?,?)`,
          )
          .run(r.id, l.kind, (r as any).what ?? l.label, (r as any).who ?? null, l.status,
               r.d, l.status === 'completed' ? r.d : null, key, nowIso());
        moved += 1;
      }
    }
    if (moved) applied.push(`Chuyển ${moved} mốc hỗ trợ cũ thành bản ghi tác động (giữ nguyên bản gốc để tra lại)`);

    /*
     * 6. "GHI NHẬN CỦA GIÁO VIÊN" ĐÃ BỎ HẲN Ở VÒNG 4.
     *
     * Bản trước dựng bảng `skill_checkins` từ `teacher_estimates`. Vòng 4 bỏ cả khu đó khỏi
     * sản phẩm (owner chốt 13/09/2026: hai đường chấm điểm song song làm số liệu đá nhau),
     * nên dựng lên rồi lại xoá đi chỉ khiến chạy lần hai báo thêm việc đã làm. `teacher_estimates`
     * vẫn còn nguyên để tra lại.
     */

    // 7. Hành trình cũ: gắn lộ trình khi tra được từ bản ghi thật, còn lại để trống.
    const j = conn
      .prepare(
        `UPDATE journey_events SET cycle_id = (
            SELECT a.cycle_id FROM assessment_attempts a
             WHERE a.id = journey_events.ref_id AND journey_events.ref_table = 'assessment_attempts')
          WHERE cycle_id IS NULL AND ref_table = 'assessment_attempts'`,
      )
      .run();
    if (j.changes) applied.push(`Gắn lộ trình cho ${j.changes} sự kiện hành trình`);

    /*
     * 8b. PHƯƠNG ÁN HỖ TRỢ CÓ CẦN DUYỆT KHÔNG (owner chốt 10/09/2026).
     *
     * Dữ liệu cũ không có khái niệm này, nên mọi việc đã ghi đều để `needs_approval = 0`:
     * chúng đã làm xong rồi, dựng ngược lại một trạng thái "đang chờ duyệt" cho quá khứ là
     * bịa ra một khâu chưa từng tồn tại.
     */
    for (const [c, d] of [
      ['needs_approval', 'INTEGER NOT NULL DEFAULT 0'], ['approval_state', 'TEXT'],
      ['approval_due', 'TEXT'], ['approval_by', 'INTEGER'], ['approval_at', 'TEXT'],
      ['approval_note', 'TEXT'],
    ] as const) addCol('case_interventions', c, d);
    conn.exec(`CREATE INDEX IF NOT EXISTS idx_intervention_approval
                 ON case_interventions(approval_state) WHERE approval_state = 'pending'`);

    /*
     * 8. Khoá của lớp thường thiếu MÃ CHƯƠNG TRÌNH.
     *
     * Thiếu mã này thì không biết khoá chấm theo tỷ lệ hay theo band, nên hồ sơ học viên
     * dựng ra bảng band IELTS cho một lớp Foundation — bốn cột L/R/W/S trống trơn.
     * Suy lại từ lớp của chính các bài kiểm tra trong khoá, và CHỈ khi mọi bài đều thuộc
     * cùng một chương trình; mập mờ thì để trống chứ không đoán.
     */
    const prog = conn
      .prepare(
        `UPDATE learning_cycles SET programme_code = (
            SELECT MIN(c.programme_code) FROM assessment_attempts a
              JOIN classes c ON c.id = a.class_id
             WHERE a.cycle_id = learning_cycles.id AND c.programme_code IS NOT NULL)
          WHERE programme_code IS NULL AND route IS NULL
            AND (SELECT COUNT(DISTINCT c.programme_code) FROM assessment_attempts a
                   JOIN classes c ON c.id = a.class_id
                  WHERE a.cycle_id = learning_cycles.id AND c.programme_code IS NOT NULL) = 1`,
      )
      .run();
    if (prog.changes) applied.push(`Gắn mã chương trình cho ${prog.changes} khoá lớp thường`);

    migrateSkillTopics(conn, applied);
    migrateCaseLifecycle(conn, applied);
    migrateSchedulingFields(conn, applied);
    migratePermissions(conn, applied);
    migrateAccounts(conn, applied);
    migrateWeekOnlySchedule(conn, applied);
    migrateNormalFourSkills(conn, applied);
    migrateCaseCycles(conn, applied);
    migrateMgmtTasks(conn, applied);
    migrateDropBranchAdmin(conn, applied);
    migrateNormalPassThreshold(conn, applied);

    /*
     * Case đã đóng theo hệ thống cũ mà không có hướng xử lý: ghi rõ là "đóng theo hệ thống
     * cũ", KHÔNG bịa ra một kết luận và cũng không mở lại hàng loạt.
     *
     * CHẠY SAU CÙNG, sau cả bước gộp case. Bản trước đặt nó ở giữa, nên những case do chính
     * bước gộp và bước chuyển việc trao đổi tạo ra lại chưa được đánh dấu — và lần chạy thứ
     * hai mới nhặt nốt. Một bước nâng cấp cần xong hẳn trong MỘT lần chạy, nếu không thì
     * không ai biết bao nhiêu lần mới là đủ.
     */
    const legacyClosed = conn
      .prepare(
        `UPDATE sos_cases SET disposition = 'other',
                disposition_note = 'Đóng theo hệ thống cũ — chưa ghi hướng xử lý'
          WHERE status = 'done' AND disposition IS NULL`,
      )
      .run();
    if (legacyClosed.changes) {
      applied.push(`Đánh dấu ${legacyClosed.changes} case đóng theo hệ thống cũ (không bịa kết luận)`);
    }

    conn.prepare("INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES ('case_engine_migrated_at', ?, ?)")
      .run(nowIso(), nowIso());
  })();
  conn.pragma('foreign_keys = ON');

  if (!applied.length) skipped.push('Mô hình case học vụ đã có sẵn, không cần nâng cấp.');
  return { applied, skipped };
}

/**
 * VÒNG 3 — VẤN ĐỀ GẮN VỚI MỘT KỸ NĂNG, VÀ HAI VIỆC TRAO ĐỔI RA BẢNG RIÊNG.
 *
 * Nguyên tắc của bước này: KHÔNG BỊA RA MỘT PHÉP TÁCH KHÔNG CÓ CĂN CỨ.
 *
 * Mô hình mới là "một vấn đề = một lượt × một kỹ năng". Dữ liệu cũ thì một lượt chỉ có một
 * bản ghi, và những việc đã làm trong đó không ghi lại là làm cho kỹ năng nào. Với case
 * trượt ĐÚNG MỘT kỹ năng thì suy ra được chắc chắn; trượt từ hai kỹ năng trở lên thì không
 * — và chia bừa những việc đã làm cho một kỹ năng nào đó là dựng ra một lịch sử sai.
 *
 * Nên: gắn kỹ năng ở chỗ suy được, để trống ở chỗ không suy được (giao diện ghi rõ "chưa
 * gắn kỹ năng"), và chỉ những lượt chấm TỪ NAY mới sinh vấn đề theo từng kỹ năng.
 *
 * Chạy lại lần hai không làm gì thêm.
 */
function migrateSkillTopics(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c) => c.name);
  if (cols('sos_cases').includes('topic')) return;

  /* ---------------------------------------------------------------- 1. bảng Liên hệ */
  conn.exec(`
    CREATE TABLE IF NOT EXISTS student_contacts (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      cycle_id INTEGER REFERENCES learning_cycles(id),
      attempt_id INTEGER REFERENCES assessment_attempts(id),
      kind TEXT NOT NULL,
      due_date TEXT, done_on TEXT,
      done_by INTEGER REFERENCES users(id),
      performer_name TEXT, note TEXT,
      auto INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_auto
      ON student_contacts(attempt_id, kind) WHERE auto = 1;
    CREATE INDEX IF NOT EXISTS idx_contact_student ON student_contacts(student_id);
    CREATE INDEX IF NOT EXISTS idx_contact_due ON student_contacts(due_date) WHERE done_on IS NULL;
  `);

  /*
   * Năm ô hỗ trợ cũ trong `sos_cases` đã được vòng D chuyển thành việc đã làm, nhưng hai ô
   * TRAO ĐỔI thì nay có chỗ đúng hơn. Database nào còn dữ liệu ở đó thì chuyển sang Liên hệ.
   */
  const old = cols('sos_cases');
  if (old.includes('talk_student_date') || old.includes('talk_parent_date')) {
    for (const [kind, dateCol, personCol] of [
      ['talk_student', 'talk_student_date', 'talk_student_person'],
      ['talk_parent', 'talk_parent_date', 'talk_parent_person'],
    ] as const) {
      if (!old.includes(dateCol)) continue;
      const moved = conn
        .prepare(
          `INSERT INTO student_contacts (student_id, cycle_id, attempt_id, kind, done_on,
                                         performer_name, auto, created_at)
           SELECT sc.student_id, sc.cycle_id, sc.attempt_id, ?, sc.${dateCol},
                  ${old.includes(personCol) ? `sc.${personCol}` : 'NULL'}, 1, ?
             FROM sos_cases sc
            WHERE sc.${dateCol} IS NOT NULL AND sc.student_id IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM student_contacts c
                               WHERE c.attempt_id IS sc.attempt_id AND c.kind = ? AND c.auto = 1)`,
        )
        .run(kind, nowIso(), kind);
      if (moved.changes) applied.push(`Chuyển ${moved.changes} lần trao đổi cũ sang bảng Liên hệ`);
    }
  }

  /* ------------------------------------------- 2. mã phân loại cũ sang mã mới */
  const codeMap: Record<string, string> = {
    'student.listening.detail': 'student.listening.sound',
    'student.listening.recognition': 'student.listening.sound',
    'student.listening.follow': 'student.listening.distractor',
    'student.listening.strategy': 'student.listening.technique',
    'student.reading.detail': 'student.reading.language',
    'student.reading.structure': 'student.reading.mainidea',
    'student.reading.inference': 'student.reading.logic',
    'student.reading.strategy': 'student.reading.technique',
  };
  let recoded = 0;
  for (const [from, to] of Object.entries(codeMap)) {
    recoded += conn.prepare('UPDATE case_issues SET taxonomy_code = ? WHERE taxonomy_code = ?')
      .run(to, from).changes;
  }
  if (recoded) applied.push(`Đổi ${recoded} mã phân loại sang bộ mới của Listening/Reading`);

  /*
   * "Hoàn cảnh kèm theo" đã bỏ. Không xoá chữ người ta đã viết: gộp vào Ghi chú của chính
   * vấn đề đó, rồi mới bỏ dòng phân loại.
   */
  /*
   * Nhãn tiếng Việt của bộ hoàn cảnh cũ, chép lại ở đây chứ không đọc từ `shared/domain.ts`:
   * bộ đó đã bị xoá khỏi mã nguồn, và một bước nâng cấp phải tự đứng được với từ vựng của
   * thời điểm nó xử lý. Ghi mã thô vào Ghi chú thì người đọc thấy "context.family" và không
   * hiểu gì.
   */
  const CONTEXT_LABEL: Record<string, string> = {
    'context.parent': 'phía phụ huynh', 'context.health': 'sức khoẻ',
    'context.family': 'hoàn cảnh gia đình', 'context.travel': 'đi lại / khoảng cách',
    'context.schedule': 'lịch cá nhân / trường lớp', 'context.pressure': 'áp lực bên ngoài',
    'context.other': 'khác',
  };
  const ctx = conn
    .prepare(`SELECT case_id, taxonomy_code FROM case_issues WHERE role = 'context' ORDER BY case_id, id`)
    .all() as any[];
  const byCase = new Map<number, string[]>();
  for (const r of ctx) {
    const list = byCase.get(r.case_id) ?? [];
    list.push(CONTEXT_LABEL[r.taxonomy_code] ?? r.taxonomy_code);
    byCase.set(r.case_id, list);
  }
  for (const [caseId, labels] of byCase) {
    conn.prepare(
      `UPDATE sos_cases SET note = TRIM(COALESCE(note || ' · ', '') || 'Hoàn cảnh: ' || ?) WHERE id = ?`,
    ).run(labels.join(', '), caseId);
  }
  const delCtx = conn.prepare("DELETE FROM case_issues WHERE role = 'context'").run();
  if (delCtx.changes) applied.push(`Chuyển ${delCtx.changes} dòng hoàn cảnh thành Ghi chú`);

  /* Vấn đề về giáo viên và giáo trình rời khỏi hệ thống theo dõi học viên (owner chốt). */
  const delOwn = conn
    .prepare("DELETE FROM case_issues WHERE taxonomy_code LIKE 'teacher.%' OR taxonomy_code LIKE 'curriculum.%'")
    .run();
  if (delOwn.changes) {
    applied.push(`Gỡ ${delOwn.changes} phân loại Giáo viên/Giáo trình khỏi vấn đề học viên`);
  }

  /* ------------------------------------------- 3. loại phương án cũ sang loại mới */
  let rekind = 0;
  for (const [from, to] of [['meeting', 'meeting_cx'], ['ops_policy', 'other_proposal']] as const) {
    rekind += conn.prepare('UPDATE case_interventions SET kind = ? WHERE kind = ?').run(to, from).changes;
  }
  /*
   * `talk_student` / `talk_parent` không còn là phương án hỗ trợ. Chuyển sang Liên hệ, giữ
   * nguyên người làm và ngày, rồi mới xoá khỏi bảng phương án — nếu để lại thì mọi màn hình
   * phải viết thêm một câu "trừ hai loại này ra".
   */
  const movedIv = conn
    .prepare(
      `INSERT INTO student_contacts (student_id, cycle_id, attempt_id, kind, done_on, done_by,
                                     performer_name, note, auto, created_at)
       SELECT COALESCE(sc.student_id, a.student_id), COALESCE(sc.cycle_id, a.cycle_id), sc.attempt_id,
              iv.kind, COALESCE(iv.completed_date, iv.started_date), iv.performer_user_id,
              iv.performer_name, iv.description, 0, iv.created_at
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE iv.kind IN ('talk_student', 'talk_parent')
          AND COALESCE(sc.student_id, a.student_id) IS NOT NULL`,
    )
    .run();
  if (movedIv.changes) applied.push(`Chuyển ${movedIv.changes} lần trao đổi từ phương án sang Liên hệ`);
  conn.prepare(
    `DELETE FROM case_followups WHERE intervention_id IN
       (SELECT id FROM case_interventions WHERE kind IN ('talk_student','talk_parent'))`,
  ).run();
  const delIv = conn.prepare("DELETE FROM case_interventions WHERE kind IN ('talk_student','talk_parent')").run();
  if (rekind) applied.push(`Đổi ${rekind} phương án sang nhóm Đề xuất`);
  if (delIv.changes) applied.push(`Gỡ ${delIv.changes} việc trao đổi khỏi bảng phương án`);

  /* ------------------------------------------- 4. dựng lại sos_cases với track/topic */
  conn.exec(`
    CREATE TABLE sos_cases_v3 (
      id INTEGER PRIMARY KEY,
      attempt_id INTEGER REFERENCES assessment_attempts(id),
      student_id INTEGER REFERENCES students(id),
      cycle_id INTEGER REFERENCES learning_cycles(id),
      track TEXT NOT NULL DEFAULT 'academic',
      topic TEXT,
      origin_kind TEXT NOT NULL DEFAULT 'mock',
      detected_at TEXT,
      reported_by INTEGER REFERENCES users(id),
      summary TEXT, urgency TEXT, sos_level INTEGER,
      status TEXT NOT NULL DEFAULT 'open',
      disposition TEXT, disposition_note TEXT,
      closed_by INTEGER REFERENCES users(id), closed_at TEXT,
      acknowledged_by INTEGER REFERENCES users(id), acknowledged_at TEXT,
      head_confirmed_by INTEGER REFERENCES users(id), head_confirmed_at TEXT,
      note TEXT, idempotency_key TEXT UNIQUE,
      created_at TEXT NOT NULL, updated_at TEXT);
  `);
  const pick = (c: string, fallback = 'NULL') => (old.includes(c) ? `sc.${c}` : fallback);
  conn.exec(`
    INSERT INTO sos_cases_v3 (id, attempt_id, student_id, cycle_id, track, topic, origin_kind,
                              detected_at, reported_by, summary, urgency, sos_level, status,
                              disposition, disposition_note, closed_by, closed_at,
                              acknowledged_by, acknowledged_at, head_confirmed_by, head_confirmed_at,
                              note, idempotency_key, created_at, updated_at)
    SELECT sc.id, sc.attempt_id, sc.student_id, sc.cycle_id, 'academic', NULL, sc.origin_kind,
           sc.detected_at, sc.reported_by, sc.summary, sc.urgency, sc.sos_level, sc.status,
           sc.disposition, sc.disposition_note, sc.closed_by, sc.closed_at,
           ${pick('acknowledged_by')}, ${pick('acknowledged_at')},
           ${pick('head_confirmed_by')}, ${pick('head_confirmed_at')},
           ${pick('note')}, sc.idempotency_key, sc.created_at, sc.updated_at
      FROM sos_cases sc;
  `);
  conn.exec('DROP TABLE sos_cases; ALTER TABLE sos_cases_v3 RENAME TO sos_cases;');
  conn.exec(`
    CREATE UNIQUE INDEX idx_case_attempt_topic ON sos_cases(attempt_id, topic) WHERE attempt_id IS NOT NULL;
    CREATE INDEX idx_case_student_topic ON sos_cases(student_id, cycle_id, topic);
  `);
  applied.push('Dựng lại bảng vấn đề với hai đầu mục Học thuật/Ý thức và chủ đề theo kỹ năng');

  /*
   * ------------------------------------------- 5. gắn kỹ năng Ở CHỖ SUY ĐƯỢC
   *
   * Vấn đề giáo viên báo: lấy nhánh của chính mã phân loại chính họ đã chọn. Mã ý thức thì
   * sang đầu mục Ý thức, mã kỹ năng thì ở Học thuật.
   */
  const behaviourMap: Record<string, string> = {
    'student.behaviour.attendance': 'attendance',
    'student.behaviour.homework': 'homework',
    'student.behaviour.focus': 'participation',
    'student.behaviour.selfstudy': 'other',
    'student.behaviour.organisation': 'other',
    'student.behaviour.other': 'other',
  };
  const reported = conn
    .prepare(
      `SELECT sc.id, (SELECT taxonomy_code FROM case_issues i
                       WHERE i.case_id = sc.id AND i.role = 'primary' LIMIT 1) AS code
         FROM sos_cases sc WHERE sc.origin_kind = 'teacher_report'`,
    )
    .all() as any[];
  let tagged = 0;
  for (const r of reported) {
    if (!r.code) continue;
    if (behaviourMap[r.code]) {
      conn.prepare("UPDATE sos_cases SET track = 'behaviour', topic = ? WHERE id = ?")
        .run(behaviourMap[r.code], r.id);
      tagged++;
    } else {
      const branch = String(r.code).split('.')[1];
      // Writing không suy ra được là Task 1 hay Task 2 từ mã phân loại — để trống.
      const topic = ['listening', 'reading', 'speaking'].includes(branch) ? branch : null;
      if (topic) { conn.prepare('UPDATE sos_cases SET topic = ? WHERE id = ?').run(topic, r.id); tagged++; }
    }
  }

  /*
   * Vấn đề sinh từ điểm: chỉ gắn khi trượt ĐÚNG MỘT kỹ năng. Từ hai trở lên thì việc đã làm
   * không ghi lại là làm cho kỹ năng nào, chia bừa là dựng ra một lịch sử sai.
   */
  const single = conn
    .prepare(
      `SELECT sc.id, sc.attempt_id FROM sos_cases sc
        WHERE sc.origin_kind = 'mock' AND sc.sos_level = 1 AND sc.attempt_id IS NOT NULL`,
    )
    .all() as any[];
  for (const r of single) {
    const row = conn
      .prepare(
        `SELECT s.skill FROM assessment_scores s
           JOIN assessment_attempts a ON a.id = s.attempt_id
          WHERE s.attempt_id = ? AND s.band IS NOT NULL
            AND a.target_at_attempt IS NOT NULL
            AND s.band < a.target_at_attempt -
                  (CASE a.attempt_no WHEN 1 THEN 1.0 WHEN 2 THEN 0.5 ELSE 0 END)`,
      )
      .all(r.attempt_id) as any[];
    if (row.length === 1) {
      conn.prepare('UPDATE sos_cases SET topic = ? WHERE id = ?').run(row[0].skill, r.id);
      tagged++;
    }
  }
  if (tagged) applied.push(`Gắn kỹ năng cho ${tagged} vấn đề suy được chắc chắn`);

  /* ------------------------------------------- 6. việc Quản lý giao, và lựa chọn hiển thị */
  for (const [c, d] of [
    ['kind', "TEXT NOT NULL DEFAULT 'branch_ops'"], ['class_id', 'INTEGER'],
    ['track', 'TEXT'], ['topic', 'TEXT'],
  ] as const) {
    if (!cols('tasks').includes(c)) conn.exec(`ALTER TABLE tasks ADD COLUMN ${c} ${d}`);
  }
  conn.exec(`
    CREATE TABLE IF NOT EXISTS task_students (
      id INTEGER PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      student_id INTEGER NOT NULL REFERENCES students(id),
      case_id INTEGER REFERENCES sos_cases(id),
      intervention_id INTEGER REFERENCES case_interventions(id),
      created_at TEXT NOT NULL,
      UNIQUE (task_id, student_id));
    CREATE INDEX IF NOT EXISTS idx_task_students_task ON task_students(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_students_student ON task_students(student_id);
    CREATE TABLE IF NOT EXISTS user_prefs (
      user_id INTEGER NOT NULL REFERENCES users(id),
      key TEXT NOT NULL, value TEXT, updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, key));
  `);

  const untagged = (conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE topic IS NULL').get() as any).n;
  if (untagged) {
    applied.push(`${untagged} vấn đề cũ để trống kỹ năng — không suy được từ dữ liệu, giao diện ghi rõ`);
  }
}


/**
 * VÒNG 4 — MỘT HỌC VIÊN × MỘT HẠNG MỤC = MỘT CASE SỐNG SUỐT KHOÁ.
 *
 * Đây là bước đảo lại vòng 3a. Trước: case gắn với MỘT LƯỢT MT × MỘT KỸ NĂNG, nên một em
 * trượt Listening ở MT1, MT2 và MT3 có ba case rời rạc. Sau: đúng MỘT case Listening, ba
 * lần trượt là ba MỐC trong cùng một case.
 *
 * Nguyên tắc của bước này — GỘP, KHÔNG XOÁ:
 *
 *   · Các case cùng (học viên, lộ trình, hạng mục) gộp về case SỚM NHẤT. Mọi phương án,
 *     phân loại, lần xem lại, bằng chứng, lịch sử và việc Quản lý giao đều được chuyển
 *     sang case sống sót — không bản ghi nào bị bỏ lại.
 *   · Mỗi case bị gộp để lại MỘT MỐC ghi đúng lượt MT, band và mức SOS của nó, nên lịch sử
 *     không mỏng đi sau khi gộp mà còn đọc được rõ hơn.
 *   · Hai việc trao đổi quay về làm phương án của case Ý thức/Khác, giữ nguyên người thực
 *     hiện, ngày thực hiện và ghi chú.
 *   · Trạng thái case sống sót lấy theo cái CÒN MỞ: một hạng mục có một case đã đóng và
 *     một case đang mở thì sau khi gộp nó vẫn đang mở, không được tự đóng lại.
 *
 * Chạy lần hai không đổi gì thêm: mọi bước đều kiểm trước bằng `dedup_key`, `migration_key`
 * hoặc bằng chính sự tồn tại của cột/bảng.
 */
function migrateCaseLifecycle(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const addCol = (table: string, col: string, decl: string) => {
    if (!cols(table).includes(col)) conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
  };
  if (!has('sos_cases')) return;

  /* ------------------------------------------------------------ 1. cột và bảng mới */
  for (const [c, d] of [
    ['category', 'TEXT'], ['dedup_key', 'TEXT'], ['parallel', 'INTEGER NOT NULL DEFAULT 0'],
    ['follow_until', 'TEXT'],
    ['outcome', 'TEXT'], ['outcome_note', 'TEXT'], ['outcome_decision', 'TEXT'],
    ['outcome_by', 'INTEGER'], ['outcome_at', 'TEXT'],
  ] as const) addCol('sos_cases', c, d);
  addCol('case_interventions', 'action_due', 'TEXT');

  conn.exec(`
    CREATE TABLE IF NOT EXISTS case_milestones (
      id INTEGER PRIMARY KEY,
      case_id INTEGER NOT NULL REFERENCES sos_cases(id),
      kind TEXT NOT NULL,
      attempt_id INTEGER REFERENCES assessment_attempts(id),
      attempt_no INTEGER,
      band REAL, expectation REAL, sos_level INTEGER,
      occurred_on TEXT NOT NULL,
      note TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL,
      dedup_key TEXT);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_milestone_dedup ON case_milestones(dedup_key);
    CREATE INDEX IF NOT EXISTS idx_milestone_case ON case_milestones(case_id, occurred_on);
  `);

  /*
   * Chỉ mục cũ ép "mỗi lượt một case mỗi kỹ năng" — chính thứ phải bỏ. Gỡ trước khi gộp,
   * nếu không việc gộp sẽ vướng chính nó.
   */
  conn.exec('DROP INDEX IF EXISTS idx_case_attempt_topic');

  /* ------------------------------------------------------- 2. điền hạng mục cho case cũ */
  const REGULAR_TO_CATEGORY: Record<string, string> = {
    listening: 'listening', reading: 'reading',
    writing: 'writing2', prep_writing: 'writing2',
    pronunciation: 'speaking', speaking: 'speaking',
    writing1: 'writing1', writing2: 'writing2',
  };
  let categorised = 0;
  for (const r of conn
    .prepare('SELECT id, track, topic FROM sos_cases WHERE category IS NULL')
    .all() as any[]) {
    const cat = r.track === 'behaviour' ? 'behaviour' : (REGULAR_TO_CATEGORY[r.topic] ?? null);
    /*
     * Case cũ không gắn được kỹ năng (vòng 3 cố ý không đoán bừa khi một lượt trượt từ hai
     * kỹ năng trở lên) thì hạng mục để TRỐNG. Đoán bừa ở đây sẽ gộp nhầm hai case của hai
     * môn khác nhau làm một — mất dữ liệu thật, không lấy lại được.
     */
    if (!cat) continue;
    conn.prepare('UPDATE sos_cases SET category = ? WHERE id = ?').run(cat, r.id);
    categorised += 1;
  }
  if (categorised) applied.push(`Gắn hạng mục cho ${categorised} case cũ`);

  /* ------------------------------------------------- 3. gộp case cùng một hạng mục */
  const CHILD_TABLES: [string, string][] = [
    ['case_issues', 'case_id'], ['case_interventions', 'case_id'],
    ['case_followups', 'case_id'], ['case_sources', 'case_id'],
    ['sos_case_history', 'case_id'], ['case_milestones', 'case_id'],
    ['task_students', 'case_id'], ['tasks', 'source_sos_case_id'],
  ];
  const repoint = (fromId: number, toId: number) => {
    for (const [table, col] of CHILD_TABLES) {
      if (!has(table) || !cols(table).includes(col)) continue;
      try {
        conn.prepare(`UPDATE ${table} SET ${col} = ? WHERE ${col} = ?`).run(toId, fromId);
      } catch {
        /*
         * `case_sources` có ràng buộc duy nhất (case_id, source_type, source_id, role):
         * hai case cũ có thể cùng trỏ về một lượt MT, và sau khi gộp thì trùng nhau. Bỏ
         * bản trùng thay vì dừng cả bước nâng cấp — bằng chứng vẫn còn nguyên một bản.
         */
        conn.prepare(`DELETE FROM ${table} WHERE ${col} = ?`).run(fromId);
      }
    }
  };

  /*
   * Nhóm gộp:
   *   học thuật              (học viên, lộ trình, hạng mục)
   *   Ý thức do GV tự báo    (học viên, lộ trình)
   *   Ý thức sinh từ một MT  KHÔNG gộp — mỗi lượt một case, đúng ngoại lệ ở mục 1.2
   */
  const groups = new Map<string, any[]>();
  for (const r of conn
    .prepare(
      `SELECT id, student_id, cycle_id, category, track, origin_kind, attempt_id, status,
              detected_at, sos_level, created_at, closed_at, disposition
         FROM sos_cases
        WHERE student_id IS NOT NULL AND category IS NOT NULL AND parallel = 0
        ORDER BY COALESCE(detected_at, substr(created_at, 1, 10)), id`,
    )
    .all() as any[]) {
    if (r.track === 'behaviour' && r.origin_kind === 'mock') continue;
    const key = r.track === 'behaviour'
      ? `bt:${r.student_id}:${r.cycle_id ?? 0}`
      : `a:${r.student_id}:${r.cycle_id ?? 0}:${r.category}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const attemptNo = conn.prepare('SELECT attempt_no FROM assessment_attempts WHERE id = ?');
  let mergedCases = 0;
  let mergedGroups = 0;
  for (const [key, list] of groups) {
    /* Mốc phải ghi cho MỌI case, kể cả nhóm chỉ có một cái — đó là mốc "mở case". */
    const ordered = list.slice();
    const survivor = ordered[0];

    ordered.forEach((c, i) => {
      const no = c.attempt_id ? (attemptNo.get(c.attempt_id) as any)?.attempt_no ?? null : null;
      conn
        .prepare(
          `INSERT OR IGNORE INTO case_milestones
             (case_id, kind, attempt_id, attempt_no, sos_level, occurred_on, note, created_at, dedup_key)
           VALUES (?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          survivor.id,
          i === 0 ? 'opened' : 'repeat',
          c.attempt_id, no, c.sos_level,
          c.detected_at ?? String(c.created_at).slice(0, 10),
          i === 0 ? null : 'Gộp từ case cũ của lượt MT này khi nâng cấp lên vòng 4',
          nowIso(),
          `mig:${c.id}`,
        );
    });

    if (ordered.length < 2) continue;
    mergedGroups += 1;

    for (const c of ordered.slice(1)) {
      repoint(c.id, survivor.id);
      conn.prepare('DELETE FROM sos_cases WHERE id = ?').run(c.id);
      mergedCases += 1;
    }

    /*
     * Case sống sót giữ lượt MT MỚI NHẤT và mức SOS mới nhất — tên case tự sinh từ đó.
     * Trạng thái lấy theo cái CÒN MỞ: gộp một case đã đóng với một case đang mở thì kết quả
     * phải là ĐANG MỞ, không được tự đóng lại việc chưa xong.
     */
    const latest = ordered[ordered.length - 1];
    const anyOpen = ordered.some((c) => c.status !== 'done');
    conn
      .prepare(
        `UPDATE sos_cases
            SET attempt_id = COALESCE(?, attempt_id),
                sos_level  = COALESCE(?, sos_level),
                status     = ?,
                closed_at  = CASE WHEN ? = 'done' THEN closed_at ELSE NULL END,
                updated_at = ?
          WHERE id = ?`,
      )
      .run(latest.attempt_id, latest.sos_level, anyOpen ? (survivor.status === 'done' ? 'in_progress' : survivor.status) : 'done',
           anyOpen ? 'open' : 'done', nowIso(), survivor.id);
    void key;
  }
  if (mergedCases) {
    applied.push(`Gộp ${mergedCases} case rời rạc vào ${mergedGroups} case sống suốt khoá (giữ nguyên mọi phương án và lịch sử)`);
  }

  /* ------------------------------------- 4. hai việc trao đổi quay về làm phương án */
  if (has('student_contacts')) {
    let moved = 0;
    for (const c of conn
      .prepare(
        `SELECT sc.*, a.cycle_id AS attempt_cycle
           FROM student_contacts sc
           LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
          ORDER BY sc.id`,
      )
      .all() as any[]) {
      const cycleId = c.cycle_id ?? c.attempt_cycle ?? null;
      /*
       * Việc trao đổi phải về đúng case Ý thức/Khác của nó: sinh từ một lượt MT thì về case
       * của chính lượt đó, giáo viên tự thêm thì về case Ý thức sống dai của em.
       */
      const dedup = c.attempt_id && c.auto
        ? `bm:${c.attempt_id}`
        : `bt:${c.student_id}:${cycleId ?? 0}`;
      let target = conn.prepare('SELECT id FROM sos_cases WHERE dedup_key = ?').get(dedup) as any;
      if (!target) {
        target = conn
          .prepare(
            `SELECT id FROM sos_cases
              WHERE student_id = ? AND track = 'behaviour' AND parallel = 0
                AND COALESCE(cycle_id, 0) = ?
                AND ${c.attempt_id && c.auto ? 'attempt_id = ?' : "origin_kind != 'mock'"}
              ORDER BY id LIMIT 1`,
          )
          .get(...(c.attempt_id && c.auto
            ? [c.student_id, cycleId ?? 0, c.attempt_id]
            : [c.student_id, cycleId ?? 0])) as any;
      }
      if (!target) {
        /* Chưa có case Ý thức nào nhận nó thì mở một case, chứ không bỏ bản ghi đi. */
        const info = conn
          .prepare(
            `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, track, topic, category,
                                    origin_kind, detected_at, status, dedup_key, created_at)
             VALUES (?,?,?, 'behaviour', 'other', 'behaviour', ?, ?, ?, ?, ?)`,
          )
          .run(c.attempt_id, c.student_id, cycleId,
               c.auto && c.attempt_id ? 'mock' : 'teacher_report',
               c.done_on ?? c.due_date ?? String(c.created_at).slice(0, 10),
               c.done_on ? 'done' : 'open', dedup, nowIso());
        target = { id: Number(info.lastInsertRowid) };
      }
      const key = `contact:${c.id}`;
      if (conn.prepare('SELECT 1 FROM case_interventions WHERE migration_key = ?').get(key)) continue;
      conn
        .prepare(
          `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, performer_name,
                                           status, completed_date, action_due, migration_key, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(target.id, c.kind, c.note ?? null, c.done_by ?? null, c.performer_name ?? null,
             c.done_on ? 'completed' : 'planned', c.done_on ?? null, c.due_date ?? null,
             key, c.created_at ?? nowIso());
      moved += 1;
    }
    if (moved) applied.push(`Chuyển ${moved} việc trao đổi thành phương án của case Ý thức/Khác`);
    conn.exec('DROP TABLE IF EXISTS student_contacts');
    applied.push('Bỏ bảng Liên hệ riêng — hai việc trao đổi nay nằm trong case');
  }

  /* --------------------------------------------------- 5. bỏ hẳn "Ghi nhận của GV" */
  if (has('skill_checkins')) {
    const n = (conn.prepare('SELECT COUNT(*) n FROM skill_checkins').get() as any).n;
    conn.prepare("DELETE FROM case_sources WHERE source_type = 'checkin'").run();
    conn.prepare("DELETE FROM journey_events WHERE ref_table = 'skill_checkins'").run();
    conn.exec('DROP TABLE IF EXISTS skill_checkins');
    applied.push(`Bỏ hẳn "Ghi nhận của giáo viên" (${n} bản ghi) — chỉ còn một nguồn điểm duy nhất`);
  }

  /* ----------------------------------------------------- 6. đặt khoá chống trùng */
  let keyed = 0;
  for (const r of conn
    .prepare(
      `SELECT id, student_id, cycle_id, category, track, origin_kind, attempt_id
         FROM sos_cases WHERE dedup_key IS NULL AND parallel = 0 ORDER BY id`,
    )
    .all() as any[]) {
    let key: string | null = null;
    if (r.track === 'behaviour') {
      key = r.origin_kind === 'mock'
        ? (r.attempt_id ? `bm:${r.attempt_id}` : null)
        : (r.student_id ? `bt:${r.student_id}:${r.cycle_id ?? 0}` : null);
    } else if (r.student_id && r.category) {
      key = `a:${r.student_id}:${r.cycle_id ?? 0}:${r.category}`;
    }
    if (!key) continue;
    /*
     * Vẫn còn đụng nhau thì để case này là case SONG SONG thay vì bỏ nó đi. Case song song
     * là một trạng thái hợp lệ ở mục 7.13, nên không mất gì; còn xoá là mất thật.
     */
    if (conn.prepare('SELECT 1 FROM sos_cases WHERE dedup_key = ?').get(key)) {
      conn.prepare('UPDATE sos_cases SET parallel = 1 WHERE id = ?').run(r.id);
      continue;
    }
    conn.prepare('UPDATE sos_cases SET dedup_key = ? WHERE id = ?').run(key, r.id);
    keyed += 1;
  }
  if (keyed) applied.push(`Đặt khoá chống trùng cho ${keyed} case`);

  conn.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_case_dedup ON sos_cases(dedup_key);
    CREATE INDEX IF NOT EXISTS idx_case_student_category ON sos_cases(student_id, cycle_id, category);
    CREATE INDEX IF NOT EXISTS idx_case_follow_until ON sos_cases(follow_until) WHERE follow_until IS NOT NULL;
  `);
}


/**
 * VÒNG 4 · PHASE 2 — TUẦN BẮT ĐẦU HỌC, LỊCH MT MẶC ĐỊNH, VÀ TÊN MÔN W.
 *
 * Ba việc, đều là thêm chứ không bỏ:
 *
 *   1. Cột mới cho tuần bắt đầu học (lớp và lộ trình), tháng thi dự kiến, mốc kiểm tra do
 *      người xếp lại, và cột ghi AI đã xếp tuần MT.
 *   2. Đổi mã môn `prep_writing` → `writing` ở MỌI chỗ dữ liệu nhắc tới nó. Đây là đổi mã
 *      thật trong database, không phải chỉ đổi nhãn — để sau này không ai phải nhớ hai mã
 *      cho một môn.
 *   3. Suy ngược tuần bắt đầu học cho dữ liệu cũ, CHỈ ở chỗ suy được chắc chắn.
 *
 * Chạy lần hai không đổi gì thêm: mỗi bước tự kiểm bằng sự tồn tại của cột hoặc bằng chính
 * giá trị đang có.
 */
/**
 * ĐỒNG BỘ BỘ QUYỀN với danh sách trong `shared/domain.ts`.
 *
 * Vòng 4 thêm quyền `case.view` — tách việc XEM danh sách case khỏi việc GHI NHẬN xử lý,
 * vì bảng bộ lọc ở mục 6 nói Admin chi nhánh vẫn ghi nhận được nhưng không có bốn bộ lọc
 * case. Trên database đang chạy, quyền mới phải được thêm và cấp lại cho đúng ba vai, nếu
 * không thì tài khoản cũ mở màn Học viên lên sẽ mất sạch bộ lọc case.
 *
 * Chạy lại lần hai không làm gì thêm: chỉ thêm phần CÒN THIẾU, không xoá quyền ai đã có.
 */
/**
 * TÀI KHOẢN VÀ ĐĂNG NHẬP (vòng 4 phase 4) trên database đang chạy.
 *
 * Thêm cột mật khẩu, trạng thái duyệt và bốn bảng mới; nạp bảng `routes` từ danh sách viết
 * cứng; và ĐẶT MẬT KHẨU cho những tài khoản cũ chưa có, nếu không thì sau khi cập nhật
 * không ai đăng nhập được vào chính dữ liệu của mình.
 *
 * Email suy từ tên theo đúng quy ước `ten.pisa@gmail.com`. Tài khoản nào đã có email thì giữ
 * nguyên — không ghi đè một địa chỉ người ta đang dùng.
 *
 * Chạy lại lần hai không làm gì thêm.
 */
function migrateAccounts(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('users')) return;

  const addCol = (table: string, col: string, decl: string) => {
    if (!cols(table).includes(col)) conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
  };
  for (const [c, d] of [
    ['phone', 'TEXT'],
    ['password_hash', 'TEXT'],
    ['password_salt', 'TEXT'],
    ['approval_state', "TEXT NOT NULL DEFAULT 'approved'"],
    ['requested_branches', 'TEXT'],
    ['requested_note', 'TEXT'],
    ['approved_by', 'INTEGER'],
    ['approved_at', 'TEXT'],
    ['decline_reason', 'TEXT'],
  ] as const) addCol('users', c, d);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS user_emails (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      email TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE (user_id, email));
    CREATE TABLE IF NOT EXISTS user_skills (
      user_id INTEGER NOT NULL REFERENCES users(id),
      skill TEXT NOT NULL, PRIMARY KEY (user_id, skill));
    CREATE TABLE IF NOT EXISTS user_permissions (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      permission_id INTEGER NOT NULL REFERENCES permissions(id),
      branch_id INTEGER REFERENCES branches(id),
      note TEXT, granted_by INTEGER REFERENCES users(id), created_at TEXT NOT NULL,
      UNIQUE (user_id, permission_id, branch_id));
    CREATE TABLE IF NOT EXISTS routes (
      code TEXT PRIMARY KEY, name TEXT NOT NULL, note TEXT,
      seq INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL);
  `);
  const routes = seedRoutes(conn);

  /* Email và mật khẩu cho tài khoản cũ. Không đụng vào ai đã có sẵn. */
  const used = new Set(
    (conn.prepare('SELECT email FROM users WHERE email IS NOT NULL').all() as any[]).map((r: any) => r.email),
  );
  const emailFor = (name: string) => {
    const parts = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd').toLowerCase().split(/\s+/).filter(Boolean);
    const stem = ((parts[parts.length - 1] ?? 'nv') + (parts[0] ? `.${parts[0]}` : '')).replace(/[^a-z0-9.]/g, '');
    let local = stem; let n = 1;
    while (used.has(`${local}${EMAIL_SUFFIX}`)) { n += 1; local = `${stem}${n}`; }
    used.add(`${local}${EMAIL_SUFFIX}`);
    return `${local}${EMAIL_SUFFIX}`;
  };

  let fixed = 0;
  for (const u of conn.prepare('SELECT id, full_name, email, password_hash FROM users').all() as any[]) {
    const email = u.email || emailFor(u.full_name);
    if (u.password_hash && u.email) continue;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
    conn.prepare('UPDATE users SET email = ?, password_hash = ?, password_salt = ? WHERE id = ?')
      .run(email, u.password_hash ?? hash, u.password_salt ?? salt, u.id);
    fixed += 1;
  }

  /*
   * TÀI KHOẢN QUẢN TRỊ MẶC ĐỊNH của owner phải tồn tại kể cả trên database cũ — nếu không thì
   * sau khi cập nhật, chính người chủ hệ thống là người duy nhất không vào được.
   */
  let createdAdmin = false;
  if (!conn.prepare('SELECT 1 FROM users WHERE email = ?').get(DEFAULT_ADMIN_EMAIL)) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString('hex');
    const n = (conn.prepare('SELECT COUNT(*) n FROM users').get() as any).n + 1;
    const info = conn
      .prepare(
        `INSERT INTO users (code, full_name, email, title, password_hash, password_salt,
                            approval_state, status, created_at)
         VALUES (?,?,?,?,?,?, 'approved', 'active', ?)`,
      )
      .run(`NV${String(n).padStart(3, '0')}`, 'Đỗ Vũ Tuấn Phong', DEFAULT_ADMIN_EMAIL,
           'Quản trị hệ thống', hash, salt, nowIso());
    const role = conn.prepare("SELECT id FROM roles WHERE key = 'system_admin'").get() as any;
    if (role) {
      conn.prepare("INSERT INTO user_roles (user_id, role_id, branch_id, status, created_at) VALUES (?,?,NULL,'active',?)")
        .run(Number(info.lastInsertRowid), role.id, nowIso());
    }
    createdAdmin = true;
  }

  const bits: string[] = [];
  if (routes) bits.push(`nạp ${routes} lộ trình`);
  if (fixed) bits.push(`đặt email và mật khẩu cho ${fixed} tài khoản`);
  if (createdAdmin) bits.push('tạo tài khoản Quản trị hệ thống mặc định');
  if (bits.length) applied.push(`Tài khoản và đăng nhập: ${bits.join(', ')}`);
}

function migratePermissions(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('permissions') || !has('roles') || !has('role_permissions')) return;

  let added = 0;
  for (const [key, label] of Object.entries(PERMISSION_LABEL)) {
    const row = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(key) as any;
    if (row) continue;
    conn.prepare('INSERT INTO permissions (key, name_vi) VALUES (?,?)').run(key, label);
    added += 1;
  }

  /* Cấp quyền mới cho đúng những vai mà seed cấp — không tự ý nới cho vai khác. */
  let granted = 0;
  for (const [roleKey, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = conn.prepare('SELECT id FROM roles WHERE key = ?').get(roleKey) as any;
    if (!role) continue;
    for (const k of keys) {
      const perm = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(k) as any;
      if (!perm) continue;
      const had = conn
        .prepare('SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?')
        .get(role.id, perm.id);
      if (had) continue;
      conn.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?,?)')
        .run(role.id, perm.id);
      granted += 1;
    }
  }
  if (added || granted) applied.push(`Bổ sung ${added} quyền mới và ${granted} lượt cấp quyền cho vai trò`);
}

function migrateSchedulingFields(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const addCol = (table: string, col: string, decl: string) => {
    if (!cols(table).includes(col)) conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
  };
  if (!has('classes') || !has('learning_cycles')) return;

  /* ------------------------------------------------------------- 1. cột mới */
  for (const [c, d] of [
    ['start_period_id', 'INTEGER REFERENCES report_periods(id)'],
    ['progress_week_override', 'INTEGER'],
    ['final_week_override', 'INTEGER'],
  ] as const) addCol('classes', c, d);

  for (const [c, d] of [
    ['start_period_id', 'INTEGER REFERENCES report_periods(id)'],
    ['exam_month', 'TEXT'],
  ] as const) addCol('learning_cycles', c, d);

  addCol('assessment_attempts', 'plan_source', "TEXT NOT NULL DEFAULT 'manual'");

  /* ------------------------------------------ 2. đổi mã môn prep_writing → writing */
  const renames: [string, string][] = [
    ['assessment_scores', 'skill'],
    ['class_skills', 'skill'],
    ['teacher_assignments', 'skill'],
    ['programme_skills', 'skill'],
    ['attempt_required_skills', 'skill'],
    ['attempt_skill_skips', 'skill'],
    ['teacher_estimates', 'skill'],
    ['sos_cases', 'topic'],
    ['case_issues', 'skill'],
    ['tasks', 'topic'],
  ];
  let renamed = 0;
  for (const [table, col] of renames) {
    if (!has(table) || !cols(table).includes(col)) continue;
    try {
      renamed += conn.prepare(`UPDATE ${table} SET ${col} = 'writing' WHERE ${col} = 'prep_writing'`).run().changes;
    } catch {
      /*
       * Bảng có ràng buộc duy nhất trên cột đó (ví dụ mỗi lớp một dòng cho mỗi kỹ năng) và
       * đã tồn tại sẵn dòng 'writing'. Bỏ dòng cũ thay vì dừng cả bước nâng cấp — dữ liệu
       * mới đã có đủ, giữ thêm dòng mã cũ chỉ làm hai kỹ năng hiện ra cho một môn.
       */
      conn.prepare(`DELETE FROM ${table} WHERE ${col} = 'prep_writing'`).run();
    }
  }
  if (renamed) applied.push(`Đổi mã môn Prep-Writing sang W ở ${renamed} bản ghi`);

  /*
   * Hạng mục của case cũng phải đổi theo: mã cũ ánh xạ về `writing2`, mã mới cũng vậy, nên
   * hạng mục không đổi — nhưng case nào chưa có hạng mục thì nay gắn được.
   */
  if (cols('sos_cases').includes('category')) {
    const fixed = conn
      .prepare(`UPDATE sos_cases SET category = 'writing2' WHERE category IS NULL AND topic = 'writing'`)
      .run().changes;
    if (fixed) applied.push(`Gắn hạng mục cho ${fixed} case môn W`);
  }

  /* --------------------------------- 3. suy ngược tuần bắt đầu học ở chỗ suy được */
  /*
   * CHỈ SUY KHI CÓ CĂN CỨ CHẮC CHẮN, và ở đây căn cứ là ngày ghi danh sớm nhất của học
   * viên trong lộ trình đó. Không có ghi danh nào thì để TRỐNG — badge "Thiếu thông tin"
   * sẽ nhắc người có trách nhiệm điền, và đó là kết quả đúng.
   *
   * KHÔNG suy từ ngày làm bài MT1 rồi trừ ngược 5 tuần: MT1 có thể đã bị xếp lại, và một
   * phép trừ ngược như thế dựng ra một "sự thật" chưa từng ai khai.
   */
  const cycleWeeks = conn
    .prepare(
      `SELECT lc.id, MIN(e.started_at) AS first_day
         FROM learning_cycles lc
         JOIN enrollments e ON e.student_id = lc.student_id
        WHERE lc.start_period_id IS NULL AND e.started_at IS NOT NULL
        GROUP BY lc.id`,
    )
    .all() as any[];
  let filled = 0;
  for (const r of cycleWeeks) {
    if (!r.first_day) continue;
    const monday = mondayOfIso(String(r.first_day).slice(0, 10));
    const period = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(monday) as any;
    if (!period) continue;
    conn.prepare('UPDATE learning_cycles SET start_period_id = ? WHERE id = ?').run(period.id, r.id);
    filled += 1;
  }
  if (filled) applied.push(`Suy tuần bắt đầu học cho ${filled} lộ trình từ ngày ghi danh`);

  const classWeeks = conn
    .prepare(`SELECT id, start_date FROM classes WHERE start_period_id IS NULL AND start_date IS NOT NULL`)
    .all() as any[];
  let filledClass = 0;
  for (const c of classWeeks) {
    const monday = mondayOfIso(String(c.start_date).slice(0, 10));
    const period = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(monday) as any;
    if (!period) continue;
    conn.prepare('UPDATE classes SET start_period_id = ? WHERE id = ?').run(period.id, c.id);
    filledClass += 1;
  }
  if (filledClass) applied.push(`Suy tuần bắt đầu cho ${filledClass} lớp từ ngày khai giảng`);

  /*
   * MỌI LƯỢT MT ĐÃ CÓ ĐỀU LÀ 'manual'.
   *
   * Chúng do người xếp từ trước, nên hệ thống không được phép tính lại và ghi đè. Cột mặc
   * định đã là 'manual' nên không phải làm gì — ghi lại ở đây để người đọc sau không tưởng
   * là bước nâng cấp bỏ sót.
   */
}

/** Thứ Hai của tuần chứa ngày đó. Chép lại ở đây vì bước nâng cấp phải tự đứng được. */
function mondayOfIso(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7;        // thứ Hai = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/**
 * VÒNG 5 — BỎ HẲN NGÀY THI, CHỈ CÒN TUẦN.
 *
 * Ba việc, làm trên dữ liệu đang có và KHÔNG xoá gì của người dùng:
 *
 *  1. Lượt MT nào chỉ có ngày mà chưa có tuần thì SUY RA TUẦN từ chính ngày đó trước, rồi
 *     mới bỏ hai cột ngày. Bỏ trước khi suy là làm mất lịch của người ta.
 *  2. Ngày làm bài của từng kỹ năng (`taken_on`) biến mất. Nó chỉ dùng để tính hạn và
 *     thời gian chấm, mà cả hai nay đếm theo tuần.
 *  3. Ngày thi IELTS cụ thể (`exam_date`) thành TUẦN DỰ KIẾN THI. Có ngày thì lấy tuần
 *     chứa ngày đó; tháng thi giữ nguyên như cũ.
 *
 * Hai quyền "Chốt ngày giờ trong tuần" và "Đổi lịch Speaking" bị gỡ khỏi mọi vai và mọi
 * cá nhân, vì việc chúng cho phép làm không còn tồn tại.
 */
function migrateWeekOnlySchedule(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('assessment_attempts') || !has('report_periods')) return;

  const ensurePeriodFor = (date: string): number | null => {
    const weekStart = mondayOfIso(date);
    const found = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(weekStart) as any;
    if (found) return found.id;
    const d = new Date(weekStart + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 3);                       // thứ Năm quyết định tháng sở hữu
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const weekEnd = (() => {
      const e = new Date(weekStart + 'T00:00:00Z');
      e.setUTCDate(e.getUTCDate() + 6);
      return e.toISOString().slice(0, 10);
    })();
    const before = conn
      .prepare(`SELECT COUNT(*) AS n FROM report_periods WHERE year = ? AND month = ? AND week_start < ?`)
      .get(year, month, weekStart) as any;
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const weekNo = (before?.n ?? 0) + 1;
    conn
      .prepare(
        `INSERT INTO report_periods (week_start, week_end, year, month, week_no, code, created_at)
         VALUES (?,?,?,?,?,?,?)`,
      )
      .run(weekStart, weekEnd, year, month, weekNo, `W${weekNo} ${MONTHS[month - 1]} ${year}`, new Date().toISOString());
    return (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(weekStart) as any)?.id ?? null;
  };

  /* --------------------------------------------- 1. mã tuần phải kèm NĂM */
  let recoded = 0;
  for (const r of conn.prepare('SELECT id, week_start, year, month, week_no, code FROM report_periods').all() as any[]) {
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const want = `W${r.week_no} ${MONTHS[r.month - 1]} ${r.year}`;
    if (r.code !== want) {
      conn.prepare('UPDATE report_periods SET code = ? WHERE id = ?').run(want, r.id);
      recoded += 1;
    }
  }
  if (recoded) applied.push(`Thêm năm vào mã tuần của ${recoded} tuần (W1 SEP → W1 SEP 2026)`);

  /* --------------------------------------------- 2. suy tuần rồi bỏ cột ngày */
  const attemptCols = cols('assessment_attempts');
  if (attemptCols.includes('lrw_scheduled_at')) {
    let inferred = 0;
    for (const a of conn
      .prepare(`SELECT id, lrw_scheduled_at FROM assessment_attempts
                 WHERE planned_period_id IS NULL AND lrw_scheduled_at IS NOT NULL`)
      .all() as any[]) {
      const pid = ensurePeriodFor(String(a.lrw_scheduled_at).slice(0, 10));
      if (!pid) continue;
      conn.prepare('UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?').run(pid, a.id);
      inferred += 1;
    }
    if (inferred) applied.push(`Suy tuần MT cho ${inferred} lượt chỉ có ngày mà chưa có tuần`);

    conn.exec('ALTER TABLE assessment_attempts DROP COLUMN lrw_scheduled_at');
    if (cols('assessment_attempts').includes('speaking_scheduled_at')) {
      conn.exec('ALTER TABLE assessment_attempts DROP COLUMN speaking_scheduled_at');
    }
    applied.push('Bỏ ngày buổi L/R/W và ngày Speaking — một lượt MT nay chỉ thuộc một tuần');
  }

  /* --------------------------------------------- 3. bỏ ngày làm bài của từng kỹ năng */
  if (has('assessment_scores') && cols('assessment_scores').includes('taken_on')) {
    conn.exec('ALTER TABLE assessment_scores DROP COLUMN taken_on');
    applied.push('Bỏ ngày làm bài riêng của từng kỹ năng — hạn và thời gian chấm đếm theo tuần');
  }

  /* --------------------------------------------- 4. ngày thi IELTS → tuần dự kiến thi */
  if (has('learning_cycles') && cols('learning_cycles').includes('exam_date')) {
    if (!cols('learning_cycles').includes('exam_period_id')) {
      conn.exec('ALTER TABLE learning_cycles ADD COLUMN exam_period_id INTEGER REFERENCES report_periods(id)');
    }
    let moved = 0;
    for (const c of conn
      .prepare('SELECT id, exam_date, exam_month FROM learning_cycles WHERE exam_date IS NOT NULL')
      .all() as any[]) {
      const day = String(c.exam_date).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      const pid = ensurePeriodFor(day);
      if (!pid) continue;
      // Tháng thi để trống thì điền theo chính ngày cũ — không làm mất thông tin đang có.
      conn
        .prepare(`UPDATE learning_cycles SET exam_period_id = ?,
                    exam_month = COALESCE(exam_month, ?) WHERE id = ?`)
        .run(pid, day.slice(0, 7), c.id);
      moved += 1;
    }
    conn.exec('ALTER TABLE learning_cycles DROP COLUMN exam_date');
    applied.push(`Đổi ngày thi IELTS thành tuần dự kiến thi (${moved} lộ trình có ngày cũ)`);
  }

  /* --------------------------------------------- 5. FT = Fast Track, không phải Full-time */
  if (has('classes') && cols('classes').includes('is_fulltime') && !cols('classes').includes('is_fast_track')) {
    conn.exec('ALTER TABLE classes RENAME COLUMN is_fulltime TO is_fast_track');
    applied.push('Đổi tên cột lớp FT cho đúng nghĩa Fast Track (dữ liệu giữ nguyên)');
  }

  /* --------------------------------------------- 6. gỡ hai quyền không còn việc để làm */
  if (has('permissions')) {
    const gone = ['schedule.date', 'schedule.speaking'];
    let removed = 0;
    for (const key of gone) {
      const perm = conn.prepare('SELECT id FROM permissions WHERE key = ?').get(key) as any;
      if (!perm) continue;
      for (const t of ['role_permissions', 'user_permissions']) {
        if (has(t)) removed += (conn.prepare(`DELETE FROM ${t} WHERE permission_id = ?`).run(perm.id) as any).changes;
      }
      conn.prepare('DELETE FROM permissions WHERE id = ?').run(perm.id);
    }
    if (removed) applied.push(`Gỡ quyền "Chốt ngày giờ" và "Đổi lịch Speaking" khỏi ${removed} lượt cấp quyền`);
  }
}

/**
 * VÒNG 5 — LỚP NORMAL CHỈ CÒN BỐN MÔN L/R/W/S, VÀ W KHÔNG CÒN LÀ W2.
 *
 * Hai việc trên dữ liệu đang có:
 *
 * 1. PRONUNCIATION → SPEAKING. Foundation trước đây gọi môn nói là Pronunciation. Hai môn
 *    đó đo cùng một thứ ở hai cái tên, nên mọi bảng tổng hợp phải cộng hai cột lại mới trả
 *    lời được "cả trung tâm yếu nói đến đâu".
 *
 *    NHƯNG KHÔNG GHI ĐÈ. Nếu một lượt đã có CẢ Pronunciation lẫn Speaking thì đó là hai
 *    điểm thật của hai lần chấm, và đổi tên một cái sẽ đè lên cái kia. Những lượt như vậy
 *    được ĐỂ NGUYÊN và báo ra thành một con số, để người phụ trách quyết định — máy không
 *    được tự chọn hộ điểm nào sống điểm nào chết.
 *
 * 2. CASE MÔN W TÁCH KHỎI W2. Vòng 4 xếp case môn Writing của lớp Normal vào hạng mục
 *    `writing2` của Fast Track; owner bác bỏ ở vòng 5. Đổi lại hạng mục và đặt lại khoá
 *    chống trùng cho đúng.
 */
function migrateNormalFourSkills(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);

  /* ------------------------------------------- 1. Pronunciation → Speaking, không ghi đè */
  if (has('assessment_scores')) {
    const clash = conn
      .prepare(
        `SELECT COUNT(*) AS n FROM assessment_scores p
          WHERE p.skill = 'pronunciation'
            AND EXISTS (SELECT 1 FROM assessment_scores s
                         WHERE s.attempt_id = p.attempt_id AND s.skill = 'speaking')`,
      )
      .get() as any;
    const moved = conn
      .prepare(
        `UPDATE assessment_scores SET skill = 'speaking'
          WHERE skill = 'pronunciation'
            AND NOT EXISTS (SELECT 1 FROM assessment_scores s
                             WHERE s.attempt_id = assessment_scores.attempt_id AND s.skill = 'speaking')`,
      )
      .run().changes;
    if (moved) applied.push(`Gộp ${moved} điểm Pronunciation vào môn Speaking`);
    if (clash?.n) {
      applied.push(
        `${clash.n} điểm Pronunciation ĐỂ NGUYÊN vì lượt đó đã có điểm Speaking riêng `
        + '— hai điểm thật của hai lần chấm, cần người xem và quyết định, máy không gộp hộ',
      );
    }
  }

  /* Phân công giáo viên và danh sách môn của chương trình: đổi thẳng, không có xung đột. */
  for (const [table, col] of [
    ['teacher_assignments', 'skill'],
    ['programme_skills', 'skill'],
    ['attempt_skill_skips', 'skill'],
    ['user_skills', 'skill'],
  ] as const) {
    if (!has(table) || !cols(table).includes(col)) continue;
    // Bỏ dòng sẽ trùng sau khi đổi tên, rồi mới đổi — tránh vi phạm ràng buộc duy nhất.
    try {
      conn.prepare(
        `DELETE FROM ${table} WHERE ${col} = 'pronunciation'
          AND EXISTS (SELECT 1 FROM ${table} b WHERE b.${col} = 'speaking'
                        AND b.rowid != ${table}.rowid)`,
      ).run();
    } catch { /* bảng không có ràng buộc phù hợp thì bỏ qua bước dọn */ }
    conn.prepare(`UPDATE ${table} SET ${col} = 'speaking' WHERE ${col} = 'pronunciation'`).run();
  }

  /* ------------------------------------------- 2. case môn W tách khỏi W2 */
  if (has('sos_cases') && cols('sos_cases').includes('category')) {
    const n = conn
      .prepare(
        `UPDATE sos_cases SET category = 'writing'
          WHERE category = 'writing2' AND topic IN ('writing', 'prep_writing')`,
      )
      .run().changes;
    // Case chủ đề Pronunciation nay thuộc hạng mục Speaking.
    const m = conn
      .prepare(`UPDATE sos_cases SET category = 'speaking', topic = 'speaking' WHERE topic = 'pronunciation'`)
      .run().changes;
    if (n) applied.push(`Tách ${n} case môn W của lớp Normal ra khỏi hạng mục Writing Task 2`);
    if (m) applied.push(`Chuyển ${m} case Pronunciation sang hạng mục Speaking`);

    /*
     * ĐẶT LẠI KHOÁ CHỐNG TRÙNG. Khoá chứa tên hạng mục, nên đổi hạng mục mà quên khoá thì
     * lần trượt sau sinh ra một case thứ hai ở cùng một hạng mục — đúng cái khoá này sinh
     * ra để chặn. Case nào đổi khoá mà đụng một case đã có thì để nguyên khoá cũ và báo ra.
     */
    if (cols('sos_cases').includes('dedup_key')) {
      let rekeyed = 0;
      let conflicts = 0;
      for (const c of conn
        .prepare(`SELECT id, student_id, cycle_id, category, dedup_key FROM sos_cases WHERE track = 'academic'`)
        .all() as any[]) {
        const want = `a:${c.student_id}:${c.cycle_id ?? 0}:${c.category}`;
        if (c.dedup_key === want) continue;
        const taken = conn.prepare('SELECT id FROM sos_cases WHERE dedup_key = ? AND id != ?').get(want, c.id) as any;
        if (taken) { conflicts += 1; continue; }
        conn.prepare('UPDATE sos_cases SET dedup_key = ? WHERE id = ?').run(want, c.id);
        rekeyed += 1;
      }
      if (rekeyed) applied.push(`Đặt lại khoá chống trùng cho ${rekeyed} case sau khi đổi hạng mục`);
      if (conflicts) applied.push(`${conflicts} case giữ khoá cũ vì hạng mục đó đã có case khác — cần người gộp tay`);
    }
  }
}

/**
 * VÒNG 5 — CỘT MỚI CHO WORKFLOW CASE HAI TUẦN (mục 7.5, 7.7).
 *
 * Cơ sở dữ liệu mới dựng thì đã có sẵn các cột này từ `schema.sql`; hàm này chỉ vá cho cơ
 * sở dữ liệu CŨ, vì thêm cột là thao tác duy nhất SQLite làm được mà không phải dựng lại
 * bảng. Mọi bước đều kiểm tra trước, nên chạy lần hai không đổi gì.
 *
 * Bản ghi cũ được đặt về chu kỳ 1 và mốc bắt đầu lấy theo ngày đã có — không bịa ra một
 * ngày bắt đầu mới, và cũng không để trống khiến mọi phương án cũ trông như chưa từng chạy.
 */
function migrateCaseCycles(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  const addCol = (table: string, col: string, decl: string) => {
    if (!has(table) || cols(table).includes(col)) return false;
    conn.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${decl}`);
    return true;
  };

  let added = 0;
  /* Tên case người dùng tự đặt, và mối nối sang case trước khi vấn đề tái phát. */
  if (addCol('sos_cases', 'title', 'TEXT')) added += 1;
  /* Người phụ trách chính của case — tách khỏi người ghi nhận và người thực hiện. */
  if (addCol('sos_cases', 'owner_user_id', 'INTEGER REFERENCES users(id)')) added += 1;
  if (addCol('sos_cases', 'previous_case_id', 'INTEGER REFERENCES sos_cases(id)')) added += 1;

  /* Chu kỳ xử lý nằm TRONG phương án — không có màn quản lý chu kỳ riêng. */
  if (addCol('case_interventions', 'cycle_no', 'INTEGER NOT NULL DEFAULT 1')) added += 1;
  if (addCol('case_interventions', 'cycle_started_on', 'TEXT')) added += 1;
  if (addCol('case_interventions', 'closed_reason', 'TEXT')) added += 1;
  if (addCol('case_interventions', 'superseded_by', 'INTEGER REFERENCES case_interventions(id)')) added += 1;

  /* Mỗi lần cập nhật kết quả ghi luôn bước tiếp theo, hạn của chính chu kỳ đó và có trễ không. */
  if (addCol('case_followups', 'next_step', 'TEXT')) added += 1;
  if (addCol('case_followups', 'cycle_no', 'INTEGER')) added += 1;
  if (addCol('case_followups', 'cycle_due', 'TEXT')) added += 1;
  if (addCol('case_followups', 'late', 'INTEGER NOT NULL DEFAULT 0')) added += 1;
  /* Điểm giáo viên tự chấm — lưu riêng, không đụng vào điểm chính thức. */
  if (addCol('case_followups', 'metrics', 'TEXT')) added += 1;

  /* Lớp nối tiếp: lớp BE mở ra từ lớp FOU nào. */
  if (addCol('classes', 'previous_class_id', 'INTEGER REFERENCES classes(id)')) added += 1;

  if (added) applied.push(`Bổ sung ${added} cột cho workflow case theo chu kỳ hai tuần`);

  /*
   * MỐC BẮT ĐẦU CHU KỲ cho phương án cũ: lấy ngày đã bắt đầu, hoặc ngày tạo. Chỉ điền vào
   * chỗ còn trống, nên chạy lại không ghi đè cái đã có.
   */
  if (has('case_interventions') && cols('case_interventions').includes('cycle_started_on')) {
    const filled = conn
      .prepare(
        `UPDATE case_interventions
            SET cycle_started_on = COALESCE(started_date, planned_date, DATE(created_at))
          WHERE cycle_started_on IS NULL
            AND COALESCE(started_date, planned_date, DATE(created_at)) IS NOT NULL`,
      )
      .run().changes;
    if (filled) applied.push(`Điền mốc bắt đầu chu kỳ cho ${filled} phương án cũ`);

    /* Phương án cũ đã hoàn thành thì lý do khép lại là "đã xong", không phải "bị thay thế". */
    const closed = conn
      .prepare(
        `UPDATE case_interventions SET closed_reason = 'done'
          WHERE closed_reason IS NULL AND status = 'completed'`,
      )
      .run().changes;
    if (closed) applied.push(`Ghi lý do khép lại cho ${closed} phương án đã hoàn thành trước đây`);
  }

  /*
   * LẦN CẬP NHẬT CŨ chưa có số chu kỳ: gán chu kỳ 1. Không suy ra bước tiếp theo — bước
   * tiếp theo là một QUYẾT ĐỊNH của người dùng, và đoán hộ thì lịch sử nói sai.
   */
  if (has('case_followups') && cols('case_followups').includes('cycle_no')) {
    const n = conn.prepare('UPDATE case_followups SET cycle_no = 1 WHERE cycle_no IS NULL').run().changes;
    if (n) applied.push(`Gán chu kỳ 1 cho ${n} lần cập nhật kết quả cũ`);
  }

  /*
   * NGƯỜI PHỤ TRÁCH của case cũ: lấy người THỰC HIỆN phương án đầu tiên, vì đó là người
   * thật sự đang làm. KHÔNG lấy người ghi nhận — rất nhiều case do Quản lý hoặc người nhập
   * hộ mở, và gán họ làm người phụ trách là ghi sai trách nhiệm cho cả trăm bản ghi.
   *
   * Không suy được thì để TRỐNG, và màn hình sẽ nói "chưa có người phụ trách" kèm đường
   * phân công — thà nói thật là chưa ai nhận còn hơn gán bừa một cái tên.
   */
  if (has('sos_cases') && cols('sos_cases').includes('owner_user_id')) {
    const n = conn
      .prepare(
        `UPDATE sos_cases SET owner_user_id = (
            SELECT iv.performer_user_id FROM case_interventions iv
             WHERE iv.case_id = sos_cases.id AND iv.performer_user_id IS NOT NULL
             ORDER BY iv.id LIMIT 1)
          WHERE owner_user_id IS NULL
            AND EXISTS (SELECT 1 FROM case_interventions iv
                         WHERE iv.case_id = sos_cases.id AND iv.performer_user_id IS NOT NULL)`,
      )
      .run().changes;
    if (n) applied.push(`Gán người phụ trách cho ${n} case cũ theo người thực hiện phương án đầu tiên`);
  }
}

/**
 * VÒNG 6 — BẢNG "TIẾN ĐỘ CÔNG VIỆC" (mục 8).
 *
 * Việc của Quản lý trước đây chỉ có tên, hạn và người nhận. Nay mỗi việc còn thuộc một
 * NHÓM, có thể có VIỆC CON một tầng, có người THEO DÕI, và mỗi lần cập nhật được ghi lại
 * thành một dòng lịch sử thay vì đè lên trạng thái cũ.
 *
 * Cơ sở dữ liệu dựng mới đã có sẵn từ `schema.sql`; hàm này chỉ vá cho cơ sở dữ liệu cũ.
 * Mọi bước đều kiểm tra trước nên chạy lại lần hai không đổi gì.
 */
function migrateMgmtTasks(conn: any, applied: string[]) {
  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  let added = 0;
  for (const [c, d] of [
    ['group_key', 'TEXT'],
    ['parent_task_id', 'INTEGER REFERENCES tasks(id)'],
    ['watcher_user_id', 'INTEGER REFERENCES users(id)'],
    ['stop_reason', 'TEXT'],
    ['review_on', 'TEXT'],
  ] as const) {
    if (!cols('tasks').includes(c)) {
      conn.exec(`ALTER TABLE tasks ADD COLUMN ${c} ${d}`);
      added++;
    }
  }
  if (added) applied.push(`Bổ sung ${added} cột cho bảng Tiến độ công việc`);

  conn.exec(`
    CREATE TABLE IF NOT EXISTS task_updates (
      id INTEGER PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      period_id INTEGER REFERENCES periods(id),
      progress TEXT NOT NULL,
      note TEXT,
      actor_user_id INTEGER REFERENCES users(id),
      updated_on TEXT NOT NULL,
      created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_task_updates_task ON task_updates(task_id);
    CREATE TABLE IF NOT EXISTS task_case_links (
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      case_id INTEGER NOT NULL REFERENCES sos_cases(id),
      created_at TEXT NOT NULL,
      PRIMARY KEY (task_id, case_id));
    CREATE INDEX IF NOT EXISTS idx_task_parent ON tasks(parent_task_id);
  `);

  /*
   * VIỆC CŨ CHƯA CÓ NHÓM: xếp vào "Học sinh / Phụ huynh" nếu việc đó có gắn học viên, còn
   * lại để TRỐNG. Không đoán bừa nhóm cho việc không có dấu hiệu nào — bảng lọc theo nhóm
   * mà nhóm sai thì người dùng tìm mãi không thấy việc của mình.
   */
  const n = conn
    .prepare(
      `UPDATE tasks SET group_key = 'student_parent'
        WHERE group_key IS NULL
          AND EXISTS (SELECT 1 FROM task_students ts WHERE ts.task_id = tasks.id)`,
    )
    .run().changes;
  if (n) applied.push(`Xếp ${n} việc cũ có gắn học viên vào nhóm Học sinh / Phụ huynh`);
}


/**
 * BỎ VAI TRÒ "ADMIN CHI NHÁNH" mà không đánh mất ai.
 *
 * Ba việc, theo đúng thứ tự đó:
 *
 *   1. Đánh dấu vai trò là ĐÃ BỎ chứ không xoá dòng. `user_roles` và nhật ký cũ còn trỏ
 *      vào nó; xoá đi thì lịch sử "ai đã làm gì" gãy ngay.
 *   2. Thu hồi các dòng phân quyền đang hiệu lực của vai đó, vì từ nay nó không cho phép
 *      làm gì nữa. Ghi mỗi lần thu hồi vào nhật ký, kèm TÊN người, để còn tra được.
 *   3. Người nào sau bước 2 KHÔNG CÒN VAI NÀO thì tài khoản vẫn giữ nguyên, chỉ chuyển
 *      sang trạng thái chờ phân công. Owner chốt rõ: không tự biến Admin cũ thành Quản lý
 *      toàn hệ thống, mà nêu tên ra để người có thẩm quyền quyết.
 */
function migrateDropBranchAdmin(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('roles') || !has('user_roles')) return;

  const cols = (t: string) => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  if (!cols('roles').includes('status')) {
    conn.exec("ALTER TABLE roles ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }

  const role = conn.prepare("SELECT id FROM roles WHERE key = 'branch_admin'").get() as any;
  if (!role) return;

  const already = conn.prepare("SELECT status FROM roles WHERE id = ?").get(role.id) as any;
  if (already?.status === 'retired') return;

  conn.prepare("UPDATE roles SET status = 'retired' WHERE id = ?").run(role.id);

  /* Quyền của vai đã bỏ không còn hiệu lực. Bảng role_permissions không có cột trạng thái
     nên ở đây xoá đúng các dòng nối vai–quyền; bản thân vai và quyền vẫn còn để đọc. */
  const perms = has('role_permissions')
    ? conn.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(role.id).changes
    : 0;

  const grants = conn
    .prepare(
      `SELECT ur.id, ur.user_id, u.full_name, b.name AS branch
         FROM user_roles ur
         JOIN users u ON u.id = ur.user_id
    LEFT JOIN branches b ON b.id = ur.branch_id
        WHERE ur.role_id = ? AND ur.status = 'active'`,
    )
    .all(role.id) as any[];

  for (const g of grants) {
    conn.prepare("UPDATE user_roles SET status = 'retired' WHERE id = ?").run(g.id);
    conn
      .prepare(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label,
                                 before_json, after_json, created_at)
         VALUES (NULL, 'role.retired', 'user', ?, ?, ?, ?, ?)`,
      )
      .run(
        g.user_id,
        g.full_name,
        JSON.stringify({ role: 'branch_admin', branch: g.branch ?? null, status: 'active' }),
        JSON.stringify({ role: 'branch_admin', branch: g.branch ?? null, status: 'retired',
                         reason: 'Vai trò Admin chi nhánh đã bỏ sau PR15' }),
        nowIso(),
      );
  }

  const orphans = conn
    .prepare(
      `SELECT u.full_name FROM users u
        WHERE u.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.status = 'active')
          AND EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = ?)`,
    )
    .all(role.id) as any[];

  applied.push(
    `Bỏ vai trò Admin chi nhánh: thu hồi ${grants.length} phân quyền, gỡ ${perms} dòng quyền của vai đó`,
  );
  if (orphans.length) {
    applied.push(
      `CẦN PHÂN CÔNG LẠI — ${orphans.length} tài khoản không còn vai trò nào: ` +
        orphans.map((o: any) => o.full_name).join(', '),
    );
  }
}

/**
 * GHI DẤU VIỆC NÂNG NGƯỠNG ĐẠT CỦA LỚP NORMAL TỪ 60% LÊN 70%.
 *
 * Kết quả đạt/trượt của lớp Normal được TÍNH RA từ `điểm đạt / tổng điểm` mỗi lần đọc,
 * không lưu sẵn trong database. Nên bước nâng cấp này KHÔNG sửa một dòng dữ liệu nào:
 * điểm gốc giữ nguyên, kết luận đã ghi tay giữ nguyên, và không có khoản quá hạn nào
 * được sinh ngược về quá khứ.
 *
 * Việc duy nhất cần làm là ghi lại MỐC ĐỔI LUẬT. Một bài 62% hôm qua đọc là "đạt", hôm
 * nay đọc là "trượt"; ai đối chiếu với biên bản cũ phải tra ra được vì sao hai bên lệch.
 */
function migrateNormalPassThreshold(conn: any, applied: string[]) {
  const has = (t: string) =>
    !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  if (!has('demo_config')) return;

  const key = 'normal_pass_threshold';
  const current = conn.prepare('SELECT value FROM demo_config WHERE key = ?').get(key) as any;
  if (current?.value === '0.7') return;

  const from = current?.value ?? '0.6';
  conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)')
    .run(key, '0.7', nowIso());

  if (has('audit_logs')) {
    conn
      .prepare(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label,
                                 before_json, after_json, created_at)
         VALUES (NULL, 'rule.changed', 'scoring', NULL, 'Ngưỡng đạt lớp Normal', ?, ?, ?)`,
      )
      .run(
        JSON.stringify({ passThreshold: Number(from) }),
        JSON.stringify({ passThreshold: 0.7, note: 'Owner nâng ngưỡng đạt lớp Normal sau PR15' }),
        nowIso(),
      );
  }

  applied.push(
    `Ngưỡng đạt lớp Normal: ${Math.round(Number(from) * 100)}% → 70%. ` +
      'Không sửa điểm gốc, không xoá kết luận cũ, không sinh nợ quá hạn ngược về quá khứ.',
  );
}
