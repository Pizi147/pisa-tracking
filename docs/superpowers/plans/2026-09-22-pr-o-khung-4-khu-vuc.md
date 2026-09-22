# PR-O · Khung 4 khu vực — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax — tick each one
> in THIS file as you finish it. Tasks marked 🛑 are **gates**: stop, report to the owner, wait for an explicit answer.

| Mục | Chốt |
|---|---|
| Model khuyến nghị | **Sonnet 5 · High** |
| Phương án B | **Fable 5.1 · Medium** |
| Người rà soát | Opus 5 (session planning) — khác model người code |
| Số PR | **Một PR**, nhánh `pr-o-khung-4-khu-vuc`, không draft, **không tự merge** |
| Chạy song song với | **PR-S1** (luật máy chủ). Xem "Ranh giới với PR-S1" dưới đây |

**Goal:** Dựng khung điều hướng 4 khu vực (Tổng quan · Học viên & Lớp · Test · Công việc) theo quyền do máy chủ trả về,
có tab riêng từng khu (URL riêng), thanh dưới 4 nút trên điện thoại, chuyển hướng mọi đường dẫn cũ, và một hàm chung
hiển thị ngày/tuần theo G-6 — **chỉ đổi khung, không làm lại nội dung các trang cũ** (các PR sau làm).

**Architecture:** Mọi luật thuần (khu vực nào hiện, tab nào hiện, tab mặc định, đường dẫn cũ → mới, khu vực của một
đường dẫn, định dạng ngày/tuần) đặt ở `shared/domain/dieuHuong.ts` và `shared/domain/hienThiNgay.ts` để kiểm được bằng
harness máy chủ (web không có bộ kiểm thử). Máy chủ tính bộ cờ quyền `NavQuyen` trong một hàm thuần mới
`server/src/platform/nav.ts` → `navOf(p)`; khối `nav` trong `server/src/routes/index.ts` chỉ còn gọi hàm đó. Giao diện
React chỉ đọc `session.nav` và các hàm thuần; hai trang vỏ mới (`TestPage`, `CongViecPage`) **bọc** các component đang
có (`WorkQueue`, `MockPlanPanel`, `WorkList`, `TasksBoard`, `MeetingBoard`).

**Tech Stack:** TypeScript 5.9 · React 18.3 + react-router-dom 6.28 (có tham số tuỳ chọn `/:tab?`) · Vite 5 ·
Tailwind 3.4 (lớp tuỳ ý phải là **chuỗi tĩnh**) · Express 4 · harness tự viết `server/src/tests/run.ts`
(`check`/`assert`, **không phải** Jest).

**Spec:** `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` (§1, §2, §3.1, §3.4 đoạn đầu, §3.5
dòng "Tab", §4, §7 dòng O) · việc có mã: `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md` §1.1 (O1–O7,
O2b), §1.4 R1, §5 (ma trận file) · mockup: `thiet-ke/mockup/01-dieu-huong.html` (**phương án A**),
`thiet-ke/mockup/12-ban-do-vi-tri.html` · chữ: `thiet-ke/THUAT_NGU_DA_CHOT.md` (dòng g1-002…g1-034).

**Số dòng trong plan này** đo trên nhánh `plan-lam-het-truoc-deploy` @ `d7a061c` (22/09/2026). Trước khi sửa, mở file
xem lại — lệch vài dòng là bình thường; lệch nội dung thì 🛑 hỏi.

---

## Global Constraints

### Luật giao diện chung (spec §1 — chép gần nguyên văn; áp mọi task)

| Mã | Luật |
|---|---|
| G-1 | Dấu tích ✓ nhỏ, mảnh, cùng màu chữ phụ. Không dùng icon tích to hay có nền. |
| G-2 | Cột và hàng thẳng: số dùng `tabular-nums`; cột số canh phải hoặc giữa, cố định độ rộng (`table-layout: fixed` / `colgroup`); các hàng cùng bảng cao bằng nhau. |
| G-3 | Không dồn chữ: tối đa **một** dòng phụ dưới dòng chính, dòng phụ ≤ ~60 ký tự. Thông tin thêm đưa vào ⓘ hoặc panel. |
| G-4 | ⚠ chỉ nghĩa là **quá hạn**. Các trạng thái khác dùng badge chữ. |
| G-5 | Bỏ mọi khối chữ giải thích cho dev (`SectionNote` giải thích mô hình). Luật cần thiết đưa vào popover ⓘ cạnh tiêu đề. |
| G-6 | Ngày không bao giờ hiện dạng ISO. Ngày: `dd/mm` (cùng năm) hoặc `dd/mm/yyyy`. **Tuần lịch: `W{n} {THÁNG}`** (vd `W3 SEP`, `W1 OCT`, tháng viết tắt tiếng Anh in hoa). **Tuần học trong khoá: `W{n}/{tổng}`** (vd `W8/8`). Không dùng "T5", "tuần 5", "Tuần 36". Dùng một hàm chung (tạo ở PR-O). |
| G-7 | Viết tắt được giữ (GVCN, GVBM, PA, SOS, FT, KV, OVR, L R W1 W2 S) luôn có tooltip bản đầy đủ. Icon ⋮ ⋯ ⓘ ▸ ✓ luôn có tooltip. |
| G-8 | Panel không chồng panel. Mở việc khác từ một panel thì đóng panel cũ rồi mở panel mới. |
| G-9 | Mọi ô dán bằng chứng nhận: Ctrl+V dán ảnh chụp màn hình, kéo thả, chọn tệp, dán liên kết. |
| G-10 | Mọi số trên dashboard bấm được, mở đúng danh sách tạo ra số đó (`<SoLieu>`). Mọi hạn hiển thị qua `<Han>`. |
| G-11 | Mobile (375px): bảng rộng cuộn ngang **trong thẻ**, trang không cuộn ngang. Thanh 4 khu vực chuyển thành thanh dưới 4 nút. |
| G-12 | Mọi module có hơn một lối vào phải có mục trong bảng định vị (§4). Không thêm nút ở chỗ chưa ghi trong §4. |

### Luật chữ (spec §2 — chép gần nguyên văn)

- Nguồn: `thiet-ke/THUAT_NGU_DA_CHOT.md`. PR nào chạm chữ nào thì dùng chữ mới cho chữ đó (cột "Sửa thành"; trống =
  giữ nguyên). PR-S3 quét phần còn lại.
- Dạng "Ngắn · Đầy đủ": chỗ chật dùng dạng ngắn, chỗ rộng hoặc tooltip dùng dạng đầy đủ.
- **"Case"** luôn viết hoa. **HS/học sinh → HV/học viên.** "Biện pháp" → **"Phương án (PA)"**.
- Không mở đầu câu bằng "Hãy".
- Đổi tên: Tiến độ công việc → **Công việc** · Thực trạng → **Hiện trạng** · Báo cáo tuần chi nhánh → **Báo cáo đơn vị**
  · Lịch kiểm tra (FT) → **Lịch Test**.
- **Chữ PR-O dùng (đã tra THUAT_NGU):** khu vực `Tổng quan` (g1-002) · `Học viên & Lớp` (g1-004; nút đáy điện thoại dùng
  dạng ngắn `Học viên`, g1-003) · `Test` · `Công việc` (g1-005/006) · tab `Tổng quan` | `Phân tích` (g1-018) · tab
  `Cần chấm` (g1-026) · `Lịch Test` (g1-027) · `Kế hoạch Test` (g1-028) · `Hỗ trợ học viên` (g1-033) · `Vận hành`
  (g1-034) · `Báo cáo đơn vị` (g1-032) · nút `Xếp lịch hàng loạt…` (g3-097).

### Luật riêng của PR này

- **Không đổi luật nghiệp vụ, không đổi quyền thật.** Máy chủ vẫn chặn API như cũ; PR này chỉ đổi cờ ẩn/hiện
  (`session.nav`) và khung trang. Thấy luật có vẻ sai → ghi `plan.md` mục 12, **không sửa**.
- **Không làm lại nội dung trang cũ.** Tab bọc nguyên component đang có. Nội dung Cần chấm/lưới là PR-Rc1, Kế hoạch
  Test là PR-Rc2, Hỗ trợ học viên/Vận hành/Báo cáo đơn vị là PR-Ra, Tổng quan là PR-Pa, Phân tích là PR-Pb.
- **Hàm G-6 chỉ áp vào màn PR này chạm** (tab Lịch Test mới, dòng phụ ngày ở Tổng quan). Các PR sau dùng dần.
- **Giữ thay đổi ở `App.tsx` và `OverviewPage.tsx` ở mức cấu trúc** — PR-Pa và PR-S3 sửa lại hai file này sau.
- **Chữ bị cấm bởi phép kiểm có sẵn** (quét cả chú thích trong `web/src`, `shared`, `server/src`): `Kế hoạch MT`,
  `Việc của tôi`, `Cả phạm vi quản lý`, `Tiến độ lớp`, `biện pháp`, `BP` (đứng riêng), `Hãy` — xem
  `server/src/tests/run.ts:8698-8708` và `server/src/tests/hoSoHocVien.tests.ts:34-38`. Không viết các chuỗi này
  trong file mới, kể cả chú thích.
- **Không** hiện ngày dạng `2026-09-22` hay mã tuần có năm khi cùng năm, trên màn PR này tạo.
- Lệnh kiểm tra: `npm run check` (= build máy chủ + `npm test` + `npm run typecheck`). **Số phép kiểm không được giảm.**

### Ranh giới với PR-S1 (chạy song song)

- File máy chủ PR-O được sửa: **chỉ** khối `/demo/session` trong `server/src/routes/index.ts` (dòng ~100-155), file mới
  `server/src/platform/nav.ts`, file mới `server/src/tests/khung.tests.ts`, và **2 dòng nối** cuối
  `server/src/tests/run.ts` (ngay trước khối in tổng kết). PR-S1 cũng thêm phép kiểm vào `run.ts` — khi gộp `main`,
  giữ cả hai khối.
- **Không sửa** `server/src/worklist/signals.ts`, `summary.ts`, `mywork.ts`, `branchpulse.ts` (thuộc S1/Pa) dù chúng có
  đường dẫn cũ (`/tien-trinh?periodId=`, `/?tab=tinh-hinh&cn=`, `/tien-do-cong-viec?viec=`) — hàm chuyển hướng ở
  Task 3 lo các đường dẫn đó.
- Ở `shared/domain/` chỉ tạo file mới + thêm 2 dòng `export *` vào `index.ts`. S1 sửa `shared/domain/normal.ts` — không
  đụng.

### File PR-O chạm (so với ma trận kiểm kê §5.2)

Ma trận ghi: `App.tsx`, `routes/index.ts` (khối nav), `OverviewPage.tsx`, `TestPage.tsx`, `CongViecPage.tsx`,
`BranchPulse.tsx:231`, `CaseBoardPage.tsx`, `MgmtTasksPage.tsx`/`MeetingPage.tsx`. Plan này **thêm** (nhỏ, không có PR
nào chạy song song chạm): `StudentsPage.tsx` (export `WorkQueue`, bỏ hai lối vào Test khỏi trang Học viên theo G-12,
đổi tiêu đề), `web/src/ui/Toast.tsx` (đẩy toast lên trên thanh dưới), `web/src/lib/session.tsx` (kiểu `nav`),
`WeeklyRollupPage.tsx` (xoá — hết người dùng), `CODE_MAP.md`.

---

## Bản đồ file

| File | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `shared/domain/hienThiNgay.ts` | Tạo | G-6: `ngay`, `tuanLich`, `tuanKhoa` |
| `shared/domain/dieuHuong.ts` | Tạo | `NavQuyen`, `NAV_RONG`, `KHU_VUC`, `khuVucHienThi`, `khuVucCuaDuong`, tab Test/Công việc/Tổng quan, `tabTestMacDinh`, `duongMoi` |
| `shared/domain/index.ts` | Sửa | thêm 2 dòng `export *` |
| `server/src/platform/nav.ts` | Tạo | `navOf(p): NavQuyen` |
| `server/src/routes/index.ts:129-150` | Sửa | khối `nav` → `navOf(p)`; thêm `banChinh: laBanChinh()` |
| `server/src/tests/khung.tests.ts` | Tạo | phép kiểm PR-O |
| `server/src/tests/run.ts` (cuối file) | Sửa | 2 dòng gọi `runKhungTests` |
| `web/src/lib/session.tsx:24-26` | Sửa | `nav?: NavQuyen`, `banChinh?: boolean` |
| `web/src/modules/congViec/CongViecPage.tsx` | Tạo | vỏ 3 tab Công việc (R1) |
| `web/src/modules/congViec/HoTroHocVienTab.tsx` | Tạo | tab 1: `/my-work` + `WorkList` (như Tổng quan hiện nay) |
| `web/src/modules/test/TestPage.tsx` | Tạo | vỏ 3 tab Test (O2, O2b) |
| `web/src/modules/test/CanChamTab.tsx` | Tạo | bọc `WorkQueue view="my_scores"` |
| `web/src/modules/test/LichTestTab.tsx` | Tạo | danh sách lượt Test của một tuần (đọc `/attempts?periodId=`) |
| `web/src/modules/test/KeHoachTestTab.tsx` | Tạo | nút mở `MockPlanPanel` |
| `web/src/modules/worklist/MgmtTasksPage.tsx:44-73` | Sửa | export `TasksBoard`; xoá vỏ trang cũ |
| `web/src/modules/worklist/MeetingPage.tsx:34-46` | Sửa | xoá vỏ trang cũ `/tien-trinh` |
| `web/src/modules/worklist/WeeklyRollupPage.tsx` | Xoá | `/tong-hop-tuan` chuyển hướng sang Phân tích › Theo tuần |
| `web/src/modules/worklist/OverviewPage.tsx:33-110, 162-175` | Sửa | tab `Tổng quan | Phân tích` theo đường dẫn (O3) |
| `web/src/modules/cases/CaseBoardPage.tsx:54-66, 493-503` | Sửa | xoá `AcademicPage`; nút quay lại của `CaseRoutePage` |
| `web/src/modules/students/StudentsPage.tsx` | Sửa | export `WorkQueue`; bỏ `my_scores`/`no_plan` + nút Kế hoạch Test; tiêu đề `Học viên & Lớp` |
| `web/src/modules/worklist/BranchPulse.tsx:231` | Sửa | O7: `/tong-quan?cn=` → `/?cn=` |
| `web/src/App.tsx` | Sửa | thanh 4 khu vực, thanh dưới, chuyển hướng, route mới, ẩn "Bản demo nội bộ" |
| `web/src/ui/Toast.tsx:21` | Sửa | `bottom-20 md:bottom-4` |
| `CODE_MAP.md:22-35` | Sửa | trỏ đúng file mới |

