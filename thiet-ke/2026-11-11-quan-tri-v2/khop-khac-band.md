# Quản trị › Band & ngưỡng (QTV2-BAND, PR-5) — thao tác TRƯỚC → SAU

| Thao tác | Ai | Trước | Sau | |
|---|---|---|---|---|
| Tên tab | QT, QL | "Bảng quy đổi" | "Band & ngưỡng" (link `?tab=band` giữ) | CHỮ |
| Xem / sửa kỳ vọng MT FT (MT1 · MT2 · MT3+ · RF) | QT sửa, QL xem | không có (viết cứng −1.0 / −0.5 / 0 / RF 0) | khối "Kỳ vọng MT Fast Track": bấm ô → ô số (bước 0.5, 0–3) → Enter | MỚI |
| Xem / sửa ngưỡng lớp thường (Học lại dưới · Lên từ · Mini Test đạt từ) | QT sửa, QL xem | không có (viết cứng 50 / 60 / 70 %) | khối "Ngưỡng lớp thường": ô số nguyên %; dòng chỉ xem "Cân nhắc a–b %", "Đạt từ → theo chương trình ›" | MỚI |
| Về gốc / Hoàn tác | QT | — | "gốc: … · Về gốc" ở ô đã đổi; Hoàn tác trên thông báo, chỉ đảo đúng ô đó | MỚI |
| Thang KET / PET | mọi vai xem | không hiện | một dòng chỉ xem + ⓘ (thang Cambridge, không sửa) | MỚI |
| Đọc cột Final ở Phân tích / dải ở Tổng kết lộ trình | mọi vai | "Dưới 50% · 50–59% · 60–69%" | "Học lại · Cân nhắc · Lên + bổ trợ" (ⓘ nêu theo mức ở Band & ngưỡng) — mỗi bài theo bản của lớp nó | CHỮ |
| Sửa bảng quy đổi (41 ô) | QT | nút Sửa ở đầu bảng | giữ nguyên | GIỮ |
| Khôi phục phiên bản bảng quy đổi | QT | Lịch sử phiên bản › Khôi phục | giữ nguyên (cột phải, dưới Nhật ký) | GIỮ |
| Đọc "Áp dụng" của bảng quy đổi | mọi vai | khối riêng 4 dòng ở cột phải | ⓘ cạnh "Áp cho điểm L / R nhập từ lúc lưu" (đủ nội dung + link IDP) | CHỖ |
| Xem ai đổi gì | QT, QL | chỉ Lịch sử phiên bản bảng quy đổi | thêm cột Nhật ký mục Band (8 dòng, cả 3 khối) + Quyền & nhật ký › mục Band & ngưỡng | MỚI |
| Mọi màn dùng kỳ vọng / dải Cuối khoá / Mini Test | mọi vai | hằng số | đọc bản tại mốc của lượt; nhãn dải ở báo cáo theo tên; Case & SOS mốc Final (màn cấu hình) theo bản mới nhất | GIỮ thao tác |

Không bỏ thao tác nào.

## Áp cho cái sinh sau (PTA chốt 11/11)
- Kỳ vọng MT FT: bản tại **`created_at` của lượt MT**, so cả giờ với lúc lưu bản. Lượt MT tạo một lần khi mở lộ trình ⇒ **áp cho lộ trình mở từ nay**; MT sắp tới của lộ trình đang chạy giữ mức cũ, sửa điểm sau cũng vậy. ⓘ khối ghi "Áp cho lộ trình mở từ nay".
- Ngưỡng lớp thường (dải Cuối khoá): bản tại **`created_at` của lượt Final**, so cả giờ ⇒ **áp cho lớp mở từ nay**. Không dùng `nhap_dau_ngay` (bị đặt NULL khi huỷ điểm — dùng cho "chấm đúng hạn"). Bản chụp lộ trình đã đóng giữ dải đã chụp.
- Mini Test: bản tại **lúc ghi** (`ghi_luc`).
- Bản Band / Ngưỡng đóng dấu bằng giờ thật (cùng đồng hồ `created_at`, `ghi_luc`); Hạn mặc định giữ đồng hồ nghiệp vụ.
- "Đạt từ" của lớp vẫn ở Chương trình (bản chụp vào lớp, như cũ). Lưu ngưỡng chặn "Lên từ" ≥ "Đạt từ" nhỏ nhất của các chương trình đúng / tổng.
- Nhãn dải trên báo cáo (Phân tích cột Final, Tổng kết lộ trình ở hồ sơ HV) theo **tên dải** (Học lại · Cân nhắc · Lên + bổ trợ · Pass), không kèm số — mỗi bài có thể theo bản khác.

## Ghi chú cho PTA
- Nhãn mốc lớp thường ở Case & SOS (#1390, `BangMoc.tsx`: "Final 60–69 %"…) nay đọc khoảng % từ bản ngưỡng mới nhất (XM-1).
- Câu Công việc mô tả luật (hint Mini Test, Xét lại lộ trình) đổi sang chữ không số ("Đạt thì…", "dưới mức Học lại…") để không lệch khi đổi ngưỡng.
