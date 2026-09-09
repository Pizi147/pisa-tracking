/**
 * Dữ liệu tĩnh cho seed. Toàn bộ tên người là GIẢ, không lấy từ tài liệu nguồn.
 *
 * Ngày demo 23/09/2026 là thứ Tư của tuần W4 SEP. Chọn ngày này để thấy đủ ba mốc hạn
 * trong cùng một màn hình: tuần W2 SEP đã quá hạn, tuần W3 SEP đúng hạn hôm nay
 * (chưa quá hạn), tuần W4 SEP và W1 OCT còn ở phía trước.
 */
export const DEMO_DATE = '2026-09-23';

export const BRANCHES = [
  { code: 'MB', name: 'Monbay' },
  { code: 'BC', name: 'Bãi Cháy' },
  { code: 'CP', name: 'Cẩm Phả' },
  { code: 'HD', name: 'Hải Dương' },
  { code: 'UB', name: 'Uông Bí' },
] as const;

export const ROLES = [
  { key: 'system_admin', name: 'Quản trị hệ thống' },
  { key: 'branch_admin', name: 'Admin chi nhánh' },
  { key: 'manager', name: 'Quản lý' },
  { key: 'teacher', name: 'Giáo viên' },
] as const;

/**
 * Quyền theo vai trò. Phạm vi chi nhánh nằm ở từng grant, không suy từ tên vai trò:
 * một Quản lý chỉ toàn hệ thống khi grant của họ có branch_id = NULL.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Quản trị phần mềm: toàn quyền, kể cả các ngoại lệ sửa sai về lịch.
  system_admin: [
    'plan.week', 'schedule.date', 'schedule.speaking', 'attempt.cancel', 'attempt.skip_skill',
    'deadline.override', 'attempt.view', 'score.override', 'sos.edit',
    'student.view', 'student.edit', 'meeting.view', 'meeting.edit', 'admin.config',
  ],
  // Văn phòng chi nhánh: CẬP NHẬT NGÀY MT thực tế theo lịch bộ phận xếp lịch đã bố trí,
  // nhập bù điểm, giữ danh sách lớp. KHÔNG chốt tuần (việc của Quản lý) và KHÔNG vào
  // Tiến trình công việc (module quản lý).
  branch_admin: [
    'schedule.date', 'schedule.speaking', 'attempt.cancel', 'attempt.skip_skill',
    'deadline.override', 'attempt.view', 'score.override', 'sos.edit',
    'student.view', 'student.edit',
  ],
  // Quản lý: chốt TUẦN kế hoạch, và CŨNG cập nhật được ngày MT thực tế — khi học viên nghỉ
  // và phải dời, Quản lý sửa ngay chứ không phải chờ Admin chi nhánh.
  manager: [
    'plan.week', 'schedule.date', 'schedule.speaking', 'attempt.cancel', 'attempt.skip_skill',
    'deadline.override', 'attempt.view',
    'sos.edit', 'student.view', 'student.edit', 'meeting.view', 'meeting.edit',
  ],
  // Giáo viên: nhập điểm và đánh giá ĐÚNG kỹ năng được phân công.
  // GVCN không vì chủ nhiệm mà có thêm quyền lịch; riêng GV Speaking sửa được NGÀY Speaking
  // vì Speaking thường diễn ra khác ngày với buổi L/R/W.
  teacher: ['attempt.view', 'score.edit', 'estimate.edit', 'schedule.speaking', 'sos.edit', 'student.view'],
};

/** Mã lớp luôn bắt đầu bằng mã chi nhánh. Loại lớp là nhãn tự do do quản lý đặt. */
export type PlanStep = {
  attemptNo: number;
  /** Tuần kế hoạch do Quản lý chốt. Luôn có khi lượt đã được lên kế hoạch. */
  week: string;                 // ngày thứ Hai của tuần
  /** Ngày giờ buổi chính do Admin chi nhánh chốt. Bỏ trống = đã có tuần, chưa có ngày. */
  lrwAt?: string;
  /** Speaking có thể khác ngày, vẫn thuộc cùng lượt MT này. */
  speakingAt?: string;
  done: boolean;
};

