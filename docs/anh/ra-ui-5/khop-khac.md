# RA-UI-5 — nhóm màn Test · Phân tích · Quản trị: lệch hình ảnh so mockup

Loại PR: **sửa nhỏ** (chữ, cỡ, màu link, đầu thẻ; không đổi bố cục, không mất thao tác). Nguồn: critique 29/10 `docs/superpowers/specs/2026-10-29-ra-soat-dem/critique-b-test-phan-tich-quan-tri.md` (điểm TRƯỚC 26–32/40).

## Ảnh (Mockup | TRƯỚC | SAU)
| Tệp | Màn |
|---|---|
| `phan-tich-1440-toi.png` | Phân tích › Báo cáo HV |
| `test-sos-375-sang.png` | Phân tích › Test + SOS 375 |
| `cham-test-gvbm-1440-toi.png` | Test › Chấm Test (GVBM) |
| `quan-tri-375-sang.png` | Quản trị › Tài khoản 375 |

## Sửa (theo mục critique B)
| # | Chỗ | Trước | Sau |
|---|---|---|---|
| B1 | tab "Chấm Test" | "11 nhóm" cạnh danh sách "11 việc" — một số hai tên | "11 việc" (V13: đơn vị việc) |
| B3 | tên HV ở lưới Chấm / Lịch (`LuoiFT`), bảng Ý thức (Phân tích) | xanh như link khắp bảng | `.ten-ho-so` (chữ thường, rê mới xanh + gạch — D4, mockup) |
| B4 | công tắc Fast Track / Lớp thường + ô chọn Lớp / Xếp theo (Phân tích) | 12 px, cao 26 px, lệch hàng với ô 38 px | 15 px, cao 38 px — thẳng hàng |
| B5 | 4 ô chỉ số Báo cáo HV | dòng "W1 SEP – W2 SEP" lặp 4 lần, trùng bộ lọc ngay trên | "trong kỳ" như Tổng quan ("Toàn bộ" khi chọn Toàn bộ) |
| B6 | đầu thẻ `Card` (mọi màn) | không xuống dòng — 375 "Tài khoản (32)" vỡ 3 dòng | `flex-wrap`, tiêu đề co được |
| B7 | Chấm Test › nhóm Speaking chấm chéo | chip "chấm chéo · không tính nợ" lặp ở MỌI dòng | bỏ chip — tên nhóm đã ghi "Speaking chấm chéo", "không tính nợ" ở ⓘ Cách đếm |
| B9 | Báo cáo HV › Tiến bộ theo kỹ năng | ô 0 vẫn gạch chân, bấm mở panel rỗng | ô 0 chữ xám, không bấm (G6 "số 0 không bấm") |

## Thao tác TRƯỚC → SAU
Không đổi: không thêm / bớt / dời nút. Ô 0 ở bảng Tiến bộ trước bấm được nhưng mở danh sách rỗng — nay không bấm (luật G6).

## Không sửa đêm nay (cần quyết / bố cục) — chép vào Việc để sau
- B2 ô điểm trống viền đứt (mockup v5 liền; mockup M2 chờ duyệt lại đứt) — chờ chủ SP duyệt M2.
- B8 khu chấm bên phải 3 tầng trước bảng + chân không trạng thái lưu [BỐ CỤC nhẹ].
- B10 ô điểm Speaking hồ sơ lượt 375 lệch cột; "vắng W2 SEP" lặp 5 lần một dòng (đụng chữ máy chủ — RA-LUONG).
- Tab "Kết quả Test" có tab con "Thi thật" — đặt tên theo G2? (PTA quyết).
- Chip trạng thái hồ sơ lượt: web chip vuông, mockup v7 pill chấm — đổi `Status` ảnh hưởng mọi màn (PTA quyết).
- Lịch Test tuần đang theo mockup M2 chưa duyệt → chấm lệch sau khi chủ SP duyệt.
