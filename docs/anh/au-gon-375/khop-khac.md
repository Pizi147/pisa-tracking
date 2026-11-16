# AU-GON · PR2 375-CAT-CHU — khớp / khác

Ảnh cặp TRƯỚC | SAU (demo, tối): `cap-cv-tvv` (TVV, 375) · `cap-cv-gv-day` (GVCN 7, 375, cuộn hết trang) · `cap-hs-tab` (hồ sơ HV, 375) · `cap-lop-hv` (hồ sơ lớp, 375) · `cap-hs-lotrinh` (hồ sơ HV tab Lộ trình, 1440). `cap-cv-tvv` chụp trên nhánh từ main nên thẻ phụ Báo PH còn "còn 4 ngày" — PR1 #1782 lo phần đó.
Phông Be Vietnam Pro đã nạp. Đo vùng chạm / chữ cắt bằng script Playwright ở 375 (nút, tab, ô số) — trước khi sửa và sau khi sửa.

| Mã | Thay đổi | Mockup |
|---|---|---|
| A1-10 = B3-21 | 375: đệm đáy `main` 156 px khi có nút nổi "+ Task" → hàng cuối không bị che (`html:has([data-fab-task])`) | KHỚP (không đổi hình) |
| A1-11 | Đầu mục Công việc 375: ghi đủ "4 việc · 3 quá hạn" (trước chỉ "4" và "3" đỏ) | KHỚP V13 |
| A1-12 | Hồ sơ lớp 375: tên em xuống dòng, không "…" (`BangHoSoLop`). Vùng chạm 44 px: đo lại — mũi mở lớp, ô số, chip việc đã ≥ 44 (có `::before/::after`); chip trạng thái `Nhan` nới thêm (22 → 46) | KHỚP |
| A2-06 | `.o-so` (SOS 1 / 2 / 3 ở hàng lớp HV & Lớp, 14 × 23) thêm `::after` 40 × 44 ở 375, không đổi hình | KHỚP |
| A3-05 | Nút tròn "+ Task" `min-w-[60px]` + đệm — "+ New task" (EN) không cắt | KHỚP |
| A3-13 | Hồ sơ HV 375: tab ba "Lộ trình" (rút, tên đủ ở ≥ 640) → ba tab vừa hàng, không cắt mép phải | KHỚP ④ ("Bổ sung") |
| A3-14 | Dải TVV 375: "Chưa chốt" → "Chưa chốt bước tiếp" (EN "Next step pending") | — |
| A1-20 | Dải "Việc cần làm" hồ sơ HV: tối đa 2 thẻ phụ, thẻ xuống dòng (không cắt) | KHỚP |
| A3-23 | Tab Lộ trình & lớp: tên Case xuống dòng, không cắt "…" | KHỚP |
| B3-20 | 375 + bàn phím ảo mở: dòng "Quy chế" của chân panel ẩn (thấy ô đang gõ). **Chưa làm:** đưa "Quy chế" vào ⓘ — trái GD-20c (PTA rà #1738: 375 câu xuống dòng đủ chữ) → [XM], hỏi PTA Plan; chưa sửa mockup v21 | [XM] |

## Thao tác TRƯỚC → SAU
Không đổi thao tác nào (chỉ vùng chạm, chữ, nhãn, đệm).

## Turso
Không đổi (chỉ web).
