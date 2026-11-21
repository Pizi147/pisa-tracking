# Gói 3 GIAO-VIEC-GD (AUDIT-2111) · khớp / khác

Vai chụp: Head **Nguyễn Khánh Vy** (2) · TVV **Phan Mai** (27) · GVCN **Trần Ngọc Hà** (7). Seed nguyên, ngày demo 14/09/2026.
Dữ liệu thêm qua API (Head 2): "G3 · Gọi PH nhắc học phí" giao TVV 27 (không hạng mục) · "G3 · Hỏi PH lịch học bù" giao GV 7, hạng mục Báo PH, HV liên quan Lý Minh Châu.
Mỗi ảnh: trái TRƯỚC (main 1f92319) │ phải SAU. 1440 tối, 375 sáng. Phông Be Vietnam Pro đã tải (`document.fonts.check`).

## Ảnh

| Mã | Ảnh |
|---|---|
| A2-05 = B3-02 tab Vận hành TVV | `tvv-tab-van-hanh-1440-toi.png`, `tvv-tab-van-hanh-375-sang.png`, `tvv-panel-viec-giao-1440-toi.png`, `tvv-panel-viec-giao-375-sang.png` |
| P1-02 | `p1-02-doi-nguoi-1440-toi.png` (trước: dòng "✓ Đã lưu" + chip "✓ 1 xong hôm nay"; sau: không chip, panel giữ dải "Đã giao cho Lê Thu · Hoàn tác") |
| B3-12 · B3-16 · B2-06 | `gv7-viec-giao-hoan-thanh-1440-toi.png` (nút hàng "Hoàn thành", tên em ở dòng phụ, bỏ "… giao" lặp đầu panel), `b2-06-ho-so-hv-1440-toi.png` |
| A2-14 · A2-10 | `form-giao-viec-1440-toi.png` (chip "Nguyễn Khánh Vy · bạn" trong ô Theo dõi; nhãn "Mô tả việc") |
| A2-06 | `bang-van-hanh-1440-toi.png` (ô Nhóm có tìm) |
| A2-13 | `viec-quan-ly-1440-toi.png` |
| B3-05 · N63 ⑦ (A2-15) | `b3-05-a2-15-head-1440-toi.png` (gõ Mô tả việc → Đóng → hộp "Bỏ chữ đang gõ?"; khối ghi "mặc định · Head làm được") |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Đổi người phụ trách (khối giao việc) | lưu được, nhưng dòng thành "✓ Đã lưu" + đếm "xong hôm nay" | GIỮ; không đếm xong, panel đứng nguyên, dải Hoàn tác như cũ |
| TVV mở việc Vận hành được giao | tab "Bổ sung hồ sơ" › Việc được giao | tab **Vận hành** (tab rỗng ẩn như cũ) |
| Xong việc Vận hành được giao | 4 bấm (Cập nhật → Cập nhật tiến độ → Xong → Lưu), không Hoàn tác | nút hàng **Hoàn thành** 1 bấm + Hoàn tác (thay nút "Cập nhật" như mẫu Xếp lịch họp); bấm dòng vẫn mở panel, "Cập nhật tiến độ" GIỮ trong panel (nút đổi tên "Hoàn thành"); việc Tạm ngưng / Dừng hẳn không có nút hàng; máy chủ chặn (còn việc con) → báo lý do + mở panel |
| "+ Giao việc" | hai nút (đầu trang + cuối tab Việc quản lý) | một nút đầu trang (A2-13) |
| Lọc Nhóm bảng Vận hành | ô chọn gốc | ô có tìm (cùng ô Hạng mục); địa chỉ `?nhom=` giữ nguyên |
| Ô Hạng mục | hai "Báo PH" | một "Báo PH" (khoá cũ `bao-ph-test` web cũ gửi → máy chủ ghi `bao-ph`) |
| Theo dõi trong form Giao việc | dòng chữ "(bạn) tự theo dõi" | chip "Tên · bạn" trong ô, không ✕ |
| + Việc con | người "Chưa giao" | mặc định người phụ trách việc cha (đổi được) |
| Mô tả | "Mô tả" 2000 / "Ghi chú" / "Mô tả việc" 500 | một nhãn "Mô tả việc", trần 500; mô tả cũ dài gửi lại nguyên vẫn lưu |
| Khối giao việc việc đã đóng (vd vi phạm trả lại đã xử lý) | Đổi / Sửa hạn / + Thêm mô tả / ✕ + theo dõi / "còn n ngày" | chỉ đọc (vẫn tự bỏ theo dõi được) |
| Gõ Mô tả việc rồi Đóng panel | mất chữ, không hỏi | hỏi "Bỏ chữ đang gõ?" (cơ chế chung) |
| Trả lại / Rút ở panel Báo PH | dải "✓ … · Hoàn tác" khuất đầu thân panel | cuộn dải vào tầm nhìn; thẻ ③ ghi "hạn tạm dừng" khi đang chờ GV sửa |
| GVCN "Sửa rồi gửi lại" cả lần xử lý | chữ trơn | + link "Mở tab Ý thức của em ›" |
| Panel Meeting chân | Việc tiếp › · Đóng | Đóng · Việc tiếp › |
| Dòng Báo PH · Meeting của TVV | "hạn 18/09" | thêm "họp {ngày giờ}" như dòng CX |
| Theo dõi chung Meeting | có cả người đang phụ trách một phần | bỏ người đang phụ trách |
| Báo PH kết quả Test (Head xem) | "Phụ trách {GVCN} · mặc định" | + "Head làm được" (N63 ⑦) |
| Dải theo dõi Báo PH của TVV của em | "chỉ xem" | "TVV của em vẫn ghi Báo PH được" (N63 ⑨) |

