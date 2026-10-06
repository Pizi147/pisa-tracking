# PR-BV · Bỏ vắng + xoá điểm hàng loạt có khôi phục — Kế hoạch (06/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **CHẠY SAU PR-MTa** (cùng `attempts.ts`, `regular.ts`, `absence.ts`, `skillSchedule.ts`). MTa đã merge (#212, `ec6d7afe`) — nhưng
> **Task 0 bắt buộc**: đối chiếu lại mã trên `origin/main` lúc bắt đầu (MTb / MT0 / LT3 có thể đã merge thêm). Mockup
> `thiet-ke/mockup-bo-vang-xoa-diem-2026-10-06.html` phải **được chủ sản phẩm duyệt trước khi code**.

**Goal:** (1) "Bỏ vắng": bài Mock đã chốt vắng (kể cả "-" gõ nhầm cho tuần đã qua, kể cả vắng lần 2) trả **lịch cũ + số lần vắng**, rồi
nhập điểm được; lớp thường gỡ "-" trả đúng số lần vắng. (2) **Xoá điểm hàng loạt** (nhiều em × nhiều kỹ năng của một lượt / một bài,
gồm cả cột một lớp và cả đợt một em) là **xoá mềm**, có màn xem trước số điểm + Case bị ảnh hưởng, **khôi phục được**; mọi lần xoá
trắng từng ô cũng khôi phục được. (3) Sửa lỗi bài lớp thường xoá điểm xong vẫn `done`.

**Architecture:** Không viết luật mới song song với luật cũ — mọi đường xoá điểm vẫn đi qua `saveScore` / `saveRegularScore`; hai hàm
này **chụp nguyên dòng** vào bảng mới `diem_da_xoa` trước khi xoá trắng ô (một chỗ, mọi nơi gọi tự hưởng: xoá trắng ô T22, Huỷ điểm,
Thi lại, xoá hàng loạt). Xoá hàng loạt = gọi `saveScore`/`saveRegularScore` từng ô trong **một `tx`**; xem trước = chạy đúng việc đó
trong `tx` rồi **cuộn lại** (đếm Case bằng chênh lệch trước/sau — không viết lại luật Case). Khôi phục = chép ngược vào ô **còn trống**.
Bỏ vắng FT = hàm mới `boVang` ở `absence.ts` đảo đúng một lần chốt (đọc tuần gốc ở `assessment_scores.no_show_period_id`); Hoàn tác
"-" đã chốt đi qua chính hàm này (sửa gốc lỗi "hoàn tác nửa vời").

**Tech Stack:** TypeScript (`tsc`, import có đuôi `.ts`), Express + SQLite/Turso, React; phép kiểm `server/src/tests/prBv.tests.ts`
gọi ở **cuối** `run.ts`; `npm run check`.

**Spec / nguồn:** `plan.md` mục 4 "PR-BV", mục 2c (T7, T19–T23) · `docs/superpowers/specs/2026-10-06-ra-soat-duong-lui.md` phần A
(A2, A3 #2–#11, C #1, #3, #4, #5) · kế hoạch MTa `docs/superpowers/plans/2026-10-05-pr-mta-luat-mock-test.md` Task 12–13 (**không làm
lại**: T19 khung nhập, T20 dời có điểm, T21 khôi phục phần huỷ vào tuần đã qua, T22 xoá trắng ô không bắt lý do, T23 "-" MT cũ) ·
mockup `thiet-ke/mockup-bo-vang-xoa-diem-2026-10-06.html`.

## Global Constraints
- **Chỉ QL / Quản trị** (`PLAN_WEEK` theo lớp) mọi lúc: Bỏ vắng, xoá hàng loạt, xem "Đã xoá", khôi phục. **GV chấm bài đó**
  (`scoreEditPath(...) === 'assigned'`) Bỏ vắng được **trong khung chấm**: từ tuần thi tới hết `skillScoreDeadline` của **tuần thi gốc**
  (thứ Tư tuần sau). Không nới quyền nào khác.
- **Không mất điểm:** dòng điểm vào `diem_da_xoa` **trước** khi ô bị xoá trắng, cùng `tx`. Khôi phục **không bao giờ đè** ô đã có điểm mới.
- Lý do: Bỏ vắng **tuỳ chọn**; khôi phục **tuỳ chọn**; xoá hàng loạt **bắt buộc** (khác rỗng sau `trim()`, không tối thiểu ký tự — T7)
  — trừ khi chủ sản phẩm chọn khác ở Q1. Nhật ký đủ: ai / lúc nào / cũ → mới.
- Chữ trên màn **đúng mockup**, ngắn (1–3 từ), không câu giải thích dưới nút/ô; thời gian là mã tuần `W2 OCT`, ngày giờ chỉ ở nhật ký và
  danh sách "Đã xoá" (là nhật ký). Không đổi phông, bảng màu, bố cục đã khoá.
- Turso: không tham số đặt tên; ≤ 900 tham số (`theoLo`); đường ghi mới có trần ở `server/src/tests/tocDoDuong.ts` `TRAN_GHI_LO`.
- Trần xoá hàng loạt: **≤ 300 ô / lần** (một lớp 30 em × 5 ô = 150); vượt → 400 `Quá 300 ô — chọn ít em hơn.`
- Migrate riêng `server/src/migrate/prBv.ts`, chạy lặp được, chỉ cấu trúc; định nghĩa cùng cuối `schema.sql`.
- Hàm mới ở `shared/domain/*` re-export qua `shared/domain/index.ts` (file đã `export *` thì thôi). File mới → `CODE_MAP.md` cùng commit.
- Phép kiểm cũ chỉ sửa khi khẳng định đúng luật bị thay; ghi `// PR-BV thay <mã cũ>`.
- Ponytail: `full` cho Task 0–6; `/ponytail lite` trước Task 7–8 (web).

## Review Focus
1. **Khôi phục đè điểm mới:** xoá L của em A → GV nhập L mới → khôi phục lô → L giữ điểm mới, kết quả báo "1 ô đã có điểm mới". (K3)
2. **Xem trước không ghi gì:** gọi `xemTruoc: true` hai lần liền → `assessment_scores`, `diem_da_xoa`, `sos_cases`, `notifications`,
   `audit_logs` không đổi số dòng. (H2)
