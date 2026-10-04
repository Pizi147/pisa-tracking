# PR-DL · Điểm theo lớp (nhập điểm cả lớp theo từng lượt) — Kế hoạch (04/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giáo viên nhập điểm **cả lớp cho một bài Test một lần**, kể cả lượt đã qua và lượt đã có điểm. Lớp FT: mỗi lượt MT1, MT2, … (gồm MT lịch sử) là một bảng. Lớp thường: mỗi bài trong **Lịch Test của chính lớp đó** (Giữa khoá, Cuối khoá, bài thêm) là một bảng. Một thành phần dùng chung, hai lối vào: hồ sơ lớp (mục ⋮ "Điểm MT cả lớp" + khối thu gọn cuối trang) và tab mới "Điểm theo lớp" ở trang Test.

**Architecture:** Máy chủ: tách phần **chọn lượt** ra khỏi `classScoreSheet` (`server/src/fasttrack/attempts.ts:1722`) và `regularSheet` (`server/src/normal/regular.ts:854`) thành tham số `ChonLuot = { theo: 'tuan', periodId } | { theo: 'luot', attemptNo }` (FT) / `{ kind, attemptNo? }` (thường); phần dựng hàng và ô giữ nguyên, nên bảng trả về **cùng hình dạng** với `chamSheet` (`server/src/cham/canCham.ts:29`). Dịch vụ mới `server/src/cham/diemTheoLuot.ts`: `danhSachLuot(p, classId)` (thanh chuyển lượt: tuần, x/y đủ điểm, còn ô trống, lịch sử) và `bangTheoLuot(p, classId, luot)` (bảng + danh sách HV lớp **chưa có lịch** lượt đó). Đường đọc mới `GET /classes/:id/diem-theo-luot` và `GET /classes/:id/diem-theo-luot/:luot` với quyền `requireXemLuotCham` (không cần `PLAN_WEEK`). Đường **ghi không đổi**: `PUT /attempts/:id/scores/:skill`, `PUT /regular/attempts/:id/scores/:skill`, `scoreEditPath` (`server/src/auth/permissions.ts:577`: `assigned` / `lich_su` / `override` — sửa ô đã có điểm vẫn bắt lý do). Luật thuần `shared/domain/diemTheoLuot.ts` (mã lượt `mt:2` / `thuong:final:1`, chọn lượt mặc định, đếm ô trống). Web: `web/src/modules/cham/DiemTheoLop.tsx` dùng lại `LuoiFT`, `LuoiThuong`, `MotKyNang`, `useSaveScore`; gắn vào `ClassOverviewPage`/`DauTrangLop` và `TestPage` (tab `diem-lop`).

**Tech Stack:** React + Tailwind (web/), Express + SQLite/Turso (server/), phép kiểm `server/src/tests/*.tests.ts` chạy qua `run.ts`; `npm run check` = build + test + typecheck.

**Spec:** yêu cầu chủ sản phẩm 04/10 (mục "Điểm theo lớp") + mockup đã duyệt về nguyên tắc `diem-mt-theo-lop.html` (chép vào `thiet-ke/mockup-diem-theo-lop-2026-10-04.html` ở Task DL-0). Tiêu chí ở mục **Nghiệm thu**.

**Phụ thuộc / thứ tự:** chạy **sau PR-LM** (lượt "chưa xếp lịch" có tuần NULL phải hiện "Chưa có lịch MTn"; dòng ghi chú trỏ về panel Lộ trình của PR-LM). `DauTrangLop.tsx` cũng bị PR-DH (`ThanhTruocSau`) và PR-SL sửa: xếp **sau PR-DH**; nếu PR-SL chưa merge thì rebase và chỉ thêm một mục vào `MenuDong`, không đổi chỗ khác. Không phụ thuộc PR-NT.

