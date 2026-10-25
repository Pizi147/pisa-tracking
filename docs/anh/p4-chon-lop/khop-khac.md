# P4 CHON-LOP — khớp / khác, thao tác trước → sau

Nguồn: `docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md` mục 3.8 (R6.3b) · plan `docs/superpowers/plans/2026-10-24-p4-chon-lop.md`.
Không đổi bố cục trang, luật, quyền, API. Mỗi nơi giữ ĐÚNG tập lớp cũ (lọc chi nhánh / chương trình / FT / quyền do nơi gọi).

## Một ô chọn lớp (`web/src/ui/ChonLop.tsx`)
- Chưa chọn: ô gõ "Gõ tên lớp…" → bấm / focus mở danh sách (mã lớp + dòng phụ) → gõ lọc không dấu, bỏ khoảng trắng ("ft101" ra "MB FT 101", đ = d) → ↑ ↓ Enter / bấm chọn; Esc đóng danh sách (không đóng panel); Tab rời ô: chữ gõ khớp đúng 1 lớp thì chọn lớp đó.
- Đã chọn: "mã · dòng phụ" + ✕ (bỏ chọn → focus về ô gõ, danh sách mở). Ô tắt / chỉ xem: không ✕.
- Danh sách rỗng: câu "Không có lớp để chọn" (hoặc "Đang tải…"), không ô trắng. Gõ không khớp: "Không có lớp khớp “…”".
- Lớp đang chọn không còn trong danh sách: hiện mã cũ (`maCu`), không tự đổi lớp.
- Lỗi ô (`useLoiForm`): `{...lf.o(loi, 'lop')}` gắn thẳng — id, rời ô, viền lỗi như `<select>` cũ.
- Ô "Thêm lớp" (chip nhiều lớp): sau mỗi lần chọn ô trống lại và mở tiếp; danh sách nổi trên nội dung (không đẩy chip).

## Thao tác TRƯỚC → SAU

| Nơi | Trước | Sau | Ghi chú |
|---|---|---|---|
| Chuyển lớp (một em + nhiều em) | `OLopDich` riêng | `ChonLop` (cùng hành vi) | gỡ `OLopDich` |
| Sửa thông tin HV › Học lại › Sang lớp mới | `<select>` "Chọn lớp" | `ChonLop`, dòng phụ chương trình · GVCN · sĩ số | bỏ lớp cũ khỏi danh sách như trước |
| Xem trước hàng loạt › Học lại › Sang lớp mới | `<select>` | `ChonLop` (chỉ lớp thường như trước) | |
| Bước tiếp sau thi › Lớp khác | `<select>` | `ChonLop` | "Đang tải…" giữ |
| Công việc › Sau thi (TVV) › Lớp khác | `<select>` | `ChonLop` | |
| Thêm học viên › Thêm vào lớp | `<select>` | `ChonLop`, dòng phụ chương trình | đổi lớp vẫn xoá tuần / xem trước như cũ |
| Kế hoạch Test › Xếp lịch Test (lớp thường) | `<select>` | `ChonLop`, dòng phụ chi nhánh · sĩ số | nút chương trình lọc lớp giữ |
| Kế hoạch Test › Xếp nhiều MT › Thêm lớp | `<select>` "+ lớp" | `ChonLop` "+ lớp", thêm liên tiếp | chip ✕ giữ |
| Kế hoạch Test › Xếp theo học viên › Thêm lớp | `<select>` "+ lớp" | như trên | |
| Công việc › Vận hành › Giao việc › Giao GV theo lớp + kỹ năng › Lớp | `<select>` "Chọn lớp" | `ChonLop` "Chọn lớp", dòng phụ "{n} em" | PTA Plan gộp vào P4 (25/10) |
| Kế hoạch Test › Xuất điểm Test › Lớp | `<select>` (luôn có lớp) | `ChonLop`; bỏ chọn được → "Chọn lớp." + nút Xuất tắt (luật cũ) | |

Không mất thao tác nào. Không chạm: `BangLoTrinhTiep`, `TransitionPanel` (P9), bộ lọc "Mọi lớp" (Học viên, Phân tích, Chấm Speaking).

## Ảnh (seed demo, QL Monbay)
- `them-hv-1440-toi-go.jpg` · `them-hv-375-sang-khong-khop.jpg`
- `xep-nhieu-mt-1440-toi-them-lop.jpg` · `xep-nhieu-mt-375-sang-them-lop.jpg`
- `xuat-diem-1440-toi-da-chon.jpg` · `xuat-diem-375-sang-bo-chon.jpg`

## Bấm thử (seed demo, 1440 tối, QL Monbay; Sau thi bằng TVV Monbay)
Mỗi nơi: gõ → ra lớp, chọn, ✕ bỏ chọn (focus về ô gõ, danh sách mở), gửi form khi ô trống → viền đỏ + "Còn n ô cần sửa ↑" đưa focus vào ô.
Seed không có lớp "be05" → dùng "be03".

| Nơi | Gõ / chọn / ✕ | Lỗi khi gửi | Ghi chú |
|---|---|---|---|
| Sửa thông tin HV › Học lại › Sang lớp mới | đạt ("fou" → MB FOU 12) | đạt | |
| Xem trước hàng loạt › Học lại | đạt | đạt | "ft101" → "Không có lớp khớp" (chỉ lớp thường — như cũ) |
| Bước tiếp sau thi (hồ sơ HV › KQ thi thật) › Lớp khác | đạt ("ft102", "be03") | đạt | lớp hiện tại của em không trong danh sách (đã có "Lớp này") |
| Công việc › Sau thi (TVV) › Lớp khác | đạt | đạt | |
| Chuyển lớp (một em) | đạt ("ft101", "be03") | viền đỏ + "Chưa chọn" | chân panel này vốn ghi "Còn thiếu: …", không có nút nhảy ô — như trước P4 |
| Chuyển lớp (nhiều em, `?viec=xet-lai`) | **chưa thử được** | — | seed không có em cần xét lại ở lớp nào (`/xet-lai-lo-trinh` rỗng); cùng component, CL-1 đọc nguồn |
| Xếp nhiều MT › Xếp theo tuần › Thêm lớp | đạt (thêm liên tiếp, ô trống lại, lớp đã thêm không hiện lại) | — (không có lỗi ô) | |
| Xếp nhiều MT › Xếp theo học viên › Thêm lớp | đạt (chỉ lớp FT) | — | |
| Xếp lịch Test (lớp thường) | đạt; mở từ dòng MB FOU 12 → ô hiện "MB FOU 12 · Monbay · 7 em" | — | danh sách theo chương trình đang chọn (như cũ); ✕ → "Chọn một lớp để xếp lịch." |
| Giao GV theo lớp + kỹ năng | đạt ("ft101", "be03") | đạt (sau khi điền Nội dung, focus vào ô Lớp) | |
| Thêm học viên, Xuất điểm Test | đạt (lần trước, có ảnh) | — | |

