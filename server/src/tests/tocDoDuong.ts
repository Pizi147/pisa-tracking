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
 * URL có chỗ thay bằng ID thật lúc chạy: `{lopFT}`, `{lopThuong}`, `{lopBe}`, `{lopPet}`, `{hv}`, `{case}`, `{cn}`.
 */

/** OV-10c: ADMIN (Admin MT, Móng Bình), TVV, CX chỉ đo đường Tổng quan của vai đó — không nằm trong MOI_VAI. */
export type Vai = 'QL' | 'GVCN' | 'GVBM' | 'GVCN_THUONG' | 'QT' | 'ADMIN' | 'TVV' | 'CX';

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

  // ---------------------------------------------------------------- Tổng quan · Quản lý
  {
    trang: 'Tổng quan QL', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/tong-quan/quan-ly',
    maChuDich: { GVCN: 403, GVBM: 403 },
  },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/highlights' },
  { trang: 'Tổng quan TVV / CX', vai: ['TVV', 'CX', 'QT'], url: '/tong-quan/hoc-vien' },   // OV-10c: QT đi nhánh CX (mọi em) trên chi nhánh mẫu
  { trang: 'Tổng quan CX', vai: ['CX'], url: '/tong-quan/hoc-vien?branchId={cn}' },
  { trang: 'Tổng quan Admin', vai: ['ADMIN'], url: '/tong-quan/mock-test' },
  { trang: 'Tổng quan Admin', vai: ['ADMIN'], url: '/highlights' },
  {
    trang: 'Tổng quan QL', vai: ['QL', 'QT', 'GVCN'], url: '/tong-quan/diem-chu-y?ct=ft',   // PR-VAI-a: tách khỏi /tong-quan/quan-ly
    maChuDich: { GVCN: 403 },
  },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/tong-quan/chi-nhanh' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong' },
  /* PR-S6F-b (UXF-a P1): Báo cáo đơn vị — tín hiệu đọc sổ chỉ số MỘT lần mỗi chỉ số (không theo chi nhánh). */
  { trang: 'Báo cáo đơn vị', vai: ['QL', 'QT'], url: '/signals' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/case-mo' },
  /* PR-UXF-a Task 5: danh sách bấm ra "bài chưa nhập điểm quá hạn" — mỗi dòng một bài (ô điểm). */
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/bai-qua-han-nhap-diem?rows=1' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/hv-sos-hien-tai' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/hv-duoi-ky-vong-mon' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/hv-co-case-mo' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/do-phu-danh-gia' },

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
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/lop-thieu-gv-mon' },   // PR-VAI-a: thay chỉ số U3 đã xoá
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
  /* OV-14c: hàng đợi Chấm Speaking (panel của việc) — GV Speaking: mọi lớp FT chi nhánh; GV khác: rỗng. */
  { trang: 'Công việc', vai: ['GVCN', 'GVBM', 'QL'], url: '/my-work/cham-speaking' },
  /* PR-DUYET: hộp Chờ duyệt (GV 403), Yêu cầu của tôi, số đếm cho badge/dải Tổng quan. */
  { trang: 'Công việc', vai: ['QL', 'QT', 'GVCN'], url: '/yeu-cau?hop=cho-duyet', maChuDich: { GVCN: 403 } },
  { trang: 'Công việc', vai: ['QL', 'QT'], url: '/yeu-cau?hop=cho-duyet&xem=da-xu-ly' },
  { trang: 'Công việc', vai: ['GVCN', 'GVBM'], url: '/yeu-cau?hop=cua-toi' },
  { trang: 'Công việc', vai: MOI_VAI, url: '/yeu-cau/dem' },
  /* PR-VAI-a (Q12, Q16): Lớp tôi dạy thay Học viên cần hỗ trợ; badge việc quá hạn của GV. */
  { trang: 'Tổng quan GV', vai: ['GVCN', 'GVBM', 'GVCN_THUONG'], url: '/tong-quan/lop-toi-day?ct=ft' },
  { trang: 'Tổng quan GV', vai: ['GVCN_THUONG'], url: '/tong-quan/lop-toi-day?ct=thuong' },
  { trang: 'Tổng quan GV', vai: ['GVCN'], url: '/tong-quan/lop-toi-day/o?ct=ft&classId={lopFT}&cot=duoiKyVong' },
  /* PR-S6F-b (D10): cột Bài chờ chấm / quá hạn bấm ra danh sách bài (cùng `noDiemCuaGv`). */
  { trang: 'Tổng quan GV', vai: ['GVCN'], url: '/tong-quan/lop-toi-day/o?ct=ft&classId={lopFT}&cot=bai-qua-han' },
  { trang: 'Tổng quan GV', vai: ['GVCN', 'GVBM', 'GVCN_THUONG'], url: '/highlights' },

  // ---------------------------------------------------------------- Học viên & Lớp
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/classes' },
  { trang: 'Học viên & Lớp', vai: ['QL', 'QT'], url: '/classes?branchId={cn}' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop' },
  { trang: 'Học viên & Lớp', vai: ['QL', 'QT'], url: '/hoc-vien-lop?phamVi=chi-nhanh&branchId={cn}' },
  /* OV-10b: Học viên & Lớp của TVV / CX (mỗi em một dòng, chip = chipHocVien) — TVV "HV của tôi" / Cả chi nhánh, CX mọi / một chi nhánh. */
  { trang: 'Học viên & Lớp TVV / CX', vai: ['TVV', 'CX'], url: '/hoc-vien-lop/theo-vai' },
  { trang: 'Học viên & Lớp TVV', vai: ['TVV'], url: '/hoc-vien-lop/theo-vai?phamVi=chi-nhanh' },
  { trang: 'Học viên & Lớp CX', vai: ['CX'], url: '/hoc-vien-lop/theo-vai?branchId={cn}' },
  { trang: 'Học viên & Lớp Admin', vai: ['ADMIN'], url: '/hoc-vien-lop' },
  /* OV-12f: góc Đang SOS (tuần mặc định · Toàn bộ 8 tuần) + panel một em; Admin không có góc này (403). */
  { trang: 'Học viên & Lớp · Đang SOS', vai: [...MOI_VAI, 'TVV', 'CX'], url: '/hoc-vien-lop?goc=sos' },
  { trang: 'Học viên & Lớp · Đang SOS', vai: ['QL', 'QT', 'CX'], url: '/hoc-vien-lop?goc=sos&tuan=tat-ca' },
  { trang: 'Học viên & Lớp · Đang SOS', vai: ['ADMIN'], url: '/hoc-vien-lop?goc=sos', maChuDich: { ADMIN: 403 } },
  { trang: 'Học viên & Lớp · panel một em', vai: MOI_VAI, url: '/hoc-vien-lop/em/{hv}' },
  { trang: 'Hồ sơ HV CX / Admin', vai: ['CX', 'ADMIN'], url: '/students/{hv}' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop/luu-tru' },
  /* OV-15f: góc Lịch thi — em có tháng dự kiến thi chọn + em chưa có dự kiến (lọc tháng ngay trong SQL), nhật ký kết luận theo id lộ trình. */
  { trang: 'Học viên & Lớp · Lịch thi', vai: ['QL', 'QT', 'TVV', 'CX'], url: '/hoc-vien-lop/lich-thi?thang=2026-10,2026-11' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop/ids' },   // PR-TD2-b: Trước/Sau của hồ sơ lớp
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop/luu-tru?branchId={cn}' },

  // ---------------------------------------------------------------- Hồ sơ lớp (FT)
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/overview' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/roster' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/roster?chiId=1' },   // PR-TD2-b: Trước/Sau của hồ sơ HV
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/issue-board?category=listening' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/phan-tich-lop' },
  /* PR-HVL (7): panel Tuần khai giảng — thêm `coGiuaKhoa` và `tomTatMt` (một câu). */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/progress' },
  /* PR-HVL (6): danh sách sau một số ở bảng vấn đề / hiệu quả PA — tính lại bằng chính `issueBoard`. */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/issue-board/o?category=listening&cot=case' },
  /* PR-HVL (5): tab Học viên › Cần hỗ trợ — trần = `/cases?classId=` + 8. */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/can-ho-tro' },
  /* OV-3c: cách xem Kết quả đầu ra (KQĐR lớp trước, 4 tuần theo đợt) — em · MT0 · Final · Case theo lô. */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/ket-qua-dau-ra' },
  /* OV-12g: cách xem Góp ý hàng tuần — 4 tuần một câu + cột / GV phân công một câu. */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/gop-y' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/y-thuc' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/violations' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/cham' },
  /* PR-DL: bảng Điểm theo lớp — danh sách lượt (hồ sơ lớp gọi mỗi lần mở), một lượt MT, danh sách lớp của tab Test (trang web /test/diem-lop). */
  { trang: 'Điểm theo lớp', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/classes/{lopFT}/diem-theo-luot' },
  { trang: 'Điểm theo lớp', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/classes/{lopFT}/diem-theo-luot/mt:2' },
  /* OV-6b2: lớp liên tục MB PET 01 — lượt Checkpoint (quét Checkpoint kế tiếp khi đọc) + Kế hoạch Test cột Checkpoint. */
  { trang: 'Điểm theo lớp', vai: ['QL', 'QT'], url: '/classes/{lopPet}/diem-theo-luot' },
  { trang: 'Điểm theo lớp', vai: ['QL', 'QT'], url: '/classes/{lopPet}/diem-theo-luot/cp:1' },
  { trang: 'Kế hoạch Test', vai: ['QL', 'QT'], url: '/ke-hoach-test/thuong/{lopPet}' },
  { trang: 'Điểm theo lớp', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG'], url: '/diem-theo-lop/lop' },
  /* PR-UX3: ⋮ Xoá lớp / Kết thúc lớp. PR-LUI-b (06/10): Quản lý của lớp cũng xem + Kết thúc được; GV nhận 403 (máy chủ kiểm quyền, không chỉ ẩn nút). */
  {
    trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/xoa-ket-thuc',
    maChuDich: { GVCN: 403, GVBM: 403, GVCN_THUONG: 403 },
  },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/cases?classId={lopFT}' },
  /* PR-SL: ⋮ Sửa thông tin học viên — giá trị hiện tại cả lớp; người không có student.edit của lớp nhận 403. */
  { trang: 'Hồ sơ lớp FT', vai: ['QL', 'GVCN'], url: '/classes/{lopFT}/sua-ca-lop' },

  // ---------------------------------------------------------------- Hồ sơ lớp (thường)
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/overview' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/roster' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/phan-tich-lop' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/can-ho-tro' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/gop-y' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/y-thuc' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/cham' },
  /* PR-LT, Task 5: GVCN_THUONG đọc được kế hoạch Chuyển tiếp lớp (canEdit=false ở đó), không sửa được (chỉ QL/QT gọi POST). */
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/transition' },
  /* PR-K26: bảng Ghi lộ trình tiếp theo cả lớp (⋮ hồ sơ lớp) — đọc theo lô, không tăng theo số em. */
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/lo-trinh-tiep' },
  /* PR-KV: panel Kỳ vọng đầu ra (lớp BE `{lopBe}`) — chỉ Quản lý. */
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopBe}/ky-vong', maChuDich: { GVCN_THUONG: 403 } },
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
  /* PR-Dọn-a (Q2): ô chọn người theo một em — kiểm STUDENT_VIEW trước, rồi lọc theo phạm vi người xem. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/ref/nguoi?nhom=giao_vien&studentId={hv}' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/cases/{case}' },
  /* PR-VAI-b (V1/K3-47): dải "n yêu cầu chờ bạn duyệt" của hồ sơ HV — chỉ Quản lý / Quản trị gọi (GVCN 403). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN'], url: '/yeu-cau?studentId={hv}', maChuDich: { GVCN: 403 } },
  /* PR-Qb (sửa sau rà #75, vấn đề 5) — tab Hành trình, cả giai đoạn mặc định lẫn ?giai-doan=thuong. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/hanh-trinh' },
  /* PR-TK (TK-7): khối Các lộ trình + ngăn Tổng kết lộ trình đọc từ bản chụp; KHÔNG nạp trong `GET /students/{hv}` (trần 90 câu giữ nguyên). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/lo-trinh' },
  /* OV-13j: Lịch sử sửa — GVBM không xem (403). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/lich-su-sua', maChuDich: { GVBM: 403 } },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/lo-trinh/{loTrinhDong}/tong-ket' },
  /* OV-13m: panel Bước tiếp sau thi (đọc trạng thái + quét hẹn bắt đầu). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/cycles/{loTrinhDong}/buoc-tiep' },
  { trang: 'Hồ sơ lớp', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG'], url: '/classes/{lopKetThuc}/tong-ket' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/hanh-trinh?giai-doan=thuong' },
  /* PR-YT4: tab Ý thức của HV (thang, thanh việc, dòng thời gian trộn) — cũng là khung phải của tab lớp khi chọn em. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/y-thuc' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/y-thuc?pham-vi=tat-ca' },
  /* PR-XOA: ⋮ › Xoá học viên — xem trước "những gì sẽ mất", chỉ Quản trị hệ thống. */
  { trang: 'Hồ sơ HV', vai: ['QT', 'QL', 'GVCN'], url: '/students/{hv}/xoa', maChuDich: { GVCN: 403 } },   // OV-12a: QL của em xem / xoá được
  /* PR-LUI-b (5f): panel Học lại — lớp cũ + lộ trình + lớp đang hoạt động kèm sĩ số; chỉ Quản lý / Quản trị của em (GV 403). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/hoc-lai/lop-dich', maChuDich: { GVCN: 403, GVBM: 403 } },
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

  // ---------------------------------------------------------------- Việc cần làm
  { trang: 'Việc cần làm', vai: MOI_VAI, url: '/tasks' },
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
  /* OV-15c (C18): ô tìm lớp / học viên / email — một câu lớp + một câu học viên. */
  { trang: 'Kế hoạch Test', vai: ['QL', 'QT', 'GVCN'], url: '/ke-hoach-test/tim?q=minh&branchId={cn}', maChuDich: { GVCN: 403 } },
  /* OV-15c (C21): lịch sử ghi chú lịch thi (ghi chú lớp — một câu quyền lớp + một câu lịch sử). */
  { trang: 'Kế hoạch Test', vai: ['QL', 'QT', 'GVCN'], url: '/ke-hoach-test/ghi-chu/lich-su?classId={lopFT}', maChuDich: { GVCN: 403 } },

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

  // ---------------------------------------------------------------- PR-Pb2-b — bảng Phân tích giáo viên + panel Chấm điểm (QL, QT; GVCN → 403)
  { trang: 'Phân tích GV', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/giao-vien?cn={cn}&ct=ft', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích GV', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien?cn={cn}&ct=thuong&thang=2026-09' },
  { trang: 'Phân tích GV', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien/cham-diem?cn={cn}&ct=ft&gv={gv}' },

  // ---------------------------------------------------------------- OV-15e — Báo cáo + Kết quả thi (QL, QT; GVCN → 403) + panel chỉ số GV
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/bao-cao?ct=ft', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/bao-cao?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20' },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/bao-cao/o?ct=ft&o=bai-qua-han' },
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/ket-qua-thi?loai=mock&xep=sos&kieu=tuan&tu=2026-07-06&den=2026-09-20', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/ket-qua-thi?loai=thi-that&kieu=tuan&tu=2026-07-06&den=2026-09-20' },
  { trang: 'Phân tích GV', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien/o?cn={cn}&ct=ft&gv={gv}&cot=ghi-pa' },
];

/**
 * TRẦN CÂU SQL (PR-TD Task 5, Q6) — khoá `vai + ' ' + url` (url đã thay id thật, đúng như `tocDo.run.ts` in ra ở
 * "Bảng đo"). Cách đếm: `get`/`run`/`iterate` (không `all` — xem `db.ts`). Cách tính trần, chốt trên số đo NGAY SAU
 * Task 4 (bộ demo gốc, chưa nhân dữ liệu): `max(sau + 10, ⌈sau × 1.3⌉)`, và trần cứng `100`.
 *
 * PR SAU làm một đường tăng số câu PHẢI nâng trần ở đây KÈM LÝ DO trong Nhật ký của PR đó — không âm thầm sửa số.
 * Đường mới thêm vào `DUONG_DO` mà chưa có trong bảng này thì phép kiểm trần bỏ qua (chưa có mốc để so).
 *
 * PR-TD2-d (07/10): phiên + quyền 6 câu → 1 câu (mọi đường −5). Mọi trần đo lại: min(trần cũ, max(đo+10, ⌈đo×1,3⌉)) —
 * số "đo …" trong chú thích từng dòng dưới đây là số đo CŨ, trước TD2-d.
 */
export const TRAN: Record<string, number> = {
  'QL /demo/session': 16,
  'GVCN /demo/session': 16,
  'GVBM /demo/session': 16,
  'GVCN_THUONG /demo/session': 16,
  'QT /demo/session': 16,
  'QL /ref/branches': 14,
  /* PR-LUI-b (5f): trần = max(đo+10, ⌈đo×1,3⌉) — đo 06/10. */
  'QL /students/1/hoc-lai/lop-dich': 28,
  'QT /students/1/hoc-lai/lop-dich': 26,
  /* PR-TK (TK-7): ba đường đọc bản chụp — trần = max(đo+10, ⌈đo×1,3⌉), đo 07/10. */
  'QL /students/1/lo-trinh': 21, 'QT /students/1/lo-trinh': 19, 'GVCN /students/1/lo-trinh': 22, 'GVBM /students/1/lo-trinh': 22,
  /* OV-13m: panel Bước tiếp — trần = max(đo+10, ⌈đo×1,3⌉), đo 15/10: QL 10 · QT 8 · GVCN 11 · GVBM 11. */
  'QL /cycles/1/buoc-tiep': 20, 'QT /cycles/1/buoc-tiep': 18, 'GVCN /cycles/1/buoc-tiep': 21, 'GVBM /cycles/1/buoc-tiep': 21,
  'QL /lo-trinh/1/tong-ket': 20, 'QT /lo-trinh/1/tong-ket': 18, 'GVCN /lo-trinh/1/tong-ket': 21, 'GVBM /lo-trinh/1/tong-ket': 21,
  'QL /classes/1/tong-ket': 19, 'QT /classes/1/tong-ket': 18, 'GVCN /classes/1/tong-ket': 19, 'GVBM /classes/1/tong-ket': 19, 'GVCN_THUONG /classes/1/tong-ket': 19,
  'GVCN /ref/branches': 15,
  'GVBM /ref/branches': 15,
  'GVCN_THUONG /ref/branches': 15,
  'QT /ref/branches': 14,
  /* PR-VAI-a: trần đường mới = max(đo+10, ⌈đo×1,3⌉) — đo 01/10. */
  'QL /tong-quan/diem-chu-y?ct=ft': 46,
  'QT /tong-quan/diem-chu-y?ct=ft': 42,
  'GVCN /tong-quan/diem-chu-y?ct=ft': 14,
  'QL /metrics/lop-thieu-gv-mon': 20,
  'QT /metrics/lop-thieu-gv-mon': 20,
  'GVCN /tong-quan/lop-toi-day?ct=ft': 47,
  'GVBM /tong-quan/lop-toi-day?ct=ft': 47,
  'GVCN_THUONG /tong-quan/lop-toi-day?ct=ft': 47,
  'GVCN_THUONG /tong-quan/lop-toi-day?ct=thuong': 47,
  'GVCN /tong-quan/lop-toi-day/o?ct=ft&classId=3&cot=duoiKyVong': 47,   // {lopFT} = MB FT 101
  'GVCN /tong-quan/lop-toi-day/o?ct=ft&classId=3&cot=bai-qua-han': 54,   // PR-S6F-b D10 — đo 46 (01/10)
  'QL /signals': 41,   // PR-S6F-b: đo 38 (một metricSet mỗi chỉ số)
  'QT /signals': 38,   // đo 35
  'QL /tong-quan/quan-ly': 92,   // OV-15d: + "Cần bạn quyết" (Case quá hạn · Bước tiếp · Chốt lộ trình) — đo 73; trang Tổng quan QL bỏ 6 ô số + Điểm đáng chú ý nên tổng trang giảm
  'QT /tong-quan/quan-ly': 99,   // OV-15d: đo 76   // PR-LCb: đo 60 (PR-MT0 đo 76)
  'GVCN /tong-quan/quan-ly': 15,
  'GVBM /tong-quan/quan-ly': 15,
  'QL /highlights': 25,
  'QT /highlights': 25,
  /* OV-10c: Tổng quan theo vai — CX / QT gọi thêm danh sách Học viên & Lớp (chip Thiếu thông tin cùng nguồn): đo TVV 71, CX 95, QT 94, CX một CN 77, Admin 62 / 15. */
  'TVV /tong-quan/hoc-vien': 85,
  'CX /tong-quan/hoc-vien': 100,
  'QT /tong-quan/hoc-vien': 100,
  'CX /tong-quan/hoc-vien?branchId=1': 90,   // {cn} = Móng Bình
  /* OV-10b: Học viên & Lớp / hồ sơ HV theo vai — trần = min(max(đo+10, ⌈đo×1,3⌉), 100); đo 13/10: TVV 74 · TVV cả CN 72 · CX 97 (chip = chipHocVien, 95 như Tổng quan) · CX một CN 80 · Admin 70 · hồ sơ CX 83 / Admin 86. */
  'TVV /hoc-vien-lop/theo-vai': 97,
  'TVV /hoc-vien-lop/theo-vai?phamVi=chi-nhanh': 94,
  'CX /hoc-vien-lop/theo-vai': 100,
  'CX /hoc-vien-lop/theo-vai?branchId=1': 100,
  'ADMIN /hoc-vien-lop': 91,
  'CX /students/1': 100,
  'ADMIN /students/1': 100,
  'ADMIN /tong-quan/mock-test': 75,
  'ADMIN /highlights': 20,
  'QL /tong-quan/chi-nhanh': 45,
  'QT /tong-quan/chi-nhanh': 41,
  'QL /tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong': 63,   // OV-15d: + tập Case chưa chốt PA (cột Lớp cần chú ý) — đo 48
  'QT /tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong': 60,   // OV-15d: + tập Case chưa chốt PA — đo 46
  'QL /metrics/case-mo': 22,
  'QT /metrics/case-mo': 19,
  'QL /metrics/bai-qua-han-nhap-diem?rows=1': 30,   // PR-UXF-a Task 5: đo 25 → max(25+10, ⌈25×1.3⌉)
  'QT /metrics/bai-qua-han-nhap-diem?rows=1': 28,   // PR-UXF-a Task 5: đo 23
  'QL /metrics/hv-sos-hien-tai': 23,
  'QT /metrics/hv-sos-hien-tai': 23,
  'QL /metrics/hv-duoi-ky-vong-mon': 23,
  'QT /metrics/hv-duoi-ky-vong-mon': 23,
  'QL /metrics/hv-co-case-mo': 22,
  'QT /metrics/hv-co-case-mo': 19,
  'QL /metrics/do-phu-danh-gia': 23,
  'QT /metrics/do-phu-danh-gia': 23,
  // PR-YT2 (8), 23/09/2026 — mốc chốt ngay sau khi thêm đường, đo được 11/12 câu: max(sau+10, ⌈sau×1.3⌉).
  /* PR-DON (ghi chú SAU PR-KV): panel Kỳ vọng đầu ra — trần = max(đo+10, ⌈đo×1,3⌉), đo 10/10: QL 8, QT 7, GVCN_THUONG 403 3. */
  'QL /classes/2/ky-vong': 18,
  'QT /classes/2/ky-vong': 17,
  'GVCN_THUONG /classes/2/ky-vong': 13,
  'QL /metrics/vi-pham-theo-nhom': 18,
  'QT /metrics/vi-pham-theo-nhom': 18,
  'QL /metrics/vi-pham-tong?classId=3': 16,
  'QT /metrics/vi-pham-tong?classId=3': 16,
  // PR-UX4 (2)(3), 24/09/2026 — mốc chốt ngay sau khi thêm đường (đo 13–16 câu): max(sau+10, ⌈sau×1.3⌉).
  'QL /phan-tich/van-de-hv': 20,
  'QT /phan-tich/van-de-hv': 20,
  'GVCN /phan-tich/van-de-hv': 14,
  'QL /phan-tich/van-de-hv?gop=1': 20,
  'QT /phan-tich/van-de-hv?gop=1': 20,
  'QL /phan-tich/van-de-hv/o?dong=chua-phan-loai&cot=case': 20,
  'QT /phan-tich/van-de-hv/o?dong=chua-phan-loai&cot=case': 20,
  'QL /phan-tich/hieu-qua-pa': 21,
  'QT /phan-tich/hieu-qua-pa': 21,
  'GVCN /phan-tich/hieu-qua-pa': 14,
  'QL /phan-tich/hieu-qua-pa?tg=26': 21,
  'QT /phan-tich/hieu-qua-pa?tg=26': 21,
  'QL /phan-tich/y-thuc': 21,
  'QT /phan-tich/y-thuc': 21,
  'GVCN /phan-tich/y-thuc': 14,
  // PR-VAI-a (Q7): đường /phan-tich/bo-quen đã gỡ cùng boQuen.ts.
  'QL /metrics/case-xac-dinh-nguyen-nhan-qua-han': 24,
  'QT /metrics/case-xac-dinh-nguyen-nhan-qua-han': 21,
  'GVCN /my-work': 63,   // TD4: đo 61 (trước 64), trần đo + 2
  'GVBM /my-work': 63,   // TD4: đo 61 (trước 64)
  'GVCN_THUONG /my-work': 63,   // TD4: đo 61 (trước 64)
  /* PR-Ra: trang "Công việc" dùng lại /my-work cho QL·QT, cộng chế độ nguoi=tat-ca/{gv} (Q1–Q2). */
  'QL /my-work': 63,   // TD4: đo 61 (trước 64)
  'QT /my-work': 63,   // TD4: đo 61 (trước 64)
  'QL /my-work?nguoi=tat-ca': 73,   // TD4: đo 69 (trước 76) — một lần `listAttempts`; 16/10 +1 OV-13k (xem_nx_s) +1 OV-13m (Chọn bước tiếp) = 73
  'QT /my-work?nguoi=tat-ca': 73,   // TD4: đo 69 (trước 76); 16/10 +1 OV-13k +1 OV-13m = 73
  'GVCN /my-work?nguoi=tat-ca': 15,
  'QL /my-work?nguoi=7': 68,
  /* OV-14c: GV không phải GV Speaking — rỗng (đo 4); GV Speaking đo ở prOv14c (`TRAN_CHAM_SPEAKING`, đo 14). */
  'GVCN /my-work/cham-speaking': 14, 'GVBM /my-work/cham-speaking': 14, 'QL /my-work/cham-speaking': 14,   // TD4: đo 66 (trước 70)
  /* PR-DUYET: đo khi hộp đã có thẻ thật (Task 4) — trần max(sau+10, ⌈sau×1,3⌉). */
  'QL /yeu-cau?hop=cho-duyet': 38,   // PR-CT gộp LT2b: 34 → 38   // PR-LT2a (11): demo G1–G5 có thẻ ke_hoach_bo_tro → loại thẻ thêm câu nạp (đo 32, MỘT lần mỗi loại, không theo số thẻ); PR-YT4 sau khi gộp PR-SOS: thẻ khong_theo_doi + bao_len_y_thuc cùng nạp (đo 29, +3,6%); PR-HVL (10): demo H1 thêm một thẻ "không theo dõi" chờ duyệt → đo 30   // PR-LT2b: hai loại thẻ Báo QL mới (+1–2 câu nap)
  'QT /yeu-cau?hop=cho-duyet': 37,   // PR-CT gộp LT2b: 33 → 37
  'GVCN /yeu-cau?hop=cho-duyet': 12,
  /* PR-VAI-b (V1/K3-47): dải chờ duyệt của hồ sơ HV — đo 21/20/7, trần max(sau+10, ⌈sau×1,3⌉). */
  'QL /yeu-cau?studentId=1': 26,
  'QT /yeu-cau?studentId=1': 25,
  'GVCN /yeu-cau?studentId=1': 12,
  'QL /yeu-cau?hop=cho-duyet&xem=da-xu-ly': 30,   // PR-CT gộp main (LT2a + GV + demo CT): 29 → 30   // PR-SOS: loại thẻ khong_theo_doi thêm câu nạp (đo 23); + thẻ Ý thức PR-YT4 (đo 27)   // PR-CT: 28 → 29 (gộp main)
  'QT /yeu-cau?hop=cho-duyet&xem=da-xu-ly': 29,   // PR-CT gộp main (LT2a + GV + demo CT): 28 → 29   // PR-SOS: loại thẻ khong_theo_doi thêm câu nạp (đo 22)   // PR-CT: 27 → 28 (gộp main)
  'GVCN /yeu-cau?hop=cua-toi': 28,   // PR-CT gộp main (LT2a + GV + demo CT): 27 → 28   // PR-CT: 25 → 27 (gộp main)
  'GVBM /yeu-cau?hop=cua-toi': 22,   // PR-CT gộp main (LT2a + GV + demo CT): 21 → 22
  'QL /yeu-cau/dem': 25,
  'GVCN /yeu-cau/dem': 21,
  'GVBM /yeu-cau/dem': 21,
  'GVCN_THUONG /yeu-cau/dem': 21,
  'QT /yeu-cau/dem': 24,
  'QL /mgmt-tasks': 17,
  'QT /mgmt-tasks': 17,
  'GVCN /mgmt-tasks': 12,
  'QL /mgmt-tasks?hang=qua-han': 17,
  'QT /mgmt-tasks?hang=qua-han': 17,
  'QL /meeting/board': 23,
  'QT /meeting/board': 23,
  'GVCN /highlights': 25,
  'GVBM /highlights': 25,
  'GVCN_THUONG /highlights': 25,
  'QL /classes': 32,
  'GVCN /classes': 32,
  'GVBM /classes': 32,
  'GVCN_THUONG /classes': 32,
  'QT /classes': 31,
  'QL /classes?branchId=1': 32,
  'QT /classes?branchId=1': 31,
  /* PR-HVL (3): mốc 51 (QT 49) + việc tiếp theo/Ý thức/thẻ chờ duyệt theo lô đo 59 (QT 57) — trần kế hoạch = mốc + 12. */
  /* PR-S4F #5: +3 câu — `quetYeuCau` trước khi đếm thẻ chờ duyệt (badge = hộp); nhớ theo request nên chỉ một lần. */
  /* PR-LT2a (Task 7): +1 câu `emCoBaoPhChuaLam` (việc Báo phụ huynh qua TVV của GVCN, MỘT câu theo lô) — đo 67; trần 66 → 72 (+9%, < 30%). */
  'QL /hoc-vien-lop': 72,
  'GVCN /hoc-vien-lop': 93,   // PR-UXF-a VN29: +4 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 76, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)
  'GVBM /hoc-vien-lop': 93,   // PR-UXF-a VN29: +4 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 76, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)
  'GVCN_THUONG /hoc-vien-lop': 93,   // PR-UXF-a VN29: +4 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 76, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)
  'QT /hoc-vien-lop': 84,
  'QL /hoc-vien-lop?phamVi=chi-nhanh&branchId=1': 72,
  'QT /hoc-vien-lop?phamVi=chi-nhanh&branchId=1': 72,   // PR-TK: đo 71 (bộ demo có thêm em Kết thúc học FT chờ kết quả thi thật chưa lưu trữ)
  'QL /classes/3/overview': 62,   // PR-CT gộp LT2b: 61 → 62
  'GVCN /classes/3/overview': 80,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 68, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)   // PR-CT gộp LT2b: 61 → 62
  'GVBM /classes/3/overview': 80,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 68, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)   // PR-CT gộp LT2b: 61 → 62
  'GVCN_THUONG /classes/3/overview': 80,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 68, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)   // PR-CT gộp LT2b: 61 → 62
  'QT /classes/3/overview': 59,   // PR-CT gộp LT2b: 58 → 59   // PR-CT gộp main (LT2a + GV + demo CT): 57 → 58   // PR-S4F #5: +3 câu quét thẻ chờ duyệt   // PR-CT: 54 → 57 (gộp main)
  /* PR-HVL (2): mốc 46 (QT 43) + Case mở theo lô (`chiTietCaseMo`) đo 50 (QT 47) — trần kế hoạch = mốc + 6. */
  /* PR-HVL (5): `/classes/:id/can-ho-tro` đo 25 (QT 22) = `/cases?classId=` 17 (QT 14) + 8 — đúng trần kế hoạch. */
  /* PR-HVL (7): `/classes/:id/progress` đo 17 (QT 16) sau khi thêm `tomTatMt` — trần = đo + 3. */
  'QL /classes/3/progress': 20,
  'GVCN /classes/3/progress': 20,
  'GVBM /classes/3/progress': 20,
  'GVCN_THUONG /classes/3/progress': 20,
  'QT /classes/3/progress': 19,
  /* PR-SL: ⋮ Sửa thông tin học viên đo 16 (GVCN 17), đọc theo lô — trần = đo + 3. */
  'QL /classes/3/sua-ca-lop': 19,
  'GVCN /classes/3/sua-ca-lop': 20,
  'QL /classes/3/can-ho-tro': 25,
  'GVCN /classes/3/can-ho-tro': 25,
  'GVBM /classes/3/can-ho-tro': 25,
  'GVCN_THUONG /classes/3/can-ho-tro': 25,
  'QT /classes/3/can-ho-tro': 22,
  /* OV-3c: đo 13 (QT 12) — trần max(đo + 10, ⌈đo × 1.3⌉). */
  'QL /classes/3/ket-qua-dau-ra': 23, 'GVCN /classes/3/ket-qua-dau-ra': 23, 'GVBM /classes/3/ket-qua-dau-ra': 23,
  'GVCN_THUONG /classes/3/ket-qua-dau-ra': 23, 'QT /classes/3/ket-qua-dau-ra': 22,
  /* OV-12g: Góp ý hàng tuần đo 9 (QT 8) — trần max(đo + 10, ⌈đo × 1.3⌉). */
  'QL /classes/3/gop-y': 19, 'GVCN /classes/3/gop-y': 19, 'GVBM /classes/3/gop-y': 19, 'GVCN_THUONG /classes/3/gop-y': 19, 'QT /classes/3/gop-y': 18,
  'QL /classes/6/gop-y': 19, 'GVCN_THUONG /classes/6/gop-y': 19, 'QT /classes/6/gop-y': 18,
  'QL /classes/6/can-ho-tro': 25,
  'GVCN_THUONG /classes/6/can-ho-tro': 25,
  'QT /classes/6/can-ho-tro': 22,
  'QL /classes/3/roster': 52,
  'GVCN /classes/3/roster': 65,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 58, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)
  'GVBM /classes/3/roster': 65,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 58, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)
  'GVCN_THUONG /classes/3/roster': 65,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 58, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)
  'QT /classes/3/roster': 49,
  /* PR-TD2-b: danh sách Trước/Sau nhẹ (đo 07/10, ×3 không đổi) — trần max(đo+10, ⌈đo×1,3⌉). */
  'QL /classes/3/roster?chiId=1': 21,
  'GVCN /classes/3/roster?chiId=1': 22,
  'GVBM /classes/3/roster?chiId=1': 22,
  'GVCN_THUONG /classes/3/roster?chiId=1': 22,
  'QT /classes/3/roster?chiId=1': 20,
  'QL /hoc-vien-lop/ids': 20,
  /* OV-15f: góc Lịch thi — đo 16 (QL) / 17 (QT, TVV) / 16 (CX); quyền sửa tính theo LỚP (không theo em: 102 câu → 16). Trần = đo + 6. */
  'QL /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 22,
  'QT /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 23,
  'TVV /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 23,
  'CX /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 22,
  'GVCN /hoc-vien-lop/ids': 19,
  'GVBM /hoc-vien-lop/ids': 19,
  'GVCN_THUONG /hoc-vien-lop/ids': 19,
  'QT /hoc-vien-lop/ids': 21,
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
  'QL /classes/3/phan-tich-lop': 24,
  'GVCN /classes/3/phan-tich-lop': 25,
  'GVBM /classes/3/phan-tich-lop': 25,
  'GVCN_THUONG /classes/3/phan-tich-lop': 25,
  'QT /classes/3/phan-tich-lop': 23,
  'QL /classes/3/y-thuc': 24,
  'GVCN /classes/3/y-thuc': 24,
  'GVBM /classes/3/y-thuc': 24,
  'GVCN_THUONG /classes/3/y-thuc': 24,
  'QT /classes/3/y-thuc': 23,
  // PR-YT2 (2), 23/09/2026 — mốc chốt ngay sau khi thêm đường, đo được 13 câu (QT 12 câu): max(sau+10, ⌈sau×1.3⌉).
  'QL /classes/3/violations': 20,
  'GVCN /classes/3/violations': 20,
  'GVBM /classes/3/violations': 20,
  'GVCN_THUONG /classes/3/violations': 20,
  'QT /classes/3/violations': 19,
  'QL /classes/3/cham': 31,
  'GVCN /classes/3/cham': 31,
  'GVBM /classes/3/cham': 31,
  'GVCN_THUONG /classes/3/cham': 31,
  'QT /classes/3/cham': 30,
  // PR-DL (7), 05/10/2026 — mốc chốt sau khi thêm đường (đo 17/16, 32/31, 16 câu): max(sau+10, ⌈sau×1.3⌉).
  'QL /classes/3/diem-theo-luot': 22,
  'GVCN /classes/3/diem-theo-luot': 22,
  'GVBM /classes/3/diem-theo-luot': 22,
  'QT /classes/3/diem-theo-luot': 21,
  'QL /classes/3/diem-theo-luot/mt:2': 36,   // TD2-a: đo 31 → max(đo+10, ⌈đo×1,3⌉), cũ 42
  'GVCN /classes/3/diem-theo-luot/mt:2': 36,   // TD2-a: đo 31 → max(đo+10, ⌈đo×1,3⌉), cũ 42
  'GVBM /classes/3/diem-theo-luot/mt:2': 36,   // TD2-a: đo 31 → max(đo+10, ⌈đo×1,3⌉), cũ 42
  'QT /classes/3/diem-theo-luot/mt:2': 35,   // TD2-a: đo 30 → max(đo+10, ⌈đo×1,3⌉), cũ 41
  /* OV-6b2: lớp liên tục MB PET 01 (id 30) — trần = max(đo+10, ⌈đo×1,3⌉), đo 12/10 (gồm 1–3 câu quét Checkpoint kế tiếp khi đọc). */
  'QL /classes/30/diem-theo-luot': 24, 'QT /classes/30/diem-theo-luot': 23,
  'QL /classes/30/diem-theo-luot/cp:1': 32, 'QT /classes/30/diem-theo-luot/cp:1': 31,
  'QL /ke-hoach-test/thuong/30': 31, 'QT /ke-hoach-test/thuong/30': 30,
  'QL /diem-theo-lop/lop': 21,
  'GVCN /diem-theo-lop/lop': 21,
  'GVBM /diem-theo-lop/lop': 21,
  'GVCN_THUONG /diem-theo-lop/lop': 21,
  'QT /diem-theo-lop/lop': 21,
  'QL /cases?classId=3': 22,
  'GVCN /cases?classId=3': 22,
  'GVBM /cases?classId=3': 22,
  'GVCN_THUONG /cases?classId=3': 22,
  'QT /cases?classId=3': 19,
  /* PR-S6F-b (UXF-a P2): roster lớp thường — id lớp {lopThuong} nay là 6 (các khoá /classes/5/… cũ không còn khớp, xem thân PR). Đo 01/10. */
  'QL /classes/6/roster': 62,
  'QT /classes/6/roster': 58,
  'GVCN_THUONG /classes/6/roster': 67,   // TD2-a: đo 56 → max(đo+10, ⌈đo×1,3⌉), cũ 76
  // PR-UX1 (3), 23/09/2026 — Lịch Test gộp Cần chấm (thêm `listAttempts` cho khối Nợ tuần trước): 16 → 26 câu (QT 28),
  // vẫn ít hơn hai trang cũ cộng lại (16 + 24). Trần max(sau+10, ⌈sau×1.3⌉).
  // PR-LT3 06/10 — ba khối (khối 2 = hàng lớp tuần trước, thêm ~3 câu; mỗi tuần có ô hạn riêng thêm ~3): đo 30–34 câu (QT 34) — trong trần cũ, giữ.
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
  // PR-VAI-b: đầu hồ sơ 30 giây (việc theo người, câu tóm tắt, bốn ô, Tạm dừng) — đo 97/94/99/99 (phiên 2, Task 9 bỏ `journeyRows`/`episodes`: 96/93/98/98) sau khi nhớ `programmeOfClass` theo request
  // và lấy tên người làm qua JOIN; giữ trần cứng 100 (luật +10/+30 % cho 107–109, vượt trần cứng).
  /* PR-Dọn (Task 9): gom câu hồ sơ HV 93–98 → 81–86 (JSON 4 vai × 3 em giống hệt) — trần hạ xuống đo + 10. */
  'QL /students/1': 94,
  'QT /students/1': 91,
  'GVCN /students/1': 96,
  'GVBM /students/1': 96,
  /* PR-Dọn (Task 1, Q2): ô chọn người theo một em — đo + 10. */
  'QL /ref/nguoi?nhom=giao_vien&studentId=1': 19,
  'QT /ref/nguoi?nhom=giao_vien&studentId=1': 17,
  'GVCN /ref/nguoi?nhom=giao_vien&studentId=1': 20,
  'GVBM /ref/nguoi?nhom=giao_vien&studentId=1': 20,
  /* PR-Dọn (9c): khoá lớp thường đổi /5 → /6 ({lopThuong} thật) — đo 01/10, trần max(đo + 10, ⌈đo × 1,3⌉), trần cứng 100. */
  'QL /classes/6/overview': 88,   // TD2-a: đo 72 → max(đo+10, ⌈đo×1,3⌉), cũ 97
  'QT /classes/6/overview': 84,   // TD2-a: đo 69 → max(đo+10, ⌈đo×1,3⌉), cũ 93
  'GVCN_THUONG /classes/6/overview': 93,   // TD2-a: đo 76 → max(đo+10, ⌈đo×1,3⌉), cũ 100
  'QL /classes/6/phan-tich-lop': 24,
  'QT /classes/6/phan-tich-lop': 23,
  'GVCN_THUONG /classes/6/phan-tich-lop': 25,
  'QL /classes/6/y-thuc': 23,
  'QT /classes/6/y-thuc': 22,
  'GVCN_THUONG /classes/6/y-thuc': 23,
  'QL /classes/6/cham': 29,   // TD2-a: đo 24 → max(đo+10, ⌈đo×1,3⌉), cũ 35
  'QT /classes/6/cham': 28,   // TD2-a: đo 23 → max(đo+10, ⌈đo×1,3⌉), cũ 34
  'GVCN_THUONG /classes/6/cham': 29,   // TD2-a: đo 24 → max(đo+10, ⌈đo×1,3⌉), cũ 35
  'QL /cases?classId=6': 22,
  'QT /cases?classId=6': 19,
  'GVCN_THUONG /cases?classId=6': 22,
  'QL /ke-hoach-test/thuong/6': 30,
  'QT /ke-hoach-test/thuong/6': 29,
  /* PR-CL (B3): HV 1 (FT) → MB FOU 12 = nhánh FT → thường của xem trước (kế hoạch lượt, tuLopThuong, Case theo chương trình) — đo 08/10 QL 15 / QT 14;
     min(trần cũ, max(đo+10, ⌈đo×1,3⌉)) = trần cũ. */
  'QL /students/1/chuyen-lop?toClassId=6': 22,
  'QT /students/1/chuyen-lop?toClassId=6': 21,
  'GVCN /students/1/chuyen-lop?toClassId=6': 13,
  'GVBM /students/1/chuyen-lop?toClassId=6': 13,
  'QL /students/1/skill-board': 52,
  'QT /students/1/skill-board': 49,
  'GVCN /students/1/skill-board': 52,
  'GVBM /students/1/skill-board': 52,
  'QL /cases/1': 41,
  'QT /cases/1': 38,
  'GVCN /cases/1': 41,
  'GVBM /cases/1': 41,
  // PR-Qb (sửa sau rà #75, vấn đề 5) — trần đo NGAY SAU khi bỏ isRatioClass/classProgressMany thừa ở profile.ts.
  // PR-VAI-b: thêm chương theo lớp (ghi danh, GVCN, quyết định chuyển lớp, Tạm dừng — số câu cố định) → đo 26/24/27/27 (trước 22/20/23/23); trần giữ.
  // Bù lại tab không còn gọi `/lich-su-lop` (21–23 câu một lượt — đường đã bỏ).
  'QL /students/1/hanh-trinh': 31,
  'QT /students/1/hanh-trinh': 29,
  'GVCN /students/1/hanh-trinh': 32,
  'GVBM /students/1/hanh-trinh': 32,
  'QL /students/1/hanh-trinh?giai-doan=thuong': 31,
  'QT /students/1/hanh-trinh?giai-doan=thuong': 29,
  'GVCN /students/1/hanh-trinh?giai-doan=thuong': 32,
  'GVBM /students/1/hanh-trinh?giai-doan=thuong': 32,
  'QL /cases': 22,
  'GVCN /cases': 22,
  'GVBM /cases': 22,
  'GVCN_THUONG /cases': 22,
  'QT /cases': 19,
  'QL /tasks': 17,
  'GVCN /tasks': 14,
  'GVBM /tasks': 14,
  'GVCN_THUONG /tasks': 14,
  'QT /tasks': 17,
  // PR-Qb (sửa sau rà #75, vấn đề 5).
  'QL /notifications': 13,
  'GVCN /notifications': 13,
  'GVBM /notifications': 13,
  'GVCN_THUONG /notifications': 13,
  'QT /notifications': 13,
  'QL /ke-hoach-test/lop?branchId=1': 22,   // PR-XLMT: +1 câu đếm "cần xếp lại"
  'GVCN /ke-hoach-test/lop?branchId=1': 13,
  'GVBM /ke-hoach-test/lop?branchId=1': 13,
  'GVCN_THUONG /ke-hoach-test/lop?branchId=1': 13,
  'QT /ke-hoach-test/lop?branchId=1': 22,   // PR-XLMT: +1 câu đếm "cần xếp lại"
  'QL /ke-hoach-test/tim?q=minh&branchId=1': 15, 'QT /ke-hoach-test/tim?q=minh&branchId=1': 14,   // OV-15c: đo 5 / 4 → đo + 10
  'QL /ke-hoach-test/ghi-chu/lich-su?classId=3': 15, 'QT /ke-hoach-test/ghi-chu/lich-su?classId=3': 14,   // OV-15c: đo 5 / 4 → đo + 10
  'QL /ke-hoach-test/ft/3': 23,   // TD2-a: đo 18 → max(đo+10, ⌈đo×1,3⌉), cũ 30   // PR-XLMT: +1 câu đề nghị dời chờ duyệt (chip chờ Quản lý duyệt)
  'QT /ke-hoach-test/ft/3': 22,   // TD2-a: đo 17 → max(đo+10, ⌈đo×1,3⌉), cũ 30   // PR-XLMT: +1 câu đề nghị dời chờ duyệt (chip chờ Quản lý duyệt)
  // PR-UX2: lưới lớp thường theo HV × kỹ năng — đo 25/24 câu, trần = max(đo+10, ⌈đo×1.3⌉).
  // PR-LT (rà PR #86) — mốc chốt trên số đo sau khi rà, giống công thức chung: max(sau+10, ⌈sau×1.3⌉).
  'QL /hoc-vien-lop/luu-tru': 21,
  'GVCN /hoc-vien-lop/luu-tru': 20,
  'GVBM /hoc-vien-lop/luu-tru': 20,
  'GVCN_THUONG /hoc-vien-lop/luu-tru': 20,
  'QT /hoc-vien-lop/luu-tru': 20,
  'QL /hoc-vien-lop/luu-tru?branchId=1': 21,
  'GVCN /hoc-vien-lop/luu-tru?branchId=1': 20,
  'GVBM /hoc-vien-lop/luu-tru?branchId=1': 20,
  'GVCN_THUONG /hoc-vien-lop/luu-tru?branchId=1': 20,
  'QT /hoc-vien-lop/luu-tru?branchId=1': 20,
  /* PR-HVL (8): `/classes/:id/transition` thêm `ketQua` từng em (một lần `standingFor`, 7 câu): 28 → 35 (QT 27 → 34). Kế hoạch dự kiến mốc + 5 = 33; `standingFor` tự nó tốn 7 câu nên lệch 2 — ghi Nhật ký. */
  /* PR-LT2b (3): `cuoiKhoaTheoHocVien` cho cả lớp (+2 câu: lượt Cuối khoá · lộ trình tiếp theo; điểm + chương trình đã đọc chung): QL 37 → 39, QT 36 → 38, GVCN_THUONG 37 → 39 (+5 %). */
  'QL /classes/6/transition': 50,   // PR-CT gộp LT2b: 39 → 42; PR-MT0: + một câu MT0 cả lớp, đo 43; trần max(n+10, ⌈n×1,3⌉) = 56 (planning 07/10)
  'QT /classes/6/transition': 49,   // PR-CT gộp LT2b: 38 → 41; PR-MT0 → 42
  'GVCN_THUONG /classes/6/transition': 50,   // PR-CT gộp LT2b: 39 → 42; PR-MT0 → 43
  'QL /classes/6/lo-trinh-tiep': 28,   // PR-K26 mới: đo 19
  'QT /classes/6/lo-trinh-tiep': 27,   // PR-K26 mới: đo 18
  'GVCN_THUONG /classes/6/lo-trinh-tiep': 28,   // PR-K26 mới: đo 20
  /* PR-CT (Task 6): phiếu bàn giao cả lớp nguồn — đo 14 / 13 / 13 câu (chưa có lệnh) → trần max(sau+10, ⌈sau×1.3⌉). Task 12 đo lại với bộ demo có lệnh. */
  'QL /lenh-chuyen/ban-giao?lop=6': 19,
  'QT /lenh-chuyen/ban-giao?lop=6': 18,
  'GVCN_THUONG /lenh-chuyen/ban-giao?lop=6': 18,
  /* PR-YT4: tab Ý thức của HV — đo 29/09: QL/GVCN/GVBM 23, QT 20 → trần max(sau+10, ⌈sau×1,3⌉). */
  'QL /students/1/y-thuc': 27,
  'QT /students/1/y-thuc': 24,
  'GVCN /students/1/y-thuc': 27,
  'GVBM /students/1/y-thuc': 27,
  'QL /students/1/y-thuc?pham-vi=tat-ca': 27,
  'QT /students/1/y-thuc?pham-vi=tat-ca': 24,
  'GVCN /students/1/y-thuc?pham-vi=tat-ca': 27,
  'GVBM /students/1/y-thuc?pham-vi=tat-ca': 27,
  'QL /students/1/lo-trinh-tiep': 23,
  'QT /students/1/lo-trinh-tiep': 21,
  'GVCN /students/1/lo-trinh-tiep': 25,
  'GVBM /students/1/lo-trinh-tiep': 25,
  /* PR-CL (B2): + câu sĩ số (QL/QT), branchCode cùng câu lớp — đo 08/10 QL 14 / QT 13 / GVCN 13; min(trần cũ, max(đo+10, ⌈đo×1,3⌉)) = trần cũ. */
  'QL /chuyen-lop/lop-dich?studentId=1': 23,
  'QT /chuyen-lop/lop-dich?studentId=1': 22,
  'GVCN /chuyen-lop/lop-dich?studentId=1': 23,
  'GVBM /chuyen-lop/lop-dich?studentId=1': 15,
  'QL /students/1/chuyen-lop': 19,
  'QT /students/1/chuyen-lop': 18,
  'GVCN /students/1/chuyen-lop': 13,
  'GVBM /students/1/chuyen-lop': 13,
  // PR-XUAT (5), 30/09/2026 — mốc chốt ngay sau khi thêm đường, đo 16 câu (khung thường 19), KHÔNG đổi khi nhân dữ liệu ×3: max(sau+10, ⌈sau×1.3⌉).
  'QL /xuat-mt/xem-truoc?tg=dot&dot=mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,mt:7,mt:8': 21,
  'QT /xuat-mt/xem-truoc?tg=dot&dot=mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,mt:7,mt:8': 21,
  'GVCN /xuat-mt/xem-truoc?tg=dot&dot=mt:1,mt:2,mt:3,mt:4,mt:5,mt:6,mt:7,mt:8': 21,
  'GVCN_THUONG /xuat-mt/xem-truoc?khung=thuong&tg=dot&dot=giua,cuoi': 24,
  // PR-GV (3), 30/09/2026 — hồ sơ GV tách 3 lời gọi (gộp một lời gọi đo 113–126 câu, vượt trần cứng 100): max(sau+10, ⌈sau×1.3⌉). Đo GVCN id 7 (6 lớp, 17 Case): hồ sơ 60–65, việc 61–72, kết quả 44–45, ô 20–27 câu; 403 = 10 câu.
  'QL /giao-vien/7': 84,
  'GVCN /giao-vien/7': 76,
  'GVBM /giao-vien/7': 16,
  'GVCN_THUONG /giao-vien/7': 76,
  'QT /giao-vien/7': 78,
  'QL /giao-vien/7/viec': 94,
  'GVCN /giao-vien/7/viec': 80,
  'GVBM /giao-vien/7/viec': 16,
  'GVCN_THUONG /giao-vien/7/viec': 80,
  'QT /giao-vien/7/viec': 91,
  /* PR-S5F-b: `phanTichNhieuLop` đọc mọi lớp một lượt — đo 23–24 câu (trước 73–79, tăng theo số lớp) → trần HẠ về max(sau+10, ⌈sau×1.3⌉). */
  'QL /giao-vien/7/ket-qua': 30,
  'GVCN /giao-vien/7/ket-qua': 28,
  'GVBM /giao-vien/7/ket-qua': 16,
  'GVCN_THUONG /giao-vien/7/ket-qua': 28,
  'QT /giao-vien/7/ket-qua': 29,
  'QL /giao-vien/9/ket-qua': 30,   // PR-S5F-b: GV 18 lớp — trước 105–111 câu (vượt trần cứng 100), nay 24
  'QT /giao-vien/9/ket-qua': 29,
  'QL /giao-vien/7/o?cot=chua-nhap': 34,
  'GVCN /giao-vien/7/o?cot=chua-nhap': 32,
  'GVBM /giao-vien/7/o?cot=chua-nhap': 16,
  'GVCN_THUONG /giao-vien/7/o?cot=chua-nhap': 32,
  'QT /giao-vien/7/o?cot=chua-nhap': 33,
  'QL /giao-vien/7/o?cot=case-mo': 30,
  'GVCN /giao-vien/7/o?cot=case-mo': 28,
  'GVBM /giao-vien/7/o?cot=case-mo': 16,
  'GVCN_THUONG /giao-vien/7/o?cot=case-mo': 28,
  'QT /giao-vien/7/o?cot=case-mo': 27,   // OV-13a (B): +1 câu MT cuối của lộ trình (chữ mốc "đến MT{n}") khi danh sách có PA "đến lúc thi" — một câu cho cả trang
  // PR-GV (4), 30/09/2026 — bảng GV chi nhánh: 36 (QL) / 34 (QT) câu, 403 = 9 câu; KHÔNG tăng theo số GV / lớp / Case (phép kiểm prGv.tests.ts).
  'QL /giao-vien?cn=1&ct=ft': 41,
  'QT /giao-vien?cn=1&ct=ft': 39,
  'GVCN /giao-vien?cn=1&ct=ft': 14,
  'QL /giao-vien?cn=1&ct=thuong': 41,
  'QT /giao-vien?cn=1&ct=thuong': 39,
  'GVCN /giao-vien?cn=1&ct=thuong': 14,
  // PR-Pb2-a (3), 01/10/2026 — Hiệu quả PA lọc gv + tu/den: đo 17 (QL) / 16 (QT) câu → max(đo+10, ⌈đo×1.3⌉).
  'QL /phan-tich/hieu-qua-pa?gv=7&tu=2026-08-31&den=2026-09-14': 24,
  'QT /phan-tich/hieu-qua-pa?gv=7&tu=2026-08-31&den=2026-09-14': 23,
  // PR-Pb2-a (4) — Tổng hợp Test: FT 19 câu; lớp thường 20 (+1 câu Mini Test theo lô) → max(đo+10, ⌈đo×1.3⌉).
  'QL /phan-tich/tong-hop?ct=ft': 24,
  'QT /phan-tich/tong-hop?ct=ft': 24,
  'QL /phan-tich/tong-hop?ct=thuong&theo=dot': 25,
  'QT /phan-tich/tong-hop?ct=thuong&theo=dot': 25,
  // PR-Pb2-b — bảng Phân tích giáo viên (đo 01/10, bộ demo D18): max(đo+10, ⌈đo×1.3⌉)
  'QL /phan-tich/giao-vien?cn=1&ct=ft': 47,   // đo 37
  'QT /phan-tich/giao-vien?cn=1&ct=ft': 43,   // đo 34
  'GVCN /phan-tich/giao-vien?cn=1&ct=ft': 14,   // 403, đo 9
  'QL /phan-tich/giao-vien?cn=1&ct=thuong&thang=2026-09': 40,   // đo 34
  'QT /phan-tich/giao-vien?cn=1&ct=thuong&thang=2026-09': 37,   // đo 31
  'QL /phan-tich/giao-vien/cham-diem?cn=1&ct=ft&gv=7': 29,   // đo 24
  'QT /phan-tich/giao-vien/cham-diem?cn=1&ct=ft&gv=7': 28,   // đo 23
  // OV-15e (19/10): Báo cáo · Kết quả thi · panel chỉ số GV — max(đo + 10, ⌈đo × 1,3⌉)
  'QL /phan-tich/bao-cao?ct=ft': 82,   // đo 63
  'QT /phan-tich/bao-cao?ct=ft': 76,   // đo 58
  'GVCN /phan-tich/bao-cao?ct=ft': 14,   // đo 4
  'QL /phan-tich/bao-cao?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20': 64,   // đo 49
  'QT /phan-tich/bao-cao?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20': 58,   // đo 44
  'QL /phan-tich/bao-cao/o?ct=ft&o=bai-qua-han': 42,   // đo 32
  'QT /phan-tich/bao-cao/o?ct=ft&o=bai-qua-han': 40,   // đo 30
  'QL /phan-tich/ket-qua-thi?loai=mock&xep=sos&kieu=tuan&tu=2026-07-06&den=2026-09-20': 34,   // đo 24
  'QT /phan-tich/ket-qua-thi?loai=mock&xep=sos&kieu=tuan&tu=2026-07-06&den=2026-09-20': 34,   // đo 24
  'GVCN /phan-tich/ket-qua-thi?loai=mock&xep=sos&kieu=tuan&tu=2026-07-06&den=2026-09-20': 14,   // đo 4
  'QL /phan-tich/ket-qua-thi?loai=thi-that&kieu=tuan&tu=2026-07-06&den=2026-09-20': 15,   // đo 5
  'QT /phan-tich/ket-qua-thi?loai=thi-that&kieu=tuan&tu=2026-07-06&den=2026-09-20': 15,   // đo 5
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=ghi-pa': 29,   // đo 19
  'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=ghi-pa': 27,   // đo 17
};

