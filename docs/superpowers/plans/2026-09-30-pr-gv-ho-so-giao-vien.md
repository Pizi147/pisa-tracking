# PR-GV · Hồ sơ giáo viên + số liệu theo giáo viên — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

> **Sửa 30/09 (Q30-5, Q30-6):** chủ sản phẩm **bỏ hẳn KPI tháng của GV** (tạm hoãn) — bản trước của kế hoạch này (KPI tháng,
> `kpiThang.ts`, góc Phân tích › Giáo viên, tỷ lệ pass tháng, điểm 5/3/0, sổ chỉ số KPI) **không còn hiệu lực**. Thay bằng
> **số liệu theo giáo viên** cụ thể, dễ nhìn: GV xem của chính mình, Quản lý xem GV chi nhánh mình, Quản lý tự đánh giá.
> Toàn web ưu tiên **mã tuần** (`W2 OCT`); ngày chỉ cho hạn cụ thể.

**Goal:** (1) Trang **Hồ sơ giáo viên** `/giao-vien/:id` — năm khối số liệu lấy từ dữ liệu có sẵn: **Việc đang có** (4 nhóm việc, quá
hạn) · **Lớp đang dạy** (vai, học viên, ô điểm chưa nhập / quá hạn nhập) · **Kết quả gần nhất** của lớp đang dạy (FT: MT gần nhất
theo kỹ năng; lớp thường: Giữa/Cuối khoá theo môn) · **Case đang phụ trách** (trạng thái, việc tiếp, hạn) · **Yêu cầu đã gửi** (chờ
duyệt, bị từ chối). Mọi số bấm được ra đúng danh sách tạo nên nó (số ở ô = số dòng). (2) Tổng quan › Theo lớp › **Theo giáo viên**
thành bảng các GV của chi nhánh (Quản lý, Quản trị) — sắp theo tên, **không xếp hạng**, số bấm được, tên là link hồ sơ. (3) Tên GV ở
hồ sơ lớp / Học viên & Lớp thành link; menu tài khoản có "Hồ sơ giáo viên".
**Architecture:** Máy chủ một tệp mới `server/src/giaoVien/hoSo.ts` (quyền xem + hồ sơ + bảng chi nhánh + ô danh sách). **Không** luật
số mới — mọi số gọi hàm đang có: `myWork` (việc), `scoreDebtCells` (ô điểm nợ), `listCases` + `chiTietCaseMo` (Case), `phanTichLop`
(kết quả lớp), `yeuCauCuaToi` (yêu cầu). Luật thuần nhỏ ở `shared/domain/hoSoGiaoVien.ts` (cột ô, đường tới Công việc).
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · libsql (Turso) · `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` **§3.1f Q30-5, Q30-6** (thắng T50, §6.5 phần KPI, M-06, Q-E) ·
§5.7 MH1 · §8 dòng PR-GV · `2026-09-22-ux-toan-web-truoc-deploy-design.md` **§3.3** (Theo giáo viên), **§3.7** (tên GV là link), **§3.12**
(hồ sơ GV), G-2/G-3/G-10/G-12 · rà `thiet-ke/ra-27-09/K1.md` **K1-28** (bảng Theo giáo viên chỉ số đang nợ), **K1-53** (quyền dẫn xuất) ·
mockup **`thiet-ke/mockup/21-ho-so-giao-vien.html`** (màn A–E, bản chốt bố cục) · `06d`, `06e` chỉ tham khảo cũ.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-GV** · đợt 5 · làn **B** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-gv-ho-so-giao-vien` · `.claude/worktrees/pr-gv-ho-so-giao-vien` (từ `origin/main` mới nhất) |
| Cổng thử | API **4177** · Vite **5377** (không 4000/5173; LT2a 4167/5367 · LT2b 4187/5387 chạy song song) |
| Model | **Fable 5.1 · High** · phương án B: **Opus 5.5 · High**. Fable: đọc kỹ "Hướng dẫn riêng cho model thực thi" |
| Người rà | **Opus 5.5**, session riêng — rà **một lượt cuối đợt 5** (không rà từng PR) |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** |
| Migrate | **Không.** Không bảng/cột/quyền mới (quyền xem hồ sơ dẫn xuất từ `meeting.view` + `user_roles` + phân công — Q9). DB reset trước deploy |
| Skill | Gõ **`/ponytail lite`** đầu phiên (PR có giao diện). impeccable: **`layout`** Task 5–6 (hồ sơ, bảng GV, 375 px) · **`clarify`** Task 5–6 (nhãn khối, ⓘ, dòng trống, câu 403/404) · **`audit`** rồi **`polish`** Task 7 (sáng **và** tối). Không `init`/`document`/`hooks on`/`npx impeccable install|update` |
| Phụ thuộc | Không chờ PR nào. PR-S4F (#135) **đã merge** — `permissions.ts`, `phanTichLop.ts` hết bị khoá. 🛑 cổng rebase khi **LT2a** (sửa `mywork.ts`, `routes/index.ts`), **LT2b**, **PR-CT** (việc Bàn giao) merge trước — Task 7 |
| Không làm | **KPI tháng** (T50, §6.5, M-06, Q-E — **bỏ theo Q30-5**: không `kpiThang.ts`, không cột Tỷ lệ pass tháng / Điểm KPI, không sổ chỉ số KPI, không góc Phân tích › Giáo viên) · xếp hạng, tô màu tốt/xấu, trung bình chi nhánh, so GV với nhau · "chấm đúng hạn" lịch sử (C1) · Hiệu quả PA theo người, thẻ theo kỹ năng mockup 06d (PR-Pb2/sau) · sửa hồ sơ GV (chỉ xem) · khái niệm **ca học** (học viên không học ca cố định) |

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
| `server/src/worklist/mywork.ts` | **LT2a** xoá nhóm `verify`/tín hiệu (:18, :97-102, :292-330…) · **PR-CT** thêm loại việc Bàn giao | **thêm một hàm** `viecCuaNguoi` **cuối file** (chuyển nguyên thân khối `nguoi` số từ route) — không sửa `myWork` | khác khối — giữ cả hai |
| `server/src/routes/index.ts` | LT2a (:1450-1471, đường mới) · LT2b (`/ket-luan-ft` :1835) · PR-CT (lệnh chuyển, bàn giao) | khối `typeof nguoi === 'number'` của `/my-work` (:390-446) → **một dòng** gọi `viecCuaNguoi`; 3 route mới **ngay sau** `/branch-pulse` (:1510) | khác khối — giữ cả hai |
| `shared/domain/tongQuan.ts` | **PR-CT** thêm loại việc Bàn giao vào `NHOM_CUA_LOAI` · LT2a bớt `verify` | **KHÔNG sửa** — chỉ import `NHOM_VIEC`, `nhomViecCua` | — |
| `server/src/classes/phanTichLop.ts` | (không PR đợt 5 nào đã biết) | `cong()` ghi thêm **id học viên** vào trường mới `ds` (Task 3) — `o` giữ nguyên | — |
| `server/src/duyet/yeuCau.ts` | LT2a/PR-CT (loại thẻ mới — ở `loaiYeuCau.ts`/`yeuCauDuyet.ts`) | **một chữ**: `export` trước `function trongPhamVi` (:310) | khác dòng |
| `server/src/tests/run.ts` | LT2a, LT2b, PR-CT: mỗi PR một dòng đăng ký | 2 dòng `runPrGvTests` **cuối** file (sau `runPrS4fTests` :9823-9824). **Không** đổi test sổ chỉ số | giữ mọi dòng |
| `server/src/tests/tocDoDuong.ts` · `tocDo.run.ts` | LT2a, LT2b, PR-CT: đường đo + trần | khối `// PR-GV` cuối `DUONG_DO`, cuối `TRAN` | giữ mọi khối |
| `shared/domain/hocVienLop.ts` · `server/src/tests/hocVienLop.tests.ts` | LT2a/LT2b (`viecTiepCuaEm` :309-340, menu) | **một dòng** :505 `CO_TRANG_HO_SO_GIAO_VIEN = true` · test :211-212 | khác dòng |
| `shared/domain/index.ts` | LT2a, LT2b, PR-CT export mới | 1 dòng `export * from './hoSoGiaoVien.ts'` | giữ cả hai |
| `web/src/modules/worklist/BranchPulse.tsx` | (S4F đã merge) | **chỉ** khối "Theo giáo viên" :129-211 (thay bằng `BangGiaoVienChiNhanh`) + chú thích :18-21 + dòng :79 truyền `ct` | — |
| `web/src/App.tsx` · `Header.tsx` · `AdminPage.tsx` | PR-CT **có thể** thêm route panel | 1 route sau `/ho-so-ca-nhan` (:135) · 1 link sau "Hồ sơ cá nhân" (:252-254) · 1 đoạn `SectionNote` (:109-117) | khác dòng |
| `permissions.ts` · `normal/regular.ts` · `phanTich/*` · `shared/domain/metrics.ts` | LT2a/LT2b | **KHÔNG sửa** (kế hoạch cũ sửa `metrics.ts`/`phanTich.ts` cho KPI — **bỏ**) | — |
| `CODE_MAP.md`, `DEMO.md` | mọi PR | chỉ thêm dòng | giữ cả hai |

