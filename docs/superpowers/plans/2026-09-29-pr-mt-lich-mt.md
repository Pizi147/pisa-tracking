# PR-MT · Lịch MT tự tạo · HS cũ · đánh số · RF · dời lần 2 — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Em có lộ trình FT (thêm mới, vào lớp FT, mở lộ trình mới, đổi LT ↔ RF) → web **tự tạo** MT1/MT2/MT3 tuần học 6/12/16
(RF: MT1/MT2 tuần 4/8), bốn kỹ năng cùng tuần. Lượt có tuần thi đã qua **trước ngày tạo** là **MT lịch sử** (cờ `lich_su` lưu lúc
tạo): không nợ, không hạn, không "-", GVCN nhập đủ 4 kỹ năng, khoá R11 sau 7 ngày kể từ lần nhập cuối, chỉ lượt gần nhất trong 4 tuần
sinh Case/PA quy chế/Phối hợp. Lệnh `bo-sung-mt-mac-dinh` (chạy thử in danh sách → chủ sản phẩm duyệt → chạy thật) cho em FT đã có
trên bản chính. **RF: mọi MT kỳ vọng = target**, PA quy chế hàng "MT3 trở đi", Phối hợp hàng MT4. **Đánh số liền mạch** chặn ở máy
chủ (một chốt trong `createAttempt` phủ cả `POST /attempts`, `/ke-hoach-test/xep-moi`, `/hang-loat`, `bulk-plan`); **Huỷ cả lượt** chỉ
lượt lớn nhất chưa có điểm (số dùng lại — Q-B), còn lại "Huỷ phần còn lại"; huỷ lượt đóng Case/PA/Phối hợp sinh từ lượt đó (T67).
**Dời do vắng**: lần 1 máy tự dời lúc chốt "-" (Q-A), lần 2 thành đề nghị chờ QL hạn **hết CN tuần gửi**, tuần đích mặc định = tuần
chưa bắt đầu gần nhất hợp T15; QL đổi tuần kỹ năng đang vắng = dời do vắng. Demo có đủ kịch bản D1–D6, D16.
**Architecture:** Luật thuần mới `shared/domain/lichMt.ts` (lịch mặc định theo lộ trình, lịch sử, cửa sổ 4 tuần, đánh số, huỷ lượt,
hạn duyệt dời lần 2) — web, máy chủ, lệnh ops gọi **cùng** hàm. Máy chủ: `server/src/fasttrack/mtMacDinh.ts` (`taoMtMacDinh`, dùng lại
lõi của `applySuggestedMockWeeks`), chốt số trong `createAttempt`, `huyLuot` thay `cancelAttempt`, luồng vắng trong `absence.ts`. Migrate
riêng `server/src/migrate/prMt.ts` (một cột, một dòng gọi — T78) + `chayThuMt.ts` (chỉ đọc) + `ops/boSungMtMacDinh.ts` (mặc định chạy
thử, `--that` mới ghi). Web chỉ thêm nhãn/dòng nhỏ, không dựng lại màn (lưới Kế hoạch Test, thao tác MT là PR-XLMT; hồ sơ Mock là PR-HSM).
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); phép kiểm `server/src/tests/*`
(harness `check()` của `run.ts`), chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.1 Q27-2, Q27-4 · §3.1c Q-A, Q-B · §3.2 T4, T33–T36, T42,
T67 · §4.7 YC-13.1, 13.2, 13.3 · §4.1 YC-3 (phần luật) · §5.2 M1–M8 · §5.5 dòng "Dời lịch MT lần 2" · §5.8 M-12, M-13, M-14, M-20 · §8 dòng
PR-MT + Migrate · §10.3, §10.4 H1–H4, H7 · báo cáo rà `thiet-ke/ra-27-09/` K1-04, K1-49, K1-53, K1-55, K2-05, K2-17, K2-31, K2-32, K2-33,
K3-14, **K4-01**, **K4-02**, K4-03, K4-04, K4-08, K4-09, K4-12, K4-18, K4-20, K5-09, K5-15, **K5-21**, **K5-22**, **K5-31**, K5-49, K5-54,
K5-60, K5-67; K4 §4(a)(b)(e), K5 §4 dòng 1, 3, 5, 26, 27, K5 §5 dòng PR-MT, K5 §6 D1–D6, D16.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-MT** · đợt 2 · làn **B** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-mt-lich-mt` · `.claude/worktrees/pr-mt-lich-mt` (từ `origin/main` @ 1792ac0 trở đi) |
| Cổng thử | API **4167** · Vite **5367** (không dùng 4000/5173; A 4157/5357 · C 4177/5377 · D 4187/5387 chạy song song) |
| Model | **Opus 5.5 · XHigh** · phương án B: **Fable 5.1 · High** (dùng B thì đọc kỹ mục "Hướng dẫn riêng cho model thực thi") |
| Người rà | **Opus 5.5**, session riêng (T52) — session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Có** — `assessment_attempts.lich_su INTEGER NOT NULL DEFAULT 0` (không đổi dữ liệu có sẵn). Lệnh sửa dữ liệu cũ **riêng**: `bo-sung-mt-mac-dinh` (mặc định chạy thử) |
| Skill thiết kế | Task 9 (giao diện) gõ **`/ponytail lite`** đầu Task; **impeccable `clarify`** cho chữ nhãn/dòng nhắc/hộp huỷ lượt (Task 9); **`audit`** rồi **`polish`** ở Task 12 trước khi mở PR. Không `init`/`document`/`hooks on`. Task 0–8, 10–11 giữ ponytail `full` |
| Phụ thuộc | Cần **PR-LOP** (đã merge: RF, `route` lớp, `dong-mo` LT ↔ RF). **Không chờ** PR-DUYET (thẻ Lịch thi là của DUYET — giao kèo ở Task 8). **Merge MT trước NHAP** (NHAP gọi `taoMtMacDinh`) |
| Không làm | thẻ/hộp Chờ duyệt (PR-DUYET) · dựng lại lưới Kế hoạch Test, panel Xếp lịch MT, 6 tên thao tác T38 (PR-XLMT) · nhập tại chỗ ở hồ sơ Mock (PR-HSM) · cột "Đã thi tới MT" trong panel Thêm HV (PR-NHAP — PR-MT chỉ làm tham số hàm) · "Xếp lịch MT(n+1)/chưa có lịch" của PA quy chế (PR-SOS, K3-14) · bỏ dòng "2 lần Test liền" (PR-UXF, K1-04) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-MT (n): …`.
- Treo quá 10 phút → quét tiến trình `node … tests/run.js` còn sống, tắt hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px **một lần** ở Task 12 (Playwright kênh Chrome, đăng nhập demo
  `POST /api/demo/session {userId}`: **Quản trị id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang
  id 9**), ảnh trước/sau lưu `thiet-ke/anh/pr-mt/`. Chạy song song: `PORT=4167` cho API, Vite tạm cổng 5367 trỏ proxy về 4167.
- Không chạm Turso, không deploy, không chạy `migrate`, `chay-thu:mt`, `bo-sung-mt-mac-dinh` trên bản chính. Mọi phép thử ghi dữ liệu
  chạy trên **DB demo trong worktree**. Gặp mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4167/5367, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.
- **🛑 Cửa dừng:** `migrate`, `chay-thu:mt` và `bo-sung-mt-mac-dinh` (kể cả chạy thử) trên **bản chính** chỉ **chủ sản phẩm** chạy, ở
  buổi deploy (mục "Lệnh cho buổi deploy"). `bo-sung-mt-mac-dinh --that` chỉ chạy **sau** khi chủ sản phẩm duyệt danh sách chạy thử.

### Ranh giới file với ba PR đợt 2 (DUYET · NHAP · MON) — thứ tự merge bắt buộc **MT → NHAP**

| File | PR khác sửa gì | PR-MT chỉ được sửa | Gỡ xung đột |
|---|---|---|---|
| `server/src/migrate.ts` | DUYET, NHAP, MON: mỗi PR **một** import + **một** dòng gọi | 1 import + `migratePrMt(conn, applied);` cuối danh sách (sau `migratePrLop` :457) | giữ **mọi** dòng, thứ tự theo thứ tự merge |
| `server/src/schema.sql` | DUYET (bảng mới), NHAP (`students.email`, `learning_cycles.exam_date`), MON | một cột `lich_su` cuối khối `assessment_attempts` (trước `UNIQUE` :504) | chỉ thêm khối — giữ cả hai |
| `server/src/fasttrack/absence.ts` | **DUYET**: tạo/đóng thẻ khi có đề nghị dời (`insertRequest` :296, `decideAbsenceMove` :357, `sweepExpiredMoves` :421) | luồng tự dời/lần 2/hạn/tuần đích (Task 8) | giữ **cả** dòng gọi thẻ của DUYET **và** luật của MT; phép kiểm K5-28 (thẻ `tu_dong` cùng giao dịch) của DUYET phải còn xanh |
| `server/src/worklist/mywork.ts` | **DUYET** chuyển nhóm "Duyệt dời lịch" (:147-160, :532-580) vào hộp; MON (nợ theo môn) | lọc `lich_su` ở việc `score`, nhóm `missing_data` (:195, :870, K5-09) | khác khối — giữ cả hai |
| `server/src/worklist/scoreDebt.ts`, `server/src/cham/canCham.ts`, `server/src/students/standing.ts` | **MON** thay `REGULAR_SKILLS` cứng bằng môn theo chương trình (scoreDebt :72, standing :258) | điều kiện `lich_su` ở câu SQL/hàm (Task 5) | MT sửa **điều kiện lọc lượt**, MON sửa **danh sách môn** — giữ cả hai |
| `server/src/classes/intake.ts` | **NHAP** viết lại (email, ngày thi, cột mới, `daThiToiMt`) | **một** khối gọi `taoMtMacDinh` thay chú thích :478-485 + `canPlanWeeks` :361 | NHAP rebase sau MT, **giữ** lời gọi (thêm `daThiToiMt`) |
| `server/src/fasttrack/attempts.ts` | MON (ô `tong_hop` trong lưới/`saveScore`) | `createAttempt` :967-1017, `cancelAttempt`/`reopenAttempt` :1125-1150, nhánh quyền/`noShow` trong `saveScore` | khác hàm — giữ cả hai |
| `server/src/tests/run.ts`, `shared/domain/index.ts`, `shared/domain/nhatKy.ts`, `package.json`, `CODE_MAP.md`, `TRIEN_KHAI.md`, seed | mọi PR | chỉ thêm dòng đăng ký/export/nhãn/script/ghi chú/em demo | giữ cả hai |