/**
 * TRẦN CÂU SQL CỦA ĐƯỜNG GHI THEO LÔ (PR-TOC) — đo qua HTTP trong `tocDo.run.ts` (cuối file, sau mọi phép đo GET). Trên Turso mỗi
 * câu là một lượt mạng 20–50 ms; trước PR-TOC Thêm 35 em FT tốn ~1900 câu (~1 phút) → Netlify cắt, cả lô thất bại. Mốc chốt ngay
 * sau PR-TOC theo cùng công thức `max(sau + 10, ⌈sau × 1.3⌉)`. PR sau làm tăng PHẢI nâng trần kèm lý do, không âm thầm sửa số.
 */
/**
 * TRẦN DÒNG ĐỌC (TD2-a) — khoá như `TRAN`. Số dòng mọi câu SQL trả về trong request (`all` → length, `get` → 0/1; đếm ở db.ts).
 * Turso: khối dữ liệu đọc (dòng × cột) chiếm phần lớn thời gian các trang chậm, số câu không bắt được — trần này bắt đọc lặp/đọc thừa.
 * Trần = max(đo + 50, ⌈đo × 1,3⌉), đo NGAY SAU TD2-a trên bộ demo gốc. Sau nhân dữ liệu ×3: ≤ 3 × trần.
 * TD7b: dòng TRẢ VỀ không đổi (cùng tập lượt, JSON trùng) nên trần giữ nguyên; phần giảm là dòng DUYỆT (điểm + lịch của MỌI lượt cho từng lượt) — không đếm ở đây,
 * khoá bằng EXPLAIN (không SCAN assessment_attempts, đi idx_attempt_o_cho[_lop]) ở khối "TD7b" của tocDo.run.ts.
 */
