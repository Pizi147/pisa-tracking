# PR-Rc1 · Cần chấm + Lịch Test + lưới chấm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax — tick each one
> in THIS file as you finish it. Tasks marked 🛑 are **gates**: stop, report to the owner, wait for an explicit answer.

| Mục | Chốt |
|---|---|
| Model khuyến nghị | **Opus 5 · XHigh** |
| Phương án B | **Fable 5.1 · High** |
| Subagent | **cùng model với session code** (Opus 5 · XHigh, hoặc Fable 5.1 · High nếu chạy phương án B). **KHÔNG dùng Haiku** cho bất kỳ task nào của PR này |
| Người rà soát | **Fable 5.1** (nếu code bằng Fable thì **Opus 5**) — khác model người code |
| Đợt | **Đợt 3**, chạy sớm, **song song PR-Qa và PR-Pa** |
| Số PR | **Một PR**, nhánh `pr-rc1-cham-diem`, không draft, **không tự merge** |
| Migrate | **KHÔNG** (xem Q18) |
| Route mới | **KHÔNG thêm đường dẫn mới** — chỉ đổi component của hai route đã có và thêm tham số truy vấn (xem Q19) |

**Goal:** Làm xong khu vực Test cho việc **chấm điểm hằng ngày**: tab **Cần chấm** (05a2 phương án A) và **Lịch Test**
dùng được thật, **một lưới chấm chung cho lớp Fast Track và lớp thường** (mở `/nhap-diem/:id` của lớp thường phải ra
lưới lớp thường), lớp thường nhập **số câu đúng / tổng số câu** với ô tổng đầu cột điền nhanh, dấu `-` của lớp thường
**tự dời môn sang tuần sau** (C08), chấm được trên điện thoại (một kỹ năng một lúc), có đường **hiệu chỉnh điểm có lý
do** cho giáo viên (RB-5), và sửa bốn lỗi lớp thường §6 gắn Rc1.

**Architecture:** Mọi luật thuần (nhóm Cần chấm theo hạn, ô lưới lớp thường, đếm ngược dấu `-`, tuần kế tiếp, câu
trạng thái chấm) đặt ở file mới `shared/domain/chamDiem.ts` để kiểm được bằng harness máy chủ (web không có bộ kiểm
thử). Máy chủ thêm **một module mới** `server/src/cham/canCham.ts` gom ba câu hỏi đọc của khu Test (Cần chấm · Lịch
Test · bảng chấm của một lớp) và **một endpoint chung** `GET /classes/:classId/cham` trả cờ `mode` (`ielts_band` /
`ratio`) kèm dữ liệu đúng loại lớp — nhờ đó giao diện chỉ còn **một trang lưới** `ChamDiemPage` chọn lưới con theo
`mode`, và hai đường dẫn cũ (`/nhap-diem/:classId`, `/bang-diem-thuong/:classId`) đều về đúng lưới. Luật dấu `-` của
lớp thường viết ở `server/src/normal/regular.ts` và **dùng lại** `setSkillWeek` (`skillSchedule.ts`) để dời tuần — không
dựng đường dời lịch thứ hai. Không có bảng mới, không có cột mới: lý do hiệu chỉnh nằm ở `audit_logs` (nơi
`scoreHistoryOf` đang đọc), dấu `-` của lớp thường dùng đúng các cột `assessment_scores.no_show_*` đã có.

**Tech Stack:** TypeScript 5.9 · React 18.3 + react-router-dom 6.28 · Vite 5 · Tailwind 3.4 (lớp tuỳ ý phải là **chuỗi
tĩnh**) · Express 4 · libsql (SQLite) · harness tự viết `server/src/tests/run.ts` (`check`/`assert`/`assertThrows`,
**không phải** Jest).

**Spec:** `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` — đọc HẾT, trọng tâm §1 (G-2, G-3,
G-6, G-7, G-9, G-11), §2 (luật chữ lớp thường), **§3.5 phần Cần chấm · Lịch Test · lưới chấm chung · mobile**, §4 (bảng
định vị), §6 (bốn dòng gắn **Rc1**), §7 (dòng **Rc1**, gồm "Nợ sau rà PR-O (#58)") · việc có mã:
`docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md` §1.4 (**R8 phần lưới, R13, R15, R16**), §1.7 (**RB-5**),
§6 (**DS02**), §5.2 (ma trận chồng file) · mockup: `thiet-ke/mockup/05a-test-cham-diem.html` (§2 lưới máy tính, §3
**phương án A**), `thiet-ke/mockup/05a2-can-cham-v2.html` (**phương án A**), `thiet-ke/mockup/10b-lop-thuong-v2.html`
§2 và §4, `thiet-ke/mockup/12-ban-do-vi-tri.html` · chữ: `thiet-ke/THUAT_NGU_DA_CHOT.md` (các dòng liệt kê ở Global
Constraints).

**Số dòng trong plan này** đo trên `main` @ `b2a0aeb` (23/09/2026, sau khi PR-O #58, PR-S1 #56, PR-AN #61, PR-S2 #64
đã merge). Mốc phép kiểm trên `main` này: **`TẤT CẢ 779 KIỂM TRA ĐỀU ĐẠT`** (gọi là **B = 779**). Trước khi sửa, mở
file xem lại — lệch vài dòng là bình thường; lệch nội dung thì 🛑 hỏi.

---

## Global Constraints

### Luật giao diện chung (spec §1 — chép gần nguyên văn; áp mọi task)

| Mã | Luật |
|---|---|
| G-1 | Dấu tích ✓ nhỏ, mảnh, cùng màu chữ phụ. Không dùng icon tích to hay có nền. |
| G-2 | Cột và hàng thẳng: số dùng `tabular-nums`; cột số canh phải hoặc giữa, cố định độ rộng (`table-layout: fixed` / `colgroup`); các hàng cùng bảng cao bằng nhau. |
| G-3 | Không dồn chữ: tối đa **một** dòng phụ dưới dòng chính, dòng phụ ≤ ~60 ký tự. Thông tin thêm đưa vào ⓘ hoặc panel. |
| G-4 | ⚠ chỉ nghĩa là **quá hạn**. Các trạng thái khác dùng badge chữ. |
| G-5 | Bỏ mọi khối chữ giải thích cho dev (`SectionNote` giải thích mô hình). Luật cần thiết đưa vào popover ⓘ cạnh tiêu đề. |
| G-6 | Ngày không bao giờ hiện dạng ISO. Ngày: `dd/mm` (cùng năm) hoặc `dd/mm/yyyy`. **Tuần lịch: `W{n} {THÁNG}`** (vd `W3 SEP`). **Tuần học trong khoá: `W{n}/{tổng}`**. Dùng hàm chung `ngay` / `tuanLich` / `tuanKhoa` của `shared/domain/hienThiNgay.ts` (PR-O tạo). |
| G-7 | Viết tắt được giữ (GVCN, GVBM, PA, SOS, FT, KV, OVR, L R W1 W2 S) luôn có tooltip bản đầy đủ. Icon ⋮ ⋯ ⓘ ▸ ✓ luôn có tooltip. |
| G-8 | Panel không chồng panel. |
| G-9 | Mọi ô dán bằng chứng nhận Ctrl+V, kéo thả, chọn tệp, dán liên kết. *(PR này không có ô bằng chứng mới — chỉ nhắc để không tự thêm ô nào thiếu chuẩn.)* |
| G-10 | Mọi số trên dashboard bấm được (`<SoLieu>`); mọi hạn hiển thị qua `<Han>`. |
| G-11 | Mobile (375px): bảng rộng cuộn ngang **trong thẻ**, trang không cuộn ngang. |
| G-12 | Mọi module có hơn một lối vào phải có mục trong bảng định vị §4. Không thêm nút ở chỗ chưa ghi trong §4. |

### Luật chữ (spec §2 — chép gần nguyên văn, phần PR này chạm)

- Nguồn: `thiet-ke/THUAT_NGU_DA_CHOT.md`. PR nào chạm chữ nào thì dùng chữ mới cho chữ đó. PR-S3 quét phần còn lại.
- **"Case"** luôn viết hoa. **HS/học sinh → HV/học viên.** Không mở đầu câu bằng "Hãy". Không viết "Normal" trên màn —
  viết **lớp thường**.
- **Lớp thường:** tên bài **Giữa khoá · Cuối khoá** (không "Progress Test/Final Test", không "MT"); kết quả **Đạt /
  Chưa đạt**, "Đạt 3/4 môn"; kỹ năng **L R W S** (W không tách Task 1/2).
