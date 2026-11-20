# v22 · ④ Trả lại vi phạm · ghi chú cho người duyệt

Mockup: `thiet-ke/v22/tra-lai-vi-pham.html` (+ `v22.css`; dùng lại `../v21/v21.css`, `bang-mau.css`, `trang-dau-tvv.css`, `chuong-vi-pham.css`).
Thiết kế: `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` mục E (ĐỀ XUẤT; [CHỐT] trả lại vi phạm lẻ / cả yêu cầu xử lý, GV sửa trong 3 ngày, hạn sửa được). Ảnh: `anh/tra-lai-vi-pham/{khung}-{toi|sang}.png`.
Mốc: trả lại 14/09 → hạn GV 17/09 · GV gửi lại 16/09 → Báo PH hạn mới 21/09.

## 1. Trạng thái đã vẽ

| Khung | Trạng thái |
|---|---|
| T1 | 1440 · TVV · panel Báo PH: danh sách vi phạm bấm được, một vi phạm mở chi tiết + ô lý do + "Trả lại" |
| T2a / b / c | ⋯ mở có "Trả lại cả lần xử lý" · hộp trả cả lần (về GVCN) · lý do < 8 ký tự báo tại ô |
| T3a / b / c | panel "Chờ GV sửa" (dải trạng thái + Rút, hạn tạm dừng, form vẫn dùng được, Hoàn tác) · dòng việc ở danh sách · sau Rút |
| T4a | 1440 · GV ghi · mục "Vi phạm bị trả lại" · panel ba lựa chọn, "Sửa rồi gửi lại" (bấm thử ba lựa chọn: nút chính + dòng quy chế đổi) |
| T4b / c | "Giữ nguyên + trả lời" · "Xoá vi phạm" (nút đỏ, Đã xoá 30 ngày) |
| T5 | GVCN · cả lần xử lý bị trả · lựa chọn "Thu hồi" → Gửi QL duyệt |
| T6a / b | chuông TVV: "GV đã sửa", "GV đã trả lời" · panel Báo PH sau gửi lại, Lịch sử vi phạm (cũ → mới) |
| T7a / b | GV quá hạn 3 ngày: chip đỏ · dải TVV đỏ "GV quá hạn 1 ngày", máy không tự làm gì |
| T8a / b | 375 · GV panel ba lựa chọn dọc · TVV mở một vi phạm, Trả lại |

## 2. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| TVV xem vi phạm trong panel Báo PH | danh sách chữ, chỉ xem | dòng bấm được, mở chi tiết tại chỗ (vẫn không sửa vi phạm) |
| Trả lại một vi phạm | — | MỚI: "Trả lại" + lý do ≥ 8 → người ghi |
| Trả lại cả lần xử lý | — | MỚI: ⋯ → hộp → GVCN |
| ⋯ Bỏ việc… | có | GIỮ |
| Ghi Báo PH khi đang chờ GV | — | vẫn ghi được (không chặn) |
| Rút yêu cầu | — | MỚI, Hoàn tác |
| GV sửa / giữ nguyên + trả lời / xoá | sửa / xoá ở tab Ý thức | thêm việc "Vi phạm bị trả lại" gom ba đường vào một panel |
| GVCN Thu hồi (N5) | có (đường sẵn có) | thêm lối vào từ việc "Lần xử lý bị trả lại" |
| Lịch sử vi phạm | có | ghi thêm trả lại / sửa / trả lời / rút |

## 3. Chỗ tự quyết

- Chi tiết vi phạm mở **ngay dưới dòng** trong panel (không panel lồng); một lúc một vi phạm mở.
- Nút "Trả lại" trong chi tiết → ô lý do hiện tại chỗ, nút xác nhận "Trả lại" + dòng phụ "Về {người ghi} · hạn sửa 17/09".
- Trạng thái "Chờ GV sửa": thẻ chữ nền lam (không chỉ màu) trên dòng việc, ở đầu panel và tại vi phạm; chip hạn đổi thành "tạm dừng".
- Rút: một bấm + Hoàn tác (thang 1), không hỏi lại.
- GV: ba lựa chọn dùng dáng `.cach` đã duyệt; nút chính đổi chữ theo lựa chọn ("Gửi lại" · "Gửi trả lời" · "Xoá vi phạm" đỏ); dòng quy chế đổi theo.
- GV có "Sửa hạn"; không có "Đổi" người phụ trách (luật: về đúng người ghi).
- Cả lần xử lý về GVCN: ba lựa chọn Sửa rồi gửi lại · Giữ nguyên + trả lời · **Thu hồi**; không có "Xoá vi phạm" ở cấp lần xử lý (xoá từng vi phạm ở tab Ý thức như nay).
- Tin chuông TVV xuống hai dòng để không cắt nội dung sau tên HV.
- Hạn sau gửi lại ghi "tính lại sau khi GV gửi lại" ở dòng Hạn (thay "mặc định").

## 4. [XM] — đã xử lý

- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — GV ghi vi phạm đã nghỉ / chuyển chi nhánh → vi phạm bị trả lại về GVCN.
- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — GV được sửa NGÀY vi phạm khi bị trả lại (cùng Môn, Nội dung), có lịch sử — như T4a.
- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — Báo PH đã xong (việc đã đóng) thì KHÔNG trả lại được nữa — nút "Trả lại" chỉ có khi việc Báo PH còn mở.

## 5. Dòng đọc

Chi tiết vi phạm dùng dữ liệu panel đã nạp; trả lại / rút / gửi lại là ghi (một vi phạm + một việc + một tin). Việc "Vi phạm bị trả lại" của GV vào `/my-work` qua đường "việc lưu sẵn" (+1 câu có chỉ mục, theo thiết kế).
