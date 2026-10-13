# PR OV-10a — Nút / link đúng quyền: không còn nút bấm ra lỗi, link dẫn vào màn không được vào (TVV · CX · Admin)

Nguồn: **chủ SP 13/10** "góc nhìn TVV, Admin, CX khác nhau — hiển thị hợp lý theo từng vai"; mockup `thiet-ke/mockup-vai-tvv-admin-cx-2026-10-13.html`
**đã duyệt 13/10**, mục 6 dòng "Sửa luôn". Không mockup mới (ẩn / đổi chữ nút sẵn có — plan.md 1.3b). Chạy **sau OV-8b merge**, song song **OV-9**, **OV-10c**.
Rà: **sâu** (quyền) — không nới quyền máy chủ nào.

## Hiện trạng (planning rà vai 13/10, session code kiểm lại từng dòng)
Nút / link hiện cho vai mà máy chủ trả 403 hoặc màn không vào được:
- `+ Case cho {kỹ năng}` (`web/src/modules/cases/SkillBoard.tsx:287`) hiện với TVV / CX / Admin — không có `sos.report` → 403.
- Hồ sơ lượt MT: nút "Nhập điểm" hiện với TVV / CX (không `score.edit` / `score.override`).
- Admin: "Chọn nhiều học viên" (`classes/TabHocVienLop.tsx:60`, `students/LuuTruPage.tsx:148`) → thao tác hàng loạt 403; ở lượt MT từng kỹ năng
  "Huỷ kỹ năng / Đưa lại / Dời hạn chấm" → 403 (Admin không `attempt.cancel` / `attempt.skip_skill` / `deadline.override`).
- Link vào **Test** / **Công việc** (vd badge "bài chờ chấm" ở đầu hồ sơ lớp, link từ thẻ việc) hiện với TVV / CX — hai vai này không có `test.view` / `work.view`.
- Phân tích › góc "Ý thức & Phối hợp" hiện với TVV / CX / Admin → 403 (không `discipline.stats`).
- Admin: tên GV chưa là link (Admin có `analysis.view_teacher`).
- Admin › Công việc: tab ghi "Hỗ trợ học viên" nhưng nội dung là chấm điểm + Nhắc.
- TVV hồ sơ HV: "Đề xuất sửa thông tin…" vẫn hiện dù TVV sửa thẳng được (`student.edit_info`, OV-8b).

## Đầu ra
1. Mỗi nút / link ở trên **chỉ hiện khi máy chủ cho làm**, dùng đúng hàm quyền web sẵn có (`can(...)` / cờ quyền phiên) — **một nguồn**: nút đọc cùng khoá quyền
   mà đường API kiểm. Không thay bằng nút xám (ẩn hẳn, không chiếm chỗ).
2. Admin › Công việc: tab đổi tên **"Chấm điểm"** (vai khác giữ tên cũ).
3. Admin: tên GV ở các bảng Mock Test là link sang Phân tích › Giáo viên (như QL).
4. TVV / CX (người có `student.edit_info` sửa thẳng được trường đó): ẩn "Đề xuất sửa thông tin…"; GVCN giữ như nay.
5. Rà toàn bộ `web/src` một lượt theo bảng **(vai TVV, CX, Admin) × (nút / link gọi API hoặc dẫn sang trang)**: dòng nào còn lệch quyền → sửa cùng PR, liệt kê
   trong mô tả PR. Vai QL, GVCN, GVBM **không đổi gì**.

## Ranh giới
- Vùng: chỗ hiện nút trong `web/src/modules/{cases,fasttrack,classes,students,phanTich,congViec,duyet}` + `web/src/lib` (hàm quyền nếu thiếu).
- KHÔNG sửa: `web/src/modules/worklist/*` Tổng quan (OV-10c), bảng Học viên & Lớp + đầu hồ sơ HV / hồ sơ lớp theo vai (OV-10b), ô Target / KCK (OV-9),
  quyền máy chủ (`seed/data.ts`, `migrate/*`). Không thêm khoá quyền mới.
- Chung tất yếu: `tests/run.ts`, `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv10a.tests.ts` (đỏ trước): bảng (vai × nút) → khoá quyền mà nút dùng **trùng** khoá đường API kiểm (TVV / CX / Admin gọi thẳng các đường của
  nút đã ẩn → vẫn 403; không đường nào nới); tab Công việc của Admin tên "Chấm điểm". Nếu repo có mẫu kiểm chữ trong mã web (kiểu C23) thì dùng mẫu đó.
- `npm run check` xanh. Bấm thử một lần: TVV 1440 tối (hồ sơ HV, hồ sơ lớp, lượt MT — không còn nút ra lỗi), Admin 375 sáng (hồ sơ lớp, lượt MT, Công việc).
  Ảnh `thiet-ke/anh/pr-ov10a/`.

## Prompt (Sonnet 5.5 · High; B: Opus 5.5 · High)

```
Session CODE cho PR OV-10a (nút / link đúng quyền cho TVV · CX · Admin: không còn nút bấm ra lỗi 403, link vào màn không được vào),
repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất (đã có OV-8b). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 13/10 "Hiển thị theo vai") và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov10a-nut-dung-quyen.md (làm ĐỦ Đầu ra),
mockup thiet-ke/mockup-vai-tvv-admin-cx-2026-10-13.html mục 6 (đã duyệt). Không mockup mới. KHÔNG nới quyền máy chủ.
PR này chạy SONG SONG với OV-9 và OV-10c: tuân thủ "Ranh giới"; PORT/WEB_PORT 4250/5423; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv10a.tests.ts đỏ trước). impeccable (skill có sẵn trong repo): `clarify`, `harden` trong phạm vi PR, sau đó `audit` trước khi mở PR.
`/ponytail-review` trước khi mở PR. `npm run check` xanh, bấm thử một lần (TVV 1440 tối, Admin 375 sáng), ảnh vào thiet-ke/anh/pr-ov10a/ và mô tả PR.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá).
Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Ẩn hẳn (không làm nút xám có chú thích): vai đó không bao giờ làm việc này, nút xám chỉ làm dày màn.
- Sonnet đủ (việc rà + ẩn theo quyền có sẵn, không luật mới); planning rà sâu phần quyền.
