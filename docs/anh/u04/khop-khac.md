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
| B ô "Xem" mở | `<select>` gốc trong khung `.o-xem` (optgroup Chi nhánh / Khác) | — | KHÁC: danh sách là của trình duyệt; **không có số HV mỗi mục** (cần câu đọc thêm theo từng chi nhánh — Turso) |
| C tìm tên → lớp tự mở, tô hồng | `ToKhop` · `hang-khop` | — (bấm thử) | KHỚP |
| D GV | cột "Việc của tôi" chỉ `mine` | d-gv | KHỚP |
| E TVV | "HV của tôi" ở ô Xem, "n/7 HV của tôi", bỏ chip "Cần chú ý" | e-tvv | KHỚP |
| F rỗng / đang tải / lỗi / mất quyền | `Empty` (nói đúng từ khoá + "Bỏ tìm") · `dang-tai-lai` · `ErrorState` sẵn có | — | GIỮ thành phần sẵn có; nút "Tìm ở Mọi chi nhánh / Lớp thường" KHÔNG thêm ([XM-1]) |
| K7 chip bậc → hộp nhỏ | `OYThuc` + `HopNho` (portal, fixed) | — (bấm thử) | KHỚP |
| BỎ: dòng mờ em Kết thúc học | máy chủ bỏ khối OV-11g | — | BỎ (U04-3) |
| BỎ: dòng 5 môn trên hàng em · "Xem thêm n" | `MiniKn` không dùng ở màn này | — | BỎ (ý 2, 3) |
| BỎ: phân trang trên bảng | chỉ dưới | a0 | BỎ |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| + Thêm học viên · + Lớp mới · Lưu trữ | đầu trang / ⋯ | như cũ; 375 Xuất + Thêm vào ⋯ trang | GIỮ · B26 |
| Xuất Excel · n HV | đầu trang | như cũ | GIỮ |
| Ô Phạm vi + ô Chi nhánh | hai ô | một ô "Xem" | G1 |
| Fast Track / Lớp thường | hai nút bật / tắt | đoạn chọn có số, cùng luật bấm | GIỮ luật · đổi hình |
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
`/my-work`: QL / Admin trước gọi `?nguoi=tat-ca` (việc cả chi nhánh), nay `/my-work` (việc của mình) → **ít dòng hơn**.

## [XM] / để sau
- [XM-1] Khu F "Tìm ở Mọi chi nhánh / Tìm ở Lớp thường" khi tìm không thấy: chưa thêm (giữ "Bỏ tìm"); thêm khi PTA đồng ý.
- [XM-2] Ô "Xem": không có số HV mỗi mục (cần đọc thêm theo chi nhánh). Giữ `<select>` gốc (bàn phím, 375 tốt).
- [XM-3] Hàng lớp TVV "3 HV của tôi / 7": số sau "/" = sĩ số lớp (`studentCount`).
- Hộp tiêu chí W1 / W2 / S: dùng `dongTieuChi` (#880) — commit tiếp sau khi #880 merge (máy chủ đã gửi `tp` c1–c4 trong `hang.mtGan`). Nếu PTA muốn đổi sang `history[].tieuChi` của #880 thì báo.
- [XM-4] CX: chip Tổng quan vẫn đếm em Kết thúc học chưa lưu trữ (`chipHocVien`), danh sách Học viên & Lớp không còn hiện em đó → số "Tất cả" của CX có thể nhỏ hơn ô Tổng quan. Cần quyết: bỏ em đó khỏi `chipHocVien` luôn (PR máy chủ) hay giữ.
