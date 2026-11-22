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

- [XM-7] Cột "Đợt" vẫn là phần co giãn (1fr) ở bảng lớp; lưới mở dùng phần đó cho ô điểm nên không còn trống.

Critique: **35 / 40**, không P0 / P1.

## Góp ý chủ SP 22/11 (qua PTA Plan) — đã sửa

| Góp ý | Sửa |
|---|---|
| 3 cột cân đối hơn, Kết quả rộng quá | bảng lớp: Kỹ năng 150 · Hạn chấm 140 · Tiến độ 180 · Trạng thái 180; lưới mở: 6 cột số (L R W1 W2 S Overall) **chia đều**, Kết quả **180** — trùng đúng cột Trạng thái phía trên → hai tầng thẳng hàng |

## Góp ý chủ SP 22/11 vòng 2 (qua PTA Plan) — đã sửa

| Góp ý | Sửa |
|---|---|
| 3 bỏ cột "Kỹ năng" | bảng lớp: Lớp 220 · Đợt 1fr · Hạn chấm 140 · Tiến độ 180 · Trạng thái 180 (375 bỏ "L R W S" ở dòng phụ) |
| 2 luật hạn (bảng báo cáo) | cột Hạn chấm: ngày dd/mm/yyyy tô đỏ / vàng; Trạng thái "Đang chấm" — bỏ chip "Quá hạn n ngày" (đầu thẻ "Quá hạn chấm" đã nói) |
| 4 TVV xem Lịch Test tuần | việc code (quyền `test.view` + menu), không vẽ |

## N65 (plan.md 1.6, chủ SP 22/11)

Head / Quản trị ở trang XEM (Lịch Test tuần, xem điểm, Kế hoạch Test chỉ xem, HV & Lớp) luôn thấy tất cả, **không có nút "Lớp tôi dạy"**. Mockup `lich-test.html` không có nút đó (đã kiểm) — không phải sửa; PR code bỏ nút nếu web đang có cho Head / QT.
