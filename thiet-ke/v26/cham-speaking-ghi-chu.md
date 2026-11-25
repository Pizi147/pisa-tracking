# v26 · Chấm Speaking (chấm chéo S) theo khuôn A — ghi chú

Mockup: `cham-speaking.html` (1440 tối + 375 sáng; nhiều lớp, một lớp, có quá hạn, rỗng, panel mở, hết bài của lớp). Ảnh: `anh/cham-speaking-*.png`.
Nguồn lệch: rà toàn web 25/11 — tab "Chấm Speaking" của GV có MỘT dòng gộp "4 lớp · 20 em · 22 bài · 15 quá hạn", trái khuôn A (mỗi dòng một lớp).
Chỉ mockup, chưa code. Dữ liệu bịa; hôm nay 14/09/2026.

## Phương án
- **A (khuyến nghị)** — mỗi lớp một dòng 4 ô cố định: **lớp · n em · tuần test · n bài · m quá hạn · hạn sớm nhất** (quá hạn lên đầu, hạn = ngày dd/mm/yyyy tô màu chữ, không badge). Bấm dòng → panel 720 **của đúng lớp đó**: ô "GV chấm" + lưới Speaking + "Đã có điểm" gập. Chuyển lớp bằng **Lưu · lớp tiếp ›** (hết bài: **Lớp tiếp: {mã} ›**; hết lớp cuối: **Việc tiếp ›**). "Chi nhánh khác" thành mục gập dưới danh sách, cùng dáng dòng + chip chi nhánh.
- **B** — danh sách như A nhưng bấm dòng mở panel nhiều lớp (như cũ), mở sẵn ngăn lớp vừa bấm. Giữ nguyên panel, nhưng danh sách lớp xuất hiện hai lần (ngoài + trong panel). Không chọn.

## Vì sao A
Một dòng = một việc = một panel, giống mọi tab Công việc (NH10). Panel gọn: mở thẳng vào lưới của lớp, không phải gập / mở ngăn. Số thao tác để chấm một lớp: B bấm dòng + tìm / cuộn tới ngăn + chấm; A bấm dòng + chấm. Không có nhiều danh sách cho cùng một thứ. Chi phí code A: panel đã có prop `lopDau` + ngăn lớp (`NganLop`) → A tách `NganLop` ra làm thân panel.

Bố cục 1440 / 1280 (chủ SP 25/11): danh sách chiếm đúng MỘT NỬA ngay từ đầu; nửa phải = "Lớp của tôi" lúc chưa mở, bấm dòng thì panel vào đúng nửa phải — danh sách KHÔNG co / giãn khi mở / đóng (ảnh A1 ↔ A2, A10 = 1280). Thông tin dài thì xuống dòng, không cắt "…". 375 giữ như cũ. Thông tin dòng chỉ ghi mã tuần, không chữ "Mock" / "MT".

Lưới dòng (≥ 600 px): lớp · n em · thông tin (ăn phần dư, căn trái ngay sau cột em) · hạn (sát mép phải); số em CHỈ ở cột em, số bài / quá hạn CHỈ ở cột thông tin — không ghi hai chỗ. Cột lớp / em dùng chung giữa nhóm chính và "Chi nhánh khác" (subgrid) nên thẳng cột. < 600 px: hai tầng như khuôn A.

## Giữ nguyên (không đổi luật)
- Badge tab = số **bài** cần làm ngay (lời 33); có quá hạn → đỏ. Số đầu trang "n việc · m quá hạn" **không** tính chấm chéo (T18).
- Vạch trái xám ở đầu nhóm (bài chấm chéo, không phải việc riêng của bạn) · đầu nhóm "22 bài · 15 quá hạn" (đếm bài).
- "GV chấm" lưu máy chủ theo lớp × đợt · bài vừa chấm đứng nguyên trong lưới đến khi đóng panel · "Đã có điểm" gập · Vắng = "-" có Hoàn tác · ⓘ quy chế · lưu chờ máy chủ, "Đã lưu n bài" luôn xanh (V12).
- "Chi nhánh khác" chỉ tải khi mở, không vào số việc · QL theo dõi ("Của GV") mở cùng panel, ô sửa được theo quyền người xem.

