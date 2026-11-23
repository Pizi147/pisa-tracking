# v24 · Công việc gọn — ghi chú

Mockup: `cong-viec-gon.html` (mở bằng trình duyệt; mục lục A · B · C · D · Panel · Head). Ảnh: `anh/cong-viec-gon-*.png` (24 ảnh).
Dữ liệu bịa: GV Vũ Thu Lan, hôm nay thứ Hai 14/09/2026 (W2 SEP), **20 việc · 3 quá hạn** lấy từ ảnh chủ SP 24/11 + bộ nhỏ TVV (7 việc) + 2 Task không có lớp; Head Nguyễn Khánh Vy: 5 yêu cầu chờ duyệt + 11 việc quản lý.
Bốn phương án sinh từ **một** bộ dữ liệu trong tệp (script cuối tệp) nên luôn cùng việc, cùng thứ tự.

## 1. Khuyến nghị

**Công việc: A · Mỗi dòng một lớp.** **Chờ duyệt: kiểu mở tại dòng (H1).**

- Mã lớp ngắn, đều → thành **một cột thẳng ở mép trái**; quét dọc là biết việc của lớp nào. Tên em dài ngắn khác nhau không làm được việc này.
- Đúng với cả việc theo em (Case, PA) lẫn việc theo lớp (nhập điểm, Báo cáo PH, bàn giao). Ở B, việc theo lớp phải mở đầu bằng "2 em", "4 em" — ô đứng đầu không nói gì.
- Mở ra nhiều em: dòng con thụt dưới cột lớp, nhìn là hiểu "các em này thuộc lớp trên".
- Thấp nhất (cùng B): một dòng chữ mỗi việc. D rõ từng trường nhưng cao hơn 18 % và lặp tên việc ở mỗi dòng; C cao hơn 10 %, khó quét hạn.
- D (khuôn Chờ duyệt) hợp với **màn Chờ duyệt** — ít dòng, mỗi dòng là một quyết định, cần đủ trường; không hợp danh sách 20 việc cần quét nhanh. Nên: Công việc = A + panel 720 (việc dài) · Chờ duyệt = mở tại dòng (việc ngắn). Mỗi danh sách một kiểu mở.

Hướng đã cân và bỏ: ① **gom theo lớp** (đầu nhóm = lớp, dòng = động từ việc) — ít chữ hơn nhưng lật luật NH7 chủ SP chốt 22/11; ② **mã lớp chỉ in một lần cho các dòng liền nhau cùng lớp** — nhóm 1–4 dòng thì gần như trùng A, lại vướng "quá hạn lên đầu".

## 2. Đề bài rút gọn (impeccable `shape`)

- Ai: GV (chính), TVV, Head — máy tính ở trung tâm; 375 để tra nhanh. Chế độ Operate.
- Việc chính: quét "việc gì · lớp nào · em nào · gấp chưa" rồi bấm làm ngay tại chỗ.
- Hướng: mọi dòng **cùng bốn ô cố định** (lớp · ai · một chi tiết · hạn); động từ việc ở đầu nhóm, không lặp trong dòng; không nút trong dòng.
- Giữ nguyên: token màu / phông / dải đầu nhóm / khung panel của v23; tab loại việc; + Task; Lớp của tôi.
- Giả định (không có người hỏi lúc vẽ): mục 8.

## 3. Luật chung cho cả bốn phương án

| Luật | Vẽ thế nào |
|---|---|
| Không cột nút | Cả dòng là một nút; rê = nền nhấn nhạt; đang chọn = nền nhấn nhạt + vạch trái 3 px |
| Nhiều em | "4 em" có mũi tên xuống → bấm dòng mở ra từng em ngay dưới; bấm dòng con → panel |
| Một em | Bấm dòng → panel luôn |
| Đổi trang | "›" ở cuối dòng (Báo cáo PH, Chốt lộ trình → Cuối khoá) |
| Hạn | Một cụm, không chữ "hạn", không ⚠: `quá 19 ngày` (chữ đỏ, nền đỏ nhạt) · ngày vàng khi ≤ 2 ngày · ngày thường |
| Thứ tự | Quá hạn lên đầu nhóm, rồi hạn gần; bỏ dòng chia "Quá hạn / Hạn đến… / Hạn sau…" |
| Chip | A / B / C: ≤ 1 chip mỗi dòng (SOS 2–3). D: thêm ≤ 2 nhãn loại · đợt (đúng khuôn Chờ duyệt) |
| Đầu nhóm | "Thêm PA · 2 việc · 1 quá hạn"; nhóm = động từ việc (Phương án tách thành Thêm PA / Xác nhận PA / Ghi Mini Test / Ghi kết quả PA) |
| Cỡ | Chữ 14 px, dòng 52 px (dòng con 48), mã tuần một dòng, tên HV không cắt |
| Bề rộng | Danh sách 680 px **không co** khi panel mở; panel 720 px che đúng cột "Lớp của tôi" |

