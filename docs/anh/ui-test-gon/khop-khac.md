# UI-TEST-GON (B8 · T1 T3 T4 HSL6) — khớp / khác

Mockup: `thiet-ke/2026-11-08-audit-ui-mockup.html#b8` (chủ SP duyệt 08/11, phương án A).

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết luận |
|---|---|---|---|
| Dải số "Cả chi nhánh: 49/98 bài đã chấm · 45 bài quá hạn" | `test/lichTest/DaiSo.tsx` | b8-test-1440-*, b8-test-375-* | KHỚP: hai ô, ô rộng theo chữ, số 22 px màu nhấn, chữ 14 px phụ; 375 nhãn nhóm một hàng trên |
| Ô "còn chấm" | — | — | BỎ (= tổng − đã chấm). Số còn ở `title` ô đã chấm; thao tác "mở các hàng còn bài" chuyển sang ô đã chấm |
| Lưới: Học viên + chip "MTn ›" · L R W1 W2 S · Kỳ vọng · Overall · Kết quả | `cham/LuoiFT.tsx` (dùng chung Lịch tuần, lưới đầy đủ, panel Công việc) | b8-test-1440-*, b8-panel-cv-1440-toi | KHỚP: bỏ cột MT ở gốc → mọi nơi dùng `LuoiFT` (cả panel Công việc chấm FT — HSL6) |
| Cột W (band Writing tính) | `LuoiFT` | b8-test-1440-* | GIỮ — mockup không vẽ; là số tính có ✓ / ✗ so kỳ vọng, không lặp gì. [XM] nếu chủ SP muốn bỏ |
| Viên hàng lớp chỉ khi khác thường ("Chưa chấm" / "Đã chấm") | `HangLop.tsx` | b8-test-* | KHỚP (đã làm ở A2 T3). KHÁC nhỏ: web giữ chấm màu đầu viên (luật viên nhóm 3 toàn web) thay "✓" |
| Phần mockup không vẽ: Quá hạn chấm, Test tuần này, hàng lớp thường | giữ nguyên | b8-test-* | GIỮ |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Bấm "n/m bài đã chấm" → mở nhóm Test tuần này | Như cũ + mở luôn các hàng còn bài |
| Bấm "n bài còn chấm" → mở nhóm + các hàng còn bài | Gộp vào ô đã chấm (ô bỏ) |
| Bấm "n bài quá hạn" → danh sách quá hạn | Như cũ |
| Cột MT (chữ, không bấm) | Bỏ; chip "MTn ›" cạnh tên vẫn là link lượt |
| Ô điểm, Enter / Tab, GV chấm S, Mở lưới đầy đủ | Như cũ |

## Dòng đọc Turso

Không đổi đường API, không thêm request: 0 → 0 dòng thêm mỗi lần mở trang.
