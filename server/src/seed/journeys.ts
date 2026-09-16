/**
 * BỘ DEMO DỰNG TỪ HÀNH TRÌNH — mục 11.
 *
 * Bộ cũ dựng theo chiều ngược: sinh lớp, rải học viên, rồi bốc một mẫu điểm và một mẫu case
 * cho từng vị trí trong lớp. Kết quả là một đống bản ghi đúng về mặt kiểu dữ liệu nhưng
 * KHÔNG kể được câu chuyện nào: một em có case Reading mà điểm Reading lại đang tăng, một
 * phương án "đã xong" trước cả ngày nó bắt đầu.
 *
 * Nay đi đúng chiều của đời thật:
 *
 *   Ghi danh → Chương trình → Test → Case → Phương án → Cập nhật → Chuyển tiếp / Kết quả
 *
 * MỌI CON SỐ Ở ĐÂY ĐỀU VIẾT TAY, KHÔNG CÓ CHỖ NÀO NGẪU NHIÊN. Điểm của MT2 phải nói tiếp
 * được câu chuyện mà MT1 mở ra; ngày ghi kết quả phải sau ngày phương án bắt đầu; không có
 * sự kiện nào "đã hoàn thành" ở một ngày chưa tới.
 *
 * Mã J01–J12 chỉ dùng trong tài liệu kiểm chứng, KHÔNG hiện ra sản phẩm.
 */

export const DEMO_DATE = '2026-09-14';

/* ================================================================= kiểu dữ liệu kịch bản */

export type FtSkill = 'listening' | 'reading' | 'writing1' | 'writing2' | 'speaking';
export type NormalSkill = 'listening' | 'reading' | 'writing' | 'speaking';

export type TestSeed = {
  no: number;
  kind: 'mock' | 'progress' | 'final';
  /** Thứ Hai của TUẦN kế hoạch. Một lượt thuộc đúng một tuần, không có ngày riêng. */
  week: string;
  status: 'planned' | 'done';
  /** Fast Track: band từng ô nhập. Thiếu một khoá = CHƯA NHẬP ĐIỂM, không phải trượt. */
  bands?: Partial<Record<FtSkill, number>>;
  /** Normal: [điểm đạt, tổng điểm]. Thiếu một khoá = chưa nhập. */
  ratios?: Partial<Record<NormalSkill, [number, number]>>;
  /** Kỹ năng ĐÁNH GIÁ nằm ngoài phạm vi yêu cầu của lượt này. */
  skip?: 'listening' | 'reading' | 'writing' | 'speaking';
  /**
   * TUẦN THI RIÊNG của một số kỹ năng, khi đợt này KHÔNG thi gọn trong một tuần (mục 10.1).
   *
   * Khoá nào không khai thì dùng `week` chung ở trên. Ví dụ FT thi R/L/W tuần 14/9 rồi
   * Speaking tuần 21/9: `week: '2026-09-14'` và `skillWeeks: { speaking: '2026-09-21' }`.
   *
   * Đây vẫn là MỘT đợt: một định danh, một bảng điểm, một kết luận.
   */
  skillWeeks?: Partial<Record<'listening' | 'reading' | 'writing' | 'speaking', string>>;
  /** Ngày nhập điểm. Bỏ trống thì lấy Chủ nhật của tuần. */
  enteredOn?: string;
  /** Hạn nhập điểm riêng do Quản lý đặt, thay hạn mặc định. */
  deadlineOverride?: { date: string; by: string; reason: string };
  /** Ghi chú của lượt — ví dụ "Học tiếp lộ trình" khi em học lại trong cùng lộ trình. */
  note?: string;
  /** Điểm giáo viên TỰ CHẤM khi cập nhật kết quả, KHÔNG phải điểm chính thức. */
  teacherEstimate?: { skill: string; band: number; on: string; by: string; note: string };
};

export type FollowUpSeed = {
  on: string;
  outcome: 'improved' | 'partial' | 'unchanged' | 'worse' | 'insufficient';
  nextStep: 'complete' | 'monitor' | 'continue' | 'propose' | 'ask_manager';
  note: string;
  /** Mã giáo viên quan sát. Bỏ trống thì lấy người thực hiện phương án. */
  by?: string;
  /**
   * ĐIỂM GIÁO VIÊN TỰ CHẤM kèm lần cập nhật này — KHÔNG phải điểm chính thức.
   * Nó không ghi đè điểm MT và không đổi mức SOS; chỉ là căn cứ của người dạy.
   */
  metrics?: { skill: string; score: number; total: number | null }[];
};

