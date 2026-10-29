# Phân tích · 6 tab — ghi chú mockup V8 (`phan-tich.html`)

Trạng thái: **đề xuất, chờ chủ SP**. Nền: `v5/phan-tich.html` (đã duyệt, chỉ có tab HV + GV) + critique 29/10 (`critique-b…`).
Khung: A1–A5 1440 tối (3 tab chi tiết) · B1–B3 1440 tối (đầu 3 tab còn lại) · C1–C4 375 sáng · D1–D3 trạng thái 375.

## Điểm hiện tại (web 29/10)
Báo cáo HV 28 · Phân tích GV 30 · **Test + SOS 26** · **Kết quả Test 27** · **Hiệu quả PA 27** · Ý thức 28.

## Vấn đề bố cục chính
1. **P2** Hàng lọc không thẳng: công tắc FT / Lớp thường 12 px cao 26 cạnh ô 38; "Xếp theo" + chú giải + ⋯ nằm trong dải đầu thẻ trống (Test + SOS, ~70 px trống); Kết quả Test thêm hàng tab con riêng.
2. **P2** Không có thẻ chỉ số ở Test + SOS / Kết quả Test / Hiệu quả PA; Kết quả Test dồn số vào một dòng chữ 12 px; Hiệu quả PA để ba số "Để số liệu đủ tin" ở chân.
3. **P2** Quá nhiều gạch chân: mọi số kể cả số trong chip Đạt / SOS; Phân tích GV hai kiểu gạch, đơn vị lặp dưới mỗi ô; ô kỳ "W1 SEP – W2 SEP" lặp ở 4 / 5 thẻ Báo cáo HV.
4. **P2** Kết quả Test: "MT · tuần" và "Việc tiếp" xanh như link + cắt "…", phân trang lặp trên + dưới; cột "Việc tiếp" là việc trong báo cáo (G8). Hiệu quả PA: bảng có đầu cột mà mọi dòng gập, dòng gập 15 / 700 to hơn tiêu đề khối.
5. **P2** 375: bảng 17 cột cuộn ngang (Test + SOS), 3–4 hàng lọc vỡ, ô chỉ số lẻ mồ côi.

## Phương án (chung 6 tab)
- **Một hàng lọc**, mọi ô 36 px chữ 14: [ô đoạn đầu: Fast Track | Lớp thường — Kết quả Test dùng chỗ này cho **Mock Test | Thi thật**] · [Toàn bộ | Chọn khoảng tuần] · [W1 SEP] → [W2 SEP] · Mọi lớp ▾ · ô riêng tab (Theo tuần ▾, Mọi kết quả ▾, Gọn | Đầy đủ, Tìm GV, chip GV ✕) · cuối phải: Xuất Excel / In / ⋯.
- **Thẻ chỉ số** đầu mỗi tab, cùng hàm với dòng Tổng / bảng (G7): Test + SOS (Lượt MT · Đạt · SOS 1·2·3 · Thiếu điểm · Chưa chốt PA) · Kết quả Test (Lượt · Đạt · Chưa đạt · Chưa đủ điểm · SOS) · Thi thật (Lượt thi · Đạt Target · Chưa đạt · Bước tiếp chưa chọn) · Hiệu quả PA (PA có KQ · Có cải thiện · Thời gian thường mất · Chưa tính = 3 số "đủ tin" cũ) · Ý thức (HV cần chú ý · Vi phạm · Chưa xử lý · Lớp có vi phạm — cộng từ bảng Lớp). Nhãn "tên · trong kỳ", không lặp khoảng tuần.
- **Thẻ bảng có tiêu đề thật** ("Theo tuần · 2 tuần", "Lượt Mock Test · 17 lượt"…) + **ⓘ Cách tính** ở đầu thẻ (bỏ ⓘ trong `th` — G9; bỏ chú giải màu vì đầu cột đã ghi Đạt / SOS n).
- Số: OSo gạch liền chỉ ở số trơn; số trong chip Đạt / SOS không gạch (chip là ô bấm); 0 xám không bấm. Bấm số → panel đúng tập (V11: tên · phạm vi · ngày dữ liệu · tổng + đơn vị · danh sách · Cách tính), chỉ đọc.
- Kết quả Test: MT · tuần chữ thường; Kết quả = badge V4 (✓ Đạt / ✗ Chưa đạt / – Chưa đủ điểm); **"Case / PA" + "Việc tiếp" gộp thành cột "Xử lý"**: trạng thái + dòng phụ "tiếp: … · người" chữ thường, không link, không quá hạn; phân trang chỉ dưới.
- Hiệu quả PA: nhóm mở sẵn khi đủ dữ liệu, dòng nhóm 14 / 700; "vấn đề khác" gập; quy chế dòng phẳng có chip SOS; hai bảng cùng lưới cột.
- 375: hàng tab cuộn ngang (tab đang chọn luôn trong tầm, mờ mép) · lọc 4 hàng (ô đoạn full · thời gian full · 2 ô tuần · lớp + xếp) · thẻ chỉ số 2 cột, thẻ SOS trải 2 cột · bảng nhiều cột → **thẻ mỗi dòng** (tuần / HV) lưới nhãn trên số dưới · bảng ≤ 4 cột số giữ bảng (Hiệu quả PA, phụ dòng mang thời gian + Nên dùng).
- Trạng thái: tải (khung thẻ) · rỗng "Chưa có lượt nào có điểm · trong W1 SEP → W2 SEP" + **Xem Toàn bộ** · lỗi chỉ vùng dữ liệu + Tải lại.

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | Trước (web) | Sau (mockup) | Ghi |
|---|---|---|---|
| Đổi tab (6) · chi nhánh | hàng tab · ô đầu trang | như cũ | = |
| FT / Lớp thường · Toàn bộ / Chọn khoảng tuần · 2 ô tuần · Mọi lớp | hàng lọc | như cũ, cùng cao 36 | đổi cỡ |
| Xếp theo (Test + SOS, Kết quả Test) | trong dải đầu thẻ / đầu bảng | **dời lên hàng lọc** ("Theo tuần ▾") | dời chỗ |
| Cột hiện · Xuất bảng này · Xuất kết quả từng lượt (Test + SOS) | menu ⋯ đầu thẻ | **Xuất Excel** nút riêng + ⋯ (Cột hiện, Xuất từng lượt) cuối hàng lọc | dời chỗ, Xuất lộ ra |
| Chú giải màu Đạt / SOS | dải đầu thẻ | bỏ — đầu cột ghi chữ; ⓘ Cách tính | bỏ trùng |
| ⓘ cách tính nhóm Xử lý | trong `th` | ⓘ đầu thẻ | dời (G9) |
| Mở / gập hàng tuần → lớp · hàng vấn đề → loại PA | ▸ ▾ | như cũ | = |
| Bấm số → panel danh sách | OSo | như cũ + chip Đạt / SOS bấm được | = |
| Mock Test / Thi thật | tab con riêng hàng | ô đoạn đầu hàng lọc | dời chỗ |
| Lọc kết quả (Tất cả · Đạt · Chưa đạt · Chưa đủ điểm) | nút đoạn có số | ô chọn "Mọi kết quả ▾" (số ở thẻ chỉ số + mục chọn) | đổi dáng, bỏ "Tất cả" thứ hai |
| Xuất Excel · n lượt (Kết quả Test, Thi thật) · Xuất Excel (Ý thức) · In (Báo cáo HV) | rải rác | cuối phải hàng lọc, cùng chỗ mọi tab | dời chỗ |
| Phân trang · Mỗi trang 10 / 20 / 50 | trên + dưới | chỉ dưới | bỏ lặp |
| Hồ sơ HV (tên) · Hồ sơ HV › (Thi thật chưa chọn bước) | link | như cũ, tên chữ thường | = |
| Lọc GV (Hiệu quả PA, từ link) · bỏ lọc ✕ | nút trong dòng ngữ cảnh | chip "GV: … ✕" trên hàng lọc; dòng ngữ cảnh "FT · chi nhánh · khoảng" bỏ (trùng hàng lọc) | dời chỗ |
| Gọn / Đầy đủ · Tìm GV (Phân tích GV) | hàng riêng dưới lọc | cùng hàng lọc | dời chỗ |
| Xem Toàn bộ khi rỗng | không | nút trong ô rỗng | thêm (một bấm) |

