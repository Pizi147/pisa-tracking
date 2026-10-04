# PR-QU · Quyền tạo lớp, GVCN phân công GV bộ môn, tạo lớp hàng loạt, màn Quản trị quyền — Kế hoạch (04/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (A) GVCN được tự phân công **GV bộ môn L/R/W/S** cho lớp mình chủ nhiệm, không được đổi ô GVCN. (B) Thêm quyền riêng `class.create` (Tạo lớp), không còn ké `student.edit`. (C) Tạo **nhiều lớp một lần** trong panel "+ Lớp mới" có sẵn: mỗi dòng một lớp, có xem trước và kiểm lỗi, ghi tất cả hoặc không ghi gì, có khoá idempotency. (D) Màn Quản trị quyền dễ hiểu: danh mục chia nhóm và có mô tả, ma trận vai × quyền, cấp quyền riêng theo nhóm, sửa quyền mặc định của vai có hộp xác nhận. Có chặn tự khoá mình (lockout) và chặn vi phạm luật SCH-01.

**Architecture:**
- Máy chủ trước. Thêm quyền `class.create` và `class.assign_subject` ở `shared/domain/people.ts` (`PERMISSIONS`, `PERMISSION_LABEL`, `ROLE_PERMISSIONS`). Migrate hiện có (`server/src/migrate.ts:1324-1354`) tự chèn quyền **mới** và cấp cho đúng vai trong `ROLE_PERMISSIONS`. Thao tác chỉ thêm, chạy lặp được. Có phép kiểm xác nhận điều này.
- `class.assign_subject` **không** cấp cho vai nào. Nó là quyền suy ra trong `teacherAllows` (`server/src/permissions.ts:344-423`): giáo viên có `is_core=1` ở lớp đó thì có quyền này (dùng `isCoreTeacherOf` :588). `setClassTeachers` (`server/src/classes/classes.ts:982-986`) nhận `class.assign` **hoặc** `class.assign_subject`. Trường hợp chỉ có `class.assign_subject` thì máy chủ từ chối mọi thay đổi ở ô GVCN (so ô core trước và sau). Ba luật `kiemTruocPhanCong`, audit và thông báo Quản lý giữ nguyên, thêm `via:'gvcn'` vào audit.
- `taoLopVaPhanCong` (`server/src/classes/intake.ts:603`) được tách thành `kiemDongTaoLop` (thuần kiểm, trả lỗi theo dòng) và `ghiDongTaoLop`. `taoLopHangLoat(p, {rows, idempotencyKey, dryRun})` kiểm mọi dòng (kể cả trùng mã **giữa các dòng** với nhau). Có lỗi thì trả lỗi từng dòng và không ghi gì. Không lỗi thì ghi trong **một** `tx`. Khoá theo mẫu intake (`intake.ts:409`). `POST /classes` (một lớp) gọi lại đường này với `rows:[input]`, giữ nguyên dạng trả về.
- Danh mục quyền là dữ liệu ở `shared/domain/nhomQuyen.ts`, gồm nhóm, mô tả, ghi chú phạm vi, danh sách được cấp riêng và luật cấm. Web và máy chủ dùng chung.
- Web: `ClassCreatePanel.tsx` thêm chế độ nhiều dòng (lưới). `TeacherAssignPanel.tsx` cho GVCN sửa ô bộ môn. `AccountsAdmin.tsx` thay ô chọn quyền phẳng bằng checkbox theo nhóm. Màn Vai trò của Quản trị có thêm ma trận.

**Tech Stack:** React + Tailwind (web/), Express + SQLite/Turso (server/), phép kiểm `server/src/tests/*.tests.ts` chạy qua `run.ts`. `npm run check` = build + test + typecheck.

**Spec:** quyết định chủ sản phẩm 04/10 (A–D), chép trong prompt giao kế hoạch:
- A: GVCN phân công GV bộ môn cho lớp mình chủ nhiệm. Không đổi vai GVCN, vai này vẫn do Quản lý. Giữ ba luật, audit, báo Quản lý.
- B: quyền riêng `class.create`, Quản lý và Quản trị hệ thống có mặc định, cấp riêng được theo người và chi nhánh.
- C: tạo lớp hàng loạt, chọn loại, lộ trình, số và phân công ngay. Mở rộng panel "+ Lớp mới" của PR-LOP (`docs/superpowers/plans/2026-09-28-pr-lop-tao-lop.md`), không làm màn mới.
- D: màn Quản trị quyền (danh mục nhóm, ma trận, cấp riêng có lý do, sửa mặc định vai có xác nhận). Không khoá mất `admin.config`. Cấm cấp `plan.week` cho vai GV (SCH-01).

