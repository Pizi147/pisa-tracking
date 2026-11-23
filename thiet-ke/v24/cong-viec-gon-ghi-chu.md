# v24 · Công việc gọn — ghi chú

Mockup: `cong-viec-gon.html` (mở bằng trình duyệt; mục lục A · B · C · Panel). Ảnh: `anh/cong-viec-gon-*.png`.
Dữ liệu bịa: GV Vũ Thu Lan, hôm nay thứ Hai 14/09/2026 (W2 SEP), **20 việc · 3 quá hạn** lấy từ ảnh chủ SP 24/11 + bộ nhỏ TVV (7 việc) + 2 Task không có lớp.
Ba phương án sinh từ **một** bộ dữ liệu trong tệp (script cuối tệp) nên luôn cùng việc, cùng thứ tự.

## 1. Khuyến nghị: **A · Mỗi dòng một lớp**

- Mã lớp ngắn, đều (9 ký tự) → thành **một cột thẳng ở mép trái**; mắt quét dọc là biết việc của lớp nào. Tên em dài ngắn khác nhau không làm được việc này.
- Đúng với cả hai loại việc: việc theo em (Case, PA) lẫn việc theo lớp (nhập điểm, Báo cáo PH, bàn giao). Ở B, việc theo lớp phải mở đầu bằng "2 em", "4 em", "12 em" — ô đứng đầu gần như không nói gì.
- Mở ra nhiều em: dòng con thụt dưới cột lớp, nhìn là hiểu "các em này thuộc lớp trên".
- Cùng chiều cao với B, thấp hơn C; ở 375 hạn và mã lớp cùng một dòng, tên em một dòng.

Không đề xuất phương án D. Đã cân hai hướng và bỏ: ① **gom theo lớp** (đầu nhóm = lớp, dòng = động từ việc) — ít chữ hơn nhưng lật luật NH7 chủ SP chốt 22/11 (chia theo loại việc); ② **mã lớp chỉ in một lần cho các dòng liền nhau cùng lớp** — với nhóm 1–4 dòng thì gần như trùng A, lại vướng "quá hạn lên đầu".

## 2. Đề bài rút gọn (impeccable `shape`)

- Ai: GV (chính), TVV, QL — máy tính ở trung tâm; 375 để tra nhanh. Chế độ Operate.
- Việc chính: quét "việc gì · lớp nào · em nào · gấp chưa" rồi bấm làm ngay tại chỗ.
- Hướng: mọi dòng **cùng bốn ô cố định** (lớp · ai · một chi tiết · hạn); động từ việc nằm ở đầu nhóm, không lặp trong dòng; không nút trong dòng.
- Giữ nguyên: token màu / phông / dải đầu nhóm / khung panel của v23; tab loại việc; + Task; Lớp của tôi.
- Giả định (không có người hỏi lúc vẽ): xem mục 7.

## 3. Luật chung cho cả ba phương án

| Luật | Vẽ thế nào |
|---|---|
| Không cột nút | Cả dòng là một nút; rê = nền nhấn nhạt; đang chọn = nền nhấn nhạt + vạch trái 3 px |
| Nhiều em | "4 em" có mũi tên xuống → bấm dòng mở ra từng em ngay dưới; bấm dòng con → panel |
| Một em | Bấm dòng → panel luôn |
| Đổi trang | Chỉ Báo cáo PH: "›" ở cuối dòng |
| Hạn | Một cụm, không chữ "hạn", không ⚠: `quá 19 ngày` (chữ đỏ, nền đỏ nhạt) · ngày vàng khi ≤ 2 ngày · ngày thường |
| Thứ tự | Quá hạn lên đầu nhóm, rồi hạn gần; bỏ dòng chia "Quá hạn / Hạn đến… / Hạn sau…" |
| Chip | ≤ 1 chip mỗi dòng: chỉ SOS 2–3, đứng sau tên em |
| Đầu nhóm | "Thêm PA · 2 việc · 1 quá hạn"; nhóm = động từ việc (Phương án tách thành Thêm PA / Xác nhận PA / Ghi Mini Test / Ghi kết quả PA) |
| Cỡ | Chữ 14 px, dòng 52 px (dòng con 48), mã tuần một dòng, tên HV không cắt |
| Bề rộng | Danh sách 680 px **không co** khi panel mở; panel 720 px che đúng cột "Lớp của tôi" |

## 4. So ba phương án (số đo từ trang thật, Playwright 1440 / 375)

