# M1111-2b · Khai cấp bậc một em: "Lưu · việc tiếp ›" (V12)

Mockup đã duyệt: `thiet-ke/2026-11-11-mockup-1111/2-khai-cap-bac.html` khung K5 (#1326) — PTA Plan xác nhận làm PR riêng sau #1336.
Ảnh: `cap-1440.png` (mockup K5 | web: Công việc › Ý thức › "Xác nhận cấp bậc vi phạm HV cũ" một em) · `sau-luu-tiep-1440.png` (bấm "Lưu · việc tiếp ›" → việc kế "Xác nhận xử lý" mở, dòng cũ "✓ Đã lưu").
Bấm thử trên seed cục bộ: thêm 1 HV mới vào MB FT 101 (ngày tạo trong 14 ngày của ngày demo) để có việc một em — chỉ DB demo máy dev.

| Thành phần | Mã | Kết quả |
|---|---|---|
| Mở từ Công việc có việc kế: chân "Lưu" (phụ) + "Lưu · việc tiếp ›" (chính); chỉ sang việc kế khi máy chủ đã nhận, lỗi ở lại | `KhaiBacPanel` + `luuRoiTiep` (dùng chung) | KHỚP |
| "Lưu" ở lại: "✓ Đã lưu" + "Việc tiếp ›" | `KhaiBacPanel` (`daLuu`) | KHỚP |
| Không có việc kế (hồ sơ HV, việc cuối): một nút "Xác nhận" / "Lưu" như cũ | `KhaiBacPanel` | GIỮ |
| Hàng chip cỡ lớn (K5) | #1336 (`ChipBac`) | Ngoài PR này — gộp khi #1336 merge (ảnh còn lưới nút cũ) |

Thao tác TRƯỚC → SAU: Xác nhận (đóng / "Đã lưu" + Đóng) → GIỮ khi không có việc kế; THÊM "Lưu · việc tiếp ›" khi có việc kế. 0 request thêm (`onTiep` của `PanelViec` sẵn có).
