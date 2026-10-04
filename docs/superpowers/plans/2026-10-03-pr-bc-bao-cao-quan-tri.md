# PR-BC · Báo cáo đơn vị + Quản trị: kế hoạch ngày 03/10, viết cho chủ sản phẩm

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gọn thanh điều khiển Báo cáo đơn vị (L2), hiện kỳ tháng là "09/2026" (D8), thêm bộ lọc chi nhánh cho Báo cáo đơn vị (D9), thêm bộ lọc và phân loại tài khoản ở Quản trị › Tài khoản (L3), và ẩn cột "Quyền cấp riêng" khi không ai có quyền cấp riêng (J10, phần Quản trị).

**Architecture:** Mọi luật lọc nằm ở hàm thuần trong `shared/domain`: `locDonViBaoCao`/`demTrangThaiDonVi`/`luaChonChiNhanhBaoCao` ở `baoCaoDonVi.ts` và `locTaiKhoan`/`nhomTaiKhoan`/`phanLoaiTaiKhoan` ở `taiKhoan.ts`. Các hàm này có phép kiểm, và máy chủ không đổi gì: `/meeting/board` đã trả `units[].branchId`, còn `/admin/accounts` đã trả `roles[]`, `skills`, `extra`. Trình duyệt lọc và giữ trạng thái lọc trong URL query. Kỳ tháng dùng hàm có sẵn `hienONgay(iso, 'thang')` ở `shared/domain/oNgay.ts:92-95`, không viết hàm mới.

**Tech Stack:** React, react-router (`useSearchParams`) và Tailwind ở `web/`. Phép kiểm nằm trong `server/src/tests/*.tests.ts` và chạy bằng `npm test` (`run.ts`). `npm run check` gồm build, test và typecheck.

**Spec:** mục L2 và L3 của `docs/superpowers/plans/2026-10-03-pr-l1-popover-bao-cao-loc-gv.md`. **Không làm L1**, vì L1 thuộc PR-DH. Thêm D8, D9 và J10 (phần Quản trị) theo `docs/superpowers/plans/2026-10-03-lo-trinh-tong-hop-viec-chua-lam.md` (dòng 26, 30, 95-100) và `docs/superpowers/plans/2026-10-02-ux-sau-critique.md:115-117`. Chủ sản phẩm duyệt D9 ngày 03/10, nên quyết định này **ghi đè** dòng "Không làm: … thêm bộ lọc chi nhánh" của L2.

## Global Constraints
- CLAUDE.md: chỉ tinh chỉnh, không làm lại. Giữ phông Be Vietnam Pro (chữ số lấy từ Inter), bảng màu và bố cục. Thời gian trên màn ưu tiên **mã tuần** `W1 OCT`. Ngày chỉ dùng cho hạn cụ thể, ngày thi, ngày sinh và nhật ký. Kỳ tháng hiện `09/2026`, không hiện `2026-09`.
- Bộ lọc dạng nút liền nhau dùng `BoLocDoan` (`web/src/ui/ui.tsx:496`), theo `thiet-ke/HE_GIAO_DIEN.md:121`. Trạng thái đang chọn có nền, viền và dấu ✓ (`HE_GIAO_DIEN.md:42`). Nhóm có tiêu đề dùng `HangNhom` (`web/src/ui/HangNhom.tsx:32`).
- Phân quyền giữ nguyên. Bộ lọc chỉ **thu hẹp** những gì máy chủ đã cho xem (`visibleUnits`, `server/src/worklist/meeting.ts:37-44`). Không thêm tham số nào mở rộng phạm vi.
- Không đổi máy chủ hay schema. Nếu đổi thì phải hỏi chủ sản phẩm trước.
- Hàm mới ở `shared/domain/*` phải re-export qua `shared/domain/index.ts`. File phép kiểm mới phải được import và gọi ở cuối `server/src/tests/run.ts`, trước dòng `console.log(\`\n${'='.repeat(60)}\`)`. Thêm file mới thì sửa `CODE_MAP.md` trong cùng commit.
- Áp cho mọi PR (lộ trình §"Áp cho mọi PR"):
  - Viết phép kiểm hành vi trước và để nó đỏ. Không quét chuỗi nguồn khi kiểm được hành vi.
  - Bấm thử trên trình duyệt ở **375 và 1440 px, chế độ sáng và tối, với 3 vai**: Quản trị hệ thống, Quản lý chi nhánh (MB) và GV.
  - Mô tả PR báo từng ID: tái hiện được hay bác bỏ, file đã sửa, phép kiểm, ảnh, giới hạn còn lại.
- Luật S3: không dùng nút "Huỷ" trần. Ở đây không có form mới, nên nút xoá lọc ghi là "Xoá lọc".
- Xong PR thì:
  - đánh dấu `[x]` ở file này;
  - thêm một dòng vào mục 14 `plan.md`;
  - mở PR (không tự merge);
  - liệt kê các chú thích `ponytail:`.

## Skill bắt buộc
- **superpowers**
  - `subagent-driven-development` để thực hiện: mỗi task BC-N một subagent, rà soát xong mới sang task sau.
  - `test-driven-development` cho mỗi task có logic (BC-1, BC-4) và cho phần dữ liệu của BC-2, BC-3, BC-5.
  - `brainstorming` **trước BC-2** nếu chủ sản phẩm có mặt để chốt **D9-a/b/c** (xem BC-2). Nếu chủ sản phẩm vắng thì làm theo mặc định đã ghi và nêu trong mô tả PR.
  - `verification-before-completion` trước mọi câu "xong" hay "xanh".
  - `requesting-code-review` sau mỗi task và trước khi mở PR.
  - `finishing-a-development-branch` khi kết thúc.
- **ponytail**
  - Gõ `/ponytail lite` ở đầu phiên, vì PR có sửa giao diện.
  - Chạy `/ponytail-review` trước khi mở PR.
  - Liệt kê mọi chú thích `ponytail:` trong mô tả PR.
  - Không cắt bớt kiểm tra dữ liệu nhập hay phân quyền.
- **impeccable**
  - L2 và D8/D9: chạy `layout` và `clarify` trên `MeetingPage.tsx`.
  - L3 (hàng bộ lọc và chip): chạy `layout` trên `AccountsAdmin.tsx`.
  - Trước khi mở PR: chạy `audit` cho hai màn đã sửa.
  - Không chạy `init`, `document` hay `hooks on`.

## Hiện trạng đã đọc code (03/10)
- `web/src/modules/worklist/MeetingPage.tsx`:
  - **Thanh điều khiển** ở dòng 115-127. Gồm `WeekPicker` (có nhãn riêng), một `<select>` "Kỳ" Tuần/Tháng nằm trong `<label>` có nhãn trên, và link "Giao việc ở Vận hành ›" (`self-center pb-2`). Thanh dùng `flex-wrap items-end`, nên ba cụm lệch hàng nhau.
  - **Kỳ tháng** được tính ở dòng 78-82 (`YYYY-MM`) và hiện thô `{board.data.scope.month}` ở dòng 132 (**D8**).
  - **Ba số trạng thái** ở dòng 156-172. Số đếm bằng 0 thì nút `disabled` và mờ `opacity-40`, nên trông như đang bị khoá (L2.2). Ba số được lọc từ `locTrangThai` (dòng 59, 110).
  - **Ma trận** ở dòng 175-214, 5 cột. Ô trống hiện `—` (`OTaBang`, dòng 251).
  - **`ChonViec`** ở dòng 393-436. Đơn vị không có chi nhánh (Tutor) chỉ liệt kê việc "Toàn hệ thống" (dòng 404-405). Đây là hệ quả của việc "không có bộ lọc chi nhánh" (`2026-10-01-pr-don-ma-thua-quyen.md:3`, mục 12d).