| | A · một lớp | B · một người | C · thẻ 2 cột |
|---|---|---|---|
| Đứng đầu dòng | Mã lớp (đậm) | Tên em / "n em" (đậm) | Mã lớp nhỏ, tên em to ở giữa |
| Dòng chữ / việc ở 1440 | 1 | 1 | 3 |
| Dòng chữ / việc ở 375 | 2 | 2 | 3 |
| Cao 20 việc · 12 nhóm (1440, gập) | 1 802 px | 1 802 px | 1 987 px |
| Quy ra 16 việc (× 0,8) | ≈ 1 440 px | ≈ 1 440 px | ≈ 1 590 px |
| Tab Case 9 việc · 6 nhóm (1440) | 816 px | 816 px | 873 px |
| Việc thấy trong màn 900 khi panel mở | 8 | 8 | 6 |
| Cao 13 việc ở 375 | 1 238 px | 1 232 px | 1 662 px |
| Mạnh | Cột lớp thẳng, quét nhanh; hợp cả việc theo lớp lẫn theo em; dòng con thụt rõ | Tên em nổi nhất — hợp tab Case; dòng con giống hệt dòng một em | Mỗi việc một khối, ô cố định dễ nhớ; chạm ngón tay dễ |
| Yếu | Tên em không phải thứ đậm nhất | Việc theo lớp mở đầu bằng "2 em / 4 em" (vô nghĩa khi quét); mã lớp xám, xa mắt | Cao nhất dù 2 cột (nhóm 1 việc vẫn chiếm một hàng thẻ); hạn nằm hai cột khó quét; nhóm lẻ để trống nửa hàng; thẻ mở ra phải chiếm cả hai cột; ô "chi tiết" trống khi việc không có chi tiết |

Điểm critique impeccable từng phương án: đang chạy lượt rà độc lập bằng ảnh — bổ sung ở đợt hai (cùng phương án D "khuôn Chờ duyệt", màn Chờ duyệt, tab Việc quản lý).

## 5. Khung panel chung 720 (bản nháp)

- Đầu **một dòng**: tên việc · em · lớp · hạn (cùng màu hạn như ở dòng việc) · ⓘ · ⋯ · ✕. Thân cuộn. Chân lưu cố định: trạng thái lưu bên trái, **Lưu** + **Lưu · việc tiếp ›** bên phải.
- **Nhập điểm Pronunciation** (P1, P3): bảng một cột — tên · ô `18 /25` (104 × 44, số 16 px, "/25" mờ trong ô) · kết quả ngay cạnh. 2 em còn thiếu ở trên; "Đã có điểm · 10 em" ở dưới để panel không trống và GV đối chiếu được. Ô chấm sát tên, không còn nằm tít bên phải.
- **Nhập điểm Mock** (P2): 6 em × L R W1 W2 S + Overall vừa trong 680 px (cột 76, ô 64 × 44); cột GV chấm là ô, cột người khác chấm là số xám. Nhiều cột hơn thì cuộn ngang **trong lưới**, cột tên dính.
- **Xác nhận Case** (A2 / B2 / C2): hàng Phụ trách · Theo dõi → nguồn Case (điểm, ngưỡng, lần trước) → Nhóm nguyên nhân → Mô tả → Phương án → Lịch sử (gập).
- 375: panel toàn màn, cột Kết quả chỉ còn dấu ✓ / ✗ để lưới không tràn; chân chỉ một nút chính.

## 6. Thao tác TRƯỚC → SAU

| Thao tác | Trước (ảnh chủ SP 24/11 + v23) | Sau |
|---|---|---|
| Mở việc một em (Xác nhận Case, Thêm PA, Xác nhận PA, Ghi Mini Test) | Nút riêng mỗi loại ở cột phải | Bấm cả dòng → panel |
| Việc nhiều em làm riêng từng em (Mô tả Case 4 em, vi phạm 3 em, Mini Test 2 em) | Nút "4 em ▾" | Bấm cả dòng → mở ra từng em → bấm em → panel |
| Nhập điểm / Ghi kết quả PA / Bàn giao môn (cả nhóm trong một lưới) | Nút "Nhập điểm" / "Bàn giao môn P"… | Bấm cả dòng → panel lưới 720 |
| Viết Báo cáo PH | Nút "Viết ›" | Bấm cả dòng (có "›") → trang viết |
| Xem hồ sơ em / lớp | Link trong dòng (v23) | Link ở **đầu panel** (tên em, mã lớp) — thêm một bấm; lý do: cả dòng là một nút, không lồng link |
| Biết việc quá hạn | Dòng chia "Quá hạn" + chữ "quá hạn n ngày" | Quá hạn lên đầu nhóm + cụm đỏ nền đỏ nhạt + "m quá hạn" ở đầu nhóm |
| Gia hạn | Ô Hạn trong khối Phụ trách | ⋯ ở đầu panel (xem [XM2]) |
| + Task · tab loại việc · Lớp của tôi · ⓘ · ⋯ · ✕ · Lưu · Lưu · việc tiếp › · 375 chạm cả dòng | Có | Giữ |

## 7. Chỗ tự quyết khi vẽ — cần PTA / chủ SP xem ([XM])