export type PlanSeed = {
  kind: string;
  description: string;
  /** Mã người THỰC HIỆN. */
  performer?: string;
  /** Mã người GHI HỘ, khi khác người thực hiện. */
  recordedBy?: string;
  cycleNo?: number;
  cycleStart: string;
  status: 'planned' | 'started' | 'completed' | 'cancelled';
  actionDue?: string;
  startedOn?: string;
  completedOn?: string;
  followupDue?: string;
  closedReason?: 'done' | 'superseded';
  /** Đề xuất cần Quản lý duyệt. */
  approval?: {
    state: 'pending' | 'approved' | 'declined';
    due: string;
    on?: string;
    by?: string;
    note?: string;
  };
  followups?: FollowUpSeed[];
};

export type CaseSeed = {
  /** Hạng mục — quyết định định danh của case. Một em × một hạng mục = một case. */
  topic: string;
  track?: 'academic' | 'behaviour';
  /** Tên case do người báo đặt. Bỏ trống thì hệ thống tự đặt theo hạng mục. */
  title?: string;
  summary: string;
  detectedAt: string;
  /** Sinh từ lượt thứ mấy (số MT/Test), hay do giáo viên tự báo. */
  fromTest?: number;
  originKind?: 'mock' | 'teacher_report' | 'manager_task';
  sosLevel?: number | null;
  /** Hai bậc, "Bình thường" đã bỏ (mục 6.3). Không khai thì là "Cần chú ý". */
  urgency?: 'attention' | 'urgent';
  /**
   * BÁO CÁO THÀNH PHẦN của một đợt case Ý thức/Khác (mục 7.2).
   *
   * Báo cáo đầu tiên là chính `summary` của case; khai thêm ở đây là những báo cáo GỘP vào
   * cùng đợt. Ngày phải nằm trong cửa sổ bốn ngày kể từ ngày mở, nếu không thì theo luật nó
   * đã phải là một đợt khác — bộ dựng kiểm điều đó và báo lỗi thay vì âm thầm ghi sai.
   */
  reports?: { on: string; by: string; skill?: string; summary: string }[];
  status: 'open' | 'in_progress' | 'done';
  /** Mã người phụ trách. Bỏ trống = CHƯA CÓ AI — và đó là một tình huống có thật. */
  owner?: string;
  reportedBy?: string;
  /** Hai case cùng hạng mục mở song song có chủ ý. */
  parallel?: boolean;
  /** Nối vào case CŨ cùng hạng mục đã đóng — tái diễn. */
  linksPreviousOf?: string;
  /** Mốc tái diễn: case còn mở mà lượt sau vẫn yếu. */
  repeatsAt?: number[];
  disposition?: 'monitor' | 'offline' | 'no_action' | 'action' | 'other';
  dispositionNote?: string;
  outcome?: 'much_better' | 'improved' | 'unchanged' | 'worse';
  outcomeNote?: string;
  closedOn?: string;
  closedBy?: string;
  plans?: PlanSeed[];
};

export type CycleSeed = {
  seq: number;
  route?: 'LT1' | 'LT2' | null;
  target?: number | null;
  /** Tuần bắt đầu học của lộ trình (thứ Hai). */
  startWeek?: string | null;
  examMonth?: string | null;
  /** Thứ Hai của tuần dự kiến thi, khi đã chốt được tuần. */
  examWeek?: string | null;
  baseline?: { score: number; source: string; note?: string };
  status: 'active' | 'completed';
  /** Lớp gắn các lượt đánh giá của lộ trình này. */
  classCode: string;
  startedAt: string;
  endedAt?: string;
  /** Kết thúc lộ trình: đạt mục tiêu hay chưa. */
  outcome?: 'reached' | 'not_reached' | 'unknown';
  outcomeNote?: string;
  tests: TestSeed[];
  cases?: CaseSeed[];
};

export type StudentSeed = {
  /** Mã kịch bản, chỉ dùng trong tài liệu. */
  code: string;
  name: string;
  branch: string;
  dob?: string | null;
  /** `finished` = đã kết thúc học; hồ sơ vẫn tra lại được đầy đủ. */
  status?: 'active' | 'finished';
  finishedAt?: string;
  enrollments: {
    class: string; from: string; to?: string;
    status: 'active' | 'completed' | 'transferred';
    /** Ghi chú bàn giao khi chuyển lớp giữa chừng. */
    handover?: string;
  }[];
  cycles: CycleSeed[];
  /** Một câu cho tài liệu hướng dẫn xem demo. */
  story: string;
};

/* ================================================================= giáo viên và lớp */

/**
 * MƯỜI GIÁO VIÊN CHO CẢ TRUNG TÂM.
 *
 * Ít người nhưng mỗi người ôm nhiều kỹ năng ở nhiều lớp — giống thực tế hơn hẳn việc mỗi
 * lớp một bộ giáo viên riêng, và người xem demo theo dõi được ai đang làm gì.
 *
 * HAI NGƯỜI DẠY Ở HAI CHI NHÁNH (`branches` có hai mã): đây là chỗ kiểm tra rằng số liệu
 * của một người KHÔNG lẫn giữa hai nơi khi Quản lý xem chi nhánh của mình.
 */
