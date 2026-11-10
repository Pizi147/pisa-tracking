# CAU-HINH-CASE-SOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quản trị tự sửa nhóm nguyên nhân (FT / lớp thường), nhóm PA, việc theo mốc SOS; đổi chỉ áp cho Case / SOS sinh sau; QL xem.

**Architecture:** Một bảng phiên bản append-only `cau_hinh_phien_ban` (3 loại: `nguyen_nhan`, `phuong_an`, `moc_sos`) + một "nguồn cấu hình" trong `shared/` mà hàm cũ (`issuesForTopic`, `INTERVENTION_KIND_LABEL`, `academicSupportFor`, `sosCoordinationFor`…) đọc — máy chủ cấp nguồn từ DB (nhớ theo tiến trình `nhoThamChieu`), web cấp từ phiên đăng nhập. Ngày đầu bản 1–3 = đúng hằng số hiện tại → hành vi không đổi. Case / PA / việc giữ con trỏ phiên bản lúc sinh.

**Tech Stack:** TypeScript, Express, libsql (SQLite / Turso), React + Vite; phép kiểm tự viết (`server/src/tests/run.ts`, `check` / `assert`).

**Spec:** `docs/superpowers/specs/2026-11-11-cau-hinh-case-sos-design.md` (+ mockup `thiet-ke/2026-11-11-cau-hinh-case-sos/`).

## Global Constraints

- Chủ SP duyệt 11/11 (qua PTA): bỏ tab Tutor (không thêm điều hướng); KHÔNG khung Quản trị mới — màn là **tab "Case & SOS" trong `AdminPage` hiện có** (cạnh "Bảng quy đổi"); [XM-2] SOS cũ giữ việc đã bỏ; [XM-4] Tên tiếng Anh không bắt buộc; [XM-5] PA mới có "Có người dạy", "Đếm số buổi".
- Quyền: sửa = `PERMISSIONS.ADMIN_CONFIG`; xem = thêm `laVaiQuanLy`; vai khác 403 (máy chủ kiểm).
- Ngày đầu: mọi phép kiểm hiện có xanh KHÔNG sửa kỳ vọng (bằng chứng không đổi hành vi).
- Mã cố định (không xoá / đổi nhóm / cờ): `*.other`, `other_proposal`, `tutor`, `self_study`, `teaching_adjust`, `extra_homework`, `extra_support`, `bo_tro*` (không ở danh sách), mọi `COORDINATION_KINDS`. Mã mới: `student.<nhánh>.m<n>`, `pa.m<n>`, `viec.m<n>` (n tăng, không dùng lại).
- Giới hạn chữ: tên 1–60, giải thích ≤ 160, tên EN ≤ 60; hạn 1–60 ngày hoặc null; tối thiểu 1–200; số buổi 1–60; tên trùng (bỏ khoảng trắng, không phân biệt hoa thường) trong cùng nhóm → 400.
- Turso: không ai sửa → 0 câu thêm mỗi request; `GET /admin/cau-hinh-case-sos` ≤ 4 câu; phiên đăng nhập 0 câu thêm.
- `ponytail` (full ở máy chủ, lite ở giao diện), `karpathy-guidelines`; không gỡ cache `prepare` (`db.ts`).
- Mỗi bước lưu (một thao tác) = một phiên bản; `tuPhienBan` khác bản đang dùng → 409; giống hệt → không thêm bản.

## Review Focus

1. Case cũ có nhóm đã ẩn → sửa Case đó vẫn lưu được nhóm cũ (không 400) — T4 phép kiểm `CHCS-ANCU`.
2. Điểm sửa làm SOS đổi mức sau khi đổi ô mốc → việc / PA của lượt theo **bản của lượt**, không theo bản mới — T5 `CHCS-LUOT-CU`.
3. Hai Quản trị lưu cùng lúc → người sau 409, không mất bản người trước — T3 `CHCS-409`.
4. Hoàn tác sau khi đã có Case dùng mục mới → Case giữ nhãn (bản chụp), ô chọn hết mục — T3 + T6 `CHCS-HT-CASE`.
5. Bản chính có cột viết hoa / dữ liệu cũ — thử migrate trên bản chép `D:\Github\pisa-mig\mig.sqlite` (chép ra tạm) và đếm: 0 nhãn Case / PA / việc đổi, ô mốc ra đúng bảng cũ — T2 bước bản chép.

