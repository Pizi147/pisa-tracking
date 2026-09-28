# PR-NHAP · Thêm học viên (email, ngày thi, tuần bắt đầu, cột Tình trạng) — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (hoặc subagent-driven-development nếu chủ sản phẩm
> yêu cầu) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Panel **Thêm học viên** theo mockup **M2**: hàng cao đều, lỗi/lưu ý dồn về cột cuối **Tình trạng** (bấm mở một dòng chi tiết
trải ngang); thêm cột **Email** (bắt buộc khi thêm mới) và **Thi dự kiến** (`dd/mm/yyyy` hoặc `mm/yyyy`); bỏ ô "Định dạng ngày" — máy chủ
đọc `dd/mm/yyyy`, từ chối ngày không có thật (31/02); cột dán nhận **theo tiêu đề**; tuần bắt đầu điền sẵn ngay khi mở (FT vào muộn →
tuần này, K2-19), mỗi dòng là ô ngày thống nhất kiểu tuần; cột Lộ trình trong file bị bỏ qua (lộ trình theo lớp, K2-20); thêm xong panel
ở lại với các dòng còn lỗi + khối kết quả (K2-21); Thông tin HV cho GVCN/QL sửa họ tên, ngày sinh, email, tuần bắt đầu (có nhật ký); HS
cũ thiếu email không bật "Thiếu thông tin" (T8, H6). **Sau cổng PR-MT** (PR-MT tự gắn `taoMtMacDinh` vào `commitIntake`): cột "Đã thi
tới MT", báo trước "MT lịch sử", khối kết quả có số MT lịch sử, câu xác nhận dời MT khi đổi tuần bắt đầu.
**Architecture:** Luật thuần mới ở `shared/domain/nhapHocVien.ts` (đọc ngày, đọc email, nhận dạng cột theo tiêu đề, bộ cột theo chương
trình, tuần bắt đầu mặc định) — web và máy chủ gọi **cùng** hàm. Máy chủ: sửa `server/src/classes/intake.ts` (parse/preview/commit),
`students.ts#updateStudent`, `fasttrack/cycles.ts` (`updateCycle`, `examPlanOf`). Migrate riêng `server/src/migrate/prNhap.ts` (một dòng
gọi, T78). Web: viết lại lưới `IntakePanel.tsx`, sửa `ThongTinPanel` (trong `StudentManagePanel.tsx`) và ô thi ở `StudentPlanPanel.tsx`.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); phép kiểm `server/src/tests/*`
(harness `check()` của `run.ts`), chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §4.2 YC-5.1…5.4 · §3.2 T8, T9, T33/T34 (chỉ phần gọi), T44
(chỉ câu "GVCN vẫn tự sửa họ tên, ngày sinh, email, tuần bắt đầu") · §5.2 M1, M6 (phần gọi) · §8 dòng PR-NHAP · §10.4 H1 (phần NHAP), H6 ·
báo cáo rà `thiet-ke/ra-27-09/` **K2-19, K2-20, K2-21, K2-33, K2-41, K5-33** (K5-33: chỉ ghi nhận — quyền thuộc PR-DUYET) · kế hoạch cũ
`docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md` UX-C **C10** + ghi chú panel (`DANH_GIA_GIAO_DIEN_2026-09-26.md:304`) ·
mockup `thiet-ke/mockup/19-nang-cap-27-09.html` **M2** (dòng 281–312; câu "Placement" đã bỏ theo K2-41).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-NHAP** · đợt 2 · làn **C** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-nhap-them-hoc-vien` · `.claude/worktrees/pr-nhap-them-hoc-vien` (từ `origin/main`) |
| Cổng thử | API **4177** · Vite **5377** (không dùng 4000/5173; A 4157/5357 · B 4167/5367 · D 4187/5387 chạy song song) |
| Model | **Sonnet 5 · High** · phương án B: **Fable 5.1 · High** |
| Người rà | **Opus 5.5**, session riêng (T52) — session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Có** — `students.email TEXT`, `learning_cycles.exam_date TEXT` (`server/src/migrate/prNhap.ts`, chạy lặp được). Không đổi dữ liệu cũ, không lệnh chạy thử (K5 §5 dòng PR-NHAP) |
| Skill thiết kế | **`/ponytail lite` đầu phiên** (PR có giao diện). **impeccable:** `clarify` ở Task 5 (câu lỗi/lưu ý, nhãn cột, khối kết quả — cả chữ máy chủ trả về trong `nhapHocVien.ts`/`intake.ts`); `audit` rồi `polish` ở Task 9 cho `IntakePanel` + `ThongTinPanel`. Không `init`/`document`/`hooks on`. Không taste-skill |
| Phụ thuộc | **PR-NEN** (đã merge #113: `ONgay`, `KhungPanel rong="toan"`, `useLoiForm`). **PR-MT** (làn B, chạy song song): **merge MT trước NHAP**. Task 0–6, 8 làm trước; **Task 7 qua 🛑 cổng PR-MT** (hợp đồng hàm đã chốt trong kế hoạch PR-MT) |
| Không làm | Quyền sửa target/lộ trình/lớp của GVCN + nút "Đề xuất sửa" (T44, K5-33 → **PR-DUYET**) · luật tạo MT, cờ `lich_su`, lệnh `bo-sung-mt-mac-dinh`, luật dời lịch khi đổi tuần bắt đầu (T33–T35, M6 → **PR-MT**) · Xếp lịch MT tuần đã qua (K2-33(1) phần M9 → **PR-XLMT**) · bảng→thẻ điện thoại (PR-UXD) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-NHAP (n): …`.
- Treo quá 10 phút → quét tiến trình `node … tests/run.js` còn sống, tắt hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px **một lần** ở Task 9 (Playwright kênh Chrome, đăng nhập demo
  `POST /api/demo/session {userId}`: QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang id 9**), ảnh
  trước/sau lưu `thiet-ke/anh/pr-nhap/`. Chạy song song: `PORT=4177` cho API, Vite tạm cổng 5377 trỏ proxy về 4177 (chạy trong
  worktree bằng `npm run dev`, không dùng `preview_start` — nó chạy từ thư mục chính).
- Không chạm Turso, không deploy, không chạy `migrate` trên bản chính. Gặp mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4177/5377, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.

### Ranh giới file với ba PR chạy song song (DUYET · MT · MON)

| File | PR khác (dự kiến) | PR-NHAP chỉ được sửa |
|---|---|---|
| `server/src/schema.sql` | DUYET (bảng `yeu_cau_duyet`), MT (`assessment_attempts.lich_su`), MON (tuỳ) | hai cột **cuối khối** `students` (:266-281) và `learning_cycles` |
| `server/src/migrate.ts` | cả ba | **một** import + **một** dòng `migratePrNhap(conn, applied);` cuối danh sách (sau `migratePrLop` :457 và sau dòng của PR đã merge) |
| `server/src/tests/run.ts` | cả ba | khối đăng ký `runPrNhapTests` **cuối file**; sửa khối **12. Thêm học viên hàng loạt** (:1422-1625) + các lời gọi `commitIntake` (:8980) |
| `shared/domain/index.ts`, `package.json`, `CODE_MAP.md`, `plan.md`, `TRIEN_KHAI.md` | cả ba | chỉ thêm dòng |
| `server/src/fasttrack/cycles.ts` | **DUYET** (dòng kiểm quyền `createCycle` :91, `updateCycle` :129 — `cycle.edit` cho target/lộ trình, `reviseTarget` :380) · **MT** (`createCycle` :87-124, `updateCycle` :200-219: gọi lõi dời lịch) | `examPlanOf` (:62-86) + **hai khoá mới** `examDate`, `startWeek` trong `updateCycle` (trước vòng `map` :148). Không đụng khối quyền và khối dời lịch |
| `server/src/classes/intake.ts` | **MT** (Task 3 của MT): **một** khối gọi `taoMtMacDinh` thay chú thích :478-485 + `canPlanWeeks: true` :361 · **MON** `createClass` (:505-559, bộ môn lớp) | :1-499 (parse/preview/commit). Rebase sau MT: **giữ** lời gọi `taoMtMacDinh` của MT, chỉ thêm `daThiToiMt` + thu kết quả (Task 7). Giữ nguyên `createClass`, `taoLopVaPhanCong` |
| `server/src/students/profile.ts` | MT (nhãn `lịch sử`), DUYET (`viewer.canEditCycle`) | trường `email` ở khối :739-741 · `planSource` ở `base` lượt :556 (Task 7) |
| `web/src/modules/students/StudentManagePanel.tsx` | DUYET (có thể thêm "Đề xuất sửa") | chỉ `ThongTinPanel` (:205-291) |
| `web/src/modules/students/StudentPlanPanel.tsx`, `StudentDetailPage.tsx` | DUYET (cờ `canEditCycle`: ô target/lộ trình chỉ đọc; `StudentDetailPage.tsx:238` ⋮ cho GVBM), MT (lịch MT gợi ý, RF) | chỉ ô thi dự kiến (:46-64, :116-127) · `StudentDetailPage` chỉ thêm `email` (:392-397) |
| `server/src/seed/build.ts` | MT (HS cũ có MT lịch sử), DUYET, MON | chỉ câu `INSERT INTO students` (:90-99) |
| `server/src/routes/index.ts` | cả ba | chỉ khối `/intake/*` (:1184-1215) |
| `web/src/ui/ONgay.tsx` | (không PR nào của đợt 2 dự kiến sửa) | thêm prop `gon` (Task 5) |

