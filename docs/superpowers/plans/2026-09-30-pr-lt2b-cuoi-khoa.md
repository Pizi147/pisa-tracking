# PR-LT2b · Lớp thường · Cuối khoá (% tổng, hướng gợi ý, Quyết định Cuối khoá, PA bổ trợ miễn phí + Mini Test, BE/ELE lên FT) — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Cuối khoá lớp thường theo quy định P. Học thuật (đặc tả §6.3, §6.4, §6.6 PF3). Máy tính **% Cuối khoá** = tổng câu đúng /
tổng số câu (T47), xếp **dải** `< 50 · 50–59 · 60–69 · ≥ 70` và **gợi ý hướng** cho từng em. Em 50–59% có thẻ Chờ duyệt **"Quyết định
Cuối khoá"** cho QL (hạn M-19). Khi em được chuyển lên (60–69%, hoặc 50–59% QL cho lên), máy tạo ở **lộ trình lớp kế tiếp** một Case
`Cuối khoá {CT} · {môn} không đạt` (Pre FOU: `· Tổng hợp`) đang chạy + PA **"Bổ trợ miễn phí"** + một ô **Mini Test** (`% · ngày`, hạn
ngày buổi cuối + 2). Mini Test ≥ 70% → Case xong; < 70% → thẻ **Báo lên** QL. < 50% → việc phối hợp "Báo PH qua TVV" cho QL. BE/ELE
lên FT: QL đánh dấu **Đạt / Không đạt kỳ vọng đầu ra** + nguyên nhân; Trung tâm → Case FT "Kỳ vọng đầu ra chưa đạt · {kỹ năng}" + PA
"Tutor 10 buổi/kỹ năng". Lớp thường nói bằng **% + hướng** (T58 — phần bỏ chữ "SOS" do LT2a làm; LT2b thêm hướng Cuối khoá).
**Phạm vi đổi 30/09 (planning):** màn **Chuyển tiếp lớp** (panel, "+ Mở lớp mới", xác nhận/đổi hướng trên màn, ai được chuyển) sang
**PR-CT** mới. LT2b chỉ làm **hàm luật + dữ liệu + móc máy chủ sau khi chuyển**, và **xuất hàm/API** cho panel mới (mục "Chuyển cho PR khác").
**Architecture:** Luật thuần ở `shared/domain/cuoiKhoa.ts` (dải, gợi ý, số buổi, hạn, chiều có lợi, map kỹ năng sang FT). Máy chủ
`server/src/normal/cuoiKhoa.ts` là **một cửa**: đọc % Cuối khoá theo lô (`tyLeTongLo`, `cuoiKhoaTheoHocVien`), ghi sau chuyển
(`sauChuyenCuoiKhoa`), Mini Test (`ghiMiniTest`), Kết luận lên FT (`ghiKetLuanFt`). Thẻ duyệt cắm vào giao kèo `server/src/duyet/loaiYeuCau.ts`
bằng **ba phần tử**. Case Cuối khoá có `origin_kind = 'chuyen_cap'` và **không** phải "Case SOS" (không chờ nguyên nhân). Migrate
`server/src/migrate/prLt2b.ts` chỉ đổi cấu trúc (DB reset trước bản chính). Web: lưới lớp thường, hồ sơ HV (bảng Kết quả kiểm tra + hộp
**Kết luận khoá** + ô Mini Test), Hành trình, Excel, panel Lộ trình tiếp theo (chỉ dữ kiện + gửi QL), thẻ hộp Chờ duyệt.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); phép kiểm `server/src/tests/*`
(harness `check()` của `run.ts`), chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md`
- §3.2: **T47, T48, T49, T54** (phần Cuối khoá), **T58**, **T70** (trừ đuôi "tín hiệu đang chờ lúc deploy" — bảng Q), **T71** (luật; màn → PR-CT),
  T61 (Mini Test = kết quả cuối PA), T66 (loại hạn `mini-test`), T75/T76 (phần Mini Test, Quyết định Cuối khoá). **T50 (KPI) → PR-GV.**
- §5.5: dòng "Quyết định Cuối khoá 50–59%", "Quyết định Cuối khoá (đổi hướng theo chiều có lợi)", "Báo lên … Mini Test trượt".
- §5.8: **M-01, M-05** (Mini Test), **M-19, M-20** (đã có trên main — chỉ phép kiểm), **M-21**. §6.1, **§6.3, §6.4, §6.6 PF3**. §7.3, §7.5.
  §8 dòng PR-LT2b + luật chung. §10.1, §10.3.
- Rà `thiet-ke/ra-27-09/` (phần LT2b của 48 mã PR-LT2): **K2-25** (P0 — luật + dữ liệu; màn → PR-CT), K1-15 (Mini Test), K1-41 (Mini Test trượt),
  K1-55, K2-01 (% đã có — thêm hướng), K2-04 (việc Mini Test vào `viecTiepCuaEm`), K2-12, K2-23 (M1b), K2-26 (luật + dữ kiện; bảng cả lớp → PR-CT),
  K2-27, K2-28, K2-29, K2-30 (Mini Test ở menu dòng), K2-34 (→ PR-CT), K2-35, K3-04, K3-27, K3-31, K3-43, K4-21, K4-23, K4-36, K5-11 (Mini Test,
  kỳ vọng đầu ra), K5-26, K5-44 (đã có), K5-55 (c) PA bổ trợ miễn phí đếm riêng, K5-56 (hàm cho PR-GV), K5-61 (Case khi lên lớp), K5-62,
  K5-66 (**bỏ** — reset). K2 **§4(a)** (luồng 7 bước), K3 **§4(b)** (hộp Kết luận khoá), K5 §3 dòng 9–12, K5 §4 dòng 17–19, K5 §6 **D10–D13**.
  Mã thuộc PR-LT2a: K1-02, K1-03, K1-12, K1-19 (→ PR-Pb2), K3-12, K3-26, K3-28, K3-39, K5-01, K5-08, K5-10, K5-18, K5-50, K5-51, K5-64, K5-65.
- Nguồn quy định: `thiet-ke/nguon-27-09/NGUON_QUY_DINH_LOP_THUONG.md` mục **III** (3.1 PreFound, 3.2 Found), **IV**, **V**, VII (KPI).
- Giao kèo PR #117 (loại thẻ), bảng "Chuyển cho PR khác" của #118, #128, #132, #133 (dòng LT2b).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-LT2b** · đợt 5 · làn **C** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-lt2b-cuoi-khoa` · `.claude/worktrees/pr-lt2b-cuoi-khoa` (từ `origin/main` @ be092a42 trở đi) |
| Cổng thử | API **4187** · Vite **5387** (song song: LT2a 4167/5367 · PR-GV 4177/5377; không dùng 4000/5173) |
| Model | **Opus 5.5 · XHigh** · phương án B: **Fable 5.1 · High** (dùng B thì đọc kỹ "Hướng dẫn riêng cho model thực thi") |
| Người rà | **Opus 5.5**, rà **một lượt cuối đợt 5** (không rà từng PR) — session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Có, chỉ cấu trúc, chạy lặp được** — `server/src/migrate/prLt2b.ts`, **một dòng gọi CUỐI** `migrate.ts`: bảng `mini_test`; cột `lo_trinh_tiep_theo.quyet_boi/quyet_luc/ky_vong_dat/ky_vong_nguyen_nhan/ky_vong_mon/ky_vong_ghi_chu`. **Không** sửa/chuyển dữ liệu cũ, **không** lệnh chạy thử |
| Skill | **`/ponytail lite` đầu phiên** (PR có giao diện; Task 1–7 vẫn viết theo thang ponytail). impeccable: **`clarify`** ở Task 8, Task 9 · **`layout`** ở Task 9 (hộp Kết luận khoá, bảng Kết quả kiểm tra) · **`audit`** + **`polish`** (sáng **và** tối) ở Task 11. Không `init`/`document`/`hooks on`. Trước PR: `/ponytail-review` |
| Phụ thuộc | 🛑 **PR-LT2a** (loại PA `bo_tro`, cột `nhom_bo_tro` + "ghi kết quả một lần chép cả nhóm", kind `bao_ph_tvv` + việc `phoi_hop`, bỏ tín hiệu lớp thường) — Task 1–4 làm trước được, **Task 5 trở đi chờ LT2a merge**. 🛑 **PR-S4F** (đang mở: `regular.ts` `refreshRegularOutcome`, `permissions.ts`) — gộp main khi nó merge. PR-NHAP (#120) đã merge |
| Không làm | Màn Chuyển tiếp lớp, "+ Mở lớp mới", bảng "Ghi hướng cho cả lớp", câu T49 trên dòng Sang FT / panel Chuyển lớp một em, đổi quyền chuyển lớp (→ **PR-CT**) · KPI tháng T50 (→ **PR-GV**, LT2b chỉ xuất hàm) · Tổng hợp Test khung lớp thường K1-19 (→ **PR-Pb2**) · bỏ tín hiệu / `verify` / `DongTinHieu` / Giữa khoá (→ **LT2a**) · mọi việc chuyển dữ liệu cũ (bảng Q, R1–R5) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task, **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không nền, không
  chồng) → xanh, số phép kiểm ≥ mốc B → commit `PR-LT2b (n): …`. Sập segfault → chạy lại **một** lần (không phải phép kiểm hỏng). Treo
  > 10 phút → quét `node … tests/run.js` còn sống (`Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`), tắt hết, chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px + **sáng và tối** **một lần** ở Task 11 (Playwright kênh Chrome; đăng nhập demo
  `POST /api/demo/session {userId}`: Quản trị **id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN lớp thường = `coreTeacherOf('MB BE 08')` /
  `coreTeacherOf('MB FOU 12')` (tra trong `tests/tocDo.run.ts:114`) · GVBM lớp mới = GV phân công đúng môn). Ảnh ở `thiet-ke/anh/pr-lt2b/`.
  Chạy song song: `PORT=4187` cho API, Vite tạm cổng 5387 trỏ proxy về 4187 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy, không `migrate` trên bản chính; dữ liệu thử chỉ ở **DB demo trong worktree**. Mã lệch hẳn kế hoạch → dừng,
  ghi Nhật ký, báo planning. Trước khi báo xong: tắt 4187/5387, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.
- **Cổng rebase/gộp** (🛑 trước Task 5 khi LT2a merge; khi PR-S4F, PR-GV, PR-CT merge; và ở Task 11): `git fetch origin && git merge origin/main`
  (hoặc rebase nếu nhánh chưa đẩy) → gỡ theo bảng file chồng (chỉ thêm khối → **giữ cả hai**; `migratePrLt2b` luôn **cuối**; khoá
  `LOAI_YEU_CAU` theo thứ tự merge) → `npm run check` → Nhật ký.

### File chồng với PR-LT2a (A), PR-GV (B), PR-S4F (đang mở), PR-CT (sắp có) và cách gỡ

