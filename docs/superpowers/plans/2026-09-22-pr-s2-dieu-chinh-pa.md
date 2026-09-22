# PR-S2 · Điều chỉnh PA học thuật: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task, in order. Steps use checkbox (`- [ ]`) syntax.
> Làm xong bước nào thì tick bước đó **ngay trong file này**. Task có 🛑 là **cổng**: dừng lại, báo chủ sản phẩm, chờ trả lời.

| Mục | Chốt |
|---|---|
| Model khuyến nghị | **Opus 5 · XHigh** |
| Phương án B | **Fable 5.1 · High** |
| Subagent | Cùng model với session đang code. **Không dùng Haiku** |
| Người rà soát | **Fable 5.1** (khác model người code). Nếu code bằng Fable (phương án B) thì **Opus 5** rà. Ghi tên người rà vào Nhật ký |
| Số PR | **Một PR**, nhánh `pr-s2-dieu-chinh-pa`, không để draft, **không tự merge** |
| Đợt | **Đợt 2, được bắt đầu sớm**: code song song với PR-O (`pr-o-khung-4-khu-vuc`) và PR-AN (`pr-an-an-toan`). Có migrate nên **merge SAU PR-AN** |

**Goal:** PA học thuật đang chạy **điều chỉnh được** mà không mất bản cũ (bản cũ, khi nào, ai, vì sao, bản hiện tại). Lần Ghi kết quả hằng tuần rút gọn thành
năm mục: kết quả, tiến triển, vấn đề còn tồn, quyết định **Giữ nguyên / Điều chỉnh / Thay phương án / Kết thúc phương án**, ghi chú hoặc lý do.

**Architecture:** Dùng lại đường Ghi kết quả đang có (`updateResult`, `POST /interventions/:id/result`). Trường mới `decision` được dịch về đúng cặp
`mode`/`nextStep` cũ, nên mọi luật đang có vẫn kiểm như trước. Thêm một bước `adjust`: cùng một PA, mở đợt mới, sửa nội dung, và ghi **một dòng**
vào bảng mới `case_intervention_revisions`. **Thay** giữ nguyên cơ chế có sẵn (`closed_reason = 'superseded'` + `superseded_by` + tạo PA mới),
chỉ bắt thêm lý do. Hai cột mới ở `case_followups` giữ "vấn đề còn tồn" và "lý do/ghi chú". Giao diện có **một** form chung
(`web/src/modules/cases/CapNhatTuan.tsx`) dùng ở hai chỗ đang có form: khối PA ở hồ sơ học viên (`SkillBoard`) và ngăn Case (`CasePanel`).

**Tech Stack:** TypeScript 5.9 · Express 4 · `libsql` 0.5.29 (SQLite khi dev, Turso khi bản chính) · harness kiểm thử tự viết `server/src/tests/run.ts`
(`check` / `assert` / `assertThrows`; **không phải** Jest và **không có bộ lọc**, luôn chạy cả bộ rồi tìm tên phép kiểm trong kết quả) · React 18.

**Spec:** `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` (§1 G-3, G-7, G-12; §2 luật chữ và kết quả PA; §3.8 Hành trình, chỉ để
bảo đảm dữ liệu; §7 dòng **S2**, lịch 7 đợt). Việc gốc: `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md` §1.5 (**S2**, **S4**) và §5.2 (ma trận).
Nguồn luật: `plan.md` §22.9 (S2, S4, nghiệm thu mục 2) · `thiet-ke/PISA-Rulebook-2026-09-19.md` §5, §11, §18.2 (điểm 2 và 4), §19 ·
`thiet-ke/NGUON-Rule-Y-thuc-2026-09-21.md` §7, §8, §9 · `thiet-ke/NGUON-Rule-v3-YThuc-PhoiHop-2026-09-21.md` §9 ·
`thiet-ke/SOS_VA_PHOI_HOP_V3.md` S04, S06, §3.3, Q-V3-3 · chữ: `thiet-ke/THUAT_NGU_DA_CHOT.md` g3-056…061, g6-090, g7-050/051, g8-119…141.