---

### Task 0: Worktree và mốc xuất phát

**Files:** không sửa file.

- [x] **Step 1:** Dùng superpowers:using-git-worktrees tạo nhánh `pr-o-khung-4-khu-vuc` từ `main` mới nhất
  (`git fetch origin && git worktree add ../pisa-pr-o -b pr-o-khung-4-khu-vuc origin/main`). Mọi lệnh sau chạy trong
  worktree.
- [x] **Step 2:** `npm ci` rồi `npm run check`. Ghi vào "Nhật ký thực thi" cuối file: số phép kiểm đạt (dòng
  `TẤT CẢ N KIỂM TRA ĐỀU ĐẠT`). Đỏ ngay từ đầu → 🛑 dừng, báo chủ sản phẩm.
- [x] **Step 3:** Mở và đọc: spec §1–§4, §7; kiểm kê §1.1, §1.4 R1, §5; hai mockup; file này đến hết.

---

### Task 1: Hàm chung ngày/tuần G-6 (`shared/domain/hienThiNgay.ts`)

**Files:**
- Create: `shared/domain/hienThiNgay.ts`
- Modify: `shared/domain/index.ts` (thêm một dòng)
- Create: `server/src/tests/khung.tests.ts`
- Modify: `server/src/tests/run.ts` (cuối file, trước `console.log(\`\n${'='.repeat(60)}\`)`)

**Interfaces:**
- Consumes: `shortDate(iso, today)` từ `shared/domain/display.ts:31`; `mondayOfDate`, `owningMonthOf`,
  `weekNumberInMonthOf`, `MONTH_CODE` từ `shared/domain/week.ts`.
- Produces:
  - `ngay(d: string | null | undefined, homNay?: string | null): string` — `'22/09'` cùng năm, `'04/01/2027'` khác
    năm hoặc không có `homNay`; không hợp lệ → `'—'`.
  - `tuanLich(d: string | null | undefined, homNay?: string | null): string` — `'W3 SEP'`; thêm năm (`'W1 JAN 2027'`)
    **chỉ** khi năm của tháng sở hữu tuần khác năm của tuần hôm nay; không hợp lệ → `'—'`.
  - `tuanKhoa(n: number, tong: number): string` — `'W8/8'`; số không nguyên hoặc < 1 → `'—'`.
  - `runKhungTests(t: YThucTestKit): Promise<void>` trong `khung.tests.ts` (Task 2–4 thêm phép kiểm vào đây).

- [x] **Step 1: Viết phép kiểm đỏ.** Tạo `server/src/tests/khung.tests.ts`:

```ts
/**
 * PHÉP KIỂM PR-O — khung 4 khu vực + hàm chung ngày/tuần G-6 (spec 2026-09-22-ux-toan-web-truoc-deploy-design §1, §3.1).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runKhungTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-O · Khung 4 khu vực');

  check('PR-O · G-6 ngày: dd/mm cùng năm, dd/mm/yyyy khác năm, không bao giờ ISO', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.ngay('2026-09-22', '2026-09-22'), '22/09', 'Cùng năm');
    eq(d.ngay('2026-09-22T10:00:00Z', '2026-01-01'), '22/09', 'Có giờ vẫn chỉ lấy ngày');
    eq(d.ngay('2027-01-04', '2026-09-22'), '04/01/2027', 'Khác năm phải có năm');
    eq(d.ngay('2026-09-22'), '22/09/2026', 'Không biết hôm nay thì ghi đủ năm');
    eq(d.ngay(null, '2026-09-22'), '—', 'Trống');
    eq(d.ngay('abc', '2026-09-22'), '—', 'Chuỗi lạ');
    for (const s of ['2026-09-22', '2027-01-04', '2026-12-31T23:00:00Z']) {
      assert(!/\d{4}-\d{2}/.test(d.ngay(s, '2026-09-22')), `Lộ ISO: ${d.ngay(s, '2026-09-22')}`);
    }
  });

  check('PR-O · G-6 tuần lịch: "W3 SEP" (tháng chứa thứ Năm), năm chỉ khi khác năm hiện tại', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.tuanLich('2026-09-16', '2026-09-22'), 'W3 SEP', 'Thứ Tư 16/09/2026');
    eq(d.tuanLich('2026-09-14', '2026-09-22'), 'W3 SEP', 'Thứ Hai cùng tuần');
    eq(d.tuanLich('2026-09-28', '2026-09-22'), 'W1 OCT', '28/09 thuộc tháng 10 (thứ Năm 01/10)');
    eq(d.tuanLich('2027-01-01', '2026-09-22'), 'W5 DEC', '01/01/2027 vẫn thuộc W5 DEC 2026 — cùng năm với hôm nay');
    eq(d.tuanLich('2027-01-06', '2026-09-22'), 'W1 JAN 2027', 'Sang năm mới phải ghi năm');
    eq(d.tuanLich('2026-09-16'), 'W3 SEP', 'Không truyền hôm nay thì không ghi năm');
    eq(d.tuanLich(undefined, '2026-09-22'), '—', 'Trống');
    assert(!/Tuần|T\d/.test(d.tuanLich('2026-09-16', '2026-09-22')), 'Không dùng "Tuần 36" hay "T5"');
  });

  check('PR-O · G-6 tuần học trong khoá: "W8/8"', () => {
    assert(d.tuanKhoa(8, 8) === 'W8/8', d.tuanKhoa(8, 8));
    assert(d.tuanKhoa(3, 10) === 'W3/10', d.tuanKhoa(3, 10));
    assert(d.tuanKhoa(0, 8) === '—' && d.tuanKhoa(3, 0) === '—' && d.tuanKhoa(2.5, 8) === '—', 'Số không hợp lệ phải ra "—"');
  });
}
```

  Nối vào cuối `server/src/tests/run.ts`, **ngay sau** khối `runBanChinhTests` và **trước** `console.log(\`\n${'='.repeat(60)}\`);`:

```ts
// ==================================================================== PR-O (khung 4 khu vực + hàm ngày/tuần G-6)

const { runKhungTests } = await import('./khung.tests.ts');
await runKhungTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```

- [x] **Step 2: Chạy, thấy đỏ.** `npm test`
  Expected: FAIL ở bước `tsc` — `Property 'ngay' does not exist` (và `tuanLich`, `tuanKhoa`).

- [x] **Step 3: Cài đặt tối thiểu.** Tạo `shared/domain/hienThiNgay.ts`:

```ts
/**
 * HÀM CHUNG HIỂN THỊ NGÀY VÀ TUẦN — luật G-6 (spec 2026-09-22-ux-toan-web-truoc-deploy-design §1).
 *
 *   ngày          dd/mm khi cùng năm với hôm nay, dd/mm/yyyy khi khác năm. Không bao giờ ISO.
 *   tuần lịch     W{n} {THÁNG} — "W3 SEP". Tuần thuộc tháng chứa ngày thứ Năm (week.ts). Chỉ thêm năm khi năm của tuần
 *                 khác năm hiện tại, để lịch vắt sang năm sau không bị đọc nhầm.
 *   tuần học      W{n}/{tổng} — "W8/8", tuần thứ n của một khoá lớp thường.
 *
 * Màn mới dùng ba hàm này; màn cũ chuyển dần ở các PR sau. Khoá dữ liệu (thứ Hai, mã tuần có năm) vẫn ở week.ts.
 */
import { shortDate } from './display.ts';
import { MONTH_CODE, mondayOfDate, owningMonthOf, weekNumberInMonthOf } from './week.ts';

const hopLe = (s: string | null | undefined): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(Date.parse(`${s.slice(0, 10)}T00:00:00Z`));

export function ngay(d: string | null | undefined, homNay?: string | null): string {
  if (!hopLe(d)) return '—';
  if (hopLe(homNay)) return shortDate(d, homNay);
  const s = d.slice(0, 10);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
}

export function tuanLich(d: string | null | undefined, homNay?: string | null): string {
  if (!hopLe(d)) return '—';
  const start = mondayOfDate(d);
  const { year, month } = owningMonthOf(start);
  const ma = `W${weekNumberInMonthOf(start)} ${MONTH_CODE[month - 1]}`;
  if (!hopLe(homNay)) return ma;
  return owningMonthOf(mondayOfDate(homNay)).year === year ? ma : `${ma} ${year}`;
}

export function tuanKhoa(n: number, tong: number): string {
  if (!Number.isInteger(n) || !Number.isInteger(tong) || n < 1 || tong < 1) return '—';
  return `W${n}/${tong}`;
}
```

  Thêm vào `shared/domain/index.ts` sau dòng `export * from './hoSoHocVien.ts';`:

```ts
export * from './hienThiNgay.ts';
```

- [x] **Step 4: Chạy, thấy xanh.** `npm test` → Expected: ba phép kiểm `PR-O · G-6 …` có ✓; dòng cuối
  `TẤT CẢ N+3 KIỂM TRA ĐỀU ĐẠT`.
- [x] **Step 5:** `npm run check` xanh. Ghi số phép kiểm vào Nhật ký.
- [x] **Step 6: Commit.**

```bash
git add shared/domain/hienThiNgay.ts shared/domain/index.ts server/src/tests/khung.tests.ts server/src/tests/run.ts
git commit -m "PR-O (1): hàm chung ngày/tuần G-6 (ngay, tuanLich, tuanKhoa) + phép kiểm"
```

---

### Task 2: Mô hình điều hướng thuần (`shared/domain/dieuHuong.ts`)

**Files:**
- Create: `shared/domain/dieuHuong.ts`
- Modify: `shared/domain/index.ts` (thêm một dòng)
- Test: `server/src/tests/khung.tests.ts`

**Interfaces:**
- Produces (Task 3–8 dùng đúng tên này):

```ts
export type KhuVuc = 'tong-quan' | 'hoc-vien' | 'test' | 'cong-viec';
export type TabTest = 'can-cham' | 'lich' | 'ke-hoach';
export type TabCongViec = 'ho-tro' | 'van-hanh' | 'bao-cao';
export type TabTongQuan = 'tong-quan' | 'phan-tich';
export type NavQuyen = {
  overview: boolean; students: boolean; admin: boolean;
  analysis: boolean;
  test: boolean; testGrade: boolean; testSchedule: boolean; testPlan: boolean;
  work: boolean; workSupport: boolean; workOps: boolean; workReports: boolean;
  /** Cờ cũ — giữ để mã chưa chuyển vẫn chạy; PR sau bỏ dần. */
  mocks: boolean; meeting: boolean; academic: boolean; mgmtTasks: boolean;
};
export const NAV_RONG: NavQuyen;
export type KhuVucMuc = { key: KhuVuc; to: string; label: string; labelNgan: string };
export const KHU_VUC: readonly KhuVucMuc[];
export function khuVucHienThi(nav: NavQuyen): KhuVucMuc[];
export function khuVucCuaDuong(pathname: string): KhuVuc | null;
export const TAB_TEST_LABEL: Record<TabTest, string>;
export const DUONG_TAB_TEST: Record<TabTest, string>;
export function tabTestHienThi(nav: NavQuyen): TabTest[];
export function tabTestTuDuong(seg: string | undefined): TabTest | null;
export function tabTestMacDinh(nav: NavQuyen): TabTest | null;
export const TAB_CONG_VIEC_LABEL: Record<TabCongViec, string>;
export const DUONG_TAB_CONG_VIEC: Record<TabCongViec, string>;
export function tabCongViecHienThi(nav: NavQuyen): TabCongViec[];
export function tabCongViecTuDuong(seg: string | undefined): TabCongViec | null;
export const TAB_TONG_QUAN_LABEL: Record<TabTongQuan, string>;
```

- [x] **Step 1: Viết phép kiểm đỏ.** Thêm vào cuối thân `runKhungTests` (sau ba phép kiểm G-6):

