# UI-HSL-GON — Hồ sơ lớp gọn theo luật mật độ M1–M10 (`de-xuat.md` mục 1, hạng 4 mục 3)

PTA Plan 05/11 sau khi merge #939: màn tiếp là **Hồ sơ lớp** (FT và lớp thường; tab Học viên · Ý thức & Phối hợp · Phân tích lớp). Bệnh: đầu trang 4 viên + 2 hàng
thông tin + viên "10 chờ duyệt ›", "59 bài chờ chấm ›", "+1"; "TVV Lê Thu" lặp gần mọi dòng em. **Giữ bố cục U03 + mọi thao tác**; dáng đồng bộ v12 / #937 / #939;
bỏ gạch chân số như Tổng quan. Không đổi máy chủ, không thêm request.

Dữ liệu demo 14/09/2026: MB FT 101 (id 3, 33 HV, hai TVV: Phan Mai 17 em · Lê Thu 15 em · 1 em chưa có TVV), MB FOU 12 (id 6, lớp thường). QL Nguyễn Khánh Vy (vai 2), GVCN cô Hà (vai 7).
Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh.

## Ảnh trước | sau (toàn trang)

| Màn | Ảnh |
|---|---|
| FT · Học viên · QL · 1440 tối | `truoc-sau-ft-hv-1440-toi.png` |
| FT · Ý thức & Phối hợp · 1440 tối | `truoc-sau-ft-yt-1440-toi.png` |
| FT · Phân tích lớp · 1440 tối | `truoc-sau-ft-pt-1440-toi.png` |
| Lớp thường · Học viên · 1440 tối | `truoc-sau-th-hv-1440-toi.png` |
| Lớp thường · Phân tích lớp · 1440 tối | `truoc-sau-th-pt-1440-toi.png` |
| FT · Học viên · 375 sáng | `truoc-sau-ft-hv-375-sang.png` |
| Lớp thường · Học viên · 375 sáng | `truoc-sau-th-hv-375-sang.png` |
| FT · Học viên · GVCN · 1440 tối | `truoc-sau-gv-ft-hv-1440-toi.png` |

## Đo trước → sau (màn đầu 1440 × 900 / 375 × 812; cách đo như `de-xuat.md` mục 3)

| Màn | Từ màn đầu (cả trang) | Đậm màn đầu (số phần tử) | Nút / ô | Gạch chân liền (cả trang) | Cao trang |
|---|---|---|---|---|---|
| FT Học viên 1440 · QL | 285 (791) → 282 (**740**) | 51 % (107) → **49 % (102)** | 58 → 58 | — ¹ | 2 428 → **2 325** |
| FT Học viên 1440 · GVCN | 301 (832) → 301 (**781**) | 56 % (114) → 53 % (110) | 57 → 58 ² | — ¹ | 2 472 → **2 369** |
| FT Ý thức 1440 | 376 (627) → **362 (596)** | 51 % (77) → **47 % (71)** | 33 → 33 | 2 → 0 | 1 511 → 1 511 |
| FT Phân tích 1440 | 141 → 141 | 44 % (41) → **38 % (36)** | 23 → 23 | 3 → **0** | 900 → 900 |
| Thường Học viên 1440 | 261 (271) → 271 (271) ³ | 49 % (99) → 47 % (96) | 31 → 32 ² | — ¹ | 982 → 951 |
| Thường Phân tích 1440 | 160 → 160 | 66 % (53) → **59 % (48)** | 19 → 19 | 0 → 0 | 900 → 900 |
| FT Học viên 375 | 113 (958) → 110 (**907**) | 64 % (47) → **58 % (42)** | 27 → 27 | — ¹ | 6 463 → 6 463 |
| Thường Học viên 375 | 102 (365) → 102 (365) | 56 % (31) → **47 % (26)** | 20 → 20 | — | 2 237 → 2 237 |

- ¹ Gạch còn lại là gạch CHẤM gợi ý (KCK, "Thiếu 1") — giữ có chủ ý; số bấm được (Phân tích lớp "7/9", "14/19") không còn gạch liền.
- ² +1: ô "TVV" ở hàng GV (link "+k" ở 375 tính cả TVV).
- ³ Lớp thường: bảng ngắn hơn (bỏ "Chưa có điểm" xuống dòng) → màn đầu chứa thêm hàng.
- MB FT 101 bỏ 17 dòng "TVV Phan Mai" (TVV chính) ở bảng em; 15 dòng "TVV Lê Thu" (khác TVV chính) giữ.

## Chỗ ngợp → luật → cách sửa