## 4. So bốn phương án (số đo từ trang thật, Playwright 1440 / 375)

| | A · một lớp | B · một người | C · thẻ 2 cột | D · khuôn Chờ duyệt |
|---|---|---|---|---|
| Đứng đầu dòng | Mã lớp (đậm) | Tên em / "n em" (đậm) | Mã lớp nhỏ, tên em to ở giữa | Vòng chữ đầu + tên em + mã lớp (hoặc ô lớp + mã lớp) |
| Dòng chữ / việc ở 1440 | 1 | 1 | 3 | 2 |
| Dòng chữ / việc ở 375 | 2 | 2 | 3 | 2–3 |
| Cao 20 việc · 12 nhóm (1440, gập) | 1 802 px | 1 802 px | 1 987 px | 2 122 px |
| Quy ra 16 việc (× 0,8) | ≈ 1 440 px | ≈ 1 440 px | ≈ 1 590 px | ≈ 1 700 px |
| Tab Case 9 việc · 6 nhóm (1440) | 816 px | 816 px | 873 px | 960 px |
| Việc thấy trong màn 900 khi panel mở | 8 | 8 | 6 | 6 |
| Cao 13 việc ở 375 | 1 238 px | 1 232 px | 1 662 px | 1 409 px |
| Mạnh | Cột lớp thẳng, quét nhanh; hợp cả việc theo lớp lẫn theo em; dòng con thụt rõ | Tên em nổi nhất — hợp tab Case; 375 gọn | Mỗi việc một khối; chạm ngón tay dễ | Mỗi trường một chỗ; dòng tự đọc được không cần nhìn đầu nhóm; có chỗ cho loại · đợt · người liên quan |
| Yếu | Tên em không đậm | Việc theo lớp mở đầu bằng "2 em / 4 em"; mã lớp xám, xa mắt | Cao dù 2 cột; hạn nằm hai cột khó quét; nhóm lẻ trống nửa hàng; thẻ mở ra chiếm cả hai cột | Cao nhất; lặp tên việc ở mọi dòng (đã có ở đầu nhóm); 3–4 điểm nhìn mỗi dòng (vòng tròn, nhãn, hạn, người) — "nhiều chữ" hơn A |

### Điểm critique impeccable (rà độc lập bằng ảnh, Nielsen 10 tiêu chí, bỏ tiêu chí 9 vì mockup tĩnh)

| # | Tiêu chí | A | B | C | D |
|---|---|---|---|---|---|
| 1 | Trạng thái hệ thống | 3 | 3 | 3 | 3 |
| 2 | Khớp thực tế | 3 | 2 | 3 | 3 |
| 3 | Kiểm soát, lối thoát | 3 | 3 | 3 | 3 |
| 4 | Nhất quán | 3 | 2 | 2 | 3 |
| 5 | Ngăn lỗi | 3 | 3 | 3 | 3 |
| 6 | Nhận ra, không phải nhớ | 3 | 3 | 3 | 3 |
| 7 | Hiệu quả | 3 | 3 | 2 | 3 |
| 8 | Tối giản | 3 | 3 | 2 | 2 |
| 10 | Trợ giúp | 2 | 2 | 2 | 2 |
| | **Tổng / 36** | **26** (72 %, Tốt) | **24** (67 %) | **23** (64 %) | **25** (69 %) |