## Global Constraints

- **Một nguồn:** lịch mặc định, kỳ vọng, cửa sổ 4 tuần, luật đánh số chỉ ở `shared/domain/lichMt.ts` (+ `expectationDelta` ở
  `shared/domain/fasttrack.ts:14`). Không chép lại luật trong SQL/giao diện; SQL cần điều kiện thì dùng hằng chuỗi xuất từ file này.
- **Lộ trình của lượt** = `learning_cycles.route` của `assessment_attempts.cycle_id` (không phải lộ trình hiện tại của em — K5-49).
- **Cờ `lich_su` lưu lúc tạo**, không suy lại khi đọc (M-13). Chỉ tính lại ở đúng một chỗ: lượt tự tạo **bị dời theo tuần bắt đầu**
  (Task 3) — vẫn so với `created_at` của chính lượt.
- **SQL:** chỉ `?` (db.ts:24-31 cấm tham số đặt tên); mọi ghi trong `tx()` (BEGIN IMMEDIATE, lồng = SAVEPOINT); `IN (…)` dựng `?` theo
  số phần tử, không UNION > 20 vế. Không N+1: danh sách đọc `cy.route`/`a.lich_su` bằng JOIN sẵn có, trần `tocDoDuong.ts` **không tăng**.
- **Chữ:** "MT lịch sử" (nhãn nhỏ `lịch sử`), "Huỷ cả lượt MTn" / "Huỷ phần còn lại", "dời từ W3 SEP · vắng lần 1", "Chờ QL duyệt dời
  lần 2". Tuần qua `tuanLich()`, ngày qua `ngay()`; không lộ `lich_su`, `attempt_no`, ngày ISO trên màn hay trong câu lỗi.
- **Tinh tế:** nhãn `lịch sử` là chip viền mảnh chữ xám 11.5 px (không màu nghĩa, không ⚠); dòng nhắc MT lịch sử **không đỏ, không
  số trong dải số**; cột/hàng thẳng, `tabular-nums` mọi số.
- **Luật thuần có phép kiểm:** `server/src/tests/prMt.tests.ts` (`runPrMtTests(t)`, đăng ký **cuối** `run.ts`, sau `runPrLopTests`
  :9679 và sau khối của PR đợt 2 nào đã merge trước).
- **Giữ hành vi:** phép kiểm cũ nhảy số (sosV3 `mkAttempt` no=2/3/5, keHoachTest MT80–95, seed `sosV3Seed.ts:58,84`) đổi dữ liệu cho
  **đúng luật mới** (tạo lượt thiếu trước) — không xoá phép kiểm, không nới luật. Số phép kiểm không giảm.
- **Ngày nghiệp vụ:** `demoToday()` (máy chủ) / `useNgayNghiepVu().homNay` (web).

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc nếu chạy phương án B — Fable)

1. Ba chỗ **dễ sai nhất** có mã mẫu trong Task: `laLichSu`/`trongCuaSoCase` (so **ngày kết thúc tuần** với ngày tạo, không so
   tuần bắt đầu), `kiemSoMtMoi` (đếm lượt **còn hiệu lực** = `status != 'cancelled'`), `hanDuyetDoiLan2` (Chủ nhật **của tuần chứa
   ngày gửi**, không phải tuần đích). Chép đúng mã mẫu, không "tối ưu".
2. **Một chốt duy nhất** cho đánh số: `createAttempt`. Không thêm kiểm riêng ở route. `xepMoi`/`xetMotEm` chỉ **gọi** `soMtKeTiep`
   để gợi ý/ xem trước cho khớp.
3. 🛑 **Dừng hỏi planning** nếu: (a) cần đổi `UNIQUE (cycle_id, attempt_no)` hay dựng lại bảng `assessment_attempts` (kế hoạch cố ý
   **không** làm — Q3); (b) phép kiểm cũ nào phải **xoá** thay vì sửa dữ liệu; (c) trần `tocDoDuong.ts` phải tăng; (d) `settleNoShows`
   tự dời mà làm đỏ phép kiểm RB-1 cron (`anToan.tests.ts:477-525`).
4. Không chạy bất kỳ lệnh nào có biến Turso. `bo-sung-mt-mac-dinh` chỉ thử trên DB demo.