- Máy chủ `visibleUnits` (`server/src/worklist/meeting.ts:37-44`):
  - Quản trị hệ thống (`scope.all`) thấy mọi đơn vị.
  - Vai khác thấy đơn vị của chi nhánh mình **cộng thêm** đơn vị `branch_id IS NULL` (Tutor part-time).
  - Seed có 5 đơn vị chi nhánh (MB, BC, CP, HD, UB), mỗi chi nhánh một đơn vị, và 1 đơn vị `TUTOR` (`server/src/seed/seed.ts:45-52`).
  - `Unit.branchId` đã có ở web (`MeetingPage.tsx:28`), nhưng **không có tên chi nhánh**. Tên lấy từ `/ref/branches`, theo cách `AccountsAdmin` đang dùng.
- `/signals` đã nhận `branchId` (`routes/index.ts:616-618`), và `SignalList` cũng đã nhận `branchId` (`SignalList.tsx:29`). `/tasks` nhận `unitId` (`routes/index.ts:1855-1862`).
- `web/src/modules/platform/AccountsAdmin.tsx`:
  - Lọc "Đang dùng / Đã xoá" ở dòng 41-43 và 63-67. Card "Tài khoản" ở dòng 89-98.
  - Bảng ở dòng 99-140. Cột "Quyền cấp riêng" ở dòng 102 (th) và 125-132 (td), hiện `—` khi `extra` rỗng (**J10**).
  - `ROLES` chỉ có `system_admin | manager | teacher` (`shared/domain/people.ts:16-20`), **không có "Admin CN"** (xem Giả định G2).
- `hienONgay('2026-09', 'thang')` trả `09/2026` (`shared/domain/oNgay.ts:92-95`, đã export qua `index.ts:50`).

---

### Task BC-1: Hàm thuần cho Báo cáo đơn vị (D9 và ba số)  · skill: `test-driven-development`

**Files:**
- Create: `shared/domain/baoCaoDonVi.ts`
- Modify: `shared/domain/index.ts` (thêm `export * from './baoCaoDonVi.ts';` ở cuối)
- Create: `server/src/tests/prBc.tests.ts`
- Modify: `server/src/tests/run.ts` (thêm khối PR-BC sau khối PR-PH)
- Modify: `CODE_MAP.md` (thêm 2 file mới)

**Interfaces:**
- Produces:
  ```ts
  export type DonViBaoCao = { unitId: number; branchId: number | null; trangThai: { ma: 'da-nop' | 'nhap' | 'chua' } };
  /** 'tat-ca' | 'tutor' (đơn vị không thuộc chi nhánh) | id chi nhánh dạng chuỗi */
  export type LocChiNhanhBaoCao = string;
  export function locDonViBaoCao<U extends DonViBaoCao>(units: U[], loc: { chiNhanh: LocChiNhanhBaoCao; trangThai: U['trangThai']['ma'] | null }): U[];
  export function demTrangThaiDonVi(units: DonViBaoCao[]): { daNop: number; nhap: number; chua: number };
  export function luaChonChiNhanhBaoCao(units: DonViBaoCao[], branches: { id: number; name: string }[]): { key: string; nhan: string; so: number }[];
  ```
- Luật:
  - `chiNhanh = 'tat-ca'` thì lấy mọi đơn vị. `'tutor'` lấy các đơn vị có `branchId === null`. Một id chi nhánh chỉ lấy **đơn vị của chi nhánh đó** (không kèm Tutor; xem D9-a).
  - Ba số đếm theo tập **đã lọc chi nhánh**, nhưng **chưa lọc trạng thái**. Nhờ vậy, khi bấm một chip thì hai chip còn lại vẫn đọc được số.
  - Danh sách lựa chọn chỉ gồm chi nhánh **có trong `units`**. Người dùng chỉ thấy cái máy chủ đã cho, nên không lộ chi nhánh khác. Thứ tự là "Tất cả" trước, sau đó các chi nhánh theo thứ tự trong `units`, rồi "Tutor part-time" nếu có.
  - Có ít hơn 3 lựa chọn thực (không tính "Tất cả") thì trả `[]`, và giao diện ẩn bộ lọc. Quản lý một chi nhánh chỉ thấy MB và Tutor, nên với họ bộ lọc là thừa.

- [x] **Step 1: Viết phép kiểm đỏ.** Tạo `server/src/tests/prBc.tests.ts`:

```ts
/** PHÉP KIỂM PR-BC — Báo cáo đơn vị (D8, D9) + Quản trị › Tài khoản (L3, J10). Luật thuần, gọi thẳng `shared/domain`. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrBcTests(t: Pick<YThucTestKit, 'check' | 'assert'>) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');

  const U = (unitId: number, branchId: number | null, ma: 'da-nop' | 'nhap' | 'chua') => ({ unitId, branchId, trangThai: { ma } });
  const units = [U(1, 10, 'da-nop'), U(2, 20, 'chua'), U(3, 30, 'nhap'), U(6, null, 'chua')];
  const branches = [{ id: 10, name: 'Monbay' }, { id: 20, name: 'Bãi Cháy' }, { id: 30, name: 'Cẩm Phả' }, { id: 40, name: 'Uông Bí' }];

  check('PR-BC D9 · lọc chi nhánh: id chi nhánh chỉ ra đơn vị chi nhánh đó; "tutor" chỉ ra đơn vị không chi nhánh; "tat-ca" ra hết', () => {
    assert(d.locDonViBaoCao(units, { chiNhanh: '10', trangThai: null }).map((u: any) => u.unitId).join() === '1', 'MB → chỉ đơn vị 1');
    assert(d.locDonViBaoCao(units, { chiNhanh: 'tutor', trangThai: null }).map((u: any) => u.unitId).join() === '6', 'tutor → chỉ đơn vị 6');
    assert(d.locDonViBaoCao(units, { chiNhanh: 'tat-ca', trangThai: null }).length === 4, 'tất cả → 4');
  });
  check('PR-BC D9 · lọc chi nhánh + trạng thái cùng lúc; chi nhánh lạ (không có trong units) → rỗng, không lộ gì', () => {
    assert(d.locDonViBaoCao(units, { chiNhanh: 'tat-ca', trangThai: 'chua' }).map((u: any) => u.unitId).join() === '2,6', 'chưa báo cáo → 2,6');
    assert(d.locDonViBaoCao(units, { chiNhanh: '20', trangThai: 'da-nop' }).length === 0, 'BC + đã nộp → rỗng');
    assert(d.locDonViBaoCao(units, { chiNhanh: '40', trangThai: null }).length === 0, 'UB không có trong units → rỗng');
  });
  check('PR-BC D9 · ba số đếm theo tập đã lọc chi nhánh (chưa lọc trạng thái)', () => {
    const n = d.demTrangThaiDonVi(d.locDonViBaoCao(units, { chiNhanh: 'tat-ca', trangThai: null }));
    assert(n.daNop === 1 && n.nhap === 1 && n.chua === 2, JSON.stringify(n));
  });
  check('PR-BC D9 · lựa chọn chi nhánh chỉ gồm chi nhánh có đơn vị đang thấy + Tutor; < 3 lựa chọn thực → [] (ẩn bộ lọc)', () => {
    const lc = d.luaChonChiNhanhBaoCao(units, branches);
    assert(lc.map((x: any) => x.key).join() === 'tat-ca,10,20,30,tutor', lc.map((x: any) => x.key).join());
    assert(lc[0].nhan === 'Tất cả' && lc[0].so === 4 && lc[4].nhan === 'Tutor part-time' && lc[4].so === 1, JSON.stringify(lc));
    assert(!lc.some((x: any) => x.key === '40'), 'không liệt kê chi nhánh không có đơn vị trong phạm vi');
    assert(d.luaChonChiNhanhBaoCao([U(1, 10, 'chua'), U(6, null, 'chua')], branches).length === 0, 'QL một chi nhánh → ẩn bộ lọc');
  });
  check('PR-BC D8 · kỳ tháng hiện "09/2026", không "2026-09"', () => {
    assert(d.hienONgay('2026-09', 'thang') === '09/2026', d.hienONgay('2026-09', 'thang'));
  });
}
```