**Báo planning (không phải việc của PR-GV):** kế hoạch LT2a dòng chồng `metrics.ts` (sổ chỉ số "31 → 33, gộp = 30") và LT2b
(`datTheoTyLe`, `tyLeTongLo` "PR-GV dùng cho KPI") còn nhắc KPI — nay PR-GV **không** thêm chỉ số, **không** dùng hai hàm đó.

## Global Constraints

- **Một nguồn — không luật số mới:** việc = `myWork` (người xem là GV) hoặc `viecCuaNguoi` (người khác xem), gom nhóm bằng `nhomViecCua`
  (tongQuan.ts:39) · ô điểm nợ = `scoreDebtCells` (scoreDebt.ts:23) · Case = `listCases` + `chiTietCaseMo` (caseLop.ts:48) · kết quả lớp =
  `phanTichLop` (phanTichLop.ts:33) · yêu cầu = `yeuCauCuaToi` (yeuCau.ts:344). Số ở ô và danh sách khi bấm gọi **cùng** hàm tập —
  **số ở ô = số dòng khi bấm** (phép kiểm Task 3, 4). Số "Việc" bấm → **Công việc** đã lọc đúng người + nhóm (cùng `/my-work`).
- **Quyền — phép kiểm PHỦ ĐỊNH:** GV xem hồ sơ **chính mình**; QL xem GV thuộc chi nhánh mình (vai **hoặc** phân công đang hiệu lực);
  Quản trị tất cả. GV xem đồng nghiệp → **403**; QL CP xem GV chỉ ở MB → **403**; id lạ/đã xoá → **404**; GV gọi bảng chi nhánh → **403**;
  QL hỏi `cn` ngoài phạm vi → **403**. Khi QL xem: **mọi** số chỉ tính lớp/Case/thẻ trong chi nhánh QL. Ô danh sách áp **đúng** quyền số tổng.
- **Kiểm dữ liệu nhập ở máy chủ:** `:id`, `cn`, `lop` số nguyên dương (sai → 400); `cot` thuộc `COT_O_GV` (sai → 400 "Cột không hợp lệ.");
  `ct` qua `chuongTrinhTuThamSo`; `dong`/`moc` của ô kết quả phải có trong bảng `phanTichLop` của lớp đó (sai → 400). Web kiểm trước chỉ để báo sớm.
- **SQL (bẫy Turso):** chỉ `?` — **không** tham số đặt tên (`db.ts:24-30` ném lỗi); `IN (…)` dựng `?` theo số phần tử, **lô ≤ 400**;
  bảng chi nhánh **không N+1** — số câu **không tăng theo số GV / lớp / Case** (phép kiểm Task 4). Hồ sơ một GV: `phanTichLop` mỗi lớp
  (≤ 3 câu/lớp, GV thường ≤ 8 lớp) — `ponytail:` ghi trần + đường nâng (gộp lô) nếu vượt trần `tocDoDuong`. PR-GV không ghi CSDL mới
  (các hàm có sẵn tự chốt như `settleNoShows`, `quetYeuCau` giữ nguyên hành vi).
- **Không xếp hạng, không so sánh:** bảng GV sắp theo **tên** (`localeCompare(…, 'vi')`), không nút sắp xếp cột, không hàng tổng/trung bình,
  không màu tốt/xấu cho **người**. Màu nghĩa chỉ cho **việc** (quá hạn = `--bad`/`text-bad`) và **kết quả học viên** (đạt / chưa đạt dùng
  màu đang có ở tab Phân tích lớp). Hồ sơ GV xem: không có số của người khác.
- **Hai khung (MH4):** bảng kết quả **tách** FT và Lớp thường (không trộn cột L R W1 W2 S với L R W S); lớp thường **không** chữ SOS (T58).
- **Chữ (Q30-6):** tuần hiện mã `W2 OCT` qua `tuanLich()`; ngày chỉ cho **hạn** (`hạn 02/10` qua `<Han>`/`ONgay`). Không lộ mã
  (`progress`, `writing1`, ISO, `attempt_no`); tên môn `tenMonNgan(ct, k)`, kỹ năng GV `ENTRY_SKILL_SHORT` (MH1). "Quản lý" đủ chữ ở câu lỗi.
- **Tinh tế:** số `tabular-nums` canh phải, `table-layout: fixed` + `colgroup`; dòng phụ ≤ 60 ký tự (G-3); chữ ≥ 12 px; dấu tích nhỏ (SVG
  12 px, không ký tự ▾/✓ Inter nhỏ — bẫy bộ nhớ); chỉ token màu `var(--…)`/lớp đã ánh xạ (PR-SANG) — **không** `white`/hex/`color-mix(... white)`;
  375 px không cuộn ngang **trang** (bảng lớp → danh sách thẻ; bảng GV cuộn trong `table-scroll`), nút ≥ 44 px ở màn hẹp.