## Task 0 · Nhánh, mốc, chép kế hoạch

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-mt-lich-mt -b pr-mt-lich-mt origin/main`.
- [ ] Kế hoạch này chưa có trên `main` thì chép từ nhánh planning được giao (`git checkout origin/<nhánh kế hoạch> -- docs/superpowers/plans/2026-09-29-pr-mt-lich-mt.md`).
- [ ] Ghi Nhật ký: PR-DUYET / PR-NHAP / PR-MON đã merge chưa (`git log origin/main --oneline | grep -E "PR-(DUYET|NHAP|MON)"`).
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B**.
- [ ] Đối chiếu dòng mã kế hoạch dẫn (grep `export function createAttempt`, `applySuggestedMockWeeks`, `settleGroup`, `expectationDelta`,
  `raiseSignalsForResult`, `scoreEditPath`, `migratePrLop(conn`) — lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-MT (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần `shared/domain/lichMt.ts` + kỳ vọng RF (M1, M2, M3, M4, M7, T33, T34, T36, T42, Q27-2, Q27-4, Q-B, K4-04, K5-49)

**Files:** tạo `shared/domain/lichMt.ts` (+ export trong `shared/domain/index.ts`), `server/src/tests/prMt.tests.ts`; sửa
`shared/domain/fasttrack.ts:14` (`expectationDelta`), `shared/domain/sos.ts:56-70, 156-165` (`academicSupportFor`, `sosCoordinationFor`),
`shared/domain/tenLop.ts:73-79` (`LUAT_LO_TRINH_HIEN` đọc từ `lichMtMacDinh` — một nguồn, K1-49), `server/src/tests/run.ts` (đăng ký).

**Interfaces:**
```ts
export const CUA_SO_CASE_LICH_SU_NGAY = 28;                              // M4 / Q27-2: 4 tuần
export function lichMtMacDinh(route: string | null): number[];           // 'RF' → [4, 8]; LT1/LT2 → [6, 12, 16]; null (lớp thường) → []
export function tuanHocCuaMt(route: string | null, n: number): number;   // n trong lịch mặc định → mốc; RF n>2 → 8 + 4(n−2); LT n>3 → MOCK_FT_STUDY_WEEK[n] ?? 16 + 4(n−3)
export function laLichSu(tuanKetThucMuonNhat: string, ngayTao: string): boolean;   // CN tuần thi muộn nhất < ngày tạo (T34, M-13)
export function trongCuaSoCase(tuanKetThucMuonNhat: string, ngayTao: string): boolean; // ≥ ngayTao − 28 ngày (M4)
export function luotSinhViec(a: { lich_su: number; tuanKetThuc: string | null; created_at: string }): boolean; // lượt thường, hoặc lịch sử trong cửa sổ
export type LuotSo = { attempt_no: number; status: string; coDiem: boolean };
export function soMtKeTiep(ds: LuotSo[]): number;                        // max(attempt_no còn hiệu lực hoặc huỷ-còn-điểm) + 1
export function kiemSoMtMoi(ds: LuotSo[], n: number): string | null;     // null = được; câu lỗi tiếng Việt
export type CachHuy = 'ca-luot' | 'phan-con-lai' | null;
export function cachHuyLuot(luot: LuotSo, ds: LuotSo[]): CachHuy;        // Q-B, M-12
export function hanDuyetDoiLan2(ngayGui: string): string;               // Chủ nhật của tuần chứa ngày gửi (T42, K4-04)
export const LUOT_TINH_NO_SQL = (a: string) => `${a}.lich_su = 0`;      // chèn vào WHERE mọi nơi đếm nợ/hạn (Task 5)
export function mocKeTiep<T extends { status: string; lich_su: number; weekStart: string | null; attempt_no: number }>(ds: T[], homNay: string): T | null;
  // lượt planned, không lịch sử, tuần ≥ thứ Hai tuần này, sớm nhất (K2-05, K2-31)
```
Mã mẫu cho chỗ dễ sai:
```ts
export function laLichSu(tuanKetThucMuonNhat: string, ngayTao: string) { return tuanKetThucMuonNhat.slice(0, 10) < ngayTao.slice(0, 10); }
export function trongCuaSoCase(tuanKetThucMuonNhat: string, ngayTao: string) {
  return tuanKetThucMuonNhat.slice(0, 10) >= addDaysIso(ngayTao.slice(0, 10), -CUA_SO_CASE_LICH_SU_NGAY);
}
export function kiemSoMtMoi(ds: LuotSo[], n: number): string | null {
  const con = ds.filter((x) => x.status !== 'cancelled');
  if (!Number.isInteger(n) || n < 1) return 'Số MT không hợp lệ.';
  if (con.some((x) => x.attempt_no === n)) return `Lộ trình này đã có MT${n}. Đổi tuần thay vì tạo mới.`;
  const ke = soMtKeTiep(ds);
  if (n > ke) return `Chưa có MT${ke} — tạo MT${ke} trước rồi mới tới MT${n}.`;
  if (ds.some((x) => x.attempt_no === n && x.status === 'cancelled' && x.coDiem)) return `MT${n} đã huỷ và còn điểm — số này không dùng lại.`;
  return null;
}
export function soMtKeTiep(ds: LuotSo[]) {   // lượt huỷ CÒN ĐIỂM (dữ liệu cũ) vẫn giữ số của nó
  return Math.max(0, ...ds.filter((x) => x.status !== 'cancelled' || x.coDiem).map((x) => x.attempt_no)) + 1;
}
export function cachHuyLuot(l: LuotSo, ds: LuotSo[]): CachHuy {
  if (l.status === 'cancelled') return null;
  return !l.coDiem && l.attempt_no === Math.max(...ds.filter((x) => x.status !== 'cancelled').map((x) => x.attempt_no)) ? 'ca-luot' : 'phan-con-lai';
}
export function hanDuyetDoiLan2(ngayGui: string) { const d = new Date(`${ngayGui.slice(0, 10)}T00:00:00Z`); const dow = (d.getUTCDay() + 6) % 7; return addDaysIso(ngayGui.slice(0, 10), 6 - dow); }
```
(`addDaysIso`: thêm `export` cho bản có sẵn ở `shared/domain/sos.ts:14` rồi import — không chép bản thứ năm.)
(`n < ke` với số huỷ **không** điểm = số được dùng lại — Q-B; lượt huỷ ở giữa kiểu cũ trên bản chính thì `kiemSoMtMoi` vẫn cho tạo lại
số đó — dữ liệu cũ, lệnh chạy thử liệt kê.)
- [ ] `expectationDelta(attemptNo, route?: string | null)`: `route === 'RF'` → `0`; còn lại như cũ. `academicSupportFor(attemptNo, sos,
  route?)`: RF → hàng `Math.max(3, …)`; `sosCoordinationFor(attemptNo, sos, route?)`: RF → hàng `Math.max(4, …)` (T4). Tham số **tuỳ chọn**
  để lời gọi cũ không vỡ; Task 4 truyền route ở mọi nơi gọi.
- [ ] `LUAT_LO_TRINH_HIEN.*.lichMt` dựng từ `lichMtMacDinh` (`'Tuần ' + ds.join(' · ')`), ghi chú trên hằng "một nguồn: lichMt.ts".
- [ ] **Phép kiểm** `prMt.tests.ts` khối 1: `PR-MT (1) · lichMtMacDinh LT1/LT2/RF/null` · `laLichSu` (CN 20/09 vs 21/09 → true; 20/09 vs
  20/09 → false) · `trongCuaSoCase` (biên đúng 28 ngày) · `kiemSoMtMoi` (MT1 khi rỗng được; MT3 khi mới có MT1 → "Chưa có MT2"; MT2 khi
  MT2 huỷ không điểm → được; MT2 khi MT2 huỷ có điểm → chặn; trùng → chặn) · `cachHuyLuot` (max không điểm → ca-luot; max có điểm / ở
  giữa → phan-con-lai) · `hanDuyetDoiLan2` (T2 28/09 → CN 04/10; CN 04/10 → 04/10) · `expectationDelta(1,'RF') === 0`,
  `expectationDelta(1,'LT1') === 1` · `mocKeTiep` (MT1–MT3 tương lai → MT1; MT1 lịch sử + MT2 tương lai → MT2) · `academicSupportFor(1, 2, 'RF')` = hàng MT3 (`TUTOR_EXAM`) · `sosCoordinationFor(1, 3, 'RF')` = hàng 4.
- [ ] `npm run check` → commit `PR-MT (1): luật thuần lịch MT mặc định, MT lịch sử, đánh số, huỷ lượt, kỳ vọng RF`.

## Task 2 · Migrate `prMt.ts` + lệnh chạy thử `chay-thu:mt` (T78, K5-22, K5-67, K4-09 phần báo)

**Files:** tạo `server/src/migrate/prMt.ts`, `server/src/migrate/chayThuMt.ts`; sửa `server/src/migrate.ts` (1 import :12-13 + 1 dòng sau
:457), `server/src/schema.sql:456-505` (cột `lich_su INTEGER NOT NULL DEFAULT 0 -- MT lịch sử: tuần thi đã qua trước ngày tạo lượt, lưu
lúc tạo (T34)` ngay trước `UNIQUE` :504), `package.json` (`"chay-thu:mt": "npm run build:server && node dist-server/server/src/migrate/chayThuMt.js"`).

**Interfaces:**
```ts
export function migratePrMt(conn: any, applied: string[]): void;          // ALTER ADD nếu thiếu; chạy lại không đổi gì
export function lotrinhNhaySo(conn: any): { hv: string; ten: string; lop: string | null; loTrinh: string; so: string }[];  // 'MT1, MT3' — chỉ báo
export function luotHuyGiua(conn: any): { hv: string; mt: string; coDiem: number }[];  // lượt huỷ không phải lớn nhất (dữ liệu cũ)
```
- [ ] `migratePrMt`: `PRAGMA table_info(assessment_attempts)` thiếu `lich_su` → `ALTER TABLE assessment_attempts ADD COLUMN lich_su INTEGER
  NOT NULL DEFAULT 0` → `applied.push('PR-MT: cột assessment_attempts.lich_su (MT lịch sử, T34). Dữ liệu cũ = lượt thường.')`. **Không**
  đổi dòng nào: lượt đang có trên bản chính giữ `0` (đã chạy theo luật cũ; không ai bị tính lại nợ ngược).
- [ ] `chayThuMt.ts` theo mẫu `chayThuLop.ts` (không tạo file DB khi thiếu, thoát nếu `!isInitialised()`, `bang(rows)`, `closeDb()`), CHỈ
  ĐỌC, in: (1) cột `lich_su` đã có chưa; (2) **danh sách `bo-sung-mt-mac-dinh` sẽ tạo** (gọi `keHoachBoSung(conn, homNay)` của Task 3 —
  cột `Mã HV · Tên · Lớp · Lộ trình · Tuần bắt đầu · MT · Tuần · lịch sử / lượt thường`); (3) em FT **thiếu tuần bắt đầu** (không lập được);
  (4) em FT đã có ≥ 1 lượt (không bổ sung — chỉ số lượng); (5) `lotrinhNhaySo`; (6) `luotHuyGiua`.
- [ ] **Phép kiểm** khối 2: DB test cũ (DROP cột bằng dựng bảng tạm không cần — dùng `conn` sạch từ `schema.sql` đã có cột): `migratePrMt`
  chạy hai lần không lỗi, `applied` lần hai rỗng; `lotrinhNhaySo` bắt được một lộ trình MT1 + MT3 dựng tay bằng `INSERT` (bỏ qua
  `createAttempt`).
- [ ] Chạy `npm run chay-thu:mt` trên DB demo worktree, dán kết quả vào Nhật ký. `npm run check` → commit
  `PR-MT (2): migrate cột lich_su + lệnh chạy thử chỉ đọc`.

## Task 3 · Máy chủ: `taoMtMacDinh` + gắn vào mọi nơi mở lộ trình FT + lệnh `bo-sung-mt-mac-dinh` (M1, M5, M6, T33, T35, K2-17, K2-33, K4-02, K5-60)

**Files:** tạo `server/src/fasttrack/mtMacDinh.ts`, `server/src/ops/boSungMtMacDinh.ts`; sửa `server/src/classes/schedule.ts:53-160`
(`suggestedMockWeeks` theo lộ trình, `applySuggestedMockWeeks` gọi lõi chung), `server/src/classes/intake.ts:361, 462-485`,
`server/src/classes/luatLoTrinh.ts:239-252` (một em) và `:408-434` (cả lớp), `server/src/fasttrack/cycles.ts:87-124` (`createCycle`),
`server/src/fasttrack/cycles.ts:200-219` (`updateCycle` đổi tuần bắt đầu), `package.json` (script).

**Interfaces (PR-NHAP dựa vào — không đổi tên/chữ ký khi chưa báo planning):**
```ts
// server/src/fasttrack/mtMacDinh.ts
export type LuotMacDinh = { attemptId: number; attemptNo: number; weekStart: string; lichSu: boolean };
/**
 * M1 — tạo lượt MT mặc định còn thiếu cho MỘT lộ trình FT. Gọi TRONG tx của nơi mở lộ trình; KHÔNG tự kiểm quyền (người gọi đã kiểm).
 * Lộ trình không có route (lớp thường) hoặc chưa có start_period_id → []. Chạy lại không tạo trùng (bỏ số đã có lượt còn hiệu lực).
 * ngayTao: mốc "lịch sử" — mặc định demoToday(); lệnh bổ sung truyền ngày chạy lệnh (K4-02).
 * daThiToiMt: 0–8, tạo thêm MT(n) tới số này (K2-33, cột của PR-NHAP); không truyền = lịch mặc định (T33, không MT4+).
 */
export function taoMtMacDinh(cycleId: number, opts: { actorUserId: number | null; ngayTao?: string; daThiToiMt?: number }): LuotMacDinh[];
export function keHoachBoSung(conn: any, ngayChay: string): { studentCode: string; ten: string; lop: string | null; route: string;
  tuanBatDau: string; mt: number; tuan: string; lichSu: boolean; cycleId: number }[];   // dùng chung cho chay-thu:mt và lệnh bổ sung
```
- [ ] **Lõi chung**: tách thân `applySuggestedMockWeeks` (schedule.ts:97-160) thành `apLichMacDinh(cycleId, actor, { ngayTao, daThiToiMt,
  chiTao })`: số lượt = `max(lichMtMacDinh(route).length, daThiToiMt ?? 0)`, tuần = `tuanHocCuaMt(route, n)`; **tạo** lượt thiếu với
  `plan_source='auto'`, `lich_su = laLichSu(week_end của tuần đó, ngayTao) ? 1 : 0`, `target_at_attempt = cy.target_score`, `ensureSkillRows`,
  `logSchedule('created', reason 'Lịch MT mặc định')`, journey `mock_scheduled` (một dòng gộp cho cả lộ trình, không 3 dòng); **dời**
  (khi không `chiTao`) chỉ lượt `plan_source='auto'` **không có điểm nào** và kỹ năng `'auto'` + `'scheduled'` (K2-33: thêm điều kiện "chưa
  có điểm"), rồi tính lại `lich_su` theo `created_at` của lượt. `suggestedMockWeeks` dùng `lichMtMacDinh(cy.route)` (RF hết gợi ý tuần 16).
  `applySuggestedMockWeeks(p, …)` giữ kiểm quyền rồi gọi lõi; `taoMtMacDinh` = lõi với `chiTao: true`.
- [ ] **Gắn** (mỗi chỗ một lời gọi, trong tx đang có): `commitIntake` sau INSERT `learning_cycles` (:472) khi lớp FT (`route` có) —
  thay chú thích :478-485 bằng "M1: lịch MT mặc định tạo ngay, MT đã qua là MT lịch sử (T33, T34)", `canPlanWeeks: true`; `luatLoTrinh.ts`
  nhánh `dong-mo` một em (:246-251) khi `denLop.ft`; nhánh cả lớp (:431-434) — INSERT hàng loạt không trả id → sau câu INSERT đọc
  `SELECT id FROM learning_cycles WHERE student_id IN (…) AND status='active' AND route IS NOT NULL` (một câu, `?` theo số em) rồi gọi từng
  id; `createCycle` (:108): điền `start_period_id = ensurePeriod(mondayOf(startedAt)).id` khi có `route` (hiện bỏ trống → không lập được
  lịch) rồi gọi. **Không** gắn vào seed (`seed/build.ts` tự khai lượt).
- [ ] **K5-60 (đổi LT ↔ RF = lộ trình mới, Case đi theo):** trong nhánh `dong-mo` FT → FT (`tuLop.ft && denLop.ft`), sau INSERT lộ trình
  mới: `UPDATE sos_cases SET cycle_id = ?, dedup_key = ? WHERE student_id = ? AND cycle_id = ? AND status != 'done'` (khoá mới dựng bằng
  `caseDedupKey` `shared/domain/cases.ts:193` — tính trong JS từng Case, **không** ghép chuỗi SQL) + `case_milestones` mốc "Sang lộ trình
  {RF}" (dedup theo case + cycle). Lượt `planned` của lộ trình cũ giữ nguyên ở lộ trình cũ (Q12 của LOP).
- [ ] **Đổi tuần bắt đầu (`updateCycle` :200-219):** giữ gọi `applySuggestedMockWeeks`; GVCN không có `PLAN_WEEK` → hiện đang nuốt lỗi
  im lặng: đổi thành gọi **lõi** trực tiếp (hệ thống dời lượt `auto` chưa điểm — K2-33 là luật, không phải quyền QL) và journey ghi "MT2,
  MT3 dời sang W2 OCT, W2 NOV". Câu xác nhận ở panel là PR-NHAP (Thông tin HV).
- [ ] **Lệnh `bo-sung-mt-mac-dinh`** (`ops/boSungMtMacDinh.ts`, script `"bo-sung-mt-mac-dinh": "npm run build:server && node
  dist-server/server/src/ops/boSungMtMacDinh.js"`): mặc định **chạy thử** = in `keHoachBoSung(conn, homNay)` (`homNay = todayInBusinessTz()`
  trên bản chính, `demoToday()` ở demo) + dòng tổng `n em · m lượt · k lịch sử`; `--that` → kiểm như `migrate/run.ts` (Turso cần
  `PISA_CHO_PHEP_MIGRATE_TURSO` đúng tên máy) → một `tx` gọi `taoMtMacDinh(cycleId, { actorUserId: null, ngayTao: homNay })` cho từng
  lộ trình trong danh sách → in số đã tạo; chạy lại lần hai tạo 0. Chọn em: lộ trình `status='active'`, `route IS NOT NULL`,
  `start_period_id IS NOT NULL`, **không** có lượt nào (`status != 'cancelled'`).
