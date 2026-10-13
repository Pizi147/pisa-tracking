# PR OV-10b — TVV / CX: Liên hệ (SĐT em, phụ huynh) + bảng Học viên & Lớp, hồ sơ HV, hồ sơ lớp theo vai

Nguồn: **chủ SP 13/10** "hiển thị hợp lý theo từng vai"; mockup `thiet-ke/mockup-vai-tvv-admin-cx-2026-10-13.html` **đã duyệt 13/10** (mục 1, 2, 3, 5, 6).
Trả lời 13/10 về liên hệ: **thêm**; **mọi vai xem được**; **không bắt nhập**; **chỉ nhập ở hồ sơ HV và hồ sơ lớp**; thường TVV nhập; **GV không cần thấy ô nhập**
(không ép — bỏ cho đỡ dày hàng). Chạy **sau OV-9 và OV-10a merge** (chung ô Sửa thông tin / Target, đầu hồ sơ). Rà: **sâu** (migrate, quyền, dữ liệu cá nhân).

## Hiện trạng (planning đọc mã 13/10, session code kiểm lại)
- Bảng `students` **chưa có** SĐT em / phụ huynh. Sửa thông tin: `updateStudent` (`server/src/students/students.ts:705`, `TRUONG_THONG_TIN :703`).
- Học viên & Lớp (`web/src/modules/students/StudentsPage.tsx`, `ClassRoster.tsx`): cùng cột cho mọi vai (Việc tiếp theo, Case… là việc GV); TVV / CX hàng ⋯ rỗng.
- Đầu hồ sơ HV `students/DauHoSo.tsx`; đầu hồ sơ lớp `classes/DauTrangLop.tsx`, cách xem `classes/TabHocVienLop.tsx`, `ThongTinLopPanel.tsx` (chỉ người sửa được lớp).

## Đầu ra
1. **Liên hệ (trường mới, không bắt buộc)**: SĐT em · phụ huynh: tên, quan hệ (bố / mẹ / khác — gõ tự do, gợi ý sẵn), SĐT.
   - Migrate `server/src/migrate/prOv10b.ts` (chỉ **thêm cột** vào `students`, tự kiểm, chạy lại không đổi gì; mẫu `prOv8a`) + `schema.sql`.
   - Máy chủ: thêm vào `TRUONG_THONG_TIN`; kiểm dữ liệu (SĐT chỉ số, dấu cách, `+`, `.`, `-`, 8–15 chữ số; tên ≤ 100 ký tự; trống = xoá); nhật ký trước → sau như trường cũ.
   - **Chỉ nhập ở**: Sửa thông tin của **hồ sơ HV** và Sửa thông tin **cả lớp** ở **hồ sơ lớp** (`SuaCaLopPanel`, thêm cột). **Không** thêm vào Thêm HV / dán Excel / Intake.
   - Ô nhập hiện cho QL, Quản trị, TVV, CX, Admin; **GV (GVCN, GVBM) không thấy ô nhập**.
   - **Xem**: mọi vai thấy dòng **Liên hệ** ở đầu hồ sơ HV (chỉ đọc; trống thì "Chưa có liên hệ", không đỏ). Mockup ghi "Admin không dòng Liên hệ" — **bỏ**, theo trả lời 13/10.
   - **Không** tính vào "Thiếu thông tin" / ô Thiếu (không bắt nhập).
2. **TVV › Học viên & Lớp** (mockup mục 1): mặc định "HV của tôi"; cột **Học viên** (trạng thái bằng chữ) · **Lớp** · **Target · Dự kiến thi** (KCK theo OV-9) ·
   **Kết quả gần nhất** (so kỳ vọng) · **Cần chú ý** (SOS, Case mới, Ý thức, chờ QL chọn bước tiếp — chỉ đọc) · **Phụ huynh** (tên + SĐT) · **⋯**.
   Bỏ với TVV: "Việc tiếp theo", "Case", chip Cần làm / Quá hạn / Chờ duyệt → chip **Tất cả · Cần chú ý · Tạm dừng · Sắp thi · Thiếu thông tin**.
   ⋯ dòng: **Sửa thông tin · Tạm dừng / Thôi học · Kết quả thi · Mở hồ sơ** (panel tại chỗ sẵn có, OV-8b). 375: thẻ như mockup.
3. **CX › Học viên & Lớp** (mục 5): như TVV, mọi chi nhánh, **mặc định chip "Cần chú ý"**, thêm cột **Chi nhánh** và **TVV**.
4. **Admin › Học viên & Lớp** (mục 6): cột Học viên · Lớp · Lượt MT gần nhất · Ô chưa nhập; ⋯ Sửa thông tin · Mở hồ sơ. Không cột Case / Việc tiếp theo.
5. **Hồ sơ lớp TVV / CX** (mục 2): đầu trang không Nhập điểm / + Case / ⋯ rỗng; cách xem **Tổng hợp** (cột như mục 2, bỏ cột Lớp) · **Cần hỗ trợ** (chỉ đọc, không "Việc tiếp")
   · Lộ trình tiếp theo / KQĐR **đã chốt** (đọc) · **Thông tin lớp** (chỉ đọc — mở cho mọi vai không sửa được lớp); khối "Ở lớp này · học viên của tôi" (TVV);
   bảng điểm cuối trang chỉ đọc, bỏ chip "MT còn n ô trống" với TVV / CX. Admin: Tổng hợp · Thông tin lớp (đọc) · bảng điểm sửa được (như nay).
