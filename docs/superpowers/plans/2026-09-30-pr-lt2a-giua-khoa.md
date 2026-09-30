# PR-LT2a · Lớp thường · Giữa khoá — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Giữa khoá lớp thường (FOU · BE · ELE; Pre FOU **không có** Giữa khoá — PF2) môn < 70% → **tự tạo Case** `[Giữa khoá] {môn} không đạt`
(không nhãn SOS) + **PA Bổ trợ bắt buộc** tới tuần Cuối khoá, "trừ buổi Free". FOU: **2 buổi/tuần chung** — mỗi Case một dòng PA cùng
`nhom_bo_tro`, ghi kết quả **một lần chép cả nhóm**, người dạy bổ trợ mặc định **GVCN** (Q-F, M-03). BE/ELE: 1 buổi/tuần/môn, mỗi Case một PA,
người dạy mặc định GVBM môn. GVBM **Xác nhận Case** như SOS FT (3 ngày, N5) → người dạy bổ trợ nộp **kế hoạch bài giảng** → thẻ **Chờ duyệt ·
Học thuật** (QL, 3 ngày — T54, M-05) → duyệt → PA **Đang làm**. Tự tạo việc phối hợp **"Báo phụ huynh qua TVV"** (4 nội dung) cho GVCN (N3, T45).
Bỏ hẳn mô hình "tín hiệu · Tạo Case / Bỏ qua" của lớp thường (N4); "Không cần theo dõi" qua QL như S4-5. Lớp thường **không có nhãn SOS ở bất
kỳ đâu** (T58). Em vào lớp thường tự có bài Giữa khoá + Cuối khoá (M1b, K2-23).
**Architecture:** PA Bổ trợ = `case_interventions.kind = 'bo_tro'`, `preset = 1` → **dùng lại nguyên** hạ tầng SOS v4 (#127, #129): chờ nguyên
nhân `han_xac_nhan`, Xác nhận Case, Không cần theo dõi, Báo lên quá hạn, Ghi kết quả cuối, chặn Hoàn thành. Trạng thái kế hoạch đọc từ **thẻ**
`yeu_cau_duyet` loại `ke_hoach_bo_tro` (không dùng `approval_state`). Luật thuần mới `shared/domain/lopThuong.ts`. Máy chủ: `normal/regular.ts`,
`cases/sos.ts` (`taoCaseTuDong` thêm tham số), `cases/boTro.ts` (mới), `cases/sosAuto.ts`, `cases/sosState.ts`, `cases/cases.ts`,
`duyet/loaiYeuCau.ts`, `worklist/mywork.ts`, `yThuc/phoiHop.ts`; migrate `server/src/migrate/prLt2a.ts`. Web: `SkillBoard.tsx`, `CasePanel.tsx`,
`CaseSosControls.tsx`, `NopKeHoachPanel.tsx` (mới), `PhoiHopSosSection.tsx`, `LuoiThuong.tsx`, `StudentDetailPage.tsx`, Công việc.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); phép kiểm `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §6.1, §6.2 N1–N5 · §3.1c **Q-F** · §3.2 T45, T46, T54 (kế hoạch), T57,
**T58**, T61 (phần PA bổ trợ), T66 · §5.5 (loại "Kế hoạch bổ trợ lớp thường") · §5.7 MH7, MH8 · §5.8 **M-03, M-05** · §6.6 PF2 · §7.3, §7.5 ·
§8 dòng PR-LT2a · §10 · nguồn `thiet-ke/nguon-27-09/NGUON_QUY_DINH_LOP_THUONG.md` mục II · rà `thiet-ke/ra-27-09/`: K1-02, 03, 12, 15, 19 (phần
nhãn), 41, 55 · K2-01 (Giữa khoá), 04, 12 (phần SOS), 23 (M1b) · K3-04 (phần SOS + % trơn), 12, 26, 28, 31 (Giữa khoá), 39 + K3 §4(a)(b) ·
K4-21 (Giữa khoá), 23 (phần báo GVCN), 36 · K5-01, 08, 10, 11 (kế hoạch), 50, 51, 55, 61 (phần mốc), 64, 65 + K5 §3 #2, #3, #9, §4 #6, #14–16,
§6 D9, D10 (phần Giữa khoá) · thân PR #117 (giao kèo loại thẻ), #118, #127, #128, #133 mục "Chuyển cho PR khác" (dòng LT2a).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-LT2a** · đợt 5 · làn **A** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-lt2a-giua-khoa` · `.claude/worktrees/pr-lt2a-giua-khoa` (từ `origin/main` ≥ be092a42 **và có PR-S4F**) |
| Cổng thử | API **4167** · Vite **5367** (B = PR-GV 4177/5377 · C = PR-LT2b 4187/5387; không dùng 4000/5173) |
| Model | **Opus 5.5 · XHigh** · phương án B: **Fable 5.1 · High** — đọc "Hướng dẫn riêng cho model thực thi" **trước Task 1** |
| Người rà | rà **một lượt cuối đợt 5** (chủ sản phẩm 29/09 — không rà từng PR); session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** |
| Migrate | **Có (chỉ cấu trúc)** — `server/src/migrate/prLt2a.ts`: `case_interventions.nhom_bo_tro TEXT`, `case_interventions.han_ke_hoach TEXT` + chỉ mục `idx_ci_nhom_bo_tro`; chạy lặp được; **một dòng gọi CUỐI** `migrate()`. Loại PA `bo_tro`, việc phối hợp `bao_ph_tvv`, mốc `den_cuoi_khoa` là **giá trị chữ** (schema không có CHECK — K5 §5) → không đổi bảng. **Không** chuyển dữ liệu cũ, **không** `chay-thu` (DB reset trước deploy) |
| Skill | **`/ponytail lite` đầu phiên** (PR có giao diện). impeccable **`clarify`** ở Task 9, 10 (nhãn nút, trạng thái, câu lỗi, 4 nội dung Báo PH); **`audit` + `polish`** ở Task 12, cả **sáng và tối**. Không `init`/`document`/`hooks on`/`npx impeccable install`. Bám M7 + `thiet-ke/HE_GIAO_DIEN.md` + `TU_DIEN_VA_CHU.md` |
| Phụ thuộc | DUYET #117, SOS #127, S3F #129, MON #118, MT #119, NHAP #120, YT4 #128, HVL #133, SANG #134 **đã merge**. **🛑 PR-S4F** (sửa `refreshRegularOutcome` + `permissions.ts`) phải merge trước **Task 3** (xem Quy trình). Song song: PR-GV (B), PR-LT2b (C — **phụ thuộc** PR này) |
| Không làm | Cuối khoá (% hướng, Chuyển tiếp lớp, Mini Test, PA bổ trợ miễn phí, Kết luận lên FT, thẻ Quyết định Cuối khoá — PR-LT2b); KPI tháng (PR-GV); tách hiển thị Hiệu quả PA (T61 → PR-Pb2); Tổng quan theo vai (PR-VAI); đổi tên nhóm việc `result`→`ghi_ket_qua_pa` (T75 → PR-VAI); sửa `permissions.ts` (S4F đang sửa — quyền mới viết trong `cases/boTro.ts`) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, foreground** (không chạy nền, không chồng)
  → xanh, số phép kiểm ≥ mốc B → commit `PR-LT2a (n): …`. Sập "Segmentation fault" của Node → chạy lại **một** lần (không phải phép kiểm hỏng).
- Treo > 10 phút → `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'` → tắt hết → chạy lại một lần.
- **🛑 Cổng S4F:** Task 0 ghi PR-S4F đã merge chưa. Chưa → làm Task 1, 2 (luật thuần + migrate, không chạm `regular.ts`/`permissions.ts`), rồi
  **dừng** tới khi S4F merge → `git rebase origin/main` → `npm run check` → Task 3. Không tự sửa lại phần S4F đã sửa (xoá điểm môn trượt rút
  Case; sửa điểm không ghi mốc `passed`) — giữ nguyên phép kiểm S4F.
- Không chụp ảnh từng Task. Bấm thử theo vai + **375 px** + **sáng và tối** **một lần** ở Task 12 (Playwright kênh Chrome; đăng nhập demo
  `POST /api/demo/session {userId}`). Ảnh trước (main) / sau → `thiet-ke/anh/pr-lt2a/`. API `PORT=4167`, Vite tạm 5367 proxy về 4167 (memory
  "máy chủ dev trong worktree").
- Không chạm Turso, không deploy, không chạy `migrate` trên bản chính. Dữ liệu thử chỉ trên **DB demo trong worktree**.
- Gặp mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning. **Cổng rebase** (Task 12, và khi PR-GV merge trước): `git rebase origin/main` →
  gỡ theo bảng dưới → `npm run check`.
- **🛑 Cửa dừng khác:** (1) Câu hỏi 1–2 chưa có trả lời lúc tới Task 4 / Task 8 → làm theo **khuyến nghị (A)**, ghi Nhật ký. (2) Phép kiểm cũ phải
  **xoá** (không đổi kỳ vọng được) > 5 → dừng hỏi planning. (3) Trần `tocDoDuong.ts` phải nâng > 30 %.

### File chồng + cách gỡ · thứ tự chạy/merge đề xuất

**Thứ tự:** PR-S4F → **PR-LT2a** → PR-LT2b. PR-GV chạy song song, merge lúc nào cũng được. PR-LT2b bắt đầu song song ở phần **không chồng**
(luật thuần % hướng, panel Chuyển tiếp lớp, migrate `mini_test`) nhưng **🛑 các task chạm `refreshRegularOutcome`, `shared/domain/lopThuong.ts`,
`sosState.ts`, `SkillBoard.tsx`, `loaiYeuCau.ts` chỉ làm sau khi LT2a merge** (gộp `main` ngay khi LT2a merge).

