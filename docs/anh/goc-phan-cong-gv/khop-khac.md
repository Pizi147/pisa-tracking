# PR-C Góc Phân công GV — khớp / khác mockup v9

Mockup: `thiet-ke/v9/phan-cong-gv.html` (chủ SP duyệt 30/10) · ảnh cặp trong thư mục này: trái mockup, phải web (1440 tối, 375 sáng; dữ liệu seed demo chi nhánh MB, không phải dữ liệu Cẩm Phả của mockup).
Ảnh chụp bằng Playwright từ máy dev (QL = vai 2, CX = vai 24).

## Bảng truy vết khung → thành phần → ảnh

| # | Khung | Thành phần | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | k1 · 1440 QL bình thường | `GocPhanCongGv` · `BangLopPc` · `TongHopPc` | cap-k1-1440 | KHỚP (GIỮ nút cũ "Xuất Excel · n HV" thay "Xuất Excel · 16 lớp" — đặc tả 2b) |
| 2 | k1 · 375 thẻ lớp | `TheLopPc` | cap-k1-375 | KHỚP |
| 3 | k2 · 1440 tô sáng | `TongHopPc` · `DaiToPc` | cap-k2-1440 | KHỚP |
| 4 | k2 · 375 dải tô dính | `TheLopPc` · `DaiToPc gon` | cap-k2-375 | KHỚP |
| 5 | k3 · 1440 dòng nháp, lỗi GVCN, ô ▾ mở | `OGv` · `ChonGvPc` · `BangLopPc` | cap-k3-1440 | KHỚP (danh sách chọn = `ChonNguoi` sẵn có: ô gõ + nhóm "Đang dạy lớp này" / "GV khác · CN") |
| 6 | k3 · 375 Sửa thẻ | `TheLopPc` | cap-k3-375 | KHỚP |
| 7 | k4 · 1440 409 | `OGv khac-doi` · dải lỗi dưới hàng | cap-k4-1440 | KHỚP (seed không có GV đã nghỉ → ô "⚠ đã nghỉ" kiểm bằng phép kiểm `C4 · RF1-web`, không có ảnh) |
| 8 | k5 · 1440 hộp Lưu Từ tuần | `HopLuuPhanCong` | cap-k5a-1440 | KHỚP · BỎ "· n việc" trong dòng Luôn chuyển (tự quyết, PTA duyệt) |
| 9 | k5 · 375 tấm dưới | `HopLuuPhanCong neo='tam-duoi'` | cap-k5-375 | KHỚP |
| 10 | k5 · 1440 sau Lưu: Chờ đổi + toast | `OGv cho-doi` · `HopChoDoi` | cap-k5b-1440 | KHÁC: hộp Chờ đổi chưa có dòng "Việc bàn giao: a/b em đã viết" (cần dữ liệu PR-B) |
| 11 | k5 · 1440 Lưu cả n lớp | `ThanhLuuPc` · `HopLuuPhanCong` | cap-k5c-1440 | KHỚP |
| 12–16 | k6 · Công việc / panel bàn giao | — | — | GIỮ (PR-B) |
| 17 | k7 · 1440 CX | `GocPhanCongGv` chỉ xem | cap-k7-1440 | KHÁC có lý do: tên GV chữ thường, không link (PTA duyệt) |
| 18 | k7 · 375 CX | `TheLopPc` chỉ xem | cap-k7-375 | KHỚP |
| 19 | k8 · 1440 rỗng chi nhánh | khung rỗng `pc-rong` + "+ Lớp mới" | — | Không chụp: seed không có chi nhánh 0 lớp; đường vẽ cùng khối `.pc-rong` của khung 20 |
| 20 | k8 · 375 tìm không ra | `GocPhanCongGv` rỗng tìm | cap-k8-375 | KHỚP |
| 21–23 | k9 · hồ sơ lớp / GV cũ chỉ xem | — | — | GIỮ (PR-D, PR-B) |

GIỮ (không vẽ): tab "Cần làm" đã bỏ trên web · `+ Thêm học viên`, `⋯` trang · đang tải (Skeleton) / lỗi tải (ErrorState + Thử lại) · Quản trị / CX phạm vi toàn hệ thống → "Chọn chi nhánh để xem phân công" + ô chi nhánh.

**Tỉ lệ:** 15 khung có ảnh / có đường vẽ trong phạm vi PR-C → 13 KHỚP, 2 KHÁC (1 có lý do đã duyệt, 1 chờ dữ liệu PR-B) = **87 % KHỚP tuyệt đối, 93 % tính KHÁC đã duyệt** (cổng ≥ 90 %).

## KHÁC so với mockup — lý do

