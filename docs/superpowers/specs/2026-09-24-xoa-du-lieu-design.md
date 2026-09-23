# Đặc tả xoá dữ liệu (chỉ Quản trị hệ thống) — 24/09/2026

**Nguồn:** chủ sản phẩm chốt 24/09 qua session deploy; planning thiết kế chi tiết (các dòng "Planning quyết" bên dưới).
**Mục đích trước mắt:** dọn dữ liệu thử trên bản chính trước khi báo GV (lớp MB-FT THU 01, HV PISA-000001..3, tài khoản Thử Quản Lý / Thử GVCN / Thử GVBM — **không đụng** 3 tài khoản thật Hằng, Yến, Thu Hà).
**Quyền:** mọi thao tác xoá **chỉ Quản trị hệ thống**, kiểm ở **máy chủ** (quyền quản trị `admin.config`); QL chi nhánh, GV không thấy nút, gọi API → 403.
**Luôn nhắc sao lưu:** panel xoá có dòng "Nên sao lưu trước lần xoá đầu (npm run sao-luu)".

## 1. Xoá học viên

- **Vị trí:** Hồ sơ HV → ⋮ → cuối menu sau đường kẻ: **Xoá học viên** (chữ đỏ).
- **Panel xác nhận** (KhungPanel 560px): tên + mã + lớp; bảng **những gì sẽ mất** (số lượt Test, điểm, Case, PA học thuật, theo dõi, vi phạm, PA xử lý, Phối hợp SOS, tệp, thông báo); câu "Không khôi phục được (trừ từ bản sao lưu)"; ô **gõ lại mã HV** (vd `PISA-000001`) → mới bật nút đỏ **Xoá vĩnh viễn**.
- **Máy chủ:** một hàm `xoaHocVien(p, studentId, maXacNhan)` chạy trong **một `tx()`**, xoá theo thứ tự con → cha mọi dòng gắn em, trực tiếp và gián tiếp (lượt Test → attempt_skills, assessment_scores, attempt_schedule_history…; Case → case_interventions, case_followups, milestones, lịch sử điều chỉnh PA…; vi phạm ↔ biện pháp (xoá liên kết; biện pháp chỉ gắn vi phạm của em thì xoá, gắn cả em khác thì giữ); sos_coordination_actions; attachments theo `owner_type`; notifications; enrollments; learning_cycles; lo_trinh_tiep_theo; case_signals; journey…). Gom DELETE theo tập (`WHERE … IN (SELECT …)`) để ít câu (Turso).
- **Tệp Blobs** xoá **sau khi giao dịch chốt** (khuôn Task 6e); lỗi xoá tệp chỉ ghi log, không cuộn lại.
- **audit_logs**: ai xoá, lúc nào, tên + mã em, số dòng mỗi loại đã xoá.
- **Phép kiểm bắt buộc — "không sót":** duyệt `PRAGMA foreign_key_list` của MỌI bảng, dựng đồ thị tham chiếu tới `students` (trực tiếp + qua bảng trung gian) và khẳng định sau khi xoá một em có đủ loại dữ liệu thì **0 dòng** còn trỏ tới em hoặc tới dòng con đã xoá; em khác cùng lớp không mất dòng nào. Bảng mới thêm sau này mà quên → phép này đỏ.

## 2. Lưu trữ tự động (sửa luật 4.17)

- Planning quyết: học viên **thôi học** thì **tự vào Lưu trữ**: `setStudentStatus(…, 'finished')` (Dừng học ở Chuyển tiếp lớp, Kết thúc học ở ⋮ Hồ sơ HV, Kết luận lộ trình FT khi em thôi học) đặt `archived_at` = ngày hiệu lực. Hiện mã đặt `archived_at = NULL` (`students.ts:265`) → đổi.
- **Bảo lưu** (tạm dừng) **không** lưu trữ. "Bỏ lưu trữ" / "Quay lại học" như cũ.
- Migrate một lần: em `status='finished'` mà `archived_at IS NULL` → `archived_at = finished_at`.

## 3. Xoá tài khoản

- **Vị trí:** Quản trị hệ thống → Tài khoản → ⋯ dòng → **Xoá tài khoản**.
- **Dấu vết** = có dòng ở bảng dữ liệu nghiệp vụ trỏ tới người này (người nhập điểm, người tạo/sửa Case, PA, người thực hiện, người ghi vi phạm, audit…) — dựng từ `PRAGMA foreign_key_list` (68 cột), **trừ** bảng thiết lập: users, user_roles, phiên đăng nhập, teacher_assignments, auth_attempts, notifications gửi TỚI người đó.
- **Chưa có dấu vết** → xoá hẳn (cùng user_roles, phiên, phân công, thông báo tới người đó).
- **Có dấu vết** → xoá mềm trong một `tx()`: `status='deleted'`, `deleted_at`; **tên thành "{tên} (đã xoá)"** (nên lịch sử mọi nơi tự ghi kèm); **email giải phóng** (đặt lại dạng `da-xoa-{id}@invalid` để tạo tài khoản mới cùng email); xoá mật khẩu + mọi phiên (đăng xuất ngay); kết thúc user_roles và phân công (`effective_to` hôm nay); ẩn khỏi mọi ô chọn người / phân công / danh sách GV (kiểm `/ref/nguoi`, ChonNguoi, TeacherAssign, bộ lọc Người phụ trách).
- **Chặn:** không tự xoá chính mình; không xoá Quản trị hệ thống cuối cùng; đang là **GVCN lớp còn hoạt động** → chặn, báo "Đổi GVCN lớp X trước". Đang là GVBM → panel cảnh báo "Lớp X sẽ thiếu GV môn Y" (vẫn cho xoá).
- Panel xác nhận: tên, email, vai, chi nhánh; "Có dấu vết (n dòng) → tài khoản bị khoá và ẩn, lịch sử giữ tên kèm (đã xoá)" hoặc "Chưa có dấu vết → xoá hẳn"; gõ lại email để bật nút. audit_logs ghi đủ.

## 4. Xoá lớp / Kết thúc lớp

Đã làm trong **PR-UX3 (#98)**: chỉ Quản trị hệ thống; Xoá lớp chỉ khi chưa từng có HV/Test/điểm/Case/vi phạm; Kết thúc lớp khi còn dữ liệu nhưng không còn HV đang học. Dọn lớp thử MB-FT THU 01: xoá 3 HV thử trước (mục 1) → lớp trống → Xoá lớp.

## 5. Chia PR

| PR | Phạm vi | Phụ thuộc | Model (B) | Rà |
|---|---|---|---|---|
| **PR-XOA** | §1, §2, §3 | merge sau UX3 #98 (chung ⋮ Hồ sơ HV, KhungPanel) | Opus 5.5 · XHigh (Fable 5.1 · High) | Fable 5.1 (nếu code Fable thì Opus 5.5) |