---

## PR-A — máy chủ + chỗ đọc (hành vi ngày đầu không đổi)

### Task 1: Nguồn cấu hình trong `shared/`

**Files:** Create `shared/domain/cauHinhCaseSos.ts` (export qua `shared/domain/index.ts`) · Test `server/src/tests/cauHinhCaseSos.tests.ts` (đăng ký ở `run.ts` như `prBandQuyDoi`).

**Interfaces — Produces:**
- Kiểu `MucNguyenNhan`, `NguyenNhan`, `MucPa`, `PhuongAn`, `Viec`, `OMoc`, `MocSos` đúng spec 3.2; `type LoaiCauHinh = 'nguyen_nhan' | 'phuong_an' | 'moc_sos'`; `type BenLop = 'ft' | 'thuong'`.
- `GOC: { nguyen_nhan: NguyenNhan; phuong_an: PhuongAn; moc_sos: MocSos }` dựng từ `ISSUE_TAXONOMY`, `SELF_SERVE_KINDS` / `ACADEMIC_PROPOSAL_KINDS`, `DEFAULT_ACADEMIC_SUPPORT`, `DEFAULT_SOS_COORDINATION`, `HAN_MEETING_CX_NGAY`, `GHI_CHU_MEETING_TOI_THIEU`, số lớp thường hiện có (FOU 2, BE/ELE 1 buổi/tuần; Final 1 / 2 tuần; Pre FOU 2 / 4 buổi; Tutor 10).
- `type BanCauHinh = { id: number; du_lieu: … }`; `datNguonCauHinh(nguon: { hienTai(l): BanCauHinh; theoPb(l, id): BanCauHinh | null })`; `cauHinh(l)`, `cauHinhPb(l, id | null)` (null / không có → hiện tại); mặc định nguồn = GỐC với id 1 / 2 / 3.
- `kiemCauHinh(l, du_lieu): { loi: string; duong: string }[]` (giới hạn Global Constraints, mã cố định còn đủ, "Khác" cuối, ô mốc chỉ trỏ mục chưa ẩn); `thayDoi(l, cu, moi): { viec: string; muc: string; truoc?: string; sau?: string }[]`.
- `benCua(ct: string | null | undefined): BenLop` — chương trình lớp thường (FOU, BE, ELE, PREFOU, liên tục…) → `'thuong'`, còn lại `'ft'`.

- [ ] Step 1: phép kiểm `CHCS-GOC`: với mọi `topic` × `ct` ∈ {null, 'FT…', 'FOU', 'BE', 'ELE', 'PREFOU'}: `issuesForTopic` cũ == mục chưa ẩn của GỐC bên tương ứng (mã + nhãn); 18 ô FT × (PA, việc) == `academicSupportFor` / `sosCoordinationFor` cũ cho MT1–MT5, RF; `kiemCauHinh(l, GOC[l])` rỗng cả 3 loại; `kiemCauHinh` bắt tên trùng, "Khác" bị ẩn, `tutor` bị xoá, ô trỏ mục ẩn.
- [ ] Step 2: chạy `npm run build:server && node dist-server/server/src/tests/run.js` → FAIL (chưa có module).
- [ ] Step 3: viết module.
- [ ] Step 4: chạy lại → PASS. Commit.

### Task 2: Bảng + migrate + trigger tham chiếu

**Files:** Create `server/src/migrate/prCauHinhCaseSos.ts` · Modify `server/src/migrate.ts` (gọi sau `migratePrK316`), `server/src/schema.sql`, `server/src/migrate/prTlNen.ts` (`BANG_THAM_CHIEU` + `'cau_hinh_phien_ban'`) · Test thêm vào `cauHinhCaseSos.tests.ts`.

