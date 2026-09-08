PRAGMA foreign_keys = ON;

-- ===================== TỔ CHỨC =====================
CREATE TABLE branches (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,          -- MB, BC, CP, HD, UB
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

-- Đơn vị báo cáo cho họp tuần. Tutor part-time là đơn vị riêng, KHÔNG phải chi nhánh thứ sáu.
CREATE TABLE reporting_units (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  branch_id INTEGER REFERENCES branches(id),   -- NULL với đơn vị độc lập
  kind TEXT NOT NULL,                          -- branch | department
  seq INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE classes (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,          -- luôn bắt đầu bằng mã chi nhánh: "CP-FT 110"
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  kind TEXT NOT NULL,                 -- nhãn tự do do quản lý đặt: FT, FOUND, BE, ELE...
  route TEXT,                         -- LT1 | LT2, chỉ áp dụng lớp FT
  is_fulltime INTEGER NOT NULL DEFAULT 0,
  start_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_class_branch ON classes(branch_id);

-- Kỹ năng lớp có học và số buổi chính mỗi tuần. Quản lý cấu hình, không suy từ tên lớp.
CREATE TABLE class_skills (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  skill TEXT NOT NULL,
  sessions_per_week INTEGER NOT NULL DEFAULT 1,
  UNIQUE (class_id, skill)
);

-- ===================== NGƯỜI DÙNG & QUYỀN =====================
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL
);

CREATE TABLE permissions (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL
);

CREATE TABLE role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id),
  permission_id INTEGER NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- Mỗi grant giữ phạm vi riêng: quyền của role này không dùng được ở phạm vi của role khác.
CREATE TABLE user_roles (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  branch_id INTEGER REFERENCES branches(id),   -- NULL = toàn hệ thống
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- GVCN: is_core = 1. GVBM: skill != NULL. Một người có thể có cả hai dòng ở cùng lớp.
CREATE TABLE teacher_assignments (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  skill TEXT,
  is_core INTEGER NOT NULL DEFAULT 0,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_ta_user ON teacher_assignments(user_id);
CREATE INDEX idx_ta_class ON teacher_assignments(class_id);

-- ===================== HỌC VIÊN =====================
CREATE TABLE student_code_seq (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  next_value INTEGER NOT NULL
);

CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  student_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  dob TEXT,
  committed_score REAL,               -- điểm cam kết, gốc để tính kỳ vọng
  route TEXT,                         -- LT1 | LT2
  exam_date TEXT,
  branch_id INTEGER REFERENCES branches(id),
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_student_name ON students(normalized_name);

-- Lịch sử lớp. Chuyển lớp mở dòng mới, không ghi đè.
CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  status TEXT NOT NULL DEFAULT 'active',   -- active | paused | transferred | completed | withdrawn
  started_at TEXT NOT NULL,
  ended_at TEXT,
  end_reason TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_enr_student ON enrollments(student_id);
CREATE INDEX idx_enr_class ON enrollments(class_id);

CREATE TABLE journey_events (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  ref_table TEXT,
  ref_id INTEGER,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_journey_student ON journey_events(student_id);

-- ===================== KỲ / TUẦN =====================
-- Tuần thứ Hai–Chủ nhật. Tháng của tuần là tháng chứa thứ Năm. Mã dạng "W1 SEP".
CREATE TABLE report_periods (
  id INTEGER PRIMARY KEY,
  week_start TEXT NOT NULL UNIQUE,    -- khoá thật, kèm năm
  week_end TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  week_no INTEGER NOT NULL,
  code TEXT NOT NULL,                 -- "W1 SEP" — chỉ là nhãn hiển thị
  created_at TEXT NOT NULL
);
CREATE INDEX idx_period_code ON report_periods(year, month, week_no);

-- ===================== MOCK TEST =====================
CREATE TABLE mock_attempts (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  attempt_no INTEGER NOT NULL,        -- 1..5, tương ứng MT1..MT5
  class_id INTEGER REFERENCES classes(id),        -- lớp tại thời điểm thi
  planned_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',         -- planned | completed | cancelled
  cancel_reason TEXT,
  cancelled_at TEXT,
  committed_score_at_test REAL,       -- chốt tại lần thi, đổi hồ sơ sau này không viết lại lịch sử
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE (student_id, attempt_no)
);
CREATE INDEX idx_mock_student ON mock_attempts(student_id);
CREATE INDEX idx_mock_planned ON mock_attempts(planned_date);

CREATE TABLE mock_schedule_history (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES mock_attempts(id),
  action TEXT NOT NULL,               -- created | rescheduled | cancelled | reopened
  old_date TEXT,
  new_date TEXT,
  reason TEXT,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_msh_attempt ON mock_schedule_history(attempt_id);

-- Mỗi kỹ năng có NGÀY THI RIÊNG: học sinh có thể thi Speaking tuần này, ba kỹ năng còn lại tuần sau.
CREATE TABLE mock_scores (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES mock_attempts(id),
  skill TEXT NOT NULL,                -- listening | reading | writing1 | writing2 | speaking
  test_date TEXT,                     -- ngày thi thực tế của riêng kỹ năng này
  raw_score INTEGER,                  -- 0..40, chỉ với listening/reading
  c1 REAL, c2 REAL, c3 REAL, c4 REAL, -- bốn tiêu chí, chỉ với writing1/writing2/speaking
  band REAL,                          -- tính từ raw_score hoặc bốn tiêu chí
  result_date TEXT,                   -- ngày có kết quả, để đo thời gian trả điểm
  entered_by INTEGER REFERENCES users(id),
  entered_at TEXT,
  note TEXT,
  UNIQUE (attempt_id, skill)
);
CREATE INDEX idx_score_attempt ON mock_scores(attempt_id);

-- ===================== CASE SOS =====================
CREATE TABLE sos_cases (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES mock_attempts(id) UNIQUE,
  sos_level INTEGER NOT NULL,         -- 1..3
  coordinator_user_id INTEGER REFERENCES users(id),   -- người điều phối case

  talk_student_person TEXT,
  talk_student_date TEXT,
  talk_parent_person TEXT,            -- CS làm ngoài hệ thống: ghi tên, không cần tài khoản
  talk_parent_date TEXT,

  academic_support TEXT,
  academic_person TEXT,
  academic_start_date TEXT,

  ops_policy TEXT,
  ops_date TEXT,

  meeting_kind TEXT,
  meeting_date TEXT,

  status TEXT NOT NULL DEFAULT 'open',    -- open | in_progress | done
  head_confirmed_by INTEGER REFERENCES users(id),
  head_confirmed_at TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE sos_case_history (
  id INTEGER PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES sos_cases(id),
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- ===================== HỌP TUẦN =====================
CREATE TABLE unit_reports (
  id INTEGER PRIMARY KEY,
  reporting_unit_id INTEGER NOT NULL REFERENCES reporting_units(id),
  period_id INTEGER NOT NULL REFERENCES report_periods(id),
  category_key TEXT NOT NULL,
  category_label TEXT NOT NULL,       -- snapshot nhãn tại thời điểm ghi
  status TEXT,                        -- NULL = chưa báo cáo, KHÁC với "Ổn"
  note TEXT,
  reporter_user_id INTEGER REFERENCES users(id),
  updated_at TEXT,
  UNIQUE (reporting_unit_id, period_id, category_key)
);
CREATE INDEX idx_ur_period ON unit_reports(period_id);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  period_id INTEGER REFERENCES report_periods(id),      -- kỳ tạo ra việc
  task_type TEXT NOT NULL DEFAULT 'in_period',          -- in_period | long_term
  title TEXT NOT NULL,
  reporting_unit_id INTEGER REFERENCES reporting_units(id),
  branch_id INTEGER REFERENCES branches(id),
  assignee_user_id INTEGER REFERENCES users(id),
  due_date TEXT,
  progress TEXT NOT NULL DEFAULT 'not_started',
  note TEXT,
  source_type TEXT,                   -- manual | unit_report | sos_case
  source_unit_report_id INTEGER REFERENCES unit_reports(id),
  source_sos_case_id INTEGER REFERENCES sos_cases(id),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  completed_at TEXT
);
CREATE INDEX idx_task_period ON tasks(period_id);
CREATE INDEX idx_task_assignee ON tasks(assignee_user_id);

CREATE TABLE task_history (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- ===================== HỖ TRỢ =====================
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id INTEGER,
  dedup_key TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, dedup_key)
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  entity_label TEXT,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

CREATE TABLE demo_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE demo_sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  last_seen_at TEXT
);