3. **Bỏ vắng lần 1 tự dời:** "-" gõ cho tuần đã qua → chốt + tự dời W+1, bộ đếm 1 → Bỏ vắng → tuần gốc, bộ đếm 0, ô hết "-",
   nhập điểm được ngay; làm "-" lần nữa vẫn là **vắng lần 1** (không thành lần 2 oan). (V1, V2)
4. **Hoàn tác "-" đã chốt** (toast Hoàn tác) giờ trả cả lịch và bộ đếm; GV ngoài khung chấm bấm Hoàn tác → 403 câu ngắn, không đổi gì. (V7)
5. **W1/W2:** xoá hàng loạt kỹ năng W → cả W1 và W2 vào `diem_da_xoa`, đếm "1 điểm" (theo kỹ năng); khôi phục trả cả hai + nhận xét +
   GV chấm + `nhap_dau_ngay`. (X3, K2)

---

## Interfaces (giữ đúng tên — PR-LUI dựa vào)

```ts
// shared/domain/thaoTacMt.ts
export type ThaoTac = /* cũ */ | 'bo-vang';                 // CHU_THAO_TAC['bo-vang'] = 'Bỏ vắng'
export type QuyenTT = { /* cũ */; boVang?: boolean };        // máy chủ đã tính quyền + trạng thái (BoVangXem != null)
//   thaoTacKyNang: q.boVang → thêm 'bo-vang' vào ĐẦU `menu` ở trạng thái 'vang' | 'huy-vang' | 'chua-toi-tuan' | 'dang-thi'
//   (≤ 3 mục menu vẫn giữ: 'dang-thi' của QL = ['bo-vang','bao-vang','doi-han'] — 'doi-lich' vẫn ở hộp kỹ năng)

// shared/domain/diemDaXoa.ts (MỚI)
/** Thông tin cho hộp Bỏ vắng — máy chủ gửi kèm mỗi kỹ năng khi người xem bỏ vắng được, còn lại null. */
export type BoVangXem = { tuanGoc: string; tuanNay: string | null; lanVang: number; lanVangSau: number; rutDeNghi: boolean };
//   tuanGoc/tuanNay = mã tuần 'W2 SEP'; tuanNay = null khi lịch chưa đổi (đang 'vang' / 'huy-vang' ở tuần gốc)
export type XoaHangLoat = { ma: string; hocVien: number[]; kyNang: string[]; lyDo: string | null; xemTruoc: boolean };
export type KetQuaXoa = { soDiem: number; soEm: number; dongCase: number; xemLaiCase: number; lo: string | null };
//   soDiem đếm theo KỸ NĂNG (W1+W2 = 1); lo = null khi xemTruoc
export type LanXoa = { lo: string; luc: string; nguoi: string; lyDo: string | null; nguon: NguonXoa; nhanLuot: string;
  o: { id: number; hocVien: string; skill: string; giaTri: string; khoiPhuc: boolean }[] };
export type NguonXoa = 'o' | 'huy-diem' | 'thi-lai' | 'hang-loat';
export const CHU_NGUON_XOA: Record<NguonXoa, string>;     // 'Xoá ô' · 'Huỷ điểm' · 'Thi lại' · 'Xoá hàng loạt'
export function dongXemTruoc(k: KetQuaXoa): string;        // 'Xoá 9 điểm · 3 em · đóng 1 Case · 1 Case xem lại' (bỏ vế = 0)

// server/src/fasttrack/diemDaXoa.ts (MỚI)
export function chupDiem(scoreRowId: number, o: { lo: string; nguon: NguonXoa; lyDo: string | null; actorId: number }): void;  // gọi TRONG tx
export function loMoi(): string;                                                                    // crypto.randomUUID()
export function xoaDiemHangLoat(p: Principal, classId: number, x: XoaHangLoat): KetQuaXoa;
export function diemDaXoaCuaLop(p: Principal, classId: number): LanXoa[];                          // 60 lần gần nhất
export function khoiPhucDiem(p: Principal, o: { lo?: string; ids?: number[]; lyDo?: string | null }):
  { khoiPhuc: number; boQua: { id: number; vi: 'co-diem-moi' | 'luot-huy' | 'ky-nang-huy' | 'co-dau' }[] };

// server/src/fasttrack/absence.ts
export function boVangXem(p: Principal, attemptId: number, skill: string, today?: string): BoVangXem | null;   // đọc, không ném
export function boVang(p: Principal, attemptId: number, skill: string, o?: { lyDo?: string | null; today?: string }): { ok: true; tuan: string; lanVang: number };
```
Đường mới: `POST /attempts/:id/skills/:skill/bo-vang` · `POST /classes/:classId/diem-theo-luot/:luot/xoa-diem` (body `XoaHangLoat`
trừ `ma`) · `GET /classes/:classId/diem-da-xoa` · `POST /diem-da-xoa/khoi-phuc` (body `{ lo?, ids?, lyDo? }`).
Trường mới ở dữ liệu đọc: mỗi kỹ năng của `attemptDetail`, `HopKyNang` (Kế hoạch Test), `bangTheoLuot` (Điểm theo lớp) và
`regularSheet` thêm `boVang: BoVangXem | null`; `bangTheoLuot` thêm `soLanXoa: number` (chỉ khác 0 với QL/QT).

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `superpowers:subagent-driven-development`; ponytail `full` |
| Mỗi task | `superpowers:test-driven-development` (đỏ trên DB test trước) · `superpowers:verification-before-completion` (`npm run check`, một lần một lúc, foreground) |
| Lỗi lạ | `superpowers:systematic-debugging` |
| Task 7–8 (web) | `/ponytail lite` · `/impeccable clarify` (chữ hộp, toast) · `/impeccable harden` (lỗi giữa chừng, 0 ô, quá trần) · `/impeccable adapt` (375) |
| Trước mở PR | `/impeccable audit` (DiemTheoLop, HopThaoTacMt, ngăn Đã xoá) · `/ponytail-review` · `superpowers:requesting-code-review` · `superpowers:finishing-a-development-branch` (mở PR vào `main`, **không merge**) |

---

### Task 0: Đối chiếu mã sau MTa (không sửa mã)
Số dòng dưới đây đo trên `ec6d7afe`; mã đã đổi thì tìm lại theo tên hàm và **ghi số dòng mới vào mô tả PR**.
- [ ] `git fetch origin && git log --oneline origin/main -15`: MTb, MT0, LT3, PR-LUI đã merge chưa? Có thì đọc diff của chúng ở các file
  trong "File chồng" (cuối kế hoạch).
