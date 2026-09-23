# PR-UX3 · Panel Học viên & Lớp theo khuôn chung + badge còn lại — Kế hoạch

> **For agentic workers:** KHÔNG dùng `superpowers:subagent-driven-development` — làm theo khối **Quy trình nhanh** bên dưới.

**Goal:** Mọi form/ngăn ở khu Học viên & Lớp dùng một khuôn `KhungPanel` (UX0), vẽ đúng mockup 15; không panel chồng panel;
bỏ chữ dev, chữ mẫu giống dữ liệu, lỗi hiện trước khi gõ, năm lặp; tuần dạng `W4 SEP`. Sửa phần badge còn lại của bảng 26
dòng (mockup 17 b2, trừ 4 gốc UX0) và 6 lỗi thấy khi chụp hiện trạng (đặc tả §3).
**Architecture:** Không đổi luật, không đổi bảng, không đường API mới. Chữ/nhãn đổi ở **shared** (hàm thuần, phép kiểm được);
web chỉ vẽ lại. Ngăn Case là **một** `KhungPanel` đổi nội dung theo `view` (Case · Ghi kết quả · Thêm PA · Hoàn thành ·
Trả lời đề xuất) — thay 4 `Modal` đang đè lên ngăn. Ô ngày/tuần dùng bộ chọn mới `ChonNgay.tsx` (select, không ô lịch trình duyệt).
**Tech Stack:** TypeScript · React 18 + Vite · Express · libsql/better-sqlite3 · Tailwind; phép kiểm `server/src/tests/*`
harness `check()`, chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-23-overhaul-giao-dien-design.md` §1 N-3, N-4, §3 (nhánh `origin/ke-hoach-overhaul`);
mockup `thiet-ke/mockup/15-panel-hv-lop.html` (0)–(10), `17-hang-va-badge.html` (b1)–(b5); ảnh `thiet-ke/anh/hien-trang-23-09/`.

| Mục | Chốt |
|---|---|
| Mã PR | **PR-UX3** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-ux3-panel-badge` · `.claude/worktrees/pr-ux3-panel-badge` |
| Cổng thử | API **4417** · Vite **5617** |
| Model | **Opus 5.5 · High** · phương án B: **Sonnet 5 · High** |
| Người rà | **Fable 5.1** (code bằng Fable thì rà bằng Opus 5.5) |
| Migrate | **KHÔNG** |
| Phụ thuộc | **Merge sau UX0** (dùng `KhungPanel`, `Nhan`, `HangNhom/HangCon`, token màu, `deadlineView` mảnh rời). Z2c-c merge trước UX0 |
| File KHÔNG được chạm | **UX1:** `web/src/modules/test/*` (trừ `keHoach/`), `shared/domain/dieuHuong.ts`, `server/src/cham/*` · **UX2:** `server/src/keHoach/*`, `web/src/modules/test/keHoach/*` · **UX4:** `web/src/modules/phanTich/*`, `server/src/phanTich/*` · **UX5:** `web/src/modules/students/HanhTrinh.tsx`, `shared/domain/hanhTrinh.ts` · **Z2c-c:** `ui/Filters.tsx`, `ScoreEntry.tsx`, `LuoiThuong.tsx`, `scoreDebt.ts`, `attempts.ts`, `db.ts`, `app.ts` · **UX0 (chỉ dùng):** `ui/KhungPanel.tsx`, `ui/HangNhom.tsx`, `ui/Nhan.tsx`, `ui/ui.tsx`, `index.css`, `display.ts:230-310`, `WorkList.tsx` |

### Chồng file

| File | PR khác | Cách xử lý |
|---|---|---|
| `server/src/worklist/mywork.ts` | **UX0** (gốc badge: `GROUP_META.overdue`, `lateText`, `reason`, `tieuDe`) | UX3 chỉ: `contextLabel` (8 chỗ `MT${…}`), khối `placement` (urgency + statusLabel), `href` nhóm `result`. UX0 đã sửa chỗ nào thì bỏ, ghi Nhật ký |
| `shared/domain/display.ts` | **UX0** (dòng 230-310) | UX3 chỉ sửa `attemptProgressView` (dòng ~180-186) |
| `ui/KhungPanel.tsx`, `ui/Nhan.tsx` | UX0 (chủ), UX1/UX2 (dùng) | Chỉ **thêm prop tuỳ chọn** nếu thiếu (`quayLai`, `nguCanh`, `netDut`) — không đổi prop có sẵn |
| `cases/CaseBoardPage.tsx`, `cases/IssueAnalysis.tsx` | UX4 (Phân tích dùng) | Chỉ thay khối `<Drawer title="Vấn đề - Case">…` bằng `<NganCase>` + badge mức độ (dòng 232) |
| `students/StudentsPage.tsx`, `classes/DauTrangLop.tsx` | **UX1** Task 3 (`StudentsPage.tsx:234`, `DauTrangLop.tsx:66`: badge `cham` bấm → `duongLichTest`) | UX3 chỉ sửa đối số `badgeLop(...)` (StudentsPage ~227, DauTrangLop ~57) — khác dòng; PR merge sau rebase, giữ cả hai |
| `shared/domain/duongHoSo.ts` | mọi PR thêm tham số | Thêm khoá `viec` (additive) |
| `server/src/cases/cases.ts` | — | Một trường `performerUserId` trong `caseDetail` |
| `server/src/tests/run.ts`, `shared/domain/index.ts` | mọi PR | Chỉ thêm dòng đăng ký/export |

## Global Constraints

- **N-3 badge (mockup 17 b1):** B-1 một badge = một trạng thái ≤ 3 từ + số, tối đa 2 badge/dòng · B-2 việc là **tiêu đề
  dòng** (động từ + đối tượng), nút động từ ngắn · B-3 hạn ở dòng phụ/cột riêng, mờ `hạn CN 30/08`; quá hạn `⚠ quá hạn 15
  ngày` chữ đỏ không nền; hôm nay `hôm nay` vàng, không ⚠ · B-4 ⚠ **chỉ** quá hạn (G-4) · B-5 mỗi thông tin nói **một lần**
  trên một dòng/thẻ · B-6 bản đầy đủ vào tooltip · B-7 màu: xanh đang chạy, vàng chờ, xám thông tin, xanh lá xong, nền đỏ chỉ
  SOS 3/Chưa đạt, viền nét đứt = số tạm.
- **N-4 khuôn panel (mockup 15 §1):** ngăn phải 560px (`rong="hep"`), form bảng 720px (`rong="rong"`), 375px toàn màn ·
  đầu một dòng `Tiêu đề · Tên HV · Mã lớp` + ✕ · ngữ cảnh ≤ 1 dòng (≤ 2 badge + một mẩu chữ) · thân chia khối, tiêu đề khối
  chữ hoa nhỏ, luật dài vào ⓘ · nhãn **trên** ô, ô cao 34px, tối đa 2 ô/hàng khi thật ngắn · ≤ 4 nút chọn/hàng, nhiều hơn →
  danh sách dọc có một dòng nghĩa · chữ phụ ≤ 1 dòng ≤ 60 ký tự · chữ mẫu `Ví dụ: …` mờ, ngắn · **lỗi chỉ sau khi bấm nút
  chính** (hoặc rời ô), một dòng `Còn thiếu: …` trên chân canh phải · chân dính: trái Huỷ/Xoá (viền đỏ), phải nút phụ + **một**
  nút chính · chỉ thân cuộn · mở việc khác = **thay nội dung** + dòng `← Case Listening` (G-8) · sau lưu (§3.13): không đóng,
  khối Bằng chứng mở, chân thành `Xong`. Hộp giữa màn chỉ còn `ConfirmDialog`.
- **G-1…G-12 liên quan:** G-3 một dòng phụ · G-4 · G-5 bỏ `SectionNote` giải thích · G-6 ngày `dd/mm` (khác năm mới `dd/mm/yyyy`),
  tuần `W{n} {THÁNG}`, tuần học `W{n}/{tổng}` — chỉ qua `ngay`/`tuanLich`/`tuanKhoa` (`hienThiNgay.ts`), **bỏ `fmtDate`** ở mọi
  file chạm tới · G-7 tooltip cho viết tắt và ⋮ ⋯ ⓘ ▸ · G-8 · G-9 Bằng chứng Ctrl+V · G-11 375px không cuộn ngang trang.
- **Chữ (đặc tả 22/09 §2, THUAT_NGU):** `Case` viết hoa · HS → **HV** · kết quả PA **Tiến bộ rõ · Tiến bộ một phần · Không
  tiến bộ · Kém hơn** · lớp thường **Giữa khoá / Cuối khoá** (không `MT`), không "Normal", không mở câu bằng "Hãy", không
  "biện pháp" · `Ghi kết quả` (g3-056, thay "Cập nhật kết quả"/"Cập nhật PA") · `Hoàn thành Case` (g3-062) · `Ghi chú bàn giao`.
- **Giữ hành vi:** mọi phép kiểm cũ xanh — phép kiểm so **chữ** cũ thì sửa kỳ vọng sang chữ mới (cùng điều kiện, không xoá);
  số phép kiểm không giảm · giao kèo `data-pa-id={paId}` trên mục PA trong `CasePanel` giữ nguyên (NganCase dò nó) · props
  `QuickReport` mà `DongTinHieu.tsx:44` dùng (`open, onClose, studentId, studentName, signal, onDone`) giữ nguyên tên/kiểu —
  chỉ **thêm** prop tuỳ chọn.

## Quy trình nhanh (bắt buộc)

- Không rà từng Task bằng subagent. Tự code, `npm run check` sau **mỗi** Task (xanh, số phép kiểm ≥ mốc B), rồi commit
  `PR-UX3 (n): …`. **Chỉ một** lần `npm run check` chạy một lúc; treo → quét, tắt `run.js` cũ rồi chạy lại.
- Subagent (nếu buộc dùng): cùng model, **không Haiku**. Commit ghi đúng `Co-Authored-By` của **model thật** đang chạy.
- Không chụp ảnh từng Task. Bấm thử theo vai (QL=2, GVCN=7, GVBM=9) + 375px **một lần** ở Task 10, **ảnh thật** Playwright kênh
  Chrome, lưu `thiet-ke/anh/pr-ux3/`. Tắt mọi tiến trình node/vite (4417/5617) trước khi kết thúc.
