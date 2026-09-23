# PR-UX4 · Phân tích v2 (Tổng hợp vấn đề HV, Hiệu quả PA, Ý thức gọn, 2 dòng "bỏ quên" ở Cần xử lý) — Kế hoạch

> **For agentic workers:** KHÔNG dùng `superpowers:subagent-driven-development` — làm theo khối **Quy trình nhanh** bên dưới.

**Goal:** Tab **Tổng quan › Phân tích** làm lại theo mockup `16-phan-tich.html` (bản v2 — **không** theo `16-phan-tich-v1.html`):
hàng góc nhìn **Tổng hợp Test + SOS (mặc định) · Tổng hợp vấn đề HV · Hiệu quả PA · Ý thức & Phối hợp · Danh sách Case**.
Tổng hợp Test + SOS áp hàng lớn/nhỏ (N-2) + màu kết quả N-1b + chú giải. **Tổng hợp vấn đề HV** thay ma trận Vấn đề học viên:
đếm HV theo **loại lỗi** (`ISSUE_TAXONOMY`, lỗi chính + phụ của Case), có công tắc gộp loại lỗi chung. **Hiệu quả PA** thay
Kết quả hỗ trợ (vấn đề → loại PA, cỡ mẫu, "Ít dữ liệu", "Thời gian trung bình"). **Ý thức & Phối hợp** còn 2 danh sách. Việc
của "Chưa ai nhận" thành **2 dòng Cần xử lý** ở Tổng quan QL + **bộ lọc** ở Danh sách Case. Mọi số mở đúng danh sách (G-10).

**Architecture:** Máy chủ: 4 file mới trong `server/src/phanTich/` (`vanDeHv.ts`, `hieuQuaPa.ts`, `yThucPhanTich.ts`,
`boQuen.ts`) + `phamVi.ts` (quyền chung, 403 chi nhánh/lớp ngoài phạm vi), mỗi file một `tinh()` giữ **tập ID**, một hàm bảng
chỉ đọc `.size`, một hàm `o…()` mở danh sách bằng **chính** `tinh()` (khuôn `tongHop.ts`). Truy vấn theo lô 400, số câu SQL
không đổi theo số dòng. 2 dòng Cần xử lý là **2 chỉ số mới trong sổ** (`metrics.ts`). Luật thuần (góc nhìn, loại lỗi chung,
màu ô, "Nên dùng", bước tiếp theo Ý thức) ở `shared/domain/phanTich.ts`. Web: 3 góc nhìn mới trong `web/src/modules/phanTich/`,
xoá `VanDeHocVien.tsx`, `cases/IssueAnalysis.tsx`, `yThuc/YThucAnalysisView.tsx`, `server/src/phanTich/vanDe.ts` và các route
không còn ai gọi.

**Tech Stack:** TypeScript · React 18 + Vite · Express · libsql/better-sqlite3 · Tailwind; phép kiểm `server/src/tests/*` harness
`check()`, chạy `npm run check`.

**Spec:** `docs/superpowers/specs/2026-09-23-overhaul-giao-dien-design.md` **§4** + **N-1b**, N-2 (§1) · mockup
`thiet-ke/mockup/16-phan-tich.html` (0–5 + ghi chú kỹ thuật) · `17-hang-va-badge.html` (hàng A) · `18-hanh-trinh-va-mau.html`
(b, bảng màu) · luật chung `2026-09-22-ux-toan-web-truoc-deploy-design.md` §1 G-1…G-12, §2 · `thiet-ke/THUAT_NGU_DA_CHOT.md`.
Nguồn thắng khi lệch: đặc tả 23/09 > mockup 16 v2 > đặc tả 22/09 > THUAT_NGU.