- **Ngày nghiệp vụ:** `demoToday()` (máy chủ, **một** lần mỗi request) / `useNgayNghiepVu().homNay` (web).

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| # | Chủ đề | Chốt | Vì sao |
|---|---|---|---|
| Q1 | **KPI tháng** | **Bỏ theo Q30-5** (tạm hoãn): không cột "Tỷ lệ pass tháng / Điểm KPI", không `kpiThang.ts`, không góc Phân tích › Giáo viên (góc đó chỉ để KPI), không sổ chỉ số KPI | Chủ sản phẩm 30/09. T50, §6.5 (phần KPI), M-06, Q-E hoãn |
| Q2 | Hồ sơ có gì | **5 khối** theo thứ tự: (1) Việc đang có · (2) Lớp đang dạy · (3) Kết quả gần nhất · (4) Case đang phụ trách · (5) Yêu cầu đã gửi. **Một trang, không tab** — dữ liệu một người vừa một màn; 375 px xếp dọc | "Đủ thông tin theo dõi cụ thể, dễ nhìn, hữu dụng" (Q30-5); tab giấu số |
| Q3 | Tầng 1 | Khối **Việc đang có** đứng đầu: 4 ô nhóm việc (`NHOM_VIEC`: Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành), mỗi ô **số việc** lớn + "**k quá hạn**" đỏ (0 → chữ mờ "không quá hạn") | Việc cần làm ngay = thứ GV và QL cần thấy trước |
| Q4 | Nguồn "Việc" | Chính mình: `myWork(p)`. Người khác: `viecCuaNguoi(p, gvId)` = **nguyên** thân khối `nguoi` số của `/my-work` (routes/index.ts:390-446, lọc `can` người xem, bỏ `mgmt`) chuyển sang `mywork.ts`; route gọi lại hàm đó. Bấm số → `/cong-viec/ho-tro?nguoi={id|toi}&nhom={k}&khung=tat-ca` (+`&loc=qua-han` ở số quá hạn) | Một nguồn với Công việc (HoTroHocVienTab.tsx:43-51 đọc `nguoi/nhom/khung/loc`) → số = số dòng. `khung=tat-ca` để lựa chọn khung đã nhớ không làm lệch số |
| Q5 | "Ý thức & Phối hợp" | Số trên hồ sơ = việc Ý thức **có hạn** (`yt_*`); **không** cộng nhắc mềm Phối hợp SOS (chip Công việc của chính GV có cộng — ⓘ ghi rõ) | Nhắc mềm là của phiên người xem, không phải số liệu người đó |
| Q6 | Lớp đang dạy | Phân công **đang hiệu lực** (`activeAt`), lớp `active`. Cột: `Lớp` (link) · `Khung` (chip FT/Lớp thường) · `Vai` (`GVCN` + kỹ năng) · `Học viên` · `Ô điểm chưa nhập` · `Quá hạn nhập` (số bấm được) | Ô = một môn của một bài (`scoreDebtCells`, như bảng chi nhánh cũ) — ⓘ "Một ô = một kỹ năng của một bài" để không lẫn với "số việc" |
| Q7 | Kết quả gần nhất | FT: **MT gần nhất có điểm** của lớp (cột `mtN` lớn nhất có `tong > 0`) × L R W1 W2 S — ô `đạt kỳ vọng / có điểm`. Lớp thường: mốc gần nhất có điểm (Cuối khoá nếu có, không thì Giữa khoá) × `Cả bài` + môn. GVBM: ô môn **mình dạy** đậm, môn khác mờ (vẫn hiện — ngữ cảnh lớp); GVCN: mọi ô đậm. Chưa có điểm → "—" | Từ `phanTichLop` (cùng số tab Phân tích lớp). Không làm "trung bình GV" — không so người |
| Q8 | Case đang phụ trách | `listCases(p, { ownerUserId: gv })` → `state !== 'done'` → `chiTietCaseMo`. Cột: `Học viên` · `Lớp` · `Case` (`tieuDe`) · `Trạng thái` (`NhanTrangThai`) · `Việc tiếp` (chữ + `<Han>` ngày) ; quá hạn → chip đỏ "quá hạn n ngày". Đếm: Case mở · việc tiếp quá hạn | Khuôn `BangCanHoTro.tsx:200-230`. PA do GV **thực hiện** (Case người khác) đã nằm trong việc "Ghi kết quả PA" của khối 1 — không đếm lần hai |
| Q9 | Quyền xem hồ sơ | Chính mình · QL: GV có vai **hoặc** phân công đang hiệu lực ở chi nhánh QL · Quản trị (grant không chi nhánh): tất cả. QL xem: số chỉ lớp/Case/thẻ thuộc chi nhánh QL | Như `/my-work?nguoi=` + phân công (link từ hồ sơ lớp không được 403). `viecCuaNguoi` dùng **cùng** `phamViHoSoGv` để Công việc không 403 khi hồ sơ 200 |
| Q10 | Yêu cầu đã gửi | `yeuCauCuaToi(loadPrincipal(gv))` — QL xem: lọc `trongPhamVi(p, …)`. Hai số: **chờ duyệt** (kèm "k quá hạn duyệt") · **bị từ chối** (60 ngày, như hộp Yêu cầu của tôi). Bấm → danh sách thẻ, dòng mở `duongThe(id, 'nguoi-xin'|'duyet')` | Q30-5 "đủ thông tin theo dõi"; không thêm luật |
| Q11 | Bảng GV chi nhánh | **Tổng quan › khối "Theo lớp · {chi nhánh}" › Theo giáo viên** (giữ chỗ cũ, thay bảng). Cột: `Giáo viên` (link hồ sơ) · `Lớp` · `Học viên` · `Ô điểm chưa nhập` · `Quá hạn nhập` · `Case phụ trách` · `Case quá hạn`. Theo `ct` của Tổng quan. **Không** cột "Việc quá hạn" (cần `myWork` mỗi GV = N+1 — câu C2) | K1-28; §3.3; bảng cũ có nút sắp xếp theo số = xếp hạng ngầm → bỏ |
| Q12 | Góc Phân tích › Giáo viên | **Không làm** (kế hoạch cũ có — chỉ để KPI). Phân tích giữ 4 góc như `main` | Q1 |
| Q13 | Mã tuần | Mọi tuần qua `tuanLich()` (`W2 OCT`); hạn Case/việc = ngày (`hạn 02/10`). Không cột tuần nào dạng ngày | Q30-6 |
| Q14 | Ghi luật vào bảng quyền Quản trị (K1-53, từ PR-XUAT #132) | Một đoạn "Quyền dẫn xuất (không có ô bật/tắt)" dưới bảng quyền: Xem hồ sơ GV · Xuất Excel kết quả Test | Không quyền mới → không migrate |
| Q15 | Lối vào + khu vực | Không thuộc 4 khu (`khuVucCuaDuong` → null, như Hồ sơ cá nhân). Lối vào ở "Nằm ở đâu" dưới | G-12 |
| Q16 | Bàn giao chuyển lớp (PR-CT) | **Không tự làm.** PR-CT merge trước → việc Bàn giao tự vào khối 1 qua `nhomViecCua` (PR-CT gắn nhóm); nếu PR-CT có hàm đếm "Bàn giao n/m em" theo lớp thì thêm chip nhỏ ở dòng lớp (khối 2) **gọi hàm đó** — 🛑 G4 | Q30-2; một nguồn |
| Q17 | Thứ tự dòng | Lớp: FT trước, rồi theo mã lớp. Case: quá hạn trước, rồi hạn gần. Bảng GV: theo tên | Không theo số (tránh xếp hạng) |

**Câu cần chủ sản phẩm quyết** (không chặn — đang theo khuyến nghị):
- **C1 · "Chấm đúng hạn" lịch sử trong hồ sơ GV?** A. Không làm, chỉ nợ hiện tại (**khuyến nghị** — `assessment_scores.entered_at` bị ghi
  đè khi sửa điểm, attempts.ts:1664, số trễ hạn sẽ sai) · B. Thêm cột "lần nhập đầu" (migrate, DB reset nên sạch) + số "đúng hạn 8 tuần" ở PR-UXF.
- **C2 · Bảng GV chi nhánh có cột "Việc quá hạn" (mọi loại việc) không?** A. Không — bảng chỉ số ô điểm + Case, việc quá hạn xem trong hồ sơ
  từng người (**khuyến nghị** — cột này phải chạy `myWork` cho từng GV, chậm theo số GV trên Turso) · B. Có, làm ở PR sau bằng hàm gộp nhiều người.

## Nằm ở đâu (mockup `21-ho-so-giao-vien.html`)

| Module | Nằm ở | Ai thấy |
|---|---|---|
| Trang Hồ sơ GV `/giao-vien/:id` (màn A–C) | (1) **menu tài khoản (góc phải thanh đầu) › "Hồ sơ giáo viên"** ngay dưới "Hồ sơ cá nhân" — người có vai Giáo viên · (2) tên GV ở **Học viên & Lớp › hồ sơ lớp › dòng thông tin** (GVCN + GV bộ môn — `DauTrangLop.tsx:150,185`) · (3) **Học viên & Lớp › dòng lớp** "GVCN {tên}" (`StudentsPage.tsx:367`) · (4) **Tổng quan › Theo lớp · {chi nhánh} › Theo giáo viên** (cột tên) | GV: chỉ chính mình (tên đồng nghiệp là chữ thường) · QL: GV chi nhánh mình · Quản trị: tất cả |
| Bảng GV chi nhánh (màn D) | **Tổng quan › khối "Theo lớp · {chi nhánh}" › công tắc "Theo giáo viên"** (chỉ khi đã chọn một chi nhánh) | QL, Quản trị |

**Bố cục trang Hồ sơ GV** (desktop; 375 px xếp dọc — màn E):
1. **Đầu trang** (`Card`): tên **20 px 700** · dòng phụ 14 px `Giáo viên · Monbay` (vai · chi nhánh theo vai) · chip nhỏ chỉ đọc **"Phụ trách
   được: L R W1 W2 S"** (`user_skills` ∩ `ENTRY_SKILLS`, đúng thứ tự; không khai → "chưa khai") · phải: nút **"Mở Công việc ›"** (chính mình) /
   **"Việc của {tên} ›"** (QL). QL xem: dòng 12 px `Quản lý đang xem · chỉ tính lớp ở Monbay`.
2. **Việc đang có** (tầng 1): 4 ô ngang (375 px: lưới 2×2) — nhãn 12 px, số **24 px 700**, dòng dưới "2 quá hạn" (`text-bad`) hoặc "không quá hạn" mờ.
3. **Lớp đang dạy**: bảng Q6; dưới bảng một dòng tổng nhỏ `4 lớp · 41 học viên` (không phải ô số).
4. **Kết quả gần nhất**: hai bảng nhỏ "Fast Track · MT gần nhất" và "Lớp thường · Giữa/Cuối khoá" (chỉ bảng có lớp). Ô `5/8` (số bấm được →
   8 học viên, mỗi dòng "Đạt / Chưa đạt"); ô dưới một nửa đạt tô nền `--bad-bg` như tab Phân tích lớp. ⓘ chép câu `goiY` của `PhanTichLopTab.tsx:28-30`.
5. **Case đang phụ trách**: đầu khối `5 Case · 1 việc tiếp quá hạn` (hai số bấm được) rồi bảng Q8. Không có → "Không có Case nào đang mở."
6. **Yêu cầu đã gửi**: một hàng `2 chờ duyệt (1 quá hạn duyệt) · 1 bị từ chối trong 60 ngày` + link "Yêu cầu của tôi ›" (chính mình) /
   "Chờ duyệt ›" (QL). Không có → "Không có yêu cầu nào đang chờ."

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc nếu chạy Fable)