Trong `server/src/tests/run.ts`, thêm khối sau khối PR-PH (trước `console.log(\`\n${'='.repeat(60)}\`)`):

```ts
// ==================================================================== PR-BC (Báo cáo đơn vị + Quản trị › Tài khoản)
const { runPrBcTests } = await import('./prBc.tests.ts');
await runPrBcTests({ check, assert });
```

- [x] **Step 2: Chạy `npm test`.** Kết quả mong đợi: các phép D9 **ĐỎ** (`d.locDonViBaoCao is not a function`). Phép D8 xanh ngay, vì hàm đã có; đây là phép bảo vệ chống hồi quy.

- [x] **Step 3: Viết `shared/domain/baoCaoDonVi.ts`:**

```ts
/**
 * BÁO CÁO ĐƠN VỊ — luật lọc ở trình duyệt (PR-BC, D9). Máy chủ đã chỉ trả đơn vị người xem được thấy
 * (`visibleUnits`); ở đây chỉ THU HẸP, không bao giờ mở rộng.
 */
export type DonViBaoCao = { unitId: number; branchId: number | null; trangThai: { ma: 'da-nop' | 'nhap' | 'chua' } };
export type LocChiNhanhBaoCao = string;

const khopChiNhanh = (u: DonViBaoCao, cn: LocChiNhanhBaoCao) =>
  cn === 'tat-ca' ? true : cn === 'tutor' ? u.branchId === null : u.branchId !== null && String(u.branchId) === cn;

export function locDonViBaoCao<U extends DonViBaoCao>(units: U[], loc: { chiNhanh: LocChiNhanhBaoCao; trangThai: U['trangThai']['ma'] | null }): U[] {
  return units.filter((u) => khopChiNhanh(u, loc.chiNhanh) && (!loc.trangThai || u.trangThai.ma === loc.trangThai));
}

export function demTrangThaiDonVi(units: DonViBaoCao[]): { daNop: number; nhap: number; chua: number } {
  const n = { daNop: 0, nhap: 0, chua: 0 };
  for (const u of units) n[u.trangThai.ma === 'da-nop' ? 'daNop' : u.trangThai.ma === 'nhap' ? 'nhap' : 'chua']++;
  return n;
}

/** Lựa chọn của bộ lọc — chỉ chi nhánh CÓ đơn vị trong `units`. Dưới 3 lựa chọn thực → [] (bộ lọc thừa, ẩn). */
export function luaChonChiNhanhBaoCao(units: DonViBaoCao[], branches: { id: number; name: string }[]): { key: string; nhan: string; so: number }[] {
  const ten = new Map(branches.map((b) => [b.id, b.name]));
  const muc: { key: string; nhan: string; so: number }[] = [];
  for (const u of units) {
    if (u.branchId === null || muc.some((m) => m.key === String(u.branchId))) continue;
    muc.push({ key: String(u.branchId), nhan: ten.get(u.branchId) ?? `Chi nhánh ${u.branchId}`, so: units.filter((x) => x.branchId === u.branchId).length });
  }
  const soTutor = units.filter((u) => u.branchId === null).length;
  if (soTutor) muc.push({ key: 'tutor', nhan: 'Tutor part-time', so: soTutor });
  return muc.length < 3 ? [] : [{ key: 'tat-ca', nhan: 'Tất cả', so: units.length }, ...muc];
}
```

Thêm `export * from './baoCaoDonVi.ts';` vào cuối `shared/domain/index.ts`.

- [x] **Step 4: Chạy `npm test`.** Kết quả mong đợi: 5 phép PR-BC xanh. Sau đó chạy `npm run check`, kết quả phải xanh.
- [x] **Step 5: Commit.**
  - Lệnh: `git add shared/domain/baoCaoDonVi.ts shared/domain/index.ts server/src/tests/prBc.tests.ts server/src/tests/run.ts CODE_MAP.md && git commit -m "PR-BC BC-1: luật lọc chi nhánh + đếm trạng thái Báo cáo đơn vị (D9), phép kiểm D8"`
  - Kết thúc message bằng các dòng attribution theo system-reminder của phiên.

### Task BC-2: Thanh điều khiển một hàng, Kỳ bằng BoLocDoan, bộ lọc chi nhánh (L2.1, D8, D9)  · skill: impeccable `layout` + `clarify`, `brainstorming` nếu cần chốt D9

**Điểm cần chủ sản phẩm chốt (D9).** Dùng `brainstorming` để hỏi nếu chủ sản phẩm có mặt. Nếu vắng thì làm theo mặc định và ghi trong mô tả PR.
- **D9-a.** Chọn một chi nhánh thì có hiện kèm dòng Tutor part-time không? **Mặc định: không.** Muốn xem Tutor thì chọn "Tutor part-time". Như vậy "lọc Monbay" chỉ ra đúng một dòng Monbay, giống bộ lọc chi nhánh ở Học viên & Lớp (lọc gì ra nấy).
- **D9-b.** Bộ lọc chi nhánh có lọc luôn hai khối thu gọn ở cuối trang không?
  - **Mặc định:** "Việc đang tồn" có lọc (truyền `branchId` vào `SignalList` và `useSignalCount`; khi chọn "Tutor" thì không truyền).
  - "Việc được giao" có lọc (truyền `unitId` của đơn vị đang chọn vào `/tasks?unitId=`).
  - Trước khi làm, đọc `meetingSvc.listTasks` để xác nhận `unitId` lọc đúng. Nếu không đúng thì giữ khối này không lọc và ghi giới hạn vào mô tả PR.
- **D9-c.** Đơn vị Tutor dùng ô "+ Chọn việc" (`ChonViec`, dòng 393-436). Hiện ô này chỉ liệt kê việc "Toàn hệ thống". **Mặc định: giữ nguyên**, vì Tutor không thuộc chi nhánh nào, và trộn việc của chi nhánh vào là trái mục 12d. Nếu chủ sản phẩm muốn "đang lọc Monbay thì Tutor thấy thêm việc Monbay", đó là đổi luật riêng; báo lại, không tự làm.
- **Phân quyền.** Danh sách chi nhánh lấy từ `units` mà máy chủ đã lọc theo vai. Khi đó:
  - GV hay Quản lý một chi nhánh thấy tối đa 2 lựa chọn, nên bộ lọc bị ẩn.
  - Quản trị hệ thống thấy 5 chi nhánh và Tutor.
  - Nếu URL có `?cn=` trỏ tới chi nhánh ngoài phạm vi thì kết quả rỗng: hiện dòng "Không có đơn vị nào khớp bộ lọc" kèm nút "Xoá lọc".

**Files:**
- Modify: `web/src/modules/worklist/MeetingPage.tsx`:
  - dòng 1-13 (import);
  - dòng 58 (`byMonth` chuyển sang đọc từ URL);
  - dòng 102-110 (dữ liệu đã lọc);
  - dòng 114-127 (thanh điều khiển);
  - dòng 129-133 (D8);
  - dòng 217-225 (D9-b).
- Test: `server/src/tests/prBc.tests.ts`. Phần dữ liệu đã có ở BC-1. Bố cục được kiểm bằng ảnh, không quét chuỗi nguồn.

**Interfaces:**
- Consumes: `locDonViBaoCao`, `demTrangThaiDonVi`, `luaChonChiNhanhBaoCao` và `hienONgay` từ `@shared/domain/index.ts`; `BoLocDoan` từ `../../ui/ui.tsx`; `/ref/branches` (`{id, code, name}[]`).
- URL query:
  - `ky=thang` (không có thì là Tuần);
  - `cn=<branchId>|tutor` (không có thì là Tất cả);
  - giữ nguyên `periodId`.