export const TEACHERS = [
  { code: 'T_HA', name: 'Trần Ngọc Hà', branches: ['MB'] },
  { code: 'T_KHOA', name: 'Lê Minh Khoa', branches: ['MB'] },
  { code: 'T_TRANG', name: 'Phạm Thu Trang', branches: ['MB', 'BC'] },
  { code: 'T_LINH', name: 'Cao Khánh Linh', branches: ['MB'] },
  { code: 'T_QUAN', name: 'Đặng Thanh Quân', branches: ['BC'] },
  { code: 'T_HAN', name: 'Vũ Gia Hân', branches: ['BC'] },
  { code: 'T_NAM', name: 'Ngô Bảo Nam', branches: ['CP'] },
  { code: 'T_DUNG', name: 'Hoàng Quang Dũng', branches: ['CP', 'HD'] },
  { code: 'T_YEN', name: 'Bùi Hải Yến', branches: ['HD'] },
  { code: 'T_KIEN', name: 'Dương Tuấn Kiên', branches: ['UB'] },
] as const;

export type ClassSeed = {
  code: string; branch: string; kind: string; route: 'LT1' | 'LT2' | null;
  isFastTrack: boolean;
  /** Thứ Hai của tuần khai giảng. */
  startDate: string;
  status: 'active' | 'ended';
  /** Phân công: kỹ năng → mã giáo viên. GVCN ghi riêng. */
  teachers: Record<string, string>;
  core?: string;
  note?: string;
};

/**
 * MƯỜI BA LỚP, trong đó hai lớp đã kết thúc — chúng tồn tại vì hành trình J01 đi qua đó,
 * và lịch sử của em phải mở lại được nguyên vẹn.
 *
 * Vài lớp CỐ TÌNH THIẾU NGƯỜI: nhãn "Thiếu GV W1, W2" và "Chưa có GVCN" chỉ chứng minh được
 * là nó chạy khi có lớp thật đang thiếu.
 */
