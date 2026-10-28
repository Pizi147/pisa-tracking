# LUOT-KHOI-PHUC — khôi phục lượt Test lớp thường đã huỷ (luật "không khoá cứng")

Việc "Để sau" của HSL-LT (#653). Không có mockup riêng (thêm nút theo mẫu sẵn có — plan.md 1.3b): dải "Đã huỷ" + nút khôi phục chép đúng mẫu FT
`/mock-test/:id` ("Khôi phục MT{n}", PR-OV4a). Ảnh web (DB demo cục bộ, lượt 184 Progress Test Âu Nhật Nam, huỷ qua API "Xếp nhầm lượt"):
`huy-ql-1440-toi.png`, `huy-ql-375-sang.png` (QL — vai 2: nút), `huy-gv-1440-toi.png`, `huy-gv-375-sang.png` (GVCN — vai 7: chỉ đọc),
`da-khoi-phuc-1440-toi.png`, `da-khoi-phuc-375-sang.png` (sau khi bấm), `xem-lich-su-1440-toi.png` (bấm "Xem Lịch sử" → mở sẵn Lịch sử lượt).

## Khung → thành phần → ảnh

| # | Mẫu (FT / luật) | Web lớp thường | Kết quả |
|---|---|---|---|
| 1 | FT: dải "Đã huỷ" + nút "Khôi phục MT{n}" bên phải (QL) | cùng dải, nút "Khôi phục Progress Test" (tên bài theo `kindLabel`); 375: nút xuống dòng, cao 44 | KHỚP |
| 2 | Người không có quyền | "Chỉ Quản lý khôi phục được lượt đã huỷ." (quyền `ATTEMPT_CANCEL` như FT; máy chủ 403) | KHỚP |
| 3 | Bị chặn: nói lý do + bước tiếp (CLAUDE.md) | câu máy chủ thay nút: em không còn học lớp (nay lớp …) · đã có bài cùng loại khác · lớp đã kết thúc — `khoiPhuc.chan` cùng hàm `chanKhoiPhucThuong` với chặn 400 | KHỚP (phép kiểm LKP-3..5; không dựng được trên demo để chụp) |
| 4 | Sau khôi phục: phản hồi rõ, không báo xong khi chưa lưu | dải "✓ Đã khôi phục Progress Test · Điểm trước khi huỷ xem ở Lịch sử." + "Xem Lịch sử" (mở sẵn + cuộn tới) chỉ khi máy chủ trả 200; lỗi → toast câu máy chủ, nút bấm lại được | KHỚP |
| 5 | Điểm cũ | KHÔNG tự trả (PTA Plan 28/10): huỷ lượt thường xoá điểm (PR-VN5), audit `regular.score` còn giữ — xem ở Lịch sử | GIỮ (`ponytail:` ở `reopenAttempt`) |

**impeccable critique:** 34/40, 0 P0 / 0 P1 (vòng 1: 32 — P2 "Xem Lịch sử" chỉ cuộn tới dòng thu gọn → sửa mở sẵn).
Còn P3: Lịch sử ghi "Mở lại" (nhãn `reopened` dùng chung FT) trong khi nút là "Khôi phục" — lý do dòng đã ghi "Khôi phục Progress Test"; đổi nhãn chung để PR sau.
web-design-guidelines: phần diff đạt (nút `type="button"`, vùng bấm 44 ở 375, `role="status"`, chuyển động theo `prefers-reduced-motion`).

## Thao tác TRƯỚC → SAU

| Trước PR | Sau PR |
|---|---|
| Lượt lớp thường đã huỷ: chỉ xem, không đường quay lại (khoá cứng) | QL bấm "Khôi phục {bài}" một lần → lượt mở lại, ghi lịch sử + audit `attempt.khoi_phuc` |
| — | Bị chặn → câu lý do + bước tiếp ngay trên dải (không nút chết) |
| — | Sau khôi phục: "Điểm trước khi huỷ xem ở Lịch sử" + "Xem Lịch sử" |

Không bỏ thao tác nào. Luồng huỷ không đổi.
