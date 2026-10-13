# PR OV-2c — Email học viên không bắt buộc (mọi chỗ nhập / sửa)

Nguồn: **chủ SP 13/10** "không khoá cứng việc phải nhập email cho học sinh mới được nhập thông tin". Thay luật PR-OV2b (email + ngày sinh bắt buộc) — **chỉ email**;
ngày sinh giữ bắt buộc. Không mockup mới (bỏ dấu `*` / chữ "Bắt buộc"). Rà: **mặc định**. Song song được với OV-4c (vùng khác).

## Hiện trạng (planning đọc main 13/10)
- Máy chủ: `updateStudent` → `chuanHoaSuaHoSo` (`server/src/students/students.ts:647` "Email: bắt buộc."); Sửa cả lớp (`classes/suaCaLop.ts:138-140`: dòng có sửa mà em
  chưa có email → lỗi); Thêm HV / dán Excel (`shared/domain/nhapHocVien.ts:153` cột Email `batBuoc: true`, `classes/intake.ts`).
- Web: Sửa thông tin (`students/StudentManagePanel.tsx:434, 509-510` "Bắt buộc", "Em chưa có email — điền để lưu"), Sửa cả lớp (`SuaCaLopPanel.tsx:25, 213-214` "Email *"),
  Thêm HV (`IntakePanel.tsx`).

## Đầu ra
1. Email **không bắt buộc** ở: Thêm HV (lưới + dán Excel), Sửa thông tin (hồ sơ HV, ⋯ dòng), Sửa cả lớp, Đề xuất sửa (nếu có ô email). Trống = lưu được; **xoá trống**
   email đang có = được (lưu null).
2. Có gõ thì vẫn **kiểm dạng email** như nay (`docEmail`, sai → báo đúng ô, không lưu).
3. Bỏ dấu `*` / "Bắt buộc" / câu "điền để lưu" của email; ngày sinh giữ nguyên luật hiện có.
4. Email trống **không** tính vào "Thiếu thông tin" / ô Thiếu (nếu đang tính) — không nhắc, không chặn.

## Ranh giới
- Vùng: `server/src/students/students.ts` (`chuanHoaSuaHoSo`), `server/src/classes/{suaCaLop,intake}.ts`, `shared/domain/nhapHocVien.ts`, chỗ đếm "Thiếu thông tin" (nếu email có trong đó),
  web `students/{StudentManagePanel,SuaCaLopPanel,IntakePanel}.tsx`.
- KHÔNG đổi: ngày sinh, kiểm dạng email, quyền sửa.
- Chung tất yếu: `tests/run.ts`, `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv2c.tests.ts` (đỏ trước): Thêm HV không email → lưu; dán Excel thiếu cột / ô email → không lỗi; Sửa thông tin email trống → lưu, xoá email cũ → null;
  Sửa cả lớp dòng có sửa mà em chưa có email → không lỗi; email sai dạng → 400 / lỗi đúng ô; ngày sinh trống vẫn lỗi như cũ; em thiếu email không vào "Thiếu thông tin".
- Phép kiểm cũ "email bắt buộc" (`prOv2b`…) đổi đúng ý — ghi lý do, KHÔNG xoá cho xanh.
- `npm run check` xanh. Bấm thử một lần (QL 1440 tối: Thêm HV không email; TVV 375 sáng: Sửa thông tin xoá email). Ảnh `thiet-ke/anh/pr-ov2c/`.

## Prompt (Sonnet 5.5 · High; B: Opus 5.5 · High)

```
Session CODE cho PR OV-2c (email học viên không bắt buộc ở mọi chỗ nhập / sửa; có gõ thì vẫn kiểm dạng; ngày sinh giữ bắt buộc), repo Pizi147/pisa-tracking,
nhánh mới từ origin/main mới nhất. Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov2c-email-khong-bat-buoc.md (làm ĐỦ Đầu ra). Không mockup mới.
PORT/WEB_PORT 4300/5473; `npm run check` tối đa 3 máy cùng lúc. Tuân thủ "Ranh giới". test-driven-development (prOv2c.tests.ts đỏ trước).
impeccable (skill có sẵn trong repo): `clarify` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (QL 1440 tối, TVV 375 sáng), ảnh vào thiet-ke/anh/pr-ov2c/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```
