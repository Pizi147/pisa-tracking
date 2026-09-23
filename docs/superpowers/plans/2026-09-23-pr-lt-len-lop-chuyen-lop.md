# PR-LT · Lên lớp, chuyển lớp — Kế hoạch

| Mục | Chốt |
|---|---|
| Mã PR · đợt | **PR-LT** · thêm **trước deploy** (chủ sản phẩm 23/09 chiều) |
| Nhánh · worktree | `pr-lt-len-lop-chuyen-lop` · `.claude/worktrees/pr-lt-len-lop-chuyen-lop` · một PR, không draft, **không tự merge** |
| Cổng thử | API **4307** · Vite **5507** (không 4000/5173, không cổng PR khác) |
| Model khuyến nghị | **Opus 5.5 · High** |
| Phương án B | **Sonnet 5 · High** |
| Người rà | **Fable 5.1** (nếu code bằng Fable thì **Opus 5.5**) — khác model người code |
| Migrate | **CÓ** — bảng `lo_trinh_tiep_theo` + cột `enrollments.end_kind` + cột `classes.finished_at` (Task 2). **PR-Ra cũng có migrate → merge lần lượt**: PR merge sau rebase, chạy lại migrate lặp + phép kiểm migrate |
| Phụ thuộc | **Merge sau PR-Qb #75.** Code trên giả định Qb đã merge: Task 0 kiểm `origin/main` có Qb; **chưa có** → tạo nhánh từ `origin/pr-qb-ho-so-hoc-vien`, làm Task 1–5 (không chạm file Qb), rebase lên `main` ngay khi Qb merge rồi mới làm Task 6–8 |
| File KHÔNG được chạm | **YT2:** `server/src/yThuc/*`, `measures.ts`, `violations.ts`, `StudentYThucSection.tsx`, `YThucAnalysisView.tsx`, `ClassYThucCard.tsx`, `RecordViolationPanel.tsx`, khối `viewer` của `profile.ts` (dòng ~920–930) · **Rc2 #76:** `attempts.ts`, `regular.ts`, `standing.ts`, `skillSchedule.ts`, `planning.ts`, `permissions.ts`, `keHoach/*`, `web/src/modules/cham/*`, `web/src/modules/test/*` · **Pb:** `phanTich/*`, `CaseBoardPage.tsx` · **Ra:** `WorkList.tsx`, `MgmtTasksPage.tsx`, `CongViecPage.tsx`, `MeetingPage.tsx`, `worklist/meeting.ts`, `worklist/signals.ts` · **Form (chỉ dùng):** `PeoplePicker.tsx`, `QuickReport.tsx`, `BangChung.tsx` |

### Chồng file

| File | PR khác | Cách xử lý |
|---|---|---|
| `server/src/routes/index.ts`, `server/src/tests/run.ts`, `shared/domain/index.ts`, `server/src/tests/tocDoDuong.ts` | mọi PR | **Chỉ thêm khối** (routes: khối `// PR-LT` cạnh `/students/:id/transfer`) + sửa 2 route có sẵn (`/students/:id/transfer`, `/classes/:id/transition`). Gỡ xung đột giữ cả hai |
| `server/src/schema.sql`, `server/src/migrate.ts` | **Ra** (migrate, kế hoạch `2026-09-23-pr-ra-cong-viec.md`: `migrateCongViec` cũng gọi ngay sau `migrateDieuChinhPa`) | Hàm migrate riêng `migrateLenLop` gọi cuối `migrate()`. Xung đột ở danh sách gọi: giữ cả hai. Merge lần lượt, PR sau rebase + chạy lại migrate lặp |
| `server/src/worklist/mywork.ts` | **Ra** (sau; Ra chỉ sửa khối `// PR-Ra:`, **không** đụng `WorkGroupKey`/`GROUP_META`/`order`) | Chỉ: (a) khối `2c` "lớp đã hết chương trình" (dòng ~584–620: đếm + `href`); (b) **khối mới `2d`** ngay sau 2c; (c) thêm `next_step` vào `WorkGroupKey`, `GROUP_META`, `order`. Ghi rõ trong thân PR |
| `server/src/students/profile.ts` | **Qb** (merge trước) · **YT2** Task 7 (2 dòng `viewer`) | LT chỉ thêm **một khoá mới** `lopHoc` ở cuối object trả về + 1 import. **Không** sửa khối `viewer` |
| `web/src/modules/students/StudentDetailPage.tsx` | **Qb** (merge trước) | Sau Qb: dòng `tiepTheo: null` (~195), tab Hành trình (~340), `StudentManagePanel` props (~375) |
| `shared/domain/hocVienLop.ts`, `thaoTacDongHocVien.tsx`, `BangHocVienLop.tsx`, `DauTrangLop.tsx`, `ClassOverviewPage.tsx`, `StudentsPage.tsx`, `classes.ts`, `hocVienLop.ts` (server) | Qa/TD (đã merge) · S3 (sau) | Làm trên `main` |
| `web/src/modules/cases/CasePanel.tsx` | Form (đã merge) · Ra (có thể) | Chỉ một khối nhãn `systemCloseLabel` ở đầu panel |
| `shared/domain/tongQuan.ts` | Pa (đã merge) | Một dòng `next_step: 'van-hanh'` |
| `shared/domain/duongHoSo.ts` | Qb (merge trước) · Ra (dùng) | Một nhánh `case 'student'` trong `duongThongBao` (Task 4) |
| `web/src/App.tsx` | mọi PR thêm trang | Một route `/hoc-vien/luu-tru` đặt **trước** `/hoc-vien/:id` (Task 9) |

## Quy trình nhanh (chủ sản phẩm chốt 23/09 — bắt buộc)

- **KHÔNG** dùng `superpowers:subagent-driven-development`; **không** rà từng Task bằng subagent. Tự code từng Task, chạy
  `npm run check` sau mỗi Task (phải xanh, **số phép kiểm không giảm**), rồi commit. Nếu buộc dùng subagent: cùng model,
  **không Haiku**.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375px **một lần** ở Task 10 (ảnh vào `thiet-ke/anh/pr-lt/`).
- Không tự rà code cuối PR (planning rà bằng model khác). Cuối PR: push, mở PR, báo planning.
- Commit ghi **đúng** dòng `Co-Authored-By` của model thật đang chạy.
- Gặp mã lệch hẳn kế hoạch (không chỉ lệch số dòng) → dừng, hỏi planning. `npm run check` treo (chạy chồng) → quét và tắt
  tiến trình `run.js` cũ trước khi chạy lại.
- Không chạy lệnh nào vào Turso, không deploy. Ngày trên màn chỉ qua `ngay` / `tuanLich` / `tuanKhoa` (`hienThiNgay.ts`).
  Chữ cấm: `biện pháp`, `Hãy`, `HS`, `Normal`, `MT{n}` cho lớp thường (khối quét chữ cuối `run.ts`).

## Mục tiêu

1. **Lộ trình tiếp theo** (lớp thường): GVCN/QL ghi cho từng em ở **⋯ dòng HV** (Hồ sơ lớp và Học viên & Lớp) và **⋮ Hồ sơ
   HV**; hiện ở **cột Khoá** (`tiếp theo: BE`) và **dòng dưới tên** Hồ sơ HV; **nhắc hai tuần cuối khoá**: badge hộp lớp
   `{n} HV chưa có lộ trình tiếp theo` + việc GVCN ở Việc cần làm (nhóm Vận hành).
2. **Chuyển tiếp lớp** (cuối khoá, cả lớp, **QL**): giữ ô "Lớp đích cho cả lớp" + sửa từng em + lớp mới chỉ tạo khi xác nhận;
   mỗi em một dòng **Lộ trình tiếp theo · Lớp đích · Cần điền thêm**; em không chuyển **bắt buộc** có hướng + lý do;
   `+ Mở lớp mới` (mã, chương trình, **tuần khai giảng — sửa lỗi**, GVCN); **bước Xác nhận** tóm tắt; việc đỏ / badge
   `Hết khoá · n HV cần xếp lớp tiếp` mở thẳng panel, hết đỏ khi mọi em có hướng; lớp hết HV → **Đã kết thúc**.
3. **Chuyển lớp một em** (giữa khoá, FT + lớp thường, **QL + GVCN**): chi nhánh (**mọi chi nhánh**) → lớp · ngày hiệu lực ·
   lý do bắt buộc (RB-3) · lưu ý bàn giao bắt buộc có `Không có lưu ý`; Case mở tự giao GV cùng môn ở lớp mới (đổi được bằng
   `ChonNguoi`); bài Test chưa làm đi theo em; khác chương trình hỏi thêm. Quyền kiểm ở **lớp nguồn**; danh sách lớp đích là
   đường riêng không lộ học viên lớp khác; sang chi nhánh khác thì QL chi nhánh đích + GVCN lớp đích nhận thông báo. Bỏ ô
   "Người tiếp nhận" gọi `/ref/people` (GVCN bị 403).
4. **Luật lộ trình** §3.9 ở **một chỗ** (`luatDoiLop` + `server/src/classes/luatLoTrinh.ts`); nối S16/S17: sang FT gọi
   `closeCasesOnProgrammeSwitch`; Dừng học / Kết thúc học truyền `dongCaseKhiKetThuc: true`; nhãn `systemCloseLabel` trên Case.
   Nút **Tạm dừng học / Quay lại học / Kết thúc học / Lưu trữ / Bỏ lưu trữ** ở ⋮ Hồ sơ HV.
5. **Lịch sử lớp** đầu tab Hành trình: `Lớp · Thời gian · Kết thúc vì · Kết quả`.
6. **Quyền khớp** giữa menu, máy chủ, việc đỏ (bảng Q2). **Tốc độ Turso:** chuyển cả lớp không có câu SQL nào lặp theo từng em.
7. **Khu Lưu trữ** (chủ sản phẩm chốt 23/09, Q16): lớp đã kết thúc và HV đã lưu trữ rời danh sách chính, xem được ở
   `/hoc-vien/luu-tru` (⋯ góc phải hàng tiêu đề trang Học viên & Lớp → `Lưu trữ · {n} lớp · {m} HV`); hai tab, dòng làm mờ,
   mở hồ sơ ở chế độ chỉ xem; QL `Bỏ lưu trữ` HV; lớp đã kết thúc không mở lại.

## Nguồn

