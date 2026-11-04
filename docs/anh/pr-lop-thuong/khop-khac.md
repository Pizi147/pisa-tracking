# Lớp thường · bỏ "Cần hỗ trợ" (chủ SP 04/11) — theo U03

Việc: `30-pr-giao-dien.md` dòng UI-HO-SO-LOP — lớp THƯỜNG bỏ cách xem "Cần hỗ trợ" cho đồng bộ với FT (#880). Mockup tham chiếu `thiet-ke/audit-0311/u03-ho-so-lop.html` (chỉ vẽ FT) — lấy phần áp được cho lớp thường: hàng chip lọc trong thẻ bảng, ô điểm ✓ / ✗, bấm tên mở ngay dưới hàng, khối mở rộng (`KHOI` · tiêu đề vạch nhấn), "Hồ sơ HV ›" · "+ Case".
Dữ liệu web: demo MB FOU 15 (Foundation, vai GVCN 7), mở Lê Hoàng Anh. Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') = true`.

## Ảnh cặp (mockup U03 | web lớp thường; toàn trang)
| Tệp | Khung |
|---|---|
| `a1-mo-em-1440-toi.png` | A1 U03 · lớp thường: bấm tên → "Case đang mở" dưới hàng |
| `a2-loc-co-case-1440-toi.png` | chip "Có Case" (`?loc=case`) |
| `b1-the-em-375-sang.png` | B1 U03 · thẻ em 375 mở, Case xếp dọc |

## Truy vết khung → thành phần
| Khung U03 | Thành phần | Lớp thường | Ghi chú |
|---|---|---|---|
| A1 | Chip lọc trong thẻ bảng (Cách xem đầu · Chọn nhiều cuối) | KHỚP | Tất cả · **Chưa đạt** · **Có Case** (thay SOS · Chưa đủ dữ liệu — lớp thường không có SOS / band); dùng chung `ChipLoc` |
| A1 | Nút đoạn "Tổng hợp / Cần hỗ trợ" | BỎ | còn nút đoạn khi có Thông tin lớp (TVV / CX) |
| A1 | Ô điểm "✓ / ✗ số" đậm, xanh / đỏ | KHỚP | `ODiem` ti-le "✗ 11/20" (trước: đỏ + ▾) |
| A1 | Bấm tên → mở dưới hàng (hàng nhấn, ▾) | KHỚP | `TenEm` dùng chung |
| A1 | Khối mở rộng nền thẻ + tiêu đề vạch nhấn + "Hồ sơ HV ›" · "+ Case" | KHỚP | nội dung = Case đang mở theo kỹ năng (dòng Case cũ của Cần hỗ trợ) |
| A1 | Điểm theo lượt · 5 ô kỹ năng · tóm tắt kỹ năng | KHÁC (không áp) | lớp thường không band / kỳ vọng / W1 W2; điểm đã ở chính hàng theo mốc |
| A1 | Cột một tầng L R W S Overall | KHÁC (không áp) | lớp thường hai tầng mốc × môn (Progress / Final × L R G+V P) — giữ |
| B1 | Thẻ em 375, mở cuối thẻ | KHỚP | Case mỗi dòng một thẻ con (`DongCase` the) |

Về hình (phần áp được): 6 / 6 KHỚP. Hai dòng KHÁC là cấu trúc dữ liệu lớp thường, không phải lệch hình.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | Vì sao |
|---|---|---|---|
| Cách xem "Cần hỗ trợ" (lớp thường) | có | bỏ | chủ SP 04/11; link cũ `?che-do=` mở Tổng hợp |
| Xem Case của em: vấn đề · trạng thái · PA đang làm · việc tiếp + hạn → panel Case (Ghi KQ / Xác nhận) | ở Cần hỗ trợ | bấm tên em → "Case đang mở" (cùng `DongCase`, cùng panel) | GIỮ, dời chỗ |
| Biết em nào có Case / dưới ngưỡng | danh sách Cần hỗ trợ | chip "Có Case n" · "Chưa đạt n" + ✗ ở ô | GIỮ |
| Bấm tên em | đổi trang hồ sơ HV | mở tại chỗ; "Hồ sơ HV ›" trong vùng mở (mang Trước / Sau) | như FT U03 |
| + Case | ⋯ hàng | ⋯ hàng + nút trong vùng mở | như FT |
| Dòng tổng "n em · n Case · n chờ QL duyệt · n quá hạn" | có | bỏ | số Case ở chip; quá hạn ở Việc của tôi / badge đầu trang |
| Công tắc "Chỉ kỹ năng tôi dạy" (GVBM) | có | bỏ | xem từng em nên không cần lọc kỹ năng; hàng Case theo kỹ năng vẫn ghi tên kỹ năng |
| Phân trang 10 / 20 / 50 của Cần hỗ trợ | có | bỏ | bảng em lớp không phân trang (như trước) |
| ⋯ hàng · Nhập điểm · Chọn nhiều · Lộ trình tiếp theo · Phụ huynh (TVV) · Xét lại · ý thức · thiếu thông tin | có | có | GIỮ |

## Turso
Mở trang: **+0** (chip đếm từ `openCases` / `ratios` của `/roster` đã đọc). Mở em đầu tiên: **1** `/classes/:id/can-ho-tro` (đường sẵn có, dùng lại cho em khác). Trước: mở Cần hỗ trợ đọc `/can-ho-tro` + `/roster` lần nữa. Không đường mới.

## Để sau
- `BangCanHoTro.tsx` chỉ còn `DongCase` + kiểu (dùng ở lớp thường, hồ sơ MT) — đổi tên tệp khi có PR dọn.

## Chú thích `ponytail:`
Không có.