**Thứ tự:** PR-QU chạy **trước** đợt 1 và trước PR-BC. Xem mục "Phối hợp PR-BC".

## Global Constraints
- CLAUDE.md: tinh chỉnh, không làm lại. Giữ Be Vietnam Pro (chữ số Inter), bảng màu và bố cục Quản trị cùng panel Tạo lớp. Thời gian trên màn dùng **mã tuần** (`W2 OCT`), kể cả cột "Tuần khai giảng" trong lưới.
- Luật S3: không dùng nút "Huỷ" trần. Lưới chưa sửa thì có nút "Đóng". Đã sửa thì có "Huỷ thay đổi" (dùng `chan.huy` của `KhungPanel`).
- Không bao giờ bớt: kiểm quyền (luôn `require_` **trước** khi tra khoá idempotency), kiểm dữ liệu nhập từng dòng, giao dịch tất cả hoặc không, whitelist quyền được cấp riêng ở máy chủ, chặn lockout.
- Migrate an toàn trên Turso đang chạy: chỉ INSERT quyền mới và `role_permissions` mới. Không xoá, không đổi dòng cũ. Chạy lặp được. **Không** gỡ `student.edit` khỏi ai.
- Mỗi task viết phép kiểm trước, chạy cho đỏ, rồi sửa đến khi xanh. Kiểm hành vi, không khớp chuỗi nguồn.
- Hàm mới ở `shared/domain/*` phải re-export qua `shared/domain/index.ts`. `server/src/tests/prQu.tests.ts` phải được import và gọi ở **cuối** `server/src/tests/run.ts` (sau `runPrPhTests`, ~dòng 9058, hoặc sau PR nào merge sau đó).
- Thêm file mới thì cập nhật `CODE_MAP.md` trong cùng commit.
- Nhánh `pr-qu-quyen-tao-lop`. Xong PR: đánh dấu `[x]`, thêm một dòng ở mục 14 `plan.md`, mở PR (không tự merge). Liệt kê mọi chú thích `ponytail:`.
- **Quan sát cho chủ sản phẩm, không sửa:** chú thích của `case.close` (`people.ts:~91`) ghi "GVCN đóng case", nhưng vai teacher không có quyền đó và `teacherAllows` cũng không suy ra. Ghi vào mô tả PR để chủ sản phẩm quyết.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `anthropic-skills:brainstorming` chỉ cho các điểm mở ở mục **Giả định** (G3, G6) nếu chủ sản phẩm chưa trả lời; `anthropic-skills:subagent-driven-development`; gõ `/ponytail lite` (PR có sửa giao diện) |
| Trước QU-6 | `/impeccable critique` cho màn Quản trị hiện tại (Tài khoản, Vai trò) và panel "+ Lớp mới", để lấy danh sách vấn đề |
| Mỗi task | `anthropic-skills:test-driven-development` |
| Lỗi hoặc kiểm đỏ khó hiểu | `anthropic-skills:systematic-debugging` |
| QU-5 (lưới) | `/impeccable layout` (lưới 375/1440) · `/impeccable harden` (bấm đúp, mất mạng, 30 dòng, lỗi từng dòng, rỗng) · `/impeccable clarify` (chữ lỗi dòng) |
| QU-6, QU-7 | `/impeccable layout` (ma trận) · `/impeccable clarify` (mô tả quyền, hộp xác nhận) · `/impeccable harden` (form cấp riêng) |
| Trước khi báo xong mỗi task | `anthropic-skills:verification-before-completion`: chạy `npm run check` và đọc kết quả |
| Cuối PR | `/impeccable audit` → `/ponytail-review` (không bao giờ cắt kiểm tra, phân quyền, bảo mật) → `anthropic-skills:requesting-code-review` → `anthropic-skills:finishing-a-development-branch` (mở PR, không merge) |

---

### Task QU-1: Danh mục quyền theo nhóm + quyền mới (dữ liệu dùng chung)
Skill: test-driven-development · verification-before-completion.

