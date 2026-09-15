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

/*
 * CLASSES, MT_OUTCOMES, CASE_PATTERNS, TARGET_SCORES và bộ tên giả ĐÃ BỎ Ở VÒNG 6.
 *
 * Bộ demo cũ sinh lớp trước rồi rải học viên vào, mỗi vị trí trong lớp lấy một mẫu điểm và
 * một mẫu case. Cách đó cho ra dữ liệu đúng kiểu nhưng không kể được câu chuyện nào — một em
 * có case Reading mà điểm Reading lại đang tăng, một phương án "đã xong" trước cả ngày nó bắt
 * đầu. Nay lớp, giáo viên và toàn bộ hành trình học viên nằm trong `journeys.ts` và
 * `students.ts`, viết tay theo đúng chiều của đời thật.
 */
