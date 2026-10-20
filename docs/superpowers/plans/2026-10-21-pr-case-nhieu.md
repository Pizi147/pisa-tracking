# PR CASE-NHIEU — Tạo Case nhiều kỹ năng (07 mục 4 · 05 mục 7.1b · 02 B16, C21, C27 · v4d FB-4-35)

Model: Opus 5.5. Loại: máy chủ + panel **thêm ô theo mẫu sẵn có** (`Khoi` / `Truong`), không mockup (02 C27) — PTA tự merge, kèm ảnh
trước / sau 1440 tối + 375 sáng. `/ponytail lite`. Cổng PORT=4420 WEB_PORT=5620. Phụ thuộc: CONG-CU, CV-LOI (đã merge mới code — Pha 2).
Không đụng: chuông "Case tạo tay cho người khác" (SL1), luật Case, bảng / migrate, Case tự động (SOS, Giữa khoá, kỳ vọng).

## Đầu ra
GV / GVCN / QL chọn 2–5 kỹ năng một lần trên panel Tạo Case → **một lần lưu ra n Case độc lập** (mỗi Case: kỹ năng, nguyên nhân, tên,
mô tả, người phụ trách theo `suggestCaseOwner`, hạn PA theo mức). Lỗi → **0 Case**, chữ giữ, lỗi trên đúng thẻ. Một kỹ năng = panel y như nay.

## Hiện trạng đã kiểm (mã thật)
- `POST /cases/report` → `reportIssue` một `topic` (`server/src/routes/index.ts:1887-1890`, `server/src/cases/cases.ts:463-739`).
  Thứ tự kiểm: quyền `SOS_REPORT` theo lớp / em (`:513-516`) → tên ≥ 6 (`:530-534`) → mô tả ≥ 15 (`:535-538`) → mức (`:541-544`)
  → khoá gửi đôi `caseDaCoTheoKhoa` (`:548-550`, kiểm **ngoài** tx) → kỹ năng thuộc chương trình (`:564-574`) → nguyên nhân (`:593-603`)
  → Case chờ xác nhận cùng kỹ năng → 400 `caseChoNguyenNhan` (`:617-627`) → Case mở cùng hạng mục → 400 `duplicateCase` (`:629-649`)
  → "Ghi vào" `tx` UPDATE note + `addIssues` + audit `case.report.merge` (`:651-675`, **không** ghi khoá gửi đôi → gửi lại ghi chữ 2 lần)
  → tạo mới `tx` INSERT `sos_cases` với `owner_user_id = suggestCaseOwner` (`:677-738`).
- `tx` lồng = SAVEPOINT; giao dịch ngoài mở `BEGIN IMMEDIATE` (`server/src/db.ts:333-365`) → gọi `reportIssue` n lần trong một `tx` là
  "tất cả hoặc không"; `backfillCase` đã làm đúng mẫu này (`cases.ts:1513-1524`).
- `caseTopicsOf` (`cases.ts:750-783`): đọc học viên, lớp, quyền `ATTEMPT_VIEW`, lộ trình, Case đang mở (`mo`), `choNguyenNhan`, `ghiBuDuoc`.
  Chưa có `dangMo`, `phuTrach`.
- `suggestCaseOwner` (`server/src/cases/owner.ts:18-41`): GV dạy đúng kỹ năng ở lớp → GVCN → null; 1–2 câu đọc mỗi lần.
- Panel `web/src/modules/cases/QuickReport.tsx` (621 dòng): state một bộ `topic/primaryCode/ghiRo/title/summary` (`:71-79`); chip chọn
  một (`:400-412`); khối chờ xác nhận thay cả form (`:419-429`); trùng hạng mục báo **sau** khi gửi (`:199-200`, khối vàng `:601-612`);
  tải tệp `taiTepCho(tep, { ownerIds: [d.id] })` (`:214`) — `TepCho.tsx:148-162` đã hỗ trợ nhiều id qua `/attachments/chep`.
- Lỗi "+ Case cho {kỹ năng}" không chọn sẵn (`StudentDetailPage.tsx:334`) — CV-LOI sửa; Pha 2 dùng prop CV-LOI thêm làm chip chọn sẵn.

## Quyết định (PTA tự quyết theo 02 / 05; ghi vào "Cần chủ SP xác nhận")
1. API giữ dáng cũ (một `topic` — seed, phép kiểm cũ, `backfillCase` vẫn gọi); thêm dáng lô: có `kyNang: [...]` → `reportIssues`.
   Panel **luôn** gửi dáng lô (kể cả 1 kỹ năng) → một đường ở web.
2. Khoá gửi đôi theo lô + kỹ năng: `${khoaLo}:${topic}`. Case mới: khoá ở `sos_cases.idempotency_key` (sẵn có). "Ghi vào": ghi khoá vào
   `after_json` của audit `case.report.merge`; gửi lại cùng khoá → trả Case đó, không ghi thêm chữ (vá luôn đường một kỹ năng).