export type ClassSeed = {
  code: string; branch: string; kind: string; route: 'LT1' | 'LT2' | null;
  isFulltime: boolean; startDate: string; students: number;
  plan: PlanStep[];
};

export const CLASSES: ClassSeed[] = [
  {
    code: 'MB-FT 101', branch: 'MB', kind: 'FT', route: 'LT1', isFulltime: true,
    startDate: '2026-06-22', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-07-27', lrwAt: '2026-07-27 18:00', done: true },
      // W2 SEP — hạn mặc định 16/09, đã quá hạn so với ngày demo 23/09.
      { attemptNo: 2, week: '2026-09-07', lrwAt: '2026-09-10 18:00', speakingAt: '2026-09-11 09:00', done: true },
      // Đã chốt tuần, CHƯA có ngày — việc của Admin chi nhánh.
      { attemptNo: 3, week: '2026-10-05', done: false },
    ],
  },
  {
    code: 'MB-FT 102', branch: 'MB', kind: 'FT', route: 'LT2', isFulltime: true,
    startDate: '2026-06-29', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-08-03', lrwAt: '2026-08-03 18:00', done: true },
      // W3 SEP — hạn mặc định rơi đúng ngày demo 23/09, chưa quá hạn.
      { attemptNo: 2, week: '2026-09-14', lrwAt: '2026-09-17 18:00', done: true },
      { attemptNo: 3, week: '2026-10-12', done: false },
    ],
  },
  {
    code: 'MB-FOUND 12', branch: 'MB', kind: 'FOUND', route: null, isFulltime: false,
    startDate: '2026-08-10', students: 5, plan: [],
  },
  {
    code: 'BC-FT 205', branch: 'BC', kind: 'FT', route: 'LT1', isFulltime: true,
    startDate: '2026-06-22', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-07-27', lrwAt: '2026-07-27 18:00', done: true },
      { attemptNo: 2, week: '2026-09-07', lrwAt: '2026-09-10 18:00', done: true },
      { attemptNo: 3, week: '2026-10-05', done: false },
    ],
  },
  {
    code: 'BC-BE 80', branch: 'BC', kind: 'BE', route: null, isFulltime: false,
    startDate: '2026-07-13', students: 5, plan: [],
  },
  {
    code: 'CP-FT 110', branch: 'CP', kind: 'FT', route: 'LT1', isFulltime: true,
    startDate: '2026-07-06', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-08-10', lrwAt: '2026-08-10 18:00', done: true },
      // W4 SEP — tuần đang xem, vừa mock xong, hạn 30/09 chưa tới.
      { attemptNo: 2, week: '2026-09-21', lrwAt: '2026-09-22 18:00', done: true },
      { attemptNo: 3, week: '2026-10-19', done: false },
    ],
  },
  {
    code: 'CP-FT 111', branch: 'CP', kind: 'FT', route: 'LT2', isFulltime: true,
    startDate: '2026-06-29', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-08-03', lrwAt: '2026-08-03 18:00', done: true },
      { attemptNo: 2, week: '2026-09-14', lrwAt: '2026-09-17 18:00', done: true },
      { attemptNo: 3, week: '2026-10-12', done: false },
    ],
  },
  {
    code: 'HD-FT 302', branch: 'HD', kind: 'FT', route: 'LT1', isFulltime: true,
    startDate: '2026-07-06', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-08-10', lrwAt: '2026-08-10 18:00', done: true },
      { attemptNo: 2, week: '2026-09-21', lrwAt: '2026-09-25 18:00', done: false },
    ],
  },
  {
    code: 'HD-ELE 01', branch: 'HD', kind: 'ELE', route: null, isFulltime: false,
    startDate: '2026-08-24', students: 5, plan: [],
  },
  {
    code: 'UB-FT 401', branch: 'UB', kind: 'FT', route: 'LT2', isFulltime: true,
    startDate: '2026-05-25', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-06-29', lrwAt: '2026-06-29 18:00', done: true },
      { attemptNo: 2, week: '2026-08-17', lrwAt: '2026-08-17 18:00', done: true },
      { attemptNo: 3, week: '2026-09-14', lrwAt: '2026-09-14 18:00', done: true },
      { attemptNo: 4, week: '2026-10-05', done: false },
    ],
  },
];