| File | PR khác sửa | PR-LT2b sửa | Gỡ |
|---|---|---|---|
| `server/src/normal/regular.ts` | **LT2a**: `refreshRegularOutcome` `if (a.kind !== 'progress') return r;` + Giữa khoá → Case; `reportRegularNoShow` lần dời 2 báo GVCN; M1b tách `taoBaiThuong` :249-361 · **S4F**: `refreshRegularOutcome` | **không** sửa `refreshRegularOutcome`; `reportRegularNoShow` thêm **một khối** Cuối khoá dời quá tuần cuối khoá (K4-23 vế 2) sau khối LT2a | khác khối → giữ cả hai. LT2b chỉ có **phép kiểm** "Cuối khoá không tín hiệu/Case" |
| `shared/domain/lopThuong.ts` (LT2a tạo: `nhanKetQuaThuong`, `tenCaseThuong`) | **LT2a** | **không sửa** — import `nhanKetQuaThuong`, thêm hướng Cuối khoá ở nơi hiện (Task 8). Luật Cuối khoá ở file riêng `cuoiKhoa.ts` (Task 1–4 chạy trước khi LT2a merge) | không chồng |
| `shared/domain/yeuCauDuyet.ts` :17, meta :37-49 | **LT2a**: `'ke_hoach_bo_tro'` | `'quyet_dinh_cuoi_khoa'`, `'bao_len_mini_test'`, `'bao_len_cuoi_khoa'` cuối mảng + 3 dòng meta; `KieuNut` thêm `'quyet'` | mảng một dòng → giữ mọi khoá, thứ tự theo merge |
| `server/src/duyet/loaiYeuCau.ts` | **LT2a**: phần tử `ke_hoach_bo_tro` | **3 phần tử cuối mảng**; `moTa` trả thêm `nutQuyet` | giữ cả hai |
| `shared/domain/cases.ts` `INTERVENTION_KINDS` :572, `CASE_ORIGINS` :472 | **LT2a**: `bo_tro` | `bo_tro_mien_phi` (nhãn "Bổ trợ miễn phí") · origin `chuyen_cap` | giữ cả hai |
| `shared/domain/sosV4.ts` `mocChuPa` :30-36 | **LT2a**: mốc "đến Cuối khoá" (nếu có) | nhánh `'mini_test'` → `đến Mini Test · dd/mm` | giữ cả hai |
| `server/src/cases/sosState.ts` :33, :84, :124 · `phanTich/tongHop.ts:215` · `worklist/mywork.ts:731` | LT2a có thể thêm điều kiện Giữa khoá | `LA_CASE_SOS` loại `origin_kind='chuyen_cap'`; ba chỗ `EXISTS … preset = 1` đọc `LA_CASE_SOS` | giữ luật LT2a + điều kiện LT2b |
| `server/src/cases/cases.ts` `updateResult` :2795-3010, `sosEditCtx` :291 | **LT2a**: ghi một lần chép cả `nhom_bo_tro` | nhánh Mini Test (kind `bo_tro_mien_phi`, lần cuối) + `tong_hop` → nhánh GVCN | khác khối → giữ cả hai |
| `web/src/modules/cases/CapNhatTuan.tsx` | **LT2a**: nhóm bổ trợ | ô **Mini Test %** + **Ngày làm** ở form "Ghi kết quả cuối" | giữ cả hai |
| `server/src/worklist/mywork.ts` `WorkGroupKey` :115, `GROUP_META`, thứ tự :1017 | **LT2a**: bỏ `verify`, thêm `ke_hoach_bo_tro`, `phoi_hop` | thêm `mini_test`; chữ `next_step` :583-624 có % gợi ý | union → giữ mọi khoá |
| `shared/domain/hocVienLop.ts` `viecTiepCuaEm` :321, menu :249-271 | **LT2a**: việc kế hoạch bổ trợ, báo PH | việc Mini Test; mục menu `'mini-test'` | giữ cả hai |
| `server/src/classes/luatLoTrinh.ts`, `transition.ts`, `loTrinhTiep.ts` | **PR-CT** (sẽ viết lại luồng chuyển) | **một** lời gọi `sauChuyenCuoiKhoa` ở `apDungCaLop` (sau bước 6) và `apDungMotDong` (sau `closeCasesOnProgrammeSwitch`); `kiemDongCuoiKhoa` trong `applyTransition`; dữ liệu `cuoiKhoa` trong `transitionPlan` | PR-CT merge trước → đặt lại hai lời gọi vào đường áp dụng mới, giữ phép kiểm LT2b |
| `web/src/modules/students/StudentDetailPage.tsx` | **LT2a**: bỏ khối "Xác minh vấn đề SOS" :743 | bảng Kết quả kiểm tra :600-615 (cột %), hộp Kết luận khoá, ô Mini Test | khác khối → giữ cả hai |
| `server/src/permissions.ts` | **S4F** | **không sửa** | — |
| `phanTich/*` (KPI) | **PR-GV** | **không sửa** | PR-GV import hàm của LT2b |
| `migrate.ts`, `schema.sql`, `tests/run.ts`, `tests/tocDoDuong.ts`, `seed/seed.ts`, `shared/domain/index.ts`, `nhatKy.ts`, `DEMO.md`, `CODE_MAP.md`, `TU_DIEN_VA_CHU.md` | cả ba | **một** import + **một** dòng gọi cuối migrate (sau `migratePrLt2a`); bảng mới **cuối** `schema.sql`; khối phép kiểm cuối `run.ts`; chỉ thêm dòng | giữ cả hai, thứ tự theo merge |

## Global Constraints

- **Một định nghĩa % và dải:** mọi con số % Cuối khoá, dải, hướng gợi ý (lưới, hồ sơ HV, Hành trình, Excel, thẻ, việc, sau chuyển) đọc
  `goiYCuoiKhoa()` (thuần) qua `cuoiKhoaTheoHocVien()` (máy chủ). % = `RegularResult.tyLeTong` (`regular.ts:157, 210` — Σ điểm / Σ tổng,
  **chỉ khi đủ môn**, không làm tròn). Làm tròn **chỉ để hiện** (`Math.round(x*100)`). Dải xét trên số **chưa làm tròn** (59,6% → 50–59).
- **Không lưu hướng gợi ý** (K2 §4a bước 1): chỉ lưu **quyết định** (QL) và **dự định** (GVCN) ở `lo_trinh_tiep_theo`. Sửa điểm → gợi ý đổi theo.
- **Case Cuối khoá không phải Case SOS:** `origin_kind = 'chuyen_cap'`, `sos_level NULL`, `han_xac_nhan NULL`, status `in_progress`; không vào
  việc `cause`, không vào "Case chờ xác nhận nguyên nhân", không Báo lên nguyên nhân (T70, M-01). Phép kiểm khoá điều này.
- **Chữ:** `% Cuối khoá` · `Học lại {CT}` · `Lên {CT kế} + bổ trợ miễn phí` · `Pass` · `QL quyết` · `Quyết định Cuối khoá` · `Bổ trợ miễn phí`
  · `Mini Test` · `Ghi Mini Test` · `Đạt kỳ vọng đầu ra` · `Kỳ vọng đầu ra chưa đạt · {kỹ năng}` · `Tutor 10 buổi`. **Không** chữ "SOS" cho lớp
  thường (T58). Tên môn qua `tenMon`/`tenMonNgan` (MH2). Ngày `dd/mm`, tuần `tuanLich`, không ISO, không mã (`50_59`, `chuyen_cap`) trên màn.
- **Tinh tế:** % là **tầng 1** (đậm, `tabular-nums`, màu đạt/chưa đạt), hướng gợi ý là chữ phụ 12 px một dòng. Hộp Kết luận khoá: một dòng số,
  một nhãn trạng thái (§7.3), tối đa một nút chính. Không card lồng card. Cột thẳng.
- **Thành phần có sẵn:** `KhungPanel`, `NhanTrangThai`, `ONgay`, `OKhac`, `useLoiForm`, `<Han loai=…>` (thêm loại `mini-test`), `TheYeuCau`,
  `KetQuaDot`, `ToastHoanTac`. Không tự dựng thứ tương tự.
- **SQL:** chỉ `?` (db.ts cấm tham số đặt tên). Mọi câu ghi trong `tx()` (BEGIN IMMEDIATE; lồng = savepoint). `IN (…)` qua `theoLo` (lô ≤ 400,
  ≤ 900 tham số). UNION ≤ 20 vế. Ghi nhiều dòng: một `INSERT … VALUES (…),(…)` / `UPDATE … WHERE id IN (…)`. Ngày nghiệp vụ `demoToday()` /
  `useNgayNghiepVu().homNay`.
- **Quyền (phép kiểm PHỦ ĐỊNH cho mọi đường mới/đổi):**
  - Quyết định Cuối khoá (thẻ): `request.approve` — GVCN/GVBM **không** (T69). QL tự gửi → tự duyệt (Q-D).
  - Dự định + đề xuất gửi QL (Lộ trình tiếp theo): như hiện nay (`STUDENT_EDIT` ở lớp đang học — `loTrinhTiep.ts:57`).
  - Kết luận lên FT (T49): **chỉ** `request.approve` (QL/QT) trong phạm vi chi nhánh của em — GVCN/GVBM 403.
  - Ghi Mini Test: `SOS_EDIT` trên Case (GVBM đúng môn ở lớp mới; Case `tong_hop` → GVCN lớp mới) hoặc QL.
  - **Không** đổi quyền ai được chuyển lớp (PR-CT). `permissions.ts` không sửa.
- **Phép kiểm:** luật mới ở `server/src/tests/prLt2b.tests.ts` (`runPrLt2bTests(t)`, đăng ký **cuối** `run.ts`, sau khối LT2a). Phép kiểm cũ bị
  đổi kỳ vọng (vd Chuyển tiếp em chưa đủ điểm) thì **sửa kỳ vọng**, không xoá; **tổng số phép kiểm không giảm**.
- **Tốc độ:** đường mới vào `server/src/tests/tocDoDuong.ts`, trần = `max(sau+10, ⌈sau×1.3⌉)` đo ngay sau khi thêm. Đường cũ tăng câu → ghi
  Nhật ký; **không nâng trần cũ quá 30%**.

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc nếu chạy phương án B — Fable)

1. **Năm chỗ dễ sai nhất:**
   - (a) **Bẫy `fromSos`:** "Case SOS" hiện = có PA `preset = 1` (`sosState.ts:33, :84, :124`, `tongHop.ts:215`, `mywork.ts:731`). PA bổ trợ miễn phí
     là `preset = 1` (bắt buộc, không Thay/Kết thúc sớm, "Ghi kết quả cuối" ở mốc) → nếu không loại, Case Cuối khoá thành "Chờ xác nhận nguyên
     nhân". Sửa **một** định nghĩa `LA_CASE_SOS` (thêm `AND COALESCE(sc.origin_kind,'') != 'chuyen_cap'`) và cho **cả ba** chỗ `EXISTS … preset = 1
     … AS from_sos` gọi nó. Không sửa `UNCONFIRMED_PRESET` (PA bổ trợ miễn phí luôn có `confirmed_at`).
   - (b) **Thứ tự sau chuyển:** lớp thường → lớp thường: **chuyển Case đang mở** sang lộ trình mới (`chuyenCaseSangLoTrinh`, K5-61) **trước**
     khi tạo Case Cuối khoá (khoá chống trùng `a:{hv}:{lộ trình mới}:{hạng mục}` tự gắn PA vào Case Giữa khoá cùng môn — M-01). Sang FT:
     `closeCasesOnProgrammeSwitch('ft')` chạy **trước** (đóng Case lớp thường), rồi mới tạo Case FT.
   - (c) **Dải trên số chưa làm tròn:** `0.595` là 50–59, `0.6` là 60–69, `0.699…` là 60–69, `0.7` là Pass. Thiếu môn → `tyLeTong = null` → **không**
     gợi ý, **không** thẻ.
   - (d) **Pre FOU → FOU:** hạng mục `tong_hop` ở lớp FOU không có ô phân công → `sosEditCtx` phải đưa `tong_hop` về nhánh GVCN
     (`skill: undefined`), người thực hiện PA = GVCN lớp mới. Không có thì **không ai** ghi được Mini Test.
   - (e) **Mini Test một lần cho một em** (Q3): các PA bổ trợ miễn phí của một em trong một lần chuyển cùng `nhom_bo_tro = 'mt:{attemptCuoiKhoa}'`;
     ghi Mini Test ở **một** PA chép kết quả sang cả nhóm (cơ chế của LT2a), `mini_test` có **một** dòng.
2. Hạn "n ngày" dùng `hanTheoNgay(batDau, n)` (`shared/domain/cases.ts:707`, tính cả ngày đầu — M-16). Mini Test **+2** theo M-05 là **cộng lịch**
   (`addDays(ngayMiniTest, 2)`), không phải `hanTheoNgay(…, 2)`.
3. Thẻ Báo lên đóng bằng `chotYeuCau(... 'tu_dong')` / `chet` của **chính phần tử**. Không có gì để tạo/đóng thì **không** mở `tx`.
4. 🛑 Dừng hỏi planning nếu: (a) LT2a merge mà **không** có `nhom_bo_tro` hoặc `bao_ph_tvv`; (b) phải sửa lõi `yeuCau.ts` ngoài một nhánh
   `kieuNut 'quyet'`; (c) trần `/my-work`, `/yeu-cau?hop=cho-duyet`, `/classes/:id/transition` phải tăng > 30%; (d) phải sửa `permissions.ts`;
   (e) PR-CT đã merge và đổi chữ ký `apDungCaLop`/`apDungMotDong`.
5. Không chạy bất kỳ lệnh nào có biến Turso.

## Task 0 · Nhánh, mốc, chép kế hoạch

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-lt2b-cuoi-khoa -b pr-lt2b-cuoi-khoa origin/main`. Gõ `/ponytail lite`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch đợt 5> -- docs/superpowers/plans/2026-09-30-pr-lt2b-cuoi-khoa.md`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** vào Nhật ký. Ghi LT2a / S4F / PR-GV / PR-CT đã merge chưa (`git log origin/main --oneline -12`).
- [ ] Đối chiếu dòng mã kế hoạch dẫn. Grep các mốc: `tyLeTong: complete`, `export function refreshRegularOutcome`, `export function reportRegularNoShow`,
  `export const LA_CASE_SOS`, `AS from_sos`, `function sosEditCtx`, `export function updateResult`, `export function apDungCaLop`,
  `// 6) Case: chỉ em sang FT`, `export function transitionPlan`, `export function ghiLoTrinhTiep`, `export function ketQuaThuong`,
  `return { chu: \`${ngan} · SOS`, `' đạt · SOS '`, `chính là mức SOS`, `migratePrHsm(conn`, `'bao_len_y_thuc'] as const`. Lệch > 20 dòng → ghi
  bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] M1b (tự tạo bài Giữa/Cuối khoá khi em vào lớp thường) là việc **LT2a Task 8** — LT2b không làm; phép kiểm Task 5 dựng bài Cuối khoá bằng
  `planRegularTests`/hàm của LT2a.
