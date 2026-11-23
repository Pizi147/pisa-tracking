# v24 · Công việc gọn — ghi chú

Mockup: `cong-viec-gon.html` (mở bằng trình duyệt; mục lục A · Vai khác · Panel · Chờ duyệt). Ảnh: `anh/cong-viec-gon-*.png` (16 ảnh).
Dữ liệu bịa, hôm nay thứ Hai 14/09/2026 (W2 SEP): GV Vũ Thu Lan 29 việc · 3 quá hạn · TVV Phan Mai 8 việc · Head Nguyễn Khánh Vy 5 yêu cầu chờ duyệt + 16 việc · Admin 5 việc.

## 1. Đã chốt (chủ SP 24/11 + PTA Plan)

- **Khuôn A "mỗi dòng một lớp"** cho Công việc; bỏ B · C · D.
- "các trường thông tin rõ hơn chút nữa" → lớp **đậm** · tên em **đậm vừa** · chi tiết **mờ** · hạn số đều nét, sát mép phải.
- "không để 'quá hạn', để ngày hạn luôn và màu tương ứng thôi, không cần giải thích color code" → hạn luôn là ngày `dd/mm/yyyy`, chỉ tô màu chữ (đỏ quá hạn · vàng còn ≤ 2 ngày · thường); không "quá n ngày", không nền, không chú thích màu. "m quá hạn" vẫn ghi bằng chữ ở đầu nhóm và đầu trang.
- "cố gắng làm đẹp và cân đối các hàng cột" · "cứ hay có kiểu thừa một đống ở cột cuối, xong co rúm lại" → **luật cột** (mục 2).
- **Bề rộng danh sách** (PTA): chưa mở panel → danh sách rộng **hết khung trang** (GV: phần còn lại cạnh "Lớp của tôi"), không nửa màn trống, không ô "Chọn một việc…"; mở panel → danh sách về 680 px (1280: 520 px, dòng hai tầng).
- **Một khung panel 720**; "n em" không mũi tên = mở thẳng lưới; "Đã có điểm" mở trong cùng lưới.
- **Chờ duyệt = mở tại dòng**; "Phần box duyệt không cần badge tròn ở đầu" → dòng bắt đầu bằng ô chọn rồi tên; giữ người trước lớp.
- Bảng "Vận hành" đổi tên **Bảng giao việc**: nhóm ở tab Việc quản lý tên "Việc được giao", lối "Tất cả việc đã giao ›". Tab "Vận hành" của GV giữ tên. Bỏ Họp đơn vị.

## 2. Luật cột — một cách cho mọi danh sách / lưới trong v24

1. **Mọi dòng dùng chung một bộ cột** (CSS `subgrid`): dòng thường, dòng con, dòng ở nhóm khác đều thẳng cột tuyệt đối.
2. **Cột chia hết bề ngang, khoảng trống chia đều**: cột chữ co giãn theo phần (không hẹp hơn chữ dài nhất → tên HV không bao giờ cắt); cột số / ô nhập **rộng bằng nhau**.
3. **Cột cuối căn phải, sát lề chuẩn** của khung (dòng việc 20 px · lưới điểm 14 px · Chờ duyệt 16 px, tính từ trong viền). Không dồn cột về trái rồi để cột cuối thừa.

