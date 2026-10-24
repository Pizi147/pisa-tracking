# Truy vết — `tutor.html` (V5-B3 · Tutor)

> **HOÃN** (P10, chủ SP 22/10): không PR Tutor đợt này — xem lại tuần sau (~28/10).

V5-B3 · 22/10/2026 · dựa trên nền V5-A. Trạng thái: **ĐỀ XUẤT THIẾT KẾ**. Tutor / buổi là dữ liệu **[V5]** (seed `tuSeed.ts` ít dòng). Ảnh: `anh/tutor-*.png`.
URL mockup: `?vai=ql`, `?tt=tai|loi|rong`, `?mo=<i>`, `?luu=nhap|dang|da|loi`, `?hoi=1`, `?theme=dark`.

## Yêu cầu → khung → thành phần

| Yêu cầu | Loại | Khung (ảnh) | Thành phần |
|---|---|---|---|
| 16 — Tutor cùng nhận diện V5 | CHỐT | `tutor-1440-sang`, `-1440-toi` | thanh xanh, badge, bảng V5 |
| 16 — tỷ lệ kèm mẫu số | CHỐT | bảng, dải số | "% + n/N"; mẫu = buổi có trả lời ô đó (dòng cũ NULL không vào mẫu — như `trang.ts`); < 5 "mẫu nhỏ" |
| 16 — không có buổi ≠ kết quả thấp | CHỐT | hàng Phạm Quỳnh Như | "– Chưa có buổi trong kỳ · không phải kết quả thấp" một ô ngang |
| 16 · C08 — kết luận là nhận xét quản lý, không thành điểm KPI | CHỐT | cột "Kết luận (nhận xét quản lý)", câu cuối trang | nhãn trung tính "✓ Ổn / Cần cải thiện / Ngừng hợp tác" + ngày; không màu điểm |
| 16 — thao tác nhận xét gọn, bảo vệ bản nháp, không tự chuyển tutor khi chưa lưu (T16) | CHỐT | `tutor-panel-1440`, `-ban-nhap-1440` | panel việc: bối cảnh → Kết luận + Nhận xét → buổi gần đây (gập) → chân trạng thái lưu; bấm tutor khác khi còn nháp → hộp "Bỏ nhận xét đang gõ?" (Giữ / Mở tutor khác · giữ nháp) |
| 5.3 — "Lưu" ở lại, "Lưu và tiếp" chỉ chuyển sau khi lưu xong; trạng thái lưu rõ (T15) | CHỐT | `-panel-1440` (nháp), `-da-luu-1440`, `-loi-luu-1440` | nháp / đang lưu (nút khoá) / ✓ đã lưu (Lưu → Đóng) / ⚠ lỗi giữ chữ + Thử lại |
| Quyền: `tutor.manage` (Head tutor, QT) sửa; QL `tutor.view` chỉ buổi HV chi nhánh | GIỮ mã | `tutor-ql-chi-xem-1440` | QL: dòng 👁 chỉ xem, không "Ghi nhận xét", panel "TUTOR · CHỈ XEM" |
| Cần chú ý = một hàm (`canChuY`) cho số, lọc, lý do | GIỮ mã | dải số "Cần chú ý 2", cột Kết luận | lý do ⚠ chữ vàng đậm (cảnh báo, không lỗi) |
| Trạng thái rỗng / tải / lỗi · 1280 / 375 | CHỐT | `tutor-rong-1440`, `-1280`, `-375`, `-panel-375` | 375: thẻ tutor (tên · kỹ năng · nơi dạy · buổi ★ / 3 tỉ lệ / kết luận) |

## BỎ

- Chip chồng nghĩa (Cần chú ý / Thiếu thông tin / …) ở hàng lọc → chỉ "Đang dạy · Ngừng · Tất cả" + Kỹ năng + Nơi dạy + Tìm.
- Bộ chọn thời gian thứ hai trong panel (dùng kỳ của trang). "Toàn bộ" ở Tutor.
- Tự mở tutor kế sau khi lưu mà không bấm (V4 "Lưu nhận xét → tự mở tutor kế") → chỉ khi bấm "Lưu và tiếp".

## GIỮ

- Định nghĩa tỉ lệ tiêu chí, nhóm Cần chú ý, kết luận 3 mức (`server/src/tutors/trang.ts`).
- "Thêm tutor" nút chính, "Tải danh sách" phụ.

## Giả định

- 7 tutor, 55 buổi, 48/55 "Có chuẩn bị" là [V5]. Ngày giờ "Đã lưu 10:42" minh hoạ.
- Nháp nhận xét giữ trên máy (localStorage) — đề xuất cách bảo vệ nháp, chưa có trong mã.

## CẦN XÁC MINH

- Không có.