export const TRAN_DONG: Record<string, number> = {
  'QL /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 709,   // OV-15f: đo 545 (43 em FT, ×3 → 1 515); trần = max(đo + 50, ⌈đo × 1,3⌉)
  'QL /my-work': 1104,   // TD4: đo 849 (trước 2155)
  'GVCN /my-work': 1069,   // TD4: đo 822 (trước 1784)
  'GVBM /my-work': 1102,   // TD4: đo 847 (trước 2016)
  'GVCN_THUONG /my-work': 1069,   // TD4: đo 822 (trước 1784)
  'QT /my-work': 1263,   // TD4: đo 971 (trước 2889)
  'QL /my-work?nguoi=tat-ca': 1455,   // TD4: đo 1119 (trước 2793)
  'QT /my-work?nguoi=tat-ca': 1631,   // TD4: đo 1254 (trước 3688)
  'QL /classes/3/roster': 2226,   // đo 1712
  'GVCN /classes/3/roster': 2447,   // đo 1882
  'GVBM /classes/3/roster': 2463,   // đo 1894
  'GVCN_THUONG /classes/3/roster': 2447,   // đo 1882
  'QT /classes/3/roster': 2153,   // đo 1656
  'QL /cham/lich-test': 748,   // TD7c: đo 575 (trước TD7c 720; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'GVCN /cham/lich-test': 579,   // TD7c: đo 445 (trước TD7c 561; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'GVBM /cham/lich-test': 631,   // TD7c: đo 485 (trước TD7c 614; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'GVCN_THUONG /cham/lich-test': 579,   // TD7c: đo 445 (trước TD7c 561; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'QT /cham/lich-test': 860,   // TD7c: đo 661 (trước TD7c 868; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'QL /cham/lich-test?phamVi=tat-ca': 748,   // TD7c: đo 575 (trước TD7c 720; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'GVCN /cham/lich-test?phamVi=tat-ca': 579,   // TD7c: đo 445 (trước TD7c 561; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'GVBM /cham/lich-test?phamVi=tat-ca': 631,   // TD7c: đo 485 (trước TD7c 614; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'GVCN_THUONG /cham/lich-test?phamVi=tat-ca': 579,   // TD7c: đo 445 (trước TD7c 561; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'QT /cham/lich-test?phamVi=tat-ca': 860,   // TD7c: đo 661 (trước TD7c 868; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'QL /cham/lich-test?classId=3': 653,   // TD7c: đo 502 (trước TD7c 559; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'QT /cham/lich-test?classId=3': 678,   // TD7c: đo 521 (trước TD7c 578; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'GVCN /cham/lich-test?classId=3': 556,   // TD7c: đo 427 (trước TD7c 484; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'GVBM /cham/lich-test?classId=3': 591,   // TD7c: đo 454 (trước TD7c 511; khối 1 chỉ nạp lượt có ô thi trước tuần trước)
  'QL /tong-quan/chi-nhanh': 3336,   // đo 2566
  'QT /tong-quan/chi-nhanh': 4397,   // đo 3382
  'QL /tong-quan/diem-chu-y?ct=ft': 3260,   // đo 2507
  'QT /tong-quan/diem-chu-y?ct=ft': 4235,   // đo 3257
  'GVCN /tong-quan/lop-toi-day?ct=ft': 2703,   // đo 2079
  'GVBM /tong-quan/lop-toi-day?ct=ft': 3059,   // đo 2353
  'GVCN_THUONG /tong-quan/lop-toi-day?ct=ft': 2703,   // đo 2079
  'QL /metrics/hv-duoi-ky-vong-mon': 2093,   // đo 1610
  'QT /metrics/hv-duoi-ky-vong-mon': 3040,   // đo 2338
  'QL /hoc-vien-lop': 3416,   // TD3-b: đo 2627 (68 câu)
  'GVCN /hoc-vien-lop': 2602,   // TD3-b: đo 2001 (72 câu)
  'GVBM /hoc-vien-lop': 2975,   // TD3-b: đo 2288 (72 câu)
  'GVCN_THUONG /hoc-vien-lop': 2602,   // TD3-b: đo 2001 (72 câu)
  'QT /hoc-vien-lop': 3305,   // TD3-b: đo 2542 (67 câu)
  'QL /classes/3/overview': 1152,   // TD3-b: đo 886 (56 câu)
  'GVCN /classes/3/overview': 1211,   // TD3-b: đo 931 (60 câu)
  'GVBM /classes/3/overview': 1208,   // TD3-b: đo 929 (60 câu)
  'GVCN_THUONG /classes/3/overview': 1211,   // TD3-b: đo 931 (60 câu)
  'QT /classes/3/overview': 1076,   // TD3-b: đo 827 (53 câu)
  'QL /classes/6/overview': 801,   // TD3-b: đo 616 (68 câu)
  'QT /classes/6/overview': 756,   // TD3-b: đo 581 (65 câu)
  'GVCN_THUONG /classes/6/overview': 819,   // TD3-b: đo 630 (72 câu)
};