| Chỗ | Tỷ lệ cột | Số đo Playwright |
|---|---|---|
| Danh sách việc, 948 px (A1 · GV chưa mở panel, 33 dòng kể cả dòng con) | lớp 4 · ai 5 · chi tiết 4 phần · hạn vừa chữ | 243 · 304 · 243 · 98 px; lệch từng cột **0 px**; hạn cách mép **20 px** |
| Danh sách việc, 680 px (A2 · mở panel) | như trên | 161 · 201 · 161 · 98 px; lệch 0 px |
| Danh sách việc, 788 px (A4 · 1280 chưa mở panel) | như trên | 194 · 242 · 194 · 98 px; lệch 0 px |
| Danh sách việc, 1 392 px (V1–V4 · vai không có cột phải) | như trên | 380 · 475 · 380 · 98 px; lệch 0 px |
| Lưới P1 · Pronunciation một cột | tên 2 phần · mỗi cột điểm 1 phần | tên 332,5 · Pronunciation 166,3 · Kết quả 166,3 px (lệch 0); tâm ô nhập lệch 0; Kết quả cách mép **14 px** |
| Lưới P2 · Mock 6 cột | tên 2 phần (≥ tên dài nhất) · 6 cột bằng nhau | tên 199,8 · L R W1 W2 S Overall mỗi cột 73,5 px (lệch 0); Overall cách mép **14 px** |
| Lưới P3 · 375 một cột | như P1 | tên 171,9 · 2 cột 78,5 px |
| Lưới P4 · 375 Mock | cột tên dính, 6 cột 68 px cuộn ngang trong lưới | 6 cột đều 68 px |
| Chờ duyệt mở tại dòng (H1) | chọn · người 6 · việc 6 · nhãn 5 · người gửi 5 · hạn · mũi tên · nút | người 269 · việc 269 · nhãn 224 · người gửi 224 · hạn 77 px; lệch 0 px; nút cách mép **16 px** |
| Lớp của tôi (420 px) | 24 % · 22 % · còn lại · 14 % | 100 · 92 · 167 · 59 px; cột Việc cách mép **20 px** |
| Nút ⓘ ⋯ ✕ đầu panel | ba ô 36 px | tâm cách nhau đúng 36 px, thẳng hàng với tiêu đề |

Máy dò tự viết (chạy trên 16 khung): chữ tràn ô · chữ xuống dòng lạ · phần tử lòi khung · hai ô chữ cách nhau < 6 px · dải tab tràn → **0 lỗi**, trừ tiêu đề panel ở 375 xuống hai dòng (kiểu v23, giữ).

## 3. Khuôn dòng việc A

| Luật | Vẽ thế nào |
|---|---|
| Bốn ô | mã lớp (đậm) · em hoặc "n em" (đậm vừa) · một chi tiết (mờ) · hạn (sát mép phải) |
| Không cột nút | Cả dòng là một nút; rê = nền nhấn nhạt; đang chọn = nền nhấn nhạt + vạch trái 3 px |
| Nhiều em, mỗi em một panel | "4 em" có mũi tên → bấm dòng mở ra từng em ngay dưới, **thẳng cột "ai"**; bấm dòng con → panel |
| Nhiều em, chung một lưới | "4 em" không mũi tên → bấm dòng mở thẳng panel lưới |
| Một em | Bấm dòng → panel luôn |
| Đổi trang | "›" nằm trong lề phải (Báo cáo PH, Chốt lộ trình) — không đẩy ngày lệch cột |
| Thứ tự | Quá hạn lên đầu nhóm, rồi hạn gần; không còn dòng chia "Quá hạn / Hạn đến… / Hạn sau…" |
| Chip | ≤ 1 chip mỗi dòng: chỉ SOS 2–3, sau tên em |
| Đầu nhóm | "Thêm PA · 2 việc · 1 quá hạn"; nhóm = động từ việc |
| Việc không có lớp | Tên việc chiếm chỗ ô lớp + ô em (Task) |
| Cỡ | Chữ 14 px · dòng 48 px · tên HV không cắt · mã tuần một dòng |
| Chưa mở panel | Danh sách rộng hết khung trang; GV có "Lớp của tôi" 420 px bên phải (A1, A4, V1–V4) |
| Mở panel 720 | Danh sách 680 px (A2); 1280: 520 px (A3) |
| Danh sách < 600 px (1280 có panel, 375) | Mỗi việc hai tầng: lớp + hạn · tên + chi tiết |
| Dải tab | 1280 có panel: tab không vừa gom vào "Thêm n" — không cắt chữ (A3); 375: cuộn ngang, mờ mép phải |