- **Chữ PR-Rc1 dùng (đã tra THUAT_NGU):** tab `Cần chấm` (g1-026) · `Lịch Test` (g1-027; **không** viết "Lịch kiểm
  tra", g1-029 đã bị thay) · nút `Chấm` (g3-029), `Chấm tiếp` (g3-030) · nhóm `Quá hạn · Tuần này · Sắp tới`
  (g10-067) · `còn {n} bài` (g10-066) · `{a}/{b} bài đã nhập` (g10-065) · `{n} môn` (g10-068) · `bài dời` (g6-039) ·
  `Không có bài` (g6-030; **không** viết "chưa thấy bài", g10-070 là chữ trùng nghĩa) · `Hết Chủ nhật {ngày} → Không dự
  thi` (g10-071, dạng đầy đủ; chỗ chật dùng `Hết CN {ngày} → Không dự thi`) · `Số câu đúng` (g10-039) · cột `(số câu)`
  (g10-041) · `Giữa khoá` / `Cuối khoá` (g10-005, dạng ngắn) · `Thứ Tư` (g13-032, chỗ chật `T4`).

### Luật riêng của PR này

- **Không migrate.** Không đổi `server/src/schema.sql`, không đổi `server/src/migrate.ts` (Q18).
- **Không nới quyền.** Máy chủ vẫn chặn như cũ; ô/nút **chỉ hiện khi người xem làm được**. Dấu `-` của lớp thường dùng
  đúng hai quyền đã có: nhập điểm (`SCORE_EDIT` / `SCORE_OVERRIDE` qua `scoreEditPath`) để **ghi dấu**, và
  `SCHEDULE_MOVE`/`PLAN_WEEK` (qua `setSkillWeek`) để **dời tuần**.
- **Không đụng Kế hoạch Test.** Tab `Kế hoạch Test` (`web/src/modules/test/KeHoachTestTab.tsx`, `MockPlanPanel.tsx`),
  R9–R12, R14 **phần lịch**, T9, T15 là **PR-Rc2 (đợt 4)** — plan này chỉ ghi "Chuyển cho PR-Rc2".
- **R11 thuộc PR-Rc2.** Rc1 **không** khoá ô khi đợt đã hoàn tất. Xem "Ranh giới với PR-Rc2 (R11 ↔ RB-5)".
- **Chữ bị cấm bởi phép kiểm có sẵn** (quét cả chú thích trong `web/src`, `shared`, `server/src`): `Kế hoạch MT`,
  `Việc của tôi`, `Cả phạm vi quản lý`, `Tiến độ lớp`, `biện pháp`, `BP` (đứng riêng), `Hãy` — xem
  `server/src/tests/run.ts` khối quét chữ và `server/src/tests/hoSoHocVien.tests.ts`. Không viết các chuỗi này trong
  file mới, kể cả chú thích.
- **Không** hiện ngày dạng `2026-09-22` hay mã tuần kèm năm khi cùng năm, trên mọi màn PR này chạm.
- Lệnh kiểm: `npm run check` (= build máy chủ + `npm test` + `npm run typecheck`). **Số phép kiểm không được giảm.**
- **Không chạy lệnh nào vào database bản chính (Turso), không deploy.** Cổng thử của PR này: **API 4147, Vite 5347**
  (KHÔNG 4000/5173, không 4127/5327 của S2, không 4137/5337 của PR khác).

### Ranh giới với PR-Qa và PR-Pa (chạy song song, đợt 3)

**PR-Rc1 KHÔNG sửa các file sau** (kể cả một dòng):

| PR | File không được chạm |
|---|---|
| **Qa** (`pr-qa-hoc-vien-lop`) | `web/src/modules/students/StudentsPage.tsx`, `ClassRoster.tsx`, `IntakePanel.tsx`, `web/src/modules/classes/ClassOverviewPage.tsx`, `ClassIssueBoard.tsx`, `web/src/modules/yThuc/ClassYThucCard.tsx`, `shared/domain/hienThiNgay.ts`, `shared/domain/display.ts`, `index.html` |
| **Pa** (`pr-pa-tong-quan`) | `web/src/modules/worklist/OverviewPage.tsx`, `MetricTiles.tsx`, `Highlights.tsx`, `BranchPulse.tsx`, `WorkList.tsx`, `server/src/worklist/dashboard.ts`, `highlights.ts`, `mywork.ts`, `server/src/cases/signals.ts` |

- **Dùng** `tuanLich` / `ngay` / `tuanKhoa` của `shared/domain/hienThiNgay.ts` nhưng **không sửa file đó** (Qa đang sửa
  phần giờ VN).
- `web/src/App.tsx`: Qa và Pa **thêm** route; Rc1 chỉ **đổi phần tử** của hai route đã có (`/nhap-diem/:classId`,
  `/bang-diem-thuong/:classId`) và đổi hai dòng `import`. Gỡ xung đột bằng **giữ cả hai khối**.
- `server/src/routes/index.ts` và `shared/domain/index.ts` là file "chỉ thêm khối": Rc1 thêm **một khối liền nhau** ở
  đúng chỗ ghi trong Task, không chèn rải rác.
- `server/src/tests/run.ts`: Rc1 nối **2 dòng** ngay trước khối in tổng kết, sau khối PR-AN. PR khác cũng nối ở đó —
  giữ cả hai.
- Ô **"Bạn cần chấm: {n} bài"** trên dòng lớp nằm ở `StudentsPage.tsx` (file của Qa) → **không sửa**, xem Q19 và mục
  "Chuyển cho PR-Qa".

### Ranh giới với PR-Rc2 (R11 ↔ RB-5) — đọc kỹ trước khi làm Task 5

- **RB-5 (Rc1):** dựng **đường hiệu chỉnh điểm có lý do**: ô đã có điểm chính thức thì người **đang có quyền nhập
  điểm ô đó** (GVBM đúng môn, hoặc QL/Admin qua `score.override`) sửa được, nhưng phải ghi **lý do**; lý do vào nhật
  ký và hiện ở "Lịch sử thay đổi" của hồ sơ đợt. Đây chính là đường mà câu lỗi đang có
  (`attempts.ts` saveScore: *"Muốn sửa, dùng hiệu chỉnh điểm có ghi lý do"*) nhắc tới nhưng **chưa tồn tại**.
- **R11 (Rc2):** khi **đợt đã hoàn tất** (đủ điểm, hoặc `-` đã chốt và không còn kỹ năng chờ) thì **chỉ Quản lý** sửa
  được. Rc2 làm việc đó bằng cách siết `scoreEditPath` / thêm điều kiện ở `saveScore`, **dùng lại nguyên** tham số
  `lyDo` và nhật ký do Rc1 dựng.
- **Phụ thuộc ghi rõ:** Rc1 **không** phụ thuộc R11. Rc2 **phụ thuộc** Rc1 ở ba điểm: (1) tham số `lyDo` trên hai
  endpoint nhập điểm; (2) hằng `LY_DO_TOI_THIEU` và hàm `kiemLyDo` ở `shared/domain/chamDiem.ts`; (3) hộp thoại
  `SuaDiemCoLyDo` ở `web/src/modules/fasttrack/ScoreEntry.tsx`. Rc2 chỉ thêm điều kiện "ai được mở hộp thoại đó".

### File PR-Rc1 chạm (so với ma trận kiểm kê §5.2)

Ma trận ghi cho PR-Rc: `MockPlanPanel.tsx` (→ **Rc2**), `MockDetailPage.tsx`, `RegularSheetPage.tsx`,
`normal/regular.ts`, `fasttrack/attempts.ts`, `skillSchedule.ts`, `permissions.ts`, `policy.ts`, `ui/Filters.tsx`.
Plan này **thêm** (không PR nào chạy song song chạm): `shared/domain/chamDiem.ts` (mới), `shared/domain/index.ts` (+1
dòng), `server/src/cham/canCham.ts` (mới), `server/src/routes/index.ts` (một khối), `server/src/tests/chamDiem.tests.ts`
(mới) + 2 dòng `run.ts`, `web/src/modules/cham/*` (mới), `web/src/modules/test/CanChamTab.tsx`, `LichTestTab.tsx`,
`web/src/modules/fasttrack/ScoreEntry.tsx`, `web/src/App.tsx` (2 dòng import + 2 phần tử route), `CODE_MAP.md`,
`plan.md` (ô tick). **Không** chạm `permissions.ts` và `skillSchedule.ts` (dùng lại nguyên hàm — nếu thấy buộc phải
sửa thì 🛑 hỏi trước).

---

## Quyết định session planning tự chốt khi nguồn im lặng (người rà soát kiểm lại)

| # | Câu hỏi | Chọn | Vì sao |
|---|---|---|---|
| Q1 | Lớp thường ghi `-` thì dời **ngay** hay chờ hết Chủ nhật như FT? | **Dời ngay khi ghi** | `policy.ts` C08: *"ghi '-' thì môn đó tự dời sang tuần sau"*; mockup 10b §2 ô đã ghi `-` hiện ngay "L dời sang W4 SEP". Luật chốt-Chủ-nhật của FT tồn tại vì FT còn phải quyết "có vắng hay không"; lớp thường không có khái niệm vắng-hết-nghĩa-vụ, chỉ có dời lịch. |
| Q2 | Dời sang tuần nào? | **Tuần kế tiếp của chính môn đó** (thứ Hai của `week_start + 7`), tạo tuần bằng `ensurePeriod` | Spec §3.5 "tự dời sang tuần sau". Không đoán xa hơn. |
| Q3 | Gỡ dấu `-` lớp thường (bấm nhầm)? | **Có**, gỡ được khi ô **chưa có điểm**: trả môn về đúng tuần cũ (`no_show_period_id`) và xoá dấu | Không có bước xác nhận nào ở giữa nên bấm nhầm phải sửa được; tuần cũ đã lưu sẵn trong chính dòng điểm nên không phải đoán. |
| Q4 | Dời nhiều lần (tuần sau em lại không làm bài)? | **Không chặn**, mỗi lần một dòng nhật ký; **không** tăng `absence_move_count` | Bộ đếm đó là bộ đếm **vắng của Fast Track** (đường `absence.ts`); mượn nó là làm hỏng nghĩa một con số đang dùng. Spec im lặng về giới hạn → không tự bịa. |
| Q5 | Dời làm phần thi vượt qua đợt kế tiếp (Giữa khoá vượt Cuối khoá)? | **Chặn**, báo đúng câu của `checkSkillWeekMove` và **không** ghi dấu `-` | Dùng lại nguyên luật chống chồng đợt đã có; ghi dấu rồi mới chặn thì dữ liệu nửa vời. |
| Q6 | Gọi hai ô là gì: spec ghi "số câu đúng / tổng số câu", mã hiện ghi "điểm đạt / tổng điểm" | **Theo spec: "số câu đúng / tổng số câu"**; ⓘ nói thêm một câu: *"Writing và Speaking chấm theo thang điểm thì điền điểm đạt / tổng điểm."* | Thứ tự nguồn §0: spec + mockup thắng chú thích trong mã. Câu thêm giữ lại đúng lý do mà mã cũ nêu, không mất thông tin. |
| Q7 | Ô "tổng" đầu cột điền nhanh cả cột: đè lên ô đã có tổng không? | **Không đè.** Nút ↓ chỉ điền vào ô **đang trống tổng**; ô đã có tổng khác giữ nguyên và **viền vàng** | Mockup 10b §2: "rồi sửa riêng từng em nếu đề khác (viền vàng = khác tổng của cột)". Đè là xoá việc người ta vừa sửa. |
| Q8 | Tổng cố định theo chương trình? | **Không có** (spec §3.5 nói thẳng) | Đề đổi theo mùa; đoán tổng là đoán luôn đạt/chưa đạt. |
| Q9 | Cột "Kết quả" của lưới lớp thường khi chưa đủ bốn môn | **"Đạt {k}/{n} môn đã chấm"** + dòng phụ một dòng "còn {L, R} chưa chấm" | Mockup 10b §2 ghi "Đạt 2/2 môn đã chấm"; spec §3.5 "thiếu điểm không tính là chưa đạt". Máy chủ **không đổi** (`evaluateRegular` giữ nguyên), chỉ đổi cách nói. |
| Q10 | Nhóm của Cần chấm tính theo cái gì? | Hạn **sớm nhất trong các môn còn nợ** của dòng đó: `< hôm nay` → **Quá hạn**; nằm trong tuần lịch chứa hôm nay → **Tuần này**; còn lại (kể cả chưa có hạn vì chưa tới tuần thi) → **Sắp tới** | Mockup 05a2 A: ba mục cố định, hạn nằm ở tên mục. Không có hạn mà xếp vào "Quá hạn" là vu oan. |
| Q11 | Một dòng Cần chấm là gì? | **Một lớp + một đợt** (FT: `MT{n}`; lớp thường: `Giữa khoá`/`Cuối khoá`), gộp các kỹ năng; "còn n bài" = số **ô** (HV × kỹ năng) còn phải chấm **trong phạm vi đang chọn** | Mockup 05a §1 và 05a2 A. |
| Q12 | Nút "Chấm" mở gì? | `/nhap-diem/{classId}?kind={kind}&periodId={id}&kn={kỹ năng}` — lưới đúng lớp, đúng đợt, **cuộn tới em đầu tiên chưa có điểm** của kỹ năng đó | Mockup 05a2 câu cuối. `periodId` chỉ gửi cho lớp FT (lưới FT lọc theo tuần); lớp thường lọc theo `kind`. |
| Q13 | Cần chấm đang lọc ngầm theo lớp (nợ sau rà PR-O) | Có `classId` trên đường dẫn thì **hiện một chip "Đang lọc: lớp {mã} ✕"** ngay trên danh sách; bấm ✕ bỏ lọc (xoá `classId`, giữ các bộ lọc khác) | Nợ ghi ở spec §7 dòng Rc1. |
| Q14 | Lịch Test hiển thị theo gì? | Nhóm **theo lớp**, trong lớp mỗi dòng là **một đợt × một tuần**: `đợt · kỹ năng · n HV · trạng thái chấm`; lọc theo **tuần của chính môn** (như `classScoreSheet`), không theo tuần của cả đợt | Spec §3.5; lọc theo tuần của cả đợt làm biến mất đúng những bài đang phải chấm. |
| Q15 | "Bài dời" trên Cần chấm | Không dựng cờ mới: dòng phụ ghi **kỹ năng + tuần thi của chính nó** khi tuần đó khác tuần của đợt (ví dụ `Speaking · W3 AUG`) | Cờ "đã dời" suy từ dữ liệu hiện có đều có trường hợp sai (FT tách tuần là bình thường). Nói tuần thật thì luôn đúng. |
| Q16 | Ngưỡng mobile "một kỹ năng một lúc" | **< 768px** (`md` của Tailwind) cho **cả FT và lớp thường**; ≥ 768px giữ lưới | Mockup 05a §3 phương án A; cùng ngưỡng với thanh dưới 4 nút PR-O đã dùng. |
| Q17 | DS02 đếm ngược trong ô `-` | **Chỉ lớp FT**: "Còn 2 ngày để sửa" / "Còn hôm nay để sửa" — chỉ chữ xám, không tô đỏ. **Lớp thường không đếm ngược** (đã dời ngay), thay bằng "Đã dời sang W4 SEP" | plan.md §20 DS02 ("chỉ chữ, không tô đỏ"); lớp thường không có cửa sổ sửa nên đếm ngược là nói dối. |
| Q18 | Có migrate không? | **Không.** Lý do hiệu chỉnh ghi vào `audit_logs.after_json.lyDo` (chỗ `scoreHistoryOf` đang đọc); dấu `-` lớp thường dùng cột `assessment_scores.no_show_period_id/_by/_at` đã có | Không thêm bảng khi dữ liệu đã có chỗ đúng nghĩa. Bớt một PR có migrate trong đợt 3. |
| Q19 | Ô "Bạn cần chấm: {n} bài" ở dòng lớp (`StudentsPage.tsx`) — thêm vào §4 hay bỏ? | **Không sửa file của Qa.** Coi ô đó là **cùng một mục "Chấm điểm"** mà §4 đã ghi (*"⋯ hộp lớp ở Học viên & Lớp (Q11)"*), nên **không cần thêm dòng mới vào §4**. Rc1 chỉ bảo đảm đường `/test/can-cham?classId=…&scope=…` chạy đúng và có chip bỏ lọc (Q13); việc đổi đích link + cắt chữ ở 375px ghi ở "Chuyển cho PR-Qa" | Đúng ràng buộc song song; PR-Qa đang làm lại chính hộp lớp đó (badge `Lớp còn {n} bài chưa nhập điểm`). |
| Q20 | R13 (bộ chọn tuần) | Bộ chọn tuần đã được dựng lại ở vòng trước; Rc1 (a) đổi mã tuần hiển thị sang `tuanLich(...)` theo G-6 (đang dùng `weekCodeOf` nên ra "W3 SEP **2026**"), (b) bấm thử ở 600px, trong ngăn/hộp thoại và 375px rồi ghi kết quả | R13 trong kiểm kê là ❓ "phải bấm thử"; lỗi G-6 thì đọc mã thấy ngay. |
| Q21 | Endpoint chung cho lưới | Thêm **`GET /classes/:classId/cham`**; giữ nguyên `/classes/:id/score-sheet` và `/regular/classes/:classId/sheet` (còn nơi khác gọi) nhưng **`classScoreSheet` chặn lớp thường** bằng câu nói rõ đường đúng | Một cửa cho giao diện, mà không phải sửa mọi nơi gọi cũ trong một PR đang chạy song song. |
| Q22 | Trạng thái Case ở bảng lớp thường (lỗi §6 dòng 4) | Tìm Case theo **học viên + khoá + hạng mục của môn chưa đạt**, không theo `attempt_id`; dòng Giữa khoá và dòng Cuối khoá đều thấy đúng Case của mình | `sos_cases.attempt_id` luôn trỏ lượt **mới nhất** đã chạm vào Case (chú thích `refreshRegularOutcome` nói rõ), nên dòng cũ mất trạng thái. |

🛑 **Gate trước khi code:** đọc bảng Q1–Q22. Thấy Q nào trái đặc tả hoặc trái mockup thì dừng và hỏi.

---

## Bản đồ file

| File | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `shared/domain/chamDiem.ts` | **Tạo** | Luật thuần: `MucCanCham`, `mucCanCham`, `nhomCanCham`, `oLuoiThuong`, `ketQuaThuong`, `demNguocSuaDau`, `tuanKeTiep`, `trangThaiChamLabel`, `kiemLyDo`, `LY_DO_TOI_THIEU` |
| `shared/domain/index.ts` | Sửa (+1 dòng) | `export * from './chamDiem.ts';` |
| `server/src/cham/canCham.ts` | **Tạo** | `canChamList(p, f)`, `lichTest(p, periodId, branchId)`, `chamSheet(p, classId, opts)` |
| `server/src/normal/regular.ts:329-397` | Sửa | `saveRegularScore` nhận `noShow` và `lyDo` |
| `server/src/normal/regular.ts` (cuối phần "nhập điểm") | Sửa (thêm hàm) | `reportRegularNoShow(p, attemptId, skill, bat, today)` — C08 |
| `server/src/normal/regular.ts:581-587, 600-652` | Sửa | Case theo học viên + hạng mục (Q22); mỗi môn thêm `noShow`, `movedFrom`, `canEdit` |
| `server/src/fasttrack/attempts.ts:1148-1153` | Sửa | Bỏ câu chặn cũ, chỉ đường sang endpoint lớp thường |
| `server/src/fasttrack/attempts.ts:1075-1086` | Sửa | `ScorePatch` thêm `lyDo?: string \| null` |
| `server/src/fasttrack/attempts.ts:1329-1334` | Sửa | Ghi `lyDo` vào nhật ký `score.edit`/`score.override` |
| `server/src/fasttrack/attempts.ts:735-760` | Sửa | `scoreHistoryOf` trả thêm `lyDo` |
| `server/src/fasttrack/attempts.ts:1358-1370` | Sửa | `classScoreSheet` chặn lớp thường (lỗi §6 dòng 1) |
| `server/src/fasttrack/attempts.ts:590-700` | Sửa | `listAttempts` trả thêm `pendingDetail` (hạn của các môn còn nợ **theo phạm vi**) |
| `server/src/routes/index.ts` | Sửa (một khối) | `GET /cham/can-cham`, `GET /cham/lich-test`, `GET /classes/:classId/cham`; hai endpoint nhập điểm nhận `lyDo`; endpoint lớp thường nhận `noShow` |
| `server/src/tests/chamDiem.tests.ts` | **Tạo** | Phép kiểm PR-Rc1 |
| `server/src/tests/run.ts` (cuối file) | Sửa (+2 dòng) | Gọi `runChamDiemTests` |
| `web/src/modules/cham/ChamDiemPage.tsx` | **Tạo** | Khung lưới chấm chung: đầu trang, chọn đợt/tuần, ⓘ, trạng thái lưu, chọn lưới theo `mode`, chế độ điện thoại |
| `web/src/modules/cham/LuoiFT.tsx` | **Tạo** (dời từ `ScoreSheetPage.tsx`) | Lưới Fast Track |
| `web/src/modules/cham/LuoiThuong.tsx` | **Tạo** (dời từ `RegularSheetPage.tsx`) | Lưới lớp thường: đúng/tổng, tổng đầu cột, viền vàng, dấu `-` |
| `web/src/modules/cham/MotKyNang.tsx` | **Tạo** | Chấm trên điện thoại: một kỹ năng một lúc |
| `web/src/modules/fasttrack/ScoreSheetPage.tsx` | **Xoá** | Nội dung chuyển sang `cham/` |
| `web/src/modules/normal/RegularSheetPage.tsx` | **Xoá** | Nội dung chuyển sang `cham/LuoiThuong.tsx` |
| `web/src/modules/fasttrack/ScoreEntry.tsx` | Sửa | DS02 đếm ngược; hộp `SuaDiemCoLyDo` (RB-5); ô lớp thường `ODiemThuong` |
| `web/src/modules/test/CanChamTab.tsx` | Sửa (viết lại) | 05a2 phương án A |
| `web/src/modules/test/LichTestTab.tsx` | Sửa (viết lại) | Lịch Test theo lớp |
| `web/src/modules/fasttrack/MockDetailPage.tsx` | Sửa | R15 (chọn đợt khác), R16 (nút mang đợt/tuần) |
| `web/src/ui/Filters.tsx` | Sửa | R13: mã tuần theo G-6 |
| `web/src/App.tsx` | Sửa (4 dòng) | Hai route dùng `ChamDiemPage` |
| `shared/domain/policy.ts` | Sửa (chú thích) | C08 "CHƯA NỐI DÂY" → đã nối dây |
| `CODE_MAP.md`, `plan.md` | Sửa | Bản đồ mã + ô tick |

---

### Task 0: Chuẩn bị

**Files:** không sửa mã.

- [x] **Step 1: Worktree.** Từ `main` mới nhất (`git fetch origin && git log -1 origin/main` phải là merge PR #64):
  tạo worktree nhánh `pr-rc1-cham-diem` (skill `superpowers:using-git-worktrees`), ví dụ
  `.claude/worktrees/pr-rc1-cham-diem`. **Không checkout nhánh khác trong thư mục chính.** `npm ci` trong worktree nếu
  chưa có `node_modules`.

- [x] **Step 2: Kiểm không có biến Turso.**

```bash
node -e "for (const k of ['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BAN_CHINH','PISA_CHO_PHEP_MIGRATE_TURSO','PISA_CHO_PHEP_SEED_TURSO']) if (process.env[k]) { console.error('CÓ BIẾN', k); process.exit(1) } ; console.log('sạch')"
```
Expected: `sạch`. Có biến thì đóng cửa sổ, mở cửa sổ mới.

- [x] **Step 3: Mốc phép kiểm.** Run: `npm test 2>&1 | tail -3`. Expected: `TẤT CẢ 779 KIỂM TRA ĐỀU ĐẠT` (hoặc số lớn
  hơn nếu `main` đã nhận PR khác). Ghi con số vào Nhật ký — gọi là **B**; mọi "Expected" bên dưới tính cộng dồn từ B.

- [x] **Step 4: Đọc Global Constraints và bảng Q1–Q22.** Thấy Q nào sai với đặc tả thì 🛑 hỏi trước khi code.

- [x] **Step 5: Xem hiện trạng để không sửa nhầm.** Mở đọc (không sửa):
  `web/src/modules/fasttrack/ScoreSheetPage.tsx`, `web/src/modules/normal/RegularSheetPage.tsx`,
  `server/src/fasttrack/attempts.ts` (`saveScore` ~1141, `classScoreSheet` ~1358, `listAttempts` ~487),
  `server/src/normal/regular.ts`, `server/src/fasttrack/skillSchedule.ts` (`setSkillWeek` ~525).

---

### Task 1: Luật thuần `shared/domain/chamDiem.ts` + file phép kiểm

**Files:**
- Create: `shared/domain/chamDiem.ts`
- Modify: `shared/domain/index.ts` (thêm đúng một dòng `export * from './chamDiem.ts';` sau dòng `dieuHuong.ts`)
- Create: `server/src/tests/chamDiem.tests.ts`
- Modify: `server/src/tests/run.ts` (2 dòng, ngay trước khối in tổng kết, sau khối PR-AN)

**Interfaces:**
- Produces:
  - `type MucCanCham = 'qua-han' | 'tuan-nay' | 'sap-toi'`; `MUC_CAN_CHAM_LABEL: Record<MucCanCham, string>`
  - `mucCanCham(han: string | null, homNay: string, cuoiTuanNay: string): MucCanCham`
  - `nhomCanCham<T extends { han: string | null }>(dong: T[], o: { homNay: string; cuoiTuanNay: string }): Array<{ muc: MucCanCham; nhan: string; dong: T[] }>`
  - `oLuoiThuong(i: { diem: number | null; tong: number | null; tongCot: number | null }): { hien: string; vienVang: boolean; trong: boolean }`
  - `ketQuaThuong(i: { dat: number; daCham: number; tong: number; thieu: string[] }): { chinh: string; phu: string | null }`
  - `demNguocSuaDau(cuoiTuan: string | null, homNay: string): string | null`
  - `tuanKeTiep(weekStart: string): string`
  - `trangThaiChamLabel(i: { conBai: number; tong: number; quaHan: boolean; chuaToiHan: boolean }): string`
  - `LY_DO_TOI_THIEU = 5`; `kiemLyDo(s: string | null | undefined): string | null` (trả câu lỗi, `null` = hợp lệ)

- [ ] **Step 1: Viết file phép kiểm (đỏ).** Tạo `server/src/tests/chamDiem.tests.ts`:

```ts
/**
 * PHÉP KIỂM PR-Rc1: Cần chấm · Lịch Test · lưới chấm chung (spec 2026-09-22-ux-toan-web-truoc-deploy-design §3.5, §6;
 * kiểm kê §1.4 R8/R13/R15/R16, §1.7 RB-5, §6 DS02). Kế hoạch: docs/superpowers/plans/2026-09-22-pr-rc1-cham-diem.md.
 *
 * Harness do `run.ts` sở hữu và truyền vào; file này không tự mở database. Học viên/lượt dùng ở đây do CHÍNH file này
 * tạo, không đụng dữ liệu của bộ demo (trừ nơi ghi rõ là đọc lớp demo MB-FOU 12 / MB-FT 101).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runChamDiemTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Rc1 · Cần chấm + Lịch Test + lưới chấm');

  check('PR-Rc1 · Q10 Nhóm Cần chấm: quá hạn / tuần này / sắp tới; chưa có hạn là "Sắp tới"', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    // Hôm nay 22/09/2026 (thứ Ba), tuần lịch 21/09 – 27/09.
    const homNay = '2026-09-22'; const cuoi = '2026-09-27';
    eq(d.mucCanCham('2026-09-21', homNay, cuoi), 'qua-han', 'Hạn hôm qua');
    eq(d.mucCanCham('2026-09-22', homNay, cuoi), 'tuan-nay', 'Hạn đúng hôm nay vẫn còn kịp');
    eq(d.mucCanCham('2026-09-27', homNay, cuoi), 'tuan-nay', 'Hạn Chủ nhật cuối tuần này');
    eq(d.mucCanCham('2026-09-28', homNay, cuoi), 'sap-toi', 'Hạn tuần sau');
    eq(d.mucCanCham(null, homNay, cuoi), 'sap-toi', 'Chưa có hạn thì KHÔNG phải quá hạn');
    const nhom = d.nhomCanCham(
      [{ han: '2026-09-28' }, { han: null }, { han: '2026-09-21' }, { han: '2026-09-23' }],
      { homNay, cuoiTuanNay: cuoi },
    );
    eq(nhom.map((x: any) => `${x.muc}:${x.dong.length}`).join(','), 'qua-han:1,tuan-nay:1,sap-toi:2', 'Thứ tự và số dòng');
    eq(nhom[0].nhan, 'Quá hạn', 'Chữ mục 1');
    eq(nhom[1].nhan, 'Tuần này', 'Chữ mục 2');
    eq(nhom[2].nhan, 'Sắp tới', 'Chữ mục 3');
  });

  check('PR-Rc1 · Q7 Ô lưới lớp thường: hai số, viền vàng khi tổng khác tổng của cột', () => {
    const o = (diem: any, tong: any, tongCot: any) => d.oLuoiThuong({ diem, tong, tongCot });
    assert(o(33, 40, 40).hien === '33/40' && !o(33, 40, 40).vienVang, 'Cùng tổng cột thì không viền vàng');
    assert(o(27, 38, 40).vienVang, 'Khác tổng cột thì viền vàng');
    assert(!o(27, 38, null).vienVang, 'Cột chưa đặt tổng chung thì không có gì để khác');
    assert(o(null, null, 40).trong && o(null, null, 40).hien === '', 'Chưa nhập là ô trống, không phải 0');
    assert(o(null, 40, 40).trong, 'Có tổng mà chưa có điểm vẫn là chưa nhập');
  });

  check('PR-Rc1 · Q9 Kết quả lớp thường: thiếu điểm KHÁC chưa đạt', () => {
    const eq = (got: any, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.ketQuaThuong({ dat: 2, daCham: 2, tong: 4, thieu: ['W', 'S'] }).chinh, 'Đạt 2/2 môn đã chấm', 'Mới chấm hai môn');
    eq(d.ketQuaThuong({ dat: 2, daCham: 2, tong: 4, thieu: ['W', 'S'] }).phu, 'còn W, S chưa chấm', 'Dòng phụ gọi tên môn');
    eq(d.ketQuaThuong({ dat: 3, daCham: 4, tong: 4, thieu: [] }).chinh, 'Đạt 3/4 môn', 'Đủ điểm thì bỏ chữ "đã chấm"');
    eq(d.ketQuaThuong({ dat: 0, daCham: 0, tong: 4, thieu: ['L', 'R', 'W', 'S'] }).chinh, 'Chưa nhập điểm', 'Chưa có gì');
    assert(d.ketQuaThuong({ dat: 0, daCham: 0, tong: 4, thieu: ['L', 'R', 'W', 'S'] }).phu === null,
      'Chưa nhập môn nào thì không liệt kê cả bốn môn (G-3)');
  });

  check('PR-Rc1 · DS02 đếm ngược trong ô dấu "-" (chỉ chữ, không tô đỏ)', () => {
    const eq = (got: any, want: any, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-25'), 'Còn 2 ngày để sửa', 'Hai ngày');
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-26'), 'Còn 1 ngày để sửa', 'Một ngày');
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-27'), 'Còn hôm nay để sửa', 'Đúng Chủ nhật');
    eq(d.demNguocSuaDau('2026-09-27', '2026-09-28'), null, 'Hết hạn thì không đếm nữa');
    eq(d.demNguocSuaDau(null, '2026-09-22'), null, 'Không có tuần thì không đếm');
  });

  check('PR-Rc1 · Q2 Tuần kế tiếp luôn là thứ Hai kế sau tuần thi', () => {
    assert(d.tuanKeTiep('2026-09-14') === '2026-09-21', d.tuanKeTiep('2026-09-14'));
    assert(d.tuanKeTiep('2026-09-28') === '2026-10-05', d.tuanKeTiep('2026-09-28'));
  });

  check('PR-Rc1 · RB-5 lý do hiệu chỉnh: bắt buộc, đủ dài, không nhận khoảng trắng', () => {
    assert(d.LY_DO_TOI_THIEU === 5, 'Ngưỡng là 5 ký tự');
    assert(d.kiemLyDo(null) !== null && d.kiemLyDo('   ') !== null, 'Trống thì phải báo lỗi');
    assert(d.kiemLyDo('sai') !== null, 'Quá ngắn thì phải báo lỗi');
    assert(d.kiemLyDo('Chấm nhầm đề B') === null, 'Lý do đủ dài thì hợp lệ');
    assert(!/Hãy/.test(String(d.kiemLyDo(null))), 'Câu lỗi không mở đầu bằng "Hãy"');
  });

  check('PR-Rc1 · Câu trạng thái chấm dùng chung cho Lịch Test', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.trangThaiChamLabel({ conBai: 0, tong: 8, quaHan: false, chuaToiHan: false }), 'Đã chấm xong', 'Xong');
    eq(d.trangThaiChamLabel({ conBai: 3, tong: 8, quaHan: false, chuaToiHan: false }), 'Còn 3 bài', 'Còn bài');
    eq(d.trangThaiChamLabel({ conBai: 3, tong: 8, quaHan: true, chuaToiHan: false }), 'Quá hạn · còn 3 bài', 'Quá hạn');
    eq(d.trangThaiChamLabel({ conBai: 8, tong: 8, quaHan: false, chuaToiHan: true }), 'Chưa tới hạn', 'Chưa tới tuần thi');
  });
}
```

- [ ] **Step 2: Nối vào harness.** Cuối `server/src/tests/run.ts`, **ngay trước** khối `console.log('\n' + '='.repeat(60))`,
  sau khối PR-AN:

```ts
// ==================================================================== PR-Rc1 (Cần chấm · Lịch Test · lưới chấm)

const { runChamDiemTests } = await import('./chamDiem.tests.ts');
await runChamDiemTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```

- [ ] **Step 3: Chạy cho đỏ.** Run: `npm test 2>&1 | tail -20`. Expected: hỏng ở khối `PR-Rc1` với lỗi kiểu
  `d.mucCanCham is not a function`.

- [ ] **Step 4: Viết `shared/domain/chamDiem.ts`.**

```ts
/**
 * LUẬT THUẦN CỦA VIỆC CHẤM ĐIỂM — khu vực Test (spec §3.5).
 *
 * Ở đây chỉ có luật KHÔNG ĐỌC DATABASE: xếp việc chấm vào ba mục theo hạn, dựng ô của lưới lớp thường, đếm ngược cửa
 * sổ sửa dấu "-", tính tuần kế tiếp, và luật lý do hiệu chỉnh điểm. Máy chủ và giao diện cùng gọi một nơi, nên hai
 * bên không thể nói hai con số khác nhau — và harness kiểm được mà không cần mở trình duyệt.
 */
import { mondayOfDate } from './week.ts';

export type MucCanCham = 'qua-han' | 'tuan-nay' | 'sap-toi';

export const MUC_CAN_CHAM: readonly MucCanCham[] = ['qua-han', 'tuan-nay', 'sap-toi'] as const;

export const MUC_CAN_CHAM_LABEL: Record<MucCanCham, string> = {
  'qua-han': 'Quá hạn',
  'tuan-nay': 'Tuần này',
  'sap-toi': 'Sắp tới',
};

/**
 * Một việc chấm thuộc mục nào. CHƯA CÓ HẠN KHÔNG PHẢI QUÁ HẠN: môn chưa tới tuần thi thì chưa nợ ai cái gì, xếp nó
 * vào "Quá hạn" là vu oan cho người chấm.
 */
export function mucCanCham(han: string | null, homNay: string, cuoiTuanNay: string): MucCanCham {
  if (!han) return 'sap-toi';
  const d = han.slice(0, 10);
  if (d < homNay.slice(0, 10)) return 'qua-han';
  return d <= cuoiTuanNay.slice(0, 10) ? 'tuan-nay' : 'sap-toi';
}

/** Ba mục cố định, luôn đủ ba (mục rỗng vẫn hiện với số 0 — mockup 05a2 phương án A). */
export function nhomCanCham<T extends { han: string | null }>(
  dong: T[], o: { homNay: string; cuoiTuanNay: string },
): Array<{ muc: MucCanCham; nhan: string; dong: T[] }> {
  return MUC_CAN_CHAM.map((muc) => ({
    muc,
    nhan: MUC_CAN_CHAM_LABEL[muc],
    dong: dong.filter((x) => mucCanCham(x.han, o.homNay, o.cuoiTuanNay) === muc),
  }));
}

/**
 * MỘT Ô CỦA LƯỚI LỚP THƯỜNG: số câu đúng / tổng số câu (Writing và Speaking chấm theo thang điểm thì là điểm đạt /
 * tổng điểm — cùng hai ô, xem ⓘ của lưới).
 *
 * `vienVang` = tổng của dòng này KHÁC tổng đang đặt ở đầu cột, tức là em làm đề khác. Không có tổng cố định theo
 * chương trình, nên "khác tổng cột" là chỉ báo duy nhất có thật.
 */
export function oLuoiThuong(i: { diem: number | null; tong: number | null; tongCot: number | null }): {
  hien: string; vienVang: boolean; trong: boolean;
} {
  const trong = i.diem === null || i.diem === undefined;
  return {
    trong,
    hien: trong || i.tong === null ? '' : `${i.diem}/${i.tong}`,
    vienVang: i.tong !== null && i.tongCot !== null && i.tong !== i.tongCot,
  };
}

/**
 * CÂU KẾT QUẢ CỦA MỘT DÒNG LỚP THƯỜNG. Thiếu điểm KHÁC chưa đạt (spec §3.5): môn chưa chấm không bị đếm thành môn
 * trượt, nên khi chưa đủ điểm thì nói rõ "trên số môn ĐÃ CHẤM".
 */
export function ketQuaThuong(i: { dat: number; daCham: number; tong: number; thieu: string[] }): {
  chinh: string; phu: string | null;
} {
  if (i.daCham === 0) return { chinh: 'Chưa nhập điểm', phu: null };
  const du = i.daCham >= i.tong;
  return {
    chinh: du ? `Đạt ${i.dat}/${i.tong} môn` : `Đạt ${i.dat}/${i.daCham} môn đã chấm`,
    phu: du || !i.thieu.length ? null : `còn ${i.thieu.join(', ')} chưa chấm`,
  };
}

/**
 * DS02 — đếm ngược nhẹ trong ô đang mang dấu "-" của lớp Fast Track: còn bao nhiêu ngày để đổi sang điểm thật trước
 * khi hết Chủ nhật của tuần thi. CHỈ CHỮ, không tô đỏ (plan.md §20 DS02). Lớp thường không dùng hàm này: ở đó dấu "-"
 * dời môn sang tuần sau ngay, không có cửa sổ sửa.
 */
export function demNguocSuaDau(cuoiTuan: string | null, homNay: string): string | null {
  if (!cuoiTuan) return null;
  const het = cuoiTuan.slice(0, 10);
  const nay = homNay.slice(0, 10);
  if (nay > het) return null;
  if (nay === het) return 'Còn hôm nay để sửa';
  const soNgay = Math.round((Date.parse(`${het}T00:00:00Z`) - Date.parse(`${nay}T00:00:00Z`)) / 86400000);
  return `Còn ${soNgay} ngày để sửa`;
}

/** Thứ Hai của tuần kế tiếp — dùng khi lớp thường ghi "-" và môn đó tự dời (C08). */
export function tuanKeTiep(weekStart: string): string {
  const monday = mondayOfDate(weekStart);
  return new Date(Date.parse(`${monday}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10);
}

