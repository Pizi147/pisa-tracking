# PR OV-9 — KCK nhẹ: KCK là dấu riêng, vẫn có Target; dưới kỳ vọng chỉ mở Case nhẹ cho GV (không đỏ, không ép hỗ trợ)

Nguồn: **chủ SP 13/10**: "KCK và vẫn có mục tiêu là bình thường — vẫn để Target, vẫn chọn KCK để GV nhẹ hơn; không để SOS căng, chỉ để có Case cho GV, không hiện
đỏ, không ép buộc quá nhiều vấn đề phải hỗ trợ". Chạy **sau OV-8b** (ô Target / quyền Target TVV). Không mockup mới (ô tích "KCK" cạnh ô Target theo mẫu sẵn có;
chip màu trung tính sẵn có). Rà: **sâu** (Case tự tạo, lệnh chuyển).

## Hiện trạng (planning đọc mã 13/10, session code kiểm lại)
- `learning_cycles.khong_cam_ket` (`schema.sql:304`): **KCK thay Target** — `target_score` NULL, không kỳ vọng, không SOS, **không Case** (`cases/sos.ts:333` trả `null`).
  Đọc Target: `docTarget` (`fasttrack/cycles.ts:121`: "KCK" / "-" / "không cam kết" → `{ target: null, kck: true }`). Lệnh chuyển: `MucTieuLenh = number | 'KCK'`
  (`shared/domain/chuyenLop.ts:99`). Chip hồ sơ: "KCK · không đặt kỳ vọng MT, không SOS" (`shared/domain/hoSoHocVien.ts:210`).
- `khong_cam_ket` dùng ở ~20 file máy chủ (nhiều nhất `lenhChuyen.ts` 12, `luatLoTrinh.ts` 11, `cycles.ts` 9, `profile.ts` 6); web: ô Target ở `StudentPlanPanel`, Sửa thông tin
  (OV-2b/8b), `SuaCaLopPanel`, `IntakePanel`, `DeXuatSuaPanel`.

## Đầu ra
1. **KCK là dấu riêng, Target giữ**: ô Target nhận số như thường + ô tích **"KCK"** cạnh bên (mọi chỗ nhập / sửa Target: Thêm HV, dán Excel — cột Target nhận "6.5 KCK"
   hoặc "KCK", Sửa thông tin, Sửa cả lớp, Đề xuất sửa, Lộ trình tiếp theo / lệnh Lên FT). Hiện "Target 6.5 · KCK". KCK mà chưa có Target → "Target — · KCK"
   (thiếu Target như em thường, không chặn). Ai đặt / bỏ KCK = ai sửa được Target (QL, TVV sau OV-8b; GVCN đề xuất).
2. **Kỳ vọng MT tính như thường** từ Target (em KCK có kỳ vọng, có Overall so kỳ vọng).
3. **Dưới kỳ vọng (sau khi lượt chốt — OV-1c) với em KCK**: **không SOS** — chip trung tính **"Dưới kỳ vọng · KCK"** (không đỏ, không "SOS n"); mở **Case nhẹ** cho GV
   đúng kỹ năng như Case SOS nhưng: **không PA quy chế tự tạo** (GV tự thêm PA nếu muốn), **không hạn xác nhận** (không vào Quá hạn, không đỏ), **không Phối hợp /
   Báo PH / Báo QL / chuông QL**. GV có việc "Xác nhận nguyên nhân · KCK" (không hạn) — làm như Case thường, tự đóng khi Overall đạt (luật xoá SOS OV-1c).
   Lớp thường (Progress Test) em KCK: cùng luật.
4. **Phân tích / Xuất Excel**: em KCK vẫn **không tính vào SOS** (như nay); cột kết quả ghi "KCK" như nay; có kỳ vọng thì hiện kỳ vọng.
5. **Lệnh chuyển / Lộ trình tiếp theo / bản chụp**: mang cả Target **và** dấu KCK (không còn "KCK thay Target"); `MucTieuLenh` thêm cờ KCK đi cùng số.
6. Dữ liệu cũ: em đang KCK (Target trống) giữ KCK, Target trống → "Target — · KCK" chờ người có quyền nhập; **không migrate** (cột `khong_cam_ket` giữ nghĩa cờ).

## Ranh giới
- Chạy sau OV-8b. Vùng: `fasttrack/cycles.ts` (`docTarget`), `cases/sos.ts` + `cases/sosAuto.ts` (nhánh KCK), `shared/domain/{chuyenLop,hoSoHocVien,nhapHocVien,xuatMt}.ts`,
  `classes/{lenhChuyen,luatLoTrinh,transition,loTrinhTiep}.ts` (mang cờ), `students/{profile,standing}.ts`, `worklist/{mywork,danhGia}.ts`, web các ô Target.
- KHÔNG đổi: luật SOS em không KCK, OV-1c chốt, hạn xác nhận Case thường.

## Kiểm
- `server/src/tests/prOv9.tests.ts` (đỏ trước): đặt Target 6.5 + KCK → lưu cả hai; MT chốt dưới kỳ vọng → Case nhẹ (0 PA quy chế, không hạn, 0 Phối hợp, 0 chuông QL),
  chip "Dưới kỳ vọng · KCK", không vào Quá hạn; Overall đạt → Case nhẹ đóng; bỏ KCK → lượt sau theo luật SOS thường; dán Excel "6.5 KCK" / "KCK"; lệnh Lên FT mang Target + KCK;
  em KCK cũ (Target trống) hiện "Target — · KCK"; Phân tích không đếm em KCK vào SOS.
- Phép kiểm cũ "KCK → target NULL / không Case" (`prKck`, `prS3f #3`, `prLc`, `prCl`) đổi đúng ý — ghi lý do, KHÔNG xoá cho xanh.
- `npm run check` xanh. Bấm thử một lần (QL 1440 tối: đặt Target + KCK; GVBM 375 sáng: việc Case KCK không hạn). Ảnh `thiet-ke/anh/pr-ov9/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-9 (KCK nhẹ: KCK là dấu riêng, vẫn có Target; dưới kỳ vọng chỉ mở Case nhẹ cho GV — không đỏ, không PA quy chế, không hạn, không Phối hợp),
repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất (đã có OV-8b). Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 13/10 "KCK") và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov9-kck-nhe.md (làm ĐỦ Đầu ra).
Không mockup mới: ô tích "KCK" cạnh ô Target theo mẫu sẵn có; chip trung tính sẵn có. PORT/WEB_PORT 4240/5413; `npm run check` tối đa 3 máy cùng lúc. Tuân thủ "Ranh giới".
test-driven-development (prOv9.tests.ts đỏ trước). Luật SOS của em không KCK không đổi.
impeccable (skill có sẵn trong repo): `clarify`, `harden` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (QL 1440 tối, GVBM 375 sáng), ảnh vào thiet-ke/anh/pr-ov9/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- "Case cho GV, không ép": Case KCK **không PA quy chế, không hạn, không Phối hợp / Báo PH / chuông QL**; GV vẫn có việc xác nhận nguyên nhân (không hạn) và tự thêm PA nếu cần.
- Phân tích vẫn tách em KCK khỏi số SOS.
