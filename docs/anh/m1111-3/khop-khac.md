# M1111-3 · Cuối khoá lớp thường (chuyển tiếp lộ trình) — khớp / khác mockup

Mockup đã duyệt: `thiet-ke/2026-11-11-mockup-1111/3-chuyen-tiep-lop-thuong.html` (#1326, chủ SP duyệt 11/11 + chỉnh: hộp điểm riêng, ô môn thẳng cột, hàng cao đều; tổng giữ %, ô môn ghi câu đúng / tổng).
Ảnh cặp (seed): `cap-mo-1440.png` (K1 · QL · MB FOU 21 vừa mở) · `cap-1440.png` (K2 · chọn lớp dải + sửa 2 em) · `cap-375.png` (K6a) · `cap-gvcn-1440.png` (K4 so với web GVCN · MB FOU 15 trước Final) · `cap-gvcn-375.png`.

**Chủ SP rà ảnh 11/11:** (1) "để màu xanh lá cho những cái đạt đi" → % tổng đạt + ô môn đạt dùng token đạt `kq-vuot` (như ✓ bảng Mock Test), viền ô đạt xanh nhạt, trượt giữ đỏ · (2) trước Final "cần có phần trăm điểm tổng, và bao nhiêu câu trên bao nhiêu câu" → hộp điểm dùng lượt Progress: "Chờ Final · Progress 07/09 · 80 %" + ô môn "✓ 18/20"; em chưa có lượt nào giữ "—". Máy chủ: `progress.mon` (đúng / tổng) từ cùng lần `tyLeTongLo` — 0 câu thêm.

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Mã | Kết quả |
|---|---|---|---|
| K1 | nhóm theo gợi ý Final: nhóm ≥ 2 em = dải (vạch trái theo nhóm, ô tick cả nhóm, **ô Lớp + Tuần cho cả nhóm** thẳng cột "Lớp mới"); nhóm 1 em = nhãn dưới tên, sau đường kẻ đậm | `CuoiKhoaLop.tsx` `daiNhom`, `nhomCua`, `HUONG_NHOM` | KHỚP |
| K1 | hộp điểm riêng: % tổng to ✓/✗ + 4 ô môn rộng 68 px thẳng cột, mỗi ô môn · ✓/✗ · câu đúng / tổng; môn chưa có điểm giữ "—" | `oKetQua`; máy chủ `cuoiKhoa.mon` thêm `dung` / `tong` | KHỚP |
| K1 | 4 cột rộng cố định (Học viên 210 · Kết quả 316 · Bước tiếp 400 · Lớp mới), Bàn giao chỉ khi đã có em chốt | `LUOI` | KHỚP |
| K1 | Bước tiếp = 4 chip một bấm, gợi ý viền đứt; bấm chip đang chọn = bỏ hướng | `oHuong`, `chonHuong` | KHỚP |
| K1 | dải chữ nhỏ dưới hàng chạy hết bề ngang: GVCN · + bổ trợ · ⚠ lý do · nháp · lỗi · + Ghi chú (hàng cao đều) | `oPhu` | KHỚP |
| K2 | chọn lớp ở dải → em trong nhóm đang chọn đúng bước nhận lớp, dòng không lặp ô lớp ("Đổi lớp" khi rê); em ngoài dải bấm chip trùng bước → lớp điền sẵn | `chonLopNhom`, `theoNhom`, `chonHuong` | KHỚP |
| K2 | mở dưới hàng khi cần: Tạm dừng (quay lại · xem lại · lý do) / Lên FT (Target, Kỳ vọng) / + Ghi chú | `oDuoi` (giữ `oKyVong`) | KHỚP |
| K3 | sau chốt: khoá + chữ hướng + "Sửa"; cột Bàn giao; dải "✓ Đã chốt n em"; lỗi giữ dòng; "Thử lại n em" luôn bật (chân) | giữ logic `chot` / `ketThuc` | KHỚP theo mã (chưa chụp — cần chốt thật trên seed) |
| K4 | chọn nhiều → thanh áp: Bước tiếp (chip) · Lớp · Tuần · Kỳ vọng FT — **áp ngay**, bỏ nút "Áp cho n em" | `apNgay` → `apCho(a)` | KHỚP |
| K5 | GVCN: cùng nhóm, Kết quả hộp điểm, "Hướng · QL chốt", ô Nhận xét | `dongEm` (laQl = false) | KHỚP |
| K6 | 375: hộp điểm dưới tên, 4 ô môn một hàng, chip 3 + 1 hàng, "Đổi lớp" luôn hiện | lớp `max-xl:` | KHỚP |
| — | dải nhóm: ⓘ luật dải (≥ 60 % …) | — | KHÁC: chỉ dải "Chờ Final" có ⓘ — ngưỡng dải đọc theo lớp (`nguong_dat`), không viết cứng số % |
| — | tên em có "đã sửa" làm nhãn nhóm xuống dòng (Phan Quang Nam) | — | KHÁC nhỏ (giữ badge "đã sửa" của web) |
| — | 375 cũ: thẻ gọn "hướng · lớp" + nút "Sửa" mở ô; tấm "Áp cho n em…" | — | ĐỔI: 375 hiện chip / lớp ngay (mockup K6), thanh áp cùng hàng |

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Xem kết quả Final + gợi ý | 2 cột (Kết quả đầu ra · Gợi ý) | hộp điểm + nhóm theo gợi ý |
| Chọn hướng một em | ô thả (2 bấm) | chip (1 bấm) |
| Chọn lớp cho cả nhóm | chip "Chọn nhóm" → thanh Áp → Lớp → Áp → Bỏ chọn | ô Lớp trên dải nhóm |
| Chọn tất cả | chip "Chọn tất cả · n" | ô "Chọn tất cả · n" hàng công cụ; ô tick đầu dải = cả nhóm |
| Áp chung cho em đã chọn | thanh Áp + "Áp cho n em" (375: tấm) | thanh áp, chọn là áp ngay |
| Lớp riêng · + Mở lớp mới… | ô gõ tìm trên dòng | ô lớp trên dòng / "Đổi lớp" (dòng theo nhóm) — "+ Mở lớp mới…" cả dải và dòng |
| Tuần · Ngay hôm nay | thanh Áp | dải nhóm (Tuần) + thanh áp (Ngay hôm nay · tuần); vẫn hỏi một lần khi chốt "ngay hôm nay" |
| Lý do / Ghi chú cho GV lớp mới / quay lại · xem lại / Target / Kỳ vọng FT | trong ô Hướng | mở dưới hàng khi cần; "+ Ghi chú" ở dải chữ dưới hàng |
| Lọc Lỗi · Chưa chốt · Xét lại · Còn bàn giao | chip | GIỮ |
| Lưu nháp · Chốt · n em · Thử lại n em · Reset bậc vi phạm | chân | GIỮ |
| Sửa · Huỷ quyết định · Bàn giao · Xét lại | dòng đã chốt | GIỮ |
| GVCN nhận xét · QL đọc nhận xét | cột Nhận xét · dòng dưới Gợi ý | GIỮ — QL đọc ở dải chữ dưới hàng |
| Từng em từ hồ sơ HV | trang lớp, em chọn sẵn, cuộn tới | GIỮ (`ck-em-{id}`) |

## Đọc Turso / tốc độ

0 request thêm, 0 câu SQL thêm: `GET /classes/:id/transition` trả thêm `dung` / `tong` từng môn từ chính `raw_score` / `raw_total` đã đọc (`tinhTyLeTongLo`). Nhóm / lớp nhóm tính trên dữ liệu đã nạp. Phép kiểm `M1111-4`.