- Đặc tả `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md`: §1 (G-1…G-12), §2, §3.6 dòng cột Khoá,
  §3.7 dòng menu ⋯ + nút Chuyển tiếp lớp, **§3.8 "Lịch sử lớp" + dòng cuối**, **§3.9 toàn bộ + bảng Luật lộ trình**, **§4**
  (7 dòng đầu), §6 dòng LT, **§7 dòng LT** (gồm "Bắt buộc nối từ S1 (#56)").
- Kiểm kê `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md`: **RB-3**, RB-9, S16, S17, câu 4.16, 4.17.
- Mockup `thiet-ke/mockup/11-chuyen-lop.html` (mục 0–4) · `12-ban-do-vi-tri.html` (khu A–D + bảng tra ngược).
- Chữ `thiet-ke/THUAT_NGU_DA_CHOT.md`: g3-111 `Chuyển lớp` · **g3-112 `Chuyển tiếp lớp`** (thay g3-113/114) · g3-115
  `Mở một lớp mới` → mockup `+ Mở lớp mới` · g3-117 `Xác nhận chuyển {n} học viên` · g6-002 `Tạm dừng học` · g6-004
  `Quay lại học` · g6-006 `Kết thúc học` · g6-008 `Đã lưu trữ` · g7-069 `Lớp đích` · g7-070 `Lớp đích cho cả lớp` ·
  g7-073 `Tuần khai giảng lớp mới` · g7-098 → dùng **`Lưu ý bàn giao`** (đặc tả + mockup đứng trên THUAT_NGU).
- **Trả lời của chủ sản phẩm 23/09 chiều** (qua planning) cho Q3 và Q16 — đứng trên mọi nguồn khác ở hai điểm đó.
- Qb "Chuyển cho PR khác" (`origin/pr-qb-ho-so-hoc-vien` kế hoạch dòng 371–373): Lịch sử lớp **trên** hàng nút giai đoạn;
  `khoaLopThuong({ tiepTheo })` ở đầu hồ sơ; `systemCloseLabel`.

**Số dòng** đo trên `origin/pr-qb-ho-so-hoc-vien` @ `64074c8` (đã gồm Form, TD). Mở file xem lại trước khi sửa.

## Luật lộ trình — viết đúng một lần (Task 1, `shared/domain/lenLop.ts`)

```ts
export type LoaiLop = { ma: ProgrammeCode | null; ft: boolean };
export type EndKind = 'len_lop' | 'hoc_lai' | 'sang_ft' | 'chuyen_lop' | 'bao_luu' | 'dung_hoc' | 'ket_thuc';
export type LuatDoiLop = {
  khoa: 'giu' | 'dong-mo';            // giữ lộ trình/khoá đang chạy, hay đóng ('completed') rồi mở cái mới
  dongCase: 'ft' | 'normal' | null;   // tham số `to` của closeCasesOnProgrammeSwitch; null = Case đi theo em
  canMucTieu: boolean;                // sang FT: Mục tiêu band (bắt buộc khi chuyển thật), tháng thi (không bắt buộc)
  endKind: EndKind;                   // ghi vào enrollments.end_kind của dòng cũ → "Kết thúc vì"
};
export function luatDoiLop(tu: LoaiLop, den: LoaiLop, boiCanh: 'giua-khoa' | 'cuoi-khoa'): LuatDoiLop {
  if (tu.ft && den.ft) return { khoa: 'giu', dongCase: null, canMucTieu: false, endKind: 'chuyen_lop' };
  if (tu.ft) return { khoa: 'dong-mo', dongCase: 'normal', canMucTieu: false, endKind: 'chuyen_lop' };   // Q10
  if (den.ft) return { khoa: 'dong-mo', dongCase: 'ft', canMucTieu: true, endKind: 'sang_ft' };          // S17
  if (boiCanh === 'cuoi-khoa') {
    return { khoa: 'dong-mo', dongCase: null, canMucTieu: false, endKind: den.ma === tu.ma ? 'hoc_lai' : 'len_lop' };
  }
  if (den.ma === tu.ma) return { khoa: 'giu', dongCase: null, canMucTieu: false, endKind: 'chuyen_lop' };
  return { khoa: 'dong-mo', dongCase: null, canMucTieu: false, endKind: 'chuyen_lop' };                   // Q11
}
```

Khi `khoa = 'dong-mo'`: khoá/lộ trình đang `active` → `status='completed'`, `ended_at = ngày hiệu lực`, **không** cờ
`dongCaseKhiKetThuc` (Case đi theo em — `systemClose.ts:10-11`); mở lộ trình mới `programme_code = mã lớp đích`,
`route = lớp đích FT ? (route lớp ?? 'LT1') : NULL`, `target_score`/`exam_month` (sang FT), `start_period_id` = tuần khai
giảng lớp đích (lớp thường) hoặc tuần của ngày hiệu lực (FT), `started_at = ngày hiệu lực`. **Không bao giờ để hai lộ
trình `active` cùng lúc** (`hocVienLop.ts:103`, `classes.ts:270` JOIN `cy.status='active'` sẽ nhân đôi dòng).
Khi `dongCase` khác null: gọi `closeCasesOnProgrammeSwitch(p.userId, sid, dongCase, ngày)` **sau** khi đổi lớp.
Dừng học / Kết thúc học: khoá đang chạy → `'abandoned'` **với** `dongCaseKhiKetThuc: true` (hoặc gọi thẳng
`closeCasesBySystem(course_ended, cycleIds)`), rồi `setStudentStatus(…, 'finished')`.

## Bảng Q — quyết định đã tự chốt

