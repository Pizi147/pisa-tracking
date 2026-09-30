# PR-GV · Hồ sơ giáo viên + Phân tích › Giáo viên + KPI tháng — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** (1) Trang **Hồ sơ giáo viên** `/giao-vien/:id` — lớp đang dạy + vai, kỹ năng phụ trách được (L · R · W1 · W2 · S),
bài chưa nhập / quá hạn, Case + PA đang phụ trách, KPI tháng lớp thường; tên GV ở hồ sơ lớp / Học viên & Lớp thành link.
(2) Phân tích có góc nhìn mới **"Giáo viên"**: mỗi GV một dòng (lớp · bài chưa nhập · quá hạn · Case phụ trách), khung Lớp thường
thêm **Bài đủ môn · Bài pass · Tỷ lệ pass tháng · Điểm KPI** và công tắc **Theo giáo viên · Theo chi nhánh**. Mọi số bấm được ra
đúng danh sách tạo nên nó. (3) Tổng quan › Theo lớp › "Theo giáo viên" rút còn **bài đang nợ** (K1-28), bỏ bảng cũ.
**Architecture:** Luật thuần `shared/domain/kpiThang.ts` (ngưỡng, điểm, nhãn). Máy chủ `server/src/phanTich/kpiThang.ts` (tập **bài
KPI** của một tháng: 3 câu cố định + lô ≤ 900, % tổng qua `evaluateRegular` có sẵn), `server/src/phanTich/giaoVien.ts` (góc nhìn +
ô danh sách), `server/src/giaoVien/hoSo.ts` (quyền xem + hồ sơ + ô danh sách). Tái dùng: `scoreDebtCells` (nợ điểm — cùng Test ›
Cần chấm), `listCases({ownerUserId})` + `chiTietCaseMo` (Case/PA theo lô), `rowsFor`, `phamViPhanTich`, `SoLieuO`, `TenGiaoVien`.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · libsql (Turso) · `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.1c **Q-E** · §3.2 **T50, T58, T60** · §5.7 **MH1, MH4,
MH5** · §5.8 **M-06** · **§6.5** · §8 dòng PR-GV · §10 · `2026-09-23-viec-con-lai-sau-deploy.md` §A dòng PR-GV · `2026-09-22-ux-toan-web-
truoc-deploy-design.md` **§3.3** (Theo giáo viên), **§3.7** (tên GV là link), **§3.12** (hồ sơ GV), §4 dòng "Hồ sơ GV", G-2/G-3/G-10 ·
rà `thiet-ke/ra-27-09/K1.md` **K1-28** (SỬA ĐẶC TẢ — thắng §6.5), **K1-53** · `K5.md` **K5-56**, M-06 · mockup `thiet-ke/mockup/06d-ho-so-gv-v2.html`,
`06e-ql-xem-gv.html` (chỉ tham khảo bố cục — phạm vi rút gọn theo Q10) · thân PR #132 "Chuyển cho PR khác" (K1-53).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-GV** · đợt 5 · làn **B** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-gv-ho-so-giao-vien` · `.claude/worktrees/pr-gv-ho-so-giao-vien` (từ `origin/main` mới nhất) |
| Cổng thử | API **4177** · Vite **5377** (không 4000/5173; LT2a 4167/5367 · LT2b 4187/5387 chạy song song) |
| Model | **Fable 5.1 · High** · phương án B: **Opus 5.5 · High**. Fable: đọc kỹ "Hướng dẫn riêng cho model thực thi" |
| Người rà | **Opus 5.5**, session riêng — rà **một lượt cuối đợt 5** (không rà từng PR) |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** |
| Migrate | **Không.** Không bảng/cột/quyền mới (quyền xem hồ sơ dẫn xuất từ `meeting.view` + `user_roles` + phân công — Q13). DB reset trước deploy: không lệnh dữ liệu cũ |
| Skill | Gõ **`/ponytail lite`** đầu phiên (PR có giao diện). impeccable: **`layout`** Task 5–6 (bảng Giáo viên, trang hồ sơ, 375 px) · **`clarify`** Task 5–6 (tên cột, dòng trống, câu 403/404) · **`audit`** rồi **`polish`** Task 7 (sáng **và** tối). Không `init`/`document`/`hooks on`/`npx impeccable install|update` |
| Phụ thuộc | Không chờ PR nào để bắt đầu. KPI chỉ **đọc điểm** qua `evaluateRegular` (regular.ts:171) — không phụ thuộc luật Case của LT2a/LT2b. 🛑 cổng rebase khi **PR-S4F** (permissions/Phân tích lớp) hoặc **LT2b** (regular.ts, Tổng hợp lớp thường) merge trước — Task 7 |
| Không làm | Thẻ theo kỹ năng + "Hỗ trợ đã thực hiện" của mockup 06d (Hiệu quả PA theo GV → PR-Pb2/sau) · "chấm đúng hạn" lịch sử (Q11) · bộ lọc chương trình Pre FOU/FOU/BE/ELE ở Phân tích (T60/MH4 toàn trang → PR-Pb2) · bỏ "Cả hai" khỏi Phân tích (PR-Pb2) · sửa Tổng hợp Test / xuatMt.ts · xếp hạng, tô màu tốt/xấu · KPI khung FT · xuất Excel KPI · sửa hồ sơ GV (chỉ xem) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy
  nền, không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-GV (n): …`. Sập segfault (mã 139) → chạy lại **một**
  lần; đỏ lần hai mới là lỗi thật. Treo > 10 phút → tắt mọi `node … tests/run.js` còn sống rồi chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px + **SÁNG và TỐI** **một lần** ở Task 7 (Playwright kênh Chrome, đăng nhập demo
  `POST /api/demo/session {userId}`: **Quản trị id 1** · QL MB **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** (GVCN MB FT 101 và
  MB FOU 12) · GVBM **Phạm Thu Trang id 9** · QL CP (tra id bằng `userByRole('manager','CP')`). Ảnh trước (main) / sau:
  `thiet-ke/anh/pr-gv/`. Chạy song song: `PORT=4177` cho API, Vite tạm cổng 5377 proxy về 4177 (bộ nhớ "Máy chủ dev trong worktree").
- Không chạm Turso (không migrate). Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning. Trước khi báo xong: tắt 4177/5377,
  quét `tests/run.js` treo, dọn tệp Playwright/Vite tạm.
- Luật repo (`CLAUDE.md`): chú thích `ponytail:` được phép nhưng **liệt kê trong mô tả PR**; trước khi mở PR chạy **`/ponytail-review`**
  và **impeccable `audit`**.

### Chồng file với PR cùng đợt (cổng rebase)

Trước Task 7: `git fetch origin && git rebase origin/main`. PR merge trước thì PR sau gỡ theo bảng:

| File | PR khác sửa gì | PR-GV chỉ được sửa | Gỡ xung đột |
|---|---|---|---|
| `server/src/routes/index.ts` | LT2a, LT2b (route Giữa/Cuối khoá, Mini Test) · S4F (có thể) | 4 route mới: `/phan-tich/giao-vien`, `/phan-tich/giao-vien/o` **ngay sau** khối `/phan-tich/y-thuc/o` (:690); `/giao-vien/:id`, `/giao-vien/:id/o` **ngay sau** `/branch-pulse` (:1510) | khác khối — giữ cả hai |
| `server/src/tests/run.ts` | LT2a, LT2b, S4F: mỗi PR một dòng đăng ký · LT2a/LT2b **có thể** thêm chỉ số vào sổ | 1 dòng `runPrGvTests` cuối file · test sổ chỉ số (:8187-8190): **31 → 33** + 2 mã vào `expected` | cộng số: 31 + số chỉ số mỗi PR thêm; giữ mọi mã |
| `shared/domain/metrics.ts` | LT2a/LT2b (nếu thêm chỉ số) | 2 mục cuối `METRICS`: `kpi-ty-le-pass-thang`, `kpi-diem` | giữ cả hai |
| `shared/domain/index.ts` | LT2a, LT2b export mới | 1 dòng `export * from './kpiThang.ts'` | giữ cả hai |
| `shared/domain/phanTich.ts` | LT2b (Tổng hợp khung lớp thường — nếu chạm) | `GOC_NHIN` thêm `'giao-vien'` (sau `'y-thuc'`) + 1 nhãn | khác dòng |
| `shared/domain/hocVienLop.ts` | LT2a/LT2b (T58 nhãn lớp thường — nếu chạm) | **một dòng** :479 `CO_TRANG_HO_SO_GIAO_VIEN = true` | khác dòng |
| `server/src/tests/phanTich.tests.ts` · `hocVienLop.tests.ts` | LT2b (Tổng hợp) · — | :60 danh sách góc nhìn thêm `'giao-vien'` · :211-212 cờ `true` + truyền `false` tường minh ở dòng "Chưa có trang" | khác dòng |
| `server/src/tests/tocDoDuong.ts` · `tocDo.run.ts` | LT2a, LT2b, S4F: đường đo + trần | khối `// PR-GV` cuối `DUONG_DO`, cuối `TRAN` | giữ mọi khối |
| `web/src/modules/worklist/BranchPulse.tsx` | **S4F** (:62 `color-mix(... white)` — rà SANG) | **chỉ** khối "Theo giáo viên" :136-211 (thay bằng bảng nợ mới) + :18-21 chú thích | khác khối |
| `web/src/modules/phanTich/PhanTich.tsx` | LT2b (nếu thêm nút/bộ lọc khung lớp thường) · S4F? | 1 dòng render góc nhìn + ẩn ô khoảng / hiện ô tháng khi `goc==='giao-vien'` | khác dòng |
| `server/src/permissions.ts` · `server/src/classes/phanTichLop.ts` | **S4F** (`teacherAllows ATTEMPT_VIEW`, quyền Phân tích lớp) | **KHÔNG sửa** — PR-GV đặt luật quyền ở `server/src/giaoVien/hoSo.ts` | — |
| `server/src/normal/regular.ts` · `server/src/phanTich/xuatMt.ts` | **LT2b** (`tyLeTongLo`, `datTheoTyLe`, hướng gợi ý tệp lớp thường) | **KHÔNG sửa** — chỉ import `evaluateRegular`, `allProgrammes` | 🛑 G2 |
| `web/src/App.tsx` · `web/src/modules/platform/Header.tsx` · `AdminPage.tsx` | (không PR nào đợt 5 đã biết) | 1 route · 1 link menu tài khoản · 1 đoạn ghi chú bảng quyền | — |
| `CODE_MAP.md`, `DEMO.md` | mọi PR | chỉ thêm dòng | giữ cả hai |