- [ ] Xác nhận (grep), ghi kết quả vào mô tả PR:
  1. `saveScore` (`server/src/fasttrack/attempts.ts:1447`) nhánh xoá trắng — UPDATE về NULL, `matHet` NULL hoá nhận xét / GV chấm /
     `nhap_dau_ngay` (`:1677-1702`); audit `score.edit|lich_su|override` (`:1731-1743`).
  2. `saveRegularScore` (`server/src/normal/regular.ts:464-570`) xoá = `score:null,total:null` (`:540-544`); `refreshRegularOutcome`
     chỉ `planned → done` (`:752-756`).
  3. `huyDiem` (`server/src/keHoach/keHoachTest.ts:579-590`) và `thiLai` (`:544-573`) đều gọi `saveScore(..., null)`.
  4. "-" FT: `saveScore` nhánh noShow (`attempts.ts:1546-1612`) ghi `no_show_period_id` = tuần gốc; `settleNoShows` / `settleGroup`
     (`server/src/fasttrack/absence.ts:737-845`); `applyMove` (`:427-451`) tăng `absence_move_count`; `insertRequest` (`:393-424`);
     `huyVangNoi` (`:322-343`); `rutDeNghiDoi` (`:108-119`). **Dấu "-" của Writing nằm ở dòng `writing1` hay cả hai?** (ghi lại — Task 5 dùng).
  5. `setSitStatus` (`server/src/fasttrack/skillSchedule.ts:1005`) vẫn chưa có route.
  6. `MockDetailPage.tsx:436-438` và `HopKyNang.tsx:151` **không truyền `huyVang`** vào `trangThaiTT` (trạng thái "huỷ vắng 2 lần" rơi
     thành "đã huỷ"). MTb đã sửa chưa? Chưa → sửa ở Task 7 (một dòng mỗi file).
  7. `tx` (`server/src/db.ts:258`) cuộn lại khi `fn` ném — kể cả lồng (savepoint). Có đường nào trong `saveScore` / `refreshOutcome` /
     `closeCasesBySystem` gửi **ra ngoài** (email, push, fetch) ngoài DB? Có → Task 4 xem trước phải tắt đường đó (cờ), ghi vào báo cáo.
  8. Ai đặt `sit_status='absent'` cho lớp thường (nhãn "Đã vắng · chờ xếp lại", `LuoiThuong.tsx:89`)? Nếu chỉ seed/phép kiểm → bỏ qua.
- [ ] Lệch lớn so với kế hoạch (ví dụ MTb đã thêm khôi phục điểm) → **dừng, báo planning**, không tự chế.

### Task 1: Lỗi lớp thường "đã xong" sau khi xoá điểm
**Files:** Modify `server/src/normal/regular.ts:752-756` · Test `server/src/tests/prBv.tests.ts` (tạo), `server/src/tests/run.ts` (gọi cuối)

- [ ] **Bước 1 — kiểm đỏ:**
```ts
check('BV R1 · lớp thường: xoá một môn của bài đã đủ → status về planned', () => {
  const { attemptId, mon } = baiThuongDu();            // helper: bài Giữa khoá đủ 4 môn, status 'done'
  regular.saveRegularScore(QL, attemptId, mon[0], { score: null, total: null });
  assert(luot(attemptId).status === 'planned', `status = ${luot(attemptId).status}`);
});
check('BV R2 · lớp thường: nhập lại đủ → done; bài đã huỷ không bị đổi', () => { /* … */ });
```
- [ ] **Bước 2:** chạy `npm run check` → R1 đỏ (`done`).
- [ ] **Bước 3:** theo đúng mẫu FT (`attempts.ts:1406-1410`):
```ts
const next = r.complete ? 'done' : 'planned';
if (a.status !== 'cancelled' && a.status !== next) conn.prepare('UPDATE assessment_attempts SET status = ? WHERE id = ?').run(next, attemptId);
```
- [ ] **Bước 4:** `npm run check` xanh. Grep nơi đếm bài lớp thường theo `status` (`grep -rn "status = 'done'" server/src/normal server/src/phanTich server/src/cham`) — ghi vào mô tả PR số nào có thể đổi.
- [ ] **Bước 5:** commit `fix(bv): bài lớp thường xoá điểm thì về chưa xong (regular.ts)`.

### Task 2: Bảng `diem_da_xoa` + chụp mọi lần xoá trắng ô
**Files:** Create `server/src/migrate/prBv.ts`, `server/src/fasttrack/diemDaXoa.ts`, `shared/domain/diemDaXoa.ts` · Modify `server/src/schema.sql` (cuối), `server/src/migrate.ts` (gọi), `attempts.ts` (nhánh xoá trắng), `regular.ts` (nhánh xoá), `keHoachTest.ts` (`huyDiem`, `thiLai` truyền `nguon`), `shared/domain/index.ts`, `CODE_MAP.md`

- [ ] **Bước 1 — migrate (chạy lặp được):**
```sql
CREATE TABLE IF NOT EXISTS diem_da_xoa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lo TEXT NOT NULL,                       -- một lần xoá (một ô hoặc cả lô)
  nguon TEXT NOT NULL,                    -- 'o' | 'huy-diem' | 'thi-lai' | 'hang-loat'
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
  skill TEXT NOT NULL,                    -- đúng cột skill của assessment_scores (writing1/writing2 riêng; lớp thường = mã môn)
  dong_json TEXT NOT NULL,                -- nguyên dòng assessment_scores lúc xoá (mọi cột)
  ly_do TEXT, xoa_boi INTEGER, xoa_luc TEXT NOT NULL,
  khoi_phuc_boi INTEGER, khoi_phuc_luc TEXT, ly_do_khoi_phuc TEXT
);
CREATE INDEX IF NOT EXISTS idx_diem_da_xoa_attempt ON diem_da_xoa(attempt_id);
CREATE INDEX IF NOT EXISTS idx_diem_da_xoa_lo ON diem_da_xoa(lo);
```
  Xoá học viên / tài khoản: thêm `diem_da_xoa` cạnh `ket_qua_huy` ở `students/xoaHocVien.ts:114`, `platform/xoaTaiKhoan.ts:56`.
