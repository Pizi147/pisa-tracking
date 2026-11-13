# Overhaul V6 — lời chủ SP (nguyên văn, mới nhất ở dưới)

Session planning "PTA Overhaul" (mở 13/11). Mọi lời chủ SP về overhaul V6 ghi ở đây NGAY trong lượt nhận. Lời mới hơn thắng lời cũ về cùng điều.

## 13/11 — lời 1: giao việc (kèm tệp đề xuất ChatGPT)

Tệp kèm: `D:\Download\Pisa tracking web\PISA-Teacher-First-Overhaul-PR1512-Claude.md` → chép nguyên ở `nguon/de-xuat-chatgpt.md` (audit + đề xuất của ChatGPT, baseline #1512: F01–F07 lỗi, mục 5–8 hướng thiết kế, U01–U14 brainstorm vòng 2, phụ lục route + 282 tệp TSX).

> "đây là đề xuất gửi từ chatGPT, cứ đọc tham khảo và xem xét, những phần về bug thì gửi qua session 'PTA Plan' để nó giao cho session khác xử lý.
> Tôi đang cần overhaul lại TOÀN BỘ tất cả các trang, panels, nút, không có giới hạn nào cả, thay đổi cấu trúc cũng được, hoàn toàn thoải mái, nhưng bản thân bạn vừa đọc những đề xuất này, thì riêng bạn cũng phải tự lên ý tưởng thật kĩ càng, chắc chắn, và cho tôi plan chi tiết, kể cả về model và effort tương ứng phù hợp để sửa đổi. Tôi muốn website trực diện hơn và đảm bảo trải nghiệm người dùng tốt hơn ở mọi vai (chủ yếu là GV vì là người đưa input chính), mọi thứ phải gọn gàng, workflow mượt, dễ chịu, logic, dễ nhìn, rõ ràng, đẹp nếu được. Cứ thoải mái trong mọi thứ và sử dụng các bộ skills về thiết kế hợp lý để làm mọi thứ tốt hơn, có gì không hiểu hỏi ngay. Nên nhớ, luôn nghĩ đến người dùng, khi họ vào web họ đang cần làm gì có những luật gì thì nên hiển thị như thế nào."

PTA Overhaul hiểu:
- Đề xuất ChatGPT = tham khảo, không phải quyết định. PTA Overhaul phải tự có ý tưởng riêng, chắc chắn.
- Phạm vi: TOÀN BỘ trang, panel, nút; được đổi cấu trúc (bố cục, điều hướng). Luật nghiệp vụ `plan.md` 1.6 KHÔNG tự đổi — đề xuất trái luật ghi [XM] hỏi.
- Mục tiêu: trực diện · gọn · workflow mượt, logic · dễ nhìn, rõ · đẹp nếu được. Mọi vai, GV trước (người nhập chính).
- Cách nghĩ: người dùng vào web đang cần làm gì → có luật gì → hiển thị thế nào.
- Đầu ra: plan chi tiết từng PR, có model + effort.
- Lỗi: chuyển PTA Plan.

Đã làm trong lượt:
- 13/11: gửi PTA Plan F01, F03, F04, F05, F06, F07 (đã đối chiếu mã `origin/main` 802f1b685; F02 = GV-CU-BO-TRO #1514 đang chạy).
