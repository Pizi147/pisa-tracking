# UI-TACH-TRUONG PR 1 — B12 tách trường (mockup `thiet-ke/2026-11-08-audit-ui-mockup.html` #b12)

Ảnh cặp mockup | web (seed 14/09/2026, vai QL Nguyễn Khánh Vy): `case-hv-*`, `luu-tru-*`, `ho-so-gv-*` × 1440 / 375 × tối / sáng.
Mockup B12 chỉ vẽ 1440 (ghi-chu.md): ảnh 375 so với khung 1440 làm tham chiếu.

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Khớp |
|---|---|---|---|
| Dòng Case: kỹ năng · tên + SOS · viên trạng thái + PA mờ · người (biểu tượng) · hạn · ▾ | `students/CotCaseHv.tsx` (lưới 6 cột theo container ≥ 640 px) | case-hv-* | KHỚP |
| BỎ tình trạng PA "đã lên kế hoạch" (trạng thái Case đã nói) | còn ở title khi rê chữ PA | case-hv-* | KHỚP |
| Lưu trữ: bảng Lớp · Trình độ · GVCN · HV từng học · Kết thúc · Tổng kết / Mở lại | `students/LuuTruPage.tsx` dùng `Bang` (375 → thẻ) | luu-tru-* | KHỚP |
| BỎ "Chi nhánh" khỏi dòng (trường đã biết) | GIỮ: thêm cột Chi nhánh khi danh sách lẫn > 1 chi nhánh | luu-tru-* | KHÁC có lý do (không mất thông tin khi xem mọi chi nhánh) |
| Hồ sơ GV: bảng Học viên (lớp dòng phụ) · Case · Việc tiếp (kỳ chữ mờ) · Hạn | `giaoVien/HoSoGiaoVienPage.tsx` `Bang` + thân thẻ 375 riêng | ho-so-gv-* | KHỚP |
| Đầu thẻ "Case đang phụ trách 26 Case" + chip đếm bên phải | GIỮ hàng số to + chip + link "Hiệu quả PA của …" (GV2 đã làm ở nhóm A; mockup không vẽ link) | ho-so-gv-* | KHÁC — ngoài B12, [XM] hỏi PTA nếu muốn dời |
| Vạch đỏ trái hàng Case quá hạn | BỎ (mockup không vẽ; hạn đỏ ⚠ đã báo) | ho-so-gv-* | KHỚP |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Mở / gập Case (bấm dòng, nút ▾) | có | giữ |
| Mở lớp đã kết thúc | bấm cả thẻ | bấm mã lớp |
| Tổng kết / Mở lại lớp | nút | giữ |
| Hồ sơ GV: mở HV, mở Case, mở việc | link | giữ (Case, việc: chữ thường, rê → màu nhấn + gạch) |

Dòng đọc Turso: không đổi (chỉ đổi cách vẽ dữ liệu đã nạp; không thêm request).
