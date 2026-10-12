# PR OV-2b — Hồ sơ học viên: Sửa thông tin (TVV chọn người, email + ngày sinh bắt buộc, Target, điểm đầu vào), Tạm dừng / Thôi học

Nguồn: đặc tả OV mục 2 (TVV = người, email + ngày sinh), 4 "Hồ sơ HV", 6.2 nghiệm thu; mockup đã duyệt
`thiet-ke/mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html` **§6** (menu ⋯, panel Tạm dừng / Thôi học, Sửa thông tin, Sửa cả lớp cột TVV).
Chạy sau OV-2a (#322: vai TVV, `students.consultant_user_id`, quyền `student.edit_info`). Song song được với **OV-3b**, **OV-1b**. Rà: mặc định.

## Đầu ra
1. **⋯ hồ sơ HV** (thứ tự mockup §6): Sửa thông tin · Chuyển lớp · **Tạm dừng / Thôi học** · Lưu trữ (QL, chỉ em đã thôi học). Các mục đang có
   khác (Lộ trình tiếp theo, Lộ trình FT, Kết luận, Quay lại học, Học lại, Bỏ lưu trữ, Xoá…) giữ nguyên điều kiện, xếp sau. Mỗi mục giữ điều kiện quyền máy chủ.
2. **Panel "Tạm dừng / Thôi học"**: MỘT mục, panel nhỏ hai tab — Tạm dừng (= `TrangThaiPanel` inactive) · Thôi học (= Kết thúc học, finished).
   Giữ đúng luật cũ: Tạm dừng dừng mọi hạn, câu hệ quả (Case dừng hạn, MT giữ lịch); Thôi học có Hoàn tác. Không đổi máy chủ.
3. **Panel "Sửa thông tin"** (một em; mở từ ⋯ hồ sơ HV và ⋯ dòng em ở hồ sơ lớp / Học viên & Lớp — `thaoTacDongHocVien.tsx`):
   Họ tên · Ngày sinh * (`ONgay`) · Email * · **TVV** · Dự kiến thi · **Target** · **Điểm đầu vào**. Lỗi đúng ô, giữ chữ đã gõ.
   - **TVV = ô chọn người** (`ChonNguoi` như chọn GV): chỉ tài khoản có vai `consultant` còn hoạt động; xếp TVV cùng chi nhánh của em lên trước.
     Chữ cũ `consultant_name` hiện mờ dưới ô: "Ghi cũ: …" — **không tự gán**. Máy chủ: trường mới `consultantUserId` (null = bỏ chọn), kiểm người đó
     đúng vai TVV đang hoạt động (sai → 400); thêm vào `TRUONG_THONG_TIN` (`students.ts:650`) để Admin / TVV / CX sửa được.
   - **Target** (HV1-b): QL / Quản trị (`cycle.edit`) sửa thẳng **kèm lý do** — dùng lại đường `POST /cycles/:id/target-revision`;
     GVCN thấy cùng ô, Lưu thành **Đề xuất sửa** gửi QL duyệt (dùng lại luồng `DeXuatSuaPanel` / yêu cầu duyệt hiện có). Admin / TVV / CX: chỉ đọc.
   - **Điểm đầu vào**: nhập từng kỹ năng L R W S (Overall tự tính, làm tròn 0.5 như nhập học viên) **hoặc** chỉ Overall; lưu vào
     `learning_cycles.baseline_*` (cùng chỗ OV-3a đọc dòng "Đầu vào"). Em chưa có lộ trình: ô khoá kèm lý do (như Sửa cả lớp).
   - Lưu một lần; nếu gồm nhiều đường API thì phần lỗi báo đúng phần, phần đã lưu không mất (không báo "Đã lưu" khi chưa lưu hết).
4. **Email + ngày sinh bắt buộc** ở: Thêm học viên (một em, cả lớp, dán Excel — `intake.ts`: email đã bắt buộc, thêm ngày sinh) và Sửa thông tin
   (một em, cả lớp). Máy chủ chặn: thêm mới thiếu → lỗi đúng ô; sửa mà xoá trống / để trống → lỗi. **Sửa cả lớp: chỉ dòng có thay đổi phải đủ**
   (dòng không đụng tới không bị chặn). Em cũ thiếu vẫn làm mọi việc khác (nhập điểm, Case…); nhãn "Thiếu thông tin" giữ như nay. Không điền giả.
5. **Sửa thông tin cả lớp** (`SuaCaLopPanel.tsx`): thêm cột **TVV** (ô chọn người, "cũ: …" mờ); tiêu đề Ngày sinh *, Email *.

## Ranh giới (song song OV-3b, OV-1b)
- Vùng của PR này: `web/src/modules/students/*` (trừ `LoTrinhTiepPanel.tsx`, `ClassRoster.tsx`), `web/src/modules/duyet/DeXuatSuaPanel.tsx` (nếu cần),
  `server/src/students/{students,profile}.ts`, `server/src/classes/intake.ts`, `server/src/classes/suaCaLop.ts`, `shared/domain/{quanLyHocVien,nhapHocVien}.ts`,
  và **đúng một file** `web/src/modules/classes/thaoTacDongHocVien.tsx` (mục ⋯ dòng "Sửa thông tin").
- KHÔNG sửa (của OV-3b): mọi file khác trong `web/src/modules/classes/*`, `server/src/classes/{loTrinhTiep,lenhChuyen,transition,banGiao}.ts`,
  `server/src/normal/*`, `LoTrinhTiepPanel.tsx` ("Lộ trình tiếp theo" của một em mở hộp bảng lớp là việc OV-3b). KHÔNG sửa (của OV-1b): `fasttrack/*`, `cham/*`.
- Chung tất yếu: `server/src/tests/run.ts`, `plan.md`, `CODE_MAP.md`. Không migrate (cột đã có từ OV-2a).
- Không làm: OV-3b, OV-5 (Công việc), siết Phân tích TVV (giữ như OV-2a, chủ SP đồng ý 12/10).

## Kiểm
- `server/src/tests/prOv2b.tests.ts` (đỏ trước, đăng ký cuối `run.ts`):
  - TVV: gán người vai TVV → lưu; người không phải TVV / tài khoản khoá → 400; null bỏ chọn; `consultant_name` cũ không đổi; Tổng quan TVV (OV-2a) thấy em vừa gán.
  - Admin / TVV / CX sửa được `consultantUserId`; GVBM → 403.
  - Thêm một em / cả lớp / dán Excel thiếu ngày sinh hoặc email → lỗi đúng ô, không lưu dòng đó; sửa một em xoá trống email → lỗi;
    Sửa cả lớp: dòng cũ thiếu email không sửa → không chặn, dòng có sửa mà thiếu → lỗi. Em thiếu email vẫn nhập điểm được.
  - Target: QL sửa có lý do → đổi ngay; thiếu lý do → lỗi; GVCN → tạo Đề xuất sửa, Target chưa đổi; TVV → 403.
  - Điểm đầu vào: 4 kỹ năng → Overall tự tính; chỉ Overall → kỹ năng trống; hiện ở dòng "Đầu vào" FT (OV-3a).
  - `mucQuanLyHocVien`: thứ tự ⋯ đúng mockup; một mục Tạm dừng / Thôi học; Lưu trữ chỉ QL + em đã thôi học.
- Phép kiểm cũ đổi đúng ý (dự kiến `prNhap`, `prSl`, phép kiểm `mucQuanLyHocVien`), KHÔNG xoá cho xanh; mỗi chỗ một dòng lý do trong mô tả PR.
- `npm run check` xanh. Bấm thử một lần (1440 tối + 375 sáng): QL, GVCN, TVV (Nguyễn Thu Hương, demo OV-2a), Admin. Ảnh `thiet-ke/anh/pr-ov2b/`.

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)

```
Session CODE cho PR OV-2b (hồ sơ học viên: Sửa thông tin có TVV chọn người, email + ngày sinh bắt buộc, Target, điểm đầu vào; Tạm dừng / Thôi học),
repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất (đã có OV-2a #322). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md mục 2, 4, 6.2, rồi
docs/superpowers/plans/2026-10-12-pr-ov2b-ho-so-hoc-vien.md (làm ĐỦ Đầu ra) và mockup thiet-ke/mockup-overhaul-2-ho-so-lop-lo-trinh-2026-10-11.html §6.
PR này chạy SONG SONG với OV-3b và OV-1b: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4110/5283; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv2b.tests.ts đỏ trước). impeccable: `layout`, `clarify`, `harden`, `adapt` trong phạm vi PR, sau đó `audit` trước khi mở PR.
`/ponytail-review` trước khi mở PR. `npm run check` xanh, bấm thử một lần trên demo (1440 tối + 375 sáng; QL, GVCN, TVV, Admin), ảnh vào
thiet-ke/anh/pr-ov2b/ và mô tả PR. Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR.
Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```
