# 02 — Luật Tutor đề xuất (19/11/2026)

Trạng thái: **ĐỀ XUẤT — chưa luật nào ở đây có hiệu lực** tới khi chủ SP trả lời `04-cau-hoi.md`; chốt xong mới chép vào `plan.md` 1.6 (N54…).
"20/10" = đặc tả `2026-10-19-tutor-head-tutor-design.md` (chủ SP duyệt 20/10). Luật không nhắc ở đây (SOS → PA, mốc quy chế, Hiệu quả PA, N46, N51, N52…) **không đổi**.

| # | Luật đề xuất | So 20/10 | Vì sao | Câu |
|---|---|---|---|---|
| TU1 | **Buổi tutor là bản ghi riêng:** ngày · người dạy · kỹ năng · 1..n em; mỗi em **Có mặt** (kèm nhận xét 8–300 ký tự) hoặc **Vắng**. Buổi luôn gắn PA Tutor đang mở của em × kỹ năng đó | **ĐỔI** (buổi nằm trong lần ghi kết quả, không ngày, một em) | 59 buổi / 294 PA: mô hình cũ không ai nhập nổi; không ghi được nhóm, vắng | C1 |
| TU2 | **Người dạy** = GV có tài khoản **hoặc** tutor ngoài (danh bạ, không đăng nhập) **hoặc** tên gõ tay; một ô có tìm (N45). Mỗi PA Tutor **một** ô Người dạy (bỏ "Người dạy kỳ này") | **ĐỔI** (3 ô chồng nhau) | H4; ô mặc định GV bộ môn không nói ai dạy thật | C2 |
| TU3 | **Ai ghi buổi:** người dạy được giao · GV bộ môn của Case · GVCN lớp em · Head (chi nhánh lớp em) · Head tutor · Quản trị. Không duyệt | **ĐỔI** (chỉ người giữ Kết quả PA) | người dạy là người biết buổi | C2 |
| TU4 | **Không xếp từng buổi trước.** Buổi ghi sau khi dạy (ngày ≤ hôm nay). Lịch chỉ là một ô chữ ngắn tuỳ chọn cạnh Người dạy ("T3 · T6 18:00") | **MỚI** | lịch từng buổi = thêm bước không đổi đầu ra; đổi lịch / nghỉ không cần thao tác | C3 |
| TU5 | **Ai giao / đổi người dạy:** Head tutor (mọi chi nhánh) · Head (em chi nhánh mình) · GV bộ môn của Case · Quản trị; đổi lúc nào cũng được, có lịch sử; buổi đã ghi giữ tên người dạy cũ | **ĐỔI** (chỉ người xác nhận / sửa PA) | H8, H9 | C4 |
| TU6 | **Bỏ 3 ô Có / Không bắt buộc và sao** ở mỗi buổi. Thay bằng **"Báo vấn đề về người dạy"** tuỳ chọn (loại + một ô chữ) ở dòng buổi — ai xem được buổi đều báo được. Dữ liệu 3 ô / sao cũ giữ chỉ đọc | **ĐỔI** (Q3, Q4) | H1; 42 / 52 buổi chọn cả 3 "Có", sao 1 / 59 | C5 |
| TU7 | **Cần chú ý** (người dạy) = có báo vấn đề **sau** nhận xét gần nhất của Head tutor / Quản trị; ghi nhận xét → rời nhóm. Tutor "Ngừng hợp tác" không vào, không hiện ở ô chọn | **GIỮ** ý (Q7, Q11), đổi nguồn tín hiệu theo TU6 | — | C5 |
| TU8 | **"Số buổi" của PA một nghĩa = tổng buổi dự kiến**, **tuỳ chọn**. **Bỏ bắt "Số buổi / 2 tuần" khi Xác nhận PA Tutor.** Kỳ vọng "Trung tâm" giữ 10 buổi / kỹ năng. Đủ / vượt chỉ gợi ý Kết thúc, không chặn | **ĐỔI** (HOTFIX-4 19/10 "Tutor vẫn cần Số buổi") | H2, H3: 133 PA kẹt | C6 |
| TU9 | **Ghi kết quả PA Tutor** (2 tuần / lần, hạn thứ Ba — giữ): chỉ Tiến triển + Quyết định (+ lý do khi Điều chỉnh / Thay); **số buổi kỳ này tự đếm** từ buổi có mặt trong kỳ; không gõ lại buổi | **ĐỔI** | H5 | C1 |
| TU10 | **Theo dõi, không hạn:** hai danh sách tính từ dữ liệu — **Chưa có người dạy** · **2 tuần chưa có buổi** (PA đang chạy, 14 ngày gần nhất không buổi có mặt). Hiện ở trang Tutor + một dòng "Việc quản lý" của Head tutor và Head. Không quá hạn, không chuông | **MỚI** (20/10: không việc) | nguyên tắc "không em nào bị bỏ sót" mà không thêm hạn | C7 |
| TU11 | **Em vắng:** tick Vắng tại buổi; không tính buổi; hiện "vắng n" ở thẻ PA; **không tự sinh** vi phạm Ý thức / việc / báo PH | **MỚI** | không thêm luật ngoài phần Tutor | C8 |
| TU12 | **Quyền xem của GV dạy tutor** (không dạy lớp em): thẻ tóm tắt **chỉ đọc** của đúng em × kỹ năng được giao — điểm kỹ năng + kỳ vọng, mô tả Case, các buổi; trong lúc PA mở + 30 ngày (như N48). Không mở hồ sơ, không sửa Case | **MỚI** | người dạy phải biết em yếu gì; N48 vẫn chặn phần còn lại | C9 |
| TU13 | **Đếm buổi theo người dạy × tháng** (một buổi nhóm = 1 buổi), xuất Excel; xem: Admin · Head · Head tutor · Quản trị · CX | **MỚI** (19/10 "chưa làm") | Rulebook §20.6 "tính buổi Free, có lương"; không thêm nhập liệu | C10 |
| TU14 | **Head tutor** = GV (N43, N50-9) + mục Tutor toàn hệ thống: thấy **dòng em cần tutor** + thẻ tóm tắt như TU12 (không mở hồ sơ HV); giao người dạy; quản danh bạ; nhận xét + kết luận tutor ngoài | **ĐỔI** (Q2 "không mở hồ sơ HV / Case") — chỉ nới đúng phần tutor | H8 | C11 |
| TU15 | **Head** (chi nhánh): làm mọi việc Tutor trong chi nhánh mình (giao, ghi buổi, sửa) — "làm là làm"; danh bạ tutor ngoài + kết luận: xem. **CX**: xem (N52). **Admin**: xem + xuất TU13. **TVV · GVCN**: xem ở hồ sơ | **ĐỔI** (Q9 "QL chỉ xem") | H7, H9 | C11 |
| TU16 | **Danh bạ tutor ngoài:** Tên + Kỹ năng bắt buộc; SĐT chống trùng; Tải danh sách; Gộp tên gõ tay + Hoàn tác; GV chỉ thấy 3 số cuối SĐT; xoá chỉ khi chưa có buổi | **GIỮ** (Q5, Q8, Q10, mục 13) | — | — |
| TU17 | **Phạm vi chi nhánh của buổi** = chi nhánh lớp em **lúc ghi** (chụp `lop_id`) | **GIỮ** (mục 12-1) | — | — |
| TU18 | **Sửa / xoá buổi:** sửa mọi lúc, có lịch sử; xoá → Thùng rác 30 ngày + Hoàn tác (N28). Nhận xét về tutor: sửa mọi lúc (LUAT-34), xoá cũng qua Thùng rác | **ĐỔI** nhỏ (xoá nhận xét ≤ 24 giờ → Thùng rác) | N3, N28, "không khoá cứng" | — |
| TU19 | **Một buổi một kỹ năng.** Em học 2 kỹ năng trong một lần gặp = 2 buổi | **MỚI** (PTA chọn) | buổi phải gắn đúng một PA | — |
| TU20 | **Lối vào:** menu **Tutor** hiện lại cho Head tutor · Head · Quản trị · CX · Admin (thứ tự G11: sau Phân tích); GV **không** có menu — khối "Em tôi dạy tutor" ở Công việc, chỉ khi có em | **ĐỔI** (AN-TUTOR 22/10 ẩn; 20/10 "GV không có trang") | lời chủ SP 19/11 mở lại Tutor | C12 |
| TU21 | **Không thêm việc có hạn** cho ai; không đổi Công việc ngoài khối TU20 + dòng TU10; không tab cấu hình Tutor ở Quản trị (chủ SP 12/11) | **GIỮ** | — | — |
| TU22 | **Hình thức** Offline · Online: máy tự suy (nơi dạy của người dạy so chi nhánh lớp em), không hỏi; sửa được trong Sửa buổi | **GIỮ** (Q6), bớt một ô | — | — |

## Chạm luật đã chốt khác — không tự đổi, đã thành câu hỏi

- Q2, Q3, Q4, Q9 (19/10) và HOTFIX-4 "Tutor vẫn cần Số buổi" (19/10) — đề xuất đổi ở TU6, TU8, TU14, TU15 → C5, C6, C11.
- N48 (GV không dạy em bị chặn hồ sơ) — TU12 là ngoại lệ hẹp → C9.
- N52 (CX xem mọi thứ) — TU15 chỉ áp cho đúng, không đổi.
- N43 / N50-9 (Head tutor là GV, luôn kèm vai GV) — giữ.
