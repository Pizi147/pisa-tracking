# v28 · Việc liên phòng ban TVV / BPXL — ghi chú

Mockup: `viec-lien-phong-ban.html` (mục lục L1–L7, nút Gốc / Tối / Sáng). Ảnh: `anh/*.png` (28 khung, 1440 tối + 375 sáng, ảnh cả màn danh sách + panel).
Đặc tả: `docs/superpowers/specs/2026-11-26-viec-lien-phong-ban/thiet-ke.md` (chủ SP duyệt 26/11, #2235) — luật đề xuất **N73** ①–⑥.
Nền: v27 nguyên vẹn — `../v23/v23.css`, `../v27/v24-chep.css`, `../v27/v27.css`; `chung-v27.js` **chép nguyên** cách vẽ của v27 (khuôn A, panel 720, khối việc ô bấm, Việc con, khối Tuyến, chuỗi chấm, bảng em). `v28.css` chỉ thêm 7 thành phần dưới đây. Không màu / cỡ chữ mới.
Dữ liệu bịa: thứ Tư 16/09/2026 (W2 SEP) — Head Nguyễn Khánh Vy · TVV Phan Mai · BPXL Lương Thu Trang, Hoàng Minh Đức · GVCN Trần Ngọc Hà. Lệnh ra thứ Tư → hạn CN 20/09/2026; em vào lớp mới W3 SEP (21/09).

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
| Q3 · ai đổi người / hạn; người theo dõi chỉ xem | L5a (người giữ đổi) · L5e (người nhận chuyển tiếp được) · L5d (người theo dõi: ô chữ trơn, không viền, không ▾) |
| Q4 · khung chung cho việc TVV, Bàn giao, việc Head | L6a · L6b · L6c / L6d |
| 4.1 · nội dung máy điền, form Báo PH như cũ | L2a (lớp cũ → mới · tuần · GVCN mới · hướng · lý do) |
| 4.1 · em không TVV → Head | L2d |
| 4.1 · lệnh huỷ sau khi đã báo → Báo lại PH | L2a / L2c (dòng "Báo lại · Huỷ chuyển lớp") · L7a (d) |
| 4.2 · mọi BPXL chi nhánh, ai bấm trước thì xong | L3a (Phụ trách "BPXL Mỹ Đình · 2 người" · mặc định) |
| 4.2 · bảng em nói điều máy làm với lịch | L3a (đi theo em · ở lại lớp cũ (chờ điểm S)) |
| 4.2 · xong có Hoàn tác; lỗi lưu; rỗng | L3c · L3d · L3e |
| 4.3 · Đổi GV: một việc mỗi lần lưu × lớp; lịch đổi huỷ → tự đóng | L4a · L4b |
| 4.3 · ô tích một, chữ "Tạo việc bàn giao · báo BPXL" | L1c, L1d (2 cặp tích, 1 cặp bỏ tích) |
| 4.4 · việc rời danh sách, người cũ vào Đang theo dõi, Hoàn tác | L5b |
| 4.4 · người mới có chuông + dòng "{tên} giao" | L5c, L5e |
| 4.4 · việc cả nhóm chuyển cho một người thuộc hẳn người đó; "Về mặc định" | L5a (hộp chọn) · L5e |
| 4.4 · Chốt lộ trình chỉ giao người có quyền chốt | L6c (CX "không chốt được" xám) |
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

## 4. Rà

- Máy dò khi chụp (28 khung): phần tử tràn mép khung = 0 · chữ `undefined` = 0 · nút ✕ lệch tâm 0 px.
- Critique `impeccable` + rà tay: xem mục 5.

## 5. Critique

`impeccable critique` 26/11, hai reviewer tách riêng (A soi thiết kế trên 23 ảnh · B đo máy 28 khung). **Lần 1: 30/40, không P0, 1 P1.** Đã sửa một lượt rồi chụp lại; **chưa chấm lại lần 2** (điểm sau sửa chưa đo).

| Mức | Vấn đề (khung) | Xử lý |
|---|---|---|
| P1 | Người theo dõi vẫn thấy "+ Việc con" (L5d) | đã sửa — chỉ xem thì không có Việc con |
| P2 | Việc đã đóng còn ô Hạn bấm được + nút "+" theo dõi (L4b) | đã sửa — chữ trơn |
| P2 | Toast nằm giữa thân panel (L3c) | đã sửa — cuối thân; L5b ở đáy trang vì không có panel |
| P2 | Tab Đang theo dõi lúc có số lúc không (L3c / L5b) | đã sửa — không số (N72: Đang theo dõi không đếm) |
| P2 | "Ngay hôm nay" không nói Bàn giao còn hay không (L1b) | đã sửa — giữ dòng Bàn giao + câu "không giao Báo PH (TVV), Nhận thông tin (BPXL)" |
| P2 | Tab đang chọn bị cắt / ngoài màn (L7c, L6d, L7d) | đã sửa — cuộn tab đang chọn vào tầm nhìn (web: `scrollIntoView` khi đổi tab) |
| P2 | Xuống dòng xấu: "hạn / 25/09/2026" (L1d) · "W3 SEP · / 21/09/2026" (L7a, L6b) | đã sửa — cụm "hạn + ngày" một dòng; bước "Vào lớp mới" chỉ ghi mã tuần |
| P2 | Hai nút cùng việc khi lỗi lưu (L3d) | đã sửa — còn một nút "Xác nhận đã nhận" bấm lại |
| P2 | Dòng em thiếu ˅ (L3a) · "Nội dung *" trái đặc tả tuỳ chọn (L2a, L2b) · Bàn giao đầu panel ghi 3 em mà nội dung một em (L6b) | đã sửa cả ba |
| P3 | "Về mặc định" hiện khi đang là mặc định (L5a, L6c) · khoảng trống dưới hộp chọn (L6c) · tên Tuyến bị cắt (L6b) · chữ toast "MB FT 101 → {người}" | đã sửa. "Về mặc định · {nhóm}" chỉ hiện khi việc đang giao tay (như N58) |
| P3 | Cột Tuyến chỉ có chấm (L3a) · nhãn "giao" đẩy cột danh sách (L5e) · hộp chọn chưa đánh dấu người hiện tại | **để lại** — chấm có `aria-label` + mở ra thấy tuyến; người làm web cân khi dựng |
| đo máy | tương phản lớp mới ≥ 5.47:1 (0 chỗ < 4.5) · ✕ lệch 0 px · bảng / hộp có `role` + nhãn | đạt |
| đo máy | vùng bấm < 44 px ở 375: phần lớn là nền v27 (`.nut-i`, `.them`, nút đoạn 40 px); mới của v28: link tên em / lớp trong bảng `.bnt` cao 16–18 px | **để người làm web**: dòng bảng 375 cho vùng bấm ≥ 44 px (cả dòng mở Tuyến), ô tìm trong hộp chọn là `input` thật, hộp có `aria-modal` |
| detector | 16 phát hiện, đều ở vỏ đọc mockup / nền v23–v27 (dải trái dòng đang chọn, phông đã khoá) | không sửa |

`ui-ux-pro-max`: **chưa chạy riêng** (reviewer A đã chấm 10 heuristic + tải nhận thức).
