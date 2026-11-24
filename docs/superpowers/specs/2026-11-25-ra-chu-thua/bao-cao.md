# Rà chữ thừa · lặp · dấu treo · cân đối cột — toàn website (chủ SP 25/11, plan.md mục 4 · #2121 · ý 6)

Lời chủ SP: "rà lại một lần nữa TOÀN BỘ WEBSITE ở những vấn đề như mục 2, 3 (chữ lặp lại tiêu đề: "Speaking" dưới "Chấm Speaking", "Mock" dưới "Mock Test"; dấu "·" treo). Đừng để thừa chữ, dày chữ, rà cho kĩ mọi ngóc ngách; nếu có thể cân đối bố cục UI/UX cho gọn hơn thì tốt."

## 1. Cách rà

- Bản demo seed, dev server riêng, đăng nhập "Vào nhanh" từng vai: GVCN (7), GV nhiều chi nhánh (9), QL / Head (2), TVV (23), CX (24), BPXL (33), Head tutor (25), Quản trị (1). Tối.
- Cỡ màn: **1440** (cả 8 vai) · **1280** và **375** (Quản trị, QL, GVCN, TVV). Ở mỗi vai: mọi trang đi được từ thanh trên, **mọi tab** (HV & Lớp ▸ Tất cả / Đang SOS / Lịch thi / Phân công GV; hồ sơ lớp 4 tab; hồ sơ HV 3 tab; Test 2 tab; Phân tích 5 tab; Quản trị 8 tab; hồ sơ GV 3 tab…), 3–4 hồ sơ lớp, 4 hồ sơ HV, hồ sơ Mock Test, Chuông, hộp "Thêm học viên", các panel mở bằng nút an toàn.
- Công cụ: một script Playwright (không nằm trong repo — chạy ở thư mục tạm) trong trang đo từng khối chữ: dấu `·` mở / đóng / đôi · chữ bị cắt (`…`, `scrollWidth > clientWidth`) · ô bảng ≥ 3 dòng · cột có MỌI ô cùng một giá trị · chữ ngắn lặp ≥ 3 lần trong khung có tiêu đề chứa nó · đoạn chữ tĩnh ≥ 50 ký tự cỡ ≤ 13 px · rộng cột so với nội dung (khoảng trống). Rồi đọc ảnh toàn trang từng màn bằng mắt.
- Kết quả đo: **không có tràn ngang** ở 375 / 1280 (QL, GVCN); không chữ bị cắt "…" ngoài dấu "…" quy ước của nút mở hộp (`Xuất Excel…`, `Gộp…`, `Từ chối…`); không dấu `·` treo thật (các `·` cuối dòng bị đo là dấu nối trước nút kế bên — đúng).
- **Không đụng** (việc của session khác): hàng việc ở Công việc · trang Cuối khoá / Chốt lộ trình · các ô số Phân tích (PR #2120). Chỗ chạm các khu đó chỉ ghi ở mục 9.

Ký hiệu luật: **R1** lặp tên tiêu đề / tab / nhóm · **R2** dấu phân cách treo / đôi · **R3** nhãn + giá trị nói cùng một điều hai lần · **R4** chú thích tĩnh → ⓘ hoặc bỏ · **R5** ô dày nhiều dòng · **R6** cắt "…" · **R7** cột lệch / khoảng trống (DESIGN NH9) · **R8** thứ tự trường không nhất quán.
Trạng thái: **SỬA** = dự kiến làm trong PR khu (mục 2–6; mỗi PR khu ghi lại mục nào làm được, mục nào đổi sang [XM]) · **[XM]** = chữ mang luật nghiệp vụ hoặc chưa chắc → để nguyên, hỏi PTA Plan · **GIỮ** = đã soi, đúng, không đổi.

## 2. Tổng quan (PR 1)

| # | Ở đâu · vai · cỡ | Ảnh | Trước → Sau | Luật | |
|---|---|---|---|---|---|
| TQ-1 | Tổng quan · QL, Quản trị · 1440 / 1280 | `tq-ql-1440.jpg` | Ô số "GV quá hạn **4** · 21 việc quá hạn" rồi ngay dưới khung "Giáo viên **4 có việc quá hạn** ⓘ" → khung chỉ còn "Giáo viên ⓘ" (số đã ở ô trên) | R3 | ĐÃ SỬA #2127 |
| TQ-2 | cùng trang | `tq-ql-1440.jpg` | Ô số "Chờ duyệt **10**" + khung "Chờ duyệt **10**" + chân "+ 5 yêu cầu" → khung "Chờ duyệt" không kèm số (số ở ô trên, phần còn lại ở chân) | R3 | ĐÃ SỬA #2127 |
| TQ-3 | khung Giáo viên · cột đầu | `tq-ql-1440.jpg` | Khung "Giáo viên" có cột đầu cũng tên "Giáo viên" | R1 | [XM] bảng cần đầu cột cho đọc màn hình; đổi tên khung sang "Việc quá hạn theo GV" sẽ trùng ô "GV quá hạn" |
| TQ-4 | Tình hình · cột trái | `tq-ql-1440.jpg` | "SOS 1 · 2 · 3 / HV hiện tại", "Thi tháng này / HV có ngày thi", "Đạt Target thi thật / đã có kết quả" — dòng phụ giải nghĩa đơn vị | R4 | [XM] số nằm trong ô Tình hình cũ, chưa chắc bỏ được dòng phụ |
| TQ-5 | Chuông | `tq-chuong-1440.png` | Mỗi tin "Yêu cầu · MB FT 101 · 16:00" rồi "Báo Head · …": nhãn loại "Yêu cầu" lặp ở mọi dòng cùng loại | R1 | [XM] nhãn loại giúp lướt; thuộc luồng thông báo |
| TQ-6 | Chuông · tiêu đề | `tq-chuong-1440.png` | "Việc cần làm 14 việc · 7 quá hạn" + hai dòng nhỏ cộng lại 14 | R3 | GIỮ (tổng + chia nhóm) |

## 3. Học viên & Lớp (PR 2)

| # | Ở đâu · vai · cỡ | Ảnh | Trước → Sau | Luật | |
|---|---|---|---|---|---|
| HL-1 | Danh sách lớp · mọi vai · 1440 | `hl-danh-sach-gv-1440.jpg` | "33 HV · … · SOS 1 **4 HV** · SOS 2 **2 HV** · SOS 3 **5 HV**" → "SOS 1 · 4 · SOS 2 · 2 · SOS 3 · 5": đơn vị "HV" đã nói một lần ở đầu dòng | R1 | GIỮ (thử bỏ "HV" → "SOS 1 4" mất nghĩa) |
| HL-2 | Tab Lịch thi · mọi vai · 1440 | — | Cột "Ghi chú" 43 / 43 ô là "—" (chiếm ~20 % bề ngang, ô trống) → ẩn cột khi không dòng nào có ghi chú; có ghi chú thì hiện lại | R3 R7 | [XM] cột là nơi bấm "+ Ghi chú" |
| HL-3 | Hồ sơ lớp · KPI phải | `hl-lop-y-thuc-1440.jpg` | "Chờ duyệt · 8", "Chờ chấm · **15 việc**", "Quá hạn của lớp · 14" — chỉ ô giữa có đơn vị → "Chờ chấm · 15" | R8 | GIỮ ("việc" ≠ "bài" ở danh sách lớp; có phép kiểm) |
| HL-4 | Hồ sơ lớp · tab Ý thức & Phối hợp | `hl-lop-y-thuc-1440.jpg` | Nhóm "Các em khác 29 HV · theo tên" rồi **25 dòng** "✓ Chưa có vi phạm" và 8 dòng "Không có vi phạm chờ" → dòng em chỉ còn tên (+ nút Lịch sử nếu có); tên nhóm nói rõ "Các em khác · không có vi phạm chờ" | R1 R3 | ĐÃ SỬA #2129 |
| HL-5 | Hồ sơ lớp · tab Phân tích lớp | — | "Đạt theo kỹ năng · 33 HV **· ô = HV đạt / HV có điểm** ⓘ" — chú thích tĩnh cạnh ⓘ → "33 HV ⓘ" (giải nghĩa nằm trong ⓘ) | R4 | ĐÃ SỬA #2129 |
| HL-6 | Hồ sơ lớp · Phân tích lớp | — | Cột MT4, MT5 toàn "—" khi lớp mới có MT1–MT3 | R7 | [XM] bảng cố định 5 cột MT để lớp so được; chủ SP quyết |
| HL-7 | Hồ sơ lớp · header | `hl-lop-y-thuc-1440.jpg` | Nhãn "Fast Track" cạnh tên lớp và bộ chuyển lớp "1/6 · Fast Track" | R1 | GIỮ (chưa thấy trùng trong mã) |
| HL-8 | Hồ sơ HV · Học thuật · bảng Mock Test | `hl-hv-hoc-thuat-1440.jpg` | Cột "Lớp lúc đánh giá": MB FT 101 · MB FT 101 · MB FT 101, trùng ô "Lớp MB FT 101" ở đầu hồ sơ → ẩn cột khi mọi hàng là lớp hiện tại; em đã đổi lớp thì hiện | R3 R7 | [XM] cần xử lý em đã chuyển lớp + hàng Thi thật dùng chung cột |
| HL-9 | Hồ sơ HV · chân bảng Mock Test | `hl-hv-hoc-thuat-1440.jpg` | "Target đã đổi 1 lần — lần gần nhất W2 AUG: 7.0 → 6.5 (Mục tiêu lúc tư vấn). **Các lượt đã chốt vẫn giữ kỳ vọng tính theo Target lúc đó.**" → câu 1 giữ, câu 2 vào ⓘ của khung | R4 | GIỮ (hệ quả của đổi Target) |
| HL-10 | Hồ sơ HV · Lộ trình & lớp | — | "Mới nhất ở bên phải · cuối mỗi thẻ là cách em sang lớp sau" (chữ tĩnh trên bảng chương) → bỏ (thẻ tự đọc được) | R4 | ĐÃ SỬA #2129 |
| HL-11 | Hồ sơ HV · Thi thật hiện **3 lần** | `hl-hv-hoc-thuat-1440.jpg` | "Thi thật Dự kiến 03/2027" + "Target 6.5" ở đầu hồ sơ, rồi hàng "Thi thật · IELTS · dự kiến 03/2027 · Target 6.5 · chưa thi" cuối bảng Mock Test | R3 | [XM] hàng cuối bảng là nơi sửa ngày thi / Target (thao tác) |
| HL-12 | Hồ sơ HV · Case | `hl-hv-hoc-thuat-1440.jpg` | "Chưa có PA" ở hàng gập · "Chưa có PA. Case cần ít nhất 1 PA trước hạn…" trong khối · "cần ít nhất 1 PA ⓘ" cạnh nút Hoàn thành Case | R3 | GIỮ (hạn / lý do chặn — luật; phần cạnh nút theo "Case – PA bấm thẳng") |
| HL-13 | Hồ sơ HV · bên trái dưới Mock Test | `hl-hv-hoc-thuat-1440.jpg` | Khung "Tiến độ trên lớp ⓘ — Chưa có ghi nhận" cao 80 px, bên trái trống ~700 px dọc theo khung Case | R7 | [XM] bố cục hai cột từ mockup đã duyệt |
| HL-14 | Lưu trữ · nhóm chi nhánh | — | "Uông Bí · 1 em" rồi hàng "1 em" lặp 3 lần | R1 | GIỮ khi chỉ 1 em (chưa thấy sai) |
| HL-15 | Hồ sơ lớp · Báo cáo PH | — | Cột "Xuất": hai nút chữ "Excel · PDF" lặp 31 hàng | R5 | [XM] thao tác từng em; muốn gom thành một ⋯ thì chủ SP quyết |
| HL-16 | Phân công GV | — | Hai bảng Giảng dạy / GVCN cùng bốn nút "Xếp: Tổng · FT · Lớp thường · Tên" | R1 | GIỮ (ô chọn thả xuống, không phải chữ lặp trên màn) |

## 4. Test (PR 3)

| # | Ở đâu · vai · cỡ | Ảnh | Trước → Sau | Luật | |
|---|---|---|---|---|---|
| TE-1 | Lịch Test tuần · bảng "Test tuần này" · 1440 | `te-lich-1440.jpg` | Cột "Đợt" rộng ~640 px chỉ chứa "Final Test · 4 em" (~120 px) → hai khoảng trống ~500 px trước "Hạn chấm"; cột "Tiến độ" lấy phần còn lại | R7 | [XM] "Đợt giãn" chủ SP 19/11 đã chốt; đề xuất chia lại cột |
| TE-2 | Lịch Test tuần · hàng mở ra | `te-lich-1440.jpg` | "Tổng hợp /50" (đầu cột) · ô "Tổng số câu **Tổng hợp** [50]" cùng một hàng | R1 | ĐÃ SỬA #2132 |
| TE-3 | Lịch Test tuần · thanh tóm tắt | `te-lich-1440.jpg` | "Quá hạn **45**" (thanh) + nhóm "Quá hạn chấm · 4 lớp · **45 bài**" ngay dưới | R3 | GIỮ (thanh tóm tắt toàn chi nhánh, nhóm là nơi mở) |
| TE-4 | Hồ sơ Mock Test · bảng kỹ năng | `te-mock-1440.jpg` | Cột "Lịch" là W2 JUL ở **cả 4 hàng**, trùng "Lịch W2 JUL" ở đầu trang và "MT1 · W2 JUL" ở ô chọn → bỏ cột "Lịch" khi mọi hàng cùng tuần; hàng khác tuần (dời riêng kỹ năng) thì hiện | R3 R7 | GIỮ (mỗi kỹ năng có thể dời tuần riêng) |
| TE-5 | Hồ sơ Mock Test · đầu trang | `te-mock-1440.jpg` | "MT1 · W2 JUL ▾ ⓘ" rồi "Lớp lúc Test · **Lịch W2 JUL** · Target · Kỳ vọng MT1" — Lịch hiện hai lần | R3 | ĐÃ SỬA #2132 |
| TE-6 | Hồ sơ Mock Test · cột Nhận xét | `te-mock-1440.jpg` | "Chưa nhận xét" ×4 (chữ xám lặp, dòng đủ chiều rộng) → "—" khi không bắt buộc (luật N8: nhận xét không bắt buộc) | R3 | ĐÃ SỬA #2132 |
| TE-7 | Kế hoạch Test · hàng lớp | — | "MT1 đang làm bài" lặp mọi hàng khi cả khoá cùng bước | R3 | GIỮ (mỗi lớp một trạng thái; trùng do dữ liệu mẫu) |
| TE-8 | Test · tiêu đề + tab + nhóm | `te-lich-1440.jpg` | "Test" · tab "Lịch Test tuần" · nhóm "Test tuần này" | R1 | ĐÃ SỬA #2132 |

## 5. Phân tích (PR 4 — nhỏ; các ô số để #2120)

| # | Ở đâu · vai · cỡ | Ảnh | Trước → Sau | Luật | |
|---|---|---|---|---|---|
| PT-1 | Mọi tab · ô số | — | Mỗi ô "… · trong kỳ" lặp 3–4 lần cùng hàng, trong khi thanh lọc ngay trên đã chọn khoảng tuần | R1 | **#2120** (không đụng) |
| PT-2 | tab Giáo viên · bảng | — | Khung "Giáo viên 7 GV" + cột đầu "Giáo viên" + tab "Giáo viên" | R1 | [XM] như TQ-3 |
| PT-3 | tab SOS · PA nào hiệu quả | — | "PA có kết quả **2** · có cải thiện **2** 100 %" rồi khung "PA do GV thêm **2 PA** · **2 có cải thiện**" ngay dưới | R3 | [XM] số liệu cùng nguồn; thuộc ô số → #2120 |
| PT-4 | Mọi tab · khung bảng | — | Chấm số đếm cạnh tên khung ("7 GV", "5 HV", "2 tuần", "1 lớp"): đếm đúng số dòng đang thấy | R3 | GIỮ (bảng dài vẫn cần số tổng) |

→ Không có chỗ nào ngoài ô số cần sửa an toàn: **không mở PR Phân tích** vòng này; chờ #2120 xong rà lại.

## 6. Tutor · Hồ sơ GV · Quản trị · Hồ sơ cá nhân (PR 5)

| # | Ở đâu · vai · cỡ | Ảnh | Trước → Sau | Luật | |
|---|---|---|---|---|---|
| TG-1 | Hồ sơ GV · tab Lớp · khung "Lớp đang dạy" | `tg-ho-so-gv-1440.jpg` | "Lớp đang dạy **10** ⓘ **lớp · 69 HV**" — ⓘ chen giữa số và đơn vị → "Lớp đang dạy **10 lớp** · 69 HV ⓘ" | R2 | ĐÃ SỬA (PR Tutor/GV/QT) |
| TG-2 | Hồ sơ GV · đầu trang | `tg-ho-so-gv-1440.jpg` | Dòng "GVCN: MB FT 101 · MB Pre FOU 03 · … (8 lớp)" nhắc lại đúng danh sách lớp có nhãn "GVCN" ngay bên dưới → bỏ dòng ở đầu trang, bảng bên dưới đã đủ | R3 | [XM] đầu hồ sơ GVCN = mã lớp là yêu cầu R8.4 |
| TG-3 | Hồ sơ GV · bảng lớp | `tg-ho-so-gv-1440.jpg` | Nhãn "GVCN" lặp ở **8 hàng** cạnh tên lớp, trong khi cột bên phải cũng tên "GVCN" (trống khi chính GV là GVCN) → cột GVCN luôn ghi tên người, bỏ nhãn lặp | R1 R7 | [XM] đổi nghĩa cột; chờ chủ SP |
| TG-4 | Hồ sơ GV · "Em đang bổ trợ" | `tg-ho-so-gv-1440.jpg` | Khung chỉ rộng ~½ ngang, bên phải trống | R7 | [XM] mockup |
| TG-5 | Tutor · khung bảng | `tg-tutor-1440.jpg` | Ô lọc "W4 AUG → W3 SEP" ngay trên, rồi tiêu đề khung "1 người dạy · **W4 AUG – W3 SEP**" | R3 | ĐÃ SỬA (PR Tutor/GV/QT; 375 giữ khoảng ngày) |
| TG-6 | Tutor · cột Người dạy | `tg-tutor-1440.jpg` | Nhãn "Tutor" cạnh tên người dạy trên trang "Tutor" | R1 | [XM] có thể là nhãn phân biệt loại (Tutor / khác) — xác nhận dữ liệu |
| TG-7 | Quản trị · tab Tài khoản | — | Tab "Tài khoản" rồi khung "Tài khoản **33**"; nút "Đang dùng 33 · Đã xoá 0" trùng tab "Đã xoá" | R1 R3 | [XM] công tắc Đang dùng / Đã xoá là thao tác |
| TG-8 | Quản trị · mọi tab | `tg-quan-tri-case-sos-1440.jpg` | Tab "Case & SOS" rồi dòng "Case & SOS" + 2 nút chuyển; ô "Nhật ký — Bản gốc · Đúng danh sách trước khi có màn này" | R1 R4 | GIỮ ("Bản gốc" là mốc khôi phục của nhật ký) |
| TG-9 | Quản trị · Band & ngưỡng | — | "Số câu đúng → band (số đậm = số câu đầu tiên lên band mới). Đang dùng: Bảng gốc" nhắc ba lần ở 3 tầng | R4 | ĐÃ SỬA (PR Tutor/GV/QT; câu giải nghĩa vào ⓘ "Áp dụng") |
| TG-10 | Hồ sơ cá nhân · khung "Đổi mật khẩu" | `tg-ho-so-ca-nhan-1440.jpg` | Tiêu đề khung "Đổi mật khẩu" + nút cùng chữ "Đổi mật khẩu" (xám, chưa nhập) → nút "Lưu" | R1 | ĐÃ SỬA (PR Tutor/GV/QT; nút "Lưu") |
| TG-11 | Hồ sơ cá nhân · chân khung | `tg-ho-so-ca-nhan-1440.jpg` | "Bản demo không gửi email thật nên **không có luồng quên mật khẩu**. Quên thì nhờ Quản trị…" (chữ tĩnh, chỉ có ở demo) → ⓘ cạnh tiêu đề khung | R4 | GIỮ (hướng dẫn bước kế khi quên mật khẩu; CA1-7) |
| TG-12 | Hồ sơ cá nhân · bố cục | `tg-ho-so-ca-nhan-1440.jpg` | Ba khung xếp một cột ~770 px, nửa phải trống ở 1440 | R7 | [XM] trang biểu mẫu, một cột là chuẩn đọc |

## 7. Việc xem sau (không vào PR)

- Quét 375 / 1280 cho CX, BPXL, Head tutor, GV nhiều chi nhánh chưa chụp ảnh (vai ít đặc thù; đã quét 1440 và đo chữ, không thấy lỗi mới ngoài các mục trên).
- "Hướng dẫn": nhiều chữ nhưng là trang tài liệu — không tính.
- Mọi toast / hộp xác nhận chưa duyệt từng cái: cần chạy thao tác thật (xoá, gửi), nên để PR khu tự kiểm khi chạm.

## 8. Quy ước chung đề xuất (để rà sau không sót)

1. Khung (card) không nhắc lại số đã có ở ô số ngay trên.
2. Một cột chung giá trị (mọi ô cùng chữ) thì ẩn cột; có ngoại lệ thì hiện.
3. Đơn vị nói một lần ở đầu dòng ("33 HV"), các số phụ sau đó không lặp "HV".
4. Chú thích tĩnh cạnh ⓘ → chỉ giữ ⓘ.

## 9. Chạm khu của session khác (ghi, không sửa)

- Hàng việc ở Công việc (session dong-viec-cung-truong): cột "Báo cáo PH · mở … ·" chưa có chữ treo; nhãn tab "… 4 quá hạn trong 10 việc" ở thanh phụ.
- Cuối khoá / Chốt lộ trình (session mockup-chot-lo-trinh): chưa mở.
- Ô số Phân tích (#2120): PT-1, PT-3.

## 10. Kết quả thực hiện (25/11)

| Khu | PR | Mục đã sửa | Ghi chú |
|---|---|---|---|
| Tổng quan | #2127 | TQ-1, TQ-2 | |
| Học viên & Lớp | #2129 | HL-4, HL-5, HL-10 | HL-1, HL-3, HL-9 đọc mã rồi GIỮ; HL-2, HL-8 → [XM] |
| Test | #2132 | TE-2, TE-5, TE-6, TE-8 | TE-1 → [XM] (đo: cột Đợt ~640 px, chữ ~120 px) |
| Phân tích | — | — | không mở PR: mọi chỗ lặp nằm trong ô số (#2120) |
| Tutor · Hồ sơ GV · Quản trị · Hồ sơ cá nhân | PR này | TG-1, TG-5, TG-9, TG-10 | TG-2, TG-3, TG-4, TG-6, TG-7, TG-12 → [XM]; TG-8, TG-11 GIỮ |

Bài học khi rà: nhiều chỗ "lặp" đo được là do dữ liệu mẫu (mọi lớp cùng bước) hoặc là đơn vị / hệ quả có chủ đích — luôn đọc mã và luật trước khi bỏ chữ.