- [ ] **Phép kiểm** khối 3: (a) `commitIntake` một em FT LT1 tuần bắt đầu = hôm nay → MT1/2/3 ở tuần học 6/12/16, `lich_su=0`, bốn kỹ năng
  cùng tuần; (b) em RF → đúng 2 lượt tuần 4/8; (c) **H1** tuần bắt đầu 22 tuần trước → 3 lượt `lich_su=1`; (d) chạy `taoMtMacDinh` lần hai →
  `[]`; (e) chuyển em LT1 → lớp `MB FT RF 12` → lộ trình mới RF có MT1/MT2 mới, Case L đang mở chuyển `cycle_id` mới, không có hai Case L;
  (f) `keHoachBoSung` với ngày chạy sau tuần MT1 → MT1 `lichSu=true` (K4-02), MT2 tương lai `false`; `--that` hai lần → lần hai 0;
  (g) đổi tuần bắt đầu của em có MT1 đã có điểm → MT1 đứng yên, MT2/MT3 dời.
- [ ] `npm run check` → commit `PR-MT (3): tự tạo MT mặc định khi mở lộ trình FT, RF 4/8, lệnh bo-sung-mt-mac-dinh`.

## Task 4 · Kỳ vọng / PA quy chế / Phối hợp theo lộ trình của lượt (M2, T4, Q27-4, K5-49, YC-3 phần luật)

**Files:** `server/src/fasttrack/scoring.ts:109-112, 164` (`expectationFor(target, attemptNo, route?)`, `evaluateAttempt(…, route?)`),
`server/src/fasttrack/attempts.ts:160-178` (`resultOf` lấy `attempt.route`; thiếu thì đọc `learning_cycles.route` theo `cycle_id` — **một**
câu có nhớ tạm theo `cycle_id` trong lần gọi), `server/src/cases/cases.ts:2156`, `server/src/classes/phanTichLop.ts:73`,
`server/src/phanTich/tongHop.ts:194`, `server/src/students/profile.ts:71`, `server/src/students/students.ts:112`,
`server/src/students/standing.ts:238`, `server/src/seed/build.ts:474`, `server/src/cases/sosAuto.ts:62` (`presetFor` truyền route),
`server/src/yThuc/phoiHop.ts:51` (`syncSosCoordination` truyền route).
- [ ] Mỗi nơi gọi thêm `cy.route` vào SELECT đang có (JOIN `learning_cycles cy ON cy.id = a.cycle_id` — phần lớn đã JOIN; `ATTEMPT_SELECT`
  attempts.ts:522-532 đã có `cy.route`) và truyền xuống. Không thêm câu SQL mỗi dòng.
- [ ] **Phép kiểm** khối 4: em RF target 6.5, MT1 L 6.0 → dưới kỳ vọng (6.5), SOS 1; em LT1 cùng điểm → đạt (kỳ vọng 5.5); RF MT1 SOS 2 →
  PA quy chế `Tutor · đến lúc thi` (hàng MT3), Phối hợp theo hàng MT4 (D1); bảng Case (`skillSupportBoard`), Phân tích lớp, Tổng hợp Test
  cùng ra kỳ vọng 6.5 cho em RF.
- [ ] `npm run check` → commit `PR-MT (4): RF mọi MT kỳ vọng = target, PA quy chế và Phối hợp theo lộ trình`.

## Task 5 · MT lịch sử không vào nợ / hạn / quá hạn / chờ chấm / độ phủ (M3, T34, K4-01, K5-22, K5-54, K2-05, K2-31, K1-04, K5-09)

**Cách làm: một chốt + vá các đường đi vòng.** Chốt: `viewSkill` (`server/src/fasttrack/skillSchedule.ts:254`, gọi từ `skillCells`
attempts.ts:274, `regularSkillViews` :399, `attemptDetail` :864) nhận `lichSu` → `progress = 'lich_su'` (thêm vào union tiến độ; **không**
thuộc `awaitingScore` `shared/domain/fasttrack.ts:200`), `overdue = false`, `deadline = null`. Nhờ đó `pendingSkillsOf` (:244),
`listAttempts` (`pendingDetail`, `overdueSkills`), `noTuanTruoc` (canCham.ts:176-250), `mywork` nhóm "Nhập điểm Test" (:417-460),
`dashboard.ts:31-32`, `nhacViec.ts` tự đúng. `pendingInputOf` (attempts.ts:230) mang theo cờ.

**Đường đi vòng — sửa từng chỗ (mỗi chỗ thêm `lich_su` vào SELECT nếu câu liệt kê cột, rồi lọc):**

| # | Chỗ | Sửa |
|---|---|---|
| 1 | `attempts.ts:354-356` `skillCells` tự tính lại `overdue` | thêm `&& !lichSu`; `:733-739` `myPendingSkills` lọc riêng → dùng `awaitingScore` (đã loại `lich_su`) |
| 2 | `worklist/scoreDebt.ts:20` `NOT_DEBT`, :67-81 | thêm `'lich_su'` vào `NOT_DEBT` **và** bỏ lượt `a.lich_su = 1` ở :67 (phủ `branchpulse.ts:291-296` Theo giáo viên, `metrics.ts:393-407` `bai-qua-han-nhap-diem`, Tổng quan) |
| 3 | `cham/canCham.ts:380-390` SQL `lichTest`, :419, :471-491, :511-515 | SELECT `a.lich_su`; :419 bỏ dòng `lich_su` → không vào `tong/conBai/quaHan`, không `lopTuMo`, không dải số |
| 4 | `classes/classes.ts:149-154` (badge "n bài chờ chấm"), :440-492 (dòng thời gian em), :604-621 (`hasNextMilestone`, `next`, "Việc tiếp theo") | SELECT `a.lich_su`; truyền vào `skillCells`/`regularSkillViews`; mốc kế tiếp theo hàm `mocKeTiep` (dưới) |
| 5 | `worklist/mywork.ts:541-556` (`decide_move`), :866-881 (`missing_data`) | `AND a.lich_su = 0`; **K5-09**: thêm việc `missing_data` "HS FT chưa có target" (GVCN, không hạn, `learning_cycles.route IS NOT NULL AND target_score IS NULL`), sửa câu gợi ý nhóm cho đúng các loại đang có |
| 6 | `worklist/danhGia.ts:115-150` `latestAttempts` (`hv-sos-hien-tai`, `hv-duoi-ky-vong-mon`, `do-phu-danh-gia`) | **K5-54**: "mới nhất" = `attempt_no` lớn nhất trong lộ trình (không theo tuần/ngày nhập); `due` (độ phủ) bỏ lượt `lich_su = 1` chưa đủ điểm; `valid` (SOS hiện tại, **M-14**) bỏ lượt lịch sử **ngoài** cửa sổ 4 tuần (`luotSinhViec`) |
| 7 | `phanTich/boQuen.ts:99-107` (K1-04) | bỏ lượt lịch sử ngoài cửa sổ khỏi `hopLe` (không báo động giả "2 lần Test liền") |
| 8 | `students/standing.ts:207-217` (K2-31), `classes/hocVienLop.ts:107, 209` (K2-05), `schedule.ts:516` | một hàm `mocKeTiep(luot[], homNay)` ở `lichMt.ts`: lượt `planned`, **không** `lich_su`, tuần ≥ tuần này, sớm nhất. `hasNextMilestone` = có `mocKeTiep` **hoặc** (FT đã qua MT cuối của lịch mặc định **và** có ngày/tháng thi) — `so_luot_ke_hoach` đổi thành đếm theo điều kiện này (một câu, không N+1) |
| 9 | `fasttrack/attempts.ts:1317-1341` (`-` tuần đã qua) | lượt lịch sử đã chặn `noShow` ở Task 6 → không vào C10 |
| 10 | Web: `ScoreEntry.tsx:623-648` `DeadlinePill`, `LuoiFT.tsx:47-49, 167-190`, `MockDetailPage.tsx:463, 737-746`, `KhoiNo.tsx`, `DaiSo.tsx`, `StudentsPage.tsx:390-425` | `progress === 'lich_su'` → không hạn, không "Quá hạn", không vào "còn nợ"; nhãn theo Task 9 |

