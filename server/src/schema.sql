PRAGMA foreign_keys = ON;

-- ===================== IDENTITY =====================
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',      -- active | inactive | archived
  archived_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL,
  description TEXT
);

CREATE TABLE permissions (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL,
  group_key TEXT NOT NULL
);

CREATE TABLE role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id),
  permission_id INTEGER NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- Mỗi grant giữ scope riêng của nó. Không bao giờ ghép permission role này với scope role khác.
CREATE TABLE user_role_grants (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  scope_type TEXT NOT NULL,       -- global|branch|reporting_unit|assignment|consultant_caseload|consultant_team
  scope_id INTEGER,               -- branch_id / reporting_unit_id, NULL cho scope suy ra từ assignment
  label TEXT,
  effective_from TEXT,
  effective_to TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_grants_user ON user_role_grants(user_id);

-- GVBM: skill != NULL. GVCN: is_core = 1 (có thể kèm skill riêng ở dòng khác).
CREATE TABLE teacher_assignments (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  skill TEXT,
  is_core INTEGER NOT NULL DEFAULT 0,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_ta_user ON teacher_assignments(user_id);
CREATE INDEX idx_ta_class ON teacher_assignments(class_id);

CREATE TABLE consultant_assignments (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_ca_user ON consultant_assignments(user_id);
CREATE INDEX idx_ca_student ON consultant_assignments(student_id);

CREATE TABLE consultant_team_members (
  id INTEGER PRIMARY KEY,
  manager_user_id INTEGER NOT NULL REFERENCES users(id),
  consultant_user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE (manager_user_id, consultant_user_id)
);

-- ===================== ORGANIZATION =====================
CREATE TABLE branches (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',   -- active | inactive | archived
  archived_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE reporting_units (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  branch_id INTEGER REFERENCES branches(id),  -- NULL = đơn vị báo cáo độc lập
  kind TEXT NOT NULL DEFAULT 'branch',        -- branch | department
  status TEXT NOT NULL DEFAULT 'active',
  archived_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE class_types (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,                  -- FT | NORMAL
  status TEXT NOT NULL DEFAULT 'active',
  archived_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE classes (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  class_type_id INTEGER NOT NULL REFERENCES class_types(id),
  template_version_id INTEGER REFERENCES course_template_versions(id),
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_class_branch ON classes(branch_id);

-- Số buổi chính kỳ vọng theo skill, cấu hình ở cấp lớp (không suy từ tên lớp).
CREATE TABLE class_skill_config (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  skill TEXT NOT NULL,
  expected_main_sessions_per_week INTEGER NOT NULL,
  UNIQUE (class_id, skill)
);

-- ===================== CURRICULUM =====================
CREATE TABLE course_templates (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,                 -- FT | NORMAL
  status TEXT NOT NULL DEFAULT 'active',
  archived_at TEXT,
  created_at TEXT NOT NULL
);

-- Bất biến sau khi published: mọi thay đổi tạo version mới.
CREATE TABLE course_template_versions (
  id INTEGER PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES course_templates(id),
  version_no INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | published | archived
  notes TEXT,
  published_at TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE (template_id, version_no)
);

CREATE TABLE template_stages (
  id INTEGER PRIMARY KEY,
  template_version_id INTEGER NOT NULL REFERENCES course_template_versions(id),
  stage_key TEXT NOT NULL,
  seq INTEGER NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,                     -- stage | milestone | checkpoint | week
  week_from INTEGER,
  week_to INTEGER,
  due_offset_days INTEGER,                -- NULL = không có hạn -> không tự đánh giá chậm
  description TEXT,
  UNIQUE (template_version_id, stage_key)
);

-- Override chỉ ảnh hưởng đúng lớp được chọn.
CREATE TABLE class_stage_overrides (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  stage_key TEXT NOT NULL,
  action TEXT NOT NULL,                   -- modify | add | remove
  name TEXT,
  seq INTEGER,
  kind TEXT,
  week_from INTEGER,
  week_to INTEGER,
  due_offset_days INTEGER,
  clear_due INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  reason TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE (class_id, stage_key)
);

CREATE TABLE class_stage_progress (
  id INTEGER PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  stage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',  -- not_started | in_progress | done
  actual_date TEXT,
  note TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT,
  UNIQUE (class_id, stage_key)
);

-- ===================== STUDENT =====================
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
  target_band REAL,
  exam_date TEXT,
  branch_id INTEGER REFERENCES branches(id),
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_student_name ON students(normalized_name);
CREATE INDEX idx_student_branch ON students(branch_id);

CREATE TABLE enrollments (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  status TEXT NOT NULL DEFAULT 'active',
  attempt_no INTEGER NOT NULL DEFAULT 1,
  enrolled_at TEXT NOT NULL,
  starts_at TEXT,
  ended_at TEXT,
  end_reason TEXT,
  transferred_from_enrollment_id INTEGER REFERENCES enrollments(id),
  transferred_to_enrollment_id INTEGER REFERENCES enrollments(id),
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_enr_student ON enrollments(student_id);
CREATE INDEX idx_enr_class ON enrollments(class_id);

CREATE TABLE enrollment_skills (
  id INTEGER PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
  skill TEXT NOT NULL,
  registered INTEGER NOT NULL DEFAULT 1,      -- 0 = không áp dụng cho học viên này
  expected_main_sessions_per_week INTEGER,    -- NULL = lấy theo cấu hình lớp
  UNIQUE (enrollment_id, skill)
);

CREATE TABLE journey_events (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  enrollment_id INTEGER REFERENCES enrollments(id),
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  ref_table TEXT,
  ref_id INTEGER,
  visibility TEXT NOT NULL DEFAULT 'shared',  -- shared | internal
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_journey_student ON journey_events(student_id);

-- ===================== LEARNING =====================
CREATE TABLE weekly_learning_records (
  id INTEGER PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  skill TEXT NOT NULL,
  week_start TEXT NOT NULL,                   -- thứ Hai, YYYY-MM-DD
  applicable INTEGER NOT NULL DEFAULT 1,      -- 0 = học viên không đăng ký skill này
  expected_main_sessions INTEGER,
  expected_source TEXT NOT NULL DEFAULT 'class',   -- class | enrollment | manual
  attended_main_sessions INTEGER,             -- NULL = chưa nhập (khác 0)
  supplemental_sessions INTEGER,
  homework_assigned INTEGER,
  homework_completed INTEGER,
  attendance_source TEXT NOT NULL DEFAULT 'aggregate',  -- aggregate | detail
  homework_source TEXT NOT NULL DEFAULT 'aggregate',
  note_short TEXT,
  rev INTEGER NOT NULL DEFAULT 0,
  last_client_seq INTEGER NOT NULL DEFAULT 0,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (enrollment_id, skill, week_start)
);
CREATE INDEX idx_wlr_class_week ON weekly_learning_records(class_id, week_start);
CREATE INDEX idx_wlr_student ON weekly_learning_records(student_id);

CREATE TABLE attendance_records (
  id INTEGER PRIMARY KEY,
  weekly_record_id INTEGER NOT NULL REFERENCES weekly_learning_records(id),
  session_date TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_att_wlr ON attendance_records(weekly_record_id);

CREATE TABLE homework_assignments (
  id INTEGER PRIMARY KEY,
  weekly_record_id INTEGER NOT NULL REFERENCES weekly_learning_records(id),
  title TEXT NOT NULL,
  assigned_date TEXT,
  due_date TEXT,
  status TEXT NOT NULL,                     -- completed | incomplete | missing | late
  completed INTEGER NOT NULL DEFAULT 0,     -- cờ hoàn thành độc lập với 'late'
  submitted_at TEXT,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_hw_wlr ON homework_assignments(weekly_record_id);

-- Buổi bổ trợ / học ghép / tutor / 1-1
CREATE TABLE learning_activities (
  id INTEGER PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
  weekly_record_id INTEGER REFERENCES weekly_learning_records(id),
  skill TEXT NOT NULL,
  activity_date TEXT NOT NULL,
  sessions INTEGER NOT NULL DEFAULT 1,
  kind TEXT NOT NULL,                        -- joint_class | tutor | one_to_one
  class_id INTEGER REFERENCES classes(id),
  teacher_user_id INTEGER REFERENCES users(id),
  teacher_name_text TEXT,                    -- tên ghi tay: KHÔNG cấp quyền
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_act_enr ON learning_activities(enrollment_id);

CREATE TABLE assessments (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  enrollment_id INTEGER REFERENCES enrollments(id),
  test_type TEXT NOT NULL,                   -- entrance | mock | progress | final
  scale TEXT NOT NULL,                       -- ielts | score10 | score100
  test_date TEXT NOT NULL,
  title TEXT,
  note TEXT,
  entered_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_assess_student ON assessments(student_id);

CREATE TABLE assessment_scores (
  id INTEGER PRIMARY KEY,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id),
  skill TEXT NOT NULL,                       -- listening|reading|writing|speaking|overall
  score REAL,
  UNIQUE (assessment_id, skill)
);

CREATE TABLE teacher_estimates (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id),
  teaching_skill TEXT NOT NULL,              -- skill giảng dạy, gồm writing1/writing2
  band REAL NOT NULL,
  week_start TEXT,
  estimate_date TEXT NOT NULL,
  teacher_user_id INTEGER REFERENCES users(id),
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_est_student ON teacher_estimates(student_id);

CREATE TABLE teacher_notes (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  enrollment_id INTEGER REFERENCES enrollments(id),
  class_id INTEGER REFERENCES classes(id),
  skill TEXT,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'internal',  -- internal | shared
  author_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_note_student ON teacher_notes(student_id);

CREATE TABLE student_progress_reports (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  enrollment_id INTEGER REFERENCES enrollments(id),
  report_period_id INTEGER REFERENCES report_periods(id),
  period_label TEXT NOT NULL,
  report_date TEXT NOT NULL,
  progress_summary TEXT,
  attitude_summary TEXT,
  next_steps TEXT,
  shared_summary TEXT,                        -- phần tư vấn viên được xem
  author_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX idx_spr_student ON student_progress_reports(student_id);

CREATE TABLE incident_references (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  incident_date TEXT NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,                            -- nội bộ, không lộ nguyên văn cho tư vấn
  status TEXT NOT NULL DEFAULT 'open',
  follow_up TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE warning_references (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  issued_date TEXT NOT NULL,
  level TEXT NOT NULL,                         -- reminder | warning | serious
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',         -- open | monitoring | closed
  follow_up TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_warn_student ON warning_references(student_id);

-- ===================== OPERATIONS =====================
CREATE TABLE report_periods (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);

CREATE TABLE report_category_defs (
  id INTEGER PRIMARY KEY,
  version INTEGER NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  seq INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE (version, key)
);

CREATE TABLE branch_reports (
  id INTEGER PRIMARY KEY,
  reporting_unit_id INTEGER NOT NULL REFERENCES reporting_units(id),
  report_period_id INTEGER NOT NULL REFERENCES report_periods(id),
  status TEXT NOT NULL DEFAULT 'draft',       -- draft | submitted
  category_version INTEGER NOT NULL,
  summary TEXT,
  submitted_at TEXT,
  author_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE (reporting_unit_id, report_period_id)
);

CREATE TABLE branch_report_categories (
  id INTEGER PRIMARY KEY,
  branch_report_id INTEGER NOT NULL REFERENCES branch_reports(id),
  category_key TEXT NOT NULL,
  category_label_snapshot TEXT NOT NULL,
  seq INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_reported',
  note TEXT,
  UNIQUE (branch_report_id, category_key)
);

CREATE TABLE meeting_periods (
  id INTEGER PRIMARY KEY,
  report_period_id INTEGER NOT NULL REFERENCES report_periods(id),
  label TEXT NOT NULL,
  meeting_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',     -- planned | done
  note TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (report_period_id)
);

CREATE TABLE meeting_agenda_items (
  id INTEGER PRIMARY KEY,
  meeting_period_id INTEGER NOT NULL REFERENCES meeting_periods(id),
  seq INTEGER NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE issues (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  scope_type TEXT NOT NULL,                   -- branch | class | student | system
  branch_id INTEGER REFERENCES branches(id),
  class_id INTEGER REFERENCES classes(id),
  student_id INTEGER REFERENCES students(id),
  reporting_unit_id INTEGER REFERENCES reporting_units(id),
  risk_level TEXT NOT NULL DEFAULT 'medium',
  owner_user_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'open',
  source_type TEXT,                           -- manual | branch_report | student | class
  source_branch_report_id INTEGER REFERENCES branch_reports(id),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  resolved_at TEXT
);

CREATE TABLE issue_notes (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  body TEXT NOT NULL,
  author_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE meeting_decisions (
  id INTEGER PRIMARY KEY,
  meeting_period_id INTEGER NOT NULL REFERENCES meeting_periods(id),
  issue_id INTEGER REFERENCES issues(id),
  decision TEXT NOT NULL,
  note TEXT,
  decided_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE issue_meeting_links (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues(id),
  meeting_period_id INTEGER NOT NULL REFERENCES meeting_periods(id),
  UNIQUE (issue_id, meeting_period_id)
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  detail TEXT,
  assignee_user_id INTEGER REFERENCES users(id),
  branch_id INTEGER REFERENCES branches(id),
  reporting_unit_id INTEGER REFERENCES reporting_units(id),
  scope_type TEXT NOT NULL DEFAULT 'branch',
  student_id INTEGER REFERENCES students(id),
  class_id INTEGER REFERENCES classes(id),
  issue_id INTEGER REFERENCES issues(id),
  source_type TEXT,                           -- manual | issue | meeting | branch_report
  source_meeting_period_id INTEGER REFERENCES meeting_periods(id),
  source_branch_report_id INTEGER REFERENCES branch_reports(id),
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'not_started',
  deadline TEXT,
  original_deadline TEXT,
  paused_reason TEXT,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  completed_at TEXT
);
CREATE INDEX idx_task_assignee ON tasks(assignee_user_id);
CREATE INDEX idx_task_branch ON tasks(branch_id);

CREATE TABLE task_history (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);

-- ===================== SUPPORT =====================
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  entity_label TEXT,
  branch_id INTEGER,
  student_id INTEGER,
  before_json TEXT,
  after_json TEXT,
  sensitivity TEXT NOT NULL DEFAULT 'normal',  -- normal | restricted
  created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id INTEGER,
  source TEXT,
  dedup_key TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, dedup_key)
);

CREATE TABLE signal_policies (
  id INTEGER PRIMARY KEY,
  version INTEGER NOT NULL UNIQUE,
  label TEXT NOT NULL,
  attendance_min_rate REAL NOT NULL,
  homework_min_rate REAL NOT NULL,
  lookback_weeks INTEGER NOT NULL DEFAULT 4,
  due_soon_days INTEGER NOT NULL DEFAULT 3,
  long_running_days INTEGER NOT NULL DEFAULT 21,
  is_experimental INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',       -- active | archived
  created_at TEXT NOT NULL
);

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

CREATE TABLE import_batches (
  id INTEGER PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  file_name TEXT,
  status TEXT NOT NULL,                        -- committed
  created_count INTEGER NOT NULL DEFAULT 0,
  linked_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