**Số dòng trong plan này** đo trên `main` @ `f598906` ngày 22/09/2026. Lúc viết plan, **PR-S1 (#56) đã merge** (merge commit `67ec8c5`), nên mã
`main` chính là mã của nhánh `pr-s1-luat-may-chu`. Trước khi sửa, mở file ra xem lại. Lệch vài dòng là bình thường; **lệch nội dung** thì 🛑 hỏi.

---

## Global Constraints

- **An toàn dữ liệu.** **Không bao giờ** chạy lệnh nào vào database bản chính (Turso). Không đặt `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
  `PISA_CHO_PHEP_MIGRATE_TURSO`, `PISA_CHO_PHEP_SEED_TURSO`, `BAN_CHINH` trong cửa sổ làm việc. `npm test` tự chạy trên `data/test.sqlite`.
  `npm run migrate` chỉ chạy trên **bản sao** (Task 11). **Không deploy.**
- **Không dùng cổng 4000 và 5173.** Hai cổng đó thuộc máy chủ dev của thư mục chính. Bấm thử dùng API **4127** và Vite **5327** (Task 11).
- **Migration idempotent, chạy lặp được** (luật repo): chỉ tạo bảng khi chưa có, chỉ `ADD COLUMN` khi chưa có cột; chạy lần hai thì `applied` rỗng.
  Bảng và cột mới phải có ở **cả** `schema.sql` (bản chính dựng từ đây ở PR-Z2c) **lẫn** `migrate.ts` (database dev đang có).
- **Không chạm file của PR-O:** `web/src/App.tsx`, `web/src/modules/overview/OverviewPage.tsx`, khối điều hướng của `server/src/routes/index.ts`,
  các trang mới của khu Test và khu Công việc.
- **Không chạm file hoặc vùng của PR-AN:** `server/src/app.ts`, `server/src/auth.ts`, trang Welcome, `netlify/*`, bảng `auth_attempts`.
  Trong `server/src/cases/cases.ts` **không sửa** các chỗ sau: dòng khai báo `function caseCardOf(caseId: number, c: any)` (~2299), khối
  `attachmentCount:` (~2412–2414), dòng `...caseCardOf(c.id, c),` và khối `const caseRows = …` trong `skillSupportBoard` (~2010–2017, ~2237).
  PR này chỉ **thêm dòng bên trong** thân `caseCardOf` (câu truy vấn `follows` và khối `plans`).
- **Không làm lại Hành trình.** Hành trình là việc của PR-Qb (đợt 3). `web/src/modules/students/JourneyTimeline.tsx` và `StudentDetailPage.tsx`
  **không sửa**. PR này chỉ bảo đảm dữ liệu đủ cho Qb (mục "Chuyển cho PR-Qb" ở cuối plan).
- **Không sửa** `web/src/modules/yThuc/CaseSosControls.tsx` (thuộc vùng PR-YT2 và PR-Form). Nút "Sửa" của gợi ý tự động vẫn gọi đúng route cũ;
  máy chủ tự ghi lịch sử (Task 6).
- `server/src/cases/effectiveness.ts`: **chỉ sửa một dòng** trong `plansNeedingEvaluation` (~297, lọc bỏ PA đã bị thay, Q2). Mọi luật khác được
  **khoá bằng phép kiểm** (Task 7), không đổi mã. (Ma trận §5.2 không ghi S2 ở file này; S1 đã merge, Pb ở đợt 4 nên không chạy song song.)
- **Chữ người dùng thấy:** "Case" viết hoa. Không mở đầu câu bằng "Hãy". Không dùng "biện pháp". Không dùng chuỗi trong `PRH_OLD_STRINGS`
  (`server/src/tests/run.ts` ~8707, ví dụ `Hoàn thành phương án`). Chỗ nào PR này chạm thì dùng chữ đã chốt: nút **Ghi kết quả** (g3-056/057),
  **Ghi kết quả, tiếp tục theo dõi** (g3-058/059), **Kết thúc phương án** (g3-060), **Ngày cập nhật** (g7-050/051), **Đợt {n}** thay "chu kỳ {n}"
  (g8-141), **Được thay thế** (g6-090), **Xin hỗ trợ từ Quản lý** (g8-119). Kết quả PA dùng **Tiến bộ rõ · Tiến bộ một phần · Không tiến bộ · Kém hơn**
  (+ Chưa đủ dữ liệu); mã đã đúng sẵn (`FOLLOWUP_OUTCOME_LABEL`).
- **Giao diện** (đặc tả §1): G-3, trên dòng PA tối đa **một** dòng phụ ≤ ~60 ký tự, lịch sử đầy đủ để trong phần mở ▸ hoặc trong ngăn Case.
  G-7, nút có `title` giải thích. G-12, **không thêm lối vào mới**: điều chỉnh chỉ đi qua form Ghi kết quả đang có.
- **Phép kiểm mới** nằm ở file mới `server/src/tests/dieuChinhPa.tests.ts`, nối vào `run.ts` bằng **3 dòng** ngay sau khối PR-S1
  (~9439–9442) và trước khối PR-Z2. Số phép kiểm chỉ tăng. Mốc đầu ghi ở Task 0 (S1 kết thúc ở **719**).
- **Xung đột khi rebase** (`migrate.ts`, `schema.sql`, `run.ts`, `routes/index.ts`, `cases.ts`): **giữ cả hai khối**. Cách gỡ ở Task 11 Step 6.
- Mỗi commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn của phiên. Không dùng `--no-verify`.

---

## Quyết định session planning tự chốt khi nguồn im lặng (người rà soát kiểm lại)

> **Planning review 22/09/2026:** duyệt mọi Q như viết, **trừ Q2 — đã SỬA** (cho Thay khi Chưa đủ dữ liệu; PA cũ không vào thống kê, không vào F05).
> Q9, Q11 và Task 2, 4, 7 đã sửa theo.

| # | Câu hỏi | Chốt | Vì sao |
|---|---|---|---|
| Q1 | **"Thay" nghĩa là gì** trong mô hình dữ liệu? | **Kết thúc PA cũ + tạo PA mới nối tiếp, trong một giao dịch.** PA cũ: `status = 'completed'`, `closed_reason = 'superseded'`, `superseded_by = id PA mới`, `completed_date = ngày cập nhật`, kết quả là kết quả của lần cập nhật đó. PA mới chạy từ ngày cập nhật. Đây là đường `nextStep: 'propose'` **đã có** (`cases.ts:2730-2754`); PR này đổi tên thành "Thay phương án", bắt **lý do** (≥ 8 ký tự, lưu `case_followups.decision_note`) và sửa lỗi thiếu người thực hiện (Q13) | SOS_V3 S06 viết đúng câu này ("kết thúc cái cũ (`superseded`) + tạo cái mới trong **một** thao tác"). Rulebook §18.2 ghi `superseded_by` "đã có, giữ" |
| Q2 | "Thay" khi kết quả là **Chưa đủ dữ liệu** | **SỬA theo planning review 22/09: CHO.** Bắt lý do như mọi lần Thay. PA cũ thành "Được thay thế" (`completed`, `superseded`), kết quả cuối = Chưa đủ dữ liệu → **không** vào thống kê hiệu quả (D03: không vào bảng, không vào mẫu số) và **không** nằm trong danh sách "PA cần bổ sung đánh giá" (F05): `plansNeedingEvaluation` lọc bỏ PA đã bị thay. **Kết thúc suông** với Chưa đủ dữ liệu **vẫn không cho**; Xin hỗ trợ từ Quản lý với Chưa đủ dữ liệu cũng không (như cũ) | Tình huống thật: tuần đầu em không làm, GV muốn đổi ngay từ tự học sang tutor. Chặn thì GV sẽ chọn bừa "Không tiến bộ" làm bẩn thống kê. PA đã bị thay thì không ai bổ sung đánh giá được nữa, nên không để nó nằm trong F05 |
| Q3 | **Điều chỉnh** khác Thay ở đâu? | Điều chỉnh là **cùng một PA** (cùng `id`), sửa **mô tả, người thực hiện, ngày dự kiến kết thúc**. **Không đổi loại PA**; muốn đổi loại thì chọn Thay. Điều chỉnh mở đợt mới giống Giữ nguyên (hạn cập nhật sang Chủ nhật kế tiếp). Mỗi lần điều chỉnh ghi **một** dòng `case_intervention_revisions` (bản cũ, bản mới, ngày, người, lý do). Lý do bắt buộc ≥ 8 ký tự; phải đổi ít nhất một thứ | Nguồn §7 tách "điều chỉnh" với "thay thế". Giữ nguyên loại PA thì thống kê theo loại (`effectiveness`) không bị gán kết quả cho sai loại |
| Q4 | **Ai được điều chỉnh / thay?** | **Đúng người được Ghi kết quả**: quyền `SOS_EDIT` theo đúng kỹ năng của Case (C02), tức GVBM đúng môn và Quản lý trong phạm vi. GVCN chỉ với môn mình dạy. Không thêm quyền mới | Một luồng, một quyền. Mở quyền mới là luật mới |
| Q5 | **PA đã xác nhận** có sửa được không? | **Được**, qua Điều chỉnh trong form Ghi kết quả, có lý do và có lịch sử | Kiểm kê S2: hiện "PA đã xác nhận không sửa được chút nào" |
| Q6 | **PA đã xong / đã huỷ / đã bị thay / đang chờ Quản lý duyệt** có sửa được không? | **Không.** PA đã khép là lịch sử, giữ nguyên (máy chủ từ chối như hiện nay: "đã kết thúc"). PA đang chờ duyệt thì chờ Quản lý trả lời trước. Muốn làm tiếp thì thêm PA mới | Sửa PA đã khép là viết lại lịch sử, và làm lệch thống kê đã tính |
| Q7 | Gợi ý tự động từ SOS **chưa xác nhận** | Giữ ba nút Xác nhận · Sửa · Thay đang có. **Sửa lúc xác nhận** mà đổi mô tả hoặc ngày thì ghi **một** dòng lịch sử `source = 'confirm_edit'`, lý do mặc định "Chỉnh khi xác nhận gợi ý tự động" (route nhận thêm `reason` nếu có). Máy tự đồng bộ gợi ý theo mức SOS (`sosAuto.ts:106-125`) **không** ghi lịch sử | Gợi ý chưa xác nhận chưa phải PA (Q-V3-3). Nhưng bản gợi ý chính là "phương án ban đầu" mà nguồn §7 đòi giữ |
| Q8 | Có nút "Điều chỉnh" riêng ngoài lần Ghi kết quả không? | **Không.** Một lối vào duy nhất là form Ghi kết quả. Giữa tuần muốn chỉnh mà chưa có gì mới thì chọn kết quả "Chưa đủ dữ liệu" + Điều chỉnh | G-12 (không thêm lối vào khi bảng định vị §4 chưa ghi). Ít chỗ sửa hơn thì ít đường ghi lệch nhau |
| Q9 | **Ảnh hưởng thống kê hiệu quả** | **`effectiveness.ts` chỉ sửa MỘT dòng** (`plansNeedingEvaluation` lọc bỏ PA đã bị thay, theo Q2). (a) Giữ nguyên và Điều chỉnh không sinh PA mới, nên 1 PA vẫn = 1 kết quả cuối (luật 1). (b) Thay với kết quả xác định: PA cũ **tính** với kết quả của lần thay (luật 3, "PA bị thay vẫn tính nếu có kết quả cuối"). (c) Thay với Chưa đủ dữ liệu: PA cũ **không** tính và **không** vào F05 (Q2). PA mới tính khi nó kết thúc. (d) PA gợi ý bị thay trước khi xác nhận vẫn `cancelled` nên không tính (như cũ). Có ba phép kiểm khoá (Task 7) | Giữ đúng luật "PA có kết quả thật thì tính" (planning review 22/09, Q7 của S1) |
| Q10 | Năm mục của cập nhật tuần (nguồn §8) nằm ở đâu | (1) **Kết quả hiện tại** = 5 nút kết quả đang có. (2) **Tiến triển** = ô ghi chú bắt buộc đang có (`note`, ≥ 8 ký tự). (3) **Vấn đề còn tồn** = cột mới `remaining_issue`, không bắt buộc, ≤ 300 ký tự. (4) **Quyết định** = 4 nút + nút chữ phụ "Xin hỗ trợ từ Quản lý". (5) **Ghi chú** = cột mới `decision_note`: tên ô đổi thành "Lý do điều chỉnh" / "Lý do thay" và **bắt buộc** khi chọn Điều chỉnh/Thay; các trường hợp khác không bắt buộc | "Không biến thành form dài": chỉ thêm một ô một dòng; ô thứ năm vừa là ghi chú vừa là lý do |
| Q11 | Kết thúc phương án | Giữ luật cũ: chỉ kết quả **tốt** (Tiến bộ rõ, Tiến bộ một phần) mới Kết thúc suông. Kết quả chưa tốt thì Giữ, Điều chỉnh, Thay hoặc Xin hỗ trợ từ Quản lý. Chưa đủ dữ liệu thì Giữ, Điều chỉnh hoặc Thay (Q2). `canEndWithOutcome` giữ nguyên nghĩa "kết thúc suông được không"; `endStepsFor('insufficient')` trả `['propose']` | Rulebook §5, `endStepsFor` đang có |
| Q12 | Payload cũ `{ mode, nextStep }` | **Vẫn nhận** (tương thích, và các phép kiểm cũ dùng nó). Web chuyển hẳn sang `decision`. Riêng `propose` (Thay) nay **luôn** bắt `decisionNote`, nên sửa 2 phép kiểm cũ (Task 4 Step 5) | Lý do "vì sao đổi" là điều luật bắt buộc audit (§18.2), không thể chỉ bắt ở giao diện |
| Q13 | Lỗi có sẵn: Thay từ giao diện **luôn hỏng** vì PA mới thiếu người thực hiện (`recordIntervention` ném "Cần ghi ai là người thực hiện" khi `status: 'started'`; `ResultDialog` không gửi người) | Form mới gửi `performerSelf: true` khi ô "Người thực hiện phương án mới" để trống (nhãn ghi rõ "để trống = bạn"); `updateResult` chuyển `performerSelf` sang `recordIntervention`. Máy chủ **không tự suy** | Giữ nguyên tắc "không tự suy người làm" (`cases.ts:703-709`), và người dùng thấy rõ mình đang khai |
| Q14 | Nhãn bước cũ trong lịch sử | `NEXT_STEP_LABEL`: `continue` → "Giữ nguyên" (trước là "Tiếp tục phương án cũ"), `propose` → "Thay phương án" (trước là "Đề xuất phương án mới"), thêm `adjust` → "Điều chỉnh". Lịch sử cũ đọc theo nhãn mới, nghĩa không đổi | Một khái niệm một chữ (đặc tả §2) |
| Q15 | `completeIntervention` ghi đè mô tả PA bằng ghi chú (`cases.ts:1066`, kiểm kê gọi là "cases.ts:1034") | **Bỏ ghi đè.** Ghi chú vẫn còn ở hành trình (`journey_events.detail`) và `audit_logs`. Web hiện không gọi route này nữa (chỉ phép kiểm cũ gọi) | Đây đúng là "ghi đè mất dấu" mà S2 cấm |
| Q16 | `recordFollowUp` (`POST /cases/:id/followups`, `cases.ts:1218`) mà kiểm kê S4 trỏ tới | **Không đổi.** Web không gọi nó; cập nhật tuần thật đi qua `updateResult` | Xem mâu thuẫn M1 ở cuối plan |
| Q17 | Dữ liệu demo | **Không đổi seed.** Bấm thử tự tạo dữ liệu (Task 11) | Đổi seed dễ làm đỏ các phép kiểm khoá số liệu demo; lịch sử cũ vốn đã mất, không bịa lại |
| Q18 | Một câu truy vấn thêm cho mỗi Case trong `caseCardOf` (đọc lịch sử điều chỉnh) | Chấp nhận (mỗi học viên thường dưới 10 Case). Gộp truy vấn để PR-Z2c đo trên Turso | Gộp ngay thì phải sửa dòng gọi `caseCardOf`, là vùng PR-AN đang sửa |

---

## File Structure

| File | Làm gì |
|---|---|
| `server/src/schema.sql` | + bảng `case_intervention_revisions` (+2 chỉ mục) ngay sau `idx_followup_case` (~1087); + cột `case_followups.remaining_issue`, `decision_note` (cuối bảng, sau `created_at` ~1085); chú thích `next_step` thêm `adjust` (~1060) |
| `server/src/migrate.ts` | + `export function migrateDieuChinhPa(conn, applied)` cuối file; gọi ngay sau `migrateLuatMayChu(conn, applied);` (~442) |
| `server/src/cases/effectiveness.ts` | một dòng: `plansNeedingEvaluation` bỏ PA đã bị thay (Q2) |
| `shared/domain/cases.ts` | `NEXT_STEPS` + `adjust`; nhãn `continue`/`propose` (Q14); `stepsForMode('monitor')` → `['continue','adjust']`; `endStepsFor('insufficient')` → `['propose']` (Q2); + `PLAN_DECISIONS`, `PLAN_DECISION_CHIPS`, `PLAN_DECISION_LABEL`, `PLAN_DECISION_HINT`, `decisionToStep`, `decisionsFor`, `decisionBlockedReason`, `decisionNeedsReason`, `CONFIRM_EDIT_REASON` |
| `server/src/cases/planRevisions.ts` | **Mới.** `DieuChinhPA`, `BanDieuChinh`, `chuanHoaDieuChinh`, `ghiBanDieuChinh`, `apDungDieuChinh`, `lichSuDieuChinhCuaCase` |
| `server/src/cases/cases.ts` | `updateResult` (~2583–2795) nhận `decision`, `remainingIssue`, `decisionNote`, `adjust`, `newPlan.performerSelf`; nhánh `adjust`; `caseDetail` (~1406–1477) trả `revisions`, `remainingIssue`, `decisionNote`; `caseCardOf` **thân** (~2316–2372) trả `closedReason`, `supersededBy`, `revisions`, `updates[].decision/remainingIssue/decisionNote`; `completeIntervention` (~1066) bỏ ghi đè mô tả |
| `server/src/cases/sosAuto.ts` | `confirmPresetPlan` (~184–219) ghi `confirm_edit` khi có sửa; nhận `reason` |
| `server/src/routes/index.ts` | chỉ khối `/interventions/:id/confirm` (~1186–1192): chuyển thêm `reason` |
| `server/src/tests/dieuChinhPa.tests.ts` | **Mới.** Mọi phép kiểm của PR này |
| `server/src/tests/run.ts` | 3 dòng nối (~9443); sửa 3 phép kiểm cũ bị luật mới thay (~2524, ~2557, ~8173) |
| `web/src/modules/cases/CapNhatTuan.tsx` | **Mới.** `CapNhatTuanForm` (form 5 mục) + `LichSuDieuChinh` (danh sách bản điều chỉnh) + kiểu `BanDieuChinh`, `PaCanCapNhat` |
| `web/src/modules/cases/CasePanel.tsx` | `ResultDialog` (~1073–1280) thành vỏ `Modal` bọc `CapNhatTuanForm`; `InterventionBody` (~497–590) hiện lịch sử điều chỉnh, "Thay cho / Được thay bằng", còn tồn, lý do; nút "Cập nhật kết quả" → "Ghi kết quả"; "chu kỳ" → "Đợt" |
| `web/src/modules/cases/SkillBoard.tsx` | kiểu `Plan` (~30–47) thêm trường; `KhoiPhuongAn` (~477–603) dòng phụ và lịch sử; `InlineResult` (~633–762) thay bằng `CapNhatTuanForm`; bỏ import `ResultDialog` |
| `plan.md`, `CODE_MAP.md` | tick S2, S4 (§22.9); hai dòng bản đồ mã (Task 9) |

---

### Task 0: Chuẩn bị

**Files:** không sửa mã.

- [x] **Step 1: Worktree.** Từ `main` mới nhất (`git fetch origin && git log -1 origin/main` phải chứa merge PR #56): tạo worktree nhánh `pr-s2-dieu-chinh-pa`
  (skill `superpowers:using-git-worktrees`), ví dụ `.claude/worktrees/pr-s2-dieu-chinh-pa`. **Không checkout nhánh khác trong thư mục chính.**
  Chạy `npm ci` trong worktree nếu chưa có `node_modules`.
- [x] **Step 2: Kiểm không có biến Turso.**

```bash
node -e "for (const k of ['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BAN_CHINH','PISA_CHO_PHEP_MIGRATE_TURSO','PISA_CHO_PHEP_SEED_TURSO']) if (process.env[k]) { console.error('CÓ BIẾN', k); process.exit(1) } ; console.log('sạch')"
```
Expected: `sạch`. Có biến thì đóng cửa sổ, mở cửa sổ mới.

- [x] **Step 3: Mốc phép kiểm.** Run: `npm test 2>&1 | tail -3`. Expected: `TẤT CẢ 719 KIỂM TRA ĐỀU ĐẠT` (hoặc số lớn hơn nếu `main` đã có PR khác).
  Ghi con số vào Nhật ký; mọi "Expected" bên dưới tính cộng dồn từ số này (gọi là **B**).
- [x] **Step 4:** Đọc Global Constraints và bảng Q1–Q18. Thấy Q nào sai với đặc tả thì 🛑 hỏi trước khi code.

---

### Task 1: Bảng lịch sử + hai cột + bước nâng cấp idempotent + file phép kiểm

**Files:**
- Modify: `server/src/schema.sql:1060` (chú thích), `:1085` (cuối bảng `case_followups`), `:1087` (sau `idx_followup_case`)
- Modify: `server/src/migrate.ts:442` (gọi), cuối file (hàm mới)
- Create: `server/src/tests/dieuChinhPa.tests.ts`
- Modify: `server/src/tests/run.ts:9442-9443` (nối sau khối PR-S1)

**Interfaces:**
- Produces: bảng `case_intervention_revisions` (cột ở Step 3); cột `case_followups.remaining_issue TEXT`, `case_followups.decision_note TEXT`;
  `export function migrateDieuChinhPa(conn: any, applied: string[]): void`; trong file test: `taoCase()`, `ivRow`, `revRows`, `lastFollow`, `NOW`, `REPO`.

- [x] **Step 1: Tạo file phép kiểm (đỏ).** `server/src/tests/dieuChinhPa.tests.ts`:

```ts
/**
 * PHÉP KIỂM PR-S2: điều chỉnh PA học thuật (S2) và cập nhật tuần rút gọn (S4).
 * Đặc tả: docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md §2, §7 dòng S2; kiểm kê §1.5 (S2, S4).
 * Kế hoạch: docs/superpowers/plans/2026-09-22-pr-s2-dieu-chinh-pa.md (Q1–Q18).
 *
 * Harness do `run.ts` sở hữu và truyền vào, file này không tự mở database. Học viên và Case dùng ở đây do CHÍNH file này tạo
 * (`taoCase`), không đụng học viên của bộ demo.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runDieuChinhPaTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId, addDays } = t;
  const domain: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const effectiveness: any = await import('../cases/effectiveness.ts');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const migrateMod: any = await import('../migrate.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const NOW = new Date().toISOString();
  const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  let soThuTu = 0;

  /**
   * MỘT học viên mới ở MB-FT 101, MỘT Case Listening do GV Listening (`P.lrTeacher`) mở, MỘT PA tự học đang chạy từ hôm nay,
   * người thực hiện là chính GV đó. Mô tả gốc: "Tự học Listening — nghe chép 15 phút mỗi ngày".
   */
  function taoCase(): { sid: number; caseId: number; ivId: number } {
    soThuTu += 1;
    const tag = `S2-${soThuTu}`;
    const cid = classId('MB-FT 101');
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mbBranch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, cid, NOW);
    conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)`,
    ).run(sid, NOW);
    const c = cases.reportIssue(P.lrTeacher, {
      studentId: sid, topic: 'listening', title: `Nghe chi tiết còn yếu (${tag})`,
      summary: 'Em bỏ sót số và tên riêng ở Section 2, sai nhiều câu điền từ.',
      primaryCode: domain.issuesForTopic('listening')[0].code, idempotencyKey: `pr-s2-${tag}`,
    }) as any;
    const d = cases.recordIntervention(P.lrTeacher, c.id, {
      kind: 'self_study', description: 'Tự học Listening — nghe chép 15 phút mỗi ngày',
      performerSelf: true, status: 'started', startedDate: TODAY,
    }) as any;
    const ivId = d.interventions.find((i: any) => i.kind === 'self_study').id as number;
    return { sid, caseId: c.id as number, ivId };
  }
  const ivRow = (id: number) => conn.prepare('SELECT * FROM case_interventions WHERE id = ?').get(id) as any;
  const revRows = (id: number) =>
    conn.prepare('SELECT * FROM case_intervention_revisions WHERE intervention_id = ? ORDER BY id').all(id) as any[];
  const lastFollow = (id: number) =>
    conn.prepare('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id DESC LIMIT 1').get(id) as any;
  void sosAuto; void effectiveness; void assertThrows; void addDays; void ivRow; void revRows; void lastFollow; void taoCase;

  // ================================================================== 1. Nâng cấp database

  console.log('\nPR-S2 · 1. Bảng lịch sử điều chỉnh + hai cột cập nhật tuần: schema.sql và migrate.ts khớp nhau, chạy lặp không làm gì');

  const SCHEMA = fsMod.readFileSync(pathMod.join(REPO, 'server/src/schema.sql'), 'utf8');
  const colsOf = (db: any, table: string): string[] =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}`);
  const idxOf = (db: any, table: string): string[] =>
    (db.prepare(`PRAGMA index_list(${table})`).all() as any[]).map((i) => i.name).sort();
  /** Database THỜI TRƯỚC PR-S2: schema hiện tại, gỡ đúng bảng và hai cột PR-S2 thêm. */
  const preS2 = () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec(`DROP TABLE case_intervention_revisions;
            ALTER TABLE case_followups DROP COLUMN remaining_issue;
            ALTER TABLE case_followups DROP COLUMN decision_note;`);
    return m;
  };

  check('PR-S2 · Migrate: database dựng từ schema.sql có bảng lịch sử điều chỉnh và hai cột mới của cập nhật tuần', () => {
    const rev = colsOf(conn, 'case_intervention_revisions').map((c) => c.split(':')[0]);
    for (const c of ['intervention_id', 'case_id', 'followup_id', 'source', 'old_description', 'new_description',
      'old_performer_user_id', 'old_performer_name', 'new_performer_user_id', 'new_performer_name',
      'old_followup_due', 'new_followup_due', 'reason', 'effective_on', 'actor_user_id', 'created_at']) {
      assert(rev.includes(c), `case_intervention_revisions thiếu cột ${c}`);
    }
    const fu = colsOf(conn, 'case_followups').map((c) => c.split(':')[0]);
    assert(fu.includes('remaining_issue') && fu.includes('decision_note'), `case_followups thiếu cột mới: ${fu.join(',')}`);
  });

  check('PR-S2 · Migrate: database cũ được thêm đúng bảng và cột như schema.sql (cùng tên, kiểu, chỉ mục)', () => {
    const m = preS2();
    const applied: string[] = [];
    migrateMod.migrateDieuChinhPa(m, applied);
    assert(applied.length === 1 && /PR-S2/.test(applied[0]), `Phải báo đúng một dòng PR-S2: ${applied.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    for (const tb of ['case_intervention_revisions', 'case_followups']) {
      assert(JSON.stringify(colsOf(m, tb)) === JSON.stringify(colsOf(fresh, tb)),
        `${tb} sau nâng cấp khác schema.sql:\n  ${colsOf(m, tb).join(',')}\n  ${colsOf(fresh, tb).join(',')}`);
    }
    assert(JSON.stringify(idxOf(m, 'case_intervention_revisions')) === JSON.stringify(idxOf(fresh, 'case_intervention_revisions')),
      'Chỉ mục của bảng lịch sử khác schema.sql');
  });

  check('PR-S2 · Migrate: chạy lần hai không làm gì; database mới từ schema.sql không có gì để nâng cấp', () => {
    const m = preS2();
    migrateMod.migrateDieuChinhPa(m, []);
    const again: string[] = [];
    migrateMod.migrateDieuChinhPa(m, again);
    assert(again.length === 0, `Lần hai phải không làm gì: ${again.join(' | ')}`);
    const fresh = new SqliteDb(':memory:');
    fresh.exec(SCHEMA);
    const none: string[] = [];
    migrateMod.migrateDieuChinhPa(fresh, none);
    assert(none.length === 0, `Database mới không được có gì để nâng cấp: ${none.join(' | ')}`);
  });

  check('PR-S2 · Migrate: `migrate()` trọn chuỗi chạy hai lần trên database đang dùng, lần hai không áp lại bước PR-S2', () => {
    migrateMod.migrate();
    const second = migrateMod.migrate();
    assert(!second.applied.some((x: string) => /PR-S2/.test(x)), `Lần hai áp lại PR-S2: ${second.applied.join(' | ')}`);
  });

  // ---- các task sau thêm phép kiểm NGAY TRÊN dòng này ----
}
```

Nối vào `server/src/tests/run.ts`, ngay **sau** dòng `await runLuatMayChuTests(...)` (~9442) và **trước** dòng chú thích khối PR-Z2:

```ts

// ==================================================================== PR-S2 (điều chỉnh PA học thuật · cập nhật tuần rút gọn)

const { runDieuChinhPaTests } = await import('./dieuChinhPa.tests.ts');
await runDieuChinhPaTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```

- [x] **Step 2: Chạy, thấy đỏ.** Run: `npm test 2>&1 | grep -E "PR-S2|KIỂM TRA|KHÔNG ĐẠT"`. Expected: ba phép `PR-S2 · Migrate` đầu **✗**
  (thiếu bảng, hoặc `migrateDieuChinhPa is not a function`); phép "trọn chuỗi" ✓.

- [x] **Step 3: `schema.sql`.**

(a) Dòng ~1060, chú thích `next_step`: đổi `complete | monitor | continue | propose | ask_manager` thành
`complete | monitor | continue | adjust | propose | ask_manager`, và thêm dòng chú thích ngay dưới:

```sql
   * PR-S2: `continue` = Giữ nguyên · `adjust` = Điều chỉnh (xem `case_intervention_revisions`) · `propose` = Thay phương án.
```

(b) Ở **cuối** bảng `case_followups`: dòng `  created_at TEXT NOT NULL` (~1085) thêm dấu phẩy thành `  created_at TEXT NOT NULL,`, rồi ngay dưới nó
(trước `);`) thêm hai cột. Đặt ở **cuối** vì `ALTER TABLE … ADD COLUMN` của `migrate.ts` luôn thêm vào cuối; hai nơi phải ra cùng thứ tự cột (phép kiểm so
từng cột). Chú thích **không có dấu phẩy** (bài học PR-S1 Task 1: `DROP COLUMN` cột cuối bảng cắt ngược tới dấu phẩy gần nhất, dấu phẩy trong chú thích
làm vỡ câu CREATE):

```sql
  created_at TEXT NOT NULL,
  /*
   * CẬP NHẬT TUẦN RÚT GỌN (PR-S2 · S4 · nguồn §8). Cột note ở trên là phần Tiến triển.
   * remaining_issue là vấn đề còn tồn (tuỳ chọn). decision_note là lý do khi Điều chỉnh hoặc Thay (bắt buộc)
   * hoặc ghi chú khi Giữ nguyên hoặc Kết thúc (tuỳ chọn).
   */
  remaining_issue TEXT,
  decision_note TEXT
```

(c) Ngay sau `CREATE INDEX idx_followup_case ON case_followups(case_id);` (~1087):

```sql

/*
 * LỊCH SỬ ĐIỀU CHỈNH PHƯƠNG ÁN HỌC THUẬT (PR-S2 · S2 · rulebook §18.2 điểm 2 · nguồn §7).
 *
 * Mỗi dòng là MỘT lần sửa nội dung một PA: bản cũ, bản mới, ngày, ai, vì sao. Sửa nội dung không còn ghi đè mất dấu.
 * "Thay" KHÔNG ghi ở đây: thay là khép PA cũ (`closed_reason = 'superseded'`, `superseded_by`) rồi tạo PA mới;
 * lý do thay nằm ở `case_followups.decision_note` của lần cập nhật đã thay.
 *
 *   source  adjust        Điều chỉnh trong một lần Ghi kết quả (có `followup_id`)
 *           confirm_edit  Sửa gợi ý tự động từ SOS ngay lúc xác nhận (không có `followup_id`)
 *
 * Loại PA (`kind`) không đổi qua điều chỉnh. Đổi loại là Thay.
 */
CREATE TABLE case_intervention_revisions (
  id INTEGER PRIMARY KEY,
  intervention_id INTEGER NOT NULL REFERENCES case_interventions(id),
  case_id INTEGER NOT NULL REFERENCES sos_cases(id),
  followup_id INTEGER REFERENCES case_followups(id),
  source TEXT NOT NULL,
  old_description TEXT,
  new_description TEXT,
  old_performer_user_id INTEGER REFERENCES users(id),
  old_performer_name TEXT,
  new_performer_user_id INTEGER REFERENCES users(id),
  new_performer_name TEXT,
  old_followup_due TEXT,
  new_followup_due TEXT,
  reason TEXT NOT NULL,
  effective_on TEXT NOT NULL,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_iv_revision_iv ON case_intervention_revisions(intervention_id, id);
CREATE INDEX idx_iv_revision_case ON case_intervention_revisions(case_id);
```

- [x] **Step 4: `migrate.ts`.** Gọi ngay sau `migrateLuatMayChu(conn, applied);` (~442):

```ts
    /* PR-S2: lịch sử điều chỉnh PA học thuật + hai cột cập nhật tuần rút gọn. */
    migrateDieuChinhPa(conn, applied);
```

Cuối file:

```ts

/**
 * PR-S2 (điều chỉnh PA học thuật, 22/09/2026): bảng `case_intervention_revisions` + cột `case_followups.remaining_issue`, `decision_note`.
 * KHÔNG điền dữ liệu cũ: trước PR này sửa nội dung PA là ghi đè, bản cũ đã mất, không bịa lại.
 * Chạy lặp không làm gì. Bản chính dựng từ `schema.sql` nên không đi qua bước này. Câu CREATE phải giống hệt `schema.sql`
 * (phép kiểm `PR-S2 · Migrate` so từng cột và chỉ mục).
 */
export function migrateDieuChinhPa(conn: any, applied: string[]) {
  const hasTable = (t: string) => !!conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(t);
  const cols = (t: string): string[] => (conn.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c: any) => c.name);
  if (!hasTable('case_interventions') || !hasTable('case_followups')) return;
  const done: string[] = [];
  if (!hasTable('case_intervention_revisions')) {
    conn.exec(`
      CREATE TABLE case_intervention_revisions (
        id INTEGER PRIMARY KEY,
        intervention_id INTEGER NOT NULL REFERENCES case_interventions(id),
        case_id INTEGER NOT NULL REFERENCES sos_cases(id),
        followup_id INTEGER REFERENCES case_followups(id),
        source TEXT NOT NULL,
        old_description TEXT,
        new_description TEXT,
        old_performer_user_id INTEGER REFERENCES users(id),
        old_performer_name TEXT,
        new_performer_user_id INTEGER REFERENCES users(id),
        new_performer_name TEXT,
        old_followup_due TEXT,
        new_followup_due TEXT,
        reason TEXT NOT NULL,
        effective_on TEXT NOT NULL,
        actor_user_id INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_iv_revision_iv ON case_intervention_revisions(intervention_id, id);
      CREATE INDEX IF NOT EXISTS idx_iv_revision_case ON case_intervention_revisions(case_id);
    `);
    done.push('bảng case_intervention_revisions');
  }
  for (const c of ['remaining_issue', 'decision_note']) {
    if (!cols('case_followups').includes(c)) {
      conn.exec(`ALTER TABLE case_followups ADD COLUMN ${c} TEXT`);
      done.push(`case_followups.${c}`);
    }
  }
  if (!done.length) return;
  applied.push(`PR-S2: thêm ${done.join(', ')}. Dữ liệu cũ giữ nguyên.`);
}
```

- [x] **Step 5: Chạy.** Run: `npm test 2>&1 | grep -E "PR-S2|KIỂM TRA|KHÔNG ĐẠT"`. Expected: bốn phép `PR-S2 · Migrate` ✓, tổng **B + 4**.
  Nếu `preS2()` lỗi ở `DROP COLUMN` (câu CREATE bị cắt sai): kiểm lại chú thích hai cột cuối, không được có dấu phẩy.
- [x] **Step 6: Commit.**

```bash
git add server/src/schema.sql server/src/migrate.ts server/src/tests/dieuChinhPa.tests.ts server/src/tests/run.ts
git commit -m "PR-S2 (1): bảng lịch sử điều chỉnh PA + hai cột cập nhật tuần, migrate idempotent, file phép kiểm"
```

---

### Task 2: Luật dùng chung: quyết định Giữ / Điều chỉnh / Thay / Kết thúc

**Files:**
- Modify: `shared/domain/cases.ts:802-877` (khối `NEXT_STEPS` … `stepsForMode`)
- Test: `server/src/tests/dieuChinhPa.tests.ts`

**Interfaces:**
- Produces (export từ `@shared/domain/index.ts`):
  `PLAN_DECISIONS = ['keep','adjust','replace','end','ask_manager'] as const` · `type PlanDecision` ·
  `PLAN_DECISION_CHIPS: readonly PlanDecision[]` · `PLAN_DECISION_LABEL: Record<PlanDecision,string>` · `PLAN_DECISION_HINT: Record<PlanDecision,string>` ·
  `decisionToStep(d: PlanDecision): { mode: ResultMode; nextStep: NextStep }` · `decisionsFor(outcome: string): PlanDecision[]` ·
  `decisionBlockedReason(outcome: string, d: PlanDecision): string | null` · `decisionNeedsReason(d: string): boolean` ·
  `CONFIRM_EDIT_REASON: string` · `NextStep` thêm `'adjust'`.

- [x] **Step 1: Phép kiểm (đỏ).** Thêm vào file test, ngay trên dòng `// ---- các task sau …`:

```ts
  // ================================================================== 2. Luật quyết định (shared/domain)

  console.log('\nPR-S2 · 2. Quyết định của lần Ghi kết quả: Giữ nguyên · Điều chỉnh · Thay phương án · Kết thúc phương án');

  check('PR-S2 · S4: Chưa đủ dữ liệu được Giữ nguyên / Điều chỉnh / Thay nhưng không Kết thúc suông; kết quả tốt đủ năm lựa chọn; kết quả chưa tốt không Kết thúc suông', () => {
    const f = (o: string) => domain.decisionsFor(o).join(',');
    assert(f('insufficient') === 'keep,adjust,replace', `insufficient: ${f('insufficient')}`);
    assert(domain.endStepsFor('insufficient').join(',') === 'propose', 'Chưa đủ dữ liệu ở tab kết thúc chỉ được Thay');
    assert(!domain.canEndWithOutcome('insufficient'), 'canEndWithOutcome vẫn nghĩa là "kết thúc suông được không" — Chưa đủ dữ liệu thì không');
    assert(f('improved') === 'keep,adjust,replace,end,ask_manager', `improved: ${f('improved')}`);
    assert(f('partial') === 'keep,adjust,replace,end,ask_manager', `partial: ${f('partial')}`);
    assert(f('unchanged') === 'keep,adjust,replace,ask_manager', `unchanged: ${f('unchanged')}`);
    assert(f('worse') === 'keep,adjust,replace,ask_manager', `worse: ${f('worse')}`);
    assert(domain.decisionBlockedReason('worse', 'end') && domain.decisionBlockedReason('worse', 'replace') === null,
      'Kém hơn: Kết thúc phải bị chặn kèm lý do, Thay thì được');
    assert(domain.decisionBlockedReason('insufficient', 'replace') === null, 'Chưa đủ dữ liệu: Thay phải được chọn (Q2)');
    assert(/Chưa đủ dữ liệu/.test(domain.decisionBlockedReason('insufficient', 'end') ?? ''),
      'Chưa đủ dữ liệu: câu chặn Kết thúc phải nói rõ vì sao');
  });

  check('PR-S2 · S4: mỗi quyết định dịch về đúng một bước cũ; nhãn đủ, không mở đầu bằng "Hãy"; nhãn lịch sử theo chữ mới', () => {
    const m = (d: string) => { const r = domain.decisionToStep(d); return `${r.mode}/${r.nextStep}`; };
    assert(m('keep') === 'monitor/continue' && m('adjust') === 'monitor/adjust' && m('replace') === 'end/propose'
      && m('end') === 'end/complete' && m('ask_manager') === 'end/ask_manager', 'Bảng dịch quyết định → bước sai');
    for (const d of domain.PLAN_DECISIONS) {
      assert(domain.PLAN_DECISION_LABEL[d] && domain.PLAN_DECISION_HINT[d], `Quyết định ${d} thiếu nhãn hoặc lời giải thích`);
      assert(!/^Hãy/.test(domain.PLAN_DECISION_HINT[d]), `Lời giải thích ${d} mở đầu bằng "Hãy"`);
    }
    assert(domain.PLAN_DECISION_CHIPS.join(',') === 'keep,adjust,replace,end', 'Bốn nút chính phải đúng thứ tự nguồn §8');
    assert(domain.NEXT_STEP_LABEL.adjust === 'Điều chỉnh' && domain.NEXT_STEP_LABEL.continue === 'Giữ nguyên'
      && domain.NEXT_STEP_LABEL.propose === 'Thay phương án', `Nhãn bước: ${JSON.stringify(domain.NEXT_STEP_LABEL)}`);
    assert(domain.stepsForMode('monitor', 'unchanged').join(',') === 'continue,adjust', 'Theo dõi tiếp phải cho Giữ nguyên và Điều chỉnh');
    assert(domain.decisionNeedsReason('adjust') && domain.decisionNeedsReason('replace') && !domain.decisionNeedsReason('keep')
      && !domain.decisionNeedsReason('end'), 'Chỉ Điều chỉnh và Thay bắt lý do');
  });
```

- [x] **Step 2: Chạy, thấy đỏ.** Run: `npm test 2>&1 | grep -E "PR-S2 · S4|KHÔNG ĐẠT"`. Expected: hai phép mới ✗ (`decisionsFor is not a function`).

- [x] **Step 3: Sửa `shared/domain/cases.ts`.**

(a) Dòng 802: `export const NEXT_STEPS = ['complete', 'monitor', 'continue', 'adjust', 'propose', 'ask_manager'] as const;`

(b) `NEXT_STEP_LABEL` (803–809) thành:

```ts
export const NEXT_STEP_LABEL: Record<NextStep, string> = {
  complete: 'Kết thúc phương án',
  monitor: 'Theo dõi thêm',
  continue: 'Giữ nguyên',
  adjust: 'Điều chỉnh',
  propose: 'Thay phương án',
  ask_manager: 'Xin hỗ trợ từ Quản lý',
};
```

(c) `NEXT_STEP_HINT` (811–817): thêm dòng `adjust` và sửa `continue`, `propose`:

```ts
  continue: 'Giữ nguyên phương án, mở đợt mới để làm tiếp.',
  adjust: 'Cùng phương án, sửa mô tả, người thực hiện hoặc ngày dự kiến kết thúc. Bản cũ giữ trong lịch sử.',
  propose: 'Khép phương án cũ với lý do "Được thay thế" và mở phương án mới.',
```

(d) `endStepsFor` (865–869) và `stepsForMode` (872–874). `canEndWithOutcome` **giữ nguyên** (vẫn nghĩa là "kết thúc suông được không"):

```ts
/**
 * Các bước ở TAB KẾT THÚC. PR-S2 (Q2, planning review 22/09): "Chưa đủ dữ liệu" chỉ đi được bằng THAY (PA cũ Được thay thế, kết quả
 * cuối không xác định nên không vào thống kê và không vào F05). Kết thúc suông và Xin hỗ trợ từ Quản lý với Chưa đủ dữ liệu vẫn không cho.
 */
export function endStepsFor(outcome: string): NextStep[] {
  if (!canEndWithOutcome(outcome)) return ['propose'];
  return GOOD_OUTCOMES.includes(outcome)
    ? ['complete', 'propose', 'ask_manager']
    : ['propose', 'ask_manager'];
}

/** Bước tiếp theo hợp lệ theo tab đang đứng. */
export function stepsForMode(mode: string, outcome: string): NextStep[] {
  return mode === 'end' ? endStepsFor(outcome) : ['continue', 'adjust'];
}
```

(e) Ngay **sau** `stepsForMode`, thêm:

```ts

/**
 * QUYẾT ĐỊNH CỦA MỘT LẦN GHI KẾT QUẢ (PR-S2 · S4 · nguồn §8, rulebook §18.2 điểm 4).
 *
 * Giữ nguyên / Điều chỉnh / Thay là ba lựa chọn của nguồn; Kết thúc phương án giữ theo rulebook §5; Xin hỗ trợ từ Quản lý là
 * đường cũ, hiện thành nút chữ phụ. Mỗi quyết định dịch về đúng MỘT cặp (mode, nextStep) đã có, nên mọi luật của
 * `updateResult` vẫn kiểm như trước. Payload cũ `{ mode, nextStep }` vẫn nhận.
 */
export const PLAN_DECISIONS = ['keep', 'adjust', 'replace', 'end', 'ask_manager'] as const;
export type PlanDecision = (typeof PLAN_DECISIONS)[number];
/** Bốn nút chính, đúng thứ tự nguồn §8. `ask_manager` là nút chữ phụ. */
export const PLAN_DECISION_CHIPS: readonly PlanDecision[] = ['keep', 'adjust', 'replace', 'end'];
export const PLAN_DECISION_LABEL: Record<PlanDecision, string> = {
  keep: 'Giữ nguyên',
  adjust: 'Điều chỉnh',
  replace: 'Thay phương án',
  end: 'Kết thúc phương án',
  ask_manager: 'Xin hỗ trợ từ Quản lý',
};
export const PLAN_DECISION_HINT: Record<PlanDecision, string> = {
  keep: 'Phương án chạy tiếp như cũ. Lần cập nhật sau vào Chủ nhật kế tiếp.',
  adjust: 'Cùng phương án, sửa mô tả, người thực hiện hoặc ngày dự kiến kết thúc. Bản cũ giữ trong lịch sử.',
  replace: 'Khép phương án này (Được thay thế) và mở phương án mới. Đổi loại phương án thì chọn ở đây.',
  end: 'Khép phương án này. Case chỉ hoàn thành được khi mọi phương án đã khép.',
  ask_manager: 'Chuyển sang chờ Quản lý quyết định. Thời gian chờ tính cho Quản lý.',
};

export function decisionToStep(d: PlanDecision): { mode: ResultMode; nextStep: NextStep } {
  switch (d) {
    case 'keep': return { mode: 'monitor', nextStep: 'continue' };
    case 'adjust': return { mode: 'monitor', nextStep: 'adjust' };
    case 'replace': return { mode: 'end', nextStep: 'propose' };
    case 'end': return { mode: 'end', nextStep: 'complete' };
    case 'ask_manager': return { mode: 'end', nextStep: 'ask_manager' };
  }
}

/** Quyết định hợp lệ theo kết quả. Suy từ `endStepsFor`, không viết luật lần hai. */
export function decisionsFor(outcome: string): PlanDecision[] {
  const out: PlanDecision[] = ['keep', 'adjust'];
  const steps = endStepsFor(outcome);
  if (steps.includes('propose')) out.push('replace');
  if (steps.includes('complete')) out.push('end');
  if (steps.includes('ask_manager')) out.push('ask_manager');
  return out;
}

/** Vì sao một quyết định đang bị chặn với kết quả này (dùng cho `title` của nút mờ, G-7). `null` = được chọn. */
export function decisionBlockedReason(outcome: string, d: PlanDecision): string | null {
  if (decisionsFor(outcome).includes(d)) return null;
  if (!canEndWithOutcome(outcome)) return '"Chưa đủ dữ liệu" thì chưa kết thúc phương án được. Chọn Giữ nguyên, Điều chỉnh hoặc Thay phương án.';
  return 'Kết quả chưa tốt thì chưa khép suông được. Chọn Thay phương án hoặc Xin hỗ trợ từ Quản lý.';
}

/** Điều chỉnh và Thay bắt buộc ghi lý do (rulebook §18.2: "vì sao đổi"). */
export function decisionNeedsReason(d: string): boolean {
  return d === 'adjust' || d === 'replace';
}

/** Lý do mặc định khi GV sửa gợi ý tự động ngay lúc xác nhận mà không ghi lý do (PR-S2, Q7). */
export const CONFIRM_EDIT_REASON = 'Chỉnh khi xác nhận gợi ý tự động';
```

- [x] **Step 4: Chạy.** Run: `npm test 2>&1 | grep -E "PR-S2|\[11\]|KIỂM TRA|KHÔNG ĐẠT"`. Expected: hai phép mới ✓; phép cũ `[11] Nhãn…` ✓ (nó lặp
  `NEXT_STEPS` nên đòi `adjust` có đủ nhãn và lời giải thích). Tổng **B + 6**.
  Phép cũ `[9.1]` (~run.ts:2519) **có thể** chưa đỏ ở đây; nó đỏ ở Task 4 khi câu lỗi đổi.
- [x] **Step 5: Commit.** `git add shared/domain/cases.ts server/src/tests/dieuChinhPa.tests.ts` ·
  `git commit -m "PR-S2 (2): luật quyết định Giữ nguyên / Điều chỉnh / Thay / Kết thúc dùng chung"`

---

### Task 3: Mô-đun lịch sử điều chỉnh (`planRevisions.ts`)

**Files:**
- Create: `server/src/cases/planRevisions.ts`

**Interfaces:**
- Consumes: `db`, `badRequest`, `isIsoDate`, `nowIso`.
- Produces:
  - `type DieuChinhPA = { description: string; performerUserId: number | null; performerName: string | null; followupDue: string | null }`
  - `type BanDieuChinh = { id: number; on: string; source: 'adjust' | 'confirm_edit'; by: string | null; reason: string; before: MatPA; after: MatPA }`,
    trong đó `MatPA = { description: string | null; performer: string | null; followupDue: string | null }`
  - `chuanHoaDieuChinh(iv: any, input: DieuChinhVao | null | undefined, observedOn: string): DieuChinhPA`, ném `badRequest` nếu sai hoặc không đổi gì
  - `ghiBanDieuChinh(input: { iv: any; after: DieuChinhPA; source: 'adjust' | 'confirm_edit'; reason: string; on: string; actorUserId: number | null; followupId: number | null }): number`
  - `apDungDieuChinh(iv: any, patch: DieuChinhPA, ctx: { followupId: number; actorUserId: number | null; reason: string; on: string }): number`
  - `lichSuDieuChinhCuaCase(caseId: number): Map<number, BanDieuChinh[]>` (key = `intervention_id`, cũ trước mới sau)

Task này không có phép kiểm riêng. Hàm được kiểm qua `updateResult` ở Task 4 (đỏ trước, xanh sau).

- [x] **Step 1: Tạo file.**

```ts
import { db } from '../db.ts';
import { badRequest, isIsoDate, nowIso } from '../util.ts';

/**
 * LỊCH SỬ ĐIỀU CHỈNH PHƯƠNG ÁN HỌC THUẬT (PR-S2 · S2 · rulebook §18.2 điểm 2, nguồn §7).
 *
 * Trước PR-S2, sửa nội dung một PA là ghi đè, bản cũ mất hẳn. Nay mỗi lần sửa ghi MỘT dòng `case_intervention_revisions`:
 * bản cũ, bản mới, ngày, ai, vì sao. Hàng chính `case_interventions` luôn là BẢN HIỆN TẠI.
 *
 * Điều chỉnh KHÔNG đổi loại PA (đổi loại là Thay). Nhờ vậy thống kê theo loại PA (`effectiveness.ts`) không bao giờ gán kết quả
 * của loại này cho loại khác. PA vẫn là MỘT dòng nên vẫn chỉ đóng góp MỘT kết quả cuối.
 */

export type DieuChinhPA = {
  description: string; performerUserId: number | null; performerName: string | null; followupDue: string | null;
};
export type DieuChinhVao = {
  description?: string | null; performerUserId?: number | null; performerName?: string | null; followupDue?: string | null;
};
export type MatPA = { description: string | null; performer: string | null; followupDue: string | null };
export type BanDieuChinh = {
  id: number; on: string; source: 'adjust' | 'confirm_edit'; by: string | null; reason: string; before: MatPA; after: MatPA;
};

/**
 * Chuẩn hoá nội dung mới của một lần Điều chỉnh. Trường KHÔNG gửi (hoặc rỗng) = giữ nguyên bản hiện tại.
 * Ném lỗi khi mô tả quá ngắn, ngày sai, người không tồn tại, hoặc KHÔNG ĐỔI GÌ (không đổi gì thì là Giữ nguyên).
 */
export function chuanHoaDieuChinh(iv: any, input: DieuChinhVao | null | undefined, observedOn: string): DieuChinhPA {
  const a = input ?? {};
  const oldDesc = String(iv.description ?? '').trim();
  let description = oldDesc;
  if (typeof a.description === 'string' && a.description.trim() !== oldDesc) {
    description = a.description.trim();
    if (description.length < 8) throw badRequest('Mô tả ngắn phải nói rõ làm gì cho em, ít nhất 8 ký tự.');
  }
  let performerUserId: number | null = iv.performer_user_id ?? null;
  let performerName: string | null = iv.performer_name ?? null;
  if (a.performerUserId) {
    if (!db().prepare('SELECT 1 FROM users WHERE id = ?').get(a.performerUserId)) throw badRequest('Không tìm thấy người thực hiện.');
    performerUserId = Number(a.performerUserId);
    performerName = null;
  } else if (typeof a.performerName === 'string' && a.performerName.trim()) {
    performerUserId = null;
    performerName = a.performerName.trim();
  }
  let followupDue: string | null = iv.followup_due ?? null;
  if (a.followupDue) {
    if (!isIsoDate(a.followupDue)) throw badRequest('Ngày dự kiến kết thúc không hợp lệ.');
    if (a.followupDue < observedOn) throw badRequest('Ngày dự kiến kết thúc mới không được sớm hơn ngày cập nhật.');
    followupDue = a.followupDue;
  }
  const same = description === oldDesc
    && performerUserId === (iv.performer_user_id ?? null)
    && performerName === (iv.performer_name ?? null)
    && followupDue === (iv.followup_due ?? null);
  if (same) {
    throw badRequest('Điều chỉnh thì phải đổi ít nhất một thứ: mô tả, người thực hiện hoặc ngày dự kiến kết thúc. Không đổi gì thì chọn Giữ nguyên.');
  }
  return { description, performerUserId, performerName, followupDue };
}

/** Ghi MỘT dòng lịch sử. `iv` là dòng `case_interventions` ĐỌC TRƯỚC khi sửa (bản cũ). Trả id dòng vừa ghi. */
export function ghiBanDieuChinh(input: {
  iv: any; after: DieuChinhPA; source: 'adjust' | 'confirm_edit'; reason: string; on: string;
  actorUserId: number | null; followupId: number | null;
}): number {
  const { iv, after } = input;
  return Number(db()
    .prepare(
      `INSERT INTO case_intervention_revisions (intervention_id, case_id, followup_id, source,
          old_description, new_description, old_performer_user_id, old_performer_name, new_performer_user_id, new_performer_name,
          old_followup_due, new_followup_due, reason, effective_on, actor_user_id, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(iv.id, iv.case_id, input.followupId, input.source,
         iv.description ?? null, after.description, iv.performer_user_id ?? null, iv.performer_name ?? null,
         after.performerUserId, after.performerName, iv.followup_due ?? null, after.followupDue,
         input.reason, input.on, input.actorUserId, nowIso())
    .lastInsertRowid);
}

/** Điều chỉnh: đưa bản mới vào hàng chính rồi ghi lịch sử. Gọi TRONG giao dịch của `updateResult`. */
export function apDungDieuChinh(iv: any, patch: DieuChinhPA, ctx: {
  followupId: number; actorUserId: number | null; reason: string; on: string;
}): number {
  db()
    .prepare(
      `UPDATE case_interventions SET description = ?, performer_user_id = ?, performer_name = ?, followup_due = ?, updated_at = ?
        WHERE id = ?`,
    )
    .run(patch.description, patch.performerUserId, patch.performerName, patch.followupDue, nowIso(), iv.id);
  return ghiBanDieuChinh({
    iv, after: patch, source: 'adjust', reason: ctx.reason, on: ctx.on, actorUserId: ctx.actorUserId, followupId: ctx.followupId,
  });
}

/** Mọi bản điều chỉnh của một Case, gom theo PA, cũ trước mới sau. MỘT câu truy vấn cho cả Case. */
export function lichSuDieuChinhCuaCase(caseId: number): Map<number, BanDieuChinh[]> {
  const rows = db()
    .prepare(
      `SELECT r.*, a.full_name AS actor_name, ou.full_name AS old_perf_acc, nu.full_name AS new_perf_acc
         FROM case_intervention_revisions r
         LEFT JOIN users a ON a.id = r.actor_user_id
         LEFT JOIN users ou ON ou.id = r.old_performer_user_id
         LEFT JOIN users nu ON nu.id = r.new_performer_user_id
        WHERE r.case_id = ?
        ORDER BY r.effective_on, r.id`,
    )
    .all(caseId) as any[];
  const out = new Map<number, BanDieuChinh[]>();
  for (const r of rows) {
    const ban: BanDieuChinh = {
      id: r.id, on: r.effective_on, source: r.source, by: r.actor_name ?? null, reason: r.reason,
      before: { description: r.old_description ?? null, performer: r.old_perf_acc ?? r.old_performer_name ?? null, followupDue: r.old_followup_due ?? null },
      after: { description: r.new_description ?? null, performer: r.new_perf_acc ?? r.new_performer_name ?? null, followupDue: r.new_followup_due ?? null },
    };
    if (!out.has(r.intervention_id)) out.set(r.intervention_id, []);
    out.get(r.intervention_id)!.push(ban);
  }
  return out;
}
```

- [x] **Step 2: Build.** Run: `npm run build:server`. Expected: không lỗi.
- [x] **Step 3: Commit.** `git add server/src/cases/planRevisions.ts` · `git commit -m "PR-S2 (3): mô-đun lịch sử điều chỉnh PA"`

---

### Task 4: `updateResult` nhận quyết định: Giữ nguyên · Điều chỉnh · Thay (có lý do) · vấn đề còn tồn

**Files:**
- Modify: `server/src/cases/cases.ts:2583-2795` (`updateResult`), import đầu file (một dòng riêng)
- Modify: `server/src/tests/run.ts:2524`, `:2557`, `:8173` (ba phép kiểm cũ)
- Test: `server/src/tests/dieuChinhPa.tests.ts`

**Interfaces:**
- Consumes: `decisionToStep`, `PLAN_DECISIONS`, `type PlanDecision` (Task 2); `chuanHoaDieuChinh`, `apDungDieuChinh` (Task 3).
- Produces: `updateResult(p, interventionId, input)` nhận thêm
  `decision?: PlanDecision` · `remainingIssue?: string | null` · `decisionNote?: string | null` ·
  `adjust?: { description?; performerUserId?; performerName?; followupDue? } | null` · `newPlan.performerSelf?: boolean`.
  Ghi `case_followups.next_step = 'adjust'` cho Điều chỉnh. Chưa đủ dữ liệu + Thay được nhận (Q2). Câu lỗi mới: `"Chưa đủ dữ liệu" thì chưa kết thúc phương án được, chọn Giữ nguyên, Điều chỉnh hoặc Thay phương án.` ·
  `Điều chỉnh hoặc thay phương án thì phải ghi Lý do, ít nhất 8 ký tự.` · `Vấn đề còn tồn tối đa 300 ký tự.`

- [x] **Step 1: Phép kiểm (đỏ).** Thêm vào file test, ngay trên dòng `// ---- các task sau …`:

```ts
  // ================================================================== 3. Ghi kết quả với quyết định

  console.log('\nPR-S2 · 3. Ghi kết quả: Giữ nguyên · Điều chỉnh (có lịch sử) · Thay (có lý do) · vấn đề còn tồn');

  const ADJ_OK = { decision: 'adjust', outcome: 'insufficient', note: 'Tuần này chưa có bài nghe mới để nhìn',
    decisionNote: 'Em đi học thêm buổi tối nên đổi giờ', adjust: { description: 'Tự học Listening — nghe chép 15 phút buổi sáng' } };

  check('PR-S2 · S4: Giữ nguyên lưu kết quả · tiến triển · vấn đề còn tồn · ghi chú; PA chạy tiếp sang đợt 2, không sinh lịch sử điều chỉnh', () => {
    const { ivId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'keep', outcome: 'partial', note: 'Nghe số đã khá hơn, tên riêng còn sai',
      remainingIssue: 'Còn sai chính tả tên riêng', decisionNote: 'Tuần sau thêm bài Section 2',
    });
    const f = lastFollow(ivId);
    const iv = ivRow(ivId);
    assert(f.next_step === 'continue' && f.outcome === 'partial', `Lần cập nhật sai: ${JSON.stringify(f)}`);
    assert(f.remaining_issue === 'Còn sai chính tả tên riêng' && f.decision_note === 'Tuần sau thêm bài Section 2',
      `Vấn đề còn tồn / ghi chú không lưu: ${JSON.stringify(f)}`);
    assert(iv.status === 'started' && iv.cycle_no === 2, `PA phải chạy tiếp ở đợt 2: ${iv.status} / ${iv.cycle_no}`);
    assert(revRows(ivId).length === 0, 'Giữ nguyên không được sinh dòng lịch sử điều chỉnh');
  });

  check('PR-S2 · S4: vấn đề còn tồn tối đa 300 ký tự; bỏ trống thì lưu NULL', () => {
    const { ivId } = taoCase();
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, {
      decision: 'keep', outcome: 'partial', note: 'Nghe số đã khá hơn nhiều', remainingIssue: 'x'.repeat(301),
    }), /300 ký tự/, 'Vấn đề còn tồn dài hơn 300 ký tự');
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'partial', note: 'Nghe số đã khá hơn nhiều', remainingIssue: '   ' });
    assert(lastFollow(ivId).remaining_issue === null, 'Vấn đề còn tồn chỉ có khoảng trắng phải lưu NULL');
  });

  check('PR-S2 · S2: Điều chỉnh bắt buộc lý do, phải đổi ít nhất một thứ; mô tả ngắn hoặc ngày lùi về trước bị từ chối; từ chối thì không để lại gì', () => {
    const { ivId } = taoCase();
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, { ...ADJ_OK, decisionNote: '' }), /Lý do/, 'Điều chỉnh không có lý do');
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, { ...ADJ_OK, adjust: {} }), /ít nhất một thứ/, 'Điều chỉnh mà không đổi gì');
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, { ...ADJ_OK, adjust: { description: 'ngắn' } }), /ít nhất 8 ký tự/, 'Mô tả mới quá ngắn');
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, { ...ADJ_OK, adjust: { followupDue: addDays(TODAY, -1) } }),
      /sớm hơn ngày cập nhật/, 'Ngày dự kiến kết thúc lùi về trước ngày cập nhật');
    assert(ivRow(ivId).cycle_no === 1 && !lastFollow(ivId) && revRows(ivId).length === 0, 'Lần bị từ chối không được để lại gì');
  });

  check('PR-S2 · S2: Điều chỉnh hai lần: đọc lại được cả hai bản cũ, ngày, người, lý do; PA vẫn là MỘT, loại không đổi', () => {
    const { ivId, caseId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      ...ADJ_OK, outcome: 'unchanged', note: 'Nghe chép chưa đều, em bỏ hai buổi',
      adjust: { kind: 'tutor', description: 'Tự học Listening — nghe chép 15 phút buổi sáng' },
    });
    cases.updateResult(P.mbManager, ivId, {
      decision: 'adjust', outcome: 'partial', note: 'Buổi sáng em làm đều hơn hẳn', decisionNote: 'Tăng thời lượng vì em theo kịp',
      adjust: { description: 'Tự học Listening — nghe chép 25 phút buổi sáng', followupDue: addDays(TODAY, 21), performerName: 'Trợ giảng Mai' },
    });
    const iv = ivRow(ivId);
    const revs = revRows(ivId);
    assert(iv.kind === 'self_study', `Điều chỉnh không được đổi loại PA: ${iv.kind}`);
    assert(iv.description === 'Tự học Listening — nghe chép 25 phút buổi sáng' && iv.performer_name === 'Trợ giảng Mai'
      && iv.performer_user_id === null && iv.followup_due === addDays(TODAY, 21), `Bản hiện tại sai: ${JSON.stringify(iv)}`);
    assert(revs.length === 2, `Phải có 2 dòng lịch sử, có ${revs.length}`);
    assert(revs[0].old_description === 'Tự học Listening — nghe chép 15 phút mỗi ngày'
      && revs[0].new_description === 'Tự học Listening — nghe chép 15 phút buổi sáng', `Bản 1 sai: ${JSON.stringify(revs[0])}`);
    assert(revs[1].old_description === revs[0].new_description && revs[1].old_performer_user_id === P.lrTeacher.userId
      && revs[1].new_performer_name === 'Trợ giảng Mai' && revs[1].new_performer_user_id === null, `Bản 2 sai: ${JSON.stringify(revs[1])}`);
    assert(revs[0].reason === 'Em đi học thêm buổi tối nên đổi giờ' && revs[0].actor_user_id === P.lrTeacher.userId
      && revs[1].actor_user_id === P.mbManager.userId, 'Lý do / người điều chỉnh sai');
    assert(revs.every((r) => r.source === 'adjust' && r.effective_on === TODAY && r.followup_id && r.case_id === caseId),
      `Nguồn / ngày / lần cập nhật / Case sai: ${JSON.stringify(revs)}`);
    assert(iv.cycle_no === 3 && iv.status === 'started', `Mỗi lần điều chỉnh mở một đợt mới: ${iv.cycle_no} / ${iv.status}`);
    const n = (conn.prepare('SELECT COUNT(*) n FROM case_interventions WHERE case_id = ?').get(caseId) as any).n;
    assert(n === 1, `Điều chỉnh không được sinh PA mới: ${n}`);
    assert(lastFollow(ivId).next_step === 'adjust', 'Lần cập nhật phải ghi bước "adjust"');
  });

  check('PR-S2 · S2: PA đã kết thúc hoặc đang chờ Quản lý duyệt thì không điều chỉnh được', () => {
    const a = taoCase();
    cases.updateResult(P.lrTeacher, a.ivId, { decision: 'end', outcome: 'improved', note: 'Em nghe số và tên riêng đúng hết' });
    assertThrows(() => cases.updateResult(P.lrTeacher, a.ivId, ADJ_OK), /đã kết thúc/, 'Điều chỉnh PA đã kết thúc');
    const b = taoCase();
    cases.updateResult(P.lrTeacher, b.ivId, { decision: 'ask_manager', outcome: 'unchanged', note: 'Tự học không đủ, cần Quản lý xếp tutor' });
    assertThrows(() => cases.updateResult(P.lrTeacher, b.ivId, ADJ_OK), /chờ Quản lý duyệt/, 'Điều chỉnh PA đang chờ duyệt');
    assert(revRows(a.ivId).length === 0 && revRows(b.ivId).length === 0, 'Bị từ chối mà vẫn có dòng lịch sử');
  });

  check('PR-S2 · S2: GV khác môn không điều chỉnh được PA Listening (C02), cùng quyền với Ghi kết quả', () => {
    const { ivId } = taoCase();
    assertThrows(() => cases.updateResult(P.sTeacher, ivId, ADJ_OK), /không có quyền/, 'GV Speaking điều chỉnh PA Listening');
    assert(revRows(ivId).length === 0, 'Bị từ chối mà vẫn có dòng lịch sử');
  });

  check('PR-S2 · S4: Chưa đủ dữ liệu không Kết thúc suông và không Xin hỗ trợ từ Quản lý được (Thay thì được, xem phép kiểm Task 7)', () => {
    const { ivId } = taoCase();
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, {
      decision: 'end', outcome: 'insufficient', note: 'Chưa có bài nghe mới để nhìn',
    }), /Giữ nguyên, Điều chỉnh hoặc Thay/, 'Kết thúc suông khi Chưa đủ dữ liệu');
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, {
      decision: 'ask_manager', outcome: 'insufficient', note: 'Chưa có bài nghe mới để nhìn',
    }), /Giữ nguyên, Điều chỉnh hoặc Thay/, 'Xin hỗ trợ từ Quản lý khi Chưa đủ dữ liệu');
    assert(ivRow(ivId).status === 'started' && !lastFollow(ivId), 'Bị từ chối mà PA đổi trạng thái hoặc có lần cập nhật');
  });

  check('PR-S2 · S4: Thay bắt lý do; thay xong PA cũ Được thay thế, nối sang PA mới, người thực hiện khai rõ', () => {
    const { ivId, caseId } = taoCase();
    const newPlan = { kind: 'tutor', description: 'Tutor Listening hai buổi mỗi tuần đến MT2', performerSelf: true };
    assertThrows(() => cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'worse', note: 'Em sai nhiều hơn tuần trước', newPlan,
    }), /Lý do/, 'Thay không có lý do');
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'worse', note: 'Em sai nhiều hơn tuần trước',
      decisionNote: 'Tự học không hiệu quả, chuyển sang tutor', newPlan,
    });
    const old = ivRow(ivId);
    const moi = conn.prepare('SELECT * FROM case_interventions WHERE case_id = ? AND id != ?').get(caseId, ivId) as any;
    assert(moi, 'Không có PA mới');
    assert(old.status === 'completed' && old.closed_reason === 'superseded' && old.superseded_by === moi.id && old.completed_date === TODAY,
      `PA cũ phải Được thay thế và nối sang PA mới: ${JSON.stringify(old)}`);
    assert(moi.kind === 'tutor' && moi.performer_user_id === P.lrTeacher.userId && moi.status === 'started',
      `PA mới sai (người thực hiện khai bằng performerSelf): ${JSON.stringify(moi)}`);
    const f = lastFollow(ivId);
    assert(f.next_step === 'propose' && f.outcome === 'worse' && f.decision_note === 'Tự học không hiệu quả, chuyển sang tutor',
      `Lý do thay phải nằm ở lần cập nhật: ${JSON.stringify(f)}`);
    assert(revRows(ivId).length === 0, 'Thay không ghi vào lịch sử điều chỉnh, nó là chuỗi Được thay thế');
  });
```

- [x] **Step 2: Chạy, thấy đỏ.** Run: `npm test 2>&1 | grep -E "PR-S2 · S[24]|KHÔNG ĐẠT"`. Expected: tám phép mới ✗
  (ví dụ Giữ nguyên: `remaining_issue` NULL; Điều chỉnh: không có lỗi "Lý do"; Thay: `Cần ghi ai là người thực hiện` hoặc không có lỗi "Lý do").

- [x] **Step 3: Sửa `cases.ts`.**

(a) Import, **một dòng riêng** ngay dưới dòng `import { NOT_UNCONFIRMED_PRESET, sosCaseState } from './sosState.ts';` (~27). Không sửa khối import lớn đầu file:

```ts
import { PLAN_DECISIONS, decisionToStep, type PlanDecision } from '../../../shared/domain/index.ts';
import { apDungDieuChinh, chuanHoaDieuChinh, lichSuDieuChinhCuaCase } from './planRevisions.ts';
```

(b) Chữ ký `updateResult` (~2583–2603): thêm vào kiểu `input`, ngay trước `/** Người thực hiện chu kỳ vừa rồi … */`:

```ts
  /**
   * PR-S2 (S4): quyết định của lần cập nhật: keep | adjust | replace | end | ask_manager. Có thì thay cho cặp `mode`/`nextStep`
   * (dịch bằng `decisionToStep`). Payload cũ không có `decision` giữ nguyên ý nghĩa.
   */
  decision?: string;
  /** PR-S2 (S4): vấn đề còn tồn. Tuỳ chọn, tối đa 300 ký tự. */
  remainingIssue?: string | null;
  /** PR-S2: lý do (bắt buộc khi Điều chỉnh hoặc Thay) hoặc ghi chú (tuỳ chọn). */
  decisionNote?: string | null;
  /** PR-S2 (S2): nội dung mới khi Điều chỉnh. Trường không gửi = giữ nguyên. Không có `kind`: đổi loại là Thay. */
  adjust?: { description?: string | null; performerUserId?: number | null; performerName?: string | null; followupDue?: string | null } | null;
```

và trong kiểu `newPlan` thêm `performerSelf?: boolean;` (Q13).

(c) Thay khối `const mode = …` (~2626–2627) bằng:

```ts
  /*
   * PR-S2 (S4): `decision` là cách gọi mới, dịch về ĐÚNG cặp `mode`/`nextStep` mà mọi luật bên dưới đã kiểm.
   */
  let modeIn = input.mode;
  let stepIn = input.nextStep;
  if (input.decision !== undefined) {
    if (!(PLAN_DECISIONS as readonly string[]).includes(input.decision)) throw badRequest('Quyết định không hợp lệ.');
    ({ mode: modeIn, nextStep: stepIn } = decisionToStep(input.decision as PlanDecision));
  }
  const mode = modeIn && (RESULT_MODES as readonly string[]).includes(modeIn)
    ? modeIn : 'monitor';
```

(d) Dòng `let nextStep = mode === 'end' ? (input.nextStep ?? '') : 'continue';` (~2648) thành:

```ts
  let nextStep = mode === 'end' ? (stepIn ?? '') : (stepIn === 'adjust' ? 'adjust' : 'continue');
```

(e) Trong `if (mode === 'end') {` (~2651–2656): điều kiện chặn Chưa đủ dữ liệu cho **Thay** đi qua (Q2), và câu lỗi mới:

```ts
    /* PR-S2 (Q2): Chưa đủ dữ liệu vẫn không Kết thúc suông, nhưng THAY được (`endStepsFor('insufficient')` = ['propose']). */
    if (!canEndWithOutcome(input.outcome) && nextStep !== 'propose') {
      throw badRequest('"Chưa đủ dữ liệu" thì chưa kết thúc phương án được, chọn Giữ nguyên, Điều chỉnh hoặc Thay phương án.');
    }
```

  Phần còn lại của khối (`const allowed = stepsForMode('end', input.outcome)` …) giữ nguyên. Với Chưa đủ dữ liệu, mọi bước khác `propose`
  (kể cả `complete`, `ask_manager`) bị chặn ngay ở câu trên; `allowed` = `['propose']` là lớp chặn thứ hai.

(f) Ngay **sau** khối `if (mode === 'end') { … }` (kết thúc ~2667) và **trước** `const metrics = normalizeMetrics(…)`:

```ts
  /*
   * PR-S2: VÌ SAO ĐỔI là điều luật bắt buộc audit (rulebook §18.2 điểm 2). Điều chỉnh và Thay phải có lý do.
   * Kiểm SAU các lỗi của `mode === 'end'` để câu "phương án mới là gì" vẫn báo trước (phép kiểm [9.1]).
   */
  const decisionNote = (input.decisionNote ?? '').trim() || null;
  if ((nextStep === 'adjust' || nextStep === 'propose') && (decisionNote ?? '').length < 8) {
    throw badRequest('Điều chỉnh hoặc thay phương án thì phải ghi Lý do, ít nhất 8 ký tự.');
  }
  const remainingIssue = (input.remainingIssue ?? '').trim() || null;
  if (remainingIssue && remainingIssue.length > 300) throw badRequest('Vấn đề còn tồn tối đa 300 ký tự.');
  /* Điều chỉnh: chuẩn hoá TRƯỚC giao dịch; sai thì không ghi gì. */
  const adjustPatch = nextStep === 'adjust' ? chuanHoaDieuChinh(iv, input.adjust, observedOn) : null;
```

(g) Câu `INSERT INTO case_followups` trong giao dịch (~2678–2687) thành:

```ts
    const fInfo = conn
      .prepare(
        `INSERT INTO case_followups (case_id, intervention_id, observed_on, observer_user_id,
                                     outcome, note, evidence_attempt_id,
                                     next_step, cycle_no, cycle_due, late, metrics,
                                     remaining_issue, decision_note, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(iv.case_id, interventionId, observedOn, p.userId,
           input.outcome, note, input.evidenceAttemptId ?? null,
           nextStep, cycleNo, cycleDue, late, metrics ? JSON.stringify(metrics) : null,
           remainingIssue, decisionNote, nowIso());
```

(h) Nhánh `else if (nextStep === 'monitor' || nextStep === 'continue') {` (~2705) thành
`else if (nextStep === 'monitor' || nextStep === 'continue' || nextStep === 'adjust') {`. Ở **cuối** nhánh đó, sau câu `.run(cycleNo + 1, …)`, thêm:

```ts
      /* PR-S2 (S2): Điều chỉnh = cùng PA, đợt mới như Giữ nguyên, rồi đưa bản mới vào và ghi MỘT dòng lịch sử (bản cũ là `iv`). */
      if (nextStep === 'adjust') {
        apDungDieuChinh(iv, adjustPatch!, { followupId, actorUserId: p.userId, reason: decisionNote!, on: observedOn });
      }
```

(i) Nhánh `propose` (~2735–2741): trong lời gọi `recordIntervention(p, iv.case_id, { … })` thêm dòng
`performerSelf: input.newPlan!.performerSelf ?? false,` ngay trên `performerUserId: …`.

(j) `addJourney` cuối hàm (~2775–2786): trong mảng `detail`, ngay sau `note || null,`, thêm hai dòng. Chữ "Lý do" chỉ dùng khi `nextStep` là
`adjust` hoặc `propose`; các trường hợp khác ghi "Ghi chú":

```ts
        decisionNote ? `${nextStep === 'adjust' || nextStep === 'propose' ? 'Lý do' : 'Ghi chú'}: ${decisionNote}` : null,
        remainingIssue ? `Còn tồn: ${remainingIssue}` : null,
```

(k) `writeAudit` cuối hàm: `after: { outcome: input.outcome, mode, nextStep, late: !!late, cycleNo, remainingIssue, decisionNote, adjust: adjustPatch }`.

- [x] **Step 4: Chạy.** Run: `npm test 2>&1 | grep -E "PR-S2|\[9.1\]|PR-F|KIỂM TRA|KHÔNG ĐẠT"`. Expected: tám phép mới ✓. Ba phép cũ **có thể đỏ**:
  `[9.1] Hai tab cập nhật kết quả…` (câu lỗi đổi, và Thay thiếu lý do), và một phép `PR-F` ở ~8173 (Thay thiếu lý do). Sửa ở Step 5.
- [x] **Step 5: Sửa ba phép kiểm cũ bị luật mới thay** (`server/src/tests/run.ts`):
  - ~2524: `/Tiếp tục theo dõi/` → `/Giữ nguyên, Điều chỉnh hoặc Thay/`.
  - ~2557 (`mode: 'end', outcome: 'worse', nextStep: 'propose', note: 'Tự học không ăn thua với em này',`): thêm
    `decisionNote: 'Tự học không ăn thua nên chuyển sang tutor',` ngay sau `note`. Đổi chú thích ~2555 "Đề xuất phương án mới" → "Thay phương án".
  - ~8173 (`nextStep: 'propose',` trong `prfEnd(… 'worse' …)`): thêm `decisionNote: 'Kém hơn nên thay bằng ôn có bấm giờ (rate)',`.
  Chạy lại: Expected: tất cả ✓, tổng **B + 14**.
- [x] **Step 6: Commit.**

```bash
git add server/src/cases/cases.ts server/src/tests/dieuChinhPa.tests.ts server/src/tests/run.ts
git commit -m "PR-S2 (4): Ghi kết quả nhận quyết định Giữ/Điều chỉnh/Thay, điều chỉnh có lịch sử, thay bắt lý do, vấn đề còn tồn"
```

---

### Task 5: Đọc lịch sử: chi tiết Case và bảng kỹ năng (nguồn dữ liệu của Hành trình)

**Files:**
- Modify: `server/src/cases/cases.ts:1406-1477` (`caseDetail`: `interventions`, `followups`), `:2316-2372` (**thân** `caseCardOf`: sau câu `follows`, khối `plans`)
- Test: `server/src/tests/dieuChinhPa.tests.ts`

**Interfaces:**
- Consumes: `lichSuDieuChinhCuaCase` (Task 3).
- Produces:
  - `caseDetail(...).interventions[i].revisions: BanDieuChinh[]`
  - `caseDetail(...).followups[i].remainingIssue: string | null`, `.decisionNote: string | null`
  - `skillSupportBoard(...).rows[r].cases[c].plans[k]` thêm `closedReason: string | null`, `supersededBy: number | null`, `revisions: BanDieuChinh[]`;
    `updates[u]` thêm `decision: string | null` (giá trị `next_step`), `remainingIssue: string | null`, `decisionNote: string | null`.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 4. Đọc lịch sử

  console.log('\nPR-S2 · 4. Đọc lịch sử: chi tiết Case và bảng kỹ năng (nguồn của Hành trình)');

  check('PR-S2 · Đọc: chi tiết Case trả lịch sử điều chỉnh từng PA, và vấn đề còn tồn / lý do từng lần cập nhật', () => {
    const { ivId, caseId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'adjust', outcome: 'partial', note: 'Đã khá hơn ở phần nghe số', remainingIssue: 'Tên riêng',
      decisionNote: 'Chuyển sang nghe buổi sáng', adjust: { description: 'Tự học Listening — nghe chép buổi sáng 20 phút' },
    });
    const d = cases.caseDetail(P.lrTeacher, caseId) as any;
    const iv = d.interventions.find((x: any) => x.id === ivId);
    assert(iv.revisions?.length === 1, `Phải có 1 bản điều chỉnh: ${JSON.stringify(iv.revisions)}`);
    const r = iv.revisions[0];
    assert(r.on === TODAY && r.reason === 'Chuyển sang nghe buổi sáng' && r.source === 'adjust' && r.by, `Bản điều chỉnh sai: ${JSON.stringify(r)}`);
    assert(r.before.description === 'Tự học Listening — nghe chép 15 phút mỗi ngày'
      && r.after.description === 'Tự học Listening — nghe chép buổi sáng 20 phút', 'Bản cũ / bản mới sai');
    assert(r.before.performer && r.before.performer === r.after.performer, 'Người thực hiện không đổi phải đọc ra cùng một tên');
    const f = d.followups.find((x: any) => x.interventionId === ivId);
    assert(f.remainingIssue === 'Tên riêng' && f.decisionNote === 'Chuyển sang nghe buổi sáng' && f.nextStep === 'adjust',
      `Lần cập nhật sai: ${JSON.stringify(f)}`);
  });

  check('PR-S2 · Đọc: bảng kỹ năng trả lịch sử điều chỉnh, chuỗi Được thay thế và quyết định từng lần cập nhật (đủ cho PR-Qb vẽ khối PA nối nhau)', () => {
    const { sid, ivId, caseId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'adjust', outcome: 'insufficient', note: 'Chưa có bài nghe mới để nhìn', decisionNote: 'Em đổi lịch nên học buổi sáng',
      adjust: { description: 'Tự học Listening — nghe chép buổi sáng' },
    });
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'unchanged', note: 'Hai tuần vẫn sai như cũ', decisionNote: 'Tự học không đủ, chuyển sang tutor',
      newPlan: { kind: 'tutor', description: 'Tutor Listening hai buổi mỗi tuần', performerSelf: true },
    });
    const board = cases.skillSupportBoard(P.lrTeacher, sid) as any;
    const card = board.rows.flatMap((r: any) => r.cases).find((c: any) => c.id === caseId);
    assert(card, 'Không thấy thẻ Case trên bảng kỹ năng');
    const old = card.plans.find((p: any) => p.id === ivId);
    const moi = card.plans.find((p: any) => p.id !== ivId);
    assert(old && moi, 'Bảng kỹ năng phải có cả PA cũ (đã thay) và PA mới');
    assert(old.closedReason === 'superseded' && old.supersededBy === moi.id, `Chuỗi thay sai: ${old.closedReason} / ${old.supersededBy}`);
    assert(old.revisions.length === 1 && old.revisions[0].after.description === 'Tự học Listening — nghe chép buổi sáng', 'Lịch sử điều chỉnh sai');
    assert(old.updates.map((u: any) => u.decision).join(',') === 'adjust,propose', `Quyết định từng lần: ${JSON.stringify(old.updates)}`);
    assert(old.updates[1].decisionNote === 'Tự học không đủ, chuyển sang tutor', 'Lý do thay phải đọc được từ bảng kỹ năng');
    assert(moi.revisions.length === 0 && moi.closedReason === null && moi.supersededBy === null, 'PA mới không được mang lịch sử của PA cũ');
  });
```

Lưu ý: `old.updates` chỉ gồm lần cập nhật **có kết quả** (`f.outcome`). Cả hai lần ở đây đều có kết quả (kể cả `insufficient`), nên đủ 2.

- [x] **Step 2: Chạy, thấy đỏ.** Expected: hai phép mới ✗ (`iv.revisions` undefined).

- [x] **Step 3: `caseDetail`.** Ngay **trên** `const interventions = (conn` (~1406):

```ts
  /* PR-S2 (S2): lịch sử điều chỉnh của mọi PA trong Case, một truy vấn. */
  const revs = lichSuDieuChinhCuaCase(caseId);
```

Trong `.map((iv) => ({ … }))` của `interventions`, thêm sau `approvalAt: …`:

```ts
      /** PR-S2 (S2): mỗi lần sửa nội dung PA, cũ trước mới sau. Hàng chính luôn là bản hiện tại. */
      revisions: revs.get(iv.id) ?? [],
```

Trong `.map((f) => ({ … }))` của `followups` (~1471–1477), thêm sau `metrics: …`:

```ts
      /* PR-S2 (S4): vấn đề còn tồn, và lý do (Điều chỉnh/Thay) hoặc ghi chú của quyết định. */
      remainingIssue: (f.remaining_issue ?? null) as string | null,
      decisionNote: (f.decision_note ?? null) as string | null,
```

- [x] **Step 4: Thân `caseCardOf`.** **Không** sửa dòng khai báo hàm, **không** sửa khối `attachmentCount` (vùng PR-AN).
  Ngay sau câu `const follows = conn … .all(caseId) as any[];` (~2323), thêm:

```ts
  /* PR-S2 (S2): lịch sử điều chỉnh, một truy vấn cho cả Case (gộp nhiều Case: xem plan PR-S2 Q18). */
  const revs = lichSuDieuChinhCuaCase(caseId);
```

Trong object của `plans` (~2328–2371), thêm ngay sau `approvalDue: …`:

```ts
      /*
       * PR-S2: KHÉP LẠI VÌ SAO và PA NÀO THAY NÓ. `superseded` = Được thay thế; `supersededBy` trỏ PA mới.
       * Hành trình (PR-Qb) nối các khối PA theo đúng chuỗi này.
       */
      closedReason: (iv.closed_reason ?? null) as string | null,
      supersededBy: (iv.superseded_by ?? null) as number | null,
      /** PR-S2 (S2): mỗi lần sửa nội dung PA: bản cũ, bản mới, ngày, ai, vì sao. Cũ trước mới sau. */
      revisions: revs.get(iv.id) ?? [],
```

Trong `.map((f) => ({ … }))` của `updates` (~2362–2370), thêm sau `late: !!f.late,`:

```ts
          /* PR-S2 (S4): quyết định của lần đó (continue | adjust | propose | complete | ask_manager | monitor), vấn đề còn tồn, lý do/ghi chú. */
          decision: (f.next_step as string | null) ?? null,
          remainingIssue: (f.remaining_issue as string | null) ?? null,
          decisionNote: (f.decision_note as string | null) ?? null,
```

- [x] **Step 5: Chạy.** Expected: hai phép mới ✓; phép cũ `PR-HV · Q8` (`hoSoHocVien.tests.ts`) vẫn ✓. Tổng **B + 16**.
- [x] **Step 6: Commit.** `git add server/src/cases/cases.ts server/src/tests/dieuChinhPa.tests.ts` ·
  `git commit -m "PR-S2 (5): chi tiết Case và bảng kỹ năng trả lịch sử điều chỉnh, chuỗi Được thay thế, quyết định từng lần"`

---

### Task 6: Sửa gợi ý lúc xác nhận có lịch sử; "Ghi đã làm" thôi ghi đè mô tả

**Files:**
- Modify: `server/src/cases/sosAuto.ts:184-219` (`confirmPresetPlan`), import đầu file
- Modify: `server/src/routes/index.ts:1186-1192` (chỉ khối `/interventions/:id/confirm`)
- Modify: `server/src/cases/cases.ts:1059-1068` (`completeIntervention`, câu UPDATE)
- Test: `server/src/tests/dieuChinhPa.tests.ts`

**Interfaces:**
- Consumes: `ghiBanDieuChinh` (Task 3), `CONFIRM_EDIT_REASON` (Task 2).
- Produces: `confirmPresetPlan(p, id, patch: { description?; followupDue?; reason?: string | null })`; route nhận `reason` trong body.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 5. Gợi ý tự động và "Ghi đã làm"

  console.log('\nPR-S2 · 5. Sửa gợi ý lúc xác nhận có lịch sử; "Ghi đã làm" không ghi đè mô tả');

  check('PR-S2 · S2: Sửa gợi ý tự động lúc xác nhận ghi MỘT dòng lịch sử (bản gợi ý → bản đã sửa); xác nhận nguyên văn thì không', () => {
    const goiY = (caseId: number) => Number(conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, status, preset, followup_due, created_at)
       VALUES (?, 'self_study', 'Tự học 1 tháng', 'planned', 1, ?, ?)`,
    ).run(caseId, addDays(TODAY, 30), NOW).lastInsertRowid);
    const a = goiY(taoCase().caseId);
    const b = goiY(taoCase().caseId);
    const c = goiY(taoCase().caseId);
    sosAuto.confirmPresetPlan(P.lrTeacher, a, { description: 'Tự học 1 tháng — nghe chép Section 2 mỗi ngày' });
    sosAuto.confirmPresetPlan(P.lrTeacher, b);
    sosAuto.confirmPresetPlan(P.lrTeacher, c, { followupDue: addDays(TODAY, 40), reason: 'Em thi muộn hơn nên kéo dài' });
    const ra = revRows(a);
    assert(ra.length === 1 && ra[0].source === 'confirm_edit' && ra[0].followup_id === null
      && ra[0].old_description === 'Tự học 1 tháng' && ra[0].new_description === 'Tự học 1 tháng — nghe chép Section 2 mỗi ngày'
      && ra[0].reason === domain.CONFIRM_EDIT_REASON, `Sửa lúc xác nhận ghi sai: ${JSON.stringify(ra)}`);
    assert(revRows(b).length === 0, 'Xác nhận nguyên văn không được sinh lịch sử');
    const rc = revRows(c);
    assert(rc.length === 1 && rc[0].old_followup_due === addDays(TODAY, 30) && rc[0].new_followup_due === addDays(TODAY, 40)
      && rc[0].reason === 'Em thi muộn hơn nên kéo dài', `Đổi ngày lúc xác nhận ghi sai: ${JSON.stringify(rc)}`);
  });

  check('PR-S2 · S2: "Ghi đã làm" kèm ghi chú không còn ghi đè mô tả phương án (cases.ts completeIntervention)', () => {
    const { ivId } = taoCase();
    cases.completeIntervention(P.lrTeacher, ivId, { doneOn: TODAY, note: 'Đã làm đủ bảy buổi', performerSelf: true });
    assert(ivRow(ivId).description === 'Tự học Listening — nghe chép 15 phút mỗi ngày', `Mô tả bị ghi đè: ${ivRow(ivId).description}`);
  });
```

- [x] **Step 2: Chạy, thấy đỏ.** Expected: hai phép mới ✗.

- [x] **Step 3: `sosAuto.ts`.** Thêm import (một dòng riêng dưới các import có sẵn):

```ts
import { ghiBanDieuChinh } from './planRevisions.ts';
```

và thêm `CONFIRM_EDIT_REASON` vào khối import `'../../../shared/domain/index.ts'` đang có của file (nếu khối đó khó sửa thì thêm một dòng import riêng:
`import { CONFIRM_EDIT_REASON } from '../../../shared/domain/index.ts';`).

Chữ ký: `patch: { description?: string | null; followupDue?: string | null; reason?: string | null } = {}`.
Trong `tx(() => { … })`, ngay **sau** câu `UPDATE case_interventions … WHERE id = ?` (~203), thêm:

```ts
    /*
     * PR-S2 (S2, Q7): GỢI Ý TỰ ĐỘNG là "phương án ban đầu" (nguồn §7). Sửa nó lúc xác nhận thì giữ bản gợi ý trong lịch sử.
     * Xác nhận nguyên văn thì không có gì để ghi.
     */
    if (description !== iv.description || followupDue !== (iv.followup_due ?? null)) {
      ghiBanDieuChinh({
        iv, source: 'confirm_edit', on: today, actorUserId: p.userId, followupId: null,
        reason: (patch.reason ?? '').trim() || CONFIRM_EDIT_REASON,
        after: { description, performerUserId: iv.performer_user_id ?? null, performerName: iv.performer_name ?? null, followupDue },
      });
    }
```

- [x] **Step 4: Route.** `server/src/routes/index.ts`, khối `api.post('/interventions/:id/confirm', …)` (~1186–1192). Trong object truyền cho
  `confirmPresetPlan`, thêm sau `followupDue: …`:

```ts
    reason: typeof b.reason === 'string' ? b.reason : undefined,
```

- [x] **Step 5: `completeIntervention`** (`cases.ts` ~1059–1068). Xoá dòng `description = COALESCE(NULLIF(?, ''), description),` trong câu UPDATE,
  và xoá tham số `input.note ?? '',` tương ứng trong `.run(…)`. Thêm chú thích một dòng ngay trên `conn`:

```ts
    /* PR-S2 (S2): ghi chú KHÔNG ghi đè mô tả PA nữa (trước đây là ghi đè mất dấu). Ghi chú nằm ở hành trình và audit bên dưới. */
```

- [x] **Step 6: Chạy.** Expected: hai phép mới ✓; các phép `PR-T` (`sosV3.tests.ts`) về xác nhận và thay gợi ý vẫn ✓. Tổng **B + 18**.
- [x] **Step 7: Commit.** `git add server/src/cases/sosAuto.ts server/src/routes/index.ts server/src/cases/cases.ts server/src/tests/dieuChinhPa.tests.ts` ·
  `git commit -m "PR-S2 (6): sửa gợi ý lúc xác nhận ghi lịch sử; Ghi đã làm không ghi đè mô tả"`

---

### Task 7: Khoá luật thống kê hiệu quả; PA bị thay khi chưa đủ dữ liệu không vào F05

**Files:**
- Modify: `server/src/cases/effectiveness.ts:297` (một dòng trong `plansNeedingEvaluation`)
- Test: `server/src/tests/dieuChinhPa.tests.ts`

**Interfaces:**
- Consumes: `effectiveness.planOutcomes({ studentIds })` (mỗi phần tử `{ id, kind, outcome, group, supersededBy }`), `improvementRate({ studentIds })` → `{ n, N, … }`,
  `plansNeedingEvaluation({ studentIds })` → `{ count, ids }` (có sẵn).

- [x] **Step 1: Phép kiểm.** Hai phép đầu **dự kiến xanh ngay** (khoá hành vi, Q9); nếu đỏ thì 🛑: luật thống kê đã lệch, báo lại chứ không tự sửa. Phép thứ ba (Q2) đỏ trước khi sửa.

```ts
  // ================================================================== 6. Thống kê hiệu quả

  console.log('\nPR-S2 · 6. Thống kê hiệu quả: PA có kết quả thật thì tính, một PA một kết quả cuối');

  check('PR-S2 · Thống kê: Giữ nguyên + Điều chỉnh + Kết thúc là MỘT PA với MỘT kết quả cuối, đúng loại ban đầu', () => {
    const { sid, ivId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, { decision: 'keep', outcome: 'unchanged', note: 'Tuần đầu em chưa quen cách nghe chép' });
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'adjust', outcome: 'partial', note: 'Buổi sáng em làm đều hơn', decisionNote: 'Đổi sang buổi sáng cho hợp lịch',
      adjust: { description: 'Tự học Listening — nghe chép buổi sáng 20 phút' },
    });
    cases.updateResult(P.lrTeacher, ivId, { decision: 'end', outcome: 'improved', note: 'Em nghe số và tên riêng đúng hết' });
    const rows = effectiveness.planOutcomes({ studentIds: [sid] }) as any[];
    assert(rows.length === 1 && rows[0].id === ivId && rows[0].kind === 'self_study' && rows[0].outcome === 'improved'
      && rows[0].group === 'success', `Phải là đúng MỘT PA tự học, Tiến bộ rõ: ${JSON.stringify(rows)}`);
  });

  check('PR-S2 · Thống kê: Thay thì PA cũ tính với kết quả của lần thay (PA bị thay vẫn tính); PA mới chưa kết thúc thì chưa tính', () => {
    const { sid, ivId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'worse', note: 'Em sai nhiều hơn tuần trước', decisionNote: 'Tự học không hiệu quả, chuyển sang tutor',
      newPlan: { kind: 'tutor', description: 'Tutor Listening hai buổi mỗi tuần', performerSelf: true },
    });
    const rows = effectiveness.planOutcomes({ studentIds: [sid] }) as any[];
    assert(rows.length === 1 && rows[0].id === ivId && rows[0].group === 'failure' && rows[0].supersededBy === true,
      `Chỉ PA cũ được tính, là Không cải thiện, cờ Được thay thế: ${JSON.stringify(rows)}`);
  });

  check('PR-S2 · Thống kê: Thay khi chưa đủ dữ liệu — PA cũ không vào thống kê hiệu quả (không vào mẫu số) và không vào "PA cần bổ sung đánh giá" (F05)', () => {
    const { sid, ivId, caseId } = taoCase();
    cases.updateResult(P.lrTeacher, ivId, {
      decision: 'replace', outcome: 'insufficient', note: 'Tuần đầu em không làm bài nào',
      decisionNote: 'Em không tự học được, chuyển ngay sang tutor',
      newPlan: { kind: 'tutor', description: 'Tutor Listening hai buổi mỗi tuần', performerSelf: true },
    });
    const old = ivRow(ivId);
    const moi = conn.prepare('SELECT id FROM case_interventions WHERE case_id = ? AND id != ?').get(caseId, ivId) as any;
    assert(old.status === 'completed' && old.closed_reason === 'superseded' && old.superseded_by === moi?.id,
      `PA cũ phải Được thay thế: ${JSON.stringify(old)}`);
    assert(lastFollow(ivId).outcome === 'insufficient' && lastFollow(ivId).decision_note === 'Em không tự học được, chuyển ngay sang tutor',
      'Kết quả cuối phải là Chưa đủ dữ liệu, lý do lưu ở lần cập nhật');
    const rate = effectiveness.improvementRate({ studentIds: [sid] });
    assert(rate.N === 0 && rate.n === 0, `PA chưa đủ dữ liệu không được vào mẫu số: ${JSON.stringify(rate)}`);
    const need = effectiveness.plansNeedingEvaluation({ studentIds: [sid] });
    assert(need.count === 0 && !need.ids.includes(ivId), `PA đã bị thay không được nằm trong F05: ${JSON.stringify(need)}`);
  });
```

- [x] **Step 2: Chạy.** Expected: hai phép đầu ✓ (khoá hành vi). Phép thứ ba **✗** ở dòng F05 (`need.count === 1`): `plansNeedingEvaluation` hiện đếm mọi PA
  không xác định, kể cả PA đã bị thay. (Nếu nó đỏ ở chỗ khác, ví dụ `rate.N`, thì 🛑 báo lại.)
- [x] **Step 3: Sửa `server/src/cases/effectiveness.ts` — đúng MỘT dòng** trong `plansNeedingEvaluation` (~297):

```ts
  /*
   * PR-S2 (Q2, planning review 22/09): PA ĐÃ BỊ THAY với kết quả "Chưa đủ dữ liệu" không ai bổ sung đánh giá được nữa — nó đã khép
   * để nhường cho PA mới. Không đưa vào danh sách cần bổ sung; nó vẫn ngoài bảng và ngoài mẫu số như mọi kết quả không xác định (D03).
   */
  const all = planOutcomes(scope).filter((r) => r.group === 'undetermined' && !r.supersededBy);
```

  Không sửa gì khác trong file (ma trận §5.2: file này của Pb ở đợt 4).
- [x] **Step 4: Chạy.** Expected: ba phép ✓; các phép cũ `PR-F · F05` (run.ts, grep `F05`) vẫn ✓. Tổng **B + 21**.
- [x] **Step 5: Commit.** `git add server/src/cases/effectiveness.ts server/src/tests/dieuChinhPa.tests.ts` ·
  `git commit -m "PR-S2 (7): khoá luật thống kê khi Giữ / Điều chỉnh / Thay; PA bị thay khi chưa đủ dữ liệu không vào F05"`

---

### Task 8: Giao diện: một form Ghi kết quả chung (5 mục) cho hồ sơ học viên và ngăn Case

**Files:**
- Create: `web/src/modules/cases/CapNhatTuan.tsx`
- Modify: `web/src/modules/cases/SkillBoard.tsx:9` (import), `:633-762` (`InlineResult` → xoá), `:477-603` (`KhoiPhuongAn`, chỗ gọi `InlineResult` ~594–597)
- Modify: `web/src/modules/cases/CasePanel.tsx:12-20` (import), `:1073-1280` (`ResultDialog`)

**Interfaces:**
- Consumes: `PLAN_DECISION_CHIPS`, `PLAN_DECISION_LABEL`, `PLAN_DECISION_HINT`, `decisionsFor`, `decisionBlockedReason`, `decisionNeedsReason`, `type PlanDecision`
  (Task 2); route `POST /interventions/:id/result` (Task 4).
- Produces:
  - `export type PaCanCapNhat = { id: number; kind: string; description: string | null; performer: string | null; followupDue: string | null; actionDue: string | null; cycleNo?: number | null }`
  - `export function CapNhatTuanForm(props: { pa: PaCanCapNhat; onCancel: () => void; onSaved: () => void })`
  - `export type BanDieuChinh` (cùng hình với máy chủ, Task 3) · `export function LichSuDieuChinh(props: { revisions: BanDieuChinh[] })` (Task 9 dùng)
  - `ResultDialog({ iv, onClose, onDone })` giữ tên và vẫn export (bỏ prop `startMode`).

**Vị trí trên màn** (bộ nhớ "Mockup luôn kèm vị trí"):
(1) **Hồ sơ học viên** › khối kỹ năng › thẻ Case › dòng PA › cột "Việc tiếp theo" › nút **Ghi kết quả**: form mở **ngay dưới dòng PA** (như `InlineResult` hiện nay).
(2) **Ngăn Case** (mở từ Việc cần làm hoặc từ hồ sơ) › khối PA trong dòng thời gian › nút **Ghi kết quả**: form trong hộp thoại "Ghi kết quả".
Không có lối vào nào khác (G-12).

- [x] **Step 1: Tạo `CapNhatTuan.tsx`.**

```tsx
import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { useToast } from '../../ui/Toast.tsx';
import { fmtDate } from '../../lib/format.ts';
import {
  FOLLOWUP_OUTCOMES, INTERVENTION_KIND_LABEL, OUTCOME_MARK,
  PLAN_DECISION_CHIPS, PLAN_DECISION_HINT, PLAN_DECISION_LABEL,
  RESCHEDULE_TARGETS, RESCHEDULE_TARGET_LABEL,
  decisionBlockedReason, decisionNeedsReason, decisionsFor, interventionKindsFor, outcomeLabelFor,
  type PlanDecision,
} from '@shared/domain/index.ts';

/**
 * GHI KẾT QUẢ, CẬP NHẬT TUẦN RÚT GỌN (PR-S2 · S4 · nguồn §8). MỘT form cho hai chỗ: dòng PA ở hồ sơ học viên (`SkillBoard`)
 * và hộp thoại ở ngăn Case (`CasePanel`).
 *
 * Năm mục đúng thứ tự nguồn: kết quả hiện tại · tiến triển · vấn đề còn tồn · quyết định · ghi chú. Điều chỉnh và Thay bắt
 * lý do (ô thứ năm đổi tên thành "Lý do…"). Ràng buộc nói TRƯỚC khi bấm (nút mờ + câu thiếu gì), máy chủ vẫn kiểm lại.
 */

export type PaCanCapNhat = {
  id: number; kind: string; description: string | null; performer: string | null;
  followupDue: string | null; actionDue: string | null; cycleNo?: number | null;
};

const NUT_LUU: Record<PlanDecision, string> = {
  keep: 'Ghi kết quả, tiếp tục theo dõi',
  adjust: 'Lưu điều chỉnh',
  replace: 'Thay phương án',
  end: 'Kết thúc phương án',
  ask_manager: 'Gửi Quản lý',
};
const DA_LUU: Record<PlanDecision, string> = {
  keep: 'Đã ghi kết quả, phương án vẫn đang chạy',
  adjust: 'Đã điều chỉnh phương án, bản cũ giữ trong lịch sử',
  replace: 'Đã thay phương án',
  end: 'Đã kết thúc phương án',
  ask_manager: 'Đã chuyển sang chờ Quản lý',
};

export function CapNhatTuanForm({ pa, onCancel, onSaved }: {
  pa: PaCanCapNhat; onCancel: () => void; onSaved: () => void;
}) {
  const { session } = useSession();
  const toast = useToast();
  const today = session?.demoDate ?? '';
  const [outcome, setOutcome] = useState('');
  const [progress, setProgress] = useState('');
  const [remaining, setRemaining] = useState('');
  const [decision, setDecision] = useState<PlanDecision | ''>('');
  const [reason, setReason] = useState('');
  const [on, setOn] = useState(today);
  const [endOn, setEndOn] = useState(today);
  /* Điều chỉnh: mặc định là bản hiện tại. */
  const [desc, setDesc] = useState(pa.description ?? '');
  const [performer, setPerformer] = useState('');
  const [due, setDue] = useState(pa.followupDue ?? '');
  /* Thay */
  const kinds = interventionKindsFor();
  const [newKind, setNewKind] = useState<string>(kinds.selfServe[0]);
  const [newDesc, setNewDesc] = useState('');
  const [newPerformer, setNewPerformer] = useState('');
  const [newTarget, setNewTarget] = useState<string>(RESCHEDULE_TARGETS[0]);
  const [busy, setBusy] = useState(false);

  const allowed = outcome ? decisionsFor(outcome) : [];
  const pickOutcome = (o: string) => {
    setOutcome(o);
    if (decision && !decisionsFor(o).includes(decision)) setDecision('');
  };
  const needReason = !!decision && decisionNeedsReason(decision);
  const descChanged = desc.trim() !== (pa.description ?? '').trim();
  const dueChanged = !!due && due !== (pa.followupDue ?? '');
  const adjustChanged = descChanged || performer.trim() !== '' || dueChanged;

  const missing =
    !outcome ? 'Chọn kết quả hiện tại.'
    : progress.trim().length < 8 ? 'Tiến triển cần ít nhất 8 ký tự.'
    : !decision ? 'Chọn quyết định.'
    : decision === 'adjust' && !adjustChanged ? 'Điều chỉnh thì phải đổi ít nhất một thứ. Không đổi gì thì chọn Giữ nguyên.'
    : decision === 'adjust' && descChanged && desc.trim().length < 8 ? 'Mô tả cần ít nhất 8 ký tự.'
    : decision === 'replace' && newDesc.trim().length < 8 ? 'Mô tả phương án mới cần ít nhất 8 ký tự.'
    : needReason && reason.trim().length < 8 ? 'Lý do cần ít nhất 8 ký tự.'
    : null;

  const save = async () => {
    if (missing || !decision) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        decision, outcome, note: progress, observedOn: on || undefined,
        remainingIssue: remaining.trim() || undefined, decisionNote: reason.trim() || undefined,
      };
      if (decision === 'end') body.completedOn = endOn || undefined;
      if (decision === 'adjust') {
        body.adjust = {
          description: descChanged ? desc : undefined,
          performerName: performer.trim() || undefined,
          followupDue: dueChanged ? due : undefined,
        };
      }
      if (decision === 'replace') {
        body.newPlan = {
          kind: newKind, description: newDesc,
          /* Để trống = chính người đang ghi. Khai rõ bằng `performerSelf`, máy chủ không tự suy (Q13). */
          performerSelf: !newPerformer.trim(), performerName: newPerformer.trim() || undefined,
          rescheduleTarget: newKind === 'reschedule_mt' ? newTarget : null,
        };
      }
      await api.post(`/interventions/${pa.id}/result`, body);
      invalidate('/cases'); invalidate('/my-work'); invalidate('/students'); invalidate('/overview');
      toast.push('ok', DA_LUU[decision]);
      onSaved();
    } catch (e: any) {
      toast.push('error', e?.message ?? 'Không lưu được');
    } finally { setBusy(false); }
  };

  const nhan = (text: string, phu?: string) => (
    <span className="block text-[11px] text-slate-400 mb-1">
      {text}{phu && <span className="text-slate-500"> ({phu})</span>}
    </span>
  );

  return (
    <div className="rounded-lg p-2.5 space-y-2.5" style={{ background: 'var(--surface-1)' }}>
      <p className="text-[11px] text-slate-500 m-0">
        {INTERVENTION_KIND_LABEL[pa.kind as keyof typeof INTERVENTION_KIND_LABEL] ?? pa.kind}
        {pa.cycleNo && pa.cycleNo > 1 ? ` · Đợt ${pa.cycleNo}` : ''}
        {pa.actionDue ? ` · hạn cập nhật ${fmtDate(pa.actionDue)}` : ''}
      </p>

      <div>
        {nhan('1. Kết quả hiện tại')}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kết quả hiện tại">
          {FOLLOWUP_OUTCOMES.map((o) => (
            <button key={o} type="button" aria-pressed={outcome === o}
              className={`btn btn-sm ${outcome === o ? 'btn-primary' : ''}`} onClick={() => pickOutcome(o)}>
              {OUTCOME_MARK[o] ?? ''} {outcomeLabelFor(o)}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        {nhan('2. Tiến triển')}
        <textarea className="field w-full" rows={2} value={progress} onChange={(e) => setProgress(e.target.value)}
          placeholder="Tiến bộ ở đâu, còn kẹt chỗ nào" />
      </label>

      <label className="block">
        {nhan('3. Vấn đề còn tồn', 'không bắt buộc')}
        <input className="field w-full" maxLength={300} value={remaining} onChange={(e) => setRemaining(e.target.value)}
          placeholder="Ví dụ: còn sai dạng T/F/NG" />
      </label>

      <div>
        {nhan('4. Quyết định')}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quyết định">
          {PLAN_DECISION_CHIPS.map((d) => {
            const blocked = outcome ? decisionBlockedReason(outcome, d) : 'Chọn kết quả trước.';
            return (
              <button key={d} type="button" aria-pressed={decision === d} disabled={!!blocked}
                title={blocked ?? PLAN_DECISION_HINT[d]}
                className={`btn btn-sm ${decision === d ? 'btn-primary' : ''}`} onClick={() => setDecision(d)}>
                {PLAN_DECISION_LABEL[d]}
              </button>
            );
          })}
        </div>
        {allowed.includes('ask_manager') && (
          <button type="button" aria-pressed={decision === 'ask_manager'} title={PLAN_DECISION_HINT.ask_manager}
            className={`btn btn-sm mt-1.5 ${decision === 'ask_manager' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDecision('ask_manager')}>
            {PLAN_DECISION_LABEL.ask_manager}
          </button>
        )}
      </div>

      {decision === 'adjust' && (
        <div className="rounded-lg p-2 space-y-2 border" style={{ borderColor: 'var(--line)' }}>
          <label className="block">
            {nhan('Mô tả phương án')}
            <textarea className="field w-full" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </label>
          <label className="block">
            {nhan('Người thực hiện mới', `để trống nếu không đổi · hiện: ${pa.performer ?? 'chưa có'}`)}
            <input className="field w-full" value={performer} onChange={(e) => setPerformer(e.target.value)} />
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
            Dự kiến kết thúc
            <input type="date" className="field" style={{ width: '9.5rem' }} value={due} min={on || undefined}
              onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
      )}

      {decision === 'replace' && (
        <div className="rounded-lg p-2 space-y-2 border" style={{ borderColor: 'var(--line)' }}>
          <label className="block">
            {nhan('Phương án mới')}
            <select className="field w-full" value={newKind} onChange={(e) => setNewKind(e.target.value)}>
              <optgroup label="Bạn tự làm được">
                {kinds.selfServe.map((k) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k] ?? k}</option>)}
              </optgroup>
              <optgroup label="Cần Quản lý duyệt">
                {kinds.proposals.map((k) => <option key={k} value={k}>{INTERVENTION_KIND_LABEL[k] ?? k}</option>)}
              </optgroup>
            </select>
          </label>
          {newKind === 'reschedule_mt' && (
            <label className="block">
              {nhan('Lùi cái gì')}
              <select className="field w-full" value={newTarget} onChange={(e) => setNewTarget(e.target.value)}>
                {RESCHEDULE_TARGETS.map((t) => <option key={t} value={t}>{RESCHEDULE_TARGET_LABEL[t]}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            {nhan('Mô tả')}
            <input className="field w-full" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Làm gì, bao nhiêu buổi, đến khi nào" />
          </label>
          <label className="block">
            {nhan('Người thực hiện', 'để trống = bạn')}
            <input className="field w-full" value={newPerformer} onChange={(e) => setNewPerformer(e.target.value)} />
          </label>
        </div>
      )}

      <label className="block">
        {nhan(`5. ${decision === 'adjust' ? 'Lý do điều chỉnh' : decision === 'replace' ? 'Lý do thay' : 'Ghi chú'}`,
          needReason ? undefined : 'không bắt buộc')}
        <input className="field w-full" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
            Ngày cập nhật
            <input type="date" className="field" style={{ width: '9.5rem' }} value={on} max={today}
              onChange={(e) => setOn(e.target.value)} />
          </label>
          {decision === 'end' && (
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
              Ngày kết thúc
              <input type="date" className="field" style={{ width: '9.5rem' }} value={endOn} max={today}
                onChange={(e) => setEndOn(e.target.value)} />
            </label>
          )}
        </span>
        <span className="flex gap-1.5">
          <button type="button" className="btn btn-sm" onClick={onCancel} disabled={busy}>Huỷ</button>
          <button type="button" className="btn btn-sm btn-primary" disabled={busy || !!missing}
            title={missing ?? undefined} onClick={save}>
            {busy ? 'Đang lưu…' : NUT_LUU[decision || 'keep']}
          </button>
        </span>
      </div>
      {missing && <p className="text-[11px] text-slate-500 m-0">{missing}</p>}
    </div>
  );
}

/** Một lần sửa nội dung PA, cùng hình với máy chủ (`server/src/cases/planRevisions.ts`). */
export type BanDieuChinh = {
  id: number; on: string; source: 'adjust' | 'confirm_edit'; by: string | null; reason: string;
  before: { description: string | null; performer: string | null; followupDue: string | null };
  after: { description: string | null; performer: string | null; followupDue: string | null };
};

/**
 * LỊCH SỬ ĐIỀU CHỈNH của một PA, mới nhất lên trên. Chỉ hiện trường ĐÃ ĐỔI. Dùng trong phần mở ▸ của dòng PA và trong ngăn Case
 * (G-3: dòng PA chỉ có một dòng phụ, chi tiết để ở đây).
 */
export function LichSuDieuChinh({ revisions }: { revisions: BanDieuChinh[] }) {
  if (!revisions.length) return null;
  const ngay = (d: string | null) => (d ? fmtDate(d) : 'chưa đặt');
  return (
    <ol className="list-none p-0 m-0 space-y-1.5">
      {[...revisions].reverse().map((r) => (
        <li key={r.id} className="pl-2.5 border-l text-xs" style={{ borderColor: 'var(--line)' }}>
          <span className="block text-[11px] text-slate-500 tabular-nums">
            {fmtDate(r.on)} · Điều chỉnh{r.source === 'confirm_edit' ? ' khi xác nhận gợi ý' : ''}{r.by ? ` · ${r.by}` : ''}
          </span>
          <span className="block text-slate-300">Lý do: {r.reason}</span>
          {r.before.description !== r.after.description && (
            <span className="block text-slate-400 break-words">Trước: “{r.before.description ?? ''}”</span>
          )}
          {r.before.performer !== r.after.performer && (
            <span className="block text-slate-400">Người thực hiện: {r.before.performer ?? 'chưa có'} → {r.after.performer ?? 'chưa có'}</span>
          )}
          {r.before.followupDue !== r.after.followupDue && (
            <span className="block text-slate-400">Dự kiến kết thúc: {ngay(r.before.followupDue)} → {ngay(r.after.followupDue)}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
```

Ghi chú: bản **hiện tại** của mô tả là tên PA hiển thị ngay trên dòng PA, nên lịch sử chỉ ghi "Trước: …". Muốn xem chuỗi đủ thì đọc từ dưới lên.

- [x] **Step 2: `SkillBoard.tsx`.**
  - Dòng 9: `import { ActionDialog, OutcomeDialog } from './CasePanel.tsx';` và thêm
    `import { CapNhatTuanForm, LichSuDieuChinh, type BanDieuChinh } from './CapNhatTuan.tsx';`
  - Trong `KhoiPhuongAn`, khối `{editing && ( <InlineResult … /> )}` (~594–597) thay bằng:

```tsx
      {editing && (
        <div className="mt-2">
          <CapNhatTuanForm
            pa={{ id: p.id, kind: p.kind, description: p.name, performer: p.performer,
                  followupDue: p.followupDue, actionDue: p.actionDue }}
            onCancel={() => setEditing(false)}
            onSaved={() => { setEditing(false); onChanged?.(); }} />
        </div>
      )}
```

  - Xoá cả hàm `InlineResult` và khối chú thích ngay trên nó (~617–762).
  - Xoá import không còn dùng: `FOLLOWUP_OUTCOMES`, `canEndWithOutcome`, `outcomeLabelFor` nếu không còn chỗ dùng; `useSession`, `useToast`, `api`,
    `invalidate` nếu không còn chỗ dùng (kiểm bằng `grep -n "useSession\|useToast\|api\.\|invalidate(\|outcomeLabelFor\|FOLLOWUP_OUTCOMES\|canEndWithOutcome" web/src/modules/cases/SkillBoard.tsx`).
  - `LichSuDieuChinh` và kiểu `BanDieuChinh` chưa dùng ở bước này, Task 9 mới dùng. Dự án không bật `noUnusedLocals`, nên import chưa dùng
    không làm hỏng typecheck. Để nguyên.

- [x] **Step 3: `CasePanel.tsx`.** Thay toàn bộ hàm `ResultDialog` (~1073–1280) bằng:

```tsx
/**
 * GHI KẾT QUẢ Ở NGĂN CASE (PR-S2): vỏ hộp thoại bọc đúng form của dòng PA ở hồ sơ học viên (`CapNhatTuanForm`).
 * Một form cho hai chỗ, để hai nơi không bao giờ hỏi khác nhau.
 */
export function ResultDialog({ iv, onClose, onDone }: {
  iv: any | null; onClose: () => void; onDone: () => void;
}) {
  return (
    <Modal open={iv !== null} onClose={onClose} width="max-w-lg" title="Ghi kết quả">
      {iv && (
        <CapNhatTuanForm
          pa={{ id: iv.id, kind: iv.kind, description: iv.description ?? null, performer: iv.performer ?? null,
                followupDue: iv.followupDue ?? null, actionDue: iv.actionDue ?? null, cycleNo: iv.cycleNo ?? null }}
          onCancel={onClose}
          onSaved={() => { onDone(); onClose(); }} />
      )}
    </Modal>
  );
}
```

  Thêm import: `import { CapNhatTuanForm, LichSuDieuChinh, type BanDieuChinh } from './CapNhatTuan.tsx';`.
  Trong khối import `@shared/domain/index.ts` (12–20) bỏ những tên chỉ `ResultDialog` cũ dùng: `NEXT_STEP_HINT`, `RESULT_MODES`, `RESULT_MODE_LABEL`,
  `canEndWithOutcome`, `stepsForMode`, `type NextStep`. Giữ `RESCHEDULE_TARGETS`, `RESCHEDULE_TARGET_LABEL`, `interventionKindsFor`, `FOLLOWUP_OUTCOMES`,
  `SectionNote`… **nếu** `ActionDialog`/`OutcomeDialog` còn dùng (grep từng tên trước khi xoá).

- [x] **Step 4: Kiểm kiểu và bộ phép kiểm.** Run: `npm run typecheck` rồi `npm test 2>&1 | tail -3`. Expected: typecheck sạch; **B + 21** ✓
  (phép quét chữ `PR-H` và `hoSoHocVien` vẫn xanh).
- [x] **Step 5: Commit.** `git add web/src/modules/cases/CapNhatTuan.tsx web/src/modules/cases/SkillBoard.tsx web/src/modules/cases/CasePanel.tsx` ·
  `git commit -m "PR-S2 (8): một form Ghi kết quả 5 mục (Giữ/Điều chỉnh/Thay/Kết thúc) cho hồ sơ học viên và ngăn Case"`

---

### Task 9: Giao diện: hiện lịch sử gọn (G-3)

**Files:**
- Modify: `web/src/modules/cases/SkillBoard.tsx:30-47` (kiểu `Plan`), `:477-603` (`KhoiPhuongAn`)
- Modify: `web/src/modules/cases/CasePanel.tsx:497-590` (`InterventionBody`)

**Interfaces:**
- Consumes: dữ liệu Task 5; `LichSuDieuChinh`, `BanDieuChinh` (Task 8); `NEXT_STEP_LABEL` (Task 2).

**Vị trí và hình dạng:**
- **Hồ sơ học viên › thẻ Case › dòng PA**, dòng phụ dưới tên PA (đang là `người · từ dd/mm → dd/mm`): thêm **một** đuôi ngắn
  `· điều chỉnh {n} lần` (khi có) hoặc `· được thay` (khi `closedReason = 'superseded'`). Tổng ≤ ~60 ký tự. Không thêm dòng mới.
- **Bấm ▸ ở dòng PA** (phần lịch sử đang có): đầu danh sách là `LichSuDieuChinh`. Mỗi lần cập nhật hiện thêm `→ {quyết định}`, và nếu có thì thêm
  một dòng nhỏ `Còn tồn: …` và một dòng `Lý do: …` / `Ghi chú: …`. PA bị thay có dòng `dd/mm · Được thay bằng: {tên PA mới}`; PA mới có dòng
  cuối `Thay cho: {tên PA cũ}`.
- **Ngăn Case › khối PA**: dưới mô tả có một dòng `Thay cho: …` hoặc `Được thay bằng: …` (khi có); `<details>` thu gọn "Đã điều chỉnh {n} lần" chứa
  `LichSuDieuChinh`; mỗi khối cập nhật thêm `Còn tồn: …` và `Lý do/Ghi chú: …`. "chu kỳ {n}" → "Đợt {n}". Nút "Cập nhật kết quả" → **"Ghi kết quả"**.

- [x] **Step 1: Kiểu `Plan` ở `SkillBoard.tsx`.** Thêm vào type `Plan` (sau `lastNote`):

```ts
  /** PR-S2: khép lại vì sao (`superseded` = Được thay thế) và PA nào thay nó. */
  closedReason: string | null; supersededBy: number | null;
  /** PR-S2 (S2): mỗi lần sửa nội dung PA, cũ trước mới sau. */
  revisions: BanDieuChinh[];
```

  và trong phần tử `updates` thêm `decision: string | null; remainingIssue: string | null; decisionNote: string | null;`.

- [x] **Step 2: `KhoiPhuongAn` nhận danh sách PA của thẻ** để đọc tên PA thay/bị thay. Tìm chỗ gọi `<KhoiPhuongAn p={…} canEdit={…} onChanged={…} />`
  trong `TheCase` (grep `KhoiPhuongAn p=`), thêm prop `plans={c.plans}`. Chữ ký:
  `function KhoiPhuongAn({ p, plans, canEdit, onChanged }: { p: Plan; plans: Plan[]; canEdit: boolean; onChanged?: () => void; })`.
  Trong thân, trên `return`:

```tsx
  const thayBang = p.supersededBy ? plans.find((x) => x.id === p.supersededBy) ?? null : null;
  const thayCho = plans.find((x) => x.supersededBy === p.id) ?? null;
```

- [x] **Step 3: Dòng phụ.** Trong `<span className="block text-[11px] text-slate-500 mt-0.5">` (dòng người thực hiện), sau `{p.completedOn && …}` thêm:

```tsx
              {p.closedReason === 'superseded'
                ? <> · được thay</>
                : p.revisions.length > 0 && <> · điều chỉnh {p.revisions.length} lần</>}
```

- [x] **Step 4: Phần mở ▸.** Trong `<ol id={historyId} …>`:
  - Dòng **đầu** (trước `{p.completedOn && !running && …}`):

```tsx
          {thayBang && (
            <li className="text-[11px] text-slate-400">
              {p.completedOn ? `${fmtDate(p.completedOn)} · ` : ''}Được thay bằng: {thayBang.name}
            </li>
          )}
          {p.revisions.length > 0 && <li><LichSuDieuChinh revisions={p.revisions} /></li>}
```

  - Trong mỗi `updates.map((u, i) => …)`, sau `{u.by && <span> · {u.by} ghi</span>}` thêm
    `{u.decision && NEXT_STEP_LABEL[u.decision as keyof typeof NEXT_STEP_LABEL] && <span> · → {NEXT_STEP_LABEL[u.decision as keyof typeof NEXT_STEP_LABEL]}</span>}`;
    đổi `` ` · chu kỳ ${u.cycleNo}` `` thành `` ` · Đợt ${u.cycleNo}` ``; sau dòng câu trích `u.note` thêm:

```tsx
              {u.remainingIssue && <span className="block text-[11px] text-slate-400 mt-0.5">Còn tồn: {u.remainingIssue}</span>}
              {u.decisionNote && (
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  {u.decision === 'adjust' || u.decision === 'propose' ? 'Lý do' : 'Ghi chú'}: {u.decisionNote}
                </span>
              )}
```

  - Dòng **cuối** (sau `{p.startedOn && …bắt đầu thực hiện…}`):
    `{thayCho && <li className="text-[11px] text-slate-500">Thay cho: {thayCho.name}</li>}`
  - Import `NEXT_STEP_LABEL` từ `@shared/domain/index.ts` (thêm vào khối import 11–13).

- [x] **Step 5: `CasePanel.tsx › InterventionBody`.** Trên `return (`:

```tsx
  const all: any[] = data.interventions ?? [];
  const tenPA = (x: any) => x.description || INTERVENTION_KIND_LABEL[x.kind as keyof typeof INTERVENTION_KIND_LABEL] || x.kind;
  const thayBang = iv.supersededBy ? all.find((x) => x.id === iv.supersededBy) ?? null : null;
  const thayCho = all.find((x) => x.supersededBy === iv.id) ?? null;
  const revisions: BanDieuChinh[] = iv.revisions ?? [];
```

  Ngay sau đoạn `{iv.description && <p …>{iv.description}</p>}`:

```tsx
      {(thayCho || thayBang) && (
        <p className="text-[11px] text-slate-500 mt-0.5 mb-0">
          {thayCho ? `Thay cho: ${tenPA(thayCho)}` : `Được thay bằng: ${tenPA(thayBang)}`}
        </p>
      )}
      {revisions.length > 0 && (
        <details className="mt-1">
          <summary className="text-[11px] text-slate-400 cursor-pointer">Đã điều chỉnh {revisions.length} lần</summary>
          <div className="mt-1"><LichSuDieuChinh revisions={revisions} /></div>
        </details>
      )}
```

  Trong khối `followups.map((f) => …)`: đổi `` ` · chu kỳ ${f.cycleNo}` `` → `` ` · Đợt ${f.cycleNo}` ``; sau dòng `{f.note && <p …>}` thêm:

```tsx
              {f.remainingIssue && <p className="text-[11px] text-slate-400 mt-0.5 mb-0">Còn tồn: {f.remainingIssue}</p>}
              {f.decisionNote && (
                <p className="text-[11px] text-slate-400 mt-0.5 mb-0">
                  {f.nextStep === 'adjust' || f.nextStep === 'propose' ? 'Lý do' : 'Ghi chú'}: {f.decisionNote}
                </p>
              )}
```

  Nút `Cập nhật kết quả` (~584) → `Ghi kết quả`.

- [x] **Step 6: Kiểm.** Run: `npm run typecheck` rồi `npm test 2>&1 | tail -3`. Expected: sạch; **B + 21** ✓.
- [x] **Step 7: Commit.** `git add web/src/modules/cases/SkillBoard.tsx web/src/modules/cases/CasePanel.tsx` ·
  `git commit -m "PR-S2 (9): hiện lịch sử điều chỉnh, chuỗi Được thay thế, vấn đề còn tồn và lý do (một dòng phụ, chi tiết trong ▸ và ngăn Case)"`

---

### Task 10: Tài liệu

**Files:** `plan.md` (§22.9), `CODE_MAP.md`

- [ ] **Step 1: `plan.md` §22.9** (~2892–2898): đổi `- [ ] **S2.**` → `- [x] **S2.** *(PR-S2)*` và `- [ ] **S4.**` → `- [x] **S4.** *(PR-S2)*`; thêm một dòng
  dưới mỗi mục:
  - S2: `**PR-S2:** bảng \`case_intervention_revisions\` (bản cũ · bản mới · ngày · ai · lý do); Điều chỉnh = cùng PA, không đổi loại; Thay = chuỗi \`superseded_by\` có sẵn + lý do bắt buộc; sửa gợi ý lúc xác nhận cũng ghi lịch sử; \`completeIntervention\` thôi ghi đè mô tả. Nghiệm thu mục 2 khoá bằng phép kiểm "Điều chỉnh hai lần".`
  - S4: `**PR-S2:** form Ghi kết quả 5 mục (kết quả · tiến triển · vấn đề còn tồn · Giữ nguyên/Điều chỉnh/Thay phương án/Kết thúc phương án · ghi chú hoặc lý do), dùng chung ở hồ sơ học viên và ngăn Case (\`web/src/modules/cases/CapNhatTuan.tsx\`).`
- [ ] **Step 2: `CODE_MAP.md`**: thêm hai dòng vào bảng gần dòng "Thẻ case" (~28):
  - `| **Ghi kết quả PA** (cập nhật tuần 5 mục; Giữ nguyên / Điều chỉnh / Thay / Kết thúc) | \`web/src/modules/cases/CapNhatTuan.tsx\` → \`CapNhatTuanForm\` | \`server/src/cases/cases.ts\` → \`updateResult\` |`
  - `| **Lịch sử điều chỉnh PA** (bản cũ · khi nào · ai · vì sao) | \`web/src/modules/cases/CapNhatTuan.tsx\` → \`LichSuDieuChinh\` | \`server/src/cases/planRevisions.ts\` |`
- [ ] **Step 3: Commit.** `git add plan.md CODE_MAP.md` · `git commit -m "PR-S2 (10): tài liệu plan.md §22.9 (S2, S4) và CODE_MAP"`

---

### Task 11: Nghiệm thu: kiểm đủ, migrate lặp trên bản sao, KIỂM bấm thử, rà soát, rebase, mở PR

- [ ] **Step 1: Chuỗi kiểm đầy đủ.** Run: `npm run check`. Expected: build sạch, `TẤT CẢ B+21 KIỂM TRA ĐỀU ĐẠT` (~740), typecheck sạch. Ghi số vào Nhật ký.

- [ ] **Step 2: Migrate lặp trên BẢN SAO database dev** (không bao giờ trên file gốc, không bao giờ trên Turso). Bash, trong worktree:

```bash
SCR="$(node -e "console.log(require('os').tmpdir())")/pr-s2-migrate"
mkdir -p "$SCR"
node -e "const d=require('libsql'); const db=new d(process.argv[2], { readonly: true }); db.exec(\"VACUUM INTO '\" + process.argv[1].replace(/\\\\/g,'/') + \"'\")" "$SCR/ban-sao.sqlite" "../../../data/pisa-demo.sqlite"
PISA_DB="$SCR/ban-sao.sqlite" npm run migrate
PISA_DB="$SCR/ban-sao.sqlite" npm run migrate
```
  (Đường `../../../data/pisa-demo.sqlite` là database dev của **thư mục chính**, tính từ `.claude/worktrees/pr-s2-dieu-chinh-pa`; mở **chỉ đọc**. Không có
  file đó thì dùng `data/pisa-demo.sqlite` của worktree sau khi `npm run seed` ở một commit **trước** Task 1, hoặc ghi "không có database dev cũ" vào Nhật ký.)
  Expected: lần một có dòng `✓ PR-S2: thêm bảng case_intervention_revisions, case_followups.remaining_issue, case_followups.decision_note…`
  (nếu database dev còn cũ) hoặc không có gì; lần hai **không** có dòng PR-S2.

- [ ] **Step 3: Chuẩn bị bấm thử** trên database **riêng** của worktree, **không** dùng cổng 4000 và 5173:

```bash
KIEM="$(node -e "console.log(require('os').tmpdir())")/pr-s2-kiem.sqlite"
PISA_DB="$KIEM" npm run seed
```
  Tạo file tạm `vite.kiem.config.ts` ở gốc worktree (**không commit, xoá sau khi xong**):

```ts
import base from './vite.config.ts';
export default { ...base, server: { port: 5327, strictPort: true, proxy: { '/api': { target: 'http://127.0.0.1:4127', changeOrigin: true } } } };
```
  Chạy hai cửa sổ (hoặc `run_in_background`): `npm run build:server && PISA_DB="$KIEM" PORT=4127 npm run dev:api` và `npx vite --config vite.kiem.config.ts`.
  Mở `http://localhost:5327` (Playwright kênh Chrome, theo bộ nhớ "Máy chủ dev trong worktree"; **không** dùng `preview_start` vì nó chạy từ thư mục chính).
  Tài khoản demo: xem `DEMO.md`.

- [ ] **Step 4: KIỂM, bấm thử ba vai.** Ghi kết quả từng ý vào Nhật ký (chữ đọc được từ trang là đủ; có ảnh chụp thì tốt hơn).
  1. **GVBM Listening MB-FT 101** › Hồ sơ một học viên có Case Listening đang có PA chạy › thẻ Case › dòng PA › **Ghi kết quả**:
     - Form hiện đúng 5 mục theo thứ tự. Chưa chọn kết quả thì 4 nút quyết định mờ, rê chuột có `title` "Chọn kết quả trước.".
     - Chọn **Chưa đủ dữ liệu**: **Giữ nguyên**, **Điều chỉnh**, **Thay phương án** sáng; "Kết thúc phương án" mờ, rê chuột thấy câu chặn; không có nút "Xin hỗ trợ từ Quản lý".
     - Chọn **Điều chỉnh**: hiện ô Mô tả (điền sẵn bản hiện tại), Người thực hiện mới, Dự kiến kết thúc. Ô 5 đổi tên "Lý do điều chỉnh". Không đổi gì thì
       nút mờ + câu "Điều chỉnh thì phải đổi ít nhất một thứ…". Sửa mô tả + ghi lý do → **Lưu điều chỉnh** → toast "Đã điều chỉnh phương án, bản cũ giữ trong lịch sử".
     - Dòng PA: tên PA là bản mới; dòng phụ có `· điều chỉnh 1 lần`, **vẫn một dòng**. Bấm ▸: thấy "Điều chỉnh · {tên GV}", "Lý do: …", "Trước: “{bản cũ}”".
     - Điều chỉnh lần hai (đổi ngày dự kiến) → ▸ thấy hai bản, mới nhất trên cùng; dòng phụ `· điều chỉnh 2 lần`.
  2. **Cùng GV**, PA khác (hoặc tạo PA mới bằng "+ phương án") › **Ghi kết quả** › **Không tiến bộ** › **Thay phương án**: chọn Tutor, mô tả, để trống người
     thực hiện, ghi lý do → **Thay phương án**. Thấy PA cũ có dòng phụ `· được thay`, ▸ có "Được thay bằng: …" và lần cập nhật "→ Thay phương án",
     "Lý do: …"; PA mới có ▸ "Thay cho: …", người thực hiện là chính GV.
     Làm lại với một PA khác, chọn **Chưa đủ dữ liệu › Thay phương án** (Q2): lưu được; PA cũ "Được thay thế" với kết quả "Chưa đủ dữ liệu".
     Quản lý mở Phân tích › Kết quả hỗ trợ của lớp: PA đó **không** có trong mẫu số và **không** có trong liên kết "{n} PA cần bổ sung đánh giá".
  3. **Cùng GV** › PA khác › **Tiến bộ rõ** › **Giữ nguyên** + Vấn đề còn tồn "Còn sai T/F/NG" → ▸ thấy "→ Giữ nguyên" và "Còn tồn: Còn sai T/F/NG".
     Thử **Kém hơn**: "Kết thúc phương án" mờ, có nút chữ **Xin hỗ trợ từ Quản lý**.
  4. **GV Speaking MB-FT 101** mở cùng học viên: thẻ Case Listening **không** có nút Ghi kết quả (hoặc bấm thì báo không có quyền).
  5. **Quản lý MB** › mở ngăn Case vừa điều chỉnh (từ hồ sơ học viên bấm tên Case) › khối PA: thấy `<details>` "Đã điều chỉnh 2 lần", mở ra đủ hai bản;
     "Thay cho: …"/"Được thay bằng: …" đúng; nút **Ghi kết quả** mở hộp thoại cùng form 5 mục. Quản lý điều chỉnh một lần → lịch sử ghi tên Quản lý.
  6. **Gợi ý tự động từ SOS** (nếu bộ demo có Case FT tự tạo còn "Gợi ý tự động · chờ xác nhận"): GVBM đúng môn bấm **Sửa**, đổi mô tả, **Xác nhận** →
     ▸ của PA đó thấy "Điều chỉnh khi xác nhận gợi ý", "Lý do: Chỉnh khi xác nhận gợi ý tự động", "Trước: “{bản gợi ý}”".
  7. Màn 375px (G-11): form không tràn ngang; dòng phụ PA không xuống hai dòng.
  Xong: dừng hai tiến trình, **xoá** `vite.kiem.config.ts`, xoá file `$KIEM` nếu muốn. `git status` phải sạch.

- [ ] **Step 5: Rà soát code.** REQUIRED SUB-SKILL: `superpowers:requesting-code-review`. Người rà: **Fable 5.1** (nếu code bằng Fable thì **Opus 5**).
  Đưa cho người rà: plan này, đặc tả §1–§2, §7 dòng S2, bảng Q1–Q18, `git diff main...HEAD`. Yêu cầu soi riêng:
  (a) Điều chỉnh bị từ chối **không** để lại dòng nào (kiểm tra hàm chuẩn hoá chạy **trước** giao dịch);
  (b) bản "cũ" ghi vào lịch sử đúng là dòng **đọc trước khi sửa**, kể cả khi nhánh `continue` cũng ghi `performer_user_id`;
  (c) không đường nào khác còn ghi đè `case_interventions.description` của PA đã xác nhận (grep `SET description` và `description =` trong `server/src`);
  ngoại lệ đã biết: `resyncUnconfirmedPresets` (gợi ý chưa xác nhận, Q7);
  (d) `effectiveness.ts` chỉ đổi đúng một dòng F05; ba phép kiểm Task 7 đúng ý luật (D03, luật 3, Q2);
  (e) diff không chạm vùng PR-AN trong `caseCardOf` (dòng khai báo, `attachmentCount`) và không chạm file PR-O.
  Xử lý phản hồi theo `superpowers:receiving-code-review`; ghi kết luận vào Nhật ký.

- [ ] **Step 6: Rebase lên `main` mới nhất.** PR-S2 **merge SAU PR-AN**. Kiểm: `gh pr list --state merged --search "PR-AN" --limit 5`.
  - Nếu PR-AN **đã merge**: `git fetch origin && git rebase origin/main`. Gỡ xung đột bằng **giữ cả hai khối**:
    - `server/src/migrate.ts`: chỗ gọi, giữ **cả hai** dòng gọi (`migrateAuthAttempts(conn, applied);` của AN và `migrateDieuChinhPa(conn, applied);` của S2);
      cuối file giữ **cả hai** hàm.
    - `server/src/schema.sql`: AN thêm bảng `auth_attempts` sau `demo_sessions` (~1421), S2 thêm ở ~1087; thường không xung đột, có thì giữ cả hai.
    - `server/src/tests/run.ts`: AN nối 3 dòng ngay trước khối in tổng kết; S2 nối sau khối PR-S1. Giữ cả hai.
    - `server/src/cases/cases.ts`: AN đổi chữ ký `caseCardOf(caseId, c, soBangChung)`, dòng gọi, khối `attachmentCount`; S2 thêm dòng **trong** thân. Giữ cả hai.
    - `server/src/routes/index.ts`: AN sửa khối `/auth`; S2 sửa khối `/interventions/:id/confirm`. Giữ cả hai.
    Sau rebase: `npm run check` (xanh, số phép kiểm = của main + 21) **và** chạy lại Step 2 (migrate lặp trên bản sao **mới**).
  - Nếu PR-AN **chưa merge**: vẫn mở PR (Step 7), ghi rõ trong thân PR "**Chỉ merge sau PR-AN.** Khi AN merge: rebase, `npm run check`, migrate lặp trên bản sao".
    Khi AN merge thì làm đúng các bước ở gạch đầu dòng trên rồi push lại (`git push --force-with-lease`).

- [ ] **Step 7: PR.** `git push -u origin pr-s2-dieu-chinh-pa`; `gh pr create` tiêu đề `PR-S2 · Điều chỉnh PA học thuật (S2 + S4)`, thân gồm: tóm tắt theo Task;
  bảng Q1–Q18; số phép kiểm B → B+21; migrate (một bảng + hai cột, idempotent, đã chạy lặp trên bản sao); "Chuyển cho PR khác" (mục dưới);
  dòng "Chỉ merge sau PR-AN" nếu AN chưa merge; dòng cuối `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  **Không tự merge.** Báo chủ sản phẩm bằng tiếng Việt đơn giản: GV giờ sửa được PA đang chạy mà vẫn giữ bản cũ; mỗi tuần ghi kết quả theo 5 mục và chọn
  Giữ nguyên / Điều chỉnh / Thay / Kết thúc; xem lịch sử ở đâu (nút ▸ ở dòng PA, và trong ngăn Case).

---

## Chuyển cho PR khác

### Chuyển cho PR-Qb (Hành trình, đợt 3)
Dữ liệu đã có sẵn ở `GET /students/:id/skill-board` → `rows[].cases[].plans[]` (đúng nguồn `JourneyTimeline.tsx` đang đọc):
- **Mỗi khối PA** là một `plan`: bắt đầu `startedOn`, kết thúc `completedOn` (null = đang chạy), tên `name` (bản **hiện tại**), kết quả cuối
  `lastOutcome`/`lastOutcomeLabel` (dùng chữ Tiến bộ rõ · Tiến bộ một phần · Không tiến bộ · Kém hơn). PA **bị thay khi chưa đủ dữ liệu** (Q2) có
  `closedReason = 'superseded'` và kết quả cuối "Chưa đủ dữ liệu": vẽ khối có nhãn "Chưa đủ dữ liệu" (màu trung tính), không tô như thất bại.
- **Khối nối nhau:** `closedReason === 'superseded'` và `supersededBy = id` PA mới. PA mới bắt đầu đúng ngày PA cũ kết thúc (`completedOn` của PA cũ).
  Vẽ PA mới **nối liền** sau PA cũ trên cùng hàng vấn đề; không vẽ thành PA song song.
- **Điều chỉnh không phải khối mới:** `revisions[]` (`on`, `reason`, `by`, `before`, `after`) là **mốc nhỏ trên cùng một khối** (ví dụ vạch mảnh có tooltip
  "Điều chỉnh {dd/mm}: {lý do}"). Loại PA không đổi trong một khối.
- **Mỗi lần cập nhật:** `updates[]` có `on`, `outcome`, `decision` (`continue` = Giữ nguyên, `adjust`, `propose` = Thay, `complete`, `ask_manager`, `monitor` cũ),
  `remainingIssue`, `decisionNote`, `cycleNo`, `late`. Chỉ gồm lần **có kết quả**.
- PA gợi ý tự động bị thay **trước khi xác nhận** là `cancelled`, không có trong `plans` (đúng: nó chưa từng chạy).
- Bấm khối PA mở ngăn Case và cuộn tới PA (§3.8): khối PA trong `CasePanel` đã có `revisions` và dòng "Thay cho / Được thay bằng".

### Chuyển cho PR-Form (đợt 5)
- Ô "Người thực hiện mới" (Điều chỉnh) và "Người thực hiện" (Thay) trong `CapNhatTuan.tsx` đang là chữ tự do. Đổi sang `PeoplePicker` lưu ID
  (quyết định 4.7). Máy chủ đã nhận `adjust.performerUserId` và `newPlan.performerUserId`.
- Nút "Sửa" gợi ý tự động (`CaseSosControls.tsx`) chưa có ô lý do; route `/interventions/:id/confirm` đã nhận `reason`.

### Chuyển cho PR-S3 (chữ cuối)
- `CASE_OUTCOME_LABEL` (kết quả **cả Case**, `shared/domain/cases.ts:245-250`) vẫn là "Đã tốt hơn hẳn / Có tiến bộ / Chưa chuyển biến / Tệ hơn"; theo
  THUAT_NGU g8-128…131 phải về bộ chữ Tiến bộ rõ · … · Kém hơn. PR-S2 không chạm hộp thoại chốt Case.
- `SectionNote` còn lại trong `CasePanel.tsx` (ví dụ ~280) theo G-5.

### Chuyển cho PR-Z2c (deploy)
- `caseCardOf` thêm **một** truy vấn mỗi Case (`lichSuDieuChinhCuaCase`). Đo trên Turso cùng lúc đo các trang chậm; nếu cần thì gộp theo danh sách Case như
  `demBangChungCase` của PR-AN.

---

## Mâu thuẫn giữa nguồn và mã (đã xử lý trong plan)

| # | Nguồn nói | Mã thật | Xử lý |
|---|---|---|---|
| M1 | Kiểm kê S4: "`recordFollowUp` chỉ nhận outcome/note (`cases.ts:1187-1190`)" | Web không gọi `recordFollowUp`. Cập nhật tuần thật là `updateResult` (`cases.ts:2583`, `POST /interventions/:id/result`) | S4 làm ở `updateResult`; `recordFollowUp` giữ nguyên (Q16) |
| M2 | Kiểm kê S2: "ghi đè `description` ở `cases.ts:1034`" | Dòng đó nay ở `completeIntervention` ~1066 (ghi đè mô tả bằng **ghi chú**); web không còn gọi | Bỏ ghi đè (Q15) |
| M3 | Kiểm kê S2: "`sosAuto.ts:122, 201`" | `:122` là máy tự đồng bộ **gợi ý chưa xác nhận**; `:201` là xác nhận có sửa (có `audit_logs` before/after nhưng không có lịch sử đọc được trên màn) | `:122` giữ (Q7); `:201` ghi `confirm_edit` (Task 6) |
| M4 | Kiểm kê S2: "PA đã xác nhận không sửa được chút nào" | Đúng với **nội dung**. Nhưng **Thay** đã có sẵn (`nextStep: 'propose'`), chỉ ở tab "Kết thúc phương án" | Thay dùng lại đường có sẵn; thêm Điều chỉnh |
| M5 | Rulebook §5: cập nhật có hai lựa chọn "Tiếp tục theo dõi / Kết thúc phương án" | Mã có hai tab `monitor`/`end` | Rulebook §18.2 và nguồn §8 mới hơn: Giữ nguyên / Điều chỉnh / Thay (+ Kết thúc giữ). "Giữ nguyên" = tiếp tục theo dõi |
| M6 | Rulebook §5 và §11 ghi "Có tiến bộ" | Mã `FOLLOWUP_OUTCOME_LABEL` đã là "Tiến bộ rõ" (đúng đặc tả §2) | Không đổi; `CASE_OUTCOME_LABEL` lệch chuyển PR-S3 |
| M7 | (không nguồn nào nói) | **Lỗi có sẵn:** Thay từ giao diện luôn hỏng vì PA mới thiếu người thực hiện | Sửa (Q13) |
| M8 | Loại PA "Điều chỉnh cách dạy" (`teaching_adjust`) | Trùng chữ "Điều chỉnh" với quyết định mới | Chấp nhận: một cái là **loại PA** (trong ô chọn loại), một cái là **quyết định** (nút). Ghi để PR-S3 xem |

---

## Self-review của người viết plan (22/09/2026, session planning)

**Phủ đặc tả:**
- S2 "bản cũ · khi nào · ai · vì sao · bản hiện tại" → bảng `case_intervention_revisions` (Task 1), ghi ở Task 4 (Điều chỉnh) và Task 6 (sửa lúc xác nhận);
  đọc ở Task 5; hiện ở Task 9. "Hiện tại" = hàng chính `case_interventions`. Nghiệm thu `plan.md` §22.9 mục 2 ("Sửa nội dung phương án hai lần → đọc lại
  được cả hai bản cũ và lý do đổi") → phép kiểm "Điều chỉnh hai lần" (Task 4).
- S2 "PA đã xác nhận vẫn điều chỉnh được theo luồng có lý do, không ghi đè mất dấu" → Task 4 + Q5; ghi đè còn sót (`completeIntervention`) → Task 6.
- S4 năm mục → Task 4 (máy chủ) + Task 8 (form). "Không biến thành form dài" → Q10.
- "Thay" trong mô hình dữ liệu → Q1, Q2 (đã sửa theo planning review: cho Thay khi Chưa đủ dữ liệu); thống kê → Q9 + Task 7 (ba phép, trong đó "Thay khi chưa đủ dữ liệu: không vào thống kê, không vào F05").
- Giao diện chỉ ở CasePanel và SkillBoard, lịch sử gọn G-3 → Task 8–9. Hành trình: chỉ dữ liệu (Task 5) + mục "Chuyển cho PR-Qb".
- Ràng buộc song song → Global Constraints + Task 11 Step 6.

**Kiểu thống nhất:** `PlanDecision`/`decisionToStep`/`decisionsFor`/`decisionBlockedReason`/`decisionNeedsReason`/`CONFIRM_EDIT_REASON` (Task 2) dùng ở Task 4, 6, 8;
`DieuChinhPA`/`chuanHoaDieuChinh`/`apDungDieuChinh`/`ghiBanDieuChinh`/`lichSuDieuChinhCuaCase`/`BanDieuChinh` (Task 3) dùng ở Task 4, 5, 6; hình `BanDieuChinh` web (Task 8)
trùng hình máy chủ; trường `revisions`, `closedReason`, `supersededBy`, `updates[].decision/remainingIssue/decisionNote`, `followups[].remainingIssue/decisionNote` (Task 5)
dùng ở Task 9.

**Số phép kiểm dự kiến:** B + 4 (T1) + 2 (T2) + 8 (T4) + 2 (T5) + 2 (T6) + 3 (T7) = **B + 21** (≈ 740 nếu B = 719). "Expected" ở từng Task là cộng dồn; lệch ±1 do
chia phép khác thì ghi Nhật ký, không phải lỗi.

**Rủi ro đã biết:** (1) Task 1: hai cột mới đặt ở **cuối** `case_followups` để khớp thứ tự với `ADD COLUMN`; chú thích không có dấu phẩy. (2) Task 4: nhánh `continue` ghi
`performer_user_id` trước khi `apDungDieuChinh` ghi đè; bản "cũ" lấy từ `iv` đọc đầu hàm nên vẫn đúng (người rà soát kiểm (b)). (3) Task 8: xoá `InlineResult`
làm mất lối "Thay bằng phương án khác hoặc nhờ Quản lý" cũ; form mới có đủ Thay và Xin hỗ trợ từ Quản lý ngay tại chỗ nên không mất đường nào.

---

## Nhật ký thực thi

| Ngày | Task | Ghi chú (model người code · số phép kiểm · lệch plan · quyết định tại chỗ) |
|---|---|---|
| 22/09 | 0 | Opus 5 (session code + subagent Opus 5). Worktree `.claude/worktrees/pr-s2-dieu-chinh-pa` từ `origin/main` 46f5f90 (đã có PR-S1 #56 và PR-O #58). Không có biến Turso. **B = 730** (plan ghi 719: PR-O merge sau khi đo; đích cuối = 751). Q1–Q18 đọc xong, planning review đã duyệt, không thấy Q nào trái đặc tả. |
| 22/09 | 1 | Opus 5 (subagent) · c616eff · **734** (B+4) ✓ · đỏ trước: 3 ✗ đúng dự kiến · rà Task (Opus 5): duyệt, 0 lỗi nặng; 3 ghi chú nhỏ để rà cuối (phép 'trọn chuỗi' không bắt được nếu xoá dòng gọi; so sánh chưa gồm khoá ngoại/cột chỉ mục; chỉ mục chỉ tạo cùng bảng) |
| 22/09 | 2 | Opus 5 (subagent) · e704c92 · **736** (B+6) ✓, kiểm kiểu sạch · đỏ trước: 2 ✗ (`decisionsFor is not a function`) · rà Task (Opus 5): duyệt; ghi chú nhỏ: câu lỗi cũ "Đề xuất phương án mới" ở updateResult → sửa ở Task 4; CODE_MAP "năm bước" → Task 10 |
| 22/09 | 3 | Opus 5 (subagent, gộp một lượt với Task 4) · 7b9f86c · build sạch · rà chung với Task 4 |
| 22/09 | 4 | Opus 5 (subagent) · 341516e · **744** (B+14) ✓, kiểm kiểu sạch · đỏ trước: 7/8 (phép quyền C02 xanh sẵn vì kiểm quyền chạy trước) · 3 phép cũ sửa như plan; phép "Ma trận tình huống vòng 5" đỏ theo [9.1] rồi tự xanh · thêm: câu lỗi "Đề xuất phương án mới" → "Thay phương án" (Q14) · rà (Opus 5): duyệt; ghi chú nhỏ để rà cuối: Điều chỉnh ghi đè `followup_due` mặc định khi PA chưa có ngày; lịch sử sắp theo `effective_on` có thể lệch khi lùi ngày |
| 22/09 | 5 | Opus 5 (subagent, một lượt với Task 6–7) · 84d3477 · **746** (B+16) ✓ · lệch plan: thêm MỘT dòng `.reverse()` trong chuỗi `updates` của thân `caseCardOf` (truy vấn `follows` xếp mới→cũ; hai lần cập nhật cùng ngày ra ngược, phép kiểm của plan không qua được). Người rà (Opus 5) duyệt: đúng, sửa luôn lỗi thứ tự cùng ngày ở ▸ SkillBoard; chỉ thêm dòng, không chạm vùng PR-AN |
| 22/09 | 6 | Opus 5 (subagent) · 65613fd · **748** (B+18) ✓ · các phép PR-T xác nhận/thay gợi ý vẫn xanh · rà: duyệt; ghi chú nhỏ: lý do do người gõ lúc xác nhận chưa bắt tối thiểu 8 ký tự (plan không yêu cầu) |
| 22/09 | 7 | Opus 5 (subagent) · 859105f · **751** (B+21) ✓ · cổng 🛑: hai phép khoá xanh ngay, phép thứ ba đỏ đúng ở dòng F05 → sửa đúng một dòng `effectiveness.ts` · F05 cũ vẫn xanh · rà: duyệt |
| 22/09 | 8 | Opus 5 (subagent, một lượt với Task 9) · 116c675 · **751** ✓, kiểm kiểu sạch, vite build sạch · lệch nhỏ có lợi: bỏ hai chú thích cũ trên ResultDialog · rà (Opus 5): cần sửa 1 (form chưa báo trước lỗi "ngày dự kiến kết thúc sớm hơn ngày cập nhật") → vòng sửa 1 (bc55f75): thêm kiểm ngày đó + ngày cập nhật/ngày kết thúc không sau hôm nay + `title` cho nút Ghi kết quả (G-7) → rà lại: đạt |
| 22/09 | 9 | Opus 5 (subagent) · c64c4bb · **751** ✓ · `plans={c.plans}` thêm ở CẢ HAI chỗ gọi KhoiPhuongAn · lệch nhỏ có lợi: PA giữa chuỗi A→B→C hiện đủ "Thay cho: A · Được thay bằng: C"; ▸ của PA bị thay không lặp dòng "kết thúc phương án" cùng ngày với "Được thay bằng"; `tabular-nums` · rà: đạt sau vòng sửa 1 |
