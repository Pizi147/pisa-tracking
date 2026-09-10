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

-- ===================== CHƯƠNG TRÌNH HỌC =====================
-- FT dùng Mock Test và band IELTS. Lớp thường (FOU/BE/ELE) dùng bài kiểm tra chấm theo
-- số câu đúng trên tổng số câu, KHÔNG đi qua bảng quy đổi IELTS.
--
-- Để bảng riêng thay vì viết cứng trong code: sau này chương trình đổi, hoặc trung tâm mở
-- một chương trình mới, thì thêm dữ liệu chứ không phải sửa mã nguồn. Nhưng CHỈ đến thế —
-- không dựng một công cụ thiết kế chương trình kéo thả.
CREATE TABLE programmes (
  code TEXT PRIMARY KEY,              -- FT | FOU | BE | ELE | mã tự đặt
  name TEXT NOT NULL,
  weeks INTEGER,                      -- số tuần của khoá; NULL với FT vì không cố định
  scoring_mode TEXT NOT NULL,         -- ielts_band | ratio
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

-- Kỹ năng chương trình có đánh giá, theo đúng thứ tự hiển thị.
CREATE TABLE programme_skills (
  programme_code TEXT NOT NULL REFERENCES programmes(code),
  skill TEXT NOT NULL,
  seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (programme_code, skill)
);

-- Mốc kiểm tra tính theo TUẦN HỌC của lớp, không phải tuần thứ mấy của tháng.
-- FOU: giữa khoá tuần 4, cuối khoá tuần 8. BE/ELE: tuần 5 và tuần 10.
CREATE TABLE programme_checkpoints (
  programme_code TEXT NOT NULL REFERENCES programmes(code),
  kind TEXT NOT NULL,                 -- progress | final
  study_week INTEGER NOT NULL,
  PRIMARY KEY (programme_code, kind)
);

CREATE TABLE classes (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,          -- luôn bắt đầu bằng mã chi nhánh: "CP-FT 110"
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  kind TEXT NOT NULL,                 -- nhãn gốc do quản lý đặt: FT, FOUND, BE, ELE...
  -- Mã chương trình đã CHUẨN HOÁ. `kind` giữ nguyên chữ người dùng gõ (kể cả "FOUND" cũ),
  -- còn mọi tính toán đọc cột này. Không đổi mã lớp lịch sử chỉ vì đổi mã chương trình.
  programme_code TEXT REFERENCES programmes(code),
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
  programme_code TEXT REFERENCES programmes(code),
  target_score REAL,                  -- điểm cam kết của CHÍNH lộ trình này
  exam_date TEXT,                     -- ngày thi IELTS dự kiến của lộ trình này

  -- ĐIỂM XUẤT PHÁT. Phải ghi rõ NGUỒN, vì "em vào học ở mức nào" là câu hỏi khác hẳn
  -- "bài Mock đầu tiên được mấy điểm". Không có căn cứ thì để trống và hiển thị "chưa rõ",
  -- KHÔNG lấy MT1 làm điểm đầu vào.
  baseline_attempt_id INTEGER REFERENCES assessment_attempts(id),
  baseline_score REAL,                -- khi điểm đầu vào đến từ ngoài hệ thống
  baseline_source TEXT,               -- 'entrance' | 'previous_cycle' | 'external' | 'manual'
  baseline_note TEXT,

  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',   -- active | completed | abandoned

  -- KẾT THÚC HÀNH CHÍNH KHÁC ĐẠT MỤC TIÊU. Đóng lộ trình không chứng minh em đã đạt target.
  outcome TEXT,                       -- 'reached' | 'not_reached' | 'unknown'
  outcome_attempt_id INTEGER REFERENCES assessment_attempts(id),
  outcome_score REAL,
  outcome_note TEXT,

  note TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (student_id, seq)
);

-- Lịch sử đổi target. Sửa target KHÔNG được chấm lại quá khứ: mỗi lượt đánh giá đã chốt
-- target của chính nó tại `assessment_attempts.target_at_attempt`.
CREATE TABLE cycle_target_revisions (
  id INTEGER PRIMARY KEY,
  cycle_id INTEGER NOT NULL REFERENCES learning_cycles(id),
  old_target REAL,
  new_target REAL,
  effective_from TEXT NOT NULL,       -- từ ngày này target mới có hiệu lực
  reason TEXT,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_target_rev_cycle ON cycle_target_revisions(cycle_id);
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

-- HÀNH TRÌNH HỌC. Đây là câu chuyện đọc được của một em, KHÔNG phải nhật ký kỹ thuật
-- (nhật ký kỹ thuật nằm ở `audit_logs`). Chỉ ghi sự kiện có ý nghĩa với người đọc.
CREATE TABLE journey_events (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  -- Sự kiện thuộc lộ trình nào. Thiếu thì để trống chứ không gán bừa vào lộ trình hiện tại.
  cycle_id INTEGER REFERENCES learning_cycles(id),
  event_type TEXT NOT NULL,
  -- NGÀY SỰ VIỆC XẢY RA, khác `created_at` là lúc ghi vào hệ thống. Ghi bù một buổi tuần
  -- trước thì event_date là tuần trước, created_at là hôm nay.
  event_date TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  ref_table TEXT,
  ref_id INTEGER,
  -- Khoá chống trùng: lưu/thử lại nhiều lần chỉ để lại MỘT sự kiện.
  dedup_key TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_journey_student ON journey_events(student_id, event_date);
CREATE UNIQUE INDEX idx_journey_dedup ON journey_events(dedup_key) WHERE dedup_key IS NOT NULL;

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
  raw_score INTEGER,                  -- FT: 0..40 với listening/reading. Lớp thường: số câu đúng.
  -- Tổng số câu của chính đề đó. Lớp thường bắt buộc có, vì số câu KHÔNG cố định giữa các
  -- kỹ năng và các đề; không có tổng thì không tính được tỷ lệ đạt.
  raw_total INTEGER,
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
  -- Nhập GIỐNG HỆT Mock để hai con số so được với nhau: L/R nhập số câu đúng trên 40,
  -- W/S nhập bốn tiêu chí IELTS. Band là kết quả TÍNH RA, không phải con số gõ tay.
  raw_score INTEGER,                  -- 0..40, chỉ với listening/reading
  c1 REAL, c2 REAL, c3 REAL, c4 REAL, -- bốn tiêu chí, chỉ với writing1/writing2/speaking
  band REAL NOT NULL,
  assessed_on TEXT NOT NULL,          -- NGÀY đánh giá, khác ngày nhập vào hệ thống
  assessed_by INTEGER REFERENCES users(id),
  class_id INTEGER REFERENCES classes(id),
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_estimate_student ON teacher_estimates(student_id, skill);

-- ===================== CASE SOS =====================
/*
 * CASE HỌC VỤ.
 *
 * Giữ tên bảng `sos_cases` để mọi liên kết cũ (công việc, thông báo, đường dẫn đã lưu)
 * không gãy, nhưng ý nghĩa đã rộng hơn tên: một case KHÔNG còn bắt buộc sinh từ Mock.
 *
 * Hai nguồn:
 *   - `mock`          — hệ thống tự mở khi kết quả có kỹ năng dưới kỳ vọng.
 *   - `teacher_report`— giáo viên chủ động báo, không cần chờ Mock, không tạo bài giả.
 *
 * `sos_level` chỉ có nghĩa với case sinh từ bài đánh giá: nó là SỐ KỸ NĂNG DƯỚI KỲ VỌNG.
 * Case do giáo viên báo để NULL — không phải SOS 0, cũng không mặc định SOS 1 — và dùng
 * `urgency` riêng. Trộn hai thang vào một cột thì con số SOS trên báo cáo mất nghĩa.
 */
CREATE TABLE sos_cases (
  id INTEGER PRIMARY KEY,
  -- Có thể NULL: case do giáo viên báo không gắn với bài nào.
  attempt_id INTEGER REFERENCES assessment_attempts(id) UNIQUE,
  -- Luôn có, kể cả khi không có attempt. Backfill từ attempt khi nâng cấp dữ liệu cũ.
  student_id INTEGER REFERENCES students(id),
  cycle_id INTEGER REFERENCES learning_cycles(id),

  -- Nguồn gốc KHÔNG đổi khi sau này gắn thêm bằng chứng.
  origin_kind TEXT NOT NULL DEFAULT 'mock',   -- mock | teacher_report
  detected_at TEXT,                   -- ngày phát hiện vấn đề, khác ngày ghi vào hệ thống
  reported_by INTEGER REFERENCES users(id),
  summary TEXT,                       -- một câu mô tả vấn đề, do người báo viết
  -- Mức độ gấp do NGƯỜI BÁO nhận định. Khác hẳn sos_level tính từ điểm.
  urgency TEXT,                       -- normal | attention | urgent

  sos_level INTEGER,                  -- 1..3, NULL khi chưa/không tính được từ điểm
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

  /*
   * HƯỚNG XỬ LÝ — khác với trạng thái.
   * Trạng thái nói case đang mở hay đã xong; hướng xử lý nói định làm gì với nó.
   * "Chỉ theo dõi" là một hướng xử lý hợp lệ mà case vẫn đang mở.
   */
  disposition TEXT,                   -- monitor | offline | no_action | action | other
  disposition_note TEXT,
  closed_by INTEGER REFERENCES users(id),
  closed_at TEXT,

  -- GVCN đã nhận case: METADATA, không phải trạng thái thứ tư. Nhận không nghĩa là đã xử lý,
  -- và có thể ghi hành động thực tế trước rồi mới xác nhận đã nhận.
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TEXT,
  -- Dấu xác nhận cũ. Bước "Head xác nhận" ĐÃ BỎ khỏi quy trình; hai cột này chỉ để tra lại.
  head_confirmed_by INTEGER REFERENCES users(id),
  head_confirmed_at TEXT,
  note TEXT,
  -- Chống trùng khi bấm hai lần hoặc thử lại sau lỗi mạng.
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX idx_case_student ON sos_cases(student_id, status);
CREATE INDEX idx_case_cycle ON sos_cases(cycle_id);

/*
 * VẤN ĐỀ của một case, theo bộ phân loại ba nhóm Học sinh / Giáo viên / Giáo trình.
 *
 * Một case có thể có nhiều yếu tố nhưng CHỈ MỘT yếu tố chính. Yếu tố hoàn cảnh (phụ huynh,
 * sức khoẻ, đi lại…) là ngữ cảnh kèm theo, không phải nhóm thứ tư.
 *
 * Đây là NHẬN ĐỊNH của người ghi, sửa được và có lịch sử — không phải kết luận nhân quả
 * do hệ thống tự suy ra từ điểm số.
 */
CREATE TABLE case_issues (
  id INTEGER PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES sos_cases(id),
  role TEXT NOT NULL DEFAULT 'primary',   -- primary | secondary | context
  taxonomy_code TEXT NOT NULL,            -- mã ổn định, ví dụ 'student.academic.listening.detail'
  taxonomy_version INTEGER NOT NULL DEFAULT 1,
  skill TEXT,                             -- kỹ năng liên quan, nếu có
  observation TEXT,                       -- quan sát cụ thể, không phải nhãn quy kết
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_case_issue_case ON case_issues(case_id);

/*
 * TÁC ĐỘNG đã làm cho một case. Một case có NHIỀU tác động — đây là điểm mà các cột cố định
 * cũ (trao đổi HS / trao đổi PH / hỗ trợ học thuật) không tả được.
 *
 * Tách NGƯỜI THỰC HIỆN với NGƯỜI GHI NHẬN: CS trao đổi với phụ huynh nhưng Admin ghi vào
 * hệ thống thì phải giữ được cả hai. Người thực hiện có thể không có tài khoản (ghi tên).
 *
 * "Đã bắt đầu" KHÁC "đã xong": ngày bắt đầu học tutor không chứng minh đã học xong.
 */
CREATE TABLE case_interventions (
  id INTEGER PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES sos_cases(id),
  kind TEXT NOT NULL,                 -- talk_student | talk_parent | tutor | self_study |
                                      -- teaching_adjust | meeting | ops_policy | other
  description TEXT,
  -- Người thực hiện: ưu tiên tài khoản, không có thì ghi tên (CS, phụ huynh, người ngoài).
  performer_user_id INTEGER REFERENCES users(id),
  performer_name TEXT,
  recorded_by INTEGER REFERENCES users(id),

  status TEXT NOT NULL DEFAULT 'planned',   -- planned | started | completed | cancelled
  planned_date TEXT,
  started_date TEXT,
  completed_date TEXT,
  -- Hẹn xem lại. Chỉ tính quá hạn khi CÓ ngày hẹn và chưa xem lại; theo dõi không hẹn thì
  -- không bao giờ quá hạn.
  followup_due TEXT,

  /*
   * CÓ CẦN QUẢN LÝ DUYỆT KHÔNG — do chính giáo viên đề xuất quyết định.
   *
   * Trao đổi với em sau buổi học thì giáo viên tự làm; xếp tutor hay lùi lịch thi thì phải
   * có người quyết. Bắt duyệt hết là biến phần mềm thành cửa xin phép, không duyệt gì thì
   * việc tốn tiền lại không ai chịu trách nhiệm.
   *
   * NULL ở `approval_state` nghĩa là KHÔNG cần duyệt — khác hẳn 'pending' là đang chờ.
   */
  needs_approval INTEGER NOT NULL DEFAULT 0,
  approval_state TEXT,                -- NULL (không cần) | pending | approved | declined
  approval_due TEXT,                  -- hạn Quản lý phải trả lời, tính lúc đề xuất
  approval_by INTEGER REFERENCES users(id),
  approval_at TEXT,
  approval_note TEXT,

  -- Khoá migration: mỗi cột cũ chỉ chuyển thành một tác động, chạy lại không nhân đôi.
  migration_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
-- Việc đang chờ duyệt là thứ Quản lý phải tìm nhanh, nên có chỉ số riêng.
CREATE INDEX idx_intervention_approval ON case_interventions(approval_state)
  WHERE approval_state = 'pending';
CREATE INDEX idx_intervention_case ON case_interventions(case_id);
CREATE INDEX idx_intervention_due ON case_interventions(followup_due) WHERE followup_due IS NOT NULL;

/*
 * XEM LẠI SAU TÁC ĐỘNG. Một tác động có thể xem lại nhiều lần; cũng có thể xem lại ở mức
 * case khi chỉ đang theo dõi mà chưa làm gì.
 *
 * `outcome` là QUAN SÁT, không phải khẳng định nhân quả: điểm tăng sau khi học tutor không
 * chứng minh tutor làm điểm tăng.
 */
CREATE TABLE case_followups (
  id INTEGER PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES sos_cases(id),
  intervention_id INTEGER REFERENCES case_interventions(id),
  observed_on TEXT NOT NULL,
  observer_user_id INTEGER REFERENCES users(id),
  outcome TEXT,                       -- improved | partial | unchanged | worse | insufficient
  note TEXT,
  -- Bằng chứng kèm theo, ví dụ một lượt đánh giá sau đó.
  evidence_attempt_id INTEGER REFERENCES assessment_attempts(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_followup_case ON case_followups(case_id);

/*
 * BẰNG CHỨNG gắn với case. Một case có thể liên kết nhiều bài đánh giá và nhiều ghi nhận.
 * `role` phân biệt bằng chứng GỐC (thứ mở ra case) với bằng chứng bổ sung và bằng chứng
 * kiểm chứng sau hỗ trợ.
 */
CREATE TABLE case_sources (
  id INTEGER PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES sos_cases(id),
  role TEXT NOT NULL DEFAULT 'support',   -- origin | support | validation
  source_type TEXT NOT NULL,              -- assessment | checkin | report
  source_id INTEGER NOT NULL,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE (case_id, source_type, source_id, role)
);
CREATE INDEX idx_case_source_case ON case_sources(case_id);

/*
 * GHI NHẬN NHANH của giáo viên về một kỹ năng.
 *
 * Mở rộng `teacher_estimates`: ngoài band còn nhận NHẬN ĐỊNH ĐỊNH TÍNH. Giáo viên lớp
 * thường không quy được ra band IELTS, và một câu "em nghe chi tiết còn yếu" nhiều khi
 * hữu ích hơn một con số.
 *
 * Tối thiểu phải có NHẬN ĐỊNH hoặc ĐIỂM — không bắt điền đủ mọi ô.
 */
CREATE TABLE skill_checkins (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  cycle_id INTEGER REFERENCES learning_cycles(id),
  class_id INTEGER REFERENCES classes(id),
  skill TEXT NOT NULL,
  -- NGÀY QUAN SÁT, khác ngày nhập vào hệ thống.
  observed_on TEXT NOT NULL,
  author_user_id INTEGER REFERENCES users(id),

  judgement TEXT,                     -- nhận định ngắn
  strengths TEXT,
  weaknesses TEXT,
  -- Điểm ước lượng: TÙY CHỌN. Ghi rõ căn cứ để không nhầm với điểm chính thức.
  band REAL,
  raw_score INTEGER,
  raw_total INTEGER,
  c1 REAL, c2 REAL, c3 REAL, c4 REAL,
  estimate_basis TEXT,                -- judgement | raw | criteria

  created_at TEXT NOT NULL
);
CREATE INDEX idx_checkin_student ON skill_checkins(student_id, skill, observed_on);

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

-- Người THEO DÕI một công việc: không phải người làm, không chịu trách nhiệm hoàn thành,
-- nhưng được cập nhật khi tiến độ đổi. Nhiều người một việc nên phải là bảng riêng,
-- không nhét vào một cột trên tasks.
CREATE TABLE task_followers (
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  -- auto = hệ thống tự thêm (Quản lý của chi nhánh), manual = người tạo chọn thêm.
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL,
  PRIMARY KEY (task_id, user_id)
);
CREATE INDEX idx_task_follower_user ON task_followers(user_id);

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
