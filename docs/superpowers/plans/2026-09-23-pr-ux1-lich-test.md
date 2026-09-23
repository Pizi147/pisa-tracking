# PR-UX1 · Lịch Test chấm tại chỗ (bỏ Cần chấm) — Implementation Plan

> **For agentic workers:** KHÔNG dùng `superpowers:subagent-driven-development` — theo khối **Quy trình nhanh** bên dưới.
> Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi.

**Goal:** Khu Test chỉ còn **Lịch Test · Kế hoạch Test**. Lịch Test (mockup 13, phương án B) gộp việc của tab Cần chấm:
một hàng lọc (tuần · Lớp tôi dạy/Tất cả · chi nhánh), dải số bấm được (đã chấm x/y · còn phải chấm · nợ tuần trước ·
quá hạn), khối **Nợ tuần trước** (bấm Chấm/Xem mở lưới ngay dưới dòng, chỉ các em còn nợ), tab nhỏ **Fast Track · n
lớp | Lớp thường · n lớp**, mỗi lớp một **hàng lớn** thu gọn, tự mở lớp còn bài của người xem; mở ra là **lưới chấm
có sẵn nhúng tại chỗ**. Mọi lối cũ tới `/test/can-cham` về Lịch Test đúng lớp/kỹ năng.

**Architecture:** Máy chủ mở rộng `lichTest` (`server/src/cham/canCham.ts`) thành MỘT lời gọi trả đủ: tuần, dải số,
khối Nợ, danh sách lớp kèm nhãn + cờ tự mở — tính trong bộ nhớ từ hai nguồn đã có (câu SQL của `lichTest` và
`listAttempts` mà `canChamList` đang dùng), không hỏi theo từng lớp. `canChamList` đổi thành `noTuanTruoc` (cùng luật
đếm `conBaiCanCham`, lọc tuần < tuần đang xem). Web tách phần "tải + chọn lưới" của `ChamDiemPage` ra
`web/src/modules/cham/LuoiChamLop.tsx`, dùng chung cho trang lưới đầy đủ và cho Lịch Test (không viết lại luật chấm).
Luật thuần (nhãn lớp, cờ tự mở, đường dẫn Lịch Test) ở `shared/domain`.

**Tech Stack:** TypeScript · React 18 + Vite · Express · libsql/better-sqlite3 · Tailwind; phép kiểm `server/src/tests/*`
harness `check()`, chạy `npm run check`.

