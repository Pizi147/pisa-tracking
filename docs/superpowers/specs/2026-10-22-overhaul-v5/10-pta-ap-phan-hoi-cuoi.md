# 10 — Áp phản hồi cuối của chủ SP vào kế hoạch V5 (PTA Plan, 22/10)

> Nguồn: [`09-phan-hoi-cuoi-chu-sp.md`](09-phan-hoi-cuoi-chu-sp.md) + ảnh `09-anh1-cong-viec.png` (panel Công việc plain text), `09-anh2-ho-so-hv.png` (Hồ sơ HV hiện tại — điểm to, Case / PA), `09-anh3-ho-so-gv.png` (Hồ sơ GV mockup V5).
> **Luật đọc:** phần chủ SP KHÔNG góp ý = đã duyệt (mockup V5 #507–#510 + `08`). Phần dưới **thay** dòng tương ứng của `08`. Không thêm vòng mockup / rà ngoài mục 3.

## 1. Luật chung mới (mọi PR giao diện V5)

| # | Luật | Nguồn 09 |
|---|---|---|
| P1 | **Ít chữ:** bỏ câu giải thích luật / workflow / hướng dẫn trên màn chính → dấu **"?"** (dùng `NutLuat` sẵn có); chữ chỉ dành cho người quản trị web / lập trình → không hiện. Mockup V5 có nhiều dòng chú thích (vd khung "Quy tắc Overall…", "Bấm số gạch chân…", "Gán theo…") — **không đưa lên web**. | I.1, VII.5, X.4 |
| P2 | **Phân cấp:** nhãn ≠ giá trị (nhãn nhỏ xám, giá trị đậm), chính / phụ, dữ liệu / thao tác; điểm + trạng thái có màu thống nhất; không mọi trường plain như nhau, không lạm dụng badge. Rà mọi panel có kiểu "Nhãn  giá trị" như ảnh 1. | I.2, III.1, X.5 |
| P3 | **Tối:** xanh bớt ngả tím, tối hơn một chút (token nền điều hướng + nhấn bản tối). | I.3 |
| P4 | **"Thi tháng này"** (thi thật) thay "Thi tuần này" ở mọi trang / chỉ số / bộ lọc / panel. | I.4 |
| P5 | **Tháng thi dự kiến luôn kèm năm** (một cách viết cho cả web, vd `Dự kiến 02/2027`). | I.5 |
| P6 | **SOS 1 / 2 / 3 khác nhau rõ hơn** (giữ logic; chưa tối ưu mù màu). | I.6 |
| P7 | **Hạn = ngày / tháng thật** (`28/10`), không thứ, không "Hạn tuần này / tuần sau", không câu giải thích cách tính. | IV.1 |
| P8 | **Không dùng "MT gần nhất của lớp"** làm đại diện: số theo **lượt của từng HV** (lượt của em có tuần thi trong kỳ đang xem). Rà mọi chỗ: Lớp cần chú ý ("lượt MT mới nhất"), Hồ sơ GV "Kết quả theo lớp · lượt", Hồ sơ lớp chọn "Lượt MT2", Phân tích. | IV.3, VII.4 |
| P9 | **Bộ lọc thời gian tự do:** Từ tuần – Đến tuần chọn tuỳ ý, mặc định chỉ là giá trị chọn sẵn (Hồ sơ GV mặc định ~1 tháng = 4 tuần; Phân tích "Toàn bộ" / "Chọn khoảng tuần" không khoá trần). | VII.2, VIII.1 |
| P10 | **Tutor hoãn** — không PR Tutor đợt này (ghi đề xuất vào `plan.md` mục 4: color coding điểm đánh giá, bộ lọc / bảng). | IX |
| P11 | Không thêm panel / nút / ô chữ / bộ lọc không có giá trị thật; kế thừa workflow cũ đang tốt (Test, lịch MT theo cá nhân, xem / sửa điểm theo tuần). | X.7, X.11 |

## 2. Thay đổi theo PR của `08` mục 6

| PR | Thêm / đổi |
|---|---|
| NEN-V5 | P3, P5 (hàm nhãn tháng dự kiến một chỗ), P6 (token SOS 3 mức khác hẳn), P7 (hàm nhãn hạn `dd/mm`), P2 (kiểu nhãn / giá trị dùng chung). |
| NEN-PANEL | P1 (dấu "?" thay câu giải thích trong panel), P2 (khối bối cảnh: nhãn nhỏ / giá trị đậm / số liệu có màu — ảnh 1). |
| SV-SO2 | P4 (chỉ số "Thi tháng này" = HV có ngày thi thật trong tháng hiện tại, phạm vi đang xem), P8 (gom theo lượt từng HV), P9 (API nhận khoảng tuần tự do); Phân tích GV: **bỏ "Xử lý vi phạm"** khỏi bảng (không xoá dữ liệu), **bỏ chữ "mẫu nhỏ"** (PR #514 đã thêm — gỡ), **giữ "Đạt Target – Thi thật"**. |
| SV-TVV (#516, #517 đang sửa) | không đổi. Tổng quan TVV (UI) chỉ 3 nhóm: **Xử lý đúng hạn** · **Thi tháng này** · **Chờ KQ / Lộ trình tiếp**. |
| **SV-S-EXPERT** (mới) | Lượt **Speaking với chuyên gia (S Ex)** bổ sung riêng từng HV; chỉ QL / Admin thêm (máy chủ kiểm); hiện ở Lịch Test / Kế hoạch Test, phân biệt MT Speaking thường; **không thay** S MT; không vào luồng S chấm chéo. **Điểm:** chỉ lưu điểm + nhận xét, **KHÔNG** vào Overall / SOS / Case / KPI / Phân tích tới khi chủ SP chốt luật điểm (XM-1). |
| UI-CONG-VIEC | P2 (ảnh 1) · **Case mở rộng tại chỗ** (bấm Case → chi tiết ngay trong khu đó), sửa trường được quyền sau lưu + lịch sử; bước duyệt giữ. |
| UI-CHAM-TEST + UI-LICH-TUAN | **Giữ tư duy Lịch Test tuần + Kế hoạch Test của web hiện tại** (trước V5): danh sách **từng HV** làm Test trong tuần (HV · kỹ năng · MT của HV · điểm), **xem / sửa điểm ngay trên lịch** theo quyền + lịch sử, hàng lớp gọn hơn; lịch MT theo lộ trình **từng HV** (không giả định cả lớp cùng MT). Bỏ "ba khung tổng quát" không có danh sách điểm. Kế hoạch Test hiện rõ kỹ năng · tuần · tháng · năm. Áp V5 phần màu, badge, hạn `dd/mm` (P7); 4 nhóm Chấm Test giữ (C14) nhưng tên nhóm theo ngày hạn thật. Thêm S Ex (SV-S-EXPERT). |
| UI-HO-SO-LOP | **W:** bỏ nhãn / khu W chung thừa, **giữ W1 + W2 riêng**; bấm điểm **W hoặc S** → xem điểm thành phần tại chỗ (popover nhỏ). **Bỏ badge "Chưa đạt" khi đã có SOS.** **Cột Case + PA làm lại:** bấm → danh sách Case, PA gắn từng Case, mở rộng xem / sửa (theo quyền, lịch sử, duyệt), thao tác panel Công việc Case / PA ngay trên trang. **"Bài trên lớp" → "Tiến độ trên lớp".** Thanh Việc cần làm: mỗi việc một ô rõ (việc · em · trạng thái · hạn · nút), không dính nhau. Kế thừa ảnh 2: điểm to, rõ, bấm xem chi tiết. |
| UI-HO-SO-HV | Hành trình: **không line chart chung nhiều đường**. Khuyến nghị PTA: theo **từng kỹ năng** (chip L / R / W / S, W có W1 · W2), **dải điểm theo thời gian** (chấm điểm MT chính thức, kỳ vọng dạng bậc thang mờ) + **bảng mốc** dưới; "Tiến độ trên lớp" là **dòng riêng** (thang riêng, không chung trục band); khoảng thiếu để trống có nhãn. Chốt trong mockup chung (mục 3). |
| UI-HV-LOP | **Khác Hồ sơ lớp về mục đích:** danh sách để **lọc / tìm / hành động** trên nhiều lớp — mỗi HV một dòng gọn (tên · lớp · Target · Overall gần nhất của **em** · SOS · **Lịch thi** · **Việc**), không bê bảng điểm kỹ năng của Hồ sơ lớp. **Giữ cột Lịch thi + Việc ở đây**; Hồ sơ lớp chỉ giữ chip nhỏ. **Bỏ chế độ "Cần làm"** (việc xem ở Công việc / thanh việc). **Giữ chế độ SOS**, làm lại tập trung theo dõi SOS (mức, kỹ năng, Case / PA, tuần) — tham khảo chế độ SOS cũ. **Bỏ checkbox cạnh tên** — Xuất Excel: nút "Xuất" lấy đúng phạm vi bộ lọc + chọn cột / phạm vi trong hộp xuất. **Lịch thi:** dựng lại theo mockup V4 `thiet-ke/mockup-v4-hoc-vien-lop.html` (khung Lịch thi A / B) + đủ trường xếp lịch của `thiet-ke/mockup-ov14-5-lich-thi-xuat-ds-2026-10-19.html` (XM-2). |
| UI-HO-SO-GV | Dải đầu gọn: bỏ chuỗi "4 lớp: …" dài; **Lớp đang dạy** thành khối riêng gọn (lớp · kỹ năng · số HV · GVCN). Bộ lọc kỳ tự do mặc định 4 tuần (P9). **Bảng Học thuật làm lại:** bỏ cột ngoài cùng rộng vô nghĩa, cột theo mục đích, không co chữ. Bỏ hộp chữ quy tắc (P1). Đề xuất thông tin còn thiếu ngay trong PR (ghi lý do), không thêm cho đầy trang. P8. |
| UI-PHAN-TICH | P9; Phân tích GV: "Quá hạn nay" → **"Quá hạn"**, giữ **"Đạt Target – Thi thật"**, sửa bảng bị cắt / lệch / phải cuộn (bộ cột Gọn mặc định vừa 1280), **bỏ "Xử lý vi phạm"**, **bỏ "Mẫu nhỏ"**. **Báo cáo HV: thay bảng "Kết quả theo lớp"** — khuyến nghị PTA: **"Hành trình theo kỹ năng"** = ma trận kỹ năng × lượt MT (MT0 → MT3) theo **lượt của từng HV**: % đạt kỳ vọng, số HV, mũi tên tăng / giảm so lượt trước, kèm dòng "kỹ năng yếu nhất". Chốt trong mockup chung (mục 3). |
| UI-TONG-QUAN | P4; TVV 3 nhóm (dòng SV-TVV trên); P1 (bỏ dòng chú thích). |
| UI-TUTOR | **HOÃN** (P10). |
| UI-CON-LAI | P1, P2, P7. |

## 3. Một mockup chung (chủ SP cho phép một file) — `thiet-ke/v5/dieu-chinh-cuoi.html`

Chỉ vẽ phần **bố cục mới thật sự** (còn lại sửa thẳng khi code): (a) Lịch Test tuần + Kế hoạch Test kiểu cũ + S Ex · (b) Hồ sơ lớp: khu W1 / W2 + popover thành phần, cột Case + PA mở rộng, thanh Việc cần làm · (c) Hồ sơ HV: hành trình theo kỹ năng + Tiến độ trên lớp · (d) HV & Lớp: danh sách gọn + chế độ SOS + Lịch thi (V4) + Xuất không checkbox · (e) Hồ sơ GV: dải đầu + Lớp đang dạy + bảng Học thuật · (f) Báo cáo HV: bảng thay "Kết quả theo lớp". 1440 sáng + 375; tối chỉ 1 khung (P3). Chỉ trạng thái khác bố cục.

## 4. Câu cần chủ SP (chỉ nghiệp vụ)

| # | Câu | PTA dùng tạm |
|---|---|---|
| XM-1 | Luật điểm **S Expert** (có vào Overall / SOS / thay S MT khi nào?) | lưu điểm + nhận xét, không vào tính toán nào (09 IV.4) |
| XM-2 | Mockup Lịch thi "cũ ổn" là bản nào? | `mockup-v4-hoc-vien-lop.html` khung Lịch thi (A / B) + trường xếp lịch của `mockup-ov14-5-lich-thi-xuat-ds` — chủ SP sửa nếu sai |

Đã chốt theo khuyến nghị (chủ SP không trả lời = duyệt): TVV cùng chi nhánh **vẫn làm thay** được việc của nhau (mã hiện tại, có lịch sử); QL từ chối / GVCN rút đề xuất → việc Báo PH tự "Đã bỏ" kèm lý do; hạn Bước tiếp = ngày có KQ + 7 (21/10).

## 5. Chủ SP chốt 22/10 (sau mockup #523, #524) — áp thẳng khi code, không vẽ lại

- Báo cáo HV: bảng thay "Kết quả theo lớp" tên **"Kết quả MT"** (không "Đường tới Target"); hàng **MT3+** (gộp MT3 trở đi) thay "MT3". Còn lại như `thiet-ke/v5/phan-tich.html` (Đạt Target · Thiếu 0.5 · Thiếu 1.0 · Thiếu ≥ 1.5 · Chưa đủ · So lượt trước; theo lượt của từng HV; hàng Thi thật).
- Hồ sơ HV (`dieu-chinh-cuoi.html` khu c): bấm ô điểm (Overall · L · R · W1 · W2 · S) đổi kỹ năng; biểu đồ chỉ MT + mốc tuần; "Tiến độ trên lớp" là bảng dưới biểu đồ (3 dòng mới nhất + "Xem thêm"), ghi nguyên văn, không vào MT; Case & PA chỉ của kỹ năng đang chọn, cột PA cố định (nút không đẩy chữ).
- HV & Lớp (khu d): cột Lộ trình · MT gần nhất (Overall / KV + 5 kỹ năng, W1 W2 riêng) · Xu hướng · Hỗ trợ · Ý thức · Lịch thi · Việc; không "tuần n/24". Lịch thi bấm hàng mở chi tiết dưới hàng (như V4).

## 6. Chủ SP chốt 22/10 (sau ảnh UI-CHAM-TEST) — Kế hoạch Test: "+ MT", S Ex là một lượt riêng

- Mỗi HV mặc định 3 MT (MT1–MT3); **cuối hàng HV có nút "+ MT"** (QL / Admin) để thêm MT4, MT5… như MT thường — không cột "+ S Ex" riêng.
- **S Ex = một lượt riêng lẻ** của HV: có thể trùng tuần với MT chính hoặc không, **có thể nhiều lần**. Thêm qua cùng nút "+ MT" (chọn loại: MT thường · S Ex). Hiện trên hàng HV như một ô lượt, nhãn "S Ex", xếp theo tuần cùng các MT.
- Lịch Test (UI-LICH-TUAN) vẫn hiện MT thường là chính; S Ex là dòng phụ thêm của em trong tuần đó.
- Luật điểm S Ex giữ XM-1 (chỉ lưu điểm + nhận xét, không vào tính toán). Máy chủ: bảng `s_expert` đã cho nhiều lượt / HV; MT4+ dùng đường "Tạo MT" sẵn có của Kế hoạch Test.

## 7. Chủ SP chốt 22/10 (chiều) — luật nhận xét, xếp MT, ghi chú vắng, S Ex → PR **LUAT-NX-MT**

1. **S Ex:** không tính vào Overall / SOS / Case / KPI / Phân tích (đóng XM-1). Chỉ **hiện cạnh điểm S** ở kết quả + Hành trình (Hồ sơ HV). QL nhập hộ S Ex **không** cần lý do.
2. **Nhận xét KHÔNG bắt buộc cứng** (thay luật "thiếu nhận xét ≠ xong" của SV-SO1 #528 và luật chặn lưu cũ): ô **xong = có band**. Thiếu nhận xét / thiếu nhóm nguyên nhân (MT dưới kỳ vọng) → **chỉ nhắc**: ô vàng + ghi chú "Nên có nhận xét — dùng làm mô tả vấn đề trên Case". Không 400, không tắt nút Lưu, không thành việc / nợ / trễ chấm, nhập Excel không báo lỗi dòng. Giữ kiểm kiểu / độ dài tối đa. Nhận xét vẫn chép vào nguyên nhân Case như hiện tại. Chữ gợi ý ô nhận xét: tập trung vào **vấn đề học thuật** của kỹ năng, không ý thức / chuyện ngoài bài. (Form Case "≥ 10 ký tự" là luật Case, giữ.)
3. **Xếp MT nới lỏng:** bỏ chặn thứ tự giữa các MT (tuần muộn nhất MTn < tuần sớm nhất MTn+1) — một vài kỹ năng MT trước được làm bài **sau** MT sau. Giữ luật thật: số MT liền mạch, MT0 trước MT1, luật vắng "-" (LUAT-34, vắng 2 lần huỷ), không xếp tuần đã qua. Lệch thứ tự chỉ hiện **nhắc** nhỏ ("MT2 W sau MT3"), không chặn.
4. **Ghi chú vắng dưới ô điểm:** kỹ năng đã dời do vắng → dòng nhỏ "vắng W3 SEP" (tuần cũ), một hàm chung (`chuDoiVang`), dùng ở mọi ô điểm (Kế hoạch Test, lưới lớp, Hồ sơ HV, Lịch Test).

## 8. Chủ SP 22/10 (tối)

- **V5 bổ sung trên V4, không thay:** mọi thao tác V4 / web đã có mà mockup V5 không vẽ (Nhập điểm, + Case, ⋯ sửa lớp / tác vụ lớp, Xuất, Dán Excel…) **GIỮ**, đặt theo luật giao diện mới (vị trí V4 đã duyệt + màu / badge / chữ V5). Mỗi PR màn liệt kê thao tác giữ trong khop-khac (dòng GIỮ). Áp cho MỌI yếu tố web, không chỉ chỗ chủ SP nêu.
- **SOS 3** bớt chói (sáng + tối), vẫn khác rõ SOS 2 → UI-CON-LAI (token `v5-nen.css` / `index.css`).
- **Logo web:** chữ "PISA" hồng + "TRACKING" trắng (tối) / đen (sáng), không in đậm / phông khác được — không dùng logo trung tâm → UI-CON-LAI.