Đủ loại việc đã vẽ — GV (A1): Nhập điểm · Chấm Speaking · Mô tả Case · Xác nhận Case · Thêm PA · Xác nhận PA · Ghi Mini Test · Ghi kết quả PA · Xử lý vi phạm · Đã thực hiện · Khai cấp bậc · Vi phạm bị trả lại · Tình hình học tập · Phối hợp SOS · Báo PH kết quả Test · Bàn giao lớp · Bàn giao môn · Báo cáo PH · Task không lớp. TVV (V1): Báo PH · Sau thi · Thi thật · Chốt ngày thi · Bổ sung hồ sơ. Head (V2, V4): Chọn người phụ trách · Phân công GV môn · Phối hợp SOS · Báo PH kết quả Test · Chốt lộ trình · Xét lại lộ trình · Bổ sung hồ sơ · Việc được giao. Admin (V3): Điểm chưa nhập · Việc được giao.

## 4. Khung panel chung 720

- Đầu **một dòng**: tên việc · em · lớp · hạn (cùng màu như ở dòng việc) · ⓘ · ⋯ · ✕. Thân cuộn. Chân lưu cố định: trạng thái lưu bên trái, **Lưu** + **Lưu · việc tiếp ›** bên phải.
- **Nhập điểm Pronunciation** (P1, P3): tên trái · ô `18 /25` (104 × 44) giữa cột · Kết quả sát mép phải. 2 em còn thiếu ở trên, "Đã có điểm · 10 em" ngay dưới trong cùng lưới.
- **Nhập điểm Mock** (P2, P4): L R W1 W2 S Overall sáu cột bằng nhau; cột GV chấm là ô 68 × 44, cột người khác chấm là số xám; em còn thiếu ở trên, "Đã đủ điểm" ở dưới. 375: cột tên dính trái, các cột điểm cuộn ngang **trong lưới**.
- **Xác nhận Case** (A2, A3): hàng Phụ trách · Theo dõi → nguồn Case (điểm, ngưỡng, lần trước) → Nhóm nguyên nhân → Mô tả → Phương án → Lịch sử (gập).
- 375: panel toàn màn; cột Kết quả rút còn "KQ" với dấu ✓ / ✗; chân một nút chính.
- Đối chiếu ảnh thật `docs/anh/ra-panel-cv/`: hiện có ba bề rộng (1 080 · 835 · 764–794 px) và panel lưới ép danh sách còn ~235 px. Khung 720 thay cả ba.

## 5. Head: Chờ bạn duyệt (H1, H2) + Việc quản lý (V4, V5)

- **Mở tại dòng, không khung phải.** Một dòng: ô chọn · tên em + lớp · việc · ≤ 2 nhãn (loại · đợt) · người gửi · hạn · **Từ chối** · **Duyệt**. Không hình tròn đầu dòng.
- Duyệt yêu cầu rõ ràng: 1 bấm. Cần xem trước: bấm dòng → chi tiết mở ngay dưới, nút vẫn ở dòng.
- Từ chối: ô lý do mở ngay dưới chi tiết (vẫn thấy vi phạm / bằng chứng khi viết), **Huỷ** · **Gửi từ chối**.
- Duyệt lô: tick nhiều dòng → "Duyệt n yêu cầu".
- Sau Duyệt / Từ chối: thông báo "✓ Đã duyệt · … · **Hoàn tác**" ở đáy (không khoá cứng).
- Hạn một kiểu như Công việc; mỗi dòng 2 thao tác (bỏ "Mở ›" — link hồ sơ nằm trong phần chi tiết).
- Thẻ mới "Sửa cấp bậc · R2 → R1" (N70) nằm ở nhóm Ý thức, cùng khuôn.
- **Việc quản lý** (V4 có việc · V5 rỗng): khuôn A, rộng hết khung; nhóm "Việc được giao" có lối "Tất cả việc đã giao ›"; rỗng = "Hết việc quản lý" + "Còn: Chờ bạn duyệt · 5 yêu cầu" + Việc tiếp › + Tất cả việc đã giao ›.

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
| Duyệt / Từ chối yêu cầu | Duyệt · Từ chối… · Mở › trên thẻ; khung phải | Từ chối · Duyệt trên dòng, bấm dòng mở chi tiết; có Hoàn tác |
| Duyệt lô (tick) | Có | Giữ |
| Tab ở màn hẹp | Dải tab bị cắt chữ | 1280 có panel: gom vào "Thêm n"; 375: cuộn ngang |
| Họp đơn vị · lối "Vận hành ›" | Ô link ở tab Việc quản lý | Bỏ Họp đơn vị; "Tất cả việc đã giao ›" ở đầu nhóm Việc được giao |
| Lọc thêm · + Task · + Giao việc · Của tôi / Của GV / Tất cả · Lớp của tôi · ⓘ · ⋯ · ✕ · Lưu · Lưu · việc tiếp › · 375 chạm cả dòng | Có | Giữ |

