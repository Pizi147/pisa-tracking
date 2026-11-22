# NHẸ HƠN PR-5 · CUỐI KHOÁ — khớp / khác

Khung: `thiet-ke/v23/cuoi-khoa.html` + `cuoi-khoa-ghi-chu.md` (XM-8, XM-14). Kế hoạch: `docs/superpowers/plans/2026-11-22-nhe-hon.md` "PR-5".
PTA Plan chốt 22/11: XM-A giữ áp ngay · XM-B giữ nhóm theo gợi ý Final · XM-C giữ trang con `?xem=cuoi-khoa` · XM-8 sửa ghi chú tại dòng.

Ảnh cặp (seed, Head `userId 2`, MB FOU 21; 2 em chốt Lên FT trên giao diện + điểm MT0 ghi vào DB demo để có số):
- `cap-k1-1440-toi.png` — K1: 3 em chọn, hộp điểm MT0 mở (Đỗ Bảo Linh).
- `cap-k3-375-sang.png` — K3: 2 em chọn, thanh chọn dính đáy.

## Mốc tô màu (XM-14) — dữ liệu thật, không số mockup

| Ô | Đạt khi | Hàm |
|---|---|---|
| Final tổng / kỹ năng (%) | ≥ ngưỡng đạt của LỚP (`cuoiKhoa.nguong`, mặc định 70 %) | `datFinalMon` = luật `daiCuoiKhoa` |
| MT0 Overall (band) | `kqdr.goiY.dat` | `goiYKyVong` (mốc FOU 4 · BE 4 · ELE 4.5) |
| MT0 kỹ năng | band ≥ mốc chương trình | `datMt0Mon` = luật `monTruot` |