- Cách ghi: `setParams(next, { replace: true })`, theo mẫu `setPeriodId` ở dòng 51-57.

- [ ] *(04/10: impeccable không có trong phiên code — bố cục kiểm bằng ảnh 375/1440)* **Step 1 (impeccable `layout`):** chạy trên `MeetingPage.tsx` để lấy đề xuất. Chỉ áp phần nằm trong L2.1. Không đổi bảng thành thẻ (UX-D7 vẫn hoãn).
- [x] **Step 2: Nối trạng thái vào URL.** Thay dòng 58 `const [byMonth, setByMonth] = useState(false);` bằng:

```ts
  const byMonth = params.get('ky') === 'thang';
  const cn = params.get('cn') ?? 'tat-ca';
  const datParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const branches = useApi<{ id: number; name: string }[]>('/ref/branches');
```

- [x] **Step 3: Đổi dòng 108-110 để dùng hàm thuần:**

```ts
  const units = board.data?.units ?? [];
  const unitsCn = locDonViBaoCao(units, { chiNhanh: cn, trangThai: null });
  const unitsLoc = locDonViBaoCao(units, { chiNhanh: cn, trangThai: locTrangThai });
  const dem = demTrangThaiDonVi(unitsCn);
  const luaChonCn = luaChonChiNhanhBaoCao(units, branches.data ?? []);
  const ew = board.data?.editWindow ?? null;
```

Ở dòng 160, thay `board.data.totals.daNop`, `.nhap` và `.chua` bằng `dem.daNop`, `dem.nhap` và `dem.chua`.

- [x] **Step 4: Thanh điều khiển một hàng.** Thay dòng 115-127 bằng đoạn dưới:
  - Khi ≥ 640 px: thanh nằm trên một hàng, căn theo đường cơ sở. Link nằm bên phải (`sm:ml-auto`).
  - Khi < 640 px: các cụm tự xuống dòng (`flex-wrap`), không tràn ngang. UX-D7 vẫn hoãn.

```tsx
      <div className="flex flex-wrap items-center gap-2">
        <WeekPicker periodId={periodId} onPeriod={setPeriodId} label={null} />
        <span className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Kỳ</span>
          <BoLocDoan ariaLabel="Kỳ báo cáo" value={byMonth ? 'thang' : 'tuan'}
            onChange={(k) => datParam('ky', k === 'thang' ? 'thang' : null)}
            muc={[{ key: 'tuan', nhan: 'Tuần' }, { key: 'thang', nhan: 'Tháng', title: 'Đọc lại cả tháng chứa tuần đang chọn — chỉ để đọc' }]} />
        </span>
        {luaChonCn.length > 0 && (
          <span className="flex items-center gap-1.5 max-w-full">
            <span className="text-xs text-slate-400">Chi nhánh</span>
            <BoLocDoan ariaLabel="Lọc chi nhánh" value={cn} onChange={(k) => datParam('cn', k === 'tat-ca' ? null : k)} muc={luaChonCn} />
          </span>
        )}
        {/* Câu 1 = A (K1-36): MỘT cửa giao việc ở Vận hành — ở đây chỉ còn đường dẫn. */}
        <Link to="/cong-viec/van-hanh?tao=1" className="link text-xs sm:ml-auto">Giao việc ở Vận hành ›</Link>
      </div>
```

  - Trước khi bỏ nhãn của `WeekPicker` bằng `label={null}`, kiểm `Filters.tsx:80-` xem `label={null}` có ẩn nhãn không (kiểu đã cho `string | null`). Nếu `WeekPicker` không có nút "Tuần này" mà L2 nhắc tới, đọc phần thân `WeekPicker` để tìm. Nếu không có thì **không thêm**, và ghi vào mô tả PR.
  - Nhãn cũ "Tuần bất kỳ trong tháng" (dòng 117) được chuyển thành `title` của nút "Tháng" (impeccable `clarify`).
- [x] **Step 5 (D8):** sửa dòng 132, thay `<strong>{board.data.scope.month}</strong>` bằng `<strong>{hienONgay(board.data.scope.month, 'thang')}</strong>`.
- [x] **Step 6 (D9-b):** sửa dòng 217-225 như sau.
  - Gọi `useSignalCount(periodId, cnBranchId)` và `<SignalList periodId={periodId} branchId={cnBranchId} />`. Trong đó `cnBranchId = /^\d+$/.test(cn) ? Number(cn) : null`.
  - Thêm tham số `branchId` vào `useSignalCount` ở dòng 233-236, và đưa nó vào URL lẫn danh sách phụ thuộc.
  - Với "Việc được giao": xem điều kiện ở D9-b. Nếu `unitId` không lọc đúng thì giữ nguyên khối này.
- [x] **Step 7: Kiểm tra.** Chạy `npm run check` (phải xanh). Sau đó chạy `npm run seed && npm run dev` và kiểm như sau:
  - Mở Quản trị hệ thống, chọn "Bãi Cháy". Bảng còn 1 dòng, ba số đổi theo, URL có `cn=`. Tải lại trang thì bộ lọc vẫn giữ.
  - Chuyển sang "Tháng". Câu phụ phải ghi "Đang đọc cả tháng **10/2026**".
  - Đăng nhập Quản lý MB. Không có bộ lọc chi nhánh.
  - Đăng nhập GV. Màn vẫn mở được như trước.
- [x] **Step 8: Commit** với message `PR-BC BC-2: thanh điều khiển Báo cáo đơn vị một hàng, Kỳ bằng BoLocDoan, kỳ tháng 09/2026 (D8), lọc chi nhánh (D9)`.

### Task BC-3: Ba số đọc rõ và bảng rỗng một dòng (L2.2, L2.3)  · skill: impeccable `clarify`

**Files:**
- Modify: `web/src/modules/worklist/MeetingPage.tsx`, dòng 156-172 (ba số) và 175-180 (Card ma trận).

**Interfaces:**
- Consumes: `dem` từ BC-2; `ew.opensOn` và `ew.closesOn`; `fmtThu` và `fmtDate` (đã import ở dòng 12).

- [x] **Step 1: Ba số thành chip lọc.** Ba số vẫn lọc được bằng `locTrangThai`, nên chúng thành chip có trạng thái. Thay phần thân `map` ở dòng 160-171 bằng:

```tsx
              const active = locTrangThai === ma;
              return (
                <button key={ma} type="button" aria-pressed={active}
                  className={`chip ${active ? 'chon' : ''} flex items-baseline gap-1 min-h-[40px] sm:min-h-0`}
                  onClick={() => setLocTrangThai(active ? null : ma)}>
                  <strong className="tabular-nums text-sm">{n}</strong>
                  <span>{nhan}</span>
                  {active && <span aria-hidden>✓</span>}
                </button>
              );
```

  - Bỏ `disabled` và `opacity-40`. Số 0 vẫn đọc rõ, và bấm vào thì hiện bảng rỗng có thông báo.
  - Trước khi viết, tìm lớp chip dùng chung bằng `grep -n "chip\|chon-" web/src/index.css`. Nếu đã có lớp `chip` hoặc `chon-*` thì dùng lại. Nếu chưa có thì dùng `NutChon nho chon={active}` (`ui.tsx`), cùng nghĩa "đang chọn" theo `HE_GIAO_DIEN.md:42`.
- [x] **Step 2: Bảng rỗng một dòng.** Thêm điều kiện dưới đây ngay trước nhánh `unitsLoc.length === 0` ở dòng 176-177:

```tsx
            {board.data.scope.kind === 'week' && unitsCn.length > 0 && unitsCn.every((u) => u.reported === 0) && !locTrangThai ? (
              <p className="m-0 px-4 py-3 text-sm text-slate-400">
                Chưa đơn vị nào báo cáo{ew?.opensOn && ew?.closesOn ? ` — nộp từ ${fmtThu(ew.opensOn)} ${fmtDate(ew.opensOn)} đến hết ${fmtThu(ew.closesOn)} ${fmtDate(ew.closesOn)}` : ''}.
                {' '}Bấm tên đơn vị bên dưới để mở ô báo cáo.
              </p>
            ) : unitsLoc.length === 0 ? (
```

  - Nhánh rỗng hiện có ghi `Bạn không có đơn vị nào khớp bộ lọc`. Đổi chữ này thành `Không có đơn vị nào khớp bộ lọc`, và thêm nút `Xoá lọc` gọi `setLocTrangThai(null); datParam('cn', null)`.
  - **Lưu ý phân quyền và đường vào ô.** Thay bảng bằng một dòng thì người dùng mất chỗ bấm để mở ô báo cáo đầu tiên của tuần. Vì vậy, dưới câu thông báo phải giữ một danh sách tên đơn vị, mỗi tên là một nút mở ô đầu tiên (`setGanHoi({ unit: u, cell: u.cells[0] })`).
  - Thay thế khác: chỉ thu gọn các cột, giữ cột "Đơn vị" và "Trạng thái". Chọn cách nào cũng phải giữ đường vào ô báo cáo cho người có quyền nộp. Đây là ràng buộc "không bao giờ bớt".
- [x] **Step 3: Kiểm tra.** Chạy `npm run check`. Sau đó kiểm trên tuần chưa có báo cáo và trên tuần seed đã có báo cáo (bảng đầy đủ như cũ). Bấm chip số 0, bảng phải hiện thông báo rỗng kèm nút Xoá lọc.
- [x] **Step 4: Commit** với message `PR-BC BC-3: ba số Báo cáo đơn vị là chip lọc đọc rõ, tuần chưa báo cáo một dòng thay 18 ô "—" (L2)`.

### Task BC-4: Hàm thuần `locTaiKhoan`, nhóm và phân loại (L3)  · skill: `test-driven-development`

**Files:**
- Create: `shared/domain/taiKhoan.ts`
- Modify: `shared/domain/index.ts` (thêm `export * from './taiKhoan.ts';`), `CODE_MAP.md`
- Test: `server/src/tests/prBc.tests.ts` (thêm vào cuối `runPrBcTests`)

**Interfaces:**
- Produces:
  ```ts
  export type TaiKhoanLoc = { id: number; code: string; fullName: string; email: string | null; skills: string[];
    roles: { role: string; branchCode: string | null }[]; extra: unknown[] };
  /** chiNhanh: 'tat-ca' | 'toan-he-thong' | mã chi nhánh; vai: 'tat-ca' | Role; kyNang: 'tat-ca' | 'L'|'R'|'W'|'S';
   *  phanLoai: null | 'chua-vai' | 'chua-email' | 'chua-ky-nang' */
  export type BoLocTaiKhoan = { chiNhanh: string; vai: string; kyNang: string; q: string; phanLoai: string | null };
  export const BO_LOC_TAI_KHOAN_TRONG: BoLocTaiKhoan;
  export function locTaiKhoan<T extends TaiKhoanLoc>(rows: T[], loc: BoLocTaiKhoan): T[];
  export function nhomTaiKhoan<T extends TaiKhoanLoc>(rows: T[], theo: 'chi-nhanh' | 'vai', tenChiNhanh: Map<string, string>): { key: string; nhan: string; rows: T[] }[];
  export function phanLoaiTaiKhoan(rows: TaiKhoanLoc[]): { 'chua-vai': number; 'chua-email': number; 'chua-ky-nang': number };
  export function coQuyenCapRieng(rows: TaiKhoanLoc[]): boolean;   // J10
  export function docBoLocTaiKhoan(qs: URLSearchParams): BoLocTaiKhoan;  // ?cn=MB&vai=teacher&kn=L&q=..&loai=chua-email
  export function ghiBoLocTaiKhoan(loc: BoLocTaiKhoan): Record<string, string | null>;
  ```
- **Luật khớp:**
  - Vai và Chi nhánh phải khớp trên **cùng một lần cấp vai** (`roles.some(g => vaiKhop(g) && cnKhop(g))`).
  - `branchCode === null` chỉ khớp lựa chọn `toan-he-thong` hoặc `tat-ca`.
  - Tìm kiếm không phân biệt hoa thường hay dấu tiếng Việt, và tìm trong tên, mã và email.
  - Nhóm theo chi nhánh: một người có vai ở 2 chi nhánh nằm ở **cả 2 nhóm**. Người không có vai nằm ở nhóm "Chưa có vai trò".

- [x] **Step 1: Viết phép kiểm đỏ.** Thêm vào cuối `runPrBcTests`:

```ts
  const A = (id: number, roles: [string, string | null][], o: { email?: string | null; skills?: string[]; extra?: unknown[]; ten?: string } = {}) => ({
    id, code: `U${id}`, fullName: o.ten ?? `Người ${id}`, email: o.email === undefined ? `u${id}@pisa.vn` : o.email,
    skills: o.skills ?? ['L'], extra: o.extra ?? [], roles: roles.map(([role, branchCode]) => ({ role, branchCode })),
  });
  const ds = [
    A(1, [['teacher', 'MB']], { ten: 'Nguyễn Thu Hà', skills: ['L', 'R'] }),
    A(2, [['teacher', 'BC'], ['manager', 'MB']]),          // GV ở BC, QL ở MB — KHÔNG phải "GV Monbay"
    A(3, [['teacher', 'MB'], ['teacher', 'CP']], { skills: ['W'] }),
    A(4, [['system_admin', null]], { skills: [] }),
    A(5, [], { email: null, skills: [], extra: [{ permission: 'x' }] }),
  ];
  const L = (o: Partial<{ chiNhanh: string; vai: string; kyNang: string; q: string; phanLoai: string | null }>) => ({ ...d.BO_LOC_TAI_KHOAN_TRONG, ...o });

  check('PR-BC L3 · Giáo viên + Monbay khớp trên CÙNG một lần cấp vai: ra 1 và 3, không ra 2 (GV ở BC + QL ở MB)', () => {
    const r = d.locTaiKhoan(ds, L({ chiNhanh: 'MB', vai: 'teacher' })).map((u: any) => u.id).join();
    assert(r === '1,3', r);
  });
  check('PR-BC L3 · "Toàn hệ thống" chỉ khớp lần cấp branchCode null; chi nhánh cụ thể không khớp vai toàn hệ thống', () => {
    assert(d.locTaiKhoan(ds, L({ chiNhanh: 'toan-he-thong' })).map((u: any) => u.id).join() === '4', 'toàn hệ thống → 4');
    assert(!d.locTaiKhoan(ds, L({ chiNhanh: 'MB' })).some((u: any) => u.id === 4), 'MB không ra admin toàn hệ thống');
  });
  check('PR-BC L3 · kỹ năng, tìm không dấu theo tên/mã/email, phân loại', () => {
    assert(d.locTaiKhoan(ds, L({ kyNang: 'W' })).map((u: any) => u.id).join() === '3', 'kỹ năng W → 3');
    assert(d.locTaiKhoan(ds, L({ q: 'thu ha' })).map((u: any) => u.id).join() === '1', 'tìm "thu ha" khớp "Nguyễn Thu Hà"');
    assert(d.locTaiKhoan(ds, L({ q: 'u5' })).map((u: any) => u.id).join() === '5', 'tìm theo mã');
    assert(d.locTaiKhoan(ds, L({ phanLoai: 'chua-email' })).map((u: any) => u.id).join() === '5', 'chưa có email → 5');
    const pl = d.phanLoaiTaiKhoan(ds);
    assert(pl['chua-vai'] === 1 && pl['chua-email'] === 1 && pl['chua-ky-nang'] === 2, JSON.stringify(pl));
  });
  check('PR-BC L3 · nhóm theo chi nhánh: người 2 chi nhánh ở cả 2 nhóm, đếm đúng; không vai → nhóm "Chưa có vai trò"', () => {
    const g = d.nhomTaiKhoan(ds, 'chi-nhanh', new Map([['MB', 'Monbay'], ['BC', 'Bãi Cháy'], ['CP', 'Cẩm Phả']]));
    const so = Object.fromEntries(g.map((x: any) => [x.nhan, x.rows.map((u: any) => u.id).join()]));
    assert(so['Monbay'] === '1,2,3' && so['Bãi Cháy'] === '2' && so['Cẩm Phả'] === '3', JSON.stringify(so));
    assert(so['Toàn hệ thống'] === '4' && so['Chưa có vai trò'] === '5', JSON.stringify(so));
  });
  check('PR-BC L3 · bộ lọc đọc/ghi URL khứ hồi; giá trị lạ → mặc định (không ném)', () => {
    const loc = L({ chiNhanh: 'MB', vai: 'teacher', kyNang: 'L', q: 'hà', phanLoai: 'chua-email' });
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(d.ghiBoLocTaiKhoan(loc))) if (v) qs.set(k, v as string);
    assert(JSON.stringify(d.docBoLocTaiKhoan(qs)) === JSON.stringify(loc), qs.toString());
    const la = d.docBoLocTaiKhoan(new URLSearchParams('vai=hacker&kn=Z&loai=abc'));
    assert(la.vai === 'tat-ca' && la.kyNang === 'tat-ca' && la.phanLoai === null, JSON.stringify(la));
  });
  check('PR-BC J10 · cột "Quyền cấp riêng" chỉ hiện khi ít nhất một tài khoản có quyền cấp riêng', () => {
    assert(d.coQuyenCapRieng(ds) === true, 'có người 5');
    assert(d.coQuyenCapRieng(ds.slice(0, 4)) === false, 'không ai có → ẩn');
  });
```

