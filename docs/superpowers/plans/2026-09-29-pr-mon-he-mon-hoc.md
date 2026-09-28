# PR-MON · Hệ môn học + hai khung FT / Lớp thường — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Tên môn qua **một hàm** theo chương trình (`tenMon`/`tenMonNgan`: FOU `L · R · G+V · P`, BE/ELE `L · R · W · S`, Pre FOU `Tổng hợp`,
FT `L · R · W1 · W2 · S`); kỹ năng GV "phụ trách được" chỉ `L · R · W1 · W2 · S` (cũ `writing` → `writing1 + writing2`, migrate có chạy thử);
**Pre FOU chạy thật** một ô `tong_hop` (lịch lượt, nợ điểm, lưới laptop + điện thoại, bảng điểm lớp, Kế hoạch Test chỉ Cuối khoá, Lịch Test,
Case "Tổng hợp", kết quả **% tổng**) rồi mới mở tạo lớp Pre FOU; nguyên nhân theo môn (G+V → Từ vựng/Ngữ pháp, P → **Phát âm**, Tổng hợp →
nhóm chung); công tắc **Fast Track · Lớp thường** đầu Lịch Test (dải số, Nợ, lớp), Kế hoạch Test, Công việc; không trộn môn hai khung (MH5).
**Architecture:** Luật thuần ở `shared/domain` (thêm vào `normal.ts`, `cases.ts`, `phanTich.ts`, `chamDiem.ts`, `phanCong.ts`) có phép
kiểm; `skillShort`/`tenKyNang`/`caseTopicLabel`/`skillLabel` (web) thành lớp mỏng gọi `tenMon*` (một nguồn). Máy chủ: bộ kỹ năng của
một lượt lớp thường = bộ của chương trình (bảng `programme_skills`, qua `allProgrammes()`), FT giữ `ASSESSED_SKILLS`. Migrate riêng
`server/src/migrate/prMon.ts` (một dòng gọi, T78) + `npm run chay-thu:mon` chỉ đọc. Web: một thành phần `CongTacKhung` dùng lại ở Test
và Công việc. **Không** thêm cột nhãn môn vào CSDL (Q1).
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); phép kiểm `server/src/tests/*`
(harness `check()` của `run.ts`), chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.1b Q27-13 · §3.2 T55, T56, T57, T60, T78 · §5.7 MH1–MH9 ·
§5.8 M-09 · §6.6 PF1, PF2, PF6 · §7.2, §7.3 · §8 dòng PR-MON + luật chung + đoạn Migrate · §10 · rà `thiet-ke/ra-27-09/` (40 mã của
PR-MON ở §4.9 — bảng phủ cuối file) · K5 §5 dòng PR-MON, K5 §6 D9, D12 · Nhật ký kế hoạch PR-LOP (Task 2 "Chuyển PR-MON", Task 10).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-MON** · đợt 2 · làn **D** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-mon-he-mon-hoc` · `.claude/worktrees/pr-mon-he-mon-hoc` (từ `origin/main`) |
| Cổng thử | API **4187** · Vite **5387** (không dùng 4000/5173; A 4157/5357 · B 4167/5367 · C 4177/5377 chạy song song) |
| Model | **Fable 5.1 · High** · phương án B: **Opus 5.5 · High** |
| Người rà | **Opus 5.5**, session riêng (T52) — session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Có** — `server/src/migrate/prMon.ts`: `user_skills` `writing`/`prep_writing` → `writing1` + `writing2`, `pronunciation` → `speaking` (MH1, K5-29). **Không** thêm dòng `PREFOU`/`tong_hop` (PR-LOP đã làm, T78) và **không** cột nhãn môn (Q1). Lệnh chạy thử `chay-thu:mon` (K5 §5) |
| Skill thiết kế | Đầu phiên gõ **`/ponytail lite`** (PR có giao diện). **impeccable**: `adapt` ở Task 8 (điện thoại Pre FOU), `layout` ở Task 9 (công tắc khung đầu trang), `audit` rồi `polish` ở Task 12. Không `init`/`document`/`hooks on`; không taste-skill. Không có mockup riêng — bám thành phần PR-NEN (`BoLocDoan`, `NutChon`, `KhungPanel`) và mockup 19 (M1, M3, M4 ghi chú tên môn) |
| Phụ thuộc | PR-LOP (#112, **đã merge**: chương trình Pre FOU, `moRongPhanCong`, cờ `CHO_TAO_PRE_FOU`). Không chặn bởi PR đợt 2 nào; chồng file với MT/DUYET/NHAP ở bảng dưới |
| Không làm | Nhãn SOS lớp thường FOU/BE/ELE → `%`/`n/4 môn` (T58 — PR-LT2b); bỏ hẳn "Cả hai" ở Phân tích (T60 — PR-Pb2); luật Giữa/Cuối khoá mới (LT2a/b); ngăn Xếp lịch hàng loạt khung lớp thường (K4-19 — PR-XLMT); menu ⋯ ô lưới lớp thường (K4-32 — PR-XLMT); chip/nhóm bảng Học viên & Lớp (K2-03 — PR-HVL dùng `CongTacKhung` của PR này) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-MON (n): …`.
- Treo quá 10 phút → quét `node … tests/run.js` còn sống, tắt hết, chạy lại **một** lần. Trước khi báo xong: tắt 4187/5387, quét lại, dọn file tạm.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px **một lần** ở Task 12 (Playwright kênh Chrome, đăng nhập demo
  `POST /api/demo/session {userId}`: **Quản trị id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang
  id 9**), ảnh trước/sau `thiet-ke/anh/pr-mon/`. Chạy song song: `PORT=4187` cho API, Vite tạm cổng 5387 proxy về 4187.
- Không chạm Turso, không deploy. Gặp mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- **🛑 Cửa dừng:** migrate và `chay-thu:mon` trên **bản chính** chỉ **chủ sản phẩm** chạy (`TRIEN_KHAI.md`, mục "Lệnh cho buổi deploy").
  Session code **không** chạy, **không** đề nghị chạy hộ.

### Ranh giới file với ba PR đợt 2 chạy song song (A PR-DUYET · B PR-MT · C PR-NHAP)

Thứ tự merge bắt buộc của đợt: **MT trước NHAP**. PR-MON không bắt buộc thứ tự; **khuyến nghị merge sau MT** (MT sửa luật lõi lịch/nợ
điểm). Ai merge sau thì rebase và gỡ theo bảng: **file chỉ thêm khối → giữ cả hai**.

| File | PR khác (dự kiến theo đặc tả) | PR-MON chỉ được sửa |
|---|---|---|
| `server/src/fasttrack/skillSchedule.ts` | **MT**: MT lịch sử (`pendingSkillsOf`, `skillScoreDeadline`, M3), dời do vắng | `ensureSkillRows`/`sortRows` (:127-155), `skillScheduleOf` (:186-203, thêm tham số), kiểm mã ở `setSkillWeek` (:542) |
| `server/src/fasttrack/attempts.ts` | **MT**: `createAttempt` :967-1017, huỷ/mở lại :1125-1150, `saveScore`; **cờ `lichSu` truyền vào `viewSkill` ngay trong `regularSkillViews` (:399)** | chỉ `regularSkillViews` (:391-410: tham số `skills` + vòng lặp) + 1 dòng ở nơi gọi :603. Xung đột ở :399 → giữ **cả** cờ `lichSu` của MT **và** vòng `skills` |
| `server/src/worklist/scoreDebt.ts` | **MT**: `NOT_DEBT` thêm `lich_su` (:20), bỏ lượt `a.lich_su = 1` (:67) | chỉ nhánh lớp thường: vế `CASE WHEN … 'ratio'` (:45-50) + vòng `REGULAR_SKILLS` (:71-78) |
| `server/src/cham/canCham.ts`, `web/src/modules/test/LichTestTab.tsx`, `lichTest/*` | **MT**: SELECT `a.lich_su`, bỏ dòng lịch sử (:380-419, :471-491, :511-515), nhãn "dời từ W3 SEP" (`dungLuiLich` :115-166), `KhoiNo` | máy chủ: thêm `chuongTrinh`, `boMon` vào `LopLichTest`/`DongNo` + `tongQuanKhung` (đếm trong **cùng** vòng MT đã lọc lịch sử); web: hàng lọc đầu trang + lọc `no`/`DaiSo` theo khung + tên môn |
| `server/src/students/standing.ts`, `classes/phanTichLop.ts`, `students/profile.ts`, `shared/domain/hanhTrinh.ts` | **MT**: `mocKeTiep` (standing :207-217), `expectationFor(route)` (standing :238, phanTichLop :73, profile :71), nhãn lượt FT (hanhTrinh) | standing :225-236, :257-259 · phanTichLop :55-64 · profile :332 · hanhTrinh nhánh lớp thường :358-370 |
| `shared/domain/cases.ts`, `web/src/modules/cases/CasePanel.tsx`, `StudentDetailPage.tsx` | **DUYET**: chữ PA :824-932, `CasePanel` :66, :240-270, `StudentDetailPage` :238 · **MT**: lý do `luot_da_huy` :493-499 | `cases.ts` :15-386 · `CasePanel` :69-72 · `StudentDetailPage` bảng kỹ năng + :588-590 |
| `server/src/platform/accounts.ts`, `web/src/modules/platform/AccountsAdmin.tsx` | **DUYET**: `register` :126, `AccountsAdmin` :70 | `setSkills`/`ALL_SKILLS` :160-168, :363, hàm mới cuối file · form :259-300, ngăn :203-205 |
| `shared/domain/tenLop.ts`, `server/src/seed/build.ts` | **MT** `LUAT_LO_TRINH_HIEN` :73-79 · **NHAP** `INSERT INTO students` :90-99 | `tenLop.ts:5` · `build.ts` :258, :305 |
| `server/src/keHoach/keHoachTest.ts`, `shared/domain/keHoachTest.ts`, `web/src/modules/test/keHoach/*` | **MT**: MT mặc định, số MT, `luoiFT`/`xepMoi` (FT) | chỉ phần lớp thường: `luoiThuong` (:447-521), `xepMoiThuong` (:523-560), nhánh thường của `xetMotEm`/`xepHangLoat`; web: `HopKyNang` khi `loai === 'thuong'`, `LuoiKeHoach` cột lớp thường |
| `server/src/worklist/mywork.ts` | **DUYET** xoá `decide`/`decide_move`, `summary.approval`; **MT** `missing_data` | thêm trường `khung` vào `WorkItem` + **một** hàm gán cuối `myWork`; đổi chữ tên môn ở :238, :350, :844 |
| `web/src/modules/congViec/HoTroHocVienTab.tsx` | **DUYET** bỏ ô "Loại việc", thêm chip nhóm (K1-30) | chỉ chèn `<CongTacKhung>` **đầu** hàng lọc (:115) + lọc `nhom` theo khung |
| `shared/domain/tongQuan.ts` | **DUYET** `NHOM_CUA_LOAI` (:31-37) | chỉ `chonDiemDangChuY` (:121-130) |
| `server/src/cases/cases.ts` | **DUYET** thông báo (:691-720, :1031-1036) | :462 (kiểm mã nguyên nhân), :1557, :1914 (nhãn chủ đề + `chuongTrinh`) |
| `server/src/normal/regular.ts` | **MT** `saveRegularScore` lượt lịch sử (:363-390) | `evaluateRegular` (:168-201), `regularResultOf` (:224-231), nhãn :723, `regularSheet` :863, :903 |
| `server/src/worklist/metrics.ts` | **MT** K5-54 (mẫu số độ phủ) | chỉ `SKILLS_FOR_METRIC` (:204) |
| `classes/intake.ts`, `IntakePanel`/`StudentManagePanel` | **NHAP** Thêm học viên | **không sửa** (`createClass` đã đọc bảng từ PR-LOP) |
| `server/src/migrate.ts` | cả ba | **một** import + **một** dòng `migratePrMon(conn, applied);` **cuối** danh sách (sau `migratePrLop` :457 và sau dòng của PR đã merge) |
| `server/src/tests/run.ts`, `shared/domain/index.ts`, `package.json`, `CODE_MAP.md`, `TRIEN_KHAI.md`, `plan.md`, `server/src/seed/*`, `server/src/tests/tocDoDuong.ts` | cả ba | chỉ thêm dòng đăng ký/export/script/ghi chú/kịch bản demo |