**Spec:** `docs/superpowers/specs/2026-09-23-overhaul-giao-dien-design.md` §1 (N-1…N-4), **§2 "Lịch Test"**, §6 ·
mockup `thiet-ke/mockup/13-lich-test.html` (phần 1, 1b, 2, **3 phương án B**, 4) · `17-hang-va-badge.html` (a1 phương
án A, b1) · luật chung `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §1 G-1…G-12, §2 · chữ
`thiet-ke/THUAT_NGU_DA_CHOT.md`. Đặc tả + mockup nằm trên nhánh `origin/ke-hoach-overhaul`
(`git show origin/ke-hoach-overhaul:<path>`).

| Mục | Chốt |
|---|---|
| Mã PR | **PR-UX1** · Lịch Test |
| Nhánh · worktree | `pr-ux1-lich-test` · `.claude/worktrees/pr-ux1-lich-test` · một PR, không draft, **không tự merge** |
| Cổng thử | **API 4397 · Vite 5597** (không 4000/5173, không cổng PR khác) |
| Model | **Opus 5.5 · High** · phương án B: **Sonnet 5 · High** |
| Người rà | **Fable 5.1** (khác model người code) |
| Migrate | **KHÔNG.** Không đổi `server/src/schema.sql`, `server/src/migrate.ts` |
| Phụ thuộc | **Merge sau PR-UX0 và PR-Z2c-c.** Task 0 kiểm cả hai đã vào `origin/main`. Chưa có UX0 → làm Task 1–3 (không chạm file UX0), rebase khi UX0 merge rồi mới làm Task 4–6. Chưa có Z2c-c → **chờ** (Task 4 sửa `LuoiThuong.tsx` mà Z2c-c đang sửa). Song song UX2 (khác file) |
| File KHÔNG được chạm | **UX2:** `server/src/keHoach/*`, `web/src/modules/test/keHoach/*`, `web/src/modules/test/KeHoachTestTab.tsx` · **UX3:** `web/src/modules/cases/*`, `web/src/modules/yThuc/*`, `classes/ChuyenLopPanel.tsx`, `LoTrinhTiepPanel.tsx`, `SkillBoard.tsx`, `StudentDetailPage.tsx` · **UX0 (chỉ dùng, không sửa):** `web/src/ui/HangNhom.tsx`, `web/src/ui/KhungPanel.tsx`, `web/src/ui/Nhan.tsx`, `web/src/index.css`, `shared/domain/display.ts`, `web/src/modules/worklist/WorkList.tsx`, `web/src/ui/ui.tsx` · **Z2c-c (đã merge, không sửa thêm):** `web/src/ui/Filters.tsx`, `web/src/modules/fasttrack/ScoreEntry.tsx`, `server/src/fasttrack/attempts.ts`, `scoreDebt.ts`, `server/src/classes/classes.ts`, `server/src/db.ts`, `server/src/app.ts` |

### Chồng file (sửa ít, đúng chỗ)

| File | PR khác | UX1 sửa gì |
|---|---|---|
| `server/src/worklist/mywork.ts` | UX0 Task 3 (bỏ `overdueLabel`, thêm `tieuDe`, sửa `gomBaiChuaCham` — merge trước) | **Một dòng** `href` trong `gomBaiChuaCham` (~:373) |
| `web/src/modules/students/StudentsPage.tsx`, `web/src/modules/classes/DauTrangLop.tsx` | UX0 Task 4 (`HopLop` :219-275, `DauTrangLop` :57-66 — merge trước) | **Một dòng** đích badge `cham` mỗi file (:234, :66) + chú thích :221 |
| `web/src/modules/cham/LuoiThuong.tsx` | Z2c-c (merge trước) | Thêm prop `tuanDangXem` (Task 4), không đụng luật Enter/tổng |
| `server/src/routes/index.ts`, `server/src/tests/tocDoDuong.ts`, `CODE_MAP.md`, `plan.md` | mọi PR | Chỉ sửa khối `/cham/*` và dòng Cần chấm/Lịch Test; xung đột → giữ cả hai |

**Con trỏ mã** đo trên `main` @ `b13e647` (sau PR-LT #86, trước UX0/Z2c-c) → Task 0 đối chiếu lại.

## Quy trình nhanh (bắt buộc)

- **Không** rà từng Task bằng subagent. Tự code từng Task, `npm run check` sau mỗi Task (xanh, **số phép kiểm không
  giảm**), rồi commit. **Chỉ một** lần `npm run check` chạy một lúc (chạy chồng → `run.js` treo: quét và tắt tiến trình
  cũ trước khi chạy lại). Có dùng subagent thì cùng model, **không Haiku**.
- Không chụp ảnh từng Task. Bấm thử theo vai (**QL = 2, GVCN = 7, GVBM = 9**) + 375px **một lần** ở Task 8 bằng **ảnh
  thật** (Playwright kênh Chrome), lưu `thiet-ke/anh/pr-ux1/`.
- Task 0 tạo worktree + nhánh từ `origin/main` mới nhất và chép kế hoạch vào nhánh. Cuối PR: push, mở PR, báo planning.
  Không tự rà code cuối PR (planning rà bằng model khác).
- Commit ghi **đúng** dòng `Co-Authored-By` của model thật đang chạy.
- Tắt mọi tiến trình node/vite của mình trước khi kết thúc. Không chạy lệnh nào vào Turso, không deploy.
- Gặp mã lệch **hình dạng** so với kế hoạch (không chỉ lệch dòng) → ghi Nhật ký, khớp mã thật, không dựng song song.

## Global Constraints

| Mã | Luật áp ở PR này |
|---|---|
| N-1 Màu | Chỉ dùng token + lớp Tailwind của UX0 (`text-late`, `text-soon`, `bg-*-bg`… dựng từ `--ok --bad --late --soon --doing --done --wait --muted`, `.o-sua`/`.o-doc`). Không mã màu cứng mới. Chữ tương phản ≥ 4.5:1 |
| N-2 Hàng lớn/nhỏ | Danh sách lớp là **một bảng** (tiêu đề cột một lần): mỗi lớp `HangNhom` (hàng lớn, `<tr className="hang-lon">`, `MuiTenMo` ▸/▾ tooltip "Mở"/"Thu gọn"); lưới nhúng nằm trong `HangCon` (`<tr className="hang-con"><td colSpan>`). Khối Nợ là `KhoiNhom` (`dem`, `phu`). Tất cả từ `web/src/ui/HangNhom.tsx` của UX0 — không tự dựng component hàng |
| N-3 Badge | Mỗi hàng **một** `Nhan` ≤ 3 từ: `Chờ bạn chấm` (tone `soon`) · `Chờ GV khác` / `Chờ chấm` (`wait`) · `Đã chấm ✓` (`done`) · `Chưa tới hạn` (`muted`). Hạn ở **cột riêng** qua `<Han loai="nhap-diem">` của UX0 — `<Han>` tự gắn `QuaHan` khi quá hạn, nên **không** thêm badge "Quá hạn" (mockup 17 B-5: quá hạn nói một lần) |
| N-4 | Không mở panel ở PR này: lưới mở **ngay dưới dòng** (không chồng panel, G-8) |
| G-1 | ✓ nhỏ, mảnh, cùng màu chữ phụ (`Đã chấm ✓`, dấu đã lưu của lưới giữ nguyên) |
| G-2 | Hàng lớp dùng lưới cột cố định (`grid-template-columns` cố định), số `tabular-nums`, các hàng cao bằng nhau |
| G-3 | Tối đa một dòng phụ; luật dài vào ⓘ (`web/src/ui/NutLuat.tsx`) |
| G-4 | ⚠ chỉ cho quá hạn |
| G-5 | Luật lớp thường nằm trong ⓘ cạnh tab "Lớp thường", không in khối chữ |
| G-6 | Tuần `W3 SEP` qua `tuanLich()`, ngày `dd/mm` qua `ngay()`; thứ ngắn `T4` ở chỗ chật (THUAT_NGU g13-032). Không ISO, không "tuần 36" |
| G-7 | `L R W1 W2 S`, `FT`, `KV` có tooltip tên đầy đủ; ▸ ▾ ⓘ ✓ ↗ có tooltip |
| G-10 | Bốn số của dải số **bấm được**, mở đúng phần tạo ra số đó (Task 5) |
| G-11 | 375px: một kỹ năng một lúc (`MotKyNang`), trang không cuộn ngang; nút ≥ 44px |
| G-12 | Lối vào "Chấm điểm" đổi từ Cần chấm sang Lịch Test — cập nhật `CODE_MAP.md` (Task 7); bảng định vị ở đặc tả là việc của planning |
| Chữ | `Lịch Test` · `Kế hoạch Test` · `Tuần này đã chấm {x}/{y} bài` · `Còn phải chấm {n} bài` · `Nợ tuần trước {n} bài · {m} lớp` · `Quá hạn {n} bài` · `Fast Track · {n} lớp` · `Lớp thường · {n} lớp` · `{x}/{y} bài` · `Chấm` (g3-029) · `Xem` · `Mở lưới đầy đủ ↗` · `Lớp tôi dạy` · `Tất cả` · `Mở tất cả` / `Thu tất cả` · `Đang lọc: lớp {mã} ✕` · `lùi lịch` (Q15 Rc1) · `Giữa khoá` / `Cuối khoá` (không "MT" cho lớp thường) · không "Normal", không mở câu bằng "Hãy" |

## Bảng Q — planning tự quyết (người rà kiểm lại)

| # | Câu hỏi | Quyết định | Lý do |
|---|---|---|---|
| Q1 | Bỏ hẳn `canChamList` + `GET /cham/can-cham` hay giữ | **Bỏ route**, đổi hàm thành `noTuanTruoc` (giữ vòng gom + `dungLuiLich`). Phép kiểm cũ của Cần chấm **chuyển** sang `noTuanTruoc`/`lichTest`, không xoá | Không còn màn nào gọi; giữ lại là mã chết. Chuyển phép kiểm để số không giảm và luật "một tập bài với badge" vẫn được giữ |
| Q2 | "Nợ tuần trước" tính thế nào | Ô còn nợ (luật `conBaiCanCham` của `listAttempts`, phạm vi `managed`) có **tuần thi < tuần đang xem** (mọi tuần trước, không chỉ tuần liền trước). Một dòng = **lớp + đợt + tuần** | Cùng tập bài với badge "n bài chờ chấm" và Việc cần làm → ba nơi không lệch số. Tách theo tuần để bấm Chấm mở đúng lưới tuần đó |
| Q3 | Khối Nợ của GV gồm môn người khác không | **Có** (phạm vi `managed` trong các lớp đang lọc); dòng không phải môn mình → nút `Xem` | Mockup 13: GV Hà dạy L thấy dòng "S · … · Xem" |
| Q4 | "Lớp tôi dạy / Tất cả" nghĩa là gì | Lọc **lớp**: `cua-toi` = lớp người xem có phân công đang hiệu lực; `tat-ca` = cả phạm vi `ATTEMPT_VIEW`. Mặc định `cua-toi` khi có phân công (`defaultWorkScope(p) === 'mine'`). **Chỉ hiện nút** khi hai tập khác nhau (`coPhamViRong`) | GV thuần chỉ xem được lớp mình dạy (`scopeFor` :430) → hai lựa chọn giống hệt nhau, hiện nút là nút chết |
| Q5 | Dải số đếm gì | `tong` = số ô (em × môn, còn ngồi thi) của tuần đang xem trong các lớp đang lọc; `daCham = tong − conPhaiCham` (ô ghi "-" tính là đã xử lý, như `lichTest` cũ :368); `no` = Q2; `quaHan` = số **ô** còn nợ có hạn < hôm nay (cả Nợ lẫn tuần đang xem) | Khớp số mockup (32/57, còn 25 = 57 − 32) |
| Q6 | Nhãn lớp khi QL (không chấm) | `Chờ chấm`; GV có dạy lớp mà không còn bài mình → `Chờ GV khác` | "GV khác" sai nghĩa với người không chấm (mockup 17 B-1 có "Chờ chấm") |
| Q7 | Thứ tự ưu tiên nhãn | `Đã chấm ✓` (conBai = 0) → `Chưa tới hạn` (tuần sau hôm nay) → `⚠ Quá hạn n ngày` → `Chờ bạn chấm` → `Chờ GV khác`/`Chờ chấm` | Quá hạn gấp hơn "của ai" (G-4) |
| Q8 | Tự mở lớp nào | GV (có phân công): `conBaiCuaToi > 0`; QL: `conBai > 0`. Người xem đã tự bấm mở/thu lớp nào thì nhớ trong `localStorage` theo tuần, lần sau theo đó | Mockup 13 (3)B + "Trình duyệt nhớ lớp nào bạn đã mở" |
| Q9 | Hàng lớn theo lớp hay lớp + đợt | FT: **một hàng mỗi lớp** (lưới tuần FT gồm mọi MT trong tuần); lớp thường: **lớp + bài** (`classId:kind`) vì lưới lớp thường là một bài | Khớp cách `ChamDiemPage` tải lưới (`periodId` cho FT, `kind` cho lớp thường) |
| Q10 | Lưới nhúng khác lưới đầy đủ ở đâu | Cùng component. Thêm prop `gon` (bỏ cột MT/Trạng thái/Hạn của FT — giữ cột MT khi tuần có > 1 lượt MT), `tuanDangXem` (ô **chưa có điểm** thi tuần khác → chữ mờ `W4 SEP`), `chiAttempt` (khối Nợ: chỉ các em còn nợ) | Mockup 13 (1) + (2) "Kỹ năng không thi tuần này"; luật chấm không đổi |
| Q11 | Đường dẫn Lịch Test mang gì | `/test/lich?periodId=&branchId=&phamVi=&loai=ft|thuong&classId=&kn=`. `classId` → chip `Đang lọc: lớp {mã} ✕` + lọc cả Nợ lẫn danh sách + tự mở đúng lớp (hoặc dòng Nợ đầu của lớp đó); `kn` → con trỏ vào ô trống đầu của môn đó | Giữ hành vi Q12/Q13 của Rc1 (mở đúng lớp, nói rõ đang lọc) |
| Q12 | `/test/can-cham?...&scope=mine` | Chuyển `/test/lich`, giữ `classId`, `kn`, `branchId`; **bỏ `scope`** | Lịch Test mặc định "Lớp tôi dạy" cho GV; `scope` không còn nghĩa |
| Q13 | Việc cần làm › Chấm điểm (đang về `/mock-test/:id` / `/bang-diem-thuong`) | `href` = `duongLichTest({ classId, kn: môn đầu của nhóm })`; bài không có lớp giữ `attemptHref` | Mockup 13: "Việc cần làm › nhóm Chấm điểm › nút Chấm (mở đúng lớp, đúng cột)". Không sửa `attempts.ts` (Z2c-c) nên không kèm `periodId` — ô nợ tuần trước tự nằm ở khối Nợ |
| Q14 | Lưu điểm trong lưới nhúng thì dải số/nhãn cập nhật thế nào | Tải lại `/cham/lich-test` **gộp 1,5 s** sau lần lưu cuối; dòng Nợ đang mở **giữ trên màn** dù máy chủ không còn trả (hiện `Đã chấm ✓`) cho tới khi người dùng thu lại | Tải lại mỗi ô làm nặng Turso; dòng biến mất giữa lúc gõ là mất ô đang nhập |
| Q15 | Hàng tab khu Test khi chỉ một tab | Ẩn cả hàng tab (GV), chỉ còn tiêu đề "Test" | Mockup 13 (1) |
| Q16 | Cờ `testGrade` ở `NavQuyen` | Giữ cờ (shape dùng chung); tab `lich` hiện khi `testSchedule || testGrade` | Không đổi `server/src/platform/nav.ts` |

---

## Bản đồ file

| File | Tạo/Sửa | Task |
|---|---|---|
| `shared/domain/dieuHuong.ts` | Sửa: `TabTest` (:8), `TAB_TEST*` (:63-68), `tabTestMacDinh` (:80-84), `duongMoi` (:148-154), thêm `duongLichTest` | 1 |
| `shared/domain/hocVienLop.ts` | Sửa :54 | 1 |
| `shared/domain/chamDiem.ts` | Bỏ `MucCanCham`/`MUC_CAN_CHAM*`/`mucCanCham`/`nhomCanCham` (:10-40); thêm `nhanLopLichTest`, `lopTuMo` | 1 |
| `server/src/cham/canCham.ts` | `canChamList` (:176-271) → `noTuanTruoc`; `lichTest` (:298-385) mở rộng | 2 |
| `server/src/routes/index.ts` | Bỏ `/cham/can-cham` (:775-781); `/cham/lich-test` (:783-788) nhận `phamVi`, `classId` | 2 |
| `server/src/worklist/mywork.ts` | Một dòng `href` (:373) | 3 |
| `web/src/modules/students/StudentsPage.tsx` :221, :234 · `web/src/modules/classes/DauTrangLop.tsx` :66 | Đích badge | 3 |
| `server/src/tests/tocDoDuong.ts` | Bỏ dòng `/cham/can-cham` (:96, trần :303-307), thêm 2 dòng Lịch Test, trần mới | 3 |
| `web/src/modules/cham/LuoiChamLop.tsx` | **Tạo** (tách từ `ChamDiemPage.tsx` :16-39, :97-126, :204-221) | 4 |
| `web/src/modules/cham/ChamDiemPage.tsx`, `LuoiFT.tsx`, `LuoiThuong.tsx` | Sửa (Q10) | 4 |
| `web/src/modules/test/TestPage.tsx` | Sửa; **xoá** `CanChamTab.tsx` | 1 (xoá, để typecheck xanh) · 5 |
| `web/src/modules/test/LichTestTab.tsx` | Viết lại | 5–6 |
| `web/src/modules/test/lichTest/{DaiSo,KhoiNo,HangLop,moLop}.tsx/.ts` | **Tạo** | 5–6 |
| `server/src/tests/chamDiem.tests.ts`, `khung.tests.ts`, `hocVienLop.tests.ts` | Sửa/thêm phép | 1–3 |
| `CODE_MAP.md` (:24, :26, :39, :208-212), `plan.md` | Sửa | 7 |

---

### Task 0: Chuẩn bị

- [ ] **1.** `git fetch origin`. Kiểm `git log origin/main --oneline | grep -iE "ux0|z2c-c"` thấy **cả hai** merge (xem cột
  Phụ thuộc). Tạo worktree `.claude/worktrees/pr-ux1-lich-test`, nhánh `pr-ux1-lich-test` **từ `origin/main`**. Không
  checkout nhánh khác trong thư mục chính. `npm ci` nếu thiếu `node_modules`.
- [ ] **2.** Chép file này vào nhánh (`docs/superpowers/plans/2026-09-23-pr-ux1-lich-test.md`), commit `PR-UX1 (0): ke hoach`.
- [ ] **3.** Không có biến Turso trong môi trường. `npm run check 2>&1 | tail -3` → ghi số **B** vào Nhật ký.
- [ ] **4. Đối chiếu, ghi Nhật ký dòng thật:** (a) tên + props thật của component hàng lớn/con, badge, token màu trong
  kế hoạch UX0 (`docs/superpowers/plans/2026-09-23-pr-ux0-*.md`) và mã `web/src/ui/`; (b) `WeekPicker` sau Z2c-c (props,
  cách phát `periodId`); (c) `LuoiThuong.tsx` sau Z2c-c (dòng `DongThuong`, chỗ vẽ ô); (d) `mywork.ts` sau UX0 (dòng
  `href` của `gomBaiChuaCham`); (e) `hasAssignment(p, ctx, 'skill')` (`permissions.ts`) so `ctx.skill` với môn đánh giá
  (`writing`) hay môn nhập (`writing1`) — quyết cách gọi `mySkills` ở Task 2 bước 3.

---

### Task 1: Luật thuần — điều hướng, nhãn lớp, cờ tự mở

**Files:** `shared/domain/dieuHuong.ts`, `shared/domain/hocVienLop.ts:54`, `shared/domain/chamDiem.ts`,
`server/src/tests/khung.tests.ts`, `server/src/tests/hocVienLop.tests.ts:88`, `server/src/tests/chamDiem.tests.ts`.

**Produces:** `TabTest = 'lich' | 'ke-hoach'` · `duongLichTest(o: { classId?: number | null; periodId?: number | null;
kn?: string | null; branchId?: number | null }): string` · `nhanLopLichTest(i): { loai: LoaiNhanLop; chu: string }` ·
`lopTuMo(i): boolean` · `type PhamViLichTest = 'cua-toi' | 'tat-ca'`.

- [ ] **1. `dieuHuong.ts`.** Bỏ `'can-cham'` khỏi `TabTest`, `TAB_TEST`, `TAB_TEST_LABEL`, `DUONG_TAB_TEST`, `HIEN_TEST`;
  `lich: (n) => n.testSchedule || n.testGrade` (Q16). `tabTestMacDinh`: `tabs.includes('lich') ? 'lich' : tabs[0] ?? null`.
  Thêm `duongLichTest` (thứ tự tham số cố định để phép kiểm so chuỗi):
  ```ts
  export function duongLichTest(o: { classId?: number | null; periodId?: number | null; kn?: string | null; branchId?: number | null } = {}) {
    const q = new URLSearchParams();
    if (o.branchId) q.set('branchId', String(o.branchId));
    if (o.periodId) q.set('periodId', String(o.periodId));
    if (o.classId) q.set('classId', String(o.classId));
    if (o.kn) q.set('kn', o.kn);
    return voiThamSo(DUONG_TAB_TEST.lich, q);
  }
  ```
  `duongMoi`: thêm đầu hàm `if (p === '/test/can-cham') { q.delete('scope'); return voiThamSo('/test/lich', q); }` (Q12);
  nhánh `view=my_scores` (:152) → `q.delete('scope')` rồi `'/test/lich'`.
- [ ] **2.** `hocVienLop.ts:54`: `missing_scores` → `{ chuyenDen: '/test/lich' }`.
- [ ] **3. `chamDiem.ts`.** Xoá khối Cần chấm (:10-40, chỉ `canChamList` và `CanChamTab` dùng — `grep` lại cho chắc).
  Thêm (Q6, Q7, Q8):
  ```ts
  export type LoaiNhanLop = 'da-cham' | 'chua-toi-han' | 'cho-ban' | 'cho-gv-khac' | 'cho-cham';
  export function nhanLopLichTest(i: { conBai: number; conBaiCuaToi: number; chuaToiHan: boolean; coDayLop: boolean })
    : { loai: LoaiNhanLop; chu: string } {
    if (i.conBai === 0) return { loai: 'da-cham', chu: 'Đã chấm' };          // web thêm ✓ nhỏ (G-1)
    if (i.chuaToiHan) return { loai: 'chua-toi-han', chu: 'Chưa tới hạn' };
    if (i.conBaiCuaToi > 0) return { loai: 'cho-ban', chu: 'Chờ bạn chấm' };
    return i.coDayLop ? { loai: 'cho-gv-khac', chu: 'Chờ GV khác' } : { loai: 'cho-cham', chu: 'Chờ chấm' };
  }
  export const lopTuMo = (i: { conBai: number; conBaiCuaToi: number; coPhanCong: boolean }) =>
    (i.coPhanCong ? i.conBaiCuaToi > 0 : i.conBai > 0);
  ```
  Giữ `trangThaiChamLabel` (dòng kỹ năng trong `lichTest` còn dùng).
- [ ] **4. Phép kiểm** (sửa phép cũ, thêm 2 phép mới → **B+2**):
  - `khung.tests.ts` :68-77, :127, :137-138: tab QL `lich,ke-hoach`, GV `lich`; mặc định GV **và** QL `lich`; nhãn
    `Lịch Test,Kế hoạch Test`; chuỗi `tabs(n)` GV `…|lich|ho-tro|false|false`; tên phép đổi "GV chỉ Lịch Test". :103 →
    `['/hoc-vien', '?view=my_scores&classId=7&scope=mine', '/test/lich?classId=7']`; thêm vào bảng:
    `['/test/can-cham', '?classId=7&kn=reading&scope=mine&branchId=2', '/test/lich?classId=7&kn=reading&branchId=2']`,
    `['/test/can-cham', '', '/test/lich']`, `['/test/lich', '?classId=7', null]`.
  - `hocVienLop.tests.ts:88` → `'/test/lich'`.
  - `chamDiem.tests.ts:15` (phép Q10 nhóm Cần chấm) **thay** bằng `PR-UX1 · Nhãn hàng lớp Lịch Test: một trạng thái,
    nói của ai` — kiểm đủ 5 nhánh + thứ tự (`conBai:0` → `da-cham` dù `chuaToiHan`; còn bài của tôi → `cho-ban`; QL
    `coDayLop:false` → `Chờ chấm`; mọi `chu` ≤ 3 từ, không chữ "Quá hạn").
  - Mới `PR-UX1 · Lớp tự mở: GV theo bài của mình, QL theo bài còn lại` (4 ca `lopTuMo`).
  - Mới `PR-UX1 · duongLichTest giữ thứ tự tham số, bỏ tham số rỗng` (`{}` → `/test/lich`; đủ 4 → đúng chuỗi; kết quả
    đi qua `duongMoi` → `null`).
- [ ] **5.** `npm run check` xanh (typecheck web sẽ lỗi ở `TestPage`/`CanChamTab` vì `'can-cham'` — sửa tạm tối thiểu:
  xoá `CanChamTab.tsx` và dòng render của nó ở `TestPage.tsx` ngay Task này). Commit `PR-UX1 (1): luat dieu huong, nhan lop Lich Test`.

---

### Task 2: Máy chủ — `lichTest` một lời gọi đủ dữ liệu, `noTuanTruoc`

**Files:** `server/src/cham/canCham.ts`, `server/src/routes/index.ts:775-788`, `server/src/tests/chamDiem.tests.ts`.

**Produces** (`GET /cham/lich-test?periodId&branchId&phamVi&classId`):
```ts
type DongNo = { key: string; classId: number; classCode: string; mode: CheDo; kind: string; attemptNo: number | null;
  dotLabel: string; periodId: number | null; weekStart: string | null; kyNang: string[]; kyNangLabel: string;
  conBai: number; soHv: number; attemptIds: number[]; han: string | null; quaHan: boolean;
  luiLich: LuiLich | null; cuaToi: boolean };
type LopLichTest = { key: string; classId: number; classCode: string; mode: CheDo; branchName: string;
  kind: string | null; dotLabel: string; kyNangTuan: string[];           // L R W S có thi tuần này (môn đánh giá)
  tong: number; daCham: number; conBai: number; conBaiCuaToi: number;
  han: string | null; quaHan: boolean; nhan: { loai: LoaiNhanLop; chu: string }; moSan: boolean;
  hrefDayDu: string; dong: DongLichTest[] };                             // `dong` giữ nguyên như cũ
type LichTest = { scopeEmpty: boolean; tuan: { id: number; weekStart: string; weekEnd: string } | null;
  phamVi: PhamViLichTest; coPhamViRong: boolean; coPhanCong: boolean; lopDangLoc: { id: number; code: string } | null;
  tongQuan: { daCham: number; tong: number; conPhaiCham: number; no: { bai: number; lop: number }; quaHan: number };
  no: DongNo[]; lop: LopLichTest[] };
```

- [ ] **1. `noTuanTruoc(p, f: { branchId?; classIds: Set<number> | null; truocTuan: string }, today)`** — đổi từ
  `canChamList`: gọi `listAttempts(p, { branchId, scope: 'managed' })` **một lần**; bỏ `classId`/`scope`/`nhomCanCham`/
  `daBatDau`. Với mỗi lượt `conBaiCanCham(a)` và lớp thuộc `classIds` (null = mọi lớp): duyệt `pendingDetail`, **chỉ lấy
  ô `weekStart < truocTuan`**, khoá dòng `${classId}:${kind}:${attemptNo ?? 0}:${periodId ?? 0}` (Q2). Cộng `conBai`,
  `_hs`, `attemptIds`, hạn sớm nhất; đếm riêng `quaHanBai` (ô có `deadline && isOverdue(deadline, today)`). `luiLich` qua
  `dungLuiLich` như cũ (đã gom lô). `cuaToi = editableSkills(p, classId, môn nhập của kyNang).length > 0` (QL → `false`
  trừ khi có `score.override`). `quaHan = !!han && isOverdue(han, today)`. Xếp: quá
  hạn trước, rồi hạn tăng dần, rồi mã lớp. Trả `{ dong, quaHanBai }`.
- [ ] **2. `lichTest(p, periodId, branchId, today, o: { phamVi?: PhamViLichTest | null; classId?: number | null } = {})`**
  — giữ nguyên câu SQL (:313-334). Thêm, **đều trong bộ nhớ**:
  - `coPhanCong = defaultWorkScope(p) === 'mine'`; `phamVi = o.phamVi ?? (coPhanCong ? 'cua-toi' : 'tat-ca')`;
    `lopCuaToi = new Set(p.assignments.filter((a) => activeAt(a, today)).map((a) => a.classId))` (`activeAt` là hằng nội bộ
    `permissions.ts:138` — thêm `export`, không viết lại); `coPhamViRong = coPhanCong && (scope.all || scope.branchIds.length > 0)`.
  - Lọc lớp: `phamVi === 'cua-toi'` → chỉ `lopCuaToi`; `o.classId` → chỉ lớp đó, `lopDangLoc` chỉ khi
    `can(p, ATTEMPT_VIEW, { classId })` (không lộ mã lớp ngoài phạm vi — như Q13 cũ).
  - Khoá hàng lớn (Q9): `mode === 'ratio' ? `${class_id}:${kind}` : String(class_id)`. Trên mỗi dòng SQL còn ngồi thi:
    `tong += 1`; ô còn phải chấm (luật cũ :367-368) → `conBai += 1`, nếu
    `mySkills(p, class_id, mode === 'ielts_band' && skill === 'writing' ? ['writing1','writing2'] : [skill]).length`
    (theo kết quả Task 0 bước 4e) → `conBaiCuaToi += 1`; `han` = hạn sớm nhất của ô còn nợ (thứ tự hạn cũ :371); đếm
    `quaHanBai` khi `!chuaToiHan && isOverdue(han, today)`. Không còn ô nợ → `han = skillScoreDeadline(mode, week_start)`.
  - `dotLabel`: nhãn đợt không trùng, nối `, ` (`MT2, MT3`). `kyNangTuan`: môn đánh giá có trong tuần, thứ tự L R W S.
    `hrefDayDu`: FT `/nhap-diem/{id}?periodId={periodId}`, lớp thường `/nhap-diem/{id}?kind={kind}`.
  - `coDayLop = lopCuaToi.has(classId)`; `nhan = nhanLopLichTest({...})`; `moSan = lopTuMo({...})`.
  - `no = noTuanTruoc(p, { branchId, classIds: lớp sau lọc phạm vi + classId (Set) hoặc null nếu `tat-ca` không lọc
    lớp, truocTuan: tuan.week_start }, today)`.
  - `tongQuan` (Q5): cộng từ `lop` và `no` — **không** câu SQL thêm. `no.lop = new Set(no.map((d) => d.classId)).size`;
    `quaHan = quaHanBai(tuần) + quaHanBai(Nợ)`.
  - `tuan: { id, weekStart, weekEnd }` (đọc thêm `week_end` ở câu `report_periods` :304).
- [ ] **3. Route.** Xoá khối `/cham/can-cham` (:775-781). `/cham/lich-test`: đọc thêm
  `phamVi` (chỉ nhận `'cua-toi' | 'tat-ca'`, khác → null) và `classId` (`qInt`). Xoá import thừa.
- [ ] **4. Phép kiểm** (`chamDiem.tests.ts`, khối Task 6 cũ :458-620). **Chuyển** 5 phép Cần chấm sang hàm mới, giữ ý:
  - :461 Q11 → `PR-UX1 · Nợ tuần trước: một dòng = lớp + đợt + tuần, chỉ tuần trước tuần đang xem` — gọi
    `cham.lichTest(P.mbManager, <id tuần của TODAY>, null, TODAY)`; mọi `d.weekStart < tuan.weekStart`; khoá không trùng;
    `conBai > 0`; lớp thường không gọi "MT"; `tongQuan.no.bai === Σ conBai`; `tongQuan.no.lop` đúng.
  - :493 Q13 → `lichTest(..., { classId })`: `lopDangLoc` đúng; `lop` và `no` chỉ còn lớp đó; lớp CP → `lopDangLoc
    === null`, không dòng nào.
  - :535, :563 Q15 → đọc `luiLich` từ `no` (đợt ở tuần trước, dòng tuần trước) — giữ nguyên các assert `luiLich`; bỏ
    assert `daBatDau`, thay bằng `conBai` giảm đúng một sau `saveRegularScore`.
  - :583 Q11 GVBM → `lichTest(P.normalSubjectTeacher, …)`: dòng Nợ có môn ngoài `monCuaGv` thì `cuaToi === false`;
    dòng toàn môn của GV thì `cuaToi === true` (Q3).
  - **Mới** `PR-UX1 · Dải số Lịch Test = cộng các hàng, không tự tính riêng`: `tong = Σ lop.tong`, `daCham + conPhaiCham
    = tong`, `quaHan ≥ Σ quá hạn của Nợ`, mọi `lop.daCham === lop.tong - lop.conBai`.
  - **Mới** `PR-UX1 · Lớp tôi dạy: GV chỉ lớp có phân công, không có nút khi hai tập như nhau; QL mặc định Tất cả` —
    GVCN (`P.coreTeacher`): `phamVi === 'cua-toi'`, `coPhamViRong === false`, mọi lớp thuộc phân công; QL: `tat-ca`,
    `coPhanCong === false`, không lớp nào nhãn `cho-ban`/`cho-gv-khac`.
  - **Mới** `PR-UX1 · Nhãn + tự mở theo người xem`: cùng một lớp FT có bài L chưa chấm — GVBM dạy L thấy `cho-ban`,
    `moSan`; QL thấy `cho-cham`, `moSan` (còn bài). Lớp thường có hai bài cùng tuần → hai hàng `classId:kind`.
  - Phép :505, :591 (Lịch Test cũ) giữ; nếu `find(l => l.classCode === 'MB-FOU 12')` gặp hai hàng (Q9) thì đổi thành
    `filter(...).flatMap((l) => l.dong)`.
- [ ] **5.** `npm run check` xanh, **B+2+3 = B+5**. Commit `PR-UX1 (2): lichTest mot loi goi, No tuan truoc thay Can cham`.

---

### Task 3: Mọi lối cũ về Lịch Test + đo tốc độ

**Files:** `server/src/worklist/mywork.ts` (~:373), `web/src/modules/students/StudentsPage.tsx` :221, :234,
`web/src/modules/classes/DauTrangLop.tsx` :66, `server/src/tests/tocDoDuong.ts`, phép kiểm việc (file đang kiểm
`myWork` nhóm `score` — `grep -rn "group === 'score'\|'score:'" server/src/tests`).

- [ ] **1.** `mywork.ts` trong `gomBaiChuaCham`: `href: d.classId ? duongLichTest({ classId: d.classId, kn: d.skill })
  : attemptHref({...})` (Q13). Không đổi `key`, nhóm, nhãn (UX0 giữ phần badge).
- [ ] **2.** `StudentsPage.tsx:234` → `x.key === 'cham' ? duongLichTest({ classId: lop.id })`; sửa chú thích :221 (bỏ
  "`&scope=mine`"). `DauTrangLop.tsx:66` → `navigate(duongLichTest({ classId: data.id }))`. Nút "Nhập điểm Test" ở hai
  file **giữ** về lưới đầy đủ (bảng định vị §4 vẫn có lối này).
- [ ] **3.** `grep -rn "can-cham\|canChamList\|CanCham" server/src web/src shared` → chỉ còn chú thích lịch sử/phép kiểm
  redirect. Sửa chú thích sai nghĩa ở `attempts.ts` **không** (file Z2c-c) — ghi Nhật ký.
- [ ] **4. `tocDoDuong.ts`.** Bỏ dòng `{ trang: 'Cần chấm', …, url: '/cham/can-cham' }` + 5 trần :303-307. Đổi `trang`
  của dòng Lịch Test thành `'Lịch Test'`; thêm `{ trang: 'Lịch Test', vai: MOI_VAI, url: '/cham/lich-test?phamVi=tat-ca' }`,
  `{ trang: 'Lịch Test', vai: ['QL','QT','GVCN','GVBM'], url: '/cham/lich-test?classId={lopFT}' }`. Chạy phép đo, lấy số
  câu thật mỗi dòng, trần = `max(sau+10, ⌈sau×1.3⌉)` (quy ước ở :198, :269, :370), ghi chú `// PR-UX1 …` như các khối khác.
  Không có dòng nào "Vượt trần"; `/cham/lich-test` cũ tăng (có `listAttempts`) — ghi số trước/sau vào Nhật ký.
- [ ] **5. Phép kiểm mới** `PR-UX1 · Việc cần làm › Chấm điểm mở Lịch Test đúng lớp + môn` — `myWork(P.subjectTeacher)`
  nhóm `score`: mọi dòng có `classId` có `href` bắt đầu `/test/lich?` kèm `classId=` đúng và `kn=`; `duongMoi(href)` null.
- [ ] **6.** `npm run check` xanh (**≈ B+6** + chênh số dòng đo). Commit `PR-UX1 (3): moi loi vao cham ve Lich Test, do toc do`.

---

### Task 4: Web — tách lưới chấm dùng chung `LuoiChamLop`

**Files:** tạo `web/src/modules/cham/LuoiChamLop.tsx`; sửa `ChamDiemPage.tsx`, `LuoiFT.tsx`, `LuoiThuong.tsx`.

**Produces:**
```ts
export type Cham = { classId: number; classCode: string; branchName: string; canPlanWeek: boolean; today: string;
  mode: 'ielts_band' | 'ratio'; ft: FtSheet | null; thuong: ThuongSheet | null };   // dời từ ChamDiemPage :17-22
export function useManHinhHep(): boolean;                                          // dời từ :28-39
export function duongCham(classId: number, o: { periodId?: number | null; kind?: string | null }): string; // `/classes/:id/cham?…`
export function LuoiChamLop(props: { data: Cham; kind: string | null; kn?: string | null; hv?: number | null;
  onReload: () => void; gon?: boolean; tuanDangXem?: string | null; chiAttempt?: ReadonlySet<number> | null }): JSX.Element;
```

- [ ] **1.** Dời vào `LuoiChamLop`: lọc `kind` của lớp thường (:88-95), hiệu ứng cuộn/đặt con trỏ (:97-126, `khung`
  ref thuộc component này), công tắc `Xem dạng bảng`/`Chấm từng kỹ năng` + `Card` (:204-221). `chiAttempt` lọc
  `rows` (FT và thường) **trước** khi đưa vào lưới. `ChamDiemPage` chỉ còn đầu trang + `useApi(duongCham(...))` +
  `<LuoiChamLop data kind={kindChon} kn hv onReload />` — **không đổi hành vi** trang lưới đầy đủ.
- [ ] **2. `LuoiFT.tsx`**: props `gon?`, `tuanDangXem?`. `gon` → bỏ cột Trạng thái, Hạn; bỏ cột MT khi mọi dòng cùng
  `attemptNo`. Dựng `COT` theo cột đang hiện (G-2, `colgroup` khớp số cột). Ô:
  ```tsx
  const khacTuan = (c: Cell) => !!tuanDangXem && !!c.weekStart && c.weekStart !== tuanDangXem && c.band === null && !c.noShow;
  // trong SheetRow, trước RawScoreInput / CriteriaButton:
  if (khacTuan(cell)) return <td key={s} className="td py-1.5 text-slate-500" data-kn={s}
    title={`Thi tuần ${tuanLich(cell.weekStart)}`}>{tuanLich(cell.weekStart)}</td>;
  ```
  (không gắn `data-trong` → con trỏ không nhảy vào ô tuần khác). Dùng token màu UX0 thay `text-slate-500` nếu UX0 có.
- [ ] **3. `LuoiThuong.tsx`**: prop `tuanDangXem?` truyền xuống `DongThuong` (~:346); ô môn có
  `lichCua(r,k).weekStart !== tuanDangXem`, chưa có điểm, không `noShow` → cùng chữ mờ `W4 SEP`. **Không** đụng phần
  Z2c-c sửa (Enter khi thiếu tổng, ô tổng ↓).
- [ ] **4.** `MotKyNang` không sửa (đã một kỹ năng một lúc + nút "−").
- [ ] **5.** `npm run check` xanh (không thêm phép — web). Mở tay `/nhap-diem/<FT>` và `/nhap-diem/<lớp thường>` ở
  máy chủ thử (Task 8 bước 2) chỉ khi nghi ngờ; bấm thử chính thức để Task 8. Commit `PR-UX1 (4): tach LuoiChamLop dung chung`.

---

### Task 5: Web — khung Lịch Test, dải số, khối Nợ tuần trước

**Files:** `web/src/modules/test/TestPage.tsx`, `web/src/modules/test/LichTestTab.tsx` (viết lại),
tạo `web/src/modules/test/lichTest/DaiSo.tsx`, `KhoiNo.tsx`, `LuoiNhung.tsx`.

**Consumes:** `GET /cham/lich-test`, `LuoiChamLop`, `useManHinhHep`, `WeekPicker`, `BranchFilter`, `HangTab
cap="con"`, `NutLuat`, component hàng/badge UX0, `tuanLich`, `ngay`, `skillLabel/skillShort`.

- [ ] **1. `TestPage.tsx`**: bỏ import/nhánh `CanChamTab`; `tabs.length > 1 && <HangTab …/>` (Q15); sửa chú thích đầu
  file (bỏ "Cần chấm").
- [ ] **2. `LichTestTab` — trạng thái trên URL** (replace, F5/Back giữ chỗ): `periodId`, `branchId`, `phamVi`, `loai`,
  `classId`, `kn`. Gọi `useApi<LichTest>('/cham/lich-test?' + qs)` — **không** chờ `resolveWeek` (máy chủ tự lấy tuần
  hiện tại); `WeekPicker periodId={params periodId ?? data?.tuan?.id}`. Skeleton **chỉ** khi `!data` (tải lại nền giữ
  màn, không unmount lưới đang gõ). `scopeEmpty` / không lớp nào → `Empty` như cũ (chữ: "Tuần này không có lượt Test
  nào" + gợi ý Kế hoạch Test chỉ khi `nav.testPlan`).
- [ ] **3. Hàng lọc (một hàng, `flex-wrap` chỉ ở < 768px):** `WeekPicker` · nhóm hai nút `Lớp tôi dạy | Tất cả` (chỉ khi
  `data.coPhamViRong`) · `BranchFilter` (tự ẩn khi một chi nhánh). Chip `Đang lọc: lớp {lopDangLoc.code ?? '#'+classId}
  ✕` khi có `classId` trên URL (✕ xoá `classId` và `kn`).
- [ ] **4. `DaiSo`** — 4 ô số (1440: một hàng; 375: lưới 2×2), mỗi ô là `<button>` (G-10), `tabular-nums`:
  `Tuần này đã chấm {daCham}/{tong} bài` · `Còn phải chấm {conPhaiCham} bài` · `Nợ tuần trước {no.bai} bài · {no.lop}
  lớp` · `Quá hạn {quaHan} bài` (số đỏ khi > 0; ô = 0 thì chữ phụ, vẫn bấm được). Bấm: đã chấm → cuộn tới tab lớp;
  còn phải chấm → mở mọi lớp `conBai > 0` của tab đang xem + cuộn; nợ → mở khối Nợ + cuộn; quá hạn → mở khối Nợ, bật
  lọc `chỉ quá hạn` (chip `Chỉ quá hạn ✕` đầu khối) và mở các lớp có `quaHan`.
- [ ] **5. `KhoiNo`** — ẩn hẳn khi `no.length === 0`. Vỏ `KhoiNhom` (UX0): `tieuDe` `Nợ tuần trước`, `dem` = số bài,
  `phu` = `{m} lớp` + chữ đỏ `⚠ Quá hạn {k} bài` (lớp chữ `text-late`) chỉ khi k > 0; mặc định mở. Bảng cột cố định (G-2) `Lớp · Đợt · Kỹ năng · Còn · Hạn · (trạng thái) ·
  (nút)`: kỹ năng `skillShort` nối `, ` + ` · lùi lịch` khi `luiLich` (tooltip "Lùi lịch từ W2 SEP sang W3 SEP" +
  tên em — như `dongPhu` của `CanChamTab` cũ :49-61, chép sang); hạn `<Han loai="nhap-diem" han={han} />` (tự `⚠ Quá hạn n ngày`
  khi quá hạn — Q7); trạng thái `Nhan` `Chờ bạn chấm` (`cuaToi`) / `Chờ GV khác`|`Chờ chấm`; nút `Chấm` (`cuaToi`) hoặc `Xem`, ≥ 44px ở
  375. Bấm nút → mở **một** dòng một lúc: dưới dòng render `LuoiNhung` với `{ classId, periodId (FT) | kind (thường),
  tuanDangXem: weekStart, chiAttempt: new Set(attemptIds), kn: kyNang[0], gon: true }`. **Q14:** giữ bản sao dòng đang
  mở trong state; máy chủ không còn trả dòng đó → vẫn hiện, trạng thái `Đã chấm ✓`, tới khi người dùng thu.
- [ ] **6. `LuoiNhung`** — `useApi<Cham>(duongCham(classId, { periodId, kind }))` + `LuoiChamLop` (+ Skeleton 4 dòng);
  `onReload` = tải lại lưới đó **và** gọi `baoDaLuu()` của `LichTestTab`: hẹn giờ 1,5 s (xoá hẹn cũ mỗi lần) rồi
  `reload()` `/cham/lich-test` (Q14). Nút nhỏ `Mở lưới đầy đủ ↗` (link `hrefDayDu`/`/nhap-diem/...`) ở góc phải trên lưới.
- [ ] **7.** `npm run check` xanh. Commit `PR-UX1 (5): Lich Test — hang loc, dai so, khoi No tuan truoc`.

---

### Task 6: Web — danh sách lớp hàng lớn, tự mở, lưới nhúng, 375px

**Files:** tạo `web/src/modules/test/lichTest/HangLop.tsx`, `web/src/modules/test/lichTest/moLop.ts`; sửa `LichTestTab.tsx`.

- [ ] **1. Tab nhỏ** `HangTab cap="con"`: `Fast Track · {n} lớp` | `Lớp thường · {n} lớp` (bỏ tab 0 lớp; còn một tab
  thì vẫn hiện nhãn đó làm tiêu đề). ⓘ `NutLuat` cạnh "Lớp thường": luật ô `đúng/tổng`, ô tổng ↓, viền vàng khi khác
  tổng cột, dưới 70% đỏ nhẹ, `-` = vắng dời sang tuần sau (chép ý từ `ChamDiemPage` :158-164, không lặp chữ ở chỗ
  khác). Tab mặc định: `loai` trên URL → tab của `classId` → tab đầu có lớp `moSan` → tab đầu có lớp. Cuối hàng tab: nút
  chữ `Mở tất cả` / `Thu tất cả`.
- [ ] **2. `HangLop`** — một `<table>` cho cả tab (`table-layout: fixed` + `colgroup`, tiêu đề cột một lần); mỗi lớp
  là `<tbody>` gồm `HangNhom` (`tieuDe` = mã lớp, `nhan` = mã lớp cho aria) + các ô: `Đợt · Chi nhánh (chỉ khi
  `session.branchCount > 1`) · Kỹ năng · Tiến độ · Hạn · Trạng thái · ↗`. Kỹ năng: 4 chữ `L R W S`, môn ngoài
  `kyNangTuan` mờ (tooltip tên đủ + "không thi tuần này", G-7). Tiến độ `{daCham}/{tong} bài`. Hạn `<Han
  loai="nhap-diem" han={han} />` (UX0 tự gắn `QuaHan` khi quá hạn — Q7). Trạng thái: `da-cham` → `Nhan tone="done"`
  `Đã chấm ✓` (✓ nhỏ, G-1); còn lại `Nhan` theo bảng N-3. `↗` = link `hrefDayDu`, tooltip "Mở lưới đầy đủ" (`HangNhom`
  đã bỏ qua cú bấm vào `a`/`button` con). Mở → `HangCon` một ô `colSpan` chứa `LuoiNhung` với `{ classId, periodId:
  data.tuan.id (FT) | kind (thường), tuanDangXem: data.tuan.weekStart, gon: true, kn: classId === urlClassId ? urlKn :
  null }`.
- [ ] **3. `moLop.ts`** (Q8):
  ```ts
  const khoa = (periodId: number) => `lich-test-mo:${periodId}`;
  export function docMo(periodId: number): Record<string, boolean> {
    try { return JSON.parse(localStorage.getItem(khoa(periodId)) ?? '{}') ?? {}; } catch { return {}; }
  }
  export function ghiMo(periodId: number, v: Record<string, boolean>) {
    try { localStorage.setItem(khoa(periodId), JSON.stringify(v)); } catch { /* chế độ riêng tư: bỏ qua */ }
  }
  export const dangMo = (lop: { key: string; moSan: boolean }, nho: Record<string, boolean>, epMo: Set<string>) =>
    epMo.has(lop.key) || (lop.key in nho ? nho[lop.key] : lop.moSan);
  ```
  `epMo` = lớp của `classId` trên URL (khi lớp đó không có dòng Nợ nào — có thì mở dòng Nợ đầu của lớp đó thay vì hàng
  lớp) + lớp mở bởi dải số. Bấm hàng → ghi `nho[key] = !đangMở`. `Mở tất cả`/`Thu tất cả` ghi cho mọi lớp của tab.
- [ ] **4. Quyền (máy chủ đã chặn — giữ):** ô môn không dạy → chữ chỉ đọc (lưới cũ tự làm theo `canEdit`); đợt hoàn tất
  → GV chỉ đọc, QL mở hộp lý do (R11 có sẵn). **Không** thêm kiểm quyền phía web ngoài `canEdit`.
- [ ] **5. 375px:** hàng lớp gập thành 2 dòng `▾ {mã} · {đợt} · {x}/{y}` + dòng phụ `hạn · trạng thái` (G-3); lưới nhúng
  tự sang `MotKyNang` qua `useManHinhHep` (một kỹ năng một lúc, chip kỹ năng không phải của mình vẫn bấm để xem). Dải số
  2×2. Trang không cuộn ngang (`scrollWidth === innerWidth`).
- [ ] **6.** Bỏ hẳn bảng `Đợt · Kỹ năng · Số HV · Trạng thái chấm` cũ và `mauTrangThai` (:62-71 cũ). `npm run check`
  xanh. Commit `PR-UX1 (6): Lich Test — hang lop thu gon, tu mo, cham tai cho, 375px`.

---

### Task 7: Tài liệu

- [ ] `CODE_MAP.md`: dòng :24 (Cần chấm) **xoá**; :26 Lịch Test → "dải số · Nợ tuần trước · hàng lớp mở lưới tại chỗ ·
  `web/src/modules/test/LichTestTab.tsx` + `lichTest/*` · `lichTest`/`noTuanTruoc` (`GET /cham/lich-test`)"; :39 thêm
  `LuoiChamLop.tsx` (lưới dùng chung cho trang lưới + Lịch Test); :208-212 bỏ `canChamList`, thêm `noTuanTruoc`.
- [ ] `plan.md`: một dòng nhật ký ngày làm (PR-UX1: bỏ Cần chấm, Lịch Test chấm tại chỗ). Không sửa đặc tả (planning).
- [ ] Commit `PR-UX1 (7): CODE_MAP, plan.md`.

---

### Task 8: Nghiệm thu — kiểm đủ, bấm thử một lần, PR

- [ ] **1.** `npm run check` → xanh, **≈ B+6** (± phép đo tốc độ đổi dòng; ghi Nhật ký). Không "Vượt trần".
- [ ] **2. Không migrate / không chạm file cấm:** `git diff origin/main...HEAD --stat -- server/src/schema.sql
  server/src/migrate.ts` rỗng; `git diff origin/main...HEAD --stat` không có file ở cột "File KHÔNG được chạm".
- [ ] **3. Chạy thử** (DB riêng, cổng 4397/5597; theo bộ nhớ "Máy chủ dev trong worktree" — **không** `preview_start`):
  `KIEM="$(node -e "console.log(require('os').tmpdir())")/pr-ux1-kiem.sqlite"`; `PISA_DB="$KIEM" npm run seed`;
  `vite.kiem.config.ts` tạm (port 5597, proxy `/api` → `http://127.0.0.1:4397`, **không commit**);
  `npm run build:server && PISA_DB="$KIEM" PORT=4397 npm run dev:api` + `npx vite --config vite.kiem.config.ts`.
  Playwright kênh Chrome, đăng nhập demo theo vai (QL = 2, GVCN = 7, GVBM = 9 — `DEMO.md`).
- [ ] **4. Bấm thử một lượt, ảnh thật** vào `thiet-ke/anh/pr-ux1/` (tên `01-gvbm-1440.png`…), ghi kết quả từng ý:
  - **GVBM (9), 1440:** `/test` → Lịch Test, **không** hàng tab; mặc định lớp mình dạy; dải số 4 ô đúng số (cộng tay
    các hàng); lớp có bài của mình **tự mở**, lớp khác thu gọn; gõ một ô L → `✓` nhỏ, 1,5 s sau dải số + tiến độ hàng
    đổi, ô không mất focus; ô môn không dạy là chữ; ô môn thi tuần khác mờ `W4 SEP`; sửa ô đã có điểm → hộp lý do.
    Khối Nợ: `Chấm` mở lưới dưới dòng chỉ các em còn nợ, chấm hết → dòng vẫn còn, ghi `Đã chấm ✓`. Bấm `Quá hạn` → khối
    Nợ lọc quá hạn. F5 giữ tuần/tab/lớp đã mở; đổi tuần ‹ › đúng.
  - **GVCN (7):** lớp thường tab → ⓘ đúng luật; `-` ở một môn → ô `→ W4 SEP`, môn khác không đổi; `Mở lưới đầy đủ ↗`
    mở đúng bài. Tổng quan › Việc cần làm › Chấm điểm → Lịch Test đúng lớp, con trỏ đúng cột. Học viên & Lớp › badge
    "… bài chờ chấm" → Lịch Test lọc lớp, chip `Đang lọc` + ✕. Gõ `/test/can-cham?classId=…&scope=mine` → về `/test/lich?classId=…`.
  - **QL (2):** hai tab Lịch Test · Kế hoạch Test; không có nút `Lớp tôi dạy`; nhãn `Chờ chấm` (không "GV khác"); lớp
    còn bài tự mở; ô chỉ đọc; đợt hoàn tất → sửa được qua hộp lý do. Đổi chi nhánh → số đổi theo.
  - **375px (GVBM + QL):** dải số 2×2, hàng lớp 2 dòng, lưới nhúng một kỹ năng một lúc, nút ≥ 44px, trang không cuộn
    ngang, không chữ bị cắt/chồng.
  - Không thấy chữ ISO, "Normal", "tuần 36", "Cần chấm", ⚠ ngoài quá hạn, badge dài hơn 3 từ.
  Xong: tắt API + Vite của mình, xoá `vite.kiem.config.ts` và DB tạm; `git add thiet-ke/anh/pr-ux1/`.
- [ ] **5. Rebase + PR.** `git fetch origin && git rebase origin/main` (xung đột `routes/index.ts`, `tocDoDuong.ts`,
  `CODE_MAP.md` → giữ cả hai), `npm run check` lại. `git push -u origin pr-ux1-lich-test`; `gh pr create` tiêu đề
  `PR-UX1 · Lịch Test chấm tại chỗ (bỏ Cần chấm)`, thân: tóm tắt theo Task, bảng Q1–Q16, số phép B → B+n, số câu SQL
  `/cham/lich-test` trước/sau, **"Không có migrate"**, ảnh, dòng cuối `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  **Không tự merge.** Báo planning (tiếng Việt đơn giản): tab Cần chấm đã bỏ; giáo viên mở Test là thấy tuần này, số
  bài đã chấm/còn lại/nợ tuần trước/quá hạn; lớp nào còn bài của mình tự mở ra, gõ điểm ngay tại đó; bài tuần trước
  còn sót nằm trong khối "Nợ tuần trước" ở trên cùng; mọi nút cũ dẫn tới Cần chấm nay mở đúng lớp ở Lịch Test.

---

## Chuyển cho PR khác

- **UX4/Tổng quan QL:** danh sách con số "bài chưa nhập điểm quá hạn" (`server/src/worklist/metrics.ts:106`) vẫn mở hồ sơ
  đợt `/mock-test/:id` từng dòng — cân nhắc đổi sang `duongLichTest({ classId })`.
- **S3/Z2c:** chú thích nhắc "Cần chấm" trong `server/src/fasttrack/attempts.ts:453, :660, :669` (file Z2c-c) — đổi chữ
  khi có PR chạm file đó. `myPendingDetail` chưa có `periodId` → link Việc cần làm chưa mở đúng tuần (Q13).
- **Planning:** đặc tả 22/09 §3.5 và §4 dòng "Chấm điểm" còn ghi Cần chấm → sửa theo đặc tả 23/09.

## Mâu thuẫn nguồn ↔ mã (đã xử lý)

| # | Mâu thuẫn | Xử lý |
|---|---|---|
| 1 | Đặc tả 23/09 §2 "chuyển hướng giữ `classId`/`kn`" ↔ link hiện tại mang `scope=mine` | Q12 — bỏ `scope` |
| 2 | "thông báo link tới Cần chấm" ↔ `duongThongBao` (`shared/domain/duongHoSo.ts:81`) không có đích Cần chấm; Nhắc việc về `/cong-viec` | Không đổi; link cũ đã lưu đi qua `duongMoi` |
| 3 | Việc cần làm › Chấm điểm ↔ mã về `/mock-test/:id` / `/bang-diem-thuong` (`attemptHref`), không về Cần chấm | Q13 — đổi về Lịch Test |
| 4 | "Lớp tôi dạy / Tất cả cho GV" ↔ GV thuần chỉ xem được lớp mình dạy (`scopeFor` :430) | Q4 — nút chỉ hiện khi hai tập khác nhau |
| 5 | Mockup 17 gọi component `HangMoRong`/`NhomMoRong` | Kế hoạch UX0 Q1 chốt `HangNhom`/`HangCon`/`KhoiNhom`/`MuiTenMo`, `Nhan`/`QuaHan` — dùng đúng tên đó (Task 0 bước 4a kiểm lại mã thật) |
| 6 | Phép `khung.tests.ts` khẳng định GV mặc định `can-cham` (O2b, đặc tả 22/09) | Đặc tả 23/09 thắng; sửa phép |
| 7 | "Còn phải chấm" của mockup (57 − 32) gồm cả bài của GV khác | Theo mockup (Q5); nhãn hàng lớp nói của ai |
| 8 | Mockup 13 đặt `⚠ Quá hạn n ngày` ở chỗ badge ↔ mockup 17 B-5 (quá hạn nói một lần) + G-10 (hạn qua `<Han>`) | Q7 — quá hạn ở cột Hạn, badge nói của ai |

## Nhật ký thực thi

| Ngày | Task | Ghi chú |
|---|---|---|
| 23/09 | 0 | Worktree `.claude/worktrees/pr-ux1-lich-test`, nhánh từ `origin/main` @ `d0462b0` (đã có UX0 #89, Z2c-c #87). Kế hoạch đã có sẵn trên main → không chép lại. **B = 1186** (+ 20 tốc độ). Đối chiếu: (a) `HangNhom({mo,onMo,nhan,tieuDe,soCotDau})`, `HangCon`, `KhoiNhom({mo,onMo,nhan,tieuDe,dem,phu,id})`, `MuiTenMo`; `Nhan({tone})` tone `ok/done/bad/soon/doing/wait/muted`, `QuaHan`; `Han({loai,han,…})` ở `web/src/ui/Han.tsx`. (e) lớp FT phân công theo môn nhập `writing1`/`writing2` (`seed.ts` dùng `ENTRY_SKILLS`) → `mySkills(p, lop, ['writing1','writing2'])` cho ô Writing FT |
| 23/09 | 1 | Lệch kế hoạch: xoá khối Cần chấm ở `chamDiem.ts` ngay Task 1 làm vỡ `canCham.ts` (máy chủ còn `nhomCanCham`) → giữ tạm khối đó, bỏ ở Task 2 cùng `canChamList`. 1188 (B+2) |
| 23/09 | 2 | 1191 (B+5). Khớp mã/đặc tả: (1) `DongNo` thêm `duocCham` (nút Chấm/Xem theo `editableSkills`) và `coDayLop` (nhãn "Chờ GV khác"/"Chờ chấm"); `cuaToi` dùng `mySkills` (phân công) như `conBaiCuaToi` của hàng lớp — kế hoạch ghi `editableSkills` thì Quản trị (sửa hộ) bị gọi "Chờ bạn chấm". Phép Q3 kiểm `cuaToi === kyNang có môn được phân công`, dựng hai bài riêng (chỉ môn người khác / chỉ môn GVBM) cho xác định. (2) Không phân công → `phamVi` luôn `tat-ca` (URL `cua-toi` của QL không ra màn rỗng). (3) `moSan` thêm `!chuaToiHan` — tuần chưa tới không tự mở. (4) Phép lùi lịch (Q15): môn dời sang tuần NÀY không còn là "nợ tuần trước" khi xem tuần này → phép nhìn từ TUẦN SAU (`ensurePeriod`), khoá dòng kèm id tuần. (5) Bỏ route `/cham/can-cham` làm vỡ phép đo tốc độ ngay Task 2 → làm luôn bước 4 của Task 3 (`tocDoDuong.ts`): `/cham/lich-test` 16 → 26 câu (QT 28; `?classId=` QT 25), trần 36/38/35; hai trang cũ cộng lại 16 + 24 |
| 23/09 | 3 | 1192 (B+6). `mywork.ts`: `href` = `duongLichTest({ classId, kn })` cho dòng có lớp. `StudentsPage` bỏ hẳn prop `chiMinh` (chỉ dùng cho `&scope=mine` của badge). Chú thích nhắc "Cần chấm" còn ở `attempts.ts` :453, :660, :669 (file Z2c-c, không sửa) và `LuoiFT`/`MotKyNang` (sửa ở Task 4). Phép mới ở `congViec.tests.ts` (`checkAsync`), kiểm cả GVBM MB-FT 101 lẫn GV hai chi nhánh |
| 23/09 | 4 | 1192. `LuoiChamLop` nhận `kind` đã chọn (trang lưới đầy đủ vẫn tự chọn bài vì cần cho đầu trang), thêm `thuongTheoBai` dùng chung và prop `datConTro` (Lịch Test tắt đặt con trỏ cho lớp tự mở — không thì trang nhảy tới lưới tải sau cùng). `gon` → không bọc `Card`. `useLuuThuong` bỏ `invalidate('/cham')` (mỗi ô lưu làm Lịch Test tải lại ngay, trái Q14 gộp 1,5 s); lưới vẫn tải lại qua `/classes`. `MotKyNang` không nhận `tuanDangXem` (một kỹ năng một lúc, ô tuần khác vẫn nhập như trang đầy đủ) |
| 23/09 | 5–6 | 1192. Viết một lượt, một commit (hai Task chung `LichTestTab`). File: `lichTest/{kieu,moLop}.ts`, `DaiSo`, `KhoiNo`, `LuoiNhung`, `HangLop`. Khớp mã: (1) `KhoiNhom` là danh sách, bảng Nợ nằm trong thân nó; (2) `epMo` bỏ ép khi người dùng bấm thu lớp đó (không thì lớp bị ép không thu được); "Còn phải chấm"/"Quá hạn" mở lớp qua `epMo`; (3) nút Chấm/Xem theo `duocCham`, thêm "Thu" khi đang mở; (4) nhãn "Tuần này đã chấm" đổi thành "Tuần W2 SEP đã chấm" khi xem tuần khác. N-1b: cột Kết quả lưới lớp thường đổi từ `Outcome` đỏ cho mọi mức trượt sang `Level` theo `sosTone` (SOS 1 vàng · 2 cam · 3 đỏ; đủ điểm đạt xanh; chưa đủ điểm xám) — FT đã đúng từ UX0 |
| 23/09 | 7 | `CODE_MAP.md`: bỏ dòng Cần chấm; dòng Lịch Test (lối vào "Chấm điểm", `lichTest/*`, `noTuanTruoc`); thêm `LuoiChamLop.tsx`; bảng Chấm điểm bỏ `canChamList`. `plan.md`: một dòng nhật ký |
| 24/09 | 8 | Bấm thử thật (DB riêng, API 4397 · Vite 5597, Playwright kênh Chrome) — **41/41 ý đạt** sau khi sửa, kết quả từng ý ở `thiet-ke/anh/pr-ux1/ket-qua-bam-thu.txt`, 10 ảnh cùng thư mục. Bắt được và sửa: (1) tab mặc định lấy lớp tự mở đầu tiên theo thứ tự DỮ LIỆU (GVCN mở vào "Lớp thường") → theo thứ tự TAB FT → thường như kế hoạch; (2) `classId` + `kn` mở dòng Nợ đầu của lớp dù không có môn đó → chọn dòng Nợ có môn `kn`, không có thì hàng lớp tuần này; (3) dòng Nợ vừa chấm xong (Q14) vẫn hiện "⚠ quá hạn" → cột Hạn "—"; (4) hai lối "Mở lưới đầy đủ" trên hàng lớp → bỏ chữ trên lưới khi hàng đã có ↗ (màn hẹp vẫn có, cùng hàng "Xem dạng bảng"); (5) `HangTab` tràn dọc 1px (`-mb-px`) hiện thanh cuộn → `overflow-y-hidden`; (6) N-1b: ô Kết quả FT chưa đủ điểm ("Chờ 3 kỹ năng") tô theo mức SOS tạm → xám; (7) dòng phụ Nợ 375px gãy chữ "còn / 1". Lệch kế hoạch: GVBM demo (id 9) dạy **Speaking** nên ý "gõ một ô L" thử bằng GVCN (id 7, dạy L, R); QL MB chỉ một chi nhánh nên ý "đổi chi nhánh → số đổi" thử bằng Quản trị (id 1). Khung trình duyệt trong app không chạy `requestAnimationFrame` khi không focus → con trỏ chỉ kiểm được bằng Playwright (đạt) |
