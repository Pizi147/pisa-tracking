# v24 · Công việc gọn — ghi chú

Mockup: `cong-viec-gon.html` (mở bằng trình duyệt; mục lục A · Vai khác · Panel · Chờ duyệt). Ảnh: `anh/cong-viec-gon-*.png` (16 ảnh).
Dữ liệu bịa, hôm nay thứ Hai 14/09/2026 (W2 SEP): GV Vũ Thu Lan 29 việc · 3 quá hạn · TVV Phan Mai 8 việc · Head Nguyễn Khánh Vy 5 yêu cầu chờ duyệt + 16 việc · Admin 5 việc.

## 1. Chủ SP đã chốt (24/11)

- **Khuôn A "mỗi dòng một lớp"** cho Công việc; bỏ B · C · D (D chỉ còn là gợi ý cho màn Chờ duyệt).
- "các trường thông tin rõ hơn chút nữa" → lớp **đậm** · tên em **đậm vừa** · chi tiết **mờ** · hạn số đều nét, sát mép phải.
- "không để 'quá hạn', để ngày hạn luôn và màu tương ứng thôi, không cần giải thích color code" → hạn luôn là ngày `dd/mm/yyyy`, chỉ tô màu chữ (đỏ quá hạn · vàng còn ≤ 2 ngày · thường); không "quá n ngày", không nền, không chú thích màu. "m quá hạn" vẫn ghi bằng chữ ở đầu nhóm và đầu trang.
- "cố gắng làm đẹp và cân đối các hàng cột" + "cứ hay có kiểu thừa một đống ở cột cuối, xong co rúm lại" → **luật cột** (mục 2).
- Một khung panel chung 720 px.

## 2. Luật cột — một cách cho mọi danh sách / lưới trong v24

1. **Mọi dòng dùng chung một bộ cột** (CSS `subgrid`): dòng thường, dòng con, dòng ở nhóm khác đều thẳng cột tuyệt đối.
2. **Cột chia hết bề ngang**: cột chữ co giãn theo phần (không hẹp hơn chữ dài nhất → tên HV không bao giờ cắt); cột số / ô nhập **rộng bằng nhau**.
3. **Cột cuối căn phải, sát lề chuẩn** của khung (dòng việc 20 px · lưới điểm 14 px · Chờ duyệt 16 px). Không dồn cột về trái rồi để cột cuối thừa.

| Chỗ | Cột | Số đo Playwright (1440) |
|---|---|---|
| Danh sách việc (A1, 33 dòng kể cả dòng con) | lớp ≥ 104 · ai 5 phần · chi tiết 4 phần · hạn vừa chữ | lớp 104 · ai 232 · chi tiết 186 · hạn 98 px; lệch từng cột **0 px**; hạn cách mép khung **20 px** |
| Việc quản lý (V4, có mã dài "MB Pre FOU 03") | như trên, cột lớp tự nới | lớp 127 · ai 220 · chi tiết 176 · hạn 98 px; lệch 0 px |
| Lưới P1 · Pronunciation một cột | tên 2 phần · mỗi cột điểm 1 phần | tên 338,5 · Pronunciation 169,3 · Kết quả 169,3 px (lệch 0); tâm ô nhập lệch 0; Kết quả cách mép **14 px** |
| Lưới P2 · Mock 6 cột | tên 2 phần (≥ tên dài nhất) · 6 cột bằng nhau | tên 199,8 · L R W1 W2 S Overall mỗi cột 79,5 px (lệch 0); Overall cách mép **14 px** |
| Lưới P3 · 375 | như P1 | tên 175,9 · 2 cột 82,5 px |
| Chờ duyệt mở tại dòng (H1) | chọn · hình · người 6 phần · việc 6 · nhãn 5 · người gửi 5 · hạn · mũi tên · nút | người 258 · việc 258 · nhãn 215 · người gửi 215 · hạn 77 px; lệch 0 px; nút cách mép **16 px** |
| Lớp của tôi | 24 % · 22 % · còn lại · 14 % | 165 · 151 · 274 · 96 px; cột Việc cách mép **20 px** |
| Nút ⓘ ⋯ ✕ đầu panel | ba ô 36 px | tâm cách nhau đúng 36 px, thẳng hàng với tiêu đề |

