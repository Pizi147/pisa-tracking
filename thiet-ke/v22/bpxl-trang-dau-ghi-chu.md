# v22 · ① BPXL — trang đầu Kế hoạch Test + chuông · ghi chú cho người duyệt

Mockup: `thiet-ke/v22/bpxl-trang-dau.html` (+ `v22.css`; dùng lại `../v21/v21.css`, `bang-mau.css`, `test.css`, `chuong-vi-pham.css`, chỉ đọc).
Thiết kế: `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` mục A (ĐỀ XUẤT). Ảnh: `anh/bpxl-trang-dau/{khung}-{toi|sang}.png`.
Tên người là tên bịa (BPXL Hoàng Minh Đức). Hôm nay thứ Hai 14/09/2026 · W3 SEP.

## 1. Trạng thái đã vẽ

| Khung | Trạng thái |
|---|---|
| K1 | 1440 · BPXL vào thẳng Kế hoạch Test, dải số lặng, một lớp mở lưới (có ô vắng đã dời "L R vắng · dời W4 SEP", ô đã huỷ, ô bị chặn) · bấm thử số ở dải |
| K2 | 1440 · đã bấm "Vắng tuần này 7" → số đang lọc + chip "Lọc: … ✕", chỉ còn 2 lớp, lưới chỉ 4 em vắng của MB FT 104 (3 đã dời W4 SEP, 1 đã huỷ) |
| K3 | 1440 · chuông mở: Việc cần làm (Xếp lịch họp 2 · Việc được giao 1) + Cập nhật có 2 tin vắng gộp lớp × tuần (một tin mở từng em) + tin giao việc đã xem |
| K4 | 1440 · mọi số = 0 (số mờ, không bấm) |
| K5a / K5b | 375 · mặc định (dải 2 × 2) · đang lọc |

## 2. Thao tác TRƯỚC → SAU (Kế hoạch Test)

| Thao tác | Trước | Sau |
|---|---|---|
| Xuất Excel…, Xếp nhiều MT…, tab Lịch Test tuần / Kế hoạch Test | có | GIỮ (BPXL được xếp như Admin) |
| Fast Track / Lớp thường, ô tìm lớp / HV / email, ⓘ, "Mở tất cả lớp" | có | GIỮ |
| Nút-chip "Chưa đủ MT n" ở hàng lọc | có | với BPXL: gộp vào số "Chưa xếp lịch MT" của dải (cùng tập, cùng hàm) |
| Ô số "Chưa đủ MT · n em" trên hàng lớp | có | đổi tên "Chưa xếp lịch MT · n em" (một tên với dải); thêm "Vắng · n em" (em vắng tuần này của lớp, chỉ thông tin) |
| Lưới HV × MT, + MT, S Ex, Xếp MT, ô bị chặn có lý do, Đã xoá · Khôi phục | có | GIỮ (hộp xếp một kỹ năng ⑦ B2 không đổi) |
| Dải số lặng (4 số) | — | MỚI, chỉ vai BPXL |
| Tin vắng trong chuông | — | MỚI, mục "Cập nhật" |

## 3. Chỗ tự quyết

- **Vắng (chủ SP 20/11: "vắng thì không cần xếp lại, đã nói bao nhiều lần rồi")** — N38: vắng lần 1 máy tự dời sang tuần kế, lần 2 huỷ. Không còn số / nhãn / việc / link nào bắt BPXL làm gì: dải ghi "Vắng tuần này" (chỉ thông tin), hàng lớp "Vắng · n em", ô MT ghi thẳng "L R vắng · dời W4 SEP" / "Đã huỷ · vắng 2 lần", tin chuông "3 đã dời · 1 đã huỷ".

- Dải nằm **dưới tab, trên hàng lọc** (là bộ lọc của danh sách ngay dưới, như dải "Của bạn" ở Lịch Test tuần).
- Số đang lọc: nền nhấn nhạt + viền + chip "Lọc: … ✕" ở hàng lọc (không chỉ màu); bấm lại số hoặc ✕ = bỏ lọc. Chỉ một số lọc một lúc.
- "Lượt MT tuần này" lọc lớp có lượt Test tuần này; "Bài chưa có điểm" lọc lớp còn bài chưa nhập (BPXL không nhập điểm — chỉ để biết, đúng thiết kế "chỉ xem").
- Tin vắng: tóm một dòng "3 đã dời · 1 đã huỷ" thay vì liệt kê tên (tên HV không bị cắt "…" — N55); mở ⌄ mới thấy tên từng em.
- Bấm tin vắng = Kế hoạch Test lọc đúng lớp ("Lớp: … ✕" như ⑦ A4).
- Số 0 vẫn hiện (biết là đã xếp hết), không câu chúc mừng.
- Menu BPXL đặt trang đầu đứng đầu (Test · Học viên & Lớp · Công việc) như GV/TVV; Công việc chỉ có badge khi có việc của mình.

- Công việc của BPXL (tab Xếp lịch họp · Việc được giao · Đang theo dõi) vẽ ở `giao-viec.html` khung G8a (cạnh panel Meeting).

## 4. [XM] — đã xử lý

- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — một tên **"Chưa xếp lịch MT"** cho cả dải số lẫn ô số hàng lớp, mọi khung 1440 + 375.
- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — chuông BPXL không có thanh "Đang theo dõi" (tab không số) — giữ như mockup.
- **ĐÃ CHỐT (PTA 21/11, BPXL-2 #1928)** — số thứ tư của dải ghi **"Lượt MT tuần này"** (thay "Lượt thi tuần này"): luật Thi = thi thật, Test = MT (phép kiểm CT-1); cùng tên với ô cùng số của Admin.

## 5. Dòng đọc

Dải dùng lại `GET /tong-quan/mock-test` (đã có trần) + dữ liệu vắng đã nạp ở Kế hoạch Test; lọc trên dữ liệu đã nạp, không thêm request. Tin vắng nạp khi mở chuông như nay.
