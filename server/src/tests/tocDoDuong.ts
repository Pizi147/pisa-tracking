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
  /* DOC-IT-4: ô chọn lớp (IntakePanel, LuoiTaoLop, bộ lọc Phân tích…) — trước đọc mọi lớp cả hệ thống rồi lọc trong mã. */
  { trang: 'Chung', vai: MOI_VAI, url: '/ref/classes' },
  { trang: 'Chung', vai: ['QL', 'QT'], url: '/ref/classes?branchId={cn}' },

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
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/tong-quan/chi-nhanh' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong' },
  /* OV-15h1: Tổng quan QL phần theo khung MỘT GET (Lớp cần chú ý + Tuần này + Trễ chấm) · Chờ bạn duyệt theo chi nhánh. */
  { trang: 'Tổng quan QL', vai: ['QL', 'QT', 'GVCN'], url: '/tong-quan/ql?ct=ft', maChuDich: { GVCN: 403 } },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/tong-quan/ql?ct=thuong' },
  /* UI-TONG-QUAN: Tổng quan V5 MỘT GET (QL chế độ lớp · QT chế độ chi nhánh · CX) + TVV (Báo PH đúng hạn, Thi tháng này) và panel Báo PH. */
  { trang: 'Tổng quan V5', vai: ['QL', 'QT'], url: '/tong-quan/v5?ct=ft' },
  { trang: 'Tổng quan V5', vai: ['QL', 'QT'], url: '/tong-quan/v5?ct=thuong' },
  { trang: 'Tổng quan V5', vai: ['QT'], url: '/tong-quan/v5?ct=ft&branchId={cn}' },
  { trang: 'Tổng quan V5', vai: ['CX'], url: '/tong-quan/v5?ct=ft' },
  { trang: 'Tổng quan V5', vai: ['TVV'], url: '/tong-quan/tvv' },
  { trang: 'Tổng quan V5', vai: ['TVV'], url: '/tong-quan/tvv/o?o=bao-ph' },
  { trang: 'Công việc', vai: ['QL', 'QT'], url: '/yeu-cau/dem?branchId={cn}' },
  /* PR-S6F-b (UXF-a P1): Báo cáo đơn vị — tín hiệu đọc sổ chỉ số MỘT lần mỗi chỉ số (không theo chi nhánh). */
  { trang: 'Báo cáo đơn vị', vai: ['QL', 'QT'], url: '/signals' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/case-mo' },
  /* PR-UXF-a Task 5: danh sách bấm ra "bài chưa nhập điểm quá hạn" — mỗi dòng một bài (ô điểm). */
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/bai-qua-han-nhap-diem?rows=1' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/hv-sos-hien-tai' },
  /* PANEL-MC: mở panel (rows=1) — dòng HV kèm điểm đúng lượt (0 câu thêm: lượt đi cùng tập) · Lịch sử một thẻ Chờ duyệt. */
  { trang: 'Tổng quan QL · panel', vai: ['QL', 'QT'], url: '/metrics/hv-sos-hien-tai?rows=1' },
  { trang: 'Tổng quan QL · panel', vai: ['QL', 'QT'], url: '/metrics/hv-duoi-ky-vong-mon?rows=1&skill=reading' },
  { trang: 'Công việc · panel duyệt', vai: ['QL', 'QT', 'GVCN'], url: '/lich-su?loai=yeu-cau&id={ycPa}', maChuDich: { GVCN: 403 } },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/hv-duoi-ky-vong-mon' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/hv-co-case-mo' },
  { trang: 'Tổng quan QL', vai: ['QL', 'QT'], url: '/metrics/do-phu-danh-gia' },

  // ---------------------------------------------------------------- Phân tích Ý thức cho QL (PR-YT2, P13/P14)
  { trang: 'Phân tích Ý thức QL', vai: ['QL', 'QT'], url: '/metrics/vi-pham-theo-nhom' },
  { trang: 'Phân tích Ý thức QL', vai: ['QL', 'QT'], url: '/metrics/vi-pham-tong?classId={lopFT}' },

  // ---------------------------------------------------------------- Phân tích v2 cho QL (PR-UX4) — GV không có meeting.view nên 403
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
  /* RA-DOC-0611: Admin — `/my-work` gọi ở mỗi lần mở app (badge `App.tsx`), kèm việc "Xuất báo cáo PH" (`viecXuatBaoCaoPh`, BAO-CAO-PH b). */
  { trang: 'Công việc Admin', vai: ['ADMIN'], url: '/my-work' },
  /* SV-YT-TVV + SV-TVV-VIEC: việc của TVV (Báo PH, Chốt ngày thi, Bước tiếp, Bổ sung hồ sơ, KQ thi thật) ở Tổng quan TVV (TVV không có khu Công việc). */
  {
    trang: 'Công việc', vai: ['QL', 'QT', 'GVCN'], url: '/my-work?nguoi=tat-ca',
    maChuDich: { GVCN: 403 },
  },
  { trang: 'Công việc', vai: ['QL'], url: '/my-work?nguoi={gv}' },
  /* DOC-THUA (05/11): Công việc lọc một chi nhánh — việc "Báo PH kết quả Test" lọc chi nhánh trong SQL (trước đọc mọi chi nhánh rồi lọc ở JS). */
  { trang: 'Công việc', vai: ['QL', 'QT'], url: '/my-work?nguoi=tat-ca&branchId={cn}' },
  /* OV-14c: hàng đợi Chấm Speaking (panel của việc) — GV Speaking: mọi lớp FT chi nhánh; GV khác: rỗng. */
  { trang: 'Công việc', vai: ['GVCN', 'GVBM', 'QL'], url: '/my-work/cham-speaking' },
  /* PR-DUYET: hộp Chờ duyệt (GV 403), Yêu cầu của tôi, số đếm cho badge/dải Tổng quan. */
  { trang: 'Công việc', vai: ['QL', 'QT', 'GVCN'], url: '/yeu-cau?hop=cho-duyet', maChuDich: { GVCN: 403 } },
  { trang: 'Công việc', vai: ['QL', 'QT'], url: '/yeu-cau?hop=cho-duyet&xem=da-xu-ly' },
  { trang: 'Công việc · panel duyệt', vai: ['QL', 'QT'], url: '/yeu-cau?hop=cho-duyet&boiCanh=1' },   // PANEL-MC: + chip SOS, điểm, Lịch sử · n
  { trang: 'Công việc', vai: ['GVCN', 'GVBM'], url: '/yeu-cau?hop=cua-toi' },
  { trang: 'Công việc', vai: MOI_VAI, url: '/yeu-cau/dem' },
  /* PR-VAI-a (Q12, Q16): Lớp tôi dạy thay Học viên cần hỗ trợ; badge việc quá hạn của GV. */
  { trang: 'Tổng quan GV', vai: ['GVCN', 'GVBM', 'GVCN_THUONG'], url: '/tong-quan/lop-toi-day?ct=ft' },
  { trang: 'Tổng quan GV', vai: ['GVCN_THUONG'], url: '/tong-quan/lop-toi-day?ct=thuong' },
  { trang: 'Tổng quan GV', vai: ['GVCN'], url: '/tong-quan/lop-toi-day/o?ct=ft&classId={lopFT}&cot=duoiKyVong' },
  /* PR-S6F-b (D10): cột Bài chờ chấm / quá hạn bấm ra danh sách bài (cùng `noDiemCuaGv`). */
  { trang: 'Tổng quan GV', vai: ['GVCN'], url: '/tong-quan/lop-toi-day/o?ct=ft&classId={lopFT}&cot=bai-qua-han' },
  { trang: 'Tổng quan GV', vai: ['GVCN', 'GVBM', 'GVCN_THUONG'], url: '/highlights' },
  /* SV-TQ-GV: Tổng quan GV hai khối (cả hai khung + hồ sơ GV theo kỳ + Thi tháng này) và ô Thi tháng này của lớp chủ nhiệm. */
  { trang: 'Tổng quan GV', vai: ['GVCN', 'GVBM', 'GVCN_THUONG'], url: '/tong-quan/lop-toi-day/hai-khoi' },
  { trang: 'Tổng quan GV', vai: ['GVCN'], url: '/tong-quan/lop-toi-day/o?ct=ft&classId={lopFT}&cot=thi-thang-nay' },

  /* OV6-DOC-CHON: ô tìm thanh trên (Ctrl K) — trước `/students?q` không LIMIT (QL "ng": 544 câu / 1 063 dòng, ×3 dữ liệu 1 622 câu), web chỉ hiện 6. */
  { trang: 'Chung · tìm', vai: MOI_VAI, url: '/students?q=ng&gioiHan=6&gon=1' },
  /* OV6-DOC-CHON: ô Lớp của Giao việc — trước `/classes` đầy đủ (QL 15 câu / 470 dòng) chỉ để lấy mã + sĩ số. */
  { trang: 'Công việc · Giao việc', vai: ['QL', 'QT'], url: '/classes?gon=1' },

  // ---------------------------------------------------------------- Học viên & Lớp
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/classes' },
  { trang: 'Học viên & Lớp', vai: ['QL', 'QT'], url: '/classes?branchId={cn}' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop' },
  { trang: 'Học viên & Lớp', vai: ['QL', 'QT'], url: '/hoc-vien-lop?phamVi=chi-nhanh&branchId={cn}' },
  { trang: 'Học viên & Lớp · Bộ lọc thêm', vai: ['QL'], url: '/hoc-vien-lop?phamVi=chi-nhanh&branchId={cn}&them=1' },   // OV-15h2: nhãn Case / PA · kết quả · tuần
  /* OV-10b: Học viên & Lớp của TVV / CX (mỗi em một dòng, chip = chipHocVien) — TVV "HV của tôi" / Cả chi nhánh, CX mọi / một chi nhánh. */
  { trang: 'Học viên & Lớp TVV / CX', vai: ['TVV', 'CX'], url: '/hoc-vien-lop/theo-vai' },
  { trang: 'Học viên & Lớp TVV', vai: ['TVV'], url: '/hoc-vien-lop/theo-vai?phamVi=chi-nhanh' },
  { trang: 'Học viên & Lớp CX', vai: ['CX'], url: '/hoc-vien-lop/theo-vai?branchId={cn}' },
  { trang: 'Học viên & Lớp Admin', vai: ['ADMIN'], url: '/hoc-vien-lop' },
  /* OV-12f: góc Đang SOS (tuần mặc định · Toàn bộ 8 tuần) + panel một em; Admin không có góc này (403). */
  { trang: 'Học viên & Lớp · Đang SOS', vai: [...MOI_VAI, 'TVV', 'CX'], url: '/hoc-vien-lop?goc=sos' },
  { trang: 'Học viên & Lớp · Đang SOS', vai: ['QL', 'QT', 'CX'], url: '/hoc-vien-lop?goc=sos&tuan=tat-ca' },
  { trang: 'Học viên & Lớp · Đang SOS', vai: ['ADMIN'], url: '/hoc-vien-lop?goc=sos', maChuDich: { ADMIN: 403 } },
  /* TURSO-1211: trang Học viên & Lớp mở = danh sách + Đang SOS CÙNG request (`kem=sos`); Admin: `sos: null`. */
  { trang: 'Học viên & Lớp', vai: [...MOI_VAI, 'TVV', 'CX', 'ADMIN'], url: '/hoc-vien-lop?kem=sos' },
  { trang: 'Học viên & Lớp · panel một em', vai: MOI_VAI, url: '/hoc-vien-lop/em/{hv}' },
  { trang: 'Hồ sơ HV CX / Admin', vai: ['CX', 'ADMIN'], url: '/students/{hv}' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop/luu-tru' },
  /* OV-15f: góc Lịch thi — em có tháng dự kiến thi chọn + em chưa có dự kiến (lọc tháng ngay trong SQL), kết luận ở cột `learning_cycles.lich_thi_*`. */
  { trang: 'Học viên & Lớp · Lịch thi', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'TVV', 'CX'], url: '/hoc-vien-lop/lich-thi?thang=2026-10,2026-11' },
  /* PC-GV-A: góc Phân công GV — cả chi nhánh MỘT GET (số câu cố định, không theo số lớp); GV / TVV 403. */
  { trang: 'Học viên & Lớp · Phân công GV', vai: ['QL', 'QT', 'CX', 'GVCN', 'GVBM', 'TVV'], url: '/hoc-vien-lop/phan-cong?branchId={cn}', maChuDich: { GVCN: 403, GVBM: 403, TVV: 403 } },
  /* PR-B: phiếu bàn giao khi đổi GV (MB FT 101, đã xác nhận, chưa chụp — đường tự điền sống, nặng nhất) — số câu không theo số em. */
  { trang: 'Bàn giao đổi GV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/ban-giao-gv/{bgGv}' },
  /* BAN-GIAO-NHAN (05/11): một phiếu chuyển lớp đã xác nhận, đọc theo lệnh — panel tại hồ sơ HV (dải Đã chuyển, thẻ chương, chuông của GV lớp mới). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT'], url: '/lenh-chuyen/{lenhBg}/ban-giao' },
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop/ids' },   // PR-TD2-b: Trước/Sau của hồ sơ lớp
  { trang: 'Học viên & Lớp', vai: MOI_VAI, url: '/hoc-vien-lop/luu-tru?branchId={cn}' },

  // ---------------------------------------------------------------- Hồ sơ lớp (FT)
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/overview' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/roster' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/roster?chiId=1' },   // PR-TD2-b: Trước/Sau của hồ sơ HV
  /* SV-LOP · UI-HO-SO-LOP: việc theo em + thanh Việc cần làm (GV: /my-work của mình + từng GV dạy lớp — trần đo ở TRAN). */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/viec-theo-em?chi=toi' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/issue-board?category=listening' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/phan-tich-lop' },
  /* BAO-CAO-PH: tab Báo cáo PH (một lớp × một đợt) + panel một phần (em + bản ghi đợt này / đợt trước + điểm gốc một câu). */
  { trang: 'Hồ sơ lớp FT', vai: [...MOI_VAI, 'ADMIN', 'TVV'], url: '/classes/{lopFT}/bao-cao-ph', maChuDich: { TVV: 403 } },   // TVV mẫu ở chi nhánh khác lớp
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/bao-cao-ph/phan?phan=listening' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/bao-cao-ph' },
  /* BAO-CAO-PH b: Excel một lớp (GV không xuất → 403). */
  { trang: 'Hồ sơ lớp FT', vai: ['QL', 'QT', 'ADMIN', 'GVCN'], url: '/classes/{lopFT}/bao-cao-ph/xuat', maChuDich: { GVCN: 403 } },
  { trang: 'Hồ sơ lớp FT', vai: ['QL', 'QT', 'ADMIN', 'GVCN'], url: '/classes/{lopFT}/bao-cao-ph/xuat?kieu=pdf', maChuDich: { GVCN: 403 } },   // BCPH-PDF
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/bao-cao-ph/phan?phan=writing' },
  /* PR-HVL (7): panel Tuần khai giảng — thêm `coGiuaKhoa` và `tomTatMt` (một câu). */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/progress' },
  /* PR-HVL (6): danh sách sau một số ở bảng vấn đề / hiệu quả PA — tính lại bằng chính `issueBoard`. */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/issue-board/o?category=listening&cot=case' },
  /* V8-HSL-2: ô dòng Overall bảng FT — chạy khi MỞ, tính bằng chính `phanTichNhieuLop`. */
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/classes/{lopFT}/issue-board/o?category=overall&cot=overall&kind=mt1' },
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
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/danh-gia-dau-ra' },   // UI-HO-SO-LOP (C17)
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/phan-tich-lop' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/can-ho-tro' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/gop-y' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/y-thuc' },
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/cham' },
  /* PR-LT, Task 5: GVCN_THUONG đọc được kế hoạch Chuyển tiếp lớp (canEdit=false ở đó), không sửa được (chỉ QL/QT gọi POST). */
  { trang: 'Hồ sơ lớp thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/classes/{lopThuong}/transition' },
  /* PR-K26: bảng Ghi lộ trình tiếp theo cả lớp (⋮ hồ sơ lớp) — đọc theo lô, không tăng theo số em. */
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
  /* SV-BAI-LOP: Bài trên lớp của em + lịch sử sửa. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/bai-tren-lop' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/lich-su?loai=bai-lop&id={hv}' },
  /* PR-Dọn-a (Q2): ô chọn người theo một em — kiểm STUDENT_VIEW trước, rồi lọc theo phạm vi người xem. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/ref/nguoi?nhom=giao_vien&studentId={hv}' },
  /* TU-a: nhóm "Tutor" của ô Người dạy PA Tutor (Thêm / Sửa / Xác nhận PA) — một câu đọc tutor + kết luận mới nhất. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/tutors/chon?studentId={hv}' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/tutors/chon?paId={paTutor}', maChuDich: { GVBM: 403 } },   // GVBM không dạy kỹ năng của PA: không ghi được
  /* TU-b: trang Tutor — bảng (QL: buổi lớp chi nhánh mình), panel một tutor, số menu, tên gõ tay (Quản trị = như Head tutor). GV không có trang. */
  { trang: 'Tutor', vai: ['QL', 'QT', 'GVCN'], url: '/tutors', maChuDich: { GVCN: 403 } },
  { trang: 'Tutor', vai: ['QL', 'QT'], url: '/tutors/1' },
  { trang: 'Tutor', vai: ['QL', 'QT'], url: '/tutors/dem', maChuDich: { QL: 403 } },
  { trang: 'Tutor', vai: ['QT'], url: '/tutors/go-tay' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/cases/{case}' },
  /* PR-VAI-b (V1/K3-47): dải "n yêu cầu chờ bạn duyệt" của hồ sơ HV — chỉ Quản lý / Quản trị gọi (GVCN 403). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN'], url: '/yeu-cau?studentId={hv}', maChuDich: { GVCN: 403 } },
  /* PR-Qb (sửa sau rà #75, vấn đề 5) — tab Hành trình, cả giai đoạn mặc định lẫn ?giai-doan=thuong. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/hanh-trinh' },
  /* PR-TK (TK-7): khối Các lộ trình + ngăn Tổng kết lộ trình đọc từ bản chụp; KHÔNG nạp trong `GET /students/{hv}` (trần 90 câu giữ nguyên). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/lo-trinh' },
  /* OV-13j: Lịch sử sửa — GVBM không xem (403). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/lich-su-sua', maChuDich: { GVBM: 403 } },
  /* OV-15g: Lịch sử thay đổi — một đường cho mọi đối tượng (hồ sơ HV · lớp · góp ý tuần · nhập HV). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/lich-su?loai=hv&id={hv}', maChuDich: { GVBM: 403 } },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/lich-su?loai=lop&id={lopFT}' },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/lich-su?loai=gop-y&id={lopFT}' },
  { trang: 'Hồ sơ lớp FT', vai: ['QL', 'QT'], url: '/lich-su?loai=nhap-hv&id={lopFT}' },
  /* OV-15i1: ba loại còn lại — thi thật / Bước tiếp (cùng cổng hv: GVBM 403), phân công lớp, ô điểm một lượt. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/lich-su?loai=thi-that&id={loTrinhHv}', maChuDich: { GVBM: 403 } },
  { trang: 'Hồ sơ lớp FT', vai: MOI_VAI, url: '/lich-su?loai=phan-cong&id={lopFT}' },
  { trang: 'Hồ sơ MT', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/lich-su?loai=o&id={luotHv}' },
  /* HSL-MAY-CHU: trang một lượt lớp thường (một dòng của bảng điểm lớp + lịch sử). */
  { trang: 'Hồ sơ lượt thường', vai: ['QL', 'QT', 'GVCN_THUONG'], url: '/regular/attempts/{luotThuong}' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/lo-trinh/{loTrinhDong}/tong-ket' },
  /* OV-13m: panel Bước tiếp sau thi (đọc trạng thái + quét hẹn bắt đầu). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/cycles/{loTrinhDong}/buoc-tiep' },
  /* THI-LAI-1-KN: panel Kết quả thi thật / Sau thi đọc lộ trình + KQ thi thật lần trước (+1 câu). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/cycles/{loTrinhDong}' },
  /* TL-GV (v20): hộp Tuần dạy khi bấm điểm thi thật — chỉ đọc khi bấm, một request cả 5 kỹ năng. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/cycles/{loTrinhThi}/tuan-day' },
  { trang: 'Hồ sơ lớp', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG'], url: '/classes/{lopKetThuc}/tong-ket' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/hanh-trinh?giai-doan=thuong' },
  /* PR-YT4: tab Ý thức của HV (thang, thanh việc, dòng thời gian trộn) — cũng là khung phải của tab lớp khi chọn em. */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/y-thuc' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/y-thuc?pham-vi=tat-ca' },
  /* PR-XOA: ⋮ › Xoá học viên — xem trước "những gì sẽ mất", chỉ Quản trị hệ thống. */
  { trang: 'Hồ sơ HV', vai: ['QT', 'QL', 'GVCN'], url: '/students/{hv}/xoa', maChuDich: { GVCN: 403 } },   // OV-12a: QL của em xem / xoá được
  /* PR-LUI-b (5f): panel Học lại — lớp cũ + lộ trình + lớp đang hoạt động kèm sĩ số; chỉ Quản lý / Quản trị của em (GV 403). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/hoc-lai/lop-dich', maChuDich: { GVCN: 403, GVBM: 403 } },
  /* P7 SV-LO-TRINH: "Khi lưu, web sẽ" hộp Tạm dừng/ Kết thúc học · panel Lộ trình mới · Quay lại học (em Tạm dừng ở Lưu trữ). */
  { trang: 'Hồ sơ HV', vai: ['QL', 'QT', 'GVCN', 'GVBM'], url: '/students/{hv}/trang-thai/xem-truoc?ketThuc=1' },
  /* Panel Lộ trình mới + Quay lại học cần em đã thi / tạm dừng — bộ demo đo không có; trần đo ở phép kiểm SV-9b (`prSvLoTrinh.tests.ts`). */
  /* PR-LT: {hv} là em lớp FT nên `lop.laLopThuong=false`, nhưng đường vẫn 200 với mọi vai xem được hồ sơ. */
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
    trang: 'Kế hoạch Test', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG', 'TVV'], url: '/ke-hoach-test/ft/{lopFT}',
    /* QUYEN-LICH-MT (chủ SP 28/10): GV xem Kế hoạch Test lớp mình dạy / chấm S chéo → 200 (chỉ xem); TVV không dạy lớp nào → vẫn 403. */
    maChuDich: { TVV: 403 },
  },
  {
    trang: 'Kế hoạch Test', vai: ['QL', 'QT', 'GVCN', 'GVBM', 'GVCN_THUONG', 'TVV'], url: '/ke-hoach-test/thuong/{lopThuong}',
    maChuDich: { TVV: 403 },   // QUYEN-LICH-MT: GV dạy lớp → 200 chỉ xem; TVV → 403
  },
  /* OV-15c (C18): ô tìm lớp / học viên / email — một câu lớp + một câu học viên. */
  { trang: 'Kế hoạch Test', vai: ['QL', 'QT', 'GVCN'], url: '/ke-hoach-test/tim?q=minh&branchId={cn}' },   // QUYEN-LICH-MT: GV tìm trong lớp mình dạy
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
  /* UI-HO-SO-GV: `/ket-qua` (mốc gần nhất của lớp) đã xoá — GV nhiều lớp nhất bộ demo (Phạm Thu Trang, id 9 — 18 lớp) đo ở `/chi-so` (bảng Học thuật theo lớp). */
  { trang: 'Hồ sơ GV', vai: ['QL', 'QT'], url: '/giao-vien/9/chi-so' },
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
  /* SỔ NGHĨA VỤ (PR-2): tổng mọi chi nhánh (QT, không cn) · panel một người mọi chi nhánh · panel "Chưa phân công" (gv = 0). */
  { trang: 'Phân tích GV', vai: ['QT'], url: '/phan-tich/giao-vien?ct=ft' },
  { trang: 'Phân tích GV', vai: ['QT'], url: '/phan-tich/giao-vien/o?ct=ft&gv={gv}&cot=viec-dung-han' },
  { trang: 'Phân tích GV', vai: ['QL'], url: '/phan-tich/giao-vien/o?cn={cn}&ct=ft&gv=0&cot=cham-diem' },
  /* PHÂN TÍCH V2 · Giáo viên (đặc tả 6): `v2=1` chỉ phần báo cáo cần; tổng = bảng một chi nhánh × từng chi nhánh (Đạt kỳ vọng, Chưa phân công) · panel Chưa phân công mọi chi nhánh. */
  { trang: 'Phân tích GV', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien?cn={cn}&ct=ft&v2=1' },
  { trang: 'Phân tích GV', vai: ['QL'], url: '/phan-tich/giao-vien?cn={cn}&ct=thuong&v2=1' },
  { trang: 'Phân tích GV', vai: ['QT'], url: '/phan-tich/giao-vien?ct=ft&v2=1' },
  { trang: 'Phân tích GV', vai: ['QT'], url: '/phan-tich/giao-vien/o?ct=ft&gv=0&cot=cham-diem' },
  /* PT-V2 · PR-5: sheet Danh sách của Excel Giáo viên (chỉ gọi lúc bấm Xuất) — một chi nhánh · tất cả chi nhánh; GV bộ môn bị chặn. */
  { trang: 'Phân tích GV', vai: ['QL', 'QT', 'GVBM'], url: '/phan-tich/giao-vien/danh-sach?cn={cn}&ct=ft', maChuDich: { GVBM: 403 } },
  { trang: 'Phân tích GV', vai: ['QT'], url: '/phan-tich/giao-vien/danh-sach?ct=ft' },

  // ---------------------------------------------------------------- OV-15e — Báo cáo + Kết quả thi (QL, QT; GVCN → 403) + panel chỉ số GV
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/bao-cao?ct=ft', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/bao-cao?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20' },
  /* QUET-THEO-KY Q3: Báo cáo HV MỘT GET — Tổng quan + `baoCao` (web chỉ gọi đường này; `/phan-tich/bao-cao` giữ cho nơi khác). */
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/tong-quan/v5?ct=ft&kemBaoCao=1', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/tong-quan/v5?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20&kemBaoCao=1' },
  /* Phân tích V2 · Chi nhánh (XM-2): MỘT GET chỉ phần cần — FT một chi nhánh 31 câu / 1 376 dòng trên seed (trước 74 / 3 254), lớp thường 16 / 749; QT 55 câu (Tiến bộ theo từng chi nhánh). */
  { trang: 'Phân tích · Chi nhánh', vai: ['QL', 'QT', 'GVCN'], url: '/tong-quan/v5?ct=ft&baoCao=chi-nhanh&kieu=tuan&tu=2026-08-31&den=2026-09-27', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích · Chi nhánh', vai: ['QL', 'QT'], url: '/tong-quan/v5?ct=thuong&baoCao=chi-nhanh&kieu=tuan&tu=2026-08-31&den=2026-09-27' },
  { trang: 'Phân tích · Chi nhánh', vai: ['QT'], url: '/tong-quan/v5?ct=ft&baoCao=chi-nhanh&branchId={cn}&kieu=tuan&tu=2026-08-31&den=2026-09-27' },
  { trang: 'Phân tích · panel Chi nhánh', vai: ['QL', 'QT'], url: '/tong-quan/chi-nhanh-v2/o?ct=ft&o=vao&kieu=tuan&tu=2026-08-31&den=2026-09-27' },
  { trang: 'Phân tích · panel Chi nhánh', vai: ['QL', 'QT'], url: '/tong-quan/chi-nhanh-v2/o?ct=ft&o=chua-co-kq' },
  /* PTA rà #1408: Cuối khoá lớp thường theo EM — panel một dải (mỗi em một bài, % tổng). */
  { trang: 'Phân tích · panel Chi nhánh', vai: ['QL', 'QT'], url: '/tong-quan/chi-nhanh-v2/o?ct=thuong&o=ck-dat&khoa=tong&kieu=tuan&tu=2026-08-31&den=2026-09-27' },
  { trang: 'Phân tích · panel Chi nhánh', vai: ['QL', 'QT'], url: '/phan-tich/bao-cao/o?ct=ft&o=tien-bo:tat-ca&kieu=tuan&tu=2026-08-31&den=2026-09-27' },
  { trang: 'Phân tích · panel Chi nhánh', vai: ['QL', 'QT'], url: '/phan-tich/thi-that/o?o=tong:co-target&kieu=tuan&tu=2026-07-06&den=2026-09-20' },
  { trang: 'Phân tích · panel Chi nhánh', vai: ['QL', 'QT'], url: '/phan-tich/tong-hop/o?ct=thuong&theo=lop&khoa=tong&cot=dat-test&kieu=tuan&tu=2026-08-31&den=2026-09-27' },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/bao-cao/o?ct=ft&o=bai-qua-han' },
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/ket-qua-thi?loai=mock&xep=sos&kieu=tuan&tu=2026-07-06&den=2026-09-20', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/ket-qua-thi?loai=thi-that&kieu=tuan&tu=2026-07-06&den=2026-09-20' },
  /* PR-4 THI-THAT: tab Thi thật — danh sách + Tổng · Từng kỹ năng · Theo GV (QL / QT / CX; TVV không chạy 2 câu Theo GV); panel ô chỉ khi bấm. */
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN', 'TVV', 'CX'], url: '/phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích · panel thẻ', vai: ['QL', 'QT'], url: '/phan-tich/thi-that/o?o=kn:w:fail&kieu=tuan&tu=2026-07-06&den=2026-09-20' },
  { trang: 'Phân tích · panel thẻ', vai: ['QL', 'QT', 'TVV'], url: '/phan-tich/thi-that/o?o=gv:{gv}:w1:hv&kieu=tuan&tu=2026-07-06&den=2026-09-20', maChuDich: { TVV: 403 } },
  { trang: 'Phân tích GV', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien/o?cn={cn}&ct=ft&gv={gv}&cot=ghi-pa' },
  /* DEM-QUA-HAN b: ô Chấm Test đúng hạn mở panel số chung (dòng việc) thay panel Chấm điểm riêng. */
  { trang: 'Phân tích GV', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien/o?cn={cn}&ct=ft&gv={gv}&cot=cham-diem' },
  /* PT-PANEL (PR-1, 05/11): panel BẢNG có điểm — chỉ khi MỞ; dòng lượt + điểm theo lô (`dongLuotDiemCua`). */
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=kn:listening' },
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot' },
  /* PT-LOP-THUONG (PR-2): panel bài lớp thường + Đạt Test GV lớp thường. */
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/tong-hop/o?ct=thuong&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot' },
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien/o?cn={cn}&ct=thuong&gv={gv}&tu=2026-03-02&den=2026-09-14&cot=ket-qua' },
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/bao-cao/o?ct=ft&branchId={cn}&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=tien-bo:writing1:tang' },
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-mt' },
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien/o?cn={cn}&ct=ft&gv={gv}&tu=2026-03-02&den=2026-09-14&cot=tien-bo' },
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien/o?cn={cn}&ct=ft&gv={gv}&tu=2026-03-02&den=2026-09-14&cot=dat-mt' },
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien/o?cn={cn}&ct=ft&gv={gv}&cot=hv-chu-y' },
  { trang: 'Phân tích · panel bảng', vai: MOI_VAI, url: '/giao-vien/{gv}/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14', maChuDich: { GVBM: 403 } },
  /* V8-PT-2: panel thẻ chỉ số — chỉ gọi khi MỞ (0 câu khi vẽ); đường vẽ `/phan-tich/*` giữ trần cũ. */
  { trang: 'Phân tích · panel thẻ', vai: ['QL', 'QT'], url: '/phan-tich/ket-qua-thi/o?loai=mock&o=dat&kieu=tuan&tu=2026-07-06&den=2026-09-20' },
  { trang: 'Phân tích · panel thẻ', vai: ['QL', 'QT'], url: '/phan-tich/ket-qua-thi/o?loai=thi-that&o=luot&kieu=tuan&tu=2026-07-06&den=2026-09-20' },
  { trang: 'Phân tích · panel thẻ', vai: ['QL', 'QT'], url: '/phan-tich/hieu-qua-pa/o?dong=tong&cot=pa' },
  { trang: 'Phân tích · panel thẻ', vai: ['QL', 'QT'], url: '/phan-tich/y-thuc/o?dong=tong&cot=lop' },
  /* PT-VP-PA (PR-3): panel vi phạm (dòng đủ cột) + Việc đúng hạn của GV (nghĩa vụ ghi kết quả PA). */
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/y-thuc/o?dong=tong&cot=vi-pham' },
  { trang: 'Phân tích · panel bảng', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien/o?cn={cn}&ct=ft&gv={gv}&cot=viec-dung-han' },
  // ---------------------------------------------------------------- SV-SO2 — hồ sơ GV theo kỳ (GV tự xem / QL / QT), Đạt MT, Thi tháng này; khoảng ~29 tuần (P9 không trần)
  { trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}/chi-so', maChuDich: { GVBM: 403 } },
  { trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}/chi-so?tu=2026-03-02&den=2026-09-14', maChuDich: { GVBM: 403 } },
  { trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}/chi-so/o?cot=cham-diem', maChuDich: { GVBM: 403 } },
  { trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}/chi-so/o?cot=ket-qua&tu=2026-03-02&den=2026-09-14', maChuDich: { GVBM: 403 } },
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/bao-cao/o?ct=ft&o=dat-mt', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/bao-cao/o?ct=ft&o=thi-thang-nay', maChuDich: { GVCN: 403 } },
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=kq-mt:mt2:dat', maChuDich: { GVCN: 403 } },   // SV-SO3
  { trang: 'Tổng quan QT / CX · panel Đạt Target thi thật', vai: ['QT', 'CX', 'QL'], url: '/phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-target-thi' },   // O-TQ-BAM
  { trang: 'Phân tích QL', vai: ['QL', 'QT', 'GVCN'], url: '/phan-tich/bao-cao/ket-qua-mt?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20', maChuDich: { GVCN: 403 } },   // SV-SO3
  { trang: 'Phân tích QL', vai: ['QL', 'QT'], url: '/phan-tich/bao-cao?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20' },
  { trang: 'Phân tích GV', vai: ['QL', 'QT'], url: '/phan-tich/giao-vien?cn={cn}&ct=ft&tu=2026-03-02&den=2026-09-14' },
  /* SUA-NHO-QUYEN: Quản trị › Tài khoản — bốn câu mỗi tài khoản gom thành một câu mỗi bảng. */
  { trang: 'Quản trị', vai: ['QT'], url: '/admin/accounts' },
  /* GIAM-DOC-0611: đường GET web đang gọi mà chưa có ở đây (từ #1025 + panel cũ chưa đo). */
  { trang: 'Chung', vai: MOI_VAI, url: '/ref/periods' },
  { trang: 'Hồ sơ lớp FT · Ý thức', vai: MOI_VAI, url: '/classes/{lopFT}/phoi-hop-sos' },
  { trang: 'Hồ sơ lớp FT · Ý thức', vai: ['QL', 'GVCN'], url: '/classes/{lopFT}/y-thuc/lo' },
  { trang: 'Hồ sơ HV', vai: MOI_VAI, url: '/students/{hv}/phoi-hop-sos' },
  { trang: 'Hồ sơ HV', vai: MOI_VAI, url: '/students/{hv}/s-expert' },
  { trang: 'Hồ sơ HV', vai: ['QL', 'GVCN'], url: '/cycles/{loTrinhHv}/suggested-mocks' },
  { trang: 'Học viên & Lớp · Lịch thi', vai: ['QL', 'GVCN'], url: '/hoc-vien-lop/lich-thi/{loTrinhHv}/lich-su' },
  { trang: 'Hồ sơ lớp FT · Báo cáo PH', vai: ['QL', 'QT'], url: '/bao-cao-ph/lop?branchId={cn}' },
  { trang: 'Hồ sơ lớp FT', vai: ['QL', 'QT'], url: '/classes/{lopFT}/teachers' },
  { trang: 'Tổng quan V5 · panel', vai: ['ADMIN'], url: '/tong-quan/gv-tre' },
  { trang: 'Tổng quan V5 · panel', vai: ['QL', 'QT'], url: '/tong-quan/gv-tre?gv={gv}' },
  { trang: 'Lịch Test', vai: ['QL', 'GVCN'], url: '/cham/lich-test/qua-han' },
  { trang: 'Quản trị', vai: ['QT'], url: '/admin/mo-sua-lich-test' },
  /* CAU-HINH-CASE-SOS: tab Case & SOS — bản đang dùng (1 câu) + 30 dòng nhật ký + đếm "đang dùng" (1 câu UNION). QL chỉ xem. */
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/cau-hinh-case-sos' },
  /* QTV2-QUYEN: tab Quyền & nhật ký — nhật ký chung (thay /admin/overview) + đơn vị báo cáo ở tab Chi nhánh. */
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/nhat-ky' },
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/nhat-ky?muc=chi-nhanh' },
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/don-vi' },
  /* QTV2-CAU-HINH: cột Nhật ký của tab cấu hình — 8 dòng, không đọc danh sách người. */
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/nhat-ky?muc=chi-nhanh&gioi-han=8' },
  /* QTV2-HAN: tab Hạn mặc định — bản đang dùng (nhớ đệm) + 30 lần đổi; cột Nhật ký 8 dòng. */
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/cau-hinh/han' },
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/nhat-ky?muc=han&gioi-han=8' },
  /* QTV2-BAND: tab Band & ngưỡng — hai khối (bản đang dùng nhớ đệm + 30 lần đổi) + cột Nhật ký mục Band 8 dòng. */
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/cau-hinh/ky-vong-ft' },
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/cau-hinh/nguong-thuong' },
  { trang: 'Quản trị', vai: ['QT', 'QL'], url: '/admin/nhat-ky?muc=band&gioi-han=8' },
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
  /* OV6-DOC-CHON (14/11): ô tìm thanh trên — trước `/students?q=ng` 360–845 câu (×3 dữ liệu tới 2 517); nay LIMIT 6 + gon đo 15 câu mọi vai · ô Lớp của Giao
     việc — trước `/classes` 15 câu, nay `gon=1` đo 3 → max(đo + 10, ⌈đo × 1,3⌉). */
  'QL /students?q=ng&gioiHan=6&gon=1': 25, 'QT /students?q=ng&gioiHan=6&gon=1': 25, 'GVCN /students?q=ng&gioiHan=6&gon=1': 25,
  'GVBM /students?q=ng&gioiHan=6&gon=1': 25, 'GVCN_THUONG /students?q=ng&gioiHan=6&gon=1': 25, 'QL /classes?gon=1': 13, 'QT /classes?gon=1': 13,
  /* TL-GV (v20): hộp Tuần dạy — lộ trình · ghi danh · lớp FT · phân công (+ lần thi trước khi thi lại) trên nền phiên; đo 9 · 6 · 10 · 10 câu → max(đo + 10, ⌈đo × 1,3⌉). */
  'QL /cycles/{loTrinhThi}/tuan-day': 19, 'QT /cycles/{loTrinhThi}/tuan-day': 16, 'GVCN /cycles/{loTrinhThi}/tuan-day': 20, 'GVBM /cycles/{loTrinhThi}/tuan-day': 20,
  /* CAU-HINH-CASE-SOS (11/11): 3 câu riêng của tab (bản đang dùng · nhật ký · đếm đang dùng) trên nền phiên như /admin/mo-sua-lich-test (12). */
  'QT /admin/cau-hinh-case-sos': 15, 'QL /admin/cau-hinh-case-sos': 15,
  /* SỔ NGHĨA VỤ (PR-2): tổng mọi chi nhánh (đọc sổ, không ghi lại sổ việc) · panel một người mọi chi nhánh · panel Chưa phân công — đo 7 · 8 · 6 câu, trần max(đo + 10, ⌈đo × 1,3⌉). */
  'QT /phan-tich/giao-vien?ct=ft': 17, 'QT /phan-tich/giao-vien/o?ct=ft&gv={gv}&cot=viec-dung-han': 18, 'QL /phan-tich/giao-vien/o?cn={cn}&ct=ft&gv=0&cot=cham-diem': 16,
  /* PT-V2 Giáo viên: một chi nhánh bỏ Tiến bộ / PA / Thi thật / Case (đo QL FT 44 → 18 câu); tổng tính MỘT lần cho mọi chi nhánh (PTA rà #1414: đo 63 → 16 câu). */
  'QL /phan-tich/giao-vien?cn={cn}&ct=ft&v2=1': 30, 'QT /phan-tich/giao-vien?cn={cn}&ct=ft&v2=1': 30, 'QL /phan-tich/giao-vien?cn={cn}&ct=thuong&v2=1': 30, 'QT /phan-tich/giao-vien?ct=ft&v2=1': 26, 'QT /phan-tich/giao-vien/o?ct=ft&gv=0&cot=cham-diem': 20,
  'QL /phan-tich/giao-vien/danh-sach?cn={cn}&ct=ft': 20, 'QT /phan-tich/giao-vien/danh-sach?cn={cn}&ct=ft': 20, 'QT /phan-tich/giao-vien/danh-sach?ct=ft': 20,   // PT-V2 PR-5: dev đo 10 · 9
  /* DEM-QUA-HAN (chủ SP 06/11 — quá hạn vẫn phải tính): Phân tích GV bảng / panel Việc đúng hạn / hồ sơ GV dựng Công việc "Tất cả" của chi nhánh (`viecQuaHanMo`,
     một lần mỗi chi nhánh mỗi request) → +~30–40 câu. Trần nâng = min(100, max(đo + 10, ⌈đo × 1,3⌉)): đo bảng FT 79 · 78, thường 69 · 68, khoảng dài 75 · 74,
     panel 56 · 55, hồ sơ GV 80–82. Đã cảnh báo PTA (dòng / ngày trong mô tả PR). */
  /* GIAM-DOC-0611: đường GET mới đo (DUONG_DO cuối) — max(đo + 10, ⌈đo × 1,3⌉), đo 06/11 ×1; `/classes/3/phoi-hop-sos` GIAM-DOC-0611d: đo 11 (trước 23). */
  'ADMIN /tong-quan/gv-tre': 27, 'GVBM /classes/3/phoi-hop-sos': 21, 'GVBM /ref/periods': 14, 'GVBM /students/1/phoi-hop-sos': 17, 'GVBM /students/1/s-expert': 16, 'GVCN /cham/lich-test/qua-han': 19, 'GVCN /classes/3/phoi-hop-sos': 21, 'GVCN /classes/3/y-thuc/lo': 18, 'GVCN /cycles/3/suggested-mocks': 32, 'GVCN /hoc-vien-lop/lich-thi/3/lich-su': 18, 'GVCN /ref/periods': 14, 'GVCN /students/1/phoi-hop-sos': 17, 'GVCN /students/1/s-expert': 16, 'GVCN_THUONG /classes/3/phoi-hop-sos': 21, 'GVCN_THUONG /ref/periods': 14, 'GVCN_THUONG /students/1/phoi-hop-sos': 17, 'GVCN_THUONG /students/1/s-expert': 16, 'QL /bao-cao-ph/lop?branchId=1': 12, 'QL /cham/lich-test/qua-han': 18, 'QL /classes/3/phoi-hop-sos': 21, 'QL /classes/3/teachers': 17, 'QL /classes/3/y-thuc/lo': 18, 'QL /cycles/3/suggested-mocks': 31, 'QL /hoc-vien-lop/lich-thi/3/lich-su': 17, 'QL /ref/periods': 14, 'QL /students/1/phoi-hop-sos': 17, 'QL /students/1/s-expert': 15, 'QL /tong-quan/gv-tre?gv=7': 24, 'QT /admin/mo-sua-lich-test': 12, 'QT /bao-cao-ph/lop?branchId=1': 12, 'QT /classes/3/phoi-hop-sos': 21, 'QT /classes/3/teachers': 17, 'QT /ref/periods': 14, 'QT /students/1/phoi-hop-sos': 15, 'QT /students/1/s-expert': 13, 'QT /tong-quan/gv-tre?gv=7': 23,
  /* BAO-CAO-PH b: Excel một lớp (MB FT 101 33 em: em + bản ghi + GV + điểm gốc 5 kỹ năng) — max(đo + 10, ⌈đo × 1,3⌉), đo 06/11 QL / QT / Admin 12 · GVCN 403 2. */
  'QL /classes/3/bao-cao-ph/xuat': 22, 'QT /classes/3/bao-cao-ph/xuat': 22, 'ADMIN /classes/3/bao-cao-ph/xuat': 22, 'GVCN /classes/3/bao-cao-ph/xuat': 12,
  /* BCPH-PDF: cùng câu Excel + 1 câu địa chỉ / SĐT chi nhánh (1 dòng) — trần = Excel + 1. */
  'QL /classes/3/bao-cao-ph/xuat?kieu=pdf': 23, 'QT /classes/3/bao-cao-ph/xuat?kieu=pdf': 23, 'ADMIN /classes/3/bao-cao-ph/xuat?kieu=pdf': 23, 'GVCN /classes/3/bao-cao-ph/xuat?kieu=pdf': 12,
  /* BAO-CAO-PH: tab + panel một phần — trần = max(đo + 10, ⌈đo × 1,3⌉), đo 06/11: FT tab 5 · panel 5; lớp thường (FOU, tính đợt từ tiến độ lớp) 7 · 7. */
  'QL /classes/3/bao-cao-ph': 15, 'GVCN /classes/3/bao-cao-ph': 15, 'GVBM /classes/3/bao-cao-ph': 15, 'GVCN_THUONG /classes/3/bao-cao-ph': 15, 'QT /classes/3/bao-cao-ph': 15, 'ADMIN /classes/3/bao-cao-ph': 15,
  'QL /classes/3/bao-cao-ph/phan?phan=listening': 15, 'GVCN /classes/3/bao-cao-ph/phan?phan=listening': 15, 'GVBM /classes/3/bao-cao-ph/phan?phan=listening': 15, 'GVCN_THUONG /classes/3/bao-cao-ph/phan?phan=listening': 15, 'QT /classes/3/bao-cao-ph/phan?phan=listening': 15,
  'QL /classes/6/bao-cao-ph': 17, 'QL /classes/6/bao-cao-ph/phan?phan=writing': 17, 'QT /classes/6/bao-cao-ph': 17, 'QT /classes/6/bao-cao-ph/phan?phan=writing': 17, 'GVCN_THUONG /classes/6/bao-cao-ph': 17, 'GVCN_THUONG /classes/6/bao-cao-ph/phan?phan=writing': 17,
  /* PT-PANEL (PR-1, 05/11): panel bảng có điểm — trần = max(đo + 10, ⌈đo × 1,3⌉). */
  'QL /phan-tich/y-thuc/o?dong=tong&cot=vi-pham': 20, 'QT /phan-tich/y-thuc/o?dong=tong&cot=vi-pham': 20, 'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=viec-dung-han': 73, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=viec-dung-han': 72,   // PT-VP-PA: đo 10 · 10 · 15 · 14
  'QL /phan-tich/tong-hop/o?ct=thuong&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot': 22, 'QT /phan-tich/tong-hop/o?ct=thuong&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot': 22, 'QL /phan-tich/giao-vien/o?cn=1&ct=thuong&gv=7&tu=2026-03-02&den=2026-09-14&cot=ket-qua': 23, 'QT /phan-tich/giao-vien/o?cn=1&ct=thuong&gv=7&tu=2026-03-02&den=2026-09-14&cot=ket-qua': 23,   // PT-LOP-THUONG: đo 12 · 12 · 13 · 13
  'QL /phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=kn:listening': 22, 'QT /phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=kn:listening': 22,   // PT-PANEL: đo 12
  'QL /phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot': 21, 'QT /phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot': 21,   // PT-PANEL: đo 11
  'QL /phan-tich/bao-cao/o?ct=ft&branchId=1&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=tien-bo:writing1:tang': 38, 'QT /phan-tich/bao-cao/o?ct=ft&branchId=1&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=tien-bo:writing1:tang': 38,   // PT-PANEL: đo 28
  'QL /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-mt': 28, 'QT /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-mt': 28,   // PT-PANEL: đo 18
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&tu=2026-03-02&den=2026-09-14&cot=tien-bo': 25, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&tu=2026-03-02&den=2026-09-14&cot=tien-bo': 25,   // PT-PANEL: đo 15
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&tu=2026-03-02&den=2026-09-14&cot=dat-mt': 25, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&tu=2026-03-02&den=2026-09-14&cot=dat-mt': 25,   // PT-PANEL: đo 15
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=hv-chu-y': 25, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=hv-chu-y': 25,   // PT-PANEL: đo 15
  'QL /giao-vien/7/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14': 28, 'GVCN /giao-vien/7/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14': 26, 'GVBM /giao-vien/7/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14': 14, 'GVCN_THUONG /giao-vien/7/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14': 26, 'QT /giao-vien/7/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14': 27,   // PT-PANEL: đo 21 · 19 · 4 (403) · 19 · 20
  /* SUA-NHO-QUYEN: Quản trị › Tài khoản — đo 30/10 trước 138 câu (4 câu × tài khoản) → sau 11; trần = max(đo+10, ⌈đo×1,3⌉). */
  'QT /admin/accounts': 21,
  /* QTV2-QUYEN: nhật ký chung + đơn vị báo cáo (thay /admin/overview: đọc mọi tài khoản + 6 COUNT(*)) — đo 11/11: 4 · 3 câu; trần = max(đo+10, ⌈đo×1,3⌉). */
  'QT /admin/nhat-ky': 14, 'QL /admin/nhat-ky': 14, 'QT /admin/nhat-ky?muc=chi-nhanh': 14, 'QL /admin/nhat-ky?muc=chi-nhanh': 14, 'QT /admin/don-vi': 13, 'QL /admin/don-vi': 13, 'QT /admin/nhat-ky?muc=chi-nhanh&gioi-han=8': 13, 'QL /admin/nhat-ky?muc=chi-nhanh&gioi-han=8': 13,
  /* QTV2-HAN: Hạn mặc định — trần = max(đo+10, ⌈đo×1,3⌉). */
  'QT /admin/cau-hinh/han': 13, 'QL /admin/cau-hinh/han': 13, 'QT /admin/nhat-ky?muc=han&gioi-han=8': 13, 'QL /admin/nhat-ky?muc=han&gioi-han=8': 13,
  /* QTV2-BAND — trần = max(đo+10, ⌈đo×1,3⌉). */
  'QT /admin/cau-hinh/ky-vong-ft': 13, 'QL /admin/cau-hinh/ky-vong-ft': 13, 'QT /admin/cau-hinh/nguong-thuong': 13, 'QL /admin/cau-hinh/nguong-thuong': 13,
  'QT /admin/nhat-ky?muc=band&gioi-han=8': 13, 'QL /admin/nhat-ky?muc=band&gioi-han=8': 13,
  /* PR-B: phiếu bàn giao đổi GV (MB FT 101, 33 em, tự điền sống) — trần = max(đo + 10, ⌈đo × 1,3⌉), đo 30/10: QL 21 · QT 20 · GVCN 21 · GVBM 20. */
  'QL /ban-giao-gv/1': 31, 'QT /ban-giao-gv/1': 30, 'GVCN /ban-giao-gv/1': 31, 'GVBM /ban-giao-gv/1': 30,
  'QL /lenh-chuyen/{lenhBg}/ban-giao': 23, 'QT /lenh-chuyen/{lenhBg}/ban-giao': 23,   // BAN-GIAO-NHAN 05/11: đo 13 → max(n+10, ⌈n×1,3⌉)
  /* PR-B BAN-GIAO-GV: /my-work + viec-theo-em +1 câu (việc bàn giao khi đổi GV — một câu cho mọi việc; phân công lớp đích "Cùng GV" đi cùng câu lệnh sẵn có). */
  /* PC-GV-A: góc Phân công GV cả chi nhánh — trần = max(đo+10, ⌈đo×1,3⌉), đo 30/10 (QL · QT · CX 16 · GV / TVV 403: 4). */
  'QL /hoc-vien-lop/phan-cong?branchId=1': 26, 'QT /hoc-vien-lop/phan-cong?branchId=1': 26, 'CX /hoc-vien-lop/phan-cong?branchId=1': 26,
  'GVCN /hoc-vien-lop/phan-cong?branchId=1': 14, 'GVBM /hoc-vien-lop/phan-cong?branchId=1': 14, 'TVV /hoc-vien-lop/phan-cong?branchId=1': 14,
  /* HSL-MAY-CHU: một lượt lớp thường — trần = max(đo+10, ⌈đo×1,3⌉), đo 27/10 (27 · 24 · 27). */
  'QL /regular/attempts/24': 31, 'QT /regular/attempts/24': 34, 'GVCN_THUONG /regular/attempts/24': 37,   // TL-NEN: đo 21 (trước 26)
  /* UI-HO-SO-LOP (22/10): thanh Việc cần làm = `/my-work` của người xem lọc theo lớp (đo GV 61 · QL / QT 78 = cùng số `/my-work`) — trần như `/my-work` (+2);
     LOP-1-LOP: đo GV 60–61 · QL / QT 79 (trước 61–62 · 80) — câu gần như không đổi (các khối khác của `myWork` đọc theo chi nhánh rồi lọc — chờ TRANG-LON); trần giữ;
     Đánh giá đầu ra lớp thường đo 8 / 7 / 9 — trần max(đo+10, ⌈đo×1,3⌉). */
  'GVCN /classes/3/viec-theo-em?chi=toi': 45, 'GVBM /classes/3/viec-theo-em?chi=toi': 44, 'GVCN_THUONG /classes/3/viec-theo-em?chi=toi': 45,
  'QL /classes/3/viec-theo-em?chi=toi': 56, 'QT /classes/3/viec-theo-em?chi=toi': 56,   // TL-VIEC: đo 46 · 46 (trước 66 · 66), GV đo 35 · 34 · 35 (trước 48 · 47 · 48); còn > 30 câu → trần = đo + 10 (PTA 31/10)
  'QL /classes/6/danh-gia-dau-ra': 18, 'QT /classes/6/danh-gia-dau-ra': 17, 'GVCN_THUONG /classes/6/danh-gia-dau-ra': 19,
  /* SV-SO2: hồ sơ GV theo kỳ, Đạt MT, Thi tháng này, khoảng ~29 tuần (P9) — trần = max(đo+10, ⌈đo×1,3⌉), đo ×3 22/10. `/giao-vien/…`: GIAM-DOC-HSGV hạ lại (xem khối PR-GV (3)). */
  'QL /giao-vien/7/chi-so': 43, 'GVCN /giao-vien/7/chi-so': 41, 'GVBM /giao-vien/7/chi-so': 14, 'GVCN_THUONG /giao-vien/7/chi-so': 41, 'QT /giao-vien/7/chi-so': 42, 'QL /giao-vien/7/chi-so?tu=2026-03-02&den=2026-09-14': 43, 'GVCN /giao-vien/7/chi-so?tu=2026-03-02&den=2026-09-14': 41, 'GVBM /giao-vien/7/chi-so?tu=2026-03-02&den=2026-09-14': 14, 'GVCN_THUONG /giao-vien/7/chi-so?tu=2026-03-02&den=2026-09-14': 41, 'QT /giao-vien/7/chi-so?tu=2026-03-02&den=2026-09-14': 42, 'QL /giao-vien/7/chi-so/o?cot=cham-diem': 21, 'GVCN /giao-vien/7/chi-so/o?cot=cham-diem': 19, 'GVBM /giao-vien/7/chi-so/o?cot=cham-diem': 14, 'GVCN_THUONG /giao-vien/7/chi-so/o?cot=cham-diem': 19, 'QT /giao-vien/7/chi-so/o?cot=cham-diem': 20, 'QL /giao-vien/7/chi-so/o?cot=ket-qua&tu=2026-03-02&den=2026-09-14': 34, 'GVCN /giao-vien/7/chi-so/o?cot=ket-qua&tu=2026-03-02&den=2026-09-14': 32, 'GVBM /giao-vien/7/chi-so/o?cot=ket-qua&tu=2026-03-02&den=2026-09-14': 14, 'GVCN_THUONG /giao-vien/7/chi-so/o?cot=ket-qua&tu=2026-03-02&den=2026-09-14': 32, 'QT /giao-vien/7/chi-so/o?cot=ket-qua&tu=2026-03-02&den=2026-09-14': 33, 'QL /phan-tich/bao-cao/o?ct=ft&o=dat-mt': 33, 'QT /phan-tich/bao-cao/o?ct=ft&o=dat-mt': 33, 'GVCN /phan-tich/bao-cao/o?ct=ft&o=dat-mt': 14, 'QL /phan-tich/bao-cao/o?ct=ft&o=thi-thang-nay': 29, 'QT /phan-tich/bao-cao/o?ct=ft&o=thi-thang-nay': 33, 'GVCN /phan-tich/bao-cao/o?ct=ft&o=thi-thang-nay': 14, 'QL /phan-tich/bao-cao?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20': 54, 'QT /phan-tich/bao-cao?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20': 52, 'QL /phan-tich/giao-vien?cn=1&ct=ft&tu=2026-03-02&den=2026-09-14': 98, 'QT /phan-tich/giao-vien?cn=1&ct=ft&tu=2026-03-02&den=2026-09-14': 97,   // TL-TQ: đo 23 (trước 29) · 23 (trước 28) · 19 (trước 23) · 23 (trước 26) · 41 (trước 47) · 40 (trước 44) · TL-NEN: đo 39 (trước 44)   // DOC-PT: Phân tích GV khoảng dài đo 36 · 35 (trước 43 · 42)
  /* OV-15g: Lịch sử thay đổi — trần = max(đo+10, ⌈đo×1,3⌉), đo 20/10. */
  'QL /lich-su?loai=hv&id=1': 16, 'QT /lich-su?loai=hv&id=1': 14, 'GVCN /lich-su?loai=hv&id=1': 19, 'GVBM /lich-su?loai=hv&id=1': 18,
  'QL /lich-su?loai=lop&id=3': 16, 'GVCN /lich-su?loai=lop&id=3': 17, 'GVBM /lich-su?loai=lop&id=3': 17, 'GVCN_THUONG /lich-su?loai=lop&id=3': 17, 'QT /lich-su?loai=lop&id=3': 15,
  'QL /lich-su?loai=gop-y&id=3': 15, 'GVCN /lich-su?loai=gop-y&id=3': 16, 'GVBM /lich-su?loai=gop-y&id=3': 16, 'GVCN_THUONG /lich-su?loai=gop-y&id=3': 16, 'QT /lich-su?loai=gop-y&id=3': 14,
  'QL /lich-su?loai=nhap-hv&id=3': 16, 'QT /lich-su?loai=nhap-hv&id=3': 15,
  /* OV-15i1: thi thật · phân công · ô điểm — trần = max(đo+10, ⌈đo×1,3⌉), đo 20/10 (thi-that 7 · 5 · 10 · 8 · phan-cong 6 · 7 · 7 · 7 · 5 · o 10 · 7 · 11 · 11). */
  'QL /lich-su?loai=thi-that&id=3': 17, 'QT /lich-su?loai=thi-that&id=3': 15, 'GVCN /lich-su?loai=thi-that&id=3': 20, 'GVBM /lich-su?loai=thi-that&id=3': 18,
  'QL /lich-su?loai=phan-cong&id=3': 16, 'GVCN /lich-su?loai=phan-cong&id=3': 17, 'GVBM /lich-su?loai=phan-cong&id=3': 17, 'GVCN_THUONG /lich-su?loai=phan-cong&id=3': 17, 'QT /lich-su?loai=phan-cong&id=3': 15,
  'QL /lich-su?loai=o&id=5': 20, 'QT /lich-su?loai=o&id=5': 17, 'GVCN /lich-su?loai=o&id=5': 21, 'GVBM /lich-su?loai=o&id=5': 21,
  /* TU-b: trang Tutor — trần = max(đo+10, ⌈đo×1,3⌉), đo 20/10. */
  'QL /tutors': 17, 'QT /tutors': 18, 'GVCN /tutors': 13, 'QL /tutors/1': 18, 'QT /tutors/1': 19, 'QL /tutors/dem': 12, 'QT /tutors/dem': 13, 'QT /tutors/go-tay': 13,
  /* TU-a: ô chọn tutor — trần = max(đo+10, ⌈đo×1,3⌉), đo 20/10. */
  'QL /tutors/chon?studentId=1': 17, 'QT /tutors/chon?studentId=1': 15, 'GVCN /tutors/chon?studentId=1': 19, 'GVBM /tutors/chon?studentId=1': 19,
  'QL /tutors/chon?paId=7': 20, 'QT /tutors/chon?paId=7': 17, 'GVCN /tutors/chon?paId=7': 21,
  /* DOC-IT-1: isInitialised nhớ theo kết nối (−1 câu sqlite_master) — đo 3 · 4 · 4 · 4 · 3 → max(đo+10, ⌈đo×1,3⌉). */
  'QL /demo/session': 13,
  'GVCN /demo/session': 14,
  'GVBM /demo/session': 14,
  'GVCN_THUONG /demo/session': 14,
  'QT /demo/session': 13,
  /* DOC-IT-4: đo 3 câu mọi vai → max(đo+10, ⌈đo×1,3⌉). */
  'QL /ref/classes': 13, 'GVCN /ref/classes': 13, 'GVBM /ref/classes': 13, 'GVCN_THUONG /ref/classes': 13, 'QT /ref/classes': 13,
  'QL /ref/classes?branchId={cn}': 13, 'QT /ref/classes?branchId={cn}': 13,
  'QL /ref/branches': 14,
  /* PR-LUI-b (5f): trần = max(đo+10, ⌈đo×1,3⌉) — đo 06/10. */
  /* P7 SV-LO-TRINH: trần = max(đo+10, ⌈đo×1,3⌉), đo 25/10 — xem trước hộp Tạm dừng/ Kết thúc học. */
  'QL /students/1/trang-thai/xem-truoc?ketThuc=1': 19, 'QT /students/1/trang-thai/xem-truoc?ketThuc=1': 17, 'GVCN /students/1/trang-thai/xem-truoc?ketThuc=1': 21, 'GVBM /students/1/trang-thai/xem-truoc?ketThuc=1': 21,
  'QL /students/1/hoc-lai/lop-dich': 28,
  'QT /students/1/hoc-lai/lop-dich': 26,
  /* PR-TK (TK-7): ba đường đọc bản chụp — trần = max(đo+10, ⌈đo×1,3⌉), đo 07/10. */
  'QL /students/1/lo-trinh': 21, 'QT /students/1/lo-trinh': 19, 'GVCN /students/1/lo-trinh': 22, 'GVBM /students/1/lo-trinh': 22,
  /* OV-13m: panel Bước tiếp — trần = max(đo+10, ⌈đo×1,3⌉), đo 15/10: QL 10 · QT 8 · GVCN 11 · GVBM 11. */
  'QL /cycles/1/buoc-tiep': 16, 'QT /cycles/1/buoc-tiep': 18, 'GVCN /cycles/1/buoc-tiep': 21, 'GVBM /cycles/1/buoc-tiep': 21,   // TL-NEN: đo 6 (trước 11)
  /* THI-LAI-1-KN: GET /cycles/:id + KQ thi thật lần trước — trần = max(đo+10, ⌈đo×1,3⌉), đo 05/11: QL 5 · QT 3 · GVCN 6 · GVBM 6. */
  'QL /cycles/1': 15, 'QT /cycles/1': 13, 'GVCN /cycles/1': 16, 'GVBM /cycles/1': 16,
  'QL /lo-trinh/1/tong-ket': 20, 'QT /lo-trinh/1/tong-ket': 18, 'GVCN /lo-trinh/1/tong-ket': 21, 'GVBM /lo-trinh/1/tong-ket': 21,
  'QL /classes/1/tong-ket': 19, 'QT /classes/1/tong-ket': 18, 'GVCN /classes/1/tong-ket': 19, 'GVBM /classes/1/tong-ket': 19, 'GVCN_THUONG /classes/1/tong-ket': 19,
  'GVCN /ref/branches': 15,
  'GVBM /ref/branches': 15,
  'GVCN_THUONG /ref/branches': 15,
  'QT /ref/branches': 14,
  /* PR-VAI-a: trần đường mới = max(đo+10, ⌈đo×1,3⌉) — đo 01/10. */
  'QL /metrics/lop-thieu-gv-mon': 20,
  'QT /metrics/lop-thieu-gv-mon': 20,
  'GVCN /tong-quan/lop-toi-day?ct=ft': 47,
  'GVBM /tong-quan/lop-toi-day?ct=ft': 47,
  'GVCN_THUONG /tong-quan/lop-toi-day?ct=ft': 47,
  'GVCN_THUONG /tong-quan/lop-toi-day?ct=thuong': 47,
  'GVCN /tong-quan/lop-toi-day/o?ct=ft&classId=3&cot=duoiKyVong': 47,   // {lopFT} = MB FT 101
  'GVCN /tong-quan/lop-toi-day/o?ct=ft&classId=3&cot=bai-qua-han': 54,   // PR-S6F-b D10 — đo 46 (01/10)
  /* SV-TQ-GV: trần = max(đo+10, ⌈đo×1,3⌉), đo 24/10 — hai khối = `lopToiDay` FT (34) + Lớp thường (36) + hồ sơ GV theo kỳ (đã nhớ) + Thi tháng này. */
  'GVCN /tong-quan/lop-toi-day/hai-khoi': 64, 'GVBM /tong-quan/lop-toi-day/hai-khoi': 64, 'GVCN_THUONG /tong-quan/lop-toi-day/hai-khoi': 64,   // TL-NEN: đo 60 (trước 65); RA-DOC-0611: đo 49 (trước 61)
  'GVCN /tong-quan/lop-toi-day/o?ct=ft&classId=3&cot=thi-thang-nay': 45,   // đo 34
  'QL /signals': 41,   // PR-S6F-b: đo 38 (một metricSet mỗi chỉ số)
  'QT /signals': 38,   // đo 35
  'QL /tong-quan/quan-ly': 71,   // OV-15d: + "Cần bạn quyết" (Case quá hạn · Bước tiếp · Chốt lộ trình) — đo 73; trang Tổng quan QL bỏ 6 ô số + Điểm đáng chú ý nên tổng trang giảm; TL-NEN: đo 54 (trước 69)
  'QT /tong-quan/quan-ly': 67,   // OV-15d: đo 76   // PR-LCb: đo 60 (PR-MT0 đo 76); TL-NEN: đo 51 (trước 66)
  'GVCN /tong-quan/quan-ly': 12,   // TL-NEN: đo 2 (trước 7)
  'GVBM /tong-quan/quan-ly': 12,   // TL-NEN: đo 2 (trước 7)
  'QL /highlights': 25,
  'QT /highlights': 25,
  /* OV-10c: Tổng quan theo vai — CX / QT gọi thêm danh sách Học viên & Lớp (chip Thiếu thông tin cùng nguồn): đo TVV 71, CX 95, QT 94, CX một CN 77, Admin 62 / 15. */
  'TVV /tong-quan/hoc-vien': 26,   // TL-NEN: đo 55 (trước 68); RA-DOC-0611: đo 46 (trước 48); GIAM-DOC-0611: đo 16 (trước 46) — cờ Thiếu thông tin không dựng cả danh sách
  'CX /tong-quan/hoc-vien': 27,   // TL-NEN: đo 72 (trước 80); RA-DOC-0611: đo 60 (trước 62); GIAM-DOC-0611: đo 17 (trước 60) — cờ Thiếu thông tin không dựng cả danh sách
  'QT /tong-quan/hoc-vien': 26,   // TL-NEN: đo 71 (trước 81); RA-DOC-0611: đo 59 (trước 61); GIAM-DOC-0611: đo 16 (trước 59) — cờ Thiếu thông tin không dựng cả danh sách
  'CX /tong-quan/hoc-vien?branchId=1': 26,   // {cn} = Móng Bình; TL-NEN: đo 62 (trước 75); RA-DOC-0611: đo 52 (trước 54); GIAM-DOC-0611: đo 16 (trước 52) — cờ Thiếu thông tin không dựng cả danh sách
  /* OV-10b: Học viên & Lớp / hồ sơ HV theo vai — trần = min(max(đo+10, ⌈đo×1,3⌉), 100); đo 13/10: TVV 74 · TVV cả CN 72 · CX 97 (chip = chipHocVien, 95 như Tổng quan) · CX một CN 80 · Admin 70 · hồ sơ CX 83 / Admin 86. */
  'TVV /hoc-vien-lop/theo-vai': 31,   // TL-NEN: đo 61 (trước 73); TL-HVL: đo 53 (trước 57); RA-DOC-0611: đo 49; GIAM-DOC-0611: đo 21 (trước 49) — cờ Thiếu thông tin không dựng cả danh sách
  'TVV /hoc-vien-lop/theo-vai?phamVi=chi-nhanh': 31,   // TL-NEN: đo 60 (trước 72); TL-HVL: đo 52 (trước 56); RA-DOC-0611: đo 48; GIAM-DOC-0611: đo 21 (trước 48) — cờ Thiếu thông tin không dựng cả danh sách
  'CX /hoc-vien-lop/theo-vai': 30,   // TL-NEN: đo 75 (trước 84); TL-HVL: đo 64 (trước 70); RA-DOC-0611: đo 62; GIAM-DOC-0611: đo 20 (trước 62) — cờ Thiếu thông tin không dựng cả danh sách
  'CX /hoc-vien-lop/theo-vai?branchId=1': 30,   // TL-NEN: đo 67 (trước 79); TL-HVL: đo 58 (trước 62); RA-DOC-0611: đo 56; GIAM-DOC-0611: đo 20 (trước 56) — cờ Thiếu thông tin không dựng cả danh sách
  'ADMIN /hoc-vien-lop': 63,   // TL-NEN: đo 55 (trước 69); TL-HVL: đo 48 (trước 51)
  'CX /students/1': 85,   // TL-NEN: đo 76 (trước 82); GIAM-COMPUTE: đo 67 (trước 79); TURSO-LOG-1311: đo 65 (checkpoint dùng lại kết quả lượt, tên Case theo lô)
  'ADMIN /students/1': 85,   // GIAM-COMPUTE: đo 67 (trước 79); TURSO-LOG-1311: đo 65
  'ADMIN /tong-quan/mock-test': 38,   // TL-NEN: đo 28 (trước 42)
  'ADMIN /highlights': 20,
  /* OV-15h1: trần = đo + 6 (đo demo 20/10: QL 56 · 54 · 21 · 15; QT 52 · 50 · 19 · 14). */
  'QL /tong-quan/ql?ct=ft': 62, 'QT /tong-quan/ql?ct=ft': 58, 'GVCN /tong-quan/ql?ct=ft': 15, 'QL /tong-quan/ql?ct=thuong': 60, 'QT /tong-quan/ql?ct=thuong': 56,
  'QL /yeu-cau/dem?branchId=1': 15, 'QT /yeu-cau/dem?branchId=1': 20,   // TL-NEN: đo 5 (trước 16)
  'QL /tong-quan/chi-nhanh': 26,   // TL-TQ: đo 16 (trước 21)
  'QT /tong-quan/chi-nhanh': 25,   // TL-TQ: đo 15 (trước 20)
  'QL /tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong': 36,   // TL-TQ: đo 26 (trước 31) · OV-15d: + tập Case chưa chốt PA (cột Lớp cần chú ý) — đo 48
  'QT /tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong': 35,   // TL-TQ: đo 25 (trước 30) · OV-15d: + tập Case chưa chốt PA — đo 46
  'QL /metrics/case-mo': 22,
  'QT /metrics/case-mo': 19,
  'QL /metrics/bai-qua-han-nhap-diem?rows=1': 30,   // PR-UXF-a Task 5: đo 25 → max(25+10, ⌈25×1.3⌉)
  'QT /metrics/bai-qua-han-nhap-diem?rows=1': 28,   // PR-UXF-a Task 5: đo 23
  /* PANEL-MC: mở panel — dòng HV kèm điểm đúng lượt (đo 10 = ô số + dòng; lượt đi cùng tập, 0 câu thêm; chương trình 1 câu thay 3) · Lịch sử một thẻ Chờ duyệt (đo QL 6 · QT 5 qua HTTP; `{ycPa}` = thẻ PA chờ duyệt của chi nhánh MB, lấy lúc chạy). */
  'QL /metrics/hv-sos-hien-tai?rows=1': 20,
  'QT /metrics/hv-sos-hien-tai?rows=1': 20,
  'QL /metrics/hv-duoi-ky-vong-mon?rows=1&skill=reading': 20,
  'QT /metrics/hv-duoi-ky-vong-mon?rows=1&skill=reading': 20,
  'QL /yeu-cau?hop=cho-duyet&boiCanh=1': 29,   // PANEL-MC: không cờ đo 27 · cờ đo 31 (QT 30) = + lượt · chương trình · lịch kỹ năng · điểm (mỗi loại 1 câu theo lô); số Lịch sử đếm trong câu đọc thẻ; TL-NEN: đo 19 (trước 31)
  'QT /yeu-cau?hop=cho-duyet&boiCanh=1': 29,   // TL-NEN: đo 19 (trước 30)
  'QL /lich-su?loai=yeu-cau&id={ycPa}': 16,
  'QT /lich-su?loai=yeu-cau&id={ycPa}': 15,
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
  'GVCN /my-work': 44,   // LG-3 (việc GV Báo cáo PH): đo 37 → 42 (+5 câu: tiến độ lớp, tuỳ chỉnh đợt, em, bản ghi đủ; +43 dòng ×1 · +101 ×3), trần đo + 2 · LG-8: đo 35 → 38 (+3 câu: FT 1 + tiến độ lớp thường 2; +64 dòng), trần giữ · TD4: đo 61 (trước 64), trần đo + 2; TL-NEN: đo 46 (trước 61) · TL-VIEC: đo 33 (trước 46)
  'GVBM /my-work': 44,   // LG-3: đo 37 → 42 (+5 câu, +65 dòng ×1 · +147 ×3), trần đo + 2 · LG-8: đo 34 → 37 (+3 câu, +88 dòng), trần giữ · TD4: đo 61 (trước 64); TL-NEN: đo 45 (trước 60) · TL-VIEC: đo 32 (trước 45)
  'GVCN_THUONG /my-work': 44,   // LG-3: đo 37 → 42 (+5 câu, +43 dòng), trần đo + 2 · LG-8: đo 34 → 37 (+3 câu, +64 dòng), trần giữ · TD4: đo 61 (trước 64); TL-NEN: đo 46 (trước 61) · TL-VIEC: đo 33 (trước 46)
  /* PR-Ra: trang "Công việc" dùng lại /my-work cho QL·QT, cộng chế độ nguoi=tat-ca/{gv} (Q1–Q2). */
  'ADMIN /my-work': 23,   // RA-DOC-0611: đường mới đo — đo 13 (gồm 4 câu việc Xuất báo cáo PH) → max(đo + 10, ⌈đo × 1,3⌉)
  'QL /my-work': 49,   // PC-GV-A +1 (quét lịch đổi phân công GV tới hạn — một câu rẻ trong `quetLenhDenHan`, mọi đường đọc có quét); SV-NX-CASE +1 (MT mới nhất của em, một câu / trang); TD4: đo 61 (trước 64); SV-YT-TVV +1 (việc Báo PH: một câu); SV-TVV-VIEC +1 (Chốt ngày thi + Bổ sung hồ sơ: một câu); SEED-UX +1 (em "Đã thi · chờ KQ" theo ngày → câu đọc việc Cập nhật KQ thi thật có dữ liệu); MAIN-DO +1 (SEED-UX BU_MT2: 4 em MT2 chưa đạt có Case → `napTruocPhamVi` nạp thêm một lô; ×1 = ×3); P9a XET-LAI +2 (tập Xét lại: Final + mốc + Mini Test + Báo PH một câu, quyết định, bổ trợ — thay 4 câu cũ; đo 70); TL-NEN: đo 54 (trước 69) · TL-VIEC: đo 39 (trước 54)
  'QT /my-work': 49,   // PC-GV-A +1 (quét lịch đổi phân công GV tới hạn); SV-NX-CASE +1; TD4: đo 61 (trước 64); SV-YT-TVV +1; SV-TVV-VIEC +1; SEED-UX +1 (em "Đã thi · chờ KQ" theo ngày → câu đọc việc Cập nhật KQ thi thật có dữ liệu); MAIN-DO +1 (SEED-UX BU_MT2: 4 em MT2 chưa đạt có Case → `napTruocPhamVi` nạp thêm một lô; ×1 = ×3); P9a XET-LAI +2 (tập Xét lại: Final + mốc + Mini Test + Báo PH một câu, quyết định, bổ trợ — thay 4 câu cũ; đo 70); TL-NEN: đo 54 (trước 69) · TL-VIEC: đo 39 (trước 54)
  'QL /my-work?nguoi=tat-ca': 65,   // LG-3: "Tất cả" có việc Báo cáo PH của GV trong phạm vi (= "Của một GV") — +5 câu (phân công nhớ, tiến độ lớp, tuỳ chỉnh đợt, em, bản ghi đủ), demo MB đo 63, trần đo + 2; ×3 45 → 50 câu, 2085 → 2252 dòng · GV-CU-BO-TRO +1 (Người dạy nhóm `mt:` — `nguoiDayNhom`, một câu khi tập có PA bổ trợ miễn phí) · PHOI-HOP-SOS-INFO: đo 57 (+3 câu: lượt + điểm + lịch kỹ năng của thẻ kết quả SOS, một lô cho cả tập lớp, không theo lớp / em), trần đo + 2; TD4: đo 69 (trước 76) — một lần `listAttempts`; 16/10 +1 OV-13k (xem_nx_s) +1 OV-13m (Chọn bước tiếp) = 73; SV-YT-TVV +1, SV-TVV-VIEC +1 = 75; SEED-UX +1 (em "Đã thi · chờ KQ" theo ngày → câu đọc việc Cập nhật KQ thi thật có dữ liệu); MAIN-DO +1 (SEED-UX BU_MT2: 4 em MT2 chưa đạt có Case → `napTruocPhamVi` nạp thêm một lô; ×1 = ×3); V5 SV-SO1 +1 (ngữ cảnh Case "Làm thay" một câu); P9a XET-LAI +2 (Xét lại lộ trình: Final + mốc + Mini Test + Báo PH một câu, quyết định, bổ trợ thay 4 câu cũ — đo 80) · TL-VIEC: đo 44 (trước 64)
  'QT /my-work?nguoi=tat-ca': 59,   // PHOI-HOP-SOS-INFO: +3 câu như QL (đo 57); TD4: đo 69 (trước 76); 16/10 +1 OV-13k +1 OV-13m = 73; SV-YT-TVV +1, SV-TVV-VIEC +1 = 75; SEED-UX +1 (em "Đã thi · chờ KQ" theo ngày → câu đọc việc Cập nhật KQ thi thật có dữ liệu); MAIN-DO +1 (SEED-UX BU_MT2: 4 em MT2 chưa đạt có Case → `napTruocPhamVi` nạp thêm một lô; ×1 = ×3); V5 SV-SO1 +1 (ngữ cảnh Case "Làm thay" một câu); P9a XET-LAI +2 (Xét lại lộ trình: Final + mốc + Mini Test + Báo PH một câu, quyết định, bổ trợ thay 4 câu cũ — đo 80) · TL-VIEC: đo 44 (trước 64)
  'GVCN /my-work?nguoi=tat-ca': 12,   // TL-NEN: đo 2 (trước 7)
  'QL /my-work?nguoi=tat-ca&branchId={cn}': 52, 'QT /my-work?nguoi=tat-ca&branchId={cn}': 52,   // LG-3: đo 50 (+5 câu như trên; dòng 2037 → 2204 ×3), trần đo + 2 · PHOI-HOP-SOS-INFO: đo 47 (+3 như trên, demo chi nhánh có ít lớp SOS hơn), trần đo + 2; DOC-THUA: đo 44 (Báo PH lọc chi nhánh trong SQL — cùng số câu), trần đo + 2
  'QL /my-work?nguoi=7': 48,   // P13 KET-PET +1: dữ liệu demo MB PET 01 tách 4 môn (GV 7 dạy L và S thay L+S) — mã P13 trên dữ liệu main đo 68, trên dữ liệu mới 69; TL-NEN: đo 52 (trước 67) · TL-VIEC: đo 38 (trước 52)
  /* OV-14c: GV không phải GV Speaking — rỗng (đo 4); GV Speaking đo ở prOv14c (`TRAN_CHAM_SPEAKING`, đo 14). */
  'GVCN /my-work/cham-speaking': 14, 'GVBM /my-work/cham-speaking': 14, 'QL /my-work/cham-speaking': 14,   // TD4: đo 66 (trước 70)
  /* PR-DUYET: đo khi hộp đã có thẻ thật (Task 4) — trần max(sau+10, ⌈sau×1,3⌉). */
  'QL /yeu-cau?hop=cho-duyet': 26,   // PR-CT gộp LT2b: 34 → 38   // PR-LT2a (11): demo G1–G5 có thẻ ke_hoach_bo_tro → loại thẻ thêm câu nạp (đo 32, MỘT lần mỗi loại, không theo số thẻ); PR-YT4 sau khi gộp PR-SOS: thẻ khong_theo_doi + bao_len_y_thuc cùng nạp (đo 29, +3,6%); PR-HVL (10): demo H1 thêm một thẻ "không theo dõi" chờ duyệt → đo 30   // PR-LT2b: hai loại thẻ Báo QL mới (+1–2 câu nap); TL-NEN: đo 16 (trước 27)
  'QT /yeu-cau?hop=cho-duyet': 26,   // PR-CT gộp LT2b: 33 → 37; TL-NEN: đo 16 (trước 26)
  'GVCN /yeu-cau?hop=cho-duyet': 12,
  /* PR-VAI-b (V1/K3-47): dải chờ duyệt của hồ sơ HV — đo 21/20/7, trần max(sau+10, ⌈sau×1,3⌉). */
  'QL /yeu-cau?studentId=1': 14,   // TL-NEN: đo 4 (trước 15)
  'QT /yeu-cau?studentId=1': 14,   // TL-NEN: đo 4 (trước 14)
  'GVCN /yeu-cau?studentId=1': 12,
  'QL /yeu-cau?hop=cho-duyet&xem=da-xu-ly': 24,   // PR-CT gộp main (LT2a + GV + demo CT): 29 → 30   // PR-SOS: loại thẻ khong_theo_doi thêm câu nạp (đo 23); + thẻ Ý thức PR-YT4 (đo 27)   // PR-CT: 28 → 29 (gộp main); TL-NEN: đo 14 (trước 25)
  'QT /yeu-cau?hop=cho-duyet&xem=da-xu-ly': 24,   // PR-CT gộp main (LT2a + GV + demo CT): 28 → 29   // PR-SOS: loại thẻ khong_theo_doi thêm câu nạp (đo 22)   // PR-CT: 27 → 28 (gộp main); TL-NEN: đo 14 (trước 24)
  'GVCN /yeu-cau?hop=cua-toi': 23,   // PR-CT gộp main (LT2a + GV + demo CT): 27 → 28   // PR-CT: 25 → 27 (gộp main); TL-NEN: đo 13 (trước 23)
  'GVBM /yeu-cau?hop=cua-toi': 13,   // PR-CT gộp main (LT2a + GV + demo CT): 21 → 22; TL-NEN: đo 3 (trước 13)
  'QL /yeu-cau/dem': 15,   // TL-NEN: đo 5 (trước 16)
  'GVCN /yeu-cau/dem': 13,   // TL-NEN: đo 3 (trước 13)
  'GVBM /yeu-cau/dem': 13,   // TL-NEN: đo 3 (trước 13)
  'GVCN_THUONG /yeu-cau/dem': 13,   // TL-NEN: đo 3 (trước 13)
  'QT /yeu-cau/dem': 15,   // TL-NEN: đo 5 (trước 15)
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
  /* PR-LT2a (Task 7): +1 câu `emCoBaoPhChuaLam` (việc Báo PH kết quả Test của GVCN, MỘT câu theo lô) — đo 67; trần 66 → 72 (+9%, < 30%). */
  /* TURSO-1211: danh sách + Đang SOS CÙNG request — đo QL 68 · GVCN / GVBM / GVCN_THUONG 70 · QT 69 · TVV 49 · CX 73 · Admin 52 (riêng: QL 52 + 22) → max(đo + 10, ⌈đo × 1,3⌉). */
  'QL /hoc-vien-lop?kem=sos': 89, 'GVCN /hoc-vien-lop?kem=sos': 91, 'GVBM /hoc-vien-lop?kem=sos': 91, 'GVCN_THUONG /hoc-vien-lop?kem=sos': 91,
  'QT /hoc-vien-lop?kem=sos': 90, 'TVV /hoc-vien-lop?kem=sos': 64, 'CX /hoc-vien-lop?kem=sos': 95, 'ADMIN /hoc-vien-lop?kem=sos': 68,
  'QL /hoc-vien-lop': 63,   // SV-SO3: +2 câu (hàng HV khu d: tuần thi + lượt trước có Overall, một lần / trang): đo 73, trần đo+10; TL-NEN: đo 55 (trước 69); TL-HVL: đo 48 (trước 51)
  'GVCN /hoc-vien-lop': 65,   // PR-UXF-a VN29: +4 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 76, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋); TL-NEN: đo 57 (trước 71); TL-HVL: đo 50 (trước 53)
  'GVBM /hoc-vien-lop': 65,   // PR-UXF-a VN29: +4 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 76, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋); TL-NEN: đo 57 (trước 71); TL-HVL: đo 50 (trước 53)
  'GVCN_THUONG /hoc-vien-lop': 65,   // PR-UXF-a VN29: +4 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 76, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋); TL-NEN: đo 57 (trước 71); TL-HVL: đo 50 (trước 53)
  'QT /hoc-vien-lop': 63,   // TL-NEN: đo 55 (trước 69); TL-HVL: đo 48 (trước 51)
  'QL /hoc-vien-lop?phamVi=chi-nhanh&branchId=1': 63,   // SV-SO3: +2 câu (hàng HV khu d: tuần thi + lượt trước có Overall, một lần / trang): đo 73, trần đo+10; TL-NEN: đo 55 (trước 69); TL-HVL: đo 48 (trước 51)
  'QT /hoc-vien-lop?phamVi=chi-nhanh&branchId=1': 63,   // SV-SO3: +2 câu (hàng HV khu d: tuần thi + lượt trước có Overall, một lần / trang): đo 73, trần đo+10; TL-NEN: đo 55 (trước 69); TL-HVL: đo 48 (trước 51)
  'QL /hoc-vien-lop?phamVi=chi-nhanh&branchId=1&them=1': 64,   // OV-15h2: đo 77 (= trang 71 + `chiTietCaseMo` Case đang mở + một câu tuần thi) → đo + 10; TL-NEN: đo 61 (trước 75); TL-HVL: đo 49 (trước 57)
  'QL /classes/3/overview': 43,   // PR-CT gộp LT2b: 61 → 62; TL-NEN: đo 39 (trước 55); TL-HVL: đo 33 (trước 37)
  'GVCN /classes/3/overview': 46,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 68, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)   // PR-CT gộp LT2b: 61 → 62; TL-NEN: đo 41 (trước 57); TL-HVL: đo 35 (trước 39)
  'GVBM /classes/3/overview': 46,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 68, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)   // PR-CT gộp LT2b: 61 → 62; TL-NEN: đo 41 (trước 57); TL-HVL: đo 35 (trước 39)
  'GVCN_THUONG /classes/3/overview': 46,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 68, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋)   // PR-CT gộp LT2b: 61 → 62; TL-NEN: đo 41 (trước 57); TL-HVL: đo 35 (trước 39)
  'QT /classes/3/overview': 42,   // PR-CT gộp LT2b: 58 → 59   // PR-CT gộp main (LT2a + GV + demo CT): 57 → 58   // PR-S4F #5: +3 câu quét thẻ chờ duyệt   // PR-CT: 54 → 57 (gộp main); TL-NEN: đo 38 (trước 53); TL-HVL: đo 32 (trước 36)
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
  /* SV-BAI-LOP: trần ≈ ⌈đo × 1,3⌉ + 1 (đo 22/10: bài trên lớp 15 · 12 · 15 · 15 · lịch sử 6 · 4 · 7 · 7). */
  'QL /students/1/bai-tren-lop': 20, 'QT /students/1/bai-tren-lop': 16, 'GVCN /students/1/bai-tren-lop': 20, 'GVBM /students/1/bai-tren-lop': 20,
  'QL /lich-su?loai=bai-lop&id=1': 9, 'QT /lich-su?loai=bai-lop&id=1': 6, 'GVCN /lich-su?loai=bai-lop&id=1': 10, 'GVBM /lich-su?loai=bai-lop&id=1': 10,
  'QL /classes/3/gop-y': 19, 'GVCN /classes/3/gop-y': 19, 'GVBM /classes/3/gop-y': 19, 'GVCN_THUONG /classes/3/gop-y': 19, 'QT /classes/3/gop-y': 18,
  'QL /classes/6/gop-y': 19, 'GVCN_THUONG /classes/6/gop-y': 19, 'QT /classes/6/gop-y': 18,
  'QL /classes/6/can-ho-tro': 25,
  'GVCN_THUONG /classes/6/can-ho-tro': 25,
  'QT /classes/6/can-ho-tro': 22,
  'QL /classes/3/roster': 33,   // TL-NEN: đo 28 (trước 32); TL-HVL: đo 23 (trước 27)
  'GVCN /classes/3/roster': 33,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 58, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋); TL-NEN: đo 28 (trước 32); TL-HVL: đo 23 (trước 27)
  'GVBM /classes/3/roster': 33,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 58, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋); TL-NEN: đo 28 (trước 32); TL-HVL: đo 23 (trước 27)
  'GVCN_THUONG /classes/3/roster': 33,   // PR-UXF-a VN29: +6 câu (listAttempts một lần/trang cho việc nhập điểm của GV — chỉ lớp người xem dạy): đo 58, trần min(max(đo+10, ⌈đo×1.3⌉), ⌊cũ×1.3⌋); TL-NEN: đo 28 (trước 32); TL-HVL: đo 23 (trước 27)
  'QT /classes/3/roster': 32,   // TL-NEN: đo 27 (trước 30); TL-HVL: đo 22 (trước 26)
  /* PR-TD2-b: danh sách Trước/Sau nhẹ (đo 07/10, ×3 không đổi) — trần max(đo+10, ⌈đo×1,3⌉). */
  'QL /classes/3/roster?chiId=1': 21,
  'GVCN /classes/3/roster?chiId=1': 22,
  'GVBM /classes/3/roster?chiId=1': 22,
  'GVCN_THUONG /classes/3/roster?chiId=1': 22,
  'QT /classes/3/roster?chiId=1': 20,
  'QL /hoc-vien-lop/ids': 20,
  /* OV-15f: góc Lịch thi — đo 15–16 câu; quyền sửa tính theo LỚP (không theo em: 102 câu → 16). Trần = đo + 6.
     UI-HV-LOP: + chi tiết dưới hàng (lượt sắp tới, 2 câu nhật ký, điểm, Case mở qua `listCases` — cùng nguồn "Case mở" hàng HV) → đo 23–25, trần = đo + 4. */
  'QL /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 28,
  'QT /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 28,
  'TVV /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 29,
  'CX /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 27,
  'GVCN /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 28,   // OV-15f: đo 15 → đo + 6
  'GVBM /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 28,   // OV-15f: đo 15 → đo + 6
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
  'QL /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 11,
  'GVCN /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 11,
  'GVBM /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 11,
  'GVCN_THUONG /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 11,
  'QT /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 11,
  'QL /classes/3/phan-tich-lop': 24,
  'GVCN /classes/3/phan-tich-lop': 18,   // TL-NEN: đo 8 (trước 13)
  'GVBM /classes/3/phan-tich-lop': 18,   // TL-NEN: đo 8 (trước 13)
  'GVCN_THUONG /classes/3/phan-tich-lop': 18,   // TL-NEN: đo 8 (trước 13)
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
  'QL /classes/30/diem-theo-luot/cp:1': 30, 'QT /classes/30/diem-theo-luot/cp:1': 31,   // TL-NEN: đo 20 (trước 25)
  'QL /ke-hoach-test/thuong/30': 31, 'QT /ke-hoach-test/thuong/30': 30,
  'QL /cases?classId=3': 22,
  'GVCN /cases?classId=3': 22,
  'GVBM /cases?classId=3': 22,
  'GVCN_THUONG /cases?classId=3': 22,
  'QT /cases?classId=3': 19,
  /* PR-S6F-b (UXF-a P2): roster lớp thường — id lớp {lopThuong} nay là 6 (các khoá /classes/5/… cũ không còn khớp, xem thân PR). Đo 01/10. */
  'QL /classes/6/roster': 37,   // TL-NEN: đo 30 (trước 35); TL-HVL: đo 27 (trước 30)
  'QT /classes/6/roster': 36,   // TL-HVL: đo 26 (trước 29)
  'GVCN_THUONG /classes/6/roster': 37,   // TD2-a: đo 56 → max(đo+10, ⌈đo×1,3⌉), cũ 76; TL-NEN: đo 30 (trước 35); TL-HVL: đo 27 (trước 30)
  // PR-UX1 (3), 23/09/2026 — Lịch Test gộp Cần chấm (thêm `listAttempts` cho khối Nợ tuần trước): 16 → 26 câu (QT 28),
  // vẫn ít hơn hai trang cũ cộng lại (16 + 24). Trần max(sau+10, ⌈sau×1.3⌉).
  // PR-LT3 06/10 — ba khối (khối 2 = hàng lớp tuần trước, thêm ~3 câu; mỗi tuần có ô hạn riêng thêm ~3): đo 30–34 câu (QT 34) — trong trần cũ, giữ.
  'QL /cham/lich-test': 32,   // TL-NEN: đo 22 (trước 27)
  'GVCN /cham/lich-test': 30,   // TL-NEN: đo 20 (trước 25)
  'GVBM /cham/lich-test': 31,   // TL-NEN: đo 21 (trước 26)
  'GVCN_THUONG /cham/lich-test': 30,   // TL-NEN: đo 20 (trước 25)
  'QT /cham/lich-test': 38,
  'QL /cham/lich-test?phamVi=tat-ca': 32,   // TL-NEN: đo 22 (trước 27)
  'GVCN /cham/lich-test?phamVi=tat-ca': 30,   // TL-NEN: đo 20 (trước 25)
  'GVBM /cham/lich-test?phamVi=tat-ca': 31,   // TL-NEN: đo 21 (trước 26)
  'GVCN_THUONG /cham/lich-test?phamVi=tat-ca': 30,   // TL-NEN: đo 20 (trước 25)
  'QT /cham/lich-test?phamVi=tat-ca': 38,
  'QL /cham/lich-test?classId=3': 36,
  'QT /cham/lich-test?classId=3': 35,
  'GVCN /cham/lich-test?classId=3': 36,
  'GVBM /cham/lich-test?classId=3': 36,
  // PR-VAI-b: đầu hồ sơ 30 giây (việc theo người, câu tóm tắt, bốn ô, Tạm dừng) — đo 97/94/99/99 (phiên 2, Task 9 bỏ `journeyRows`/`episodes`: 96/93/98/98) sau khi nhớ `programmeOfClass` theo request
  // và lấy tên người làm qua JOIN; giữ trần cứng 100 (luật +10/+30 % cho 107–109, vượt trần cứng).
  /* PR-Dọn (Task 9): gom câu hồ sơ HV 93–98 → 81–86 (JSON 4 vai × 3 em giống hệt) — trần hạ xuống đo + 10. */
  /* GIAM-COMPUTE: phần thẻ Case của mọi Case trên bảng kỹ năng nạp một câu mỗi loại (trước ~11 câu × số Case) — đo 67 · 67 · 69 · 67 (trước 79 · 79 · 81 · 79), trần max(đo + 10, ⌈đo × 1,3⌉). */
  'QL /students/1': 85,   // TURSO-LOG-1311: đo 65 → max(đo + 10, ⌈đo × 1,3⌉)
  'QT /students/1': 85,
  'GVCN /students/1': 88,   // TURSO-LOG-1311: đo 67
  'GVBM /students/1': 85,
  /* PR-Dọn (Task 1, Q2): ô chọn người theo một em — đo + 10. */
  'QL /ref/nguoi?nhom=giao_vien&studentId=1': 19,
  'QT /ref/nguoi?nhom=giao_vien&studentId=1': 17,
  'GVCN /ref/nguoi?nhom=giao_vien&studentId=1': 20,
  'GVBM /ref/nguoi?nhom=giao_vien&studentId=1': 20,
  /* PR-Dọn (9c): khoá lớp thường đổi /5 → /6 ({lopThuong} thật) — đo 01/10, trần max(đo + 10, ⌈đo × 1,3⌉), trần cứng 100. */
  'QL /classes/6/overview': 52,   // TD2-a: đo 72 → max(đo+10, ⌈đo×1,3⌉), cũ 97; TL-NEN: đo 49 (trước 65); TL-HVL: đo 42 (trước 46); RA-DOC-0611: đo 40 (trước 44)
  'QT /classes/6/overview': 51,   // TD2-a: đo 69 → max(đo+10, ⌈đo×1,3⌉), cũ 93; TL-NEN: đo 48 (trước 63); TL-HVL: đo 41 (trước 45); RA-DOC-0611: đo 39 (trước 43)
  'GVCN_THUONG /classes/6/overview': 54,   // TD2-a: đo 76 → max(đo+10, ⌈đo×1,3⌉), cũ 100; TL-NEN: đo 46 (trước 63); TL-HVL: đo 41 (trước 45)
  'QL /classes/6/phan-tich-lop': 24,
  'QT /classes/6/phan-tich-lop': 23,
  'GVCN_THUONG /classes/6/phan-tich-lop': 18,   // TL-NEN: đo 8 (trước 13)
  'QL /classes/6/y-thuc': 23,
  'QT /classes/6/y-thuc': 22,
  'GVCN_THUONG /classes/6/y-thuc': 23,
  'QL /classes/6/cham': 27,   // TD2-a: đo 24 → max(đo+10, ⌈đo×1,3⌉), cũ 35; TL-NEN: đo 17 (trước 22)
  'QT /classes/6/cham': 28,   // TD2-a: đo 23 → max(đo+10, ⌈đo×1,3⌉), cũ 34
  'GVCN_THUONG /classes/6/cham': 25,   // TD2-a: đo 24 → max(đo+10, ⌈đo×1,3⌉), cũ 35; TL-NEN: đo 15 (trước 20)
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
  /* GIAM-COMPUTE: đo 28 · 26 · 28 · 28 (trước 40 · 38 · 40 · 40). */
  'QL /students/1/skill-board': 38,
  'QT /students/1/skill-board': 36,
  'GVCN /students/1/skill-board': 38,
  'GVBM /students/1/skill-board': 38,
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
  'QT /notifications': 13,   // CHUONG-V2 (XM-3): bỏ đồng bộ thông báo tự động — đo 3 (trước 3 trong mốc / ~21 khi đồng bộ, QT vừa ghi) → max(3 + 10, ⌈3 × 1,3⌉)
  'QL /ke-hoach-test/lop?branchId=1': 22,   // PR-XLMT: +1 câu đếm "cần xếp lại"
  'GVCN /ke-hoach-test/lop?branchId=1': 15,   // QUYEN-LICH-MT: GV nay thấy lớp mình dạy (chỉ xem) → chạy các câu đếm theo lớp (HV, lượt, cần xếp lại, tiến độ) như QL; đo 15 / 14
  'GVBM /ke-hoach-test/lop?branchId=1': 15,   // QUYEN-LICH-MT: GV nay thấy lớp mình dạy (chỉ xem) → chạy các câu đếm theo lớp (HV, lượt, cần xếp lại, tiến độ) như QL; đo 15 / 14
  'GVCN_THUONG /ke-hoach-test/lop?branchId=1': 15,   // QUYEN-LICH-MT: như GVCN / GVBM — GV nay thấy lớp mình dạy
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
  'QL /classes/6/transition': 45,   // PR-CT gộp LT2b: 39 → 42; PR-MT0: + một câu MT0 cả lớp, đo 43; trần max(n+10, ⌈n×1,3⌉) = 56 (planning 07/10); TL-NEN: đo 34 (trước 42)
  'QT /classes/6/transition': 45,   // PR-CT gộp LT2b: 38 → 41; PR-MT0 → 42; TL-NEN: đo 34 (trước 41)
  'GVCN_THUONG /classes/6/transition': 38,   // PR-CT gộp LT2b: 39 → 42; PR-MT0 → 43; TL-NEN: đo 28 (trước 36)
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
  /* GIAM-DOC-HSGV (09/11): mọi đường hồ sơ GV — trần = min(trần cũ, max(đo + 10, ⌈đo × 1,3⌉)), đo ×1 (trước → sau): hồ sơ 45 · 40 · 40 · 42 → 30 · 27 · 27 · 28
     (một câu đầu hồ sơ, số yêu cầu đếm dòng gốc), việc 44 · 37 · 37 · 42 → 41 · 37 · 37 · 40 (thân `myWork` không đổi — chỉ bỏ kiểm quyền lặp), chỉ số 46 · 44 · 44 · 45 → 33 · 31 · 31 · 32
     (một câu ngữ cảnh, câu lượt UNION ALL, phần nạp theo lượt / em một lượt, sổ bài + việc một câu), panel chỉ số −4 câu (ngữ cảnh); `/giao-vien/9/chi-so` QL 46 → 33,
     QT 68 → 46 (gồm lượt ghi lại sổ việc chi nhánh thứ hai của GV — đường đầu tiên của lượt đo chạm chi nhánh đó). */
  'QL /giao-vien/9/chi-so': 43, 'QT /giao-vien/9/chi-so': 60,
  'QL /giao-vien/7': 40,   // TL-NEN: đo 46 (trước 59)
  'GVCN /giao-vien/7': 37,   // TL-NEN: đo 41 (trước 54)
  'GVBM /giao-vien/7': 14,
  'GVCN_THUONG /giao-vien/7': 37,   // TL-NEN: đo 41 (trước 54)
  'QT /giao-vien/7': 38,   // TL-NEN: đo 43 (trước 56)
  'QL /giao-vien/7/viec': 54,   // TL-NEN: đo 55 (trước 67)
  'GVCN /giao-vien/7/viec': 49,   // TL-NEN: đo 47 (trước 59)
  'GVBM /giao-vien/7/viec': 14,
  'GVCN_THUONG /giao-vien/7/viec': 49,   // TL-NEN: đo 47 (trước 59)
  'QT /giao-vien/7/viec': 52,   // TL-NEN: đo 53 (trước 65)
  'QL /giao-vien/7/o?cot=chua-nhap': 26,
  'GVCN /giao-vien/7/o?cot=chua-nhap': 24,
  'GVBM /giao-vien/7/o?cot=chua-nhap': 14,
  'GVCN_THUONG /giao-vien/7/o?cot=chua-nhap': 24,
  'QT /giao-vien/7/o?cot=chua-nhap': 25,
  /* 6c-2 (#632 XM-1): +1 câu điểm lượt mở Case (`diemCase`, `case_milestones` theo lô — một câu cho cả trang). GVBM không có Case trong tập nên không đổi. */
  'QL /giao-vien/7/o?cot=case-mo': 31,
  'GVCN /giao-vien/7/o?cot=case-mo': 29,
  'GVBM /giao-vien/7/o?cot=case-mo': 14,
  'GVCN_THUONG /giao-vien/7/o?cot=case-mo': 29,
  'QT /giao-vien/7/o?cot=case-mo': 28,   // OV-13a (B): +1 câu MT cuối của lộ trình (chữ mốc "đến MT{n}") khi danh sách có PA "đến lúc thi" — một câu cho cả trang
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
  'QL /phan-tich/giao-vien?cn=1&ct=ft': 100,   // DOC-PT: đo 38 (trước 43) — Case có PA không dựng chi tiết, HV cần chú ý chỉ em lớp đang dạy
  'QT /phan-tich/giao-vien?cn=1&ct=ft': 100,   // DOC-PT: đo 37 (trước 42)
  'GVCN /phan-tich/giao-vien?cn=1&ct=ft': 14,   // 403, đo 9
  'QL /phan-tich/giao-vien?cn=1&ct=thuong&thang=2026-09': 90,   // DOC-PT: đo 28 (trước 32)
  'QT /phan-tich/giao-vien?cn=1&ct=thuong&thang=2026-09': 89,   // DOC-PT: đo 27 (trước 31)
  /* DEM-QUA-HAN b: ô Chấm Test đúng hạn → panel số chung (thay panel Chấm điểm riêng, đo 24) — max(đo + 10, ⌈đo × 1,3⌉), đo 13 · 13. */
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=cham-diem': 23, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=cham-diem': 23,
  // OV-15e (19/10): Báo cáo · Kết quả thi · panel chỉ số GV — max(đo + 10, ⌈đo × 1,3⌉)
  'QL /phan-tich/bao-cao?ct=ft': 60,   // TL-TQ: đo 46 (trước 53)
  'QL /phan-tich/bao-cao/ket-qua-mt?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20': 23,   // TL-TQ: đo 13 (trước 15) · SV-SO3: đo 18
  'QT /phan-tich/bao-cao/ket-qua-mt?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20': 24,   // TL-TQ: đo 14 (trước 16) · SV-SO3: đo 19
  'GVCN /phan-tich/bao-cao/ket-qua-mt?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20': 14,   // SV-SO3: đo 4 (403)
  'QL /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=kq-mt:mt2:dat': 24,   // TL-TQ: đo 14 (trước 16) · SV-SO3: đo 19
  'QT /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=kq-mt:mt2:dat': 25,   // TL-TQ: đo 15 (trước 17) · SV-SO3: đo 20
  'GVCN /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=kq-mt:mt2:dat': 14,   // SV-SO3: đo 4 (403)
  'QT /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-target-thi': 27, 'CX /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-target-thi': 27, 'QL /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-target-thi': 25,   // O-TQ-BAM: panel Đạt Target thi thật (chỉ khi bấm) — max(đo + 10, ⌈đo × 1,3⌉), đo 17 · 17 · 15
  'QT /phan-tich/bao-cao?ct=ft': 59,   // TL-TQ: đo 45 (trước 50)
  'GVCN /phan-tich/bao-cao?ct=ft': 14,   // đo 4
  /* QUET-THEO-KY Q3: Báo cáo HV một GET (trước: /tong-quan/v5 + /phan-tich/bao-cao = QL ft 65 + 65 câu, QT 60 + 61). max(đo+10, ⌈đo×1,3⌉), cắt ở trần cứng 100. */
  'QL /tong-quan/v5?ct=ft&kemBaoCao=1': 68,   // DOC-PT: đo 52 (trước 58)
  /* Phân tích V2 · Chi nhánh (`baoCao=chi-nhanh`): đo seed QL FT 31 · LT 16 · QT FT 55 câu (Tiến bộ theo từng chi nhánh) — trần max(đo + 10, ⌈đo × 1,3⌉). */
  'QL /tong-quan/v5?ct=ft&baoCao=chi-nhanh&kieu=tuan&tu=2026-08-31&den=2026-09-27': 41, 'QT /tong-quan/v5?ct=ft&baoCao=chi-nhanh&kieu=tuan&tu=2026-08-31&den=2026-09-27': 72,
  'GVCN /tong-quan/v5?ct=ft&baoCao=chi-nhanh&kieu=tuan&tu=2026-08-31&den=2026-09-27': 14,
  'QL /tong-quan/v5?ct=thuong&baoCao=chi-nhanh&kieu=tuan&tu=2026-08-31&den=2026-09-27': 26,
  'QT /tong-quan/v5?ct=ft&kemBaoCao=1': 63,   // TL-TQ: đo 48 (trước 66)
  'GVCN /tong-quan/v5?ct=ft&kemBaoCao=1': 14,   // 403, đo 4
  'QL /tong-quan/v5?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20&kemBaoCao=1': 52,   // DOC-PT: đo 40 (trước 45)
  'QT /tong-quan/v5?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20&kemBaoCao=1': 45,   // TL-TQ: đo 34 (trước 42)
  'QL /phan-tich/bao-cao?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20': 46,   // TL-TQ: đo 35 (trước 38)
  'QT /phan-tich/bao-cao?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20': 45,   // TL-TQ: đo 34 (trước 35)
  'QL /phan-tich/bao-cao/o?ct=ft&o=bai-qua-han': 30,   // TL-TQ: đo 20 (trước 24)
  'QT /phan-tich/bao-cao/o?ct=ft&o=bai-qua-han': 30,   // TL-TQ: đo 20 (trước 23)
  'QL /phan-tich/ket-qua-thi?loai=mock&xep=sos&kieu=tuan&tu=2026-07-06&den=2026-09-20': 34,   // đo 24
  'QT /phan-tich/ket-qua-thi?loai=mock&xep=sos&kieu=tuan&tu=2026-07-06&den=2026-09-20': 34,   // đo 24
  'GVCN /phan-tich/ket-qua-thi?loai=mock&xep=sos&kieu=tuan&tu=2026-07-06&den=2026-09-20': 14,   // đo 4
  'QL /phan-tich/ket-qua-thi?loai=thi-that&kieu=tuan&tu=2026-07-06&den=2026-09-20': 15,   // đo 5
  'QT /phan-tich/ket-qua-thi?loai=thi-that&kieu=tuan&tu=2026-07-06&den=2026-09-20': 15,   // đo 5
  /* PR-4 THI-THAT: tab Thi thật (danh sách + thống kê; Theo GV +1 câu phân công, ghi danh nhớ chung với lớp lúc thi) · panel ô — trần = max(đo+10, ⌈đo×1,3⌉), đo 05/11. */
  'QL /phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20': 16, 'QT /phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20': 17, 'TVV /phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20': 18, 'CX /phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20': 17,   // đo 6 · 7 · 8 · 7
  'QL /phan-tich/thi-that/o?o=kn:w:fail&kieu=tuan&tu=2026-07-06&den=2026-09-20': 16, 'QT /phan-tich/thi-that/o?o=kn:w:fail&kieu=tuan&tu=2026-07-06&den=2026-09-20': 16,   // đo 6 · 6
  'QL /phan-tich/thi-that/o?o=gv:{gv}:w1:hv&kieu=tuan&tu=2026-07-06&den=2026-09-20': 16, 'QT /phan-tich/thi-that/o?o=gv:{gv}:w1:hv&kieu=tuan&tu=2026-07-06&den=2026-09-20': 17,   // đo 6 · 7
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=ghi-pa': 29,   // đo 19
  'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=ghi-pa': 27,   // đo 17
  /* V8-PT-2: panel thẻ chỉ số (chỉ khi MỞ, gồm ~4 câu đăng nhập) — max(đo+10, ⌈đo×1,3⌉). */
  'QL /phan-tich/ket-qua-thi/o?loai=mock&o=dat&kieu=tuan&tu=2026-07-06&den=2026-09-20': 17,   // đo 7
  'QT /phan-tich/ket-qua-thi/o?loai=mock&o=dat&kieu=tuan&tu=2026-07-06&den=2026-09-20': 17,   // đo 7
  'QL /phan-tich/ket-qua-thi/o?loai=thi-that&o=luot&kieu=tuan&tu=2026-07-06&den=2026-09-20': 16,   // đo 6
  'QT /phan-tich/ket-qua-thi/o?loai=thi-that&o=luot&kieu=tuan&tu=2026-07-06&den=2026-09-20': 16,   // đo 6
  'QL /phan-tich/hieu-qua-pa/o?dong=tong&cot=pa': 25,   // đo 15
  'QT /phan-tich/hieu-qua-pa/o?dong=tong&cot=pa': 25,   // đo 15
  'QL /phan-tich/y-thuc/o?dong=tong&cot=lop': 22,   // đo 12
  'QT /phan-tich/y-thuc/o?dong=tong&cot=lop': 22,   // đo 12
  'QL /tong-quan/v5?ct=ft': 46,   // DOC-PT: đo 35 (trước 40)
  'QT /tong-quan/v5?ct=ft': 47,   // TL-TQ: đo 36 (trước 49)
  'QL /tong-quan/v5?ct=thuong': 35,   // DOC-PT: đo 25 (trước 29)
  'QT /tong-quan/v5?ct=thuong': 33,   // TL-TQ: đo 23 (trước 31)
  'QT /tong-quan/v5?ct=ft&branchId={cn}': 45,   // DOC-PT: đo 34 (trước 39)
  'CX /tong-quan/v5?ct=ft': 46,   // TL-TQ: đo 35 (trước 48)
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
  /* OV6-DOC-CHON (14/11): trước `/students?q=ng` 712–1 722 dòng, `/classes` 308–709 dòng; nay đo 14–17 · 23 / 33 dòng → max(đo + 50, ⌈đo × 1,3⌉). */
  'QL /students?q=ng&gioiHan=6&gon=1': 64, 'QT /students?q=ng&gioiHan=6&gon=1': 64, 'GVCN /students?q=ng&gioiHan=6&gon=1': 67,
  'GVBM /students?q=ng&gioiHan=6&gon=1': 64, 'GVCN_THUONG /students?q=ng&gioiHan=6&gon=1': 67, 'QL /classes?gon=1': 73, 'QT /classes?gon=1': 83,
  /* TL-GV: hộp Tuần dạy một em — đo 11 dòng (lộ trình · ghi danh · lớp · phân công) → đo + 50. */
  'QL /cycles/{loTrinhThi}/tuan-day': 61,
  /* CAU-HINH-CASE-SOS (11/11): bản đang dùng (≤ 3 dòng) + ≤ 30 dòng nhật ký + nhóm đếm theo mã (≈ 40 mã) trên nền phiên (≈ 51 như mo-sua-lich-test). */
  'QT /admin/cau-hinh-case-sos': 160, 'QL /admin/cau-hinh-case-sos': 160,
  /* Y-THUC-V2 (11/11): tab Ý thức lớp / HV — Báo PH theo LẦN + Nội dung trong câu phụ sẵn có; đo trước = sau (340 · 336 · 53 dòng ×1) → max(đo + 50, ⌈đo × 1,3⌉). */
  'QL /classes/3/y-thuc': 442, 'GVCN /classes/3/y-thuc': 437, 'GVBM /classes/3/y-thuc': 437, 'QL /students/1/y-thuc': 103, 'GVCN /students/1/y-thuc': 103,
  /* SỔ NGHĨA VỤ (PR-2): đo 333 · 49 · 58 dòng → max(đo + 50, ⌈đo × 1,3⌉). */
  'QT /phan-tich/giao-vien?ct=ft': 433, 'QT /phan-tich/giao-vien/o?ct=ft&gv={gv}&cot=viec-dung-han': 99, 'QL /phan-tich/giao-vien/o?cn={cn}&ct=ft&gv=0&cot=cham-diem': 108,
  'QL /phan-tich/giao-vien?cn={cn}&ct=ft&v2=1': 1000, 'QT /phan-tich/giao-vien?ct=ft&v2=1': 1100,   // PT-V2 Giáo viên: đo 719 · 834 (QT tổng trước #1414: 1271)
  /* O-TQ-BAM: panel Đạt Target thi thật (chỉ khi bấm) — max(đo + 50, ⌈đo × 1,3⌉), đo 07/11 kỳ 6 tháng: 1 259 · 1 259 · 691. */
  'QT /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-target-thi': 1637, 'CX /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-target-thi': 1637, 'QL /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-target-thi': 899,
  /* GIAM-DOC-TQGV: Tổng quan GV — max(đo + 50, ⌈đo × 1,3⌉), đo 07/11 ×1 (GVCN 1 839, GVBM 2 101; hai vai đều có lớp chủ nhiệm nên số không đổi — GV không chủ nhiệm khoá ở prSvTqGv). */
  'GVCN /tong-quan/lop-toi-day/hai-khoi': 2391, 'GVBM /tong-quan/lop-toi-day/hai-khoi': 2732, 'GVCN_THUONG /tong-quan/lop-toi-day/hai-khoi': 2391,
  /* GIAM-DOC-0711a: napCaseMo tập cha theo chi nhánh (QL "Tất cả", lọc chi nhánh, Phân tích GV / hồ sơ GV — DEM-QUA-HAN) — trần dòng mới = max(đo + 50, ⌈đo × 1,3⌉), đo 07/11 ×1. */
  'QL /my-work?nguoi=7': 848, 'QL /my-work?nguoi=tat-ca&branchId=1': 1226, 'QT /my-work?nguoi=tat-ca&branchId=1': 1233,   /* GIAM-DOC-1011 (12b): phân công nhớ theo tiến trình — đo 652 · 943 · 948 (trước 818 · 1 109 · 1 114) */
  /* GIAM-DOC-HSGV: đường hồ sơ GV = min(trần cũ, max(đo + 50, ⌈đo × 1,3⌉)), đo 09/11 ×1 — chỉ số 1 267–1 885, việc 651–652, `/giao-vien/9/chi-so` QL 1 332 · QT 1 431
     (SỔ NGHĨA VỤ PR-2 đo QL 2 385 khi lượt ghi lại sổ việc MB rơi vào đường này; nay lượt đo chạm sổ MB ở đường trước đó). */
  'QL /giao-vien/7/viec': 848, 'QT /giao-vien/7/viec': 847, 'QL /giao-vien/9/chi-so': 1732, 'QT /giao-vien/9/chi-so': 1861, 'QL /giao-vien/7/chi-so': 1648, 'GVCN /giao-vien/7/chi-so': 1657, 'GVCN_THUONG /giao-vien/7/chi-so': 1657, 'QT /giao-vien/7/chi-so': 1658, 'QL /giao-vien/7/chi-so?tu=2026-03-02&den=2026-09-14': 2441, 'GVCN /giao-vien/7/chi-so?tu=2026-03-02&den=2026-09-14': 2450, 'GVCN_THUONG /giao-vien/7/chi-so?tu=2026-03-02&den=2026-09-14': 2450, 'QT /giao-vien/7/chi-so?tu=2026-03-02&den=2026-09-14': 2451,
  /* DEM-QUA-HAN b: panel Chấm Test đúng hạn (số chung) — ⌈đo × 1,3⌉, đo 285 · 285. */
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=cham-diem': 371, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=cham-diem': 371,
  /* DEM-QUA-HAN: Phân tích GV + panel Việc đúng hạn — trần = ⌈đo × 1,3⌉, đo bảng FT 2 349 · 2 347, thường 2 168 · 2 166, khoảng dài 2 702 · 2 700, panel 1 192 · 1 190. */
  /* GIAM-DOC-0611: đường GET mới đo — max(đo + 50, ⌈đo × 1,3⌉), đo 06/11 ×1; `/classes/3/phoi-hop-sos` GIAM-DOC-0611d: đo 205 (trước 217). */
  'ADMIN /tong-quan/gv-tre': 597, 'GVBM /classes/3/phoi-hop-sos': 267, 'GVBM /ref/periods': 78, 'GVBM /students/1/phoi-hop-sos': 55, 'GVBM /students/1/s-expert': 56, 'GVCN /cham/lich-test/qua-han': 410, 'GVCN /classes/3/phoi-hop-sos': 267, 'GVCN /classes/3/y-thuc/lo': 275, 'GVCN /cycles/3/suggested-mocks': 98, 'GVCN /hoc-vien-lop/lich-thi/3/lich-su': 57, 'GVCN /ref/periods': 78, 'GVCN /students/1/phoi-hop-sos': 55, 'GVCN /students/1/s-expert': 56, 'GVCN_THUONG /classes/3/phoi-hop-sos': 267, 'GVCN_THUONG /ref/periods': 78, 'GVCN_THUONG /students/1/phoi-hop-sos': 55, 'GVCN_THUONG /students/1/s-expert': 56, 'QL /bao-cao-ph/lop?branchId=1': 51, 'QL /cham/lich-test/qua-han': 409, 'QL /classes/3/phoi-hop-sos': 267, 'QL /classes/3/teachers': 69, 'QL /classes/3/y-thuc/lo': 275, 'QL /cycles/3/suggested-mocks': 95, 'QL /hoc-vien-lop/lich-thi/3/lich-su': 54, 'QL /ref/periods': 78, 'QL /students/1/phoi-hop-sos': 55, 'QL /students/1/s-expert': 53, 'QL /tong-quan/gv-tre?gv=7': 497, 'QT /admin/mo-sua-lich-test': 51, 'QT /bao-cao-ph/lop?branchId=1': 51, 'QT /classes/3/phoi-hop-sos': 267, 'QT /classes/3/teachers': 69, 'QT /ref/periods': 78, 'QT /students/1/phoi-hop-sos': 53, 'QT /students/1/s-expert': 51, 'QT /tong-quan/gv-tre?gv=7': 757,
  /* BAO-CAO-PH b: Excel một lớp — max(đo + 50, ⌈đo × 1,3⌉), đo 06/11 139 dòng (chưa có bản ghi; đủ bản ghi + 198). */
  'QL /classes/3/bao-cao-ph/xuat': 189, 'QT /classes/3/bao-cao-ph/xuat': 189, 'ADMIN /classes/3/bao-cao-ph/xuat': 189, 'GVCN /classes/3/bao-cao-ph/xuat': 51,
  /* BAO-CAO-PH: trần = max(đo + 50, ⌈đo × 1,3⌉), đo 06/11 (MB FT 101 33 em, chưa có bản ghi): tab 38 · panel 52; FOU 12 (7 em): 15 · 11. Bản ghi đầy đủ: + em × phần (tab) / + 2 × em (panel). */
  'QL /classes/3/bao-cao-ph': 88, 'GVCN /classes/3/bao-cao-ph': 88, 'GVBM /classes/3/bao-cao-ph': 88, 'GVCN_THUONG /classes/3/bao-cao-ph': 88, 'QT /classes/3/bao-cao-ph': 88, 'ADMIN /classes/3/bao-cao-ph': 88,
  'QL /classes/3/bao-cao-ph/phan?phan=listening': 102, 'GVCN /classes/3/bao-cao-ph/phan?phan=listening': 102, 'GVBM /classes/3/bao-cao-ph/phan?phan=listening': 102, 'GVCN_THUONG /classes/3/bao-cao-ph/phan?phan=listening': 102, 'QT /classes/3/bao-cao-ph/phan?phan=listening': 102,
  'QL /classes/6/bao-cao-ph': 65, 'QL /classes/6/bao-cao-ph/phan?phan=writing': 61, 'QT /classes/6/bao-cao-ph': 65, 'QT /classes/6/bao-cao-ph/phan?phan=writing': 61, 'GVCN_THUONG /classes/6/bao-cao-ph': 65, 'GVCN_THUONG /classes/6/bao-cao-ph/phan?phan=writing': 61,
  /* DOC-PT (05/11): Phân tích GV — trước chưa có trần dòng (đo 2 219 · 2 167 · 1 972 · 1 920 · 2 572 · 2 520). */
  'QL /phan-tich/giao-vien?cn=1&ct=ft': 2699, 'QT /phan-tich/giao-vien?cn=1&ct=ft': 2697,   // đo 1554 · 1502
  'QL /phan-tich/giao-vien?cn=1&ct=thuong&thang=2026-09': 2463, 'QT /phan-tich/giao-vien?cn=1&ct=thuong&thang=2026-09': 2460,   // đo 1328 · 1276
  'QL /phan-tich/giao-vien?cn=1&ct=ft&tu=2026-03-02&den=2026-09-14': 3166, 'QT /phan-tich/giao-vien?cn=1&ct=ft&tu=2026-03-02&den=2026-09-14': 3163,   // đo 1907 · 1855
  'QL /phan-tich/y-thuc/o?dong=tong&cot=vi-pham': 663, 'QT /phan-tich/y-thuc/o?dong=tong&cot=vi-pham': 1000, 'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=viec-dung-han': 1190, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=viec-dung-han': 1187,   // PT-VP-PA: đo 510 · 769 · 352 · 300 — max(đo + 50, ⌈đo × 1,3⌉)
  /* PR-4 THI-THAT: tab + panel thi thật — trần = max(đo+50, ⌈đo×1,3⌉), đo 05/11 (bộ demo ít thi thật: QL 12 · QT / CX 22 · TVV 14 dòng). Ước bản chính 2 tháng ~1 000 dòng (ghi chú v13 mục 4). */
  /* Phân tích V2 · Thi thật: + "Chưa có KQ" hiện tại (em FT trong phạm vi → giai đoạn sau thi, `sauThiTheoEm`) — QL đo 283 dòng (trước ~48). */
  'QL /phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20': 62, 'QT /phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20': 72, 'CX /phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20': 72, 'TVV /phan-tich/thi-that?kieu=tuan&tu=2026-07-06&den=2026-09-20': 64,   // PTA rà #1410: Chưa có KQ một câu (chỉ mục chờ KQ) — đo 12 · 23 · 23 · 14 (trước 232 · 329 · 329 · 26); trần về mức trước V2
  'QL /phan-tich/thi-that/o?o=gv:{gv}:w1:hv&kieu=tuan&tu=2026-07-06&den=2026-09-20': 62, 'QT /phan-tich/thi-that/o?o=gv:{gv}:w1:hv&kieu=tuan&tu=2026-07-06&den=2026-09-20': 72,
  'QL /phan-tich/tong-hop/o?ct=thuong&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot': 914, 'QT /phan-tich/tong-hop/o?ct=thuong&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot': 1349, 'QL /phan-tich/giao-vien/o?cn=1&ct=thuong&gv=7&tu=2026-03-02&den=2026-09-14&cot=ket-qua': 688, 'QT /phan-tich/giao-vien/o?cn=1&ct=thuong&gv=7&tu=2026-03-02&den=2026-09-14&cot=ket-qua': 688,   // PT-LOP-THUONG: đo 703 · 1 037 · 529 · 529 — max(đo + 50, ⌈đo × 1,3⌉)
  /* PT-PANEL (PR-1, 05/11): panel bảng có điểm — max(đo + 50, ⌈đo × 1,3⌉); phần thêm (lượt theo id + điểm) ≈ +4 dòng so panel cũ (đo dat-mt 911 → 915). */
  'QL /phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=kn:listening': 1085, 'QT /phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=kn:listening': 1893,
  'QL /phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot': 1161, 'QT /phan-tich/tong-hop/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-14&khoa=tong&cot=luot': 2104,
  'QL /phan-tich/bao-cao/o?ct=ft&branchId=1&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=tien-bo:writing1:tang': 2075, 'QT /phan-tich/bao-cao/o?ct=ft&branchId=1&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=tien-bo:writing1:tang': 2075,
  'QL /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-mt': 1566, 'QT /phan-tich/bao-cao/o?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20&o=dat-mt': 2885,
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&tu=2026-03-02&den=2026-09-14&cot=tien-bo': 1091, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&tu=2026-03-02&den=2026-09-14&cot=tien-bo': 1091,
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&tu=2026-03-02&den=2026-09-14&cot=dat-mt': 894, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&tu=2026-03-02&den=2026-09-14&cot=dat-mt': 894,
  'QL /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=hv-chu-y': 879, 'QT /phan-tich/giao-vien/o?cn=1&ct=ft&gv=7&cot=hv-chu-y': 879,   // DOC-PT: đo 676 (trước 1289)
  'QL /giao-vien/7/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14': 1186, 'GVCN /giao-vien/7/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14': 1183, 'GVCN_THUONG /giao-vien/7/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14': 1183, 'QT /giao-vien/7/chi-so/o?cot=tien-bo&tu=2026-06-22&den=2026-09-14': 1185,
  'QL /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 360,   // V8-HSL-2: đo 276 (một đợt)
  'GVCN /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 360,
  'GVBM /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 360,
  'GVCN_THUONG /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 360,
  'QT /classes/3/issue-board/o?category=overall&cot=overall&kind=mt1': 360,
  /* LOP-1-LOP: hồ sơ lớp chỉ đọc lượt của lớp (`myWork({ classIds })`) — đo QL / QT 1 278 (trước 1 448), GVCN / GVCN_THUONG 854 (trước 935), GVBM 850 (trước 958);
     badge quá hạn nay trong cùng đường (trước thêm `/my-work` QL 1 414 · GV 921–944 dòng). Trần = max(đo + 50, ⌈đo × 1,3⌉). */
  'QL /classes/3/viec-theo-em?chi=toi': 1304, 'QT /classes/3/viec-theo-em?chi=toi': 1304,   // TL-NEN: đo 1155 · 1155 (trước 1245 · 1245); TL-VIEC: đo 1003 · 1003 (trước 1155 · 1155)
  'GVCN /classes/3/viec-theo-em?chi=toi': 930, 'GVBM /classes/3/viec-theo-em?chi=toi': 920, 'GVCN_THUONG /classes/3/viec-theo-em?chi=toi': 930,   // TL-NEN: đo 731 (trước 821); TL-VIEC: đo 759 · 745 · 759 (trước 731 · 727 · 731 — nạp mọi phân công đổi lấy −13 câu; ×3 giảm 1601 → 1537)   // RA-DOC-0611b: đo 715 · 707 · 715 (trước 779 · 765 · 779)
  /* CHUONG-V2 (XM-3): không đồng bộ, không đọc thông báo tự động cũ — trần = max(đo+50, ⌈đo×1,3⌉), đo 12/11 QL 19 · GVCN 39 · GVBM 10 · GVCN_THUONG 39 · QT 18 (trước 25 · 45 · 14 · 45 · 26; QT đồng bộ khi vừa ghi ~241). */
  'QL /notifications': 69, 'GVCN /notifications': 89, 'GVBM /notifications': 60, 'GVCN_THUONG /notifications': 89, 'QT /notifications': 68,
  /* QUET-THEO-KY Q3: Báo cáo HV một GET — trần = max(đo+50, ⌈đo×1,3⌉), đo 30/10 (trước hai GET: QL ft 2 629 + 2 443, QT 3 419 + 3 310 dòng). */
  /* Phân tích V2 · Chi nhánh: đo seed QL FT 1 376 · LT 749 · QT FT 1 984 dòng (trước kemBaoCao 2 901 + Kết quả MT 353). */
  'QL /tong-quan/v5?ct=ft&baoCao=chi-nhanh&kieu=tuan&tu=2026-08-31&den=2026-09-27': 1789, 'QT /tong-quan/v5?ct=ft&baoCao=chi-nhanh&kieu=tuan&tu=2026-08-31&den=2026-09-27': 2580,
  'QL /tong-quan/v5?ct=thuong&baoCao=chi-nhanh&kieu=tuan&tu=2026-08-31&den=2026-09-27': 974,
  'QL /tong-quan/v5?ct=ft&kemBaoCao=1': 3507, 'QT /tong-quan/v5?ct=ft&kemBaoCao=1': 4586,   // TL-TQ: đo 2979 (trước 3216) · 3527 (trước 3970)   // DOC-PT: QL đo 2697 (trước 2979)
  'QL /tong-quan/v5?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20&kemBaoCao=1': 3104, 'QT /tong-quan/v5?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20&kemBaoCao=1': 4094,   // đo 2 673 · 3 149   // DOC-PT: QL đo 2387 (trước 2613)
  /* SUA-NHO-QUYEN: Quản trị › Tài khoản — trần = max(đo+50, ⌈đo×1,3⌉), đo 30/10 (163 dòng). */
  'QT /admin/accounts': 213,
  'QL /metrics/hv-sos-hien-tai?rows=1': 1440,   // PANEL-MC: đo 1107
  'QT /metrics/hv-sos-hien-tai?rows=1': 2092,   // PANEL-MC: đo 1609
  'QL /metrics/hv-duoi-ky-vong-mon?rows=1&skill=reading': 1412,   // PANEL-MC: đo 1086
  'QT /metrics/hv-duoi-ky-vong-mon?rows=1&skill=reading': 2062,   // PANEL-MC: đo 1586
  'QL /yeu-cau?hop=cho-duyet&boiCanh=1': 468,   // PANEL-MC: đo 360 (thẻ + lượt / lịch / điểm em các thẻ + đếm nhật ký trong câu thẻ)
  'QT /yeu-cau?hop=cho-duyet&boiCanh=1': 470,   // PANEL-MC: đo 361
  'QL /lich-su?loai=yeu-cau&id={ycPa}': 88,   // PANEL-MC: đo 38 (≤ 50 dòng nhật ký + phạm vi)
  'QT /lich-su?loai=yeu-cau&id={ycPa}': 54,   // PANEL-MC: đo 4
  /* PR-B: phiếu bàn giao đổi GV 33 em (tự điền sống: kết quả, Case, Ý thức theo lô) — đo 30/10 QL 661 · QT 627 · GVCN 661 · GVBM 627 → max(đo + 50, ⌈đo × 1,3⌉). */
  'QL /ban-giao-gv/1': 860, 'QT /ban-giao-gv/1': 816, 'GVCN /ban-giao-gv/1': 860, 'GVBM /ban-giao-gv/1': 816,
  'QL /lenh-chuyen/{lenhBg}/ban-giao': 60, 'QT /lenh-chuyen/{lenhBg}/ban-giao': 60,   // BAN-GIAO-NHAN 05/11: đo 27 dòng, nhân dữ liệu vẫn 27
  /* PC-GV-A: góc Phân công GV — trần = max(đo+50, ⌈đo×1,3⌉), đo 30/10 (235 dòng: lớp + phân công + ứng viên chi nhánh). */
  'QL /hoc-vien-lop/phan-cong?branchId=1': 306, 'QT /hoc-vien-lop/phan-cong?branchId=1': 306, 'CX /hoc-vien-lop/phan-cong?branchId=1': 306,
  /* HSL-MAY-CHU: trần = max(đo+50, ⌈đo×1,3⌉), đo 27/10 (100 · 64 · 100 dòng). */
  'QL /regular/attempts/24': 150, 'QT /regular/attempts/24': 114, 'GVCN_THUONG /regular/attempts/24': 150,
  /* OV-15g: Lịch sử thay đổi — trần = max(đo+50, ⌈đo×1,3⌉), đo 20/10 (hv 4 · 2 · 9 · lop 33 · 34 · 34 · 34 · 3 · gop-y 32 · 33 · 33 · 33 · 2 · nhap-hv 62 · 32 dòng). */
  'QL /lich-su?loai=hv&id=1': 54, 'QT /lich-su?loai=hv&id=1': 52, 'GVCN /lich-su?loai=hv&id=1': 59, 'QL /lich-su?loai=lop&id=3': 83, 'GVCN /lich-su?loai=lop&id=3': 84, 'GVBM /lich-su?loai=lop&id=3': 84, 'GVCN_THUONG /lich-su?loai=lop&id=3': 84, 'QT /lich-su?loai=lop&id=3': 53, 'QL /lich-su?loai=gop-y&id=3': 82, 'GVCN /lich-su?loai=gop-y&id=3': 83, 'GVBM /lich-su?loai=gop-y&id=3': 83, 'GVCN_THUONG /lich-su?loai=gop-y&id=3': 83, 'QT /lich-su?loai=gop-y&id=3': 52, 'QL /lich-su?loai=nhap-hv&id=3': 112, 'QT /lich-su?loai=nhap-hv&id=3': 82,
  /* OV-15i1: trần = max(đo+50, ⌈đo×1,3⌉), đo 20/10 (thi-that 5 · 3 · 10 · phan-cong 33 · 34 · 34 · 34 · 3 · o 36 · 4 · 37 · 37 dòng). nhap-hv đo 62 → 82 · 32 → 52:
     +1 câu kiểm em của trang còn hay đã xoá (20 em) — vẫn dưới trần 112 / 82. */
  'QL /lich-su?loai=thi-that&id=3': 55, 'QT /lich-su?loai=thi-that&id=3': 53, 'GVCN /lich-su?loai=thi-that&id=3': 60,
  'QL /lich-su?loai=phan-cong&id=3': 83, 'GVCN /lich-su?loai=phan-cong&id=3': 84, 'GVBM /lich-su?loai=phan-cong&id=3': 84, 'GVCN_THUONG /lich-su?loai=phan-cong&id=3': 84, 'QT /lich-su?loai=phan-cong&id=3': 53,
  'QL /lich-su?loai=o&id=5': 86, 'QT /lich-su?loai=o&id=5': 54, 'GVCN /lich-su?loai=o&id=5': 87, 'GVBM /lich-su?loai=o&id=5': 87,
  /* TU-b: trang Tutor — trần = max(đo+50, ⌈đo×1,3⌉), đo 20/10. */
  'QL /tutors': 65, 'QT /tutors': 66, 'QL /tutors/1': 58, 'QT /tutors/1': 59, 'QT /tutors/dem': 51, 'QT /tutors/go-tay': 52,   // đo 15 · 16 · 8 · 9 · 1 · 2
  'QL /hoc-vien-lop/lich-thi?thang=2026-10,2026-11': 1154,   // OV-15f: đo 593 (FT + lớp thường; ×3 → 1 659); trần = max(đo + 50, ⌈đo × 1,3⌉). UI-HV-LOP: + chi tiết dưới hàng (lượt sắp tới, nhật ký, điểm, Case mở qua `listCases`) đo 1 104 (×3 → 2 936) → đo + 50
  /* LICH-THI-UI (dải mở hàng bản 3): + 3 cột thi thật trên cùng hàng lộ trình (không thêm dòng), + so MT trước (`luotTheoLoTrinh` 1 câu + `diemCuaLuot` lượt trước, nhớ theo lượt) + đếm PA theo Case (1 câu theo lô);
     đo 20 câu / 946 dòng (×3 → 2 704) — dưới trần cũ, giữ nguyên trần. */
  'QL /hoc-vien-lop?phamVi=chi-nhanh&branchId=1&them=1': 3469,   // OV-15h2: đo 2816 (×3 → 7094; trang không them ~2545) → max(đo + 50, ⌈đo × 1,3⌉); TL-HVL: đo 2668 (trước 3023)
  /* TU-a: ô chọn tutor — trần = max(đo+50, ⌈đo×1,3⌉), đo 20/10 (13 · 11 · 17 · 17 · 44 · 12 · 45 dòng). */
  'QL /tutors/chon?studentId=1': 63, 'QT /tutors/chon?studentId=1': 61, 'GVCN /tutors/chon?studentId=1': 67, 'GVBM /tutors/chon?studentId=1': 67,
  'QL /tutors/chon?paId=7': 94, 'QT /tutors/chon?paId=7': 62, 'GVCN /tutors/chon?paId=7': 95,
  'QL /my-work?nguoi=tat-ca&branchId={cn}': 1420, 'QT /my-work?nguoi=tat-ca&branchId={cn}': 1427,   // DOC-THUA: đo QL 1092 · QT 1097 (trước 1093 · 1098 — seed chỉ 1 dòng Báo PH ở chi nhánh khác; DB thật bớt mọi dòng Báo PH chờ của chi nhánh khác)
  'ADMIN /my-work': 584,   // RA-DOC-0611: đo 449 (việc Xuất báo cáo PH: ghi danh lớp có đợt ~100) → max(đo + 50, ⌈đo × 1,3⌉)
  'QL /my-work': 1360,   // TD4: đo 849 (trước 2155); V5 SV-SO1: đo 1193 (trước 1104) — ô có band thiếu nhận xét bắt buộc (seed: 327 ô) là việc thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 1089 (trước 1147)
  'GVCN /my-work': 1026,   // TD4: đo 822 (trước 1784)   // V5 SV-SO1 sau gộp main: đo 1139 (trần cũ 1069) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 830 (trước 888)   // RA-DOC-0611b: đo 789 (trước 852) — Case mở tập cha theo lớp
  'GVBM /my-work': 1038,   // TD4: đo 847 (trước 2016)   // V5 SV-SO1 sau gộp main: đo 1194 (trần cũ 1102) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 853 (trước 911); TL-VIEC: đo 834 (trước 853)   // RA-DOC-0611b: đo 798 (trước 855)
  'GVCN_THUONG /my-work': 1026,   // TD4: đo 822 (trước 1784)   // V5 SV-SO1 sau gộp main: đo 1139 (trần cũ 1069) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 830 (trước 888)   // RA-DOC-0611b: đo 789 (trước 852)
  'QT /my-work': 1624,   // TD4: đo 971 (trước 2889); V5 SV-SO1: đo 1741 (trước 1263) — ô có band thiếu nhận xét bắt buộc (seed: 327 ô) là việc thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 1271 (trước 1329); TL-VIEC: đo 1249 (trước 1271)
  'QL /my-work?nguoi=tat-ca': 1538,   // TD4: đo 1119 (trước 2793); V5 SV-SO1: đo 1494 (trước 1455) — ô có band thiếu nhận xét bắt buộc (seed: 327 ô) là việc thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 1446 (trước 1504); TL-VIEC: đo 1183 (trước 1446)
  'QT /my-work?nguoi=tat-ca': 1750,   // TD4: đo 1254 (trước 3688); V5 SV-SO1: đo 2062 (trước 1631) — ô có band thiếu nhận xét bắt buộc (seed: 327 ô) là việc thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 1655 (trước 1713); TL-VIEC: đo 1346 (trước 1655)
  'QL /classes/3/roster': 1931,   // đo 1712; TL-HVL: đo 1485 (trước 1734)
  'GVCN /classes/3/roster': 1931,   // đo 1882; TL-NEN: đo 1735 (trước 1778); TL-HVL: đo 1485 (trước 1734)
  'GVBM /classes/3/roster': 1931,   // đo 1894; TL-HVL: đo 1485 (trước 1734)
  'GVCN_THUONG /classes/3/roster': 1931,   // đo 1882; TL-HVL: đo 1485 (trước 1734)
  'QT /classes/3/roster': 1905,   // đo 1656; TL-HVL: đo 1465 (trước 1714)
  'QL /cham/lich-test': 1079,   // TD7c: đo 575 (trước TD7c 720; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 830 (trần cũ 748) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'GVCN /cham/lich-test': 835,   // TD7c: đo 445 (trước TD7c 561; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 642 (trần cũ 579) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'GVBM /cham/lich-test': 922,   // TD7c: đo 485 (trước TD7c 614; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 709 (trần cũ 631) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'GVCN_THUONG /cham/lich-test': 835,   // TD7c: đo 445 (trước TD7c 561; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 642 (trần cũ 579) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'QT /cham/lich-test': 2095,   // TD7c: đo 661 (trước TD7c 868; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // SEED-UX: 893 — BC FT 205 MT2 dời W1 SEP (K3) + lớp HD mới; trước 860   // V5 SV-SO1 sau gộp main: đo 1611 (trần cũ 900) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'QL /cham/lich-test?phamVi=tat-ca': 1079,   // TD7c: đo 575 (trước TD7c 720; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 830 (trần cũ 748) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'GVCN /cham/lich-test?phamVi=tat-ca': 835,   // TD7c: đo 445 (trước TD7c 561; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 642 (trần cũ 579) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'GVBM /cham/lich-test?phamVi=tat-ca': 922,   // TD7c: đo 485 (trước TD7c 614; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 709 (trần cũ 631) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'GVCN_THUONG /cham/lich-test?phamVi=tat-ca': 835,   // TD7c: đo 445 (trước TD7c 561; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 642 (trần cũ 579) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'QT /cham/lich-test?phamVi=tat-ca': 2095,   // TD7c: đo 661 (trước TD7c 868; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // SEED-UX: 893 — BC FT 205 MT2 dời W1 SEP (K3) + lớp HD mới; trước 860   // V5 SV-SO1 sau gộp main: đo 1611 (trần cũ 900) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'QL /cham/lich-test?classId=3': 909,   // TD7c: đo 502 (trước TD7c 559; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 699 (trần cũ 653) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'QT /cham/lich-test?classId=3': 961,   // TD7c: đo 521 (trước TD7c 578; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 739 (trần cũ 678) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'GVCN /cham/lich-test?classId=3': 812,   // TD7c: đo 427 (trước TD7c 484; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 624 (trần cũ 556) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'GVBM /cham/lich-test?classId=3': 847,   // TD7c: đo 454 (trước TD7c 511; khối 1 chỉ nạp lượt có ô thi trước tuần trước)   // V5 SV-SO1 sau gộp main: đo 651 (trần cũ 591) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  /* OV-15h1: trần = max(đo + 50, ⌈đo × 1,3⌉), đo demo 20/10 (QL 1 914 · 1 862 · 483; QT 2 393 · 2 322 · 583). */
  'QL /tong-quan/ql?ct=ft': 2489, 'QL /tong-quan/ql?ct=thuong': 2421, 'QT /tong-quan/ql?ct=ft': 4402, 'QT /tong-quan/ql?ct=thuong': 4073,   // V5 SV-SO1 sau gộp main: đo 3386 (trần cũ 3111) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ   // V5 SV-SO1 sau gộp main: đo 3133 (trần cũ 3019) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ
  'QL /tong-quan/chi-nhanh': 3336,   // đo 2566
  'QT /tong-quan/chi-nhanh': 4397,   // đo 3382
  'GVCN /tong-quan/lop-toi-day?ct=ft': 1827,   // đo 2079 · DOC-IT-3: đo 1405 (Case của GV lọc theo lớp trong SQL) → ⌈đo × 1,3⌉
  'GVBM /tong-quan/lop-toi-day?ct=ft': 2073,   // đo 2353 · DOC-IT-3: đo 1594
  'GVCN_THUONG /tong-quan/lop-toi-day?ct=ft': 1827,   // đo 2079 · DOC-IT-3: đo 1405
  'QL /metrics/hv-duoi-ky-vong-mon': 2093,   // đo 1610
  'QT /metrics/hv-duoi-ky-vong-mon': 3040,   // đo 2338
  'QL /hoc-vien-lop?kem=sos': 4604,   // TURSO-1211: đo 3541 (riêng: 2636 + 1864 = 4500) → max(đo + 50, ⌈đo × 1,3⌉)
  'QL /hoc-vien-lop': 3374,   // TD3-b: đo 2627 (68 câu); TL-HVL: đo 2595 (trước 2648)
  /* DOC-IT-4: lọc phạm vi trong SQL — đo 23 · 11 · 18 · 11 · 33 (trước 33 mọi vai) → ⌈đo × 1,3⌉. */
  'QL /ref/classes': 30, 'GVCN /ref/classes': 15, 'GVBM /ref/classes': 24, 'GVCN_THUONG /ref/classes': 15, 'QT /ref/classes': 43, 'QL /ref/classes?branchId={cn}': 30,
  'GVCN /hoc-vien-lop': 2519,   // TD3-b: đo 2001 (72 câu); TL-HVL: đo 1965 (trước 1991); DOC-IT-3: đo 1937
  'GVBM /hoc-vien-lop': 2929,   // TD3-b: đo 2288 (72 câu); TL-HVL: đo 2253 (trước 2295)
  'GVCN_THUONG /hoc-vien-lop': 2555,   // TD3-b: đo 2001 (72 câu); TL-HVL: đo 1965 (trước 1991)
  'QT /hoc-vien-lop': 3305,   // TD3-b: đo 2542 (67 câu); TL-HVL: đo 2549 (trước 2602)
  'QL /classes/3/overview': 883,   // TD3-b: đo 886 (56 câu)   // V5 SV-SO1 sau gộp main: đo 1234 (trần cũ 1152) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 713 (trước 808); TL-HVL: đo 679 (trước 711)
  'GVCN /classes/3/overview': 918,   // TD3-b: đo 931 (60 câu)   // V5 SV-SO1 sau gộp main: đo 1288 (trần cũ 1211) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 743 (trước 838); TL-HVL: đo 706 (trước 741)
  'GVBM /classes/3/overview': 918,   // TD3-b: đo 929 (60 câu)   // V5 SV-SO1 sau gộp main: đo 1286 (trần cũ 1208) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ; TL-HVL: đo 706 (trước 739)
  'GVCN_THUONG /classes/3/overview': 918,   // TD3-b: đo 931 (60 câu)   // V5 SV-SO1 sau gộp main: đo 1288 (trần cũ 1211) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ; TL-HVL: đo 706 (trước 741)
  'QT /classes/3/overview': 857,   // TD3-b: đo 827 (53 câu)   // V5 SV-SO1 sau gộp main: đo 1182 (trần cũ 1076) — ô có band thiếu nhận xét bắt buộc (seed 385 ô) là việc / bài chờ thật → đọc thêm lượt còn ô chờ; TL-NEN: đo 693 (trước 754); TL-HVL: đo 659 (trước 691)
  'QL /classes/6/overview': 283,   // TD3-b: đo 616 (68 câu); TL-HVL: đo 221 (trước 230); RA-DOC-0611: đo 217
  'QT /classes/6/overview': 279,   // TD3-b: đo 581 (65 câu); TL-HVL: đo 218 (trước 227); RA-DOC-0611: đo 214
  'GVCN_THUONG /classes/6/overview': 296,   // TD3-b: đo 630 (72 câu); TL-HVL: đo 229 (trước 241); RA-DOC-0611: đo 227
  'QL /tong-quan/v5?ct=ft': 2951,   // DOC-PT: đo 2270 (trước 2449)
  'QT /tong-quan/v5?ct=ft': 4199,   // TL-TQ: đo 3230 (trước 3381)
  'GVCN /my-work?nguoi=tat-ca': 51,   // TL-NEN: đo 1 (trước 3)
  'QL /tong-quan/v5?ct=thuong': 2520,   // DOC-PT: đo 1938 (trước 2061)
  'QT /tong-quan/v5?ct=thuong': 3479,   // TL-TQ: đo 2676 (trước 2659)
  'QT /tong-quan/v5?ct=ft&branchId={cn}': 2884,   // DOC-PT: đo 2218 (trước 2397)
  'CX /tong-quan/v5?ct=ft': 4098,   // TL-TQ: đo 3152 (trước 3303)
  'QL /tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong': 2728,   // TL-TQ: đo 2098 (trước 2076)
  'QT /tong-quan/chi-nhanh/o?cot=caseMo&khoa=tong': 3711,   // TL-TQ: đo 2854 (trước 2832)
  'QL /phan-tich/bao-cao?ct=ft': 2927,   // TL-TQ: đo 2251 (trước 2367)
  'QT /phan-tich/bao-cao?ct=ft': 4054,   // TL-TQ: đo 3118 (trước 3273)
  'QL /phan-tich/bao-cao?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20': 2719,   // TL-TQ: đo 2091 (trước 2102)
  'QT /phan-tich/bao-cao?ct=thuong&kieu=tuan&tu=2026-07-06&den=2026-09-20': 3707,   // TL-TQ: đo 2851 (trước 2856)
  'QL /phan-tich/bao-cao/o?ct=ft&o=bai-qua-han': 995,   // TL-TQ: đo 765 (trước 787)
  'QT /phan-tich/bao-cao/o?ct=ft&o=bai-qua-han': 1386,   // TL-TQ: đo 1066 (trước 1088)
  'QL /phan-tich/bao-cao/o?ct=ft&o=dat-mt': 1185,   // TL-TQ: đo 911 (trước 1023)
  'QT /phan-tich/bao-cao/o?ct=ft&o=dat-mt': 1885,   // TL-TQ: đo 1450 (trước 1605)
  'QL /phan-tich/bao-cao/o?ct=ft&o=thi-thang-nay': 936,   // TL-TQ: đo 720 (trước 742)
  'QT /phan-tich/bao-cao/o?ct=ft&o=thi-thang-nay': 1297,   // TL-TQ: đo 997 (trước 1019)
  'QL /phan-tich/bao-cao?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20': 3241,   // TL-TQ: đo 2493 (trước 2612)
  'QT /phan-tich/bao-cao?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20': 4956,   // TL-TQ: đo 3812 (trước 4003)
  'QL /phan-tich/bao-cao/ket-qua-mt?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20': 877,   // TL-TQ: đo 674 (trước 692)
  'QT /phan-tich/bao-cao/ket-qua-mt?ct=ft&kieu=tuan&tu=2026-03-02&den=2026-09-20': 1603,   // TL-TQ: đo 1233 (trước 1261)
};

