# v22 · ② Giao việc liên phòng ban · ghi chú cho người duyệt

Mockup: `thiet-ke/v22/giao-viec.html` (+ `v22.css`; dùng lại `../v21/v21.css`, `bang-mau.css`, `trang-dau-tvv.css`).
Thiết kế: `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` mục B + D (ĐỀ XUẤT). Ảnh: `anh/giao-viec/{khung}-{toi|sang}.png`.

## 1. Trạng thái đã vẽ

| Khung | Trạng thái |
|---|---|
| G1 | 1440 · TVV · tab Báo PH · panel Báo PH vi phạm có khối **Phụ trách · Hạn · Theo dõi** · dòng việc "Lương Thảo Vy giao" · mục gập / mở (bấm thử) |
| G2a | panel Báo PH Meeting của TVV (giữ như nay, B2) đã giao lại · theo dõi CX + GVCN (BPXL không còn theo dõi) · Lịch sử mở: đổi người, sửa hạn, bỏ theo dõi, tạo việc |
| G2b / G2c | việc chưa có hạn ("Đặt hạn") · người không có quyền đổi (không nút ở dòng đó) |
| G3a / G3b / G3c | hộp "Đổi người phụ trách" mở (Liên quan trước, ✓ người hiện tại, "Về mặc định" tắt) · sau "Giao" + Hoàn tác · đang gõ, "Về mặc định · {tên}" bật |
| G4a / G4b | "+" thêm người theo dõi (chọn nhiều) · ✕ bỏ người + Hoàn tác |
| G5 | 1440 · GVCN · tab **Đang theo dõi**: mục Báo PH (Quá hạn đầu) · Phối hợp SOS · "Vừa xong 7 ngày" gập · panel chỉ đọc + "Bỏ theo dõi" |
| G6 | mục mở + hai mục gập (vẫn "n việc · m quá hạn") — bấm thử |
| G8a | 1440 · BPXL · Công việc (tab **Xếp lịch họp** · Việc được giao · Đang theo dõi) · panel Meeting hai phần cạnh nhau, chưa ai xong |
| G8b | CX mở việc: Xếp lịch họp ✓ (ngày giờ 18/09 · 15:00), Kết quả meeting đang ghi |
| G8c / G8d | TVV nhập hộ CX · cả hai xong ("Đặng Hải Yến nhập hộ CX"), Hoàn tác, Sửa |
| G8e | CX · Công việc · dòng "Kết quả meeting" |
| G8f | 375 · BPXL · hai phần xếp dọc |
| G7a / b / c | 375 · Đang theo dõi · panel toàn màn có khối · đổi người toàn màn |

## 2. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Panel Báo PH: dải ① ② ③, bối cảnh, Kết quả, Ngày, Nội dung, Lịch sử, quy chế, Đóng / Lưu / Lưu · việc tiếp ›, ⋯ Bỏ việc… | có | GIỮ |
| Dòng "Hạn · Sửa hạn" (`DongHan`) | có | thành dòng 2 của khối ba dòng (cùng nút "Sửa hạn") |
| Đổi người phụ trách | — | MỚI: "Đổi" → hộp nhỏ, Về mặc định, Hoàn tác |
| Người theo dõi | — (Báo PH chưa có) | MỚI: chip + ✕, "+" thêm nhiều, tự "Bỏ theo dõi" |
| Đặt hạn cho việc không hạn | không | "Đặt hạn" (sửa N34 ② theo thiết kế) |
| Tab "Đang theo dõi" | — | MỚI, mọi vai, không badge |
| Mục trong Công việc gập / mở | chỉ dải "Đã bỏ qua", "Yêu cầu của tôi", "PA đang chạy" | MỌI mục, bấm tiêu đề mục |
| Thẻ phụ "{tên} giao" trên dòng việc | — | MỚI |

## 3. Chỗ tự quyết