- Không chạm Turso, không deploy. Gặp mã lệch hẳn kế hoạch → dừng, hỏi planning. Cuối PR: push, mở PR, báo planning.

## Giả định về UX0 (Task 0 đối chiếu, ghi bảng ánh xạ vào Nhật ký)

Kế hoạch UX0 chưa có khi soạn; dùng tên dự kiến. Tên thật khác → dùng tên thật, **không** đổi file UX0 trừ khi thiếu prop (thêm tuỳ chọn).
```tsx
// web/src/ui/KhungPanel.tsx
<KhungPanel open onClose tieuDe="Ghi kết quả PA" hocVien="Dương Ngọc Ánh" lop="MB-FOU 12" rong="hep" /* | "rong" */
  quayLai={{ nhan: 'Case Listening', onBam }}          // dòng "← …" trên đầu thân (thêm nếu UX0 chưa có)
  nguCanh={<>…≤ 2 Nhan + chữ</>} tabs={[{ key, nhan, luat? }]} tab onTab
  chan={{ huy?: () => void, xoa?: { nhan, onBam }, phu?: ReactNode,
          chinh: { nhan, onBam, busy?, form?: string /* id <form> */ }, conThieu?: string | null }}>
  <Khoi tieuDe="Vấn đề" luat="…ⓘ"><Truong nhan="Kỹ năng" batBuoc phu="…"> … </Truong><Hang2>…</Hang2></Khoi>
</KhungPanel>
// web/src/ui/Nhan.tsx: <Nhan tone="ok|bad|late|soon|doing|done|wait|muted" netDut? title?>…</Nhan>
// web/src/ui/HangNhom.tsx: <HangNhom mo onMo tieuDe cot /> · <HangCon>…</HangCon>
// shared/domain/display.ts: deadlineView(...) → { viec, han /* "hạn CN 30/08" */, quaHanNgay, tone, title }; <Han> vẽ theo đó
```

## Bảng Q — tự quyết

| Q | Câu hỏi | Chốt | Lý do |
|---|---|---|---|
| Q1 | `SkillBoard.tsx:654` "sai nhãn" | Theo `schema.sql:985-998` và `cases.ts:856`, `action_due` của PA học thuật **là** hạn ghi kết quả hằng tuần (Chủ nhật). Nhãn đúng là **"hạn ghi kết quả CN 30/08"** (mockup 15 §3). Cái sai là (a) `CasePanel.tsx:542` gọi nó "hạn làm", (b) `SkillBoard:654` đặt nó thành badge `Cập nhật kết quả · trước CN …` cạnh "Dự kiến kết thúc" (thành hai hạn), (c) `SkillBoard:423` còn gắn `followUntil` vào cùng nhãn | Một hạn một tên; khớp mockup 15 §3 và 17 b4 |
| Q2 | `followUntil` (hạn báo kết quả cả Case) | Không hiện khi Case có PA đang chạy (hạn PA đã nói). Chỉ hiện ở ngữ cảnh ngăn Case, một mẩu `hạn báo kết quả {ngày}`, khi **không** có PA chạy | B-5; mockup 15 §3 không còn dòng này |
| Q3 | Ghi kết quả từ hồ sơ HV | Không trải form trong trang: nút `Ghi kết quả` (SkillBoard, Việc cần làm) mở **ngăn Case ở view Ghi kết quả**. Việc cần làm: `href` nhóm `result` → `?case=&pa=&viec=ghi-ket-qua` | Mockup 15 §4 "VỊ TRÍ"; lỗi #10 lồng 3 khung |
| Q4 | Nút chính khi còn thiếu | Không mờ nữa: bấm → hiện `Còn thiếu: …` (một dòng trên chân), không gửi. Trước khi bấm không hiện gì | N-4 "lỗi chỉ sau khi bấm Lưu hoặc rời ô" |
| Q5 | Xin hỗ trợ QL | Thành lựa chọn thứ 5 trong danh sách dọc Quyết định; ô **`Cần Quản lý giúp gì`** bắt buộc (≥ 8 ký tự, gửi vào `decisionNote` như cũ — máy chủ không đổi). "Gửi cho" là một dòng chữ `Quản lý chi nhánh · nhận ở Việc cần làm`, **không** ô chọn QL (máy chủ chưa nhận người nhận) | Mockup 15 §5; không đổi API |
| Q6 | Tạo Case: "Phân loại vấn đề" | **Giữ** (máy chủ bắt buộc `primaryCode`), đặt ngay dưới Kỹ năng trong khối Vấn đề, dạng `<select>` (≥ 5 lựa chọn), gợi ý của lựa chọn vào `title` | Mockup 15 §2 bỏ sót; luật giữ |
| Q7 | Nhập bù: tuần thay ngày | `Từ tuần` → thứ Hai; `Đến tuần` → Chủ nhật, **cắt về hôm nay** nếu là tuần hiện tại (máy chủ chặn tương lai, `cases.ts:1162`). Mỗi PA đã áp dụng mặc định cùng khoảng, `Sửa` để đổi | Mockup 15 §2 phải |
| Q8 | Chuyển lớp: "Ngày hiệu lực" | Thành `Từ tuần` (tuần này → 8 tuần tới). Tuần này → không gửi `effectiveDate` (máy chủ lấy hôm nay, như cũ); tuần sau → thứ Hai | Không lùi ngày chuyển về quá khứ |
| Q9 | "Lưu ý bàn giao" (PR-LT Q13) | Đổi thành **`Ghi chú bàn giao`** | Mockup 15 §8 + THUAT_NGU g7-098 đứng trên đặc tả 22/09 |
| Q10 | ⋮ Hồ sơ HV | Thành **menu thả** (`ui/Menu.tsx`); mỗi mục mở thẳng panel của việc đó (bỏ ngăn "Quản lý học viên" + `← Chọn việc khác`). `Lộ trình` (FT) mở `StudentPlanPanel` như cũ | Mockup 15 §8 "mở thẳng panel" |
| Q11 | "Đề ra PA R ⚠ 18 ngày" ở Học viên & Lớp | Hiện `Đề ra PA R` **không** số ngày: danh sách chưa có hạn lập PA (cần thêm truy vấn máy chủ → ngoài phạm vi). Ghi "Chuyển cho" | Không thêm SQL ở đường `/hoc-vien-lop` |
| Q12 | Badge chấm của hộp lớp | `{n} bài chờ chấm` cho cả GV lẫn QL; câu cũ (`needScoresText`) vào `title` | Đặc tả N-3 đã chốt ("Badge hộp lớp: 9 bài chờ chấm") — thay câu "cần chủ SP chốt" ở mockup 17 #16 |
| Q13 | SOS tạm thời | Badge `SOS 2` **viền nét đứt**, tooltip `Tạm thời: 1/3 môn có điểm`; bỏ ⚠ ở `KetQuaDot` (không phải quá hạn). Chỉ đổi `attemptProgressView` + `hocVienLop.ts:96`; `standing.ts` (Rc2) giữ | Mockup 17 #19, B-4, B-7 |
| Q14 | Nhắc Ý thức (> 5 ngày) | Bỏ ⚠: `Chưa xử lý 9 ngày` (đầu khối), `9 ngày` (từng vi phạm), tab = chấm vàng + số. Câu vàng, không nền đỏ | Mockup 17 #24, W02 nhắc mềm |
| Q15 | Người làm mặc định ở Điều chỉnh | Giá trị ban đầu = người đang làm (`performerUserId` mới trong `caseDetail`, không có thì `{kieu:'ngoai', ten}`); "đổi người" = khác giá trị ban đầu. Bỏ `khongDoi` | Mockup 15 §5 |
| Q16 | Header ngăn Case có mã lớp? | `NganCase` nhận `lop?` từ nơi gọi (Hồ sơ HV biết lớp); nơi không biết thì bỏ phần lớp. Không thêm truy vấn | Tốc độ Turso |
| Q17 | Hàng lớn/nhỏ (N-2) | UX3 áp cho **SkillBoard** (b4). 7 chỗ còn lại của mockup 17 (a3): Task 0 kiểm UX0 đã làm chưa; chưa → "Chuyển cho" | Ngoài ranh giới file UX3 |
| Q18 | "Kết luận lộ trình" ở ⋮ HV lớp thường | Đã sửa ở PR-LT (`StudentManagePanel.tsx:114` `!ratio`); ảnh 09a chụp trước LT. UX3 giữ luật trong menu mới + phép kiểm nguồn | Mâu thuẫn ảnh ↔ mã |

## Task 0 · Worktree, mốc, đối chiếu UX0

- [ ] `git fetch origin`; kiểm UX0 đã ở `origin/main` (`git log origin/main --oneline | grep -i "ux0"`). Chưa → **dừng**, báo planning.
- [ ] `git worktree add .claude/worktrees/pr-ux3-panel-badge -b pr-ux3-panel-badge origin/main`; chép file kế hoạch này vào nhánh.
- [ ] Đọc `web/src/ui/KhungPanel.tsx`, `Nhan.tsx`, `HangNhom.tsx`, `display.ts` (deadlineView), `mywork.ts` bản UX0 → ghi
  **bảng ánh xạ tên** + mục mywork UX0 đã sửa (MT ở `contextLabel`? `placement`?) + 8 chỗ N-2 đã/ chưa áp vào Nhật ký.
