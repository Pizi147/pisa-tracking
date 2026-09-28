# PR-NEN · Nền giao diện (ô ngày, "Khác", chọn người, nhãn trạng thái, đang chọn, panel, bàn phím) — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Cả web có **một** kiểu cho mỗi việc lặp lại: một ô ngày gõ được `dd/mm/yyyy` + lịch tự vẽ (`ONgay`, bốn kiểu), một
cách hỏi "Khác" (`OKhac`, ô chữ nhỏ ngay dưới, ≥ 3 ký tự), một ô chọn người mở danh sách ngay (`ChonNguoi`, luôn có dòng "Dùng tên
ngoài hệ thống"), một bộ 6 nhãn trạng thái (`NhanTrangThai`), một kiểu "đang chọn" khác nút chính (`NutChon`, `BoLocDoan`), một
khung panel (`KhungPanel`, bỏ `Drawer`), và dùng được hoàn toàn bằng bàn phím (focus trong panel/menu/lịch, Esc, mũi tên, "Bỏ qua
tới nội dung").
**Architecture:** Luật đọc/ghi ngày, "Khác", trạng thái, phím điều hướng là **hàm thuần** ở `shared/domain` (`oNgay.ts`, `khac.ts`,
`trangThai.ts`, `banPhim.ts`) có phép kiểm. Máy chủ chỉ đổi luật kiểm "Khác" (30 → 3 ký tự, nhận `ghiRoKhac`) và bỏ ngưỡng 3 ký tự
của `/ref/nguoi`. Web dựng thành phần ở `web/src/ui/` trước (ít chồng file), **qua cổng rebase** rồi mới áp vào từng form trong
`web/src/modules/`. Không migrate, không đổi bảng, không đường API mới.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql; phép kiểm `server/src/tests/*`
(harness `check()` của `run.ts`), chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.2 T11, T12 (bản mới 27/09), T13, T14, T66; §4.3 YC-8,
YC-9, YC-10, YC-14; §7.1–7.3, §7.6; §8 dòng PR-NEN; §10.2 · brainstorm `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md` C.2 · rà
`thiet-ke/ra-27-09/K1.md` K1-47 (phần B3), K1-50 (B3), K1-56; K3-08/K3-29 (chỉ dựng `NhanTrangThai`), K3-35 (phần "Khác") ·
kế hoạch cũ `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md` UX-B B3, UX-E E1, E2, E3, E6 · mockup `thiet-ke/mockup/22-pr-nen.html`.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-NEN** · đợt 1 · làn **C** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-nen-nen-giao-dien` · `.claude/worktrees/pr-nen-nen-giao-dien` (từ `origin/main`) |
| Cổng thử | API **4177** · Vite **5377** (không dùng 4000/5173; làn A 4157/5357, làn B 4167/5367 chạy song song) |
| Model | **Fable 5.1 · High** · phương án B: **Opus 5.5 · High** |
| Người rà | **Opus 5.5**, session riêng (T52) — session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Không.** Chỗ cần cột mới (tên ngoài hệ thống của việc Vận hành) chuyển PR khác — Q12 |
| Skill thiết kế | **impeccable**: `init` + `document` ở Task 0b; `audit` rồi `polish` ở Task 11 (cuối PR). **taste-skill `redesign-skill`**: chỉ dùng **bảng kiểm** ở Task 11 (font, `tabular-nums`, độ đậm 500/600, hover/active/focus, trạng thái rỗng/lỗi). **KHÔNG** dùng taste-skill bộ chính, `gpt-tasteskill`, `soft-skill`, `minimalist-skill`, `brutalist-skill`, nhóm vẽ ảnh (đặc tả §7.2) |
| Phụ thuộc | Không chặn khi bắt đầu. **Thứ tự merge N1 → LOP → NEN** (bảng dưới). Task 1–4 làm được trước; Task 5 trở đi qua **cổng rebase** |
| Không làm | chế độ sáng/tối, font, đổi màu token (PR-SANG); migrate; form mới của PR khác |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-NEN (n): …`.
- Treo quá 10 phút → quét tiến trình `node … tests/run.js` còn sống, tắt hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px + **chỉ bàn phím** **một lần** ở Task 11 (Playwright kênh Chrome, đăng nhập
  demo `POST /api/demo/session {userId}`: QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang id 9**),
  ảnh trước/sau lưu `thiet-ke/anh/pr-nen/`. Chạy song song: `PORT=4177` cho API, Vite tạm cổng 5377 trỏ proxy về 4177.
- Không chạm Turso, không deploy, không chạy `migrate`. Gặp mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4177/5377, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.

### Ranh giới file và thứ tự merge (N1 → LOP → NEN)

| File | PR khác sửa gì | PR-NEN làm gì |
|---|---|---|
| `web/src/ui/KhungPanel.tsx` | **N1** Task 6: `conThieu` (:21), chân `DongCanSua` (:69-71), `Truong loi` (:99-114) | Task 4: thêm `useGiuFocus` + `ref`/`tabIndex` ở khung (:37-53) — **giữ cả hai** khi rebase |
| `web/src/ui/ui.tsx` | **N1**: prop `dut?` của `Level` (:102-109) | Task 4: màu `Status doing` (:174-179) + thêm `NutChon`, `BoLocDoan`, `NhanTrangThai` **cuối file** |
| `web/src/ui/loiForm.tsx`, `shared/domain/loiForm.ts` | **N1** dựng | chỉ **dùng** (`useLoiForm`, `LuatTruong`) sau cổng rebase |
| `shared/domain/display.ts` | **N1** Task 1: `DEADLINE_VIEC` (:250-260) + `nhanTuanGhiKetQua` | Task 7: thêm 4 loại hạn vào `DEADLINE_KINDS`/`DEADLINE_VIEC` sau khi rebase |
| Form trong `modules/` (QuickReport, CapNhatTuan, ThaoTacCase, ChuyenLopPanel, LoTrinhTiepPanel, StudentManagePanel, NganCase, RecordViolationPanel, CreateMeasurePanel, ConfirmMeasurePanel, NganXepHangLoat) | **N1** Task 7 áp `useLoiForm` vào khối `thieu` | Task 5–8: ô ngày, `OKhac`, `NutChon` — **chỉ làm sau cổng rebase** (N1 đã merge) |
| `modules/cases/QuickReport.tsx` dòng `toiThieu: primaryCode.endsWith('.other') ? 30 : 15` | **N1** Task 6 viết (ghi chú "PR-NEN bỏ") | Task 6: đổi thành `15` + luật `ghi-ro` ≥ 3 khi "Khác" |
| `modules/yThuc/CaseSosControls.tsx` | **N1** Task 5b chỉ bỏ **chỗ gọi** `PresetPlanActions` | Task 5, 6, 8: ô ngày, `OKhac`, `NutChon` (N1 hứa không sửa file này) |
| `modules/classes/ClassCreatePanel.tsx`, `TeacherAssignPanel.tsx`, `SuaThongTinLopPanel.tsx`, `TransitionPanel.tsx` | **LOP** viết lại/sửa (Drawer → `KhungPanel` ở ClassCreatePanel; TransitionPanel :34-43, 84-130, 186-250, 291-345) | **Task 11 bước "phần chờ LOP"**: chỉ sau khi LOP merge — `NutChon`, `ONgay`, `WeekPicker` mới, TransitionPanel → `KhungPanel` |
| `web/src/ui/Filters.tsx` (`WeekPicker`), `ChonNgay.tsx`, `PeoplePicker.tsx`, `MenuDong.tsx`, `HangTab.tsx`, `Drawer.tsx` | N1, LOP **không sửa** | NEN sở hữu |
| `server/src/tests/run.ts`, `shared/domain/index.ts`, `CODE_MAP.md`, `plan.md`, `thiet-ke/HE_GIAO_DIEN.md` | mọi PR | chỉ thêm dòng đăng ký/export/ghi chú; HE_GIAO_DIEN §3, §4, §9, §10 là phần của NEN |

**Cổng rebase (đầu Task 5):** `git fetch origin` → N1 đã merge vào `main`? Có → `git rebase origin/main`, gỡ xung đột theo bảng
(giữ **cả hai** phần), `npm run check`, ghi Nhật ký. Chưa → **dừng ở cuối Task 4**, báo planning "chờ N1" (không tự áp vào form N1
đang sửa). **Task 11** lặp lại với LOP: LOP chưa merge → làm hết phần còn lại, để bước "phần chờ LOP" + mở PR sau khi LOP merge.

## Global Constraints

- **Tinh tế (chủ sản phẩm):** dấu nhỏ gọn nét mảnh (✓ 10 px, ▾, biểu tượng lịch SVG nét 1.5 px 14 px — không emoji to); cột và hàng
  thẳng — số căn phải, `tabular-nums` cho **mọi** số và ngày; hàng cao đều; không dồn chữ (dòng phụ ≤ 1 dòng, không lặp thông tin).
- **Chữ:** theo `thiet-ke/TU_DIEN_VA_CHU.md` + `THUAT_NGU_DA_CHOT.md`; chữ mới của PR này: `Gần đây`, `Hôm nay`, `Tuần này`,
  `Ghi rõ`, `Dùng tên ngoài hệ thống: …`, `Bỏ qua tới nội dung`, `Không tìm thấy học viên`, 6 nhãn `Cần làm · Đang làm · Chờ duyệt ·
  Quá hạn · Xong · Đã huỷ` — ghi vào TU_DIEN ở Task 10. Chữ mẫu bắt đầu "Ví dụ:".
- **Không lộ chữ máy:** không hiện ISO (`2026-09-28`), mã (`other_proposal`, `.other`), lệnh npm. Ô ngày hiện `dd/mm/yyyy`, tháng
  `mm/yyyy`, tuần `W4 SEP · 21/09 – 27/09`; giá trị gửi máy chủ **luôn ISO**.
- **Ngày nghiệp vụ:** web dùng `useNgayNghiepVu().homNay`, máy chủ `demoToday()`; không `new Date()` không đối số, không `Date.now(`
  trong `ONgay`/`LichNho`/`ChonNgay` (phép kiểm UX3 (3) đang quét).
- **Luật thuần có phép kiểm:** mọi hàm mới ở `shared/domain` có phép kiểm trong `server/src/tests/thanhPhanChung.tests.ts`
  (tạo ở Task 1, `runThanhPhanChungTests(t)`, đăng ký **cuối** `run.ts`, sau dòng của N1/LOP nếu đã có).
- **Không thao tác nào chỉ hiện khi hover.** Ô bấm ≥ 44 px trên điện thoại (`min-h-[44px] sm:min-h-…`). Focus luôn thấy được.
- **Giữ hành vi:** mỗi chỗ ô ngày giữ **đúng luật hiện có** (chỉ `min`/`max` đang có); phép kiểm cũ so chữ cũ thì sửa kỳ vọng
  (cùng điều kiện, không xoá); số phép kiểm không giảm.

## Task 0 · Nhánh, mốc, chép kế hoạch

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-nen-nen-giao-dien -b pr-nen-nen-giao-dien origin/main`.
- [ ] Chép kế hoạch + mockup từ nhánh kế hoạch (bỏ bước này nếu đã có trên `main`):
  `git checkout origin/ke-hoach-dot-1 -- docs/superpowers/plans/2026-09-28-pr-nen-nen-giao-dien.md thiet-ke/mockup/22-pr-nen.html`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** vào Nhật ký. Ghi N1/LOP đã merge chưa (`git log origin/main --oneline -5`).
- [ ] Đối chiếu nhanh dòng mã kế hoạch dẫn (grep `type="date"`, `NgayDoiDuoc`, `<Drawer`, `? 'btn-primary' : ''`,
  `term.length < 3`) — lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-NEN (0): kế hoạch + mockup 22 + mốc {B} phép kiểm`.

## Task 0b · impeccable `init` + `document` (đặc tả §7.2)

**Files:** tạo `PRODUCT.md`, `DESIGN.md` ở gốc repo; `.impeccable/` (đã có trong `.gitignore` dòng cuối — chỉ kiểm, không thêm lần hai).

- [ ] Đọc `C:\Users\Admin\.claude\skills\impeccable\reference\init.md` và `reference\document.md`. Chạy `/impeccable init`.
  Câu hỏi phỏng vấn của skill **đã được chủ sản phẩm trả lời** ở đặc tả §7.1 (duyệt 27/09) — dùng làm vòng trả lời, **không hỏi
  lại** chủ sản phẩm (chủ sản phẩm không đọc mã). PRODUCT.md theo khuôn của `init.md` (giữ nguyên dòng `impeccable:product-schema`):
  `## Platform` = `web`; **Users** = GVBM (nhập điểm, theo Case môn mình; laptop ở trung tâm, điện thoại giữa hai tiết), GVCN (cả
  lớp, vi phạm), QL (duyệt, nhìn chi nhánh), Quản trị (cấu hình); **Product Purpose** = theo dõi học viên IELTS Fast Track + lớp
  thường, Test/Mock Test, SOS–Case–PA, Ý thức; thành công = mở màn nào cũng thấy điều quan trọng nhất + một nút việc tiếp theo;
  **Operating Context** = chế độ Operate, tiếng Việt, nền tối là thói quen, 375 px, bàn phím; **Capabilities and Constraints** =
  luật "tinh tế" (Global Constraints ở trên), không lộ chữ máy, ngày nghiệp vụ; **Brand Commitments** = tên "Pisa Tracking", giữ
  nền xanh mực, thang SOS vàng/cam/đỏ, 4 màu điểm, khuôn `KhungPanel`; **Product Principles** 3–5 dòng từ §7.1 ("không làm":
  chuyển động trang trí, gradient, card lồng card, modal khi panel đủ, màu mới cho từng khu). Không ghi màu/font/thành phần.
- [ ] Bước 5 của `init`: ghi `.impeccable/config.json` `"buildPath": "code"` (PR code, không vẽ ảnh); **không** cấu hình live mode.
- [ ] Chạy `/impeccable document` (scan mode): nguồn `thiet-ke/HE_GIAO_DIEN.md` + `web/src/index.css` + `tailwind.config.js`;
  câu chữ định tính (bước 3) lấy từ HE_GIAO_DIEN §1 và đặc tả §7.1–7.5 — không hỏi lại. Viết `DESIGN.md` (frontmatter token: màu
  `--bg`, `--surface`, `--surface-2`, `--accent`, 8 màu nghĩa, SOS 1–3; chữ; bo góc; thành phần `button-primary`, `button-chon`
  (đang chọn: nền `ink-800` + viền `teal-600`), `field`, `panel`) + sidecar `.impeccable/design.json` (bị gitignore — đúng ý).
  Nếu `DESIGN.md`/`PRODUCT.md` đã có: **không ghi đè**, ghi Nhật ký và dừng bước này.
- [ ] Engine `.exe` của impeccable tải lần đầu bị chặn/lỗi → viết tay hai file theo đúng khuôn trong `init.md`/`document.md`, ghi
  Nhật ký. `git status` không được có file trong `.impeccable/`.
- [ ] `npm run check` → commit `PR-NEN (0b): PRODUCT.md + DESIGN.md (impeccable init/document)`.

## Task 1 · Luật thuần: đọc/ghi ô ngày, "Khác", 6 trạng thái, phím điều hướng (T11, T13, §7.3, E2/E3)

**Files:** tạo `shared/domain/oNgay.ts`, `shared/domain/khac.ts`, `shared/domain/trangThai.ts`, `shared/domain/banPhim.ts`; thêm 4 dòng
`export * from './oNgay.ts';` … vào `shared/domain/index.ts` (sau `export * from './chonNgay.ts';` :48); tạo
`server/src/tests/thanhPhanChung.tests.ts`; đăng ký cuối `server/src/tests/run.ts` (sau `runXoaDuLieuTests` và sau dòng của N1/LOP nếu có).

**Interfaces (Produces)** — chữ ký đầy đủ ở khối mã dưới:
```ts
// oNgay.ts  : KIEU_O_NGAY · KieuONgay ('ngay'|'tuan'|'thang'|'ngay-hoac-thang') · LuatONgay { toiThieu?, toiDa?, moc?: 'dau'|'cuoi', catHomNay? }
//             docONgay(text, kieu, homNay, luat?) → { iso, loi } · loiKhoangNgay · hienONgay(iso, kieu) · phuONgay(iso, kieu, homNay)
//             goiYGanDay(kieu, homNay, luat?) → LuaChon[] ("Gần đây") · luoiThang(nam, thang) → string[][] (hàng = tuần T2→CN)
// khac.ts   : KHAC_TOI_THIEU = 3 · laKhac(ma) · kiemGhiRoKhac(text) → string | null · ghepKhac(ghiRo, moTa)
// trangThai : TRANG_THAI · TrangThai · NHAN_TRANG_THAI · chuTrangThai(t, soNgayQuaHan?) · trangThaiPhoiHop(status) · trangThaiCaseDong(state)
// banPhim   : buocDanhSach(n, i, phim) → number | null · buocVongFocus(n, i, lui) → number · buocLich(iso, phim) → string | null
```

- [ ] **Phép kiểm trước** — tạo `thanhPhanChung.tests.ts`:
```ts
/** PHÉP KIỂM PR-NEN — thành phần chung: ô ngày, "Khác", chọn người, trạng thái, đang chọn, panel, bàn phím (kế hoạch 2026-09-28). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const REPO = path.join(ROOT, '..');
const doc = (f: string) => fs.readFileSync(path.join(REPO, f), 'utf8');
/** Mọi .ts/.tsx dưới `dir` (đường dẫn tương đối, dấu /). Khối 5–9 dùng lại cho phép kiểm quét. */
function tepNguon(dir: string): string[] {
  const out: string[] = [];
  const di = (d: string) => { for (const e of fs.readdirSync(path.join(REPO, d), { withFileTypes: true })) {
    const p = `${d}/${e.name}`; if (e.isDirectory()) di(p); else if (/\.tsx?$/.test(e.name)) out.push(p); } };
  di(dir); return out;
}

export async function runThanhPhanChungTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-NEN · Thành phần chung');
  const H = '2026-09-28'; // Thứ Hai

  check('NEN (1) · docONgay kiểu ngày: dd/mm/yyyy, dd/mm (năm của hôm nay), d/m/yyyy, dấu . và -', () => {
    const ok = (s: string, k: any, iso: string, l?: any) => { const r = d.docONgay(s, k, H, l); assert(r.iso === iso, `${s} → ${JSON.stringify(r)}`); };
    ok('28/09/2026', 'ngay', '2026-09-28'); ok('28/9', 'ngay', '2026-09-28'); ok('1/10/2026', 'ngay', '2026-10-01');
    ok(' 05.10.2026 ', 'ngay', '2026-10-05'); ok('5-10-2026', 'ngay', '2026-10-05');
    const r0 = d.docONgay('   ', 'ngay', H); assert(r0.iso === null && r0.loi === null, 'ô trống không phải lỗi');
  });
  check('NEN (1) · docONgay báo lỗi bằng chữ, không nhận ngày không có thật', () => {
    const loi = (s: string, k: any, cau: string, l?: any) => { const r = d.docONgay(s, k, H, l); assert(r.iso === null && r.loi === cau, `${s} → ${JSON.stringify(r)}`); };
    loi('31/02/2026', 'ngay', 'Ngày không có thật'); loi('abc', 'ngay', 'Gõ dạng dd/mm/yyyy');
    loi('28/09/26', 'ngay', 'Năm cần đủ 4 số, ví dụ 28/09/2026');
    loi('29/09/2026', 'ngay', 'Không được sau hôm nay', { toiDa: H });
    loi('27/09/2026', 'ngay', 'Không được trước hôm nay', { toiThieu: H });
    loi('05/10/2026', 'ngay', 'Không được sau 04/10', { toiDa: '2026-10-04' });
    loi('13/2026', 'thang', 'Gõ dạng mm/yyyy');
  });
  check('NEN (1) · tuần nhảy về Thứ Hai; mốc cuối = Chủ nhật, cắt về hôm nay khi là tuần hiện tại', () => {
    assert(d.docONgay('30/09/2026', 'tuan', H).iso === '2026-09-28', 'T4 → T2');
    assert(d.docONgay('23/09/2026', 'tuan', H, { moc: 'cuoi' }).iso === '2026-09-27', 'cuối tuần trước');
    assert(d.docONgay('28/09/2026', 'tuan', '2026-09-30', { moc: 'cuoi' }).iso === '2026-09-30', 'cắt về hôm nay');
    assert(d.docONgay('28/09/2026', 'tuan', '2026-09-30', { moc: 'cuoi', catHomNay: false }).iso === '2026-10-04', 'hạn tương lai không cắt');
  });
  check('NEN (1) · tháng và ngày-hoặc-tháng: m/yyyy là tháng, dd/mm[/yyyy] là ngày', () => {
    assert(d.docONgay('9/2026', 'thang', H).iso === '2026-09', 'tháng');
    assert(d.docONgay('28/09/2026', 'thang', H).iso === '2026-09', 'gõ cả ngày vẫn lấy tháng');
    assert(d.docONgay('10/2026', 'ngay-hoac-thang', H).iso === '2026-10', 'chỉ tháng');
    assert(d.docONgay('15/10/2026', 'ngay-hoac-thang', H).iso === '2026-10-15', 'ngày');
    assert(d.docONgay('15/10', 'ngay-hoac-thang', H).iso === '2026-10-15', 'ngày thiếu năm');
    const r = d.docONgay('08/2026', 'thang', H, { toiThieu: H }); assert(r.loi === 'Không được trước tháng 09/2026', JSON.stringify(r));
  });
  check('NEN (1) · hiện: ngày dd/mm/yyyy · tháng mm/yyyy · phụ tuần "W4 SEP · 21/09 – 27/09"; không bao giờ ISO', () => {
    assert(d.hienONgay('2026-09-28', 'ngay') === '28/09/2026' && d.hienONgay('2026-10', 'thang') === '10/2026', 'hien');
    assert(d.hienONgay('2026-10', 'ngay-hoac-thang') === '10/2026' && d.hienONgay('', 'ngay') === '', 'hien 2');
    assert(d.phuONgay('2026-09-21', 'tuan', H) === 'W4 SEP · 21/09 – 27/09', d.phuONgay('2026-09-21', 'tuan', H));
    assert(d.phuONgay('2026-09-28', 'ngay', H) === '', 'ngày không có dòng phụ');
  });
  check('NEN (1) · Gần đây theo luật từng chỗ; lưới tháng tròn tuần', () => {
    const g = d.goiYGanDay('ngay', H, { toiDa: H });
    assert(g.length === 5 && g[0].nhan === 'Hôm nay, 28/09' && g[1].giaTri === '2026-09-27', JSON.stringify(g));
    const w = d.goiYGanDay('tuan', H, {});
    assert(w[0].nhan === 'Tuần này' && w[0].giaTri === H && w.length === 3, JSON.stringify(w));
    const tl = d.goiYGanDay('ngay', H, { toiThieu: H });
    assert(tl.length === 5 && tl.every((x: any) => x.giaTri >= H) && tl[0].nhan === 'Hôm nay, 28/09', JSON.stringify(tl));
    const m = d.goiYGanDay('thang', H, {}); assert(m[0].giaTri === '2026-09' && m[0].nhan === 'Tháng này', JSON.stringify(m));
    const l = d.luoiThang(2026, 9);
    assert(l.length === 5 && l[0][0] === '2026-08-31' && l[4][6] === '2026-10-04' && l.every((h: string[]) => h.length === 7), JSON.stringify(l));
  });
  check('NEN (1) · "Khác": ≥ 3 ký tự, nhận ra mọi mã Khác, ghép vào mô tả khi không có cột riêng', () => {
    assert(d.KHAC_TOI_THIEU === 3, 'hằng số');
    for (const m of ['other', 'khac', 'other_proposal', 'student.reading.other']) assert(d.laKhac(m), m);
    for (const m of ['tutor', 'homework', '', null]) assert(!d.laKhac(m as any), String(m));
    assert(d.kiemGhiRoKhac('') === 'Ghi rõ "Khác" là gì' && d.kiemGhiRoKhac(' ab ') === 'Cần ít nhất 3 ký tự (đang có 2)', 'kiem');
    assert(d.kiemGhiRoKhac('Đi muộn giờ ăn') === null, 'đủ');
    assert(d.ghepKhac('Mượn máy bạn', 'Dùng điện thoại trong giờ') === 'Mượn máy bạn — Dùng điện thoại trong giờ', 'ghép');
    assert(d.ghepKhac('Mượn máy', '') === 'Mượn máy' && d.ghepKhac('', 'x y z') === 'x y z', 'một bên trống');
    assert(d.ghepKhac('Mượn máy', 'Mượn máy — lần 2') === 'Mượn máy — lần 2', 'không ghép hai lần khi sửa');
  });
  check('NEN (1) · 6 nhãn trạng thái (brainstorm C.2); Quá hạn luôn kèm số ngày khi biết', () => {
    assert(d.TRANG_THAI.map((x: any) => d.NHAN_TRANG_THAI[x]).join(' · ') === 'Cần làm · Đang làm · Chờ duyệt · Quá hạn · Xong · Đã huỷ', 'nhãn');
    assert(d.chuTrangThai('qua-han', 2) === 'Quá hạn · 2 ngày' && d.chuTrangThai('qua-han') === 'Quá hạn' && d.chuTrangThai('xong', 3) === 'Xong', 'chữ');
    assert(d.trangThaiPhoiHop('pending') === 'can-lam' && d.trangThaiPhoiHop('done') === 'xong' && d.trangThaiPhoiHop('removed') === 'da-huy', 'phối hợp');
    assert(d.trangThaiCaseDong('done') === 'xong' && d.trangThaiCaseDong('no_plan') === 'can-lam' && d.trangThaiCaseDong('open') === 'can-lam'
      && d.trangThaiCaseDong('working') === 'dang-lam' && d.trangThaiCaseDong('dismissed') === 'da-huy', 'case');
  });
  check('NEN (1) · phím: danh sách vòng, Tab vòng trong panel, lịch đi theo ngày/tuần/tháng', () => {
    assert(d.buocDanhSach(3, -1, 'ArrowDown') === 0 && d.buocDanhSach(3, 2, 'ArrowDown') === 0 && d.buocDanhSach(3, 0, 'ArrowUp') === 2, 'vòng');
    assert(d.buocDanhSach(3, 1, 'Home') === 0 && d.buocDanhSach(3, 1, 'End') === 2 && d.buocDanhSach(3, 1, 'a') === null
      && d.buocDanhSach(0, -1, 'ArrowDown') === null, 'khác');
    assert(d.buocVongFocus(4, 3, false) === 0 && d.buocVongFocus(4, 0, true) === 3 && d.buocVongFocus(4, -1, false) === 0, 'tab');
    assert(d.buocLich(H, 'ArrowRight') === '2026-09-29' && d.buocLich(H, 'ArrowUp') === '2026-09-21' && d.buocLich(H, 'End') === '2026-10-04', 'lịch');
    assert(d.buocLich('2026-01-31', 'PageDown') === '2026-02-28' && d.buocLich(H, 'Enter') === null, 'tháng sau kẹp cuối tháng');
  });
}
```
  Đăng ký trong `run.ts` theo mẫu có sẵn, dưới tiêu đề `// ===… PR-NEN (Nền giao diện: ô ngày, Khác, chọn người, trạng thái, panel, bàn phím)`:
  `const { runThanhPhanChungTests } = await import('./thanhPhanChung.tests.ts');` +
  `await runThanhPhanChungTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });`. Chạy → đỏ.
- [ ] **Mã `oNgay.ts`:**
```ts
/**
 * Ô NGÀY THỐNG NHẤT (T11, YC-9) — luật đọc/ghi thuần. Gõ dd/mm/yyyy (nhận dd/mm, d/m/yyyy, dấu . -), tháng mm/yyyy; lịch tự vẽ
 * dùng `luoiThang`. Luật từng chỗ (không sau hôm nay, tuần về Thứ Hai…) truyền qua `LuatONgay`. Không đọc đồng hồ trình duyệt.
 */
import { cuoiTuan, dsNgayGan, dsThang, dsTuan, type LuaChon } from './chonNgay.ts';
import { ngay, tuanLich } from './hienThiNgay.ts';
import { mondayOfDate } from './week.ts';

export const KIEU_O_NGAY = ['ngay', 'tuan', 'thang', 'ngay-hoac-thang'] as const;
export type KieuONgay = (typeof KIEU_O_NGAY)[number];
export type LuatONgay = { toiThieu?: string | null; toiDa?: string | null; moc?: 'dau' | 'cuoi'; catHomNay?: boolean };
export type KetQuaDocNgay = { iso: string; loi: null } | { iso: null; loi: string | null };

const DAY = 86_400_000;
const cong = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const p2 = (x: number | string) => String(x).padStart(2, '0');
function hop(y: number, m: number, d: number): string | null {
  const iso = `${y}-${p2(m)}-${p2(d)}`;
  const t = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== iso ? null : iso;
}
const thangHien = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export function loiKhoangNgay(iso: string, homNay: string, luat: LuatONgay = {}): string | null {
  const la = iso.length === 7;                                   // giá trị là tháng thì so theo tháng
  const cat = (x: string) => (la ? x.slice(0, 7) : x);
  const chu = (x: string) => (la ? `tháng ${thangHien(x)}` : x === homNay ? 'hôm nay' : ngay(x, homNay));
  if (luat.toiDa && iso > cat(luat.toiDa)) return `Không được sau ${chu(luat.toiDa)}`;
  if (luat.toiThieu && iso < cat(luat.toiThieu)) return `Không được trước ${chu(luat.toiThieu)}`;
  return null;
}

export function docONgay(text: string, kieu: KieuONgay, homNay: string, luat: LuatONgay = {}): KetQuaDocNgay {
  const s = text.trim();
  if (!s) return { iso: null, loi: null };
  const phan = s.split(/[/.\-\s]+/).filter(Boolean);
  const mauLoi = kieu === 'thang' ? 'Gõ dạng mm/yyyy' : 'Gõ dạng dd/mm/yyyy';
  if (phan.length < 2 || phan.length > 3 || phan.some((x) => !/^\d{1,4}$/.test(x))) return { iso: null, loi: mauLoi };
  let iso: string | null;
  if (kieu === 'thang' || (kieu === 'ngay-hoac-thang' && phan.length === 2 && phan[1].length === 4)) {
    const [m, y] = phan.length === 3 ? [phan[1], phan[2]] : [phan[0], phan[1]];
    if (y.length !== 4 || +m < 1 || +m > 12) return { iso: null, loi: 'Gõ dạng mm/yyyy' };
    iso = `${y}-${p2(m)}`;
  } else {
    const y = phan[2] ?? homNay.slice(0, 4);
    if (y.length !== 4) return { iso: null, loi: 'Năm cần đủ 4 số, ví dụ 28/09/2026' };
    iso = hop(+y, +phan[1], +phan[0]);
    if (!iso) return { iso: null, loi: 'Ngày không có thật' };
    if (kieu === 'tuan') iso = luat.moc === 'cuoi' ? cuoiTuan(iso, luat.catHomNay === false ? undefined : homNay) : mondayOfDate(iso);
  }
  const loi = loiKhoangNgay(iso, homNay, luat);
  return loi ? { iso: null, loi } : { iso, loi: null };
}

export function hienONgay(iso: string | null | undefined, kieu: KieuONgay): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}$/.test(iso) || kieu === 'thang') return thangHien(iso);
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

export function phuONgay(iso: string | null | undefined, kieu: KieuONgay, homNay: string): string {
  if (kieu !== 'tuan' || !iso) return '';
  const t2 = mondayOfDate(iso);
  return `${tuanLich(t2, homNay)} · ${ngay(t2, homNay)} – ${ngay(cong(t2, 6), homNay)}`;
}

/* goiYGanDay + luoiThang: viết theo mô tả ngay dưới khối này (phép kiểm khối 1 chốt kết quả). */
```
  - `goiYGanDay` — lọc mọi mục qua `loiKhoangNgay`. **tuần**: `dsTuan(homNay, 2, 0)` đảo thứ tự, nhãn `Tuần này · Tuần trước · 2 tuần
    trước`, `moc="cuoi"` đổi giá trị bằng `cuoiTuan`. **tháng**: `toiDa` ≤ tháng này → ba tháng lùi (tháng này, −1, −2), còn lại
    `dsThang(homNay, 3)`; mục đầu nhãn `Tháng này`. **ngày**: `dsNgayGan(homNay, 5)` ("Hôm nay, 28/09" · "Hôm qua, 27/09"…); lọc xong còn
    < 3 mục (chỗ chỉ nhận hôm nay trở đi) → 5 ngày từ hôm nay tới, mục đầu `Hôm nay, dd/mm`.
  - `luoiThang(nam, thang)` — như `monthGrid` cũ (`Filters.tsx:65-78`): bắt đầu từ Thứ Hai của ngày 01, mỗi hàng 7 ngày, dừng khi hàng
    cuối chứa ngày cuối tháng (09/2026 → 5 hàng, 31/08 … 04/10).
- [ ] **Mã `khac.ts`:**
```ts
/** "KHÁC" (T13, YC-8): chọn Khác → ô chữ nhỏ ngay dưới, bắt buộc ≥ 3 ký tự. Thay luật cũ "Khác thì mô tả ≥ 30 ký tự" (V05, cases.ts). */
export const KHAC_TOI_THIEU = 3;
const MA_KHAC = new Set(['other', 'khac', 'other_proposal']);
export function laKhac(ma: string | null | undefined): boolean { return !!ma && (MA_KHAC.has(ma) || ma.endsWith('.other')); }
export function kiemGhiRoKhac(text: unknown): string | null {
  const n = String(text ?? '').trim().length;
  if (n >= KHAC_TOI_THIEU) return null;
  return n === 0 ? 'Ghi rõ "Khác" là gì' : `Cần ít nhất ${KHAC_TOI_THIEU} ký tự (đang có ${n})`;
}
/** Chỗ không có cột riêng cho chữ "Khác" (vi phạm, PA đề xuất — Q9): ghép vào đầu mô tả; sửa lại không ghép hai lần. */
export function ghepKhac(ghiRo: string, moTa: string): string {
  const a = ghiRo.trim(); const b = moTa.trim();
  if (!a) return b;
  if (!b) return a;
  return b === a || b.startsWith(`${a} — `) ? b : `${a} — ${b}`;
}
```
- [ ] **Mã `trangThai.ts`** (chú thích đầu: "NGỮ PHÁP TRẠNG THÁI §7.3 — một dòng một nhãn; màu điểm/SOS không mượn"):
  `NHAN_TRANG_THAI` = `Cần làm · Đang làm · Chờ duyệt · Quá hạn · Xong · Đã huỷ` theo thứ tự `TRANG_THAI`; `chuTrangThai('qua-han', n>0)` →
  `` `Quá hạn · ${n} ngày` ``, còn lại nhãn trơn; `trangThaiPhoiHop`: `done→xong`, `removed→da-huy`, còn lại `can-lam`;
  `trangThaiCaseDong`: `done|closed→xong`, `dismissed|cancelled→da-huy`, rỗng/`open`/`no_plan→can-lam`, còn lại `dang-lam`.
- [ ] **Mã `banPhim.ts`** (thuần, không DOM): `buocDanhSach` — `n ≤ 0 → null`; `ArrowDown` → `i < 0 ? 0 : (i+1) % n`; `ArrowUp` →
  `i < 0 ? n-1 : (i-1+n) % n`; `Home → 0`; `End → n-1`; phím khác `null`. `buocVongFocus` — `i < 0 ? (lui ? n-1 : 0) : (lui ? (i-1+n) % n : (i+1) % n)`.
  `buocLich` — tính trên `Date.UTC` từ `iso`: ←/→ ±1 ngày, ↑/↓ ±7, `Home`/`End` về T2/CN của tuần, `PageUp`/`PageDown` ±1 tháng
  **kẹp ngày cuối tháng** (31/01 → 28/02), phím khác `null`.
- [ ] `npm run check` → xanh → commit `PR-NEN (1): luật thuần ô ngày, "Khác", 6 trạng thái, phím điều hướng`.

## Task 2 · Máy chủ: "Khác" ≥ 3 ký tự ở mọi chỗ kiểm; `/ref/nguoi` bỏ ngưỡng 3 ký tự (T13, T14, M11)

**Files:** `server/src/cases/cases.ts:455-469` (`reportIssue`), `:648-665` (`setIssues`), `:725-745` + thân `recordIntervention`,
`updateResult` (:2715, nhánh thay PA); `server/src/yThuc/violations.ts:116-126, 175-205, 255-266`; `server/src/yThuc/measures.ts:232-237`;
`server/src/yThuc/phoiHop.ts:240, 306`; `server/src/cases/sosAuto.ts:291`; `server/src/routes/index.ts:1699-1701` (chuyển lớp) và các
route truyền thêm `ghiRoKhac` (grep `recordViolation(`, `editViolation(`, `recordIntervention(`, `updateResult(` trong `routes/index.ts`);
`server/src/platform/timNguoi.ts:111-131`; `shared/domain/yThuc.ts:67-69` (xoá `VIOLATION_OTHER_DESCRIPTION_MIN`); sửa kỳ vọng
`server/src/tests/run.ts:6190-6195`, `yThuc.tests.ts:419-430, 492`, `form.tests.ts:131-133`.

**Interfaces (đổi):** thêm tham số tuỳ chọn `ghiRoKhac?: string | null` vào input của `recordViolation`, `editViolation`,
`recordIntervention`, `updateResult` (khi thay PA sang `other_proposal`); `reportIssue`/`setIssues` dùng `observation` sẵn có làm chữ "Khác".

- [ ] **Phép kiểm trước** (khối 2, thêm vào `thanhPhanChung.tests.ts` — dùng `conn`/`P` của kit như `yThuc.tests.ts`; nếu cần học viên
  thì tạo giống `makeStudent` của `yThuc.tests.ts`):
```ts
  check('NEN (2) · máy chủ: Khác cần ≥ 3 ký tự ghi rõ, bỏ luật 30 ký tự; tìm người không cần gõ 3 ký tự', () => {
    const src = doc('server/src/yThuc/violations.ts') + doc('server/src/cases/cases.ts') + doc('shared/domain/yThuc.ts');
    assert(!/VIOLATION_OTHER_DESCRIPTION_MIN|summary\.length < 30/.test(src), 'còn luật 30 ký tự');
    for (const f of ['server/src/yThuc/violations.ts', 'server/src/cases/cases.ts', 'server/src/yThuc/measures.ts',
      'server/src/yThuc/phoiHop.ts', 'server/src/cases/sosAuto.ts', 'server/src/routes/index.ts'])
      assert(/kiemGhiRoKhac\(/.test(doc(f)), `${f} chưa kiểm bằng kiemGhiRoKhac`);
    assert(!/term\.length < 3/.test(doc('server/src/platform/timNguoi.ts')), 'còn ngưỡng 3 ký tự');
  });
```
  cộng một phép kiểm dữ liệu thật trong `yThuc.tests.ts` thay khối V05 (:419-430):
  `recordViolation(gvcn, { studentId, category: 'other', description: 'Không mang sách buổi 12' })` → ném lỗi `/Ghi rõ "Khác" là gì/`;
  thêm `ghiRoKhac: 'Quên sách'` → tạo được, `description` lưu `Quên sách — Không mang sách buổi 12`; `editViolation(... { category:
  'other' })` không có `ghiRoKhac` và mô tả chưa có tiền tố → ném `/Ghi rõ "Khác"/` (thay kỳ vọng `/30 ký tự/` ở :492).
  `run.ts:6192-6194` đổi: `primaryCode: 'student.reading.other'` không `observation` → `/Ghi rõ "Khác" là gì/`; có `observation: 'Đọc
  lướt'` + mô tả 15 ký tự → mở được. `form.tests.ts:131` đổi tên + kỳ vọng: `'PR-NEN · q rỗng/ngắn vẫn trả danh sách (T14)'` —
  `noStudent.json.length > 0` và mọi dòng có `name`.
- [ ] **Mã:**
  - `violations.ts`: `checkDescription(category, description, ghiRoKhac?)` → mô tả vẫn ≥ `VIOLATION_DESCRIPTION_MIN`; `category ===
    'other'` → `const loi = kiemGhiRoKhac(ghiRoKhac ?? (text.includes(' — ') ? text.split(' — ')[0] : ''));` có lỗi →
    ``throw badRequest(`Chọn nhóm "Khác": ${loi}.`)``; trả `ghepKhac(ghiRoKhac ?? '', text)`. Hai chỗ gọi (:203, :265) truyền
    `input.ghiRoKhac` / `patch.ghiRoKhac`. Xoá `VIOLATION_OTHER_DESCRIPTION_MIN` ở `shared/domain/yThuc.ts:69` + chú thích V05 đổi thành
    "V05 (bản T13): nhóm Khác cần ô Ghi rõ ≥ 3 ký tự".
  - `cases.ts` `reportIssue` (:467): thay khối `summary.length < 30` bằng `if (laKhac(primaryCode)) { const loi =
    kiemGhiRoKhac(input.observation); if (loi) throw badRequest(`Phân loại "Khác": ${loi}.`); }`. `setIssues`: cùng kiểm với
    `input.primaryCode`. `backfillCase` nếu có kiểm `.other` riêng (`grep -n "\.other" server/src/cases/cases.ts`) → cùng mẫu.
  - `recordIntervention` / `updateResult` (thay PA): `kind === 'other_proposal'` → `kiemGhiRoKhac(input.ghiRoKhac)` (lỗi →
    `badRequest('PA đề xuất "Khác": …')`), `description = ghepKhac(input.ghiRoKhac ?? '', description ?? '')`.
  - `measures.ts:235`: `const loi = kiemGhiRoKhac(text); if (loi) throw badRequest(`Loại "Khác" — tên phương án: ${loi}.`);`.
  - `phoiHop.ts:240`: `if (kind === 'other') { const loi = kiemGhiRoKhac(name); if (loi) throw badRequest(`Việc loại "Khác": ${loi}.`); }`;
    `:306` và `sosAuto.ts:291`: `if (reasonNeedsText(code)) { const loi = kiemGhiRoKhac(text); if (loi) throw badRequest(`Lý do "Khác": ${loi}.`); }`.
  - `routes/index.ts:1700`: trước `transferReasonText` → `if (laKhac(reasonCode)) { const loi = kiemGhiRoKhac(reasonNote); if (loi)
    throw badRequest(`Lý do "Khác": ${loi}.`); }`. Route ghi vi phạm / thêm PA / ghi kết quả: đọc `ghiRoKhac` từ `req.body` truyền xuống.
  - `timNguoi.ts:111-131`: bỏ nhánh `term.length < 3`; thay bằng
```ts
  const needle = normalizeName(term);
  return nguoiHopLe(nhom, null, branchIds)
    .filter((r) => !needle || normalizeName(r.full_name).includes(needle) || normalizeName(r.code).includes(needle))
    .map(build)
    .sort((a, b) => (a.cungLop !== b.cungLop ? (a.cungLop ? -1 : 1) : a.name.localeCompare(b.name, 'vi')))
    .slice(0, needle ? 12 : 20);
```
    và sửa chú thích đầu file (:12) "Có ngưỡng gõ ≥ 3 ký tự" → "Bấm là có danh sách (T14): chưa gõ → 20 người, GV cùng lớp đứng đầu".
- [ ] `npm run check` → commit `PR-NEN (2): máy chủ — "Khác" ghi rõ ≥ 3 ký tự, bỏ luật 30 ký tự; tìm người không cần gõ trước`.

## Task 3 · Web: `ONgay` + lịch tự vẽ `LichNho`; `ChonNgay*` thành lớp bọc; `WeekPicker` dùng cùng lõi lịch (T11, YC-9, HE §9)

**Files:** tạo `web/src/ui/giuFocus.ts`, `web/src/ui/LichNho.tsx`, `web/src/ui/ONgay.tsx`; viết lại `web/src/ui/ChonNgay.tsx` (131 dòng);
sửa `web/src/ui/Filters.tsx:53-73` (xoá `monthGrid` → dùng `luoiThang`), `:223-372` (popover `WeekPicker` → `<LichNho kieu="tuan" goNgay>`).

**Interfaces:**
```ts
// giuFocus.ts — E2: nhận focus khi mở, giữ Tab bên trong, trả focus về chỗ cũ khi đóng (dùng lại ở Task 4)
export function useGiuFocus(ref: React.RefObject<HTMLElement>): void;
// LichNho.tsx — popover qua portal (fixed, z-[70]) bám dưới `neo`, lật lên khi thiếu chỗ; không bị panel cắt
export function LichNho(p: { kieu: KieuONgay; value: string | null; homNay: string; luat: LuatONgay;
  neo: React.RefObject<HTMLElement>; onChon: (iso: string) => void; onDong: () => void; goNgay?: boolean }): JSX.Element;
// ONgay.tsx — props như mã dưới (kieu, value, onChange, toiThieu, toiDa, moc, catHomNay, goiY, disabled, ariaLabel, id, onBlur, invalid)
```
- [ ] **Phép kiểm trước** (khối 3, quét nguồn):
```ts
  check('NEN (3) · ONgay/LichNho: không ô lịch trình duyệt, không đồng hồ trình duyệt; ChonNgay là lớp bọc; WeekPicker dùng LichNho', () => {
    const ui = ['web/src/ui/ONgay.tsx', 'web/src/ui/LichNho.tsx', 'web/src/ui/ChonNgay.tsx', 'web/src/ui/Filters.tsx'].map(doc).join('\n');
    assert(!/type="date"|type="month"/.test(ui), 'còn ô lịch trình duyệt trong ui/');
    assert(!/new Date\(\)|Date\.now\(/.test(ui), 'đọc đồng hồ trình duyệt');
    const cn = doc('web/src/ui/ChonNgay.tsx');
    assert(!/<select/.test(cn) && /<ONgay/.test(cn) && !/· Đổi|>Đổi</.test(cn), 'ChonNgay chưa là lớp bọc ONgay / còn dòng "hôm nay · Đổi"');
    const f = doc('web/src/ui/Filters.tsx');
    assert(/<LichNho/.test(f) && !/function monthGrid/.test(f), 'WeekPicker chưa dùng LichNho');
    assert(/createPortal/.test(doc('web/src/ui/LichNho.tsx')) && /Gần đây/.test(doc('web/src/ui/LichNho.tsx')), 'lịch không qua portal / thiếu Gần đây');
  });
```
- [ ] **`giuFocus.ts`:**
```ts
import { useEffect, type RefObject } from 'react';
import { buocVongFocus } from '@shared/domain/index.ts';
const O = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
/** Focus vào khung (khung có tabIndex=-1, không bật bàn phím ảo trên điện thoại); Tab/Shift+Tab vòng bên trong; đóng thì trả focus. */
export function useGiuFocus(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const truoc = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    el.focus({ preventScroll: true });
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const ds = [...el.querySelectorAll<HTMLElement>(O)].filter((x) => x.getClientRects().length > 0);
      if (!ds.length) { e.preventDefault(); return; }
      const i = ds.indexOf(document.activeElement as HTMLElement);
      const cuoi = e.shiftKey ? i <= 0 : i === ds.length - 1;
      if (i === -1 || cuoi) { e.preventDefault(); ds[buocVongFocus(ds.length, i, e.shiftKey)].focus(); }
    };
    el.addEventListener('keydown', phim);
    return () => { el.removeEventListener('keydown', phim); if (truoc?.isConnected) truoc.focus({ preventScroll: true }); };
  }, [ref]);
}
```
- [ ] **`LichNho.tsx`** (chép cách đặt vị trí `place()` + nghe `resize`/`scroll` + bấm ngoài của `WeekPicker` Filters.tsx:170-218):
  - Khung `role="dialog" aria-label="Chọn ngày|Chọn tuần|Chọn tháng"`, `ref` + `tabIndex={-1}` + `useGiuFocus`; bề rộng
    `min(320px, 100vw - 16px)`; Esc nghe **pha bắt** + `stopPropagation()` (chỉ đóng lịch, không đóng panel) → `onDong()` + `neo.current?.focus()`.
  - `goNgay` (chỉ `WeekPicker`): ô chữ `Gõ ngày` (`inputMode="numeric"`, placeholder `Ví dụ: 28/09/2026`) — Enter → `docONgay(text,
    'tuan', homNay, luat)` → có `iso` thì `onChon`, không thì hiện `loi` 11 px `text-late` dưới ô.
  - Đầu: `‹` · `Tháng 9/2026` · `›` (nút 44 px trên điện thoại). Kiểu `thang`: đầu là năm `‹ 2026 ›`, thân lưới 3×4 `Th1 … Th12`.
  - Thân (ngày/tuần/ngày-hoặc-tháng): hàng `T2 … CN` 11 px; `luoiThang(nam, thang)`; mỗi ô một `<button>` `tabular-nums`, ngày ngoài
    tháng `text-slate-600`, ngoài luật (`loiKhoangNgay`) `disabled` + `opacity-40`, hôm nay gạch chân, đang chọn nền `bg-ink-800` +
    `ring-1 ring-teal-600`; kiểu `tuan`: cả hàng đang chọn tô nền, bấm ô nào cũng chọn `moc === 'cuoi' ? cuoiTuan(ngày) : mondayOfDate(ngày)`.
  - Bàn phím trong lưới: một ô `tabIndex=0` (đang chọn / hôm nay), còn lại `-1`; `onKeyDown` → `buocLich(iso, e.key)` → đổi ô và
    tháng hiện theo; `Enter`/`Space` chọn.
  - Chân `Gần đây` (chữ 11 px) + các nút `btn btn-sm` từ `goiYGanDay(kieu, homNay, luat)`; kiểu `ngay-hoac-thang` thêm nút
    `Chỉ tháng 09/2026` (chọn `yyyy-mm` của tháng đang xem).
- [ ] **`ONgay.tsx`:**
```tsx
export function ONgay({ kieu, value, onChange, toiThieu, toiDa, moc, catHomNay, goiY, disabled, ariaLabel, id, onBlur, invalid }: Props) {
  const { homNay } = useNgayNghiepVu();
  const luat: LuatONgay = { toiThieu, toiDa, moc, catHomNay };
  const [text, setText] = useState(hienONgay(value, kieu));
  const [loi, setLoi] = useState<string | null>(null);
  const [mo, setMo] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  useEffect(() => { setText(hienONgay(value, kieu)); setLoi(null); }, [value, kieu]);
  const chot = () => {
    const r = docONgay(text, kieu, homNay, luat);
    if (r.iso) { if (r.iso !== value) onChange(r.iso); setText(hienONgay(r.iso, kieu)); }
    else if (!text.trim() && value) onChange('');
    setLoi(r.loi);
  };
  const phu = phuONgay(value, kieu, homNay);
  return (
    <span className="block min-w-0">
      <span className="flex min-w-0 items-stretch gap-1.5">
        <input id={id} className="field min-w-0 flex-1 tabular-nums" inputMode="numeric" autoComplete="off" value={text} disabled={disabled}
          placeholder={goiY ?? (kieu === 'thang' ? 'mm/yyyy' : 'dd/mm/yyyy')} aria-label={ariaLabel} aria-invalid={invalid || !!loi || undefined}
          onChange={(e) => setText(e.target.value)} onBlur={() => { chot(); onBlur?.(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); chot(); } else if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); setMo(true); } }} />
        <button ref={nut} type="button" className="btn flex-none min-h-[44px] min-w-[44px] justify-center px-0 sm:min-h-0 sm:min-w-[36px]"
          aria-label={kieu === 'thang' ? 'Mở lịch tháng' : 'Mở lịch'} aria-haspopup="dialog" aria-expanded={mo} disabled={disabled}
          onClick={() => setMo((v) => !v)}><BieuTuongLich /></button>
      </span>
      {phu && <span className="mt-1 block truncate text-[11.5px] tabular-nums text-slate-400">{phu}</span>}
      {loi && <span className="mt-1 block text-[11px] text-late" role="alert">{loi}</span>}
      {mo && <LichNho kieu={kieu} value={value || null} homNay={homNay} luat={luat} neo={nut}
        onChon={(iso) => { onChange(iso); setLoi(null); setMo(false); nut.current?.focus(); }} onDong={() => setMo(false)} />}
    </span>
  );
}
/** Biểu tượng lịch nét mảnh 14 px (không emoji — luật "dấu nhỏ gọn"). */
function BieuTuongLich() {
  return <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" /></svg>;
}
```
- [ ] **`ChonNgay.tsx`** — viết lại, giữ **nguyên chữ ký** ba hàm (8 file gọi không đổi). `NgayDoiDuoc` tạm thành `@deprecated` = nhãn + `<ONgay kieu="ngay" toiDa={homNay}>` (hết dòng "hôm nay · Đổi" — T12 (a) mới); 4 chỗ gọi nằm trong file N1 đang sửa nên Task 5 mới thay và **xoá** hẳn hàm:
```tsx
/** Lớp bọc cũ (PR-UX3) nay đi qua ô ngày thống nhất `ONgay` (T11). `soNgay/lui/toi/soThang` thành luật khoảng, không còn danh sách thả. */
export function ChonNgayGan({ value, onChange, disabled, ariaLabel, chuaChon }: {
  value: string; onChange: (v: string) => void; soNgay?: number; disabled?: boolean; ariaLabel?: string; chuaChon?: string;
}) {
  const { homNay } = useNgayNghiepVu();
  return <ONgay kieu="ngay" value={value} onChange={onChange} toiDa={homNay} disabled={disabled} ariaLabel={ariaLabel} goiY={chuaChon} />;
}
export function ChonTuan({ value, onChange, lui = 8, toi = 0, moc = 'dau', catHomNay = true, disabled, ariaLabel, chuaChon }: { … như cũ … }) {
  const { homNay } = useNgayNghiepVu();
  const t2 = mondayOfDate(homNay);
  return <ONgay kieu="tuan" value={value} onChange={onChange} moc={moc} catHomNay={catHomNay} disabled={disabled} ariaLabel={ariaLabel}
    goiY={chuaChon} toiThieu={cong(t2, -7 * lui)} toiDa={moc === 'cuoi' ? (catHomNay && toi === 0 ? homNay : cong(t2, 7 * toi + 6)) : cong(t2, 7 * toi)} />;
}
export function ChonThang({ value, onChange, soThang = 18, disabled, ariaLabel, chuaChon }: { … như cũ … }) {
  const { homNay } = useNgayNghiepVu();
  return <ONgay kieu="thang" value={value} onChange={onChange} toiThieu={homNay.slice(0, 7)} toiDa={thangCong(homNay, soThang - 1)}
    disabled={disabled} ariaLabel={ariaLabel} goiY={chuaChon} />;
}
```
  (`cong`, `thangCong` = hàm cộng ngày/tháng nhỏ viết tại file, không `new Date()` không đối số.) Chỗ gọi đang truyền `chuaChon=
  "Mặc định: hôm nay"` vẫn hiện làm chữ gợi ý trong ô trống — giữ nghĩa cũ.
- [ ] **`WeekPicker`**: giữ nguyên API, thanh `‹ [trường tuần] › Tuần này` (T12 (b) — không đổi), `resolveWeek`; thay khối popover
  (:320-368) bằng `{open && <LichNho kieu="tuan" goNgay value={shown?.weekStart ?? null} homNay={today} luat={{}} neo={field}
  onChon={(t2) => void pick(t2)} onDong={() => setOpen(false)} />}`; xoá `monthGrid`, `calYear/calMonth`, `recent`, effect Esc riêng
  (LichNho đã lo). `rangeOf` giữ cho trường tuần.
- [ ] `npm run check` → commit `PR-NEN (3): ô ngày thống nhất ONgay + lịch tự vẽ, ChonNgay là lớp bọc, WeekPicker dùng chung lịch`.

## Task 4 · Web: `OKhac`, `NutChon`, `BoLocDoan`, `NhanTrangThai`; focus panel/modal/menu; `ChonNguoi` mở danh sách ngay (T13, T14, B3, E2, E6, §7.3)

**Files:** tạo `web/src/ui/OKhac.tsx`; `web/src/ui/ui.tsx` (:174-179 màu `Status doing`; thêm ba thành phần **cuối file**);
`web/src/ui/KhungPanel.tsx:37-53` (ref + `tabIndex={-1}` + `useGiuFocus`); `web/src/ui/Drawer.tsx:37-62` (`Modal` cùng hook);
`web/src/ui/MenuDong.tsx:20-86`; `web/src/ui/PeoplePicker.tsx:237-343` (`ChonNguoi`).

**Interfaces:**
```ts
export function OKhac(p: { hien: boolean; value: string; onChange: (v: string) => void; nhan?: string;   // mặc định 'Ghi rõ'
  goiY?: string; id?: string; loi?: string | null; onBlur?: () => void }): JSX.Element | null;
export function NutChon(p: { chon: boolean; onClick: () => void; children: ReactNode; nho?: boolean; className?: string;
  disabled?: boolean; title?: string }): JSX.Element;                                    // lựa chọn trong form (1 hoặc nhiều)
export function BoLocDoan<K extends string>(p: { muc: { key: K; nhan: string; so?: number | null }[]; value: K;
  onChange: (k: K) => void; ariaLabel: string }): JSX.Element;                           // bộ lọc nút đoạn (E6)
export function NhanTrangThai(p: { t: TrangThai; soNgay?: number | null; title?: string }): JSX.Element;
```
- [ ] **Phép kiểm trước** (khối 4):
```ts
  check('NEN (4) · thành phần chung: OKhac ≥ 3, đang chọn ≠ nút chính, 6 nhãn, focus panel, menu mũi tên, ChonNguoi không bắt gõ', () => {
    const ok = doc('web/src/ui/OKhac.tsx');
    assert(/kiemGhiRoKhac\(/.test(ok) && /autoFocus/.test(ok), 'OKhac chưa dùng kiemGhiRoKhac / không tự focus');
    const ui = doc('web/src/ui/ui.tsx');
    for (const x of ['export function NutChon', 'export function BoLocDoan', 'export function NhanTrangThai', 'aria-pressed', 'bg-ink-800', 'teal-600'])
      assert(ui.includes(x), `ui.tsx thiếu ${x}`);
    assert(!/doing: 'bg-doing-bg text-doing/.test(ui), 'Status doing còn mượn màu xanh của điểm (A8)');
    assert(/useGiuFocus\(/.test(doc('web/src/ui/KhungPanel.tsx')) && /useGiuFocus\(/.test(doc('web/src/ui/Drawer.tsx')), 'panel/modal chưa giữ focus');
    assert(/buocDanhSach\(/.test(doc('web/src/ui/MenuDong.tsx')), 'menu ⋯ chưa đi bằng mũi tên');
    const pp = doc('web/src/ui/PeoplePicker.tsx');
    assert(!/ít nhất 3 ký tự/.test(pp) && /Dùng tên ngoài hệ thống/.test(pp), 'ChonNguoi còn bắt gõ 3 ký tự / thiếu dòng tên ngoài');
  });
```
- [ ] **`OKhac.tsx`:**
```tsx
/** Ô "Khác" (T13): chọn Khác → ô chữ nhỏ NGAY DƯỚI, tự focus, bắt buộc ≥ 3 ký tự. Lỗi hiện sau khi rời ô hoặc khi form truyền `loi`. */
export function OKhac({ hien, value, onChange, nhan = 'Ghi rõ', goiY = 'Ví dụ: Đi muộn giờ ăn trưa', id, loi, onBlur }: Props) {
  const [daRoi, setDaRoi] = useState(false);
  if (!hien) return null;
  const cau = loi ?? (daRoi ? kiemGhiRoKhac(value) : null);
  return (
    <label className="mt-1.5 block min-w-0">
      <span className="mb-1 block text-[11.5px] font-bold text-slate-200">{nhan}<span className="text-bad"> *</span></span>
      <input id={id} className="field w-full" autoFocus maxLength={200} value={value} placeholder={goiY} aria-invalid={!!cau || undefined}
        onChange={(e) => onChange(e.target.value)} onBlur={() => { setDaRoi(true); onBlur?.(); }} />
      {cau && <span className="mt-1 block text-[11px] text-late">{cau}</span>}
    </label>
  );
}
```
- [ ] **`ui.tsx`** — `STATUS_CLASS.doing` → `'bg-white/[.06] text-slate-200 border-transparent'` (A8 N1 chuyển sang: trạng thái quy trình
  không mượn xanh của ô điểm). Thêm cuối file:
```tsx
/** ĐANG CHỌN (UX-B B3, HE §2 "Đang chọn"): viền teal-600 + nền ink-800 + ✓ nhỏ + aria-pressed — KHÁC nút chính (xanh đặc = Lưu). */
const CHON = 'border-teal-600 bg-ink-800 text-slate-100 hover:bg-ink-800';
export function NutChon({ chon, onClick, children, nho, className = '', disabled, title }: NutChonProps) {
  return (
    <button type="button" aria-pressed={chon} onClick={onClick} disabled={disabled} title={title}
      className={`btn ${nho ? 'btn-sm' : ''} gap-1 ${chon ? CHON : ''} ${className}`}>
      <span aria-hidden className={`text-[10px] leading-none text-teal-300 ${chon ? '' : 'invisible'}`}>✓</span>{children}
    </button>
  );
}
/** BỘ LỌC NÚT ĐOẠN (UX-E E6): một kiểu cho mọi bộ lọc; tab trang vẫn là `HangTab` gạch chân. */
export function BoLocDoan<K extends string>({ muc, value, onChange, ariaLabel }: BoLocDoanProps<K>) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex max-w-full overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--line-strong)' }}>
      {muc.map((m, i) => {
        const chon = m.key === value;
        return (
          <button key={m.key} type="button" aria-pressed={chon} onClick={() => onChange(m.key)} style={{ borderColor: 'var(--line)' }}
            className={`inline-flex min-h-[44px] items-center gap-1 whitespace-nowrap px-3 text-xs font-semibold sm:min-h-[32px] ${i ? 'border-l' : ''} ${
              chon ? 'bg-ink-800 text-slate-100 shadow-[inset_0_0_0_1px_theme(colors.teal.600)]' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
            <span aria-hidden className={`text-[10px] text-teal-300 ${chon ? '' : 'hidden'}`}>✓</span>{m.nhan}
            {m.so != null && <span className="tabular-nums text-slate-500">{m.so}</span>}
          </button>
        );
      })}
    </div>
  );
}
/** NHÃN TRẠNG THÁI CHÍNH (§7.3, brainstorm C.2) — một dòng một nhãn; màu điểm/SOS không dùng ở đây. */
const NHAN_LOP: Record<TrangThai, string> = {
  'can-lam': 'border-[color:var(--line-strong)] text-slate-200', 'dang-lam': 'border-transparent bg-white/[.06] text-slate-200',
  'cho-duyet': 'border-wait-line bg-wait-bg text-wait', 'qua-han': 'border-late-line bg-late-bg text-late',
  xong: 'border-transparent text-done', 'da-huy': 'border-transparent text-slate-500 line-through decoration-1',
};
export function NhanTrangThai({ t, soNgay, title }: { t: TrangThai; soNgay?: number | null; title?: string }) {
  return <span title={title} className={`inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums ${NHAN_LOP[t]}`}>
    {chuTrangThai(t, soNgay)}</span>;
}
```
- [ ] **E2 panel/modal:** `KhungPanel`: `const khung = useRef<HTMLDivElement>(null); useGiuFocus(khung);` gắn `ref={khung} tabIndex={-1}`
  + `outline-none` vào khối `relative flex h-full …` (:52). `Modal` (Drawer.tsx:37): cùng mẫu trên khối `relative w-full … card`.
  (`Drawer` bị xoá ở Task 9 — không sửa.)
- [ ] **E2 menu ⋯ (`MenuDong`)**: state `dang` (chỉ số mục); mở → focus mục đầu (`useEffect` sau khi có `viTri`); mục có `tabIndex={-1}`;
  `onKeyDown` của hộp: `buocDanhSach(muc.length, dang, e.key)` ≠ null → `preventDefault`, focus mục đó; `Tab` → đóng; Esc: đổi listener
  `phim` sang **pha bắt** + `stopPropagation()` → đóng + `nut.current?.focus()` (không đóng luôn panel chứa nó). Đóng bằng chọn mục cũng
  trả focus về nút.
- [ ] **T14 `ChonNguoi`**: xoá khối `term.trim().length < 3` (:333-335) và điều kiện `>= 3` ở hai dòng sau; danh sách mở ngay khi vào ô
  (đã `open=true`) và máy chủ trả người khi `q` rỗng (Task 2). `options`: khi `choNgoai` **luôn** thêm dòng cuối `{ kind: 'ngoai',
  text: term.trim() }`; vẽ `Dùng tên ngoài hệ thống: «{text}»`; `text.length < 2` → dòng mờ `aria-disabled` `Dùng tên ngoài hệ thống: gõ
  tên ở ô trên` (bấm không làm gì, mũi tên bỏ qua). Không có ai khớp → `Không tìm thấy {giáo viên|người} khớp «{term}»`. Mũi tên dùng
  `buocDanhSach`. Chữ `người ngoài` ở dòng đã chọn (:274) → `ngoài hệ thống`.
- [ ] `npm run check` → commit `PR-NEN (4): OKhac, NutChon, BoLocDoan, NhanTrangThai; focus panel/menu; ChonNguoi mở danh sách ngay`.

## Task 5 · 🚦 Cổng rebase N1 → thay **mọi** ô ngày (17 ô trình duyệt + 4 dòng "hôm nay · Đổi") (T11, T12, YC-9)

- [ ] **Cổng rebase** (mục "Ranh giới file" ở trên): N1 chưa merge → dừng, báo planning. Đã merge → `git rebase origin/main`, giữ cả
  hai phần ở `KhungPanel.tsx`/`ui.tsx`/`display.ts`, `npm run check`, ghi Nhật ký số xung đột.
- [ ] **Phép kiểm trước** (khối 5 — quét toàn `web/src`):
```ts
  check('NEN (5) · YC-9: không còn ô ngày/tháng của trình duyệt (trừ thanh ngày bản demo — T12 e); không còn NgayDoiDuoc', () => {
    const sai = tepNguon('web/src').filter((f) => !/modules\/platform\/DemoBar\.tsx$/.test(f)
      && !/modules\/classes\//.test(f)                                   // phần chờ LOP — Task 11 bỏ dòng loại trừ này
      && /type="date"|type="month"/.test(doc(f)));
    assert(sai.length === 0, sai.join(', '));
    const con = tepNguon('web/src').filter((f) => /NgayDoiDuoc/.test(doc(f)));
    assert(con.length === 0, `còn NgayDoiDuoc: ${con.join(', ')}`);
  });