| Chỗ | Mockup | Web | Lý do |
|---|---|---|---|
| Bề rộng cột | 6 cột × 184 px, cột 5 trống ở FOU/BE, cột Lưu luôn có | Cột Lớp 200 · cột kỹ năng + GVCN chia đều phần còn lại · nhóm 4 kỹ năng không chừa cột trống · cột Lưu 120 chỉ khi nhóm có dòng nháp / đã lưu / chờ đổi | Chủ SP 30/10 (duyệt mockup: dùng tối đa bề rộng) + chủ SP 30/10 trong phiên: "giãn hợp lý các cột kỹ năng và GVCN" |
| Cột GVCN | nền thường | nền `surface-2` cả cột + vạch nhấn trái 3 px, tiêu đề 700 | Chủ SP 30/10 (ghi chú duyệt đặc tả) |
| "✓ Đã lưu" | chữ xanh `ok` | chữ xám + vạch `ok-line` đầu dòng | Luật NEN K-HTT-3 ("Đã lưu" một cách báo — xám) |
| Ô tuần hiệu lực | ô "W1 NOV ▾" | `<select>` 12 tuần từ tuần sau (mã tuần) | Đúng hình mockup; `WeekPicker` (‹ › Tuần này) to hơn khung hộp — [XM] ghi plan.md mục 4 |
| Hạn việc bàn giao | 04/11 (vẽ tay) | `hanBanGiaoGv(hôm nay)` = 5 ngày tính cả ngày tạo | PTA duyệt 30/10 |
| Dòng "Luôn chuyển sang B" | "n Case · n PA · n việc" | "n Case · n PA" | PTA duyệt 30/10 |
| Tên GV ở CX | link hồ sơ | chữ thường | CX không mở hồ sơ GV (quyền máy chủ) — PTA duyệt |

## Thao tác TRƯỚC → SAU PR

| Thao tác | Trước | Sau |
|---|---|---|
| Xem ai dạy một lớp | hồ sơ lớp → ⋯ → Thông tin lớp | Giữ + tab "Phân công GV": cả chi nhánh một bảng |
| GV nào nhiều / ít lớp | không có | Giảng dạy + GVCN (FT · Lớp thường · Tổng), xếp được, GV 0 vẫn hiện |
| Thấy mọi ô của một GV | không có | bấm tên ở tổng hợp → tô + "Chỉ hiện n lớp" + "Hồ sơ GV ›" |
| Đổi GV một môn | 5 bước ở hồ sơ lớp | chọn ô → Lưu → (hộp khi có cặp A → B) Lưu; hồ sơ lớp GIỮ đường cũ (PR-D thêm hộp) |
| Đổi nhiều lớp | từng hồ sơ lớp | "Lưu cả n lớp…" → một hộp, một hiệu lực |
| Kiểm 3 luật | tại ô, khoá Lưu | Giữ (`kiemPhanCong` qua `kiemDongPc`), chỉ dòng đang sửa |
| Người khác vừa đổi (409) | gộp bản + báo | Giữ (`gopChonSau409`), giữ MỌI nháp, dải lỗi dưới hàng, ô "↻ người khác vừa đổi" |
| Sau lưu | toast | toast + Hoàn tác (đảo cả Case / PA vừa chuyển, việc bàn giao) |
| Hiệu lực | đổi ngay | Ngay hôm nay / Từ tuần; ô "Chờ đổi" + Đổi mốc… / Huỷ lịch đổi (Hoàn tác được) |
| Rời trang khi đang sửa | — | `beforeunload` + hỏi một lần khi đổi tab góc / phạm vi / chi nhánh |
| Bàn phím | — | ← ↑ → ↓ giữa ô, Enter / Space mở, Esc đóng (giữ giá trị), Ctrl + Enter lưu dòng |

Không mất thao tác nào.

## Audit trước khi mở PR

- `impeccable audit` (thủ công — trình dò dựng trang không chạy được trong container: Chromium từ chối chạy root không `--no-sandbox`, trang cần đăng nhập; quét mã .tsx: 0 phát hiện):
  A11y 3 · Hiệu năng 3 · Theme 4 (chỉ token, sáng / tối) · Responsive 3 · Toàn vẹn 3 = **16/20**. Đã sửa: ô Xếp / ô tuần / nút dải tô 375 < 44 px.
  Còn: danh sách chọn mở dưới ô, ở gần đáy màn có thể tràn (cuộn trang để thấy) — chưa lật lên trên.
- `web-design-guidelines`: đã sửa ô tìm `autoComplete="off"`, ngoặc kép cong “…”, `overscroll-behavior: contain` cho hộp nổi. Không áp dụng: Title Case (tiếng Việt), Intl cho ngày (dùng `ngay` / `tuanLich` chung của hệ).
