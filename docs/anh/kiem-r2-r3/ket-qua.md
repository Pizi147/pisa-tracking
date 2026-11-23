# Kiểm R2 (Hoàn tác) + R3 W1 / W2 — 24/11

Playwright trên dev server của worktree (DB thử `data/pisa-demo.sqlite`, không sửa seed chung). Dữ liệu thiếu tạo bằng API (việc Vận hành, tutor) và SQL (W1, W2 — ghi ở cuối).
Mỗi luồng: chụp dữ liệu qua API **trước** → làm thao tác → **giữa** → bấm **Hoàn tác thật** ở toast → **sau**; so nguyên văn JSON trước / sau.

## R2 — toast Hoàn tác (1440 tối)

| Luồng | Vai | Trước → giữa → sau | Về như cũ | Ảnh |
|---|---|---|---|---|
| Đổi mốc lớp (MB FOU 12 · Progress tuần 4 → 5) | QL | tuần 4 → tuần 5 (đã xếp lại) → tuần 4; `/classes/6/progress` + `/classes/6/ho-so` giống hệt | ✓ | `moc-lop-2-toast`, `moc-lop-3-sau-hoan-tac` |
| Xoá việc Vận hành (giao nhầm, chưa cập nhật) | QL | có → 404, rời Công việc → có lại, ở Công việc (so bỏ `viewer`, `lichSu`) | ✓ | `xoa-viec-2-toast`, `xoa-viec-3-sau-hoan-tac` |
| Xoá tutor (chưa có buổi) | Head tutor | có → 404 → có lại; `/tutors/:id` giống hệt | ✓ | `xoa-tutor-2-toast`, `xoa-tutor-3-sau-hoan-tac` |
| Thêm HV (2 em, MB FOU 12) | QL | 7 em → 9 em (tìm thấy 2) → 7 em (không còn) · toast "Đã bỏ 2 học viên vừa thêm · Hoàn tác" | ✓ | `them-hv-2-toast`, `them-hv-3-sau-hoan-tac` |
| Xếp lịch Test lô (Lớp thường, MB FOU 24, 1 em · 4 bài) | QL | `/ke-hoach-test/lop` + `/ke-hoach-test/thuong/26` đổi → giống hệt bản trước | ✓ | `xep-lich-lo-2-toast`, `xep-lich-lo-3-sau-hoan-tac` |

## R3 — làm tại chỗ ở Công việc (1440 tối + 375 sáng)

| Việc | Vai | Bấm | Ở lại Công việc | GET khi mở | Làm hẳn | Ảnh |
|---|---|---|---|---|---|---|
| W1 Xác nhận Case · Speaking (`xem_nx_s`) | GV Speaking | "Xác nhận Case" (375: chạm dòng) | ✓ cả 2 bề rộng | `/cases/97` + tệp | "Dùng nhận xét này" → "✓ Đã xác nhận Case" — **lỗi ở 1440, đã sửa (dưới)** | `w1-xem-nx-s-1440/375-1-panel`, `w1-act-1-dung-nhan-xet` (trước sửa), `w1-1440-sau-mot-lan-bam` (sau sửa) |
| W2 Nhập ngày thi (`moc:` · thi) | QL | mở dòng gộp "2 em" → "Nhập ngày thi" | ✓ | 0 | Chốt ngày 15/12/2026 → việc `moc:43` hết | `w2-nhap-ngay-thi-1440/375-1-panel` |
| W2 Xếp lịch MT2 (`moc:`) | QL | "Xếp lịch" | ✓ | `/cycles/54` + `suggested-mocks` | "Áp lịch cho 2 lượt" → đóng → việc `moc:40` hết | `w2-xep-lich-mt-1440-0-mo-dong`, `w2-xep-lich-mt-1440/375-1-panel`, `w2-xep-3-sau-dong` |

## Lỗi tìm thấy

1. **Đã sửa trong PR này — bấm đầu tiên bị mất ngay dưới ô gõ tự lưu.** Panel Case mở từ Công việc tự đặt con trỏ vào ô Mô tả. Bấm "Dùng nhận xét này" (1440): nhấn chuột → ô mất focus, co lại → nút nhảy lên 64 px trước khi nhả → không có click, không gửi gì (đo: `yTruoc 564 → ySau 500`, 0 POST). 375 không bị (chạm). Gốc ở `OGoTuLuu` (`web/src/modules/cases/TaiCho.tsx`, dùng chung mọi ô Mô tả / tự lưu) → rời ô bằng chuột thì ô chỉ co lại khi nhả chuột (sau click). Sau sửa: một lần bấm → POST `/cases/102/xac-nhan-s`, "✓ Đã xác nhận Case".

## Ghi cho PTA (không sửa — cần quyết)

- **Tên dòng gộp việc `moc:`**: hai việc "Nhập dự kiến thi" + "Xếp lịch MT2" cùng lớp gộp thành "MB FT 101 · Thiếu dữ liệu đánh giá" (tên nhóm `missing_data`), không nói đúng việc (`w2-xep-lich-mt-1440-0-mo-dong`).
- **Xoá tutor**: QL (Head chi nhánh) mở được "Sửa tutor" nhưng không có nút Xoá tutor — đúng mã (`tutor.manage` = Head tutor + Quản trị; `coBuoi` chỉ tính cho người có quyền đó). Nếu muốn QL xoá được tutor mình vừa thêm nhầm thì là luật mới.
- W2 Lịch MT: hàng chưa xếp ghi "Chưa có, sẽ tạo" + "Áp lịch để tạo", nút chung "Áp lịch cho 2 lượt" (mô tả #2029 nói "nút Xếp lịch") — dùng được, chỉ khác chữ.
- "Chốt ngày · việc tiếp" khi panel mở bằng link `?viec=` (chuông) mà dòng gộp chưa mở: việc tiếp bỏ qua em cùng dòng gộp (ưu tiên việc đang hiện — đúng chú thích mã); bấm từ dòng gộp đã mở thì không bị.

## Dữ liệu tạo thêm (DB thử của worktree, đã trả lại bản sao lúc đầu sau khi kiểm)

- API: việc Vận hành "R2 giao nhầm", tutor "R2 Tutor …", 2 HV "R2 Thử Hoàn Tác …" (đã Hoàn tác).
- SQL W1: `assessment_scores.cho_phu_trach_xem = 1` (+ `comment`) cho bài Speaking lượt 152, 155.
- SQL W2: PA quy chế `case_interventions` 40 (đến MT2), 43 (đến lúc thi) → `started`, `started_date` 2026-11-20; bỏ MT2 / MT3 chưa làm của lộ trình 54 (lượt 124, 125 + `attempt_skills`, `attempt_schedule_history`); bỏ tuần dự kiến các MT lộ trình 55.
