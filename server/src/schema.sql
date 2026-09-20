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
-- điểm đạt trên tổng điểm, KHÔNG đi qua bảng quy đổi IELTS.
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
  is_fast_track INTEGER NOT NULL DEFAULT 0,
  start_date TEXT,

  /*
   * TUẦN BẮT ĐẦU CỦA LỚP — mốc gốc để tính "lớp đang ở tuần thứ mấy".
   *
   * Với lớp Normal, tuần bắt đầu của TỪNG học viên không quan trọng bằng tuần bắt đầu của
   * LỚP: cả lớp làm Progress Test và Final Test cùng một tuần theo chương trình. Với lớp FT
   * thì ngược lại — mỗi em một lịch MT riêng theo tuần em vào học, nên cột này chỉ để tham
   * khảo.
   *
   * Dùng TUẦN chứ không dùng ngày: khai ngày cụ thể thì người nhập phải nhớ lớp khai giảng
   * đúng hôm nào, mà thông tin đó không ai giữ và cũng không đổi được kết quả tính toán nào.
   */
  start_period_id INTEGER REFERENCES report_periods(id),

  /*
   * MỐC KIỂM TRA DO NGƯỜI XẾP LẠI — ghi đè mốc mặc định của chương trình.
   *
   * FOU: tuần 4 và 8 · BE/ELE: tuần 5 và 10. Nhưng lớp nghỉ lễ, lớp học bù, lớp mở muộn là
   * chuyện có thật, nên Admin CN và Quản lý CN phải xê dịch được. NULL = dùng mốc mặc định
   * của chương trình; có số = người đã xếp lại và HỆ THỐNG KHÔNG ĐƯỢC GHI ĐÈ.
   */
  progress_week_override INTEGER,
  final_week_override INTEGER,

  /*
   * LỚP NÀY HỌC TIẾP TỪ LỚP NÀO — chuỗi chuyển tiếp FOU → BE → FT.
   *
   * Hết khoá thì KHÔNG đổi loại ngay trên lớp cũ: làm thế là xoá mất dấu giai đoạn trước,
   * và ba tháng sau không ai trả lời được "hồi đó em học Foundation ở lớp nào". Thay vào
   * đó mở một LỚP MỚI rồi chuyển học viên sang, và cột này giữ sợi dây giữa hai lớp.
   */
  previous_class_id INTEGER REFERENCES classes(id),

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
/*
 * TÀI KHOẢN NGƯỜI DÙNG.
 *
 * `email` là email ĐĂNG NHẬP, duy nhất, và phải có đuôi `.pisa@gmail.com` (owner chốt 7.1).
 * Email phụ nằm ở `user_emails` — mục 7.2 nói rõ "email(s)", số nhiều.
 *
 * `password_hash` lưu dạng băm scrypt kèm muối riêng từng người. Bản demo KHÔNG gửi email
 * thật và KHÔNG có luồng quên mật khẩu; quên thì Quản trị hệ thống đặt lại.
 *
 * `approval_state` tách khỏi `status` vì hai thứ khác nhau: `pending` là người mới tự đăng
 * ký và CHƯA ai duyệt, `status='inactive'` là tài khoản đã từng dùng rồi bị khoá. Gộp làm
 * một thì không phân biệt được "chưa được vào" với "đã bị cho ra".
 */
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  title TEXT,
  phone TEXT,
  password_hash TEXT,
  password_salt TEXT,
  approval_state TEXT NOT NULL DEFAULT 'approved',   -- approved | pending | declined
  /* Chi nhánh người đăng ký tự khai; người duyệt sửa được trước khi bấm duyệt. */
  requested_branches TEXT,                            -- JSON mảng mã chi nhánh
  requested_note TEXT,
  approved_by INTEGER REFERENCES users(id),
  approved_at TEXT,
  decline_reason TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

/* Email phụ. Email đăng nhập vẫn nằm ở `users.email` và không lặp lại ở đây. */
CREATE TABLE user_emails (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, email)
);

/*
 * KỸ NĂNG NGƯỜI NÀY PHỤ TRÁCH ĐƯỢC (mục 7.2) — khác hẳn phân công dạy ở một lớp cụ thể.
 *
 * Đây là "biết dạy được gì", dùng để gợi ý khi phân công. `teacher_assignments` mới là
 * "đang dạy gì ở lớp nào", và mới là thứ quyết định quyền nhập điểm.
 */
CREATE TABLE user_skills (
  user_id INTEGER NOT NULL REFERENCES users(id),
  skill TEXT NOT NULL,
  PRIMARY KEY (user_id, skill)
);

/*
 * QUYỀN CẤP RIÊNG CHO MỘT CÁ NHÂN, ngoài quyền đến từ vai trò (mục 7.3).
 *
 * Ví dụ owner đưa ra: cấp cho một Quản lý CN Monbay quyền QUAN SÁT toàn hệ thống. Không thể
 * làm điều đó bằng vai trò — sửa vai "Quản lý" là sửa cho tất cả Quản lý. `branch_id` để
 * trống nghĩa là phạm vi toàn hệ thống, đúng quy ước của `user_roles`.
 */
CREATE TABLE user_permissions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  permission_id INTEGER NOT NULL REFERENCES permissions(id),
  branch_id INTEGER REFERENCES branches(id),
  note TEXT,
  granted_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE (user_id, permission_id, branch_id)
);

/*
 * LỘ TRÌNH (LT1, LT2, …) nay là DỮ LIỆU chứ không phải hằng số trong mã.
 *
 * Mục 7.3: Quản trị hệ thống tạo và sửa lộ trình. Trung tâm mở một lộ trình mới thì thêm
 * một dòng, không phải sửa mã nguồn rồi chờ cài lại.
 */