// ---------------------------------------------------------------- tên giả

export const SURNAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ',
  'Ngô', 'Dương', 'Lý', 'Phan', 'Đinh',
];
export const MIDDLE_NAMES = ['Minh', 'Thu', 'Quang', 'Khánh', 'Bảo', 'Gia', 'Hải', 'Thanh', 'Tuấn', 'Ngọc'];
export const GIVEN_NAMES = [
  'An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Huy', 'Khoa', 'Lam', 'Linh',
  'Mai', 'Nam', 'Nhi', 'Phong', 'Quân', 'Sơn', 'Thảo', 'Trang', 'Uyên', 'Vy',
  'Yến', 'Đạt', 'Hưng', 'Kiên', 'Loan', 'My', 'Ninh', 'Phúc', 'Quyên', 'Trâm',
];

/** Target của lộ trình. Kỳ vọng từng lần MT tính từ đây. */
export const TARGET_SCORES = [6.0, 6.5, 7.0, 6.5, 5.5];

/**
 * Kịch bản kết quả theo vị trí học sinh trong lớp.
 *
 *  - `fails`: số kỹ năng dưới kỳ vọng, quyết định mức SOS (0 → đạt, 1 → SOS 1, ...).
 *  - `missing`: các kỹ năng CHƯA nhập điểm, để thấy tiến độ n/n và trạng thái quá hạn.
 *  - `skip`: kỹ năng ĐÁNH GIÁ được Quản lý đánh dấu không mock, SOS tính trên phần còn lại.
 *  - `performedOnly`: đã mock nhưng chưa nhập điểm — khác hẳn chưa mock.
 */
export type Outcome = { fails: number; missing?: string[]; skip?: string; performedOnly?: string[] };

export const MT_OUTCOMES: Outcome[][] = [
  // [MT1, MT2, MT3, MT4] cho từng vị trí học sinh trong lớp
  [{ fails: 0 }, { fails: 0 }, { fails: 0 }, { fails: 0 }],
  [{ fails: 1 }, { fails: 0 }, { fails: 1 }, { fails: 0 }],
  [{ fails: 0 }, { fails: 1 }, { fails: 0 }, { fails: 1 }],
  [{ fails: 2 }, { fails: 2 }, { fails: 2 }, { fails: 2 }],
  [{ fails: 1 }, { fails: 3 }, { fails: 3 }, { fails: 1 }],
  // Học sinh không mock Speaking ở MT2: Quản lý đánh dấu không mock, SOS tính trên 3 kỹ năng.
  [{ fails: 3 }, { fails: 2, skip: 'speaking' }, { fails: 2 }, { fails: 3 }],
  [{ fails: 0 }, { fails: 0, missing: ['writing2'] }, { fails: 0 }, { fails: 0 }],
  // Đã mock Speaking nhưng chưa nhập điểm, và Reading thì chưa mock — hai trạng thái khác nhau.
  [{ fails: 4 }, { fails: 1, missing: ['reading'], performedOnly: ['speaking'] }, { fails: 1 }, { fails: 2 }],
];

/** Trạng thái ghi nhận xử lý, xoay vòng để mỗi mức tiến độ đều có mẫu để xem. */
export const CASE_PATTERNS = ['none', 'named_only', 'in_progress', 'done'] as const;
export type CasePattern = (typeof CASE_PATTERNS)[number];
