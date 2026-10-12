# PR OV-1c — SOS Mock Test: tạm thời → chốt → xoá

Nguồn: đặc tả OV mục 3.2, 6.5 (câu "SOS MT: …"); plan.md mục 3 dòng 11/10 "SOS MT" + [tự quyết] "xoá SOS: Case chưa ai làm đóng, đã làm giữ + ghi
'Overall đã đạt'". Không mockup mới (chip giữ mẫu hiện có). Chạy **sau OV-4a** (cùng vùng `attempts.ts`, đóng / mở lại Case). Rà: **sâu** (Case tự tạo).

## Hiện trạng (planning đọc mã 12/10, session code kiểm lại)
- `evaluateAttempt` (`server/src/fasttrack/scoring.ts:157-236`): kỳ vọng `expectationFor` (`:108`); SOS đếm **từ điểm đầu tiên** (`:197-210`);
  `provisional = canConclude && !complete` (`:211`); Overall chỉ khi đủ 4 kỹ năng (`:218-221`) và **không bao giờ so với kỳ vọng**.
- Mỗi lần lưu điểm: `saveScore` → `refreshOutcome` (`attempts.ts:1933 → 1565-1593`) → `raiseSignalsForResult` → `cases/sos.ts:318-510`: Case tự tạo
  (`taoCaseTuDong` `:528-570`, PA quy chế chưa xác nhận `sosAuto.ts:73`, báo GV `:504`), Phối hợp (`syncSosCoordination` `:357`).
  Hạn = `hanXacNhan(demoToday(), {sosLevel})` (`sos.ts:543`) → `soNgayHanXacNhan` (`shared/domain/cases.ts:827`: 5 ngày, SOS 3 = 3 ngày).
- Ba trạng thái "đã xong" của kỹ năng thiếu (OV-1b): **dời tuần** (`applyMove` `absence.ts:438-449`: `scheduled` + `absence_move_count`, hoặc `absent`
  + `skill_move_requests` chờ QL) · **huỷ phần thi** (`sit_status='cancelled'`; "Không mock lại" = `required=0`) · **Không dự thi** (`assessment_scores.no_show_cu=1`).
- **Không có khái niệm "chốt"**. Chữ "tạm thời" suy từ số ô ở 3 chỗ khác nhau: `standing.ts:108-115` (`provisional`), `shared/domain/display.ts:187-193`,
  `shared/domain/hoSoHocVien.ts:215`, `LuoiFT.tsx:354-357` (`evaluable`).
- Đường đổi trạng thái kỹ năng **không gọi** `refreshOutcome`: `saveScore` nhánh "-" (`attempts.ts:1716-1784`), `baoVang`, `decideAbsenceMove`,
  `sweepExpiredMoves` (chạy khi GET `mywork.ts:481`, không có Principal), `cancelPart`, `restoreCancelledSkill`; `skillSchedule.ts` không import được `attempts.ts`.

## Đầu ra
1. **Một hàm xét chốt** (shared, thuần): lượt MT1+ (không MT0, không KCK) **chốt** khi mọi kỹ năng bắt buộc có điểm, **hoặc** mọi kỹ năng còn thiếu đã
   dời tuần (vắng) / huỷ phần thi / "Không mock lại" / "Không dự thi". `evaluateAttempt` trả thêm cờ `chot` (từ dữ liệu đã nạp — không thêm câu SQL ở đường danh sách).
2. **Trước chốt = SOS tạm thời**: chip như nay ("SOS n tạm thời · a/4"), **không** Case, PA, Phối hợp, việc, hạn, chuông.
3. **Lúc chốt** (lần đầu lượt đạt điều kiện 1): Overall tính được (đủ 4 kỹ năng) **và ≥ kỳ vọng** → **không SOS** (chip "Đạt", kể cả có kỹ năng dưới kỳ vọng);
   ngược lại SOS theo số kỹ năng dưới kỳ vọng **như cũ** → Case + PA quy chế + Phối hợp + chuông, **hạn xác nhận tính từ ngày chốt**
   (số ngày: theo câu trả lời chủ SP 12/10 — khuyến nghị giữ `soNgayHanXacNhan`: 5 ngày, SOS 3 = 3 ngày).