**Produces:** `DDL_CAU_HINH_PHIEN_BAN` (spec 3.1, `CREATE TABLE IF NOT EXISTS` — QUAN-TRI-V2 có thể tạo trước); `migratePrCauHinhCaseSos(conn, applied)`: tạo bảng nếu thiếu; với mỗi loại chưa có dòng → chèn dòng GỐC (`thay_doi` NULL, `nguoi_id` NULL); `ALTER TABLE case_interventions ADD pb_loai INTEGER`, `sos_coordination_actions ADD pb_moc INTEGER` nếu thiếu; trigger `tg_tc_cau_hinh_phien_ban_*`. `case_issues.taxonomy_version = 1` hiểu là "bản gốc nguyên nhân" khi id gốc ≠ 1 (hàm đọc, Task 3).

- [ ] Step 1: phép kiểm `CHCS-MIG`: DB không bảng → chạy 2 lần → đúng 3 dòng gốc, `du_lieu` == GỐC, có 2 cột mới, có trigger; ghi bảng làm tăng `moc_he_thong['tham-chieu'].so`; DB đã có bảng do loại khác (`han_mac_dinh`) → chỉ thêm 3 dòng.
- [ ] Step 2–4: FAIL → viết → PASS. Commit.
- [ ] Step 5 (bản chép): chép `D:\Github\pisa-mig\mig.sqlite` ra scratchpad, chạy migrate trên bản chép (biến DB của `scripts`/`migrate/run.js`), ghi số dòng / cột vào mô tả PR.

### Task 3: Dịch vụ máy chủ + API

**Files:** Create `server/src/platform/cauHinhCaseSos.ts` · Modify `server/src/routes/index.ts` (cạnh `/admin/bang-quy-doi`), `server/src/tests/tocDoDuong.ts` · Test `cauHinhCaseSos.tests.ts`.

**Consumes:** Task 1 (`datNguonCauHinh`, `kiemCauHinh`, `thayDoi`), Task 2 (bảng).
**Produces:**
- `cauHinhDangDung(l): BanCauHinh` = `nhoThamChieu('chcs:' + l, …)` (1 câu đọc cả 3 loại `WHERE id IN (SELECT MAX(id) … GROUP BY loai)`); `cauHinhTheoId(id)` nhớ theo tiến trình mãi (bản bất biến, `WeakMap` theo kết nối như `mocHeThong`); gọi `datNguonCauHinh` lúc nạp module.
- `xemCauHinh(p)` → `{ nguyen_nhan, phuong_an, moc_sos: { pb, du_lieu }, dangDung: { [ma]: number }, nhatKy: { id, loai, luc, nguoi, thayDoi, khoiPhucTu }[] (30 dòng mới nhất), suaDuoc }`; `dangDung` = 1 câu `UNION ALL` GROUP BY trên `case_issues.taxonomy_code`, `case_interventions.kind`, ô mốc tính trong JS.
- `luuCauHinh(p, l, { du_lieu?, khoiPhucTu?, tuPhienBan })` — như `luuBangQuyDoi` (kiểm, 409, giống hệt → `{ …xem, truoc }`), `writeAudit({ action: 'cau_hinh_case_sos.' + viec, entityType: 'cau_hinh_phien_ban', … })`.
- Xoá mục: chỉ khi `dangDung[ma] === 0` và mã không cố định (400 "Mục đã có Case dùng — chỉ ẩn được").
- Route `GET /admin/cau-hinh-case-sos`, `PUT /admin/cau-hinh-case-sos/:loai` (`requireAuth`, `wrap`).

- [ ] Step 1: phép kiểm `CHCS-QUYEN` (QT lưu được; QL xem được, lưu 403; GV xem 403) · `CHCS-409` (hai lần lưu cùng `tuPhienBan` → lần 2 409, bản 1 còn) · `CHCS-HT` (khôi phục `truoc` → bản mới = bản cũ, nhật ký có `khoiPhucTu`) · `CHCS-GIONG` (lưu giống hệt → không thêm dòng) · `CHCS-XOA` (xoá mục đang dùng → 400) · `CHCS-NHO` (GET hai lần không ghi → câu đọc lần 2 = 0 cho cấu hình).
- [ ] Step 2–4: FAIL → viết → PASS. Thêm trần `tocDoDuong`: `GET /admin/cau-hinh-case-sos` ≤ 4 câu. Commit.