Điểm A / B / C chấm ở lượt một (trước khi sửa), D ở lượt hai; cả hai lượt người rà chọn **A** cho Công việc và **H1 (mở tại dòng)** cho Chờ duyệt. Vấn đề chính được nêu: B — cột đầu lúc là số lúc là tên (P1), dòng con khó phân biệt (P2) · C — lưới vỡ khi mở, đọc zíc-zắc, không quét được theo hạn (P1), tốn chỗ (P2) · A — mã lớp và tên em cùng đậm (P2, đã sửa), chi tiết ở 375 lệch chỗ (P2, đã sửa) · D — lặp tên việc ở mọi dòng (P1), tới 3 nhãn một dòng (P2), mã lớp lúc đứng đầu lúc đứng sau tên (P2); D dài hơn A 17 % ở 1440, mỗi dòng khoảng 8 mẩu chữ so với 4 của A.

Đã sửa theo lượt rà một: A hạ tên em xuống chữ thường (chỉ mã lớp đậm) · A ở 375 dòng hai luôn "tên · chi tiết" bên trái · B / C dòng con thụt + nền rõ hơn · nút ⓘ ⋯ ✕ cùng cỡ 36, cách đều · panel một cột gập "Đã có điểm" · panel Mock đưa em còn thiếu lên trên · chân panel đếm theo "em" như danh sách · thanh tab 375 mờ dần ở mép phải (còn cuộn). Lượt hai: cột mã lớp rộng 124 px cho mã dài ("MB Pre FOU 03") · Chờ duyệt khi Từ chối vẫn thấy chi tiết yêu cầu phía trên ô lý do · sửa khoảng trống ở nút duyệt lô.
Chưa sửa, ghi lại: tiêu đề panel ở 375 xuống hai dòng (kiểu v23) · ngày vàng ở chế độ sáng gần màu ngày thường (token v23) · thẻ C có "›" làm ngày lệch 17 px.

## 5. Khung panel chung 720 (bản nháp)

- Đầu **một dòng**: tên việc · em · lớp · hạn (cùng màu hạn như ở dòng việc) · ⓘ · ⋯ · ✕. Thân cuộn. Chân lưu cố định: trạng thái lưu bên trái, **Lưu** + **Lưu · việc tiếp ›** bên phải.
- **Nhập điểm Pronunciation** (P1, P3): tên · ô `18 /25` (104 × 44, số 16 px, "/25" mờ trong ô) · kết quả ngay cạnh; 2 em còn thiếu ở trên; "Đã có điểm · 10 em" ở dưới, **mở sẵn, bấm để gập**. Ô chấm sát tên, không còn nằm tít bên phải.
- **Nhập điểm Mock** (P2): L R W1 W2 S + Overall vừa trong 680 px (cột 76, ô 64 × 44); cột GV chấm là ô, cột người khác chấm là số xám; em còn thiếu ở trên, "Đã đủ điểm" ở dưới. Nhiều cột hơn thì cuộn ngang **trong lưới**, cột tên dính.
- **Xác nhận Case** (A2 / B2 / C2 / D2): hàng Phụ trách · Theo dõi → nguồn Case (điểm, ngưỡng, lần trước) → Nhóm nguyên nhân → Mô tả → Phương án → Lịch sử (gập).
- 375: panel toàn màn, cột Kết quả chỉ còn dấu ✓ / ✗; chân chỉ một nút chính.
- Đối chiếu ảnh thật `docs/anh/ra-panel-cv/`: panel lưới đang 1 080 px, panel khác 764–835 px, nhiều panel trống nửa dưới. Khung 720 phủ được: lưới ≤ 6 cột vừa khít, nhiều hơn thì cuộn trong lưới; form một cột dư chỗ.
- **Chỗ cần chủ SP quyết:** việc nhỏ (P1 chỉ 2 ô chấm) trong khung 720 cao hết màn thì hoặc để danh sách "Đã có điểm" mở sẵn cho kín panel (đang vẽ), hoặc gập lại và nửa dưới panel trống. Hai lượt rà độc lập cho hai ý ngược nhau (lượt một: gập cho bớt chữ; lượt hai: gập thì trống 85 %, lời chê "panel to quá" còn rõ hơn). Người rà gợi ý hai mức rộng (≈ 540–560 cho điểm một cột / Case, 720 cho lưới nhiều cột); chủ SP đã chốt một khung nên **giữ 720**.

