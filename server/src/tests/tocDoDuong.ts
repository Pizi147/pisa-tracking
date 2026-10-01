/**
 * DANH SÁCH ĐƯỜNG ĐO (PR-TD, tốc độ trên Turso) — dùng chung bởi `tocDo.run.ts` (phép kiểm ĐO: trần câu SQL, nhân
 * dữ liệu) và `scripts/chup-api.mjs` (chụp JSON để so trước/sau).
 *
 * PR SAU THÊM ĐƯỜNG MỚI VÀO ĐÂY — mỗi trang/tab mới của các trang chính (Tổng quan, Học viên & Lớp, hồ sơ lớp, hồ sơ
 * HV, Lịch Test, Danh sách Case, Việc cần làm) phải có ít nhất một dòng ở đây, nếu không phép kiểm ĐO không biết mà đo.
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

  // ---------------------------------------------------------------- Phân tích Ý thức cho QL (PR-YT2, P13/P14)
  { trang: 'Phân tích Ý thức QL', vai: ['QL', 'QT'], url: '/metrics/vi-pham-theo-nhom' },
  { trang: 'Phân tích Ý thức QL', vai: ['QL', 'QT'], url: '/metrics/vi-pham-tong?classId={lopFT}' },

  // ---------------------------------------------------------------- Phân tích v2 cho QL (PR-UX4) — GV không có meeting.view nên 403
  {
    trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/van-de-hv',
    maChuDich: { GVCN: 403 },
  },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/van-de-hv?gop=1' },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/van-de-hv/o?dong=chua-phan-loai&cot=case' },
  {
    trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/hieu-qua-pa',
    maChuDich: { GVCN: 403 },
  },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/hieu-qua-pa?tg=26' },
  {
    trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/y-thuc',
    maChuDich: { GVCN: 403 },
  },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/bo-quen?loai=can-ho-tro-2-lan' },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/metrics/hv-can-ho-tro-2-lan-chua-case' },
  /* PR-LT2a: thay chỉ số "Bỏ qua tín hiệu" đã bỏ bằng chỉ số Case chờ nguyên nhân quá hạn (FT + Giữa khoá lớp thường — ô Tổng quan). */
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/metrics/case-xac-dinh-nguyen-nhan-qua-han' },

  // ---------------------------------------------------------------- Tổng quan · Giáo viên
  { trang: 'Tổng quan GV', vai: ['GVCN', 'GVBM', 'GVCN_THUONG'], url: '/my-work' },
  /* PR-Ra: trang "Công việc" — Hỗ trợ học viên dùng lại `/my-work`, nay có thêm `nguoi`. */
  { trang: 'Công việc', vai: ['QL', 'QT'], url: '/my-work' },
  {
    trang: 'Công việc', vai: ['QL', 'QT', 'GVCN'], url: '/my-work?nguoi=tat-ca',
    maChuDich: { GVCN: 403 },
  },
  { trang: 'Công việc', vai: ['QL'], url: '/my-work?nguoi={gv}' },
  /* PR-DUYET: hộp Chờ duyệt (GV 403), Yêu cầu của tôi, số đếm cho badge/dải Tổng quan. */
  { trang: 'Công việc', vai: ['QL', 'QT', 'GVCN'], url: '/yeu-cau?hop=cho-duyet', maChuDich: { GVCN: 403 } },
  { trang: 'Công việc', vai: ['QL', 'QT'], url: '/yeu-cau?hop=cho-duyet&xem=da-xu-ly' },
  { trang: 'Công việc', vai: ['GVCN', 'GVBM'], url: '/yeu-cau?hop=cua-toi' },
  { trang: 'Công việc', vai: MOI_VAI, url: '/yeu-cau/dem' },
  { trang: 'Tổng quan GV', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG'], url: '/tong-quan/hoc-vien-can-ho-tro' },
  { trang: 'Tổng quan GV', vai: ['GVCN', 'GVBM', 'GVCN_THUONG'], url: '/highlights' },
  { trang: 'Tổng quan GV', vai: ['GVCN'], url: '/y-thuc/my-coordination' },

  // ---------------------------------------------------------------- Học viên & Lớp
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/classes' },
  { trang: 'Học viên & Lớp', vai: ['QL', 'QT'], url: '/classes?branchId={cn}' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop' },
  { trang: 'Học viên & Lớp', vai: ['QL', 'QT'], url: '/hoc-vien-lop?phamVi=chi-nhanh&branchId={cn}' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop/luu-tru' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop/luu-tru?branchId={cn}' },

  // ---------------------------------------------------------------- Hồ sơ lớp (FT)
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/overview' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/roster' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/issue-board?category=listening' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/phan-tich-lop' },
  /* PR-HVL (7): panel Tuần khai giảng — thêm `coGiuaKhoa` và `tomTatMt` (một câu). */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/progress' },
  /* PR-HVL (6): danh sách sau một số ở bảng vấn đề / hiệu quả PA — tính lại bằng chính `issueBoard`. */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/issue-board/o?category=listening&cot=case' },
  /* PR-HVL (5): tab Học viên › Cần hỗ trợ — trần = `/cases?classId=` + 8. */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/can-ho-tro' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/y-thuc' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/violations' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/cham' },
  /* PR-UX3: ⋮ Xoá lớp / Kết thúc lớp — chỉ Quản trị hệ thống; QL và GV nhận 403 (máy chủ kiểm quyền, không chỉ ẩn nút). */
  {
    trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/xoa-ket-thuc',
    maChuDich: { QL: 403, GVCN: 403, GVBM: 403, GVCN_THUONG: 403 },
  },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/cases?classId={lopFT}' },

  // ---------------------------------------------------------------- Hồ sơ lớp (thường)
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/overview' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/roster' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/phan-tich-lop' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/can-ho-tro' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/y-thuc' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/cham' },
  /* PR-LT, Task 5: GVCN_THUONG đọc được kế hoạch Chuyển tiếp lớp (canEdit=false ở đó), không sửa được (chỉ QL/QT gọi POST). */
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/transition' },
  /* PR-CT (Q30-2): phiếu bàn giao cả lớp nguồn — số câu KHÔNG đổi theo số em (phép kiểm CT 5h). */
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/lenh-chuyen/ban-giao?lop={lopThuong}' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/cases?classId={lopThuong}' },

  // ---------------------------------------------------------------- Lịch Test (PR-UX1: gộp Cần chấm)
  { trang: 'Lịch Test', vai: MOI_VAI, url: '/cham/lich-test' },
  { trang: 'Lịch Test', vai: MOI_VAI, url: '/cham/lich-test?phamVi=tat-ca' },
  { trang: 'Lịch Test', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/cham/lich-test?classId={lopFT}' },

  /*
   * {hv} và {case} nằm trong lớp FT (MB FT 101) — GVCN_THUONG (chủ nhiệm MB FOU 12, lớp khác) không có phân công ở
   * lớp/HV này nên bị 403 đúng luật, không đưa vào vai của các dòng dưới.
   */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/skill-board' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/cases/{case}' },
  /* PR-VAI-b (V1/K3-47): dải "n yêu cầu chờ bạn duyệt" của hồ sơ HV — chỉ Quản lý / Quản trị gọi (GVCN 403). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN'], url: '/yeu-cau?studentId={hv}', maChuDich: { GVCN: 403 } },
  /* PR-Qb (sửa sau rà #75, vấn đề 5) — tab Hành trình, cả giai đoạn mặc định lẫn ?giai-doan=thuong. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/hanh-trinh' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/hanh-trinh?giai-doan=thuong' },
  /* PR-YT4: tab Ý thức của HV (thang, thanh việc, dòng thời gian trộn) — cũng là khung phải của tab lớp khi chọn em. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/y-thuc' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/y-thuc?pham-vi=tat-ca' },
  /* PR-XOA: ⋮ › Xoá học viên — xem trước "những gì sẽ mất", chỉ Quản trị hệ thống. */
  { trang: 'Hồ sơ HV', vai: ['QT', 'QL', 'GVCN'], url: '/students/{hv}/xoa', maChuDich: { QL: 403, GVCN: 403 } },
  /* PR-LT: {hv} là em lớp FT nên `lop.laLopThuong=false`, nhưng đường vẫn 200 với mọi vai xem được hồ sơ. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/lo-trinh-tiep' },
  /* PR-LT, Q3 → PR-CT (Q30-1): quyền chuyển lớp kiểm Ở LỚP NGUỒN và chỉ Quản lý có (`class.edit`); GVCN, GVBM bị 403. */
  {
    trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/chuyen-lop/lop-dich?studentId={hv}',
    maChuDich: { GVBM: 403 },
  },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/chuyen-lop', maChuDich: { GVCN: 403, GVBM: 403 } },
  {
    /* {lopThuong} khác lớp nguồn của {hv} (MB FT 101) — {lopFT} sẽ trùng lớp nguồn, lopDichHopLe từ chối. */
    trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/chuyen-lop?toClassId={lopThuong}',
    maChuDich: { GVCN: 403, GVBM: 403 },
  },

  // ---------------------------------------------------------------- Danh sách Case
  { trang: 'Danh sách Case', vai: MOI_VAI, url: '/cases' },
  { trang: 'Danh sách Case', vai: MOI_VAI, url: '/cases/queues' },

  // ---------------------------------------------------------------- Việc cần làm
  { trang: 'Việc cần làm', vai: MOI_VAI, url: '/tasks' },
  { trang: 'Việc cần làm', vai: ['QL', 'QT'], url: '/mgmt-tasks/mine' },
  /* PR-Qb (sửa sau rà #75, vấn đề 5). */
  { trang: 'Việc cần làm', vai: MOI_VAI, url: '/notifications' },

  // ---------------------------------------------------------------- Kế hoạch Test (PR-Rc2)
  { trang: 'Kế hoạch Test', vai: MOI_VAI, url: '/ke-hoach-test/lop?branchId={cn}' },
  {
    trang: 'Kế hoạch Test', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG'], url: '/ke-hoach-test/ft/{lopFT}',
    maChuDich: { GVCN: 403, GVBM: 403, GVCN_THUONG: 403 },
  },
  {
    trang: 'Kế hoạch Test', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG'], url: '/ke-hoach-test/thuong/{lopThuong}',
    maChuDich: { GVCN: 403, GVBM: 403, GVCN_THUONG: 403 },
  },

  // ---------------------------------------------------------------- Công việc · Vận hành (PR-Ra)
  /* GVCN không vào được tab Vận hành, nhưng `listMgmtTasks` trả `scopeEmpty` chứ không 403 — mã thật là 200. */
  { trang: 'Công việc', vai: ['QL', 'QT', 'GVCN'], url: '/mgmt-tasks' },
  { trang: 'Công việc', vai: ['QL', 'QT'], url: '/mgmt-tasks?hang=qua-han' },
  { trang: 'Công việc', vai: ['QL', 'QT'], url: '/meeting/board' },

  // ---------------------------------------------------------------- PR-XUAT — xem trước Xuất Excel kết quả Test (GVBM không xuất → 403)
  /* Không đo vai GVBM: `USER.GVBM` (GV bộ môn MB FT 101) ở bộ demo kiêm GVCN lớp khác nên được xuất lớp đó (200); 403 của GVBM thuần kiểm ở prXuat.tests.ts. */
  { trang: 'Xuất Excel MT', vai: ['QL', 'QT', 'GVCN'], url: '/xuat-mt/xem-truoc?tg=dot&dot=mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,mt:7,mt:8' },
  { trang: 'Xuất Excel MT', vai: ['GVCN_THUONG'], url: '/xuat-mt/xem-truoc?khung=thuong&tg=dot&dot=giua,cuoi' },

  // ---------------------------------------------------------------- PR-GV — hồ sơ giáo viên + ô danh sách (GV chỉ xem chính mình: GVBM → 403; GVCN và GVCN_THUONG là cùng một người, id 7)
  { trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}', maChuDich: { GVBM: 403 } },
  { trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}/viec', maChuDich: { GVBM: 403 } },
  { trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}/ket-qua', maChuDich: { GVBM: 403 } },
  /* PR-S5F-b: GV nhiều lớp nhất bộ demo (Phạm Thu Trang, id 9 — 18 lớp): kết quả đọc mọi lớp một lượt, số câu không tăng theo lớp. */
  { trang: 'Hồ sơ GV', vai: ['QL', 'QT'], url: '/giao-vien/9/ket-qua' },
  { trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}/o?cot=chua-nhap', maChuDich: { GVBM: 403 } },
  { trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}/o?cot=case-mo', maChuDich: { GVBM: 403 } },
  /* Bảng giáo viên của chi nhánh (Tổng quan › Theo lớp › Theo giáo viên): chỉ Quản lý / Quản trị; GVCN → 403. */
  { trang: 'Tổng quan QL', vai: ['QL', 'QT', 'GVCN'], url: '/giao-vien?cn={cn}&ct=ft', maChuDich: { GVCN: 403 } },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT', 'GVCN'], url: '/giao-vien?cn={cn}&ct=thuong', maChuDich: { GVCN: 403 } },
  /* PR-Pb2-a: Hiệu quả PA lọc giáo viên + khoảng tuần (URL Hợp đồng a↔b, link từ hồ sơ GV / bảng giáo viên). */
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/hieu-qua-pa?gv={gv}&tu=2026-08-31&den=2026-09-14' },
  /* PR-Pb2-a (4): Tổng hợp Test — lớp thường thêm một câu Mini Test cố định (theo lô), không tăng theo số bài. */
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/tong-hop?ct=ft' },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/tong-hop?ct=thuong&theo=dot' },
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
  'QL /tong-quan/quan-ly': 87,   // PR-Pb2-a: vắng ct = FT (lọc khung), đo 81–83
  'QT /tong-quan/quan-ly': 87,   // PR-Pb2-a: như trên
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
  // PR-YT2 (8), 23/09/2026 — mốc chốt ngay sau khi thêm đường, đo được 11/12 câu: max(sau+10, ⌈sau×1.3⌉).
  'QL /metrics/vi-pham-theo-nhom': 21,
  'QT /metrics/vi-pham-theo-nhom': 21,
  'QL /metrics/vi-pham-tong?classId=3': 22,
  'QT /metrics/vi-pham-tong?classId=3': 22,
  // PR-UX4 (2)(3), 24/09/2026 — mốc chốt ngay sau khi thêm đường (đo 13–16 câu): max(sau+10, ⌈sau×1.3⌉).
  'QL /phan-tich/van-de-hv': 25,
  'QT /phan-tich/van-de-hv': 25,
  'GVCN /phan-tich/van-de-hv': 20,
  'QL /phan-tich/van-de-hv?gop=1': 25,
  'QT /phan-tich/van-de-hv?gop=1': 25,
  'QL /phan-tich/van-de-hv/o?dong=chua-phan-loai&cot=case': 26,
  'QT /phan-tich/van-de-hv/o?dong=chua-phan-loai&cot=case': 26,
  'QL /phan-tich/hieu-qua-pa': 24,
  'QT /phan-tich/hieu-qua-pa': 23,
  'GVCN /phan-tich/hieu-qua-pa': 20,
  'QL /phan-tich/hieu-qua-pa?tg=26': 24,
  'QT /phan-tich/hieu-qua-pa?tg=26': 23,
  'QL /phan-tich/y-thuc': 26,
  'QT /phan-tich/y-thuc': 26,
  'GVCN /phan-tich/y-thuc': 20,
  // PR-UX4 (5): boQuen dùng chung cho đường, hai chỉ số và hai dòng Cần xử lý — đo 22 câu (một lượt gọi, không nhân theo số HV).
  'QL /phan-tich/bo-quen?loai=can-ho-tro-2-lan': 32,
  'QT /phan-tich/bo-quen?loai=can-ho-tro-2-lan': 32,
  'QL /metrics/hv-can-ho-tro-2-lan-chua-case': 32,
  'QT /metrics/hv-can-ho-tro-2-lan-chua-case': 32,
  'QL /metrics/case-xac-dinh-nguyen-nhan-qua-han': 32,
  'QT /metrics/case-xac-dinh-nguyen-nhan-qua-han': 32,
  'GVCN /my-work': 76,   // PR-CT gộp LT2b: 68 → 76   // PR-LT2b: việc Ghi Mini Test + bộ demo D10–D13 (2 lớp mới: MB BE 04, MB ELE 02) 63 → 68 (+8 %)
  'GVBM /my-work': 79,   // PR-CT gộp LT2b: 70 → 79   // PR-LT2b: như trên 62 → 70 (+13 %)
  'GVCN_THUONG /my-work': 76,   // PR-CT gộp LT2b: 68 → 76
  /* PR-Ra: trang "Công việc" dùng lại /my-work cho QL·QT, cộng chế độ nguoi=tat-ca/{gv} (Q1–Q2). */
  'QL /my-work': 77,   // PR-CT gộp LT2b: 67 → 77   // PR-LT2b: bộ demo D10–D13
  'QT /my-work': 79,   // PR-CT gộp LT2b: 69 → 79
  'QL /my-work?nguoi=tat-ca': 86,   // PR-CT gộp LT2b: 77 → 86   // PR-LT2b: Mini Test + demo D10–D13 (+2)
  'QT /my-work?nguoi=tat-ca': 88,   // PR-CT gộp LT2b: 79 → 88
  'GVCN /my-work?nguoi=tat-ca': 19,
  'QL /my-work?nguoi=7': 86,   // PR-CT gộp LT2b: 78 → 86
  /* PR-DUYET: đo khi hộp đã có thẻ thật (Task 4) — trần max(sau+10, ⌈sau×1,3⌉). */
  'QL /yeu-cau?hop=cho-duyet': 38,   // PR-CT gộp LT2b: 34 → 38   // PR-LT2a (11): demo G1–G5 có thẻ ke_hoach_bo_tro → loại thẻ thêm câu nạp (đo 32, MỘT lần mỗi loại, không theo số thẻ); PR-YT4 sau khi gộp PR-SOS: thẻ khong_theo_doi + bao_len_y_thuc cùng nạp (đo 29, +3,6%); PR-HVL (10): demo H1 thêm một thẻ "không theo dõi" chờ duyệt → đo 30   // PR-LT2b: hai loại thẻ Báo lên mới (+1–2 câu nap)
  'QT /yeu-cau?hop=cho-duyet': 37,   // PR-CT gộp LT2b: 33 → 37
  'GVCN /yeu-cau?hop=cho-duyet': 17,
  /* PR-VAI-b (V1/K3-47): dải chờ duyệt của hồ sơ HV — đo 21/20/7, trần max(sau+10, ⌈sau×1,3⌉). */
  'QL /yeu-cau?studentId=1': 31,
  'QT /yeu-cau?studentId=1': 30,
  'GVCN /yeu-cau?studentId=1': 17,
  'QL /yeu-cau?hop=cho-duyet&xem=da-xu-ly': 30,   // PR-CT gộp main (LT2a + GV + demo CT): 29 → 30   // PR-SOS: loại thẻ khong_theo_doi thêm câu nạp (đo 23); + thẻ Ý thức PR-YT4 (đo 27)   // PR-CT: 28 → 29 (gộp main)
  'QT /yeu-cau?hop=cho-duyet&xem=da-xu-ly': 29,   // PR-CT gộp main (LT2a + GV + demo CT): 28 → 29   // PR-SOS: loại thẻ khong_theo_doi thêm câu nạp (đo 22)   // PR-CT: 27 → 28 (gộp main)
  'GVCN /yeu-cau?hop=cua-toi': 28,   // PR-CT gộp main (LT2a + GV + demo CT): 27 → 28   // PR-CT: 25 → 27 (gộp main)
  'GVBM /yeu-cau?hop=cua-toi': 22,   // PR-CT gộp main (LT2a + GV + demo CT): 21 → 22
  'QL /yeu-cau/dem': 25,
  'GVCN /yeu-cau/dem': 21,
  'GVBM /yeu-cau/dem': 21,
  'GVCN_THUONG /yeu-cau/dem': 21,
  'QT /yeu-cau/dem': 24,
  'QL /mgmt-tasks': 23,
  'QT /mgmt-tasks': 23,
  'GVCN /mgmt-tasks': 18,
  'QL /mgmt-tasks?hang=qua-han': 23,
  'QT /mgmt-tasks?hang=qua-han': 23,
  'QL /meeting/board': 30,
  'QT /meeting/board': 30,
  'QL /tong-quan/hoc-vien-can-ho-tro': 42,
  'QT /tong-quan/hoc-vien-can-ho-tro': 39,
  'GVCN /tong-quan/hoc-vien-can-ho-tro': 42,
  'GVBM /tong-quan/hoc-vien-can-ho-tro': 42,
  'GVCN_THUONG /tong-quan/hoc-vien-can-ho-tro': 42,
  'GVCN /highlights': 28,
  'GVBM /highlights': 28,
  'GVCN_THUONG /highlights': 28,
  'GVCN /y-thuc/my-coordination': 59,   // PR-CT Task 12 (bộ demo có lệnh): 51 → 59
  'QL /classes': 35,
  'GVCN /classes': 36,
  'GVBM /classes': 36,
  'GVCN_THUONG /classes': 36,
  'QT /classes': 39,
  'QL /classes?branchId=1': 35,
  'QT /classes?branchId=1': 35,
  /* PR-HVL (3): mốc 51 (QT 49) + việc tiếp theo/Ý thức/thẻ chờ duyệt theo lô đo 59 (QT 57) — trần kế hoạch = mốc + 12. */
  /* PR-S4F #5: +3 câu — `quetYeuCau` trước khi đếm thẻ chờ duyệt (badge = hộp); nhớ theo request nên chỉ một lần. */
  /* PR-LT2a (Task 7): +1 câu `emCoBaoPhChuaLam` (việc Báo phụ huynh qua TVV của GVCN, MỘT câu theo lô) — đo 67; trần 66 → 72 (+9%, < 30%). */
  'QL /hoc-vien-lop': 72,
  'GVCN /hoc-vien-lop': 72,
  'GVBM /hoc-vien-lop': 72,
  'GVCN_THUONG /hoc-vien-lop': 72,
  'QT /hoc-vien-lop': 85,
  'QL /hoc-vien-lop?phamVi=chi-nhanh&branchId=1': 72,
  'QT /hoc-vien-lop?phamVi=chi-nhanh&branchId=1': 70,
  'QL /classes/3/overview': 62,   // PR-CT gộp LT2b: 61 → 62
  'GVCN /classes/3/overview': 62,   // PR-CT gộp LT2b: 61 → 62
  'GVBM /classes/3/overview': 62,   // PR-CT gộp LT2b: 61 → 62
  'GVCN_THUONG /classes/3/overview': 62,   // PR-CT gộp LT2b: 61 → 62
  'QT /classes/3/overview': 59,   // PR-CT gộp LT2b: 58 → 59   // PR-CT gộp main (LT2a + GV + demo CT): 57 → 58   // PR-S4F #5: +3 câu quét thẻ chờ duyệt   // PR-CT: 54 → 57 (gộp main)
  /* PR-HVL (2): mốc 46 (QT 43) + Case mở theo lô (`chiTietCaseMo`) đo 50 (QT 47) — trần kế hoạch = mốc + 6. */
  /* PR-HVL (5): `/classes/:id/can-ho-tro` đo 25 (QT 22) = `/cases?classId=` 17 (QT 14) + 8 — đúng trần kế hoạch. */
  /* PR-HVL (7): `/classes/:id/progress` đo 17 (QT 16) sau khi thêm `tomTatMt` — trần = đo + 3. */
  'QL /classes/3/progress': 20,
  'GVCN /classes/3/progress': 20,
  'GVBM /classes/3/progress': 20,
  'GVCN_THUONG /classes/3/progress': 20,
  'QT /classes/3/progress': 19,
  'QL /classes/3/can-ho-tro': 25,
  'GVCN /classes/3/can-ho-tro': 25,
  'GVBM /classes/3/can-ho-tro': 25,
  'GVCN_THUONG /classes/3/can-ho-tro': 25,
  'QT /classes/3/can-ho-tro': 22,
  'QL /classes/6/can-ho-tro': 25,
  'GVCN_THUONG /classes/6/can-ho-tro': 25,
  'QT /classes/6/can-ho-tro': 22,
  'QL /classes/3/roster': 52,
  'GVCN /classes/3/roster': 52,
  'GVBM /classes/3/roster': 52,
  'GVCN_THUONG /classes/3/roster': 52,
  'QT /classes/3/roster': 49,
  /* PR-HVL (6): `issueBoard` chỉ gọi `planOutcomes` MỘT lần — mốc 22 (QT 21) → đo 16 (QT 15); trần = đo + 2 (kế hoạch: ≤ mốc + 2). Đường `/o` (danh sách sau số) đo 17 (QT 16). */
  'QL /classes/3/issue-board?category=listening': 18,
  'GVCN /classes/3/issue-board?category=listening': 18,
  'GVBM /classes/3/issue-board?category=listening': 18,
  'GVCN_THUONG /classes/3/issue-board?category=listening': 18,
  'QT /classes/3/issue-board?category=listening': 17,
  'QL /classes/3/issue-board/o?category=listening&cot=case': 19,
  'GVCN /classes/3/issue-board/o?category=listening&cot=case': 19,
  'GVBM /classes/3/issue-board/o?category=listening&cot=case': 19,
  'GVCN_THUONG /classes/3/issue-board/o?category=listening&cot=case': 19,
  'QT /classes/3/issue-board/o?category=listening&cot=case': 18,
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
  // PR-YT2 (2), 23/09/2026 — mốc chốt ngay sau khi thêm đường, đo được 13 câu (QT 12 câu): max(sau+10, ⌈sau×1.3⌉).
  'QL /classes/3/violations': 23,
  'GVCN /classes/3/violations': 23,
  'GVBM /classes/3/violations': 23,
  'GVCN_THUONG /classes/3/violations': 23,
  'QT /classes/3/violations': 22,
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
  // PR-UX1 (3), 23/09/2026 — Lịch Test gộp Cần chấm (thêm `listAttempts` cho khối Nợ tuần trước): 16 → 26 câu (QT 28),
  // vẫn ít hơn hai trang cũ cộng lại (16 + 24). Trần max(sau+10, ⌈sau×1.3⌉).
  'QL /cham/lich-test': 36,
  'GVCN /cham/lich-test': 36,
  'GVBM /cham/lich-test': 36,
  'GVCN_THUONG /cham/lich-test': 36,
  'QT /cham/lich-test': 38,
  'QL /cham/lich-test?phamVi=tat-ca': 36,
  'GVCN /cham/lich-test?phamVi=tat-ca': 36,
  'GVBM /cham/lich-test?phamVi=tat-ca': 36,
  'GVCN_THUONG /cham/lich-test?phamVi=tat-ca': 36,
  'QT /cham/lich-test?phamVi=tat-ca': 38,
  'QL /cham/lich-test?classId=3': 36,
  'QT /cham/lich-test?classId=3': 35,
  'GVCN /cham/lich-test?classId=3': 36,
  'GVBM /cham/lich-test?classId=3': 36,
  // PR-VAI-b: đầu hồ sơ 30 giây (việc theo người, câu tóm tắt, bốn ô, Tạm dừng) — đo 97/94/99/99 sau khi nhớ `programmeOfClass` theo request
  // và lấy tên người làm qua JOIN; giữ trần cứng 100 (luật +10/+30 % cho 107–109, vượt trần cứng).
  'QL /students/1': 100,
  'QT /students/1': 100,
  'GVCN /students/1': 100,
  'GVBM /students/1': 100,
  'QL /students/1/skill-board': 56,
  'QT /students/1/skill-board': 54,
  'GVCN /students/1/skill-board': 56,
  'GVBM /students/1/skill-board': 56,
  'QL /cases/1': 42,
  'QT /cases/1': 40,
  'GVCN /cases/1': 42,
  'GVBM /cases/1': 42,
  // PR-Qb (sửa sau rà #75, vấn đề 5) — trần đo NGAY SAU khi bỏ isRatioClass/classProgressMany thừa ở profile.ts.
  'QL /students/1/hanh-trinh': 39,
  'QT /students/1/hanh-trinh': 38,
  'GVCN /students/1/hanh-trinh': 40,
  'GVBM /students/1/hanh-trinh': 40,
  'QL /students/1/hanh-trinh?giai-doan=thuong': 38,
  'QT /students/1/hanh-trinh?giai-doan=thuong': 37,
  'GVCN /students/1/hanh-trinh?giai-doan=thuong': 39,
  'GVBM /students/1/hanh-trinh?giai-doan=thuong': 39,
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
  // PR-Qb (sửa sau rà #75, vấn đề 5).
  'QL /notifications': 19,
  'GVCN /notifications': 19,
  'GVBM /notifications': 19,
  'GVCN_THUONG /notifications': 19,
  'QT /notifications': 19,
  'QL /ke-hoach-test/lop?branchId=1': 22,   // PR-XLMT: +1 câu đếm "cần xếp lại"
  'GVCN /ke-hoach-test/lop?branchId=1': 21,
  'GVBM /ke-hoach-test/lop?branchId=1': 21,
  'GVCN_THUONG /ke-hoach-test/lop?branchId=1': 21,
  'QT /ke-hoach-test/lop?branchId=1': 22,   // PR-XLMT: +1 câu đếm "cần xếp lại"
  'QL /ke-hoach-test/ft/3': 30,   // PR-XLMT: +1 câu đề nghị dời chờ duyệt (chip chờ Quản lý duyệt)
  'QT /ke-hoach-test/ft/3': 30,   // PR-XLMT: +1 câu đề nghị dời chờ duyệt (chip chờ Quản lý duyệt)
  // PR-UX2: lưới lớp thường theo HV × kỹ năng — đo 25/24 câu, trần = max(đo+10, ⌈đo×1.3⌉).
  'QL /ke-hoach-test/thuong/5': 35,
  'QT /ke-hoach-test/thuong/5': 34,
  // PR-LT (rà PR #86) — mốc chốt trên số đo sau khi rà, giống công thức chung: max(sau+10, ⌈sau×1.3⌉).
  'QL /hoc-vien-lop/luu-tru': 22,
  'GVCN /hoc-vien-lop/luu-tru': 22,
  'GVBM /hoc-vien-lop/luu-tru': 22,
  'GVCN_THUONG /hoc-vien-lop/luu-tru': 22,
  'QT /hoc-vien-lop/luu-tru': 22,
  'QL /hoc-vien-lop/luu-tru?branchId=1': 22,
  'GVCN /hoc-vien-lop/luu-tru?branchId=1': 22,
  'GVBM /hoc-vien-lop/luu-tru?branchId=1': 22,
  'GVCN_THUONG /hoc-vien-lop/luu-tru?branchId=1': 22,
  'QT /hoc-vien-lop/luu-tru?branchId=1': 22,
  /* PR-HVL (8): `/classes/:id/transition` thêm `ketQua` từng em (một lần `standingFor`, 7 câu): 28 → 35 (QT 27 → 34). Kế hoạch dự kiến mốc + 5 = 33; `standingFor` tự nó tốn 7 câu nên lệch 2 — ghi Nhật ký. */
  /* PR-LT2b (3): `cuoiKhoaTheoHocVien` cho cả lớp (+2 câu: lượt Cuối khoá · lộ trình tiếp theo; điểm + chương trình đã đọc chung): QL 37 → 39, QT 36 → 38, GVCN_THUONG 37 → 39 (+5 %). */
  'QL /classes/6/transition': 42,   // PR-CT gộp LT2b: 39 → 42
  'QT /classes/6/transition': 41,   // PR-CT gộp LT2b: 38 → 41
  'GVCN_THUONG /classes/6/transition': 42,   // PR-CT gộp LT2b: 39 → 42
  'QL /classes/5/transition': 36,
  'QT /classes/5/transition': 35,
  'GVCN_THUONG /classes/5/transition': 36,
  /* PR-CT (Task 6): phiếu bàn giao cả lớp nguồn — đo 14 / 13 / 13 câu (chưa có lệnh) → trần max(sau+10, ⌈sau×1.3⌉). Task 12 đo lại với bộ demo có lệnh. */
  'QL /lenh-chuyen/ban-giao?lop=6': 24,
  'QT /lenh-chuyen/ban-giao?lop=6': 23,
  'GVCN_THUONG /lenh-chuyen/ban-giao?lop=6': 23,
  /* PR-YT4: tab Ý thức của HV — đo 29/09: QL/GVCN/GVBM 23, QT 20 → trần max(sau+10, ⌈sau×1,3⌉). */
  'QL /students/1/y-thuc': 33,
  'QT /students/1/y-thuc': 30,
  'GVCN /students/1/y-thuc': 33,
  'GVBM /students/1/y-thuc': 33,
  'QL /students/1/y-thuc?pham-vi=tat-ca': 33,
  'QT /students/1/y-thuc?pham-vi=tat-ca': 30,
  'GVCN /students/1/y-thuc?pham-vi=tat-ca': 33,
  'GVBM /students/1/y-thuc?pham-vi=tat-ca': 33,
  'QL /students/1/lo-trinh-tiep': 23,
  'QT /students/1/lo-trinh-tiep': 21,
  'GVCN /students/1/lo-trinh-tiep': 25,
  'GVBM /students/1/lo-trinh-tiep': 25,
  'QL /chuyen-lop/lop-dich?studentId=1': 29,
  'QT /chuyen-lop/lop-dich?studentId=1': 28,
  'GVCN /chuyen-lop/lop-dich?studentId=1': 29,
  'GVBM /chuyen-lop/lop-dich?studentId=1': 21,
  'QL /students/1/chuyen-lop': 21,
  'QT /students/1/chuyen-lop': 20,
  'GVCN /students/1/chuyen-lop': 22,
  'GVBM /students/1/chuyen-lop': 21,
  'QL /students/1/chuyen-lop?toClassId=5': 24,
  'QT /students/1/chuyen-lop?toClassId=5': 23,
  'GVCN /students/1/chuyen-lop?toClassId=5': 25,
  'GVBM /students/1/chuyen-lop?toClassId=5': 21,
  // PR-XUAT (5), 30/09/2026 — mốc chốt ngay sau khi thêm đường, đo 16 câu (khung thường 19), KHÔNG đổi khi nhân dữ liệu ×3: max(sau+10, ⌈sau×1.3⌉).
  'QL /xuat-mt/xem-truoc?tg=dot&dot=mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,mt:7,mt:8': 26,
  'QT /xuat-mt/xem-truoc?tg=dot&dot=mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,mt:7,mt:8': 26,
  'GVCN /xuat-mt/xem-truoc?tg=dot&dot=mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,mt:7,mt:8': 26,
  'GVCN_THUONG /xuat-mt/xem-truoc?khung=thuong&tg=dot&dot=giua,cuoi': 29,
  // PR-GV (3), 30/09/2026 — hồ sơ GV tách 3 lời gọi (gộp một lời gọi đo 113–126 câu, vượt trần cứng 100): max(sau+10, ⌈sau×1.3⌉). Đo GVCN id 7 (6 lớp, 17 Case): hồ sơ 60–65, việc 61–72, kết quả 44–45, ô 20–27 câu; 403 = 10 câu.
  'QL /giao-vien/7': 85,
  'GVCN /giao-vien/7': 78,
  'GVBM /giao-vien/7': 20,
  'GVCN_THUONG /giao-vien/7': 78,
  'QT /giao-vien/7': 80,
  'QL /giao-vien/7/viec': 94,
  'GVCN /giao-vien/7/viec': 80,
  'GVBM /giao-vien/7/viec': 20,
  'GVCN_THUONG /giao-vien/7/viec': 80,
  'QT /giao-vien/7/viec': 91,
  /* PR-S5F-b: `phanTichNhieuLop` đọc mọi lớp một lượt — đo 23–24 câu (trước 73–79, tăng theo số lớp) → trần HẠ về max(sau+10, ⌈sau×1.3⌉). */
  'QL /giao-vien/7/ket-qua': 34,
  'GVCN /giao-vien/7/ket-qua': 33,
  'GVBM /giao-vien/7/ket-qua': 20,
  'GVCN_THUONG /giao-vien/7/ket-qua': 33,
  'QT /giao-vien/7/ket-qua': 34,
  'QL /giao-vien/9/ket-qua': 34,   // PR-S5F-b: GV 18 lớp — trước 105–111 câu (vượt trần cứng 100), nay 24
  'QT /giao-vien/9/ket-qua': 34,
  'QL /giao-vien/7/o?cot=chua-nhap': 37,
  'GVCN /giao-vien/7/o?cot=chua-nhap': 36,
  'GVBM /giao-vien/7/o?cot=chua-nhap': 20,
  'GVCN_THUONG /giao-vien/7/o?cot=chua-nhap': 36,
  'QT /giao-vien/7/o?cot=chua-nhap': 36,
  'QL /giao-vien/7/o?cot=case-mo': 34,
  'GVCN /giao-vien/7/o?cot=case-mo': 33,
  'GVBM /giao-vien/7/o?cot=case-mo': 20,
  'GVCN_THUONG /giao-vien/7/o?cot=case-mo': 33,
  'QT /giao-vien/7/o?cot=case-mo': 30,
  // PR-GV (4), 30/09/2026 — bảng GV chi nhánh: 36 (QL) / 34 (QT) câu, 403 = 9 câu; KHÔNG tăng theo số GV / lớp / Case (phép kiểm prGv.tests.ts).
  'QL /giao-vien?cn=1&ct=ft': 47,
  'QT /giao-vien?cn=1&ct=ft': 45,
  'GVCN /giao-vien?cn=1&ct=ft': 19,
  'QL /giao-vien?cn=1&ct=thuong': 47,
  'QT /giao-vien?cn=1&ct=thuong': 45,
  'GVCN /giao-vien?cn=1&ct=thuong': 19,
  // PR-Pb2-a (3), 01/10/2026 — Hiệu quả PA lọc gv + tu/den: đo 17 (QL) / 16 (QT) câu → max(đo+10, ⌈đo×1.3⌉).
  'QL /phan-tich/hieu-qua-pa?gv=7&tu=2026-08-31&den=2026-09-14': 27,
  'QT /phan-tich/hieu-qua-pa?gv=7&tu=2026-08-31&den=2026-09-14': 26,
  // PR-Pb2-a (4) — Tổng hợp Test: FT 19 câu; lớp thường 20 (+1 câu Mini Test theo lô) → max(đo+10, ⌈đo×1.3⌉).
  'QL /phan-tich/tong-hop?ct=ft': 29,
  'QT /phan-tich/tong-hop?ct=ft': 29,
  'QL /phan-tich/tong-hop?ct=thuong&theo=dot': 30,
  'QT /phan-tich/tong-hop?ct=thuong&theo=dot': 30,
};

