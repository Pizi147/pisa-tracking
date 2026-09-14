/**
 * Dữ liệu tĩnh cho seed. Toàn bộ tên người là GIẢ, không lấy từ tài liệu nguồn.
 *
 * NGÀY DEMO 14/09/2026 — thứ Hai, tuần W3 SEP. Chọn đúng đầu tuần vì bản demo phải cho
 * thấy được cả ba trạng thái của một tuần cùng lúc:
 *
 *   W2 SEP (07/09)  đã qua   → việc còn thiếu ở tuần đó là ĐÃ QUÁ HẠN
 *   W3 SEP (14/09)  hôm nay  → việc của tuần này đang chờ làm
 *   W4 SEP trở đi            → chưa tới lượt, không được hiện lên như việc cần làm
 *
 * Và vì 14/09 là tuần học thứ 8 của lớp FOU mở ngày 27/07, thứ 5 của lớp ELE mở 17/08,
 * nên ba thông báo của lớp Normal (đang trong tuần Progress Test, đang trong tuần Final
 * Test, đã học hết chương trình) đều có lớp thật để hiện, không phải chỉ có trên lý thuyết.
 */
export const DEMO_DATE = '2026-09-14';

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
    'plan.week', 'attempt.cancel', 'attempt.skip_skill',
    'deadline.override', 'attempt.view', 'score.override', 'case.view', 'sos.edit', 'case.close', 'case.approve',
    'class.assign', 'class.edit', 'student.view', 'student.edit',
    'meeting.view', 'meeting.edit', 'admin.config',
  ],
  /*
   * Văn phòng chi nhánh: giữ danh sách lớp và học viên, ghi phân công giáo viên mà Quản lý
   * đã quyết ở ngoài, và xử lý các ngoại lệ về lượt MT (huỷ lượt, bỏ một kỹ năng, đặt hạn
   * nhập điểm riêng).
   *
   * KHÔNG chốt tuần MT (việc của Quản lý), KHÔNG nhập điểm (owner chốt 10/09/2026 — trước
   * đây họ có quyền nhập bù; nay giáo viên vắng thì Quản lý đổi phân công chứ văn phòng
   * không gõ điểm hộ), và KHÔNG vào Tiến trình công việc.
   */
  branch_admin: [
    'attempt.cancel', 'attempt.skip_skill',
    'deadline.override', 'attempt.view', 'sos.edit', 'class.assign', 'class.edit',
    'student.view', 'student.edit',
  ],
  // Quản lý: chốt TUẦN của mọi lượt MT trong chi nhánh mình.
  manager: [
    'plan.week', 'attempt.cancel', 'attempt.skip_skill',
    'deadline.override', 'attempt.view',
    // Quản lý đóng được case trong chi nhánh mình; GVCN đóng case lớp mình (kiểm theo phân công).
    'case.view', 'sos.edit', 'case.close', 'case.approve', 'class.assign', 'class.edit',
    'student.view', 'student.edit', 'meeting.view', 'meeting.edit',
  ],
  // Giáo viên: nhập điểm và đánh giá ĐÚNG kỹ năng được phân công.
  // GVCN không vì chủ nhiệm mà có thêm quyền về lịch.
  teacher: ['attempt.view', 'score.edit', 'estimate.edit',
    'case.view', 'sos.edit', 'student.view'],
};

/** Mã lớp luôn bắt đầu bằng mã chi nhánh. Loại lớp là nhãn tự do do quản lý đặt. */
export type PlanStep = {
  attemptNo: number;
  /** TUẦN của lượt MT. Đây là thứ duy nhất định vị một lượt trên lịch. */
  week: string;                 // ngày thứ Hai của tuần
  done: boolean;
};

export type ClassSeed = {
  code: string; branch: string; kind: string; route: 'LT1' | 'LT2' | null;
  isFastTrack: boolean; startDate: string; students: number;
  plan: PlanStep[];
};