4. **Sau chốt, xoá SOS**: kỹ năng dời có điểm và Overall thành ≥ kỳ vọng → Case tự tạo còn "Chờ xác nhận" và PA quy chế chưa ai sửa → đóng hệ thống, lý do mới
   `overall_dat` = **"Overall đạt"** (`SYSTEM_CLOSE_REASONS`, `shared/domain/cases.ts:567`); Case GV đã xác nhận / PA đang chạy → **giữ**, thêm mốc
   "Overall đã đạt" để GV tự đóng. Phối hợp còn chờ của lượt bỏ (như `system_sos_changed`).
5. **Mọi đường đổi trạng thái kỹ năng đều xét chốt**: lưu điểm, "-" / Vắng (`chotVangNgay`), Bỏ vắng, QL duyệt / từ chối / hết hạn dời, huỷ / khôi phục phần thi,
   "Không mock lại" / bỏ "Không mock lại", dời lượt / kỹ năng, **Khôi phục lượt (OV-4a)**. Đặt hàm ở chỗ cả `attempts.ts` và `absence.ts` / `skillSchedule.ts`
   import được (không vòng import). Gọi nhiều lần không tạo Case trùng.
6. **Một nguồn cho chữ "tạm thời"**: mọi chỗ hiện chip / cột Kết quả / "Chờ n kỹ năng" đọc cờ `chot` từ máy chủ (bỏ suy từ số ô): hồ sơ HV (`DauHoSo`,
   `StudentDetailPage`, Hành trình), lưới FT / Điểm theo lớp, `MockDetailPage`, danh sách lớp (`ClassRoster`, `BangHocVienLop`, `BangCanHoTro`),
   Tổng quan (`BranchPulse`), Phân tích (`danhGia.ts:197-200`, `tongHop.ts`), Xuất Excel (`xuatMt.ts`). Lượt chốt với kỹ năng dời: không còn ghi "tạm thời".
7. **Không đổi**: lớp thường, chip MT0, KCK, MT cũ ngoài cửa sổ 4 tuần (vẫn không Case), trạng thái lượt `done` (vẫn theo đủ điểm).
8. **Dữ liệu cũ** — migrate `server/src/migrate/prOv1c.ts` (tự kiểm, chạy lại không đổi gì) + lệnh **chỉ đọc** `ops/kiemTruocOv1c.ts`
   (`npm run kiem-truoc-ov1c`, mẫu `kiem-truoc-ov1b`; in em · mã · lớp · lượt · Case · việc sẽ làm):
   - Lượt **chưa chốt** có Case tự tạo **chưa ai đụng** → đóng hệ thống (lý do mới "Chờ chốt SOS"); lúc lượt chốt máy tạo / mở lại theo luật mới (hạn từ ngày chốt).
     Case đã có người làm → giữ.
   - Lượt **đã chốt** mà Overall ≥ kỳ vọng → xử lý như mục 4.
9. **Demo** (seed): `sosV3Seed.ts` toàn lượt dở → không còn Case → sửa seed để demo vẫn có: SOS tạm (dở, không Case) · chốt có SOS → Case ·
   chốt nhờ kỹ năng dời · Overall ≥ kỳ vọng có một kỹ năng dưới → không SOS · xoá SOS. Ghi các em mẫu vào `DEMO.md`.

## Ranh giới
- Chạy sau OV-4a; song song được với OV-5 / OV-6b2 / OV-3c nếu planning ghi trong prompt của PR kia. Vùng chính: `fasttrack/{scoring,attempts,absence,skillSchedule}.ts`,
  `cases/{sos,signals,systemClose,sosAuto}.ts`, `shared/domain/{cases,display,hoSoHocVien,hanhTrinh,fasttrack}.ts`, `students/{standing,profile,students}.ts`,
  `loTrinh/banChup.ts`, `worklist/danhGia.ts`, `phanTich/{tongHop,xuatMt}.ts`, seed SOS, web chỉ chỗ đọc cờ (`LuoiFT.tsx`, `KetQuaDot`).
- KHÔNG đổi: luật SOS lớp thường, ngưỡng kỳ vọng, cách tính Overall / band, giao diện hộp nhập điểm (OV-4b), Công việc (OV-5).