/** Một câu trạng thái chấm cho Lịch Test và cho dòng Cần chấm. */
export function trangThaiChamLabel(i: { conBai: number; tong: number; quaHan: boolean; chuaToiHan: boolean }): string {
  if (i.conBai === 0) return 'Đã chấm xong';
  if (i.chuaToiHan) return 'Chưa tới hạn';
  return i.quaHan ? `Quá hạn · còn ${i.conBai} bài` : `Còn ${i.conBai} bài`;
}

/** RB-5 — sửa một ô đã có điểm chính thức thì phải nói vì sao. Ngắn quá thì không phải một lý do. */
export const LY_DO_TOI_THIEU = 5;

export function kiemLyDo(s: string | null | undefined): string | null {
  const t = (s ?? '').trim();
  if (!t) return 'Sửa điểm đã nhập thì phải ghi lý do.';
  if (t.length < LY_DO_TOI_THIEU) return `Lý do cần ít nhất ${LY_DO_TOI_THIEU} ký tự để người sau đọc còn hiểu.`;
  return null;
}
```

- [ ] **Step 5: Thêm dòng xuất.** `shared/domain/index.ts`, ngay sau `export * from './dieuHuong.ts';`:

```ts
export * from './chamDiem.ts';
```

- [ ] **Step 6: Chạy lại.** Run: `npm test 2>&1 | tail -5`. Expected: `TẤT CẢ B+7 KIỂM TRA ĐỀU ĐẠT`.

- [ ] **Step 7: Commit.**

```bash
git add shared/domain/chamDiem.ts shared/domain/index.ts server/src/tests/chamDiem.tests.ts server/src/tests/run.ts
git commit -m "PR-Rc1 (1): luật thuần của việc chấm điểm + khung phép kiểm"
```

---

### Task 2: C08 — lớp thường ghi `-` thì môn đó tự dời sang tuần sau

**Files:**
- Modify: `server/src/normal/regular.ts` (thêm `reportRegularNoShow` sau `saveRegularScore`; `saveRegularScore` nhận `noShow`)
- Modify: `server/src/fasttrack/attempts.ts:1148-1153` (bỏ câu chặn cũ)
- Modify: `server/src/routes/index.ts` (endpoint `PUT /regular/attempts/:id/scores/:skill` nhận `noShow`)
- Modify: `server/src/tests/chamDiem.tests.ts` (thêm phép kiểm)

**Interfaces:**
- Consumes: `setSkillWeek` (`server/src/fasttrack/skillSchedule.ts`), `ensurePeriod`, `mondayOf`
  (`server/src/platform/week.ts`), `tuanKeTiep` (Task 1), `scoreEditPath` (`server/src/permissions.ts`).
- Produces: `export function reportRegularNoShow(p: Principal, attemptId: number, skill: string, bat: boolean, today?: string):
  { moved: boolean; tuanCu: string | null; tuanMoi: string | null; result: RegularResult }`.

- [ ] **Step 1: Phép kiểm (đỏ).** Thêm vào cuối `runChamDiemTests` trong `server/src/tests/chamDiem.tests.ts`:

```ts
  // ---------------------------------------------------------------- C08: dấu "-" của lớp thường
  const regular: any = await import('../normal/regular.ts');
  const skillSched: any = await import('../fasttrack/skillSchedule.ts');
  const NOW = new Date().toISOString();

  /** Một học viên mới ở MB-FOU 12 (lớp thường) + một bài Giữa khoá đã xếp tuần, bốn môn cùng tuần. */
  let stt = 0;
  function taoBaiThuong(weekStart: string): { sid: number; attemptId: number } {
    stt += 1;
    const tag = `RC1-${stt}`;
    const cid = classId('MB-FOU 12');
    const branch = (conn.prepare('SELECT branch_id AS b FROM classes WHERE id = ?').get(cid) as any).b;
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, branch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, cid, NOW);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
       VALUES (?, 1, NULL, 'FOU', '2026-07-27', 'active', ?)`,
    ).run(sid, NOW).lastInsertRowid);
    const week: any = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(weekStart)
      ?? { id: Number(conn.prepare(
        `INSERT INTO report_periods (code, week_start, week_end, created_at) VALUES (?,?,?,?)`,
      ).run(`T-${weekStart}`, weekStart, new Date(Date.parse(`${weekStart}T00:00:00Z`) + 6 * 86400000).toISOString().slice(0, 10), NOW).lastInsertRowid) };
    const attemptId = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,1,'progress',?,?, 'planned', ?)`,
    ).run(cycleId, sid, cid, week.id, NOW).lastInsertRowid);
    skillSched.ensureSkillRows(attemptId);
    return { sid, attemptId };
  }

  check('PR-Rc1 · C08 Lớp thường ghi "-": môn đó tự dời sang tuần sau, các môn khác không đổi', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    const truoc = skillSched.loadSkillRows([attemptId]).get(attemptId);
    const tuanCuaMon = (rows: any[], k: string) => rows.find((r: any) => r.skill === k)?.week_start ?? null;
    assert(tuanCuaMon(truoc, 'listening') === '2026-09-14', 'Bắt đầu ở tuần 14/09');

    const r = regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, 'listening', true, '2026-09-16');
    assert(r.moved, 'Phải dời');
    const sau = skillSched.loadSkillRows([attemptId]).get(attemptId);
    assert(tuanCuaMon(sau, 'listening') === '2026-09-21', `Listening sang tuần sau: ${tuanCuaMon(sau, 'listening')}`);
    assert(tuanCuaMon(sau, 'reading') === '2026-09-14', 'Reading giữ nguyên tuần — "-" chỉ dời đúng môn đó');
    const sc: any = conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(attemptId);
    assert(sc && sc.no_show_period_id, 'Có ghi dấu "-" kèm tuần cũ');
    assert(sc.raw_score === null, 'Dấu "-" KHÔNG phải điểm 0');
    /* Chạy lại không dời thêm lần nữa. */
    const lai = regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, 'listening', true, '2026-09-16');
    assert(!lai.moved, 'Báo lại cùng một dấu là vô hại');
    assert(tuanCuaMon(skillSched.loadSkillRows([attemptId]).get(attemptId), 'listening') === '2026-09-21', 'Không dời hai lần');
  });

  check('PR-Rc1 · Q3 Gỡ dấu "-" trả môn về đúng tuần cũ; Q5 ô đã có điểm thì không nhận dấu', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, 'reading', true, '2026-09-16');
    const g = regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, 'reading', false, '2026-09-16');
    assert(g.moved, 'Gỡ dấu cũng là một lần đổi lịch');
    const rows = skillSched.loadSkillRows([attemptId]).get(attemptId);
    assert(rows.find((r: any) => r.skill === 'reading').week_start === '2026-09-14', 'Về đúng tuần cũ');
    const sc: any = conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = 'reading'`).get(attemptId);
    assert(!sc || !sc.no_show_period_id, 'Dấu đã được xoá');

    regular.saveRegularScore(P.normalSubjectTeacher, attemptId, 'reading', { score: 30, total: 40 });
    assertThrows(() => regular.reportRegularNoShow(P.normalSubjectTeacher, attemptId, 'reading', true, '2026-09-16'),
      /đã có điểm|lý do/, 'Ô đã có điểm thì phải đi đường hiệu chỉnh có lý do');
  });

  check('PR-Rc1 · C08 Quyền: GVBM môn khác không ghi được "-"; Quản lý ghi được', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    const monKhac = P.normalSubjectTeacher;
    const cuaToi = conn.prepare(
      `SELECT skill FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND status = 'active' AND skill IS NOT NULL`,
    ).all(classId('MB-FOU 12'), monKhac.userId) as any[];
    const khong = ['listening', 'reading', 'writing', 'speaking'].find((k) => !cuaToi.some((x) => x.skill === k));
    if (khong) {
      assertThrows(() => regular.reportRegularNoShow(monKhac, attemptId, khong, true, '2026-09-16'),
        /phân công|quyền/, 'Môn không dạy thì không ghi được');
    }
    const r = regular.reportRegularNoShow(P.mbManager, attemptId, 'speaking', true, '2026-09-16');
    assert(r.moved, 'Quản lý ghi được (đường nhập bù)');
  });

  check('PR-Rc1 · §6 Máy chủ KHÔNG còn câu "Lớp Normal không dùng dấu"', () => {
    const attempts: any = await0(import('../fasttrack/attempts.ts'));
    assert(!/không dùng dấu/.test(String(attempts.saveScore)), 'Câu chặn cũ phải biến mất khỏi saveScore');
  });
```

