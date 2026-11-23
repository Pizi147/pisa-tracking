# v24 · Phân tích — con số bấm được và panel số · ghi chú

Mockup: `phan-tich-panel-so.html` (mở bằng trình duyệt; mục lục A1 … M). Ảnh từng khung: `anh/pt-*.png` (21 ảnh).
Hiện trạng + rà: `docs/anh/ra-panel-phan-tich/` — `bao-cao.md`, `danh-sach.md` (136 loại ô số, 32 khuôn panel, ảnh 3 cỡ).
Dữ liệu bịa: Head Nguyễn Khánh Vy · Monbay · Fast Track · thứ Hai 14/09/2026 (W3 SEP) · 42 em thi thật (demo thật chỉ 3 em, không thấy được cột 2 chữ số). Mọi bảng sinh từ một bộ số trong tệp.
Không sửa mã web / máy chủ. Chưa được duyệt — mọi mục dưới đây là **đề xuất**.

## 1. Khuyến nghị (một dòng mỗi ý)

| # | Khuyến nghị | Khung |
|---|---|---|
| 1 | **Số bấm được = số trơn màu nhấn** (kiểu B): bỏ ô viền; % nhỏ dưới; 0 mờ không bấm; đỏ / vàng chỉ ở cột trạng thái; cột số căn phải | A1, A2-B, A3 |
| 2 | **Một khuôn panel số**: đầu MỘT dòng (tên số · tổng · ⓘ · ✕) · thân một bảng đúng tập sinh ra số, chỉ các cột là lý do · không chân "Đóng" | B0 |
| 3 | **Cỡ theo nội dung**: ≤ 8 dòng và ≤ 5 cột → hộp neo cạnh số (440 / 560) · còn lại → panel phải **720** (không còn 835 / 1080) | B1–B8 |
| 4 | **Cột**: cột tên vừa chữ (172–220), các cột còn lại chia đều, số căn phải, cột cuối sát mép phải | mọi khung, số đo mục 9 |
| 5 | **Hạn = ngày dd/mm/yyyy tô màu** (đỏ quá hạn · vàng ≤ 2 ngày · thường); bỏ badge "quá n ngày" | B3, B4, B5, C1 |
| 6 | **Theo GV**: xếp kỹ năng → GV, mỗi kỹ năng 2 GV dạy nhiều tuần nhất + "+ n GV" mở tại chỗ | A2, A3-3 |

## 2. Đề bài rút gọn (impeccable `shape`; không có người hỏi lúc vẽ — giả định ở mục 11)

- Ai: Head, Quản trị (chính), CX — máy tính ở trung tâm; 375 để tra nhanh. Chế độ Operate, báo cáo chỉ đọc.
- Việc chính: nhìn bảng số → thấy số lạ → bấm → biết ngay **em nào, vì sao** → mở hồ sơ nếu cần → quay lại bảng, bấm số kế.
- Hướng: con số là chữ số, không phải nút có khung; danh sách mở ra nằm sát con số khi ngắn, nằm ở panel phải khi dài; trang phía sau luôn đọc được.
- Giữ nguyên: token màu / phông / khung v23, khung panel 720 của Công việc v24, luật G7 (số trên trang = số dòng panel), URL `?so-lieu=`, Esc + focus về ô số, "Xem thêm 20".
- Không làm: biểu đồ thay bảng · thêm nút việc vào panel Phân tích · đổi số liệu.

## 3. (a) Cách hiện số — ba kiểu trên cùng bảng (A1, A2)