Không đổi: `weekly.ts` (báo cáo tuần — lượt lịch sử nằm ở tuần cũ của nó, đúng), lớp thường (`lich_su` chỉ đặt cho `kind='mock'`).
- [ ] **Phép kiểm** khối 5 (**M3 / K4-01 / H1**): chụp số trước → thêm em H1 (22 tuần, MT1–MT3 lịch sử chưa điểm) → so **bằng nhau**:
  `lichTest(...).tongQuan` (dải số) + khối Nợ, `scoreDebtCells` (số + quá hạn), `myWork` của GVBM lớp (không việc `score` mới), badge
  `soBaiChoCham` lớp, `metricSet` `bai-qua-han-nhap-diem` + `do-phu-danh-gia`, `branchpulse` `mtPending/mtOverdue`. Em đó: `hasNextMilestone`
  không bật "Thiếu thông tin" vì MT lịch sử; em FT mới tạo hôm nay có `mocKeTiep` = MT1 (không phải MT3 — K2-31). Em FT thiếu target → có
  việc `missing_data` cho GVCN. `danhGia` chọn "mới nhất" theo `attempt_no`.
- [ ] `npm run check` (trần `tocDoDuong.ts` không tăng — `/cham/lich-test` 36) → commit `PR-MT (5): MT lịch sử không vào nợ, hạn, quá hạn, độ phủ; mốc kế tiếp đúng`.

## Task 6 · MT lịch sử: GVCN nhập đủ 4 kỹ năng, R11 sau 7 ngày, không "-", chỉ lượt gần nhất trong 4 tuần sinh Case (T34, M4, M-14, K5-21, K5-31, K4-20, K5-15, H2, H3)

**Files:** `server/src/permissions.ts:466-513`, `server/src/fasttrack/hoanTat.ts:21-101`, `server/src/fasttrack/attempts.ts:1226-1480`
(`saveScore`: đường quyền, `noShow`), `server/src/cases/sos.ts:264-285, 325, 444` (`raiseSignalsForResult`), `shared/domain/nhatKy.ts:9`.

**Interfaces:**
```ts
export function scoreEditPath(p: Principal, classId: number, skill: string,
  attempt?: { lich_su: number; coDiemO: boolean }): 'assigned' | 'lich_su' | 'override' | null;   // 'lich_su' = GVCN lớp + lượt lịch sử + ô chưa có điểm
```
- [ ] **Quyền (K5-31):** thứ tự `assigned` → `lich_su` (`isCoreTeacherOf(p, classId)` + `attempt.lich_su === 1` + `!coDiemO`) → `override`.
  `editableSkills`/`mySkills` nhận `attempt?` tuỳ chọn; truyền lượt ở mọi chỗ quyết quyền **của FT**: attempts.ts `skillCells` :255
  (`canEdit` :360-361), :595, `attemptDetail` :957, `saveScore` :1248, `classScoreSheet` :1532 — để GVCN thấy ô mở ở **cả 4** kỹ năng của
  lượt lịch sử (máy chủ trả `canEdit`, web không tự suy). Chỗ gọi theo lớp (classes.ts:176, :337, :728; hocVienLop.ts:161; canCham.ts:249)
  giữ nguyên — không có lượt cụ thể. Sửa ô **đã có** điểm của lượt lịch sử: GVCN không dạy
  môn đó → theo đường cũ (GVBM đúng môn / QL `override` + lý do RB-5). Nhật ký `score.lich_su` — nhãn "Nhập điểm MT lịch sử" ở `nhatKy.ts`.
- [ ] **R11 (K5-21, K4-20):** `dotHoanTatMany` — lượt `lich_su = 1`: hoàn tất = **7 ngày** sau `MAX(entered_at)` các ô của lượt (chưa có ô
  nào → chưa hoàn tất); không dùng "hết CN tuần muộn nhất". Một câu thêm vào truy vấn đang có (`GROUP BY attempt_id`), không N+1.
- [ ] **Không "-" (K4-20):** `saveScore` với `patch.noShow === true` và lượt `lich_su = 1` → `badRequest('MT lịch sử không nhận dấu "-" —
  để trống ô nếu không có dữ liệu.')`; `settleNoShows` thêm `AND a.lich_su = 0` (phòng dữ liệu cũ).
- [ ] **SOS (M4, M-14, K5-15):** đầu `raiseSignalsForResult` (sos.ts:264): `if (!luotSinhViec({ lich_su, tuanKetThuc, created_at })) return;`
  (tuần kết thúc = `week_end` của `planned_period_id` — tuần hoàn tất). Chặn **một chỗ** này là chặn cả Case, PA quy chế, Phối hợp (:285),
  `announceAutoCase`, `notifyTeachers` (:444) — không để tín hiệu `pending` rơi vào nhánh `silent` (:347). Lượt lịch sử **trong** cửa sổ:
  `detectedAt = demoToday()` (không phải thứ Hai tuần thi — nếu không hạn 3 ngày quá hạn ngay; K5 §4 dòng 6).
- [ ] **Phép kiểm** khối 6: (a) GVCN Hà nhập Reading (Hà không dạy R) MT2 lịch sử của em D2 → được, nhật ký `score.lich_su`; sửa lại chính
  ô đó → bị từ chối (đường `lich_su` chỉ cho ô trống), QL sửa có lý do → được; (b) lượt thường → GVCN không dạy R bị từ chối như cũ;
  (c) R11: nhập ô cuối hôm nay → `hoanTat=false`; `today + 8` → `true`; (d) `noShow` trên lượt lịch sử → lỗi đúng câu; (e) **H2**: MT2 lịch sử
  tuần thi cách 10 tuần, nhập 4 kỹ năng SOS 2 → không Case, không `case_signals`, không thông báo SOS; **H3**: MT3 lịch sử cách 2 tuần có SOS →
  Case + PA quy chế + Phối hợp, hạn tính từ hôm nay.
- [ ] `npm run check` → commit `PR-MT (6): MT lịch sử — GVCN nhập đủ, R11 7 ngày, không dấu "-", cửa sổ 4 tuần sinh Case`.

## Task 7 · Đánh số liền mạch + Huỷ cả lượt / Huỷ phần còn lại (T36, T67, Q-B, M7, M-12, K4-08, K4-09, K4-18 phần dữ liệu, YC-13.3)

**Files:** `server/src/fasttrack/attempts.ts:967-1017` (`createAttempt`), `:1125-1150` (`cancelAttempt` → `huyLuot`, `reopenAttempt`),
`server/src/fasttrack/cycles.ts:37-42` (`nextAttemptNo`), `server/src/keHoach/keHoachTest.ts:234-236, 411-414, 573-615` (`luoiFT` cột,
`xepMoi` số mặc định, `xetMotEm`), `server/src/cases/systemClose.ts:52-127` + `shared/domain/cases.ts:493-499` (lý do `luot_da_huy`),
`server/src/routes/index.ts:784-792`, `web/src/modules/test/keHoach/ChipKyNang.tsx:21-28`, `web/src/modules/fasttrack/MockDetailPage.tsx:127-149, 869-900`.

**Interfaces:**
```ts
export function huyLuot(p: Principal, attemptId: number, input: { lyDo: string; cach: 'ca-luot' | 'phan-con-lai' }):
  { cach: CachHuy; kyNangHuy: string[]; dong: { case: number; pa: number; phoiHop: number } };
export function heQuaHuyLuot(attemptId: number): { cachDuoc: CachHuy; case: number; pa: number; phoiHop: number };  // hộp nói trước (K4-10)
```
- [ ] **Một chốt (K4-08):** trong `createAttempt` trước `tx`: đọc `LuotSo[]` của lộ trình (một câu: `attempt_no, status, EXISTS(điểm)`),
  `n = input.attemptNo ?? soMtKeTiep(ds)`, `kiemSoMtMoi(ds, n)` khác null → `badRequest(câu)`. Mọi đường (`POST /attempts` index.ts:496,
  `bulkPlan` planning.ts:98, `xepMoi` keHoachTest.ts:425 ← `/xep-moi` :549 và `/hang-loat` :565) đi qua đây. `nextAttemptNo` (cycles.ts:37)
  đổi thành `soMtKeTiep`; `xepMoi` :411-414 bỏ câu MAX riêng, dùng `soMtKeTiep`; `xetMotEm` (:573) gọi `kiemSoMtMoi` → dòng "Chặn: chưa có
  MT2" thay vì "tao" rồi lưu mới hỏng.
- [ ] **Dùng lại số (Q-B) không dựng lại bảng:** số `n` có lượt `cancelled` **không điểm** → `createAttempt` **hồi sinh** chính dòng đó
  (`status='planned'`, xoá `cancel_*`, `planned_period_id` mới, `plan_source='manual'`, `DELETE FROM attempt_skills WHERE attempt_id = ?`
  rồi `ensureSkillRows`, `lich_su` tính lại theo **hôm nay**, `created_at` giữ, `logSchedule('recreated', …)`, nhật ký
  `attempt.recreate` "Tạo lại MTn (số dùng lại)"). Giữ `UNIQUE (cycle_id, attempt_no)` — xem Q3.