## Kiểm
- `server/src/tests/prOv1c.tests.ts` (đỏ trước, đăng ký cuối `run.ts`):
  - điểm L đầu tiên dưới kỳ vọng → chip tạm, **0 Case / PA / Phối hợp / chuông**; đủ 4 kỹ năng, 2 dưới → Case SOS 2, hạn = ngày chốt + số ngày luật.
  - chốt nhờ: (a) kỹ năng thiếu dời tuần, (b) huỷ phần thi, (c) "Không dự thi", (d) "Không mock lại" → Case tạo **đúng lúc** thao tác đó (không chờ lưu điểm).
  - L6 R7 W7 S7 (Overall 7.0 ≥ 6.5, L dưới) → không SOS; Overall = kỳ vọng → không SOS.
  - chốt có SOS (S dời) → S có điểm, Overall ≥ kỳ vọng → Case chưa đụng đóng "Overall đạt"; Case GV đã xác nhận → giữ + mốc "Overall đã đạt".
  - Bỏ vắng sau chốt → không Case trùng; xét chốt gọi 2 lần → 1 Case; MT0, KCK, lớp thường không đổi (so kết quả trước PR).
  - mọi chỗ hiện chip (danh sách lớp, hồ sơ HV, lưới, Phân tích, Xuất Excel) cùng cờ `chot` cho cùng lượt.
  - migrate: lượt chưa chốt có Case chưa đụng → đóng; đã đụng → giữ; chạy lại không đổi; `kiem-truoc-ov1c` khớp số migrate làm.
- Phép kiểm cũ đổi đúng ý (dự kiến `run.ts:426-448, 940-1000, 1850-1872, 7613`, `sosV3`, `prSos`, `prMt:190,231,239,425`; rà thêm prHvl, prDeploy, prS3f,
  prBv, prVn4, prKck, prPa, prS4f, prS6fA, prHan, chamDiem, prMt0), KHÔNG xoá cho xanh; mỗi chỗ một dòng lý do trong mô tả PR.
- Tốc độ: trần `tocDoDuong.ts` không tăng (cờ `chot` lấy từ `skillRows` đã nạp).
- `npm run check` xanh. Bấm thử một lần (QL 1440 tối, GVBM 375 sáng): lưới lượt dở (tạm) → nhập đủ (Case) → Công việc có việc Xác nhận nguyên nhân. Ảnh `thiet-ke/anh/pr-ov1c/`.

## Prompt (Opus 5.5 · XHigh; B: Opus 5.5 · High)

```
Session CODE cho PR OV-1c (SOS Mock Test tạm thời → chốt → xoá), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất (đã có OV-4a).
Không dùng Fable. Ponytail mức full (mặc định). Gọi skill karpathy-guidelines.
Đọc CLAUDE.md, plan.md mục 1.2–1.3b, 3 (dòng 11/10 SOS MT) và 9.0, đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md mục 3.2, 6.5, rồi
docs/superpowers/plans/2026-10-12-pr-ov1c-sos-mt-chot.md (làm ĐỦ Đầu ra, gồm migrate + lệnh chỉ đọc kiem-truoc-ov1c + seed demo).
PORT/WEB_PORT 4160/5333; `npm run check` tối đa 3 máy cùng lúc. Tuân thủ "Ranh giới".
test-driven-development (prOv1c.tests.ts đỏ trước); systematic-debugging khi lỗi lạ. Không tạo Case trùng, không mất Case người đã làm.
impeccable: chỉ `audit` (giao diện chỉ đổi nguồn chữ chip). `/ponytail-review` trước khi mở PR. `npm run check` xanh, bấm thử một lần
(QL 1440 tối, GVBM 375 sáng), ảnh vào thiet-ke/anh/pr-ov1c/ và mô tả PR. Ghi lệnh `kiem-truoc-ov1c` vào TRIEN_KHAI.md cạnh `kiem-truoc-ov1b`.
Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR.
Xong: một dòng mục 11 plan.md, CODE_MAP.md (file thêm/xoá). Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ngắn.
```

## Tự quyết (planning, báo chủ SP)
- Không thêm cột "ngày chốt": Case tạo trong cùng giao dịch làm lượt chốt → ngày tạo = ngày chốt. Bỏ vắng / khôi phục phần thi sau chốt không xoá Case đã có.
- Dữ liệu cũ: Case sinh sớm (trước chốt) chưa ai đụng đóng "Chờ chốt SOS", tạo lại lúc chốt; đã có người làm thì giữ. Chủ SP thấy số trước deploy qua `kiem-truoc-ov1c`.
