# PR-UXF-b · Mã tuần + việc sót — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** (1) **Mã tuần toàn web** (Q30-6, B5): chỗ nào nói về một tuần (tuần học, tuần thi, tuần bắt đầu, khai giảng, kết thúc lớp,
khoảng PA, Case mở/xong, ô chọn tuần) thì hiện `W2 OCT`. Ngày `dd/mm` chỉ còn cho **hạn cụ thể, ngày thi, ngày sinh, nhật ký**.
(2) Làm nốt **việc sót** của đợt 5 và lượt 1 đã giao UXF-b: R5-1, R5-3 (đã có), R5-4, R5-5, O1, O2, U5, VN01, VN26, VN28, đường dẫn
sâu G5 ở màn **ngoài** hồ sơ HV (kể cả `attemptHref` bản máy chủ), neo "Kết luận khoá", ô Học thuật của em Tạm dừng.
(3) Không thêm hàm hiển thị tuần thứ hai: mọi chữ mã tuần đi qua **một** hàm `tuanLich`.

**Architecture:** Không bảng mới, **không migrate**. Phần lớn là đổi **chữ trên màn** sang hàm có sẵn. Việc chính là **xoá các bộ định
dạng ngày tự viết** (`dm`, `rangeOf`, `slice(8,10)/slice(5,7)`, `pr.code` có năm) và gọi hàm chung. Hai việc chạm luật (R5-4 Báo PH,
R5-5 Case sau chuyển lớp) đi **sau cùng**, mỗi việc một Task, có phép kiểm phủ định.
Phép kiểm ở `server/src/tests/prUxfB.tests.ts` (`runPrUxfBTests(t)`, đăng ký **cuối** `run.ts`, theo mẫu `prS6fB.tests.ts`).
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); harness `check()` của `run.ts`, chạy `npm run check`.
**Spec:**
- **Nguồn chính:** kiểm kê `docs/superpowers/specs/2026-10-01-kiem-ke-truoc-dot-6.md`, mục (c) lượt 2 làn B, bảng **B5**, các dòng R5-x, O1, O2, U5, VN01, VN26, VN28, K2-26.
- Đặc tả `2026-09-27-nang-cap-sau-deploy-design.md`:
  - §3.1f **Q30-6** (mã tuần) và §7.3 (đoạn "Mã tuần");
  - §3.1g Q31-4 (12 px); §3.1h Q31-7 (KCK), Q31-11 (tuần học thứ n);
  - T65 (Tạm dừng: "Tạm dừng từ dd/mm · mọi hạn đang dừng").
- Bảng việc nhỏ `specs/2026-09-29-viec-nho-sau-ra-dot-2.md`: mọi dòng "PR-UXF" và dòng "Kế hoạch VAI-b 01/10".
- "Chuyển cho PR khác" của: kế hoạch S6F (`plans/2026-10-01-pr-s6f-sua-sau-ra-dot-6.md:440-462`), VAI-b (`:486-495`), UXF-a (`:451-462`), Pb2.
- Báo cáo rà `reviews/2026-10-01-ra-dot-6-luot-1/`: `tich-hop.md` (P2 ô khoảng Phân tích GV, P2 hai tuần Cuối khoá), `vai-b.md:182-183`, `vai-a.md:135`.
- Thân PR #146 ("chú thích nổi bị khung cuộn cắt"), #152 ("ô Học thuật em Tạm dừng vẫn 'Cần làm · xác nhận PA'").
- Mockup 20 màn E (dải "Sắp chuyển … từ W2 OCT · bàn giao n/4 môn"), mockup 25 (khoảng "W1 SEP – W4 SEP").

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-UXF-b** · đợt 6 **lượt 2** · làn **B** · một PR, **không draft**, **không tự merge** |
| Nhánh · worktree | `pr-uxf-b-ma-tuan` · `.claude/worktrees/pr-uxf-b-ma-tuan`, từ `origin/main` @ `0c9c04f6` trở đi |
| Cổng thử | API **4167** · Vite **5367** (Vite tạm ngoài worktree, proxy về 4167). Song song: UXD 4157/5357 · Dọn 4177/5377. Không dùng 4000/5173 |
| Log check | `$env:TEMP\check-uxf-b.log` (tên riêng — `$TEMP` dùng chung giữa các session) |
| Model khuyến nghị | **Sonnet 5.5 · effort High** · phương án B: **Opus 5.5 · High**. **CỰC KỲ KHUYẾN NGHỊ Opus 5.5 cho Task 9 và Task 10** — hai Task này chạm luật lõi (Báo phụ huynh của Giữa khoá lớp thường; Case đi theo em khi chuyển lớp). Session có thể đổi model riêng cho hai Task đó, hoặc chạy cả PR bằng Opus |
| Người rà | **Opus 5.5**, rà **một lượt** cuối lượt 2 đợt 6 (memory "rà PR theo đợt"). Session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model với session, KHÔNG Haiku**. `Co-Authored-By` ghi đúng model thật |
| Migrate? | **Không.** `schema.sql` không đổi. DB reset trước deploy nên không có lệnh dữ liệu cũ |
| Lệnh skill | **`/ponytail lite` đầu phiên** (PR có giao diện). impeccable **`clarify`** ở Task 1, 6, 7, 8 (chữ trên màn) · **`polish`** ở Task 1, 6 (ô chọn tuần, dòng Xin ý kiến) · **`audit`** + **`polish`** (**sáng và tối**) ở Task 11. Không `init`/`document`/`hooks on`/`npx impeccable install|update`. Trước PR: **`/ponytail-review`** |
| Phụ thuộc | Lượt 1 và S6F đã merge. Chạy song song **PR-UXD** và **PR-Dọn** (bảng file chồng dưới). Không cần mockup mới |
| Không làm | bố cục điện thoại, `TheDong`, thanh dưới, toast che nút (VN17) → **PR-UXD** · quyền, gom số câu SQL, năm `0208` ở ô ngày (VN20), `useLoiForm` 7 panel (O5) → **PR-Dọn** · viết đủ "Quản lý" thay "QL" (U6, VN08b), thuật ngữ → **PR-S3** · "Tạm dừng từ dd/mm" giữ ngày (T65) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - chạy `npm run check` **một lần, ở foreground**, log `$env:TEMP\check-uxf-b.log`;
  - xanh, số phép kiểm ≥ mốc B → commit `PR-UXF-b (n): …`.
- Mỗi Task bắt đầu bằng **Phép kiểm trước** — viết xong phải **ĐỎ trên `main`** (chạy một lần, ghi số ✗ vào Nhật ký), rồi mới sửa.
  Chỗ chỉ là chữ JSX (không có hàm thuần để gọi) thì dùng **phép kiểm quét chuỗi** đọc file nguồn (mẫu "Quét chữ" của UXF-a Task 4).
- Sập segfault / OOM → chạy lại **một** lần; sập lặp → chạy thẳng `tsc` + `node dist-server/…/tests/run.js` + `tocDo.run.js`, không qua npm.
  Treo > 10 phút → quét `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`, tắt hết, chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai, 1440 và 375, **sáng và tối**, **một lần** ở Task 11:
  - Playwright kênh Chrome; demo `POST /api/demo/session {userId}`; vai tra `server/src/tests/tocDo.run.ts:451` (QL, GVCN, GVBM, GVCN_THUONG, QT);
  - ảnh vào `thiet-ke/anh/pr-uxf-b/`;
  - API `PORT=4167`, Vite tạm 5367 proxy về 4167 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4167/5367, quét `tests/run.js` treo, dọn file tạm.
- **Cổng gộp** khi UXD hoặc Dọn merge, và ở Task 11: `git fetch origin && git merge origin/main` → gỡ theo bảng file chồng → `npm run check` → ghi Nhật ký.

## MỘT hàm mã tuần — gọi đúng những hàm này, không viết hàm thứ hai

| Việc | Gọi | Ở đâu |
|---|---|---|
| **Chữ mã tuần** `W3 SEP` (thêm năm chỉ khi khác năm hiện tại) | `tuanLich(d, homNay)` | `shared/domain/hienThiNgay.ts:22` — hàm định dạng tuần **duy nhất** |
| Ngày được phép giữ (hạn, ngày thi, ngày sinh, nhật ký) và khoảng ngày làm **chữ phụ** | `ngay(d, homNay)` | `hienThiNgay.ts:15` |
| Khoảng PA `từ W3 SEP` · `W3 SEP → W1 OCT` (+ mốc) | `chuKhoangPa({ startedOn, completedOn, mocChu }, homNay)` | `shared/domain/hoSoHocVien.ts:323` (dựng trên `tuanLich`) |
| Kết quả PA `Tiến bộ một phần · W3 SEP` | `chuKetQuaPa(nhan, ngay, homNay)` | `hoSoHocVien.ts:329` |
| Mốc PA quy chế · PA Bổ trợ | `mocChuPa(…)` · `mocChuBoTro(…)` | `sosV4.ts:31` · `lopThuong.ts:73` |
| Ô chọn tuần (`ONgay kieu="tuan"`, `ChonTuan`, `OTuan`) | `hienONgay` / `phuONgay` / `docONgay` | `shared/domain/oNgay.ts:42,85,91` — sửa **một lần** ở Task 1, 12 nơi gọi tự đúng |
| Gõ mã tuần vào ô (đọc ngược `W4 SEP` → Thứ Hai) | `docTuanLich(text, homNay)` (**mới**, bộ đọc — không phải bộ định dạng) | đặt ngay dưới `tuanLich` trong `hienThiNgay.ts` |
| Tuần học · tuần khoá | `chuTuanHoc(…)` · `tuanKhoa(n, tong)` | `hienThiNgay.ts:33,42` |