| Q | Câu hỏi | Chốt | Lý do |
|---|---|---|---|
| Q1 | Dữ liệu Lộ trình tiếp theo | Bảng mới `lo_trinh_tiep_theo`, **một dòng / em / lớp** (`UNIQUE(student_id, class_id)`); lớp = khoá mà dự định nói "sau lớp này". Hướng: `len_lop · fast_track · hoc_lai · bao_luu · dung_hoc · chua_ro` (bước 1) + `xep_sau` (chỉ bước 2) | §3.9.1 "dữ liệu riêng của em"; em chuyển lớp giữa khoá thì dự định cũ không tự sang lớp mới |
| Q2 | Quyền | **Ghi Lộ trình tiếp theo:** `STUDENT_EDIT` theo HV (GVCN lớp + QL) · **Chuyển lớp một em:** `STUDENT_EDIT` ở **lớp nguồn** (GVCN lớp đó, QL phạm vi lớp đó), **không** đòi quyền ở lớp đích (Q3) · **Chuyển tiếp lớp** (nút, badge bấm, việc đỏ, `GET canEdit`, `POST`): **`CLASS_EDIT`** (QL, QT) · **Tạm dừng / Quay lại / Kết thúc học:** `STUDENT_EDIT` · **Lưu trữ / Bỏ lưu trữ:** `PLAN_WEEK` (như máy chủ S1 `students.ts:279`), chỉ em Đã kết thúc | §4 + "quyền phải khớp"; hiện `applyTransition` dùng `STUDENT_EDIT` (GVCN làm được) trong khi việc đỏ dùng `CLASS_EDIT` |
| Q3 | GVCN chuyển em sang chi nhánh khác? | **CHỦ SẢN PHẨM CHỐT: được, mọi chi nhánh.** GVCN của **lớp nguồn** (hoặc QL phạm vi lớp nguồn) chọn chi nhánh → lớp đích bất kỳ đang hoạt động. Máy chủ kiểm `can(STUDENT_EDIT, { classId: lớp nguồn })`, **bỏ** kiểm ở lớp đích (`students.ts:166`); lớp đích chỉ cần tồn tại, `status='active'`, khác lớp nguồn. Danh sách lớp đích là **đường riêng** `GET /chuyen-lop/lop-dich` — chỉ trả mã lớp, chương trình, chi nhánh, tuần học, tên GVCN; **không** số/tên học viên lớp khác. Sau chuyển: quyền xem đi theo lớp mới (QL chi nhánh đích thấy ngay; GVCN cũ mất quyền xem). Không sửa `permissions.ts` (Rc2) | Chủ sản phẩm trả lời 23/09 chiều |
| Q21 | Thông báo khi chuyển lớp | `notify` (`platform/audit.ts:48`) `kind='transfer_in'`, `entityType='student'`, `entityId=sid`, `dedupKey=transfer:{enrollmentMới}`: **GVCN lớp đích** (mọi lần chuyển, trừ khi chính là người bấm) · **mọi QL có grant chi nhánh đích** (chỉ khi đổi chi nhánh). Tiêu đề `{tên} chuyển vào lớp {mã}` · nội dung `Từ {mã cũ} ({chi nhánh cũ}) · {lý do}`. `duongThongBao` thêm `case 'student'` → `duongHoSoHocVien(entity_id)` | Chủ sản phẩm yêu cầu cho chuyển chi nhánh; GVCN lớp đích cùng chi nhánh cũng cần biết em mới vào |
| Q4 | "Chưa rõ" có tắt nhắc? | **Không.** `chua_ro` lưu ghi chú nhưng **không hiện** "tiếp theo: …" và **vẫn** tính là chưa có lộ trình (badge, việc GVCN, ô đỏ đầu dòng bước 2) | Nếu tắt nhắc thì bấm "Chưa rõ" là cách né việc |
| Q5 | Ai thấy nhắc | Badge hộp lớp: người ghi được (GVCN + QL). Việc cần làm `next_step`: **chỉ GVCN** của lớp (QL đã có việc đỏ Hết khoá) | §4 ghi GVCN; QL không bị trùng hai việc cho cùng lớp |
| Q6 | "Hai tuần cuối khoá" | `currentWeek >= totalWeeks - 1` (W7/8, W8/8; W9/10, W10/10) **và** cả khi lớp đã hết khoá. Việc `next_step` gấp `overdue` khi lớp đã hết khoá, còn lại `normal` | Mockup 12-D "hết khoá W4 SEP" |
| Q7 | Sang FT: bắt buộc gì | Bước 1: Mục tiêu, Tháng thi **không** bắt buộc. Bước 2 và 3 (chuyển thật): **Mục tiêu bắt buộc** (0–9, bước 0.5), Tháng thi không bắt buộc (badge "Thiếu thông tin" có sẵn nhắc sau) | §3.9.1 "điền sau được"; lộ trình FT không mục tiêu thì không tính được kỳ vọng MT1 |
| Q8 | Học lại ở bước 2 | Phải có lớp đích **cùng chương trình**; chưa có lớp → chọn `Xếp sau`. Học lại = đóng khoá cũ, mở khoá mới cùng chương trình | Không có "học lại mà không lớp" — đó chính là Xếp sau |
| Q9 | Em không chuyển | `bao_luu`: lý do + ngày xem lại bắt buộc → `setStudentStatus('inactive')` (enrollment `paused`, khoá giữ). `dung_hoc`: lý do bắt buộc → Kết thúc học (luật ở trên). `xep_sau`: lý do + ngày xem lại bắt buộc → chỉ lưu, em vẫn ở lớp cũ; **qua ngày xem lại** thì em lại tính vào "cần xếp lớp tiếp" | Mockup 11-2 "Lý do Ốm dài ngày · xem lại W2 NOV" |
| Q10 | FT → lớp thường (không có trong bảng §3.9) | Đóng lộ trình FT `completed` (không kết luận), Case FT tự đóng "Chuyển sang lớp thường" (S17 gốc), mở khoá lớp thường. Form nói trước điều này ở bước chọn lớp | S17 kiểm kê ghi đúng chiều này; không để hai lộ trình active |
| Q11 | Lớp thường → lớp thường **khác** chương trình giữa khoá (Xếp lại trình độ) | Đóng khoá cũ, mở khoá mới; Case đi theo em | Bài Giữa/Cuối khoá gắn theo khoá (`regular.ts:257` tìm khoá `active` không `route`) — giữ khoá cũ thì bài BE rơi vào khoá FOU |
| Q12 | Bài Test chưa làm | **Chỉ đi theo em khi GIỮ khoá** (`UPDATE … WHERE cycle_id = khoá giữ AND status='planned'`), tuần giữ nguyên (QL dời ở Kế hoạch Test). Đóng khoá → lượt `planned` của khoá cũ **ở lại lớp cũ**, không huỷ, không xoá; bước Xác nhận nêu "n em còn bài Cuối khoá chưa có điểm" | Hiện `students.ts:202` chuyển **mọi** lượt `planned` → bài Cuối khoá FOU sang lớp BE |
| Q13 | Lưu ý bàn giao | Nhãn **`Lưu ý bàn giao`** + ô tích `Không có lưu ý`. Em còn Case dở: **không** được chọn `Không có lưu ý` (giữ luật S1 `students.ts:177`) — web ẩn ô tích, ghi một dòng vì sao | Đặc tả/mockup đứng trên THUAT_NGU g7-098; luật S1 đã chốt |
| Q14 | Người nhận Case | Mặc định: GV đang dạy **đúng môn** ở lớp đích (`writing1/writing2/writing` → phân công `writing`) → không có thì GVCN lớp đích → không có nữa thì giữ người cũ. Mỗi Case một `ChonNguoi nhom="giao_vien" choNgoai={false}` đổi được. Case sẽ bị hệ thống đóng (S17) không có ô người nhận. Bỏ ô "Người tiếp nhận" chung | §3.9.3; `/ref/people` 403 với GVCN |
| Q15 | Kết luận lộ trình | Chỉ hiện với **FT** (bỏ ở lớp thường). Hành vi giữ nguyên (ghi kết quả, không đổi trạng thái lộ trình) | §4 "chỉ FT"; lộ trình FT khép khi mở lộ trình mới / Kết thúc học |
| Q16 | "Đã kết thúc" của lớp | Ghi thật `classes.status = 'finished'` + `classes.finished_at` khi lớp **lớp thường**, đã hết khoá, không còn enrollment `active` (em Bảo lưu không giữ lớp mở). Gọi sau Chuyển tiếp, Chuyển lớp (lớp cũ), Tạm dừng, Kết thúc học. **CHỦ SẢN PHẨM CHỐT:** lớp đã kết thúc và HV đã lưu trữ **rời danh sách chính** nhưng xem được ở **khu Lưu trữ** `/hoc-vien/luu-tru` (Task 9). Lớp đã kết thúc **không mở lại** (không có nút). Dữ liệu cũ không tự đổi | Chủ sản phẩm trả lời 23/09 chiều; không có tác vụ ngầm (như 4.17) |
| Q22 | Chế độ chỉ xem | **Hồ sơ lớp** `status='finished'`: dải nhạt đầu trang `Lớp đã kết thúc — chỉ xem`; `classOverview.viewer` mọi cờ thao tác `false` (máy chủ, không chỉ ẩn nút) → không nút đầu trang, không ⋮, không ⋯ dòng; tab Học viên liệt kê **mọi em từng học** lớp đó (dòng mới nhất mỗi em, kèm `Kết thúc vì`). **Hồ sơ HV** đã lưu trữ: dải `Học viên đã lưu trữ — chỉ xem`; `lopHoc.quyen` mọi cờ `false` trừ `boLuuTru` (QL); ẩn `+ Case` | Chủ sản phẩm: "mở ở chế độ chỉ đọc" |
| Q17 | Quay lại học vào lớp đã kết thúc | Chặn (400): `Lớp {mã} đã kết thúc. Dùng Chuyển lớp để xếp em vào lớp đang học.` | Tránh enrollment `active` trong lớp đã đóng |
| Q18 | "Kết thúc vì" | Cột mới `enrollments.end_kind` → `Lên lớp · Học lại · Sang Fast Track · Chuyển lớp · Bảo lưu · Dừng học · Kết thúc học`. Dòng cũ không có cột: `transferred` → Chuyển lớp, `completed` → Kết thúc học, `paused` → Tạm dừng học. Kết quả: lớp thường = bài **Cuối khoá** của lớp đó ("Cuối khoá đạt 3/4 môn"), không có thì Giữa khoá; Chuyển lớp = lý do; dòng đang học FT = "Mục tiêu 6.5 · thi 03/2027" | Mockup 11 §4 |
| Q19 | Tóm tắt bước Xác nhận | Tính ở máy khách bằng hàm thuần `tomTatChuyenTiep` (shared) từ dữ liệu `GET /classes/:id/transition` (mỗi em có số Case mở theo chương trình, số bài chưa làm của khoá). Không có "chạy thử" ở máy chủ | Một request, không ghi gì; luật nằm ở shared, phép kiểm được |
| Q20 | Tốc độ `applyTransition` | Đọc **theo lô** (em, enrollment, lộ trình, Case mở, phân công lớp đích, dự định: mỗi thứ một câu); ghi **theo nhóm** (`UPDATE … WHERE id IN (…)`, `INSERT … VALUES (…),(…)` — `journey_events`, `enrollments`, `learning_cycles`, `sos_case_history`, `lo_trinh_tiep_theo`); một audit cho cả lớp. Ngoại lệ được phép: `closeCasesOnProgrammeSwitch` cho từng em **sang FT** (đường S17 duy nhất) | "Không truy vấn theo từng em"; Turso ~20–50 ms/câu, Netlify dừng sau 10 s |

---

## Task 0 · Worktree, nhánh, mốc

- [ ] `git fetch origin`; kiểm Qb đã merge (`git log origin/main --oneline | grep -i "#75\|pr-qb"`). Chưa merge → nhánh từ
  `origin/pr-qb-ho-so-hoc-vien` (xem "Phụ thuộc"), ghi vào Nhật ký.
