# PR-UX5 · Hành trình học viên (trải rộng, điểm lên/xuống rõ, không cắt chữ) — Kế hoạch

> **For agentic workers:** KHÔNG dùng `superpowers:subagent-driven-development` — làm theo khối **Quy trình nhanh** bên dưới.

**Goal:** Tab **Hành trình** trong hồ sơ học viên vẽ đúng mockup 18 phần (a) đã chốt: **không đường điểm**; chuỗi điểm nằm **trong
cột tên** ngay sau tên kỹ năng, thẳng một cột dọc giữa các hộp, có ▲ xanh / ▼ đỏ / = xám + mức chênh, số dưới kỳ vọng đỏ; ghim đợt
Test ghi điểm và tô màu kết quả N-1b; trục tuần và mọi hộp là **một lưới** trải hết chiều ngang (cột tuần giãn theo màn), tuần hiện
tại tô **cả cột**; công tắc **Xem gọn**; hàng vấn đề ≥ 40px, tên 1 dòng + tooltip, dòng phụ riêng; khối PA hẹp chỉ hiện dấu kết quả;
375px cột tên đứng yên khi cuộn ngang. Sửa kèm mockup 17 #23 và 4 lỗi nhỏ Qb (PA đang chạy kéo tới cột cuối · tuần hiện tại chỉ tô
ô nhãn · hai đợt cùng tuần ghim chồng · `?dot=` cuộn trước khi bảng tải).
**Architecture:** Giữ mô hình PR-Qb (trục tuần theo lịch, mỗi giai đoạn một trục, mỗi kỹ năng một hộp, tầng PA `xepTang`). Mọi luật
mới là **hàm thuần** ở `shared/domain/hanhTrinh.ts` (chuỗi điểm + mũi tên, màu ghim, gom ghim theo tuần, nhãn khối PA, bố cục cột,
số hàng lưới) → kiểm bằng harness. Máy chủ `server/src/students/hanhTrinh.ts` **chỉ thêm trường** từ dữ liệu đã đọc (không câu SQL
mới, trần `tocDoDuong.ts` giữ 38–40). Web `HanhTrinh.tsx` viết lại phần vẽ thành **một lưới CSS duy nhất**. Không migrate.
**Tech Stack:** TypeScript · React 18 + Vite · Express · libsql/better-sqlite3 · Tailwind; phép kiểm `server/src/tests/*` harness
`check()`, chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-23-overhaul-giao-dien-design.md` §5 + §1 N-1b; mockup `thiet-ke/mockup/18-hanh-trinh-va-mau.html`
phần **(a0) (a1) (a2) (a3)** + khối "Luật hiển thị cho người làm giao diện (a)" + "Ghi chú kỹ thuật"; `17-hang-va-badge.html` dòng
#23; `docs/superpowers/specs/2026-09-23-viec-con-lai-sau-deploy.md` nhóm C "Hành trình (Qb)"; luật chung
`2026-09-22-ux-toan-web-truoc-deploy-design.md` §1 G-1…G-12, §2 chữ, §3.8; `thiet-ke/THUAT_NGU_DA_CHOT.md`. Ảnh cũ
`thiet-ke/anh/pr-qb/`, `thiet-ke/anh/pr-lt/rv86-06-hanh-trinh-sau-sua.png`.

| Mục | Chốt |
|---|---|
| Mã PR | **PR-UX5** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-ux5-hanh-trinh` · `.claude/worktrees/pr-ux5-hanh-trinh` |
| Cổng thử | API **4447** · Vite **5647** |
| Model | **Opus 5.5 · High** · phương án B: **Sonnet 5 · High** |
| Người rà | **Fable 5.1** (code bằng Fable thì rà bằng Opus 5.5) |
| Migrate | **KHÔNG** (không đổi `schema.sql`, `migrate.ts`) |
| Phụ thuộc | UX0 (#89) **đã merge** — dùng token `--dat/--sos1/--sos2/--sos3`, `SCORE_CHIP`, `Nhan`, `toneNhanTuBadge`. Chạy song song UX1–UX4 |
| File được sửa | `web/src/modules/students/HanhTrinh.tsx` · `server/src/students/hanhTrinh.ts` · `shared/domain/hanhTrinh.ts` · `server/src/tests/hanhTrinh.tests.ts` · **tạo** `web/src/lib/cuonOnDinh.ts` · **ngoại lệ** `StudentDetailPage.tsx:1-12` (import) + `:111-126` (hiệu ứng cuộn `?dot=`) · `CODE_MAP.md` (thêm dòng) |
| File KHÔNG được chạm | **UX0 (chỉ dùng):** `web/src/index.css`, `tailwind.config.js`, `web/src/ui/*` (`ui.tsx`, `Nhan.tsx`, `KetQuaDot.tsx`, `HangNhom.tsx`, `KhungPanel.tsx`), `shared/domain/mauNghia.ts`, `display.ts` · **UX1:** `web/src/modules/test/*` (trừ `keHoach/`), `web/src/modules/cham/*`, `shared/domain/dieuHuong.ts`, `server/src/cham/*` · **UX2:** `server/src/keHoach/*`, `web/src/modules/test/keHoach/*` · **UX3:** `web/src/modules/cases/*`, `students/NganCase.tsx`, `students/{ChuyenLopPanel,LoTrinhTiepPanel,StudentManagePanel,LichSuLop}.tsx`, `StudentDetailPage.tsx` **ngoài** hai chỗ ở trên, `shared/domain/{hoSoHocVien,cases,normal,duongHoSo}.ts`, `server/src/students/profile.ts` · **UX4:** `web/src/modules/phanTich/*`, `server/src/phanTich/*` · `server/src/tests/{run.ts,tocDoDuong.ts}` (không cần sửa) |

### Chồng file

| File | PR khác | Cách xử lý |
|---|---|---|
| `students/StudentDetailPage.tsx` | **UX3** (dòng 133-140, 383-385 NganCase; 453-455 badge đầu hồ sơ) | UX5 chỉ: thêm 1 dòng import + thay thân `useEffect` cuộn `?dot=`/`?kn=` (111-126) bằng gọi `cuonOnDinh`. Không đổi chỗ gắn tab (346-358). Ai merge sau thì rebase, giữ cả hai |
| `CODE_MAP.md` | mọi PR | Chỉ sửa 3 dòng Hành trình (36, 133, 253) + thêm `cuonOnDinh.ts` |
| Giao kèo `data-pa-id` + `onOpenCase(caseId, paId)` | **UX3** (NganCase dò `data-pa-id` để cuộn tới PA) | Giữ nguyên tên prop, giữ `data-pa-id={p.id}` trên khối PA |

## Global Constraints

- **N-1 / N-1b màu:** chỉ dùng token UX0 qua lớp Tailwind (`text-ok`, `bg-bad-bg`, `border-sos1-line`…) hoặc `SCORE_CHIP` của
  `ui.tsx`. Kết quả Test: **Đạt** `dat` (xanh lá) · **SOS 1** `sos1` (vàng) · **SOS 2** `sos2` (cam) · **SOS 3** `sos3` (đỏ) · **Tạm
  thời / Chưa đủ điểm** `tam` (xám, viền đứt). **Bỏ hết nền đặc pastel** (`toneBg`, `toneBg2`, `khoiPaBg`, `var(--ok)`/`var(--danger)`
  làm nền, chữ `--accent-ink` trên nền màu). Nhãn trạng thái = nền sẫm cùng họ + chữ màu. Không thêm token mới vào `index.css`.
- **Mockup 18 (a) — luật cứng:** (1) **một lưới** cho trục + mọi hộp: `grid-template-columns: {cotTen}px repeat(n, minmax(48px, 1fr))`,
  Xem gọn `repeat(n, 40px)`; khung hộp là một ô nền `1 / -1` theo số hàng của hộp; vạch cột tuần mảnh, đầu tháng đậm hơn; tuần hiện
  tại tô nhạt **cả cột** từ trục tới hộp cuối. (2) **Không vẽ đường điểm** (không `<svg>`, `<polyline>`, `<path>` trong
  `HanhTrinh.tsx`). Hàng đầu hộp: tên kỹ năng + chuỗi điểm **trong cột tên**; vùng trục của hàng đầu chỉ còn badge trạng thái hoặc
  chữ mờ "Không có Case", đặt ngay đầu vùng trục. Chuỗi `5.0 ▲+1.0 6.0 ▼−0.5 5.5` (dấu trừ U+2212), mũi tên + mức chênh 10px,
  tooltip từng số. (3) Ghim đợt Test ghi điểm, tô màu kết quả, **không mũi tên trên ghim**; Xem gọn dùng nhãn ngắn "MT3 5.5".
  (4) Hàng vấn đề `min-height: 40px`, tên 1 dòng `nowrap + ellipsis + title`, dòng phụ riêng. (5) Khối PA: nền sẫm cùng họ, bo 6px,
  **không viền**, dấu kết quả tô màu + tên chữ sáng; rộng < 130px chỉ dấu. (6) Màn hẹp: cột tên và hàng đầu hộp ghim trái (`sticky`).
- **G liên quan:** G-2 số `tabular-nums` · G-3 một dòng phụ ≤ 60 ký tự · G-4 ⚠ chỉ quá hạn (khối PA "Quá hạn cập nhật") · G-6 ngày
  `dd/mm` (khác năm mới có năm) qua `ngay(d, homNay)`, tuần `W{n} {THÁNG}` qua `tuanLich` — không `fmtDate` · G-7 viết tắt (L R W1 W2 S,
  MT, PA, SOS) và dấu ✓ ◐ ✗ ▶ ⚠ ▲ ▼ luôn có tooltip · G-11 375px trang không cuộn ngang, lưới cuộn **trong thẻ** · G-5 không `SectionNote`.
- **Chữ (§2, THUAT_NGU):** `Case` viết hoa · kết quả PA **Tiến bộ rõ · Tiến bộ một phần · Không tiến bộ · Kém hơn** (lấy từ
  `outcomeLabelFor`, không gõ lại) · **lớp thường không có "MT", "kỳ vọng", "Overall"** — dùng Giữa khoá / Cuối khoá, Đạt / Chưa đạt,
  "Đạt 3/4 môn" · "Cần hỗ trợ" (không "chưa ổn").
- **Giữ hành vi:** mọi phép kiểm cũ xanh — phép kiểm so **chữ/kiểu** cũ của `chuoiDiem`, `nhanGhim`, `nhanKhoiPa` thì sửa kỳ vọng sang
  dạng mới (cùng điều kiện, không xoá); số phép kiểm **không giảm**. Bấm tên vấn đề / khối PA vẫn mở ngăn Case (`onOpenCase`), bấm ghim
  vẫn `navigate(duongHoSoHocVien(id, { dot }))`. Khối "Mốc học tập" và `LichSuLop` (PR-LT, đầu tab) **giữ nguyên**.

## Quy trình nhanh (bắt buộc)

- Không rà từng Task bằng subagent. Tự code, `npm run check` sau **mỗi** Task (xanh, số phép kiểm ≥ mốc B), rồi commit `PR-UX5 (n): …`.
  **Chỉ một** lần `npm run check` chạy một lúc; treo → quét, tắt `run.js` cũ rồi chạy lại (bộ nhớ "npm run check treo khi chạy chồng").
- Subagent (nếu buộc dùng): cùng model, **không Haiku**. Commit ghi đúng `Co-Authored-By` của **model thật** đang chạy.
- Không chụp ảnh từng Task. Bấm thử theo vai (QL=2, GVCN=7, GVBM=9) + 375px **một lần** ở Task 6, **ảnh thật** Playwright kênh Chrome,
  lưu `thiet-ke/anh/pr-ux5/`. Tắt mọi tiến trình node/vite (4447/5647) trước khi kết thúc.
- Không chạm Turso, không deploy. Mã lệch hẳn kế hoạch → dừng, hỏi planning. Cuối PR: push, mở PR, báo planning.

## Bảng Q — tự quyết

| Q | Câu hỏi | Chốt | Lý do |
|---|---|---|---|
| Q1 | Tooltip điểm lớp thường: mockup (a2) ghi "kỳ vọng 70%" | **Không** chữ "kỳ vọng": `Giữa khoá MB-FOU 03 · 65% (13/20) · Chưa đạt — ngưỡng 70%`. Chú giải lớp thường: `65% chưa đạt` | §2 chữ lớp thường + Q17 của Qb (`KetQuaDot` ratio) thắng mockup |
| Q2 | Kiểu khối PA: mockup 17 #23 "viền đỏ = quá hạn", 18 (b3) "vạch màu trái" ↔ 18 (a) luật 5 "không viền" | Theo **18 (a)** (mới nhất, riêng màn này): không viền; quá hạn = họ `late` + dấu **⚠**; chữ khối = **tên PA**, câu đủ vào tooltip | 18 (a) là bản chốt cho Hành trình; ⚠ đúng G-4 (thật sự quá hạn) |
| Q3 | Ngưỡng hiện tên trong khối PA: 110px (mockup a0) hay ~130px (planning) | **130px** (`KHOI_PA_CO_TEN`). Mockup tự khớp: 164px có tên, 120px chỉ dấu | Chỉ thị planning; không cắt "Tăng cường bài t…" |
| Q4 | PA đang chạy kết thúc ở đâu | Ở **tuần hôm nay** (`denKhoiPa`): `den ?? max(tu, homNay)`. Trục vẫn tới tuần sau (`khoangTruc` Qb Q3 **giữ**) để ghim đợt sắp tới có chỗ | Lỗi Qb "kéo tới cột cuối" (`HanhTrinh.tsx:337`) |
| Q5 | Bề rộng cột tên | Rộng: `clamp(knw + ước rộng chuỗi dài nhất + 18, 300 (≥1800px: 320), 440)`. Không đủ chỗ (`rong < cotTen + n×48`) hoặc Xem gọn → **148px**, chuỗi xuống dòng dưới tên | Mockup 300/320/148; ước bằng hàm thuần để khỏi vòng đo ↔ đổi bố cục |
| Q6 | Xem gọn mặc định | Bật khi `matchMedia('(max-width: 639px)')` lúc mở tab; không lưu | Mockup (a3) "bật sẵn" ở 375 |
| Q7 | Số mốc trong chuỗi | Rộng: 5 mốc cuối (+ `?`); gọn/hẹp: **3** mốc cuối (tính cả `?`), chuỗi đủ vào `title` của cả chuỗi | 148px chỉ vừa 3 mốc |
| Q8 | Mũi tên tính thế nào | Giữa hai mốc **đang hiện** liền nhau; FT chênh band 1 chữ số lẻ (`▲+0.5`); lớp thường chênh **điểm %** tính từ % đã làm tròn (`▲+7`); `?` không mũi tên; bằng nhau `=` | Số hiện và mức chênh không lệch nhau |
| Q9 | Hai đợt cùng tuần | Gom theo tuần (`gomGhimTheoTuan`): một ô, ghim **xếp dọc** theo `attemptNo`, hàng ghim tự cao thêm | Lỗi Qb "ghim chồng" |
| Q10 | Nhãn ghim | FT: `MT1 · 5.5 · SOS 1` / `MT2 · 6.0 · Đạt` / đang chấm `MT3 · đang chấm` (tam) / chưa điểm `MT4` (tam); gọn `MT1 5.5`. Lớp thường: `Giữa · SOS 1` / `Cuối · Đạt` / `Cuối · tạm thời` (tam) / chưa điểm `Giữa` (tam); gọn `Giữa`. FT đủ điểm nhưng chưa có kỳ vọng → tam, tooltip "chưa có kỳ vọng" | Mockup (a1)(a2)(a3) + N-1b |
| Q11 | PA đã kết thúc chưa ghi kết quả | Họ `done` (xám), dấu `■`, tooltip `… · Đã kết thúc, chưa ghi kết quả` | Xanh lá chỉ cho kết quả (ui.tsx) |
| Q12 | Sửa `?dot=` ở đâu | Nguyên nhân: bảng kỹ năng (`#bang-ky-nang`, tải riêng qua `board`) nằm **trên** bảng đợt, tải xong sau khi đã cuộn → trang cao thêm, đợt trôi khỏi giữa màn. Sửa bằng `cuonOnDinh` (cuộn lại khi `#bang-ky-nang` đổi cỡ, tối đa 3 s, dừng khi người dùng tự cuộn) — ngoại lệ `StudentDetailPage.tsx:111-126` | Không có cách sửa từ `HanhTrinh.tsx`; diff 5 dòng |
| Q13 | Màu nền phụ của lưới | Khung hộp `var(--surface-2)`; tuần hiện tại `rgb(var(--doing-rgb) / 0.08)`; vạch tuần `var(--line)`, đầu tháng `var(--line-strong)` | Không thêm token vào `index.css` (file UX0) |
| Q14 | Badge hộp | `<Nhan>` (UX0): ok→`ok`, warn→`soon`, danger→`bad` (qua `toneNhanTuBadge`); gọn/hẹp hiện `ngan` ("Cần hỗ trợ"), đủ ở `title` | Mockup (a3) |
| Q15 | Hàng vấn đề | Tầng đầu `minmax(40px, auto)`, tầng thêm `30px`; tên `pl-6` (gọn `pl-3`) | Mockup 40px ≥ 36px planning |
| Q16 | Phép kiểm đặt đâu | Nối vào `hanhTrinh.tests.ts` (khối "PR-UX5") — không sửa `run.ts` | Giảm chồng file |

## Task 0 · Worktree, mốc, đối chiếu

- [ ] `git fetch origin`; `git log origin/main --oneline | grep -i "ux0"` phải thấy #89. `git worktree add .claude/worktrees/pr-ux5-hanh-trinh
  -b pr-ux5-hanh-trinh origin/main`; chép file kế hoạch này vào nhánh (`docs/superpowers/plans/`).
- [ ] Đọc bản thật: `web/src/ui/Nhan.tsx` (`Nhan`, `ToneNhan`, `toneNhanTuBadge`), `web/src/ui/ui.tsx` (`SCORE_CHIP`, `ScoreTone`
  gồm `sos1 sos2 sos3 tam emerald`), `tailwind.config.js` (`late`, `doing`, `done` có `-bg`/`-line`). Tên khác kế hoạch → dùng tên
  thật, ghi Nhật ký.
- [ ] `npm ci` nếu cần; `npm run check` → mốc **B** (số phép). Đo số câu `prepare` của `hanhTrinhHocVien` HV1 `'ft'`/`'thuong'`
  (script tạm, không commit) → `SO_CAU_FT`, `SO_CAU_THUONG`. Tìm ID: HV3 (Lê Quang Huy), một HV lớp GVBM 9 dạy. Ghi cả vào Nhật ký.
  Commit `PR-UX5 (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Shared: luật thuần (chuỗi điểm, ghim, khối PA, bố cục, hàng lưới)

**Files:** `shared/domain/hanhTrinh.ts` — sửa `nhanKhoiPa` (:142-162), `trangThaiHop` (:164-190), `chuoiDiem` (:192-212),
`nhanGhim` (:214-245); thêm hàm mới cuối file. Import thêm `RATIO_PASS_THRESHOLD` (`normal.ts`), `ASSESSED_SKILL_LABEL`
(`skills.ts`), `ngay` (`hienThiNgay.ts`; `tuanLich` đã import). `server/src/tests/hanhTrinh.tests.ts` — sửa kỳ vọng
:158-175, :193-216; thêm khối `// ===== PR-UX5 (1)` trước Task 2 Qb.

**Produces:**
```ts
export type MauKetQua = 'dat' | 'sos1' | 'sos2' | 'sos3' | 'tam';
export type DotRef = { cheDo: 'ielts' | 'ratio'; attemptNo: number; kind: string; maLop?: string | null };
/** Một mốc điểm máy chủ gửi — trường mới tuỳ chọn để phép kiểm cũ vẫn gọi được. */
export type DiemMoc = { gt: number; tong?: number | null; chuaDat: boolean; attemptNo?: number; kind?: string; maLop?: string | null; kyVong?: number | null };
export type LechDiem = { dau: 'len' | 'xuong' | 'bang'; chu: string };           // '▲+1.0' · '▼−0.5' · '='
export type MocDiem = { chu: string; xau: boolean; cho: boolean; lech: LechDiem | null; title: string };
export function nhanDot(d: DotRef): string;                                       // 'MT2' · 'Giữa khoá MB-FOU 03' · 'Cuối khoá'
export function lechDiem(truoc: number, sau: number, cheDo: 'ielts' | 'ratio'): LechDiem;
export function chuoiDiem(diem: readonly DiemMoc[], cheDo: 'ielts' | 'ratio', conCho: boolean,
  o?: { toiDa?: number; dotCho?: DotRef | null }): MocDiem[];                    // toiDa mặc định 5 (tính cả '?')
export function uocRongChuoi(moc: readonly MocDiem[]): number;                   // px ước — không đo DOM
export type NhanGhim = { chu: string; gon: string; day: string; mau: MauKetQua };
export function nhanGhim(a: { cheDo; attemptNo; kind; overall; sosLevel; soDat; soYeuCau; soCoDiem;
  maLop?: string | null; kyNangChuaDat?: string[]; kyVong?: number | null; tuan?: string }): NhanGhim;
export function gomGhimTheoTuan<T extends { tuan: string; attemptNo: number }>(g: readonly T[]): { tuan: string; ghim: T[] }[];
export type ToneKhoiPa = 'ok' | 'part' | 'bad' | 'run' | 'late' | 'done';
export type NhanKhoiPa = { ten: string; dau: '✓' | '◐' | '✗' | '▶' | '⚠' | '■'; tone: ToneKhoiPa; day: string };
export function nhanKhoiPa(pa: { ten; status; lastOutcome; followupOverdue; soNgayQuaHan?: number | null;
  tu?: string; den?: string | null }, homNay?: string): NhanKhoiPa;
export function denKhoiPa(p: { tu: string; den: string | null }, homNay: string): string;
export type TrangThaiHop = { chu: string; ngan: string; tone: ToneHop } | null;   // thêm `ngan`
export function dongPhuVanDe(v: { mo: string; dong: string | null; soPa: number }, homNay: string): string;
export const KHOI_PA_CO_TEN = 130;
export const RONG_TEN_KY_NANG = { ielts: 118, ratio: 96 } as const;
export type BoCuc = { cotTen: number; cotTuan: string; xuongDong: boolean; toiDaMoc: number };
export function boCucHanhTrinh(i: { rong: number; soTuan: number; xemGon: boolean; rongChuoi: number; cheDo: 'ielts' | 'ratio' }): BoCuc;
export function rongCotTuan(b: BoCuc, rong: number, soTuan: number): number;     // Xem gọn 40; ngược lại max(48, (rong − cotTen)/soTuan)
export type HangLuoi = { hangDoan: number | null; hangGhim: number | null; hangCuoi: number; mau: string;
  hop: { khung: [number, number]; dau: number; vanDe: { tu: number; so: number }[]; dongAn: number | null }[] };
export function xepHangLuoi(i: { coDoan: boolean; coGhim: boolean;
  hop: { soTangVanDe: number[]; coDongAn?: boolean }[] }): HangLuoi;   // coDongAn: thêm 1 hàng 'auto' cuối hộp cho "+n vấn đề cũ hơn"
```

**Luật dễ sai:**
```ts
// lechDiem — FT theo band, lớp thường theo % ĐÃ LÀM TRÒN của hai mốc (Q8); trừ là U+2212
const d = cheDo === 'ratio' ? Math.round(sau) - Math.round(truoc) : Math.round((sau - truoc) * 10) / 10;
if (d === 0) return { dau: 'bang', chu: '=' };
const so = cheDo === 'ratio' ? String(Math.abs(d)) : Math.abs(d).toFixed(1);
return d > 0 ? { dau: 'len', chu: `▲+${so}` } : { dau: 'xuong', chu: `▼−${so}` };

// chuoiDiem — FT chữ luôn 1 chữ số lẻ ('5.0', trước đây '5'); lớp thường `${round(gt/tong*100)}%`.
// title: FT  `MT3 · 5.5 · dưới kỳ vọng 6.0` | `MT2 · 6.0 · kỳ vọng 6.0` | thiếu kyVong: `MT2 · 6.0`
//        lớp thường `Giữa khoá MB-FOU 03 · 65% (13/20) · Chưa đạt — ngưỡng 70%` | `… · Đạt` (KHÔNG chữ "kỳ vọng", Q1)
//        '?': `${nhanDot(dotCho)} · chưa chấm` (không dotCho: 'Đợt sắp tới · chưa chấm'), cho = true, lech = null
// Cắt: lấy (toiDa − (conCho ? 1 : 0)) mốc cuối rồi mới tính lech giữa các mốc đã lấy; mốc đầu lech = null.

// nhanGhim — màu (N-1b):
//  soCoDiem === 0 || soCoDiem < soYeuCau  → 'tam'
//  FT đủ điểm: sosLevel null (chưa có kỳ vọng) → 'tam'; 0 → 'dat'; 1 → 'sos1'; 2 → 'sos2'; ≥3 → 'sos3'
//  Lớp thường đủ điểm: sosLevel 0 → 'dat'; 1/2/3 → 'sos1/2/3' (dù `evaluateRegular` có SOS tạm thời, thiếu môn vẫn 'tam')
// day FT:  `MT1 · W2 JUL · Overall 5.5 · SOS 1 — Reading dưới kỳ vọng` (tuanLich(tuan); nhãn ASSESSED_SKILL_LABEL)
// day lớp thường: `Giữa khoá MB-FOU 03 · Đạt 3/4 môn · SOS 1` | `Cuối khoá MB-BE 08 · mới chấm 3/4 môn · tạm thời`

// xepHangLuoi — hàng 1 tháng, 2 tuần, [đoạn], [ghim]; mỗi hộp: 1 hàng khe 10px + 1 hàng đầu + mỗi vấn đề `so` hàng (tầng)
// ví dụ { coDoan:false, coGhim:true, hop:[{soTangVanDe:[]},{soTangVanDe:[2,1]}] } →
//  hangGhim 3; hop[0] { dau 5, khung [5,6], vanDe [], dongAn null }; hop[1] { dau 7, khung [7,11], vanDe [{tu:8,so:2},{tu:10,so:1}] };
//  hangCuoi 11; mau 'auto auto auto 10px minmax(42px,auto) 10px minmax(42px,auto) minmax(40px,auto) 30px minmax(40px,auto)'
```
- `nhanKhoiPa`: bỏ trường `chu`. `ten` = tên PA thuần (mockup 17 #23). `dau`/`tone`: improved ✓ ok · partial ◐ part · unchanged/
  worse ✗ bad · completed không kết quả ■ done · quá hạn ⚠ late · đang chạy ▶ run. `day` = `${ten} · ${dau} ${nhãn} · ${ngay(tu,
  homNay)} → ${ngay(den, homNay)}`; đang chạy `Học tutor · ▶ Đang thực hiện · từ 16/09`; quá hạn `Học tutor · ▶ Đang thực hiện ·
  ⚠ Quá hạn cập nhật 2 ngày · từ 14/09` (không có `soNgayQuaHan` → bỏ "2 ngày"); kết thúc chưa ghi `… · ■ Đã kết thúc, chưa ghi kết quả · …`.
- `denKhoiPa`: `p.den ?? (p.tu > homNay ? p.tu : homNay)` (Q4).
- `trangThaiHop`: `ngan` = phần trước ` · ` của `chu` (`Cần hỗ trợ`, `Đang theo dõi`, `Chưa có PA`, `Đã ổn`).
- `dongPhuVanDe`: đang mở `từ 14/09 · 1 PA` / `từ 18/09 · chưa có PA`; đã đóng `12/07 → 24/08 · 2 PA` — ngày qua `ngay(d, homNay)`.
- `uocRongChuoi`: `Σ(chu.length × 7.6) + Σ lech (chu.length × 6.2 + 12) + (có '?' ? 16 : 0)` làm tròn lên.
- `boCucHanhTrinh`: xemGon → `{ 148, '40px', true, 3 }`; ngược lại `ten = clamp(RONG_TEN_KY_NANG[cheDo] + rongChuoi + 18,
  rong >= 1800 ? 320 : 300, 440)`; `rong < ten + soTuan × 48` → `{ 148, 'minmax(48px, 1fr)', true, 3 }`; còn lại `{ ten,
  'minmax(48px, 1fr)', false, 5 }`.

**Phép kiểm (≥ 16, khối "PR-UX5 (1)"):** `lechDiem` FT 3 nhánh (có đúng ký tự `−` U+2212, không `-` ASCII) · `lechDiem` ratio từ %
làm tròn (13/20→14/19: `▲+9`) · `chuoiDiem` FT: chữ `5.0`, `xau`, title "dưới kỳ vọng 6.0" · `chuoiDiem` ratio: title chứa "Giữa khoá"
và "ngưỡng 70%", **không** chứa "kỳ vọng"/"MT" · mốc `?`: `cho`, `lech === null`, title "chưa chấm" · `toiDa: 3` giữ 3 mốc cuối,
mốc đầu `lech === null` · `nhanGhim` FT 6 màu (sos 0/1/2/3, thiếu điểm, chưa có kỳ vọng) + `chu` có overall + `gon === 'MT1 5.5'` +
`day` có "Reading dưới kỳ vọng" · `nhanGhim` ratio `Giữa · SOS 1`/`Cuối · Đạt`/`Cuối · tạm thời`, không "MT" · `gomGhimTheoTuan`
cùng tuần (hai ngày khác nhau trong một tuần) → 1 nhóm 2 ghim đúng thứ tự, khác tuần → 2 nhóm · `nhanKhoiPa` 7 nhánh (dau/tone),
`ten` không chứa `·`, `day` quá hạn có `Quá hạn cập nhật 2 ngày` · `denKhoiPa` 3 nhánh · `trangThaiHop` 4 `ngan` · `dongPhuVanDe`
3 dạng, không năm khi cùng năm · `boCucHanhTrinh` 5 tình huống (gọn · 1440/13 tuần ≥ 300 · 1920 → 320 · 700px → 148 · chuỗi 5 mốc
dài → 300 < cotTen ≤ 440) · `rongCotTuan` + ngưỡng 130 (82×1 không tên, 82×2 có, 40×3 không) · `xepHangLuoi` đúng ví dụ trên + một
ví dụ có đoạn (hangDoan 3, hangGhim 4).
**Sửa kỳ vọng Qb (cùng điều kiện):** `chuoiDiem` "tối đa 5 mốc" `'2'`→`'2.0'`, `'6'`→`'6.0'` · `nhanGhim` `.ngan`→`.chu`, `.tone`→`.mau`
(`'ok'`→`'dat'`, `'danger'`→`'sos1'`, `'info'`/`'muted'`→`'tam'`; lớp thường `.ngan === 'Giữa'` → `.gon === 'Giữa'`) · `nhanKhoiPa`
`.chu` → `.ten`/`.dau`/`.day`, `daXong.tone === 'done'`. Tạm cho `HanhTrinh.tsx` biên dịch (dùng `ten`, `mau`) — vẽ đẹp ở Task 3–4.
Commit `PR-UX5 (1): luật thuần — chuỗi điểm ▲▼, màu ghim N-1b, khối PA, bố cục, hàng lưới`.

## Task 2 · Máy chủ: thêm trường, không thêm câu SQL

**Files:** `server/src/students/hanhTrinh.ts` :185-204 (ghim), :208-225 (điểm), :239-250 (PA); `hanhTrinh.tests.ts` khối "PR-UX5 (2)".

- Mỗi `diem` thêm `attemptNo: a.attempt_no, kind: a.kind, maLop: a.class_code ?? null, kyVong` — FT `t.ft!.expectation`, lớp thường
  `null` (ngưỡng lấy từ `RATIO_PASS_THRESHOLD` ở shared).
- Hộp thêm `dotCho: DotRef | null` — lượt `planned` **đầu tiên** chưa có điểm kỹ năng đó (chỗ đang đặt `conCho = true`). Giữ `conCho`.
- Ghim thêm `maLop`, `kyVong` (FT `r.expectation`, ratio null), `kyNangChuaDat: string[]` — FT `r.verdicts.filter(v => v.passed ===
  false).map(v => v.skill)`, ratio `r.skills.filter(s => s.outcome === 'fail').map(s => s.skill)`.
- PA thêm `soNgayQuaHan: number | null` = số ngày từ `iv.action_due` tới `homNay` khi `followupOverdue`, ngược lại `null`
  (tính bằng `Date.parse`, không truy vấn).
- **Không** câu `prepare` mới, không vòng truy vấn theo Case/PA; trần `tocDoDuong.ts:330-337` **không sửa**.

**Phép kiểm (≥ 6):** HV1 `'ft'`: mọi `diem` có `attemptNo`/`kind`, ≥ 1 `kyVong` khác null, và `chuaDat === (gt < kyVong)` khi có
`kyVong` · HV1 `'thuong'`: `kyVong === null`, `maLop` là chuỗi khác rỗng · ghim có mảng `kyNangChuaDat` (mã thuộc
`ASSESSED_SKILLS`) · **hai đợt cùng tuần**: chèn tạm một `assessment_attempts` cùng `cycle_id`, cùng `planned_period_id` với một đợt FT
của HV1 (`attempt_no` = max+1, `status='planned'`, `try/finally` xoá) → `ghim` có 2 phần tử cùng `mondayOfDate(tuan)`,
`gomGhimTheoTuan` ra 1 nhóm 2 ghim · PA quá hạn trong seed (`SELECT … FROM case_interventions WHERE status != 'completed' AND
action_due < ?` lấy một `case_id` → `student_id`) có `soNgayQuaHan > 0`, PA không quá hạn có `null` · **số câu không tăng**: Task 0
đo số `prepare` của `hanhTrinhHocVien(P.admin, HV1, 'ft')` và `'thuong'` trên `origin/main` (hàm `demTruyVan` như :309-315), ghi
Nhật ký; phép kiểm so bằng hằng `SO_CAU_FT`, `SO_CAU_THUONG` đó (`sau <= hằng`).
Commit `PR-UX5 (2): máy chủ Hành trình — điểm từng mốc + kỳ vọng, màu ghim, số ngày quá hạn (không câu SQL mới)`.

## Task 3 · Web: một lưới — trục, khung hộp, tuần hiện tại, ghim, Xem gọn

**Files:** `web/src/modules/students/HanhTrinh.tsx` (viết lại :19-238; giữ khối "Mốc học tập" :205-228 nguyên văn).

**Interfaces:** props `HanhTrinh({ studentId, active, episodes, allEpisodes, onOpenCase })` **giữ nguyên**. Kiểu dữ liệu :19-39 thêm
trường Task 2. Thành phần con: `Truc`, `HopKyNang`, `VanDeHang`, `KhoiPa`, `ChuaCoPa`, `ChuGiai` — **không** thành phần nào tự tạo
`display: grid` riêng cho cột tuần; tất cả là **con trực tiếp** của lưới chính (dùng `<>…</>`).

- Hàng điều khiển: [nút giai đoạn] · (đẩy phải) chip kỹ năng (`title` đủ tên) · select khoảng · công tắc **Xem gọn**
  (`<button role="switch" aria-checked title="Thu hẹp cột tuần về 40px — cuộn ngang trong thẻ">`). `flex-wrap`, 375 tự xuống 3 hàng.
- Đo bề rộng khung: `ResizeObserver` trên khung cuộn → `rong` (state). `boCuc = boCucHanhTrinh({ rong, soTuan, xemGon, rongChuoi:
  max(uocRongChuoi(chuoiDiem(h.diem, …, { toiDa: 5 }))), cheDo })` — ước trên **5 mốc** dù đang hiện 3 (tránh nhảy qua lại).
- Khung cuộn `<div className="overflow-x-auto">` > lưới `<div className="grid relative" style={{ gridTemplateColumns:
  \`${boCuc.cotTen}px repeat(${n}, ${boCuc.cotTuan})\`, gridTemplateRows: hang.mau }}>` — cột có bề rộng tối thiểu nên lưới
  hẹp hơn tổng tối thiểu thì tự tràn, khung cuộn ngang (G-11).
  `hang = xepHangLuoi({ coDoan, coGhim, hop: hopHienThi.map(h => ({ soTangVanDe: vanDeHienThi(h).map(soTang), coDongAn: soAn(h) > 0 })) })`.
- Lớp nền (vẽ trước, `pointer-events-none`): khung mỗi hộp `gridRow: \`${khung[0]} / ${khung[1]}\`, gridColumn: '1 / -1'` nền
  `var(--surface-2)` bo `rounded-lg` `z-0` · vạch mỗi tuần `gridRow: \`2 / ${hangCuoi}\`` `border-l` (`dauThang` → `var(--line-strong)`)
  `z-[1]` · **tuần hiện tại**: `gridRow: \`1 / ${hangCuoi}\`, gridColumn: cot + 2`, nền `rgb(var(--doing-rgb) / 0.08)`, `rounded-md`
  `z-[1]` (sửa lỗi Qb "chỉ tô ô nhãn"). Nhãn tuần này đậm `text-doing`, `title="W4 SEP · tuần này"`.
- Trục: tháng (hàng 1), tuần (hàng 2, ô cột 1 `Tuần`), đoạn Khoá/Lộ trình (`bg-muted-bg text-muted` bo 6px, `truncate` + `title`),
  **ghim**: mỗi nhóm `gomGhimTheoTuan` một ô:
```tsx
<div style={{ gridRow: hang.hangGhim!, gridColumn: cot + 2 }}
  className={`z-[2] flex flex-col gap-1 py-1.5 overflow-visible ${cot === 0 ? 'items-start' : cot === n - 1 ? 'items-end' : 'items-center'}`}>
  {nhom.ghim.map((g) => { const nh = nhanGhim(g); return (
    <button key={g.attemptId} type="button" title={nh.day} onClick={() => navigate(duongHoSoHocVien(studentId, { dot: g.attemptId }))}
      className={`rounded-full border px-2 text-[10.5px] font-bold leading-4 whitespace-nowrap ${SCORE_CHIP[MAU_GHIM[nh.mau]]}`}>
      {boCuc.xuongDong ? nh.gon : nh.chu}</button>); })}
</div>
// MAU_GHIM: { dat: 'emerald', sos1: 'sos1', sos2: 'sos2', sos3: 'sos3', tam: 'tam' } as const satisfies Record<MauKetQua, ScoreTone>
```
- Ô cột 1 mọi hàng (nhãn trục, tên vấn đề): `sticky left-0 z-[3]`, nền = nền của hàng đó (`var(--surface)` ở trục, `var(--surface-2)`
  trong hộp) để che vạch/khối PA khi cuộn ngang.
- Xoá `colTemplate` 40px cố định (:72) và chú thích cũ về "nhiều lưới" (:66-71, :116-121); xoá `toneBg`, `toneBg2`, `khoiPaBg`.
Tiêu chí: `npm run check` xanh; mở tay 1440 thấy cột tuần giãn, tuần này tô cả cột (ghi Nhật ký 1 dòng, chưa chụp).
Commit `PR-UX5 (3): Hành trình một lưới — cột tuần giãn, tuần này tô cả cột, ghim màu kết quả gom theo tuần, Xem gọn`.

## Task 4 · Web: hộp kỹ năng — chuỗi điểm trong cột tên, hàng vấn đề, khối PA, chú giải

**Files:** `HanhTrinh.tsx` (`HopKyNang`, `VanDeHang`, `KhoiPa`, `ChuaCoPa`, `ChuGiai`).

- **Hàng đầu hộp** (`gridRow: hop.dau, gridColumn: '1 / -1'`, `min-h-[42px] flex items-stretch z-[2]`), bên trong một khối
  `sticky left-0` dạng lưới con **không** chia cột tuần:
```tsx
<div className="sticky left-0 grid items-center whitespace-nowrap" style={boCuc.xuongDong
  ? { gridTemplateColumns: `${boCuc.cotTen}px auto`, rowGap: 2, padding: '6px 0', background: 'var(--surface-2)' }
  : { gridTemplateColumns: `${RONG_TEN_KY_NANG[cheDo]}px ${boCuc.cotTen - RONG_TEN_KY_NANG[cheDo]}px auto` }}>
  <span className="pl-3 text-[13px] font-bold truncate" title={hop.nhan}>{hop.nhan}</span>
  <span data-chuoi className="inline-flex items-baseline justify-self-start w-max pr-3 tabular-nums text-[12.5px]"
    style={boCuc.xuongDong ? { gridColumn: 1, gridRow: 2, paddingLeft: 12 } : undefined} title={chuoiDu}>
    {moc.map((m, i) => <Fragment key={i}>{m.lech && <i className={`not-italic text-[10px] font-bold mx-[5px] ${LECH[m.lech.dau]}`}
      title={m.lech.dau === 'len' ? 'Tăng' : m.lech.dau === 'xuong' ? 'Giảm' : 'Giữ nguyên'}>{m.lech.chu}</i>}
      <b className={m.cho ? 'ml-2 font-semibold text-faint' : m.xau ? 'text-bad' : 'text-[var(--text)]'} title={m.title}>{m.chu}</b></Fragment>)}
  </span>
  {badge ? <span className="ml-1.5" style={boCuc.xuongDong ? { gridColumn: 2, gridRow: '1 / 3' } : undefined}>
      <Nhan tone={badge.tone === 'ok' ? 'ok' : toneNhanTuBadge(badge.tone)} title={badge.chu}>{boCuc.xuongDong ? badge.ngan : badge.chu}</Nhan></span>
    : <span className="ml-1.5 text-[10.5px] text-faint">Không có Case</span>}
</div>
// LECH = { len: 'text-ok', xuong: 'text-bad', bang: 'text-faint' }; chưa có điểm: <span className="text-faint">chưa có điểm</span>
// moc = chuoiDiem(hop.diem, cheDo, hop.conCho, { toiDa: boCuc.toiDaMoc, dotCho: hop.dotCho }); chuoiDu = chuoiDiem(…, {toiDa: 99}) nối ' '
```
- **Hàng vấn đề** (`VanDeHang`, trả `<>…</>`): ô tên `gridRow: \`${vd.tu} / span ${vd.so}\`, gridColumn: 1`, `sticky left-0 z-[3]`,
  nền `var(--surface-2)`, `pl-6 pr-3` (xuongDong `pl-3`), `flex flex-col justify-center`; `<button onClick={() => onOpenCase(v.caseId)}>`
  chứa `<span className="block truncate text-[11.5px] leading-[15px]" title={v.ten}>` + `<span className="block truncate text-[10.5px]
  text-faint" title={phu}>{phu = dongPhuVanDe(v, homNay)}</span>`. Vạch ngăn hàng 1px `border-t` trên ô tên + một ô mảnh `1 / -1`.
- **Khối PA** (`KhoiPa`): `a = cotCua(p.tu)`, `b = cotCua(denKhoiPa(p, homNay))` (Q4 — hết "kéo tới cột cuối"); `rongKhoi = (b − a + 1)
  × rongCotTuan(boCuc, rong, n)`; `hienTen = rongKhoi >= KHOI_PA_CO_TEN`.
```tsx
<button type="button" data-pa-id={p.id} title={nh.day} onClick={() => onOpenCase(v.caseId, p.id)}
  style={{ gridRow: vd.tu + tang, gridColumn: `${a + 2} / ${b + 3}` }}
  className={`z-[2] self-center mx-[3px] h-6 min-w-0 rounded-md px-2 flex items-center gap-1.5 text-[11px] overflow-hidden ${KHOI[nh.tone]} ${hienTen ? '' : 'justify-center px-0'}`}>
  <span className="font-extrabold flex-none">{nh.dau}</span>
  {hienTen && <span className="truncate font-semibold text-[var(--text)]">{nh.ten}</span>}
</button>
// KHOI: ok 'bg-ok-bg text-ok' · part 'bg-soon-bg text-soon' · bad 'bg-bad-bg text-bad' · run 'bg-doing-bg text-doing'
//       · late 'bg-late-bg text-late' · done 'bg-done-bg text-done'   — KHÔNG border (Q2)
```
- **Chưa có PA**: `a = cotCua(v.mo)`, `b = cotCua(homNay)`; viền đứt `border border-dashed border-soon-line text-soon`, bo 6px, chữ
  `Chưa có PA` khi rộng ≥ 72px (ngược lại trống), `title="Chưa có phương án nào — cần đề ra"`.
- "+n vấn đề cũ hơn — chọn "Cả giai đoạn"" giữ (luật Qb Q22): truyền `coDongAn: soAn > 0` vào `xepHangLuoi`, vẽ nút ở
  `gridRow: hop.dongAn, gridColumn: '1 / -1'`, `sticky left-0 w-max pl-3 text-[11px] text-faint`.
- **Chú giải** (`ChuGiai`, thay :200-203): nhóm chữ hoa nhỏ `ĐIỂM` (`▲+0.5 tăng` · `▼−0.5 giảm` · `= giữ` · FT `5.5 dưới kỳ vọng` /
  lớp thường `65% chưa đạt`) | `ĐỢT TEST` (5 ghim mẫu Đạt · SOS 1 · SOS 2 · SOS 3 · Tạm thời, cùng `SCORE_CHIP`) | `PHƯƠNG ÁN` (✓ Tiến
  bộ rõ · ◐ Tiến bộ một phần · ✗ Không tiến bộ · ▶ Đang làm · ⚠ Quá hạn cập nhật · ô viền đứt Chưa có PA — nhãn lấy `outcomeLabelFor`)
  | ô màu tuần này. `flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-dim`.
Tiêu chí: `npm run check` xanh; ảnh chưa chụp. Commit `PR-UX5 (4): hộp kỹ năng — chuỗi điểm ▲▼ trong cột tên, hàng vấn đề 40px, khối PA theo bề rộng, chú giải`.

## Task 5 · `?dot=` cuộn ổn định (ngoại lệ StudentDetailPage)

**Files:** tạo `web/src/lib/cuonOnDinh.ts`; `StudentDetailPage.tsx` :1-12 (import), :111-126.
```ts
/** Cuộn `layDich()` vào giữa màn, rồi cuộn lại mỗi khi `theoDoi` đổi cỡ (bảng phía trên tải xong) — tối đa `ms`,
 *  dừng ngay khi người dùng tự cuộn (wheel/touchmove/keydown). Trả hàm dọn. */
const SU_KIEN = ['wheel', 'touchmove', 'keydown'] as const;
export function cuonOnDinh(layDich: () => HTMLElement | null, theoDoi: HTMLElement | null, ms = 3000): () => void {
  const cuon = () => layDich()?.scrollIntoView({ block: 'center' });
  const raf = requestAnimationFrame(cuon);
  const ro = theoDoi && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(cuon) : null;
  if (ro && theoDoi) ro.observe(theoDoi);
  let t = 0;
  const dung = () => { ro?.disconnect(); for (const e of SU_KIEN) window.removeEventListener(e, dung); window.clearTimeout(t); };
  for (const e of SU_KIEN) window.addEventListener(e, dung, { passive: true });
  t = window.setTimeout(dung, ms);
  return () => { cancelAnimationFrame(raf); dung(); };
}
```
Trong `StudentDetailPage` giữ điều kiện và deps cũ; nhánh `p.dot` →
`return cuonOnDinh(() => document.getElementById(\`dot-${p.dot}\`), document.getElementById('bang-ky-nang'))`; nhánh `p.kn` giữ
`setSkillPick` rồi `return cuonOnDinh(() => document.getElementById('bang-ky-nang'), null)`. Không đổi gì khác trong file.
**Phép kiểm (≥ 2, quét nguồn):** `cuonOnDinh.ts` có `ResizeObserver`, `setTimeout`, trả hàm dọn · `StudentDetailPage.tsx` gọi
`cuonOnDinh(` và không còn `requestAnimationFrame(() => document.getElementById(\`dot-`.
Commit `PR-UX5 (5): ?dot= cuộn lại khi bảng kỹ năng tải xong (không trôi khỏi đợt)`.

## Task 6 · Quét nguồn, bấm thử theo vai + 375px (một lần), PR

- [ ] **Phép kiểm quét nguồn (≥ 4, khối "PR-UX5 (6)")** trên `HanhTrinh.tsx` sau khi bỏ chú thích (`boChuThich` như
  `hoSoHocVien.tests.ts:32`): không `toneBg`, `khoiPaBg`, `var(--danger)`, `var(--accent-ink)`, `text-slate-600`, `fmtDate`,
  `<svg`, `<polyline`, `, 40px)` (40px chỉ đến từ `boCucHanhTrinh`) · có `data-pa-id`, `role="switch"`, `xepHangLuoi(`,
  `gomGhimTheoTuan(`, `denKhoiPa(`, `boCucHanhTrinh(` · phép cũ Qb (4) (không "dự kiến", `SectionNote`, `weekCodeOf`) vẫn xanh.
- [ ] Máy chủ thử (bộ nhớ "máy chủ dev trong worktree", **không** `preview_start`): DB tạm `PISA_DB` trong scratchpad, `npm run seed`;
  `npm run build:server && PISA_DB="$KIEM" PORT=4447 npm run dev:api` (nền); `vite.kiem.config.ts` tạm ở gốc worktree (`port: 5647,
  strictPort`, proxy `/api` → `http://127.0.0.1:4447`, alias `@shared`, **không commit**) → `npx vite --config vite.kiem.config.ts`;
  Playwright kênh Chrome (`npm install --no-save playwright`); đăng nhập `POST /api/demo/session { userId }`. Task 0 ghi ID HV: **HV1**
  (Nguyễn Minh An, lớp thường → FT), **HV3** (Lê Quang Huy, nhiều PA, có PA quá hạn + "Chưa có PA"), một HV lớp GVBM 9 dạy.
- [ ] Kịch bản (ảnh `thiet-ke/anh/pr-ux5/NN-ten-{1440|1920|375}.png`), mỗi ảnh kèm **đo bằng JS** ghi vào Nhật ký:
  1. **GVCN (7)** · HV3 › Hành trình › FT 3 tháng, **1440**: cột tuần ≥ 70px; mép trái mọi `[data-pa-id]` trùng mép một ô tuần (±1px);
     ô "tuần này" cao từ trục tới đáy hộp cuối; khối PA đang chạy **kết thúc ở cột tuần này** (không tới cột tuần sau); mọi phần tử
     trong lưới có `scrollWidth > clientWidth` đều có `title`; mỗi hộp: mép phải `[data-chuoi]` ≤ mép trái badge; hàng vấn đề ≥ 40px;
     khối PA < 130px không có tên; không nền đặc pastel (so `getComputedStyle` với 5 token nền sẫm).
  2. Cùng màn bật **Xem gọn**: cột 40px, chuỗi 3 mốc dưới tên, badge ngắn, ghim `MT1 5.5`; tắt lại trở về như 1.
  3. **QL (2)** · HV1 › nút **Lớp thường** › "Cả giai đoạn", **1920**: dải Khoá FOU → BE; ghim `Giữa · SOS 1`/`Cuối · Đạt` đúng màu;
     chuỗi `%` có `▲+7`/`▼−9`; tooltip số **không** chứa "kỳ vọng"; cột tên 320px.
  4. **Hai đợt cùng tuần** (DB tạm: `node -e` + better-sqlite3 chèn một đợt FT cùng `planned_period_id` cho HV1, chụp, rồi `npm run seed`
     lại): hai ghim xếp dọc trong một ô, không chồng.
  5. **`?dot=`**: HV3 › Hành trình › bấm ghim MT2 → tab Học thuật; sau 3,5 s tâm `#dot-{id}` nằm trong 25% giữa màn (đo 3 lần, ghi số).
  6. **GVBM (9)** · HV lớp mình dạy › Hành trình: xem được, bấm khối PA mở ngăn Case cuộn tới PA (`data-pa-id`), bấm tên vấn đề mở Case.
  7. **375px** (GVCN, HV3): Xem gọn **tự bật**; `document.documentElement.scrollWidth === innerWidth`; cuộn khung 300px → ô tên vấn đề
     và hàng đầu hộp giữ nguyên `x` (sticky); ghim nhãn ngắn; chú giải xuống dòng không tràn.
- [ ] Sửa lỗi bắt được (commit riêng `PR-UX5 (6a): …`). Dọn file Playwright/Vite/DB tạm; tắt 4447/5647; quét `run.js` treo và tắt.
- [ ] `CODE_MAP.md` dòng 36, 133, 253: thêm "một lưới, chuỗi điểm ▲▼, màu ghim N-1b, Xem gọn" + `web/src/lib/cuonOnDinh.ts`.
- [ ] Kiểm ranh giới: `git diff origin/main...HEAD --stat` chỉ gồm file ở bảng "File được sửa"; `git diff origin/main...HEAD --
  web/src/modules/students/StudentDetailPage.tsx` chỉ chạm import + khối 111-126; `-- server/src/schema.sql server/src/migrate.ts
  server/src/tests/tocDoDuong.ts` rỗng. `npm run check` cuối (≥ **B + 30**), tocDo xanh với trần cũ.
- [ ] `git fetch origin` → rebase `origin/main` nếu UX1–UX4 đã merge (gỡ theo bảng Chồng file); `npm run check` lại.
- [ ] Push, mở PR `PR-UX5 · Hành trình học viên: một lưới trải rộng, điểm ▲▼, màu kết quả, Xem gọn` — thân: tóm tắt theo Task,
  bảng Q, ảnh, số đo Playwright, **"KHÔNG migrate · không câu SQL mới"**, ngoại lệ StudentDetailPage, "Chuyển cho", dòng cuối
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Báo planning (không tự merge, không tự rà).

---

## Mâu thuẫn nguồn ↔ mã thật

1. **Mockup 18 (a2) tooltip lớp thường "kỳ vọng 70%"** ↔ §2 chữ lớp thường + Q17 Qb (không "kỳ vọng") → Q1.
2. **Mockup 17 #23 "viền đỏ = quá hạn"** và 18 (b3) "vạch màu trái" ↔ 18 (a) luật 5 "không viền" → theo 18 (a), Q2.
3. **Ngưỡng tên khối PA**: 18 (a0)/(a) ghi 110px ↔ planning ~130px; ví dụ trong mockup khớp 130 → Q3.
4. **Trục**: mockup (a1) 13 tuần kết thúc ở tuần này; mã `khoangTruc` (Qb Q3) kết thúc **tuần sau** → giữ mã, chỉ sửa khối PA (Q4).
5. **Ghi chú kỹ thuật mockup 18** nói "ghim cần overall lần trước để ghi ▲/▼" ↔ luật (a)3 "không mũi tên trên ghim" → không mũi tên.
6. Kiểm kê nhóm C trỏ `HanhTrinh.tsx:336`; dòng thật **:337** (`p.den ?? truc.tuan[last]`).
7. `?dot=` không nằm ở Hành trình mà ở `StudentDetailPage.tsx:111-126`; nguyên nhân thật là `SkillBoard` tải sau (Q12).
8. `VanDeHang` gọi `ngay(v.mo)` **không** `homNay` → hiện năm cùng năm ("từ 12/07/2026", ảnh rv86-06) — sai G-6, sửa qua `dongPhuVanDe`.
9. Kế hoạch UX0 liệt kê `toneBg/toneBg2/khoiPaBg` (nền đặc) là việc của UX5 — mã `origin/main` vẫn còn → UX5 bỏ.

## Chuyển cho (ghi vào thân PR)

- **Planning:** nếu muốn trục kết thúc ở tuần hiện tại như mockup (a1) — đổi `khoangTruc` (luật Qb Q3), cần chủ sản phẩm chốt.
- **UX3:** giao kèo `data-pa-id` giữ nguyên; `StudentDetailPage.tsx:111-126` đã đổi sang `cuonOnDinh` — rebase giữ.

## Nhật ký

| Ngày | Task | Ghi |
|---|---|---|
| 24/09 | 0 | Worktree `pr-ux5-hanh-trinh` từ origin/main a8d7260 (UX0 #89 đã có). Mốc **B = 1186 + 20 (tocDo)**, `npm run check` xanh. Tên thật khớp kế hoạch: `Nhan`/`ToneNhan`/`toneNhanTuBadge` (`web/src/ui/Nhan.tsx`), `SCORE_CHIP`/`ScoreTone` gồm `sos1 sos2 sos3 tam emerald` (`ui.tsx`), token `late/doing/done/dat/sos1-3` có trong `tailwind.config.js`. `SO_CAU_FT = 31`, `SO_CAU_THUONG = 33` (đếm `prepare` của `hanhTrinhHocVien(admin, 1, 'ft'|'thuong')` trên DB seed sạch). HV1 = Nguyễn Minh An, HV3 = Lê Quang Huy; GVCN = user 7, GVBM = user 9, QL = user 2 (đều `teacher`/`manager`). |
| 24/09 | 1 | **Sai kế hoạch, sửa theo mã:** `nhanDot` đã có ở `shared/domain/phanTich.ts` (UX4, xuất chung qua `index.ts`) → hàm mới đặt tên **`nhanDotTest`**. `nhanKhoiPa` thêm `day` có ngày `dd/mm` (tham số thứ hai `homNay` tuỳ chọn). `nhanGhim` nhận thêm `homNay` tuỳ chọn để `tuanLich` thêm năm khi khác năm. Số phép kiểm 1186 → 1203 (+17). |
| 24/09 | 2 | `hanhTrinhHocVien` thêm trường, **không** thêm câu `prepare` (đo lại trong harness ≤ 31 / ≤ 33). `soNgayQuaHan` tính bằng `Date.parse`. 1209. |
| 24/09 | 3–4 | Viết lại `HanhTrinh.tsx` một lưới (không `<svg>`). **Phát hiện khi bấm thử 375px:** `position: sticky` trong ô ở `gridColumn: 1` không đứng yên (vùng chứa của nó chỉ là ô đó) → thêm thành phần `CotGhim` (ô ngoài trải `1 / -1`, không bắt chuột; phần đứng yên bên trong rộng `cotTen`); vạch tuần vẽ theo đoạn (bỏ hàng khe) để khi cuộn ngang khe không lộ vạch dưới cột tên. Khối PA lệch mép ô tuần đúng **3px** (`mx-[3px]` theo mockup `.pa{margin:0 3px}`) — không phải lệch bố cục. |
| 24/09 | 5 | `cuonOnDinh` + đổi hiệu ứng trong `StudentDetailPage`. **Đối chứng** (chặn 1,5 s API `skill-board`, viewport 1440×380, 3 lần đo): mã cũ trôi từ lệch 31px → **233px** (0,82 chiều cao khung) sau 4 s; mã mới giữ **31px (0,108)** cả lúc 0,7 s lẫn 4 s. Không thể căn đúng giữa vì đợt MT nằm gần cuối trang (cuộn hết cỡ) — ở viewport 900 tâm đợt ở 0,88 và không đổi giữa các lần đo. 1215 → 1217 sau khi thêm 2 phép kiểm quét nguồn. |
| 24/09 | 6 | Bấm thử ảnh thật `thiet-ke/anh/pr-ux5/`. **1440 GVCN(7) HV3 FT:** cột tên 300 · cột tuần **80,9px** ×13 · ô "tuần này" cao 537px từ trục tới đáy hộp cuối, trùng cột (lệch 0/0) · 6 khối PA đều cách mép ô tuần 3px · PA đang chạy (id 7, 10) kết thúc ở cột tuần này (mép phải 1268 = mép phải tuần này 1271 − 3) · mọi hộp: mép phải chuỗi (263) < mép trái badge (350) · 5 hàng vấn đề cao đúng 40px · không phần tử nào bị cắt mà thiếu `title` · nền khối PA 4 màu sẫm (`rgb(53,43,16)`, `62,31,19`, `18,53,38`, `60,29,36`) · 0 lỗi console. **Xem gọn:** cột tên 148, tuần 40, chuỗi 3 mốc dưới tên, ghim `MT1 5.5`. **QL(2) HV1 lớp thường 1920 "Cả giai đoạn":** cột tên 320, cột tuần 72px ×21, dải Khoá FOU→BE, chuỗi % có `▲+3 ▼−5 ▼−8` khớp số làm tròn, không chữ "kỳ vọng". Seed HV1 ra `Giữa · SOS 3` / `Cuối · SOS 2` (kế hoạch ghi ví dụ SOS 1/Đạt — dữ liệu seed khác, luật vẫn đúng). **Hai đợt cùng tuần (HV1 FT, chèn tạm rồi xoá):** MT3/MT4 xếp dọc một ô, không chồng. **GVBM(9) HV3:** bấm khối PA mở ngăn Case và cuộn tới PA (`data-pa-id`), bấm tên vấn đề mở Case. **375px GVCN HV3:** Xem gọn tự bật, `scrollWidth` tài liệu = 375, khung cuộn 668 > 295; cuộn 300px → hàng đầu hộp giữ x=40 và ô tên vấn đề giữ x=52 (trước khi thêm `CotGhim` ô tên trôi 52 → −101); ghim `MT1 5.5`; chú giải xuống dòng, không tràn. |