## Global Constraints
- CLAUDE.md: tinh chỉnh, không làm lại. Giữ Be Vietnam Pro (chữ số Inter), bảng màu, bố cục hồ sơ lớp và trang Test. Thời gian trên màn dùng **mã tuần** `W3 JUL`, không hiện ngày.
- Khối ở hồ sơ lớp **kín đáo**: mặc định thu gọn (trừ khi mở bằng mục ⋮), chỉ một chip trạng thái "MT2 còn 3 ô trống".
- **Không tự tạo lịch.** HV chưa có lượt đó: hàng mờ, chữ "Chưa có lịch MT{n} — xếp ở panel Lộ trình" (FT) / không hiện hàng với HV vào lớp sau bài đó (lớp thường). Không có đường ghi nào mới.
- Ô và bàn phím **y như lưới hiện tại** (dùng lại component, không chép). MT lịch sử không nhận `-` (máy chủ đã chặn; web không đưa lựa chọn `-`).
- Không bao giờ bớt: kiểm quyền đọc (`requireXemLuotCham`) **trước** mọi truy vấn dữ liệu HV; kiểm tham số `luot` (sai dạng → 400, lượt không thuộc lớp → 404); sửa ô có điểm vẫn đi đường `override` có lý do; không để mất điểm đang gõ khi đổi lượt (dùng cơ chế lưu khi rời ô của `useSaveScore`; còn ô đang lưu thì chặn đổi lượt bằng hộp hỏi).
- Refactor `classScoreSheet` / `regularSheet` không được đổi kết quả cũ: toàn bộ phép kiểm đang có của `/classes/:id/cham` phải xanh mà **không sửa** phép kiểm cũ.
- Hàm mới ở `shared/domain/*` re-export qua `shared/domain/index.ts`. File kiểm mới `server/src/tests/prDl.tests.ts` import và gọi ở **cuối** `server/src/tests/run.ts` (ngay trước khối in tổng kết `passed`/`failures`).
- File mới → cập nhật `CODE_MAP.md` cùng commit (`cham/diemTheoLuot.ts`, `shared/domain/diemTheoLuot.ts`, `modules/cham/DiemTheoLop.tsx`, `modules/test/TabDiemLop.tsx`, `tests/prDl.tests.ts`).
- Nhánh `pr-dl-diem-theo-lop`. Xong: đánh dấu `[x]`, thêm một dòng ở mục 11 `plan.md`, mở PR (không tự merge), liệt kê chú thích `ponytail:`.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `superpowers:subagent-driven-development`. Gõ `/ponytail lite` (PR có sửa giao diện) |
| DL-0 (điều tra lịch Test lớp thường) | `superpowers:brainstorming` nếu dữ liệu không như Giả định G2 — dừng, ghi lại, hỏi chủ sản phẩm |
| Mỗi task | `superpowers:test-driven-development`: kiểm đỏ, sửa, kiểm xanh |
| DL-5, DL-6 (giao diện) | `/impeccable layout` (bảng + thanh lượt + danh sách lớp) · `/impeccable clarify` (chữ "Chưa có lịch…", chip, callout lịch sử) · `/impeccable adapt` (375: một kỹ năng một lúc, ‹ MT ›) |
| Trước khi báo xong mỗi task | `superpowers:verification-before-completion`: chạy `npm run check`, đọc kết quả |
| Cuối PR | `/impeccable audit`, `/ponytail-review`, `superpowers:requesting-code-review`, `superpowers:finishing-a-development-branch` (mở PR, không merge) |

---

### Task DL-0: Điều tra lịch Test lớp thường + chép mockup
Skill: brainstorming (chỉ khi lệch Giả định)

**Files:** đọc `server/src/keHoach/keHoachTest.ts:584` (`luoiThuong`), `server/src/normal/regular.ts:854` (`regularSheet`), `web/src/modules/cham/LuoiThuong.tsx`, màn "Lịch Test của lớp" (`/ke-hoach-test/thuong/:classId`, route `server/src/routes/index.ts:518`); tạo `thiet-ke/mockup-diem-theo-lop-2026-10-04.html` (chép mockup scratchpad).