```
- [ ] Thay theo bảng (đọc lại dòng thật sau rebase; **giữ đúng luật đang có**, không thêm luật mới — Q8). Mỗi ô đặt trong `Truong`/
  `Field` đang có; nhãn giữ nguyên chữ.

| # | Chỗ (file:dòng trước rebase) | Hiện nay | Sau |
|---|---|---|---|
| 1 | `fasttrack/MockDetailPage.tsx:749` Hẹn xử lý (một kỹ năng) | `type="date"` | `<ONgay kieu="ngay" value={date} onChange={setDate} ariaLabel="Hẹn xử lý" />` |
| 2 | `MockDetailPage.tsx:851` Hẹn xử lý cả đợt | `type="date"` | như #1 |
| 3 | `students/IntakePanel.tsx:215` Tuần bắt đầu học | `type="date"` | `<ONgay kieu="tuan" value={startWeek} onChange={(v) => { setStartWeek(v); setPreview(null); }} />` |
| 4 | `students/StudentPlanPanel.tsx:125` Tháng dự kiến thi | `type="month"` | `<ONgay kieu="thang" value={examMonth} onChange={(v) => { setTouched(true); setExamMonth(v); }} />` |
| 5 | `StudentPlanPanel.tsx:299` Có hiệu lực từ ngày | `type="date"` | `<ONgay kieu="ngay" value={effectiveFrom} onChange={setEffectiveFrom} />` |
| 6 | `worklist/ManagerTasks.tsx:178` Hạn (Giao việc) | `type="date"` | `<ONgay kieu="ngay" value={dueDate} onChange={setDueDate} ariaLabel="Hạn" />` |
| 7 | `worklist/MgmtTasksPage.tsx:490` Ngày xem lại | `type="date" min={homNay}` | `<ONgay kieu="ngay" value={reviewOn} onChange={setReviewOn} toiThieu={homNay} />` |
| 8 | `MgmtTasksPage.tsx:564` Hạn (Sửa công việc) | `type="date"` | `<ONgay kieu="ngay" value={due} onChange={setDue} />` |
| 9 | `MgmtTasksPage.tsx:661` Hạn (Việc mới / việc con) | `type="date"` | như #8 |
| 10 | `yThuc/CaseSosControls.tsx:122` Dự kiến kết thúc (Sửa PA điền sẵn — N1 đã bỏ chỗ gọi) | `type="date"` | `<ONgay kieu="ngay" value={due} onChange={setDue} ariaLabel="Dự kiến kết thúc" />` |
| 11 | `CaseSosControls.tsx:153` Dự kiến kết thúc (Thay PA) | `type="date"` | như #10 |
| 12 | `yThuc/PhoiHopSosSection.tsx:171` Ngày thực hiện | `type="date" max={today}` | `<ONgay kieu="ngay" value={performedOn} onChange={setPerformedOn} toiDa={today} />` |
| 13 | `ui/Filters.tsx:306` ô "Gõ ngày" trong `WeekPicker` | `type="date"` | đã thay ở Task 3 (`LichNho goNgay`) |
| 14–16 | `classes/TransitionPanel.tsx:175` Ngày chuyển · `:274` Dự kiến thi · `:281` Xem lại | `type="date"`/`"month"` | **Task 11 (chờ LOP)**: `kieu="ngay"` · `kieu="thang"` · `kieu="ngay"` (không thêm luật mới — Q8) |
| 17 | `platform/DemoBar.tsx:105` Ngày demo | `type="date"` | **giữ** (T12 (e)) |
| 18 | `cases/QuickReport.tsx:399` **Bắt đầu theo dõi** (Tạo Case) | `NgayDoiDuoc` "hôm nay · Đổi" | `<Truong nhan="Bắt đầu theo dõi"><ONgay kieu="ngay" value={detectedAt \|\| homNay} onChange={setDetectedAt} toiDa={homNay} /></Truong>` (T12 (a) mới) |
| 19 | `cases/CapNhatTuan.tsx:301` Ngày ghi | `NgayDoiDuoc` | `<Truong nhan="Ngày ghi"><ONgay kieu="ngay" value={on} onChange={setOn} toiDa={homNay} /></Truong>` |
| 20 | `CapNhatTuan.tsx:214` Ngày kết thúc | `NgayDoiDuoc` | như #19 với `endOn/setEndOn` |
| 21 | `cases/ThaoTacCase.tsx:213` Ngày hoàn thành | `NgayDoiDuoc` | như #19 với `closedOn/setClosedOn` |

  Chỗ **giữ nguyên** (T12): (b) thanh `‹ tuần ›` Lịch Test / Kế hoạch Test (`WeekPicker` — chỉ đổi lõi lịch), (c) chip tuần
  `test/keHoach/TuanNho.tsx`, (d) "Từ tuần / Đến tuần" nhập bù `QuickReport.tsx:409-432` (`ChonTuan moc="dau"/"cuoi"` — nghĩa đầu/cuối
  tuần giữ qua `moc`), (e) `DemoBar`. Form **Xác nhận Case** SOS (khoá = hôm nay) chưa có trên web — PR-SOS dựng (T21).
  20 chỗ gọi `ChonNgayGan/ChonTuan/ChonThang` ở 8 file (CapNhatTuan :160 · QuickReport :409, 412, 431, 432 · ThaoTacCase :137, 141, 146 ·
  ChuyenLopPanel :145, 181 · LoTrinhTiepPanel :137 · StudentManagePanel :101 · ConfirmMeasurePanel :78 · RecordViolationPanel :201)
  **không sửa** — đã thành `ONgay` qua lớp bọc (Task 3).
- [ ] Xoá `NgayDoiDuoc` khỏi `ChonNgay.tsx` + import ở 3 file. `useLoiForm` của N1 (nếu ô ngày là ô bắt buộc trong `LUAT`): truyền
  `id={lf.oId(khoa)} onBlur={lf.roi(khoa)} invalid={lf.hien(khoa) && !!loi}` vào `ONgay`.
- [ ] `npm run check` → commit `PR-NEN (5): mọi ô ngày dùng ONgay; "Bắt đầu theo dõi" là ô ngày có sẵn hôm nay`.

## Task 6 · Áp `OKhac` cho mọi danh sách có "Khác" (T13, YC-8, bảng §10.2)

- [ ] **Phép kiểm trước** (khối 6):
```ts
  check('NEN (6) · YC-8: mọi form có mục "Khác" đi qua OKhac; không còn luật "Khác ≥ 30 ký tự" trên web', () => {
    const ds = ['web/src/modules/cases/QuickReport.tsx', 'web/src/modules/yThuc/CaseSosControls.tsx', 'web/src/modules/cases/ThaoTacCase.tsx',
      'web/src/modules/cases/CapNhatTuan.tsx', 'web/src/modules/yThuc/PhoiHopSosSection.tsx', 'web/src/modules/yThuc/RecordViolationPanel.tsx',
      'web/src/modules/yThuc/CreateMeasurePanel.tsx', 'web/src/modules/yThuc/PhuongAnPanel.tsx', 'web/src/modules/students/ChuyenLopPanel.tsx'];
    for (const f of ds) assert(/<OKhac\b/.test(doc(f)), `${f} chưa dùng OKhac`);
    const web = tepNguon('web/src').map(doc).join('\n');
    assert(!/VIOLATION_OTHER_DESCRIPTION_MIN|endsWith\('\.other'\) \? 30|Mô tả rõ hơn \(chọn "Khác"\)/.test(web), 'còn luật 30 ký tự');
  });