## Global Constraints

- **Một nguồn:** % tổng một bài chỉ từ `evaluateRegular(...).tyLeTong` (đủ môn mới khác `null`); "pass" = `tyLeTong >= RATIO_PASS_THRESHOLD`
  (như `phanTichLop.ts:68`). Nợ điểm chỉ từ `scoreDebtCells` (scoreDebt.ts:23). Case chỉ từ `listCases` + `chiTietCaseMo` (caseLop.ts:48).
  Điểm KPI chỉ từ `kpiTuSo` (shared). Số ở ô và danh sách khi bấm gọi **cùng** hàm tập (`baiKpiThang`, `scoreDebtCells`, `listCases`) —
  **số ở ô = số dòng khi bấm** (phép kiểm Task 3, 4).
- **Quyền — phép kiểm PHỦ ĐỊNH:** GV xem hồ sơ **chính mình**; QL xem GV thuộc chi nhánh mình; Quản trị tất cả. GV xem đồng nghiệp → **403**;
  QL CP xem GV chỉ ở MB → **403**; id lạ/đã xoá → **404**; GV gọi `/phan-tich/giao-vien` → **403**; QL hỏi `cn` ngoài phạm vi → **403**.
  Ô danh sách áp **đúng** quyền của số tổng.
- **Kiểm dữ liệu nhập ở máy chủ:** `thang` phải khớp `^\d{4}-(0[1-9]|1[0-2])$` (sai → 400 "Tháng không hợp lệ."), `:id`/`gv`/`cn`/`lop` số
  nguyên dương (sai → 400), `cot` thuộc danh sách cố định (sai → 400). Web kiểm trước chỉ để báo sớm.
- **SQL (bẫy Turso):** chỉ `?` — **không** tham số đặt tên (`db.ts:24-30` ném lỗi); `IN (…)` dựng `?` theo số phần tử, **lô ≤ 900**;
  `UNION ALL` ≤ 20 vế (chỉ dùng ở `phamViHoSoGv`: 2 vế); **không N+1** — số câu **không tăng theo số GV / lớp / bài** (phép kiểm Task 3).
  Chỉ đọc — PR-GV không ghi CSDL, không ghi nhật ký.
- **Hai khung (T60, MH4, MH5):** KPI chỉ ở khung **Lớp thường**. Khung FT và "Cả hai" (còn tới PR-Pb2) chỉ hiện cột không theo bài thi/
  kỹ năng (lớp, bài đang nợ, Case) + dòng "KPI tháng chỉ tính cho lớp thường — chọn Lớp thường". Lớp thường **không** chữ SOS (T58).
- **Chữ:** không lộ mã (`progress`, `writing1`, ISO, `attempt_no`); tháng hiện qua `ONgay kieu="thang"`, tuần qua `tuanLich()`; tên môn
  qua `tenMon(ct, k)`, kỹ năng GV qua `skillShort` (MH1). Viết "Quản lý" đủ chữ ở câu lỗi.
- **Tinh tế:** không xếp hạng, không màu tốt/xấu cho người (chú thích BranchPulse.tsx:18-21 — giữ tinh thần); sắp theo **tên**; số
  `tabular-nums` canh phải, `table-layout: fixed` + `colgroup`; một dòng phụ ≤ 60 ký tự (G-3); chữ ≥ 12 px; chỉ token màu `var(--…)`/lớp đã
  ánh xạ (PR-SANG) — **không** `white`/hex/`color-mix(... white)`; 375 px không cuộn ngang trang (bảng cuộn trong thẻ), nút ≥ 44 px.
