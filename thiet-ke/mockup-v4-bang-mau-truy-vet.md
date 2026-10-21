# Truy vết — `mockup-v4-bang-mau.html` (Bảng mẫu) · 21/10/2026

Mockup: [`mockup-v4-bang-mau.html`](mockup-v4-bang-mau.html) · ảnh: `anh/mockup-v4-bang-mau-<khung>.png` (k1–k3 = 1440 tối; a, b = 375 sáng).
Nguồn: 04 mục 2, 3, 5, 6, 7, 8, 10, 12, 13 · 07 NEN / BANG-0…5 · 06 mục 4 (S0 sân mẫu). Để chủ SP so với `/dev/thanh-phan` của session NEN (dựng cùng lúc).

## 1. Quyết định → khung → thành phần

| Mã | Nội dung | Khung | Thành phần |
|---|---|---|---|
| 04 6.1, 6.2 (V2 I.7, V3 I.3) | Một `Bang`, căn tiêu đề = căn ô theo `data-kieu` | k1, k2 | `Bang` |
| 04 6.2 #1 | `ten` — trái, ≥ 205, link ↗, dòng phụ 13 | k1, k2 | `Bang` |
| 04 6.2 #2 | `chu` — Ghi chú / Ai còn nợ, linh hoạt | k2 | `Bang` |
| 04 6.2 #3 | `so` — giữa, 64–88 | k1 (mockup 3, 4) | `Bang` |
| 04 6.2 #4 | `diem` — giữa, `ODiem` | k1 | `Bang` + `ODiem doc` |
| 04 6.2 #5 | `noi-bat` — Kỳ vọng, Overall, một dải nền nhấn | k1 | `Bang` |
| 04 6.2 #6 | `chip` — SOS / Kết quả 140 | k1, k2 | `ChipSos` |
| 04 6.2 #7 | `tuan` / `ngay` | (mockup 1 k6) | `Bang` |
| 04 6.2 #8 | `viec` — động từ 15/600 + hạn 13 | k1 | `Bang` |
| 04 6.2 #9 | `nut` — ⋯ 48 phải | k1 | `Bang` |
| 04 6.2 #10 | `diem-ti-le` — căn theo "/" | k2 | `ODiem ti-le` |
| 04 6.2 #11 | `phan-tram` — "% tổng" theo ngưỡng 70 % | k2 | `Bang` |
| 04 6.2 #12 | tiêu đề có chú thích `phu` ("S chấm chéo", "G+V /25 ✎") — cấm ô nhập trong `th` | k1, k2 | `Bang` |
| 04 6.2 #13 | nhóm cột 2 tầng (Progress \| Final), kẻ dọc `--accent-line` | k2 | `Bang` `nhom` |
| 04 6.3 | Hàng 44 / 64; hàng nhóm 40, vạch trái trung tính; W tính sẵn nền xám; một dải nền nhấn | k1 | `Bang` |
| 04 6.4 | 375 thành thẻ từ cùng định nghĩa cột; lưới ô cố định | a, b | `TheDong` |
| 04 5.1, 5.2 | `--kq-vuot / bang / duoi`; ✓ / ✗ TRƯỚC số; KCK trung tính; mốc cũ mờ; mẫu số khác vàng | k1–k3 | `ODiem` |
| 04 7 | `ODiem` doc · sua (trống / gõ / đang lưu / đã lưu / lỗi / dòng phụ) · ti-le · lon | k3 | `ODiem` |
| 04 8.1, 8.2 | `OSo` (mặc định / rê / focus / đang mở / quá hạn / 0 / chỉ xem) + "một nghĩa một dáng" | k3 | `OSo`, link "›", "↗", ⓘ, `BoLocDoan` |
| 04 12 HTT-1…12 | rê chuột · tắt có lý do · chọn một · đang chọn · tải / rỗng / lỗi · lưu 5 trạng thái · vừa xong · người khác đã làm | k1 (hàng), k3 | lớp `.bam`, `.dang-mo`, `TrangThaiLuu` |
| 04 13 | `Khoảng tuần` (mọi trang) · [Toàn bộ \| Khoảng tuần] chỉ Phân tích · một tuần · ngoại lệ tháng Lịch thi · lịch tuần mở (mã tuần đầu hàng, gõ được) · 375 hai ô 44 | k3, b | `KhoangTuan`, `ONgay kieu="tuan"` |
| 04 15 | Đầu trang một hàng; dải lọc "Đang lọc [chip ✕] · Bỏ lọc" | k1 | khung trang |

## 2. GIỮ
Token màu nền / chữ / viền OV-15a · chip SOS chỉ viền (C08) · Be Vietnam Pro + chữ số Inter · phân trang 10 / 20 / 50 (không vẽ ở đây).

## 3. BỎ (web hiện tại)

| Bỏ | Tệp |
|---|---|
| Luật căn theo tên lớp | `web/src/index.css:267` |
| ~190 lớp căn viết tay trong `td` / `th`; `<table>` ngoài `Bang` | 53 tệp (BANG-2, BANG-3) |
| Ký hiệu ✓ / ✗ SAU số; số trắng; dòng "W1 · W2" 11 px dưới ô | `HopNhapDiem.tsx:160-187`, `BangHocVienLop.tsx:59-71` |
| Chip nền "n/4 môn đạt"; "✗ 16/25 64%" | `LuoiThuong.tsx:540-611` |
| Gạch chấm dưới số bấm được; `SoLieuO`, `SoO` | `ui/SoLieu.tsx` |
| Nút "?" giải thích | `NutGiaiThich` (→ ⓘ) |
| "✓ Đã lưu" xanh lá trong ô | `HopNhapDiem.tsx` |
| `.row-hover` 4 %, `hover:bg-white/5`; "đang chọn" viền khung 2 px | `index.css`, 31 tệp |
| `BandCell` (không nơi dùng) | `ui/ui.tsx:438-449` |
| Hàng nút "Tuần này · Tuần trước"; `ChonTuan`; bậc thang ‹ [W3 SEP] › | `BoChonThoiGian`, `ChonTuan` |

## 4. Đích đo
`do-bang`: lệch tiêu đề ↔ ô ≤ 2 px; đường cơ sở trong hàng ≤ 2 px; cao hàng ∈ {44, 64} ± 1; cỡ chữ ô ∈ {12, 13, 14, 15}; không chữ < 12; không `th` chứa điều khiển; ở 1440 / 1280 / 375.

## 5. Cần chủ SP chọn
1. Thẻ 375 bỏ W1 / W2 (chỉ L R W S OVR).
2. Nút trên thẻ 375: "Mở việc" hay động từ của việc.
3. Chỗ khác với `/dev/thanh-phan` của session NEN: sân mẫu đã duyệt thắng.