Máy dò tự viết (chạy trên 16 khung): chữ tràn ô · chữ xuống dòng lạ · phần tử lòi khung · hai ô chữ cách nhau < 6 px → **0 lỗi**, trừ tiêu đề panel ở 375 xuống hai dòng (kiểu v23, giữ).

## 3. Khuôn dòng việc A

| Luật | Vẽ thế nào |
|---|---|
| Bốn ô | mã lớp (đậm) · em hoặc "n em" (đậm vừa) · một chi tiết (mờ) · hạn (sát mép phải) |
| Không cột nút | Cả dòng là một nút; rê = nền nhấn nhạt; đang chọn = nền nhấn nhạt + vạch trái 3 px |
| Nhiều em | "4 em" có mũi tên → bấm dòng mở ra từng em ngay dưới, **thẳng cột "ai"**; bấm dòng con → panel |
| Một em | Bấm dòng → panel luôn |
| Đổi trang | "›" nằm trong lề phải (Báo cáo PH, Chốt lộ trình) — không đẩy ngày lệch cột |
| Thứ tự | Quá hạn lên đầu nhóm, rồi hạn gần; không còn dòng chia "Quá hạn / Hạn đến… / Hạn sau…" |
| Chip | ≤ 1 chip mỗi dòng: chỉ SOS 2–3, sau tên em |
| Đầu nhóm | "Thêm PA · 2 việc · 1 quá hạn"; nhóm = động từ việc |
| Việc không có lớp | Tên việc chiếm chỗ ô lớp + ô em (Task Vận hành) |
| Cỡ | Chữ 14 px · dòng 48 px · tên HV không cắt · mã tuần một dòng |
| Bề rộng | 1440: danh sách 680 + panel 720 · 1280: danh sách 520 + panel 720 · danh sách **không đổi bề rộng** khi mở panel |
| Danh sách < 600 px (1280, 375) | Mỗi việc hai tầng: lớp + hạn · tên + chi tiết (cùng một quy tắc cho 1280 và 375) |

Đủ loại việc đã vẽ — GV (A1): Nhập điểm · Chấm Speaking · Mô tả Case · Xác nhận Case · Thêm PA · Xác nhận PA · Ghi Mini Test · Ghi kết quả PA · Xử lý vi phạm · Đã thực hiện · Khai cấp bậc · Vi phạm bị trả lại · Tình hình học tập · Phối hợp SOS · Báo PH kết quả Test · Bàn giao lớp · Bàn giao môn · Báo cáo PH · Task không lớp. TVV (V1): Báo PH · Sau thi · Thi thật · Chốt ngày thi · Bổ sung hồ sơ. Head (V2, V4): Chọn người phụ trách · Phân công GV môn · Phối hợp SOS · Báo PH kết quả Test · Chốt lộ trình · Xét lại lộ trình · Bổ sung hồ sơ · Vận hành. Admin (V3): Điểm chưa nhập · Vận hành.

## 4. Khung panel chung 720

- Đầu **một dòng**: tên việc · em · lớp · hạn (cùng màu như ở dòng việc) · ⓘ · ⋯ · ✕. Thân cuộn. Chân lưu cố định: trạng thái lưu bên trái, **Lưu** + **Lưu · việc tiếp ›** bên phải.
- **Nhập điểm Pronunciation** (P1, P3): tên trái · ô `18 /25` (104 × 44) giữa cột · Kết quả sát mép phải. 2 em còn thiếu ở trên, "Đã có điểm · 10 em" ngay dưới **trong cùng lưới** (thẳng cột, panel không trống).
- **Nhập điểm Mock** (P2): L R W1 W2 S Overall sáu cột bằng nhau; cột GV chấm là ô 68 × 44, cột người khác chấm là số xám; em còn thiếu ở trên, "Đã đủ điểm" ở dưới. Nhiều cột hơn bề ngang thì cuộn ngang **trong lưới**.
- **Xác nhận Case** (A2, A3): hàng Phụ trách · Theo dõi → nguồn Case (điểm, ngưỡng, lần trước) → Nhóm nguyên nhân → Mô tả → Phương án → Lịch sử (gập).
- 375: panel toàn màn; cột Kết quả rút còn "KQ" với dấu ✓ / ✗; chân một nút chính.
- Đối chiếu ảnh thật `docs/anh/ra-panel-cv/`: hiện có ba bề rộng (1 080 · 835 · 764–794 px) và panel lưới ép danh sách còn ~235 px. Khung 720 thay cả ba; lưới ≤ 6 cột vừa khít.

