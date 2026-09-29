# PR-HSM · Hồ sơ Mock + chấm W/S — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Hồ sơ Mock (Test › một lượt MT) thành **dải 5 ô điểm lớn L · R · W · S · Overall** — Writing tổng là ô lớn ngang hàng,
W1/W2 là hai hàng tiêu chí bên trong; ai đúng quyền (GVBM đúng kỹ năng · Quản lý · GVCN với MT lịch sử) **bấm ô là sửa tại chỗ**, lưu
từng ô, sửa điểm đã có vẫn ghi lý do (RB-5). Chấm W/S có **nhận xét** (không bắt buộc, ≤ 1000 ký tự) và Speaking có **GV chấm** — chọn
**một lần ở đầu cột S** của lưới (nhớ theo lớp × tuần), sửa riêng trong hộp. Hồ sơ Mock vẽ đủ trạng thái (đã huỷ · lịch sử · hoàn tất ·
vắng/dời · RF), sửa "SOS 4". Kèm các sửa nhỏ của ô điểm: tên tiêu chí W1 `TA` / W2 `TR`, cột **W** tổng trên lưới, lỗi nhập hiện ngay
dưới ô (C9), nút "Vắng" + Hoàn tác trên điện thoại (C2), căn số một kiểu (E5), luật vắng thống nhất (E8), bảng Mock Test ở hồ sơ HV
(F8, K4-33).
**Architecture:** Migrate thêm 3 cột `assessment_scores` (file `server/src/migrate/prHsm.ts`). Nhận xét / GV chấm đi **cùng đường ghi
điểm** `saveScore` (một hàm, một route) — có nhánh "chỉ nhận xét" không đụng điểm, không đổi người nhập, không tính lại SOS. Luật thuần
mới ở `shared/domain/nhanXet.ts` + `shared/domain/skills.ts` (`tieuChiCua`). Web: ô lớn `ODiemLon.tsx`, nhận xét `NhanXet.tsx`, GV chấm
`GvCham.tsx`; hồ sơ Mock **giữ nguyên** thao tác theo trạng thái của PR-XLMT (`thaoTacKyNang`, `HopThaoTacMt`, `DongThoiGianLuot`).
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); `npm run check` (`server/src/tests/*`).
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §4.7 **YC-13.5, 13.7, 13.8** · §3.2 **T39** (+ T34 M3, T53 Q6) · §7.4,
§7.5, §7.6 (`ODiemLon`), §7.8 (cột nhận xét/GV chấm cho xuất Excel) · §8 dòng PR-HSM · §9 UX-C **C2, C9** · UX-E **E5, E8** · UX-F **F8**
(`docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md:86,93,126,129,147`) · §10 · mockup **M10** `thiet-ke/mockup/19-nang-cap-27-09.html:685-725`
· rà `thiet-ke/ra-27-09/`: **K2-32, K4-24, K4-25, K4-26, K4-30, K4-31, K4-33** + K4 §4(a)(f)(h) · K5 §5 dòng PR-HSM · "Chuyển" của PR-N1
(Toast Hoàn tác C2), PR-NEN (GV chấm dùng `ChonNguoi`, YC-10), PR-MT (M10 trạng thái, nhập MT lịch sử tại chỗ, "SOS 4" rà #119), PR-XLMT
(M10 dùng `thaoTacKyNang` + `HopThaoTacMt` + `DongThoiGianLuot`).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-HSM** · đợt 4 · làn **A** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-hsm-ho-so-mock` · `.claude/worktrees/pr-hsm-ho-so-mock` (từ `origin/main` mới nhất — đã có PR-XLMT #126, PR-S3F) |
| Cổng thử | API **4157** · Vite **5357** (không dùng 4000/5173; B PR-HVL 4167/5367 · C PR-XUAT 4177/5377 chạy song song) |
| Model | **Fable 5.1 · High** · phương án B: **Opus 5.5 · High**. Fable: đọc kỹ "Hướng dẫn riêng cho model thực thi" |
| Người rà | **Opus 5.5**, session riêng (T52) — rà **đầy đủ** (PR có migrate, đổi đường ghi điểm) — rà theo đợt khi xong đợt 4 |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Có.** `assessment_scores.comment TEXT`, `examiner_user_id INTEGER REFERENCES users(id)`, `examiner_name TEXT` — chỉ thêm cột, không đổi dữ liệu (K5 §5). File `server/src/migrate/prHsm.ts` + `schema.sql` + **một dòng** gọi ở `migrate.ts` |
| Skill | Gõ **`/ponytail lite`** đầu phiên (PR có giao diện). impeccable: **`clarify`** Task 3 (câu lỗi ô, chữ nút Vắng, nhãn nhận xét) · **`layout`** Task 5 (hồ sơ Mock) + Task 4 (lưới, E5) · **`harden`** Task 5 (trạng thái huỷ/lịch sử/hoàn tất/vắng, chữ dài, lỗi mạng) · **`adapt`** Task 5 (375 px) · **`audit`** rồi **`polish`** Task 9. Không `init`/`document`/`hooks on`/`npx impeccable install\|update`; không `colorize` (xem Mâu thuẫn 1) |
| Phụ thuộc | **PR-XLMT #126** (đã merge: `thaoTacKyNang`, `HopThaoTacMt`, `DongThoiGianLuot`, `huyDiem`, `thiLai`) · PR-MT (`lich_su`, `ChipLichSu`) · PR-NEN (`ChonNguoi`, `Truong`) · PR-N1 (`toast.hoanTac`) · PR-MON (`tenMon/tenMonNgan`) |
| Không làm | Xuất Excel (PR-XUAT — PR này chỉ giao **hợp đồng dữ liệu** bên dưới) · sáng/tối, font, `text-[10px]` cũ (PR-SANG, E4) · bảng→thẻ điện thoại ngoài màn chấm (PR-UXD) · hồ sơ bài lớp thường (K4-32 đã làm ở PR-XLMT: ⋯ + Lịch sử một bài) · menu thao tác thứ hai (dùng của XLMT) · mockup M10 vẽ lại (planning, sau PR) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-HSM (n): …`. Sập segfault (mã 139, Node chết) không phải
  phép kiểm hỏng → **chạy lại một lần**; lần hai vẫn sập thì dừng, ghi Nhật ký.
- Treo quá 10 phút → quét tiến trình `node … tests/run.js` còn sống, tắt hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px **một lần** ở Task 9 (Playwright kênh Chrome, đăng nhập demo
  `POST /api/demo/session {userId}`: **Quản trị id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu Trang
  id 9** · GV Writing của `MB FT 101`: tra `user_skills` trong DB demo, ghi id vào Nhật ký), ảnh trước (main) / sau lưu `thiet-ke/anh/pr-hsm/`.
  Chạy song song: `PORT=4157` cho API, Vite tạm cổng 5357 trỏ proxy về 4157 (bộ nhớ "Máy chủ dev trong worktree").
- Không chạm Turso, không deploy trong Task 0–9; chỉ DB demo trong worktree. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning. Trước
  khi báo xong: tắt 4157/5357, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.

### Chồng file với PR cùng đợt (cổng rebase trước Task 9)

Trước Task 9: `git fetch origin && git rebase origin/main`. **Thứ tự merge khuyến nghị: PR-HSM trước PR-XUAT** (XUAT đọc cột của HSM);
PR-SANG merge **sau cùng** (rebase lên HSM, không ngược lại).

| File | PR khác có thể sửa | PR-HSM chỉ được sửa | Gỡ xung đột |
|---|---|---|---|
| `server/src/schema.sql`, `server/src/migrate.ts` | (đợt 4 chỉ HSM có migrate) | 3 cột cuối khối `assessment_scores`; **một** dòng gọi `migratePrHsm` cuối danh sách (sau `migratePrYt4`) | giữ mọi dòng |
| `server/src/fasttrack/attempts.ts` | **PR-XUAT** (đọc `loadBundle`/`scoresOf` — chỉ đọc) · **PR-HVL** (có thể đọc `resultOf`) | `ScoreRow`, `scoresOf`, `loadBundle` (join GV chấm), `SkillCell` + `skillCells` (2 trường, `canEdit` loại vắng), `saveScore` (nhánh nhận xét), `attemptDetail.skillSchedule` (`doiTu`) | khác khối → giữ cả hai; XUAT gọi hàm, không sửa |
| `server/src/routes/index.ts` | XUAT: route xuất mới · HVL: route lớp | thân `PUT /attempts/:id/scores/:skill` thêm 2 trường | khác khối — giữ cả hai |
| `server/src/students/profile.ts` | **PR-HVL** (kết quả gần nhất, có thể) | khối `attempts` (:563-590) thêm `evaluable`, `doiKyNang`, `huyPhan` + 1 câu đọc `attempt_skills` | cùng file khác khối → giữ cả hai; cùng khối → dừng, báo planning |
| `web/src/modules/students/StudentDetailPage.tsx` | PR-HVL (ít khả năng), **PR-SANG** (màu/cỡ chữ) | `IeltsAttempts` (:509-561) | HVL/SANG merge trước → giữ của họ, áp lại `IeltsAttempts` |
| `web/src/modules/fasttrack/ScoreEntry.tsx`, `cham/LuoiFT.tsx`, `cham/MotKyNang.tsx`, `cham/LuoiThuong.tsx`, `test/lichTest/KhoiNo.tsx`, `HangLop.tsx` | **PR-SANG** (`text-[10px]` → ≥ 12 px, màu) · PR-XUAT (nút ở đầu **`LichTestTab.tsx`** — HSM không sửa file đó) | như Task 3–4 | SANG chạy sau → SANG gỡ |
| `shared/domain/index.ts` | XUAT, HVL: export mới | 1 dòng `export * from './nhanXet.ts'` | giữ cả hai |
| `server/src/tests/run.ts`, `server/src/seed/seed.ts`, `server/src/tests/tocDoDuong.ts` | mọi PR | 1 đăng ký `runPrHsmTests` cuối file · 1 import + 1 lời gọi `buildHsmDemo` sau `buildKckDemo` · trần `/students/1` (+1 nếu vượt, ghi lý do) | giữ mọi dòng, thứ tự theo merge |
| `CODE_MAP.md`, `thiet-ke/TU_DIEN_VA_CHU.md`, `DEMO.md`, Rulebook, `plan.md` | mọi PR | chỉ thêm dòng | giữ cả hai |

## Hợp đồng dữ liệu cho PR-XUAT (T40, §7.8 cột "Đầy đủ")

PR-XUAT code theo đúng hợp đồng này; đổi gì phải báo cả hai session.

| Thứ | Hợp đồng |
|---|---|
| Cột DB | `assessment_scores.comment TEXT NULL` — nhận xét của **một bài nhập** (`writing1`, `writing2`, `speaking`); đã cắt khoảng trắng, 1–1000 ký tự, rỗng lưu `NULL`. L/R luôn `NULL`. |
|  | `assessment_scores.examiner_user_id INTEGER NULL REFERENCES users(id)` · `assessment_scores.examiner_name TEXT NULL` — **GV chấm Speaking**, chỉ dòng `speaking`; **tối đa một** trong hai khác `NULL` (tài khoản **hoặc** tên người ngoài 2–100 ký tự). |
| Hàm dùng chung | `shared/domain/nhanXet.ts`: `nhanXetW(w1: string \| null, w2: string \| null): string \| null` → `"Task 1: …\nTask 2: …"` (bỏ phần trống; cả hai trống → `null`) · `tenGvCham(o: { examinerUserName?: string \| null; examinerName?: string \| null }): string \| null` · `NHAN_XET_TOI_DA = 1000`. `shared/domain/skills.ts`: `tieuChiNganCua(skill: EntrySkill)` → W1 `TA CC LR GRA`, W2 `TR CC LR GRA`, S `FC LR GRA P` (tên cột 4 tiêu chí). |
| Hàng máy chủ | `ScoreRow` (từ `scoresOf` / `loadBundle`, `server/src/fasttrack/attempts.ts`) thêm `comment`, `examiner_user_id`, `examiner_name`, `examiner_user_name` (join `users` — **không thêm câu SQL**). |
| API | `SkillCell` (trong `GET /attempts/:id` → `cells[]` và `GET /classes/:id/score-sheet` → `rows[].cells[]`) thêm `nhanXet: string \| null` và `gvCham: { userId: number \| null; ten: string } \| null` (chỉ `speaking`). |
| Cột Excel | "Nhận xét W" = `nhanXetW(W1.comment, W2.comment)` · "Nhận xét S" = `S.comment` · "GV chấm S" = `tenGvCham(S)` · ô thiếu **để trống** (K4-35). Quyền: theo quyền xem lượt của PR-XUAT (không thêm quyền mới). |

## Global Constraints

- **Một đường ghi:** điểm, dấu "-", nhận xét, GV chấm của một bài nhập đều qua `saveScore` (`PUT /attempts/:id/scores/:skill`) — không
  route thứ hai, không hàm ghi thứ hai. Quyền sửa nhận xét = quyền sửa **chính ô đó** (`scoreEditPath` + R11 + M3 lịch sử, như điểm).
  Máy chủ **kiểm lại** mọi luật (độ dài, bài nào nhận nhận xét, bài nào có GV chấm, người hợp lệ) — chặn ở giao diện không thay chặn máy chủ.
- **Nhận xét không phải điểm (K4 §4f):** sửa nhận xét / GV chấm **không** cần lý do, **không** đổi "Nhập bởi" (`entered_by/entered_at`),
  **không** gọi `refreshOutcome` (không đụng SOS/Case). Ghi nhật ký `score.nhan_xet` (trước/sau). Ô bị **xoá hết điểm** (Huỷ điểm, Thi lại,
  xoá tay) thì nhận xét + GV chấm của ô cũng về `NULL` — nhật ký giữ bản cũ.
- **BẪY TURSO (lỗi thật đã gặp — bắt buộc):** (1) **không** dùng tham số đặt tên `{ x }` cho `@x` — `db.ts` đã cấm; chỉ `?` / `?1`;
  (2) `UNION ALL` ≤ **20 vế** mỗi câu; (3) mọi ghi nhiều bảng / nhiều dòng đi qua `tx()` (BEGIN IMMEDIATE sẵn, lồng = SAVEPOINT);
  (4) `IN (…)` dựng `?` theo số phần tử, chia lô 900; không N+1 (join `users` trong câu có sẵn, không hỏi tên theo từng ô).
- **Migrate:** chỉ `ALTER TABLE … ADD COLUMN` qua kiểm `pragma_table_info` (chạy lại không làm gì — mẫu `migrate/prKck.ts`); thêm **cả**
  `schema.sql` (DB mới/demo) **và** `migrate/prHsm.ts` (DB đang chạy). Không đổi dữ liệu cũ. Khi deploy: **migrate DB THỬ trước bản nháp;
  chủ sản phẩm sao lưu + migrate DB CHÍNH trước `--prod`** — nhưng theo chủ sản phẩm 29/09: bản chính chỉ deploy khi **xong cả 6 đợt**
  (reset DB), bản nháp chỉ lên khi cần → PR này có **Task 10** lên nháp DB THỬ kiểm migrate + luồng chấm, **chỉ khi chủ sản phẩm cho**.
- **Tốc độ:** `GET /classes/:id/score-sheet`, `/cham/lich-test`, `GET /attempts/:id` **không thêm câu SQL** cho nhận xét/GV chấm (join trong
  câu đọc điểm có sẵn). Hồ sơ HV (`/students/:id`, trần 100) được **+1** câu (đọc `attempt_skills` cả lô cho K4-33); vượt trần thì nâng
  **+1**, ghi lý do cạnh số — hơn +1 là 🛑. `GET /attempts/:id` được +1 câu (`doiTu`, chỉ khi có dời do vắng).
- **Chữ:** tên kỹ năng qua `tenMon/tenMonNgan` / `skillLabel`; tuần qua `tuanLich()`, ngày qua `ngay()`; không lộ `comment`, `examiner`,
  `sit_status`, mã kỹ năng, ngày ISO. Viết đủ "Quản lý", không "QL". Tên tiêu chí qua `tieuChiCua(skill)` (một nguồn, K4-25).
- **Tinh tế (chủ sản phẩm):** dấu tích nhỏ gọn (✓ ▾ ▴ ◐ vẽ **SVG** ≤ 12 px — ký tự nhỏ của Inter thành dấu chấm), cột/hàng thẳng, **số căn
  phải + `tabular-nums`**, dòng phụ **một** dòng, không dồn chữ (câu dài vào tooltip / dòng gập). Số chính hồ sơ Mock **28 px / 700**, nhãn
  12 px, dòng phụ 12 px (§7.4) — chữ mới **không** dưới 12 px (E4 của PR-SANG; `Nhan` tối thiểu 11,5 px). Màu chỉ qua token có sẵn
  (`ok`, `bad`, `late`, `wait`, `done`, `accent`), không màu mới. Mỗi thành phần mới ghi **"Nằm ở: khu vực → trang → nút"** trong chú thích
  đầu thành phần và trong thân PR.
- **Giữ phép kiểm đọc nguồn cũ** (số phép kiểm không giảm): `prMt.tests.ts:485-490` (`prog !== 'scored' && !d.lichSu && <div><DeadlinePill`,
  `d.lichSu && <> <ChipLichSu />` trong `MockDetailPage.tsx`; nhánh `progress === 'lich_su') return <Info pending>Nhập bù, không có hạn</Info>`
  trong `ScoreEntry.tsx`; không chữ `lich_su` trong JSX `StudentDetailPage.tsx`, `KhoiNo.tsx`) · `prXlmt.tests.ts:435-441` (`MockDetailPage.tsx`
  có `thaoTacKyNang(`, `<HopThaoTacMt`, `<TheYeuCau`, `<DongThoiGianLuot`; không `'Ghi nhận vắng'`, `label: 'Lịch sử'`…) · `prMon.tests.ts:309-313`
  (`LuoiThuong.tsx`, `MotKyNang.tsx` dùng `tenMonNgan(`, không `skillShort(`) · `prMon.tests.ts:431` (`chiChuKetQua={CHUONG_TRINH_KHONG_CHIA_MON.includes`)
  · `hanhTrinh.tests.ts:704-791` (chữ cấm, `docThamSoHoSo`, `cuonOnDinh(` trong `StudentDetailPage.tsx`).
- **Ngày nghiệp vụ:** `demoToday()` (máy chủ) / `useNgayNghiepVu().homNay` (web). Ngày demo của bộ kiểm = 14/09/2026 (`TODAY`).

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc nếu chạy Fable)

