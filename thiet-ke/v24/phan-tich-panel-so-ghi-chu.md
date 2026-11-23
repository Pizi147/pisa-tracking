# v24 · Phân tích — con số bấm được và panel số · ghi chú (bản 2)

Mockup: `phan-tich-panel-so.html` (mở bằng trình duyệt; mục lục A1 … M). Ảnh từng khung: `anh/pt-*.png` (18 ảnh).
Hiện trạng + rà: `docs/anh/ra-panel-phan-tich/` — `bao-cao.md`, `danh-sach.md` (136 loại ô số, 32 khuôn panel, ảnh 3 cỡ).
Dữ liệu bịa: Head Nguyễn Khánh Vy · Monbay · Fast Track · thứ Hai 14/09/2026 (W3 SEP) · 42 em thi thật (demo thật chỉ 3 em, không thấy được cột 2 chữ số). Mọi bảng sinh từ một bộ số trong tệp.
Không sửa mã web / máy chủ.

**Bản 2 — sửa theo lời chủ SP 24/11 sau khi xem bản 1** (`plan.md` mục 4, dòng "Chủ SP 24/11 (xem mockup số Phân tích…)"): số trơn **căn giữa**, màu theo nghĩa · bảng Theo GV **bỏ** cột Tuần dạy · cột SOS 1 / 2 / 3 **giữ ô viền** · mọi cột số trong mockup căn giữa (luật NH9 mới).

## 1. Đã chốt và còn chờ

| # | Nội dung | Trạng thái | Khung |
|---|---|---|---|
| 1 | **Số bấm được = số trơn, căn giữa cột**; màu theo nghĩa: Vượt xanh lá · Đạt và số đếm xanh dương · Chưa đạt đỏ; % nhỏ dưới số; 0 mờ không bấm | **Chủ SP chốt 24/11** | A1, A2, A3 |
| 2 | **Bảng Theo GV**: kỹ năng → 2 GV dạy nhiều tuần nhất + "+ n GV"; **không** cột Tuần dạy | **Chủ SP chốt 24/11** | A1, A3-3 |
| 3 | **Bảng SOS**: số ở cột SOS 1 / 2 / 3 giữ ô viền; các cột khác số trơn căn giữa | **Chủ SP chốt 24/11** | B3 |
| 4 | **Luật cột (NH9)**: cột tên vừa chữ, các cột số rộng bằng nhau, **số căn giữa**; căn phải chỉ cho hạn / ngày ở cột cuối | **Chủ SP chốt 24/11** | mọi khung, số đo mục 9 |
| 5 | **Hạn = ngày dd/mm/yyyy tô màu**, không "quá n ngày" | Chủ SP chốt 24/11 (từ Công việc) | B3, B4, B5, C1 |
| 6 | Một khuôn panel số: đầu một dòng · chỉ các cột là lý do · không chân "Đóng" · không còn 835 / 1080 | Đề xuất | B0 |
| 7 | Danh sách ngắn: hộp neo cạnh số (B2) **hay** một kiểu panel 720 cao theo nội dung (B7) | **Chờ chủ SP — XM-2** | B2 ↔ B7 |
| 8 | XM-3 bỏ panel lặp bảng trên trang · XM-4 bỏ 3 tab panel GV · XM-5 ô điểm trong panel không mở hộp Tuần dạy | **Chờ chủ SP** | mục 11 |

## 2. Đề bài rút gọn (impeccable `shape`)

- Ai: Head, Quản trị (chính), CX — máy tính ở trung tâm; 375 để tra nhanh. Chế độ Operate, báo cáo chỉ đọc.
- Việc chính: nhìn bảng số → thấy số lạ → bấm → biết ngay **em nào, vì sao** → mở hồ sơ nếu cần → quay lại bảng, bấm số kế.
- Hướng: con số là chữ số, không phải nút có khung; danh sách mở ra nằm sát con số khi ngắn, nằm ở panel phải khi dài; trang phía sau luôn đọc được.
- Giữ nguyên: token màu / phông / khung v23, khung panel 720 của Công việc v24, luật G7 (số trên trang = số dòng panel), URL `?so-lieu=`, Esc + focus về ô số, "Xem thêm 20".
- Không làm: biểu đồ thay bảng · thêm nút việc vào panel Phân tích · đổi số liệu.

