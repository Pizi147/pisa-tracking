# v23 ⑤ Panel chấm điểm — ghi chú

Mockup: [`panel-cham-diem.html`](panel-cham-diem.html) · ảnh `anh/panel-cham-diem-*.png`. Đặc tả mục 3 "Panel chấm điểm".

## Truy vết

| Ý / mục | Khung | Thành phần web |
|---|---|---|
| ý 9b: panel chấm hẹp, tên lớp không phân biệt, chỗ trống một đống | C1 | `PanelNhapDiemLop.tsx` / `PanelViecLuoi` → `KhungPanel rong="bang"` (75 %) |
| Mỗi lớp một khối, đầu nổi: lớp · tuần · kỹ năng · số bài | C1, C3 | đầu khối lớp (nền surface-2, vạch nhấn, mã 16 / 700) |
| Lưới gọn tên · ô · kết quả, cùng cột giữa các lớp | C1 | `table.luoi` → colgroup chung (tên 1fr · 6 ô 88 · Kết quả 168) |
| **W1 / W2 tách** (chủ SP 22/11 trong phiên) | C1–C3 | cột W1, W2 riêng (ô nhập theo task — như `HopNhapDiem` W1 / W2) |
| ý 11: điểm huỷ rõ (hình; logic SUA-2211) | C1, C2 | `ODiemMt` dáng `huy` + nhãn ở cột Kết quả + ⓘ (Khôi phục) |
| "−" vắng | C1, C3 | ô `vang` |
| ý 7: hộp ⓘ / hộp nhập không bị cắt | C2 | neo + lật (`floating`), max-width theo khung |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Bấm ô → hộp nhập (Vắng · Lưu · bài tiếp ›, "Tiếp: …") | giữ (C2) |
| Lớp tiếp: {mã} › · Việc tiếp › · Đóng | giữ (C4); chân "Bài thiếu tiếp ›" = V12 ⑤ |
| Khôi phục điểm huỷ | giữ, trong ⓘ |
| Link lớp / tên em | giữ |
| "đã huỷ" dưới ô | bỏ, thay nhãn ở cột Kết quả |

## Tự rà

- 75 %, khối lớp đầu nổi, lưới gọn, huỷ rõ, "−" vắng: đạt. Các lớp thẳng cột: đạt (cùng colgroup).
- Trạng thái: có việc / quá hạn (C1) · đã lưu (C1, C3) · lỗi máy chủ (C2) · xong phần của bạn (C4).
- 375: Overall giữ, Kết quả ẩn (nhãn huỷ dưới tên) — 4 ô 44 px, tên không cắt.

## [XM]

- [XM-6] Overall ở lưới khi chỉ có W1 / W2 riêng: Writing band = (W1 + 2·W2) / 3 do máy chủ tính (giữ) — mockup không thêm cột "W".

Critique: **36 / 40**, không P0 / P1.

## Góp ý chủ SP 22/11 (qua PTA Plan) — đã sửa

| Góp ý | Sửa |
|---|---|
| 4 chữ dài | ⓘ điểm huỷ tách 2 dòng (ai huỷ · giờ đậm / lý do xám, số buổi đậm) · lỗi trong hộp nhập: "Chưa lưu được" đậm, bước tiếp xuống dòng |
| 2 khối Phụ trách | không áp — nhập điểm là ngoại lệ chủ SP nêu |

## Góp ý chủ SP 22/11 vòng 2 (qua PTA Plan) — đã sửa

- Luật hạn: mọi ngày dd/mm/yyyy, hạn vàng khi còn ≤ 2 ngày, đỏ quá hạn; "quá hạn n ngày" chỉ ở dòng Công việc / đầu panel (hồ sơ HV · Phối hợp SOS chỉ tô đỏ ngày). Thang 375: ngày dưới chấm ẩn (rê / bấm xem), "kế tiếp" giữ.
