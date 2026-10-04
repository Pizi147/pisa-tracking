/**
 * DANH MỤC QUYỀN THEO NHÓM (PR-QU, D) — dữ liệu dùng chung cho màn Quản trị quyền (web) và luật cấp quyền (máy chủ).
 *
 * Mỗi quyền thuộc ĐÚNG một nhóm, có một câu mô tả bằng ngôn ngữ giáo viên và (nếu cần) ghi chú phạm vi: cùng một quyền nhưng giáo viên
 * chỉ dùng được trong lớp mình dạy — màn quyền phải nói điều đó, không để người cấp tự đoán.
 */
import { PERMISSIONS, type PermissionKey } from './people.ts';

export type NhomQuyenKey = 'lich_test' | 'diem' | 'case_sos' | 'y_thuc' | 'hv_lop' | 'duyet' | 'van_hanh' | 'quan_tri';

export const NHOM_QUYEN: { key: NhomQuyenKey; ten: string }[] = [
  { key: 'lich_test', ten: 'Lịch & Test' },
  { key: 'diem', ten: 'Điểm & đánh giá' },
  { key: 'case_sos', ten: 'Case/SOS' },
  { key: 'y_thuc', ten: 'Ý thức' },
  { key: 'hv_lop', ten: 'Học viên & Lớp' },
  { key: 'duyet', ten: 'Duyệt' },
  { key: 'van_hanh', ten: 'Vận hành & báo cáo' },
  { key: 'quan_tri', ten: 'Quản trị' },
];

const GV_LOP_MINH = 'GV: chỉ lớp mình dạy.';

export const MO_TA_QUYEN: Record<PermissionKey, { nhom: NhomQuyenKey; moTa: string; phamVi?: string }> = {
  'plan.week': { nhom: 'lich_test', moTa: 'Chốt và đổi tuần của một lượt Mock Test, xếp lịch Fast Track.' },
  'schedule.move': { nhom: 'lich_test', moTa: 'Dời lịch thi một kỹ năng của lớp thường.',
    phamVi: 'GV: chỉ lớp thường, đúng môn mình dạy; GVCN mọi môn lớp mình chủ nhiệm.' },
  'attempt.cancel': { nhom: 'lich_test', moTa: 'Huỷ cả một lượt Mock Test.' },
  'attempt.skip_skill': { nhom: 'lich_test', moTa: 'Đánh dấu một kỹ năng không thi trong lượt Mock Test đó.' },
  'deadline.override': { nhom: 'lich_test', moTa: 'Đặt hạn nhập điểm khác hạn mặc định.' },
  'attempt.view': { nhom: 'diem', moTa: 'Xem lịch và kết quả Mock Test.', phamVi: GV_LOP_MINH },
  'score.edit': { nhom: 'diem', moTa: 'Nhập điểm kỹ năng mình được phân công.', phamVi: 'GV: chỉ lớp mình dạy, môn mình dạy.' },
  'score.override': { nhom: 'diem', moTa: 'Nhập bù hoặc sửa điểm ngoài phân công khi giáo viên vắng.' },
  'estimate.edit': { nhom: 'diem', moTa: 'Cập nhật Đánh giá GV cho kỹ năng mình phụ trách.', phamVi: 'GV: chỉ lớp mình dạy, môn mình dạy.' },
  'case.view': { nhom: 'case_sos', moTa: 'Xem danh sách Case và bốn bộ lọc Case.', phamVi: GV_LOP_MINH },
  'sos.report': { nhom: 'case_sos', moTa: 'Báo một vấn đề mới của học viên.', phamVi: 'GV: lớp mình dạy, mọi môn.' },
  'sos.edit': { nhom: 'case_sos', moTa: 'Sửa và xử lý một Case đã có.',
    phamVi: 'GV: Case học thuật đúng môn mình dạy; Case Ý thức chỉ GVCN.' },
  'case.close': { nhom: 'case_sos', moTa: 'Hoàn thành (đóng) một Case.',
    phamVi: 'GV: Case học thuật đúng môn mình dạy; Case Ý thức chỉ GVCN. Đóng xong báo Quản lý.' },
  'case.approve': { nhom: 'duyet', moTa: 'Duyệt phương án hỗ trợ học thuật giáo viên đề xuất.' },
  'violation.record': { nhom: 'y_thuc', moTa: 'Ghi vi phạm của học viên.', phamVi: 'GV: lớp mình dạy, kể cả trái môn.' },
  'discipline.manage': { nhom: 'y_thuc', moTa: 'Xử lý Ý thức: sửa vi phạm của người khác, tạo và xác nhận lần xử lý.',
    phamVi: 'GV: chỉ GVCN của lớp em đang học.' },
  'discipline.stats': { nhom: 'y_thuc', moTa: 'Xem thống kê Ý thức của cả chi nhánh.' },
  'class.assign': { nhom: 'hv_lop', moTa: 'Phân công giáo viên vào lớp, kể cả đổi GVCN.' },
  'class.create': { nhom: 'hv_lop', moTa: 'Tạo lớp mới, một lớp hoặc nhiều lớp một lần.' },
  'class.assign_subject': { nhom: 'hv_lop', moTa: 'Phân công giáo viên bộ môn cho lớp mình chủ nhiệm.',
    phamVi: 'Chỉ GVCN, chỉ lớp mình chủ nhiệm, không đổi được ô GVCN.' },
  'class.edit': { nhom: 'hv_lop', moTa: 'Sửa tiến độ lớp: tuần bắt đầu, tuần Giữa khoá, tuần Cuối khoá.' },
  'student.view': { nhom: 'hv_lop', moTa: 'Xem hồ sơ học viên.', phamVi: GV_LOP_MINH },
  'student.edit': { nhom: 'hv_lop', moTa: 'Sửa hồ sơ học viên, thêm học viên vào lớp, chuyển lớp.',
    phamVi: 'GV: chỉ GVCN, học viên lớp mình chủ nhiệm.' },
  'cycle.edit': { nhom: 'hv_lop', moTa: 'Sửa Target và lộ trình của học viên.' },
  'request.approve': { nhom: 'duyet', moTa: 'Duyệt thẻ trong hộp Chờ duyệt.' },
  'meeting.view': { nhom: 'van_hanh', moTa: 'Xem tiến trình công việc và báo cáo.' },
  'meeting.edit': { nhom: 'van_hanh', moTa: 'Cập nhật báo cáo và ghi chú công việc.' },
  'admin.config': { nhom: 'quan_tri', moTa: 'Quản trị phần mềm: tài khoản, vai trò, quyền và cấu hình.' },
};