Lấy `homNay`: web `const { homNay } = useNgayNghiepVu()` (`web/src/ui/ngayNghiepVu.ts:15`), import `tuanLich` từ `@shared/domain/index.ts`;
máy chủ `demoToday()` hoặc `ngu.homNay` (thẻ Chờ duyệt).

**Cấm:** `pr.code` / `period.code` / `r.code` (`W1 SEP 2026`, có năm — là **khoá dữ liệu**, `platform/week.ts:46,58`) đưa thẳng lên màn;
tự cắt chuỗi ngày (`slice(8, 10)`); hàm `dm`/`rangeOf` cục bộ. Task 1 xoá ba bộ định dạng **không ai gọi**: `weekCodeShortOf`
(`shared/domain/week.ts:58`), `weekLabel` và `formatDateVi` (`server/src/util.ts:62-66, 107-110`).

**Luật một câu cho mọi màn (Q1):** mã tuần là **chữ chính**; khoảng ngày `14/09 – 20/09` chỉ được làm **chữ phụ mờ** hoặc tooltip
(mẫu đã đúng: hồ sơ Mock `MockDetailPage.tsx:195,281,469`, Phân tích › Tổng hợp theo tuần `tongHop.ts:154`, `TuanNho.tsx`).

## Kiểm kê B5 — kết quả quét 01/10 (36 chỗ ĐỔI; mọi chỗ khác GIỮ có lý do)