- [x] **Step 2: Chạy `npm test`.** Kết quả mong đợi: 6 phép L3/J10 **đỏ**.
- [x] **Step 3: Viết `shared/domain/taiKhoan.ts`:**

```ts
import { ROLES } from './people.ts';

/** QUẢN TRỊ › TÀI KHOẢN — lọc/nhóm/phân loại ở trình duyệt (PR-BC, L3). Không đổi `/admin/accounts`. */
export type TaiKhoanLoc = { id: number; code: string; fullName: string; email: string | null; skills: string[];
  roles: { role: string; branchCode: string | null }[]; extra: unknown[] };
export type BoLocTaiKhoan = { chiNhanh: string; vai: string; kyNang: string; q: string; phanLoai: string | null };
export const BO_LOC_TAI_KHOAN_TRONG: BoLocTaiKhoan = { chiNhanh: 'tat-ca', vai: 'tat-ca', kyNang: 'tat-ca', q: '', phanLoai: null };
const KY_NANG = ['L', 'R', 'W', 'S'];
const PHAN_LOAI = ['chua-vai', 'chua-email', 'chua-ky-nang'] as const;

const boDau = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const cnKhop = (cn: string, g: { branchCode: string | null }) =>
  cn === 'tat-ca' || (cn === 'toan-he-thong' ? g.branchCode === null : g.branchCode === cn);

function thuocPhanLoai(u: TaiKhoanLoc, pl: string): boolean {
  return pl === 'chua-vai' ? u.roles.length === 0 : pl === 'chua-email' ? !u.email : pl === 'chua-ky-nang' ? u.skills.length === 0 : true;
}

export function locTaiKhoan<T extends TaiKhoanLoc>(rows: T[], loc: BoLocTaiKhoan): T[] {
  const q = boDau(loc.q.trim());
  return rows.filter((u) => {
    if (loc.chiNhanh !== 'tat-ca' || loc.vai !== 'tat-ca') {
      /* CÙNG một lần cấp vai phải khớp cả vai lẫn chi nhánh. */
      if (!u.roles.some((g) => (loc.vai === 'tat-ca' || g.role === loc.vai) && cnKhop(loc.chiNhanh, g))) return false;
    }
    if (loc.kyNang !== 'tat-ca' && !u.skills.includes(loc.kyNang)) return false;
    if (loc.phanLoai && !thuocPhanLoai(u, loc.phanLoai)) return false;
    if (q && !boDau(`${u.fullName} ${u.code} ${u.email ?? ''}`).includes(q)) return false;
    return true;
  });
}

export function nhomTaiKhoan<T extends TaiKhoanLoc>(rows: T[], theo: 'chi-nhanh' | 'vai', tenChiNhanh: Map<string, string>, tenVai: (r: string) => string = (r) => r) {
  const nhom = new Map<string, { key: string; nhan: string; rows: T[] }>();
  const them = (key: string, nhan: string, u: T) => {
    const g = nhom.get(key) ?? nhom.set(key, { key, nhan, rows: [] }).get(key)!;
    if (!g.rows.includes(u)) g.rows.push(u);
  };
  for (const u of rows) {
    if (!u.roles.length) { them('chua-vai', 'Chưa có vai trò', u); continue; }
    for (const g of u.roles) {
      if (theo === 'vai') them(g.role, tenVai(g.role), u);
      else if (g.branchCode === null) them('toan-he-thong', 'Toàn hệ thống', u);
      else them(g.branchCode, tenChiNhanh.get(g.branchCode) ?? g.branchCode, u);
    }
  }
  return [...nhom.values()];
}

export function phanLoaiTaiKhoan(rows: TaiKhoanLoc[]) {
  return Object.fromEntries(PHAN_LOAI.map((k) => [k, rows.filter((u) => thuocPhanLoai(u, k)).length])) as Record<(typeof PHAN_LOAI)[number], number>;
}

export const coQuyenCapRieng = (rows: TaiKhoanLoc[]) => rows.some((u) => u.extra.length > 0);

export function docBoLocTaiKhoan(qs: URLSearchParams): BoLocTaiKhoan {
  const vai = qs.get('vai') ?? '';
  const kn = qs.get('kn') ?? '';
  const loai = qs.get('loai') ?? '';
  return {
    chiNhanh: qs.get('cn') || 'tat-ca',
    vai: (ROLES as readonly string[]).includes(vai) ? vai : 'tat-ca',
    kyNang: KY_NANG.includes(kn) ? kn : 'tat-ca',
    q: (qs.get('q') ?? '').slice(0, 100),
    phanLoai: (PHAN_LOAI as readonly string[]).includes(loai) ? loai : null,
  };
}

export function ghiBoLocTaiKhoan(loc: BoLocTaiKhoan): Record<string, string | null> {
  return {
    cn: loc.chiNhanh === 'tat-ca' ? null : loc.chiNhanh, vai: loc.vai === 'tat-ca' ? null : loc.vai,
    kn: loc.kyNang === 'tat-ca' ? null : loc.kyNang, q: loc.q.trim() || null, loai: loc.phanLoai,
  };
}
```

  - Nhãn nhóm "Toàn hệ thống" trùng chữ với chip ở `AccountsAdmin.tsx:122`.
  - Nhóm theo vai: truyền `roleLabel` từ web vào để có nhãn tiếng Việt.
  - Thêm `export * from './taiKhoan.ts';` vào `index.ts`.
  - Trước khi đặt tên hàm, chạy `grep -rn "export function locTaiKhoan\|boDau\|khongDau" shared/domain` để kiểm trùng tên. Nếu đã có hàm bỏ dấu dùng chung thì **dùng lại**, không viết `boDau` mới.

- [x] **Step 4: Chạy `npm test`.** Kết quả mong đợi: mọi phép PR-BC xanh. Sau đó chạy `npm run check`, kết quả phải xanh.
- [x] **Step 5: Commit** với message `PR-BC BC-4: locTaiKhoan/nhomTaiKhoan/phanLoaiTaiKhoan + đọc/ghi URL (L3), coQuyenCapRieng (J10)`.