- [ ] **Bước 2 — kiểm đỏ:**
  - X1 GVBM xoá trắng L (T22, không lý do) → một dòng `diem_da_xoa` `nguon='o'`, `dong_json.band` = điểm cũ, `ly_do` NULL.
  - X2 `huyDiem` W chọn W1+W2 → hai dòng **cùng `lo`**, `nguon='huy-diem'`.
  - X3 `thiLai` → `nguon='thi-lai'`; lớp thường xoá một môn → `nguon='o'`, `dong_json.raw_total` giữ.
  - X4 **sửa** điểm (6.0 → 6.5) → **không** có dòng (chỉ xoá trắng cả ô mới chụp).
  - X5 lỗi ném sau khi chụp (giả lỗi ở `refreshOutcome` bằng ô không hợp lệ cùng `tx`) → không còn dòng `diem_da_xoa` mồ côi.
  - X6 ô chỉ có "-" / chỉ nhận xét bị xoá nhận xét → không chụp (không phải điểm).
- [ ] **Bước 3:** `chupDiem` đọc `SELECT * FROM assessment_scores WHERE id = ?`, chèn `dong_json = JSON.stringify(row)`. Gọi ở **đúng một
  chỗ mỗi đường**: `saveScore` ngay trước UPDATE khi ô đang có điểm (`band` hoặc `raw_score` khác NULL) và giá trị mới rỗng; tương tự
  `saveRegularScore`. Tham số mới tuỳ chọn ở cuối `opts` của hai hàm: `{ lo?: string; nguon?: NguonXoa }` (mặc định `loMoi()`, `'o'`);
  `huyDiem` tạo một `lo` cho cả W1/W2; `thiLai` truyền `'thi-lai'`.
- [ ] **Bước 4:** `npm run check` xanh. **Bước 5:** commit `feat(bv): chụp điểm trước khi xoá trắng ô (diem_da_xoa)`.

### Task 3: Khôi phục điểm + danh sách "Đã xoá"
**Files:** Modify `server/src/fasttrack/diemDaXoa.ts`, `server/src/routes/index.ts`, `server/src/tests/tocDoDuong.ts` · Test `prBv.tests.ts`

- [ ] **Bước 1 — kiểm đỏ:**
  - K1 QL khôi phục lô của X1 → ô L có lại `band`, `raw_score`, `entered_by/at` cũ, `nhap_dau_ngay` cũ; `khoi_phuc_*` đặt; audit
    `score.khoi_phuc` (before null, after dòng); `refreshOutcome` chạy (lượt `planned → done` nếu đủ).
  - K2 W1+W2 + nhận xét + GV chấm Speaking → khôi phục trả đủ (nhận xét/GV chấm chỉ ghi khi ô hiện đang NULL).
  - K3 ô đã có điểm mới → bỏ qua ô đó, `boQua: [{vi:'co-diem-moi'}]`, ô khác của lô vẫn khôi phục.
  - K4 lượt đã huỷ / kỹ năng đã huỷ (`sit_status='cancelled'`) / ô đang có "-" → bỏ qua đúng `vi`.
  - K5 GVBM, GVCN gọi → 403; QL chi nhánh khác → 403. Khôi phục lần hai cùng lô → `khoiPhuc: 0` (idempotent, không lỗi).
  - K6 lớp thường: khôi phục môn → bài về `done` nếu đủ (dựa Task 1).
  - K7 `diemDaXoaCuaLop` chỉ trả lần xoá của lớp đó, mới nhất trước, ≤ 60 lần; GV → 403.
- [ ] **Bước 2:** `khoiPhucDiem`: `require_(PLAN_WEEK, {classId})` cho **từng lớp** có trong các dòng; một `tx`; với mỗi dòng chưa khôi
  phục: kiểm `vi` → `INSERT … ON CONFLICT(attempt_id, skill) DO UPDATE` chỉ các cột điểm (`raw_score, raw_total, c1..c4, band,
  result_date, entered_by, entered_at, nhap_dau_ngay`) + `comment/examiner_*` khi hiện NULL; ghi `khoi_phuc_*`; audit; cuối cùng
  `refreshOutcome` / `refreshRegularOutcome` **mỗi lượt một lần**. Case đã đóng **không mở lại** (như MTa G9 — điểm còn trượt thì SOS
  mới tự sinh).
- [ ] **Bước 3:** route `GET /classes/:classId/diem-da-xoa`, `POST /diem-da-xoa/khoi-phuc`; trần `TRAN_GHI_LO.khoiPhucDiem` (đo bộ demo
  một lô 30 ô, công thức `max(đo+10, ⌈đo×1.3⌉)`, JSDoc như mục khác).
- [ ] **Bước 4:** `npm run check` xanh. **Bước 5:** commit `feat(bv): khôi phục điểm đã xoá + danh sách Đã xoá (chỉ Quản lý)`.

### Task 4: Xoá điểm hàng loạt (máy chủ) + xem trước
**Files:** Modify `server/src/fasttrack/diemDaXoa.ts`, `server/src/cham/diemTheoLuot.ts` (`bangTheoLuot` thêm `soLanXoa`), `routes/index.ts`, `tocDoDuong.ts` · Test `prBv.tests.ts`

- [ ] **Bước 1 — kiểm đỏ:**
  - H1 QL, lớp MB FT 101, `ma` MT2, 3 em × [L, W] có điểm → `soDiem 6` (W1+W2 tính 1), `soEm 3`, 6–9 dòng `diem_da_xoa` cùng `lo`,
    `nguon='hang-loat'`, ô trống; Case sinh riêng từ các điểm đó đóng (`dongCase` khớp số `sos_cases` đổi trạng thái).
  - H2 `xemTruoc: true` → cùng con số với H1 nhưng **không đổi dòng nào** ở `assessment_scores`, `diem_da_xoa`, `sos_cases`,
    `case_signals`, `notifications`, `audit_logs`, `assessment_attempts`.
  - H3 Case có căn cứ khác (`caseHasIndependentBasis`) → không đóng, đếm vào `xemLaiCase`.
  - H4 thiếu lý do → 400 `Cần ghi lý do.` (theo Q1); `kyNang` rỗng / `hocVien` rỗng → 400 `Chưa chọn em nào.` / `Chưa chọn kỹ năng.`
  - H5 em không thuộc lớp / không có lượt `ma` → bỏ qua (không lỗi, không đếm); ô trống → không đếm.
  - H6 > 300 ô → 400 `Quá 300 ô — chọn ít em hơn.`; GVBM / GVCN → 403; QL chi nhánh khác → 403.
  - H7 một ô ném lỗi giữa chừng (ví dụ lượt đã huỷ giữa lúc gửi) → **không ô nào bị xoá** (một `tx`), trả lỗi của ô đó kèm tên em.
  - H8 lớp thường, bài Giữa khoá, 2 em × 2 môn → như H1 (đếm theo môn).