## 5. Head: Chờ bạn duyệt + Việc quản lý

| | H1 / H3 · mở tại dòng | H2 · giữ panel 720 |
|---|---|---|
| Duyệt một yêu cầu rõ ràng | 1 bấm (nút **Duyệt** ngay trên dòng) | 2 bấm (mở panel → Duyệt) |
| Xem chi tiết rồi quyết | Bấm dòng → chi tiết mở ngay dưới, nút vẫn ở dòng | Bấm dòng → panel |
| Từ chối | Bấm **Từ chối** → ô lý do mở ngay dưới chi tiết → Gửi từ chối | Trong panel |
| Duyệt lô | Tick nhiều dòng → "Duyệt n yêu cầu" | Chưa vẽ ô tick |
| Khung phải khi chưa chọn | Không có — danh sách dùng hết bề ngang | Nửa màn trống |

- Hạn **một kiểu** như Công việc (thay chip "quá hạn 6 ngày" / chữ "hạn 14/09/2026" / hộp vàng "Còn 1 ngày"). Mỗi dòng **2 thao tác** (bỏ "Mở ›" — bấm dòng là mở; link hồ sơ trong phần chi tiết). Người gửi một dòng, cố định cột.
- Thẻ mới "Sửa cấp bậc · R2 → R1" (N70) nằm ở nhóm Ý thức, cùng khuôn.
- Khuyến nghị **H1**: yêu cầu duyệt là việc ngắn, phần lớn quyết ngay trên dòng; đúng gợi ý chủ SP ("dàn trải ra, 2 nút duyệt – từ chối rõ, bấm vào cho expand"). Công việc = panel 720 (việc dài) · Chờ duyệt = mở tại dòng (việc ngắn).
- **Việc quản lý** (V4 có việc · V5 rỗng): khuôn A; không còn Họp đơn vị; lối "Vận hành ›" ở đầu nhóm Vận hành; rỗng = "Hết việc quản lý" + "Còn: Chờ bạn duyệt · 5 yêu cầu" + Việc tiếp › + Vận hành ›.

## 6. Thao tác TRƯỚC → SAU

| Thao tác | Trước (ảnh thật `docs/anh/ra-panel-cv/` 24/11) | Sau |
|---|---|---|
| Mở việc một em (Xác nhận Case, Thêm PA, Xác nhận PA, Ghi Mini Test…) | Nút riêng mỗi loại ở cột phải | Bấm cả dòng → panel |
| Việc nhiều em, mỗi em một panel (Mô tả Case 4 em, vi phạm 3 em…) | Nút "4 em ▾" mở khay | Bấm cả dòng → mở ra từng em → bấm em → panel |
| Nhập điểm / Ghi kết quả PA / Bàn giao / Khai cấp bậc lô (cả nhóm một lưới) | Nút "Nhập điểm"… | Bấm cả dòng → panel lưới 720 |
| Viết Báo cáo PH · Chốt lộ trình | Nút "Viết ›" · "Cuối khoá ›" | Bấm cả dòng (có "›") → trang |
| Xem hồ sơ em / lớp | Link trong dòng | Link ở **đầu panel** (tên em, mã lớp) — thêm một bấm; lý do: cả dòng là một nút, không lồng link |
| Biết việc quá hạn | Dòng chia "Quá hạn" + chip "quá hạn n ngày" | Quá hạn lên đầu nhóm + ngày đỏ + "m quá hạn" ở đầu nhóm |
| Gia hạn | Ô Hạn trong khối Phụ trách | ⋯ ở đầu panel ([XM2]) |
| Duyệt / Từ chối yêu cầu | Duyệt · Từ chối… · Mở › trên thẻ; khung phải | H1: Từ chối · Duyệt trên dòng, bấm dòng mở chi tiết |
| Duyệt lô (tick) | Có | Giữ (H1) |
| Họp đơn vị | Link ở tab Việc quản lý | Bỏ (chủ SP 24/11) |
| Lọc thêm · + Task · + Giao việc · Của tôi / Của GV / Tất cả · tab · Lớp của tôi · ⓘ · ⋯ · ✕ · Lưu · Lưu · việc tiếp › · 375 chạm cả dòng | Có | Giữ |

## 7. Chỗ tự quyết khi vẽ — cần PTA / chủ SP xem ([XM])

