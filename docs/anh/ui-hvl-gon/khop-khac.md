# UI-HVL-GON — Học viên & Lớp gọn theo luật mật độ M1–M10 (`de-xuat.md` mục 1, hạng 9 mục 3)

PTA Plan 05/11: màn ⑨ **Học viên & Lớp** (danh sách). Bệnh: số HV, tên GVCN, "MT n/m" đậm cạnh mã lớp / tên em; số SOS gạch chân; "Không SOS" ở mọi lớp
không SOS; "Xuất Excel · 51 HV" và "51 HV · 6 lớp" lặp số tab; phân trang Đang SOS ở cả trên và dưới. **Giữ bố cục U04 + mọi thao tác**; dáng đồng bộ
Tổng quan (#937), Hồ sơ lớp (#941), Phân tích (#948). Không đổi máy chủ, không thêm request.

Dữ liệu demo 14/09/2026. QL Nguyễn Khánh Vy (vai 2), GVCN Trần Ngọc Hà (vai 7), GVBM Phạm Thu Trang (vai 9), TVV Nguyễn Thu Hương (vai 23).
Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh. Ghi chú vắng / dời MT: không có ở màn này (chỉ ở Test) — không đổi.

## Ảnh trước | sau (toàn trang)

| Màn | Ảnh |
|---|---|
| Fast Track · QL · 1440 tối | `truoc-sau-ft-ql-1440-toi.png` |
| Fast Track · GVCN / GVBM · 1440 tối | `truoc-sau-ft-gvcn-1440-toi.png` · `truoc-sau-ft-gvbm-1440-toi.png` |
| TVV · 1440 tối | `truoc-sau-tvv-1440-toi.png` |
| Lớp thường · QL · 1440 tối | `truoc-sau-thuong-ql-1440-toi.png` |
| Mở tất cả (danh sách em dưới hàng lớp) · 1440 tối / 375 sáng | `truoc-sau-mo-tat-ca-1440-toi.png` · `truoc-sau-mo-tat-ca-375-sang.png` |
| Đang SOS · 1440 tối | `truoc-sau-dang-sos-1440-toi.png` |
| 375 sáng: FT QL · FT GVCN · Lớp thường | `truoc-sau-ft-ql-375-sang.png` · `truoc-sau-ft-gvcn-375-sang.png` · `truoc-sau-thuong-ql-375-sang.png` |

## Đo trước → sau (màn đầu 1440 × 900 / 375 × 812; cách đo như `de-xuat.md` mục 3)

| Màn | Từ màn đầu (cả trang) | Đậm màn đầu | Nút / ô | Gạch chân liền | Cao trang |
|---|---|---|---|---|---|
| FT · QL 1440 | 169 → **154** | 54 % → **34 %** | 47 → 47 | 7 → **0** | = |
| FT · GVCN 1440 | 97 → **88** | 58 % → **41 %** | 24 → 24 | 4 → **0** | = |
| FT · GVBM 1440 | 143 → **128** | 53 % → **32 %** | 35 → 35 | 5 → **0** | = |
| TVV 1440 | 73 → **62** | 41 % → **34 %** | 14 → 14 | 0 | = |
| Lớp thường · QL 1440 | 252 → **243** | 57 % → **39 %** | 71 → 71 | 0 | = |
| Mở tất cả 1440 | 354 (1 636) → **345 (1 621)** | 40 % → **31 %** | 51 → 51 | 7 → **0** | = |
| Đang SOS 1440 | 475 → **457** | 44 % → 45 % | 60 → **53** ¹ | 0 | 841 → **803** |
| FT · QL 375 | 108 (139) → 109 (**128**) | 56 % → **35 %** | 36 → 39 ² | 7 → **0** | 965 → **912** |
| FT · GVCN 375 | 67 → **62** | 61 % → **42 %** | 21 → 21 | 4 → **0** | = |
| Lớp thường 375 | 106 (223) → **101 (218)** | 64 % → **47 %** | 32 → 32 | 0 | = |
| Mở tất cả 375 | 109 (1 264) → **104 (1 253)** | 55 % → **44 %** | 26 → 26 | 7 → **0** | 8 161 → **8 108** |

- ¹ Bỏ thanh phân trang trên (7 nút) — còn thanh dưới. ² Hàng lớp không còn dòng "Không SOS" → thêm lớp lọt vào màn đầu (thêm ⋯ / ▸ của lớp), không thêm nút mới.

## Chỗ ngợp → luật → cách sửa

| # | Chỗ ngợp (trước) | Luật | Sửa | Thành phần |
|---|---|---|---|---|
| H1 | Số SOS hàng lớp ("SOS 1 **4** HV") 700 gạch chân | M10, M1 | `.so-gon` trên trang; luật chung thêm ô `.o-so` (gạch riêng, không qua `.underline`): gạch khi rê / focus, chữ 500 | `StudentsPage`, `index.css` |
| H2 | "**33** HV" số 600 | M1 | 500 (đậm chỉ mã lớp) | `DauLop` |
| H3 | "GVCN **Trần Ngọc Hà**" 600 (1440 và "· **T. N. Hà**" 375) | M1, M10 | Tên người 400 (link hồ sơ GV giữ) | `DauLop` |
| H4 | "Không SOS" ở mọi lớp không có em SOS (375: một hàng riêng) | M4 | Ô trống — vắng chip SOS đã nói đủ | `OSosLop` |
| H5 | "Xuất Excel · 51 HV" (lặp tab "Tất cả 51") | M3 | "Xuất Excel" (cả mục ⋯ ở 375) | `StudentsPage` |
| H6 | "**51** HV · **6** lớp" cuối thanh lọc | M3 | Bỏ: chưa lọc = số tab Tất cả / ô Fast Track; đang lọc = dòng "Đang lọc … — n HV ở m lớp" ngay dưới. Giữ "Mở tất cả / Thu gọn tất cả" | `StudentsPage` |
| H7 | Danh sách em: "**MT 2/3**" 600 cạnh tên em 600 | M1 | 500 (đậm chỉ tên em) | `DanhSachHvLop` |
| H8 | Đang SOS: phân trang trên + dưới | M3 | Chỉ dưới (như Tất cả, B-04); neo đầu bảng giữ | `StudentsPage` |

**Không sửa (ghi lại):**
- [XM-1] Danh sách em dưới hàng lớp: "TVV Phan Mai / Lê Thu" dưới gần mọi tên em (M3). Hồ sơ lớp (#941) đưa TVV chính lên hàng GV đầu trang — ở đây cần thêm ô TVV ở hàng lớp (đổi cột hàng lớp U04) → để PTA quyết.
- Chip lọc "Thi tháng này 0", "Có việc quá hạn 0" giữ số 0 (mờ) — chip lọc cần biết bấm có ra gì không.
- Lớp thường: cột SOS trống ở mọi lớp (lớp thường không có SOS, D8) — giữ chỗ cột cho thẳng hàng với FT (bố cục U04).
- Đang SOS: rỗng "Không có học viên SOS" dùng `Empty` chung (căn giữa) — M7 cần đổi `Empty` toàn web → PR riêng.

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Fast Track / Lớp thường · tab Tất cả / Đang SOS / Lịch thi / Phân công GV | có | có |
| Xuất Excel (mở ngăn xuất, đúng tập đang lọc) · + Thêm học viên · ⋯ trang | có | có (nhãn "Xuất Excel"; số em xem trong ngăn xuất) |
| Tìm · chip lọc · Bộ lọc thêm · Bỏ lọc · Mở tất cả / Thu gọn tất cả | có | có |
| Hàng lớp: ▸ mở · mã lớp → hồ sơ lớp · GVCN → hồ sơ GV · số SOS → Đang SOS đúng mức · chip "n chờ duyệt ›" / "n bài chờ chấm ›" · ⋯ lớp | có | có |
| Danh sách em: tên → hồ sơ · ô MT mở dải · ⋯ dòng | có | có |
| Đang SOS: lọc mức · PA quá hạn · lật trang · bấm dòng → panel một em | có | có (lật trang ở thanh dưới) |

## Turso
Không đổi máy chủ, không đổi `useApi` nào — trước = sau (cùng `/hoc-vien-lop` gộp + `/my-work`, `/sos` như cũ).