**Đã xong, gạch khỏi B5** (VAI-b #148, S6F-b #152 — đã kiểm mã): Hành trình (`hanhTrinh.ts:173,222,226-229`, `HanhTrinh.tsx`, `ChuongLop.tsx`),
hàng PA bảng kỹ năng (`SkillBoard.tsx:490-493` dùng `chuKhoangPa`/`chuKetQuaPa`), lịch sử chương `StudentDetailPage.tsx:686`, đầu hồ sơ
"Cuối khoá" lớp thường (`profile.ts:475` ưu tiên tuần bài Cuối khoá — tích hợp P2 đã sửa ở S6F-b Task 8). `boQuen.ts` đã xoá (VAI-a),
`CaseBoardPage.tsx` không còn ngày.

| # | Màn | file:dòng | Đang hiện | Đổi thành | Task |
|---|---|---|---|---|---|
| 1 | Mọi ô chọn tuần (12 nơi: Phân tích GV, Xuất MT, Báo vấn đề, Duyệt dời thi, Thêm HV, Tạm dừng/Quay lại, Chuyển lớp…) | `oNgay.ts:85-88` `hienONgay`, `:91-94` `phuONgay`, `:36-38` lỗi khoảng | ô hiện `24/08/2026`; chữ phụ `W3 SEP · 14/09 – 20/09`; lỗi "Không được trước 14/09" | ô hiện `W4 AUG`; chữ phụ `24/08 – 30/08`; lỗi "Không được trước W3 SEP" | 1 |
| 2 | Bộ chọn tuần đầu trang (Chấm điểm, Tạo lớp, Lộ trình HV, Họp tuần, Lịch Test…) | `ui/Filters.tsx:53-57,182-183` | `14/09 – 20/09` to, `W3 SEP` nhỏ | `W3 SEP` to, `14/09 – 20/09` nhỏ (`ngay`) | 1 |
| 3 | Lịch Test · ô tuần nhỏ | `test/keHoach/TuanNho.tsx:31,39,41` | đúng mẫu, nhưng tự viết `dm` | giữ bố cục, `dm` → `ngay` | 1 |
| 4 | Hồ sơ lớp · Tuần khai giảng | `classes/ClassProgressPanel.tsx:94` | `Khai giảng W3 SEP · 14/09` | `Khai giảng W3 SEP` | 2 |
| 5 | Hồ sơ lớp · lớp đã kết thúc | `classes/DauTrangLop.tsx:137` | `Lớp đã kết thúc 02/11` | `Lớp đã kết thúc W1 NOV` | 2 |
| 6 | Hồ sơ lớp · Phân công · "Đã từng dạy" | `classes/TeacherAssignPanel.tsx:130` | `01/09 → 14/09` | `W1 SEP → W3 SEP` | 2 |
| 7 | Hồ sơ HV · dải Sắp chuyển (**R5-1**) | `classes/DaiChuyenLop.tsx:98` | `… từ W2 OCT · lệnh của X ngày 14/09` | `… từ W2 OCT · lệnh của X` (mockup 20 màn E) | 2 |
| 8 | Chờ duyệt · thẻ Lịch thi (**U5**) | `server/src/duyet/loaiYeuCau.ts:162,166` | `đề nghị W4 SEP 2026` · `thi tuần W4 SEP 2026` | `tuanLich(x.week_start, ngu.homNay)` | 2 |
| 9 | Hồ sơ HV · Lộ trình (lịch MT) | `students/StudentPlanPanel.tsx:181-182` | `W3 SEP 2026` + `14/09/2026` | `W3 SEP` + chữ phụ khoảng ngày | 2 |
| 10 | Hồ sơ HV · panel Tạm dừng/Quay lại (lớp thường) | `students/StudentManagePanel.tsx:322` | `kết thúc W4 OCT 2026` | `kết thúc W4 OCT` | 2 |
| 11 | Học viên & Lớp · bảng lượt Test  **[planning 01/10: GẠCH phần web — `StudentsPage.tsx:451-491` nằm trong `WorkQueue`, mã chết, PR-Dọn xoá. Phần máy chủ chỉ làm nếu `grep` còn màn khác đọc trường này; không thì bỏ]** | `students/StudentsPage.tsx:451,454` (+ máy chủ `fasttrack/attempts.ts:731,815` `pendingWeeks`) | `W3 SEP 2026` | `W3 SEP` (máy chủ trả `weekStart`, web gọi `tuanLich`) | 2 |
| 12 | Ngăn Case · khoảng PA (PA thường) | `cases/CasePanel.tsx:237-238` | `14/09 → 28/09` · `từ 14/09` · `đến 28/09` | `chuKhoangPa(…)` (như hàng PA bảng kỹ năng) | 3 |
| 13 | Ngăn Case · Case đã kết thúc | `cases/CasePanel.tsx:191` | `kết thúc theo dõi 28/09` | `kết thúc theo dõi W1 OCT` | 3 |
| 14 | Ngăn Case · đầu ngăn | `students/NganCase.tsx:173` | `· mở 31/08` | `· mở W1 SEP` | 3 |
| 15 | PA quy chế 1 tháng | `shared/domain/sosV4.ts:38` (`mocChuPa`, nhánh `one_month`) | `1 tháng · đến 18/10` | `1 tháng · đến W3 OCT` (giữ ngày cho `until_exam`, Mini Test) | 3 |
| 16 | Báo vấn đề · trùng Case nhập bù | `cases/QuickReport.tsx:549` + `server/src/cases/cases.ts:1194` (lỗi máy chủ in ISO thô) | `trùng khoảng 01/09 → 14/09`; `2026-09-01 → 2026-09-14` | `trùng khoảng W1 SEP → W3 SEP` (cả hai) | 3 |
| 17 | Báo vấn đề · Case trùng | `cases/QuickReport.tsx:560` | `Mở 31/08` | `Mở W1 SEP` | 3 |
| 18 | Mở Case SOS / Thêm PA | `yThuc/CaseSosControls.tsx:142,214` | `Hôm nay · 14/09` · `hôm nay (14/09)` | `Tuần này · W3 SEP` | 3 |
| 19 | Học viên & Lớp · cột theo dõi Case  **[planning 01/10: GẠCH phần web — `StudentsPage.tsx:451-491` nằm trong `WorkQueue`, mã chết, PR-Dọn xoá. Phần máy chủ chỉ làm nếu `grep` còn màn khác đọc trường này; không thì bỏ]** | `server/src/fasttrack/attempts.ts:154-155` → `StudentsPage.tsx:491` | `Đã hỗ trợ · 14/09` (tự cắt chuỗi) | `Đã hỗ trợ · W3 SEP` | 3 |
| 20 | Hồ sơ HV · Mục tiêu đã đổi | `students/StudentDetailPage.tsx:324` | `lần gần nhất 14/09` | `lần gần nhất W3 SEP` (Q3) | 4 |
| 21 | Phân tích · Vấn đề HV | `server/src/phanTich/vanDeHv.ts:363` | `mở 31/08` | `mở W1 SEP` | 4 |
| 22 | Nhập điểm FT · hạn của ô | `fasttrack/ScoreEntry.tsx:750` | `Thi 14/09 – 20/09 · hạn …` | `Thi W3 SEP · hạn …` (máy chủ đã có `weekStart` ở ô; thiếu thì thêm) | 4 |
| 23 | Trang mẫu thành phần (dev) | `dev/ThanhPhanDemo.tsx:107` | `Thi 14/09 – 20/09` | `Thi W3 SEP` | 4 |

**GIỮ ngày (đúng luật, không đổi):** mọi `<Han>`/"hạn …", "hết Chủ nhật dd/mm" (khoá ô điểm), hạn bàn giao, ngày thi / Mini Test
(`KetLuanKhoa.tsx:174`, `loaiYeuCau.ts:591`, `cycles.ts:79`), nhật ký và lịch sử (CasePanel lịch sử, "Đã xin Quản lý hỗ trợ dd/mm",
"đề xuất dd/mm", "Bổ sung dd/mm", Ý thức, `DaiChuyenLop.tsx:104` "xác nhận dd/mm", audit), "Học viên đã lưu trữ dd/mm", DemoBar, Lưu trữ,
"Dữ liệu đến / hôm nay dd/mm", khung nộp báo cáo Họp tuần (`MeetingPage.tsx:143,146` — là hạn), lịch tháng `LichNho`,
**"Tạm dừng từ dd/mm"** (T65 viết đúng mẫu này — Q2). Chữ phụ khoảng ngày cạnh mã tuần (Q1) giữ.

## File chồng với 2 PR song song lượt 2 (kế hoạch của họ chưa có — theo làn ở `CHUNG-KE-HOACH` và kiểm kê (c))

| File | PR khác (dự kiến) | PR-UXF-b sửa | Ai sở hữu · cách gỡ |
|---|---|---|---|
| `shared/domain/oNgay.ts` | **Dọn** VN20 (năm `0208`, `hop`/`docONgay` :17-20, :57) | `hienONgay`, `phuONgay`, `loiKhoangNgay`, nhánh `kieu==='tuan'` của `docONgay` | **UXF-b** sở hữu phần hiển thị tuần; **Dọn** sở hữu kiểm năm. Khác dòng → giữ cả hai. ⚠ Kế hoạch Dọn (`pr-don-ma-thua-quyen.md:98`) đang ghi UXF-b không sửa file này — planning sửa dòng đó |
| `shared/domain/hienThiNgay.ts` | — | thêm `docTuanLich` | **UXF-b** |
| `server/src/students/profile.ts` | **Dọn** (gom câu `studentProfile`, selector lộ trình) | **không sửa** — ô Học thuật em Tạm dừng sửa ở `shared/domain/hoSoHocVien.ts` (`oHocThuat`) | **Dọn**. (Kế hoạch Dọn `:90` tưởng UXF-b sửa ở đây — không chồng) |
| `web/src/ui/Filters.tsx` (`WeekPicker`), `test/keHoach/TuanNho.tsx` | **UXD** (Lịch Test bộ lọc gọn 375 px, Q31-3) | chữ trong nút chọn tuần (đảo to/nhỏ), bỏ `dm`/`rangeOf` | **UXD** sở hữu bố cục (lớp CSS, ẩn/hiện theo cỡ màn); **UXF-b** sở hữu chữ. PR merge sau áp lại chữ |
| `web/src/modules/cases/SkillBoard.tsx` (`HangPA`, `HangCase`), `cases/TheKyNang.tsx` (`KhoiPa`) | **UXD** (thẻ 375 px) | thêm **một** dòng Xin ý kiến (O1) | **UXD** sở hữu bố cục thẻ; **UXF-b** thêm một khối con. Khác dòng → giữ cả hai |
| `web/src/modules/students/StudentDetailPage.tsx` | **UXD** (bảng Mock Test / Kết quả kiểm tra điện thoại `:528-650`, hàng tab) | `:324` một chữ; đọc `?muc=ket-luan-khoa` + cuộn (Task 5) | **UXD** sở hữu bố cục; UXF-b chỉ một dòng chữ + một khối `useEffect` cuộn. Gộp tay |
| `web/src/modules/students/StudentsPage.tsx`, `BangHocVienLop.tsx` | **UXD** (`TheDong` Học viên & Lớp) | chữ tuần `:451,454,491`; link G5 ô Kết quả gần nhất | **UXD** bố cục; **UXF-b** chữ + `href`. Áp lại |
| `web/src/modules/students/IntakePanel.tsx`, `StudentPlanPanel.tsx`, `classes/ClassProgressPanel.tsx` | **UXD** (D1 Thêm HV dạng thẻ) · **Dọn** (O5 `useLoiForm`) | IntakePanel **không sửa** (ô tuần tự đúng qua `oNgay.ts`); `StudentPlanPanel:181-182`, `ClassProgressPanel:94` một chữ | UXD/Dọn sở hữu file; UXF-b một dòng → áp lại. ⚠ Kế hoạch Dọn (`:82`) ghi `StudentPlanPanel:181` "đã đúng" — thực tế còn `W3 SEP 2026` + `dd/mm/yyyy` (B5 #9) |
| `web/src/modules/cham/LuoiFT.tsx`, `cham/MotKyNang.tsx`, `test/keHoach/ChipKyNang.tsx`, `test/lichTest/KhoiNo.tsx` | **UXD** (lưới chấm, Lịch Test 375 px) | `href` qua `duongDotTest` (G5) | **UXD** bố cục; **UXF-b** chỉ `to=`/`href`. Áp lại |
| `web/src/modules/yThuc/ClassYThucCard.tsx` | **S3** (U6 "QL" → "Quản lý" `:225,228`) — không phải lượt 2 | dòng phụ em sau khi bị từ chối (VN26) | **UXF-b** lượt 2 merge trước S3; S3 gộp sau |
| `server/src/cases/cases.ts` | **Dọn** (`listCases :1781-1796, :1895`, quyền, số câu) | `:1194` chữ lỗi; **xoá** `supportLineOf :2659-2672` + trường `supportLine` (web không vẽ — kế hoạch Dọn chưa nhận); skill board thêm `xinYKien` cho PA (O1, một câu theo lô); R5-5 (nếu lỗi nằm ở `skillSupportBoard`) | **Dọn** sở hữu file; UXF-b sửa khối nhỏ khác hàm. Khác hàm → giữ cả hai |
| `server/src/fasttrack/attempts.ts` | **Dọn** (chỉ nếu quét an toàn cần chia lô) | `attemptHref :1840` → gọi `duongDotTest`; `:154` chữ; `pendingWeeks` thêm `weekStart`; **xoá** `scheduleHeadline :480-490` nếu web không đọc | khác hàm → giữ cả hai |
| `server/src/duyet/loaiYeuCau.ts`, `duyet/yeuCau.ts` | **Dọn** (`duyetNhieu` 400 trước 403 — `yeuCau.ts`) | `loaiYeuCau.ts:162,166` (U5) | khác hàm → giữ cả hai |
| `server/src/worklist/mywork.ts` | **Dọn** (VN18 `lopMap`, `ky_vong_dau_ra` trùng `key`) | `href` việc `ky_vong_dau_ra` (`:1118` khối, thêm `muc`) và `attemptHref` (`:350,:886`) | **Dọn** sở hữu file; UXF-b chỉ `href`. Áp lại |
| `server/src/worklist/metrics.ts` | **Dọn** (gom số câu) | `:145,:160` `href` → `duongDotTest` | khác dòng → giữ cả hai |
| `server/src/util.ts` | **Dọn** (mã chết khác) | **xoá** `weekLabel`, `formatDateVi` | **UXF-b** xoá hai hàm này; Dọn không đụng lại |
| `server/src/yThuc/phoiHop.ts`, `server/src/normal/regular.ts` | — | R5-4 (Task 9) | **UXF-b** |
| `server/src/yThuc/board.ts`, `trangThai.ts` | — | VN26 (Task 7) | **UXF-b** |
| `server/src/tests/run.ts`, `tests/tocDoDuong.ts`, `shared/domain/index.ts`, `CODE_MAP.md` | cả ba PR | khối phép kiểm **cuối** `run.ts`; chỉ thêm dòng | giữ cả hai, thứ tự theo merge |

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 | Mã tuần là **chữ chính**; khoảng ngày chỉ làm chữ phụ mờ / tooltip. Màn đã theo mẫu này (hồ sơ Mock, Tổng hợp theo tuần, `TuanNho`) **giữ** | B5 "Mã tuần chính, khoảng ngày thành phụ/tooltip"; người dùng vẫn cần biết tuần là những ngày nào |
| Q2 | "Tạm dừng từ dd/mm" **giữ ngày** | T65 viết đúng mẫu đó; là ngày một sự kiện (nhật ký), không phải tuần |
| Q3 | Mục tiêu đã đổi "lần gần nhất": **mã tuần** (ngày hiệu lực của mục tiêu là một tuần áp dụng). Nhật ký từng lần đổi (`:703`) giữ ngày | B5 dòng "Mục tiêu đã đổi"; VAI-b Chuyển cho PR khác |
| Q4 | R5-1: **bỏ hẳn** "ngày dd/mm" sau "lệnh của X" ở dải Sắp chuyển | mockup 20 màn E; #143 đã hứa sửa (CT Minor 2) |
| Q5 | "Đã từng dạy" ở panel Phân công: khoảng **mã tuần** | là khoảng dạy (tuần), không phải sự kiện |
| Q6 | Ô chọn tuần: ô hiện **mã tuần**; gõ được **cả** `W4 SEP` (`W4 SEP 2027`) **và** một ngày bất kỳ trong tuần (`22/09`). Placeholder "W4 SEP hoặc dd/mm". Mã tuần không năm = năm hiện tại (đúng chiều ngược của `tuanLich`). Gõ sai → "Gõ mã tuần như W4 SEP, hoặc một ngày trong tuần" | ô hiện mã tuần thì người dùng sẽ gõ mã tuần; `docTuanLich` ~10 dòng, có phép kiểm đi-về |
| Q7 | Bỏ ba bộ định dạng không ai gọi (`weekCodeShortOf`, `weekLabel`, `formatDateVi`) và hàm cục bộ `dm`/`rangeOf` | "một hàm mã tuần"; xoá hơn thêm |
| Q8 | `mocChuPa` chỉ đổi nhánh `one_month`. `until_exam` giữ **ngày thi**, Mini Test giữ ngày, `until_next_mt` đã là mã tuần | luật "ngày chỉ cho ngày thi, hạn" |
| Q9 | G5 ngoài hồ sơ HV: **mọi** đường tới một lượt Test (web và máy chủ) đi qua `duongDotTest(dot, kn?)`. Có kỹ năng cụ thể (dòng bài quá hạn, ô lưới chấm một kỹ năng, chip Lịch Test, dòng Nợ) → thêm `kn`. `attemptHref` máy chủ thành **một dòng** gọi `duongDotTest` (giữ tên để không sửa nơi gọi) | VAI-b Q24 "không ai tự ghép `/mock-test/`" |
| Q10 | Neo Kết luận khoá: tham số hồ sơ mới `muc: 'ket-luan-khoa'` trong `ThamSoHoSo` (`duongHoSo.ts`), URL `?muc=ket-luan-khoa`; hồ sơ cuộn tới `<section id="ket-luan-khoa">` bằng `cuonOnDinh` (như `?dot=`). Việc "Đánh dấu kỳ vọng đầu ra" và nút "Mở hồ sơ" của dòng đó dùng tham số này, kèm `lo-trinh` của lộ trình chứa bài Cuối khoá | VAI-a P2 lặt vặt; một quy ước đường dẫn hồ sơ |
| Q11 | O1: dòng tím Xin ý kiến ở `HangPA` và thẻ `KhoiPa` dùng **đúng chữ** của `CasePanel.tsx:274-283` (tách một thành phần nhỏ `DongXinYKien` dùng 3 nơi). Máy chủ: skill board trả `xinYKien` mỗi PA bằng **một** lần `theCuaDoiTuong('intervention', ids)` cho cả bảng — không N+1 | K3-11; một nguồn chữ |
| Q12 | R5-3 **đã có** (`SkillBoard.tsx:420`, hàng Case chờ duyệt kế hoạch có "hạn" của Quản lý). Chỉ sửa chữ (clarify): "Quản lý hạn 16/09" → "Quản lý duyệt · hạn 16/09" | kiểm mã 01/10 |
| Q13 | Ô Học thuật đầu hồ sơ em Tạm dừng: **mọi** dòng có hạn (Quá hạn **và** Cần làm) thành nhãn "Tạm dừng từ dd/mm" — cùng luật `HangCase` (`SkillBoard.tsx:414-418`) | T65 "mọi hạn dừng"; thân PR #152 |
| Q14 | O2: panel Tạm dừng ghi thêm "n vi phạm Ý thức đang chờ xử lý — tạm dừng hạn" khi n > 0. n = vi phạm còn mở của em (Mới + bắt buộc xử lý) từ **cùng** `trangThaiYThuc` hồ sơ đã tính — truyền qua prop / dữ liệu hồ sơ đã nạp, **không** thêm câu SQL | K3-41; một nguồn số |
| Q15 | VN26: em về nhóm "bắt buộc xử lý" **vì Quản lý từ chối** (không phải vì ≥ 3 vi phạm / 2 tuần) → dòng phụ "Quản lý từ chối {biện pháp} · chọn biện pháp khác · bậc kế tiếp …", không ghi "n vi phạm / 2 tuần". Máy chủ thêm `tuChoi: { nhan } \| null` vào `DongEm` (`yThuc/board.ts:33`) từ lần xử lý `tu_choi` gần nhất còn giữ vi phạm mở | rà cuối đợt 3 B; câu cũ gợi luật 3 vi phạm sai chỗ |
| Q16 | VN28: ô Việc tiếp theo giữ đủ tiền tố "hạn" — "· hạn hết T2 14/09". Bỏ `boTienTo` (`hocVienLop.ts:335`) | `<Han>` toàn web đã nói "hạn hết T2" |
| Q17 | VN01: lý do thẻ Chờ duyệt hiện xuống dòng (`whitespace-pre-line` ở `TheYeuCau.tsx:154`) — "Bổ sung dd/mm: …" là dòng riêng | rà #117 lần 2 |
| Q18 | Chú thích nổi bảng Phân tích GV bị khung cuộn cắt khi bảng 1–2 hàng (#146): sửa ở `polish` Task 11 — chú thích bật lên trên khi gần đáy khung, hoặc khung có `min-height` đủ một chú thích. Chọn cách ít mã | thân PR #146 |
| Q20 | **U12** (bảng Kết quả kiểm tra lớp thường theo mẫu K4-33, kiểm kê B3 "nếu chủ SP muốn") **không làm** ở PR này — kế hoạch UXD có chuyển sang UXF-b, nhưng chưa có yêu cầu của chủ sản phẩm. `LichTestTab.tsx:171` (`tenTuan`) đã dùng `tuanLich` — không sửa | không tự thêm việc ngoài phạm vi đã duyệt |
| Q19 | **K2-26 không làm** cho tới khi chủ sản phẩm trả lời Câu 1 (mặc định A = bỏ) | kiểm kê (d) planning đã nghiêng "bỏ"; người giao việc dặn hỏi lại |

## Global Constraints

- **Một hàm mã tuần** (bảng trên). Quét cuối PR: `git grep -nE "slice\(8, ?10\).*slice\(5, ?7\)|rangeOf|weekCodeShortOf|formatDateVi"` trong `web/src`, `server/src`, `shared`
  (trừ `tests/`, `seed/`) → chỉ còn `hienThiNgay.ts`/`oNgay.ts`/`display.ts`. Ghi kết quả vào thân PR.
- **Quyền:** Task 5 (đường dẫn), 6 (Xin ý kiến), 9, 10 có **phép kiểm PHỦ ĐỊNH**: người ngoài phạm vi không thấy dòng / không mở được.
- **SQL (Turso):**
  - chỉ `?` — không tham số đặt tên;
  - `IN (…)` qua `theoLo`, ≤ 900 tham số; UNION ≤ 20 vế;
  - **không N+1** — `xinYKien` một câu cho cả bảng kỹ năng; Báo PH đọc Case theo lô;
  - ghi trong `tx()` (`BEGIN IMMEDIATE`);
  - ngày nghiệp vụ `demoToday()` / `useNgayNghiepVu().homNay`.
- **Tốc độ:** đường đổi số câu → đo lại trong `tests/tocDoDuong.ts` (`/students/{id}/skill-board`, `/my-work`). Trần mới = `max(sau+10, ⌈sau×1.3⌉)`.
  **Không nâng trần cũ quá 30 %**; vượt → Nhật ký, báo planning. Không thêm route mới (nếu buộc phải thêm → có trần).
- **Giao diện:**
  - `/ponytail lite`;
  - **cỡ chữ Q31-4**: kết quả, hạn, người phụ trách **12 px**; nhãn nhỏ 11–11,5 px (`Nhan`);
  - token màu, không màu cứng; cột thẳng, `tabular-nums`, không dồn chữ;
  - không mã thô trên màn (`len_lop`, `W1 SEP 2026` của năm hiện tại);
  - FT "tuần học thứ n", không bao giờ "n/16"; không "ca tối"/"đổi ca"; không "Cả hai";
  - ▾ nhỏ dùng SVG (bẫy Inter); `td` sticky → mỗi nhóm một bảng.
- **Phép kiểm:**
  - tạo `server/src/tests/prUxfB.tests.ts` (`runPrUxfBTests(t)`, đăng ký **cuối** `run.ts`);
  - ngày demo 14/09/2026 (W3 SEP) (`seed/data.ts:15`);
  - phép kiểm cũ đổi kỳ vọng thì **sửa**, không xoá (dự kiến: `hocVienLop.tests.ts`, `panelUx3.tests.ts`, `prDuyet.tests.ts`, `prHvl.tests.ts` có chữ "hết T2";
    phép kiểm `oNgay`; phép kiểm `mocChuPa`);
  - **tổng số phép kiểm không giảm**.
- **Không bớt** (CLAUDE.md): kiểm dữ liệu nhập (ô tuần gõ sai vẫn báo lỗi rõ), quyền, chống mất dữ liệu. `ponytail:` được phép, liệt kê trong thân PR.

## Hướng dẫn riêng cho phương án B (Opus 5.5) và cho Task 9, 10

1. Task 1–8 chủ yếu là chữ: không đổi luật, không đổi số. Thấy chỗ mã tuần cần đổi luật (ví dụ hạn) → **giữ ngày**, ghi Nhật ký.
2. Task 9, 10: **tái hiện trước bằng phép kiểm** (đỏ trên `main`), rồi mới sửa. Không tái hiện được → ghi Nhật ký "không có lỗi", không sửa.
3. Không tự đổi luật SOS, luật Cuối khoá / Giữa khoá, luật chuyển lớp. Chỉ đọc chúng; chỗ phải chọn luật làm đúng Q và câu trả lời chủ sản phẩm.

## Task 0 · Chuẩn bị

- [ ] Ghi **model thật** của phiên (dòng hệ thống / `Co-Authored-By` mặc định) vào Nhật ký; sẽ chép vào thân PR. Task 9, 10: ghi model dùng cho từng Task.
- [ ] Worktree `.claude/worktrees/pr-uxf-b-ma-tuan` từ `origin/main`; `/ponytail lite`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm chính + tốc độ; main 01/10 ≈ 2232 + 29) vào Nhật ký.
- [ ] Đọc nguồn:
  - kiểm kê B5 + dòng R5-x, O1, O2, U5, VN01/26/28, K2-26; đặc tả §3.1f Q30-6, §7.3;
  - `shared/domain/hienThiNgay.ts`, `oNgay.ts`, `hoSoHocVien.ts:320-335`, `sosV4.ts:25-40`, `duongHoSo.ts:1-70`;
  - `SkillBoard.tsx:365-560`, `TheKyNang.tsx:79-160`, `CasePanel.tsx:180-310`;
  - `yThuc/phoiHop.ts:96-135`, `normal/regular.ts:760-775`, `yThuc/board.ts:25-70`.
- [ ] Commit `PR-UXF-b (0): kế hoạch + mốc {B}`.

## Task 1 · Ô chọn tuần và bộ chọn tuần nói mã tuần (B5 #1–3) — impeccable `clarify` + `polish`

**Files:** `shared/domain/hienThiNgay.ts` (thêm `docTuanLich`) · `shared/domain/oNgay.ts` (`hienONgay :85`, `phuONgay :91`, `loiKhoangNgay :36`, `docONgay :42`) ·
`web/src/ui/ONgay.tsx` (`hienONgay(value, kieu)` thêm `homNay`; placeholder) · `web/src/ui/Filters.tsx` (`WeekPicker :86-210`, xoá `dm`/`rangeOf :53-57`) ·
`web/src/modules/test/keHoach/TuanNho.tsx:31` · xoá `shared/domain/week.ts:58` `weekCodeShortOf`, `server/src/util.ts` `weekLabel`/`formatDateVi`.

Hiện trạng:
- `ONgay kieu="tuan"` (12 nơi gọi, kể cả `ChonTuan`, `OTuan`) hiện **Thứ Hai dạng `dd/mm/yyyy`** trong ô — đây là gốc của "24/08/2026" ở Phân tích GV (tích hợp P2).
- `WeekPicker` hiện khoảng ngày to, mã tuần nhỏ.

```ts
/** Đọc ngược `tuanLich`: "W4 SEP" / "w4 sep 2027" → Thứ Hai của tuần đó; không có năm = năm của tuần chứa `homNay`. Sai → null. */
export function docTuanLich(text: string, homNay: string): string | null;
```
- [ ] **Phép kiểm trước:**
  - đi-về: mọi Thứ Hai từ 2026-01-05 tới 2027-12-27 → `docTuanLich(tuanLich(t2, homNay), homNay) === t2` (homNay = 2026-09-14, và = 2027-01-11);
  - `docTuanLich('W9 SEP', h)` = null; `'W4 ABC'` = null; `' w4 sep '` nhận;
  - `hienONgay('2026-08-24', 'tuan', '2026-09-14')` = `W4 AUG`; `phuONgay(…)` = `24/08 – 30/08`;
  - `docONgay('W4 SEP', 'tuan', …)` = Thứ Hai 21/09; `docONgay('23/09', 'tuan', …)` = 21/09 như hôm nay (gõ ngày vẫn nhận; `moc="cuoi"` vẫn ra Chủ nhật);
  - lỗi khoảng với `kieu='tuan'` nói mã tuần ("Không được trước W3 SEP");
  - quét chuỗi: `Filters.tsx` không còn `rangeOf`/`dm`; `TuanNho.tsx` không còn `dm`; không còn `weekCodeShortOf`, `formatDateVi`, `function weekLabel`.
- [ ] Shared: `docTuanLich` cạnh `tuanLich`; `hienONgay(iso, kieu, homNay?)` nhánh `tuan` → `tuanLich`; `phuONgay` nhánh `tuan` → `ngay(t2) – ngay(t2+6)`;
  `docONgay` nhánh `tuan`: thử `docTuanLich` trước, rồi đọc ngày như cũ — cả hai đều qua `chotTuan` (giữ luật `moc="cuoi"`); `loiKhoangNgay` nhận `kieu` để nói mã tuần.
- [ ] Web: `ONgay` truyền `homNay` cho `hienONgay`; placeholder `kieu==='tuan'` = "W4 SEP hoặc dd/mm"; `WeekPicker` đảo: `tuanLich` chữ chính, khoảng ngày (`ngay`) chữ phụ; `TuanNho` `dm` → `ngay`.
- [ ] **clarify:** placeholder, câu lỗi ô tuần, `aria-label` nút ‹ › giữ "Tuần trước · W2 SEP". **polish:** ô tuần 1440 + 375 không đổi chiều rộng, không nhảy chữ khi chọn.
- [ ] `npm run check` → commit `PR-UXF-b (1): ô chọn tuần và bộ chọn tuần nói mã tuần; gõ được "W4 SEP"; bỏ bộ định dạng thừa`.

## Task 2 · Hồ sơ lớp, dải chuyển lớp, thẻ Lịch thi, lịch MT (B5 #4–11, R5-1, U5)

**Files:** `classes/ClassProgressPanel.tsx:94` · `classes/DauTrangLop.tsx:137` · `classes/TeacherAssignPanel.tsx:130` · `classes/DaiChuyenLop.tsx:98` ·
`server/src/duyet/loaiYeuCau.ts:146,162,166` · `students/StudentPlanPanel.tsx:181-182` · `students/StudentManagePanel.tsx:322` ·
`students/StudentsPage.tsx:451,454` + `server/src/fasttrack/attempts.ts:731,815` (`pendingWeeks`).

- [ ] **Phép kiểm trước:**
  - U5: `moTa` thẻ `lich_thi` (seed có thẻ dời thi chờ duyệt) → `dong[0]` chứa `đề nghị W4 SEP`, **không** chứa `2026`; `neuDuyet` = `… thi tuần W4 SEP.`;
  - lượt ở năm khác (tạo tuần 2027) → có năm (đúng luật `tuanLich`);
  - `pendingWeeks` mỗi phần tử có `weekStart`; quét chữ: `StudentsPage.tsx`, `StudentPlanPanel.tsx`, `StudentManagePanel.tsx` không in `.code` của tuần;
  - quét chữ: `DaiChuyenLop.tsx` không còn `ngày {ngay(dai.ngayRaLenh`; `ClassProgressPanel.tsx:94` không `ngay(data.startWeekStart`; `DauTrangLop.tsx` không `ngay(data.finishedAt`; `TeacherAssignPanel.tsx` khoảng dùng `tuanLich`.
- [ ] Sửa theo bảng B5 #4–11. Máy chủ thẻ Lịch thi dùng `pr.week_start` (đã có trong câu `:146`) → `tuanLich(x.week_start, ngu.homNay)` cho cả `dong` và `neuDuyet`.
  `pendingWeeks`: trả `{ code, weekStart }[]` (hoặc chỉ `weekStart`) — chọn một, sửa nơi đọc, ghi Nhật ký.
- [ ] `npm run check` → commit `PR-UXF-b (2): hồ sơ lớp, dải Sắp chuyển, thẻ Lịch thi, lịch MT nói mã tuần (R5-1, U5)`.

## Task 3 · Case và PA nói mã tuần (B5 #12–19)

**Files:** `cases/CasePanel.tsx:191,237-238` · `students/NganCase.tsx:173` · `shared/domain/sosV4.ts:38` (`mocChuPa`) · `cases/QuickReport.tsx:549,560` ·
`server/src/cases/cases.ts:1194, 2659-2672` · `yThuc/CaseSosControls.tsx:142,214` · `server/src/fasttrack/attempts.ts:154-155, 480-490`.

- [ ] **Phép kiểm trước:**
  - `mocChuPa({ span: 'one_month', followupDue: '2026-10-18', mtKe: null, daXacNhan: true }, '2026-09-14')` = `1 tháng · đến W3 OCT`
    (tính đúng tuần chứa 18/10 bằng `tuanLich`); `until_exam` vẫn `đến lúc thi · đến 20/11`; `mini_test` vẫn ngày;
  - nhập bù trùng khoảng → lỗi 400 chứa `W1 SEP → W3 SEP`, không chứa `2026-09`;
  - `caseFollowUp` em có PA xong 14/09 → `Đã hỗ trợ · W3 SEP`;
  - quét chữ: `CasePanel.tsx` khoảng PA gọi `chuKhoangPa`; không còn `kết thúc theo dõi {ngan(`; `NganCase.tsx` không `mở {ngan(`; `QuickReport.tsx` hai chỗ; `CaseSosControls.tsx` hai chỗ.
- [ ] Sửa theo bảng B5. Ngăn Case PA Bổ trợ (`iv.kind === 'bo_tro'`) đã dùng `tuanLich` — gộp vào cùng `chuKhoangPa`, bỏ hàm `tu` cục bộ.
  `CaseSosControls`: "Tuần này · W3 SEP" (Case/PA bắt đầu tuần này).
- [ ] Xoá hai chữ ngày **không ai vẽ** (thay vì đổi chữ): `supportLineOf` + trường `supportLine` (`cases.ts:2659-2672`, kiểu `SkillBoard.tsx:119`) và `scheduleHeadline` (`attempts.ts:480-490`) — `git grep` xác nhận web không đọc trước khi xoá; còn ai đọc thì đổi sang `tuanLich` thay vì xoá.
- [ ] `npm run check` → commit `PR-UXF-b (3): Case và PA nói mã tuần — Ngăn Case, PA quy chế 1 tháng, Báo vấn đề`.

## Task 4 · Phân tích, nhập điểm, Mục tiêu đã đổi (B5 #20–23)

**Files:** `server/src/phanTich/vanDeHv.ts:363` · `fasttrack/ScoreEntry.tsx:750` (+ kiểu ô `:39-41`) · `students/StudentDetailPage.tsx:324` · `dev/ThanhPhanDemo.tsx:107`.

- [ ] **Phép kiểm trước:**
  - Vấn đề HV (QL, lớp FT): `sub` mỗi dòng Case có `mở W` và không có `/` ngày;
  - ô nhập điểm FT có `weekStart` (máy chủ `attempts.ts:410` đã trả `weekRange`; kiểm có `weekStart`/`periodStart` chưa — chưa thì thêm cùng câu);
  - quét chữ: `ScoreEntry.tsx` không còn `Thi ${cell.weekRange`; `StudentDetailPage.tsx:324` dùng `tuanLich`; `ThanhPhanDemo.tsx` không `14/09 – 20/09`.
- [ ] Sửa theo bảng B5 #20–23 (Q3).
- [ ] `npm run check` → commit `PR-UXF-b (4): Phân tích, ô nhập điểm, Mục tiêu đã đổi nói mã tuần`.

## Task 5 · Đường dẫn sâu G5 ngoài hồ sơ HV + `attemptHref` máy chủ + neo Kết luận khoá

**Files:** `server/src/fasttrack/attempts.ts:1840` (`attemptHref`) · `server/src/worklist/metrics.ts:145,160` · `server/src/worklist/mywork.ts:350,886,1118` ·
`shared/domain/duongHoSo.ts` (`ThamSoHoSo.muc`, `duongHoSoHocVien`, `docThamSoHoSo`; thông báo `:164,167`) ·
`web/src/modules/cham/LuoiFT.tsx:237` · `cham/MotKyNang.tsx:188` · `test/keHoach/ChipKyNang.tsx:71` · `test/lichTest/KhoiNo.tsx` ·
`students/BangHocVienLop.tsx` (ô Kết quả gần nhất) · `cases/CasePanel.tsx` (lịch sử: dòng mốc MT, `buildLichSu :368`) ·
`students/StudentDetailPage.tsx` (đọc `muc`) · `students/KetLuanKhoa.tsx:49` (`id="ket-luan-khoa"`).

- [ ] **Phép kiểm trước:**
  - `attemptHref(a)` máy chủ = `duongDotTest(a)` với mọi mẫu (mock · progress có lớp · final không lớp);
  - quét chuỗi: `web/src`, `server/src` (trừ `tests/`, `App.tsx` route, `duongHoSo.ts` chính hàm) **không** còn `` `/mock-test/${`` và `` `/bang-diem-thuong/${…}?kind=`` tự ghép;
  - dòng bấm ra của `bai-qua-han-nhap-diem` (`rowsFor('bai')`): `href` có `?kn=` đúng kỹ năng của ô (FT); lớp thường bỏ `kn`;
  - `duongHoSoHocVien(5, { muc: 'ket-luan-khoa' })` = `/hoc-vien/5?muc=ket-luan-khoa`; `docThamSoHoSo` đọc lại được; `muc` lạ bị bỏ;
  - việc `ky_vong_dau_ra` (`/my-work` QL) có `href` chứa `muc=ket-luan-khoa` và `lo-trinh=` của lộ trình có bài Cuối khoá;
  - **phủ định:** GV không dạy lớp mở `/mock-test/{id}?kn=speaking` của lớp khác → vẫn bị chặn như không có `kn`.
- [ ] Máy chủ: `attemptHref` một dòng `return duongDotTest(a)`; `metrics.ts:145,160` → `duongDotTest({ id, kind, classId }, kyNang)`; thông báo `duongHoSo.ts:164,167` qua `duongDotTest`.
- [ ] Web: bốn chỗ tự ghép (`LuoiFT`, `MotKyNang`, `ChipKyNang`, dòng Nợ `KhoiNo`) → `duongDotTest(…, kn)`; ô Kết quả gần nhất Học viên & Lớp: mã lượt là link `duongDotTest`;
  dòng mốc MT trong lịch sử Ngăn Case: link tới đợt. Hồ sơ HV: `?muc=ket-luan-khoa` → `cuonOnDinh(() => document.getElementById('ket-luan-khoa'))` (như `?dot=` `:121`).
- [ ] `npm run check` → commit `PR-UXF-b (5): một đường tới lượt Test ở mọi màn (G5); neo Kết luận khoá`.

## Task 6 · Bảng kỹ năng: Xin ý kiến ở hàng PA (O1), hạn duyệt kế hoạch (R5-3), ô Học thuật em Tạm dừng — impeccable `clarify` + `polish`

**Files:** `server/src/cases/cases.ts` (skill board, khối PA `:2500-2540`; `theCuaDoiTuong` đã import `:39`) · `web/src/modules/cases/SkillBoard.tsx` (`Plan` `:34`, `HangPA :482`, `HangCase :420`) ·
`cases/TheKyNang.tsx` (`KhoiPa :127`) · `cases/CasePanel.tsx:273-283` (tách `DongXinYKien`) · `shared/domain/hoSoHocVien.ts` (`oHocThuat :246-275`).

- [ ] **Phép kiểm trước:**
  - O1: PA có thẻ Xin ý kiến `cho` → `/students/{id}/skill-board` trả `plans[].xinYKien.trangThai = 'cho'`; đã trả lời → `'da_tra_loi'` + `traLoi`; `tu_dong` → null;
  - O1 số câu: đếm câu `/students/1/skill-board` **+ ≤ 1** so với mốc B (một câu cho cả bảng);
  - **phủ định:** người không xem được Case không nhận `xinYKien` (bảng vốn đã lọc quyền — kiểm vẫn đúng);
  - Q13: `oHocThuat(rows, '2026-09-10')` với một dòng `can-lam` có hạn → `t = 'tam-dung'`, `nhan` "Tạm dừng từ 10/09"; không Tạm dừng → giữ `can-lam`;
  - quét chữ: `SkillBoard.tsx` có `DongXinYKien` trong `HangPA`; `TheKyNang.tsx` trong `KhoiPa`.
- [ ] Máy chủ: khối PA skill board gắn `xinYKien` từ **một** lần `theCuaDoiTuong('intervention', idsPa)` (lọc như `cases.ts:1517`).
- [ ] Web: `DongXinYKien` (chữ tím, 12 px, giống hệt `CasePanel` hiện nay) dùng ở `CasePanel`, `HangPA`, `KhoiPa`. R5-3 chữ `HangCase :420` → "Quản lý duyệt · hạn dd/mm" (Q12).
- [ ] Shared `oHocThuat`: điều kiện `t === 'qua-han'` → mọi dòng có hạn (`qua-han`, `can-lam`) khi `tamDungTu` (Q13).
- [ ] **clarify:** chữ dòng tím ở hàng PA ngắn (≤ 60 ký tự, bản đầy đủ ở tooltip). **polish:** hàng PA không cao thêm quá một dòng; thẻ 375 px không tràn.
- [ ] `tocDoDuong`: `/students/{id}/skill-board` đo lại.
- [ ] `npm run check` → commit `PR-UXF-b (6): hàng PA hiện Xin ý kiến; ô Học thuật em Tạm dừng; chữ hạn duyệt kế hoạch`.

## Task 7 · Panel Tạm dừng đếm vi phạm (O2) + dòng em Ý thức sau khi Quản lý từ chối (VN26) — impeccable `clarify`

**Files:** `web/src/modules/students/StudentManagePanel.tsx:83-115` · nguồn số: dữ liệu hồ sơ đã nạp (`profile.ts:424-427` `oYThuc` có `soBatBuoc`, `soMo`) ·
`server/src/yThuc/board.ts:33,56-68` (`DongEm`, `dongEm`) · `web/src/modules/yThuc/kieu.ts:47` · `yThuc/ClassYThucCard.tsx:223-230`.

- [ ] **Phép kiểm trước:**
  - O2: em (seed `yThucSeed`) có 2 vi phạm mở → nguồn số panel = 2 = số "vi phạm" ô Ý thức hồ sơ (hai đường, một hàm); em không vi phạm → không có câu;
  - VN26: em (g) Kiều Minh Đức — đề xuất Đình chỉ bị từ chối (`yThucSeed.ts:179`) → `dongEm(...).tuChoi.nhan` = "Đình chỉ"; em vào bắt buộc vì 3 vi phạm/2 tuần → `tuChoi = null`;
  - quét chữ: `ClassYThucCard.tsx` nhánh `tuChoi` không in `vi phạm / 2 tuần`.
- [ ] O2: truyền `soViPhamMo` từ dữ liệu hồ sơ vào `TrangThaiPanel` (không thêm `useApi`, không câu SQL); câu "n vi phạm Ý thức đang chờ xử lý — tạm dừng hạn; Quay lại thì hạn tính lại từ ngày quay lại." ghép vào `heQuaCase` (Q14).
- [ ] VN26: `dongEm` thêm `tuChoi` (lần `tu_choi` gần nhất mà vi phạm của nó còn mở — dữ liệu `em.xuLy` sẵn có, không câu mới); web dòng phụ theo Q15.
- [ ] **clarify:** hai câu trên (≤ 60 ký tự dòng phụ).
- [ ] `npm run check` → commit `PR-UXF-b (7): panel Tạm dừng nói vi phạm đang dừng hạn; dòng em sau khi Quản lý từ chối nói đúng lý do`.

## Task 8 · Chữ nhỏ: lý do nhiều dòng (VN01), "hạn hết T2" (VN28) — impeccable `clarify`

**Files:** `web/src/modules/duyet/TheYeuCau.tsx:154` · `shared/domain/hocVienLop.ts:335,366,376,396,406` (`boTienTo`) · phép kiểm cũ có "hết T2".

- [ ] **Phép kiểm trước:**
  - VN01: quét chữ `TheYeuCau.tsx` — `yc.dong` vẽ với `whitespace-pre-line`;
  - VN28: `viecTiepCuaEm` với PA hạn Thứ Hai 14/09 → `han` = `hạn hết T2 14/09` (không còn bản bỏ "hạn").
- [ ] Sửa: thêm lớp `whitespace-pre-line` cho `<p>` lý do; xoá `boTienTo`, các chỗ gọi lấy nguyên `d.han`.
- [ ] Sửa kỳ vọng `hocVienLop.tests.ts`, `panelUx3.tests.ts`, `prDuyet.tests.ts`, `prHvl.tests.ts` nếu đang chờ "hết T2 …" (sửa, không xoá).
- [ ] `npm run check` → commit `PR-UXF-b (8): lý do thẻ Chờ duyệt xuống dòng; ô hạn nói đủ "hạn hết T2"`.

## Task 9 · Báo phụ huynh qua TVV theo Case, không theo môn trượt (R5-4) — **CỰC KỲ KHUYẾN NGHỊ Opus 5.5** (luật Giữa khoá lớp thường)

**Files:** `server/src/yThuc/phoiHop.ts:96-135` (`dongBoBaoPh`) · `server/src/normal/regular.ts:769` · đường đóng Case Giữa khoá
(duyệt "Không cần theo dõi", rút Case khi sửa điểm — tìm nơi đổi `sos_cases.state` của Case `dot='giua-khoa'`) · nội dung 4 mục `phoiHop.ts:154` ("môn khó khăn").

Hiện trạng: `regular.ts:769` gọi `dongBoBaoPh(a, môn có outcome 'fail')` — việc Báo PH tạo / giữ theo **môn trượt của bài**, kể cả khi Case
môn đó đã được duyệt "Không cần theo dõi". Planning chốt (kiểm kê (d)): Báo PH **theo Case**.

- [ ] **Theo câu trả lời Câu 2** (mặc định A). Với A — "môn tính" = môn có Case Giữa khoá của bài **không** ở trạng thái "Không cần theo dõi" đã duyệt và **không** bị rút vì sửa điểm (Case mở **hoặc** đã xong đều tính).
- [ ] **Phép kiểm trước** (lớp thường seed `lt2aSeed`):
  - bài Giữa khoá trượt R và G+V, hai Case → một việc Báo PH, "môn khó khăn" = `R, G+V`;
  - Case G+V được duyệt "Không cần theo dõi" → việc vẫn còn (R), "môn khó khăn" = `R`;
  - cả hai Case "Không cần theo dõi" → việc chưa làm tự `removed · system_sos_changed`; bỏ duyệt / mở lại → việc hồi;
  - việc **đã làm** (`done`) **không bao giờ** bị đụng (phủ định);
  - chạy lặp hai lần → không sinh dòng thứ hai; một câu đọc Case cho cả bài (không N+1).
- [ ] Sửa: một hàm `monBaoPh(attemptId)` (một câu SQL) trả môn tính; `regular.ts:769` và đường đóng/mở lại Case Giữa khoá cùng gọi `dongBoBaoPh(a, monBaoPh(a.id))`.
- [ ] `npm run check` → commit `PR-UXF-b (9): Báo phụ huynh qua TVV theo Case của bài Giữa khoá (R5-4)`.

## Task 10 · Case G+V nằm hàng Writing sau khi em lên BE (R5-5) — **CỰC KỲ KHUYẾN NGHỊ Opus 5.5** (Case đi theo em khi chuyển lớp)

**Files (dự kiến — tìm khi tái hiện):** `server/src/cases/cases.ts` (`skillSupportBoard :2106`, gán Case vào hàng theo `category`) · `shared/domain/normal.ts:116-123`
(`tenMon`, `tenMonNgan` theo **chương trình**) · `web/src/modules/cases/SkillBoard.tsx` (`TenCase`, dòng phụ `từ lộ trình trước`).

Hiện trạng (chưa kiểm sâu — kiểm kê R5-5): em FOU có Case G+V (khoá dữ liệu `writing`) chuyển lên BE; hồ sơ BE đặt Case vào hàng **Writing**
và Case còn `classId` lớp cũ. FOU: `writing` = G+V, `speaking` = P; BE: `writing` = Writing, `speaking` = Speaking.

- [ ] **Tái hiện bằng phép kiểm** (luồng m-1: em FOU có Case G+V mở → lệnh chuyển lên BE → thi hành): đọc `/students/{id}/skill-board` lộ trình BE.
  Ghi Nhật ký đúng điều thấy (hàng nào, tên gì, `classId` gì). Không tái hiện được → Nhật ký "không lỗi", bỏ Task.
- [ ] **Theo câu trả lời Câu 3** (mặc định A): Case của lớp trước mà tên môn **khác** tên môn ở lớp hiện tại (G+V ≠ Writing, P ≠ Speaking) nằm ở
  nhóm riêng **"Từ lớp trước"** cuối bảng kỹ năng, tên môn theo chương trình **của lớp Case** (`tenMonNgan(ctCuaCase, skill)`), dòng phụ "từ MB FOU 12".
  Tên môn giống nhau (L, R) → giữ hàng như hiện nay, dòng phụ "từ lộ trình trước" như cũ.
- [ ] **Phép kiểm:** Case G+V **không** nằm ở hàng Writing BE; Σ Case trên bảng không đổi (không mất Case); **phủ định:** GV BE không dạy em không thấy thêm Case nào.
- [ ] `tocDoDuong`: `/students/{id}/skill-board` không thêm câu theo số Case.
- [ ] `npm run check` → commit `PR-UXF-b (10): Case của lớp trước giữ tên môn của lớp đó (R5-5)`.

## Task 11 · Bấm thử theo vai, 1440 + 375, sáng/tối — impeccable `audit` + `polish`, `/ponytail-review`, mở PR

- [ ] Cổng gộp `origin/main` (nếu UXD / Dọn đã merge) → gỡ theo bảng file chồng → `npm run check`.
- [ ] Chạy mục **KIỂM** theo vai QL (Nguyễn Khánh Vy id 2), GVCN FT, GVCN lớp thường, GVBM, Quản trị (id 1). Ảnh `thiet-ke/anh/pr-uxf-b/{muc}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] impeccable **`audit`** trên các màn đã chạm, rồi **`polish`** (sáng **và** tối). Kiểm:
  - không còn `dd/mm` cho tuần ở màn đã chạm (đối chiếu bảng B5);
  - mã tuần năm hiện tại không có `2026`;
  - cỡ chữ Q31-4 (kết quả / hạn / người 12 px);
  - chú thích nổi bảng Phân tích GV không bị khung cắt khi bảng 1–2 hàng (Q18).
- [ ] Quét cuối (Global Constraints) → ghi kết quả.
- [ ] `/ponytail-review`; liệt kê mọi `ponytail:` mới trong thân PR.
- [ ] Quét: không còn `npm run check` treo; tắt 4167/5367.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - **model thật** của phiên (và của Task 9, 10 nếu khác);
  - bảng mục (mã → ảnh trước/sau → đạt), bảng B5 đã đổi;
  - mốc B → số phép kiểm cuối; trần tốc độ đổi;
  - "Chuyển cho PR khác"; `ponytail:`.

## Câu hỏi cho chủ sản phẩm (3)

> **ĐÃ CHỐT 01/10:** Câu 1 = A — **bỏ** "Ghi hướng cho cả lớp" (chủ sản phẩm) · Câu 2 = A (Báo PH theo Case của bài; bỏ môn có Case "Không cần theo dõi") · Câu 3 = A (nhóm "Từ lớp trước", tên môn lớp cũ) — planning.

- **Câu 1 — K2-26 "Ghi hướng cho cả lớp" ở panel Lộ trình tiếp theo (và gộp "Chưa rõ" / "Xếp sau") còn cần không?**
  Từ 30/09 (Q30-1) Quản lý quyết chuyển lớp cho cả lớp ở panel Chuyển lớp, đã có cột "Web gợi ý".
  - A. **Bỏ K2-26.** Panel Lộ trình tiếp theo một em giữ nguyên như hôm nay (GVCN ghi dự định cho từng em, nếu cần);
  - B. Làm K2-26: thêm lối "Ghi hướng cho cả lớp" + gộp "Chưa rõ"/"Xếp sau" thành một lựa chọn.
  - **Khuyên A** (trùng việc với panel Chuyển lớp của Quản lý). Kế hoạch theo A (Q19).
- **Câu 2 — Việc "Báo phụ huynh qua TVV" sau Giữa khoá lớp thường tính theo gì? (R5-4)**
  Hôm nay: theo **môn trượt** — môn đã được duyệt "Không cần theo dõi" vẫn nằm trong việc Báo PH.
  - A. Theo **Case của bài**: môn có Case mở **hoặc đã xong** thì tính; môn có Case được duyệt "Không cần theo dõi" (hoặc bị rút vì sửa điểm) thì bỏ. Không còn môn nào → việc chưa làm tự rút; việc đã làm giữ nguyên;
  - B. Chỉ theo **Case còn mở**: Case xong là môn đó rút khỏi việc Báo PH (kể cả khi GVCN chưa kịp báo);
  - C. Giữ như hôm nay.
  - **Khuyên A** (phụ huynh vẫn được báo môn em đã trượt và đã hỗ trợ xong; chỉ bỏ môn nhà trường đã quyết không theo dõi). Kế hoạch theo A.
- **Câu 3 — Em FOU có Case "G+V" rồi lên BE: Case đó nằm đâu trong bảng kỹ năng của hồ sơ BE? (R5-5)**
  Hôm nay: nằm ở hàng **Writing** của BE (vì dữ liệu dùng chung khoá), dễ đọc thành "em yếu Writing".
  - A. Nhóm riêng **"Từ lớp trước"** cuối bảng, ghi đúng "G+V · từ MB FOU 12" (chỉ khi tên môn khác; L, R giữ hàng như cũ);
  - B. Giữ ở hàng Writing nhưng tên Case ghi "G+V (MB FOU 12)".
  - **Khuyên A** (không lẫn môn; B ít mã hơn nhưng vẫn đặt sai hàng). Kế hoạch theo A.

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Ghi chú |
|---|---|---|
| Năm `0208` báo "ngày không có thật" ở ô ngày (VN20, `oNgay.ts:17-20,57`) | **PR-Dọn** | UXF-b không sửa `hop` |
| Toast "Đã đọc n dòng" che nút Thêm HV (VN17, bảng việc nhỏ dòng 23) | **PR-UXD** | — |
| Dải Chờ duyệt Tổng quan QL theo bộ lọc chi nhánh (bảng việc nhỏ dòng 11) | đã giao **PR-VAI-a** (VN05/U2) | kiểm ở rà đợt |
| "QL đã duyệt / QL từ chối" → "Quản lý" (bảng việc nhỏ dòng 14; U6, VN08b; `loaiYeuCau.ts:49`, `mywork.ts:1100`, `yThuc.ts:122`, `ClassYThucCard.tsx`) | **PR-S3** | thông báo `yeuCau.ts:177-179` đã sửa |
| Badge "chưa có lộ trình tiếp theo" ở hồ sơ lớp (bảng việc nhỏ dòng 40) | **PR-Dọn** (đã giao) | liên quan Câu 1 — nếu chủ sản phẩm chọn A, badge cũng nên bỏ |
| `mywork.ts:927` sắp lớp `soSanhLop`; `urgencyOf` đọc cờ ô | đã có (S6F-a, `mywork.ts:907-908`) | — |
| U12 bảng Kết quả kiểm tra lớp thường theo K4-33 | **chủ sản phẩm** quyết có làm không → nếu có, lượt 3 (S3) | UXD đã chuyển sang UXF-b; UXF-b không làm (Q20) |

## KIỂM — kịch bản bấm thử

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| 1 | QL | Tổng quan › Phân tích › góc nhìn Giáo viên | ô Từ tuần / Đến tuần | ô hiện `W4 AUG` – `W3 SEP`; gõ `W1 SEP` nhận; gõ `05/09` nhận (về W1 SEP); gõ `abc` báo lỗi rõ |
| 2 | GVBM | Test › Chấm điểm (bộ chọn tuần) | ‹ › và mở lịch | chữ to `W3 SEP`, chữ nhỏ `14/09 – 20/09` |
| 3 | QL | Hồ sơ lớp FT · panel Tiến độ | Tuần khai giảng | `Khai giảng W1 SEP`, không ngày |
| 4 | QL | Hồ sơ lớp đã kết thúc | dải đầu | `Lớp đã kết thúc W…` |
| 5 | QL | Hồ sơ HV có lệnh chờ | dải Sắp chuyển | `Sang … từ W2 OCT · lệnh của …` — không "ngày" |
| 6 | QL | Tổng quan › Chờ duyệt › thẻ dời thi | dòng "đề nghị" | `W4 SEP`, không `2026` |
| 7 | GV | Hồ sơ HV FT › Ngăn Case | khoảng PA, "mở …", Case đã xong | `từ W3 SEP`, `mở W1 SEP`, `kết thúc theo dõi W1 OCT` (Case xong 28/09); PA 1 tháng `1 tháng · đến W3 OCT` |
| 8 | GV | Hồ sơ HV › bảng kỹ năng | PA có Xin ý kiến chờ / đã trả lời | dòng tím dưới hàng PA (cả thẻ 375 px); chữ giống Ngăn Case |
| 9 | QL | Tổng quan › Cần xử lý › "bài chưa nhập điểm quá hạn" › một dòng | bấm | mở hồ sơ Mock cuộn tới đúng kỹ năng |
| 10 | GVBM | Test › lưới chấm một kỹ năng › tên em | bấm | hồ sơ Mock cuộn tới kỹ năng đó |
| 11 | QL | Công việc › "Đánh dấu kỳ vọng đầu ra" › Mở hồ sơ | bấm | hồ sơ HV cuộn tới hộp Kết luận khoá |
| 12 | QL | Hồ sơ HV có vi phạm Ý thức › ⋮ Tạm dừng | đọc panel | có câu "n vi phạm Ý thức đang chờ xử lý — tạm dừng hạn" |
| 13 | QL | Hồ sơ HV em Tạm dừng | ô Học thuật đầu hồ sơ | không còn "Cần làm · xác nhận PA"; nhãn "Tạm dừng từ dd/mm" |
| 14 | GVCN | Hồ sơ lớp › Ý thức › em bị Quản lý từ chối đề xuất | dòng em | "Quản lý từ chối … · chọn biện pháp khác", không "2 vi phạm / 2 tuần" |
| 15 | QL | Chờ duyệt › thẻ Xin ý kiến đã Bổ sung | lý do | câu cũ và "Bổ sung dd/mm: …" ở hai dòng |
| 16 | GVCN thường | Học viên & Lớp › cột Việc tiếp theo | ô hạn | "· hạn hết T2 14/09" |
| 17 | GVCN thường | Hồ sơ HV lớp thường sau Giữa khoá › Ý thức & Phối hợp | việc Báo PH | môn khó khăn đúng theo Câu 2 |
| 18 | QL | Hồ sơ HV BE (lên từ FOU, có Case G+V) | bảng kỹ năng | theo Câu 3 — không có Case G+V ở hàng Writing |
| 19 | mọi vai | mọi màn trên | 375 px, sáng + tối | không cuộn ngang; số 12 px `tabular-nums`; không `2026` thừa |

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, model thật, phép kiểm trước đỏ bao nhiêu ✗, trần tốc độ, lệch kế hoạch, cổng gộp) |
|---|---|---|
| 01/10 | 0 | Model thật: **Sonnet 5.5** (`claude-sonnet-5-5`), effort High. Task 9, 10: ghi ở Nhật ký riêng của hai Task. Mốc B (main `cebb6fff`): **2232 + 29** xanh. Lần chạy đầu sập OOM/0xC0000409 ở PR-GV (3) → chạy lại một lần xanh. |
| 01/10 | 1 | Phép kiểm trước đỏ **3 ✗** trên main (bộ chạy nhỏ, vì chỉ hàm thuần + quét chữ). Sửa kỳ vọng cũ (không xoá): `NEN (1)` phụ tuần `21/09 – 27/09`; lỗi khoảng ô tuần "Không được sau W1 OCT". Xanh **2235** + 29. Hai lượt chạy bị tắt giữa chừng (một do tôi dừng để sửa kỳ vọng, một mã 5 không lỗi — nghi session song song quét `tests/run.js`) → chạy lại xanh. LichNho ô "Gõ ngày" → "Gõ tuần hoặc ngày" (nhận cả `W4 SEP`). B5 #11, #19: **bỏ** theo planning 01/10 — `pendingWeeks`/`caseFollowUp` chỉ `StudentsPage.WorkQueue` (mã chết) đọc; PR-Dọn xoá. |
| 01/10 | 2 | Phép kiểm trước đỏ **2 ✗** (U5 thẻ Lịch thi "đề nghị W4 SEP 2026"; quét chữ R5-1 …) bằng bộ chạy nhỏ có DB seed. Xanh **2237** + 29. B5 #4–10 + R5-1 + U5 xong; **#11 bỏ** (WorkQueue mã chết — PR-Dọn). Bỏ cột SQL `pr.code AS tuan` ở thẻ Lịch thi (không còn ai đọc). `pendingWeeks`: không đổi. |