1. **Năm chỗ dễ sai nhất** có mã mẫu trong Task: (a) `phamViHoSoGv` — GV không có `meeting.view` (seed/data.ts:78) nên `scopeFor` trả
   `none` → 403 ngay (không dùng `laVaiQuanLy` ở máy chủ); (b) `viecCuaNguoi` là **chuyển nguyên** thân route (không viết lại), rồi đổi phép
   kiểm chi nhánh sang `phamViHoSoGv`; (c) "MT gần nhất" = cột `mtN` **lớn nhất có dữ liệu** của cả lớp (một mốc cho cả dòng), không phải
   mỗi kỹ năng một mốc; (d) ô "Ô điểm chưa nhập" đếm **ô** (kỹ năng × lượt) nên danh sách một dòng / ô, `id` duy nhất; (e) QL xem → lọc
   **cả** lớp, ô nợ, Case, thẻ theo `branchIds` của `phamViHoSoGv`.
2. Không tự tính: nợ điểm (`scoreDebtCells`), trạng thái Case (`chiTietCaseMo`), đạt/kỳ vọng (`phanTichLop`), nhóm việc (`nhomViecCua`).
3. `listCases` (cases.ts:1988) đã áp phạm vi **người xem**; lọc thêm `ownerUserId` (CaseFilters :1683) và `state !== 'done'` trong bộ nhớ;
   chi nhánh của Case = `homeBranchId ?? branchId` (:1719-1720).
4. 🛑 **Dừng hỏi planning** nếu: **G1** cần cột/bảng/quyền mới; **G2** sau rebase LT2a đã đổi `myWork`/khối `/my-work?nguoi=` khác hẳn
   (không còn chuyển nguyên được); **G3** `scopeFor`/`teacherAllows` đổi làm phép kiểm quyền PR-GV đổi kết quả; **G4** PR-CT đã merge mà
   loại việc Bàn giao **không** có trong `NHOM_CUA_LOAI` (rơi vào "Vận hành") hoặc cần đếm bàn giao mà PR-CT không xuất hàm; **G5** số câu
   SQL bảng GV chi nhánh **tăng** khi thêm GV/lớp/Case (Task 4); **G6** phép kiểm cũ phải **xoá** (chỉ được sửa `hocVienLop.tests.ts:211-212`
   và phép kiểm `/my-work?nguoi=` nếu câu 403 đổi — ghi Nhật ký).

## Task 0 · Nhánh, mốc, đối chiếu dòng mã

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-gv-ho-so-giao-vien -b pr-gv-ho-so-giao-vien origin/main`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch đợt 5> -- docs/superpowers/plans/2026-09-30-pr-gv-ho-so-giao-vien.md
  thiet-ke/mockup/21-ho-so-giao-vien.html`.
- [ ] Nhật ký: LT2a / LT2b / PR-CT đã merge chưa (`git log origin/main --oneline | grep -E "PR-(LT2a|LT2b|CT)"`).
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B**.
- [ ] Đối chiếu (grep) — lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng: `CO_TRANG_HO_SO_GIAO_VIEN` (hocVienLop.ts:505),
  `function BangTheoGiaoVien` (BranchPulse.tsx:148), `export function scoreDebtCells` (scoreDebt.ts:23), `export function listCases`
  (cases.ts:1988), `export function chiTietCaseMo` (caseLop.ts:48), `export function phanTichLop` (phanTichLop.ts:33), `export function myWork`
  (mywork.ts:253), `typeof nguoi === 'number'` (routes/index.ts:390), `function trongPhamVi` (yeuCau.ts:310), `export function yeuCauCuaToi`
  (:344), `export function nhomViecCua` (shared/domain/tongQuan.ts:39), `export function rowsFor` (worklist/metrics.ts:62), `api.get('/branch-pulse'`
  (routes/index.ts:1507), `<Route path="/ho-so-ca-nhan"` (App.tsx:135), link "Hồ sơ cá nhân" (Header.tsx:253), `SectionNote` bảng quyền
  (AdminPage.tsx:109), `.replace('{gv}'` (tocDo.run.ts:130), `runPrS4fTests` (run.ts:9823).
- [ ] Commit `PR-GV (0): kế hoạch + mockup 21 + mốc {B} phép kiểm`.

## Task 1 · Luật thuần: cột ô + đường tới Công việc

**Files:** tạo `shared/domain/hoSoGiaoVien.ts` (+ export ở `shared/domain/index.ts`); tạo `server/src/tests/prGv.tests.ts` (`runPrGvTests`,
đăng ký **cuối** `run.ts` theo mẫu `runPrS4fTests`).

- [ ] `hoSoGiaoVien.ts`:
```ts
import { NHOM_VIEC, nhomViecCua, type NhomViec } from './tongQuan.ts';

/** Ô bấm được ở hồ sơ GV / bảng GV chi nhánh (Q2, Q11). Mỗi ô một hàm tập ở server/src/giaoVien/hoSo.ts. */
export const COT_O_GV = ['lop', 'hoc-vien', 'chua-nhap', 'qua-han', 'case-mo', 'case-qua-han', 'yc-cho', 'yc-tu-choi', 'ket-qua'] as const;
export type CotOGv = (typeof COT_O_GV)[number];
export const laCotOGv = (s: unknown): s is CotOGv => (COT_O_GV as readonly unknown[]).includes(s);

/** Đếm việc theo 4 nhóm (Q3) — cùng `nhomViecCua` với Công việc, nên số = số dòng ở Công việc đã lọc nhóm. */
export function demViecTheoNhom(items: readonly { group: string; urgency: string }[]): { nhom: NhomViec; n: number; quaHan: number }[] {
  return NHOM_VIEC.map((nhom) => {
    const ds = items.filter((i) => nhomViecCua(i.group) === nhom);
    return { nhom, n: ds.length, quaHan: ds.filter((i) => i.urgency === 'overdue').length };
  });
}

/** Đường tới Công việc đã lọc đúng người + nhóm (Q4). `khung=tat-ca` để lựa chọn khung đã nhớ không làm lệch số. */
export function duongViecCuaGv(gvId: number, nguoiXem: { userId: number; laQuanLy: boolean }, nhom: NhomViec | null, chiQuaHan = false): string {
  const q = new URLSearchParams();
  if (nguoiXem.laQuanLy) q.set('nguoi', gvId === nguoiXem.userId ? 'toi' : String(gvId));
  if (nhom) q.set('nhom', nhom);
  q.set('khung', 'tat-ca');
  if (chiQuaHan) q.set('loc', 'qua-han');
  return `/cong-viec/ho-tro?${q}`;
}
```
- [ ] Phép kiểm `PR-GV (1)`: `demViecTheoNhom([{group:'score',urgency:'overdue'},{group:'result',urgency:'normal'},{group:'yt_xem',urgency:'today'},
  {group:'la',urgency:'overdue'}])` → cham-diem 1/1 · case-hoc-thuat 1/0 · y-thuc 1/0 · van-hanh 1/1 (loại lạ rơi vào Vận hành như
  `nhomViecCua`); luôn đủ 4 dòng đúng thứ tự `NHOM_VIEC`. `duongViecCuaGv(7,{userId:2,laQuanLy:true},'cham-diem',true)` =
  `/cong-viec/ho-tro?nguoi=7&nhom=cham-diem&khung=tat-ca&loc=qua-han` · GV tự xem **không** có `nguoi` · QL tự xem `nguoi=toi`.
  `laCotOGv('kpi-bai') === false` (KPI đã bỏ).
- [ ] `npm run check` → commit `PR-GV (1): luật thuần hồ sơ GV — cột ô, đếm việc theo nhóm, đường Công việc`.

## Task 2 · Máy chủ: quyền xem + việc của một người (Q4, Q9)