| | A · hiện tại | **B · số trơn màu nhấn** | C · số trơn màu chữ |
|---|---|---|---|
| Dáng | Ô viền 40 × 30, số 14 px | Chữ số 15 px đậm 600, **màu nhấn** | Chữ số 15 px đậm 600, **màu chữ chính** |
| Số không bấm (Điểm TB, % tuần dạy) | Màu chữ | Màu chữ, thường | Màu phụ, thường |
| % phụ | Dưới ô | Dưới số, 12 px mờ | **Cùng dòng** sau số, khe 36 px |
| Căn cột | Giữa | Phải | Phải |
| Số 0 | Mờ, không bấm | Mờ, không bấm | Mờ, không bấm |
| Màu trạng thái | Chữ trong ô: xanh lá / xanh / đỏ | Chỉ cột "xấu" > 0 = đỏ; SOS 1 / 2 / 3, thiếu điểm = màu của mức đó | như B |
| Rê / bàn phím / đang mở | Viền đậm | Gạch chân + nền nhấn nhạt / vòng focus 2 px / thêm viền 1 px | như B |
| Vùng bấm | 40 × 30 (375: 44 × 44 nhờ `::after`) | Vô hình 32 × 32 (375: **44 × 44**) — đo ở mục 9 | như B |
| Dòng "Từng kỹ năng" (đo) | 59 px (web thật 67) | **49 px** | 41 px |
| Thẻ "Theo GV" 5 kỹ năng (đo) | 832 px | **735 px** | 655 px |
| Nguồn | web 24/11 | ý PTA; khớp G6 "ô số = số màu nhấn → panel" | gợi ý của lượt rà impeccable; giống bảng Lớp cần chú ý vừa duyệt |

**Khuyến nghị B.** Lý do:
1. Trang Phân tích lẫn số bấm được (đếm) với số không bấm được (Điểm TB, % tuần dạy, ± kỳ trước). Màu nhấn cho thấy ngay số nào mở ra danh sách; ở C phải rê mới biết.
2. % dưới số giữ cột số chính thẳng một hàng dọc; C tạo hai cột con (số · %) trong mỗi cột, dày hơn nhưng rối mắt hơn khi quét dọc.
3. 49 px một dòng đã thấp hơn hiện tại 27 %; bảng 5 kỹ năng × 2 GV vẫn nằm gọn một màn.
C đáng chọn nếu chủ SP muốn dày nhất và muốn Phân tích giống hệt bảng Lớp cần chú ý. **[XM-1]** chọn B hay C thì áp cho CẢ Tổng quan lẫn Phân tích (một dáng số).

Kiểu thứ tư đã thử và **không khuyến nghị** (A4): thêm thanh tỉ lệ mảnh Vượt · Đạt · Chưa đạt (gợi ý của skill `dataviz`: "thanh chia đoạn mảnh cạnh con số"). Bỏ vì: bộ kiểm màu của skill báo `--ok` cạnh `--accent` chỉ cách ΔE 11,3 (dưới ngưỡng 15) nên phải đổi đoạn giữa sang xám; xanh lá ↔ đỏ khi đứng sát nhau (Đạt = 0) chỉ cách ΔE 5,3 với người mù màu đỏ – lục; với n = 1–3 em thanh không nói thêm gì; impeccable xếp "thanh nhỏ thay nội dung" vào nhóm nên từ chối.

Luật số (cả B và C):
- Số trong cột dùng chữ số đều bề rộng (Inter, `tabular-nums`), căn phải; tiêu đề cột căn phải theo.
- Số 0: "0" mờ, không bấm, không vào thứ tự Tab. "—" chỉ cho "không áp dụng".
- Bỏ ô viền chèn giữa câu: "vào **3** · kết thúc **1** trong kỳ".
- Thứ tự cột hai bảng Thi thật làm một: HV · Vượt · Đạt · Chưa đạt · Điểm TB (web đang đặt Điểm TB ở hai chỗ khác nhau).
- Bảng có cột chữ và cột số: cột chữ đứng trước, **cột số đứng cuối** (sát mép phải) — vẽ ở bảng "Học viên cần chú ý", "Lớp nhiều vi phạm" (B4, B5).

## 4. (b) Khuôn panel số (B0)

