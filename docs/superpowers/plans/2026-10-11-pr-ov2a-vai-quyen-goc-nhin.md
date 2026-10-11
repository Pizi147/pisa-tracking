# PR OV-2a — Vai TVV / CX / Admin, quyền, thanh trên theo vai, đổi góc nhìn, Tổng quan TVV

Nguồn: đặc tả OV mục 2 (bảng quyền), 6.1 (nghiệm thu "Vai") — `docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md`;
mockup đã duyệt `thiet-ke/mockup-overhaul-3-tong-quan-vai-chuong-trinh-2026-10-11.html` §2 (đổi góc nhìn), §3 (TVV), §4 (CX · Admin), §5 (ma trận).
Rà: **sâu** + `/security-review` (quyền). Chạy song song với **OV-3a** (xem "Ranh giới").

**Trạng thái: [x] xong — nhánh `claude/pr-ov2a-vai-quyen-oqmdnt` (11/10).**

## Đầu ra
1. Ba vai mới giao được ở Quản trị › Tài khoản (theo chi nhánh như vai cũ; CX mặc định toàn hệ thống):
   `consultant` = "Tư vấn viên" (TVV), `cx` = "CX", `office_admin` = "Admin". KHÔNG dùng lại mã `branch_admin` (đã bỏ, giữ để đọc lịch sử).
2. Quyền đúng **bảng mục 2 đặc tả**, máy chủ chặn (403), không chỉ ẩn nút. Điểm chính:
   - Admin: Test 3 tab, xếp/dời lịch, nhập + sửa điểm (sửa có lý do = `score.override`), sửa thông tin HV, xem Case/PA/Ý thức,
     Công việc chỉ nhóm Chấm điểm + Nhắc. **Không** Huỷ / Khôi phục lượt (kể cả gọi thẳng API), không Target, không Lộ trình/KQĐR.
   - TVV: xem HV chi nhánh (mặc định "HV của tôi"), sửa thông tin HV (chỉ các trường: họ tên, ngày sinh, email, TVV, dự kiến thi,
     điểm đầu vào), xem Case/PA/Ý thức, xem nhận xét điểm. Không Test, không Công việc.
   - CX: như TVV nhưng mọi chi nhánh; Tổng quan · Phân tích xem được **trừ phần GV** (không Phân tích › Theo giáo viên, không mở
     `/giao-vien/:id` — tên GV vẫn hiện như chữ).
3. Thanh trên theo vai (đã theo quyền ở `server/src/platform/nav.ts` → `navOf`): TVV/CX không có Test, Công việc; Admin có Công việc (2 nhóm).
4. **TVV Tổng quan** (M3 §3): "Học viên của tôi" — 4 số + danh sách "Cần chú ý" (theo mockup). HV của tôi = `students.consultant_user_id`
   = người xem. Cột mới thêm ở PR này (migrate), **chưa có ô chọn** (OV-2b làm) → trước OV-2b danh sách trống có câu hướng dẫn rõ.
5. **Đổi góc nhìn** (M3 §2): chỉ người có vai QL hoặc Quản trị VÀ nắm ≥ 2 vai. Menu tài khoản → chọn vai → phiên làm việc đúng quyền vai đó
   (máy chủ lọc `grants` theo vai đang chọn, lưu ở phiên đăng nhập). Dải "Góc nhìn: {vai} · {phạm vi} · Về {vai gốc}". Bộ lọc nhớ
   (localStorage) theo từng vai. Ở góc nhìn GV, API từ chối việc chỉ QL làm được.

## Thiết kế (planning chọn — lệch thì hỏi, không tự đổi)
- `shared/domain/people.ts`: thêm 3 mã vào `ROLES` + `ROLE_LABEL`; sửa chú thích "Admin chi nhánh đã bỏ" (vai Admin mới khác vai cũ).
- `server/src/seed/data.ts`: `ROLES` + `ROLE_PERMISSIONS` 3 vai mới. Quyền mới nếu cần (vd `student.edit_info` cho trường giới hạn của
  TVV/CX, `analysis.view_teacher` cho phần GV) → thêm vào `PERMISSIONS` + `shared/domain/nhomQuyen.ts` (`MO_TA_QUYEN`) + cấp cho vai cũ
  đang có hành vi đó (không nới, không bớt quyền vai cũ).
- Migrate riêng `server/src/migrate/prOv2.ts` (đăng ký cuối `server/src/migrate.ts`): chèn 3 dòng `roles` (+ `role_permissions`) nếu thiếu
  (`migratePermissions` KHÔNG chèn vai mới); `students.consultant_user_id INTEGER REFERENCES users(id)` + index; `demo_sessions.goc_nhin TEXT`.
  Tự kiểm, chạy lại không đổi gì. Cột mới cũng thêm vào `schema.sql`.
