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
| G8a | 1440 · BPXL · Công việc (tab **Xếp lịch họp** · Việc được giao · Đang theo dõi) · panel Meeting ba phần, chưa phần nào xong |
| G8b | 1440 · TVV · tab Báo PH, dòng "Báo PH Meeting CX/GĐCN" (như G1) · BPXL đã xếp (18/09 · 15:00) · TVV nhập hộ Kết quả meeting + ghi Báo PH (form đang có) |
| G8c | CX mở việc · ghi Kết quả meeting · Báo PH chưa xong |
| G8d | cả ba xong · Hoàn tác · Sửa |
| G8e | CX · Công việc · dòng "Kết quả meeting" |
| G8f | 375 · BPXL · ba khối dọc |
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

## 3b. Meeting CX / GĐCN (B2 — chủ SP 20/11 tối)

- Lời chủ SP: "chỉ cần đơn giản là có phần cập nhật kết quả task, hoàn thành là được…" và "việc báo PH cho việc meeting CX/ GĐCN vẫn cần nhé".
- Một việc Meeting = **ba phần độc lập**, không thứ tự, không đánh số, không chữ "chờ…": **Xếp lịch họp** (BPXL) · **Kết quả meeting** (CX; TVV nhập hộ, ghi "{TVV} nhập hộ CX") · **Báo PH** (TVV, form Báo PH đang có). Mỗi người thấy đúng dòng việc của mình: BPXL tab "Xếp lịch họp", CX mục "Kết quả meeting", TVV tab Báo PH › Phối hợp SOS "Báo PH Meeting CX/GĐCN" (như G1).
- **Chọn bố cục: ba khối cùng kiểu XẾP DỌC** (không ba cột) — panel 736 chia ba còn ≈ 225 px mỗi cột, ô ngày + giờ và ô Kết quả chật, lỗ chỗ. Thứ tự cố định (Xếp lịch · Kết quả · Báo PH) chỉ để dễ tìm. Khối của người khác **gọn một dòng** (tên · trạng thái · người · hạn hoặc ai · lúc), khối của mình mở ô — mắt thấy ngay việc mình.
- Xếp lịch họp: Ngày giờ họp + Kết quả, đều tuỳ chọn → Hoàn thành. Kết quả meeting: Kết quả tuỳ chọn → Hoàn thành. Báo PH: giữ nguyên form + chân Lưu / Lưu · việc tiếp ›.
- Tự quyết: dòng **Theo dõi** dùng chung một dòng cho cả việc (theo dõi là của cuộc họp, lặp ba lần là thừa). Nếu PTA muốn đúng chữ "khối ba dòng cho từng phần" thì tách lại.
- Tự quyết: ngày giờ họp BPXL ghi hiện trên dòng việc của CX và TVV ("họp 18/09 · 15:00").
- Chuông BPXL (bpxl-trang-dau K3) có thanh "Xếp lịch họp 2".

## 4. [XM] — đã xử lý

- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — ai sửa hạn: giữ N34 ① — thêm GVCN và TVV cùng chi nhánh vào danh sách người sửa hạn (cùng người phụ trách, người giao, Head / CX).
- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — người theo dõi chỉ xem, TRỪ quyền vai sẵn có (GVCN vẫn "Sửa hạn" Báo PH theo N34) — như G5.
- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — nút "Hoàn thành" bấm thẳng trên dòng Xếp lịch họp của BPXL — giữ như G8a (chủ SP duyệt mockup).
- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — nhớ gập / mở ở trình duyệt (localStorage), theo người + tab; không thêm request.

## 5. Dòng đọc

Khối ba dòng đọc từ dòng việc đã nạp (người, hạn, theo dõi); tab Đang theo dõi tải khi mở (~6 câu theo thiết kế); hộp đổi người dùng ô chọn có tìm sẵn có (danh sách tài khoản chi nhánh, nạp khi mở hộp).