CREATE TABLE routes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  note TEXT,
  seq INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL,
  -- 'active' = giao mới được. 'retired' = vai trò đã bỏ, chỉ còn để ĐỌC lịch sử.
  -- Vai đã bỏ không bị xoá dòng vì user_roles và nhật ký cũ còn trỏ vào nó.
  status TEXT NOT NULL DEFAULT 'active'
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

  /*
   * TUẦN BẮT ĐẦU HỌC của học viên — TUẦN HỌC THỨ 1 của em.
   *
   * Đây là mốc gốc sinh ra lịch MT mặc định của lớp FT: MT1 tuần 6 · MT2 tuần 12 ·
   * MT3 tuần 16 · MT4 tuần 20 · MT5 tuần 24. Gắn vào LỘ TRÌNH chứ không gắn vào hồ sơ học
   * viên, vì sang LT2 là bắt đầu lại từ tuần 1 với một target mới.
   *
   * Bắt buộc với MỌI học viên (owner chốt 13/09/2026). Thiếu thì badge "Thiếu thông tin".
   */
  start_period_id INTEGER REFERENCES report_periods(id),

  /*
   * THÁNG/NĂM DỰ KIẾN THI, dạng 'YYYY-MM'. CHỈ áp dụng lớp FT.
   *
   * Tách khỏi `exam_period_id` vì hai thứ khác nhau về độ chắc chắn: tháng thi là thứ biết
   * ngay lúc tư vấn và dùng để xếp lịch cả khoá; tuần thi thì gần ngày đăng ký mới chốt
   * được. Ép khai tuần ngay từ đầu thì người ta chọn bừa một tuần rồi không ai sửa lại.
   *
   * Lớp Normal để TRỐNG và KHÔNG bị badge nhắc — các em đó chưa thi IELTS.
   */
  exam_month TEXT,

  /*
   * TUẦN DỰ KIẾN THI, khi đã biết chắc hơn tháng. Không lưu ngày cụ thể.
   *
   * Ba mức chắc chắn, hiển thị đúng như vậy:
   *   có tuần    → "W2 FEB 2027"
   *   chỉ tháng  → "FEB 2027 · chưa xác định tuần"
   *   chưa gì cả → "Chưa xác định"
   * Chỉ đếm ngược khi đã có tuần; biết mỗi tháng thì không đếm ngược.
   */
  exam_period_id INTEGER REFERENCES report_periods(id),

  -- ĐIỂM XUẤT PHÁT. Phải ghi rõ NGUỒN, vì "em vào học ở mức nào" là câu hỏi khác hẳn
  -- "bài Mock đầu tiên được mấy điểm". Không có căn cứ thì để trống và hiển thị "chưa rõ",
  -- KHÔNG lấy MT1 làm điểm đầu vào.
  baseline_attempt_id INTEGER REFERENCES assessment_attempts(id),
  baseline_score REAL,                -- khi điểm đầu vào đến từ ngoài hệ thống
  baseline_source TEXT,               -- 'entrance' | 'previous_cycle' | 'external' | 'manual'
  baseline_note TEXT,

  /*
   * ĐIỂM ĐẦU VÀO TỪNG KỸ NĂNG (mục 12.1) — chỉ lớp Fast Track có.
   *
   * OVR nhập ĐỘC LẬP với bốn môn: nó là con số trên phiếu điểm chính thức, không phải trung
   * bình bốn cột này. Thiếu vài môn KHÔNG được lấy OVR lấp vào, và có đủ bốn môn cũng không
   * được ghi đè OVR bằng một phép tính — hai thứ đến từ hai nguồn khác nhau.
   *
   * WRITING LÀ MỘT CON SỐ, không tự chia W1/W2: phiếu điểm IELTS chỉ có một band Writing,
   * còn W1/W2 là cách chấm nội bộ của đợt MT. Chia đôi một con số không tồn tại là bịa.
   */
  baseline_listening REAL,
  baseline_reading REAL,
  baseline_writing REAL,
  baseline_speaking REAL,

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
  code TEXT NOT NULL,                 -- "W1 SEP 2026" — nhãn hiển thị, luôn kèm năm
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

  /*
   * AI XẾP TUẦN NÀY — và đây là cột giữ lời hứa "hệ thống không ghi đè cái Quản lý đã xếp".
   *
   *   'auto'   hệ thống đề xuất theo mốc tuần 6/12/16/20/24 tính từ tuần bắt đầu học
   *   'manual' một người đã chốt, hoặc đã sửa lại đề xuất của hệ thống
   *
   * Đổi tuần bắt đầu học thì chỉ những lượt còn 'auto' được tính lại. Lượt nào người đã
   * đụng vào thì đứng yên — đó là lý do cột này tồn tại, chứ không phải để thống kê.
   */
  plan_source TEXT NOT NULL DEFAULT 'manual',

  /*
   * KHÔNG có cột ngày thi cụ thể. Một lượt MT được xác định bằng ĐÚNG MỘT TUẦN.
   *
   * Trước đây có `lrw_scheduled_at` và `speaking_scheduled_at`; bỏ hẳn từ vòng 5 vì hai
   * cột đó tạo ra một đầu việc "cập nhật ngày MT" mà không ai dùng tới: mọi báo cáo, hạn
   * nhập điểm và bộ đếm đều đã đếm theo tuần. Cần biết buổi nào ngày nào thì xem lịch dạy
   * của lớp, không phải bắt khai lại ở đây.
   */

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

/*
 * LỊCH THI RIÊNG TỪNG KỸ NĂNG trong một đợt (mục 10.1).
 *
 * Một đợt MT vẫn là MỘT đợt, có một định danh, một bảng điểm và một kết luận. Nhưng ngoài
 * đời các kỹ năng của nó KHÔNG thi cùng lúc: FT hay thi R/L/W một buổi rồi Speaking tuần
 * sau; lớp Normal có thể trải bốn môn ra hai ba tuần. Trước vòng 7 cả đợt dùng chung một
 * tuần, nên dời Speaking là kéo theo hạn chấm của cả ba môn đã thi xong từ tuần trước.
 *
 * Bảng này là NƠI SỞ HỮU DUY NHẤT của bốn câu hỏi, hỏi riêng cho từng kỹ năng:
 *
 *   1. có nằm trong phạm vi yêu cầu của đợt này không   → `required`
 *   2. thi tuần nào                                     → `planned_period_id`
 *   3. đã thi, đã vắng hay đã huỷ phần thi              → `sit_status`
 *   4. hạn chấm là ngày nào                             → suy từ (2) + `deadline_override`
 *
 * `assessment_attempts.planned_period_id` KHÔNG biến mất: nó trở thành TUẦN KẾ HOẠCH HOÀN
 * TẤT của cả đợt — tuần muộn nhất trong các kỹ năng bắt buộc (mục 10.7) — và được tính lại
 * mỗi khi một kỹ năng đổi tuần. Nhờ đó bảng kết quả theo tuần vẫn đếm mỗi đợt đúng một lần.
 *
 * Kỹ năng ở đây là kỹ năng ĐÁNH GIÁ: Writing là MỘT môn thi, không tách W1/W2. Hai task
 * Writing chấm riêng nhưng luôn làm trong cùng một buổi, nên chúng dùng chung một lịch.
 */
