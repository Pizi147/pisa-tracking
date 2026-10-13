# Rà soát cuối trước PR-EN (OV-11) — 13–14/10/2026

Session planning 13/10 tối (chủ SP vắng, giao planning tự quyết). Căn cứ mã: `main` = `1b06b42` (#365, đã gồm hết OV).
Cách rà: web chạy local (bản build main, dữ liệu demo 14/09/2026), mỗi khu một DB + cổng riêng; Playwright Chromium; đọc mã.
- **Rà chức năng** 7 khu × 9 vai (QT, QL, QL CP, GVCN, GVBM, GV Writing, Admin, TVV, CX), 1440 tối + 375 sáng, thao tác ghi thật trên DB riêng, gọi API thẳng để thử quyền.
- **impeccable**: `audit` (detector tĩnh + detector trong trang đã đăng nhập, 42 lượt) + `critique` (Assessment A độc lập, 3 vùng).
- Báo cáo gốc từng khu (bước tái hiện, file:dòng, ảnh): thư mục `2026-10-14-ra-soat/` cạnh file này. Planning đã tự đọc mã xác nhận các mục **chặn**.

## 1. Kết quả tóm tắt
| | Chặn | Lỗi | Thừa | Gợi ý |
|---|---|---|---|---|
| Chức năng (7 khu, ~120 mục) | 7 | ~55 | ~12 | ~45 |
| impeccable `audit` | — | P1 ×3 · P2 ×7 · P3 ×11 | | |

- `audit` **14/20 (Good)**: A11y 3 · Hiệu năng 3 · Theming 3 · Responsive 2 · Nhất quán 3 (đạt). Không màu viết cứng, không chữ < 11 px, focus tốt.
- `critique` (heuristic /40): Khung + Tổng quan + Phân tích + Quản trị **27** · Học viên & Lớp + hồ sơ **27** · Test + Công việc **26**. Chung một bệnh:
  **cùng một trạng thái / số liệu mỗi nơi một tên, một cách tính** (H4 Nhất quán = 2 ở cả ba vùng).
- Không trang nào trắng / 500. Quyền máy chủ đúng ở hầu hết chỗ (TVV/CX/Admin gọi thẳng → 403). Lỗi tập trung ở **luồng vắng sau OV-1b**, **số đếm theo người**, **việc đã xong vẫn báo**.

## 2. Lỗi chặn — sửa trước deploy (planning đã đọc mã xác nhận)
| Mã | Thấy | Gốc | PR |
|---|---|---|---|
| TE-1 | Bài thi bù (dời vì vắng) bị khoá "Đợt đã hoàn tất" — GV đúng kỹ năng không nhập được, chỉ QL | `fasttrack/hoanTat.ts:64-69` coi "-" tuần cũ là xong | OV-11a |
| TE-2 | Tuần thi bù: hộp không có nút Vắng, gõ "-" bị nuốt → không ghi được vắng lần 2 | `HopNhapDiem.tsx:147,182,340` | OV-11a |
| CV-5 | Panel Nhập điểm (Công việc) tự đổi chip kỹ năng sau mỗi lần Lưu → **điểm vào sai kỹ năng** | `MotKyNang.tsx:52-56` + `mywork.ts:451` | OV-11a |
| QT-2 | Quản trị tự gỡ vai Quản trị của mình (kể cả người cuối) → không ai vào Quản trị được | `platform/accounts.ts:329` `setRoles` | OV-11b |
| QT-4 | "Không duyệt" nhầm không có đường lui; cấp vai báo "Đã lưu" mà vẫn 403 | `accounts.ts:213`, `auth.ts:64` | OV-11b |
| HV-10 | GVCN cho em Tạm dừng → mất mọi quyền với em (không Quay lại học, không Ý thức) | `permissions.ts:193` chỉ ghi danh `active` | OV-11d |
| PT-4 | Huỷ lượt MT → có người mở trang → Khôi phục: thẻ Chờ duyệt mất hẳn (không nguyên trạng) | `ketQuaHuy.ts:113` không cất yêu cầu duyệt | OV-11e |
| OV-1e | PR #366 (rà sâu đạt, check xanh): migrate chạy lại ở **deploy 2** → ô "giữ lịch thi lại" đã qua tuần mà còn trống thành "Không dự thi" (mất nợ chấm). Deploy 1 không bị | `prOv1b.ts` điều kiện theo ngày | OV-11e (merge #366 như hiện có) |

## 3. Quyết định của planning (tự quyết 14/10 — chủ SP đổi được, xem "Câu hỏi chưa chắc" ở báo cáo)
| # | Việc | Chọn | Lý do |
|---|---|---|---|
| Q1 | TE-6: lớp thường gõ "-" sau tuần thi (nhập bù) đang dời môn vào **tuần đã qua** (nợ ảo) | Dời sang **tuần sau tính từ tuần hiện tại** (giữ luật lớp thường "vắng = thi bù tuần sau") | Ít đổi luật nhất, em vẫn có lịch thi bù (đầu ra) |
| Q2 | TE-5: "Báo vắng" ở Kế hoạch Test sau tuần thi dời tuần, "-" ở lưới = Không dự thi | Theo luật "-" (OV-1b): sau tuần thi → Không dự thi; nút ghi đúng hậu quả | Một luật cho mọi cổng (T14) |
| Q3 | HL-2: "Thiếu thông tin" không tính ngày sinh | **Một hàm** `missingForStudent` + **ngày sinh** (chip, badge dòng, ô TVV/CX); email không tính | Đặc tả §2 + OV-2c (ngày sinh bắt buộc) |
| Q4 | HL-10 lớp đã kết thúc vẫn sửa điểm · HV-3 hồ sơ Lưu trữ vẫn sửa được | Lớp kết thúc: **chỉ QL** sửa điểm (nhật ký), GV chỉ xem; HV Lưu trữ: **khoá** (Bỏ lưu trữ trước) | Chữ "chỉ xem" phải đúng; QL vẫn có đường sửa sai |
| Q5 | TQ-10 "xong MT3, chưa có MT kế" | "xong" = **đủ điểm bắt buộc** (cùng nghĩa Kế hoạch Test) | Một khái niệm một nghĩa |
| Q6 | CV-8 "Của GV" thiếu Bàn giao của GV | "Của GV" gồm **mọi việc của GV** (cùng hàm "Của một GV") | QL nhắc được Bàn giao quá hạn |
| Q7 | CV-9 thẻ "Lớp hết khoá · chưa có quyết định chuyển lớp" trùng việc Chốt lộ trình | Bỏ cho **lớp thường**; FT giữ, sửa chữ "Lớp chưa có GVCN" | Một việc một chỗ |
| Q8 | HV-18 tích KCK viết lại lượt MT đã chốt (Case SOS vẫn chạy) | KCK **chụp theo lượt lúc chốt** (như Target); lượt đã chốt giữ kết luận | Một lượt một kết luận |
| Q9 | CA1-2 chuông ở Góc nhìn khác vẫn hiện việc vai gốc, bấm thì mất | Chuông **lọc theo vai đang chọn**; về vai gốc thấy lại (không đánh dấu đã đọc) | Đổi góc nhìn = làm đúng vai |
| Q10 | HV-14 hạn Thêm PA: Công việc quá hạn 18 ngày, hồ sơ "không hạn" | **Giữ hạn** (Công việc) — hồ sơ dùng cùng hàm | Không em nào bị bỏ sót |
| Q11 | HL-19 em "Đã kết thúc học" chưa Lưu trữ không ở danh sách nào | Hiện **mờ ở lớp cuối** (mẫu `row-muted` như lưới chấm OV-1d), ⋯ Lưu trữ · Học lại | Không kẹt, không màn mới |
| Q12 | HV-8 Lưu trữ bắt tích "Tôi hiểu…" | Bỏ ô tích; lưu ngay + **Hoàn tác** (như Thôi học) | Xác nhận chỉ khi hậu quả lớn |
| Q13 | TE-9 GV không có nút dời môn lớp thường (máy chủ cho) | **Giữ như nay** (chỉ QL có nút — QL-TEST #289); không đổi máy chủ | Không đổi luật khi chưa hỏi |
| Q14 | Tên sản phẩm | **PISA Tracking** (chốt 05/10, plan.md mục 11) — tiêu đề tab `{màn} · PISA Tracking` | Đã quyết |
| Q15 | Đề xuất mức "đổi thứ tự badge đỏ khỏi +n" (CA2-5), gộp công tắc FT/Lớp thường 3 kiểu (CA1-5), bỏ "(không bắt buộc)" lặp (P3-9) | **Không làm** đợt này (mục 5) | Đổi luật hiển thị cũ, chờ chủ SP |
Không PR nào cần mockup: mọi đổi dùng mẫu sẵn có (ô Vắng hai dòng, `row-muted`, khung đổi nội dung kiểu `NganCase`, dòng "phần của bạn" của khối 2 Lịch Test).

## 4. Phát hiện → PR (mã ở báo cáo phụ lục; mỗi PR một vùng mã)
| PR | Vùng | Mã phát hiện |
|---|---|---|
| **OV-11a** Vắng · thi bù · hộp nhập điểm | `fasttrack/{hoanTat,absence}`, `normal/regular` ("-"), web `fasttrack/HopNhapDiem·ScoreEntry·MockDetailPage`, `cham/{LuoiFT,MotKyNang,thongBaoVang}`, `shared/domain/oMt` | TE-1, TE-2, TE-3, TE-5, TE-6, CV-5, CA3-1, CA3-2, CA3-3, CA3-5, CA3-6, CA3-7, CA3-8, CA3-9, TE-12 (một phần) |
| **OV-11b** Quản trị · tài khoản | `platform/{accounts,sysconfig,taiKhoan,xoaTaiKhoan}`, `shared/domain/nhatKy`, web `admin/*`, `ProfilePage`, `WelcomePage` | QT-1…QT-10, CA1-7 |
| **OV-11c** Công việc · Chờ duyệt | `worklist/mywork`, `shared/domain/{congViec,daiDienBoTro}`, `gomNhomViec`, `duyet/{loaiYeuCau,TheYeuCau,HopChoDuyet,yeuCau:110}`, web `congViec/*`, `WorkList`, `NhomViec`, `MgmtTasksPage`, `XacNhanXuLyPanel`, `ThaoTacCase` (1 dòng), `normal/cuoiKhoa:626`, `HoSoGiaoVienPage` | TQ-1/TE-4, TQ-4, TQ-5, CV-1…CV-17, HV-14, HV-16, PT-7, CA1-4 |
| **OV-11d** Hồ sơ HV · Case | `students/*` (server), `loTrinh/buocTiep`, `duyet/deXuatSua`, `permissions:193`, `normal/cuoiKhoa` (KQĐR), web `students/{StudentDetailPage,StudentManagePanel,NganTongKet,ChuyenLopPanel,StudentPlanPanel}`, `classes/TransitionPanel` (tiêu đề), `cases/{QuickReport,CasePanel}`, `shared/domain/{hoSoHocVien,hanhTrinh,quanLyHocVien,cuoiKhoa}` | HV-1…HV-24 (trừ HV-5, HV-14, HV-16, HV-18), CA2-1, CA2-2, CA2-3, CA2-9 (hồ sơ), CA2-12, HL-11/HV-25, HL-16/CA2-4 (tiêu đề panel) |
| **OV-11e** Lịch Test số theo người · Điểm theo lớp · huỷ/khôi phục · KCK theo lượt | `cham/{canCham,diemTheoLuot}`, `shared/domain/{diemTheoLuot,thaoTacMt,keHoachTest}`, web `test/*`, `fasttrack/{ketQuaHuy,attempts}` (huỷ / KCK), migrate `prOv11e` | TE-7/CA3-4, TE-8, TE-10/CA3-10, TE-11, TE-12 (phần còn), CA3-11, CA3-12, PT-4, HV-18, HL-6, P2-7, OV-1e bền khi chạy lại |
| **OV-11f** Tổng quan · chuông · thanh đầu | `worklist/{tongQuan,metrics,danhGia,tongQuanMt}`, `platform/{thongBao,nav}`, `shared/domain/duongHoSo`, web `worklist/{OverviewPage,Highlights,KhoiCanXuLy,MetricTiles,BranchPulse}`, `ui/SoLieu`, `platform/Header` | TQ-2, TQ-3, TQ-6/CA1-3, TQ-7, TQ-8, TQ-9, TQ-10, TQ-11, TQ-12, TQ-13, TQ-14, TQ-15, CA1-2, CA1-10, CA1-11, PT-3, PT-6, P1-1, P2-2 (BranchPulse), P2-5 |
| **OV-11g** Học viên & Lớp · hồ sơ lớp | `classes/*` (trừ phanTichLop), `schedule.ts:764`, `shared/domain/hocVienLop`, web `students/StudentsPage`, `classes/*`, `ui/ViecTiep`, seed | HL-1…HL-19 (trừ HL-6, HL-11, HL-16), CA2-6, CA2-7, CA2-8, CA2-10 (lớp), CA2-12 (Kết thúc lớp), P2-3 / P3-1 (phần lớp) |
| **OV-11h** Phân tích · PET | `phanTich/*`, `classes/phanTichLop`, `xuatMt`, `shared/domain/{metrics,cases:114,198}`, web `phanTich/*`, `ClassIssueBoard` | PT-1, PT-2/CA1-1, PT-5, PT-8, PT-9, PT-10, PT-12, HV-5, P2-2 (`NutMoDanhSach`) |
| **OV-11i** Giao diện chung (a11y · 375) | `web/src/index.css`, `App.tsx`, `ui/{ui,MenuDong}` (khung lỗi ở `ui.tsx`), `TheYeuCau` (ô chọn), `cham/{LuoiFT,LuoiThuong}` (màu dấu, ⋯ hover) | P1-2, P1-3, P2-1, P2-3 (ô chọn), P2-4, P2-6, P3-1 (lưới FT)…P3-4, HL-15/PT-11/TQ-16, menu ⋯ 44 px (QT-9, CA2-11, HV-23, TE-12), TVV/CX `/nhap-diem` |

## 5. Đề xuất chưa làm (ghi lại, không chặn)
CA2-5 badge đỏ khỏi "+n" · CA1-5 công tắc FT/Lớp thường một kiểu · CA1-8 gộp hai nút sửa tài khoản · CV-17k cửa sổ việc Kết quả tuần (hồ sơ vs Công việc) · P3-9 bỏ "(không bắt buộc)" lặp · P3-5 nạp sẵn 13 màn (điện thoại) · P3-10 dải tab 375 có dấu cuộn ·
CV-17h "Nhắc tất cả" gom một chuông / GV · CV-17i việc Vận hành Tạm ngưng có dừng hạn không · QT-10 chương trình mới có số tuần có Target / Lộ trình tiếp theo không ·
HV-11 thêm MT0 vào bảng Kết quả Test lớp thường (PR-MT0 cố ý bỏ) · CA3 "Lưu · em tiếp" dừng ở em còn trống · tài liệu: DESIGN.md ghi bậc tiêu đề 15/17/28, bỏ `.o-sua` + xoá CSS chết (P3-6), PRODUCT.md tên "PISA Tracking" (chờ chủ SP đồng ý sửa).

## 6. Đã kiểm, chạy đúng (khỏi rà lại)
Số ô ↔ danh sách: ~3 550 ô Phân tích, ~280 số Tổng quan, 45 cặp chip Học viên & Lớp — khớp (trừ mục đã ghi) · Quay lại về đúng lọc / tab / cuộn ·
Chờ duyệt (duyệt, từ chối có lý do, từ chối nhiều, huỷ trong ngày) · Xác nhận nguyên nhân gom · Bàn giao + sửa sau xác nhận · Bước tiếp sau thi (em đã kết thúc) ·
Lộ trình nháp → chốt → MT0 → bàn giao · KQĐR GVCN đề xuất → QL chốt · Chương trình mới → lớp mở sau đúng lịch, lớp đang chạy giữ · SOS tạm → chốt · T18 chấm chéo ·
PET chỉ chip SOS · KCK không SOS · lượt huỷ bị loại khỏi Phân tích (trừ PT-5) · 22 API quản trị + quyền TVV/CX/Admin 403 · Xuất Excel 9 tệp · 375 không tràn (trừ CX Tổng quan).
Ghi chú cũ plan.md mục 4 đã hết: "Hồ sơ GV đếm items lệch badge" (còn PT-7), "OV-1c … Thiếu điểm".

## 7. Thứ tự (tối đa 3 song song, không chung file)
Đợt 1: **OV-11a · OV-11b · OV-11c** (ngay) → Đợt 2 khi đợt 1 merge hết: **OV-11d · OV-11e · OV-11f** → Đợt 3 khi đợt 2 merge hết: **OV-11g · OV-11h · OV-11i**.
Trong đợt, ba PR không chung file (bảng mục 4). Đợt sau đọc main mới nhất (đã có đợt trước).
Sau OV-11x: chạy lại `kiem-truoc-ov1b` (bản chính) → **deploy một lần** (`DEPLOY_2026-10.md`, thêm migrate `prOv11e`) → PR-EN → PR-SOTAY → deploy 2.