**Files:**
- Create: `shared/domain/nhomQuyen.ts`, `server/src/tests/prQu.tests.ts`
- Modify: `shared/domain/people.ts` (thêm `CLASS_CREATE: 'class.create'`, `CLASS_ASSIGN_SUBJECT: 'class.assign_subject'` gần `CLASS_ASSIGN` :95; nhãn ở `PERMISSION_LABEL` ~:135-160; `ROLE_PERMISSIONS`: `class.create` cho `manager` và `system_admin`); `shared/domain/index.ts`; `server/src/tests/run.ts`; `CODE_MAP.md`.

**Interfaces:**
```ts
// shared/domain/nhomQuyen.ts
export type NhomQuyenKey = 'lich_test' | 'diem' | 'case_sos' | 'y_thuc' | 'hv_lop' | 'duyet' | 'van_hanh' | 'quan_tri';
export const NHOM_QUYEN: { key: NhomQuyenKey; ten: string }[];
// 'Lịch & Test' · 'Điểm & đánh giá' · 'Case/SOS' · 'Ý thức' · 'Học viên & Lớp' · 'Duyệt' · 'Vận hành & báo cáo' · 'Quản trị'
export const MO_TA_QUYEN: Record<PermissionKey, { nhom: NhomQuyenKey; moTa: string; phamVi?: string }>;
// ví dụ score.enter: { nhom:'diem', moTa:'Nhập điểm Mock Test.', phamVi:'GV: chỉ lớp mình dạy, môn mình dạy.' }
/** Quyền suy ra cho GV/GVCN (không nằm trong role_permissions) — giải thích cột GVCN của ma trận. */
export const QUYEN_SUY_RA_GV: { quyen: PermissionKey; ai: 'GV' | 'GVCN'; ghiChu: string }[];
/** Không bao giờ cấp riêng: admin.config. */
export const KHONG_CAP_RIENG: readonly PermissionKey[];
/** Cấm cấp cho vai: { teacher: ['plan.week'] } kèm lý do SCH-01. */
export const CAM_CAP_VAI: Record<string, { quyen: PermissionKey; lyDo: string }[]>;
export function duocCapRieng(k: string): boolean; // có trong PERMISSIONS và không thuộc KHONG_CAP_RIENG
```

- [x] **Bước 1: kiểm đỏ** trong `prQu.tests.ts`:
```ts
import { PERMISSIONS, PERMISSION_LABEL, NHOM_QUYEN, MO_TA_QUYEN, duocCapRieng } from '../../../shared/domain/index.ts';
export function runPrQuTests(ctx: { check: Function; assert: Function; assertThrows: Function; conn: any; P: any }) {
  const { check, assert } = ctx;
  check('QU-1 mọi quyền thuộc đúng một nhóm và có mô tả', () => {
    const nhom = new Set(NHOM_QUYEN.map((n) => n.key));
    for (const k of Object.values(PERMISSIONS)) {
      const m = (MO_TA_QUYEN as any)[k];
      assert(m, `thiếu mô tả ${k}`);
      assert(nhom.has(m.nhom), `${k} nhóm lạ`);
      assert(m.moTa.trim().length > 5 && /[.]$/.test(m.moTa.trim()), `${k} mô tả phải là một câu`);
      assert(PERMISSION_LABEL[k], `thiếu nhãn ${k}`);
    }
    assert(Object.keys(MO_TA_QUYEN).length === Object.values(PERMISSIONS).length, 'mô tả thừa quyền không tồn tại');
  });
  check('QU-1 admin.config không cấp riêng được', () => {
    assert(!duocCapRieng('admin.config') && !duocCapRieng('khong.co') && duocCapRieng('class.create'), 'whitelist sai');
  });
  check('QU-1 migrate cấp class.create cho manager + system_admin, không cho teacher', () => {
    const co = (r: string) => !!ctx.conn.prepare(`SELECT 1 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id
      JOIN permissions p ON p.id=rp.permission_id WHERE r.key=? AND p.key='class.create'`).get(r);
    assert(co('manager') && co('system_admin') && !co('teacher'), 'cấp sai vai');
    assert(!ctx.conn.prepare(`SELECT 1 FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id WHERE p.key='class.assign_subject'`).get(), 'assign_subject không cấp theo vai');
  });
}
```
Đăng ký ở cuối `run.ts`: `import { runPrQuTests } from './prQu.tests.ts';` và `runPrQuTests({ check, assert, assertThrows, conn, P });`.
- [x] **Bước 2:** chạy `npm run check` và thấy đỏ. Viết `nhomQuyen.ts` (đủ mọi quyền, gom theo các nhóm đang ghi trong chú thích ở `PERMISSIONS`). Thêm quyền vào `people.ts`. Chạy lại cho xanh. Chạy migrate hai lần trên DB test, không lỗi và số dòng không đổi.
- [x] **Bước 3:** commit `PR-QU QU-1: danh mục quyền theo nhóm + class.create, class.assign_subject`.