| Phần | Luật | Web hôm nay |
|---|---|---|
| Đầu — một dòng, 48 px (panel 52) | **Tên số** đúng chữ ô vừa bấm + đối tượng · **tổng + đơn vị** · ⓘ · ✕. Phạm vi (chương trình · kỳ · chi nhánh) chỉ thêm ở panel 720 | Tên số · ⓘ · phạm vi · "dữ liệu đến 14/09", rồi một dòng "3 HV", rồi hàng chip lớp |
| Thân | Một bảng. Cột 1 = Học viên (tên là link hồ sơ; lớp chữ nhỏ dưới tên, bỏ khi tên số đã có lớp). Tiếp theo chỉ các cột là lý do; cột lý do chính nền nhấn nhạt. Xếp nặng / quá hạn trước | 9–10 cột cho mọi loại số |
| Tab | Chỉ ở ô **tỉ lệ** (Đạt \| Chưa đạt). Mở sẵn tab của phần con số đếm (B8) | Bấm "% Đạt" mở sẵn "Chưa đạt"; panel GV có 3 tab dù ô chỉ đếm một loại |
| Dòng | 48 px. Hộp neo hiện hết (≤ 8). Panel: 20 dòng + "Xem thêm n" (giữ) | 44–86 px |
| Chân | Không có | Nút "Đóng" một dải 52 px |
| Điểm trong panel | Chữ số; đỏ khi dưới kỳ vọng; ✓ / ✗ chỉ ở cột lý do | Mọi điểm là ô viền ✓ / ✗, bấm được |

**Cỡ.** Con số vừa bấm = số dòng (G7) nên biết cỡ trước khi mở:

| Nội dung | Mở gì | Rộng | 375 |
|---|---|---|---|
| ≤ 8 dòng, ≤ 3 cột | Hộp neo S ngay dưới con số (mũi chỉ vào số) | 440 | Tờ đáy, cao theo nội dung (≤ 85 %) |
| ≤ 8 dòng, 4–5 cột | Hộp neo M | 560 | Tờ đáy |
| > 8 dòng, hoặc > 5 cột, hoặc có tab | Panel phải, không nền mờ; trang bên trái vẫn đọc và bấm được, bấm số khác thì đổi nội dung | **720** | Toàn màn |

Ở 1280 panel 720 còn lại 560 px trang bên trái (hiện tại còn 320).
Hộp neo đóng khi bấm ra ngoài / Esc / ✕; cùng họ với hộp Tuần dạy đang có (`HopNeo`).

**[XM-2] Hai kiểu mở hay một?** Lượt rà độc lập phản đối hộp neo cho danh sách: cùng một cột mà ô "7" mở hộp, ô "30" mở panel thì trái "một danh sách một kiểu mở". Phương án của lượt rà: một kiểu duy nhất — panel 720 cao theo số dòng (**B7**, vẽ cùng ô số với B2 để so).

| | B2 · hộp neo (khuyến nghị) | B7 · panel cao theo nội dung |
|---|---|---|
| Kiểu mở | Hai (theo số dòng) | Một |
| Gần con số | Ngay dưới số | Góc phải, xa số |
| Che bảng nguồn | Vài dòng dưới ô vừa bấm | Che nửa phải trang — bảng nằm bên phải (Theo GV) thì che luôn ô vừa bấm |
| Bấm ô kế | Bấm ra ngoài là đóng, bấm tiếp | Phải đóng (hoặc cuộn) mới thấy ô kế |
| Code | `HopNeo` sẵn có + `KhungPanel` | Chỉ `KhungPanel` (thêm chế độ cao theo nội dung) |

Người vẽ giữ B2 vì việc chính ở Phân tích là so nhiều ô liền nhau trong một bảng; luật đoán trước được: **số ≤ 8 → hộp**. Chủ SP chọn bằng mắt.

### Loại số → cột tối thiểu

| Loại số | Cột (theo thứ tự) | Cột lý do | Khung |
|---|---|---|---|
| Thi thật · Vượt / Đạt / Chưa đạt theo kỹ năng | Học viên(+lớp) · Ngày thi · [kỹ năng] · Target · Lệch | [kỹ năng] | B1 |
| Thi thật · theo GV | Học viên(+lớp) · Ngày thi · [kỹ năng] · Target · **Tuần dạy** (n/m · %) | [kỹ năng], Tuần dạy | B2 |
| Tỉ lệ đạt MT / đạt kỳ vọng (ô %) | 2 tab · Học viên · MT · L · R · W1 · W2 · S · Overall · KV | Overall | B8 |
| Case chưa chốt PA | Nhóm theo bước · Học viên(+lớp) · Case + chip SOS · Điểm / KV · Phụ trách · Hạn | Điểm / KV | B3 |
| Vi phạm của một lớp | Học viên · Ngày · Vi phạm (nhóm + mô tả) · Trạng thái · Hạn xử lý | Hạn xử lý | B4 |
| Vi phạm của một em | Ngày · Vi phạm · Xử lý (hạn hoặc bậc đã xử lý) | — | B5 |
| Học viên đang học / vào / kết thúc | Học viên · Lớp · Tuần học (hoặc tuần vào / ngày + lý do kết thúc) · MT gần nhất · Overall / KV | Tuần học | B6 |
| GV · bài chấm chưa làm / làm muộn | Học viên(+lớp) · Bài (+ tuần) · Hạn | Hạn | C1 |
| Tiến bộ Tăng / Giữ / Giảm (chưa vẽ) | Học viên(+lớp) · Kỹ năng · Trước · Sau · Chênh | Chênh | — |

