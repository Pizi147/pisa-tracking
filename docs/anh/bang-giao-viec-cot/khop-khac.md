# Bảng giao việc — cân cột + panel việc đúng khuôn (NH4 · NH8 · NH9 · NH10)

Ảnh `truoc-*` | `sau-*` (demo, 1440 tối · 1280 tối · 375 sáng): `bang` (có việc, có ghi chú dài, có việc con 1 / 4) · `bang-rong` · `panel-nguoi-giao` (việc có 4 việc con) · `panel-ghi-chu-dai` (Tạm ngưng, ghi chú dài) · `panel-nguoi-giao-xoa` (việc chưa có cập nhật → ⋯ có Sửa + Xoá) · `panel-nguoi-nhan` (Bùi Hải Yến mở từ Công việc → Vận hành) · `giao-viec` (form, không đổi). `document.fonts.check('14px "Be Vietnam Pro"')` = true cả ba cỡ. Số đo: `do-truoc.json`, `do-sau.json`.

## Số đo cột (Playwright, 9 dòng việc, bỏ dòng nhóm) — v2 theo nội dung

Bảng 4 cột (bỏ cột "Việc con": "1/4 việc con" + "1 quá hạn" đỏ xuống dòng phụ dưới tên việc). Cột Việc ăn phần dư; Người · Hạn · Trạng thái rộng đúng nội dung dài nhất (`w-[1%]` + nowrap), cách nhau 32 px; Trạng thái là cột cuối, sát mép phải.

| Cỡ | Việc · Người · Hạn · Trạng thái (px) | Khoảng thừa mỗi cột = rộng − lề − chữ dài nhất | Lệch giữa các dòng | Cột cuối cách mép |
|---|---|---|---|---|
| 1440 TRƯỚC (#2060) | 728 · 200 · 150 · 170 · 150 (5 cột) | ~80 · ~100 · ~90 · 126 | 0 | 80–127 px |
| 1440 SAU | 581,3 · 163,1 · 165,6 · 488 | (Việc ăn dư) · **0 · 0 · 0** | 0 | 1 px (lề trong 16) |
| 1280 SAU | 421,3 · 163,1 · 165,6 · 488 | 19 · **0 · 0 · 0** | 0 | 1 px |

Ghi chú trạng thái: một dòng, trần 440 px rồi cắt "…" bằng CSS (bỏ cắt 60 ký tự), `title` đủ chữ. Không cuộn ngang. Mốc 375: bảng ẩn, thẻ hai tầng; ô "Hoàn thành 7 ngày" một dòng; bộ lọc mỗi hàng một nhãn + ô rộng bằng nhau thẳng mép (lưới 2 cột), ô Chi nhánh rộng cả hàng.

## Bảng thao tác TRƯỚC → SAU (không mất thao tác nào)

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Bấm dòng mở panel · Enter / Space · `?open=` · `?tao=1` | có | giữ |
| Gập / mở nhóm (nhớ theo người) | có | giữ; dải nhóm cùng dáng dải nhóm Công việc (tên 16, "n việc" chữ phụ không ô, "m quá hạn" đỏ) |
| Lọc Nhóm · Trạng thái · Người phụ trách · Chi nhánh · 4 số | có | giữ nguyên |
| Hạn | viên "quá hạn 3 ngày" / "hạn dd/mm/yyyy" | ngày dd/mm/yyyy tô màu chữ (`<Han trongBang>`, NH4); "Chưa có hạn" mờ; dòng "đã dời từ…" giữ |
| Ghi chú tạm ngưng / dừng hẳn | 3 dòng trong ô hẹp | MỘT dòng cắt "…", `title` đủ chữ; đủ chữ ở panel |
| Việc con | cột riêng "n/m xong" hoặc "—" | bỏ cột; "n/m việc con" + "n quá hạn" (đỏ) ở dòng phụ dưới tên việc |
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
5. Tên thẻ trong trang "Việc vận hành" → **"Việc được giao"** (phép kiểm prS3Chu cấm "Việc đã giao"; khớp tên nhóm ở tab Việc quản lý).