### Task QU-2: `class.create` thay `student.edit` khi tạo lớp
Skill: test-driven-development.

**Files:** Modify `server/src/classes/intake.ts:603-606` (`require_(p, PERMISSIONS.CLASS_CREATE, { branchId }, 'Bạn không có quyền tạo lớp ở chi nhánh này.')`); `server/src/classes/hocVienLop.ts:69` (`coTheTaoLop` dùng `CLASS_CREATE`); `server/src/permissions.ts` (đảm bảo `teacherAllows` **không** trả true cho `class.create`).

- [x] **Bước 1: kiểm đỏ.** (a) Có một tài khoản chỉ có `student.edit` cấp riêng ở chi nhánh X, không có `class.create`: gọi `taoLopVaPhanCong` phải ném lỗi 403, và `coTheTaoLop=false`. (b) GV được cấp riêng `class.create` ở X (qua `user_permissions`) thì tạo lớp được ở X, ở Y thì bị 403. (c) Quản lý X tạo được lớp như trước, nghĩa là các phép kiểm PR-LOP cũ vẫn xanh.
- [x] **Bước 2:** sửa cho xanh. Commit `PR-QU QU-2: tạo lớp cần class.create`.

### Task QU-3: GVCN phân công GV bộ môn (A)
Skill: test-driven-development · systematic-debugging nếu `isCoreTeacherOf` lệch ngữ cảnh lớp.

**Files:** Modify `server/src/permissions.ts:344-423` (`teacherAllows`: `class.assign_subject` với `ctx.classId` thì trả `isCoreTeacherOf(p.userId, ctx.classId)`); `server/src/classes/classes.ts:982-986` (`setClassTeachers`); `classes.ts:791,861,901` (`canAssign` của viewer tách ra `canAssign` (toàn bộ) và `canAssignSubject`); `server/src/routes/index.ts:~354-357` (`/ref/teachers`: chấp nhận `class.assign` **hoặc** người gọi là GVCN của `?classId=`, lọc GV theo chi nhánh của lớp đó).

**Interfaces:**
```ts
// classes.ts — trong setClassTeachers
const full = can(p, PERMISSIONS.CLASS_ASSIGN, { branchId: cls.branch_id });
if (!full) {
  require_(p, PERMISSIONS.CLASS_ASSIGN_SUBJECT, { classId: cls.id, branchId: cls.branch_id },
    'Chỉ Quản lý hoặc GVCN của lớp mới phân công giáo viên.');
  if (doiOCore(cu, moi)) throw forbidden('GVCN chỉ đổi được GV bộ môn. Đổi GVCN thì nhờ Quản lý.');
}
// ... kiemTruocPhanCong (giữ), ghi, writeAudit({... meta: { via: full ? 'quan_ly' : 'gvcn', truoc, sau }}), báo Quản lý chi nhánh khi via='gvcn'
```
- [x] **Bước 1: kiểm đỏ:**
  1. GVCN lớp C đổi GV Reading thì thành công. Có audit `via:'gvcn'`. Có thông báo cho Quản lý chi nhánh.
  2. GVCN lớp C đổi ô GVCN (thêm, bỏ hoặc thay người) thì bị 403 và DB không đổi.
  3. GVCN lớp C sửa lớp D (không chủ nhiệm) thì bị 403.
  4. GV bộ môn của C (không phải core) thì bị 403.
  5. Luật `kiemTruocPhanCong` vẫn chặn GVCN, ví dụ gán GV khác chi nhánh thì bị 400.
  6. `/ref/teachers?classId=C` với GVCN trả đúng GV của chi nhánh C. Không có `classId` thì bị 403.
  7. Viewer lớp C trả `canAssign=false, canAssignSubject=true` cho GVCN.