## 6. Head: Chờ bạn duyệt + Việc quản lý

| | H1 / H3 · mở tại dòng | H2 · giữ panel 720 |
|---|---|---|
| Duyệt một yêu cầu rõ ràng | 1 bấm (nút **Duyệt** ngay trên dòng) | 2 bấm (mở panel → Duyệt) |
| Xem chi tiết rồi duyệt | Bấm dòng → chi tiết mở ngay dưới, nút vẫn ở dòng | Bấm dòng → panel |
| Từ chối | Bấm **Từ chối** → ô lý do mở tại chỗ → Gửi từ chối | Trong panel |
| Duyệt lô | Tick nhiều dòng → "Duyệt n yêu cầu" | Chưa vẽ ô tick (cần thêm cột) |
| Khung phải khi chưa chọn | Không có khung phải — danh sách dùng hết bề ngang | Nửa màn trống |
| Một dòng có | ô tick · vòng chữ đầu · tên · lớp · việc · ≤ 2 nhãn · người gửi · hạn · Từ chối · Duyệt | lớp · em · việc · hạn |

- Hạn **một kiểu** như Công việc (thay chip "quá hạn 6 ngày" / chữ "hạn 14/09/2026" / hộp vàng "Còn 1 ngày"). Mỗi dòng **2 thao tác** (bỏ "Mở ›" — bấm dòng là mở; link hồ sơ nằm trong phần chi tiết). Tên người gửi một dòng, cố định cột.
- Thẻ mới "Sửa cấp bậc · R2 → R1" (N70) vào nhóm Ý thức, cùng khuôn.
- Từ chối ở H1: ô lý do mở ngay dưới chi tiết yêu cầu (vẫn thấy vi phạm / bằng chứng khi viết lý do). Sau Duyệt / Từ chối cần toast Hoàn tác ngắn (chưa vẽ — làm lúc code, theo luật không khoá cứng).
- Khuyến nghị **H1**: yêu cầu duyệt là việc ngắn, phần lớn quyết được ngay trên dòng; đúng gợi ý chủ SP ("dàn trải ra, 2 nút duyệt – từ chối rõ, bấm vào cho expand").
- **Việc quản lý** (H4 có việc · H5 rỗng): cùng khuôn A; không còn Họp đơn vị; lối "Vận hành ›" ở đầu nhóm Vận hành; rỗng = "Hết việc quản lý" + "Còn: Chờ bạn duyệt · 5 yêu cầu" + Việc tiếp › + Vận hành ›.

## 7. Thao tác TRƯỚC → SAU

| Thao tác | Trước (ảnh chủ SP 24/11 + ảnh thật `ra-panel-cv`) | Sau |
|---|---|---|
| Mở việc một em (Xác nhận Case, Thêm PA, Xác nhận PA, Ghi Mini Test) | Nút riêng mỗi loại ở cột phải | Bấm cả dòng → panel |
| Việc nhiều em làm riêng từng em (Mô tả Case 4 em, vi phạm 3 em, Mini Test 2 em) | Nút "4 em ▾" | Bấm cả dòng → mở ra từng em → bấm em → panel |
| Nhập điểm / Ghi kết quả PA / Bàn giao môn (cả nhóm trong một lưới) | Nút "Nhập điểm" / "Bàn giao môn P"… | Bấm cả dòng → panel lưới 720 |
| Viết Báo cáo PH · Chốt lộ trình | Nút "Viết ›" · "Cuối khoá ›" | Bấm cả dòng (có "›") → trang |
| Xem hồ sơ em / lớp | Link trong dòng | Link ở **đầu panel** (tên em, mã lớp) — thêm một bấm; lý do: cả dòng là một nút, không lồng link |
| Biết việc quá hạn | Dòng chia "Quá hạn" + chip "quá hạn n ngày" | Quá hạn lên đầu nhóm + cụm đỏ nền đỏ nhạt + "m quá hạn" ở đầu nhóm |
| Gia hạn | Ô Hạn trong khối Phụ trách | ⋯ ở đầu panel ([XM2]) |
| Duyệt / Từ chối yêu cầu | Duyệt · Từ chối… · Mở › trên thẻ; khung phải | H1: Từ chối · Duyệt trên dòng, bấm dòng mở chi tiết; không khung phải |
| Duyệt lô (tick) | Có | Giữ (H1) |
| Họp đơn vị | Link ở tab Việc quản lý | Bỏ (chủ SP 24/11) |
| + Task · + Giao việc · Của tôi / Của GV / Tất cả · Lọc thêm · tab · Lớp của tôi · ⓘ · ⋯ · ✕ · Lưu · Lưu · việc tiếp › · 375 chạm cả dòng | Có | Giữ |