| # | Chỗ ngợp (trước) | Luật | Sửa | Thành phần |
|---|---|---|---|---|
| L1 | 4 viên đầu trang chữ 600 + số trong viên 700 ("**33** HV", "tuần **16**") | M1 | Viên chữ 500 mờ, số không đậm | `DauTrangLop` meta |
| L2 | Viên "khai giảng 01/06" | M4 | Không thành viên — rê chuột viên "tuần n" (`title`); lớp không đếm tuần (đã kết thúc) vẫn hiện viên khai giảng | `DauTrangLop` |
| L3 | "TVV Phan Mai / Lê Thu" dưới gần mọi tên em (bảng Học viên + Ý thức) | M3 | TVV CHÍNH (giữ nhiều em nhất — `tvvChinhCuaLop`) ghi MỘT lần ở hàng GV đầu trang ("TVV Phan Mai"); dòng em chỉ ghi TVV KHÁC TVV chính | `DauTrangLop`, `BangHoSoLop`, `ClassYThucCard`, `shared/domain/hocVienLop.ts` |
| L4 | Số bấm được gạch chân (Phân tích lớp "7/9"…) | M10, M1 | Như Tổng quan (#937): gạch khi rê / focus; số trong bảng 500 (quá hạn đỏ vẫn đậm); gạch chấm gợi ý giữ | `index.css` `:is(.tq-v8, .so-gon)` + `ClassOverviewPage` |
| L5 | Ý thức: đầu nhóm "Bắt buộc xử lý **4 HV · 9 vi phạm** 3 vi phạm trong tuần này + tuần trước — phải xử lý ⓘ" (câu luật lặp ⓘ); "chưa cần xử lý — xem trước hạn", "GVCN đề xuất hoặc xin thu hồi", "việc của TVV" | M4, M1 | Câu luật nhóm → `title` tên nhóm (nhóm có ⓘ giữ ⓘ); số đếm nhóm chữ thường (đậm chỉ tên nhóm) | `ClassYThucCard` `NhomHang` |
| L6 | Chip "Dự kiến01/2027", "Thi15/09" dính chữ (khoảng trắng bị nuốt trong `inline-flex`) | M2 | `gap-1` trong chip | `BangHoSoLop` `OLichThi` |
| L7 | Lớp thường: "Chưa có điểm" xuống 2 dòng trong ô điểm | M2 | `whitespace-nowrap` | `BangDiemLopThuong` |
| GIỮ | Bố cục U03: ‹ nguồn · trước / sau · mã lớp · Nhập điểm · + Case · ⋯ · hàng GV · hàng số (Lượt mới nhất · Đạt ⓘ · SOS) · viên việc "n chờ duyệt ›" / "n bài chờ chấm ›" / "+n" (badge V4 — cùng dáng hộp lớp ở Học viên & Lớp) · dải Chốt lộ trình · Việc của tôi · tab · chip lọc · Chọn nhiều · ⋯ dòng · mở dưới hàng · Điểm Mock Test của lớp | — | không đổi | — |

**Không sửa (ghi lại):**
- Viên việc "10 chờ duyệt ›" / "59 bài chờ chấm ›" / "+1": badge tiến độ V4, cùng dáng hộp lớp ở Học viên & Lớp (đổi riêng ở đây sẽ lệch M10 giữa hai màn) — giữ.
- Cột "Lộ trình tiếp theo" lớp thường "Chưa chốt" ở mọi dòng (M3) — dữ liệu từng em, đổi khi em được chốt; giữ.
- Bảng Ý thức (cột Bậc "Đã tới / Lần này", chip trạng thái + hạn) — mockup U10 vừa duyệt (#902); chỉ sửa đầu nhóm + TVV.

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Nhập điểm · + Case · ⋯ (Thông tin lớp, Sửa thông tin HV, + Học viên, Lộ trình, Xuất Excel, Lịch sử, Kết thúc / Mở lại / Xoá) | có | có |
| ‹ nguồn · Lớp trước / sau | có | có |
| Tên GV → hồ sơ GV · "+k" (đủ danh sách GV) | có | có (+ ô TVV chính; TVV không phải link — như trước ở dòng em) |
| Bấm số Đạt ⓘ · viên việc "n chờ duyệt ›" "n bài chờ chấm ›" "+n" | có | có |
| Tab · chip lọc (Tất cả / SOS / Chưa đủ dữ liệu; lớp thường Chưa đạt / Có Case) · Chọn nhiều · Tổng hợp / Kết quả đầu ra | có | có |
| Bấm tên em → mở dưới hàng · ô điểm → kỹ năng · ⋯ dòng (+ Case, Ghi vi phạm, Xác nhận xử lý…) · MT → hồ sơ em | có | có |
| Ý thức: Xác nhận xử lý · Đề xuất QL duyệt · Đã xem · Duyệt / Từ chối · Chi tiết · + Ghi vi phạm · Khai / sửa cấp bậc · Chọn nhiều · ⓘ luật | có | có (câu luật nhóm khi rê tên nhóm) |
| Phân tích lớp: bấm "7/9" → panel đúng tập | có (gạch chân) | có (màu nhấn, gạch khi rê) |
| Xem TVV của một em | dưới tên mọi em | em của TVV chính: ô TVV đầu trang; em TVV khác: dưới tên (như trước); hồ sơ em vẫn ghi TVV |

## Dòng đọc Turso (dev, `PISA_DEM_SQL=1`, dữ liệu demo — trước = sau, chỉ đổi giao diện)

TVV chính tính trên `roster` đã nạp (đầu trang `useTomTatLop`, bảng `BangHoSoLop`, Ý thức `ClassYThucCard` — cùng một GET `/classes/:id/roster` gộp ở `useApi`); không thêm request.

| Đường (MB FT 101) | Câu · dòng |
|---|---|
| `/classes/3/overview` | 34 · 708 |
| `/classes/3/roster` | 22 · 1 485 |
| `/classes/3/diem-theo-luot` | 14 · 862 |
| `/classes/3/viec-theo-em?chi=toi` | 34 · 760 (QL) / 45 · 999 (GV) |

## Mã chạm

`web/src/modules/classes/DauTrangLop.tsx` · `BangHoSoLop.tsx` · `BangDiemLopThuong.tsx` · `ClassOverviewPage.tsx` (lớp `so-gon`) · `web/src/modules/yThuc/ClassYThucCard.tsx` ·
`web/src/index.css` · `shared/domain/hocVienLop.ts` (`tvvChinhCuaLop`) · `shared/i18n/en/c.ts` · phép kiểm `prBangEmGon` B1 (TVV dưới tên → TVV ngoại lệ + ô TVV đầu trang + kiểm `tvvChinhCuaLop`).