CREATE TABLE attempt_skills (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
  skill TEXT NOT NULL,                -- listening | reading | writing | speaking

  /*
   * PHẠM VI YÊU CẦU. Mặc định 1. Đặt 0 nghĩa là ngay từ đầu đợt này không yêu cầu kỹ năng
   * đó — KHÁC hẳn "có yêu cầu nhưng chưa có điểm", và cũng khác "đã xếp lịch mà vắng".
   * Lớp Normal luôn phải đủ bốn môn nên không bao giờ có dòng `required = 0`.
   */
  required INTEGER NOT NULL DEFAULT 1,
  scope_reason TEXT,
  scope_by INTEGER REFERENCES users(id),
  scope_at TEXT,

  -- Tuần thi CỦA CHÍNH KỸ NĂNG NÀY. Trống = chưa xếp; không suy ra từ tuần của đợt.
  planned_period_id INTEGER REFERENCES report_periods(id),
  /*
   * 'auto'   tuần này thừa hưởng từ tuần chung của đợt, chưa ai chốt riêng cho kỹ năng
   * 'manual' một người đã xếp riêng tuần cho kỹ năng này
   * Cơ chế tự tính lịch theo tuần bắt đầu học chỉ được đụng vào dòng 'auto' (mục 10.4).
   */
  plan_source TEXT NOT NULL DEFAULT 'auto',

  -- scheduled (chưa xác nhận gì) | sat (đã thi) | absent (đã xác nhận vắng) | cancelled
  sit_status TEXT NOT NULL DEFAULT 'scheduled',
  sit_by INTEGER REFERENCES users(id),
  sit_at TEXT,
  sit_note TEXT,

  -- Hạn chấm riêng cho ĐÚNG kỹ năng này, đè lên hạn riêng của cả đợt và hạn mặc định.
  deadline_override TEXT,
  deadline_override_by INTEGER REFERENCES users(id),
  deadline_override_at TEXT,
  deadline_override_reason TEXT,

  /*
   * Số lần đã dời vì VẮNG, đếm riêng cho KỸ NĂNG NÀY TRONG ĐỢT NÀY (mục 10.6).
   * Không dùng chung một lượt miễn phí cho cả R/L/W và Speaking. Dời chủ động của Quản lý
   * không làm tăng con số này.
   */
  absence_move_count INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE (attempt_id, skill)
);
CREATE INDEX idx_attempt_skills_attempt ON attempt_skills(attempt_id);
CREATE INDEX idx_attempt_skills_period ON attempt_skills(planned_period_id);

/*
 * ĐỀ NGHỊ DỜI LỊCH DO VẮNG — mục 10.6.
 *
 * Lần đầu vắng một kỹ năng, GVCN tự dời được, và dời đúng TUẦN KẾ TIẾP của lịch đang có —
 * không chọn tuỳ ý, không lấy tuần hiện tại để nhảy nhiều tuần khi xử lý muộn. Từ lần thứ
 * hai trở đi thì phải có Quản lý duyệt, và bảng này là chỗ lời đề nghị đó nằm chờ.
 *
 * HẠN DUYỆT LÀ TRƯỚC KHI TUẦN MỚI BẮT ĐẦU. Quá hạn mà chưa ai trả lời thì phần thi/lịch hẹn
 * bị huỷ — vì để nguyên thì em có một lịch thi mà không ai xác nhận, và cả đợt treo theo nó.
 * Huỷ KHÔNG xoá điểm hay lịch sử: nó chỉ dừng đúng hàng công việc của phần đã huỷ.
 *
 * `idempotency_key` chặn hai lần gửi cùng một đề nghị (bấm hai lần, mạng chập) biến thành
 * hai lần dời.
 */
CREATE TABLE skill_move_requests (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
  skill TEXT NOT NULL,
  /* Lần dời do vắng thứ mấy của CHÍNH kỹ năng này trong CHÍNH đợt này. */
  move_no INTEGER NOT NULL,
  from_period_id INTEGER REFERENCES report_periods(id),
  to_period_id INTEGER NOT NULL REFERENCES report_periods(id),
  reason TEXT,
  requested_by INTEGER REFERENCES users(id),
  requested_on TEXT NOT NULL,
  /* Hạn Quản lý phải trả lời: ngày TRƯỚC khi tuần mới được đề nghị bắt đầu. */
  decide_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | declined | expired | withdrawn
  decided_by INTEGER REFERENCES users(id),
  decided_at TEXT,
  decision_note TEXT,
  /* Phần thi/lịch hẹn đã bị huỷ vì từ chối hoặc hết hạn — chờ Quản lý khôi phục. */
  cancelled_part INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE (attempt_id, skill, move_no)
);
CREATE INDEX idx_move_req_attempt ON skill_move_requests(attempt_id);
CREATE INDEX idx_move_req_open ON skill_move_requests(status, decide_by) WHERE status = 'pending';