- [ ] Commit `PR-LT2b (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần `shared/domain/cuoiKhoa.ts` (T47, T48, T54, M-05, M-19, M-21, §6.3, PF3, K2-28, K2-29, K5-26)

**Files:** tạo `shared/domain/cuoiKhoa.ts` + export ở `shared/domain/index.ts` · tạo `server/src/tests/prLt2b.tests.ts` + đăng ký cuối `run.ts`.

**Interfaces (chép đúng tên — PR-CT và PR-GV dùng):**
```ts
export type DaiCuoiKhoa = 'duoi_50' | '50_59' | '60_69' | 'dat';
export function daiCuoiKhoa(tyLe: number): DaiCuoiKhoa;                 // số CHƯA làm tròn; ngưỡng 0.5 / 0.6 / RATIO_PASS_THRESHOLD
export const datTheoTyLe = (tyLe: number | null): boolean | null =>     // "HS pass một bài" (T50) — PR-GV dùng cho KPI
  tyLe === null ? null : tyLe >= RATIO_PASS_THRESHOLD;
export type BoTroMienPhi = { soBuoi: number; soTuan: 1 | 2; theoMon: boolean; mon: string[] /* ô chuẩn của lớp CŨ */ };
export type HuongGoiY = 'hoc_lai' | 'len' | null;                       // 'len' = lên bậc kế hoặc sang FT; null = 50–59 QL quyết
export type GoiYCuoiKhoa = {
  dai: DaiCuoiKhoa; tyLe: number; huong: HuongGoiY; canQl: boolean;
  boTroNeuLen: BoTroMienPhi | null;     // 50–59 (nếu QL cho lên) và 60–69
  baoPhTvv: boolean;                    // < 50 (và 50–59 nếu QL quyết học lại — Q6)
  nhan: string;                         // "Học lại FOU" · "QL quyết: học lại FOU hoặc lên BE + bổ trợ" · "Lên BE + bổ trợ miễn phí 2 buổi · 1 tuần · Mini Test sau buổi cuối" · "Pass"
  nhanNgan: string;                     // "→ học lại" · "→ QL quyết" · "→ lên + bổ trợ" · "→ Pass"
};
export function goiYCuoiKhoa(x: { ct: ProgrammeCode; maKe: string | null; tyLe: number | null; monTruot: readonly string[] }): GoiYCuoiKhoa | null;
export function laChieuCoLoi(g: GoiYCuoiKhoa, chon: 'len_lop' | 'fast_track' | 'hoc_lai'): boolean;   // chỉ: gợi ý hoc_lai mà chọn lên
export function hanQuyetDinhCuoiKhoa(x: { tuanCuoiKhoa: string; khaiGiangLopKe: string | null }): string;
export function lichBoTro(x: { batDau: string; soTuan: 1 | 2 }): { ngayMiniTest: string; hanMiniTest: string };
export function kyNangLopDich(mon: string, denFt: boolean): string;   // FT: writing → writing2 (M-21); còn lại giữ (tong_hop giữ)
export function kiemDongCuoiKhoa(d: { huong: string; coLuotCuoiKhoa: boolean; du: boolean; scored: number; required: number;
  goiY: GoiYCuoiKhoa | null; quyetDinh: 'hoc_lai' | 'len' | null; nguoiGoiLaQl: boolean }): string | null;
```
**Luật (chú thích đầu hàm):**
- `goiYCuoiKhoa`: `tyLe === null` → `null`. `duoi_50` → `hoc_lai`, `baoPhTvv`. `50_59` → `huong null`, `canQl`, `boTroNeuLen` với `soTuan 2`.
  `60_69` → `len`, `soTuan 1`. `dat` → `len`, không bổ trợ. **Pre FOU** (`CHUONG_TRINH_KHONG_CHIA_MON`): `soBuoi` 4 (50–59) / 2 (60–69), `theoMon
  false`, `mon ['tong_hop']` (PF3). **FOU/BE/ELE:** `soBuoi = monTruot.length` (1 buổi/môn trượt), `theoMon true`, `mon = monTruot` (§6.3, V).
  Nhãn tên chương trình qua `kyHieuLop`/`PROGRAMME_TEMPLATES`, không mã thô.
- `hanQuyetDinhCuoiKhoa` (M-19, K5-26): `min(khaiGiangLopKe − 1 ngày, mondayOf(tuanCuoiKhoa) + 13)` — "trước ngày khai giảng" · "hết Chủ nhật tuần
  sau tuần Cuối khoá". Chưa có lớp kế → chỉ mốc sau.
- `lichBoTro` (M-05, Q4): `ngayMiniTest = batDau + 7×soTuan − 1` (Chủ nhật tuần cuối của PA), `hanMiniTest = ngayMiniTest + 2`.
- `kiemDongCuoiKhoa` (K2 §4a bước 5 — **luật**, màn ở PR-CT): chỉ xét hướng `len_lop | fast_track | hoc_lai`. Có lượt Cuối khoá mà chưa đủ →
  `Chưa đủ điểm Cuối khoá ({scored}/{required} môn) — nhập xong mới chuyển được`. `50_59` chưa có quyết định và người gọi không phải QL →
  `Chờ Quản lý quyết (Cuối khoá {x}%)`. Không có lượt Cuối khoá nào (dữ liệu thiếu) → `null` (Q7).
- [ ] **Phép kiểm trước** (khối 1, ≥ 16 phép, mỗi mục một phép): biên 0.4999/0.5/0.595/0.6/0.6999/0.7 · thiếu môn → `null` · FOU 60–69 trượt L, G+V →
  `soBuoi 2, soTuan 1, mon [listening, writing]`, nhãn có "G+V" · BE 50–59 → `canQl`, `soTuan 2` · Pre FOU 52% → 4 buổi, 64% → 2 buổi, không theo môn
  · ELE ≥ 70 → `len` (sang FT) · `laChieuCoLoi` (45% chọn lên → true; 64% chọn học lại → false) · hạn M-19 hai nhánh · `lichBoTro` 1 và 2 tuần ·
  `kyNangLopDich('writing', true) === 'writing2'` · `datTheoTyLe(0.7) === true`, `(0.6999) === false`, `(null) === null` · `kiemDongCuoiKhoa` 4 nhánh.
- [ ] `npm run check` → commit `PR-LT2b (1): luật thuần Cuối khoá — dải, gợi ý hướng, số buổi, hạn`.

## Task 2 · Migrate `prLt2b.ts` + `schema.sql` (T78, M-05, T49)

**Files:** tạo `server/src/migrate/prLt2b.ts` · `server/src/migrate.ts` (một import + `migratePrLt2b(conn, applied);` **cuối** danh sách, sau
`migratePrHsm` :477 và sau dòng của LT2a) · `schema.sql` (cột vào khối `lo_trinh_tiep_theo` :402-418 kèm chú thích; bảng mới **cuối file**) · bao đóng
xoá HV (PR-XOA) + danh sách cột trỏ tài khoản · `shared/domain/nhatKy.ts`.

- [ ] `migratePrLt2b` (mỗi bước kiểm `pragma_table_info` / `IF NOT EXISTS`; `applied.push` chỉ khi có đổi; **không** UPDATE dữ liệu nào):
  ```sql
  ALTER TABLE lo_trinh_tiep_theo ADD COLUMN quyet_boi INTEGER REFERENCES users(id);   -- QL đã quyết (thẻ hoặc khi chuyển)
  ALTER TABLE lo_trinh_tiep_theo ADD COLUMN quyet_luc TEXT;
  ALTER TABLE lo_trinh_tiep_theo ADD COLUMN ky_vong_dat INTEGER;          -- T49: 1 đạt · 0 không đạt · NULL chưa đánh dấu
  ALTER TABLE lo_trinh_tiep_theo ADD COLUMN ky_vong_nguyen_nhan TEXT;     -- 'trung_tam' | 'hoc_sinh'
  ALTER TABLE lo_trinh_tiep_theo ADD COLUMN ky_vong_mon TEXT;             -- JSON ô chuẩn lớp cũ QL chọn (mặc định môn < 70%)
  ALTER TABLE lo_trinh_tiep_theo ADD COLUMN ky_vong_ghi_chu TEXT;         -- Học sinh: phương án case-by-case (chữ tự do)
  CREATE TABLE IF NOT EXISTS mini_test (id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id), cycle_id INTEGER NOT NULL REFERENCES learning_cycles(id),  -- lộ trình MỚI
    tu_attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),   -- bài Cuối khoá sinh ra nó
    nhom_bo_tro TEXT NOT NULL, so_buoi INTEGER NOT NULL, ngay_du_kien TEXT NOT NULL, han TEXT NOT NULL,
    ty_le REAL, ngay_lam TEXT, ghi_boi INTEGER REFERENCES users(id), ghi_luc TEXT, UNIQUE (student_id, tu_attempt_id));
  ```
- [ ] Nhãn nhật ký tiếng Việt: `cuoi_khoa.quyet`, `cuoi_khoa.bo_tro_tao`, `cuoi_khoa.mini_test`, `cuoi_khoa.ket_luan_ft` (phép kiểm "mã nhật ký nào
  cũng có nhãn" xanh). Bao đóng xoá HV có `mini_test`; cột trỏ tài khoản có `quyet_boi`, `ghi_boi`.
- [ ] Phép kiểm (khối 2): migrate hai lần → lần hai `applied` rỗng · DB mới (`schema.sql`) và DB migrate cùng cột · `UNIQUE` chặn Mini Test thứ hai.
- [ ] `npm run check` → commit `PR-LT2b (2): migrate cấu trúc — bảng mini_test, cột quyết định và kỳ vọng đầu ra`.

## Task 3 · Một cửa đọc `server/src/normal/cuoiKhoa.ts` + dữ liệu cho API (K2-25 dữ liệu, K2-26 (1), K3-43, K5-44, K5-56)

**Files:** tạo `server/src/normal/cuoiKhoa.ts` · `classes/transition.ts` `transitionPlan` :38-163 (chỉ thêm trường) · `classes/loTrinhTiep.ts`
`layLoTrinhTiep` :42-79 · `normal/regular.ts` `regularSheet` :768 (trả `goiY` cho lượt `final`) · `students/profile.ts` (hồ sơ HV).

```ts
/** % tổng của nhiều lượt lớp thường — ≤ 2 câu cho cả lô (lượt + điểm), gọi `evaluateRegular`. PR-GV dùng cho KPI (bài đủ môn). */
export function tyLeTongLo(attemptIds: readonly number[]): Map<number, { tyLe: number | null; du: boolean; scored: number; required: number;
  ct: string | null; monTruot: string[]; kind: string }>;