**Files:** tạo `server/src/giaoVien/hoSo.ts`; sửa `server/src/worklist/mywork.ts` (**thêm cuối file**), `server/src/routes/index.ts`
(:390-446 → một dòng); `prGv.tests.ts`.

- [ ] Quyền (mã mẫu):
```ts
/** Ai xem được hồ sơ GV (Q9). Trả phạm vi chi nhánh của SỐ LIỆU: null = mọi chi nhánh. Ném 404 / 403. */
export function phamViHoSoGv(p: Principal, gvId: number): { branchIds: number[] | null; laChinhMinh: boolean } {
  const conn = db();
  if (!conn.prepare(`SELECT 1 FROM users WHERE id = ? AND status = 'active'`).get(gvId)) throw notFound('Không tìm thấy giáo viên này.');
  if (p.userId === gvId) return { branchIds: null, laChinhMinh: true };
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);                     // GV thuần không có meeting.view → none
  if (scope.none) throw forbidden('Bạn chỉ xem được hồ sơ giáo viên của chính mình.');
  if (scope.all) return { branchIds: null, laChinhMinh: false };
  if (!scope.branchIds.length) throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
  const ph = scope.branchIds.map(() => '?').join(',');
  const homNay = demoToday();
  const thuoc = conn.prepare(
    `SELECT 1 FROM user_roles WHERE user_id = ? AND status = 'active' AND branch_id IN (${ph})
     UNION ALL
     SELECT 1 FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.user_id = ? AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        AND c.branch_id IN (${ph})
     LIMIT 1`).get(gvId, ...scope.branchIds, gvId, homNay, homNay, ...scope.branchIds);
  if (!thuoc) throw forbidden('Giáo viên này không thuộc chi nhánh bạn quản lý.');
  return { branchIds: scope.branchIds, laChinhMinh: false };
}
```
- [ ] `mywork.ts` — **cuối file** thêm `export function viecCuaNguoi(p: Principal, nguoi: number, branchId?: number | null)`: chuyển **nguyên**
  thân khối `if (typeof nguoi === 'number') { … }` của route (từ `const x = loadPrincipal(nguoi)` tới `return {…}`), giữ `can(CASE_APPROVE)`,
  `napTruocPhamVi`, lọc `can(ATTEMPT_VIEW)`, bỏ `mgmt`, `nhac`. Phép kiểm chi nhánh cũ (chỉ `user_roles`) **thay** bằng
  `phamViHoSoGv(p, nguoi)` (import từ `giaoVien/hoSo.ts` — Q9: QL xem được GV có phân công ở chi nhánh mình dù vai ở chi nhánh khác).
  Route: `if (typeof nguoi === 'number') return viecCuaNguoi(p, nguoi, branchId);`. Câu 403 giữ nguyên chữ.
  ⚠ Import vòng `mywork.ts` ↔ `giaoVien/hoSo.ts`: `hoSo.ts` chỉ import `viecCuaNguoi`/`myWork` **bên trong hàm** hoặc đặt `phamViHoSoGv` ở
  tệp riêng `giaoVien/phamVi.ts` (khuyến nghị — hết vòng).
- [ ] `viecCuaGv(p, gvId)` trong `hoSo.ts`: `laChinhMinh ? myWork(p).items : viecCuaNguoi(p, gvId).items` → `demViecTheoNhom`.
  ⚠ Chính mình là QL/QT: `myWork(p)` **không** `tatCa` — đúng "việc của tôi".
- [ ] Phép kiểm `PR-GV (2)` **phủ định**: `phamViHoSoGv` — GVBM (`P.subjectTeacher`) xem GVCN → 403 · GVCN xem chính mình → `laChinhMinh` ·
  `P.cpManager` xem GV chỉ dạy MB → 403 · `P.mbManager` → `branchIds` = [MB] · `P.admin` → null · id 999999 → 404 · tài khoản
  `status='deleted'` (dựng tạm, dọn) → 404 · QL MB xem GV **không** có vai MB nhưng có phân công đang hiệu lực ở lớp MB → OK (dựng tạm, dọn);
  phân công đã `effective_to` hôm qua → 403. **Không đổi hành vi cũ:** `/my-work?nguoi={GVCN}` bởi QL MB trả **đúng** `items` như trước refactor
  (so `key` với lần gọi `myWork(loadPrincipal(gv))` đã lọc); GV gửi `nguoi=` số → 403 như cũ. **Số = số dòng:** tổng `n` 4 nhóm của
  `viecCuaGv(P.mbManager, GVCN)` = `items.length` của `/my-work?nguoi={GVCN}`; mỗi nhóm = số item có `nhomViecCua(group) === nhom`.
- [ ] `npm run check` → commit `PR-GV (2): quyền xem hồ sơ GV + việc của một người (một nguồn với Công việc)`.

## Task 3 · Máy chủ: hồ sơ GV + ô danh sách (Q2, Q6–Q10)

**Files:** `server/src/giaoVien/hoSo.ts`; `server/src/classes/phanTichLop.ts` (trường `ds`); `server/src/duyet/yeuCau.ts` (`export` :310);
`routes/index.ts` (2 route sau `/branch-pulse`); `tocDoDuong.ts`; `prGv.tests.ts`.

- [ ] `phanTichLop.ts`: `cong(k, dat, hvId)` ghi thêm `ds[k] = { dat: number[], chua: number[] }` (FT: `a.student_id` — lấy từ lượt; thường:
  như vậy). Trả thêm `ds` trong `PhanTichLop` (web cũ bỏ qua). **Không** đổi `o` — phép kiểm cũ giữ nguyên.
- [ ] `hoSoGiaoVien(p, gvId)` — `phamViHoSoGv` **trước** mọi câu khác, `homNay = demoToday()` một lần. Trả:
```ts
type HoSoGv = {
  gv: { id: number; ten: string; vai: string[]; chiNhanh: string[]; kyNang: string[]; laChinhMinh: boolean };
  phamVi: { chiNhanh: string[] | null };                         // QL: tên chi nhánh đang khoanh; null = mọi
  viec: { nhom: NhomViec; n: number; quaHan: number }[];         // Task 2
  lop: { id: number; ma: string; khung: 'ft' | 'thuong'; ct: string | null; vai: string[]; hocVien: number; chuaNhap: number; quaHan: number }[];
  ketQua: { classId: number; ma: string; khung: 'ft' | 'thuong'; moc: { key: string; nhan: string } | null;
            o: { dong: string; nhan: string; dat: number; tong: number; cuaMinh: boolean }[] }[];
  caseMo: (CaseChiTiet & { hocVien: string; maLop: string | null })[];
  yeuCau: { cho: number; choQuaHan: number; tuChoi: number };
  homNay: string;
};
```
  - `gv`: `users.full_name`; `vai` = `roleLabel` từ `user_roles` đang hiệu lực; `chiNhanh` tên chi nhánh các vai; `kyNang` = `user_skills` ∩
    `ENTRY_SKILLS` đúng thứ tự → `ENTRY_SKILL_SHORT` (**một** câu gộp ba bảng bằng `UNION ALL` hoặc ba câu cố định).
  - `lop`: **một** câu — phân công `ta.status='active'` + `activeAt(homNay)`, lớp `status='active'`, trong `branchIds`, `COUNT(DISTINCT e.student_id)`
    với `e.status='active'`; `vai` gom theo lớp: `is_core` → `'GVCN'`, `skill` → `tenMonNgan(ct, skill)`. `khung` qua `bangLop()` (`laFt`).
    `chuaNhap`/`quaHan` = `scoreDebtCells(p, homNay, branchIds)` lọc `userId === gvId` rồi đếm theo `classId`.
  - `ketQua`: mỗi lớp của `lop` gọi `phanTichLop(p, classId)` (`ponytail:` N lớp × ≤ 3 câu; nâng: gộp lô khi trần vượt). `moc` = cột
    cuối (theo thứ tự `cot`) có ô `tong > 0`; `o` = mỗi `dong` ở `moc`; `cuaMinh` = GVCN **hoặc** `dong.key`/`category` trùng kỹ năng phân công
    (FT: `listening…speaking`; thường: môn; dòng `ca-bai` chỉ GVCN). Lớp chưa có điểm → `moc: null`.
  - `caseMo`: `listCases(p, { ownerUserId: gvId }).rows` lọc `state !== 'done'` và (`branchIds === null` hoặc chi nhánh Case ∈ `branchIds`) →
    `chiTietCaseMo` → sắp quá hạn trước, rồi `viecTiep.han` tăng.
  - `yeuCau`: `yeuCauCuaToi(loadPrincipal(gvId)).the` — QL xem: chỉ thẻ qua `trongPhamVi(p, …)` (đọc dòng gốc theo id các thẻ, **một** câu);
    `cho` = `trangThai==='cho'`, `choQuaHan` = cho có `hanDuyet < homNay`, `tuChoi` = `trangThai==='tu_choi'`.