3. "Ghi vào Case đang có": thẻ còn **Nhóm nguyên nhân + Mô tả** (máy chủ vẫn cần nguyên nhân — `addIssues` ghi vào Case cũ); Tên
   không bắt buộc khi thật sự ghi vào → dời kiểm tên ≥ 6 xuống sau khi biết `existing` (`existing && mergeIntoExisting` thì bỏ qua).
4. Một kỹ năng: không trùng → **giống hệt nay**; trùng → cùng khối vàng hai nút, nhưng hiện **ngay khi chọn chip** (mặc định "Ghi vào")
   thay vì sau khi bấm (05 7.1b "không còn vòng lỗi 400").
5. Bỏ chữ "bạn dạy" dưới chip (C21) để 1 kỹ năng giống hệt nay; ≥ 2 kỹ năng đầu mỗi thẻ đã có "phụ trách: …".
6. Mức độ, Bắt đầu theo dõi, Bằng chứng: chung cả lô. Ghi bù: chip chọn một như nay; đổi sang tab ghi bù khi đang chọn > 1 → giữ chip đầu.

## Task 1 — máy chủ: `reportIssues` (TDD)
Tệp: `server/src/cases/cases.ts`, `server/src/routes/index.ts`, `server/src/tests/caseLo.tests.ts` (mới), `server/src/tests/run.ts`.
- [ ] Viết `caseLo.tests.ts` (đỏ trước; mỗi ca trong `thu()` BEGIN IMMEDIATE … ROLLBACK như `prOv8b.tests.ts:24-27`):
  a. Em FT, GV dạy L + R (khác người) → lô L + R → 2 Case, `owner_user_id` = GV L / GV R, `viecTiep.han` bằng hạn của Case một kỹ năng
     cùng mức (so với đường cũ, không chép số); mức Gấp → hạn Gấp.
  b. Có Case mở Listening → lô L(`gop:'ghi-vao'`) + R → 1 Case mới + Case L cũ có thêm chữ; đếm `sos_cases` em +1.
  c. R đang chờ xác nhận → lô L + R → 400 `caseChoNguyenNhan`, `details.kyNang='reading'`, **0** Case mới.
  d. Thẻ R tên 3 ký tự → 400, `details.kyNang='reading'`, 0 Case (L cũng không).
  e. Gửi lại cùng `idempotencyKey` (cả mới + ghi vào) → cùng id, không thêm Case, chữ ghi vào không lặp.
  f. GV ngoài lớp → 403, 0 Case. g. Trùng kỹ năng trong lô / lô rỗng / > số kỹ năng → 400.
  h. `chepTep` tệp của Case đầu sang Case còn lại (người tạo) → mỗi Case một dòng `attachments`.
  i. `caseTopicsOf` trả `dangMo[listening] = { id, title, detectedAt, soPa }` và `phuTrach[k] = { id, ten }` đúng `suggestCaseOwner`.
- [ ] `reportIssues(p, { studentId, cycleId?, urgency, detectedAt?, idempotencyKey, kyNang: [{ topic, primaryCode, observation?, title,
      summary, gop?: 'ghi-vao' | 'rieng' }] })`: kiểm mảng (1..số chủ đề của em, không trùng `topic`), rồi
      `tx(() => kyNang.map((k) => reportIssue(p, { ...chung, ...k, mergeIntoExisting: k.gop==='ghi-vao', parallel: k.gop==='rieng',
      idempotencyKey: `${khoa}:${k.topic}` })))`; lỗi của một thẻ → gắn `details.kyNang = topic` rồi ném lại (tx cuộn cả lô).
      Trả `{ cases: [{ id, title, topic, gop, canEdit, viecTiep }] }`.
- [ ] `reportIssue`: kiểm khoá ghi-vào qua `audit_logs` (`entity_type='sos_case' AND action='case.report.merge' AND entity_id=? AND
      after_json LIKE ?` — chỉ mục `idx_audit_viec` sẵn có; tham số `?`, không đặt tên); dời kiểm tên (QĐ 3).
- [ ] Route: `body.kyNang` là mảng → `reportIssues`, không thì `reportIssue` như cũ.
- [ ] `run.ts`: thêm `runCaseLoTests` cuối danh sách (giữ cả hai khi xung đột).

## Task 2 — máy chủ: `case-topics` trả `dangMo` + `phuTrach`
Tệp: `cases.ts` (`caseTopicsOf`), `owner.ts`.
- [ ] `owner.ts`: tách luật chọn thành hàm thuần `chonPhuTrach(rows, category)`; `suggestCaseOwner` = 1 câu đọc phân công lớp + hàm đó
      (một luật, hai chỗ dùng). `caseTopicsOf` đọc phân công lớp **một lần** (JOIN `users` lấy tên) → `phuTrach` mọi kỹ năng.