## Global Constraints

- **Một nguồn tên môn (MH2):** chỉ `shared/domain/normal.ts` được tra `REGULAR_SKILL_LABEL[`/`SKILL_SHORT[`/`ENTRY_SKILL_LABEL[` để ra tên
  môn; mọi nơi khác gọi `tenMon(ct, o)` / `tenMonNgan(ct, o)` (hoặc `skillShort`/`tenKyNang`/`skillLabel` khi **chắc chắn** là FT hoặc
  không có chương trình). Phép kiểm quét ở Task 7.
- **Chương trình lấy từ dữ liệu, không đoán:** `programme_code` của lớp (lượt, bảng điểm, Lịch Test) hoặc của lộ trình (hồ sơ HV, Case).
  Không suy từ tên lớp (K2 §4d). Thiếu → `null` → tên chung (`W`, `S`).
- **FT không đổi:** mọi thay đổi bộ môn chỉ ở nhánh lớp thường (`scoring_mode = 'ratio'`); FT giữ `ASSESSED_SKILLS` (lịch) và
  `ENTRY_SKILLS` (điểm, Case).
- **Không lộ chữ máy:** `PREFOU`, `tong_hop`, `writing1`, `gv`, `phat_am`, mã nguyên nhân, ISO, lệnh npm không hiện ra màn/câu lỗi.
- **MH3:** tên môn riêng lớp thường chỉ ở bài test, lưới chấm/bảng điểm, hồ sơ lớp, hồ sơ HV, Kế hoạch Test/Lịch Test khung lớp thường,
  xuất Excel. **Không** đưa vào bộ lọc; khung Lớp thường **không có bộ lọc môn**.
- **Tinh tế:** công tắc khung dùng `BoLocDoan` (đang chọn ≠ nút chính); số `tabular-nums`, căn phải; một hàng lọc, xuống dòng ở màn hẹp;
  ô bấm ≥ 44 px trên điện thoại.
- **SQL:** chỉ `?` (libsql-Turso bỏ qua tham số đặt tên, `db.ts` cấm); mọi câu ghi trong `tx()`; `UNION` ≤ 20 vế; không thêm câu SQL
  mỗi dòng (N+1) — bộ môn đọc từ `allProgrammes()` (nhớ trong request).
- **Luật thuần có phép kiểm:** `server/src/tests/prMon.tests.ts` (tạo ở Task 1, `runPrMonTests(t)`, đăng ký **cuối** `run.ts`).
- **Giữ hành vi:** phép kiểm cũ so chữ cũ (`Writing`/`W` của FOU) thì sửa kỳ vọng (cùng điều kiện, không xoá); số phép kiểm không giảm.
- **Ngày nghiệp vụ:** `demoToday()` / `useNgayNghiepVu().homNay`. Bộ nhớ trình duyệt: `localStorage` bọc `try/catch`, trang chạy đúng khi
  không đọc được.

### Hướng dẫn riêng cho model thực thi (Fable 5.1)

1. **Grep trước, sửa sau, grep lại:** Task 6 và 7 có lệnh grep cố định — chép kết quả (số dòng trước/sau) vào Nhật ký. Không "sửa theo trí
   nhớ".
2. Chỗ luật dễ sai đã có **mã mẫu** ở Task 1, 2, 3, 4 — chép đúng, chỉ đổi tên biến nếu mã thật khác.
3. Không đổi chữ ký hàm dùng chung ngoài bảng Interfaces. Thêm tham số thì đặt **cuối**, có giá trị mặc định giữ hành vi cũ — trừ
   `regularSkillViews` (bắt buộc, để mọi nơi gọi phải truyền bộ môn).
4. **🛑 Dừng hỏi planning** nếu: (a) một phép kiểm cũ của **FT** đổi kết quả; (b) > 15 phép kiểm cũ vỡ trong một Task; (c) Task 0 thấy
   PR-MT đã merge và đổi chữ ký `ensureSkillRows`/`regularSkillViews`/`scoreDebtCells`; (d) cần thêm cột/bảng CSDL.
5. Hai câu chủ sản phẩm chưa quyết (cuối file) — **làm theo khuyến nghị**, không dừng.

