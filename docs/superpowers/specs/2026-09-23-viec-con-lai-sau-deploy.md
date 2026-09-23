# Việc còn lại — kiểm kê 23/09/2026 tối (trước deploy bản chính)

**Cách làm:** đối chiếu đặc tả `2026-09-22-ux-toan-web-truoc-deploy-design.md`, kiểm kê `2026-09-22-kiem-ke-truoc-deploy.md`, mục "Chuyển cho" của mọi kế hoạch và các lỗi nhỏ ghi sau từng lần rà PR, với **mã thật trên `main` @ 11dc311** (sau #84; #83 Ra chưa merge lúc quét, đã đọc nhánh). Không tin ô tick.
**Đã xong trước deploy:** O, S1, AN, Pa, Qa, Rc1, S2, Form, Pb-gọn, TD, Qb, Rc2, YT2 (#77 + #82), Ra (#83), Z2c-a (#81), Z2c-b (#84). **Đang làm:** LT.

## A. Làm trước khi báo giáo viên

| # | Việc | Bằng chứng | Cỡ | Ai làm |
|---|---|---|---|---|
| A1 | PR-LT merge (có migrate) | đang code | L | session LT |
| A2 | Mất luồng Turso khi POST/trong `tx()` cũng phải bỏ kết nối chết (`moLaiKetNoi`), không thử lại | `app.ts:99-104`, `db.ts:134` | S | buổi deploy |
| A3 | 5 nơi gọi `skillCells` chưa truyền `hoanTat` → ô đợt đã hoàn tất hiện như sửa được (máy chủ vẫn chặn khi lưu) | `scoreDebt.ts:79`, `classes.ts:202,422`, `attempts.ts:687,851` | S | buổi deploy |
| A4 | Bộ chọn tuần không phát `periodId` mặc định → ngăn Xếp lịch hàng loạt không có xem trước, nút Lưu khoá tới khi bấm ‹›; nút cao 40px | `ui/Filters.tsx:137-144, 245-274`; `NganXepHangLoat.tsx:75,124` | S | buổi deploy |
| A5 | Lưới chấm: Enter khi thiếu tổng vẫn nhảy dòng (dễ bỏ sót) | `ScoreEntry.tsx:934,968-971`, `LuoiThuong.tsx:401` | S | buổi deploy |
| A6 | Deploy: migrate DB THỬ (Ra, LT) trước deploy nháp · Step 1(c)(d) chi nhánh thật `MÃ=Tên` + email quản trị · mục 6 TRIEN_KHAI (biến bản chính) · Step 3→9 · Task 11 rà độc lập · kiểm máy tính bảng + điện thoại thật · bấm thử nút Duyệt (#83, demo chưa bấm được) | plan 21/09 Task 10–11, PR #81 | M | buổi deploy + chủ sản phẩm |

## B. Đã xếp PR sau deploy

| PR | Còn thiếu thật trên `main` | Cỡ |
|---|---|---|
| **PR-GV** · Hồ sơ GV + Phân tích › Theo giáo viên (§3.12, §3.3) | Không có route `/giao-vien`; `CO_TRANG_HO_SO_GIAO_VIEN = false` (`shared/domain/hocVienLop.ts:265`); tên GV ở hồ sơ lớp là chữ thường; `BangTheoGiaoVien` cũ vẫn ở `BranchPulse.tsx:79,149` | L |
| **PR-Pb2** · Phân tích phần còn lại | P8b danh sách mobile + cột thao tác · P9 thanh tỷ lệ, "Thời gian thường mất", nhóm chưa xác định nguồn (`planOutcomesUnattributed` chưa có route) · P9b so PA trong một vấn đề, HV duy nhất, trung vị, "hỗ trợ đồng thời" (`effectiveness.ts:339`) · P12 `<KetQuaDot>`/`<TyLe>` thêm màn · nhận định xu hướng ở Điểm đáng chú ý | M–L |
| **PR-S3** · Chữ cuối (gần như chưa làm) | S7: 60 `<SectionNote>` / 49 `<Empty>` · THUAT_NGU ~170 dòng (mẫu 10: 8 còn chữ cũ) · S9 `MockDetailPage.tsx:455-462` · RB-2 ~11 file tự viết "hạn" · RB-4 11 chỗ đọc `session.demoDate` · DS16 script quét chữ · DOC-1,3,4,5,6 (DOC-2 gần xong) · nợ PR-O: `cn`↔`branchId`, nút thanh dưới 36px→44px (`App.tsx:50`), 4 cờ quyền cũ + `WorkQueue` chết (`StudentsPage.tsx:268`) · dọn `dashboard.ts`/`/overview`, `summary.ts`, `YThucReminders` component · "Đã tốt hơn hẳn" (`cases.ts:258`), nhãn MT ở `students.ts:65-68`, `đợt ${n}` (`skillSchedule.ts:441`), "Việc đã giao" (`MeetingPage.tsx:212`), "hẹn xem lại" (`CasePanel.tsx:541`), `xac-minh-sos` nhãn (`display.ts:242`), OverviewPage không giữ `ct` | L |

## C. Lỗi nhỏ chưa PR nào nhận → gom **PR-Dọn** sau deploy (M)

- **Số liệu (G-10):** "n Case đang mở" hộp lớp và cột Case hai nguồn đếm (`hocVienLop.ts:119-128` vs `classes.ts:318-340`) · `listCases` lọc theo `COALESCE(cur,a)` nhưng quyền theo `COALESCE(a,cur)` (`cases.ts:1741,1755`) · bảng chi nhánh xếp Case theo lớp đang học, bộ lọc chương trình theo lớp bài Test (`bangChiNhanh.ts:89`, `chuongTrinh.ts:43`) · `vanDe.ts:83` bỏ im Case hạng mục ngoài bộ kỹ năng · cột kỹ năng FT tính cả lượt Tạm thời, tooltip không nói (`tongHop.ts:178`) · `weeksReported` kỳ tháng đếm theo mức (`meeting.ts:207`) · `hanGoc`/`soLanDoiHan` tính cả lần đặt hạn đầu (`mgmttasks.ts:225,610`).
- **Chữ/hiển thị:** ô Chờ xác minh lặp "tín hiệu" (`MetricTiles.tsx:38`) · panel SoLieu ghi "dưới kỳ vọng" khi chọn Lớp thường (`SoLieu.tsx:71`) · dòng tín hiệu nói "quá hạn" 3 lần (`WorkList.tsx:67,76,83`) · "Nhập bởi … giờ máy" (`MockDetailPage.tsx:445`) · dòng phụ Tạm ngưng bị cắt mất "cần ai · xem lại" (`MgmtTasksPage.tsx:213`) · khối `hanGoc` chết (`MgmtTasksPage.tsx:290`) · "Cả hai" ở Danh sách Case mất chip Kỹ năng (`CaseBoardPage.tsx:61`).
- **Hành trình (Qb):** PA đang chạy kéo tới cột cuối (`HanhTrinh.tsx:336`) · tuần hiện tại chỉ tô ô nhãn · hai đợt cùng tuần ghim chồng · `?dot=` cuộn trước khi bảng tải · tên vấn đề sát mép + chữ khối PA cắt (đã giao LT — kiểm khi rà LT).
- **Kế hoạch Test (Rc2):** R9b tick lại cả lớp sau lưu một phần (`NganXepHangLoat.tsx:49`) · màu cứng `keHoach/LuoiFT.tsx`.
- **Quyền/an toàn nhẹ:** `/ref/nguoi` không kiểm quyền với `studentId`, lọc chi nhánh chỉ khi `trongPhamVi=1` (`routes/index.ts:293`) · Quản trị thuần chọn "Tôi" ở Phụ trách PA → 400 (`measures.ts:239`) · nhập bù không `idempotencyKey` (`QuickReport.tsx:213`) · `helpName` không giới hạn độ dài.
- **Khác:** `thongTinLop.ts:31` trùng mã lớp phân biệt hoa/thường · `deadlineView` cắt theo UTC (`display.ts:289`) · `BangChung` onDragLeave nhấp nháy · Tutor ở ChonViec không lọc chi nhánh (`MeetingPage.tsx:400`) · `exec` ROLLBACK không xoá bộ nhớ request (`db.ts:216`) · khoá `latestAttempts` dài.
- **Cần chủ sản phẩm quyết:** GVCN không dạy môn đó không nhập bù Case môn đó (luật C02 cố ý) — giữ hay cho ngoại lệ?

## D. Hoãn có chủ ý / đã loại

Taxonomy vấn đề (chờ tổ chuyên môn, 4.14) · kho ý tưởng I01–I26 · DS còn lại (DS14 đã có; DS16 vào S3) · màn tạo chi nhánh AN-14 (giữ lệnh `them-chi-nhanh`, 4.18) · F-4 cảnh báo trùng Case trước khi lưu · ba ý tưởng đã loại plan §20.1 · Công việc: khối "Cần quyết định trong cuộc họp", số trên hàng tab (Ra Q17) · `GET /demo/accounts` N+1 (bản chính 404).