- [ ] **Bước 2:** `xoaDiemHangLoat`:
```ts
export function xoaDiemHangLoat(p: Principal, classId: number, x: XoaHangLoat): KetQuaXoa {
  require_(p, PERMISSIONS.PLAN_WEEK, { classId });
  // kiểm nhập: hocVien/kyNang khác rỗng, lyDo (Q1), tìm các ô CÓ ĐIỂM của (lượt `ma` × hocVien × kyNang) bằng một câu theo lô
  const o = oCoDiem(classId, x);                 // [{attemptId, skill(cột thật), hocVien}] — W → writing1 + writing2
  if (o.length > 300) throw new HttpError(400, 'Quá 300 ô — chọn ít em hơn.');
  const lam = (): KetQuaXoa => {
    const truoc = demCase(o);                     // id Case đang mở nối tín hiệu của các lượt này
    const lo = loMoi();
    for (const c of o) ghiXoa(p, c, { lo, nguon: 'hang-loat', lyDo: x.lyDo });   // saveScore / saveRegularScore(null)
    const sau = demCase(o);
    return { soDiem: soKyNang(o), soEm: new Set(o.map((c) => c.hocVien)).size,
      dongCase: truoc.mo.filter((id) => !sau.mo.includes(id)).length, xemLaiCase: sau.xemLai(truoc), lo };
  };
  if (!x.xemTruoc) return tx(lam);
  // ponytail: xem trước = chạy thật rồi cuộn lại — một luật Case duy nhất; khoá ghi ngắn (≤ 300 ô). Đổi khi đo thấy chậm.
  let kq!: KetQuaXoa;
  try { tx(() => { kq = { ...lam(), lo: null }; throw CUON_LAI; }); } catch (e) { if (e !== CUON_LAI) throw e; }
  return kq;
}
```
  `xemLaiCase` = số thông báo
  "Xem lại Case" mới (`notifications` kind của `gomTinHieu`, `cases/signals.ts:351-364`) — đếm chênh lệch trong cùng `tx`.
- [ ] **Bước 3:** route `POST /classes/:classId/diem-theo-luot/:luot/xoa-diem` (gọi `maybeSimulateSaveFailure()` như route ghi khác);
  `bangTheoLuot` thêm `soLanXoa` (đếm `lo` chưa khôi phục hết của lớp, chỉ QL/QT, khác 0 mới hiện nút). Trần `TRAN_GHI_LO.xoaDiemHangLoat`
  và `xemTruocXoaDiem` (đo bộ demo cả lớp MB FT 101 × 4 kỹ năng).
- [ ] **Bước 4:** `npm run check` xanh. **Bước 5:** commit `feat(bv): xoá điểm hàng loạt có xem trước (chỉ Quản lý)`.

### Task 5: Bỏ vắng — Mock (máy chủ)
**Files:** Modify `server/src/fasttrack/absence.ts`, `attempts.ts` (`attemptDetail` kỹ năng + nhánh gỡ "-"), `keHoachTest.ts` (dữ liệu `HopKyNang`), `server/src/cham/diemTheoLuot.ts` + `canCham.ts` (ô lưới), `routes/index.ts` · Test `prBv.tests.ts`

Ba trạng thái do một lần chốt "-" sinh ra (dấu ở `assessment_scores`: `no_show_settled_at` khác NULL, `no_show_cu = 0`):

| Trạng thái | Nhận biết | Bỏ vắng làm gì |
|---|---|---|
| **tự dời** (vắng lần 1) | `sit_status='scheduled'`, `planned_period_id ≠ no_show_period_id` | về tuần gốc, `absence_move_count − 1` |
| **vắng** (lần 1 trễ / T15 chặn → đề nghị) | `sit_status='absent'` | về `scheduled` tuần gốc, rút đề nghị |
| **huỷ vắng 2 lần** (T3) | `sit_status='cancelled'`, `huy_vang=1` | về `scheduled` tuần gốc, `huy_vang=0`, rút thẻ Xin dời đang chờ; bộ đếm giữ (lần 2 không cộng) |

- [ ] **Bước 1 — kiểm đỏ:**
  - V1 QL gõ "-" L MT2 tuần trước (chốt ngay, tự dời W+1, đếm 1) → `boVang` → tuần gốc, đếm 0, ô hết "-", `sit_status='scheduled'`;
    `saveScore` L 6.5 ngay sau → 200.
  - V2 sau V1, "-" lại L tuần gốc → vẫn **vắng lần 1** (tự dời, đếm 1), không thành huỷ vắng 2 lần.
  - V3 trạng thái **vắng** có `skill_move_requests` pending + thẻ `yeu_cau_duyet` → `boVang` → đề nghị `withdrawn`, thẻ chốt `tu_dong`.
  - V4 **huỷ vắng 2 lần** + thẻ Xin dời chờ → `boVang` → `scheduled` tuần gốc, `huy_vang=0`, thẻ rút, đếm giữ 1.
  - V5 GVBM được phân công L, hôm nay ≤ thứ Tư sau tuần gốc → 200; hôm nay = thứ Năm → 403 `Quá hạn chấm — nhờ Quản lý.`; GVBM kỹ
    năng khác → 403; QL thứ Năm 3 tuần sau → 200.
  - V6 không có lần vắng (ô bình thường, MT cũ "Không dự thi" T23, "-" chưa chốt) → 400 `Không có vắng để bỏ.`; kỹ năng đã có điểm →
    400 `Đã có điểm.`; kỹ năng bị "Không mock lại" (`required=0`) → 400 (theo Q4).
  - V7 **Hoàn tác** "-" đã chốt (`saveScore … { noShow:false }`) = `boVang` (trả lịch + đếm); GV ngoài khung → 403, không đổi gì. "-" chưa
    chốt gỡ như cũ.
  - V8 nhật ký: `attempt_schedule_history` `skill_absence_undone` (cũ → mới mã tuần), audit `attempt.bo_vang` before/after
    `{week, moveCount, sitStatus, huyVang}` + `lyDo`; `lich_su` **không** tính lại.
  - V9 `boVangXem` trả đúng `{tuanGoc, tuanNay, lanVang, lanVangSau, rutDeNghi}` cho ba trạng thái; `null` khi người xem không được bỏ.
  - V10 Writing: "-" chốt ở W → Bỏ vắng gỡ dấu trên đúng dòng (Task 0 mục 4).