/**
 * Quyền SUY RA cho GV/GVCN theo phân công (không nằm trong `role_permissions` của vai GV, hoặc có nhưng bị siết theo lớp) — giải thích
 * cột GVCN (chỉ đọc) của ma trận vai × quyền.
 */
export const QUYEN_SUY_RA_GV: { quyen: PermissionKey; ai: 'GV' | 'GVCN'; ghiChu: string }[] = [
  { quyen: PERMISSIONS.CLASS_ASSIGN_SUBJECT, ai: 'GVCN', ghiChu: 'Chỉ lớp chủ nhiệm, không đổi ô GVCN.' },
  { quyen: PERMISSIONS.STUDENT_EDIT, ai: 'GVCN', ghiChu: 'Chỉ học viên lớp chủ nhiệm.' },
  { quyen: PERMISSIONS.DISCIPLINE_MANAGE, ai: 'GVCN', ghiChu: 'Chỉ lớp chủ nhiệm.' },
  { quyen: PERMISSIONS.CASE_CLOSE, ai: 'GVCN', ghiChu: 'Case Ý thức lớp chủ nhiệm; Case học thuật chỉ môn mình dạy.' },
  { quyen: PERMISSIONS.SCHEDULE_MOVE, ai: 'GVCN', ghiChu: 'Mọi môn của lớp thường mình chủ nhiệm.' },
];

/** Quyền CHỈ suy ra (không bật theo vai, không cấp riêng): cấp cho người không chủ nhiệm thì vô nghĩa hoặc mở quá phạm vi. */
export const QUYEN_CHI_SUY_RA: readonly PermissionKey[] = [PERMISSIONS.CLASS_ASSIGN_SUBJECT];

/** Không bao giờ cấp riêng: `admin.config` (Quản trị là một vai, không phải một ô cộng thêm). */
export const KHONG_CAP_RIENG: readonly PermissionKey[] = [PERMISSIONS.ADMIN_CONFIG];

/** Cấm bật cho vai — kèm lý do hiện trên màn. Thêm mục mới phải có quyết định của chủ sản phẩm (G7). */
export const CAM_CAP_VAI: Record<string, { quyen: PermissionKey; lyDo: string }[]> = {
  teacher: [{
    quyen: PERMISSIONS.PLAN_WEEK,
    lyDo: 'SCH-01: giáo viên chỉ dời lịch lớp thường (quyền Dời lịch thi). Chốt tuần MT kèm xếp lịch Fast Track là việc của Quản lý.',
  }],
};

/** Lý do một ô (vai × quyền) không bật được, hoặc null. */
export function lyDoCamVai(roleKey: string, quyen: string): string | null {
  if ((QUYEN_CHI_SUY_RA as readonly string[]).includes(quyen)) return 'Quyền này tự có theo phân công GVCN, không bật theo vai.';
  return CAM_CAP_VAI[roleKey]?.find((x) => x.quyen === quyen)?.lyDo ?? null;
}

/**
 * PR-SO (04/10): lý do không cấp RIÊNG quyền `quyen` cho người có các vai `roleKeys` (đang hoạt động), hoặc null. Chỉ cấm khi người đó có
 * vai và MỌI vai đều cấm quyền này (người vừa GV vừa Quản lý vẫn cấp được). Máy chủ chặn bằng hàm này; web đọc cùng hàm để khoá ô.
 */
export function lyDoCamCapRieng(roleKeys: readonly string[], quyen: string): string | null {
  if (!roleKeys.length) return null;
  const lyDo = roleKeys.map((v) => CAM_CAP_VAI[v]?.find((x) => x.quyen === quyen)?.lyDo ?? null);
  return lyDo.every(Boolean) ? lyDo[0] : null;
}

const TAT_CA = new Set<string>(Object.values(PERMISSIONS));

/** Cấp riêng được không: có trong `PERMISSIONS`, không thuộc `KHONG_CAP_RIENG`, không phải quyền chỉ suy ra. */
export function duocCapRieng(k: string): boolean {
  return TAT_CA.has(k) && !(KHONG_CAP_RIENG as readonly string[]).includes(k) && !(QUYEN_CHI_SUY_RA as readonly string[]).includes(k);
}
