# HD-CHI — đích "Chỉ cho tôi" của hướng dẫn

Đo: `HD_VAI=… node scripts/do-khung.mjs hd-chi` (6 vai, tài khoản GV 7 + 9 · QL 2 · QT 1 · TVV 23 · CX 24 · Admin 22; 1440 + 375) trên main c47a5d69.
**TRƯỚC 20 lỗi → SAU 0 lỗi** (GV, QL, QT, TVV, CX, Admin).

## Bước → đích TRƯỚC → SAU
| Vai · bước | TRƯỚC | Lỗi | SAU |
|---|---|---|---|
| GV · Việc hằng tuần › Ghi vi phạm | `tq-lop-toi-day` @ `/cong-viec` | "phần tử ngoài màn" — khối Yêu cầu của tôi tải sau, đẩy "Lớp tôi dạy" xuống sau khi đã cuộn | giữ đích; khoanh đợi phần tử đứng yên một nhịp rồi mới cuộn (`chiChoToi.tsx`, sửa chung cho mọi bước) |
| GV · Theo màn Công việc › Lớp tôi dạy | như trên | như trên | như trên |
| GV · Việc hằng tuần › Nhập điểm | `lich-test-tuan` @ `/test/lich` «Bài tuần trước cần chấm nằm ở khối này.» | trỏ nhầm: bước ghi "Mở Test › Chấm Test" nhưng khoanh khối "Test tuần này" của Lịch Test | `cham-test-ds` @ `/test/cham` «Bài cần chấm xếp theo hạn — bấm một dòng để chấm.» (thêm `data-hd` vào danh sách Bài cần chấm) |
| GV · Theo màn Lịch Test › Lịch Test tuần | `lich-test-tuan` «Bài tuần trước cần chấm nằm ở khối này.» | chữ sai chỗ: khối là "Test tuần này" | giữ đích; chữ «Mỗi lớp một dòng — bấm dòng để gõ điểm.» |
| QL, QT · Theo màn Công việc › Lớp tôi dạy | `tq-lop-toi-day` @ `/cong-viec` | "Chưa có việc" — khối chỉ dựng cho GV | bỏ mục này khỏi hướng dẫn QL / QT (mục nói về khối họ không có) |
| QL, QT · Theo màn Công việc › Yêu cầu bị từ chối (không có "Chỉ cho tôi") | chữ "Cuối Công việc" | khối chỉ dựng cho GV | bỏ mục khỏi hướng dẫn QL / QT (PTA Plan 28/10) |
| QT · Theo màn Tổng quan › Chờ bạn duyệt · Điều hướng | `tq-can-xu-ly` @ `/` | "Chưa có việc" — QT mặc định Tất cả chi nhánh (bảng Theo chi nhánh) | bỏ "Chỉ cho tôi" (chữ giữ: đúng khi chọn một chi nhánh) |
| QT · Theo màn Tổng quan › Lớp cần chú ý · GV cần chú ý | `tq-lop-chu-y` @ `/` | như trên | như trên |

Các bước còn lại (GV 15, QL 17, QT 7 + TVV, CX, Admin) đã đạt — đích có ở 1440 và 375, đúng chỗ chữ nói.

## Phép kiểm
`HD-CHI` (`prHd.tests.ts`) thêm bảng `CHI_VAI` (đường, `data-hd`, vai thấy): hướng dẫn vai khác trỏ vào phần tử màn đó không dựng cho vai mình → đỏ.
Phần "data-hd có trong web/src" đã có từ HD-a.

## Ảnh (SAU)
`1-gv-nhap-diem-cham-test-{1440,375}.png` · `2-gv-vi-pham-lop-toi-day-{1440,375}.png` · `3-gv-lich-test-tuan-{1440,375}.png` (1440 tối, 375 sáng).

## Thao tác TRƯỚC → SAU
Không đổi thao tác. QL / QT bớt một mục hướng dẫn sai vai; QT bớt hai nút "Chỉ cho tôi" trỏ khối không có.

## PTA Plan đã quyết (28/10)
- Bỏ mục "Yêu cầu bị từ chối" (`tq-yeu-cau`) khỏi hướng dẫn QL / QT — đã sửa.
- Không thêm mục "Theo chi nhánh" cho QT.