## 3. (a) Cách hiện số — đã chốt (A1, A2, A3)

| | Web hôm nay | Đã chốt |
|---|---|---|
| Dáng | Ô viền 40 × 30, số 14 px | Chữ số 15 px đậm 600 (Inter, chữ số đều bề rộng), không ô, không nền |
| Căn | Giữa | **Giữa** — số, % dưới số và đầu cột cùng một trục (đo: lệch tâm 0 px, mục 9) |
| Màu | Chữ trong ô: xanh lá / xanh dương / đỏ | **Giữ theo nghĩa**: Vượt `--ok` xanh lá · Đạt và số đếm thường (HV, Lượt MT…) `--accent` xanh dương · Chưa đạt / cột "xấu" (Chưa xử lý, Chưa làm) `--bad` đỏ · Thiếu điểm, Chưa chốt PA `--soon` vàng |
| % phụ | Dưới ô | Dưới số, 12 px mờ, căn giữa |
| Số 0 | Mờ, không bấm | Mờ, không bấm, không vào thứ tự Tab; "—" chỉ cho "không áp dụng" |
| Số không bấm (Điểm TB, ± kỳ trước) | Màu chữ | Màu chữ, thường, căn giữa |
| Rê / bàn phím / đang mở | Viền đậm | Gạch chân + nền nhạt cùng màu / vòng focus 2 px / thêm viền 1 px cùng màu số |
| Vùng bấm | 40 × 30 | Vô hình 32 × 32 (375: **44 × 44**) |
| Dòng "Từng kỹ năng" (đo) | 59 px ở mockup (web thật 67) | **49 px** |
| Ngoại lệ | — | Cột **SOS 1 / 2 / 3** của bảng SOS giữ ô viền 40 × 28 theo màu mức SOS (viền vàng · nền nâu · nền đỏ) — chủ SP: "để màu không hiện không rõ ràng" |

Khác:
- Bỏ ô viền chèn giữa câu: "vào **3** · kết thúc **1** trong kỳ".
- Thứ tự cột hai bảng Thi thật làm một: HV · Vượt · Đạt · Chưa đạt · Điểm TB (web đang đặt Điểm TB ở hai chỗ khác nhau).
- Số lớn đầu trang (26 px) cùng luật màu; thẻ SOS 1 / 2 / 3 ở đầu trang SOS có chip tên mức làm tiêu đề.

Đã cân và bỏ ở bản 1 (không còn trong mockup): số một màu nhấn chung, căn phải · số màu chữ chính với % cùng dòng (gợi ý của lượt rà impeccable) · thêm thanh tỉ lệ mảnh (gợi ý của `dataviz`; bộ kiểm màu báo xanh lá – đỏ đứng sát chỉ cách ΔE 5,3 với người mù màu đỏ – lục).

## 4. (b) Khuôn panel số (B0)

| Phần | Luật | Web hôm nay |
|---|---|---|
| Đầu — một dòng, 48 px (panel 52) | **Tên số** đúng chữ ô vừa bấm + đối tượng · **tổng + đơn vị** · ⓘ · ✕. Phạm vi (chương trình · kỳ · chi nhánh) chỉ thêm ở panel 720 | Tên số · ⓘ · phạm vi · "dữ liệu đến 14/09", rồi một dòng "3 HV", rồi hàng chip lớp |
| Thân | Một bảng. Cột 1 = Học viên (tên là link hồ sơ; lớp chữ nhỏ dưới tên, bỏ khi tên số đã có lớp). Tiếp theo chỉ các cột là lý do; cột lý do chính nền nhấn nhạt. Xếp nặng / quá hạn trước | 9–10 cột cho mọi loại số |
| Cột | Cột tên vừa chữ (172–220); các cột còn lại chia đều; **cột số căn giữa**; cột chữ / ngày căn trái; **hạn ở cột cuối căn phải**, sát mép | Cột tên nuốt hết phần thừa (374–755 px) |
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