### Task BC-5: Quản trị › Tài khoản: bộ lọc, chip phân loại, nhóm, URL và ẩn cột rỗng (L3, J10)  · skill: impeccable `layout`

**Files:**
- Modify: `web/src/modules/platform/AccountsAdmin.tsx`:
  - dòng 1-10 (import, thêm `useSearchParams` và `useMemo`);
  - dòng 63-67 (tập dòng);
  - dòng 89-98 (tiêu đề Card và hàng lọc);
  - dòng 99-140 (bảng: nhóm và cột).

**Interfaces:**
- Consumes:
  - `locTaiKhoan`, `nhomTaiKhoan`, `phanLoaiTaiKhoan`, `coQuyenCapRieng`, `docBoLocTaiKhoan`, `ghiBoLocTaiKhoan`, `BO_LOC_TAI_KHOAN_TRONG` và `ROLES`/`roleLabel` từ `@shared/domain/index.ts`;
  - `skillLabel` (`lib/format.ts`), `branches.data` (đã có ở dòng 37), `BoLocDoan`, `HangNhom`.
- URL:
  - `?cn=MB&vai=teacher&kn=L&q=…&loai=chua-email&nhom=chi-nhanh`;
  - lọc Đang dùng / Đã xoá vẫn là state như cũ.

- [ ] *(04/10: impeccable không có trong phiên — làm theo mô tả bước này, kiểm bằng ảnh)* **Step 1 (impeccable `layout`):** đề xuất cho hàng lọc. Hàng lọc nằm **ngay dưới tiêu đề Card**, trên bảng, xuống dòng ở 375 px. Ghi tiêu đề Card là `Tài khoản (n / tổng)` khi đang lọc và `Tài khoản (n)` khi không lọc.
- [x] **Step 2: Nối dữ liệu.** Đổi dòng 63-67 thành:

```ts
  const loc3 = docBoLocTaiKhoan(params);
  const nhomTheo = params.get('nhom') === 'chi-nhanh' || params.get('nhom') === 'vai' ? params.get('nhom') as 'chi-nhanh' | 'vai' : null;
  const goc = loc === 'da-xoa' ? daXoa : dangDung;
  const rows = locTaiKhoan(goc, loc3);
  const dangLoc = JSON.stringify(loc3) !== JSON.stringify(BO_LOC_TAI_KHOAN_TRONG);
  const phanLoai = phanLoaiTaiKhoan(goc);
  const hienQuyenRieng = coQuyenCapRieng(goc);   // J10: theo tập gốc, không theo tập lọc — cột không nhảy khi gõ tìm
  const datLoc = (moi: Partial<typeof loc3>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(ghiBoLocTaiKhoan({ ...loc3, ...moi }))) { if (v) next.set(k, v); else next.delete(k); }
    setParams(next, { replace: true });
  };
```

  - Khai báo `const [params, setParams] = useSearchParams();` ở đầu component, **trước** mọi `return` sớm (dòng 46), để không đổi số hook giữa các lần render (xem chú thích Rules of Hooks ở `MeetingPage.tsx:97-101`).
  - `Account.roles` có `branchCode`, nên `TaiKhoanLoc` khớp kiểu mà không phải đổi gì.
- [x] **Step 3: Hàng bộ lọc.** Đặt hàng này là phần tử đầu tiên trong thân Card, trước `<div className="table-scroll">`:
  - **Chi nhánh:** một `<select className="field w-auto" aria-label="Chi nhánh">` gồm "Tất cả", danh sách `branches.data` (value là `code`) và "Toàn hệ thống" (`toan-he-thong`). Dùng `select` vì có 7 lựa chọn, `BoLocDoan` sẽ tràn ở 375 px. Mẫu là `StudentsPage.tsx:177`.
  - **Vai trò:** `<select aria-label="Vai trò">` gồm "Tất cả" và `ROLES.map(r => roleLabel(r))`.
  - **Kỹ năng:** `BoLocDoan` gồm Tất cả · L · R · W · S, nhãn lấy từ `skillLabel`.
  - **Tìm:** `<input className="field" type="search" placeholder="Tên, mã hoặc email" aria-label="Tìm tài khoản">`. Cập nhật URL khi gõ, dùng `replace`.
  - **Nhóm theo:** `<select aria-label="Nhóm theo">` gồm Không nhóm · Chi nhánh · Vai trò.
  - **Chip phân loại:** "Chưa có vai trò n" · "Chưa có email n" · "Chưa có kỹ năng n". Mỗi chip là `NutChon nho chon={loc3.phanLoai === k}`; bấm lần nữa thì tắt. Chip có số 0 vẫn hiện, chữ thường, không mờ.
  - **Nút `Xoá lọc`** chỉ hiện khi `dangLoc`. Bấm thì xoá `cn`, `vai`, `kn`, `q`, `loai` khỏi URL, nhưng giữ `nhom`.
- [x] **Step 4: Bảng.**
  - **Rỗng do lọc:** `rows.length === 0 && dangLoc` → hiện một dòng `Không có tài khoản nào khớp` kèm nút `Xoá lọc`. Thông điệp cũ ở dòng 109 vẫn giữ cho trường hợp không lọc.
  - **Nhóm** (`nhomTheo` khác null): render `nhomTaiKhoan(rows, nhomTheo, new Map((branches.data ?? []).map(b => [b.code, b.name])), roleLabel)`. Mỗi nhóm có một `HangNhom` làm tiêu đề, ghi `Tên nhóm · n người`, rồi tới các hàng.
    - Tách phần thân một hàng (dòng 111-140) thành `function HangTaiKhoan({ u, ... })` trong cùng file để dùng lại. Đây là refactor trong phạm vi; không đổi markup.
    - Người ở 2 nhóm thì xuất hiện 2 lần. Đặt `key` là `${nhom.key}-${u.id}`.
  - **J10:** bọc `<Th …>Quyền cấp riêng</Th>` (dòng 102) và ô `<td>` ở dòng 125-132 trong `{hienQuyenRieng && …}`. Đổi các `colSpan={6}` thành `colSpan={hienQuyenRieng ? 6 : 5}`.
  - Form sửa tài khoản vẫn giữ mục "Quyền cấp riêng cho người này" (dòng 408); J10 chỉ ẩn cột trong bảng.
- [x] **Step 5: Kiểm tra.** Chạy `npm run check`. Sau đó chạy `npm run seed && npm run dev`, đăng nhập Quản trị hệ thống và kiểm theo 4 tiêu chí L3:
  1. Chọn Giáo viên + Monbay. Số người phải bằng số GV có vai ở MB trong seed. Đối chiếu bằng `sqlite3`, hoặc đếm chip "Giáo viên · Monbay" khi chưa lọc.
  2. Nhóm theo chi nhánh. Người có vai ở 2 chi nhánh nằm ở cả 2 nhóm, và số người mỗi nhóm đếm đúng.
  3. Lọc ra rỗng. Phải hiện "Không có tài khoản nào khớp" kèm nút Xoá lọc.
  4. Ở 375 px, bộ lọc xuống dòng và bảng cuộn trong khung.

  Kiểm thêm:
  - Gửi link `?cn=MB&vai=teacher` sang tab khác thì tab đó mở ra đúng bộ lọc.
  - Seed không có quyền cấp riêng nên cột ẩn. Cấp một quyền riêng cho một người thì cột hiện lại.
  - Đăng nhập Quản lý hoặc GV thì vẫn ra `Forbidden` như cũ.
- [x] **Step 6: Commit** với message `PR-BC BC-5: Quản trị › Tài khoản lọc chi nhánh/vai/kỹ năng/tìm/nhóm + chip phân loại, nhớ trong URL (L3); ẩn cột Quyền cấp riêng khi rỗng (J10)`.

### Task BC-6: Bấm thử, audit, review, mở PR  · skill: `verification-before-completion`, impeccable `audit`, `/ponytail-review`, `requesting-code-review`, `finishing-a-development-branch`