- [ ] `dangMo`: mở rộng câu `mo` sẵn có (thêm `title, detected_at, dedup_key` + đếm PA bằng subquery) → với mỗi kỹ năng tính
      `caseDedupKey` như `reportIssue` và loại Case chương trình khác (`caseKhacChuongTrinh`) — không viết luật trùng thứ hai.
- [ ] Turso: ghi số câu đọc `case-topics` trước → sau (dự kiến +1 câu: phân công lớp) vào mô tả PR.

## Task 3 — panel `QuickReport` (theo mẫu sẵn có)
Tệp: `web/src/modules/cases/QuickReport.tsx` (+ nơi gọi chỉ khi CV-LOI cần nối prop chọn sẵn).
- [ ] State: `chon: string[]` (theo thứ tự chip) + `the: Record<topic, { primaryCode, ghiRo, title, summary, gop }>`; bỏ chip → ẩn thẻ,
      chữ giữ tới khi `reset()`. Chip `NutChon` bấm bật / tắt (tab ghi bù: chọn một như nay).
- [ ] 1 kỹ năng: dựng đúng cây JSX hiện nay (Nhóm nguyên nhân · Mức độ · Tên · Mô tả trong khối "Vấn đề"). ≥ 2: khối "Vấn đề" giữ
      Học viên · Kỹ năng · Mức độ; mỗi kỹ năng một `Khoi tieuDe="Reading · phụ trách: Trần Ngọc Hà"` với Nhóm nguyên nhân (+ `OKhac`) · Tên · Mô tả.
- [ ] Thẻ chờ xác nhận: chỉ câu "… chờ xác nhận (MT2 · SOS 1)" + "Mở form Xác nhận Case"; không vào lô (1 kỹ năng: như nay).
- [ ] Thẻ trùng (`dangMo`): khối vàng sẵn có (`:601-612`) dời lên đầu thẻ, hai nút là `NutChon` chọn `gop` (mặc định ghi-vào); ghi-vào
      thì ẩn Tên.
- [ ] Lỗi: `LUAT` dựng theo thẻ (`khoa` `ten:reading`…, nhãn "Tên Case · Reading" khi ≥ 2) → `useLoiForm` sẵn có, chân "n ô cần sửa ↑".
      Lỗi máy chủ có `details.kyNang` → dòng `text-late` đầu đúng thẻ + toast; không mất chữ.
- [ ] Nút chính: 1 kỹ năng "Tạo Case" (như nay) · "Tạo 2 Case" · "Tạo 1 Case · ghi thêm 1" · "Ghi thêm 2".
- [ ] Sau lưu: `taiTepCho(tep, { ownerIds: các id được sửa })`; toast 1 kỹ năng như nay; ≥ 2 "Đã tạo 2 Case · Listening, Reading"
      (+ "Thêm PA" mở Case đầu mình phụ trách); bước "Đã lưu" khi tệp lỗi: Thử lại gắn mọi id; `onDone(id đầu)`.

## Task 4 — kiểm, ảnh, PR
- [ ] Giữ chỗ `check-` → `npm run check` MỘT lần (foreground) → trả chỗ.
- [ ] Giữ chỗ `web-`; demo riêng cổng 4420 / 5620; bấm thử MỘT lần: GV 7 hồ sơ HV tạo L + R; GVCN 10 tạo W2 + S (S về GV 9); hồ sơ
      lớp chọn em + 2 kỹ năng; "+ Case cho Reading" chọn sẵn R; 375. Ảnh `docs/anh/pr-case-nhieu/`: trước / sau 1 kỹ năng (giống hệt),
      2 kỹ năng, trùng, chờ xác nhận, lỗi lưu — 1440 tối + 375 sáng. Tắt tiến trình theo cổng 4420 / 5620.
- [ ] `/impeccable audit` + `/web-design-guidelines` trên `QuickReport.tsx` → `/ponytail-review` → PR vào `main` (không merge),
      mô tả ≤ 30 dòng; một dòng mục 11 `plan.md`; `CODE_MAP.md` thêm `caseLo.tests.ts`. Nhắn "PTA Plan: CASE-NHIEU #<số> sẵn sàng rà".

## Rủi ro
- Dữ liệu: thấp — không migrate, không đổi bảng; lô một giao dịch. Đổi nhỏ trong `reportIssue` (dời kiểm tên khi ghi vào, khoá ghi-vào)
  chạm mọi đường gọi → phép kiểm cũ (`prOv8b`, seed) phải xanh.
- Turso: lô n kỹ năng = n × (câu của `reportIssue`) trong một `BEGIN IMMEDIATE`; n ≤ 5.