```ts
  const nav = (over: Partial<import('../../../shared/domain/index.ts').NavQuyen>) => ({ ...d.NAV_RONG, ...over });
  const QL = nav({ overview: true, students: true, analysis: true, test: true, testGrade: true, testSchedule: true,
    testPlan: true, work: true, workSupport: true, workOps: true, workReports: true });
  const GV = nav({ overview: true, students: true, test: true, testGrade: true, testSchedule: true, work: true, workSupport: true });

  check('PR-O · O1/O6 Bốn khu vực đúng thứ tự, khu không có quyền thì bỏ hẳn', () => {
    const keys = (n: any) => d.khuVucHienThi(n).map((k) => k.key).join(',');
    assert(keys(QL) === 'tong-quan,hoc-vien,test,cong-viec', `QL: ${keys(QL)}`);
    assert(keys(GV) === 'tong-quan,hoc-vien,test,cong-viec', `GV thấy cả Test và Công việc (spec §3.1): ${keys(GV)}`);
    assert(keys(nav({ overview: true, students: true })) === 'tong-quan,hoc-vien', 'Không có Test/Công việc thì không hiện');
    const labels = d.KHU_VUC.map((k) => `${k.label}|${k.labelNgan}`).join(',');
    assert(labels === 'Tổng quan|Tổng quan,Học viên & Lớp|Học viên,Test|Test,Công việc|Công việc', `Chữ: ${labels}`);
  });

  check('PR-O · Khu vực của một đường dẫn (tô sáng đúng mục trên thanh)', () => {
    const cases: Array<[string, string | null]> = [
      ['/', 'tong-quan'], ['/phan-tich', 'tong-quan'], ['/hoc-thuat/case/3', 'tong-quan'],
      ['/hoc-vien', 'hoc-vien'], ['/hoc-vien/12', 'hoc-vien'], ['/hoc-vien/lop/3', 'hoc-vien'],
      ['/test', 'test'], ['/test/lich', 'test'], ['/nhap-diem/4', 'test'], ['/bang-diem-thuong/4', 'test'], ['/mock-test/9', 'test'],
      ['/cong-viec', 'cong-viec'], ['/cong-viec/bao-cao', 'cong-viec'],
      ['/quan-tri', null], ['/ho-so-ca-nhan', null], ['/hoc-vienx', null], ['/testing', null],
    ];
    for (const [p, want] of cases) assert(d.khuVucCuaDuong(p) === want, `${p} → ${d.khuVucCuaDuong(p)}, cần ${want}`);
  });

  check('PR-O · O2/O2b Tab Test theo quyền: GV chỉ Cần chấm + Lịch Test, mặc định Cần chấm; QL mặc định Lịch Test', () => {
    assert(d.tabTestHienThi(QL).join(',') === 'can-cham,lich,ke-hoach', `QL: ${d.tabTestHienThi(QL)}`);
    assert(d.tabTestHienThi(GV).join(',') === 'can-cham,lich', `GV: ${d.tabTestHienThi(GV)}`);
    assert(d.tabTestMacDinh(GV) === 'can-cham', `GV mặc định: ${d.tabTestMacDinh(GV)}`);
    assert(d.tabTestMacDinh(QL) === 'lich', `QL mặc định: ${d.tabTestMacDinh(QL)}`);
    assert(d.tabTestMacDinh(d.NAV_RONG) === null, 'Không có tab nào thì không có mặc định');
    assert(d.tabTestTuDuong('ke-hoach') === 'ke-hoach' && d.tabTestTuDuong(undefined) === null && d.tabTestTuDuong('x') === null, 'Đọc tab từ đường dẫn');
    assert(Object.values(d.TAB_TEST_LABEL).join(',') === 'Cần chấm,Lịch Test,Kế hoạch Test', 'Chữ tab Test');
    assert(d.DUONG_TAB_TEST.lich === '/test/lich', 'Đường dẫn tab Test');
  });

  check('PR-O · R1 Tab Công việc theo quyền: GV chỉ Hỗ trợ học viên', () => {
    assert(d.tabCongViecHienThi(QL).join(',') === 'ho-tro,van-hanh,bao-cao', `QL: ${d.tabCongViecHienThi(QL)}`);
    assert(d.tabCongViecHienThi(GV).join(',') === 'ho-tro', `GV: ${d.tabCongViecHienThi(GV)}`);
    assert(d.tabCongViecTuDuong(undefined) === 'ho-tro' && d.tabCongViecTuDuong('bao-cao') === 'bao-cao'
      && d.tabCongViecTuDuong('x') === null, 'Đọc tab từ đường dẫn (không có đoạn = tab 1)');
    assert(Object.values(d.TAB_CONG_VIEC_LABEL).join(',') === 'Hỗ trợ học viên,Vận hành,Báo cáo đơn vị', 'Chữ tab Công việc');
    assert(d.DUONG_TAB_CONG_VIEC['ho-tro'] === '/cong-viec' && d.DUONG_TAB_CONG_VIEC['van-hanh'] === '/cong-viec/van-hanh', 'Đường dẫn tab');
    assert(Object.values(d.TAB_TONG_QUAN_LABEL).join(',') === 'Tổng quan,Phân tích', 'Chữ tab Tổng quan (O3)');
  });
```

- [x] **Step 2: Chạy, thấy đỏ.** `npm test` → Expected: FAIL ở `tsc` — `Property 'NAV_RONG' does not exist`.

- [x] **Step 3: Cài đặt.** Tạo `shared/domain/dieuHuong.ts` (phần chuyển hướng `duongMoi` thêm ở Task 3):

```ts
/**
 * KHUNG 4 KHU VỰC (spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.1, mockup 01 phương án A).
 *
 * Máy chủ trả bộ cờ `NavQuyen` (server/src/platform/nav.ts); giao diện chỉ đọc cờ + các hàm ở đây. Khu vực hay tab không
 * có quyền thì bỏ hẳn, không hiện ô khoá. Quyền thật vẫn do API chặn.
 */
export type KhuVuc = 'tong-quan' | 'hoc-vien' | 'test' | 'cong-viec';
export type TabTest = 'can-cham' | 'lich' | 'ke-hoach';
export type TabCongViec = 'ho-tro' | 'van-hanh' | 'bao-cao';
export type TabTongQuan = 'tong-quan' | 'phan-tich';

export type NavQuyen = {
  overview: boolean; students: boolean; admin: boolean;
  /** Tab Phân tích của Tổng quan. */
  analysis: boolean;
  test: boolean; testGrade: boolean; testSchedule: boolean; testPlan: boolean;
  work: boolean; workSupport: boolean; workOps: boolean; workReports: boolean;
  /** Cờ cũ — giữ để mã chưa chuyển vẫn chạy; PR sau bỏ dần. */
  mocks: boolean; meeting: boolean; academic: boolean; mgmtTasks: boolean;
};

export const NAV_RONG: NavQuyen = {
  overview: true, students: false, admin: false, analysis: false,
  test: false, testGrade: false, testSchedule: false, testPlan: false,
  work: false, workSupport: false, workOps: false, workReports: false,
  mocks: false, meeting: false, academic: false, mgmtTasks: false,
};

export type KhuVucMuc = { key: KhuVuc; to: string; label: string; labelNgan: string };

export const KHU_VUC: readonly KhuVucMuc[] = [
  { key: 'tong-quan', to: '/', label: 'Tổng quan', labelNgan: 'Tổng quan' },
  { key: 'hoc-vien', to: '/hoc-vien', label: 'Học viên & Lớp', labelNgan: 'Học viên' },
  { key: 'test', to: '/test', label: 'Test', labelNgan: 'Test' },
  { key: 'cong-viec', to: '/cong-viec', label: 'Công việc', labelNgan: 'Công việc' },
];

const HIEN: Record<KhuVuc, (n: NavQuyen) => boolean> = {
  'tong-quan': (n) => n.overview,
  'hoc-vien': (n) => n.students,
  test: (n) => n.test,
  'cong-viec': (n) => n.work,
};

export function khuVucHienThi(nav: NavQuyen): KhuVucMuc[] {
  return KHU_VUC.filter((k) => HIEN[k.key](nav));
}

const thuoc = (p: string, goc: string) => p === goc || p.startsWith(`${goc}/`);

/** Khu vực chứa đường dẫn này — để tô sáng đúng mục. Trang ngoài 4 khu (Quản trị, Hồ sơ cá nhân) → null. */
export function khuVucCuaDuong(pathname: string): KhuVuc | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (p === '/' || thuoc(p, '/phan-tich') || thuoc(p, '/hoc-thuat')) return 'tong-quan';
  if (thuoc(p, '/hoc-vien')) return 'hoc-vien';
  if (['/test', '/nhap-diem', '/bang-diem-thuong', '/mock-test'].some((g) => thuoc(p, g))) return 'test';
  if (thuoc(p, '/cong-viec')) return 'cong-viec';
  return null;
}

// ---------------------------------------------------------------- Test

const TAB_TEST: readonly TabTest[] = ['can-cham', 'lich', 'ke-hoach'];
export const TAB_TEST_LABEL: Record<TabTest, string> = { 'can-cham': 'Cần chấm', lich: 'Lịch Test', 'ke-hoach': 'Kế hoạch Test' };
export const DUONG_TAB_TEST: Record<TabTest, string> = { 'can-cham': '/test/can-cham', lich: '/test/lich', 'ke-hoach': '/test/ke-hoach' };
const HIEN_TEST: Record<TabTest, (n: NavQuyen) => boolean> = {
  'can-cham': (n) => n.testGrade, lich: (n) => n.testSchedule, 'ke-hoach': (n) => n.testPlan,
};

export function tabTestHienThi(nav: NavQuyen): TabTest[] {
  return nav.test ? TAB_TEST.filter((k) => HIEN_TEST[k](nav)) : [];
}
export function tabTestTuDuong(seg: string | undefined): TabTest | null {
  return (TAB_TEST as readonly string[]).includes(seg ?? '') ? (seg as TabTest) : null;
}
/**
 * O2b: người xếp lịch (Quản lý, Quản trị) mở vào Lịch Test; giáo viên mở vào Cần chấm.
 * Tab mặc định luôn là một tab người đó thấy được.
 */
export function tabTestMacDinh(nav: NavQuyen): TabTest | null {
  const tabs = tabTestHienThi(nav);
  const muon: TabTest = nav.testPlan ? 'lich' : 'can-cham';
  return tabs.includes(muon) ? muon : tabs[0] ?? null;
}

// ---------------------------------------------------------------- Công việc

const TAB_CONG_VIEC: readonly TabCongViec[] = ['ho-tro', 'van-hanh', 'bao-cao'];
export const TAB_CONG_VIEC_LABEL: Record<TabCongViec, string> = {
  'ho-tro': 'Hỗ trợ học viên', 'van-hanh': 'Vận hành', 'bao-cao': 'Báo cáo đơn vị',
};
export const DUONG_TAB_CONG_VIEC: Record<TabCongViec, string> = {
  'ho-tro': '/cong-viec', 'van-hanh': '/cong-viec/van-hanh', 'bao-cao': '/cong-viec/bao-cao',
};
const HIEN_CONG_VIEC: Record<TabCongViec, (n: NavQuyen) => boolean> = {
  'ho-tro': (n) => n.workSupport, 'van-hanh': (n) => n.workOps, 'bao-cao': (n) => n.workReports,
};

export function tabCongViecHienThi(nav: NavQuyen): TabCongViec[] {
  return nav.work ? TAB_CONG_VIEC.filter((k) => HIEN_CONG_VIEC[k](nav)) : [];
}
/** Không có đoạn sau `/cong-viec` = tab 1. Đoạn lạ → null (trang tự chuyển về tab đầu). */
export function tabCongViecTuDuong(seg: string | undefined): TabCongViec | null {
  if (!seg) return 'ho-tro';
  return seg === 'van-hanh' || seg === 'bao-cao' ? seg : null;
}

// ---------------------------------------------------------------- Tổng quan

export const TAB_TONG_QUAN_LABEL: Record<TabTongQuan, string> = { 'tong-quan': 'Tổng quan', 'phan-tich': 'Phân tích' };
```

  Thêm vào `shared/domain/index.ts` sau dòng `export * from './hienThiNgay.ts';`:

```ts
export * from './dieuHuong.ts';
```

- [x] **Step 4: Chạy, thấy xanh.** `npm test` → Expected: 4 phép kiểm mới ✓, `TẤT CẢ … ĐỀU ĐẠT`.
- [x] **Step 5:** `npm run check` xanh (typecheck web cũng phải qua — file shared được cả hai tsconfig biên dịch).
- [x] **Step 6: Commit.**

```bash
git add shared/domain/dieuHuong.ts shared/domain/index.ts server/src/tests/khung.tests.ts
git commit -m "PR-O (2): mô hình điều hướng 4 khu vực + tab theo quyền (thuần, có phép kiểm)"
```

---

### Task 3: Bảng chuyển hướng đường dẫn cũ (`duongMoi`) — O5, O7

**Files:**
- Modify: `shared/domain/dieuHuong.ts` (thêm cuối file)
- Test: `server/src/tests/khung.tests.ts`

**Interfaces:**
- Produces: `duongMoi(pathname: string, search: string): string | null` — trả đường dẫn mới (kèm `?…` nếu còn tham
  số) hoặc `null` nếu đường dẫn đang dùng được. `search` có hoặc không có dấu `?` đầu đều được.

Bảng luật (chốt trong plan này):

| Đường dẫn cũ | Đích | Tham số |
|---|---|---|
| `/tong-quan` (O7) | `/` | giữ nguyên |
| `/` có `tab=tinh-hinh` | `/phan-tich` | bỏ `tab`, giữ phần còn lại (link do `summary.ts:268` sinh) |
| `/` có `tab` khác | `/` | bỏ `tab` |
| `/hoc-thuat` (đúng đường này) | `/phan-tich` | giữ nguyên (`goc`, `cn`, `xem`…). **`/hoc-thuat/case/:id` giữ** — máy chủ sinh link này |
| `/tong-hop-tuan` | `/phan-tich` | `xem=tuan`; `branchId` → `cn` |
| `/tien-trinh`, `/hop-tuan` | `/cong-viec/bao-cao` | giữ nguyên (`periodId`) |
| `/tien-do-cong-viec` | `tab=don-vi` → `/cong-viec/bao-cao`, còn lại → `/cong-viec/van-hanh` | bỏ `tab`; `viec` → `open` (link `mywork.ts:898` gửi `viec` mà `TasksBoard` chỉ đọc `open`) |
| `/hoc-vien` có `view=my_scores` | `/test/can-cham` | bỏ `view`, giữ `classId`, `branchId`, `scope`, `q` |
| `/hoc-vien` có `view=no_plan` | `/test/ke-hoach` | bỏ `view`, giữ phần còn lại |
| `/mock-test` (đúng đường này) | `/hoc-vien` | bỏ hết |
| `/mock-test/lop/:id` | `/nhap-diem/:id` | giữ nguyên |

- [x] **Step 1: Viết phép kiểm đỏ.** Thêm vào cuối `runKhungTests`:

```ts
  check('PR-O · O5/O7 Mọi đường dẫn cũ về đúng chỗ, giữ bộ lọc, không vòng lặp', () => {
    const cases: Array<[string, string, string | null]> = [
      ['/tong-quan', '?cn=4', '/?cn=4'],
      ['/', '?tab=tinh-hinh&cn=2&hang-doi=no_plan', '/phan-tich?cn=2&hang-doi=no_plan'],
      ['/', '?tab=bao-cao', '/'],
      ['/', '?cn=2', null], ['/', '', null],
      ['/hoc-thuat', '', '/phan-tich'], ['/hoc-thuat/', '?goc=y-thuc&cn=2', '/phan-tich?goc=y-thuc&cn=2'],
      ['/hoc-thuat/case/5', '', null],
      ['/tong-hop-tuan', '?branchId=3', '/phan-tich?xem=tuan&cn=3'], ['/tong-hop-tuan', '', '/phan-tich?xem=tuan'],
      ['/tien-trinh', '?periodId=9', '/cong-viec/bao-cao?periodId=9'], ['/hop-tuan', '', '/cong-viec/bao-cao'],
      ['/tien-do-cong-viec', '', '/cong-viec/van-hanh'],
      ['/tien-do-cong-viec', '?viec=12', '/cong-viec/van-hanh?open=12'],
      ['/tien-do-cong-viec', '?open=7&tao=1&nhom=tutor', '/cong-viec/van-hanh?open=7&tao=1&nhom=tutor'],
      ['/tien-do-cong-viec', '?tab=don-vi&cn=2', '/cong-viec/bao-cao?cn=2'],
      ['/hoc-vien', '?view=my_scores&classId=7&scope=mine', '/test/can-cham?classId=7&scope=mine'],
      ['/hoc-vien', 'view=no_plan', '/test/ke-hoach'],
      ['/hoc-vien', '?view=sos', null], ['/hoc-vien', '', null], ['/hoc-vien/12', '?view=my_scores', null],
      ['/mock-test', '?x=1', '/hoc-vien'], ['/mock-test/lop/12', '?a=1', '/nhap-diem/12?a=1'], ['/mock-test/33', '', null],
      ['/test', '', null], ['/cong-viec/bao-cao', '?periodId=9', null], ['/phan-tich', '?xem=tuan', null],
    ];
    for (const [p, s, want] of cases) {
      const got = d.duongMoi(p, s);
      assert(got === want, `${p}${s} → ${got}, cần ${want}`);
      if (got) {
        const [gp, gs = ''] = got.split('?');
        assert(d.duongMoi(gp, gs) === null, `Vòng lặp: ${got} lại bị chuyển tiếp`);
        assert(d.khuVucCuaDuong(gp) !== null, `Đích ${gp} không thuộc khu vực nào`);
      }
    }
  });
```

- [x] **Step 2: Chạy, thấy đỏ.** `npm test` → Expected: FAIL ở `tsc` — `Property 'duongMoi' does not exist`.

- [x] **Step 3: Cài đặt.** Thêm vào cuối `shared/domain/dieuHuong.ts`:

```ts
// ---------------------------------------------------------------- Đường dẫn cũ

const voiThamSo = (path: string, q: URLSearchParams) => {
  const s = q.toString();
  return s ? `${path}?${s}` : path;
};

/**
 * ĐƯỜNG DẪN CŨ → MỚI (O5, O7). Link đã lưu, link trong thông báo và link máy chủ sinh ra vẫn mở đúng chỗ.
 * Trả null khi đường dẫn đang dùng được. Mọi đích trả về đều không bị chuyển tiếp lần nữa (phép kiểm PR-O khẳng định).
 */
export function duongMoi(pathname: string, search: string): string | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  if (p === '/tong-quan') return voiThamSo('/', q);
  if (p === '/' && q.has('tab')) {
    const tab = q.get('tab');
    q.delete('tab');
    return voiThamSo(tab === 'tinh-hinh' ? '/phan-tich' : '/', q);
  }
  if (p === '/hoc-thuat') return voiThamSo('/phan-tich', q);
  if (p === '/tong-hop-tuan') {
    const cn = q.get('branchId');
    const moi = new URLSearchParams({ xem: 'tuan' });
    if (cn) moi.set('cn', cn);
    return voiThamSo('/phan-tich', moi);
  }
  if (p === '/tien-trinh' || p === '/hop-tuan') return voiThamSo('/cong-viec/bao-cao', q);
  if (p === '/tien-do-cong-viec') {
    const donVi = q.get('tab') === 'don-vi';
    q.delete('tab');
    const viec = q.get('viec');
    if (viec) { q.delete('viec'); if (!q.has('open')) q.set('open', viec); }
    return voiThamSo(donVi ? '/cong-viec/bao-cao' : '/cong-viec/van-hanh', q);
  }
  if (p === '/hoc-vien') {
    const view = q.get('view');
    if (view === 'my_scores' || view === 'no_plan') {
      q.delete('view');
      return voiThamSo(view === 'my_scores' ? DUONG_TAB_TEST['can-cham'] : DUONG_TAB_TEST['ke-hoach'], q);
    }
    return null;
  }
  if (p === '/mock-test') return '/hoc-vien';
  const lop = /^\/mock-test\/lop\/([^/]+)$/.exec(p);
  if (lop) return voiThamSo(`/nhap-diem/${lop[1]}`, q);
  return null;
}
```

  Lưu ý thứ tự trong phép kiểm: `'/tien-do-cong-viec?open=7&tao=1&nhom=tutor'` phải giữ đúng thứ tự tham số —
  `URLSearchParams` giữ thứ tự chèn, nên không sắp xếp lại.

- [x] **Step 4: Chạy, thấy xanh.** `npm test` → Expected: `PR-O · O5/O7 …` ✓.
- [x] **Step 5:** `npm run check` xanh.
- [x] **Step 6: Commit.**

```bash
git add shared/domain/dieuHuong.ts server/src/tests/khung.tests.ts
git commit -m "PR-O (3): bảng chuyển hướng đường dẫn cũ (hoc-thuat, tien-trinh, tien-do-cong-viec, tong-hop-tuan, tong-quan?cn=)"
```

---

### Task 4: Máy chủ tính cờ quyền `navOf(p)` + cờ bản chính (O6)

**Files:**
- Create: `server/src/platform/nav.ts`
- Modify: `server/src/routes/index.ts:129-150` (khối `landing`/`nav` trong `api.get('/demo/session')`)
- Modify: `web/src/lib/session.tsx:24-26`
- Test: `server/src/tests/khung.tests.ts`

**Interfaces:**
- Consumes: `NavQuyen` (Task 2); `scopeFor`, `can`, `Principal` từ `server/src/permissions.ts`; `canSeeBoard` từ
  `server/src/worklist/mgmttasks.ts:42`; `laBanChinh` từ `server/src/moiTruong.ts:18`.
- Produces: `navOf(p: Principal): NavQuyen`; phản hồi `GET /demo/session` có thêm `banChinh: boolean`; kiểu web
  `Session.nav?: NavQuyen`, `Session.banChinh?: boolean`.

Luật cờ (không thêm quyền mới, chỉ đọc quyền có sẵn ở `server/src/seed/data.ts:44-80`):

| Cờ | Điều kiện | Quản trị | QL chi nhánh | GV (GVCN/GVBM) |
|---|---|---|---|---|
| `students` | `student.view` có phạm vi | ✓ | ✓ | ✓ |
| `analysis` (= `academic`, `meeting`) | `meeting.view` có phạm vi | ✓ | ✓ | ✗ |
| `test`, `testGrade`, `testSchedule` (= `mocks`) | `attempt.view` có phạm vi | ✓ | ✓ | ✓ |
| `testPlan` | `plan.week` có phạm vi | ✓ | ✓ | ✗ |
| `workSupport` | `attempt.view` có phạm vi (cùng điều kiện `/my-work`, `mywork.ts:248`) | ✓ | ✓ | ✓ |
| `workOps` (= `mgmtTasks`) | `canSeeBoard(p)` | ✓ | ✓ | ✗ |
| `workReports` | `meeting.view` có phạm vi | ✓ | ✓ | ✗ |
| `work` | `workSupport ∨ workOps ∨ workReports` | ✓ | ✓ | ✓ |
| `admin` | `admin.config` | ✓ | ✗ | ✗ |

- [x] **Step 1: Viết phép kiểm đỏ.** Thêm vào cuối `runKhungTests`:

```ts
  const { navOf } = await import('../platform/nav.ts');
  const tabs = (n: any) => `${d.khuVucHienThi(n).map((k) => k.key)}|${d.tabTestHienThi(n)}|${d.tabCongViecHienThi(n)}|${n.analysis}|${n.admin}`;

  check('PR-O · O6 Quản trị và QL chi nhánh: đủ 4 khu, đủ tab, có Phân tích', () => {
    for (const [ten, p] of [['Quản trị', t.P.admin], ['QL MB', t.P.mbManager]] as const) {
      const n = navOf(p);
      assert(d.khuVucHienThi(n).length === 4, `${ten}: ${tabs(n)}`);
      assert(d.tabTestHienThi(n).join(',') === 'can-cham,lich,ke-hoach', `${ten} tab Test: ${tabs(n)}`);
      assert(d.tabCongViecHienThi(n).join(',') === 'ho-tro,van-hanh,bao-cao', `${ten} tab Công việc: ${tabs(n)}`);
      assert(n.analysis && n.academic, `${ten} phải thấy Phân tích`);
    }
    assert(navOf(t.P.admin).admin && !navOf(t.P.mbManager).admin, 'Chỉ Quản trị thấy màn Quản trị');
  });

  check('PR-O · O6/R1 GV (GVCN, GVBM): 4 khu; Test chỉ Cần chấm + Lịch Test; Công việc chỉ Hỗ trợ học viên; không Phân tích', () => {
    for (const [ten, p] of [['GVCN', t.P.coreTeacher], ['GVBM', t.P.subjectTeacher], ['GVCN lớp thường', t.P.normalCoreTeacher]] as const) {
      const n = navOf(p);
      assert(tabs(n) === 'tong-quan,hoc-vien,test,cong-viec|can-cham,lich|ho-tro|false|false', `${ten}: ${tabs(n)}`);
      assert(d.tabTestMacDinh(n) === 'can-cham', `${ten} mở Test vào ${d.tabTestMacDinh(n)}`);
      assert(!n.mgmtTasks && !n.meeting, `${ten} không được thấy Vận hành / Báo cáo đơn vị`);
    }
  });

  check('PR-O · O6 Cờ cũ giữ đúng nghĩa (mã chưa chuyển vẫn chạy)', () => {
    const n = navOf(t.P.mbManager);
    assert(n.mocks === n.test && n.academic === n.analysis && n.meeting === n.workReports && n.mgmtTasks === n.workOps,
      `Cờ cũ lệch cờ mới: ${JSON.stringify(n)}`);
  });
```

- [x] **Step 2: Chạy, thấy đỏ.** `npm test` → Expected: FAIL ở `tsc` — `Cannot find module '../platform/nav.ts'`.

- [x] **Step 3: Cài đặt `server/src/platform/nav.ts`.**

```ts
/**
 * CỜ ĐIỀU HƯỚNG THEO QUYỀN (O6, spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.1).
 *
 * Chỉ đọc quyền đã cấu hình — không cấp thêm quyền nào. Khu vực/tab nào cờ false thì giao diện bỏ hẳn; API vẫn tự chặn.
 * Một hàm thuần để phép kiểm gọi thẳng được (server/src/tests/khung.tests.ts).
 */
import { PERMISSIONS, type NavQuyen } from '../../../shared/domain/index.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { canSeeBoard } from '../worklist/mgmttasks.ts';

export function navOf(p: Principal): NavQuyen {
  const coPhamVi = (perm: string) => !scopeFor(p, perm).none;
  const attempt = coPhamVi(PERMISSIONS.ATTEMPT_VIEW);
  const meeting = coPhamVi(PERMISSIONS.MEETING_VIEW);
  const plan = coPhamVi(PERMISSIONS.PLAN_WEEK);
  const board = canSeeBoard(p);
  return {
    overview: true,
    students: coPhamVi(PERMISSIONS.STUDENT_VIEW),
    admin: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
    analysis: meeting,
    test: attempt, testGrade: attempt, testSchedule: attempt, testPlan: plan,
    work: attempt || board || meeting,
    workSupport: attempt, workOps: board, workReports: meeting,
    mocks: attempt, meeting, academic: meeting, mgmtTasks: board,
  };
}
```

  Kiểm `PERMISSIONS.STUDENT_VIEW` và `PERMISSIONS.ADMIN_CONFIG` có tên đúng trong `shared/domain/people.ts:38+`
  (route cũ đang dùng hai tên này ở dòng 135, 149 nên chắc chắn có).

- [x] **Step 4: Sửa route.** Trong `server/src/routes/index.ts`, thay đoạn từ `    // Hai mục điều hướng + các lối phụ trong
  menu tài khoản. Ẩn/hiện theo quyền.` (dòng ~130) đến hết object `nav: { … },` (dòng ~150) bằng:

```ts
    // Bốn khu vực + tab con, ẩn/hiện theo quyền (PR-O, server/src/platform/nav.ts).
    nav: navOf(p),
    /* Giao diện ẩn nhãn "Bản demo nội bộ" trên bản chính — cùng cờ máy chủ dùng để khoá các đường của bản demo. */
    banChinh: laBanChinh(),
```

  Thêm import gần các import `../platform/*` (sau dòng 14 `import { writeAudit } …`):

```ts
import { navOf } from '../platform/nav.ts';
```

  Giữ nguyên `landing: '/'` và các chú thích phía trên. Không sửa gì khác trong file.

- [x] **Step 5: Sửa kiểu web** `web/src/lib/session.tsx`: thêm import
  `import type { NavQuyen } from '@shared/domain/index.ts';` và thay dòng 25-26 bằng:

```ts
  /** Bốn khu vực + tab con, do API quyết định theo quyền đã cấu hình (server/src/platform/nav.ts). */
  nav?: NavQuyen;
  /** Máy chủ đang chạy bản chính (`laBanChinh()`): ẩn nhãn "Bản demo nội bộ". */
  banChinh?: boolean;
```

  `web/src/App.tsx:86` đang dựng object `nav` dự phòng 7 khoá — sẽ lỗi kiểu. Sửa **tối thiểu** ở task này:
  `const nav = session.nav ?? NAV_RONG;` và thêm `NAV_RONG` vào import từ `@shared/domain/index.ts` (App.tsx chưa có
  import này — thêm dòng `import { NAV_RONG } from '@shared/domain/index.ts';`). Phần còn lại của App làm ở Task 8.

- [x] **Step 6: Chạy, thấy xanh.** `npm run check` → Expected: 3 phép kiểm `PR-O · O6 …` ✓, typecheck web qua.
  Nếu phép kiểm GV đỏ vì `scopeFor(p, 'plan.week')` không `none` → 🛑 báo (nghĩa là seed cấp `plan.week` cho GV —
  trái `data.ts`, không sửa phép kiểm cho xanh).
- [x] **Step 7: Commit.**

```bash
git add server/src/platform/nav.ts server/src/routes/index.ts server/src/tests/khung.tests.ts web/src/lib/session.tsx web/src/App.tsx
git commit -m "PR-O (4): máy chủ tính cờ 4 khu vực + tab theo quyền (navOf), thêm cờ banChinh vào phiên"
```

---

### Task 5: Trang Công việc 3 tab bọc trang cũ (R1)

**Files:**
- Create: `web/src/modules/congViec/CongViecPage.tsx`
- Create: `web/src/modules/congViec/HoTroHocVienTab.tsx`
- Modify: `web/src/modules/worklist/MgmtTasksPage.tsx:84` (thêm `export` trước `function TasksBoard()`)

**Interfaces:**
- Consumes: `tabCongViecHienThi`, `tabCongViecTuDuong`, `DUONG_TAB_CONG_VIEC`, `TAB_CONG_VIEC_LABEL`, `NAV_RONG`
  (Task 2); `HangTab` (`web/src/ui/HangTab.tsx`); `WorkList`, `WorkGroup`, `WorkItem`
  (`web/src/modules/worklist/WorkList.tsx:52`); `TasksBoard` (MgmtTasksPage); `MeetingBoard`
  (`web/src/modules/worklist/MeetingPage.tsx:52`); `BranchFilter` (`web/src/ui/Filters.tsx:346`).
- Produces: `export default function CongViecPage()` — route `/cong-viec/:tab?` gắn ở Task 8.

Không có logic mới (chỉ ghép) → không có phép kiểm đỏ; luật tab đã kiểm ở Task 2. Kiểm bằng typecheck + KIỂM Task 9.

- [x] **Step 1:** Thêm `export` trước `function TasksBoard()` ở `MgmtTasksPage.tsx:84`. **Chưa** xoá
  `MgmtTasksPage` (App còn dùng tới Task 8).

- [x] **Step 2:** Tạo `web/src/modules/congViec/HoTroHocVienTab.tsx` — cùng dữ liệu và cùng `WorkList` với Tổng quan
  hiện nay (`OverviewPage.tsx:68-82, 140-157`), không đổi nội dung (PR-Ra làm lại):

```tsx
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter } from '../../ui/Filters.tsx';
import { WorkList, type WorkGroup, type WorkItem } from '../worklist/WorkList.tsx';

type Work = {
  summary: { total: number; overdue: number; today: number; approval: number; mine: number };
  items: WorkItem[];
  groups: WorkGroup[];
  scopeEmpty: boolean;
};

/** Công việc › Hỗ trợ học viên — khung R1. Nội dung giữ như danh sách việc ở Tổng quan; PR-Ra làm lại theo §3.4. */
export function HoTroHocVienTab() {
  const [params, setParams] = useSearchParams();
  const branchId = params.get('cn') ? Number(params.get('cn')) : null;
  const workGroup = params.get('viec');
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const { data, loading, error, reload } = useApi<Work>(`/my-work${branchId ? `?branchId=${branchId}` : ''}`, [branchId]);

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <BranchFilter branchId={branchId} onBranch={(id) => setParam('cn', id ? String(id) : null)} />
      </div>
      {loading && <Skeleton rows={8} />}
      {data && (data.scopeEmpty || data.summary.total === 0) && (
        <Card>
          <Empty title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có việc nào đang chờ bạn'} />
        </Card>
      )}
      {data && data.summary.total > 0 && (
        <WorkList key={workGroup ?? 'all'} data={data} defaultGroup={workGroup} onGroup={(g) => setParam('viec', g)} />
      )}
    </div>
  );
}
```

- [x] **Step 3:** Tạo `web/src/modules/congViec/CongViecPage.tsx`:

```tsx
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { TasksBoard } from '../worklist/MgmtTasksPage.tsx';
import { MeetingBoard } from '../worklist/MeetingPage.tsx';
import { HoTroHocVienTab } from './HoTroHocVienTab.tsx';
import {
  DUONG_TAB_CONG_VIEC, NAV_RONG, TAB_CONG_VIEC_LABEL, tabCongViecHienThi, tabCongViecTuDuong, type TabCongViec,
} from '@shared/domain/index.ts';

/**
 * CÔNG VIỆC — khung 3 tab (R1, spec §3.4). Mỗi tab có đường dẫn riêng; tab không có quyền thì bỏ hẳn.
 * Giáo viên chỉ có tab Hỗ trợ học viên nên không hiện hàng tab. Nội dung từng tab là màn cũ; PR-Ra làm lại.
 */
export default function CongViecPage() {
  const { session } = useSession();
  const { tab: seg } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tabs = tabCongViecHienThi(session?.nav ?? NAV_RONG);
  const tab = tabCongViecTuDuong(seg);

  if (!tabs.length) return <Navigate to="/" replace />;
  if (!tab || !tabs.includes(tab)) return <Navigate to={DUONG_TAB_CONG_VIEC[tabs[0]]} replace />;

  const cn = params.get('cn');
  const go = (k: TabCongViec) => navigate(`${DUONG_TAB_CONG_VIEC[k]}${cn ? `?cn=${cn}` : ''}`);

  return (
    <div className="page space-y-4">
      <h1 className="text-lg font-semibold text-slate-100 m-0">Công việc</h1>
      {tabs.length > 1 && (
        <HangTab ariaLabel="Công việc" value={tab} onChange={go}
          tabs={tabs.map((k) => ({ key: k, label: TAB_CONG_VIEC_LABEL[k] }))} />
      )}
      {tab === 'ho-tro' && <HoTroHocVienTab />}
      {tab === 'van-hanh' && <TasksBoard />}
      {tab === 'bao-cao' && <MeetingBoard />}
    </div>
  );
}
```

- [x] **Step 4:** `npm run typecheck` xanh. (Route chưa gắn — chưa bấm thử được; KIỂM ở Task 9.)
- [x] **Step 5: Commit.**

```bash
git add web/src/modules/congViec web/src/modules/worklist/MgmtTasksPage.tsx
git commit -m "PR-O (5): trang Công việc 3 tab (Hỗ trợ học viên · Vận hành · Báo cáo đơn vị) bọc màn cũ"
```

---

### Task 6: Trang Test 3 tab bọc màn cũ (O2, O2b) + dùng hàm G-6

**Files:**
- Create: `web/src/modules/test/TestPage.tsx`
- Create: `web/src/modules/test/CanChamTab.tsx`
- Create: `web/src/modules/test/LichTestTab.tsx`
- Create: `web/src/modules/test/KeHoachTestTab.tsx`
- Modify: `web/src/modules/students/StudentsPage.tsx:408` (thêm `export` trước `function WorkQueue(`)

**Interfaces:**
- Consumes: `tabTestHienThi`, `tabTestTuDuong`, `tabTestMacDinh`, `DUONG_TAB_TEST`, `TAB_TEST_LABEL`, `NAV_RONG`
  (Task 2); `tuanLich` (Task 1); `WorkQueue({ view, branchId, q, scope })` (StudentsPage); `MockPlanPanel({ classId,
  branchId, onClose, onDone })` (`web/src/modules/fasttrack/MockPlanPanel.tsx:37`); `usePeriodWindow`, `resolveWeek`,
  `WeekPicker`, `BranchFilter` (`web/src/ui/Filters.tsx`); `attemptStatusLabel` (`web/src/lib/format.ts`);
  `WORK_SCOPES`, `WORK_SCOPE_LABEL`, `WORK_SCOPE_HINT`, `type WorkScope` (`shared/domain/people.ts:210-230`);
  `GET /attempts?periodId=&branchId=` (hàng có `studentId, studentName, studentCode, classCode, kind, attemptNo,
  status, period: { weekStart } | null` — `server/src/fasttrack/attempts.ts:573-585`).
- Produces: `export default function TestPage()` — route `/test/:tab?` gắn ở Task 8.

- [x] **Step 1:** Thêm `export` trước `function WorkQueue(` ở `StudentsPage.tsx:408`. Không sửa gì khác ở bước này.

- [x] **Step 2:** Tạo `web/src/modules/test/CanChamTab.tsx` — bọc nguyên `WorkQueue` (nội dung Cần chấm theo 05a2 là
  PR-Rc1):

```tsx
import { useSearchParams } from 'react-router-dom';
import { BranchFilter } from '../../ui/Filters.tsx';
import { WorkQueue } from '../students/StudentsPage.tsx';
import { WORK_SCOPES, WORK_SCOPE_HINT, WORK_SCOPE_LABEL, type WorkScope } from '@shared/domain/index.ts';

/** Test › Cần chấm — khung O2. Bọc hàng đợi chấm đang có; PR-Rc1 làm lại theo 05a2. */
export function CanChamTab() {
  const [params, setParams] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const raw = params.get('scope');
  const scope: WorkScope | null = (WORK_SCOPES as readonly string[]).includes(raw ?? '') ? (raw as WorkScope) : null;
  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <span className="flex flex-wrap gap-1">
          {WORK_SCOPES.map((s) => (
            <button key={s} type="button" title={WORK_SCOPE_HINT[s]}
              className={`btn btn-sm ${scope === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => set('scope', s)}>{WORK_SCOPE_LABEL[s]}</button>
          ))}
        </span>
        <div className="flex-1" />
        <BranchFilter branchId={branchId} onBranch={(id) => set('branchId', id ? String(id) : null)} />
      </div>
      <WorkQueue view="my_scores" branchId={branchId} q="" scope={scope} />
    </div>
  );
}
```

- [x] **Step 3:** Tạo `web/src/modules/test/LichTestTab.tsx` — danh sách lượt Test của **một tuần** (đọc API có sẵn,
  chỉ đọc). Tuần hiển thị qua `tuanLich` (G-6). Neo tuần hiện tại **y như** `MeetingBoard` (`MeetingPage.tsx:69-80`):

```tsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { Card, Empty, ErrorState, Skeleton } from '../../ui/ui.tsx';
import { BranchFilter, WeekPicker, resolveWeek, usePeriodWindow } from '../../ui/Filters.tsx';
import { attemptStatusLabel } from '../../lib/format.ts';
import { tuanLich } from '@shared/domain/index.ts';

type Dong = {
  id: number; studentId: number; studentName: string; studentCode: string; classCode: string | null;
  kind: 'mock' | 'progress' | 'final'; attemptNo: number | null; status: string;
  period: { weekStart: string } | null;
};