## Truy vết thao tác (TRƯỚC → SAU)
| Trước | Sau (PA A) |
|---|---|
| Một dòng "4 lớp · 20 em · 22 bài · 15 quá hạn" + hạn | 4 dòng, mỗi lớp: mã · n em · tuần + n bài · hạn sớm nhất của lớp |
| Bấm dòng → panel nhiều lớp (4 ngăn gập, ngăn đầu có bài mở sẵn) | Bấm dòng lớp → panel của đúng lớp đó (đã có `lopDau`) |
| Ngăn lớp: đầu ngăn "mã · n bài · quá hạn / hạn" | Là dòng danh sách; đầu panel ghi mã · tuần · n bài · hạn |
| Đầu panel "22 bài · 15 quá hạn" | Số đó ở đầu nhóm của danh sách (cùng số, cùng hàm đếm) |
| Ô "GV chấm" đầu mỗi ngăn | Một ô ở đầu panel của lớp (cùng lưu lớp × đợt) |
| Lưới Speaking + Kết quả, tuần dưới tên em mọi dòng | Giữ; tuần dưới tên em chỉ ghi khi lớp có nhiều tuần / lượt (vd cùng em hai lượt: W4 AUG, W1 SEP) — lớp một tuần thì tuần ở đầu panel, không lặp |
| "Đã có điểm · n bài" gập trong ngăn | Giữ, cuối lưới |
| Hết bài lớp → "Lớp tiếp: {mã} ›" trong lưới | Giữ: nút chính ở chân panel; thân ghi "Đã xong phần của bạn" |
| Chân panel "Việc tiếp ›" luôn có | Chân: **Lưu · lớp tiếp ›** còn bài; hết lớp cuối → **Việc tiếp ›** |
| Ô "Tìm học viên (tên, email)" đầu panel (lọc em qua MỌI ngăn lớp) | **Giữ**, chuyển lên ĐẦU DANH SÁCH (cùng chỗ, cùng ô, lọc xuyên lớp — hàm `locQ` cũ). Gõ tên → còn các dòng lớp có em khớp, cột "ai" ghi tên em khớp, thông tin ghi số bài + tuần (ảnh A9); bấm dòng → panel của lớp đó. Không mất thao tác. Panel một lớp không cần ô tìm riêng |
| "Chi nhánh khác" gập cuối panel | Mục gập dưới danh sách, dòng cùng dáng + chip chi nhánh (đầu cột thông tin); "n bài · m quá hạn" ở đầu mục CHỈ sau khi mở (máy chủ không tải trước, giữ như cũ) |
| "m quá hạn" của lớp trong đầu ngăn | Giữ ở cột chi tiết của dòng ("8 bài · 6 quá hạn", chữ thường, chỉ khi m > 0); ngày hạn sớm nhất tô màu chữ |
| Rỗng: "Không có bài Speaking chờ chấm" ở panel | Rỗng ở danh sách: "Bạn hết bài Speaking chờ chấm · Còn: … · Việc tiếp ›" ('Bạn' = hàng đợi của bạn; Chi nhánh khác vẫn gập bên dưới) (mẫu hết việc như tab khác) |