- [ ] `oHoSoGv(p, gvId, { cot, lop?, dong?, moc?, cn?, ct? })` → `{ n, tieuDe, rows }` (`MetricRow`), gọi **đúng** hàm tập của số:
  - `chua-nhap`/`qua-han` → mỗi **ô nợ** một dòng (cùng lọc với `lop[].chuaNhap`, thêm `lop` nếu có):
```ts
const o = scoreDebtCells(p, homNay, branchIds).filter((d) => d.userId === gvId && (!lop || d.classId === lop) && (cot === 'chua-nhap' || d.overdue));
const goc = new Map(rowsFor('bai-thi', [...new Set(o.map((d) => d.attemptId))]).map((r) => [r.id, r]));
const rows = o.map((d, i) => ({ ...goc.get(d.attemptId)!, id: d.attemptId * 10 + i,        // id duy nhất cho mỗi ô
  title: `${goc.get(d.attemptId)!.title} · ${tenMonNgan(ctCuaLop(d.classId), d.skill)}` }));
```
  - `case-mo` / `case-qua-han` → `rowsFor('case', ids)` từ **cùng** tập `caseMo` (qua hạn: `quaHan`).
  - `yc-cho` / `yc-tu-choi` → mỗi thẻ `{ id, title: tieuDe, sub: '{nhanLoai} · {hocVien} · {lop}', href: duongThe(id, laChinhMinh ? 'nguoi-xin' : 'duyet') }`.
  - `ket-qua` (bắt buộc `lop`, `dong`, `moc`; `lop` phải thuộc `lop[]` của hồ sơ → không thì 403) → `ds[dong|moc]`: `rowsFor('hoc-vien', [...dat, ...chua])`,
    `sub` nối `· Đạt` / `· Chưa đạt` (FT: `· Đạt kỳ vọng` / `· Dưới kỳ vọng`). `n = dat.length + chua.length` = `tong`.
  - `lop` / `hoc-vien` (dùng ở bảng chi nhánh, Task 4) → danh sách lớp `{ id, title: ma, sub: vai, href: /hoc-vien/lop/{id} }` · `rowsFor('hoc-vien', ids)`.
  - `cn` (Task 4): số nguyên dương, phải thuộc phạm vi → thu `branchIds` về `[cn]`; `ct` lọc lớp theo khung. `n === rows.length` luôn.
- [ ] Route: `GET /giao-vien/:id` · `GET /giao-vien/:id/o` — `:id`/`lop`/`cn` qua `pInt`/`qInt` (sai → 400), `cot` qua `laCotOGv` (sai → 400),
  `maybeSimulateReadError()` như khối bên cạnh.
- [ ] `tocDoDuong.ts` khối `// PR-GV`: `{ trang: 'Hồ sơ GV', vai: MOI_VAI, url: '/giao-vien/{gv}', maChuDich: { GVBM: 403 } }` (`{gv}` = GVCN MB FT 101
  = GVCN MB FOU 12 theo demo — kiểm `USER.GVCN === USER.GVCN_THUONG` ở tocDo.run.ts:112-114; khác người thì thêm `GVCN_THUONG: 403`),
  `/giao-vien/{gv}/o?cot=chua-nhap`, `/giao-vien/{gv}/o?cot=case-mo`; đo rồi chốt trần `max(sau+10, ⌈sau×1,3⌉)` ở `TRAN` kèm dòng ngày đo.
- [ ] Phép kiểm `PR-GV (3)`: **quyền** ô = quyền số tổng (GVBM gọi `/giao-vien/{GVCN}/o?cot=case-mo` → 403; `P.cpManager` → 403). **Phạm vi QL** —
  `P.mbManager` xem GV có lớp ở MB **và** CP (dựng tạm): mọi `lop`, `caseMo`, ô nợ thuộc MB; `P.admin` thấy cả hai. **Số = số dòng** — với
  `P.mbManager` và `P.admin` xem GVCN: `Σ lop.chuaNhap === o(chua-nhap).rows.length`, tương tự `quaHan`, `caseMo.length`, số quá hạn,
  `yeuCau.cho`/`tuChoi`, và **mọi** ô `ketQua` có `tong > 0` → `o(ket-qua).rows.length === tong`, đếm "Đạt" = `dat`. `ket-qua` với `lop` không
  thuộc hồ sơ → 403; `dong` lạ → 400; `cot=kpi-bai` → 400. **Kết quả** khớp tab lớp: `ketQua` của MB FT 101 ở `moc` = ô cùng khoá trong
  `phanTichLop(P.admin, lopFt).o`. GVBM chỉ dạy R: ô R `cuaMinh`, ô L không. `kyNang` chỉ mã trong `ENTRY_SKILLS`.
- [ ] `npm run check` → commit `PR-GV (3): hồ sơ giáo viên — lớp, ô điểm nợ, kết quả gần nhất, Case, yêu cầu, ô danh sách`.

## Task 4 · Máy chủ: bảng GV của một chi nhánh (Q11, K1-28)

**Files:** `server/src/giaoVien/hoSo.ts`; `routes/index.ts` (1 route); `tocDoDuong.ts`; `prGv.tests.ts`.

- [ ] `bangGvChiNhanh(p, { cn, ct })`:
  - `scopeFor(p, MEETING_VIEW)`: `none` → 403 "Chỉ Quản lý và Quản trị hệ thống xem được bảng này."; `cn` vắng → nếu phạm vi đúng một chi
    nhánh thì dùng nó, không thì 400 "Chọn một chi nhánh."; `cn` ngoài phạm vi → 403. `homNay` một lần.
  - Lớp trong khung: `bangLop()` lọc `branchId === cn` + `ct` (`thuong` → không FT, `ft` → FT, `ca-hai` → mọi lớp).
  - **Một** câu phân công đang hiệu lực (`ta.status='active'`, `activeAt`, `u.status='active'`) ở các lớp đó → `lop`, `hocVien` (một câu
    `COUNT(DISTINCT)` theo người **hoặc** gom trong bộ nhớ từ một câu enrollments theo lô lớp).
  - `scoreDebtCells(p, homNay, [cn])` **một** lần → `chuaNhap`/`quaHan` theo `userId`, chỉ lớp trong khung.
  - `listCases(p, { branchId: cn })` **một** lần → `state !== 'done'`, khung đúng (`classKind`), gom `ownerUserId` → `caseMo`; `chiTietCaseMo`
    **một** lần cho cả tập → `caseQuaHan`.
  - Hàng = người có phân công ∪ người phụ trách Case mở (tên từ **một** câu `users` theo lô). Bỏ hàng toàn 0. Sắp theo tên (`vi`).
  - Trả `{ cn, tenChiNhanh, ct, hang: [{ id, ten, lop, hocVien, chuaNhap, quaHan, caseMo, caseQuaHan }] }` — **không** hàng tổng.
- [ ] Ô: dùng lại `/giao-vien/:id/o?cot=…&cn={cn}&ct={ct}` (Task 3) — **cùng** hàm tập. Phép kiểm khớp: mỗi ô khác 0 của `P.mbManager`
  (ct thường, ft, ca-hai) → `rows.length === số ô`.
- [ ] Route `GET /giao-vien?cn=&ct=` (đặt **trước** `/giao-vien/:id`).
- [ ] `tocDoDuong.ts`: `{ trang: 'Tổng quan QL', vai: ['QL','QT','GVCN'], url: '/giao-vien?cn={cn}&ct=ft', maChuDich: { GVCN: 403 } }`,
  `?cn={cn}&ct=thuong`; chốt trần như Task 3.