export const CLASSES: ClassSeed[] = [
  /*
   * MỘT LỚP = MỘT TÌNH HUỐNG. Bản demo cố tình ÍT LỚP và ÍT HỌC VIÊN: người xem phải theo
   * dõi được từng em, chứ không phải cuộn qua một trăm cái tên giả giống hệt nhau.
   *
   * Lịch MT của lớp Fast Track bám mốc tuần học 6 / 12 / 16 / 20 — đúng cái hệ thống tự đề
   * xuất — trừ vài chỗ cố ý lệch, vì ngoài đời Quản lý vẫn chốt tay và hệ thống phải chịu.
   */

  // MB · lớp chạy lâu nhất: hai đợt MT đã xong, đợt thứ ba rơi đúng TUẦN NÀY.
  {
    code: 'MB-FT 101', branch: 'MB', kind: 'FT', route: 'LT1', isFastTrack: true,
    startDate: '2026-06-01', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-07-06', done: true },   // tuần học 6
      { attemptNo: 2, week: '2026-08-17', done: true }, // tuần 12
      // Tuần học 16 = W3 SEP 2026 = TUẦN NÀY. Điểm phải xong trước hết thứ Tư tuần sau.
      { attemptNo: 3, week: '2026-09-14', done: false },
    ],
  },
  // MB · lớp mới qua MT1, MT2 rơi đúng tuần này — để so với lớp trên ở số lượt đã xong.
  {
    code: 'MB-FT 102', branch: 'MB', kind: 'FT', route: 'LT2', isFastTrack: true,
    startDate: '2026-06-29', students: 6,
    plan: [
      { attemptNo: 1, week: '2026-08-03', done: true },   // tuần học 6
      { attemptNo: 2, week: '2026-09-14', done: false }, // tuần 12
    ],
  },
  // MB · lớp Normal ĐANG TRONG TUẦN FINAL TEST (tuần học 8 của chương trình Foundation).
  {
    code: 'MB-FOU 12', branch: 'MB', kind: 'FOU', route: null, isFastTrack: false,
    startDate: '2026-07-27', students: 6, plan: [],
  },

  // BC · MT của TUẦN TRƯỚC vẫn chưa có điểm → đây là chỗ nhãn "quá hạn" phải hiện lên.
  {
    code: 'BC-FT 205', branch: 'BC', kind: 'FT', route: 'LT2', isFastTrack: true,
    startDate: '2026-07-06', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-08-10', done: true },   // tuần học 6
      // Quản lý chốt sớm hơn mốc tuần 12; W2 SEP 2026 đã trôi qua mà điểm vẫn trống.
      { attemptNo: 2, week: '2026-09-07', done: false },
      { attemptNo: 3, week: '2026-10-19', done: false },
    ],
  },
  // BC · lớp Normal ĐANG TRONG TUẦN PROGRESS TEST (tuần học 5 của chương trình Elementary).
  {
    code: 'BC-ELE 01', branch: 'BC', kind: 'ELE', route: null, isFastTrack: false,
    startDate: '2026-08-17', students: 6, plan: [],
  },

  // CP · ba đợt MT đã xong → em nào yếu đi yếu lại sẽ có CASE KÉO DÀI QUA BA LƯỢT.
  {
    code: 'CP-FT 110', branch: 'CP', kind: 'FT', route: 'LT1', isFastTrack: true,
    startDate: '2026-05-04', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-06-08', done: true },   // tuần học 6
      { attemptNo: 2, week: '2026-07-20', done: true },   // tuần học 12
      { attemptNo: 3, week: '2026-08-17', done: true },   // tuần học 16
      { attemptNo: 4, week: '2026-10-12', done: false },
    ],
  },

  // HD · lớp MỚI MỞ: chưa có kết quả nào, đợt MT đầu rơi đúng tuần này.
  {
    code: 'HD-FT 302', branch: 'HD', kind: 'FT', route: 'LT1', isFastTrack: true,
    startDate: '2026-08-10', students: 6,
    plan: [
      { attemptNo: 1, week: '2026-09-14', done: false },  // tuần học 6
    ],
  },

  // UB · lớp gần cuối lộ trình: bốn đợt MT, đợt cuối vừa thi TUẦN TRƯỚC.
  {
    code: 'UB-FT 401', branch: 'UB', kind: 'FT', route: 'LT2', isFastTrack: true,
    startDate: '2026-04-27', students: 8,
    plan: [
      { attemptNo: 1, week: '2026-06-01', done: true },   // tuần học 6
      { attemptNo: 2, week: '2026-07-13', done: true },   // tuần học 12
      { attemptNo: 3, week: '2026-08-10', done: true },   // tuần học 16
      { attemptNo: 4, week: '2026-09-07', done: true },   // tuần học 20
    ],
  },
  /*
   * UB · lớp Normal ĐÃ HỌC HẾT CHƯƠNG TRÌNH — các em bắt buộc phải được xếp lớp tiếp.
   *
   * Lớp này cố ý mang MÃ CŨ "FOUND" chứ không phải "FOU": trung tâm đã đặt tên lớp như vậy
   * từ trước, và đổi tên lớp cũ chỉ vì phần mềm chuẩn hoá lại mã là chuyện không được phép.
   * Hệ thống đọc mã cũ ra đúng chương trình Foundation mà không sửa gì trên mã lớp.
   */
  {
    code: 'UB-FOUND 07', branch: 'UB', kind: 'FOUND', route: null, isFastTrack: false,
    startDate: '2026-07-06', students: 6, plan: [],
  },
];