export type EmCuoiKhoa = {
  attemptId: number | null; tuanCuoiKhoa: string | null; tyLe: number | null; scored: number; required: number; monTruot: string[];
  goiY: GoiYCuoiKhoa | null;
  quyetDinh: { huong: 'hoc_lai' | 'len'; boi: string; luc: string } | null;  // lo_trinh_tiep_theo.quyet_*
  theQuyetDinh: { id: number; han: string | null; trangThai: TrangThaiYc } | null;
  ketLuanFt: { dat: boolean | null; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; ghiChu: string | null } | null;
};
/** Mọi em ĐANG học lớp thường `classId` (hoặc `sids`) — ≤ 5 câu cho cả lớp: lượt final, điểm, lo_trinh_tiep_theo, thẻ, tiến độ lớp. */
export function cuoiKhoaTheoHocVien(classId: number, sids?: readonly number[]): Map<number, EmCuoiKhoa>;
```
- [ ] `transitionPlan` thêm `students[].cuoiKhoa: EmCuoiKhoa` (một lần cho cả lớp — không trong vòng lặp). **Không** sửa `TransitionPanel.tsx` (PR-CT).
- [ ] `layLoTrinhTiep` thêm `cuoiKhoa` của em (dòng dữ kiện K2-26 (1): `Cuối khoá 58% · không đạt L, G+V · Giữa khoá 2/4 môn đạt`).
- [ ] `regularSheet` (lưới lớp thường) thêm `goiY` mỗi dòng khi `kind = 'final'`. Hồ sơ HV (`profile.ts`) thêm `cuoiKhoa` + `miniTest` của lộ trình
  đang học (Task 6 điền) + `ketLuanFt`.
- [ ] Phép kiểm (khối 3): lớp 8 em (4 dải + 1 thiếu môn + 1 chưa thi) → đúng dải/gợi ý · `cuoiKhoaTheoHocVien` 30 em ≤ 5 câu SQL (đếm như phép N+1 cũ) ·
  sửa một điểm Cuối khoá → gợi ý đổi theo (không lưu) · `tyLeTongLo` bài thiếu môn → `du false, tyLe null` · Pre FOU một ô.
- [ ] `tocDoDuong.ts`: đo lại `/classes/{lopThuong}/transition` (trần 36–37), `/students/{hv}/lo-trinh-tiep` (21–25) — tăng ghi Nhật ký, ≤ 30%.
- [ ] `npm run check` → commit `PR-LT2b (3): một cửa đọc Cuối khoá — % tổng theo lô, gợi ý từng em trong API`.

## Task 4 · Thẻ "Quyết định Cuối khoá" (T48, T54, T71 luật, §5.5, M-19, K2-26 (3)(4), K2-29, K5-26) — impeccable **`clarify`** (chữ thẻ)

**Files:** `shared/domain/yeuCauDuyet.ts` (khoá `'quyet_dinh_cuoi_khoa'` cuối mảng :17, meta `{ phanLoai: 'hoc-thuat', nhan: 'Quyết định Cuối khoá',
kieuNut: 'quyet', hanNgay: null, hangLoat: false }`; `KieuNut` :25 thêm `'quyet'`) · `server/src/duyet/loaiYeuCau.ts` (phần tử cuối) · `server/src/duyet/yeuCau.ts`
(`duyetYeuCau` :387 nhận `duLieu.huong` cho kiểu `quyet` — **không** sửa luồng khác) · `web/src/modules/duyet/TheYeuCau.tsx` :183-205 (nhánh
`kieuNut === 'quyet'`: hai nút từ `nutQuyet`) · `classes/loTrinhTiep.ts` `ghiLoTrinhTiep` :81-139.

- [ ] **Đối tượng thẻ** = bài Cuối khoá: `doiTuongLoai 'cuoi_khoa'`, `doiTuongId = attemptId` (một thẻ đang chờ mỗi bài — `ux_ycd_dang_cho`).
- [ ] **Máy tạo** (`quet`, Q2): lượt `kind='final'`, `status='done'`, em còn ghi danh `active` ở `a.class_id`, **chưa** có thẻ `cho|duyet` cho bài đó →
  `tyLeTongLo` → dải `50_59` → `taoYeuCau` (người xin `NULL` = hệ thống, `hanDuyet = hanQuyetDinhCuoiKhoa(...)`, khai giảng lớp kế = lớp dự kiến ở
  `lo_trinh_tiep_theo.lop_du_kien_id` nếu có). Một câu ứng viên + một câu điểm; không có ứng viên → không mở `tx`.
- [ ] **GVCN đề xuất** (`ghiLoTrinhTiep`): em có `goiY`: (i) `50_59` → hướng `len_lop|fast_track|hoc_lai` là **đề xuất**, `lyDo` bắt buộc (≥ 3 ký tự) →
  `boSungYeuCau`/`taoYeuCau` (người xin = GVCN, `du_lieu.deXuat`). (ii) `laChieuCoLoi` (gợi ý học lại mà chọn lên) → `lyDo` bắt buộc → cùng loại thẻ.
  (iii) đổi theo chiều bất lợi (vd 64% mà học lại) → `lyDo` bắt buộc, **không** thẻ. Dự định vẫn ghi `lo_trinh_tiep_theo` như cũ.
- [ ] **`khiDuyet`** (`duLieu.huong ∈ {'hoc_lai','len'}`, bắt buộc): upsert `lo_trinh_tiep_theo (student, class_id = a.class_id)`: `huong` = `hoc_lai` |
  (`len` → giữ `len_lop`/`fast_track` GVCN đã ghi, không có thì bậc kế theo `NORMAL_LADDER`, ELE → `fast_track`), `quyet_boi`, `quyet_luc`; nhật ký
  `cuoi_khoa.quyet`; thông báo GVCN (trỏ đúng hồ sơ HV). Không có "Từ chối".
- [ ] **`chet`**: bài bị huỷ · em không còn ghi danh `active` ở lớp đó · điểm sửa làm bài ra khỏi 50–59 **và** thẻ không do GVCN đề xuất chiều có lợi —
  lý do "Điểm Cuối khoá đã đổi" / "Em đã rời lớp". Lọc trong `quet` (JS) khi luật không viết được thành SQL (mẫu `bao_len_y_thuc`).
- [ ] **`moTa`**: tiêu đề `Quyết định Cuối khoá · Cuối khoá 55% · MB BE 08`; dòng `L 60 · R 52 · W 58 · S 50` (tên môn `tenMonNgan`); dòng GVCN đề
  xuất + lý do (nếu có); `nutQuyet: [{ huong: 'hoc_lai', chu: 'Học lại BE' }, { huong: 'len', chu: 'Lên ELE + bổ trợ' }]` (nút GVCN đề xuất đứng đầu);
  `neuDuyet`: "Lên: khi chuyển lớp, máy tạo PA Bổ trợ miễn phí 1 buổi/môn trượt · 2 tuần · Mini Test sau buổi cuối"; `mo` = hồ sơ HV.
- [ ] Phép kiểm (khối 4): 55% đủ điểm → một thẻ, hạn đúng M-19 (hai nhánh) · 55% thiếu môn → không thẻ · QL bấm "Lên" → `lo_trinh_tiep_theo.quyet_*` +
  thẻ `duyet` · sửa điểm thành 72% → thẻ `tu_dong` · GVCN 45% chọn lên không lý do → 400; có lý do → thẻ · GVCN 64% chọn học lại không lý do → 400,
  có lý do → không thẻ · **phủ định**: GVCN/GVBM `POST /yeu-cau/:id/duyet` → 403 · `duLieu.huong` lạ → 400 · QL tự gửi → tự duyệt được (Q-D).
- [ ] `npm run check` → commit `PR-LT2b (4): thẻ Quyết định Cuối khoá — máy tạo khi 50–59%, GVCN đề xuất, QL quyết`.

## 🛑 Cổng LT2a — Task 5 trở đi chỉ bắt đầu khi PR-LT2a đã merge

- [ ] `git fetch origin && git merge origin/main` (hoặc rebase) → gỡ theo bảng file chồng → `npm run check` → Nhật ký: `bo_tro`, `nhom_bo_tro`,
  hàm "ghi kết quả một lần chép cả nhóm", `bao_ph_tvv` (+ cách xác định người làm), `refreshRegularOutcome` với `kind='final'` (sinh gì?), M1b có chưa.
  Thiếu một thứ → 🛑 hỏi planning (Hướng dẫn 4a).

## Task 5 · Sau khi chuyển: Case + PA Bổ trợ miễn phí + Mini Test, Báo PH qua TVV, Case Tutor FT (T70, M-01, M-21, K2-28, K3-27, K5-61, K5-62, K5-55c)

**Files:** `server/src/normal/cuoiKhoa.ts` (`sauChuyenCuoiKhoa`) · `classes/luatLoTrinh.ts` (**một** lời gọi trong `apDungCaLop` sau bước 6 :466-480;
**một** lời gọi trong `apDungMotDong` sau :275-277) · `classes/transition.ts` `applyTransition` :270-294 (gọi `kiemDongCuoiKhoa`) · `cases/sosState.ts`
:33, :84, :124 · `phanTich/tongHop.ts:215` · `worklist/mywork.ts:731` · `cases/cases.ts` `sosEditCtx` :291 · `shared/domain/cases.ts` (kind
`bo_tro_mien_phi`, origin `chuyen_cap` "Từ Chuyển tiếp lớp") · `shared/domain/sosV4.ts` `mocChuPa` · `worklist/mywork.ts` dòng `phoi_hop` của LT2a (lượt `final` → chỉ QL).

```ts
/** Chạy TRONG tx của nơi chuyển, SAU khi mở lộ trình mới (và sau closeCasesOnProgrammeSwitch nếu sang FT). Chỉ em có endKind len_lop|sang_ft|hoc_lai. */
export function sauChuyenCuoiKhoa(p: Principal, dongs: readonly { sid: number; fromClassId: number; fromCycleId: number | null;
  toCycleId: number; toClass: { id: number; ft: boolean; startPeriodId: number | null; ma: string | null }; huong: 'len_lop' | 'fast_track' | 'hoc_lai'; ngay: string }[]): void;
