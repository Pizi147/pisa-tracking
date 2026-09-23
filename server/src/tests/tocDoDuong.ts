/**
 * DANH SÁCH ĐƯỜNG ĐO (PR-TD, tốc độ trên Turso) — dùng chung bởi `tocDo.run.ts` (phép kiểm ĐO: trần câu SQL, nhân
 * dữ liệu) và `scripts/chup-api.mjs` (chụp JSON để so trước/sau).
 *
 * PR SAU THÊM ĐƯỜNG MỚI VÀO ĐÂY — mỗi trang/tab mới của các trang chính (Tổng quan, Học viên & Lớp, hồ sơ lớp, hồ sơ
 * HV, Cần chấm, Danh sách Case, Việc cần làm) phải có ít nhất một dòng ở đây, nếu không phép kiểm ĐO không biết mà đo.
 *
 * Đường của Qa (`/hoc-vien-lop`, `/classes/:id/phan-tich-lop`) và Rc1 (`/cham/can-cham`, `/cham/lich-test`,
 * `/classes/:id/cham`) đã thêm ở Task 4 sau khi rebase lên #69/#70.
 *
 * URL có chỗ thay bằng ID thật lúc chạy: `{lopFT}`, `{lopThuong}`, `{hv}`, `{case}`, `{cn}`.
 */

export type Vai = 'QL' | 'GVCN' | 'GVBM' | 'GVCN_THUONG' | 'QT';

export const MOI_VAI: readonly Vai[] = ['QL', 'GVCN', 'GVBM', 'GVCN_THUONG', 'QT'];

export type MucDo = {
  /** Nhóm trang — chỉ để đọc log/báo cáo cho dễ, không dùng để lọc. */
  trang: string;
  vai: readonly Vai[];
  url: string;
  /** Mã trạng thái mong đợi khi KHÁC 200 cho một vai cụ thể (ví dụ GV bị từ chối một đường của riêng Quản lý). */
  maChuDich?: Partial<Record<Vai, number>>;
};

export const DUONG_DO: MucDo[] = [
  // ---------------------------------------------------------------- Chung
  { trang: 'Chung', vai: MOI_VAI, url: '/demo/session' },
  { trang: 'Chung', vai: MOI_VAI, url: '/ref/branches' },
  { trang: 'Chung', vai: MOI_VAI, url: '/prefs' },

  // ---------------------------------------------------------------- Tổng quan · Quản lý
  {
    trang: 'Tổng quan QL', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/tong-quan/quan-ly',
    maChuDich: { GVCN: 403, GVBM: 403 },
  },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/highlights' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/tong-quan/chi-nhanh' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/branch-pulse' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/case-mo' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/hv-sos-hien-tai' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/hv-duoi-ky-vong-mon' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/hv-co-case-mo' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/do-phu-danh-gia' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/summary' },

  // ---------------------------------------------------------------- Tổng quan · Giáo viên
  { trang: 'Tổng quan GV', vai: ['GVCN', 'GVBM', 'GVCN_THUONG'], url: '/my-work' },
  { trang: 'Tổng quan GV', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG'], url: '/tong-quan/hoc-vien-can-ho-tro' },
  { trang: 'Tổng quan GV', vai: ['GVCN', 'GVBM', 'GVCN_THUONG'], url: '/highlights' },
  { trang: 'Tổng quan GV', vai: ['GVCN'], url: '/y-thuc/my-warnings' },
  { trang: 'Tổng quan GV', vai: ['GVCN'], url: '/y-thuc/my-coordination' },

  // ---------------------------------------------------------------- Học viên & Lớp
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/classes' },
  { trang: 'Học viên & Lớp', vai: ['QL', 'QT'], url: '/classes?branchId={cn}' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop' },
  { trang: 'Học viên & Lớp', vai: ['QL', 'QT'], url: '/hoc-vien-lop?phamVi=chi-nhanh&branchId={cn}' },

  // ---------------------------------------------------------------- Hồ sơ lớp (FT)
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/overview' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/roster' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/issue-board?category=listening' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/phan-tich-lop' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/y-thuc' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/cham' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/cases?classId={lopFT}' },

  // ---------------------------------------------------------------- Hồ sơ lớp (thường)
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/overview' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/roster' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/phan-tich-lop' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/y-thuc' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/cham' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/cases?classId={lopThuong}' },

  // ---------------------------------------------------------------- Cần chấm + Lịch Test
  { trang: 'Cần chấm', vai: MOI_VAI, url: '/cham/can-cham' },
  { trang: 'Cần chấm', vai: MOI_VAI, url: '/cham/lich-test' },

  /*
   * {hv} và {case} nằm trong lớp FT (MB-FT 101) — GVCN_THUONG (chủ nhiệm MB-FOU 12, lớp khác) không có phân công ở
   * lớp/HV này nên bị 403 đúng luật, không đưa vào vai của các dòng dưới.
   */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/skill-board' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/violation-warning' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/cases/{case}' },

  // ---------------------------------------------------------------- Danh sách Case
  { trang: 'Danh sách Case', vai: MOI_VAI, url: '/cases' },
  { trang: 'Danh sách Case', vai: MOI_VAI, url: '/cases/queues' },

  // ---------------------------------------------------------------- Việc cần làm
  { trang: 'Việc cần làm', vai: MOI_VAI, url: '/tasks' },
  { trang: 'Việc cần làm', vai: ['QL', 'QT'], url: '/mgmt-tasks/mine' },
];