- Góc nhìn: `server/src/auth.ts` `resolveSession` đọc `goc_nhin`; còn nắm vai đó → Principal chỉ giữ grants của vai đó (+ `roleKeys` tương ứng);
  không còn nắm → bỏ qua (về vai gốc). Đường `PUT /session/goc-nhin {role|null}` kiểm điều kiện mục 5. Payload phiên thêm `gocNhin`, `vaiGoc`.
  Mọi chỗ tạo Principal bằng tay (vd `server/src/cham/chamCheo.ts:22`) thêm trường nếu thêm vào type.
- **Rà mọi chỗ so tên vai cứng** (có danh sách sẵn): `cases/cases.ts:353`, `classes/hocVienLop.ts:64,265`, `giaoVien/phamVi.ts:18,27`,
  `platform/accounts.ts:162,215,260`, `platform/audit.ts:67`, `yThuc/xuLy.ts:47`, `duyet/yeuCau.ts:54,60`, `worklist/meeting.ts:709`,
  `worklist/mywork.ts:669`, `platform/timNguoi.ts:17`, `classes/classes.ts:881`, `permissions.ts` (`teacherAllows`, `scopeFor`).
  Mỗi chỗ: vai mới đúng bảng mục 2 chưa? Ghi kết luận từng chỗ vào mô tả PR.
- Web: `AccountsAdmin.tsx` (ô chọn vai đọc `ROLES`), `App.tsx` (thanh trên + dải góc nhìn + menu tài khoản), `OverviewPage.tsx` (nhánh TVV),
  file mới `web/src/modules/worklist/HocVienCuaToi.tsx` (TVV). Chữ theo mockup.

## Ranh giới (chạy song song OV-3a)
- KHÔNG sửa `web/src/modules/classes/*`, `web/src/modules/students/ClassRoster.tsx`, `BangDiemLopThuong.tsx`, `TabHocVienLop.tsx`
  (của OV-3a). Hồ sơ lớp tự đúng theo quyền máy chủ; cần sửa ở đó thì ghi vào báo cáo, không sửa.
- Chung tất yếu: `server/src/tests/run.ts` (mỗi PR thêm một dòng đăng ký cuối file) và `plan.md` — xung đột chỉ là gộp dòng.
- Không làm phần của OV-2b: ô chọn TVV, email/ngày sinh bắt buộc, Tạm dừng/Thôi học, cột TVV ở Sửa cả lớp.

## Kiểm
- `server/src/tests/prOv2a.tests.ts` (đăng ký cuối `run.ts`), đỏ trước khi sửa:
  - Ma trận: với mỗi vai (Quản trị, QL, Admin, GVCN, GVBM, TVV, CX) × mỗi dòng bảng mục 2 → `can()` đúng; gọi route thật ngoài quyền → 403
    (ít nhất: Admin huỷ/khôi phục lượt, TVV/CX vào Test/Công việc, CX mở hồ sơ GV + Phân tích theo GV, TVV sửa Target).
  - TVV sửa thông tin HV: trường ngoài danh sách bị từ chối.
  - Góc nhìn: QL+GV chọn GV → việc chỉ QL bị 403; người 1 vai / không QL gọi đổi góc nhìn → 403; bỏ vai đang chọn → về vai gốc.
  - Migrate prOv2 chạy hai lần không đổi gì; DB cũ chưa có 3 vai → có sau migrate.
- `npm run check` xanh. Bấm thử demo 1440 + 375 tối: đăng nhập từng vai mới, thanh trên, Tổng quan TVV, đổi góc nhìn + Về vai gốc.
  Seed demo thêm 1 tài khoản mỗi vai mới (chi nhánh Cẩm Phả; CX toàn hệ thống). Ảnh vào `thiet-ke/anh/pr-ov2a/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-2a (vai TVV / CX / Admin, quyền, đổi góc nhìn), repo Pizi147/pisa-tracking, nhánh mới từ main.
Không dùng Fable. Đọc CLAUDE.md, plan.md mục 1.2–1.3b, rồi docs/superpowers/plans/2026-10-11-pr-ov2a-vai-quyen-goc-nhin.md
(làm đủ Đầu ra; phần Thiết kế lệch thì hỏi chủ SP, không tự đổi), đặc tả OV mục 2 và mockup overhaul-3 §2–§5.
Code logic: ponytail full; phần giao diện: `/ponytail lite` trước khi sửa web. Viết phép kiểm prOv2a đỏ trước.
PR này chạy SONG SONG với OV-3a: tuân thủ mục "Ranh giới"; dùng PORT/WEB_PORT riêng (vd 4070/5243).
impeccable: `clarify`, `adapt`, `audit` trước khi mở PR. `/security-review` và `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần trên demo (1440 + 375, tối), ảnh vào thiet-ke/anh/pr-ov2a/ và mô tả PR.
Mô tả PR có bảng kết luận từng chỗ so tên vai cứng. Không deploy, không chạm Turso/Netlify. Mở PR vào main, KHÔNG merge,
gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```
