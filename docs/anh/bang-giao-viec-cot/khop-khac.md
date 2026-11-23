# Bảng giao việc — cân cột + panel việc đúng khuôn (NH4 · NH8 · NH9 · NH10)

Ảnh `truoc-*` | `sau-*` (demo, 1440 tối · 1280 tối · 375 sáng): `bang` (có việc, có ghi chú dài, có việc con 1 / 4) · `bang-rong` · `panel-nguoi-giao` (việc có 4 việc con) · `panel-ghi-chu-dai` (Tạm ngưng, ghi chú dài) · `panel-nguoi-giao-xoa` (việc chưa có cập nhật → ⋯ có Sửa + Xoá) · `panel-nguoi-nhan` (Bùi Hải Yến mở từ Công việc → Vận hành) · `giao-viec` (form, không đổi). `document.fonts.check('14px "Be Vietnam Pro"')` = true cả ba cỡ. Số đo: `do-truoc.json`, `do-sau.json`.

## Số đo cột (Playwright, 9 dòng việc, bỏ dòng nhóm)

| Cỡ | Cột Việc · Người · Hạn · Trạng thái · Việc con (px) | Lệch giữa các dòng | Nội dung cột cuối cách mép khung |
|---|---|---|---|
| 1440 TRƯỚC | 728 · 200 · 150 · 170 · 150 | 0 | 80–127 px (cột cuối trống "—") |
| 1440 SAU | 475,3 · 279,6 · 181,7 · 293,6 · 167,8 | 0 | **17 px** (lề 16 + viền 1) |
| 1280 TRƯỚC | 568 · 200 · 150 · 170 · 150 | 0 | 80–127 px |
| 1280 SAU | 420,9 · 247,6 · 160,9 · 260 · 148,6 | 0 | **17 px** |

Tỷ lệ `34 · 20 · 13 · 21 · 12 %` (`COT_BANG`), `table-layout: fixed`, đầu cột và ô cột cuối căn phải. Không cuộn ngang ở cả ba cỡ.

## Bảng thao tác TRƯỚC → SAU (không mất thao tác nào)

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Bấm dòng mở panel · Enter / Space · `?open=` · `?tao=1` | có | giữ |
| Gập / mở nhóm (nhớ theo người) | có | giữ; dải nhóm cùng dáng dải nhóm Công việc (tên 16, "n việc" chữ phụ không ô, "m quá hạn" đỏ) |
| Lọc Nhóm · Trạng thái · Người phụ trách · Chi nhánh · 4 số | có | giữ nguyên |
| Hạn | viên "quá hạn 3 ngày" / "hạn dd/mm/yyyy" | ngày dd/mm/yyyy tô màu chữ (`<Han trongBang>`, NH4); "Chưa có hạn" mờ; dòng "đã dời từ…" giữ |
| Ghi chú tạm ngưng / dừng hẳn | 3 dòng trong ô hẹp | MỘT dòng cắt "…", `title` đủ chữ; đủ chữ ở panel |
| Việc con | "n/m xong" hoặc "—" | "n / m" sát phải; không có thì trống; "n việc con quá hạn" giữ |
| Đầu panel | tên · loại · Xoá việc · Sửa công việc · chip hạn "quá hạn n ngày" | tên · nhóm · loại · hạn (chữ tô màu) · ⓘ ⋯ ✕. **Sửa công việc / Xoá việc vào ⋯** (cùng ô 36 px với ✕; chỉ một mục thì là nút chữ bấm thẳng — luật S4-GD của `MenuDong`); Xoá vẫn đỏ, vẫn Thùng rác + Hoàn tác |
| Chân panel | Đóng | Đóng (phải) + trạng thái đang lưu / đã lưu / lỗi cho mọi thao tác lưu ngay (đổi người, hạn, theo dõi, tick việc con, dừng lặp) |
| Khối Phụ trách · Hạn · Theo dõi, Cập nhật tiến độ (Tạm ngưng / Dừng hẳn cần lý do, Hoàn thành), Lặp lại, việc con, tệp, Case, lịch sử | có | giữ nguyên (không đụng `KhoiGiaoViec`, `UpdateDialog`) |
| 375 | thẻ ba dòng | thẻ hai tầng: tên + hạn · người / việc con + trạng thái; cao ≥ 56 px |

Không đổi: số request / câu SQL (không thêm gọi nào), quyền, `Form Giao việc` / `Nhóm…` (đã cân hàng — chỉ chụp lại).

## [XM] — đã trả lời (PTA Plan)

1. Mở việc con tại dòng: KHÔNG cần (panel đã liệt kê việc con).
2. Bề rộng panel (835 px): chờ `panel-gon` merge rồi gộp main, không tự đặt.
3. Chữ đè ở `DanhSachViec` ("Việc con của: …" đè hạn): chuyển `khuon-a-danh-sach`.
4. Nền đỏ nhạt quá hạn: đã gộp main (#2065) và chụp lại ảnh `sau-*` — hạn quá hạn chỉ còn chữ đỏ.
5. Tên thẻ trong trang "Việc vận hành" → **"Việc đã giao"** (khớp tên trang; EN "Assigned tasks").