6. **Hồ sơ HV TVV / CX** (mục 3): dòng Liên hệ (mục 1) + khối **Đang xử lý** (chỉ đọc: ai · việc gì · hạn — từ Case / PA / Phối hợp / Báo PH đang mở, **cùng hàm** với
   Công việc, việc đã xong không hiện); nút theo quyền OV-8b: Sửa thông tin · Tạm dừng / Thôi học · Kết quả thi.
7. QL, GVCN, GVBM: bảng / hồ sơ **không đổi** (trừ dòng Liên hệ chỉ đọc ở hồ sơ HV).

## Ranh giới
- Vùng: `schema.sql`, `migrate/prOv10b.ts` + `migrate.ts`, `students/students.ts` (`TRUONG_THONG_TIN` + kiểm), đọc danh sách / hồ sơ (`students/profile.ts`, nơi trả hàng
  Học viên & Lớp), `web/src/modules/students/*`, `web/src/modules/classes/{DauTrangLop,TabHocVienLop,ThongTinLopPanel}.tsx`, `SuaCaLopPanel`.
- KHÔNG sửa: Tổng quan `worklist/*` (OV-10c), luật SOS / Case / KCK (OV-9), quyền vai (`seed/data.ts`). Không thêm quyền mới.
- Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `tocDoDuong.ts` (nếu thêm câu đọc), `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv10b.tests.ts` (đỏ trước): TVV / CX / QL / Admin lưu liên hệ ở hồ sơ HV và Sửa cả lớp → đọc lại đúng, nhật ký trước → sau; SĐT sai → 400 câu rõ;
  trống = xoá; GV (có `student.edit_info`) lưu được qua API nhưng web không hiện ô; Thêm HV / dán Excel không nhận trường liên hệ; em thiếu liên hệ
  **không** vào "Thiếu thông tin"; mọi vai đọc được liên hệ ở hồ sơ HV; danh sách TVV trả đúng cột, chip đếm đúng; CX mặc định "Cần chú ý" mọi chi nhánh; khối Đang xử lý
  không hiện việc đã xong (cùng hàm Công việc); migrate chạy hai lần không đổi.
- Tốc độ: đường Học viên & Lớp + hồ sơ HV giữ trong trần `tocDoDuong.ts` (cả ×3 dữ liệu).
- `npm run check` xanh. Bấm thử một lần: TVV 1440 tối + 375 sáng (danh sách, ⋯, hồ sơ HV nhập liên hệ, hồ sơ lớp), CX 1440 tối (Cần chú ý), GVCN 375 (không ô nhập liên hệ).
  Ảnh `thiet-ke/anh/pr-ov10b/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-10b (TVV / CX: Liên hệ SĐT em + phụ huynh; bảng Học viên & Lớp, hồ sơ HV, hồ sơ lớp theo vai), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất (đã có OV-9, OV-10a). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 13/10 "Hiển thị theo vai", "Liên hệ") và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov10b-tvv-cx-lien-he.md
(làm ĐỦ Đầu ra + migrate), mockup thiet-ke/mockup-vai-tvv-admin-cx-2026-10-13.html (đã duyệt; dòng Liên hệ hiện cho MỌI vai, khác mockup).
PORT/WEB_PORT 4260/5433; `npm run check` tối đa 3 máy cùng lúc. Tuân thủ "Ranh giới". test-driven-development (prOv10b.tests.ts đỏ trước).
Liên hệ là dữ liệu cá nhân: kiểm dữ liệu nhập ở máy chủ, nhật ký trước → sau, không ghi SĐT vào log máy chủ. `/security-review` trước khi mở PR.
impeccable (skill có sẵn trong repo): `layout`, `clarify`, `adapt`, `harden` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (TVV 1440 tối + 375 sáng, CX 1440 tối, GVCN 375), ảnh vào thiet-ke/anh/pr-ov10b/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Quan hệ phụ huynh gõ tự do (gợi ý bố / mẹ) — không thêm danh mục.
- Một phụ huynh / em (đủ việc gọi báo); cần hai người thì ghi vào ô tên ("Long (bố) / Hoa (mẹ)") — không thêm bảng.
- Admin cũng nhập được liên hệ (có `student.edit_info`); GV có quyền máy chủ nhưng không thấy ô (theo trả lời 13/10).