- [ ] `npm ci` nếu cần; `npm run check` → mốc **B**. Commit `PR-UX3 (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Shared: chữ, badge, bộ chọn ngày/tuần (hàm thuần) + khung phép kiểm

**Files:** tạo `shared/domain/chonNgay.ts` (+ export `index.ts`); sửa `shared/domain/cases.ts:257-262, 902-915`,
`normal.ts:60`, `hocVienLop.ts:96, 134-155, 226-256`, `people.ts:222`, `display.ts:~180-186`, `hoSoHocVien.ts:62-86`,
`yThuc.ts:116-120, 225-238`; tạo `server/src/tests/panelUx3.tests.ts` (`runPanelUx3Tests(t)`, khung như `lenLop.tests.ts`),
đăng ký cuối `run.ts`.

**Produces:**
```ts
// chonNgay.ts — mọi nhãn qua ngay/tuanLich (G-6), không đọc đồng hồ trình duyệt
export type LuaChon = { giaTri: string; nhan: string; phu?: string };
export function dsNgayGan(homNay: string, soNgay: number): LuaChon[];      // 'Hôm nay, 14/09' · 'Hôm qua, 13/09' · 'Thứ Bảy, 12/09'
export function dsTuan(homNay: string, lui: number, toi: number): LuaChon[]; // giaTri = thứ Hai ISO; nhan 'W3 SEP'; phu '14/09 – 20/09'
export function cuoiTuan(thuHai: string, homNay?: string): string;          // Chủ nhật; có homNay thì min(Chủ nhật, homNay)
export function dsThang(homNay: string, soThang: number): LuaChon[];       // giaTri '2026-10'; nhan '10/2026'
export function nhanDotNgan(kind: string | null, attemptNo: number | null): string | null; // (normal.ts) mock→'MT2', progress→'Giữa khoá', final→'Cuối khoá'
export const PLAN_DECISION_NGAN: Record<PlanDecision, string>;  // Giữ nguyên · Điều chỉnh · Thay PA · Kết thúc PA · Xin hỗ trợ QL
export const PLAN_DECISION_NGHIA: Record<PlanDecision, string>; // "Tiếp tục PA này, hẹn ghi kết quả tuần sau" … (≤ 45 ký tự, mockup 15 §4)
export const NUT_LUU_KET_QUA: Record<PlanDecision, string>;     // Lưu kết quả · Lưu điều chỉnh · Thay PA · Kết thúc PA · Gửi Quản lý
export type ViecTiepTheo = { viec: string; han: string | null; quaHanNgay: number | null; tone: 'danger' | 'warn' | 'info'; title: string };
export type BadgeLop = { key: …; nhan: string; tone: 'danger' | 'warn' | 'info' | 'muted'; title?: string };
```
- `CASE_OUTCOME_LABEL` → `Tiến bộ rõ · Tiến bộ một phần · Không tiến bộ · Kém hơn` (khoá giữ nguyên — dữ liệu lưu mã).
- `viecTiepTheoCua`: nhập điểm → `viec: 'Nhập điểm L, R · Giữa khoá'`; `no_plan` → `Đề ra PA R` (sửa "Xác định nguyên nhân" — động
  từ sai nghĩa, mockup 17 #15); có `nextDue` → `Ghi kết quả L`, `han: 'CN 14/09'`, `quaHanNgay` từ `deadlineView` bản UX0;
  `title` = câu đầy đủ `Ghi kết quả PA L · trước CN 14/09 · quá hạn 3 ngày`.
- `badgeLop`: nhận `soBaiChoCham: number, phamViCham: WorkScope | null` thay `needScoresText` → `{n} bài chờ chấm` + `title =
  needScoresText(…)` (Q12); `het-khoa` → `{n} HV chờ xếp lớp` tone `warn`; `case` → `{n} Case mở` tone `muted`. Thứ tự, cắt 2 giữ.
- `hocVienLop.ts:96`: `sos: 'SOS 2'` + trường mới `sosTamThoi: boolean` (Q13).
- `attemptProgressView` (chưa đủ điểm, có SOS): ielts → `text: 'SOS 2'`; ratio → `Đạt 1/3 môn`; thêm `tamThoi: true`,
  `title: 'Tạm thời: 1/3 môn có điểm'` (kỹ năng với ielts). Các nhánh khác không đổi.
- `tienDoCase`: `text` → `Chưa có PA` · `1 PA · chưa có kết quả` · `2 PA · 1 có kết quả` · `2 PA · đủ kết quả`; `tiep.text`
  `PA tiếp`/`Cập nhật PA` → `Ghi kết quả PA`. Luật chọn `tiep` giữ.
- `yThuc.ts`: `message` bỏ `⚠ ` → `Chưa xử lý {n} vi phạm · cũ nhất {k} ngày`; `violationAgeLabel` → `{k} ngày` (không ⚠).
  `MEASURE_KIND_LABEL` "HS" → "HV" (3 nhãn, `yThuc.ts:116-120`).

**Phép kiểm (≥ 16, `panelUx3.tests.ts`):** `dsNgayGan` 3 nhãn đầu + không năm cùng năm · `dsTuan` qua tháng (W5 AUG → W1 SEP
đúng `tuanLich`) + qua năm có năm · `cuoiTuan` cắt về hôm nay · `dsThang` · `nhanDotNgan` 3 loại · `CASE_OUTCOME_LABEL` bằng
đúng bốn nhãn `FOLLOWUP_OUTCOME_LABEL` trừ "Chưa đủ dữ liệu" · `PLAN_DECISION_NGAN/NGHIA` đủ 5 khoá, `NGHIA` ≤ 45 ký tự ·
`viecTiepTheoCua` 3 nhánh (không chuỗi nào chứa "Cập nhật", "Xác định nguyên nhân") · `badgeLop` 3 nhãn mới + `title` ·
`attemptProgressView` tạm thời (ielts, ratio) · `tienDoCase` 4 dạng · `yThuc` message/ageLabel không `⚠`.
**Sửa kỳ vọng chữ cũ** (cùng điều kiện): `hocVienLop.tests.ts:109, 135-140, 190-193`, `hoSoHocVien.tests.ts:133-137, 199-218`,
`run.ts:7994-7995`, `yThuc.tests.ts:151, 222, 280-281, 901, 958, 980-982, 1196-1197`, `yThucGon.tests.ts:107` (ageLabel `'9 ngày'`).
Nơi gọi đổi kiểu: `DauTrangLop.tsx:57`, `StudentsPage.tsx:227` (truyền số), `BangHocVienLop.tsx:125`, `BangCanHoTro.tsx:65-81`
(tạm vẽ `v.viec`; vẽ đẹp ở Task 8). Commit `PR-UX3 (1): chữ, badge, bộ chọn ngày/tuần — hàm thuần`.

## Task 2 · Máy chủ: chữ việc, "Giữa khoá", việc xếp lớp, người làm PA

**Files:** `server/src/students/profile.ts:467-479`, `server/src/worklist/mywork.ts` (`contextLabel` dòng ~516, 583, 655, 814,
892, 951, 974, 1024; khối `placement` ~696-706; `href` nhóm `result` ~660), `server/src/yThuc/board.ts:88`,
`server/src/cases/cases.ts:~1455` (`caseDetail` interventions), `shared/domain/duongHoSo.ts:31-45` (+ hàm đọc tham số).

- `profile.ts`: `Làm PA {kn}` và `Cập nhật PA {kn}` (hai chỗ) → `Ghi kết quả PA {kn}`; `Đề ra PA cho {kn}` → `Đề ra PA {kn}`.
  Thứ tự ưu tiên không đổi. Phép kiểm `hoSoHocVien.tests.ts:133` sửa regex theo chữ mới.
- `mywork.ts`: `contextLabel: c.attempt_no ? \`MT${…}\` : 'Case'` → `nhanDotNgan(c.attempt_kind, c.attempt_no) ?? 'Case'`; câu SQL
  nào chưa lấy `a.kind` thì thêm `a.kind AS attempt_kind` vào **cùng** câu (không thêm câu). `placement`: `urgency: 'normal'`,
  `statusLabel: 'Chờ xếp lớp'`, không `overdueLabel`. `result`: `href: duongHoSoHocVien(sid, { caseId, paId: iv.id, viec: 'ghi-ket-qua' })`.
  (UX0 đã sửa mục nào → bỏ mục đó.)
- `board.ts:88`: `{n} HV có vi phạm chưa xử lý quá 5 ngày` (không ⚠).
- `cases.ts`: thêm `performerUserId: iv.performer_user_id ?? null` (Q15). Không thêm câu SQL.
- `duongHoSo.ts`: `ThamSoHoSo.viec?: 'ghi-ket-qua'` → `?viec=ghi-ket-qua`; `docThamSoHoSo` đọc lại (giá trị khác → bỏ).

**Phép kiểm (≥ 5):** việc Case của HV lớp thường (seed MB-FOU 12) có `contextLabel` `Giữa khoá`/`Cuối khoá`, không `/^MT\d/`;
FT vẫn `MT{n}` · việc `placement` không `urgency === 'overdue'`, `statusLabel === 'Chờ xếp lớp'` · việc `result` có `href` chứa
`viec=ghi-ket-qua&` … `pa=` · `caseDetail(...).interventions[0]` có khoá `performerUserId` · `duongHoSoHocVien` ↔ đọc lại `viec`.
Số câu SQL `/my-work` (tocDo) không tăng. Commit `PR-UX3 (2): máy chủ — chữ việc, Giữa khoá, việc xếp lớp, người làm PA`.

## Task 3 · Ngăn Case một panel (mockup 15 §3)

**Files:** `web/src/modules/students/NganCase.tsx` (viết lại), `web/src/modules/cases/CasePanel.tsx` (tách thân),
`CaseBoardPage.tsx:232, 247-249`, `IssueAnalysis.tsx:368-370`, `StudentDetailPage.tsx:133-140, 383-385`.

**Interfaces:**
```ts
export type ViewCase = { loai: 'case' } | { loai: 'ghi-ket-qua'; paId: number } | { loai: 'them-pa' }
  | { loai: 'hoan-thanh' } | { loai: 'tra-loi'; paId: number };
export function NganCase(p: { caseId: number; paId?: number | null; viec?: 'ghi-ket-qua' | 'them-pa' | 'hoan-thanh';
  hocVien?: string; lop?: string; onClose: () => void; onChanged?: () => void }): JSX.Element;
export function ThanCase(p: { data: CaseDetail; onViec: (v: ViewCase) => void }): JSX.Element; // chỉ thân, không vỏ
export function CasePanel({ caseId }: { caseId: number }): JSX.Element; // trang /hoc-thuat/case/:id: ThanCase + hàng nút mở NganCase
```
- `NganCase` tải `/cases/{id}` **một lần**, giữ `view`; `view` khác `case` render panel tương ứng (Task 4) với
  `quayLai={{ nhan: 'Case ' + kỹ năng, onBam: () => setView({ loai: 'case' }) }}` — **một** `KhungPanel` mở tại một thời điểm.
  Có `viec='ghi-ket-qua'` + `paId` → mở thẳng view Ghi kết quả. Dò `[data-pa-id]` + viền sáng 2 s giữ nguyên (view `case`).