## 7. Còn mở — cần PTA / chủ SP xem ([XM])

- **[XM2]** Hạn chỉ hiện ở đầu panel; khối Phụ trách bỏ ô Hạn (đỡ lặp), Gia hạn vào ⋯.
- **[XM3]** Giữ ⋯ ở đầu panel (đề bài chỉ ghi ⓘ · ✕) để không mất thao tác cũ.
- **[XM5]** Tên lựa chọn "Nhóm nguyên nhân", "Phương án" trong panel Case và nội dung chi tiết yêu cầu duyệt là minh hoạ; khi code lấy đúng trường web đang có.
- **[XM6]** Dải đầu nhóm giữ kiểu v23 (duyệt 22/11). Nhóm một việc thì dải + dòng hơi nặng — muốn nhẹ hơn: hạ dải còn 40 px, tên nhóm 14 px.
- **[XM7]** Bỏ nền / viền quá hạn theo lời chủ SP — PTA sửa NH4 trong `DESIGN.md` khi chủ SP duyệt (session này không đụng).
- **[XM8]** Khung A1 nối 4 tab chỉ để thấy đủ loại việc; web vẫn mỗi tab một phần. Khi panel mở, danh sách cuộn riêng (đáy mờ dần).
- **[XM14]** Danh sách rộng hết khung 1 392 px (V1–V4): bốn ô chữ ngắn chia đều nên cách nhau 300–400 px, mắt phải đi xa từ mã lớp tới hạn. Đúng điều PTA chốt; nếu chủ SP thấy thưa thì đặt trần ~1 100 px (một dòng CSS).
- **[XM15]** TVV thật có khối "HV của tôi" bên phải; mockup chưa vẽ khối này (không rõ cột), TVV đang vẽ như vai không có cột phải.
- **[XM16]** Dải tab ở 375 vẫn cuộn ngang (mờ mép phải) — tab cuối có thể bị cắt giữa chữ ở vị trí cuộn đầu; gom vào "Thêm" như 1280 thì chỉ còn 1–2 tab thấy được.
- Luật craft của impeccable chê vạch trái màu > 1 px; ở đây là luật dự án (G14 dòng đang chọn, dải đầu nhóm v23) nên giữ.

## 8. Lời chủ SP 24/11 → đã đáp ở đâu