| File | PR khác sửa | PR-LT2a sửa | Gỡ |
|---|---|---|---|
| `server/src/normal/regular.ts` | **S4F**: `refreshRegularOutcome` (xoá điểm môn trượt rút Case, không mốc `passed`) · **LT2b**: nhánh `final` (% hướng, Cuối khoá) | nhánh `progress` → `taoCaseGiuaKhoa`; `final` → không tín hiệu; `taoBaiThuongMacDinh` (M1b); `reportRegularNoShow` báo GVCN lần 2 | S4F merge **trước** (cổng); LT2b viết **sau** LT2a trong khối `if (a.kind === 'final')` |
| `server/src/permissions.ts` | **S4F**: `teacherAllows` ATTEMPT_VIEW, GV Speaking | **không sửa** | — |
| `shared/domain/lopThuong.ts` (mới) | **LT2b**: thêm hàm Cuối khoá (% hướng) **cuối file** | tạo file | LT2b sau LT2a |
| `server/src/duyet/loaiYeuCau.ts`, `shared/domain/yeuCauDuyet.ts` | **LT2b**: `quyet_dinh_cuoi_khoa`, `bao_len_mini_test` | khoá + phần tử `ke_hoach_bo_tro` **cuối mảng** | cùng cuối mảng → **giữ cả hai**, thứ tự theo merge |
| `shared/domain/cases.ts` (`INTERVENTION_KINDS`, `MILESTONE_KINDS`) | **LT2b**: `bo_tro_mien_phi`, mốc Mini Test | `SYSTEM_KINDS = ['bo_tro']`, 3 mốc kế hoạch | chỉ thêm phần tử → giữ cả hai |
| `server/src/worklist/mywork.ts`, `shared/domain/tongQuan.ts` | **LT2b**: `mini_test`, `next_step` gợi ý % · **GV**: có thể đọc nhóm việc theo GV | bỏ `verify`; thêm `ke_hoach_bo_tro`, `phoi_hop`; `result` gộp theo nhóm; `xac_nhan_pa` loại `bo_tro` | khối khác nhau; `WorkGroupKey`/`GROUP_META`/`NHOM_CUA_LOAI`/`LOAI_HAN_CUA_VIEC` chỉ thêm dòng → giữ cả hai |
| `shared/domain/metrics.ts`, `server/src/worklist/metrics.ts`, `shared/domain/phanTich.ts`, `web/src/modules/worklist/MetricTiles.tsx` | **GV**: `kpi-ty-le-pass-thang`, `kpi-diem`, Phân tích Theo giáo viên · **LT2b**: Tổng hợp khung thường (K1-19 đầy đủ) | **xoá** 3 chỉ số tín hiệu; nhãn cột `sos1..3` khung thường; ô "Chờ xác minh quá hạn" → "Case chờ nguyên nhân quá hạn" | xoá ≠ thêm → giữ bản LT2a cho 3 chỉ số, thêm dòng của GV/LT2b. **Phép kiểm sổ chỉ số** (`run.ts` ~:8187-8190, GV đổi 31 → 33): LT2a bớt 3 mã → gộp cả hai = **30**, `expected` = danh sách đã bớt 3 mã + 2 mã KPI |
| `shared/domain/display.ts`, `shared/domain/hanhTrinh.ts`, `web/src/modules/cham/LuoiThuong.tsx`, `web/src/modules/students/StudentDetailPage.tsx` | **LT2b**: `% · hướng` Cuối khoá, hộp Kết luận khoá | bỏ chữ SOS lớp thường (T58); cột `% tổng` trơn; bỏ `PendingSignals` | LT2b thêm hướng **sau** chữ % của LT2a |
| `server/src/cases/sosState.ts`, `shared/domain/sosV4.ts`, `web/src/modules/cases/SkillBoard.tsx`, `CasePanel.tsx` | **LT2b**: Case "Bổ trợ chuyển cấp" + Mini Test | trạng thái `cho-ke-hoach`/`cho-duyet-ke-hoach`, HangPA nhóm | LT2b sau LT2a |
| `server/src/classes/luatLoTrinh.ts`, `server/src/classes/intake.ts` | **LT2b**: Chuyển tiếp lớp theo % | một lời gọi `taoBaiThuongMacDinh…` sau INSERT lộ trình lớp thường (3 chỗ) | chỉ thêm dòng → giữ cả hai |
| `server/src/migrate.ts`, `schema.sql`, `tests/run.ts`, `tests/tocDoDuong.ts`, `shared/domain/index.ts`, `seed/seed.ts`, `seed/journeys.ts`, `routes/index.ts`, `CODE_MAP.md`, `plan.md`, `thiet-ke/*.md` | **cả ba** | **một** import + **một** dòng gọi cuối; cột mới cuối khối bảng; khối phép kiểm cuối `run.ts`; lớp demo mới cuối mảng | chỉ thêm dòng → giữ cả hai, thứ tự theo merge |

## Global Constraints

- **PA Bổ trợ là PA bắt buộc có sẵn khung:** `kind = 'bo_tro'`, `preset = 1`, `moc_quy_che = 'den_cuoi_khoa'`, `confirmed_by` = người **nộp kế
  hoạch** (đặt lúc duyệt). "Chưa chạy" = `UNCONFIRMED_PRESET` + `status = 'planned'` (như PA quy chế) → lọc có sẵn ở việc Ghi kết quả, hiệu quả
  PA, `updateResult` (`cases.ts:2847`) tự đúng. **Không** thêm giá trị `status` mới, **không** dùng `approval_state` cho kế hoạch.
- **Trạng thái kế hoạch = thẻ**: `yeu_cau_duyet` `loai = 'ke_hoach_bo_tro'`, `doi_tuong_loai = 'nhom_bo_tro'`, `doi_tuong_id` = **id PA nhỏ nhất của
  nhóm**. `cho` = chờ duyệt; `duyet` = đã duyệt; không có thẻ `cho`/`duyet` = chờ nộp. Một điều kiện SQL dùng chung `YC_KE_HOACH` ở `sosState.ts`.
- **Nhóm:** FOU `gk:{attemptId}` (mọi môn trượt của một bài Giữa khoá); BE/ELE `gk:{attemptId}:{skill}` (nhóm một dòng). Mọi PA bổ trợ đều có nhóm.
- **Hạn "n ngày" tính cả ngày đầu:** `hanTheoNgay` / `hanXacNhan` (3 ngày) cho xác nhận nguyên nhân, nộp kế hoạch (M-05), duyệt kế hoạch (`hanNgay: 3`).
  Mọi hạn qua `<Han loai>` — loại `ke-hoach-bo-tro` **đã có** (`display.ts:247, 267`).
- **Không nhãn SOS lớp thường (T58):** Case Giữa khoá lưu `sos_level = NULL`, mốc lưu `sos_level = NULL`; chữ kết quả lớp thường đi qua **một**
  hàm `nhanKetQuaThuong` (Task 1). Tên môn qua `tenMon`/`tenMonNgan` (MH2).
- **Tinh tế (memory):** dấu nhỏ nét mảnh (SVG 12 px nét 1.5, không ký tự Inter nhỏ), cột thẳng, không dồn chữ; số `tabular-nums`; một hàng =
  **một** `NhanTrangThai` + hạn qua `<Han>`; màu chỉ qua token (PR-SANG) — không mã hex/`slate-*` mới; chữ ≥ 11 px, kết quả/hạn/trạng thái 12 px.
- **Chữ:** `TU_DIEN_VA_CHU.md`. Chữ mới: `Giữa khoá`, `Bổ trợ`, `trừ buổi Free`, `Nộp kế hoạch bổ trợ`, `Kế hoạch bài giảng`, `Nội dung yếu`,
  `Người dạy bổ trợ`, `Chờ Quản lý duyệt · kế hoạch bổ trợ`, `Chờ nộp kế hoạch bổ trợ`, `Xác nhận Case và gửi kế hoạch`, `Báo phụ huynh qua TVV`,
  `PA chung · G+V, P`. Viết đủ **"Quản lý"** ở khu Case. Ngày `dd/mm`, không ISO, không mã máy.
- **Thành phần có sẵn:** `KhungPanel`, `useLoiForm`, `NutChon`, `OKhac`, `ONgay`, `ChonNguoi`, `NhanTrangThai`, `<Han>`, `ToastHoanTac`, `TheYeuCau`,
  `XacNhanCasePanel`/`KhongTheoDoiForm` (`CaseSosControls.tsx:49, 209`), `HangCase`/`HangPA` (`SkillBoard.tsx:318, 419`). Không dựng thứ tương tự.
- **SQL (Turso):** chỉ `?`; ghi trong `tx()` (BEGIN IMMEDIATE, lồng = savepoint); `IN (…)` chia lô ≤ 400 (≤ 900 tham số/câu); UNION ≤ 20 vế; không
  `RETURNING`; ghi nhiều dòng bằng `chenNhieuDong`/theo lô. Không N+1 (đọc theo tập như `sosCaseStateMany`). Ngày nghiệp vụ `demoToday()`.
- **Quyền:** xác nhận Case / Không cần theo dõi = `caseAccess(id).requireEdit` (GVBM đúng môn C02 + QL). Nộp kế hoạch / ghi kết quả PA bổ trợ =
  `quyenBoTro` (Task 4). Duyệt thẻ = hộp PR-DUYET (`request.approve`). **Mọi đường mới có phép kiểm PHỦ ĐỊNH** (vai sai → 403).
- **Phép kiểm:** `server/src/tests/prLt2a.tests.ts` (`runPrLt2aTests(t)`, đăng ký **cuối** `run.ts` sau `runPrSangTests`). Phép kiểm cũ trái
  luật mới → **đổi kỳ vọng** (không xoá, không nới), ghi Nhật ký. Số phép kiểm không giảm.
- **Tốc độ:** không thêm đường GET mới (dữ liệu đi qua `caseDetail`, `skillSupportBoard`, `/my-work`, Phối hợp). Đo lại `/cases/{case}`, `/my-work`
  (GVCN_THUONG), `/students/{hv}` sau Task 7; thêm đo `/students/{hvThuong}` (vai QL, GVCN_THUONG) vào `DUONG_DO` nếu chưa có. Trần mới =
  `max(sau+10, ⌈sau×1.3⌉)`; không nâng trần cũ > 30 %. Ghi lô thêm HV (`TRAN_GHI_LO`) giữ nguyên trần sau M1b.

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc — nhất là phương án B Fable 5.1)

1. 🛑 **Không bắt đầu Task 3 khi PR-S4F chưa merge** — S4F sửa đúng khối `regular.ts:650-699` mà Task 3 viết lại.
2. PA bổ trợ **không bao giờ** đặt `confirmed_at`/`confirmed_by` lúc tạo. Chỉ `chayPaBoTro` (Task 4) đặt cả hai **cùng lúc**, và chỉ cho dòng có Case
   **đã có nguyên nhân** + nhóm **đã có thẻ `duyet`**.
3. `sosCaseStateMany.pa_cho` (và `coPaChoXacNhan`), nhóm việc `xac_nhan_pa`, `datLaiHanCase` vế PA chờ: thêm `AND iv.kind != 'bo_tro'` — nếu quên,
   Case Giữa khoá hiện "Chờ xác nhận PA" và GV thấy nút Xác nhận PA không làm được gì.
4. Hạn: `hanXacNhan(ngay)` = ngày + 2. Không viết `addDays(ngay, 3)`. Mốc Cuối khoá = **hết Chủ nhật** tuần Cuối khoá (`addDays(mondayOf(tuần), 6)`).
5. `khiDuyet`/`khiTuChoi` của thẻ chạy **trong** giao dịch của hộp: không mở `tx` riêng, không bắt lỗi nuốt — lỗi ném ra để hộp rollback cả thẻ.
6. `awaitingCauseCaseIds` vẫn là **một** định nghĩa chờ nguyên nhân (PA bổ trợ là `preset = 1` nên Case Giữa khoá tự thuộc tập) — không viết điều
   kiện riêng cho lớp thường.
7. `raiseSignal` vẫn gọi cho Giữa khoá (dây nối S08/S4-7 — K5-64), **luôn `silent: true`**. Không xoá bảng `case_signals`, không xoá `raiseSignal`,
   `reconcileCorrectedSignals`.
8. Web: không `<Modal>` (phép kiểm `panelUx3` cấm) — mọi form trong `KhungPanel` của Ngăn Case. Không tự chọn màu; tím "chờ duyệt" = token
   `NhanTrangThai` `cho-duyet` có sẵn.
9. Mỗi phép kiểm cũ đổi kỳ vọng ghi **một dòng** Nhật ký (file · tên khối · vì sao).

## Task 0 · Nhánh, mốc, cổng S4F, chép kế hoạch

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-lt2a-giua-khoa -b pr-lt2a-giua-khoa origin/main`. Gõ `/ponytail lite`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch đợt 5> -- docs/superpowers/plans/2026-09-30-pr-lt2a-giua-khoa.md`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (phép kiểm + tốc độ) vào Nhật ký. Ghi S4F / GV / LT2b đã merge chưa.
- [ ] Đối chiếu dòng mã (grep `export function refreshRegularOutcome`, `export function taoCaseTuDong`, `export function xacNhanCase`,
  `export function sosCaseStateMany`, `export function trangThaiCaseV4`, `export function updateResult`, `loai: 'khong_theo_doi'`,
  `pushVerifyItem`, `function turnsOf`, `function PendingSignals`) — lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Ghi id người dùng demo: `SELECT u.id, u.full_name, c.code, ta.skill, ta.is_core FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
  JOIN classes c ON c.id = ta.class_id WHERE c.code IN ('MB FOU 12', 'MB FT 101') AND ta.status = 'active'` (dự kiến QL Vy **2**, Hà **7** GVCN
  + L/R, Khoa **8** G+V/W, Trang **9** P/S, Linh **10**).
