# Đề bài mockup ① — Trang đầu của GV (Công việc + Lớp của tôi)

Chủ SP duyệt hướng 13/11 (lời 6, 11, 12 ở `loi-chu-sp.md`). Mockup này để chủ SP duyệt TRƯỚC khi code.
Tệp ra: `thiet-ke/v21/trang-dau-gv.html` + `thiet-ke/v21/trang-dau-gv-ghi-chu.md`.
PTA Overhaul rà mockup theo đúng từng dòng R dưới đây trước khi gửi chủ SP.

## Nguyên tắc (đọc trước)

- **Nâng cấp, không dựng lại.** Nền hình ảnh = mockup Công việc đã duyệt: `thiet-ke/v18/cong-viec-dai-nhom.html`, `thiet-ke/v12/cong-viec.html`, `thiet-ke/v17-nhap/` (tab + badge), panel theo `thiet-ke/v20/tinh-hinh.html`. Dùng lại đúng biến màu, cỡ chữ, dáng dòng, dải nhóm, chip hạn, nút của các tệp đó (và `web/src/index.css`). Lệch hình ảnh so với nền mà không có lý do = lỗi.
- **Chữ ngắn.** Không câu giải thích trong khung web. Chú thích cho người duyệt đặt NGOÀI khung (nhãn khung, bảng ghi chú).
- **Luật không đổi.** Mọi thành phần phải chỉ ra được nó phục vụ luật / việc nào (cột cuối bảng truy vết trong ghi-chu).
- Dữ liệu giả kiểu seed (lớp `MB FT 101`, `MB FOU 12`…; tên người bịa). Ngày demo 14/09/2026, tuần `W3 SEP`.
- Phông Be Vietnam Pro, số Inter; thang chữ 12 · 13 · 14 · 15 · 17 · 22; không in hoa; hạn = ngày thật `hạn 23/09`; thời gian = mã tuần.
- Có công tắc Sáng / Tối cho cả trang mockup; mỗi khung vẽ ở 1440; các khung R19–R21 vẽ thêm ở 375.

## Khung phải vẽ

### K1 — Trang đầu, chưa chọn việc (GVCN dạy Listening + Reading, 8 lớp)
- R1. Thanh trên: logo · menu **Công việc** (đang chọn, có badge) · **Học viên & Lớp** · **Test** · ô tìm · "?" · chuông · tên. KHÔNG có mục Tổng quan.
- R2. Đầu trang: "Công việc" + số ("30 việc · 9 quá hạn") + nút **"+ Ghi"** + ô lọc hạn như nay.
- R3. Hàng tab hạng mục + badge như v17: Chấm điểm · Speaking chấm chéo · Case học thuật · Ý thức & Phối hợp · Báo cáo PH · Vận hành (tab rỗng thì ẩn).
- R4. Cột trái (640): danh sách việc tab Chấm điểm đúng dáng v18 (dải nhóm Mock Test / Progress – Final Test, dòng việc theo tuần + lớp, chip hạn cột cố định, nút "Nhập điểm"). Cuối danh sách: nhóm gập "Yêu cầu của tôi". KHÔNG còn nhóm gập "Lớp tôi dạy" (đã lên khung phải). KHÔNG có "Đang chờ người khác".
- R5. Cột phải, khi chưa chọn việc: thẻ **"Lớp của tôi"** thay ô trống "Chọn một việc ở danh sách". Mỗi lớp MỘT dòng, các trường thẳng cột giữa các dòng: mã lớp (link hồ sơ lớp) · tôi dạy gì (chip kỹ năng; "chủ nhiệm") · tình trạng Test theo luật · việc của tôi ở lớp.
- R6. Đủ 6 kiểu dòng lớp (mỗi kiểu ít nhất một dòng):
  (a) FT có bài của tôi tuần này: "MT · W3 SEP · 10 bài · hạn 23/09" + nút **Nhập điểm**;
  (b) FT có bài quá hạn: chip quá hạn đỏ ⚠ + nút Nhập điểm;
  (c) lớp thường chưa tới tuần Test: "Final · W3 OCT", KHÔNG nút;
  (d) lớp tôi chủ nhiệm nhưng không dạy kỹ năng nào: không bao giờ có nút Nhập điểm; ghi "2 việc Ý thức ›";
  (e) lớp tôi dạy Speaking: "Speaking · W3 SEP · 6 bài · chấm chéo" (bấm mở panel Speaking chấm chéo đúng lớp + tuần đó);
  (f) lớp không có gì tuần này: chỉ mã lớp + kỹ năng, mờ hơn.
- R7. Lớp có việc xếp trên, lớp không có gì xếp dưới. Không ô số, không %.

### K2 — Đã chọn việc Nhập điểm (FT, W3 SEP)
- R8. Cột phải = panel nhập điểm đang có (chỉ em có bài, cột L · R · Kết quả, hạn ở đầu panel). ✕ đóng panel thì "Lớp của tôi" hiện lại.
- R9. **Dòng quy chế** (một dòng, chữ 13, màu phụ, ngay trên chân panel): "'-' = vắng: lần 1 dời sang tuần sau · lần 2 huỷ". Đây là mẫu "dòng quy chế" dùng cho MỌI panel việc: cố định một chỗ, một dòng, không đoạn văn.
- R10. Chân panel: "Việc tiếp ›". Hộp nhập một ô (vẽ một trạng thái hộp đang mở cho ô W1): nút chính **"Lưu · bài tiếp ›"** + nút **"Vắng"**; các thao tác còn lại (Lưu · đóng, Khôi phục điểm, Bỏ vắng) gom vào một nút phụ "⋯". Không còn hàng 7 nút.

