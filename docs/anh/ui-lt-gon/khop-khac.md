# UI-LT-GON — Test · Lịch Test tuần gọn theo luật mật độ M1–M10 (`de-xuat.md` mục 1, hạng 5 mục 3)

PTA Plan 05/11 sau khi merge #941: màn tiếp là **Test · Lịch Test tuần**. Bệnh: "Chờ L, R, W, S" lặp ở mọi dòng, dải lớp nhiều chữ ("vắng · chờ Quản lý duyệt dời").
**Giữ bố cục U06 + mọi thao tác** (nhập điểm, "-", hộp nhập, lọc tuần / khung, Xuất Excel, Lịch thi thật, mở lưới dưới dòng…). Đây là màn Test nên **GIỮ ghi chú vắng / dời**
(chủ SP 05/11: các ghi chú đó chỉ ở Test) — chỉ làm gọn cách hiện. Không đổi máy chủ, không thêm request.

Dữ liệu demo 14/09/2026 (tuần W3 SEP). QL Nguyễn Khánh Vy (vai 2), GV cô Trần Ngọc Hà (vai 7). Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh.

## Ảnh trước | sau (toàn trang)

| Màn | Ảnh |
|---|---|
| QL · 1440 tối (mặc định: MB FT 101 mở) | `truoc-sau-ql-1440-toi.png` |
| QL · 1440 tối · mở "Quá hạn chấm" + MB FT 102 (dòng "Chờ L, R, W, S") | `truoc-sau-ql-qh-1440-toi.png` |
| GV · 1440 tối | `truoc-sau-gv-1440-toi.png` |
| GV · 375 sáng | `truoc-sau-gv-375-sang.png` |
| QL · 375 sáng | `truoc-sau-ql-375-sang.png` |

## Đo trước → sau (màn đầu 1440 × 900 / 375 × 812; cách đo như `de-xuat.md` mục 3)

| Màn | Từ màn đầu (cả trang) | Đậm màn đầu (số phần tử) | Đậm cả trang | Nút / ô | Cao trang |
|---|---|---|---|---|---|
| QL 1440 | 239 (361) → 236 (358) | 52 % (74) → **49 % (69)** | 59 % → **41 %** | 49 → 49 | 1 257 → 1 257 |
| QL 1440 · Quá hạn mở | 340 (655) → 335 (**619**) | 61 % (127) → **45 % (94)** | 59 % → **45 %** | 46 → 46 | 1 883 → **1 844** |
| GV 1440 | 249 (348) → 246 (345) | 53 % (75) → **50 % (70)** | 58 % → **43 %** | 37 → 37 | 1 158 → 1 158 |
| GV 375 | 88 (297) → 88 (297) | 52 % (25) → 50 % (24) | 49 % → 45 % | 20 → 20 | 2 018 → 2 018 |
| QL 375 | 91 (302) → 91 (302) | 50 % (24) → 48 % (23) | 57 % → 52 % | 20 → 20 | 2 143 → 2 143 |

- Khối "Quá hạn chấm" (7 dòng): 3 dòng trước xuống 2 hàng chỉ vì kỹ năng ("S" một mình) → 1 hàng; 3 dòng đợt dài vẫn 2 hàng nhưng xuống ở dấu "·" (không bẻ "W2 AUG"); bỏ 7 viên "Chờ chấm" giống nhau (QL).

## Chỗ ngợp → luật → cách sửa