> *(Ghi chú khi code: harness là hàm `async`, nên thay `await0(...)` bằng `await import(...)` đặt ở đầu hàm cùng các
> import khác — viết như trên chỉ để nêu rõ ý phép kiểm. Đặt `const attempts: any = await import('../fasttrack/attempts.ts');`
> cạnh `const regular` ở Step 1 rồi dùng lại.)*

- [ ] **Step 2: Chạy cho đỏ.** Run: `npm test 2>&1 | tail -20`. Expected: `regular.reportRegularNoShow is not a function`.

- [ ] **Step 3: Viết `reportRegularNoShow`.** Trong `server/src/normal/regular.ts`, ngay sau `saveRegularScore`:

```ts
/**
 * C08 — LỚP THƯỜNG GHI DẤU "-": em không làm bài của tuần này, môn đó TỰ DỜI SANG TUẦN SAU.
 *
 * Khác hẳn dấu "-" của Fast Track (rule book §17.1): ở FT dấu "-" là một lời khai còn sửa được đến hết Chủ nhật, rồi
 * mới chốt thành "không dự thi". Lớp thường không có khái niệm huỷ nghĩa vụ Test — bốn môn vẫn phải đủ — nên dấu "-"
 * ở đây chỉ có đúng một hệ quả: DỜI LỊCH. Vì thế nó dời ngay, và gỡ dấu là trả lịch về chỗ cũ.
 *
 * KHÔNG dựng đường dời lịch thứ hai: dùng `setSkillWeek` như mọi lần đổi tuần khác, nên các luật chống chồng đợt,
 * nhật ký lịch và tuần hoàn tất đều tự áp. Bộ đếm `absence_move_count` (đếm những lần em VẮNG ở Fast Track) không
 * được đụng tới.
 */
export function reportRegularNoShow(
  p: Principal, attemptId: number, skill: string, bat: boolean, today: string = demoToday(),
): { moved: boolean; tuanCu: string | null; tuanMoi: string | null; result: RegularResult } {
  const conn = db();
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy lượt đánh giá');
  if (a.status === 'cancelled') throw badRequest('Lượt này đã huỷ, không ghi dấu "-" được.');

  const prog = a.class_id ? programmeOfClass(a.class_id) : null;
  if (!prog || prog.scoringMode !== 'ratio') throw badRequest('Lượt này không thuộc lớp thường.');
  if (!prog.skills.includes(skill)) throw badRequest(`Chương trình ${prog.code} không có kỹ năng "${skill}".`);

  /* Ghi dấu là việc của NGƯỜI CHẤM môn đó (hoặc người nhập bù) — cùng cửa với nhập điểm. */
  const path = a.class_id ? scoreEditPath(p, a.class_id, skill) : null;
  if (!path) {
    require_(p, PERMISSIONS.SCORE_EDIT, { classId: a.class_id, studentId: a.student_id, skill },
      'Bạn chỉ ghi được dấu "-" cho kỹ năng mình được phân công.');
  }

  const row = ensureSkillRows(attemptId).find((r) => r.skill === skill);
  if (!row) throw badRequest(`Bài này chưa có dòng lịch cho ${skill}.`);
  if (!row.required) throw badRequest(`Kỹ năng ${skill} không nằm trong phạm vi yêu cầu của bài này.`);

  const existing = conn.prepare('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
    .get(attemptId, skill) as any;
  if (bat && existing && existing.raw_score !== null && existing.raw_score !== undefined) {
    throw badRequest('Ô này đã có điểm — dấu "-" không xoá được điểm. Muốn sửa, dùng hiệu chỉnh điểm có ghi lý do.');
  }

  const tuanCuaRow = (id: number | null) =>
    (id ? (conn.prepare('SELECT code, week_start FROM report_periods WHERE id = ?').get(id) as any) : null);

  if (bat) {
    if (!row.planned_period_id || !row.week_start) {
      throw badRequest(`${skill} chưa có tuần thi nên chưa ghi dấu "-" được.`);
    }
    /* Đã ghi dấu cho đúng tuần này rồi thì không làm gì thêm — gọi lại là vô hại. */
    if (existing?.no_show_period_id && existing.no_show_period_id !== row.planned_period_id) {
      return { moved: false, tuanCu: tuanCuaRow(existing.no_show_period_id)?.code ?? null,
        tuanMoi: row.period_code, result: regularResultOf(attemptId) };
    }
    const cu = { id: row.planned_period_id, code: row.period_code, weekStart: row.week_start };
    const moi = ensurePeriod(tuanKeTiep(cu.weekStart));
    return tx(() => {
      if (existing) {
        conn.prepare(
          `UPDATE assessment_scores SET no_show_period_id = ?, no_show_by = ?, no_show_at = ?, no_show_late = 0 WHERE id = ?`,
        ).run(cu.id, p.userId, nowIso(), existing.id);
      } else {
        /* Cố ý KHÔNG ghi entered_by: người báo "không có bài" chưa nhập điểm nào. */
        conn.prepare(
          `INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_by, no_show_at, no_show_late)
           VALUES (?,?,?,?,?,0)`,
        ).run(attemptId, skill, cu.id, p.userId, nowIso());
      }
      /* Dời bằng ĐÚNG hàm dời lịch chung — `force` chỉ vượt được cảnh báo, không bao giờ vượt được chặn. */
      setSkillWeek(p, attemptId, skill, moi.id, {
        reason: `Báo "-": em không làm bài tuần ${cu.code ?? ''} — môn này dời sang tuần sau (C08).`.replace('  ', ' '),
        force: true,
      });
      writeAudit({
        actorUserId: p.userId, action: 'regular.no_show', entityType: 'assessment_attempt', entityId: attemptId,
        entityLabel: skill, before: { week: cu.code }, after: { week: moi.code, noShow: true },
      });
      return { moved: true, tuanCu: cu.code ?? null, tuanMoi: moi.code, result: regularResultOf(attemptId) };
    });
  }

  /* Gỡ dấu: trả môn về đúng tuần đã lưu trong chính dòng điểm. */
  if (!existing?.no_show_period_id) {
    return { moved: false, tuanCu: null, tuanMoi: row.period_code, result: regularResultOf(attemptId) };
  }
  const ve = tuanCuaRow(existing.no_show_period_id);
  return tx(() => {
    if (existing.no_show_period_id !== row.planned_period_id) {
      setSkillWeek(p, attemptId, skill, existing.no_show_period_id, {
        reason: 'Gỡ dấu "-": trả lịch về tuần cũ.', force: true,
      });
    }
    conn.prepare(
      `UPDATE assessment_scores SET no_show_period_id = NULL, no_show_by = NULL, no_show_at = NULL WHERE id = ?`,
    ).run(existing.id);
    writeAudit({
      actorUserId: p.userId, action: 'regular.no_show_cleared', entityType: 'assessment_attempt', entityId: attemptId,
      entityLabel: skill, before: { week: row.period_code }, after: { week: ve?.code ?? null, noShow: false },
    });
    return { moved: true, tuanCu: row.period_code, tuanMoi: ve?.code ?? null, result: regularResultOf(attemptId) };
  });
}
```

  Bổ sung import ở đầu `regular.ts` (giữ đúng nhóm import đang có):

```ts
import { ensureSkillRows, loadSkillRows, setSkillWeek } from '../fasttrack/skillSchedule.ts';
import { tuanKeTiep } from '../../../shared/domain/index.ts';   // gộp vào khối import shared đang có
```

- [ ] **Step 4: `saveRegularScore` nhận `noShow`.** Ở đầu thân `saveRegularScore` (sau khi kiểm `prog`/`skill`, trước
  khối quyền), thêm:

```ts
  /* Dấu "-" đi đường riêng vì nó KHÔNG phải một điểm: nó là một lần dời lịch (C08). */
  if (patch.noShow !== undefined) {
    if (patch.score !== undefined || patch.total !== undefined) {
      throw badRequest('Một lần gửi chỉ làm một việc: nhập điểm, hoặc ghi/gỡ dấu "-".');
    }
    return reportRegularNoShow(p, attemptId, skill, patch.noShow === true);
  }
```

  và mở rộng kiểu `patch`: `{ score?: number | null; total?: number | null; note?: string | null; noShow?: boolean; lyDo?: string | null }`.
  *(Trường `lyDo` dùng ở Task 5 — khai báo luôn để không sửa chữ ký hai lần.)*

- [ ] **Step 5: Bỏ câu chặn ở `attempts.ts`.** Thay khối `attempts.ts:1148-1153`:

```ts
  /*
   * DẤU "-" CỦA LỚP THƯỜNG ĐI CỬA KHÁC (C08, chốt 21/09/2026 đêm). Ở lớp thường, "-" không phải lời khai chờ chốt
   * Chủ nhật như Fast Track mà là một lần DỜI LỊCH: môn đó sang tuần sau ngay. Luật ấy nằm ở `normal/regular.ts`
   * (`reportRegularNoShow`), cùng chỗ với bảng điểm lớp thường — nên ở đây chỉ chỉ đường, không dựng luật thứ hai.
   */
  if (patch.noShow !== undefined && scoringModeOf(a) === 'ratio') {
    throw badRequest('Bài của lớp thường ghi dấu "-" ở bảng điểm lớp thường — ở đó môn được ghi "-" tự dời sang tuần sau.');
  }
```

- [ ] **Step 6: Endpoint nhận `noShow`.** `server/src/routes/index.ts`, khối `/regular/attempts/:id/scores/:skill`:

```ts
/** Nhập điểm một môn (cả điểm đạt và tổng), hoặc ghi/gỡ dấu "-" (C08 — môn đó tự dời sang tuần sau). */
api.put('/regular/attempts/:id/scores/:skill', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  const b = req.body ?? {};
  return regularSvc.saveRegularScore(principalOf(req), pInt(req, 'id'), req.params.skill, {
    score: b.score, total: b.total, note: b.note, lyDo: b.lyDo,
    noShow: b.noShow === true ? true : b.noShow === false ? false : undefined,
  });
}));
```

- [ ] **Step 7: Chạy.** Run: `npm test 2>&1 | tail -5`. Expected: `TẤT CẢ B+11 KIỂM TRA ĐỀU ĐẠT`.

- [ ] **Step 8: Commit.**

```bash
git add server/src/normal/regular.ts server/src/fasttrack/attempts.ts server/src/routes/index.ts server/src/tests/chamDiem.tests.ts
git commit -m "PR-Rc1 (2): C08 — lop thuong ghi dau '-' thi mon do tu doi sang tuan sau"
```

---

### Task 3: `/nhap-diem/:id` của lớp thường phải ra lưới lớp thường (lỗi §6 dòng 1)

**Files:**
- Modify: `server/src/fasttrack/attempts.ts:1358-1370` (`classScoreSheet` — chặn lớp thường)
- Create: `server/src/cham/canCham.ts` (hàm `chamSheet`; hai hàm còn lại làm ở Task 6)
- Modify: `server/src/routes/index.ts` (thêm `GET /classes/:classId/cham`)
- Modify: `server/src/tests/chamDiem.tests.ts`

**Interfaces:**
- Produces: `chamSheet(p, classId, opts: { periodId?: number | null; kind?: string | null }, today?: string)` trả
  `{ mode: 'ielts_band' | 'ratio'; classId; classCode; branchName; canPlanWeek; ft?: <kết quả classScoreSheet>; thuong?: <kết quả regularSheet> }`.

- [ ] **Step 1: Phép kiểm (đỏ).**

```ts
  check('PR-Rc1 · §6 Lưới FT KHÔNG mở được cho lớp thường; endpoint chung trả đúng loại lưới', () => {
    const attempts: any = attemptsMod;   // đã import ở trên
    const cham: any = chamMod;           // import('../cham/canCham.ts')
    const lopThuong = classId('MB-FOU 12');
    const lopFT = classId('MB-FT 101');
    assertThrows(() => attempts.classScoreSheet(P.mbManager, lopThuong, null), /lớp thường/,
      'Bảng điểm Mock Test không nhận lớp thường');
    const a = cham.chamSheet(P.mbManager, lopThuong, {});
    assert(a.mode === 'ratio' && a.thuong && !a.ft, `Lớp thường phải ra lưới lớp thường: ${a.mode}`);
    assert(!JSON.stringify(a.thuong.rows).includes('"MT'), 'Không có chữ MT nào trong dữ liệu lớp thường');
    const b = cham.chamSheet(P.mbManager, lopFT, {});
    assert(b.mode === 'ielts_band' && b.ft && !b.thuong, `Lớp FT phải ra lưới Mock Test: ${b.mode}`);
  });
```

- [ ] **Step 2: Chặn ở `classScoreSheet`.** Ngay sau `require_(p, PERMISSIONS.ATTEMPT_VIEW, …)` trong
  `classScoreSheet`:

```ts
  /*
   * BẢNG NÀY LÀ BẢNG MOCK TEST. Lớp thường có bảng riêng (`regularSheet`): chấm theo số câu đúng/tổng số câu, bài tên
   * "Giữa khoá"/"Cuối khoá". Mở nhầm bảng là đọc sai cả kết quả — bảng này gọi mọi lượt là "MT{n}" và chấm theo band.
   * Chặn ở MÁY CHỦ chứ không chỉ ở giao diện: gõ thẳng đường dẫn vẫn phải ra đúng bảng.
   */
  if (isRatioClass(classId)) {
    throw badRequest('Lớp thường dùng bảng điểm riêng (số câu đúng / tổng số câu), không dùng bảng điểm Mock Test.');
  }
```
  Import `isRatioClass` từ `../normal/regular.ts` (attempts.ts đã import từ đó `allProgrammes`, `evaluateRegular` —
  thêm vào cùng dòng; nếu phát sinh vòng import thì dùng `programmeOfClass(...)?.scoringMode === 'ratio'` tại chỗ).

- [ ] **Step 3: Viết `server/src/cham/canCham.ts` (phần `chamSheet`).**

```ts
/**
 * KHU VỰC TEST — ba câu hỏi ĐỌC của việc chấm điểm (spec §3.5):
 *
 *   canChamList  "tôi còn phải chấm những gì" — gom theo lớp + đợt, xếp vào Quá hạn / Tuần này / Sắp tới.
 *   lichTest     "tuần này có những lượt Test nào" — nhóm theo lớp.
 *   chamSheet    "mở bảng chấm của một lớp" — MỘT CỬA, tự chọn đúng bảng theo loại lớp.
 *
 * Module này KHÔNG có luật nghiệp vụ mới: nó gọi `listAttempts`, `classScoreSheet`, `regularSheet` và các hàm thuần ở
 * `shared/domain/chamDiem.ts`. Có nó để giao diện chỉ hỏi một nơi, và để chỗ mở bảng chấm không còn phải tự đoán lớp
 * này là FT hay lớp thường.
 */
import { badRequest, notFound } from '../util.ts';
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { can, type Principal } from '../permissions.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { classScoreSheet } from '../fasttrack/attempts.ts';
import { isRatioClass, regularSheet } from '../normal/regular.ts';

export function chamSheet(
  p: Principal, classId: number, opts: { periodId?: number | null; kind?: string | null } = {},
  today: string = demoToday(),
) {
  const cls = db()
    .prepare('SELECT c.*, b.name AS branch_name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const chung = {
    classId, classCode: cls.code as string, branchName: cls.branch_name as string,
    canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId }),
    today,
  };
  if (isRatioClass(classId)) {
    return { ...chung, mode: 'ratio' as const, thuong: regularSheet(p, classId, opts.kind ?? undefined), ft: null };
  }
  return { ...chung, mode: 'ielts_band' as const, ft: classScoreSheet(p, classId, opts.periodId ?? null, today), thuong: null };
}
```