- [x] **Bước 2:** sửa cho xanh. Commit `PR-QU QU-3: GVCN phân công GV bộ môn lớp mình`.

### Task QU-4: Tạo lớp hàng loạt ở máy chủ (C)
Skill: test-driven-development.

**Files:** Modify `server/src/classes/intake.ts:594-640` (tách hàm, thêm `taoLopHangLoat`); `server/src/routes/index.ts:1082-1085` (`POST /classes` dùng `rows:[body]`); thêm `POST /classes/bulk`; `shared/domain/tenLop.ts` (`goiYSoTiep`).

**Interfaces:**
```ts
export type DongTaoLop = TaoLopInput & { dong: number };
export type LoiDong = { dong: number; truong?: 'so' | 'chuongTrinh' | 'loTrinh' | 'tuan' | 'slots' | 'branchId'; loi: string };
export function taoLopHangLoat(p: Principal, input: { rows: DongTaoLop[]; idempotencyKey?: string; dryRun?: boolean }):
  { ok: true; lop: { dong: number; id: number; code: string }[] } | { ok: false; loi: LoiDong[]; xemTruoc: { dong: number; code: string | null }[] };
// shared/domain/tenLop.ts
/** Số tiếp theo cho (chi nhánh, chương trình, lộ trình) từ các mã đã có + các dòng đang soạn. */
export function goiYSoTiep(daCo: string[], dangSoan: string[], tienTo: string): string;
export const TOI_DA_DONG_TAO_LOP = 30;
```
Luật: kiểm quyền theo **từng** chi nhánh của từng dòng (`class.create`, và `class.assign` nếu dòng có slot) **trước** khi tra khoá. Khoá `bulkclass:${userId}:${key}`. Thử lại cùng khoá thì trả đúng kết quả cũ, không tạo thêm. Trùng mã có hai loại: so với DB và so với dòng khác trong lô. Quá 30 dòng hoặc 0 dòng thì trả 400. Lỗi ở dòng thứ N thì **không** có lớp nào được tạo.
- [x] **Bước 1: kiểm đỏ:**
  1. 3 dòng hợp lệ thì tạo đủ 3 lớp có phân công, trong một tx.
  2. Dòng 2 trùng mã với dòng 1 thì `ok:false`, `loi[0].dong===2` và số lớp trong DB không đổi.
  3. Dòng 3 vi phạm luật phân công thì không có lớp nào được tạo.
  4. Gọi hai lần cùng `idempotencyKey` thì chỉ có 3 lớp, lần hai trả cùng id.
  5. Người khác dùng cùng khoá thì không đọc được kết quả của người kia (bị 403 hoặc tạo riêng).
  6. Dòng có chi nhánh ngoài quyền thì bị 403 cho cả lô.
  7. `dryRun:true` không ghi gì và trả `xemTruoc` mã lớp.
  8. `goiYSoTiep(['MB FT LT1 03'], ['04'], …)` trả `'05'`.
  9. `POST /classes` một lớp trả dạng cũ `{id, code}`.
  10. Mô phỏng lỗi giữa tx (`maybeSimulateSaveFailure`) thì không còn dòng nào.
- [x] **Bước 2:** sửa cho xanh. Commit `PR-QU QU-4: tạo lớp hàng loạt một giao dịch, có khoá`.

### Task QU-5: Lưới nhiều dòng trong "+ Lớp mới" (C, web)
Skill: test-driven-development (luật thuần của lưới ở `shared/domain`) · impeccable `layout`, `harden`, `clarify`.

**Files:** Modify `web/src/modules/classes/ClassCreatePanel.tsx` (thêm chế độ nhiều dòng; một dòng là trường hợp riêng của lưới); `web/src/modules/students/StudentsPage.tsx:157,267` (giữ nút, gọi panel); `web/src/modules/classes/TeacherAssignPanel.tsx:30,93-96` (GVCN sửa được ô bộ môn, ô GVCN chỉ đọc kèm chữ "Đổi GVCN: nhờ Quản lý chi nhánh"; bỏ chữ cũ "Admin chi nhánh"); `web/src/modules/classes/DauTrangLop.tsx:115` (hiện nút Phân công khi `canAssign || canAssignSubject`).

