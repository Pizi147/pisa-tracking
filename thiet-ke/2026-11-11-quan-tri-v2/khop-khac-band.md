# Quản trị › Band & ngưỡng (QTV2-BAND, PR-5) — thao tác TRƯỚC → SAU

| Thao tác | Ai | Trước | Sau | |
|---|---|---|---|---|
| Tên tab | QT, QL | "Bảng quy đổi" | "Band & ngưỡng" (link `?tab=band` giữ) | CHỮ |
| Xem / sửa kỳ vọng MT FT (MT1 · MT2 · MT3+ · RF) | QT sửa, QL xem | không có (viết cứng −1.0 / −0.5 / 0 / RF 0) | khối "Kỳ vọng MT Fast Track": bấm ô → ô số (bước 0.5, 0–3) → Enter | MỚI |
| Xem / sửa ngưỡng lớp thường (Học lại dưới · Lên từ · Mini Test đạt từ) | QT sửa, QL xem | không có (viết cứng 50 / 60 / 70 %) | khối "Ngưỡng lớp thường": ô số nguyên %; dòng chỉ xem "Cân nhắc a–b %", "Đạt từ → theo chương trình ›" | MỚI |
| Về gốc / Hoàn tác | QT | — | "gốc: … · Về gốc" ở ô đã đổi; Hoàn tác trên thông báo, chỉ đảo đúng ô đó | MỚI |
| Thang KET / PET | mọi vai xem | không hiện | một dòng chỉ xem + ⓘ (thang Cambridge, không sửa) | MỚI |
| Sửa bảng quy đổi (41 ô) | QT | nút Sửa ở đầu bảng | giữ nguyên | GIỮ |
| Khôi phục phiên bản bảng quy đổi | QT | Lịch sử phiên bản › Khôi phục | giữ nguyên (cột phải, dưới Nhật ký) | GIỮ |
| Đọc "Áp dụng" của bảng quy đổi | mọi vai | khối riêng 4 dòng ở cột phải | ⓘ cạnh "Áp cho điểm L / R nhập từ lúc lưu" (đủ nội dung + link IDP) | CHỖ |
| Xem ai đổi gì | QT, QL | chỉ Lịch sử phiên bản bảng quy đổi | thêm cột Nhật ký mục Band (8 dòng, cả 3 khối) + Quyền & nhật ký › mục Band & ngưỡng | MỚI |
| Mọi màn dùng kỳ vọng / dải Cuối khoá / Mini Test | mọi vai | hằng số | đọc bản có hiệu lực tại mốc của việc; chữ % (Phân tích, hồ sơ, Case & SOS mốc Final, Xét lại) theo bản mới nhất | GIỮ thao tác |

Không bỏ thao tác nào.

## Áp cho cái sinh sau (đặc tả 6.2)
- Kỳ vọng MT FT: bản tại **ngày tạo lượt MT** (`assessment_attempts.created_at`). Sửa điểm lượt cũ vẫn theo mức lúc tạo.
- Ngưỡng lớp thường: bản tại **ngày nhập điểm Final đầu tiên** (`assessment_scores.nhap_dau_ngay` nhỏ nhất của lượt). Bản chụp lộ trình đã đóng giữ dải đã chụp.
- Mini Test: bản tại **ngày làm**.
- "Đạt từ" của lớp vẫn ở Chương trình (bản chụp vào lớp, như cũ).

## Ghi chú cho PTA
- Nhãn mốc lớp thường ở Case & SOS (#1390, `BangMoc.tsx`: "Final 60–69 %"…) nay đọc khoảng % từ bản ngưỡng mới nhất (XM-1).
- Câu Công việc mô tả luật (hint Mini Test, Xét lại lộ trình) đổi sang chữ không số ("Đạt thì…", "dưới mức Học lại…") để không lệch khi đổi ngưỡng.