```
- [ ] **Bước theo lô** (đọc `cuoiKhoaTheoHocVien(fromClassId, sids)` **một lần**):
  1. Lớp thường → lớp thường: `chuyenCaseSangLoTrinh(p.userId, sid, fromCycleId, toCycleId, null, ngay)` cho em còn Case mở (K5-61; lọc trước bằng một
     câu như `apDungCaLop` bước 6). Hạng mục giữ nguyên (Pre FOU `tong_hop` giữ).
  2. Hướng **lên** và (`60_69`, hoặc `50_59` có `quyetDinh.huong = 'len'`, hoặc QL chuyển khi thẻ chưa quyết — xem ô dưới): với mỗi `mon` của
     `boTroNeuLen`: `cat = kyNangLopDich(mon, toClass.ft)` → Case theo khoá `caseDedupKey({ category: cat, studentId, cycleId: toCycleId })`: đang mở →
     dùng; chưa có → `INSERT sos_cases` (`origin_kind 'chuyen_cap'`, `title 'Cuối khoá {CT cũ} · {tenMon(ctCu, mon)} không đạt'` — Pre FOU `· Tổng hợp`,
     `cycle_id toCycleId`, `attempt_id` = bài Cuối khoá, `status 'in_progress'`, `sos_level NULL`, `owner = suggestCaseOwner({ classId: toClass.id, category: cat })`).
     PA: `kind 'bo_tro_mien_phi'`, `preset 1`, `confirmed_at/by = now/p.userId`, `status 'started'`, `started_date = batDau`, `moc_quy_che 'mini_test'`,
     `followup_due = ngayMiniTest`, `action_due = weeklyUpdateDue(batDau)`, `nhom_bo_tro 'mt:{attemptId}'`, người thực hiện = như owner, mô tả
     `"{soBuoi} buổi miễn phí · {soTuan} tuần · Mini Test sau buổi cuối · không tính phí học sinh, không tính lương giáo viên"`. `batDau = max(ngay,
     thứ Hai tuần khai giảng lớp đích)` (Q4). **Một** dòng `mini_test` (han = `hanMiniTest`). Milestone `opened` "Cuối khoá {x}% — bổ trợ miễn phí".
  3. `duoi_50` (hoặc `50_59` QL quyết học lại — Q6) và hướng `hoc_lai`: một việc phối hợp `bao_ph_tvv` (bảng `sos_coordination_actions` của LT2a,
     `attempt_id` = bài Cuối khoá, `preset 1`, `pending`), **người làm = QL**: dòng `phoi_hop` của LT2a (GVCN lớp hiện tại + QL `tat-ca`) thêm điều
     kiện lượt `kind='final'` → **chỉ** người có `request.approve` ở chi nhánh (suy từ lượt, không thêm cột); tiêu đề `Báo phụ huynh qua TVV · {HV} · Cuối khoá {x}%`.
  4. Sang FT và `ketLuanFt.dat === false && nguyenNhan === 'trung_tam'`: với mỗi `ky_vong_mon` → Case FT `origin 'chuyen_cap'`, `title 'Kỳ vọng đầu ra
     chưa đạt · {skillLabel(kyNangLopDich(mon, true))}'` + PA `kind 'tutor'`, **`preset 0`** (PA thường, GV kết thúc khi xong 10 buổi — Q8), mô tả
     `Tutor 10 buổi/kỹ năng · tính vào buổi Free, có lương GV`, `confirmed` + `started` ngay.
  5. Hành trình (một INSERT nhiều dòng) + thông báo GVCN lớp mới (`Mang theo PA Bổ trợ miễn phí · Mini Test hạn dd/mm`), nhật ký `cuoi_khoa.bo_tro_tao`.
- [ ] **Móc vào đường chuyển hiện có** (không đổi màn): `applyTransition` — mỗi dòng `len_lop|fast_track|hoc_lai` qua `kiemDongCuoiKhoa` (người gọi
  có `request.approve` = QL; 50–59 chưa quyết mà QL chuyển → coi là **QL quyết khi chuyển**: ghi `quyet_*` + `chotYeuCau(... 'tu_dong', { lyDo: 'QL quyết
  khi chuyển tiếp' })`). Dòng lỗi vào `failed` như cũ (UI cũ đã hiện). `apDungMotDong` (Chuyển lớp một em) gọi `sauChuyenCuoiKhoa` khi `luat.endKind ∈
  {len_lop, sang_ft, hoc_lai}` và em có Cuối khoá đủ điểm ở lớp nguồn.
- [ ] **`LA_CASE_SOS`** = `EXISTS (… preset = 1) AND COALESCE(${sc}.origin_kind,'') != 'chuyen_cap'`; `sosState.ts:84`, `:124`, `tongHop.ts:215`,
  `mywork.ts:731` dùng `LA_CASE_SOS(...)`. **`sosEditCtx`**: `skill: c.topic === 'tong_hop' ? undefined : c.topic ?? undefined` (Hướng dẫn 1d).
- [ ] **`mocChuPa`** nhánh `'mini_test'` → `đến Mini Test · {ngay(followupDue)}`. Nhãn kind `bo_tro_mien_phi` = "Bổ trợ miễn phí"; Hiệu quả PA (K5-55c):
  PA này **đếm riêng** (không vào "PA do GV thêm", không "Nên dùng") — chỉ đổi nhóm ở chỗ tách PA quy chế nếu PR-Pb2 chưa có; ghi Nhật ký.
- [ ] **Cuối khoá không sinh tín hiệu/Case chờ nguyên nhân** (T70): phép kiểm nhập Cuối khoá trượt → 0 `case_signals` mới, 0 `sos_cases` mới (xem file chồng dòng 1).
- [ ] Phép kiểm (khối 5): FOU 64% trượt L, G+V → lên BE: 2 Case `chuyen_cap` ở lộ trình BE, 2 PA cùng `nhom_bo_tro`, 1 `mini_test` hạn đúng; Case
  trạng thái "Đang làm", **không** ở việc `cause`/chỉ số chờ nguyên nhân/Báo lên nguyên nhân · Case Giữa khoá L đang mở ở FOU → chuyển sang BE, PA gắn
  **vào nó** (không Case thứ hai) · BE 55% chưa quyết, GVCN chuyển → dòng lỗi "Chờ Quản lý quyết"; QL chuyển → quyết + thẻ tự đóng · 45% học lại → một
  `bao_ph_tvv` người làm QL · chưa đủ điểm → "Chưa đủ điểm Cuối khoá (3/4 môn)" · Pre FOU 52% QL cho lên → Case `tong_hop` ở FOU, 4 buổi, 2 tuần;
  GVCN FOU ghi được, GVBM L lớp FOU **403** · BE 72% sang FT + kết luận Trung tâm {writing} → Case FT `writing2` + PA tutor `preset 0`; Học sinh → không
  Case · ≥ 70% → không Case nào · M-20/K2-17/K2-16 (đã có): FT lấy lộ trình lớp đích, LT ↔ RF mở lộ trình mới (phép kiểm có sẵn — ghi tên vào Nhật ký).
  Phép kiểm cũ Chuyển tiếp em chưa đủ điểm → **sửa kỳ vọng** (dựng điểm Cuối khoá trước), không xoá.
- [ ] `npm run check` → commit `PR-LT2b (5): sau chuyển — Case Cuối khoá ở lộ trình mới, PA Bổ trợ miễn phí, Báo PH qua TVV, Case Tutor FT`.

## Task 6 · Mini Test (§6.3, T47, T61, M-05, K1-15, K1-41, K2-04, K2-28, K2-30, K3-27, K5-11) — impeccable **`clarify`** (form)

**Files:** `server/src/normal/cuoiKhoa.ts` (`ghiMiniTest`) · `cases/cases.ts` `updateResult` :2795 (lần cuối của PA `bo_tro_mien_phi` bắt buộc
`miniTest: { tyLe, ngay }`) · `web/src/modules/cases/CapNhatTuan.tsx` :99-110 · `yeuCauDuyet.ts` + `loaiYeuCau.ts` (`'bao_len_mini_test'`, kiểu `nhac`) ·
`worklist/mywork.ts` (nhóm `mini_test`) · `shared/domain/tongQuan.ts` (`NHOM_CUA_LOAI`, `LOAI_HAN_CUA_VIEC`) · `shared/domain/display.ts` `DEADLINE_KINDS`
(`mini-test`) · `shared/domain/hocVienLop.ts` (`viecTiepCuaEm`, menu `'mini-test'` "Ghi Mini Test") · `platform/thongBao.ts`, `duongHoSo.ts`.

- [ ] **Một hàm ghi** `ghiMiniTest(p, miniTestId, { tyLe, ngay })` (gọi từ `updateResult` lần cuối và từ đường hồ sơ HV — **cùng** hàm): `0 ≤ tyLe ≤ 100`
  (lưu 0–1), `ngay ≤ hôm nay`, không trước `ngay_du_kien − 14`; ghi `mini_test`; PA của cả `nhom_bo_tro` khép (`completed`, outcome từ form, `closed_reason
  'het_moc'`); `≥ 70%` → mọi Case `chuyen_cap` của nhóm **tự Hoàn thành** (`closeCaseOutcome` outcome `improved`, ghi chú `Mini Test {x}% ≥ 70%`) — Q5; `< 70%`
  → Case **để mở** + thẻ `bao_len_mini_test` (đối tượng `mini_test`, `chet`: mọi Case của nhóm đã `done`) + thông báo QL (T76). Sửa Mini Test đã ghi: chỉ
  QL, có lý do (nhật ký `cuoi_khoa.mini_test`).
- [ ] Form "Ghi kết quả cuối" (PA `bo_tro_mien_phi`): thêm hai ô **bắt buộc** `Mini Test (%)` (số 0–100) + `Ngày làm` (`ONgay`), dòng nhắc `Đạt từ 70%`;
  lỗi tại ô (`useLoiForm`). Ghi kết quả tuần (chưa tới mốc) **không** có ô này.