## 5. Hiện trạng → đề xuất, từng panel

| Panel (ảnh hiện trạng) | Hiện trạng | Đề xuất | Khung |
|---|---|---|---|
| Thi thật › kỹ năng (`thi-04`) | 1080 × 803 · 9 cột L R W S OVR Target · hàng chip lớp · "Đóng" | 720 (hoặc hộp 560 khi ≤ 8 em) · 5 cột · tên số "Chưa đạt · L" thay "HV · L" | B1, M1 |
| Thi thật › Theo GV (`thi-08`) | 1080 × 803 cho 1–7 dòng · không có cột nào nói GV dạy em bao lâu | Hộp 560 neo dưới số · thêm cột Tuần dạy | B2, M2 |
| Đạt MT / Đạt kỳ vọng (`cn-04`, `gv-07`) | 1080 × 803 · 10 cột · Lớp lặp · mở sẵn tab "Chưa đạt" · mọi điểm là ô viền | 720 · 9 cột · mở sẵn tab "Đạt" · điểm là chữ số | B8 |
| Chưa chốt PA (`sos-06`) | 1080 × 803 · số 31 ba lần · dải 4 ô có 2 ô "0" · mỗi nhóm 2 dòng + "+ 25 Case" · dòng 3 tầng chữ · cột Hạn rỗng | 720 · nhóm theo bước · một dòng một Case · quá hạn lên đầu · 20 dòng + "Xem thêm" | B3, M3 |
| Vi phạm · lớp (`yt-08`) | 1080 × 803 · cột Lớp lặp 14 lần · Người ghi · badge "Quá hạn 1 ngày" | 720 · 5 cột · hạn là ngày tô màu | B4, M4 |
| Vi phạm · em (`yt-05`) | 1080 × 803 · mỗi dòng lặp tên em + lớp | Hộp 440 · 3 cột | B5 |
| Học viên đang học (`cn-01`) | 835 × 803 · mỗi em 2 tầng với L R W S ✓✗ · không tiêu đề cột · cuộn ~3 600 px | 720 · bảng 5 cột có tiêu đề · dòng 48 px | B6 |
| GV · Chấm Test chưa làm (`gv-05`) | 1080 × 803 · 3 / 4 cột hằng số · badge "Chưa làm · quá 5 ngày" × 5 · 3 tab · "Đóng" · "Hồ sơ GV ›" | Hộp 440 · 3 cột · hạn ngày đỏ / vàng · tên GV ở đầu là link hồ sơ | C1 |
| HV cần chú ý, Lớp có vi phạm (`yt-01`, `yt-04`) | Panel lặp lại bảng ngay trên trang, ít thông tin hơn | **[XM-3]** bỏ panel — bấm số thì cuộn tới bảng | — |
| Tiến bộ (`cn-05`, `cn-09`) | Cột tên 546–626 px · bấm "% tăng" ra lượt giảm trước | Khuôn chung + tab Tăng / Giữ / Giảm, mở sẵn Tăng (chưa vẽ) | — |
| Cuối khoá / Đạt Test lớp thường (`cn-thuong-06`) | Ba bảng con lệch cột nhau | Một bộ cột chung cho các nhóm cấp độ (chưa vẽ) | — |
| PA có kết quả (`sos-21`) | Cân nhất bộ | Chỉ đổi khung 720, bỏ "dữ liệu đến", bỏ "Đóng" | — |
| Hộp Tuần dạy (`thi-12`) | Vừa nội dung | Giữ; mỗi kỹ năng hiện 2 GV dạy nhiều nhất + "+ n GV" (chưa vẽ riêng) | — |
| Tổng quan — việc (`tq-02` … `tq-06`) | Thuộc Công việc | Theo mockup v24 Công việc (session khác) | — |

