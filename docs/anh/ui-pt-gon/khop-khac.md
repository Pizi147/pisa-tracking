# UI-PT-GON — Phân tích gọn theo luật mật độ M1–M10 (`de-xuat.md` mục 1, hạng 8 mục 3)

PTA Plan 05/11: màn ⑧ **Phân tích** (6 tab: Báo cáo HV · Phân tích GV · Test + SOS · Kết quả Test / Thi · Hiệu quả PA · Ý thức). Bệnh chính: số bấm được
gạch chân khắp nơi, số trong bảng đậm, dòng phụ lặp bộ lọc / ô chỉ số, câu giải thích nằm trên màn. **Giữ bố cục V8-PT / U08 + mọi thao tác**; dáng đồng bộ
Tổng quan (#937), Hồ sơ lớp (#941). Không đổi máy chủ, không thêm request.

Dữ liệu demo 14/09/2026, chi nhánh Monbay, khoảng mặc định W1 SEP → W2 SEP. QL Nguyễn Khánh Vy (vai 2), TVV Nguyễn Thu Hương (vai 23 — GV không có mục Phân tích nên vai thứ hai là TVV).
Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh.

U08 (góp ý chủ SP 03/11, `plan.md` mục 4): đã làm hết ở #901 (màu bảng, bỏ cột Xử lý / Người chọn, panel Case theo kỹ năng, MT# nổi, link chữ thường).
Ý còn lại trong phạm vi M1–M10: "link không gạch chân, hover mới báo bấm được" — nay áp cho cả số bấm được (P1).

## Ảnh trước | sau (toàn trang)

| Màn | Ảnh |
|---|---|
| Test + SOS · QL · 1440 tối | `truoc-sau-test-sos-ql-1440-toi.png` |
| Test + SOS · TVV · 1440 tối (Toàn bộ) | `truoc-sau-test-sos-tvv-1440-toi.png` |
| Test (lớp thường) · QL · 1440 tối | `truoc-sau-test-thuong-ql-1440-toi.png` |
| Báo cáo HV · 1440 tối | `truoc-sau-bao-cao-ql-1440-toi.png` |
| Kết quả Test (Mock) · 1440 tối | `truoc-sau-ket-qua-mt-ql-1440-toi.png` |
| Kết quả Thi thật · 1440 tối / 375 sáng (Toàn bộ — demo chưa có lượt thi thật nào nên chỉ thấy khung rỗng) | `truoc-sau-thi-that-ql-1440-toi.png` · `truoc-sau-thi-that-375-sang.png` |
| Khung rỗng (P21): Test + SOS · TVV (W1–W2 SEP) · Phân tích GV · Quản trị chưa chọn chi nhánh | `truoc-sau-rong-test-sos-tvv-1440-toi.png` · `truoc-sau-rong-gv-qt-1440-toi.png` |
| Hiệu quả PA · 1440 tối | `truoc-sau-pa-ql-1440-toi.png` |
| Phân tích GV · 1440 tối | `truoc-sau-gv-ql-1440-toi.png` |
| Ý thức · 1440 tối | `truoc-sau-y-thuc-ql-1440-toi.png` |
| Test + SOS · Kết quả Test · Hiệu quả PA · 375 sáng | `truoc-sau-test-sos-375-sang.png` · `truoc-sau-ket-qua-mt-375-sang.png` · `truoc-sau-pa-375-sang.png` |
| Hồ sơ lớp MB FT 101 › Phân tích lớp · 1440 tối (ảnh hưởng CSS chung — P2) | `truoc-sau-lop-ft-phan-tich-1440-toi.png` |

## Đo trước → sau (màn đầu 1440 × 900 / 375 × 812; cách đo như `de-xuat.md` mục 3)

| Màn | Từ màn đầu (cả trang) | Đậm màn đầu | Nút / ô | Gạch chân liền (cả trang) | Cao trang |
|---|---|---|---|---|---|
| Test + SOS · QL 1440 | 260 → **244** | 60 % → **33 %** | 86 → 86 | 51 → **0** | = |
| Test + SOS · TVV 1440 | 222 → **199** | 54 % → **31 %** | 60 → 60 | 39 → **0** | = |
| Test lớp thường 1440 | 264 → **256** | 57 % → **40 %** | 80 → 80 | 33 → **0** | = |
| Báo cáo HV 1440 | 301 → **279** | 39 % → **25 %** | 43 → 43 | 25 → **0** | = |
| Kết quả Test 1440 | 444 (459) → **432 (447)** | 75 % → **55 %** | 60 → 60 | 4 → **0** | = |
| Thi thật 1440 (rỗng) | 101 → **88** | 23 % → 24 % | 13 → 13 | 0 | = |
| Hiệu quả PA 1440 | 184 → **123** | 35 % → 45 % ¹ | 22 → 21 ² | 2 → **0** | = |
| Phân tích GV 1440 | 191 → **185** | 52 % → **23 %** | 53 → 53 | 34 → **0** | = |
| Ý thức 1440 | 280 (318) → **270 (308)** | 52 % → **39 %** | 41 → 42 ³ | 32 → **0** | = |
| Test + SOS 375 | 92 (209) → **82 (199)** | 32 % → 33 % | 24 → 24 | 24 → **0** | = |
| Kết quả Test 375 | 76 (501) → **72 (497)** | 35 % → 37 % | 25 → 25 | 4 → **0** | 2 026 → **2 008** |
| Hiệu quả PA 375 | 113 (176) → **91 (115)** | 31 % → 44 % ¹ | 19 → 19 | 2 → **0** | 1 086 → **962** |
| Hồ sơ lớp › Phân tích lớp 1440 | 177 → 177 | 38 % → **35 %** | 28 → 28 | 0 → 0 | = |

- ¹ Tỉ lệ tăng vì bớt chữ thường (ba dòng "0 …" của Chưa tính, câu rỗng dài), không thêm chữ đậm: số phần tử đậm 18 → 19 (1440; "0" của Chưa tính thành số lớn như ô khác).
- ² ⓘ cạnh "0 PA chưa có kết quả" ẩn theo dòng 0. ³ ⓘ mới "Lớp nhiều vi phạm" (câu "xếp theo vi phạm chưa xử lý" dời vào).
- 375: tỉ lệ đậm gần như giữ — số trong thẻ 375 (Test + SOS) vẫn 700 như mockup C1 (luật 500 chỉ áp ô bảng `td`, như #937).

## Chỗ ngợp → luật → cách sửa

| # | Chỗ ngợp (trước) | Luật | Sửa | Thành phần |
|---|---|---|---|---|
| P1 | Mọi số bấm được gạch chân (ô chỉ số, bảng, dòng Tổng) — tới 51 số một màn | M10, M1 | `.so-gon` trên trang Phân tích: gạch chân chỉ khi rê / focus (như Tổng quan, Hồ sơ lớp). Số giữa câu `.text-xs` giữ gạch (WCAG 1.4.1) | `PhanTichPage` |
| P2 | Số bấm được trong bảng 700 (Test + SOS, Phân tích GV, Ý thức; Phân tích lớp "7/9") — luật 500 cũ chỉ bắt `.bang td`, bảng Phân tích không mang `.bang` | M1 | Luật chung đổi `.bang td` → mọi `td` (trong `.tq-v8` / `.so-gon`); gạch chấm gợi ý (KCK) loại ra. Quá hạn đỏ vẫn đậm | `index.css` |
| P3 | Kết quả Test: điểm L R W S, OVR, Kỳ vọng 600–700 (bảng Mock + Thi thật) | M1 | 500; đậm chỉ tên HV (+ "MT#" giữ 600 — chủ SP U08-5 "MT# nổi hơn tuần") | `KetQuaThi` |
| P4 | Đầu bảng "Theo tuần **2 tuần** 16 lượt MT · Fast Track" | M3 | Bỏ dòng phụ: số lượt = ô chỉ số Lượt MT, chương trình = hàng lọc | `TongHopTestSos` |
| P5 | Ô "Lượt MT 16 · 16 HV · 2 tuần"; ô "Đạt 6 · 38 % · trên 16 lượt" | M3 | "16 HV" (số tuần ở chip đầu bảng); bỏ "trên 16 lượt" (= ô Lượt MT ngay cạnh) | `TongHopTestSos` |
| P6 | Chip "SOS 3 · 0" mờ (Test + SOS), "SOS 1 · 0" viền (Kết quả Test) | M4 | Mức bằng 0 không hiện; không mức nào → "0" | `TongHopTestSos`, `KetQuaThi` |
| P7 | Kết quả Test: đầu bảng "xếp theo lớp → tên" / "xếp theo mức SOS → lớp → tên" (lặp ô Xếp theo); Thi thật "theo lớp → ngày thi" | M3, M4 | Bỏ | `KetQuaThi` |
| P8 | "Xuất Excel · 17 lượt" (lặp chip "17 lượt") | M3 | "Xuất Excel" | `KetQuaThi` |
| P9 | Ô "Chưa đủ điểm 8 · không vào tỷ lệ"; "Bước tiếp chưa chọn · chọn ở Sau thi (TVV)" | M4 | Bỏ dòng phụ — câu đã ở ⓘ Cách tính đầu bảng | `KetQuaThi` |
| P10 | Báo cáo: nhãn "Trong kỳ W1 SEP – W2 SEP" (lặp hàng lọc) | M3 | Màn: "Trong kỳ"; **bản in** (hàng lọc ẩn) vẫn ghi đủ khoảng | `BaoCao` |
| P11 | Báo cáo: "Đạt Target thi thật **– chưa có dữ liệu** · chưa HV nào có KQ" (hai câu một ý) | M3 | Số "—" mờ như ô "chỉ Fast Track"; giữ "chưa HV nào có KQ" | `BaoCao` |
| P12 | Báo cáo: "Kết quả MT · lượt của từng HV trong kỳ · % trên HV đủ dữ liệu" | M4 | Chỉ hiện khi in; màn dùng ⓘ + dòng "n HV · m đủ dữ liệu" của hàng | `BaoCao` |
| P13 | Báo cáo "So lượt trước": ↑ / ↓ đậm màu | M1 | Chỉ màu, chữ thường | `BaoCao` |
| P14 | Hiệu quả PA: "Chưa tính" ba dòng "0 …" | M4 | Dòng 0 ẩn; cả ba 0 → "0" | `HieuQuaPa` |
| P15 | Hiệu quả PA: "tiến bộ rõ + một phần", "trung vị · PA có cải thiện" dưới số | M4 | Bỏ — định nghĩa ở ⓘ đầu bảng | `HieuQuaPa` |
| P16 | Hiệu quả PA rỗng: "Chưa có PA … trong W1 + W2 SEP/2026. Số có khi PA kết thúc có kết quả — thử khoảng thời gian dài hơn." | M7 | Một câu "Chưa có PA … trong {khoảng}." + nút Xem Toàn bộ (câu mới có EN, `en/ptGon.ts`) | `HieuQuaPa` |
| P17 | "PA theo quy chế · bắt buộc · không so, không xếp hạng"; "2 vấn đề khác / mỗi vấn đề ≤ 2 PA có kết quả" (2 dòng) | M4, M2 | Câu đầu → ⓘ; "mỗi vấn đề ≤ 2 …" → `title` hàng + ⓘ (cho 375 chạm) | `HieuQuaPa` |
| P18 | Phân tích GV: "7 GV · xếp theo tên" cuối hàng lọc (lặp chip "7 GV"; "xếp theo tên" có ở ⓘ) | M3 | Bỏ | `PhanTichGiaoVien` |
| P20 | Thi thật: cột "Lớp" lặp hàng nhóm lớp ngay trên (**PTA quyết XM-1**, cùng kiểu U08 bỏ cột Xử lý / Người chọn) | M3 | Bỏ cột trên màn (bảng 1 100 → 990 px); mã lớp ở hàng nhóm thành link hồ sơ lớp (giữ thao tác của ô Lớp cũ); Xuất Excel giữ cột Lớp; thẻ 375 giữ "lớp · ngày" (thẻ không có hàng nhóm) | `KetQuaThi` |
| P21 | Khung rỗng căn giữa khung cao + câu phụ ("Kết quả thi thật nhập ở hồ sơ học viên; thử khoảng…", "Thử khoảng thời gian dài hơn.", "Số có khi đã ghi vi phạm — …", "Bảng giáo viên luôn là một chi nhánh — …") | M7 | `RongDau` (một câu ở đầu khung + nút Xem Toàn bộ, cùng dáng khung rỗng Hiệu quả PA) cho mọi khung rỗng của Phân tích: Test + SOS, Kết quả Test (Mock, Thi thật), Báo cáo (Kết quả MT, Tiến bộ), Hiệu quả PA, Ý thức (2 khung), "Chưa được cấp phạm vi", Phân tích GV chưa chọn chi nhánh. `Empty` chung toàn web không đổi; rỗng trong panel giữ | `dungChung`, 6 tab |
| P19 | Ý thức: "Chưa xử lý 14 · trên 36 vi phạm" (36 = ô Vi phạm cạnh); "Lớp nhiều vi phạm · xếp theo vi phạm chưa xử lý" | M3, M4 | Bỏ "trên n vi phạm"; câu xếp → ⓘ | `YThucPhoiHop` |

**Không sửa (ghi lại):**
- [XM-1] → PTA quyết bỏ cột (P20). Demo chưa có lượt thi thật nào → bảng có dữ liệu không chụp được; kiểm bằng mã (colgroup 10 cột = th = td, colSpan 10).
- [XM-2] Thẻ 375 Test + SOS: số 15 / 700 (mockup C1) — PTA đồng ý để PR cuối đợt (`LOP_OSO`).
- Chip đếm đầu bảng ("2 tuần", "17 lượt", "6 HV") giữ — mẫu `DauThe` dùng chung; panel mở từ số (portal) không đổi.
- Hồ sơ lớp › Phân tích lớp: số "7/9" 700 → 500 vì luật CSS chung (P2) — đúng ý #941 ("số bảng 500"), trước đây sót vì bảng không mang `.bang`.

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| 6 tab · Chương trình · Toàn bộ / Chọn khoảng tuần · ô tuần · Mọi lớp · chi nhánh | có | có |
| Test + SOS: Theo tuần / lớp / GV ▾ · Xuất Excel · ⋯ (Cột hiện, Xuất kết quả từng lượt) · mở / gập hàng · bấm mọi số → panel | có | có (chip SOS bằng 0 không còn, vốn không bấm được) |
| Báo cáo: In · ⓘ · bấm số → panel | có | có |
| Kết quả Test: Mock / Thi thật · Xếp theo · Mọi kết quả · Xuất Excel · tên → hồ sơ HV · MT → hồ sơ lượt · lớp → hồ sơ lớp · chip SOS → panel Case · phân trang | có | có (Thi thật: lớp → hồ sơ lớp ở hàng nhóm thay ô Lớp) |
| Khung rỗng: Xem Toàn bộ | có | có |
| Hiệu quả PA: chip GV ✕ · bấm số → panel · mở "n vấn đề khác" · Xem Toàn bộ · ⓘ | có | có |
| Phân tích GV: Gọn / Đầy đủ · Tìm GV · tên → hồ sơ GV · số → panel | có | có |
| Ý thức: Xuất Excel · bấm số → panel · mở lớp · tên → hồ sơ | có | có (+ ⓘ "Lớp nhiều vi phạm") |

## Turso
Không đổi máy chủ, không đổi `useApi` nào — mỗi tab gọi đúng các đường như trước (`/phan-tich/tong-hop`, `/tong-quan` + `/phan-tich/bao-cao`, `/phan-tich/ket-qua-thi`,
`/phan-tich/hieu-qua-pa`, `/phan-tich/giao-vien`, `/phan-tich/y-thuc`, `/ref/*`): số câu · dòng trước = sau.

## Rà
- ponytail-review: gọn (sửa một dấu phẩy thừa). web-design-guidelines: đạt — chữ dời vào `title` đều có ⓘ cho chạm (P17 thêm vào ⓘ).
- impeccable audit (phạm vi diff): không P0 / P1. Lưu ý đã biết (như #937): số trong bảng chỉ phân biệt bằng màu khi không rê — gạch chân hiện khi rê / focus, số giữa câu giữ gạch.