export const CLASSES: ClassSeed[] = [
  /* ------------------------------------------------------------------ Monbay */
  {
    code: 'MB-FOU 03', branch: 'MB', kind: 'FOU', route: null, isFastTrack: false,
    startDate: '2025-12-01', status: 'ended',
    teachers: { listening: 'T_HA', reading: 'T_HA', writing: 'T_KHOA', speaking: 'T_TRANG' },
    core: 'T_HA', note: 'Lớp đã kết thúc — giữ lại để tra lịch sử.',
  },
  {
    code: 'MB-BE 08', branch: 'MB', kind: 'BE', route: null, isFastTrack: false,
    startDate: '2026-02-16', status: 'ended',
    teachers: { listening: 'T_HA', reading: 'T_KHOA', writing: 'T_KHOA', speaking: 'T_TRANG' },
    core: 'T_KHOA', note: 'Lớp đã kết thúc — giữ lại để tra lịch sử.',
  },
  {
    /*
     * W1 VÀ W2 GIAO CHO HAI NGƯỜI KHÁC NHAU.
     *
     * Ngoài đời Task 1 và Task 2 thường do hai giáo viên chấm, và đó chính là chỗ luật
     * "chỉ sửa được kỹ năng mình phụ trách" có ý nghĩa: cô dạy Task 1 ĐỌC được điểm Task 2
     * nhưng KHÔNG sửa được. Giao cả hai cho một người thì luật đó không bao giờ lộ ra.
     */
    code: 'MB-FT 101', branch: 'MB', kind: 'FT', route: 'LT1', isFastTrack: true,
    startDate: '2026-06-01', status: 'active',
    teachers: {
      listening: 'T_HA', reading: 'T_HA', writing1: 'T_KHOA', writing2: 'T_LINH', speaking: 'T_TRANG',
    },
    core: 'T_HA',
  },
  {
    /* Lớp Fast Track thứ hai của Monbay — cùng chi nhánh, khác lộ trình và khác lịch MT. */
    code: 'MB-FT 102', branch: 'MB', kind: 'FT', route: 'LT2', isFastTrack: true,
    startDate: '2026-06-29', status: 'active',
    teachers: {
      listening: 'T_LINH', reading: 'T_LINH', writing1: 'T_KHOA', writing2: 'T_KHOA', speaking: 'T_TRANG',
    },
    core: 'T_LINH',
  },
  {
    code: 'MB-FOU 12', branch: 'MB', kind: 'FOU', route: null, isFastTrack: false,
    startDate: '2026-07-27', status: 'active',
    teachers: { listening: 'T_HA', reading: 'T_HA', writing: 'T_KHOA', speaking: 'T_TRANG' },
    core: 'T_HA', note: 'Tuần 8/8 — đang trong tuần Final Test.',
  },

  /* ------------------------------------------------------------------ Bãi Cháy */
  {
    code: 'BC-FT 205', branch: 'BC', kind: 'FT', route: 'LT2', isFastTrack: true,
    startDate: '2026-06-08', status: 'active',
    teachers: {
      listening: 'T_QUAN', reading: 'T_QUAN', writing1: 'T_HAN', writing2: 'T_QUAN', speaking: 'T_TRANG',
    },
    core: 'T_QUAN', note: 'MT2 của tuần trước chưa có điểm — chỗ nhãn quá hạn phải hiện lên.',
  },
  {
    /* Chưa ai nhận chủ nhiệm — lớp mới khai giảng ở chi nhánh xa. */
    code: 'BC-ELE 01', branch: 'BC', kind: 'ELE', route: null, isFastTrack: false,
    startDate: '2026-08-17', status: 'active',
    teachers: { listening: 'T_QUAN', reading: 'T_QUAN', writing: 'T_HAN', speaking: 'T_HAN' },
    note: 'Tuần 5/10 — đang trong tuần Progress Test. Chưa có GVCN.',
  },

  /* ------------------------------------------------------------------ Cẩm Phả */
  {
    code: 'CP-FT 110', branch: 'CP', kind: 'FT', route: 'LT1', isFastTrack: true,
    startDate: '2026-04-13', status: 'active',
    teachers: {
      listening: 'T_NAM', reading: 'T_NAM', writing1: 'T_DUNG', writing2: 'T_DUNG', speaking: 'T_NAM',
    },
    core: 'T_NAM', note: 'Ba lượt MT đã xong — nơi có case kéo dài và case tái diễn.',
  },

  /* ------------------------------------------------------------------ Hải Dương */
  {
    code: 'HD-FOU 05', branch: 'HD', kind: 'FOU', route: null, isFastTrack: false,
    startDate: '2026-06-01', status: 'active',
    teachers: { listening: 'T_YEN', reading: 'T_YEN', writing: 'T_DUNG', speaking: 'T_YEN' },
    core: 'T_YEN', note: 'Đã học hết 8 tuần — còn hai em chưa được xếp lớp tiếp.',
  },
  {
    code: 'HD-BE 21', branch: 'HD', kind: 'BE', route: null, isFastTrack: false,
    startDate: '2026-08-03', status: 'active',
    teachers: { listening: 'T_YEN', reading: 'T_YEN', writing: 'T_DUNG', speaking: 'T_YEN' },
    core: 'T_YEN', note: 'Lớp đích của luồng FOU → BE. Tuần 7/10.',
  },
  {
    /* Lớp mới mở, chưa xếp xong người: thiếu giáo viên cả hai phần Writing. */
    code: 'HD-FT 302', branch: 'HD', kind: 'FT', route: 'LT1', isFastTrack: true,
    startDate: '2026-08-10', status: 'active',
    teachers: { listening: 'T_YEN', reading: 'T_YEN', speaking: 'T_YEN' },
    core: 'T_YEN', note: 'MT1 rơi đúng tuần này. Thiếu GV W1 và W2.',
  },

  /* ------------------------------------------------------------------ Uông Bí */
  {
    code: 'UB-FT 401', branch: 'UB', kind: 'FT', route: 'LT2', isFastTrack: true,
    startDate: '2026-02-23', status: 'active',
    teachers: {
      listening: 'T_KIEN', reading: 'T_KIEN', writing1: 'T_KIEN', writing2: 'T_KIEN', speaking: 'T_KIEN',
    },
    core: 'T_KIEN', note: 'Lớp gần cuối lộ trình — nơi có học viên đã thi thật.',
  },
  {
    /*
     * MÃ CŨ "FOUND" chứ không phải "FOU": trung tâm đã đặt tên lớp như vậy từ trước, và đổi
     * tên lớp cũ chỉ vì phần mềm chuẩn hoá lại mã là chuyện không được phép. Hệ thống đọc mã
     * cũ ra đúng chương trình Foundation mà không sửa gì trên mã lớp. Thiếu GV Speaking.
     */
    code: 'UB-FOUND 07', branch: 'UB', kind: 'FOUND', route: null, isFastTrack: false,
    startDate: '2026-07-06', status: 'active',
    teachers: { listening: 'T_KIEN', reading: 'T_KIEN', writing: 'T_KIEN' },
    core: 'T_KIEN', note: 'Đã học hết chương trình. Thiếu GV Speaking.',
  },
];
