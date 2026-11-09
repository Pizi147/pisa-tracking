# Kiểm tay đợt 10/11 trên seed — kết quả (KIEM-TAY-1011)

Chạy `npm ci` → `npm run seed` → `npm run dev`, bấm thử bằng Playwright (Chromium, nền tối), ngày demo 14/09/2026, chỉ dữ liệu seed.
Ảnh 1440 và 375 cùng thư mục này. Thay đổi dữ liệu trong lúc kiểm (chỉ trên máy kiểm): tạo MT0 cho 2 em MB BE 03, dời S MT0 của em 364
về W3 SEP; ngày demo đổi tạm sang 21/09 để "-" được chốt, rồi trả lại 14/09.

## Bảng đạt / lỗi

| # | PR | Kiểm gì | Kết quả | Ảnh |
|---|---|---|---|---|
| 1a | #1273 | Lưới nhập điểm chỉ xem với cột mình không có quyền (GV W1 Lê Minh Khoa mở "Cả lớp": L · R · W2 · S không có ô nhập; 375: chip W2 "Bạn không được phân công kỹ năng này", hàng "Chưa có") | ĐẠT | `1b-*`, `1c-*` |
| 1b | #1273 | Gõ "-" ở W1 (Lê Quang Huy, MT3 W3 SEP) → cả buổi Writing vắng: W1 "Vắng → W4 SEP", W2 "Đã dời sang W4 SEP"; toast "Đã ghi vắng W1 · dời W4 SEP · Hoàn tác" | ĐẠT | `1d-*`, `1e-*` |
| 1c | #1273 | "Bỏ vắng" ở hộp ô vắng → W1 mở lại, W2 về "Chưa có"; toast "Đã bỏ vắng … về W3 SEP · Hoàn tác". 375: tới ô qua "Xem dạng bảng › Cả lớp" (danh sách thẻ theo tuần đã không còn em đã dời) | ĐẠT | `1f-*`, `1g-*` |
| 2a | #1285 | GV S chéo (Lâm Quang Vinh, không dạy MB BE 03) gỡ "-" ở MT0 S "Không dự thi": mở ô, xoá "-", Lưu → ô về "Nhập" | ĐẠT (gỡ bằng xoá "-" trong ô, xem ghi chú 3) | `2a-*` |
| 2b | #1285 | Kế hoạch Test của GV S thấy lớp thường có MT0: "Chỉ xem", chỉ 2 em có MT0, ô Progress / Final "—", chip MT0 W3 OCT | **LỖI → ĐÃ SỬA**: công tắc Fast Track / Lớp thường bị ẩn vì GV chỉ dạy FT, nên không có đường vào lớp thường (chỉ vào được bằng `?loai=thuong` trên URL). Sửa `CongTacKhung`: khung ngoài phạm vi dạy mà trang có dữ liệu vẫn hiện | `2b-*-truoc-*` / `2b-*-sau-*` |
| 3a | #1283 | GV ở Hồ sơ cá nhân: ô kỹ năng khoá, "Quản lý hoặc Quản trị hệ thống sửa." | ĐẠT | `3a-*` |
| 3b | #1283 | QL Vy ở Hồ sơ GV › Kỹ năng: Sửa → bật S → Lưu → "Đã lưu kỹ năng" → bỏ S → Lưu (đã trả lại). GV xem hồ sơ GV của mình: không có Sửa | ĐẠT | `3b-*` |
| 3c | #1283 | Việc quản lý chỉ chọn người có vai ở chi nhánh của việc (Quản trị: Bãi Cháy 4 người BC; Monbay 11 người MB) | ĐẠT, kèm **LỖI NHỎ → ĐÃ SỬA**: Quản trị vẫn thấy mục "Tôi", chọn rồi Tạo bị máy chủ trả "Người phụ trách không hợp lệ." (có từ trước #1283). Sửa `ChonNguoi`: chỉ hiện "Tôi" khi chính mình qua cùng luật máy chủ (vai GV / QL, đúng chi nhánh) | `3c-truoc-*`, `3c-giao-viec-*` |
| 4a | #1287 | Head tutor ở Hồ sơ GV của mình: không có link / nút sang Công việc | ĐẠT | `4a-*` |
| 4b | #1287 | Lớp đã kết thúc: % Final tab Học viên = tab Tổng kết (MB FOU 03: 70 % = 70 %; MB BE 08: Nguyễn Minh An 65 % = 65 %) | ĐẠT (xem câu hỏi 1) | `4b-*` |
| 5a | #1288 | Hồ sơ HV Lý Minh Châu: dòng "Mock Test gần nhất · MT2 · W2 SEP"; 1440 Tiến độ cột trái (x 37) – Case cột phải (x 630) cùng hàng; 375 Case rồi Tiến độ như mockup v18; nút "Ghi kết quả PA" không bị chữ PA đè (chữ PA cắt "…" + đủ ở `title`) | ĐẠT | `5a-*` |
| 5b | #1291 | Dải "Lớp tôi dạy" / "Yêu cầu của tôi" gập / mở: mũi tên ngay sau tên (cách 8 px), `aria-expanded` đổi đúng, tiêu đề lặp chỉ còn `sr-only` | ĐẠT | `5b-*` |
| 6a | #1292 | Phân tích GV: "x đúng hạn · y chưa làm" + dòng "+ 8 S chéo chung" (Trang, Vinh, Hương); 375 thẻ lưới đủ 3 số | ĐẠT | `6a-*` |
| 6b | #1292 | Panel 3 tab "Chưa làm · Làm muộn · Đúng hạn" (+8 mờ), Chưa làm chia nhóm | ĐẠT, kèm **LỖI NHỎ → ĐÃ SỬA**: QL mở số của GV khác vẫn ghi nhóm "Bài của bạn". Nay QL thấy "Bài của GV", GV xem số của chính mình vẫn "Bài của bạn" | `6b-truoc-*`, `6b-panel-cham-u2-*` (QL), `6b-panel-cham-u9-*` (GV) |
| 6c | #1292 | Bấm dòng S chéo → mở chỗ chấm | ĐẠT một phần (xem ghi chú 4): link "MT1 · S" mở Hồ sơ Mock Test của em, dòng Speaking mở sẵn + nút "Nhập điểm" | `6c-*` |