- Khối ba dòng đặt **ngay đầu thân panel**, trên dải ① ② ③ (thông tin "ai / khi nào / ai biết" trước nội dung); cột nút căn phải, cùng cỡ `nut-nho`.
- Nút: "Đổi" · "Sửa hạn" (giữ chữ đang có) · "+" (vuông, có `aria-label`). Ở 375 giữ "Sửa hạn" (một tên).
- Đổi người **không bắt lý do** (đổi lại được, có lịch sử); không thêm ô "lời nhắn" (panel việc đã đủ ngữ cảnh). Sau Giao: hộp đóng, dải "✓ Đã giao cho … · Hoàn tác" 10 giây; người giao tự vào Theo dõi.
- "Về mặc định" ở chân trái hộp, ghi tên người mặc định khi đang lệch mặc định; tắt khi đang là mặc định.
- Chip theo dõi mặc định (CX, BPXL trên Meeting) không có ✕ với người không có quyền bớt.
- Tab Đang theo dõi: cột cuối là trạng thái bằng chữ (không nút) · thẻ phụ "Phụ trách {tên}" · biểu tượng mắt ở ô đầu dòng.
- Panel chỉ đọc: chân chỉ "Đóng"; dải "Bạn đang theo dõi · chỉ xem · Bỏ theo dõi".
- Chevron mục đặt sát tên (dáng dải gập CV6 đã duyệt); mục gập không đổi chiều cao dải.
- Lịch sử đổi người / hạn / theo dõi dùng chung khối "Lịch sử · n" đang có (một kiểu ⑤), không thêm khối.

## 3b. Meeting CX / GĐCN (B2 — chủ SP 20/11 tối, bản đơn giản)

- Hai phần ĐỘC LẬP, không thứ tự, không đánh số, không thanh tiến trình, không chữ "chờ…": **Xếp lịch họp** (BPXL) · **Kết quả meeting** (CX; TVV nhập hộ).
- Mỗi phần cùng một kiểu: trạng thái chữ (Chưa xong / ✓ Hoàn thành) · khối Phụ trách + Hạn thu gọn · ô (tuỳ chọn) · nút **Hoàn thành**. Xếp lịch họp thêm ô **Ngày giờ họp** tuỳ chọn (ô ngày gõ được + nút lịch, ô giờ).
- Phần của người khác chỉ đọc: chỉ trạng thái + người phụ trách + hạn (chưa xong) hoặc ai · lúc · nội dung (đã xong).
- Tự quyết: dòng **Theo dõi** dùng chung cho cả việc (một dòng dưới hai phần) thay vì lặp ở mỗi phần — theo dõi là của cuộc họp, lặp hai lần là thừa. Nếu PTA muốn đúng chữ "khối ba dòng cho từng phần" thì tách lại.
- Tự quyết: Công việc của BPXL vẽ ở **giao-viec.html G8a** (tab "Xếp lịch họp" đầu hàng tab), không ở bpxl-trang-dau.html; chuông BPXL (bpxl-trang-dau K3) thêm thanh "Xếp lịch họp 2".
- Tự quyết: CX thấy ngày giờ họp BPXL ghi ngay trên dòng việc ("họp 18/09 · 15:00").
- Việc "Báo PH Meeting" của TVV giữ như nay (G2a), theo B2 "PTA hiểu".

## 4. [XM]

- **[XM-1]** Thiết kế B: "Hạn — ai đổi được: người phụ trách, người giao, Head / CX" — **thiếu GVCN và TVV cùng chi nhánh** mà N34 ① cho sửa hạn Báo PH. Mockup GIỮ theo N34 (G5: GVCN đang theo dõi vẫn có "Sửa hạn"). Cần chốt khi viết N57–N61.
- **[XM-2]** Panel người theo dõi là "chỉ xem" nhưng GVCN có quyền sẵn có (sửa hạn) → panel G5 có một nút. Đề xuất: theo dõi = chỉ xem TRỪ quyền vai đang có.
- **[XM-4]** Meeting: nút ở dòng việc BPXL là "Hoàn thành" (bấm thẳng, không mở panel) — đúng "ít thao tác" nhưng khác các dòng khác (nút mở panel). Cần chốt.
- **[XM-3]** Mục gập "nhớ theo người + tab": mockup giả định lưu ở trình duyệt (không thêm request); nếu muốn đồng bộ nhiều máy thì cần lưu máy chủ (+1 câu ghi).

## 5. Dòng đọc

Khối ba dòng đọc từ dòng việc đã nạp (người, hạn, theo dõi); tab Đang theo dõi tải khi mở (~6 câu theo thiết kế); hộp đổi người dùng ô chọn có tìm sẵn có (danh sách tài khoản chi nhánh, nạp khi mở hộp).