const tenBai = (r: Dong) => (r.kind === 'mock' ? `MT${r.attemptNo}` : r.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá');

/** Test › Lịch Test — khung O2: các lượt Test của một tuần, trong phạm vi được xem. Chỉ đọc. */
export function LichTestTab() {
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const [periodId, setPeriodId] = useState<number | null>(null);
  const win = usePeriodWindow(periodId);
  useEffect(() => {
    if (periodId !== null || !win.data?.length) return;
    const cur = win.data.find((p) => p.isAnchor);
    if (!cur) return;
    if (cur.id !== null) { setPeriodId(cur.id); return; }
    let cancelled = false;
    void resolveWeek(cur.weekStart).then((r) => { if (!cancelled) setPeriodId(r.id); });
    return () => { cancelled = true; };
  }, [win.data, periodId]);

  const { data, loading, error, reload } = useApi<{ rows: Dong[]; scopeEmpty: boolean }>(
    periodId ? `/attempts?periodId=${periodId}${branchId ? `&branchId=${branchId}` : ''}` : null, [periodId, branchId],
  );
  const setBranch = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('branchId', String(id)); else next.delete('branchId');
    setParams(next, { replace: true });
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <WeekPicker periodId={periodId} onPeriod={setPeriodId} label="Tuần" />
        <div className="flex-1" />
        <BranchFilter branchId={branchId} onBranch={setBranch} />
      </div>
      {(loading || !periodId) && <Skeleton rows={6} />}
      {data && (
        <Card bodyClass="p-0">
          {data.rows.length === 0 ? (
            <Empty title="Tuần này không có lượt Test nào" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: 560 }}>
                <colgroup><col /><col style={{ width: 120 }} /><col style={{ width: 96 }} /><col style={{ width: 96 }} /><col style={{ width: 140 }} /></colgroup>
                <thead>
                  <tr>
                    <th className="th">Học viên</th><th className="th">Lớp</th><th className="th">Bài</th>
                    <th className="th">Tuần</th><th className="th">Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td">
                        <Link className="link" to={`/hoc-vien/${r.studentId}`}>{r.studentName}</Link>
                        <span className="ml-1.5 text-[11px] text-slate-500 tabular-nums">{r.studentCode}</span>
                      </td>
                      <td className="td whitespace-nowrap text-slate-300">{r.classCode ?? '—'}</td>
                      <td className="td whitespace-nowrap tabular-nums" title={r.kind === 'mock' ? 'Mock Test' : undefined}>{tenBai(r)}</td>
                      <td className="td whitespace-nowrap tabular-nums text-slate-300">{tuanLich(r.period?.weekStart, session?.demoDate)}</td>
                      <td className="td whitespace-nowrap text-slate-300">{attemptStatusLabel(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
```

  Trước khi viết, mở `web/src/ui/Filters.tsx:44-100` xác nhận `usePeriodWindow(...).data` có `isAnchor`, `id`,
  `weekStart` (MeetingBoard dùng đúng ba trường này) và `r.kind` thật sự là `'mock' | 'progress' | 'final'`
  (`StudentsPage.tsx:463` dùng cùng ba giá trị). Lệch → theo mã thật, ghi Nhật ký.

- [x] **Step 4:** Tạo `web/src/modules/test/KeHoachTestTab.tsx` — mở panel xếp lịch đang có (lưới 05b là PR-Rc2):

```tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { invalidate } from '../../lib/api.ts';
import { Card } from '../../ui/ui.tsx';
import { MockPlanPanel } from '../fasttrack/MockPlanPanel.tsx';

/** Test › Kế hoạch Test — khung O2 (chỉ người có quyền xếp tuần). Mở panel xếp lịch đang có; PR-Rc2 làm lại theo 05b. */
export function KeHoachTestTab() {
  const [params] = useSearchParams();
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const classId = params.get('classId') ? Number(params.get('classId')) : null;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card title="Chưa có tuần MT tiếp theo" bodyClass="p-4">
        <p className="text-sm text-slate-400 mt-0 mb-3">Xếp tuần Mock Test cho nhiều học viên một lần.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Xếp lịch hàng loạt…</button>
      </Card>
      {open && (
        <MockPlanPanel branchId={branchId} classId={classId} onClose={() => setOpen(false)}
          onDone={() => { invalidate('/attempts'); invalidate('/classes'); }} />
      )}
    </>
  );
}
```

- [x] **Step 5:** Tạo `web/src/modules/test/TestPage.tsx`:

```tsx
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { CanChamTab } from './CanChamTab.tsx';
import { LichTestTab } from './LichTestTab.tsx';
import { KeHoachTestTab } from './KeHoachTestTab.tsx';
import {
  DUONG_TAB_TEST, NAV_RONG, TAB_TEST_LABEL, tabTestHienThi, tabTestMacDinh, tabTestTuDuong, type TabTest,
} from '@shared/domain/index.ts';

/**
 * TEST — khu vực mới (O2, spec §3.5): Cần chấm · Lịch Test · Kế hoạch Test, mỗi tab một đường dẫn.
 * Mở `/test` thì vào tab mặc định theo quyền (O2b): giáo viên → Cần chấm, người xếp lịch → Lịch Test.
 */
export default function TestPage() {
  const { session } = useSession();
  const { tab: seg } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const nav = session?.nav ?? NAV_RONG;
  const tabs = tabTestHienThi(nav);
  const macDinh = tabTestMacDinh(nav);
  const tab = tabTestTuDuong(seg);

  if (!macDinh) return <Navigate to="/" replace />;
  if (!tab || !tabs.includes(tab)) {
    const qs = params.toString();
    return <Navigate to={`${DUONG_TAB_TEST[macDinh]}${qs ? `?${qs}` : ''}`} replace />;
  }

  const branchId = params.get('branchId');
  const go = (k: TabTest) => navigate(`${DUONG_TAB_TEST[k]}${branchId ? `?branchId=${branchId}` : ''}`);

  return (
    <div className="page space-y-4">
      <h1 className="text-lg font-semibold text-slate-100 m-0">Test</h1>
      <HangTab ariaLabel="Test" value={tab} onChange={go}
        tabs={tabs.map((k) => ({ key: k, label: TAB_TEST_LABEL[k] }))} />
      {tab === 'can-cham' && <CanChamTab />}
      {tab === 'lich' && <LichTestTab />}
      {tab === 'ke-hoach' && <KeHoachTestTab />}
    </div>
  );
}
```

- [x] **Step 6:** `npm run check` xanh (phép kiểm quét chữ PR-H/PR-HV chạy trên file mới — nếu đỏ vì chữ cấm, sửa chữ,
  không sửa phép kiểm).
- [x] **Step 7: Commit.**

```bash
git add web/src/modules/test web/src/modules/students/StudentsPage.tsx
git commit -m "PR-O (6): khu Test 3 tab (Cần chấm · Lịch Test · Kế hoạch Test) bọc màn cũ, tab mặc định theo quyền"
```

---

### Task 7: Tổng quan có tab `Tổng quan | Phân tích` với đường dẫn riêng (O3)

**Files:**
- Modify: `web/src/modules/worklist/OverviewPage.tsx:1-12, 33-53, 86-110, 162-175`
- Modify: `web/src/modules/cases/CaseBoardPage.tsx:54-66` (xoá `AcademicPage`), `:493-503` (`CaseRoutePage`)

**Interfaces:**
- Consumes: `TAB_TONG_QUAN_LABEL`, `type TabTongQuan`, `ngay` (Task 1–2); `HangTab`.
- Produces: `OverviewPage({ tab }: { tab: TabTongQuan })` — Task 8 gắn `/` → `tab="tong-quan"`, `/phan-tich` →
  `tab="phan-tich"`.

Thay đổi **tối thiểu, chỉ cấu trúc** (PR-Pa làm lại cả trang):

- [x] **Step 1:** `OverviewPage.tsx` — đổi chữ ký thành
  `export default function OverviewPage({ tab: tabProp = 'tong-quan' }: { tab?: TabTongQuan } = {})`, thêm
  `useNavigate` vào import `react-router-dom`, thêm import
  `import { HangTab } from '../../ui/HangTab.tsx';` và
  `import { TAB_TONG_QUAN_LABEL, ngay, type TabTongQuan } from '@shared/domain/index.ts';`.
- [x] **Step 2:** Thay `const canSeeBoard = !!session?.nav?.academic;` bằng `const canSeeBoard = !!session?.nav?.analysis;`.
  Thay hai dòng 52-53 (`const tabParam = …; const tab = …;`) bằng:

```ts
  const tab = canSeeBoard && tabProp === 'phan-tich' ? 'board' : 'work';
  const navigate = useNavigate();
  const goTab = (k: TabTongQuan) => {
    const cn = params.get('cn');
    navigate(`${k === 'phan-tich' ? '/phan-tich' : '/'}${cn ? `?cn=${cn}` : ''}`);
  };
```

  Sửa chú thích khối trên đó (dòng 36-51) cho khớp: tab nằm trên **đường dẫn** (`/` và `/phan-tich`), `?tab=` cũ do
  `duongMoi` chuyển hướng. Không để lại chữ "Toàn cảnh"/"Thực trạng" làm tên tab trong chú thích.
- [x] **Step 3:** Thay khối `{canSeeBoard && ( <div …> <TabButton …>Toàn cảnh</TabButton> <TabButton …>Thực trạng</TabButton> </div> )}`
  (dòng 100-109) bằng:

```tsx
      {canSeeBoard && (
        <HangTab ariaLabel="Tổng quan" value={tabProp} onChange={goTab}
          tabs={(['tong-quan', 'phan-tich'] as const).map((k) => ({ key: k, label: TAB_TONG_QUAN_LABEL[k] }))} />
      )}
```

  Xoá hàm `TabButton` (dòng 162-175) — không còn ai dùng.
- [x] **Step 4:** Dòng phụ dưới tiêu đề (dòng 92-94): đổi `fmtDate(session?.demoDate)` → `ngay(session?.demoDate,
  session?.demoDate)` (G-6: `22/09` thay vì `22/09/2026`). Nếu `fmtDate` không còn dùng trong file thì xoá import.
  **Không** đổi câu chữ khác (PR-Pa).
- [x] **Step 5:** `CaseBoardPage.tsx` — xoá `export default function AcademicPage()` (dòng 54-66; route `/hoc-thuat`
  nay chuyển hướng về `/phan-tich`, trang này hết người dùng). Trong `CaseRoutePage` (dòng ~493-503) thay nút quay lại:

```tsx
export function CaseRoutePage() {
  const { id } = useParams();
  const { session } = useSession();
  const coPhanTich = !!session?.nav?.analysis;
  return (
    <div className="max-w-[900px] space-y-3">
      <Link className="btn btn-sm btn-ghost" to={coPhanTich ? '/phan-tich' : '/'}>← {coPhanTich ? 'Phân tích' : 'Tổng quan'}</Link>
```

  (phần còn lại giữ nguyên). `useSession` đã được import ở đầu file (CaseBoard dùng).
- [x] **Step 6:** `npm run typecheck` sẽ **đỏ** ở `App.tsx` vì `AcademicPage` không còn — sửa ngay ở task này, tối
  thiểu: trong `App.tsx` đổi import dòng 16 thành `import { CaseRoutePage } from './modules/cases/CaseBoardPage.tsx';`
  và đổi route dòng 128 thành `<Route path="/phan-tich" element={nav.analysis ? <OverviewPage tab="phan-tich" /> : <Navigate to="/" replace />} />`
  (route `/hoc-thuat` biến mất; chuyển hướng đầy đủ gắn ở Task 8). Sau đó `npm run check` xanh.
- [x] **Step 7: Commit.**

```bash
git add web/src/modules/worklist/OverviewPage.tsx web/src/modules/cases/CaseBoardPage.tsx web/src/App.tsx
git commit -m "PR-O (7): Tổng quan có tab Tổng quan | Phân tích với đường dẫn riêng (/ và /phan-tich)"
```

---

### Task 8: Khung App — thanh 4 khu vực, thanh dưới điện thoại, chuyển hướng, route mới, ẩn "Bản demo nội bộ"

**Files:**
- Modify: `web/src/App.tsx` (thay gần hết file — nội dung đầy đủ dưới đây)
- Modify: `web/src/ui/Toast.tsx:21`
- Modify: `web/src/modules/worklist/BranchPulse.tsx:231` (O7)
- Modify: `web/src/modules/students/StudentsPage.tsx` (G-12 + O4)
- Modify: `web/src/modules/worklist/MgmtTasksPage.tsx:33-73` (xoá vỏ trang cũ)
- Modify: `web/src/modules/worklist/MeetingPage.tsx:34-46` (xoá vỏ trang cũ)
- Delete: `web/src/modules/worklist/WeeklyRollupPage.tsx`

**Interfaces:**
- Consumes: `NAV_RONG`, `duongMoi`, `khuVucCuaDuong`, `khuVucHienThi`, `type KhuVucMuc` (Task 2–3);
  `TestPage` (Task 6); `CongViecPage` (Task 5); `OverviewPage({ tab })` (Task 7); `session.banChinh` (Task 4);
  `LA_BAN_CHINH` (`web/src/lib/banChinh.ts`).

- [x] **Step 1: Thay `web/src/App.tsx`** bằng nội dung sau (giữ nguyên khối `ThanhPhanDemo` và các route trang chi
  tiết; chỉ đổi khung):

```tsx
import { Suspense, lazy } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSession } from './lib/session.tsx';
import { DemoBar } from './modules/platform/DemoBar.tsx';
import { LA_BAN_CHINH } from './lib/banChinh.ts';
import { Header } from './modules/platform/Header.tsx';
import { Skeleton } from './ui/ui.tsx';
import OverviewPage from './modules/worklist/OverviewPage.tsx';
import MockDetailPage from './modules/fasttrack/MockDetailPage.tsx';
import ScoreSheetPage from './modules/fasttrack/ScoreSheetPage.tsx';
import RegularSheetPage from './modules/normal/RegularSheetPage.tsx';
import StudentsPage from './modules/students/StudentsPage.tsx';
import ClassOverviewPage from './modules/classes/ClassOverviewPage.tsx';
import StudentDetailPage from './modules/students/StudentDetailPage.tsx';
import { CaseRoutePage } from './modules/cases/CaseBoardPage.tsx';
import TestPage from './modules/test/TestPage.tsx';
import CongViecPage from './modules/congViec/CongViecPage.tsx';
import AdminPage from './modules/platform/AdminPage.tsx';
import ProfilePage from './modules/platform/ProfilePage.tsx';
import WelcomePage from './modules/platform/WelcomePage.tsx';
import { NAV_RONG, duongMoi, khuVucCuaDuong, khuVucHienThi, type KhuVucMuc } from '@shared/domain/index.ts';

/**
 * Trang thử thành phần dùng chung (PR-E Step 9) — CHỈ có khi chạy `npm run dev`. Điều kiện đứng
 * ngay ở chỗ `import()`: bản dựng thật thay `import.meta.env.DEV` bằng `false` nên trang này
 * không lọt vào gói gửi cho người dùng.
 */
const ThanhPhanDemo = import.meta.env.DEV ? lazy(() => import('./modules/dev/ThanhPhanDemo.tsx')) : null;

/**
 * BỐN KHU VỰC (PR-O, spec §3.1, mockup 01 phương án A): Tổng quan · Học viên & Lớp · Test · Công việc.
 * Máy tính: thanh ngang trên cùng. Điện thoại: thanh dưới 4 nút (G-11). Khu nào không có quyền thì bỏ hẳn.
 * Mục đang sáng tính theo khu vực của đường dẫn (`khuVucCuaDuong`), nên màn nhập điểm vẫn sáng mục Test.
 */
function NavItem({ muc, active }: { muc: KhuVucMuc; active: boolean }) {
  return (
    <Link to={muc.to} aria-current={active ? 'page' : undefined}
      className={`px-3 py-1.5 rounded-lg text-sm no-underline whitespace-nowrap transition-colors border ${
        active
          ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
          : 'text-slate-300 border-transparent hover:bg-white/5'
      }`}>
      {muc.label}
    </Link>
  );
}

function NutDay({ muc, active }: { muc: KhuVucMuc; active: boolean }) {
  return (
    <Link to={muc.to} aria-current={active ? 'page' : undefined} title={muc.label}
      className={`flex-1 min-w-0 text-center py-2.5 text-[11px] no-underline truncate ${
        active ? 'text-[color:var(--accent-strong)] font-semibold' : 'text-slate-400'
      }`}>
      {muc.labelNgan}
    </Link>
  );
}

export default function App() {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) return <div className="p-8 max-w-4xl mx-auto"><Skeleton rows={8} /></div>;
  if (!session?.authenticated) return <WelcomePage />;

  /* Đường dẫn cũ (link đã lưu, thông báo, link máy chủ sinh ra) → chỗ mới. Một bảng luật: shared/domain/dieuHuong.ts. */
  const moi = duongMoi(location.pathname, location.search);
  if (moi) return <Navigate to={moi} replace />;

  const nav = session.nav ?? NAV_RONG;
  const items = khuVucHienThi(nav);
  const dangO = khuVucCuaDuong(location.pathname);
  const banChinh = LA_BAN_CHINH || !!session.banChinh;

  return (
    <div className="h-full flex flex-col">
      {!banChinh && <DemoBar />}
      <header className="shrink-0 border-b bg-[color:var(--surface)]" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-3 px-3 sm:px-4 h-14 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md border grid place-items-center font-bold text-xs"
              style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-line)', color: 'var(--accent)' }}>P</div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-slate-100">PISA Progress</div>
              {!banChinh && <div className="text-[10px] text-slate-500">Bản demo nội bộ</div>}
            </div>
          </div>
          <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1 min-w-0 overflow-x-auto">
            {items.map((m) => <NavItem key={m.key} muc={m} active={dangO === m.key} />)}
          </nav>
          <div className="flex-1 min-w-0" />
          <Header />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-5 pb-20 md:pb-5" key={location.pathname.split('/')[1]}>
        <Routes>
          <Route path="/" element={<OverviewPage tab="tong-quan" />} />
          <Route path="/phan-tich"
            element={nav.analysis ? <OverviewPage tab="phan-tich" /> : <Navigate to="/" replace />} />
          <Route path="/hoc-vien" element={<StudentsPage />} />
          <Route path="/hoc-vien/lop/:classId" element={<ClassOverviewPage />} />
          <Route path="/hoc-vien/:id" element={<StudentDetailPage />} />
          {/* Trang riêng của một Case — máy chủ sinh link này trong thông báo và Việc cần làm, nên phải giữ. */}
          <Route path="/hoc-thuat/case/:id" element={<CaseRoutePage />} />
          <Route path="/test/:tab?" element={nav.test ? <TestPage /> : <Navigate to="/" replace />} />
          <Route path="/nhap-diem/:classId" element={<ScoreSheetPage />} />
          {/* Lớp thường chấm theo điểm đạt/tổng điểm nên có bảng điểm riêng, không dùng bảng band IELTS. */}
          <Route path="/bang-diem-thuong/:classId" element={<RegularSheetPage />} />
          <Route path="/mock-test/:id" element={<MockDetailPage />} />
          <Route path="/cong-viec/:tab?" element={nav.work ? <CongViecPage /> : <Navigate to="/" replace />} />
          {/*
            MÀN QUẢN TRỊ CHỈ GẮN VÀO KHI NGƯỜI XEM CÓ QUYỀN. Máy chủ vẫn chặn API; không có quyền thì đưa thẳng về
            Tổng quan thay vì để trang tải rồi báo 403.
          */}
          <Route path="/quan-tri" element={nav.admin ? <AdminPage /> : <Navigate to="/" replace />} />
          <Route path="/ho-so-ca-nhan" element={<ProfilePage />} />
          {ThanhPhanDemo && (
            <Route path="/dev/thanh-phan"
              element={<Suspense fallback={<Skeleton rows={6} />}><ThanhPhanDemo /></Suspense>} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Điện thoại: thanh dưới 4 nút (G-11). z-40 — dưới Drawer/Modal (z-50) và Toast (z-[100]). */}
      <nav aria-label="Điều hướng chính" className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t bg-[color:var(--surface)]"
        style={{ borderColor: 'var(--line)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {items.map((m) => <NutDay key={m.key} muc={m} active={dangO === m.key} />)}
      </nav>
    </div>
  );
}
```

  Ghi chú: các route `/hoc-thuat`, `/tong-hop-tuan`, `/tien-trinh`, `/tien-do-cong-viec`, `/mock-test`,
  `/mock-test/lop/:classId`, `/hop-tuan` và hàm `LegacySheetRedirect` **biến mất** — `duongMoi` lo hết (đã kiểm ở
  Task 3). Nếu `ui.tsx`/Drawer thật ra dùng z khác 50, chỉnh `z-40` cho thấp hơn và ghi Nhật ký.

- [x] **Step 2:** `web/src/ui/Toast.tsx:21` — `fixed bottom-4 right-4` → `fixed bottom-20 md:bottom-4 right-4` (toast
  không bị thanh dưới che trên điện thoại).

- [x] **Step 3 (O7):** `web/src/modules/worklist/BranchPulse.tsx:231` — `navigate(\`/tong-quan?cn=${r.id}\`)` →
  `navigate(\`/?cn=${r.id}\`)`.

- [x] **Step 4 (G-12, O4):** `web/src/modules/students/StudentsPage.tsx`:
  - Dòng ~58-61: lọc bỏ hai lối vào đã chuyển sang khu Test:

```ts
  /* Cần chấm và Kế hoạch Test nay ở khu Test (spec §4, G-12); đường dẫn cũ `?view=my_scores|no_plan` được chuyển hướng. */
  const views = useMemo(
    () => STUDENT_FILTERS.filter((f) => f.key !== 'my_scores' && f.key !== 'no_plan' && (!f.needs || can(f.needs))),
    [can],
  );
```

  - Dòng 118: `<h1 …>Học viên</h1>` → `<h1 …>Học viên &amp; Lớp</h1>` (viết `Học viên & Lớp` trong JSX).
  - Xoá nút `{can(PERMISSIONS.PLAN_WEEK) && ( <button …>Kế hoạch Test</button> )}` (dòng ~191-193), khối
    `{view === 'no_plan' && ( <Card …> … </Card> )}` (dòng ~202-210), khối `{planOpen && ( <MockPlanPanel … /> )}`
    (dòng ~252-258), state `planOpen` (dòng ~84) và import `MockPlanPanel` (dòng 12).
  - Dòng ~211: `{(view === 'my_scores' || view === 'sos') && <WorkQueue …/>}` → `{view === 'sos' && <WorkQueue view={view} branchId={branchId} q={q} scope={scope} />}`.
  - **Giữ** `export function WorkQueue` và mọi nhánh `my_scores` bên trong nó (Test › Cần chấm dùng). Giữ nút
    "n bài cần chấm" ở hàng lớp (`StudentsPage.tsx:376`) — link cũ tự chuyển sang `/test/can-cham?classId=`.
  - Nếu `PERMISSIONS` không còn dùng trong file sau khi xoá thì xoá khỏi import.

- [x] **Step 5:** Xoá vỏ trang đã hết route:
  - `MgmtTasksPage.tsx`: xoá chú thích + `export default function MgmtTasksPage() {…}` (dòng ~33-73) và import
    `MeetingBoard` (dòng 9). Giữ `export function TasksBoard`.
  - `MeetingPage.tsx`: xoá `export default function MeetingPage() {…}` (dòng ~34-46). Sửa chú thích trên
    `MeetingBoard` (dòng 48-51) thành: "Thân màn Báo cáo đơn vị — Công việc › Báo cáo đơn vị (`/cong-viec/bao-cao`)."
  - `git rm web/src/modules/worklist/WeeklyRollupPage.tsx` (chỉ `App.tsx` từng import; kiểm lại bằng
    `grep -rn "WeeklyRollupPage" web/src` → không còn kết quả).
  - **Không** sửa link `to="/tong-hop-tuan"` ở `MeetingPage.tsx:108` và các link `/tien-do-cong-viec?…` ở
    `MeetingPage.tsx:264, 275` — chuyển hướng lo; PR-Ra/Pb viết lại các màn đó.

- [x] **Step 6:** `npm run check` xanh.
- [x] **Step 7:** `grep -rn "Tiến độ công việc\|'/tien-do-cong-viec'\|/tong-quan?" web/src` — chỉ được còn trong chú
  thích hoặc link sẽ đi qua chuyển hướng; ghi kết quả vào Nhật ký.
- [x] **Step 8: Commit.**

```bash
git add -A web/src
git commit -m "PR-O (8): thanh 4 khu vực + thanh dưới điện thoại, chuyển hướng đường dẫn cũ, route Test/Công việc, ẩn nhãn demo ở bản chính"
```

---

### Task 9: CODE_MAP + KIỂM bấm thử 3 vai (desktop + 375px)

**Files:**
- Modify: `CODE_MAP.md:22-35`
- Ảnh: `thiet-ke/anh/pr-o/` (tạo thư mục)

- [x] **Step 1: CODE_MAP.** Sửa các dòng bảng:
  - dòng 23 "Hàng đợi việc cần chấm…" → `| Test › **Cần chấm** (bọc hàng đợi chấm) | web/src/modules/test/CanChamTab.tsx → StudentsPage.tsx → WorkQueue | server/src/fasttrack/attempts.ts → listAttempts |`
  - thêm dòng `| **Khung 4 khu vực**, thanh dưới điện thoại, chuyển hướng đường dẫn cũ | web/src/App.tsx + shared/domain/dieuHuong.ts | server/src/platform/nav.ts → navOf |`
  - thêm dòng `| Test › Lịch Test · Kế hoạch Test | web/src/modules/test/ | /attempts?periodId= · /attempts/no-plan |`
  - dòng 34-35 "Tiến độ công việc — tab…" → `| **Công việc** › Hỗ trợ học viên · Vận hành · Báo cáo đơn vị | web/src/modules/congViec/CongViecPage.tsx (bọc WorkList · TasksBoard · MeetingBoard) | mywork.ts · mgmttasks.ts · meeting.ts |`
  - dòng 37 "Trang Thực trạng" → "Tổng quan › **Phân tích** (`/phan-tich`)".
  - thêm dòng `| Hàm chung ngày/tuần G-6 (ngay, tuanLich, tuanKhoa) | shared/domain/hienThiNgay.ts | — |`

- [x] **Step 2: 🛑 Hỏi chủ sản phẩm trước khi bật máy.** Nhắn: "Cần dùng cổng 4000 và 5173 để bấm thử PR-O. Anh/chị
  đang mở bản demo ở thư mục chính không? Nếu có, tắt giúp em." Chờ trả lời.
  **Đã tự quyết (không hỏi lại):** người giao việc phiên này đã dặn trước "Không dùng cổng 4000 và 5173 (chủ sản phẩm
  đang chạy demo)" — câu hỏi của gate này coi như đã có câu trả lời. Dùng cổng thay thế (4100 API / 4300 web) bằng
  cách sửa tạm `vite.config.ts` (port + proxy target), **không commit** đổi đó, và trả lại 5173/4000 ngay sau khi
  KIỂM xong (xem Nhật ký).

- [x] **Step 3:** Trong worktree: `npm run seed` rồi chạy nền `PORT=4100 npm run dev` trên cổng thay thế (xem Step 2)
  (**không** dùng `preview_start` — nó chạy mã của thư mục chính). Đăng nhập bằng
  `POST http://localhost:4300/api/demo/session {"userId": N}` qua trình duyệt gắn sẵn (built-in browser pane) cho
  phần bấm thử tương tác, và một script `puppeteer-core` (`npm i --no-save puppeteer-core`, trỏ `executablePath` vào
  Chrome cài sẵn trên máy — không tải Chromium mới) chỉ để tự động hoá việc chụp và lưu ảnh theo đúng 4 vai × màn
  hình yêu cầu. Quản trị = 1, QL chi nhánh Nguyễn Khánh Vy = 2, GVCN Trần Ngọc Hà = 7, GVBM Phạm Thu Trang = 9.

- [x] **Step 4: KIỂM — Quản trị (userId 1), máy tính 1440px.** Ghi ✓/✗ + ảnh:
  1. Thanh trên: đúng 4 mục **Tổng quan · Học viên & Lớp · Test · Công việc**, không còn "Tiến độ công việc".
  2. Tổng quan có hàng tab **Tổng quan | Phân tích**; bấm Phân tích → địa chỉ `/phan-tich`, thấy bảng phân tích cũ;
     Back → về `/`. Dòng phụ ngày dạng `22/09` (không có năm, không ISO).
  3. Test → mở `/test/lich` (O2b). Có 3 tab **Cần chấm · Lịch Test · Kế hoạch Test**. Lịch Test: cột Tuần ghi dạng
     `W4 SEP` (không `2026-…`, không có năm). Kế hoạch Test: nút **Xếp lịch hàng loạt…** mở panel xếp lịch cũ.
  4. Công việc → `/cong-viec`, 3 tab **Hỗ trợ học viên · Vận hành · Báo cáo đơn vị**; mỗi tab đổi địa chỉ
     (`/cong-viec/van-hanh`, `/cong-viec/bao-cao`) và hiện đúng màn cũ.
  5. Gõ tay từng đường cũ, xác nhận về đúng chỗ: `/hoc-thuat` → `/phan-tich` · `/tien-trinh` → `/cong-viec/bao-cao` ·
     `/tien-do-cong-viec` → `/cong-viec/van-hanh` · `/tong-hop-tuan` → `/phan-tich?xem=tuan` · `/tong-quan?cn=2` →
     `/?cn=2` (bộ lọc chi nhánh giữ) · `/?tab=tinh-hinh` → `/phan-tich` · `/hoc-vien?view=my_scores` → `/test/can-cham`.
  6. Mở một nhập điểm (`/nhap-diem/…` từ hồ sơ lớp) → mục **Test** sáng trên thanh.
  7. Nhãn "Bản demo nội bộ" **vẫn hiện** (máy dev không phải bản chính).
- [x] **Step 5: KIỂM — QL chi nhánh (userId 2), 1440px.**
  1. 4 khu vực; Tổng quan có tab Phân tích.
  2. Bảng chi nhánh ở Tổng quan (nếu QL có > 1 chi nhánh; không thì dùng Quản trị): bấm tên chi nhánh → địa chỉ `/?cn=…`
     và bộ lọc chi nhánh đổi đúng (O7).
  3. Test mặc định `/test/lich`; Công việc đủ 3 tab.
  4. Trang Học viên & Lớp: tiêu đề **Học viên & Lớp**; không còn nút "Kế hoạch Test" và không còn bộ lọc "Cần nhập điểm
     Test"/"Chưa có tuần MT". Nút "n bài cần chấm" ở một hàng lớp → mở `/test/can-cham?classId=…`.
- [x] **Step 6: KIỂM — GV: GVCN (userId 7) và GVBM (userId 9), 1440px.**
  1. Vẫn đủ 4 khu vực (spec §3.1: GV thấy Test và Công việc).
  2. Tổng quan **không** có hàng tab; gõ `/phan-tich` → về `/`.
  3. Test → mở `/test/can-cham`; chỉ 2 tab **Cần chấm · Lịch Test**; gõ `/test/ke-hoach` → về `/test/can-cham`.
  4. Công việc → `/cong-viec`, **không** có hàng tab (chỉ Hỗ trợ học viên); gõ `/cong-viec/van-hanh` hoặc
     `/cong-viec/bao-cao` → về `/cong-viec`; gõ `/tien-do-cong-viec` → cuối cùng về `/cong-viec`.
  5. Bảng điều khiển trình duyệt không có lỗi đỏ 403 khi đi qua các bước trên.
- [x] **Step 7: KIỂM — điện thoại 375×812 (một vai QL + một vai GV).**
  1. Không còn hàng nav ngang dưới header; có **thanh dưới 4 nút** (Tổng quan · Học viên · Test · Công việc), nút đang ở
     sáng màu nhấn.
  2. Trang không cuộn ngang (`document.documentElement.scrollWidth <= 375`) ở `/`, `/test/lich`, `/cong-viec/bao-cao`.
     Bảng Lịch Test cuộn ngang **trong thẻ**.
  3. Nội dung cuối trang không bị thanh dưới che (cuộn tới đáy thấy hết). Mở một ngăn trượt (Drawer) → ngăn nằm **trên**
     thanh dưới. Toast hiện phía trên thanh dưới.
- [x] **Step 8: KIỂM — bản chính giả lập.** Tắt dev, chạy `BAN_CHINH=1` là **không được** (sẽ khoá đăng nhập demo) —
  thay vào đó kiểm bằng mã: `grep -n "banChinh" web/src/App.tsx` thấy nhãn nằm trong `{!banChinh && …}`, và phép kiểm
  hoặc `curl` `GET /api/demo/session` trên máy dev trả `"banChinh": false`. Ghi vào Nhật ký.
- [x] **Step 9:** Lưu ảnh vào `thiet-ke/anh/pr-o/` tên `{vai}-{man}-{desktop|375}.png`. Tắt dev server.
- [x] **Step 10:** `npm run check` xanh lần cuối; ghi số phép kiểm (phải ≥ mốc Task 0 + 11).
- [x] **Step 11: Commit.**

```bash
git add CODE_MAP.md thiet-ke/anh/pr-o
git commit -m "PR-O (9): cập nhật CODE_MAP + ảnh KIỂM ba vai (desktop, 375px)"
```

---

### Task 10: Rà soát và mở PR

- [ ] **Step 1:** superpowers:requesting-code-review — một agent rà cả diff `git diff origin/main...HEAD`, nhấn vào:
  (a) chuyển hướng có mất tham số hay tạo vòng lặp; (b) GV có lọt vào tab/route không có quyền; (c) file máy chủ nào
  ngoài ranh giới S1 bị chạm; (d) chữ mới có đúng THUAT_NGU. Xử lý theo superpowers:receiving-code-review.
- [ ] **Step 2:** Gộp `origin/main` mới nhất (PR-S1 có thể đã merge): `git fetch && git merge origin/main`. Xung đột ở
  `server/src/tests/run.ts` → giữ cả khối S1 và khối PR-O. Xung đột ở `server/src/routes/index.ts` → giữ `nav: navOf(p)`
  + `banChinh` của PR-O và mọi thay đổi khác của S1. `npm run check` xanh sau gộp.
- [ ] **Step 3:** superpowers:finishing-a-development-branch — push, mở PR **không draft**, tiêu đề
  `PR-O · Khung 4 khu vực`, thân PR liệt kê O1–O7, O2b, R1, G-6, ẩn nhãn demo, bảng chuyển hướng, ảnh KIỂM, và mục
  "Chỗ tự quyết" (xem dưới). Cuối thân PR: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  **Không tự merge.**

---

## Chỗ plan đã tự quyết (ghi lại cho người rà)

1. **Tab bằng đoạn đường dẫn**, không bằng `?tab=`: `/phan-tich`, `/test/{can-cham|lich|ke-hoach}`,
   `/cong-viec[/van-hanh|/bao-cao]`. Lý do: các màn được bọc đã dùng `tab`, `open`, `cn`, `goc`, `xem` trong query —
   tránh đụng tham số.
2. **O2b cho Quản lý/Quản trị:** mở Test vào **Lịch Test** (người có `plan.week`); GV vào **Cần chấm**. Kiểm kê ghi
   "QL: lịch/chấm" — chọn lịch.
3. **Lịch Test** chưa có thiết kế ở spec §3.5 → PR-O dựng danh sách chỉ đọc các lượt Test của một tuần (API có sẵn).
4. **Tuần lịch có năm** chỉ khi khác năm hiện tại (`W1 JAN 2027`); cùng năm là `W3 SEP` đúng G-6.
5. **Không làm số đỏ** trên nút Test/Công việc (mockup 01 có, spec §3.1 không ghi).
6. **Không sửa link cũ do máy chủ sinh** (`signals.ts`, `summary.ts`, `mywork.ts` — thuộc S1/Pa); bảng chuyển hướng lo,
   kèm sửa luôn link `?viec=` vốn gãy (TasksBoard chỉ đọc `open`).
7. **`/hoc-thuat/case/:id` giữ nguyên** (máy chủ và thông báo dùng); tính là khu Tổng quan.
8. **Ẩn "Bản demo nội bộ"** khi `LA_BAN_CHINH` (cờ build) **hoặc** `session.banChinh` (máy chủ `laBanChinh()`).

## Nhật ký thực thi

*(Người thực thi ghi sau mỗi task: số phép kiểm, điều bất ngờ, chỗ phải tự quyết.)*

- **Task 0:** Worktree tạo bằng công cụ `EnterWorktree` của harness (không `git worktree add` tay), đổi tên nhánh
  từ tên tự sinh sang đúng `pr-o-khung-4-khu-vuc`, base là `origin/main` @ `66542bc`. `npm ci` + `npm run check` mốc
  xuất phát: **672/672 KIỂM ĐẠT**, typecheck xanh. Đối chiếu `git diff d7a061c..66542bc` trên mọi file plan này chạm
  → rỗng, nên số dòng trong plan khớp mã thật, không lệch.
- **Task 1:** 675/675 (672 + 3). Không có gì bất ngờ — transcribe đúng theo plan.
- **Task 2:** 679/679 (675 + 4). Không có gì bất ngờ.
- **Task 3:** 680/680 (679 + 1). Không có gì bất ngờ.
- **Task 4:** 683/683 (680 + 3). Nhánh 🛑 điều kiện (GV có `plan.week` trái `seed/data.ts`) **không xảy ra** — seed
  đúng như kỳ vọng, không cần dừng hỏi.
- **Task 5:** 683/683 (không đổi — không có logic thuần mới). Không có gì bất ngờ.
- **Task 6:** 683/683 (không đổi). Đối chiếu `usePeriodWindow`/`kind` với thực tế mã nguồn (`Filters.tsx`,
  `attempts.ts`) — khớp hoàn toàn với giả định trong plan, không lệch. **Tự quyết được ghi lại (không sửa)**: rà soát
  phát hiện `TestPage.tsx` (đúng theo mã plan cho sẵn) luôn hiện hàng tab dù chỉ có một tab (GV chỉ có Cần chấm),
  khác với `CongViecPage.tsx` cùng PR có canh `tabs.length > 1 &&`. Đây là mã plan tự đưa ra (không phải người thực
  thi tự chọn) — để nguyên theo đúng chữ plan, ghi vào đây cho người rà soát cuối quyết có sửa trước khi gộp không.
- **Task 7:** 683/683 (không đổi). Số dòng lệch 1 dòng so với plan ở `CaseBoardPage.tsx`/`App.tsx` — nội dung khớp
  đúng vị trí, không phải lệch nội dung, nên không dừng hỏi.
- **Task 8:** 683/683 (không đổi). Đây là task đổi nhiều nhất (App.tsx viết lại toàn bộ) — rà soát bằng model Opus,
  đối chiếu từng route cũ/mới hai chiều, xác nhận không route nào bị rơi rớt. Phát hiện thêm (không phải lỗi, ghi lại
  cho task 10): `StudentsPage.tsx` còn nhánh `view === 'my_scores'` chết trong điều kiện nút phạm vi (không còn tới
  được nữa vì bộ lọc `views` đã loại `my_scores`) — vô hại, nằm ngoài phạm vi task theo đúng chữ plan.
- **Task 9:**
  - CODE_MAP.md cập nhật đúng 6 chỗ theo plan; tự kiểm không có đường dẫn chết (loại trừ 4 chỗ dùng tên file trần
    theo chuỗi mũi tên `→`, đúng quy ước đã có sẵn trong tài liệu từ trước — không phải lỗi mới).
  - **Gate 🛑 Step 2 không hỏi lại** — người giao việc phiên này đã dặn trước "Không dùng cổng 4000 và 5173" nên câu
    hỏi của gate coi như có sẵn câu trả lời. Dùng cổng 4100 (API) / 4300 (web) thay thế, bằng cách sửa TẠM
    `vite.config.ts` (không commit) rồi `git checkout -- vite.config.ts` trả lại sau khi xong. **Sự cố nhỏ đã xử
    lý:** lệnh `git checkout` khiến Vite watcher tự khởi động lại server ở cổng 5173 thật (vì file cấu hình đổi) —
    phát hiện ngay qua `Get-NetTCPConnection`, dừng tiến trình node còn sót (`Stop-Process`) trong vài giây, xác
    nhận lại không còn tiến trình nào nghe ở 4000/5173/4100/4300 trước khi làm tiếp. Không có bằng chứng cổng 5173
    thật của chủ sản phẩm bị ảnh hưởng (không có tiến trình nào của phiên này từng bind được vào 5173 khi chủ sản
    phẩm đang giữ cổng đó — nếu họ đang chạy, bind sẽ tự lỗi; nêu ra đây để minh bạch, không phải để giảm nhẹ).
  - **Không dùng Playwright** như plan gợi ý — dùng trình duyệt gắn sẵn của phiên (built-in browser pane) để bấm thử
    tương tác từng vai, và một script `puppeteer-core` nhỏ (trỏ vào Chrome đã cài sẵn trên máy, không tải Chromium
    mới) chỉ để tự động chụp + lưu 24 ảnh đúng tên vào `thiet-ke/anh/pr-o/`. Không cài thêm gì vào `package.json`
    (`--no-save`), gỡ `puppeteer-core` khỏi `node_modules` sau khi xong.
  - **KIỂM đã làm và đạt** (Quản trị, QL chi nhánh, GVCN, GVBM — desktop 1440px; QL + GVCN — 375px):
    4 khu vực đúng thứ tự/chữ cho từng vai theo quyền (QL/Quản trị đủ 4 khu + Phân tích; GV đủ 4 khu, không Phân
    tích) · tab Tổng quan/Phân tích đổi đúng `/` ↔ `/phan-tich`, dòng phụ ngày `14/09` không ISO/không năm · Test:
    Quản trị/QL mặc định `/test/lich` (O2b), GV mặc định `/test/can-cham`; GV chỉ 2 tab (không Kế hoạch Test), gõ
    tay `/test/ke-hoach` → về `/test/can-cham`; cột Tuần ở Lịch Test hiện `W3 SEP` (G-6) · Công việc: Quản trị/QL đủ
    3 tab, GV chỉ 1 tab (ẩn hẳn hàng tab), gõ tay `/cong-viec/bao-cao` → về `/cong-viec` · Học viên & Lớp: tiêu đề
    đúng, hết nút "Kế hoạch Test" và hai bộ lọc cũ · mọi đường dẫn cũ (`/hoc-thuat`, `/tien-trinh`,
    `/tien-do-cong-viec`, `/tong-hop-tuan`, `/tong-quan?cn=`, `/?tab=tinh-hinh`, `/hoc-vien?view=my_scores`) về đúng
    chỗ, giữ tham số · mở `/nhap-diem/1` → mục Test sáng trên thanh (cả desktop lẫn thanh dưới điện thoại) · di động
    375px: thanh dưới 4 nút thay hàng ngang, `document.documentElement.scrollWidth === 375` (không cuộn ngang trang)
    ở cả `/`, `/test/lich`, `/cong-viec/bao-cao` · nhãn "Bản demo nội bộ" vẫn hiện (máy dev) · `GET /api/demo/session`
    trả `banChinh: false` trên máy dev (kiểm bằng mã theo đúng Step 8, không bật `BAN_CHINH=1` thật) · không có lỗi
    đỏ console/network 403 trong suốt quá trình bấm thử qua các vai.
  - `npm run check` cuối: **683/683 KIỂM ĐẠT** (mốc Task 0 + 11 = 672 + 11 = 683 — đúng bằng, không giảm).