- [ ] Xác định một bài Test lớp thường được nhận diện bằng gì: `assessment_attempts.kind` (`progress`/`final`, cột lấy từ `prog.checkpoints`) cộng `attempt_no` cho bài thêm/bài làm lại? Lịch riêng của lớp lưu ở `attempt_skills.planned_period_id` hay bảng khác? Ghi kết quả 5–10 dòng vào đầu `server/src/cham/diemTheoLuot.ts` (chú thích khối).
- [ ] Nếu bài thêm **không** là một `attempt` riêng có khoá ổn định → dừng, ghi vào báo cáo, hỏi chủ sản phẩm (không tự thêm bảng mới).
- [ ] Commit: `docs(dl): chép mockup Điểm theo lớp, ghi cách lưu lịch Test lớp thường`.

### Task DL-1: Luật thuần mã lượt + lượt mặc định
Skill: test-driven-development

**Files:** tạo `shared/domain/diemTheoLuot.ts`; sửa `shared/domain/index.ts`; tạo `server/src/tests/prDl.tests.ts`; sửa cuối `server/src/tests/run.ts`.

**Interfaces:**
```ts
export type MaLuot = { loai: 'mt'; so: number } | { loai: 'thuong'; kind: 'progress' | 'final'; so: number };
export function docMaLuot(s: string): MaLuot | null;   // 'mt:2' | 'thuong:final:1'; sai → null
export function vietMaLuot(m: MaLuot): string;
export type TomTatLuot = { ma: string; nhan: string; tuanStart: string | null; lichSu: boolean;
  duDiem: number; coLich: number; oTrong: number };
export function luotMacDinh(ds: TomTatLuot[]): string | null; // lượt GẦN NHẤT (tuần lớn nhất, null xếp cuối) còn oTrong>0; không có → lượt cuối
export function nhanLuot(m: MaLuot): string;            // 'MT2' | 'Giữa khoá' | 'Cuối khoá' | 'Cuối khoá · lần 2'
```
- [ ] Viết kiểm đỏ:
```ts
import { docMaLuot, vietMaLuot, luotMacDinh, nhanLuot } from '../../../shared/domain/index.ts';
export function runPrDlTests(check: (name: string, fn: () => void) => void) {
  check('DL-1 mã lượt đọc/viết hai chiều', () => {
    for (const s of ['mt:1', 'mt:12', 'thuong:progress:1', 'thuong:final:2']) assert.equal(vietMaLuot(docMaLuot(s)!), s);
    for (const s of ['', 'mt:0', 'mt:-1', 'mt:x', 'thuong:mid:1', 'mt:2;drop']) assert.equal(docMaLuot(s), null);
  });
  check('DL-1 lượt mặc định = gần nhất còn ô trống', () => {
    const l = (ma: string, tuanStart: string | null, oTrong: number) =>
      ({ ma, nhan: ma, tuanStart, lichSu: false, duDiem: 0, coLich: 3, oTrong });
    assert.equal(luotMacDinh([l('mt:1', '2026-06-01', 2), l('mt:2', '2026-07-13', 3), l('mt:3', '2026-08-24', 0)]), 'mt:2');
    assert.equal(luotMacDinh([l('mt:1', '2026-06-01', 0), l('mt:2', '2026-07-13', 0)]), 'mt:2');
    assert.equal(luotMacDinh([]), null);
  });
  check('DL-1 nhãn lượt', () => {
    assert.equal(nhanLuot({ loai: 'mt', so: 2 }), 'MT2');
    assert.equal(nhanLuot({ loai: 'thuong', kind: 'final', so: 2 }), 'Cuối khoá · lần 2');
  });
}
```
  Dùng đúng kiểu `check`/`assert` mà các file `*.tests.ts` gần nhất (vd `prGva.tests.ts`) đang dùng. Ở cuối `run.ts`, ngay trước khối in tổng kết: `import { runPrDlTests } from './prDl.tests.ts';` (đặt cùng chỗ các import khác) và gọi `runPrDlTests(check)`.