- **[XM1]** "n em" **không** mũi tên (nhập điểm, Ghi kết quả PA, Bàn giao, Khai cấp bậc, Báo cáo PH): cả nhóm làm trong một lưới nên bấm là mở lưới — mở ra từng em rồi vẫn vào cùng một lưới là thừa một bấm. Mũi tên chỉ có khi mỗi em một panel riêng.
- **[XM2]** Hạn chỉ hiện ở đầu panel; khối Phụ trách bỏ ô Hạn (đỡ lặp), Gia hạn vào ⋯.
- **[XM3]** Giữ ⋯ ở đầu panel (đề bài chỉ ghi ⓘ · ✕) để không mất thao tác cũ.
- **[XM4]** 1280: panel vẫn 720, danh sách còn 520 px → dòng hai tầng, **kể cả khi chưa mở panel** (để mở panel không nhảy bố cục). Cách khác: 1280 chưa mở panel dùng dòng một tầng 680 px, mở panel thì đổi sang hai tầng.
- **[XM5]** Tên lựa chọn "Nhóm nguyên nhân", "Phương án" trong panel Case và nội dung chi tiết yêu cầu duyệt là minh hoạ; khi code lấy đúng trường web đang có.
- **[XM6]** Dải đầu nhóm giữ kiểu v23 (duyệt 22/11). Nhóm một việc thì dải + dòng hơi nặng — muốn nhẹ hơn: hạ dải còn 40 px, tên nhóm 14 px.
- **[XM7]** Bỏ dấu khác màu cho quá hạn theo lời chủ SP (NH4 cũ đòi thêm nền / viền). Vẫn không chỉ dựa vào màu: "m quá hạn" ghi bằng chữ ở đầu nhóm + đầu trang, và quá hạn luôn đứng đầu nhóm. Cần sửa NH4 trong `DESIGN.md` khi code.
- **[XM8]** Khung A1 nối 4 tab chỉ để thấy đủ loại việc; web vẫn mỗi tab một phần. Khi panel mở, danh sách cuộn riêng (đáy mờ dần).
- **[XM9]** Head ở tab Việc quản lý (V4) chưa chọn việc: nửa phải để trống hẳn, bỏ ô nét đứt "Chọn một việc ở danh sách" — Head không có "Lớp của tôi". Đổi tab Chờ duyệt ↔ Việc quản lý thì bề rộng danh sách đổi (hết trang ↔ 680).
- **[XM10]** Dòng Chờ duyệt (H1) giữ người trước + vòng chữ đầu như màn chủ SP khen; khác thứ tự lớp trước của A. Muốn đồng bộ tuyệt đối thì đổi H1 sang lớp · em · việc · người gửi · hạn · nút.
- **[XM11]** H2 (giữ panel) chưa vẽ ô tick duyệt lô.
- **[XM12]** Sau Duyệt / Từ chối cần toast Hoàn tác ngắn (chưa vẽ; luật không khoá cứng).
- **[XM13]** P1: "Đã có điểm · 10 em" để mở trong cùng lưới. Gập lại thì ít chữ hơn nhưng panel trống gần hết; hai lượt rà độc lập cho hai ý ngược nhau.
- Luật craft của impeccable chê vạch trái màu > 1 px; ở đây là luật dự án (G14 dòng đang chọn, dải đầu nhóm v23) nên giữ.

## 8. Lời chủ SP 24/11 → đã đáp ở đâu

