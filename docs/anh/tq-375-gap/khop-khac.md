# TQ-375-GAP — Tổng quan 375: gập chi nhánh rỗng (backlog GD-14)

Mockup `thiet-ke/v21/tong-quan.html` ⑧ T7b ("+ 3 chi nhánh" trước thẻ Toàn hệ thống). Lệnh PTA Plan 15/11: chi nhánh rỗng (không số / không việc) gập thành MỘT dòng như mockup 375; 1440 không đổi.
Ảnh seed demo, tài khoản demo Quản trị (vai 1), phông Be Vietnam Pro + Inter đã nạp. Công cụ `scripts/anh-cap.mjs`.

## Ảnh cặp (mockup │ web)
| Ảnh | Khung | Nội dung |
|---|---|---|
| `t7b-qt-375-sang.png` | T7b | 375 sáng: chi nhánh có số giữ thẻ; Hải Dương (mọi ô 0 / —) gập sau nút **"+ 1 chi nhánh"** đặt trước thẻ Toàn hệ thống |
| `t7b-qt-375-mo-sang.png` | T7b | bấm "+ 1 chi nhánh" → mọi thẻ hiện đúng thứ tự cũ |
| `t3-qt-1440-toi-khong-doi.png` | T3 | 1440 tối: bảng không đổi (không gập) |

## Bảng truy vết
| Khung | Thành phần | Sau PR | Ảnh | Đánh giá |
|---|---|---|---|---|
| T7b | Thẻ chi nhánh có số | giữ | t7b | KHỚP |
| T7b | Nút "+ n chi nhánh" | nút hết bề rộng 44 px, trước thẻ Toàn hệ thống; `title` liệt kê tên chi nhánh gập | t7b | KHỚP |
| T7b | Chi nhánh nào gập | CHỈ chi nhánh rỗng: Đạt MT / Đạt Target không mẫu, SOS 2–3 = 0, Case chưa có PA = 0, Thi tháng này = 0 | t7b | KHÁC dữ liệu — mockup gập 3 chi nhánh (vẽ tay), seed chỉ Hải Dương rỗng; luật theo lệnh PTA "rỗng mới gập" (không giấu chi nhánh có số) |
| T7b | Bấm nút | hiện hết tại chỗ, đúng thứ tự (không đổi trang) | t7b-mo | KHỚP |
| T3 | 1440 | không đổi | t3 | GIỮ |
| — | Báo cáo HV (Phân tích) 375 dùng cùng bảng | không gập (chỉ Tổng quan) | — | GIỮ |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Xem thẻ chi nhánh 375 | mọi thẻ dài một cột | thẻ rỗng gập; "+ n chi nhánh" mở lại tại chỗ |
| Bấm thẻ chi nhánh → trang chuyển sang chi nhánh đó · bấm ô số | có | như cũ (cả sau khi mở) |

Không thao tác nào bị bỏ.

## Turso
0 câu, 0 dòng thêm (chỉ ẩn / hiện dữ liệu đã nạp).

## Rà trước PR
- impeccable `audit`: detector 0 phát hiện; nút 44 px, có chữ, `title` nêu tên chi nhánh gập; không chữ bị cắt mới.
- `web-design-guidelines`: nút là `button`, nhãn rõ, số đếm dịch được ("+ {n} branches").
- `/ponytail-review`: một hàm `rongCn` + một trạng thái — không có gì cắt.
