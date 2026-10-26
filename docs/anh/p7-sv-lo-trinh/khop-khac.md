# P7 SV-LO-TRINH — khớp / khác mockup V6, thao tác TRƯỚC → SAU

Seed demo 14/09/2026. QL = Nguyễn Khánh Vy (MB), TVV = Nguyễn Thu Hương (CP). Ảnh cặp `cap-<mockup>-<khung>-<rộng>-<chế độ>.png`: trái = khung mockup
ĐÃ DUYỆT (`thiet-ke/v6/trang-thai-hv.html` k1–k6, `lo-trinh-moi.html` k1–k3), phải = web thật cùng tình huống (bấm thử bằng Playwright). 1440 tối + 375 sáng.
Ảnh Lộ trình mới RF / Khác / Lưu thật dùng em Phạm Bảo Ngọc (MB FT 101) đã ghi KQ thi thật trên DB demo lúc chụp (CP chỉ có một lớp FT nên "Lớp khác" rỗng — đúng).

## 1. Bảng truy vết khung → thành phần → ảnh

KHỚP = có, đúng chữ / đúng hành vi · KHÁC = có nhưng khác mockup (lý do) · BỎ = không làm (lý do) · GIỮ = thao tác cũ giữ dù mockup không vẽ.

| # | Khung | Thành phần | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | trang-thai-hv k1 | ⋯ hồ sơ: MỘT mục "Tạm dừng/ Kết thúc học" (đúng chữ), bỏ "Lưu trữ" / "Bỏ lưu trữ" / "Học lại" | cap-trang-thai-hv-k1 | KHỚP |
| 2 | k1 | Menu chia nhóm có tên (Hồ sơ · Lớp & lộ trình · Trạng thái) | k1 | KHÁC — nhóm có tên là việc của P3 UI-CHUNG (`Menu nhom`); P7 giữ thứ tự + vạch đậm sẵn có |
| 3 | k2 a | Hộp nhỏ: Từ ngày (`ONgay`) · Lý do (không bắt buộc) · ô "Có thể quay lại học" bật sẵn khi đang học | k2 | KHỚP |
| 4 | k2 a | "Khi lưu, web sẽ" do máy chủ tính: Lưu trữ · Tạm dừng / Giữ chỗ lớp · lộ trình đứng yên / n Case dừng hạn | k2 | KHỚP (không có "n việc rời Công việc" — xem 18) |
| 5 | k2 b | Tắt ô → nút "Kết thúc học", tóm tắt viền vàng (rời lớp · kết thúc lộ trình · đóng Case · huỷ PA) | k2 | KHỚP |
| 6 | k2 b | Dòng "Đưa em vào Lưu trữ · Kết thúc học" với em FT còn lộ trình chạy | k2 | KHÁC [XM-1] — luật TK-L / OV-8a: em FT kết thúc giữa lộ trình chờ KQ thi thật rồi mới lưu trữ; tóm tắt nói đúng điều máy chủ làm |
| 7 | k2 c | Đang lưu… (nút tắt, Esc / nền không đóng) | — (bấm thử) | KHỚP |
| 8 | k2 d | Lỗi mạng: "Chưa lưu được. … chữ đã gõ vẫn giữ." + Thử lại | — (bấm thử) | KHỚP |
| 9 | k2 e | Toast "✓ Lê Quang Huy đã vào Lưu trữ · Tạm dừng" + Hoàn tác 10 s | k2 | KHỚP |
| 10 | k2 f | Bị chặn: câu máy chủ "Em đang có quyết định chuyển lớp chờ W… — huỷ quyết định ở Chuyển lớp… rồi làm lại." + nút "Chuyển lớp…" | — (phép kiểm SV-4c) | KHỚP |
| 11 | k3 | Thanh chọn n em: một mục "Tạm dừng/ Kết thúc học" thay Lưu trữ + Kết thúc học | k3 | KHỚP |
| 12 | k3 | Thanh có "Chuyển lớp…", "Xuất" | k3 | BỎ — hàng loạt chuyển lớp thuộc P9 (đang chạy, không chạm `ChuyenLopPanel`); Xuất không có ở thanh này trước P7. GIỮ "Huỷ chuyển lớp", "Xoá" |
| 13 | k3 | Cùng hộp "· 3 em", nút "Tạm dừng · 3 em", tóm tắt cả lô từ máy chủ | k3 | KHỚP |
| 14 | k3 | Lỗi một phần: "✓ Đã lưu 2 em: …" + em lỗi giữ lý do + "Thử lại 1 em" | — (phép kiểm SV-6) | KHỚP |
| 15 | k4 a | Bước tiếp: KQ thi một dòng + Gia hạn + Lịch sử · HAI nút lớn không chọn sẵn | k4 | KHỚP (thêm chữ "· gợi ý" ở hướng máy chủ gợi ý — sửa E9) |
| 16 | k4 b | Chọn "Tạm dừng/ Kết thúc học" → nội dung hộp ngay trong panel, ô tắt sẵn, nút "Kết thúc học" | k4 | KHỚP |
| 17 | k4 d, e | GVCN chỉ xem · đã chọn → Hoàn tác | — (giữ khối trạng thái cũ) | KHỚP / GIỮ |
| 18 | k2, k3 | "3 việc rời Công việc" trong tóm tắt | k2 | BỎ — số việc tính lại ở nhiều nguồn (Công việc, Tổng quan); không có hàm chung trả số này cho một em, không bịa |
| 19 | k5 | Tab Học viên đã lưu trữ có em tạm dừng, nhãn "Tạm dừng · Có thể quay lại", dòng phụ lớp · lộ trình · từ ngày | k5 | KHỚP |
| 20 | k5 | Một nút "Quay lại học" (chính cho em tạm dừng) · "Tổng kết" giữ | k5 | KHỚP |
| 21 | k5 | Quay lại học lớp cũ còn chạy → một bấm + toast Hoàn tác | — (phép kiểm SV-5a) | KHỚP |
| 22 | k5 | Lớp cũ đã kết thúc → hộp chọn lớp (gợi ý cùng chương trình, cùng chi nhánh) + Quay lại học | — (phép kiểm SV-5b) | KHỚP |
| 23 | k5 | Bắt đầu "Thứ Hai 21/09" trong hộp chọn lớp | — | BỎ [XM-2] — chuyển lớp hẹn tuần đi qua lệnh chuyển lớp (P9 giữ `lenhChuyen.ts`); P7 chỉ "Ngay bây giờ" |
| 24 | k5 | Chọn nhiều → "Quay lại học · n em" | k5 | KHỚP (em cần chọn lớp / lộ trình báo "làm từng em") |
| 25 | k6 | Hồ sơ lưu trữ: dòng tóm tắt (lộ trình gần nhất · Target · thi thật · kết quả · ngày kết thúc) | k6 | KHỚP |
| 26 | k6 | Nút chính "Quay lại học" đầu hồ sơ, ⋯ chỉ còn Lịch sử (+ Xoá với QT) | k6 | KHỚP |
| 27 | k6 | Biến thể em tạm dừng: "Tạm dừng 14/09 · Có thể quay lại" | k6 | KHỚP (dải vàng "Tạm dừng học" cũ GIỮ, bỏ nút trùng) |
| 28 | lo-trinh-moi k1 | ‹ Bước tiếp · 1 Lộ trình LT1/LT2/RF/Khác (LT2 chọn sẵn sau LT1) | cap-lo-trinh-moi-k1 | KHỚP |
| 29 | k1 | 2 Môn học (5 nút L R W1 W2 S) | — | BỎ — P8 (plan P7: "để P8, không vẽ ô trống"); số bước giữ 1 · 3 · 4 · 5 như mockup |
| 30 | k1 | 3 Target giữ + Sửa · 4 Bắt đầu Ngay / Thứ Hai · 5 Lớp Giữ / Lớp khác | k1 | KHỚP (Thứ Hai mở thêm ô chọn 4 tuần — GIỮ thao tác cũ) |
| 31 | k1 | "Khi lưu, web sẽ" từ máy chủ: Mở FT LT2 … · Tạo MT1–MT3 (W? ?) · Đầu vào = KQ thi … · đóng n Case — Kết thúc lộ trình · Dừng n PA | k1 | KHỚP (bỏ "đủ 5 môn" — P8) |
| 32 | k1 | Sau khi lưu: khối "✓ Đã mở FT LT2" + Hoàn tác; lỗi giữ lựa chọn + Thử lại | k1 | KHÁC — khối Đã lưu trong panel (mẫu `KhoiDaLuu` của Bước tiếp sẵn có) thay toast |
| 33 | k1 | Ô gõ lớp: lớp sai loại hiện mờ, không chọn được | k2 (ds lớp) | KHÁC [XM-3] — `ChonLop` (P4, P9 giữ tệp) không có mục tắt → lớp sai loại không bày trong danh sách |
| 34 | k2 | RF khi giữ lớp LT: lỗi tại ô Lớp + "Chọn lớp RF để lưu" cạnh nút tắt | k2 | KHỚP |
| 35 | k2 | Chọn lớp RF → tóm tắt MT1–MT2 · rời lớp cũ | k2 | KHỚP |
| 36 | k3 | Khác: ô Tên lộ trình (bắt buộc, lỗi tại ô) · Target không bắt buộc + Bỏ Target · 0 MT ("+ MT" ở Kế hoạch Test) | k3 | KHỚP |

