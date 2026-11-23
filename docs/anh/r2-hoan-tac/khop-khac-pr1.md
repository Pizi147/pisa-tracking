# R2 PR1 — Hoàn tác lịch / lớp / HV (C1 C2 C4 C5 C6 C7) · khop-khac

Nguồn: `docs/superpowers/specs/2026-11-24-ra-chan-cung/bao-cao.md` mục 2. Đã đọc mã xác nhận cả 6 điểm đúng (không điểm nào sai).

| # | Thao tác | TRƯỚC | SAU |
|---|---|---|---|
| C1 | Đổi mốc lớp (Khai giảng / Progress / Final) | Toast "Đã lưu", dời bài + việc cả lớp, muốn về phải gõ lại | Toast **Hoàn tác** gửi lại mốc cũ qua cùng PATCH (máy chủ dời bài + việc về) |
| C2 | Xếp lịch Test lô (Xếp lịch Test · Xếp nhiều MT · Xếp theo học viên) | Sai thì xoá từng em; từ T6 vướng N15 | Máy chủ chụp lịch các em (`ghi_dao`) → toast **Hoàn tác** về y như trước; `POST /ke-hoach-test/hoan-tac`; 15 phút, miễn N15 ngay sau lưu; đổi tiếp sau đó → 409 |
| C4 | Sửa cả lớp (Target, môn, TVV, tuần…) | Không Hoàn tác | Toast **Hoàn tác** gửi lại giá trị trước của đúng các ô đã sửa (cùng đường, cùng chia lô) |
| C5 | Thêm học viên (lô) | Nhầm → "Xoá hàng loạt" gõ XOÁ | Toast **Hoàn tác** = cả lô vào Thùng rác (`POST /intake/hoan-tac`, ≤ 15 phút, quyền thêm HV ở lớp); rồi toast có Hoàn tác (khôi phục) |
| C6 | Học tiếp có đổi lớp | Ẩn Hoàn tác | Máy chủ chụp như Chuyển lớp "Ngay hôm nay" → **Hoàn tác** em về lớp cũ, lựa chọn về chờ chọn (`/cycles/:id/buoc-tiep/hoan-tac-doi-lop`, quyền Bước tiếp) |
| C7 | Áp lịch đề xuất | Chỉ toast | Toast **Hoàn tác** (cùng `/ke-hoach-test/hoan-tac`) |

Giữ: N15 (ngoài Hoàn tác ngay sau lưu), quyền như thao tác gốc (kiểm TRƯỚC khi ghi), 409 khi dữ liệu đã đổi. Không mất thao tác nào.

Phép kiểm: `server/src/tests/prR2HoanTac.tests.ts` (C1 C2 C4 C5 C7) + `HT-3b` ở `prSvLoTrinh.tests.ts` (C6): so CẢ DB trước / sau Hoàn tác, 403 / 409.
Chú thích `ponytail:`: không thêm.