- [ ] Phép kiểm `PR-GV (4)`: **phủ định** — `P.normalCoreTeacher`/`P.subjectTeacher` → 403; `P.cpManager` với `cn` MB → 403; `cn` vắng với
  `P.admin` → 400. **Không xếp hạng** — hàng theo tên (so với `localeCompare`), không trường tổng/trung bình. **Không N+1** (mẫu `demCauHoi`
  anToan.tests.ts:42): đo số `prepare` của `bangGvChiNhanh(P.admin, { cn: MB, ct: 'ca-hai' })`, thêm 3 GV + 2 lớp + phân công + 3 Case mở
  có người phụ trách → đo lại → **bằng nhau** (🛑 G5 nếu tăng); dọn. **Khớp hồ sơ:** với mỗi hàng, `chuaNhap`/`caseMo` = số tương ứng của
  `hoSoGiaoVien(P.mbManager, id)` chỉ tính lớp MB trong khung (`ca-hai`: bằng tổng hồ sơ).
- [ ] `npm run check` → commit `PR-GV (4): bảng giáo viên của chi nhánh — không xếp hạng, không N+1`.

## Task 5 · Web: trang Hồ sơ giáo viên (impeccable `layout`, `clarify`)

**Files:** tạo `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx`; sửa `App.tsx` (route sau :135).

- [ ] Route `<Route path="/giao-vien/:id" element={<HoSoGiaoVienPage />} />`. `useApi('/giao-vien/{id}')`; 403/404 → `ErrorState` câu máy chủ
  (không trang trắng). Bố cục theo **"Bố cục trang Hồ sơ GV"** và mockup 21 màn A (GV tự xem), B (QL xem), E (375 px).
- [ ] Khối **Việc đang có**: 4 ô `Link` (`duongViecCuaGv`) — cả ô là link tới nhóm, dòng "k quá hạn" là link riêng `chiQuaHan`; số 0 → ô mờ,
  không link. ⓘ khối: "Việc lấy từ Công việc. Bấm để mở đúng danh sách. Ý thức & Phối hợp: chỉ việc có hạn."
- [ ] Khối **Lớp đang dạy**: bảng `table-layout: fixed` + `colgroup`, số qua `SoLieuO nguon=/giao-vien/{id}/o?cot=chua-nhap&lop={lop}` (tiêu đề
  `Ô điểm chưa nhập · {mã lớp}`); `Khung` = chip `FT`/`Lớp thường` token màu có sẵn; `Vai` = chip nhỏ `GVCN` + mã kỹ năng. 375 px: mỗi lớp
  một thẻ 2 dòng (`MB FT 101 · GVCN · L` / `12 HV · 3 ô chưa nhập · 1 quá hạn`). Không lớp → `Empty` "Chưa có phân công lớp nào đang hiệu lực."
- [ ] Khối **Kết quả gần nhất**: hai bảng (FT: cột L R W1 W2 S; Lớp thường: Cả bài + môn theo `tenMonNgan`) — hàng = lớp, cột đầu `Lớp` +
  dòng phụ mốc (`MT2` / `Cuối khoá`); ô `dat/tong` là `SoLieuO` (giá trị hiển thị `tong` là số bấm — **chữ** hiện `5/8`: bọc nút mở
  `DanhSachNguon` giống `SoLieuO.tsx:37`, **không** chép panel; nếu cần thì thêm prop `nhan?: string` vào `SoLieuO` — một dòng). Ô không
  phải môn của mình: chữ mờ. Dưới một nửa đạt: nền `--bad-bg`. `moc: null` → "Chưa có điểm".
- [ ] Khối **Case đang phụ trách**: đầu khối hai `SoLieuO` (`case-mo`, `case-qua-han`); bảng chép khuôn `BangCanHoTro.tsx:200-230` (tên HV link
  hồ sơ, `NhanTrangThai`, việc tiếp + `<Han>`). 375 px: thẻ.
- [ ] Khối **Yêu cầu đã gửi**: một hàng `SoLieuO` `yc-cho` · chữ "k quá hạn duyệt" · `SoLieuO` `yc-tu-choi` + link "Yêu cầu của tôi ›"
  (`/cong-viec/yeu-cau`) khi chính mình, "Chờ duyệt ›" (`/cong-viec/cho-duyet`) khi QL.
- [ ] Đầu trang: nút "Mở Công việc ›" / "Việc của {tên} ›" = `duongViecCuaGv(id, …, null)`; hiện khi chính mình **hoặc** `session.nav.workOps`.
- [ ] impeccable **`layout`** + **`clarify`** (nhãn khối, ⓘ, dòng trống, câu 403/404; 375 px không cuộn ngang). `npm run check` → commit
  `PR-GV (5): trang Hồ sơ giáo viên`.

## Task 6 · Web: bảng GV chi nhánh + bật link tên GV + lối vào + ghi chú bảng quyền

**Files:** tạo `web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx`; sửa `BranchPulse.tsx` (:18-21, :79, xoá :129-211),
`shared/domain/hocVienLop.ts:505`, `hocVienLop.tests.ts:211-212`, `Header.tsx` (:252-254), `AdminPage.tsx` (:109-117).

- [ ] `BangGiaoVienChiNhanh({ branchId, ct })`: `useApi('/giao-vien?cn=…&ct=…')`. Bảng `table-layout: fixed` + `colgroup`, cột 1 dính
  (`sticky-col`), tên qua `TenGiaoVien` (link hồ sơ), mọi số `SoLieuO nguon=/giao-vien/{id}/o?cot=…&cn=…&ct=…`, **không** `Th sort`, không màu
  theo số. Chân bảng một câu ≤ 2 dòng: "Để biết cần nói chuyện với ai — không xếp hạng. Bấm tên để xem hồ sơ và việc của từng người."
  Trống → `Empty` "Chưa có giáo viên nào có lớp trong chi nhánh này." 375 px: `table-scroll`.
