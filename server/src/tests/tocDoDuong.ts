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

  // ---------------------------------------------------------------- Kế hoạch Test (PR-Rc2)
  { trang: 'Kế hoạch Test', vai: MOI_VAI, url: '/ke-hoach-test/lop?branchId={cn}' },
  {
    trang: 'Kế hoạch Test', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG'], url: '/ke-hoach-test/ft/{lopFT}',
    maChuDich: { GVCN: 403, GVBM: 403, GVCN_THUONG: 403 },
  },
  { trang: 'Kế hoạch Test', vai: ['QL', 'QT'], url: '/ke-hoach-test/thuong?branchId={cn}' },
];

/**
 * TRẦN CÂU SQL (PR-TD Task 5, Q6) — khoá `vai + ' ' + url` (url đã thay id thật, đúng như `tocDo.run.ts` in ra ở
 * "Bảng đo"). Cách đếm: `get`/`run`/`iterate` (không `all` — xem `db.ts`). Cách tính trần, chốt trên số đo NGAY SAU
 * Task 4 (bộ demo gốc, chưa nhân dữ liệu): `max(sau + 10, ⌈sau × 1.3⌉)`, và trần cứng `100`.
 *
 * PR SAU làm một đường tăng số câu PHẢI nâng trần ở đây KÈM LÝ DO trong Nhật ký của PR đó — không âm thầm sửa số.
 * Đường mới thêm vào `DUONG_DO` mà chưa có trong bảng này thì phép kiểm trần bỏ qua (chưa có mốc để so).
 */