Mỗi dòng gồm: chi nhánh (chỉ các chi nhánh có `class.create`), loại/chương trình, lộ trình (chỉ hiện khi FT), số (tự gợi ý bằng `goiYSoTiep`, sửa được, hiện mã cuối như `MB FT LT1 05`), tuần khai giảng (mã tuần), GVCN, L/R/W/S (không bắt buộc). Thao tác nhanh: "+ Thêm n dòng giống dòng trên" (chép dòng, số tự tăng), xoá dòng. Nút "Kiểm tra" gọi `dryRun`, gắn lỗi vào đúng ô của đúng dòng. Nút "Tạo n lớp" chỉ bật khi không còn lỗi. Khoá idempotency tạo một lần cho mỗi lần mở panel (theo `moiKhoaGui` của PR-GVa nếu đã merge, nếu chưa thì dùng `crypto.randomUUID()`). Ở 375px mỗi dòng xếp thành thẻ dọc, không cuộn ngang trang.
- [x] **Bước 1:** kiểm đỏ cho luật thuần `themDongGiong(dong, n)` (số tăng, giữ chi nhánh, chương trình, lộ trình, tuần, GV) và `gopLoiTheoDong` trong `prQu.tests.ts`.
- [x] **Bước 2:** dựng giao diện. Chạy `/impeccable layout`, `harden`, `clarify`. Bấm thử lỗi một dòng, bấm đúp "Tạo", mất mạng rồi "Thử lại" (cùng khoá thì không tạo thêm).
- [x] **Bước 3:** commit `PR-QU QU-5: lưới tạo nhiều lớp + GVCN phân công trên web`.

### Task QU-6: API Quản trị quyền an toàn (D, máy chủ)
Skill: test-driven-development.

**Files:** Modify `server/src/platform/accounts.ts:436` (`setUserPermissions`); `server/src/platform/sysconfig.ts:198-240` (`LOCKED`, toggle vai); `server/src/routes/index.ts` (route quyền: thêm `GET /admin/permissions/matrix`, `GET /admin/roles/:key/permissions/:perm/impact`).

Luật:
- `setUserPermissions`: mỗi `permission` phải qua `duocCapRieng`, nếu không thì trả 400 "Quyền này không cấp riêng được". Chi nhánh phải tồn tại. Ghi chú tối đa 200 ký tự. Audit ghi `{truoc, sau, them, bot}`, không chỉ danh sách mới.
- Toggle vai: không gỡ được `admin.config` khỏi `system_admin` (đã có trong `LOCKED`, kiểm lại). Không bật được quyền thuộc `CAM_CAP_VAI` (ví dụ `teacher` + `plan.week` thì trả 400 kèm lý do SCH-01). `impact` trả số tài khoản đang hoạt động thuộc vai. Audit đã có, thêm `soNguoiAnhHuong`.
- `matrix` trả vai × quyền từ DB, kèm `QUYEN_SUY_RA_GV` cho cột GVCN suy ra.
- [x] **Bước 1: kiểm đỏ:** cấp riêng `admin.config` thì bị 400. Cấp riêng quyền lạ thì bị 400. Audit có `them`/`bot` đúng. Gỡ `admin.config` khỏi `system_admin` thì bị 400. Bật `plan.week` cho `teacher` thì bị 400 và DB không đổi. `impact` đếm đúng. Người không có `admin.config` gọi `matrix` thì bị 403.
- [x] **Bước 2:** sửa cho xanh. Commit `PR-QU QU-6: whitelist cấp riêng, chặn lockout và SCH-01, ma trận`.

### Task QU-7: Màn Quản trị quyền (D, web)
Skill: impeccable `critique` (đã chạy trước) → `layout`, `clarify`, `harden`.

**Files:** Modify `web/src/modules/platform/AccountsAdmin.tsx:274,312,408-445` (ô chọn phẳng đổi thành checkbox theo `NHOM_QUYEN`, mỗi quyền có mô tả một câu và ghi chú phạm vi, chọn chi nhánh cho từng quyền, ô "Lý do" bắt buộc khi có thay đổi; quyền không cấp riêng được thì ẩn khỏi danh sách); màn Vai trò hiện có (tìm `setRolePermission` ở web) thêm ma trận: cột Quản trị hệ thống, Quản lý, GV, GVCN (suy ra, chỉ đọc, ghi "chỉ lớp chủ nhiệm"). Ô bật/tắt có hộp xác nhận "Ảnh hưởng n tài khoản". Ô bị khoá hiện lý do (lockout, SCH-01).
- [x] **Bước 1:** dựng theo nhóm, mỗi nhóm thu gọn được. Ở 375px ma trận thành danh sách theo nhóm, mỗi quyền một hàng có các chip vai.
- [x] **Bước 2:** chạy `/impeccable clarify` (mô tả quyền dùng ngôn ngữ giáo viên) và `harden` (lưu lỗi thì giữ lựa chọn, bấm đúp).
- [x] **Bước 3:** commit `PR-QU QU-7: màn Quản trị quyền theo nhóm + ma trận`.

