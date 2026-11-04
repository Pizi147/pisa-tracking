# UI-TQ-GON — Tổng quan gọn theo luật mật độ M1–M10 (`docs/superpowers/specs/2026-11-05-mat-do-thong-tin/de-xuat.md` mục 1, hạng 2 mục 3)

Chủ SP 05/11 "Làm màn tiếp" sau khi duyệt Công việc v12 (#934). **Giữ bố cục** mockup đã duyệt `thiet-ke/v11/tong-quan.html` (U09 #889): cùng ô chỉ số, bảng,
cột phải Chờ bạn duyệt / Điều hướng, thứ tự, màu, nút, panel. Chỉ sửa chữ, độ đậm, chữ thừa, lặp. Không đổi máy chủ, không thêm request.

Dữ liệu demo 14/09/2026. Vai: QL Nguyễn Khánh Vy (2) · GV cô Trần Ngọc Hà (7) · TVV (23) · CX (24) · QT (1, phiên EN). Phông đã kiểm trên dev server worktree
(`npm ci` riêng): `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh.

## Ảnh trước | sau (toàn trang)

| Vai · khung | Ảnh |
|---|---|
| QL · 1440 tối | `truoc-sau-ql-1440-toi.png` |
| GV · 1440 tối | `truoc-sau-gv-1440-toi.png` |
| GV · 375 sáng | `truoc-sau-gv-375-sang.png` |
| QL · 375 sáng (thêm) | `truoc-sau-ql-375-sang.png` |
| TVV · CX · QT 1440 tối (thêm) | `truoc-sau-tvv-1440-toi.png` · `truoc-sau-cx-1440-toi.png` · `truoc-sau-qt-1440-toi.png` |

## Đo trước → sau (màn đầu = 1440 × 900 / 375 × 812; cách đo như `de-xuat.md` mục 3)

- **Từ:** số từ trong vùng nội dung `.page` ở màn đầu (cả trang trong ngoặc).
- **Đậm:** % phần tử chữ có độ đậm ≥ 600 ở màn đầu (số phần tử đậm / số phần tử chữ).
- **Nút / ô:** button + ô nhập ở màn đầu. **Gạch chân:** số chữ gạch chân lúc không rê (cả trang).

| Vai · khung | Từ | Đậm | Nút / ô | Gạch chân | Cao trang |
|---|---|---|---|---|---|
| QL · 1440 | 326 (410) → **261 (311)** | 50 % (65/131) → **42 % (51/122)** | 32 → 33 (+ ⓘ Thi tháng này) | 25 → **1** | 1 261 → 1 238 |
| GV · 1440 | 226 (367) → **206 (330)** | 54 % (54/100) → **46 % (46/100)** | 19 → 19 | 35 → **0** | 1 674 → 1 651 |
| GV · 375 | 87 (505) → **79 (438)** | 39 % (13/33) → 54 % (20/37) ¹ | 6 → 9 ¹ | 35 → **0** | 4 178 → **3 683** |
| QL · 375 | 109 (519) → **98 (411)** | 39 % (15/38) → 41 % (16/39) | 10 → 13 ¹ | 25 → **1** | 3 694 → **3 374** |
| TVV · 1440 | 124 → **70** | 36 % (14/39) → 45 % (14/31) ² | 3 → 4 | 2 → 0 | 900 → 900 |
| CX · 1440 | 153 → **123** | 45 % (34/75) → **42 % (28/67)** | 11 → 11 | 8 → 0 | 900 → 900 |
| QT · 1440 (EN) | 150 → **127** | 49 % (41/84) → **36 % (28/77)** | 20 → 21 | 15 → 0 | 900 → 900 |

¹ 375: dải "Mới dùng" còn một hàng và ô chỉ số ngắn lại → màn đầu chứa thêm Chờ bạn duyệt / Điều hướng (thêm nút, thêm tên đậm). Cả trang GV 375 ngắn đi 495 px.
² TVV: số phần tử đậm giữ 14, chỉ bớt chữ thường (dòng phụ, câu đích Điều hướng) nên tỉ lệ tăng.
Gạch chân còn 1 (QL): "38 chưa PA" nằm giữa câu ở dòng phụ ô Case có PA — giữ gạch chân có chủ ý (WCAG 1.4.1, xem TQ8).

## Chỗ ngợp → luật → cách sửa

| # | Chỗ ngợp (trước) | Luật | Sửa | Thành phần |
|---|---|---|---|---|
| TQ1 | Mỗi ô chỉ số 2–3 dòng phụ: mẫu số + "trong kỳ" / "hiện tại" / "W4 AUG – W3 SEP" | M3, M4 | Một dòng phụ. Kỳ xem → `title` của tên ô; kỳ số liệu ghi MỘT lần ở đầu trang (QL đã có — L6; GV, TVV thêm "· kỳ W4 AUG – W3 SEP") | `ChiSo`, `OverviewPage` (`kyGv`, `kyTvv` — cùng GET khối dưới, `useApi` gộp) |
| TQ2 | Dòng phụ là câu giải thích: "HV có ngày thi đã chốt", "Case tôi phụ trách", "không việc nào quá hạn", "HV chờ KQ · chưa chốt bước tiếp", TVV "0 chờ KQ · 1 chưa chốt bước tiếp" (lặp hai số vừa hiện), "chưa việc nào phát sinh trong kỳ" (lặp "Chưa có dữ liệu") | M4, M3, V13 | Dòng phụ = đơn vị: "HV" · "Case" · "việc" (+ "· ⚠ n quá hạn" khi có) · "yêu cầu"; định nghĩa Thi tháng này → ⓘ ("HV có ngày thi thật đã chốt trong tháng này."); CX "HV SOS 2–3" thêm đơn vị "HV" | `TongQuanQlV5`, `TongQuanQtV5`, `TongQuanCxV5`, `TongQuanGvV5`, `TongQuanTvvV5`, `ChiSoThi` |
| TQ3 | Số gạch chân khắp nơi (QL 25, GV 35) | M10, M1 | Số bấm được giữ dáng chữ màu nhấn; gạch chân chỉ khi rê / focus. Số nằm giữa câu (dòng phụ) giữ gạch chân. Chỉ trong `.tq-v8` | `index.css` (ngoài @layer) |
| TQ4 | Mọi số trong bảng 700 + tên lớp 600 → mỗi hàng 3–5 chữ đậm | M1 | Ô số trong bảng (1440) và dòng phụ ô chỉ số 500 — đậm chỉ tên lớp / GV và số lớn ô chỉ số; số quá hạn đỏ ⚠ vẫn đậm (cần làm ngay) | `index.css` |
| TQ5 | Chờ bạn duyệt mỗi dòng 2 dòng: "Đề xuất PA · **Trần Thu Hà**" + "MB FT 101 · MT1 · gửi bởi Phạm Thu Trang"; "hôm nay / 3 ngày" (tuổi yêu cầu) cùng chữ với hạn | M4, M10, M5, M1 | MỘT dòng, cùng dáng Chờ bạn duyệt ở Công việc v12: loại = chip VIỀN · tên em 600 (đậm duy nhất) · hạn = viên theo mức (`ChipHan vien`). Lớp · lượt · người gửi → `title` + panel duyệt (đủ chữ như trước) | `ChoDuyetGon` |
| TQ6 | "Điều hướng" mỗi link có câu phụ ("Học viên & Lớp · lọc …", "Công việc", kỳ Báo cáo) | M4 | Một dòng: tên đích + "›"; câu phụ → `title` (cả khối "Thi thật" của TVV) | `DiTiep` |
| TQ7 | Đầu thẻ "Giáo viên · W1 SEP – W2 SEP · bài chấm quá hạn lên đầu", "Kỹ năng tôi dạy · W4 AUG – W3 SEP", "Lớp tôi chủ nhiệm · 8 lớp · hiện tại" | M3, M4 | Chỉ tên thẻ (+ ⓘ sẵn có); kỳ đã ở đầu trang; thứ tự tự thấy (`title`) | `GvCanChuY`, `HaiKhoiGv` |
| TQ8 | Đơn vị lặp mỗi dòng dù tiêu đề cột đã có: "31 / Case" (Case chưa PA), "0 / bài" (Bài chấm quá hạn), "38 / Case" (Case) | M3 (V13 vẫn đủ: đơn vị ở tiêu đề) | Bỏ dòng đơn vị ở 3 cột đó; cột không có đơn vị ở tiêu đề (Thi tháng này, Dưới kỳ vọng, Chờ chấm) giữ "HV" / "bài …" | `LopCanChuY`, `GvCanChuY`, `HaiKhoiGv` |
| TQ9 | "LT1 · MT1 · W3 SEP · tuần này" | M3 | Bỏ "tuần này" — mã tuần đã ghi, tuần hiện tại ở đầu trang | `HaiKhoiGv` `phuDay` |
| TQ10 | Tên ô "Chờ KQ · bước tiếp" (CX) ≠ "Chờ KQ · Lộ trình tiếp" (TVV); "đề xuất" (Tổng quan) ≠ "yêu cầu" (Công việc, Hộp duyệt) | M5 | Một tên: "Chờ KQ · Lộ trình tiếp" (cả Hướng dẫn CX + EN), "yêu cầu" | `TongQuanCxV5`, `shared/huongDan/cx.ts`, EN |
| TQ11 | 375: dải "Mới dùng PISA TRACKING?" 3 hàng (câu xuống dòng + hai nút full bề rộng) | M8 | Một hàng: chữ + Xem · Ẩn cùng hàng (nút vẫn 44 px), câu phụ "Xem 5 việc…" chỉ ở màn rộng (`title` giữ). Thành phần dùng chung → dải ở Công việc GV cũng một hàng | `DaiMoiDung` |
| TQ12 | 375 Lớp tôi chủ nhiệm: lớp thường có hàng "SOS hiện tại" trống | M4 | Bỏ hàng nhãn khi ô không áp dụng (1440 giữ "—") | `HaiKhoiGv`, `Bang` (hàng riêng ô null → không vẽ) |
| GIỮ | Bố cục v11: đầu trang, dải 4 / 3 ô, bảng trái, cột phải 360, 375 thẻ lưới, SOS một kiểu, công tắc FT / Lớp thường, Hành chính / Học thuật, ⓘ, panel số (V11), rỗng / lỗi | — | không đổi | — |

**Không sửa (ghi lại để PTA quyết):**
- [XM-1] Bỏ gạch chân số chỉ áp ở Tổng quan (`.tq-v8`) — như K1 #934 (một màn một PR). Màn khác vẫn gạch chân tới PR màn đó; nếu PTA muốn một dáng toàn web, dời quy tắc sang `LOP_OSO` (một dòng) và ghi DESIGN G6.
- [XM-2] Tổng quan QL đếm "12" hai lần (ô Chờ duyệt + đầu khối Chờ bạn duyệt) — M3 nhưng ô là bố cục v11 đã duyệt; giữ.
- Số trong bảng 375 (thẻ lưới `luoi-g` 17 / 700) giữ như mockup v11 `.luoi-so .g` — M1 chỉ áp bảng 1440.
- Bảng "Theo chi nhánh" (QT / CX): tên chi nhánh 600 + số — đã gọn sau TQ3 / TQ4, không sửa thêm.

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm số ô chỉ số / bảng / chip SOS → panel đúng tập (V11), "⚠ n" GV → panel Nhập hộ | có (số gạch chân) | có — số màu nhấn, gạch chân khi rê / focus; vùng bấm, `aria-label` giữ |
| ⓘ Đạt MT · Kỹ năng tôi dạy · Lớp tôi chủ nhiệm · Báo PH | có | có (+ ⓘ Thi tháng này: định nghĩa trước là dòng phụ) |
| Fast Track / Lớp thường · Chi nhánh (QT, CX) · Hành chính / Học thuật | có | có |
| Tên lớp / GV → hồ sơ · hàng chi nhánh → lọc chi nhánh (QT) | có | có |
| Chờ bạn duyệt: bấm dòng → panel Duyệt / Từ chối / Mở › · Hộp duyệt › | có | có — dòng một hàng; lớp · lượt · người gửi khi rê chuột; đầu panel thêm "em · lớp" (`KhungPanel hocVien / lop`), thân panel có "{người} đề xuất {ngày}" |
| Xem "tuổi" yêu cầu ("3 ngày", "hôm nay") | chữ cạnh dòng | ĐỔI → hạn duyệt (viên theo mức, như Công việc v12); ngày gửi trong panel duyệt |
| Điều hướng / Thi thật: bấm dòng → trang đích | có | có — câu phụ khi rê chuột |
| Mới dùng PISA? Xem · Ẩn | có | có (375 cùng hàng) |
| Thi tháng này / Chờ KQ · Lộ trình tiếp (TVV, CX) → Học viên & Lớp đúng nhóm | có | có |

## Dòng đọc Turso (dev, `PISA_DEM_SQL=1`, dữ liệu demo — trước = main `1dc6e0615`, sau = nhánh)

Không đổi máy chủ; trang gọi đúng các đường như trước (kiểm `performance.getEntriesByType('resource')`): `kyGv` / `kyTvv` ở `OverviewPage` dùng chung GET đang bay
của khối dưới (`useApi` gộp) — `/tong-quan/lop-toi-day/hai-khoi` vẫn **một** lần mỗi lần mở trang GV.

| Trang | Đường riêng của Tổng quan (trước = sau) |
|---|---|
| QL Monbay | `/tong-quan/v5` 39 câu · 2 448 dòng · `/phan-tich/giao-vien` 39 · 2 058 · `/yeu-cau?hop=cho-duyet` 15 · 68 · `/ref/branches` 2 · 6 |
| GV cô Hà | `/tong-quan/lop-toi-day/hai-khoi` 57 · 2 059 · `/giao-vien/7/o?cot=case-mo` 22 · 433 · `/my-work` 32 · 833 (chung badge) |
| TVV | `/tong-quan/tvv` 3 · 2 · `/tong-quan/hoc-vien` 47 · 421 |

## Mã chạm

`web/src/modules/worklist/TongQuanV5.tsx` · `LopToiDay.tsx` (`HaiKhoiGv`) · `OverviewPage.tsx` · `web/src/modules/huongDan/DaiMoiDung.tsx` · `web/src/ui/Bang.tsx`
(một dòng: hàng riêng 375 bỏ khi ô null) · `web/src/index.css` (2 quy tắc `.tq-v8`) · `shared/huongDan/cx.ts` + EN (`tlV5.ts`, `uiTongQuan.ts`).