- **Ngày nghiệp vụ:** `demoToday()` (máy chủ, gọi **một** lần mỗi request) / `useNgayNghiepVu().homNay` (web).

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| # | Chủ đề | Chốt | Vì sao |
|---|---|---|---|
| Q1 | Chỗ đặt KPI | Phân tích › góc nhìn mới **"Giáo viên"** (sau "Ý thức"); khung Lớp thường có công tắc **Theo giáo viên · Theo chi nhánh** | K1-28 (SỬA ĐẶC TẢ) thắng §6.5: Phân tích chưa có góc Theo GV; "Theo chi nhánh" của Tổng hợp là cách xếp dòng — không nhét KPI vào Tổng hợp (LT2b/Pb2 đang chạm) |
| Q2 | "Tuần thi" của bài | Tuần **sớm nhất** các môn bắt buộc (như PR-XUAT, K4-35b); tháng = tháng sở hữu tuần đó (`report_periods.year/month`) | Cùng tuần với Xuất Excel → QL kiểm lại KPI bằng Xuất Excel "Theo tháng · Chỉ lượt đủ điểm" (phép kiểm khớp số Task 2). `a.planned_period_id` là tuần **hoàn tất** (muộn nhất, skillSchedule.ts:386-405) — một em vắng một môn không kéo bài sang tháng sau |
| Q3 | Bài tính / pass | Giữa khoá + Cuối khoá lớp thường (FOU · BE · ELE · **Pre FOU** chỉ Cuối khoá), lượt không huỷ, **đủ môn** (`tyLeTong ≠ null`). Thiếu môn, "-", huỷ phần → **ngoài mẫu số**. Pass = % tổng ≥ 70%. **Mini Test không tính** | M-06, K5-56 |
| Q4 | Điểm KPI | So **số nguyên**: `pass×100 ≥ 70×tổng` → 5 · `≥ 60×tổng` → 3 · còn lại 0. % hiện **làm tròn xuống** (69,6% hiện "69%" · 3 điểm — không bao giờ "70% · 3"). Tổng = 0 → "—", không điểm | T50; tránh lệch do làm tròn |
| Q5 | GV được tính một bài | Mọi người có phân công ở **lớp của bài** (GVCN + GVBM, cả dòng đã `ended`) **chồng lên tuần thi**: `effective_from ≤ MAX(ngày cuối tuần, ngày tạo lớp)` và `effective_to` trống hoặc ≥ ngày đầu tuần. Một người nhiều dòng cùng lớp → **một lần**. Tài khoản đã xoá không thành hàng (bài vẫn tính cho người khác) | Q-E. `MAX(…, ngày tạo lớp)`: lớp tạo trên web sau tuần thi đầu (dữ liệu nhập bù sau reset) vẫn có người |
| Q6 | Theo chi nhánh | Mỗi bài **một lần** theo chi nhánh của lớp lúc thi (`a.class_id`) — không cộng từ hàng GV (một bài 4 GV không thành 4) | Hợp đồng số liệu luật 4 |
| Q7 | Tháng mặc định | Tháng của hôm nay; đổi bằng ô tháng (`?thang=YYYY-MM`). Tháng chưa có bài: dòng trống "Tháng {09/2026} chưa có bài Giữa khoá / Cuối khoá đủ môn." | Demo 14/09: SEP có MB Pre FOU 03 + MB FOU 12; AUG có Giữa khoá MB FOU 12 |
| Q8 | Góc Giáo viên ở khung FT / Cả hai | Vẫn có: **Lớp · Bài chưa nhập · Quá hạn nhập · Case phụ trách**; không KPI (dòng gợi ý chọn Lớp thường). Không thêm bộ lọc chương trình | Một danh sách GV duy nhất ở Phân tích (§3.3); T60 toàn trang là PR-Pb2 |
| Q9 | Tổng quan › Theo lớp › Theo giáo viên | Giữ công tắc, bảng chỉ còn **Lớp · Bài chưa nhập · Quá hạn nhập** (số bấm được), tên → hồ sơ GV, sắp theo tên, bỏ sắp xếp cột + cột Case/PA/Đề xuất; gọi chung `/phan-tich/giao-vien` | K1-28. Đề xuất chờ duyệt đã ở hộp Chờ duyệt (PR-DUYET); Case ở Phân tích › Giáo viên |
| Q10 | Hồ sơ GV có gì | Đầu trang + **một dòng 5 số** + 3 tab **Lớp đang dạy · Case phụ trách · KPI tháng** (tab KPI chỉ khi người đó có/đã có phân công lớp thường). **Không** thẻ theo kỹ năng / "Hỗ trợ đã thực hiện" của mockup 06d | §3.12 rút gọn; phân tích theo kỹ năng là Hiệu quả PA (PR-Pb2) |
| Q11 | "Chấm đúng hạn" | **Không** làm số lịch sử; hiện **nợ hiện tại** (chưa nhập · quá hạn) từ `scoreDebtCells` | `assessment_scores.entered_at` bị ghi đè mỗi lần sửa điểm (attempts.ts:1664) → sửa sau hạn biến bài đúng hạn thành trễ — số không công bằng. Xem câu hỏi C1 |
| Q12 | Việc đang có / quá hạn | Không đếm lại; link **"Việc của {tên} ›"** → `/cong-viec/ho-tro?nguoi={id}` (QL/QT) hoặc `/cong-viec/ho-tro` (chính mình) | Công việc đã có bộ lọc người (routes/index.ts:390) — một nguồn |
| Q13 | Quyền xem hồ sơ | Chính mình · QL: GV có vai **hoặc** phân công đang hiệu lực ở chi nhánh QL · Quản trị (grant không chi nhánh): tất cả. Khi QL xem: số liệu chỉ lớp trong chi nhánh QL; chính mình/Quản trị: mọi lớp | Như `/my-work?nguoi=` (routes/index.ts:393-399) + phân công (link từ hồ sơ lớp không được 403) |
| Q14 | Ghi luật vào bảng quyền Quản trị (K1-53, chuyển từ PR-XUAT #132) | Một đoạn "Quyền dẫn xuất (không có ô bật/tắt)" dưới bảng quyền: Xem hồ sơ GV · Xuất Excel kết quả Test | Không quyền mới → không migrate |
| Q15 | Lối vào + khu vực | Không thuộc 4 khu (`khuVucCuaDuong` → null, như Hồ sơ cá nhân). Lối vào ở mục "Nằm ở đâu" dưới | G-12 |
| Q16 | Sổ chỉ số | Thêm `kpi-ty-le-pass-thang`, `kpi-diem` (K5-56) → ⓘ "Cách tính" đọc từ sổ | Hợp đồng số liệu |
| Q17 | Nhãn cột | `Bài đủ môn` · `Bài pass` · `Tỷ lệ pass tháng` · `Điểm KPI` (chữ đặc tả T50); dòng danh sách ghi "Đạt / Chưa đạt" (luật chữ lớp thường) | impeccable `clarify` chỉ chỉnh ⓘ, không đổi tên cột |

**Câu cần chủ sản phẩm quyết** (không chặn — đang theo khuyến nghị):
- **C1 · "Chấm đúng hạn" lịch sử trong hồ sơ GV?** A. Không làm, chỉ nợ hiện tại (**khuyến nghị** — số trễ hạn sai khi GV sửa điểm) ·
  B. Thêm cột "lần nhập đầu" (migrate cấu trúc, DB reset nên sạch) + số "đúng hạn 8 tuần" ở PR sau (PR-UXF).
- **C2 · GV có thấy KPI tháng của chính mình?** A. Có — tab KPI trong hồ sơ, **cùng số** QL thấy (**khuyến nghị**, minh bạch) ·
  B. Chỉ Quản lý / Quản trị thấy KPI (GV không có tab KPI).

## Nằm ở đâu (mockup bằng chữ)

| Module | Nằm ở | Ai thấy |
|---|---|---|
| Trang Hồ sơ GV `/giao-vien/:id` | (1) tên GV ở **Học viên & Lớp › hồ sơ lớp › dòng thông tin** (GVCN + GV bộ môn — `DauTrangLop.tsx:149,184`) · (2) **Học viên & Lớp › dòng lớp** "GVCN {tên}" (`StudentsPage.tsx:366`) · (3) **Tổng quan › tab Phân tích › góc Giáo viên** (cột tên) · (4) **Tổng quan › khối Theo lớp › Theo giáo viên** (cột tên) · (5) **menu tài khoản (góc phải thanh đầu) › "Hồ sơ giáo viên"** ngay dưới "Hồ sơ cá nhân" — người có vai Giáo viên | GV: chỉ chính mình (link tên đồng nghiệp là chữ thường) · QL: GV chi nhánh mình · Quản trị: tất cả |
| Góc nhìn "Giáo viên" | **Tổng quan › tab Phân tích › hàng góc nhìn**, nút thứ 5 (sau "Ý thức") | QL, Quản trị (GV không có tab Phân tích) |
| Bảng nợ theo GV | **Tổng quan › khối "Theo lớp · {chi nhánh}" › công tắc "Theo giáo viên"** (chỉ khi đã chọn một chi nhánh) | QL, Quản trị |

**Bố cục trang Hồ sơ GV** (desktop; 375 px xếp dọc, bảng cuộn trong thẻ):
1. **Đầu trang** (thẻ `Card`): tên **20 px 700** · dòng phụ 14 px `Monbay · Giáo viên` (chi nhánh theo vai · vai) · hàng chip nhỏ chỉ đọc
   **"Phụ trách được: L R W1 W2 S"** (chỉ kỹ năng người đó khai, thứ tự ENTRY_SKILLS; không khai → "chưa khai") · bên phải link
   **"Việc của {tên} ›"** (Q12).
2. **Một dòng 5 số** (không ô số, số 16 px 600 + nhãn 12 px): `3 lớp đang dạy · 41 học viên · 6 bài chưa nhập (2 quá hạn) · 4 Case đang
   phụ trách · KPI 09/2026: 3 điểm` (mục KPI chỉ khi có lớp thường). Mỗi số bấm được (`SoLieuO nguon=…/giao-vien/:id/o?cot=…`).
3. **Tab** (`BoLocDoan` hoặc tab như hồ sơ lớp, `?tab=`):
   - **Lớp đang dạy** (mặc định): bảng `Lớp` (link hồ sơ lớp) · `Vai` (`GVCN · L · R` qua `tenMon`) · `Chương trình` (FT/FOU/…) · `Học viên` ·
     `Bài chưa nhập` · `Quá hạn nhập` (số bấm được). Không có lớp → "Chưa có phân công lớp nào đang hiệu lực."
   - **Case phụ trách**: bảng `Học viên` (link hồ sơ HV) · `Lớp` · `Case` (tieuDe) · `Trạng thái` (`NhanTrangThai` — **một** nhãn) ·
     `Việc tiếp` (chữ + `<Han>`), dòng con nhỏ các PA `nguoi · mocChu` — chép khuôn `BangCanHoTro.tsx:200-230`. Không có → "Không có Case nào đang mở."
   - **KPI tháng**: ô tháng (`ONgay kieu="thang"`) · dòng tổng `Bài đủ môn 12 · Bài pass 8 · 66% · 3 điểm` · bảng theo lớp cùng 4 cột.
     Chân: "Tính mọi bài Giữa khoá / Cuối khoá đủ môn trong tháng ở lớp người này được phân công lúc thi."

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc nếu chạy Fable)