### Task 4: Nhóm nguyên nhân + PA đọc cấu hình

**Files:** Modify `shared/domain/cases.ts` (`issuesForTopic`, `issueLabel`, `issueBranchOf`, `INTERVENTION_KIND_LABEL`, `SELF_SERVE_KINDS`/`ACADEMIC_PROPOSAL_KINDS`/`interventionKindsFor`/`isProposalKind`), `shared/domain/paDongBo.ts` (`coSoBuoi`, `coNguoiDay`), `shared/domain/sosV4.ts` (`LOAI_PA_DOI`), `shared/domain/nhanXet.ts` (`kiemNhomNguyenNhan` nhận `ct`, `giu`), `server/src/cases/cases.ts:667,1002,1447,1546`, `server/src/cases/sosAuto.ts:197,253`, `server/src/cases/nguyenNhanO.ts:51`, `server/src/fasttrack/attempts.ts:2182,2313` · Test `cauHinhCaseSos.tests.ts`.

**Produces:**
- `issuesForTopic(topic, ct?, { giu?: readonly string[]; pb?: number | null } = {})` — mục **chưa ẩn** của bên `benCua(ct)` theo thứ tự cấu hình + mục trong `giu` dù đã ẩn (gắn `an: true`); `IssueNode` thêm `an?: true`.
- `issueLabel(code, pb?, ct?)` — tra bản `pb` (null → hiện tại), bên `ct` trước rồi bên kia; mã lạ → chính mã.
- `INTERVENTION_KIND_LABEL` giữ tên: đối tượng chỉ đọc mà `get` / `ownKeys` tra cấu hình hiện tại (mã hệ thống / mã cũ chỉ đọc giữ nhãn trong mã) — `ponytail:` ghi trần "Proxy để 63 chỗ đọc không đổi; muốn tra theo bản → `tenLoaiPa(kind, pb)`". Thêm `tenLoaiPa(kind, pb?)`.
- Kiểm máy chủ: mã hợp lệ = mục chưa ẩn của **cả hai bên** ∪ mã đang có trên dòng (`giu`); PA mới: `kind` phải là mục chưa ẩn (trừ `SYSTEM_KINDS` như cũ).

- [ ] Step 1: phép kiểm `CHCS-NN` (thêm "Nghe từ khoá" Listening FT → `issuesForTopic('listening','FT')` có, `'BE'` không) · `CHCS-AN` (ẩn → không có ở ô chọn, tạo Case với mã đó 400) · `CHCS-ANCU` (Case cũ đang gắn mã đã ẩn → sửa Case giữ mã đó 200) · `CHCS-PA` (thêm PA `pa.m1` nhóm `can_ql_duyet` → `isProposalKind('pa.m1')` true, tạo PA chờ QL; cờ `soBuoi` → `coSoBuoi` true) · `CHCS-TEN` (đổi tên Tutor → nhãn mới ở `INTERVENTION_KIND_LABEL.tutor`).
- [ ] Step 2–4: FAIL → viết → PASS; chạy cả bộ `npm test` → mọi phép kiểm cũ xanh. Commit.

### Task 5: Mốc SOS đọc cấu hình theo bản của lượt

**Files:** Modify `shared/domain/sos.ts` (`academicSupportFor`, `sosCoordinationFor`, `hanPhoiHop`, `COORDINATION_KIND_LABEL`, thêm `aiLamViec`), `server/src/cases/sosAuto.ts` (`presetFor`, `createPresetPlan` ghi `pb_loai`), `server/src/yThuc/phoiHop.ts` (`syncSosCoordination`, `dongBoBaoPh`, `confirmCoordination` tối thiểu ghi chú), `shared/domain/lopThuong.ts` (`boTroGiuaKhoa`), `shared/domain/cuoiKhoa.ts` (`boTro`), `server/src/normal/kyVong.ts:258`, `server/src/normal/cuoiKhoa.ts:288–306` · Test `cauHinhCaseSos.tests.ts`.