export const TRAN_GHI_LO = {
  /** #8 (bản rà 11/11): POST /students/:id/transfer tuần = hôm nay (FT → FT) — ra lệnh + thi hành ngay + ghi_dao 21 bảng của MỘT em (thao tác hiếm). */
  chuyenNgay: 201,   // đo 154 câu, 471 dòng (không chụp: xem CLSS-6) → max(154 + 10, ⌈154 × 1,3⌉)
  /** #8: POST /students/:id/hoan-tac-chuyen-ngay — daoLai một bản ghi + nhật ký. */
  hoanTacChuyenNgay: 37,   // đo 27 câu, 19 dòng → max(27 + 10, ⌈27 × 1,3⌉)
  /** LO-TRINH-THEO-HV: POST /cycles/:id/lo-trinh (LT1 → RF, 3 MT: 1 có điểm giữ, 1 dời, 1 huỷ) — quyền, ghi_dao các bảng của MỘT lộ trình, lõi lịch MT, mốc Case, Hành trình, nhật ký. */
  doiLoTrinh: 93,   // đo 71 câu, 148 dòng (thao tác ghi hiếm: ghi_dao 6 bảng + lõi lịch MT từng lượt) → max(71 + 10, ⌈71 × 1,3⌉)
  /** [XM-C1] TVV-TUAN-BD: PATCH /cycles/:id { startWeek } của TVV chi nhánh em — cùng đường QL (kiểm tuần, ghi, lõi lịch MT, Hành trình, nhật ký) + kiểm quyền `duocDoiMon`; đo trong prOv8b OV8b-TUAN. */
  doiTuanBatDau: 35,   // đo 25 câu, 31 dòng (QL cùng đường 23 câu, 29 dòng) → max(25 + 10, ⌈25 × 1,3⌉)
  /** [XM-C1]: POST /classes/:id/sua-ca-lop { rows: [1 em, startWeek] } của TVV — kiểm lô + `updateCycle` + nhật ký lô; đo trong prOv13i OV13i-4. */
  doiTuanCaLop1Em: 58,   // đo 44 câu, 57 dòng (QL cùng lô 40 câu, 53 dòng) → max(44 + 10, ⌈44 × 1,3⌉)
  /** LO-TRINH-THEO-HV: POST /cycles/:id/lo-trinh/hoan-tac — daoLai một bản ghi + nhật ký. */
  hoanTacDoiLoTrinh: 31,   // đo 21 câu, 14 dòng → max(21 + 10, ⌈21 × 1,3⌉)
  /** PC-GV-A: POST /phan-cong/luu 8 lớp (trần một lần lưu) mỗi lớp một ô + 1 Case + 1 PA chuyển, hôm nay — lõi chung (kiểm + ghi_dao + áp + chuyển + nhật ký); đo trong prPhanCongGv. */
  luuPhanCong8Lop: 166,   // LUU-PC-LO: đo 127 câu (trước gom theo lô: 241, ~30 / lớp; nay ~16 / lớp, phần còn lại chủ yếu là câu GHI mỗi lớp) → max(127 + 10, ⌈127 × 1,3⌉)
  /** PC-GV-A: POST /phan-cong/hoan-tac cả lô 8 lớp trên (daoLai đọc / xoá theo lô, bỏ dòng không đổi). */
  hoanTacPhanCong8Lop: 62,   // đo 47 câu (trước 68) → max(47 + 10, ⌈47 × 1,3⌉)
  /** TU-b: POST /tutors/tai-len lưu 50 dòng (40 mới + 10 cập nhật) — đọc tutors + chi nhánh một lần, ghi gom một câu upsert, một nhật ký. */
  taiLenTutor: 24,   // đo 14 câu, 11 dòng → max(14 + 10, ⌈14 × 1,3⌉)
  /** OV-15f: PUT /hoc-vien-lop/lich-thi/:cycleId (kết luận + ghi chú: quyền, đọc / ghi 5 cột lich_thi_*, nhật ký) */
  luuLichThi: 24,   // đo 14 câu, 11 dòng → max(14 + 10, ⌈14 × 1,3⌉)
  /** OV-15f: POST /hoc-vien-lop/xuat mẫu "Theo dõi SOS" cả lớp MB FT 101 (quyền theo lớp, dangSos, Case của các em trong tệp). */
  xuatDanhSachSos: 140,   // đo 107 câu, 4 653 dòng (99 em: quyền theo lớp, dangSos, Case của các em trong tệp) → max(107 + 10, ⌈107 × 1,3⌉)
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
  /** SOS-TAM-PA: POST /interventions/:id/giu-pa-gv — kiểm (trước + trong giao dịch) + thẻ `giu_pa_gv` + PA quy chế trỏ PA GV + nhật ký, trả Case. */
  giuPaGv: 145,   // đo 111 câu (~40 là `caseDetail` trả về) → max(111 + 10, ⌈111 × 1,3⌉)
  deXuatDoiPa: 123,   // đo 94 câu (~40 là `caseDetail` trả về) → max(94 + 10, ⌈94 × 1,3⌉)
  /** OV-13b: POST /followups/:id/hoan-tac — đảo lần ghi kết quả vừa lưu (như Sửa đảo) + rút đề xuất cùng lần, trả Case. */
  /** OV-13k: PUT /attempts/:id/scores/speaking/phu-trach — nhận xét GV phụ trách + nhóm ô S, nhật ký, đồng bộ nguyên nhân Case MT. */
  nhanXetPhuTrach: 22,   // đo 12 câu → max(12 + 10, ⌈12 × 1,3⌉)
  hoanTacKetQua: 99,   // đo 76 câu → max(76 + 10, ⌈76 × 1,3⌉)
  /** VIEC-SAU-LOGIC: DELETE /followups/:id — xoá MỘT kết quả PA (gần nhất: PA về trước lần ghi) vào Thùng rác + nhật ký; không trả Case. */
  xoaKetQuaPa: 45,   // đo 34 câu (kiểm quyền + thẻ chờ trong giao dịch) → max(34 + 10, ⌈34 × 1,3⌉)
  /** SV-BAI-LOP-2: POST /interventions/:id/hoan-tac-them — gỡ PA vừa thêm (như Xoá PA) + nhật ký, trả Case. */
  hoanTacThemPa: 106,   // đo 81 câu (~40 là `caseDetail` trả về) → max(81 + 10, ⌈81 × 1,3⌉)
  /** HOAN-TAC-XN: POST /interventions/:id/hoan-tac-xac-nhan · /cases/:id/hoan-tac-xac-nhan · /cases/:id/hoan-tac-xac-nhan-s — trả nguyên trạng trước xác nhận + nhật ký, trả Case. */
  hoanTacXacNhanPa: 110,   // đo 84 câu (~40 là `caseDetail` trả về) → max(84 + 10, ⌈84 × 1,3⌉)
  hoanTacXacNhanCase: 114,   // đo 87 câu (~40 là `caseDetail` trả về) → max(87 + 10, ⌈87 × 1,3⌉)
  hoanTacXacNhanCaseS: 103,   // đo 79 câu (~40 là `caseDetail` trả về) → max(79 + 10, ⌈79 × 1,3⌉)
  /** RKC-2b ③: POST /interventions/:id/result lần đầu trên PA quy chế chờ = Xác nhận PA + ghi KQ (một giao dịch) · PATCH /cases/:id trên Case chưa xác nhận = Xác nhận Case. */
  ghiKqXacNhanNgam: 153,   // đo 117 câu (riêng hai bước 194) → max(117 + 10, ⌈117 × 1,3⌉)
  suaCaseXacNhan: 132,   // đo 101 câu → max(101 + 10, ⌈101 × 1,3⌉)
  /** BO-QUA-XEP-MT: POST /my-work/bo-qua — đọc lại MỘT PA (câu `moc:` + id), kiểm quyền, ghi 3 cột + nhật ký trong một giao dịch. */
  boQuaViec: 20,   // trần đặt trước khi đo — sửa theo số đo
  /** NHAP-KQ-PA: PUT /interventions/:id/nhap — đọc PA + Case (quyền), một UPDATE, một nhật ký; không trả Case. */
  luuNhapKetQua: 18,   // đo 8 câu → max(8 + 10, ⌈8 × 1,3⌉)
  /** HAN-BAO-PH (UI-1): POST /y-thuc/bao-ph/:id/han — đọc việc + quyền + Tạm dừng, so-và-đổi `han_chon`, lịch sử, nhật ký, trả `xemViecBaoPh`. */
  suaHanBaoPh: 22,   // đo 12 câu → max(12 + 10, ⌈12 × 1,3⌉)
  /** HAN-BAO-PH (UI-1): POST /phoi-hop-sos/:id/han — meeting CX, như trên (trả một việc phối hợp). */
  suaHanPhoiHop: 22,   // đo 12 câu → max(12 + 10, ⌈12 × 1,3⌉)
  /** POST /notifications/doc-het — một câu UPDATE (S6F-a 10e) + phiên/quyền. PR-Dọn (9d): trần đặt sau khi đo. */
  docHet: 19,   // đo 9 câu → max(9 + 10, ⌈9 × 1,3⌉)
  /** DON-LUONG K42a (rà sâu #742): GET /notifications của người ~500 thông báo (trang đầu đầy) — câu + dòng trả về; dòng quét của lượt 2 in kèm (chỉ loại Cần làm đã đọc cũ hơn trang). */
  chuong500: 19, chuong500Dong: 103,   // đo 30/10: 9 câu, 53 dòng trả về (lượt 2 quét ~18 dòng thay vì cả 500) → max(đo + 10, ⌈đo × 1,3⌉) câu, max(đo + 50, ⌈đo × 1,3⌉) dòng
  /** POST /intake/commit — 35 em lớp FT (lịch MT mặc định, có em "Đã thi tới MT", ngày thi, tuần riêng). Trước PR-TOC 1949, sau 44 (49 sau gộp PR-MON + rà #121: đọc chương trình lớp, đọc lại khoá trong giao dịch). */
  themHocVien35FT: 70,   // SỔ NGHĨA VỤ (09/11): +≤ 12 câu — ghi sổ MỘT lô trước COMMIT (không theo số em); đo 61
  /** POST /classes/:id/transition — cả lớp thường (≥ 20 em) sang FT, mỗi em có lịch MT mặc định. Trước PR-TOC 1505, sau 124 → 128 sau rà #121 (32 em, gồm đóng Case mở của em có sẵn — S17). */
  /** POST /classes/:id/transition RA LỆNH cho cả lớp thường (≥ 20 em) — PR-CT (Q30-1) chỉ ghi lệnh theo lô, không chuyển. Trần đặt sau khi đo (Task 3). */
  /** OV-3b: PUT /classes/:id/lo-trinh-nhap — nháp cả lớp thường theo lô (em · lệnh · lớp đích · một câu ghi + nhật ký), không theo số em. */
  luuNhapCaLop: 40,
  raLenhCaLop: 76,   // SỔ NGHĨA VỤ (09/11): +12 — một lô ghi sổ trước COMMIT, đo 68. OV-3b: + tiến độ lớp nguồn (tuần Final → hạn bàn giao `hanBanGiaoLenh`) + xoá nháp cùng tx — đo 61, CỐ ĐỊNH (không theo số em), trần đo + 3. PR-CT2 (§8): + 1 câu đọc bài Final ĐỦ điểm / có Mini Test của lô (dongBoCheTaiFinal — không em nào thì dừng sau câu đó) — đo 52, trần đo + 3. Trước đó: đo 20 câu (41 em) → max(20+10, ⌈20×1.3⌉) = 30; PR-LCa: + đồng bộ Lộ trình tiếp theo (đọc LTT + khoá, ghi LTT/Hành trình/nhật ký, tạo MT0 Lên FT theo lô) — đo 27 → 49, +22 câu CỐ ĐỊNH (LC-i: không theo số em); PR-LCa (T3): chỉ đọc khoá khi có Lên FT chưa ghi Target → đo 48, trần đo + 3
  /** PR-CT2 (§8): ra lệnh Lên cả lớp thường 10 em đã đủ điểm Final → sinh bổ trợ sớm theo lô (Case · PA · Mini Test · chuông · Hành trình). */
  raLenhSinhBoTro: 64,   // OV-3b: + 9 câu cố định (tiến độ lớp nguồn + xoá nháp) → đo 61, trần đo + 3. Trước: đo 51 (10 em có Case Giữa khoá nhận PA — `dongBoTrangThaiCaseLo` theo lô; từng Case: 59), trần đo + 3
  /** PR-CT2 (§8): đổi lệnh 10 em Lên → Học lại → huỷ bổ trợ chưa ai đụng THEO LÔ (đóng Case, huỷ PA, xoá Mini Test / chuông / Hành trình). */
  doiLenhHuyBoTro: 68,   // OV-3b: + 13 câu cố định (tiến độ lớp nguồn + xoá nháp + phiếu làm lại khi đổi hướng) → đo 65, trần đo + 3. Trước: đo 52 (10 em có Case Giữa khoá giữ, chỉ huỷ PA + mốc — đồng bộ trạng thái theo lô; từng Case: 70), trần đo + 3
  chuyenCaLopSangFT: 295,   // SỔ NGHĨA VỤ (chủ SP 10/11): +8 câu CỐ ĐỊNH — đặt lại hạn việc tuyến Case của Case đổi chủ theo lớp mới (một lần cho lô: đọc Case + PA + 3 câu việc mở + UPDATE theo cột + INSERT nhật ký) → đo 293. DON-LUONG K8: +18 câu GHI (không đọc thêm — kiểm "còn dạy" nằm trong câu `ganChuCaseThieu`) — 6 Case có chủ ở lớp thường mà lớp FT đích không có GV đó → đổi chủ theo lớp mới (UPDATE + lịch sử + chuông mỗi Case) → đo 283; P8 MON-DANG-KY: +1 câu CỐ ĐỊNH — lượt MT mặc định vừa tạo theo môn đăng ký (`apMonChoLuotMoi`, một UPDATE cho cả lô) → đo 265; CV-LOI: +1 câu CỐ ĐỊNH — gán chủ Case chưa có người phụ trách của cả lô theo lớp mới (`ganChuCaseThieu`, một SELECT; 0 Case thì không ghi) → đo 264; PR-TK: +21 câu CỐ ĐỊNH (không theo số em) cho `ghiBanChup` — bản chụp lộ trình đóng, ghi theo lô một lần mỗi lý do → đo 253 → 263; PR-LUI-b: +1 câu mỗi em có Case đóng (chụp PA để Hoàn tác Kết thúc học mở lại đúng) → đo 225 → 232; PR-LT2b (4, 5): đọc Final Test cả lớp + Case/PA bổ trợ theo lô sau chuyển (đo 214; gốc 200, +7 %) → 224; PR-HVL (10): bộ demo H2 thêm 2 em vào MB FOU 12 (một em có 2 Case đóng theo S17, một em có bài Final Test 4 điểm) → đo 191; trần theo dữ liệu, không phải chậm đi của đường
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
  /** PHEP-DO-LO: huỷ `LO_HANG_LOAT_EM` (8) quyết định chuyển lớp một lần (`huyNhieuLenh`, lô web gửi), cuộn lại sau đo. */
  huyNhieuLenh8: 127,   // đo 97 câu, 58 dòng (1 lệnh 14 câu — ~12 / lệnh, mỗi lệnh một giao dịch) → max(97 + 10, ⌈97 × 1,3⌉)
  /** PHEP-DO-LO: `ganChuCaseThieu` cho mọi em có Case mở (tối đa 500) nhiều lớp, mọi Case mở chưa chủ (`suggestCaseOwner`), cuộn lại sau đo. */
  ganChuCase500Em: 786,   // ×3: 174 em có Case mở (≤ 500), 19 lớp, 291 Case → đo 604 câu, 399 dòng (trước gom phân công theo lớp: 874 câu, 1 864 dòng; còn lại 2 câu GHI / Case) → max(604 + 10, ⌈604 × 1,3⌉)
  luuSuaCaLopMotLo: 119,   // một lô 8 em đổi họ tên: đo 91 câu → ⌈91×1,3⌉ = 119 (30 em một lần cũ: 289 câu, 7–14 s trên Turso). ponytail: lô cố định 8 em theo số em, không theo số câu — em đổi nhiều ô (tuần bắt đầu dời MT, Target) nặng hơn ~3 lần; lưới chặn cuối: dừng trước 10 s mỗi dòng (503, lô đó cuộn lại); chia lô theo ước lượng câu nếu hay gặp 503
};