- [ ] **Huỷ (T36, M-12, T67):** `huyLuot` thay thân `cancelAttempt` (route `/attempts/:id/cancel` nhận thêm `cach`, thiếu thì lấy
  `cachHuyLuot`): `'ca-luot'` chỉ khi `cachHuyLuot(...) === 'ca-luot'` (ngược lại `badRequest('Chỉ huỷ cả lượt được với lượt lớn nhất chưa có
  điểm nào — dùng "Huỷ phần còn lại".')`) → như cũ (status cancelled); `'phan-con-lai'` → mọi kỹ năng chưa có điểm, chưa `sat`: `sit_status =
  'cancelled'` (cùng nhật ký `attempt.cancel_part` đang có), lượt **giữ** số và trạng thái. Cả hai: đóng thứ **sinh từ lượt đó**:
  `sos_coordination_actions` còn mở có `attempt_id = ?` → huỷ; Case có **mọi** mốc từ lượt này (không mốc lượt khác, không PA đã có kết
  quả) → `closeCasesBySystem` với lý do mới `luot_da_huy` ("lượt đã huỷ" — không tính thất bại, loại khỏi hiệu quả PA như `system_closed`)
  — thêm tham số lọc `caseIds?` vào `closeCasesBySystem` (một nhánh `AND id IN (…)`). `reopenAttempt`: chặn khi đã có lượt còn hiệu lực
  cùng số (không xảy ra với hồi sinh — phòng dữ liệu cũ) và bọc `tx`.
- [ ] **Lưới (tối thiểu, K4-08):** `luoiFT` trả thêm `soKeTiep` theo em; `ChipKyNang` chỉ vẽ "+ xếp" ở ô `attemptNo === soKeTiep`, ô xa hơn
  để trống (`—` mờ). Cột lưới giữ như cũ (PR-XLMT dựng lại).
- [ ] **MockDetailPage (tối thiểu):** menu đầu trang hiện **một** mục theo `heQuaHuyLuot().cachDuoc`: "Huỷ cả lượt MT{n}" hoặc "Huỷ phần
  còn lại"; `CancelDialog` :869-900 ghi hệ quả thật ("Số MT{n} sẽ dùng lại được." / "MT{n} giữ số; kỹ năng đã có điểm giữ nguyên." + "Đóng
  {k} Case, {m} việc Phối hợp sinh từ lượt này" khi > 0). Lý do bắt buộc (giữ).
- [ ] **Phép kiểm** khối 7 (D6): (a) `POST /attempts` MT3 khi mới có MT1 → 400 "Chưa có MT2"; `/ke-hoach-test/xep-moi` và `/hang-loat`
  cùng bị chặn (hang-loat: dòng `loi` + xem trước báo chặn); (b) huỷ cả lượt MT3 (lớn nhất, chưa điểm) → tạo lại MT3 được, **cùng id**, số
  MT3; (c) huỷ cả lượt MT2 khi còn MT3 → 400; "Huỷ phần còn lại" MT2 có L R → W S `cancelled`, số giữ; (d) Case chỉ có mốc từ lượt bị huỷ
  phần còn lại **không** đóng (điểm thật); Phối hợp mở của lượt huỷ cả lượt → huỷ; (e) sửa dữ liệu phép kiểm cũ nhảy số (Global
  Constraints) — đếm số phép kiểm trước/sau bằng nhau.
- [ ] `npm run check` → commit `PR-MT (7): đánh số MT liền mạch ở một chốt, huỷ cả lượt dùng lại số, huỷ phần còn lại, đóng việc sinh từ lượt`.

## Task 8 · Dời do vắng: lần 1 tự dời, lần 2 chờ QL hạn hết CN, QL dời bài vắng = dời do vắng (M8, Q-A, T42 phần MT, C09, YC-13.1, K4-03, K4-04, K4-12)

**Files:** `server/src/fasttrack/absence.ts:143-294` (`requestAbsenceMove` tách lõi), `:357-413` (`decideAbsenceMove` tuần đích mặc định),
`:656-696` (`settleGroup` gọi tự dời), `server/src/fasttrack/skillSchedule.ts:577-670` (`setSkillWeek` bài đang vắng), `shared/domain/nhatKy.ts`.

**Giao kèo với PR-DUYET (thẻ Lịch thi):** nguồn dữ liệu vẫn là `skill_move_requests` (DUYET tạo dòng `yeu_cau_duyet` loại "Dời lịch MT lần
2" trỏ tới đó, hàm "khi duyệt" = `decideAbsenceMove(p, id, { approve: true, periodId })`, "khi từ chối" = `{ approve: false, note }`, "tự đóng"
= `sweepExpiredMoves` đặt `expired`). PR-MT **xuất** cho DUYET: `hanDuyetDoiLan2` (Task 1), `tuanDichMacDinh` (dưới), chữ thẻ `moTaDoiLan2(req)`
= `"Dời S · MT3 · lần 2 · Duyệt = S thi W2 OCT"`. PR-MT **không** vẽ thẻ. Ai merge sau giữ **cả** dòng gọi thẻ của DUYET trong
`insertRequest`/`sweepExpiredMoves` lẫn luật của MT.

**Interfaces:**
```ts
export function tuanDichMacDinh(attemptId: number, skill: string, today: string): { id: number; code: string; week_start: string } | null;
  // tuần CHƯA bắt đầu gần nhất (week_start > today) mà checkSkillWeekMove không chặn; thử tối đa 8 tuần; không có → null
export function moTaDoiLan2(req: { attempt_id: number; skill: string; move_no: number; to_period_id: number }): string;
function xuLyVangMotKyNang(conn: any, actor: number | null, attempt: any, row: any, o: { lyDo: string | null; today: string; idem: string | null }): MoveOutcome;
```
- [ ] Tách thân vòng lặp `requestAbsenceMove` (:196-290) thành `xuLyVangMotKyNang` (không đổi luật lần 1 của GVCN bấm tay). Đề nghị lần 2+
  (và nhánh `escalate`): `decide_by = hanDuyetDoiLan2(today)` (**hết CN tuần gửi** — thay `decideByOf`/"hôm nay"), `to_period_id =
  tuanDichMacDinh(...)?.id ?? target.id`.
- [ ] **Tự dời (Q-A, K4-03):** `settleGroup` trả `true` với lượt `kind='mock'` → gọi `xuLyVangMotKyNang(conn, null, attempt, row, { lyDo:
  'Không dự thi — máy tự dời', today, idem: \`auto-vang:${schedId}:${weekEnd}\` })` trong cùng `tx`: lần 1 + tuần kế tiếp còn thi được + không
  chặn T15 → `applyMove` (nhật ký `attempt.absence_auto_move` "Máy tự dời do vắng lần 1"); còn lại → đề nghị chờ QL. Thông báo: đổi câu
  :683-694 thành "Đã tự dời {kỹ năng} sang {W…} (vắng lần 1)" gửi **GVCN + GVBM đúng kỹ năng** (dedup giữ mẫu cũ); lần 2 → `notifyPlanners`
  như cũ. Lượt `lich_su = 1` không vào (Task 6 đã lọc).
- [ ] **QL dời bài vắng (K4-12):** `setSkillWeek` khi `row.sit_status === 'absent'` → tăng `absence_move_count` (+1), `logSchedule` action
  `skill_week_moved_absence` reason "QL xếp trực tiếp", nhật ký `attempt.absence_move` — thay chú thích :632-639. Kỹ năng chưa vắng giữ
  "dời chủ động".
- [ ] **Hiện ở Lịch Test (YC-13.1 (3), K4 §4e):** `canCham.ts` `dungLuiLich` (:115-166) phân biệt lần 1 tự dời → nhãn `dời từ W3 SEP ·
  vắng lần 1` ra khỏi tooltip (`KhoiNo.tsx:14-23` hiện thẳng dòng phụ); kỹ năng có đề nghị `pending` ở tuần đang xem → dòng tím nhạt
  `vắng · chờ QL duyệt dời` trong hàng lớp (một truy vấn gộp `pendingMovesFor` :129 cho mọi lượt của trang, không N+1).
- [ ] **Phép kiểm** khối 8 (đi từ dấu "-", không từ "Ghi nhận vắng" — K4-04): (a) GVBM gõ "-" cả L R W1 W2 tuần W3 SEP, `settleNoShows(T2
  tuần sau)` → kỹ năng `scheduled` ở tuần kế tiếp, `absence_move_count=1`, thông báo GVCN + GVBM; (b) lần 2 → `skill_move_requests
  pending`, `decide_by` = CN của tuần chạy, `to_period_id` = tuần chưa bắt đầu gần nhất; (c) `sweepExpiredMoves` sau CN đó → `expired` +
  huỷ phần thi (C09); (d) QL `setSkillWeek` một kỹ năng đang vắng → đếm +1, lần vắng sau thành lần 2; (e) phép kiểm cũ :6362-6528,
  :8599-8740 còn xanh (cập nhật kỳ vọng "lần 1 GVCN bấm" chỉ khi nay máy đã tự dời — ghi Nhật ký từng chỗ); RB-1 cron không đổi.
- [ ] `npm run check` → commit `PR-MT (8): tự dời vắng lần 1, đề nghị lần 2 hạn hết CN, QL dời bài vắng tính lần vắng`.

## Task 9 · Web: nhãn `lịch sử`, dòng nhắc MT lịch sử, không hạn ở lượt lịch sử (T34, K2-32, K4 §4a) — **`/ponytail lite`** đầu Task

**Files:** `web/src/modules/test/lichTest/LichTestTab.tsx:205` + `KhoiNo.tsx`, `web/src/modules/test/keHoach/ChipKyNang.tsx`,
`web/src/modules/fasttrack/MockDetailPage.tsx` (đầu trang + `DeadlinePill`), bảng Mock Test hồ sơ HV + Hành trình (`shared/domain/hanhTrinh.ts`
nhãn lượt), `server/src/cham/canCham.ts` (dòng nhắc), `server/src/worklist/mywork.ts` (việc xám).
- [ ] Máy chủ trả `lichSu: boolean` ở mọi đối tượng lượt đã có (`ATTEMPT_SELECT`, lưới Kế hoạch Test, `attemptDetail`, hồ sơ HV, hành trình).
  Web: chip nhỏ `lịch sử` ngay sau "MT2" ở Kế hoạch Test, hồ sơ Mock (đầu trang `MT2 · lịch sử · nhập bù, không có hạn`), bảng Mock Test
  hồ sơ HV, Hành trình. Hồ sơ Mock lượt lịch sử: **không** `DeadlinePill`, không "Xử lý vắng", không "Dời hạn chấm"; nút chính "Nhập điểm"
  cho GVCN → `/nhap-diem/{classId}?periodId={tuần}`.