## Phối hợp PR-BC
PR-QU merge **trước**. PR-BC (`2026-10-03-pr-bc-bao-cao-quan-tri.md`) phải rebase lên PR-QU. Các vùng PR-QU đụng trong `web/src/modules/platform/AccountsAdmin.tsx`:
- khối cấp quyền riêng ~:274, :312, :408-445 (thay toàn bộ ô chọn phẳng);
- phần import và state của form quyền ở đầu file.
PR-QU **không** đụng hàng bộ lọc và chip (L3, ~:122) hay cột ẩn (J10). Khi rebase, PR-BC giữ khối quyền mới của PR-QU và chỉ đặt lại phần bộ lọc và cột của mình. Thêm một dòng vào kế hoạch PR-BC ở phần "Files" khi session code PR-BC bắt đầu.

## Nghiệm thu
- Bấm thử 375 và 1440, sáng và tối, với 4 vai: **SA** (Quản trị hệ thống), **QL** (Quản lý chi nhánh), **GVCN**, **GV**.
- QL: tạo 3 lớp một lần (FT LT1 và lớp thường) có phân công. Một dòng trùng mã thì báo đúng dòng và không lớp nào được tạo. Bấm đúp thì không tạo trùng.
- GVCN: đổi GV Reading của lớp mình thì được, QL nhận thông báo. Ô GVCN chỉ đọc. Lớp khác thì không thấy nút Phân công.
- GV: không thấy "+ Lớp mới". Sau khi SA cấp riêng `class.create` ở một chi nhánh thì thấy nút và chỉ chọn được chi nhánh đó.
- SA: ma trận hiện đủ nhóm và mô tả. Không gỡ được `admin.config` của mình. Không bật được `plan.week` cho GV và màn hiện lý do. Cấp riêng có lý do, audit có trước và sau.
- `npm run check` xanh. Migrate chạy hai lần không lỗi.

## Prompt cho session code (dán nguyên khối)
```
Repo pisa-tracking, nhánh mới pr-qu-quyen-tao-lop từ main. Thực hiện docs/superpowers/plans/2026-10-04-pr-qu-quyen-tao-lop.md
task theo thứ tự QU-1 → QU-7 bằng anthropic-skills:subagent-driven-development. Gõ /ponytail lite đầu phiên (PR có sửa giao diện).
Mỗi task: test-driven-development (kiểm đỏ rồi xanh), verification-before-completion (npm run check). Kiểm đỏ khó hiểu: systematic-debugging.
Trước QU-5/QU-7: /impeccable critique màn Quản trị (Tài khoản, Vai trò) và panel "+ Lớp mới". QU-5: /impeccable layout, harden, clarify.
QU-7: /impeccable layout, clarify, harden. Cuối PR: /impeccable audit → /ponytail-review → requesting-code-review →
finishing-a-development-branch (mở PR, không merge). Không bao giờ bớt kiểm tra nhập, phân quyền, chống mất dữ liệu, whitelist quyền.
Migrate chỉ thêm. Tests ở server/src/tests/prQu.tests.ts, đăng ký cuối run.ts. Mô tả PR: liệt kê chú thích ponytail:, ghi quan sát
case.close (không sửa), ghi PR-BC phải rebase lên PR-QU. Điểm nào ở mục Giả định chưa được chủ sản phẩm xác nhận thì hỏi trước khi làm task liên quan.
```