- [ ] `npm run check` → đỏ. Viết `diemTheoLuot.ts` → xanh.
- [ ] Commit: `feat(dl): luật mã lượt và lượt mặc định`.

### Task DL-2: Tách phần chọn lượt khỏi classScoreSheet (FT)
Skill: test-driven-development

**Files:** sửa `server/src/fasttrack/attempts.ts` (~1722–1800); thêm kiểm `prDl.tests.ts`.

**Interfaces:**
```ts
export type ChonLuotFT = { theo: 'tuan'; periodId: number | null } | { theo: 'luot'; attemptNo: number };
export function classScoreSheet(p, classId, chon: number | null | ChonLuotFT, today?): /* như cũ */;
```
Giữ chữ ký cũ (số/null = `{theo:'tuan'}`) để mọi nơi gọi không đổi. Nhánh `luot`: thay khối lọc tuần (dòng ~1748) bằng `AND a.kind = 'mock' AND a.attempt_no = ?` (kiểm tên kind thật trong `ATTEMPT_SELECT`/seed; MT lịch sử cũng là `attempt_no`), **không** lọc tuần, nên lượt tuần NULL (chưa xếp lịch, PR-LM) và lượt đã qua đều có.
- [ ] Kiểm đỏ (dùng seed lớp FT có MT1 lịch sử + MT2 đã một phần điểm; dựng bằng helper seed của các test FT hiện có):
  - `classScoreSheet(ql, lopFT, {theo:'luot', attemptNo:2})` trả đúng các attempt `attempt_no=2` của lớp, kể cả attempt có `planned_period_id IS NULL`, và ô đã có điểm mang `score` cũ.
  - `classScoreSheet(ql, lopFT, periodId)` cho **cùng kết quả** như trước refactor (so với ảnh chụp JSON lấy trước khi sửa, lưu trong phép kiểm).
  - GV ngoài phạm vi lớp → lỗi 403 trước khi có truy vấn HV.
- [ ] Sửa → xanh; toàn bộ kiểm cũ của `/classes/:id/cham` xanh không sửa.
- [ ] Commit: `refactor(dl): classScoreSheet chọn theo tuần hoặc theo số lượt`.

### Task DL-3: Tách phần chọn bài khỏi regularSheet (lớp thường)
Skill: test-driven-development

**Files:** sửa `server/src/normal/regular.ts:854–900`; thêm kiểm.

- [ ] `regularSheet(p, classId, kind?, today?, attemptNo?)`: thêm `AND a.attempt_no = ?` khi có `attemptNo` (theo kết quả DL-0). Không đổi khi bỏ trống.
- [ ] Kiểm đỏ: lớp thường có Giữa khoá đã qua (có điểm) + Cuối khoá chưa thi; `regularSheet(gvcn, lop, 'progress', today, 1)` có điểm cũ; HV vào lớp sau bài Giữa khoá (không có attempt) **không** có hàng; lớp đổi lịch riêng (attempt_skills tuần khác mặc định) vẫn ra đúng bài.
- [ ] Commit: `refactor(dl): regularSheet chọn theo bài`.

### Task DL-4: Dịch vụ + đường đọc diem-theo-luot
Skill: test-driven-development

**Files:** tạo `server/src/cham/diemTheoLuot.ts`; sửa `server/src/routes/index.ts` (cạnh route `/classes/:classId/cham`); thêm kiểm.

