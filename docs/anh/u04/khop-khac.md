# UI-U04 — Học viên & Lớp theo mockup V11 (+ chip bậc Ý thức K7 của U10)

Mockup: `thiet-ke/v11/hoc-vien-lop.html` (chủ SP duyệt 03/11 khuya, vòng 2 #872) · K7 trong `thiet-ke/audit-0311/u10-y-thuc.html`.
Bảng ý: `docs/superpowers/specs/2026-11-03-audit-overhaul/14-ra-ux-b.md` 10.1 · 10.1b · 11.1 · 11.1b. Ảnh cặp (DB demo cục bộ, ngày demo 14/09), thư mục này:
`a0-mac-dinh-1440-toi.png` · `a-mo-lop-1440-toi.png` · `a-mo-lop-375-sang.png` · `a1-1280-toi.png` · `d-gv-1440-toi.png` · `e-tvv-1440-toi.png`.
Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` trước khi chụp.

## Truy vết khung → thành phần → ảnh
| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| A0 mặc định gập | `StudentsPage` đầu trang · `HangLop` + `DauLop` (lưới ô) | a0 | KHỚP |
| A0 lọc bật — lớp gập, "3/7 HV khớp", dòng "Đang lọc … · Bỏ lọc" | `DauLop` (`dangLoc`) · dòng `role=status` | — (bấm thử) | KHỚP |
| A đã mở 2 lớp: bảng em, dải dưới hàng, hộp L "30 câu" | `BangHvGon` · `DaiEm` · `OKn` + `HopNho` | a-mo-lop-1440 | KHỚP |
| A hộp tiêu chí W1 / W2 / S ("TA 6.5 · CC 6.5 · LR 6.5 · GRA 6 → 6.5") | chờ `dongTieuChi` của #880 (U03) | — | CHƯA — PTA 03/11: dùng chung một hàm, làm sau khi #880 merge |
| A 375: Xem + FT/LT một hàng, tìm + Lọc, thẻ em ≤ 4 dòng | `TheHvGon` · `TheEm` | a-mo-lop-375 | KHỚP |
| A1 1280 | cột cân lại (không cuộn ngang — chủ SP 03/11 khuya, thay "cuộn ngang, ghim tên" của khung) | a1-1280 | KHÁC có lý do (chủ SP) |
| B ô "Xem" mở | `<select>` gốc trong khung `.o-xem` (optgroup Chi nhánh / Khác) | — | KHÁC (PTA 03/11 đồng ý): **không số HV mỗi mục** — phải đọc thêm theo chi nhánh (Turso) và G4 / N32 ④ không đặt số ở điều hướng; danh sách mở là của trình duyệt |
| C tìm tên → lớp tự mở, tô hồng | `ToKhop` · `hang-khop` | — (bấm thử) | KHỚP |
| D GV | cột "Việc của tôi" chỉ `mine` | d-gv | KHỚP |
| E TVV | "HV của tôi" ở ô Xem, "n/7 HV của tôi", bỏ chip "Cần chú ý" | e-tvv | KHỚP |
| F rỗng / đang tải / lỗi / mất quyền | `Empty` (đúng từ khoá) + "Tìm ở Mọi chi nhánh" (vai có mục đó) · "Tìm ở Lớp thường" (đang lọc một chương trình) · "Bỏ tìm" — chỉ đổi bộ lọc URL · `dang-tai-lai` · `ErrorState` sẵn có | — | KHỚP (XM-1, PTA 03/11) |
| K7 chip bậc → hộp nhỏ | `OYThuc` + `HopNho` (portal, fixed) | — (bấm thử) | KHỚP |
| BỎ: dòng mờ em Kết thúc học | máy chủ bỏ khối OV-11g | — | BỎ (U04-3) |
| BỎ: dòng 5 môn trên hàng em · "Xem thêm n" | `MiniKn` không dùng ở màn này | — | BỎ (ý 2, 3) |
| BỎ: phân trang trên bảng | chỉ dưới | a0 | BỎ |

## Tỉ lệ khớp (cổng chủ SP 04/11: > 96 % KHỚP về hình)
12 khung (trừ 3 dòng BỎ): **9 KHỚP** · 3 không phải lệch hình — A1 1280 (chủ SP 03/11 khuya: cột cân, không cuộn ngang — bố cục), B ô Xem không số mỗi mục (Turso + G4, PTA đồng ý), hộp W/S (chờ `dongTieuChi` #880).
Về **hình** (màu, nền, viền, đậm, cỡ chữ, khoảng cách) trong 12 khung: **12 / 12 KHỚP = 100 %** sau hai vòng so phóng to 2× — không dòng KHÁC nào vì hình.

## So sát hình ảnh 04/11 (chủ SP không duyệt #880/#882 vì lệch mockup — PTA áp cho #884)
Đo `getComputedStyle` mockup khung A ↔ web cùng phần tử, rồi sửa cho bằng:
| Phần | Trước | Sau (= mockup) |
|---|---|---|
| Xuất Excel · + Thêm học viên · ⋯ trang | cao 28, chữ 13 | cao 36, chữ 14 đậm 600, bo 8 |
| Tab Tất cả · Đang SOS… | 14 px, 600 | 15 px, chọn 700, cao 42 (`HangTab v8`) |
| Ô tìm | 15 px, nền ô nhập, không kính lúp | kính lúp, nền `--bg`, chữ 14 |
| Chip lọc | "· 1", chữ dim 600, nền bề mặt | số đậm màu nhấn ngay sau chữ, chữ 500, viền `--line-strong`, không nền |
| Ô "Xem" | rộng theo mục dài nhất (190) | rộng theo mục đang chọn (`field-sizing: content`) |
| Hàng lớp: lưới cột | 16 · 112 · 128 · 230 · 340 | 28 · 112 · 100 · 250 · 290 (đúng `.tt-lop.luoi`) · 1280 giữ cột cân |
| Hàng lớp: viên "n bài chờ chấm"… | chỉ chấm + chữ (nền trùng nền hàng) | viên có viền cùng tông, nền xám nhạt (`.bdv`) |
| Số SOS hàng lớp | 13 px | 15 px đậm, sát chip |
| ⋯ hàng lớp / hàng em | ô 28 có viền | 32, không viền, rê mới viền (375: 44) |
| Tiêu đề bảng em | nền bề mặt 2, cao 39 | nền bề mặt, cao 36, vạch trên |
| Ô bảng em | đệm 6/12 | đệm 9/12, dòng 1.35, canh trên |
| Cột bảng em ở 1440 | 190 · 96 · 200 · 172 · 100 · 150 | 208 · 100 · 300 · 186 · 100 · 172 (đúng COT mockup); < 1440 giữ cột 1280 |
| Hàng em đang mở dải | vạch trái + nền nhấn | như hàng thường (mockup không tô) |
| Chip bậc Ý thức | nền xanh "đang" | viền `--line-strong`, chữ thường, bo 6, cao 24; mở = viền nhấn + nền nhấn nhạt (K7 `.chip-bac`) |
| Dải 375: 5 ô kỹ năng | S rớt dòng | 5 ô một hàng chia đều |
| ✓ / ✗ cạnh điểm | — | chỉ qua `ODiem` (#882 sửa gốc), #884 không vẽ riêng |
| Chip lọc số 0 (vòng 2, chủ SP 04/11) | viền đứt | viền liền như chip khác, chữ + số mờ (`.chip.tat`); nhãn chip "Đã thi · chờ KQ" |
| Đoạn Fast Track / Lớp thường | hai mục cùng đậm khi xem cả hai | mục chọn nền + vạch + đậm; mục không chọn chữ 500 mờ |
| Số "n HV" sau chip SOS | vệt bóng + góc bo dưới số | gạch chân mảnh 1 px dưới chữ số |
| Hàng lớp 375 | mã gạch chân (dính rê chuột khi chụp), GVCN tên đầy đủ | dòng 1 "mã · n HV · T. N. Hà … ⋯", dòng 2 chip SOS + việc, thẳng mép mã; ảnh rời chuột trước khi chụp |
| ⋯ trang 375 | cạnh tiêu đề | cạnh "Lọc" ở hàng tìm (tab Tất cả); tab khác giữ cạnh tiêu đề |
| Số trên tab | viên xanh "đang" | viên mờ nền bề mặt 2, chữ dim 12 (`HangTab soMo`, chỉ trang này) |
| Ô "Xem" | mũi tên gốc của select | "▾" nhỏ mờ như `.oxem::after` |
| Dòng đếm | "194 HV · 23 lớp  Mở tất cả" | "194 HV · 23 lớp · Mở tất cả" |
| Chip lịch thi trong bảng | dự kiến chữ xanh lịch 600, chưa có lịch viền liền | dự kiến viền đậm chữ dim 500 · chưa có lịch viền ĐỨT (`.lich.dk / .chua`) |
| Dải một em | hộp số câu đè hàng dưới | chừa 40 px dưới khi hộp mở (`.dai.co-hop`); ô kỹ năng giữ viền `--line` (đo mockup `.okn`) |

[XM] Mặc định chương trình — PTA chốt 04/11: làm như mockup (hai trạng thái, mặc định Fast Track). Xem bảng Thao tác.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| + Thêm học viên · + Lớp mới · Lưu trữ | đầu trang / ⋯ | như cũ; 375 Xuất + Thêm vào ⋯ trang | GIỮ · B26 |
| Xuất Excel · n HV | đầu trang | như cũ | GIỮ |
| Ô Phạm vi + ô Chi nhánh | hai ô | một ô "Xem" | G1 |
| Fast Track / Lớp thường | hai nút bật / tắt, mặc định xem CẢ HAI (cả hai sáng; bấm một = tắt nó) | HAI trạng thái, luôn một mục chọn (như mockup): mặc định Fast Track (phạm vi chỉ có một loại lớp → loại đó, đoạn chọn ẩn như cũ); bấm mục kia = đổi; lần chọn nhớ trong phiên; URL `khung` thắng, link cũ "cả hai" → mặc định; số trên mục không chọn từ dữ liệu đã nạp | ĐỔI — [XM] PTA chốt 04/11 (bỏ "cả hai": khó hiểu). Chip lọc, số tab, Xuất Excel đếm theo chương trình đang chọn |
| Tab Tất cả · Đang SOS · Lịch thi · Phân công GV | | như cũ | GIỮ |
| Chip Thi tháng này · Có việc quá hạn · Đã thi · chờ KQ · Bộ lọc thêm · chip vai | | như cũ; số 0 mờ không bấm; TVV bỏ "Cần chú ý"; "Có việc quá hạn" = việc **của tôi** | B11 · chủ SP · [XM] b PTA |
| Mở / gập một lớp | ▸ / cả hàng | như cũ | GIỮ |
| Mở / Thu gọn tất cả | — | một nút đổi chữ cạnh bộ đếm | THÊM (ý 4) |
| Bấm số SOS của hàng lớp | — (chỉ hình) | sang Đang SOS của lớp đúng mức | THÊM (ô số = mở) |
| Chip hàng lớp (chờ duyệt, bài chờ chấm…) · ⋯ lớp · mã lớp | | như cũ | GIỮ |
| ⋯ hàng em (N26) | | như cũ; thêm "Xác nhận xử lý" khi em đang cần xử lý Ý thức (cờ trước nay không truyền ở màn này) | GIỮ + sửa |
| Bấm tên việc → làm tại chỗ | | như cũ (cả trong dải) | GIỮ |
| "+n việc" | mở panel một em | mở dải dưới hàng | ĐỔI (chủ SP: không panel trượt) |
| Dòng 5 môn | luôn hiện dưới Overall | bấm ô Overall → dải | ĐỔI (ý 2) |
| Bấm ô kỹ năng | — | L, R: hộp nhỏ "29/40 câu"; W1, W2, S: sau #880 (`dongTieuChi`) | THÊM (U04-1) |
| Bấm chip bậc Ý thức | — | hộp nhỏ K7 (Hồ sơ › · Xác nhận xử lý) | THÊM (K7) |
| Xem em Kết thúc học | dòng mờ cuối lớp | không trong danh sách; hồ sơ lớp tab Học viên · Lưu trữ · Ctrl K | BỎ (U04-3) |
| Xem việc người khác ở cột Việc (QL / Admin) | có, gộp theo môn | bỏ — chỉ việc của tôi | U04-5 |
| Phân trang | trên + dưới | chỉ dưới | B-04 |

## Turso — mở trang đọc bao nhiêu
`GET /hoc-vien-lop`: **−1 câu** (bỏ khối em Kết thúc học) **+1 câu** (Báo PH của em có bậc, `viec_bao_ph` theo `student_id IN json_each`, chỉ em có chip bậc) = không đổi số câu; dòng thêm ≤ số em có bậc. Điểm thành phần lấy từ `diemCuaLuot` đã đọc (`SELECT s.*`) — 0 câu.
Chương trình (FT / LT, [XM] 04/11): **không đổi số câu / dòng** — `/hoc-vien-lop` vẫn đọc mọi lớp trong phạm vi một lần (cần cho số trên mục không chọn và chip đếm), lọc chương trình ở web từ dữ liệu đã nạp; đổi mục không gửi request. Lọc ở máy chủ sẽ phải gửi lại mỗi lần đổi mục và đọc thêm câu đếm — nặng hơn.
`/my-work`: QL / Admin trước gọi `?nguoi=tat-ca` (việc cả chi nhánh), nay `/my-work` (việc của mình) → **ít dòng hơn**.

## Ảnh hưởng ngoài màn (XM-4, PTA 03/11 duyệt)
`chipHocVien` (`server/src/worklist/hvCuaToi.ts`, dùng chung Tổng quan TVV / CX + danh sách theo vai): `tong` / `tatCa` bỏ em `finished` → **ô Tổng quan TVV / CX "n HV" giảm đúng số em Kết thúc học chưa lưu trữ** (luật chủ SP "em Kết thúc học biến mất khỏi danh sách"). Chip `da-thi` / `cho-buoc-tiep` giữ em đó (việc sau thi). Danh sách theo vai đọc ít dòng hơn. Không thêm câu. Phép kiểm OV11g-2: CX `tong` = số dòng danh sách theo vai.

## Để sau
- Hộp tiêu chí W1 / W2 / S: dùng `dongTieuChi` (#880) — commit tiếp sau khi #880 merge, chụp lại ảnh có hộp.