- [ ] `git worktree add .claude/worktrees/pr-lt-len-lop-chuyen-lop -b pr-lt-len-lop-chuyen-lop origin/main`.
- [ ] Chép file kế hoạch này vào nhánh, `npm ci` nếu cần, `npm run check` → ghi mốc **B**.
- [ ] Commit `PR-LT (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần (shared) + khung phép kiểm

**Files:** tạo `shared/domain/lenLop.ts` + export ở `index.ts`; sửa `shared/domain/hocVienLop.ts`; tạo
`server/src/tests/lenLop.tests.ts` (khung `runLenLopTests(t)` chép cách `hanhTrinh.tests.ts`), đăng ký cuối `run.ts`.

- `HUONG_TIEP`, `HUONG_CHUYEN_TIEP` (thêm `xep_sau`, bỏ `chua_ro`), `nhanHuong(h, { ma, maKe })` dạng đầy đủ cho form
  (`Lên lớp thường tiếp (BE)`, `Chuyển sang Fast Track`, `Học lại FOU`, `Bảo lưu`, `Dừng học`, `Chưa rõ`, `Xếp sau`) và dạng
  ngắn cho bảng (`Lên BE`, `Sang Fast Track`, …). `len_lop` chỉ có khi `NORMAL_LADDER[ma]` có bậc kế (ELE không có).
- `nhanTiepTheo(banGhi, ma)` → `BE` · `Fast Track` · `học lại FOU` · `bảo lưu` · `dừng học`; `chua_ro`/không có → `null` (Q4).
- `luatDoiLop` (khối mã ở trên, **chép đúng**), `EndKind`, `END_KIND_LABEL`, `nhanKetThucVi(endKind, status)` (Q18 dòng cũ).
- `trongHaiTuanCuoi(tuanHienTai, tongTuan, phase)` (Q6).
- `kiemDongChuyenTiep(dong, { maTu })` → câu lỗi hoặc `null`: thiếu hướng; `len_lop/fast_track/hoc_lai` thiếu lớp đích;
  lớp đích sai loại (Lên → chương trình kế, Học lại → cùng chương trình, Sang FT → lớp FT); sang FT thiếu mục tiêu hoặc ngoài
  0–9 / không chia hết 0.5; `bao_luu/xep_sau` thiếu lý do hoặc ngày xem lại; `dung_hoc` thiếu lý do.
- `tomTatChuyenTiep(dongs, ke)` (Q19) → `{ theoLop: [{ ma, n }], sangFt: n, khongChuyen: {bao_luu, dung_hoc, xep_sau},
  caseDiTheo: n, caseDong: n, baiChuaLam: n, cau: string[] }` — `cau` là các dòng in thẳng ở bước Xác nhận
  (vd `2 em lên MB-BE 14 · 1 em sang MB-FT 105 (mở lộ trình FT, mục tiêu 6.5) · 1 em bảo lưu`).
- `hocVienLop.ts`: `khoaLopThuong` thêm tham số `nhacLoTrinh: boolean` → `phu = 'chưa có lộ trình tiếp theo'` khi không có
  `tiepTheo` và `nhacLoTrinh` (thứ tự ưu tiên: tiếp theo › nhắc › kết thúc). `badgeLop`: `het-khoa` dùng số mới
  `canXepLop` (không còn `studentCount`), thêm khoá `chua-lo-trinh` `{n} HV chưa có lộ trình tiếp theo` tone `warn`, đặt
  **sau** `het-khoa`. Cập nhật mọi nơi gọi (`DauTrangLop.tsx:52`, `StudentsPage.tsx:214`) — truyền `0` tạm, Task 3 nối số thật.

**Phép kiểm (≥ 14):** 6 dòng bảng luật (FT→FT, FT→thường, thường→FT, cuối khoá Lên, cuối khoá Học lại, giữa khoá cùng
chương trình, giữa khoá khác chương trình) · `len_lop` không có với ELE · `nhanTiepTheo` 6 hướng · `kiemDongChuyenTiep`
mỗi lỗi một phép · `tomTatChuyenTiep` ví dụ mockup (2 lên, 1 FT, 1 bảo lưu; 1 Case Writing đóng) ra đúng câu mockup ·
`khoaLopThuong` ba nhánh phụ · `badgeLop` thứ tự và cắt 2 badge · `trongHaiTuanCuoi` W6/8 sai, W7/8 đúng, đã hết khoá đúng.
Commit `PR-LT (1): luật thuần lên lớp, chuyển lớp`.

## Task 2 · Migrate + schema

**Files:** `server/src/schema.sql`, `server/src/migrate.ts` (hàm `migrateLenLop`, gọi cuối `migrate()` sau `migrateDieuChinhPa`).

```sql
CREATE TABLE lo_trinh_tiep_theo (
  id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),   -- lớp (khoá) mà dự định nói "sau lớp này"
  huong TEXT NOT NULL,                                -- len_lop|fast_track|hoc_lai|bao_luu|dung_hoc|chua_ro|xep_sau
  lop_du_kien_id INTEGER REFERENCES classes(id),
  muc_tieu REAL,
  thang_thi TEXT,                                     -- 'YYYY-MM'
  ghi_chu TEXT,
  ly_do TEXT,
  ngay_xem_lai TEXT,
  da_ap_dung_luc TEXT,                                -- ngày Chuyển tiếp lớp đã thực hiện dự định này
  updated_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (student_id, class_id)
);
CREATE INDEX idx_ltt_class ON lo_trinh_tiep_theo(class_id);
-- enrollments: thêm end_kind TEXT (xem luatDoiLop) — ghi cạnh end_reason.
-- classes: thêm finished_at TEXT (ngày lớp thành 'finished' — badge "Đã kết thúc {dd/mm/yyyy}" ở khu Lưu trữ).
CREATE INDEX idx_class_status ON classes(status);
```

- Câu CREATE trong `migrateLenLop` **giống hệt** `schema.sql` (như `migrateDieuChinhPa`). Chạy lặp không làm gì. Không điền
  dữ liệu cũ. `applied.push('PR-LT: thêm bảng lo_trinh_tiep_theo, cột enrollments.end_kind, classes.finished_at. Dữ liệu cũ giữ nguyên.')`.
- Ghi chú `classes.status` trong `schema.sql`: `active | finished` (Q16) — chỉ chú thích, không đổi cột.

**Lệnh migrate lặp (ghi kết quả vào Nhật ký):** trên bản sao `data/*.sqlite` dựng từ `main` **trước** PR: `npm run migrate`
hai lần → lần 1 in dòng PR-LT, lần 2 `Không có gì để nâng cấp`. **Phép kiểm (≥ 3):** database dựng bằng `schema.sql` và database
cũ + `migrateLenLop` có **cùng cột, cùng chỉ mục** (`PRAGMA table_info`, `index_list`) · chạy lần hai `applied` rỗng ·
`UNIQUE(student_id, class_id)` chặn dòng trùng.
Commit `PR-LT (2): migrate — bảng lo_trinh_tiep_theo, cột enrollments.end_kind, classes.finished_at`.

## Task 3 · Máy chủ: Lộ trình tiếp theo, số nhắc, việc GVCN, việc đỏ Hết khoá

**Files:** tạo `server/src/classes/loTrinhTiep.ts`; sửa `schedule.ts`, `classes.ts`, `hocVienLop.ts` (server),
`worklist/mywork.ts` (khối ghi ở bảng Chồng file), `shared/domain/tongQuan.ts` (1 dòng), `profile.ts` (1 khoá),
`routes/index.ts`.

- `GET /students/:id/lo-trinh-tiep` (STUDENT_VIEW) → `{ lop: { id, code, ma, maKe, laLopThuong, dangHoc }, banGhi | null,
  lopDuKien: [...] (lớp đang chạy cùng chi nhánh, chương trình kế / FT / cùng chương trình), coTheGhi }`.
- `PUT /students/:id/lo-trinh-tiep` `{ huong, lopDuKienId?, mucTieu?, thangThi?, ghiChu? }`: `STUDENT_EDIT`; 400 khi lớp đang
  học là FT, em không đang học, `huong` ngoài `HUONG_TIEP`, mục tiêu ngoài 0–9, `lopDuKienId` không khớp hướng. Upsert theo
  `(student_id, class_id hiện tại)`, xoá `da_ap_dung_luc`. Ghi `addJourney` (`next_step`, "Ghi lộ trình tiếp theo: …") + audit.
- **Đọc theo lô** (mỗi hàm một câu): `tiepTheoTheoHocVien(classIds)` → `Map<studentId, banGhi>`; `demChuaLoTrinh(classIds)`
  → `Map<classId, n>` (em `active`, không lưu trữ, không có dòng hoặc `huong='chua_ro'`).
- `schedule.ts`: câu đếm trong `classProgress` (dòng ~204) và `classProgressMany` (~237) thêm cột
  `can_xep_lop` = em đang học **trừ** em có dòng `huong='xep_sau' AND ngay_xem_lai > demoToday()` (LEFT JOIN, vẫn một câu).
  `ClassProgress` thêm `canXepLop`; `needsPlacement = phase === 'finished' && canXepLop > 0`; nhãn `label` (~322) dùng `canXepLop`.
- `classes.ts` `listClassSummaries` + `classOverview.summary`: thêm `canXepLop`, `soChuaLoTrinhTiep` (chỉ khi lớp thường
  và `trongHaiTuanCuoi`, còn lại 0), `nhacLoTrinh`. `classRoster` (dòng 262): mỗi dòng thêm `tiepTheo: string | null`,
  `chuaLoTrinh: boolean` (một câu `tiepTheoTheoHocVien([classId])`). `classOverview.viewer` thêm
  `coTheChuyenTiep: can(CLASS_EDIT)` (= `canEditProgress`, đặt tên rõ để menu/badge/việc đỏ dùng chung).
- `profile.ts`: thêm khoá `lopHoc: lopHocCua(p, studentId, current)` ở **cuối** object (hàm đặt trong `loTrinhTiep.ts`) →
  `{ tiepTheo, nhacLoTrinh, chiXem, quyen: { ghiLoTrinhTiep, chuyenLop, tamDung, quayLai, ketThuc, luuTru, boLuuTru } }`.
  `chuyenLop` = `STUDENT_EDIT` ở **lớp đang học** và em đang học (Q3); `luuTru` = `PLAN_WEEK` + `status='finished'` + chưa lưu
  trữ; `chiXem` = em đã lưu trữ → mọi cờ `false` trừ `boLuuTru` (Q22).
- `mywork.ts` khối 2c (placement): đếm `pr.canXepLop` thay `activeStudents`; `href: /hoc-vien/lop/{id}?viec=chuyen-tiep`;
  `reason` `{n} học viên chưa có hướng học tiếp`. **Khối 2d mới** `next_step`: lớp thường mà người xem là **GVCN** (`ta.is_core
  = 1`, còn hiệu lực) — một câu lấy lớp, `classProgressMany`, `demChuaLoTrinh`; chỉ lớp `trongHaiTuanCuoi` và n > 0. Dòng:
  `studentName: Lớp {mã}`, `contextLabel: hết khoá {tuanLich(tuần cuối)}`, `reason: {n} HV chưa có lộ trình tiếp theo`,
  `actionLabel: Ghi lộ trình tiếp theo`, `href: /hoc-vien?open={classId}`, `urgency` theo Q6, `mine: true`. `GROUP_META.next_step`
  = `{ label: 'Chưa có lộ trình tiếp theo', hint: 'Lớp sắp hết khoá. Ghi cho từng em sẽ học gì tiếp, để Quản lý xếp lớp.',
  overdue: 'Lớp đã hết khoá' }`; `order` đặt ngay sau `placement`. `tongQuan.ts`: `next_step: 'van-hanh'`.
- `routes/index.ts`: hai route trên; thêm vào `tocDoDuong.ts` `/students/{hv}/lo-trinh-tiep` (QL, QT, GVCN).

**Phép kiểm (≥ 10):** GVCN lớp thường ghi được; GVBM 403; em lớp FT → 400; `chua_ro` không có `tiepTheo` và vẫn đếm nhắc ·
roster trả `tiepTheo: 'BE'` sau khi ghi `len_lop` · `soChuaLoTrinhTiep` = 0 ở W6/8, = n ở W7/8 (dời `demoToday` như các phép
kiểm lịch khác) · việc `next_step` có với GVCN, **không** có với GVBM và QL · `xep_sau` ngày xem lại tương lai → `canXepLop`
giảm và việc đỏ/badge hết khi mọi em có hướng; qua ngày xem lại → đỏ lại · `profile.lopHoc.quyen` GVCN: `luuTru` false,
QL: true với em đã kết thúc · đếm câu SQL `GET /classes/:id/roster` không tăng theo số em (bộ đếm TD).
Commit `PR-LT (3): máy chủ Lộ trình tiếp theo, nhắc hai tuần cuối, việc đỏ Hết khoá theo hướng`.

## Task 4 · Máy chủ: luật lộ trình + Chuyển lớp một em + trạng thái học viên

**Files:** tạo `server/src/classes/luatLoTrinh.ts`; sửa `students/students.ts`, `routes/index.ts`.

- `luatLoTrinh.ts`:
  - `coTheChuyenLop(p, sid)` → lớp nguồn (enrollment `active`) + `can(STUDENT_EDIT, { classId: lớp nguồn })` (Q3).
    `lopDichHopLe(conn, toClassId, lopNguon)` → lớp tồn tại, `status='active'`, khác lớp nguồn. **Không** kiểm quyền ở lớp đích.
  - `lopDichChoChuyen(p, sid)` (route riêng, dưới) — **một câu**: mọi lớp `active` mọi chi nhánh + chương trình + chi nhánh +
    GVCN (LEFT JOIN `teacher_assignments is_core=1`) + tuần học (`classProgressMany`). Không cột học viên nào.
  - `thongBaoChuyenVao(conn, dong)` (Q21) — một câu lấy GVCN lớp đích + QL có grant chi nhánh đích; `notify` từng người (vài người).
  - `apDungDoiLop(conn, p, dongs[], boiCanh)` — **dùng chung** cho một em và cả lớp. Mỗi dòng `{ sid, tuEnrollment, tuLop,
    denLop, ngay, lyDo, luuY, mucTieu?, thangThi?, nguoiNhan? }`. Theo `luatDoiLop`: đóng enrollment cũ (`transferred`,
    `ended_at`, `end_reason`, `end_kind`) · thêm enrollment mới · `students.branch_id` · đóng/mở lộ trình · chuyển lượt
    `planned` **chỉ** khi giữ khoá (Q12) · gán người nhận Case (Q14, kèm `sos_case_history` như `students.ts:208-219`) ·
    `closeCasesOnProgrammeSwitch` khi `dongCase` · `journey_events` (`transfer` "Chuyển sang lớp {mã}" hoặc `promote` "Lên lớp
    {mã}"). Tất cả ghi theo nhóm (Q20). Trả `{ done, failed }`.
  - `nguoiNhanGoiY(conn, caseRows, denLopIds)` — một câu phân công của mọi lớp đích (Q14).
  - `dongLopNeuHet(conn, classIds, ngay)` (Q16) — một câu `UPDATE classes SET status='finished' WHERE id IN (…) AND
    NOT EXISTS (enrollment active)` sau khi kiểm `phase === 'finished'` bằng `classProgressMany`; audit `class.finished`.
- `transferStudent` (dòng 157): giữ chữ ký cũ + tham số mới `{ mucTieu, thangThi, nguoiNhan }`; thay **cả hai** `require_`
  (dòng 165-166) bằng `coTheChuyenLop` + `lopDichHopLe` (Q3); giữ luật lý do + lưu ý (S1, Q13); giao việc cho
  `apDungDoiLop(…, 'giua-khoa')`; gọi `thongBaoChuyenVao`, `dongLopNeuHet([lớp cũ])`. `shared/domain/duongHoSo.ts`
  `duongThongBao`: thêm `case 'student': return duongHoSoHocVien(n.entity_id)`. Lớp đích FT từ lớp thường thiếu mục tiêu → 400 `Chuyển sang Fast Track cần Mục tiêu band.`
  `receiverUserId` cũ vẫn nhận (áp cho mọi Case) để phép kiểm cũ không vỡ; `nguoiNhan` thắng nếu có.
- `GET /chuyen-lop/lop-dich?studentId=` (`coTheChuyenLop`, không thì 403) → `{ chiNhanh: [{ id, name }] (mọi chi nhánh đang
  hoạt động), lop: [{ id, code, chiNhanhId, ma, ft, tenChuongTrinh, tuan: 'W3/8' | null, gvcn: string | null }] }` — **không**
  số hay tên học viên (Q3).
- `GET /students/:id/chuyen-lop?toClassId=` (`coTheChuyenLop`) → `{ hienTai: { lop, ma, ft, chiNhanhId }, caseMo: [{ id, title,
  category, owner, seDong: boolean, goiY: { id, ten } | null }], luat: LuatDoiLop | null, canLuuY: boolean, doiChiNhanh }`.
  `luat`/`goiY`/`seDong`/`doiChiNhanh` chỉ khi có `toClassId` (lớp đích phải qua `lopDichHopLe`). Đọc theo lô, số câu cố định.
- `POST /students/:id/transfer` (dòng 1479): nhận thêm `mucTieu`, `thangThi`, `nguoiNhan` (`{ [caseId]: userId }`).
- `setStudentStatus` (dòng 238): tham số `endKind?: 'bao_luu' | 'dung_hoc' | 'ket_thuc'`; `finished` → khoá đang chạy
  `abandoned` + đóng Case (luật ở trên), `end_kind`; `active` từ `inactive` mà lớp của enrollment `paused` đã `finished` → 400 Q17;
  gọi `dongLopNeuHet` sau `inactive`/`finished`. Route `/students/:id/status` nhận `endKind`.
- `tocDoDuong.ts`: `/chuyen-lop/lop-dich?studentId={hv}`, `/students/{hv}/chuyen-lop` và
  `/students/{hv}/chuyen-lop?toClassId={lopFT}` (QL, QT, GVCN; GVBM 403).

**Phép kiểm (≥ 14), mỗi dòng bảng luật một phép, kiểm dữ liệu thật:** FT→FT: lộ trình **cùng id**, Case giữ, người nhận =
GV cùng môn lớp mới · lớp thường cùng khoá: khoá giữ, lượt `planned` sang lớp mới · thường→FT: khoá cũ `completed`, lộ trình
FT mới `active` có mục tiêu, Case lớp thường `system_close_reason='moved_to_ft'`, **đúng một** lộ trình `active` · FT→thường:
Case FT `moved_to_normal` · thường khác chương trình: khoá mới đúng mã, Case **mở** · lượt `planned` của khoá đã đóng **ở lại**
lớp cũ · **Q3 (chủ sản phẩm):** GVCN lớp MB chuyển em sang lớp CP → thành công; ngay sau đó QL CP `can(STUDENT_VIEW)` em = true
và `GET /students/:id` 200; GVCN MB xem em → 403; GVCN của một lớp **khác** (không phải lớp nguồn) chuyển em → 403; GVBM lớp
nguồn → 403 · `GET /chuyen-lop/lop-dich` của GVCN MB có lớp CP, và JSON **không** có khoá nào về học viên (`soHv`,
`students`…) · **Q21:** chuyển MB → CP tạo thông báo cho GVCN lớp CP và mọi QL chi nhánh CP (không cho QL MB), `duongThongBao`
ra `/hoc-vien/{id}`; chuyển cùng chi nhánh chỉ GVCN lớp đích nhận; chạy lại cùng lệnh không nhân đôi (dedup) · thiếu lý do / thiếu lưu ý / `Không có lưu ý`
khi còn Case → 400 (giữ các phép S1) · `end_kind` đúng · lớp cũ hết khoá, em cuối đi → `finished`; lớp chưa hết khoá → giữ
`active` · Kết thúc học: khoá `abandoned`, Case `course_ended`, status `finished` · Quay lại học vào lớp đã kết thúc → 400 ·
GVCN (`/ref/nguoi`) không bị 403 ở luồng này (không còn gọi `/ref/people`).
Commit `PR-LT (4): luật lộ trình một chỗ, chuyển lớp một em mọi chi nhánh, thông báo nơi nhận, trạng thái học viên (S16, S17, RB-3)`.

## Task 5 · Máy chủ: Chuyển tiếp lớp

**Files:** `server/src/classes/transition.ts` (viết lại phần lớn), `routes/index.ts`, `tocDoDuong.ts`.

- `transitionPlan` (dòng 45): `canEdit = can(CLASS_EDIT)`; mỗi em thêm `loTrinhTiep` (điền sẵn), `caseMo: { tong, seDongNeuSangFt }`,
  `baiChuaLam` (lượt `planned` của khoá đang chạy); `options` thêm **cùng chương trình** (Học lại) cạnh bậc kế + FT;
  `candidates` gồm lớp cùng chi nhánh của mọi chương trình trong `options` (+ `ft`, `tuan`), lọc "chưa quá nửa" bằng
  **`classProgressMany`** (bỏ `classProgress` trong vòng lặp dòng 87 — N+1); `suggestClassCode` một câu `LIKE` thay vòng 99
  câu; `teachers` của chi nhánh (cho ô GVCN lớp mới — một câu); `tuanKetThuc` của lớp.
- `applyTransition` (dòng 168): `require_(CLASS_EDIT)`; input mới `{ fromClassId, effectiveDate, newClass?: { code, programme,
  startPeriodId, gvcnUserId? }, dongs: [{ studentId, huong, toClassId?, toNewClass?, mucTieu?, thangThi?, lyDo?, ngayXemLai?,
  luuY? }] }`. **Sửa lỗi tuần khai giảng:** nhận `startPeriodId` (web đang gửi — `TransitionPanel.tsx:64`), vẫn nhận
  `startWeekStart` cũ. `createClass` rồi gán GVCN (`teacher_assignments` `is_core=1`, dùng lại hàm phân công có sẵn nếu có một
  hàm nhận một dòng; không thì một `INSERT`). Kiểm từng dòng bằng `kiemDongChuyenTiep` **trước**; dòng lỗi vào `failed`, dòng
  đúng chạy tiếp (giữ tính chất "một dòng lỗi không hỏng cả lô" — `run.ts:4660`). Nhóm theo hướng:
  `len_lop/hoc_lai/fast_track` → `apDungDoiLop(…, 'cuoi-khoa')`; `bao_luu` → trạng thái `inactive` theo lô; `dung_hoc` →
  Kết thúc học theo lô; `xep_sau` → chỉ upsert dự định. Upsert `lo_trinh_tiep_theo` cho mọi dòng (`da_ap_dung_luc` với dòng đã
  chuyển). Cuối: `dongLopNeuHet([fromClassId])`, **một** audit `class.transition` (`after`: số theo hướng, lớp mới).
  Trả `{ newClass, done, failed, lopCuDaKetThuc }`.
- `moves` cũ: vẫn nhận (map sang `dongs` với `huong` suy từ `luatDoiLop`) để phép kiểm cũ chạy; web mới chỉ gửi `dongs`.
- `tocDoDuong.ts`: `/classes/{lopThuong}/transition` (QL, QT, GVCN_THUONG — GVCN đọc được, `canEdit=false`).

**Phép kiểm (≥ 10):** tuần khai giảng lớp mới **đúng tuần gửi lên** (lỗi §6) · GVCN lớp → 403 `POST` · mockup 11-2 dựng đủ:
2 Lên BE (khoá FOU `completed`, khoá BE `active`, Case đi theo, người nhận GV cùng môn lớp BE) · 1 sang FT (lộ trình FT mục
tiêu 6.5, Case Writing đóng `moved_to_ft`) · 1 Bảo lưu (`inactive`, enrollment `paused`) → lớp cũ `finished`, việc đỏ biến
mất · Xếp sau với ngày xem lại tương lai → lớp **chưa** `finished`, việc đỏ hết · dòng thiếu lý do vào `failed`, các dòng
khác xong · GVCN lớp mới được gán · **đếm câu SQL**: chuyển tiếp lớp 4 em và lớp 8 em (nhân dữ liệu như `tocDo.run.ts`) chênh
nhau **chỉ** phần `closeCasesOnProgrammeSwitch` của em sang FT (đặt cả hai lô không có em sang FT → chênh ≤ 2 câu); trần tuyệt
đối ghi vào phép kiểm sau khi đo · `transitionPlan` không ghi gì, số câu không tăng theo số lớp ứng viên.
Commit `PR-LT (5): Chuyển tiếp lớp theo hướng từng em, sửa tuần khai giảng, quyền QL, ghi theo lô`.

## Task 6 · Web: Lộ trình tiếp theo, Chuyển lớp, menu ⋯ / ⋮, cột Khoá, badge

**Files:** tạo `web/src/modules/students/LoTrinhTiepPanel.tsx`, `ChuyenLopPanel.tsx`; sửa `thaoTacDongHocVien.tsx`,
`shared/domain/hocVienLop.ts` (`MENU_DONG_CHO_PR_LT` → `true` cả hai), `StudentManagePanel.tsx`, `StudentDetailPage.tsx`,
`BangHocVienLop.tsx`, `DauTrangLop.tsx`, `StudentsPage.tsx`.

- **`LoTrinhTiepForm` + `LoTrinhTiepPanel`** (mockup 11-1): tiêu đề `Lộ trình tiếp theo · {tên}` + phụ `{mã lớp} · W8/8`;
  hàng chip chọn một (hướng theo `nhanHuong` dạng đầy đủ); `Lớp dự kiến` (dropdown, `· không bắt buộc`); Sang FT → thêm
  `Mục tiêu band`, `Tháng dự kiến thi` (ô tháng); `Ghi chú`; nút `Lưu`. Một dòng phụ: `Chỉ là dự định, chưa đổi lớp.`
  Toast `Đã ghi lộ trình tiếp theo`; `invalidate('/students')`, `'/classes'`, `'/hoc-vien-lop'`, `'/my-work'`.
- **`ChuyenLopForm` + `ChuyenLopPanel`** (mockup 11-3) thay `TransferForm` (`StudentManagePanel.tsx:338-464`, xoá hẳn):
  tiêu đề `Chuyển lớp · {tên}` + phụ `đang ở {mã}`; `Chi nhánh` (mọi chi nhánh, mặc định chi nhánh hiện tại) → `Lớp`
  (`{mã} · W3/8 · GVCN {tên}`; lớp khác chương trình ghi thêm tên chương trình) — dữ liệu từ `GET /chuyen-lop/lop-dich`;
  đổi chi nhánh → một dòng `Quản lý chi nhánh {tên} và GVCN lớp mới sẽ nhận thông báo.` · `Ngày hiệu lực` (chọn tuần `W4 SEP`, gửi thứ Hai của tuần) · `Lý do` chip bắt buộc (`TRANSFER_REASONS`,
  `Khác` mở ô ghi rõ) · `Lưu ý bàn giao` + ô tích `Không có lưu ý` (ẩn khi còn Case, một dòng `Em còn {n} Case — ghi lưu ý
  để người nhận biết em đang dở gì.`) · khi chọn lớp: gọi `?toClassId=` → khối `Case đang mở ({n})` mỗi Case một dòng
  `{Kỹ năng} → người nhận` + `ChonNguoi` điền sẵn `goiY` (`GV Listening lớp mới, tự chọn, đổi được`); Case `seDong` ghi
  `→ tự đóng "Chuyển sang Fast Track"` · `luat.canMucTieu` → `Mục tiêu band` (bắt buộc) + `Tháng dự kiến thi`; `luat.khoa ===
  'dong-mo'` → một dòng `Lớp mới khác chương trình: máy đóng khoá cũ và mở {khoá mới / lộ trình Fast Track}.` · nút `Huỷ` ·
  `Chuyển lớp`. Không `SectionNote` giải thích mô hình (G-5) — luật dài vào ⓘ cạnh tiêu đề.
- **Menu ⋯ dòng HV** (`thaoTacDongHocVien.tsx`): bật hằng; `mo.viec` thêm `'lo-trinh-tiep' | 'chuyen-lop'`; panel mới trong
  `panels`, vẫn **một panel một lúc** (G-8). Sửa chú thích dòng 26 và `hocVienLop.ts:185`. Phép kiểm `hocVienLop.tests.ts:153-157`
  đổi theo (hằng = `true`).
- **⋮ Hồ sơ HV** (`StudentManagePanel.tsx`) — thứ tự mockup 12-C: `Thông tin học viên` · `Lộ trình tiếp theo` (lớp thường,
  `quyen.ghiLoTrinhTiep`) · `Lộ trình` (FT, như cũ) · `Chuyển lớp` (`quyen.chuyenLop`) · `Kết luận lộ trình` (**chỉ FT**, Q15) ·
  nhóm trạng thái: `Tạm dừng học` / `Quay lại học` (lý do, ngày) · `Kết thúc học` (lý do, ngày; một dòng `Case còn mở sẽ được
  hệ thống đóng "Học viên kết thúc khoá".`) · `Lưu trữ` / `Bỏ lưu trữ` (chỉ `quyen.luuTru/boLuuTru`, hỏi xác nhận trong panel).
  Form hiện **trong** panel như mẫu cũ (không panel chồng panel). Props nhận thêm `lopHoc` từ profile. Bỏ `SectionNote` lớp
  Normal dòng 105-111 (chữ "Normal" cấm).
- **Đầu Hồ sơ HV** (`StudentDetailPage.tsx:~190`): `tiepTheo: data.lopHoc?.tiepTheo ?? null`, `nhacLoTrinh: data.lopHoc?.nhacLoTrinh`.
  Sửa chú thích dòng 186.
- **Cột Khoá** (`BangHocVienLop.tsx:56-58`): tính **mỗi dòng** `khoaLopThuong({ …, tiepTheo: s.tiepTheo, nhacLoTrinh: s.chuaLoTrinh
  && lop.nhacLoTrinh })`; dòng phụ nhắc màu vàng nhạt (không ⚠ — G-4).
- **Badge**: `DauTrangLop.tsx:52` và `StudentsPage.tsx:214` truyền `canXepLop`, `soChuaLoTrinhTiep`; badge `het-khoa` bấm được
  khi `viewer.coTheChuyenTiep` (DauTrangLop: mở panel; StudentsPage: đi `/hoc-vien/lop/{id}?viec=chuyen-tiep`); badge
  `chua-lo-trinh` không bấm (chỉ nhắc — danh sách em đã có ở cột Khoá ngay dưới).

**Phép kiểm (≥ 4, máy chủ/luật; web kiểm ở Task 10):** `mucMenuDongHocVien` GVCN lớp thường có cả hai mục, GVBM không có ·
lớp FT không có `lo-trinh-tiep` · chữ trong các file mới qua khối quét chữ cuối `run.ts` (không "Normal", không "Hãy").
Commit `PR-LT (6): web Lộ trình tiếp theo, Chuyển lớp một em, menu ⋯ và ⋮, cột Khoá, badge nhắc`.

## Task 7 · Web: Chuyển tiếp lớp (hai bước) + lối vào

**Files:** `web/src/modules/classes/TransitionPanel.tsx` (viết lại), `ClassOverviewPage.tsx`, `DauTrangLop.tsx`.

- **Bước 1 · Soạn** (mockup 11-2): tiêu đề `Chuyển tiếp lớp · {mã} kết thúc {tuanLich} · {n} HV` + ô `Ngày chuyển` bên phải.
  Ô `Lớp đích cho cả lớp` (lớp ứng viên `{mã} · đang có {n} HV` hoặc `+ Mở lớp mới`) — áp cho mọi em có hướng `Lên …` chưa
  sửa riêng. Bảng `Học viên · Lộ trình tiếp theo · Lớp đích · Cần điền thêm` (colgroup cố định, G-2): hướng điền sẵn từ
  `loTrinhTiep` (em chưa có / `Chưa rõ` → ô trống viền vàng); Lớp đích lọc đúng loại theo hướng, `không chuyển` với Bảo lưu /
  Dừng học / Xếp sau; Cần điền thêm: FT `Mục tiêu` + `thi` (tháng) · Bảo lưu/Xếp sau `Lý do` + `xem lại` (chọn tuần) ·
  Dừng học `Lý do` · còn lại `—`. Dòng lỗi (từ `kiemDongChuyenTiep`) một dòng đỏ nhỏ dưới dòng em. Dưới bảng: `Lớp đích chưa
  có? + Mở lớp mới` → khối `Mã lớp mới` · `Chương trình` · **`Tuần khai giảng lớp mới`** (`WeekPicker`, gửi `startPeriodId`) ·
  `GVCN` (dropdown giáo viên chi nhánh từ `transitionPlan.teachers`). Nút `Tiếp tục` mờ khi còn dòng lỗi (title nói còn mấy em).
- **Bước 2 · Xác nhận**: in `tomTatChuyenTiep(...).cau` (mỗi câu một dòng, G-3) + nhắc `baiChuaLam` nếu > 0; nút `Quay lại` ·
  `Xác nhận chuyển {n} HV` (n = số em đổi lớp). Kết quả: toast theo mẫu cũ (dòng 74-80), `failed` hiện ngay trong panel (không
  đóng) để sửa; `lopCuDaKetThuc` → toast `Lớp {mã} đã kết thúc`.
- **375px:** bảng thành thẻ mỗi em (tên · hướng · lớp đích · cần điền) — không cuộn ngang trang (G-11).
- Bỏ `SectionNote` dòng 101-107, 223-227 (G-5); luật vào ⓘ cạnh tiêu đề (một câu: `Hệ thống không tự chuyển ai. Lớp cũ giữ
  nguyên trong lịch sử.`).
- **Lối vào:** `ClassOverviewPage` đọc `?viec=chuyen-tiep` → mở panel một lần rồi xoá tham số (khi `viewer.coTheChuyenTiep`);
  nút đầu trang và badge dùng `coTheChuyenTiep`. Việc đỏ ở Việc cần làm đã trỏ đúng từ Task 3. GVCN không thấy nút.

Commit `PR-LT (7): Chuyển tiếp lớp hai bước, mở lớp mới đủ tuần khai giảng và GVCN, lối vào từ việc đỏ`.

## Task 8 · Lịch sử lớp + nhãn Case hệ thống đóng

**Files:** tạo `server/src/classes/lichSuLop.ts`, `web/src/modules/students/LichSuLop.tsx`; sửa `routes/index.ts`,
`StudentDetailPage.tsx` (tab Hành trình ~340), `web/src/modules/cases/CasePanel.tsx`, `tocDoDuong.ts`.

- `GET /students/:id/lich-su-lop` (STUDENT_VIEW) → mỗi enrollment (mới nhất trước): `{ lop: { id, code }, tu, den, dangHoc,
  ketThucVi: nhanKetThucVi(...), ketQua }`. Kết quả theo Q18: lượt `final` (không có thì `progress`) của **đúng lớp đó** → "Cuối
  khoá đạt 3/4 môn" qua cùng hàm Qb dùng cho lớp thường (`typedResult`/`chuoiDiem` — tìm trong `students/hanhTrinh.ts`, không
  viết cách tính thứ hai); `chuyen_lop` → `end_reason`; dòng đang học FT → `Mục tiêu {band} · thi {MM/YYYY}`. **Ba câu cố định**
  (enrollments + lớp; lượt Giữa/Cuối của các lớp đó + điểm; lộ trình đang chạy).
- `LichSuLop.tsx`: bảng nhỏ 4 cột (mockup 11-4), cột thời gian `W1 AUG – W4 SEP` qua `tuanLich`, dòng đang học `đang học ·
  W1 OCT →` và `—`; tên lớp là link Hồ sơ lớp; 375px cuộn trong thẻ. Đặt **trên** `<HanhTrinh>` trong tab Hành trình, chỉ tải
  khi tab mở. Không có enrollment → không hiện khối.
- `CasePanel.tsx`: khi `systemCloseLabel` có → badge chữ `Hệ thống tự đóng · {nhãn}` cạnh trạng thái ở đầu panel, không hiện nút
  kết luận/ghi kết quả (Case đã `done`). Nếu `listCases` chưa trả `systemCloseLabel` mà dòng Case ở hồ sơ HV cần — **không**
  sửa `cases.ts` (ngoài phạm vi), ghi vào "Chuyển cho".
- `tocDoDuong.ts`: `/students/{hv}/lich-su-lop` (QL, QT, GVCN, GVBM).

**Phép kiểm (≥ 5):** em lên lớp: hai dòng, dòng cũ `Lên lớp` + `Cuối khoá đạt n/4 môn` · em chuyển lớp: `Chuyển lớp` + lý do ·
dòng cũ không có `end_kind` suy đúng (Q18) · GV ngoài phạm vi 403 · số câu không tăng theo số lớp em đã học.
Commit `PR-LT (8): Lịch sử lớp ở tab Hành trình, nhãn Case hệ thống đóng`.

## Task 9 · Khu Lưu trữ + chế độ chỉ xem (Q16, Q22 — chủ sản phẩm chốt 23/09)

**Files:** tạo `server/src/classes/luuTru.ts`, `web/src/modules/students/LuuTruPage.tsx`; sửa `routes/index.ts`,
`classes/hocVienLop.ts` (server), `classes.ts` (`classOverview`, `classRoster`), `web/src/App.tsx`, `StudentsPage.tsx`,
`ClassOverviewPage.tsx`, `DauTrangLop.tsx`, `StudentDetailPage.tsx`, `tocDoDuong.ts`; thêm dòng vào **§4 đặc tả**.

- **Máy chủ `GET /hoc-vien-lop/luu-tru?branchId=&q=`** (`luuTru.ts`) → `{ lop: [{ id, code, ma, tenChuongTrinh, chiNhanh,
  gvcn, soHvTungHoc, finishedAt }], hocVien: [{ id, studentCode, fullName, lopCuoi, chiNhanh, archivedAt }], phamVi }`.
  Lớp: `status='finished'` trong `classScopeSql(scopeFor(p, ATTEMPT_VIEW))` — **cùng phạm vi** danh sách chính. HV: `archived_at
  IS NOT NULL`, phạm vi dựng **đúng luật** `can(STUDENT_VIEW, { studentId })` hiện có (đọc `classesOfStudent`/`branchesOfStudent`
  ở `permissions.ts` rồi viết SQL cùng luật — không sửa file đó). Ô tìm và chi nhánh lọc như `/hoc-vien-lop`. **Một câu cho mỗi
  tab** (không `can()` từng dòng, không vòng lặp theo em). Sắp mới nhất trước.
- **Số trên menu:** `/hoc-vien-lop` (`danhSachHocVienLop`) trả thêm `demLuuTru: { lop, hv }` — **một câu** hai `COUNT` con, cùng
  phạm vi với đường trên.
- **`classOverview`** (`classes.ts:577`): thêm `status`, `finishedAt`; `status='finished'` → mọi cờ `viewer` thao tác `false`
  (Q22), `summary` dựng từ `classProgressMany` (không từ `listClassSummaries`, vì hàm đó lọc `status='active'` nên trả `null`).
  **`classRoster`**: lớp `finished` → mọi em từng học (enrollment bất kỳ trạng thái, dòng mới nhất mỗi em) + `ketThucVi`.
  Bảng điểm lớp thường của tab Học viên (`BangDiemLopThuong` và đường nó gọi): nếu đang lọc enrollment `active` thì lớp
  `finished` đọc cả em đã rời — kiểm và ghi Nhật ký (không sửa file Rc1/Rc2 nào; nếu phải sửa thì dừng, hỏi planning).
- **Web · lối vào:** `StudentsPage.tsx` hàng tiêu đề trang — `MenuDong` `⋯` ở **góc phải** (`nhan="Thao tác trang"`, tooltip
  G-7) với **một** mục `Lưu trữ · {n} lớp · {m} HV` (bỏ phần số 0: `Lưu trữ · 5 HV`; cả hai 0 thì `Lưu trữ`) → `/hoc-vien/luu-tru`.
  Hiện với mọi vai xem được trang Học viên & Lớp. `App.tsx`: route `/hoc-vien/luu-tru` **trước** `/hoc-vien/:id`.
- **Web · `LuuTruPage.tsx`:** nút `‹ Học viên & Lớp` · tiêu đề `Lưu trữ` · hai tab `Lớp đã kết thúc` · `Học viên đã lưu trữ`
  (`HangTab`, nhớ `?tab=`) · cùng ô tìm + chọn chi nhánh như trang chính (dùng lại component của `StudentsPage`, không chép).
  Dòng **làm mờ** (chữ phụ, `opacity` thấp) + badge chữ `Đã kết thúc {dd/mm/yyyy}` / `Lưu trữ {dd/mm/yyyy}` (qua `ngay()` dạng
  đủ năm). Lớp: `{mã} · {chương trình} · {chi nhánh} · GVCN {tên} · {n} HV từng học`. HV: `{tên}` + mã mờ · lớp cuối · chi
  nhánh. Bấm dòng → Hồ sơ lớp / Hồ sơ HV. QL (`PLAN_WEEK`) có nút `Bỏ lưu trữ` cuối dòng HV (`POST /students/:id/unarchive`,
  toast, dòng biến khỏi tab). Lớp **không** có nút nào. Trống: `Chưa có lớp nào kết thúc` / `Chưa có học viên nào được lưu trữ`.
  375px: dòng xuống hai hàng, không cuộn ngang trang.
- **Web · chỉ xem:** `ClassOverviewPage`/`DauTrangLop` — `status='finished'` → dải nhạt `Lớp đã kết thúc — chỉ xem` trên đầu
  trang, không nút, không ⋮ (cờ `viewer` đã `false`); bảng tab Học viên có cột/nhãn `Kết thúc vì`. `StudentDetailPage` — em đã
  lưu trữ (`lopHoc.chiXem`) → dải `Học viên đã lưu trữ — chỉ xem`, ẩn `+ Case`; ⋮ chỉ còn `Bỏ lưu trữ` (QL).
- **§4 đặc tả** (`docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md`) thêm dòng:
  `| Lưu trữ (lớp đã kết thúc, HV đã lưu trữ) | ⋯ góc phải trang Học viên & Lớp → Lưu trữ | trong phạm vi |` (G-12).
- `tocDoDuong.ts`: `/hoc-vien-lop/luu-tru`, `/hoc-vien-lop/luu-tru?branchId={cn}` (MOI_VAI) + trần.

**Phép kiểm (≥ 8):** lớp vừa `finished` rời `/hoc-vien-lop` và có ở `/hoc-vien-lop/luu-tru` với `finishedAt` · HV lưu trữ có ở
tab HV, bỏ lưu trữ thì rời · `demLuuTru` khớp độ dài hai danh sách (G-10) · tập HV lưu trữ trả về **khớp** `can(STUDENT_VIEW)`
từng em (QL chi nhánh khác không thấy; GV không dạy lớp em không thấy) · `classOverview` lớp `finished`: mọi cờ thao tác `false`
kể cả với QT; `classRoster` có em đã rời kèm `ketThucVi` · `POST /students/:id/unarchive` GVCN 403, QL 200 · đếm câu SQL
`/hoc-vien-lop/luu-tru` không tăng khi nhân số lớp/HV lưu trữ.
Commit `PR-LT (9): khu Lưu trữ — lớp đã kết thúc, HV đã lưu trữ, chế độ chỉ xem`.

## Task 10 · Bấm thử theo vai + 375px (một lần), đẩy PR

Máy chủ thử (ghi nhớ "máy chủ dev trong worktree"): trong worktree `npm run seed` → `PORT=4307 node
dist-server/server/src/index.js` (nền) → file Vite **tạm** ở gốc worktree (`port: 5507, strictPort`, proxy `/api` →
`127.0.0.1:4307`, alias `@shared`) → `npx vite --config <file>`; Playwright kênh Chrome (`npm install --no-save playwright`).
Đăng nhập demo `POST /api/demo/session { userId }` (id theo các vai `QL`, `GVCN`, `GVBM`, `GVCN_THUONG` của `tocDo.run.ts`).
Cần lớp thường ở W7/8 và lớp đã hết khoá còn em: đổi ngày demo qua `/api/demo/...` như các PR trước, không sửa seed.

Kịch bản (mỗi kịch bản ≥ 1 ảnh `thiet-ke/anh/pr-lt/NN-ten.png`):
1. GVCN lớp thường · Học viên & Lớp: badge `3 HV chưa có lộ trình tiếp theo` ở hộp lớp W7/8, cột Khoá dòng phụ `chưa có lộ
   trình tiếp theo` · Tổng quan › Việc cần làm nhóm Vận hành có dòng lớp. ⋯ một em → `Lộ trình tiếp theo` → Lên BE → Lưu → cột
   Khoá `tiếp theo: BE`, badge giảm. Em khác chọn Sang Fast Track (mục tiêu để trống) → Lưu được. Em thứ ba `Chưa rõ` → vẫn nhắc.
2. GVCN · Hồ sơ HV: dòng dưới tên có `tiếp theo: BE`; ⋮ có Lộ trình tiếp theo, Chuyển lớp, Tạm dừng học, Kết thúc học;
   **không** có Kết luận lộ trình, **không** có Lưu trữ.
3. GVCN MB · ⋯ → `Chuyển lớp`: ô Chi nhánh có **mọi** chi nhánh; chọn CP → danh sách lớp CP (mã, chương trình, GVCN — không
   học viên) + dòng báo QL/GVCN nhận thông báo; chọn lớp → Case hiện người nhận gợi ý, đổi bằng ô tìm (không lỗi quyền);
   không lý do → không lưu; còn Case → không có `Không có lưu ý`; chuyển xong → GVCN MB mở lại hồ sơ em bị chặn; đăng nhập QL
   CP → chuông có `{tên} chuyển vào lớp {mã}` → bấm mở hồ sơ em; Lịch sử lớp có dòng `Chuyển lớp · Đổi chi nhánh`.
4. QL · Hồ sơ lớp đã hết khoá: badge đỏ `Hết khoá · n HV cần xếp lớp tiếp` → bấm mở panel; Việc cần làm QL → `Xếp lớp tiếp
   theo` mở đúng panel. Bước 1 điền sẵn từ kịch bản 1; một em Bảo lưu (lý do + xem lại), một em Sang FT (mục tiêu 6.5) →
   `+ Mở lớp mới` BE với **tuần khai giảng** và GVCN → Tiếp tục → bước Xác nhận đúng câu → Xác nhận → lớp cũ `Đã kết thúc`,
   rời danh sách; lớp BE mới có đúng tuần khai giảng, đúng GVCN; Case lớp thường của em sang FT hiện `Hệ thống tự đóng ·
   Chuyển sang Fast Track`; Lịch sử lớp em lên BE: `Lên lớp · Cuối khoá đạt …`.
5. GVCN cùng lớp đó: **không** có nút Chuyển tiếp lớp, badge đỏ không bấm được.
6. QL · Hồ sơ HV em đã Kết thúc học → `Lưu trữ` → nhãn `Đã lưu trữ`; `Bỏ lưu trữ` trả lại. HV FT: ⋮ có Kết luận lộ trình;
   Chuyển lớp FT → FT: lộ trình giữ nguyên (tab Học thuật không đổi MT).
7. **Lưu trữ:** QL · Học viên & Lớp → ⋯ góc phải → `Lưu trữ · 1 lớp · 1 HV` (lớp cũ ở kịch bản 4, em ở kịch bản 6) → tab
   `Lớp đã kết thúc` dòng mờ `Đã kết thúc {dd/mm/yyyy}` → mở Hồ sơ lớp: dải `Lớp đã kết thúc — chỉ xem`, không nút, tab Học
   viên có em đã rời · tab `Học viên đã lưu trữ` → `Bỏ lưu trữ` → em rời tab. GVCN: thấy mục menu, không có `Bỏ lưu trữ`.
8. **375px:** kịch bản 1 (menu ⋯, panel), 3 (Chuyển lớp), 4 (bảng Chuyển tiếp thành thẻ), Lịch sử lớp, trang Lưu trữ — không
   cuộn ngang trang.

- [ ] Ghi dòng `[sql]` của log API cho `POST /classes/:id/transition` và `GET /classes/:id/transition` vào Nhật ký.
- [ ] Dọn: xoá file Playwright/Vite tạm, tắt hai tiến trình (4307/5507), quét `run.js` treo.
- [ ] `CODE_MAP.md` (file mới + luật lộ trình), tick `plan.md` / kiểm kê (RB-3 ✅ web, S16/S17 nối xong, RB-9 có nút),
  `§4` đặc tả đã thêm dòng Lưu trữ ở Task 9 (các lối vào khác đúng bảng sẵn có).
- [ ] `npm run check` xanh lần cuối (≥ B + 75). Rebase `origin/main` nếu PR khác đã merge (gỡ theo bảng Chồng file;
  **nếu Ra đã merge trước**: chạy lại migrate lặp + phép kiểm migrate, ghi Nhật ký).
- [ ] Push, mở PR tiêu đề `PR-LT: Lên lớp, chuyển lớp — lộ trình tiếp theo, chuyển tiếp cả lớp, chuyển một em, lịch sử lớp`
  — thân: tóm tắt theo Task, bảng Q, danh sách ảnh, **"CÓ migrate: bảng lo_trinh_tiep_theo, cột enrollments.end_kind, classes.finished_at —
  chạy `npm run migrate` trên bản chính TRƯỚC khi deploy mã (sao lưu trước); PR-Ra cũng có migrate → merge lần lượt"**, khối
  `mywork.ts` đã sửa (2c, 2d mới), mục "Chuyển cho", dòng cuối `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  Báo planning (không tự merge, không tự rà).

---

## Mâu thuẫn nguồn ↔ mã thật (đã xử lý)

1. **RB-3** kiểm kê ghi "lý do tuỳ chọn (`students.ts:154`)" — S1 **đã** làm máy chủ (`students.ts:169-184`, route dòng
   1479-1492) và web đã có ô lý do; còn thiếu: chip theo mockup, ẩn `Không có lưu ý` khi còn Case, người nhận theo Case.
2. **Tuần khai giảng bị bỏ qua** (§6): web gửi `startPeriodId` (`TransitionPanel.tsx:64`), máy chủ chỉ đọc
   `newClass.startWeekStart` (`transition.ts:189`) → luôn rơi về tuần của ngày chuyển. Sửa ở Task 5.
3. **Quyền lệch ba chỗ:** `applyTransition` đòi `STUDENT_EDIT` (GVCN làm được, `transition.ts:172`), việc đỏ đòi `CLASS_EDIT`
   (`mywork.ts:604`), nút đầu trang dùng `canEditProgress` = `CLASS_EDIT`. §3.9.2: chỉ QL → thống nhất `CLASS_EDIT` (Q2).
4. **GVCN không chuyển lớp được:** `transferStudent` đòi `STUDENT_EDIT` ở **lớp đích** (`students.ts:166`) mà GV chỉ có quyền
   đó ở lớp mình chủ nhiệm; `/ref/classes` lọc theo `ATTEMPT_VIEW` (chỉ lớp mình dạy); `/ref/people` đòi `MEETING_VIEW` → 403.
   §3.9.3 cho GVCN; chủ sản phẩm chốt GVCN chuyển được sang mọi chi nhánh → kiểm quyền ở lớp nguồn, đường riêng
   `GET /chuyen-lop/lop-dich` (không lộ học viên lớp khác), thông báo QL/GVCN nơi nhận (Q3, Q21).
5. **Chuyển lớp không đổi lộ trình** (§6): `transferStudent` không chạm `learning_cycles`; `regular.ts:257` tìm khoá `active`
   không `route` → bài của lớp mới gắn nhầm vào khoá cũ. `students.ts:202` chuyển mọi lượt `planned` (kể cả Cuối khoá khoá cũ).
6. **`dongCaseKhiKetThuc`** chỉ có ở `updateCycle`/`setOutcome` (`cycles.ts:138, 349`); `setStudentStatus('finished')` đóng Case
   nhưng **không** đóng lộ trình đang chạy → Task 4 đóng `abandoned`.
7. **Kết luận lộ trình** hiện với cả lớp thường (`StudentManagePanel.tsx:102`) và có `SectionNote` "Lớp Normal kết luận theo
   Final Test" — trái §4 (chỉ FT) và luật chữ → Q15.
8. **`systemCloseLabel`** máy chủ đã trả ở `caseDetail` (`cases.ts:1587`) nhưng web chưa hiện chỗ nào.
9. **Việc đỏ Hết khoá** đếm `activeStudents` (`schedule.ts:308`) → không bao giờ hết đỏ với em "Xếp sau" → `canXepLop` (Q9).
10. `transitionPlan` gọi `classProgress` trong vòng lặp ứng viên (`transition.ts:87`) và `suggestClassCode` tới 99 câu — N+1 trên Turso.
11. Mockup 11 và §3.9 ghi "Lưu ý bàn giao"; THUAT_NGU g7-098 sửa "Dặn người nhận" → "Ghi chú bàn giao" → theo đặc tả (Q13).
12. §3.9 bảng luật không có dòng **FT → lớp thường**; S17 gốc (kiểm kê) nói đúng chiều đó → Q10.

## Chuyển cho (ghi vào thân PR)

- **PR-Ra:** `mywork.ts` khối 2c sửa đếm/`href`, khối 2d `next_step` mới — rebase giữ cả hai. Cả hai PR có migrate → PR sau
  rebase và chạy lại migrate lặp.
- **PR-S3 (chữ):** `JOURNEY_EVENT_LABEL` thêm `next_step`, `promote` nếu còn thiếu nhãn ở danh sách "Mốc học tập"; dòng Case ở
  hồ sơ HV (SkillBoard/danh sách Case) chưa ghi `Hệ thống tự đóng · …` nếu `listCases` không trả `systemCloseLabel`.
- **Planning:** lớp cũ đã hết khoá từ trước PR (seed, dữ liệu thật) không tự thành `Đã kết thúc` và không vào khu Lưu trữ (Q16) — cần thì chạy một lệnh
  riêng sau deploy.

## Nhật ký

| Ngày | Task | Ghi |
|---|---|---|
| 23/09 | 0 | Qb #75 đã ở `origin/main` khi bắt đầu; kế hoạch này đã có sẵn trên `main` (PR #79, không cần chép). Trong lúc dựng worktree, PR-YT2 #77 merge vào `origin/main` — fast-forward nhánh lên `origin/main` mới nhất (`835f077`) trước khi đo. Mốc **B = 1026** phép kiểm (KHÔNG phải số đo trên `origin/pr-qb-ho-so-hoc-vien@64074c8` như dòng "Số dòng" ở đầu file — số dòng tham chiếu trong kế hoạch có thể lệch vài dòng so với mã thật do YT2 chèn thêm; mở file xem lại trước khi sửa theo đúng lời dặn). |