Ở 1280 panel 720 còn lại 560 px trang bên trái (hiện tại còn 320). Hộp neo đóng khi bấm ra ngoài / Esc / ✕; cùng họ với hộp Tuần dạy đang có (`HopNeo`).

**[XM-2] Hai kiểu mở hay một? — CHƯA QUYẾT, mockup giữ cả hai.** Lượt rà độc lập phản đối hộp neo cho danh sách: cùng một cột mà ô "7" mở hộp, ô "30" mở panel thì trái "một danh sách một kiểu mở". Phương án kia: một kiểu duy nhất — panel 720 cao theo số dòng (**B7**, vẽ cùng ô số với B2 để so).

| | B2 · hộp neo | B7 · panel cao theo nội dung |
|---|---|---|
| Kiểu mở | Hai (theo số dòng) | Một |
| Gần con số | Ngay dưới số | Góc phải, xa số |
| Che bảng nguồn | Vài dòng dưới ô vừa bấm | Che nửa phải trang — bảng nằm bên phải (Theo GV) thì che luôn ô vừa bấm |
| Bấm ô kế | Bấm ra ngoài là đóng, bấm tiếp | Phải đóng (hoặc cuộn) mới thấy ô kế |
| Code | `HopNeo` sẵn có + `KhungPanel` | Chỉ `KhungPanel` (thêm chế độ cao theo nội dung) |

Người vẽ nghiêng về B2 vì việc chính ở Phân tích là so nhiều ô liền nhau trong một bảng; luật đoán trước được: **số ≤ 8 → hộp**.

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
| Thi thật › Theo GV (`thi-08`) | 1080 × 803 cho 1–7 dòng · không có cột nào nói GV dạy em bao lâu | Hộp 560 neo dưới số · thêm cột Tuần dạy (nơi duy nhất hiện % tuần dạy, cùng hộp Tuần dạy) | B2, M2 |
| Đạt MT / Đạt kỳ vọng (`cn-04`, `gv-07`) | 1080 × 803 · 10 cột · Lớp lặp · mở sẵn tab "Chưa đạt" · mọi điểm là ô viền | 720 · 9 cột · mở sẵn tab "Đạt" · điểm là chữ số căn giữa | B8 |
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
| Tab Chưa làm / Làm muộn / Đúng hạn trong panel GV | Có | **Bỏ** | mỗi ô đã đếm đúng một loại; hộp neo không che bảng nên bấm ô cạnh là xong. **[XM-4] chờ chủ SP** |
| Dải lọc theo bước ở "Chưa chốt PA" | Có | **Đổi** thành đầu nhóm theo bước | không còn lọc một bước, đổi lại thấy hết |
| "+ n Case" trong từng nhóm | Có | **Bỏ** | thay bằng 20 dòng + "Xem thêm" |
| Hàng chip lớp ở panel thi thật | Có | **Bỏ** | lớp nằm dưới tên; nhiều lớp thì xếp theo lớp |
| Bấm ô điểm trong panel → hộp Tuần dạy | Có | **Bỏ trong panel** | không hộp chồng panel; bảng "Danh sách kết quả" trên trang vẫn bấm được. **[XM-5] chờ chủ SP** |
| "Sao chép việc quá hạn để nhắn" (panel Chưa làm theo GV) | Có | **Giữ** | panel này chỉ đổi khung |
| "Hồ sơ GV ›" ở chân | Có | **Đổi**: tên GV ở đầu hộp là link | C1 |
| Nút "Đóng" ở chân | Có | **Bỏ** | ✕ + Esc + bấm ra ngoài |
| Xuất Excel, In, bộ lọc trang | Có | Không đụng | |

## 7. (c) Hạn / ngày