Gặp xung đột khi rebase: giữ **cả hai** phần (file chỉ thêm khối/dòng), ghi Nhật ký.

## Global Constraints

- **Tinh tế (chủ sản phẩm):** hàng lưới **cao đều** (không dòng chữ nào chèn dưới ô); cột thẳng, số căn phải `tabular-nums`; dấu
  trạng thái nhỏ gọn; không lặp thông tin (cảnh báo trùng hồ sơ chỉ ở dòng chi tiết, không thêm hộp riêng). Ký hiệu nhỏ (▾ ▸) vẽ **SVG**
  (Inter cỡ nhỏ ▾ thành dấu chấm — dùng `DauDuoi`/`MuiTenMo` sẵn có). **Không dùng ⚠** cho lỗi ô (⚠ chỉ nghĩa quá hạn, G-4).
- **Chữ:** `thiet-ke/TU_DIEN_VA_CHU.md`. "Lớp thường" (không "Normal"), "Tuần bắt đầu", "Thi dự kiến", "Tình trạng". Không lộ chữ máy:
  ngày ISO, `ratio`, `ielts_band`, `examDate`… không hiện trên màn hình hay trong câu lỗi máy chủ trả về.
- **Một luật, hai phía:** web không tự viết lại luật đọc ngày/email/cột — gọi hàm của `nhapHocVien.ts`. Máy chủ **luôn** kiểm lại
  (web có thể bị bỏ qua).
- **Luật thuần có phép kiểm:** `server/src/tests/prNhap.tests.ts` (`runPrNhapTests(t)`, tạo ở Task 1, đăng ký **cuối** `run.ts`).
- **SQL:** chỉ `?` (Turso bỏ qua tham số đặt tên; `db.ts` cấm), mọi câu ghi trong `tx()`, `ALTER TABLE` kiểm cột trước (chạy lặp được).
- **Giữ hành vi:** phép kiểm cũ so chữ/luật cũ thì sửa kỳ vọng sang mới (cùng ý, không xoá); số phép kiểm không giảm.
- **Ngày nghiệp vụ:** `demoToday()` (máy chủ) / `useNgayNghiepVu().homNay` (web). Không `new Date()` cho "hôm nay".
- **Không đường GET mới** trong PR này → không phải thêm `server/src/tests/tocDoDuong.ts`. Nếu lỡ thêm GET: phải thêm dòng có trần ở đó.

## Hướng dẫn riêng cho model thực thi (Sonnet / Fable)