1. **Năm chỗ dễ sai nhất** có mã mẫu trong Task: (a) `phamViHoSoGv` — GV không có `meeting.view` nên `scopeFor` trả `none` → 403 ngay
   (không dùng `laVaiQuanLy` ở máy chủ); (b) tuần của bài = **tuần sớm nhất** (câu con `ORDER BY r2.week_start LIMIT 1`), **không**
   `a.planned_period_id` thẳng; (c) phân công chồng tuần dùng `MAX(week_end, ngày tạo lớp)` và **khử trùng người** theo bài;
   (d) điểm KPI so số nguyên, % làm tròn **xuống**; (e) ô "Bài chưa nhập" đếm **ô** (môn × lượt — T53 Q2) nên danh sách phải một dòng / ô,
   `id` duy nhất.
2. Không tự tính % tổng / đạt — gọi `evaluateRegular` (regular.ts:171) với `allProgrammes()` (regular.ts:50, **một** lần mỗi request).
   Không tự tính nợ điểm — gọi `scoreDebtCells` (scoreDebt.ts:23). Không tự tính trạng thái Case — `chiTietCaseMo` (caseLop.ts:48).
3. `listCases` (cases.ts:1988) đã áp phạm vi **người xem**; lọc thêm `ownerUserId` (CaseFilters :1683) và `state !== 'done'` trong bộ nhớ.
4. 🛑 **Dừng hỏi planning** nếu: **G1** cần cột/bảng/quyền mới; **G2** sau rebase LT2b đã đổi chữ ký/ý nghĩa `evaluateRegular` hoặc
   `tyLeTong` (đọc `git log origin/main -- server/src/normal/regular.ts`) — nếu LT2b đã có `datTheoTyLe` thì **dùng hàm đó** cho "pass" thay
   `>= RATIO_PASS_THRESHOLD`, ghi Nhật ký, không tự viết lại; **G3** PR-S4F đã merge và đổi `scopeFor`/`teacherAllows` làm phép kiểm
   quyền PR-GV đổi kết quả; **G4** số câu SQL `/phan-tich/giao-vien` **tăng** khi thêm GV/lớp/bài (Task 3); **G5** phép kiểm cũ phải
   **xoá** (chỉ được sửa 4 chỗ ghi ở bảng chồng file); **G6** số KPI demo SEP/AUG ra 0 bài đủ môn (seed đổi).

## Task 0 · Nhánh, mốc, đối chiếu dòng mã

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-gv-ho-so-giao-vien -b pr-gv-ho-so-giao-vien origin/main`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch đợt 5> -- docs/superpowers/plans/2026-09-30-pr-gv-ho-so-giao-vien.md`.
- [ ] Nhật ký: PR-S4F / LT2a / LT2b đã merge chưa (`git log origin/main --oneline | grep -E "PR-(S4F|LT2a|LT2b)"`).
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B**.
- [ ] Đối chiếu (grep) — lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng: `CO_TRANG_HO_SO_GIAO_VIEN` (hocVienLop.ts:479),
  `function BangTheoGiaoVien` (BranchPulse.tsx:148), `export function phamViPhanTich` (phanTich/phamVi.ts:14), `export function scoreDebtCells`
  (scoreDebt.ts:23), `export function listCases` (cases.ts:1988), `export function chiTietCaseMo` (caseLop.ts:48), `export function rowsFor`
  (worklist/metrics.ts:62), `export function evaluateRegular` (normal/regular.ts:171), `export function allProgrammes` (:50),
  `export const RATIO_PASS_THRESHOLD` (shared/domain/normal.ts:38), `export const GOC_NHIN` (shared/domain/phanTich.ts:18),
  `api.get('/phan-tich/y-thuc/o'` (routes/index.ts:690), `api.get('/branch-pulse'` (:1507), câu tuần sớm nhất (phanTich/xuatMt.ts:188-191),
  `<Route path="/ho-so-ca-nhan"` (App.tsx:135), link "Hồ sơ cá nhân" (Header.tsx:253), `SectionNote` bảng quyền (AdminPage.tsx:108),
  test sổ chỉ số (run.ts:8187), `.replace('{gv}'` (tocDo.run.ts:130).
