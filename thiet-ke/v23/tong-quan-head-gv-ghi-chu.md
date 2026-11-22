# v23 ⑩ Tổng quan Head › khối Giáo viên — ghi chú nguồn số (PTA Plan chốt 22/11)

Mockup: [`tong-quan-head-gv.html`](tong-quan-head-gv.html) · dùng lại trong [`tong-quan.html`](tong-quan.html) khung T1 (Head) và T4 (Quản trị). Truy vết + thao tác: [`cong-viec-head-ghi-chu.md`](cong-viec-head-ghi-chu.md).

## Turso — đã chốt: +0 câu

- **KHÔNG** gọi thêm `/my-work?nguoi=tat-ca` ở Tổng quan, **không** chạy `myWork(..., 'tat-ca')` bên trong `tong-quan/v5` (đường đó đã vượt trần ~30 câu). Phương án "trả kèm mảng đếm từ myWork" trước đây **bỏ**.
- Nguồn: dữ liệu khối Giáo viên **đang có** trong `tong-quan/v5` (việc chưa làm / bài quá hạn theo GV — bảng "GV cần chú ý" hiện nay). PR code tách số quá hạn **theo loại việc ngay trong câu đang có** (nhóm theo cột loại sẵn trong kết quả), không thêm câu.
- **Nếu không tách được theo loại mà không thêm câu:** khối chỉ hiện tên GV · số quá hạn · quá hạn lâu nhất; **bỏ cột "Loại"**. Bấm số → Công việc "Của GV" lọc đúng GV — ở đó đã có số theo loại (đầu mục nổi). Cột "Loại" trong mockup chỉ giữ khi tách được với +0 câu.
- Đo trước → sau trong mô tả PR (`server/src/tests/tocDoDuong.ts`, đường `tong-quan/v5`): số câu không đổi.

## Ghi cho PR code (liên quan)

- **XM-14 (Cuối khoá):** mốc tô màu đạt / trượt của Final và MT0 trong mockup (Final 60 %, MT0 5.0) là số giả — PR code đọc **mốc thật từ dữ liệu** (mốc Final của chương trình lớp, kỳ vọng FT của lượt MT0).