- [ ] Commit `PR-LT2a (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần `shared/domain/lopThuong.ts` + hằng mới (N1, M-03, Q-F, T57, T58, N3, M-05, MH7, MH8)

**Files:** tạo `shared/domain/lopThuong.ts` (+ export `shared/domain/index.ts`); `shared/domain/cases.ts` (`INTERVENTION_KINDS` :572,
`MILESTONE_KINDS` :215 + nhãn); `shared/domain/sos.ts` (`COORDINATION_KINDS` :99 + nhãn); `shared/domain/sosV4.ts` (:30-36, :55-102);
`shared/domain/yeuCauDuyet.ts` (:17, :37-49); tạo `server/src/tests/prLt2a.tests.ts` + đăng ký cuối `run.ts`.

```ts
/** N1: FOU bổ trợ CHUNG 2 buổi/tuần cho mọi môn trượt; BE/ELE 1 buổi/tuần/môn. Pre FOU không có Giữa khoá (PF2) → null. */
export function boTroGiuaKhoa(ct: string | null): { buoiMoiTuan: 1 | 2; chung: boolean } | null;   // FOU → {2,true}; BE, ELE → {1,false}; khác → null
export const nhomBoTro = (ct: string | null, attemptId: number, skill: string) =>
  boTroGiuaKhoa(ct)?.chung ? `gk:${attemptId}` : `gk:${attemptId}:${skill}`;
/** Mô tả PA (T46): FOU `Bổ trợ 2 buổi/tuần · chung các môn trượt · đến Cuối khoá · trừ buổi Free`; BE/ELE `Bổ trợ 1 buổi/tuần · {môn} · đến Cuối khoá · trừ buổi Free`. */
export function moTaBoTro(ct: string | null, skill: string): string;
/** Tên Case lớp thường: `[Giữa khoá] G+V không đạt` — không `[SOS n]` (T58, K3 §4b). */
export function tenCaseThuong(x: { dot: 'progress' | 'final'; giua: string }): string;
/** MỘT chữ kết quả lớp thường cho mọi nơi (T58): Giữa khoá `2/4 môn đạt` + dong2 `Không đạt: G+V P`; Pre FOU/khi đủ môn có `% tổng`.
 *  KHÔNG bao giờ có chữ "SOS". LT2b thêm hướng Cuối khoá SAU chữ này. */
export function nhanKetQuaThuong(r: { kind: 'progress' | 'final'; ct: string | null; scored: number; required: number;
  failedSkills: string[]; tyLeTong: number | null; khongChiaMon: boolean }): { chinh: string; phu: string | null; pct: string | null; dat: boolean | null };
