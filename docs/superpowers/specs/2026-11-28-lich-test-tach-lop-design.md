# Lịch Test tuần — tách rõ khối lớp (chủ SP duyệt 28/11)

## Vì sao
Chủ SP: giữa các hàng cần "cái gì đó lộ rõ hơn để phân biệt giữa lớp nọ lớp kia là chính". Màn vẫn vừa xem vừa nhập điểm, "mọi thứ khá là ok rồi".

## Mục tiêu / không làm
- Làm: nhìn qua biết hàng em thuộc lớp nào, lớp nào hết ở đâu.
- KHÔNG: bỏ nhập điểm, bỏ "GV chấm S", đổi cột, đổi chữ, đổi dữ liệu / API, overhaul.
- Thất bại nếu: mất thao tác nào, hoặc màn 375 chật / cắt chữ hơn trước.

## Cách đã cân nhắc
1. Mockup mới + overhaul màn xem điểm — bỏ (chủ SP muốn giữ nhập điểm, không làm lại).
2. Mockup hai kiểu tách hàng — bỏ (không đổi bố cục, duyệt bằng ảnh trước | sau là đủ; plan 1.3b).
3. **Chọn:** chỉnh CSS / cấu trúc nhẹ trong `LichTestTab` + `lichTest/*`, duyệt bằng ảnh.

## Thiết kế
- Mỗi lớp = một khối có viền + bo góc; khoảng hở ~16–20 px giữa hai khối.
- Hàng tên lớp = đầu khối: nền sáng hơn rõ các hàng em; vạch màu bên trái chạy dọc SUỐT khối (hiện chỉ hàng lớp có).
- MÀU (chủ SP 28/11 bổ sung: "hàng lớp và hàng thông tin đang hơi giống nhau"): ba tầng nền khác nhau rõ — hàng lớp (sáng nhất, chữ đậm) · tiêu đề cột (dải nền riêng, chữ nhỏ nhạt) · hàng em (nền tối nhất). Không ai được nhìn nhầm hàng lớp với hàng tiêu đề / hàng "Còn chờ".
- THỨ TỰ trong khối (chủ SP 28/11): hàng lớp → tiêu đề cột (ngay dưới hàng lớp) → các hàng em → hàng "Còn chờ… · GV chấm S" ở CUỐI khối, gọn một dòng (chữ nhỏ; ô GV chấm S nhỏ lại, vẫn đủ 44 px chạm ở 375).
- Hàng em: giữ nguyên (ô nhập, Kết quả, SOS).
- Dùng token màu sẵn có trong `DESIGN.md` / `index.css`; không màu mới nếu có token hợp; trạng thái không chỉ bằng màu (vạch là ranh giới, không mang nghĩa).

## Để người làm tự quyết
Giá trị px / token cụ thể; cách vạch chạy hết khối (border-left trên khối hay pseudo); hành vi khi khối đang thu gọn.

## Nghiệm thu
Ảnh CẢ MÀN trước | sau 1440 / 1280 / 375 (nhiều lớp liền nhau, một lớp thu gọn, có lọc TVV); bảng thao tác TRƯỚC → SAU không mất gì; chủ SP duyệt ảnh trước merge.
