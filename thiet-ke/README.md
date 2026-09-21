# Thư mục `thiet-ke/` — tài liệu bên thiết kế

Ngày tạo: 20/09/2026. Cập nhật: 21/09/2026. Chủ sở hữu: bên design.
Trạng thái: **đặc tả để triển khai**, chưa phải mô tả web hiện tại.

> **MỚI 21/09/2026 — đọc ba file này trước mọi file khác:**
>
> | File | Vì sao đọc trước |
> |---|---|
> | `NGUON-Rule-Y-thuc-2026-09-21.md` | Nguồn do chủ sản phẩm gửi. **Bỏ hẳn mô hình Case Ý thức** |
> | `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` | Đặc tả đủ chi tiết để code phần Ý thức mới |
> | `BAN_DO_OVERHAUL.md` | Bản đồ *"yêu cầu nào của design plan đã có, cái nào chưa"*. Không có nó thì đọc `plan.md` sẽ tưởng chỉ còn vài việc dọn |
>
> Rule book **mục 18** là luật mới nhất và ưu tiên hơn mục 6, mục 17.2 và mọi đoạn nói về
> Case Ý thức, đợt Ý thức, cửa sổ gộp ba ngày, hạn 3/5/7 ngày của Ý thức.

> Bốn file trong thư mục này là **nơi tra cứu**, không phải nơi giao việc. Việc giao ở
> `plan.md`. Khi hai bên khác nhau, `plan.md` thắng về *làm gì trước*, thư mục này thắng về
> *làm cho giống nhau thế nào*.

| File | Trả lời câu hỏi | Ai đọc |
|---|---|---|
| `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` | Vi phạm và Biện pháp xử lý: bảng dữ liệu, luật V/B/W, quyền, bảy màn, tám chỉ số, 24 mục nghiệm thu | Ai làm phần Ý thức — **máy chủ và UI** |
| `BAN_DO_OVERHAUL.md` | Yêu cầu nào của design plan đã có, cái nào chưa, PR nào làm | Ai lập kế hoạch, và ai định "dọn nốt" |
| `HE_GIAO_DIEN.md` | Màu, cỡ chữ, khoảng cách, component dùng chung, bốn trạng thái dữ liệu, mobile, bàn phím | Người code UI, trước khi dựng bất kỳ màn nào |
| `HOP_DONG_SO_LIEU.md` | Mỗi con số trên web nghĩa là gì, đếm đơn vị nào, bấm vào ra tập nào | Người code cả máy chủ lẫn UI của dashboard/báo cáo |
| `TU_DIEN_VA_CHU.md` | Một khái niệm gọi bằng đúng một chữ; toàn bộ nhãn tiếng Việt | Người code UI và người biên tập |
| `LUAT_CHO_CHOT.md` | C01–C10 và Y01–Y04: điểm nào đã chốt, điểm nào còn chờ. **Nay chỉ còn C08 chưa chốt** | Người code nghiệp vụ |

Kèm theo **hai file nguồn** do chủ sản phẩm gửi, chép nguyên văn vào repo ngày 20/09/2026 để
session code đọc được mà không cần hỏi lại:

| File | Vai trò |
|---|---|
| `PISA-Rulebook-2026-09-19.md` | **Luật sản phẩm.** Mục 17 ưu tiên hơn mọi mô tả cũ mâu thuẫn |
| `PISA-Design-Plan-after-PR28.md` | **Đặc tả thiết kế.** Mục 17–22 là bản mới nhất |

Hai file này là **nguồn**, không phải nơi ghi tiến độ. Đừng đánh dấu đã làm vào chúng — tiến độ
ghi ở `plan.md`.

## Nguồn luật, theo thứ tự ưu tiên

1. `thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md` — nguồn mới nhất do chủ sản phẩm gửi.
2. `thiet-ke/PISA-Rulebook-2026-09-19.md` — luật sản phẩm. **Mục 18 ưu tiên hơn mục 17, mục 17
   ưu tiên hơn mọi mô tả cũ mâu thuẫn.**
3. `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` — đặc tả phần Ý thức, chi tiết tới mức DDL.
4. `thiet-ke/PISA-Design-Plan-after-PR28.md` — đặc tả thiết kế, mục 17–22 là bản mới nhất.
   **Đọc kèm `BAN_DO_OVERHAUL.md`** để biết mục nào đã hết hiệu lực vì rule Ý thức mới.
5. `plan.md` — kế hoạch đang chạy, có ô đánh dấu.
6. Thư mục này — chi tiết trình bày.
7. Mã nguồn hiện tại — **hiện trạng, không phải luật**. Không dùng code để chứng minh một
   quyết định đã được duyệt.

> **Bẫy đã sập một lần, đừng sập lần nữa:** `plan.md` từng chỉ chép design plan mục 18 vào
> **một** PR (hồ sơ Test), nên bảy trang còn lại của mục 18 không bao giờ thành việc. Đọc
> `plan.md` thì tưởng gần xong. Từ nay, mọi yêu cầu của design plan phải có **một dòng trong
> `BAN_DO_OVERHAUL.md`** với nhãn tình trạng và PR phụ trách.

## Quy tắc cập nhật

- Sửa file ở đây thì ghi một dòng vào `plan.md` mục 14 trong **cùng commit**.
- Không thêm component mới vào `HE_GIAO_DIEN.md` nếu chưa có ít nhất hai màn dùng tới nó.
- Không viết "TBD". Chưa chốt thì đưa vào `LUAT_CHO_CHOT.md` có mã C, không để trống ở đây.
