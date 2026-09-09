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
    return { applied, skipped: ['Database đã ở schema mới, không cần nâng cấp.'] };
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
  return { applied, skipped };
}