**Interfaces:**
```ts
export function danhSachLuot(p: Principal, classId: number, today?: string):
  { classId: number; mode: 'ielts_band' | 'ratio'; luot: TomTatLuot[]; macDinh: string | null };
export function bangTheoLuot(p: Principal, classId: number, ma: string, today?: string):
  ReturnType<typeof chamSheet> & { luot: TomTatLuot; chuaCoLich: { studentId: number; fullName: string; studentCode: string }[] };
export function lopCuaToi(p: Principal): { classId: number; classCode: string; mode: 'ielts_band'|'ratio'; oTrong: number }[];
```
- `requireXemLuotCham(p, { classId }, …)` là dòng đầu mỗi hàm (sau tra lớp tồn tại).
- `danhSachLuot` FT: `GROUP BY attempt_no` trên attempts lớp (status ≠ cancelled), tuần = `MIN(week_start)` của lượt; `coLich` = số attempt; `duDiem` = attempt đủ mọi kỹ năng bắt buộc; `oTrong` = ô kỹ năng bắt buộc chưa có điểm (không tính ô `-` hợp lệ). Lớp thường: theo `(kind, attempt_no)`.
- `chuaCoLich` (FT) = HV đang học của lớp (`HV_DANG_HOC_SQL`) không có attempt lượt đó.
- `bangTheoLuot` gọi lại `chamSheet` internals (truyền `ChonLuotFT` / `attemptNo`), không chép truy vấn.
- `lopCuaToi`: lớp người xem dạy/quản lý theo đúng phạm vi `requireXemLuotCham` (dùng hàm phạm vi lớp sẵn có của trang Lịch Test; ghi tên hàm thật vào commit).
- Routes: `GET /classes/:classId/diem-theo-luot` → `danhSachLuot`; `GET /classes/:classId/diem-theo-luot/:luot` → `bangTheoLuot` (`docMaLuot` null → `badRequest('Mã lượt không hợp lệ')`; lượt không có attempt nào → `notFound('Lớp chưa có lượt này')`); `GET /diem-theo-lop/lop` → `lopCuaToi`.
- [ ] Kiểm đỏ qua HTTP helper sẵn có: GV dạy lớp đọc được, GV lớp khác 403, QL chi nhánh khác 403; `mt:abc` → 400; `mt:9` → 404; lớp FT trả `mt:thuong:…` → 400; `macDinh` đúng luật DL-1; HV không có MT2 nằm trong `chuaCoLich`; **GV không có `PLAN_WEEK` vẫn đọc được**; sau `PUT /attempts/:id/scores/:skill` một ô thì `oTrong` giảm 1; sửa ô đã có điểm không lý do → bị từ chối như hôm nay (đường `override`).
- [ ] Commit: `feat(dl): đường đọc điểm theo lượt cho cả lớp`.

### Task DL-5: Thành phần DiemTheoLop (web)
Skill: test-driven-development · `/impeccable layout` · `/impeccable clarify` · `/impeccable adapt`

**Files:** tạo `web/src/modules/cham/DiemTheoLop.tsx`; sửa nhẹ `LuoiFT.tsx`, `LuoiThuong.tsx`, `MotKyNang.tsx` chỉ để nhận prop `hangMo?` / `chiOTrong?` nếu cần; thêm hàm gọi API ở `web/src/api` cạnh hàm `cham` hiện có.

**Interfaces:** `<DiemTheoLop classId={number} luotBanDau?={string} gon?={boolean} />`.
- Thanh lượt: `role="tablist"`, mỗi nút "MT2 · lịch sử" + dòng nhỏ "W3 JUL · 5/8 đủ điểm" (không lịch: "chưa ai có lịch"); nút ‹ › hai bên; mặc định `macDinh`. Đổi lượt khi còn ô đang lưu → hộp hỏi "Còn ô đang lưu. Đợi lưu xong rồi chuyển?" (không bỏ điểm).
- Bảng: dùng `LuoiFT`/`LuoiThuong` với dữ liệu `bangTheoLuot`; hàng `chuaCoLich` mờ cuối bảng, `colspan` "Chưa có lịch MT2 — xếp ở panel Lộ trình" (link mở panel Lộ trình của HV, của PR-LM).
- Toggle "Chỉ ô còn trống" (lọc hàng không còn ô trống; nhớ bằng `localStorage` bọc try/catch).
- Callout lượt lịch sử: "MT1 là lượt lịch sử (trước khi lớp dùng web): nhập bù điểm, không nhận dấu "-"."
- 375px: `MotKyNang` (một kỹ năng một lúc) + hàng "‹ MT1 · MT2 · W3 JUL · MT3 ›".
- Trạng thái: đang tải (khung xương), lỗi + nút phụ "Thử lại", lớp chưa có lượt nào ("Lớp chưa có lượt Test nào. Xếp lịch ở Kế hoạch Test.").
- [ ] Kiểm: phần luật (lọc "chỉ ô trống", nhãn) đã ở DL-1; thêm kiểm `shared` nếu tách thêm hàm thuần. Typecheck xanh.
- [ ] Commit: `feat(dl): bảng điểm theo lượt dùng chung`.