- [ ] **Step 4: Endpoint.** `server/src/routes/index.ts`, **ngay sau** khối `api.get('/classes/:id/score-sheet', …)`:

```ts
/**
 * MỘT CỬA CHO BẢNG CHẤM (spec §3.5): máy chủ chọn đúng bảng theo loại lớp, giao diện không phải đoán. Mở
 * `/nhap-diem/:id` của một lớp thường thì đây là chỗ trả về lưới lớp thường.
 */
api.get('/classes/:classId/cham', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return chamSvc.chamSheet(principalOf(req), pInt(req, 'classId'), {
    periodId: qInt(req, 'periodId'), kind: qStr(req, 'kind'),
  });
}));
```
  Thêm `import * as chamSvc from '../cham/canCham.ts';` vào khối import đầu file (cạnh `regularSvc`).

- [ ] **Step 5: Chạy.** Run: `npm test 2>&1 | tail -5`. Expected: `TẤT CẢ B+12 KIỂM TRA ĐỀU ĐẠT`.

- [ ] **Step 6: Commit.**

```bash
git add server/src/cham/canCham.ts server/src/fasttrack/attempts.ts server/src/routes/index.ts server/src/tests/chamDiem.tests.ts
git commit -m "PR-Rc1 (3): mot cua cho bang cham; bang Mock Test khong nhan lop thuong"
```

---

### Task 4: Trạng thái Case đúng ở từng dòng của bảng lớp thường (lỗi §6 dòng 4)

**Files:**
- Modify: `server/src/normal/regular.ts:581-587` (map `cases`) và `:650` (ba trường `caseId/caseStatus/caseLevel`)
- Modify: `server/src/tests/chamDiem.tests.ts`

**Interfaces:**
- Produces: mỗi dòng của `regularSheet` có `cases: Array<{ id: number; status: string; level: number | null; skill: string; category: string }>`
  (các Case gắn với **các môn chưa đạt của chính dòng đó**), và giữ `caseId/caseStatus/caseLevel` = Case đầu tiên để
  không vỡ nơi gọi cũ.

- [ ] **Step 1: Phép kiểm (đỏ).**

```ts
  check('PR-Rc1 · §6 Trạng thái Case không biến mất ở dòng bài cũ khi bài sau chạm vào cùng Case', () => {
    const { attemptId } = taoBaiThuong('2026-09-14');
    const a: any = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId);
    /* Giữa khoá: trượt Listening → sinh tín hiệu/Case cho môn đó. */
    for (const [k, s] of [['listening', 10], ['reading', 35], ['writing', 16], ['speaking', 8]] as const) {
      regular.saveRegularScore(P.mbManager, attemptId, k, { score: s, total: k === 'writing' ? 20 : k === 'speaking' ? 10 : 40 });
    }
    const caseId = Number((conn.prepare(
      `SELECT id FROM sos_cases WHERE student_id = ? AND status != 'done' ORDER BY id DESC LIMIT 1`,
    ).get(a.student_id) as any)?.id ?? 0);
    assert(caseId > 0, 'Phải có Case/tín hiệu cho môn trượt');
    /* Bài Cuối khoá chạm vào cùng Case → cột attempt_id của Case trỏ sang lượt mới. */
    conn.prepare('UPDATE sos_cases SET attempt_id = ? WHERE id = ?').run(attemptId + 99999, caseId);
    const sheet = regular.regularSheet(P.mbManager, classId('MB-FOU 12'));
    const dong = sheet.rows.find((r: any) => r.attemptId === attemptId);
    assert(dong, 'Dòng vẫn còn trong bảng');
    assert(dong.cases.length > 0 && dong.cases[0].id === caseId,
      'Dòng cũ vẫn thấy Case của chính môn mình, dù attempt_id của Case đã trỏ chỗ khác');
    assert(dong.caseStatus !== null, 'Trường cũ vẫn có giá trị để nơi gọi cũ không vỡ');
  });
```

- [ ] **Step 2: Sửa truy vấn Case.** Thay khối `const cases = new Map<number, any>(); …` (`regular.ts:581-587`) bằng:

```ts
  /*
   * CASE CỦA MỘT DÒNG TÌM THEO HỌC VIÊN + KHOÁ + HẠNG MỤC, KHÔNG THEO `attempt_id`.
   *
   * `sos_cases.attempt_id` luôn trỏ tới LƯỢT MỚI NHẤT đã chạm vào Case (xem `refreshRegularOutcome`). Tìm theo cột đó
   * thì bài Giữa khoá mất sạch trạng thái Case ngay khi bài Cuối khoá được chấm — đúng lỗi đã ghi ở đặc tả §6. Case
   * sống suốt khoá và gắn với một HẠNG MỤC (môn), nên câu hỏi đúng là "môn này của em có Case nào đang mở không".
   */
  const caseRows = attempts.length
    ? (conn
        .prepare(
          `SELECT * FROM sos_cases
            WHERE student_id IN (${[...new Set(attempts.map((a) => a.student_id))].map(() => '?').join(',')})`,
        )
        .all(...[...new Set(attempts.map((a) => a.student_id))]) as any[])
    : [];
  const casesOf = (studentId: number, cycleId: number | null, failing: string[]) => {
    const cats = new Set(failing.map((k) => categoryOf(k)).filter(Boolean) as string[]);
    return caseRows
      .filter((c) => c.student_id === studentId
        && (c.cycle_id ?? 0) === (cycleId ?? 0)
        && cats.has(c.category ?? categoryOf(c.topic) ?? ''))
      .map((c) => ({
        id: c.id as number, status: c.status as string, level: (c.sos_level ?? null) as number | null,
        category: (c.category ?? categoryOf(c.topic)) as string,
      }));
  };
```

- [ ] **Step 3: Dùng ở từng dòng.** Trong `rows: attempts.map((a) => { … })`, thay `const c = cases.get(a.id);` bằng:

```ts
      const failing = result.skills.filter((s) => s.outcome === 'fail').map((s) => s.skill);
      const dongCases = casesOf(a.student_id, a.cycle_id ?? null, failing);
      const c = dongCases[0] ?? null;
```
  và ở khối trả về, thay ba dòng cuối bằng:

```ts
        cases: dongCases,
        caseId: c?.id ?? null, caseStatus: c?.status ?? null, caseLevel: c?.level ?? null,
```

- [ ] **Step 4: Chạy.** Run: `npm test 2>&1 | tail -5`. Expected: `TẤT CẢ B+13 KIỂM TRA ĐỀU ĐẠT`.

- [ ] **Step 5: Commit.**

```bash
git add server/src/normal/regular.ts server/src/tests/chamDiem.tests.ts
git commit -m "PR-Rc1 (4): trang thai Case theo hoc vien + hang muc, khong theo attempt_id"
```

---

### Task 5: RB-5 — hiệu chỉnh điểm có lý do

**Files:**
- Modify: `server/src/fasttrack/attempts.ts` (`ScorePatch` ~1075; `saveScore` khối ghi nhật ký ~1329; `scoreHistoryOf` ~735)
- Modify: `server/src/normal/regular.ts` (`saveRegularScore` — nhận `lyDo`, ghi nhật ký)
- Modify: `server/src/routes/index.ts` (hai endpoint nhập điểm chuyển tiếp `lyDo`)
- Modify: `server/src/tests/chamDiem.tests.ts`

**Interfaces:**
- Consumes: `kiemLyDo`, `LY_DO_TOI_THIEU` (Task 1).
- Produces: `saveScore(..., patch.lyDo)` và `saveRegularScore(..., patch.lyDo)`; `scoreHistoryOf` mỗi dòng thêm
  `lyDo: string | null`.

- [ ] **Step 1: Phép kiểm (đỏ).**

```ts
  check('PR-Rc1 · RB-5 Sửa ô đã có điểm phải ghi lý do; lý do vào lịch sử điểm', () => {
    const attempts: any = attemptsMod;
    const { attemptId } = taoBaiThuong('2026-09-14');
    regular.saveRegularScore(P.mbManager, attemptId, 'listening', { score: 30, total: 40 });
    assertThrows(() => regular.saveRegularScore(P.mbManager, attemptId, 'listening', { score: 31, total: 40 }),
      /lý do/, 'Sửa điểm đã có mà không ghi lý do thì bị chặn');
    const ok = regular.saveRegularScore(P.mbManager, attemptId, 'listening',
      { score: 31, total: 40, lyDo: 'Cộng nhầm một câu' });
    assert((ok.score as any).raw_score === 31, 'Có lý do thì lưu được');
    const lich = conn.prepare(
      `SELECT after_json FROM audit_logs WHERE entity_type = 'assessment_score' AND action LIKE 'regular.score%' ORDER BY id DESC LIMIT 1`,
    ).get() as any;
    assert(String(lich.after_json).includes('Cộng nhầm'), 'Lý do phải nằm trong nhật ký');

    /* Fast Track: cùng luật, và lịch sử điểm của hồ sơ đợt đọc được lý do. */
    const ft = conn.prepare(
      `SELECT a.id FROM assessment_attempts a WHERE a.kind = 'mock' AND a.class_id = ? ORDER BY a.id LIMIT 1`,
    ).get(classId('MB-FT 101')) as any;
    attempts.saveScore(P.mbManager, ft.id, 'listening', { rawScore: 30 });
    assertThrows(() => attempts.saveScore(P.mbManager, ft.id, 'listening', { rawScore: 31 }), /lý do/,
      'Fast Track cũng đòi lý do khi sửa điểm đã có');
    attempts.saveScore(P.mbManager, ft.id, 'listening', { rawScore: 31, lyDo: 'Chấm lại phần 3' });
    const h = attempts.scoreHistoryOf(ft.id);
    assert(h.some((x: any) => x.lyDo === 'Chấm lại phần 3'), 'Lịch sử điểm hiện lý do');
  });

  check('PR-Rc1 · RB-5 Không đòi lý do khi ô đang trống, và xoá điểm cũng phải có lý do', () => {
    const attempts: any = attemptsMod;
    const ft = conn.prepare(
      `SELECT a.id FROM assessment_attempts a WHERE a.kind = 'mock' AND a.class_id = ? ORDER BY a.id DESC LIMIT 1`,
    ).get(classId('MB-FT 101')) as any;
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ? AND skill = 'reading'`).run(ft.id);
    attempts.saveScore(P.mbManager, ft.id, 'reading', { rawScore: 28 });   // lần đầu: không cần lý do
    assertThrows(() => attempts.saveScore(P.mbManager, ft.id, 'reading', { rawScore: null }), /lý do/,
      'Xoá một điểm đã có cũng là hiệu chỉnh');
  });
```

- [ ] **Step 2: `ScorePatch` thêm `lyDo`.**

```ts
  /**
   * RB-5 — LÝ DO HIỆU CHỈNH. Bắt buộc khi ô ĐÃ CÓ điểm chính thức và lần ghi này làm đổi giá trị đó (kể cả xoá). Lần
   * nhập đầu tiên không phải hiệu chỉnh nên không đòi. Lý do đi vào nhật ký `score.edit`/`score.override` — chỗ
   * `scoreHistoryOf` đang đọc — nên không cần bảng mới.
   */
  lyDo?: string | null;