**Cổng:** 36 thành phần — KHỚP 28 · KHÁC 4 (2, 6, 32, 33) · BỎ 4 (12, 18, 23, 29, đều có lý do / thuộc PR khác). Trên phần P7 phải làm
(trừ 3 dòng BỎ vì thuộc P8 / P9: 12, 23, 29 → 33 dòng): KHỚP + KHÁC-có-lý-do = 32/33 = **97 %**; KHỚP thuần 28/33 = **85 %**.
Nếu tính KHÁC là không khớp thì dưới 90 % — chủ SP xem 4 dòng KHÁC + [XM].

## 2. Thao tác TRƯỚC → SAU (đếm bấm khớp truy vết mockup)

| Thao tác | Trước (main 186e73a) | Sau (P7) | Ghi |
|---|---|---|---|
| Tạm dừng một em | ⋯ › "Tạm dừng / Thôi học" › tab Tạm dừng › gõ lý do (bắt buộc) › Lưu (4 + gõ) | ⋯ › "Tạm dừng/ Kết thúc học" › Tạm dừng (**3**) | lý do không bắt buộc; em vào Lưu trữ |
| Kết thúc học + lưu trữ | ⋯ › Tạm dừng / Thôi học › tab Thôi học › Lưu › ⋯ › Lưu trữ (6) | ⋯ › mục › bỏ tích › Kết thúc học (**4**) | lưu trữ tự động (trừ em FT chờ KQ thi thật — XM-1) |
| Hàng loạt lớp | chọn n › Lưu trữ / Kết thúc học (2 mục, panel xem trước) | chọn n › "Tạm dừng/ Kết thúc học" › nút (hộp chung) | gộp; Huỷ chuyển lớp, Xoá GIỮ |
| Bước tiếp sau thi | 3 lựa chọn Lộ trình mới · Tạm dừng · Thôi học | 2 nút: Tạm dừng/ Kết thúc học · Lộ trình mới | N12 |
| Mở LT2 sau LT1 | Bước tiếp › Lộ trình mới › Lớp này › Bắt đầu lộ trình mới (ngày thi cũ bị chép, đầu vào trống) | Bước tiếp › Lộ trình mới › Mở lộ trình LT2 (**3**) | sửa E1, E3; Giữ lớp đã kết thúc tự mở lại (E2) |
| Mở RF / Khác | không có Khác; RF chỉ khi chọn lớp RF | chọn RF / Khác (+ tên) › lớp › Mở (4–5) | lớp sai loại báo ngay |
| Quay lại học em tạm dừng | hồ sơ ⋯ › Quay lại học › Lưu (panel) | Lưu trữ › Quay lại học (**1**, Hoàn tác 10 s) | em nay ở Lưu trữ |
| Quay lại học, lớp cũ đã kết thúc | 400 "Dùng Chuyển lớp" (ngõ cụt cho TVV) | hộp chọn lớp gợi ý sẵn › Quay lại học (2) | Quản lý (cần quyền chuyển lớp) |
| Em Kết thúc học quay lại | Lưu trữ › Bỏ lưu trữ › hồ sơ ⋯ › Học lại | Lưu trữ › Quay lại học → panel Học lại (cũ) hoặc Lộ trình mới (em có KQ thi thật) | bỏ ngõ cụt |
| Sửa thông tin liên hệ em tạm dừng | sửa được (em chưa lưu trữ) | sửa được (chỉ liên hệ) — **[ĐX]** | TVV gọi mời học lại |
| Lưới chấm FT em tạm dừng | như đang học | hàng mờ "Tạm dừng", vẫn nhập bù / sửa | không mất dữ liệu |
| GIỮ | Hoàn tác 10 s · Gia hạn Bước tiếp · Huỷ hẹn · Lịch sử · Tổng kết · tìm + lọc chi nhánh ở Lưu trữ · Học lại (về lớp cũ / lớp khác) | như cũ | |
| BỎ (giao diện) | mục ⋯ "Lưu trữ", "Bỏ lưu trữ", "Học lại"; tab Thôi học riêng; ⋯ dòng "Lưu trữ" em kết thúc chưa lưu trữ; nút "Bỏ lưu trữ" ở Lưu trữ | Kết thúc học tự lưu trữ + Quay lại học | API cũ (`archive`, `unarchive`, `hoc-lai`, hàng loạt `luu-tru`/`bo-luu-tru`) giữ ở máy chủ |

## 3. [XM] — mockup / luật / tính năng cũ xung đột, hỏi PTA Plan

- **XM-1** Kết thúc học em FT còn lộ trình chạy: mockup k2 b "Đưa em vào Lưu trữ"; luật TK-L / OV-8a (đang chạy) giữ em ngoài Lưu trữ tới khi có KQ thi thật + Bước tiếp. P7 giữ luật, tóm tắt nói đúng. Đổi = bỏ một dòng ở `setStudentStatus`.
- **XM-2** Quay lại học lớp cũ đã kết thúc: mockup có "Thứ Hai 21/09"; P7 chỉ "Ngay bây giờ" (hẹn tuần = lệnh chuyển lớp của P9).
- **XM-3** Lớp sai loại "mờ, không chọn được": `ChonLop` chưa có mục tắt (tệp P4, P9 giữ) → ẩn khỏi danh sách. Thêm cờ `tat` cho `ChonLop` sau P9 nếu chủ SP muốn thấy lớp mờ.
- **[ĐX]** Sửa thông tin liên hệ em tạm dừng (ở Lưu trữ) — đề xuất PTA, chờ chủ SP chốt.