**Produces:**
- `academicSupportFor(attemptNo, sos, route?, pb?)`, `sosCoordinationFor(attemptNo, sos, route?, pb?)` — hàng `mt1…mt5` / `rf` của bản `pb`; mô tả PA giữ chữ cũ ("Tự học · 1 tháng", "Tutor · đến MT{x}", "Tutor · đến lúc thi"), loại khác → `{tên loại} · {đến khi}`.
- `pbCuaLuot(attemptId): number` (máy chủ) = `MIN(pb_moc)` của dòng việc preset của lượt, không có → bản đang dùng; `syncSosCoordination` + `presetFor` dùng nó; dòng mới ghi `pb_moc`.
- `hanPhoiHop(kind, taoLuc, hanChon, pb?)` lấy `hanNgay` của việc trong bản; tối thiểu ghi chú = `toiThieu` của bản.
- `aiLamViec(dong: { kind: string; pb_moc: number | null }): { aiLam: 'gvcn' | 'tvv' | 'cx'; buocTvv: { hanNgay: number; toiThieu: number } | null }` — PHOI-HOP-SOS-V2 đọc hàm này.
- [XM-2] việc đã bỏ khỏi ô: `syncSosCoordination` của lượt dùng bản cũ nên không rút.
- Lớp thường đọc `moc_sos.thuong` (số buổi / tuần, số tuần, Tutor, danh sách việc) — PA tạo ghi `pb_loai`, `so_buoi` như nay.

- [ ] Step 1: phép kiểm `CHCS-MOC` (đổi ô MT1 · SOS 1 bỏ "Trao đổi ngắn với HV" → lượt MT1 mới SOS 1 chỉ có "Trao đổi với gia đình") · `CHCS-LUOT-CU` (lượt sinh trước khi đổi, sửa điểm đổi mức SOS 1 → 2 → việc theo bản cũ, việc chờ không bị rút) · `CHCS-HAN` (đổi hạn Meeting CX 5 → 7 → việc mới hạn +7, việc cũ +5) · `CHCS-THUONG` (đổi BE / ELE 1 → 2 buổi → PA Bổ trợ Progress Test mới 2 buổi / tuần, PA cũ giữ) · `CHCS-AILAM` (`aiLamViec` bản gốc: mọi việc `gvcn`, Meeting CX có `buocTvv`).
- [ ] Step 2–4: FAIL → viết → PASS; `npm test` xanh. Commit.

### Task 6: Case giữ phiên bản nhóm nguyên nhân

**Files:** Modify `server/src/cases/cases.ts:933`, `server/src/cases/nguyenNhanO.ts:63` (ghi `taxonomy_version = cauHinhDangDung('nguyen_nhan').id`), `cases.ts` chỗ trả nhãn (`2311–2346`, `3015–3032`, `caseLop.ts:85`, `students/profile.ts:327,766`, `hanhTrinh.ts:405`, `mywork.ts:961`) dùng `issueLabel(code, taxonomy_version, ct)`.

- [ ] Step 1: phép kiểm `CHCS-HT-CASE` (thêm nhóm → Case dùng → Hoàn tác → `caseDetail` vẫn trả nhãn nhóm đó; đổi tên nhóm → Case cũ trả tên cũ, Case mới tên mới).
- [ ] Step 2–4: FAIL → viết → PASS. Commit.

### Task 7: Phiên đăng nhập mang cấu hình + web cấp nguồn

**Files:** Modify `server/src/routes/index.ts` (payload `/demo/session` + `cauHinh: { nguyen_nhan, phuong_an, moc_sos }` = bản đang dùng, 0 câu thêm nhờ `nhoThamChieu`), `web/src/lib/session.tsx` (sau khi có phiên → `datNguonCauHinh`), `shared/huongDan/tvv.ts:178`, `shared/huongDan/cx.ts:28–30,84` (bỏ số cứng, trỏ "Quản trị › Case & SOS").