export const TRAN: Record<string, number> = {
  'QL /demo/session': 21,
  'GVCN /demo/session': 22,
  'GVBM /demo/session': 22,
  'GVCN_THUONG /demo/session': 22,
  'QT /demo/session': 21,
  'QL /ref/branches': 20,
  'GVCN /ref/branches': 21,
  'GVBM /ref/branches': 21,
  'GVCN_THUONG /ref/branches': 21,
  'QT /ref/branches': 20,
  'QL /prefs': 19,
  'GVCN /prefs': 19,
  'GVBM /prefs': 19,
  'GVCN_THUONG /prefs': 19,
  'QT /prefs': 19,
  'QL /tong-quan/quan-ly': 75,
  'QT /tong-quan/quan-ly': 71,
  'GVCN /tong-quan/quan-ly': 20,
  'GVBM /tong-quan/quan-ly': 20,
  'QL /highlights': 28,
  'QT /highlights': 28,
  'QL /tong-quan/chi-nhanh': 45,
  'QT /tong-quan/chi-nhanh': 41,
  'QL /tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong': 46,
  'QT /tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong': 42,
  'QL /branch-pulse': 42,
  'QT /branch-pulse': 40,
  'QL /metrics/case-mo': 28,
  'QT /metrics/case-mo': 25,
  'QL /metrics/hv-sos-hien-tai': 29,
  'QT /metrics/hv-sos-hien-tai': 29,
  'QL /metrics/hv-duoi-ky-vong-mon': 29,
  'QT /metrics/hv-duoi-ky-vong-mon': 29,
  'QL /metrics/hv-co-case-mo': 28,
  'QT /metrics/hv-co-case-mo': 25,
  'QL /metrics/do-phu-danh-gia': 29,
  'QT /metrics/do-phu-danh-gia': 29,
  'QL /summary': 40,
  'QT /summary': 37,
  'GVCN /my-work': 60,
  'GVBM /my-work': 62,
  'GVCN_THUONG /my-work': 60,
  'QL /tong-quan/hoc-vien-can-ho-tro': 42,
  'QT /tong-quan/hoc-vien-can-ho-tro': 39,
  'GVCN /tong-quan/hoc-vien-can-ho-tro': 42,
  'GVBM /tong-quan/hoc-vien-can-ho-tro': 42,
  'GVCN_THUONG /tong-quan/hoc-vien-can-ho-tro': 42,
  'GVCN /highlights': 28,
  'GVBM /highlights': 28,
  'GVCN_THUONG /highlights': 28,
  'GVCN /y-thuc/my-warnings': 30,
  'GVCN /y-thuc/my-coordination': 51,
  'QL /classes': 35,
  'GVCN /classes': 36,
  'GVBM /classes': 36,
  'GVCN_THUONG /classes': 36,
  'QT /classes': 39,
  'QL /classes?branchId=1': 35,
  'QT /classes?branchId=1': 35,
  'QL /hoc-vien-lop': 59,
  'GVCN /hoc-vien-lop': 59,
  'GVBM /hoc-vien-lop': 59,
  'GVCN_THUONG /hoc-vien-lop': 59,
  'QT /hoc-vien-lop': 82,
  'QL /hoc-vien-lop?phamVi=chi-nhanh&branchId=1': 59,
  'QT /hoc-vien-lop?phamVi=chi-nhanh&branchId=1': 56,
  'QL /classes/3/overview': 55,
  'GVCN /classes/3/overview': 55,
  'GVBM /classes/3/overview': 55,
  'GVCN_THUONG /classes/3/overview': 55,
  'QT /classes/3/overview': 51,
  'QL /classes/3/roster': 54,
  'GVCN /classes/3/roster': 54,
  'GVBM /classes/3/roster': 54,
  'GVCN_THUONG /classes/3/roster': 54,
  'QT /classes/3/roster': 50,
  'QL /classes/3/issue-board?category=listening': 33,
  'GVCN /classes/3/issue-board?category=listening': 33,
  'GVBM /classes/3/issue-board?category=listening': 33,
  'GVCN_THUONG /classes/3/issue-board?category=listening': 33,
  'QT /classes/3/issue-board?category=listening': 32,
  'QL /classes/3/phan-tich-lop': 30,
  'GVCN /classes/3/phan-tich-lop': 31,
  'GVBM /classes/3/phan-tich-lop': 31,
  'GVCN_THUONG /classes/3/phan-tich-lop': 31,
  'QT /classes/3/phan-tich-lop': 29,
  'QL /classes/3/y-thuc': 88,
  'GVCN /classes/3/y-thuc': 88,
  'GVBM /classes/3/y-thuc': 88,
  'GVCN_THUONG /classes/3/y-thuc': 88,
  'QT /classes/3/y-thuc': 81,
  'QL /classes/3/cham': 35,
  'GVCN /classes/3/cham': 35,
  'GVBM /classes/3/cham': 35,
  'GVCN_THUONG /classes/3/cham': 35,
  'QT /classes/3/cham': 34,
  'QL /cases?classId=3': 28,
  'GVCN /cases?classId=3': 28,
  'GVBM /cases?classId=3': 28,
  'GVCN_THUONG /cases?classId=3': 28,
  'QT /cases?classId=3': 25,
  'QL /classes/5/overview': 55,
  'QT /classes/5/overview': 51,
  'GVCN_THUONG /classes/5/overview': 55,
  'QL /classes/5/roster': 52,
  'QT /classes/5/roster': 49,
  'GVCN_THUONG /classes/5/roster': 52,
  'QL /classes/5/phan-tich-lop': 30,
  'QT /classes/5/phan-tich-lop': 29,
  'GVCN_THUONG /classes/5/phan-tich-lop': 31,
  'QL /classes/5/y-thuc': 27,
  'QT /classes/5/y-thuc': 26,
  'GVCN_THUONG /classes/5/y-thuc': 27,
  'QL /classes/5/cham': 32,
  'QT /classes/5/cham': 31,
  'GVCN_THUONG /classes/5/cham': 32,
  'QL /cases?classId=5': 28,
  'QT /cases?classId=5': 25,
  'GVCN_THUONG /cases?classId=5': 28,
  'QL /cham/can-cham': 34,
  'GVCN /cham/can-cham': 33,
  'GVBM /cham/can-cham': 32,
  'GVCN_THUONG /cham/can-cham': 33,
  'QT /cham/can-cham': 38,
  'QL /cham/lich-test': 26,
  'GVCN /cham/lich-test': 26,
  'GVBM /cham/lich-test': 26,
  'GVCN_THUONG /cham/lich-test': 26,
  'QT /cham/lich-test': 26,
  'QL /students/1': 100,
  'QT /students/1': 100,
  'GVCN /students/1': 100,
  'GVBM /students/1': 100,
  'QL /students/1/skill-board': 56,
  'QT /students/1/skill-board': 54,
  'GVCN /students/1/skill-board': 56,
  'GVBM /students/1/skill-board': 56,
  'QL /students/1/violation-warning': 26,
  'QT /students/1/violation-warning': 24,
  'GVCN /students/1/violation-warning': 26,
  'GVBM /students/1/violation-warning': 26,
  'QL /cases/1': 42,
  'QT /cases/1': 40,
  'GVCN /cases/1': 42,
  'GVBM /cases/1': 42,
  'QL /cases': 28,
  'GVCN /cases': 28,
  'GVBM /cases': 28,
  'GVCN_THUONG /cases': 28,
  'QT /cases': 25,
  'QL /cases/queues': 27,
  'GVCN /cases/queues': 27,
  'GVBM /cases/queues': 27,
  'GVCN_THUONG /cases/queues': 27,
  'QT /cases/queues': 24,
  'QL /tasks': 23,
  'GVCN /tasks': 20,
  'GVBM /tasks': 20,
  'GVCN_THUONG /tasks': 20,
  'QT /tasks': 23,
  'QL /mgmt-tasks/mine': 20,
  'QT /mgmt-tasks/mine': 20,
  'QL /ke-hoach-test/lop?branchId=1': 21,
  'GVCN /ke-hoach-test/lop?branchId=1': 21,
  'GVBM /ke-hoach-test/lop?branchId=1': 21,
  'GVCN_THUONG /ke-hoach-test/lop?branchId=1': 21,
  'QT /ke-hoach-test/lop?branchId=1': 21,
  'QL /ke-hoach-test/ft/3': 29,
  'QT /ke-hoach-test/ft/3': 29,
  'QL /ke-hoach-test/thuong?branchId=1': 34,
  'QT /ke-hoach-test/thuong?branchId=1': 34,
};