| Lời chủ SP | Đáp |
|---|---|
| "Panels công việc to quá, nhất là panels chấm test… ô chấm có mỗi một tí" | Panel 720 thay 1 080 px (P1, P2); ô chấm 104 × 44 / 68 × 44 |
| "khung chung được thì tốt, to thôi nhưng không nên to quá ảnh hưởng đến danh sách bên trái, chữ chồng chéo" | Một khung 720 cho mọi panel (A2, P1, P2, H2); danh sách không co khi mở panel; máy dò chữ đè / tràn: 0 lỗi |
| "bên trái vẫn convoluted, nhiều chữ quá, giảm tải, cần thông tin quan trọng thôi" | Mỗi dòng 4 ô, một dòng chữ; bỏ động từ lặp, bỏ chữ "hạn", bỏ dòng chia hạn, ≤ 1 chip |
| "gọn gàng và đồng bộ hơn… kể cả nút ở bên phải, lúc là cái nọ lúc là cái kia" | Bỏ hẳn cột nút; mọi dòng cùng ô, cùng chỗ, ở mọi vai (A1, V1–V4) |
| "có khi không cần nút gì luôn? nhiều thì expand ra nhiều HV / vấn đề, 1 thì bấm cái ra panel luôn?" | Đúng vậy: A1 có dòng Mô tả Case đang mở ra; [XM1] cho việc làm chung một lưới |
| "có sợ không rõ công việc không?" | Tên việc là đầu nhóm (16 px đậm, kèm số việc · quá hạn) và là tiêu đề panel |
| "lúc thì là tên HV, lúc thì là test, lúc thì là cái nọ cái kia" | Luôn mã lớp trước, rồi em / số em, rồi chi tiết, rồi hạn |
| "làm nó rộng rãi ra hơn 1 chút" | Dòng 48 px một dòng chữ; nhóm cách nhau 12 px; danh sách 680 (đang chạy ~440, bị ép còn ~235 khi mở panel lưới) |
| "chọn A, các trường thông tin rõ hơn chút nữa" | Mục 1, 3: ba mức đậm + cột thẳng |
| "không để 'quá hạn', để ngày hạn luôn và màu tương ứng thôi, không cần giải thích color code" | Hạn chỉ là ngày tô màu ở mọi khung, kể cả đầu panel và Chờ duyệt; không chú thích |
| "cố gắng làm đẹp và cân đối các hàng cột" · "thừa một đống ở cột cuối, xong co rúm lại" | Mục 2: luật cột + số đo; P1 đã vẽ lại |
| "Phần bộ duyệt… rộng rãi và trường thông tin rất rõ ràng… hoặc làm kiểu khác hẳn là không cần mở panel duyệt, nó dàn trải ra và 2 nút duyệt – từ chối rõ ràng, bấm vào nó cho expand" | H1 / H3 (mở tại dòng) so với H2 (panel) |
| Tab Việc quản lý: "rất là hạn chế… tạm thời bỏ hẳn phần họp đơn vị" | V4 / V5: không còn Họp đơn vị; rỗng có trạng thái rõ + lối đi tiếp |

## 9. Đã cân rồi bỏ (để khỏi làm lại)

Vẽ thử đủ B "mỗi dòng một người", C "thẻ 2 cột", D "khuôn Chờ duyệt" trên cùng 20 việc (ảnh ở lịch sử git của nhánh, commit `814838844`):

| | A | B | C | D |
|---|---|---|---|---|
| Cao 20 việc ở 1440 (dòng 52 px lúc đó) | 1 802 px | 1 802 px | 1 987 px | 2 122 px |
| Dòng chữ / việc | 1 | 1 | 3 | 2 |
| Critique impeccable — rà độc lập bằng ảnh, Nielsen, /36 | 26 | 24 | 23 | 25 |

B: việc theo lớp phải mở đầu bằng "2 em / 4 em". C: cao dù 2 cột, hạn nằm hai cột khó quét. D: lặp tên việc ở mọi dòng, tới 3 nhãn một dòng. Điểm chấm trước khi hoàn thiện A theo luật cột; chưa chấm lại bản cuối.

## 10. Skill đã chạy

- `impeccable`: `context` → `shape` → `layout` → `critique` (hai lượt rà độc lập bằng ảnh) + `detect`: 0 lỗi phần web; chỉ báo vạch trái 3 px (luật dự án) và màu của phần đọc mockup.
- `ui-ux-pro-max` (`--domain ux`): nhãn gọn không xuống dòng, tên là chữ thiết yếu không cắt, bảng hẹp thì cuộn ngang trong khung.
- `frontend-design`: dồn điểm nhấn vào một chỗ (cột mã lớp thẳng hàng), còn lại yên; chia ô thay cho chuỗi nối bằng dấu chấm giữa.
- `web-design-guidelines`: dòng việc là `<button>`, `aria-expanded` cho dòng mở ra, nút chỉ có biểu tượng đều có `aria-label`, biểu tượng trang trí `aria-hidden`, số dùng `tabular-nums`, có `:focus-visible`, lưới điểm có `role="table"`. Để lúc code: ô điểm là `<input inputmode="decimal">` có nhãn, trạng thái lưu `aria-live`, URL giữ việc đang mở.
