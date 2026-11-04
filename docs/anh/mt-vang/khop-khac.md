# PR-MT-VANG — khớp / khác và thao tác trước → sau

Đặc tả: `docs/superpowers/specs/2026-11-04-luat-mt-thong-nhat-design.md` (N38, L1–L7). Mockup tham chiếu: `thiet-ke/v11/ke-hoach-test.html` khu C
(hộp kỹ năng: mỗi môn `Dời · Vắng · Bỏ khỏi đợt`).

## Ảnh

| Ảnh | Nội dung |
|---|---|
| `truoc-hop-1440-toi.png` | Trước: hộp MT1 của em vắng 2 lần — ô tích + ⋯ 5 mục, dòng L có `Khôi phục → Chưa xếp` · `Giữ huỷ` |
| `sau-hop-1440-toi.png` | Sau: cùng em, cùng dữ liệu — mỗi môn `Dời · Vắng · Bỏ khỏi đợt` + ⋯ |
| `sau-hop-doi-1440-toi.png` | Sau: bấm Dời ở dòng L (huỷ · vắng 2 lần) — bộ chọn tuần ngay trên dòng, đúng tuần cũ vẫn Lưu được |
| `truoc-hop-375-sang.png` · `sau-hop-375-sang.png` | 375 sáng: ba nút xuống dòng dưới tên môn, vùng bấm 44 px |

## Thao tác trước → sau

| Trước PR | Sau PR | Lý do |
|---|---|---|
| Ô tích từng môn (bỏ tích = bỏ khỏi đợt, tích = đưa lại) | Nút **Bỏ khỏi đợt** (bật / tắt, lưu cùng Lưu); đưa lại = **Dời** chọn tuần | U05 "nút riêng cho từng môn"; L6 |
| ⋯ **Đổi tuần** | Nút **Dời** trên dòng | U05 |
| ⋯ **Vắng** | Nút **Vắng** trên dòng | U05 |
| ⋯ Dời hạn chấm · Huỷ điểm · Nhật ký | GIỮ trong ⋯ | giữ thao tác cũ |
| Dòng huỷ vắng 2 lần: **Khôi phục → Chưa xếp** · **Giữ huỷ** | BỎ — Dời (chọn tuần = xếp lại từ đầu); huỷ đã là kết cục | L2, L5, L6 |
| Dòng vắng (thẻ cũ): ⋯ Đổi tuần = **Xếp lại bài vắng** (hộp riêng, +1 lần vắng) | Dời (lần vắng về 0, thẻ cũ tự rút) | L5 |
| Dòng đã huỷ (thẻ cũ): **Khôi phục và đặt tuần** / **Đưa lại vào đợt** | Dời | L5 |
| Hồ sơ Mock: nút **Xếp lại bài vắng** (`/absence-move`), **Không mock lại**, **Đưa lại vào đợt** | Dời lịch (mở hộp kỹ năng) | L5, L6 |
| Vắng / Dời hạn / Huỷ điểm khi hộp còn thay đổi chưa lưu: chạy ngay rồi đóng hộp (mất phần đang sửa) | Mờ, "Lưu hoặc huỷ thay đổi trước" (như Xóa lịch) | chống mất dữ liệu |
| Lớp thường: menu ô lưới "Xếp lại bài vắng" | "Dời lịch" (cùng quyền máy chủ `doiLich`) | một tên |

## Khớp / khác mockup (hộp kỹ năng)

| Phần | Kết quả | Ghi chú |
|---|---|---|
| Tên môn ngắn `L` cột trái | KHỚP | tên đầy đủ ở tooltip + nhãn đọc màn hình của từng nút |
| Ba nút `Dời · Vắng · Bỏ khỏi đợt` cỡ nhỏ, căn phải | KHỚP | `btn btn-sm` (mẫu nút sẵn có) |
| Tuần + trạng thái giữa dòng | KHỚP | dùng chip tuần / chip trạng thái sẵn có |
| ⋯ sau ba nút | KHÁC (thêm) | giữ Dời hạn chấm · Huỷ điểm · Nhật ký — thao tác cũ, mockup không vẽ |
| Nhóm "Cả lượt" (Dời cả lượt… · Huỷ cả lượt…) | KHÁC (giữ như nay) | ngoài phạm vi PR này (Tuần chung + ⋯ đầu hộp Xóa lịch giữ) |