- Trong mọi panel số: hạn chỉ là **dd/mm/yyyy**, chữ số Inter; đỏ đậm = quá hạn, vàng đậm = còn ≤ 2 ngày, màu phụ = còn xa. Không "quá n ngày", không badge, không chú thích màu.
- Hạn đứng cột cuối, căn phải sát mép (ngoại lệ được phép của luật căn giữa).
- Thời điểm của bài: mã tuần (`MT2 · W1 SEP`). Ngày thi, ngày vi phạm: dd/mm/yyyy, căn trái.
- Đếm quá hạn ở đầu panel giữ là số đếm ("31 Case · 1 quá hạn").
- Khung: B3 (Case), B4 / B5 (Ý thức), C1 (GV chấm).

## 8. Bảng Theo GV (A1, A3-3) — chủ SP chốt 24/11

- Xếp **kỹ năng → GV**; mỗi kỹ năng hiện 2 GV dạy kỹ năng đó nhiều tuần nhất; dòng "+ n GV" mở tại chỗ, "Thu gọn" ở cuối nhóm. GV dạy 1 % số tuần vẫn có dòng khi mở.
- **Không** cột Tuần dạy, không "· x % tuần dạy" cạnh "+ n GV". Cột: Kỹ năng · Giáo viên · HV · Vượt · Đạt · Chưa đạt · Điểm TB.
- % tuần dạy chỉ hiện ở **hộp / panel của từng em** (B2, hộp Tuần dạy): em trượt hay vượt kỹ năng nào thì thấy GV nào dạy em kỹ năng đó nhiều nhất.
- Thứ tự 2 GV vẫn theo tuần dạy (không in số) — cách tính / phạm vi "2 GV" theo quyết định ở #2067.
- Đổi: web đang xếp GV → kỹ năng và hiện mọi GV. Số liệu từng ô không đổi.

## 9. Tự đo (Playwright, Edge, đo trên tệp mockup bản 2)

| Khung | Bảng | Bề rộng cột (px) | Bảng / khung | Lệch tâm số ↔ tâm cột |
|---|---|---|---|---|
| A1 | Từng kỹ năng | 66 · 5 × 74 | 438 / 440 | 0 |
| A1 | Theo GV | 76 · 220 · 5 × 128 | 938 / 940 | 0 |
| A3-2 (375) | Từng kỹ năng | 62 · 5 × 56 | 341 / 343 | 0 |
| A3-2 (375) | Theo GV | 135 · 44 · 50 · 50 · 62 | 341 / 343 | 0 |
| B1 | Panel 720 | 220 · 4 × 125 | 719 / 720 | 0 |
| B2 | Hộp M | 176 · 104 · 72 · 76 · 130 | 558 / 560 | 0 |
| B3 | Bảng Theo tuần | 190 · 14 × 86 | 1390 / 1392 | 0 (cả ô viền SOS) |
| B3 | Panel 720 | 172 · 198 · 86 · 147 · 116 | 719 / 720 | hạn cách mép 20 |
| B4 | Bảng Học viên cần chú ý | 220 · 140 · 320 · 410 · 150 · 150 | 1390 / 1392 | 0 |
| B4 | Panel 720 | 176 · 100 · 239 · 92 · 112 | 719 / 720 | hạn cách mép 20 |
| B5 | Hộp S | 104 · 222 · 112 | 438 / 440 | hạn cách mép 17 |
| B6 | Bảng Theo lớp | 220 · 3 × 158 | 694 / 696 | 0 |
| B6 | Panel 720 | 200 · 134 · 134 · 136 · 116 | 719 / 720 | 0 |
| B8 | Panel 720 | 172 · 118 · 7 × 61 | 719 / 720 | 0 |
| C1 | Bảng Giáo viên | 240 · 7 × 164 | 1390 / 1392 | 0 |
| C1 | Hộp S | 176 · 146 · 116 | 438 / 440 | hạn cách mép 17 |
| M1 | Panel 375 | 193 · 58 · 60 · 64 | 375 / 375 | 0 |
| M2 | Tờ đáy 375 | 167 · 56 · 56 · 96 | 375 / 375 | 0 |