## 6. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | Ghi chú |
|---|---|---|---|
| Bấm số mở danh sách; số 0 không bấm | Có | **Giữ** | |
| URL `?so-lieu=`, Esc đóng, focus về ô số, Tab không ra ngoài | Có | **Giữ** | hộp neo: thêm "bấm ra ngoài là đóng" |
| Tên em → hồ sơ; lớp → hồ sơ lớp | Có (cột riêng) | **Giữ** | lớp thành chữ nhỏ dưới tên, vẫn là link |
| ⓘ Cách tính | Có (14 × 18 px) | **Giữ**, nút 24 × 24 | |
| "Xem thêm 20" | Có | **Giữ** | |
| Tab Đạt / Chưa đạt ở ô tỉ lệ | Có | **Giữ**, mở sẵn tab của con số | B8 |
| Tab Chưa làm / Làm muộn / Đúng hạn trong panel GV | Có | **Bỏ** | mỗi ô đã đếm đúng một loại; hộp neo không che bảng nên bấm ô cạnh là xong. **[XM-4]** |
| Dải lọc theo bước ở "Chưa chốt PA" | Có | **Đổi** thành đầu nhóm theo bước | không còn lọc một bước, đổi lại thấy hết |
| "+ n Case" trong từng nhóm | Có | **Bỏ** | thay bằng 20 dòng + "Xem thêm" |
| Hàng chip lớp ở panel thi thật | Có | **Bỏ** | lớp nằm dưới tên; nhiều lớp thì xếp theo lớp |
| Bấm ô điểm trong panel → hộp Tuần dạy | Có | **Bỏ trong panel** | không hộp chồng panel; bảng "Danh sách kết quả" trên trang vẫn bấm được. **[XM-5]** |
| "Sao chép việc quá hạn để nhắn" (panel Chưa làm theo GV) | Có | **Giữ** | panel này chỉ đổi khung |
| "Hồ sơ GV ›" ở chân | Có | **Đổi**: tên GV ở đầu hộp là link | C1 |
| Nút "Đóng" ở chân | Có | **Bỏ** | ✕ + Esc + bấm ra ngoài |
| Xuất Excel, In, bộ lọc trang | Có | Không đụng | |

## 7. (c) Hạn / ngày

- Trong mọi panel số: hạn chỉ là **dd/mm/yyyy**, chữ số Inter; đỏ đậm = quá hạn, vàng đậm = còn ≤ 2 ngày, màu phụ = còn xa. Không "quá n ngày", không badge, không chú thích màu (chủ SP 24/11).
- Thời điểm của bài: mã tuần (`MT2 · W1 SEP`). Ngày thi, ngày vi phạm: dd/mm/yyyy.
- Đếm quá hạn ở đầu panel giữ là số đếm ("31 Case · 1 quá hạn").
- Khung: B3 (Case), B4 / B5 (Ý thức), C1 (GV chấm).

## 8. Bảng Theo GV (A2, A3-3)

- Xếp **kỹ năng → GV**; mỗi kỹ năng hiện 2 GV có % tuần dạy cao nhất; dòng "+ n GV · x % tuần dạy" mở tại chỗ, "Thu gọn" ở cuối nhóm. GV dạy 1 % vẫn có dòng khi mở.
- Cột mới **Tuần dạy** (% tuần GV dạy kỹ năng đó cho các em đã thi) — là lý do xếp hạng, cùng luật với hộp Tuần dạy. Số liệu các ô khác không đổi.
- **[XM-6]** Cột Tuần dạy cần máy chủ gộp % theo GV × kỹ năng (hiện chỉ tính cho từng em trong hộp Tuần dạy). Nếu chưa làm được: xếp theo số HV, bỏ cột.
- Đổi: web đang xếp GV → kỹ năng và hiện mọi GV.