## Câu hỏi cho chủ SP
1. **Tên tab "Kết quả Test" chứa "Thi thật"** — trái G2 (Thi = thi thật, Test = MT…). Đổi tên tab thành "Kết quả thi" (như mockup V5), tách "Thi thật" thành tab riêng, hay giữ? (mockup chưa đổi)
2. Cột **"Việc tiếp"** ở Kết quả Test là việc trong báo cáo (G8): gộp vào "Xử lý" thành dòng phụ chữ thường (khuyến nghị, giữ thông tin) — đồng ý? [XM]
3. "⚠ n quá hạn" ở cột Chưa chốt PA và trạng thái "Quá hạn" ở Ý thức — giữ (thông tin có sẵn) hay bỏ theo G8 "báo cáo không quá hạn"? [XM]
4. Số trong **chip Đạt / SOS không gạch chân** (chip đã là ô bấm) — chấp nhận ngoại lệ dáng OSo?
5. Thẻ chỉ số thêm cho Test + SOS / Kết quả Test / Hiệu quả PA / Ý thức — trùng số với dòng Tổng; giữ cả hai (khuyến nghị) hay bỏ dòng Tổng?

## Critique (Nielsen 10 × 0–4, tự chấm khắt khe)
| Vòng | Điểm | P0/P1 | Sửa sau vòng |
|---|---|---|---|
| 1 | 29 / 40 | 0 / 2 (375: thẻ HV / panel vỡ chữ do trùng lớp CSS; tab đang chọn khuất khỏi tầm ở 375) | đổi lớp; tab tự cuộn tới tab chọn; cột Xử lý Test + SOS đè chữ → cột cố định; "⚠" thẻ ≠ dòng Tổng → cùng số; "Đang xử lý" Tổng sai; SOS 3 · 0 không vẽ chip đặc; panel thiếu cột S; Thi thật số lượt khớp dòng; dòng quy chế bỏ ▸; 375 "Cải thiện" cắt đầu cột |
| 2 | **35 / 40** | 0 / 0 | — |

Vòng 2: H1 4 · H2 3 · H3 3 · H4 4 · H5 3 · H6 4 · H7 3 · H8 3 · H9 4 · H10 4.
Còn P2: bảng Test + SOS vẫn 14 cột số dày (đúng dữ liệu) · Phân tích GV chưa có thẻ chỉ số (tab chỉ vẽ đầu) · ⋯ vẫn giấu "Cột hiện".
