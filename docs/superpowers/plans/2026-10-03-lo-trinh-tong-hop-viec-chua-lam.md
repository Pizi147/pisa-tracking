# Lộ trình tổng hợp mọi việc chưa làm (03/10, sau deploy)

> Nguồn: kiểm kê mọi file trong `docs/superpowers/plans/`, các spec, `plan.md`, đối chiếu `git log` tới `3d0a25a` (#179); báo cáo rà PR #172–#176
> (F01–F04, U01, D01 — **cả 6 vẫn còn trên main**, đã kiểm lại 03/10); 9 yêu cầu 03/10 (`2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md`).
> Chủ sản phẩm 03/10: **đã deploy** → các việc ghi "sau deploy" được mở khoá. Gộp việc cùng màn/cùng file vào một PR.

## Quyết định 03/10 (bổ sung)
- **F01 = D13:** chống gửi trùng bằng **mã idempotency mỗi lần mở form** (cột `idempotency_key`), bỏ chặn trùng 10 giây theo tiêu đề. Áp cho `/tasks`, việc Vận hành, PA, followup.
- **F02:** lưu **bản chụp nội dung lúc xác nhận** từ nay; việc đã làm trước đó ghi "Chưa lưu nội dung lúc báo — dưới đây là nội dung hiện tại". Không điền ngược.
- **U01:** "chờ chấm" màu **tím `wait`** ở mọi nơi.
- **D01/Q-B:** làm (session planning chọn thời điểm): gộp vào PR Giao việc & Duyệt. Sửa kế hoạch UX 02/10 ghi Q-B **chưa làm** cho tới khi xong.

## Thứ tự PR

| # | PR | Gồm | Vì sao gộp / thứ tự | Cỡ |
|---|---|---|---|---|
| 1 | **PR-PH** (đang làm) | Báo đăng xuất giả (PH-1..3) | Lỗi người dùng thấy hằng ngày | S |
| 2 | **PR-GV · Giao việc & Duyệt** | F01/D13 idempotency key · F03 chi nhánh form · F04 khoá gửi khi chưa có kỳ (máy chủ cũng chặn) · D01/Q-B duyệt nhiều ở "Tất cả" + Chọn hết + Nhắc tất cả · J5 hàng chip đếm Chờ duyệt · J5b tách "Để QL biết" · U01 | Cùng `MgmtTasksPage`, `meeting.ts`, `mgmttasks.ts`, `HopChoDuyet`; lỗi mất dữ liệu nên đi sớm | L |
| 3 | **PR-PHH · Báo PH lưu bản chụp** | F02 (cột snapshot + migrate, hiển thị "đã báo" vs "hiện tại") | Có migrate, tách riêng để dễ rà | M |
| 4 | **PR-LM · Lịch MT** | LM-1..5 · I5 chữ hồ sơ Mock ("Thi bù tuần này (lần 1)", ví dụ nhận xét) · I4 phần MockDetail/HopThaoTacMt Drawer→KhungPanel | Cùng `MockDetailPage`, `HopThaoTacMt` | L |
| 5 | **PR-DH · Học viên & Lớp + hồ sơ** | DH-1..5 · L1 popover "Thiếu n" · K1 (phần desktop: gộp "Tất cả" + Loại lớp = DH-5) · H6 chip "+1" bấm được · D1 badge chuyển lớp khớp số dòng · J6 "Target"(kiểm thuật ngữ) · J8 chữ bị cắt · J10 bỏ "chưa có dữ liệu" lặp ở hồ sơ HV | Cùng `StudentsPage`, `BangHocVienLop`, `MissingBadge`, hồ sơ | L |
| 6 | **PR-SL · Sửa cả lớp + panel** | SL-1..2 · I3 sửa panel Thêm HV · I1 luật "Đóng / Huỷ thay đổi" ở `KhungPanel`/`Drawer` · I2 form Tạo Case · I6 panel Ghi vi phạm · I4 phần còn lại (GvCham, ScoreEntry, NhanXet, DeleteViolationConfirm) · D11 lỗi dưới ô nối `aria-describedby` | Cùng khung panel/form; SL dùng chung lưới với Thêm HV | L |
| 7 | **PR-BC · Báo cáo đơn vị + Quản trị** | L2 thanh điều khiển · D8 "09/2026" · L3 lọc giáo viên · J10 ẩn cột "Quyền cấp riêng" rỗng | Cùng `MeetingPage`, `AccountsAdmin` | M |
| 8 | **PR-SO · Số liệu & dọn mã** | D2 một hàm chọn PA đại diện · D4 xoá `completeIntervention` · D5 · 12.18 đếm bằng chứng theo lô · 12.19 việc nhỏ máy chủ · 12.15/12.16 an toàn (giới hạn thử đăng nhập, `/auth/register` cần duyệt) · DEP-gỡ mã chuyển dữ liệu cũ (**chỉ khi** chủ sản phẩm xác nhận DB cũ đã xoá, TAY-7) | Máy chủ, không giao diện | M |
| 9 | **PR-HK2 · Badge & chữ (cuối cùng)** | H1/H2 ba họ chip · K6 chữ 12 px · K7 icon ⋯ · K2 Phân tích › Tổng hợp · K5 demo bar · J1–J4, J7, J9 chữ · K4 Hoàn tác "Vắng" điện thoại · **chụp lại toàn bộ ảnh sổ tay** | Đụng ~15+ file khắp web — làm sau cùng để không xung đột và chỉ chụp sổ tay một lần | L |

## Chủ sản phẩm 03/10 duyệt thứ tự trên; DB cũ ĐÃ XOÁ (gỡ mã cũ ở PR-SO); đưa vào lộ trình: D9 → PR-BC, D7 → PR-HK2, D3 → PR-SO, U12 → PR riêng **PR-U12** sau PR-SO.

## Còn chờ quyết
GVCN nhập bù Case môn mình không dạy (C02) · A12 tên PA "Điều chỉnh cách dạy" · K2-26 (mặc định bỏ).

## Hoãn có chủ ý (giữ nguyên)
UX-D7 bảng→thẻ điện thoại · Thêm HV dạng thẻ điện thoại · xu hướng Phân tích (chờ 2–3 tháng dữ liệu) · KPI tháng GV · D15 hiệu quả PA theo SOS lúc sinh · taxonomy vấn đề · kho ý tưởng §20.

## Đã chốt không làm
GV-C1 chấm đúng hạn lịch sử · góc Phân tích › Giáo viên cũ · mockup 26 bản 3–4 · Q12 em tạm dừng · ba ý tưởng §20.1 · B7 (giữ mã).