- **[XM1]** "n em" **không** mũi tên (nhập điểm, Ghi kết quả PA, Bàn giao, Báo cáo PH): cả nhóm làm trong một lưới nên bấm là mở lưới, không mở ra từng em — mở ra rồi vẫn vào cùng một lưới là thừa một bấm. Mũi tên chỉ có khi mỗi em một panel riêng.
- **[XM2]** Hạn chỉ hiện ở đầu panel; khối Phụ trách bỏ ô Hạn (đỡ lặp), Gia hạn vào ⋯.
- **[XM3]** Giữ ⋯ ở đầu panel (đề bài chỉ ghi ⓘ · ✕) để không mất thao tác cũ.
- **[XM4]** Hạn viết đủ `16/09/2026` theo NH4. Muốn ngắn hơn (`16/09`) phải đổi NH4 — chưa đổi.
- **[XM5]** Tên lựa chọn "Nhóm nguyên nhân", "Phương án" trong panel Case là minh hoạ; khi code lấy đúng trường web đang có.
- **[XM6]** Dải đầu nhóm giữ kiểu v23 (duyệt 22/11). 12 dải cho 20 việc hơi nặng — nếu muốn nhẹ hơn: hạ dải còn 40 px, tên nhóm 14 px.
- **[XM7]** Dòng vừa SOS 2–3 vừa quá hạn có hai điểm màu (NH1 ghi một) — hiếm, giữ cả hai vì cả hai đều cần thấy.
- **[XM8]** Việc không có lớp (Task): tên việc chiếm chỗ ô lớp + ô em (A, B); thẻ C để trống góc lớp.
- **[XM9]** Khung A1 / B1 / C1 nối 4 tab chỉ để so đủ 20 việc; web vẫn mỗi tab một phần. Khi panel mở, danh sách cuộn riêng (đáy mờ dần).
- Luật craft của impeccable chê vạch trái màu > 1 px; ở đây là luật dự án (G14 dòng đang chọn, dải đầu nhóm v23) nên giữ.

## 8. Lời chủ SP 24/11 → đã đáp ở đâu

| Lời chủ SP | Đáp |
|---|---|
| "Panels công việc to quá, nhất là panels chấm test… ô chấm có mỗi một tí" | Panel 720 thay 75 % (1 080 px); P1 ô chấm sát tên, 104 × 44; P2 lưới 6 cột vừa khung |
| "khung chung được thì tốt, to thôi nhưng không nên to quá ảnh hưởng đến danh sách bên trái, chữ chồng chéo" | Một khung 720 cho cả ba panel (A2, P1, P2); danh sách 680 không co → không dòng nào bị ép; máy dò tràn chữ: 0 lỗi ở 15 khung |
| "bên trái vẫn convoluted, nhiều chữ quá, giảm tải, cần thông tin quan trọng thôi" | Mỗi dòng 4 ô: lớp · ai · một chi tiết · hạn; bỏ động từ lặp, bỏ chữ "hạn", bỏ dòng chia hạn, ≤ 1 chip |
| "gọn gàng và đồng bộ hơn… kể cả nút ở bên phải, lúc là cái nọ lúc là cái kia" | Bỏ hẳn cột nút; mọi dòng cùng ô, cùng chỗ |
| "có khi không cần nút gì luôn? nhiều thì expand ra nhiều HV / vấn đề, 1 thì bấm cái ra panel luôn?" | Đúng vậy ở cả ba: khung 1 có dòng Mô tả Case đang mở ra; [XM1] cho việc làm chung một lưới |
| "có sợ không rõ công việc không?" | Tên việc là đầu nhóm (16 px đậm, kèm số việc · quá hạn) và là tiêu đề panel |
| "lúc thì là tên HV, lúc thì là test, lúc thì là cái nọ cái kia" | A: luôn mã lớp trước · B: luôn em trước · C: luôn cùng ô thẻ |
| "làm nó rộng rãi ra hơn 1 chút" | Dòng 52 px, một dòng chữ, nhóm cách nhau 12 px; danh sách rộng 680 (v23: 556) |
| "nhìn nhiều chữ sợ quá" | Số chữ mỗi dòng: xem mục 4; không câu giải thích nào trên màn |

## 9. Skill đã chạy

- `impeccable`: `context` → `shape` (mục 2) → `layout` (lưới 4 ô, nhịp 52 / 48 / 12) → `critique` (mục 4, rà độc lập bằng ảnh) + `detect`: 0 lỗi phần web; chỉ báo vạch trái 3 px (luật dự án) và màu của phần đọc mockup.
- `ui-ux-pro-max` (`--domain ux`): nhãn gọn không xuống dòng, tên là chữ thiết yếu không cắt, bảng hẹp thì cuộn ngang trong khung — đã áp.
- `frontend-design`: dồn điểm nhấn vào một chỗ (cột đứng đầu thẳng hàng), còn lại yên; bớt chuỗi nối bằng dấu chấm giữa nhờ chia ô.
- `web-design-guidelines`: dòng việc là `<button>`, `aria-expanded` cho dòng mở ra, nút chỉ có biểu tượng đều có `aria-label`, biểu tượng trang trí `aria-hidden`, số dùng `tabular-nums`, có `:focus-visible`. Để lúc code: ô điểm là `<input inputmode="decimal">` có nhãn, trạng thái lưu `aria-live`, URL giữ việc đang mở.
