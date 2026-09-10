import { db, isInitialised } from './db.ts';
import { nowIso } from './util.ts';

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
      CREATE TABLE IF NOT EXISTS skill_checkins (
        id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, cycle_id INTEGER, class_id INTEGER,
        skill TEXT NOT NULL, observed_on TEXT NOT NULL, author_user_id INTEGER,
        judgement TEXT, strengths TEXT, weaknesses TEXT,
        band REAL, raw_score INTEGER, raw_total INTEGER, c1 REAL, c2 REAL, c3 REAL, c4 REAL,
        estimate_basis TEXT, created_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_case_student ON sos_cases(student_id, status);
      CREATE INDEX IF NOT EXISTS idx_case_issue_case ON case_issues(case_id);
      CREATE INDEX IF NOT EXISTS idx_intervention_case ON case_interventions(case_id);
      CREATE INDEX IF NOT EXISTS idx_followup_case ON case_followups(case_id);
      CREATE INDEX IF NOT EXISTS idx_checkin_student ON skill_checkins(student_id, skill, observed_on);
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
      { field: 'talk_student', kind: 'talk_student', dateCol: 'talk_student_date', personCol: 'talk_student_person', status: 'completed', label: 'Trao đổi với học sinh' },
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
     * 5. Case đã đóng theo hệ thống cũ mà không có hướng xử lý: ghi rõ là "đóng theo hệ
     *    thống cũ", KHÔNG bịa ra một kết luận và cũng không mở lại hàng loạt.
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

    /*
     * 6. Đánh giá GV cũ thành ghi nhận nhanh, GIỮ NGUYÊN bảng cũ.
     *    Lộ trình không chứng minh được thì để trống, không gán vào lộ trình hiện tại.
     */
    if (has('teacher_estimates')) {
      const moved2 = conn
        .prepare(
          `INSERT INTO skill_checkins (student_id, cycle_id, class_id, skill, observed_on, author_user_id,
                                       band, raw_score, c1, c2, c3, c4, estimate_basis, created_at)
           SELECT e.student_id, e.cycle_id, e.class_id, e.skill, e.assessed_on, e.assessed_by,
                  e.band, e.raw_score, e.c1, e.c2, e.c3, e.c4,
                  CASE WHEN e.raw_score IS NOT NULL THEN 'raw'
                       WHEN e.c1 IS NOT NULL THEN 'criteria' ELSE 'judgement' END,
                  e.created_at
             FROM teacher_estimates e
            WHERE NOT EXISTS (
              SELECT 1 FROM skill_checkins k
               WHERE k.student_id = e.student_id AND k.skill = e.skill
                 AND k.observed_on = e.assessed_on AND k.author_user_id IS e.assessed_by)`,
        )
        .run();
      if (moved2.changes) applied.push(`Chuyển ${moved2.changes} đánh giá GV cũ thành ghi nhận nhanh`);
    }

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

  /* Vấn đề về giáo viên và giáo trình rời khỏi hệ thống theo dõi học sinh (owner chốt). */
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

  const untagged = (conn.prepare('SELECT COUNT(*) n FROM sos_cases WHERE topic IS NULL').get() as any).n;
  if (untagged) {
    applied.push(`${untagged} vấn đề cũ để trống kỹ năng — không suy được từ dữ liệu, giao diện ghi rõ`);
  }
}
