# Thư mục `thiet-ke/` — tài liệu bên thiết kế

Ngày tạo: 20/09/2026. Chủ sở hữu: bên design. Trạng thái: **đặc tả để triển khai**, chưa phải
mô tả web hiện tại.

> Bốn file trong thư mục này là **nơi tra cứu**, không phải nơi giao việc. Việc giao ở
> `plan.md`. Khi hai bên khác nhau, `plan.md` thắng về *làm gì trước*, thư mục này thắng về
> *làm cho giống nhau thế nào*.

| File | Trả lời câu hỏi | Ai đọc |
|---|---|---|
| `HE_GIAO_DIEN.md` | Màu, cỡ chữ, khoảng cách, component dùng chung, bốn trạng thái dữ liệu, mobile, bàn phím | Người code UI, trước khi dựng bất kỳ màn nào |
| `HOP_DONG_SO_LIEU.md` | Mỗi con số trên web nghĩa là gì, đếm đơn vị nào, bấm vào ra tập nào | Người code cả máy chủ lẫn UI của dashboard/báo cáo |
| `TU_DIEN_VA_CHU.md` | Một khái niệm gọi bằng đúng một chữ; toàn bộ nhãn tiếng Việt | Người code UI và người biên tập |
| `LUAT_CHO_CHOT.md` | Chín điểm luật C01–C09 chủ sản phẩm chưa trả lời; code phải để lộ ra, không chôn | Người code nghiệp vụ |

Kèm theo **hai file nguồn** do chủ sản phẩm gửi, chép nguyên văn vào repo ngày 20/09/2026 để
session code đọc được mà không cần hỏi lại:

| File | Vai trò |
|---|---|
| `PISA-Rulebook-2026-09-19.md` | **Luật sản phẩm.** Mục 17 ưu tiên hơn mọi mô tả cũ mâu thuẫn |
| `PISA-Design-Plan-after-PR28.md` | **Đặc tả thiết kế.** Mục 17–22 là bản mới nhất |

Hai file này là **nguồn**, không phải nơi ghi tiến độ. Đừng đánh dấu đã làm vào chúng — tiến độ
ghi ở `plan.md`.

## Nguồn luật, theo thứ tự ưu tiên

1. `thiet-ke/PISA-Rulebook-2026-09-19.md` — luật sản phẩm. **Mục 17 ưu tiên hơn mọi mô tả cũ mâu thuẫn.**
2. `thiet-ke/PISA-Design-Plan-after-PR28.md` — đặc tả thiết kế, mục 17–22 là bản mới nhất.
3. `plan.md` — kế hoạch đang chạy, có ô đánh dấu.
4. Thư mục này — chi tiết trình bày.
5. Mã nguồn hiện tại — **hiện trạng, không phải luật**. Không dùng code để chứng minh một
   quyết định đã được duyệt.

## Quy tắc cập nhật

- Sửa file ở đây thì ghi một dòng vào `plan.md` mục 14 trong **cùng commit**.
- Không thêm component mới vào `HE_GIAO_DIEN.md` nếu chưa có ít nhất hai màn dùng tới nó.
- Không viết "TBD". Chưa chốt thì đưa vào `LUAT_CHO_CHOT.md` có mã C, không để trống ở đây.