## 9. Tự đo (Playwright, Edge, đo trên tệp mockup)

| Khung | Bảng | Bề rộng cột (px) | Bảng / khung | Chữ cột cuối cách mép phải |
|---|---|---|---|---|
| A1-B | Từng kỹ năng | 66 · 56 · 72 · 72 · 84 · 88 | 438 / 440 | 17 |
| A2-B | Theo GV | 76 · 220 · 6 × 107 | 938 / 940 | 17 |
| B1 | Panel 720 | 220 · 4 × 125 | 719 / 720 | 20 |
| B2 | Hộp M | 176 · 104 · 72 · 76 · 130 | 558 / 560 | 17 |
| B3 | Panel 720 | 172 · 198 · 86 · 147 · 116 | 719 / 720 | 20 |
| B3 | Bảng Theo tuần | 190 · 14 × 86 | 1390 / 1392 | 17 |
| B4 | Panel 720 | 176 · 100 · 239 · 92 · 112 | 719 / 720 | 20 |
| B5 | Hộp S | 104 · 222 · 112 | 438 / 440 | 17 |
| B6 | Panel 720 | 200 · 134 · 134 · 136 · 116 | 719 / 720 | 20 |
| B8 | Panel 720 | 172 · 118 · 7 × 61 | 719 / 720 | 20 |
| C1 | Hộp S | 176 · 146 · 116 | 438 / 440 | 17 |
| M1 | Panel 375 | 193 · 58 · 60 · 64 | 375 / 375 | 16 |
| M2 | Tờ đáy 375 | 179 · 56 · 56 · 84 | 375 / 375 | 10 |

- Chữ tràn ô / đè ô bên: **0** (quét mọi ô của mọi bảng). Tiêu đề cột kề nhau hở < 6 px: **0**. Hộp / panel ra ngoài khung: **0**. Chữ ra ngoài hộp: **0**. Tên đầu hộp bị cắt: **0**.
- ✕: mép phải cách hộp 7–8 px, tâm ✕ lệch tâm tiêu đề **0 px** ở mọi khung 1440.
- Vùng bấm số: 32 × 32 ở 1440, 44 × 44 ở 375 (hộp chữ 31 × 22).
- Cao: hộp B2 420 px (7 dòng) · hộp B5 372 · hộp C1 324 · tờ đáy M2 516 / 812 · dòng panel 48 · đầu panel 52.
- Phông Be Vietnam Pro + Inter đã tải khi chụp (`document.fonts.check` = true).

## 10. Lời chủ SP → đáp ở đâu

| Lời chủ SP (24/11) | Đáp |
|---|---|
| "kiểm tra lại các panels hiện lên khi bấm số ở các trang phân tích xem đã phù hợp chưa" | `bao-cao.md` mục 1, 3 (8 nhóm panel, 136 loại ô số) |
| "có bị to quá, nhỏ quá" | `bao-cao.md` mục 1, 6 #1 → khuôn cỡ theo nội dung: mục 4, khung B0–B8 |
| "thiếu / thừa thông tin, hay thông tin không liên quan, hay không cần thông tin không" | `bao-cao.md` mục 3 → bảng "loại số → cột tối thiểu" mục 4; từng panel mục 5 |
| "Các con số có cần phải để trong badge không, bạn thấy như thế nào dễ nhìn và đẹp hơn" | Không cần. Ba kiểu cạnh nhau A1, A2; khuyến nghị B (mục 3) |
| "mockup lại nếu thấy cần thiết" | `phan-tich-panel-so.html`, 21 ảnh |
| "số để đồng bộ là số thôi không cần badge, và căn cột cho cẩn thận đẹp" | Kiểu B / C; số đo cột mục 9 |
| "cứ hay có kiểu thừa một đống ở cột cuối, xong co rúm lại" | Luật cột mục 1 #4; đo mục 9; bảng trang đưa cột số ra cuối (B4, B5) |
| "Bảng theo GV dù có 1 % vẫn cần, nhưng để hiển thị 2 GV dạy nhiều nhất thôi, nhiều hơn thì bấm vào thêm" | A2, A3-3; mục 8 |
| "không để 'quá hạn' để ngày hạn luôn và màu tương ứng thôi, không cần giải thích color code" | Mục 7; B3, B4, B5, C1 |
| "Panels … to quá … sao phải to thế" (về Công việc) | Panel số không còn 835 / 1080; 720 hoặc hộp 440 / 560 |