- [ ] **Bước 2:** `boVang` (một `tx`): đọc kỹ năng + dòng dấu → nhận trạng thái (bảng trên) → quyền
  `can(p, PLAN_WEEK, {classId}) || (scoreEditPath(p, …) === 'assigned' && today <= skillScoreDeadline('mock', tuanGoc.week_start))` →
  UPDATE `attempt_skills` (`planned_period_id = no_show_period_id, sit_status='scheduled', huy_vang=0, absent_from_no_show=0, sit_note=NULL,
  plan_source='manual', absence_move_count = absence_move_count - (tuDoi ? 1 : 0)`) → xoá các cột `no_show_*` của dòng dấu → `rutDeNghiDoi`
  (mở rộng cho đề nghị của `huy-vang`) → `logSchedule` + `writeAudit` → `recomputeCompletionWeek` → `refreshOutcome`. Không chuông mới.
- [ ] **Bước 3:** `boVangXem` gắn vào mỗi kỹ năng ở `attemptDetail`, dữ liệu `HopKyNang`, `bangTheoLuot`, ô lưới Lịch Test (đọc theo lô:
  một câu cho mọi lượt của bảng, không N+1). Route `POST /attempts/:id/skills/:skill/bo-vang`. Trần `TRAN_GHI_LO` cho `bangTheoLuot` đo lại.
- [ ] **Bước 4:** `npm run check` xanh. **Bước 5:** commit `feat(bv): Bỏ vắng Mock — trả lịch cũ + số lần vắng; Hoàn tác "-" đã chốt đi cùng đường`.

### Task 6: Bỏ vắng — lớp thường
**Files:** Modify `server/src/normal/regular.ts` (`reportRegularNoShow` nhánh gỡ dấu `:720-737`, đếm lần `:699-700`, `regularSheet`) · Test `prBv.tests.ts`
- [ ] **Bước 1 — kiểm đỏ:** L1 "-" Giữa khoá môn Nghe → dời tuần sau; gỡ → tuần cũ **và** lần vắng kế tiếp vẫn là lần 1 (không chuông `sos`
  lần 2 oan); L2 GVBM gỡ trong khung (≤ thứ Tư sau tuần gốc) → 200, ngoài khung → 403 `Quá hạn chấm — nhờ Quản lý.`, QL mọi lúc → 200;
  L3 GVCN đã Báo vắng: như GVBM (theo Q3); L4 `regularSheet` mỗi ô có `boVang` (tuần gốc → tuần nay, lần vắng).
- [ ] **Bước 2:** lần vắng = số audit `regular.no_show` − số audit `regular.no_show_cleared` của (lượt, môn); kiểm khung cho người không có
  `PLAN_WEEK`; `boVangXem` lớp thường dùng chung kiểu `BoVangXem` (`rutDeNghi=false`).
- [ ] **Bước 3:** `npm run check` xanh. **Bước 4:** commit `feat(bv): lớp thường — gỡ "-" trả đúng số lần vắng, khung chấm cho GV`.

### Task 7: Web — Bỏ vắng (`/ponytail lite`)
**Files:** Modify `shared/domain/thaoTacMt.ts`, `web/src/modules/fasttrack/HopThaoTacMt.tsx`, `MockDetailPage.tsx`, `web/src/modules/test/keHoach/HopKyNang.tsx`, `web/src/modules/cham/LuoiFT.tsx`, `LuoiThuong.tsx`, `ScoreEntry.tsx` (toast Hoàn tác)
- [ ] **Bước 1 — kiểm đỏ (shared):** `thaoTacKyNang('vang', {…, boVang:true})` → menu bắt đầu bằng `'bo-vang'`; `'huy-vang'` QL → chính
  `'khoi-phuc'`, menu `['bo-vang','khong-mock-lai']`; GVBM `boVang:true` ở `'dang-thi'` → menu `['bo-vang']`; `boVang` không truyền →
  như cũ (mọi phép kiểm thaoTacMt cũ xanh).
- [ ] **Bước 2:** `HopThaoTacMt` thêm `'bo-vang'` vào `THAO_TAC_CO_HOP`: tiêu đề `Bỏ vắng`, hai dòng `Lịch thi  W3 SEP → W2 SEP` (bỏ dòng
  khi `tuanNay` null), `Lần vắng  1 → 0`, dòng `Đề nghị dời  Rút` khi `rutDeNghi`; ô `Lý do` (tuỳ chọn, placeholder `Không bắt buộc`);
  nút `Huỷ` · `Bỏ vắng`. Xong: toast `Đã bỏ vắng`, tải lại, focus ô điểm kỹ năng đó. Lỗi máy chủ hiện trong hộp (không đóng hộp).
- [ ] **Bước 3:** truyền `huyVang` vào `trangThaiTT` ở `MockDetailPage` và `HopKyNang` (nếu MTb chưa sửa — Task 0 mục 6); truyền
  `boVang: !!k.boVang` vào `QuyenTT` ở cả bốn nơi vẽ thao tác. `LuoiFT`: ô vắng (chữ `vắng`) thành nút mở hộp khi `boVang` khác null
  (không thêm ⋯ mới); `LuoiThuong`: ⋯ của ô có mục `Bỏ vắng` (đứng đầu).
- [ ] **Bước 4:** chữ đúng mockup phần A. Ảnh 375/1440, sáng/tối, QL + GVBM trong khung + GVBM ngoài khung (không có nút).
- [ ] **Bước 5:** `npm run check` xanh; commit `feat(bv): nút Bỏ vắng ở hồ sơ Mock, Kế hoạch Test, lưới FT, lưới lớp thường`.

### Task 8: Web — Xoá điểm hàng loạt + Đã xoá (`/ponytail lite`)
**Files:** Modify `web/src/modules/cham/DiemTheoLop.tsx`, `LuoiChamLop.tsx`, `LuoiFT.tsx`, `LuoiThuong.tsx` (cột chọn) · Create `web/src/modules/cham/HopXoaDiem.tsx`, `web/src/modules/cham/NganDiemDaXoa.tsx`
- [ ] **Bước 1:** chỉ khi `sheet.canPlan` (QL/QT): cột chọn đầu bảng (ô chọn cả bảng ở đầu cột, đứng yên khi cuộn ngang như cột tên);
  chọn ≥ 1 em → thanh `Đã chọn 3` · `Xoá điểm` · `Bỏ chọn` thay hàng "Chỉ ô còn trống". Nút `Đã xoá · n` (khi `soLanXoa > 0`) ở cuối hàng
  công cụ. GV không thấy gì mới.
