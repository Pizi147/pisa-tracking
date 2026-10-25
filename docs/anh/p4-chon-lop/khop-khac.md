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
| Kế hoạch Test › Xuất điểm Test › Lớp | `<select>` (luôn có lớp) | `ChonLop`; bỏ chọn được → "Chọn lớp." + nút Xuất tắt (luật cũ) | |

Không mất thao tác nào. Không chạm: `BangLoTrinhTiep`, `TransitionPanel` (P9), bộ lọc "Mọi lớp" (Học viên, Phân tích, Chấm Speaking).

## Ảnh (seed demo, QL Monbay)
- `them-hv-1440-toi-go.jpg` · `them-hv-375-sang-khong-khop.jpg`
- `xep-nhieu-mt-1440-toi-them-lop.jpg` · `xep-nhieu-mt-375-sang-them-lop.jpg`
- `xuat-diem-1440-toi-da-chon.jpg` · `xuat-diem-375-sang-bo-chon.jpg`

## Còn lại (ngoài phạm vi plan)
- `worklist/MgmtTasksPage.tsx:752` còn `<select>` lớp (form việc quản lý) — plan P4 không liệt kê; hỏi PTA Plan có gộp vào P4 / PR sau.