### K3 — Tab Speaking chấm chéo [chủ SP chốt lời 11]
- R11. Đầu tab: "Việc chung của nhóm GV Speaking · 18 bài · 6 quá hạn" (thay "0 việc"). Vẫn MỘT dòng việc chung "Chấm Speaking".
- R12. Panel mở: gom **tuần Test → lớp**, tuần mới ở trên; mỗi lớp một ngăn với đúng lưới nhập như K2 (cột S + Kết quả); nhóm "Tuần cũ hơn · 7 bài" gập ở cuối. Lớp tôi dạy Speaking đứng đầu trong mỗi tuần.
- R13. Ô **"GV chấm"** ở đầu mỗi ngăn lớp (mặc định: tôi). Phần "Đã có điểm" ghi "GV chấm: …" (không ghi "Nhập bởi").
- R14. Em vắng ghi "vắng W2 SEP" như nay. Có ô tìm em.

### K4 — Tab Case học thuật: hai panel mẫu "dòng quy chế"
- R15. Panel **Chọn PA** (theo dáng đang có): hai lựa chọn "Theo PA quy chế" (mặc định, đã chọn) / "Giữ PA của tôi"; dòng quy chế đổi theo lựa chọn: mặc định → "PA của bạn dừng, kết quả giữ"; chọn Giữ → "QL duyệt trong 3 ngày · quá hạn theo bạn".
- R16. Panel **Ghi kết quả PA**: nút "Lưu" + "Lưu nháp" (đúng lời 13/11), dòng quy chế: "Kỳ 2 tuần · hạn thứ Ba 22/09 · Lưu là chốt, đổi bằng Sửa".

### K5 — "+ Ghi"
- R17. Menu thả 3 mục: **Ghi vi phạm / nhắc nhở** · **Báo tình hình cho TVV** · **+ Case**. Bước kế: một ô gõ tên em (gợi ý em các lớp của tôi, hiện lớp bên cạnh tên; Báo tình hình chọn được nhiều em, tối đa 8).
- R18. Vẽ form Ghi vi phạm sau khi chọn em (theo form đang có): Nhóm · tên vi phạm · Môn · công tắc "Chỉ nhắc nhở"; dòng quy chế đổi theo công tắc: Vi phạm → "GVCN nhận việc xem · đủ 3 trong 2 tuần thì phải xử lý"; Chỉ nhắc nhở → "Không tính vào bậc, không sinh việc".

### K6 — Việc Báo cáo PH của GV [chủ SP chốt lời 12]
- R19. Tab **Báo cáo PH** (chỉ hiện khi có việc, từ ngày 20): mỗi lớp một dòng "Viết Báo cáo PH · MB FT 101 · Tháng 9 · còn 21 / 33 em · hạn 30/09" + nút **"Viết ›"** (đổi trang sang tab Báo cáo PH của hồ sơ lớp). Vẽ thêm trạng thái quá hạn (sau ngày 30) và trạng thái tháng 2 (hạn 28/02) ở ghi chú.
- R20. Ở "Lớp của tôi", lớp đang trong đợt có thêm "Báo cáo PH · hạn 30/09".

### K7 — Trạng thái
- R21. Hết việc ở tab: thẻ "Hết việc Chấm điểm của bạn" + "Còn: Case học thuật · 3 việc" + "Việc tiếp ›" (đúng V18); cột phải vẫn là "Lớp của tôi".
- R22. GV mới, chưa có lớp: cột trái "Chưa có việc", cột phải "Chưa được phân công lớp nào" (một câu).
- R23. Đang tải (khung xương) và lỗi tải ("Không tải được · Thử lại") cho cả hai cột.

### K8 — 375
- R24. K1 ở 375: thanh tab dưới 3 mục (Công việc · Học viên · Test); đầu trang có công tắc hai đoạn **"Việc · Lớp của tôi"**; danh sách việc chạm cả dòng; "+ Ghi" là nút tròn nổi góc phải dưới, cao hơn thanh tab.
- R25. "Lớp của tôi" ở 375: mỗi lớp một thẻ, nút Nhập điểm cao 44.
- R26. K3 (Speaking chấm chéo) ở 375: panel toàn màn, "‹ Quay lại", ngăn lớp gập / mở.

## Ghi chú kèm (trang-dau-gv-ghi-chu.md)

1. **Bảng truy vết:** khung (id) → thành phần → luật / việc phục vụ (mã ở `luat/0-luat-core-mot-trang.md`) → thao tác TRƯỚC → SAU. Có dòng GIỮ và dòng BỎ.
2. **Bảng thao tác TRƯỚC → SAU** của trang Công việc + Tổng quan GV (mọi thao tác đang có đi đâu; mất thao tác nào phải có lý do).
3. **[XM]**: chỗ mockup phải tự đoán hoặc đụng lời cũ (ghi nguồn).
4. Số liệu GV chuyển sang Hồ sơ GV: liệt kê ô / bảng nào đi đâu (không cần vẽ Hồ sơ GV ở mockup này).
