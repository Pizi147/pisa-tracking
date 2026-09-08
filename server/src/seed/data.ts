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
  { key: 'admin', name: 'Admin' },
  { key: 'branch_admin', name: 'Admin chi nhánh' },
  { key: 'manager', name: 'Quản lý' },
  { key: 'teacher', name: 'Giáo viên' },
] as const;

/**
 * Quyền theo vai trò. Phạm vi chi nhánh nằm ở từng grant, không suy từ tên vai trò:
 * một Quản lý chỉ toàn hệ thống khi grant của họ có branch_id = NULL.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'mock.view', 'mock.schedule', 'mock.cancel', 'score.edit', 'sos.edit', 'sos.confirm',
    'student.view', 'student.edit', 'meeting.view', 'meeting.edit', 'admin.config',
  ],
  branch_admin: [
    'mock.view', 'mock.schedule', 'mock.cancel', 'score.edit', 'sos.edit', 'sos.confirm',
    'student.view', 'student.edit', 'meeting.view', 'meeting.edit',
  ],
  manager: [
    'mock.view', 'mock.schedule', 'mock.cancel', 'sos.edit', 'sos.confirm',
    'student.view', 'student.edit', 'meeting.view', 'meeting.edit',
  ],
  // Giáo viên còn bị siết thêm bởi phân công lớp/kỹ năng, xem permissions.ts.
  teacher: ['mock.view', 'mock.schedule', 'score.edit', 'sos.edit', 'student.view'],
};

/** Mã lớp luôn bắt đầu bằng mã chi nhánh. Loại lớp là nhãn tự do do quản lý đặt. */
export type ClassSeed = {
  code: string; branch: string; kind: string; route: 'LT1' | 'LT2' | null;
  isFulltime: boolean; startDate: string; students: number;
  /** Kế hoạch Mock của cả lớp: ngày dự kiến theo từng lần MT. */
  plan: { attemptNo: number; date: string; taken: boolean }[];
};

export const CLASSES: ClassSeed[] = [
  {
    code: 'MB-FT 101', branch: 'MB', kind: 'FT', route: 'LT1', isFulltime: true,
    startDate: '2026-06-22', students: 8,
    plan: [
      { attemptNo: 1, date: '2026-07-27', taken: true },
      { attemptNo: 2, date: '2026-09-10', taken: true },   // W2 SEP — hạn 16/09, đã quá hạn
      { attemptNo: 3, date: '2026-10-05', taken: false },
    ],
  },
  {
    code: 'MB-FT 102', branch: 'MB', kind: 'FT', route: 'LT2', isFulltime: true,
    startDate: '2026-06-29', students: 8,
    plan: [
      { attemptNo: 1, date: '2026-08-03', taken: true },
      { attemptNo: 2, date: '2026-09-17', taken: true },   // W3 SEP — hạn đúng hôm nay 23/09
      { attemptNo: 3, date: '2026-10-12', taken: false },
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
      { attemptNo: 1, date: '2026-07-27', taken: true },
      { attemptNo: 2, date: '2026-09-10', taken: true },
      { attemptNo: 3, date: '2026-10-05', taken: false },
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
      { attemptNo: 1, date: '2026-08-10', taken: true },
      { attemptNo: 2, date: '2026-09-22', taken: true },  // W4 SEP — vừa thi, hạn 30/09 chưa tới
      { attemptNo: 3, date: '2026-10-19', taken: false },
    ],
  },
  {
    code: 'CP-FT 111', branch: 'CP', kind: 'FT', route: 'LT2', isFulltime: true,
    startDate: '2026-06-29', students: 8,
    plan: [
      { attemptNo: 1, date: '2026-08-03', taken: true },
      { attemptNo: 2, date: '2026-09-17', taken: true },
      { attemptNo: 3, date: '2026-10-12', taken: false },
    ],
  },
  {
    code: 'HD-FT 302', branch: 'HD', kind: 'FT', route: 'LT1', isFulltime: true,
    startDate: '2026-07-06', students: 8,
    plan: [
      { attemptNo: 1, date: '2026-08-10', taken: true },
      { attemptNo: 2, date: '2026-09-25', taken: false }, // W4 SEP
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
      { attemptNo: 1, date: '2026-06-29', taken: true },
      { attemptNo: 2, date: '2026-08-17', taken: true },
      { attemptNo: 3, date: '2026-09-14', taken: true },  // W3 SEP — MT3 mở nhóm case có vận hành
      { attemptNo: 4, date: '2026-10-05', taken: false },
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

export const COMMITTED_SCORES = [6.0, 6.5, 7.0, 6.5, 5.5];

/**
 * Kịch bản kết quả theo vị trí học sinh trong lớp.
 *
 *  - `fails`: số kỹ năng dưới kỳ vọng, quyết định mức SOS (0 → đạt, 1 → SOS 1, ...).
 *  - `missing`: các kỹ năng CHƯA nhập điểm, để thấy tiến độ n/4 và trạng thái quá hạn.
 *  - `splitWeek`: Speaking thi trước một tuần, bốn kỹ năng còn lại thi tuần sau.
 */
export type Outcome = { fails: number; missing?: string[]; splitWeek?: boolean };

export const MT_OUTCOMES: Outcome[][] = [
  // [MT1, MT2, MT3, MT4] cho từng vị trí học sinh trong lớp
  [{ fails: 0 }, { fails: 0 }, { fails: 0 }, { fails: 0 }],
  [{ fails: 1 }, { fails: 0 }, { fails: 1 }, { fails: 0 }],
  [{ fails: 0 }, { fails: 1 }, { fails: 0 }, { fails: 1 }],
  [{ fails: 2 }, { fails: 2 }, { fails: 2 }, { fails: 2 }],
  [{ fails: 1 }, { fails: 3, splitWeek: true }, { fails: 3 }, { fails: 1 }],
  [{ fails: 3 }, { fails: 2 }, { fails: 2 }, { fails: 3 }],
  [{ fails: 0 }, { fails: 0, missing: ['writing2'] }, { fails: 0 }, { fails: 0 }],
  [{ fails: 4 }, { fails: 1, missing: ['speaking', 'reading'] }, { fails: 1 }, { fails: 2 }],
];

/** Trạng thái ghi nhận xử lý, xoay vòng để mỗi mức tiến độ đều có mẫu để xem. */
export const CASE_PATTERNS = ['none', 'named_only', 'in_progress', 'done'] as const;
export type CasePattern = (typeof CASE_PATTERNS)[number];