| Lời chủ SP | Đáp |
|---|---|
| "Panels công việc to quá, nhất là panels chấm test… ô chấm có mỗi một tí" | Panel 720 thay 1 080 px (P1, P2); ô chấm 104 × 44 / 68 × 44 |
| "khung chung được thì tốt, to thôi nhưng không nên to quá ảnh hưởng đến danh sách bên trái, chữ chồng chéo" | Một khung 720 cho mọi panel (A2, P1, P2); máy dò chữ đè / tràn: 0 lỗi |
| "bên trái vẫn convoluted, nhiều chữ quá, giảm tải, cần thông tin quan trọng thôi" | Mỗi dòng 4 ô, một dòng chữ; bỏ động từ lặp, bỏ chữ "hạn", bỏ dòng chia hạn, ≤ 1 chip |
| "gọn gàng và đồng bộ hơn… kể cả nút ở bên phải, lúc là cái nọ lúc là cái kia" | Bỏ hẳn cột nút; mọi dòng cùng ô, cùng chỗ, ở mọi vai (A1, V1–V4) |
| "có khi không cần nút gì luôn? nhiều thì expand ra nhiều HV / vấn đề, 1 thì bấm cái ra panel luôn?" | Đúng vậy: A1 có dòng Mô tả Case đang mở ra |
| "có sợ không rõ công việc không?" | Tên việc là đầu nhóm (16 px đậm, kèm số việc · quá hạn) và là tiêu đề panel |
| "lúc thì là tên HV, lúc thì là test, lúc thì là cái nọ cái kia" | Luôn mã lớp trước, rồi em / số em, rồi chi tiết, rồi hạn |
| "làm nó rộng rãi ra hơn 1 chút" | Dòng 48 px một dòng chữ; nhóm cách nhau 12 px; chưa mở panel danh sách rộng hết khung |
| "chọn A, các trường thông tin rõ hơn chút nữa" | Mục 1, 3: ba mức đậm + cột thẳng |
| "không để 'quá hạn', để ngày hạn luôn và màu tương ứng thôi, không cần giải thích color code" | Hạn chỉ là ngày tô màu ở mọi khung, kể cả đầu panel và Chờ duyệt; không chú thích |
| "cố gắng làm đẹp và cân đối các hàng cột" · "thừa một đống ở cột cuối, xong co rúm lại" | Mục 2: luật cột + số đo; P1 đã vẽ lại |
| "Phần bộ duyệt… hoặc làm kiểu khác hẳn là không cần mở panel duyệt, nó dàn trải ra và 2 nút duyệt – từ chối rõ ràng, bấm vào nó cho expand" | H1 / H2: mở tại dòng, hai nút ở cuối dòng |
| "Phần box duyệt không cần badge tròn ở đầu đâu nhé" | H1 / H2: bỏ hình tròn chữ cái, dòng bắt đầu bằng ô chọn rồi tên |
| Tab Việc quản lý: "rất là hạn chế… tạm thời bỏ hẳn phần họp đơn vị" | V4 / V5: không còn Họp đơn vị; rỗng có trạng thái rõ + lối đi tiếp |

## 9. Đã cân rồi bỏ (để khỏi làm lại)

- Vẽ thử đủ B "mỗi dòng một người", C "thẻ 2 cột", D "khuôn Chờ duyệt" trên cùng 20 việc (ảnh ở lịch sử git, commit `814838844`). Cao 20 việc ở 1440: A = B 1 802 · C 1 987 · D 2 122 px. Critique impeccable (rà độc lập bằng ảnh, /36): A 26 · D 25 · B 24 · C 23. B: việc theo lớp phải mở đầu bằng "2 em / 4 em". C: cao dù 2 cột, hạn nằm hai cột khó quét. D: lặp tên việc ở mọi dòng, tới 3 nhãn một dòng.
- Chờ duyệt giữ panel 720 (ảnh ở commit `702979d1c`): 2 bấm mới duyệt được, nửa màn trống khi chưa chọn.
- Danh sách giữ 680 px cả khi chưa mở panel (commit `702979d1c`): không nhảy bố cục nhưng nửa phải trống ở vai không có "Lớp của tôi".

## 10. Skill đã chạy

- `impeccable`: `context` → `shape` → `layout` → `critique` (hai lượt rà độc lập bằng ảnh, trước khi chốt A) + `detect`: 0 lỗi phần web; chỉ báo vạch trái 3 px (luật dự án) và màu của phần đọc mockup.
- `ui-ux-pro-max` (`--domain ux`): nhãn gọn không xuống dòng, tên là chữ thiết yếu không cắt, bảng hẹp thì cuộn ngang trong khung.
- `frontend-design`: dồn điểm nhấn vào một chỗ (cột mã lớp thẳng hàng), còn lại yên; chia ô thay cho chuỗi nối bằng dấu chấm giữa.
- `web-design-guidelines`: dòng việc là `<button>`, `aria-expanded` cho dòng mở ra, nút chỉ có biểu tượng đều có `aria-label`, biểu tượng trang trí `aria-hidden`, số dùng `tabular-nums`, có `:focus-visible`, lưới điểm có `role="table"`, thông báo Hoàn tác `role="status"`. Để lúc code: ô điểm là `<input inputmode="decimal">` có nhãn, trạng thái lưu `aria-live`, URL giữ việc đang mở.