1. Chép **nguyên văn** các khối mã có sẵn trong kế hoạch (đọc ngày, email, tiêu đề cột, tuần mặc định) — đây là chỗ dễ sai nhất.
2. Mỗi `issue` phải có `muc: 'loi' | 'luu_y'`. **Cấm** phân biệt lỗi/lưu ý bằng cách dò chữ trong `message` (lỗi cũ `IntakePanel.tsx:164`,
   `intake.ts:408` — xem Mâu thuẫn #1).
3. Ô ngày thống nhất (`ONgay`) trả **ISO**; ô gõ tay trong lưới (ngày sinh, thi dự kiến) gửi **chữ thô** — máy chủ đọc bằng `docNgayNhap`.
4. Sau khi thêm thành công **phải đổi khoá idempotency** (`idempotencyKey.current = moiKhoa()`), nếu không lần thêm các dòng đã sửa sẽ trả
   lại kết quả cũ từ `demo_config` mà không ghi gì.
5. 🛑 Task 7 chỉ bắt đầu khi `git log origin/main --oneline | grep -i "PR-MT"` có commit merge. Chưa có → làm Task 8, 9 (phần không cần
   MT), ghi Nhật ký "chờ PR-MT", **dừng và báo**, không tự viết hàm tạo MT, không tự gắn lời gọi MT vào `commitIntake` (PR-MT làm).
6. Không sửa quyền (`permissions.ts`), không thêm nút "Đề xuất sửa" — đó là PR-DUYET.

## Task 0 · Nhánh, mốc

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-nhap-them-hoc-vien -b pr-nhap-them-hoc-vien origin/main`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch đợt 2> -- docs/superpowers/plans/2026-09-29-pr-nhap-them-hoc-vien.md`.
- [ ] Ghi Nhật ký: "PR-MT đã merge: có/không" (`git log origin/main --oneline | grep -i "PR-MT"`). Hợp đồng với PR-MT lấy từ
  `docs/superpowers/plans/2026-09-29-pr-mt-lich-mt.md` Task 1 + Task 3 (chép ở Task 7).
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm đạt).
- [ ] Đối chiếu dòng mã kế hoạch dẫn (grep `parseDateAs`, `isWarning`, `const blocking = r.issues`, `function docNgaySinh`,
  `NHẬP HÀNG LOẠT KHÔNG LẬP LỊCH MT`) — lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-NHAP (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần `shared/domain/nhapHocVien.ts` (YC-5.2, YC-5.3, YC-5.4, T8, T9, C10, K2-19)

**Files:** tạo `shared/domain/nhapHocVien.ts` (+ `export * from './nhapHocVien.ts';` cuối `shared/domain/index.ts`), tạo
`server/src/tests/prNhap.tests.ts`, đăng ký cuối `server/src/tests/run.ts` theo mẫu `runPrLopTests` (:9678-9679).

- [ ] Viết **nguyên văn**:
```ts
/**
 * PR-NHAP — luật thuần của panel Thêm học viên và Thông tin HV (YC-5.1…5.4, T8, T9, UX-C C10, K2-19, K2-20).
 * Web và máy chủ gọi CÙNG các hàm này; máy chủ luôn kiểm lại.
 */
import { docONgay } from './oNgay.ts';
import { mondayOfDate } from './week.ts';

export type MucVanDe = 'loi' | 'luu_y';
/** Một vấn đề của một ô. `loi` chặn thêm dòng đó; `luu_y` chỉ để biết. `row` = số dòng trong lưới (0 = cả lô). */
export type VanDeNhap = { row: number; field: string; message: string; muc: MucVanDe };

const ISO_NGAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_THANG = /^\d{4}-\d{2}$/;
const TRONG = new Set(['', '-', '–', '—', 'n/a']);

/**
 * Ô ngày của bảng dán / ô gõ tay (C10, YC-5.3). Nhận `dd/mm/yyyy`, `d/m/yyyy` (dấu / . -) và ISO `yyyy-mm-dd` (giá trị của ô ngày
 * thống nhất + lời gọi nội bộ). `choThang` (Thi dự kiến, T9): nhận thêm `mm/yyyy` / `yyyy-mm` → trả tháng `yyyy-mm`.
 * KHÔNG nhận `dd/mm` thiếu năm, KHÔNG đoán `mm/dd`. Ô trống hoặc "-" → { iso: null, loi: null }.
 */
export function docNgayNhap(raw: unknown, homNay: string,
  luat: { choThang?: boolean; toiDa?: string | null; toiThieu?: string | null } = {}): { iso: string | null; loi: string | null } {
  const s = String(raw ?? '').trim();
  if (TRONG.has(s.toLowerCase())) return { iso: null, loi: null };
  const mau = luat.choThang ? 'Gõ dd/mm/yyyy hoặc mm/yyyy' : 'Gõ dd/mm/yyyy';
  let text = s;
  let kieu: 'ngay' | 'thang';
  if (ISO_NGAY.test(s)) { text = `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`; kieu = 'ngay'; }
  else if (luat.choThang && ISO_THANG.test(s)) { text = `${s.slice(5, 7)}/${s.slice(0, 4)}`; kieu = 'thang'; }
  else {
    const p = s.split(/[/.\-]/);
    if (p.length === 3 && /^\d{1,2}$/.test(p[0]) && /^\d{1,2}$/.test(p[1]) && /^\d{4}$/.test(p[2])) kieu = 'ngay';
    else if (luat.choThang && p.length === 2 && /^\d{1,2}$/.test(p[0]) && /^\d{4}$/.test(p[1])) kieu = 'thang';
    else return { iso: null, loi: mau };
  }
  const r = docONgay(text, kieu, homNay, { toiDa: luat.toiDa, toiThieu: luat.toiThieu });
  return { iso: r.iso, loi: r.iso ? null : (r.loi ?? mau) };
}

const MAU_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Email học viên (T8): cắt khoảng trắng, chữ thường. Không bắt duy nhất (anh chị em có thể dùng chung email phụ huynh). */
export function docEmail(raw: unknown): { email: string | null; loi: string | null } {
  const s = String(raw ?? '').trim().toLowerCase();
  if (TRONG.has(s)) return { email: null, loi: null };
  if (s.length > 254 || !MAU_EMAIL.test(s)) return { email: null, loi: 'Chưa đúng dạng email, ví dụ an.nguyen@gmail.com' };
  return { email: s, loi: null };
}

export type CotNhap = 'fullName' | 'dob' | 'email' | 'baselineScore' | 'entryListening' | 'entryReading' | 'entryWriting'
  | 'entrySpeaking' | 'target' | 'examDate' | 'startWeek' | 'classCode' | 'route' | 'consultant';

/** Tiêu đề cột đã chuẩn hoá (`chuanTieuDe`) → cột. `classCode`, `route` nhận diện để KHÔNG lệch cột rồi bỏ qua (K2-20). */
const TIEU_DE: Record<CotNhap, string[]> = {
  fullName: ['ho ten', 'ho va ten', 'hoten', 'ten', 'ten hoc vien', 'hoc vien', 'full name', 'name'],
  dob: ['ngay sinh', 'sinh ngay', 'dob', 'date of birth'],
  email: ['email', 'e mail', 'mail', 'gmail', 'dia chi email', 'thu dien tu'],
  baselineScore: ['ovr', 'ovr dau vao', 'diem ovr', 'dau vao', 'diem dau vao', 'baseline', 'entry', 'overall'],
  entryListening: ['l', 'listening', 'nghe', 'l dau vao'],
  entryReading: ['r', 'reading', 'doc', 'r dau vao'],
  entryWriting: ['w', 'writing', 'viet', 'w dau vao'],
  entrySpeaking: ['s', 'speaking', 'noi', 's dau vao'],
  target: ['target', 'muc tieu', 'diem cam ket', 'cam ket'],
  examDate: ['thi du kien', 'ngay thi', 'ngay thi du kien', 'thang thi', 'thang du kien thi', 'du kien thi', 'ngay thi ielts', 'exam', 'exam date'],
  startWeek: ['tuan bat dau', 'tuan bat dau hoc', 'tuan hoc dau tien', 'start week', 'ngay bat dau', 'bat dau'],
  classCode: ['lop', 'ma lop', 'class'],
  route: ['lo trinh', 'route'],
  consultant: ['tu van vien', 'tvv', 'consultant'],
};
const BO_QUA_IM = new Set(['', 'stt', 'so thu tu', 'tinh trang']);

export const chuanTieuDe = (h: string) => h.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** YC-5.2: cột dán nhận THEO TIÊU ĐỀ, không theo thứ tự. Cột lạ/lặp → `boQua` (báo người dán); cột lặp lấy cột đầu. */
export function nhanDangCot(dongDau: string[]): { cot: (CotNhap | null)[]; boQua: string[] } {
  const bang = new Map<string, CotNhap>();
  for (const [k, ds] of Object.entries(TIEU_DE)) for (const a of ds) bang.set(a, k as CotNhap);
  const daCo = new Set<CotNhap>();
  const boQua: string[] = [];
  const cot = dongDau.map((h) => {
    const c = chuanTieuDe(h);
    const k = bang.get(c) ?? null;
    if (!k || daCo.has(k)) { if (!BO_QUA_IM.has(c)) boQua.push(h.trim()); return null; }
    daCo.add(k);
    return k;
  });
  return { cot, boQua };
}

export type CotLuoi = { key: CotNhap; nhan: string; batBuoc?: boolean; so?: boolean };
const COT_DAU: CotLuoi[] = [
  { key: 'fullName', nhan: 'Họ và tên', batBuoc: true }, { key: 'dob', nhan: 'Ngày sinh' }, { key: 'email', nhan: 'Email', batBuoc: true },
];
const COT_FT: CotLuoi[] = [
  { key: 'baselineScore', nhan: 'OVR', so: true }, { key: 'entryListening', nhan: 'L', so: true },
  { key: 'entryReading', nhan: 'R', so: true }, { key: 'entryWriting', nhan: 'W', so: true },
  { key: 'entrySpeaking', nhan: 'S', so: true }, { key: 'target', nhan: 'Target', so: true }, { key: 'examDate', nhan: 'Thi dự kiến' },
];
const COT_TUAN: CotLuoi = { key: 'startWeek', nhan: 'Tuần bắt đầu', batBuoc: true };
/** YC-5.2 thứ tự cột. FT: Họ tên · Ngày sinh · Email · OVR · L · R · W · S · Target · Thi dự kiến · Tuần bắt đầu.
 *  Lớp thường (Pre FOU · FOU · BE · ELE): Họ tên · Ngày sinh · Email · Tuần bắt đầu (K2-41). Cột Tình trạng do giao diện vẽ. */
export const cotLuoiNhap = (lopThuong: boolean): CotLuoi[] => (lopThuong ? [...COT_DAU, COT_TUAN] : [...COT_DAU, ...COT_FT, COT_TUAN]);
const NHAN_KHAC: Record<string, string> = { classCode: 'Lớp', route: 'Lộ trình', consultant: 'Tư vấn viên' };
export const nhanCotNhap = (field: string) => [...COT_DAU, ...COT_FT, COT_TUAN].find((c) => c.key === field)?.nhan ?? NHAN_KHAC[field] ?? field;

/**
 * Tuần bắt đầu mặc định cho cả lô (YC-5.4 + K2-19). Lớp thường: tuần khai giảng. Lớp FT nhận em cuốn chiếu: lớp chưa khai giảng
 * hoặc đang ở tuần học 1–2 → tuần khai giảng; muộn hơn (hoặc lớp chưa khai ngày) → TUẦN NÀY — tránh biến MT1 thành "MT lịch sử"
 * của một bài em chưa từng thi. Trả Thứ Hai ISO; `null` = lớp thường chưa khai tuần khai giảng.
 */
export function tuanBatDauMacDinh(lop: { lopThuong: boolean; khaiGiang: string | null }, homNay: string): string | null {
  const tuanNay = mondayOfDate(homNay);
  if (!lop.khaiGiang) return lop.lopThuong ? null : tuanNay;
  const kg = mondayOfDate(lop.khaiGiang);
  if (lop.lopThuong) return kg;
  const soTuanDaQua = Math.round((Date.parse(tuanNay) - Date.parse(kg)) / (7 * 86_400_000));
  return soTuanDaQua <= 1 ? kg : tuanNay;
}
```
- [ ] **Phép kiểm** (`prNhap.tests.ts`, mẫu đầu file như `prLop.tests.ts:1-10`, `const d = await import('../../../shared/domain/index.ts')`):
  - `NHAP (1) · docNgayNhap` — `h='2026-09-29'`: `'12/05/2008'→'2008-05-12'` · `'5/3/2008'→'2008-03-05'` · `'2008-05-12'→'2008-05-12'` ·
    `'31/02/2010'` → `loi === 'Ngày không có thật'` · `'12/05'` → có `loi` · `'-'` và `''` → `{iso:null, loi:null}` ·
    `('01/01/2030', h, {toiDa:h})` → có `loi` · `('05/2027', h, {choThang:true})→'2027-05'` · `('05/2027', h)` → có `loi` ·
    `('13/2027', h, {choThang:true})` → có `loi` · `('15/01/2027', h, {choThang:true})→'2027-01-15'` · `('08/2026', h, {choThang:true, toiThieu:h})` → có `loi`.
  - `NHAP (1) · docEmail` — `' An.Nguyen@Gmail.com '→'an.nguyen@gmail.com'` · `'abc'`, `'a@b'`, `'a b@c.vn'` → có `loi` · `'-'` → `{email:null, loi:null}`.
  - `NHAP (1) · nhanDangCot theo tiêu đề` — `['Họ và tên *','Ngày sinh','E-mail','Thi dự kiến','Ghi chú','STT','Lộ trình','Họ tên']` →
    `cot = ['fullName','dob','email','examDate',null,null,'route',null]`, `boQua = ['Ghi chú','Họ tên']`.
  - `NHAP (1) · cotLuoiNhap` — lớp thường đúng 4 khoá `fullName,dob,email,startWeek`; FT 11 khoá, `examDate` ngay trước `startWeek`.
  - `NHAP (1) · tuanBatDauMacDinh (K2-19)` — `h='2026-09-29'`: FT kg `'2026-09-21'→'2026-09-21'` · `'2026-09-14'→'2026-09-28'` ·
    `'2026-10-05'→'2026-10-05'` · `null→'2026-09-28'`; lớp thường `'2026-06-03'→'2026-06-01'` · `null→null`.
- [ ] `npm run check` → commit `PR-NHAP (1): luật thuần nhập học viên (ngày, email, cột theo tiêu đề, tuần mặc định)`.

## Task 2 · Migrate `prNhap.ts` + `examPlanOf` đọc ngày thi (T9, T78)

**Files:** tạo `server/src/migrate/prNhap.ts`; sửa `server/src/migrate.ts` (import :13 + một dòng sau :457), `server/src/schema.sql`,
`server/src/fasttrack/cycles.ts:62-86`.

- [ ] `prNhap.ts`:
```ts
/** PR-NHAP (YC-5.2, T8, T9, T78): email học viên + NGÀY thi dự kiến. Chỉ thêm cột, không đổi dữ liệu cũ — chạy lại không làm gì. */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);

export function migratePrNhap(conn: any, applied: string[]) {
  if (!coCot(conn, 'students', 'email')) {
    conn.exec('ALTER TABLE students ADD COLUMN email TEXT');
    applied.push('Thêm email học viên (bắt buộc khi thêm mới; học viên cũ để trống)');
  }
  if (!coCot(conn, 'learning_cycles', 'exam_date')) {
    conn.exec('ALTER TABLE learning_cycles ADD COLUMN exam_date TEXT');
    applied.push('Thêm ngày thi dự kiến cụ thể cho lộ trình (tuỳ chọn)');
  }
}
```
- [ ] `schema.sql`: thêm `email TEXT,` (chú thích "T8: bắt buộc khi thêm mới, HS cũ có thể trống — không vào badge Thiếu thông tin")
  trước `created_at` của `students`; thêm `exam_date TEXT,` ngay sau `exam_period_id` của `learning_cycles` (chú thích "T9: ngày cụ
  thể; có ngày thì `exam_month` + `exam_period_id` suy từ ngày").
- [ ] `examPlanOf`: nhận thêm `exam_date?: string | null`. Có `exam_date` → `{ confidence: 'week', periodId: cycle.exam_period_id ?? null,
  weekStart: mondayOfDate(exam_date), month: exam_date.slice(0, 7), label: ngay(exam_date) }` (`ngay` không truyền `homNay` → `15/01/2027`).
  `exam_month` không đúng `^\d{4}-\d{2}$` (rác từ cột "Ngày thi" cũ — K2-20) → bỏ qua như chưa có (không vẽ nhãn hỏng).
- [ ] Phép kiểm `NHAP (2)`: chạy `migratePrNhap(conn, [])` hai lần → lần hai `applied` rỗng; cột có trong `pragma_table_info`.
  `examPlanOf({ exam_date: '2027-01-15' }).label === '15/01/2027'` và `weekStart === '2027-01-11'`; `examPlanOf({ exam_month: '15/01' }).confidence === 'none'`.
- [ ] `npm run check` → commit `PR-NHAP (2): migrate email + ngày thi, nhãn dự kiến thi đọc ngày`.

## Task 3 · Máy chủ: đọc dán theo tiêu đề, xem trước, ghi (YC-5.1…5.4, T8, T9, C10, K2-19, K2-20, K2-21 phần máy chủ)

**Files:** `server/src/classes/intake.ts:38-499`, `server/src/routes/index.ts:1184-1215`; lời gọi `commitIntake`/`previewIntake` ở
`server/src/tests/run.ts` (khối 12 + :8980), `form.tests.ts:103`, `sosV3.tests.ts:288, 419`, `yThuc.tests.ts:341`, `seed/sosV3Seed.ts:40`.

**Interfaces:**
```ts
export type IntakeRow = { fullName?: string; dob?: string; email?: string; baselineScore?: number | string | null;
  entryListening?: …; entryReading?: …; entryWriting?: …; entrySpeaking?: …; target?: number | string | null;
  examDate?: string; startWeek?: string; classCode?: string; route?: string; consultant?: string };   // bỏ examMonth, startDate
export type RowIssue = VanDeNhap;                                                   // có `muc`
export function parsePaste(text: string): { rows: IntakeRow[]; cotBoQua: string[] }; // không tiêu đề "Họ và tên" → badRequest
export function previewIntake(p, input: { rows; classId?; defaultStartWeek?; defaultClassId? }): IntakePreview;  // bỏ dateFormat
export type IntakeResult = { added: number; skipped: number; failed: RowIssue[]; studentIds: number[]; hangDaThem: number[] };
```
- [ ] **Xoá** `parseDateAs` (:180-193) và mọi tham số `dateFormat` (hàm, route, lời gọi). Xoá `HEADER_ALIASES`, `deaccent` (thay bằng `nhanDangCot`).
- [ ] `parsePaste` (thay :147-178) — **nguyên văn**:
```ts
export function parsePaste(text: string): { rows: IntakeRow[]; cotBoQua: string[] } {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (!lines.length) return { rows: [], cotBoQua: [] };
  const split = (l: string) => (l.includes('\t') ? l.split('\t') : l.split(',')).map((c) => c.trim());
  const { cot, boQua } = nhanDangCot(split(lines[0]));
  if (!cot.includes('fullName')) {
    throw badRequest('Dòng đầu phải là dòng tiêu đề, có cột "Họ và tên" (thêm Ngày sinh, Email… tuỳ bảng). Cột nhận theo tên, không theo thứ tự.');
  }
  const homNay = demoToday();
  const rows: IntakeRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = split(line);
    const row: IntakeRow = {};
    cot.forEach((k, i) => { const v = cells[i]; if (k && v !== undefined && v !== '') (row as any)[k] = v; });
    /* Ô tuần của lưới là ô ngày thống nhất (giá trị ISO) — đổi sẵn chữ dán đọc được; đọc không được thì giữ chữ để xem trước báo lỗi. */
    if (row.startWeek) { const w = docNgayNhap(row.startWeek, homNay); if (w.iso) row.startWeek = mondayOf(w.iso); }
    if (Object.keys(row).length) rows.push(row);
  }
  return { rows, cotBoQua: boQua };
}
```
- [ ] `previewIntake` — giữ khối lớp/quyền (:217-238). Thay phần còn lại theo luật sau (mỗi vấn đề qua hai hàm nhỏ trong vòng dòng:
  `const loi = (field, message) => rowIssues.push({ row: rowNo, field, message, muc: 'loi' })`, `luuY` tương tự với `'luu_y'`):

| Ô | Luật | Mức · chữ (Task 5 chạy `clarify` có thể gọt) |
|---|---|---|
| Họ tên | trống hoặc `-` | lỗi · "Thiếu họ tên" |
| Ngày sinh | `docNgayNhap(r.dob, homNay, { toiDa: homNay })` | lỗi · chữ của hàm ("Ngày không có thật", "Gõ dd/mm/yyyy", "Không được sau hôm nay") |
| Email | `docEmail(r.email)`; trống | lỗi · chữ của hàm / "Bắt buộc — còn trống" |
| OVR, L, R, W, S | FT: `bandOf` như cũ (sai → lỗi). Lớp thường có dữ liệu → **bỏ qua** | lưu ý · "Bỏ qua — lớp thường không có điểm đầu vào IELTS" |
| Target | FT sai → lỗi; FT trống → lưu ý "Chưa có — vẫn thêm được, bổ sung sau để tính kỳ vọng". Lớp thường có dữ liệu → bỏ qua | lưu ý · "Bỏ qua — lớp thường không có target" |
| Thi dự kiến | FT: `docNgayNhap(r.examDate, homNay, { choThang: true, toiThieu: homNay })`. Lớp thường có dữ liệu → bỏ qua | lỗi · chữ của hàm / lưu ý "Bỏ qua — lớp thường chưa thi IELTS" |
| Tuần bắt đầu | có chữ → `docNgayNhap(r.startWeek, homNay)` → `mondayOf`; trống → mặc định cả lô; vẫn không có | lỗi · chữ của hàm / "Chưa có — chọn tuần bắt đầu ở đầu panel" |
| Lộ trình (K2-20) | có chữ và khác `cls.route` | lưu ý · `Bỏ qua — lộ trình theo lớp (${cls.route ?? 'lớp thường'})` |
| Lớp | như cũ (:327-332) | lưu ý |
| Trùng hồ sơ | như cũ (:314-321) | lưu ý · `Có thể trùng ${tên} (${mã}) — em đã có hồ sơ thì dùng Chuyển lớp` |

  Mặc định cả lô: `const homNay = demoToday();` ·
  `const w0 = input.defaultStartWeek ? docNgayNhap(input.defaultStartWeek, homNay) : null;` → `w0?.loi` thì `issues.push({ row: 0, field:
  'startWeek', message: w0.loi, muc: 'loi' })`; `const defaultWeek = w0?.iso ? mondayOf(w0.iso) : tuanBatDauMacDinh({ lopThuong: ratio,
  khaiGiang: cls.start_date ?? null }, homNay);`. Dòng trả về thêm `email` (đã chuẩn hoá), `examDate` (ISO ngày hoặc tháng), `startWeek`.
  **Không đụng** `canPlanWeeks` (:361) và chú thích :478-485 — PR-MT thay (tránh xung đột thừa khi rebase).
- [ ] `commitIntake`: `const blocking = r.issues.filter((i) => i.muc === 'loi');` (thay :408). `INSERT INTO students` thêm `email`.
  `learning_cycles`: bỏ `r.examMonth`; từ `r.examDate`: dài 10 → `exam_date = d`, `exam_month = d.slice(0, 7)`, `exam_period_id =
  ensurePeriod(mondayOf(d)).id`; dài 7 → chỉ `exam_month`. `const route = cls.route ?? null;` (thay :444, K2-20). Thu `hangDaThem.push(r.row)`
  cạnh `studentIds.push(sid)`; trả trong `IntakeResult` (khoá idempotency lưu cả trường mới — tự động vì lưu JSON).
- [ ] Route `/intake/preview`, `/intake/commit`: bỏ `dateFormat`. `/intake/parse` giữ (lỗi từ `parsePaste` đi qua `wrap`).
- [ ] Lời gọi nội bộ: xoá `dateFormat: …`, thêm `email: 'hv@demo.test'` vào **mọi** dòng của mọi lời gọi `commitIntake`/`previewIntake`
  (danh sách file ở trên; không cần email khác nhau). Phép kiểm cũ khối 12 sửa kỳ vọng: bỏ assert `usedHeader`; `noHeader` → `assertThrows`
  (thiếu tiêu đề); thay khối `parseDateAs` (:1432-1438) bằng một phép kiểm `docNgayNhap` ngắn; test lớp thường (:1476-1500) kỳ vọng
  `muc === 'luu_y'` cho target/L.
- [ ] Phép kiểm mới `NHAP (3)` trong `prNhap.tests.ts` (lớp `classId('MB FT 101')`, lớp thường như :1478-1482):
  - `parsePaste('Email\tHọ và tên\tNgày sinh\na@b.vn\tAn\t31/02/2010')` → `rows[0].fullName === 'An' && rows[0].email === 'a@b.vn'` (thứ tự cột đảo vẫn đúng).
  - Xem trước FT: `{ fullName: 'A', dob: '31/02/2010', email: 'a@b.vn' }` → issue `field 'dob'`, `muc 'loi'`, message `Ngày không có thật`;
    `{ fullName: 'B' }` → issue `email` mức lỗi; `{ fullName: 'C', email: 'c@d.vn', examDate: '05/2027' }` → `rows[i].examDate === '2027-05'`, không lỗi;
    `{ fullName: 'D', email: 'd@e.vn', route: 'LT2' }` trên lớp LT1 → lưu ý `route`.
  - Lớp thường: `{ fullName: 'E', email: 'e@f.vn', target: '6.5', baselineScore: '5' }` → chỉ lưu ý, **không** lỗi.
  - **Mâu thuẫn #1:** commit một dòng có cảnh báo trùng hồ sơ (tên + ngày sinh của một em có sẵn, có email) → `added === 1`.
  - Commit lô `[{ fullName: 'Nhập Có Email', email: 'x@y.vn', examDate: '15/01/2027', route: 'LT2' }, { fullName: 'Nhập Thiếu Email' }]`
    → `added 1`, `hangDaThem` = `[1]`; DB: `students.email = 'x@y.vn'`, `learning_cycles.exam_date = '2027-01-15'`, `exam_month = '2027-01'`,
    `exam_period_id` có, `route = 'LT1'` (theo lớp).
  - Mặc định K2-19: lớp FT `start_date` cách `demoToday()` ≥ 3 tuần, không gửi `defaultStartWeek` → `defaultStartWeek === mondayOf(demoToday())`.
- [ ] `npm run check` → commit `PR-NHAP (3): máy chủ nhập học viên — cột theo tiêu đề, email, ngày thi, dd/mm/yyyy, lỗi/lưu ý tách mức`.

## Task 4 · Máy chủ: Thông tin HV sửa họ tên · ngày sinh · email · tuần bắt đầu; ngày thi ở Lộ trình (YC-5.2, T8, T9, H6)

**Files:** `server/src/students/students.ts:330-350`, `server/src/fasttrack/cycles.ts` (`updateCycle` trước vòng `map` :148),
`server/src/students/profile.ts:739-741`.

- [ ] `updateStudent`: thêm `email: 'email'` vào `map`. **Kiểm ở biên** (trước khi ghép câu): `fullName` có mặt mà trống sau `trim` →
  `badRequest('Họ tên không được trống.')`; `dob` có mặt → `docNgayNhap(v, demoToday(), { toiDa: demoToday() })`, lỗi → `badRequest('Ngày
  sinh: ' + loi)`, ghi `iso` (hoặc `NULL`); `email` có mặt → `docEmail(v)`, lỗi → `badRequest('Email: ' + loi)`, ghi `email` đã chuẩn
  hoá (trống → `NULL` — sửa hồ sơ cũ không bắt email, T8). Nhật ký giữ `writeAudit('student.update', before, after)` sẵn có.
- [ ] `updateCycle`: đầu hàm, sau `require_` —
```ts
  if (patch.startWeek !== undefined) {           // Thông tin HV gửi Thứ Hai ISO từ ô ngày thống nhất kiểu tuần
    const w = docNgayNhap(patch.startWeek, demoToday());
    if (!w.iso) throw badRequest(`Tuần bắt đầu: ${w.loi ?? 'bắt buộc'}`);
    patch = { ...patch, startPeriodId: ensurePeriod(mondayOf(w.iso)).id };
  }
  if (patch.examDate !== undefined) {            // T9: ngày → lưu ngày + suy tháng, tuần; tháng → chỉ tháng; trống → xoá cả hai
    const t = docNgayNhap(patch.examDate, demoToday(), { choThang: true });
    if (t.loi) throw badRequest(`Thi dự kiến: ${t.loi}`);
    const la = t.iso?.length === 10;
    patch = { ...patch, examMonth: t.iso ? t.iso.slice(0, 7) : null, examDateGhi: la ? t.iso : null,
      ...(la ? { examPeriodId: ensurePeriod(mondayOf(t.iso!)).id } : {}) };
  }
```
  và thêm `examDateGhi: 'exam_date'` vào `map` (khoá nội bộ, người gọi gửi `examDate`). `patch` đổi từ tham số sang `let`. Khối dời lịch
  MT (:200-218) **không sửa** (PR-MT).
- [ ] `profile.ts`: thêm `email: s.email ?? null` cạnh `dob`.
- [ ] Phép kiểm `NHAP (4)`: GVCN (`P.coreTeacher`) sửa email em lớp mình → lưu chữ thường; `dob '31/02/2010'` → `assertThrows`; `email 'abc'` →
  `assertThrows`; `email ''` → `NULL`; `updateCycle(…, { examDate: '15/01/2027' })` → `exam_date`, `exam_month`, `exam_period_id` đúng;
  `{ examDate: '05/2027' }` → `exam_date NULL`, `exam_month '2027-05'`; `{ startWeek: '2026-10-07' }` → `start_period_id` = tuần `2026-10-05`.
  H6: em không email vẫn **không** có `thieu_tt` (đọc `/hoc-vien-lop` hoặc `missingForStudent` — không có tham số email, chỉ cần kiểm lại
  một em demo không email không nằm trong bộ lọc `thieu_tt` nếu đủ các thông tin khác).
- [ ] `npm run check` → commit `PR-NHAP (4): Thông tin HV sửa email/tuần bắt đầu có kiểm ở máy chủ; ngày thi dự kiến`.

## Task 5 · Web: panel Thêm học viên theo M2 (YC-5.1…5.4, K2-19, K2-20, K2-21 phần không MT) — `/impeccable clarify`

**Files:** `web/src/modules/students/IntakePanel.tsx` (viết lại phần thân), `web/src/ui/ONgay.tsx` (prop `gon`).

- [ ] `ONgay` thêm `gon?: boolean` — trong lưới: **không** vẽ dòng phụ tuần và dòng lỗi dưới ô (hàng cao đều); `title` của ô gõ =
  `[phu, loi].filter(Boolean).join(' · ')`; lỗi vẫn tô viền qua `aria-invalid`. Không đổi gì khi `gon` không truyền.
- [ ] Bộ cột lấy **ngay** từ lớp đã chọn (không chờ xem trước): `const lopThuong = cls?.scoring_mode === 'ratio'`,
  `const cols = cotLuoiNhap(lopThuong)`. Bỏ `COMMON/FT_ONLY/WEEK_COL/columnsFor`, `dateFormat` (state + ô chọn :244-251), cột **Bỏ qua**
  và `skipRows`, `isWarning`, hộp "Có thể trùng hồ sơ" (:346-361), ba đoạn `SectionNote` (:363-375).
- [ ] **Tuần bắt đầu cả lô:** `const macDinh = cls ? tuanBatDauMacDinh({ lopThuong, khaiGiang: cls.start_date ?? null }, homNay) : null;`
  `const tuanChung = startWeek || macDinh || '';` → `<ONgay kieu="tuan" value={tuanChung} onChange={setStartWeek} />`; gợi ý dưới ô:
  lớp FT và `macDinh !== mondayOf(cls.start_date)` → `Lớp khai giảng ${tuanLich(cls.start_date)} — em vào muộn nên mặc định tuần này.
  Đổi ở đây thì mọi dòng chưa sửa tay đổi theo.`; còn lại → `Lấy sẵn tuần khai giảng của lớp. Đổi ở đây thì mọi dòng chưa sửa tay đổi theo.`
  Gửi `defaultStartWeek: tuanChung || null`.
- [ ] **Ô tuần từng dòng:** `r.startWeek` rỗng = theo cả lô. Ô: `/^\d{4}-\d{2}-\d{2}$/.test(r.startWeek || tuanChung)` →
  `<ONgay gon kieu="tuan" value={r.startWeek || tuanChung} onChange={(v) => setCell(i, 'startWeek', v === tuanChung ? '' : v)} />`;
  ngược lại (chữ dán không đọc được) → `<input className="field" aria-invalid value={r.startWeek} …>` để người nhập gõ lại.
- [ ] **Lưới:** `<table style={{ minWidth: lopThuong ? 720 : 1180 }}>` trong `overflow-x-auto`; `<colgroup>` bề rộng như M2 (# 32 · tên 170 ·
  ngày sinh 104 · email 190 · số 48–60 · thi 104 · tuần 150 · tình trạng 120). Ô số `text-right tabular-nums`. Ô có vấn đề: viền
  `border-late` (lỗi) / `border-soon` (lưu ý) + `aria-invalid` + `title` = chữ vấn đề; **không** chèn chữ dưới ô.
- [ ] **Cột Tình trạng** (vấn đề của dòng từ `pv.rows[i].issues`, đếm theo `muc`): 0 → `✓ Sẵn sàng` (`text-ok`); có → nút chữ
  `1 lỗi · 1 lưu ý` (lỗi `text-late`, chỉ lưu ý `text-soon`) + mũi tên SVG `MuiTenMo`; bấm → mở **một** dòng chi tiết ngay dưới
  (`<td colSpan={cols.length + 2}>`, nền `surface-2`, 12.5 px): `Dòng 2 · Email: Bắt buộc — còn trống. · Target: Chưa có — …` (nhãn cột
  qua `nhanCotNhap`), cuối dòng nút nhỏ `Xoá dòng này`. Mở dòng khác thì dòng cũ đóng (`const [moDong, setMoDong] = useState<number | null>(null)`).
- [ ] **Chân panel:** `chan.phu` = `${san} dòng sẵn sàng · ${canSua} dòng cần sửa` (khi có xem trước; bấm phần "cần sửa" cuộn tới dòng đầu
  `[data-needs-fix="true"]`); nút chính `Thêm ${san} học viên`, khoá khi `busy || !classId || !pv || san === 0` — **không** khoá vì còn dòng
  lỗi (M2, K2-21: dòng lỗi ở lại panel). `+ Thêm dòng` ở chân trái (thay "Thêm dòng"/"Bớt dòng cuối").
- [ ] **Sau khi thêm (K2-21):** không `onClose()`. `idempotencyKey.current = moiKhoa()`; bỏ các dòng có số trong `r.hangDaThem` (còn 0 dòng →
  một dòng trống); khối kết quả trên lưới: `<Outcome tone="ok" mark="✓">Đã thêm {n} học viên vào {lớp}.</Outcome>` + liên kết
  `Mở hồ sơ lớp` (`/hoc-vien/lop/${classId}`, ẩn khi đang ở chính trang đó — `useLocation().pathname`); `onDone()` để trang sau làm mới.
- [ ] **Dán:** toast `Đã đọc ${n} dòng${cotBoQua.length ? ` · bỏ qua cột ${cotBoQua.join(', ')}` : ''}.`; lỗi thiếu tiêu đề hiện nguyên câu
  máy chủ. Chữ mờ ô dán: `Dán vùng bảng có dòng tiêu đề (Họ và tên, Ngày sinh, Email, …) — cột nhận theo tên, không theo thứ tự`.
- [ ] Một dòng ghi chú dưới lưới (M2, `DANH_GIA` :304): `Ô trống hoặc dấu "-" = chưa có, không phải 0. · Em đã có hồ sơ thì dùng Chuyển lớp, không tạo mới.`
- [ ] Chạy **`/impeccable clarify`** trên `IntakePanel.tsx` + chữ vấn đề ở `intake.ts`/`nhapHocVien.ts` (chỉ gọt chữ; giữ nghĩa, giữ `muc`).
- [ ] `npm run check` → commit `PR-NHAP (5): panel Thêm học viên theo M2 — cột Tình trạng, email, thi dự kiến, tuần bắt đầu điền sẵn`.

## Task 6 · Web: Thông tin HV + ô Thi dự kiến ở Lộ trình (YC-5.2, T8, T9, H6)

**Files:** `web/src/modules/students/StudentManagePanel.tsx:205-291` (`ThongTinPanel`), `StudentDetailPage.tsx:392-397` (truyền `email`),
`web/src/modules/students/StudentPlanPanel.tsx:46-64, 116-127`.

- [ ] `ThongTinPanel`: xoá `docNgaySinh` (:206-215). Ngày sinh → `<ONgay kieu="ngay" toiDa={homNay} value={dob} onChange={setDob} />`
  (state ISO). Thêm **Email** (`<input type="email" inputMode="email" autoComplete="off">`, `tuyChon`; lỗi dạng qua `docEmail` vào
  `dsLoi`; trống và hồ sơ chưa có email → `phu="Chưa có email — bổ sung khi có"` (H6)). Thêm **Tuần bắt đầu** (`ONgay kieu="tuan"`,
  giá trị `cycle.startWeek?.week_start`) khi có `cycle`. Lưu: `PATCH /students/:id` `{ fullName, dob, email, consultantName, note }`;
  tuần đổi → thêm `PATCH /cycles/${cycle.id}` `{ startWeek }` (tuần không đổi thì không gửi). Lỗi máy chủ → toast, giữ panel.
- [ ] `StudentDetailPage`: truyền `email: data.email ?? null` vào `student` của `StudentManagePanel`.
- [ ] `StudentPlanPanel`: state `examMonth` → `thiDuKien` (nạp `cy.exam_date ?? cy.exam_month ?? ''`), ô `Field label="Thi dự kiến"`
  `<ONgay kieu="ngay-hoac-thang" …>` hint `Gõ dd/mm/yyyy nếu đã biết ngày, mm/yyyy nếu mới biết tháng.`; ô **Tuần dự kiến thi**
  (`WeekPicker`) chỉ hiện khi `thiDuKien` không phải ngày đủ (`!/^\d{4}-\d{2}-\d{2}$/`); lưu gửi `examDate: thiDuKien || null`
  (+ `examPeriodId` chỉ khi ô tuần đang hiện).
- [ ] `npm run check` → commit `PR-NHAP (6): Thông tin HV sửa email/ngày sinh/tuần bắt đầu; ô Thi dự kiến ngày hoặc tháng`.

## Task 7 · 🛑 CỔNG PR-MT — cột "Đã thi tới MT", báo trước MT lịch sử, khối kết quả, xác nhận dời MT (T34, K2-19, K2-21, K2-32, K2-33)

**Chỉ bắt đầu khi PR-MT đã merge vào `main`.** Rebase: `git fetch origin && git rebase origin/main` → xung đột ở `intake.ts` `commitIntake`:
lấy thân **của NHAP** rồi chép lại **khối gọi `taoMtMacDinh` của MT** ngay sau INSERT `learning_cycles` (dùng biến `cyc`/`route` của NHAP) →
`npm run check` xanh → ghi Nhật ký (tên hàm thật nếu khác dưới đây — lệch chữ ký thì dừng, báo planning).

**Hợp đồng PR-MT** (kế hoạch `2026-09-29-pr-mt-lich-mt.md` Task 1, Task 3 — "PR-NHAP dựa vào, không đổi tên/chữ ký"):
```ts
// server/src/fasttrack/mtMacDinh.ts — hàm hệ thống, KHÔNG kiểm quyền, chạy trong tx của nơi gọi, chạy lại không tạo trùng
export type LuotMacDinh = { attemptId: number; attemptNo: number; weekStart: string; lichSu: boolean };
export function taoMtMacDinh(cycleId: number, opts: { actorUserId: number | null; ngayTao?: string; daThiToiMt?: number }): LuotMacDinh[];
// shared/domain/lichMt.ts
export function lichMtMacDinh(route: string | null): number[];            // tuần học: RF [4, 8] · LT1/LT2 [6, 12, 16] · null → []
export function tuanHocCuaMt(route: string | null, n: number): number;    // mốc tuần học của MTn (kể cả n ngoài lịch mặc định)
export function laLichSu(tuanKetThucMuonNhat: string, ngayTao: string): boolean;   // so CHỦ NHẬT của tuần thi với ngày tạo
```
PR-MT đã: gọi `taoMtMacDinh` trong `commitIntake` (lớp FT), `canPlanWeeks: true`, sửa phép kiểm "[12.1] Nhập hàng loạt KHÔNG lập lịch MT",
dời lượt `auto` chưa điểm khi đổi tuần bắt đầu cho **mọi** người sửa được (`updateCycle`). NHAP **không** viết lại những phần đó.

- [ ] **Cột "Đã thi tới MT" (K2-33(1))** — chỉ lớp FT, tuỳ chọn, sau cột Thi dự kiến: thêm `daThiToiMt` vào `CotNhap`, `TIEU_DE`
  (`'da thi toi mt'`, `'da thi toi'`, `'mt da thi'`), `COT_FT` (`{ key: 'daThiToiMt', nhan: 'Đã thi tới MT', so: true }`). Máy chủ: trống → không
  truyền; số nguyên 0–8 (`/^\d$/` và ≤ 8) → truyền `taoMtMacDinh(cycleId, { …, daThiToiMt })`; sai → lỗi "Gõ số MT đã thi, 0–8"; lớp thường có
  dữ liệu → lưu ý bỏ qua. Hint cột: `Em cũ đã thi tới MT mấy ngoài web — web tạo sẵn các lượt đó là MT lịch sử để nhập điểm bù.`
- [ ] **Lưu ý MT lịch sử (K2-19)** trong `previewIntake`, dòng FT hợp lệ:
```ts
const soLuot = Math.max(lichMtMacDinh(cls.route).length, daThiToiMt ?? 0);
const lichSu = Array.from({ length: soLuot }, (_, i) => i + 1).filter((n) =>
  laLichSu(addDays(startWeek, (tuanHocCuaMt(cls.route, n) - 1) * 7 + 6), homNay));
if (lichSu.length) luuY('startWeek', `Học từ ${tuanLich(startWeek)} — ${lichSu.map((n) => 'MT' + n).join(', ')} sẽ là MT lịch sử`);
```
  (`addDays` của `server/src/util.ts` — đã import ở `intake.ts:10`; web dùng `addDaysIso` nếu `lichMt.ts` của PR-MT export, không thì một dòng cộng ngày UTC tại chỗ.)
- [ ] **Kết quả (K2-21, K2-32):** `commitIntake` thu giá trị trả về của `taoMtMacDinh` → `IntakeResult.mt = { soEm: number; soEmCoLichSu: number;
  emLichSuDau: number | null }` (id em đầu tiên có lượt `lichSu`). Web khối kết quả: `Đã thêm {n} học viên · đã lên lịch MT cho {soEm} em` +
  (khi `soEmCoLichSu > 0`) ` · {soEmCoLichSu} em có MT lịch sử chưa có điểm` và nút `Nhập điểm MT lịch sử` → hồ sơ HV `emLichSuDau` (nơi
  nhập điểm lịch sử của PR-MT/HSM; có đường tốt hơn trong mã MT thì dùng) + `Mở hồ sơ lớp`.
- [ ] **Thông tin HV đổi tuần bắt đầu (M6, K2-33(2)):** `profile.ts` thêm `planSource: a.plan_source ?? null` vào `base` của lượt (:556). Trong
  `ThongTinPanel`, khi tuần mới ≠ tuần cũ và lộ trình FT: `const doi = attempts.filter((a) => a.status === 'planned' && a.planSource === 'auto'
  && !a.scored)`; có → dòng `luat` trên nút Lưu: `MT2, MT3 sẽ dời sang W2 OCT, W2 NOV` (tuần mới = `addDays(tuanMoi, (tuanHocCuaMt(route,
  a.attemptNo) - 1) * 7)` qua `tuanLich`). Không đổi luật dời (của PR-MT).
- [ ] Phép kiểm `NHAP (7)`: `commitIntake` em FT (email có), tuần bắt đầu cách `demoToday()` 22 tuần, `daThiToiMt: '4'` → 4 lượt, cả 4 `lich_su = 1`;
  xem trước có lưu ý "MT1, MT2, MT3, MT4 sẽ là MT lịch sử"; `result.mt.soEmCoLichSu === 1`. Em FT tuần này → 3 lượt `lich_su = 0`, không lưu ý.
  `daThiToiMt: '9'` → lỗi. Lớp thường có `daThiToiMt` → lưu ý, không lượt nào.
- [ ] `npm run check` → commit `PR-NHAP (7): cột Đã thi tới MT, báo trước MT lịch sử, khối kết quả, xác nhận dời MT`.

## Task 8 · Dữ liệu demo + tài liệu (§10.3, H6, K2-41)

- [ ] `server/src/seed/build.ts:90-99`: thêm cột `email` vào `INSERT INTO students` — `s.code === 'J01' ? null : \`hv.${s.code.toLowerCase()}@demo.pisatracking.vn\``
  (J01 là HS cũ **thiếu email** — H6). `npm run seed` trên DB demo worktree.
- [ ] `CODE_MAP.md`: dòng "Thêm học viên" thêm `shared/domain/nhapHocVien.ts`, `migrate/prNhap.ts`, `IntakeResult.hangDaThem`.
  `plan.md` §14: dòng PR-NHAP (mã yêu cầu, migrate 2 cột). `TRIEN_KHAI.md` mục đợt 2: "PR-NHAP — migrate chỉ thêm 2 cột, không chạy thử".
  `thiet-ke/TU_DIEN_VA_CHU.md`: "Thi dự kiến", "Tình trạng" (panel nhập), "MT lịch sử" (nếu PR-MT chưa ghi).
- [ ] `npm run check` → commit `PR-NHAP (8): demo có email (J01 thiếu — H6), tài liệu`.

## Task 9 · impeccable `audit` + `polish`, bấm thử theo vai + 375 px, mở PR

- [ ] `/impeccable audit` rồi `/impeccable polish` — **chỉ** `IntakePanel.tsx`, `ThongTinPanel`, ô Thi dự kiến. Gợi ý trái mockup M2 /
  Rulebook → không làm, ghi vào thân PR mục "impeccable gợi ý, chờ chủ sản phẩm".
- [ ] `npm run seed` → API 4177 + Vite 5377 → chạy mục **KIỂM** (Playwright kênh Chrome); ảnh `thiet-ke/anh/pr-nhap/` (`01-them-hv-truoc.png`
  chụp từ `origin/main` cùng cổng, `01-them-hv-sau.png`, `02-dong-chi-tiet`, `03-lop-thuong`, `04-thong-tin-hv`, `05-375`).
- [ ] `/ponytail-review` trên diff; liệt kê chú thích `ponytail:` (nếu có) vào thân PR.
- [ ] Rebase `origin/main` (bắt buộc đã có PR-MT) → `npm run check` → push → `gh pr create` tiêu đề
  `PR-NHAP: Thêm học viên — email, thi dự kiến, cột Tình trạng, tuần bắt đầu điền sẵn`; thân: bảng mã YC/T/K → ảnh → đạt/không; "tầng 1 của
  màn này là: số dòng sẵn sàng / cần sửa và cột Tình trạng"; cảnh báo **CÓ migrate**; mục **Chuyển cho PR khác**. Tắt cổng, quét `tests/run.js`, dọn file tạm.

## KIỂM — kịch bản bấm thử (Task 9)

| # | Vai (id) | Làm | Phải thấy |
|---|---|---|---|
| K1 | QL Vy (2) | Hồ sơ `MB FT 101` → + Học viên | Lớp chọn sẵn; ô **Tuần bắt đầu** đã có giá trị ngay (tuần này + câu "em vào muộn" nếu lớp đã học > 2 tuần); lưới 11 cột + Tình trạng |
| K2 | QL Vy | Dán 20 dòng có tiêu đề **đảo thứ tự** (Email trước Họ và tên), 3 dòng lỗi (thiếu email, `31/02/2010`, thi `13/2027`), 1 cột "Ghi chú" | Toast "bỏ qua cột Ghi chú"; mọi hàng **cùng chiều cao**, cột thẳng; ô lỗi viền màu; Tình trạng `1 lỗi ▸`; bấm → một dòng chi tiết trải ngang đúng ô |
| K3 | QL Vy | Dán không có dòng tiêu đề | Câu "Dòng đầu phải là dòng tiêu đề…"; lưới không đổi |
| K4 | QL Vy | Đổi ô Tuần bắt đầu đầu panel | Dòng chưa sửa tay đổi theo; dòng đã sửa tay giữ |
| K5 | QL Vy | Bấm `Thêm 17 học viên` khi còn 3 dòng lỗi | Panel **ở lại**, còn 3 dòng lỗi + khối "Đã thêm 17 học viên…"; sửa 3 dòng, bấm lại → thêm đúng 3 (không trả kết quả cũ) |
| K6 | QL Vy | Dán cột "Lộ trình" = LT2 vào lớp LT1 | Lưu ý "Bỏ qua — lộ trình theo lớp (LT1)"; HV vào LT1 |
| K7 | GVCN Hà (7) | Hồ sơ lớp thường của Hà → + Học viên | Chỉ 4 cột + Tình trạng; dán có Target/OVR → lưu ý "Bỏ qua…", vẫn thêm được |
| K8 | GVCN Hà | Hồ sơ HV J01 → ⋮ Thông tin học viên | Email trống ghi "Chưa có email — bổ sung khi có"; **không** badge Thiếu thông tin ở Học viên & Lớp vì thiếu email (H6); sửa email, ngày sinh `31/02/2010` → lỗi tại ô; tuần bắt đầu đổi được |
| K9 | QL Vy | Hồ sơ HV FT → Lộ trình → Thi dự kiến `15/01/2027` | Ô tuần thi ẩn; hồ sơ hiện "dự kiến thi 15/01/2027"; gõ `05/2027` → "MAY 2027", ô tuần hiện lại |
| K10 | QL Vy | (sau cổng MT) Thêm em FT tuần bắt đầu cách 22 tuần | Tình trạng lưu ý "MT1, MT2, MT3 sẽ là MT lịch sử"; khối kết quả "… 1 em có MT lịch sử chưa có điểm [Nhập điểm MT lịch sử]" |
| K11 | GVBM Trang (9) | Mở + Học viên (nếu thấy) | Không thấy nút, hoặc xem trước báo "ngoài phạm vi" |
| K12 | 375 px | K1, K2, K8 | Lưới cuộn ngang trong panel, trang không cuộn ngang; nút ≥ 44 px; dòng chi tiết xuống dòng, không tràn |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Lý do |
|---|---|---|
| Rút quyền GVCN sửa target/lộ trình/lớp, nút "Đề xuất sửa"; **giữ** `updateCycle` khoá `startWeek`/`examDate` ở quyền `student.edit` | **PR-DUYET** | T44, K5-33 |
| Xếp lịch MT chọn **tuần đã qua** cho HS cũ thêm trước khi có cột "Đã thi tới MT" | **PR-XLMT** | K2-33(1) phần xếp (PR-MT đã ghi) |
| Lưới Thêm học viên dạng thẻ trên điện thoại | **PR-UXD** | D3/D4 |

## Lệnh cho buổi deploy (đợt 2 — 🛑 chỉ chủ sản phẩm chạy, theo `TRIEN_KHAI.md`)

1. Sao lưu bản chính (`npm run sao-luu`). 2. Migrate **DB THỬ** (đợt 2 gộp DUYET, MT, NHAP, MON — NHAP chỉ thêm 2 cột) → deploy nháp →
bấm K1, K2, K5, K8. 3. Migrate **DB CHÍNH** (`PISA_CHO_PHEP_MIGRATE_TURSO=<tên máy chủ>`) → `--prod`. 4. Báo GV: thêm học viên mới
**bắt buộc email**; bảng dán phải có **dòng tiêu đề**; ngày gõ `dd/mm/yyyy`; HS cũ bổ sung email dần ở Thông tin HV (không bắt).

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | Máy chủ đọc `dd/mm/yyyy`, `d/m/yyyy` **và ISO `yyyy-mm-dd`** (đặc tả chỉ nói dd/mm) | Ô ngày thống nhất và lời gọi nội bộ gửi ISO; ISO không mơ hồ. Vẫn **không** đoán `mm/dd` |
| Q2 | Bảng dán **bắt buộc có dòng tiêu đề** chứa "Họ và tên"; bỏ cách đọc theo thứ tự cột khi không có tiêu đề | YC-5.2 "theo tiêu đề, không theo thứ tự"; thêm cột Email làm file cũ không tiêu đề lệch cột âm thầm (câu hỏi 1) |
| Q3 | Dòng lỗi **không khoá** nút Thêm; dòng sẵn sàng được thêm, dòng lỗi ở lại panel. Bỏ cột "Bỏ qua" (không có ở M2) — thay bằng "Xoá dòng này" trong dòng chi tiết | M2 ("Thêm 2 học viên" khi 1 dòng cần sửa) + K2-21; đảo luật cũ "khoá nút" vì nay không dòng nào biến mất |
| Q4 | Cột FT (OVR, L/R/W/S, Target, Thi dự kiến) dán vào **lớp thường** → lưu ý + bỏ qua (trước là lỗi) | Cùng cách với cột Lớp/Lộ trình (K2-20); một file trộn không chặn cả lô |
| Q5 | Email không bắt duy nhất; lưu chữ thường; sửa hồ sơ cũ được để trống | Anh chị em dùng chung email phụ huynh; T8 chỉ bắt khi thêm mới |
| Q6 | Thi dự kiến **đã qua** → lỗi khi thêm mới; sửa ở Lộ trình không chặn | Ngày thi dự kiến đã qua lúc nhập gần như chắc gõ nhầm năm |
| Q7 | Ngày sinh sau hôm nay → lỗi; không đặt cận dưới | Đủ bắt lỗi gõ nhầm; cận dưới là đoán |
| Q8 | Nhãn: có ngày → `15/01/2027` (đếm ngược như tuần); chỉ tháng → giữ kiểu cũ `MAY 2027`. "Thi dự kiến 05/2027" ở YC-5.3 hiểu là ô lưới giữ chữ đã gõ | Không đổi nhãn tháng ở mọi màn đang dùng |
| Q9 | Lộ trình: một ô "Thi dự kiến" (ngày hoặc tháng); ô tuần thi chỉ hiện khi chưa có ngày đủ | Ngày đã suy ra tuần — hai ô cùng lúc dễ nói hai điều khác nhau |
| Q10 | Ô lỗi chỉ tô viền + `title`, **không** ⚠; chữ Tình trạng dùng màu `text-late`/`text-soon`, không nhãn nền đỏ | G-4 (⚠ = quá hạn), B-1 (đỏ nền chỉ SOS 3/Chưa đạt) — mockup M2 vẽ ⚠ ở ghi chú |
| Q11 | Bỏ hộp "Có thể trùng hồ sơ" — cảnh báo trùng nằm ở dòng chi tiết | "Không lặp thông tin" |
| Q12 | Không sửa `exam_month` rác cũ (K2-20); `examPlanOf` coi giá trị sai dạng là chưa có | K5 §5: PR-NHAP không chuyển dữ liệu; nhãn hỏng tệ hơn "Chưa xác định" |
| Q13 | Cột "Đã thi tới MT" (K2-33(1)) nhận 0–8, lớp FT, tuỳ chọn; máy chủ truyền `daThiToiMt` cho `taoMtMacDinh` (PR-MT làm tham số) | K2-33 SỬA ĐẶC TẢ; PR-MT giao cột này cho NHAP |
| Q14 | Câu xác nhận dời MT ở Thông tin HV tính trên web từ lượt `planned` + `auto` + chưa điểm (thêm `planSource` vào hồ sơ); không thêm đường xem trước | PR-MT không có hàm xem trước; tránh đường API mới |

## Câu hỏi cho chủ sản phẩm (không chặn — đang theo khuyến nghị)

1. **Dán không có dòng tiêu đề:** (A, khuyến nghị) từ chối và nhắc dán kèm tiêu đề · (B) vẫn đọc theo thứ tự cột của lưới. A tránh lệch cột âm thầm khi file cũ chưa có cột Email.

## Mâu thuẫn nguồn ↔ mã thật

1. **Lỗi thật:** `commitIntake` coi mọi vấn đề có `field !== 'target'` là chặn (`intake.ts:408`) — kể cả cảnh báo **trùng hồ sơ** và
   **cột lớp bị bỏ qua** — trong khi web cho qua (`IntakePanel.tsx:164-165`). Dòng "có thể trùng" bị máy chủ bỏ im lặng lúc ghi. Sửa ở Task 3 (`muc`).
2. YC-5.2 lớp thường chỉ Họ tên · Ngày sinh · Email · Tuần bắt đầu; mã đang hỏi thêm **OVR** cho lớp thường (`IntakePanel.tsx:52-57, 69-70`).
3. Ghi chú M2 "Thêm xong, web tự tạo MT1–MT3"; mã và phép kiểm khẳng định ngược lại (`intake.ts:478-485`, `run.ts:1583-1605`) → PR-MT đổi (NHAP giữ khi rebase).
4. `applySuggestedMockWeeks` đòi `PLAN_WEEK`; `updateCycle` nuốt lỗi (`cycles.ts:200-218`) → GVCN đổi tuần bắt đầu thì lịch MT **không** dời, không báo (M6 cần dời) — PR-MT sửa (gọi lõi trực tiếp); NHAP chỉ thêm câu xác nhận.
5. `updateStudent` không kiểm gì (`students.ts:330-350`): ngày sinh chữ bất kỳ, họ tên rỗng đều ghi được.
6. Lớp FT tạo bằng `taoLopVaPhanCong` **không có** ngày khai giảng (chỉ lớp thường bắt tuần — `intake.ts:585`) → "tuần khai giảng của lớp" của YC-5.4 không có với lớp FT mới → mặc định tuần này (K2-19).
7. Cột "Ngày thi" cũ ghi thẳng chữ vào `exam_month` không kiểm (`intake.ts:98, 469`) — bản chính có thể có giá trị sai dạng (Q12).
8. Đặc tả "máy chủ chỉ đọc dd/mm/yyyy" ↔ ô ngày thống nhất trả ISO và ~13 lời gọi nội bộ dùng ISO (Q1).

## Nhật ký

- (Task 0) PR-MT đã merge: … · tên hàm thật: … · mốc B: … · dòng lệch: …