- Chữ tràn ô / đè ô bên: **0** (quét mọi ô của mọi bảng). Tiêu đề cột kề nhau hở < 6 px: **0** (375: đầu cột "Điểm TB" rút thành "TB"). Hộp / panel ra ngoài khung: **0**. Chữ ra ngoài hộp: **0**. Tên đầu hộp bị cắt: **0**.
- ✕: mép phải cách hộp 7–8 px, tâm ✕ lệch tâm tiêu đề **0 px** ở mọi khung 1440.
- Vùng bấm số: 32 × 32 ở 1440, 44 × 44 ở 375 (hộp chữ 31 × 22). Ô viền SOS 40 × 28 (375: 44 × 44).
- Cao: dòng Từng kỹ năng 49 px (ô viền: 59) · thẻ Theo GV 5 kỹ năng 735 px · dòng bảng SOS 46 px · hộp B2 420 px (7 dòng) · hộp B5 372 · hộp C1 324 · panel B7 423 · tờ đáy M2 516 / 812 · dòng panel 48 · đầu panel 52.
- Phông Be Vietnam Pro + Inter đã tải khi chụp (`document.fonts.check` = true).

## 10. Lời chủ SP → đáp ở đâu

| Lời chủ SP (24/11) | Đáp |
|---|---|
| "kiểm tra lại các panels hiện lên khi bấm số ở các trang phân tích xem đã phù hợp chưa" | `bao-cao.md` mục 1, 3 (8 nhóm panel, 136 loại ô số) |
| "có bị to quá, nhỏ quá" | `bao-cao.md` mục 1, 6 #1 → khuôn cỡ theo nội dung: mục 4, khung B0–B8 |
| "thiếu / thừa thông tin, hay thông tin không liên quan, hay không cần thông tin không" | `bao-cao.md` mục 3 → bảng "loại số → cột tối thiểu" mục 4; từng panel mục 5 |
| "Các con số có cần phải để trong badge không" | Không cần — A1; so trước → sau A2 |
| "Ok chọn B nhưng các số cần căn giữa và màu vẫn nên để xanh lá, xanh dương, đỏ" | Mục 3; A1, A3-1; đo lệch tâm 0 px mục 9 |
| "Tuần dạy hiện ở trên bảng theo GV làm gì, không cần cột đó… box thông tin có ghi tuần dạy rất hợp lý" | Mục 8; A1 (bảng không cột Tuần dạy) · B2, M2 (hộp có cột Tuần dạy) |
| "nếu học sinh trượt, thì ai là người chịu trách nhiệm nhiều nhất cho kĩ năng đó, ngược lại nếu học sinh vượt…" | B2: mỗi em một dòng, điểm kỹ năng + GV dạy em n / m tuần · %, xếp % cao trước |
| "Bảng SOS tôi nghĩ vẫn nên có viền cho số ở các chỗ SOS vì để màu không hiện không rõ ràng" | B3: cột SOS 1 / 2 / 3 ô viền; A3-1 |
| "các con số nên để căn giữa… chỗ nào bạn nghĩ căn trái phải mà ok thì để cũng được" | Mọi cột số căn giữa (kể cả trong hộp / panel); căn phải chỉ còn hạn / ngày ở cột cuối — mục 4, 7 |
| "số để đồng bộ là số thôi không cần badge, và căn cột cho cẩn thận đẹp" | Mục 3; số đo cột mục 9 |
| "cứ hay có kiểu thừa một đống ở cột cuối, xong co rúm lại" | Cột số rộng bằng nhau chia hết bề ngang; bảng trang đưa cột chữ vào giữa, cột số ra cuối (B4, B5) |
| "Bảng theo GV dù có 1 % vẫn cần, nhưng để hiển thị 2 GV dạy nhiều nhất thôi, nhiều hơn thì bấm vào thêm" | A1, A3-3; mục 8 |
| "không để 'quá hạn' để ngày hạn luôn và màu tương ứng thôi" | Mục 7; B3, B4, B5, C1 |
| "mockup lại nếu thấy cần thiết" | `phan-tich-panel-so.html`, 18 ảnh |