Không mất thao tác nào.

## Khác / [XM]

- 375 tab TVV: hàng tab cuộn ngang tới tab đang chọn (đã có từ trước) — chữ "Báo PH" khuất một phần bên trái là hành vi cuộn sẵn có, không đổi.
- Bấm thử thêm (theo PTA, dữ liệu dựng qua chính luồng: GVCN 7 xác nhận Meeting CX cho Kiều Thảo Nhi, BPXL 33 Hoàn thành xếp lịch 18/09 15:00; TVV 27 Trả lại vi phạm rồi Rút, Trả lại cả lần xử lý; GVCN 19 Giữ nguyên; Head giao Báo PH cho Admin 26):
  - A3-08 chân panel Meeting: Đóng (x 693) · Việc tiếp › (x 1298) — `a3-08-meeting-cx-chan-1440-toi.png`.
  - A3-09 dòng TVV "MB FT 101 · Báo PH · Meeting CX/GĐCN · Kiều Thảo Nhi · **họp 18/09 15:00**" — `a3-09-tvv-dong-hop-1440-toi.png`. (Lúc bấm thử thấy dòng gọn `DongGon` không đọc dòng phụ → thêm thẻ; máy chủ đưa chữ vào `contextLabel`.)
  - A3-10 Theo dõi chung (TVV và CX xem): "Trần Ngọc Hà GVCN · Nguyễn Khánh Vy Head" — không còn Phan Mai — `a3-10-tvv-theo-doi-1440-toi.png`.
  - A3-11 phần xếp lịch xong ghi "Lương Thu Trang · **14/09 10:00**" (ngày demo, không 21/11).
  - A3-07 dải "✓ Đã trả lại cho Lâm Quang Vinh · Hoàn tác" nằm ở y 399–443 (khung 900) sau lưu; thẻ ③ "TVV báo PH · Chờ GV sửa · **hạn tạm dừng**" — `a3-07-tra-lai-dai-1440-toi.png`.
  - B3-08 GVCN "Sửa rồi gửi lại" cả lần: link "Mở tab Ý thức của em ›" → `/hoc-vien/117?tab=y-thuc` — `b3-08-gvcn-link-1440-toi.png`.
  - A1-03 GVCN "Giữ nguyên" xong: khối không còn Đổi / Sửa hạn / + Thêm mô tả / ✕ / +, không "còn n ngày" — `a1-03-khoi-chi-doc-1440-toi.png`.
  - N63 ⑨ TVV 27 mở Báo PH (đã giao Phạm Thanh Xuân) từ Đang theo dõi: "Bạn đang theo dõi · TVV của em vẫn ghi Báo PH được" — `n63-9-tvv-theo-doi-1440-toi.png`.
- Thấy thêm, NGOÀI phạm vi (chưa sửa): giờ "Phan Mai trả lại cả lần xử lý 21/11 18:11" / "GV đã trả lời 21/11 18:12" ghi giờ máy thật (`traLai.ts` `nowIso`) như A3-11 — đề xuất gói sau.