1. Bốn chỗ **dễ sai nhất** có mã mẫu trong Task: (a) nhánh "chỉ nhận xét" của `saveScore` phải đứng **sau** mọi kiểm quyền / hoàn tất /
   vắng / huỷ và **trước** nhánh dấu "-" — không để nó rơi xuống nhánh điểm (sẽ ghi đè `entered_by`); (b) xoá nhận xét khi ô mất hết điểm
   làm **trong** nhánh điểm của `saveScore` (Huỷ điểm và Thi lại của PR-XLMT đều gọi `saveScore` — không sửa `huyDiem`/`thiLai`); (c) `canEdit`
   loại `absent` ở **một** chỗ (`skillCells`) — không vá riêng lưới/điện thoại/hồ sơ Mock; (d) GV chấm đọc bằng `LEFT JOIN users g` **trong**
   câu `scoresOf`/`loadBundle` có sẵn.
2. Không dựng lại thao tác MT: nút chính / menu ⋯ / hộp chung / dòng thời gian của hồ sơ Mock là của PR-XLMT — chỉ **dời chỗ** và bỏ cột
   "Điểm" + dòng "Writing (tổng)" (điểm lên dải ô lớn). Ô lớn mở trình sửa bằng **`InlineScoreEditor` có sẵn** (mỗi bài nhập một cái; W hai cái).
3. 🛑 **Dừng hỏi planning** nếu: (a) cần thêm cột/bảng ngoài 3 cột đã chốt (ví dụ `comment_by`); (b) phép kiểm cũ nào phải **xoá** thay vì
   sửa dữ liệu (đổi dữ liệu dựng / thêm trường cho phép kiểm cũ là **được**, ghi Nhật ký); (c) trần `tocDoDuong.ts` phải tăng quá +1;
   (d) `canEdit` loại vắng làm đỏ phép kiểm luồng vắng / Xếp lại bài vắng / Q-A (nhập bù bài vắng = "Khôi phục" / "Xếp lại" trước — T53 Q6);
   (e) sau rebase thấy PR-HVL/PR-XUAT sửa khối "PR-HSM chỉ được sửa" của bảng chồng file. Không chạy lệnh nào có biến Turso ngoài Task 10.