- [ ] Commit `PR-GV (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần KPI + góc nhìn + sổ chỉ số (T50, K5-56)

**Files:** tạo `shared/domain/kpiThang.ts` (+ export ở `shared/domain/index.ts`), sửa `shared/domain/phanTich.ts`, `shared/domain/metrics.ts`,
tạo `server/src/tests/prGv.tests.ts` (`runPrGvTests`, đăng ký **cuối** `run.ts` theo mẫu `runPrXuatTests`), sửa `phanTich.tests.ts:60`,
`run.ts:8187-8195`.

- [ ] `kpiThang.ts`:
```ts
/** KPI tháng lớp thường (T50, M-06, Q4): so số nguyên — không để làm tròn đổi điểm. */
export const KPI_NGUONG_5 = 70;
export const KPI_NGUONG_3 = 60;
export type Kpi = { tong: number; pass: number; phanTram: number | null; diem: 0 | 3 | 5 | null };
export function kpiTuSo(pass: number, tong: number): Kpi {
  if (!Number.isInteger(pass) || !Number.isInteger(tong) || pass < 0 || tong < 0 || pass > tong) throw new Error('kpiTuSo: số không hợp lệ');
  if (tong === 0) return { tong: 0, pass: 0, phanTram: null, diem: null };
  const diem = pass * 100 >= KPI_NGUONG_5 * tong ? 5 : pass * 100 >= KPI_NGUONG_3 * tong ? 3 : 0;
  return { tong, pass, phanTram: Math.floor((pass * 100) / tong), diem };
}
export const COT_O_GV = ['lop', 'chua-nhap', 'qua-han', 'case-mo', 'kpi-bai', 'kpi-pass'] as const;
export type CotOGv = (typeof COT_O_GV)[number];
export const laCotOGv = (s: unknown): s is CotOGv => (COT_O_GV as readonly unknown[]).includes(s);
/** `YYYY-MM` hợp lệ, hoặc null. */
export function thangHopLe(s: unknown): string | null {
  return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s) ? s : null;
}
```
- [ ] `phanTich.ts:18`: `GOC_NHIN = ['tong-hop', 'van-de', 'hieu-qua-pa', 'y-thuc', 'giao-vien', 'danh-sach']`, nhãn `'giao-vien': 'Giáo viên'`.
- [ ] `metrics.ts` — 2 mục cuối `METRICS` đủ 8 trường: `kpi-ty-le-pass-thang` (ten "Tỷ lệ pass tháng", donVi `bai-thi`, thoiGian
  `ket-qua-trong-ky`, tapDuDieuKien: "Mẫu số: bài Giữa khoá / Cuối khoá lớp thường (Pre FOU chỉ Cuối khoá), không huỷ, đủ mọi môn, tuần thi
  (tuần sớm nhất các môn) thuộc tháng. Tử số: bài có % tổng ≥ 70%. Mini Test không tính.", khuTrung "Mỗi bài một lần; theo giáo viên: một
  bài đếm cho mỗi người có phân công ở lớp lúc tuần thi", drilldown `/phan-tich/giao-vien/o`) và `kpi-diem` ("Điểm KPI": "≥ 70% bài pass →
  5 · 60–69% → 3 · dưới 60% → 0; % làm tròn xuống; không có bài → không điểm").
- [ ] Phép kiểm `PR-GV (1)`: `kpiTuSo(7,10)` → 70%/5 · `(69,100)` → 69/3 · `(139,200)` → 69/3 (69,5% không lên 70) · `(6,10)` → 60/3 ·
  `(59,100)` → 0 · `(0,0)` → null/null · ném lỗi với `(3,2)`, `(-1,2)`, `(1.5,2)`; `thangHopLe('2026-09')` ✓, `'2026-13'`/`'26-09'`/`null` → null;
  `metricById('kpi-diem')` có đủ trường. Sửa `phanTich.tests.ts:60` (thêm `'giao-vien'`), `run.ts:8189` (31 → 33, thêm 2 mã vào `expected`).
- [ ] `npm run check` → commit `PR-GV (1): luật KPI tháng + góc nhìn Giáo viên + sổ chỉ số`.

## Task 2 · Máy chủ: tập bài KPI của một tháng (Q2–Q6)

**Files:** tạo `server/src/phanTich/kpiThang.ts`; thêm phép kiểm vào `prGv.tests.ts`.

- [ ] Hàm tập — **3 câu + lô**, không phụ thuộc số lớp/GV:
```ts
export type BaiKpi = { attemptId: number; studentId: number; tenHv: string; maHv: string; classId: number; maLop: string;
  branchId: number; kind: 'progress' | 'final'; tuan: string; tyLe: number; pass: boolean; gv: number[] };

/** Tuần của bài = tuần SỚM NHẤT các môn bắt buộc (cùng biểu thức phanTich/xuatMt.ts:188-191 — K4-35b, Q2). */
const TUAN_BAI = `COALESCE((SELECT k.planned_period_id FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
  WHERE k.attempt_id = a.id AND k.required = 1 ORDER BY r2.week_start LIMIT 1), a.planned_period_id)`;
const LO = 900;
const q = (n: number) => Array(n).fill('?').join(',');

export function baiKpiThang(thang: string, loc: { branchIds: number[] | null; classId?: number | null }): BaiKpi[] {
  if (loc.branchIds && !loc.branchIds.length) return [];                     // phạm vi rỗng → rỗng
  const conn = db();
  const [y, m] = thang.split('-').map(Number);
  const dk = [`a.status != 'cancelled'`, `a.kind IN ('progress', 'final')`, 't.year = ?', 't.month = ?'];
  const ps: unknown[] = [y, m];
  if (loc.branchIds) { dk.push(`c.branch_id IN (${q(loc.branchIds.length)})`); ps.push(...loc.branchIds); }
  if (loc.classId) { dk.push('c.id = ?'); ps.push(loc.classId); }
  const luot = conn.prepare(
    `SELECT a.id, a.kind, a.class_id, a.student_id, st.full_name, st.student_code, c.code AS class_code, c.branch_id,
            c.programme_code, substr(c.created_at, 1, 10) AS lop_tao, t.week_start, t.week_end, t.code AS tuan_code
       FROM assessment_attempts a JOIN classes c ON c.id = a.class_id JOIN students st ON st.id = a.student_id
       JOIN report_periods t ON t.id = ${TUAN_BAI}
      WHERE ${dk.join(' AND ')}`).all(...ps) as any[];
  const programmes = allProgrammes();
  const hop = luot.filter((a) => programmes.get(a.programme_code)?.scoringMode === 'ratio');
  // (1) điểm theo lô: SELECT attempt_id, skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id IN (...) — lô LO
  // (2) phân công theo lô lớp: SELECT ta.class_id, ta.user_id, ta.effective_from, ta.effective_to FROM teacher_assignments ta
  //     JOIN users u ON u.id = ta.user_id WHERE u.status = 'active' AND ta.class_id IN (...)   — lô LO, KHÔNG lọc ta.status (dòng 'ended' vẫn tính)
  // (3) mỗi bài: r = evaluateRegular(prog.skills, diem.get(a.id) ?? [], prog.code); r.tyLeTong === null → bỏ (ngoài mẫu số)
  //     gv = [...new Set(pc.get(a.class_id).filter((x) => x.effective_from <= (a.week_end > a.lop_tao ? a.week_end : a.lop_tao)
  //            && (x.effective_to == null || x.effective_to >= a.week_start)).map((x) => x.user_id))]
  //     pass = r.tyLeTong >= RATIO_PASS_THRESHOLD    (🛑 G2: có `datTheoTyLe` của LT2b thì dùng nó)
}
```
- [ ] Hai hàm gộp (thuần trên mảng, không SQL): `kpiTheoGv(bai): Map<gvId, Kpi>` và `kpiTheoChiNhanh(bai): Map<branchId, Kpi>` (mỗi bài **một**
  lần theo `branchId`), cả hai qua `kpiTuSo`.
- [ ] Phép kiểm `PR-GV (2)` (dựng dữ liệu riêng trong phép kiểm — lớp thường mới ở chi nhánh CP, 3 em, rồi dọn như mẫu `prXuat.tests.ts`):
  (a) em đủ 4 môn 72% → pass; 70% đúng → pass; 69% → không; thiếu một môn → **không** có trong tập; lượt huỷ → không; môn dời sang tuần
  tháng sau → bài vẫn thuộc tháng của tuần **sớm nhất**; (b) GV A phân công 01/09–10/09 (`ended`), GV B từ 10/09, bài tuần 07–13/09 → cả A
  và B; GV C bắt đầu 20/09 → không; GVCN kiêm GVBM (2 dòng) → **một** lần; lớp tạo 01/10 có phân công từ 01/10, bài tuần 07/09 → vẫn tính
  (Q5); (c) theo chi nhánh: một bài 3 GV → chi nhánh đếm 1; (d) **khớp Xuất Excel**: với MB tháng 2026-09 và 2026-08,
  `baiKpiThang(...).length === duLieuXuatMt(P.admin, { khung: 'thuong', chiNhanh: [MB], lop: [], thoiGian: { kieu: 'thang', tu, den: tu },
  chiDuDiem: true, cot: 'gon' }).dem.luot` (đọc đúng tên trường ở `docBoLocXuatMt` — shared/domain/xuatMt.ts); (e) demo: SEP MB ≥ 4 bài
  (MB Pre FOU 03), AUG MB ≥ 3 bài (MB FOU 12 Giữa khoá) — 🛑 G6 nếu 0.
- [ ] `npm run check` → commit `PR-GV (2): tập bài KPI tháng — tuần sớm nhất, phân công lúc thi, khớp Xuất Excel`.

## Task 3 · Máy chủ: góc nhìn Phân tích › Giáo viên + ô danh sách (K1-28, §6.5, T60)

**Files:** tạo `server/src/phanTich/giaoVien.ts`; `server/src/routes/index.ts` (2 route sau :690); `tocDoDuong.ts`; `prGv.tests.ts`.

- [ ] `giaoVienPhanTich(p, f: { branchId, ct, classId, thang, theo: 'gv' | 'cn' })`:
  - `const { scope } = phamViPhanTich(p, f.branchId, f.classId)` (403 cho GV, cho chi nhánh/lớp ngoài phạm vi). `branchIds` = `[f.branchId]` nếu
    có, không thì `scope.all ? null : scope.branchIds`. `const homNay = demoToday()` **một** lần.
  - Lớp trong khung: `bangLop()` (permissions.ts:147, có nhớ) → `laFt`; khung `thuong` → lớp không FT, `ft` → FT, `ca-hai` → mọi lớp.
  - Hàng GV = người có phân công **đang hiệu lực** ở lớp trong khung + phạm vi (**một** câu, `ta.status = 'active'`, `u.status = 'active'`) ∪ người
    có trong `gv` của bài KPI (khung `thuong`). Cột: `lop` (số lớp đang dạy) · `chuaNhap`/`quaHan` (lọc `scoreDebtCells(p, homNay, branchIds)`
    theo `userId` + lớp trong khung) · `caseMo` (`listCases(p, { branchId })` → `state !== 'done'`, `ownerUserId`, `classKind` đúng khung) ·
    `kpi` (**chỉ** `ct === 'thuong'`, từ `kpiTheoGv(baiKpiThang(thang, { branchIds, classId }))`, không có bài → `kpiTuSo(0,0)`).
  - Bỏ hàng toàn 0 (và KPI tổng 0). Sắp theo tên `localeCompare(…, 'vi')`. `theo === 'cn'` (chỉ `thuong`): hàng = chi nhánh có bài
    (`kpiTheoChiNhanh`), tên chi nhánh một câu; thêm hàng tổng `kpiTuSo` trên **cả tập** (không cộng hàng).
  - Trả `{ thang, ct, coKpi: ct === 'thuong', theo, hang: [{ id, ten, lop, chuaNhap, quaHan, caseMo, kpi }], chiNhanh: [...] | null, tong: Kpi | null }`.
- [ ] `oGiaoVien(p, f & { cot, gv?, cn? })` → `{ n, tieuDe, rows }` gọi **đúng** hàm tập của ô: `lop` → lớp (href `/hoc-vien/lop/{id}`) ·
  `chua-nhap`/`qua-han` → mỗi **ô nợ** một dòng:
```ts
const o = scoreDebtCells(p, homNay, branchIds).filter((d) => d.userId === gv && trongKhung(d.classId) && (cot === 'chua-nhap' || d.overdue));
const goc = new Map(rowsFor('bai-thi', [...new Set(o.map((d) => d.attemptId))]).map((r) => [r.id, r]));
const rows = o.map((d, i) => ({ ...goc.get(d.attemptId)!, id: d.attemptId * 10 + i,           // id duy nhất cho mỗi ô
  title: `${goc.get(d.attemptId)!.title} · ${tenMon(ctCuaLop(d.classId), d.skill)}` }));