export const TRAN_GHI_LO = {
  /** PR-VN4: Huỷ cả lượt (`huyLuot`) lượt nặng nhất trên dữ liệu cuối run.ts — trước 223–341 câu (bản chính 329): Huỷ điểm từng ô qua `saveScore`. */
  huyCaLuot: 120,
  /** PR-OV4a: Khôi phục lượt (`reopenAttempt` đưa bản cất về: lượt, lịch, điểm, Case / PA / Phối hợp / tín hiệu) — lượt nặng nhất trên dữ liệu cuối run.ts. */
  khoiPhucLuot: 154,   // OV-13l: đo 118 câu (273 lượt; lượt nặng nhất đưa về 12 Case — em chuyển FT → FT giữ lộ trình) → max(118 + 10, ⌈118 × 1,3⌉); trước 81 → 106
  /** OV-7b: POST /followups/:id/sua — sửa lần ghi Kết quả PA gần nhất: đảo hệ quả cũ + chạy lại `updateResult` (Kết thúc → Tiếp tục) trong một giao dịch, trả Case. */
  suaKetQua: 95,   // đo 73 câu (~40 là `caseDetail` trả về) → max(73 + 10, ⌈73 × 1,3⌉)
  /** OV-7b: cùng đường, chỉ sửa chữ (giữ lựa chọn) — cập nhật dòng, không đảo. */
  suaKetQuaChu: 76,   // đo 58 câu (gồm kiểm quyền PA) → max(58 + 10, ⌈58 × 1,3⌉)
  /** OV-7b: GET /followups/:id/sua — điền sẵn form Sửa kết quả (PA như trước lần ghi, giá trị cũ, câu chặn). */
  moSuaKetQua: 18,   // đo 8 câu → max(8 + 10, ⌈8 × 1,3⌉)
  /** OV-13b: POST /interventions/:id/de-xuat-doi-pa — PA mới chờ duyệt + thẻ "Đề xuất PA" + PA gốc trỏ PA mới, trả Case. */
  deXuatDoiPa: 123,   // đo 94 câu (~40 là `caseDetail` trả về) → max(94 + 10, ⌈94 × 1,3⌉)
  /** OV-13b: POST /followups/:id/hoan-tac — đảo lần ghi kết quả vừa lưu (như Sửa đảo) + rút đề xuất cùng lần, trả Case. */
  /** OV-13k: PUT /attempts/:id/scores/speaking/phu-trach — nhận xét GV phụ trách + nhóm ô S, nhật ký, đồng bộ nguyên nhân Case MT. */
  nhanXetPhuTrach: 22,   // đo 12 câu → max(12 + 10, ⌈12 × 1,3⌉)
  hoanTacKetQua: 99,   // đo 76 câu → max(76 + 10, ⌈76 × 1,3⌉)
  /** OV-15d: đồng bộ thông báo tự động của MỘT người (`dongBoThongBaoTuDong`, khi mở chuông ≤ 1 lần / 5 phút) — QL / GVCN, trong giao dịch rồi cuộn lại. */
  dongBoThongBaoQL: 41,   // đo 31 câu (×3) → max(31 + 10, ⌈31 × 1,3⌉)
  dongBoThongBaoGVCN: 50,   // đo 38 câu (×3, 1 081 dòng) → max(38 + 10, ⌈38 × 1,3⌉)
  /** POST /notifications/doc-het — một câu UPDATE (S6F-a 10e) + phiên/quyền. PR-Dọn (9d): trần đặt sau khi đo. */
  docHet: 19,   // đo 9 câu → max(9 + 10, ⌈9 × 1,3⌉)
  /** POST /intake/commit — 35 em lớp FT (lịch MT mặc định, có em "Đã thi tới MT", ngày thi, tuần riêng). Trước PR-TOC 1949, sau 44 (49 sau gộp PR-MON + rà #121: đọc chương trình lớp, đọc lại khoá trong giao dịch). */
  themHocVien35FT: 58,
  /** POST /classes/:id/transition — cả lớp thường (≥ 20 em) sang FT, mỗi em có lịch MT mặc định. Trước PR-TOC 1505, sau 124 → 128 sau rà #121 (32 em, gồm đóng Case mở của em có sẵn — S17). */
  /** POST /classes/:id/transition RA LỆNH cho cả lớp thường (≥ 20 em) — PR-CT (Q30-1) chỉ ghi lệnh theo lô, không chuyển. Trần đặt sau khi đo (Task 3). */
  /** OV-3b: PUT /classes/:id/lo-trinh-nhap — nháp cả lớp thường theo lô (em · lệnh · lớp đích · một câu ghi + nhật ký), không theo số em. */
  luuNhapCaLop: 40,
  raLenhCaLop: 64,   // OV-3b: + tiến độ lớp nguồn (tuần Final → hạn bàn giao `hanBanGiaoLenh`) + xoá nháp cùng tx — đo 61, CỐ ĐỊNH (không theo số em), trần đo + 3. PR-CT2 (§8): + 1 câu đọc bài Final ĐỦ điểm / có Mini Test của lô (dongBoCheTaiFinal — không em nào thì dừng sau câu đó) — đo 52, trần đo + 3. Trước đó: đo 20 câu (41 em) → max(20+10, ⌈20×1.3⌉) = 30; PR-LCa: + đồng bộ Lộ trình tiếp theo (đọc LTT + khoá, ghi LTT/Hành trình/nhật ký, tạo MT0 Lên FT theo lô) — đo 27 → 49, +22 câu CỐ ĐỊNH (LC-i: không theo số em); PR-LCa (T3): chỉ đọc khoá khi có Lên FT chưa ghi Target → đo 48, trần đo + 3
  /** PR-CT2 (§8): ra lệnh Lên cả lớp thường 10 em đã đủ điểm Final → sinh bổ trợ sớm theo lô (Case · PA · Mini Test · chuông · Hành trình). */
  raLenhSinhBoTro: 64,   // OV-3b: + 9 câu cố định (tiến độ lớp nguồn + xoá nháp) → đo 61, trần đo + 3. Trước: đo 51 (10 em có Case Giữa khoá nhận PA — `dongBoTrangThaiCaseLo` theo lô; từng Case: 59), trần đo + 3
  /** PR-CT2 (§8): đổi lệnh 10 em Lên → Học lại → huỷ bổ trợ chưa ai đụng THEO LÔ (đóng Case, huỷ PA, xoá Mini Test / chuông / Hành trình). */
  doiLenhHuyBoTro: 68,   // OV-3b: + 13 câu cố định (tiến độ lớp nguồn + xoá nháp + phiếu làm lại khi đổi hướng) → đo 65, trần đo + 3. Trước: đo 52 (10 em có Case Giữa khoá giữ, chỉ huỷ PA + mốc — đồng bộ trạng thái theo lô; từng Case: 70), trần đo + 3
  chuyenCaLopSangFT: 263,   // PR-TK: +21 câu CỐ ĐỊNH (không theo số em) cho `ghiBanChup` — bản chụp lộ trình đóng, ghi theo lô một lần mỗi lý do → đo 253 → 263; PR-LUI-b: +1 câu mỗi em có Case đóng (chụp PA để Hoàn tác Kết thúc học mở lại đúng) → đo 225 → 232; PR-LT2b (4, 5): đọc Final Test cả lớp + Case/PA bổ trợ theo lô sau chuyển (đo 214; gốc 200, +7 %) → 224; PR-HVL (10): bộ demo H2 thêm 2 em vào MB FOU 12 (một em có 2 Case đóng theo S17, một em có bài Final Test 4 điểm) → đo 191; trần theo dữ liệu, không phải chậm đi của đường
  /** POST /ke-hoach-test/hang-loat `xemTruoc` — cả lớp MB FT 101 (63 em trong bộ đo), MT3, 4 kỹ năng tuần tới (PR-XLMT, rà #126). Đo 78 câu. */
  xemTruocXepLichMt: 114,   // PR-LT2b (10): bộ demo D13 thêm 2 em vào MB FT 101 (+3 câu/em) → đo 111; PR-HVL (10): bộ demo H1 thêm 1 em vào MB FT 101 (+3 câu/em) → đo 105
  /** GET /my-work?nguoi=tat-ca (QL) khi 30 PA "đến lúc thi" chưa có ngày thi (PR-S3F, rà cuối đợt 3). Trước 63 → 147 câu; ngày thi + tuần MT kế tiếp nay lấy trong câu chính. Đo 70 câu (68 khi không có PA) → trần max(sau+10, ⌈sau×1.3⌉) = 91. */
  congViec30PaChuaNgayThi: 94,   // PR-Pb2-b: bộ demo D18 (+12 em, Case Progress Test FOU 14) sau ×3: đo 90 câu không PA → 93 câu với 30 PA (vẫn chỉ +3, không tăng theo PA)
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
  /** PR-SL: Sửa cả lớp — 30 em MB FT 101 đổi họ tên. Xem trước đọc theo lô (không tăng theo số em); lưu gọi `updateStudent` từng em trong một giao dịch. */
  xemTruocSuaCaLop30: 97,   // đo 74 câu (quyền theo em đọc DB) → max(74+10, ⌈74×1,3⌉) = 97
  /** OV-15b: POST /attempts/scores/lo — Dán từ Excel, MỘT dòng 5 ô (L R W1 W2 S, nhận xét) = một request của web (`LO_DAN` = 1); mỗi ô một `saveScore`. */
  danExcelMotDong: 314,   // đo 241 câu (×3, QL, 5 ô có nhận xét; ~48 câu / ô = `saveScore` như PUT một ô) → max(241 + 10, ⌈241 × 1,3⌉)
  luuSuaCaLopMotLo: 119,   // một lô 8 em đổi họ tên: đo 91 câu → ⌈91×1,3⌉ = 119 (30 em một lần cũ: 289 câu, 7–14 s trên Turso). ponytail: lô cố định 8 em theo số em, không theo số câu — em đổi nhiều ô (tuần bắt đầu dời MT, Target) nặng hơn ~3 lần; lưới chặn cuối: dừng trước 10 s mỗi dòng (503, lô đó cuộn lại); chia lô theo ước lượng câu nếu hay gặp 503
};