- [ ] **Bước 2:** `HopXoaDiem` (`ConfirmDialog` danger, `web/src/ui/Drawer.tsx:43`): tiêu đề `Xoá điểm · MT2` (lớp thường: tên bài);
  dòng `3 em`; ô chọn kỹ năng (mặc định tick đủ: `L R W S` / `Nghe Đọc G+V Viết`); dòng xem trước (gọi `xemTruoc` mỗi lần đổi tick, chờ
  300 ms; đang đếm `Đang đếm…`); `Lý do`; nút `Xoá 6 điểm` (khoá khi 0 điểm / thiếu lý do / đang đếm). 0 điểm → dòng `Không có điểm để xoá`.
- [ ] **Bước 3:** xoá xong: bỏ chọn, tải lại bảng, toast `Đã xoá 6 điểm` + nút `Hoàn tác` (gọi khôi phục `lo`, 10 giây).
- [ ] **Bước 4:** `NganDiemDaXoa` (`KhungPanel`): mỗi lần xoá một khối — dòng 1 `MT2 · 6 điểm` + nhãn nguồn (`Xoá hàng loạt` /
  `Huỷ điểm` / `Thi lại` / `Xoá ô`), dòng 2 `06/10 14:20 · Trần Thu Hà`, dòng 3 `Lý do: …` (khi có), nút `Khôi phục`; mở khối → từng ô
  `Lê Hà Vy · L 6.0` + `Khôi phục`. Ô đã khôi phục: nhãn `Đã khôi phục` (mờ). Kết quả có bỏ qua → toast `Đã khôi phục 4 · 2 ô có điểm mới`.
- [ ] **Bước 5:** 375: cột chọn giữ; thanh chọn xuống đáy màn (dính), hộp xoá thành tấm đáy; ngăn Đã xoá toàn màn.
- [ ] **Bước 6:** `/impeccable harden` (mất mạng giữa xem trước, 403, quá 300 ô), `/impeccable adapt` (375). Ảnh 375/1440, sáng/tối, QL + GV.
- [ ] **Bước 7:** `npm run check` xanh; commit `feat(bv): Điểm theo lớp — chọn em, xoá điểm có xem trước, Đã xoá + Khôi phục`.

### Task 9: Tài liệu + khép PR
- [ ] Rulebook §20: thêm 3 dòng luật (Bỏ vắng; xoá mềm + khôi phục; trần 300 ô) — **chỉ khi** chủ sản phẩm đã duyệt mockup và câu hỏi.
- [ ] `CODE_MAP.md` (`fasttrack/diemDaXoa.ts`, `shared/domain/diemDaXoa.ts`, `migrate/prBv.ts`, `tests/prBv.tests.ts`, hai file web mới);
  `plan.md` mục 11 một dòng; `[x]` các task; ảnh sổ tay lệch (`docs/so-tay/`) ghi vào mô tả PR.
- [ ] `npm run check` xanh → `/impeccable audit` → `/ponytail-review` → `requesting-code-review` → `finishing-a-development-branch` (mở PR vào
  `main`, **không merge**). Commit `docs(bv): Rulebook, CODE_MAP, plan.md`.

## Nghiệm thu
1. QL gõ "-" nhầm cho bài tuần trước → bài tự dời sang tuần sau, "vắng lần 1". QL (hoặc GV chấm bài đó trước hết thứ Tư) bấm **Bỏ vắng**
   → bài về tuần cũ, không còn "vắng", nhập điểm ngay được; lần vắng thật sau đó vẫn là lần 1.
2. Bài "vắng · chờ Quản lý duyệt dời" và "huỷ (vắng 2 lần)" có Bỏ vắng → đề nghị / thẻ Xin dời đang chờ biến khỏi Chờ duyệt.
3. Bấm Hoàn tác ở toast "-" của bài tuần đã qua trả đủ lịch + số lần vắng (hết "hoàn tác nửa vời").
4. Lớp thường: gỡ "-" trả tuần cũ và số lần vắng; GV ngoài khung không gỡ được.
5. Điểm theo lớp (QL): chọn 3 em → Xoá điểm → bỏ tick còn L → thấy `Xoá 3 điểm · 3 em …` → nhập lý do → xoá; điểm biến khỏi bảng,
   SOS, Phân tích, Xuất Excel; Case chỉ dựng trên các điểm đó đóng. `Đã xoá · 1` → Khôi phục → điểm trở lại (ô có điểm mới thì giữ).
6. GV xoá trắng một ô (T22) → QL thấy ở `Đã xoá`, khôi phục được.
7. Bài lớp thường xoá một môn → "Chờ điểm" (không còn "xong").
8. GV không thấy cột chọn, nút Xoá điểm, Đã xoá; API trả 403. `npm run check` xanh; ảnh 375/1440 sáng/tối, ≥ 3 vai.

## Prompt cho session code (dán nguyên khối)
```
Repo pisa-tracking. Chỉ bắt đầu khi mockup thiet-ke/mockup-bo-vang-xoa-diem-2026-10-06.html đã được chủ sản phẩm duyệt
và PR-MTa đã merge (đã merge #212).
Nhánh pr-bv-bo-vang-xoa-diem từ origin/main mới nhất (worktree .claude/worktrees/pr-bv-bo-vang-xoa-diem).
Model: Opus 5.5 · High (thay thế: Sonnet 5.5 · High). Không dùng Fable, kể cả subagent.
Đọc CLAUDE.md, plan.md mục 1 và mục 4 "PR-BV", rồi làm đúng docs/superpowers/plans/2026-10-06-pr-bv-bo-vang-xoa-diem.md,
Task 0 → 9 theo thứ tự. Task 0 là đối chiếu mã: lệch lớn thì DỪNG, báo planning.
Ponytail full cho Task 0–6; gõ /ponytail lite trước Task 7–8 (web).
superpowers:subagent-driven-development; mỗi task test-driven-development (đỏ trên DB test trước, file
server/src/tests/prBv.tests.ts gọi ở cuối run.ts), verification-before-completion (npm run check, một lần một lúc).
Không mất điểm: chụp vào diem_da_xoa TRƯỚC khi xoá trắng, cùng tx; khôi phục không bao giờ đè ô có điểm mới.
Chữ trên màn đúng mockup (ngắn, không câu giải thích). Câu hỏi Q1–Q4 cuối kế hoạch: theo trả lời của chủ sản phẩm ghi ở
plan.md; chưa có thì làm theo khuyến nghị và ghi trong mô tả PR.
Web: /impeccable clarify, harden, adapt (375); trước mở PR /impeccable audit. Cuối: /ponytail-review, requesting-code-review,
finishing-a-development-branch (mở PR vào main, KHÔNG merge). Mô tả PR: từng mục (Bỏ vắng FT, lớp thường, xoá mềm, hàng loạt,
khôi phục, lỗi regular.ts), file sửa, phép kiểm, ảnh 375/1440 sáng/tối QL + GVBM + GVCN, chú thích ponytail:.
```