| # | Chỗ ngợp (trước) | Luật | Sửa | Thành phần |
|---|---|---|---|---|
| T1 | Cột Kết quả "Chờ L, R, W, S" / "Chờ W2, S" ở mọi dòng chưa đủ điểm — lặp đúng các ô trống bên trái | M3 | Kết quả chưa có → "–" mờ, tên môn còn thiếu ở `title`; thẻ 375 không vẽ (trình đọc màn vẫn đọc). "Chưa xếp lịch", SOS tạm, ✓ Đạt… giữ | `LuoiFT` (dùng chung mọi lưới chấm FT — cùng luật) |
| T2 | Hàng lớp: "vắng · chờ Quản lý duyệt dời" | M4, M5 | "chờ duyệt dời" (số bài khi > 1) — câu đủ ở `title` (ghi chú vẫn ở màn Test) | `HangLop` `LuotLop` |
| T3 | Hàng lớp: chữ kỹ năng "L R W S" 600 + số "**8**/27 bài" 700 → 3 chữ đậm mỗi hàng | M1 | Kỹ năng 500 (môn của bạn vẫn màu nhấn + gạch dưới), số đã chấm chữ sáng 500 — đậm chỉ mã lớp | `HangLop` |
| T4 | Quá hạn chấm: "L, R, W1, W2, S" xuống 2 hàng ("S" một mình); đợt "MT2 · W2 / AUG" bẻ giữa mã tuần | M2, M10 | Kỹ năng viết như hàng lớp "L R W1 W2 S" — một hàng (đủ ở `title`); đợt xuống dòng ở ranh "·" (không bẻ "W2 AUG") | `KhoiNo` |
| T5 | Quá hạn chấm: hạn "hạn 08/07 ⚠ quá hạn 68 ngày" (chữ dài, 2 màu) | M10 | Viên theo mức "⚠ quá hạn 68 ngày" (`ChipHan vien`, rê chuột thấy ngày hạn) — như dòng Công việc; phần của người xem chưa quá hạn → chữ hạn trung tính như cũ | `KhoiNo` |
| T6 | Quá hạn chấm: "● Chờ chấm" ở mọi dòng (QL) — tên khối đã nói | M3 | Không vẽ "Chờ chấm" chung; "Chờ bạn chấm", "Chờ GV khác", "{kn} của bạn: còn n", "Đã chấm ✓", "n ô chưa lưu" giữ | `KhoiNo` `NhanDong` |
| T7 | "**GV chấm chéo**" đậm trong danh sách GV | M1 | Chữ thường mờ (không đậm) | `KhoiNo` `GvCham` |
| GIỮ | Bố cục U06: chọn tuần ‹ › · Tuần này · Tất cả / FT / Lớp thường · Xuất Excel · Lịch thi thật › · dải số (đã chấm / còn chấm / quá hạn) · nhóm Quá hạn chấm / Test tuần này · hàng lớp (mã · đợt · kỹ năng · x/y bài · hạn · trạng thái) · lưới chấm dưới hàng (ô điểm, "n câu", "vắng W2 SEP", "Vắng", "W4 SEP" dời, S Ex) · GV chấm S ▾ · MT cũ chưa nhập › · thẻ 375 | — | không đổi — ghi chú vắng / dời giữ (màn Test) | — |

**Không sửa (ghi lại):** thẻ 375 — tên em dài + "MT3 · kỳ vọng 6.5" đẩy chip SOS xuống hàng dưới (DO-KHUNG-DO: "thiếu chỗ thì chip xuống dòng, không cắt tên") — giữ.

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| ‹ › tuần · Tuần này · chọn tuần · Tất cả / Fast Track / Lớp thường · Lọc (375) · Xuất Excel · Lịch thi thật › | có | có |
| Mở / thu nhóm Quá hạn chấm · Test tuần này · mở hàng lớp → lưới | có | có |
| Quá hạn chấm: Nhập điểm / Xem / Thu (lưới dưới dòng, chỉ em còn nợ) · mã lớp → hồ sơ lớp | có | có |
| Lưới: gõ điểm, "-" vắng, hộp nhập (W / S, nhận xét), Lưu · bài tiếp, Lớp tiếp ›, S Ex, GV chấm S ▾, Xem dạng bảng (375) | có | có |
| Xem môn còn thiếu của em | chữ "Chờ L, R" ở Kết quả | ô trống ở lưới (như trước) + rê chuột "–" ở Kết quả |
| Xem bài chờ duyệt dời của lớp | "vắng · chờ Quản lý duyệt dời" | "chờ duyệt dời" + rê chuột câu đủ |
| Xem ngày hạn quá hạn | chữ "hạn 08/07" | rê chuột viên "⚠ quá hạn 68 ngày" |
| MT cũ chưa nhập › | có | có |

## Dòng đọc Turso (dev, `PISA_DEM_SQL=1`, dữ liệu demo — trước = sau, chỉ đổi giao diện)

| Đường | Câu · dòng |
|---|---|
| `/cham/lich-test?…` | 16 · 488 |
| `/cham/lich-test/qua-han?…` | 7 · 298 |
| `/classes/3/cham?periodId=42` (lưới MB FT 101) | 12 · 65 |

## Mã chạm

`web/src/modules/test/lichTest/KhoiNo.tsx` · `HangLop.tsx` · `web/src/modules/cham/LuoiFT.tsx` (Kết quả chưa có) · `shared/i18n/en/b.ts`.