## Task 0 · Nhánh, mốc, chép kế hoạch

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-mon-he-mon-hoc -b pr-mon-he-mon-hoc origin/main`. Gõ `/ponytail lite`. Kế
  hoạch chưa có trên `main` thì `git checkout origin/<nhánh kế hoạch đợt 2> -- docs/superpowers/plans/2026-09-29-pr-mon-he-mon-hoc.md`.
- [ ] `git log origin/main --oneline -8` → Nhật ký: DUYET/MT/NHAP đã merge chưa (🛑 4c). `npm ci` (nếu cần) → `npm run check` → **mốc B**.
- [ ] Đối chiếu dòng mã (grep `ensureSkillRows`, `regularSkillViews(`, `scoreDebtCells`, `NHAN_O_TAM`, `CHO_TAO_PRE_FOU`, `ALL_SKILLS`,
  `tuanTheoKyNang`, `THU_TU_MON`) — lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-MON (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần hệ môn (MH2, MH6, MH7, T55, T57, K5-40, K5-41, K5-42, K5-44, K5-47, K1-22)

**Files:** sửa `shared/domain/normal.ts` (:79-103), `shared/domain/cases.ts` (:15-17, :34-36, :50-97, :155-172 `REGULAR_TO_CATEGORY`/
`categoryOf`, :292-297 `IssueBranch`, :311-366 `ISSUE_TAXONOMY`, :383-386), `shared/domain/phanCong.ts` (:5, :17), `shared/domain/phanTich.ts`
(:228-252 `LOI_CHUNG`, `hoKyNang`), `shared/domain/chamDiem.ts` (:54-63), `shared/domain/yThuc.ts` (:74-78), `shared/domain/hocVienLop.ts`
(:28-30); tạo `server/src/tests/prMon.tests.ts`; `run.ts` đăng ký cuối.

**Interfaces:**
```ts
// normal.ts — MH2: MỘT nơi ra tên môn. ct = mã chương trình của lớp/lộ trình (null = không rõ → tên chung).
export function tenMon(ct: string | null | undefined, o: string): string;      // 'FOU','writing' → 'Grammar + Vocabulary'
export function tenMonNgan(ct: string | null | undefined, o: string): string;  // 'FOU','writing' → 'G+V'; 'PREFOU','tong_hop' → 'Tổng hợp'
export function boMonLich(ct: string | null | undefined, skillsBang?: readonly string[] | null): readonly string[]; // FT → ASSESSED_SKILLS
export type Khung = 'ft' | 'thuong';
export function khungCua(scoringMode: string | null | undefined): Khung;        // 'ratio' → 'thuong', còn lại 'ft'
export function kyNangGoiY(ct: string | null | undefined, o: string): readonly string[]; // ô lớp → kỹ năng GV khai (MH6, T55)
// cases.ts
export const CASE_CATEGORIES = ['listening','reading','writing1','writing2','writing','speaking','tong_hop'] as const;
export function caseTopicsFor(ratio: boolean, ct?: string | null): readonly string[];            // PREFOU → ['tong_hop']
export function caseCategoriesFor(scoringMode: string | null | undefined, ct?: string | null): readonly CaseCategory[];
export function caseTopicLabel(topic: string, ct?: string | null): string;                         // = tenMon(ct, topic)
export function nhanhPhanLoai(topic: string, ct?: string | null): IssueBranch['key'] | null;
export function issuesForTopic(topic: string, ct?: string | null): IssueNode[];
// IssueBranch.key thêm 'gv' | 'phat_am' | 'tong_hop'
// chamDiem.ts — MH7: Pre FOU chỉ % tổng
export function ketQuaThuong(i: { dat: number; daCham: number; tong: number; thieu: string[]; tyLe?: number | null; khongChiaMon?: boolean }): { chinh: string; phu: string | null };
// yThuc.ts — K5-47
export function monViPham(ct: string | null | undefined): readonly string[];   // FT: ENTRY_SKILLS · thường: boMonLich · PREFOU: []
```
- [ ] **Mã mẫu `normal.ts`** (đặt ngay dưới `SKILL_SHORT`; `skillShort` đổi thành `(k) => tenMonNgan(null, k)`):
```ts
/** T55: FOU giữ 4 ô chuẩn, chỉ đổi TÊN HIỆN. Pre FOU một ô `tong_hop` (PF6). Chương trình khác: tên chung. */
const TEN_MON_RIENG: Record<string, Record<string, { ten: string; ngan: string }>> = {
  FOU: { writing: { ten: 'Grammar + Vocabulary', ngan: 'G+V' }, speaking: { ten: 'Pronunciation', ngan: 'P' } },
};
const TEN_CHUNG: Record<string, string> = {
  listening: 'Listening', reading: 'Reading', writing1: 'Writing Task 1', writing2: 'Writing Task 2',
  writing: 'Writing', speaking: 'Speaking', tong_hop: 'Tổng hợp',
};
const oChuan = (o: string) => LEGACY_REGULAR_SKILL_MAP[o] ?? o;       // prep_writing → writing, pronunciation → speaking
export function tenMon(ct: string | null | undefined, o: string): string {
  const k = oChuan(o);
  return TEN_MON_RIENG[programmeOf(ct) ?? '']?.[k]?.ten ?? TEN_CHUNG[k] ?? o;
}
export function tenMonNgan(ct: string | null | undefined, o: string): string {
  const k = oChuan(o);
  return TEN_MON_RIENG[programmeOf(ct) ?? '']?.[k]?.ngan ?? SKILL_SHORT[k] ?? o;
}
export function boMonLich(ct: string | null | undefined, skillsBang?: readonly string[] | null): readonly string[] {
  const c = programmeOf(ct);
  if (!c || c === 'FT') return ASSESSED_SKILLS;                       // FT: lịch theo 4 kỹ năng đánh giá (W = W1 + W2)
  return skillsBang?.length ? skillsBang : PROGRAMME_TEMPLATES[c]?.skills ?? REGULAR_SKILLS;
}
export function kyNangGoiY(ct: string | null | undefined, o: string): readonly string[] {
  if (o === 'writing') return ['writing1', 'writing2'];               // BE/ELE W, FOU G+V (T55, MH6)
  return (ENTRY_SKILLS as readonly string[]).includes(o) ? [o] : [];   // tong_hop: GVCN dạy luôn — không gợi ý
}
```
  Sửa chú thích sai ở `REGULAR_SKILLS` (:66-78 "giống nhau ở mọi chương trình" → "FOU/BE/ELE; Pre FOU một ô `tong_hop`").
- [ ] **`cases.ts`:** `caseTopicLabel(topic, ct) = tenMon(ct, topic)` (sửa luôn lỗi trả mã thô `writing` — K5-40); `CASE_CATEGORY_LABEL`,
  `CASE_CATEGORY_SHORT`, `CASE_CATEGORY_SKILL`, `REGULAR_TO_CATEGORY` thêm `tong_hop`; `caseTopicsFor(ratio, ct)` và
  `caseCategoriesFor(mode, ct)`: `ct === 'PREFOU'` → `['tong_hop']`. **Mã mẫu phân loại (T57):**
```ts
export function nhanhPhanLoai(topic: string, ct?: string | null): IssueBranch['key'] | null {
  const c = programmeOf(ct);
  if (topic === 'tong_hop') return 'tong_hop';
  if (c === 'FOU' && (topic === 'writing' || topic === 'prep_writing')) return 'gv';
  if (c === 'FOU' && (topic === 'speaking' || topic === 'pronunciation')) return 'phat_am';
  const k = topic === 'writing1' || topic === 'writing2' || topic === 'prep_writing' ? 'writing' : topic === 'pronunciation' ? 'speaking' : topic;
  return (['listening', 'reading', 'writing', 'speaking'] as const).includes(k as any) ? (k as IssueBranch['key']) : null;
}
export function issuesForTopic(topic: string, ct?: string | null): IssueNode[] {
  const key = nhanhPhanLoai(topic, ct);
  return ISSUE_TAXONOMY.find((b) => b.key === key)?.items ?? [];
}
```
  `ISSUE_TAXONOMY` thêm 3 nhánh **mã mới** (giữ tiền tố `student.`, Q6): `gv` (label `Grammar + Vocabulary`): `student.gv.vocabulary`
  "Từ vựng", `student.gv.grammar` "Ngữ pháp", `other('student.gv.other')` · `phat_am` (label `Pronunciation`): `student.phat_am.sound` "Âm",
  `student.phat_am.stress` "Trọng âm", `student.phat_am.intonation` "Ngữ điệu", `other(...)` · `tong_hop` (label `Tổng hợp`, câu chủ
  sản phẩm #2): `student.tong_hop.language` "Từ vựng / ngữ pháp", `student.tong_hop.receptive` "Kỹ năng nghe – đọc",
  `student.tong_hop.productive` "Kỹ năng nói – viết", `student.tong_hop.focus` "Tâm lý và độ tập trung", `other(...)`. Mã cũ giữ nguyên.
- [ ] **`phanTich.ts`:** `LOI_CHUNG` — `student.gv.grammar` vào Ngữ pháp, `student.gv.vocabulary` vào Từ vựng, `student.tong_hop.language`
  vào cả hai; thêm nhóm `{ khoa: 'phat-am', nhan: 'Phát âm', ma: ['student.speaking.pronunciation', 'student.phat_am.sound',
  'student.phat_am.stress', 'student.phat_am.intonation'] }` (K1-22). `hoKyNang` **không** đổi (`tong_hop` → null là đúng).
- [ ] **`phanCong.ts`:** xoá `NHAN_O_TAM`; `nhan: tenMonNgan(chuongTrinh, k)`.
- [ ] **`chamDiem.ts`:** `khongChiaMon && tyLe != null` → `{ chinh: \`${Math.round(tyLe * 100)}%\`, phu: null }` (làm tròn **chỉ để hiện**;
  đạt/không xét trên tỷ lệ chính xác ở máy chủ). Còn lại như cũ.
- [ ] **`yThuc.ts`:** thêm `monViPham(ct)`; giữ `VIOLATION_SKILLS` (máy chủ nhận dữ liệu cũ) — chỉ **danh sách chọn** đổi (Task 5).
- [ ] `hocVienLop.ts:28` `tenKyNang(k) = tenMon(null, k)`.
- [ ] **Phép kiểm** (`prMon.tests.ts` khối 1): `MON (1) · tenMon/tenMonNgan theo chương trình` — `tenMonNgan('FOU','writing')==='G+V'`,
  `('FOU','speaking')==='P'`, `('FOU','pronunciation')==='P'`, `('BE','writing')==='W'`, `('PREFOU','tong_hop')==='Tổng hợp'`,
  `(null,'writing1')==='W1'`, `tenMon('FOUND','writing')==='Grammar + Vocabulary'` (mã cũ `FOUND`). `MON (1) · boMonLich` — FT/`null` →
  4 kỹ năng đánh giá; `PREFOU` → `['tong_hop']`; `BE` + bảng `['listening']` → bảng thắng. `MON (1) · phân loại theo môn (T57)` —
  `issuesForTopic('writing','FOU')` có `student.gv.grammar`, không có `student.writing.task`; `('speaking','FOU')` có `student.phat_am.stress`;
  `('tong_hop','PREFOU')` ≥ 4 mục; `('writing','BE')` vẫn bộ Writing; `caseTopicLabel('writing')==='Writing'` (không còn mã thô).
  `MON (1) · Pre FOU một hạng mục` — `caseCategoriesFor('ratio','PREFOU')` = `['tong_hop']`, `categoryOf('tong_hop')==='tong_hop'`,
  `CASE_CATEGORY_SKILL.tong_hop==='tong_hop'`. `MON (1) · ketQuaThuong Pre FOU` — `{dat:0,daCham:1,tong:1,thieu:[],tyLe:0.675,
  khongChiaMon:true}.chinh==='68%'`. `MON (1) · oPhanCong FOU dùng tenMonNgan` — nhãn `GVCN L R G+V P`.
- [ ] Xong khi: check xanh; `grep -n "NHAN_O_TAM" -r shared web server` rỗng. Commit `PR-MON (1): luật thuần tên môn, phân loại theo môn, Pre FOU một hạng mục`.

## Task 2 · Migrate `prMon.ts` + `chay-thu:mon` + kỹ năng phụ trách được (MH1, K5-29, K5-46, K5-48, K5-67, K1-51)

**Files:** tạo `server/src/migrate/prMon.ts`, `server/src/migrate/chayThuMon.ts`; sửa `server/src/migrate.ts` (một import + một dòng cuối),
`package.json` (script `"chay-thu:mon": "npm run build:server && node dist-server/server/src/migrate/chayThuMon.js"`),
`server/src/platform/accounts.ts` (:160-168, :363), `server/src/routes/index.ts` (:2025-2032 `/auth/info`; thêm route cạnh :2048),
`server/src/classes/classes.ts` (:766-783 `teacherCandidatesBranch` thêm cột `skills`).

**Interfaces:**
```ts
export function keHoachDoiKyNang(conn: any): { userId: number; ten: string; cu: string[]; moi: string[] }[];  // chỉ đọc
export function demCaseFouNguyenNhanIelts(conn: any): { soCase: number; mau: { caseId: number; hocVien: string; ma: string }[] };
export function migratePrMon(conn: any, applied: string[]): void;
export function setUserSkills(p: Principal, userId: number, skills: string[]): { skills: string[] };  // accounts.ts, ADMIN_CONFIG
// PUT /admin/accounts/:id/skills  body { skills: string[] }
```
- [ ] **Mã mẫu migrate** (chạy lặp được; không tham số đặt tên):
```ts
/** PR-MON (MH1, K5-29, T78): kỹ năng "phụ trách được" chỉ còn L · R · W1 · W2 · S. Mã lớp thường cũ trong `user_skills` đổi sang ô FT. */
export function migratePrMon(conn: any, applied: string[]) {
  tx(() => {
    const truoc = (conn.prepare(`SELECT COUNT(*) AS n FROM user_skills WHERE skill IN ('writing', 'prep_writing', 'pronunciation')`).get() as any).n;
    if (!truoc) return;
    for (const moi of ['writing1', 'writing2']) {
      conn.prepare(`INSERT OR IGNORE INTO user_skills (user_id, skill) SELECT user_id, ? FROM user_skills WHERE skill IN ('writing', 'prep_writing')`).run(moi);
    }
    conn.prepare(`INSERT OR IGNORE INTO user_skills (user_id, skill) SELECT user_id, 'speaking' FROM user_skills WHERE skill = 'pronunciation'`).run();
    conn.prepare(`DELETE FROM user_skills WHERE skill IN ('writing', 'prep_writing', 'pronunciation')`).run();
    applied.push(`Đổi kỹ năng phụ trách được của ${truoc} dòng: Writing lớp thường → W1 + W2 (MH1)`);
  });
}
```
- [ ] `demCaseFouNguyenNhanIelts`: `case_issues ci JOIN sos_cases sc ON sc.id = ci.case_id JOIN learning_cycles lc ON lc.id = sc.cycle_id
  WHERE lc.programme_code IN ('FOU','FOUND') AND (ci.taxonomy_code LIKE 'student.writing.%' OR ci.taxonomy_code LIKE 'student.speaking.%')`
  (≤ 20 dòng mẫu). **Chỉ đọc** — không đổi mã (Q5).
- [ ] `chayThuMon.ts` theo khuôn `chayThuLop.ts` (dừng nếu không có file DB / chưa khởi tạo; chỉ `SELECT`). In: (1) `n` GV sẽ đổi kỹ năng
  + bảng `tên · cũ → mới`; (2) số Case FOU có nguyên nhân kiểu IELTS (giữ mã, để biết); (3) số lớp Pre FOU đang có (phải 0 — `CHO_TAO_PRE_FOU`
  đang tắt trên bản chính); (4) số dòng `class_skills`/`teacher_assignments` ô `writing` ở lớp FT (phải 0 — nếu > 0 báo planning).
- [ ] `accounts.ts`: `ALL_SKILLS = [...ENTRY_SKILLS]` (bỏ `REGULAR_SKILLS`); `setSkills` nhận mã cũ `writing` → tự đổi `writing1` +
  `writing2` (form cũ còn mở trên máy GV). `allSkills` (:363) = `ENTRY_SKILLS`. Thêm `setUserSkills` (require `ADMIN_CONFIG`, `anyScope`),
  gọi `setSkills` trong `tx()`. `/auth/info` `skills: [...ENTRY_SKILLS]`.
- [ ] `teacherCandidatesBranch`: thêm `(SELECT GROUP_CONCAT(us.skill) FROM user_skills us WHERE us.user_id = u.id) AS skills` — một câu,
  không N+1. Phép kiểm N+1 "Danh sách lớp…" không đổi ngưỡng.
- [ ] **Phép kiểm** khối 2: `MON (2) · migrate user_skills` — chèn GV A `writing`, GV B `writing1`+`writing`, GV C `pronunciation`; chạy
  `migratePrMon` **hai lần** → A `writing1,writing2`, B `writing1,writing2` (không trùng), C `speaking`; lần 2 `applied` không thêm dòng.
  `MON (2) · chạy thử chỉ đọc` — `keHoachDoiKyNang` trên DB có dòng `writing` trả đúng người; sau đó bảng không đổi (đếm trước/sau).
  `MON (2) · MH1` — `/auth/info.skills` và `myProfile().allSkills` đúng 5 mã, không `writing`; `setSkills(['writing'])` lưu `writing1,
  writing2`; GV thường gọi `PUT /admin/accounts/:id/skills` → 403. `MON (2) · teacherCandidatesBranch có skills`.
- [ ] Chạy `npm run migrate` trên DB demo worktree rồi `npm run chay-thu:mon` → dán kết quả vào Nhật ký. Commit `PR-MON (2): migrate kỹ năng
  phụ trách được + chạy thử chỉ đọc`.

## Task 3 · Lịch một lượt theo bộ môn của chương trình (K5-38, PF6) + kết quả % tổng (K5-44, MH7)

**Files:** `server/src/fasttrack/skillSchedule.ts` (:127-155, :186-215, :542), `server/src/fasttrack/attempts.ts` (:391-410, :603),
`server/src/fasttrack/absence.ts` (:190), `server/src/classes/classes.ts` (:196, :415), `server/src/normal/regular.ts` (:168-201, :224-231,
:873), `server/src/worklist/scoreDebt.ts` (:71 chỉ truyền tham số — vòng lặp sửa ở Task 4).

**Interfaces:**
```ts
export function boMonCuaLuot(conn: any, attemptId: number): readonly string[];   // skillSchedule.ts — một lượt (màn chi tiết)
export function skillScheduleOf(attempt: {...}, rows: SkillRow[] | undefined, skills: readonly string[] = ASSESSED_SKILLS): Record<string, SkillRow>;
export function regularSkillViews(attempt: any, skillRows: SkillRow[] | undefined, scores: ScoreRow[], today: string, skills: readonly string[]): Map<string, SkillScheduleView>;
export function evaluateRegular(skills: string[], rows: …, ct?: string | null): RegularResult;   // + tyLeTong: number | null
```
- [ ] **Mã mẫu** `ensureSkillRows` (thay điều kiện dừng + vòng lặp + sắp xếp; FT giữ nguyên nhờ `boMonLich`):
```ts
export function boMonCuaLuot(conn: any, attemptId: number): readonly string[] {
  const r = conn.prepare(`SELECT c.programme_code AS ct FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE a.id = ?`).get(attemptId) as any;
  return boMonLich(r?.ct ?? null, programmeByCode(r?.ct)?.skills);
}
// trong ensureSkillRows:
const bo = boMonCuaLuot(conn, attemptId);
if (bo.every((k) => existing.some((r) => r.skill === k))) return sortRows(existing, bo);
... for (const skill of bo) { if (have.has(skill)) continue; INSERT … }
function sortRows(rows: SkillRow[], bo: readonly string[] = ASSESSED_SKILLS) {
  return [...rows].sort((a, b) => (bo.indexOf(a.skill) + 1 || 99) - (bo.indexOf(b.skill) + 1 || 99));
}
```
  `loadSkillRows` giữ `sortRows(v)` (L R W S; `tong_hop` đứng cuối — một mình nên không sao). `setSkillWeek` (:542) và `absence.ts:190`:
  kiểm `boMonCuaLuot(conn, attemptId).includes(skill)` thay `ASSESSED_SKILLS`. Kiểu `SkillRow.skill` nới thành `string` nếu typecheck đòi;
  chỗ FT cần `AssessedSkill` thì ép kiểu **tại chỗ FT**, không nới ngược.
- [ ] `regularSkillViews(…, skills)`: lặp `skills` thay `ASSESSED_SKILLS`, gọi `skillScheduleOf(attempt, rows, skills)`. Năm nơi gọi truyền
  bộ đang có sẵn: `attempts.ts:603` `regularSkills` · `classes.ts:196` `editableOrAll`→ **bộ của chương trình lớp** (không phải bộ sửa được)
  · `classes.ts:415` `prog!.skills` · `regular.ts:873` `prog.skills` · `scoreDebt.ts:71` (Task 4).
- [ ] `evaluateRegular(skills, rows, ct)`: `label: tenMon(ct, skill)`; thêm `tyLeTong` = Σ điểm / Σ tổng **chỉ khi đủ mọi môn** (thiếu →
  `null`, không làm tròn). `regularResultOf` truyền `prog?.code`. Kiểu `RegularResult` thêm `tyLeTong: number | null`.
- [ ] **Phép kiểm** khối 3: `MON (3) · lượt Pre FOU một dòng lịch` — dựng lớp PREFOU (qua `taoLopVaPhanCong`, bật tạm
  `CHO_TAO_PRE_FOU` bằng đường phép kiểm hoặc chèn thẳng lớp) + `planRegularTests` → một lượt `final`; `ensureSkillRows` → đúng **1** dòng
  `tong_hop`; gọi lại lần 2 không chèn thêm; `setSkillWeek(…, 'listening')` → lỗi "Kỹ năng không hợp lệ". `MON (3) · lượt FT vẫn 4 dòng`
  (L R W S, thứ tự cũ). `MON (3) · tyLeTong` — BE 30/40, 20/40, 35/40, 36/40 → `121/160` chính xác; thiếu một môn → `null`; Pre FOU 27/40
  → `0.675`, `sosLevel` như cũ (Pre FOU không có "SOS" trên màn — Task 8).
- [ ] Commit `PR-MON (3): lịch một lượt theo bộ môn chương trình, % tổng`.

## Task 4 · Nợ điểm và các danh sách 4 môn viết tay (K5-39, K5-45 phần standing, PF6)

**Files:** `server/src/worklist/scoreDebt.ts` (:32-52, :70-78), `server/src/students/standing.ts` (:225-236, :257-259),
`server/src/cham/canCham.ts` (:92-98, :331-332), `server/src/worklist/metrics.ts` (:204), `server/src/worklist/tongQuan.ts` (:40),
`server/src/students/profile.ts` (:332), `server/src/phanTich/boQuen.ts` (:32-33), `server/src/phanTich/vanDeHv.ts` (:24),
`server/src/routes/index.ts` (:518-526 `tuanTheoKyNang`), `server/src/seed/build.ts` (:258, :305).

- [ ] **Mã mẫu `scoreDebt.ts`** — vế lọc trước: số ô cần của lớp thường đọc **bảng** (không số 4), môn trong bộ chương trình:
```sql
AND (SELECT COUNT(*) FROM assessment_scores sx
      WHERE sx.attempt_id = a.id
        AND CASE WHEN COALESCE(pg.scoring_mode, '') = 'ratio'
              THEN sx.raw_score IS NOT NULL
                   AND sx.skill IN (SELECT ps.skill FROM programme_skills ps WHERE ps.programme_code = cl.programme_code)
              ELSE sx.band IS NOT NULL AND sx.skill IN ('listening', 'reading', 'writing1', 'writing2', 'speaking')
            END)
    < CASE WHEN COALESCE(pg.scoring_mode, '') = 'ratio'
        THEN (SELECT COUNT(*) FROM programme_skills ps2 WHERE ps2.programme_code = cl.programme_code) ELSE 5 END
```
  Thêm `cl.programme_code` vào `SELECT`. Vòng lớp thường: `const bo = boMonLich(a.programme_code, programmes.get(a.programme_code)?.skills)`
  (`programmes = allProgrammes()` đọc một lần trước vòng) → `regularSkillViews(a, skillRows, scores, today, bo)` → `for (const skill of bo)`.
  Pre FOU: `teacherOf('{lớp}|tong_hop')` = GVCN (PR-LOP gán) → nợ đúng một bài/em.
- [ ] `standing.ts:226`: `allProgrammes().get(cycle.programme_code)?.skills ?? boMonLich(cycle.programme_code)` (một nguồn — bỏ
  `PROGRAMME_TEMPLATES`), truyền `ct` vào `evaluateRegular`; `:258` `required = ratio ? boMonLich(cycle.programme_code, …).length : 4`.
- [ ] `canCham.ts`: `kyNangLabelOf(mode, kyNang, ct)` → `ratio && kyNang.length >= 4 ? 'n môn' : kyNang.map((k) => tenMonNgan(ct, k))`;
  `THU_TU_MON` thêm `WHEN 'tong_hop' THEN 5`. `metrics.ts:204` giữ 4 kỹ năng (chỉ số `hv-duoi-ky-vong-mon` là của khung FT — ghi chú
  một dòng). `tongQuan.ts:40` xử lý ở Task 9. `profile.ts:332` `order` thêm `'tong_hop'`. `boQuen.ts`, `vanDeHv.ts` giữ 4 họ (họ là khung
  FT + BE/ELE; `tong_hop` → null — đúng). `tuanTheoKyNang` nhận thêm `tong_hop`.
- [ ] `seed/build.ts:258, :305`: vòng môn lớp thường lấy `PROGRAMME_TEMPLATES[kind].skills` (seed được dùng hằng số — Q của PR-LOP).
- [ ] **Phép kiểm** khối 4: `MON (4) · nợ điểm Pre FOU` — lớp PREFOU 3 em, tuần thi đã tới, chưa nhập → `scoreDebtCells` đúng 3 ô
  `tong_hop` cho GVCN, **không** ô L/R/W/S; nhập 1 em → 2. `MON (4) · lượt đủ điểm Pre FOU không nạp lại` (câu lọc trước loại lượt đã có
  điểm `tong_hop`). `MON (4) · quét danh sách 4 môn viết tay` — đọc nguồn `server/src/**/*.ts` (trừ `tests/`, `seed/`, `migrate*`) tìm
  `['listening', 'reading', 'writing', 'speaking']` và `'listening','reading','writing','speaking'`; chỉ được phép ở bảng trắng
  `{normal.ts, skills.ts, keHoachTest.ts (KY_NANG_KE_HOACH — FT), metrics.ts:SKILLS_FOR_METRIC, boQuen.ts, vanDeHv.ts, phanTich.ts}`.
- [ ] Commit `PR-MON (4): nợ điểm và danh sách môn theo chương trình`.

## Task 5 · Case, quyền, phân loại theo môn cho Pre FOU và FOU (T56, T57, MH8, M-09, K5-30, K5-41, K5-42, K5-47, K5-57, K3-25)

**Files:** `server/src/cases/owner.ts` (:31), `server/src/cases/cases.ts` (:462, :660), `server/src/normal/regular.ts` (:697-699, :723),
`server/src/normal/regular.ts:127-129` (`caseCategoriesOfCycle`), `server/src/yThuc/violations.ts` (:133), `server/src/phanTich/boQuen.ts`
(:102), `web/src/modules/cases/QuickReport.tsx` (:135-145, :351-356), `web/src/modules/yThuc/RecordViolationPanel.tsx` (:226).

- [ ] **Kiểm (không sửa nếu đúng)** quyền Pre FOU đi qua dòng `tong_hop` của GVCN (PR-LOP `moRongPhanCong`, `intake.ts:589`,
  `classes.ts:924`): `SCORE_EDIT` ô `tong_hop` và `SOS_EDIT` Case `tong_hop` đều qua `hasAssignment(…, 'skill')`. Nơi gọi `SOS_EDIT` truyền
  `skill: CASE_CATEGORY_SKILL[category]` — Task 1 đã thêm `tong_hop`. Không thêm nhánh `teacherAllows` (Mâu thuẫn #2).
- [ ] `refreshRegularOutcome`: `categoryOf('tong_hop')` nay có → Case "Tổng hợp" mở như môn khác (luật tín hiệu hiện hành — T70 đổi ở
  LT2); nhãn mốc `:723` `tenMon(prog.code, skill)`. `caseCategoriesOfCycle(c)` truyền mã chương trình của lộ trình.
- [ ] `cases.ts:462` kiểm mã nguyên nhân bằng `issuesForTopic(topic, ctCuaCase)` (`ctCuaCase` = `programme_code` của lộ trình Case, dự
  phòng `programmeCodeOfCycle`). `:660` `issueBranchOf` tự nhận mã mới (có trong `ISSUE_INDEX`).
- [ ] `owner.ts`: không đổi mã (tra `CASE_CATEGORY_SKILL.tong_hop` → GVCN có dòng `tong_hop`). Phép kiểm xác nhận.
- [ ] Vi phạm (K5-47): `RecordViolationPanel` danh sách môn = `monViPham(ct lớp của em)`, nhãn `tenMon(ct, k)`; Pre FOU **ẩn** ô môn.
  Máy chủ `violations.ts:133` giữ nhận `VIOLATION_SKILLS` (dữ liệu cũ) **và** `tong_hop` bị từ chối.
- [ ] Bỏ quên (K5-57): `boQuen.ts:102` điều kiện "cùng chương trình" đổi thành cùng **khoá họ**: `khoaHo(a) = laLopThuong(a) ?
  (programmeOf(a.programme_code) === 'FOU' ? 'FOU' : 'thuong') : 'ft'` — FOU (G+V) không "trượt liền" với BE (W).
- [ ] `QuickReport.tsx`: chủ đề `caseTopicsFor(ratio, ct)` (Pre FOU một nút "Tổng hợp"), nhãn `tenMonNgan(ct, k)`, nguyên nhân
  `issuesForTopic(topic, ct)`; `ct` lấy từ payload `/students/:id/case-topics` (máy chủ thêm `chuongTrinh`).
- [ ] **Phép kiểm** khối 5: `MON (5) · GVCN Pre FOU nhập điểm và xử lý Case` (M-09) — lớp PREFOU chỉ GVCN: `saveRegularScore(GVCN,
  'tong_hop', 27/40)` qua; GV khác cùng chi nhánh → 403; Case `tong_hop` được mở, `suggestCaseOwner` = GVCN, GVCN ghi nguyên nhân
  `student.tong_hop.focus` qua. `MON (5) · FOU chỉ nhận nguyên nhân G+V` — Case FOU `writing` ghi `student.writing.task` → lỗi,
  `student.gv.grammar` → qua; BE `writing` ngược lại. `MON (5) · vi phạm Pre FOU không có môn`. `MON (5) · bỏ quên không nối FOU → BE`.
- [ ] Commit `PR-MON (5): Case, quyền, phân loại nguyên nhân theo môn`.

## Task 6 · Tên môn phía máy chủ (MH2, MH3, K5-40, K2-09, K2-43, K1-45)

- [ ] Grep **trước** (chép số dòng vào Nhật ký):
  `rg -n "REGULAR_SKILL_LABEL\[|SKILL_SHORT\[|ENTRY_SKILL_LABEL\[|skillShort\(|tenKyNang\(|caseTopicLabel\(" server/src shared -g '!**/tests/**'`.
- [ ] Sửa từng chỗ **có chương trình** sang `tenMon(ct, k)`/`tenMonNgan(ct, k)` (bảng); chỗ chắc là FT giữ (ghi Nhật ký "giữ — FT"):

| Chỗ | Nguồn `ct` |
|---|---|
| `normal/regular.ts:174` (qua `evaluateRegular` — Task 3), `:723`, `:863` `skillLabels` + thêm `monNgan` cùng khoá, `:903` | `prog.code` |
| `cases/signals.ts:157` (`labelOf`) | `programme_code` lớp của tín hiệu (thêm vào `SELECT` sẵn có) |
| `worklist/mywork.ts:238` `duoiKyNang`, `:350`, `:844` | `programme_code` lớp của dòng (các câu đã `JOIN classes` — thêm cột) |
| `worklist/tongQuan.ts:80` | `programme_code` lớp của Case |
| `cham/canCham.ts:451` + `kyNangLabelOf` (Task 4) | `r.programme_code` |
| `classes/phanTichLop.ts:63` | `prog.code` |
| `cases/cases.ts:1557`, `:1914` `topicLabel` + trả `chuongTrinh` | lộ trình của Case |
| `platform/xoaTaiKhoan.ts:156` | `programme_code` lớp (thêm vào truy vấn `theoMon`) |
| `shared/domain/hocVienLop.ts:162` `badgeLop` (thêm tham số `ct`), `:173-194` `nhomGiaoVienBoMon(kyNangLop, phanCong, ct)`, `:108`, `:119`, `:258` | nơi gọi truyền `programmeCode` lớp |
| `shared/domain/hanhTrinh.ts:351` (FT — giữ) và nhánh lớp thường `:358-370` | `a.chuongTrinh` (máy chủ `students/hanhTrinh.ts:190-200` thêm) |
| phiên đăng nhập: danh sách phân công của Header (K1-45) | `programme_code` lớp của phân công — trả `nhanMon` dựng sẵn |

- [ ] Grep **sau**: `REGULAR_SKILL_LABEL[` / `SKILL_SHORT[` chỉ còn ở `normal.ts`. **Phép kiểm** khối 6: `MON (6) · một nguồn tên môn
  (máy chủ)` — quét như trên, bảng trắng `normal.ts`; `MON (6) · FOU trả G+V/P` — `regularSheet` lớp FOU: `skillLabels.writing ===
  'Grammar + Vocabulary'`, `monNgan.speaking === 'P'`; việc Case lớp FOU trong `/my-work` có chữ `G+V`, không `writing`.
- [ ] Commit `PR-MON (6): tên môn theo chương trình phía máy chủ`.

## Task 7 · Tên môn phía web (MH2, MH3, K3-05, K3-25, K3-31, K4-07, K4-22, K2-09, K1-45)

- [ ] `web/src/lib/format.ts`: `skillLabel(s) = tenMon(null, s)`, `skillShort(s) = tenMonNgan(null, s)` (một nguồn). Grep **trước**:
  `rg -n "skillShort\(|skillLabel\(|tenKyNang\(|CASE_CATEGORY_(LABEL|SHORT)\[" web/src` — ghi số dòng.
- [ ] Sửa các chỗ **lớp thường** (còn lại là FT — giữ):

| File | Chỗ | `ct` lấy từ |
|---|---|---|
| `modules/cham/LuoiThuong.tsx` | :148, :307, :444, :453, :459, :468, :491, toast :201-219 | `data.programme.code` |
| `modules/cham/MotKyNang.tsx` | `HangChip` :64-69, `tenMon` :225, :257 | `data.programme.code` (FT: giữ) |
| `modules/classes/BangDiemLopThuong.tsx` | :63 | prop mới `chuongTrinh` từ `TabHocVienLop.tsx:29` (`lop.programmeCode`) |
| `modules/test/lichTest/HangLop.tsx`, `KhoiNo.tsx`, `kieu.ts:42` | `BON_MON` → `l.boMon`; tên | `l.chuongTrinh`, `d.chuongTrinh` (Task 9 thêm vào payload) |
| `modules/students/StudentDetailPage.tsx` | bảng kỹ năng, `RatioAttempts` :588-590 | `chuongTrinh` của lộ trình đang xem (máy chủ thêm vào hồ sơ) |
| `modules/cases/CasePanel.tsx` :69-72, `ThaoTacCase.tsx` (`componentsFor`), `QuickReport.tsx` (Task 5) | tiêu đề ngăn, `componentsFor` | `chuongTrinh` của Case (Task 6) |
| `modules/students/HanhTrinh.tsx` :7-8 | chip lọc, cột tên; Pre FOU một hộp "Tổng hợp", **không** chip lọc | `chuongTrinh` lộ trình |
| `modules/students/StudentsPage.tsx:403`, `ClassRoster.tsx` | tên môn nợ | `programmeCode` dòng lớp |
| `modules/platform/Header.tsx:231` | phân công | `c.nhanMon` (Task 6) |
| `modules/classes/DauTrangLop` (`nhomGiaoVienBoMon`), badge lớp | | `programmeCode` |
| `modules/yThuc/ClassYThucCard.tsx`, `StudentYThucSection.tsx` | môn vi phạm | `tenMon(ct, k)` |
| `modules/worklist/DongTinHieu.tsx` | | `signal.skillLabel` (máy chủ đã đúng) |

- [ ] **Phép kiểm** khối 7: `MON (7) · web không tự tra bảng tên môn` — quét `web/src/**/*.tsx` không còn `REGULAR_SKILL_LABEL[`,
  `REGULAR_SKILL_SHORT[`, `BON_MON`; `LuoiThuong.tsx`/`MotKyNang.tsx` không gọi `skillShort(` (chỉ `tenMonNgan(`).
- [ ] Commit `PR-MON (7): tên môn theo chương trình phía web`.

## Task 8 · Pre FOU chạy thật: lưới, điện thoại, bảng điểm lớp, Kế hoạch Test, Phân tích lớp, Hành trình; mở tạo lớp (PF6, MH7, K2-12, K2-40, K4-16, K3-31, K1-17, D12)

**Files:** `web/src/modules/cham/LuoiThuong.tsx`, `MotKyNang.tsx`, `web/src/modules/classes/BangDiemLopThuong.tsx` (:24-43, :93-104),
`server/src/keHoach/keHoachTest.ts` (:447-521, :523-560), `web/src/modules/test/keHoach/HopKyNang.tsx` (:196-201), `LuoiKeHoach.tsx`,
`server/src/classes/phanTichLop.ts` (:55-64), `web/src/modules/classes/PhanTichLopTab.tsx` (:25-29), `web/src/modules/worklist/HocVienCanHoTro.tsx`
(:37-46), `server/src/worklist/tongQuan.ts` (:114-122), `shared/domain/hanhTrinh.ts` (:358-370), `shared/domain/tenLop.ts:5`,
`server/src/seed/journeys.ts`, `server/src/seed/students.ts`.

- [ ] **Kết quả Pre FOU = % tổng (MH7):** `KetQua` (`LuoiThuong.tsx:441-470`) gọi `ketQuaThuong({ …, tyLe: r.tyLeTong, khongChiaMon:
  programme.code === 'PREFOU' })`; tông màu đạt/chưa đạt (không `sosTone`). Hành trình ghim Pre FOU `Cuối · 68%`; Tổng quan "Học viên cần
  hỗ trợ" Pre FOU `Cuối khoá 55%` (thay "SOS 1"). FOU/BE/ELE **giữ** nhãn cũ (T58 → LT2b, Q4).
- [ ] **Điện thoại (impeccable `adapt`):** `MotKyNangThuong` — bộ môn một phần tử → ẩn `HangChip`, thay bằng dòng tiêu đề
  `Cuối khoá · Tổng hợp`; ô "Tổng số câu của đề" giữ; ô nhập ≥ 44 px, Enter xuống em kế tiếp như cũ. Kiểm 375 px không cuộn ngang.
- [ ] **Bảng điểm lớp (K2-12 phần MON):** bỏ `BAI` cố định + `MON_MAC_DINH`; nhóm cột lấy từ **mốc của chương trình** (máy chủ trả
  `checkpoints` + `skills` của lớp) → Pre FOU một nhóm `Cuối khoá` một cột `Tổng hợp` + cột `%`. Cột `%`/hướng gợi ý cho FOU/BE/ELE → LT2b.
- [ ] **Kế hoạch Test lớp thường (K4-16):** `luoiThuong` trả `cot` theo `prog.checkpoints` (Pre FOU chỉ `final`) và `boMon`; `xepMoiThuong`
  nhận `tuan` theo `boMon` (Pre FOU `{ tong_hop: periodId }`), kiểm "cần chọn tuần cho cả n môn" theo `boMon.length`. Web `HopKyNang`
  lặp `boMon` khi `loai === 'thuong'` (FT giữ `KY`). Không đổi phần FT (bảng ranh giới với MT).
- [ ] **Phân tích lớp (K2-40 phần MON):** `phanTichLop.ts:55` cột theo `prog.checkpoints`, dòng theo `boMon`, nhãn `tenMonNgan`; Pre FOU
  một dòng "Tổng hợp".
- [ ] **Mở tạo lớp:** `CHO_TAO_PRE_FOU = true` (`tenLop.ts:5`). Phép kiểm PR-LOP còn kỳ vọng "Pre FOU chưa mở" → sửa kỳ vọng (cùng
  điều kiện: nay tạo được, `moRongPhanCong` gán `tong_hop`).
- [ ] **Demo D12:** lớp `MB Pre FOU 03` (5 tuần, **chỉ GVCN** Hà), 4 em, Cuối khoá đã có điểm: 1 em 52%, 1 em 64%, 1 em 78%, 1 em chưa
  nhập (nợ). D9: lớp `MB FOU 12` đã có — kiểm hiện `L · R · G+V · P` (không thêm dữ liệu Giữa khoá mới — LT2a).
- [ ] **Phép kiểm** khối 8: `MON (8) · Kế hoạch Test Pre FOU chỉ Cuối khoá` (`luoiThuong` lớp D12: `cot.length === 1`, `boMon ===
  ['tong_hop']`); `MON (8) · xếp mới Pre FOU một tuần` (thiếu tuần → câu lỗi có "1 môn", không "4 kỹ năng"); `MON (8) · tạo lớp Pre FOU`
  (`taoLopVaPhanCong` PREFOU + chỉ GVCN → lớp có `class_skills = tong_hop`, phân công GVCN 2 dòng); `MON (8) · bảng điểm lớp Pre FOU một
  cột`; `MON (8) · % Pre FOU trên hàng HV` (standing: em 52% → nhãn `52%`, không `SOS`). `MON (8) · tốc độ` — thêm dòng
  `/ke-hoach-test/thuong/{lopThuong}` không đổi trần; nếu `tocDoDuong.ts` có chỗ đặt lớp Pre FOU thì thêm một dòng đo `/cham/lich-test`
  cho `GVCN` (trần như dòng hiện có).
- [ ] Commit `PR-MON (8): Pre FOU một ô Tổng hợp ở mọi chỗ, mở tạo lớp Pre FOU`.

## Task 9 · Hai khung Fast Track · Lớp thường (MH4, MH5, T60, K4-05, K1-30, K1-34, K1-07, K1-18, K5-43)

**Files:** tạo `web/src/ui/CongTacKhung.tsx`; sửa `server/src/cham/canCham.ts` (:270-300 kiểu, :421-430, :505-517),
`web/src/modules/test/LichTestTab.tsx` (:124-138, :163-190, :204-240), `web/src/modules/test/KeHoachTestTab.tsx` (:25-60, :105-110),
`server/src/worklist/mywork.ts` (kiểu `WorkItem` :41 + một hàm cuối), `web/src/modules/congViec/HoTroHocVienTab.tsx` (:115),
`server/src/worklist/tongQuan.ts` (:38-44), `shared/domain/phanTich.ts` (:102-112, :202-208).

**Interfaces:**
```ts
// web/src/ui/CongTacKhung.tsx — BoLocDoan hai/ba lựa chọn, nhớ theo máy (localStorage try/catch), URL `loai` thắng.
export function CongTacKhung(p: { trang: 'lich-test' | 'ke-hoach-test' | 'cong-viec'; value: KhungLoc; onChange: (k: KhungLoc) => void;
  dem?: Partial<Record<KhungLoc, number>>; coTatCa?: boolean }): JSX.Element | null;   // chỉ một loại có dữ liệu → null
export type KhungLoc = 'ft' | 'thuong' | 'tat-ca';
export function khungDaNho(trang: string): KhungLoc | null;
// canCham.ts
LopLichTest & DongNo += { chuongTrinh: string | null; boMon: string[] }
LichTest += { tongQuanKhung: Record<Khung, LichTest['tongQuan']> }     // cùng vòng tính, không thêm câu SQL
WorkItem += { khung: Khung | null }                                    // mywork.ts; null = việc không gắn lớp → hiện ở mọi khung
```
- [ ] **Lịch Test (impeccable `layout`, K4-05):** công tắc `Fast Track · n lớp | Lớp thường · n lớp` lên **hàng lọc đầu trang** (cùng hàng
  bộ chọn tuần, trước "Lớp tôi dạy / Tất cả"); áp cho `DaiSo` (`data.tongQuanKhung[loai]`), `KhoiNo` (`no.filter((d) => khung(d) ===
  loai)`) và danh sách lớp. Bỏ `HangTab` cũ ở :219-225 (giữ `NutLuat` lớp thường cạnh công tắc khi `loai === 'thuong'`). Chỉ một loại có
  lớp/nợ → ẩn công tắc. Máy chủ: đếm `tong/conPhaiCham/quaHan/no` tách theo `mode` trong **cùng** vòng hiện có; `tongQuan` cũ giữ (tổng
  hai khung) cho nơi khác đọc.
- [ ] **Kế hoạch Test:** thay `HangTab` :108 bằng `CongTacKhung` (đã đứng đầu trang); `loai` nhớ theo máy.
- [ ] **Công việc (K1-30 phần khung, K1-34):** `myWork` gán `khung` bằng **một** câu `SELECT c.id, p.scoring_mode FROM classes c LEFT JOIN
  programmes p …` cho tập `classId` của các dòng (chia lô ≤ 400). `HoTroHocVienTab`: `CongTacKhung coTatCa` (mặc định **Tất cả** — T60
  "Việc vẫn gộp", Q3) đứng **đầu** hàng lọc; lọc `nhom` theo khung (dòng `khung === null` luôn hiện); số trên chip hạn đếm theo khung.
- [ ] **Tổng quan / Phân tích — không trộn (MH5, K1-07, K1-18 phần MON):** `tongQuan.ts:40` chỉ đẩy ứng viên "môn dưới kỳ vọng" khi
  `f.ct === 'ft'`; `cotKyNangFor(ct)` trả `[]` khi `ct !== 'ft'` (khung Lớp thường không cột môn — MH3; "Cả hai" không cột trộn).
  `kyNangTooltip` bỏ nhánh `ca-hai`. Không đổi mặc định "Cả hai", không bỏ lựa chọn này (T60 Phân tích → PR-Pb2, Q2).
- [ ] **Phép kiểm** khối 9: `MON (9) · Lịch Test tách khung` — tuần có lớp FT + lớp FOU: `tongQuanKhung.ft.tong + tongQuanKhung.thuong.tong
  === tongQuan.tong`; mọi `no` có `chuongTrinh`; `LopLichTest` FOU có `boMon` 4 môn, Pre FOU `['tong_hop']`. `MON (9) · my-work có khung`
  — dòng nhập điểm lớp FOU `khung === 'thuong'`, lớp FT `'ft'`; số câu SQL `/my-work` không tăng quá 1 (so trần `tocDoDuong.ts`).
  `MON (9) · Tổng hợp Test không cột môn khi Lớp thường/Cả hai` (`cotTongHopFor('thuong')` không có khoá `kn:`). `MON (9) · CongTacKhung`
  — đọc nguồn: có `try` quanh `localStorage`, dùng `BoLocDoan`.
- [ ] Commit `PR-MON (9): công tắc hai khung ở Test và Công việc, không trộn môn hai khung`.

## Task 10 · Tài khoản, Quản trị, gợi ý phân công (MH1, MH6, MH9, T55, K1-45, K1-47, K1-51, K1-54)

**Files:** `web/src/modules/platform/ProfilePage.tsx` (:89, :113-120), `AccountsAdmin.tsx` (:105, :137, :203-205, :259-300),
`WelcomePage.tsx` (:310), `CatalogAdmin.tsx` (:17-27, :242-284), `web/src/modules/classes/ClassCreatePanel.tsx` (`LuoiPhanCong`).

- [ ] Một ô chọn kỹ năng dùng chung (5 `NutChon nho` `L · R · W1 · W2 · S`, `title` tên đầy đủ) — đặt ở `ProfilePage` rồi dùng lại ở
  `AccountsAdmin` (form Tạo + nút "Sửa kỹ năng" trong ngăn tài khoản → `PUT /admin/accounts/:id/skills`) và `WelcomePage` (đăng ký).
  `ProfilePage`: nút Lưu xuống **chân thẻ** (K1-54). Hiển thị kỹ năng đã khai qua `skillLabel` (dữ liệu cũ đã migrate).
- [ ] `LuoiPhanCong` (MH6, T55): mỗi ô môn sắp **trước** người có `skills` giao `kyNangGoiY(ct, ô)` (ô W/G+V → người khai W1/W2; ô P → S),
  thêm dòng phụ xám `dạy được W1, W2` trong `<option>`; **không** tự điền (Q7). Pre FOU chỉ ô GVCN (PR-LOP) — không gợi ý.
- [ ] `CatalogAdmin` (MH9, K1-47 phần MON): kiểm cột môn đọc `oPhanCong` → FOU `L · R · G+V · P`, Pre FOU `Tổng hợp` (tự đúng sau
  Task 1). Không sửa nếu đúng; ghi Nhật ký.
- [ ] **Phép kiểm** khối 10: `MON (10) · ô kỹ năng chỉ 5 mã` (đọc nguồn 3 trang: không `REGULAR_SKILLS`, có `ENTRY_SKILLS`);
  `MON (10) · Quản trị sửa kỹ năng` (Quản trị `PUT` → lưu; đọc lại `listAccounts` thấy).
- [ ] Commit `PR-MON (10): kỹ năng phụ trách được L R W1 W2 S, sửa ở Quản trị, gợi ý phân công`.

## Task 11 · Tài liệu

- [ ] `CODE_MAP.md` (Tên môn, `boMonCuaLuot`, `CongTacKhung`, Migrate PR-MON + `chay-thu:mon`) · `TRIEN_KHAI.md` §11.1 Bước 2b khối "Đợt 2 —
  PR-MON" · `TU_DIEN_VA_CHU.md` (`G+V`, `P`, `Tổng hợp`, công tắc khung) · `HE_GIAO_DIEN.md` một đoạn MH3/MH4 · `plan.md`. Không chạy lại
  `npm run check`. Commit `PR-MON (11): tài liệu hệ môn học, hai khung, lệnh chạy thử`.

## Task 12 · impeccable `audit` + `polish`, bấm thử (một lần), mở PR

- [ ] **Cổng rebase:** PR đợt 2 nào đã merge → `git rebase origin/main`, gỡ theo bảng ranh giới (giữ cả hai), `migratePrMon` luôn **cuối**; check.
- [ ] `/impeccable audit` (Lịch Test, Kế hoạch Test, Công việc, lưới FOU + Pre FOU, hồ sơ HV FOU) → sửa trong phạm vi → `/impeccable polish`.
- [ ] `npm run seed` → 4187/5387 → mục **KIỂM** (Playwright kênh Chrome), ảnh trước/sau `thiet-ke/anh/pr-mon/`; `migrate` + `chay-thu:mon` trên DB demo.
- [ ] `/ponytail-review` → push → `gh pr create` tiêu đề `PR-MON: hệ môn học theo chương trình, Pre FOU một ô Tổng hợp, hai khung FT /
  Lớp thường`; thân: bảng mã (MH/T/K) → ảnh → đạt/không, "tầng 1 của màn này là: …" (§7.5) cho Lịch Test, lưới Pre FOU; mục **Chuyển cho PR
  khác**, **Lệnh cho buổi deploy**, cảnh báo **CÓ migrate**, danh sách chú thích `ponytail:`. Tắt cổng, quét `tests/run.js`, dọn file tạm.

## KIỂM — kịch bản bấm thử (Task 12)

| # | Vai (id) | Làm | Phải thấy |
|---|---|---|---|
| K1 | GVCN Hà (7) | Lưới chấm `MB FOU 12` | Cột `L · R · G+V · P` (tooltip Grammar + Vocabulary, Pronunciation); chip Case, dòng phụ dùng G+V/P |
| K2 | GVCN Hà | Lưới `MB Pre FOU 03` (laptop) | Một cột `Tổng hợp`, bài `Cuối khoá`; em 52% hiện `52%` (không "SOS"); em chưa nhập gõ 30/40 → lưu → `75%` |
| K3 | GVCN Hà · 375 px | Cùng lớp trên điện thoại | Không hàng chip; dòng `Cuối khoá · Tổng hợp`; ô nhập ≥ 44 px; không cuộn ngang |
| K4 | GVCN Hà | Lịch Test tuần có cả lớp FT và lớp thường | Công tắc ở hàng lọc đầu trang; chọn Fast Track → dải số, Nợ, danh sách chỉ lớp FT; chọn Lớp thường → Nợ ghi `P` (không `S`) cho FOU, `Tổng hợp` cho Pre FOU; tải lại trang → nhớ lựa chọn |
| K5 | QL Vy (2) | Kế hoạch Test → Lớp thường → `MB Pre FOU 03` | Chỉ cột `Cuối khoá`; hộp kỹ năng một dòng `Tổng hợp` |
| K6 | QL Vy | Công việc | Công tắc `Tất cả · Fast Track · Lớp thường` đứng đầu hàng lọc; Lớp thường → chỉ việc lớp thường (+ việc không gắn lớp); số chip hạn đổi theo |
| K7 | QL Vy | Học viên & Lớp → "+ Lớp mới" → Lớp thường · Pre FOU · GVCN Hà | Pre FOU **không** mờ; tạo được; hồ sơ lớp: dòng GV "GVCN", không badge "Thiếu GV" |
| K8 | GVCN Hà | Hồ sơ một em FOU có Case Writing cũ → Xác nhận/ghi nguyên nhân Case G+V mới | Tiêu đề `Case G+V`; danh sách nguyên nhân Từ vựng · Ngữ pháp · Khác (không "Đáp ứng yêu cầu đề"); Case P → nhóm Phát âm |
| K9 | GVCN Hà | Hồ sơ em Pre FOU | Một hàng `Tổng hợp`; Hành trình một hộp, ghim `Cuối · 52%` |
| K10 | GVBM Trang (9) | Hồ sơ cá nhân | 5 nút `L R W1 W2 S`, không `W` lớp thường; Lưu ở chân thẻ |
| K11 | Quản trị (1) | Quản trị › Tài khoản → Trang → Sửa kỹ năng | Lưu được; Lộ trình & chương trình: FOU `L · R · G+V · P`, Pre FOU `Tổng hợp` |
| K12 | QL Vy | Sửa phân công `MB FOU 12` ô G+V | Người khai W1/W2 đứng đầu danh sách kèm `dạy được W1, W2`; không tự điền |
| K13 | QL Vy · 375 px | Phân tích › Tổng hợp Test: Lớp thường, Cả hai; rồi K4, K6 ở 375 px | Không cột môn (FT vẫn L R W1 W2 S); công tắc không tràn, hàng lọc xuống dòng gọn |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Lý do |
|---|---|---|
| Nhãn lớp thường FOU/BE/ELE `n/4 môn · %` thay "SOS n" ở mọi nơi; cột `%`/hướng gợi ý bảng điểm lớp; ghim Hành trình `Giữa 72%`; KPI dùng `tyLeTong` | **PR-LT2b** | T58, T47, K2-02, K2-12, K3-31 (phần %); hàm `tyLeTong` đã có |
| Case Giữa khoá tự tạo theo môn (FOU "Giữa khoá · G+V không đạt"); Pre FOU Cuối khoá không mở Case chờ nguyên nhân | **PR-LT2a / LT2b** | MH8 phần luật, T70 — PR-MON chỉ làm tên + phân loại |
| Bỏ hẳn "Cả hai" + công tắc đầu tab Phân tích; bảng Vấn đề HV khung Lớp thường theo chương trình; "% tổng" ở Tổng hợp Test | **PR-Pb2** | T60 (Phân tích), K1-18, K1-22 phần bố cục |
| Công tắc `Tất cả · Fast Track · Lớp thường` + bảng nhóm theo kiểu lớp ở Học viên & Lớp (dùng `CongTacKhung`) | **PR-HVL** | K2-03 |
| Dòng "Cả bài (% tổng)" ở Phân tích lớp · Ngăn Xếp lịch hàng loạt khung thường + menu ⋯ ô lưới thường | **PR-HVL** · **PR-XLMT** | K2-40 · K4-19, K4-32 |
| Xuất Excel hai khung, tên qua `tenMon` · huy hiệu Ý thức "HV cần hỗ trợ" · dòng "Case chờ xác nhận nguyên nhân" | **XUAT** · **YT4** · **SOS** | MH3/T40 · K1-17 · K1-22 (1) |

## Lệnh cho buổi deploy (đợt 2 — 🛑 chỉ chủ sản phẩm chạy, theo `TRIEN_KHAI.md`)

1. Sao lưu bản chính (`npm run sao-luu`).
2. Nạp biến Turso **bản chính**, chạy **chỉ đọc** `npm run chay-thu:mon` (cùng cửa sổ với lệnh chạy thử của DUYET/MT/NHAP) → gửi kết quả
   cho planning. Mục (3) lớp Pre FOU và (4) ô `writing` ở lớp FT phải **0**; khác 0 → dừng, báo planning.
3. Anh/chị duyệt: danh sách GV đổi kỹ năng (mục 1); biết số Case FOU có nguyên nhân kiểu IELTS (mục 2 — giữ nguyên, chỉ để biết).
4. Migrate **DB THỬ** → deploy nháp → bấm K2, K4, K7 → migrate **DB CHÍNH** (`PISA_CHO_PHEP_MIGRATE_TURSO=<tên máy chủ>`) → `--prod`.
5. Chạy lại `chay-thu:mon`: mục (1) phải **0**.
6. Báo GV: FOU hiện `G+V`, `P`; mở được lớp Pre FOU; kỹ năng tự khai "Writing" cũ đã thành W1 + W2 (sửa ở Hồ sơ cá nhân nếu sai).

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | Nhãn môn theo chương trình là **mã** (`tenMon`), không cột CSDL; migrate PR-MON chỉ `user_skills` | K5 §5 đề xuất mã; T78 giao mọi dòng `PREFOU` cho PR-LOP (đã có `programme_skills (PREFOU, tong_hop)`); Quản trị không đổi tên môn |
| Q2 | Tổng quan/Phân tích: **không** bỏ "Cả hai" ở PR này; chỉ ẩn cột/câu theo môn khi khác Fast Track | T60 giao Phân tích cho PR-Pb2; bỏ "Cả hai" làm Tổng quan QL mất số lớp thường ở khối Cần xử lý (khối không theo môn phải gộp) |
| Q3 | Công việc: công tắc 3 lựa chọn, mặc định **Tất cả**, việc không gắn lớp hiện ở mọi khung; Test: 2 lựa chọn | T60 "Việc vẫn gộp" + MH4; Test theo bài test phải tách; không đoán khung việc Vận hành |
| Q4 | Pre FOU hiện `%` (không SOS) ngay ở PR này; FOU/BE/ELE giữ nhãn cũ tới LT2b; chỉ số `hv-duoi-ky-vong-mon` giữ 4 kỹ năng FT | MH7 Pre FOU chỉ % tổng; T58 là việc LT2b; MH5 |
| Q5 | Case FOU cũ giữ mã nguyên nhân IELTS, không nhãn "(loại cũ)"; chạy thử chỉ đếm | Nhãn cũ vẫn đúng nghĩa tiếng Việt (Ngữ pháp, Từ vựng); đổi mã = đổi lịch sử |
| Q6 | Mã mới `student.gv.*`, `student.phat_am.*`, `student.tong_hop.*` | Giữ tiền tố của bộ hiện có; K5-41 viết `gv.*` là ý, không phải mã |
| Q7 | Gợi ý phân công = xếp trước + dòng phụ, không tự điền | "Gợi ý" (MH6); tự điền dễ gán nhầm người |
| Q8 | Công tắc khung nhớ theo máy (localStorage), tham số `loai` trên URL thắng | K4-05 "nhớ theo máy"; đường dẫn sâu vẫn mở đúng khung |
| Q9 | Quản trị sửa kỹ năng qua đường mới `PUT /admin/accounts/:id/skills` (quyền cấu hình) | K1-51; không có đường nào sửa kỹ năng của người khác |
| Q10 | `CHO_TAO_PRE_FOU = true` ở Task 8, sau khi mọi đường Pre FOU chạy | PF6 "tránh lớp Pre FOU dựng trên bộ 4 môn" |

## Mâu thuẫn nguồn ↔ mã thật

1. §8 cột Migrate "ô `tong_hop`, nhãn môn trong danh mục" — `prLop.ts` đã chèn `programme_skills (PREFOU, tong_hop)`; K5 §5 đề xuất nhãn là mã → migrate chỉ `user_skills` (Q1).
2. K5-30 (1) nhánh `teacherAllows` "GVCN như có mọi môn" — không cần: PR-LOP gán dòng `tong_hop` cho GVCN (`intake.ts:589`, `classes.ts:924`).
3. K2-43 phần Pre FOU và MH9 (`CatalogAdmin`) đã sửa ở PR-LOP (`schedule.ts:563`, Nhật ký LOP Task 10) — còn nhãn G+V/P.
4. MH4 liệt kê Tổng quan + Phân tích; §8 dòng PR-MON chỉ Test + Công việc; T60 giao Phân tích cho PR-Pb2; K1-07/K1-18 gán PR-MON → Q2.
5. Chú thích `normal.ts:66-78`, `regular.ts:21-34` ("bốn môn L/R/W/S ở mọi chương trình") sai từ khi có Pre FOU — sửa.
6. `standing.ts:226` còn đọc `PROGRAMME_TEMPLATES` — trái "một nguồn" của PR-LOP (Task 4). `boQuen.ts:102` chặn FT ↔ thường nhưng FOU ↔ BE vẫn nối họ Writing (Task 5).
7. `user_skills` không được mã nào đọc để gợi ý phân công (chỉ hiển thị) — MH6/T55 "gợi ý" phải dựng mới (Task 10).

## Câu cần chủ sản phẩm quyết (đang theo khuyến nghị — không chặn code)

1. **Tên đầy đủ G+V và P** (rê chuột, xuất Excel): **khuyến nghị** `Grammar + Vocabulary` · `Pronunciation`. Khác: `Ngữ pháp + Từ vựng` · `Phát âm`.
2. **Nhóm nguyên nhân "Tổng hợp" của Pre FOU** (T57 "nhóm chung"): **khuyến nghị** 5 mục `Từ vựng / ngữ pháp · Kỹ năng nghe – đọc ·
   Kỹ năng nói – viết · Tâm lý và độ tập trung · Khác`. Anh/chị sửa tên/bớt mục trước khi PR merge.

## Bảng phủ 40 mã rà (§4.9)

K1-07 T9 · K1-17 T8 (Pre FOU %) + YT4/LT2b · K1-18 T9 + Pb2 · K1-22 T1 + SOS/Pb2 · K1-30 T9 (khung) + DUYET · K1-34 T9 · K1-45 T6/T7 ·
K1-47 T10 (+LOP) · K1-51 T2/T10 · K1-54 T10 · K2-02 T8 (Pre FOU) + LT2b/HVL · K2-03 → HVL · K2-09 T6/T7 · K2-12 T8 + LT2b · K2-40 T8 + HVL ·
K2-43 T6 (+LOP) · K3-05 T1/T5/T7 · K3-25 T5 · K3-31 T7/T8 + LT2b · K4-05 T9 · K4-07 T7 · K4-16 T8 · K4-19 → XLMT · K4-22 T7 · K4-32 →
XLMT · K5-29 T2 · K5-30 T5 (+LOP) · K5-38 T3 · K5-39 T4 · K5-40 T1/T6/T7 · K5-41 T1/T5 · K5-42 T1/T5 · K5-43 T9 + Pb2 · K5-44 T3 ·
K5-45 T4 (+LOP) · K5-46 T2 · K5-47 T1/T5 · K5-48 T2 · K5-57 T5 · K5-67 T2.

## Nhật ký

- **Task 0 (29/09, Opus 5.5 — phương án B):** nhánh `pr-mon-he-mon-hoc` từ `origin/main` fb51181. DUYET/MT/NHAP **chưa** merge (🛑 4c không
  áp). `npm ci` → `npm run check` xanh: **mốc B = 1444** phép kiểm + 20 tốc độ. Dòng mã khớp kế hoạch (lệch ≤ 4: `ALL_SKILLS` dùng ở
  `accounts.ts:359`, không :363); không cần bảng "dòng thật".
- **Task 1:** 1450 (+6). Lệch kế hoạch: `hoKyNang` nhận thêm `gv` → writing, `phat_am` → speaking (nhánh nguyên nhân FOU nằm ở ô W/S;
  `tong_hop` vẫn null) — cần vì `hieuQuaPa.ts`/`vanDeHv.ts` dùng nhánh làm họ; Case Pre FOU bị bỏ khỏi hai bảng họ kỹ năng (không đếm
  "chưa phân loại"). `kyNangTheoCt('ca-hai')` lọc `tong_hop` (giữ hành vi, Task 9 bỏ cột). Sửa kỳ vọng 2 phép kiểm UX4 (thêm nhóm Phát
  âm; mã "một kỹ năng" đổi từ Speaking · Phát âm sang Reading · Tư duy logic — cùng điều kiện). `grep NHAN_O_TAM` rỗng.
- **Task 2:** 1454 (+4). Thêm nhãn nhật ký `user_skills_set` "Sửa kỹ năng tài khoản" (`nhatKy.ts`). DB demo worktree (seed không có GV
  khai `writing` → chèn tay GV Trang `writing` + `pronunciation`): chạy thử (1) 1 GV `pronunciation, writing → speaking, writing1,
  writing2` · (2) 2 Case FOU mã IELTS (#12 `student.writing.organisation`, #26 `student.writing.grammar`) · (3) 0 lớp Pre FOU · (4) 0/0.
  `npm run migrate` → "Đổi kỹ năng phụ trách được của 1 dòng" (dòng `pronunciation` đã được bước đổi mã cũ có sẵn đổi sang
  `speaking` trước) → chạy thử lại (1) = 0; Trang còn `speaking, writing1, writing2`.
- **Task 3:** 1457 (+3). `SkillRow.skill`, `SkillScheduleView.skill`, `blocking`, `hasScore`/`hasAnyBand` nới thành `string`;
  `skippedSkillsOf` giữ `AssessedSkill[]` (ép kiểu tại chỗ — phạm vi chỉ dùng ở FT). `loadOne` (dùng chung `setSkillWeek`/`setSitStatus`)
  kiểm bằng `boMonCuaLuot`. `absence.ts` `skillName` → `tenMon(null, s)` (không lộ `tong_hop`); `blockingLabels` ở chi tiết lượt →
  `tenMon(null, k)` dự phòng. `scoreDebt.ts:71` tạm truyền `REGULAR_SKILLS` (Task 4 đổi sang bộ chương trình).
- **Task 4:** 1460 (+3). `standing.ts`: `allProgrammes()` đọc lười MỘT lần/danh sách (gọi trong vòng làm phép kiểm N+1 PR-LT (3)
  28 → 34 câu vỡ); nhận diện `ratio` vẫn qua `PROGRAMME_TEMPLATES` (không nằm trong phạm vi). `canCham.ts`: `DongNo.chuongTrinh` thêm
  luôn ở Task này (cần cho `kyNangLabelOf`), lấy qua `programmeOfClass` một lần/lớp thay `isRatioClass` (cùng số câu). `tongQuan.ts:40`
  đổi danh sách viết tay → `ASSESSED_SKILLS` + `tenMon(null, …)` ngay Task này (phép quét Task 4 không có nó trong bảng trắng); lọc
  theo khung vẫn ở Task 9. `seed/build.ts` dùng `boMonLich(programme_code lớp)`.
- **Task 5:** 1464 (+4). Quyền Pre FOU đi qua dòng `tong_hop` của GVCN — không sửa `owner.ts`/quyền. `reportIssue`: Pre FOU chỉ nhận
  chủ đề `tong_hop` (trước đây hợp với 5 ô FT — em Pre FOU mở được Case Listening); câu lỗi phân loại không còn lộ mã ("…không thuộc bộ
  phân loại của Grammar + Vocabulary"). `defaultSkillFor` (vi phạm) không tự điền `tong_hop`. `/violations/similar` trả thêm
  `chuongTrinh`; form vi phạm hỏi cả khi sửa để có danh sách môn. `QuickReport` luôn hỏi `/case-topics` (kể cả mở từ tín hiệu) để có
  `chuongTrinh`. Sửa kỳ vọng 5 phép kiểm cũ dùng mã nguyên nhân IELTS cho em FOU (S1, S17, PR-Pa Nợ S1, PR-Form ×2 → bộ G+V/P;
  cùng điều kiện). `CaseSosControls` (ghi nguyên nhân trong Case) chờ `chuongTrinh` của Case — Task 6/7.
- **Task 6:** 1466 (+2). Grep trước **28** dòng → sau **13** (mọi dòng còn lại có `ct` hoặc "giữ — FT": `sos.ts:438` MT, `phanTichLop.ts:82`
  khung FT, `routes/index.ts` `/ref/issue-taxonomy` chủ đề FT, `hocVienLop.ts:120` `belowSkills` FT; `tenKyNang`/`caseTopicLabel`
  là định nghĩa). Thêm ngoài bảng: `caseTitle` nhận `chuongTrinh` (tiêu đề "Giữa khoá - Grammar + Vocabulary dưới kỳ vọng"),
  `caseDetail`/`listCases` trả `chuongTrinh` + `categoryLabel` theo chương trình, `labelOf` tín hiệu đọc `programme_code` từ
  `SIGNAL_SELECT`, `phoiHop.ts`/`meeting.ts` nhãn môn qua `tenMon` (trước lộ mã `writing`), `Standing.chuongTrinh`,
  `KetQuaVao.chuongTrinh`, `badgeLop`/`viecTiepTheoCua` nhận `chuongTrinh`, phiên đăng nhập `assignments[].nhanMon`. `myWork`: bảng
  tra lớp → {chương trình, cách chấm} nạp lười MỘT câu (`ponytail:` đọc cả bảng lớp) — Task 9 dùng lại cho `khung`. `xoaTaiKhoan`
  gộp cảnh báo theo tên môn hiện ra. Sửa kỳ vọng 3 phép kiểm PR-Qa lớp FOU (W → G+V, S → P; cùng điều kiện).
- **Task 7:** 1467 (+1). Grep trước **67** dòng → sau **30** (giữ — FT: `LuoiFT`, `ScoreEntry`, `MockDetailPage`, `ChamDiemPage` nhánh
  `laFt`, `ClassRoster`, `ManagerTasks` chủ đề FT; bộ lọc chung MH3: chip `CaseBoardPage`, `ChuyenLopPanel`; dự phòng `Header`
  `nhanMon ??`, `HanhTrinh` `nhanNgan ??`; `ProfilePage`/`WelcomePage` → Task 10). Làm luôn ở Task này (cùng file): `BangDiemLopThuong`
  nhóm cột theo `programme.checkpoints` (hồ sơ lớp trả thêm) — bỏ `BAI`/`MON_MAC_DINH`, Pre FOU thêm cột `%` (K2-12, Task 8);
  `LopLichTest.chuongTrinh/boMon` (Task 9) để bỏ `BON_MON`; `HanhTrinh` Pre FOU ẩn chip lọc (Task 8). Máy chủ thêm: `listAttempts`
  dòng lớp thường `programmeCode`, bảng kỹ năng hồ sơ HV theo chương trình (`caseCategoriesFor(…, ct)`, `label/short` qua `tenMon`,
  trả `chuongTrinh`), `hanhTrinh` hộp theo chương trình + `nhanNgan`, `violations` `skillLabel` theo lớp, `profile` tiến độ kỹ năng.
  `CauseDeterminationPanel` (ghi nguyên nhân) nhận `ct` → FOU G+V/P (K8). `ChamDiemPage` bỏ chú giải cố định "W = Writing".
- **Task 8:** 1472 (+5). **Lỗi thật tìm thấy:** bước migrate cũ `migrateSkillSchedule` (`migrate.ts:~2034`) dựng dòng lịch cho mọi lượt
  "< 4 dòng" → mỗi lần `npm run migrate` sẽ chèn L R W S vào lượt Pre FOU. Sửa ngoài bảng ranh giới (một điều kiện `NOT EXISTS … PREFOU`,
  chống hỏng dữ liệu) + phép kiểm MON (3) chạy lại `migrate()` giữ 1 dòng. Kế hoạch Test: `KyNangKH` nhận thêm `tong_hop` qua
  `O_KE_HOACH` (FT vẫn `KY_NANG_KE_HOACH`); `luoiThuong` trả `cot` theo mốc + `boMon`; `xepMoiThuong`/`xetMotEm`/`xepHangLoat` đếm
  "đủ" theo bộ môn ("Cần chọn tuần cho 1 môn." / "cả 4 môn"); web `HopKyNang` lặp `ky` (bộ môn), `ChipKyNang` tên theo chương trình.
  Ngăn Xếp lịch hàng loạt web giữ 4 kỹ năng (kiểu `Ky4`) — khung thường là PR-XLMT. Pre FOU %: `ketQuaThuong` ở lưới (tông đạt/chưa
  đạt, không nhãn SOS), `ketQuaGanNhat`/`standingLine` (`Standing.tyLeTong/khongChiaMon`), ghim Hành trình `Cuối · 52%`, Tổng quan
  "HV cần hỗ trợ" `Cuối khoá 52%` (`AttemptEval.tyLeTong`). Điện thoại (impeccable `adapt`, không PRODUCT.md — sửa hẹp theo mã): một
  môn → dòng `Cuối khoá · Tổng hợp` + `đã nhập/tổng` thay hàng chip. `CHO_TAO_PRE_FOU = true`. Demo D12 `MB Pre FOU 03` (khai giảng
  17/08, tuần 5/5 = tuần demo, GVCN Hà dạy luôn): 26/50 = 52% · 32/50 = 64% · 39/50 = 78% · 1 em chưa nhập (nợ). Điểm dùng tổng 50 để %
  tròn đúng 52/64/78. Sửa kỳ vọng 4 phép kiểm cũ (cùng điều kiện): [18.1] "đủ dòng lịch" theo bộ môn chương trình; PR-UX1 môn tuần ∈
  `boMon`; UX2 câu "cả 4 môn"; LOP (5) Pre FOU nay tạo được, GVCN nhận `tong_hop`. `tocDoDuong.ts` đã có dòng
  `/ke-hoach-test/thuong/{lopThuong}`; không có chỗ đặt lớp Pre FOU → không thêm dòng đo.
- **Task 9:** 1476 (+4). `CongTacKhung` (`web/src/ui/`) — `BoLocDoan`, localStorage bọc try/catch, chỉ một khung có dữ liệu → không vẽ.
  Lịch Test: công tắc ở hàng lọc đầu trang (sau Tuần, trước "Lớp tôi dạy / Tất cả"), `NutLuat` lớp thường cạnh nó; áp cho dải số
  (`tongQuanKhung`, tính cùng vòng — thêm đếm quá hạn theo khung trong `noTuanTruoc`), khối Nợ, danh sách lớp; dòng Nợ đang mở của
  khung kia không bị chèn vào. Bỏ `HangTab` cũ. Kế hoạch Test: công tắc đứng đầu hàng lọc, nhớ theo máy. Công việc: **tham số URL là
  `khung`** (không `loai` — màn này `loai` đã là Loại việc); mặc định Tất cả; chỉ một khung có việc thì không lọc (lựa chọn đã nhớ không
  giấu việc). `myWork` gán `khung` qua `ganKhung` dùng lại bảng tra lớp của Task 6 (không thêm câu SQL). MH5: `cotKyNangFor` rỗng khi
  khác FT; `chonDiemDangChuY` bỏ câu môn khi khác FT, máy chủ không đọc chỉ số môn khi khác FT; `kyNangTooltip` bỏ nhánh "Cả hai" (chữ
  "chưa đạt" cho lớp thường thành chết → bỏ). impeccable `layout`: `detect --scope layout` sạch; đánh giá trên màn thật dồn sang Task 12.
  Sửa kỳ vọng 2 phép kiểm cũ (PR-Pa Điểm đáng chú ý đo trên ct=ft + khẳng định không câu môn ở thường/Cả hai; PR-Pb #2 lớp thường không
  cột `kn:`).
- **Task 10:** 1478 (+2). `ChonKyNang` (export ở `ProfilePage.tsx`, lặp `ENTRY_SKILLS`, nhãn ngắn + `title` tên đầy đủ) dùng ở Hồ sơ cá
  nhân, Quản trị › Tài khoản (ô trong ngăn Tạo/Sửa — lưu qua `PUT /admin/accounts/:id/skills` chỉ khi đổi; Tạo gửi kèm `skills`) và
  Đăng ký. Hồ sơ cá nhân: Lưu xuống chân thẻ. Gợi ý phân công: `/ref/teachers` và `classTeachers().candidates` trả `skills`; `LuoiPhanCong`
  (Tạo lớp + Phân công lớp) xếp trước người khai kỹ năng hợp `kyNangGoiY(ct, ô)`, thêm "— dạy được W1, W2" trong `<option>` (option
  không có dòng thứ hai — nối cùng dòng); không tự điền. `CatalogAdmin` đã đúng (FOU `L · R · G+V · P` qua `oPhanCong`, Pre FOU
  `Tổng hợp` qua dự phòng `skillShort`) — không sửa.

## Chủ sản phẩm chốt 29/09

- Tên đầy đủ môn FOU: **G+V = Grammar + Vocabulary**, **P = Pronunciation**.
- Nhóm nguyên nhân "Tổng hợp" của Pre FOU: theo khuyến nghị 5 mục (planning chốt).