- [ ] `BranchPulse.tsx`: dòng :79 `<BangGiaoVienChiNhanh branchId={data.branchId ?? branchId} ct={ct} />`; **xoá** `BangTheoGiaoVien`,
  `PersonRow`, `Pulse`, `PEOPLE_COLS`, `pSort` (:129-211); sửa chú thích :18-21 (bỏ "giữ tạm tới PR-GV", ghi "Bảng theo giáo viên:
  `BangGiaoVienChiNhanh`, không xếp hạng"). `/branch-pulse` máy chủ **giữ** (phép kiểm cũ dùng `people`) — "Chuyển cho PR-Dọn".
- [ ] Bật cờ `CO_TRANG_HO_SO_GIAO_VIEN = true`; sửa phép kiểm :211 (`true`) và :212 truyền **`false` tường minh**
  (`duongHoSoGiaoVien(7, {…}, false)`) — không xoá dòng nào. Kiểm bằng mắt: tên GV ở `DauTrangLop` và `StudentsPage` thành link cho QL;
  GV thấy link chỉ tên mình.
- [ ] `Header.tsx`: dưới "Hồ sơ cá nhân" thêm `<Link to={`/giao-vien/${session.user.id}`}>Hồ sơ giáo viên</Link>` khi `session.roles` có `'teacher'`
  (cùng lớp nút `btn btn-sm w-full`, `onClick` đóng menu).
- [ ] `AdminPage.tsx`: trong `SectionNote` bảng quyền thêm đoạn **"Quyền dẫn xuất (không có ô bật/tắt):"** · *Xem hồ sơ giáo viên* — chính mình;
  Quản lý: giáo viên thuộc chi nhánh mình (vai hoặc lớp đang dạy); Quản trị hệ thống: tất cả · *Xuất Excel kết quả Test* — Quản lý, Quản trị hệ
  thống (phạm vi mình), GVCN (lớp mình chủ nhiệm) (K1-53, PR-XUAT #132).
- [ ] impeccable **`layout`** + **`clarify`** bảng GV. `npm run check` → commit `PR-GV (6): bảng GV chi nhánh + tên GV thành link + lối vào`.

## Task 7 · Rebase, bấm thử, audit/polish, tài liệu, mở PR

- [ ] `git fetch origin && git rebase origin/main` → gỡ theo bảng chồng file → 🛑 G2/G3/G4 → `npm run check`.
- [ ] Bấm thử (Playwright, 4177/5377), **sáng và tối**, desktop 1440 + **375 px**, ảnh `thiet-ke/anh/pr-gv/` (trước = main, sau):
  GVCN id 7: menu tài khoản › Hồ sơ giáo viên → 5 khối → bấm "Chấm điểm" → Công việc đúng nhóm, **số dòng = số ô** → quay lại, bấm ô
  kết quả MB FT 101 → danh sách HV Đạt/Dưới kỳ vọng → gõ tay `/giao-vien/9` → câu 403 · GVBM id 9: tên đồng nghiệp ở hồ sơ lớp là chữ
  thường; hồ sơ mình chỉ ô môn mình đậm · QL MB: Tổng quan › Theo lớp (MB) › Theo giáo viên (không nút sắp xếp, số bấm được) → bấm tên →
  hồ sơ (dòng "Quản lý đang xem · chỉ tính lớp ở Monbay") → "Việc của Hà ›" · hồ sơ lớp MB FOU 12 → bấm tên GVCN · QL CP gõ `/giao-vien/7` →
  403 · Quản trị mọi chi nhánh.
- [ ] impeccable **`audit`** rồi **`polish`** (sáng + tối): tương phản ≥ 4.5:1, chữ ≥ 12 px, không màu viết cứng, focus bàn phím, 375 px.
- [ ] Tài liệu: `CODE_MAP.md` (`giaoVien/hoSo.ts`, `phamVi.ts`, `shared/domain/hoSoGiaoVien.ts`, 2 tệp web, 3 route, `viecCuaNguoi`),
  `DEMO.md` (một dòng: "Hồ sơ giáo viên: menu tài khoản › Hồ sơ giáo viên (Trần Ngọc Hà id 7) · QL MB: Tổng quan › Theo lớp › Theo giáo viên").
- [ ] `/ponytail-review`; liệt kê mọi chú thích `ponytail:` trong mô tả PR. Quét `tests/run.js` treo, tắt 4177/5377.
- [ ] Mở PR `PR-GV: Hồ sơ giáo viên + bảng giáo viên chi nhánh` — thân PR: bảng mã yêu cầu (Q30-5, Q30-6, K1-28, K1-53, §3.3, §3.7, §3.12)
  → ảnh → đạt/không; "tầng 1 của màn": hồ sơ GV = khối Việc đang có · bảng GV = cột Quá hạn nhập / Case quá hạn; "KPI bỏ theo Q30-5";
  lệch kế hoạch; "Chuyển cho PR khác"; câu C1/C2; mốc B → sau. Kết thúc thân PR bằng dòng attribution của phiên.

## Chuyển cho PR khác

| Việc | PR |
|---|---|
| KPI tháng GV (T50, §6.5, M-06, Q-E) — **tạm hoãn theo Q30-5**; khi làm lại dùng `datTheoTyLe`/`tyLeTongLo` của LT2b | chưa xếp (chủ sản phẩm mở lại) |
| `branchpulse.ts` `peopleOf` + trường `people` của `/branch-pulse` không còn nơi gọi ở web. Xoá cùng phép kiểm cũ (`luatMayChu.tests.ts:281`, `prMt.tests.ts:249`, `run.ts` các chỗ đọc `people`) | PR-Dọn |
| Cột "Việc quá hạn" ở bảng GV chi nhánh (nếu C2 = B) — cần hàm việc gộp nhiều người | PR sau |
| `ketQua` gọi `phanTichLop` mỗi lớp — gộp lô nếu trần `tocDoDuong` vượt | PR-Dọn |
| Hồ sơ GV theo kỹ năng (vấn đề hay gặp → PA → kết quả, mockup 06d) + "Hỗ trợ đã thực hiện" | PR-Pb2 hoặc sau |
| "Chấm đúng hạn" lịch sử — cột "lần nhập đầu" (nếu C1 = B) | PR-UXF |
| Chip "Bàn giao n/m em" ở dòng lớp nếu PR-CT merge **sau** PR-GV | PR-CT (gọi hàm của mình, thêm một chip ở `HoSoGiaoVienPage`) |

## KIỂM (người rà cuối đợt 5 — Opus 5.5)

- [ ] Quyền **phủ định** đủ ca (GV→đồng nghiệp, QL CP→GV MB, id lạ, tài khoản xoá, phân công hết hạn, GV→bảng chi nhánh, QL→`cn` ngoài)
  và ô danh sách cùng quyền số tổng; QL xem chỉ số của chi nhánh mình.
- [ ] `/my-work?nguoi=` không đổi hành vi (trừ Q9: QL xem được GV có lớp ở chi nhánh mình); Công việc mở từ hồ sơ: số dòng = số ô.
- [ ] Số ở ô = số dòng khi bấm ở mọi ô (hồ sơ, bảng GV). Không N+1 bảng GV (phép kiểm (4), trần `tocDoDuong.ts`).
- [ ] **Không KPI** trong diff (không `kpi`, "Tỷ lệ pass tháng", "Điểm KPI", `metrics.ts`/`phanTich.ts` không đổi). Không xếp hạng/màu tốt-xấu cho người.
- [ ] Kết quả: FT/thường tách bảng; lớp thường không chữ SOS; ô khớp tab Phân tích lớp; tuần hiện `W2 OCT`, ngày chỉ ở hạn.
- [ ] Không migrate, không quyền mới; `permissions.ts`, `regular.ts`, `tongQuan.ts` **không** đổi trong diff; `phanTichLop.ts` chỉ thêm `ds`.
- [ ] Giao diện: sáng + tối; 375 px không cuộn ngang trang; chữ ≥ 12 px; token màu; ảnh `thiet-ke/anh/pr-gv/`; khớp mockup 21.
- [ ] Chỉ sửa (không xoá) phép kiểm cũ: `hocVienLop.tests.ts:211-212`.
- [ ] `Co-Authored-By` đúng model thật; chú thích `ponytail:` liệt kê trong thân PR.

## Nhật ký

| Ngày | Task | Ghi chú (lệch kế hoạch · dòng mã thật · 🛑 · quyết định) |
|---|---|---|
| 30/09 | planning | Viết lại theo Q30-5/Q30-6: bỏ KPI tháng (Task 1–3 cũ, góc Phân tích › Giáo viên, sổ chỉ số); hồ sơ 5 khối từ dữ liệu có sẵn; bảng GV chi nhánh thay bảng cũ. Dòng mã đối chiếu `origin/main` 36be838e (S4F #135 đã merge) |
| 30/09 | 0 | Session code (Sonnet 5.5 — không phải Fable 5.1/Opus 5.5 như bảng điều hành; commit ghi đúng model thật). Dòng mã đối chiếu khớp kế hoạch (lệch 0). LT2a/LT2b/PR-CT **chưa merge** khi bắt đầu. Mốc B = **1821 + 25** phép kiểm (main c1e24a31) |
| 30/09 | 1 | `hoSoGiaoVien.ts` + `prGv.tests.ts` (3 phép kiểm); check 1824 + 25 |

## Chủ sản phẩm / planning chốt 30/09 (thắng các chỗ lệch trong kế hoạch)

- **Q30-5 (chủ sản phẩm):** không KPI, không xếp hạng; số liệu theo giáo viên cụ thể, trực quan — bám mockup `thiet-ke/mockup/21-ho-so-giao-vien.html` (màn A–E).
- **C1 = A (planning chốt):** không làm "chấm đúng hạn" lịch sử; chỉ nợ hiện tại.
- **C2 = A (planning chốt):** bảng giáo viên chi nhánh không có cột "Việc quá hạn" tổng; xem trong hồ sơ từng người.
- Việc Bàn giao (PR-CT) tự vào khối "Việc đang có" qua nhóm Vận hành; cổng 🛑 G4 giữ nguyên.
- **Kết quả gần nhất (chủ sản phẩm 30/09, thắng Q7 và Task tương ứng):** BỎ cột "Cả bài". Ô môn GV **dạy** có **viền xanh** (token accent, nền accent nhạt), không nhãn chữ; môn khác hiện **bình thường** (không mờ). GVCN **không** làm cả hàng đậm — chỉ môn mình dạy có viền. Lớp thường: tên môn theo chương trình trong từng ô (FOU L · R · G+V · P; BE/ELE L · R · W · S) qua `tenMonNgan`. Một chú thích nhỏ "môn bạn dạy" ở đầu khối. Mockup 21 đã sửa theo.
- Dữ liệu demo / mockup: GVCN luôn dạy ≥ 1 môn của lớp (luật L3) — lớp FOU có môn.
- **Chuyển cho PR-Pb2 (đợt 6):** bảng **Phân tích giáo viên** (Tổng quan › Phân tích) — chủ sản phẩm muốn một bảng phân tích GV "hẳn hoi" như màn D nhưng thông tin khác; planning soạn đề xuất + mockup khi soạn đợt 6.
