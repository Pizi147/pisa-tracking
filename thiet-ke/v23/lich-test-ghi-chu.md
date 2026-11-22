# v23 ⑥ Lịch Test tuần — ghi chú

Mockup: [`lich-test.html`](lich-test.html) · ảnh `anh/lich-test-*.png`. Đặc tả mục 1 "Luật bảng chung", 3 "Lịch Test tuần". Dữ liệu dựng giống ảnh chủ SP (Quá hạn chấm · Test tuần này).

## Truy vết

| Ý / mục | Khung | Thành phần web |
|---|---|---|
| ý 1: cột lôm côm, thống nhất cho cân đối | L1 | bảng Lịch Test tuần (`web/src/modules/test/…`): MỘT colgroup cho mọi thẻ |
| Bộ cột cố định lớp · đợt · kỹ năng · hạn · tiến độ · trạng thái | L1 | Lớp 220 · Đợt 1fr · Kỹ năng 132 · Hạn chấm 116 · Tiến độ 150 · Trạng thái 150 |
| Lưới mở cùng cột tên, các lớp thẳng hàng | L1 | lưới mở dưới hàng: chevron + 220 = cột tên; ô điểm 84 đều |
| W1 / W2 tách | L1, L2 | lưới L R W1 W2 S |
| Tên HV không cắt, mã tuần một dòng | L1, L2 | `.ten-hv` nowrap / 375 xuống dòng |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| ‹ tuần › · Tuần này | giữ |
| Bấm hàng lớp → mở lưới dưới hàng | giữ |
| Bấm ô điểm → hộp nhập | giữ |
| Link lớp / em | giữ |
| Tab Kế hoạch Test · Thi thật | giữ |

## Tự rà

- Một bộ cột, hai thẻ thẳng cột: đạt (đo trên ảnh: cột Hạn chấm x = 1009 ở cả hai thẻ). Lưới cùng cột tên: đạt. ≤ 1 điểm màu / hàng: đạt.
- Trạng thái: quá hạn · đang chấm · đủ · chưa thi (L1) · 375 (L2) · rỗng (L3a) · lỗi (L3b).

## [XM]

- [XM-7] Cột "Đợt" chiếm phần còn lại (1fr) nên rộng ở 1440; nếu chủ SP thấy trống, PR có thể chuyển 1fr sang cột Lớp (tên lớp dài kiểu "MB FT 116 (Sáng T7)").

Critique: **35 / 40**, không P0 / P1.