- View `case`: `tieuDe = 'Case ' + categoryLabel ngắn` (`Case Listening`), `hocVien`, `lop`. **Ngữ cảnh:** `Nhan` trạng thái +
  `Nhan` SOS (≤ 2) + `mở 23/08 · Trần Ngọc Hà báo` (Q2: + `hạn báo kết quả …` khi không PA chạy); `Hệ thống tự đóng · …`
  thay trạng thái khi có. **Bỏ** `Lộ trình {seq}`, `đã kéo qua n lượt MT`, dòng `⚠ Quá hạn báo kết quả`.
- Thân (`ThanCase`): khối **Vấn đề** (tên đầy đủ, mô tả, `Nhóm nguyên nhân: …` một dòng, badge phân loại phụ/bối cảnh) · khối
  **Phương án · n** ⓘ: mỗi PA một thẻ không viền đậm — dòng 1 tên loại PA + `Nhan` trạng thái + phải `⚠ Quá hạn 15 ngày` (chỉ
  khi quá hạn); dòng 2 mô tả; dòng 3 `người · 24/08 → 14/09` + `hạn ghi kết quả CN 30/08` + nút `Ghi kết quả` (Q1). Mốc/quan
  sát giữ trong `▸ Lịch sử cập nhật (n)` thu gọn; `cập nhật trễ` → `ghi trễ {k} ngày` chữ mờ (mockup 17 #25). `data-pa-id`
  vẫn trên `<li>` PA · khối **Bằng chứng · n** (`BangChung`, G-9).
- Chân view `case`: phụ `+ Thêm PA` (`viewer.canEdit`), chính `Hoàn thành Case` (`canClose`); bị chặn → không mờ, bấm hiện
  `Còn thiếu: {closeBlockers[0]}`; `!canClose` → không có nút chính, ⓘ ở tiêu đề khối Phương án giữ câu quyền. Bỏ 2 `SectionNote`.
- `CaseBoardPage.tsx:247-249`, `IssueAnalysis.tsx:368-370`: `<NganCase caseId onClose />`; `CaseBoardPage:232` `Alert` mức độ →
  `<Nhan tone="soon">`. `StudentDetailPage`: truyền `lop={data.currentClass?.code}`, đọc `p.viec` (Task 2) vào `NganCase`.
- Xoá `ResultDialog`; `ActionDialog/OutcomeDialog/ApprovalDialog` chuyển thành panel ở Task 4 (commit này tạm giữ, gọi từ view).

**Phép kiểm (nguồn, `panelUx3.tests.ts`):** `CasePanel.tsx` còn `data-pa-id=` · không còn `<Modal` trong `CasePanel.tsx`,
`NganCase.tsx` · không `Lộ trình ${`, `fmtDate(`. Commit `PR-UX3 (3): ngăn Case một panel, đổi nội dung thay vì chồng`.

## Task 4 · Ghi kết quả PA + Điều chỉnh/Thay/Xin hỗ trợ + Thêm PA/Hoàn thành/Trả lời (mockup 15 §4, §5)

**Files:** `web/src/modules/cases/CapNhatTuan.tsx` (thành panel), `CasePanel.tsx:652-1022` (3 hộp thoại → panel),
`SkillBoard.tsx:7, 466-470, 628-637` (bỏ form trải trong trang).

**Produces:** `GhiKetQuaPanel({ pa, hocVien, lop, quayLai, onClose, onSaved })` (thay `CapNhatTuanForm`; `PaCanCapNhat` thêm
`performerUserId`), `ThemPaPanel`, `HoanThanhCasePanel`, `TraLoiDeXuatPanel` — cùng chữ ký `{ …, quayLai, onClose, onSaved }`.
- **Ghi kết quả PA** (`tieuDe`), ngữ cảnh `{tên PA} · hạn CN 30/08` + `⚠ quá hạn 15 ngày`. Khối **1 · Kết quả tuần này**: 4 nút
  `FOLLOWUP_OUTCOMES` trừ `insufficient` một hàng (375px lưới 2×2), dưới là nút chữ `Chưa có bài để so? Chưa đủ dữ liệu`;
  `Tiến triển *` `Ví dụ: nghe 1.0 vẫn sót số và tên riêng`; `Vấn đề còn tồn · không bắt buộc`. Khối **2 · Quyết định** ⓘ: danh
  sách dọc 5 dòng `PLAN_DECISION_NGAN` + dòng nghĩa `PLAN_DECISION_NGHIA`; dòng bị chặn mờ, nghĩa = lý do ngắn (`Cần kết quả
  Tiến bộ rõ`), bản đủ `decisionBlockedReason` ở `title`. Chọn Điều chỉnh/Thay/Xin hỗ trợ → khối con thụt 12px vạch trái
  **ngay dưới dòng đó**:
  - Điều chỉnh: `Nội dung PA` · `Người làm` (`ChonNguoi`, giá trị đầu = người hiện tại, Q15) + `Đến` (`ChonTuan moc="cuoi"`,
    gửi `followupDue` Chủ nhật, ≥ ngày ghi) **2 ô một hàng** · `Lý do điều chỉnh *` · chữ phụ `Phải đổi ít nhất một trong ba ô trên`.
  - Thay PA: `PA mới *` (select, nhóm "Cần QL duyệt" ghi `· cần QL duyệt` trong nhãn) · `Nội dung *` (textarea) · `Người làm` +
    `Lùi cái gì` (chỉ `reschedule_mt`) · `Lý do thay *`.
  - Xin hỗ trợ QL: `Cần Quản lý giúp gì *` + dòng `Gửi Quản lý chi nhánh · nhận ở Việc cần làm` (Q5).
  Khối **3 · Ghi chú** (không bắt buộc; ẩn khi Điều chỉnh/Thay vì đã có ô lý do) + `Ngày ghi: hôm nay, 14/09 · Đổi` →
  `ChonNgayGan soNgay={14}`; Kết thúc PA thêm `Ngày kết thúc` cùng kiểu. Chân: Huỷ · chính `NUT_LUU_KET_QUA[decision] ?? 'Lưu
  kết quả'`, `conThieu` (Q4) — **chuỗi `missing` hiện có giữ nguyên luật**, chỉ đổi cách hiện (`Còn thiếu: Tiến triển · Lý do
  điều chỉnh`: gom nhãn ô thiếu thay câu dài). Lưu xong → `onSaved` → NganCase về view `case` + nạp lại.
- **Thêm PA** (`ActionDialog`), **Hoàn thành Case** (`OutcomeDialog`: 4 nút `CASE_OUTCOME_LABEL` mới + `Vì sao kết luận vậy *`
  `Ví dụ: MT3 Listening lên 6.0`; `SectionNote` "Hoàn thành KHÔNG phải là xoá…" → ⓘ), **Trả lời đề xuất** (`ApprovalDialog`):
  cùng khuôn, cùng API, chữ mẫu `Ví dụ: …` ngắn.
- `SkillBoard`: bỏ `CapNhatTuanForm` trong `KhoiPhuongAn`, `ActionDialog/OutcomeDialog` trong `TheCase` → gọi
  `onMoCase(caseId, { viec, paId })` (Task 5 nối).

**Phép kiểm (nguồn):** `CapNhatTuan.tsx`, `CasePanel.tsx` không `<Modal`, `type="date"`, `khongDoi=`, `Xin hỗ trợ từ Quản lý`;
`CASE_OUTCOME_LABEL` là nguồn duy nhất của 4 nút Hoàn thành. Máy chủ: phép kiểm `/interventions/:id/result` cũ xanh nguyên.
Commit `PR-UX3 (4): Ghi kết quả PA, Điều chỉnh/Thay/Xin hỗ trợ, Thêm PA, Hoàn thành Case trong ngăn Case`.

## Task 5 · Hồ sơ HV › Học thuật (mockup 17 b4) + đầu hồ sơ + KetQuaDot

**Files:** `web/src/modules/cases/SkillBoard.tsx` (vẽ lại `SkillRow` 161-245, `TheCase` 278-475, `KhoiPhuongAn` 489-640,
`PlanDue` 648-657, `nextStepOf` 764-781), `StudentDetailPage.tsx:~293` (truyền `onMoCase` vào `<SkillBoard>`), `:430-460` (ô Stat),
`web/src/ui/KetQuaDot.tsx:47`.

- Bảng 4 cột `Kỹ năng · Gần nhất · Case · Việc tiếp`, tiêu đề cột **một lần**. Hàng kỹ năng = `HangNhom` (hàng lớn): tên +
  `Trend`, ô điểm (bỏ `2026` — `tuanLich`), cột Case `{tên Case}` + **một** `Nhan` trạng thái, cột Việc tiếp `nextStepOf`:
  `Ghi kết quả PA` / `Đề ra PA` / `Xác minh SOS` / `Chờ QL trả lời` + dòng dưới `⚠ quá hạn 15 ngày` (đỏ) hoặc `hạn CN 30/08`
  (mờ) — **đây là chỗ duy nhất nói quá hạn** của kỹ năng.
- Mở ra: hàng con `HangCon` (thụt 16px, nền tối). Mỗi Case một hàng con `Case · {tên}` (không khung) + `{n PA · …}`
  (`tienDoCase.text`) + nút `Mở Case`; khối SOS chờ nguyên nhân / Không cần theo dõi / PA gợi ý (`CaseSosControls`) **giữ tại
  chỗ** (không phải form panel). Mỗi PA đang chạy một hàng con: `PA · {loại}` · mô tả + `người · 24/08 → 14/09` · `hạn CN
  30/08` (hạn gốc, **không** lặp ⚠) + nút `Ghi kết quả` → `onMoCase(caseId, { viec: 'ghi-ket-qua', paId })`. Bấm hàng PA →
  `onMoCase(caseId, { paId })`. PA đã xong: `▸ n PA đã xong`. Bỏ badge `Đang xử lý` thứ hai ở đầu thẻ, bỏ chip `Han` 423,
  `PlanDue` (Q1), lịch sử/Bằng chứng PA tại chỗ (đã ở ngăn Case). `+ Thêm PA`, `Hoàn thành Case` → ngăn Case.
- Ô Stat `Việc cần làm tiếp`: `value` chữ mới (Task 2); `sub` = `⚠ quá hạn {n} ngày` hoặc `hạn {ngay(due)}` (mockup 17 #22).
- `KetQuaDot`: bỏ `⚠` khi `tamThoi`; viền nét đứt + `title` (Q13).

**Phép kiểm (nguồn):** `SkillBoard.tsx` không `CapNhatTuanForm`, `ActionDialog`, `OutcomeDialog`, `loai="cap-nhat-pa"`,
`fmtDate(`, `Cập nhật PA`; `KetQuaDot.tsx` không `'⚠'`. Commit `PR-UX3 (5): bảng kỹ năng hàng lớn/nhỏ, một hạn một lần, mở ngăn Case`.

## Task 6 · Tạo Case (mockup 15 §2) — kể cả nhập bù

**Files:** `web/src/modules/cases/QuickReport.tsx` (vỏ + bố cục, giữ luật `submit`/`submitBackfill`/`send*`); tạo
`web/src/ui/ChonNgay.tsx` (`ChonNgayGan`, `ChonTuan`, `ChonThang` — `<select className="field">` từ `chonNgay.ts`); nơi gọi thêm
`lop`: `StudentDetailPage.tsx:372-380`, `thaoTacDongHocVien.tsx:54`, `ClassOverviewPage.tsx:102`.

- Props giữ nguyên, **thêm** `lop?: string`. `KhungPanel rong="hep" tieuDe="Tạo Case"` (tín hiệu: `Xác minh SOS {kỹ năng}`;
  lớp thường có tín hiệu: `Tạo Case {nhãn}`) · `hocVien` · `lop`. Tab `Đang gặp vấn đề | Đã xong từ trước` ⓘ (không khi có tín hiệu).
- Khối **Vấn đề**: `Học viên *` (mở từ lớp: ô chọn đầu tiên; mở từ HV: `Tên · mã` + không đổi) · `Kỹ năng *` nút một hàng
  (L R W S / L R W1 W2 S chia đều) — chưa chọn HV: ô mờ, không chữ "Chọn học viên trước." · `Phân loại vấn đề *` select (Q6) ·
  `Mức độ *` ⓘ (2 nút, chỉ tab 1) · `Tên Case *` `Ví dụ: Reading — sai dạng True/False/Not Given` · `Mô tả và dẫn chứng *`
  `Ví dụ: Giữa khoá sai 4/5 câu Not Given`, chữ phụ `Sai ở đâu, bài hay buổi nào`. Điểm tín hiệu thành ngữ cảnh (`Điểm 26/40`).
- Khối **Theo dõi** (tab 1): `Bắt đầu theo dõi hôm nay, 14/09 · Đổi ngày` → `ChonNgayGan soNgay={30}` (gửi `detectedAt`).
- Tab 2 khối **Đã làm gì**: `Từ tuần *` + `Đến tuần *` 2 ô một hàng (Q7) · mỗi PA đã áp dụng một dòng gọn `mô tả · người ·
  W1 AUG → W3 AUG · Sửa` (Sửa mở 3 ô tại chỗ; lỗi dòng dưới dòng) · `+ Thêm PA đã áp dụng`. Khối **Kết quả**: `Kết quả cuối *`
  4 nút (nhãn mới) · `+ Điểm chi tiết theo kỹ năng` (giữ) · `Vì sao kết luận vậy *` `Ví dụ: MT3 Listening lên 6.0`.
- Khối **Bằng chứng**: một dòng `Ảnh, tệp, liên kết — thêm được ngay sau khi tạo` (bỏ câu lạc dòng 393). Sau lưu: thân =
  `✓ Đã lưu Case «…»` + `BangChung`, chân `Xong` (giữ `daLuu`). Trùng Case: khối vàng một dòng + 2 nút, **trong thân**.
- Toast lỗi kiểm trước khi gửi (`toast.push('error', …)` dòng 194-272) → `conThieu` (Q4); lỗi máy chủ vẫn toast. Chân: Huỷ ·
  `Tạo Case` / `Ghi lại Case đã xong`. Bỏ mọi `hint` 2 dòng và câu "Hệ thống chỉ đọc được con số…".

**Phép kiểm (nguồn):** chữ ký `QuickReport({ open, onClose, studentId, studentName, cycleId, onDone, signal, students,
onPickStudent, lop })` đủ khoá cũ · không `<Modal`, `type="date"`, `toast.push('error', 'Đặt tên` · placeholder hợp luật (Task 10
danh sách). Commit `PR-UX3 (6): Tạo Case và nhập bù theo khuôn panel, tuần W4 SEP`.

## Task 7 · Ý thức: Ghi nhận vi phạm, Phương án xử lý (mockup 15 §6, §7) + badge nhắc

**Files:** `web/src/modules/yThuc/RecordViolationPanel.tsx`, `PhuongAnPanel.tsx`, `CreateMeasurePanel.tsx`,
`ConfirmMeasurePanel.tsx`, `XemPhuongAnPanel.tsx`, `ClassYThucCard.tsx:179, 259, 288`, `StudentYThucSection.tsx:122-125, 174`,
`web/src/modules/classes/CanhBaoYThuc.tsx:10`, `web/src/ui/HangTab.tsx:24`.

- **Ghi nhận vi phạm** (`KhungPanel hep`): khối Vi phạm — (`Học viên *` khi mở từ tab) · `Ngày *` (`ChonNgayGan`) + `Môn`
  2 ô một hàng, chữ phụ `Tự điền môn bạn dạy lớp này` (giữ `defaultSkill`, V04) · `Nhóm *` 5 nút → danh sách 2 hàng
  (≤ 4/hàng) · `Mô tả *` `Ví dụ: không nộp bài Reading buổi 12/09` · cảnh báo trùng **một dòng vàng** `Đã có vi phạm BTVN
  của em ngày 12/09 · Xem` (không ⚠) · khối `Bằng chứng · không bắt buộc`. Câu `Mô tả cần ít nhất 10 ký tự` chỉ qua `conThieu`.
  Toast `Hoàn tác` 10 s giữ. Sửa vi phạm: `tieuDe="Sửa vi phạm"`, chân trái `Xoá` viền đỏ.
- **PA xử lý** (`PhuongAnPanel`): ngữ cảnh `Nhan Đang chuẩn bị` + `tạo 04/09 · {người}` · khối Phương án: `Loại *` (select) +
  `Phụ trách` 2 ô một hàng (bỏ "Không đổi · hiện: …" — giá trị đầu là người hiện tại) · `Nội dung` · khối `Vi phạm được xử lý ·
  n`: mỗi vi phạm 2 dòng (mô tả 1 dòng cắt "…" + `title`; `10/09 · Thái độ / hành vi` mờ) + ô tích · `▸ Thêm vi phạm chưa xử
  lý (n)` và `▸ Đã xử lý ở PA khác (n)` **thu gọn** · khối Bằng chứng. Chân: `Xoá PA` (trái, viền đỏ, `ConfirmDialog`) · phụ
  `Lưu` · chính `Đã thực hiện` (→ `ConfirmMeasurePanel`, cùng vỏ, thay nội dung qua `panelYThuc` như cũ).
- **Tạo PA** (`CreateMeasurePanel`): cùng khuôn; `Loại *` = select xếp nhẹ → nặng, mức khoá `disabled` + lý do ở `title` (bỏ
  `[khoá]`, `(B05)`, radio dọc); `SectionNote` hai nút → ⓘ tiêu đề khối; chân `Huỷ | Lưu nháp | Đã làm luôn`.
- `ConfirmMeasurePanel`, `XemPhuongAnPanel`: vỏ `KhungPanel`, `ngay()` thay `fmtDate`, hint "HS / PH" → "HV / PH".
- Badge nhắc (Q14): `ClassYThucCard:179`, `StudentYThucSection:174` → câu vàng mới (không `.replace(/^⚠…/)`); dòng vi phạm
  `· {k} ngày`; `CanhBaoYThuc` → `{n} vi phạm` tone `soon`; `HangTab` `canhBao` → chấm vàng `●` + `aria-label` (G-7).

**Phép kiểm (nguồn):** 5 file panel Ý thức không `<Modal`, `[khoá]`, `(B05)`, `\bHS\b`, `SectionNote`, `fmtDate(`;
`HangTab.tsx`, `CanhBaoYThuc.tsx` không `⚠`. Phép kiểm máy chủ Ý thức cũ xanh (chữ đã sửa ở Task 1).
Commit `PR-UX3 (7): Ghi nhận vi phạm, Phương án xử lý, Tạo PA theo khuôn; nhắc Ý thức không ⚠`.

## Task 8 · Học viên & Lớp: Chuyển lớp, Lộ trình tiếp theo, ⋮ Hồ sơ HV, Sửa phân công, badge hộp lớp

**Files:** `web/src/modules/students/ChuyenLopPanel.tsx`, `LoTrinhTiepPanel.tsx`, `StudentManagePanel.tsx`,
`StudentDetailPage.tsx:~225-232, 387-398`, `web/src/modules/classes/TeacherAssignPanel.tsx`, `thaoTacDongHocVien.tsx:54-62`,
`BangHocVienLop.tsx:125-135`, `BangCanHoTro.tsx:65-81`, `DauTrangLop.tsx:52-60`, `StudentsPage.tsx:214-235`.

- **Chuyển lớp** (`KhungPanel hep`, gộp `ChuyenLopForm` vào panel — không còn dùng trong ngăn khác): khối **Lớp mới** —
  `Chi nhánh *` + `Từ tuần *` (`ChonTuan lui={0} toi={8}`, Q8) 2 ô một hàng · `Lớp *` `HD-FOU 06 · Foundation · W3/8 · GVCN …`
  · `Lý do *` 4 nút một hàng (`Khác` mở ô) · đổi chi nhánh: một dòng thông báo · sang FT: `Mục tiêu band *` + `Tháng dự kiến thi`
  (`ChonThang`) 2 ô một hàng. Khối **Bàn giao** ⓘ: `Ghi chú bàn giao *` (Q9) + ô tích `Không có lưu ý` (ẩn khi còn Case, luật
  S1 giữ) · `Case đang mở · n`: mỗi Case một dòng `Listening · 1 PA đang làm → ` + `ChonNguoi` điền sẵn gợi ý, chữ phụ `GV
  Listening lớp mới`. Chân `Huỷ | Chuyển lớp` → `ConfirmDialog` một câu `Chuyển {tên} sang {mã lớp} từ {W4 SEP}?` → gửi.
  Toast lỗi kiểm trước → `conThieu`. Bỏ `SectionNote`/ghi chú dev.
- **Lộ trình tiếp theo** (`hep`): khối **Hướng đi** 6 lựa chọn **danh sách dọc** (`nhanHuong` dạng đầy đủ + một dòng nghĩa) ·
  khối **Chi tiết**: `Lớp dự kiến` · FT: `Mục tiêu band` + `Tháng dự kiến thi` 2 ô một hàng · `Ghi chú`. Câu `Chỉ là dự định,
  chưa đổi lớp.` vào ⓘ. Chân `Huỷ | Lưu`.
- **⋮ Hồ sơ HV** (Q10): `StudentDetailPage` thay nút ⋮ (dòng ~229) bằng `<Menu label="⋮" items={mucQuanLyHocVien(…)}>`;
  `StudentManagePanel.tsx` export `mucQuanLyHocVien({ canEdit, lopHoc, cycle, status }): { key: Job; nhan: string }[]` (**cùng
  điều kiện hiện tại** dòng 86-131, gồm `Kết luận lộ trình` chỉ `!ratio`, Q18) và `StudentManagePanel({ viec: Job, … })` = một
  `KhungPanel` cho đúng việc đó (bỏ `job='menu'`, `MenuItem`, `← Chọn việc khác`, `SectionNote` dòng 88-91). Form con
  (`InfoForm`, `CycleForm`, `TrangThaiForm`, `LuuTruForm`) giữ luật; nút gửi chuyển ra chân bằng `<form id>` +
  `chan.chinh.form`. `chuyen-lop`/`lo-trinh-tiep` mở `ChuyenLopPanel`/`LoTrinhTiepPanel`; `Lộ trình` (FT) mở `StudentPlanPanel`.
  Không có quyền nào → không hiện ⋮.
- **Sửa phân công GV** (`hep`, `tieuDe="Sửa phân công"`, `lop`): khối `GVCN` · khối `Giáo viên bộ môn` ⓘ (`Chỉ nhập điểm môn
  mình được phân công`): mỗi môn nhãn trên + chip tên × + `+ Thêm giáo viên` (luật/API giữ) · `▸ Đã từng dạy lớp này` thu gọn
  cuối · bỏ 2 `SectionNote`. Chân `Huỷ | Lưu` (nếu hiện lưu từng thao tác thì chân chỉ `Xong`).
- **Badge hộp lớp** (Task 1): `DauTrangLop`, `StudentsPage` truyền `soBaiChoCham`/`phamViCham`; `Nhan` có `title`.
  `BangHocVienLop:125` cột Việc tiếp theo: mỗi việc **một dòng chữ không khung** `{viec}` + `⚠ {n} ngày` đỏ hoặc ` · {han}` mờ,
  `title` đầy đủ; tối đa 2 dòng + `+n việc`. `BangCanHoTro:81` cùng cách. Cột Kết quả: `SOS 2` nét đứt khi `sosTamThoi`.

**Phép kiểm (≥ 3 + nguồn):** `mucQuanLyHocVien` — HV lớp thường (GVCN) có `lo-trinh-tiep`, `chuyen-lop`, **không** `outcome`;
HV FT (QL) có `outcome`; GVBM không mục nào. Nguồn: 4 panel không `<Modal`, `type="date"`, `type="month"`, `SectionNote`,
`Lưu ý bàn giao`, `← Chọn việc khác`. Commit `PR-UX3 (8): Chuyển lớp, Lộ trình tiếp theo, menu ⋮, Sửa phân công, badge hộp lớp`.

## Task 9 · (TUỲ CHỌN — chỉ khi Task 0–8 xanh và còn thời gian) Thêm HV hàng loạt, vỏ Chuyển tiếp lớp

**Files:** `web/src/modules/students/IntakePanel.tsx`, `web/src/modules/classes/TransitionPanel.tsx:145`.
- **Thêm HV hàng loạt** `KhungPanel rong="rong"`: bước **1 · Dán** — `Lớp` + `Tuần bắt đầu` (`ChonTuan`, W4 JUL) 2 ô một hàng,
  ô dán, `Định dạng ngày sinh` · bước **2 · Xem lại** — bảng `table-layout: fixed` (Họ tên 40% · Ngày sinh · OVR · Tuần), lỗi
  **chỉ sau khi bấm `Đọc`**; 375px mỗi HV một thẻ. Chân `Huỷ | Quay lại | Thêm {n} HV`. Bỏ 3 dòng ghi chú dev. API giữ.
- **Chuyển tiếp lớp**: chỉ đổi vỏ `Drawer` → `KhungPanel rong="rong"`, bỏ ghi chú dev đầu, `Thời điểm chuyển` → `ChonTuan`.
Không làm → ghi "Chuyển cho" trong thân PR. Commit `PR-UX3 (9): Thêm HV hàng loạt hai bước; vỏ Chuyển tiếp lớp`.

## Task 10 · Phép kiểm nguồn gom, bấm thử theo vai + 375px (một lần), đẩy PR

- [ ] `panelUx3.tests.ts` khối quét **một lần** danh sách `PANEL_UX3` = `cases/{QuickReport,CasePanel,CapNhatTuan,SkillBoard}.tsx`,
  `students/{NganCase,ChuyenLopPanel,LoTrinhTiepPanel,StudentManagePanel}.tsx`, `yThuc/{RecordViolationPanel,PhuongAnPanel,
  CreateMeasurePanel,ConfirmMeasurePanel,XemPhuongAnPanel}.tsx`, `classes/TeacherAssignPanel.tsx` (+ Task 9 nếu làm). Sau
  `boChuThich` (như `hoSoHocVien.tests.ts:32`): không `<Modal`, `<Drawer`, `type="date"`, `type="month"`, `max-w-`,
  `SectionNote`, `fmtDate(`, `(B05)`, `[khoá]`, `/\bHS\b/`, `Lộ trình \${`, `Đã tốt hơn hẳn`, `Cập nhật kết quả`; mọi
  `placeholder="…"` khớp `/^(Ví dụ: .{1,45}|Gõ .*|Chọn .*|Tìm .*)$/`.
- [ ] Máy chủ thử (nhớ "máy chủ dev trong worktree"): trong worktree `npm run seed` → `PORT=4417 node dist-server/server/src/index.js`
  (nền) → file Vite **tạm** ở gốc worktree (`port: 5617, strictPort`, proxy `/api` → `127.0.0.1:4417`, alias `@shared`) →
  `npx vite --config <file>`; Playwright kênh Chrome (`npm install --no-save playwright`); đăng nhập `POST /api/demo/session { userId }`.
- [ ] Kịch bản (ảnh `thiet-ke/anh/pr-ux3/NN-ten-{1440|375}.png`):
  1. **GVCN (7)** · Hồ sơ HV Dương Ngọc Ánh › Học thuật: hàng Listening hàng lớn, một hạn một lần (`⚠ quá hạn … ngày` ở hàng kỹ
     năng, `hạn CN 30/08` ở hàng PA), không năm `2026`, `Đang xử lý` một lần; ô đầu `Ghi kết quả PA Listening`.
  2. Bấm `Ghi kết quả` hàng PA → **một** ngăn (không ✕ thứ hai), `← Case Listening`; chọn `Điều chỉnh` → khối con dưới dòng,
     Người làm điền sẵn; bấm Lưu khi trống → `Còn thiếu: Tiến triển · Lý do điều chỉnh`; lưu → về view Case. `Xin hỗ trợ QL`
     → ô `Cần Quản lý giúp gì *`. Hành trình › bấm thanh PA → ngăn Case cuộn tới PA (giao kèo `data-pa-id`).
  3. `+ Case` từ hồ sơ: tiêu đề `Tạo Case · Dương Ngọc Ánh · MB-FOU 12`, không lỗi trước khi gõ; tab `Đã xong từ trước`: tuần
     `W1 AUG`, kết quả 4 chữ mới, chân không cuộn mất ở 375. Tổng quan › tín hiệu SOS › `Tạo Case` vẫn điền sẵn (DongTinHieu).
  4. **GVCN** · Hồ sơ lớp MB-FOU 12: ⋯ dòng HV › `Ghi nhận vi phạm` (Ngày `Hôm nay, 14/09`, Môn tự điền) · tab Ý thức › mở PA xử
     lý (2 dòng/vi phạm, thu gọn thêm vi phạm) · `Tạo phương án` (select, không `[khoá]`) · nhắc không ⚠, tab chấm vàng.
  5. **GVCN** · ⋮ Hồ sơ HV lớp thường: menu thả, **không** `Kết luận lộ trình`; `Chuyển lớp` mở thẳng panel (Từ tuần `W4 SEP`,
     `Ghi chú bàn giao`, Xác nhận một câu); `Lộ trình tiếp theo` danh sách dọc.
  6. **QL (2)** · Học viên & Lớp: badge `9 bài chờ chấm` (tooltip câu cũ), `3 Case mở` xám, `n HV chờ xếp lớp`; cột Việc tiếp theo
     `Đề ra PA R`, `Ghi kết quả L · CN 14/09`; `SOS 2` nét đứt. Tổng quan › Việc cần làm: dòng Case lớp thường ghi `Giữa khoá`,
     `Xếp lớp tiếp theo` không ⚠; `Ghi kết quả` mở ngăn Case đúng view. Hồ sơ lớp › ⋮ › `Sửa phân công` theo khuôn.
  7. **GVBM (9)**: ngăn Case môn không dạy — không nút chính, ⓘ nói quyền; không ⋮ ở hồ sơ HV.
  8. **375px:** kịch bản 2, 3 (cả hai tab), 4 (vi phạm, PA xử lý), 5 (Chuyển lớp) — toàn màn, đầu/chân dính, chỉ thân cuộn,
     4 nút kết quả lưới 2×2, không cuộn ngang trang.
- [ ] Sửa lỗi bắt được (commit riêng `PR-UX3 (10a): …`). Dọn file Playwright/Vite tạm; tắt 4417/5617; quét `run.js` treo.
- [ ] `CODE_MAP.md`: thêm `NganCase` views, `ChonNgay.tsx`, `chonNgay.ts`, `panelUx3.tests.ts`. `npm run check` cuối (≥ B + 40).
  Rebase `origin/main` nếu PR khác đã merge (gỡ theo bảng Chồng file).
- [ ] Push, mở PR `PR-UX3: panel Học viên & Lớp theo khuôn chung + badge còn lại` — thân: tóm tắt theo Task, bảng Q, ảnh,
  **"KHÔNG migrate"**, khối mywork đã sửa, "Chuyển cho", dòng cuối `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  Báo planning (không tự merge, không tự rà).

---

## Mâu thuẫn nguồn ↔ mã thật

1. **`SkillBoard.tsx:654`**: đặc tả §3 gọi `actionDue` là "hạn thực hiện PA"; schema/`cases.ts:856` nói với PA học thuật nó
   **là** hạn cập nhật Chủ nhật → sửa nhãn ở `CasePanel.tsx:542` ("hạn làm") và bỏ hạn trùng ở SkillBoard (Q1).
2. **"Kết luận lộ trình" ở ⋮ HV lớp thường**: đã sửa ở PR-LT (`StudentManagePanel.tsx:114`); ảnh 09a chụp từ `7e6585b` trước LT (Q18).
3. **"Lộ trình tiếp theo chưa có ở ⋯"** (mockup 15 #12, §9): đã có từ PR-LT (`thaoTacDongHocVien.tsx:58`, `LoTrinhTiepPanel.tsx`).
4. **Mockup 15 §2 bỏ "Phân loại vấn đề"** nhưng máy chủ bắt buộc `primaryCode` → giữ (Q6).
5. **"MT1" ở dòng việc lớp thường**: mockup 17 #13 trỏ `mywork.ts:305-308` (khối tín hiệu — **đã** dùng `ATTEMPT_KIND_SHORT`, dòng
   310-314); lỗi thật ở 8 chỗ `contextLabel` khác (Case/PA/nhập điểm) → Task 2.
6. **Mockup 17 #16 "cần chủ SP chốt"** — đặc tả N-3 đã chốt `9 bài chờ chấm` (Q12).
7. **Xin hỗ trợ "Gửi cho: {QL} ▾"** (mockup 15 §5): máy chủ `ask_manager` (`cases.ts:2943`) không nhận người nhận → chỉ hiện chữ (Q5).
8. **"Đề ra PA R ⚠ 18 ngày"** (mockup 17 b5): danh sách `/hoc-vien-lop` không có hạn lập PA (`next_due` chỉ từ PA, `cases.ts:1768`) (Q11).
9. **V04 "Môn — để trống —"**: `RecordViolationPanel.tsx:86-89` đã tự điền `defaultSkill` (YT2); UX3 chỉ giữ + kiểm ở Task 10.
10. Mockup 15 §1 đặt tên `web/src/ui/Panel.tsx`; bối cảnh chung đặt `KhungPanel.tsx` → theo UX0 thật (Task 0).

## Chuyển cho (ghi vào thân PR)

- **Planning / UX0:** N-2 hàng lớn/nhỏ ở 7 chỗ còn lại mockup 17 (a3) nếu UX0 chưa áp (Học viên & Lớp hộp lớp, Việc cần làm,
  BranchPulse, Phân tích lớp, Ý thức theo HV, Phối hợp SOS, DongThoiGian).
- **Planning:** hạn lập PA cho cột Việc tiếp theo ở Học viên & Lớp (Q11) — cần một cột/truy vấn gộp ở `danhSachHocVienLop`.
- **UX5:** `shared/domain/hanhTrinh.ts:160` / `HanhTrinh.tsx:337` (mockup 17 #23).
- **UX1/Z2c:** mockup 17 #4 ở `ScoreEntry.tsx:644, 649`, `ChamDiemPage.tsx:194`.
- **PR sau:** vỏ các ngăn chưa thuộc phạm vi: `StudentPlanPanel`, `ClassCreatePanel`, `ClassProgressPanel`, `SuaThongTinLopPanel`
  (và Task 9 nếu bỏ); `shared/domain/sos.ts:100-104` + `MEETING_KINDS` còn "HS" (chuỗi lưu DB — cần migrate chữ, không làm ở đây).
- **Planning / UX0 / PR sau:** N-2 hàng lớn/nhỏ còn lại của mockup 17 (a3): Ý thức theo HV (`ClassYThucCard`), Phối hợp SOS (`PhoiHopSosSection` + `DongThoiGian`), BranchPulse, Phân tích (UX4). UX3 chỉ áp SkillBoard.
- **PR sau (Task 9):** `IntakePanel` (Thêm HV hàng loạt hai bước, `rong`) và `TransitionPanel` (vỏ `Drawer` → `KhungPanel`, `ChonTuan`) — chưa làm.

## Nhật ký

| Ngày | Task | Ghi |
|---|---|---|
| 23/09 | 0 | Worktree `pr-ux3-panel-badge` từ `origin/main` d0462b0 (UX0 #89 đã merge). Mốc **B = 1186** phép (+20 tốc độ). Session code: Sonnet 5 (không subagent). **Bảng ánh xạ tên UX0 ↔ kế hoạch:** `KhungPanel` **không có `open`** (gắn = mở; đóng = `onDong`) · `nguCanh` → **`ngCanh`** · `quayLai={{ nhan, onBam }}` → **`{ nhan, onClick }`** · `tabs` là `ReactNode` (dùng `HangTab`) · `chan.chinh` là **`ReactNode`** (tự vẽ nút; không `busy`/`form`) · `chan.huy = { nhan?, onClick }` (nút Huỷ luôn có, mặc định đóng) · `chan.xoa = { onClick, nhan? }` · `chan.conThieu` là **`string[]`** (gom nhãn) · `Khoi tieuDe luat` · `Truong nhan batBuoc tuyChon phu loi as` · `Hang2` · `Nhan` (`tone`: ok/done/bad/soon/doing/wait/muted, `dut`, `title`, `onClick`) + `QuaHan ngay gon` (không có `late`) · `HangNhom` = `<tr>` (`mo onMo nhan tieuDe soCotDau`) + `HangCon` + `KhoiNhom` · `deadlineView` trả `{ text, tone: neutral|waiting|overdue, daysOverdue, quaHan, homNay, hen, viec, han, title }` (không `quaHanNgay`/`tone` danger). Token màu ở `index.css`/`mauNghia.ts`: `done` = **xám** (mockup 18), xanh lá chỉ cho kết quả `ok`. **mywork UX0 đã sửa:** `nhanDot()` (Giữa khoá/Cuối khoá, 5 SELECT có `a.kind AS attempt_kind`), `placement`/`next_step` không còn `overdue` + `Chờ xếp lớp`, `overdueLabel`/`lateText`/`GROUP_META.overdue` xoá → Task 2 chỉ còn `href` nhóm `result` + đổi `nhanDot` dùng `nhanDotNgan` chung. **`badgeLop` UX0 đã làm** (`soBaiChoCham`, `needScoresTitle`, `n HV chờ xếp lớp`, `n Case mở`) → Task 1 bỏ phần này, chỉ thêm phép kiểm. **N-2 (Q17):** UX0 đã làm hộp lớp/Việc cần làm; bảng "Chuyển cho PR sau" của UX0 giao UX3 thêm #6 SkillBoard, #7 `ClassYThucCard` HV→vi phạm, #8 `PhoiHopSosSection` + `DongThoiGian` — xem Task 5, 7. |
| 23/09 | 1 | `chonNgay.ts` (`dsNgayGan/dsTuan/cuoiTuan/dsThang/nhanDotNgan`); `CASE_OUTCOME_LABEL` bốn nhãn mới; `PLAN_DECISION_NGAN/NGHIA`, `NUT_LUU_KET_QUA` (ở `cases.ts`); `viecTiepTheoCua` trả `{ viec, han, quaHanNgay, tone, title }` (hạn tách khỏi chữ việc) + `web/src/ui/ViecTiep.tsx` vẽ `Ghi kết quả L ⚠ 3 ngày` / `· CN 14/09` (làm luôn phần vẽ của Task 8 cho `BangHocVienLop`, `BangCanHoTro`); `ketQuaGanNhat` thêm `sosTamThoi` (chỉ có khi true) + `SOS 2` không còn "· tạm thời"; `attemptProgressView` thêm `tamThoi`/`title` (`SOS 2`, `Đạt 1/3 môn`); `tienDoCase` 4 dạng chữ + `tiep` = `Ghi kết quả PA`; Ý thức bỏ ⚠ (`violationWarning`, `violationAgeLabel` = `9 ngày`, cả `board.ts`/`canhBao.ts`); HS → HV ở 3 nhãn biện pháp. `KetQuaDot` đã bỏ ⚠ từ UX0 → chỉ thêm `title`. Đổi kỳ vọng chữ cũ ở `hocVienLop/hoSoHocVien/yThuc/yThucGon.tests`, `run.ts`. → **1204** phép. |
| 23/09 | 2 | `profile.ts` (`Ghi kết quả PA {kn}`, `Đề ra PA {kn}`), `mywork.ts` (`href` nhóm `result` = `?case&pa&viec=ghi-ket-qua`, nhãn nhóm/`statusLabel` "Ghi kết quả"), `cases.ts` (`performerUserId`), `duongHoSo.ts` (`viec`, đi và về). Phép kiểm: href, round-trip, `performerUserId`. |
| 24/09 | 3 | `NganCase` viết lại: **một** `KhungPanel` (view `case` · `ghi-ket-qua` · `them-pa` · `hoan-thanh` · `tra-loi`), tải `/cases/{id}` một lần, `quayLai` "← Case Listening"; nhận `hocVien`, `lop`, `viec`, `viecBanDau`, `onChanged`. `CasePanel.tsx` tách `ThanCase` (khối Vấn đề · Phương án · ▸ Lịch sử cập nhật · Bằng chứng) + trang riêng `CasePanel({caseId})` (hàng nút mở `NganCase`); xoá `ResultDialog/ActionDialog/OutcomeDialog/ApprovalDialog`. `data-pa-id` giữ trên `<li>` thẻ PA. `CaseBoardPage`/`IssueAnalysis` dùng `NganCase` (Alert mức độ → `Nhan soon`); `StudentDetailPage` truyền `lop`, `viec` (URL `?viec=`). **Ngoài kế hoạch:** `congViec/HoTroHocVienTab.tsx` cũng dùng `ApprovalDialog` → đổi sang `TraLoiDeXuatPanel`. |
| 24/09 | 4 | `GhiKetQuaPanel` (thay `CapNhatTuanForm`): quyết định là danh sách dọc 5 dòng, khối con ngay dưới dòng chọn, người thực hiện điền sẵn (`performerUserId`), `Còn thiếu:` gom nhãn ô sau khi bấm; `Xin hỗ trợ QL` có ô `Cần Quản lý giúp gì` (≥ 8 ký tự). `ThaoTacCase.tsx`: `ThemPaPanel`, `HoanThanhCasePanel` (4 nút lấy từ `CASE_OUTCOME_LABEL`), `TraLoiDeXuatPanel`. Ô ngày = `ChonNgay.tsx` (không `type="date"`). **Chữ:** mockup 15 viết "Người làm" nhưng bảng chữ PR-H (`run.ts` `PRH_OLD_STRINGS`) **cấm** "Người làm"/"Đã làm gì" → dùng **"Người thực hiện"** / "Phương án đã áp dụng" (nguồn thắng mockup). Checkbox "thêm PA cần QL duyệt" (chết vì tình trạng không còn `planned`) bỏ; đề xuất luôn gửi duyệt như cũ. |
| 24/09 | 5 | `SkillBoard` thành **một bảng** 4 cột (`Kỹ năng · Gần nhất · Case · Việc tiếp`, tiêu đề một lần, mỗi kỹ năng một `<tbody>`, `HangNhom`/`HangCon`): hàng con Case (không khung) + hàng con PA; hạn ở hàng PA là `hạn CN 30/08` mờ, `⚠ quá hạn n ngày` **chỉ** ở cột Việc tiếp của hàng kỹ năng; `onMoCase(caseId, { viec, paId })` → ngăn Case. Bỏ lịch sử/Bằng chứng PA tại chỗ, `PlanDue`, chip `Han`, hai badge "Đang xử lý". `CaseSosControls` (xác định nguyên nhân, Không cần theo dõi, PA gợi ý) **giữ tại chỗ**. `HeaderStats` ô "Việc cần làm tiếp": `⚠ quá hạn n ngày`/`hạn dd/mm`; tuần `W3 AUG` bỏ năm cùng năm. `KetQuaDot` đã bỏ ⚠ từ UX0. |
| 24/09 | 6 | `QuickReport` thành `KhungPanel` (props cũ giữ, thêm `lop`): tab `HangTab`, khối Vấn đề/Theo dõi/Đã áp dụng/Kết quả/Bằng chứng, `Phân loại vấn đề` là `<select>` (Q6), tuần thay ngày ở nhập bù (Q7: `Từ tuần` → thứ Hai, `Đến tuần` → Chủ nhật cắt về hôm nay; mỗi PA mặc định cùng khoảng, `Sửa`), bước "Đã lưu" + Bằng chứng, trùng Case = khối vàng trong thân. Lỗi kiểm trước khi gửi → `Còn thiếu:`; lỗi máy chủ vẫn toast. Truyền `lop` từ hồ sơ HV, dòng HV (`maLop`), hồ sơ lớp. |
| 24/09 | 7 | Ý thức: `RecordViolationPanel`, `PhuongAnPanel` (tạo/sửa PA xử lý), `CreateMeasurePanel`, `ConfirmMeasurePanel`, `XemPhuongAnPanel` → `KhungPanel`; `Loại` là `<select>`, mức khoá `disabled` + lý do ở `title` (không `[khoá]`/`(B05)`); "Thêm vi phạm chưa xử lý" và "Đã xử lý ở PA khác" thu gọn; `ConfirmDialog` cho Xoá PA. Nhắc mềm (Q14): câu vàng không ⚠, `n ngày`, `HangTab` chấm vàng `●`, `CanhBaoYThuc` = `Nhan soon`. **Không làm (chuyển cho):** UX0 #7 `ClassYThucCard` HV → vi phạm hàng lớn/nhỏ (bỏ chữ Mở/Đóng), #8 `PhoiHopSosSection` + `DongThoiGian` (Q17: 7 chỗ N-2 ngoài SkillBoard). |
| 24/09 | 8 | `ChuyenLopPanel` (`Từ tuần`, `Ghi chú bàn giao`, `ConfirmDialog` một câu), `LoTrinhTiepPanel` (danh sách dọc + một dòng nghĩa), `StudentManagePanel` = `mucQuanLyHocVien` (luật thuần đưa sang `shared/domain/quanLyHocVien.ts` để kiểm được) + menu thả `Menu` ở ⋮, mỗi mục mở thẳng panel (bỏ `← Chọn việc khác`); `TeacherAssignPanel` (đổi tên từ `TeacherAssignDialog`). Ngày sinh gõ `dd/mm/yyyy` (không `type="date"`). `BangHocVienLop`/`BangCanHoTro` vẽ `ViecTiep` (Task 1). |
| 24/09 | 9 | **Không làm** (tuỳ chọn) — Thêm HV hàng loạt (`IntakePanel`) và vỏ `TransitionPanel` → "Chuyển cho". |
| 24/09 | 10 | Máy chủ thử (seed riêng, API 4417 / Vite 5617), Playwright kênh Chrome, vai GVCN (7) · QL (2) · GVBM (9), 1440px + 375px, ảnh ở `thiet-ke/anh/pr-ux3/`; mọi ảnh `scrollWidth === innerWidth`, 0 lỗi console. **Lỗi bắt được bằng ảnh và đã sửa:** (a) chữ ở hàng lớn bị `font-weight: 800` của `.hang-lon > td` → thêm `font-normal` ở ô nội dung; (b) `PhuongAnPanel` hiện ô gõ tên khi vừa mở vì `ChonNguoi` gắn trước khi nạp người phụ trách → chờ nạp xong mới vẽ form; (c) tab Tạo Case giữ `Còn thiếu` khi đổi tab → reset; (d) `lop` thiếu ở ⋯ dòng HV trong hồ sơ lớp → truyền `maLop`; (e) nút kết quả PA tràn chữ ở 560px → `text-xs`. Phép kiểm nguồn gom (`PANEL_UX3`, placeholder) đã có từ Task 6–8. **Việc chưa kiểm bằng tay:** Tổng quan › tín hiệu SOS › Tạo Case (DongTinHieu) — chỉ kiểm chữ ký props. |
| 24/09 | 11 | **Bổ sung của chủ SP: Xoá lớp / Kết thúc lớp** (`classes/xoaKetThucLop.ts`, đường `GET /classes/:id/xoa-ket-thuc`, `POST /classes/:id/xoa`, `POST /classes/:id/ket-thuc`). Chỉ Quản trị hệ thống: máy chủ kiểm `admin.config` (QL/GV → 403); `viewer.coTheXoaKetThuc` chỉ để ẩn/hiện mục ⋮. **Xoá**: lớp chưa từng ghi danh HV và chưa có lượt Test / tín hiệu / ước lượng / công việc / vi phạm / PA xử lý / lộ trình tiếp theo / lớp học tiếp; gõ lại đúng mã lớp; xoá phân công + kỹ năng lớp + dòng lớp trong một `tx` + `audit_logs` `class.delete`; có dữ liệu → 400 "dùng Kết thúc lớp". **Kết thúc**: còn HV đang học → 400 "Còn n học viên đang học — chuyển tiếp lớp hoặc chuyển lớp trước"; không → `finished` + `finished_at` hôm nay + Lưu trữ + audit `class.finished`; lớp rỗng cũng kết thúc được ở máy chủ (theo phép kiểm chủ SP), còn menu chỉ hiện "Kết thúc lớp" cho lớp CÓ dữ liệu. Web: `XoaKetThucLopPanel.tsx` (`XoaLopPanel` nút đỏ mờ tới khi gõ đúng mã, `KetThucLopPanel`), mục cuối menu ⋮ Hồ sơ lớp sau đường kẻ (`MucMenu.keTruoc`). Đường mới vào `tocDoDuong.ts` (QL/GV/… 403). +7 phép kiểm; bấm thử QT thấy `Xoá lớp`, QL không thấy. **Ghi chú kỹ thuật:** quyền lấy từ `admin.config`, KHÔNG từ vai QL. |

## Bổ sung 24/09 — Xoá lớp / Kết thúc lớp (chủ sản phẩm chốt)

**Chỉ Quản trị hệ thống (system admin)** — kiểm ở MÁY CHỦ bằng quyền quản trị (ADMIN_CONFIG / vai system_admin), không chỉ ẩn nút. QL chi nhánh, GV: không thấy nút, gọi API trả 403.
**Vị trí:** Hồ sơ lớp → nút ⋮ (góc đầu trang) → cuối menu, sau đường kẻ. Bảng định vị §4 thêm dòng "Xoá lớp / Kết thúc lớp | ⋮ Hồ sơ lớp | Quản trị hệ thống".
- **Xoá lớp** — chỉ hiện (và máy chủ chỉ cho) khi lớp **chưa có học viên nào từng ghi danh** và **chưa có lượt Test / điểm / Case / vi phạm** gắn lớp. Mở panel (KhungPanel) xác nhận: nêu mã lớp + chi nhánh + "Không hoàn tác được", ô **gõ lại mã lớp** mới bật nút đỏ "Xoá lớp". Xoá hẳn trong một tx: phân công GV, lịch kỹ năng/đợt rỗng, dòng lớp; ghi audit_logs (ai, lúc nào, mã lớp). Lớp có dữ liệu → nút không hiện; gọi API → 400 "Lớp đã có dữ liệu — dùng Kết thúc lớp".
- **Kết thúc lớp** — cho lớp đã có dữ liệu: panel xác nhận; nếu còn học viên đang học thì CHẶN và chỉ dẫn "Còn n học viên đang học — chuyển tiếp lớp hoặc chuyển lớp trước". Không còn ai → `status='finished'`, `finished_at` = hôm nay (cùng luật lớp tự kết thúc của PR-LT), lớp vào khu Lưu trữ, hồ sơ chỉ xem; ghi audit_logs.
- Phép kiểm: QL/GV → 403 cả hai đường; admin xoá lớp rỗng → dòng lớp mất + audit; lớp có 1 HV từng học / 1 lượt Test → 400; kết thúc lớp còn HV đang học → 400; kết thúc lớp rỗng → finished + vào /hoc-vien-lop/luu-tru. Đường mới vào tocDoDuong.ts.