## Task 0 · Nhánh, mốc, đối chiếu dòng mã

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-hsm-ho-so-mock -b pr-hsm-ho-so-mock origin/main`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch đợt 4> -- docs/superpowers/plans/2026-09-29-pr-hsm-ho-so-mock.md`.
- [ ] Gõ `/ponytail lite`. `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm) vào Nhật ký.
- [ ] Đối chiếu (grep): `export function saveScore` (attempts.ts:1366), `export function skillCells` (:271), `canEdit: required` (:385),
  `export function attemptDetail` (:876), `export function scoresOf` (:47), `LEFT JOIN users u ON u.id = s.entered_by` (:51, :101),
  `export function CriteriaModal` (ScoreEntry.tsx:464), `export function InlineScoreEditor` (:535), `function NutDau` (:195),
  `{cell.rawScore === null ? (cell.noShow ? '-' : '—')` (:321), `function SkillWorkTable` (MockDetailPage.tsx:342),
  `sos={d.result.failedCount` (:205, :210), `function IeltsAttempts` (StudentDetailPage.tsx:509), `const attempts = attemptRows.map`
  (profile.ts:563), `export const CRITERIA` (skills.ts:39). Lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-HSM (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Migrate + luật thuần (YC-13.5, T39, K4-25)

**Files:** tạo `server/src/migrate/prHsm.ts`, `shared/domain/nhanXet.ts` (+ export ở `shared/domain/index.ts`), `server/src/tests/prHsm.tests.ts`
(`runPrHsmTests`, đăng ký **cuối** `run.ts` sau PR-S3F); sửa `server/src/schema.sql` (khối `assessment_scores` :663-695),
`server/src/migrate.ts` (một dòng sau `migratePrYt4`, :475), `shared/domain/skills.ts`.

- [ ] `migrate/prHsm.ts`:
```ts
/** PR-HSM (YC-13.5, T39): nhận xét W/S + GV chấm Speaking trên từng bài nhập. Chỉ thêm cột, không đổi dữ liệu — chạy lại không làm gì. */
const coCot = (conn: any, bang: string, cot: string) =>
  (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);
export function migratePrHsm(conn: any, applied: string[]) {
  const them: string[] = [];
  for (const [cot, kieu] of [['comment', 'TEXT'], ['examiner_user_id', 'INTEGER REFERENCES users(id)'], ['examiner_name', 'TEXT']] as const) {
    if (coCot(conn, 'assessment_scores', cot)) continue;
    conn.exec(`ALTER TABLE assessment_scores ADD COLUMN ${cot} ${kieu}`);
    them.push(`assessment_scores.${cot}`);
  }
  if (them.length) applied.push(`PR-HSM: thêm cột ${them.join(', ')} (nhận xét W/S, GV chấm Speaking). Dữ liệu cũ giữ nguyên.`);
}
```
  `schema.sql`: ba cột ngay trước `UNIQUE (attempt_id, skill)`, có chú thích (nhận xét của **một bài nhập**; GV chấm chỉ Speaking, tài khoản
  **hoặc** tên ngoài). `migrate.ts`: `/* PR-HSM: nhận xét W/S + GV chấm Speaking (T39). */ migratePrHsm(conn, applied);`.
- [ ] `skills.ts` (K4-25) — tiêu chí theo **bài nhập**; `CRITERIA`/`CRITERIA_SHORT`/`criteriaSetFor` chỉ còn `ScoreEntry.tsx` dùng → thay
  hết nơi gọi rồi xoá (grep sạch):
```ts
const TIEU_CHI = {
  writing1: ['Task Achievement', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'],
  writing2: ['Task Response', 'Coherence & Cohesion', 'Lexical Resource', 'Grammatical Range & Accuracy'],
  speaking: ['Fluency & Coherence', 'Lexical Resource', 'Grammatical Range & Accuracy', 'Pronunciation'],
} as const;
const TIEU_CHI_NGAN = { writing1: ['TA', 'CC', 'LR', 'GRA'], writing2: ['TR', 'CC', 'LR', 'GRA'], speaking: ['FC', 'LR', 'GRA', 'P'] } as const;
/** K4-25: Task 2 là Task Response (TR), không phải Task Achievement. `null` với L/R (nhập số câu). */
export const tieuChiCua = (s: EntrySkill) => (s in TIEU_CHI ? TIEU_CHI[s as keyof typeof TIEU_CHI] : null);
export const tieuChiNganCua = (s: EntrySkill) => (s in TIEU_CHI_NGAN ? TIEU_CHI_NGAN[s as keyof typeof TIEU_CHI_NGAN] : null);
```
- [ ] `nhanXet.ts`:
```ts
/** Nhận xét W/S + GV chấm Speaking (YC-13.5, T39) — luật một chỗ cho máy chủ, lưới, hồ sơ Mock và xuất Excel (PR-XUAT). */
export const NHAN_XET_TOI_DA = 1000;
export const BAI_CO_NHAN_XET = ['writing1', 'writing2', 'speaking'] as const;
/** `null` = xoá. Trả chuỗi đã cắt (rỗng → null) hoặc câu lỗi. */
export function kiemNhanXet(s: unknown): { gt: string | null } | { loi: string } {
  if (s === null) return { gt: null };
  if (typeof s !== 'string') return { loi: 'Nhận xét phải là chữ.' };
  const t = s.trim();
  if (t.length > NHAN_XET_TOI_DA) return { loi: `Nhận xét tối đa ${NHAN_XET_TOI_DA} ký tự (đang ${t.length}).` };
  return { gt: t || null };
}
export function nhanXetW(w1: string | null, w2: string | null): string | null {
  const d = [w1 ? `Task 1: ${w1}` : null, w2 ? `Task 2: ${w2}` : null].filter(Boolean);
  return d.length ? d.join('\n') : null;
}
export const tenGvCham = (o: { examinerUserName?: string | null; examinerName?: string | null }) =>
  o.examinerUserName ?? o.examinerName ?? null;
```
- [ ] **Phép kiểm** khối 1 (`prHsm.tests.ts`): (a) `migratePrHsm` trên DB tạm chưa có cột → thêm 3 cột, `applied` 1 dòng; chạy lần 2 → không
  thêm, `applied` rỗng; DB demo có đủ 3 cột (mẫu `prKck.tests.ts:49`); (b) `tieuChiNganCua('writing1')[0] === 'TA'`, `('writing2')[0] === 'TR'`,
  `('listening') === null`; (c) `kiemNhanXet`: `'  '` → `null`, 1001 ký tự → lỗi, `5` → lỗi; (d) `nhanXetW` bốn tổ hợp; (e) `tenGvCham`
  ưu tiên tài khoản.
- [ ] `npm run check` → commit `PR-HSM (1): migrate nhận xét + GV chấm, tiêu chí W1 TA / W2 TR, luật nhận xét`.

## Task 2 · Máy chủ: ghi/đọc nhận xét + GV chấm, bài vắng không nhập (E8), dời từ, hồ sơ HV (T39, K4-24, K4-30, K4-33)

**Files:** `server/src/fasttrack/attempts.ts` (`ScoreRow` :34, `scoresOf` :47, `loadBundle` :88, `SkillCell` :209, `skillCells` :271,
`attemptDetail` :876, `ScorePatch` :1292, `saveScore` :1366), `server/src/routes/index.ts` (:839-852), `server/src/students/profile.ts`
(:545-590), `server/src/tests/tocDoDuong.ts` (nếu cần).

- [ ] **Đọc** — hai câu có sẵn (`scoresOf`, `loadBundle`) thêm `LEFT JOIN users g ON g.id = s.examiner_user_id` + `g.full_name AS
  examiner_user_name`; `ScoreRow` thêm 4 trường. `SkillCell` thêm `nhanXet: string | null` (`row?.comment ?? null`) và `gvCham` (chỉ
  `speaking`, có `examiner_user_id` hoặc `examiner_name`: `{ userId: row.examiner_user_id ?? null, ten: tenGvCham({ examinerUserName:
  row.examiner_user_name, examinerName: row.examiner_name })! }`, còn lại `null`).
- [ ] **E8 (T53 Q6)** — `skillCells`: `canEdit` (:385) và `viec` (:388) thêm `&& view.sitStatus !== 'absent'` (bài đã xác nhận vắng không nhập
  trong lưới; nhập bù thì Quản lý "Xếp lại bài vắng" / "Khôi phục" trước). `saveScore` giữ nguyên chặn `absent` (:1426).
- [ ] **Ghi** — `ScorePatch` thêm `nhanXet?: string | null` và `gvCham?: { performerSelf?: boolean; performerUserId?: number | null;
  performerName?: string | null } | null` (đúng dạng `nguoiThanhPayload` của `shared/domain/nguoiThucHien.ts`). Route
  `PUT /attempts/:id/scores/:skill` chuyển thêm `nhanXet: b.nhanXet, gvCham: b.gvCham`. Trong `saveScore`, **sau** kiểm `absent` (:1431),
  **trước** `return tx(` (:1433):
```ts
const coNhanXet = patch.nhanXet !== undefined, coGvCham = patch.gvCham !== undefined;
if (coNhanXet && !(BAI_CO_NHAN_XET as readonly string[]).includes(skill)) throw badRequest('Chỉ Writing Task 1, Writing Task 2 và Speaking có nhận xét.');
if (coGvCham && skill !== 'speaking') throw badRequest('Chỉ Speaking có GV chấm.');
const nx = coNhanXet ? kiemNhanXet(patch.nhanXet) : null;
if (nx && 'loi' in nx) throw badRequest(nx.loi);
const gv = coGvCham ? (patch.gvCham ? gvChamHopLe(p, patch.gvCham) : null) : undefined;   // gvChamHopLe bọc chuanHoaNguoiThucHien
const chiNhanXet = (coNhanXet || coGvCham) && patch.rawScore === undefined && patch.rawTotal === undefined
  && patch.criteria === undefined && patch.noShow === undefined && patch.resultDate === undefined && patch.note === undefined;
if (chiNhanXet) return tx(() => luuNhanXet(p, attemptId, skill, nx && 'gt' in nx ? nx.gt : undefined, gv));
```
  `gvChamHopLe` = `chuanHoaNguoiThucHien(p, g, { nhom: 'nhan_vien', batBuoc: false })` trong `try/catch` đổi câu thành "GV chấm phải là nhân
  viên đang làm việc, hoặc gõ tên người ngoài (2–100 ký tự)." `luuNhanXet` (hàm trong file, **không export**): đọc dòng cũ; chưa có dòng →
  `INSERT (attempt_id, skill, comment, examiner_user_id, examiner_name)`; có → `UPDATE` **chỉ** cột được gửi (`undefined` = giữ); `writeAudit
  ({ action: 'score.nhan_xet', entityLabel: skill, before, after })`; trả `{ score, result: resultOf(fresh), attemptStatus }` như `done()`.
  **Không** `refreshOutcome`. Nhánh **điểm** (:1560-1577): ghi thêm `comment` / `examiner_*` khi được gửi; khi `!hasValue && daCoDiem` (ô
  vừa mất hết điểm) đặt cả ba về `NULL`. Nhánh "-" bỏ qua hai trường (không lỗi).
- [ ] **Dời từ + huỷ (K4-30, K4 §4h)** — `attemptDetail`: mỗi dòng `skillSchedule` thêm `doiTu: string | null` = tuần (`tuanLich`) của
  `old_value` dòng `skill_week_moved_absence` **mới nhất** cùng `field` trong `history` đã đọc (:910); mã tuần → `week_start` bằng **một**
  câu `SELECT code, week_start FROM report_periods WHERE code IN (…)`, chỉ chạy khi có. Thêm `huy: { lyDo: string | null; ai: string | null;
  khi: string } | null` từ dòng `cancelled` mới nhất của `history` (không câu mới).
- [ ] **Hồ sơ HV (F8, K4-33)** — `profile.ts` khối `attempts`: thêm `evaluable: r.evaluable` (FT; lớp thường `null`) và, bằng **một** câu cả lô
  `SELECT attempt_id, skill, sit_status, absence_move_count FROM attempt_skills WHERE required = 1 AND attempt_id IN (…)`: `doiKyNang: string[]`
  (kỹ năng có `absence_move_count > 0` hoặc `sit_status = 'absent'`) và `huyPhan: boolean` (có `sit_status = 'cancelled'` mà lượt chưa huỷ).
  Đo `/students/1` (4 vai) — vượt 100 thì 101 + chú thích "PR-HSM: nhãn dời/huỷ phần (K4-33)".
- [ ] **Phép kiểm** khối 2 (dữ liệu dựng qua hàm nghiệp vụ, ngày `TODAY`): (a) GVBM Speaking (Trang) lưu S bốn tiêu chí + `gvCham:
  { performerUserId: 9 }` → dòng có `examiner_user_id = 9`, `attemptDetail(...).cells` S có `gvCham.ten`; (b) cùng ô đã có điểm, gửi **chỉ**
  `{ nhanXet: 'Phát âm rõ' }`, không lý do → được; `entered_by`, `entered_at`, `band` không đổi; số dòng `sos_signals` / `sos_cases` của lượt
  không đổi; nhật ký có `score.nhan_xet`; (c) `nhanXet` cho `listening` → 400; `gvCham` cho `writing1` → 400; 1001 ký tự → 400; tên ngoài
  1 ký tự → 400; (d) GVBM không phân công Speaking → 403; đợt hoàn tất (R11): GVBM → 403, Quản lý → được; MT lịch sử: GVCN (Hà) ghi nhận
  xét W2 → được; (e) `huyDiem` (PR-XLMT) ô S có nhận xét + GV chấm → cả ba `NULL`, `before_json` của nhật ký còn nhận xét cũ; `thiLai` W →
  W1, W2 hết nhận xét; (f) kỹ năng `absent` → `canEdit === false` ở `attemptDetail` **và** `classScoreSheet`; `saveScore` vẫn 400; (g) dời
  do vắng lần 1 → `doiTu` = tuần cũ; lượt huỷ → `huy.ai`, `huy.lyDo`; (h) `profileOf` em có S dời do vắng → `doiKyNang` chứa `speaking`; lượt
  2/4 điểm có `evaluable === false`; (i) `soCauSql()` của `classScoreSheet` trước/sau khi có nhận xét + GV chấm bằng nhau.
- [ ] `npm run check` → commit `PR-HSM (2): máy chủ ghi/đọc nhận xét + GV chấm, bài vắng không nhập (E8), dời từ, hồ sơ HV`.

## Task 3 · Ô điểm dùng chung: tiêu chí đúng tên, "+ Nhận xét", GV chấm trong hộp, lỗi dưới ô, nút Vắng (K4-24, K4-25, C2, C9, E5) — impeccable `clarify`

**Files:** `web/src/modules/fasttrack/ScoreEntry.tsx`, `web/src/ui/SaveState.tsx` (`useTrangThaiLuuO`), tạo `web/src/modules/cham/GvCham.tsx`.

- [ ] **Tiêu chí (K4-25):** `SuaTieuChi` (:429), `CriteriaModal` (:464), `InlineScoreEditor` (:535) đọc nhãn bằng `tieuChiCua(cell.skill)` /
  `tieuChiNganCua(cell.skill)` — bỏ `criteriaSetFor`/`CRITERIA[set]`. `Cell` (web) thêm `nhanXet?: string | null`, `gvCham?: { userId: number |
  null; ten: string } | null`; `SavePatch` thêm `nhanXet?`, `gvCham?` (dạng `nguoiThanhPayload`).
- [ ] **`GvCham.tsx`** — *Nằm ở: Test › Lịch Test / trang Nhập điểm cả lớp (lưới FT) → tiêu đề cột S; điện thoại → đầu danh sách khi chọn chip S;
  hộp 4 tiêu chí S.* `useGvChamCot(classId, periodId, laCuaToi)`: đọc/ghi `localStorage` khoá `pisa:gv-cham:{classId}:{periodId}` (bọc
  `try/catch`; hỏng/không có → mặc định `{ kieu: 'toi' }` khi người xem được phân công S, ngược lại `null`). `NutGvCham({ value, onChange })`:
  một nút gọn `GV chấm: {tên ngắn} ▾` (▾ là SVG) mở `Modal` nhỏ chứa `ChonNguoi nhom="nhan_vien" choNgoai` (YC-10); trống thì chữ phụ
  "GV chấm: chưa chọn". Một câu giải thích dưới ô chọn: "Áp cho các bài Speaking lưu sau đó ở lớp này, tuần này. Sửa riêng một em trong hộp tiêu chí."
- [ ] **`CriteriaModal`** (ô chưa có điểm): (a) Enter ở ô tiêu chí = Lưu (T39) — `onKeyDown` ở ô `input`, **không** ở `textarea`; (b) dưới 4 ô:
  dòng gập **"+ Nhận xét"** (nút chữ; đã có nhận xét thì mở sẵn) → `textarea` 3 dòng, `maxLength={NHAN_XET_TOI_DA}`, đếm ký tự khi > 800,
  nhãn "Nhận xét (không bắt buộc)"; (c) Speaking: dòng "GV chấm: {tên} · Đổi" (`ChonNguoi`), giá trị đầu = `cell.gvCham` ?? prop mới
  `gvMacDinh` (từ `useGvChamCot`); (d) Lưu gửi **một** lệnh `{ criteria | noShow, nhanXet?, gvCham? }` (chỉ gửi trường đã đổi so với ô).
  `CriteriaButton` nhận thêm prop `gvMacDinh?` truyền xuống.
- [ ] **C9 — lỗi nhập ngay dưới ô:** `RawScoreInput` (:283-352) và `ODiemThuong` (:1086-1117): câu lỗi (`loi` / `canhBao.cau`) hiện thành
  **một dòng** ngay dưới ô (`<span id={idLoi} role="alert" className="text-xs text-bad">`), ô thêm `aria-invalid="true"` +
  `aria-describedby={idLoi}` (id bằng `useId()`), tooltip không còn là chỗ duy nhất. Ô lỗi nhập **đếm vào "n ô chưa lưu"** của dòng:
  `useTrangThaiLuuO` thêm `loiNhap(k, cau | null)` (đặt/bỏ lỗi **không** kèm lệnh gửi lại — `DauO` không vẽ "Lưu lại" cho lỗi nhập);
  `RawScoreInput`/`ODiemThuong` nhận prop tuỳ chọn `onLoiNhap?: (cau: string | null) => void`, nơi gọi (`LuoiFT`, `MotKyNang`, `LuoiThuong`)
  nối vào `loiNhap`. Mẫu: câu lỗi của `CriteriaModal` (:513).
- [ ] **C2 — nút "Vắng" điện thoại:** `NutDau` (:195-204) đổi chữ "−" thành **"Vắng"** (nút có chữ, cao 44 px, rộng theo chữ; `ChoNutDau`
  giữ chỗ cùng rộng để cột thẳng), `title` giữ câu cũ. Bấm = ghi ngay như cũ, thành công thì `toast.hoanTac('Đã ghi vắng {môn} · {em}', …)`:
  FT hoàn tác = `onSave({ noShow: false })`; lớp thường hoàn tác = `onDau(false)` (gỡ dấu, lịch về tuần cũ). Toast key theo ô (bấm hai ô liền
  không nuốt nhau). `tenHv` truyền từ `MotKyNang`.
- [ ] **E5 — ô chỉ đọc như chữ:** `RawScoreInput` chỉ đọc (:321-322): không có số → **"—"** (bỏ "— (—)"; band trong ngoặc chỉ khi có số câu);
  bài vắng (`progress === 'absent'`) → chữ "vắng" xám + tooltip "Đã xác nhận vắng — Quản lý xếp lại bài trước khi nhập" (E8). `CriteriaButton`
  không sửa được → `<span>` chữ số (không viền nút, không `opacity-70`), cùng tooltip.
- [ ] `/impeccable clarify` cho: câu lỗi dưới ô, chữ nút Vắng + toast, nhãn "+ Nhận xét", câu GV chấm — trước/sau vào Nhật ký.
- [ ] **Phép kiểm** khối 3 (đọc nguồn, `docSach`): `ScoreEntry.tsx` không còn `CRITERIA[` / `criteriaSetFor(`, có `tieuChiCua(`; không còn chuỗi
  `'—'} ({` kiểu "— (—)"; có `aria-invalid` và `aria-describedby`; `NutDau` có chữ `Vắng`, có `hoanTac(`; `CriteriaModal` có `NHAN_XET_TOI_DA`;
  `GvCham.tsx` có `pisa:gv-cham:` và bọc `try`. Giữ nhánh `Nhập bù, không có hạn` (PR-MT).
- [ ] `npm run check` → commit `PR-HSM (3): ô điểm — tiêu chí W1/W2 đúng tên, nhận xét, GV chấm, lỗi dưới ô, nút Vắng + Hoàn tác`.

## Task 4 · Lưới FT, điện thoại, lưới lớp thường, Lịch Test (K4-24, K4-26, C9, E5, E8, F8) — impeccable `layout`

**Files:** `web/src/modules/cham/LuoiFT.tsx`, `web/src/modules/cham/MotKyNang.tsx`, `web/src/modules/cham/LuoiThuong.tsx`,
`web/src/modules/test/lichTest/KhoiNo.tsx`, `web/src/modules/test/lichTest/HangLop.tsx`, `web/src/lib/format.ts`, tạo `web/src/modules/fasttrack/NhanXet.tsx`.

- [ ] **GV chấm một lần (K4-24)** — *Nằm ở: Test › Lịch Test (lưới mở tại chỗ) và trang Nhập điểm cả lớp (`/nhap-diem/:classId`, mở từ hồ sơ Mock ›
  nút "Nhập điểm cả lớp" hoặc từ hồ sơ lớp) → tiêu đề cột S.* `LuoiFT`
  gọi `useGvChamCot(data.classId, data.period?.id, data.editableSkills.includes('speaking'))`; `NutGvCham` dưới chữ "S (band)" của tiêu đề
  (chỉ khi người xem sửa được S); ô S lưu kèm `gvCham` của cột (`CriteriaButton gvMacDinh`). Không đủ chỗ trong cột 104 px → nới cột S
  (quyết ở `layout`, ghi Nhật ký). Có `period === null` → không vẽ nút.
- [ ] **Cột W tổng (K4-26, YC-13.7)** — `LuoiFT`: cột hẹp **W** (56 px) chỉ đọc ngay sau W2: band Writing của `row.result.verdicts` (đủ hai task
  mới có), chữ `text-bad` khi dưới kỳ vọng, "—" khi chưa đủ; tiêu đề có gợi ý "Band Writing = (Task 1 + Task 2 × 2) / 3, khi đủ hai task."
  `COT` + `colgroup` thêm cột (G-2).
- [ ] **F8 ở lưới** — cột "Trạng thái" (:232-238) dùng nhãn mới `nhanLuot(status, coDiem, yeuCau)` (thêm ở `lib/format.ts`): huỷ → "Đã huỷ" ·
  đủ → nhãn cũ của `done` · `planned` có ≥ 1 kỹ năng → **"Đang chấm · 2/4"** · còn lại nhãn cũ. Hồ sơ Mock (Task 5) dùng cùng hàm.
- [ ] **E5 — căn phải:** mọi cột số của `LuoiFT` (L, R, W1, W2, W, S, Kỳ vọng, Overall) căn phải cả tiêu đề (`Th align="right"`) lẫn ô (ô
  nhập `ml-auto`, `DauO` không đè số); `LuoiThuong` ô `đúng/tổng` căn phải (`justify-end`), tiêu đề cột căn phải. **Lịch Test:** `HangLop.tsx`
  export `COT_DAU_LICH_TEST = [190, 120, 110] as const` (Lớp · Đợt · Kỹ năng); `KhoiNo.tsx` dùng đúng ba số đó cho ba cột đầu; cột Chi nhánh
  của hàng lớp dời ra **sau** Kỹ năng để ba cột đầu hai bảng thẳng nhau.
- [ ] **C9 lớp thường:** `LuoiThuong` truyền `tongLaySan` cho ô trên **máy tính** khi cột có tổng chung (ô tổng trống hiện sẵn tổng cột, chưa là
  bản nháp — luật `ODiemThuong` có sẵn); nút "↓" đổi thành chữ **"Điền cả cột"** (giữ `aria-label`, `title`). Nối `onLoiNhap` (Task 3).
- [ ] **Điện thoại (`MotKyNang`)** — *Nằm ở: Test › Lịch Test / Nhập điểm cả lớp ở < 640 px → chip kỹ năng.* (a) chip **S** đang chọn → hàng
  `NutGvCham` ngay trên danh sách (44 px); (b) dòng W1/W2/S có nút ✎ nhỏ (SVG bút, vùng bấm 44 px) cạnh ô điểm → `HopNhanXet`
  (`NhanXet.tsx`: `Modal` có `textarea`, đếm, **Lưu** / **Đóng**; lưu `save(k, { nhanXet })`) — em đã có nhận xét thì ✎ đậm màu `accent`;
  ô không sửa được thì không có ✎; (c) truyền `tenHv` cho toast Vắng (Task 3). Chip đếm giữ luật `tinhFt` (E8 đã đúng — :133).
- [ ] `/impeccable layout` trên lưới FT (cột W, nút GV chấm, căn phải), lưới lớp thường, Lịch Test (hai bảng thẳng cột) — Nhật ký.
- [ ] **Phép kiểm** khối 4 (đọc nguồn): `LuoiFT.tsx` có `useGvChamCot(` và cột `verdicts` writing; `LuoiThuong.tsx` có chữ `Điền cả cột`, không
  còn `>↓<`; `KhoiNo.tsx` import `COT_DAU_LICH_TEST`; `MotKyNang.tsx` có `HopNhanXet`; `nhanLuot('planned', 2, 4) === 'Đang chấm · 2/4'`
  (import trực tiếp `web/src/lib/format.ts` nếu bộ kiểm đọc được — không thì đặt hàm ở `shared/domain` và kiểm ở đó).
- [ ] `npm run check` → commit `PR-HSM (4): lưới — GV chấm một lần, cột W tổng, căn phải, Điền cả cột, nhận xét trên điện thoại`.

## Task 5 · Hồ sơ Mock M10 (YC-13.7, YC-13.8, K4-30, K4-31, K2-32, rà #119 "SOS 4") — impeccable `layout` + `harden` + `adapt`

**Files:** `web/src/modules/fasttrack/MockDetailPage.tsx`, tạo `web/src/modules/fasttrack/ODiemLon.tsx`; dùng `NhanXet.tsx`, `GvCham.tsx`.
**Nằm ở:** Test › một lượt MT (mở từ Lịch Test, hồ sơ HV › bảng Mock Test, tên em ở lưới chấm) — `/mock-test/:id`. Ai thấy: mọi vai có quyền
xem lượt; sửa tại chỗ: GVBM đúng kỹ năng, Quản lý, GVCN với MT lịch sử (theo `cell.canEdit` của máy chủ — web không tự suy quyền).

- [ ] **Đầu trang** (thay :171-217, giữ nút Hồ sơ học viên · Nhập điểm cả lớp · menu "Chỉnh lịch" của XLMT): dòng 1 `Tên · mã · MT{n}` + nhãn
  (`ChipLichSu` giữ đúng mẫu `d.lichSu && <> <ChipLichSu />` · "Đã huỷ" · "Đã hoàn tất" khi có ô `khoa` · chữ nhỏ `RF` khi `cycle.route === 'RF'`)
  + `ChonDot`; dòng 2 (12 px, phụ): `{tuần} · {khoảng ngày} · {lớp} · Lộ trình {route}`; dòng 3: `<KetQuaDot>` + `Kỳ vọng {x}` (RF: `Kỳ vọng
  {x} = target`). **Sửa "SOS 4":** `sos={d.result.sosLevel ?? null}` ở cả hai `KetQuaDot` (:205, :210 — `failedCount` 4 môn ra "SOS 4").
- [ ] **Dải ô lớn `ODiemLon`** (§7.6, YC-13.7) ngay dưới đầu trang: 5 ô **L · R · W · S · Overall** cùng cỡ, lưới `grid-cols-2 sm:grid-cols-5`
  (Overall chiếm 2 cột ở 375 px). Mỗi ô: nhãn 12 px · **số 28 px / 700 `tabular-nums`** (band; chưa có → "—") · **một** dòng phụ 12 px:
  L/R `19 câu` · W `W1 5.0 · W2 5.5` (công thức "(Task 1 + Task 2 × 2) / 3" ở tooltip) · S `GV chấm: …` · Overall `KetQuaDot phan="overall"`.
  Dấu đạt/dưới kỳ vọng: `Verdict` có sẵn (SVG ▴/▾ ≤ 12 px nếu đổi ký tự). **Trạng thái ô chưa điểm** (dòng phụ, K4-30): `Thi W1 OCT` (chưa tới) ·
  `Hạn nhập 23/09` / `Quá hạn 2 ngày` (`Han`) · `vắng · dời sang W1 OCT · lần 1` (`doiTu`, `absenceMoveCount`) · `chờ Quản lý duyệt dời lần 2 ·
  hạn 12/10` (`pendingMove`, màu `wait`) · `Đã huỷ phần thi` · `Ngoài phạm vi` · `Nhập bù, không có hạn` (lịch sử). Câu dài → tooltip.
- [ ] **Sửa tại chỗ (YC-13.8):** ô có ít nhất một bài nhập `canEdit` (và không bị `lockedByNoShow`) là `<button aria-expanded>`; bấm → khung
  sửa **ngay dưới dải** (một ô mở một lúc; Esc đóng): L/R một `InlineScoreEditor`; **W hai hàng** `InlineScoreEditor` W1 (`TA CC LR GRA`) và
  W2 (`TR CC LR GRA`) mỗi hàng lưu riêng (K4-31); S một hàng. Lưu từng bài qua `useSaveScore` có sẵn (trạng thái ô `DauO`/`SaveState`); sửa
  điểm đã có vẫn đòi lý do (RB-5 — `InlineScoreEditor` đã làm). Nút chính "Nhập điểm / Sửa điểm" của bảng dưới (XLMT) giờ **mở ô lớn tương
  ứng + cuộn tới** thay cho sửa trong dòng.
- [ ] **Nhận xét W/S (YC-13.5)** — khối dưới dải: "Nhận xét Writing" (hai phần **Task 1 · Task 2**, mỗi phần ghi người nhập điểm của bài đó) và
  "Nhận xét Speaking · GV chấm: {tên} · Đổi". Người `canEdit` bài đó: `ONhanXet` (`NhanXet.tsx` — `textarea` tự cao, lưu khi rời ô/`Ctrl+Enter`,
  đếm > 800, trạng thái lưu nhỏ) + đổi GV chấm bằng `NutGvCham` (lưu ngay, chỉ-nhận-xét). Không sửa được: chữ thường, rỗng thì ẩn phần đó.
  Cả khối rỗng và không ai sửa được → không vẽ.
- [ ] **Bảng lịch gọn** (`SkillWorkTable` :342-544): bỏ cột **Điểm** và dòng **"Writing (tổng)"** (`writingRow` :474-490 — điểm đã ở dải); còn 4 cột
  `Kỹ năng · Lịch kiểm tra · Tình trạng và hạn · Thao tác`; cột Lịch ghi `W1 OCT (dời từ W3 SEP · vắng lần 1)` khi có `doiTu`. **Giữ nguyên**
  `thaoTacKyNang(` / `HopThaoTacMt` / `TraLoiDeNghiModal` / `AbsenceMoveModal` / menu đầu trang và dòng `{prog !== 'scored' && !d.lichSu &&
  <div><DeadlinePill cell={c} /></div>}` (phép kiểm PR-MT). "Thông tin đợt" (`details` :220) dùng `nhanLuot` cho Trạng thái (F8).
- [ ] **Trạng thái cả lượt (K4-30):** lượt **đã huỷ** → dải mảnh trên cùng `Đã huỷ · {lý do} · {ai} · {ngày}` (`d.huy`) + nút **Mở lại lượt MT{n}**
  cho người `canCancel` (gọi đường `reopen` có sẵn), mọi ô lớn khoá · **lịch sử** → dòng 2 thêm "Nhập bù, không có hạn", GVCN thấy ô sửa được ·
  **hoàn tất** → nhãn "Đã hoàn tất" + tooltip `KHOA_HOAN_TAT_HINT`; người không sửa được thấy ô chỉ đọc · **RF** → như đầu trang.
- [ ] `/impeccable layout` (tầng 1 = năm số lớn; nhịp khoảng cách; cột bảng dưới thẳng) → `/impeccable harden` (tên em rất dài, nhận xét 1000
  ký tự, lượt huỷ, lịch sử, hoàn tất, vắng lần 2, lỗi mạng khi lưu nhận xét, không quyền) → `/impeccable adapt` (375 px: 2 cột ô lớn, khung
  sửa không tràn, ô tiêu chí bàn phím số, nút 44 px). Nhật ký ghi "tầng 1 của màn này là: 4 điểm kỹ năng + Overall".
- [ ] **Phép kiểm** khối 5 (đọc nguồn): `MockDetailPage.tsx` có `<ODiemLon`, `sosLevel`, không còn `failedCount`, không còn `Writing (tổng)`;
  giữ mọi mẫu của PR-MT / PR-XLMT (Global Constraints); `ODiemLon.tsx` dùng `InlineScoreEditor` (không trình sửa thứ hai) và `tabular-nums`.
- [ ] `npm run check` → commit `PR-HSM (5): hồ sơ Mock M10 — năm ô điểm lớn, sửa tại chỗ, nhận xét W/S, đủ trạng thái, sửa SOS 4`.

## Task 6 · Hồ sơ HV › bảng Mock Test (F8, K4-33)

**Files:** `web/src/modules/students/StudentDetailPage.tsx` (`IeltsAttempts` :509-561, tiêu đề khối :307-315).
**Nằm ở:** Học viên & Lớp › hồ sơ học viên › tab Học thuật › khối "Mock Test".

- [ ] Bỏ cột **Trạng thái**; cột **Kết quả** = một `<KetQuaDot coDiem={a.scored} yeuCau={a.required} dat={a.evaluable ? a.sosLevel === 0 : null}
  sos={a.sosLevel} />` (bỏ `Chờ n kỹ năng` + `mới 2/4` — nói một lần). L · R · W · S · Overall · Kỳ vọng **căn phải** (`Th align="right"`,
  `td text-right tabular-nums`). Bỏ liên kết 10 px "Hồ sơ đợt ›" của bảng này; ô **MT{n}** thành `Link` (bàn phím vào được), cả hàng vẫn bấm được.
  Nhãn nhỏ viền mảnh cạnh MT: `lịch sử` (giữ `ChipLichSu`) · `đã huỷ` (lượt huỷ) · `huỷ phần` (`huyPhan`) · `dời S` / `dời W S` (`doiKyNang`,
  tên tắt qua `skillShort`/`tenMonNgan`) — tối đa hai nhãn, còn lại `+n` có tooltip.
- [ ] RF: một dòng phụ dưới tiêu đề khối khi lộ trình RF: "Lộ trình RF — kỳ vọng mọi MT bằng target." (không lặp ở từng hàng).
- [ ] **Phép kiểm** khối 6 (đọc nguồn): `IeltsAttempts` không còn `attemptStatusLabel(` và `Hồ sơ đợt ›`; có `<KetQuaDot`; không chữ `lich_su` lọt JSX
  (PR-MT); giữ `docThamSoHoSo`, `cuonOnDinh(` (hanhTrinh.tests).
- [ ] `npm run check` → commit `PR-HSM (6): hồ sơ HV — bảng Mock Test một cột Kết quả, số căn phải, nhãn lịch sử/huỷ/dời`.

## Task 7 · Dữ liệu demo (K5 §6 không có dòng cho PR-HSM — planning đặt H1–H4)

**Files:** tạo `server/src/seed/hsmSeed.ts` (`buildHsmDemo(ctx)`, đi qua `saveScore` như `xlmtSeed.ts`); `server/src/seed/seed.ts` (1 import +
1 lời gọi **sau** `buildKckDemo`, :237); `DEMO.md` (Task 8).

- [ ] **H1** `MB FT 101` · Tạ Minh Quân (X1 của XLMT, MT3 đủ điểm): nhận xét W1, W2, S (câu thật, 1–2 câu) + GV chấm S = **Phạm Thu Trang** (tài khoản)
  → hồ sơ Mock đủ M10. **H2** một em FT khác có S chấm, GV chấm **người ngoài** "Cô Lan (giám khảo ngoài)". **H3** Lương Bảo Anh (X1, MT3 có
  L R, thiếu W S) → hồ sơ HV hiện "Đang chấm · 2/4" / `KetQuaDot` còn thiếu 2 (F8). **H4** trạng thái M10 **dùng dữ liệu có sẵn**, chỉ ghi vào
  `DEMO.md`: lượt huỷ (PR-MT D6) · MT lịch sử (X3 Đoàn Khánh Chi) · vắng lần 2 chờ duyệt (X2 Kiều Thu Trang) · huỷ phần (X2 Mạc Đức Long) ·
  RF (`MB FT RF 12`, D1) · hoàn tất (lượt cũ bất kỳ). Thiếu cái nào thì thêm tối thiểu vào `hsmSeed.ts`, ghi Nhật ký.
- [ ] `npm run seed` trong worktree → kiểm bằng mắt 4 tình huống → `npm run check` → commit `PR-HSM (7): demo nhận xét + GV chấm (H1–H4)`.

## Task 8 · Tài liệu

- [ ] `CODE_MAP.md`: `migrate/prHsm.ts`, `nhanXet.ts`, `tieuChiCua`, `ODiemLon.tsx`, `NhanXet.tsx`, `GvCham.tsx`, nhánh chỉ-nhận-xét của `saveScore`.
  `thiet-ke/TU_DIEN_VA_CHU.md`: "Nhận xét", "GV chấm", "Vắng" (nút điện thoại), "Điền cả cột", "Đang chấm · 2/4", tiêu chí W2 "TR — Task
  Response". `thiet-ke/PISA-Rulebook-2026-09-19.md`: nhận xét W/S (không bắt buộc, ≤ 1000, không lý do, xoá cùng điểm), GV chấm Speaking
  (một lần mỗi lớp × tuần), bài đã xác nhận vắng không nhập trong lưới (T53 Q6). `DEMO.md`: H1–H4. Chỉ tài liệu — không chạy lại `npm run check`.
  Commit `PR-HSM (8): tài liệu`.

## Task 9 · impeccable `audit` + `polish`, bấm thử (một lần), mở PR

- [ ] Cổng rebase (bảng chồng file) → `npm run check`.
- [ ] `/impeccable audit` trên: hồ sơ Mock (1440 + 375, đủ trạng thái H1–H4), lưới FT (cột W, GV chấm), điện thoại một kỹ năng (Vắng, ✎, GV
  chấm), lưới lớp thường (lỗi dưới ô, Điền cả cột), Lịch Test (hai bảng thẳng cột), hồ sơ HV bảng Mock Test → sửa a11y/tương phản/trạng thái
  trong phạm vi PR → `/impeccable polish` một lượt. `/ponytail-review` trên diff; liệt kê **mọi** chú thích `ponytail:` (thêm/bỏ).
- [ ] Bấm thử **KIỂM** (API 4157 + Vite 5357, Playwright kênh Chrome), ảnh trước (main) / sau → `thiet-ke/anh/pr-hsm/` (tên file theo mã K).
- [ ] push → `gh pr create` tiêu đề `PR-HSM: Hồ sơ Mock năm ô điểm lớn, nhận xét W/S, GV chấm Speaking (YC-13.5, 13.7, 13.8)`; thân: bảng mã
  YC/T/K/UX → ảnh → đạt/không; "tầng 1 của màn này là: …" (hồ sơ Mock → 4 điểm kỹ năng + Overall · lưới FT → ô trống của tôi + band vừa ra ·
  hồ sơ HV bảng Mock Test → kết quả từng MT); **Migrate** (3 cột, không đổi dữ liệu, lệnh migrate DB THỬ); **Hợp đồng dữ liệu cho PR-XUAT**
  (chép bảng); **Chuyển cho PR khác**; chú thích `ponytail:`; model thật. **Không tự merge.** Tắt cổng, quét `tests/run.js`, dọn tạm.

## Task 10 · Lên bản nháp DB THỬ — kiểm migrate + luồng chấm (chỉ khi chủ sản phẩm cho)

- [ ] Hỏi chủ sản phẩm trước (29/09: bản chính chỉ deploy khi xong 6 đợt; nháp chỉ khi cần). Được cho → theo `TRIEN_KHAI.md`: sao lưu DB THỬ →
  migrate DB THỬ (in `applied`: đúng một dòng PR-HSM) → chạy lại migrate lần 2 (không dòng nào) → deploy **nháp** (không `--prod`).
- [ ] Trên nháp: GVBM Speaking nhập 4 tiêu chí S tại hồ sơ Mock + GV chấm; nhận xét W2; mở lại → còn; đo thời gian lưu < 3 s (bộ nhớ "Tập
  dượt Z2c"). Ghi kết quả vào Nhật ký + thân PR. **Không** chạm DB CHÍNH (chủ sản phẩm sao lưu + migrate DB CHÍNH trước `--prod` ở lần deploy
  cuối).

## KIỂM — kịch bản bấm thử (Task 9)

| # | Vai (id) | Làm | Phải thấy |
|---|---|---|---|
| K1 | GVBM Trang (9) | Hồ sơ Mock H1 (Tạ Minh Quân MT3) | 5 ô số lớn thẳng hàng; W `W1 … · W2 …`; S "GV chấm: Phạm Thu Trang"; nhận xét W (Task 1/Task 2) + S dưới dải; "Sửa" chỉ ở ô S |
| K2 | GVBM Trang | Bấm ô S → sửa FC (đã có điểm) | Ô lý do hiện ngay (RB-5); lưu → số đổi, ✓ nhỏ; Lịch sử có dòng sửa + lý do |
| K3 | GVBM Trang | Sửa nhận xét S, rời ô | "Đã lưu" nhỏ; "Nhập bởi" **không** đổi; không hỏi lý do |
| K4 | GV Writing (id Nhật ký) | Ô W → hai hàng W1 `TA CC LR GRA`, W2 `TR CC LR GRA` | Lưu W1 rồi W2 riêng; W tổng hiện khi đủ hai task |
| K5 | GVCN Hà (7) | Hồ sơ Mock MT lịch sử của X3 | Nhãn `lịch sử` + "Nhập bù, không có hạn"; Hà sửa được ô lớn; không `DeadlinePill` |
| K6 | QL Vy (2) | Hồ sơ Mock lượt huỷ (D6) · lượt hoàn tất · X2 Kiều Thu Trang | Dải "Đã huỷ · lý do · ai · ngày · Mở lại"; "Đã hoàn tất"; ô S `chờ Quản lý duyệt dời lần 2 · hạn …` tím; KetQuaDot không bao giờ "SOS 4" |
| K7 | GVBM Trang | Nhập điểm cả lớp `MB FT 101` → đầu cột S chọn GV chấm "Cô Lan" → chấm 2 em S | Hai em có GV chấm Cô Lan; tải lại trang vẫn nhớ lựa chọn (cùng lớp × tuần) |
| K8 | GVBM Trang | Hộp 4 tiêu chí em mới: "+ Nhận xét", Enter ở ô tiêu chí | Enter = Lưu; textarea xuống dòng bình thường; đổi GV chấm riêng em đó |
| K9 | GV bất kỳ | Lưới FT gõ "abc" ở L | Câu lỗi ngay dưới ô, đọc được bằng trình đọc màn hình; dòng ghi "1 ô chưa lưu", không "Lưu lại" |
| K10 | GVCN lớp thường | Lưới `MB FOU 12`: ô tổng trống hiện sẵn tổng cột; nút "Điền cả cột" | Ô số căn phải; nhập số câu → lưu kèm tổng |
| K11 | 375 px GVBM Trang | Một kỹ năng S: nút "Vắng" → toast Hoàn tác → Hoàn tác | Ô về trống; chip `S n/m` đúng; ✎ mở hộp nhận xét; GV chấm ở đầu danh sách |
| K12 | QL Vy | Lưới FT em có S vắng (X2) | Ô S chữ "vắng", không ô nhập; hồ sơ Mock cùng luật |
| K13 | QL Vy | Hồ sơ HV Lương Bảo Anh (H3) · X2 Kiều Thu Trang | Một cột Kết quả (`KetQuaDot` "còn thiếu 2"), số căn phải, `dời S`; không "Đã lên lịch", không "Hồ sơ đợt ›" |
| K14 | QL Vy | Lịch Test tuần có Nợ | Ba cột đầu bảng Nợ và bảng lớp thẳng nhau |
| K15 | 375 px | K1, K4, K6, K13 | Ô lớn 2 cột, Overall ngang; khung sửa không tràn; không cuộn ngang cả trang |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Lý do |
|---|---|---|
| Cột "Nhận xét W", "Nhận xét S", "GV chấm S", 4 tiêu chí W1/W2/S theo `tieuChiNganCua` — dùng **hợp đồng dữ liệu** ở trên; merge **sau** PR-HSM | PR-XUAT | T40, §7.8, K4-35 |
| `text-[10px]` cũ trong `ScoreEntry.tsx`, `LuoiFT.tsx`, `MotKyNang.tsx`, `LuoiThuong.tsx` (PR này chỉ viết chữ mới ≥ 12 px) | PR-SANG | E4 |
| Bảng "Kết quả kiểm tra" lớp thường ở hồ sơ HV (`RatioAttempts`) — cùng mẫu K4-33 (một cột Kết quả, bỏ "Hồ sơ đợt ›") nếu chủ sản phẩm muốn thống nhất | PR-UXF | ngoài F8 (F8 chỉ bảng Mock Test) |
| Nhận xét hiện trong dòng thời gian (`DongThoiGianLuot` đọc `score.nhan_xet`) nếu cần truy vết | PR-Dọn | Q4 — hiện chỉ ghi nhật ký |
| Mockup M10 vẽ lại theo ảnh thật PR này (trạng thái huỷ/lịch sử/vắng/RF, W hai hàng TA/TR) | planning | §4.9 "mockup phải sửa" |

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | Nhận xét lưu theo **bài nhập** (W1, W2, S — ba ô), không theo kỹ năng; hồ sơ Mock gộp "Nhận xét Writing" thành hai phần Task 1 / Task 2; Excel gộp bằng `nhanXetW` | W1, W2 có thể hai GV khác nhau (K4-31); một ô chung thì người sau ghi đè người trước |
| Q2 | GV chấm chỉ **Speaking**; lưu tài khoản **hoặc** tên người ngoài (một trong hai), chọn bằng `ChonNguoi nhom="nhan_vien"` | YC-13.5 "S thêm tên GV chấm"; YC-10 nhập được người ngoài |
| Q3 | "Chọn một lần" = nhớ **trên máy** (`localStorage`) theo lớp × tuần, gửi kèm mỗi lần lưu S; mặc định "Tôi" nếu người xem được phân công S | K4-24; không cần bảng mới cho một lựa chọn giao diện |
| Q4 | Sửa nhận xét / GV chấm: **không** lý do, **không** đổi "Nhập bởi", **không** tính lại SOS; ghi nhật ký `score.nhan_xet` (chưa hiện ở dòng thời gian) | K4 §4f "sửa nhận xét không cần lý do (không phải điểm)" |
| Q5 | Quyền sửa nhận xét = quyền sửa ô điểm đó (R11 hoàn tất → chỉ Quản lý; MT lịch sử → thêm GVCN) | Một luật quyền, không luật thứ hai |
| Q6 | Ô **mất hết điểm** (Huỷ điểm, Thi lại, xoá tay) thì nhận xét + GV chấm cũng xoá; nhật ký giữ bản cũ | Nhận xét nói về bài đã chấm; thi lại là bài mới |
| Q7 | Nhận xét ghi được cả khi ô **chưa** có điểm (GV ghi trước khi chấm), nhưng không với ô vắng / huỷ / ngoài phạm vi (`saveScore` đã chặn) | Không bó thứ tự làm việc của GV |
| Q8 | Lưới máy tính: "+ Nhận xét" chỉ trong **hộp 4 tiêu chí của ô chưa có điểm**; ô đã có điểm sửa nhận xét ở **hồ sơ Mock** (nơi chính) hoặc ✎ điện thoại | K4-24/§4f; hộp hiệu chỉnh (RB-5) giữ gọn một việc |
| Q9 | Ô lớn mở trình sửa **dưới dải**, dùng lại `InlineScoreEditor` (W hai hàng); bảng lịch dưới bỏ cột Điểm + dòng "Writing (tổng)" | YC-13.8 "sửa tại chỗ"; một chỗ có điểm; không trình sửa thứ hai |
| Q10 | E8: máy chủ `canEdit`/`viec` loại `absent` (một chỗ) — lưới, điện thoại, hồ sơ Mock cùng luật | T53 Q6 "môn đã xác nhận vắng không nhập trong lưới; muốn nhập bù thì Quản lý Khôi phục trước" |
| Q11 | C2: nút **"Vắng"** ghi ngay + **Hoàn tác 5 s** (không hỏi lại) — FT và lớp thường | UX-C C2 cho chọn một trong hai; một chạm giữ tốc độ chấm cả lớp; `toast.hoanTac` có sẵn (PR-N1) |
| Q12 | Lưới FT thêm **cột W** 56 px chỉ đọc sau W2 (không phải dòng phụ dưới W2) | K4-26; giữ ô cao 64 px (G-2); cùng cách hồ sơ HV (PR-N1 Q14) |
| Q13 | Lịch Test: cột Chi nhánh của hàng lớp dời ra **sau** Kỹ năng để ba cột đầu thẳng với bảng Nợ | E5 "dùng chung độ rộng ba cột đầu" |
| Q14 | Hồ sơ HV: ô MT{n} là liên kết (bàn phím), bỏ "Hồ sơ đợt ›" chỉ ở bảng Mock Test | K4-33; a11y — hàng bấm được không vào được bằng Tab |
| Q15 | Không chạy `impeccable colorize` (spec §7.2 có ghi) — dùng `layout`/`polish` và token màu có sẵn | `CLAUDE.md` gốc repo chỉ cho `polish/clarify/layout/harden/adapt` + `audit` ở session code |
| Q16 | Không vẽ lại mockup M10 trong PR; ảnh thật `thiet-ke/anh/pr-hsm/` thay mockup, planning cập nhật sau | Mockup ghi "vẽ đủ khi soạn PR-HSM" — kế hoạch này mô tả đủ trạng thái bằng chữ (Task 5) |
| Q17 | Nhãn lượt "Đang chấm · 2/4" (`nhanLuot`) thay "Đã lên lịch" khi đã có ≥ 1 kỹ năng — dùng ở lưới FT và hồ sơ Mock | F8 cùng lớp lỗi ở hai chỗ nữa |
| Q18 | Demo H1–H4 do planning đặt, dựa trên em demo của PR-XLMT/PR-MT | K5 §6 không có dòng cho PR-HSM |

## Mâu thuẫn nguồn ↔ mã thật

1. Đặc tả §7.2 giao `impeccable colorize` cho PR-HSM ↔ `CLAUDE.md` (PR #107, mới hơn) chỉ cho `polish/clarify/layout/harden/adapt/audit` → theo
   `CLAUDE.md` (Q15); ghi vào báo cáo cho chủ sản phẩm.
2. Mockup M10 (`:704-705`) một ô "Nhận xét Writing · thầy Lê Minh Khoa" ↔ K4-31 (W1, W2 có thể hai người) → hai phần Task 1 / Task 2 (Q1).
3. Mockup M10 (`:722`) còn ghi "phải vẽ khi soạn PR-HSM: lượt đã huỷ, MT lịch sử, kỹ năng vắng/dời, lượt RF" — kế hoạch mô tả bằng chữ
   (Task 5) thay vì vẽ (Q16); quyền sửa theo `cell.canEdit` của máy chủ (đã gồm GVCN với MT lịch sử — PR-MT M3), web không tự suy.
4. `MockDetailPage.tsx:205,210` truyền `failedCount` vào `KetQuaDot sos` → 4 môn trượt ra "SOS 4"; máy chủ đã có `sosLevel` chặn trần 3 (rà #119).
5. `skillCells` `canEdit` (:385) không loại `absent` trong khi `saveScore` (:1426) chặn → lưới mở ô nhập rồi máy chủ từ chối (E8); hồ sơ Mock tự
   vá riêng bằng `canScore` (:362-363).
6. `CriteriaModal` (:464) không có Enter-để-lưu dù T39 viết "Enter ở ô tiêu chí **vẫn** là Lưu" → thêm (Task 3).
7. Đặc tả YC-13.5 ghi cột `examiner_user_id`, `examiner_name`; không có cột người viết nhận xét → hồ sơ Mock ghi **người nhập điểm** của bài cạnh
   nhận xét, người sửa nhận xét nằm ở nhật ký (không thêm cột — 🛑 nếu cần).
8. Đã xong ở PR trước, không làm lại: chip điện thoại đếm đúng mẫu số (E8 phần 2 — `MotKyNang.tsx:133`); menu thao tác theo trạng thái, hộp chung,
   dòng thời gian, thẻ đề nghị dời ở hồ sơ Mock (PR-XLMT); `ChipLichSu`, hồ sơ Mock lượt lịch sử không hạn (PR-MT); Toast hoàn tác chung (PR-N1 C1);
   Lịch sử một bài lớp thường (PR-XLMT, K4-32).

## Câu cần chủ sản phẩm quyết

Không có câu bắt buộc — mọi điểm mở đã vào bảng Q theo khuyến nghị. Hai dòng nên xem: **Q1** (nhận xét Writing tách Task 1 / Task 2) và **Q11**
(nút "Vắng" ghi ngay + Hoàn tác thay vì hỏi lại). Gạch dòng nào thì session code đổi trước Task 3.

## Nhật ký thực thi

<!-- Session code ghi ở đây: mốc B, dòng mã thật lệch, phép kiểm cũ phải sửa, trước/sau clarify, 🛑 đã hỏi, id GV Writing demo, model thật. -->

- **30/09 · Task 0** — model thật **Opus 5.5** (phương án B). Nhánh `pr-hsm-ho-so-mock` từ `origin/main` e7d6af94 (kế hoạch đã có trên main).
  **Mốc B = 1722 phép kiểm** (+ 24 tốc độ). Đối chiếu dòng mã: khớp hết (lệch 0).
- **Task 1** — 1727 đạt. Phép kiểm cũ sửa dữ liệu (không xoá): `xoaDuLieu.tests.ts` PR-XOA T1 đếm cột FK trỏ `users` 73 → **74**
  (`assessment_scores.examiner_user_id` phân loại **dấu vết** "điểm đã nhập" ở `xoaTaiKhoan.ts` — GV chấm = đã làm việc, xoá mềm).
  `CRITERIA`/`CRITERIA_SHORT`/`criteriaSetFor` đã xoá ở Task 1 (chỉ `ScoreEntry.tsx` dùng) thay vì chờ Task 3.
- **Task 2** — 1736 đạt. `/students/1` +1 câu (91→92 QL, 93→94 GVCN/GVBM) — dưới trần 100, không nâng. Thêm nhãn nhật ký
  `score.nhan_xet` = "Sửa nhận xét" (`nhatKy.ts`; phép kiểm N1 (11) đòi mọi hành động có nhãn tiếng Việt). Hoàn tất R11 trong
  phép kiểm cần đủ 4 kỹ năng có điểm (`dotDaHoanTat`) — dữ liệu dựng thêm L/R/W1/W2.
- **Task 3 · clarify** — trước → sau: nút điện thoại "−" (chỉ dấu) → **"Vắng"** (tên đọc màn hình "Vắng — Không có bài — em có lịch mà
  không làm bài", khớp chữ thấy); toast "Đã ghi vắng {môn} · {em}" + Hoàn tác, lớp thường thêm hệ quả " — dời sang tuần sau"; lỗi nhập
  chỉ ở tooltip → **một dòng dưới ô** (`role="alert"`, câu đầy đủ, cắt hiển thị có tooltip); ô vắng "—" → **"vắng"** + "Đã xác nhận
  vắng — Quản lý xếp lại bài trước khi nhập."; hộp tiêu chí thêm "+ Nhận xét" → "Nhận xét (không bắt buộc)", "GV chấm · Đổi"; đầu cột S
  "GV chấm: {tên} ▾" / "GV chấm: chưa chọn", câu giải thích giữ nguyên kế hoạch. impeccable: không có PRODUCT.md (không init — CLAUDE.md).
  1737 đạt (lần 1 segfault 139, chạy lại xanh).
- **Task 4** — 1738 đạt. `layout` (xét trên mã, ảnh ở Task 9): cột S nới **104 → 150 px** để nút "GV chấm: {tên} ▾" nằm dưới "S (band)"
  không cắt tên ngắn; cột W 56 px sau W2; mọi cột số lưới FT căn phải (tiêu đề + ô); lớp thường ô đúng/tổng căn phải, đầu cột
  "tổng + Điền cả cột" gói dòng (`flex-wrap`, cột 136 px); câu lỗi dưới ô cắt ở 104 px (tooltip + DOM giữ câu đủ); điện thoại: dòng
  W/S không sửa được có chỗ trống 44 px thay ✎ để số thẳng cột. `nhanLuot` đặt ở `shared/domain/fasttrack.ts` (bộ kiểm đọc được).
  Lịch Test: `COT_DAU_LICH_TEST = [190, 120, 110]`; bảng Nợ đổi 150/110/auto → 190/120/110, cột trạng thái thành auto.
- **Task 5** — 1739 đạt. **Tầng 1 của màn này là: 4 điểm kỹ năng + Overall.** layout/harden/adapt xét trên mã (ảnh ở Task 9):
  tên dài `break-words`; nhận xét 1000 ký tự `pre-wrap break-words`, ô tự cao; lỗi mạng khi lưu nhận xét → "Chưa lưu — thử lại" giữ chữ;
  không quyền → chữ thường, phần rỗng ẩn; 375 px `grid-cols-2`, Overall `col-span-2`, dòng phụ `truncate` + tooltip. "Mở lại lượt"
  dời từ menu "Chỉnh lịch" ra dải "Đã huỷ" (một chỗ, không lặp). Bảng dưới đổi tên "Lịch kiểm tra" (không còn điểm). `NutGvCham`
  thêm `goiY` (hồ sơ Mock: "Lưu ngay cho bài Speaking này.").
- **Task 6** — 1740 đạt. Nhãn cạnh MT: khi đã có chip `lịch sử` thì còn 1 chỗ cho nhãn khác (tổng ≤ 2), dư → `+n`.
- **Task 7** — 1740 đạt. H1 Tạ Minh Quân MT3 (lượt 167): nhận xét W1/W2/S + GV chấm Phạm Thu Trang (id 9). H2 Nguyễn Minh An MT1
  (lượt 5): GV chấm "Cô Lan (giám khảo ngoài)". H3/H4 dùng dữ liệu có sẵn (không thêm vào `hsmSeed.ts`): lượt huỷ = Phạm Khánh Linh MT3
  (159) · MT lịch sử = Đoàn Khánh Chi MT1–3 (180–182) · chờ duyệt = Kiều Thu Trang MT1 (174) · huỷ phần = Mạc Đức Long MT1 (177) ·
  RF = Phan Gia Hân (138) · Lương Bảo Anh MT3 (170). **GV Writing của `MB FT 101`: W1 Lê Minh Khoa id 8 · W2 Cao Khánh Linh id 10.**
- **Task 9 · bấm thử + audit/polish** — không có commit mới trên `origin/main` (không rebase). Bấm thử API 4157 / Vite 5357 (bản `main`
  4158 / 5358 ở thư mục tạm để chụp ảnh "trước"), Playwright kênh Chrome: **K1–K7, K9–K15 đạt** (K8 có phép kiểm đọc nguồn). Ghi nhận:
  lượt H1 (Quân MT3) đã **hoàn tất** → GVBM Trang chỉ xem (đúng R11); K1b dùng Lương Bảo Anh MT3 (Trang chỉ bấm được ô S), K2–K3 dùng
  Quản lý Vy, K4 dùng GV W1 Khoa trên lượt 170. Sửa sau audit: (1) lưới FT cuộn ngang ở 1440 → Hạn 200→140, S 150→130, Kết quả 176→150
  (bảng đúng 1400 px), ô Hạn gói dòng thay vì tràn sang cột L; (2) ô chỉ đọc/ô nhập căn phải (`items-end`); (3) "vắng" theo
  `sitStatus === 'absent'` (đang chờ duyệt dời có `progress = reschedule_pending`); (4) bảng lớp Lịch Test có cột tự giãn → ba cột đầu
  đúng 190/120/110 như bảng Nợ. Detector impeccable: 0 phát hiện. Ảnh ở `thiet-ke/anh/pr-hsm/` (`*-truoc.png` / `*-sau.png`).
- **Task 9b (chủ sản phẩm thêm 30/09, ngoài kế hoạch)** — "GV có dạy Speaking được nhập điểm S Mock". Chủ sản phẩm chọn: **cùng chi
  nhánh · chỉ là quyền (không thành việc) · làm trong PR-HSM**. Làm: `lopFtChoGvSpeaking` ở `permissions.ts` (GV có phân công S đang hiệu
  lực ở lớp FT + vai giáo viên còn quyền nhập điểm ở chi nhánh đó → mọi lớp FT cùng chi nhánh), nối vào `editableSkills` (trừ nhánh
  `chiViec`), `scoreEditPath` (`assigned` → nhật ký `score.edit`), `teacherAllows(ATTEMPT_VIEW)` **chỉ khi hỏi theo lớp**; Lịch Test
  thêm các lớp này vào "Tất cả". **Không** mở rộng `scopeFor(ATTEMPT_VIEW)` chung (sẽ lộ Case/tín hiệu/việc/hồ sơ HV lớp khác) và không
  đổi `mySkills`. Phép kiểm HSM (7). 1741 đạt. Người rà: xem kỹ phần quyền này.