- [x] **Step 1:** `npm run check` phải xanh. Dán dòng tổng kết của `run.ts` vào mô tả PR.
- [x] **Step 2: Bấm thử trên trình duyệt** với `npm run seed && npm run dev`, ở **375 và 1440 px, chế độ sáng và tối, với 3 vai** (Quản trị hệ thống, Quản lý MB, GV). Chụp ảnh các màn sau:
  - **Công việc › Báo cáo đơn vị:**
    - tuần chưa có báo cáo và tuần đã có báo cáo;
    - kỳ Tháng, phải hiện `10/2026` hoặc `09/2026`;
    - lọc chi nhánh "Bãi Cháy" và "Tutor part-time" (chỉ Quản trị thấy);
    - bấm chip số 0.
  - **Quản trị › Tài khoản:**
    - chưa lọc;
    - Giáo viên + Monbay;
    - nhóm theo chi nhánh;
    - lọc ra rỗng;
    - chip "Chưa có email".

  Ở 375 px: không tràn ngang và mọi vùng bấm ≥ 40 px.
- [ ] *(04/10: chưa chạy — impeccable không có trong phiên; để session planning chạy trước khi merge)* **Step 3:** chạy `/impeccable audit` cho `MeetingPage.tsx` và `AccountsAdmin.tsx`. Sửa những gì nằm trong phạm vi PR. Phần ngoài phạm vi thì ghi vào mô tả PR.
- [ ] *(04/10: `/ponytail-review` không có trong phiên — thay bằng một lượt rà soát mã độc lập; không có chú thích `ponytail:`)* **Step 4:** chạy `/ponytail-review`, rồi liệt kê các chú thích `ponytail:` vào mô tả PR. Chạy `requesting-code-review`.
- [x] **Step 5:** chuẩn bị mở PR.
  - Đánh dấu `[x]` các task trong file này.
  - Thêm một dòng vào mục 14 `plan.md`.
  - Kiểm `CODE_MAP.md` đã có 2 file `shared/domain` và 1 file phép kiểm mới.
  - Mở PR từ nhánh `pr-bc-bao-cao-quan-tri` vào `main`. **Không merge.**
  - Mô tả PR báo từng ID (L2.1, L2.2, L2.3, D8, D9-a/b/c, L3, J10): tái hiện được hay bác bỏ, file đã sửa, phép kiểm, ảnh, giới hạn còn lại. Nêu rõ những mặc định D9 chủ sản phẩm chưa chốt.

## Nghiệm thu
- [x] `npm run check` xanh, có 11 phép PR-BC (5 cho D8/D9, 6 cho L3/J10).
- [x] **Báo cáo đơn vị:**
  - Ở ≥ 640 px, thanh điều khiển nằm trên một hàng; "Kỳ" là `BoLocDoan`; link Giao việc căn phải.
  - Ở 375 px, thanh không tràn ngang.
  - Kỳ tháng hiện `MM/YYYY`.
  - Ba số đọc rõ cả khi bằng 0, có `aria-pressed`.
  - Tuần chưa có báo cáo hiện một dòng thông báo thay cho các ô "—", và vẫn còn đường mở ô báo cáo.
- [x] **D9:**
  - Quản trị hệ thống lọc được 5 chi nhánh và Tutor; ba số, ma trận và "Việc đang tồn" đổi theo; lựa chọn nhớ trong URL.
  - Quản lý một chi nhánh và GV không thấy bộ lọc.
  - Không có cách nào xem được đơn vị ngoài phạm vi.
- [x] **Quản trị › Tài khoản:**
  - Đủ 5 bộ lọc và 3 chip phân loại.
  - Vai và chi nhánh khớp trên cùng một lần cấp vai.
  - Nhóm đếm đúng.
  - Trạng thái rỗng có nút Xoá lọc.
  - URL gửi cho người khác mở ra đúng bộ lọc.
- [x] Cột "Quyền cấp riêng" ẩn khi không ai có quyền cấp riêng, và hiện khi có.
- [ ] *(04/10: ảnh đã chụp một phần tổ hợp — xem mô tả PR; chưa chạy audit/ponytail-review)* Có ảnh ở 375 và 1440 px, sáng và tối, cho 3 vai. Đã chạy `/impeccable audit` và `/ponytail-review`. PR đã mở, chưa merge.

## Prompt cho session code

```
/ponytail lite

Làm PR-BC theo docs/superpowers/plans/2026-10-03-pr-bc-bao-cao-quan-tri.md (Task BC-1 → BC-6). Nhánh mới từ main mới nhất: pr-bc-bao-cao-quan-tri.
Đọc trước:
- CLAUDE.md;
- mục Global Constraints, "Skill bắt buộc" và "Hiện trạng" của kế hoạch;
- docs/superpowers/plans/2026-10-03-pr-l1-popover-bao-cao-loc-gv.md mục L2, L3 (KHÔNG làm L1 — thuộc PR-DH);
- thiet-ke/HE_GIAO_DIEN.md.

Thực hiện bằng superpowers:subagent-driven-development, mỗi task một subagent + rà soát.
- Task có logic (BC-1, BC-4): test-driven-development — phép kiểm prBc.tests.ts đỏ trước, đăng ký ở cuối server/src/tests/run.ts.
- Trước BC-2: chủ sản phẩm có mặt thì dùng brainstorming chốt D9-a/b/c. Nếu vắng, làm theo mặc định trong kế hoạch và ghi rõ trong mô tả PR.
- BC-2 và BC-3 (MeetingPage.tsx): impeccable `layout` + `clarify`.
- BC-5 (AccountsAdmin.tsx): impeccable `layout`.
- Không đổi máy chủ, không đổi phân quyền: bộ lọc chỉ thu hẹp cái máy chủ đã cho xem.

Kiểm:
1. npm run check xanh.
2. Bấm thử 375/1440, sáng/tối, 3 vai (Quản trị hệ thống, Quản lý MB, GV) theo BC-6 Step 2, chụp ảnh.
3. /impeccable audit hai màn đã sửa.
4. /ponytail-review, liệt kê chú thích ponytail:.
5. superpowers:verification-before-completion → requesting-code-review → finishing-a-development-branch.

Xong:
- đánh dấu [x] kế hoạch;
- thêm dòng mục 14 plan.md;
- cập nhật CODE_MAP.md;
- mở PR, không merge; mô tả báo từng ID: L2.1, L2.2, L2.3, D8, D9, L3, J10.
```

## Giả định
- **G1.** D9 chỉ lọc ở trình duyệt, vì `units[].branchId` đã có và mỗi chi nhánh đúng một đơn vị. Không thêm `?branchId=` cho `/meeting/board`.
- **G2.** Spec L3 nhắc "Admin CN", nhưng `ROLES` chỉ có `system_admin | manager | teacher` (`people.ts:16`). Bộ lọc Vai trò lấy đúng `ROLES`, không bịa thêm vai.
- **G3.** D9-a/b/c theo mặc định ở BC-2: không kèm Tutor khi chọn chi nhánh; lọc cả "Việc đang tồn" và "Việc được giao" nếu `unitId` lọc đúng; giữ `ChonViec` của Tutor chỉ liệt kê việc "Toàn hệ thống". Bộ lọc ẩn khi có ít hơn 3 lựa chọn thực.
- **G4.** D8 dùng hàm có sẵn `hienONgay(…, 'thang')`, không tạo `thangHien` mới (`thangHien` ở `oNgay.ts:23` là hàm nội bộ).
- **G5.** L2.3: bảng rỗng vẫn phải giữ đường mở ô báo cáo (danh sách tên đơn vị bấm được) để không mất thao tác nộp.
- **G6.** J10: cột ẩn hay hiện tính theo tập gốc (Đang dùng hoặc Đã xoá), không theo tập đã lọc, để cột không nhảy khi gõ tìm.