```
- [ ] Áp theo bảng. Mẫu chung: `const [ghiRo, setGhiRo] = useState('')`; ngay dưới ô chọn `<OKhac hien={laKhac(ma)} value={ghiRo}
  onChange={setGhiRo} id={lf.oId('ghi-ro')} onBlur={lf.roi('ghi-ro')} loi={lf.hien('ghi-ro') ? kiemGhiRoKhac(ghiRo) : null} />`; thêm vào
  `LUAT` của N1: `...(laKhac(ma) ? [{ khoa: 'ghi-ro', nhan: 'Ghi rõ', toiThieu: KHAC_TOI_THIEU }] : [])`; đổi lựa chọn → giữ chữ đã gõ.
  Form chưa có `useLoiForm` (form nhỏ trong dòng) → nút chính `disabled` khi `kiemGhiRoKhac(ghiRo)` ≠ null, câu hiện dưới ô (có sẵn trong `OKhac`).

| # | Chỗ (§10.2) | File:dòng (trước rebase) | Ô chọn | Chữ "Khác" lưu vào |
|---|---|---|---|---|
| 1 | Phân loại nguyên nhân — Tạo Case / nhập bù | `cases/QuickReport.tsx:363-369` (select `primaryCode`) + bỏ luật 30 (dòng N1 `toiThieu: … ? 30 : 15` → `15`; hoặc `:271` nếu N1 chưa đổi) | `laKhac(primaryCode)` | `observation` (gửi kèm POST tạo Case) |
| 2 | Phân loại nguyên nhân — Xác định nguyên nhân SOS | `yThuc/CaseSosControls.tsx:40-47` (nút nguyên nhân) | `laKhac(code)` | `observation` của `PUT /cases/:id/issues` |
| 3 | PA đề xuất "Khác" — Thêm PA | `cases/ThaoTacCase.tsx:92-104` (select `kind`) | `kind === 'other_proposal'`, nhãn `Tên đề xuất` | `ghiRoKhac` → máy chủ ghép vào mô tả (Q9) |
| 4 | PA đề xuất "Khác" — Thay PA (Ghi kết quả) | `cases/CapNhatTuan.tsx:172-181` (`newKind`) | như #3 | như #3 |
| 5 | PA đề xuất "Khác" — Thay PA điền sẵn (không còn chỗ gọi sau N1) | `CaseSosControls.tsx:140-148` | như #3 | như #3 |
| 6 | Lý do **Không cần theo dõi** | `CaseSosControls.tsx:188-199` (thay `<input placeholder="Lý do">`) | `reasonNeedsText(reason)` | `reasonText` (cột `dismiss_reason_text`) |
| 7 | Phối hợp SOS — lý do bỏ việc | `yThuc/PhoiHopSosSection.tsx:213-225` | `reason === 'other'` | `reasonText` (cột `remove_reason_text`) |
| 8 | Phối hợp SOS — loại việc "Khác" | `PhoiHopSosSection.tsx:258-272`, nhãn `Tên việc` | `kind === 'other'` | `customName` (cột `custom_name`) |
| 9 | Nhóm vi phạm "Khác" | `yThuc/RecordViolationPanel.tsx:94, 212-221` (bỏ `minLen` 30 → luôn `VIOLATION_DESCRIPTION_MIN`) | `category === 'other'` | `ghiRoKhac` → máy chủ ghép vào mô tả (Q9) |
| 10 | Xử lý ngoài thang ("Khác" + tên) | `yThuc/CreateMeasurePanel.tsx:57, 107-111` · `yThuc/PhuongAnPanel.tsx:186-190`, nhãn `Tên phương án` | `kind === 'other'` | `customName` (cột `custom_name`) |
| 11 | Lý do chuyển lớp | `students/ChuyenLopPanel.tsx:172-176` (thay khối `reasonCode === 'khac'`), nhãn `Ghi rõ lý do` | `reasonCode === 'khac'` | `reasonNote` → `end_reason` |

  §10.2 còn ba mục **không có danh sách "Khác" trên web hiện nay**: báo cáo tutor (`tutor_other` là dòng chữ tự do "Các vấn đề khác"
  của báo cáo — đã là ô chữ), loại việc Vận hành (không có mục Khác), lý do từ chối duyệt (chưa có — PR-DUYET dựng bằng `OKhac`).
  Ghi vào mô tả PR. Form sắp dựng lại ở PR khác (#2, #5, #6 → PR-SOS; #9, #10 → PR-YT4) vẫn áp ngay — PR sau giữ `OKhac`.
- [ ] Sửa vi phạm (`RecordViolationPanel` chế độ sửa): mô tả cũ dạng `A — B` với nhóm Khác → tách `A` vào `ghiRo`, `B` vào mô tả.
- [ ] `npm run check` → commit `PR-NEN (6): "Khác" hiện ô Ghi rõ ngay dưới (≥ 3 ký tự) ở 11 chỗ`.

## Task 7 · Áp chọn người (T14), `NhanTrangThai` (A8 N1 chuyển), 4 loại hạn mới (K1-56, T66)

**Files:** `web/src/modules/congViec/ChonPhuTrach.tsx:54-80`; `worklist/MgmtTasksPage.tsx:184-186, 487, 558-561, 654-657`;
`yThuc/PhoiHopSosSection.tsx:89, 131-138`; `cases/CaseBoardPage.tsx:225-227`; `students/StudentsPage.tsx:405-407`;
`shared/domain/display.ts` (`DEADLINE_KINDS` :240-243, `DEADLINE_VIEC` :250-260 — **sau** phần N1 đã sửa); `web/src/ui/Han.tsx` (chú thích).

- [ ] **Phép kiểm trước** (khối 7):
```ts
  check('NEN (7) · K1-56: 4 loại hạn mới có việc + tiền tố; Xác nhận nguyên nhân thay "Xác minh"', () => {
    for (const k of ['duyet', 'xu-ly-vi-pham', 'ke-hoach-bo-tro', 'mini-test']) assert(d.DEADLINE_KINDS.includes(k), `thiếu loại ${k}`);
    const v = d.deadlineView({ kind: 'duyet', due: '2026-10-02', today: '2026-09-28' } as any);
    assert(/^Duyệt · hạn 02\/10/.test(v.text), v.text);
    assert(d.deadlineView({ kind: 'xac-minh-sos', due: '2026-09-30', today: '2026-09-28' } as any).text.startsWith('Xác nhận nguyên nhân'), 'xac-minh-sos');
  });
  check('NEN (7) · T14: ô chọn người mở danh sách ngay; trạng thái quy trình dùng NhanTrangThai', () => {
    assert(/buocDanhSach\(/.test(doc('web/src/modules/congViec/ChonPhuTrach.tsx')), 'menu ChonPhuTrach chưa đi bằng mũi tên');
    assert(/<ChonNguoi/.test(doc('web/src/modules/yThuc/PhoiHopSosSection.tsx')), 'Phối hợp SOS chưa có ô người thực hiện');
    for (const f of ['web/src/modules/yThuc/PhoiHopSosSection.tsx', 'web/src/modules/cases/CaseBoardPage.tsx', 'web/src/modules/students/StudentsPage.tsx'])
      assert(/<NhanTrangThai\b/.test(doc(f)) && !/<Status kind/.test(doc(f)), `${f} chưa dùng NhanTrangThai`);
  });
```
  (đổi mẫu `deadlineView`/`text` theo đúng chữ ký thật sau rebase — N1 đã đổi `DEADLINE_VIEC`.)
- [ ] **Chọn người** (bảng §10.2):

| Chỗ | File:dòng | Sau |
|---|---|---|
| Người thực hiện PA — Thêm PA · Ghi kết quả (điều chỉnh, thay) · Tạo Case nhập bù · Thay PA điền sẵn | `ThaoTacCase.tsx:133` · `CapNhatTuan.tsx:157, 187` · `QuickReport.tsx:428` · `CaseSosControls.tsx:150` | không sửa chỗ gọi — `ChonNguoi` mới mở danh sách ngay + dòng tên ngoài (Task 4) |
| Người thực hiện xử lý Ý thức | `yThuc/ConfirmMeasurePanel.tsx:81` | như trên |
| Phối hợp SOS — người thực hiện | `PhoiHopSosSection.tsx:165-180` (form "Đánh dấu xong": hiện chỉ có ngày + ghi chú) | thêm `<Truong nhan="Người thực hiện"><ChonNguoi nhom="nhan_vien" value={nguoi} onChange={setNguoi} /></Truong>` mặc định `{ kieu: 'toi' }`; gửi `performerName: nguoi?.kieu === 'toi' ? undefined : nguoi?.ten` (máy chủ `confirmCoordination` `phoiHop.ts:270` đã nhận `performerName`) |
| Người nhận bàn giao chuyển lớp | `ChuyenLopPanel.tsx:217` | không sửa |
| Người cần hỗ trợ (Tạm ngưng) | `MgmtTasksPage.tsx:487` | đã `choNgoai` — không sửa |
| **Người phụ trách việc Vận hành** | `MgmtTasksPage.tsx:558, 654` | giữ `choNgoai={false}` — cần cột `tasks.assignee_name` (migrate) → **Q12, chuyển PR-DUYET** |
| Người theo dõi | `MgmtTasksPage.tsx:561, 657` | giữ chỉ tài khoản (phải đăng nhập để thấy việc) — Q13 |
| Người phụ trách xử lý Ý thức | `CreateMeasurePanel.tsx:104`, `PhuongAnPanel.tsx:183` | giữ chỉ tài khoản (nhận việc) — Q13, PR-YT4 |
| Bộ lọc phụ trách (ngoại lệ T14) | `MgmtTasksPage.tsx:184`; `ChonPhuTrach.tsx:71` | chỉ tài khoản; `ChonPhuTrach`: "Chọn giáo viên…" mở `ChonNguoi` có danh sách ngay, menu Tôi/Tất cả/Chọn dùng `buocDanhSach` + Esc trả focus |
| Phân công GV lớp (ngoại lệ T14) | `classes/TeacherAssignPanel.tsx` (PR-LOP `<select>` một người) | không sửa |
| GV chấm Speaking | chưa có | PR-HSM |

- [ ] **`NhanTrangThai`**: `PhoiHopSosSection:89` → `<NhanTrangThai t={t.summary.complete ? 'xong' : 'dang-lam'} />`; `:131-138` →
  `<NhanTrangThai t={trangThaiPhoiHop(a.status)} />` (giữ nút cạnh nhãn); `CaseBoardPage:225` và `StudentsPage:405` →
  `<NhanTrangThai t={trangThaiCaseDong(r.state | r.caseStatus)} />` (chữ cũ `caseStatusLabel` bỏ ở dòng này — nhãn chính là 6 chữ).
  Các chỗ `Status` còn lại (Công việc Vận hành `paused/stopped`, lưới điểm, SaveState) giữ — chỉ đổi màu `doing` (Task 4) → PR-VAI (T75).
- [ ] **Loại hạn (K1-56, T66)** trong `display.ts`: thêm vào `DEADLINE_KINDS` `'duyet', 'xu-ly-vi-pham', 'ke-hoach-bo-tro', 'mini-test'`;
  `DEADLINE_VIEC`: `duyet: { viec: 'Duyệt', tien: 'hạn' }`, `'xu-ly-vi-pham': { viec: 'Xử lý vi phạm', tien: 'hạn' }`,
  `'ke-hoach-bo-tro': { viec: 'Nộp kế hoạch bổ trợ', tien: 'hạn' }`, `'mini-test': { viec: 'Mini Test', tien: 'hạn' }`;
  `'xac-minh-sos'.viec` → `'Xác nhận nguyên nhân'` (giữ khoá — như N1 Q4). Hai loại Ý thức cũ giữ tới PR-YT4. Sửa kỳ vọng chữ
  `Xác minh nguyên nhân` trong `server/src/tests/*.ts` (grep).
- [ ] `npm run check` → commit `PR-NEN (7): chọn người mở danh sách ngay, NhanTrangThai, 4 loại hạn mới`.

## Task 8 · "Đang chọn" khác nút chính (UX-B B3) + một kiểu tab, một kiểu bộ lọc (UX-E E6)

- [ ] **Phép kiểm trước** (khối 8):
```ts
  check('NEN (8) · B3: không nút lựa chọn nào dùng btn-primary; E6: tab trang là HangTab, bộ lọc là BoLocDoan', () => {
    const sai = tepNguon('web/src').filter((f) => !/modules\/classes\//.test(f)    // phần chờ LOP — Task 11 bỏ loại trừ
      && /\?\s*'btn-primary'\s*:\s*''/.test(doc(f)));
    assert(sai.length === 0, sai.join(', '));
    assert(/<HangTab\b/.test(doc('web/src/modules/platform/AdminPage.tsx')), 'Quản trị còn kiểu tab viên bo');
    for (const f of ['web/src/modules/yThuc/ClassYThucCard.tsx', 'web/src/modules/yThuc/StudentYThucSection.tsx', 'web/src/modules/students/HanhTrinh.tsx'])
      assert(/<BoLocDoan\b/.test(doc(f)), `${f} chưa dùng BoLocDoan`);
  });
```
- [ ] **Lựa chọn trong form → `NutChon`** (giữ `aria-pressed`, lưới, `min-h-[44px] sm:min-h-0`; trong một panel chỉ còn **một** khối xanh
  đặc là nút Lưu): `cases/CapNhatTuan.tsx:241` · `cases/QuickReport.tsx:353, 378 (Mức độ Bình thường/Gấp), 467` · `cases/ThaoTacCase.tsx:110,
  123, 125, 203, 267` · `platform/AccountsAdmin.tsx:230, 366` (nhiều chi nhánh — nhiều nút cùng chọn) · `platform/CatalogAdmin.tsx:247, 260`
  · `platform/ProfilePage.tsx:116` · `platform/WelcomePage.tsx:302, 314` · `students/ChuyenLopPanel.tsx:165` · `test/keHoach/NganXepHangLoat.tsx:192`
  · `worklist/ManagerTasks.tsx:135, 137, 162` · `worklist/MeetingPage.tsx:308` · `worklist/MgmtTasksPage.tsx:465` · `yThuc/CaseSosControls.tsx:43,
  191` · `yThuc/PhoiHopSosSection.tsx:214, 260` · `yThuc/RecordViolationPanel.tsx:216` (BTVN, Khác…).
- [ ] **Bộ lọc → `BoLocDoan`**: `cases/CaseBoardPage.tsx:292` (hàm `Chip`) · `congViec/HoTroHocVienTab.tsx:116` · `platform/AccountsAdmin.tsx:90-92`
  (Đang dùng / Đã xoá) · `students/ClassRoster.tsx:106-107` (Gọn / Đầy đủ) · `students/HanhTrinh.tsx:138-147` (giai đoạn; chip kỹ năng) ·
  `students/StudentDetailPage.tsx:254` (lộ trình) · `worklist/BranchPulse.tsx:76-77` · `worklist/Highlights.tsx:86` ·
  `yThuc/ClassYThucCard.tsx:196-223` (nhóm · cách xem · lọc phụ · khoảng) · `yThuc/StudentYThucSection.tsx:187-196`.
- [ ] **Không phải lựa chọn** (nút chính có điều kiện — giữ xanh, viết lại để không giống mẫu lựa chọn):
  `test/lichTest/KhoiNo.tsx:115`, `yThuc/ClassYThucCard.tsx:330`, `yThuc/StudentYThucSection.tsx:144` → ``className={cond ? 'btn btn-sm btn-primary …' : 'btn btn-sm …'}``;
  `students/StudentDetailPage.tsx:227` (mở/đóng khối lộ trình) → nút thường + `aria-expanded={cycleOpen}` + `▾/▸`.
- [ ] **E6 tab trang:** `platform/AdminPage.tsx:50-60` → `<HangTab ariaLabel="Quản trị hệ thống" value={tab} onChange={setTab}
  tabs={TABS.map((t) => ({ key: t.key, label: t.label }))} />`. Các trang khác đã dùng `HangTab` (10 chỗ) — không đổi.
- [ ] `npm run check` → commit `PR-NEN (8): đang chọn ≠ nút chính (NutChon), một kiểu bộ lọc (BoLocDoan), tab Quản trị gạch chân`.

## Task 9 · Một khung panel (UX-E E1) + bàn phím ở đầu trang (UX-E E3)

- [ ] **Phép kiểm trước** (khối 9):
```ts
  check('NEN (9) · E1: không còn Drawer; E3: Esc/mũi tên ở đầu trang, "Không tìm thấy học viên", "Bỏ qua tới nội dung"', () => {
    const sai = tepNguon('web/src').filter((f) => !/modules\/classes\//.test(f) && /<Drawer\b/.test(doc(f)));   // Task 11 bỏ loại trừ
    assert(sai.length === 0, sai.join(', '));
    const h = doc('web/src/modules/platform/Header.tsx');
    assert(/Không tìm thấy học viên/.test(h) && /buocDanhSach\(/.test(h) && /'Escape'/.test(h) && /role="combobox"/.test(h), 'Header');
    const a = doc('web/src/App.tsx');
    assert(/Bỏ qua tới nội dung/.test(a) && /id="noi-dung"/.test(a) && /tabIndex=\{-1\}/.test(a), 'App');
  });
```
- [ ] **E1** — mỗi `<Drawer …>` → `{điều kiện mở && <KhungPanel …>}`: `title` → `tieuDe` (chuỗi), `subtitle` → `ngCanh`, `width` `max-w-2xl`
  → `rong="rong"`, `max-w-lg`/mặc định → `hep`; `footer`: nút Huỷ/Đóng → `chan.huy` (**trái**), nút `btn-primary` → `chan.chinh` (**phải**),
  nút khác → `chan.phu`; không có footer → không `chan`. Panel có form thì áp `useLoiForm` (N1) cho ô bắt buộc.

| Panel | File:dòng |
|---|---|
| Thêm học viên | `students/IntakePanel.tsx:178-389` |
| Lộ trình của HV | `students/StudentPlanPanel.tsx:93-221` |
| Lịch kiểm tra / Lộ trình lớp | `classes/ClassProgressPanel.tsx:73-162` (PR-LOP không sửa file này) |
| Sửa tài khoản | `platform/AccountsAdmin.tsx:308-437` |
| Danh mục (2 panel) | `platform/CatalogAdmin.tsx:157-187, 225-298` |
| Ô báo cáo đơn vị | `worklist/MeetingPage.tsx:295-388` |
| Chi tiết công việc | `worklist/MgmtTasksPage.tsx:278-410` (ba `Modal` mở chồng lên vẫn là `Modal`) |
| Chỉ xem: Cần bổ sung đánh giá · Số liệu (3) · bản demo | `cases/NeedsEvaluation.tsx:27-46` · `ui/SoLieu.tsx:71-79` · `ui/SoLieuO.tsx:41-46` · `phanTich/dungChung.tsx:50-55` · `dev/ThanhPhanDemo.tsx:265-268` |
| Chuyển tiếp lớp · Tạo lớp | `classes/TransitionPanel.tsx`, `ClassCreatePanel.tsx` — **Task 11 (chờ LOP)** |

  Hết chỗ gọi → xoá `export function Drawer` (Drawer.tsx:3-34); file giữ `Modal` + `ConfirmDialog` (Q17). `KhungPanel` là "một panel một
  lúc" (`khoPanelChung`): panel chỉ xem mở từ trong panel khác (Số liệu trong Phân tích) → kiểm bấm thử; bị đóng mất panel cha thì
  truyền cách LOP đã chọn ở Task 9 của LOP (`longTrong` / giữ state ở cha) — đọc Nhật ký PR-LOP.
- [ ] **E3 — `platform/Header.tsx`:** refs `nutThongBao`, `nutTaiKhoan`, `oTim`; `useEffect` nghe `keydown` khi có menu/danh sách mở:
  `Escape` → đóng tất cả + focus lại nút/ô đã mở nó (`stopPropagation`). Ô tìm: `role="combobox" aria-expanded aria-controls
  aria-activedescendant`; `dong` = chỉ số đang sáng; `ArrowDown/Up/Home/End` → `buocDanhSach(hits.length, dong, e.key)`; `Enter` →
  mở `hits[dong]` (hoặc `hits[0]`); danh sách `role="listbox"`, mục `role="option" aria-selected`. Cờ `daTim` bật khi lượt tìm cuối đã
  trả về: `q.trim().length >= 2 && daTim && hits.length === 0` → hộp một dòng `Không tìm thấy học viên` (13 px, `text-slate-400`).
- [ ] **E3 — `App.tsx`:** phần tử đầu tiên trong `<div className="h-full flex flex-col">`:
  `<a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[110] btn btn-sm">Bỏ qua tới nội dung</a>`;
  `<main id="noi-dung" tabIndex={-1} className="… outline-none">`.
- [ ] `dev/ThanhPhanDemo.tsx`: thêm mục mẫu `ONgay` (4 kiểu), `OKhac`, `NutChon`, `BoLocDoan`, `NhanTrangThai` (6 nhãn) — trang dev
  cho người rà nhìn một chỗ.
- [ ] `npm run check` → commit `PR-NEN (9): một khung panel (bỏ Drawer), Esc/mũi tên ở đầu trang, "Bỏ qua tới nội dung"`.

## Task 10 · Cập nhật tài liệu

- [ ] `CODE_MAP.md`: thêm `shared/domain/oNgay.ts`, `khac.ts`, `trangThai.ts`, `banPhim.ts`; `web/src/ui/ONgay.tsx`, `LichNho.tsx`,
  `OKhac.tsx`, `giuFocus.ts`; `ui.tsx` (+ `NutChon`, `BoLocDoan`, `NhanTrangThai`); `Drawer.tsx` chỉ còn `Modal`/`ConfirmDialog`;
  `PRODUCT.md`, `DESIGN.md` (impeccable).
- [ ] `thiet-ke/HE_GIAO_DIEN.md`: §3 danh sách thành phần (bỏ `Drawer`, thêm 7 thành phần trên + dòng "đặc tả 27/09 §7.6 thay luật
  'không thêm component thứ sáu'"); §4 bảng `<Han>` thêm 4 loại + chữ "Xác nhận nguyên nhân"; §9 bộ chọn tuần: popover = `LichNho`
  (gõ `dd/mm/yyyy`, lưới tuần, "Gần đây"), bỏ dòng "Quét mọi nơi dùng … ScoreSheetPage · MockPlanPanel" (không còn); §10 thêm "Esc chỉ đóng
  lớp trên cùng (lịch → menu → panel); panel/menu/lịch giữ focus và trả focus; 'Bỏ qua tới nội dung'".
- [ ] `thiet-ke/TU_DIEN_VA_CHU.md`: thêm dòng các chữ ở Global Constraints (Gần đây, Ghi rõ, Dùng tên ngoài hệ thống, 6 nhãn trạng
  thái, Bỏ qua tới nội dung, Không tìm thấy học viên); đổi "Khác — kèm ô tên…" thành "Khác → ô **Ghi rõ** ngay dưới, ≥ 3 ký tự".
- [ ] `plan.md` §14: một dòng nhật ký PR-NEN (thành phần + ngoại lệ Q12/Q13). Đặc tả 27/09: §10.2 ghi ba mục "Khác" không có danh sách
  (M4); §8 dòng PR-NEN ghi "Vận hành tên ngoài → PR-DUYET" (Q12).
- [ ] `npm run check` → commit `PR-NEN (10): tài liệu CODE_MAP, HE_GIAO_DIEN §3 §4 §9 §10, TU_DIEN, plan.md`.

## Task 11 · Phần chờ LOP, impeccable `audit` + `polish`, bảng kiểm `redesign-skill`, bấm thử (một lần), mở PR

- [ ] **Cổng LOP:** `git fetch` → LOP đã merge? Chưa → dừng, báo planning (NEN merge **sau** LOP). Đã merge → `git rebase origin/main` →
  **phần chờ LOP**: `TransitionPanel.tsx` (3 ô ngày #14–16, `Drawer` → `KhungPanel` theo cách LOP xử lý hai panel chồng, `WeekPicker`
  giữ API), `ClassCreatePanel.tsx` + `TeacherAssignPanel.tsx` + `SuaThongTinLopPanel.tsx` (nút lựa chọn → `NutChon`; ô chọn GV giữ
  `<select>` chỉ tài khoản — ngoại lệ T14); bỏ ba dòng loại trừ `modules\/classes\/` trong khối 5, 8, 9. `npm run check`.
- [ ] Chạy máy thử **API 4177 · Vite 5377** trong worktree (`PORT=4177 npm run dev` + Vite tạm trỏ proxy 4177 — xem memory "máy chủ dev
  trong worktree"). Chạy `/impeccable audit` trên: panel Tạo Case, Ghi vi phạm, Thêm HV, Công việc › Vận hành, lịch mở trong panel,
  Quản trị (tab) — sửa mục a11y/tương phản/trạng thái nó báo (không đổi token màu — PR-SANG). Rồi `/impeccable polish` một lượt.
- [ ] Bảng kiểm taste-skill `redesign-skill` (chỉ bảng kiểm): `tabular-nums` ở mọi ô ngày/số · độ đậm 500/600 · hover/active/**focus**
  thấy được · trạng thái rỗng ("Không tìm thấy…") và lỗi (dưới ô, 11 px `text-late`). Ghi kết quả vào mô tả PR.
- [ ] Bấm thử theo **KIỂM** (dưới), chụp ảnh trước (main) / sau (nhánh) 1440 px + 375 px bằng Playwright kênh Chrome → `thiet-ke/anh/pr-nen/`
  (`01-o-ngay-lich.png`, `02-bat-dau-theo-doi.png`, `03-khac.png`, `04-chon-nguoi.png`, `05-nhan-trang-thai.png`, `06-dang-chon.png`,
  `07-tab-bo-loc.png`, `08-khung-panel.png`, `09-ban-phim.png`).
- [ ] `npm run check` → push → `gh pr create` tiêu đề `PR-NEN: nền giao diện — ô ngày, "Khác", chọn người, trạng thái, panel, bàn phím`;
  thân: bảng mã YC/T → ảnh → đạt/không; "tầng 1 của màn này là: …" cho mỗi màn đụng tới (§7.5); mục "Chuyển cho PR khác"; kết quả
  audit/bảng kiểm. Kết thân bằng dòng quy định của repo. **Không tự merge.**
- [ ] Tắt 4177/5377, quét `node … tests/run.js` treo (`Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`) và tắt,
  dọn file Playwright/Vite tạm.

## KIỂM — kịch bản bấm thử (Task 11, một lần)

Ba vai × hai khổ (1440 px, 375 px) + một lượt **chỉ bàn phím** (không chuột). Đạt khi mọi dòng đúng; sai dòng nào ghi Nhật ký + sửa.

| Vai | Làm | Phải thấy |
|---|---|---|
| QL (id 2) | Công việc › Vận hành › **+ Việc mới** → ô Hạn gõ `5/10` → Tab | ô hiện `05/10/2026`; gõ `31/02/2026` → dưới ô `Ngày không có thật`; nút lịch mở **đè lên** panel (không bị cắt), có `Gần đây` |
| QL | Người phụ trách: bấm vào ô | danh sách hiện ngay (không phải gõ); **không** có dòng tên ngoài (Q12) |
| QL | Hỗ trợ học viên › Người phụ trách ▾ › Chọn giáo viên… | danh sách GV hiện ngay; ↑/↓ chọn, Esc đóng và focus về nút |
| QL | Học viên & Lớp › + Thêm HV | panel `KhungPanel` (đầu 52 px, Huỷ trái, nút chính phải); Tuần bắt đầu học gõ `30/09/2026` → ô `28/09/2026` + dòng `W1 OCT · 28/09 – 04/10` |
| QL | Quản trị | tab gạch chân như các trang khác; Tài khoản › Đang dùng / Đã xoá là **nút đoạn** |
| GVCN (id 7) | Hồ sơ HV Vũ Ngọc Lan › + Case | "Bắt đầu theo dõi" là ô ngày có sẵn **hôm nay** (không còn "hôm nay · Đổi"); Mức độ Bình thường/Gấp: nút đang chọn viền teal + ✓, **chỉ** nút Lưu xanh đặc |
| GVCN | Phân loại vấn đề = "Khác" | ô **Ghi rõ** hiện ngay dưới, con trỏ đã ở trong; gõ `ab` → `Cần ít nhất 3 ký tự (đang có 2)`; mô tả 15 ký tự là đủ (không còn 30) |
| GVCN | Ý thức › + Ghi vi phạm › nhóm Khác | Ghi rõ ≥ 3; lưu xong nhật ký vi phạm hiện `{ghi rõ} — {mô tả}` |
| GVCN | Chuyển lớp một em › Lý do Khác | Ghi rõ lý do ngay dưới |
| GVBM (id 9) | Case › Thêm PA › Người thực hiện | danh sách hiện ngay, GV cùng lớp đứng đầu; gõ `Cô Mai tutor` → dòng `Dùng tên ngoài hệ thống: «Cô Mai tutor»` chọn được |
| GVBM | Loại PA "Khác · cần QL duyệt" | ô **Tên đề xuất** ngay dưới |
| GVBM | Hồ sơ HV › Phối hợp SOS | nhãn `Cần làm` / `Xong` / `Đã huỷ` (không xanh dương); "Đánh dấu xong" có ô Người thực hiện |
| 375 px | mọi bước trên | panel toàn màn; lịch vừa màn (≤ 100vw − 16 px), ô ngày + nút lịch ≥ 44 px; không cuộn ngang trang |
| Bàn phím | Tab đầu trang | hiện `Bỏ qua tới nội dung` → Enter → focus vào nội dung |
| Bàn phím | Ô tìm: gõ `Lan` → ↓ → Enter; gõ `zzz` | mở đúng hồ sơ; `Không tìm thấy học viên`; Esc đóng danh sách |
| Bàn phím | Thông báo / menu tài khoản mở → Esc | đóng, focus về nút |
| Bàn phím | Mở panel bất kỳ → Tab nhiều lần → Esc | focus vòng trong panel; Esc đóng; focus về nút đã mở |
| Bàn phím | Trong panel: Alt+↓ ở ô ngày → mũi tên → Enter; Esc khi lịch mở | chọn đúng ngày; Esc **chỉ** đóng lịch, panel còn |
| Bàn phím | Menu ⋯ ở một dòng | focus mục đầu, ↑/↓ vòng, Esc đóng + focus về ⋯ |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Lý do |
|---|---|---|
| Việc Vận hành nhận **tên ngoài hệ thống** (cột `tasks.assignee_name`, không nhận thông báo) | **PR-DUYET** (đợt 2, có migrate, chạm Công việc) — trừ khi chủ sản phẩm cho PR-NEN một migrate nhỏ (Câu 1) | Q12 |
| Người phụ trách xử lý Ý thức nhận tên ngoài / bỏ `choNgoai={false}` nếu luật mới cho phép | PR-YT4 | Q13, panel viết lại |
| GV chấm Speaking dùng `ChonNguoi` | PR-HSM | YC-10 |
| Form **Xác nhận Case** SOS: ngày khoá = hôm nay (không dùng `ONgay`); xoá `PresetPlanActions` + hai đường `/interventions/:id/confirm\|replace` | PR-SOS | T12 (a), T21, N1 Q22 |
| Dùng `ONgay kieu="ngay-hoac-thang"` cho **Ngày thi dự kiến** | PR-NHAP | T9 |
| `NhanTrangThai` cho hàng Case (K3-08), hộp kỹ năng Hành trình (K3-29), Công việc Vận hành (`paused/stopped`, T75) | PR-SOS · PR-HVL · PR-VAI | §7.3 "áp dần" |
| Loại hạn `duyet` → PR-DUYET; `xu-ly-vi-pham` + bỏ hai loại Ý thức cũ → PR-YT4; `ke-hoach-bo-tro`, `mini-test` → PR-LT2a/b | như cột trái | K1-56 |
| Lý do **từ chối duyệt** có mục "Khác" → dùng `OKhac` | PR-DUYET | §10.2 |
| Mọi form mới đợt 2–5 **phải** dùng `ONgay`/`OKhac`/`ChonNguoi`/`NutChon`/`KhungPanel` (phép kiểm khối 5, 6, 8, 9 sẽ đỏ nếu sai) | mọi PR | §10.2 |
| Số đếm trên `HangTab` (nền xanh `doing`) và màu sáng/tối | PR-SANG | không đổi token ở PR này |
| Hằng `ACADEMIC_SUPPORTS`, `OPS_POLICIES` (`shared/domain/cases.ts:987-1000`) có "Khác" nhưng không nơi nào dùng | PR-Dọn | M8 |

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | `ChonNgayGan/ChonTuan/ChonThang` giữ chữ ký, thành lớp bọc `ONgay`; 20 chỗ gọi không sửa | ít đụng file N1 đang sửa |
| Q2 | `NgayDoiDuoc` bỏ ở **cả 4** chỗ (Bắt đầu theo dõi, Ngày ghi, Ngày kết thúc, Ngày hoàn thành) → ô ngày có sẵn hôm nay | đặc tả "NgayDoiDuoc BỎ"; một kiểu cho mọi ngày |
| Q3 | `DemoBar` (T12 e) được loại khỏi phép quét `type="date"` | hai luật đặc tả đá nhau (M2) |
| Q4 | Kiểu tuần: ô hiện ngày Thứ Hai `dd/mm/yyyy`, dòng phụ `W4 SEP · 21/09 – 27/09`; gõ ngày nào cũng nhảy về T2 (CN khi `moc="cuoi"`) | ô vẫn gõ được; tuần hiện là tuần |
| Q5 | `dd/mm` = năm của hôm nay; `ngay-hoac-thang`: hai phần mà phần sau 4 chữ số = tháng | giống `docNgayGo` cũ; T9 |
| Q6 | Nhận dấu `/ . -`; năm 2 chữ số **không** nhận (báo "Năm cần đủ 4 số") | tránh đoán sai thế kỷ |
| Q7 | "Gần đây": ngày 5 mục (quá khứ, hoặc hôm nay trở đi khi `toiThieu = hôm nay`); tuần 3 mục; tháng 3 mục | thay danh sách thả cũ (T11) |
| Q8 | Chỉ giữ luật khoảng **đang có** (`min`/`max`, `lui/toi`, `soThang`); không thêm "không trước hôm nay" cho hạn | T11 "giữ nguyên luật từng chỗ" |
| Q9 | Chữ "Khác" lưu vào cột có sẵn (`observation`, `custom_name`, `dismiss_reason_text`, `remove_reason_text`, `end_reason`); vi phạm và PA đề xuất **không có cột** → ghép `{ghi rõ} — {mô tả}` | không migrate |
| Q10 | Luật "Khác" ≥ 3 kiểm ở **cả** web và máy chủ; luật 30 ký tự (V05, `cases.ts:467`) bỏ | T13 |
| Q11 | `/ref/nguoi` không gõ gì → 20 người (GV cùng lớp đầu), có gõ → 12; tên ngoài cần ≥ 2 ký tự | T14; danh sách người ít |
| Q12 | Việc Vận hành chưa nhận tên ngoài ở PR này (cần cột mới) → PR-DUYET | "Không migrate" (Câu 1) |
| Q13 | Người theo dõi (Vận hành) và người phụ trách xử lý Ý thức giữ **chỉ tài khoản** | họ phải đăng nhập để thấy/nhận việc |
| Q14 | `Status kind="doing"` đổi sang trung tính (hết xanh dương) | A8 N1 chuyển; xanh chỉ cho ô điểm |
| Q15 | `NhanTrangThai` áp ở Phối hợp SOS, bảng Case, Học viên & Lớp (góc SOS); Vận hành giữ `Status` | trạng thái Tạm ngưng/Dừng chưa có trong 6 nhãn |
| Q16 | Thêm `duyet`, `xu-ly-vi-pham`, `ke-hoach-bo-tro`, `mini-test`; giữ khoá `xac-minh-sos` (chữ "Xác nhận nguyên nhân") | K1-56 + T66 (M5); như N1 Q4 |
| Q17 | Xoá hàm `Drawer`; file `Drawer.tsx` giữ `Modal`, `ConfirmDialog` (không đổi tên file) | ít import phải sửa |
| Q18 | Panel/modal/lịch nhận focus ở **khung** (`tabIndex=-1`), không tự nhảy vào ô đầu | không bật bàn phím ảo trên điện thoại; trình đọc màn hình đọc tên panel |
| Q19 | Tab trang = `HangTab`; bộ lọc = `BoLocDoan`; lựa chọn trong form = `NutChon`; "đang chọn" chung một màu (ink-800 + viền teal-600 + ✓) | E6 + B3 |
| Q20 | ✓ của `NutChon` luôn giữ chỗ (ẩn khi chưa chọn) | chữ không nhảy khi chọn — "cột thẳng" |
| Q21 | `ngay-hoac-thang` dựng + kiểm ở PR này, chỗ dùng đầu tiên là PR-NHAP | chưa có ô nào cần nó hôm nay |
| Q22 | impeccable `init` dùng đặc tả §7.1 làm câu trả lời phỏng vấn; `buildPath: "code"`; không bật live mode | chủ sản phẩm đã duyệt §7.1; không đọc mã |
| Q23 | Ô chọn người bỏ chữ "người ngoài" → "ngoài hệ thống" | cùng chữ với dòng T14 |

## Mâu thuẫn nguồn ↔ mã thật

- **M1** YC-9 ghi "19 file dùng `ChonNgayGan/ChonTuan/ChonThang`"; thật: **8 file, 20 chỗ gọi** + `NgayDoiDuoc` ở 3 file (4 chỗ).
- **M2** T12 (e) "thanh ngày bản demo không đổi" ↔ nghiệm thu YC-9 "không còn `type="date"` trong `web/src`" → loại `DemoBar` khỏi phép quét (Q3).
- **M3** T14 "luôn có dòng Dùng tên ngoài hệ thống" + YC-10 "Vận hành nhận tên ngoài" ↔ `tasks` chỉ có `assignee_user_id`
  (`schema.sql:1338`), `mgmttasks.ts:369` kiểm tài khoản → cần migrate (Q12, Câu 1).
- **M4** §10.2 kể "báo cáo tutor · loại việc Vận hành · lý do từ chối duyệt" có "Khác": `tutor_other` là dòng chữ tự do của báo cáo
  (`shared/domain/worklist.ts:17`), Vận hành không có mục Khác, chưa có lý do từ chối duyệt → không có gì để áp (ghi mô tả PR).
- **M5** K1-56 đặt tên loại hạn `xu-ly-vi-pham`, "kế hoạch bổ trợ"; T66 đặt `duyet`, `y-thuc`, `mini-test` → lấy hợp của hai (Q16).
- **M6** HE_GIAO_DIEN §3 "không thêm component thứ sáu" ↔ đặc tả §7.6 thêm 4 → theo đặc tả mới, sửa HE §3 (Task 10).
- **M7** Hai ô ngày ở `CaseSosControls.tsx:122, 153` nằm trong `PresetPlanActions` mà N1 đã bỏ chỗ gọi → vẫn thay (phép quét), PR-SOS xoá.
- **M8** `ACADEMIC_SUPPORTS`/`OPS_POLICIES` có "Khác" nhưng không dùng → không áp `OKhac`, chuyển PR-Dọn.
- **M9** UX-E E1 kể 6 panel `Drawer`; thật có **15 chỗ** ở 14 file (thêm Tài khoản, Danh mục ×2, Ô báo cáo, Chi tiết công việc,
  4 panel chỉ xem, trang dev) → đổi hết (E1 "chỉ còn một khung").
- **M10** "Bắt gõ 3 ký tự" của `ChonPhuTrach` thật ra nằm ở máy chủ `timNguoi.ts:111` + chữ gợi ý `PeoplePicker.tsx:333` → sửa gốc (Task 2, 4).
- **M11** §10.2 "Phối hợp SOS" trong danh sách chọn người: form "Đánh dấu xong" chưa có ô người (máy chủ đã nhận `performerName`) → thêm ô (Task 7).

## Câu cần chủ sản phẩm quyết

1. **Việc Vận hành giao cho người ngoài hệ thống** (ví dụ "Tổ chuyên môn", tutor): cần thêm **một cột** trong cơ sở dữ liệu. (A) cho
   PR-NEN thêm cột nhỏ này (PR thành "có migrate", deploy đợt 1 phải chạy migrate) · (B) **để PR-DUYET đợt 2 làm** (khuyến nghị — PR-NEN
   giữ "không migrate", làn C deploy nhẹ). Mặc định kế hoạch theo (B).

## Nhật ký

- Mốc B (Task 0): **1367** phép kiểm + 20 tốc độ, typecheck xanh (28/09, `66446cd`).
- N1 / LOP đã merge lúc bắt đầu? **Chưa** (chưa có nhánh/PR N1, LOP trên origin) — làm Task 0–4 trước · Cổng rebase Task 5: rebase lên N1 phần 1 (#108), rồi lại lên N1 phần 2 (#110) ở vòng R2 (nhánh sao lưu `backup/pr-nen-truoc-rebase-n1`, `…-n1b`) · Cổng LOP Task 11: LOP #112 merge 28/09 → **gộp `main` một lần** (merge, không rebase 24 commit: Header bị cả hai PR sửa, gộp một lần đối chiếu bản NEN cuối ít sai hơn; sao lưu `backup/pr-nen-truoc-rebase-lop`). Xung đột: `run.ts` (giữ cả hai đăng ký), `routes/index.ts` (gộp import), `form.tests.ts` (tên lớp mới `MB FOU 12`), `suaLoiNong.tests.ts` (gộp danh sách loại trừ), `CatalogAdmin.tsx` (lấy bản LOP — bỏ hàng nút cách chấm/kỹ năng — rồi `Drawer` → `KhungPanel`), `Header.tsx` (tìm học viên + lớp của LOP đi chung bằng phím mũi tên của NEN; chữ `Không tìm thấy học viên hoặc lớp`), `plan.md`, đặc tả §8, `TU_DIEN` (§10 LOP, NEN thành §11).
- Phần chờ LOP (Task 11): Chuyển tiếp lớp → `KhungPanel longTrong rong="rong"` (thêm prop `longTrong` = không vào `khoPanelChung`, để Tạo lớp mở đè không đóng Chuyển tiếp — thay cách `Drawer` của LOP) · 3 ô ngày/tháng (Ngày chuyển, Dự kiến thi, Xem lại) → `ONgay` · `PhanDoan` (Tạo lớp, Sửa thông tin lớp) vẽ bằng `NutChon` · "Cách xem" tab Học viên của lớp → `BoLocDoan` · xoá hàm `Drawer` · bỏ 3 dòng loại trừ `modules/classes/` (khối 5, 8, 9). `ClassProgressPanel` (Lộ trình lớp, dùng `Field`) vào nhóm panel chưa áp `useLoiForm` như 6 panel Task 9; `TransitionPanel` được loại khỏi N1 (7) vì báo lỗi tại từng dòng. `TeacherAssignPanel`: ô chọn GV giữ `<select>` (ngoại lệ T14), không có nút lựa chọn nào khác. Check: **1444** phép kiểm + 20 tốc độ + typecheck xanh.
- Bấm thử Task 11 (29/09, Playwright kênh Chrome, API 4177 · Vite 5377, 1440 + 375 px + một lượt bàn phím): **66/66 đạt**. Ảnh "sau" ở `thiet-ke/anh/pr-nen/` 01–11 (thêm `10-chuyen-tiep-tao-lop`, `11-chuyen-tiep`); **không** chụp ảnh "trước" (main) — so trước/sau xem ảnh của PR-UX0/PR-LOP. Ngoài kịch bản: form "Công việc mới" ở Vận hành vẫn là `Modal` giữa màn (không phải panel) — ngoài phạm vi E1 (E1 chỉ đổi `Drawer`).
- Dòng thật lệch kế hoạch: Task 0 đối chiếu `type="date"`, `NgayDoiDuoc`, `<Drawer`, `? 'btn-primary' : ''`, `term.length < 3` — **khớp** (lệch 0 dòng). Kế hoạch + mockup đã có trên `main` (bỏ bước chép). Session code chạy theo `subagent-driven-development` (chủ sản phẩm yêu cầu), subagent Opus 5.5.
- impeccable: `PRODUCT.md`/`DESIGN.md` có tạo ở 0b rồi **gỡ** (commit `96ef2b1`) theo CLAUDE.md (PR #107: chỉ session planning tạo) · audit + polish ở commit `PR-NEN (11): impeccable audit + polish…`; phần chờ LOP (29/09) không chạy audit riêng — chỉ bấm thử.
- Số chỗ sửa kỳ vọng chữ (Task 2, 7): xem diff `server/src/tests/*` của commit Task 2, 7.
- Panel chỉ xem mở từ trong panel khác (Task 9): Tạo lớp trong Chuyển tiếp giải bằng `longTrong` (trên).