```

- [ ] **Step 3: Kiểm lý do trong `saveScore`.** Đặt **ngay trước** `return tx(() => {` (sau các lần chặn trạng thái
  thi), và sau khi đã đọc `existing`/`before` — nếu `existing` đang đọc trong `tx`, chuyển một câu đọc nhẹ ra trước:

```ts
  /*
   * RB-5 — SỬA MỘT Ô ĐÃ CÓ ĐIỂM THÌ PHẢI NÓI VÌ SAO.
   *
   * Câu lỗi của dấu "-" đã nhắc tới "hiệu chỉnh điểm có ghi lý do" từ lâu mà đường ấy chưa tồn tại (kiểm kê RB-5).
   * Nay nó tồn tại và là ĐƯỜNG DUY NHẤT: không có lý do thì không đổi được một con số mà người khác đã đọc.
   */
  if (patch.noShow === undefined) {
    const dang = conn.prepare('SELECT band, raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = ?')
      .get(attemptId, skill) as any;
    const daCoDiem = (dang?.band ?? null) !== null || (dang?.raw_score ?? null) !== null;
    if (daCoDiem) {
      const loi = kiemLyDo(patch.lyDo);
      if (loi) throw badRequest(loi);
    }
  }
```

- [ ] **Step 4: Ghi lý do vào nhật ký.** Ở `writeAudit` của `saveScore` (khối `score.edit`/`score.override`), đổi
  `after` thành:

```ts
      before,
      after: patch.lyDo ? { ...(after as any), lyDo: String(patch.lyDo).trim() } : after,
```

- [ ] **Step 5: `scoreHistoryOf` trả `lyDo`.** Trong `rows.map`, thêm vào đối tượng trả về:

```ts
      lyDo: (after && typeof after === 'object' ? (after as any).lyDo ?? null : null) as string | null,
```

- [ ] **Step 6: Lớp thường cùng luật.** Trong `saveRegularScore`, sau khi tính `score`/`total` và trước `return tx(`:

```ts
  /* RB-5 — cùng luật với Fast Track: đổi một điểm đã có thì phải ghi lý do. */
  const doiGiaTri = (existing?.raw_score ?? null) !== null && (score ?? null) !== (existing?.raw_score ?? null);
  if (doiGiaTri) {
    const loi = kiemLyDo(patch.lyDo);
    if (loi) throw badRequest(loi);
  }
```
  và ở `writeAudit` của hàm này, `after: patch.lyDo ? { ...(after as any), lyDo: String(patch.lyDo).trim() } : after`.

- [ ] **Step 7: Endpoint chuyển tiếp `lyDo`.** `PUT /attempts/:id/scores/:skill` thêm `lyDo: b.lyDo` vào đối tượng
  patch (endpoint lớp thường đã thêm ở Task 2 Step 6).

- [ ] **Step 8: Chạy.** Run: `npm test 2>&1 | tail -5`. Expected: `TẤT CẢ B+15 KIỂM TRA ĐỀU ĐẠT`.
  🛑 Nếu phép kiểm cũ nào hỏng vì nay đòi lý do (phép kiểm cũ sửa điểm hai lần), **không nới luật**: sửa phép kiểm cũ
  bằng cách truyền `lyDo` và ghi việc đó vào Nhật ký.

- [ ] **Step 9: Commit.**

```bash
git add server/src/fasttrack/attempts.ts server/src/normal/regular.ts server/src/routes/index.ts server/src/tests/chamDiem.tests.ts
git commit -m "PR-Rc1 (5): RB-5 — duong hieu chinh diem co ly do cho giao vien"
```

---

### Task 6: Dữ liệu Cần chấm và Lịch Test

**Files:**
- Modify: `server/src/fasttrack/attempts.ts` (`listAttempts` — thêm `pendingDetail` ở **cả hai** nhánh lớp thường và FT)
- Modify: `server/src/cham/canCham.ts` (thêm `canChamList`, `lichTest`)
- Modify: `server/src/routes/index.ts` (thêm 2 endpoint vào cùng khối Task 3)
- Modify: `server/src/tests/chamDiem.tests.ts`

**Interfaces:**
- Produces:
  - `listAttempts` mỗi dòng thêm `pendingDetail: Array<{ skill: string; deadline: string | null; weekCode: string | null }>`
    (đúng tập `pendingSkills`, tức là **theo phạm vi đang xem**, khác `myPendingDetail` chỉ tính phần của chính mình).
  - `canChamList(p, f: { branchId?: number | null; classId?: number | null; scope?: WorkScope | null }, today?)` →
    `{ scopeEmpty: boolean; lop: { id: number; code: string } | null; nhom: Array<{ muc: MucCanCham; nhan: string; dong: DongCanCham[] }>; tong: number }`
  - `type DongCanCham = { key: string; classId: number; classCode: string; mode: 'ielts_band' | 'ratio'; kind: string;
    attemptNo: number | null; dotLabel: string; kyNang: string[]; kyNangLabel: string; conBai: number; soHv: number;
    han: string | null; tuanKhac: string | null; href: string }`
  - `lichTest(p, periodId: number, branchId?: number | null, today?)` →
    `{ scopeEmpty: boolean; lop: Array<{ classId: number; classCode: string; mode; branchName: string; dong: Array<{ key; dotLabel; kyNang: string[]; kyNangLabel; soHv: number; conBai: number; trangThai: string; href: string }> }> }`

- [ ] **Step 1: Phép kiểm (đỏ).**

```ts
  check('PR-Rc1 · Q11 Cần chấm: một dòng = một lớp + một đợt, đếm đúng số ô còn phải chấm', () => {
    const cham: any = chamMod;
    const r = cham.canChamList(P.mbManager, {}, TODAY);
    assert(Array.isArray(r.nhom) && r.nhom.length === 3, 'Luôn đủ ba mục');
    assert(r.nhom.map((x: any) => x.muc).join(',') === 'qua-han,tuan-nay,sap-toi', 'Đúng thứ tự');
    const dong = r.nhom.flatMap((x: any) => x.dong);
    assert(dong.every((d: any) => d.conBai > 0), 'Không có dòng nào "còn 0 bài"');
    assert(new Set(dong.map((d: any) => d.key)).size === dong.length, 'Khoá dòng không trùng');
    assert(dong.every((d: any) => d.href.startsWith('/nhap-diem/')), 'Bấm Chấm mở thẳng lưới');
    const thuong = dong.find((d: any) => d.mode === 'ratio');
    if (thuong) {
      assert(!/MT/.test(thuong.dotLabel), `Lớp thường không gọi đợt là MT: ${thuong.dotLabel}`);
      assert(['Giữa khoá', 'Cuối khoá'].includes(thuong.dotLabel), thuong.dotLabel);
    }
  });

  check('PR-Rc1 · Q13 Cần chấm lọc theo lớp thì nói rõ đang lọc lớp nào', () => {
    const cham: any = chamMod;
    const cid = classId('MB-FT 101');
    const r = cham.canChamList(P.mbManager, { classId: cid }, TODAY);
    assert(r.lop && r.lop.id === cid && r.lop.code === 'MB-FT 101', 'Trả về lớp đang lọc để giao diện hiện chip');
    assert(r.nhom.flatMap((x: any) => x.dong).every((d: any) => d.classId === cid), 'Chỉ còn lớp đó');
    assert(cham.canChamList(P.mbManager, {}, TODAY).lop === null, 'Không lọc thì không có chip');
  });

  check('PR-Rc1 · Q14 Lịch Test nhóm theo lớp và lọc theo tuần của CHÍNH môn', () => {
    const cham: any = chamMod;
    const { attemptId } = taoBaiThuong('2026-09-14');
    const tuan: any = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get('2026-09-14');
    const r = cham.lichTest(P.mbManager, tuan.id, null, TODAY);
    const lop = r.lop.find((l: any) => l.classCode === 'MB-FOU 12');
    assert(lop, 'Lớp có bài trong tuần phải xuất hiện');
    assert(lop.dong.every((d: any) => d.soHv > 0), 'Mỗi dòng có số học viên');
    /* Dời Listening sang tuần sau rồi thì tuần 14/09 không còn Listening, tuần 21/09 thì có. */
    regular.reportRegularNoShow(P.mbManager, attemptId, 'listening', true, '2026-09-16');
    const sau: any = conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get('2026-09-21');
    const r2 = cham.lichTest(P.mbManager, sau.id, null, TODAY);
    const lop2 = r2.lop.find((l: any) => l.classCode === 'MB-FOU 12');
    assert(lop2 && lop2.dong.some((d: any) => d.kyNang.includes('listening')), 'Môn đã dời hiện ở tuần mới');
  });
```

- [ ] **Step 2: `listAttempts` trả `pendingDetail`.** Ở nhánh **lớp thường**, ngay sau `pendingSkills: pending,` thêm:

```ts
        /* Hạn của CHÍNH các môn còn nợ theo phạm vi đang xem — Cần chấm cần hạn của cả dòng, không chỉ phần của tôi. */
        pendingDetail: pending.map((k) => ({
          skill: k, deadline: views.get(k)?.deadline ?? null, weekCode: views.get(k)?.periodCode ?? null,
        })),
```
  Ở nhánh **Fast Track**, cùng chỗ:

```ts
      pendingDetail: pending.map((k) => {
        const c = cells.find((x) => x.skill === k);
        return { skill: k, deadline: c?.deadline ?? null, weekCode: c?.periodCode ?? null };
      }),
```

- [ ] **Step 3: `canChamList` và `lichTest`.** Thêm vào `server/src/cham/canCham.ts`:

```ts
export type DongCanCham = {
  key: string; classId: number; classCode: string; mode: 'ielts_band' | 'ratio';
  kind: string; attemptNo: number | null; dotLabel: string;
  kyNang: string[]; kyNangLabel: string;
  conBai: number; soHv: number;
  han: string | null;
  /** Tuần thi của môn còn nợ khi nó KHÁC tuần của đợt — "bài dời" nói bằng tuần thật (Q15). */
  tuanKhac: string | null;
  href: string;
};

const dotLabelOf = (kind: string, attemptNo: number | null) =>
  (kind === 'mock' ? `MT${attemptNo ?? ''}` : ATTEMPT_KIND_LABEL[kind as AttemptKind] ?? kind);

/**
 * "TÔI CÒN PHẢI CHẤM NHỮNG GÌ" — gom theo LỚP + ĐỢT (mockup 05a2 phương án A).
 *
 * Dùng nguyên `listAttempts(need: 'my_scores')`: cùng một tập bài với badge ở danh sách lớp và với Việc cần làm, nên
 * ba nơi không thể lệch số. Việc của module này chỉ là GOM DÒNG và XẾP MỤC theo hạn.
 */
export function canChamList(
  p: Principal,
  f: { branchId?: number | null; classId?: number | null; scope?: WorkScope | null } = {},
  today: string = demoToday(),
) {
  const { rows, scopeEmpty } = listAttempts(p, {
    need: 'my_scores', branchId: f.branchId ?? undefined, classId: f.classId ?? undefined,
    scope: f.scope ?? undefined,
  });
  const gom = new Map<string, DongCanCham & { _hs: Set<number> }>();
  for (const a of rows as any[]) {
    if (!a.classId) continue;
    const key = `${a.classId}:${a.kind}:${a.attemptNo ?? 0}`;
    const cu = gom.get(key);
    const han = (a.pendingDetail ?? [])
      .map((x: any) => x.deadline).filter(Boolean).sort()[0] ?? null;
    const tuanKhac = (a.pendingDetail ?? [])
      .find((x: any) => x.weekCode && x.weekCode !== a.period?.code)?.weekCode ?? null;
    if (!cu) {
      gom.set(key, {
        key, classId: a.classId, classCode: a.classCode ?? '—',
        mode: a.kind === 'mock' ? 'ielts_band' : 'ratio',
        kind: a.kind, attemptNo: a.attemptNo, dotLabel: dotLabelOf(a.kind, a.attemptNo),
        kyNang: [...a.pendingSkills], kyNangLabel: '',
        conBai: a.pendingSkills.length, soHv: 1, han, tuanKhac,
        href: '', _hs: new Set([a.studentId]),
      });
    } else {
      for (const k of a.pendingSkills) if (!cu.kyNang.includes(k)) cu.kyNang.push(k);
      cu.conBai += a.pendingSkills.length;
      cu._hs.add(a.studentId);
      if (han && (!cu.han || han < cu.han)) cu.han = han;
      if (!cu.tuanKhac && tuanKhac) cu.tuanKhac = tuanKhac;
    }
  }
  const dong = [...gom.values()].map((d) => {
    const { _hs, ...rest } = d;
    const qs = new URLSearchParams();
    if (d.kind !== 'mock') qs.set('kind', d.kind);
    if (d.kyNang.length === 1) qs.set('kn', d.kyNang[0]);
    return {
      ...rest,
      soHv: _hs.size,
      kyNangLabel: d.mode === 'ratio' && d.kyNang.length >= 4
        ? `${d.kyNang.length} môn`
        : d.kyNang.map((k) => SKILL_SHORT[k] ?? k).join(', '),
      href: `/nhap-diem/${d.classId}${qs.toString() ? `?${qs}` : ''}`,
    };
  });
  const cls = f.classId
    ? (db().prepare('SELECT id, code FROM classes WHERE id = ?').get(f.classId) as any) ?? null
    : null;
  return {
    scopeEmpty,
    lop: cls ? { id: cls.id as number, code: cls.code as string } : null,
    nhom: nhomCanCham(dong, { homNay: today, cuoiTuanNay: weekInfo(today).weekEnd }),
    tong: dong.reduce((n, d) => n + d.conBai, 0),
  };
}
```

  và `lichTest`:

```ts
/**
 * "TUẦN NÀY CÓ NHỮNG LƯỢT TEST NÀO" — nhóm theo lớp (spec §3.5).
 *
 * Lọc theo TUẦN CỦA CHÍNH MÔN (`attempt_skills.planned_period_id`), không theo tuần của cả đợt: đợt tách tuần thì lọc
 * theo tuần của đợt làm biến mất đúng những bài đang phải chấm trong tuần đang xem — cùng lý do đã ghi ở
 * `classScoreSheet`.
 */
export function lichTest(p: Principal, periodId: number, branchId?: number | null, today: string = demoToday()) {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { scopeEmpty: true, lop: [] };
  const conn = db();
  const cs = classScopeSql(scope);
  const params: unknown[] = [...cs.params, periodId];
  let where = `${cs.sql} AND a.status != 'cancelled' AND ask.required = 1 AND ask.planned_period_id = ?`;
  if (branchId) { where += ' AND c.branch_id = ?'; params.push(branchId); }
  const rows = conn
    .prepare(
      `SELECT a.id, a.kind, a.attempt_no, a.class_id, c.code AS class_code, b.name AS branch_name,
              c.programme_code, ask.skill, ask.sit_status, a.student_id,
              (SELECT COUNT(*) FROM assessment_scores sc
                WHERE sc.attempt_id = a.id AND sc.skill = ask.skill
                  AND (sc.band IS NOT NULL OR sc.raw_score IS NOT NULL)) AS da_cham
         FROM assessment_attempts a
         JOIN attempt_skills ask ON ask.attempt_id = a.id
         JOIN classes c ON c.id = a.class_id
         JOIN branches b ON b.id = c.branch_id
        WHERE ${where}
        ORDER BY c.code, a.kind DESC, a.attempt_no, ask.skill`,
    )
    .all(...params) as any[];

  const modes = allProgrammes();
  const byClass = new Map<number, any>();
  for (const r of rows) {
    const mode = modes.get(r.programme_code)?.scoringMode === 'ratio' ? 'ratio' : 'ielts_band';
    if (!byClass.has(r.class_id)) {
      byClass.set(r.class_id, {
        classId: r.class_id, classCode: r.class_code, branchName: r.branch_name, mode, dong: new Map<string, any>(),
      });
    }
    const lop = byClass.get(r.class_id);
    const key = `${r.kind}:${r.attempt_no ?? 0}:${r.skill}`;
    const d = lop.dong.get(key) ?? {
      key, dotLabel: dotLabelOf(r.kind, r.attempt_no), kyNang: [r.skill],
      kyNangLabel: SKILL_SHORT[r.skill] ?? r.skill, soHv: 0, conBai: 0, chuaToiHan: true,
      href: `/nhap-diem/${r.class_id}${r.kind !== 'mock' ? `?kind=${r.kind}` : ''}`,
    };
    d.soHv += 1;
    if (!r.da_cham && r.sit_status !== 'cancelled') d.conBai += 1;
    if (r.sit_status !== 'scheduled' || true) d.chuaToiHan = false;   // đã có dòng lịch trong tuần đang xem
    lop.dong.set(key, d);
  }
  return {
    scopeEmpty: false,
    lop: [...byClass.values()].map((l) => ({
      ...l,
      dong: [...l.dong.values()].map((d: any) => ({
        ...d,
        trangThai: trangThaiChamLabel({ conBai: d.conBai, tong: d.soHv, quaHan: false, chuaToiHan: false }),
      })),
    })),
  };
}
```

  > **Khi code:** dòng `if (r.sit_status !== 'scheduled' || true)` ở trên là chỗ **phải viết lại cho đúng** — ý là
  > "dòng nào có lịch trong tuần đang xem thì đã tới lịch". Viết thẳng `d.chuaToiHan = false;` và bỏ điều kiện thừa;
  > `quaHan` lấy từ `viewSkill(...).overdue` nếu muốn chính xác hơn. Không để lại biểu thức `|| true` trong mã.

  Import cần thêm ở đầu `canCham.ts`: `listAttempts`, `scopeFor`, `classScopeSql` (từ `../permissions.ts`),
  `allProgrammes` (từ `../normal/regular.ts`), `weekInfo` (từ `../platform/week.ts`), và từ `shared/domain/index.ts`:
  `ATTEMPT_KIND_LABEL`, `SKILL_SHORT`, `nhomCanCham`, `trangThaiChamLabel`, `type AttemptKind`, `type WorkScope`.

- [ ] **Step 4: Hai endpoint.** Thêm vào **cùng khối** với endpoint ở Task 3:

```ts
/** Cần chấm — mockup 05a2 phương án A: ba mục Quá hạn / Tuần này / Sắp tới, mỗi dòng một lớp + một đợt. */
api.get('/cham/can-cham', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return chamSvc.canChamList(principalOf(req), {
    branchId: qInt(req, 'branchId'), classId: qInt(req, 'classId'), scope: qScope(req),
  });
}));

/** Lịch Test — các lượt Test của một tuần, nhóm theo lớp. */
api.get('/cham/lich-test', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  const periodId = qInt(req, 'periodId') ?? ensurePeriod(demoToday()).id;
  return chamSvc.lichTest(principalOf(req), periodId, qInt(req, 'branchId'));
}));
```

- [ ] **Step 5: Chạy.** Run: `npm test 2>&1 | tail -5`. Expected: `TẤT CẢ B+18 KIỂM TRA ĐỀU ĐẠT`.

- [ ] **Step 6: Commit.**

```bash
git add server/src/cham/canCham.ts server/src/fasttrack/attempts.ts server/src/routes/index.ts server/src/tests/chamDiem.tests.ts
git commit -m "PR-Rc1 (6): du lieu Can cham + Lich Test"
```

---

### Task 7: Lưới chấm chung cho lớp Fast Track và lớp thường

**Files:**
- Create: `web/src/modules/cham/ChamDiemPage.tsx`, `web/src/modules/cham/LuoiFT.tsx`, `web/src/modules/cham/LuoiThuong.tsx`
- Delete: `web/src/modules/fasttrack/ScoreSheetPage.tsx`, `web/src/modules/normal/RegularSheetPage.tsx`
- Modify: `web/src/modules/fasttrack/ScoreEntry.tsx` (thêm `ODiemThuong`, `SuaDiemCoLyDo`, đếm ngược DS02)
- Modify: `web/src/App.tsx` (2 import + 2 phần tử route)

**Interfaces:**
- Consumes: `GET /classes/:classId/cham` (Task 3), `PUT /attempts/:id/scores/:skill`,
  `PUT /regular/attempts/:id/scores/:skill` (Task 2, 5), `oLuoiThuong`, `ketQuaThuong`, `demNguocSuaDau`, `kiemLyDo`.
- Produces: `ChamDiemPage` (default export) · `LuoiFT({ data, onReload, kn, hv })` · `LuoiThuong({ data, onReload, kn, hv })` ·
  `ODiemThuong`, `SuaDiemCoLyDo` (export từ `ScoreEntry.tsx`).

- [ ] **Step 1: Dời lưới FT.** Tạo `web/src/modules/cham/LuoiFT.tsx` = phần bảng của `ScoreSheetPage.tsx` hiện tại
  (`SheetRow`, `DeadlineSummary`, điều hướng bàn phím, `Th` các cột), nhận `data` (chính là `cham.ft`) qua props thay
  vì tự gọi API. **Bỏ** khối `<SectionNote>` cuối trang (G-5) — nội dung chuyển vào ⓘ ở Task 7 Step 4.

- [ ] **Step 2: Dời lưới lớp thường.** Tạo `web/src/modules/cham/LuoiThuong.tsx` từ `RegularSheetPage.tsx`, với năm
  thay đổi:

```tsx
/**
 * LƯỚI CHẤM LỚP THƯỜNG (spec §3.5, mockup 10b §2).
 *
 * Mỗi ô HAI SỐ: số câu đúng / tổng số câu, cả hai đều điền. Ô "tổng" trên đầu cột chỉ để ĐIỀN NHANH cả cột (nút ↓);
 * sửa riêng từng em vẫn được, và ô có tổng khác tổng của cột thì viền vàng. Không có tổng cố định theo chương trình.
 * Gõ "-" = em không làm bài: môn đó tự dời sang tuần sau (C08) — không phải điểm 0, không đụng môn khác.
 */
```
  1. Tiêu đề cột kèm ô tổng + nút ↓ (điền nhanh cả cột, **không đè** ô đã có tổng — Q7).
  2. Ô điểm dùng `ODiemThuong` (Step 3) thay `ScoreCell` cũ.
  3. Cột kết quả dùng `ketQuaThuong(...)` (Q9) — một dòng chính + tối đa một dòng phụ (G-3).
  4. **Xoá** khối `<SectionNote>` 12 dòng ở cuối (`RegularSheetPage.tsx:186-207`), trong đó có câu **sai**
     *"Phải đủ điểm cả bốn môn mới kết luận và mới sinh case SOS"* (lỗi §6 dòng 3 — máy chủ kết luận ngay khi có một
     môn dưới ngưỡng, xem `evaluateRegular`). Nội dung đúng chuyển vào ⓘ ở Step 4.
  5. Bảng dùng `table-layout: fixed` + `colgroup` và `tabular-nums` (G-2); bọc trong `overflow-x-auto` (G-11).

- [ ] **Step 3: Ô điểm lớp thường + hộp lý do + đếm ngược.** Thêm vào `web/src/modules/fasttrack/ScoreEntry.tsx`:

```tsx
/**
 * MỘT Ô CỦA LƯỚI LỚP THƯỜNG: số câu đúng / tổng số câu.
 *
 * Gõ "-" ở ô trái là một LỆNH, không phải một số: em không làm bài → môn này dời sang tuần sau (C08). Xoá dấu "-"
 * đang có là gỡ dấu và trả lịch về tuần cũ. Ô đã có điểm thì không nhận dấu "-" — muốn sửa phải qua hộp lý do.
 */