```
  `case-mo` → `rowsFor('case', ids)` · `kpi-bai`/`kpi-pass` → từ `BaiKpi` (title tên HV, sub `{maLop} · {Giữa khoá|Cuối khoá} · {tuanLich} ·
  {floor %}% · {Đạt|Chưa đạt}`, href `/hoc-vien/{studentId}`), lọc `gv` **hoặc** `cn`. `n === rows.length` luôn.
- [ ] Route: `GET /phan-tich/giao-vien` + `/phan-tich/giao-vien/o` — đọc `cn`, `ct` (`chuongTrinhTuThamSo`), `lop`, `thang` (vắng → tháng của
  `demoToday()`; có mà sai → 400), `theo`, `cot` (sai → 400), `gv`/`cn` số nguyên dương. `maybeSimulateReadError()` như khối bên cạnh.
- [ ] `tocDoDuong.ts` khối `// PR-GV`: `{ trang: 'Phân tích QL', vai: ['QL','QT','GVCN'], url: '/phan-tich/giao-vien?ct=thuong', maChuDich: { GVCN: 403 } }`,
  `?ct=ft`, `?ct=thuong&theo=cn&thang=2026-08`, `/o?ct=thuong&cot=kpi-bai&gv={gv}&thang=2026-09`, `/o?cot=chua-nhap&gv={gv}`; đo rồi chốt
  trần `max(sau+10, ⌈sau×1,3⌉)` ở `TRAN` kèm dòng chú thích ngày đo.
- [ ] Phép kiểm `PR-GV (3)`: **phủ định** — `P.normalCoreTeacher`/`P.subjectTeacher` → 403; `P.cpManager` với `branchId` MB → 403; `lop` MB bởi
  `P.cpManager` → 403. **Số khớp** — mọi ô khác 0 của `P.mbManager` (khung thường, SEP; khung ft) mở ra `rows.length === số ô`. **Hai khung** —
  `ct: 'ft'`/`'ca-hai'` → `coKpi === false`, mọi `kpi === null`. **Không N+1** (mẫu `demCauHoi` phanTich.tests.ts:152): đo số `prepare` của
  `giaoVienPhanTich(P.admin, thuong, SEP)`, rồi thêm 3 GV + 2 lớp thường + phân công + 4 bài đủ môn → đo lại → **bằng nhau** (🛑 G4 nếu tăng); dọn.
- [ ] `npm run check` → commit `PR-GV (3): Phân tích › Giáo viên — KPI tháng, bài đang nợ, Case, ô danh sách`.

## Task 4 · Máy chủ: quyền + dữ liệu hồ sơ GV (§3.12, Q10–Q13)

**Files:** tạo `server/src/giaoVien/hoSo.ts`; `routes/index.ts` (2 route sau `/branch-pulse` :1510); `tocDoDuong.ts`; `prGv.tests.ts`.