/**
 * TRẦN CÂU SQL CỦA ĐƯỜNG GHI THEO LÔ (PR-TOC) — đo qua HTTP trong `tocDo.run.ts` (cuối file, sau mọi phép đo GET). Trên Turso mỗi
 * câu là một lượt mạng 20–50 ms; trước PR-TOC Thêm 35 em FT tốn ~1900 câu (~1 phút) → Netlify cắt, cả lô thất bại. Mốc chốt ngay
 * sau PR-TOC theo cùng công thức `max(sau + 10, ⌈sau × 1.3⌉)`. PR sau làm tăng PHẢI nâng trần kèm lý do, không âm thầm sửa số.
 */
export const TRAN_GHI_LO = {
  /** POST /intake/commit — 35 em lớp FT (lịch MT mặc định, có em "Đã thi tới MT", ngày thi, tuần riêng). Trước PR-TOC 1949, sau 44 (49 sau gộp PR-MON + rà #121: đọc chương trình lớp, đọc lại khoá trong giao dịch). */
  themHocVien35FT: 58,
  /** POST /classes/:id/transition — cả lớp thường (≥ 20 em) sang FT, mỗi em có lịch MT mặc định. Trước PR-TOC 1505, sau 124 → 128 sau rà #121 (32 em, gồm đóng Case mở của em có sẵn — S17). */
  /** POST /classes/:id/transition RA LỆNH cho cả lớp thường (≥ 20 em) — PR-CT (Q30-1) chỉ ghi lệnh theo lô, không chuyển. Trần đặt sau khi đo (Task 3). */
  raLenhCaLop: 30,   // đo 20 câu (41 em) → max(20+10, ⌈20×1.3⌉) = 30
  chuyenCaLopSangFT: 224,   // PR-LT2b (4, 5): đọc Cuối khoá cả lớp + Case/PA bổ trợ theo lô sau chuyển (đo 214; gốc 200, +7 %) → 224; PR-HVL (10): bộ demo H2 thêm 2 em vào MB FOU 12 (một em có 2 Case đóng theo S17, một em có bài Cuối khoá 4 điểm) → đo 191; trần theo dữ liệu, không phải chậm đi của đường
  /** POST /ke-hoach-test/hang-loat `xemTruoc` — cả lớp MB FT 101 (63 em trong bộ đo), MT3, 4 kỹ năng tuần tới (PR-XLMT, rà #126). Đo 78 câu. */
  xemTruocXepLichMt: 114,   // PR-LT2b (10): bộ demo D13 thêm 2 em vào MB FT 101 (+3 câu/em) → đo 111; PR-HVL (10): bộ demo H1 thêm 1 em vào MB FT 101 (+3 câu/em) → đo 105
  /** GET /my-work?nguoi=tat-ca (QL) khi 30 PA "đến lúc thi" chưa có ngày thi (PR-S3F, rà cuối đợt 3). Trước 63 → 147 câu; ngày thi + tuần MT kế tiếp nay lấy trong câu chính. Đo 70 câu (68 khi không có PA) → trần max(sau+10, ⌈sau×1.3⌉) = 91. */
  congViec30PaChuaNgayThi: 91,
  /** POST /xuat-mt — Quản lý xuất cả chi nhánh MB, MT1–MT8, cột đầy đủ, SAU khi nhân dữ liệu ×3 (PR-XUAT). Phải KHÔNG tăng theo số lượt (một câu lượt + các câu lô của loadBundle). Đo 16 câu / 550 lượt → trần max(sau+10, ⌈sau×1.3⌉) = 26. */
  xuatMtChiNhanh: 26,
  /**
   * GET /my-work (GVCN) và /my-work?nguoi=tat-ca (QL) khi toàn hệ thống có thêm 30 nhóm PA bổ trợ đang chạy + 30 nhóm chờ nộp kế hoạch
   * (PR-S5F-b). Trần là số câu TĂNG THÊM so với trước khi chèn 60 nhóm. Trước sửa: GVCN +88, QL +119 (`quyenBoTro` đọc lại Case từng nhóm).
   * Sau: lọc rẻ trước, quyền từ cột đã JOIN → đo +0 / −1 → trần +10.
   */
  congViec60NhomBoTro: 10,
  /** POST /intake/commit — 30 em lớp THƯỜNG (MB FOU 12), mỗi em tự có bài Giữa/Cuối khoá còn hiệu lực (PR-LT2a M1b). Ghi theo lô: số câu không tăng theo số em. */
  themHocVien30Thuong: 72,   // đo 55 câu → trần max(sau+10, ⌈sau×1,3⌉) = 72
};
