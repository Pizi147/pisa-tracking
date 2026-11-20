# v22 · ① BPXL — trang đầu Kế hoạch Test + chuông · ghi chú cho người duyệt

Mockup: `thiet-ke/v22/bpxl-trang-dau.html` (+ `v22.css`; dùng lại `../v21/v21.css`, `bang-mau.css`, `test.css`, `chuong-vi-pham.css`, chỉ đọc).
Thiết kế: `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` mục A (ĐỀ XUẤT). Ảnh: `anh/bpxl-trang-dau/{khung}-{toi|sang}.png`.
Tên người là tên bịa (BPXL Hoàng Minh Đức). Hôm nay thứ Hai 14/09/2026 · W3 SEP.

## 1. Trạng thái đã vẽ

| Khung | Trạng thái |
|---|---|
| K1 | 1440 · BPXL vào thẳng Kế hoạch Test, dải số lặng, một lớp mở lưới (có ô vắng chờ xếp lại, ô đã huỷ, ô bị chặn) · bấm thử số ở dải |
| K2 | 1440 · đã bấm "Vắng chờ xếp lại 4" → số đang lọc + chip "Lọc: … ✕", chỉ còn 2 lớp, lưới chỉ em khớp |
| K3 | 1440 · chuông mở: Việc cần làm (Việc được giao 1) + Cập nhật có 2 tin vắng gộp lớp × tuần (một tin mở từng em) + tin giao việc đã xem |
| K4 | 1440 · mọi số = 0 (số mờ, không bấm) |
| K5a / K5b | 375 · mặc định (dải 2 × 2) · đang lọc |

## 2. Thao tác TRƯỚC → SAU (Kế hoạch Test)

| Thao tác | Trước | Sau |
|---|---|---|
| Xuất Excel…, Xếp nhiều MT…, tab Lịch Test tuần / Kế hoạch Test | có | GIỮ (BPXL được xếp như Admin) |
| Fast Track / Lớp thường, ô tìm lớp / HV / email, ⓘ, "Mở tất cả lớp" | có | GIỮ |
| Nút-chip "Chưa đủ MT n" ở hàng lọc | có | với BPXL: gộp vào số "Chưa xếp lịch MT" của dải (cùng tập, cùng hàm) — [XM-1] |
| Ô số "Chưa đủ MT · n em" trên hàng lớp | có | GIỮ; thêm "Vắng chờ xếp lại · n em" (số `canXepLai` đang có) |
| Lưới HV × MT, + MT, S Ex, Xếp MT, ô bị chặn có lý do, Đã xoá · Khôi phục | có | GIỮ (hộp xếp một kỹ năng ⑦ B2 không đổi) |
| Dải số lặng (4 số) | — | MỚI, chỉ vai BPXL |
| Tin vắng trong chuông | — | MỚI, mục "Cập nhật" |

## 3. Chỗ tự quyết

- Dải nằm **dưới tab, trên hàng lọc** (là bộ lọc của danh sách ngay dưới, như dải "Của bạn" ở Lịch Test tuần).
- Số đang lọc: nền nhấn nhạt + viền + chip "Lọc: … ✕" ở hàng lọc (không chỉ màu); bấm lại số hoặc ✕ = bỏ lọc. Chỉ một số lọc một lúc.
- "Lượt thi tuần này" lọc lớp có lượt Test tuần này; "Bài chưa có điểm" lọc lớp còn bài chưa nhập (BPXL không nhập điểm — chỉ để biết, đúng thiết kế "chỉ xem").
- Tin vắng: tóm một dòng "1 chờ xếp lại · 2 đã dời · 1 đã huỷ" thay vì liệt kê tên (tên HV không bị cắt "…" — N55); mở ⌄ mới thấy tên từng em.
- Bấm tin vắng = Kế hoạch Test lọc đúng lớp ("Lớp: … ✕" như ⑦ A4).
- Số 0 vẫn hiện (biết là đã xếp hết), không câu chúc mừng.
- Menu BPXL đặt trang đầu đứng đầu (Test · Học viên & Lớp · Công việc) như GV/TVV; Công việc chỉ có badge khi có việc của mình.

## 4. [XM] cần PTA / chủ SP quyết

- **[XM-1]** "Chưa xếp lịch MT" (dải) và "Chưa đủ MT" (chip / ô số hàng lớp) là MỘT khái niệm hai tên (vi phạm "một khái niệm một tên"). Đề xuất: dùng một tên cho cả hai — "Chưa đủ MT" (đã có trên web) hoặc đổi cả hai thành "Chưa xếp lịch MT".
- **[XM-2]** Có cần thanh "Đang theo dõi" trong chuông BPXL không? Mockup không vẽ (tab không có số → không có thanh), theo thiết kế B.

## 5. Dòng đọc

Dải dùng lại `GET /tong-quan/mock-test` (đã có trần) + số `canXepLai` đang có ở Kế hoạch Test; lọc trên dữ liệu đã nạp, không thêm request. Tin vắng nạp khi mở chuông như nay.