Phép kiểm CK-9 (`prCuoiKhoa.tests.ts`) so hai hàm mới với `daiCuoiKhoa` / `goiYKyVong` ở biên (0.6999 / 0.7, FOU 3.5 / 4, ELE 4 / 4.5).

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| K1 ① thanh một hàng: tick · n em đã chọn › Bước tiếp › Lớp › Tuần · Bỏ chọn …… Lọc | toolbar trong `CuoiKhoaLop.tsx` (gộp hàng "Chọn tất cả / Lọc" và hàng áp cũ) | K1 | KHỚP · không nút "Áp cho n em" (XM-A: áp ngay) · thêm "Ngay hôm nay" (GIỮ) |
| K1 ② Kỳ vọng FT một dòng + ⓘ | dòng `demKv` (cùng hàm `kvTrang` với ô) + `NutLuat` | K1, K3 | KHỚP · chỉ hiện khi lớp có em Lên FT |
| K1 ③ cột Final · MT0 (nút ✓ / ✗, bấm mở hộp kỹ năng) | `oFinal` · `oMt0` · `hopDiemCua` trong `HopNeo` | K1 | KHỚP · màu Đạt = **xanh dương** (MK-6), mockup vẽ xanh lá → [XM-15] |
| K1 ③ cột Kỳ vọng FT (✓ Đạt / Head cân nhắc / —) | `oKv` | K1 | KHỚP · thêm "✗ Không đạt", "Chờ MT0" |
| K1 ③ Bước tiếp ▾ · Lớp mới ▾ · Tuần ▾ | `<select>` (thay 4 chip) · `ChonLop gon` · `OTuan gon` | K1 | KHỚP |
| K1 bỏ cột Kết quả | hộp điểm to cũ (`oKetQua`) | — | BỎ (chủ SP) |
| K1 ④ bỏ "+ Ghi chú"; ghi chú cũ chữ nhỏ dưới tên | `oPhu` | — | KHỚP (XM-8: sửa tại dòng) |
| K1 ⑤ nhóm, tick "chọn cả nhóm" (một phần = vạch) | `daiNhom` | K1, K3 | KHỚP · tên nhóm theo gợi ý (XM-B) |
| K1 ⑥ ô tick theo theme | `input[type=checkbox]` (index.css, SUA-2211-A) | K1, K3 | KHỚP |
| K1 ⑦ chân: Lưu nháp · Chốt · n em | `chan` | K1 | KHỚP · GIỮ dòng "Khi chốt: …" (hậu quả) |
| K1 đầu panel ⓘ · ⋯ · ✕ | đầu trang con: tiêu đề · meta · "hạn chốt dd/mm/yyyy" · n/n đã chốt · ⓘ quy chế | K1 | KHÁC: trang con (XM-C), không ✕; không ⋯ vì trang không có thao tác cấp lớp (Bàn giao / Huỷ ở từng em) |
| K2 lỗi một phần: nền đỏ nhạt, lý do dưới tên, Thử lại n em | dòng `loi[e.id]` nền `--bad-bg`, `oPhu` lỗi; chân Đóng · Thử lại n em (đã có) | — | KHỚP theo mã (lỗi mạng `guiTheoLo` ghi từng em) |
| K3 thẻ hai dòng, thanh dính đáy lưới 2 cột | dòng < 1280 `xl:hidden` + "Sửa" mở ô; toolbar 375 trong chân dính | K3 | KHỚP · Kỳ vọng ở dòng 2 (không góc phải) |
| K4 "Mọi em đã chốt" | `Empty` (giữ chữ) | — | GIỮ |
| Hàng "Quy chế" ở chân | ⓘ đầu trang | — | BỎ (luật chung NHẸ HƠN) |
| Bàn giao (khung không vẽ) | chip "Chờ / Đã / Quá hạn bàn giao" dưới tên, bấm mở `BanGiaoPanel` | K1 | GIỮ (bỏ cột riêng) |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Chọn em / cả nhóm / tất cả / Bỏ chọn | giữ (ô tất cả có trạng thái một phần) |
| Bước tiếp: 4 chip mỗi dòng + thanh | ô chọn ▾ (gợi ý ghi "· gợi ý"); chọn "Chưa có hướng" = bỏ hướng |
| Lớp từng dòng / cả nhóm / thanh, + Mở lớp mới… | giữ |
| Tuần: thanh + cả nhóm (dòng chỉ hiện chữ) | giữ + **ô Tuần từng dòng** |
| Ngay hôm nay (thanh) | giữ |
| Kỳ vọng FT Đạt / Không đạt / nguyên nhân / kỹ năng / phương án | giữ (khối dưới dòng; < 1280 mở bằng "Sửa") |
| Target + KCK, Tạm dừng · Có thể quay lại · Xem lại, Lý do | giữ |
| **+ Ghi chú** | **bỏ** (chủ SP); ghi chú đã có vẫn hiện và sửa tại dòng |
| Xem điểm từng môn: hộp to luôn mở | bấm nút điểm → hộp nổi (Final + MT0) |
| Bàn giao (cột) | chip dưới tên, bấm như cũ |
| Lọc: Lỗi · Chưa chốt · Xét lại · Còn bàn giao | giữ |
| Lưu nháp · Chốt · Thử lại n em · Đóng · Hoàn tác (Ngay hôm nay) · Sửa · Bỏ sửa · Huỷ quyết định | giữ |
| GVCN: Nhận xét từng em + "Ghi cho n em" + Lưu nhận xét | giữ |

## Turso
Không đổi máy chủ: `GET /classes/:id/transition` đã trả `cuoiKhoa.nguong`, `kqdr.goiY`, `kqdr.bands` → +0 câu, +0 dòng.

## [XM]
- [XM-15] Màu "Đạt": khung v23 vẽ ✓ xanh lá; luật hiện có MK-4 / MK-6 (phép kiểm `prMauKq`) — Đạt lớp thường = xanh dương, xanh lá chỉ "vượt". Web theo luật (xanh dương). Chủ SP muốn xanh lá thì đổi luật MK-4 trước.
- Kỳ vọng FT ở dòng đã chốt Lên FT vẫn có khối Đạt / Không đạt dưới dòng (≥ 1280) — thao tác cũ, khung không vẽ.

## Chú thích `ponytail:` — không có.