## Tự quyết (planning, 06/10)
| # | Tự quyết | Vì sao |
|---|---|---|
| G1 | Bảng **mới** `diem_da_xoa` (theo ô), không dùng lại `ket_qua_huy` | `ket_qua_huy` theo cả lượt, gắn "dời vượt" (cột `vuot_boi`, chặn thứ tự đợt, `ketQuaHuyCua` hiện trạng thái "kết quả đã huỷ" của lượt); xoá ô cần khôi phục từng ô |
| G2 | Chụp ở **trong** `saveScore` / `saveRegularScore` (một chỗ), không ở từng nơi gọi | Xoá trắng ô, Huỷ điểm, Thi lại, hàng loạt đều tự khôi phục được; không sót đường |
| G3 | Chỉ chụp khi **xoá trắng** cả ô; sửa số (6.0 → 6.5) không chụp | Giá trị cũ đã ở Lịch sử; "Đã xoá" chỉ là xoá |
| G4 | Xem trước = chạy thật trong `tx` rồi **cuộn lại** | Một luật Case duy nhất, số xem trước luôn khớp số thật; ≤ 300 ô nên khoá ghi ngắn (`ponytail:` ghi rõ trần) |
| G5 | Xoá hàng loạt **một `tx`**: một ô lỗi thì không xoá ô nào | Một lần bấm = một lần xoá = một lần khôi phục; không nửa vời |
| G6 | Một lối vào: **Điểm theo lớp** (cả hai lối vào của PR-DL: hồ sơ lớp + Test › Điểm theo lớp). "Cả đợt một em" = chọn một em, tick đủ kỹ năng | Ít chỗ, cùng một hộp; hồ sơ Mock giữ "Huỷ điểm" từng kỹ năng |
| G7 | Khôi phục **không mở lại Case đã đóng** | Như MTa G9; còn trượt thì SOS mới tự sinh |
| G8 | Bỏ vắng **không** tính lại cờ MT cũ (`lich_su`) | Trả về đúng lịch đã có, không phải xếp mới vào tuần đã qua |
| G9 | Bỏ vắng không gửi chuông mới (chuông "tự dời" cũ không xoá được — `notify` chỉ upsert) | Nhật ký đủ; tránh ồn |
| G10 | Hoàn tác "-" **đã chốt** = Bỏ vắng (cùng quyền, cùng khung) | Sửa gốc "hoàn tác nửa vời" (rà 06/10 A3 #4) |
| G11 | Nhãn nút `Bỏ vắng` (không phải "Em có thi") | Ngắn, khớp "Báo vắng" đã có |
| G12 | "Đã xoá" giữ mãi, ngăn hiện 60 lần gần nhất | Dữ liệu nhỏ; YAGNI dọn tự động |
| G13 | Lớp thường: lần vắng = audit `no_show` − audit `no_show_cleared` | Không thêm cột; sửa đúng chỗ đếm |

## Câu hỏi cho chủ sản phẩm (gộp, có khuyến nghị — session code theo khuyến nghị nếu chưa trả lời)
- **Q1 — Xoá hàng loạt có bắt lý do?** (A) Bắt buộc (nhiều điểm, người khác cần biết vì sao). (B) Tuỳ chọn như xoá trắng một ô (T22).
  **Khuyến nghị A.**
- **Q2 — Ai khôi phục điểm đã xoá?** (A) Chỉ Quản lý / Quản trị. (B) Thêm người đã xoá, trong khung chấm. **Khuyến nghị A** (GV xoá nhầm
  một ô thì gõ lại được; khôi phục là đường lui của QL).
- **Q3 — GVCN có Bỏ vắng không?** GVCN Báo vắng được. (A) Có, cùng khung chấm như GV chấm bài. (B) Không, chỉ GV chấm bài + QL.
  **Khuyến nghị A** (ai báo vắng thì gỡ được trong khung).
- **Q4 — Kỹ năng đã "Không mock lại" (QL từ chối Xin dời): có Bỏ vắng?** (A) Không — QL dùng "Đưa lại vào đợt" rồi xếp tuần. (B) Có,
  Bỏ vắng đưa lại vào đợt luôn. **Khuyến nghị A** (đó là quyết định của QL, không phải bấm nhầm "-").

## Migrate
Có: `server/src/migrate/prBv.ts` — bảng `diem_da_xoa` + 2 chỉ mục. Chỉ cấu trúc, không điền ngược, chạy lặp được. Trước deploy: tập dượt
trên bản sao DB bản chính (`plan.md` mục 5).

## File chồng với PR khác
| PR | File chung | Cách gộp |
|---|---|---|
| PR-MTb (đợt 5) | `HopThaoTacMt.tsx`, `MockDetailPage.tsx`, `HopKyNang.tsx`, `ScoreEntry.tsx`, `thaoTacMt.ts` | Ai sau rebase; BV chỉ thêm `'bo-vang'` + truyền `huyVang`/`boVang` |
| PR-MT0 (sau MTb) | `absence.ts` (MT0 vào luồng vắng?), `attempts.ts` | MT0 vào luồng vắng thì Bỏ vắng tự áp; thêm một phép kiểm |
| PR-LT3 | `canCham.ts`, `web/src/modules/test/lichTest/*` (ô lưới khối 1) | BV chỉ thêm trường `boVang` ở ô; chữ "vắng" giữ |
| PR-LUI | `cases/*`, `duyet/yeuCau.ts` | LUI dùng kiểu `NguonXoa` / mẫu xoá mềm nếu cần; không chung dòng |
| PR-DL (đã merge) | `DiemTheoLop.tsx`, `LuoiChamLop.tsx`, `diemTheoLuot.ts` | BV thêm cột chọn + thanh chọn; không đổi luồng lưu từng ô |
