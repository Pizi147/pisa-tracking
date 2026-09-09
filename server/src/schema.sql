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
  student_code TEXT NOT NULL UNIQUE,  -- ID ổn định, giữ nguyên khi chuyển lớp hoặc học lại
  full_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  dob TEXT,
  branch_id INTEGER REFERENCES branches(id),
  -- Chỉ ba trạng thái: active đang học | inactive tạm dừng | finished dừng hẳn.
  -- LT1/LT2 là lộ trình, KHÔNG phải trạng thái học viên.
  status TEXT NOT NULL DEFAULT 'active',
  finished_at TEXT,                   -- mốc tính thời điểm đưa vào lưu trữ
  archived_at TEXT,                   -- lưu trữ là cách ẩn khỏi danh sách, không phải trạng thái thứ tư
  consultant_name TEXT,               -- metadata hồ sơ, KHÔNG phải một vai trò tài khoản
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_student_name ON students(normalized_name);

-- Lộ trình học. Mỗi lộ trình có TARGET và ngày thi IELTS riêng.
-- Học tiếp/học lại trong cùng lộ trình: số MT tăng tiếp, target giữ nguyên.
-- Sang lộ trình mới (LT1 -> LT2): đánh số MT lại từ 1 vì đã có target mới.
CREATE TABLE learning_cycles (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  seq INTEGER NOT NULL,               -- thứ tự lộ trình của học viên: 1, 2, ...
  route TEXT,                         -- LT1 | LT2 với FT; NULL với lớp thường
  target_score REAL,                  -- điểm cam kết của CHÍNH lộ trình này
  exam_date TEXT,                     -- ngày thi IELTS chính thức của lộ trình này
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',   -- active | completed | abandoned
  note TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (student_id, seq)
);
CREATE INDEX idx_cycle_student ON learning_cycles(student_id);

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

-- ===================== LƯỢT ĐÁNH GIÁ (MOCK TEST) =====================
-- Định danh = học viên + LỘ TRÌNH + lần thứ mấy trong lộ trình đó.
-- Không dùng từ "thi" cho Mock; "thi" chỉ dành cho kỳ IELTS chính thức.
CREATE TABLE assessment_attempts (
  id INTEGER PRIMARY KEY,
  cycle_id INTEGER NOT NULL REFERENCES learning_cycles(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  attempt_no INTEGER NOT NULL,        -- MT1, MT2, ... trong CHÍNH lộ trình này
  kind TEXT NOT NULL DEFAULT 'mock',  -- mock (FT); progress | final dành cho lớp thường
  class_id INTEGER REFERENCES classes(id),        -- lớp tại thời điểm đánh giá

  -- TUẦN KẾ HOẠCH do Quản lý chốt. Đây là tuần kết quả dùng cho mọi báo cáo và
  -- tổng hợp, nên một lượt chỉ thuộc đúng một tuần dù các kỹ năng mock lệch tuần.
  -- Có thể đã có tuần mà chưa có ngày; KHÔNG tự điền thứ Hai làm ngày mock giả.
  planned_period_id INTEGER REFERENCES report_periods(id),

  -- NGÀY–GIỜ cụ thể do Admin chi nhánh chốt trong tuần đã duyệt.
  -- LRW đi chung một buổi; Speaking có thể khác ngày nhưng vẫn cùng lượt MT này.
  lrw_scheduled_at TEXT,              -- 'YYYY-MM-DD' hoặc 'YYYY-MM-DD HH:MM'
  speaking_scheduled_at TEXT,

  status TEXT NOT NULL DEFAULT 'planned',         -- planned | done | cancelled
  cancel_reason TEXT,
  cancelled_at TEXT,
  target_at_attempt REAL,             -- target chốt tại lượt này, đổi hồ sơ không viết lại lịch sử

  -- Hạn nhập điểm riêng, ghi đè hạn mặc định (thứ Tư tuần kế tiếp).
  deadline_override TEXT,
  deadline_override_by INTEGER REFERENCES users(id),
  deadline_override_at TEXT,
  deadline_override_reason TEXT,

  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE (cycle_id, attempt_no)
);
CREATE INDEX idx_attempt_student ON assessment_attempts(student_id);
CREATE INDEX idx_attempt_period ON assessment_attempts(planned_period_id);
CREATE INDEX idx_attempt_class ON assessment_attempts(class_id);

CREATE TABLE attempt_schedule_history (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
  action TEXT NOT NULL,               -- created | week_set | lrw_set | speaking_set | cancelled | reopened | skill_skipped | skill_restored | deadline_set | deadline_cleared
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_ash_attempt ON attempt_schedule_history(attempt_id);

-- Mặc định MỌI kỹ năng đánh giá đều bắt buộc. Bảng này chỉ ghi NGOẠI LỆ:
-- khi thực tế học viên không mock một kỹ năng, Quản lý/Admin CN đánh dấu ở đây và
-- SOS được tính trên các kỹ năng còn lại. Không có dòng nào = phải chờ đủ bốn kỹ năng.
-- Skill ở đây là kỹ năng ĐÁNH GIÁ (writing là một môn, không tách W1/W2).
CREATE TABLE attempt_skill_skips (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
  skill TEXT NOT NULL,                -- listening | reading | writing | speaking
  reason TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE (attempt_id, skill)
);

-- Mỗi kỹ năng NHẬP ĐIỂM một dòng, có ngày mock thực tế riêng.
-- Có dòng với taken_on mà chưa có band = ĐÃ MOCK, CHƯA NHẬP ĐIỂM.
CREATE TABLE assessment_scores (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
  skill TEXT NOT NULL,                -- listening | reading | writing1 | writing2 | speaking
  taken_on TEXT,                      -- ngày MOCK thực tế của riêng kỹ năng này
  raw_score INTEGER,                  -- 0..40, chỉ với listening/reading
  raw_total INTEGER,                  -- tổng số câu, dành cho lớp thường (score/total)
  c1 REAL, c2 REAL, c3 REAL, c4 REAL, -- bốn tiêu chí, chỉ với writing1/writing2/speaking
  band REAL,                          -- band IELTS, hoặc NULL khi chưa nhập điểm
  result_date TEXT,                   -- ngày có kết quả, để đo thời gian chấm
  entered_by INTEGER REFERENCES users(id),
  entered_at TEXT,
  note TEXT,
  UNIQUE (attempt_id, skill)
);
CREATE INDEX idx_score_attempt ON assessment_scores(attempt_id);

-- Ước lượng của giáo viên. Tách hoàn toàn khỏi điểm chính thức, chỉ ghi thêm dòng mới
-- nên có sẵn lịch sử. Không bao giờ ghi đè điểm Mock.
CREATE TABLE teacher_estimates (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  cycle_id INTEGER REFERENCES learning_cycles(id),
  skill TEXT NOT NULL,                -- entry skill: listening | reading | writing1 | writing2 | speaking
  band REAL NOT NULL,
  assessed_on TEXT NOT NULL,          -- NGÀY đánh giá, khác ngày nhập vào hệ thống
  assessed_by INTEGER REFERENCES users(id),
  class_id INTEGER REFERENCES classes(id),
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_estimate_student ON teacher_estimates(student_id, skill);

-- ===================== CASE SOS =====================
CREATE TABLE sos_cases (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id) UNIQUE,
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