## 8. Chỗ tự quyết khi vẽ — cần PTA / chủ SP xem ([XM])

- **[XM1]** "n em" **không** mũi tên (nhập điểm, Ghi kết quả PA, Bàn giao, Báo cáo PH): cả nhóm làm trong một lưới nên bấm là mở lưới, không mở ra từng em — mở ra rồi vẫn vào cùng một lưới là thừa một bấm. Mũi tên chỉ có khi mỗi em một panel riêng.
- **[XM2]** Hạn chỉ hiện ở đầu panel; khối Phụ trách bỏ ô Hạn (đỡ lặp), Gia hạn vào ⋯.
- **[XM3]** Giữ ⋯ ở đầu panel (đề bài chỉ ghi ⓘ · ✕) để không mất thao tác cũ.
- **[XM4]** Hạn viết đủ `16/09/2026` theo NH4. Bỏ năm (`16/09`) bớt 5 ký tự mỗi dòng — phải đổi NH4, chưa đổi.
- **[XM5]** Tên lựa chọn "Nhóm nguyên nhân", "Phương án" trong panel Case và nội dung chi tiết yêu cầu duyệt là minh hoạ; khi code lấy đúng trường web đang có.
- **[XM6]** Dải đầu nhóm giữ kiểu v23 (duyệt 22/11). 12 dải cho 20 việc hơi nặng — muốn nhẹ hơn: hạ dải còn 40 px, tên nhóm 14 px.
- **[XM7]** Dòng vừa SOS 2–3 vừa quá hạn có hai điểm màu (NH1 ghi một) — hiếm, giữ cả hai.
- **[XM8]** Việc không có lớp (Task): tên việc chiếm chỗ ô lớp + ô em (A, B); thẻ C để trống góc lớp; D dùng ô vuông có dấu ✓.
- **[XM9]** Khung 1 của A / B / C / D nối 4 tab chỉ để so đủ 20 việc; web vẫn mỗi tab một phần. Khi panel mở, danh sách cuộn riêng (đáy mờ dần).
- **[XM10]** Head ở tab Việc quản lý (H4) chưa chọn việc: nửa phải để trống hẳn, bỏ ô nét đứt "Chọn một việc ở danh sách" — Head không có "Lớp của tôi". Cần PTA quyết có đặt gì ở đó không.
- **[XM11]** H2 (giữ panel) chưa vẽ ô tick duyệt lô; nếu chọn H2 phải thêm cột tick vào dòng.
- **[XM13]** Dòng Chờ duyệt (H1) giữ thứ tự người trước + vòng chữ đầu như màn chủ SP khen, khác thứ tự lớp trước của A. Muốn đồng bộ tuyệt đối thì đổi H1 sang lớp · em · việc · người gửi · hạn · nút — chờ chủ SP chọn A hay D rồi quyết.
- **[XM14]** Head đổi tab thì bề rộng danh sách đổi: Chờ duyệt rộng hết trang (H1), Việc quản lý 680 + chỗ cho panel (H4). Hệ quả của "mỗi danh sách một kiểu mở".
- **[XM12]** D lặp tên việc ở dòng dưới ("Xác nhận Case · Pronunciation") dù đã có ở đầu nhóm — vẽ đúng khuôn Chờ duyệt PTA mô tả; bỏ tên việc thì D gần thành B.
- Luật craft của impeccable chê vạch trái màu > 1 px; ở đây là luật dự án (G14 dòng đang chọn, dải đầu nhóm v23) nên giữ.

## 9. Lời chủ SP 24/11 → đã đáp ở đâu

