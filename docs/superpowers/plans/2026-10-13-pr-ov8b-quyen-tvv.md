# PR OV-8b — TVV: sửa mọi thông tin học viên (cả Target), Tạm dừng / Quay lại / Thôi học, nhập kết quả thi thật; ô TVV theo chi nhánh

Nguồn: **chủ SP 13/10**: "TVV chia theo các CN; TVV được cập nhật kết quả cuối của HV; thông tin về HV thì được sửa hết, chỉ học thuật là của GV". Trả lời 13/10:
**TVV sửa Target như QL** (thay quyết định 11/10 "không Target") · **TVV làm Tạm dừng / Quay lại học / Thôi học**. Không mockup mới (nút / ô sẵn có hiện theo quyền).
Song song được với **OV-7b**, **OV-8a**. Rà: **sâu** + `/security-review` (quyền).

## Hiện trạng (planning đọc mã 13/10, session code kiểm lại)
- Vai `consultant` (`server/src/seed/data.ts:98`): `attempt.view, case.view, student.view, student.edit_info, analysis.view`; phạm vi theo grant chi nhánh (demo:
  Nguyễn Thu Hương — Cẩm Phả, `seed/ov2aSeed.ts:27`) → **đã chỉ thấy HV chi nhánh mình**.
- `updateStudent` (`students/students.ts:704-710`): người chỉ có `student.edit_info` sửa được `fullName, dob, email, consultantName, consultantUserId, dauVao`.
  Target sửa qua `POST /cycles/:id/target-revision` (cần `cycle.edit`). Tạm dừng / Thôi học / Quay lại học (`StudentManagePanel`) cần quyền sửa hồ sơ đầy đủ.
- Kết quả thi thật: `coTheNhapThiThat` (`loTrinh/thiThat.ts:32`) — `student.edit` / `cycle.edit` hoặc GVCN lớp cuối.
- Ô chọn TVV (OV-2b): TVV cùng chi nhánh **xếp trước**, TVV chi nhánh khác vẫn chọn được.

## Đầu ra
1. **TVV sửa mọi thông tin học viên** (không phải học thuật): họ tên, ngày sinh, email, ghi chú, TVV, dự kiến thi, điểm đầu vào **và Target** (sửa thẳng **kèm lý do**,
   đúng đường `target-revision` như QL, nhật ký trước → sau). Không mở cho TVV: điểm, Case / PA, nhận xét, Ý thức, Lộ trình tiếp theo, KQĐR, lịch Test.
   Cấp bằng **quyền hẹp** (vd `cycle.edit_target` hoặc mở rộng `student.edit_info`) — **không** cấp nguyên `cycle.edit` / `student.edit` nếu chúng mở thêm việc học thuật.
2. **TVV làm Tạm dừng / Quay lại học / Thôi học** (panel "Tạm dừng / Thôi học" OV-2b + "Quay lại học"), giữ đúng luật cũ (Tạm dừng dừng mọi hạn; Thôi học có Hoàn tác).
   Lưu trữ / Bỏ lưu trữ, Học lại, Chuyển lớp: **giữ như nay** (QL).
3. **TVV nhập / sửa kết quả thi thật** (L R W S, ngày thi, Không thi) của HV chi nhánh mình — `coTheNhapThiThat` nhận TVV; bước tiếp sau thi vẫn **chỉ QL** (OV-8a).
4. **Ô chọn TVV chỉ hiện TVV cùng chi nhánh của em** (bỏ TVV chi nhánh khác; "Ghi cũ: …" giữ). Máy chủ chặn gán TVV khác chi nhánh (400 câu rõ).
5. **CX** (= "như TVV ở mọi chi nhánh", quyết định 11/10) nhận đúng các quyền 1–3. **Admin** giữ như nay.
6. Migrate `server/src/migrate/prOv8b.ts` (tự kiểm, chạy lại không đổi gì; mẫu `prOv2`): thêm quyền mới cho vai `consultant`, `cx` ở bản chính; không nới quyền vai khác.
   Cập nhật `seed/data.ts` cùng quyền.

## Ranh giới
- Vùng: `seed/data.ts`, `migrate/prOv8b.ts` + `migrate.ts`, `permissions` (nếu thêm khoá quyền: `shared/domain/people.ts`), `students/students.ts` (`TRUONG_THONG_TIN`,
  quyền Tạm dừng / Thôi học), đường `target-revision` (`fasttrack/cycles.ts` hoặc nơi đang có), `loTrinh/thiThat.ts` **chỉ** `coTheNhapThiThat`, web nút theo quyền
  (`StudentManagePanel`, Sửa thông tin, ô TVV).
- KHÔNG sửa: phần Bước tiếp của `thiThat.ts` (OV-8a), `cases/*` (OV-7b).
- Chung tất yếu: `routes/index.ts`, `tests/run.ts`, `CODE_MAP.md`, `plan.md`.

## Kiểm
- `server/src/tests/prOv8b.tests.ts` (đỏ trước): TVV sửa Target có lý do → đổi; thiếu lý do → 400; TVV chi nhánh khác → 403; TVV Tạm dừng / Quay lại / Thôi học (+ Hoàn
  tác) đúng luật; TVV nhập kết quả thi thật → lưu; TVV gọi API học thuật (nhập điểm, Case, Ý thức, Lộ trình tiếp theo, KQĐR, chọn bước tiếp sau thi) → **403 từng đường**;
  gán TVV khác chi nhánh → 400; CX như TVV mọi chi nhánh; Admin không đổi; migrate chạy hai lần không đổi.
- Phép kiểm cũ "TVV không Target" (OV-2a / OV-2b) đổi đúng ý — ghi lý do, KHÔNG xoá cho xanh.
- `npm run check` xanh. `/security-review`. Bấm thử một lần (TVV Nguyễn Thu Hương 1440 tối + 375 sáng: sửa Target, Tạm dừng, nhập kết quả thi). Ảnh `thiet-ke/anh/pr-ov8b/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-8b (TVV: sửa mọi thông tin học viên cả Target, Tạm dừng / Quay lại / Thôi học, nhập kết quả thi thật; ô TVV chỉ cùng chi nhánh),
repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable. Gõ `/ponytail lite` đầu phiên. Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 13/10 "TVV") và 9.0, rồi docs/superpowers/plans/2026-10-13-pr-ov8b-quyen-tvv.md (làm ĐỦ Đầu ra + migrate).
Không mockup mới: nút / ô sẵn có hiện theo quyền. Quyền hẹp — không cấp quyền mở thêm việc học thuật.
PR này chạy SONG SONG với OV-7b và OV-8a: tuân thủ mục "Ranh giới"; PORT/WEB_PORT 4230/5403; `npm run check` tối đa 3 máy cùng lúc.
test-driven-development (prOv8b.tests.ts đỏ trước: mỗi đường học thuật TVV gọi thẳng API → 403). `/security-review` trước khi mở PR.
impeccable (skill có sẵn trong repo): `clarify`, `harden` trong phạm vi PR, sau đó `audit` trước khi mở PR. `/ponytail-review` trước khi mở PR.
`npm run check` xanh, bấm thử một lần (TVV 1440 tối + 375 sáng), ảnh vào thiet-ke/anh/pr-ov8b/ và mô tả PR. Không deploy, không chạm Turso/Netlify.
Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP.
Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- CX nhận cùng quyền mới như TVV (CX = "như TVV ở mọi chi nhánh", 11/10). Admin giữ như nay.
- Lưu trữ, Học lại, Chuyển lớp vẫn của QL (không phải "thông tin HV").
