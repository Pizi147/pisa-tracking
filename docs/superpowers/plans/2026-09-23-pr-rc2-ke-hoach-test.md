# PR-Rc2 · Kế hoạch Test — Implementation Plan

| Mục | Chốt |
|---|---|
| Mã PR · đợt | **PR-Rc2** · **đợt 3 (trước deploy)**, theo quyết định chủ sản phẩm 23/09 01:30 |
| Nhánh · worktree | `pr-rc2-ke-hoach-test` · `.claude/worktrees/pr-rc2-ke-hoach-test` |
| Cổng thử | **API 4187 · Vite 5387** (không 4000/5173, không cổng PR khác) |
| Model khuyến nghị | **Opus 5.5 · High** |
| Phương án B | **Fable 5.1 · High** |
| Người rà (session planning giao) | **Fable 5.1**; nếu code bằng Fable thì **Opus 5.5** |
| Migrate | **KHÔNG.** Không đổi `server/src/schema.sql`, `server/src/migrate.ts` (Q14) |
| Phụ thuộc | **Bắt đầu code SAU KHI PR-Rc1 merge** (dùng `lyDo`, `kiemLyDo`, `SuaDiemCoLyDo`, `reportRegularNoShow`, `cham/*`). Merge **sau PR-Qa** (Qa sửa `standing.ts`) |
| Chạy song song với | Qb, Form, Pb-gọn |
| File KHÔNG được chạm | **Qa:** `StudentsPage.tsx`, `ClassOverviewPage.tsx`, `ClassRoster.tsx` · **Qb:** `StudentDetailPage.tsx`, `JourneyTimeline.tsx` · **Pa:** `OverviewPage.tsx`, `WorkList.tsx`, `server/src/worklist/mywork.ts` · **Form:** `CasePanel.tsx`, `SkillBoard.tsx`, `QuickReport.tsx`, `server/src/cases/cases.ts`, `server/src/yThuc/measures.ts` · **Pb:** `CaseBoardPage.tsx`, `IssueAnalysis.tsx`, `WeeklyBoard.tsx` |

## QUY TRÌNH NHANH (bắt buộc — thay mọi hướng dẫn "subagent-driven" cũ)

- **KHÔNG** dùng `superpowers:subagent-driven-development`; **không** rà từng Task bằng subagent. Session tự code từng
  Task, chạy `npm run check` sau mỗi Task (phải xanh, số phép kiểm **không giảm**), rồi commit. Nếu có dùng subagent:
  **cùng model**, **KHÔNG Haiku**.
- **Không** chụp ảnh từng Task. Bấm thử theo vai + 375px **một lần** ở Task cuối; ảnh lưu `thiet-ke/anh/pr-rc2/`.
- **Không** tự rà code cuối PR (planning rà bằng model khác). Cuối PR: push, mở PR, báo planning.
- Commit ghi đúng dòng `Co-Authored-By` của **model thật** đang chạy.
- **Không chạy lệnh nào vào database bản chính (Turso), không deploy.**

**Goal:** Tab **Test › Kế hoạch Test** (chỉ Quản lý) làm lại theo mockup 05b + 10b §4: lớp Fast Track là **lưới cả
lớp** (HV × MT1–5, mỗi đợt 2 hàng RLW / S, ô tô màu theo trạng thái, bấm ô sửa tuần, **trùng tuần với đợt khác thì
chặn**), **Xếp lịch hàng loạt** là ngăn trượt phải 5 bước có xem trước, lưu một phần thì giữ hàng lỗi; lớp thường xếp
**theo lớp** (Giữa khoá / Cuối khoá × L R W S, máy đề xuất tuần theo chương trình, đổi tuần một môn). Kèm **R11** (đợt
hoàn tất thì chỉ Quản lý sửa điểm, có nhật ký) và **T9** (kết quả gần nhất dùng mục tiêu tại thời điểm thi).

**Architecture:** Luật thuần ở file mới `shared/domain/keHoachTest.ts` (kiểm bằng harness máy chủ). Máy chủ thêm module
mới `server/src/keHoach/keHoachTest.ts` — **chỉ gọi lại** các hàm nghiệp vụ có sẵn (`createAttempt`, `setSkillWeek`,
`checkSkillWeekMove`, `planRegularTests`, `classProgressMany`), không dựng đường ghi lịch thứ hai. R11 là một file nhỏ
`server/src/fasttrack/hoanTat.ts` được `saveScore` / `saveRegularScore` / `reportRegularNoShow` và hai hàm dựng ô lưới
gọi. Web: `KeHoachTestTab` viết lại, component mới trong `web/src/modules/test/keHoach/`; xoá `MockPlanPanel.tsx`.