## Giả định
- G1: GVCN được nhận diện bằng `teacher_assignments.is_core=1` của lớp (`isCoreTeacherOf` :588). Quyền GVCN phân công bộ môn là quyền **suy ra**, không nằm trong `role_permissions`. Vì vậy không cấp riêng được cho người không chủ nhiệm, và ma trận hiện nó ở cột GVCN dạng chỉ đọc.
- G2: GVCN được thêm, bỏ hoặc thay GV ở ô L/R/W/S, kể cả để trống (L4 cho phép thiếu). Không đụng ô GVCN. Lớp Pre FOU có ô Tổng hợp tự gán theo GVCN (T56), nên coi ô này là ô core và GVCN không sửa được.
- G3 (điểm mở): GVCN phân công thì **báo** Quản lý, không cần Quản lý duyệt. Nếu chủ sản phẩm muốn có bước duyệt thì làm ở PR sau.
- G4: `student.edit` vẫn giữ nguyên ở các vai. Chỉ đường tạo lớp chuyển sang `class.create`. Người đang dùng `student.edit` cấp riêng để tạo lớp sẽ **mất** khả năng tạo lớp cho đến khi được cấp `class.create`. Ghi rõ điều này trong mô tả PR.
- G5: Tạo lớp hàng loạt tối đa 30 dòng một lần. Người tạo lớp tự phân công, nghĩa là dòng có slot cần `class.assign` ở chi nhánh đó. GVCN không tạo lớp.
- G6 (điểm mở): Lô tạo lớp được trộn nhiều chi nhánh nếu người tạo có quyền ở từng chi nhánh. Nếu chủ sản phẩm muốn mỗi lô một chi nhánh thì chỉ khoá ô chi nhánh ở web.
- G7: Danh sách cấm cấp riêng chỉ có `admin.config`. Danh sách cấm cấp theo vai chỉ có `teacher` + `plan.week` (SCH-01). Thêm mục mới vào hai danh sách thì phải có quyết định của chủ sản phẩm.
- G8: Bỏ hẳn chữ "Admin chi nhánh" (vai đã nghỉ) trong `TeacherAssignPanel.tsx`, thay bằng "Quản lý chi nhánh".

## Chủ sản phẩm trả lời 04/10 (ghi đè giả định)
- **G3:** GVCN đổi GV bộ môn **không cần Quản lý duyệt**, chỉ báo Quản lý biết (thông báo + nhật ký). Giữ như giả định.
- **G6:** một lô tạo lớp **được trộn nhiều chi nhánh**, người tạo phải có `class.create` (và `class.assign` nếu có phân công) ở từng chi nhánh. Giữ như giả định.
- **Đóng Case (mới, thêm Task QU-8):** GV bộ môn và GVCN **được đóng Case của môn mình phụ trách**; chỉ cần **báo Quản lý** (thông báo, không duyệt).

### Task QU-8: GVBM / GVCN đóng Case của môn phụ trách
**Skill:** test-driven-development · systematic-debugging (đọc luồng đóng Case hiện tại trước) · impeccable clarify (chữ nút / thông báo)
**Files:** `shared/domain/people.ts` (`case.close` thêm vào quyền GV), `server/src/permissions.ts` `teacherAllows` (nhánh `case.close`), luồng đóng Case ở `server/src/cases/*` (grep `CASE_CLOSE`), thông báo cho Quản lý (theo mẫu thông báo GVCN phân công ở QU-3), `nhomQuyen.ts` (mô tả + phạm vi), phép kiểm `prQu.tests.ts`.
**Luật:**
- Case **học thuật** (có kỹ năng): GV dạy **đúng kỹ năng đó** ở lớp của em đóng được. GVCN đóng được Case học thuật **chỉ khi chính GVCN dạy kỹ năng đó** (C02 giữ: GVCN không xử lý Case trái môn).
- Case **Ý thức** (không kỹ năng): GVCN của lớp em đang học đóng được.
- Quản lý / Quản trị giữ nguyên quyền đóng mọi Case trong phạm vi.
- Đóng xong: gửi thông báo cho Quản lý chi nhánh của lớp ("{GV} đã đóng Case {chủ đề} của {HV}"), ghi audit `case.close` kèm `via:'gv'`.
- Sửa chú thích sai ở `case.close` cho khớp luật mới.
**Phép kiểm (đỏ trước):** GVBM Listening đóng Case Listening → 200 + có thông báo QL; GVBM Listening đóng Case Reading → 403; GVCN không dạy Speaking đóng Case Speaking → 403 (C02); GVCN đóng Case Ý thức lớp mình → 200; GV lớp khác → 403; QL vẫn 200.
**Commit:** `PR-QU (8): GVBM/GVCN đóng Case của môn phụ trách, báo Quản lý`