/**
 * PR-S6F-b (D14): TẢI TRANG ĐẦU — các GET trang Tổng quan gọi khi mở (ghi từ log mạng trình duyệt 01/10, màn đầu 1440, ngày demo 14/09; StrictMode
 * ở dev gọi đôi `/demo/session` — không tính). MỖI đường một lần (`useApi` gộp GET đang bay): trước PR GV gọi `/my-work` ×2 + `/my-work/dem`
 * (= ba lần `myWork`), QL gọi `/tong-quan/quan-ly` ×2. Trần = TỔNG câu SQL của cả lượt tải.
 */
/* ponytail: danh sách viết tay, phép quét (prDonA 9e) bắt route mới; chuyển sang hằng dùng chung với web khi Tổng quan ổn định. */
export const TAI_TRANG: Record<string, { vai: Vai; urls: string[]; tran: number }> = {
  'GV trang Tổng quan': {
    vai: 'GVCN', tran: 205,   // đo 157 (trước PR ≈ 157 + 2 × 66 = 289)
    urls: ['/demo/session', '/my-work', '/notifications', '/ref/classes', '/tong-quan/lop-toi-day?ct=ft', '/yeu-cau/dem'],
  },
  /* OV-10c: Tổng quan TVV ("Học viên của tôi"), CX ("Số liệu"), Admin ("Mock Test") — đo bằng chính vai đó. */
  'TVV trang Tổng quan': {
    vai: 'TVV', tran: 120,
    urls: ['/demo/session', '/notifications', '/ref/classes', '/tong-quan/hoc-vien'],
  },
  'QL trang Tổng quan': {
    vai: 'QL', tran: 450,   // PR-Dọn (9e): đủ 15 GET lúc mở trang → đo 346 câu (trước chỉ 6 GET, đo 126) — max(346 + 10, ⌈346 × 1,3⌉)
    /* PR-Dọn (9e): đủ MỌI GET lúc mở trang (phép quét `prDonA.tests.ts` 9e bắt route mới). OV-15d (Tổng quan QL A): bỏ sáu ô số + Điểm đáng chú ý;
       thêm bảng GV (Trễ chấm). Thẻ "Chờ duyệt" (`/yeu-cau?hop=cho-duyet`) chỉ tải khi có thẻ. */
    urls: ['/demo/session', '/notifications', '/ref/branches', '/ref/classes', '/yeu-cau/dem', '/tong-quan/quan-ly',
      '/highlights?ct=ft', '/tong-quan/chi-nhanh?ct=ft', '/giao-vien?ct=ft'],
  },
  'CX trang Tổng quan': {
    vai: 'CX', tran: 450,
    urls: ['/demo/session', '/notifications', '/ref/branches', '/ref/classes', '/tong-quan/hoc-vien', '/tong-quan/diem-chu-y?ct=ft',
      '/metrics/hv-duoi-ky-vong-mon?ct=ft', '/metrics/hv-co-case-mo?ct=ft', '/metrics/case-mo?ct=ft', '/metrics/case-cho-xac-dinh-nguyen-nhan?ct=ft',
      '/metrics/case-xac-dinh-nguyen-nhan-qua-han?ct=ft', '/metrics/pa-can-cap-nhat?ct=ft', '/highlights?ct=ft', '/tong-quan/chi-nhanh?ct=ft'],
  },
  'Admin trang Tổng quan': {
    vai: 'ADMIN', tran: 450,
    urls: ['/demo/session', '/notifications', '/ref/branches', '/ref/classes', '/tong-quan/mock-test', '/highlights'],
  },
};