/** 4 nội dung Báo PH qua TVV (quy định mục II): kết quả · môn khó khăn · nguyên nhân (Mô tả Xác nhận Case, chưa có → "GVBM chưa xác nhận") · phương án + khả năng học lại. */
export function noiDungBaoPh(x: { ketQua: string; monTruot: string[]; nguyenNhan: string[]; boTro: string }): [string, string, string, string];
/** Chữ mốc PA bổ trợ: `đến Cuối khoá · W4 OCT` / `đến Cuối khoá · chưa có lịch`. */
export function mocChuBoTro(followupDue: string | null, homNay: string): string;
```
- `cases.ts`: `export const SYSTEM_KINDS = ['bo_tro'] as const;` → `INTERVENTION_KINDS = [...SUPPORT_KINDS, ...PROPOSAL_KINDS, ...SYSTEM_KINDS]`;
  nhãn `bo_tro: 'Bổ trợ'`. **Không** thêm `bo_tro` vào danh sách chọn của Thêm PA/Thay PA (grep nơi dùng `SUPPORT_KINDS`/`PROPOSAL_KINDS` để
  chọn — giữ nguyên). `MILESTONE_KINDS` thêm `'nop_ke_hoach', 'ke_hoach_duyet', 'ke_hoach_tu_choi'` + nhãn `Nộp kế hoạch bổ trợ` · `Quản lý
  duyệt kế hoạch` · `Quản lý từ chối kế hoạch` (và `MILESTONE_TITLE` ở `CasePanel.tsx:311` — K3-21: không hiện mã máy).
- `sos.ts`: `COORDINATION_KINDS` thêm `'bao_ph_tvv'` **cuối**; nhãn `Báo phụ huynh qua TVV`. Danh sách chọn "+ Thêm việc" của Phối hợp SOS (FT)
  **lọc bỏ** `bao_ph_tvv` (chỉ máy tạo).
- `sosV4.ts`: `CaseV4Input` thêm `boTro?: { choNop: boolean; choDuyet: boolean; hanKeHoach: string | null } | null`; `TrangThaiCaseV4` thêm
  `'cho-ke-hoach' | 'cho-duyet-ke-hoach'`. Trong `trangThaiCaseV4`, **ngay sau** dòng `cho-nguyen-nhan`:
  ```ts
  if (c.boTro?.choDuyet) return { k: 'cho-duyet-ke-hoach', t: 'cho-duyet', chu: 'Chờ Quản lý duyệt · kế hoạch bổ trợ', han: null };
  if (c.boTro?.choNop) return { k: 'cho-ke-hoach', t: c.boTro.hanKeHoach && c.boTro.hanKeHoach < homNay ? 'qua-han' : 'can-lam', chu: 'Chờ nộp kế hoạch bổ trợ', han: c.boTro.hanKeHoach };
  ```
  `viecTiepCuaCase`: `cho-ke-hoach` → `{ chu: 'Nộp kế hoạch bổ trợ', loaiHan: 'ke-hoach-bo-tro', han }`; `cho-duyet-ke-hoach` → `{ chu: 'Chờ Quản lý
  duyệt kế hoạch', loaiHan: null, han: null }`. `mocChuPa` nhận `span === 'den_cuoi_khoa'` → `mocChuBoTro`.
- `yeuCauDuyet.ts`: `LOAI_YEU_CAU` thêm `'ke_hoach_bo_tro'` **cuối**; `ke_hoach_bo_tro: { phanLoai: 'hoc-thuat', nhan: 'Kế hoạch bổ trợ', kieuNut:
  'duyet-tu-choi', hanNgay: 3, hangLoat: false }` (T54, M-05).
- [ ] **Phép kiểm trước** (khối 1): `boTroGiuaKhoa('FOU')` chung 2 · `'BE'`/`'ELE'` 1 · `'PREFOU'`/FT → null; `nhomBoTro` FOU cùng khoá cho G+V và P, BE
  khác khoá theo môn; `moTaBoTro('FOU','writing')` chứa `2 buổi/tuần` + `trừ buổi Free`, BE chứa `W`; `tenCaseThuong` không chứa `SOS`;
  `nhanKetQuaThuong` 5 ca (FOU đủ 4 môn trượt G+V P → `2/4 môn đạt` + `Không đạt: G+V P`; thiếu môn → `2/3 môn đạt (đã chấm)`; Pre FOU `68%`;
  đủ môn có `pct`; **không ca nào chứa "SOS"**); `trangThaiCaseV4` 2 dòng mới + thứ tự (chờ nguyên nhân thắng chờ kế hoạch); `viecTiepCuaCase`
  loại hạn `ke-hoach-bo-tro`; `noiDungBaoPh` đúng 4 phần tử.
- [ ] `npm run check` → commit `PR-LT2a (1): luật thuần lớp thường Giữa khoá — nhóm bổ trợ, tên Case, chữ kết quả không SOS`.

## Task 2 · Migrate `prLt2a.ts` + `schema.sql` (T78, M-03)

**Files:** tạo `server/src/migrate/prLt2a.ts`; `server/src/migrate.ts` (một import + một dòng **cuối** danh sách, sau `migratePrHsm` :477 và mọi
dòng đã có lúc code); `server/src/schema.sql` (hai cột cuối khối `case_interventions` + chỉ mục).
```ts
/** PR-LT2a (M-03, M-05): nhóm PA bổ trợ + hạn nộp kế hoạch. KHÔNG đổi dòng nào (DB reset trước bản chính). Chạy lặp được. */
export function migratePrLt2a(conn: any, applied: string[]) {
  const coCot = (bang: string, cot: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).some((c) => c.name === cot);
  if (!coCot('case_interventions', 'nhom_bo_tro')) { conn.exec('ALTER TABLE case_interventions ADD COLUMN nhom_bo_tro TEXT'); applied.push('PR-LT2a: cột case_interventions.nhom_bo_tro'); }
  if (!coCot('case_interventions', 'han_ke_hoach')) { conn.exec('ALTER TABLE case_interventions ADD COLUMN han_ke_hoach TEXT'); applied.push('PR-LT2a: cột case_interventions.han_ke_hoach'); }
  conn.exec('CREATE INDEX IF NOT EXISTS idx_ci_nhom_bo_tro ON case_interventions(nhom_bo_tro)');
}
```
- [ ] **Phép kiểm trước** (khối 2): chạy `migratePrLt2a` hai lần trên DB thử → lần 2 `applied` rỗng; hai cột + chỉ mục có; DB mới từ `schema.sql` có
  cả hai cột.
- [ ] `npm run check` → commit `PR-LT2a (2): migrate cột nhom_bo_tro, han_ke_hoach`.

## Task 3 · 🛑(S4F) Giữa khoá tự tạo Case + PA Bổ trợ + Báo PH; Cuối khoá thôi sinh tín hiệu (N1, N3, N5, T46, T57, K5-01, K5-64, M-03, Q-F)

**Files:** `server/src/normal/regular.ts:636-757`; `server/src/cases/sos.ts:474-504` (`taoCaseTuDong`), `:136-164` (`upsertCategoryCase`);
tạo `server/src/cases/boTro.ts`; `server/src/cases/sosAuto.ts:27-30` (chú thích), `:125-150` (`announceAutoCase`); `server/src/cases/cases.ts:61-90`
(`caseTitleOf`); `server/src/yThuc/phoiHop.ts`.
- `taoCaseTuDong(p, x)` thêm `x.pa?: 'quy_che' | 'bo_tro'` (mặc định `'quy_che'` — FT **không đổi**, Q15 của PR-SOS). `'bo_tro'`: gọi
  `taoPaBoTro` thay `createPresetPlan`; mốc `opened` note `Giữa khoá tự tạo Case`; `announceAutoCase` nhận `ten` sẵn (`tenCaseThuong`) và `dot:
  'giua-khoa'` → hành trình `Giữa khoá tự tạo Case …`, thông báo GVBM `Case mới: [Giữa khoá] G+V không đạt — {HV}` / `Xác nhận nguyên nhân trước hết
  dd/mm`. `upsertCategoryCase` nhận `sosLevel = null` cho lớp thường (không đổi chữ ký).
- `cases/boTro.ts`:
  ```ts
  /** PA bổ trợ CHỜ (preset=1, planned, confirmed NULL). Người dạy: FOU = GVCN (Q-F) · BE/ELE = GVBM môn (suggestCaseOwner). Nhóm FOU đã có người
   *  dạy (dòng trước) thì dùng lại người đó. han_ke_hoach = han_xac_nhan của Case (M-05). Mốc followup_due = hết CN tuần Cuối khoá (mocCuoiKhoa). */
  export function taoPaBoTro(conn: any, x: { caseId: number; attempt: any; skill: string; ct: string | null; han: string }): number;
  /** Hết CN tuần Cuối khoá: lượt `final` cùng lộ trình (planned_period.week_end) → không có thì `classProgress(classId).finalWeekStart + 6` → null. */
  export function mocCuoiKhoa(cycleId: number | null, classId: number | null): string | null;
  ```
  SQL tạo: `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, needs_approval, preset, moc_quy_che,
  nhom_bo_tro, han_ke_hoach, followup_due, created_at) VALUES (?, 'bo_tro', ?, ?, NULL, 'planned', 0, 1, 'den_cuoi_khoa', ?, ?, ?, ?)`.
- `refreshRegularOutcome` (sau khi S4F merge — giữ nguyên phần S4F): đổi trạng thái bài + `reconcileCorrectedSignals` giữ nguyên; rồi
  `if (a.kind !== 'progress') return r;` (**Cuối khoá: không tín hiệu, không Case, không mốc** — M-01/T70 là việc LT2b; Pre FOU không có progress).
  Nhánh progress: vòng Case đang mở **không ghi `sos_level`** (bỏ cập nhật mức — T58), mốc `passed`/`repeat` truyền `sosLevel: null`. Mỗi môn trượt:
  `raiseSignal({ …, sosLevel: null, silent: true })` → Case đang mở cùng môn → mốc `repeat` + nối tín hiệu (như cũ); **chưa có + tín hiệu chưa nối**
  → `taoCaseTuDong(p, { attempt: a, category, skill, sosLevel: null, detectedAt, band: null, expectation: null, signalId, pa: 'bo_tro' })`.
  Cuối hàm: `dongBoBaoPh(a)` (dưới).
- `phoiHop.ts` thêm `dongBoBaoPh(attempt)`: bài progress có ≥ 1 Case Giữa khoá mở sinh từ bài này → `INSERT … ON CONFLICT DO NOTHING` một dòng
  `(attempt_id, student_id, kind 'bao_ph_tvv', preset 1, status 'pending')` + thông báo **một lần** cho GVCN lớp (`Giữa khoá: {HV} không đạt G+V, P —
  Báo phụ huynh qua TVV`, dedup `bao-ph:{attemptId}`). Không còn Case mở nào của bài (điểm sửa thành đạt) → dòng `preset=1, pending` → `removed`,
  `remove_reason_code = 'system_sos_changed'` (như P03).
- `caseTitleOf` (`cases.ts:81`): nhánh mới khi `origin_kind === 'mock'` và `latest.kind ∈ {progress, final}` → `tenCaseThuong({ dot, giua })`.
  `sosAuto.ts:27-30`: chú thích "Lớp Normal giữ mô hình tín hiệu cũ" → "Giữa khoá lớp thường tự tạo Case + PA Bổ trợ (PR-LT2a)".
- [ ] **Phép kiểm trước** (khối 3, dựng qua `saveRegularScore`): FOU Giữa khoá G+V 11/20, P 12/20, L, R đạt → **2** Case (`sos_level` NULL, tên
  `[Giữa khoá] G+V không đạt`, `han_xac_nhan = hanXacNhan(hôm nay)`), mỗi Case **một** PA `bo_tro` chờ, **cùng** `nhom_bo_tro = gk:{id}`,
  người dạy = GVCN; BE trượt W và S → 2 PA **khác** nhóm, người dạy = GVBM môn; lưu lại điểm lần 2 → không thêm Case/PA (chạy lặp); một dòng
  `bao_ph_tvv` pending; GVBM G+V nhận **một** thông báo Case, GVCN nhận **một** thông báo Báo PH, **không** ai nhận thông báo chứa "SOS"; Cuối khoá
  trượt → **0** tín hiệu `pending`, 0 Case mới; Pre FOU Cuối khoá → 0 tín hiệu; sửa G+V thành đạt → Case G+V tự huỷ (S08 như FT) + PA huỷ; sửa
  cả P thành đạt → dòng Báo PH `removed`. Phép kiểm S4F vẫn xanh.
- [ ] `npm run check` → commit `PR-LT2a (3): Giữa khoá tự tạo Case + PA Bổ trợ + Báo PH qua TVV; Cuối khoá thôi sinh tín hiệu`.

## Task 4 · Xác nhận Case + Nộp kế hoạch + thẻ `ke_hoach_bo_tro` (N2, T54, M-05, Q-F, K3-28, K3 §4b)

**Files:** `server/src/cases/boTro.ts`; `server/src/cases/sosAuto.ts:175-222` (`xacNhanCase`); `server/src/cases/sosState.ts` (:17-36, :78-108);
`server/src/duyet/loaiYeuCau.ts` (phần tử **cuối** mảng :96); `server/src/cases/cases.ts` (`caseDetail` :1408, `skillSupportBoard` :2106);
`server/src/routes/index.ts` (:1580 + một đường mới).
- `sosState.ts`: hằng `YC_KE_HOACH = (iv, tt) => \`EXISTS (SELECT 1 FROM yeu_cau_duyet y_b WHERE y_b.loai = 'ke_hoach_bo_tro' AND y_b.trang_thai
  IN (${tt}) AND y_b.doi_tuong_id = (SELECT MIN(i2.id) FROM case_interventions i2 WHERE i2.nhom_bo_tro = ${iv}.nhom_bo_tro))\``; `sosCaseStateMany`
  thêm `bo_tro_cho_duyet`, `bo_tro_cho_nop`, `han_ke_hoach` (MIN) cho PA `bo_tro` còn `planned` + `SosCaseState.boTro`; `pa_cho` thêm `AND iv.kind !=
  'bo_tro'`. Case có `boTro` truyền vào `trangThaiCaseV4`/`viecTiepCuaCase` ở mọi nơi đang gọi (grep `trangThaiCaseV4(`).
- `boTro.ts`:
  ```ts
  /** Nộp được / ghi kết quả được PA bổ trợ: người dạy (tài khoản) · GVCN lớp (is_core) · GVBM đúng môn (SOS_EDIT) · QL phạm vi (CASE_APPROVE). */
  export function quyenBoTro(p: Principal, iv: { performer_user_id: number | null; case_id: number }): boolean;
  /** Nộp kế hoạch cho CẢ NHÓM của PA `ivId` (N2, K3-28). Điều kiện: ≥ 1 Case trong nhóm đã có nguyên nhân; nhóm chưa có thẻ cho/duyet.
   *  noiDungYeu, keHoach: 15–2000 ký tự. Đổi người dạy (ChonNguoi) → mọi dòng nhóm. Tạo thẻ (hanDuyet 3 ngày) + mốc `nop_ke_hoach` ở mọi Case nhóm. */
  export function nopKeHoachBoTro(p: Principal, ivId: number, input: { noiDungYeu: string; keHoach: string;
    performerSelf?: boolean; performerUserId?: number | null; performerName?: string | null }): any;   // trả caseDetail
  /** Chạy PA bổ trợ của nhóm: dòng `planned` có Case đã có nguyên nhân, Case chưa đóng → started từ hôm nay, action_due = weeklyUpdateDue(hôm nay),
   *  followup_due = COALESCE(followup_due, mocCuoiKhoa), confirmed_by = người nộp, confirmed_at = now; dongBoTrangThaiCase; hành trình. */
  export function chayPaBoTro(conn: any, nhom: string, nguoiNop: number, homNay: string): number;
  ```
- `xacNhanCase` thêm `input.keHoach?: { noiDungYeu; keHoach; performer… }`: Case có PA `bo_tro` **và** người xác nhận có `quyenBoTro` **và**
  nhóm chưa có thẻ → **bắt buộc** gửi kèm (BE/ELE: GVBM là người dạy — nút "Xác nhận Case và gửi kế hoạch"); cùng một `tx`: ghi nguyên nhân rồi
  `nopKeHoachBoTro`. FOU GVBM không phải người dạy → xác nhận **không** kèm kế hoạch. Sau khi ghi nguyên nhân: nhóm đã có thẻ `duyet` →
  `chayPaBoTro` ngay (môn xác nhận muộn tự chạy theo kế hoạch đã duyệt — Câu hỏi 1 (A)).
- Phần tử `DINH_NGHIA_LOAI` (cuối mảng):
  ```ts
  { loai: 'ke_hoach_bo_tro',
    khiDuyet: (p, yc) => { const d = JSON.parse(yc.du_lieu ?? '{}'); chayPaBoTro(db(), d.nhom, yc.nguoi_xin ?? p.userId, demoToday()); /* + mốc ke_hoach_duyet mọi Case nhóm */ },
    khiTuChoi: (p, yc, lyDo) => { /* han_ke_hoach = hanXacNhan(hôm nay) cho dòng planned của nhóm; mốc ke_hoach_tu_choi (lyDo); báo người dạy nếu ≠ người xin */ },
    chet: { sql: `NOT EXISTS (SELECT 1 FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro = (SELECT nhom_bo_tro FROM case_interventions WHERE id = y.doi_tuong_id) AND iv.status = 'planned' AND sc.status != 'done')`, lyDo: 'Các Case của nhóm đã đóng hoặc PA đã huỷ' },
    nap: /* MỘT câu: môn các Case nhóm, người dạy, lớp, mốc Cuối khoá */,
    moTa: (yc, ngu) => ({ tieuDe: `Kế hoạch bổ trợ · ${monNhom}`, phu: 'Giữa khoá', dong: [`Người dạy bổ trợ: ${ten} · ${moTaBoTro}`, `Nội dung yếu: …`, `Kế hoạch: …`],
      neuDuyet: 'PA bổ trợ bắt đầu hôm nay, ghi kết quả hằng tuần hạn hết T2.', mo: duongHoSoHocVien(hv, { caseId }) }) }
  ```
  `du_lieu` = `{ nhom, noiDungYeu, keHoach }`; `ly_do` = 2 dòng đầu kế hoạch. Thông báo duyệt/từ chối cho người xin: hộp đã có (K1-41).
- `caseDetail` + thẻ Case của `skillSupportBoard` thêm `boTro: { nhom, buoiMoiTuan, chung, mon: { caseId, mon, coNguyenNhan, moTa }[], nguoiDay,
  keHoach: { trangThai: 'cho' | 'duyet' | 'tu_choi', noiDungYeu, keHoach, lyDoTuChoi, hanDuyet } | null, hanKeHoach, coTheNop }` — đọc **theo tập**
  (một câu cho mọi nhóm của em), không hỏi từng Case.
- Đường: `POST /cases/:id/xac-nhan` nhận thêm `keHoach`; **mới** `POST /bo-tro/:ivId/ke-hoach` → `nopKeHoachBoTro`.
- [ ] **Phép kiểm trước** (khối 4): BE: GVBM W xác nhận **thiếu** kế hoạch → 400 `Gửi kèm kế hoạch bài giảng…`; đủ → Case `Chờ Quản lý duyệt · kế
  hoạch bổ trợ`, thẻ `cho` hạn 3 ngày, PA vẫn `planned`; QL duyệt → PA `started`, `action_due` hết T2 tuần sau, `followup_due` hết CN tuần Cuối
  khoá, `confirmed_by` = GVBM, Case `Đang làm`. FOU: GVBM G+V xác nhận (không kế hoạch) → Case G+V `Chờ nộp kế hoạch bổ trợ` hạn = `han_ke_hoach`;
  GVCN nộp → **một** thẻ cho cả nhóm; duyệt → PA G+V chạy, PA P (chưa nguyên nhân) vẫn chờ; GVBM P xác nhận sau → PA P chạy ngay. QL từ chối (lý
  do) → nguyên nhân **giữ**, `han_ke_hoach` = hôm nay + 2, việc Nộp kế hoạch trở lại, người dạy nhận thông báo. Nộp lần 2 khi thẻ đang chờ → 400.
  **Phủ định:** GV W1 lớp MB FT 101 gọi `POST /bo-tro/:id/ke-hoach` → **403**; GVBM P của FOU (không phải người dạy, không GVCN) nộp → **403**;
  GVCN (không `request.approve`) duyệt thẻ → **403** (hộp); HTTP `POST /cases/:id/xac-nhan` kèm kế hoạch → 200.
- [ ] `npm run check` → commit `PR-LT2a (4): Xác nhận Case + nộp kế hoạch bổ trợ + thẻ Chờ duyệt Học thuật`.

## Task 5 · PA Bổ trợ đang chạy: ghi kết quả chép cả nhóm, Ghi kết quả cuối, Hoàn thành, Không cần theo dõi, Tạm dừng (M-03, T63, N4, K3-12, K5-08, K5-61)

**Files:** `server/src/cases/cases.ts:2795-3060` (`updateResult`), `:3106` (`closeBlockers`); `server/src/cases/sosAuto.ts:229-265`
(`dienMocQuyChe`), `:290-299` (`datLaiHanCase`), `:368-413` (`guiKhongTheoDoi` — chỉ chữ); `server/src/cases/effectiveness.ts` (chỉ phép kiểm).
- `updateResult` quyền: `if (iv.kind === 'bo_tro') { if (!quyenBoTro(p, iv)) throw forbidden(…) } else require_(… SOS_EDIT …)` (giữ câu lỗi cũ).
- **Chép cả nhóm (M-03):** cuối `tx` của `updateResult`, nếu `iv.nhom_bo_tro` → các dòng **khác** cùng nhóm, `status = 'started'`, Case chưa đóng:
  chèn `case_followups` **cùng** `observed_on, outcome, note, next_step, cycle_no, late, remaining_issue, decision_note` (đổi `case_id`,
  `intervention_id`), rồi áp **cùng** cập nhật trạng thái đã áp cho dòng chính (`action_due` mới / `completed` + `closed_reason`). Viết thành một
  hàm nhỏ `chepKetQuaNhom(conn, iv, followupId, capNhat)` trong `boTro.ts`; `updateResult` chỉ thêm **một** lời gọi. `adjust` (đổi người dạy) cũng
  áp cho cả nhóm. `ask_manager` (Xin ý kiến) chỉ tạo **một** thẻ (dòng chính).
- PA bắt buộc sẵn có: `quyetDinhChoPa(preset)` → Giữ nguyên · Điều chỉnh · Xin hỗ trợ QL (K3-12); tuần chạm mốc Cuối khoá → `laLanGhiCuoi` →
  "Ghi kết quả cuối"; `chanHoanThanh` ẩn Hoàn thành tới khi PA khép — **chỉ kiểm bằng phép kiểm**, không viết lại. `dienMocQuyChe` thêm vế
  `moc_quy_che = 'den_cuoi_khoa' AND followup_due IS NULL` → `mocCuoiKhoa` (một câu cho tập).
- `datLaiHanCase` (Quay lại học): thêm `UPDATE case_interventions SET han_ke_hoach = ? … WHERE kind = 'bo_tro' AND status = 'planned' AND han_ke_hoach
  IS NOT NULL AND case_id IN (Case mở của em)`; vế "PA chờ xác nhận" của câu đầu thêm `AND iv.kind != 'bo_tro'`.
- Không cần theo dõi (N4): luồng S4-5 dùng nguyên (`guiKhongTheoDoi` chỉ cho khi chưa có nguyên nhân); duyệt → huỷ **đúng dòng PA của Case đó**
  (dòng khác cùng nhóm giữ). Chữ lỗi `guiKhongTheoDoi`/`xacNhanCase` bỏ chữ "SOS": `Chỉ Case tự tạo từ kết quả Test…`.
- [ ] **Phép kiểm trước** (khối 5): FOU nhóm 2 PA chạy: GVCN ghi kết quả dòng G+V → dòng P có followup giống hệt + cùng `action_due`; GV không liên
  quan ghi → **403**; tuần Cuối khoá → việc/nhãn "Ghi kết quả cuối", lưu → **cả hai** PA `completed` `het_moc`; Case còn PA bắt buộc chưa khép → Hoàn
  thành bị ẩn + dòng `Hoàn thành được sau khi PA theo quy chế kết thúc (đến Cuối khoá · …)`; khép xong → việc tiếp `Hoàn thành Case`. Không cần theo
  dõi Case P đã duyệt → PA P `cancelled khong_theo_doi`, PA G+V vẫn chờ. Hiệu quả PA: PA bổ trợ `completed` được đếm (nhãn "Bổ trợ"), PA huỷ không
  theo dõi **không** vào mẫu số (T61, K5-55). Tạm dừng → Quay lại → `han_ke_hoach` = hôm nay + 2.
- [ ] `npm run check` → commit `PR-LT2a (5): PA Bổ trợ chạy — ghi kết quả chép cả nhóm, ghi kết quả cuối, Không cần theo dõi`.

## Task 6 · Bỏ mô hình tín hiệu lớp thường (N4, K1-02, K1-03, K1-12, K3-26, K5-01, K5-50, K5-65)

**Files (xoá là chính):** `server/src/worklist/mywork.ts` (:18, :97-102, :116, :135-140, :292-330, :1017); `server/src/routes/index.ts:1450-1471`;
`server/src/cases/signals.ts` (`assignSignal` :454, `dismissSignal` :488; `listSignals` :285 nếu không còn ai gọi); `server/src/cases/cases.ts`
(`fromSignalId` :356, :420, :553, :618); `server/src/students/profile.ts:760`; `server/src/worklist/metrics.ts` (:197-200, :481-483, :515-517);
`shared/domain/metrics.ts` (:67-80, :261-265 + `case-cho-xac-dinh-nguyen-nhan` chữ); `shared/domain/tongQuan.ts` (:32-45, :72-74, :86, :91);
`shared/domain/phanTich.ts` (`LOAI_BO_QUEN` 'bo-qua-van-can-ho-tro'); web: xoá `web/src/modules/worklist/DongTinHieu.tsx`, `SignalList.tsx`; sửa
`WorkList.tsx:6, 72`, `MeetingPage.tsx:9, 217`, `MetricTiles.tsx:38`, `StudentDetailPage.tsx:264-265, 386, 737-790`, `QuickReport.tsx:197, 303`,
`phanTich/DanhSachBoQuen.tsx`, `ui/Han.tsx` (nếu còn nhánh tín hiệu).
- Xoá nhóm `verify` + `pushVerifyItem` + trường `signal` của `WorkItem`; xoá 4 đường `/signals/pending…` (DB reset, không còn máy khách cũ — Q R7);
  xoá `fromSignalId` (K5-65); xoá 3 chỉ số `tin-hieu-cho-xac-minh`, `tin-hieu-qua-han`, `hv-bo-qua-van-can-ho-tro` + dòng `CAN_XU_LY` + mục bỏ quên
  (Q R6). Ô Tổng quan (`MetricTiles`) "Chờ xác minh quá hạn" → **`case-xac-dinh-nguyen-nhan-qua-han`** nhãn `Case chờ nguyên nhân quá hạn` (K1-02 —
  FT + lớp thường, một hàm). Chữ `case-cho-xac-dinh-nguyen-nhan`: "Case tự tạo từ Mock Test FT **hoặc Giữa khoá lớp thường**" (K5-51).
- `GROUP_META.cause.hint`: bỏ "Mock Test có SOS" → `Kết quả Test đã tự tạo Case cho môn/kỹ năng này…`.
- **Giữ:** bảng `case_signals`, `raiseSignal`, `reconcileCorrectedSignals`, nhãn `noted` (chỉ đọc), `duongThongBao` `case_signal` (vô hại).
- [ ] **Phép kiểm trước** (khối 6): quét nguồn — không còn `dismissSignal`, `signals/pending`, `DongTinHieu`, `SignalList`, `fromSignalId`,
  `'verify'` ngoài `tests/`; `/my-work` không có nhóm `verify`; `/metrics/tin-hieu-qua-han` → 404; Tổng quan có ô `Case chờ nguyên nhân quá hạn`
  đếm cả Case Giữa khoá. Phép kiểm cũ về tín hiệu lớp thường (grep `dismiss`, `Bỏ qua`, `tin-hieu`) → **đổi kỳ vọng** sang luật mới, ghi Nhật ký.
- [ ] `npm run check` → commit `PR-LT2a (6): bỏ tín hiệu Tạo Case / Bỏ qua của lớp thường`.

## Task 7 · Việc cần làm + Phối hợp + thông báo (K5-10, K5-11, K1-15, K1-41, K3-39, K2-04, K4-23, T75 phần LT2a)

**Files:** `server/src/worklist/mywork.ts` (:115-160, :485-560, :708-778, :1016); `shared/domain/tongQuan.ts:32-45`; `server/src/yThuc/phoiHop.ts`
(:132-175 `turnsOf`, :198-214); `web/src/modules/yThuc/PhoiHopSosSection.tsx:73`; `shared/domain/hocVienLop.ts:309-340` (`viecTiepCuaEm`);
`server/src/classes/dongHocVien.ts:106`; `server/src/normal/regular.ts:499-545` (`reportRegularNoShow`).
- `WorkGroupKey` thêm `'ke_hoach_bo_tro' | 'phoi_hop'`; `GROUP_META`: `ke_hoach_bo_tro: { label: 'Nộp kế hoạch bổ trợ', hint: 'Giữa khoá: đã xác
  nhận nguyên nhân — nộp kế hoạch bài giảng để Quản lý duyệt, PA bổ trợ bắt đầu khi được duyệt. 3 ngày, tính cả hôm nay.' }`, `phoi_hop: { label:
  'Báo phụ huynh qua TVV', hint: 'Tạo task cho TVV trên Base với 4 nội dung, rồi đánh dấu đã làm.' }`; `order` sau `xac_nhan_pa`;
  `NHOM_CUA_LOAI` cả hai → `case-hoc-thuat`; `LOAI_HAN_CUA_VIEC.ke_hoach_bo_tro = 'ke-hoach-bo-tro'`.
- Dòng `ke_hoach_bo_tro`: **một dòng mỗi nhóm** (MIN id), điều kiện `bo_tro_cho_nop` (Task 4), em đang học; người thấy = `quyenBoTro` & (người dạy
  **hoặc** `tat-ca` với QL); hạn `MIN(han_ke_hoach)`; tiêu đề `Nộp kế hoạch bổ trợ · Giữa khoá · G+V, P · {HV}`; href Ngăn Case `viec: 'ke-hoach'`.
- Dòng `phoi_hop`: `bao_ph_tvv` `pending` của em đang học; GVCN lớp hiện tại (is_core) + QL `tat-ca`; **không hạn** (M-05, urgency `normal`);
  tiêu đề `Báo phụ huynh qua TVV · {HV} · Giữa khoá`; href `…?tab=y-thuc&sub=phoi-hop`.
- `result` (:492-560): dòng PA `bo_tro` gộp **một dòng mỗi nhóm** (giữ MIN id), `reason` thêm `PA chung · G+V, P`; `xac_nhan_pa` (:735-741) thêm
  `AND iv.kind != 'bo_tro'`.
- `turnsOf`: lượt `kind != 'mock'` → không gọi `resultOf` FT; thêm `nhanDot: 'Giữa khoá'`, `ketQua` = `nhanKetQuaThuong(regularResultOf(…))` (đọc
  theo tập), `noiDung` = `noiDungBaoPh(…)` cho dòng `bao_ph_tvv`; `sosLevel` = null. `PhoiHopSosSection.tsx:73` dùng `t.nhanDot ?? MT{n}` + `ketQua`
  (không `sosLabel` khi lượt lớp thường). `myCoordinationLines` chữ `lượt Phối hợp SOS` → `lượt Phối hợp` (K2-39(1) — tab lớp đã tên "Phối hợp").
- `viecTiepCuaEm`: Case có `viecTiep` mới tự hiện (Nộp kế hoạch / Chờ Quản lý duyệt kế hoạch); thêm tham số tuỳ chọn `baoPh: boolean` (GVCN xem) →
  việc `Báo phụ huynh qua TVV` xếp **sau** việc có hạn (#133 "LT2a/b").
- K4-23 (phần LT2a): `reportRegularNoShow` dời môn **lần 2 trở đi** (đếm mốc dời của cùng môn, cùng bài) → thông báo GVCN `{HV} vắng {môn} {Giữa
  khoá} lần {n} — đã dời sang {tuần}` (dedup theo lần). Cuối khoá dời quá tuần cuối khoá → Báo lên: **LT2b**.
- [ ] **Phép kiểm trước** (khối 7): GVCN FOU `/my-work` có `Nộp kế hoạch bổ trợ …` (hạn đúng) và `Báo phụ huynh qua TVV …` (không hạn); nộp xong →
  dòng biến mất; GVBM G+V **không** có dòng Nộp kế hoạch (FOU); nhóm 2 PA đang chạy → **một** dòng Ghi kết quả; không có dòng `Xác nhận PA` cho PA
  bổ trợ; hồ sơ HV `coordinationOfStudent` có thẻ `Giữa khoá · 2/4 môn đạt` + 4 nội dung; GVCN đánh dấu đã làm (ngày, ghi chú) → xong; **Phủ định:**
  GVBM P (không phải GVCN) đánh dấu → **403**. Vắng G+V lần 2 → GVCN nhận thông báo, lần 1 thì không. Đo lại tốc độ (Global Constraints).
- [ ] `npm run check` → commit `PR-LT2a (7): việc Nộp kế hoạch bổ trợ + Báo phụ huynh qua TVV; Phối hợp lớp thường`.

## Task 8 · M1b — em vào lớp thường tự có bài Giữa khoá + Cuối khoá (K2-23; Câu hỏi 2)

**Files:** `server/src/normal/regular.ts:249-361` (`planRegularTests`); `server/src/classes/intake.ts:476-492`; `server/src/classes/luatLoTrinh.ts:251-267,
440-465`.
- Tách vòng tạo bài (:326-355) thành `taoBaiThuong(conn, { cycle, studentId, classId, kinds?, boQuaDaQua, actorUserId })` — `planRegularTests` gọi với
  `boQuaDaQua: false` (QL xếp tay **không đổi**). Hàm mới `taoBaiThuongMacDinh(conn, cycleIds: number[], actorUserId)` (không kiểm quyền — việc hệ
  thống, như `taoMtMacDinh`): mỗi lộ trình lớp thường (`route IS NULL`) → mọi mốc của chương trình (`classProgress`), **bỏ mốc có tuần thi kết thúc
  trước ngày vào lớp** (không tạo bài quá hạn — không có "lịch sử" ở lớp thường). Pre FOU: chỉ Cuối khoá (PF2 — mốc không có thì bỏ).
- Gọi ở 3 chỗ, **sau** INSERT lộ trình: `intake.ts` (lớp thường: đọc lại id lộ trình **một câu** như `luatLoTrinh.ts:455`), `luatLoTrinh.ts:265` (nhánh
  `!denLop.ft`), `luatLoTrinh.ts:~462` (các em sang lớp thường). Chỉ **một dòng** mỗi chỗ.
- [ ] **Phép kiểm trước** (khối 8): thêm 3 HV vào FOU khai giảng hôm nay → mỗi em 2 bài (Giữa khoá tuần 4, Cuối khoá tuần 8) `planned`, 4 môn; Pre FOU
  → 1 bài; thêm HV vào lớp đã qua tuần Giữa khoá → chỉ Cuối khoá; chuyển em FT → FOU → có 2 bài; `planRegularTests` vẫn tạo được bài tuần đã qua (QL);
  `TRAN_GHI_LO` thêm 30 HV giữ trần.
- [ ] `npm run check` → commit `PR-LT2a (8): em vào lớp thường tự có bài Giữa khoá, Cuối khoá (M1b)`.

## Task 9 · T58 — lớp thường không nhãn SOS ở bất kỳ đâu (K3-04, K3-31, K4-21, K4-36, K2-12 phần SOS, K1-19 phần nhãn) — impeccable **`clarify`**

**Files:** `shared/domain/display.ts:185-212` (nhánh `ratio`); `web/src/modules/cham/LuoiThuong.tsx:492-545`; `web/src/modules/students/StudentDetailPage.tsx:595-650`
(`RatioAttempts`); `shared/domain/hanhTrinh.ts:369-381`; `shared/domain/phanTich.ts:187-190` (`COT_KET_QUA` nhãn khung `thuong`);
`web/src/modules/cases/CasePanel.tsx:114, 358`; `web/src/modules/classes/BangDiemLopThuong.tsx` (nếu còn chữ SOS); grep `sosLabel(`/`SOS ${` toàn
`web/src` + `shared/domain` và **đi hết** chỗ có thể nhận lượt lớp thường.
- Mọi chữ kết quả lớp thường qua `nhanKetQuaThuong`: lưới `2/4 môn đạt · trượt R, P` (bỏ `· SOS n` :539-541; màu = đạt/không đạt, không màu SOS);
  hồ sơ bảng Kết quả kiểm tra: cột **`% tổng`** (tầng 1, 16 px, đậm, chỉ khi đủ môn) + `Không đạt: L R`, bỏ chú thích "chính là mức SOS" (:609);
  ghim Hành trình `Giữa · 2/4 môn đạt` / `Cuối · 64%` (không SOS; màu đạt/chưa đạt); Tổng hợp Test khung `thuong`: `SOS 1/2/3` → `1 môn trượt` ·
  `2 môn trượt` · `≥ 3 môn trượt` (thiết kế lại khung thường = LT2b); `CasePanel` không vẽ chip SOS khi `sosLevel` null (Case Giữa khoá).
- `TenCase` (`SkillBoard.tsx:277`): `tenSos` lớp thường `{ dot: 'Giữa khoá', giua }` → chip `Giữa khoá` cùng kiểu chip `MT1`.
- [ ] **Phép kiểm trước** (khối 9): quét — `LuoiThuong.tsx` không còn `sosLabel`; `ketQuaDot(ratio)`, ghim `hanhTrinh` lớp thường, nhãn cột `thuong`,
  `nhanKetQuaThuong` **không** chứa `SOS` (dựng 6 ca: đủ/thiếu môn, đạt/trượt, Pre FOU); FT giữ nguyên `SOS n` (phép kiểm cũ xanh).
- [ ] `npm run check` → commit `PR-LT2a (9): lớp thường không còn nhãn SOS — n/4 môn đạt, % tổng`.

## Task 10 · Web: Case Giữa khoá, Xác nhận Case + kế hoạch, Nộp kế hoạch, Phối hợp, Công việc — impeccable **`clarify`**

**Files:** `web/src/modules/cases/SkillBoard.tsx` (`HangCase` :318, `HangPA` :419); `web/src/modules/yThuc/CaseSosControls.tsx` (`XacNhanCasePanel`
:49); tạo `web/src/modules/cases/NopKeHoachPanel.tsx`; `web/src/modules/cases/CasePanel.tsx` (Ngăn Case: nút chính = việc tiếp); Công việc
(`WorkList.tsx`) dòng mới; `web/src/modules/yThuc/PhoiHopSosSection.tsx` (thẻ Báo PH); `web/src/modules/students/StudentYThucSection.tsx` (tab Phối hợp).
- **HangCase** lớp thường: tên `[Giữa khoá] G+V không đạt` + một `NhanTrangThai` (`Cần làm · Xác nhận nguyên nhân · còn 2 ngày` → `Cần làm · Nộp kế
  hoạch bổ trợ` → `Chờ duyệt · kế hoạch bổ trợ · Quản lý hạn 30/09` (tím) → `Đang làm · Ghi kết quả tuần W1 OCT · hạn hết T2 05/10` → tuần Cuối khoá
  `Ghi kết quả cuối` → `Xong`) — K3 §4b. **HangPA** `bo_tro`: nhãn `PA` + khoá 🔒 SVG + `Bổ trợ 2 buổi/tuần · đến Cuối khoá · W4 OCT · trừ buổi Free`;
  FOU thêm `PA chung · G+V, P` (một dòng chữ phụ, không lặp PA); chờ duyệt: viền đứt tím (K3 §4d).
- **XacNhanCasePanel**: Case có `boTro` và người xem `coTheNop` → thêm khối **Kế hoạch bài giảng** dưới Mô tả: `Nội dung yếu` (điền sẵn từ Mô tả,
  sửa được) · `Kế hoạch` (textarea, gợi ý `Buổi 1…; buổi 2…; trọng tâm; bài tập`) · `Người dạy bổ trợ` (`ChonNguoi`, mặc định theo máy) · dòng chỉ đọc
  `Bổ trợ 1 buổi/tuần đến Cuối khoá (W4 OCT) · trừ buổi Free`; nút chính **`Xác nhận Case và gửi kế hoạch`**. FOU GVBM không phải người dạy: dòng
  `Kế hoạch chung do {GVCN} nộp sau khi có nguyên nhân` thay khối; nút `Xác nhận Case`. Lỗi theo `useLoiForm` (viền đỏ + câu dưới ô).
- **NopKeHoachPanel** (từ việc/HangPA "Nộp kế hoạch", trong `KhungPanel` của Ngăn Case): mỗi môn của nhóm một đoạn `G+V — {Mô tả GVBM}` (môn chưa xác
  nhận: `P — GVBM chưa xác nhận nguyên nhân`, mờ) · `Nội dung yếu` · `Kế hoạch` · `Người dạy bổ trợ` · lý do từ chối lần trước (nếu có, khung vàng) ·
  nút `Gửi Quản lý duyệt`. Toast `Đã gửi Quản lý duyệt — xem ở Yêu cầu của tôi`.
- **Phối hợp** (tab `Ý thức & Phối hợp › Phối hợp` của HV và lớp): thẻ `Giữa khoá · 2/4 môn đạt · Báo PH qua TVV · chưa làm · GVCN` + danh sách **4 nội
  dung** (gập được) + nút `Đánh dấu đã làm` (ngày ≤ hôm nay qua `ONgay`, ghi chú) — dùng panel có sẵn của Phối hợp SOS.
- **Công việc**: hai loại dòng mới hiện như dòng thường (động từ + đối tượng + hạn qua `<Han loai>`), nút `Nộp kế hoạch` / `Đánh dấu đã làm`.
- impeccable `clarify`: rà chữ mọi nút/nhãn/trạng thái/câu lỗi mới theo `TU_DIEN_VA_CHU.md`; ghi quyết định vào Nhật ký.
- [ ] **Phép kiểm trước** (khối 10, quét nguồn như `panelUx3`/`thanhPhanChung`): `NopKeHoachPanel` dùng `KhungPanel` + `useLoiForm`, không `<Modal>`,
  không `type="date"`; chữ `Xác nhận Case và gửi kế hoạch` có trong `CaseSosControls.tsx`; không màu cứng mới (quét `#[0-9a-f]{3,6}`/`slate-` trong file mới).
- [ ] `npm run check` → commit `PR-LT2a (10): giao diện Case Giữa khoá, kế hoạch bổ trợ, Báo phụ huynh qua TVV`.

## Task 11 · Dữ liệu demo (K5 §6 D9, D10 phần Giữa khoá; K1-55) + tài liệu

**Files:** tạo `server/src/seed/lt2aSeed.ts` (gọi ở `seed.ts` sau các demo có sẵn); `server/src/seed/journeys.ts` (thêm 2 lớp **cuối** mảng);
`server/src/seed/build.ts:463-548`; `server/src/seed/seed.ts:280-281`; `web/src/modules/auth/WelcomePage.tsx` (thẻ demo "xem được gì").
- `build.ts`: lượt lớp thường (`isRatio`) **không** gọi `raiseSignal` nữa — `progress` → `refreshRegularOutcome(admin, attemptId)` (đường thật),
  `final` → bỏ qua. Dòng đếm `— trong đó chờ xác minh` (`seed.ts:281`) bỏ.
- Lớp mới (khai giảng để Giữa khoá = tuần trước ngày demo 14/09): **`MB FOU 15`** (17/08; Giữa khoá tuần 4 = W2 SEP; Cuối khoá tuần 8 = W1 OCT; L/R Hà
  GVCN, G+V Khoa, P Trang) · **`MB BE 03`** (10/08; Giữa khoá tuần 5 = W2 SEP; L/R Hà, W Khoa, S Trang, GVCN Hà). Dựng **qua hàm dịch vụ**
  (`commitIntake` → M1b tạo bài; `saveRegularScore`; `xacNhanCase`; `nopKeHoachBoTro`; `duyetYeuCau`/`tuChoiYeuCau`; `updateResult`;
  `confirmCoordination`; `guiKhongTheoDoi`); chỉ lùi ngày bằng SQL khi cần quá hạn (như `duyetSeed.ts`).
  - **G1 (D9)** FOU 15 · em A: trượt G+V, P → G+V đã xác nhận (Khoa), P chưa; GVCN Hà nộp kế hoạch → **thẻ chờ QL Vy**; Báo PH chưa làm.
  - **G2** FOU 15 · em B: trượt R → Hà xác nhận + kế hoạch → QL duyệt → PA đang chạy, 1 lần ghi kết quả; Báo PH đã làm.
  - **G3 (D10)** BE 03 · em C: trượt W → Khoa xác nhận + kế hoạch → duyệt → PA 1 buổi/tuần đang chạy.
  - **G4** BE 03 · em D: trượt S → kế hoạch bị **từ chối** (lý do) → việc `Nộp kế hoạch bổ trợ` của Trang, hạn 3 ngày.
  - **G5** FOU 15 · em E: trượt L, `han_xac_nhan` lùi → **thẻ Báo lên** Case chờ nguyên nhân quá hạn · em F: trượt P → `Không cần theo dõi` chờ QL.
- **Phép kiểm demo** (khối 11, soi ngay sau khi dựng): 0 tín hiệu `pending` của lớp thường; G1–G5 đúng trạng thái; mỗi em trượt có 1 dòng Báo PH.
- Tài liệu: `thiet-ke/TU_DIEN_VA_CHU.md` (chữ mới — Global Constraints); `thiet-ke/HE_GIAO_DIEN.md` §4 (hạn `ke-hoach-bo-tro` = 3 ngày tính cả ngày
  đầu); `CODE_MAP.md` (`lopThuong.ts`, `boTro.ts`, `taoCaseTuDong({pa:'bo_tro'})`, `taoBaiThuongMacDinh`, thẻ `ke_hoach_bo_tro`, `prLt2a.ts`);
  `DEMO.md` (G1–G5); `plan.md` §14 một dòng `30/09 PR-LT2a: Giữa khoá tự tạo Case + PA Bổ trợ (FOU chung 2 buổi/tuần), kế hoạch bài giảng qua Quản lý,
  Báo PH qua TVV, bỏ tín hiệu lớp thường, bỏ nhãn SOS lớp thường, M1b.`; `thiet-ke/SOS_VA_PHOI_HOP_V3.md` dòng đầu: "Q-V3-1 (lớp Normal giữ tín hiệu)
  thay bởi §6.2 N1–N5 (PR-LT2a)".
- [ ] `npm run check` → commit `PR-LT2a (11): demo Giữa khoá G1–G5 + tài liệu`.

## Task 12 · Cổng rebase · impeccable `audit` + `polish` (sáng + tối) · bấm thử (một lần) · mở PR

- [ ] Cổng rebase (`git rebase origin/main`, gỡ theo bảng) → `npm run check`.
- [ ] Máy thử **API 4167 · Vite 5367** trong worktree; `npm run seed` mới. `/impeccable audit` (a11y, tương phản ≥ 4.5:1 **cả sáng và tối**, focus,
  trạng thái rỗng/lỗi, 375 px) trên bảng kỹ năng lớp thường, Xác nhận Case + kế hoạch, NopKeHoachPanel, thẻ Chờ duyệt, tab Phối hợp, lưới lớp thường,
  bảng Kết quả kiểm tra → sửa; `/impeccable polish` một lượt.
- [ ] Bấm thử theo **KIỂM**; ảnh trước (main) / sau 1440 + 375 px, **sáng và tối** → `thiet-ke/anh/pr-lt2a/` (`01-bang-ky-nang`, `02-xac-nhan-ke-hoach`,
  `03-nop-ke-hoach`, `04-the-cho-duyet`, `05-pa-dang-chay`, `06-ghi-ket-qua-cuoi`, `07-phoi-hop`, `08-viec-cua-toi`, `09-luoi-thuong`,
  `10-ket-qua-kiem-tra`, `11-tong-quan`); nhật ký `thiet-ke/anh/pr-lt2a/kiem-sau.log`.
- [ ] `/ponytail-review` → liệt kê chú thích `ponytail:` vào mô tả PR. `npm run check` → push → `gh pr create` tiêu đề `PR-LT2a: Lớp thường · Giữa khoá —
  Case tự tạo, PA Bổ trợ, kế hoạch bài giảng qua Quản lý, Báo PH qua TVV`; thân: bảng mã (N/T/K/M) → ảnh → đạt/không; "tầng 1 của màn này là: trạng
  thái + việc tiếp của Case Giữa khoá" (bảng kỹ năng), "hạn duyệt" (thẻ kế hoạch), "`% tổng`" (bảng Kết quả kiểm tra); mục "Chuyển cho PR khác";
  kết quả audit; lệnh deploy. **Không tự merge.**
- [ ] Tắt 4167/5367, quét `tests/run.js` treo và tắt, dọn file Playwright/Vite tạm.

## KIỂM — kịch bản bấm thử (Task 12, một lần; sáng + tối; 375 px)

| Vai | Làm | Phải thấy |
|---|---|---|
| GVBM Khoa (8) | hồ sơ em G1 › Học thuật | hàng G+V `[Giữa khoá] G+V không đạt`, **không** chữ SOS ở đâu; PA thụt vào `Bổ trợ 2 buổi/tuần · đến Cuối khoá · trừ buổi Free` + `PA chung · G+V, P` |
| GVBM Trang (9) | em G1 hàng P › Xác nhận nguyên nhân | form không có khối kế hoạch, dòng `Kế hoạch chung do {GVCN} nộp…`; lưu → Case P `Chờ Quản lý duyệt · kế hoạch bổ trợ` (thẻ đang chờ) |
| GVCN Hà (7) | Công việc | `Nộp kế hoạch bổ trợ …` (em khác), `Báo phụ huynh qua TVV · …` không hạn; **không** còn `Xác minh SOS` |
| GVCN Hà | em mới trượt › Nộp kế hoạch › để trống › Gửi | viền đỏ + câu dưới ô; gõ đủ → toast `Đã gửi Quản lý duyệt…`; dòng việc biến mất |
| GVBM Khoa | em BE 03 trượt W › Xác nhận nguyên nhân | khối Kế hoạch bài giảng (Nội dung yếu điền sẵn từ Mô tả), nút `Xác nhận Case và gửi kế hoạch`; ≤ 4 lần bấm + gõ |
| QL Vy (2) | Chờ duyệt › Học thuật › thẻ Kế hoạch bổ trợ | `[Học thuật] Kế hoạch bổ trợ · G+V, P · HV · MB FOU 15` / người dạy / nội dung yếu / `Hạn duyệt: còn n ngày` / `Nếu duyệt: …`; Duyệt → hồ sơ: PA `Đang làm · Ghi kết quả tuần … · hạn hết T2 …` |
| QL Vy | thẻ G4 › Từ chối… (lý do) | GV Trang nhận thông báo; Case vẫn có nguyên nhân, hàng `Cần làm · Nộp kế hoạch bổ trợ · còn 3 ngày`; panel hiện lý do từ chối |
| QL Vy | Chờ duyệt › Báo lên | thẻ Case chờ nguyên nhân quá hạn của G5 (lớp thường); **không** thẻ cho em F (đang chờ không theo dõi) |
| GVCN Hà | PA chung G2/G1 › Ghi kết quả | quyết định chỉ Giữ nguyên · Điều chỉnh · Xin hỗ trợ QL; lưu → **cả hai** hàng PA cùng kết quả, Công việc **một** dòng |
| GVCN Hà | tuần Cuối khoá (đổi ngày demo) › Ghi kết quả cuối | tiêu đề `Ghi kết quả cuối`, không khối Quyết định; lưu → PA `Xong`; nút chính Ngăn Case `Hoàn thành Case` |
| GVCN Hà | tab Ý thức & Phối hợp › Phối hợp | thẻ `Giữa khoá · 2/4 môn đạt · Báo PH qua TVV · chưa làm` + 4 nội dung; Đánh dấu đã làm (ngày, ghi chú) → xong |
| GVBM Khoa | Test › lưới MB FOU 15 Giữa khoá | cột Kết quả `2/4 môn đạt · trượt G+V, P`, **không** `SOS n`; hồ sơ bảng Kết quả kiểm tra có cột `% tổng` |
| QL Vy | Tổng quan › khung Lớp thường | ô `Case chờ nguyên nhân quá hạn` (không còn `Chờ xác minh quá hạn`); Tổng hợp Test cột `1 môn trượt`… |
| QL Vy | Thêm 2 HV vào `MB FOU 15` | mỗi em có bài Giữa khoá (đã qua → không tạo) / Cuối khoá ở Kế hoạch Test |
| 375 px + tối | bảng kỹ năng, 3 panel, thẻ Chờ duyệt, tab Phối hợp | không cuộn ngang trang; nút ≥ 44 px; tương phản đọc được; chip `Giữa khoá` không vỡ dòng |
| Bàn phím | Tab qua hàng Case → Xác nhận nguyên nhân → Esc | Esc đóng panel, focus về nút; Enter ở ô cuối = Lưu |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Vì sao / cách cắm |
|---|---|---|
| Cuối khoá: `% tổng` + hướng gợi ý mọi nơi (K2-01, K2-12 cột Hướng, K3-04 hướng, K3-31 `Cuối 64% · Lên BE`, K4-21 Cuối khoá), hộp Kết luận khoá, Chuyển tiếp lớp (K2-25…29, K2-34), Mini Test, PA bổ trợ miễn phí (K3-27), Kết luận BE/ELE → FT (K5-62), thẻ Quyết định Cuối khoá (K5-26) | **PR-LT2b** | thêm hướng **sau** chữ `nhanKetQuaThuong`; kind `bo_tro_mien_phi` cạnh `SYSTEM_KINDS`; nhánh `final` của `refreshRegularOutcome` |
| Báo PH qua TVV khi Cuối khoá < 50% (người làm: QL) | PR-LT2b | dùng kind `bao_ph_tvv` + `noiDungBaoPh` có sẵn |
| Case Giữa khoá còn mở khi em lên lớp (K5-61 phần chuyển lộ trình) | PR-LT2b | Chuyển tiếp lớp là chỗ đổi lộ trình |
| Tổng hợp Test khung Lớp thường đầy đủ (K1-19: Đạt hết · 1 môn trượt · ≥ 2 · Case mở; Cuối khoá 4 bậc + Mini Test) | PR-LT2b | LT2a chỉ đổi nhãn cột |
| Cuối khoá dời quá tuần cuối khoá → Báo lên (K4-23 phần 2); Kết thúc lớp liệt kê việc còn treo (K2-35) | PR-LT2b | |
| KPI tháng dùng `tyLeTong` (K5-56) | PR-GV | hàm đã có (`evaluateRegular`) |
| Tách "PA theo quy chế / PA GV thêm" ở Hiệu quả PA — PA Bổ trợ vào nhóm quy chế (T61) | PR-Pb2 | `preset = 1` đã đúng |
| Báo PH / Nộp kế hoạch ở Tổng quan theo vai; đổi khoá `result` → `ghi_ket_qua_pa` (T75) | PR-VAI | |
| Bỏ dòng "cần hỗ trợ 2 lần Test liền, chưa có Case" (K1-04) | PR-UXF | |

## Lệnh cho buổi deploy (🛑 chỉ chủ sản phẩm chạy, theo `TRIEN_KHAI.md`)

DB **reset** trước bản chính → không có lệnh chuyển dữ liệu, không `chay-thu`. `npm run migrate` trên **DB THỬ** (2 cột + 1 chỉ mục; lần 2 không báo gì) →
bấm KIỂM dòng 1–6 trên nháp → reset / migrate DB CHÍNH → `--prod`. Báo GV: "Giữa khoá trượt nay tự có Case + PA Bổ trợ; nộp kế hoạch bài giảng cho Quản
lý duyệt; GVCN đánh dấu Báo phụ huynh qua TVV".

## Bảng Q — tự quyết (người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | PA Bổ trợ = `kind 'bo_tro'` + `preset = 1` (PA bắt buộc) | dùng lại trọn luồng SOS v4: chờ nguyên nhân, Không cần theo dõi, Báo lên, Ghi kết quả cuối, chặn Hoàn thành — không viết luồng thứ hai |
| Q2 | Trạng thái kế hoạch đọc từ thẻ `yeu_cau_duyet` (không `approval_state`, không bảng kế hoạch riêng); nội dung kế hoạch lưu ở `du_lieu` của thẻ | một nguồn sự thật; K5 §5 để ngỏ "approval_state hoặc thẻ" |
| Q3 | Mọi PA bổ trợ có `nhom_bo_tro`; BE/ELE là nhóm một dòng | một luật cho nộp kế hoạch / ghi kết quả / việc |
| Q4 | Thẻ gắn `doi_tuong_id` = id PA nhỏ nhất của nhóm | bảng thẻ dùng id số; dòng PA không bao giờ bị xoá nên ổn định |
| Q5 | FOU: nộp kế hoạch khi ≥ 1 Case của nhóm có nguyên nhân; duyệt chạy PA các Case đã có nguyên nhân; môn xác nhận sau tự chạy theo kế hoạch đã duyệt | K3-28 "PA bắt đầu khi QL duyệt, không chờ đủ mọi Case" — **Câu hỏi 1** |
| Q6 | QL từ chối kế hoạch → **giữ** nguyên nhân, chỉ nộp lại kế hoạch, hạn mới 3 ngày từ ngày từ chối | K3 §4b ghi "về bước 1", nhưng nguyên nhân không bị từ chối; giống T23 |
| Q7 | Hạn nộp kế hoạch = `han_xac_nhan` của Case (M-05); FOU nhóm = hạn sớm nhất | M-05; một cột `han_ke_hoach` để Tạm dừng / từ chối đặt lại được |
| Q8 | BE/ELE: Xác nhận Case và gửi kế hoạch là **một** form (bắt buộc kèm kế hoạch khi người xác nhận là người dạy) | K3 §4b nút chính "Xác nhận Case và gửi kế hoạch"; bớt một vòng |
| Q9 | Quyền PA bổ trợ (`quyenBoTro`) viết ở `cases/boTro.ts`, không sửa `permissions.ts` | S4F đang sửa `permissions.ts`; `SOS_EDIT` theo kỹ năng chặn GVCN ghi PA môn khác (M12) |
| Q10 | Ghi kết quả nhóm = chép followup sang từng dòng (mỗi Case có lịch sử đủ); Hiệu quả PA đếm theo dòng | M-03; Case đóng được độc lập |
| Q11 | Cuối khoá: `refreshRegularOutcome` không tín hiệu, không Case, không mốc | M-01/T70 thuộc LT2b; tránh việc "Xác minh" treo (K5-01) |
| Q12 | Tên Case lớp thường `[Giữa khoá] G+V không đạt` — **không** `· 58%` | % môn đổi khi sửa điểm; % hiện ở bảng kỹ năng/Kết quả kiểm tra; tránh truy vấn trong `caseTitleOf` |
| Q13 | Báo PH qua TVV = `sos_coordination_actions` kind `bao_ph_tvv`, một dòng mỗi bài Giữa khoá (không theo môn); không hạn | K5-10; M-05 "không hạn"; 4 nội dung gộp một việc |
| Q14 | Xoá hẳn 3 chỉ số tín hiệu, 4 đường `/signals/pending…`, `DongTinHieu`, `SignalList`, `fromSignalId` | DB reset — không còn dữ liệu/máy khách cũ; xoá > giữ |
| Q15 | T58 làm ở LT2a (bỏ SOS + `n/4 môn đạt` + `% tổng` trơn); hướng Cuối khoá ở LT2b | giao việc 30/09 thắng ghi chú #118 "T58 → LT2b" |
| Q16 | Tổng hợp Test khung thường: LT2a chỉ đổi nhãn `SOS 1/2/3` → `1/2/≥ 3 môn trượt` | thiết kế lại khung (K1-19) cần Cuối khoá → LT2b |
| Q17 | M1b ở LT2a; bỏ mốc đã qua lúc em vào lớp; `planRegularTests` của QL không đổi | Giữa khoá là cửa vào luật mới; không sinh nợ điểm giả — **Câu hỏi 2** |
| Q18 | Demo ở lớp mới `MB FOU 15`, `MB BE 03` (Giữa khoá = tuần trước ngày demo) | K5 D9 ghi `MB FOU 12` nhưng lớp đó đang ở tuần Cuối khoá — PA bổ trợ vừa tạo đã tới mốc |
| Q19 | Tệp đính kèm kế hoạch: **không** làm (chỉ chữ) | quy định chỉ đòi "lập kế hoạch, gửi head duyệt"; K3 ghi "tệp tuỳ chọn" — thêm khi có yêu cầu |
| **R1** | Bỏ (DB reset) T70 vế "tín hiệu Giữa khoá đang chờ lúc deploy → thành Case; Cuối khoá → thu hồi" | không còn dữ liệu cũ |
| **R2** | Bỏ K5-66: lệnh chỉ đọc liệt kê tín hiệu + chuyển `pending`/`noted` | như trên |
| **R3** | Bỏ K3-26 phần migrate tín hiệu; K1-03 "migrate tín hiệu đã bỏ qua thành ghi chú lịch sử" | như trên |
| **R4** | Bỏ K5 §5 hàng PR-LT2 "chạy thử in danh sách trên bản chính"; §8 dòng LT2a "tín hiệu cũ → Case" | như trên; migrate chỉ cấu trúc |
| **R5** | Bỏ K5-50 "giữ định nghĩa chỉ số để đọc lịch sử" → xoá | không có lịch sử |
| **R6** | Bỏ K5-65 "route trả 410 kèm câu tiếng Việt" → xoá route | không còn máy khách cũ sau deploy gộp |
| **R7** | Bỏ K5-18 "giữ `case_signal` cho dòng thông báo cũ" như một việc — để nguyên mã (vô hại), không thêm gì | không có thông báo cũ |

## Mâu thuẫn nguồn ↔ mã thật

- **M1** §8 dòng LT2a "Migrate … tín hiệu cũ → Case" ↔ chủ sản phẩm 29/09 reset DB → bỏ (R1–R4).
- **M2** N2 "GVBM … nộp kế hoạch" ↔ Q-F "người dạy bổ trợ (mặc định GVCN) nộp kế hoạch chung" (FOU) → FOU theo Q-F; BE/ELE người dạy mặc định = GVBM nên khớp N2.
- **M3** K3 §4b "QL từ chối kế hoạch → về bước 1" ↔ nguyên nhân không bị từ chối → Q6.
- **M4** #118 "Nhãn lớp thường FOU/BE/ELE thay SOS n → PR-LT2b"; #133 "Nhãn SOS lớp thường ngoài cột Kết quả → LT2b" ↔ giao việc 30/09 giao T58 cho LT2a → Q15.
- **M5** K5-01 đúng: `refreshRegularOutcome` (`regular.ts:636-757`) không phân biệt Giữa/Cuối khoá, `raiseSignal` không `silent` (:723) → Task 3.
- **M6** `taoCaseTuDong` (`sos.ts:474-504`) cứng `createPresetPlan` + chữ "Mock Test" + thông báo `[MT n] … [SOS n]` ↔ "tách hàm để LT2a gọi lại" → thêm tham số `pa`.
- **M7** `sosAuto.ts:27-30` chú thích "Lớp Normal giữ mô hình tín hiệu cũ" ↔ §6.2 → sửa chú thích.
- **M8** `sosCaseStateMany.pa_cho` (`sosState.ts:86`) và nhóm `xac_nhan_pa` (`mywork.ts:735-741`) đếm mọi PA `preset` chờ → sẽ bắt PA bổ trợ → thêm `kind != 'bo_tro'`.
- **M9** `SOS_EDIT` có `ctx.skill` chỉ cho GV đúng kỹ năng (`permissions.ts:371-377`) ↔ Q-F người dạy bổ trợ (GVCN) ghi kết quả PA chung → `quyenBoTro` (Q9).
- **M10** K5 §6 D9 dùng `MB FOU 12` ↔ `journeys.ts:292-295` lớp đó "Tuần 8/8 — đang trong tuần Final Test" → Q18.
- **M11** `build.ts:463-548` dựng tín hiệu `pending`/`noted` cho lớp thường ↔ bỏ tín hiệu → Task 11.
- **M12** `hvlSeed.ts` H2 (Hồ Diệu Linh) có Case G+V, P tạo tay (`reportIssue`) ↔ luật mới tự tạo → giữ (Case tay vẫn hợp lệ), demo luật mới ở G1–G5.
- **M13** §8 bảng cổng: làn A = 4157/5357 ↔ giao việc 30/09 LT2a = 4167/5367 → theo giao việc.
- **M14** M1b (K2-23) chưa có trong §5.2 (dòng "SỬA ĐẶC TẢ") ↔ #133 giao "PR-LT2" → Q17 + Câu hỏi 2.

## Câu cần chủ sản phẩm quyết (kế hoạch chạy theo khuyến nghị nếu chưa có trả lời)

1. **FOU trượt nhiều môn — kế hoạch bổ trợ chung nộp lúc nào?** Mỗi môn một GVBM xác nhận nguyên nhân vào những ngày khác nhau. (A) Người dạy bổ trợ
   (mặc định GVCN) nộp ngay khi **có ≥ 1 môn** đã xác nhận; QL duyệt là PA chạy; môn xác nhận sau tự chạy theo kế hoạch đã duyệt · (B) chờ **đủ mọi
   môn** xác nhận rồi mới nộp (chậm hơn tới 3 ngày, kế hoạch đủ nội dung) · (C) mỗi môn một kế hoạch riêng (trái "2 buổi/tuần chung"). **Khuyến nghị
   (A)** — quy định nhấn mạnh can thiệp sớm; kế hoạch vẫn hiện môn nào chưa xác nhận.
2. **Em vào lớp thường có tự có bài Giữa khoá + Cuối khoá không (M1b)?** Hiện QL phải tự xếp từng lớp ở Kế hoạch Test; FT đã tự có MT1–MT3. (A) Tự tạo
   khi em vào lớp (thêm mới, chuyển vào, chuyển tiếp), bỏ mốc đã qua; QL vẫn đổi tuần được · (B) giữ như nay, QL xếp tay. **Khuyến nghị (A)** — không
   có bài Giữa khoá thì không có Case, và em mới nhập đang bị báo "Thiếu mốc đánh giá tiếp theo".

## Nhật ký

- Mốc B (Task 0): … phép kiểm + … tốc độ (main …). Model thật: …
- S4F / GV / LT2b đã merge lúc bắt đầu? …
- Câu hỏi 1 · Câu hỏi 2 (chủ sản phẩm): …
- Dòng thật lệch kế hoạch: …

## Chủ sản phẩm / planning chốt 30/09 (thắng các chỗ lệch trong kế hoạch)

- **Câu 1 = A (planning chốt):** FOU trượt nhiều môn → nộp kế hoạch chung khi ≥ 1 môn đã xác nhận; môn xác nhận sau chạy theo kế hoạch đã duyệt.
- **Câu 2 = A (planning chốt):** em vào lớp thường tự có bài Giữa khoá và Cuối khoá theo mốc của lớp, bỏ mốc đã qua (M1b).
- Đặc tả §3.1f (30/09): chuyển lớp do **Quản lý** quyết + bàn giao (PR-CT, cùng đợt 5). LT2a không chạm quyền/màn chuyển lớp.
- **Q30-6 mã tuần:** mọi chữ mới trên màn (hạn nộp kế hoạch, tuần bổ trợ, nhãn Giữa khoá) dùng mã tuần `W2 OCT`; ngày chỉ cho hạn cụ thể.
- Planning duyệt bảng Q (Q1–Q19) và R1–R7 như agent đề xuất.