-- Mỗi kỹ năng NHẬP ĐIỂM một dòng.
-- Không có dòng, hoặc có dòng mà `band` còn trống = CHƯA NHẬP ĐIỂM.
CREATE TABLE assessment_scores (
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
  skill TEXT NOT NULL,                -- listening | reading | writing1 | writing2 | speaking
  -- Không lưu ngày làm bài của riêng kỹ năng: lượt MT thuộc về một TUẦN, và thời điểm cần
  -- biết duy nhất là lúc điểm được nhập (`entered_at`).
  raw_score INTEGER,                  -- FT: số câu đúng 0..40 với L/R. Normal: ĐIỂM ĐẠT.
  -- TỔNG ĐIỂM của chính đề đó. Lớp Normal bắt buộc có, vì thang điểm KHÔNG cố định giữa các
  -- môn và các đề; không có tổng thì không tính được tỷ lệ đạt.
  raw_total INTEGER,
  c1 REAL, c2 REAL, c3 REAL, c4 REAL, -- bốn tiêu chí, chỉ với writing1/writing2/speaking
  band REAL,                          -- band IELTS, hoặc NULL khi chưa nhập điểm
  result_date TEXT,                   -- ngày có kết quả, để đo thời gian chấm
  entered_by INTEGER REFERENCES users(id),
  entered_at TEXT,
  note TEXT,
  /*
   * DẤU '-' = "KHÔNG CÓ BÀI" (rule book §17.1, PR-G). KHÔNG phải điểm 0 và KHÔNG xoá điểm: nó là một
   * lời khai của người được phân công nhập điểm rằng em có lịch tuần đó nhưng không làm bài.
   *
   *   no_show_period_id   tuần lịch của bài LÚC báo. Lịch dời sang tuần khác thì dấu này hết nghĩa —
   *                       nó nói về một tuần cụ thể, không phải về học viên.
   *   no_show_late        1 = nhập khi tuần đó ĐÃ kết thúc → chờ Quản lý hiệu chỉnh, không tự chốt (C10).
   *   no_show_settled_at  lúc đã chốt "không dự thi". Có giá trị thì việc chốt KHÔNG lặp lại — mỗi
   *                       lần lịch/kỹ năng chỉ chốt một lần dù tác vụ chạy bao nhiêu lần.
   */
  no_show_period_id INTEGER REFERENCES report_periods(id),
  no_show_by INTEGER REFERENCES users(id),
  no_show_at TEXT,
  no_show_late INTEGER NOT NULL DEFAULT 0,
  no_show_settled_at TEXT,
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
/*
 * MỘT VẤN ĐỀ CỦA MỘT HỌC VIÊN.
 *
 * Tên bảng giữ nguyên `sos_cases` để không phải đổi khoá ngoại ở sáu bảng khác, nhưng nó
 * KHÔNG còn là "một case SOS cho mỗi lượt MT". Từ 10/09/2026:
 *
 *   một hàng = MỘT LƯỢT × MỘT KỸ NĂNG   (hoặc một nhóm Ý thức, khi giáo viên tự báo)
 *
 * Vì sao không gom cả lượt vào một hàng: một kỹ năng có nhiều vấn đề khác nhau theo thời
 * gian — MT2 vướng Listening vì dính bẫy distractors, MT4 vẫn Listening nhưng vì từ vựng.
 * Hai chuyện khác nhau, hai phương án khác nhau, nên phải có hai vòng đời.
 *
 * "MẠCH" theo kỹ năng KHÔNG phải một bảng: nó là cách gom khi hiển thị (cùng học viên,
 * cùng lộ trình, cùng `topic`, xếp theo lượt). Nhờ vậy vẫn đọc được "Listening trượt lần
 * thứ ba" mà không thêm một tầng dữ liệu phải giữ đồng bộ.
 *
 * `sos_level` vẫn là mức của CẢ LƯỢT (số kỹ năng dưới kỳ vọng), không phải của riêng hàng
 * này — SOS là chỉ báo mức độ của em ở lượt đó, không phải một hệ thống công việc song song.
 */
CREATE TABLE sos_cases (
  id INTEGER PRIMARY KEY,
  -- NULL khi giáo viên tự báo, hoặc khi Quản lý giao việc mà chưa có bài nào.
  attempt_id INTEGER REFERENCES assessment_attempts(id),
  student_id INTEGER REFERENCES students(id),
  cycle_id INTEGER REFERENCES learning_cycles(id),

  /*
   * HAI ĐẦU MỤC, KHÔNG HƠN. Vấn đề về giáo viên và giáo trình KHÔNG còn ở đây — đó không
   * phải vấn đề của học viên, và nay nằm ở Báo cáo tuần chi nhánh.
   */
  track TEXT NOT NULL DEFAULT 'academic',  -- academic | behaviour
  -- Học thuật: listening | reading | writing1 | writing2 | speaking (NĂM ô, W1/W2 tách).
  -- Ý thức:    attendance | homework | participation | other (nay chỉ là MÔ TẢ bên trong
  --            case, không còn là đơn vị gộp — xem `category`).
  topic TEXT,

  /*
   * HẠNG MỤC — ĐƠN VỊ GỘP CỦA MỘT CASE TỪ VÒNG 4.
   *
   * Sáu giá trị: listening · reading · writing1 · writing2 · speaking · behaviour.
   * Một case = MỘT HỌC VIÊN × MỘT HẠNG MỤC, sống suốt khoá học. Bốn nhóm ý thức gộp hết
   * vào `behaviour`; kỹ năng của lớp Normal quy về đúng sáu ô này (Pronunciation → speaking,
   * W → writing2) để mọi bảng tổng hợp dùng chung một bộ cột.
   */
  category TEXT,

  /*
   * KHOÁ CHỐNG TRÙNG — MỘT chỉ mục duy nhất thay cho bốn chỉ mục một phần.
   *
   *   a:{học viên}:{lộ trình}:{hạng mục}   case học thuật chính, sống suốt khoá
   *   bt:{học viên}:{lộ trình}             case Ý thức do giáo viên báo, cũng sống suốt khoá
   *   bm:{lượt MT}                         case Ý thức tự sinh sau một đợt MT, chết theo lượt
   *   NULL                                 case mở SONG SONG có chủ ý
   *
   * Để NULL thì không vướng chỉ mục duy nhất (SQLite coi mỗi NULL là một giá trị khác) —
   * đúng thứ cần cho case song song ở mục 7.13: hợp lệ, nhưng phải do người mở quyết định.
   * Gói bốn quy tắc vào một chuỗi để tránh cái bẫy `ON CONFLICT` phải chép lại mệnh đề
   * `WHERE` của chỉ mục một phần.
   */
  dedup_key TEXT,
  /* 1 = case mở song song có chủ ý, sau khi người dùng đã thấy cảnh báo case trùng. */
  parallel INTEGER NOT NULL DEFAULT 0,

  /*
   * HẠN BÁO KẾT QUẢ CỦA CẢ CASE — hết tuần có MT KẾ TIẾP của học viên đó, sửa được.
   *
   * Khác hẳn hạn làm từng phương án (3/5/7 ngày theo mức SOS, nằm ở `case_interventions`).
   * Owner xác nhận 13/09/2026 giữ CẢ HAI mốc: một mốc thúc LÀM, một mốc thúc BÁO KẾT QUẢ.
   */
  follow_until TEXT,

  /*
   * KẾT QUẢ CHUNG CỦA CẢ CASE. Chỉ chốt được khi MỌI phương án đã có kết quả.
   *   outcome          much_better | improved | unchanged | worse
   *   outcome_decision end (kết thúc hẳn) | extend (kéo dài theo dõi + thêm phương án)
   */
  outcome TEXT,
  outcome_note TEXT,
  outcome_decision TEXT,
  outcome_by INTEGER REFERENCES users(id),
  outcome_at TEXT,

  /*
   * TÊN CASE DO NGƯỜI TẠO ĐẶT. Chỉ case tạo tay mới có.
   *
   * Case sinh từ điểm KHÔNG lưu tên: tên của nó suy ra lúc hiển thị từ lượt và hạng mục
   * ("MT2 - Reading dưới kỳ vọng"), nên sửa điểm thì tên đổi theo thay vì để lại một cái
   * tên cũ nói sai sự thật. Case tạo tay thì ngược lại — không có gì để suy ra, và người
   * tạo biết rõ nhất nên gọi nó là gì.
   */
  /*
   * NGƯỜI PHỤ TRÁCH CHÍNH của case — MỘT người, chịu trách nhiệm điều phối (mục 2.3).
   *
   * Tách hẳn khỏi hai vai khác vẫn thường bị lẫn với nó:
   *   · `reported_by`            — người GHI NHẬN vấn đề, có thể là người nhập hộ
   *   · `case_interventions.performer_user_id` — người THỰC HIỆN một phương án cụ thể
   *
   * Không suy người phụ trách từ "mọi giáo viên dạy lớp đó": một lớp có năm giáo viên thì
   * suy như thế là năm người cùng nợ một việc, và cuối cùng không ai làm. Chưa xác định được
   * thì để TRỐNG và nói thẳng "chưa có người phụ trách" — đó là một tin cần biết.
   */
  owner_user_id INTEGER REFERENCES users(id),
  title TEXT,

  /*
   * CASE NÀY TÁI DIỄN TỪ CASE NÀO — mục 7.5.
   *
   * Cùng một kỹ năng trượt lại sau khi case cũ ĐÃ ĐÓNG thì mở case MỚI chứ không mở lại
   * case cũ: case cũ đã có kết luận của người phụ trách, và đè lên kết luận đó là xoá mất
   * một quyết định có thật. Cột này giữ sợi dây để hồ sơ đọc được thành một mạch.
   *
   * Case cũ CÒN MỞ thì không sinh case mới — chỉ thêm một mốc và một chu kỳ xử lý tiếp.
   */
  previous_case_id INTEGER REFERENCES sos_cases(id),

  /*
   * ĐỢT THỨ MẤY của cùng một phân loại (mục 7.2). Tăng theo ĐỢT, không theo mỗi báo cáo:
   * một đợt có ba báo cáo vẫn là "lần 1". Giao diện đọc nó ra thành "Thiếu BTVN — lần 2".
   */
  episode_no INTEGER NOT NULL DEFAULT 1,
  /* Ngày cuối còn gộp được báo cáo mới vào chính case này = ngày mở + 3. */
  merge_until TEXT,
  /* Lúc case bị nâng lên Gấp vì có báo cáo bổ sung — dùng để siết hạn phương án. */
  urgency_raised_at TEXT,

  origin_kind TEXT NOT NULL DEFAULT 'mock',  -- mock | teacher_report | manager_task
  detected_at TEXT,                   -- ngày phát hiện vấn đề, khác ngày ghi vào hệ thống
  reported_by INTEGER REFERENCES users(id),
  summary TEXT,                       -- một câu mô tả vấn đề, do người báo viết
  -- Mức độ gấp do NGƯỜI BÁO nhận định. Case sinh từ điểm để trống: mức của nó suy ra từ
  -- `sos_level` lúc hiển thị, không ghi đè vào đây (hai thang cố tình tách nhau).
  urgency TEXT,                       -- normal | attention | urgent

  -- Mức SOS của CẢ LƯỢT, 1..3. NULL khi không tính được từ điểm.
  sos_level INTEGER,

  status TEXT NOT NULL DEFAULT 'open',    -- open | in_progress | done

  /*
   * HƯỚNG XỬ LÝ — khác với trạng thái.
   * Trạng thái nói vấn đề đang mở hay đã xong; hướng xử lý nói định làm gì với nó.
   * "Chỉ theo dõi" là một hướng xử lý hợp lệ mà vấn đề vẫn đang mở.
   */
  disposition TEXT,                   -- monitor | offline | no_action | action | other
  disposition_note TEXT,
  closed_by INTEGER REFERENCES users(id),
  closed_at TEXT,

  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TEXT,
  -- Dấu xác nhận cũ. Bước "Head xác nhận" ĐÃ BỎ khỏi quy trình; hai cột này chỉ để tra lại.
  head_confirmed_by INTEGER REFERENCES users(id),
  head_confirmed_at TEXT,
  -- GHI CHÚ, thay cho "Hoàn cảnh kèm theo" đã bỏ. Không bắt buộc.
  note TEXT,
  -- Chống trùng khi bấm hai lần hoặc thử lại sau lỗi mạng.
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
/*
 * MỘT HỌC VIÊN × MỘT HẠNG MỤC = MỘT CASE.
 *
 * Chỉ mục cũ `(attempt_id, topic)` đã bỏ: nó chính là thứ ép mỗi lượt MT đẻ ra một case
 * mới. Nay khoá chống trùng gói cả bốn quy tắc gộp vào một chuỗi, nên chỉ cần MỘT chỉ mục
 * duy nhất và mọi câu ON CONFLICT đều viết được không cần mệnh đề WHERE.
 */
/*
 * KHÔNG dùng chỉ mục duy nhất MỘT PHẦN (`... WHERE dedup_key IS NOT NULL`) ở đây, dù ý định
 * là "chỉ ràng buộc khi có khoá".
 *
 * SQLite bắt mọi câu `ON CONFLICT` phải chép lại y nguyên mệnh đề `WHERE` của chỉ mục một
 * phần, nếu không thì báo "ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE
 * constraint" — và chỉ báo LÚC CHẠY, không phải lúc biên dịch. Đó là cái bẫy đã mất thời
 * gian ở vòng trước.
 *
 * May là không cần: SQLite coi mỗi NULL là một giá trị KHÁC NHAU trong chỉ mục duy nhất,
 * nên chỉ mục đầy đủ vẫn cho nhiều case song song cùng để khoá trống. Cùng tác dụng, không
 * mệnh đề nào phải nhớ chép lại.
 */
CREATE UNIQUE INDEX idx_case_dedup ON sos_cases(dedup_key);
CREATE INDEX idx_case_student_category ON sos_cases(student_id, cycle_id, category);
CREATE INDEX idx_case_student_topic ON sos_cases(student_id, cycle_id, topic);
CREATE INDEX idx_case_follow_until ON sos_cases(follow_until) WHERE follow_until IS NOT NULL;

/*
 * BẢNG `student_contacts` ĐÃ BỎ Ở VÒNG 4.
 *
 * Vòng 3a để hai việc trao đổi (với học viên, với phụ huynh) ở một bảng riêng, tách khỏi
 * việc học. Vòng 4 đảo lại: chúng là HAI PHƯƠNG ÁN của case "Ý thức/Khác", nằm chung
 * `case_interventions` với mọi phương án khác.
 *
 * Lý do owner đổi ý: tách ra thì mỗi màn hình phải hỏi hai nơi rồi cộng lại, và sẽ có chỗ
 * cộng thiếu — đúng thứ đang làm các con số đá nhau. Dữ liệu cũ được bước di trú chuyển
 * nguyên sang phương án, giữ đủ người thực hiện, ngày thực hiện và ghi chú.
 */
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
  role TEXT NOT NULL DEFAULT 'primary',   -- primary | secondary (vai trò 'context' đã bỏ)
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

  /*
   * LÙI LỊCH THI THÌ LÙI CÁI GÌ (mục 8.1).
   *
   * 'real_exam'  = kế hoạch thi IELTS thật của em.
   * 'mock_skill' = một phần thi trong một đợt MT.
   *
   * Hai thứ này có người quyết khác nhau và hệ quả khác nhau, nên một đề xuất lùi lịch
   * không nói rõ đối tượng là một đề xuất không duyệt được. NULL với mọi loại khác.
   */
  reschedule_target TEXT,
  -- Người thực hiện: ưu tiên tài khoản, không có thì ghi tên (CS, phụ huynh, người ngoài).
  performer_user_id INTEGER REFERENCES users(id),
  performer_name TEXT,
  recorded_by INTEGER REFERENCES users(id),

  status TEXT NOT NULL DEFAULT 'planned',   -- planned | started | completed | cancelled
  planned_date TEXT,
  started_date TEXT,
  completed_date TEXT,
  /*
   * NGÀY DỰ KIẾN KẾT THÚC PHƯƠNG ÁN (mục 8.2, trước đây là "hẹn xem lại").
   *
   * Đây là HẠN HOÀN THÀNH, không phải một cái nhắc suông. Học thuật không chọn ngày thì
   * mặc định là Chủ nhật của tuần TIẾP THEO tính từ lúc bắt đầu thực hiện.
   */
  followup_due TEXT,

  /*
   * HẠN LÀM XONG PHƯƠNG ÁN — mốc thứ nhất trong hai mốc owner giữ (xác nhận 13/09/2026).
   *
   * HỌC THUẬT: hạn CẬP NHẬT gần nhất — trước hết Chủ nhật hằng tuần kể từ lúc phương án
   * bắt đầu chạy (mục 8.3). Mỗi chu kỳ mới đặt lại sang Chủ nhật kế tiếp.
   * Ý THỨC/KHÁC: hạn phải LÀM XONG phương án, tính từ lúc nhận case — Gấp 3 ngày, Cần chú
   * ý 5 ngày.
   *
   * Khác với `followup_due` (ngày dự kiến KẾT THÚC phương án) và `approval_due` (hạn Quản
   * lý trả lời). Ba mốc, ba câu hỏi khác nhau, nên không gộp cột.
   *
   * Quá hạn KHÔNG chặn gì — chỉ nổi lên màn việc để không ai bị bỏ quên.
   */
  action_due TEXT,

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
  /*
   * CHU KỲ THỨ MẤY của phương án này, và chu kỳ hiện tại bắt đầu ngày nào.
   *
   * Một phương án chạy nhiều chu kỳ hai tuần: hết chu kỳ thì giáo viên cập nhật kết quả,
   * chọn "theo dõi thêm" hoặc "tiếp tục", và một chu kỳ MỚI mở ra với hạn mới. Giữ số chu
   * kỳ để lịch sử đọc được là "đã ba vòng mà vẫn chưa chuyển", chứ không phải một cái hạn
   * bị đẩy lùi ba lần mà không ai biết.
   *
   * Hạn cũ KHÔNG bị xoá — nó nằm trong `case_followups` của chính chu kỳ đó.
   */
  cycle_no INTEGER NOT NULL DEFAULT 1,
  cycle_started_on TEXT,

  /*
   * PHƯƠNG ÁN NÀY BỊ THAY BẰNG PHƯƠNG ÁN NÀO — mục 7.7 [4].
   *
   * Khi giáo viên đề xuất một phương án mới thay cho phương án cũ, phương án cũ được khép
   * lại với lý do "Được thay thế". KHÔNG đánh dấu nó là "đã hoàn thành thành công" — nó
   * không thành công, đó là cả lý do phải thay. Nhưng cũng không để nó treo vô hạn, vì
   * case sẽ không bao giờ đủ điều kiện đóng.
   */
  closed_reason TEXT,                 -- NULL | 'superseded' | 'done'
  superseded_by INTEGER REFERENCES case_interventions(id),

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

  /*
   * BƯỚC TIẾP THEO người cập nhật đã chọn — complete | monitor | continue | propose | ask_manager.
   *
   * Ghi lại vì đây là QUYẾT ĐỊNH, không phải trạng thái suy được. Ba tháng sau, "lần đó em
   * chưa tiến bộ và cô chọn tiếp tục phương án cũ" là một câu khác hẳn "lần đó em chưa tiến
   * bộ và cô đổi sang tutor".
   */
  next_step TEXT,
  /** Chu kỳ thứ mấy, và hạn của CHÍNH chu kỳ đó — không bị ghi đè khi mở chu kỳ mới. */
  cycle_no INTEGER,
  cycle_due TEXT,
  /** Cập nhật sau hạn: giữ nguyên trong lịch sử, không reset để che quá hạn. */
  late INTEGER NOT NULL DEFAULT 0,

  /*
   * ĐIỂM GIÁO VIÊN TỰ ĐÁNH GIÁ khi cập nhật kết quả (mục 7.7 [5] Option 2).
   *
   * JSON: [{ "skill": "reading", "score": 24, "total": 40 }] hoặc band cho lớp Fast Track.
   *
   * ĐÂY KHÔNG PHẢI ĐIỂM CHÍNH THỨC. Nó không ghi đè điểm entrance/mock/test, không đổi mức
   * SOS, và trên biểu đồ tiến bộ nó dùng KÝ HIỆU KHÁC, không nối chung một đường với điểm
   * chính thức. Cô đọc một bài viết rồi ước lượng 5.5 là một thông tin có ích, nhưng nó
   * không cùng loại với 5.5 chấm trong phòng thi.
   */
  metrics TEXT,

  created_at TEXT NOT NULL
);
CREATE INDEX idx_followup_case ON case_followups(case_id);

/*
 * BẰNG CHỨNG gắn với case. Một case có thể liên kết nhiều bài đánh giá và nhiều ghi nhận.
 * `role` phân biệt bằng chứng GỐC (thứ mở ra case) với bằng chứng bổ sung và bằng chứng
 * kiểm chứng sau hỗ trợ.
 */
/*
 * BÁO CÁO THÀNH PHẦN CỦA MỘT ĐỢT CASE Ý THỨC/KHÁC (mục 7.2).
 *
 * Một case Ý thức/Khác là một ĐỢT, và một đợt chứa nhiều báo cáo của nhiều giáo viên trong
 * cùng một khoảng ngắn. Mỗi báo cáo giữ NGUYÊN của riêng nó: ai gửi, gửi lúc nào, thấy ở
 * môn nào, và mô tả bằng lời của chính người đó. Báo cáo sau KHÔNG ghi đè báo cáo trước —
 * đó là điều kiện để đọc lại một đợt và biết chuyện đã diễn ra như thế nào.
 *
 * `reported_on` là NGÀY GỬI CỦA HỆ THỐNG và là thứ duy nhất dùng để xét cửa sổ gộp. Ngày
 * người dùng khai ở ô "Theo dõi từ ngày" nằm ở `observed_on` và KHÔNG được dùng cho việc
 * này: nếu dùng, chỉ cần khai lùi ngày là đổi được cửa sổ gộp.
 */
CREATE TABLE case_reports (
  id INTEGER PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES sos_cases(id),
  reported_by INTEGER REFERENCES users(id),
  /* Môn giáo viên đang dạy khi thấy, hoặc để trống khi báo cáo không gắn với môn nào. */
  source_skill TEXT,
  /* Đợt đánh giá sinh ra tín hiệu, khi báo cáo này đến từ một mốc SOS. */
  source_attempt_id INTEGER REFERENCES assessment_attempts(id),
  reported_on TEXT NOT NULL,
  observed_on TEXT,
  summary TEXT NOT NULL,
  /* Gửi lại cùng một request không được tạo báo cáo thứ hai (mục 7.2). */
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_case_reports_case ON case_reports(case_id);

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
 * BẢNG `skill_checkins` ĐÃ BỎ Ở VÒNG 4 — cùng với khu "Điểm chính thức" và "Ghi nhận của
 * giáo viên" trên giao diện.
 *
 * Owner chốt 13/09/2026: giữ thêm một đường chấm điểm chạy song song với điểm MT tạo ra hai
 * nguồn số liệu đá nhau, và đó chính là thứ đang làm mọi bảng biểu lộn xộn. Giáo viên muốn
 * ghi nhận gì về một em thì đã có nút "+ Case" — ghi vào đó thì việc có người chịu trách
 * nhiệm, có phương án và có kết quả, thay vì một dòng nhận xét không dẫn tới đâu.
 */
/*
 * MỐC TRONG VÒNG ĐỜI MỘT CASE.
 *
 * Bảng này là thứ làm cho "case sống suốt khoá" đọc được. Trước vòng 4, mỗi lượt MT đẻ một
 * case mới nên lịch sử nằm ở việc có nhiều case; nay chỉ còn MỘT case cho mỗi (học viên,
 * hạng mục), nên chuyện đã xảy ra phải được ghi lại ở đây:
 *
 *   opened      mở case lần đầu
 *   repeat      MT sau vẫn trượt hạng mục này, case đang mở       → "chưa ăn thua"
 *   recurrence  MT sau trượt lại sau khi case ĐÃ chốt kết thúc    → "tưởng xong mà hỏng lại"
 *   passed      MT sau đã đạt kỳ vọng
 *   closed      chốt kết quả case
 *   extended    chốt nhưng kéo dài theo dõi, thêm phương án mới
 *
 * Mốc KHÔNG thay thế `case_interventions`: mốc nói ĐIỀU GÌ ĐÃ XẢY RA VỚI EM, phương án nói
 * MÌNH ĐÃ LÀM GÌ CHO EM. Màn case xếp xen kẽ hai thứ theo thời gian.
 *
 * `dedup_key` để chấm lại hay sửa điểm không nhân đôi mốc.
 */
/*
 * TÍN HIỆU — điểm dưới kỳ vọng sinh ra cái này, KHÔNG sinh ra case (mục 6.2).
 *
 * Một tín hiệu nói đúng một câu: "môn này của em này dưới kỳ vọng ở đợt đó, ai đó phải xem".
 * Nó KHÔNG nói vì sao, KHÔNG nói phải làm gì, và KHÔNG được đếm như một case đã xác định.
 *
 * Người phải xác minh: GVBM của chính môn đó; riêng tín hiệu Ý thức/Khác về GVCN để xem
 * tình hình chung. Hạn xác minh là BA NGÀY tính cả ngày đầu, đếm từ `raised_on` — ngày tín
 * hiệu được ghi nhận, không phải thứ Hai của tuần thi đã qua. Điểm nhập muộn vì thế không
 * làm giáo viên quá hạn ngay lúc điểm vừa được công bố.
 *
 * `dedup_key` khoá theo (đợt, kỹ năng) nên nhập bổ sung, chấm lại hay lưu lại nhiều lần
 * KHÔNG nhân tín hiệu và KHÔNG đặt lại hạn.
 */
CREATE TABLE case_signals (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  cycle_id INTEGER REFERENCES learning_cycles(id),
  attempt_id INTEGER REFERENCES assessment_attempts(id),
  class_id INTEGER REFERENCES classes(id),

  track TEXT NOT NULL,                -- academic | behaviour
  /* Ô nhập điểm sinh ra tín hiệu: listening | reading | writing1 | writing2 | speaking.
     Tín hiệu Ý thức/Khác không gắn với môn nào nên để trống. */
  skill TEXT,
  category TEXT,                      -- hạng mục GỢI Ý, người xác minh vẫn đổi được

  band REAL,                          -- band thực tế lúc sinh tín hiệu
  expectation REAL,                   -- kỳ vọng của đợt đó
  sos_level INTEGER,

  /* Ngày nghiệp vụ của kết quả (thứ Hai tuần thi) — KHÁC với ngày ghi nhận tín hiệu. */
  detected_on TEXT NOT NULL,
  raised_on TEXT NOT NULL,            -- ngày hệ thống ghi nhận và giao trách nhiệm
  verify_due TEXT NOT NULL,           -- raised_on + 2 ngày
  owner_user_id INTEGER REFERENCES users(id),

  -- pending (chờ xác minh) | linked (đã thành case) | noted (đã xem, không thành case) | withdrawn
  status TEXT NOT NULL DEFAULT 'pending',
  case_id INTEGER REFERENCES sos_cases(id),
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TEXT,
  resolution_note TEXT,
  withdrawn_reason TEXT,

  dedup_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX idx_signal_student ON case_signals(student_id);
CREATE INDEX idx_signal_status ON case_signals(status);
CREATE INDEX idx_signal_owner ON case_signals(owner_user_id);
CREATE INDEX idx_signal_attempt ON case_signals(attempt_id);

CREATE TABLE case_milestones (
  id INTEGER PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES sos_cases(id),
  kind TEXT NOT NULL,
  attempt_id INTEGER REFERENCES assessment_attempts(id),
  attempt_no INTEGER,
  -- Ảnh chụp con số lúc đó, để đọc lại không phải truy ngược mà vẫn đúng bối cảnh cũ.
  band REAL,
  expectation REAL,
  sos_level INTEGER,
  occurred_on TEXT NOT NULL,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  dedup_key TEXT
);
CREATE UNIQUE INDEX idx_milestone_dedup ON case_milestones(dedup_key);
CREATE INDEX idx_milestone_case ON case_milestones(case_id, occurred_on);

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

/*
 * LỊCH SỬ CHỈNH SỬA BÁO CÁO (mục 14.2).
 *
 * `unit_reports` giữ NỘI DUNG HIỆN TẠI của một ô; bảng này giữ mọi lần ô đó được sửa. Không
 * có nó thì một ô đổi từ "Có vấn đề" sang "Ổn" trước giờ họp là chuyện không ai truy lại
 * được — và đó đúng là lúc người ta cần truy nhất.
 */
CREATE TABLE unit_report_history (
  id INTEGER PRIMARY KEY,
  reporting_unit_id INTEGER NOT NULL REFERENCES reporting_units(id),
  period_id INTEGER NOT NULL REFERENCES report_periods(id),
  category_key TEXT NOT NULL,
  status TEXT,
  note TEXT,
  actor_user_id INTEGER REFERENCES users(id),
  at TEXT NOT NULL
);
CREATE INDEX idx_urh_cell ON unit_report_history(reporting_unit_id, period_id, category_key);

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

  /*
   * TIẾN ĐỘ CÔNG VIỆC (mục 8) — bốn cột thêm ở vòng này.
   *
   * `group_key`   một trong bốn nhóm quản lý; NULL với việc cũ chưa phân nhóm
   * `parent_task_id` công việc con — CHỈ MỘT TẦNG. Cây nhiều tầng nghe thì linh hoạt,
   *               nhưng đọc một bảng lồng bốn tầng thì không ai biết việc nào của ai nữa.
   * `watcher_user_id` người THEO DÕI — nhìn thấy nhưng KHÔNG tự có quyền sửa (mục 8.3)
   * `stop_reason` lý do tạm ngưng hoặc dừng hẳn, bắt buộc với hai trạng thái đó
   * `review_on`   ngày hẹn xem lại của việc đang tạm ngưng
   */
  group_key TEXT,
  parent_task_id INTEGER REFERENCES tasks(id),
  watcher_user_id INTEGER REFERENCES users(id),
  stop_reason TEXT,
  review_on TEXT,
  /*
   * HAI LOẠI VIỆC KHÁC HẲN NHAU:
   *   branch_ops   — giáo trình, vận hành chi nhánh. KHÔNG gắn học viên nào.
   *   teacher_task — giao giáo viên, gắn lớp/kỹ năng/học viên và TOẢ RA thành phương án.
   */
  kind TEXT NOT NULL DEFAULT 'branch_ops',
  class_id INTEGER REFERENCES classes(id),
  track TEXT,                         -- academic | behaviour, chỉ có ở teacher_task
  topic TEXT,                         -- kỹ năng hoặc nhóm ý thức
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

/*
 * VIỆC QUẢN LÝ GIAO CHO GIÁO VIÊN, TOẢ RA THÀNH PHƯƠNG ÁN CỦA TỪNG EM.
 *
 * Một task cho cả lớp 13 em phải là MỘT task cập nhật MỘT LẦN, không phải 13 bản sao —
 * nếu bắt giáo viên cập nhật 13 lần thì họ bỏ qua, và dữ liệu tiến độ thành rác.
 *
 * Bảng này nối task với những em nó chạm tới, và với vấn đề đã mở cho từng em. Owner chốt:
 * Quản lý giao việc cho một em TỨC LÀ em đó đang có vấn đề — kể cả khi chưa ai ghi gì.
 * Vấn đề mở kiểu này vào thẳng trạng thái "đang xử lý" (nó đã có phương án rồi, chính là
 * task này), không rơi vào danh sách "chưa có phương án hỗ trợ".
 */
CREATE TABLE task_students (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  case_id INTEGER REFERENCES sos_cases(id),
  intervention_id INTEGER REFERENCES case_interventions(id),
  created_at TEXT NOT NULL,
  UNIQUE (task_id, student_id)
);
CREATE INDEX idx_task_students_task ON task_students(task_id);
CREATE INDEX idx_task_students_student ON task_students(student_id);

/*
 * LỰA CHỌN RIÊNG CỦA TỪNG TÀI KHOẢN — bộ cột đang xem, lần cuối chọn chi nhánh nào…
 *
 * Cố tình là một bảng khoá–giá trị chứ không phải một cột cho mỗi thứ: đây là sở thích hiển
 * thị, không phải dữ liệu nghiệp vụ. Mất hết cũng không ai sai việc gì, nên không đáng để
 * thêm một cột và một bước nâng cấp mỗi lần có một tuỳ chọn mới.
 */
CREATE TABLE user_prefs (
  user_id INTEGER NOT NULL REFERENCES users(id),
  key TEXT NOT NULL,
  value TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

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

/*
 * MỖI LẦN CẬP NHẬT MỘT CÔNG VIỆC — ai, lúc nào, trạng thái nào, ghi chú gì (mục 8.4).
 *
 * MỘT công việc có MỘT định danh xuyên nhiều tuần; tuần chỉ là cách LỌC các lần cập nhật,
 * không phải lý do để nhân bản công việc mỗi tuần. Bản trước không có bảng này nên "tiến độ
 * tuần" phải suy từ trường `progress` hiện tại — tức là mất sạch những gì đã xảy ra trước đó.
 */
CREATE TABLE task_updates (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  /* Tuần của lần cập nhật — để bộ lọc "tuần cập nhật" chạy mà không phải đoán từ ngày. */
  period_id INTEGER REFERENCES report_periods(id),
  progress TEXT NOT NULL,
  note TEXT,
  actor_user_id INTEGER REFERENCES users(id),
  updated_on TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_task_update_task ON task_updates(task_id);
CREATE INDEX idx_task_update_period ON task_updates(period_id);

/*
 * CASE LÀM CĂN CỨ cho một công việc quản lý (mục 8.7).
 *
 * Liên kết là để nói "việc này sinh ra từ mấy case này", KHÔNG phải để tự tạo phương án cho
 * từng học viên và cũng không phải để hoàn thành việc là đóng case. Hai thứ có nhịp khác
 * nhau: tổ chức một lớp tutor xong không có nghĩa là em nào cũng đã tiến bộ.
 */
CREATE TABLE task_case_links (
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  case_id INTEGER NOT NULL REFERENCES sos_cases(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (task_id, case_id)
);

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
