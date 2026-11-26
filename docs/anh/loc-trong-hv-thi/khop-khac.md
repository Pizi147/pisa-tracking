# Lọc "Còn trống" (Lịch Test tuần) + danh sách HV "Đã thi" (chủ SP 26/11)

Ảnh cặp cả màn, trái = TRƯỚC (main `b636a5545`), phải = SAU. Dữ liệu demo (ngày demo 14/09/2026; 8 em MB FT 101 đặt ngày thi đã qua để có "Đã thi · chờ KQ").
Đây là việc sửa theo mẫu có sẵn (thêm chip lọc, thêm mục menu, cân cột) — không đổi bố cục màn, không cần mockup mới (plan.md 1.3b).

| Ảnh | Màn |
|---|---|
| `lich-test-1440.png` · `lich-test-1280.png` · `lich-test-375.png` | Test › Lịch Test tuần, bật "Còn trống" |
| `hv-da-thi-1440.png` · `hv-da-thi-1280.png` · `hv-da-thi-375.png` | Học viên & Lớp, lọc "Đã thi · chờ KQ", mở lớp |
| `hv-menu-1440.png` | Cùng màn, menu ⋯ dòng em (mục "Ghi KQ thi thật") |

1440 · 1280 tối, 375 sáng. Phông Be Vietnam Pro đã nạp trước khi chụp (kiểm `document.fonts`).

## Việc 2 — Lịch Test tuần: bộ lọc "Còn trống"

| Chỗ | Khung / mockup | Web SAU | KHỚP / KHÁC |
|---|---|---|---|
| Hàng lọc | chip lọc cùng kiểu `nut-loc` (Fast Track · Lớp thường) | chip "Còn trống · n" ngay sau công tắc khung, trước Chi nhánh; bật = nền xanh nhạt + viền như chip lọc khác | KHỚP |
| Số trên chip | số lớp như chip khung | n lớp (của khung đang xem) còn bài chưa điểm trong tuần; tooltip "n lớp · m bài chưa có điểm trong tuần" | KHỚP |
| Nhóm "Tuần này" | — | chỉ hàng lớp còn trống (`conBai > 0`); dòng phụ "8 lớp · 9 lượt" đếm theo cùng tập | KHỚP |
| Lưới trong lớp | — | chỉ em có ô CỦA TUẦN ĐANG XEM chưa điểm (FT: `oTrongTuanFt`; lớp thường: môn thi đúng tuần, chưa điểm); ô thi tuần khác / có điểm / "-" / vắng / huỷ không tính | KHỚP |
| Mở sẵn | như bấm ô "đã chấm" | bật lọc thì các hàng lớp còn trống tự mở (lưới nạp lười theo khung nhìn, không thêm request) | KHỚP |
| Hết ô trống | — | "Tuần W3 SEP không còn ô trống." | KHỚP |
| 375 | chip khung ở hàng tuần | chip "Còn trống" xuống hàng riêng dưới công tắc khung (chật không đủ một hàng) | KHÁC nhỏ (không đủ chỗ) |

Không đổi: khối "Quá hạn chấm" (nợ từ tuần trước, không phải ô của tuần đang xem) vẫn hiện như cũ khi bật lọc. Trạng thái nằm trên đường dẫn `?trong=1` (F5 / Back giữ).

## Việc 4 — Học viên & Lớp, lọc "Đã thi"

| Chỗ | TRƯỚC | SAU | KHỚP / KHÁC |
|---|---|---|---|
| Chip Lịch thi | "Đã thi 03/09/2026 · chờ K" bị cắt | "Đã thi 03/09/2026" + dòng phụ "chờ KQ" (cùng dạng dòng phụ của Lộ trình / MT gần nhất); ngày giữ dd/mm/yyyy (NH4); cột 152 (1280) / 172 (1440) | KHỚP |
| Cột Việc cần làm | cột rộng, trống | không em nào có việc CỦA NGƯỜI XEM → bỏ cột; Học viên co giãn, các cột còn lại cố định cân nhau, ⋯ sát mép phải (NH9). Có việc thì cột giữ như cũ. CX vẫn có cột Phụ huynh | KHỚP |
| MT gần nhất 1280 | 200 | 182 (nhường 18 px cho Lịch thi; tổng cột cố định giữ 956) | KHỚP |
| Menu ⋯ dòng em | + Task · Case · Vi phạm / Nhắc nhở · Tình hình học tập │ Sửa thông tin · Chuyển lớp… | thêm "Ghi KQ thi thật" sau nhóm "+ Task", chỉ em Đã thi · chờ KQ mà người xem nhập được | KHỚP |
| "Ghi KQ thi thật" | — | mở panel Sau thi CÓ SẴN (`PanelSauThi`, cùng "Kết quả thi thật" ở hồ sơ HV): lưu xong danh sách tải lại khi đóng panel (không kéo panel đi mất khi còn "Chọn bước tiếp") | KHỚP |
| 375 | chip một dòng "Đã thi … · chờ KQ" | giữ nguyên chip một dòng | KHỚP |

Quyền: máy chủ trả `choKq: { cycleId, coTheNhap }` theo `coTheNhapThiThat` (GVCN, QL, Admin, TVV, CX — #2176 Q4); web chỉ ẩn / hiện mục, máy chủ vẫn kiểm khi lưu. TVV / CX đã có mục "Kết quả thi thật" (cùng panel) nên không thêm mục thứ hai.

## Bảng thao tác TRƯỚC → SAU

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Xem em Đã thi · chờ KQ trên danh sách | chip cắt chữ | đủ ngày + "chờ KQ" |
| Ghi KQ thi thật từ danh sách | phải vào hồ sơ HV / Công việc / tab Lịch thi | ⋯ → "Ghi KQ thi thật" ngay tại dòng |
| Việc cần làm (có việc) | cột Việc + chip việc | giữ nguyên |
| Case · Vi phạm · Tình hình · Sửa thông tin · Chuyển lớp · Nhập điểm trong ⋯ | có | giữ nguyên, cùng thứ tự |
| Lịch Test: xem mọi lớp / em | có | giữ nguyên (tắt chip = như cũ) |
| Lịch Test: thấy riêng phần còn trống của tuần | không có | chip "Còn trống" |

Không mất thao tác nào.

## Chú thích `ponytail:` mới
- `DanhSachHvLop.tsx` (`BangHvGon`): bỏ cột Việc chỉ xét các lớp đang hiện; lọc đổi thì tính lại.

## Việc để sau / hỏi
- Không có [XM]. (Lọc "Còn trống" không đụng khối Quá hạn chấm — nếu chủ SP muốn khối đó cũng ẩn khi bật lọc thì báo.)