## Đã sửa trong PR này (3 lỗi nhỏ, chỉ web, không đổi bố cục / luật / dòng đọc)

1. `web/src/ui/CongTacKhung.tsx` — công tắc khung hiện khung **có dữ liệu trên trang** dù ngoài phạm vi lớp mình dạy (2b).
2. `web/src/ui/PeoplePicker.tsx` — mục "Tôi" chỉ khi người xem hợp lệ theo `laNguoiHopLe` (vai GV / QL, đúng chi nhánh của việc; ô GV S cần kỹ năng S) (3c).
3. `web/src/ui/BangLuotPanel.tsx` + `web/src/ui/OSo.tsx` — panel biết GV của số (`gv=` / `/giao-vien/:id/`): khác người xem → "Bài của GV" (6b). EN: `shared/i18n/en/soNghiaVu.ts`.

## Ghi lại, KHÔNG sửa (cần PTA / chủ SP quyết hoặc ngoài phạm vi)

1. **[Câu hỏi] Lớp đã kết thúc, em đã lưu trữ.** MB BE 08 đầu trang ghi "2 HV", tab Tổng kết 2 em, tab Học viên "Tất cả 1" (Vũ Thu Uyên lưu trữ 26/04 bị ẩn). % của em có ở cả hai tab khớp nhau. Em lưu trữ có nên hiện ở tab Học viên của lớp đã kết thúc không, hay đầu trang nên đếm 1?
2. **Mã lớp trong Kế hoạch Test là link sang hồ sơ lớp** — GV chỉ xem (S chéo, cả lớp FT "Chỉ xem") bấm vào ra trang "Không có quyền" (có từ trước, cả FT). Đề xuất: lớp người xem không vào được thì mã lớp là chữ thường.
3. **Gỡ "-" ở ô "Không dự thi" (MT0 / MT cũ)** không có nút "Bỏ vắng": phải xoá "-" trong ô rồi Lưu (luật LUAT-34 sẵn có), toast chỉ "✓ Đã lưu", không có "Đã bỏ vắng · Hoàn tác" như ô vắng đã dời. Trang Mock Test của QL: menu ⋯ cũng không có "Bỏ vắng" cho ô này. Đề xuất: hiện "Bỏ vắng" ở chân hộp cho ô Không dự thi giống ô vắng đã chốt.
4. **"Bấm dòng S chéo mở thẳng lưới chấm" (#1292)**: thực tế chỉ link "MT1 · S" mở (bấm chỗ trống của dòng không làm gì) và mở Hồ sơ Mock Test một em, không phải lưới Chấm Speaking. Chấm được ngay nên không chặn việc; có cần đúng "lưới" như mô tả PR không?
5. Bảng "Lớp tôi dạy" trong cột trái Công việc 1440 hẹp: mã lớp gãy hai dòng, cột "Test sắp tới" bị khuất (có từ trước CV6).
6. Kế hoạch Test 375 khi có cả hai khung: hàng ô tìm + Lọc + công tắc chật ("Tìm l…", "Lớp thườ…") — cùng dáng QL, có từ trước.
7. Hộp ô vắng ghi "Ghi 09/11 bởi …" theo giờ thật, không theo ngày demo — nhật ký, chấp nhận được.