## Điểm cần PTA / chủ SP chốt
1. **Thứ tự dòng**: quá hạn lên đầu rồi hạn gần (như mọi tab). Luật hiện hành của panel (`soSanhLopCham`: lớp thường có bài lên đầu, rồi mã lớp nhỏ trước) đổi theo → "Lớp tiếp ›" đi theo thứ tự danh sách. Giữ luật cũ được nếu chủ SP muốn (thay đổi 1 hàm).
2. **Ô "Tìm học viên" chuyển từ panel lên đầu danh sách** (giữ thao tác, lọc xuyên lớp); ô tìm này là ô MỚI trên tab khuôn A — các tab khác chưa có ô tìm trong danh sách.
2b. **Chip chi nhánh** ("Cầu Giấy") chuyển từ ô lớp sang đầu cột thông tin: ô lớp có chip kéo rộng cột lớp của cả danh sách (lệch cột).
3. Cột "Việc" của "Lớp của tôi" không tính bài chấm chéo S (T18) — giữ như hiện nay, nên MB FT 104 ghi 0 dù có bài Speaking chờ chấm.
4. Trạng thái dựng ở A3: lớp chấm hết thì dòng rời danh sách và badge / đầu nhóm giảm theo (cùng hàm đếm); lưới trong panel vẫn đứng yên tới khi đóng (luật cũ chỉ áp cho lưới).
5. Ở 375 không có cột Kết quả: ô Vắng ghi chữ "Vắng", ô nhập dở viền vàng + chữ "Chưa lưu" dưới tên em. Chân panel 375 có cả **Lưu** và **Lưu · lớp tiếp ›** (khác panel 375 v24 chỉ có nút chính — để lưu mà ở lại lớp).
6. Mẫu dữ liệu: MB FT 101 có bài W4 AUG nên hạn sớm nhất 25/08 và đứng đầu danh sách; sau khi chấm hết, "Lớp tiếp" đi theo danh sách = MB FOU 12.

## Tự rà (critique, mục tiêu ≥ 35)
Hai tác tử độc lập (A: thiết kế bằng ảnh, B: detector tĩnh). Detector: 15 mục, đều từ khung v23 / v24 đã duyệt (vạch trái dòng chọn, thang radius / màu khung mockup, phông Inter của chữ số) hoặc phần phụ trợ không lên web — không có mục nào thuộc phần thêm của tệp này.
Vòng 3 **31/40** (0 P0, 2 P1: chip chi nhánh kéo rộng cột lớp ở A4; bỏ ô tìm mà thay thế không đạt) → sửa cả hai (chip vào cột thông tin; giữ ô tìm ở đầu danh sách + ảnh A9) + cột 1440 cân theo lưới khuôn A (PTA 25/11) + câu rỗng + "W4 AUG, W1 SEP" khi lớp có hai tuần. **Chưa chấm lại vòng 4**: P0/P1 còn lại theo tự kiểm = không. (Các dòng dưới là lịch sử vòng 1–2.)
Vòng 1 **26/40** (0 P0, 6 P1) → sửa (ghi "m quá hạn" ở dòng, danh sách đổi theo sau khi chấm hết, chữ trạng thái, 375 bỏ cột KQ, câu rỗng, vùng bấm "Đổi") → vòng 2 **30/40** (0 P0, 2 P1: "chưa lưu" chỉ bằng màu ở 375; thiếu nút Lưu ở 375) → sửa cả hai + vài P2 (dữ liệu hạn, đầu panel A3, chân "Chưa lưu · 1 bài"). **Chưa chấm lại sau vòng sửa cuối** (hết 2 vòng cho phép khi dưới 35; theo cổng chỉ cần không còn P0 / P1 — đã tự kiểm ảnh A2, A3, A7). Điểm là của tác tử chấm, không phải kết luận: PTA nên xem ảnh.

P2 còn lại (không sửa): đầu trang "3 việc · 1 quá hạn" cạnh badge tab 15 (đúng luật T18, hai số quá hạn trên một màn) · ngưỡng "sắp hạn" vàng không ghi trên màn · "5 em" đậm ngang mã lớp ở 375 (như mọi tab khuôn A) · ⓘ ⋯ ✕ ở đầu panel 375 sát nhau (khung chung v24) · B1 không chọn.
