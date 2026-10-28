# RA-UI-7 — PTA quyết 29/10 (mục 1, 6, 7) + hồi quy từ chấm lại

Loại PR: **sửa nhỏ** qua thành phần chung, không đổi bố cục, không mất thao tác. **Chồng trên #682 + #683** (gộp hai nhánh đó, cùng dòng) — merge SAU #682, #683. Điểm critique trước → sau + mục "Chờ chủ SP": `docs/superpowers/specs/2026-10-29-ra-soat-dem/diem-critique.md`.

## Sửa
| # | Chỗ | Trước | Sau | Lý do |
|---|---|---|---|---|
| 1 | `BoLocDoan` (nút đoạn — Công việc, Tổng quan, KHT, Hồ sơ lớp…) ở 375 | mỗi nút một viên rời, có khe (OV-14b 17/10) | ≤ 3 mục: MỘT khối liền như máy tính; > 3 mục giữ xuống dòng (không cắt) | PTA 29/10: mockup v7 `cong-viec-2`, `ke-hoach-test` 375 (duyệt sau OV-14b) thắng về hình |
| 6 | `Status` (chip tiến độ: Hồ sơ lượt, Lịch Test, Test + SOS… 18 chỗ) | chip vuông viền + ký hiệu ▶ ◷ ✓ · | viên tròn nền xám + chấm màu = `Nhan` (doing → xanh, waiting → vàng, done → xám, idle → viền đứt) | PTA mục 6: một dáng chip theo mockup v7 / DESIGN V4 nhóm ③ |
| 7 | đầu mục Case (`DauMuc`) | vạch nhấn trái (M6) | **giữ** — M6 (27/10 tối, đã vào DESIGN V21) mới hơn M5 (27/10) | PTA mục 7 |
| h1 | dải chỉ số < 1024 ở Tổng quan TVV, Báo cáo HV, Tổng quan Admin | ô lẻ cuối mồ côi nửa hàng (sửa ở #683 chỉ ăn `DaiChiSo`) | ô lẻ cuối chiếm cả hàng | hồi quy chấm lại |
| h2 | Báo cáo HV › ô "Thi trong kỳ" | "trong kỳ" lặp 3 lần trong một ô | bỏ dòng kỳ của ô này (tên ô đã nói) | hồi quy #682 |
| h3 | công tắc Fast Track / Lớp thường (Phân tích) | 14 px (#682 ghi 15) | 15 px | đúng mô tả |
| h4 | nút mũi tên mở nhóm `HangNhom` (HV & Lớp, Test + SOS, Hiệu quả PA…) | "›" nét (= đổi trang, G6) | ▸ đặc như Ý thức (#683) | một ký hiệu mở tại chỗ cả web |

## Ảnh
`sau-375-sang.png` (Tổng quan TVV ô lẻ cả hàng · Công việc GV nút đoạn liền · KHT công tắc liền) · `ho-so-luot-chip-1440-toi.png` (chip tiến độ dạng viên) · `test-sos-1440-toi.png` (▸ mở nhóm).

## Phép kiểm sửa mốc (có lý do)
- `prHk2` C2: bỏ `Status` khỏi danh sách "phải dùng CHIP_VUONG", thêm khẳng định `Status` vẽ qua `<Nhan` — theo PTA mục 6 (mockup v7 / V4 ③).

## Thao tác TRƯỚC → SAU
Không đổi: nút đoạn giữ đủ mục, chỉ liền khối; chip trạng thái chỉ đổi dáng; mũi tên mở nhóm giữ chỗ / việc.

## Chưa làm (PTA quyết LÀM, để PR sau): mục 3 Hồ sơ lớp 375 (bảng thẻ + kẻ hàng — cần thử kỹ ô sửa tại chỗ) · mục 4 mật độ đầu hồ sơ lớp.