- [ ] **Dòng nhắc (K2-32):** Lịch Test cuối trang, chỉ GVCN của lớp / QL: một dòng mờ `MT lịch sử chưa nhập · 3 em · MB FT 101 → Nhập`
  (không số đỏ, không vào dải số, không vào Nợ). Việc của tôi: dòng xám "Nhập MT lịch sử · 3 em · không tính hạn" nhóm `missing_data`
  (không hạn, không quá hạn). Một hàm máy chủ `mtLichSuChuaNhap(p, { classIds? })` dùng chung hai chỗ.
- [ ] `/impeccable clarify` cho: chữ chip, dòng nhắc, câu hộp Huỷ lượt (Task 7), câu thông báo tự dời (Task 8), câu lỗi đánh số — ghi
  trước/sau vào Nhật ký.
- [ ] **Phép kiểm** khối 9 (quét mã): `KhoiNo.tsx` không hiện `Han` cho dòng `lichSu`; `MockDetailPage.tsx` không vẽ `DeadlinePill` khi
  `lichSu`; không chuỗi `lich_su` lọt trong JSX.
- [ ] `npm run check` → commit `PR-MT (9): nhãn MT lịch sử, dòng nhắc nhập, hồ sơ Mock không hạn cho lượt lịch sử`.

## Task 10 · Dữ liệu demo D1–D6, D16 + thẻ tài khoản demo (§10.3, K5 §6, K1-55)

**Files:** `server/src/seed/students.ts`, `server/src/seed/journeys.ts` (lớp `MB FT RF 12` :286 đã có, chưa có HV), `server/src/seed/build.ts:330-372`
(khối vắng: thêm `lich_su` và `requested_on`/`decide_by` theo luật mới), `server/src/seed/sosV3Seed.ts:58, 84` (nhảy số → tạo lượt thiếu),
`web/src/modules/**/WelcomePage.tsx:343-344`.
- [ ] D1 lớp RF: 1 em mới (MT1 tuần 4, MT2 tuần 8, kỳ vọng = target) + 1 em MT1 SOS 2 (PA quy chế hàng MT3, Phối hợp hàng MT4) ·
  D2/D3 em "Lê Minh Khang" thêm hôm nay (`DEMO_DATE`), bắt đầu 22 tuần trước: MT1–MT3 `lich_su=1`, MT2 có điểm SOS 2 (không Case), MT3 chưa
  nhập (GVCN Hà nhập thử) · D4 một em FT **không** lượt nào (để `chay-thu:mt` có dòng) · D5 ba em dấu "-": chờ QL duyệt dời lần 2, đã được
  duyệt, đề nghị hết hạn tự huỷ · D6 một em có MT2 huỷ cả lượt rồi tạo lại (cùng số) · D16 một em chuyển `MB FT 101` → `MB FT RF 12`.
- [ ] Thẻ tài khoản demo (WelcomePage) thêm một dòng "xem được: MT lịch sử, lớp RF, dời lần 2" cho QL Vy và GVCN Hà.
- [ ] `npm run seed` trong worktree → `npm run chay-thu:mt` có D4 → `npm run check` → commit `PR-MT (10): demo lớp RF, HS cũ MT lịch sử, dời lần 2, huỷ lượt`.

## Task 11 · Tài liệu

- [ ] `CODE_MAP.md`: dòng `lichMt.ts`, `mtMacDinh.ts`, `huyLuot`, migrate PR-MT, `chay-thu:mt`, `bo-sung-mt-mac-dinh`. `TRIEN_KHAI.md` §11.1
  Bước 2b thêm khối "Đợt 2 · PR-MT" (sau khối Đợt 1 :517-533): `chay-thu:mt` → duyệt → migrate → `bo-sung-mt-mac-dinh` (thử) → duyệt →
  `--that`. `thiet-ke/PISA-Rulebook-2026-09-19.md`: kỳ vọng RF; "nhập danh sách không lập lịch MT" → M1. `thiet-ke/HOP_DONG_SO_LIEU.md`:
  luật `lich_su` loại khỏi nợ/độ phủ, "mới nhất" theo `attempt_no`. `thiet-ke/TU_DIEN_VA_CHU.md`: "MT lịch sử", "Huỷ cả lượt / Huỷ phần
  còn lại". `DEMO.md`: D1–D6, D16. Chỉ sửa tài liệu — không chạy lại `npm run check`. Commit `PR-MT (11): tài liệu`.

## Task 12 · impeccable `audit` + `polish`, bấm thử (một lần), mở PR

- [ ] Rebase `origin/main` (DUYET/MON đã merge thì theo bảng ranh giới) → `npm run check`.
- [ ] `/impeccable audit` trên: Lịch Test (tuần cũ có dòng nhắc), hồ sơ Mock lượt lịch sử, hộp Huỷ lượt, Kế hoạch Test lớp RF → sửa mục
  a11y/tương phản/trạng thái trong phạm vi PR → `/impeccable polish` một lượt. `/ponytail-review` trên diff; liệt kê chú thích `ponytail:`.
- [ ] Bấm thử **KIỂM** (API 4167 + Vite 5367, Playwright kênh Chrome), ảnh trước (main) / sau → `thiet-ke/anh/pr-mt/`.
- [ ] `npm run chay-thu:mt` + `npm run bo-sung-mt-mac-dinh` (chạy thử) trên DB demo → dán vào thân PR (mẫu cho chủ sản phẩm đọc).
- [ ] push → `gh pr create` tiêu đề `PR-MT: lịch MT tự tạo, MT lịch sử, đánh số liền mạch, RF, dời do vắng`; thân: bảng mã YC/T/K → ảnh →
  đạt/không, "tầng 1 của màn này là: …" (Lịch Test → dải số không đổi khi thêm HS cũ; hồ sơ Mock lịch sử → 4 ô điểm), **Chuyển cho PR khác**,
  **Lệnh cho buổi deploy**, cảnh báo **CÓ migrate + lệnh sửa dữ liệu cũ**, chú thích `ponytail:`. **Không tự merge.** Tắt cổng, quét
  `tests/run.js` treo, dọn file tạm.

## KIỂM — kịch bản bấm thử (Task 12)

| # | Vai (id) | Làm | Phải thấy |
|---|---|---|---|
| K1 | QL Vy (2) | Hồ sơ lớp `MB FT 101` → Thêm HV một em, tuần bắt đầu = tuần này | Hồ sơ em: MT1/MT2/MT3 ở W… (tuần học 6/12/16), không chip `lịch sử` |
| K2 | QL Vy | Thêm HV em tuần bắt đầu 22 tuần trước (H1) | MT1–MT3 chip `lịch sử`; Lịch Test **dải số và Nợ không đổi**; Việc của tôi không thêm "Nhập điểm" |
| K3 | GVCN Hà (7) | Lịch Test → dòng mờ "MT lịch sử chưa nhập" → Nhập → lưới tuần đó | Ô cả 4 kỹ năng mở; nhập MT2 SOS 2 (H2) → không Case; MT3 (2 tuần trước) có SOS (H3) → Case + PA quy chế |
| K4 | GVCN Hà | Gõ "-" ở ô lượt lịch sử | Câu "MT lịch sử không nhận dấu "-" …" |
| K5 | QL Vy | Lớp `MB FT RF 12`: em D1 | MT1 W(4), MT2 W(8); kỳ vọng = target ở hồ sơ Mock, bảng Case, Phân tích lớp |
| K6 | QL Vy | Kế hoạch Test lớp FT: em có MT1 | Chỉ ô MT2 có "+ xếp"; ô MT3+ trống |
| K7 | QL Vy | Hồ sơ Mock MT3 (lớn nhất, chưa điểm) → Huỷ cả lượt → Kế hoạch Test "+ xếp" MT3 | Tạo lại MT3 (không phải MT4); hộp huỷ nói "Số MT3 sẽ dùng lại được" |
| K8 | QL Vy | Hồ sơ Mock MT2 khi đã có MT3 | Chỉ có "Huỷ phần còn lại"; hộp nói "MT2 giữ số" |
| K9 | QL Vy | Lịch Test tuần cũ của em D5 | `dời từ W3 SEP · vắng lần 1`; em chờ duyệt: `vắng · chờ QL duyệt dời` |
| K10 | GVBM Trang (9) | Chuông | "Đã tự dời Speaking sang W… (vắng lần 1)" |
| K11 | QL Vy | Kế hoạch Test → đổi tuần một kỹ năng đang vắng | Lần sau em vắng → thành đề nghị chờ QL (lần 2) |
| K12 | Quản trị (1) | Quản trị › Lộ trình & chương trình | RF "Mọi MT = target · Tuần 4 · 8" (từ `lichMt.ts`) |
| K13 | 375 px | K2, K3, K7, K9 | Chip `lịch sử` không xuống dòng tách "MT2"; dòng nhắc một dòng; hộp huỷ vừa màn |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Lý do |
|---|---|---|
| Thẻ **Lịch thi** "Dời lịch MT lần 2" trong hộp Chờ duyệt, "Yêu cầu của tôi" cho GVCN, chuyển nhóm "Duyệt dời lịch do vắng" khỏi Việc của tôi — dùng giao kèo Task 8 | **PR-DUYET** | T41, T42 phần thẻ, K4-04 phần thẻ |
| Cột **"Đã thi tới MT"** (0–8) ở panel Thêm HV FT → truyền `daThiToiMt`; câu xác nhận "MT2, MT3 sẽ dời sang …" khi sửa tuần bắt đầu ở Thông tin HV; giữ lời gọi `taoMtMacDinh` trong `commitIntake` khi viết lại; khối kết quả sau Thêm HV "n MT lịch sử chưa có điểm" | **PR-NHAP** | K2-33 (1)(2), K2-21, K2-32 |
| "Sắp tới" cột M3 dùng hàm mốc kế tiếp của Task 5 | PR-HVL | K2-31 |
| Lưới Kế hoạch Test đầy đủ (cột tới MT8, chip dở/lịch sử/huỷ/chờ duyệt), Xếp lịch MT chọn tuần đã qua cho MT lịch sử, 6 tên thao tác T38 dùng `huyLuot` | PR-XLMT | K4-17, K4-18, K2-33 (1) phần xếp |
| Nhập MT lịch sử tại chỗ ở hồ sơ Mock; M10 trạng thái huỷ/lịch sử/vắng-dời/RF | PR-HSM | K4-30 |
| PA quy chế "đến MT(n+1) · chưa có lịch" + việc QL xếp lịch; chữ thông báo SOS theo S4-2 | PR-SOS | K3-14, K5-15 phần chữ |
| Bỏ dòng "2 lần Test liền chưa có Case" | PR-UXF | K1-04 |
| Cột "Trạng thái lượt" (lịch sử / đã huỷ) trong xuất Excel | PR-XUAT | T40 |