export function ODiemThuong({ cell, tongCot, canEdit, onSave, onDau, inputRef, onKeyDown }: {
  cell: { diem: number | null; tong: number | null; tuanDoiTu: string | null; tuanHienTai: string | null };
  tongCot: number | null;
  canEdit: boolean;
  onSave: (patch: { score: number | null; total: number | null; lyDo?: string }) => Promise<boolean>;
  onDau: (bat: boolean) => Promise<boolean>;
  inputRef?: (el: HTMLInputElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) { /* … */ }

/**
 * RB-5 — SỬA MỘT Ô ĐÃ CÓ ĐIỂM. Hộp nhỏ ngay tại ô: giá trị mới + ô lý do bắt buộc. Nút Lưu mờ khi lý do chưa đủ, rê
 * chuột thấy đúng câu của `kiemLyDo` — không để người dùng bấm rồi mới biết mình thiếu gì.
 */
export function SuaDiemCoLyDo({ tieuDe, moTaCu, children, onLuu, onDong }: {
  tieuDe: string; moTaCu: string; children: React.ReactNode;
  onLuu: (lyDo: string) => Promise<boolean>; onDong: () => void;
}) { /* … */ }
```
  Trong `RawScoreInput` và `CriteriaButton` (lưới FT): dưới ô đang mang dấu `-`, thêm một dòng
  `{demNguocSuaDau(cell.noShow?.editableUntil ?? null, demoDate)}` — chữ xám `text-[10px] text-slate-400`,
  **không tô đỏ** (DS02, Q17). Ô **đã có điểm** đổi nút sửa sang `SuaDiemCoLyDo`.

- [ ] **Step 4: Khung chung + ⓘ.** Tạo `web/src/modules/cham/ChamDiemPage.tsx`:

```tsx
/**
 * LƯỚI CHẤM — MỘT TRANG CHO CẢ LỚP FAST TRACK VÀ LỚP THƯỜNG (spec §3.5, mockup 05a §2).
 *
 * Trang này KHÔNG tự đoán loại lớp: máy chủ trả `mode` ở `/classes/:id/cham` và trang chọn lưới theo đó. Nhờ vậy mở
 * `/nhap-diem/:id` của một lớp thường không còn ra lưới Mock Test (đặc tả §6) — và ngược lại.
 *
 * Màn hẹp (< 768px) chuyển sang chế độ MỘT KỸ NĂNG MỘT LÚC (Task 10) — đúng cách giáo viên chấm thật.
 */
export default function ChamDiemPage() { /* … */ }
```
  Đầu trang (mockup 05a §2): `← Test` · `{mã lớp} · {tên đợt}` · bộ chọn đợt/tuần · `<Han loai="nhap-diem" …>` ·
  `<SaveIndicator>` "Đã lưu 10:31 ✓" · nút **ⓘ** mở popover luật. Nội dung ⓘ (thay cho mọi `SectionNote` đã xoá):

  - Chung: *"Ô để trống là chưa nhập, không phải 0 điểm. Chỉ kỹ năng bạn được phân công mới sửa được; kỹ năng khác vẫn
    đọc được để đối chiếu. Enter hoặc ↓ xuống em kế tiếp, Esc huỷ ô đang sửa. Mỗi môn có tuần thi và hạn chấm riêng."*
  - Lớp thường: *"Mỗi ô hai số: số câu đúng / tổng số câu, cả hai đều điền. Writing và Speaking chấm theo thang điểm
    thì điền điểm đạt / tổng điểm. Ô tổng đầu cột để điền nhanh cả cột; em làm đề khác thì sửa riêng ô đó (viền vàng).
    Đạt từ 70% trở lên. Thiếu điểm khác chưa đạt. Gõ `-` khi em không làm bài: môn đó tự dời sang tuần sau."*
  - Lớp Fast Track: *"Gõ `-` khi em có lịch mà không làm bài; sửa lại được đến hết Chủ nhật của tuần thi, còn nguyên
    thì thành Không dự thi."*

- [ ] **Step 5: Đổi route.** `web/src/App.tsx`:

```tsx
import ChamDiemPage from './modules/cham/ChamDiemPage.tsx';
…
          {/* Một trang lưới cho cả hai loại lớp — máy chủ trả `mode`, trang chọn lưới đúng (đặc tả §3.5, §6). */}
          <Route path="/nhap-diem/:classId" element={<ChamDiemPage />} />
          <Route path="/bang-diem-thuong/:classId" element={<ChamDiemPage />} />
```
  Xoá hai dòng import cũ và hai file cũ.

- [ ] **Step 6: Cuộn tới em đầu tiên chưa có điểm.** `ChamDiemPage` đọc `?kn=` (kỹ năng) và cuộn tới ô trống đầu tiên
  của cột đó sau khi dữ liệu tải xong (`requestAnimationFrame` + `scrollIntoView({ block: 'center' })`), rồi `focus()`.

- [ ] **Step 7: Kiểm bằng mắt + typecheck.** Run: `npm run typecheck && npm run build:web 2>&1 | tail -5`.
  Expected: sạch. Bấm thử để ở Task 13 (không chạy máy chủ ở bước này cũng được).

- [ ] **Step 8: Commit.**

```bash
git add web/src/modules/cham web/src/modules/fasttrack/ScoreEntry.tsx web/src/App.tsx
git rm web/src/modules/fasttrack/ScoreSheetPage.tsx web/src/modules/normal/RegularSheetPage.tsx
git commit -m "PR-Rc1 (7): mot luoi cham cho ca lop FT va lop thuong"
```

---

### Task 8: Tab Cần chấm theo mockup 05a2 phương án A

**Files:**
- Modify: `web/src/modules/test/CanChamTab.tsx` (viết lại)

**Interfaces:**
- Consumes: `GET /cham/can-cham?branchId=&classId=&scope=` (Task 6); `MUC_CAN_CHAM_LABEL`.

- [ ] **Step 1: Viết lại `CanChamTab`.**

```tsx
/**
 * TEST › CẦN CHẤM — mockup 05a2 phương án A.
 *
 * Ba mục cố định theo hạn: Quá hạn · Tuần này · Sắp tới. Hạn nằm ở TÊN MỤC nên dòng không cần nhãn hạn nữa; mỗi dòng
 * chỉ còn: lớp + đợt · kỹ năng · còn bao nhiêu bài · một nút Chấm. Bấm Chấm mở thẳng lưới đúng lớp, đúng đợt.
 */
```
  Bố cục một dòng (G-2, G-3): `<b>{classCode} · {dotLabel}</b>` · dòng phụ **một dòng** (`{kyNangLabel}`, thêm
  `· {kỹ năng} {tuần}` khi `tuanKhac`) · `còn {conBai} bài` (tabular-nums) · nút `Chấm` (chữ `Chấm tiếp` khi đã nhập
  được ít nhất một bài của đợt đó).
  Mục rỗng vẫn hiện tiêu đề + `0`; cả ba mục rỗng thì `<Empty title="Không còn bài nào cần chấm" hint="Lịch Test gần
  nhất ở tab Lịch Test." action={<Link…>Mở Lịch Test</Link>} />`.

- [ ] **Step 2: Chip "đang lọc theo lớp" (nợ sau rà PR-O, Q13).**

```tsx
{data.lop && (
  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: 'var(--line)' }}>
    Đang lọc: lớp {data.lop.code}
    <button type="button" className="btn btn-ghost btn-sm px-1" title="Bỏ lọc theo lớp"
      onClick={() => set('classId', null)}>✕</button>
  </span>
)}
```
  Giữ nguyên hàng bộ lọc phạm vi (`WORK_SCOPES`) và `<BranchFilter>` đang có; `set('classId', null)` chỉ xoá `classId`.

- [ ] **Step 3: 375px (G-11).** Dòng chuyển thành hai hàng (tên + nút ở hàng dưới), không cuộn ngang trang; nút `Chấm`
  cao ≥ 44px.

- [ ] **Step 4: Kiểm.** Run: `npm run typecheck`. Expected: sạch.

- [ ] **Step 5: Commit.** `git commit -m "PR-Rc1 (8): tab Can cham theo mockup 05a2 phuong an A"`

---

### Task 9: Tab Lịch Test + R13 bộ chọn tuần

**Files:**
- Modify: `web/src/modules/test/LichTestTab.tsx` (viết lại)
- Modify: `web/src/ui/Filters.tsx` (R13 — mã tuần theo G-6)

- [ ] **Step 1: Viết lại `LichTestTab`.** Gọi `GET /cham/lich-test?periodId=&branchId=`; mỗi lớp một thẻ
  (`<Card title={`${classCode} · ${branchName}`}>`), trong thẻ là bảng: `Đợt · Kỹ năng · Số HV · Trạng thái chấm`, mỗi
  dòng bấm được → `href` của dòng (mở lưới). Tiêu đề tuần dùng `tuanLich(weekStart, session?.demoDate)` → `W3 SEP`.
  Rỗng: `<Empty title="Tuần này không có lượt Test nào" hint="Đổi tuần ở trên, hoặc mở Kế hoạch Test để xếp lịch." />`.

- [ ] **Step 2: R13 — mã tuần trong bộ chọn tuần (G-6).** Trong `web/src/ui/Filters.tsx`, thay ba chỗ dùng
  `weekCodeOf(...)` để **hiển thị** (trường tuần và hai tooltip mũi tên) bằng `tuanLich(ws, today)`:

```tsx
import { mondayOfDate, owningMonthOf, tuanLich } from '@shared/domain/index.ts';
…
            title={shown ? `Tuần trước · ${tuanLich(addDaysStr(shown.weekStart, -7), today)}` : 'Tuần trước'}
…
                <span className="text-slate-500 text-xs shrink-0">{tuanLich(shown.weekStart, today)}</span>
```
  **Không** đổi `weekCodeOf` ở chỗ nào khác (nó là mã dữ liệu, có năm).

- [ ] **Step 3: Chạy.** Run: `npm run typecheck`. Expected: sạch. Ghi vào Nhật ký: R13 còn phần **bấm thử** ở Task 13
  (600px · trong ngăn/hộp thoại · 375px).

- [ ] **Step 4: Commit.** `git commit -m "PR-Rc1 (9): Lich Test theo lop + ma tuan W3 SEP o bo chon tuan"`

---

### Task 10: Chấm trên điện thoại — một kỹ năng một lúc

**Files:**
- Create: `web/src/modules/cham/MotKyNang.tsx`
- Modify: `web/src/modules/cham/ChamDiemPage.tsx`

- [ ] **Step 1: Viết `MotKyNang`.**

```tsx
/**
 * CHẤM TRÊN ĐIỆN THOẠI — MỘT KỸ NĂNG MỘT LÚC (mockup 05a §3, phương án A).
 *
 * Đúng cách giáo viên chấm thật: xong cả lớp một kỹ năng rồi mới sang kỹ năng khác. Không có bảng năm cột, không cuộn
 * ngang. Trên cùng là hàng chip chọn kỹ năng kèm "{đã nhập}/{tổng}"; dưới là danh sách học viên, mỗi em MỘT ô to.
 */
export function MotKyNang({ mode, data, onReload }: { /* … */ }) { /* … */ }
```
  - Chip kỹ năng: chỉ kỹ năng **mình sửa được** đứng trước, kỹ năng khác vẫn chọn được nhưng ô chỉ đọc (tooltip
    "Bạn không được phân công kỹ năng này").
  - Lớp FT: ô lớn 60px (L/R số câu; W1/W2/S mở bốn tiêu chí bằng `CriteriaModal` đã có).
  - Lớp thường: hai ô `đúng` `/` `tổng`, ô tổng lấy sẵn tổng của cột.
  - Gõ `-` hoạt động y hệt trên máy tính.
  - `inputMode="numeric"`, ô cao ≥ 44px, nút và chip cao ≥ 44px.

- [ ] **Step 2: Nối vào `ChamDiemPage`.** Dùng `window.matchMedia('(max-width: 767px)')` trong một hook nhỏ
  `useManHinhHep()` (đặt ngay trong `ChamDiemPage.tsx`, có `addEventListener('change')` và dọn dẹp). Màn hẹp → render
  `<MotKyNang>`; màn rộng → lưới. Có nút chữ nhỏ "Xem dạng bảng" để vẫn mở được lưới trên điện thoại (cuộn ngang
  **trong thẻ**, G-11).

- [ ] **Step 3: Chạy.** Run: `npm run typecheck && npm run build:web 2>&1 | tail -3`. Expected: sạch.

- [ ] **Step 4: Commit.** `git commit -m "PR-Rc1 (10): cham tren dien thoai — mot ky nang mot luc"`

---

### Task 11: R15 và R16 ở hồ sơ đợt

**Files:**
- Modify: `web/src/modules/fasttrack/MockDetailPage.tsx` (~150-160)

- [ ] **Step 1: R16 — nút "Nhập điểm cả lớp" mang theo đợt/tuần.**

```tsx
          {d.classId && (
            <Link className="btn no-underline"
              to={`/nhap-diem/${d.classId}${d.period ? `?periodId=${d.period.id}` : ''}`}>
              Nhập điểm cả lớp
            </Link>
          )}
```

- [ ] **Step 2: R15 — chọn đợt khác ngay trên trang.** Cạnh tiêu đề, thêm một `<select className="field w-44">` liệt kê
  các đợt **của chính học viên đó** (gọi `/attempts?studentId={id}`, đã có sẵn), chọn thì `navigate(attemptHref(dòng))`
  — dùng `attemptHref` của `web/src/lib/format.ts` để bài của lớp thường về đúng bảng lớp thường. Nhãn mỗi lựa chọn:
  `MT{n} · {tuanLich(weekStart, demoDate)}` (FT) hoặc `Giữa khoá · {tuần}` / `Cuối khoá · {tuần}`. Đợt đang mở được
  chọn sẵn; chỉ một đợt thì **không** hiện ô chọn.

- [ ] **Step 3: Chạy.** Run: `npm run typecheck`. Expected: sạch.

- [ ] **Step 4: Commit.** `git commit -m "PR-Rc1 (11): R15 chon dot khac tren trang, R16 nut nhap diem mang dot"`

---

### Task 12: Tài liệu

**Files:** `CODE_MAP.md`, `plan.md`, `shared/domain/policy.ts` (chú thích)

- [ ] **Step 1: `CODE_MAP.md`.** Thêm `shared/domain/chamDiem.ts`, `server/src/cham/canCham.ts`,
  `web/src/modules/cham/*`; xoá `ScoreSheetPage.tsx`, `RegularSheetPage.tsx`; ghi rõ "một lưới cho hai loại lớp, máy
  chủ trả `mode`".

- [ ] **Step 2: `shared/domain/policy.ts`.** Cập nhật hai chỗ nói C08 chưa nối dây:
  - Khối TRẠNG THÁI đầu file: chuyển C08 sang nhóm "NỐI DÂY".
  - Chú thích của `C08_HAN_CHAM_NORMAL`: thay đoạn "CHƯA NỐI DÂY phần dấu '-'…" bằng:
    *"ĐÃ NỐI DÂY (PR-Rc1): lớp thường ghi '-' thì môn đó tự dời sang tuần sau — `normal/regular.ts`
    (`reportRegularNoShow`), dùng lại `setSkillWeek`. `attempts.ts` chỉ chỉ đường sang đó."*

- [ ] **Step 3: `plan.md`.** Tick các mục PR-Rc1 đã xong (R8 phần lưới, R13, R15, R16, RB-5, R14 phần dấu "-",
  DS02) và ghi một dòng ngày 23/09 ở §3 nếu mục đó đang có dòng nhật ký. **Không** tick R9–R12, R14 phần lịch, T15
  (Rc2).

- [ ] **Step 4: Commit.** `git commit -m "PR-Rc1 (12): CODE_MAP, chu thich C08, o tick plan.md"`

---

### Task 13: Nghiệm thu — kiểm đủ, KIỂM bấm thử, rà soát, rebase, mở PR

- [ ] **Step 1: Chuỗi kiểm đầy đủ.** Run: `npm run check`. Expected: build sạch, `TẤT CẢ B+18 KIỂM TRA ĐỀU ĐẠT`
  (≈ 797), typecheck sạch. Ghi số vào Nhật ký.

- [ ] **Step 2: Không migrate — kiểm lại cho chắc.** Run:

```bash
git diff main...HEAD --stat -- server/src/schema.sql server/src/migrate.ts
```
  Expected: **không có dòng nào**. Có dòng nào thì 🛑 dừng: PR này không được có migrate (Q18).

- [ ] **Step 3: Chuẩn bị bấm thử** trên database **riêng** của worktree, cổng **4147 / 5347**:

```bash
KIEM="$(node -e "console.log(require('os').tmpdir())")/pr-rc1-kiem.sqlite"
PISA_DB="$KIEM" npm run seed
```
  Tạo file tạm `vite.kiem.config.ts` ở gốc worktree (**không commit, xoá sau khi xong**):

```ts
import base from './vite.config.ts';
export default { ...base, server: { port: 5347, strictPort: true, proxy: { '/api': { target: 'http://127.0.0.1:4147', changeOrigin: true } } } };
```
  Chạy hai tiến trình: `npm run build:server && PISA_DB="$KIEM" PORT=4147 npm run dev:api` và
  `npx vite --config vite.kiem.config.ts`. Mở `http://localhost:5347` (Playwright kênh Chrome, theo bộ nhớ "Máy chủ
  dev trong worktree"; **không** dùng `preview_start` vì nó chạy từ thư mục chính). Tài khoản demo: `DEMO.md`.

- [ ] **Step 4: KIỂM — bấm thử bốn vai, hai loại lớp, hai bề rộng.** Ghi kết quả từng ý vào Nhật ký; ảnh chụp lưu
  **`thiet-ke/anh/pr-rc1/`** (đặt tên theo ý, ví dụ `04-luoi-lop-thuong-1440.png`).

  **A. GVBM đúng môn (GV Listening của MB-FT 101) — 1440px**
  1. `Test › Cần chấm`: ba mục **Quá hạn · Tuần này · Sắp tới**; mỗi dòng đúng dạng `MB-FT 101 · MT3` + dòng phụ một
     dòng + `còn n bài` + nút `Chấm`. Không có dòng "còn 0 bài".
  2. Bấm `Chấm` → mở thẳng `/nhap-diem/...`, đúng lớp, đúng đợt, con trỏ ở ô trống đầu tiên của kỹ năng mình dạy.
  3. Lưới FT: ô mình dạy sửa được, ô môn khác chỉ đọc; gõ điểm → tự lưu, chỉ báo "Đã lưu ✓" hiện ở đúng dòng; Enter/↓
     xuống em kế tiếp; Esc huỷ.
  4. Gõ `-` vào một ô trống: ô hiện `-`, dòng phụ có **đếm ngược** "Còn n ngày để sửa" (chữ xám, **không đỏ**).
  5. Sửa một ô **đã có điểm**: hiện hộp **lý do bắt buộc**; bỏ trống → nút Lưu mờ, rê chuột thấy câu
     "Sửa điểm đã nhập thì phải ghi lý do."; ghi lý do → lưu được. Mở hồ sơ đợt (`/mock-test/:id`) › Lịch sử thay đổi:
     thấy **Lý do: …**.
  6. ⓘ mở ra đủ luật; **không** còn khối chữ dài dưới bảng (G-5).

  **B. GVBM môn khác (GV Speaking của MB-FT 101)**
  7. Cùng lưới: ô L/R chỉ đọc, tooltip "Bạn không được phân công kỹ năng này"; `Cần chấm` chỉ hiện việc của mình
     (phạm vi `Việc tôi phụ trách`).

  **C. GVCN lớp thường (MB-FOU 12)**
  8. Mở `/nhap-diem/{id lớp MB-FOU 12}` bằng cách **gõ thẳng đường dẫn** → phải ra **lưới lớp thường** (hai số mỗi ô),
     **không** ra lưới Mock Test, **không** thấy chữ "MT" ở đâu.
  9. Ô tổng đầu cột: gõ `40` rồi bấm ↓ → các ô **trống tổng** nhận 40; ô đã sửa thành 38 **giữ nguyên** và **viền
     vàng**, rê chuột thấy "Đề khác tổng của cột (40)".
  10. Nhập `33/40` → ô hiện `Đạt · 82,5%`; nhập `27/40` → `Chưa đạt · 67,5%`; cột Kết quả ghi `Đạt {k}/{n} môn đã chấm`
      và dòng phụ `còn W, S chưa chấm`. **Không** có câu "phải đủ bốn môn mới sinh case SOS".
  11. Gõ `-` vào ô Listening của một em → ô báo đã dời, dòng phụ `đã dời sang W4 SEP`; mở `Test › Lịch Test` tuần sau →
      thấy Listening của em đó; tuần cũ không còn. Gõ lại vào ô đó (xoá `-`) → môn trở về tuần cũ.
  12. Bài **Giữa khoá** và **Cuối khoá** của cùng một em đều hiện trạng thái Case của môn chưa đạt (lỗi §6 dòng 4).

  **D. Quản lý chi nhánh (MB)**
  13. `Test › Lịch Test`: chọn tuần bằng bộ chọn tuần — mã tuần ghi `W3 SEP` (**không** có năm khi cùng năm, G-6);
      danh sách nhóm theo lớp; bấm một dòng mở đúng lưới.
  14. **R13**: thu cửa sổ còn ~600px → nhóm `‹ tuần ›` **không tách hàng**; mở bộ chọn tuần trong một ngăn/hộp thoại
      (ví dụ ngăn xếp lịch) → popover **không bị cắt**.
  15. Hồ sơ đợt `/mock-test/:id`: ô **chọn đợt khác** (R15) chuyển đúng đợt; nút **Nhập điểm cả lớp** (R16) mở lưới
      đúng tuần của đợt đang xem.
  16. Quản lý sửa được điểm mọi môn nhưng vẫn phải ghi lý do khi ô đã có điểm.

  **E. 375px (G-11) — làm với vai GVBM và GVCN lớp thường**
  17. `Cần chấm`: không cuộn ngang trang, nút `Chấm` cao ≥ 44px, chữ không bị cắt.
  18. Lưới: tự chuyển sang **một kỹ năng một lúc**; chip kỹ năng có `{đã nhập}/{tổng}`; ô to gõ được; nút "Xem dạng
      bảng" cho bảng cuộn ngang **trong thẻ**.
  19. Lịch Test và hộp lý do không tràn ngang.

  Xong: dừng hai tiến trình, **xoá** `vite.kiem.config.ts`, xoá `$KIEM` nếu muốn. `git status` phải sạch (trừ ảnh
  trong `thiet-ke/anh/pr-rc1/` — nhớ `git add` chúng).

- [ ] **Step 5: Rà soát code.** REQUIRED SUB-SKILL: `superpowers:requesting-code-review`. Người rà: **Fable 5.1** (nếu
  code bằng Fable thì **Opus 5**). Đưa cho người rà: plan này, đặc tả §1, §2, §3.5, §4, §6, §7 dòng Rc1, bảng Q1–Q22,
  `git diff main...HEAD`. Yêu cầu soi riêng:
  (a) dấu `-` lớp thường **không** đụng bộ đếm `absence_move_count` và **không** đi qua `settleNoShows`;
  (b) ghi dấu rồi mà `setSkillWeek` ném lỗi thì **không** còn dòng `no_show_*` nào sót lại (giao dịch bao cả hai);
  (c) không đường nào nới quyền: grep `PERMISSIONS.` trong `cham/canCham.ts` và `regular.ts` phần mới;
  (d) `classScoreSheet` chặn lớp thường ở **máy chủ**, không chỉ ở giao diện;
  (e) diff **không** chạm 9 file của PR-Qa và 9 file của PR-Pa (bảng "Ranh giới");
  (f) không còn `SectionNote` giải thích mô hình trên hai lưới, và câu ghi chú sai về "đủ bốn môn mới sinh case SOS"
  đã biến mất (grep `sinh case SOS`);
  (g) `lyDo` chỉ bị đòi khi ô **đã có** điểm — lần nhập đầu không bị chặn.
  Xử lý phản hồi theo `superpowers:receiving-code-review`; ghi kết luận vào Nhật ký.

- [ ] **Step 6: Rebase lên `main` mới nhất.** PR-Rc1 không phụ thuộc Qa/Pa, merge trước hay sau đều được; ai merge
  trước thì người sau rebase.

```bash
git fetch origin && git rebase origin/main
```
  Gỡ xung đột bằng **giữ cả hai khối**:
  - `web/src/App.tsx`: Qa/Pa **thêm** route, Rc1 đổi phần tử của hai route đã có. Giữ cả hai; bảo đảm
    `/nhap-diem/:classId` và `/bang-diem-thuong/:classId` vẫn trỏ `ChamDiemPage`.
  - `server/src/routes/index.ts`: giữ cả khối của Rc1 và khối của PR kia.
  - `shared/domain/index.ts`: giữ cả hai dòng `export *`.
  - `server/src/tests/run.ts`: giữ cả hai khối nối phép kiểm.
  - `server/src/fasttrack/attempts.ts`: chỉ Rc1 sửa — xung đột ở đây nghĩa là có PR ngoài kế hoạch chạm vào, 🛑 hỏi.
  Sau rebase: `npm run check` (xanh, số phép kiểm = của `main` + 18).

- [ ] **Step 7: PR.** `git push -u origin pr-rc1-cham-diem`; `gh pr create` tiêu đề
  `PR-Rc1 · Cần chấm + Lịch Test + lưới chấm`, thân gồm: tóm tắt theo Task; bảng Q1–Q22; số phép kiểm B → B+18;
  **"Không có migrate"**; ảnh trong `thiet-ke/anh/pr-rc1/`; mục "Chuyển cho PR khác" (bên dưới); dòng cuối
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  **Không tự merge.** Báo chủ sản phẩm bằng tiếng Việt đơn giản: giờ vào khu Test là thấy ngay còn phải chấm những gì,
  chia làm ba mục theo hạn; bấm một nút là vào thẳng bảng chấm đúng lớp đúng đợt; lớp thường chấm bằng hai số (số câu
  đúng / tổng số câu) và gõ `-` khi em không làm bài thì môn đó tự sang tuần sau; sửa điểm đã nhập thì phải ghi lý do;
  chấm được trên điện thoại.

---

## Chuyển cho PR khác

### Chuyển cho PR-Rc2 (Kế hoạch Test, đợt 4)
- **R11** (đợt hoàn tất thì chỉ Quản lý sửa) dựng **trên** RB-5 của Rc1: đã có tham số `lyDo` ở
  `PUT /attempts/:id/scores/:skill` và `PUT /regular/attempts/:id/scores/:skill`, có `kiemLyDo`/`LY_DO_TOI_THIEU` ở
  `shared/domain/chamDiem.ts`, có hộp `SuaDiemCoLyDo` ở `web/src/modules/fasttrack/ScoreEntry.tsx`. Rc2 chỉ thêm điều
  kiện **ai** được mở đường đó khi đợt đã hoàn tất (siết ở `scoreEditPath` hoặc thêm một lần chặn trong `saveScore` /
  `saveRegularScore`), **không** dựng đường hiệu chỉnh thứ hai.
- **R14 phần lịch** (nút "Dời một môn" của lớp thường, mockup 10b §4) chưa làm. Hàm dời đã sẵn: `setSkillWeek` +
  `moveableSkills` (`permissions.ts`) — Rc1 đã dùng đúng cặp này cho dấu `-`, Rc2 chỉ cần một nút và một ô chọn tuần.
- **R9, R9b, R10, R12, T9, T15** và toàn bộ tab `Kế hoạch Test` (`KeHoachTestTab.tsx`, `MockPlanPanel.tsx`) giữ nguyên,
  Rc1 không chạm.
- Dữ liệu sẵn dùng: `GET /cham/lich-test?periodId=` trả sẵn nhóm theo lớp và câu trạng thái chấm
  (`trangThaiChamLabel`) — Kế hoạch Test lớp thường (10b §4) dùng lại được để hiện tuần hiện tại của từng môn.

### Chuyển cho PR-Qa (Học viên & Lớp — đang chạy song song)
- Badge/ô **"Bạn cần chấm: {n} bài"** trên dòng lớp (`StudentsPage.tsx`, chữ g10-060; Qa đang đổi thành
  `Lớp còn {n} bài chưa nhập điểm`, g10-062/063): **đích link phải đổi** từ
  `/hoc-vien?view=my_scores&classId={id}&scope={scope}` sang **`/test/can-cham?classId={id}&scope={scope}`**. Đường mới
  đã chạy và có chip "Đang lọc: lớp {mã} ✕" (Q13).
- Nút **"Nhập điểm test"** ở hồ sơ lớp (`ClassOverviewPage.tsx:156-161`) nay **không cần tự chọn đường** nữa: cả
  `/nhap-diem/{id}` và `/bang-diem-thuong/{id}` đều ra đúng lưới. Giữ `?periodId=` cho lớp FT là tốt nhất.
- Cắt chữ ô đó ở 375px: thuộc Qa (Rc1 không sửa file này).

### Chuyển cho PR-S3 (chữ cuối)
- Nhánh chết `view === 'my_scores'` trong `StudentsPage.tsx` nay **không còn ai dùng** sau khi Cần chấm có trang riêng
  — S3 xoá cùng bốn cờ quyền cũ như đã ghi ở spec §7 dòng S3.
- `<Han>` cho các hạn còn tự viết ở khu Test (nếu Rc1 bỏ sót chỗ nào) và quét chữ THUAT_NGU phần còn lại.

### Chuyển cho PR-Pa / PR-Pb
- `pendingDetail` mới ở `listAttempts` (hạn của các môn còn nợ **theo phạm vi**) dùng được cho ô "Chưa nhập điểm" ở
  Tổng quan và cho bảng Theo tuần, thay cho việc tự đi hỏi lại từng hạn.

---

## Mâu thuẫn giữa nguồn và mã (đã xử lý trong plan)

| # | Mâu thuẫn | Bên thắng | Xử lý |
|---|---|---|---|
| 1 | Đặc tả §3.5 + mockup 10b: "số câu đúng / tổng số câu" ↔ chú thích trong `RegularSheetPage.tsx:314-323` và `regular.ts`: "điểm đạt / tổng điểm" (vì Writing/Speaking chấm theo thang điểm) | **Đặc tả + mockup** (thứ tự nguồn §0) | Q6: dùng chữ của đặc tả, ⓘ giữ lại một câu cho Writing/Speaking. Không đổi tên cột dữ liệu (`raw_score`/`raw_total`). |
| 2 | `policy.ts` C08 ghi "CHƯA NỐI DÂY" ↔ đặc tả §3.5 coi C08 là luật đang áp | **Đặc tả** | Task 2 nối dây, Task 12 sửa chú thích. |
| 3 | `RegularSheetPage.tsx:196-200`: "Phải đủ điểm cả bốn môn mới kết luận và mới sinh case SOS" ↔ `evaluateRegular` kết luận ngay khi có một môn dưới ngưỡng, `refreshRegularOutcome` sinh tín hiệu ngay | **Mã (và đặc tả §3.5 "thiếu điểm không tính là chưa đạt")** | Xoá câu sai (Task 7 Step 2), thay bằng ⓘ nói đúng: kết luận tạm thời chỉ đi lên, không đi xuống "Đạt". |
| 4 | Kiểm kê R11 "đợt hoàn tất bằng điểm **hoặc** `-`" ↔ R14 "lớp thường `-` = dời lịch" | Kiểm kê §3 dòng 14 đã chốt: vế "hoặc `-`" **chỉ áp Fast Track** | Ghi rõ ở "Ranh giới với PR-Rc2". |
| 5 | Kiểm kê R13 ❓ "phải bấm thử" ↔ đọc mã thấy `Filters.tsx` hiển thị `weekCodeOf` (có năm) — sai G-6 | **G-6** | Q20: sửa phần hiển thị, phần còn lại bấm thử ở Task 13. |
| 6 | Đặc tả §7 dòng Rc1 muốn sửa ô "Bạn cần chấm: n bài" ↔ ràng buộc song song cấm sửa `StudentsPage.tsx` | **Ràng buộc song song** | Q19 + "Chuyển cho PR-Qa". |

---

## Self-review của người viết plan (23/09/2026, session planning)

1. **Phủ đặc tả §3.5 phần Rc1:** Cần chấm (Task 6, 8) · Lịch Test (Task 6, 9) · lưới chung FT + lớp thường (Task 3, 7) ·
   hai số mỗi ô + ô tổng đầu cột + viền vàng + không có tổng cố định (Task 7, Q7, Q8) · `-` dời tuần (Task 2) ·
   đạt ≥ 70% và thiếu điểm ≠ chưa đạt (Task 7 Q9, máy chủ không đổi) · `/nhap-diem/:id` lớp thường ra lưới lớp thường
   (Task 3) · chấm trên điện thoại một kỹ năng một lúc (Task 10). ✔
2. **Phủ việc có mã:** R8 phần lưới (Task 7, 11 — bốn đường vào đều về một lưới đúng), R13 (Task 9 + KIỂM 14),
   R15 (Task 11), R16 (Task 11), RB-5 (Task 5), DS02 (Task 1 + Task 7 Step 3). ✔
   **Không** làm: R9–R12, R14 phần lịch, T9, T15 → ghi rõ "Chuyển cho PR-Rc2". ✔
3. **Phủ §6 bốn dòng gắn Rc1:** `/nhap-diem/:id` không chặn lớp thường → Task 3 · máy chủ từ chối `-` → Task 2 · ghi
   chú sai ở `RegularSheetPage.tsx:196-200` → Task 7 Step 2 mục 4 · trạng thái Case mất ở dòng cũ → Task 4. ✔
4. **Phủ nợ sau rà PR-O (§7 dòng Rc1):** Cần chấm lọc ngầm theo lớp → Q13 + Task 8 Step 2 · ô "Bạn cần chấm: n bài" →
   Q19 + "Chuyển cho PR-Qa". ✔
5. **Không có chỗ giữ chỗ:** mọi bước có lệnh chạy được hoặc mã thật. Ba chỗ cố ý để người code viết tiếp nhưng đã nêu
   đủ hình dạng và luật: thân `ODiemThuong`/`SuaDiemCoLyDo` (Task 7 Step 3), thân `MotKyNang` (Task 10), phần lưới dời
   từ hai file cũ (Task 7 Step 1–2). Một dòng `|| true` trong bản nháp `lichTest` đã được ghi chú **phải viết lại**.
6. **Kiểu và tên nhất quán:** `mucCanCham`/`nhomCanCham`/`oLuoiThuong`/`ketQuaThuong`/`demNguocSuaDau`/`tuanKeTiep`/
   `trangThaiChamLabel`/`kiemLyDo`/`LY_DO_TOI_THIEU` dùng cùng tên ở Task 1 (định nghĩa), Task 2, 5, 6 (máy chủ),
   Task 7–10 (web). `reportRegularNoShow`, `chamSheet`, `canChamList`, `lichTest`, `pendingDetail`, `ChamDiemPage`,
   `LuoiFT`, `LuoiThuong`, `MotKyNang`, `ODiemThuong`, `SuaDiemCoLyDo` cũng vậy. ✔
7. **Ràng buộc song song:** không task nào chạm 9 file của Qa và 9 file của Pa; `App.tsx` chỉ đổi phần tử route đã có;
   `routes/index.ts`, `shared/domain/index.ts`, `run.ts` là "chỉ thêm khối". ✔
8. **Không migrate, không deploy, không chạm DB bản chính; cổng thử 4147/5347.** ✔
9. **Rủi ro lớn nhất:** Task 7 dời hai trang thành ba file mới — dễ rơi rớt hành vi nhỏ (điều hướng bàn phím, chỉ báo
   lưu từng dòng, `DeadlineSummary`). Cách giảm: dời **nguyên khối** rồi mới sửa, và KIỂM Step 4 mục A3 bấm đúng các
   hành vi đó.

---

## Nhật ký thực thi

*(Người code ghi vào đây: số phép kiểm từng mốc, kết quả KIỂM bấm thử từng ý, kết luận rà soát, vướng mắc và quyết
định tại chỗ.)*

| Ngày | Task | Ghi chú |
|---|---|---|
| | | |