## 11. Giả định và câu cần quyết

Giả định khi vẽ:
- "Hạn xử lý" của vi phạm (B4) lấy từ hạn của lần xử lý bắt buộc; vi phạm "Mới" (chưa tới ngưỡng) không có hạn.
- "Tuần học" của em (B6) = số tuần từ khai giảng lớp.
- Ngưỡng hộp neo: 8 dòng, 5 cột — chọn để hộp cao tối đa ~430 px, vừa màn 800.

| Mã | Câu cần quyết | Khuyến nghị |
|---|---|---|
| XM-1 | Số bấm được màu nhấn (B) hay màu chữ (C) — áp cho cả Tổng quan (Lớp cần chú ý đang code) lẫn Phân tích | B |
| XM-2 | Danh sách ngắn: hộp neo (B2) hay một kiểu panel 720 cao theo nội dung (B7) | B2 |
| XM-3 | Bỏ panel của "HV cần chú ý" và "Lớp có vi phạm" (bảng đã ở ngay trên trang) | Bỏ, bấm số thì cuộn tới bảng |
| XM-4 | Bỏ 3 tab trong panel GV (mất thao tác đổi tab trong panel) | Bỏ |
| XM-5 | Ô điểm trong panel số không còn mở hộp Tuần dạy | Bỏ trong panel, giữ ở bảng trang |
| XM-6 | Cột Tuần dạy ở bảng Theo GV cần máy chủ gộp | Làm; chưa kịp thì xếp theo số HV |

Chưa vẽ (cùng khuôn, vẽ khi code): panel Tiến bộ · Cuối khoá / Đạt Test lớp thường · PA có kết quả · hộp Tuần dạy "+ n GV" · bản 1280 · trạng thái đang tải / lỗi / rỗng của hộp neo (dùng lại của `KhungPanel`).
Việc để sau (ngoài phạm vi mockup, ghi ở `bao-cao.md` mục 8): 7 nghi lỗi dữ liệu / hiển thị cần session code kiểm.

## 12. Skill đã dùng

| Skill | Dùng vào đâu | Kết quả đáng ghi |
|---|---|---|
| `impeccable` critique (dual-agent) | Hiện trạng: 44 ảnh + máy dò 12 tệp + số đo | Điểm / 32: bảng điểm 21 · Tiến bộ 18 · Case 18 · Ý thức 18 · GV 16 · danh sách HV 15 · việc Tổng quan 14 · hộp Tuần dạy 23. Ba P1: cỡ panel, dòng không nói lý do, cột lệch |
| `impeccable` shape · layout · sàn chất lượng | Đề bài mục 2; luật cột; "không modal cho việc không cần chặn" → panel không nền mờ | Máy dò trên mockup: 2 phát hiện thật (ô mẫu trạng thái sát viền; bóng hộp quá rộng) đã sửa; còn lại là phần đọc mockup và v23.css |
| `ui-ux-pro-max` | `number-tabular`, `touch-target-size`, `color-not-decorative-only`, `truncation-strategy`, `drill-down-consistency`, `modal-escape` | Kho không có luật riêng cho "badge quanh số" / "panel danh sách" — phần đó là nhận xét người rà |
| `dataviz` | Chọn dạng: giữ bảng; thử thanh tỉ lệ (A4) | Bộ kiểm màu loại cặp xanh lá – xanh nhấn (ΔE 11,3) và xanh lá – đỏ sát nhau (ΔE 5,3 mù màu) → không khuyến nghị thanh |
| `web-design-guidelines` | Mockup: nút là `<button>`, nút biểu tượng có `aria-label`, `tabular-nums`, focus nhìn thấy, `overscroll-behavior: contain` ở panel / hộp, `text-wrap: balance` ở tiêu đề 375 | Hiện trạng: ⓘ đầu panel 14 × 18 px; cuộn nền rò qua nền mờ |
