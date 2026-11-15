# GD-20d HOAN-THANH-BAT-SAN — ô "Hoàn thành Case" bật sẵn (mockup ⑫ `thiet-ke/v21/gv-viet-it.html` D1–D3, E4)

Ảnh web (demo 14/09, Lê Minh Khoa, Case 12 / PA 13, `/hoc-thuat/Case/12?pa=13&viec=ghi-ket-qua`): `web-1440-toi-d1.jpg` · `web-375-sang-d1.jpg`.
**Chưa có ảnh cặp ghép mockup │ web** (session không ghép được ảnh) — PTA Plan đặt cạnh khung D1 của mockup để rà.

## Điều kiện bật sẵn (một hàm: `hoanThanhCaseBatSan`, `shared/domain/quyCheCase.ts`)
Kết thúc PA (hoặc kết quả cuối PA quy chế) · PA cuối còn chạy của Case (nơi gọi đã chặn: `paCuoiHoanThanh`) · Tiến triển "Tiến bộ rõ"
(Bổ trợ miễn phí: Mini Test ≥ `nguongMiniTest(ngày làm)`). Thiếu một → tắt sẵn. GV bấm tay thì tay thắng (`htTay`). Mức + Kết luận vẫn điền sẵn từ kỳ vừa ghi, sửa được.
Dòng quy chế theo ô tick (đang Kết thúc PA): bật "Case hoàn thành, mở lại được ở thẻ Case" · tắt "Case còn mở · không hạn".

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Ô tick khi kết thúc PA cuối, Tiến bộ rõ | tắt, GV tự tick | bật sẵn |
| Kết thúc PA cuối, kết quả chưa đạt | tắt | tắt (D3); GV tự bật được |
| Bỏ tick | — | dòng quy chế "Case còn mở · không hạn" (D2) |
| Mức / Kết luận | điền sẵn khi tick | như cũ |
| Sửa kết quả / Kết thúc sớm | không ô / ô tắt | như cũ (không đổi) |
Mất thao tác: không.

## Kiểm thật (bấm trên demo, không lưu)
Rõ + Kết thúc PA → tick bật · Một phần → tắt, dòng "còn mở" · bấm tay bật/tắt giữ theo GV. Mockup D1 khớp: tick, 4 chip mức, Kết luận, "Ghi ngày", dòng Quy chế.
Lưu ý 375: lưới 4 chip mức tràn ngang trong khung chụp (lưới `grid-cols-2` có từ #3, PR này không đổi) — để việc sau nếu PTA muốn.

## Ngoài mockup / lưu ý
- Bổ trợ miễn phí lần cuối + Mini Test đạt: máy chủ đã tự hoàn thành Case khi lưu (PR-LT2b, có sẵn) → form không gọi `/outcome` lần hai. Không thêm máy tự đóng nào mới.
- Turso: 0 (chỉ web + hàm thuần). Máy chủ không đổi. `npm run check` đầy đủ: 5771 đạt (HTC-5 mới).