- [ ] Quyền (mã mẫu — không đặt vào `permissions.ts`, S4F đang sửa file đó):
```ts
/** Ai xem được hồ sơ GV (Q13). Trả phạm vi chi nhánh của SỐ LIỆU: null = mọi chi nhánh. Ném 404 / 403. */
export function phamViHoSoGv(p: Principal, gvId: number): { branchIds: number[] | null; laChinhMinh: boolean } {
  const conn = db();
  if (!conn.prepare(`SELECT 1 FROM users WHERE id = ? AND status = 'active'`).get(gvId)) throw notFound('Không tìm thấy giáo viên này.');
  if (p.userId === gvId) return { branchIds: null, laChinhMinh: true };
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);                     // GV thuần không có meeting.view → none
  if (scope.none) throw forbidden('Bạn chỉ xem được hồ sơ giáo viên của chính mình.');
  if (scope.all) return { branchIds: null, laChinhMinh: false };
  if (!scope.branchIds.length) throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
  const ph = scope.branchIds.map(() => '?').join(',');
  const thuoc = conn.prepare(
    `SELECT 1 FROM user_roles WHERE user_id = ? AND status = 'active' AND branch_id IN (${ph})
     UNION ALL
     SELECT 1 FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.user_id = ? AND ta.status = 'active' AND c.branch_id IN (${ph})
     LIMIT 1`).get(gvId, ...scope.branchIds, gvId, ...scope.branchIds);
  if (!thuoc) throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
  return { branchIds: scope.branchIds, laChinhMinh: false };
}
```
- [ ] `hoSoGiaoVien(p, gvId, thang)`: `phamViHoSoGv` trước mọi câu khác. Trả
  `{ gv: { id, ten, chiNhanh: string[] (từ user_roles), vai: string[] (roleLabel), kyNang: string[] (user_skills ∩ ENTRY_SKILLS, đúng thứ tự),
  laChinhMinh }, lop: [{ id, ma, laFt, chuongTrinh, vai: string[] ('GVCN' | mã kỹ năng), hocVien, chuaNhap, quaHan }],
  so: { lop, hocVien, chuaNhap, quaHan, caseMo }, caseMo: CaseChiTiet & { hocVien, maLop }[], kpi: { thang, coLopThuong, tong, theoLop } }`:
  lớp = phân công **đang hiệu lực** của gv, lớp `status = 'active'`, trong `branchIds` (một câu, `COUNT(DISTINCT e.student_id)` với
  `e.status = 'active'`); nợ = `scoreDebtCells(p, homNay, branchIds)` lọc `userId === gvId`; Case = `chiTietCaseMo(listCases(p, { ownerUserId: gvId })
  .rows.filter((c) => c.state !== 'done' && (branchIds === null || branchIds.includes(c.homeBranchId ?? c.branchId ?? -1))))`;
  KPI = `baiKpiThang(thang, { branchIds })` lọc `gv.includes(gvId)` → `kpiTuSo` tổng + theo lớp; `coLopThuong` = có phân công (mọi trạng
  thái) ở lớp không FT (một câu `EXISTS`).
  ⚠ Khi GV xem **chính mình**, `listCases(p, …)` chạy với phạm vi GV (lớp đang dạy) — đúng: Case họ phụ trách nằm trong lớp họ dạy.
- [ ] `oHoSoGv(p, gvId, { cot, thang, lop? })`: `chua-nhap` · `qua-han` · `case-mo` · `kpi-bai` · `kpi-pass` — **cùng** hàm tập như số ở trên
  (dùng lại khối dựng dòng của Task 3 — tách hàm chung `dongNo(o)`, `dongBai(bai)` trong `phanTich/giaoVien.ts`, export).
- [ ] Route `GET /giao-vien/:id` (`?thang=`) + `GET /giao-vien/:id/o` (`?cot=&thang=&lop=`); `:id` không phải số nguyên dương → 400.
- [ ] `tocDoDuong.ts`: `{ trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}', maChuDich: { GVBM: 403 } }` (`{gv}` = GVCN — cùng người GVCN
  lớp thường theo demo; tra `USER.GVCN_THUONG` ở tocDo.run.ts:114, khác người thì thêm `GVCN_THUONG: 403`), `/giao-vien/{gv}?thang=2026-08`,
  `/giao-vien/{gv}/o?cot=kpi-bai&thang=2026-09`; chốt trần như Task 3.
- [ ] Phép kiểm `PR-GV (4)` **phủ định**: GVBM xem GVCN → 403 · GVCN xem chính mình → 200 · `P.cpManager` xem GV chỉ dạy MB → 403 ·
  `P.mbManager` → 200 và mọi lớp trả về thuộc MB · `P.admin` → 200 · id 999999 → 404 · tài khoản `status='deleted'` → 404 · QL MB xem GV
  **không** có vai MB nhưng có phân công lớp MB → 200 (dựng tạm, dọn). **Số khớp:** `so.chuaNhap === ô chua-nhap .rows.length`, tương tự
  `quaHan`, `caseMo`, `kpi.tong.tong`/`pass`. `kyNang` chỉ gồm mã trong `ENTRY_SKILLS`.
- [ ] `npm run check` → commit `PR-GV (4): hồ sơ giáo viên — quyền phủ định, lớp, nợ điểm, Case/PA, KPI`.

## Task 5 · Web: Phân tích › Giáo viên + Tổng quan › Theo giáo viên (impeccable `layout`, `clarify`)

**Files:** tạo `web/src/modules/phanTich/GiaoVienKpi.tsx`; sửa `PhanTich.tsx`, `BranchPulse.tsx` (chỉ khối :136-211 + chú thích :18-21).

- [ ] `PhanTich.tsx`: `{goc === 'giao-vien' && <GiaoVienKpi branchId={branchId} ct={ct} classId={classId} />}`; khi `goc === 'giao-vien'` **ẩn** ô
  khoảng (`tg`) và hiện `ONgay kieu="thang"` (giá trị `params.get('thang') ?? homNay.slice(0, 7)`, đổi → `setParams`, tháng hiện tại thì xoá tham số).
- [ ] `GiaoVienKpi`: `useApi('/phan-tich/giao-vien?…')`. Khung `thuong` → `BoLocDoan` "Theo giáo viên · Theo chi nhánh" (`?theo=cn`). Bảng
  `table-layout: fixed` + `colgroup`, cột 1 dính (`sticky-col`), tên qua `TenGiaoVien` (link hồ sơ). Cột theo Q8/Q17; mọi số qua
  `SoLieuO nguon=/phan-tich/giao-vien/o?…&cot=…&gv=…` (tiêu đề `{cột} · {tên}`); % và Điểm KPI **không** màu, mở danh sách `kpi-bai`
  (dùng `SoLieuO` với `giaTri = kpi.tong` nhưng hiển thị chữ `66%`/`3` — nếu `SoLieuO` không cho đổi chữ thì bọc nút riêng mở `DanhSachNguon`
  giống `SoLieuO.tsx:37`, **không** chép lại panel). Tiêu đề cột có `hint` đọc `metricById('kpi-ty-le-pass-thang'|'kpi-diem').tapDuDieuKien`.
  Hàng tổng "Cả {chi nhánh}" / "Tất cả chi nhánh" ở chế độ chi nhánh. Khung ft/ca-hai: dòng chú thích 12 px "KPI tháng chỉ tính cho lớp thường
  — chọn Lớp thường." Trống: `Empty` theo Q7. 375 px: bảng cuộn trong `table-scroll`.
- [ ] `BranchPulse.tsx`: `BangTheoGiaoVien` gọi `/phan-tich/giao-vien?cn={branchId}&ct={ct}` (truyền `ct` từ `BranchPulse`), chỉ cột **Lớp · Bài chưa
  nhập · Quá hạn nhập** (`SoLieuO nguon` như trên), tên `TenGiaoVien`, **bỏ** `PEOPLE_COLS`, `pSort`, kiểu `PersonRow`/`Pulse`; đoạn chân sửa
  thành một câu ≤ 2 dòng: "Để biết cần nhắc ai — không xếp hạng. Case, PA và KPI tháng ở Phân tích › Giáo viên." (link). Cập nhật chú thích
  :18-21 (bỏ "giữ tạm tới PR-GV"). `/branch-pulse` máy chủ **giữ** (phép kiểm cũ dùng) — ghi "Chuyển cho PR-Dọn".
- [ ] impeccable **`layout`** + **`clarify`** trên hai bảng (chỉ trong phạm vi PR). `npm run check` → commit `PR-GV (5): web Phân tích › Giáo viên + bảng nợ theo GV`.

## Task 6 · Web: trang Hồ sơ GV + bật link tên GV + lối vào + ghi chú bảng quyền

**Files:** tạo `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx`; sửa `App.tsx` (route sau :135), `shared/domain/hocVienLop.ts:479`
(`= true`), `hocVienLop.tests.ts:211-212`, `Header.tsx` (:253), `AdminPage.tsx` (:108-117).

