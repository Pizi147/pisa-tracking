# PR-YT2 · Ý thức đầy đủ — Kế hoạch

> Tên file và tên nhánh giữ chữ `gon` cho khỏi lẫn (chủ sản phẩm đổi sang bản ĐẦY ĐỦ ngày 23/09, còn nhiều thời gian).

| Mục | Chốt |
|---|---|
| Mã PR · đợt | **PR-YT2** · Đợt 3, **trước deploy** |
| Nhánh · worktree | `pr-yt2-y-thuc-gon` · `.claude/worktrees/pr-yt2-y-thuc-gon` · một PR, không draft, **không tự merge** |
| Cổng thử | API **4257** · Vite **5457** (không 4000/5173, không cổng PR khác) |
| Model khuyến nghị | **Opus 5.5 · High** |
| Phương án B | **Sonnet 5 · High** |
| Người rà | **Fable 5.1** (nếu code bằng Fable thì **Opus 5.5**) — khác model người code |
| Migrate | **KHÔNG.** Không đổi `schema.sql`, `migrate.ts` (`attachments` đã nhận `owner_type = 'violation'`; `violation_history`, `violations.cycle_id/class_id` đã có) |
| Phụ thuộc | **Bắt đầu sau khi PR-Form (#72) merge.** Task 7 cần **PR-Qb** đã merge · Task 8 cần **PR-Pb (#73)** đã merge. Mỗi Task đó có bước kiểm `git fetch` ở đầu; chưa merge thì làm Task khác trước |
| Chồng file | Xem bảng **Chồng file** cuối phần đầu |
| File KHÔNG được chạm | **Qb (trước khi merge):** `StudentDetailPage.tsx`, `JourneyTimeline.tsx`, `HanhTrinh.tsx`, `students/hanhTrinh.ts` (mọi lúc) · `profile.ts`, `StudentYThucSection.tsx` (chỉ ở Task 7, sau khi Qb merge) · **Rc2/TD:** `MockPlanPanel.tsx`, `skillSchedule.ts`, `planning.ts`, `permissions.ts`, `cases.ts`, `mywork.ts`, `attempts.ts`, `regular.ts` · **Pb (trước khi merge):** `YThucAnalysisView.tsx`, `phanTich/*`, `yThuc/phoiHop.ts`, `worklist/metrics.ts`, `shared/domain/metrics.ts` (chỉ ở Task 8) · `CaseBoardPage.tsx`, `IssueAnalysis.tsx` (mọi lúc) · **Qa/Qb:** `ClassRoster.tsx`, `StudentsPage.tsx`, `ClassOverviewPage.tsx`, `thaoTacDongHocVien.tsx` · **Form (chỉ dùng):** `BangChung.tsx`, `PeoplePicker.tsx`, `QuickReport.tsx`, `CasePanel.tsx`, `SkillBoard.tsx` · `schema.sql`, `migrate.ts` |

### Chồng file

| File | PR khác | Cách xử lý |
|---|---|---|
| `server/src/routes/index.ts`, `server/src/tests/run.ts` | mọi PR | **Chỉ thêm khối** + sửa 3 route Ý thức (`PATCH /measures/:id`, `/students/:id/measure-kinds`, `/students/:id/violations`) và `/metrics/:id` (Task 8). Gỡ xung đột giữ cả hai |
| `server/src/yThuc/measures.ts`, `violations.ts` | Form (merge trước) | Làm trên mã Form |
| `server/src/students/profile.ts` | **Qb** | Task 7 sau khi Qb merge — chỉ 2 dòng `viewer.canReport/canRecordViolation` (nhánh Qb `profile.ts:926, 929`) |
| `web/src/modules/yThuc/StudentYThucSection.tsx` | **Qb** (Task 7 của Qb: prop `canhBao`) | Task 7 sau khi Qb merge |
| `YThucAnalysisView.tsx`, `phanTich/PhanTich.tsx`, `yThuc/phoiHop.ts`, `yThuc/thongKe.ts`, `worklist/metrics.ts`, `shared/domain/metrics.ts` | **Pb #73** | Task 8 sau khi Pb merge |
| `server/src/tests/tocDoDuong.ts` | **TD** | Nếu TD đã merge: thêm đường mới + trần (Task 2, Task 8) |
| `web/src/ui/Toast.tsx`, `web/src/ui/DongThoiGian.tsx` | không ai | — |

## Quy trình nhanh (chủ sản phẩm chốt 23/09 — bắt buộc)

- **KHÔNG** dùng `superpowers:subagent-driven-development`; **không** rà từng Task bằng subagent. Tự code từng Task, chạy
  `npm run check` sau mỗi Task (phải xanh, **số phép kiểm không giảm**), rồi commit. Nếu buộc dùng subagent: cùng model,
  **không Haiku**.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375px **một lần** ở Task 9 (ảnh vào `thiet-ke/anh/pr-yt2/`).
- Không tự rà code cuối PR (planning rà bằng model khác). Cuối PR: push, mở PR, báo planning.
- Commit ghi **đúng** dòng `Co-Authored-By` của model thật đang chạy.
- Gặp mã lệch hẳn kế hoạch (không chỉ lệch số dòng) → dừng, hỏi planning. `npm run check` treo (chạy chồng) → quét và tắt
  tiến trình `run.js` cũ trước khi chạy lại.
- **Thứ tự:** 0 → 1 → 2 → 3 → 4 → 5 → 6 (chỉ cần Form) · 7 khi Qb đã merge · 8 khi Pb đã merge · 9 cuối. Chờ Qb/Pb thì làm
  tiếp Task khác, **không** chép tay mã của nhánh chưa merge.

## Mục tiêu

1. **YT-2 + YT-3 · Sửa PA xử lý đang chuẩn bị** trong **panel Phương án xử lý** (mockup 09c cột phải), sửa/xoá vi phạm ngay trong PA.
2. **K2-6f · Bằng chứng cho vi phạm** lúc ghi mới (lưu trước, như F-1 của Form) và lúc sửa.
3. **YT-1 · Dòng vi phạm mở tại chỗ:** Bằng chứng / Phương án / Đã sửa {n} lần · Xem + Sửa · Xoá.
4. **K2-6c** toast Hoàn tác 10 giây · **K2-6b** "Xem" ở cảnh báo trùng.
5. **YT-6** Theo thời gian = mọi vi phạm có lọc ngày · **YT-7** · **YT-10** · **YT-11** · **YT-12** ba bộ lọc phụ (4.13 = làm) ·
   **YT-13** một panel một lúc · **YT-14** nợ rà PR-K3.
6. **Máy chủ:** chặn xoá vi phạm **cuối cùng** của PA đang chuẩn bị; route truyền `excludeMeasureId`; **K2-6e**
   `canRecordViolation` dùng `activeClassOf`.
7. **Tóm tắt Ý thức của HV đếm theo chu kỳ học** (§3.11 dòng cuối).
8. **Phân tích › Ý thức & Phối hợp cho QL:** **P13** bảng 5 nhóm × 4 trạng thái + bảng 9 loại PA · **P14** lọc theo lớp.
   **P15** (SOS 1/2/3) Pb #73 **đã làm** (`phoiHop.ts` `byKind`, `YThucAnalysisView.tsx:74-81` trên nhánh Pb) — chỉ giữ và
   thêm lọc lớp. Mọi số bấm ra đúng danh sách (G-10); không N+1.
9. **Tốc độ Turso:** `listMeasures` dựng theo lô; mọi đường mới đọc danh sách bằng một câu SQL.

Đã xong ở PR khác (không làm lại): YT-4, YT-5, YT-9, K2-6d (Form) · YT-8, K2-6a (Qa) · P15 (Pb).

## Nguồn

- Đặc tả `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md`: §1 (G-1, G-3, G-4, G-5, **G-8**, **G-9**,
  **G-10**, G-11, G-12), §2, **§3.3 dòng "Ý thức & Phối hợp"**, **§3.11**, §3.13, §4.
- Kiểm kê `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md` §1.3 (P13, P14), §1.6 (K2-6b…f, YT-1…14), §2 #1–5,
  §4 câu 4.13.
- `thiet-ke/SOS_VA_PHOI_HOP_V3.md` §7.6 (ba bảng số liệu cho QL, bộ lọc chi nhánh · lớp · khoảng thời gian, không tỷ lệ cải
  thiện) · `thiet-ke/HOP_DONG_SO_LIEU.md` (số = độ dài tập ID, bấm ra đúng tập, cùng quyền).
- Mockup `thiet-ke/mockup/09c-y-thuc-vua.html`. Mockup `03b-phan-tich-v2.html` **không** vẽ góc Ý thức — bố cục theo §7.6.
- Chữ `thiet-ke/THUAT_NGU_DA_CHOT.md`: g2-006 **`Theo học viên`** · g3-004 `Sửa` · g3-005 `Xoá` · g3-044 `Thêm vi phạm` ·
  g3-048 `Mở phương án` · g3-052 → **`Xác nhận đã thực hiện →`** · g6-145 **`Đã sửa {n} lần · Xem`** · g7-035 `Loại` ·
  g7-039 `Phụ trách` · g7-060 `Bằng chứng` · g9-012/013/014 trạng thái vi phạm · g9-015/016 trạng thái PA · g9-018
  `Phương án xử lý` · g9-020 `PA đang chuẩn bị` · **g9-056 `Xem thêm {n} vi phạm (đã xử lý) ▾`**. Không mở đầu bằng "Hãy".
- Mẫu "lưu trước, bằng chứng sau": `web/src/modules/cases/QuickReport.tsx` (nhánh Form) dòng 75–76, 140–154, 290–318.

**Số dòng** đo trên `origin/pr-form-chon-nguoi` @ `4466262`; Task 7 đo trên nhánh local `pr-qb-ho-so-hoc-vien`; Task 8 đo
trên `origin/pr-pb-phan-tich-gon` @ `c6f337d`. Mở file xem lại trước khi sửa — lệch vài dòng là bình thường.

## Bảng Q — quyết định đã tự chốt

| Q | Câu hỏi | Chốt | Lý do |
|---|---|---|---|
| Q1 | Đổi danh sách vi phạm của PA gọi route nào? | **Mở rộng `PATCH /measures/:id`** nhận `violationIds` (tập đầy đủ) — một giao dịch cùng loại/nội dung/phụ trách. Route thêm/bỏ lẻ giữ nguyên | Bấm Lưu một lần, không lệch nửa chừng; trên Turso một request thay vì N |
| Q2 | Tích/bỏ tích trong PA lưu ngay hay khi bấm Lưu? | **Khi bấm Lưu.** Nút Lưu mờ khi không đổi gì. `Xác nhận đã thực hiện →` có thay đổi chưa lưu thì **lưu trước** rồi mới mở panel Xác nhận | Mockup có nút Lưu; một kiểu lưu cho cả panel |
| Q3 | Sửa vi phạm từ trong PA (G-8)? | Đóng PA → mở form **Sửa vi phạm** → lưu/huỷ xong **mở lại** đúng PA đó. PA có thay đổi chưa lưu thì `Sửa`/`Xoá` của vi phạm mờ, `title` "Lưu phương án trước". **Xoá** vi phạm: hỏi ngay trong dòng. Vi phạm duy nhất của PA: không có `Xoá` trong PA (máy chủ cũng chặn — Q15) | Không chồng panel, không mất chữ đang sửa |
| Q4 | Bằng chứng lúc ghi mới | **Lưu trước** → bước "✓ Đã ghi vi phạm cho {tên}" + `BangChung ownerType="violation"` + **Xong**. `onDone` chỉ chạy khi đóng — **props không đổi** | "Như Form đã làm cho Case"; vi phạm chưa có id thì chưa đính được |
| Q5 | Hoàn tác | Toast **10 giây** "Đã ghi vi phạm cho {tên} · **Hoàn tác**" hiện **lúc panel đóng** sau khi ghi. Trong bước "✓ Đã ghi" có nút `Hoàn tác` ở chân panel. Hoàn tác = `DELETE /violations/:id` (route sẵn) | Toast lúc panel còn mở sẽ đè chính panel |
| Q6 | "Xem" ở cảnh báo trùng | Một dòng `Đã có {n} vi phạm {Nhóm} ngày {dd/mm} · Xem`; `Xem` **mở ngay dưới dòng** (mô tả · người ghi · trạng thái), không mở panel thứ hai. **Bỏ** nút "Vẫn ghi vi phạm mới" (cảnh báo chưa từng chặn Lưu). Luật trùng giữ **V06 cùng ngày** | G-8; không mất chữ đang gõ |
| Q7 | "Theo thời gian" lấy vi phạm của ai? | **HV đang học ở lớp**, **mọi trạng thái**. Lọc **7 ngày · 30 ngày (mặc định) · Tất cả thời gian**. Route mới `GET /classes/:id/violations` — một câu SQL | Khớp bảng lớp; gói trả về nhỏ trên Turso |
| Q8 | Đếm "Đã sửa {n} lần" | Số nhóm dòng lịch sử cùng `created_at` + cùng người, chỉ 4 trường `description/category/skill/occurred_on`. Dòng `measure` hiện trong danh sách Xem ("Gắn vào / Bỏ khỏi phương án") nhưng **không tính**. 0 lần thì không hiện dòng | Một lần sửa đổi 2 trường ghi 2 dòng (`violations.ts:280`) |
| Q9 | GVBM bấm PA | Mở **Xem** (chỉ đọc). PA đã thực hiện → Xem, có `Sửa ghi chú` khi `canManage` (YT-10) | Máy chủ khoá mọi thứ trừ ghi chú + tệp khi `done` |
| Q10 | Tốc độ `listMeasures` | Dựng **theo lô** (một câu nối, một `violationsByIds`, một `COUNT … GROUP BY` tệp, quyền nhớ theo HV). JSON **giống hệt** bản cũ | Bảng lớp và tab HV đang tốn 3–5 câu cho **mỗi** PA (`measures.ts:86-110` trong vòng `listMeasures:486`) |
| Q11 | Chữ nút Ghi | `Lưu` (mockup 09c); tiêu đề giữ `Ghi nhận vi phạm` / `Sửa vi phạm` | Mockup đứng trên THUAT_NGU |
| Q12 | Loại PA khi sửa | Dropdown; loại khoá `disabled` kèm lý do; lấy từ `/students/:id/measure-kinds?excludeMeasureId={id}` | Không exclude thì loại Thư cảnh cáo của chính PA tự khoá mình |
| Q13 | YT-12 ba bộ lọc phụ | Một hàng chip **chọn một**: `Tất cả · Chưa xử lý · Có PA đang chuẩn bị · > 5 ngày` (mặc định Tất cả, không nhớ). **Theo học viên:** giữ em có vi phạm chưa xử lý / có PA đang chuẩn bị / cảnh báo đang bật. **Theo thời gian:** lọc vi phạm theo `state` / `ageLabel`. Lọc ở máy khách, không request thêm | 4.13 = làm; dữ liệu đã có đủ trong bảng lớp |
| Q14 | "Đếm theo chu kỳ học" | Ô số tóm tắt ở tab Ý thức của HV (Vi phạm, từng nhóm, Thư cảnh cáo lần n) chỉ đếm trong **chu kỳ hiện tại**: FT = **lộ trình hiện tại** (`cycle_id`, chuỗi thư Y02 cũng theo lộ trình); lớp thường = **khoá đang học** (`class_id` = lớp đang học). `PA đang chuẩn bị` giữ đếm hết (việc đang dở). Dòng thời gian vẫn hiện đủ. ⓘ cạnh ô số: `Tính trong lộ trình hiện tại` / `Tính trong khoá đang học` | Em học lộ trình 2 không mang số của lộ trình 1 lên đầu; lớp thường không có lộ trình |
| Q15 | Xoá vi phạm cuối cùng của PA đang chuẩn bị | **Máy chủ chặn** (400): `Đây là vi phạm duy nhất của phương án «{tên}» đang chuẩn bị — xoá phương án trước, hoặc thêm vi phạm khác vào phương án.` PA **đã thực hiện** giữ V14′ (xoá được, PA còn 0) | B02 (PA đang chuẩn bị ≥ 1 vi phạm); Hoàn tác vi phạm vừa ghi không vướng (chưa ở PA nào) |
| Q16 | K2-6e đổi dòng nào | `viewer.canRecordViolation` **và** `viewer.canReport` dùng `activeClassOf(studentId)`; `current` giữ cho phần hiển thị | 12.15: một nguồn "lớp đang học"; `profile.ts` xếp `started_at DESC`, `activeClassOf` xếp `id DESC` — lệch thật khi chuyển lớp |
| Q17 | P13 bảng nhóm × trạng thái | Chỉ số mới **`vi-pham-theo-nhom`** (đơn vị vi phạm): tập = đúng tập `vi-pham-tong` (xảy ra trong kỳ, lớp ghi lúc đó); **trạng thái tính đến hôm nay**; `byKind` khoá `{nhom}:{trangThai}` (nhóm ∈ 5 nhóm + `tat-ca`, trạng thái ∈ `tat-ca · unhandled · preparing · done`). Bảng 5 hàng + hàng Tổng × 4 cột, mỗi ô `SoLieuO` bấm ra đúng tập. Bỏ hai ô `Vi phạm` và `Vi phạm chưa xử lý` ở góc nhìn này (bảng thay) | Tránh hai số cùng tên "Chưa xử lý" mà khác tập (F10); hàng Tổng = `vi-pham-tong` |
| Q18 | Bảng 9 loại PA | 9 hàng × 2 cột: **Đang chuẩn bị** (`bien-phap-dang-chuan-bi` thêm `byKind`, hiện trạng) · **Đã thực hiện** (`bien-phap-theo-loai`, trong kỳ). ⓘ tiêu đề nói hai cột khác mốc thời gian | §7.6 bảng 2; thay 9 ô rời hiện có |
| Q19 | P14 lọc lớp | `metricSet` nhận `classId`; **chỉ** chỉ số Ý thức + Phối hợp dùng — chỉ số khác nhận `classId` → 400 (không lặng lẽ bỏ qua). Lớp ngoài phạm vi → 403. Chỉ số "lớp ghi lúc đó" lọc `v.class_id / m.class_id / a.class_id = ?`; chỉ số hiện trạng (`vi-pham-chua-xu-ly`, `hv-can-xu-ly`) lọc HV **đang học** ở lớp. Ô lớp ở web truyền qua `extra` (`classId`) nên danh sách khi bấm dùng cùng tham số | G-10 + luật 6 hợp đồng số liệu: drill-down cùng quyền, cùng tập |

## Cấu trúc file

| File | Việc |
|---|---|
| `shared/domain/yThucGon.ts` (tạo) + `index.ts` | Luật thuần (Task 1) |
| `server/src/yThuc/measures.ts` | `updateMeasure` + `violationIds`; `buildDetailMany` |
| `server/src/yThuc/violations.ts` | `listViolations` + `activeInClassId`; `deleteViolation` chặn Q15 |
| `server/src/yThuc/board.ts` | `recentByStudent` gọn (YT-14) |
| `server/src/students/profile.ts` | K2-6e (Task 7) |
| `server/src/yThuc/thongKe.ts`, `phoiHop.ts`, `worklist/metrics.ts`, `shared/domain/metrics.ts` | P13, P14, Q18 (Task 8) |
| `server/src/routes/index.ts` | 3 route Ý thức + `GET /classes/:id/violations` + `/metrics/:id` nhận `classId` |
| `server/src/tests/yThucGon.tests.ts` (tạo) + `run.ts` | Phép kiểm (khung `runYThucGonTests(t: YThucTestKit)`, chép cách `form.tests.ts`) |
| `web/src/ui/Toast.tsx`, `web/src/ui/DongThoiGian.tsx` | Toast có nút · dòng mở tại chỗ |
| `web/src/modules/yThuc/ChiTietViPham.tsx`, `panelYThuc.tsx`, `PhuongAnPanel.tsx` (tạo) | YT-1 · YT-13 · YT-2/3 |
| `RecordViolationPanel.tsx`, `ClassYThucCard.tsx`, `XemPhuongAnPanel.tsx`, `StudentYThucSection.tsx`, `YThucAnalysisView.tsx`, `phanTich/PhanTich.tsx` | Như từng Task |

---

## Task 0 · Worktree, nhánh, mốc

- [ ] `git fetch origin`; kiểm Form đã merge (`git log origin/main --oneline | grep -i "PR-Form\|#72"`). **Chưa merge** → dừng, báo planning.
- [ ] `git worktree add .claude/worktrees/pr-yt2-y-thuc-gon -b pr-yt2-y-thuc-gon origin/main`.
- [ ] Chép file kế hoạch này vào nhánh, `npm ci` nếu cần, `npm run check` → ghi mốc **B** (dự kiến ≥ 826).
- [ ] Commit `PR-YT2 (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần (shared) + khung phép kiểm

**Files:** tạo `shared/domain/yThucGon.ts`, sửa `shared/domain/index.ts`; tạo `server/src/tests/yThucGon.tests.ts`, đăng ký
trong `run.ts` ngay sau `runFormTests` (dòng ~9485), cùng bộ tham số.

Hàm (tên gợi ý):
- `demLanSua(history)` (Q8) · `nhanLichSuViPham(h)` → `{ truong, cu, moi }` (nhóm/môn → nhãn qua `VIOLATION_CATEGORY_LABEL`/
  `VIOLATION_SKILL_LABEL`; ngày qua `ngay()` của `hienThiNgay.ts`; `measure`: `null→id` "Gắn vào phương án", `id→null` "Bỏ khỏi phương án").
- `cauCanhBaoTrung(rows)` → `Đã có {n} vi phạm {Nhóm} ngày {dd/mm}` (+ ` chưa xử lý` khi mọi dòng `unhandled`), `null` khi rỗng.
- `chiaThemViPham(tatCa, dangChon)` → `{ chuaXuLy, daXuLy }` (vi phạm không nằm trong tập đang chọn; `unhandled` vs còn lại; mới nhất trước).
- `thanPatchPhuongAn(goc, nhap)` → chỉ trường **đã đổi** (`violationIds` so như **tập**), `null` khi không đổi.
- `tuNgayTheoKhoang(homNay, '7'|'30'|'all')` → ISO hoặc `null`.
- `BO_LOC_PHU` + `hopBoLocPhu(boLoc, x)` (Q13) cho cả dòng HV (`{coChuaXuLy, coPaDangChuanBi, canhBao}`) lẫn dòng vi phạm (`{state, ageLabel}`).
- `trongChuKyHienTai(v, chuKy)` (Q14): `chuKy.cycleId` có → so `v.cycleId`; không → so `v.classId === chuKy.classId`.
- `khoaNhomTrangThai(nhom, trangThai)` + `NHOM_TRANG_THAI_KHOA` (Q17) — dùng chung máy chủ và web.

**Phép kiểm (≥ 11):** `demLanSua` hai lần sửa, lần đầu đổi 2 trường → 2; dòng `measure` không tính · nhãn lịch sử nhóm/môn/
ngày/gắn/bỏ · câu trùng 1 và 2 dòng · `chiaThemViPham` · `thanPatchPhuongAn` (không đổi → `null`; đảo thứ tự tập → `null`;
thêm một vi phạm → chỉ `violationIds`) · `tuNgayTheoKhoang('2026-09-23','30')` = `2026-08-24` · `hopBoLocPhu` ba bộ lọc × hai
loại dòng · `trongChuKyHienTai` FT và lớp thường · `NHOM_TRANG_THAI_KHOA` đủ 24 khoá.
Commit `PR-YT2 (1): luật thuần Ý thức`.

## Task 2 · Máy chủ Ý thức: sửa PA một lần, vi phạm của lớp, chặn xoá, đọc theo lô

**Files:** `measures.ts`, `violations.ts`, `board.ts`, `routes/index.ts`, `tests/yThucGon.tests.ts`, `tests/yThuc.tests.ts`.

1. **`updateMeasure`** (`measures.ts:319-356`) + `violationIds?`: `done` + `violationIds` → lỗi như `requirePreparing`
   (dòng 221). `preparing`: `checkViolationSet` (dòng 210 — không lọc trạng thái nên **gắn được vi phạm đã xử lý**, §3.11);
   thêm/bớt so với `violationIdsOf(id)`; UPDATE PA + INSERT/DELETE `measure_violations` + `noteMeasureChange` từng thay đổi +
   `writeAudit` (violations trước/sau) trong **một** `tx` (UPDATE dòng 347 hiện chưa nằm trong `tx`). Không đổi gì → không audit.
2. **Route:** `PATCH /measures/:id` (routes 870-877) thêm `violationIds: Array.isArray(b.violationIds) ? b.violationIds :
   undefined` · `/students/:id/measure-kinds` (787-790) truyền `{ excludeMeasureId: qInt(req, 'excludeMeasureId') ?? undefined }`.
3. **`listViolations`** (`violations.ts:335-371`) + `activeInClassId` → `v.student_id IN (SELECT student_id FROM enrollments
   WHERE class_id = ? AND status = 'active')` (cách `listMeasures:481`), kiểm `requireViewClass`. **Thêm route**
   `GET /classes/:id/violations` (cạnh `/classes/:id/y-thuc`, routes ~797) nhận `from`, `to`, `category`, `state`. Một `SELECT`.
4. **Chu kỳ (Q14):** `GET /students/:id/violations` (routes 775-781) trả thêm `chuKy: { cycleId: currentCycle(id)?.id ?? null,
   classId: activeClassOf(id) }` cạnh `rows` (thêm trường, không đổi `rows`).
5. **Chặn xoá (Q15):** `deleteViolation` (`violations.ts:304`) — trước `tx`, một câu: PA `preparing` có vi phạm này và
   `COUNT(*) = 1` → `badRequest` câu Q15 (tên PA qua nhãn loại/`custom_name`). Rà `yThuc.tests.ts` tìm phép kiểm đang xoá vi
   phạm duy nhất của PA đang chuẩn bị (V12′) → sửa theo luật mới, **không xoá** phép kiểm.
6. **`listMeasures` theo lô** (Q10): `buildDetailMany(p, rows)` — một câu `measure_violations … IN (…)` (khúc 400 như
   `violationsByIds:92`), một `violationsByIds` cho cả tập, một `SELECT owner_id, COUNT(*) … GROUP BY owner_id` cho tệp,
   `canManageDiscipline`/`requireViewStudent` nhớ theo `studentId`. `buildDetail(p, r)` = `buildDetailMany(p, [r])[0]`.
7. **YT-14 máy chủ** (`board.ts:43-44, 74-78`): `recentByStudent` chỉ trả `{ id, kindLabel, performedOn }`.
8. **TD đã ở `main`:** thêm `/classes/{lopFT}/violations` vào `tocDoDuong.ts` + trần theo luật Q6 của TD; `/classes/3/y-thuc`
   và `/students/{hv}/measures` **không tăng** so với trần.

**Phép kiểm (≥ 12, HTTP theo mẫu `yThuc.tests.ts:1285-1300`):** PATCH thêm 1 + bỏ 1 một lần → `measure_violations` đúng, hai
dòng lịch sử `measure`, một audit · `violationIds: []` → 400 · vi phạm HV khác → 400 · PA `done` + `violationIds` → 400 ·
gắn vi phạm đang ở PA **đã thực hiện** vào PA đang chuẩn bị → được · HTTP `measure-kinds` có Thư cảnh cáo 1 đang chuẩn bị:
không exclude → khoá, có exclude → mở · HTTP `/classes/:id/violations` đủ ba trạng thái, `from` lọc đúng, GV không dạy lớp →
403, HV đã rời lớp không có · `/students/:id/violations` có `chuKy` đúng cho HV FT và HV lớp thường · xoá vi phạm duy nhất của
PA đang chuẩn bị → 400 câu Q15, dữ liệu không đổi · xoá vi phạm duy nhất của PA **đã thực hiện** → được (V14′) ·
`listMeasures({classId})` **JSON bằng hệt** từng `measureDetail` gọi lẻ · `yThuc.tests.ts:1248-1266` sửa thành **so id** 3 PA mới nhất.
Commit `PR-YT2 (2): sửa PA một lần, vi phạm của lớp, chặn xoá vi phạm cuối, chu kỳ, listMeasures theo lô`.

## Task 3 · Web dùng chung: toast có nút, dòng mở tại chỗ, chi tiết vi phạm, một panel một lúc

**Files:** `web/src/ui/Toast.tsx`, `web/src/ui/DongThoiGian.tsx`, tạo `ChiTietViPham.tsx`, `panelYThuc.tsx`.

1. **Toast** (`Toast.tsx:4-12`): `push(kind, text, opts?: { hanhDong?: { nhan: string; onBam: () => void }; ms?: number })`.
   Có `hanhDong` → nút `btn btn-sm btn-ghost` trong toast; bấm → chạy `onBam`, gỡ toast. Chữ ký cũ chạy nguyên.
2. **DongThoiGian** (`DongThoiGian.tsx:14-25, 57-70`): `DongThoiGianMuc` thêm `mo?`, `onMo?`, `chiTiet?: ReactNode`. Có
   `onMo` → `tieuDe` thành nút chữ (`aria-expanded`, canh trái); `mo && chiTiet` → khối `col-span-full` dưới dòng, thẳng mép cột
   nội dung (mockup `.exp`, lưới `auto 1fr`). Lớp Tailwind **tĩnh**.
3. **`ChiTietViPham`** `{ violationId, canManage, boQuaPhuongAnId?, choSuaXoa?, onSua(v), onDaXoa(), onMoPhuongAn(m) }`. Đọc
   `GET /violations/:id` (`violations.ts:373-416`) khi được vẽ. Bốn dòng nhãn/giá trị:
   `Bằng chứng` → `<BangChung ownerType="violation" ownerId canEdit={d.canEdit} tieuDe="" />` · `Phương án` → mỗi PA
   `{kindLabel} · {statusLabel viết thường}` là nút chữ → `onMoPhuongAn` (bỏ `boQuaPhuongAnId`), không có → `—` ·
   `Đã sửa {n} lần · Xem` → danh sách `{Trường}: {cũ} → {mới} · {người} · {dd/mm}` · `Sửa · Xoá` khi `d.canEdit && choSuaXoa
   !== false`; `Xoá` hỏi **trong dòng** `Xoá vi phạm này? Nó sẽ bị gỡ khỏi {n} phương án.` `[Huỷ] [Xoá]` → `api.del` →
   invalidate như `DeleteViolationConfirm.tsx:23` → `onDaXoa()`; lỗi 400 (Q15) hiện câu máy chủ ngay dưới, không đóng.
4. **`usePanelYThuc({ canManage, onDone, roster? })`** → `{ mo, moPhuongAn, panels }`, **một** state:
   `{loai:'ghi', studentId, studentName?} | {loai:'sua', v, quayVe?: number} | {loai:'tao-pa', …} | {loai:'pa', id} |
   {loai:'xac-nhan', id} | {loai:'xem-pa', id} | null`. Mở mới = thay cũ (G-8, YT-13). `sua` đóng mà có `quayVe` →
   `mo({loai:'pa', id: quayVe})`. `moPhuongAn(m)`: `preparing && canManage` → `pa`, còn lại `xem-pa`. Gom `RecordViolationPanel`,
   `CreateMeasurePanel`, `PhuongAnPanel`, `ConfirmMeasurePanel`, `XemPhuongAnPanel`, `DeleteViolationConfirm` — chép cách
   `thaoTacDongHocVien.tsx:28-59`.

**Xong khi:** typecheck xanh (nhánh `pa` trỏ tạm `ConfirmMeasurePanel` tới Task 5).
Commit `PR-YT2 (3): toast có Hoàn tác, dòng mở tại chỗ, chi tiết vi phạm, một panel một lúc`.

## Task 4 · Form Ghi nhận vi phạm (K2-6f, K2-6c, K2-6b, bố cục 09c)

**File:** `web/src/modules/yThuc/RecordViolationPanel.tsx` (props **không đổi**).

1. **Bố cục 09c khối trái:** Học viên (khi có `students`) · **Ngày xảy ra + Môn một hàng** (`grid grid-cols-2 gap-2`) ·
   Nhóm vi phạm (chip, 141-150 giữ) · Mô tả. **Bỏ** ba `hint` (dòng 135, 152, 162-164 — G-5); độ dài tối thiểu nói ở `missing`
   (81-83). Nút gửi `Lưu` (Q11).
2. **Cảnh báo trùng (K2-6b, Q6):** thay khối 170-179 bằng một dòng chữ vàng nhỏ `cauCanhBaoTrung(similar.rows)` + nút chữ
   `Xem` → mở dưới dòng `{mô tả} · {người ghi} · {trạng thái}`. Bỏ `forceNew` (67-69).
3. **Lưu trước (K2-6f, Q4):** state `daGhi: { id, studentName } | null`. POST thành công (95-101) → `setDaGhi`, **không**
   `onClose`. Thân khi `daGhi`: `✓ Đã ghi vi phạm cho {tên}` (chữ phụ, G-1) + `<BangChung ownerType="violation"
   ownerId={daGhi.id} canEdit tieuDe="Bằng chứng" />`. Chân: `Hoàn tác` (trái, `btn-ghost`) · `Xong`. `dong()` (✕/Esc/nền/Xong —
   ý `QuickReport.tsx:145-154`): có `daGhi` → reset, `onClose()`, `onDone?.()`, toast **10 000 ms** kèm `hanhDong: { nhan:
   'Hoàn tác', onBam: hoanTac(id) }`. `hoanTac(id)`: `api.del` → invalidate `/violations /measures /classes /students /y-thuc`
   → toast `Đã hoàn tác`; lỗi → toast lỗi. Nút `Hoàn tác` trong panel gọi cùng hàm rồi đóng, không hiện toast Hoàn tác.
   `idempotencyKey` (47-50) giữ nguyên.
4. **Sửa vi phạm:** khối `Bằng chứng` (`BangChung ownerType="violation" ownerId={violation.id} canEdit`) dưới Mô tả.

Commit `PR-YT2 (4): ghi vi phạm lưu trước + bằng chứng, Hoàn tác 10 giây, cảnh báo trùng một dòng có Xem`.

## Task 5 · Panel Phương án xử lý đang chuẩn bị (YT-2, YT-3)

**File:** tạo `web/src/modules/yThuc/PhuongAnPanel.tsx`; nối vào `panelYThuc.tsx`.

Props `{ measureId, onClose, onDone, onXacNhan(id), onSuaViPham(v, measureId) }`. Dữ liệu: `GET /measures/:id` ·
`GET /students/{studentId}/violations` (một request cho Thêm vi phạm) · `GET /students/{studentId}/measure-kinds?excludeMeasureId={id}`.

Bố cục (mockup 09c khối phải; `Modal` `max-w-xl`):
- Tiêu đề `Phương án xử lý` + nhãn chữ `Đang chuẩn bị` (G-4). Dòng phụ `{HV} · tạo {dd/mm}`.
- **Loại + Phụ trách một hàng** (`grid grid-cols-1 sm:grid-cols-2 gap-2`): `select` chín loại (khoá → `disabled` + lý do) ·
  `ChonNguoi nhom="nhan_vien" choNgoai={false} value={owner} khongDoi={ownerName}` (`null` = không đổi). Loại `other` → ô
  `Tên phương án`. **Nội dung** = `note` (textarea 2 dòng).
- **`Vi phạm · {n}`**: ô tích · `dd/mm` · mô tả (cắt ~60) · nhãn nhóm; mô tả là nút mở `ChiTietViPham` (`boQuaPhuongAnId={id}`,
  `choSuaXoa` = không dirty && không phải vi phạm duy nhất; `onSua` → `onSuaViPham`). Vi phạm cuối cùng: ô `disabled`, `title`
  "Phương án cần ít nhất một vi phạm — không cần nữa thì Xoá phương án".
- **`Thêm vi phạm`**: `chiaThemViPham(...).chuaXuLy` (ô chưa tích). `Xem thêm {n} vi phạm (đã xử lý) ▾` → `daXuLy` (dòng phụ
  ghi trạng thái; tích được — §3.11).
- **`Bằng chứng · {n}`**: `BangChung ownerType="discipline_measure" ownerId canEdit={canManage} tieuDe="" onChanged={reload}`.
- **Chân:** `Xoá` (trái) → hỏi trong chân `Xoá phương án này? Vi phạm quay về Chưa xử lý.` `[Huỷ] [Xoá]` → `DELETE /measures/:id`
  · `Lưu` (mờ khi `thanPatchPhuongAn` = `null` hoặc thiếu) → `PATCH` · `Xác nhận đã thực hiện →` (primary) → có đổi thì PATCH
  trước → `onXacNhan(id)`. Mọi lần ghi: invalidate `/measures /violations /classes /students /y-thuc`, toast `Đã lưu phương án` /
  `Đã xoá phương án`. `ownerUserId`: `toi` → `session.user.id`, `tai_khoan` → `id` (chép `CreateMeasurePanel.tsx:60`).

Commit `PR-YT2 (5): panel Phương án xử lý — sửa loại, phụ trách, nội dung, vi phạm, xoá (YT-2, YT-3)`.

## Task 6 · Hồ sơ lớp (YT-6, YT-7, YT-10, YT-11, YT-12, YT-13, YT-14)

**Files:** `ClassYThucCard.tsx`, `XemPhuongAnPanel.tsx`.

1. Thay 7 state panel (60-66) + khối 305-324 bằng `usePanelYThuc` (roster: dòng 128). `+ Ghi nhận vi phạm` (140) →
   `mo({loai:'ghi', studentId: 0})`; chọn HV trong form đổi `studentId` qua `onPickStudent`.
2. **YT-14:** `rowsForCategory` (85-108) vào `useMemo` đúng phụ thuộc; kiểu `recentByStudent` theo máy chủ mới.
3. **YT-7:** "Vi phạm gần đây" (215-227) = chưa xử lý **+** vi phạm trong PA đang chuẩn bị của em (từ `d.preparing[].violations`,
   không request thêm); dòng phụ `Đang chuẩn bị · {kindLabel}`; chỉ vi phạm chưa xử lý có ô tích. Dòng HV (205): 1 PA →
   `PA: {kindLabel}`, nhiều → `{n} PA đang chuẩn bị`.
4. `Mở phương án` (258) → `mo({loai:'pa', id})`; `Xem` giữ `xem-pa`. **YT-11:** "Gần đây:" (265-270) mỗi tên PA là nút chữ → `xem-pa`.
5. **YT-1:** `muc` vi phạm dùng `onMo`/`mo`/`chiTiet={<ChiTietViPham … />}` (một dòng mở một lúc); bỏ `suaBtn` (133-136) ở cột cuối.
6. **YT-6** (280-290): `GET /classes/:id/violations?from={tuNgayTheoKhoang(homNay, khoang)}` (chỉ khi `byTime`); chip
   `7 ngày · 30 ngày · Tất cả thời gian` (mặc định 30) cạnh hai nút chế độ; lọc Nhóm ở máy khách; dòng phụ `{người ghi} ·
   {trạng thái}`; `rong` = `Không có vi phạm nào trong khoảng này.`. `Theo học sinh` → **`Theo học viên`** (g2-006).
7. **YT-12** (Q13): hàng chip `Tất cả · Chưa xử lý · Có PA đang chuẩn bị · > 5 ngày` dưới hàng Nhóm, áp cả hai chế độ qua
   `hopBoLocPhu`. `> 5 ngày` có `title` "Vi phạm chưa xử lý quá 5 ngày" (G-4: không dùng ⚠ trên chip).

**`XemPhuongAnPanel.tsx` (YT-10):** `d.status === 'done' && d.canManage` → cạnh "Lý do / nội dung" (23-25) nút chữ
`Sửa ghi chú` → textarea + `Lưu` → `PATCH /measures/:id { note }` → `reload()`, toast `Đã lưu ghi chú`.

Commit `PR-YT2 (6): hồ sơ lớp — mở PA để sửa, dòng vi phạm mở tại chỗ, Theo thời gian đủ vi phạm, bộ lọc phụ`.

## Task 7 · Hồ sơ HV + K2-6e + tóm tắt theo chu kỳ — **SAU khi PR-Qb merge**

- [ ] **Kiểm trước:** `git fetch origin && git log origin/main --oneline | grep -i "PR-Qb"`. Chưa có → làm Task 8 (nếu Pb đã
  merge) hoặc dừng chờ, ghi Nhật ký. Có → `git rebase origin/main`, `npm run check` xanh rồi mới sửa.

**Files:** `web/src/modules/yThuc/StudentYThucSection.tsx`, `server/src/students/profile.ts`, `tests/yThucGon.tests.ts`.

1. **`StudentYThucSection.tsx`** (số dòng đo lại sau rebase; Qb thêm prop `canhBao` ở đầu component — **giữ nguyên** phần đó):
   thay state panel (main 61-67) + khối panel (193-210) bằng `usePanelYThuc`; dòng vi phạm (99-115) mở tại chỗ như Task 6,
   bỏ nút `Sửa` ở cột cuối; dòng PA (116-126): `Mở` → `pa`, `Xem` → `xem-pa`; `tuNgayTheoKhoang` thay `addDays` cục bộ (215-219).
2. **Tóm tắt theo chu kỳ (Q14):** đọc `chuKy` từ `/students/:id/violations`; `dem` (dòng 80) và `lastWarning` (82) tính trên
   `vRows.filter(v => trongChuKyHienTai(v, chuKy))` / PA cùng `cycleId` (FT) hoặc cùng `classId` (lớp thường); `preparing` (81)
   giữ đếm hết. ⓘ cạnh hàng ô số (G-5, G-7): `Tính trong lộ trình hiện tại` / `Tính trong khoá đang học`.
3. **K2-6e (Q16)** `profile.ts` (nhánh Qb dòng 926, 929): `classId: current?.class_id ?? null` → `classId: activeClassOf(studentId)`
   (import từ `../yThuc/access.ts`, tính **một lần** trước khối `viewer`). Không đổi `current` ở chỗ khác.

**Phép kiểm (≥ 2):** HV có hai ghi danh `active` mà thứ tự `started_at` ngược thứ tự `id` → `viewer.canRecordViolation` theo
đúng lớp của `activeClassOf` (GV chỉ dạy lớp đó → `true`, GV chỉ dạy lớp kia → `false`) · `canReport` cùng luật.
Commit `PR-YT2 (7): hồ sơ HV — mở PA để sửa, dòng vi phạm mở tại chỗ, đếm theo chu kỳ; một nguồn lớp đang học (K2-6e)`.

## Task 8 · Phân tích › Ý thức & Phối hợp cho QL (P13, P14) — **SAU khi PR-Pb #73 merge**

- [ ] **Kiểm trước:** `git fetch origin && git log origin/main --oneline | grep -i "PR-Pb\|#73"`. Chưa có → làm Task 7 hoặc
  dừng chờ. Có → rebase, `npm run check` xanh. Kiểm P15 còn nguyên (`phoiHopMetric` trả `byKind`, `YThucAnalysisView` có dòng
  phụ SOS 1 · 2 · 3) — **không làm lại**.

**Files:** `server/src/yThuc/thongKe.ts`, `server/src/yThuc/phoiHop.ts`, `server/src/worklist/metrics.ts`,
`shared/domain/metrics.ts`, `server/src/routes/index.ts` (`/metrics/:id`), `web/src/modules/yThuc/YThucAnalysisView.tsx`,
`web/src/modules/phanTich/PhanTich.tsx`, `tests/yThucGon.tests.ts`, `tocDoDuong.ts` (nếu TD đã merge).

**Máy chủ:**
1. **P14 (Q19):** `yThucMetric` (Pb `thongKe.ts:63-135`) và `phoiHopMetric` (Pb `phoiHop.ts:340-386`) nhận `classId?`. Hàm chung
   ở `thongKe.ts` kiểm lớp trong phạm vi (`classes.branch_id` ∈ `scope.branchIds`, `null` = mọi chi nhánh) → ngoài → 403.
   Điều kiện: chỉ số theo lớp ghi → `v.class_id = ?` / `m.class_id = ?` / `a.class_id = ?`; `vi-pham-chua-xu-ly`,
   `hv-can-xu-ly` → `v.student_id IN (HV đang học ở lớp)`. `metricSetGoc` (Pb `metrics.ts:426-455`) + `metricSet` (350) nhận
   `classId`, truyền cho hai nhánh Ý thức/Phối hợp; chỉ số khác có `classId` → 400 `Chỉ số này chưa lọc theo lớp.`. Route
   `/metrics/:id` (Pb routes 920-928) đọc `classId: qInt(req, 'classId')`.
2. **P13 (Q17):** chỉ số **`vi-pham-theo-nhom`** trong `YTHUC_METRIC_IDS` + mục trong sổ `shared/domain/metrics.ts` (cạnh
   `vi-pham-tong`, `donVi: 'vi-pham'`, `thoiGian: 'phat-sinh-trong-ky'`, `tapDuDieuKien` nói "trạng thái tính đến ngày dữ
   liệu", `drilldown: '/metrics/vi-pham-theo-nhom'`). **Một** câu SQL: điều kiện của `vi-pham-tong` + `category` + hai `EXISTS`
   `in_done`/`in_preparing` (như `SELECT` của `violations.ts:48-58`); trạng thái qua `violationState` (shared). `byKind` đủ 24
   khoá `khoaNhomTrangThai`; `kind` lọc `ids` xuống một khoá (khoá lạ → 400).
3. **Q18:** `bien-phap-dang-chuan-bi` (Pb `thongKe.ts:107-112`) thêm `byKind` 9 loại + lọc `kind` (cùng cách
   `bien-phap-theo-loai` 113-131), đổi `SELECT m.id` → `SELECT m.id, m.kind`.
4. **TD đã merge:** thêm `/metrics/vi-pham-theo-nhom` và một đường có `classId` vào `tocDoDuong.ts`, trần theo Q6 của TD.

**Web:**
5. **`PhanTich.tsx`** (Pb): bỏ điều kiện ẩn ô lớp ở Ý thức (Pb dòng 82 `goc === 'y-thuc' ? null`, dòng 119 `goc !== 'y-thuc'`,
   chú thích 81); truyền `classId` cho `YThucAnalysisView` (dòng 138).
6. **`YThucAnalysisView.tsx`** (Pb, 90 dòng) nhận `classId`; `useMetric` thêm `classId` vào query; `period` (dòng 41) đổi
   thành `extra` chung gồm `from` + `classId` để **mọi** `SoLieu`/`SoLieuO` mở danh sách cùng tham số (G-10). Bố cục theo §7.6:
   - **Vi phạm theo nhóm** (bảng, `table-layout: fixed`, cột số canh phải `tabular-nums` — G-2): hàng 5 nhóm + **Tổng**;
     cột `Tổng · Chưa xử lý · Đang chuẩn bị · Đã xử lý`; ô = `SoLieuO id="vi-pham-theo-nhom" extra={{ ...extra, kind }}`.
     Hai ô `Học viên có vi phạm` · `Học viên cần xử lý` giữ ở một hàng nhỏ trên bảng; **bỏ** ô `vi-pham-tong`,
     `vi-pham-chua-xu-ly` khỏi góc nhìn này (Q17).
   - **Phương án xử lý theo loại** (bảng 9 hàng × `Đang chuẩn bị · Đã thực hiện`, Q18) thay 9 ô rời (57-67); hàng tổng dùng
     `bien-phap-dang-chuan-bi` và `bien-phap-da-thuc-hien`.
   - **Phối hợp SOS:** giữ nguyên khối của Pb (71-86), chỉ thêm `classId` vào `extra`.
   - Bỏ hai `SectionNote` (68, 87 — G-5) → ⓘ cạnh tiêu đề bảng: "Ba thư cảnh cáo tách riêng" / "Không có tỷ lệ cải thiện —
     Ý thức chỉ đếm việc đã ghi nhận và đã xử lý".
   - 375px: bảng cuộn ngang **trong thẻ** (G-11).

**Phép kiểm (≥ 8):** `vi-pham-theo-nhom`: hợp các khoá `tat-ca:tat-ca` = tập `vi-pham-tong` cùng bộ lọc · mỗi nhóm × 3 trạng
thái rời nhau và hợp = `{nhom}:tat-ca` · `kind=homework:unhandled` trả đúng tập con · GVCN → rỗng có nhãn (như chỉ số Ý thức
khác) · `classId` lớp ngoài chi nhánh của QL → 403 · `classId` với `vi-pham-tong` chỉ còn vi phạm ghi ở lớp đó; với
`vi-pham-chua-xu-ly` chỉ còn HV đang học lớp đó · `phoi-hop-luot-sos` + `classId` chỉ còn lượt của lớp, `byKind` vẫn cộng
đúng · chỉ số học thuật (`case-mo`) + `classId` → 400 · `bien-phap-dang-chuan-bi` `byKind` cộng đúng `ids` · đếm câu SQL
(nếu TD đã merge, dùng bộ đếm của TD): `vi-pham-theo-nhom` không tăng theo số vi phạm.
Commit `PR-YT2 (8): Phân tích Ý thức — bảng nhóm × trạng thái, bảng 9 loại PA, lọc theo lớp (P13, P14)`.

## Task 9 · Bấm thử theo vai + 375px (một lần), đẩy PR

Máy chủ thử (ghi nhớ "máy chủ dev trong worktree"): trong worktree `npm run seed` → `PORT=4257 node
dist-server/server/src/index.js` (nền) → file Vite **tạm** ở gốc worktree (`port: 5457, strictPort`, proxy `/api` →
`127.0.0.1:4257`, alias `@shared`) → `npx vite --config <file>`; Playwright kênh Chrome (`npm install --no-save playwright`).
Đăng nhập demo `POST /api/demo/session { userId }` (GVCN 7, GVBM 9, QL 2 — như Form). Chữ tiếng Việt gửi qua `node -e "fetch(…)"`.

Kịch bản (mỗi kịch bản ≥ 1 ảnh `thiet-ke/anh/pr-yt2/NN-ten.png`):
1. GVBM (9) · hồ sơ lớp · `+ Ghi nhận vi phạm` → Ngày + Môn một hàng → Lưu → "✓ Đã ghi" + Bằng chứng → Ctrl+V ảnh → Xong →
   toast 10 giây `Hoàn tác`; ghi lần hai rồi bấm `Hoàn tác` → vi phạm biến mất.
2. Cùng HV, cùng nhóm, cùng ngày → một dòng `Đã có 1 vi phạm … · Xem` → Xem mở ngay dưới.
3. GVCN (7) · `Mở phương án` → đổi Loại + Phụ trách, bỏ tích 1, tích 1 ở `Thêm vi phạm`, 1 ở `Xem thêm … (đã xử lý)` → Lưu → mở
   lại thấy đúng. Vi phạm trong PA → `Sửa` → lưu → **quay về** PA. `Xác nhận đã thực hiện →` khi còn thay đổi → lưu rồi mở Xác
   nhận. PA khác → `Xoá` → vi phạm về Chưa xử lý.
4. Dòng vi phạm (lớp và hồ sơ HV) mở tại chỗ: Bằng chứng, Phương án (mở đúng PA), `Đã sửa {n} lần · Xem`, Sửa · Xoá. Xoá vi
   phạm duy nhất của PA đang chuẩn bị ở dòng mở tại chỗ → câu Q15, không xoá. Chỉ một panel mở tại mọi thời điểm.
5. Theo thời gian: đủ ba trạng thái, đổi 7/30/Tất cả; bốn chip bộ lọc phụ ở cả hai chế độ; "Gần đây:" mở PA; PA đã thực hiện
   → `Sửa ghi chú`.
6. Hồ sơ HV FT có vi phạm ở hai lộ trình → ô số chỉ đếm lộ trình hiện tại, ⓘ nói rõ; HV lớp thường → theo khoá đang học.
7. GVBM mở PA → chỉ Xem.
8. **QL (2) · Phân tích › Ý thức & Phối hợp:** bảng nhóm × trạng thái — bấm 3 ô (một ô nhóm, một ô hàng Tổng, một ô Đang chuẩn
   bị) → danh sách đúng số; hàng Tổng khớp tổng vi phạm trong kỳ; bảng 9 loại bấm được cả hai cột; chọn **lớp** → số đổi, bấm
   ô → danh sách chỉ có lớp đó; đổi khoảng thời gian → số đổi; SOS 1 · 2 · 3 vẫn bấm được. Chép dòng `[sql]` của log API
   (nếu TD đã merge) cho góc nhìn này vào Nhật ký.
9. **375px:** kịch bản 1, 3 và 8 — không cuộn ngang trang, Loại/Phụ trách xếp dọc, bảng Phân tích cuộn trong thẻ.

- [ ] Dọn: xoá file Playwright/Vite tạm, tắt hai tiến trình (4257/5457), quét `run.js` treo.
- [ ] `npm run check` xanh lần cuối (≥ B + 33). Rebase `origin/main` nếu PR khác đã merge (gỡ theo bảng Chồng file).
- [ ] Push, mở PR tiêu đề `PR-YT2: Ý thức đầy đủ — sửa phương án xử lý, bằng chứng vi phạm, dòng mở tại chỗ, Phân tích cho QL`
  — thân: tóm tắt theo Task, bảng Q, danh sách ảnh, **"Không migrate"**, mục "Chuyển cho", dòng cuối
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Báo planning (không tự merge, không tự rà).

---

## Mâu thuẫn nguồn ↔ mã thật (đã xử lý)

1. Kiểm kê YT-2 ghi route ở `routes/index.ts:827, 835, 840, 852` — trên nhánh Form là **870, 878, 883, 895**.
2. Kiểm kê YT-13 ("Ghi vi phạm lồng trong Modal"): mã hiện mở panel **tuần tự**; rủi ro nằm ở luồng MỚI → `usePanelYThuc` (Q3, Q6).
3. Mockup 09c ví dụ cảnh báo trùng **khác ngày**; luật V06 và máy chủ là **cùng ngày** → giữ V06 (Q6).
4. Máy chủ có `excludeMeasureId` (`measures.ts:162`) nhưng route không truyền → Task 2 (Q12).
5. `deleteViolation` để PA đang chuẩn bị còn 0 vi phạm (trái B02) → chặn ở máy chủ (Q15); V14′ giữ cho PA đã thực hiện.
6. Nghiệm thu `SOS_VA_PHOI_HOP_V3.md` §10 #10 ("cùng một tập vi phạm ở Theo HS và Theo thời gian") trái với YT-6 (§3.11 đặc
   tả: Theo thời gian = **mọi** vi phạm) → đặc tả thắng; chip `Chưa xử lý` (YT-12) cho lại đúng tập của Theo học viên.
7. Kiểm kê giao P15 cho YT2/Pb — Pb #73 **đã làm** (Q15 của Pb) → không làm lại. Pb Q6 ẩn ô lớp ở Ý thức "vì máy chủ chưa
   nhận lớp" → Task 8 bật lại.
8. `profile.ts` chọn lớp hiện tại theo `started_at DESC`, `activeClassOf` theo `id DESC` → lệch thật khi chuyển lớp (K2-6e, Q16).
9. `ClassYThucCard.tsx:39` nói "Theo thời gian là dòng thời gian lưới" nhưng chỉ lấy vi phạm chưa xử lý → YT-6.

## Chuyển cho (ghi vào thân PR)

- **PR-TD** (nếu merge sau YT2): thêm `/classes/{lopFT}/violations`, `/metrics/vi-pham-theo-nhom`, một đường `/metrics/*?classId=`
  vào `DUONG_DO`.
- **PR-S3 (quét chữ):** `DeleteViolationConfirm` còn là hộp riêng — nơi nào còn dùng thì giữ; dòng mở tại chỗ đã hỏi trong dòng.
- **Planning:** nếu Task 7 hoặc Task 8 phải bỏ vì Qb/Pb chưa merge khi hết giờ → mở PR phần còn lại riêng, ghi rõ trong PR này.

## Nhật ký

| Ngày | Task | Ghi |
|---|---|---|
| 23/09 | 2 | Kế hoạch ghi `chuKy.cycleId = currentCycle(id)?.id ?? null` cho MỌI học viên. Mã thật (`intake.ts` dòng ~430 "mở lộ trình cho mọi em") tạo `learning_cycles` cho CẢ lớp thường, chỉ khác là `route = null` (lớp thường dùng `programme_code`) — `cycleLabel` ở `students/profile.ts:48` cũng phân biệt hai loại bằng `route`. Nếu giữ nguyên như kế hoạch, `cycleId` sẽ khác `null` cho lớp thường, phá luật Q14 ("lớp thường = khoá đang học"). Sửa thành `cyc?.route ? cyc.id : null`. |
| 23/09 | 7 | **Bỏ** — PR-Qb chưa merge vào `origin/main` lúc làm PR này (đã `git fetch` kiểm hai lần, cách nhau các Task 2–9). File cấm chạm khi Qb chưa merge: `StudentYThucSection.tsx`, `StudentDetailPage.tsx`, `JourneyTimeline.tsx`, `HanhTrinh.tsx`, `students/hanhTrinh.ts`, `profile.ts` — không đụng. Hồ sơ HV vẫn dùng `RecordViolationPanel`/`XemPhuongAnPanel` bản MỚI (dùng chung, đã cập nhật ở Task 3/6) nên không có gì hỏng, chỉ riêng dòng vi phạm mở tại chỗ (YT-1) và đếm theo chu kỳ (Q14) của hồ sơ HV còn theo cách CŨ. Mở PR riêng sau khi Qb merge. |
| 23/09 | 9 | Bấm thử: GVCN (Trần Ngọc Hà, MB-FT 101) — ghi vi phạm lưu trước + Hoàn tác, Mở phương án (sửa Loại/Phụ trách/Nội dung/Vi phạm, Thêm vi phạm, Lưu, Sửa vi phạm trong PA → quay lại đúng PA), Theo thời gian (đủ ba trạng thái, chip 7/30/Tất cả, bốn chip bộ lọc phụ), XemPhuongAnPanel → Sửa ghi chú (YT-10). QL (Nguyễn Khánh Vy, Monbay) — Phân tích › Ý thức & Phối hợp: bảng Vi phạm theo nhóm khớp `vi-pham-tong`, bấm ô ra đúng danh sách, đổi lớp số đổi đúng (MB-FOU 12 = 0, MB-FT 101 = hết). 375px: hồ sơ lớp (chip xuống hàng, không cuộn ngang trang) và Phân tích (bảng cuộn trong thẻ). Phát hiện một chỗ nhỏ khi bấm thử: `usePanelYThuc`'s `onPickStudent` không truyền `studentName` nên toast "Đã ghi vi phạm cho học viên" mất tên khi ghi từ trang lớp (chọn HV trong form) — đã sửa tra `roster` để lấy tên. Không bấm thử được scenario 6 (hồ sơ HV đếm theo chu kỳ) vì Task 7 bị bỏ (Qb chưa merge). |
