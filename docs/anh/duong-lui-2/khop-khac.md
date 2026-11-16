# DUONG-LUI-2 (AU-LUI · gói 4 audit 16/11) — khớp / khác + thao tác TRƯỚC → SAU

Không có mockup mới (audit: "không cần mockup"); ảnh cặp là **trước (main) | sau (PR)**, demo, tối, 1440 + 375. Hình theo khuôn panel sẵn có (KhungPanel, chip, toast).

## Thao tác TRƯỚC → SAU

| Mã | Màn / vai | TRƯỚC | SAU | Mất thao tác? |
|---|---|---|---|---|
| P1-09 | Hồ sơ lớp › Cuối khoá › Chốt, tuần "Ngay hôm nay" · QL | Chốt → hộp "Chuyển ngay hôm nay? · ⚠ Chuyển ngay, không hoàn tác" → em sang lớp mới, KHÔNG Hoàn tác (sửa = chuyển ngược từng em) | Chốt → em sang lớp mới + toast "Đã chuyển n em sang lớp mới · Hoàn tác" (MỘT lời gọi đảo mọi em — tất cả hoặc không; Kỳ vọng của em chuyển ngay lưu cùng lời gọi nên Hoàn tác đảo cả Case Kỳ vọng; lớp nguồn tự kết thúc thì mở lại); nhãn cạnh ô tuần "⚠ Chuyển ngay khi chốt" | Không — bớt 1 hộp, thêm Hoàn tác |
| B1-02 | Hồ sơ lớp › ⋯ › Xoá lớp (lớp trống) · QL / QT | Gõ lại mã lớp → Xoá hẳn, "Không hoàn tác được" | Bấm Xoá lớp → lớp vào Đã xoá (30 ngày), toast Hoàn tác (mở lớp theo id máy chủ trả); Quản trị › Đã xoá có loại "Lớp" + Khôi phục; mã đã có lớp khác → "đã có lớp mã … — đổi mã lớp đó rồi khôi phục" | Không — bỏ ô gõ mã |
| B1-05 | Kế hoạch Test › hộp S Ex · GV S / QL | Nhập điểm lượt tuần sau → 400 "Chưa tới tuần…" | Giữ nguyên ngày + nhập điểm → lượt dời về tuần này (như Mock, vẫn theo khoá T6–CN), toast "… · dời về tuần này", nhật ký `tuDoi`; chủ động chọn ngày tương lai kèm điểm → 400 nói đường làm (giữ ngày) | Không |
| B1-06 | Lượt lớp thường đã huỷ › Khôi phục, lớp đã kết thúc · QL | 400 "Lớp đã kết thúc — không khôi phục được… xem ở Lịch sử" | QL: hỏi "Lớp … đã kết thúc — Mở lại lớp để khôi phục …?" → Mở lại lớp + khôi phục (Kết thúc lại được); người không mở được lớp: "… nhờ Quản lý lớp mở lại lớp rồi khôi phục" | Không |
| B1-07 | Ngăn Case › Sửa › Kỹ năng, Case có PA · GV / QL | Chip kỹ năng khoá "đã có PA — không đổi"; máy chủ 400 | Chọn được; máy chủ hỏi "Case có n PA — PA đi theo Case sang kỹ năng mới. Đổi kỹ năng?"; người phụ trách + PA người cũ làm chuyển sang GV kỹ năng mới (như tạo Case), lịch sử `topic` / `owner_user_id` / `pa_performer`, báo người mới | Không |
| B1-09 | Công việc › Chốt ngày thi · TVV | Lưu xong mọi ô khoá, chỉ còn "Đóng" | Lưu xong ô vẫn sửa được; đổi ô thì chân về "Chốt ngày" (lưu lại = sửa) | Không |
| A2-23 | Chuyển lớp một em (tuần sau) · QL; Duyệt đề xuất chuyển lớp (tuần sau) | Toast thường | Toast có "Hoàn tác" (= Huỷ quyết định / huỷ quyết định của thẻ); sửa lệnh đang chờ giữ toast thường | Không |
| B1-10 | Sửa vi phạm › Xoá vi phạm; Chi tiết vi phạm › Xoá · GV / GVCN | Hộp "Xoá vi phạm này?" rồi toast Hoàn tác | Xoá thẳng + toast Hoàn tác ("· lần xử lý vẫn giữ, bậc không lùi" khi vi phạm nằm trong lần xử lý) | Không — bớt 1 hộp |
| B1-11 | Quản trị › Tài khoản › ⋯ › Xoá · QT | Có dấu vết: gõ lại email / họ tên mới bật nút | Bấm thẳng (xoá mềm + Hoàn tác); giữ bảng dấu vết + cảnh báo + câu "Nên sao lưu…"; GVCN → máy chủ hỏi như cũ | Không — bỏ ô gõ |
| B1-14 | 5 câu chặn | Không nói bước tiếp | Mỗi câu có đường làm (Chuyển lớp lại từ lớp hiện tại · Thu hồi lần xử lý ở tab Ý thức · gửi Xin hỗ trợ mới · QL chi nhánh khác: "Học viên ở chi nhánh khác — QL chi nhánh của em nhập điểm") | Không |
| A1-21 + N50 (8) | Thang / Ý thức › Khai / sửa cấp bậc · GVCN | Tiêu đề "Xác nhận cấp bậc vi phạm" / "Sửa cấp bậc vi phạm"; chip "R1 R2 WL1…"; "xác nhận một lần, chỉ QL sửa sau"; GVCN không sửa sau lần xử lý | Tiêu đề "Khai / sửa cấp bậc vi phạm" như panel cả lớp (đã đổi ở #1790 — gộp theo main); đầu panel khuôn chung (Việc · Ý thức & Phối hợp · tên em · Thang LT1); chip viết đủ REPORT 1 · WARNING LETTER 1 (xuống dòng được); GVCN sửa mọi lúc, có nhật ký | Không |
| N50 (5) | "Không xử lý" vi phạm được yêu cầu khi em đủ 3 / 2 tuần · QL | 400 cho mọi vai | QL: hỏi "… vẫn Không xử lý (bỏ qua luật xử lý)?" → ghi, nhật ký `vuotLuat`, vi phạm ra khỏi luật 3 / 2 tuần — việc xử lý hết (cột `khong_xu_ly_vuot`, Hoàn tác về 0); GVCN giữ 400 (câu có "(Quản lý vượt được)") | Không |
| N50 (7) | Cuối khoá › ô lớp của MỘT em · QL | Chỉ lớp cùng chi nhánh ("Chỉ lớp chi nhánh MB") | Mở ô lớp của MỘT em → tải thêm lớp chi nhánh khác (cuối danh sách, "Chi nhánh MB trước, chi nhánh khác sau"); em đó chốt riêng (máy chủ: dòng đánh dấu, lời gọi một em, cần quyền ở lớp đích); ô áp chung / nhóm (cả lớp) giữ cùng chi nhánh — máy chủ chặn lô | Không |

## KHÁC (có lý do)

- Hướng dẫn QL: 5 câu "chuyển ngay, không hoàn tác" sửa thành "có Hoàn tác" (một em #8 đã có Hoàn tác; nay cả lớp cũng có). Câu Xét lại ("chuyển ngay hôm nay: không hoàn tác") GIỮ — đường Xét lại không thuộc PR này.
- Khôi phục bài lớp thường khi em ĐÃ ĐỔI lớp: giữ câu chặn + bước tiếp cũ ("Bài của em xếp ở lớp đang học"); phần "khôi phục thành bài lịch sử chỉ đọc" của đề xuất B1-06 chưa làm — ghi Việc để sau.

## Ảnh

`truoc-*.png` (main c2ba2fd06) | `sau-*.png` (PR) — xem bảng ảnh ở mô tả PR.
