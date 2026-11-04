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
| Hồ sơ HV Hồ Ngọc Diệp (vắng W2 SEP) · 1440 tối / 375 sáng | `truoc-sau-hshv-1440-toi.png` · `truoc-sau-hshv-375-sang.png` |
| Học viên & Lớp · MB FT 101 mở, dải dưới hàng mở · 1440 tối / 375 sáng (không đổi — bằng chứng) | `hvl-1440-toi.png` · `hvl-375-sang.png` |

Ảnh hồ sơ lớp "sau" đã gồm phần bỏ ghi chú vắng (mục L8–L11).

## Đo trước → sau (màn đầu 1440 × 900 / 375 × 812; cách đo như `de-xuat.md` mục 3)

| Màn | Từ màn đầu (cả trang) | Đậm màn đầu (số phần tử) | Nút / ô | Gạch chân liền (cả trang) | Cao trang |
|---|---|---|---|---|---|
| FT Học viên 1440 · QL | 285 (791) → 270 (**725**) | 51 % (107) → **50 % (102)** | 58 → 58 | — ¹ | 2 428 → **2 308** |
| FT Học viên 1440 · GVCN | 301 (832) → 289 (**766**) | 56 % (114) → 54 % (110) | 57 → 58 ² | — ¹ | 2 472 → **2 352** |
| FT Ý thức 1440 | 376 (627) → **362 (596)** | 51 % (77) → **47 % (71)** | 33 → 33 | 2 → 0 | 1 511 → 1 511 |
| FT Phân tích 1440 | 141 → 141 | 44 % (41) → **38 % (36)** | 23 → 23 | 3 → **0** | 900 → 900 |
| Thường Học viên 1440 | 261 (271) → **217 (217)** | 49 % (99) → 47 % (96) | 31 → 32 ² | — ¹ | 982 → 951 |
| Thường Phân tích 1440 | 160 → 160 | 66 % (53) → **59 % (48)** | 19 → 19 | 0 → 0 | 900 → 900 |
| FT Học viên 375 | 113 (958) → 110 (**892**) | 64 % (47) → **58 % (42)** | 27 → 27 | — ¹ | 6 463 → **6 403** |
| Thường Học viên 375 | 102 (365) → 102 (**311**) | 56 % (31) → **47 % (26)** | 20 → 20 | — | 2 237 → **2 125** |
| Hồ sơ HV 1440 (em có vắng) | 175 (180) → **166 (171)** | 46 % → **42 %** | 16 → 16 | 0 | 994 → 994 |
| Hồ sơ HV 375 | 101 (151) → **98 (144)** | 46 % → 47 % | 15 → 15 | 0 | 1 479 → 1 479 |

- ¹ Gạch còn lại là gạch CHẤM gợi ý (KCK, "Thiếu 1") — giữ có chủ ý; số bấm được (Phân tích lớp "7/9", "14/19") không còn gạch liền.
- ² +1: ô "TVV" ở hàng GV (link "+k" ở 375 tính cả TVV).
- ³ Lớp thường: ô chưa điểm chỉ "–" (bỏ "W3 SEP", "Chưa có điểm" 2 dòng) → bảng ngắn hơn.
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
| L7 | Lớp thường: "Chưa có điểm" xuống 2 dòng trong ô điểm | M2 | thay bằng L9 (ô chỉ "–") | `BangDiemLopThuong` |
| L8 | **Chủ SP 05/11:** "ở trang Hồ sơ lớp / HV và trang lớp HV thì không nên để ghi chú vắng MT hay gì cả… chỉ nên ở phần Test". Hồ sơ lớp FT: "vắng W2 SEP" dưới ô L R W S | chủ SP | Ô điểm chỉ ✓ / ✗ hoặc "–"; bỏ hẳn dòng phụ dưới ô (hàng 48 px) | `BangHoSoLop` |
| L9 | Hồ sơ lớp lớp thường: ô chưa điểm ghi tuần Test ("W3 SEP") hoặc "Chưa có điểm" | chủ SP | Ô chỉ "–" | `BangDiemLopThuong` `ODiemThuong` |
| L10 | Hồ sơ HV: thẻ kỹ năng "vắng W2 SEP" dưới điểm; bảng Mock Test chip "dời L R W S" / "huỷ phần" cạnh MT; ô gộp "Chưa tới tuần"; Hành trình kỹ năng: chữ "dời S · vắng W2 SEP" ở điểm vắng | chủ SP | Thẻ: "chưa có điểm" (như kỹ năng chưa điểm khác) hoặc "MT1 · kỳ vọng 5.5" khi có điểm · bảng: bỏ chip dời / huỷ phần (giữ "đã huỷ" — trạng thái cả lượt), lượt chưa tới tuần → "—" từng ô (cột Tuần đã ghi tuần) · Hành trình: chữ "chưa có điểm" (dấu vắng trên biểu đồ giữ hình riêng) | `HanhTrinhKyNang`, `StudentDetailPage` |
| L11 | Học viên & Lớp: dải 5 ô mở dưới hàng, thẻ 375 | chủ SP | Đã không có ghi chú vắng (ô chưa điểm "–") — không đổi; ảnh làm bằng chứng | — |
| GIỮ (Test) | Lịch Test, Kế hoạch Test, Điểm theo lớp / hộp nhập điểm (`HopNhapDiem`), hồ sơ MT (`ODiemLon`), Xếp lịch MT (`HangLichMt`, `OMt`) | — | không đổi — hai bảng hồ sơ lớp và thẻ / bảng hồ sơ HV không dùng chung component với Test nên không cần cờ | — |
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
| Xem ghi chú vắng / dời / chưa tới tuần của một kỹ năng | dưới ô điểm ở hồ sơ lớp, hồ sơ HV | màn Test (Lịch Test, Kế hoạch Test, hồ sơ MT, Điểm theo lớp) — chủ SP 05/11 |
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
`web/src/index.css` · `shared/domain/hocVienLop.ts` (`tvvChinhCuaLop`) · `shared/i18n/en/c.ts` · `web/src/modules/students/HanhTrinhKyNang.tsx` · `StudentDetailPage.tsx` ·
phép kiểm `prBangEmGon` B1 (TVV dưới tên → TVV ngoại lệ + ô TVV đầu trang + kiểm `tvvChinhCuaLop`) · `prHsm` (6) (hồ sơ HV không nhãn dời / huỷ phần, không "Chưa tới tuần"; Hành trình + hai bảng hồ sơ lớp không ghi chú vắng).