/**
 * PR-S6F-b (D14): TẢI TRANG ĐẦU — các GET trang Tổng quan gọi khi mở (ghi từ log mạng trình duyệt 01/10, màn đầu 1440, ngày demo 14/09; StrictMode
 * ở dev gọi đôi `/demo/session` — không tính; CHUONG-V2: `/notifications` chỉ tải khi mở chuông, không còn trong lượt mở trang). MỖI đường một lần (`useApi` gộp GET đang bay): trước PR GV gọi `/my-work` ×2 + `/my-work/dem`
 * (= ba lần `myWork`), QL gọi `/tong-quan/quan-ly` ×2. Trần = TỔNG câu SQL của cả lượt tải.
 */
/* ponytail: danh sách viết tay, phép quét (prDonA 9e) bắt route mới; chuyển sang hằng dùng chung với web khi Tổng quan ổn định. */
export const TAI_TRANG: Record<string, { vai: Vai; urls: string[]; tran: number }> = {
  'GV trang Tổng quan': {
    vai: 'GVCN', tran: 140,   // CHUONG-V2: bỏ /notifications khỏi lượt mở trang — đo 107 → max(107 + 10, ⌈107 × 1,3⌉) ·   // RA-DOC-0611: đo 116 (trước 128) → max(116 + 10, ⌈116 × 1,3⌉) · đo 157 (trước PR ≈ 157 + 2 × 66 = 289) · SV-TQ-GV: đo 208 — `/hai-khoi` đọc CẢ hai khung (Lớp thường +36 câu) thay `?ct=ft` · S1: đo 193 (bỏ `/chi-so` tính lại, + ô Case) → max(193 + 10, ⌈193 × 1,3⌉)
    urls: ['/demo/session', '/my-work', '/tong-quan/lop-toi-day/hai-khoi', '/yeu-cau/dem', '/giao-vien/{gv}/o?cot=case-mo'],   // UI-TONG-QUAN: + chỉ số GV · SV-TQ-GV: hai khối thay Lớp tôi dạy · S1: chỉ số GV theo `/hai-khoi` (bỏ GET `/giao-vien/{gv}/chi-so`), thêm ô Case đang xử lý (gọi lúc mở, trước sót)
  },
  /* OV-10c: Tổng quan TVV ("Học viên của tôi"), CX ("Số liệu"), Admin ("Mock Test") — đo bằng chính vai đó. */
  'TVV trang Tổng quan': {
    vai: 'TVV', tran: 43,   // CHUONG-V2: bỏ /notifications khỏi lượt mở trang — đo 33 → max(33 + 10, ⌈33 × 1,3⌉) ·   // RA-DOC-0611: đo 77 (trước 79) → max(77 + 10, ⌈77 × 1,3⌉) · UI-TONG-QUAN: + /tong-quan/tvv + /my-work (n việc của tôi) — đo 143 → max(143 + 10, ⌈143 × 1,3⌉)
    urls: ['/demo/session', '/tong-quan/hoc-vien', '/tong-quan/tvv', '/my-work'],   // UI-TONG-QUAN: 3 nhóm TVV
  },
  'QL trang Tổng quan': {
    vai: 'QL', tran: 107,   // TURSO-1211: thẻ Giáo viên `v2=1` — đo 82 (trước 108) → max(82 + 10, ⌈82 × 1,3⌉) · CHUONG-V2: bỏ /notifications khỏi lượt mở trang — đo 108 → max(108 + 10, ⌈108 × 1,3⌉) ·   // PR-Dọn (9e): đủ 15 GET lúc mở trang → đo 346 câu (trước chỉ 6 GET, đo 126) — max(346 + 10, ⌈346 × 1,3⌉)
    /* PR-Dọn (9e): đủ MỌI GET lúc mở trang (phép quét `prDonA.tests.ts` 9e bắt route mới). OV-15d (Tổng quan QL A): bỏ sáu ô số + Điểm đáng chú ý;
       thêm bảng GV (Trễ chấm). Thẻ "Chờ duyệt" (`/yeu-cau?hop=cho-duyet`) chỉ tải khi có thẻ. */
    /* OV-15h1: GET dữ liệu 4 → 2 — Lớp cần chú ý + Tuần này + Trễ chấm thành một `/tong-quan/ql`; Cần bạn quyết giữ `/tong-quan/quan-ly` (gộp khung). */
    /* UI-TONG-QUAN: Tổng quan V5 — một `/tong-quan/v5` (chỉ số + Lớp cần chú ý + Trễ chấm) · Chờ bạn duyệt dòng gọn · GV cần chú ý (bảng Phân tích GV). */
    urls: ['/demo/session', '/ref/branches', '/yeu-cau/dem', '/tong-quan/v5?ct=ft', '/yeu-cau?hop=cho-duyet&branchId={cn}', '/phan-tich/giao-vien?cn={cn}&ct=ft&v2=1'],   // TURSO-1211: thẻ Giáo viên đọc v2
  },
  'CX trang Tổng quan': {
    vai: 'CX', tran: 80,   // CHUONG-V2: bỏ /notifications khỏi lượt mở trang — đo 61 → max(61 + 10, ⌈61 × 1,3⌉) ·   // RA-DOC-0611: đo 109 (trước 111) → max(109 + 10, ⌈109 × 1,3⌉)
    urls: ['/demo/session', '/ref/branches', '/tong-quan/hoc-vien', '/tong-quan/v5?ct=ft'],   // UI-TONG-QUAN: một GET
  },
  'Admin trang Tổng quan': {
    vai: 'ADMIN', tran: 60,   // CHUONG-V2: bỏ /notifications khỏi lượt mở trang — đo 46 → max(46 + 10, ⌈46 × 1,3⌉) ·
    urls: ['/demo/session', '/ref/branches', '/tong-quan/mock-test', '/highlights'],
  },
};