/**
 * PHÂN CÔNG GIÁO VIÊN CỐ TÌNH THIẾU ở vài lớp.
 *
 * Nhãn "Thiếu GV R, L" và nhãn "Chưa có GVCN" chỉ chứng minh được là nó chạy khi có lớp
 * thật đang thiếu. Lớp nào không nằm trong bảng này thì được phân công đầy đủ.
 */
export const TEACHER_GAPS: Record<string, { skills?: string[]; noCore?: boolean }> = {
  // Lớp mới mở, chưa xếp xong người: thiếu GV cả hai phần Writing.
  'HD-FT 302': { skills: ['writing1', 'writing2'] },
  // Lớp Normal vừa khai giảng ở chi nhánh xa: chưa ai nhận chủ nhiệm.
  'BC-ELE 01': { noCore: true },
  // Thiếu đúng một kỹ năng — trường hợp hay gặp nhất.
  'UB-FOUND 07': { skills: ['pronunciation'] },
};

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
 * Kịch bản kết quả theo vị trí học viên trong lớp.
 *
 *  - `fails`: số kỹ năng dưới kỳ vọng, quyết định mức SOS (0 → đạt, 1 → SOS 1, ...).
 *  - `missing`: các kỹ năng CHƯA nhập điểm, để thấy tiến độ n/n và trạng thái quá hạn.
 *  - `skip`: kỹ năng ĐÁNH GIÁ được Quản lý đánh dấu không mock, SOS tính trên phần còn lại.
 */
export type Outcome = { fails: number; missing?: string[]; skip?: string };

export const MT_OUTCOMES: Outcome[][] = [
  // [MT1, MT2, MT3, MT4] cho từng vị trí học viên trong lớp
  [{ fails: 0 }, { fails: 0 }, { fails: 0 }, { fails: 0 }],
  [{ fails: 1 }, { fails: 0 }, { fails: 1 }, { fails: 0 }],
  [{ fails: 0 }, { fails: 1 }, { fails: 0 }, { fails: 1 }],
  [{ fails: 2 }, { fails: 2 }, { fails: 2 }, { fails: 2 }],
  [{ fails: 1 }, { fails: 3 }, { fails: 3 }, { fails: 1 }],
  // Học viên không mock Speaking ở MT2: Quản lý đánh dấu không mock, SOS tính trên 3 kỹ năng.
  [{ fails: 3 }, { fails: 2, skip: 'speaking' }, { fails: 2 }, { fails: 3 }],
  [{ fails: 0 }, { fails: 0, missing: ['writing2'] }, { fails: 0 }, { fails: 0 }],
  [{ fails: 4 }, { fails: 1, missing: ['reading', 'speaking'] }, { fails: 1 }, { fails: 2 }],
];

/** Trạng thái ghi nhận xử lý, xoay vòng để mỗi mức tiến độ đều có mẫu để xem. */
export const CASE_PATTERNS = ['none', 'named_only', 'in_progress', 'done'] as const;
export type CasePattern = (typeof CASE_PATTERNS)[number];