### Task DL-6: Hai lối vào
Skill: `/impeccable layout` · `/impeccable clarify`

**Files:** sửa `web/src/modules/classes/DauTrangLop.tsx` (`MenuDong` ~96–118), `web/src/modules/classes/ClassOverviewPage.tsx` (cuối trang), `shared/domain/dieuHuong.ts:70–71`, `web/src/modules/test/TestPage.tsx`; tạo `web/src/modules/test/TabDiemLop.tsx`; thêm kiểm điều hướng.

- [ ] `dieuHuong.ts`: `TabTest` thêm `'diem-lop'`; `TAB_TEST = ['lich','diem-lop','ke-hoach']`; nhãn "Điểm theo lớp"; đường `/test/diem-lop`; `HIEN_TEST['diem-lop'] = (n) => n.testGrade`. Kiểm đỏ trước trong `prDl.tests.ts`: `tabTestTuDuong('diem-lop') === 'diem-lop'`; `tabTestHienThi` có `diem-lop` khi `testGrade`, không có khi chỉ `testPlan`.
- [ ] `TabDiemLop`: trái danh sách `lopCuaToi` (mã lớp + chip "3 trống", chọn lớp ghi vào `?lop=`), phải `<DiemTheoLop>`. 375: danh sách thành ô chọn lớp phía trên.
- [ ] `MenuDong`: thêm mục "Điểm MT cả lớp" (lớp thường: "Điểm Test cả lớp") trước "Xuất Excel"; bấm → mở và cuộn tới khối cuối trang. Chỉ hiện khi người xem có `requireXemLuotCham` (dùng cờ quyền sẵn có trên dữ liệu hồ sơ lớp, vd `canPlanWeek`/`testGrade`; nếu chưa có cờ thì thêm `coTheXemDiem` vào payload hồ sơ lớp — có kiểm).
- [ ] `ClassOverviewPage`: khối thu gọn cuối trang "Điểm Mock Test của lớp" + chip "MT2 còn 3 ô trống" (lấy từ `danhSachLuot`), `aria-expanded`, mở mới tải bảng (`gon`).
- [ ] Commit: `feat(dl): lối vào Điểm theo lớp ở hồ sơ lớp và trang Test`.

### Task DL-7: Rà soát, đo tốc độ, tài liệu
Skill: verification-before-completion

- [ ] Thêm 2 dòng vào `server/src/tests/tocDoDuong.ts` cho `/classes/{lopFT}/diem-theo-luot/mt:2` và `/test/diem-lop` (vai QL, GV) theo mẫu sẵn có.
- [ ] `CODE_MAP.md`, `plan.md` mục 11. `npm run check` xanh.
- [ ] Commit: `chore(dl): đo tốc độ, CODE_MAP, plan`.