**Nguồn:** đặc tả `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §1 (G-1…G-12), §2, **§3.5
"Kế hoạch Test"**, §4 dòng "Kế hoạch Test", §7 dòng **Rc2** · kiểm kê `…-kiem-ke-truoc-deploy.md` §1.4 (**R9, R9b, R10,
R11, R12, R14**), §3 dòng 14 · mockup `thiet-ke/mockup/05b-ke-hoach-test.html` (**phần (1)** + **(2) phương án A**),
`10b-lop-thuong-v2.html` **§4** · chữ `thiet-ke/THUAT_NGU_DA_CHOT.md` · kế hoạch Rc1
`docs/superpowers/plans/2026-09-22-pr-rc1-cham-diem.md` (mục "Ranh giới với PR-Rc2" và "Chuyển cho PR-Rc2").

**Con trỏ mã** đo trên `main` @ `37786fd` (trước Rc1). Rc1 sửa `attempts.ts`, `regular.ts`, tạo `cham/*` → **Task 0
bước 4 đối chiếu lại** mọi con trỏ gắn nhãn *(sau Rc1)*.

---

## Luật riêng của PR này

- **Không nới quyền ngoài R11.** Mọi endpoint mới đòi `PLAN_WEEK` trong phạm vi lớp (đúng cờ `nav.testPlan`,
  `server/src/platform/nav.ts:22`). Ngoại lệ duy nhất có chủ đích: R11 cho Quản lý (`PLAN_WEEK`) sửa điểm **đợt đã hoàn
  tất** (Q1).
- **Một đường ghi lịch.** Đổi tuần luôn qua `setSkillWeek` (`server/src/fasttrack/skillSchedule.ts:525`); tạo đợt FT qua
  `createAttempt` (`attempts.ts:888`); tạo bài lớp thường qua `planRegularTests` (`regular.ts:226`).
- **Chữ bị cấm bởi phép kiểm PR-H** (`run.ts:8708`, quét cả chú thích): `Kế hoạch MT`, `Tuần hoàn tất`, `Người làm`,
  `Việc của tôi`, `Hãy`… — không viết trong file mới. Không viết "Normal" trên màn.
- **Chữ PR này dùng** (THUAT_NGU): `Kế hoạch Test` (g1-028) · `Xếp lịch hàng loạt…` (g3-097) · `Xếp lịch hàng loạt ·
  {lớp}` (g10-074) · `Lưu lịch cho {n} em` (g3-098) · `+ xếp` (g3-099) · `RLW` / `S` (g10-072, tooltip "Reading,
  Listening, Writing" / "Speaking", G-7) · `Sửa lịch · {tên} · MT{n} · RLW` (g10-073) · bước `Đợt · Học viên · Tuần ·
  Xem trước` (g10-075) · `{a}/{b} đã chọn` (g10-076) · `cùng tuần RLW` (g10-077) · `dời → {tuần}` (g10-078) · `✓`
  tooltip "Đã thi" (g6-146) · `vào muộn` (g6-147) · `Lớp: {mã} ▾` (g4-059) · `Giữa khoá` / `Cuối khoá` (g10-005) ·
  `Đổi lịch` (g3-077). Tuần luôn qua `tuanLich()` → `W3 SEP`; tuần khoá qua `tuanKhoa()` → `W8/8`
  (`shared/domain/hienThiNgay.ts`).
- G-5: không `SectionNote` giải thích; luật vào ⓘ cạnh tiêu đề (dùng thành phần ⓘ Rc1 đã dựng — `grep -rn "ⓘ" web/src`;
  nếu Rc1 để cục bộ trong `ChamDiemPage` thì tách ra `web/src/ui/NutLuat.tsx` và cho `ChamDiemPage` dùng lại).
  G-4: ô "đã dời" dùng màu vàng + chữ, **không** ⚠. G-11: lưới cuộn ngang **trong thẻ**.

## Bảng Q — session planning tự quyết (người rà kiểm lại)

| # | Câu hỏi | Quyết định | Lý do |
|---|---|---|---|
| Q1 | R11 "chỉ Quản lý sửa" nhưng Quản lý **không có** quyền nhập điểm (`seed/data.ts:55-62` không có `score.override`; `run.ts:699` khẳng định) | Đợt **đã hoàn tất**: GV bị chặn; người có `PLAN_WEEK` (Quản lý, QTHT) **hoặc** `score.override` sửa được, **bắt buộc lý do** (RB-5 của Rc1), nhật ký `score.override` kèm `sauHoanTat: true`. Đợt **chưa** hoàn tất: giữ nguyên (Quản lý vẫn không nhập) | Câu chốt 21/09 đêm (`plan.md:348`) ghi rõ "chỉ Quản lý". Không cấp `score.override` cho Quản lý (sẽ mở luôn nhập bù mọi lúc) |
| Q2 | "Hoàn tất" tính thế nào | Mọi kỹ năng **bắt buộc, chưa huỷ phần thi** đều có điểm (FT: đủ band; lớp thường: có `raw_score`) **hoặc** — chỉ FT — có dấu `-`/đã chốt vắng; **và** hôm nay > Chủ nhật của tuần muộn nhất trong các kỹ năng bắt buộc | `plan.md:348`; kiểm kê §3 dòng 14 ("vế '-' chỉ áp FT"). Kỹ năng đã huỷ phần thi không tính là xong → đợt đó không bao giờ tự khoá (an toàn hơn khoá nhầm) |
| Q3 | T15: chặn trùng theo chiều nào | **Hai đợt khác nhau cùng một tuần thì CHẶN, cả hai chiều** (trùng tuần đầu đợt sau, trùng tuần cuối đợt trước). Cách đúng một tuần vẫn **cảnh báo** (xác nhận được) | Trùng là một sự thật đối xứng: chặn một chiều thì cùng tình huống lúc được lúc không tuỳ ô nào bấm trước. Phép kiểm cũ `run.ts:7626` ("TRÙNG chỉ CẢNH BÁO") đổi thành phép T15 |
| Q4 | Cột MT hiện mấy cột | MT1–MT5, thêm cột MT6+ chỉ khi lớp có em đã có lượt đó | Mockup 5 cột; `MOCK_FT_STUDY_WEEK` có 5 mốc (`shared/domain/fasttrack.ts:20`) |
| Q5 | Ô "vàng = đã dời" nghĩa là gì | Nhóm có kỹ năng **dời vì vắng / dấu `-`**: `attempt_skills.absence_move_count > 0`, hoặc lịch sử `skill_week_moved_absence`, hoặc (lớp thường) dấu `-` của Rc1. Quản lý tự đổi tuần **không** tô vàng (vẫn xanh dương) | Trong sản phẩm "dời" = vì em vắng (`setSkillWeek` chú thích mục 10.6). Tô vàng mọi lần sửa tay thì lưới vàng hết sau một buổi xếp lịch |
| Q6 | Nhóm RLW khi L, R, W lệch tuần nhau | Ô hiện tuần **sớm nhất** + chữ nhỏ `+1` (tooltip liệt kê từng kỹ năng). Sửa ô RLW là đưa cả ba về một tuần, bỏ qua kỹ năng đã có điểm (nói rõ "giữ L — đã có điểm") | Mockup giả định RLW cùng tuần; dữ liệu thật có thể lệch (dời vắng từng môn) |
| Q7 | Tuần S mặc định khi xếp mới | **Tuần sau RLW**, ô `cùng tuần RLW` bỏ tick | Đúng mockup (RLW W3 OCT, S W4 OCT; ô tick để trống) |
| Q8 | Đợt MT mặc định ở bước 1 | Lượt nhỏ nhất mà còn ít nhất một em **chưa thi xong**; chip chỉ hiện các lượt đó | Mockup "MT3 MT4 MT5" (đã bỏ MT1–2 cả lớp đã xong) |
| Q9 | Cấu hình "kỹ năng bắt buộc" (R9 "tách khỏi sửa lịch") | **Bỏ khỏi** Kế hoạch Test. Đợt tạo mới đủ 4 kỹ năng; bỏ bớt kỹ năng làm ở hồ sơ đợt (đã có `setSkillSkip`, `MockDetailPage`) | Đúng chữ R9; mockup 05b không có bước kỹ năng |
| Q10 | "Tiêu đề Kế hoạch Mock Test khi chỉ có FT" (R9b) | Tiêu đề **trong tab** (đầu thẻ) đổi theo phạm vi: chỉ lớp FT → `Kế hoạch Mock Test`; có lớp thường → `Kế hoạch Test`. **Nhãn tab** giữ `Kế hoạch Test` | Nhãn tab là hằng chung của PR-O (`dieuHuong.ts:64`), đổi động làm tab nhảy chữ khi đổi chi nhánh |
| Q11 | Lớp thường "bấm ô đổi tuần một môn" và nút "Dời một môn" khác gì | **Một hộp chung** "Đổi lịch · {lớp} · {Giữa/Cuối khoá}": bấm ô → mở với môn đã chọn, **cả lớp**; nút `Dời một môn` → mở trống, chọn môn + **chọn HV** (mặc định cả lớp, bỏ tick được). Một hàm máy chủ | Mockup có cả hai lối; một hộp thì không có hai luật |
| Q12 | GV lớp thường dời lịch (SCH-01, R12) | Kế hoạch Test **chỉ Quản lý** (§4). GV dời bằng dấu `-` ở lưới chấm (Rc1, tự sang tuần sau). Không thêm nút dời cho GV | §4 bảng định vị: "Kế hoạch Test · QL"; G-12 cấm thêm nút ngoài §4 |
| Q13 | Đề xuất tuần lớp thường lấy từ đâu | **`classProgress()`** (`classes/schedule.ts:199`, đã tính `start_period_id` + mốc Quản lý đã sửa). Sửa `planRegularTests` dùng **cùng nguồn** (hiện nó chỉ đọc `start_date`, bỏ qua mốc đã sửa) | Một con số cho "đề xuất" và "tạo": tạo ra khác đề xuất là lỗi thầm lặng |
| Q14 | Có migrate không | **Không.** "Đã dời" suy từ cột/bảng có sẵn; R11 suy từ điểm + tuần; nhật ký dùng `audit_logs` | Đợt 3 đã có PR có migrate khác; không thêm rủi ro |
| Q15 | "(vào muộn)" dưới tên HV | Ngày vào lớp (`enrollments.started_at`) muộn hơn khai giảng lớp (`classes.start_date`) **quá 14 ngày** | Mockup g6-147; không có nguồn nói ngưỡng — hai tuần là mức lệch một mốc MT không xếp kịp |
| Q16 | T9 phạm vi | Chỉ `standing.ts` (dòng gọi `evaluateAttempt`): `a.target_at_attempt ?? cycle.target_score`. Chỗ khác đã đúng (`students.ts:110`, `profile.ts:70`) | Đặc tả §7 dòng Rc2 |

---

## Bản đồ file

| File | Tạo/Sửa | Việc |
|---|---|---|
| `shared/domain/keHoachTest.ts` | Tạo | Luật thuần (Task 1) |
| `shared/domain/index.ts` | +1 dòng | `export * from './keHoachTest.ts';` |
| `server/src/fasttrack/skillSchedule.ts` | Sửa | T15 (`checkSkillWeekMove` :435); tách phần so đợt lân cận để kiểm được đợt **chưa tạo**; `hasScore` (:505) tính cả `raw_score` |
| `server/src/students/standing.ts` | Sửa 1 dòng | T9 (~:227, sau Qa ~:236) |
| `server/src/fasttrack/hoanTat.ts` | Tạo | R11: `dotHoanTat`, `dotHoanTatMany`, `quyenSuaSauHoanTat` |
| `server/src/fasttrack/attempts.ts` *(sau Rc1)* | Sửa | R11 ở `saveScore` (:1141) và `skillCells` (:242, `canEdit` :349) |
| `server/src/normal/regular.ts` *(sau Rc1)* | Sửa | R11 ở `saveRegularScore` (:329), `reportRegularNoShow`, `regularSheet` (:537); `planRegularTests` (:226) dùng `classProgress` |
| `server/src/keHoach/keHoachTest.ts` | Tạo | Dữ liệu + thao tác Kế hoạch Test (Task 4–6) |
| `server/src/routes/index.ts` | Một khối | `/ke-hoach-test/*` — đặt ngay sau khối `/attempts/bulk-plan` (:377) |
| `server/src/tests/keHoachTest.tests.ts` | Tạo | Phép kiểm PR-Rc2 |
| `server/src/tests/run.ts` | +2 dòng cuối + sửa phép `run.ts:7626` | Nối `runKeHoachTestTests`; T13 → T15 |
| `web/src/modules/test/KeHoachTestTab.tsx` | Viết lại | Khung tab: tiêu đề, chọn loại lớp, chọn lớp |
| `web/src/modules/test/keHoach/LuoiFT.tsx`, `HopSuaTuan.tsx`, `NganXepHangLoat.tsx`, `BangThuong.tsx`, `HopDoiLichThuong.tsx` | Tạo | Task 7–9 |
| `web/src/modules/fasttrack/MockPlanPanel.tsx` | **Xoá** | Chỉ `KeHoachTestTab` import |
| `web/src/modules/cham/LuoiFT.tsx`, `LuoiThuong.tsx`, `MotKyNang.tsx` *(Rc1 tạo)* | Sửa nhỏ | R11: nhãn "Đã hoàn tất" trên dòng + tooltip ô khoá |
| `CODE_MAP.md`, `plan.md` | Sửa | Task 11 |

**Giữ nguyên** (không xoá): `/attempts/no-plan`, `/attempts/bulk-plan`, `planning.ts` — còn phép kiểm và đường cũ
(`dieuHuong.ts:152`) dùng. `MockDetailPage.tsx` (`SkillWeekModal`) không sửa.

---

### Task 0: Chuẩn bị

- [ ] **1. Worktree.** Chỉ làm khi `git log origin/main --oneline | grep -i "rc1"` thấy **merge PR-Rc1**. `git fetch
  origin`, tạo worktree `.claude/worktrees/pr-rc2-ke-hoach-test` nhánh `pr-rc2-ke-hoach-test` **từ `origin/main`**. Không
  checkout nhánh khác trong thư mục chính. `npm ci` nếu thiếu `node_modules`.
- [ ] **2. Chép file kế hoạch này vào nhánh** (`docs/superpowers/plans/2026-09-23-pr-rc2-ke-hoach-test.md`), commit
  `PR-Rc2 (0): ke hoach`.
- [ ] **3. Không có biến Turso** (lệnh `node -e …` như Rc1 Task 0 Step 2 → `sạch`). **Mốc:** `npm test 2>&1 | tail -3` →
  ghi số **B** vào Nhật ký.
- [ ] **4. Đối chiếu lại con trỏ mã sau khi rebase lên main có Rc1.** Mở và ghi vào Nhật ký dòng thật của:
  (a) `saveScore` — chỗ `scoreEditPath` + `require_(SCORE_EDIT)` và chỗ kiểm `lyDo` (RB-5); (b) `saveRegularScore`,
  `reportRegularNoShow`, `regularSheet` (ô môn có `canEdit`, `noShow`, `movedFrom`); (c) `skillCells` dòng `canEdit`;
  (d) `web/src/modules/cham/*` — nơi đọc `canEdit`, nơi mở `SuaDiemCoLyDo`; thành phần ⓘ; (e) `shared/domain/chamDiem.ts`
  có `kiemLyDo`, `tuanKeTiep`; (f) Rc1 có sửa `skillSchedule.ts`/`permissions.ts` không (kế hoạch Rc1 nói **không**);
  (g) `standing.ts` sau Qa. Lệch **hình dạng** (không phải lệch dòng) so với kế hoạch này → ghi Nhật ký, chọn cách khớp
  Rc1, không dựng song song.

---

### Task 1: Luật thuần `shared/domain/keHoachTest.ts` + khung phép kiểm

**Files:** tạo `shared/domain/keHoachTest.ts`, `server/src/tests/keHoachTest.tests.ts`; `shared/domain/index.ts` (+1);
`server/src/tests/run.ts` (+2 dòng trước khối in tổng kết, theo mẫu `runKhungTests`: truyền `check, checkAsync, assert,
assertThrows, conn, TODAY, P, addDays, classId`).

**Hàm (tên chốt, dùng ở mọi Task sau):**
- `type TrangThaiO = 'xong' | 'da-xep' | 'da-doi' | 'chua-xep' | 'khong-yeu-cau'`
- `trangThaiNhom(kn: Array<{ batBuoc: boolean; tuan: string | null; xong: boolean; daDoi: boolean }>): TrangThaiO` —
  không kỹ năng bắt buộc → `khong-yeu-cau`; mọi kỹ năng bắt buộc `xong` → `xong`; có kỹ năng bắt buộc chưa có tuần →
  `chua-xep`; có `daDoi` → `da-doi`; còn lại `da-xep`.
- `NHOM_KY_NANG = { rlw: ['listening','reading','writing'], s: ['speaking'] } as const`
- `tuanDaSo(tuan: (string | null)[]): { tuan: string | null; khac: Array<{ tuan: string; n: number }> }` — tuần nhiều em
  nhất (hoà → sớm hơn); `khac` là các tuần còn lại kèm số em.
- `dotDaHoanTat(i: { cheDo: 'ielts_band' | 'ratio'; kn: Array<{ batBuoc: boolean; huy: boolean; coDiem: boolean;
  coDau: boolean }>; chuNhatCuoi: string | null; homNay: string }): boolean` — luật Q2 (`coDau` chỉ tính khi `ielts_band`;
  không có kỹ năng bắt buộc nào → `false`; `chuNhatCuoi` null → `false`; so `homNay > chuNhatCuoi`).
- `tieuDeKeHoach(coFT: boolean, coThuong: boolean): string` — Q10.
- `tomTatXemTruoc(dong: Array<{ hanhDong: 'tao' | 'doi' | 'giu' | 'loi'; ... }>)` → các câu ngắn cho bước 4:
  `"{n} em chưa có → W3/W4 OCT"`, `"{n} em W2 OCT → W3 OCT (đổi)"`, `"{n} em không xếp được"` (nhận hàm `tuanLich`
  qua tham số hoặc `homNay`, không tự đọc ngày).
- `laVaoMuon(vaoLop: string | null, khaiGiang: string | null): boolean` — Q15.

- [ ] **Phép kiểm (6):** mỗi hàm một phép, gồm các biên: `dotDaHoanTat` — FT có `-` + hết CN → true; lớp thường có `-`
  → false; đúng Chủ nhật → false, thứ Hai sau → true; kỹ năng huỷ phần thi → false. `trangThaiNhom` đủ 5 trạng thái.
  `tuanDaSo` hoà chọn tuần sớm. `tieuDeKeHoach(true,false) === 'Kế hoạch Mock Test'`.
- [ ] `npm run check` → **B+6**. Commit `PR-Rc2 (1): luat thuan ke hoach Test`.

---

### Task 2: T15 chặn trùng tuần · T9 mục tiêu tại thời điểm thi

**Files:** `server/src/fasttrack/skillSchedule.ts`, `server/src/students/standing.ts`, `server/src/tests/run.ts`
(phép `:7625`), `keHoachTest.tests.ts`.

- [ ] **T15.** Tách phần so với đợt lân cận của `checkSkillWeekMove` (`skillSchedule.ts:435-487`) thành
  `export function checkWeekVsNeighbours(i: { cycleId: number; attemptNo: number; excludeAttemptId: number | null;
  newWeekStart: string }): ScheduleCheck`; `checkSkillWeekMove` gọi lại nó (giữ nguyên chữ ký cũ). Luật mới:
  `newWeekStart === o.last_week` (đợt trước) **và** `newWeekStart === o.first_week` (đợt sau) → **blocker**:
  `Trùng tuần {W.. ...} với {MT2}. Hai đợt không thi cùng một tuần.` Cách đúng 7 ngày → giữ **warning**. Mã tuần trong câu
  dùng `tuanLich` (hiện dùng `weekInfo().code` có năm — sai G-6). Nhãn đợt lớp thường: `Giữa khoá`/`Cuối khoá` 
  `label` :459 đang ghi "đợt {n}").
- [ ] **Sửa phép cũ** `run.ts:7626` "T13 · Dời MT2 TRÙNG đúng tuần đầu MT3 chỉ CẢNH BÁO" → "T15 · … bị CHẶN" (assert
  `blockers.length > 0`). Số phép không đổi. Ghi Nhật ký.
- [ ] **Phép mới (2):** "T15 · Trùng tuần cuối của đợt trước cũng CHẶN" · "T15 · Đợt chưa tạo (MT4 mới) xếp trùng tuần
  MT3 → `checkWeekVsNeighbours` chặn".
- [ ] **T9.** `standing.ts` dòng gọi `evaluateAttempt(cycle.target_score ?? null, …)` → `evaluateAttempt(
  a.target_at_attempt ?? cycle.target_score ?? null, …)`. **Phép (1):** lấy một lượt FT có điểm; đổi tạm
  `learning_cycles.target_score` lên 9.0; `standingFor([sid]).sosLevel` (và `expectation` nếu Qa đã thêm) phải bằng
  `attempts.resultOf(a)` (vốn dùng `target_at_attempt`, `attempts.ts:155`); trả lại giá trị cũ trong `finally`.
- [ ] Phép cũ khác hỏng vì luật T15 (seed có hai đợt cùng tuần?) → sửa **dữ liệu phép kiểm/seed** cho hợp luật, không nới
  luật; ghi Nhật ký. `npm run check` → **B+9**. Commit `PR-Rc2 (2): T15 chan trung tuan, T9 muc tieu tai thoi diem thi`.

---

### Task 3: R11 — đợt hoàn tất thì chỉ Quản lý sửa (máy chủ)

**Files:** tạo `server/src/fasttrack/hoanTat.ts`; sửa `attempts.ts`, `regular.ts` *(sau Rc1)*; `keHoachTest.tests.ts`.

**`hoanTat.ts`:**
- `dotHoanTatMany(attemptIds: number[], today: string): Map<number, { hoanTat: boolean; chuNhatCuoi: string | null }>` —
  **3 câu SQL cho cả danh sách** (lượt + `programmes.scoring_mode`; `attempt_skills` JOIN `report_periods`; điểm), rồi
  gọi `dotDaHoanTat`. `coDiem`: FT = mọi ô nhập của kỹ năng đánh giá có `band` (writing: `writing1` **và** `writing2`);
  lớp thường = `raw_score` không null. `coDau` (FT) = `no_show_period_id` không null **hoặc** `sit_status = 'absent'`.
  `huy` = `sit_status = 'cancelled'`. `chuNhatCuoi` = `week_end` lớn nhất của kỹ năng bắt buộc chưa huỷ.
- `dotHoanTat(attemptId, today)` = bản một phần tử.
- `quyenSuaSauHoanTat(p, classId): boolean` = `can(PLAN_WEEK, {classId}) || can(SCORE_OVERRIDE, {classId})`.

**Nối vào (luật dễ sai — viết đúng thứ tự này):**
```ts
// saveScore / saveRegularScore / reportRegularNoShow — NGAY SAU khi đọc lượt, TRƯỚC `if (!path) require_(SCORE_EDIT…)`
const hoanTat = dotHoanTat(attemptId, today);
let path = a.class_id ? scoreEditPath(p, a.class_id, skill) : null;
if (hoanTat.hoanTat) {
  if (!a.class_id || !quyenSuaSauHoanTat(p, a.class_id)) {
    throw forbidden(`Đợt này đã hoàn tất (hết Chủ nhật ${ngay(hoanTat.chuNhatCuoi)}). Chỉ Quản lý sửa được điểm — nhờ Quản lý hiệu chỉnh, kèm lý do.`);
  }
  path = 'override';            // nhật ký score.override / regular.score.override
} else if (!path) { require_(…như cũ…); }
```
  Lý do bắt buộc: RB-5 của Rc1 đã đòi khi ô có điểm — đợt hoàn tất thì ô luôn có điểm; **kiểm lại** sau rebase rằng
  đường Quản lý cũng đi qua `kiemLyDo`. Nhật ký: thêm `sauHoanTat: true` vào `after` (cạnh `lyDo`). `saveRegularScore`
  hiện không nhận `today` → thêm tham số cuối `today = demoToday()`.
- [ ] **Ô lưới:** `skillCells` (`attempts.ts:242`): nhận `hoanTat` của lượt (truyền từ nơi gọi, dùng
  `dotHoanTatMany` cho cả bảng ở `classScoreSheet` — không gọi lẻ từng dòng); `canEdit = … && (hoanTat ?
  quyenSuaSauHoanTat : editable.includes(skill))`; thêm trường `khoa: boolean` vào `SkillCell` (:184). Tương tự ô môn của
  `regularSheet`. Dòng (lượt) trả thêm `hoanTat: boolean`, `chuNhatCuoi`.
- [ ] **Phép (4):** (a) FT: đợt đủ điểm, `today` sau Chủ nhật → GVBM đúng môn bị chặn `/đã hoàn tất/`; cùng đợt,
  `today` = Chủ nhật đó → GVBM sửa được (có `lyDo`). (b) Quản lý (`P.mbManager`) sửa được đợt hoàn tất khi có `lyDo`,
  không có `lyDo` thì bị chặn; `audit_logs` dòng mới nhất `action = 'score.override'` và `after_json` chứa `sauHoanTat`.
  (c) Lớp thường: bốn môn có điểm + hết CN → GVBM bị chặn, Quản lý sửa được; ô có `-` (Rc1) **không** làm đợt hoàn tất.
  (d) `classScoreSheet` của Quản lý: ô đợt hoàn tất `canEdit = true, khoa = true`; ô đợt chưa hoàn tất `canEdit = false`;
  GVBM thì ngược lại.
- [ ] `npm run check` → **B+13**. Commit `PR-Rc2 (3): R11 dot hoan tat chi Quan ly sua, co nhat ky`.

---

### Task 4: Dữ liệu và thao tác lưới Fast Track

**Files:** tạo `server/src/keHoach/keHoachTest.ts`; `routes/index.ts` (mở khối); `keHoachTest.tests.ts`.

- `danhSachLop(p, { branchId })` → `{ tieuDe, lop: Array<{ id; code; loai: 'ft' | 'thuong'; soHv; chuaCoLichTiep:
  number }> }` — chỉ lớp `can(PLAN_WEEK, {classId})`; `chuaCoLichTiep` (FT) đếm như `noPlanQueue` (`planning.ts:124`, em
  không có lượt `planned`) nhưng **một câu SQL gom theo lớp**.
- `luoiFT(p, classId, today)` → `{ classId; classCode; cot: number[]; hang: Array<{ studentId; ten; ma; vaoMuon;
  dot: Record<number, { attemptId: number | null; trangThaiDot: string | null; rlw: ONhom; s: ONhom }> }> }` với
  `ONhom = { trangThai: TrangThaiO; tuan: string | null; them: number; doiTu: string | null; giuNguyen: string[] }`
  (`them` = số tuần khác trong nhóm, Q6; `doiTu` = tuần trước lần dời gần nhất, cho chữ `dời → {tuần}`). **Không N+1:**
  một câu HV đang học, một câu lượt (`status != 'cancelled'`), `loadSkillRows(ids)` (`skillSchedule.ts:164`), một câu
  điểm, một câu `attempt_schedule_history` lọc `action = 'skill_week_moved_absence'`. `require_(PLAN_WEEK, {classId})`.
- `kiemTuanNhom(p, { attemptId, nhom, periodId })` → `{ blockers; warnings; seDoi: string[]; giuNguyen: Array<{ skill;
  vi: string }> }` — **không ghi**; mỗi kỹ năng bắt buộc của nhóm: đã có điểm / đã thi / huỷ phần thi → `giuNguyen`;
  còn lại chạy `checkSkillWeekMove`.
- `datTuanNhom(p, { attemptId, nhom, periodId, force, reason })` — trong `tx`: `setSkillWeek` từng kỹ năng `seDoi`
  (bỏ kỹ năng đã ở đúng tuần). Blocker → ném lỗi, không ghi gì.
- `xepMoi(p, { studentId, attemptNo, rlwPeriodId, sPeriodId, force })` — trong `tx`: `checkWeekVsNeighbours` cho cả hai
  tuần (đợt chưa có) → blocker ném; warning mà không `force` → ném câu có "Xác nhận lại" (cùng mẫu `setSkillWeek`, để
  giao diện bắt được như `SkillWeekModal`); rồi `createAttempt(p, { studentId, attemptNo, periodId: rlwPeriodId })`
  (`attempts.ts:888`), `plan_source = 'manual'` như `bulkPlan` (`planning.ts:103`), và nếu `sPeriodId !== rlwPeriodId`
  thì `setSkillWeek(… 'speaking', sPeriodId, { force: true })` (đã kiểm ở trên).
- **Routes** (một khối, mọi route `requireAuth` + `maybeSimulateSaveFailure()` ở route ghi): `GET /ke-hoach-test/lop`,
  `GET /ke-hoach-test/ft/:classId`, `POST /ke-hoach-test/nhom/kiem`, `POST /ke-hoach-test/nhom`, `POST
  /ke-hoach-test/xep-moi`.
- [ ] **Phép (4):** (a) `luoiFT` MB-FT 101: số hàng = số HV đang học; mỗi đợt đủ `rlw`, `s`; lượt đã xong → `xong`;
  GVBM gọi → bị chặn quyền. (b) `datTuanNhom` nhóm RLW đổi L, R, W, **không** đổi S; kỹ năng đã có điểm nằm ở
  `giuNguyen` và giữ tuần. (c) `kiemTuanNhom` trùng tuần đợt sau → blocker (T15), `datTuanNhom` ném và **không** đổi
  gì. (d) `xepMoi` MT mới hai tuần RLW/S khác nhau → lượt mới có L/R/W ở tuần 1, S ở tuần 2; trùng tuần MT trước → ném,
  **không** còn lượt nào được tạo (kiểm đếm `assessment_attempts` trước/sau).
- [ ] `npm run check` → **B+17**. Commit `PR-Rc2 (4): du lieu va thao tac luoi Ke hoach Test FT`.

---

### Task 5: Xếp lịch hàng loạt (máy chủ) — xem trước + lưu một phần (R9, R9b)

**Files:** `keHoach/keHoachTest.ts`, `routes/index.ts` (cùng khối), `keHoachTest.tests.ts`.

- `xepHangLoat(p, { classId, attemptNo, studentIds, rlwPeriodId, sPeriodId, force, xemTruoc })` → `{ dong: Array<{
  studentId; ten; hanhDong: 'tao' | 'doi' | 'giu' | 'loi'; tu: { rlw: string | null; s: string | null }; den: { rlw; s };
  canhBao: string[]; loi: string | null }>; daLuu: number }`.
  - Mỗi em: không có lượt `attemptNo` → `tao` (kiểm bằng `checkWeekVsNeighbours`); có lượt chưa xong → `doi` (kiểm bằng
    `kiemTuanNhom` hai nhóm); lượt đã xong hoặc đã ở đúng hai tuần → `giu`; có blocker → `loi` với câu blocker.
  - `xemTruoc: true` → **không ghi gì**, trả `dong`.
  - Lưu: **mỗi em một `tx` riêng** (gọi `xepMoi` hoặc `datTuanNhom` hai nhóm); lỗi của một em ghi vào `loi` của dòng đó,
    em khác vẫn lưu. `canhBao` mà không `force` → dòng đó `loi` = câu cảnh báo (giao diện cho tick "vẫn xếp").
    **AN-5:** giao dịch mới có thể bị `chanGiaoDichNeuSapHetGio` (`db.ts:156`) từ chối khi sắp hết 10 s — lỗi đó cũng
    rơi vào `loi` của dòng, không làm hỏng cả lô → người dùng bấm lưu lại phần còn lỗi (R9b). Ghi một dòng
    `writeAudit({ action: 'ke_hoach.hang_loat', entityType: 'class', … after: { daLuu, loi } })`.
- Route `POST /ke-hoach-test/hang-loat`.
- [ ] **Phép (3):** (a) `xemTruoc` không ghi (đếm `assessment_attempts` + `attempt_skills.updated_at` trước/sau bằng
  nhau) và phân đúng `tao`/`doi`/`giu`. (b) Lưu một phần: một em cố ý có lượt trước ở đúng tuần RLW (→ blocker) — em đó
  `loi`, các em khác `daLuu`; gọi lại với tuần khác cho đúng em đó → lưu được (R9b). (c) Em đã có lượt `attemptNo` ở
  tuần cũ → `doi`, sau lưu ở tuần mới; lượt đã xong → `giu`, không đổi.
- [ ] `npm run check` → **B+20**. Commit `PR-Rc2 (5): xep lich hang loat — xem truoc, luu mot phan giu hang loi`.

---

### Task 6: Lớp thường — xếp theo lớp (R12, R14 phần lịch)

**Files:** `keHoach/keHoachTest.ts`, `normal/regular.ts` (`planRegularTests`), `skillSchedule.ts` (`hasScore`),
`routes/index.ts`, `keHoachTest.tests.ts`.

- `bangThuong(p, { branchId }, today)` → `{ lop: Array<{ classId; code; chuongTrinh; tuanKhoa: string | null;
  thieuKhaiGiang: boolean; hvChuaCoLich: number; dong: Array<{ kind: 'progress' | 'final'; nhan: 'Giữa khoá' | 'Cuối
  khoá'; mon: Record<'listening'|'reading'|'writing'|'speaking', { tuan: string | null; deXuat: string | null; xong:
  boolean; daCham: number; tong: number; khac: Array<{ tuan: string; n: number; ten: string[] }> }> }> }> }`.
  - `tuan`/`khac` qua `tuanDaSo` trên các lượt `kind` của HV **đang học** (dấu `-` của Rc1 đã dời một em → em đó vào
    `khac`: đây là **R14 phần lịch**).
  - `deXuat` = `classProgressMany([...])` (`classes/schedule.ts:222`) → `progressWeekStart` / `finalWeekStart` (Q13);
    chỉ điền khi lớp chưa có lượt `kind` nào.
  - `tuanKhoa` = `tuanKhoa(currentWeek, totalWeeks)` khi đủ số.
  - Một lượt đọc cho mọi lớp trong phạm vi (không N+1).
- `doiLichThuong(p, { classId, kind, skill, periodId, studentIds?, force, xemTruoc })` → `{ dong: Array<{ studentId;
  ten; tu; den; loi: string | null; giu: string | null }>; daLuu }` — mỗi lượt `kind` của HV đang học (hoặc trong
  `studentIds`): ô đã có điểm → `giu` ("đã có điểm"); còn lại `setSkillWeek` (mỗi em một `tx`, như Task 5).
- **`hasScore`** (`skillSchedule.ts:505`): điều kiện thành `(band IS NOT NULL OR raw_score IS NOT NULL)` — hiện lớp
  thường có điểm vẫn dời được (Rc1 đã ghi nhận ở Nhật ký Task 2 (e)).
- **`planRegularTests`** (`regular.ts:226`): tuần mốc lấy từ `classProgress(classId).progressWeekStart /
  finalWeekStart`; thiếu cả hai → giữ câu lỗi "Lớp chưa có ngày khai giảng…". Không đổi gì khác (vẫn bỏ qua em đã có
  bài — gọi lại để tạo cho **HV mới** là an toàn).
- Routes: `GET /ke-hoach-test/thuong`, `POST /ke-hoach-test/thuong/doi-lich`. Nút "Tạo lịch" dùng lại
  `POST /regular/classes/:classId/plan` (:929).
- [ ] **Phép (4):** (a) MB-FOU 12: hai dòng Giữa/Cuối × 4 môn; lớp thường mới chưa có bài → `deXuat` bằng đúng tuần mà
  `planRegularTests` tạo ra sau đó. (b) R14: `reportRegularNoShow` một em môn L → ô L có `khac` = 1 em ở tuần sau, ô R
  không đổi. (c) `doiLichThuong` môn W cả lớp → mọi lượt `kind` có W ở tuần mới, L/R/S giữ; em đã có điểm W → `giu`.
  (d) `setSkillWeek` từ chối dời môn lớp thường đã có `raw_score`.
- [ ] `npm run check` → **B+24**. Commit `PR-Rc2 (6): lop thuong xep theo lop, doi lich mot mon`.

---

### Task 7: Web — khung tab + lưới FT + hộp sửa tuần (R9, R10, T15)

**Files:** viết lại `web/src/modules/test/KeHoachTestTab.tsx`; tạo `keHoach/LuoiFT.tsx`, `keHoach/HopSuaTuan.tsx`;
xoá `web/src/modules/fasttrack/MockPlanPanel.tsx`.

- [ ] **Khung** (`KeHoachTestTab`): gọi `/ke-hoach-test/lop?branchId=`. Đầu thẻ: tiêu đề `tieuDe` + ⓘ (luật: màu ô, RLW/S,
  lịch mặc định "MT1 ở tuần học thứ 6, MT2 thứ 12, MT3 thứ 16", trùng tuần bị chặn, cách một tuần phải xác nhận). Có cả
  hai loại lớp → `HangTab` nhỏ `Fast Track · Lớp thường` (tham số `loai`). FT: ô chọn `Lớp: {mã} ▾` (tham số `classId`,
  mặc định lớp đầu tiên có `chuaCoLichTiep > 0`, nếu không có thì lớp đầu), bên phải `{n} học viên` và nút
  `Xếp lịch hàng loạt…`. Giữ `branchId` như `TestPage.tsx:37`.
- [ ] **`LuoiFT`** (mockup 05b (1)): bảng `table-layout: fixed` + `colgroup` (G-2), cột đầu `Học viên` (tên + dòng phụ
  `vào muộn` khi có), mỗi cột MT một ô chứa **hai khối** `RLW · W3 SEP` / `S · W4 SEP`. Màu theo `trangThai` bằng token
  có sẵn (`var(--accent-line)` xanh dương đã xếp; xanh lá đã xong; vàng đã dời; viền đứt chưa xếp) — không màu cứng
  ngoài hệ. `xong` → chữ + `✓` nhỏ (G-1, tooltip "Đã thi"), bấm mở `/mock-test/{attemptId}`. `da-doi` → `S · dời → W3
  SEP`. `them > 0` → `+1` nhỏ, tooltip từng kỹ năng. `khong-yeu-cau` → `—` tooltip "Đợt này không kiểm tra {kỹ năng}".
  Lượt chưa có → `+ xếp` (một nút cho cả đợt). Một dòng chú giải 4 chip ≤ 60 ký tự dưới bảng. Bọc `overflow-x-auto`
  trong thẻ (G-11).
- [ ] **`HopSuaTuan`** (R10, mockup "Sửa lịch · Bùi Thảo Vy · MT3 · RLW"): hộp nhỏ neo dưới ô (dùng `Modal` có sẵn nếu
  neo khó, ghi Nhật ký); `WeekPicker scope="planning"` (`web/src/ui/Filters.tsx:105`); mỗi lần đổi tuần gọi
  `/nhom/kiem` → dòng trạng thái **một dòng**: blocker (chữ đỏ, nút Lưu tắt), warning (chữ vàng, nút đổi thành `Vẫn xếp
  vào tuần này`), không gì → `Không trùng tuần {MT kề}.` + dòng `Speaking vẫn giữ W4 SEP.` khi sửa RLW (và ngược lại);
  `giuNguyen` → `Giữ L — đã có điểm.` Ô lý do không bắt buộc. Chế độ `+ xếp`: hai `WeekPicker` RLW/S + ô tick `cùng
  tuần RLW` (Q7, mặc định tuần sau), gọi `/xep-moi`. Lưu xong `invalidate('/ke-hoach-test')`, `'/attempts'`,
  `'/cham'`.
- [ ] Xoá `MockPlanPanel.tsx` (grep không còn import). `npm run check` xanh (số phép giữ). Commit `PR-Rc2 (7): luoi Ke
  hoach Test FT, hop sua tuan`.

---

### Task 8: Web — Ngăn xếp lịch hàng loạt, 5 bước một màn (phương án A)

**Files:** tạo `keHoach/NganXepHangLoat.tsx`.

- [ ] `Drawer` (`web/src/ui/Drawer.tsx`) `width="max-w-md"` để lưới vẫn thấy bên trái; tiêu đề `Xếp lịch hàng loạt ·
  {lớp}`. Năm khối đánh số từ trên xuống (không nút "Tiếp"):
  1. **Đợt** — chip `MT{n}` theo Q8.
  2. **Học viên** — `{a}/{b} đã chọn`; mặc định mọi em chưa thi xong MT{n}; mỗi em một dòng có ô tick; em đã có lịch
     MT{n} ghi nhỏ `đã có · W2 OCT`; em đã thi xong MT{n} mờ, không tick được.
  3. **Tuần** — `RLW ‹ W3 OCT ›` · `S ‹ W4 OCT ›` · ☐ `cùng tuần RLW` (Q7).
  4. **Xem trước** — gọi `POST /hang-loat` `xemTruoc: true` mỗi khi bước 1–3 đổi (trễ ~300 ms, huỷ lượt cũ); hiện
     `tomTatXemTruoc` + danh sách dòng `loi` (tên + câu lỗi, một dòng) + dòng có `canhBao` với ô tick `Vẫn xếp các em
     có cảnh báo` (→ `force`).
  5. **Lưu** — nút `Lưu lịch cho {n} em` (n = số dòng `tao` + `doi`, trừ `loi` chưa xử lý).
- [ ] **R9b:** sau khi lưu: toast `Đã xếp {daLuu} em`; nếu còn `loi` → **ngăn không đóng**, bước 2 chỉ còn các em lỗi
  (đã tick sẵn), mỗi em hiện câu lỗi; người dùng đổi tuần rồi lưu lại. Hết lỗi → đóng, lưới tải lại.
- [ ] 375px: ngăn rộng toàn màn, các khối xếp dọc, nút cao ≥ 44px. `npm run check` xanh. Commit `PR-Rc2 (8): ngan xep
  lich hang loat 5 buoc`.

---

### Task 9: Web — Lớp thường theo lớp (10b §4)

**Files:** tạo `keHoach/BangThuong.tsx`, `keHoach/HopDoiLichThuong.tsx`.

- [ ] **`BangThuong`**: bảng cột `Lớp · Bài · L · R · W · S · (thao tác)` (G-2, cột môn rộng bằng nhau, tooltip đầy đủ
  tên môn G-7). Mỗi lớp **2 hàng** (Giữa khoá, Cuối khoá); ô `Lớp` gộp 2 hàng: mã + dòng phụ `{chương trình} ·
  {tuanKhoa}` (vd `FOU · W8/8`). Ô môn: `tuanLich(tuan)`; `xong` → `✓` nhỏ; chưa có bài → `đề xuất W4 SEP` chữ mờ;
  `khac.length` → dòng phụ vàng `{n} HV → W1 OCT` (tooltip tên em). Cột thao tác hàng chưa xong: nút `Dời một môn`.
  Lớp chưa có bài hoặc `hvChuaCoLich > 0` → nút `Tạo lịch theo đề xuất` (gọi `/regular/classes/:id/plan`, toast
  `Đã tạo {created} bài`). `thieuKhaiGiang` → chữ mờ `Chưa có tuần khai giảng` + link hồ sơ lớp (không thêm nút mới ở
  hồ sơ lớp).
- [ ] **`HopDoiLichThuong`** (Q11): tiêu đề `Đổi lịch · {lớp} · {Giữa khoá}`; Môn (4 chip, chọn sẵn khi mở từ ô);
  `WeekPicker scope="planning"`; Học viên: mặc định `Cả lớp ({n})`, bấm `Chọn học viên…` mở danh sách tick; xem trước
  gọi `/thuong/doi-lich` `xemTruoc: true` → `{n} em W3 SEP → W4 SEP` + các dòng `giu`/`loi`; Lưu. Lỗi một phần → giữ
  hộp với các em lỗi (như R9b).
- [ ] Bấm ô môn (hàng chưa xong) = mở hộp với môn đó. Ô `xong` không bấm được (tooltip "Đã chấm xong").
- [ ] 375px: bảng cuộn ngang trong thẻ. `npm run check` xanh. Commit `PR-Rc2 (9): Ke hoach Test lop thuong theo lop`.

---

### Task 10: Web — R11 trên lưới chấm (file Rc1)

**Files:** `web/src/modules/cham/LuoiFT.tsx`, `LuoiThuong.tsx`, `MotKyNang.tsx` *(sau Rc1 — đường dẫn thật đối chiếu
ở Task 0)*.

- [ ] Dòng có `hoanTat` → nhãn `Info` nhỏ `Đã hoàn tất` cạnh tên (tooltip `Hết Chủ nhật {dd/mm}. Chỉ Quản lý sửa điểm,
  phải ghi lý do.`). Ô `khoa && !canEdit` → tooltip cùng câu thay cho "Bạn không được phân công kỹ năng này". Quản lý:
  ô `khoa && canEdit` mở thẳng `SuaDiemCoLyDo` (ô đã có điểm — đúng đường RB-5). Không đổi gì khác của lưới.
- [ ] `npm run check` xanh. Commit `PR-Rc2 (10): R11 tren luoi cham`.

---

### Task 11: Tài liệu

- [ ] `CODE_MAP.md`: thêm `shared/domain/keHoachTest.ts`, `server/src/keHoach/keHoachTest.ts`,
  `server/src/fasttrack/hoanTat.ts`, `web/src/modules/test/keHoach/*`; bỏ `MockPlanPanel.tsx`; ghi "Kế hoạch Test chỉ
  gọi lại `createAttempt` / `setSkillWeek` / `planRegularTests`".
- [ ] `plan.md`: tick R9, R9b, R10, R11, R12, R14 (phần lịch), T9, T15; một dòng nhật ký ngày làm. `docs/…/kiem-ke…`:
  không sửa (planning cập nhật).
- [ ] Commit `PR-Rc2 (11): CODE_MAP, o tick plan.md`.

---

### Task 12: Nghiệm thu — kiểm đủ, bấm thử một lần, PR

- [ ] **1.** `npm run check` → xanh, **≈ B+24** (lệch ±3 do chia phép → ghi Nhật ký). 
- [ ] **2. Không migrate:** `git diff origin/main...HEAD --stat -- server/src/schema.sql server/src/migrate.ts` → rỗng.
  `git diff origin/main...HEAD --stat` **không** có file nào trong cột "File KHÔNG được chạm" ở bảng đầu.
- [ ] **3. Chạy thử** (DB riêng, cổng 4187/5387, theo bộ nhớ "Máy chủ dev trong worktree"; **không** `preview_start`):
  `KIEM="$(node -e "console.log(require('os').tmpdir())")/pr-rc2-kiem.sqlite"`; `PISA_DB="$KIEM" npm run seed`;
  `vite.kiem.config.ts` tạm (port 5387, proxy `/api` → `http://127.0.0.1:4187`, **không commit**);
  `npm run build:server && PISA_DB="$KIEM" PORT=4187 npm run dev:api` + `npx vite --config vite.kiem.config.ts`.
  Playwright kênh Chrome. Tài khoản: `DEMO.md`.
- [ ] **4. Bấm thử một lượt** (ghi kết quả từng ý vào Nhật ký, ảnh `thiet-ke/anh/pr-rc2/`):
  - **Quản lý MB, 1440px:** Test › Kế hoạch Test → tiêu đề đúng Q10; `Fast Track · Lớp thường`. Lưới MB-FT 101: ô xanh
    lá/xanh dương/vàng/nét đứt đúng nghĩa; bấm ô RLW đã xếp → hộp sửa, chọn tuần trùng MT kế tiếp → **chặn**, chữ đỏ,
    Lưu tắt; chọn tuần cách một tuần → vàng + `Vẫn xếp vào tuần này`; lưu tuần hợp lệ → ô đổi, S giữ nguyên. `+ xếp` một
    em → hai tuần RLW/S. `Xếp lịch hàng loạt…` → 5 khối trên một màn, lưới vẫn thấy; xem trước đúng số em "chưa có" /
    "đổi"; cố ý chọn tuần làm một em lỗi → lưu → ngăn giữ đúng em lỗi, sửa tuần, lưu lại được.
  - **Lớp thường:** MB-FOU 12 hai hàng × L R W S, tuần dạng `W3 SEP`, cột lớp `FOU · W8/8`; bấm ô W → đổi tuần cả lớp;
    `Dời một môn` → chọn 1 em → chỉ em đó sang tuần mới, ô hiện `1 HV → …`. Ghi `-` ở lưới chấm (Rc1) cho một em → quay
    lại Kế hoạch Test thấy em đó ở tuần sau (R14).
  - **R11:** chọn (hoặc làm cho) một đợt đủ điểm đã qua Chủ nhật: GVBM mở lưới → ô khoá, tooltip đúng câu, nhãn `Đã hoàn
    tất`; Quản lý mở cùng lưới → sửa được qua hộp lý do; hồ sơ đợt › Lịch sử thấy lý do.
  - **GV:** không thấy tab Kế hoạch Test; gõ thẳng `/test/ke-hoach` → về tab mặc định.
  - **375px (Quản lý):** lưới FT cuộn ngang trong thẻ, trang không cuộn ngang; ngăn hàng loạt toàn màn, nút ≥ 44px;
    bảng lớp thường không tràn.
  - Không thấy chữ ISO, "Normal", "tuần 5", ⚠ sai nghĩa.
  Xong: dừng tiến trình, xoá `vite.kiem.config.ts`; `git add thiet-ke/anh/pr-rc2/`.
- [ ] **5. Rebase + PR.** `git fetch origin && git rebase origin/main` (xung đột `routes/index.ts`, `shared/domain/index.ts`,
  `run.ts` → giữ cả hai khối), `npm run check` lại. `git push -u origin pr-rc2-ke-hoach-test`; `gh pr create` tiêu đề
  `PR-Rc2 · Kế hoạch Test`, thân: tóm tắt theo Task, bảng Q1–Q16, số phép B → B+n, **"Không có migrate"**, ảnh,
  "Chuyển cho PR khác", dòng cuối `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. **Không tự merge.**
  Báo planning (tiếng Việt đơn giản): Quản lý xếp lịch Test trên một lưới cả lớp, bấm ô là sửa tuần, trùng tuần với đợt
  khác thì máy chặn; xếp nhiều em một lần có xem trước, em nào lỗi thì giữ lại để sửa; lớp thường xếp theo lớp, máy đề
  xuất tuần theo chương trình; đợt đã xong và qua Chủ nhật thì chỉ Quản lý sửa điểm, có ghi lý do.

---

## Chuyển cho PR khác

- **PR-S3:** nhãn đợt "đợt {n}" còn ở câu lỗi khác của `skillSchedule.ts`/`absence.ts` (ngoài `checkWeekVsNeighbours`);
  `SkillWeekModal` (`MockDetailPage.tsx:583`) còn `SectionNote` dài + mã tuần `period.code` có năm → đổi `tuanLich` và ⓘ.
- **PR-Z2c:** đo `GET /ke-hoach-test/ft/:classId` và `POST /hang-loat` (20 em) trên Turso; lô chạm giới hạn 10 s thì
  phần còn lại rơi vào hàng lỗi (R9b) — chấp nhận được, nhưng ghi số đo.
- **Planning:** kiểm kê §1.4 tick R9–R12, R14 phần lịch; ghi T9, T15 xong.

## Mâu thuẫn nguồn ↔ mã (đã xử lý)

| # | Mâu thuẫn | Xử lý |
|---|---|---|
| 1 | R11 "chỉ Quản lý sửa" ↔ Quản lý không có quyền nhập điểm (`seed/data.ts`, `run.ts:699`) | Q1 — mở đường **riêng** cho đợt hoàn tất, không cấp `score.override` |
| 2 | T15 "trùng MT kế tiếp thì chặn" ↔ phép `run.ts:7626` và `checkSkillWeekMove` coi trùng là cảnh báo | Q3 — đổi luật + phép kiểm |
| 3 | `planRegularTests` tính mốc từ `start_date` ↔ `classProgress` tính từ `start_period_id` + mốc đã sửa | Q13 — một nguồn |
| 4 | `hasScore` chỉ nhìn `band` ↔ lớp thường lưu `raw_score` → dời được môn đã có điểm | Task 6 |
| 5 | `MockPlanPanel` ghi "Kế hoạch Test chỉ dành cho FT" (`planning.ts:135`, `MockPlanPanel.tsx:58`) ↔ đặc tả §3.5 có lớp thường | Đặc tả thắng; lớp thường xếp theo lớp (Task 6, 9); `noPlanQueue` giữ nguyên nghĩa FT |
| 6 | Câu chặn thứ tự đợt dùng `weekInfo().code` (có năm) và "đợt {n}" cho lớp thường | Task 2 sửa trong hàm mới |

## Nhật ký thực thi

| Ngày | Task | Ghi chú |
|---|---|---|
| 23/09 | 0 | Worktree `.claude/worktrees/pr-rc2-ke-hoach-test` + nhánh `pr-rc2-ke-hoach-test` từ `origin/main` (`56b8373`, có PR-Rc1 #70). `npm ci` xong. Không có biến Turso (sạch). `npm test` → **B = 866**. |
| 23/09 | 2 | T15 (trùng tuần → CHẶN cả hai chiều) làm lộ một phép kiểm 10.6 cũ phụ thuộc luật cũ: `[10.6] Quản lý từ chối…` dùng `addDays(demoToday(), N*7)` cố định cho cả tuần xếp ban đầu (`absentSkill`, force qua cảnh báo) lẫn tuần khôi phục (`restoreCancelledSkill`) — với đợt seed ngẫu nhiên mà `takePlannedAttempt()` trả về, các mốc đó tình cờ trùng/vượt tuần MT3, MT4 của cùng lộ trình. Sửa **dữ liệu phép kiểm** (không nới luật T15): thêm `cleanWeeksAhead()`/`weekClashesFor()` trong `run.ts` — dò tuần sạch quanh mốc cũ (lùi trước, tiến sau) bằng chính `checkWeekVsNeighbours` — cho cả `absentSkill` (tuần xếp + tuần dời lần đầu) và lệnh khôi phục trong test đó. `npm run check` → **B+9 = 875** (đúng dự kiến kế hoạch). |
| 23/09 | 3 | R11 làm lộ 4 phép kiểm CŨ ("quyền theo vai trò", "xoá điểm về trống") lấy `status='done' LIMIT 1` bất kỳ ở MB-FT 101 rồi gọi `saveScore` không truyền `today` (mặc định `demoToday()` thật) — đợt đó tình cờ đã hoàn tất thật (đúng nghĩa R11, không phải lỗi). Sửa **dữ liệu phép kiểm**: thêm `chuNhatCuoiOf(attemptId)` trong `run.ts`, truyền đúng Chủ nhật của đợt làm `today` cho các lệnh `saveScore` không liên quan tới R11 (biên `homNay === chuNhatCuoi` vẫn chưa hoàn tất, đúng luật `dotDaHoanTat`). `khoa` trong `SkillCell` cố tình = `hoanTat` (không trừ theo quyền người xem) — Quản lý đọc đúng cặp `canEdit=true, khoa=true` (khoá-nhưng-sửa-được-qua-lý-do) theo đúng chữ kế hoạch dòng "d". `skillCells` nhận `hoanTat` tuỳ chọn (mặc định `{hoanTat:false}`) — CHỈ wire đủ ở `classScoreSheet` (FT) và `regularSheet` (lớp thường), hai nơi kế hoạch nêu tên; 4 lời gọi `skillCells` khác (worklist Cần chấm, `classes.ts` ×2, `scoreDebt.ts`) CHƯA gắn `hoanTat` — `canEdit` ở các màn đó có thể sai ý một nhịp, nhưng `saveScore`/`saveRegularScore` (nguồn chặn thật) đã khoá đúng nên không có lỗ hổng, chỉ là UI có thể cho bấm rồi báo lỗi khi lưu. Ghi lại để planning cân nhắc một PR nhỏ nối tiếp nếu cần. `npm run check` → **B+13 = 879** (đúng dự kiến kế hoạch). |
| 23/09 | 4 | `checkWeekVsNeighbours` so theo MIN/MAX tuần của các kỹ năng bắt buộc (`first_week`/`last_week`), không so từng tuần lẻ — dựng dữ liệu phép kiểm cho T15 phải neo vào MỘT MỐC THẬT (tuần của MT1/MT3 lấy qua `week.periodById`), không đoán offset tuần từ `demoToday()`/`TODAY` (khoảng cách từ hôm nay tới lịch MT của một lộ trình demo không cố định — dò lệch hướng dễ luôn rơi vào phía "đã vượt", không bao giờ tìm ra tuần sạch). Thêm `tuanSachTu(cycleId, attemptNo, anchorWeekStart, huong)` trong `keHoachTest.tests.ts` — dò TỪ một mốc thật, một chiều. `xepMoi`'s so hai tuần (RLW, S) DỪNG NGAY ở tuần đầu tiên có blocker (không gộp cả hai) — phép kiểm "trùng đợt vừa tạo" nhận được thông báo "không được xếp trước phần cuối…" (từ nhánh so cứng thứ tự) thay vì "Trùng tuần…" dù hai tuần trùng khít với đợt trước — cả hai đều đúng nghĩa T15 (chặn), chỉ khác câu chữ theo việc kỹ năng nào bị so trước; assert bằng cụm chung `/không được xếp|không thi cùng/` thay vì chữ "Trùng tuần" cứng. `xepMoi` cũng thêm import `currentCycle` (`fasttrack/cycles.ts`) thay vì tự viết lại truy vấn "lộ trình đang chạy" — khớp đúng cách `createAttempt` chọn lộ trình, để phép kiểm và hàm thật luôn nhìn về cùng một lộ trình. `npm run check` → **B+17 = 883** (đúng dự kiến kế hoạch). |
| 23/09 | 5 | Gộp phép (a) và (c) của Task 5 thành MỘT `check` (cùng bộ dựng dữ liệu ba học viên tao/doi/giu, tách ra thì lặp lại gần hết phần dựng) → tổng chỉ **B+19 = 885**, lệch −1 so với B+20 kế hoạch ghi; đủ ba nhánh `tao`/`doi`/`giu` × cả xem trước lẫn lưu thật, không thiếu ý nào của (a)/(c). Dùng số MT ảo (90, 92, 93) và tuần xa (2029–2030) để tránh chạm lịch thật của học viên demo — học được từ Task 2/4: neo theo số/tuần *chắc chắn trống* thay vì đoán từ dữ liệu seed. `npm run check` → **B+19 = 885**. |
| 23/09 | 0 | Đối chiếu con trỏ mã sau Rc1 (lệch **dòng**, không lệch **hình dạng** — giữ nguyên cách khớp của kế hoạch): (a) `saveScore` ở `attempts.ts:1205` (không phải :1141); `path`/`require_(SCORE_EDIT)` ở :1221-1225; `kiemLyDo` (RB-5) ở :1367. (b) `saveRegularScore` ở `regular.ts:329` (khớp); `reportRegularNoShow` ở :437 (khớp); `regularSheet` ở :680 (không phải :537 — Rc1 chèn khối tra `sos_cases` ở giữa file); `canEdit`/`noShow`/`movedFrom` của ô môn ở :826-832. `saveRegularScore` hiện không nhận `today` — đúng như kế hoạch dự đoán. (c) `skillCells` ở `attempts.ts:242` (khớp); `canEdit` ở :350 (không phải :349). (d) `web/src/modules/cham/*`: `canEdit` đọc ở `LuoiThuong.tsx:67,242,364` và `MotKyNang.tsx:188,239`; `SuaDiemCoLyDo` **chưa được dùng** trong `cham/*` (chỉ tồn tại ở `fasttrack/ScoreEntry.tsx`) — Task 10 phải tự thêm import; thành phần ⓘ (`NutLuat`) đang cục bộ trong `ChamDiemPage.tsx:208` → Task 7 tách ra `web/src/ui/NutLuat.tsx` theo đúng phương án dự phòng của kế hoạch. (e) `shared/domain/chamDiem.ts`: `tuanKeTiep` :91, `kiemLyDo` :106 (khớp). (f) `git diff 37786fd..HEAD -- skillSchedule.ts permissions.ts` rỗng — Rc1 **không** sửa hai file này, khớp giả định; `checkSkillWeekMove` vẫn nguyên ở :435-487, `setSkillWeek` :525, `hasScore` :505. (g) `standing.ts` sau Qa: dòng gọi `evaluateAttempt(cycle.target_score ?? null, …)` ở :238-241 (không phải ~:227, lệch do Qa thêm code phía trên); `s.expectation` đã có ở :247. Ngoài ra: `createAttempt` ở `attempts.ts:946` (không phải :888); route `/attempts/bulk-plan` ở `routes/index.ts:383-388` (không phải :377) — khối `/ke-hoach-test/*` sẽ chèn ngay sau dòng 388; `run.ts:7626` (phép "T13 · Dời MT2 TRÙNG…") khớp đúng dòng kế hoạch ghi. |