## 11. Giả định và câu cần quyết

Giả định khi vẽ:
- "Hạn xử lý" của vi phạm (B4) lấy từ hạn của lần xử lý bắt buộc; vi phạm "Mới" (chưa tới ngưỡng) không có hạn.
- "Tuần học" của em (B6) = số tuần từ khai giảng lớp.
- Ngưỡng hộp neo: 8 dòng, 5 cột — chọn để hộp cao tối đa ~430 px, vừa màn 800.

| Mã | Câu | Trạng thái |
|---|---|---|
| XM-1 | Màu / căn của số bấm được | **Đã chốt 24/11**: số trơn căn giữa, màu theo nghĩa |
| XM-2 | Danh sách ngắn: hộp neo (B2) hay một kiểu panel 720 cao theo nội dung (B7) | **Chờ chủ SP** — người vẽ nghiêng B2 |
| XM-3 | Bỏ panel của "HV cần chú ý" và "Lớp có vi phạm" (bảng đã ở ngay trên trang) | **Chờ chủ SP** — đề xuất bỏ, bấm số thì cuộn tới bảng |
| XM-4 | Bỏ 3 tab trong panel GV (mất thao tác đổi tab trong panel) | **Chờ chủ SP** — đề xuất bỏ |
| XM-5 | Ô điểm trong panel số không còn mở hộp Tuần dạy | **Chờ chủ SP** — đề xuất bỏ trong panel, giữ ở bảng trang |
| XM-6 | Cột Tuần dạy ở bảng Theo GV | **Đã chốt 24/11**: không có cột; % chỉ ở hộp / panel từng em |

Chưa vẽ (cùng khuôn, vẽ khi code): panel Tiến bộ · Cuối khoá / Đạt Test lớp thường · PA có kết quả · hộp Tuần dạy "+ n GV" · bản 1280 · trạng thái đang tải / lỗi / rỗng của hộp neo (dùng lại của `KhungPanel`).
Việc để sau (ngoài phạm vi mockup, ghi ở `bao-cao.md` mục 8): 7 nghi lỗi dữ liệu / hiển thị cần session code kiểm.

## 12. Skill đã dùng

| Skill | Dùng vào đâu | Kết quả đáng ghi |
|---|---|---|
| `impeccable` critique (dual-agent) | Hiện trạng: 44 ảnh + máy dò 12 tệp + số đo | Điểm / 32: bảng điểm 21 · Tiến bộ 18 · Case 18 · Ý thức 18 · GV 16 · danh sách HV 15 · việc Tổng quan 14 · hộp Tuần dạy 23. Ba P1: cỡ panel, dòng không nói lý do, cột lệch |
| `impeccable` shape · layout · sàn chất lượng | Đề bài mục 2; luật cột; "không modal cho việc không cần chặn" → panel không nền mờ | Máy dò trên mockup: 2 phát hiện thật (ô mẫu trạng thái sát viền; bóng hộp quá rộng) đã sửa; còn lại là phần đọc mockup và v23.css |
| `ui-ux-pro-max` | `number-tabular`, `touch-target-size`, `color-not-decorative-only`, `truncation-strategy`, `drill-down-consistency`, `modal-escape` | Kho không có luật riêng cho "badge quanh số" / "panel danh sách" — phần đó là nhận xét người rà |
| `dataviz` | Chọn dạng: giữ bảng; đã thử thanh tỉ lệ ở bản 1 rồi bỏ | Bộ kiểm màu: xanh lá – đỏ sát nhau ΔE 5,3 (mù màu đỏ – lục) → màu số luôn đi kèm tên cột (Vượt / Đạt / Chưa đạt), không chỉ phân biệt bằng màu |
| `web-design-guidelines` | Mockup: nút là `<button>`, nút biểu tượng có `aria-label`, `tabular-nums`, focus nhìn thấy, `overscroll-behavior: contain` ở panel / hộp, `text-wrap: balance` ở tiêu đề 375 | Hiện trạng: ⓘ đầu panel 14 × 18 px; cuộn nền rò qua nền mờ |
