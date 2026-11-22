# SUA-2211-B — 5 ý chủ SP 22/11 (ý 2 · 8 · 9 · 11 · 14), không đổi bố cục

Ảnh "trước": ảnh demo main chủ SP gửi 22/11 (ý 2, 8, 9) + ảnh chụp lưới trên nhánh trước khi sửa (ý 11). Ảnh "sau": dev server worktree, Playwright Edge, phông Be Vietnam Pro đã nạp (`document.fonts`).

| Ý | Trước | Sau |
|---|---|---|
| 2 · Hồ sơ HV "Việc cần làm" | `truoc-1-hoso-viec.png` | `sau-1b-viec-1440.png` (dòng dàn ngang) · `sau-1-hoso-1440.png` (`?viec=bo-sung` → panel Sửa thông tin mở sẵn, con trỏ ở ô thiếu) · `sau-1-hoso-375.png` |
| 8 · Panel "Đạt MT" | `truoc-2-datmt.png` | `sau-2-datmt-1440.png` · `sau-2-datmt-375.png` |
| 9 · Dòng "Cả lớp · 2 lớp" | `truoc-3-ca-lop.png` | `sau-3-congviec-1440.png` · `sau-3-congviec-375.png` |
| 11 · Ô điểm đã huỷ | `truoc-4-huy-1440.png` | `sau-4-huy-1440.png` · `sau-4-huy-375.png` |
| 14 · TVV không Phân tích | (menu có "Phân tích") | `sau-5-tvv-pt-1440.png` (không mục menu; gõ thẳng `/phan-tich` → "Không có quyền") |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| Bấm việc ở "Việc cần làm" hồ sơ HV | dòng chiếm nửa trái (2 cột), rê chuột hiện tooltip trùng chữ nút | một cột dàn hết ngang, không tooltip | ý 2 |
| Chip "Bổ sung hồ sơ" ở HV của tôi (Công việc TVV) | sang hồ sơ em, phải bấm lại "Bổ sung hồ sơ" | sang hồ sơ em `?viec=bo-sung`, panel mở sẵn; tham số bỏ sau khi mở (Quay lại / F5 không mở lại) | ý 2 |
| Bấm "Đạt MT n %" hồ sơ lớp | panel chỉ tên + "MT3" | mỗi dòng: lượt · tuần, L R W S ✓/✗, Overall / KV, Target, chip SOS; panel SOS cùng dáng | ý 8 |
| Nhập điểm theo tuần nhiều lớp | MỘT dòng "Cả lớp · W2 SEP · 3 bài" + nút "2 lớp ▾" | mỗi lớp một dòng "MB FT 101 · Writing Task 1 · W2 SEP · n bài" + "Nhập điểm"; cùng lớp + cùng tuần nhiều bài vẫn gộp một dòng (tên = các kỹ năng) | ý 9 |
| Ô môn đã huỷ (lớp thường, người nhập được) | ô nhập rỗng + chữ nhỏ "Đã huỷ" dưới ô (hàng cao, lệch) | chip "Đã huỷ" giữa ô cùng hàng, lý do ở title; ⋯ luôn hiện (Khôi phục · Lịch sử) | ý 11 — **bớt**: gõ điểm thẳng vào ô đã huỷ; nay Khôi phục ở ⋯ (Hoàn tác 10 s) rồi nhập. Ô đã huỷ không phải việc; giữ ô nhập thì không thể hiện rõ trạng thái được (chủ SP chê). Cần giữ gõ thẳng → PTA quyết [XM] |
| Ô FT đã huỷ (lưới Lịch Test / panel nhập điểm) | khung chấm "Đã huỷ" + dòng lý do dưới ô | ô một dòng, nền / viền như chip "Đã huỷ", lý do ở title; bấm vẫn mở hộp (Khôi phục…) | ý 11 |
| TVV mở Phân tích | có mục menu, trang chạy | không mục menu, trang "Không có quyền", máy chủ 403 mọi `/phan-tich/*` | ý 14 |

## Luật mới (để PTA chép plan.md 1.6)
- **TVV không xem Phân tích** (chủ SP 22/11 ý 14): vai TVV không có `analysis.view`; mọi đường `/phan-tich/*` 403 với vai không có quyền này. Vai kiêm (CX, Head…) giữ theo vai kia.

## [XM] / để sau
- Tên việc dài "MB FT 102 · Writing Task 1, Writing Task 2" xuống dòng ở cột tên Công việc 1440 (có từ trước, không do PR này) — đợt thiết kế panel / cột.