## Lệnh cho buổi deploy (đợt 2 — 🛑 chỉ chủ sản phẩm chạy, theo `TRIEN_KHAI.md`)

1. Sao lưu bản chính. 2. Biến Turso **bản chính**, chỉ đọc: `npm run chay-thu:mt` → gửi planning. 3. Migrate **DB THỬ** → nháp → bấm K1, K2, K7 →
migrate **DB CHÍNH** → `--prod`. 4. `npm run bo-sung-mt-mac-dinh` (chạy thử, **ngày chạy = mốc lịch sử**) → anh/chị duyệt danh sách (em nào,
MT nào, lịch sử hay lượt thường) → cùng ngày chạy `npm run bo-sung-mt-mac-dinh -- --that` (`PISA_CHO_PHEP_MIGRATE_TURSO=<tên máy chủ>`). Chạy
khác ngày với bản thử thì chạy thử lại. 5. Chạy thử lần nữa: danh sách phải rỗng. 6. Báo GVCN: HS cũ có MT lịch sử — nhập bù, không có hạn.

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | RF MT3+ (khi QL tự xếp) tuần học 8 + 4(n−2); LT MT4+ theo `MOCK_FT_STUDY_WEEK` (20, 24) — chỉ dùng cho `daThiToiMt` và gợi ý tuần | Đặc tả không nói; T33 "không tự tạo MT4+" giữ |
| Q2 | `lich_su` tính theo tuần kết thúc **muộn nhất** của 4 kỹ năng (lượt tự tạo cùng tuần nên như nhau) | T34 "tuần thi kết thúc trước ngày tạo" |
| Q3 | **Không dựng lại bảng** để bỏ `UNIQUE (cycle_id, attempt_no)` (K4-09 gợi ý): dùng lại số = **hồi sinh** dòng lượt huỷ không điểm (cùng id, lịch sử giữ) | Dựng lại bảng có ~6 bảng khoá ngoại trỏ tới, rủi ro trên Turso; hồi sinh cho đúng kết quả Q-B |
| Q4 | Lệnh bổ sung chỉ cho em **không có lượt nào**; em đã có 1–2 lượt tay → không bổ sung, chỉ đếm trong chạy thử | M6 "chưa có lượt"; không đoán lịch cạnh lượt người đã xếp |
| Q5 | `createCycle` (mở lộ trình tay) nay điền tuần bắt đầu = thứ Hai của ngày bắt đầu | Không có thì M1 "mở lộ trình mới" không chạy được |
| Q6 | Sửa tuần bắt đầu → hệ thống dời lượt `auto` chưa điểm **dù người sửa là GVCN** (không cần quyền xếp tuần) | K2-33 là luật; hiện đang nuốt lỗi im lặng |
| Q7 | Lượt lịch sử trong cửa sổ 4 tuần: Case nhận ngày phát hiện = **hôm nay** | Không thì hạn xác nhận 3 ngày quá hạn ngay lúc nhập |
| Q8 | GVCN (đường `lich_su`) chỉ nhập **ô trống**; sửa ô đã có điểm đi đường cũ (GVBM đúng môn / QL + lý do) | Giữ C02 và RB-5; K5-21 |
| Q9 | Lần 1 tự dời chạy ngay trong `settleNoShows` (cron T2 00:05 và khi mở màn) — cùng giao dịch với chốt | Q-A: "không ai quên" |
| Q10 | QL đổi tuần kỹ năng đang vắng tính +1 lần vắng nhưng **không** thành đề nghị (QL là người duyệt) | K4-12 |
| Q11 | Lưới Kế hoạch Test chỉ đổi đúng một điều kiện ("+ xếp" chỉ ở MT kế tiếp); cột giữ | Chặn đúng ở giao diện ngay đợt này, lưới đầy đủ là PR-XLMT |
| Q12 | "Huỷ phần còn lại" huỷ kỹ năng chưa có điểm **và** chưa `sat` | Kỹ năng đã thi chờ chấm vẫn còn nghĩa vụ chấm |
| Q13 | Case đóng vì huỷ lượt chỉ khi **mọi** mốc của Case đến từ lượt đó và chưa PA nào có kết quả | T67 "sinh từ lượt đó"; không xoá việc đã diễn ra |

## Mâu thuẫn nguồn ↔ mã thật

1. Đặc tả YC-13.3 nói kiểm `createAttempt` và `POST /ke-hoach-test/dot`; thật: `/dot` chỉ sửa lượt có sẵn (`attemptId`), đường tạo là
   `/xep-moi`, `/hang-loat`, **và** `POST /attempts` + `/attempts/bulk-plan` — mọi đường đều qua `createAttempt` (một chốt đủ).
2. `nextAttemptNo` (cycles.ts:37) đếm **cả** lượt huỷ, `xepMoi` (:411) **bỏ** lượt huỷ → hôm nay huỷ MT lớn nhất rồi "+ xếp" báo "đã có MTn".
3. Lịch MT mặc định **đã có mã** (`applySuggestedMockWeeks`, schedule.ts:97) nhưng chỉ chạy khi đổi tuần bắt đầu hoặc bấm "Áp lịch";
   không theo lộ trình (RF ra 6/12/16); `createCycle` không ghi tuần bắt đầu → không lập được.
4. `setSkillWeek` hiện **cố ý** không đếm vắng (chú thích :632-639) — trái K4-12; kế hoạch đổi theo báo cáo rà (§2 mục 4).
5. Chuyển LT ↔ RF (PR-LOP đã làm `dong-mo`) **không** chuyển Case theo em → Case lộ trình cũ và Case mới cùng kỹ năng sống song song (K5-60).
6. K4-09 "khoá cơ sở dữ liệu" đúng; cách gỡ đổi (Q3).
7. Hàng "Thiếu thông tin → Mốc đánh giá tiếp theo" đếm mọi lượt `planned` (hocVienLop.ts:107) — sau M1 luôn bật/tắt sai (K2-05); còn 7 chỗ
   khác coi `status='planned'` là "sắp tới" (profile.ts:613, students.ts:70, keHoachTest.ts:73,101, transition.ts:84, planning.ts:154,
   luatLoTrinh.ts:256) — Task 5 chỉ sửa chỗ đếm nợ/mốc; các chỗ còn lại ghi Nhật ký nếu thấy sai khi bấm thử.

## Câu cần chủ sản phẩm quyết

1. **Em FT trên bản chính đã có 1–2 lượt MT do QL xếp tay** (từ 23/09): lệnh `bo-sung-mt-mac-dinh` có bổ sung các MT **còn thiếu** (ví dụ
   có MT1 → thêm MT2, MT3 theo lịch mặc định) không? (A) **Có** — chỉ số còn thiếu, lượt bị chặn thứ tự đợt thì bỏ và in ra *(khuyến nghị:
   không để em nào thiếu MT2/MT3 mà không ai biết)* · (B) Không — đúng chữ M6 "chưa có lượt", QL tự xếp. Kế hoạch đang theo **(B)** (Q4)
   tới khi anh/chị chọn; đổi sang (A) chỉ là đổi điều kiện chọn em trong `keHoachBoSung`.

## Nhật ký

- **Task 0 (29/09, Opus 5.5):** nhánh `pr-mt-lich-mt` từ `origin/main` @ fb51181. PR-DUYET / PR-NHAP / PR-MON **chưa** merge. Mốc B =
  **1444** phép kiểm + 20 tốc độ. Dòng mã kế hoạch dẫn khớp (lệch ≤ 20 dòng), trừ `requestAbsenceMove` ở absence.ts:176 (kế hoạch :143 —
  thân vòng lặp vẫn :196-290), `scoreEditPath` permissions.ts:509, `updateCycle` cycles.ts:126 (kế hoạch :200 — phần đổi tuần bắt đầu nằm
  trong hàm này).
- **Task 2:** theo Planning chốt 29/09, `chayThuMt.ts` **không** in danh sách bổ sung (bỏ `keHoachBoSung`); thay mục (2) bằng "em FT đang
  học chưa có lượt MT nào" (sau reset + PR-MT danh sách này phải rỗng — dùng để soát). `CO_DIEM_SQL` (lượt có điểm = band hoặc điểm thô)
  đặt cạnh `LUOT_TINH_NO_SQL` ở `lichMt.ts`. `chay-thu:mt` trên DB demo worktree: (1) đã có cột · (2) 0 em · (3) 1 em thiếu tuần bắt đầu
  (PISA-000032 HD FT 302) · (4) 3 lộ trình nhảy số — PISA-000040 `MT1, MT2, MT5`, PISA-000042 `MT2`, PISA-000044 `MT3` (seed sosV3, sửa ở
  Task 10) · (5) 0 lượt huỷ ở giữa.

## Planning chốt 29/09

- Chủ sản phẩm sẽ **reset database trước khi deploy bản chính** (GV chưa dùng) → **BỎ lệnh `bo-sung-mt-mac-dinh` (T35) và phần chạy thử danh sách bổ sung** (không có dữ liệu thật để bổ sung). Câu hỏi "bổ sung MT còn thiếu cho em đã có 1–2 lượt" không còn cần. Migrate cột `lich_su` + `chay-thu:mt` (đếm nhanh) vẫn giữ cho DB THỬ/demo.
- **LÀM RÕ (chủ sản phẩm 29/09):** chỉ bỏ lệnh sửa dữ liệu cũ `bo-sung-mt-mac-dinh`. **GIỮ NGUYÊN** việc tự tạo MT mặc định khi thêm học viên mới (`taoMtMacDinh` gọi trong `commitIntake`, Task 3) — kể cả học viên đã học lâu: MT có tuần thi đã qua là **MT lịch sử**, GVCN/QL nhập đủ 4 kỹ năng (kịch bản H1 §10.4). Sau khi reset database, mọi học viên đều vào qua đường này.