| Lời chủ SP | Đáp |
|---|---|
| "Panels công việc to quá, nhất là panels chấm test… ô chấm có mỗi một tí" | Panel 720 thay 1 080 px; P1 ô chấm sát tên, 104 × 44; P2 lưới 6 cột vừa khung |
| "khung chung được thì tốt, to thôi nhưng không nên to quá ảnh hưởng đến danh sách bên trái, chữ chồng chéo" | Một khung 720 cho mọi panel (A2, P1, P2, H2); danh sách 680 không co → không dòng nào bị ép; máy dò tràn chữ: 0 lỗi ở 24 khung |
| "bên trái vẫn convoluted, nhiều chữ quá, giảm tải, cần thông tin quan trọng thôi" | A: mỗi dòng 4 ô — lớp · ai · một chi tiết · hạn; bỏ động từ lặp, bỏ chữ "hạn", bỏ dòng chia hạn, ≤ 1 chip |
| "gọn gàng và đồng bộ hơn… kể cả nút ở bên phải, lúc là cái nọ lúc là cái kia" | Bỏ hẳn cột nút ở Công việc; mọi dòng cùng ô, cùng chỗ |
| "có khi không cần nút gì luôn? nhiều thì expand ra nhiều HV / vấn đề, 1 thì bấm cái ra panel luôn?" | Đúng vậy ở cả bốn: khung 1 có dòng Mô tả Case đang mở ra; [XM1] cho việc làm chung một lưới |
| "có sợ không rõ công việc không?" | Tên việc là đầu nhóm (16 px đậm, kèm số việc · quá hạn) và là tiêu đề panel |
| "lúc thì là tên HV, lúc thì là test, lúc thì là cái nọ cái kia" | A: luôn mã lớp trước · B: luôn em trước · C: luôn cùng ô thẻ · D: luôn người / lớp ở tầng trên, việc ở tầng dưới |
| "làm nó rộng rãi ra hơn 1 chút" | Dòng 52 px, một dòng chữ, nhóm cách nhau 12 px; danh sách rộng 680 (v23: 556) |
| "nhìn nhiều chữ sợ quá" | Số dòng chữ mỗi việc: mục 4; không câu giải thích nào trên màn |
| "Phần bộ duyệt… rộng rãi và trường thông tin rất rõ ràng… có thể học tập cho phần công việc khác" | Phương án D vẽ đúng khuôn đó cho Công việc, có số đo để so |
| "làm có tính đồng bộ hơn… hoặc làm kiểu khác hẳn là không cần mở panel duyệt, nó dàn trải ra và 2 nút duyệt – từ chối rõ ràng, bấm vào nó cho expand" | H1 / H3 (mở tại dòng) so với H2 (panel); hạn một kiểu, 2 thao tác mỗi dòng |
| Tab Việc quản lý: "rất là hạn chế… tạm thời bỏ hẳn phần họp đơn vị" | H4 / H5: không còn Họp đơn vị; rỗng có trạng thái rõ + lối đi tiếp |

## 10. Skill đã chạy

- `impeccable`: `context` → `shape` (mục 2) → `layout` (lưới 4 ô, nhịp 52 / 48 / 12) → `critique` (mục 4, rà độc lập bằng ảnh, hai lượt) + `detect`: 0 lỗi phần web; chỉ báo vạch trái 3 px (luật dự án) và màu của phần đọc mockup.
- `ui-ux-pro-max` (`--domain ux`): nhãn gọn không xuống dòng, tên là chữ thiết yếu không cắt, bảng hẹp thì cuộn ngang trong khung — đã áp.
- `frontend-design`: dồn điểm nhấn vào một chỗ (cột đứng đầu thẳng hàng), còn lại yên; chia ô thay cho chuỗi nối bằng dấu chấm giữa.
- `web-design-guidelines`: dòng việc là `<button>`, `aria-expanded` cho dòng mở ra, nút chỉ có biểu tượng đều có `aria-label`, biểu tượng trang trí `aria-hidden`, số dùng `tabular-nums`, có `:focus-visible`. Để lúc code: ô điểm là `<input inputmode="decimal">` có nhãn, trạng thái lưu `aria-live`, URL giữ việc đang mở, Từ chối / Duyệt có Hoàn tác.