- [ ] Step 1: phép kiểm `CHCS-PHIEN` (payload có 3 loại; số câu `/demo/session` không tăng so với trần hiện có ở `tocDoDuong`).
- [ ] Step 2–4. `npm run check` (web tsc). Commit. Mở **PR-A**, mô tả: bảng trước → sau số câu, kết quả bản chép, danh sách `ponytail:`.

## PR-B — màn "Case & SOS" trong `AdminPage`

### Task 8: Tab + thành phần

**Files:** Modify `web/src/modules/platform/AdminPage.tsx` (`TABS` thêm `{ key: 'case-sos', label: 'Case & SOS' }` sau `band`; QL thấy `band`, `case-sos`, `da-xoa`) · Create `web/src/modules/platform/CauHinhCaseSos.tsx` (đầu mục + đoạn chọn danh sách / bên + bảng + nhật ký 320 px), `web/src/modules/platform/cauHinh/BangDanhSach.tsx` (dùng cho nguyên nhân, PA, danh mục việc), `web/src/modules/platform/cauHinh/BangMoc.tsx` (FT + lớp thường + khung phải sửa ô "Cũng áp cho") · dùng lại `Bang`, `HangTab`, `KhungPanel`, `useToast`, `ConfirmDialog`, `useLoiForm`.

**Hành vi (theo mockup K1–K15):** tên bấm thẳng = sửa tại dòng (Enter lưu / Esc thôi); một bấm (Ẩn, Hiện lại, Xoá, ↑ ↓, kéo) lưu ngay + toast "✓ … · áp cho Case mới · Hoàn tác" 10 s (`khoiPhucTu = truoc`); 409 → dải vàng + Tải lại, chữ giữ; lỗi tại dòng; QL không ⠿ / không nút + "Chỉ xem"; 375: hai dòng, chạm → hộp toàn màn. Nhật ký "Xem tất cả ›" = danh sách 30 dòng ngay dưới (khi QUAN-TRI-V2 có `/quan-tri/nhat-ky` thì đổi link).

- [ ] Step 1: bấm thử seed (dev server, `preview_start`): thêm / sửa / ẩn / hiện / xoá / ↑ ↓ / sửa ô mốc + Cũng áp cho / số lớp thường / Hoàn tác / Khôi phục / QL chỉ xem / 375.
- [ ] Step 2: `impeccable audit` + `web-design-guidelines` trên tệp mới; ảnh cặp mockup | web 1440 tối + 375 sáng.
- [ ] Step 3: `npm run check`. Commit. Mở **PR-B**.

### Task 9: Chỗ web tự tra nhãn

**Files:** `web/src/modules/cases/CasePanel.tsx:341,373,495,642,722,739,924,1007,1167`, `ui/SoLieu.tsx:367`, `yThuc/CaseSosControls.tsx:167,222,235`, `classes/BangHoSoLop.tsx:466`, `congViec/HoTroHocVienTab.tsx:699`, `fasttrack/NhanXet.tsx:95,114`, `cases/QuickReport.tsx:438`, `cases/FormPa.tsx:46–94` — dùng nhãn máy chủ trả (`label`) khi có; ô chọn truyền `giu` = mã đang chọn (mục ẩn hiện "đã ẩn").

- [ ] Step 1: bấm thử Case có nhóm đã ẩn / đã đổi tên ở hồ sơ HV, Công việc, Xác nhận Case. Commit vào PR-B.

## Sau cùng

- [ ] `/security-review` + `/code-review high` cho PR-A (quyền, migrate, API); sửa phát hiện thật.
- [ ] Check đầy đủ ở ô check-1/2 (`C:/Users/Admin/AppData/Local/Temp/pisa-slot/CACH-DUNG.txt`).
- [ ] Nhắn PTA Plan số PR-A / PR-B.
