# v28 · Việc liên phòng ban TVV / BPXL — ghi chú

Mockup: `viec-lien-phong-ban.html` (mục lục L1–L7, nút Gốc / Tối / Sáng). Ảnh: `anh/*.png` (31 khung: 1440 tối · 1280 tối (L3f, L2e) · 375 sáng; ảnh cả màn danh sách + panel).
Đặc tả: `docs/superpowers/specs/2026-11-26-viec-lien-phong-ban/thiet-ke.md` (chủ SP duyệt 26/11, #2235) — luật đề xuất **N73** ①–⑥.
Nền: v27 nguyên vẹn — `../v23/v23.css`, `../v27/v24-chep.css`, `../v27/v27.css`; `chung-v27.js` **chép nguyên** cách vẽ của v27 (khuôn A, panel 720, khối việc ô bấm, Việc con, khối Tuyến, chuỗi chấm, bảng em). `v28.css` chỉ thêm 7 thành phần dưới đây. Không màu / cỡ chữ mới.
Dữ liệu bịa: thứ Tư 16/09/2026 (W2 SEP) — Head Nguyễn Khánh Vy · TVV Phan Mai · BPXL Lương Thu Trang, Hoàng Minh Đức · GVCN Trần Ngọc Hà. Lệnh ra thứ Tư → hạn CN 20/09/2026; em vào lớp mới W3 SEP (21/09).

## 0. Chủ SP duyệt 26/11 — kèm điều kiện

> "tạm được nhưng nhớ là chỉ giao việc cho một người thôi nhé, không cần mockup nữa, duyệt"

- **Mỗi việc chỉ MỘT người phụ trách.** Việc BPXL "Nhận thông tin" giao một CVXL được gán chi nhánh (nhiều CVXL → người ít việc mở nhất; không có → Head; lead chỉ theo dõi) — đặc tả 4.2, 4.4. Mockup đã đổi chữ cho khớp: ô Phụ trách ghi **"Lương Thu Trang · bạn"** (bản trước ghi "BPXL Mỹ Đình · 2 người"), bước Nhận thông tin trong Tuyến ghi tên một người.
- **Phụ trách chính của tuyến** (Chuyển lớp: GVCN lớp cũ · Đổi GV: GVCN lớp · không GVCN → Head) — đặc tả 4.7. **Chưa vẽ** (chủ SP: không cần mockup nữa): người làm web ghi "Phụ trách chính {tên}" ở đầu khối Tuyến, cạnh "Xong a/b", theo kiểu chữ nhãn sẵn có.
- Sau lần đổi chữ này **không chấm critique lại**.

## 1. Thành phần mới (v28.css)

| Thành phần | Dùng ở | Vẽ thế nào |
|---|---|---|
| Bảng **Nhận thông tin** `.bnt` | L3, L4, L5 | 4 cột cân hết bề ngang (Học viên · Lớp mới · Lịch Mock đã xếp · Tuyến; cột cuối căn mép phải); Đổi GV 3 cột. 375: tên + chuỗi chấm dòng 1, "→ lớp mới · từ tuần" dòng 2, lịch dòng 3 |
| Khối **"Sau khi lưu · việc tự giao"** `.se-giao` | L1 | 3 hàng: việc · người nhận · hạn. Chọn "Ngay hôm nay" → một câu "không giao việc Báo PH (TVV) và Nhận thông tin (BPXL)". Là lưu ý hậu quả (giữ), không phải chú thích |
| **Hộp chọn người** `.hcn` | L5a, L6c | mở dưới ô Phụ trách (C7 v27): ô tìm · nhóm vai mặc định trước · người khác ở chi nhánh · "Về mặc định". Người không hợp lệ (CX với Chốt lộ trình) xám, ghi lý do tại dòng |
| Hộp **Lưu phân công** `.hop` + cặp `.cap` | L1c, L1d | hộp sẵn có của web; chỉ đổi chữ ô tích thành "Tạo việc bàn giao · báo BPXL" + dòng phụ nói hai việc và hạn |
| **Tin chuông** `.tin-chuong` | L5c | tin "Cần làm": "{người} chuyển việc cho bạn: …" + hạn |
| Nhãn **"{tên} giao"** trên dòng `.giao-boi` | L5c, L5e | như nhãn N58 |
| **Dòng việc mở tại chỗ** `.khay-v` | L6c, L6d | việc quản lý của Head làm ở trang riêng → khối việc + Việc con mở dưới dòng; nút "Mở Cuối khoá ›" đổi trang |

## 2. Bảng ý → khung (đặc tả mục 2, 4)

| Ý | Khung |
|---|---|
| Q1 · mọi lệnh chuyển lớp sinh việc ngay lúc ra lệnh | L1a (khối Sau khi lưu) · L2a · L3a |
| Q1 · "Ngay hôm nay" không sinh việc | L1b |
| Q1 · TVV một dòng lớp × lô "n em", mở tại chỗ | L2a, L2c |
| Q1 · gộp với Kết quả Final, báo PH một lần | L2b (hai khối máy điền, tuyến "một lần · 2 nội dung", hạn 21/09 = hạn muộn hơn) · L2c (dòng em "Kết quả Final · Chuyển lớp") |
| Q1 · BPXL một việc cả lô, một nút Xác nhận | L3a, L3b (chân "Xác nhận đã nhận", không ô bắt buộc) |
| Q2 · hạn Chủ nhật | mọi khung: lệnh T4 16/09 → hạn 20/09/2026; bảng 7 thứ ở đầu trang mockup. ⓘ ô Hạn giải thích trên web |
| Q3 · ai đổi người / hạn; người theo dõi chỉ xem | L5a (người giữ đổi) · L5e (người nhận chuyển tiếp được) · L5d (**người đã giao** mở từ Đang theo dõi: ô vẫn bấm được, có "Về mặc định") · L7c (Head mở một bước của tuyến: ô Phụ trách · Hạn bấm được) · L5f (người theo dõi thuần: ô chữ trơn, không viền, không ▾, không Việc con) |
| Q4 · khung chung cho việc TVV, Bàn giao, việc Head | L6a · L6b · L6c / L6d |
| 4.1 · nội dung máy điền, form Báo PH như cũ | L2a (lớp cũ → mới · tuần · GVCN mới · hướng · lý do) |
| 4.1 · em không TVV → Head | L2d |
| 4.1 · lệnh huỷ sau khi đã báo → Báo lại PH | L2a / L2c (dòng "Báo lại · Huỷ chuyển lớp") · L7a (d) |
| 4.2 · một CVXL được gán chi nhánh giữ việc | L3a (Phụ trách "Lương Thu Trang · bạn" · mặc định) |
| 4.2 · bảng em nói điều máy làm với lịch | L3a (đi theo em · ở lại lớp cũ (chờ điểm S)) |
| 4.2 · xong có Hoàn tác; lỗi lưu; rỗng | L3c · L3d · L3e |
| 4.2 · lệnh đổi sau khi BPXL đã xác nhận → chỉ tin "Cập nhật" | L5c (chuông, mục Để biết) · L7a (d) |
| Cân cột ở 1280 | L3f · L2e |
| 4.3 · Đổi GV: một việc mỗi lần lưu × lớp; lịch đổi huỷ → tự đóng | L4a · L4b |
| 4.3 · ô tích một, chữ "Tạo việc bàn giao · báo BPXL" | L1c, L1d (2 cặp tích, 1 cặp bỏ tích) |
| 4.4 · việc rời danh sách, người cũ vào Đang theo dõi, Hoàn tác | L5b |
| 4.4 · người mới có chuông + dòng "{tên} giao" | L5c, L5e |
| 4.4 · mỗi việc một người; "Về mặc định" | L5a (hộp chọn) · L5e · L5d ("Về mặc định · BPXL chi nhánh") |
| 4.4 · Chốt lộ trình chỉ giao người có quyền chốt | L6c (hộp chọn chỉ liệt kê người có quyền chốt; không có CX) |
| 4.5 · Việc con mọi việc có khung | L3a, L4a (có việc con), L6a, L6c |
| 4.7 · Tuyến: ba việc cùng lúc, "Vào lớp mới · máy tự chuyển" không chờ | L7a, L3a, L2a |
| 4.7 · BPXL không đọc nội dung Báo PH / bàn giao | L7a (b), L3a (không ˅) |
| 4.7 · Đang theo dõi một dòng mỗi lô | L7c, L7d |

## 3. Điều mockup tự chọn (người làm web theo, chủ SP sửa được)

- Tên panel BPXL là **"Nhận thông tin"**, loại việc (Chuyển lớp / Đổi GV) nằm ở dòng meta — để tiêu đề không xuống dòng ở 375. Tab mới của BPXL cùng tên.
- Việc gộp: tiêu đề "Báo PH", meta "Kết quả Final · Chuyển lớp".
- Việc quản lý của Head (Chốt lộ trình, Xét lại, Xếp lịch MT còn thiếu) **mở tại dòng** để có khối việc; làm việc vẫn ở trang cũ qua nút "›" (luật: ô mở tại chỗ, "›" đổi trang).
- Bảng Nhận thông tin cột "Lịch Mock đã xếp" chỉ hiện với lớp FT; lớp thường (BE → ELE) thay bằng "Lịch đã xếp" (Progress / Final) hoặc ẩn cột nếu không có lượt chờ.
- L7c: hàng tab của Head dài hơn bề ngang khi panel mở → cuộn ngang như web hiện nay (không đổi).
- Số ở tab = số DÒNG (một lô "n em" là một dòng), như v27.
- **Không vẽ khung riêng** (dùng lại thứ sẵn có — người làm web theo đặc tả): phía ra lệnh Cuối khoá cả lớp / Xét lại / duyệt đề xuất GVCN (thêm đúng khối "Sau khi lưu" của L1a) · ca hạn T6 / T7 / CN (bảng đầu trang) · sửa hạn (ô hạn + lịch `HanBam` của nền) · Bỏ việc / Khôi phục / Lưu trữ / ⋯ "Mở lại" (thao tác sẵn có) · không BPXL → Head · lô sang chi nhánh khác · lịch "huỷ" (FT → lớp thường) · Đổi GV hiệu lực "Ngay hôm nay" (vẫn sinh việc BPXL, bảng ghi "Hôm nay") · "Báo lại PH · Chuyển lớp" khi sửa lớp / tuần (cùng khuôn dòng "Báo lại · Huỷ chuyển lớp").
- **Người nhận việc BPXL** (chủ SP 26/11 qua PTA Plan): BPXL được gán đúng chi nhánh; ô Phụ trách ghi "BPXL {chi nhánh} · n người". BPXL "Toàn hệ thống" (lead) theo thiết kế vai của session `vai-moi`.

## 4. Rà

- Máy dò khi chụp (28 khung): phần tử tràn mép khung = 0 · chữ `undefined` = 0 · nút ✕ lệch tâm 0 px.
- Critique `impeccable` + rà tay: xem mục 5.

## 5. Critique — `impeccable critique`, ba vòng 26/11 (mỗi vòng một reviewer độc lập, đọc ảnh; vòng 1 thêm một reviewer đo máy)

| Vòng | Điểm | P0 | P1 | Đã làm |
|---|---|---|---|---|
| 1 (28 khung, 23 ảnh đọc) | 30/40 | 0 | 1 | sửa P1 + mọi P2 |
| 2 (30 khung, đọc đủ + đối chiếu đặc tả → khung) | 29/40 | 0 | 2 | sửa cả 2 P1 + P2 |
| 3 (31 khung, đọc đủ) | **31/40** | 0 | 1 | sửa P1 + P2; **không chấm vòng 4** (cổng: sau khi chạm 30 tối đa 2 vòng nữa, rồi chỉ cần không P0 / P1) |

Chưa tới mục tiêu 35; dừng theo cổng ở "không còn P0 / P1 đã biết". Ba điểm do ba reviewer khác nhau chấm nên không so trực tiếp được.

| Vòng · mức | Vấn đề (khung) | Xử lý |
|---|---|---|
| 1 · P1 | Người theo dõi vẫn thấy "+ Việc con" | sửa — chỉ xem thì không có Việc con (L5f) |
| 1 · P2 | Việc đã đóng còn ô Hạn bấm được (L4b) · toast giữa thân (L3c) · tab Đang theo dõi lúc có số lúc không · "Ngay hôm nay" không nói Bàn giao (L1b) · tab đang chọn bị cắt · xuống dòng "hạn / ngày" · hai nút khi lỗi lưu (L3d) · thiếu ˅ (L3a) · "Nội dung *" trái đặc tả · Bàn giao ghi 3 em mà nội dung một em (L6b) | sửa hết |
| 2 · P1 | **L5d vẽ người ĐÃ GIAO thành "chỉ xem"** — trái Q3 | sửa — L5d: người đã giao vẫn đổi được; thêm L5f người theo dõi thuần |
| 2 · P1 | "Về mặc định" không có trong ảnh nào | sửa — L5d |
| 2 · P2 | Số việc TVV lệch nhau · L7c bảng thừa phải · chấm treo "·" (L1d, L4b) · lỗi lưu không nói bước kế · "12 em" mở ra 4 dòng · CX không hợp lệ vẫn liệt kê (trái đặc tả 4.4) · thiếu tin "Cập nhật" BPXL | sửa hết (L7c thêm cột Hạn; hộp chọn chỉ người hợp lệ; chuông có tin lệnh đổi) |
| 3 · P1 | Khay việc quản lý của Head thiếu Lịch sử (L6c, L6d) | sửa |
| 3 · P2 | Số đầu trang BPXL lệch tổng tab · bảng Đổi GV hai hiệu lực trong khi một lần lưu một hiệu lực (L4a) · Head bị vẽ "chỉ xem" ở L7c | sửa — số = tổng tab; một hiệu lực; L7c Head mở bước Báo PH thấy ô bấm |
| 3 · P3 | chấm sai màu sau Xác nhận (L3c) · thứ tự thời gian tuyến huỷ lệnh (L7a d) | sửa |
| còn lại · P3 | nhãn "{tên} giao" làm cột danh sách co lại (L5c, L5e) · tin chuông ngắt dòng giữa cụm · hộp chọn chưa đánh dấu người đang giữ · chip Theo dõi không ghi "bạn" · việc Báo PH của Head nằm ở tab Ý thức & Phối hợp (theo v27 T11d) | **để lại** cho người làm web cân khi dựng |
| đo máy (vòng 1) | tương phản lớp mới ≥ 5.47:1 · ✕ lệch 0 px · bảng / hộp có `role` + nhãn · tràn mép 0 | đạt |
| đo máy | vùng bấm < 44 px ở 375: phần lớn của nền v27; mới của v28 là link tên em / lớp trong bảng `.bnt` (16–18 px) | **để người làm web**: dòng bảng 375 vùng bấm ≥ 44 px, ô tìm trong hộp chọn là `input` thật, hộp có `aria-modal` |
| detector | 16 phát hiện, đều ở vỏ đọc mockup / nền v23–v27 | không sửa |

Soi cân cột / ✕ / ⋯ (vòng 2 + 3, 1440 · 1280 · 375): bảng Nhận thông tin 4 cột và 3 cột căn hết bề ngang, cột cuối sát mép phải ở 1440 và 1280; ⓘ ⋯ ✕ đầu panel thẳng hàng mọi khung; không chữ bị cắt ngoài hàng tab cuộn ngang của nền.

`ui-ux-pro-max`: **chưa chạy riêng**.