- [ ] Route `<Route path="/giao-vien/:id" element={<HoSoGiaoVienPage />} />`. Trang theo **"Bố cục trang Hồ sơ GV"** ở trên; `useApi('/giao-vien/{id}?thang=')`;
  403/404 → `ErrorState` câu máy chủ (không trang trắng). Tab qua `?tab=lop|case|kpi` (vắng → `lop`; `kpi` khi `!kpi.coLopThuong` → `lop`).
  Link "Việc của {tên} ›": `laChinhMinh ? '/cong-viec/ho-tro' : '/cong-viec/ho-tro?nguoi={id}'` — **chỉ** hiện cho chính mình hoặc người có
  `session.nav.workApprove`/QL (đích đòi `CASE_APPROVE`, routes/index.ts:391).
- [ ] Bật cờ `CO_TRANG_HO_SO_GIAO_VIEN = true`; sửa phép kiểm :211 (`true`) và :212 truyền **`false` tường minh** (`duongHoSoGiaoVien(7, {…}, false)`)
  — không xoá dòng nào. Kiểm bằng mắt: tên GV ở `DauTrangLop` và `StudentsPage` thành link cho QL; GV thấy link chỉ tên mình.
- [ ] `Header.tsx`: dưới "Hồ sơ cá nhân" thêm `<Link to={`/giao-vien/${session.user.id}`}>Hồ sơ giáo viên</Link>` khi `session.roles` có `'teacher'`.
- [ ] `AdminPage.tsx`: trong `SectionNote` bảng quyền thêm đoạn **"Quyền dẫn xuất (không có ô bật/tắt):"** · *Xem hồ sơ giáo viên* — chính mình;
  Quản lý: giáo viên thuộc chi nhánh mình; Quản trị hệ thống: tất cả · *Xuất Excel kết quả Test* — Quản lý, Quản trị hệ thống (phạm vi mình),
  GVCN (lớp mình chủ nhiệm) (K1-53, PR-XUAT #132).
- [ ] impeccable **`layout`** + **`clarify`** trang hồ sơ (375 px: dòng 5 số xuống hàng gọn, không dồn chữ). `npm run check` → commit
  `PR-GV (6): trang Hồ sơ giáo viên + tên GV thành link + lối vào`.

## Task 7 · Rebase, bấm thử, audit/polish, tài liệu, mở PR

- [ ] `git fetch origin && git rebase origin/main` → gỡ theo bảng chồng file → 🛑 G2/G3 → `npm run check`.
- [ ] Bấm thử (Playwright, 4177/5377), **sáng và tối**, desktop + **375 px**, ảnh `thiet-ke/anh/pr-gv/` (trước = main, sau):
  QL MB: Phân tích › Giáo viên khung Lớp thường SEP (có số MB Pre FOU 03) → bấm "Bài đủ môn" → số dòng = số ô → ‹ AUG › → Theo chi nhánh;
  khung FT (không cột KPI, có dòng gợi ý) · Tổng quan › Theo lớp (MB) › Theo giáo viên (3 cột, số bấm được) · hồ sơ lớp MB FOU 12 → bấm tên
  GVCN → hồ sơ → 3 tab · GVCN id 7: menu tài khoản › Hồ sơ giáo viên (tab KPI có) + gõ tay `/giao-vien/9` → câu 403 · GVBM id 9: tên đồng
  nghiệp ở hồ sơ lớp là chữ thường · QL CP gõ `/giao-vien/7` → 403 · Quản trị mọi chi nhánh.
- [ ] impeccable **`audit`** rồi **`polish`** (sáng + tối): tương phản ≥ 4.5:1, chữ ≥ 12 px, không màu viết cứng, focus bàn phím, tab `aria-selected`.
- [ ] Tài liệu: `CODE_MAP.md` (3 tệp máy chủ mới, trang web mới, route), `DEMO.md` (một dòng: "KPI tháng: Phân tích › Giáo viên › Lớp thường ·
  SEP/AUG 2026 · MB").
- [ ] `/ponytail-review`; liệt kê mọi chú thích `ponytail:` trong mô tả PR. Quét `tests/run.js` treo, tắt 4177/5377.
- [ ] Mở PR `PR-GV: Hồ sơ giáo viên + Phân tích › Giáo viên + KPI tháng` — thân PR: bảng mã yêu cầu (K1-28, K5-56, T50, §3.12, §3.3, §3.7,
  Q-E, M-06, K1-53) → ảnh → đạt/không; "tầng 1 của màn": hồ sơ GV = dòng 5 số · Phân tích › Giáo viên = cột Điểm KPI; lệch kế hoạch;
  "Chuyển cho PR khác"; câu C1/C2; mốc B → sau. Kết thúc thân PR bằng dòng attribution của phiên.

## Chuyển cho PR khác

| Việc | PR |
|---|---|
| `branchpulse.ts` `peopleOf` + trường `people` của `/branch-pulse` không còn nơi gọi ở web (web dùng `/phan-tich/giao-vien`); `peopleOf` khi không chọn chi nhánh lấy chi nhánh từ Case (:263-266) → QT không Case thì rỗng. Xoá cùng phép kiểm cũ (`luatMayChu.tests.ts:281`, `prMt.tests.ts:249`, `run.ts:3617…9359`) | PR-Dọn |
| Biểu thức "tuần sớm nhất" nay ở 2 nơi (`xuatMt.ts:188-191`, `kpiThang.ts TUAN_BAI`) — gộp một hằng khi LT2b xong xuatMt.ts (phép kiểm khớp số Task 2 giữ an toàn tới đó) | PR-Dọn |
| Bộ lọc chương trình Pre FOU · FOU · BE · ELE + bỏ "Cả hai" cho **cả** Phân tích (gồm góc Giáo viên) | PR-Pb2 (T60, MH4) |
| Hồ sơ GV theo kỹ năng (vấn đề hay gặp → PA → kết quả, mockup 06d) + "Hỗ trợ đã thực hiện" | PR-Pb2 hoặc sau (Hiệu quả PA theo người) |
| "Chấm đúng hạn" lịch sử — cần cột "lần nhập đầu" (nếu chủ sản phẩm chọn C1 = B) | PR-UXF |

## KIỂM (người rà cuối đợt 5 — Opus 5.5)

- [ ] Quyền **phủ định** đủ 6 ca (GV→đồng nghiệp, QL CP→GV MB, id lạ, tài khoản xoá, GV→Phân tích, QL→`cn` ngoài) và ô danh sách cùng quyền số tổng.
- [ ] KPI: tuần sớm nhất; đủ môn mới tính; Pre FOU có; Mini Test/lượt huỷ không; phân công chồng tuần + khử trùng người; theo chi nhánh không
  cộng từ GV; so số nguyên, % làm tròn xuống; **khớp Xuất Excel** (phép kiểm (2d)).
- [ ] Số ở ô = số dòng khi bấm ở mọi cột (Phân tích, Tổng quan, hồ sơ). Không N+1 (phép kiểm (3), trần `tocDoDuong.ts`).
- [ ] Hai khung: KPI chỉ Lớp thường; không chữ SOS lớp thường; không cột trộn W/G+V.
- [ ] Không migrate, không quyền mới; `permissions.ts`, `regular.ts`, `xuatMt.ts`, `phanTichLop.ts` **không** đổi trong diff.
- [ ] Giao diện: không xếp hạng/màu tốt-xấu; sáng + tối; 375 px; chữ ≥ 12 px; token màu; ảnh `thiet-ke/anh/pr-gv/`.
- [ ] Chỉ sửa (không xoá) 4 phép kiểm cũ: `phanTich.tests.ts:60`, `hocVienLop.tests.ts:211-212`, `run.ts:8189` (+ `expected`).
- [ ] `Co-Authored-By` đúng model thật; chú thích `ponytail:` liệt kê trong thân PR.

## Nhật ký

| Ngày | Task | Ghi chú (lệch kế hoạch · dòng mã thật · 🛑 · quyết định) |
|---|---|---|
| | | |
