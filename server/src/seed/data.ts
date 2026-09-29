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
  { key: 'manager', name: 'Quản lý' },
  { key: 'teacher', name: 'Giáo viên' },
] as const;

/**
 * VAI TRÒ ĐÃ BỎ, giữ trong bảng `roles` ở trạng thái `retired`.
 *
 * Không xoá dòng: `user_roles` và nhật ký cũ còn trỏ vào nó. Giữ ở trạng thái đã bỏ thì
 * lịch sử vẫn đọc được mà màn giao vai trò không còn bày ra cho ai chọn.
 */
export const RETIRED_ROLES = [
  { key: 'branch_admin', name: 'Admin chi nhánh' },
] as const;

/**
 * Quyền theo vai trò. Phạm vi chi nhánh nằm ở từng grant, không suy từ tên vai trò:
 * một Quản lý chỉ toàn hệ thống khi grant của họ có branch_id = NULL.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Quản trị phần mềm: toàn quyền, kể cả các ngoại lệ sửa sai về lịch.
  system_admin: [
    'plan.week', 'schedule.move', 'attempt.cancel', 'attempt.skip_skill',
    'deadline.override', 'attempt.view', 'score.override', 'case.view', 'sos.report', 'sos.edit',
    'case.close', 'case.approve',
    'violation.record', 'discipline.manage', 'discipline.stats',
    'class.assign', 'class.edit', 'student.view', 'student.edit',
    'meeting.view', 'meeting.edit', 'admin.config', 'request.approve', 'cycle.edit',
  ],
  // Quản lý: chốt TUẦN của mọi lượt MT trong chi nhánh mình.
  manager: [
    'plan.week', 'schedule.move', 'attempt.cancel', 'attempt.skip_skill',
    'deadline.override', 'attempt.view',
    // Quản lý đóng được case trong chi nhánh mình; GVCN đóng case lớp mình (kiểm theo phân công).
    'case.view', 'sos.report', 'sos.edit', 'case.close', 'case.approve', 'class.assign', 'class.edit',
    'violation.record', 'discipline.manage', 'discipline.stats',
    'student.view', 'student.edit', 'meeting.view', 'meeting.edit', 'request.approve', 'cycle.edit',
  ],
  /*
   * Giáo viên: nhập điểm và đánh giá ĐÚNG kỹ năng được phân công.
   *
   * `student.edit` vào đây sau khi bỏ vai Admin chi nhánh, nhưng KHÔNG phải mọi giáo viên
   * đều dùng được: `teacherAllows` siết nó xuống đúng GVCN của chính lớp đó. GVCN vẫn
   * KHÔNG vì chủ nhiệm mà có thêm quyền về lịch MT hay quyền nhập điểm kỹ năng khác.
   *
   * `sos.report` (báo vấn đề) rộng — bất kỳ môn nào trong lớp. `sos.edit` (sửa/xử lý case đã
   * có) hẹp hơn — `teacherAllows` siết đúng kỹ năng (Học thuật) hoặc GVCN (Ý thức), AUTH-01.
   */
  /*
   * Ý thức (PR-J): `violation.record` rộng như `sos.report` — mọi giáo viên dạy lớp đó đều ghi được vi phạm. `discipline.manage`
   * bị `teacherAllows` siết xuống đúng GVCN của lớp. Giáo viên KHÔNG có `discipline.stats` — thống kê cả chi nhánh là của Quản lý.
   */
  teacher: ['attempt.view', 'score.edit', 'estimate.edit', 'schedule.move',
    'case.view', 'sos.report', 'sos.edit', 'student.view', 'student.edit',
    'violation.record', 'discipline.manage'],
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