| Mục | Chốt |
|---|---|
| Mã PR · nhánh | **PR-UX4** · `pr-ux4-phan-tich-v2` · worktree `.claude/worktrees/pr-ux4-phan-tich-v2` · một PR, không draft, **không tự merge** |
| Cổng thử | **API 4437 · Vite 5637** (không 4000/5173, không cổng PR khác) |
| Model | **Opus 5.5 · High** · phương án B **Sonnet 5 · High** |
| Người rà | **Fable 5.1** (code bằng Fable thì **Opus 5.5**) |
| Migrate | **KHÔNG.** Không đổi `server/src/schema.sql`, `server/src/migrate.ts` (mọi cột cần đã có: `case_issues.role`, `sos_cases.closed_at`, `case_signals.status='noted'`, `discipline_measures.cycle_id/performed_on`, `case_interventions.started_date`, `case_followups.observed_on`) |
| Phụ thuộc | **UX0 đã merge** (#89: `HangNhom/HangCon/KhoiNhom`, `Nhan/QuaHan`, `KhungPanel`, token `--dat --sos1 --sos2 --sos3`). Mockup 16 v2 đã chốt. Song song UX1/UX2/UX3/UX5 (khác file) |
| File KHÔNG được chạm | **UX1:** `web/src/modules/test/*`, `web/src/modules/cham/*`, `shared/domain/dieuHuong.ts`, `server/src/cham/*` · **UX2:** `server/src/keHoach/*`, `web/src/modules/test/keHoach/*` · **UX3:** `web/src/modules/cases/{QuickReport,CasePanel,NganCase,SkillBoard,CaseBoardPage}.tsx`, `web/src/modules/yThuc/*Panel*`, `ClassYThucCard.tsx`, `PhoiHopSosSection.tsx`, `classes/ChuyenLopPanel.tsx`, `students/*` · **UX5:** `web/src/modules/students/HanhTrinh.tsx`, `shared/domain/hanhTrinh.ts` · **UX0 (chỉ dùng):** `web/src/ui/{HangNhom,KhungPanel,Nhan,ui}.tsx`, `web/src/index.css`, `tailwind.config.js`, `shared/domain/mauNghia.ts` · **Tổng quan:** ngoài `KhoiCanXuLy.tsx` + `shared/domain/tongQuan.ts` (khối `CAN_XU_LY`) + `server/src/worklist/tongQuan.ts` thì không sửa (ngoại lệ Task 8 — Q22) |

### Chồng file

| File | PR khác | Cách xử lý |
|---|---|---|
| `server/src/routes/index.ts` | mọi PR | Chỉ khối `/phan-tich/*` (`:579-612`) và khối `/issue-board/*` phạm vi chi nhánh (`:820-883`); thêm route mới ngay sau `:612`. Xung đột → giữ cả hai |
| `server/src/tests/tocDoDuong.ts` | mọi PR | Chỉ thêm nhóm "Phân tích QL" vào `DUONG_DO` + khoá `TRAN` mới; nâng trần `/tong-quan/quan-ly` (kèm lý do, Task 5) |
| `web/src/modules/cases/IssueAnalysis.tsx` | **UX3** sửa `:368-370` (Drawer → `NganCase`) | UX4 **xoá cả file**. Merge sau thì xoá tiếp (bỏ phần UX3 đã sửa), ghi Nhật ký |
| `web/src/modules/yThuc/YThucAnalysisView.tsx` | UX0 xếp `yThuc/*` cho UX3, UX3 không sửa file này | UX4 xoá; xung đột → xoá |
| `shared/domain/metrics.ts`, `server/src/worklist/metrics.ts` | — | Chỉ thêm 2 chỉ số (mảng `METRICS`, `LISTED_METRICS :193`, `switch` sau `:488`) |
| `server/src/worklist/danhGia.ts` | — | Chỉ `export` + `nho()` cho `attemptsNewestFirst` (`:102`) |
| `server/src/cases/effectiveness.ts` | — | Chỉ thêm 2 cột vào `queryPlans`/`shapePlan` (`:207-263`), không đổi luật |
| `server/src/tests/run.ts`, `tongQuan.tests.ts` | mọi PR | `run.ts:8094-8103` sổ 28 → 30 chỉ số; `tongQuan.tests.ts:100-114, 280` thứ tự + tối đa 10 |
| `CODE_MAP.md`, `plan.md` | mọi PR | Chỉ sửa dòng Phân tích (`CODE_MAP.md:44, 252, 287`) + thêm dòng |

## Global Constraints

- **N-1 / N-1b màu:** chỉ dùng token (`text-dat bg-dat-bg`, `sos1/2/3`, `ok bad late soon doing done wait muted`, `text-faint`),
  không mã màu cứng. Kết quả Test: **Đạt** xanh lá · **SOS 1** vàng · **SOS 2** cam · **SOS 3** đỏ · Tạm thời / Chưa đủ điểm
  xám. Bảng Tổng hợp: cột Đạt/SOS1/SOS2/SOS3 tô chữ + nền nhạt, **ô 0 xám**, có chú giải màu đầu bảng.
- **N-2 hàng lớn/nhỏ:** mọi bảng có mở rộng dùng `HangNhom` (hàng lớn: nền sáng + vạch 3px + đậm, mũi tên ▸/▾ tooltip
  "Mở"/"Thu gọn") và `HangCon` (thụt, nền tối, chữ nhỏ); số tổng hàng lớn thẳng cột. Không tự vẽ ▸.
- **N-3 badge:** một badge = một trạng thái ≤ 3 từ (`Nhan`): "Nên dùng" (ok), "Ít dữ liệu" (muted). ⚠ chỉ quá hạn — ở
  Phân tích **không có** ⚠ (không có hạn).
- **G-2** `tabular-nums`, `colgroup` cố định, cột số canh phải · **G-3** một dòng phụ ≤ 60 ký tự · **G-5** không `SectionNote`
  giải thích — luật vào `NutLuat` ⓘ · **G-6** ngày `dd/mm` qua `ngay()`, tuần `W3 SEP` qua `tuanLich()`, không ISO ·
  **G-7** tooltip cho viết tắt (HV, PA, SOS, KV, L R W S, "Thư CC" = Thư cảnh cáo) và ▸ ⓘ · **G-8** một ngăn danh sách một lúc
  (`SoLieuO` → `Drawer`) · **G-10** mọi số > 0 bấm được, `n === rows.length` từ cùng `tinh()`; số 0 không gạch chân ·
  **G-11** 375px: bảng cuộn ngang **trong thẻ** (`table-scroll`, cột đầu `sticky-col`), trang không cuộn ngang · **G-12** không
  nút ở chỗ chưa có trong bản định vị — **không** nút "Theo giáo viên", "Giao bổ trợ", "Nhắc GV".
- **Chữ:** `Case` viết hoa · HV (không HS) · **PA** (không "biện pháp"; bên Ý thức ghi "PA xử lý") · kết quả PA **Tiến bộ rõ ·
  Tiến bộ một phần · Không tiến bộ · Kém hơn** · lớp thường **Giữa khoá / Cuối khoá**, "chưa đạt" (FT "dưới kỳ vọng") ·
  "Cần hỗ trợ" (không "chưa ổn") · "Thời gian trung bình" (không "thường mất") · không "Normal", không mở câu bằng "Hãy".
- **Máy chủ:** quyền `PERMISSIONS.MEETING_VIEW` (Ý thức: `DISCIPLINE_STATS` qua `statScope`); GV → 403; **QL hỏi chi nhánh /
  lớp ngoài phạm vi → 403** (đường mới). Không N+1: câu SQL theo lô 400, không truy vấn trong vòng lặp dòng. Đường mới vào
  `tocDoDuong.ts` có trần `max(đo+10, ⌈đo×1.3⌉)`, ≤ 100.
- **Giữ hành vi:** Tổng hợp Test + SOS máy chủ (`tongHop.ts`) **không đổi**; bảng phân tích **của lớp** (`/classes/:id/issue-board*`,
  `ClassIssueBoard`, `NeedsEvaluation`) giữ nguyên. Phép kiểm cũ của ma trận Vấn đề HV **chuyển** sang dịch vụ mới cùng ý (không
  xoá trắng); số phép kiểm không giảm.

## Quy trình nhanh (bắt buộc)

- **Không** rà từng Task bằng subagent. Tự code, `npm run check` sau **mỗi** Task (xanh, số phép ≥ mốc **B**), commit
  `PR-UX4 (n): …`. **Chỉ một** `npm run check` chạy một lúc — treo thì quét, tắt `node … run.js` cũ rồi chạy lại.
- Subagent (nếu buộc dùng): cùng model, **KHÔNG Haiku**. Commit ghi **đúng** `Co-Authored-By` của **model thật** đang chạy.
- Không chụp ảnh từng Task. Bấm thử theo vai (**QL=2, GVCN=7, GVBM=9**) + 375px **một lần** ở Task 10 bằng **ảnh thật**
  (Playwright kênh Chrome), lưu `thiet-ke/anh/pr-ux4/`.
- Task 0 tạo worktree + nhánh từ `origin/main` mới nhất, chép kế hoạch vào nhánh. Cuối PR: push, mở PR, báo planning. Không tự
  rà code cuối PR (planning rà bằng model khác). Tắt mọi node/vite (4437, 5637, `run.js`) trước khi kết thúc.
- Không chạm Turso, không deploy. Mã lệch **hình dạng** so với kế hoạch (không chỉ lệch dòng) → dừng, hỏi planning.

## Bảng Q — planning tự quyết (người rà kiểm lại)

| # | Câu hỏi | Chốt |
|---|---|---|
| Q1 | Khoá góc nhìn (mockup ghi `?goc=test-sos`) | Giữ khoá cũ để link cũ sống: `tong-hop` (mặc định, không tham số) · `van-de` (= Tổng hợp vấn đề HV) · **`hieu-qua-pa`** (mới) · `y-thuc` · `danh-sach`. `goc=ket-qua` → `hieu-qua-pa`, `goc=chua-ai-nhan` → `van-de` (thay URL, `replace`) |
| Q2 | "Theo giáo viên" (có trong mockup) | Không làm, không nút (PR-GV sau deploy) |
| Q3 | Bảng loại lỗi chung đặt ở đâu (mockup: `cases.ts`) | `shared/domain/phanTich.ts` (`LOI_CHUNG`) — file của UX4, tránh chồng. Ngữ pháp = W.grammar, S.grammar, R.language, L.language · Từ vựng = W.lexical, S.lexical, R.language, L.language · Tổ chức ý / mạch lạc = W.organisation, S.fluency · Kỹ năng làm bài = R.technique, L.technique |
| Q4 | Tập Case của Tổng hợp vấn đề HV | Case **đang mở** hoặc **đóng trong khoảng** (`closed_at ≥ tuDauKhoang(hôm nay, tg)`, mặc định 8 tuần) của HV **đang học** trong phạm vi; lớp = lớp đang học (như `vanDe.ts:35-46`). Bộ chọn khoảng hiện chữ "Case mở + đóng trong" |
| Q5 | Kỹ năng của một mã lỗi | `issueBranchOf(code)`; null → kỹ năng theo `category` của Case (`writing1/2` → Writing), nhãn "Khác" của kỹ năng đó. Writing luôn gộp W1+W2 |
| Q6 | "So với lần Test trước" | Mỗi lớp: 2 **đợt** (`khoaDot`) gần nhất có điểm; đếm HV có Case **sinh từ lượt** của đợt đó (`sc.attempt_id`) mang mã lỗi của dòng; cộng (mới − cũ) qua các lớp. Không lớp nào đủ 2 đợt → "—". Không bấm được (là hiệu số); ⓘ ở tiêu đề cột |
| Q7 | Gộp loại lỗi chung | Hàng lớn = 4 nhóm `LOI_CHUNG` (số HV = hợp, không trùng) → hàng con `Kỹ năng · loại lỗi`; nhóm cuối "n loại lỗi chỉ có ở một kỹ năng" (mọi "Khác" gộp một dòng "Khác"); rồi "Chưa phân loại" |
| Q8 | Nhóm nào mở sẵn | 3 hàng lớn có số HV lớn nhất; nhóm "chỉ một kỹ năng" và "n vấn đề khác" luôn đóng |
| Q9 | "Nên dùng" (Hiệu quả PA) | Loại PA có **≥ 5 PA**, tỷ lệ cải thiện **≥ 70%** và cao nhất trong vấn đề đó (hoà thì cả hai). Dưới 5 PA: `Ít dữ liệu`, không thanh, không xếp (TyLe: cấm xếp hạng mẫu nhỏ) |
| Q10 | "Thời gian trung bình" | Trung bình (ngày ghi kết quả cuối `case_followups.observed_on` − `COALESCE(started_date, planned_date)`) của PA **có cải thiện**, đổi tuần làm tròn, tối thiểu 1; chỉ hiện khi dòng có ≥ 5 PA, không thì "—" |
| Q11 | Vấn đề ít PA | Vấn đề có ≤ 2 PA có kết quả gom vào một hàng lớn đóng "n vấn đề khác, mỗi vấn đề ≤ 2 PA có kết quả" |
| Q12 | Nút "Nhắc GV" (mockup) | Không làm (không có đường nhắc hàng loạt — tránh nút chết, G-12). Số "n PA đã xong chưa ghi kết quả" bấm được, dòng mở Case |
| Q13 | "Case chưa phân loại lỗi" ở Hiệu quả PA | Case có PA đã kết thúc trong phạm vi mà **không có lỗi chính** (PA đó không vào bảng) |
| Q14 | "Học viên cần chú ý" | HV đang học trong phạm vi có **≥ 3 vi phạm trong khoảng** hoặc **vi phạm sau Thư CC đã thực hiện gần nhất** (cùng lộ trình `cycle_id`). Bước tiếp: có Thư CC k<3 + vi phạm sau thư → "Sắp Thư CC lần k+1"; chưa thư, ≥ 3 vi phạm, còn chưa xử lý → "Sắp Thư CC lần 1"; Thư CC 3 + vi phạm sau → "Đã Thư CC lần 3"; còn lại "Theo dõi". Xếp: "Sắp…" trước, rồi chưa xử lý, rồi vi phạm |
| Q15 | "Lớp nhiều vi phạm" | Lớp ghi (`v.class_id`) trong phạm vi; hiện rõ lớp có ≥ 3 vi phạm hoặc còn chưa xử lý, còn lại gom "n lớp khác · ≤ 2 vi phạm, đã xử lý hết". "± kỳ trước" = so khoảng cùng độ dài liền trước. Hàng con = 5 nhóm vi phạm |
| Q16 | Bảng 9 loại PA xử lý cũ | Chỉ còn trong **⤓ Xuất Excel** (3 sheet: HV cần chú ý · Lớp nhiều vi phạm · PA xử lý theo loại) |
| Q17 | 2 dòng Cần xử lý | 2 chỉ số mới trong sổ: `hv-can-ho-tro-2-lan-chua-case` ("học viên cần hỗ trợ 2 lần Test liền, chưa có Case mở") và `hv-bo-qua-van-can-ho-tro` ("học viên bị Bỏ qua tín hiệu, lần Test sau vẫn chưa đạt"). Đứng sau `case-chua-co-nguoi-phu-trach`, màu `vang`, nút **Xem** → Danh sách Case có bộ lọc. `CAN_XU_LY_TOI_DA` 8 → **10** |
| Q18 | "Cần hỗ trợ 2 lần liền" | Cùng **họ kỹ năng** (W1/W2/W = Writing) dưới kỳ vọng (FT) / chưa đạt (lớp thường) ở **2 lượt hợp lệ mới nhất** (`scored > 0`, `evaluable && under` — kể cả tạm thời) và **không có Case mở** (`status != 'done'`) cùng họ kỹ năng. Dòng 2: tín hiệu lớp thường `status='noted'`, lượt hợp lệ **ngay sau** lượt của tín hiệu chưa đạt cùng họ kỹ năng, không Case mở cùng họ |
| Q19 | Bộ lọc ở Danh sách Case đặt ở đâu | `PhanTich.tsx` (không sửa `CaseBoardPage.tsx` của UX3): hàng chip "Học viên cần chú ý" trên Danh sách Case; `hang-doi=can-ho-tro-2-lan` / `bo-qua-van-can-ho-tro` → vẽ `DanhSachBoQuen` thay `DanhSachCase` |
| Q20 | 403 hay rỗng khi QL hỏi chi nhánh khác | Đường **mới** → 403 (theo yêu cầu). `tongHop.ts` giữ "rỗng" như phép kiểm Pb hiện có (không đổi hành vi cũ) |
| Q21 | Hàm cũ ở `effectiveness.ts` | Giữ `issueBoard` (bảng lớp dùng), `issueSkillRows`, `issueBoardCases` (phép kiểm `run.ts:7050-7111, 8246, 8343` dùng). Chỉ bỏ **route** phạm vi chi nhánh + `issueScopeOf` |
| Q22 | UX0 giao #3 BranchPulse, #5 Phân tích lớp cho UX4 (mâu thuẫn "Tổng quan chỉ Cần xử lý") | Làm ở Task 8, **chỉ thay hàng** bằng `HangNhom/HangCon`, không đổi số/luật. Planning muốn bỏ thì cắt Task 8b, không ảnh hưởng task khác |
| Q23 | Ô 0 ở Tổng hợp | Hiện "0" xám `text-faint`, không gạch chân (thay "—"); cột Tạm thời/Chưa đủ điểm chữ `text-muted`, không nền |

## Bản đồ file

| File | Việc | Task |
|---|---|---|
| `shared/domain/phanTich.ts` | `GOC_NHIN` mới + alias; `LOI_CHUNG`, `hoKyNang`, `mauOKetQua`, `nenDung`, `tuanTrungBinh`, `buocTiepTheo`, `laHvCanChuY`; kiểu trả về mới; bỏ `MaTranVanDe/HangKyNangVanDe/DongLoiVanDe/ONhietVanDe/mucNhiet` | 1 |
| `server/src/phanTich/phamVi.ts` (mới) | `phamViPhanTich(p, branchId, classId)` | 2 |
| `server/src/phanTich/vanDeHv.ts` (mới) · xoá `vanDe.ts` | Tổng hợp vấn đề HV | 2 |
| `server/src/phanTich/hieuQuaPa.ts` (mới) · `cases/effectiveness.ts:207-263` | Hiệu quả PA | 3 |
| `server/src/phanTich/yThucPhanTich.ts` (mới) | Ý thức & Phối hợp | 4 |
| `server/src/phanTich/boQuen.ts` (mới) · `worklist/danhGia.ts:102` · `worklist/metrics.ts` · `shared/domain/metrics.ts` · `shared/domain/tongQuan.ts:68-96` | 2 dòng Cần xử lý | 5 |
| `server/src/routes/index.ts` | `:579-612` thay van-de; route mới; bỏ `:820-883` (trừ `/classes/:id/issue-board/needs-evaluation :885`) | 2–5 |
| `server/src/tests/phanTich.tests.ts` · `tongQuan.tests.ts` · `run.ts` · `tocDoDuong.ts` | phép kiểm, trần | 1–5 |
| `web/src/modules/phanTich/PhanTich.tsx` · `TongHopTestSos.tsx` | hàng góc nhìn · N-2 + N-1b | 6 |
| `web/src/modules/phanTich/{TongHopVanDeHv,HieuQuaPa,YThucPhoiHop,DanhSachBoQuen}.tsx` (mới) · xoá `VanDeHocVien.tsx`, `cases/IssueAnalysis.tsx`, `yThuc/YThucAnalysisView.tsx` | 3 góc nhìn + bộ lọc | 7–8 |
| `web/src/modules/worklist/KhoiCanXuLy.tsx` · `BranchPulse.tsx` · `classes/PhanTichLopTab.tsx` | nút Xem → bộ lọc · HangNhom (Q22) | 8 |
| `CODE_MAP.md`, `plan.md` | tài liệu | 9 |

### Task 0: Chuẩn bị

- [ ] **1.** `git fetch origin`; `git log origin/main --oneline | grep -i "ux0"` thấy #89. Tạo worktree
  `.claude/worktrees/pr-ux4-phan-tich-v2` nhánh `pr-ux4-phan-tich-v2` từ `origin/main`. `npm ci` nếu thiếu `node_modules`.
  **Không** checkout nhánh khác trong thư mục chính.
- [ ] **2.** Chép kế hoạch này vào nhánh, commit `PR-UX4 (0): ke hoach`.
- [ ] **3.** Không biến Turso (`node -e "console.log(Object.keys(process.env).filter(k=>/TURSO|LIBSQL/.test(k)).length?'CO':'sạch')"`).
  `npm test 2>&1 | tail -3` → ghi **B** vào Nhật ký.
- [ ] **4. Đối chiếu con trỏ** (ghi Nhật ký dòng thật): `HangNhom({mo,onMo,nhan,tieuDe,children,soCotDau})`, `HangCon({children,title})`
  (`web/src/ui/HangNhom.tsx`); `Nhan({tone})` tone `ok|muted…`; `NutLuat`, `SoLieuO({giaTri,nguon,tieuDe})`, `TyLe`; token
  Tailwind `dat/sos1/sos2/sos3` (`tailwind.config.js`). Chạy trên DB demo: `SELECT DISTINCT status FROM case_signals`,
  `SELECT role, COUNT(*) FROM case_issues GROUP BY role`, `SELECT COUNT(*) FROM sos_cases WHERE closed_at IS NOT NULL` —
  ghi số, để biết demo có đủ dữ liệu cho phép kiểm (thiếu → phép kiểm tự tạo dòng tạm trong transaction rồi rollback, như
  `phanTich.tests.ts:304-332`).

### Task 1: Luật thuần `shared/domain/phanTich.ts`

**Files:** `shared/domain/phanTich.ts` (`:18-69` góc nhìn, `:215-259` bỏ mức nhiệt/ma trận, thêm cuối file), `server/src/tests/phanTich.tests.ts`.
**Produces:**
```ts
export const GOC_NHIN = ['tong-hop', 'van-de', 'hieu-qua-pa', 'y-thuc', 'danh-sach'] as const;
// LABEL: 'Tổng hợp Test + SOS' · 'Tổng hợp vấn đề HV' · 'Hiệu quả PA' · 'Ý thức & Phối hợp' · 'Danh sách Case'
export type KetQuaGocNhinTuThamSo = { goc: GocNhin; ct: ChuongTrinh | null; boThamSo: string[]; gocMoi: GocNhin | null };
// gocNhinTuThamSo: 'ket-qua' → goc 'hieu-qua-pa', gocMoi 'hieu-qua-pa'; 'chua-ai-nhan' → 'van-de', gocMoi 'van-de'
export const LOI_CHUNG: readonly { khoa: string; nhan: string; ma: readonly string[] }[];     // Q3
export function hoKyNang(k: string): 'listening' | 'reading' | 'writing' | 'speaking' | null; // writing1/2/writing → writing; LEGACY_REGULAR_SKILL_MAP
export function mauOKetQua(khoaCot: string, v: number): 'dat' | 'sos1' | 'sos2' | 'sos3' | 'tam' | 'xam' | null;
export const NGUONG_IT_DU_LIEU = 5;
export function nenDung(dong: { soPa: number; caiThien: number }, anhEm: { soPa: number; caiThien: number }[]): boolean; // Q9
export function tuanTrungBinh(soNgay: number[]): number | null;   // [] → null; max(1, round(tb/7))
export type BuocTiep = 'sap-thu-1' | 'sap-thu-2' | 'sap-thu-3' | 'da-thu-3' | 'theo-doi';
export const BUOC_TIEP_LABEL: Record<BuocTiep, string>;          // 'Sắp Thư CC lần 1' … 'Theo dõi'
export function buocTiepTheo(x: { thuCaoNhat: 0 | 1 | 2 | 3; viPhamSauThu: number; viPham: number; chuaXuLy: number }): BuocTiep; // Q14
export function laHvCanChuY(x: { viPham: number; viPhamSauThu: number }): boolean;   // viPham ≥ 3 || viPhamSauThu > 0
export function nhanSoVoiTruoc(d: number | null): { chu: string; tone: 'bad' | 'ok' | 'muted' }; // ↑3 bad · ↓1 ok · = · — (null)
// Kiểu trả về (máy chủ ↔ web):
export type DongVanDeHv = { khoa: string; nhan: string; loai: 'ky-nang' | 'loi' | 'chung' | 'gom';
  soHv: number; soLop: number; top3: { classId: number; ma: string; n: number }[]; soVoiTruoc: number | null;
  phu?: string | null /* "Lỗi phổ biến" hoặc "Kỹ năng nhiều nhất" */; goiY?: string; con?: DongVanDeHv[] };
export type VanDeHvKetQua = { gop: boolean; chiChinh: boolean; tomTat: { hv: number; case: number; lop: number };
  hang: DongVanDeHv[]; chuaPhanLoai: { case: number; hv: number; lop: number }; scopeEmpty: boolean };
export type DongHieuQuaPa = { khoa: string; nhan: string; soPa: number; caiThien: number; tbTuan: number | null;
  itDuLieu: boolean; nenDung: boolean; con?: DongHieuQuaPa[] };
export type HieuQuaPaKetQua = { tomTat: { paCoKetQua: number; caiThien: number; vanDeDuDuLieu: number };
  hang: DongHieuQuaPa[]; gom: { soVanDe: number; hang: DongHieuQuaPa[] } | null;
  chuaGhiKetQua: number; caseChuaPhanLoai: number; scopeEmpty: boolean };
export type DongHvCanChuY = { studentId: number; ten: string; lop: string | null; viPham: number; chuaXuLy: number;
  bienPhapGanNhat: string | null; ngay: string | null; buocTiep: BuocTiep };
export type DongLopViPham = { khoa: string; classId: number | null; nhan: string; viPham: number; chuaXuLy: number;
  hvCoViPham: number; siSo: number | null; soVoiTruoc: number; gvcn: string | null; con?: DongLopViPham[] };
export type YThucPhanTichKetQua = { hvCanChuY: DongHvCanChuY[]; lop: DongLopViPham[];
  gom: { soLop: number; hang: DongLopViPham[] } | null; bienPhapTheoLoai: Record<string, number>; scopeEmpty: boolean };
```
- `mauOKetQua`: `dat|sos1|sos2|sos3` → chính nó khi `v>0`, `'xam'` khi `v<=0`; `tamThoi|chuaDu` → `'tam'` (v>0) / `'xam'`; cột khác → `null`.
- Xoá `mucNhiet`, `ONhietVanDe`, `DongLoiVanDe`, `HangKyNangVanDe`, `MaTranVanDe` (chỉ `vanDe.ts`/`VanDeHocVien.tsx` dùng).

**Phép kiểm** (`phanTich.tests.ts`, thay check `mucNhiet` `:28` bằng check `mauOKetQua`; sửa `:38` gocNhin thêm alias):
`UX4 · gocNhinTuThamSo: ket-qua→hieu-qua-pa, chua-ai-nhan→van-de, gocMoi đúng; hang-doi vẫn giữ` ·
`UX4 · LOI_CHUNG: mọi mã có trong ISSUE_TAXONOMY; R/L language ở cả Ngữ pháp lẫn Từ vựng` ·
`UX4 · hoKyNang: writing1/writing2/writing → writing; mã lạ → null` ·
`UX4 · mauOKetQua: 6 cột kết quả × v=0/v>0; cột khác null` ·
`UX4 · nenDung: <5 PA false; 70% biên; hoà cùng đỉnh cả hai true` · `UX4 · tuanTrungBinh: [] null, [3] 1, [20,22] 3` ·
`UX4 · buocTiepTheo: đủ 5 nhánh Q14` · `UX4 · nhanSoVoiTruoc: +3/-1/0/null`.
**Xong:** `npm run check` xanh (web còn lỗi kiểu vì `VanDeHocVien.tsx` dùng kiểu đã xoá → xoá luôn `VanDeHocVien.tsx` và
dòng `goc === 'van-de'` ở `PhanTich.tsx:129` tạm vẽ `null`; Task 7 thay). Commit `PR-UX4 (1): luat thuan phan tich v2`.

### Task 2: Máy chủ — Tổng hợp vấn đề HV (`vanDeHv.ts`, thay `vanDe.ts`)

**Files:** mới `server/src/phanTich/phamVi.ts`, `server/src/phanTich/vanDeHv.ts`; xoá `server/src/phanTich/vanDe.ts`;
`routes/index.ts:77, 596-612`; `phanTich.tests.ts:240-375, 492-510`; `tocDoDuong.ts`.
**Produces:**
```ts
// phamVi.ts — MỘT chỗ quyền cho mọi đường Phân tích mới
export function phamViPhanTich(p: Principal, branchId: number | null, classId: number | null):
  { scope: ReturnType<typeof scopeFor>; cs: { sql: string; params: unknown[] }; scopeEmpty: boolean };
// scope.none → forbidden('Phân tích dành cho Quản lý.'); branchId ngoài scope.branchIds (không all) → forbidden('Chi nhánh này nằm
// ngoài phạm vi bạn được xem.'); classId có mà lớp không thuộc phạm vi → forbidden('Lớp này nằm ngoài phạm vi bạn được xem.')
// vanDeHv.ts
export type FilterVanDeHv = { branchId?: number | null; ct: ChuongTrinh; classId?: number | null; soTuan: number; chiChinh: boolean; gop: boolean };
export function vanDeHv(p: Principal, f: FilterVanDeHv): VanDeHvKetQua;
export function oVanDeHv(p: Principal, f: FilterVanDeHv & { dong: string; cot: string }): { n: number; tieuDe: string; rows: MetricRow[] };
```
**`tinh()` — 5 câu SQL (lô 400), không câu nào trong vòng lặp dòng:**
1. Ghi danh đang học trong phạm vi (như `vanDe.ts:35-46`, thêm `c.is_fast_track`) → `lopCuaHv: Map<hv, Set<classId>>`, `maLop`.
2. Case của các HV đó, trong khoảng (Q4):
   `SELECT sc.id, sc.student_id, sc.category, sc.topic, sc.attempt_id, sc.status, sc.detected_at, a.kind, a.attempt_no, u.full_name AS owner
      FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id LEFT JOIN users u ON u.id = sc.owner_user_id
     WHERE sc.student_id IN (…) AND (sc.status != 'done' OR substr(sc.closed_at,1,10) >= ?)`.
3. `case_issues` của các Case đó: `role IN ('primary','secondary')` (hoặc chỉ `'primary'` khi `chiChinh`). Case **không có dòng
   nào ở cả hai vai** → tập "Chưa phân loại" (không đổi theo công tắc).
4. Lượt có điểm của các lớp trong phạm vi (cho Q6): `SELECT a.id, a.class_id, a.kind, a.attempt_no, rp.week_start FROM assessment_attempts a
   JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.class_id IN (…) AND a.status != 'cancelled' AND EXISTS (SELECT 1 FROM
   assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))` → mỗi lớp: đợt `khoaDot`
   mới nhất `R1` và liền trước `R0` (theo `MAX(week_start)`).
5. Case sinh từ lượt thuộc `R1 ∪ R0` + mã lỗi của chúng (một câu `JOIN case_issues`, lọc vai như câu 3).

Tập theo khoá dòng: `kn:<ho>` (hợp con) · `kn:<ho>|<ma>` · khi `gop`: `chung:<khoa>` · `chung:<khoa>|<ho>|<ma>` · `gom:mot` ·
`gom:mot|<ma hoặc 'khac'>`. Mỗi khoá giữ `{ hv: Set, hvTheoLop: Map<classId, Set>, truoc: Set, sau: Set }` (`truoc/sau` theo lớp rồi
cộng, Q6). `soLop = hvTheoLop.size`; `top3` xếp số HV giảm rồi mã lớp; dòng 0 HV bỏ; hàng con xếp giảm, "Khác" cuối.
`phu`: chế độ kỹ năng = nhãn con lớn nhất trừ "Khác" (luật `vanDe.ts:161-165`); chế độ gộp = kỹ năng nhiều HV nhất.
`goiY` hàng Listening "Ngôn ngữ" lấy `hint` của `ISSUE_TAXONOMY`; hàng `chung:ngu-phap`/`tu-vung`: "Reading/Listening chỉ có mục
Từ vựng / ngữ pháp nên mục đó tính ở cả Ngữ pháp và Từ vựng".
**`oVanDeHv` (`cot`):** `hv` → một dòng/HV: `title` tên, `sub` `"Lỗi chính · MB-FT 101 · Case W2 · MT3 · Cao Khánh Linh"` (≤ 60,
cắt "…"; lớp thường "Giữa khoá"; Case không từ Test ghi "GV báo"), `href` `/hoc-vien/{id}` · `lop` → dòng lớp (`title` mã lớp,
`sub` "n HV", `href` `/classes/{id}/overview`) · `lop:<id>` → HV của lớp đó · `dong=chua-phan-loai&cot=case` → Case
(`title` tên HV, `sub` "lớp · kỹ năng · người phụ trách · mở dd/mm", `href` `/hoc-thuat/case/{id}`). Khoá lạ → 400.
**Routes** (thay `:602-612`): `GET /phan-tich/van-de-hv`, `GET /phan-tich/van-de-hv/o` — tham số `branchId, ct, lop, tg, loi=chinh, gop=1, dong, cot`.
**Phép kiểm** (chuyển 8 check Pb ma trận `:244-375, 492` sang dịch vụ mới, giữ ý): `UX4 · Vấn đề HV: ct=ft/thuong/ca-hai chỉ có 4 hàng
kỹ năng, không W1/W2 riêng` · `… oVanDeHv n === rows.length, bằng soHv/soLop ở hàng lớn, hàng con, chip top3, Chưa phân loại` ·
`… hàng lớn = hợp (≤ tổng con), em hai lỗi cùng kỹ năng đếm 1` · `… gop: Ngữ pháp đếm duy nhất; em có W.grammar + R.language tính 1;
R.language có ở cả Ngữ pháp và Từ vựng` · `… chiChinh: bỏ lỗi phụ → số ≤ chế độ đủ; Chưa phân loại không đổi` · `… Case đóng trước
khoảng biến mất, đóng trong khoảng còn (transaction + rollback)` · `… phu = con lớn nhất trừ Khác` · `… soVoiTruoc: dựng 2 đợt giả
một lớp, Case ở đợt mới +1 → +1` · `… quyền: GVCN 403; QL Monbay branchId=CP 403; lop ngoài phạm vi 403` · `… không N+1: số câu SQL
bằng nhau với tg=4 và tg=26, ≤ 12`.
**Tốc độ:** `DUONG_DO` nhóm "Phân tích QL": `/phan-tich/van-de-hv`, `/phan-tich/van-de-hv?gop=1`,
`/phan-tich/van-de-hv/o?dong=chua-phan-loai&cot=case` (vai QL, QT; GVCN `maChuDich` 403). `TRAN` theo số đo.
**Xong:** check xanh, commit `PR-UX4 (2): may chu Tong hop van de HV`.

### Task 3: Máy chủ — Hiệu quả PA (`hieuQuaPa.ts`), bỏ route Kết quả hỗ trợ

**Files:** mới `server/src/phanTich/hieuQuaPa.ts`; `server/src/cases/effectiveness.ts:207-263`; `routes/index.ts:820-883`;
`phanTich.tests.ts`; `tocDoDuong.ts`.
**Consumes:** `planOutcomes(scope)`, `plansNeedingEvaluation(scope)` (`effectiveness.ts:265, 296`).
- `queryPlans` thêm 2 cột (additive): `COALESCE(iv.started_date, iv.planned_date) AS started_on` và
  `(SELECT fu.observed_on FROM case_followups fu WHERE fu.intervention_id = iv.id AND fu.outcome IS NOT NULL ORDER BY fu.observed_on DESC, fu.id DESC LIMIT 1) AS outcome_on`;
  `shapePlan` thêm `startedOn`, `outcomeOn`. Không đổi bộ lọc/nhóm.
**Produces:** `hieuQuaPa(p, f: { branchId; ct; classId; soTuan }): HieuQuaPaKetQua` · `oHieuQuaPa(p, f & { dong; cot })`.
- Phạm vi: `phamViPhanTich`; `scope = { branchIds: branchId ? [branchId] : (all ? null : scope.branchIds), ratio: ct==='thuong' ? true :
  ct==='ft' ? false : null, classId, fromDate: tuDauKhoang(today, soTuan) }` (kết quả theo nơi em học lúc làm PA — F03 sẵn có).
- `rows = planOutcomes(scope).filter(group !== 'undetermined')`; lỗi chính: **một** câu `SELECT case_id, taxonomy_code FROM case_issues
  WHERE role='primary' AND case_id IN (…)` (lô 400, lấy id nhỏ nhất). Không lỗi chính → tập `caseChuaPhanLoai` (Q13).
- Hàng lớn = mã lỗi chính, nhãn `"Writing · Tổ chức bài / liên kết ý"`; con = `INTERVENTION_KIND_LABEL[kind]`. `soPa` = số PA,
  `caiThien` = nhóm `success`, `itDuLieu = soPa < 5`, `tbTuan = soPa >= 5 ? tuanTrungBinh(ngày của PA success có đủ 2 ngày) : null`,
  `nenDung` theo Q9 (chỉ hàng con). Hàng lớn `soPa ≤ 2` → `gom` (Q11). Xếp `soPa` giảm.
- `chuaGhiKetQua = plansNeedingEvaluation(scope).count`.
- `oHieuQuaPa` `cot`: `pa` | `cai-thien` (khoá hàng) → `rowsFor('phuong-an', ids)`; `dong=chua-ghi-ket-qua` → `rowsFor('phuong-an')`;
  `dong=case-chua-phan-loai` → `rowsFor('case')`.
- Bỏ route `/issue-board/skills`, `/issue-board`, `/issue-board/cases`, `/issue-board/needs-evaluation` và `issueScopeOf`
  (`:820-883`); **giữ** `/classes/:id/issue-board*` (`:885` trở đi). Trước khi xoá: `grep -rn "issue-board" web/src` chỉ còn
  `ClassIssueBoard.tsx` (`/classes/…`).
**Routes:** `GET /phan-tich/hieu-qua-pa`, `GET /phan-tich/hieu-qua-pa/o`.
**Phép kiểm:** `UX4 · Hiệu quả PA: Σ soPa hàng lớn + gom = tomTat.paCoKetQua; con cộng đúng bằng cha` · `… không có cột/khoá
"không cải thiện"` · `… itDuLieu đúng biên 5; tbTuan null khi < 5` · `… nenDung chỉ ở hàng con đủ Q9` · `… o: n === rows.length cho pa,
cai-thien, chua-ghi-ket-qua, case-chua-phan-loai` · `… chuaGhiKetQua === plansNeedingEvaluation(cùng scope).count` · `… quyền GVCN 403,
QL chi nhánh khác 403` · `… effectiveness.planOutcomes có startedOn/outcomeOn, phép kiểm hiệu quả cũ vẫn xanh`.
**Tốc độ:** `/phan-tich/hieu-qua-pa`, `/phan-tich/hieu-qua-pa?tg=26` (QL, QT). **Xong:** commit `PR-UX4 (3): may chu Hieu qua PA`.

### Task 4: Máy chủ — Ý thức & Phối hợp (`yThucPhanTich.ts`)

**Files:** mới `server/src/phanTich/yThucPhanTich.ts`; `routes/index.ts`; `phanTich.tests.ts`; `tocDoDuong.ts`.
**Consumes:** `statScope`, `checkClassInScope`, `branchSql`, `classSql` (`yThuc/thongKe.ts:42-74`), `MEASURE_KIND_LABEL`, `WARNING_CHAIN`.
**Produces:** `yThucPhanTich(p, f: { branchId; ct; classId; from; to }): YThucPhanTichKetQua` · `oYThucPhanTich(p, f & { dong; cot })`.
- 4 câu SQL: (1) vi phạm trong `[from − độ dài kỳ, to]` (lấy luôn kỳ trước cho "±") kèm `in_measure` (`EXISTS measure_violations`),
  `cycle_id`, `class_id`, `category`, lọc chi nhánh theo `c.branch_id` như `vi-pham-tong`; (2) PA xử lý `status='done'` của các
  HV đó (`kind, performed_on, cycle_id`); (3) sĩ số đang học + GVCN (`teacher_assignments is_core=1 status='active'`) của các lớp;
  (4) PA xử lý đã thực hiện trong kỳ theo `kind` (cho Excel, Q16). `ct` lọc `c.is_fast_track`.
- HV cần chú ý (Q14): `thuCaoNhat` = thư CC `done` cao nhất **cùng `cycle_id`** với vi phạm mới nhất; `viPhamSauThu` = vi phạm
  `occurred_on >` ngày thư đó; `chuaXuLy` = vi phạm (mọi thời điểm) chưa gắn PA xử lý; giữ HV `laHvCanChuY`, HV đang học trong phạm vi.
- Lớp (Q15): khoá `lop:<id>`, con `lop:<id>|<category>` (nhãn `VIOLATION_CATEGORY_LABEL`); `soVoiTruoc` = vi phạm kỳ này − kỳ trước.
- `o` `cot`: `vi-pham` | `chua-xu-ly` cho khoá `hv:<id>` hoặc khoá lớp → `rowsFor('vi-pham', ids)`; `hv-co-vi-pham` → `rowsFor('hoc-vien')`.
**Route:** `GET /phan-tich/y-thuc`, `GET /phan-tich/y-thuc/o` (`from = tuDauKhoang(today, tg)`, `to = today`).
**Phép kiểm:** `UX4 · Ý thức: mọi HV cần chú ý thoả laHvCanChuY; buocTiep khớp buocTiepTheo(dữ liệu thật)` · `… tổng vi phạm các lớp +
gom = metricSet('vi-pham-tong', cùng from/to/branch).n` · `… con cộng đúng cha` · `… o n === rows.length (hv, lớp, con)` ·
`… không còn khoá/trường phối hợp SOS` · `… GVCN 403; QL chi nhánh khác 403; classId ngoài phạm vi 403`.
**Tốc độ:** `/phan-tich/y-thuc` (QL, QT). **Xong:** commit `PR-UX4 (4): may chu Y thuc phan tich gon`.

### Task 5: Máy chủ — 2 dòng Cần xử lý + bộ lọc Danh sách Case (`boQuen.ts`)

**Files:** mới `server/src/phanTich/boQuen.ts`; `worklist/danhGia.ts:102`; `worklist/metrics.ts:193-200, ~488`;
`shared/domain/metrics.ts` (cuối mảng `:245`); `shared/domain/tongQuan.ts:68-96`; `routes/index.ts`; `tests/run.ts:8094-8103`;
`tongQuan.tests.ts:100-114, 280`; `phanTich.tests.ts`; `tocDoDuong.ts`.
- `danhGia.ts`: `export function attemptsNewestFirst` + bọc `nho(\`luot-hv:${studentIds.join(',')}\`, …)` (cùng kiểu `latestAttempts`).
**Produces:**
```ts
export type LoaiBoQuen = 'can-ho-tro-2-lan' | 'bo-qua-van-can-ho-tro';
export type DongBoQuen = { studentId: number; ten: string; lop: string | null; kyNang: string; chiTiet: string; tu: string };
export function boQuen(p: Principal, branchId: number | null, today: string): Record<LoaiBoQuen, DongBoQuen[]>; // nho theo (user, branch, today)
```
- HV = `studentsInScope(p, branchId)`; lượt = `attemptsNewestFirst`; `loadBundle` một lần; `evaluateAttemptRow` từng lượt (trong bộ nhớ);
  lượt hợp lệ = `scored > 0`. Case mở: một câu `SELECT student_id, category, topic, status, closed_at FROM sos_cases WHERE student_id IN (…)`
  (lô 400) → họ kỹ năng mở + ngày đóng gần nhất theo họ. Tín hiệu: một câu `SELECT sg.student_id, sg.attempt_id, sg.skill, sg.category,
  sg.resolved_at FROM case_signals sg JOIN classes c ON c.id = sg.class_id WHERE sg.status = 'noted' AND c.is_fast_track = 0 AND
  sg.student_id IN (…)`. Luật Q18, so họ bằng `hoKyNang`. Một dòng / HV (nhiều kỹ năng nối "L, W").
  `chiTiet` ≤ 60: `"MT2, MT3 dưới kỳ vọng · Case đóng 05/09"` / `"Giữa khoá, Cuối khoá chưa đạt · chưa có Case"` /
  `"Bỏ qua 10/09 · Cuối khoá vẫn chưa đạt"`; `tu` = `tuanLich(week_start lượt mới nhất)`.
- **Sổ chỉ số** (`shared/domain/metrics.ts`, đủ 8 trường): `hv-can-ho-tro-2-lan-chua-case` và `hv-bo-qua-van-can-ho-tro`,
  `donVi 'hoc-vien'`, `thoiGian 'hien-trang'`, `khuTrung 'COUNT DISTINCT student_id'`, `drilldown '/metrics/<id>'`.
  `metrics.ts`: thêm vào `LISTED_METRICS`; `switch` → `done(sortIds(boQuen(p, branchId ?? null, today)[loai].map((r) => r.studentId)))`.
- `tongQuan.ts` (shared): `MaCanXuLy` thêm 2 mã; `CAN_XU_LY` chèn sau `case-chua-co-nguoi-phu-trach`:
  `{ metricId: 'hv-can-ho-tro-2-lan-chua-case', nhan: 'học viên cần hỗ trợ 2 lần Test liền, chưa có Case mở', nut: 'Xem', mau: 'vang', denLoc: 'can-ho-tro-2-lan' }`,
  `{ metricId: 'hv-bo-qua-van-can-ho-tro', nhan: 'học viên bị Bỏ qua tín hiệu, lần Test sau vẫn chưa đạt', nut: 'Xem', mau: 'vang', denLoc: 'bo-qua-van-can-ho-tro' }`;
  kiểu thêm trường tuỳ chọn `denLoc?: LoaiBoQuen`, `DongCanXuLyGoc` mang theo `denLoc`; `CAN_XU_LY_TOI_DA = 10`.
- **Route** `GET /phan-tich/bo-quen?loai=&branchId=&ct=` → `{ n, rows: DongBoQuen[] }`: `phamViPhanTich` (403 như trên), lọc `ct` bằng
  `locTheoChuongTrinh('hoc-vien', …)` (`worklist/chuongTrinh.ts:106`), `n === rows.length`. `loai` lạ → 400.
**Phép kiểm:** `run.ts` sổ **30** chỉ số (sửa câu thông báo, thêm 2 mã vào `expected`) · `tongQuan.tests.ts`: thứ tự `CAN_XU_LY` mới,
`TOI_DA === 10`, `<= 10` · `UX4 · Bỏ quên: n của /phan-tich/bo-quen = metricSet(...).n cho 2 loại × 3 ct` · `… dựng HV có 2 lượt dưới KV
cùng Writing (W1 rồi W2) không Case → có; thêm Case mở writing2 → mất; Case đóng → có lại, chiTiet có "Case đóng"` · `… tín hiệu
noted + lượt sau chưa đạt cùng họ → có; lượt sau đạt → không; FT → không` · `… Cần xử lý hiện 2 dòng khi n>0, số = metricSet` ·
`… không N+1: số câu boQuen như nhau khi nhân HV (tocDo.run nhân dữ liệu)`.
**Tốc độ:** `/phan-tich/bo-quen?loai=can-ho-tro-2-lan`, `/metrics/hv-can-ho-tro-2-lan-chua-case`, `/metrics/hv-bo-qua-van-can-ho-tro`
(QL, QT); đo lại `/tong-quan/quan-ly` — vượt 75/71 thì nâng trần **kèm lý do** ("+2 chỉ số Cần xử lý, dùng chung `boQuen` nhớ trong
request") và ghi Nhật ký; mục tiêu ≤ 90.
**Xong:** commit `PR-UX4 (5): 2 dong Can xu ly + loc Danh sach Case (may chu)`.

### Task 6: Web — hàng góc nhìn + Tổng hợp Test + SOS (N-2, N-1b)

**Files:** `web/src/modules/phanTich/PhanTich.tsx:12-16, 33-41, 91-140`, `TongHopTestSos.tsx:28-31, 105-133, 135-212`.
- `PhanTich.tsx`: nhãn/khoá theo Task 1; effect `gocMoi` → `next.set('goc', gocMoi)` `replace: true`. `laHienTrang` chỉ còn
  `danh-sach`; `van-de` hiện chữ nhỏ `Case mở + đóng trong` trước ô khoảng. Vẽ: `van-de` → `<TongHopVanDeHv/>`, `hieu-qua-pa` →
  `<HieuQuaPa/>`, `y-thuc` → `<YThucPhoiHop/>` (Task 7), `danh-sach` → Task 8. Bỏ import `IssueAnalysis`, `YThucAnalysisView`, `Card` thừa.
- `TongHopTestSos.tsx`:
```tsx
const MAU_O: Record<'dat' | 'sos1' | 'sos2' | 'sos3' | 'tam' | 'xam', string> = {
  dat: 'bg-dat-bg text-dat font-semibold', sos1: 'bg-sos1-bg text-sos1 font-semibold', sos2: 'bg-sos2-bg text-sos2 font-semibold',
  sos3: 'bg-sos3-bg text-sos3 font-semibold', tam: 'text-muted', xam: 'text-faint' };
// <td className={`td text-right tabular-nums ${m ? MAU_O[m] : ''}`}> với m = mauOKetQua(col.khoa, v); v<=0 → <span>0</span> không nút
```
  Hàng có `con` → `<HangNhom mo={open.has(k)} onMo={() => toggleOpen(k)} nhan={row.nhan} tieuDe={<>{row.nhan}<span className="text-[10px] font-normal text-slate-500"> · {row.phu}</span></>}>…<td>…</HangNhom>`;
  không có con → `<tr className="hang-lon dong">` với ô trống 16px thay mũi tên; dòng con → `<HangCon>`. Bỏ `MAU_COT` cho `dat/sos*`
  (giữ `thieuPa: 'text-soon'`). **Chú giải** trong hàng công cụ, sau nút xếp dòng: 5 chip nhỏ `SCORE_CHIP` (`emerald`, `sos1`,
  `sos2`, `sos3`, `tam`) chữ "Đạt · SOS 1 · SOS 2 · SOS 3 · Tạm thời / Chưa đủ điểm", tooltip từng chip = `goiY` cột.
  Mặc định thu gọn; hàng lớn đầu tiên (tuần mới nhất) mở sẵn.
**Xong:** `npm run check` xanh (typecheck), commit `PR-UX4 (6): hang goc nhin, Tong hop Test + SOS hang A + mau N-1b`.

### Task 7: Web — Tổng hợp vấn đề HV, Hiệu quả PA, Ý thức & Phối hợp

**Files:** mới `web/src/modules/phanTich/TongHopVanDeHv.tsx`, `HieuQuaPa.tsx`, `YThucPhoiHop.tsx`; xoá
`web/src/modules/cases/IssueAnalysis.tsx`, `web/src/modules/yThuc/YThucAnalysisView.tsx` (trước khi xoá `grep -rn` không còn ai import).
**Props chung:** `{ branchId: number | null; ct: ChuongTrinh; tg: Khoang; classId: number | null }`; query như `TongHopTestSos.tsx:57-63`.
- **TongHopVanDeHv** (mockup 16 §3, §3b): hàng công cụ: radiogroup `Lỗi chính + phụ | Chỉ lỗi chính` (URL `loi=chinh`), công tắc
  `Gộp theo loại lỗi chung` (URL `gop=1`); dòng tóm tắt `27 học viên có Case đã phân loại lỗi · 38 Case · 9 lớp` + `NutLuat` (đếm lỗi
  chính + phụ, một em một lần mỗi dòng, W1+W2 gộp, không có ngưỡng "nóng"). Bảng `table-fixed` colgroup: tên 30% · Số HV 72 ·
  Số lớp 72 · 3 lớp nhiều nhất (chip `SoLieuO` "MB-FT 101 · 5" → `cot=lop:<id>`) · So với lần Test trước 110 (`nhanSoVoiTruoc`,
  ⓘ tiêu đề: "so lần Test gần nhất của từng lớp với lần ngay trước của chính lớp đó, rồi cộng lại") · Lỗi phổ biến / Kỹ năng nhiều
  nhất 170. Hàng lớn `HangNhom`, con `HangCon`; Q8 mở sẵn. Số HV/Số lớp là `SoLieuO nguon=/phan-tich/van-de-hv/o?…&dong=&cot=hv|lop`.
  Dòng **Chưa phân loại** cuối: `<tr>` nền `bg-soon-bg text-soon font-bold`, vạch trái `style={{ boxShadow: 'inset 3px 0 0 rgb(var(--soon-rgb))' }}`,
  chữ "Chưa phân loại: {n} Case", số HV/lớp, cột cuối `SoLieuO` "Mở danh sách Case cần GV phân loại" (`dong=chua-phan-loai&cot=case`).
  Rỗng → `Empty "Chưa có Case nào đã phân loại lỗi trong {khoảng}"`.
- **HieuQuaPa** (mockup 16 §4): tóm tắt `38 PA có kết quả · 24 có cải thiện · 3 vấn đề đủ dữ liệu` + `NutLuat` ("Có cải thiện" =
  Tiến bộ rõ + Tiến bộ một phần trên PA đã kết thúc có kết quả xác định; dưới 5 PA ghi Ít dữ liệu; Thời gian trung bình = từ ngày
  bắt đầu tới ngày ghi kết quả của PA có cải thiện; tính theo nơi em học lúc làm PA; "Nên dùng" = Q9). Cột: Vấn đề / loại PA ·
  Số PA · Có cải thiện (`n/N` + thanh 60px `bg-ok` rộng theo tỷ lệ, **không** thanh khi `itDuLieu`) · Thời gian trung bình
  (`{n} tuần` / "—") · cột nhãn (`<Nhan tone="ok">Nên dùng</Nhan>` / `<Nhan tone="muted">Ít dữ liệu</Nhan>`). Hàng `gom` =
  `HangNhom` đóng. Dưới bảng một dòng "Để số liệu đủ tin:" + 2 `SoLieuO` (`n PA đã xong chưa ghi kết quả`, `n Case chưa phân loại
  lỗi`). Không nút Nhắc (Q12).
- **YThucPhoiHop** (mockup 16 §5): Card "Học viên cần chú ý · vi phạm lặp lại, sắp tới Thư CC lần tiếp" + `NutLuat` (Q14); bảng
  Học viên (link `duongHoSoHocVien(id, { tab: 'y-thuc' })`) · Lớp · Vi phạm · Chưa xử lý (`SoLieuO`) · PA xử lý gần nhất
  (`<abbr title="Thư cảnh cáo lần 2">Thư CC lần 2</abbr>`) · Ngày `ngay()` · Bước tiếp theo (`Nhan tone="soon"` cho "Sắp…", chữ
  mờ cho "Theo dõi"). Card "Lớp nhiều vi phạm · xếp theo vi phạm chưa xử lý": `HangNhom` lớp (link hồ sơ lớp) → `HangCon` nhóm vi
  phạm; cột Vi phạm · Chưa xử lý · HV có VP (`5/8`) · ± kỳ trước (`nhanSoVoiTruoc`) · GVCN; hàng `gom` đóng. Nút `⤓ Xuất Excel`
  (`xlsx` động như `TongHopTestSos.tsx:90-103`, 3 sheet Q16, tiêu đề cột tiếng Việt, ngày `dd/mm`). Không khối Phối hợp SOS.
**Xong:** check xanh, commit `PR-UX4 (7): web Tong hop van de HV, Hieu qua PA, Y thuc gon`.

### Task 8: Web — 2 dòng Cần xử lý, bộ lọc Danh sách Case, hàng A ở BranchPulse / Phân tích lớp

**Files:** `web/src/modules/worklist/KhoiCanXuLy.tsx:30-42`, `PhanTich.tsx`, mới `web/src/modules/phanTich/DanhSachBoQuen.tsx`,
(8b) `worklist/BranchPulse.tsx:90-114`, `classes/PhanTichLopTab.tsx:40-62`.
- `KhoiCanXuLy`: dòng có `x.denLoc` → nút **Xem** `navigate(\`/phan-tich?goc=danh-sach&hang-doi=${x.denLoc}${branchId ? \`&cn=${branchId}\` : ''}${thamSoCt(ct)}\`)`;
  số vẫn `SoLieuO id=…` (ngăn danh sách HV). Dòng khác giữ nguyên.
- `PhanTich.tsx` khi `goc === 'danh-sach'`: trên cùng một hàng chip nhỏ `Học viên cần chú ý:` `[Cần hỗ trợ 2 lần liền, chưa có Case]`
  `[Bỏ qua tín hiệu, vẫn chưa đạt]` (bấm = đặt/bỏ `hang-doi`). `hang-doi` thuộc `LoaiBoQuen` → `<DanhSachBoQuen loai branchId ct/>`,
  không thì `<DanhSachCase …/>` như cũ.
- `DanhSachBoQuen`: `useApi('/phan-tich/bo-quen?…')`; Card tiêu đề `{label} ({n})` + chip `Đang lọc … ✕` (xoá `hang-doi`); bảng Học viên
  (link `/hoc-vien/{id}`) · Lớp · Kỹ năng (`abbr` L R W S) · Chi tiết (1 dòng, `truncate` + `title`) · Từ (`W3 SEP`). Rỗng →
  `Empty "Không có học viên nào"`. `phamVi` lấy từ khung chung.
- **8b (Q22, bàn giao UX0 #3 #5):** `BranchPulse` hàng chi nhánh → `HangNhom` (`tieuDe` = nút tên chi nhánh như cũ), hàng lớp →
  `HangCon`; `PhanTichLopTab` hàng kỹ năng → `HangNhom` (bỏ ▸ tự vẽ `:44`), hàng bảng lỗi mở ra giữ `<tr><td colSpan>`. Không đổi số.
**Xong:** check xanh, commit `PR-UX4 (8): Can xu ly -> loc Danh sach Case, hang A BranchPulse/Phan tich lop`.

### Task 9: Tài liệu

- [ ] `CODE_MAP.md:44` dòng Phân tích: 5 góc nhìn mới, file `phanTich/{TongHopTestSos,TongHopVanDeHv,HieuQuaPa,YThucPhoiHop,DanhSachBoQuen}.tsx`,
  máy chủ `phanTich/{tongHop,vanDeHv,hieuQuaPa,yThucPhanTich,boQuen,phamVi}.ts`; `:252`, `:287` đổi sang Hiệu quả PA (bỏ `IssueAnalysis`);
  thêm dòng "2 dòng Cần xử lý bỏ quên → `boQuen.ts` + chỉ số sổ".
- [ ] `plan.md`: một dòng nhật ký + tick "Phân tích v2 (UX4)". Commit `PR-UX4 (9): CODE_MAP, plan.md`.

### Task 10: Nghiệm thu — kiểm đủ, bấm thử một lần bằng ảnh thật, PR

- [ ] **1.** `npm run check` xanh, **≥ B+30** (lệch do chuyển phép → ghi Nhật ký), không "Vượt trần".
- [ ] **2.** `git diff origin/main...HEAD --stat -- server/src/schema.sql server/src/migrate.ts` rỗng; không file nào ở cột "File KHÔNG
  được chạm"; `grep -rn "IssueAnalysis\|YThucAnalysisView\|VanDeHocVien\|/phan-tich/van-de[^-]\|/issue-board/skills" web/src server/src` rỗng.
- [ ] **3. Chạy thử** (bộ nhớ "Máy chủ dev trong worktree", **không** `preview_start`): DB tạm
  `$(node -e "console.log(require('os').tmpdir())")/pr-ux4-kiem.sqlite`, `PISA_DB=… npm run seed`; `vite.kiem.config.ts` tạm (5637,
  proxy `/api` → `http://127.0.0.1:4437`, **không commit**); `npm run build:server && PISA_DB=… PORT=4437 npm run dev:api` +
  `npx vite --config vite.kiem.config.ts`. Playwright **kênh Chrome**, `page.screenshot` ra `thiet-ke/anh/pr-ux4/{01..}-*.png`.
- [ ] **4. Bấm thử theo vai** (ghi từng ý vào Nhật ký):
  - **QL (2), 1440:** Tổng quan › Phân tích mở **Tổng hợp Test + SOS**; 5 góc nhìn đúng thứ tự, không "Theo giáo viên"; hàng tuần
    là hàng lớn (vạch trái), mở ra lớp thụt; cột Đạt/SOS1/2/3 có màu, ô 0 xám; chú giải có. Bấm một số → ngăn đúng số dòng.
  - **Tổng hợp vấn đề HV:** Writing gộp W1+W2; bấm số HV → ngăn "Writing · Ngữ pháp · n HV" có "Lỗi chính/Lỗi phụ"; chip lớp → đúng
    HV lớp đó; "Chỉ lỗi chính" số giảm/không tăng; bật Gộp → Ngữ pháp ⓘ, số không trùng; dòng Chưa phân loại vàng, bấm → Case.
  - **Hiệu quả PA:** không cột "Không cải thiện"; "Thời gian trung bình"; "Ít dữ liệu" ở dòng < 5; "Nên dùng" nếu đủ; 2 số cuối bấm được.
  - **Ý thức & Phối hợp:** 2 khối, không Phối hợp SOS; bấm tên HV → hồ sơ tab Ý thức; Xuất Excel mở được 3 sheet.
  - **Tổng quan:** Cần xử lý có 2 dòng mới (khi demo có dữ liệu — không có thì dựng một em trong DB tạm); bấm số → ngăn HV; **Xem** →
    Danh sách Case lọc sẵn, chip ✕ bỏ lọc. BranchPulse/Phân tích lớp hàng lớn/nhỏ đúng kiểu.
  - Link cũ `/phan-tich?goc=ket-qua` → Hiệu quả PA; `?goc=van-de` → Tổng hợp vấn đề HV.
  - **GVCN (7), GVBM (9):** không thấy tab Phân tích; gõ `/api/phan-tich/van-de-hv` → 403.
  - **375px (QL):** hàng góc nhìn cuộn ngang trong chính nó; bảng cuộn trong thẻ, cột tên dính; trang không cuộn ngang
    (`document.documentElement.scrollWidth === innerWidth`); ngăn danh sách toàn màn.
  - Không thấy ISO, "Normal", "HS", "biện pháp", "Kết quả hỗ trợ", ⚠, màu cứng lạc hệ.
  Xong: tắt API 4437, Vite 5637, `run.js`; xoá `vite.kiem.config.ts` + DB tạm; `git add thiet-ke/anh/pr-ux4/`.
- [ ] **5. Rebase + PR.** `git fetch origin && git rebase origin/main` (xung đột `routes/index.ts`, `tocDoDuong.ts`, `run.ts`,
  `IssueAnalysis.tsx` → theo bảng Chồng file), `npm run check` lại. `git push -u origin pr-ux4-phan-tich-v2`; `gh pr create` tiêu đề
  `PR-UX4 · Phân tích v2: Tổng hợp vấn đề HV, Hiệu quả PA, Ý thức gọn`; thân: tóm tắt theo Task, bảng Q1–Q23, số phép B → B+n,
  **"Không có migrate"**, ảnh, "Chuyển cho PR khác", dòng cuối `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  **Không tự merge.** Báo planning (tiếng Việt đơn giản): Phân tích còn 5 góc nhìn; bảng Test có màu Đạt/SOS; bảng vấn đề đếm
  bao nhiêu em yếu ngữ pháp, phát âm… ở lớp nào, tăng hay giảm so với lần Test trước; bảng PA cho biết loại PA nào hiệu quả, mất
  bao lâu; Ý thức còn 2 danh sách; Tổng quan có thêm 2 dòng nhắc em cần hỗ trợ mà chưa ai mở Case.

## Chuyển cho PR khác

- **PR-GV (sau deploy):** góc nhìn "Theo giáo viên" (mockup 06e) — thêm khoá vào `GOC_NHIN` trước `danh-sach`.
- **Planning:** nếu muốn nút "Nhắc GV" ở Hiệu quả PA cần đường nhắc hàng loạt (hiện chỉ `/my-work/nhac` từng việc) — Q12.
- **Planning / THUAT_NGU:** thêm "Tổng hợp vấn đề HV", "Hiệu quả PA", "Thời gian trung bình", "Học viên cần chú ý", "Thư CC", 2 nhãn Cần xử lý; bỏ "Kết quả hỗ trợ", "Vấn đề học viên" (góc nhìn).
- **Z2c:** đo `/phan-tich/van-de-hv`, `/phan-tich/hieu-qua-pa` (có `queryPlans` 2 câu con), `/tong-quan/quan-ly` trên Turso.

## Mâu thuẫn nguồn ↔ mã

| # | Mâu thuẫn | Xử lý |
|---|---|---|
| 1 | Mockup 16 v2 có "Theo giáo viên" ↔ yêu cầu PR: không làm | Q2 |
| 2 | Ghi chú kỹ thuật mockup `?goc=test-sos` ↔ khoá `tong-hop`/`van-de` đang dùng (`phanTich.ts:18`, phép kiểm `khung.tests.ts:95`) | Q1 |
| 3 | Mockup nút "Nhắc GV" ↔ không có đường nhắc hàng loạt | Q12 |
| 4 | Mockup 16 v2 bảng Tổng hợp không tô màu ↔ đặc tả N-1b bắt tô + chú giải | Đặc tả thắng (Task 6) |
| 5 | Kế hoạch UX0 giao BranchPulse/Phân tích lớp cho UX4 ↔ yêu cầu "Tổng quan chỉ khối Cần xử lý" | Q22 (Task 8b cắt được) |
| 6 | Kế hoạch UX3 sửa `IssueAnalysis.tsx:368-370` ↔ UX4 xoá file | Bảng Chồng file |
| 7 | Yêu cầu "QL chi nhánh khác 403" ↔ phép kiểm Pb `phanTich.tests.ts:214` đòi `tongHop` trả **rỗng** | Q20 |
| 8 | Pb Q5 "Vấn đề HV là hiện trạng" (`PhanTich.tsx:93-94`) ↔ mockup v2 "Case mở + đóng trong 8 tuần" | Mockup thắng (Q4) |
| 9 | Mockup đặt `LOI_CHUNG` trong `cases.ts` ↔ file dùng chung nhiều PR | Q3 |
| 10 | `vanDe.ts` hiện chỉ đếm Case **chưa xong** + ma trận theo lớp ↔ v2 đếm theo loại lỗi + "số lớp" | Viết mới `vanDeHv.ts`, xoá `vanDe.ts` |
| 11 | Mockup v1 "Chưa ai nhận" gồm cả "Case chưa có người phụ trách" ↔ đã là dòng Cần xử lý `case-chua-co-nguoi-phu-trach` | Không lặp; chỉ thêm 2 dòng Q17 |

## Nhật ký thực thi

| Ngày | Task | Ghi chú |
|---|---|---|
| 24/09 | 0 | Worktree + nhánh từ origin/main (#89 đã có). Kế hoạch đã nằm trên main nên không có commit "ke hoach" riêng. Không biến Turso. **B = 1186 + 20 (tốc độ) = 1206**. Con trỏ khớp: `HangNhom({mo,onMo,nhan,tieuDe,children,soCotDau,className})`, `HangCon({children,className,title})`, `Nhan({tone})`, `NutLuat`, `SoLieuO({giaTri,nguon,tieuDe})`, token `dat/sos1/2/3` có trong `tailwind.config.js`. DB demo: `case_signals` pending/linked/noted (noted 72), `case_issues` chỉ có `primary` (35), 10 Case có `closed_at`. |
| 24/09 | 1 | Luật thuần xong. Giữ tạm kiểu ma trận cũ tới Task 2 để `check` xanh. +`NHAN_HO_KY_NANG`, `LOAI_BO_QUEN` (Task 5). |
| 24/09 | 2–3 | Chạy chung một `check` (hai Task cùng đụng `routes/index.ts`, `phanTich.tests.ts`, `tocDoDuong.ts`), hai commit gộp một. `oVanDeHv` dòng lớp dẫn tới `/hoc-vien/lop/{id}` (đường web thật), không phải `/classes/{id}/overview` như kế hoạch. Hiệu quả PA tính "chưa ghi kết quả" từ chính kết quả `planOutcomes` (không gọi lại `plansNeedingEvaluation` → bớt một lượt truy vấn); phép kiểm đối chiếu với hàm cũ. Ngưỡng 70% tính bằng số nguyên. Chưa xoá route `/issue-board*` ở Task 3 (web cũ còn gọi) — xoá cùng `IssueAnalysis.tsx` ở Task 7. Số câu SQL đo: Vấn đề HV 15–16, Hiệu quả PA 13–14 (trần 23–26). |
| 24/09 | 4 | Ý thức dùng `statScope`/`checkClassInScope` (DISCIPLINE_STATS) như kế hoạch; đo 16 câu. Invariant Σ lớp + gom = `vi-pham-tong` có phép kiểm. |
| 24/09 | 5 | `attemptsNewestFirst` xuất + nhớ theo request; `boQuen` một hàm cho đường + 2 chỉ số + 2 dòng Cần xử lý (22 câu). Sổ 28 → 30; `CAN_XU_LY_TOI_DA` 10. `/tong-quan/quan-ly` đo 65/63 câu, không vượt trần 75/71 — không nâng trần. Kiểu `LoaiBoQuen` đặt ở `shared/domain/phanTich.ts` (kế hoạch ghi ở máy chủ) để web dùng chung. |
| 24/09 | 6–8 | Web xong, một lần `check` chung. `HangNhom` không có `sticky-col` → cột đầu dính trái bằng biến thể Tailwind `[&>td:first-child]:sticky` (`DINH_TRAI` trong `phanTich/dungChung.tsx`). Màu ô kết quả đặt trên `<span>` trong ô vì CSS `.hang-lon > td` tô nền đè lên class của `<td>`. `SoO` bọc `SoLieuO` bằng `text-left` — ngăn danh sách nằm trong ô căn phải nên chữ bị căn phải theo. Ngày/tuần từ máy chủ dùng `ngay(x, hômNay)` để bỏ năm (G-6); sửa cả `tongHop.ts` dòng phụ tuần (chỉ chữ, không đổi số). 8b làm (BranchPulse chế độ chi nhánh, Phân tích lớp). Ngoài kế hoạch: không có nút "Nhắc GV", "Theo giáo viên", "Giao bổ trợ". |
| 24/09 | 9 | CODE_MAP: dòng Phân tích, Hiệu quả PA, 2 dòng bỏ quên; plan.md một dòng nhật ký (không có danh sách tick "Phân tích v2" nên không tick). |
| 24/09 | 10 | Chạy thử trên DB tạm (seed + thêm lỗi phụ, PA, HV hai lượt dưới kỳ vọng cho có dữ liệu), API 4437/Vite 5637, Playwright kênh Chrome, ảnh ở `thiet-ke/anh/pr-ux4/`. **QL(2) 1440:** 5 góc nhìn đúng thứ tự, không "Theo giáo viên"; hàng tuần là hàng lớn, con thụt; Đạt xanh/SOS1 vàng/SOS3 đỏ, ô 0 xám, có chú giải; bấm số mở ngăn HV đúng dòng; Vấn đề HV gộp Writing W1+W2, ngăn "Listening · 4 HV" có "Lỗi chính · lớp · Case L · MT1 · GV", bật Gộp ra Ngữ pháp/Từ vựng/… + nhóm "n loại lỗi chỉ có ở một kỹ năng", dòng Chưa phân loại vàng; Hiệu quả PA có "Nên dùng", Thời gian trung bình, nhóm "5 vấn đề khác…" đóng, 2 số cuối bấm được; Ý thức 2 khối, Xuất Excel; Tổng quan Cần xử lý có 2 dòng mới, **Xem** → Danh sách Case lọc sẵn, chip ✕ bỏ lọc; `?goc=ket-qua` → hiệu-qua-pa, `?goc=chua-ai-nhan` → van-de. **GVCN(7), GVBM(9):** không thấy tab Phân tích; 4 đường `/api/phan-tich/*` → 403. **375px:** `scrollWidth === innerWidth` ở cả 6 trang; bảng cuộn trong thẻ (780 → 341), cột đầu dính trái; ngăn toàn màn (rộng 375). Không lỗi console. Lỗi hình bắt được và đã sửa: "↑1" dính chữ cột kế; ngày có năm; chữ trong ngăn căn phải. |