## Nghiệm thu
1. Lớp FT có MT1 lịch sử, MT2 còn ô trống, MT3 đủ: mở hồ sơ lớp → ⋮ "Điểm MT cả lớp" → khối mở ở MT2. Nhập một ô trống, Tab/Enter như lưới cũ, lưu ngay; chip giảm.
2. ‹ sang MT1 (lịch sử): callout hiện; gõ `-` bị từ chối; nhập bù được. Sửa ô đã có điểm → hỏi lý do (override), GV không có quyền sửa thì ô khoá như hôm nay.
3. HV chưa có lịch MT2 (kể cả lượt PR-LM tuần NULL): hàng mờ "Chưa có lịch MT2 — xếp ở panel Lộ trình"; không có lịch nào tự tạo (đếm attempts trước/sau bằng nhau).
4. Lớp thường đã đổi lịch riêng: bảng Giữa khoá (đã qua) và Cuối khoá theo đúng lịch lớp; HV vào sau Giữa khoá không có hàng ở bảng đó.
5. Trang Test → "Điểm theo lớp": GV chỉ thấy lớp mình dạy, GVCN thấy lớp mình chủ nhiệm, QL thấy lớp chi nhánh; mỗi lớp có số ô trống.
6. "Chỉ ô còn trống" lọc đúng. Đổi lượt khi đang lưu không mất điểm.
7. Bấm thử **375 và 1440, sáng và tối**, với **QL, GV, GVCN** (thêm GVCN lớp thường). 375: một kỹ năng một lúc, ‹ MT ›, không cuộn ngang.
8. `/classes/:id/cham` và trang Nhập điểm cũ không đổi (kiểm cũ xanh).

## Prompt cho session code (dán nguyên khối)
```
Repo pisa-tracking, nhánh pr-dl-diem-theo-lop (tạo từ main SAU khi PR-LM và PR-DH đã merge).
Đọc CLAUDE.md, rồi làm đúng kế hoạch docs/superpowers/plans/2026-10-04-pr-dl-diem-theo-lop.md, task DL-0 → DL-7.
Đầu phiên: /ponytail lite; dùng superpowers:subagent-driven-development. Mỗi task: test-driven-development
(phép kiểm ở server/src/tests/prDl.tests.ts, gọi ở cuối run.ts), verification-before-completion (npm run check).
Giao diện (DL-5, DL-6): /impeccable layout, /impeccable clarify, /impeccable adapt (375). Cuối: /impeccable audit,
/ponytail-review, requesting-code-review, finishing-a-development-branch (mở PR, không merge).
Không thêm đường ghi điểm mới; không tự tạo lịch; giữ scoreEditPath (override cần lý do); kiểm quyền trước khi đọc dữ liệu.
DL-0 lệch Giả định G2 thì dừng và hỏi chủ sản phẩm. DauTrangLop: chỉ thêm một mục MenuDong, rebase nếu PR-SL đã merge.
Mô tả PR: ảnh 375/1440 sáng/tối, vai QL/GV/GVCN, danh sách chú thích ponytail:.
```

## Giả định
- G1: Lượt FT nhận diện bằng `assessment_attempts.attempt_no` (MT lịch sử cũng có số lượt), một HV tối đa một attempt không huỷ mỗi số lượt trong lớp.
- G2: Bài Test lớp thường = `(kind ∈ {progress, final}, attempt_no)`; lịch riêng của lớp nằm ở `attempt_skills.planned_period_id` nên bảng chỉ cần chọn theo attempt, không cần đọc bảng lịch riêng. DL-0 xác minh; sai thì dừng hỏi.
- G3: Quyền đọc dùng `requireXemLuotCham` (như `classScoreSheet`); `regularSheet` hiện dùng `ATTEMPT_VIEW` — giữ nguyên trong `regularSheet`, đường mới kiểm `requireXemLuotCham` trước rồi mới gọi.
- G4: Tab mới hiện theo `testGrade`; vị trí giữa "Lịch Test" và "Kế hoạch Test".
- G5: Mục ⋮ đổi chữ theo loại lớp ("Điểm MT cả lớp" / "Điểm Test cả lớp"); khối cuối trang tương tự.
- G6: "Đủ điểm" = đủ mọi kỹ năng bắt buộc của lượt; ô `-` hợp lệ không tính là trống.
- G7: Lượt mặc định khi mọi lượt đã đủ = lượt gần nhất.