- [ ] Việc `mini_test` (K5 §3 #10): `Ghi Mini Test · {tên HV} · hạn dd/mm` — người làm = người thực hiện PA (có tài khoản), không có → GVCN lớp đang học;
  hạn `mini_test.han`; hết khi `ty_le` có. Em Tạm dừng → ẩn (T65). Bấm → Ngăn Case, PA, form Ghi kết quả cuối. `viecTiepCuaEm` + menu dòng K2-30.
- [ ] Phép kiểm (khối 6): 72% → PA khép, Case Xong, không thẻ · 65% → Case mở, một thẻ Báo lên, thông báo QL; Case Hoàn thành tay → thẻ `tu_dong` · ghi
  ở một PA → mọi PA nhóm khép (một dòng `mini_test`) · việc hiện trước hạn, biến mất sau khi ghi · **phủ định**: GVBM khác môn / GV lớp khác ghi → 403;
  `tyLe` 120 → 400; ngày tương lai → 400; GVCN sửa Mini Test đã ghi → 403.
- [ ] `tocDoDuong.ts`: đo lại `/my-work` (GV, GVCN_THUONG, QL) và `/yeu-cau?hop=cho-duyet` — ≤ 30%.
- [ ] `npm run check` → commit `PR-LT2b (6): Mini Test — kết quả cuối PA bổ trợ miễn phí, Báo lên khi trượt, việc Ghi Mini Test`.

## Task 7 · Kết luận lên FT (T49, §6.4, K2-27 luật, K3-43, K5-62) + dấu "-" Cuối khoá (K4-23) + Kết thúc lớp còn treo (K2-35) + việc `next_step`

**Files:** `normal/cuoiKhoa.ts` (`ghiKetLuanFt`) · `routes/index.ts` (**một** đường mới `PUT /students/:id/ket-luan-ft`, cạnh `/lo-trinh-tiep` :1835-1845)
· `normal/regular.ts` `reportRegularNoShow` :560-600 · `yeuCauDuyet.ts` + `loaiYeuCau.ts` (`'bao_len_cuoi_khoa'`, kiểu `nhac`) ·
`web/src/modules/classes/XoaKetThucLopPanel.tsx` · `worklist/mywork.ts` 2d :583-624.

- [ ] `ghiKetLuanFt(p, sid, { dat, nguyenNhan?, mon?, ghiChu? })`: **chỉ** `request.approve` ở chi nhánh của em; chỉ em lớp **BE/ELE** có Cuối khoá (hoặc
  vừa chuyển từ BE/ELE sang FT — `lo_trinh_tiep_theo.huong='fast_track'` đã áp dụng); `dat=false` bắt `nguyenNhan`; `hoc_sinh` bắt `ghiChu` (≥ 15 ký tự,
  "phương án case-by-case"); `mon` mặc định = môn < 70% của Cuối khoá, QL chọn lại được, ít nhất một môn khi `trung_tam`. Ghi `lo_trinh_tiep_theo.ky_vong_*`.
  Em **đã** ở lộ trình FT (đánh dấu sau khi chuyển) và `trung_tam` → tạo Case Tutor **ngay** (bước 4 của Task 5, cùng hàm); đổi từ `trung_tam` sang khác
  sau khi đã tạo → **không** xoá Case (GV tự xử lý) — ghi rõ ở phản hồi. Chữ nhắc kỳ vọng: BE `IELTS 4.0`, ELE `IELTS 4.5–5.0` (§6.4 — không lưu Placement).
- [ ] K4-23 vế 2 (vế 1 "lần dời 2 báo GVCN" là **LT2a Task 7**): trong `reportRegularNoShow`, nhánh `bat`, sau `setSkillWeek` và sau khối LT2a:
  `a.kind='final'` và tuần mới **sau** tuần Cuối khoá của lớp (`classProgress(a.class_id).finalWeekStart`) → thẻ `bao_len_cuoi_khoa` (đối tượng
  `doiTuongLoai 'attempt'`, `doiTuongId = a.id` — một thẻ mỗi bài; `chet`: bài `done` hoặc huỷ) + thông báo QL. Không đổi luật dời.
- [ ] K2-35: panel Kết thúc lớp liệt kê **không chặn** `Còn treo: n quyết định Cuối khoá chờ QL · m Mini Test chưa ghi` (một câu đếm).
- [ ] Việc `next_step` (K5 §3 #12): chữ `reason` thêm `· 1 em cần QL quyết (Cuối khoá 50–59%)` khi có; không đổi người nhận/hạn (màn Chuyển tiếp → PR-CT).
- [ ] `tocDoDuong.ts`: `PUT` không đo; không có GET mới.
- [ ] Phép kiểm (khối 7): QL đánh dấu Không đạt · Trung tâm {R, W} rồi chuyển sang FT → 2 Case FT (R, W2) + 2 PA tutor · đánh dấu sau khi đã sang FT → tạo
  ngay · Học sinh không ghi chú → 400 · em FOU → 400 "Chỉ lớp BE/ELE" · **phủ định**: GVCN/GVBM → 403, QL chi nhánh khác → 403 · Cuối khoá dời quá
  tuần cuối khoá → một thẻ Báo lên; Giữa khoá dời quá → **không** thẻ; nhập đủ điểm → `tu_dong` · Kết thúc lớp: câu "Còn treo" đúng số.
- [ ] `npm run check` → commit `PR-LT2b (7): Kết luận lên FT, Cuối khoá dời quá hạn, còn treo khi kết thúc lớp`.

## Task 8 · Web: % Cuối khoá + hướng gợi ý ở lưới, Hành trình, Excel (T58 phần Cuối khoá, K2-01, K3-31, K4-21, #118/#132/#133) — **`clarify`**

**T58 "bỏ chữ SOS lớp thường ở mọi nơi" là LT2a Task 9** (`nhanKetQuaThuong` trong `shared/domain/lopThuong.ts`). LT2b chỉ **thêm hướng Cuối khoá sau chữ
của LT2a**, ở đúng các chỗ LT2a đã chuyển sang `nhanKetQuaThuong`.

**Files:** `web/src/modules/cham/LuoiThuong.tsx` `KetQua` :492-560 (dòng phụ Cuối khoá đủ điểm → `→ lên + bổ trợ`; dòng phụ dời "-" vẫn thắng) ·
`shared/domain/hanhTrinh.ts` `nhanGhim` nhánh lớp thường (Cuối khoá đủ: `Cuối · 64% · lên + bổ trợ`, `day` đủ chữ `nhan`; màu theo dải: `dat` / một tông
"chưa đạt") · `shared/domain/xuatMt.ts` `bangThuong` :168-190 (cột **Hướng gợi ý** sau cột `%`, chỉ dòng Cuối khoá) · `server/src/phanTich/xuatMt.ts`
(nạp `goiY` theo lô qua `tyLeTongLo`).

- [ ] Nguồn chữ duy nhất: `goiYCuoiKhoa(...).nhanNgan` / `.nhan`. Pre FOU giữ `Cuối · 68%` (PR-MON) + hướng.
- [ ] Excel lớp thường: cột "Hướng gợi ý" (`Học lại FOU` · `QL quyết` · `Lên BE + bổ trợ` · `Pass`), ô trống khi chưa đủ điểm hoặc Giữa khoá.
- [ ] Phép kiểm (khối 8): lưới Cuối khoá đủ/thiếu · `nhanGhim` Cuối khoá có hướng, không chữ "SOS" (chạy lại phép quét của LT2a) · `bangThuong` có cột
  mới, số cột khớp tiêu đề, `Giữa khoá` để trống.
- [ ] `npm run check` → commit `PR-LT2b (8): % Cuối khoá và hướng gợi ý ở lưới, Hành trình, Excel`.

## Task 9 · Web: hồ sơ HV (Kết quả kiểm tra, hộp Kết luận khoá, ô Mini Test), Lộ trình tiếp theo, hồ sơ lớp — **`layout`** + **`clarify`**

**Files:** `web/src/modules/students/StudentDetailPage.tsx` (`RatioAttempts` :600-615: cột **% tổng** tầng 1, bỏ gợi ý "chính là mức SOS" :609; hộp
**Kết luận khoá** ngay dưới bảng kỹ năng, tab Học thuật) · `web/src/modules/students/LoTrinhTiepPanel.tsx` :15-24, :104-121 · đầu hồ sơ lớp (nơi dựng badge
lớp — grep `demChuaLoTrinh(`) · tạo `web/src/modules/students/KetLuanKhoa.tsx` (một component, không card lồng card).

- [ ] **Hộp Kết luận khoá** (K3 §4b, K3-43) — hiện khi lộ trình đang học là lớp thường và có lượt Cuối khoá có điểm:
  - dòng 1 (tầng 1): `Cuối khoá 64%` + `L 70 · R 58 · G+V 66 · P 62` (chữ phụ, `tabular-nums`); thiếu môn: `Cuối khoá · 3/4 môn có điểm`.
  - dòng 2: một `NhanTrangThai` theo gợi ý/quyết định: `Lên BE + bổ trợ miễn phí (2 buổi · 1 tuần) · Mini Test sau buổi cuối` · 50–59 chờ:
    `Chờ duyệt · QL quyết trước dd/mm` (bấm → thẻ) · đã quyết: `QL đã quyết: Lên ELE + bổ trợ · dd/mm` · < 50: `Học lại FOU · QL báo phụ huynh qua TVV` · `Pass`.
  - BE/ELE (T49): dòng `Kỳ vọng đầu ra (BE IELTS 4.0)` — QL: hai nút `Đạt` / `Không đạt` → mở `KhungPanel` nhỏ (nguyên nhân `Trung tâm` / `Học sinh`, môn,
    ghi chú); người khác chỉ đọc (`Chưa đánh dấu` / `Không đạt · Trung tâm · R, W`).
  - nút phụ `Lộ trình tiếp theo` (mở panel sẵn có). Không có nút "Chuyển tiếp" (PR-CT).
- [ ] **Ô Mini Test** (lộ trình mới, có `mini_test`): `Mini Test · — · hạn 12/10 [Ghi Mini Test]` (nút chỉ khi có quyền → mở Ngăn Case, form Ghi kết quả cuối)
  / `Mini Test 72% · 10/10 · Đạt` / `Mini Test 65% · 10/10 · Chưa đạt — đã báo QL`. Đặt ở đầu tab Học thuật, ngay trên bảng kỹ năng. `<Han loai="mini-test">`.
- [ ] **Lộ trình tiếp theo** (K2-26 (1)–(3)): dòng dữ kiện đầu panel; hướng gợi ý đứng đầu, nhãn `Web gợi ý theo Cuối khoá`; 50–59 / chiều có lợi / chiều bất
  lợi → ô **Lý do** bắt buộc (`OKhac` không cần) + chữ nút chính `Gửi QL quyết` khi sẽ thành thẻ. **Không** thêm bảng "cho cả lớp" (PR-CT).
- [ ] **Hồ sơ lớp** (#133 chuyển): dòng `Cuối khoá 7/8 em có điểm · 1 em chờ QL quyết` (đếm thẻ `quyet_dinh_cuoi_khoa` đang chờ theo lớp — một câu).
- [ ] 375 px: hộp Kết luận khoá thành ba dòng, nút ≥ 44 px dưới `sm`; sáng/tối chỉ dùng token (PR-SANG), chữ ≥ 12 px cho %, hạn, trạng thái.
- [ ] Phép kiểm (khối 9, thuần + quét file): hàm dựng chữ hộp (`chuHopKetLuan(...)` trong `shared/domain/cuoiKhoa.ts`) đủ 6 trạng thái · panel mới dùng
  `useLoiForm` (phép N1 (7)) · không `type="date"` (phép NEN).
- [ ] `npm run check` → commit `PR-LT2b (9): hồ sơ HV — hộp Kết luận khoá, ô Mini Test, % tổng; Lộ trình tiếp theo có dữ kiện và gửi QL`.

## Task 10 · Demo K5 §6 (D10, D11, D12 phần LT2b, D13) + tài liệu

**Files:** tạo `server/src/seed/lt2bSeed.ts` (`buildLt2bDemo`) · `seed/seed.ts` (gọi SAU bộ LT2a, SAU `buildYThuc`, TRƯỚC `buildDuyetDemo` — lần
`quetYeuCau` của nó sinh thẻ) · `DEMO.md` · `CODE_MAP.md` · `thiet-ke/TU_DIEN_VA_CHU.md` (chữ mới) · `plan.md` (luật LT2b).

- [ ] Dựng **qua hàm dịch vụ** (`saveRegularScore`, `applyTransition`, `duyetYeuCau`, `ghiMiniTest`, `ghiKetLuanFt`), chỉnh ngày bằng SQL khi cần:
  - **D10** `MB BE 08` (Q9): 4 em Cuối khoá ở 4 dải: 45% (Học lại, việc Báo PH cho QL sau chuyển), 55% (**thẻ Quyết định Cuối khoá đang chờ**), 64% (đã chuyển
    lên ELE: Case + PA Bổ trợ miễn phí + Mini Test **chưa ghi**, việc cho GVBM), 78% (Pass).
  - **D11** một em 64% đã chuyển, Mini Test **58%** → thẻ **Báo lên** cho QL.
  - **D12** `MB Pre FOU 03`: em 52% → thẻ đã QL quyết "Lên" → đã lên FOU: Case "Cuối khoá Pre FOU · Tổng hợp không đạt", 4 buổi · 2 tuần.
  - **D13** hai em BE lên FT: "Không đạt · Trung tâm" → Case FT + PA Tutor 10 buổi; "Không đạt · Học sinh" → chữ case-by-case, không Case.
- [ ] Phép kiểm demo (khối 10): soi **ảnh chụp ngay sau seed** (mẫu `chupDemoYThuc`): mỗi D có đúng dữ liệu; hộp Chờ duyệt QL có chip Học thuật ≥ 1 thẻ
  Quyết định Cuối khoá và Báo lên ≥ 1 thẻ Mini Test. DEMO.md có dòng D10–D13 (phép "DEMO.md khớp seed" nếu có).
- [ ] `npm run check` → commit `PR-LT2b (10): demo D10–D13 + tài liệu`.

## Task 11 · Cổng gộp, impeccable `audit` + `polish` (sáng + tối), bấm thử, mở PR

- [ ] 🛑 Cổng gộp: `origin/main` mới nhất (LT2a, S4F, PR-GV, PR-CT nếu đã merge) → gỡ theo bảng → `npm run check` → Nhật ký.
- [ ] impeccable **`audit`** (a11y, tương phản **cả hai** chế độ, trạng thái rỗng/lỗi, 375 px) cho: hộp Kết luận khoá, ô Mini Test, form Ghi kết quả cuối (ô
  Mini Test), thẻ Quyết định Cuối khoá, lưới lớp thường cột Kết quả, Hành trình ghim lớp thường → sửa P0/P1 → **`polish`** một lượt. Không đổi phông/màu/bố cục khoá.
- [ ] Bấm thử theo **KIỂM** (dưới) — Playwright kênh Chrome, API 4187 · Vite 5387, DB demo riêng; ảnh trước (main) / sau 1440 + 375, **sáng và tối** vào
  `thiet-ke/anh/pr-lt2b/`; nhật ký `thiet-ke/anh/pr-lt2b/kiem-sau.log`.
- [ ] `/ponytail-review` → sửa hoặc ghi lý do không sửa. Liệt kê mọi chú thích `ponytail:` trong mô tả PR.
- [ ] Mở PR (không draft, không tự merge): mỗi mục T/K → ảnh → đạt/không; "tầng 1 của màn này" (hộp Kết luận khoá: **% Cuối khoá + hướng**; thẻ: **hạn
  quyết**; lưới: **%**); bảng "Chuyển cho PR khác"; phép kiểm trước/sau; trần tốc độ đổi. Tắt 4187/5387, quét `tests/run.js` treo, dọn file tạm.

## KIỂM — kịch bản bấm thử (Task 11, một lần)

| # | Vai | Làm | Phải thấy |
|---|---|---|---|
| 1 | QL (id 2) | Công việc › Chờ duyệt › chip Học thuật | Thẻ `Quyết định Cuối khoá · Cuối khoá 55% · MB BE 08`, 4 môn, hạn `còn n ngày`, hai nút `Học lại BE` / `Lên ELE + bổ trợ` |
| 2 | QL | Bấm `Lên ELE + bổ trợ` | Thẻ sang "Đã duyệt"; hồ sơ em: hộp Kết luận khoá `QL đã quyết: Lên ELE + bổ trợ · dd/mm` |
| 3 | GVCN BE | Hồ sơ em 45% › Lộ trình tiếp theo › chọn `Lên ELE` | Ô Lý do bắt buộc, nút `Gửi QL quyết` → thẻ mới ở hộp QL |
| 4 | GVBM lớp ELE | Việc của tôi | `Ghi Mini Test · {tên} · hạn dd/mm` → form Ghi kết quả cuối có ô Mini Test % + Ngày làm |
| 5 | GVBM | Ghi 58% | Case còn mở; QL có thẻ Báo lên + thông báo; ghi 72% (em khác) → Case Xong |
| 6 | QL | Hồ sơ em BE 72% › Kết luận khoá › `Không đạt` · Trung tâm · R | Sau chuyển FT (demo D13): Case FT `Kỳ vọng đầu ra chưa đạt · Reading` + PA `Tutor 10 buổi` |
| 7 | GVCN / GVBM | Thử bấm quyết thẻ, thử `PUT /students/:id/ket-luan-ft` | Không có nút; API 403 |
| 8 | GVBM lớp thường | Lưới Cuối khoá MB BE 08 | Cột Kết quả `64%` + `→ lên + bổ trợ`; không chữ "SOS" ở lưới, hồ sơ, Hành trình, Excel lớp thường |
| 9 | GVCN FOU | Hồ sơ em Pre FOU → FOU (D12) | Case `Cuối khoá Pre FOU · Tổng hợp không đạt`, `đến Mini Test · dd/mm`, ghi Mini Test được; GVBM L của FOU thì không |
| 10 | QL | Việc `Chưa có lộ trình tiếp theo` lớp BE | Có đuôi `· 1 em cần QL quyết (Cuối khoá 50–59%)` |
| 11 | mọi vai | 375 px, sáng và tối | Hộp Kết luận khoá 3 dòng, không tràn ngang; % đọc được ở cả hai chế độ |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | LT2b để sẵn |
|---|---|---|
| **Màn Chuyển tiếp lớp** theo K2 §4(a) bước 2–5 (cột % đậm + hướng điền sẵn, đổi có lý do, 50–59 hai nút QL, dòng chưa đủ điểm khoá có nút tới lưới, "+ Mở lớp mới" panel M1 — K2-16 đã có), K2-25 phần màn hình, T71 phần màn hình | **PR-CT** | `GET /classes/:id/transition` → `students[].cuoiKhoa: EmCuoiKhoa` · `goiYCuoiKhoa(em)` → `{ dai, tyLe, huong, canQl, boTroNeuLen, baoPhTvv, nhan, nhanNgan }` · `kiemDongCuoiKhoa(dong)` (câu lỗi dòng) · `laChieuCoLoi` · `hanQuyetDinhCuoiKhoa` |
| Áp dụng chuyển mới (QL quyết em nào, lớp nào, tuần nào; GVCN bàn giao 3 ngày) | **PR-CT** | gọi `sauChuyenCuoiKhoa(p, dongs)` **trong tx**, SAU khi mở lộ trình mới / đóng Case sang FT (thứ tự: Hướng dẫn 1b); `applyTransition` hiện đã gọi `kiemDongCuoiKhoa` — giữ |
| "Ghi hướng cho cả lớp" (K2-26 (5)), gộp "Chưa rõ"/"Xếp sau", "Hướng khác ▾" (K2-26 (2)(4)) | **PR-CT** | dữ liệu như trên |
| Câu T49 ngay trên dòng "Sang Fast Track" và ở Chuyển lớp một em (K2-27, K2-34 "Điều sẽ đổi") | **PR-CT** | `PUT /students/:id/ket-luan-ft` (`ghiKetLuanFt`), `EmCuoiKhoa.ketLuanFt` |
| KPI tháng (T50, §6.5, K5-56): "HS pass một bài" | **PR-GV** | `datTheoTyLe(tyLe)` (`shared/domain/cuoiKhoa.ts`) · `tyLeTongLo(attemptIds)` (`server/src/normal/cuoiKhoa.ts`, ≤ 2 câu, trả `du` để chỉ đếm bài đủ môn). **Không** đổi `evaluateRegular`/`regular.ts`. PR-GV merge **trước** LT2b thì dùng `evaluateRegular(...).tyLeTong >= RATIO_PASS_THRESHOLD` (kế hoạch PR-GV G2), đổi sang `datTheoTyLe` khi gộp |
| Tổng hợp Test khung lớp thường 4 dải + Mini Test đạt/trượt (K1-19); tách "PA theo quy chế / PA bổ trợ miễn phí / PA GV thêm" ở Hiệu quả PA (K5-55c, T61) | **PR-Pb2** | `daiCuoiKhoa`, `mini_test`, kind `bo_tro_mien_phi` |
| Tổng quan "Hôm nay"/thanh việc hồ sơ 30 giây hiện Mini Test | **PR-VAI** | nhóm việc `mini_test` |

**Phần dùng chung với PR-LT2a (ai dựng · ai dùng):**

| Thứ | LT2a dựng | LT2b dùng |
|---|---|---|
| Kind PA `bo_tro`, cột `case_interventions.nhom_bo_tro`, "ghi kết quả một lần chép cả nhóm" (M-03) | ✓ | thêm kind `bo_tro_mien_phi` cạnh `bo_tro`; nhóm `'mt:{attemptId}'` cho Mini Test một lần/em |
| `sos_coordination_actions.kind = 'bao_ph_tvv'`, việc `phoi_hop`, tab con "Phối hợp" | ✓ | tạo dòng cho Cuối khoá < 50% (người làm QL) |
| Bỏ tín hiệu lớp thường (`verify`, `DongTinHieu`, route dismiss/assign, chỉ số `tin-hieu-*`), `refreshRegularOutcome` Giữa khoá → Case | ✓ | chỉ phép kiểm "Cuối khoá không sinh tín hiệu/Case" (một dòng chặn nếu LT2a chưa có) |
| `moc_quy_che` giá trị mới + `mocChuPa` | "đến Cuối khoá" | `'mini_test'` |
| Loại thẻ | `ke_hoach_bo_tro` | `quyet_dinh_cuoi_khoa`, `bao_len_mini_test`, `bao_len_cuoi_khoa`; `KieuNut 'quyet'` |
| Luật **M1b** tự tạo bài Giữa/Cuối khoá khi em vào lớp thường (#133 giao "PR-LT2") | ✓ (LT2a Task 8) | phép kiểm dựng bài Cuối khoá dùng hàm đó |
| T58 bỏ chữ SOS lớp thường (`nhanKetQuaThuong`, `lopThuong.ts`) | ✓ (LT2a Task 9) | thêm hướng Cuối khoá sau chữ đó (Task 8) |
| K4-23 | vế 1: dời lần 2 → báo GVCN | vế 2: Cuối khoá dời quá tuần cuối khoá → Báo lên (Task 7) |
| K1-19 Tổng hợp Test khung lớp thường | LT2a ghi "LT2b" | LT2b chuyển **PR-Pb2** (theo #118) — planning xác nhận |

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | Case Cuối khoá `origin_kind 'chuyen_cap'`, `LA_CASE_SOS` loại nó; PA bổ trợ miễn phí `preset 1` + `confirmed` ngay | T70 "chạy ngay", M-01 "nguyên nhân không bắt buộc"; `preset 1` cho sẵn "không Thay/Kết thúc sớm" + "Ghi kết quả cuối" ở mốc (T63) |
| Q2 | Thẻ Quyết định Cuối khoá **máy tự tạo** khi Cuối khoá đủ điểm ở 50–59% (GVCN đề xuất bổ sung vào thẻ) — **Câu hỏi 2** | không em nào lọt khi màn Chuyển tiếp đổi (PR-CT: QL quyết chuyển); hạn M-19 tính từ tuần Cuối khoá |
| Q3 | Mini Test **một lần/em** cho mọi môn trượt (một dòng `mini_test`, PA chung `nhom_bo_tro`) — **Câu hỏi 1** | quy định ghi "làm Mini Test" số ít; §6.3 "một ô `% · ngày`" |
| Q4 | Ngày Mini Test dự kiến = Chủ nhật tuần cuối của PA (1 hoặc 2 tuần từ `max(ngày chuyển, tuần khai giảng lớp đích)`), hạn +2; không cho sửa | web không có lịch buổi; "buổi 2" của 60–69 khi chỉ 1 môn trượt không tồn tại (M6) |
| Q5 | Mini Test ≥ 70% → Case **tự Hoàn thành** (outcome "Tiến bộ", ghi chú %); < 70% → Case mở + Báo lên, QL xử lý case-by-case | K2 §4a bước 7; T47 |
| Q6 | 50–59% QL quyết **học lại** cũng sinh "Báo PH qua TVV" (người làm QL) | quy định III TH2.1 "Head tạo Task cho TVV" — §6.3 chỉ ghi < 50% |
| Q7 | `kiemDongCuoiKhoa` chỉ khoá khi em **có** lượt Cuối khoá chưa đủ điểm / 50–59 chưa quyết mà người chuyển không phải QL; không có lượt Cuối khoá → không khoá | không phá phép kiểm/dữ liệu chuyển lớp giữa khoá; màn khoá do PR-CT |
| Q8 | PA Tutor 10 buổi (T49) `preset 0` — GV kết thúc khi xong | không có mốc ngày; `preset 1` không mốc sẽ không bao giờ kết thúc |
| Q9 | Demo D10 dùng lớp có sẵn `MB BE 08` (không tạo `MB BE 03`); D12 dùng `MB Pre FOU 03` | ít dữ liệu mới nhất |
| Q10 | "Chiều có lợi" chỉ là: gợi ý Học lại mà chọn Lên/Sang FT. 60–69/≥ 70 chọn Học lại = chiều bất lợi → chỉ bắt lý do | 60–69 không có hướng "lên không bổ trợ" |
| Q11 | Hạn thẻ "trước ngày khai giảng" = khai giảng − 1 ngày; lớp kế lấy `lo_trinh_tiep_theo.lop_du_kien_id` | §5.5 "trước ngày khai giảng" |
| Q12 | Sửa điểm Cuối khoá **sau** khi đã chuyển: không tự đổi Case/PA đã tạo; hộp Kết luận khoá ghi lại % mới | không sửa lịch sử đã áp; GV/QL tự xử lý |
| Q13 | Kết luận lên FT lưu ở `lo_trinh_tiep_theo` (cùng dòng dự định em × lớp cũ); đánh dấu được cả **sau** khi đã sang FT | không phụ thuộc màn Chuyển tiếp (PR-CT) |
| Q14 | `tong_hop` ở lớp không phải Pre FOU → quyền theo GVCN (`sosEditCtx`), người thực hiện = GVCN | K5-61 giữ hạng mục `tong_hop`; không ai khác có ô đó |
| Q15 | Nhãn KPI/Excel/Hành trình làm tròn % khi hiện; dải và đạt/không xét số chính xác | nhất quán MH7 (PR-MON) |
| **R1** | Bỏ (DB reset) T70 đuôi "tín hiệu lớp thường đang chờ lúc deploy: Cuối khoá → thu hồi" (K3-26 migrate phần Cuối khoá, K5-66) | không còn dữ liệu cũ |
| **R2** | Bỏ K5 §5 dòng PR-LT2 "tín hiệu `pending` → Case hoặc thu hồi" (phần Cuối khoá); không `chay-thu:lt2b` | như trên |
| **R3** | Bỏ dựng lại Case/Mini Test cho lớp đã Chuyển tiếp trước ngày lên bản | như trên |
| **R4** | Bỏ giữ `case 'case_signal'` trong `duongThongBao` cho thông báo tín hiệu Cuối khoá cũ (K5-18 phần LT2b) | như trên |
| **R5** | Bỏ K1-03 "migrate tín hiệu đã bỏ qua thành ghi chú lịch sử" (thuộc LT2a — ghi để khỏi sót) | như trên |

## Mâu thuẫn nguồn ↔ mã thật

- **M1** §8 dòng LT2b gồm §6.5/T50 (KPI) ↔ giao việc 30/09: KPI thuộc PR-GV → LT2b chỉ xuất `datTheoTyLe`, `tyLeTongLo`.
- **M2** §8 cổng LT2b "C 4177/5377" ↔ giao việc 4187/5387 (PR-GV dùng 4177) → theo giao việc.
- **M3** T71 "+ Mở lớp mới dùng panel M1", "vào FT lấy lộ trình lớp đích", M-20 LT ↔ RF ↔ **đã có trên main**: `TransitionPanel.tsx:13` + `transition.ts:127-133`,
  `luatLoTrinh.ts:254, :446`, `lenLop.ts:73-76` → chỉ phép kiểm; phần màn → PR-CT.
- **M4** Mã coi "Case SOS" = có PA `preset = 1` (`sosState.ts:33, :84, :124`, `tongHop.ts:215`, `mywork.ts:731`) ↔ T70 Cuối khoá không Case chờ nguyên nhân → Q1.
- **M5** M-01 "gắn PA vào Case Giữa khoá cùng môn còn mở" ↔ lên lớp thường là `dong-mo` với `dongCase: null`, Case ở lại lộ trình cũ (`lenLop.ts:80-82`,
  `luatLoTrinh.ts:264-266` chỉ chuyển Case khi FT → FT) → chuyển Case mở sang lộ trình mới (K5-61) rồi gắn theo khoá chống trùng.
- **M6** Quy định III.3.2 TH2.2 "01 buổi/kỹ năng không đạt … 04 buổi bổ trợ" tự mâu thuẫn; TH3 "Mini Test buổi 2" khi chỉ 1 môn trượt không có buổi 2 → theo
  §6.3 (1 buổi/môn trượt, 2 tuần / 1 tuần), Mini Test sau buổi cuối (Q4).
- **M7** K2 §4a bước 6 "PA dự kiến kết thúc theo số buổi" ↔ Q28-4 bỏ "Dự kiến kết thúc" → dùng `followup_due` làm **mốc quy chế** (`moc_quy_che 'mini_test'`),
  hiện "đến Mini Test · dd/mm".
- **M8** K3-27 tên Case "Bổ trợ chuyển cấp · từ FOU Cuối khoá 64%" ↔ T70 "Cuối khoá · {môn} không đạt" (M-01, §5.8 thắng báo cáo) → `Cuối khoá {CT cũ} · {môn} không đạt`.
- **M9** `SOS_EDIT` theo `c.topic` (`cases.ts:291`) ↔ Case `tong_hop` ở lớp FOU không có ô phân công → Q14.
- **M10** #118 (dòng 78), #133 (dòng 47) giao M1b và "Pre FOU Cuối khoá không mở tín hiệu" cho "PR-LT2" chung → bảng "Phần dùng chung".
- **M11** Planning 30/09 tách màn Chuyển tiếp sang PR-CT ↔ đặc tả T71, K2-25 (P0), K2 §4a bước 3–5 viết cho LT2 → LT2b giữ luật + API, màn chuyển PR-CT.

## Câu cần chủ sản phẩm quyết (kế hoạch chạy theo khuyến nghị nếu chưa có trả lời)

1. **Mini Test làm mấy lần khi em trượt nhiều môn?** (A) **Một bài Mini Test cho em** sau buổi bổ trợ cuối, một ô `% · ngày` · (B) Mỗi môn trượt một Mini
   Test riêng. **Khuyến nghị A** — quy định ghi "làm Mini Test" (số ít) và đặc tả §6.3 ghi "một ô".
2. **Thẻ "Quyết định Cuối khoá" (50–59%) sinh lúc nào?** (A) **Máy tự tạo** ngay khi Cuối khoá đủ điểm và rơi vào 50–59%; GVCN ghi đề xuất vào thẻ · (B) Chỉ khi
   GVCN bấm "Gửi QL quyết". **Khuyến nghị A** — không em nào bị bỏ sót, hợp với luồng mới "QL quyết định chuyển lớp" (PR-CT).

## Nhật ký

- Mốc B (Task 0): **1821** phép kiểm (`run.ts`, `main` @ 80cb0ffb; đo bằng `npm run check` sau lần chạy lại vì lần đầu segfault). Sau Task 4: **1840**.
- LT2a / S4F / PR-GV / PR-CT đã merge lúc bắt đầu? **S4F đã merge (#135). LT2a, PR-GV, PR-CT chưa** (`origin/main` @ c1e24a31, mới có kế hoạch/mockup). Task 5 trở đi 🛑 chờ LT2a.
- M1b: LT2a chưa merge → chưa biết; phép kiểm Task 5 dựng bài Cuối khoá bằng `planRegularTests` + ghi điểm thẳng (đã dùng ở khối 3–4).
- Câu 1 = A (một Mini Test/em). Câu 2 **không còn** (bỏ thẻ Quyết định Cuối khoá — Q30-3).
- Dòng thật lệch kế hoạch: chưa đối chiếu hết (làm ở Task 5). **Theo chốt 30/09 đã bỏ**: `hanQuyetDinhCuoiKhoa`, `kiemDongCuoiKhoa`, `laChieuCoLoi`, `datTheoTyLe`, `chuHopKetLuan` (Task 9 làm lại theo hộp mới nếu cần), `EmCuoiKhoa.theQuyetDinh`/`tuanCuoiKhoa`; **Task 4 (thẻ) không làm** — phần còn lại của Task 4 = ghi `quyet_boi/quyet_luc` khi Quản lý chuyển em 50–59% (trong `applyTransition`, nhật ký `cuoi_khoa.quyet`). `goiYCuoiKhoa` trả `canQuanLy` **và** bí danh `canQl` (kế hoạch PR-CT còn ghi `canQl`) — bỏ bí danh khi PR-CT đổi tên. Tham số `maKe` của `goiYCuoiKhoa` bỏ (lớp kế lấy từ `NORMAL_LADDER`, ELE → FT). Cột `lo_trinh_tiep_theo.quyet_*` **giữ** (PR-CT chờ). Em < 50% mà Quản lý chọn Lên: **không** có bổ trợ miễn phí (luật §6.3 chỉ cho 50–59 / 60–69) — hỏi planning nếu muốn khác.
- Trần tốc độ đổi (cũ → mới): `/classes/6/transition` QL 37 → 39, QT 36 → 38, GVCN_THUONG 37 → 39 (Task 3, +5 %); POST chuyển cả lớp sang FT 200 → 210 (Task 4, đo 201).
- Phép kiểm cũ sửa kỳ vọng: XOA X1 (31 → 32 bảng, `mini_test`) · XOA X2 (55 → 58 cạnh) · XOA X3 (fixture thêm `mini_test`) · XOA X10 (≤ 42 → ≤ 43 câu) · XOA T1 (74 → 76 cột trỏ users) · PR-LT (2) (DB cũ nâng cấp qua cả `migratePrLt2b`) · YT4 (2) (bộ dò `quyet_luc` chỉ nhắm cột cuối bảng vi phạm). Số phép kiểm không giảm.
- Cổng gộp: LT2a (#139) gộp trước Task 5, PR-GV (#138) gộp ở Task 11; PR-CT chưa merge. LT2a có đủ `bo_tro`, `nhom_bo_tro`, `chepKetQuaNhom`, `bao_ph_tvv`, M1b — không cần hỏi planning.
- `/ponytail-review`: bỏ export thừa `ketLuanCuaDong`; giữ bí danh `canQl` (chú thích `ponytail:` — bỏ khi PR-CT đổi tên). Không còn gì để cắt.
- Task 5–11 (30/09, Sonnet 5.5): `attempt_id` của Case `chuyen_cap` = NULL (quyền theo lớp đang học; bài gốc ở mốc `opened` + `mini_test.tu_attempt_id`). Bổ trợ tạo theo lô (Case mới một INSERT … RETURNING). Em < 50% mà QL chọn Lên: không bổ trợ (§6.3). PA Bổ trợ miễn phí đếm chung nhóm PA quy chế (preset) ở Hiệu quả PA — tách riêng thuộc PR-Pb2 (K5-55c). Mini Test có nhiều PA khác người dạy: việc `Ghi Mini Test` về người dạy có id nhỏ nhất, mọi người dạy/GVCN/QL vẫn ghi được. F10 (run.ts) quét thêm hạng mục `tong_hop`; 3 phép kiểm cũ khác sửa kỳ vọng: "Ba nguồn case" (+`chuyen_cap`), [8.3] (PA thường không mốc quy chế), PR-HVL (7) (`canQl`). Trần tốc độ: `/my-work` GVCN 64→68 · GVBM 63→70 · QL 62→67 · QT 68→69, `?nguoi=tat-ca` QL 75→77 · QT 75→79, `nguoi=7` 74→78, `/yeu-cau?hop=cho-duyet` QL 32→34 · QT 31→33, `/giao-vien/7/ket-qua` 59→74 (demo thêm 2 lớp cho GVCN Hà), xem trước xếp lịch MT 108→114, POST chuyển cả lớp sang FT 200→224 (đo 214). Bấm thử: API 4187/Vite 5387, sáng+tối, 1440+375, 49 ảnh + log ở `thiet-ke/anh/pr-lt2b/`; ghi thật Mini Test 72% qua form → Case tự Hoàn thành. impeccable audit: detector 0 phát hiện, không nút < 44 px ở 375, không tương phản < 4,5; sửa 1 P1 (lưới hiện % thay `n/4 môn đạt` ở Cuối khoá) + nhãn "Ngày làm Mini Test".

## Chủ sản phẩm / planning chốt 30/09 (thắng các chỗ lệch trong kế hoạch)

- **Q30-3 (chủ sản phẩm): BỎ thẻ "Quyết định Cuối khoá"** (50–59% và đổi hướng có lợi) — không có loại thẻ mới trong loaiYeuCau.ts, không hạn M-19/T54 phần thẻ. `goiYCuoiKhoa` vẫn trả `canQuanLy: true` cho 50–59% để panel PR-CT hiện chip "Quản lý cân nhắc". Câu 2 của kế hoạch (thẻ tự tạo hay GVCN gửi) **không còn**.
- **Q30-4 (chủ sản phẩm): KHÔNG khoá dòng thiếu điểm Cuối khoá.** Em vẫn chuyển đúng tuần; khi điểm nhập sau (kể cả khi em đã sang lớp/lộ trình mới), `sauChuyenCuoiKhoa`/luật Cuối khoá áp ở lộ trình mới (PA bổ trợ miễn phí, Mini Test, Báo PH qua TVV) — thêm phép kiểm "nhập điểm Cuối khoá sau khi đã chuyển". Bỏ `kiemDongCuoiKhoa` phần khoá.
- **Câu 1 = A (planning chốt):** Mini Test **một lần mỗi em** (một ô `% · ngày`).
- Mọi phần màn Chuyển tiếp lớp, quyền chuyển lớp → **PR-CT** (đặc tả §3.1f, mockup 20). LT2b xuất hàm như đã ghi.
- **Q30-6 mã tuần:** chữ mới trên màn dùng mã tuần; ngày chỉ cho hạn Mini Test/ngày thi.
- Planning duyệt bảng Q (15 dòng) và R1–R5; K1-19 → PR-Pb2 (xác nhận).

- **KPI bỏ (Q30-5):** `datTheoTyLe`/`tyLeTongLo` không còn phục vụ KPI của PR-GV — giữ nếu LT2b tự cần, không xuất riêng cho PR-GV.
