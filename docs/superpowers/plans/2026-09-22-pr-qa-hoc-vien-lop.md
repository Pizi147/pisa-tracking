# PR-Qa · Học viên & Lớp + Hồ sơ lớp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task, in order. Steps use checkbox (`- [ ]`) syntax — tick each
> one in THIS file as you finish it. Tasks marked 🛑 are **gates**: stop, report to the owner, wait for an explicit answer.

| Mục | Chốt |
|---|---|
| Model khuyến nghị | **Fable 5.1 · High** |
| Phương án B | **Sonnet 5 · High** |
| Subagent | **cùng model với session** (Fable 5.1 hoặc Sonnet 5 nếu chạy phương án B). **KHÔNG dùng Haiku** cho bất kỳ task nào |
| Người rà soát | **Opus 5** (khác model người code). Ghi model thật vào Nhật ký, commit ghi đúng dòng `Co-Authored-By` của model thật |
| Đợt | **Đợt 2**, chạy song song **PR-Pa** (Tổng quan) và **PR-S2** (điều chỉnh PA); **PR-AN** sắp merge |
| Số PR | **Một PR**, nhánh `pr-qa-hoc-vien-lop`, không draft, **không tự merge** |
| Cổng thử | API **4137** · web **5337** (PR-Pa có thể đang dùng 4117/5317). **KHÔNG** 4000/5173 |

**Goal:** Làm lại trang Học viên & Lớp (một trang, nhóm theo lớp, chip lọc có số đếm, dropdown Phạm vi) và Hồ sơ lớp (hàng nút đầu
trang, 3 tab Học viên · Ý thức & Phối hợp · Phân tích lớp, menu ⋯ mỗi dòng học viên, chế độ Điểm / Cần hỗ trợ, bảng lớp thường
Giữa khoá | Cuối khoá L R W S đúng/tổng), kèm Q1–Q5, Q10–Q13, K2-6a, YT-8 và ba nợ sau rà PR-O (tiêu đề tab, z-index thanh
dưới, hàm ngày G-6 đổi giờ Việt Nam + từ chối ngày không tồn tại).

**Architecture:** Mọi luật "hiện chữ gì, mấy cái, xếp thế nào" nằm ở một file thuần mới `shared/domain/hocVienLop.ts` để kiểm được
bằng harness máy chủ (web không có bộ kiểm thử). Máy chủ thêm ba mô-đun mới, **không migrate**: `server/src/classes/hocVienLop.ts`
(một request cho cả trang danh sách: lớp + số đếm chip + cờ lọc từng học viên), `server/src/classes/phanTichLop.ts` (ma trận kỹ
năng × đợt), `server/src/classes/thongTinLop.ts` (sửa mã / LT / ghi chú / chương trình của lớp), và một file phụ
`server/src/classes/dongHocVien.ts` (nhãn cảnh báo Ý thức + Case đang mở của từng dòng). `classRoster`/`classOverview` ở
`classes.ts` chỉ **thêm trường**. Web: trang danh sách viết lại, hồ sơ lớp tách thành vài component nhỏ; menu ⋯ dùng chung một hook.

**Tech Stack:** TypeScript 5.9 · React 18.3 + react-router-dom 6.28 · Vite 5 · Tailwind 3.4 (lớp tuỳ ý phải là **chuỗi tĩnh**) ·
Express 4 · `libsql` (SQLite khi dev) · harness tự viết `server/src/tests/run.ts` (`check`/`assert`/`assertThrows`, **không phải**
Jest, **không có bộ lọc**: luôn chạy cả bộ, tìm tên phép kiểm `PR-Qa ·` trong kết quả).

**Spec:** `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §1 (G-1…G-12), §2 (luật chữ, đặc biệt lớp thường),
§3.6, §3.7, §4 (bảng định vị), §6 (hai dòng gắn Qa), §7 dòng **Qa** (kể cả "Nợ sau rà PR-O (#58)"). Việc có mã:
`docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md` §1.2 (Q1–Q5, Q10–Q13), §1.6 (K2-6a, YT-8), §5.2 (ma trận chồng file).
Mockup (dùng đúng phương án đặc tả nêu): `thiet-ke/mockup/07b-hoc-vien-theo-lop.html` (**A**), `07c-cot-ket-qua.html` (**A**),
`06-ho-so-lop.html` (menu dòng **A**), `06c-dau-trang-va-ho-so-gv.html` **§1**, `10b-lop-thuong-v2.html` §1 + tab Học viên (A),
`12-ban-do-vi-tri.html`. Chữ: `thiet-ke/THUAT_NGU_DA_CHOT.md`.

**Số dòng trong plan này** đo trên `main` @ `7843875` (22/09/2026, sau PR-O #58, PR-S1 #56, spec #60). Trước khi sửa, mở file xem
lại — lệch vài dòng là bình thường; **lệch nội dung** thì 🛑 hỏi.

---

## Global Constraints

### Luật giao diện chung (spec §1 — áp mọi task)

| Mã | Luật |
|---|---|
| G-1 | Dấu tích ✓ nhỏ, mảnh, cùng màu chữ phụ. Không dùng icon tích to hay có nền. |
| G-2 | Cột và hàng thẳng: số dùng `tabular-nums`; cột số canh phải hoặc giữa, cố định độ rộng (`table-layout: fixed` / `colgroup`); các hàng cùng bảng cao bằng nhau. |
| G-3 | Không dồn chữ: tối đa **một** dòng phụ dưới dòng chính, dòng phụ ≤ ~60 ký tự. Thông tin thêm đưa vào ⓘ hoặc panel. |
| G-4 | ⚠ chỉ nghĩa là **quá hạn**. Các trạng thái khác dùng badge chữ. |
| G-5 | Bỏ mọi khối chữ giải thích cho dev (`SectionNote` giải thích mô hình). Luật cần thiết đưa vào popover ⓘ cạnh tiêu đề. |
| G-6 | Ngày không bao giờ hiện dạng ISO. Ngày: `dd/mm` (cùng năm) hoặc `dd/mm/yyyy`. **Tuần lịch: `W{n} {THÁNG}`** (vd `W3 SEP`). **Tuần học trong khoá: `W{n}/{tổng}`** (vd `W8/8`). Dùng hàm chung `ngay` / `tuanLich` / `tuanKhoa`. |
| G-7 | Viết tắt được giữ (GVCN, GVBM, PA, SOS, FT, KV, OVR, L R W1 W2 S) luôn có tooltip bản đầy đủ. Icon ⋮ ⋯ ⓘ ▸ ✓ luôn có tooltip. |
| G-8 | Panel không chồng panel. Mở việc khác từ một panel thì đóng panel cũ rồi mở panel mới. |
| G-9 | Mọi ô dán bằng chứng nhận: Ctrl+V dán ảnh, kéo thả, chọn tệp, dán liên kết. (PR này không thêm ô bằng chứng.) |
| G-10 | Mọi số trên dashboard bấm được, mở đúng danh sách tạo ra số đó. Mọi hạn hiển thị qua `<Han>` / `deadlineView`. |
| G-11 | Mobile (375px): bảng rộng cuộn ngang **trong thẻ**, trang không cuộn ngang. Thanh 4 khu vực thành thanh dưới 4 nút. |
| G-12 | Mọi module có hơn một lối vào phải có mục trong bảng định vị (§4). Không thêm nút ở chỗ chưa ghi trong §4. |

### Luật chữ (spec §2 + THUAT_NGU)

- "**Case**" luôn viết hoa. HV/học viên. "Phương án (PA)". Không mở đầu câu bằng "Hãy".
- **Lớp thường** (không viết "Normal" trên màn): bài **Giữa khoá · Cuối khoá** (không "Progress/Final Test", không "MT"); kết quả
  **Đạt / Chưa đạt · "Đạt 3/4 môn"** (không "đạt kỳ vọng", không Overall); kỹ năng **L R W S**.
- Chữ PR này dùng (đã tra THUAT_NGU): `Học viên & Lớp` (g1-004) · `Hồ sơ lớp` (g1-011) · `Phân tích lớp` (g1-021) · `Lộ trình lớp`
  (g1-037) · `Ý thức & Phối hợp` (g2-001) · chế độ `Điểm` / `Cần hỗ trợ` (g2-026/027) · `Gọn` / `Đầy đủ` (g2-028/029) · `+ Case`
  (g3-033) · `+ Học viên` (g3-036/037) · `+ Lớp mới` (g3-039/040) · `+ Ghi nhận vi phạm` (g3-042) · `Nhập điểm Test` (g3-070/071) ·
  `Nhập điểm MT3` (g3-072) · `Chuyển lớp` (g3-111) · `Chuyển tiếp lớp` (g3-112/113) · `Sửa phân công` (g3-118/119) · `Sửa thông tin
  lớp` (g3-120) · ⋮ tooltip `Thêm thao tác` (g3-157) · chip `Tất cả` (g4-001), `Đang SOS` (g8-076), `Có Case đang xử lý` (g8-052),
  `Case thiếu PA học thuật`, `Case quá hạn cập nhật`, `Thiếu thông tin` · ô chọn `Phạm vi: Lớp tôi dạy ▾` (g4-010) · `Xếp: Tên A→Z ▾`
  (g4-011) · ô tìm `🔍 Tìm tên, mã học viên hoặc mã lớp…` (g4-046) · cột `Kết quả gần nhất` (g5-009), `Mục tiêu` (g5-003), `Việc
  tiếp theo` (g5-010), `Case` (g8-001), `Target` (g13-002), `Dự kiến thi` (g5-004), `Mốc` (g5-005), `Theo dõi` (g5-007), `OVR`
  (g10-047) · `{n} Case đang mở` (g8-049/050) · `Thiếu {x}` (g8-151) · `Thiếu {kỹ năng} ({điểm})` → viết `Thiếu L 5.5` theo spec §3.6
  (g8-152) · `Lớp còn {n} bài chưa nhập điểm` (g10-062/063, qua `needScoresText`) · `Chưa có GVCN` (g14-032) · `Chưa phân công`
  (g14-033) · `{n} vi phạm` (g9-002).

### Luật riêng của PR này

- **Không migrate.** Không đổi `schema.sql` / `migrate.ts`.
- **Không đổi luật nghiệp vụ, không nới quyền.** Máy chủ vẫn chặn như cũ; nút/mục menu **chỉ hiện khi người xem làm được** (cờ quyền
  máy chủ trả về). Không có nút bấm vào ra 403, không có nút bấm không làm gì.
- **Chữ bị cấm bởi phép kiểm có sẵn** (quét cả chú thích trong `web/src`, `shared`, `server/src`): `Kế hoạch MT`, `Việc của tôi`,
  `Cả phạm vi quản lý`, `Tiến độ lớp`, `biện pháp`, `BP` (đứng riêng), `Hãy` — xem `PRH_OLD_STRINGS` trong
  `server/src/tests/run.ts` và `server/src/tests/hoSoHocVien.tests.ts`. Không viết các chuỗi này, kể cả chú thích.
- Không hiện ngày ISO, không "Tuần 36", không "tuần 5/10" trên màn PR này tạo.
- Lệnh kiểm tra: `npm run check` (= build máy chủ + `npm test` + `npm run typecheck`). **Số phép kiểm chỉ tăng.**
- An toàn: không đặt `TURSO_*`, `BAN_CHINH`, `PISA_CHO_PHEP_*` trong cửa sổ làm việc. Không chạy lệnh nào vào DB bản chính,
  không deploy.

### Ranh giới với PR chạy song song (ma trận kiểm kê §5.2)

| PR | File của họ — PR-Qa **KHÔNG sửa** |
|---|---|
| PR-AN (sắp merge) | `server/src/app.ts`, `server/src/auth.ts`, `WelcomePage.tsx`, `netlify.toml`, `netlify/functions/*`, `server/src/cases/cases.ts` (hàm đếm bằng chứng) |
| PR-S2 | `server/src/cases/cases.ts`, `server/src/cases/sosAuto.ts`, `CasePanel.tsx`, `SkillBoard.tsx`, `schema.sql`, `migrate.ts` |
| PR-Pa | `OverviewPage.tsx`, `MetricTiles.tsx`, `Highlights.tsx`, `BranchPulse.tsx`, `WorkList.tsx`, `server/src/worklist/dashboard.ts`, `highlights.ts`, `mywork.ts`, `server/src/cases/signals.ts` |

- PR-Qa **chỉ import** `listCases` từ `cases.ts` (không sửa file đó).
- **PR-Pa sẽ DÙNG `ngay`/`tuanLich`** nhưng không sửa — PR-Qa sở hữu `shared/domain/hienThiNgay.ts` và `shared/domain/display.ts`.
  Task 1 làm **đầu tiên** và **giữ nguyên chữ ký hàm** (`ngay(d, homNay?)`, `tuanLich(d, homNay?)`, `tuanKhoa(n, tong)`,
  `shortDate(iso, today)`), chỉ đổi hành vi (giờ VN + từ chối ngày không tồn tại).
- File "chỉ thêm khối" có thể xung đột khi gộp — **giữ cả hai bên**: `server/src/routes/index.ts` (một dòng import + một khối route
  mới), `shared/domain/index.ts` (một dòng `export *`), `server/src/tests/run.ts` (một khối cuối).
- File PR-Qa sửa mà PR đợt sau sẽ sửa tiếp (tuần tự, không song song): `StudentsPage.tsx`, `ClassOverviewPage.tsx`,
  `ClassRoster.tsx` (Qb, đợt 3), `MissingBadge.tsx`, `standing.ts`, `classes.ts` (LT, đợt 5), `fasttrack.ts` (một bảng chữ).

---

## Quyết định session planning tự chốt khi đặc tả im lặng (ghi lại để người rà soát kiểm)

| # | Chỗ im lặng / lệch | Chốt | Vì sao |
|---|---|---|---|
| Q1 | Menu ⋯ dòng HV có "Lộ trình tiếp theo" (lớp thường) và "Chuyển lớp" — thuộc PR-LT (đợt 5) | **Ẩn cả hai** tới PR-LT, qua một hằng `MENU_DONG_CHO_PR_LT = { loTrinhTiepTheo: false, chuyenLop: false }` ở `shared/domain/hocVienLop.ts`. PR-LT bật hằng + gắn panel. Hiện ngay: **Hồ sơ · + Ghi nhận vi phạm · + Case · Nhập điểm {đợt}** | "Không hiện nút không làm gì". Lộ trình tiếp theo chưa có dữ liệu. Chuyển lớp: form cũ đòi `student.edit` ở **cả lớp đích** nên GVCN bấm sẽ ra 403, trái §3.9 "Quyền phải khớp giữa menu, máy chủ"; lối cũ ở ⋮ hồ sơ HV vẫn còn |
| Q2 | Tên GV ở hồ sơ lớp "bấm được mở hồ sơ GV" nhưng trang hồ sơ GV do PR-GV (đợt 5) làm | Component `TenGiaoVien` gọi `duongHoSoGiaoVien(id, người xem)`; hàm trả `null` khi hằng `CO_TRANG_HO_SO_GIAO_VIEN = false` → **hiện chữ thường, không phải link**. PR-GV đổi hằng thành `true` + thêm route `/giao-vien/:id`. Hàm đã có luật quyền §3.12 (QL xem mọi GV trong phạm vi; GV chỉ xem chính mình) | Không có link chết; PR-GV chỉ đổi một hằng |
| Q3 | Dropdown Phạm vi (Lớp tôi dạy / Chi nhánh / Tất cả) + ô chọn chi nhánh | **Lớp tôi dạy** = lớp người xem là GVCN hoặc GVBM · **Chi nhánh** = mọi lớp của MỘT chi nhánh (chọn chi nhánh nào bằng ô chọn thứ hai, chỉ hiện khi xem được > 1 chi nhánh) · **Tất cả** = mọi lớp trong phạm vi quyền. Chỉ hiện lựa chọn có nghĩa (QL 1 chi nhánh không có "Tất cả"); còn một lựa chọn thì ẩn dropdown. Mặc định: có dạy lớp → Lớp tôi dạy; không → Tất cả nếu có, rồi Chi nhánh. Link cũ `?branchId=` không ghi phạm vi = Chi nhánh đó | Spec §3.6 (mới hơn) thắng Q12 kiểm kê ("Người phụ trách"); phạm vi quyết luôn `workScope` của badge chấm bài (Lớp tôi dạy = `mine`) nên bỏ được cặp nút Tôi/Tất cả (Q12) |
| Q4 | Chip lọc là gì | Chip lọc **học viên** (không mở hàng đợi riêng như bản cũ): Tất cả · Đang SOS · Có Case đang xử lý · Case thiếu PA học thuật · Case quá hạn cập nhật · Thiếu thông tin. Số đếm = số HV mang cờ đó. Lọc xong lớp nào không còn em thì ẩn. Giữ khoá URL cũ `view=sos|case_working|case_no_plan|case_overdue` (link từ BranchPulse, WeeklyBoard, signals); `sos_open` → `sos`; `missing_scores` → chuyển `/test/can-cham` | Một cơ chế lọc; link cũ không gãy mà không sửa file PR-Pa |
| Q5 | Q2 kiểm kê "badge `case SOS` → nhãn đúng tập đếm" | Badge **"{n} Case đang mở"** = tổng Case chưa xong của các HV đang học trong lớp (đúng bằng tổng cột Case của danh sách lớp — có phép kiểm). Bấm → hồ sơ lớp, chế độ **Cần hỗ trợ** (liệt kê HV có Case mở, dòng đầu ghi "n học viên · m Case đang mở") | Số và danh sách mở ra cùng một tập |
| Q6 | Q11 "Nút Nhập điểm trên hàng lớp" nhưng §4 chưa ghi chỗ này (G-12) | Đặt trong **⋯ của hộp lớp**: Hồ sơ lớp · Nhập điểm Test · + Học viên (theo quyền). Task 15 **bổ sung §4** dòng "Chấm điểm" | Làm Q11 mà không vi phạm G-12 |
| Q7 | "tối đa 2 badge" — badge nào | Thứ tự ưu tiên: Hết khoá · n HV cần xếp lớp tiếp → Thiếu GV {kỹ năng} → bài chưa chấm → n Case đang mở → chặng thi (Thi Giữa khoá tuần này…) → Thiếu n thông tin. Hiện 2 cái đầu, còn lại gom "+n" có tooltip | Việc chặn trước, thông tin sau |
| Q8 | ⋮ "Sửa thông tin lớp (tên, mã, chương trình)" — chưa có API | Route mới `PATCH /classes/:id/thong-tin`: sửa **mã lớp** (phải có tiền tố chi nhánh, không trùng), **LT** (chỉ FT), **ghi chú**; **chương trình chỉ đổi được khi lớp chưa có học viên và chưa có bài Test** (lớp tạo nhầm), đổi thì kỹ năng lớp theo chương trình mới và phân công kỹ năng không còn thì kết thúc. Quyền `class.edit`, ghi nhật ký `class.info` | Đổi chương trình của lớp đang học làm sai mọi điểm đã chấm; lớp thường học tiếp khoá sau đã có "Chuyển tiếp lớp" |
| Q9 | Nút đầu hồ sơ lớp — ai thấy | Lộ trình lớp / Lịch kiểm tra, Chuyển tiếp lớp: `class.edit` · + Case: `sos.report` · + Học viên: `student.edit` · Nhập điểm Test: có kỹ năng sửa được ở lớp · ⋮: Sửa phân công (`class.assign`), Sửa thông tin lớp (`class.edit`); ⋮ rỗng thì không vẽ | Không nút 403 |
| Q10 | "Lộ trình lớp" (FT) / "Lịch kiểm tra" (lớp thường) mở gì | Cùng panel `ClassProgressPanel` (tuần khai giảng; lớp thường thêm tuần thi Giữa khoá / Cuối khoá), tiêu đề theo nút, chữ lớp thường | Panel đã có; PR-Rc2 có thể trỏ nút này sang Kế hoạch Test sau |
| Q11 | Cột Kết quả gần nhất FT khi Overall đạt | "6.0" + **"Thiếu 0.5"** đỏ chỉ khi Overall < kỳ vọng của đợt đó; **✓ nhỏ** (G-1) chỉ khi SOS 0; chip SOS; dòng phụ "MT2 · kỳ vọng 6.5 · Thiếu L 5.5" (spec §3.6 thắng mockup 07c "hụt Listening (5.5)") | Spec + THUAT_NGU g8-152 |
| Q12 | Mockup 07b ghi thiếu thông tin là "⚠ 2" | Badge chữ **"Thiếu 2"** (tooltip danh sách), sửa ở `MissingBadge` | G-4: ⚠ chỉ nghĩa quá hạn. Nhãn YT-8 (vi phạm chưa xử lý quá 5 ngày) **được** dùng ⚠ vì đó là quá hạn |
| Q13 | Cột "Việc tiếp theo" lấy từ đâu | Máy chủ dựng mỗi dòng bằng hàm thuần `viecTiepTheoCua`: (1) nhập điểm kỹ năng của **chính người xem** ở đợt đang chờ ("Nhập điểm L, W · Giữa khoá", đỏ nếu quá hạn); (2) mỗi Case chưa có PA học thuật: "Xác định nguyên nhân W2"; (3) mỗi Case có hạn cập nhật: "L · Cập nhật kết quả · trước CN 20/09" (chữ từ `deadlineView`, cùng câu với `<Han>`). Quá hạn lên đầu. Hiện 2 badge + "+n việc" | Mỗi badge một dòng (spec) mà hàng không cao quá (G-2) |
| Q14 | Phân tích lớp — ô ghi gì | FT: `n/N` = số HV đạt kỳ vọng **của đợt đó** / số HV có điểm kỹ năng đó (W1, W2 so riêng từng bài — ⓘ ghi rõ). Lớp thường: `n/N HV đạt` (≥ 70%). Bấm dòng → mở bảng vấn đề cũ (`IssueTable`) của kỹ năng đó ("mở dòng ra từng loại lỗi") | Mockup 06 + spec §3.7 |
| Q15 | Tab Ý thức & Phối hợp có số (mockup 06) | ⚠ trên tab khi có HV bị cảnh báo quá 5 ngày (`classWarning.activeCount > 0`); không thêm số | Spec không ghi số; ⚠ đúng nghĩa G-4 |
| Q16 | Menu ⋯ nằm trong bảng cuộn ngang sẽ bị cắt | Component `MenuDong` vẽ menu bằng portal, `fixed`, `z-[60]`; đủ chỗ thì mở xuống, không thì mở lên; cuộn/đổi cỡ thì đóng | G-11 bảng cuộn trong thẻ |
| Q17 | Q10 kiểm kê "2 vấn đề nổi bật trên bảng HV" | **Không làm** — spec §3.7 và mockup 06/06c không có; tab Phân tích lớp trả lời câu đó. Q10 còn lại (tóm tắt GVBM, bài chờ chấm, Case mở/thiếu PA, chế độ Điểm / Cần hỗ trợ) làm ở Task 11–12 | Spec thắng kiểm kê (§0) |
| Q18 | HV đã lưu trữ | Không hiện ở danh sách Học viên & Lớp và không vào số đếm (khớp `studentCount` của lớp) | Một định nghĩa "đang học" |
| Q19 | "Mở sẵn lớp đầu tiên (hoặc lớp chứa kết quả tìm kiếm)" | Không lọc: mở lớp đầu tiên. Đang tìm / đang chip: mở mọi lớp còn hiện (tối đa 5). Người dùng đóng hết thì URL ghi `open=-` để không tự mở lại | Mockup 07b |
| Q20 | `CLASS_PHASE_LABEL` còn "Progress Test tuần này" | Đổi chữ ở một chỗ (`shared/domain/fasttrack.ts`): "Tuần sau thi Giữa khoá", "Thi Giữa khoá tuần này", "Tuần sau thi Cuối khoá", "Thi Cuối khoá tuần này", "Đã hết khoá" | Badge chặng thi của hộp lớp đọc bảng này |
| Q21 | Cột "Khoá" lớp thường khi chưa có dữ liệu Lộ trình tiếp theo | Hiện "FOU · W8/8" + dòng phụ "kết thúc W4 SEP". Hàm `khoaLopThuong` đã nhận `tiepTheo` (luôn `null` ở PR này) → PR-LT truyền vào là hiện "tiếp theo: …" | "Hiện phần có sẵn" |

## Mâu thuẫn đã giải (nguồn trên thắng nguồn dưới, spec §0)

1. Kiểm kê Q4/Q5 "4 tab, có tab Giáo viên dùng chung form Phân công" ↔ spec §3.7 **bỏ tab Giáo viên** → spec thắng; Q5 thành mục
   **Sửa phân công** trong ⋮ (vẫn `TeacherAssignDialog`).
2. Kiểm kê Q12 "dropdown Người phụ trách" ↔ spec §3.6 "dropdown **Phạm vi** (Lớp tôi dạy / Chi nhánh / Tất cả)" → spec.
3. Spec §7 dòng GV "tên GV ở hồ sơ lớp **đã là link** từ Qa" ↔ yêu cầu không để link chết khi PR-GV chưa làm → Q2.
4. Q11 kiểm kê (Nhập điểm trên hàng lớp) ↔ G-12 (§4 chưa có chỗ này) → Q6, sửa §4 trong PR.
5. Mockup 07b "⚠ 2" ↔ G-4 → Q12. Mockup 07c "hụt Listening (5.5)" / "đạt kỳ vọng" ↔ spec §3.6 "Thiếu L 5.5" → spec.
6. Mockup 06 nút "Nhập điểm MT3" ↔ 06c §1 / spec "Nhập điểm Test" → "Nhập điểm Test" ở đầu trang; menu dòng HV ghi "Nhập điểm MT3" /
   "Nhập điểm Giữa khoá" (g3-072).
7. Kiểm kê §6 "Đạt kỳ vọng" ở `ClassRoster.tsx:244-252` cho lớp thường → lớp thường không còn dùng `ClassRoster` (bảng riêng
   `BangDiemLopThuong`), `ClassRoster` chỉ còn FT.

---

## Bản đồ file

| File | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `shared/domain/display.ts:25-36` | Sửa | `ngayTheoGioVN` (mới), `validIso`, `shortDate` theo giờ VN + từ chối ngày không tồn tại |
| `shared/domain/hienThiNgay.ts` | Sửa | `ngay`, `tuanLich` dùng `ngayTheoGioVN` |
| `server/src/tests/khung.tests.ts:16` | Sửa | phép kiểm "Có giờ vẫn chỉ lấy ngày" → đổi sang giờ VN |
| `index.html:7` | Sửa | `<title>PISA Progress</title>` |
| `web/src/App.tsx:126-127` | Sửa | thanh dưới `z-40` → `z-30` |
| `shared/domain/hocVienLop.ts` | Tạo | luật thuần của hai màn (chip, phạm vi, kết quả, khoá, badge lớp, nhóm GV, menu dòng, sắp xếp, lớp mở sẵn, việc tiếp theo, Case chính, link hồ sơ GV, tab hồ sơ lớp) |
| `shared/domain/index.ts` | Sửa | thêm một dòng `export *` |
| `shared/domain/fasttrack.ts:80-89` | Sửa | chữ `CLASS_PHASE_LABEL` |
| `server/src/students/standing.ts` | Sửa | `Standing` thêm `overall`, `expectation`, `belowSkills`, `failedSkills` |
| `server/src/classes/dongHocVien.ts` | Tạo | `canhBaoTheoHocVien`, `caseMoTheoHocVien`, `soCaseMoTheoLop` |
| `server/src/classes/hocVienLop.ts` | Tạo | `danhSachHocVienLop(p, f)` |
| `server/src/classes/phanTichLop.ts` | Tạo | `phanTichLop(p, classId)` |
| `server/src/classes/thongTinLop.ts` | Tạo | `capNhatThongTinLop(p, classId, input)` |
| `server/src/classes/classes.ts` (`classRoster` 259-553, `classOverview` 556-599) | Sửa | thêm trường dòng HV (`canhBaoYThuc`, `viecTiepTheo`, `tuanMon`) và cờ/số của hồ sơ lớp |
| `server/src/routes/index.ts` | Sửa | 1 dòng import + khối 3 route mới trước "Thêm học viên hàng loạt" (~dòng 882) |
| `server/src/tests/hocVienLop.tests.ts` | Tạo | mọi phép kiểm `PR-Qa ·` |
| `server/src/tests/run.ts` (cuối file) | Sửa | khối gọi `runHocVienLopTests` |
| `web/src/ui/MenuDong.tsx` | Tạo | nút ⋯/⋮ + menu portal |
| `web/src/modules/classes/TenGiaoVien.tsx` | Tạo | tên GV (link khi có trang hồ sơ GV) |
| `web/src/modules/classes/CanhBaoYThuc.tsx` | Tạo | nhãn YT-8 |
| `web/src/modules/classes/thaoTacDongHocVien.tsx` | Tạo | hook menu ⋯ dòng HV + panel (+ Case, + Ghi nhận vi phạm) |
| `web/src/modules/students/MissingBadge.tsx:30-33` | Sửa | "Thiếu n" không ⚠ |
| `web/src/modules/students/BangHocVienLop.tsx` | Tạo | bảng 6 cột trong hộp lớp của trang danh sách |
| `web/src/modules/students/StudentsPage.tsx` | Sửa (viết lại phần trang) | điều khiển, chip, hộp lớp; giữ `export function WorkQueue` (Test › Cần chấm dùng) |
| `web/src/modules/classes/ClassOverviewPage.tsx` | Viết lại | khung hồ sơ lớp: đầu trang + 3 tab + panel |
| `web/src/modules/classes/DauTrangLop.tsx` | Tạo | hàng tiêu đề, nút, GVCN, dòng GVBM, badge |
| `web/src/modules/classes/SuaThongTinLopPanel.tsx` | Tạo | ngăn "Sửa thông tin lớp" |
| `web/src/modules/classes/TabHocVienLop.tsx` | Tạo | chế độ Điểm / Cần hỗ trợ |
| `web/src/modules/classes/BangDiemLopThuong.tsx` | Tạo | Giữa khoá \| Cuối khoá × L R W S |
| `web/src/modules/classes/BangCanHoTro.tsx` | Tạo | chế độ Cần hỗ trợ |
| `web/src/modules/classes/PhanTichLopTab.tsx` | Tạo | ma trận kỹ năng × đợt |
| `web/src/modules/students/ClassRoster.tsx` | Sửa | chỉ FT; thứ tự L R W1 W2 S; cột ⋯; YT-8; chữ thô `writing` |
| `web/src/modules/classes/ClassIssueBoard.tsx:48-84` | Sửa | bỏ vỏ thu gọn, `export function IssueTable` |
| `web/src/modules/classes/ClassProgressPanel.tsx` | Sửa | prop `tieuDe`, chữ lớp thường, ngày G-6 |
| `web/src/modules/students/IntakePanel.tsx:178, 211-216` | Sửa | Q13: rộng ~1440px, bỏ "mặc định cho cả lô", ngày G-6 |
| `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §4 | Sửa | dòng "Chấm điểm" thêm ⋯ hộp lớp; dòng "Hồ sơ GV" ghi cách bật link |
| `CODE_MAP.md` | Sửa | trỏ file mới |

---

### Task 0: Worktree và mốc xuất phát

**Files:** không sửa file.

- [x] **Step 1:** superpowers:using-git-worktrees — tạo nhánh `pr-qa-hoc-vien-lop` từ `origin/main` mới nhất
  (`git fetch origin && git worktree add ../pisa-pr-qa -b pr-qa-hoc-vien-lop origin/main`, hoặc công cụ `EnterWorktree` rồi đổi
  tên nhánh). **Không checkout nhánh khác trong thư mục chính** (session khác đang làm ở đó). Mọi lệnh sau chạy trong worktree.
- [x] **Step 2: Môi trường sạch biến Turso.**

```bash
node -e "for (const k of ['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BAN_CHINH','PISA_CHO_PHEP_MIGRATE_TURSO','PISA_CHO_PHEP_SEED_TURSO']) if (process.env[k]) { console.error('CÓ BIẾN', k); process.exit(1) } ; console.log('sạch')"
```
Expected: `sạch`.

- [x] **Step 3:** `npm ci` rồi `npm run check`. Ghi vào Nhật ký số phép kiểm (dòng `TẤT CẢ N KIỂM TRA ĐỀU ĐẠT`). Đỏ ngay từ đầu →
  🛑 dừng, báo chủ sản phẩm.
- [x] **Step 4:** `git diff 7843875..HEAD --stat -- web/src/modules/students web/src/modules/classes server/src/classes shared/domain server/src/students/standing.ts index.html web/src/App.tsx`
  — có thay đổi (PR-AN/S2/Pa đã merge?) thì mở lại các file đó đối chiếu số dòng trước khi làm.
- [x] **Step 5:** Đọc: spec §1–§4, §6, §7 dòng Qa; kiểm kê §1.2, §1.6 (K2-6a, YT-8); sáu mockup; bảng Quyết định Q1–Q21 ở trên.
  Thấy Q nào sai đặc tả → 🛑 hỏi trước khi code.

---

### Task 1: G-6 — ngày theo giờ Việt Nam, từ chối ngày không tồn tại (làm ĐẦU TIÊN — PR-Pa dùng hàm này)

**Files:**
- Modify: `shared/domain/display.ts:25-36`
- Modify: `shared/domain/hienThiNgay.ts` (cả file, 36 dòng)
- Modify: `server/src/tests/khung.tests.ts:16`
- Create: `server/src/tests/hocVienLop.tests.ts`
- Modify: `server/src/tests/run.ts` (cuối file, sau khối PR-O, trước `console.log(\`\n${'='.repeat(60)}\`);`)

**Interfaces:**
- Produces: `ngayTheoGioVN(s: string | null | undefined): string | null` — `'YYYY-MM-DD'` theo giờ VN, `null` khi không hợp lệ/không tồn
  tại. Chuỗi có giờ mà không ghi múi giờ (dạng SQLite `2026-09-22 20:00:00`, `nowIso()`) coi là **UTC**.
- `ngay`, `tuanLich`, `tuanKhoa`, `shortDate`, `deadlineView` **giữ nguyên chữ ký**.
- `runHocVienLopTests(t: YThucTestKit): Promise<void>` — các task sau nối thêm `check(...)` vào CUỐI thân hàm này.

- [x] **Step 1: Tạo file phép kiểm (đỏ).** `server/src/tests/hocVienLop.tests.ts`:

```ts
/**
 * PHÉP KIỂM PR-Qa — Học viên & Lớp + Hồ sơ lớp (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §1, §3.6, §3.7, §4, §7 dòng Qa;
 * kiểm kê Q1–Q5, Q10–Q13, K2-6a, YT-8). Tên mỗi phép kiểm bắt đầu bằng "PR-Qa ·".
 *
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Lớp và học viên dùng để đếm do CHÍNH file này tạo
 * (mã lớp "MB-FT QA…", "MB-FOU QA…"), nên số đếm không lẫn dữ liệu demo. Ngày demo cố định TODAY = 2026-09-14 (thứ Hai).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runHocVienLopTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, addDays, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const week: any = await import('../platform/week.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const intake: any = await import('../classes/intake.ts');
  const classes: any = await import('../classes/classes.ts');
  const standingMod: any = await import('../students/standing.ts');
  const violations: any = await import('../yThuc/violations.ts');
  const warn: any = await import('../yThuc/canhBao.ts');
  const casesMod: any = await import('../cases/cases.ts');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  /**
   * Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ (cùng mẹo với luatMayChu.tests.ts).
   * `then` trả `undefined` để `await load(...)` không tưởng đây là promise.
   */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => {
      if (k === 'then') return undefined;
      throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`);
    } }));
  const hvl: any = await load('../classes/hocVienLop.ts');
  const ptl: any = await load('../classes/phanTichLop.ts');
  const ttl: any = await load('../classes/thongTinLop.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
  console.log('\nPR-Qa · Học viên & Lớp + Hồ sơ lớp');

  // ------------------------------------------------------------------ Task 1 · G-6

  check('PR-Qa · G-6 chuỗi có giờ (UTC) đổi sang giờ Việt Nam rồi mới lấy ngày', () => {
    eq(d.ngay('2026-09-22T18:30:00Z', '2026-09-22'), '23/09', '01:30 sáng 23/09 giờ VN');
    eq(d.ngay('2026-09-22T16:59:59Z', '2026-09-22'), '22/09', '23:59:59 giờ VN vẫn là 22/09');
    eq(d.ngay('2026-09-22 20:00:00', '2026-09-22'), '23/09', 'Dạng SQLite (UTC, không ghi múi giờ)');
    eq(d.ngay('2026-09-22T08:00:00+07:00', '2026-09-22'), '22/09', 'Có ghi múi giờ +07:00');
    eq(d.ngay('2026-12-31T17:00:00Z', '2026-09-22'), '01/01/2027', 'Sang năm mới theo giờ VN phải ghi năm');
    eq(d.shortDate('2026-09-22T18:30:00Z', '2026-09-22'), '23/09', 'shortDate (display.ts) cùng luật');
    eq(d.shortDate('2027-01-05', '2026-12-31T18:00:00Z'), '05/01', 'Hôm nay là một mốc giờ: 01/01/2027 giờ VN');
    eq(d.tuanLich('2026-09-27T20:00:00Z', '2026-09-22'), 'W1 OCT', '20:00 UTC Chủ nhật 27/09 = thứ Hai 28/09 giờ VN');
    eq(d.businessDateText('2026-09-14', '2026-09-19T10:20:00Z', '2026-09-19'), 'Ngày nghiệp vụ 14/09 · Ghi nhận 19/09', 'Không đổi');
  });

  check('PR-Qa · G-6 ngày không tồn tại bị từ chối (31/02, 29/02 năm thường, tháng 13, giờ 25)', () => {
    for (const s of ['2026-02-31', '2026-02-29', '2026-13-01', '2026-00-10', '2026-09-31', '2026-09-22T25:00:00Z']) {
      eq(d.ngay(s, '2026-09-22'), '—', `ngay ${s}`);
      eq(d.shortDate(s, '2026-09-22'), '—', `shortDate ${s}`);
      eq(d.tuanLich(s, '2026-09-22'), '—', `tuanLich ${s}`);
    }
    eq(d.ngay('2028-02-29', '2028-01-01'), '29/02', 'Năm nhuận 2028 có 29/02');
    eq(d.ngayTheoGioVN('2026-02-31'), null, 'ngayTheoGioVN từ chối 31/02');
    eq(d.ngayTheoGioVN('2026-09-22'), '2026-09-22', 'ngày trần giữ nguyên');
    assert(/chưa có hạn/.test(d.deadlineView({ kind: 'nhap-diem', due: '2026-02-31', today: '2026-09-14' }).text),
      'Hạn là ngày không tồn tại = chưa có hạn');
  });
}
```

  Nối vào cuối `server/src/tests/run.ts`, **ngay sau** khối PR-O (`await runKhungTests(...)`), **trước**
  `console.log(\`\n${'='.repeat(60)}\`);`:

```ts
// ==================================================================== PR-Qa (Học viên & Lớp + Hồ sơ lớp)

const { runHocVienLopTests } = await import('./hocVienLop.tests.ts');
await runHocVienLopTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```

- [x] **Step 2: Chạy, thấy đỏ.** `npm test 2>&1 | grep -E "PR-Qa|KIỂM TRA|KHÔNG ĐẠT"`
  Expected: hai phép kiểm `PR-Qa · G-6 …` ✗ (vd `'22/09' ≠ '23/09'`, `d.ngayTheoGioVN is not a function`).

- [x] **Step 3: Sửa `shared/domain/display.ts`.** Thay dòng 25 (`const validIso = …`) và hàm `shortDate` (dòng 27-36) bằng:

```ts
/** Ngày theo lịch có thật không — `Date.parse` tự lăn 31/02 thành 03/03 nên không dùng được một mình. */
function ngayCoThat(y: number, m: number, d: number): boolean {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/**
 * NGÀY THẬT CỦA MỘT CHUỖI, THEO GIỜ VIỆT NAM (G-6, nợ sau rà PR-O #58) — `YYYY-MM-DD` hoặc `null`.
 *
 *   ngày trần            giữ nguyên (sau khi kiểm ngày có thật)
 *   có giờ, có múi giờ    đổi về +7 rồi lấy ngày
 *   có giờ, không múi giờ coi là UTC — `nowIso()` và `datetime('now')` của SQLite đều ghi UTC
 *
 * 31/02, 29/02 năm thường, tháng 13, giờ 25 → `null`. Mọi hàm hiện ngày đi qua đây, nên 20:00 UTC ngày 22 hiện là 23/09.
 */
export function ngayTheoGioVN(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(s.trim());
  if (!m) return null;
  const [, y, mo, d, hh, mi, ss, tz] = m;
  if (!ngayCoThat(Number(y), Number(mo), Number(d))) return null;
  if (hh === undefined) return `${y}-${mo}-${d}`;
  const muiGio = !tz || tz === 'Z' ? 'Z' : tz.includes(':') ? tz : `${tz.slice(0, 3)}:${tz.slice(3)}`;
  const t = Date.parse(`${y}-${mo}-${d}T${hh}:${mi}:${ss ?? '00'}${muiGio}`);
  if (Number.isNaN(t)) return null;
  return new Date(t + 7 * 3_600_000).toISOString().slice(0, 10);
}

const validIso = (s: string | null | undefined): s is string => ngayTheoGioVN(s) !== null;

/**
 * NGÀY VIẾT NGẮN: `14/09` khi cùng năm với `today`, `05/01/2027` khi sang năm khác — để một
 * cột ngày không bao giờ khiến người đọc phải đoán năm nào (HE_GIAO_DIEN §2). Cả hai tham số đi qua giờ Việt Nam.
 */
export function shortDate(iso: string | null | undefined, today: string): string {
  const s = ngayTheoGioVN(iso);
  if (!s) return '—';
  const dm = `${s.slice(8, 10)}/${s.slice(5, 7)}`;
  const nam = (ngayTheoGioVN(today) ?? today).slice(0, 4);
  return s.slice(0, 4) === nam ? dm : `${dm}/${s.slice(0, 4)}`;
}
```

  `vietnamDateOf` (cuối file) **giữ nguyên** — `businessDateText` vẫn dùng.

- [x] **Step 4: Thay `shared/domain/hienThiNgay.ts`** (giữ nguyên chú thích đầu file dòng 1-10, thêm một câu vào cuối chú thích:
  ` * Chuỗi có giờ đổi sang giờ Việt Nam trước khi lấy ngày; ngày không tồn tại ra "—" (ngayTheoGioVN, display.ts).`):

```ts
import { ngayTheoGioVN, shortDate } from './display.ts';
import { MONTH_CODE, mondayOfDate, owningMonthOf, weekNumberInMonthOf } from './week.ts';

export function ngay(d: string | null | undefined, homNay?: string | null): string {
  const s = ngayTheoGioVN(d);
  if (!s) return '—';
  if (ngayTheoGioVN(homNay)) return shortDate(s, homNay as string);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
}

export function tuanLich(d: string | null | undefined, homNay?: string | null): string {
  const s = ngayTheoGioVN(d);
  if (!s) return '—';
  const start = mondayOfDate(s);
  const { year, month } = owningMonthOf(start);
  const ma = `W${weekNumberInMonthOf(start)} ${MONTH_CODE[month - 1]}`;
  const h = ngayTheoGioVN(homNay);
  if (!h) return ma;
  return owningMonthOf(mondayOfDate(h)).year === year ? ma : `${ma} ${year}`;
}

export function tuanKhoa(n: number, tong: number): string {
  if (!Number.isInteger(n) || !Number.isInteger(tong) || n < 1 || tong < 1) return '—';
  return `W${n}/${tong}`;
}
```

- [x] **Step 5: Sửa phép kiểm PR-O.** `server/src/tests/khung.tests.ts:16` — thay

```ts
    eq(d.ngay('2026-09-22T10:00:00Z', '2026-01-01'), '22/09', 'Có giờ vẫn chỉ lấy ngày');
```
  bằng
```ts
    eq(d.ngay('2026-09-22T18:30:00Z', '2026-01-01'), '23/09', 'Có giờ (UTC) đổi sang giờ Việt Nam rồi mới lấy ngày');
```

- [x] **Step 6: Chạy, thấy xanh.** `npm test 2>&1 | tail -3` → `TẤT CẢ N+2 KIỂM TRA ĐỀU ĐẠT` (N = mốc Task 0). Phép kiểm cũ của
  `deadlineView`, `shortDate`, `businessDateText` (`run.ts` ~7900-7960) phải vẫn đạt.
- [x] **Step 7:** `npm run check` xanh. Ghi số vào Nhật ký.
- [x] **Step 8: Commit.**

```bash
git add shared/domain/display.ts shared/domain/hienThiNgay.ts server/src/tests/khung.tests.ts server/src/tests/hocVienLop.tests.ts server/src/tests/run.ts
git commit -m "PR-Qa (1): G-6 ngày theo giờ Việt Nam, từ chối ngày không tồn tại (nợ sau rà PR-O)"
```

---

### Task 2: Nợ PR-O — tiêu đề tab trình duyệt và z-index thanh dưới

**Files:**
- Modify: `index.html:7`
- Modify: `web/src/App.tsx:126-127`
- Test: `server/src/tests/hocVienLop.tests.ts`

- [x] **Step 1: Phép kiểm đỏ.** Nối vào cuối thân `runHocVienLopTests`:

```ts
  // ------------------------------------------------------------------ Task 2 · nợ PR-O

  check('PR-Qa · Nợ PR-O: tiêu đề tab trình duyệt "PISA Progress"; thanh dưới điện thoại z-30', () => {
    const html = fsMod.readFileSync(pathMod.join(REPO, 'index.html'), 'utf8');
    assert(/<title>PISA Progress<\/title>/.test(html) && !/Bản demo nội bộ/.test(html), 'index.html còn tiêu đề cũ');
    const app = fsMod.readFileSync(pathMod.join(REPO, 'web/src/App.tsx'), 'utf8');
    const dong = app.split('\n').find((l) => l.includes('md:hidden fixed bottom-0'));
    assert(!!dong && /\bz-30\b/.test(dong) && !/\bz-40\b/.test(dong), `Thanh dưới: ${dong}`);
  });
```

- [x] **Step 2:** `npm test` → phép kiểm này ✗.
- [x] **Step 3:** `index.html:7` → `    <title>PISA Progress</title>` (bắt buộc trước deploy: tab trình duyệt của bản chính không được ghi
  "Bản demo nội bộ").
- [x] **Step 4:** `web/src/App.tsx:126-127` — chú thích và lớp:

```tsx
      {/* Điện thoại: thanh dưới 4 nút (G-11). z-30 — dưới menu tài khoản/thông báo ở đầu trang (z-40), Drawer/Modal (z-50),
          menu ⋯ của dòng (z-[60]) và Toast (z-[100]). */}
      <nav aria-label="Điều hướng chính" className="md:hidden fixed bottom-0 inset-x-0 z-30 flex border-t bg-[color:var(--surface)]"
```
  (dòng `style=…` giữ nguyên; không đổi gì khác ở `App.tsx`.)
- [x] **Step 5:** `npm run check` xanh (N+3).
- [x] **Step 6: Commit.**

```bash
git add index.html web/src/App.tsx server/src/tests/hocVienLop.tests.ts
git commit -m "PR-Qa (2): tiêu đề tab PISA Progress, thanh dưới điện thoại z-30 (nợ sau rà PR-O)"
```

---
### Task 3: Luật thuần của hai màn (`shared/domain/hocVienLop.ts`) + chữ chặng thi lớp thường

**Files:**
- Create: `shared/domain/hocVienLop.ts`
- Modify: `shared/domain/index.ts` (thêm `export * from './hocVienLop.ts';` sau dòng `export * from './dieuHuong.ts';`)
- Modify: `shared/domain/fasttrack.ts:84-88` (`CLASS_PHASE_LABEL`)
- Test: `server/src/tests/hocVienLop.tests.ts`

**Interfaces — Produces (các task sau dùng ĐÚNG tên này):**
- `catDongPhu(s)`, `DONG_PHU_TOI_DA = 60`, `maHocVienNgan(ma)`, `tenKyNang(k)`, `laVaiQuanLy(roles)`
- `LOC_HOC_VIEN`, `type LocHocVien = 'tat-ca'|'sos'|'case_working'|'case_no_plan'|'case_overdue'|'thieu_tt'`,
  `LOC_HOC_VIEN_NHAN: Record<LocHocVien, { nhan; goiY; can: string | null }>`, `docThamSoLoc(view): { loc } | { chuyenDen }`
- `PHAM_VI`, `type PhamVi = 'toi'|'chi-nhanh'|'tat-ca'`, `PHAM_VI_NHAN`, `phamViCoThe({ dayLop, capChiNhanh, toanHeThong, soChiNhanh })`,
  `phamViMacDinh(coThe)`
- `type KetQuaVao`, `type KetQuaHien = { chinh; thieu; dat; sos; phu }`, `ketQuaGanNhat(k: KetQuaVao | null)`
- `khoaLopThuong({ maChuongTrinh, tuanHienTai, tongTuan, tuanKetThuc, tiepTheo, homNay }): { chinh; phu }`
- `type BadgeLop`, `badgeLop({...}): { hien: BadgeLop[]; an: BadgeLop[] }`
- `type NhomGiaoVien`, `nhomGiaoVienBoMon(kyNangLop, phanCong)`
- `type MucMenuDong`, `MUC_MENU_DONG_NHAN`, `MENU_DONG_CHO_PR_LT`, `mucMenuDongHocVien(i, bat?)`
- `type SapXep = 'ten'|'chu-y'`, `type DongDeXep`, `diemChuY`, `sapXepHocVien(rows, cach)`
- `lopMoSan({ thamSoOpen, lopHien, dangLoc }): number[]`
- `type CaseChoViec`, `type ViecTiepTheo = { nhan; tone: 'danger'|'warn'|'info' }`, `viecTiepTheoCua({ nhapDiem, cases, homNay })`,
  `chonCaseChinh(ds)`
- `CO_TRANG_HO_SO_GIAO_VIEN = false`, `duongHoSoGiaoVien(gvId, nguoiXem, coTrang?)`
- `TAB_HO_SO_LOP`, `type TabHoSoLop`, `TAB_HO_SO_LOP_NHAN`, `tabHoSoLop(s)`

- [x] **Step 1: Phép kiểm đỏ.** Nối vào cuối thân `runHocVienLopTests`:

```ts
  // ------------------------------------------------------------------ Task 3 · luật thuần

  check('PR-Qa · Q4 chip lọc: nhãn THUAT_NGU, khoá URL cũ vẫn mở đúng chip, missing_scores sang Test › Cần chấm', () => {
    eq(d.LOC_HOC_VIEN.map((k: string) => d.LOC_HOC_VIEN_NHAN[k].nhan),
      ['Tất cả', 'Đang SOS', 'Có Case đang xử lý', 'Case thiếu PA học thuật', 'Case quá hạn cập nhật', 'Thiếu thông tin'], 'Nhãn chip');
    eq(d.docThamSoLoc(null), { loc: 'tat-ca' }, 'Không có view');
    eq(d.docThamSoLoc('classes'), { loc: 'tat-ca' }, 'view=classes cũ');
    eq(d.docThamSoLoc('sos_open'), { loc: 'sos' }, 'signals.ts dùng sos_open');
    eq(d.docThamSoLoc('case_no_plan'), { loc: 'case_no_plan' }, 'WeeklyBoard');
    eq(d.docThamSoLoc('missing_scores'), { chuyenDen: '/test/can-cham' }, 'Việc nhập điểm nằm ở khu Test');
    eq(d.docThamSoLoc('la'), { loc: 'tat-ca' }, 'Khoá lạ');
  });

  check('PR-Qa · Q3/Q12 Phạm vi: chỉ lựa chọn có nghĩa, mặc định theo vai', () => {
    eq(d.phamViCoThe({ dayLop: true, capChiNhanh: false, toanHeThong: false, soChiNhanh: 0 }), ['toi'], 'GV');
    eq(d.phamViCoThe({ dayLop: false, capChiNhanh: true, toanHeThong: false, soChiNhanh: 1 }), ['chi-nhanh'], 'QL một chi nhánh');
    eq(d.phamViCoThe({ dayLop: true, capChiNhanh: true, toanHeThong: false, soChiNhanh: 2 }), ['toi', 'chi-nhanh', 'tat-ca'], 'QL hai chi nhánh có dạy');
    eq(d.phamViCoThe({ dayLop: false, capChiNhanh: false, toanHeThong: true, soChiNhanh: 0 }), ['chi-nhanh', 'tat-ca'], 'Quản trị');
    eq(d.phamViMacDinh(['toi', 'chi-nhanh']), 'toi', 'Có dạy → Lớp tôi dạy');
    eq(d.phamViMacDinh(['chi-nhanh', 'tat-ca']), 'tat-ca', 'Quản trị → Tất cả');
    eq(d.phamViMacDinh(['chi-nhanh']), 'chi-nhanh', 'QL một chi nhánh');
    eq(d.PHAM_VI_NHAN, { toi: 'Lớp tôi dạy', 'chi-nhanh': 'Chi nhánh', 'tat-ca': 'Tất cả' }, 'Nhãn');
  });

  check('PR-Qa · §3.6 Kết quả gần nhất FT: Overall to + "Thiếu x" + chip SOS; dòng phụ đợt · kỳ vọng · kỹ năng thiếu', () => {
    const ft = { mode: 'ielts_band', attemptLabel: 'MT2', sosLevel: 1, provisional: false, scored: 4, required: 4, failed: null,
      overall: 6.0, expectation: 6.5, belowSkills: [{ skill: 'listening', band: 5.5 }], failedSkills: [] };
    eq(d.ketQuaGanNhat(ft), { chinh: '6.0', thieu: 'Thiếu 0.5', dat: false, sos: 'SOS 1', phu: 'MT2 · kỳ vọng 6.5 · Thiếu L 5.5' }, 'Đủ điểm');
    eq(d.ketQuaGanNhat({ ...ft, overall: null, scored: 2, sosLevel: 2, provisional: true,
      belowSkills: [{ skill: 'writing', band: 5.5 }, { skill: 'speaking', band: 6.0 }] }),
      { chinh: '—', thieu: null, dat: false, sos: 'SOS 2 · tạm thời', phu: 'MT2 · kỳ vọng 6.5 · mới có 2/4 kỹ năng · Thiếu W 5.5, S 6.0' }, 'Tạm thời');
    eq(d.ketQuaGanNhat({ ...ft, overall: 6.5, expectation: 6.0, sosLevel: 0, belowSkills: [] }),
      { chinh: '6.5', thieu: null, dat: true, sos: null, phu: 'MT2 · kỳ vọng 6.0' }, 'Đạt: chỉ ✓ nhỏ');
    eq(d.ketQuaGanNhat(null), { chinh: '—', thieu: null, dat: false, sos: null, phu: 'Chưa có kết quả' }, 'Chưa thi');
  });

  check('PR-Qa · §2/§3.6 Kết quả gần nhất lớp thường: "Đạt 3/4 môn", không "kỳ vọng", không "MT"', () => {
    const th = { mode: 'ratio', attemptLabel: 'Giữa khoá', sosLevel: 1, provisional: false, scored: 4, required: 4, failed: 1,
      overall: null, expectation: null, belowSkills: [], failedSkills: [{ skill: 'writing', score: 12, total: 20 }] };
    const k = d.ketQuaGanNhat(th);
    eq(k, { chinh: 'Đạt 3/4 môn', thieu: null, dat: false, sos: 'SOS 1', phu: 'Giữa khoá · chưa đạt W 12/20' }, 'Đủ điểm');
    eq(d.ketQuaGanNhat({ ...th, attemptLabel: 'Cuối khoá', scored: 2, failed: 0, sosLevel: null, failedSkills: [] }),
      { chinh: 'Đạt 2/2 môn đã chấm', thieu: null, dat: false, sos: null, phu: 'Cuối khoá · còn 2 môn chưa có điểm' }, 'Còn thiếu môn');
    eq(d.ketQuaGanNhat({ ...th, sosLevel: 0, failed: 0, failedSkills: [] }).dat, true, 'Đạt đủ bốn môn');
    assert(!/kỳ vọng|MT\d|Overall|Normal/.test(JSON.stringify(k)), `Chữ FT lọt vào lớp thường: ${JSON.stringify(k)}`);
  });

  check('PR-Qa · §3.6 cột Khoá lớp thường "FOU · W8/8" + "kết thúc W4 SEP"; "tiếp theo: …" chỉ khi đã ghi', () => {
    const k = { maChuongTrinh: 'FOU', tuanHienTai: 8, tongTuan: 8, tuanKetThuc: '2026-09-21', tiepTheo: null, homNay: '2026-09-14' };
    eq(d.khoaLopThuong(k), { chinh: 'FOU · W8/8', phu: 'kết thúc W4 SEP' }, 'Tuần cuối');
    eq(d.khoaLopThuong({ ...k, tuanHienTai: 10 }).chinh, 'FOU · W8/8', 'Quá số tuần vẫn ghi W8/8');
    eq(d.khoaLopThuong({ ...k, tuanHienTai: 0 }).chinh, 'FOU · chưa khai giảng', 'Chưa khai giảng');
    eq(d.khoaLopThuong({ ...k, tiepTheo: 'Fast Track' }).phu, 'tiếp theo: Fast Track', 'Đã ghi lộ trình tiếp theo (PR-LT)');
  });

  check('PR-Qa · Q7 hộp lớp: tối đa 2 badge theo thứ tự ưu tiên, phần còn lại gom "+n"', () => {
    const b = d.badgeLop({ needsPlacement: true, studentCount: 4, missingSkills: ['writing'], needScoresText: 'Lớp còn 3 bài chưa nhập điểm',
      soCaseMo: 2, phase: 'final_week', missingCount: 1 });
    eq(b.hien.map((x: any) => x.nhan), ['Hết khoá · 4 HV cần xếp lớp tiếp', 'Thiếu GV W'], 'Hai badge đầu');
    eq(b.an.map((x: any) => x.key), ['cham', 'case', 'chang', 'thieu-tt'], 'Phần gom');
    const c = d.badgeLop({ needsPlacement: false, studentCount: 8, missingSkills: [], needScoresText: null, soCaseMo: 6, phase: 'running', missingCount: 0 });
    eq(c.hien, [{ key: 'case', nhan: '6 Case đang mở', tone: 'danger' }], 'Chỉ Case');
    assert(!/Progress|Final/.test(Object.values(d.CLASS_PHASE_LABEL).join(' ')), 'CLASS_PHASE_LABEL còn Progress/Final');
    eq(d.CLASS_PHASE_LABEL.progress_week, 'Thi Giữa khoá tuần này', 'Chữ chặng thi');
  });

  check('PR-Qa · §3.7 dòng GV bộ môn gom theo người ("L · R Trần Ngọc Hà"), kỹ năng thiếu người ghi "Chưa phân công"', () => {
    const n = d.nhomGiaoVienBoMon(['listening', 'reading', 'writing1', 'writing2', 'speaking'], [
      { skill: 'listening', id: 7, name: 'Trần Ngọc Hà' }, { skill: 'reading', id: 7, name: 'Trần Ngọc Hà' },
      { skill: 'writing1', id: 8, name: 'Lê Minh Khoa' }, { skill: 'speaking', id: 9, name: 'Phạm Thu Trang' }]);
    eq(n.map((g: any) => `${g.nhan}|${g.ten}|${g.id}`), ['L · R|Trần Ngọc Hà|7', 'W1|Lê Minh Khoa|8', 'W2|Chưa phân công|null', 'S|Phạm Thu Trang|9'], 'Nhóm');
    eq(n[0].title, 'Listening · Reading', 'Tooltip tên đầy đủ (G-7)');
  });

  check('PR-Qa · Q1 menu ⋯ dòng học viên: Lộ trình tiếp theo và Chuyển lớp ẩn tới PR-LT', () => {
    const q = { laLopThuong: true, dangHoc: true, coTheGhiViPham: true, coTheBaoCase: true, coTheNhapDiem: true, coTheSuaHocVien: true, coTheChuyenLop: true };
    eq(d.mucMenuDongHocVien(q), ['ho-so', 'vi-pham', 'case', 'nhap-diem'], 'Mặc định');
    eq(d.MENU_DONG_CHO_PR_LT, { loTrinhTiepTheo: false, chuyenLop: false }, 'Hằng PR-LT bật');
    eq(d.mucMenuDongHocVien(q, { loTrinhTiepTheo: true, chuyenLop: true }), ['ho-so', 'vi-pham', 'case', 'nhap-diem', 'lo-trinh-tiep', 'chuyen-lop'], 'PR-LT bật');
    eq(d.mucMenuDongHocVien({ ...q, laLopThuong: false }, { loTrinhTiepTheo: true, chuyenLop: true }).includes('lo-trinh-tiep'), false, 'FT không có Lộ trình tiếp theo');
    eq(d.mucMenuDongHocVien({ ...q, dangHoc: false }), ['ho-so'], 'Em đã kết thúc: chỉ Hồ sơ');
    eq(d.mucMenuDongHocVien({ ...q, coTheGhiViPham: false, coTheNhapDiem: false }), ['ho-so', 'case'], 'Theo quyền');
    eq(d.MUC_MENU_DONG_NHAN['vi-pham'], '+ Ghi nhận vi phạm', 'Chữ');
  });

  check('PR-Qa · §3.6 xếp A→Z hoặc "Cần chú ý trước"; lớp mở sẵn', () => {
    const r = [
      { ten: 'Nguyễn Minh An', quaHan: false, canhBao: false, sosLevel: 0, soCaseMo: 0 },
      { ten: 'Bùi Thảo Vy', quaHan: false, canhBao: false, sosLevel: 2, soCaseMo: 1 },
      { ten: 'Đỗ Minh Khôi', quaHan: true, canhBao: false, sosLevel: 1, soCaseMo: 2 },
    ];
    eq(d.sapXepHocVien(r, 'ten').map((x: any) => x.ten), ['Bùi Thảo Vy', 'Đỗ Minh Khôi', 'Nguyễn Minh An'], 'A→Z tiếng Việt');
    eq(d.sapXepHocVien(r, 'chu-y').map((x: any) => x.ten), ['Đỗ Minh Khôi', 'Bùi Thảo Vy', 'Nguyễn Minh An'], 'Quá hạn trước, rồi mức SOS');
    eq(d.lopMoSan({ thamSoOpen: null, lopHien: [3, 5, 7], dangLoc: false }), [3], 'Mở lớp đầu tiên');
    eq(d.lopMoSan({ thamSoOpen: null, lopHien: [3, 5, 7], dangLoc: true }), [3, 5, 7], 'Đang lọc: mở các lớp còn hiện');
    eq(d.lopMoSan({ thamSoOpen: [], lopHien: [3, 5], dangLoc: false }), [], 'Người dùng đã đóng hết');
    eq(d.lopMoSan({ thamSoOpen: [5, 9], lopHien: [3, 5], dangLoc: false }), [5], 'Theo URL, bỏ lớp không còn hiện');
  });

  check('PR-Qa · Q13 việc tiếp theo: nhập điểm + việc của Case, quá hạn lên đầu, chữ hạn trùng <Han>', () => {
    const v = d.viecTiepTheoCua({
      nhapDiem: { kyNang: ['listening', 'writing'], dot: 'Giữa khoá', quaHan: false },
      cases: [
        { id: 1, topic: 'writing2', state: 'no_plan', nextDue: null, dueOverdue: false },
        { id: 2, topic: 'listening', state: 'working', nextDue: '2026-09-13', dueOverdue: true },
        { id: 3, topic: 'reading', state: 'working', nextDue: '2026-09-20', dueOverdue: false },
        { id: 4, topic: 'speaking', state: 'working', nextDue: null, dueOverdue: false },
      ],
      homNay: '2026-09-14',
    });
    eq(v, [
      { nhan: 'L · Cập nhật kết quả · trước CN 13/09 · quá hạn', tone: 'danger' },
      { nhan: 'Nhập điểm L, W · Giữa khoá', tone: 'warn' },
      { nhan: 'Xác định nguyên nhân W2', tone: 'warn' },
      { nhan: 'R · Cập nhật kết quả · trước CN 20/09', tone: 'info' },
    ], 'Thứ tự và chữ');
    eq(d.chonCaseChinh([
      { id: 5, topic: 'reading', state: 'working', nextDue: null, dueOverdue: false, sosLevel: 3 },
      { id: 6, topic: 'listening', state: 'no_plan', nextDue: null, dueOverdue: false, sosLevel: 1 },
      { id: 7, topic: 'speaking', state: 'done', nextDue: null, dueOverdue: true, sosLevel: 3 },
    ]).id, 6, 'Case chưa có PA học thuật trước Case đang chạy; Case đã xong không tính');
  });

  check('PR-Qa · Q2 tên GV chưa là link khi chưa có trang hồ sơ GV; GV chỉ xem được hồ sơ của chính mình', () => {
    eq(d.CO_TRANG_HO_SO_GIAO_VIEN, false, 'PR-GV bật');
    eq(d.duongHoSoGiaoVien(7, { userId: 1, laQuanLy: true }), null, 'Chưa có trang → không link');
    eq(d.duongHoSoGiaoVien(7, { userId: 1, laQuanLy: true }, true), '/giao-vien/7', 'QL');
    eq(d.duongHoSoGiaoVien(7, { userId: 9, laQuanLy: false }, true), null, 'GV xem đồng nghiệp');
    eq(d.duongHoSoGiaoVien(9, { userId: 9, laQuanLy: false }, true), '/giao-vien/9', 'GV xem chính mình');
    eq(d.laVaiQuanLy(['teacher']), false, 'GV');
    eq(d.laVaiQuanLy(['manager']), true, 'QL');
  });

  check('PR-Qa · Q4 hồ sơ lớp 3 tab, không còn tab Giáo viên; mã học viên 6 số; dòng phụ ≤ 60 ký tự', () => {
    eq(d.TAB_HO_SO_LOP.map((k: string) => d.TAB_HO_SO_LOP_NHAN[k]), ['Học viên', 'Ý thức & Phối hợp', 'Phân tích lớp'], 'Tab');
    eq(d.tabHoSoLop('giao-vien'), 'hoc-vien', 'Link cũ tab Giáo viên về tab Học viên');
    eq(d.tabHoSoLop('phan-tich'), 'phan-tich', 'Tab Phân tích lớp');
    eq(d.maHocVienNgan('PISA-000011'), '000011', 'Mã có tiền tố');
    eq(d.maHocVienNgan('PISA-QA-3'), '000003', 'Đệm đủ 6 số');
    eq(d.catDongPhu('x'.repeat(70)).length, 60, 'G-3');
  });
```

- [x] **Step 2:** `npm test 2>&1 | grep -E "PR-Qa|KIỂM TRA"` → 12 phép kiểm mới ✗ (`is not a function` / `undefined`).

- [x] **Step 3: Tạo `shared/domain/hocVienLop.ts`:**

```ts
/**
 * HỌC VIÊN & LỚP + HỒ SƠ LỚP — luật hiển thị thuần (PR-Qa; đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §2, §3.6, §3.7, §4).
 *
 * Mọi quyết định "hiện chữ gì, hiện mấy cái, xếp thế nào" của hai màn nằm ở đây để kiểm được bằng harness máy chủ (web không có bộ
 * kiểm thử). Component React chỉ vẽ.
 */
import { ENTRY_SKILL_LABEL, type EntrySkill } from './skills.ts';
import { REGULAR_SKILL_LABEL, skillShort } from './normal.ts';
import { deadlineView } from './display.ts';
import { tuanKhoa, tuanLich } from './hienThiNgay.ts';
import { CLASS_PHASE_LABEL, type ClassPhase } from './fasttrack.ts';

// ---------------------------------------------------------------- chung

/** Dòng phụ tối đa ~60 ký tự (G-3). Dài hơn thì cắt và thêm "…" — đủ câu nằm ở tooltip của ô. */
export const DONG_PHU_TOI_DA = 60;
export function catDongPhu(s: string): string {
  return s.length <= DONG_PHU_TOI_DA ? s : `${s.slice(0, DONG_PHU_TOI_DA - 1)}…`;
}

/** Mã học viên viết gọn 6 số, chữ mờ (§3.6). Mã không có chữ số thì giữ nguyên. */
export function maHocVienNgan(ma: string | null | undefined): string {
  const so = (ma ?? '').replace(/\D/g, '');
  return so ? so.slice(-6).padStart(6, '0') : (ma ?? '');
}

/** Tên đầy đủ của một kỹ năng/môn — tooltip của chữ viết tắt (G-7). */
export function tenKyNang(k: string): string {
  return ENTRY_SKILL_LABEL[k as EntrySkill] ?? REGULAR_SKILL_LABEL[k as keyof typeof REGULAR_SKILL_LABEL] ?? k;
}

export function laVaiQuanLy(roles: readonly string[] | null | undefined): boolean {
  return (roles ?? []).some((r) => r === 'system_admin' || r === 'manager');
}

// ---------------------------------------------------------------- chip lọc (§3.6, Q4)

export const LOC_HOC_VIEN = ['tat-ca', 'sos', 'case_working', 'case_no_plan', 'case_overdue', 'thieu_tt'] as const;
export type LocHocVien = (typeof LOC_HOC_VIEN)[number];
export const LOC_HOC_VIEN_NHAN: Record<LocHocVien, { nhan: string; goiY: string; can: string | null }> = {
  'tat-ca': { nhan: 'Tất cả', goiY: 'Mọi học viên đang học trong các lớp đang hiện.', can: null },
  sos: { nhan: 'Đang SOS', goiY: 'Kết quả Test gần nhất ở mức SOS 1, 2 hoặc 3.', can: 'case.view' },
  case_working: { nhan: 'Có Case đang xử lý', goiY: 'Có Case đã có PA học thuật và đang theo dõi.', can: 'case.view' },
  case_no_plan: { nhan: 'Case thiếu PA học thuật', goiY: 'Có Case đang mở mà chưa có PA học thuật.', can: 'case.view' },
  case_overdue: { nhan: 'Case quá hạn cập nhật', goiY: 'Có Case đã qua hạn cập nhật kết quả mà chưa ai ghi.', can: 'case.view' },
  thieu_tt: { nhan: 'Thiếu thông tin', goiY: 'Hồ sơ còn thiếu thông tin cần để xếp lịch và theo dõi.', can: null },
};

export type DocLoc = { loc: LocHocVien } | { chuyenDen: string };
/** Khoá `view=` trên URL — giữ khoá cũ để link đã lưu, BranchPulse, WeeklyBoard, signals.ts vẫn mở đúng chip. */
export function docThamSoLoc(view: string | null | undefined): DocLoc {
  if (view === 'sos' || view === 'sos_open') return { loc: 'sos' };
  if (view === 'case_working' || view === 'case_no_plan' || view === 'case_overdue' || view === 'thieu_tt') return { loc: view };
  if (view === 'missing_scores') return { chuyenDen: '/test/can-cham' };
  return { loc: 'tat-ca' };
}

// ---------------------------------------------------------------- phạm vi (§3.6, Q3)

export const PHAM_VI = ['toi', 'chi-nhanh', 'tat-ca'] as const;
export type PhamVi = (typeof PHAM_VI)[number];
export const PHAM_VI_NHAN: Record<PhamVi, string> = { toi: 'Lớp tôi dạy', 'chi-nhanh': 'Chi nhánh', 'tat-ca': 'Tất cả' };

/** Chỉ lựa chọn có nghĩa: QL một chi nhánh thì "Tất cả" trùng "Chi nhánh" nên không có. */
export function phamViCoThe(i: { dayLop: boolean; capChiNhanh: boolean; toanHeThong: boolean; soChiNhanh: number }): PhamVi[] {
  const out: PhamVi[] = [];
  if (i.dayLop) out.push('toi');
  if (i.capChiNhanh || i.toanHeThong) out.push('chi-nhanh');
  if (i.toanHeThong || i.soChiNhanh > 1) out.push('tat-ca');
  return out.length ? out : ['tat-ca'];
}
export function phamViMacDinh(coThe: readonly PhamVi[]): PhamVi {
  if (coThe.includes('toi')) return 'toi';
  if (coThe.includes('tat-ca')) return 'tat-ca';
  return coThe[0] ?? 'tat-ca';
}

// ---------------------------------------------------------------- kết quả gần nhất (§3.6, 07c A, Q11)

/** Đúng các trường `Standing` (server/src/students/standing.ts) mà cột này đọc. */
export type KetQuaVao = {
  mode: 'ielts_band' | 'ratio' | null;
  attemptLabel: string | null;
  sosLevel: number | null; provisional: boolean;
  scored: number; required: number; failed: number | null;
  overall: number | null; expectation: number | null;
  belowSkills: { skill: string; band: number }[];
  failedSkills: { skill: string; score: number; total: number }[];
};
export type KetQuaHien = { chinh: string; thieu: string | null; dat: boolean; sos: string | null; phu: string | null };

const band1 = (n: number) => n.toFixed(1);

export function ketQuaGanNhat(k: KetQuaVao | null): KetQuaHien {
  if (!k || !k.attemptLabel) return { chinh: '—', thieu: null, dat: false, sos: null, phu: 'Chưa có kết quả' };
  const sos = k.sosLevel !== null && k.sosLevel > 0 ? `SOS ${k.sosLevel}${k.provisional ? ' · tạm thời' : ''}` : null;
  const dat = k.sosLevel === 0 && !k.provisional;
  if (k.mode === 'ratio') {
    const soDat = k.scored - (k.failed ?? 0);
    const chinh = k.scored < k.required ? `Đạt ${soDat}/${k.scored} môn đã chấm` : `Đạt ${soDat}/${k.required} môn`;
    const truot = k.failedSkills.map((f) => `${skillShort(f.skill)} ${f.score}/${f.total}`).join(', ');
    const phu = [k.attemptLabel, truot ? `chưa đạt ${truot}` : null,
      k.scored < k.required ? `còn ${k.required - k.scored} môn chưa có điểm` : null].filter(Boolean).join(' · ');
    return { chinh, thieu: null, dat: dat && k.scored === k.required, sos, phu: catDongPhu(phu) };
  }
  const chinh = k.overall !== null ? band1(k.overall) : '—';
  const thieu = k.overall !== null && k.expectation !== null && k.overall < k.expectation
    ? `Thiếu ${band1(k.expectation - k.overall)}` : null;
  const phu: string[] = [k.attemptLabel];
  if (k.expectation !== null) phu.push(`kỳ vọng ${band1(k.expectation)}`);
  if (k.scored < k.required) phu.push(`mới có ${k.scored}/${k.required} kỹ năng`);
  if (k.belowSkills.length) phu.push(`Thiếu ${k.belowSkills.map((b) => `${skillShort(b.skill)} ${band1(b.band)}`).join(', ')}`);
  return { chinh, thieu, dat, sos, phu: catDongPhu(phu.join(' · ')) };
}

// ---------------------------------------------------------------- cột Khoá lớp thường (§3.6, Q21)

export function khoaLopThuong(i: {
  maChuongTrinh: string | null; tuanHienTai: number | null; tongTuan: number | null;
  tuanKetThuc: string | null; tiepTheo: string | null; homNay: string;
}): { chinh: string; phu: string | null } {
  const ma = i.maChuongTrinh ?? '—';
  let tuan: string | null = null;
  if (i.tuanHienTai !== null && i.tuanHienTai < 1) tuan = 'chưa khai giảng';
  else if (i.tuanHienTai !== null && i.tongTuan) tuan = tuanKhoa(Math.min(i.tuanHienTai, i.tongTuan), i.tongTuan);
  const phu = i.tiepTheo ? `tiếp theo: ${i.tiepTheo}` : i.tuanKetThuc ? `kết thúc ${tuanLich(i.tuanKetThuc, i.homNay)}` : null;
  return { chinh: tuan ? `${ma} · ${tuan}` : ma, phu };
}

// ---------------------------------------------------------------- badge hộp lớp / đầu hồ sơ lớp (Q5, Q7)

export type BadgeLop = {
  key: 'het-khoa' | 'thieu-gv' | 'cham' | 'case' | 'chang' | 'thieu-tt'; nhan: string; tone: 'danger' | 'warn' | 'info';
};
const CHANG_THI = ['progress_soon', 'progress_week', 'final_soon', 'final_week'];

export function badgeLop(c: {
  needsPlacement: boolean; studentCount: number; missingSkills: readonly string[]; needScoresText: string | null;
  soCaseMo: number; phase: string; missingCount: number;
}): { hien: BadgeLop[]; an: BadgeLop[] } {
  const all: BadgeLop[] = [];
  if (c.needsPlacement) all.push({ key: 'het-khoa', nhan: `Hết khoá · ${c.studentCount} HV cần xếp lớp tiếp`, tone: 'danger' });
  if (c.missingSkills.length) all.push({ key: 'thieu-gv', nhan: `Thiếu GV ${c.missingSkills.map(skillShort).join(', ')}`, tone: 'warn' });
  if (c.needScoresText) all.push({ key: 'cham', nhan: c.needScoresText, tone: 'warn' });
  if (c.soCaseMo > 0) all.push({ key: 'case', nhan: `${c.soCaseMo} Case đang mở`, tone: 'danger' });
  if (CHANG_THI.includes(c.phase)) all.push({ key: 'chang', nhan: CLASS_PHASE_LABEL[c.phase as ClassPhase], tone: 'info' });
  if (c.missingCount > 0) all.push({ key: 'thieu-tt', nhan: `Thiếu ${c.missingCount} thông tin`, tone: 'warn' });
  return { hien: all.slice(0, 2), an: all.slice(2) };
}

// ---------------------------------------------------------------- dòng GV bộ môn (06c §1)

export type NhomGiaoVien = { id: number | null; ten: string; kyNang: string[]; nhan: string; title: string };
export function nhomGiaoVienBoMon(
  kyNangLop: readonly string[], phanCong: readonly { skill: string; id: number; name: string }[],
): NhomGiaoVien[] {
  const nhom: NhomGiaoVien[] = [];
  const theoKhoa = new Map<string, NhomGiaoVien>();
  for (const k of kyNangLop) {
    const pc = phanCong.find((x) => x.skill === k) ?? null;
    const khoa = pc ? `gv-${pc.id}` : 'chua';
    let g = theoKhoa.get(khoa);
    if (!g) {
      g = { id: pc?.id ?? null, ten: pc?.name ?? 'Chưa phân công', kyNang: [], nhan: '', title: '' };
      theoKhoa.set(khoa, g);
      nhom.push(g);
    }
    g.kyNang.push(k);
  }
  for (const g of nhom) {
    g.nhan = g.kyNang.map(skillShort).join(' · ');
    g.title = g.kyNang.map(tenKyNang).join(' · ');
  }
  return nhom;
}

// ---------------------------------------------------------------- menu ⋯ dòng học viên (§3.7, §4, Q1)

export type MucMenuDong = 'ho-so' | 'vi-pham' | 'case' | 'nhap-diem' | 'lo-trinh-tiep' | 'chuyen-lop';
export const MUC_MENU_DONG_NHAN: Record<MucMenuDong, string> = {
  'ho-so': 'Hồ sơ', 'vi-pham': '+ Ghi nhận vi phạm', case: '+ Case', 'nhap-diem': 'Nhập điểm',
  'lo-trinh-tiep': 'Lộ trình tiếp theo', 'chuyen-lop': 'Chuyển lớp',
};
/**
 * Hai mục thuộc PR-LT (đợt 5). Chưa có màn làm việc đúng luật §3.9 thì KHÔNG hiện (không để nút bấm không làm gì, không để GVCN
 * bấm ra lỗi quyền). PR-LT đổi hằng này thành `true` và gắn panel trong `web/src/modules/classes/thaoTacDongHocVien.tsx`.
 */
export const MENU_DONG_CHO_PR_LT = { loTrinhTiepTheo: false, chuyenLop: false } as const;

export function mucMenuDongHocVien(i: {
  laLopThuong: boolean; dangHoc: boolean; coTheGhiViPham: boolean; coTheBaoCase: boolean;
  coTheNhapDiem: boolean; coTheSuaHocVien: boolean; coTheChuyenLop: boolean;
}, bat: { loTrinhTiepTheo: boolean; chuyenLop: boolean } = MENU_DONG_CHO_PR_LT): MucMenuDong[] {
  const out: MucMenuDong[] = ['ho-so'];
  if (!i.dangHoc) return out;
  if (i.coTheGhiViPham) out.push('vi-pham');
  if (i.coTheBaoCase) out.push('case');
  if (i.coTheNhapDiem) out.push('nhap-diem');
  if (bat.loTrinhTiepTheo && i.laLopThuong && i.coTheSuaHocVien) out.push('lo-trinh-tiep');
  if (bat.chuyenLop && i.coTheChuyenLop) out.push('chuyen-lop');
  return out;
}

// ---------------------------------------------------------------- sắp xếp, lớp mở sẵn (§3.6, Q19)

export type SapXep = 'ten' | 'chu-y';
export type DongDeXep = { ten: string; quaHan: boolean; canhBao: boolean; sosLevel: number | null; soCaseMo: number };
export function diemChuY(r: DongDeXep): number {
  return (r.quaHan ? 1000 : 0) + (r.canhBao ? 500 : 0) + (r.sosLevel ?? 0) * 100 + r.soCaseMo;
}
export function sapXepHocVien<T extends DongDeXep>(rows: readonly T[], cach: SapXep): T[] {
  const theoTen = (a: T, b: T) => a.ten.localeCompare(b.ten, 'vi');
  return [...rows].sort(cach === 'ten' ? theoTen : (a, b) => diemChuY(b) - diemChuY(a) || theoTen(a, b));
}

export function lopMoSan(i: { thamSoOpen: number[] | null; lopHien: number[]; dangLoc: boolean }): number[] {
  if (i.thamSoOpen !== null) return i.thamSoOpen.filter((id) => i.lopHien.includes(id));
  return i.dangLoc ? i.lopHien.slice(0, 5) : i.lopHien.slice(0, 1);
}

// ---------------------------------------------------------------- việc tiếp theo (Q13)

export type CaseChoViec = {
  id?: number; topic: string | null; state: string; nextDue: string | null; dueOverdue: boolean; sosLevel?: number | null;
};
export type ViecTiepTheo = { nhan: string; tone: 'danger' | 'warn' | 'info' };

const nhanKyNang = (topic: string | null) => (topic ? skillShort(topic) : 'Case');

export function viecTiepTheoCua(i: {
  nhapDiem: { kyNang: string[]; dot: string | null; quaHan: boolean } | null;
  cases: readonly CaseChoViec[];
  homNay: string;
}): ViecTiepTheo[] {
  const out: ViecTiepTheo[] = [];
  if (i.nhapDiem && i.nhapDiem.kyNang.length) {
    out.push({
      nhan: `Nhập điểm ${i.nhapDiem.kyNang.map(skillShort).join(', ')}${i.nhapDiem.dot ? ` · ${i.nhapDiem.dot}` : ''}`,
      tone: i.nhapDiem.quaHan ? 'danger' : 'warn',
    });
  }
  for (const c of i.cases) {
    if (c.state === 'done') continue;
    if (c.state === 'no_plan') { out.push({ nhan: `Xác định nguyên nhân ${nhanKyNang(c.topic)}`, tone: 'warn' }); continue; }
    if (!c.nextDue) continue;
    /* Cùng câu với <Han loai="cap-nhat-pa"> (G-10): một hàm `deadlineView` cho mọi chỗ hiện hạn. */
    const v = deadlineView({ kind: 'cap-nhat-pa', due: c.nextDue, today: i.homNay });
    out.push({ nhan: `${nhanKyNang(c.topic)} · ${v.text}`, tone: v.tone === 'overdue' ? 'danger' : 'info' });
  }
  const hang = { danger: 0, warn: 1, info: 2 } as const;
  return out.map((v, idx) => ({ v, idx })).sort((a, b) => hang[a.v.tone] - hang[b.v.tone] || a.idx - b.idx).map((x) => x.v);
}

/** Case nói trước ở chế độ "Cần hỗ trợ": quá hạn cập nhật → chưa có PA học thuật → mức SOS cao. */
export function chonCaseChinh<T extends CaseChoViec>(ds: readonly T[]): T | null {
  const mo = ds.filter((c) => c.state !== 'done');
  if (!mo.length) return null;
  const hang = (c: T) => (c.dueOverdue ? 0 : c.state === 'no_plan' ? 1 : 2);
  return [...mo].sort((a, b) => hang(a) - hang(b) || (b.sosLevel ?? 0) - (a.sosLevel ?? 0) || (a.id ?? 0) - (b.id ?? 0))[0];
}

// ---------------------------------------------------------------- hồ sơ giáo viên (§3.12, Q2)

/** PR-GV (đợt 5) dựng trang `/giao-vien/:id` rồi đổi hằng này thành `true`. Trước đó tên GV là chữ thường — không link chết. */
export const CO_TRANG_HO_SO_GIAO_VIEN = false;
export function duongHoSoGiaoVien(
  gvId: number | null, nguoiXem: { userId: number; laQuanLy: boolean }, coTrang: boolean = CO_TRANG_HO_SO_GIAO_VIEN,
): string | null {
  if (!coTrang || gvId === null) return null;
  if (!nguoiXem.laQuanLy && nguoiXem.userId !== gvId) return null;
  return `/giao-vien/${gvId}`;
}

// ---------------------------------------------------------------- tab hồ sơ lớp (§3.7)

export const TAB_HO_SO_LOP = ['hoc-vien', 'y-thuc', 'phan-tich'] as const;
export type TabHoSoLop = (typeof TAB_HO_SO_LOP)[number];
export const TAB_HO_SO_LOP_NHAN: Record<TabHoSoLop, string> = {
  'hoc-vien': 'Học viên', 'y-thuc': 'Ý thức & Phối hợp', 'phan-tich': 'Phân tích lớp',
};
export function tabHoSoLop(s: string | null | undefined): TabHoSoLop {
  return (TAB_HO_SO_LOP as readonly string[]).includes(s ?? '') ? (s as TabHoSoLop) : 'hoc-vien';
}
```

- [x] **Step 4:** `shared/domain/fasttrack.ts:84-88` — đổi chữ (giữ khoá):

```ts
  progress_soon: 'Tuần sau thi Giữa khoá',
  progress_week: 'Thi Giữa khoá tuần này',
  final_soon: 'Tuần sau thi Cuối khoá',
  final_week: 'Thi Cuối khoá tuần này',
  finished: 'Đã hết khoá',
```
  Kiểm: `grep -rn "Đã hết chương trình\|Progress Test tuần này\|Final Test tuần này" server/src/tests web/src shared` → không còn phép
  kiểm nào đòi chữ cũ. Phép kiểm `run.ts:4133` (`pr.label.includes('tuần')`) vẫn đạt.
- [x] **Step 5:** thêm `export * from './hocVienLop.ts';` vào `shared/domain/index.ts` sau `export * from './dieuHuong.ts';`.
- [x] **Step 6:** `npm test` → mọi `PR-Qa ·` xanh (N+15). `npm run check` xanh. Ghi Nhật ký.
- [x] **Step 7: Commit.**

```bash
git add shared/domain/hocVienLop.ts shared/domain/index.ts shared/domain/fasttrack.ts server/src/tests/hocVienLop.tests.ts
git commit -m "PR-Qa (3): luật thuần Học viên & Lớp + hồ sơ lớp (chip, phạm vi, kết quả, khoá, badge, menu dòng, việc tiếp theo)"
```

---

### Task 4: `Standing` mang Overall, kỳ vọng của đợt và kỹ năng/môn chưa đạt

**Files:**
- Modify: `server/src/students/standing.ts` (kiểu `Standing` dòng 34-70, `EMPTY` dòng 102-108, vòng lặp dòng 218-234)
- Test: `server/src/tests/hocVienLop.tests.ts`

**Interfaces:**
- Produces: `Standing` thêm `overall: number | null`, `expectation: number | null`, `belowSkills: { skill: string; band: number }[]`
  (FT, kỹ năng ĐÁNH GIÁ `listening|reading|writing|speaking` dưới kỳ vọng), `failedSkills: { skill; score; total }[]` (lớp thường).
  Khớp `KetQuaVao` của Task 3 → web đưa thẳng `row.standing` vào `ketQuaGanNhat`.
- Test helpers (các task sau dùng): `taoLop(code, kind)`, `taoHocVien({ cid, ft, target?, ten? })`, `themLuot({ sid, cid, cycleId, no, kind, weekStart })`,
  `bandFT(attemptId, bands)`, `diemThuong(attemptId, diem)`, hằng `MB` (id chi nhánh MB).

- [x] **Step 1: Helper + phép kiểm đỏ.** Nối vào cuối thân `runHocVienLopTests`:

```ts
  // ------------------------------------------------------------------ helper dữ liệu riêng của PR-Qa

  const NOW = new Date().toISOString();
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  let soThuTu = 0;
  const taoLop = (code: string, kind: 'FT' | 'FOU'): number =>
    (intake.createClass(P.admin, { code, branchId: MB, kind, isFastTrack: kind === 'FT', startDate: '2026-08-03' }) as any).id as number;
  function taoHocVien(o: { cid: number; ft: boolean; target?: number; ten?: string }): { sid: number; cycleId: number } {
    soThuTu += 1;
    const tag = `QA-${soThuTu}`;
    const ten = o.ten ?? `Hoc vien ${tag}`;
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, ten, ten.toLowerCase(), MB, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-08-03', ?)`)
      .run(sid, o.cid, NOW);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at)
       VALUES (?, 1, ?, ?, ?, '2026-08-03', 'active', ?)`,
    ).run(sid, o.ft ? 'LT1' : null, o.ft ? null : 'FOU', o.target ?? null, NOW).lastInsertRowid);
    return { sid, cycleId };
  }
  function themLuot(o: { sid: number; cid: number; cycleId: number; no: number; kind: 'mock' | 'progress' | 'final'; weekStart: string }): number {
    const periodId = week.ensurePeriod(o.weekStart).id;
    const id = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,?,?,?,?, 'planned', ?)`,
    ).run(o.cycleId, o.sid, o.no, o.kind, o.cid, periodId, NOW).lastInsertRowid);
    skillSchedule.ensureSkillRows(id);
    return id;
  }
  const bandFT = (attemptId: number, bands: Record<string, number>) => {
    for (const [k, b] of Object.entries(bands)) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_by, entered_at) VALUES (?,?,?,?,?)`)
        .run(attemptId, k, b, P.admin.userId, NOW);
    }
  };
  const diemThuong = (attemptId: number, diem: Record<string, [number, number]>) => {
    for (const [k, [s, tong]] of Object.entries(diem)) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_by, entered_at) VALUES (?,?,?,?,?,?)`)
        .run(attemptId, k, s, tong, P.admin.userId, NOW);
    }
  };
  const LOP_FT = taoLop('MB-FT QA1', 'FT');
  const LOP_THUONG = taoLop('MB-FOU QA1', 'FOU');

  // ------------------------------------------------------------------ Task 4 · Standing

  check('PR-Qa · §3.6 FT: standingFor trả Overall, kỳ vọng CỦA ĐỢT ĐÓ và kỹ năng dưới kỳ vọng', () => {
    const a = taoHocVien({ cid: LOP_FT, ft: true, target: 6.5 });
    const at = themLuot({ ...a, cid: LOP_FT, no: 2, kind: 'mock', weekStart: '2026-09-07' });
    bandFT(at, { listening: 5.0, reading: 6.0, writing1: 6.0, writing2: 6.0, speaking: 6.0 });
    const s = standingMod.standingFor([a.sid]).get(a.sid);
    eq([s.expectation, s.overall], [6, 6], 'MT2: kỳ vọng 6.5 − 0.5; Overall (5+6+6+6)/4 = 5.75 → 6.0');
    eq(s.belowSkills, [{ skill: 'listening', band: 5 }], 'Chỉ L dưới kỳ vọng');
    eq(s.failedSkills, [], 'FT không có môn đúng/tổng');
    eq(d.ketQuaGanNhat(s), { chinh: '6.0', thieu: null, dat: false, sos: 'SOS 1', phu: 'MT2 · kỳ vọng 6.0 · Thiếu L 5.0' }, 'Chữ cột');
  });

  check('PR-Qa · §3.6 lớp thường: standingFor trả môn chưa đạt kèm đúng/tổng', () => {
    const b = taoHocVien({ cid: LOP_THUONG, ft: false });
    const at = themLuot({ ...b, cid: LOP_THUONG, no: 1, kind: 'progress', weekStart: '2026-09-07' });
    diemThuong(at, { listening: [30, 40], reading: [32, 40], writing: [12, 20], speaking: [8, 10] });
    const s = standingMod.standingFor([b.sid]).get(b.sid);
    eq(s.failedSkills, [{ skill: 'writing', score: 12, total: 20 }], 'W 12/20 = 60% < 70%');
    eq([s.overall, s.expectation, s.belowSkills], [null, null, []], 'Lớp thường không có Overall/kỳ vọng');
    eq(d.ketQuaGanNhat(s), { chinh: 'Đạt 3/4 môn', thieu: null, dat: false, sos: 'SOS 1', phu: 'Giữa khoá · chưa đạt W 12/20' }, 'Chữ cột');
  });
```

- [x] **Step 2:** `npm test` → hai phép kiểm ✗ (`s.expectation` là `undefined`).

- [x] **Step 3: Sửa `server/src/students/standing.ts`.**
  - Trong `export type Standing` (sau dòng 59 `failed: number | null;`) thêm:

```ts
  /** FT: Overall của lượt đó (chỉ khi đủ bốn kỹ năng) và kỳ vọng CỦA CHÍNH lượt đó (MT1 −1.0, MT2 −0.5). Lớp thường: null. */
  overall: number | null;
  expectation: number | null;
  /** FT: kỹ năng ĐÁNH GIÁ (L · R · W · S) dưới kỳ vọng của lượt đó, kèm band. Lớp thường: []. */
  belowSkills: { skill: string; band: number }[];
  /** Lớp thường: môn chưa đạt của lượt đó, kèm điểm đúng/tổng — cột "Kết quả gần nhất" ghi "chưa đạt W 12/20". FT: []. */
  failedSkills: { skill: string; score: number; total: number }[];
```
  - Trong `EMPTY` (dòng 102-108), sau `sosLevel: null, provisional: false, scored: 0, required: 0, failed: null,` thêm
    `overall: null, expectation: null, belowSkills: [], failedSkills: [],`.
  - Nhánh lớp thường (sau `s.failed = r.failedCount;`, dòng 223):

```ts
        s.failedSkills = r.skills
          .filter((x) => x.outcome === 'fail' && x.score !== null && x.total !== null)
          .map((x) => ({ skill: x.skill, score: x.score as number, total: x.total as number }));
```
  - Nhánh FT (sau `s.required = r.required.length;`, dòng 233):

```ts
        s.overall = r.overall;
        s.expectation = r.expectation;
        s.belowSkills = r.verdicts
          .filter((v) => v.passed === false && v.band !== null)
          .map((v) => ({ skill: v.skill, band: v.band as number }));
```

- [x] **Step 4:** `npm run check` xanh (N+17). Không phép kiểm cũ nào đỏ (trường chỉ thêm).
- [x] **Step 5: Commit.**

```bash
git add server/src/students/standing.ts server/src/tests/hocVienLop.tests.ts
git commit -m "PR-Qa (4): Standing mang Overall, kỳ vọng của đợt, kỹ năng/môn chưa đạt"
```

---

### Task 5: Máy chủ — một request cho trang Học viên & Lớp (`GET /hoc-vien-lop`)

**Files:**
- Create: `server/src/classes/dongHocVien.ts`
- Create: `server/src/classes/hocVienLop.ts`
- Modify: `server/src/routes/index.ts` — thêm `import * as hocVienLopSvc from '../classes/hocVienLop.ts';` ngay sau dòng 46
  (`import * as transitionSvc …`); thêm khối route mới **ngay trước** dòng
  `// ============================================================ Thêm học viên hàng loạt` (~dòng 882)
- Test: `server/src/tests/hocVienLop.tests.ts`

**Interfaces:**
- Consumes: `listClassSummaries`, `ClassSummary` (`classes.ts`), `listCases` (`cases.ts`, chỉ đọc), `standingFor`, `classProgressMany`,
  `missingForStudent` (`schedule.ts`), `phamViCoThe`, `phamViMacDinh`, `LOC_HOC_VIEN` (Task 3).
- Produces:
  - `soCaseMoTheoLop(classIds: number[]): Map<number, number>` (`dongHocVien.ts`) — tổng Case chưa xong của HV đang học, không lưu trữ.
  - `danhSachHocVienLop(p, { branchId?, q?, phamVi? }): TrangHocVienLop` với
    `TrangHocVienLop = { rows: LopHocVienLop[]; scopeEmpty; phamVi: { coThe: PhamVi[]; dangDung: PhamVi; chiNhanh: number | null };
    dem: Record<LocHocVien, number>; hocVien: { id; classId; loc: LocHocVien[] }[] }`,
    `LopHocVienLop = ClassSummary & { gvcn: { id; name } | null; soCaseMo: number; tuanKetThuc: string | null;
    viewer: { coTheSuaHocVien; coTheBaoCase; coTheGhiViPham; coTheNhapDiem } }`.
  - Route `GET /api/hoc-vien-lop?q=&phamVi=&branchId=`.

- [x] **Step 1: Phép kiểm đỏ.** Nối vào cuối thân `runHocVienLopTests`:

```ts
  // ------------------------------------------------------------------ Task 5 · GET /hoc-vien-lop

  check('PR-Qa · Q3/Q12 Phạm vi theo vai: GV "Lớp tôi dạy", QL chi nhánh, Quản trị "Tất cả"; link cũ ?branchId= = một chi nhánh', () => {
    const gv = hvl.danhSachHocVienLop(P.subjectTeacher, {});
    assert(gv.phamVi.dangDung === 'toi' && !gv.phamVi.coThe.includes('tat-ca'), `GV: ${JSON.stringify(gv.phamVi)}`);
    const cuaGv = new Set(P.subjectTeacher.assignments.map((a: any) => a.classId));
    assert(gv.rows.length > 0 && gv.rows.every((r: any) => cuaGv.has(r.id)), 'GV chỉ thấy lớp mình dạy');
    const ql = hvl.danhSachHocVienLop(P.mbManager, {});
    assert(ql.phamVi.dangDung === (ql.phamVi.coThe.includes('toi') ? 'toi' : 'chi-nhanh'), `QL: ${JSON.stringify(ql.phamVi)}`);
    const qlCn = hvl.danhSachHocVienLop(P.mbManager, { phamVi: 'chi-nhanh' });
    assert(qlCn.rows.every((r: any) => r.branchId === MB), 'QL MB chỉ thấy lớp MB');
    const qt = hvl.danhSachHocVienLop(P.admin, {});
    assert(qt.phamVi.dangDung === 'tat-ca' && qt.phamVi.coThe.includes('chi-nhanh'), `Quản trị: ${JSON.stringify(qt.phamVi)}`);
    const cu = hvl.danhSachHocVienLop(P.admin, { branchId: MB });
    assert(cu.phamVi.dangDung === 'chi-nhanh' && cu.phamVi.chiNhanh === MB && cu.rows.every((r: any) => r.branchId === MB),
      'Có branchId mà không ghi phạm vi = xem chi nhánh đó');
    const la = hvl.danhSachHocVienLop(P.subjectTeacher, { phamVi: 'tat-ca' });
    eq(la.phamVi.dangDung, 'toi', 'Phạm vi không có quyền thì về mặc định');
  });

  check('PR-Qa · Q4 số đếm chip = số học viên mang cờ đó; khớp hàng đợi Case và mức SOS của máy chủ', () => {
    const r = hvl.danhSachHocVienLop(P.admin, {});
    eq(r.dem['tat-ca'], r.hocVien.length, 'Tất cả');
    for (const k of d.LOC_HOC_VIEN) eq(r.dem[k], r.hocVien.filter((h: any) => h.loc.includes(k)).length, `Chip ${k}`);
    const ids = new Set(r.hocVien.map((h: any) => h.id));
    const quaHan = new Set(casesMod.listCases(P.admin, { queue: 'due' }).rows.filter((c: any) => ids.has(c.studentId)).map((c: any) => c.studentId));
    eq(r.dem.case_overdue, quaHan.size, 'Case quá hạn cập nhật = hàng đợi due');
    const sos = [...standingMod.standingFor([...ids]).values()].filter((s: any) => (s.sosLevel ?? 0) > 0).length;
    eq(r.dem.sos, sos, 'Đang SOS = standing');
    assert(r.dem.sos > 0 && r.dem.thieu_tt >= 0, 'Bộ demo có em đang SOS');
  });

  check('PR-Qa · Q1/Q3 tìm theo tên học viên: chỉ em khớp; tìm theo mã lớp: cả lớp', () => {
    const e = taoHocVien({ cid: LOP_FT, ft: true, ten: 'Qa Tim Kiem Duy Nhat' });
    const r = hvl.danhSachHocVienLop(P.admin, { q: 'Tim Kiem Duy Nhat' });
    assert(r.rows.some((x: any) => x.id === LOP_FT), 'Lớp chứa em phải hiện');
    eq(r.hocVien.map((h: any) => h.id), [e.sid], 'Chỉ em khớp được đếm');
    const c = hvl.danhSachHocVienLop(P.admin, { q: 'MB-FT QA1' });
    const soEm = (conn.prepare(`SELECT COUNT(*) AS n FROM enrollments WHERE class_id = ? AND status = 'active'`).get(LOP_FT) as any).n;
    assert(c.rows.length === 1 && c.hocVien.length === soEm, `Tìm mã lớp: ${c.rows.length} lớp, ${c.hocVien.length}/${soEm} em`);
  });

  check('PR-Qa · Q2/Q5 "n Case đang mở" của lớp = tổng cột Case của danh sách lớp; cờ nút theo quyền', () => {
    const r = hvl.danhSachHocVienLop(P.admin, {});
    for (const lop of r.rows.filter((x: any) => x.code === 'MB-FT 101' || x.code === 'MB-FOU 12')) {
      const tong = classes.classRoster(P.admin, lop.id).filter((s: any) => !s.archived).reduce((n: number, s: any) => n + s.openCases, 0);
      eq(lop.soCaseMo, tong, `${lop.code}: hộp lớp và danh sách`);
      assert(lop.gvcn && lop.gvcn.name, `${lop.code} thiếu GVCN`);
    }
    const s = hvl.danhSachHocVienLop(P.sTeacher, {}).rows.find((x: any) => x.code === 'MB-FT 101');
    assert(s && s.viewer.coTheGhiViPham && s.viewer.coTheNhapDiem && !s.viewer.coTheSuaHocVien, `GV Speaking: ${JSON.stringify(s?.viewer)}`);
    const g = hvl.danhSachHocVienLop(P.coreTeacher, {}).rows.find((x: any) => x.code === 'MB-FT 101');
    assert(g && g.viewer.coTheSuaHocVien, 'GVCN sửa được học viên lớp mình');
    const fou = r.rows.find((x: any) => x.code === 'MB-FOU 12');
    assert(fou && fou.tuanKetThuc && /^\d{4}-\d{2}-\d{2}$/.test(fou.tuanKetThuc), 'Lớp thường có tuần kết thúc khoá');
  });
```

- [x] **Step 2:** `npm test` → bốn phép kiểm ✗ (`Chưa có mô-đun ../classes/hocVienLop.ts`).

- [x] **Step 3: Tạo `server/src/classes/dongHocVien.ts`:**

```ts
/**
 * PHẦN BỔ SUNG CHO DÒNG HỌC VIÊN CỦA LỚP (PR-Qa) — nhãn cảnh báo Ý thức 5 ngày (YT-8), các Case đang mở dùng dựng "Việc tiếp theo",
 * và số Case đang mở của lớp. Tách khỏi classes.ts để không vòng import; mỗi thứ MỘT lần cho cả lớp, không hỏi từng em.
 */
import { db } from '../db.ts';
import { PERMISSIONS, type CaseChoViec } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { rosterWarnings } from '../yThuc/canhBao.ts';
import { listCases } from '../cases/cases.ts';

export type CanhBaoDong = { count: number; oldestAgeDays: number; message: string };

/** Người không được xem hồ sơ học viên của lớp thì không có nhãn — ẩn chứ không làm hỏng cả bảng. */
export function canhBaoTheoHocVien(p: Principal, classId: number): Map<number, CanhBaoDong> {
  const out = new Map<number, CanhBaoDong>();
  if (!can(p, PERMISSIONS.STUDENT_VIEW, { classId })) return out;
  for (const [id, w] of rosterWarnings(p, classId)) out.set(id, { count: w.count, oldestAgeDays: w.oldestAgeDays, message: w.message });
  return out;
}

/** Case chưa xong của từng em trong lớp (lớp em ĐANG học), theo đúng phạm vi người xem — cùng tập với `/cases?classId=`. */
export function caseMoTheoHocVien(p: Principal, classId: number): Map<number, CaseChoViec[]> {
  const out = new Map<number, CaseChoViec[]>();
  for (const c of listCases(p, { classId }).rows) {
    if (c.status === 'done' || c.studentId === null) continue;
    const ds = out.get(c.studentId) ?? [];
    ds.push({ id: c.id, topic: c.topic, state: c.state, nextDue: c.nextDue, dueOverdue: c.dueOverdue, sosLevel: c.sosLevel });
    out.set(c.studentId, ds);
  }
  return out;
}

/**
 * "n Case đang mở" của lớp = tổng Case chưa xong của các em ĐANG HỌC, không lưu trữ — đúng bằng tổng cột Case của danh sách lớp
 * (`classRoster.openCases`), nên bấm vào không ra một con số khác (Q2 kiểm kê).
 */
export function soCaseMoTheoLop(classIds: number[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!classIds.length) return out;
  const ph = classIds.map(() => '?').join(',');
  for (const r of db().prepare(
    `SELECT e.class_id, COUNT(*) AS n FROM sos_cases sc
       JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
       JOIN students s ON s.id = sc.student_id
      WHERE e.class_id IN (${ph}) AND sc.status != 'done' AND s.archived_at IS NULL
      GROUP BY e.class_id`,
  ).all(...classIds) as any[]) out.set(r.class_id, r.n);
  return out;
}
```

- [x] **Step 4: Tạo `server/src/classes/hocVienLop.ts`:**

```ts
/**
 * TRANG HỌC VIÊN & LỚP (PR-Qa, đặc tả §3.6) — một request cho cả trang: các lớp trong phạm vi đang chọn, số đếm của từng chip lọc,
 * và cờ lọc của từng học viên để web lọc tại chỗ (lọc xong lớp nào không còn em thì ẩn).
 *
 * Danh sách lớp đi qua ĐÚNG `listClassSummaries`; phần thêm ở đây: phạm vi "Lớp tôi dạy", GVCN, số Case đang mở, tuần kết thúc khoá,
 * cờ nút theo quyền, và cờ lọc của học viên (Case: cùng `listCases`; SOS: cùng `standingFor`; thiếu thông tin: cùng `missingForStudent`).
 */
import { db } from '../db.ts';
import {
  LOC_HOC_VIEN, PERMISSIONS, phamViCoThe, phamViMacDinh, type LocHocVien, type PhamVi,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays } from '../util.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { listClassSummaries, type ClassSummary } from './classes.ts';
import { classProgressMany, missingForStudent } from './schedule.ts';
import { standingFor } from '../students/standing.ts';
import { listCases } from '../cases/cases.ts';
import { soCaseMoTheoLop } from './dongHocVien.ts';

export type LopHocVienLop = ClassSummary & {
  gvcn: { id: number; name: string } | null;
  soCaseMo: number;
  /** Thứ Hai của tuần học cuối — lớp thường; FT null. */
  tuanKetThuc: string | null;
  viewer: { coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean };
};

export type TrangHocVienLop = {
  rows: LopHocVienLop[];
  scopeEmpty: boolean;
  phamVi: { coThe: PhamVi[]; dangDung: PhamVi; chiNhanh: number | null };
  dem: Record<LocHocVien, number>;
  hocVien: { id: number; classId: number; loc: LocHocVien[] }[];
};

const demRong = (): Record<LocHocVien, number> =>
  Object.fromEntries(LOC_HOC_VIEN.map((k) => [k, 0])) as Record<LocHocVien, number>;

export function danhSachHocVienLop(
  p: Principal, f: { branchId?: number | null; q?: string | null; phamVi?: string | null } = {},
): TrangHocVienLop {
  const today = demoToday();
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const phanCong = p.assignments.filter((a) => a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today));
  const coThe = phamViCoThe({
    dayLop: phanCong.length > 0, capChiNhanh: scope.branchIds.length > 0,
    toanHeThong: scope.all, soChiNhanh: scope.branchIds.length,
  });
  /* Link cũ `/hoc-vien?branchId=` (bảng chi nhánh, báo cáo tuần) không ghi phạm vi → coi là xem MỘT chi nhánh. */
  const muon = f.phamVi ?? (f.branchId && coThe.includes('chi-nhanh') ? 'chi-nhanh' : null);
  const dangDung: PhamVi = (coThe as string[]).includes(muon ?? '') ? (muon as PhamVi) : phamViMacDinh(coThe);
  let chiNhanh: number | null = null;
  if (dangDung === 'chi-nhanh') {
    const duocXem = scope.all
      ? (conn.prepare(`SELECT id FROM branches WHERE status = 'active' ORDER BY id`).all() as any[]).map((r) => r.id as number)
      : scope.branchIds;
    chiNhanh = f.branchId && duocXem.includes(f.branchId) ? f.branchId : duocXem[0] ?? null;
  }
  const phamVi = { coThe, dangDung, chiNhanh };

  const base = listClassSummaries(p, {
    branchId: chiNhanh ?? undefined,
    q: f.q ?? undefined,
    /* Phạm vi quyết luôn badge chấm bài: "Lớp tôi dạy" đếm phần mình phải chấm (Q12 — thay cặp nút Tôi / Tất cả). */
    scope: dangDung === 'toi' ? 'mine' : 'managed',
  });
  if (base.scopeEmpty) return { rows: [], scopeEmpty: true, phamVi, dem: demRong(), hocVien: [] };
  const lopToi = new Set(phanCong.map((a) => a.classId));
  const lops = dangDung === 'toi' ? base.rows.filter((r) => lopToi.has(r.id)) : base.rows;
  if (!lops.length) return { rows: [], scopeEmpty: false, phamVi, dem: demRong(), hocVien: [] };

  const ids = lops.map((r) => r.id);
  const ph = ids.map(() => '?').join(',');

  const gvcn = new Map<number, { id: number; name: string }>();
  for (const r of conn.prepare(
    `SELECT ta.class_id, u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
      WHERE ta.class_id IN (${ph}) AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id`,
  ).all(...ids) as any[]) if (!gvcn.has(r.class_id)) gvcn.set(r.class_id, { id: r.id, name: r.full_name });

  const soCase = soCaseMoTheoLop(ids);
  const tienDo = classProgressMany(ids);

  const rows: LopHocVienLop[] = lops.map((r) => {
    const pr = tienDo.get(r.id);
    return {
      ...r,
      gvcn: gvcn.get(r.id) ?? null,
      soCaseMo: soCase.get(r.id) ?? 0,
      tuanKetThuc: pr?.startWeekStart && pr.totalWeeks ? addDays(pr.startWeekStart, (pr.totalWeeks - 1) * 7) : null,
      viewer: {
        coTheSuaHocVien: can(p, PERMISSIONS.STUDENT_EDIT, { classId: r.id }),
        coTheBaoCase: can(p, PERMISSIONS.SOS_REPORT, { classId: r.id }),
        coTheGhiViPham: can(p, PERMISSIONS.VIOLATION_RECORD, { classId: r.id }),
        coTheNhapDiem: can(p, PERMISSIONS.SCORE_OVERRIDE, { classId: r.id }) || phanCong.some((a) => a.classId === r.id && !!a.skill),
      },
    };
  });

  /* Học viên đang học, không tính em đã lưu trữ — đúng cách `studentCount` của lớp đếm (Q18). */
  const hv = conn.prepare(
    `SELECT e.class_id, s.id, s.full_name, s.normalized_name, s.student_code, s.dob, s.status,
            cy.id AS cycle_id, cy.start_period_id, cy.exam_month, cy.target_score, cy.baseline_attempt_id, cy.baseline_score,
            (SELECT COUNT(*) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status = 'planned') AS so_luot_ke_hoach
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
      WHERE e.class_id IN (${ph}) AND e.status = 'active' AND s.archived_at IS NULL`,
  ).all(...ids) as any[];

  /* Tìm theo tên/mã HỌC VIÊN thì chỉ em khớp được đếm và được hiện; tìm theo MÃ LỚP thì cả lớp. */
  const q = (f.q ?? '').trim();
  const ql = q.toLowerCase();
  const maLop = new Map(lops.map((r) => [r.id, r.code.toLowerCase()]));
  const khop = (h: any) => !q
    || (maLop.get(h.class_id) ?? '').includes(ql)
    || String(h.full_name ?? '').toLowerCase().includes(ql)
    || String(h.normalized_name ?? '').includes(ql)
    || String(h.student_code ?? '').toUpperCase().includes(q.toUpperCase());
  const hvKhop = hv.filter(khop);

  const standing = standingFor(hvKhop.map((h) => h.id));
  const idSet = new Set(hvKhop.map((h) => h.id as number));
  const caseCua = new Map<number, { working: boolean; noPlan: boolean; overdue: boolean }>();
  for (const c of listCases(p, { branchId: chiNhanh }).rows) {
    if (c.status === 'done' || c.studentId === null || !idSet.has(c.studentId)) continue;
    const x = caseCua.get(c.studentId) ?? { working: false, noPlan: false, overdue: false };
    if (c.state === 'working') x.working = true;
    if (c.state === 'no_plan') x.noPlan = true;
    if (c.dueOverdue) x.overdue = true;
    caseCua.set(c.studentId, x);
  }

  const laFt = new Map(lops.map((r) => [r.id, r.programmeCode === 'FT']));
  const dem = demRong();
  const hocVien = hvKhop.map((h) => {
    const loc: LocHocVien[] = ['tat-ca'];
    if ((standing.get(h.id)?.sosLevel ?? 0) > 0) loc.push('sos');
    const c = caseCua.get(h.id);
    if (c?.working) loc.push('case_working');
    if (c?.noPlan) loc.push('case_no_plan');
    if (c?.overdue) loc.push('case_overdue');
    const thieu = missingForStudent({
      cycle: h.cycle_id
        ? { start_period_id: h.start_period_id, exam_month: h.exam_month, target_score: h.target_score,
            baseline: h.baseline_attempt_id !== null || h.baseline_score !== null }
        : null,
      student: { dob: h.dob },
      isFastTrack: !!laFt.get(h.class_id),
      hasNextMilestone: h.status === 'active' ? h.so_luot_ke_hoach > 0 : undefined,
    });
    if (thieu.length) loc.push('thieu_tt');
    for (const k of loc) dem[k] += 1;
    return { id: h.id as number, classId: h.class_id as number, loc };
  });

  return { rows, scopeEmpty: false, phamVi, dem, hocVien };
}
```
  Nếu `tsc` báo `missingForStudent` nhận kiểu khác cho `cycle` → mở `schedule.ts:452` và truyền đúng tên trường như `classes.ts`
  đang truyền (dòng ~522-540); không đổi `schedule.ts`.

- [x] **Step 5: Route.** Import sau dòng 46 của `server/src/routes/index.ts`:

```ts
import * as hocVienLopSvc from '../classes/hocVienLop.ts';
```
  Khối mới ngay trước `// ============================================================ Thêm học viên hàng loạt`:

```ts
// ============================================================ Học viên & Lớp · hồ sơ lớp (PR-Qa)

/** Trang Học viên & Lớp: lớp + số đếm chip + cờ lọc từng học viên — một request cho cả trang (đặc tả §3.6). */
api.get('/hoc-vien-lop', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return hocVienLopSvc.danhSachHocVienLop(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, q: qStr(req, 'q') ?? null, phamVi: qStr(req, 'phamVi') ?? null,
  });
}));
```

- [x] **Step 6:** `npm run check` xanh (N+21). Ghi Nhật ký (và thời gian chạy phép kiểm nếu thấy chậm hẳn).
- [x] **Step 7: Commit.**

```bash
git add server/src/classes/dongHocVien.ts server/src/classes/hocVienLop.ts server/src/routes/index.ts server/src/tests/hocVienLop.tests.ts
git commit -m "PR-Qa (5): GET /hoc-vien-lop — phạm vi, chip lọc có số đếm, số Case đang mở của lớp"
```

---

### Task 6: Dòng học viên và hồ sơ lớp mang thêm dữ liệu (YT-8, Việc tiếp theo, tuần thi từng môn, cờ nút)

**Files:**
- Modify: `server/src/classes/classes.ts` — import (dòng 1-18); nhánh lớp thường của `timeline` (dòng 403-408); sau
  `const standing = standingFor(sids);` (dòng 347); đối tượng trả về của mỗi dòng (dòng 544-551); `classOverview` (dòng 556-599)
- Test: `server/src/tests/hocVienLop.tests.ts`

**Interfaces:**
- Consumes: `canhBaoTheoHocVien`, `caseMoTheoHocVien`, `soCaseMoTheoLop` (Task 5), `viecTiepTheoCua` (Task 3), `classWarning` (`canhBao.ts`).
- Produces (dòng của `GET /classes/:id/roster`): `canhBaoYThuc: { count; oldestAgeDays; message } | null`, `viecTiepTheo: ViecTiepTheo[]`;
  mỗi phần tử `timeline` của lớp thường thêm `tuanMon: Record<skill, weekStart | null>`.
- Produces (`GET /classes/:id/overview`): `soCaseMo: number`, `canhBaoYThuc: number`,
  `viewer.canReportCase`, `viewer.canRecordViolation`, `viewer.canEnterScores`.

- [x] **Step 1: Phép kiểm đỏ.**

```ts
  // ------------------------------------------------------------------ Task 6 · dòng học viên, hồ sơ lớp

  check('PR-Qa · YT-8 nhãn cảnh báo 5 ngày ở dòng học viên — cùng dữ liệu với tab Ý thức của lớp', () => {
    const ft = classId('MB-FT 101');
    const e = taoHocVien({ cid: ft, ft: true, target: 6.5 });
    violations.recordViolation(P.coreTeacher, {
      studentId: e.sid, category: 'homework', description: 'Không làm bài tập về nhà (phép kiểm PR-Qa)', occurredOn: addDays(TODAY, -7),
    });
    const roster = classes.classRoster(P.coreTeacher, ft);
    const row = roster.find((s: any) => s.id === e.sid);
    assert(row?.canhBaoYThuc?.count === 1 && row.canhBaoYThuc.oldestAgeDays === 7, `Nhãn: ${JSON.stringify(row?.canhBaoYThuc)}`);
    eq(roster.filter((s: any) => s.canhBaoYThuc).length, warn.classWarning(P.coreTeacher, ft).activeCount, 'Khớp tab Ý thức');
  });

  check('PR-Qa · Q13 Việc tiếp theo ở dòng học viên: nhập điểm quá hạn (đỏ) lên đầu; lớp thường mang tuần thi từng môn', () => {
    const b = taoHocVien({ cid: LOP_THUONG, ft: false });
    const at = themLuot({ ...b, cid: LOP_THUONG, no: 1, kind: 'progress', weekStart: '2026-09-07' });
    diemThuong(at, { listening: [30, 40], reading: [32, 40], speaking: [8, 10] });
    const row = classes.classRoster(P.admin, LOP_THUONG).find((s: any) => s.id === b.sid);
    eq(row.viecTiepTheo[0], { nhan: 'Nhập điểm W · Giữa khoá', tone: 'danger' }, 'Writing tuần 07/09 chưa có điểm, hạn CN 13/09 đã qua');
    const t = row.timeline.find((x: any) => x.kind === 'progress');
    eq(t.tuanMon.writing, '2026-09-07', 'Tuần thi của môn Writing');
    assert(row.viecTiepTheo.every((v: any) => !/MT\d|kỳ vọng/.test(v.nhan)), 'Chữ FT lọt vào lớp thường');
  });

  check('PR-Qa · Q4/K2-6a hồ sơ lớp: cờ nút theo quyền, số Case đang mở, cảnh báo Ý thức của tab', () => {
    const ft = classId('MB-FT 101');
    const g = classes.classOverview(P.coreTeacher, ft);
    assert(g.viewer.canRecordViolation && g.viewer.canReportCase && g.viewer.canEnterScores, `GVCN: ${JSON.stringify(g.viewer)}`);
    const s = classes.classOverview(P.sTeacher, ft);
    assert(s.viewer.canRecordViolation && !s.viewer.canEditProgress && !s.viewer.canAssign, `GV Speaking: ${JSON.stringify(s.viewer)}`);
    const tong = classes.classRoster(P.admin, ft).filter((x: any) => !x.archived).reduce((n: number, x: any) => n + x.openCases, 0);
    eq(classes.classOverview(P.admin, ft).soCaseMo, tong, 'Số Case đang mở = tổng cột Case');
    eq(g.canhBaoYThuc, warn.classWarning(P.coreTeacher, ft).activeCount, 'Cảnh báo tab Ý thức');
  });
```
- [x] **Step 2:** `npm test` → ba phép kiểm ✗.

- [x] **Step 3: Sửa `classes.ts`.**
  - Import: thêm `viecTiepTheoCua` vào khối import `shared/domain/index.ts` (dòng 2-5); thêm hai dòng sau dòng 17:

```ts
import { canhBaoTheoHocVien, caseMoTheoHocVien, soCaseMoTheoLop } from './dongHocVien.ts';
import { classWarning } from '../yThuc/canhBao.ts';
```
  - Nhánh lớp thường của `timeline` — sau khối `overdueSkills: …length,` (dòng 403-407), trước `};`:

```ts
          /* Tuần thi của TỪNG môn (thứ Hai) — ô chưa có điểm ở bảng lớp thường ghi tuần này (đặc tả §3.7, 10b A). */
          tuanMon: Object.fromEntries(prog!.skills.map((k) => [k, regViews.get(k)?.weekStart ?? null])),
```
  - Sau `const standing = standingFor(sids);` (dòng 347):

```ts
  /* PR-Qa: nhãn cảnh báo Ý thức 5 ngày (YT-8) và Case đang mở cho "Việc tiếp theo" — mỗi thứ MỘT lần cho cả lớp. */
  const canhBao = canhBaoTheoHocVien(p, classId);
  const caseMo = caseMoTheoHocVien(p, classId);
```
  - Trong đối tượng trả về của mỗi dòng, thay dòng `myPending: [...new Set(timeline.flatMap((t) => t.myPending))],` (dòng 550) bằng:

```ts
      myPending: [...new Set(timeline.flatMap((t) => t.myPending))],
      canhBaoYThuc: canhBao.get(s.id) ?? null,
      /* Cột "Việc tiếp theo" (Q13): nhập điểm của CHÍNH người xem ở đợt đang chờ + việc của từng Case chưa xong. */
      viecTiepTheo: viecTiepTheoCua({
        nhapDiem: (() => {
          const cho = [...new Set(timeline.flatMap((t) => t.myPending))];
          if (!cho.length) return null;
          const dot = timeline.find((t) => t.myPending.length > 0) ?? null;
          return { kyNang: cho, dot: dot?.kindLabel ?? null, quaHan: timeline.some((t) => t.overdueSkills > 0) };
        })(),
        cases: caseMo.get(s.id) ?? [],
        homNay: today,
      }),
```
  - `classOverview`: trong đối tượng trả về, trước `viewer: {` thêm

```ts
    /** "n Case đang mở" ở đầu hồ sơ lớp — cùng tập với cột Case của tab Học viên (Q5). */
    soCaseMo: soCaseMoTheoLop([classId]).get(classId) ?? 0,
    /** Số học viên có vi phạm chưa xử lý quá 5 ngày — dấu ⚠ trên tab Ý thức & Phối hợp (Q15). */
    canhBaoYThuc: can(p, PERMISSIONS.STUDENT_VIEW, { classId }) ? classWarning(p, classId).activeCount : 0,
```
    và trong `viewer` sau `isCoreTeacher: isCoreTeacherOf(p, classId),` (dòng 596) thêm

```ts
      /** Nút đầu trang và menu ⋯ dòng học viên chỉ hiện khi làm được (Q9) — máy chủ vẫn chặn lại. */
      canReportCase: can(p, PERMISSIONS.SOS_REPORT, { classId }),
      canRecordViolation: can(p, PERMISSIONS.VIOLATION_RECORD, { classId }),
      canEnterScores: editableSkills(p, classId, classSkills).length > 0,
```

- [x] **Step 4:** `npm run check` xanh (N+24).
- [x] **Step 5: Commit.**

```bash
git add server/src/classes/classes.ts server/src/tests/hocVienLop.tests.ts
git commit -m "PR-Qa (6): dòng học viên có cảnh báo Ý thức (YT-8), Việc tiếp theo, tuần thi từng môn; cờ nút hồ sơ lớp"
```

---

### Task 7: Máy chủ — tab Phân tích lớp (`GET /classes/:id/phan-tich-lop`)

**Files:**
- Create: `server/src/classes/phanTichLop.ts`
- Modify: `server/src/routes/index.ts` (import + một route trong khối PR-Qa)
- Test: `server/src/tests/hocVienLop.tests.ts`

**Interfaces:**
- Produces: `phanTichLop(p, classId): PhanTichLop` với
  `PhanTichLop = { loai: 'ft' | 'thuong'; dong: { key; nhan; tenDayDu; category }[]; cot: { key; nhan }[];
  o: Record<\`${dong}|${cot}\`, { dat: number; tong: number }>; soHocVien: number }`. FT: dòng `L R W1 W2 S`, cột `mt1…mt5` (thêm nếu
  có MT6+). Lớp thường: dòng `L R W S`, cột `progress` "Giữa khoá", `final` "Cuối khoá".

- [x] **Step 1: Phép kiểm đỏ.**

```ts
  // ------------------------------------------------------------------ Task 7 · Phân tích lớp

  check('PR-Qa · §3.7 Phân tích lớp FT: 5 kỹ năng × MT1…MT5, ô = số HV đạt kỳ vọng của đợt / số HV có điểm', () => {
    const cid = taoLop('MB-FT QA3', 'FT');
    const a = taoHocVien({ cid, ft: true, target: 6.5 });
    const b = taoHocVien({ cid, ft: true, target: 6.5 });
    bandFT(themLuot({ ...a, cid, no: 2, kind: 'mock', weekStart: '2026-09-07' }), { listening: 5.0, reading: 6.0 });
    bandFT(themLuot({ ...b, cid, no: 2, kind: 'mock', weekStart: '2026-09-07' }), { listening: 6.5, reading: 5.5 });
    const r = ptl.phanTichLop(P.admin, cid);
    eq([r.loai, r.dong.map((x: any) => x.nhan).join(' '), r.cot.map((x: any) => x.nhan).join(' ')],
      ['ft', 'L R W1 W2 S', 'MT1 MT2 MT3 MT4 MT5'], 'Khung');
    eq(r.o['listening|mt2'], { dat: 1, tong: 2 }, 'L MT2 (kỳ vọng 6.0)');
    eq(r.o['reading|mt2'], { dat: 1, tong: 2 }, 'R MT2');
    eq(r.o['listening|mt1'] ?? null, null, 'Đợt chưa có điểm');
    eq(r.soHocVien, 2, 'Sĩ số');
    assertThrows(() => ptl.phanTichLop(P.subjectTeacher, cid), /phạm vi/, 'GV không dạy lớp này');
  });

  check('PR-Qa · §3.7 Phân tích lớp thường: 4 môn × Giữa khoá / Cuối khoá, ô = n/N HV đạt (từ 70%)', () => {
    const cid = taoLop('MB-FOU QA3', 'FOU');
    const a = taoHocVien({ cid, ft: false });
    const b = taoHocVien({ cid, ft: false });
    diemThuong(themLuot({ ...a, cid, no: 1, kind: 'progress', weekStart: '2026-09-07' }), { writing: [12, 20], listening: [30, 40] });
    diemThuong(themLuot({ ...b, cid, no: 1, kind: 'progress', weekStart: '2026-09-07' }), { writing: [15, 20] });
    const r = ptl.phanTichLop(P.admin, cid);
    eq([r.loai, r.dong.map((x: any) => x.nhan).join(' '), r.cot.map((x: any) => x.nhan).join(' ')],
      ['thuong', 'L R W S', 'Giữa khoá Cuối khoá'], 'Khung');
    eq(r.o['writing|progress'], { dat: 1, tong: 2 }, 'W Giữa khoá');
    eq(r.o['listening|progress'], { dat: 1, tong: 1 }, 'L Giữa khoá');
    assert(!/MT\d|kỳ vọng|Progress|Final/.test(JSON.stringify(r)), 'Chữ FT lọt vào lớp thường');
  });
```

- [x] **Step 2:** `npm test` → hai phép kiểm ✗ (`Chưa có mô-đun ../classes/phanTichLop.ts`).

- [x] **Step 3: Tạo `server/src/classes/phanTichLop.ts`:**

```ts
/**
 * TAB PHÂN TÍCH LỚP (PR-Qa, đặc tả §3.7, mockup 06) — lớp tiến bộ hay đi lùi ở kỹ năng nào qua các đợt.
 *
 *   FT         5 kỹ năng (L · R · W1 · W2 · S) × MT1…MT5. Ô = số HV có band ≥ kỳ vọng CỦA ĐỢT ĐÓ / số HV có điểm ô đó.
 *              W1, W2 so riêng từng bài với kỳ vọng (SOS vẫn tính Writing gộp — web ghi rõ ở ⓘ).
 *   Lớp thường 4 môn (L · R · W · S) × Giữa khoá / Cuối khoá. Ô = số HV đạt (từ 70%) / số HV có điểm môn đó.
 *
 * Chỉ học viên ĐANG HỌC lớp này (không lưu trữ), chỉ lộ trình đang chạy. Chưa có điểm KHÁC trượt: không vào mẫu số.
 */
import { db } from '../db.ts';
import {
  ENTRY_SKILLS, ENTRY_SKILL_SHORT, PERMISSIONS, REGULAR_SKILLS, categoryOf, skillShort, tenKyNang,
} from '../../../shared/domain/index.ts';
import { require_, type Principal } from '../permissions.ts';
import { loadBundle } from '../fasttrack/attempts.ts';
import { expectationFor } from '../fasttrack/scoring.ts';
import { evaluateRegular, programmeOfClass } from '../normal/regular.ts';

export type OPhanTich = { dat: number; tong: number };
export type PhanTichLop = {
  loai: 'ft' | 'thuong';
  dong: { key: string; nhan: string; tenDayDu: string; category: string }[];
  cot: { key: string; nhan: string }[];
  o: Record<string, OPhanTich>;
  soHocVien: number;
};

export function phanTichLop(p: Principal, classId: number): PhanTichLop {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const prog = programmeOfClass(classId);
  const thuong = prog?.scoringMode === 'ratio';
  const hv = conn.prepare(
    `SELECT s.id, cy.id AS cycle_id, cy.target_score FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
      WHERE e.class_id = ? AND e.status = 'active' AND s.archived_at IS NULL`,
  ).all(classId) as any[];
  const mucTieu = new Map<number, number | null>(hv.filter((h) => h.cycle_id).map((h) => [h.cycle_id, h.target_score ?? null]));
  const cycleIds = [...mucTieu.keys()];
  const attempts = cycleIds.length
    ? conn.prepare(
      `SELECT * FROM assessment_attempts WHERE cycle_id IN (${cycleIds.map(() => '?').join(',')}) AND status != 'cancelled'`,
    ).all(...cycleIds) as any[]
    : [];
  const bundle = loadBundle(attempts.map((a) => a.id));
  const o: Record<string, OPhanTich> = {};
  const cong = (k: string, dat: boolean) => {
    const x = o[k] ?? (o[k] = { dat: 0, tong: 0 });
    x.tong += 1;
    if (dat) x.dat += 1;
  };

  if (thuong) {
    const mon = [...(prog?.skills ?? REGULAR_SKILLS)];
    for (const a of attempts) {
      if (a.kind !== 'progress' && a.kind !== 'final') continue;
      const r = evaluateRegular(mon, (bundle.scores.get(a.id) ?? []) as any);
      for (const x of r.skills) if (x.outcome === 'pass' || x.outcome === 'fail') cong(`${x.skill}|${a.kind}`, x.outcome === 'pass');
    }
    return {
      loai: 'thuong',
      dong: mon.map((k) => ({ key: k, nhan: skillShort(k), tenDayDu: tenKyNang(k), category: categoryOf(k) ?? k })),
      cot: [{ key: 'progress', nhan: 'Giữa khoá' }, { key: 'final', nhan: 'Cuối khoá' }],
      o, soHocVien: hv.length,
    };
  }

  let soDot = 5;
  for (const a of attempts) {
    if ((a.kind ?? 'mock') !== 'mock') continue;
    soDot = Math.max(soDot, a.attempt_no);
    const kyVong = expectationFor(mucTieu.get(a.cycle_id) ?? null, a.attempt_no);
    if (kyVong === null) continue;
    for (const s of (bundle.scores.get(a.id) ?? []) as any[]) {
      if (s.band === null || s.band === undefined) continue;
      cong(`${s.skill}|mt${a.attempt_no}`, s.band >= kyVong);
    }
  }
  return {
    loai: 'ft',
    dong: ENTRY_SKILLS.map((k) => ({ key: k, nhan: ENTRY_SKILL_SHORT[k], tenDayDu: tenKyNang(k), category: k })),
    cot: Array.from({ length: soDot }, (_, i) => ({ key: `mt${i + 1}`, nhan: `MT${i + 1}` })),
    o, soHocVien: hv.length,
  };
}
```

- [x] **Step 4: Route.** Import cạnh dòng Task 5: `import * as phanTichLopSvc from '../classes/phanTichLop.ts';`. Trong khối PR-Qa:

```ts
/** Tab Phân tích lớp: kỹ năng × đợt, mỗi ô "số HV đạt / số HV có điểm" (đặc tả §3.7). */
api.get('/classes/:id/phan-tich-lop', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return phanTichLopSvc.phanTichLop(principalOf(req), pInt(req, 'id'));
}));
```
- [x] **Step 5:** `npm run check` xanh (N+26).
- [x] **Step 6: Commit.**

```bash
git add server/src/classes/phanTichLop.ts server/src/routes/index.ts server/src/tests/hocVienLop.tests.ts
git commit -m "PR-Qa (7): GET /classes/:id/phan-tich-lop — kỹ năng × đợt, n/N học viên đạt"
```

---

### Task 8: Máy chủ — ⋮ Sửa thông tin lớp (`PATCH /classes/:id/thong-tin`)

**Files:**
- Create: `server/src/classes/thongTinLop.ts`
- Modify: `server/src/routes/index.ts` (import + một route trong khối PR-Qa)
- Test: `server/src/tests/hocVienLop.tests.ts`

**Interfaces:**
- Produces: `capNhatThongTinLop(p, classId, { code?, route?, note?, programmeCode? })` → dòng `classes` sau khi sửa.
  Lỗi (400/403) nói rõ vì sao. Ghi `audit_logs` action `class.info`.

- [x] **Step 1: Phép kiểm đỏ.**

```ts
  // ------------------------------------------------------------------ Task 8 · Sửa thông tin lớp

  check('PR-Qa · Q8 Sửa thông tin lớp: mã có tiền tố chi nhánh, không trùng; chỉ người có quyền sửa lớp; có nhật ký', () => {
    const cid = taoLop('MB-FT QA4', 'FT');
    assertThrows(() => ttl.capNhatThongTinLop(P.sTeacher, cid, { code: 'MB-FT QA4B' }), /quyền/, 'GV bộ môn');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, cid, { code: 'FT QA4B' }), /bắt đầu bằng "MB-"/, 'Thiếu tiền tố');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, cid, { code: 'MB-FT 101' }), /Đã có lớp/, 'Trùng mã');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, cid, { route: 'LT9' }), /LT1 hoặc LT2/, 'LT lạ');
    const r = ttl.capNhatThongTinLop(P.admin, cid, { code: 'MB-FT QA4B', route: 'LT2', note: 'Lớp tối' });
    eq([r.code, r.route, r.note], ['MB-FT QA4B', 'LT2', 'Lớp tối'], 'Đã lưu');
    const log = conn.prepare(`SELECT before_json, after_json FROM audit_logs WHERE action = 'class.info' AND entity_id = ? ORDER BY id DESC LIMIT 1`).get(cid) as any;
    assert(log && /MB-FT QA4"/.test(log.before_json) && /MB-FT QA4B/.test(log.after_json), `Nhật ký: ${JSON.stringify(log)}`);
  });

  check('PR-Qa · Q8 đổi chương trình chỉ khi lớp chưa có học viên và chưa có bài Test; kỹ năng lớp theo chương trình mới', () => {
    const rong = taoLop('MB-FT QA5', 'FT');
    ttl.capNhatThongTinLop(P.admin, rong, { programmeCode: 'FOU' });
    const c = conn.prepare('SELECT programme_code, is_fast_track, route FROM classes WHERE id = ?').get(rong) as any;
    const ks = (conn.prepare('SELECT skill FROM class_skills WHERE class_id = ? ORDER BY skill').all(rong) as any[]).map((x) => x.skill).join(',');
    eq([c.programme_code, c.is_fast_track, c.route, ks], ['FOU', 0, null, 'listening,reading,speaking,writing'], 'Lớp trống đổi được');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, rong, { route: 'LT1' }), /Fast Track/, 'Lớp thường không có LT');
    const coEm = taoLop('MB-FT QA6', 'FT');
    taoHocVien({ cid: coEm, ft: true });
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, coEm, { programmeCode: 'FOU' }), /đã có học viên/, 'Lớp có học viên');
  });
```

- [x] **Step 2:** `npm test` → hai phép kiểm ✗.

- [x] **Step 3: Tạo `server/src/classes/thongTinLop.ts`:**

```ts
/**
 * ⋮ SỬA THÔNG TIN LỚP (PR-Qa, đặc tả §3.7; THUAT_NGU g3-120) — mã lớp, LT (chỉ FT), ghi chú; chương trình CHỈ khi lớp chưa có học
 * viên và chưa có bài Test (lớp tạo nhầm). Đổi chương trình của lớp đang học làm sai mọi điểm đã chấm; lớp thường học tiếp khoá
 * sau đã có "Chuyển tiếp lớp". Quyền `class.edit` — cùng quyền với "Lộ trình lớp / Lịch kiểm tra".
 */
import { db, tx } from '../db.ts';
import { PERMISSIONS, PROGRAMME_TEMPLATES, ROUTES, programmeOf } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';

export function capNhatThongTinLop(
  p: Principal, classId: number, input: { code?: unknown; route?: unknown; note?: unknown; programmeCode?: unknown },
) {
  const conn = db();
  const c = conn.prepare(
    `SELECT c.*, b.code AS branch_code FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?`,
  ).get(classId) as any;
  if (!c) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.CLASS_EDIT, { classId }, 'Bạn không có quyền sửa thông tin lớp này.');

  const moi: Record<string, unknown> = {};
  if (input.code !== undefined) {
    const code = String(input.code ?? '').trim();
    if (!code) throw badRequest('Cần mã lớp.');
    const tienTo = String(c.branch_code);
    if (!code.toUpperCase().startsWith(`${tienTo.toUpperCase()}-`)) {
      throw badRequest(`Mã lớp phải bắt đầu bằng "${tienTo}-", ví dụ ${tienTo}-FT 101.`);
    }
    if (conn.prepare('SELECT id FROM classes WHERE code = ? AND id != ?').get(code, classId)) throw badRequest(`Đã có lớp ${code}.`);
    moi.code = code;
  }
  if (input.note !== undefined) moi.note = String(input.note ?? '').trim() || null;

  const cu = (c.programme_code ?? programmeOf(c.kind)) as string | null;
  let chuongTrinh = cu;
  if (input.programmeCode !== undefined) {
    const pc = programmeOf(String(input.programmeCode ?? ''));
    if (!pc) throw badRequest('Chương trình không hợp lệ.');
    if (pc !== cu) {
      const coHocVien = conn.prepare('SELECT 1 FROM enrollments WHERE class_id = ? LIMIT 1').get(classId);
      const coBai = conn.prepare('SELECT 1 FROM assessment_attempts WHERE class_id = ? LIMIT 1').get(classId);
      if (coHocVien || coBai) {
        throw badRequest('Lớp đã có học viên hoặc bài Test nên không đổi được chương trình. Lớp thường học tiếp khoá sau thì dùng "Chuyển tiếp lớp".');
      }
      chuongTrinh = pc;
      moi.kind = pc;
      moi.programme_code = pc;
      moi.is_fast_track = pc === 'FT' ? 1 : 0;
      moi.route = pc === 'FT' ? (c.route ?? 'LT1') : null;
    }
  }
  if (input.route !== undefined) {
    if (chuongTrinh !== 'FT') throw badRequest('Chỉ lớp Fast Track có LT1/LT2.');
    const r = String(input.route ?? '');
    if (!(ROUTES as readonly string[]).includes(r)) throw badRequest('LT phải là LT1 hoặc LT2.');
    moi.route = r;
  }
  if (!Object.keys(moi).length) return conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId);

  const today = demoToday();
  tx(() => {
    const cot = Object.keys(moi);
    conn.prepare(`UPDATE classes SET ${cot.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...cot.map((k) => moi[k]), classId);
    if (chuongTrinh !== cu && chuongTrinh) {
      /* Kỹ năng lớp đi theo CHƯƠNG TRÌNH (như lúc tạo lớp); phân công kỹ năng không còn thì kết thúc, không xoá (giữ lịch sử). */
      const kyNang = [...PROGRAMME_TEMPLATES[chuongTrinh as keyof typeof PROGRAMME_TEMPLATES].skills] as string[];
      conn.prepare('DELETE FROM class_skills WHERE class_id = ?').run(classId);
      for (const k of kyNang) conn.prepare('INSERT INTO class_skills (class_id, skill, sessions_per_week) VALUES (?,?,1)').run(classId, k);
      conn.prepare(
        `UPDATE teacher_assignments SET status = 'ended', effective_to = ?
          WHERE class_id = ? AND status = 'active' AND skill IS NOT NULL AND skill NOT IN (${kyNang.map(() => '?').join(',')})`,
      ).run(today, classId, ...kyNang);
    }
    writeAudit({
      actorUserId: p.userId, action: 'class.info', entityType: 'class', entityId: classId,
      entityLabel: String(moi.code ?? c.code),
      before: { code: c.code, route: c.route, note: c.note, programmeCode: cu }, after: moi,
    });
  });
  return conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
}
```

- [x] **Step 4: Route.** Import `import * as thongTinLopSvc from '../classes/thongTinLop.ts';`; trong khối PR-Qa:

```ts
/** ⋮ Sửa thông tin lớp: mã lớp, LT (FT), ghi chú; chương trình chỉ khi lớp chưa có học viên và bài Test. */
api.patch('/classes/:id/thong-tin', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return thongTinLopSvc.capNhatThongTinLop(principalOf(req), pInt(req, 'id'), req.body ?? {});
}));
```
- [x] **Step 5:** `npm run check` xanh (N+28).
- [x] **Step 6: Commit.**

```bash
git add server/src/classes/thongTinLop.ts server/src/routes/index.ts server/src/tests/hocVienLop.tests.ts
git commit -m "PR-Qa (8): PATCH /classes/:id/thong-tin — sửa mã lớp, LT, ghi chú; đổi chương trình khi lớp còn trống"
```

---

### Task 9: Web — thành phần dùng chung (menu ⋯, tên GV, nhãn YT-8, hook menu dòng, badge "Thiếu n")

Web không có bộ kiểm thử: luật đã kiểm ở Task 3; task này kiểm bằng `npm run typecheck` + KIỂM Task 16.

**Files:**
- Create: `web/src/ui/MenuDong.tsx`
- Create: `web/src/modules/classes/TenGiaoVien.tsx`
- Create: `web/src/modules/classes/CanhBaoYThuc.tsx`
- Create: `web/src/modules/classes/thaoTacDongHocVien.tsx`
- Modify: `web/src/modules/students/MissingBadge.tsx:1-2, 30-33`

**Interfaces — Produces:**
- `MenuDong({ muc: MucMenu[]; nhan?: string; bieuTuong?: '⋯' | '⋮' })`, `type MucMenu = { key: string; nhan: string; onChon: () => void }`
- `TenGiaoVien({ id: number | null; ten: string })`
- `CanhBaoYThuc({ cb: { count; oldestAgeDays; message } | null })`
- `type QuyenDong = { coTheSuaHocVien; coTheBaoCase; coTheGhiViPham; coTheNhapDiem }`,
  `type DongChoMenu = { id; ten; dangHoc; nhapDiem: { nhan; den } | null }`,
  `useThaoTacDongHocVien({ laLopThuong, quyen, onDone }) → { mucCua(d): MucMenu[]; panels: ReactNode }`,
  `nhapDiemCua(classId, laLopThuong, timeline) → DongChoMenu['nhapDiem']`

- [x] **Step 1: `web/src/ui/MenuDong.tsx`:**

```tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type MucMenu = { key: string; nhan: string; onChon: () => void };

/**
 * NÚT ⋯ / ⋮ VÀ MENU NHỎ (đặc tả §3.7, mockup 06 phương án A; Q16).
 *
 * Menu vẽ RA NGOÀI bảng (portal, `fixed`): bảng cuộn ngang trong thẻ (G-11) sẽ cắt mất menu nếu vẽ bên trong. `z-[60]` — trên thanh
 * dưới điện thoại (z-30) và menu đầu trang (z-40). Đủ chỗ thì mở xuống, không thì mở lên; cuộn hay đổi cỡ màn thì đóng.
 * Không có mục nào thì không vẽ nút (không để nút bấm không làm gì). Tooltip bắt buộc (G-7).
 */
export function MenuDong({ muc, nhan = 'Thêm thao tác', bieuTuong = '⋯' }: {
  muc: MucMenu[]; nhan?: string; bieuTuong?: '⋯' | '⋮';
}) {
  const [mo, setMo] = useState(false);
  const nut = useRef<HTMLButtonElement>(null);
  const hop = useRef<HTMLDivElement>(null);
  const [viTri, setViTri] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!mo || !nut.current) { setViTri(null); return; }
    const r = nut.current.getBoundingClientRect();
    const rong = 216;
    const cao = Math.min(muc.length * 38 + 8, 320);
    /* Chừa 64px dưới đáy cho thanh 4 nút trên điện thoại. */
    const moXuong = r.bottom + 4 + cao <= window.innerHeight - 64;
    setViTri({
      top: moXuong ? r.bottom + 4 : Math.max(8, r.top - 4 - cao),
      left: Math.max(8, Math.min(r.right - rong, window.innerWidth - rong - 8)),
    });
  }, [mo, muc.length]);

  useEffect(() => {
    if (!mo) return undefined;
    const bamNgoai = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!hop.current?.contains(t) && !nut.current?.contains(t)) setMo(false);
    };
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') setMo(false); };
    const dong = () => setMo(false);
    document.addEventListener('mousedown', bamNgoai);
    document.addEventListener('keydown', phim);
    window.addEventListener('scroll', dong, true);
    window.addEventListener('resize', dong);
    return () => {
      document.removeEventListener('mousedown', bamNgoai);
      document.removeEventListener('keydown', phim);
      window.removeEventListener('scroll', dong, true);
      window.removeEventListener('resize', dong);
    };
  }, [mo]);

  if (!muc.length) return null;
  return (
    <>
      <button ref={nut} type="button" title={nhan} aria-label={nhan} aria-haspopup="menu" aria-expanded={mo}
        onClick={(e) => { e.stopPropagation(); setMo((v) => !v); }}
        className="inline-grid place-items-center w-7 h-7 rounded-md border bg-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5 cursor-pointer"
        style={{ borderColor: 'var(--line)' }}>
        {bieuTuong}
      </button>
      {mo && createPortal(
        <div ref={hop} role="menu" className="fixed z-[60] w-[216px] rounded-lg border p-1 shadow-xl surface-2"
          style={{ borderColor: 'var(--line-strong)', top: viTri?.top ?? 0, left: viTri?.left ?? 0, visibility: viTri ? 'visible' : 'hidden' }}>
          {muc.map((m) => (
            <button key={m.key} type="button" role="menuitem"
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 bg-transparent border-0 hover:bg-white/5 cursor-pointer"
              onClick={() => { setMo(false); m.onChon(); }}>
              {m.nhan}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
```

- [x] **Step 2: `web/src/modules/classes/TenGiaoVien.tsx`:**

```tsx
import { Link } from 'react-router-dom';
import { useSession } from '../../lib/session.tsx';
import { duongHoSoGiaoVien, laVaiQuanLy } from '@shared/domain/index.ts';

/**
 * TÊN GIÁO VIÊN Ở HỒ SƠ LỚP / DANH SÁCH LỚP (đặc tả §3.7, §4 "Hồ sơ GV"; Q2). Là link khi đã có trang hồ sơ GV (PR-GV bật
 * `CO_TRANG_HO_SO_GIAO_VIEN`) VÀ người xem được xem hồ sơ đó (QL trong phạm vi · GV chỉ chính mình). Ngược lại là chữ thường.
 */
export function TenGiaoVien({ id, ten }: { id: number | null; ten: string }) {
  const { session } = useSession();
  const den = duongHoSoGiaoVien(id, { userId: session?.user?.id ?? 0, laQuanLy: laVaiQuanLy(session?.roles) });
  return den
    ? <Link className="link" to={den}>{ten}</Link>
    : <span className="text-slate-200">{ten}</span>;
}
```

- [x] **Step 3: `web/src/modules/classes/CanhBaoYThuc.tsx`:**

```tsx
/**
 * YT-8 (Y_THUC W05, nơi thứ 3): em có vi phạm chưa xử lý quá 5 ngày. ⚠ đúng nghĩa G-4 (quá hạn xử lý). Câu đầy đủ ở tooltip — cùng
 * câu với tab Ý thức & Phối hợp và hồ sơ học viên (một hàm `rosterWarnings` ở máy chủ).
 */
export function CanhBaoYThuc({ cb }: { cb: { count: number; oldestAgeDays: number; message: string } | null }) {
  if (!cb) return null;
  return (
    <span title={cb.message}
      className="shrink-0 whitespace-nowrap rounded border px-1 text-[10px] font-semibold text-amber-200 border-amber-300/40 bg-amber-300/10">
      ⚠ {cb.count} vi phạm
    </span>
  );
}
```

- [x] **Step 4: `web/src/modules/classes/thaoTacDongHocVien.tsx`:**

```tsx
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuickReport } from '../cases/QuickReport.tsx';
import { RecordViolationPanel } from '../yThuc/RecordViolationPanel.tsx';
import type { MucMenu } from '../../ui/MenuDong.tsx';
import { MUC_MENU_DONG_NHAN, mucMenuDongHocVien } from '@shared/domain/index.ts';

export type QuyenDong = { coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean };
export type DongChoMenu = { id: number; ten: string; dangHoc: boolean; nhapDiem: { nhan: string; den: string } | null };

/** "Nhập điểm MT3" / "Nhập điểm Giữa khoá" khi em còn kỹ năng người xem phải chấm; không có thì không có mục (g3-072). */
export function nhapDiemCua(
  classId: number, laLopThuong: boolean, timeline: readonly { kind: string; kindLabel: string; myPending: string[] }[],
): DongChoMenu['nhapDiem'] {
  const t = timeline.find((x) => x.myPending.length > 0);
  if (!t) return null;
  return {
    nhan: `Nhập điểm ${t.kindLabel}`,
    den: laLopThuong ? `/bang-diem-thuong/${classId}?kind=${t.kind}` : `/nhap-diem/${classId}`,
  };
}

/**
 * MENU ⋯ CUỐI DÒNG HỌC VIÊN (đặc tả §3.7, mockup 06 phương án A; bảng định vị §4) — dùng chung cho trang Học viên & Lớp và tab Học
 * viên của hồ sơ lớp. Mục nào hiện do `mucMenuDongHocVien` (shared) quyết; panel do hook này giữ, một panel một lúc (G-8).
 * "Lộ trình tiếp theo" và "Chuyển lớp": PR-LT bật `MENU_DONG_CHO_PR_LT` và thêm nhánh `onChon` ở đây.
 */
export function useThaoTacDongHocVien({ laLopThuong, quyen, onDone }: {
  laLopThuong: boolean; quyen: QuyenDong; onDone: () => void;
}): { mucCua: (d: DongChoMenu) => MucMenu[]; panels: ReactNode } {
  const navigate = useNavigate();
  const [mo, setMo] = useState<{ viec: 'case' | 'vi-pham'; id: number; ten: string } | null>(null);

  const mucCua = (d: DongChoMenu): MucMenu[] => mucMenuDongHocVien({
    laLopThuong, dangHoc: d.dangHoc,
    coTheGhiViPham: quyen.coTheGhiViPham, coTheBaoCase: quyen.coTheBaoCase,
    coTheNhapDiem: quyen.coTheNhapDiem && d.nhapDiem !== null,
    coTheSuaHocVien: quyen.coTheSuaHocVien, coTheChuyenLop: quyen.coTheSuaHocVien,
  }).map((k) => ({
    key: k,
    nhan: k === 'nhap-diem' && d.nhapDiem ? d.nhapDiem.nhan : MUC_MENU_DONG_NHAN[k],
    onChon: () => {
      if (k === 'ho-so') navigate(`/hoc-vien/${d.id}`);
      else if (k === 'nhap-diem' && d.nhapDiem) navigate(d.nhapDiem.den);
      else if (k === 'case' || k === 'vi-pham') setMo({ viec: k, id: d.id, ten: d.ten });
    },
  }));

  const xong = () => { setMo(null); onDone(); };
  const panels = (
    <>
      <QuickReport open={mo?.viec === 'case'} onClose={() => setMo(null)}
        studentId={mo?.id ?? 0} studentName={mo?.ten} onDone={xong} />
      <RecordViolationPanel open={mo?.viec === 'vi-pham'} onClose={() => setMo(null)}
        studentId={mo?.id ?? 0} studentName={mo?.ten} onDone={xong} />
    </>
  );
  return { mucCua, panels };
}
```

- [x] **Step 5: `MissingBadge.tsx`** — bỏ `import { Alert } from '../../ui/ui.tsx';` (dòng 2) và thay dòng 32
  `<Alert tone="warn">{gon ? items.length : `Thiếu ${items.length} thông tin`}</Alert>` bằng:

```tsx
        {/* G-4: ⚠ chỉ nghĩa là quá hạn — thiếu thông tin là badge chữ (Q12). */}
        <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap bg-amber-300/10 text-amber-200 border-amber-300/30">
          {gon ? `Thiếu ${items.length}` : `Thiếu ${items.length} thông tin`}
        </span>
```
  Sửa chú thích prop `gon` (dòng 17) thành: `/** Dạng gọn cho bảng lớp: "Thiếu {n}"; rê chuột thấy danh sách, bấm mở popover như thường. */`

- [x] **Step 6:** `npm run typecheck` xanh. (QuickReport/RecordViolationPanel với `open=false` không vẽ gì — cùng cách
  `ClassOverviewPage`/`ClassYThucCard` đang dùng.)
- [x] **Step 7: Commit.**

```bash
git add web/src/ui/MenuDong.tsx web/src/modules/classes/TenGiaoVien.tsx web/src/modules/classes/CanhBaoYThuc.tsx web/src/modules/classes/thaoTacDongHocVien.tsx web/src/modules/students/MissingBadge.tsx
git commit -m "PR-Qa (9): menu ⋯ dùng chung, tên GV, nhãn cảnh báo Ý thức, badge Thiếu n (G-4)"
```

---

### Task 10: Web — trang Học viên & Lớp (Q1, Q2, Q3, Q11, Q12, chữ thô `writing`)

**Files:**
- Create: `web/src/modules/students/BangHocVienLop.tsx`
- Modify: `web/src/modules/students/StudentsPage.tsx` — thay dòng 1-378 (import, `ClassSummary`, `StudentsPage`, `ClassRow`) và xoá
  `BranchTab` (512-525), `CaseQueue` (527-602). **Giữ** `export function WorkQueue` (386-510, Test › Cần chấm dùng) — chỉ sửa chữ thô
  ở dòng 459 và 472.

**Interfaces:**
- Consumes: `GET /hoc-vien-lop` (Task 5), `GET /classes/:id/roster` (Task 6), mọi hàm Task 3, `MenuDong`, `TenGiaoVien`, `CanhBaoYThuc`,
  `useThaoTacDongHocVien`, `nhapDiemCua` (Task 9).
- URL: `q`, `phamVi`, `branchId`, `view` (chip; khoá cũ giữ), `sx=chu-y`, `open` (danh sách id, `-` = đóng hết), `classId` (chỉ một lớp).

- [x] **Step 1: `web/src/modules/students/BangHocVienLop.tsx`:**

```tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, Level, Skeleton, Task } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { fmtBand, sosTone } from '../../lib/format.ts';
import { MissingBadge } from './MissingBadge.tsx';
import { CanhBaoYThuc } from '../classes/CanhBaoYThuc.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import {
  ketQuaGanNhat, khoaLopThuong, maHocVienNgan, sapXepHocVien,
  type KetQuaVao, type SapXep, type ViecTiepTheo,
} from '@shared/domain/index.ts';

/** Các trường của một dòng `GET /classes/:id/roster` mà bảng này đọc. */
export type DongRoster = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean;
  cycle: { target: number | null } | null;
  standing: KetQuaVao | null;
  openCases: number; handoverCases: number;
  missing: { key: string; label: string; who: string }[];
  canhBaoYThuc: { count: number; oldestAgeDays: number; message: string } | null;
  viecTiepTheo: ViecTiepTheo[];
  timeline: { id: number; kind: string; kindLabel: string; myPending: string[]; overdueSkills: number }[];
};

export type LopChoBang = {
  id: number; programmeCode: string | null; scoringMode: string | null;
  currentWeek: number | null; totalWeeks: number | null; tuanKetThuc: string | null;
  viewer: QuyenDong;
};

/**
 * BẢNG HỌC VIÊN TRONG HỘP LỚP (đặc tả §3.6, mockup 07b A + 07c A + 10b §1). Sáu cột:
 * Học viên (mã 6 số mờ) · Kết quả gần nhất · Mục tiêu (FT) / Khoá (lớp thường) · Case · Việc tiếp theo · ⋯.
 * `chiHien` = id học viên còn lại sau chip lọc / ô tìm (máy chủ tính, Task 5); `null` = mọi em đang học.
 */
export function BangHocVienLop({ lop, chiHien, sapXep, onDoi }: {
  lop: LopChoBang; chiHien: Set<number> | null; sapXep: SapXep; onDoi: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const thuong = lop.scoringMode === 'ratio';
  const { data, loading, error, reload } = useApi<DongRoster[]>(`/classes/${lop.id}/roster`, [lop.id]);
  const tt = useThaoTacDongHocVien({ laLopThuong: thuong, quyen: lop.viewer, onDone: () => { reload(); onDoi(); } });
  const rows = useMemo(() => sapXepHocVien(
    (data ?? [])
      .filter((s) => !s.archived && (!chiHien || chiHien.has(s.id)))
      .map((s) => ({
        ...s, ten: s.fullName,
        quaHan: s.viecTiepTheo.some((v) => v.tone === 'danger'),
        canhBao: !!s.canhBaoYThuc, sosLevel: s.standing?.sosLevel ?? null, soCaseMo: s.openCases,
      })),
    sapXep,
  ), [data, chiHien, sapXep]);
  const khoa = thuong
    ? khoaLopThuong({ maChuongTrinh: lop.programmeCode, tuanHienTai: lop.currentWeek, tongTuan: lop.totalWeeks,
        tuanKetThuc: lop.tuanKetThuc, tiepTheo: null, homNay })
    : null;

  if (error) {
    return (
      <p className="m-0 px-4 py-3 text-xs text-rose-200">
        {error.message} <button type="button" className="btn btn-sm ml-2" onClick={reload}>Thử lại</button>
      </p>
    );
  }
  if (loading || !data) return <div className="p-3"><Skeleton rows={3} /></div>;
  if (!rows.length) return <Empty title={chiHien ? 'Không có học viên nào khớp bộ lọc trong lớp này' : 'Lớp chưa có học viên'} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] table-fixed text-sm">
        <colgroup>
          <col className="w-[28%]" /><col className="w-[22%]" /><col className="w-[14%]" />
          <col className="w-[7%]" /><col className="w-[25%]" /><col className="w-12" />
        </colgroup>
        <thead>
          <tr>
            <th className="th">Học viên</th>
            <th className="th">Kết quả gần nhất</th>
            <th className="th">{thuong ? 'Khoá' : 'Mục tiêu'}</th>
            <th className="th text-right">Case</th>
            <th className="th">Việc tiếp theo</th>
            <th className="th"><span className="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const k = ketQuaGanNhat(s.standing);
            return (
              <tr key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''}`}>
                <td className="td h-14">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Link className="link truncate font-medium" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                    <span className="shrink-0 text-[10px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                    <MissingBadge items={s.missing} gon />
                    <CanhBaoYThuc cb={s.canhBaoYThuc} />
                  </span>
                </td>
                <td className="td">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-sm font-bold tabular-nums text-slate-100">{k.chinh}</span>
                    {k.thieu && <span className="text-[11px] font-semibold text-rose-200">{k.thieu}</span>}
                    {k.dat && <span className="text-[10px] text-slate-400" title={thuong ? 'Đạt mọi môn' : 'Đạt kỳ vọng'}>✓</span>}
                    {k.sos && <Level tone={sosTone(s.standing?.sosLevel ?? null)}>{k.sos}</Level>}
                  </span>
                  {k.phu && <span className="block truncate text-[11px] text-slate-500" title={k.phu}>{k.phu}</span>}
                </td>
                <td className="td">
                  {thuong ? (
                    <>
                      <span className="block whitespace-nowrap tabular-nums text-slate-200">{khoa?.chinh}</span>
                      {khoa?.phu && <span className="block truncate text-[11px] text-slate-500">{khoa.phu}</span>}
                    </>
                  ) : <span className="tabular-nums text-slate-200">{fmtBand(s.cycle?.target ?? null)}</span>}
                </td>
                <td className="td text-right tabular-nums"
                  title={s.handoverCases ? `${s.handoverCases} Case bàn giao từ lớp trước` : undefined}>
                  {s.openCases || <span className="text-slate-600">—</span>}
                </td>
                <td className="td">
                  {s.viecTiepTheo.length === 0 ? <span className="text-slate-600">—</span> : (
                    <span className="flex flex-col items-start gap-1">
                      {s.viecTiepTheo.slice(0, 2).map((v) => <Task key={v.nhan} tone={v.tone}>{v.nhan}</Task>)}
                      {s.viecTiepTheo.length > 2 && (
                        <span className="text-[10px] text-slate-500" title={s.viecTiepTheo.slice(2).map((v) => v.nhan).join(' · ')}>
                          +{s.viecTiepTheo.length - 2} việc
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className="td text-center">
                  <MenuDong muc={tt.mucCua({
                    id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(lop.id, thuong, s.timeline),
                  })} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tt.panels}
    </div>
  );
}
```

- [x] **Step 2: `StudentsPage.tsx` — phần đầu file mới (thay dòng 1-378).** Import và trang:

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { useSession } from '../../lib/session.tsx';
import { invalidate } from '../../lib/api.ts';
import { Alert, Card, Empty, ErrorState, Level, SectionNote, Skeleton, Status, Task, Th } from '../../ui/ui.tsx';
import { attemptHref, caseStatusLabel, sosTone } from '../../lib/format.ts';
import type { Branch } from '../../ui/Filters.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { IntakePanel } from './IntakePanel.tsx';
import { ClassCreatePanel } from '../classes/ClassCreatePanel.tsx';
import { TenGiaoVien } from '../classes/TenGiaoVien.tsx';
import { BangHocVienLop } from './BangHocVienLop.tsx';
import {
  LOC_HOC_VIEN, LOC_HOC_VIEN_NHAN, PERMISSIONS, PHAM_VI_NHAN, badgeLop, docThamSoLoc, lopMoSan, needScoresText, skillShort,
  type BadgeLop, type LocHocVien, type PhamVi, type SapXep, type WorkScope,
} from '@shared/domain/index.ts';

/** Một lớp của `GET /hoc-vien-lop` (server/src/classes/hocVienLop.ts → LopHocVienLop). */
export type LopTrenTrang = {
  id: number; code: string; programmeCode: string | null; programmeName: string | null; scoringMode: string | null;
  branchId: number; branchName: string; studentCount: number; needScores: number; workScope: WorkScope;
  phase: string; currentWeek: number | null; totalWeeks: number | null; needsPlacement: boolean;
  missing: { key: string; label: string; who: string }[]; missingSkills: string[];
  gvcn: { id: number; name: string } | null; soCaseMo: number; tuanKetThuc: string | null;
  viewer: { coTheSuaHocVien: boolean; coTheBaoCase: boolean; coTheGhiViPham: boolean; coTheNhapDiem: boolean };
};
type TrangHocVienLop = {
  rows: LopTrenTrang[]; scopeEmpty: boolean;
  phamVi: { coThe: PhamVi[]; dangDung: PhamVi; chiNhanh: number | null };
  dem: Record<LocHocVien, number>;
  hocVien: { id: number; classId: number; loc: LocHocVien[] }[];
};

/**
 * HỌC VIÊN & LỚP (đặc tả §3.6, mockup 07b phương án A) — một trang, học viên nằm dưới lớp của mình.
 * Điều khiển: một ô tìm · Phạm vi · chi nhánh (khi xem theo chi nhánh và có > 1) · Xếp · chip lọc có số đếm.
 * Mọi trạng thái nằm trên URL: tải lại trang và nút Back giữ đúng chỗ đang đứng.
 */
export default function StudentsPage() {
  const { can } = useSession();
  const [params, setParams] = useSearchParams();
  const doc = docThamSoLoc(params.get('view'));
  const q = params.get('q') ?? '';
  const branchId = params.get('branchId') ? Number(params.get('branchId')) : null;
  const phamViUrl = params.get('phamVi');
  const sapXep: SapXep = params.get('sx') === 'chu-y' ? 'chu-y' : 'ten';
  const chiLop = params.get('classId') ? Number(params.get('classId')) : null;
  const openRaw = params.get('open');
  const [draftQ, setDraftQ] = useState(q);
  const [them, setThem] = useState<{ id: number; code: string } | null | 'dong'>('dong');
  const [taoLop, setTaoLop] = useState(false);

  const setParam = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k); else next.set(k, v);
    }
    setParams(next, { replace: true });
  }, [params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => { if (draftQ !== q) setParam({ q: draftQ || null, open: null }); }, 300);
    return () => clearTimeout(t);
  }, [draftQ, q, setParam]);

  const qs = useMemo(() => {
    const s = new URLSearchParams();
    if (q.trim()) s.set('q', q.trim());
    if (phamViUrl) s.set('phamVi', phamViUrl);
    if (branchId) s.set('branchId', String(branchId));
    return `/hoc-vien-lop?${s.toString()}`;
  }, [q, phamViUrl, branchId]);
  const trang = useApi<TrangHocVienLop>('chuyenDen' in doc ? null : qs);
  const branches = useApi<Branch[]>('/ref/branches');
  const data = trang.data;

  const chips = LOC_HOC_VIEN.filter((k) => { const c = LOC_HOC_VIEN_NHAN[k].can; return !c || can(c); });
  const loc: LocHocVien = 'loc' in doc && chips.includes(doc.loc) ? doc.loc : 'tat-ca';
  const dangLoc = loc !== 'tat-ca' || !!q.trim();
  const idsTheoLop = useMemo(() => {
    const m = new Map<number, Set<number>>();
    for (const h of data?.hocVien ?? []) {
      if (!h.loc.includes(loc)) continue;
      if (!m.has(h.classId)) m.set(h.classId, new Set());
      m.get(h.classId)!.add(h.id);
    }
    return m;
  }, [data, loc]);

  if ('chuyenDen' in doc) return <Navigate to={`${doc.chuyenDen}${branchId ? `?branchId=${branchId}` : ''}`} replace />;

  const lopHien = (data?.rows ?? []).filter((c) => (!chiLop || c.id === chiLop) && (!dangLoc || idsTheoLop.has(c.id)));
  const openIds = lopMoSan({
    thamSoOpen: openRaw === null ? null : openRaw === '-' ? []
      : openRaw.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0),
    lopHien: lopHien.map((c) => c.id),
    dangLoc,
  });
  const doiMo = (id: number) => {
    const s = new Set(openIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    setParam({ open: s.size ? [...s].join(',') : '-' });
  };
  const lopDangLoc = chiLop ? (data?.rows ?? []).find((c) => c.id === chiLop) : null;
  const pv = data?.phamVi;

  return (
    <div className="page space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-100 m-0">Học viên & Lớp</h1>
        <div className="flex-1" />
        {can(PERMISSIONS.STUDENT_EDIT) && <button type="button" className="btn btn-sm" onClick={() => setTaoLop(true)}>+ Lớp mới</button>}
        {can(PERMISSIONS.STUDENT_EDIT) && (
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setThem(null)}>+ Học viên</button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input className="field w-full sm:w-80" aria-label="Tìm" placeholder="🔍 Tìm tên, mã học viên hoặc mã lớp…"
          value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
        {pv && pv.coThe.length > 1 && (
          <select className="field w-auto" aria-label="Phạm vi" value={pv.dangDung}
            onChange={(e) => setParam({ phamVi: e.target.value, branchId: null, open: null })}>
            {pv.coThe.map((v) => <option key={v} value={v}>Phạm vi: {PHAM_VI_NHAN[v]}</option>)}
          </select>
        )}
        {pv?.dangDung === 'chi-nhanh' && (branches.data?.length ?? 0) > 1 && (
          <select className="field w-auto" aria-label="Chi nhánh" value={pv.chiNhanh ?? ''}
            onChange={(e) => setParam({ phamVi: 'chi-nhanh', branchId: e.target.value, open: null })}>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <select className="field w-auto" aria-label="Cách xếp" value={sapXep}
          onChange={(e) => setParam({ sx: e.target.value === 'chu-y' ? 'chu-y' : null })}>
          <option value="ten">Xếp: Tên A→Z</option>
          <option value="chu-y">Xếp: Cần chú ý trước</option>
        </select>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Lọc học viên">
        {chips.map((k) => (
          <button key={k} type="button" title={LOC_HOC_VIEN_NHAN[k].goiY} aria-pressed={loc === k}
            onClick={() => setParam({ view: k === 'tat-ca' ? null : k, open: null })}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer ${
              loc === k
                ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)] border-[color:var(--accent-line)]'
                : 'bg-transparent text-slate-400 border-slate-300/20 hover:bg-white/5'
            }`}>
            {LOC_HOC_VIEN_NHAN[k].nhan}<span className="tabular-nums text-slate-200">{data?.dem[k] ?? 0}</span>
          </button>
        ))}
        {chiLop && (
          <button type="button" className="btn btn-sm shrink-0" title="Bỏ lọc lớp" onClick={() => setParam({ classId: null })}>
            Lớp {lopDangLoc?.code ?? chiLop} ✕
          </button>
        )}
      </div>

      {trang.error && <ErrorState message={trang.error.message} hint={trang.error.hint} onRetry={trang.reload} />}
      {trang.loading && !data && <Skeleton rows={6} />}
      {data && (lopHien.length === 0 ? (
        <Card>
          <Empty
            title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có lớp hay học viên nào khớp'}
            hint={data.scopeEmpty
              ? 'Tài khoản này chưa có vai trò kèm chi nhánh hoặc phân công lớp nào.'
              : 'Bỏ bớt từ khoá, đổi chip lọc hoặc đổi phạm vi.'} />
        </Card>
      ) : (
        <div className="space-y-2">
          {lopHien.map((c) => (
            <HopLop key={c.id} lop={c} mo={openIds.includes(c.id)} onDoiMo={() => doiMo(c.id)}
              chiHien={dangLoc ? (idsTheoLop.get(c.id) ?? new Set()) : null} sapXep={sapXep}
              onThemHocVien={() => setThem({ id: c.id, code: c.code })} onDoi={trang.reload} />
          ))}
        </div>
      ))}

      {taoLop && (
        <ClassCreatePanel onClose={() => setTaoLop(false)}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); trang.reload(); }} />
      )}
      {them !== 'dong' && (
        <IntakePanel defaultClass={them} onClose={() => setThem('dong')}
          onDone={() => { invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/students'); trang.reload(); }} />
      )}
    </div>
  );
}

/**
 * HỘP LỚP (đặc tả §3.6): ▸ · mã (mở Hồ sơ lớp) · chương trình · n học viên · GVCN · tối đa 2 badge (+n) · ⋯.
 * ⋯ của lớp: Hồ sơ lớp · Nhập điểm Test (Q11, Q6) · + Học viên — chỉ mục người xem làm được.
 */
function HopLop({ lop, mo, onDoiMo, chiHien, sapXep, onThemHocVien, onDoi }: {
  lop: LopTrenTrang; mo: boolean; onDoiMo: () => void; chiHien: Set<number> | null; sapXep: SapXep;
  onThemHocVien: () => void; onDoi: () => void;
}) {
  const navigate = useNavigate();
  const thuong = lop.scoringMode === 'ratio';
  const b = badgeLop({
    needsPlacement: lop.needsPlacement, studentCount: lop.studentCount, missingSkills: lop.missingSkills,
    needScoresText: lop.needScores > 0 ? needScoresText(lop.workScope, lop.needScores) : null,
    soCaseMo: lop.soCaseMo, phase: lop.phase,
    missingCount: lop.missing.filter((m) => m.key !== 'teachers').length,
  });
  const denBadge = (x: BadgeLop): string | null =>
    x.key === 'cham' ? `/test/can-cham?classId=${lop.id}`
      : x.key === 'case' ? `/hoc-vien/lop/${lop.id}?che-do=can-ho-tro`
      : x.key === 'het-khoa' ? `/hoc-vien/lop/${lop.id}`
      : null;
  const mucLop: MucMenu[] = [
    { key: 'ho-so', nhan: 'Hồ sơ lớp', onChon: () => navigate(`/hoc-vien/lop/${lop.id}`) },
    ...(lop.viewer.coTheNhapDiem
      ? [{ key: 'nhap-diem', nhan: 'Nhập điểm Test', onChon: () => navigate(thuong ? `/bang-diem-thuong/${lop.id}` : `/nhap-diem/${lop.id}`) }]
      : []),
    ...(lop.viewer.coTheSuaHocVien ? [{ key: 'them', nhan: '+ Học viên', onChon: onThemHocVien }] : []),
  ];

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 sm:px-4 surface-2">
        <button type="button" onClick={onDoiMo} aria-expanded={mo} title={mo ? 'Thu gọn' : 'Mở danh sách học viên'}
          aria-label={`${mo ? 'Thu gọn' : 'Mở'} danh sách học viên lớp ${lop.code}`}
          className="w-5 border-0 bg-transparent p-0 text-slate-400 cursor-pointer">{mo ? '▾' : '▸'}</button>
        <Link to={`/hoc-vien/lop/${lop.id}`} className="font-semibold text-slate-100 underline decoration-dotted underline-offset-4">
          {lop.code}
        </Link>
        <span className="min-w-0 text-xs text-slate-400">
          {lop.programmeName ?? '—'} · {lop.studentCount} học viên
          {lop.gvcn && <> · <abbr title="Giáo viên chủ nhiệm" className="no-underline">GVCN</abbr> <TenGiaoVien id={lop.gvcn.id} ten={lop.gvcn.name} /></>}
        </span>
        <span className="flex-1" />
        {b.hien.map((x) => {
          const den = denBadge(x);
          return den
            ? <Task key={x.key} tone={x.tone} as="button" onClick={(e) => { e.stopPropagation(); navigate(den); }}>{x.nhan}</Task>
            : <Task key={x.key} tone={x.tone}>{x.nhan}</Task>;
        })}
        {b.an.length > 0 && (
          <span className="text-[11px] text-slate-500" title={b.an.map((x) => x.nhan).join(' · ')}>+{b.an.length}</span>
        )}
        <MenuDong muc={mucLop} nhan="Thao tác với lớp" />
      </div>
      {mo && <BangHocVienLop lop={lop} chiHien={chiHien} sapXep={sapXep} onDoi={onDoi} />}
    </section>
  );
}
```

- [x] **Step 3: Chữ thô trong `WorkQueue`** (giữ nguyên hàm, chỉ hai chỗ):
  - dòng 459: `Nhập {r.pendingSkills.join(', ')}` → `Nhập {r.pendingSkills.map(skillShort).join(', ')}`
  - dòng 472: `.map((sk: string) => \`${sk}: ${r.pendingOwners?.[sk] ?? 'chưa phân công'}\`)` →
    `.map((sk: string) => \`${skillShort(sk)}: ${r.pendingOwners?.[sk] ?? 'chưa phân công'}\`)`
  - Xoá `BranchTab` (512-525) và `CaseQueue` (527-602). Chạy `grep -n "Info\|MissingBadge\|STUDENT_FILTERS\|WORK_SCOPE" web/src/modules/students/StudentsPage.tsx`
    — tên nào không còn dùng thì bỏ khỏi import.
- [x] **Step 4:** `npm run typecheck` xanh; `grep -n "case SOS\|Theo lớp\|Tạo lớp\|WORK_SCOPE_LABEL" web/src/modules/students/StudentsPage.tsx`
  → không còn.
- [x] **Step 5: Commit.**

```bash
git add web/src/modules/students/BangHocVienLop.tsx web/src/modules/students/StudentsPage.tsx
git commit -m "PR-Qa (10): trang Học viên & Lớp — hộp lớp, chip lọc có số đếm, Phạm vi, bảng 6 cột, menu ⋯ dòng"
```

---

### Task 11: Web — Hồ sơ lớp: đầu trang, 3 tab, panel (Q4, Q5, Q10 phần đầu trang, §3.7)

**Files:**
- Create: `web/src/modules/classes/DauTrangLop.tsx`
- Create: `web/src/modules/classes/SuaThongTinLopPanel.tsx`
- Modify (viết lại): `web/src/modules/classes/ClassOverviewPage.tsx` (365 dòng → khung mới; bỏ thẻ Phân công, menu "Quản lý lớp",
  ngăn "Thông tin lớp", dải việc, `SectionNote`)
- Modify: `web/src/modules/classes/ClassProgressPanel.tsx` — prop `tieuDe`, chữ lớp thường, ngày G-6

**Interfaces:**
- Consumes: `GET /classes/:id/overview` (Task 6: `soCaseMo`, `canhBaoYThuc`, `viewer.canReportCase|canRecordViolation|canEnterScores`),
  `PATCH /classes/:id/thong-tin` (Task 8), `badgeLop`, `nhomGiaoVienBoMon`, `tabHoSoLop`, `TAB_HO_SO_LOP(_NHAN)`, `ngay`, `tuanKhoa`,
  `needScoresText` (shared), `MenuDong`, `TenGiaoVien`, `HangTab` (`web/src/ui/HangTab.tsx`).
- Produces: `type HoSoLop` (kiểu của `/overview`), `type ViecDauTrang = 'tien-do'|'chuyen-tiep'|'phan-cong'|'thong-tin'|'case'|'hoc-vien'`,
  `DauTrangLop({ data, periodId, onViec, onCheDoCanHoTro })`, `SuaThongTinLopPanel({ lop, onClose, onDone })`.
  `TabHocVienLop` (Task 12) và `PhanTichLopTab` (Task 13) được import ở đây — làm Task 11 tới Step 4 rồi tạm để hai dòng import đó và
  hai dòng dùng chúng thành chú thích cho `typecheck` xanh; Task 12/13 bỏ chú thích.

- [x] **Step 1: `web/src/modules/classes/DauTrangLop.tsx`:**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Task } from '../../ui/ui.tsx';
import { MenuDong, type MucMenu } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { TenGiaoVien } from './TenGiaoVien.tsx';
import {
  badgeLop, needScoresText, ngay, nhomGiaoVienBoMon, tuanKhoa, type BadgeLop, type NhomGiaoVien, type WorkScope,
} from '@shared/domain/index.ts';

/** `GET /classes/:id/overview` (server/src/classes/classes.ts → classOverview). */
export type HoSoLop = {
  id: number; code: string; kind: string; route: string | null; isFastTrack: boolean; startDate: string | null; note: string | null;
  branchId: number; branchName: string;
  summary: {
    studentCount: number; needScores: number; workScope: WorkScope; phase: string;
    currentWeek: number | null; totalWeeks: number | null; needsPlacement: boolean;
    missing: { key: string; label: string; who: string }[]; missingSkills: string[];
  } | null;
  skills: { skill: string; sessionsPerWeek: number }[];
  coreTeachers: { id: number; name: string }[];
  skillTeachers: { skill: string; id: number; name: string }[];
  programme: { code: string; name: string; weeks: number | null; scoringMode: string } | null;
  soCaseMo: number;
  canhBaoYThuc: number;
  viewer: {
    canPlanWeek: boolean; canAddStudents: boolean; canAssign: boolean; canEditProgress: boolean;
    editableSkills: string[]; isCoreTeacher: boolean;
    canReportCase: boolean; canRecordViolation: boolean; canEnterScores: boolean;
  };
};
export type ViecDauTrang = 'tien-do' | 'chuyen-tiep' | 'phan-cong' | 'thong-tin' | 'case' | 'hoc-vien';

/**
 * ĐẦU TRANG HỒ SƠ LỚP (đặc tả §3.7, mockup 06c §1).
 *   dòng 1  "Hồ sơ lớp" · mã · chương trình | Lộ trình lớp (FT) / Lịch kiểm tra (lớp thường) · Chuyển tiếp lớp (lớp thường) · + Case ·
 *           + Học viên · Nhập điểm Test · ⋮ (Sửa phân công, Sửa thông tin lớp)
 *   dòng 2  chi nhánh · LT · n học viên · W{n}/{tổng} · khai giảng — hộp nhỏ "GVCN tên"
 *   dòng 3  GV bộ môn một dòng không xuống hàng, gom theo người; hẹp thì "+k" (bấm ra đủ danh sách)
 *   dòng 4  tối đa 2 badge
 * Mỗi nút chỉ hiện khi người xem làm được (Q9).
 */
export function DauTrangLop({ data, periodId, onViec, onCheDoCanHoTro }: {
  data: HoSoLop; periodId: number | null; onViec: (v: ViecDauTrang) => void; onCheDoCanHoTro: () => void;
}) {
  const navigate = useNavigate();
  const { homNay } = useNgayNghiepVu();
  const thuong = data.programme?.scoringMode === 'ratio';
  const s = data.summary;
  const gvcn = data.coreTeachers[0] ?? null;
  const nhom = nhomGiaoVienBoMon(data.skills.map((x) => x.skill), data.skillTeachers);
  const b = badgeLop({
    needsPlacement: !!s?.needsPlacement, studentCount: s?.studentCount ?? 0, missingSkills: s?.missingSkills ?? [],
    needScoresText: s && s.needScores > 0 ? needScoresText(s.workScope, s.needScores) : null,
    soCaseMo: data.soCaseMo, phase: s?.phase ?? 'running',
    missingCount: (s?.missing ?? []).filter((m) => m.key !== 'teachers').length,
  });
  const bamBadge = (x: BadgeLop): (() => void) | null =>
    x.key === 'case' ? onCheDoCanHoTro
      : x.key === 'cham' ? () => navigate(`/test/can-cham?classId=${data.id}`)
      : x.key === 'het-khoa' && data.viewer.canEditProgress ? () => onViec('chuyen-tiep')
      : null;
  const menu: MucMenu[] = [
    ...(data.viewer.canAssign ? [{ key: 'phan-cong', nhan: 'Sửa phân công', onChon: () => onViec('phan-cong') }] : []),
    ...(data.viewer.canEditProgress ? [{ key: 'thong-tin', nhan: 'Sửa thông tin lớp', onChon: () => onViec('thong-tin') }] : []),
  ];
  const nhapDiem = thuong ? `/bang-diem-thuong/${data.id}` : `/nhap-diem/${data.id}${periodId ? `?periodId=${periodId}` : ''}`;
  const tuan = thuong && s?.currentWeek && s.totalWeeks && s.currentWeek >= 1
    ? tuanKhoa(Math.min(s.currentWeek, s.totalWeeks), s.totalWeeks) : null;
  const thongTin = [
    data.branchName, data.route, `${s?.studentCount ?? 0} học viên`, tuan,
    data.startDate ? `khai giảng ${ngay(data.startDate, homNay)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <header className="card space-y-2 p-3 sm:p-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Hồ sơ lớp</div>
          <h1 className="m-0 text-lg font-semibold text-slate-100">{data.code} · {data.programme?.name ?? data.kind}</h1>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-1.5">
          {data.viewer.canEditProgress && (
            <button type="button" className="btn btn-sm" onClick={() => onViec('tien-do')}>{thuong ? 'Lịch kiểm tra' : 'Lộ trình lớp'}</button>
          )}
          {thuong && data.viewer.canEditProgress && (
            <button type="button" className="btn btn-sm" onClick={() => onViec('chuyen-tiep')}>Chuyển tiếp lớp</button>
          )}
          {data.viewer.canReportCase && <button type="button" className="btn btn-sm" onClick={() => onViec('case')}>+ Case</button>}
          {data.viewer.canAddStudents && <button type="button" className="btn btn-sm" onClick={() => onViec('hoc-vien')}>+ Học viên</button>}
          {data.viewer.canEnterScores && <Link className="btn btn-sm btn-primary no-underline" to={nhapDiem}>Nhập điểm Test</Link>}
          <MenuDong muc={menu} bieuTuong="⋮" nhan="Thêm thao tác" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>{thongTin}</span>
        <span className="whitespace-nowrap rounded-md border px-2 py-0.5 text-slate-300" style={{ borderColor: 'var(--line)' }}>
          <abbr title="Giáo viên chủ nhiệm" className="no-underline">GVCN</abbr>{' '}
          {gvcn ? <TenGiaoVien id={gvcn.id} ten={gvcn.name} /> : <span className="text-amber-200">Chưa có GVCN</span>}
        </span>
      </div>

      <DongGiaoVienBoMon nhom={nhom} />

      {b.hien.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {b.hien.map((x) => {
            const bam = bamBadge(x);
            return bam
              ? <Task key={x.key} tone={x.tone} as="button" onClick={bam}>{x.nhan}</Task>
              : <Task key={x.key} tone={x.tone}>{x.nhan}</Task>;
          })}
          {b.an.length > 0 && <span className="text-[11px] text-slate-500" title={b.an.map((x) => x.nhan).join(' · ')}>+{b.an.length}</span>}
        </div>
      )}
    </header>
  );
}

/**
 * GV BỘ MÔN MỘT DÒNG KHÔNG XUỐNG HÀNG (06c §1): "L · R Trần Ngọc Hà   W1 Lê Minh Khoa …". Điện thoại hiện 2 nhóm, máy tính 5 nhóm,
 * còn lại "+k" — bấm ra đủ danh sách ngay bên dưới (không popover trong vùng `overflow-hidden`). Lớp CSS là chuỗi tĩnh.
 */
function DongGiaoVienBoMon({ nhom }: { nhom: NhomGiaoVien[] }) {
  const [du, setDu] = useState(false);
  if (!nhom.length) return null;
  const mot = (g: NhomGiaoVien, i: number, luonHien: boolean) => (
    <span key={`${g.nhan}-${i}`}
      className={`items-baseline gap-1 whitespace-nowrap ${luonHien || i < 2 ? 'inline-flex' : i < 5 ? 'hidden sm:inline-flex' : 'hidden'}`}>
      <abbr className="font-medium text-slate-500 no-underline" title={g.title}>{g.nhan}</abbr>
      {g.id !== null ? <TenGiaoVien id={g.id} ten={g.ten} /> : <span className="text-amber-200">{g.ten}</span>}
    </span>
  );
  return (
    <div className="text-xs">
      <div className="flex items-center gap-3.5 overflow-hidden whitespace-nowrap">
        {nhom.map((g, i) => mot(g, i, false))}
        {nhom.length > 2 && (
          <button type="button" className="link border-0 bg-transparent p-0 text-xs sm:hidden" onClick={() => setDu((v) => !v)}>
            +{nhom.length - 2}
          </button>
        )}
        {nhom.length > 5 && (
          <button type="button" className="link hidden border-0 bg-transparent p-0 text-xs sm:inline" onClick={() => setDu((v) => !v)}>
            +{nhom.length - 5}
          </button>
        )}
      </div>
      {du && <div className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1">{nhom.map((g, i) => mot(g, i, true))}</div>}
    </div>
  );
}
```

- [x] **Step 2: `web/src/modules/classes/SuaThongTinLopPanel.tsx`:**

```tsx
import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { Drawer } from '../../ui/Drawer.tsx';
import { Field } from '../../ui/ui.tsx';
import { useToast } from '../../ui/Toast.tsx';

/**
 * ⋮ › SỬA THÔNG TIN LỚP (đặc tả §3.7, g3-120; Q8). Mã lớp · chương trình (chỉ đổi được khi lớp chưa có học viên) · LT (Fast Track) ·
 * ghi chú. Máy chủ kiểm lại mọi luật (`PATCH /classes/:id/thong-tin`) và nói rõ vì sao khi từ chối.
 */
export function SuaThongTinLopPanel({ lop, onClose, onDone }: {
  lop: { id: number; code: string; route: string | null; note: string | null; programmeCode: string | null; soHocVien: number };
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const programmes = useApi<{ code: string; name: string }[]>('/ref/programmes');
  const [code, setCode] = useState(lop.code);
  const [chuongTrinh, setChuongTrinh] = useState(lop.programmeCode ?? '');
  const [route, setRoute] = useState(lop.route ?? 'LT1');
  const [note, setNote] = useState(lop.note ?? '');
  const [busy, setBusy] = useState(false);
  const doiDuoc = lop.soHocVien === 0;

  const luu = async () => {
    setBusy(true);
    try {
      await api.patch(`/classes/${lop.id}/thong-tin`, {
        code: code.trim(),
        note: note.trim() || null,
        ...(chuongTrinh && chuongTrinh !== lop.programmeCode ? { programmeCode: chuongTrinh } : {}),
        ...(chuongTrinh === 'FT' ? { route } : {}),
      });
      invalidate('/classes'); invalidate('/hoc-vien-lop');
      toast.push('ok', 'Đã lưu thông tin lớp');
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <Drawer open onClose={onClose} width="max-w-md" title="Sửa thông tin lớp" subtitle={lop.code}
      footer={<>
        <button type="button" className="btn" onClick={onClose} disabled={busy}>Đóng</button>
        <button type="button" className="btn btn-primary" onClick={luu} disabled={busy || !code.trim()}>Lưu</button>
      </>}>
      <div className="space-y-3">
        <Field label="Mã lớp" required hint="Bắt đầu bằng mã chi nhánh, ví dụ MB-FT 101.">
          <input className="field w-full" value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label="Chương trình"
          hint={doiDuoc ? undefined : 'Lớp đã có học viên nên không đổi được chương trình. Lớp thường học tiếp khoá sau thì dùng Chuyển tiếp lớp.'}>
          <select className="field w-full" value={chuongTrinh} disabled={!doiDuoc} onChange={(e) => setChuongTrinh(e.target.value)}>
            {(programmes.data ?? []).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </Field>
        {chuongTrinh === 'FT' && (
          <Field label="Lộ trình (LT)">
            <select className="field w-full" value={route} onChange={(e) => setRoute(e.target.value)}>
              <option value="LT1">LT1</option>
              <option value="LT2">LT2</option>
            </select>
          </Field>
        )}
        <Field label="Ghi chú">
          <textarea className="field w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Drawer>
  );
}
```

- [x] **Step 3: Viết lại `web/src/modules/classes/ClassOverviewPage.tsx`:**

```tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { invalidate } from '../../lib/api.ts';
import { useSession } from '../../lib/session.tsx';
import { ErrorState, Skeleton } from '../../ui/ui.tsx';
import { HangTab } from '../../ui/HangTab.tsx';
import { usePeriods } from '../../ui/Filters.tsx';
import { ClassYThucCard } from '../yThuc/ClassYThucCard.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import { IntakePanel } from '../students/IntakePanel.tsx';
import { TeacherAssignDialog } from './TeacherAssignPanel.tsx';
import { ClassProgressPanel } from './ClassProgressPanel.tsx';
import { TransitionPanel } from './TransitionPanel.tsx';
import { DauTrangLop, type HoSoLop, type ViecDauTrang } from './DauTrangLop.tsx';
import { SuaThongTinLopPanel } from './SuaThongTinLopPanel.tsx';
import { TabHocVienLop } from './TabHocVienLop.tsx';
import { PhanTichLopTab } from './PhanTichLopTab.tsx';
import { TAB_HO_SO_LOP, TAB_HO_SO_LOP_NHAN, tabHoSoLop, type TabHoSoLop } from '@shared/domain/index.ts';

/**
 * HỒ SƠ LỚP (đặc tả §3.7; mockup 06 menu dòng A, 06c §1, 10b) — đầu trang có sẵn các nút hành động, ba tab
 * Học viên · Ý thức & Phối hợp · Phân tích lớp (bỏ tab Giáo viên: phân công ở ⋮ › Sửa phân công).
 * Tab và chế độ xem nằm trên URL (`?tab=`, `?che-do=`). Một panel một lúc (G-8): `viec` giữ đúng MỘT việc đang mở.
 */
export default function ClassOverviewPage() {
  const { classId } = useParams();
  const { session } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = tabHoSoLop(params.get('tab'));
  const cheDo: 'diem' | 'can-ho-tro' = params.get('che-do') === 'can-ho-tro' ? 'can-ho-tro' : 'diem';
  const periods = usePeriods();
  const [periodId, setPeriodId] = useState<number | null>(null);
  const [viec, setViec] = useState<ViecDauTrang | null>(null);
  const [caseFor, setCaseFor] = useState(0);
  const { data, loading, error, reload } = useApi<HoSoLop>(classId ? `/classes/${classId}/overview` : null);
  /* Danh sách em cho ô chọn học viên của "+ Case" — chỉ nạp khi mở. */
  const roster = useApi<any[]>(classId && viec === 'case' ? `/classes/${classId}/roster` : null, [classId, viec]);

  useEffect(() => {
    if (periodId === null && periods.data?.length && session) {
      const cur = periods.data.find((p) => p.weekStart <= session.demoDate && p.weekEnd >= session.demoDate);
      setPeriodId(cur?.id ?? periods.data[0].id);
    }
  }, [periods.data, periodId, session]);

  const doiThamSo = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) { if (v === null) next.delete(k); else next.set(k, v); }
    setParams(next, { replace: true });
  };

  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={8} />;

  const thuong = data.programme?.scoringMode === 'ratio';
  const dong = () => setViec(null);
  const xong = () => { invalidate('/classes'); invalidate('/hoc-vien-lop'); reload(); };

  return (
    <div className="page space-y-4">
      <DauTrangLop data={data} periodId={periodId} onViec={setViec}
        onCheDoCanHoTro={() => doiThamSo({ tab: null, 'che-do': 'can-ho-tro' })} />

      <HangTab ariaLabel="Hồ sơ lớp" value={tab}
        onChange={(k: TabHoSoLop) => doiThamSo({ tab: k === 'hoc-vien' ? null : k })}
        tabs={TAB_HO_SO_LOP.map((k) => ({ key: k, label: TAB_HO_SO_LOP_NHAN[k], canhBao: k === 'y-thuc' && data.canhBaoYThuc > 0 }))} />

      {tab === 'hoc-vien' && (
        <TabHocVienLop lop={data} cheDo={cheDo} onCheDo={(m) => doiThamSo({ 'che-do': m === 'diem' ? null : m })}
          onDoi={xong} onThemHocVien={() => setViec('hoc-vien')} />
      )}
      {tab === 'y-thuc' && <ClassYThucCard classId={data.id} />}
      {tab === 'phan-tich' && <PhanTichLopTab classId={data.id} />}

      {viec === 'tien-do' && (
        <ClassProgressPanel classId={data.id} classCode={data.code} tieuDe={thuong ? 'Lịch kiểm tra' : 'Lộ trình lớp'}
          onClose={dong} onDone={xong} />
      )}
      <TransitionPanel classId={data.id} open={viec === 'chuyen-tiep'} onClose={dong} onDone={xong} />
      <TeacherAssignDialog open={viec === 'phan-cong'} onClose={dong} classId={data.id} classCode={data.code} onDone={xong} />
      {viec === 'thong-tin' && (
        <SuaThongTinLopPanel onClose={dong} onDone={xong}
          lop={{ id: data.id, code: data.code, route: data.route, note: data.note,
            programmeCode: data.programme?.code ?? null, soHocVien: data.summary?.studentCount ?? 0 }} />
      )}
      {viec === 'hoc-vien' && (
        <IntakePanel defaultClass={{ id: data.id, code: data.code }} onClose={dong} onDone={xong} />
      )}
      <QuickReport open={viec === 'case'} onClose={() => { dong(); setCaseFor(0); }} studentId={caseFor}
        students={(roster.data ?? []).filter((r: any) => !r.archived).map((r: any) => ({ id: r.id, name: r.fullName, code: r.studentCode ?? null }))}
        onPickStudent={setCaseFor} onDone={() => { dong(); setCaseFor(0); xong(); }} />
    </div>
  );
}
```
  Ghi chú: `soHocVien` lấy `studentCount` (đang học). Máy chủ kiểm lại cả HV đã rời lớp và bài Test (Task 8) — nếu còn thì trả lời lỗi
  rõ ràng qua toast. Link cũ `?view=…&classId=` vào hồ sơ lớp không còn; `?tab=giao-vien` về tab Học viên (`tabHoSoLop`).

- [x] **Step 4: `ClassProgressPanel.tsx`:**
  - Chữ ký: thêm `tieuDe: string` vào props (dòng 36-37); `title="Lộ trình"` (dòng 73) → `title={tieuDe}`.
  - `import { fmtDate } from '../../lib/format.ts';` → `import { ngay, tuanLich } from '@shared/domain/index.ts';` và
    `import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';`; trong thân: `const { homNay } = useNgayNghiepVu();`.
  - `Khai giảng tuần bắt đầu {fmtDate(data.startWeekStart)}` → `Khai giảng {tuanLich(data.startWeekStart, homNay)} · {ngay(data.startWeekStart, homNay)}`.
  - Nhãn ô: `"Tuần Progress Test"` → `"Tuần thi Giữa khoá (tuần học thứ)"`; `"Tuần Final Test"` → `"Tuần thi Cuối khoá (tuần học thứ)"`;
    hint `Mặc định của ${data.programmeCode}: tuần …` giữ.
  - Hai `Status` (dòng ~112-123): `Progress Test: tuần {data.progressWeek} · {fmtDate(data.progressWeekStart)}` →
    `Giữa khoá: {tuanLich(data.progressWeekStart, homNay)} (tuần học {data.progressWeek})`; tương tự `Cuối khoá: …` cho final.
  - `grep -n "Progress\|Final\|Normal\|fmtDate" web/src/modules/classes/ClassProgressPanel.tsx` → không còn (chú thích cũng sửa theo).
- [x] **Step 5:** tạm chú thích hai import/khối `TabHocVienLop`, `PhanTichLopTab` nếu hai file chưa có; `npm run typecheck` xanh.
- [x] **Step 6: Commit.**

```bash
git add web/src/modules/classes/DauTrangLop.tsx web/src/modules/classes/SuaThongTinLopPanel.tsx web/src/modules/classes/ClassOverviewPage.tsx web/src/modules/classes/ClassProgressPanel.tsx
git commit -m "PR-Qa (11): hồ sơ lớp — hàng nút đầu trang, GVCN, dòng GV bộ môn, 3 tab, ⋮ Sửa phân công / Sửa thông tin lớp"
```

---

### Task 12: Web — tab Học viên: Điểm (FT · lớp thường) / Cần hỗ trợ; ⋯ dòng; YT-8 (§3.7, Q10, K2-6a, YT-8, chữ §6)

**Files:**
- Create: `web/src/modules/classes/TabHocVienLop.tsx`
- Create: `web/src/modules/classes/BangDiemLopThuong.tsx`
- Create: `web/src/modules/classes/BangCanHoTro.tsx`
- Modify: `web/src/modules/students/ClassRoster.tsx` — chỉ còn FT (lớp thường sang `BangDiemLopThuong`)
- Test: `server/src/tests/hocVienLop.tests.ts` (quét chữ các file web mới)

**Interfaces:**
- Consumes: `HoSoLop` (Task 11), `useThaoTacDongHocVien`, `nhapDiemCua`, `QuyenDong`, `MenuDong`, `CanhBaoYThuc` (Task 9),
  `chonCaseChinh`, `viecTiepTheoCua`, `maHocVienNgan`, `tuanLich`, `skillShort`, `tenKyNang` (Task 3), `GET /cases?classId=` (có sẵn).
- Produces: `TabHocVienLop({ lop, cheDo, onCheDo, onDoi, onThemHocVien })`,
  `ClassRoster({ classId, quyen, onDoi, onAddStudents? })` (chữ ký MỚI — chỉ `TabHocVienLop` gọi),
  `BangDiemLopThuong({ classId, quyen, onDoi })`, `BangCanHoTro({ classId, laLopThuong, quyen, onDoi })`.

- [x] **Step 1: Phép kiểm quét chữ (đỏ).** Nối vào cuối thân `runHocVienLopTests`:

```ts
  // ------------------------------------------------------------------ Task 12 · chữ trên màn lớp thường (§2, §6)

  check('PR-Qa · §2/§6 chữ: bảng lớp thường không "MT", "kỳ vọng", "Progress/Final", "Normal"; không còn "case SOS" ở danh sách', () => {
    const doc = (p: string) => fsMod.readFileSync(pathMod.join(REPO, p), 'utf8');
    const thuong = doc('web/src/modules/classes/BangDiemLopThuong.tsx');
    assert(!/MT\d|MT\$\{|kỳ vọng|Progress|Final|Normal/.test(thuong), 'BangDiemLopThuong.tsx có chữ FT/tiếng Anh');
    assert(!/case SOS/.test(doc('web/src/modules/students/StudentsPage.tsx')), 'Q2: còn nhãn "case SOS"');
    const roster = doc('web/src/modules/students/ClassRoster.tsx');
    assert(!/Lớp Normal|isRatio|REGULAR_SKILL_LABEL/.test(roster), 'ClassRoster.tsx còn nhánh lớp thường');
    assert(!/ENTRY_SKILL_SHORT\[k as EntrySkill\] \?\? k/.test(roster), 'Chữ thô `writing` (§6)');
    for (const p of ['web/src/modules/classes/DauTrangLop.tsx', 'web/src/modules/classes/BangCanHoTro.tsx', 'web/src/modules/students/BangHocVienLop.tsx']) {
      assert(!/SectionNote|\d{4}-\d{2}-\d{2}/.test(doc(p)), `${p}: khối chữ cho dev (G-5) / ngày ISO (G-6)`);
    }
  });
```

- [x] **Step 2:** `npm test` → ✗ (`ENOENT … BangDiemLopThuong.tsx`).

- [x] **Step 3: `web/src/modules/classes/TabHocVienLop.tsx`:**

```tsx
import { ClassRoster } from '../students/ClassRoster.tsx';
import { BangDiemLopThuong } from './BangDiemLopThuong.tsx';
import { BangCanHoTro } from './BangCanHoTro.tsx';
import type { HoSoLop } from './DauTrangLop.tsx';
import type { QuyenDong } from './thaoTacDongHocVien.tsx';

/**
 * TAB HỌC VIÊN CỦA HỒ SƠ LỚP (đặc tả §3.7): hai chế độ.
 *   Điểm       FT: bảng đợt MT như hiện có · lớp thường: Giữa khoá | Cuối khoá × L R W S, ô đúng/tổng (10b phương án A)
 *   Cần hỗ trợ học viên có Case mở: vấn đề chính · PA đang chạy · bước tiếp theo + hạn (mockup 06, cho GVCN họp nhanh)
 */
export function TabHocVienLop({ lop, cheDo, onCheDo, onDoi, onThemHocVien }: {
  lop: HoSoLop; cheDo: 'diem' | 'can-ho-tro'; onCheDo: (m: 'diem' | 'can-ho-tro') => void;
  onDoi: () => void; onThemHocVien: () => void;
}) {
  const thuong = lop.programme?.scoringMode === 'ratio';
  const quyen: QuyenDong = {
    coTheSuaHocVien: lop.viewer.canAddStudents, coTheBaoCase: lop.viewer.canReportCase,
    coTheGhiViPham: lop.viewer.canRecordViolation, coTheNhapDiem: lop.viewer.canEnterScores,
  };
  return (
    <div className="space-y-2">
      <div role="group" aria-label="Cách xem" className="inline-flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
        {(['diem', 'can-ho-tro'] as const).map((m) => (
          <button key={m} type="button" aria-pressed={cheDo === m} onClick={() => onCheDo(m)}
            className={`border-0 px-3 py-1 text-xs font-semibold cursor-pointer ${
              cheDo === m ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'bg-transparent text-slate-400 hover:bg-white/5'
            }`}>
            {m === 'diem' ? 'Điểm' : 'Cần hỗ trợ'}
          </button>
        ))}
      </div>
      {cheDo === 'can-ho-tro'
        ? <BangCanHoTro classId={lop.id} laLopThuong={thuong} quyen={quyen} onDoi={onDoi} />
        : thuong
          ? <BangDiemLopThuong classId={lop.id} quyen={quyen} onDoi={onDoi} />
          : <ClassRoster classId={lop.id} quyen={quyen} onDoi={onDoi} onAddStudents={lop.viewer.canAddStudents ? onThemHocVien : undefined} />}
    </div>
  );
}
```

- [x] **Step 4: `web/src/modules/classes/BangDiemLopThuong.tsx`:**

```tsx
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, Skeleton } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { MissingBadge } from '../students/MissingBadge.tsx';
import { CanhBaoYThuc } from './CanhBaoYThuc.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from './thaoTacDongHocVien.tsx';
import { maHocVienNgan, skillShort, tenKyNang, tuanLich } from '@shared/domain/index.ts';

type ODiem = { score: number | null; total: number | null; outcome: string };
type LuotThuong = {
  id: number; kind: string; kindLabel: string; myPending: string[]; overdueSkills: number;
  ratios: Record<string, ODiem> | null; tuanMon: Record<string, string | null> | null;
};
type DongThuong = {
  id: number; studentCode: string; fullName: string; status: string; archived: boolean; skills: string[] | null;
  missing: { key: string; label: string; who: string }[];
  canhBaoYThuc: { count: number; oldestAgeDays: number; message: string } | null;
  timeline: LuotThuong[];
};

const MON_MAC_DINH = ['listening', 'reading', 'writing', 'speaking'];
const BAI = [{ kind: 'progress', nhan: 'Giữa khoá' }, { kind: 'final', nhan: 'Cuối khoá' }] as const;

/**
 * TAB HỌC VIÊN · CHẾ ĐỘ ĐIỂM · LỚP THƯỜNG (đặc tả §3.7, mockup 10b phương án A).
 * Hai nhóm cột Giữa khoá | Cuối khoá, mỗi nhóm L R W S. Ô `đúng/tổng`, đỏ nếu chưa đạt (dưới 70%). Chưa có điểm mà đã có lịch thì ghi
 * tuần thi (`W3 SEP`, G-6); chưa có lịch thì gạch. Thiếu điểm KHÁC chưa đạt: không tô đỏ.
 */
export function BangDiemLopThuong({ classId, quyen, onDoi }: { classId: number; quyen: QuyenDong; onDoi: () => void }) {
  const { homNay } = useNgayNghiepVu();
  const { data, loading, error, reload } = useApi<DongThuong[]>(`/classes/${classId}/roster`, [classId]);
  const tt = useThaoTacDongHocVien({ laLopThuong: true, quyen, onDone: () => { reload(); onDoi(); } });

  if (error) return <p className="m-0 text-xs text-rose-200">{error.message}</p>;
  if (loading || !data) return <Skeleton rows={4} />;
  const rows = data.filter((s) => !s.archived);
  if (!rows.length) return <Empty title="Lớp chưa có học viên" />;
  const mon = rows[0].skills?.length ? rows[0].skills : MON_MAC_DINH;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[840px] table-fixed text-sm">
        <colgroup>
          <col className="w-[24%]" />
          {BAI.flatMap((b) => mon.map((k) => <col key={`${b.kind}-${k}`} />))}
          <col className="w-12" />
        </colgroup>
        <thead>
          <tr>
            <th className="th align-bottom" rowSpan={2}>Học viên</th>
            {BAI.map((b) => (
              <th key={b.kind} className="th border-b text-center" colSpan={mon.length} style={{ borderColor: 'var(--line)' }}>{b.nhan}</th>
            ))}
            <th className="th" rowSpan={2}><span className="sr-only">Thao tác</span></th>
          </tr>
          <tr>
            {BAI.flatMap((b) => mon.map((k) => (
              <th key={`${b.kind}-${k}`} className="th text-center"><abbr className="no-underline" title={tenKyNang(k)}>{skillShort(k)}</abbr></th>
            )))}
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className={`row-hover ${s.status !== 'active' ? 'row-muted' : ''}`}>
              <td className="td h-11">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Link className="link truncate" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                  <span className="shrink-0 text-[10px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                  <MissingBadge items={s.missing} gon />
                  <CanhBaoYThuc cb={s.canhBaoYThuc} />
                </span>
              </td>
              {BAI.flatMap((b) => {
                const t = s.timeline.find((x) => x.kind === b.kind) ?? null;
                return mon.map((k) => (
                  <td key={`${b.kind}-${k}`} className="td text-center tabular-nums">
                    <ODiemThuong o={t?.ratios?.[k] ?? null} tuan={t?.tuanMon?.[k] ?? null} homNay={homNay} />
                  </td>
                ));
              })}
              <td className="td text-center">
                <MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, true, s.timeline) })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tt.panels}
    </div>
  );
}

function ODiemThuong({ o, tuan, homNay }: { o: ODiem | null; tuan: string | null; homNay: string }) {
  if (o && o.score !== null && o.total !== null) {
    const truot = o.outcome === 'fail';
    return <span className={truot ? 'font-semibold text-rose-200' : 'text-slate-100'} title={truot ? 'Chưa đạt' : 'Đạt'}>{o.score}/{o.total}</span>;
  }
  if (tuan) return <span className="text-[11px] text-slate-500" title="Tuần thi môn này">{tuanLich(tuan, homNay)}</span>;
  return <span className="text-slate-700">–</span>;
}
```

- [x] **Step 5: `web/src/modules/classes/BangCanHoTro.tsx`:**

```tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ErrorState, Skeleton, Task } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from './thaoTacDongHocVien.tsx';
import { chonCaseChinh, maHocVienNgan, viecTiepTheoCua } from '@shared/domain/index.ts';

type CaseDong = {
  id: number; studentId: number | null; status: string; state: string; topic: string | null;
  topicLabel: string | null; primaryLabel: string | null; title: string;
  currentPlan: string | null; nextDue: string | null; dueOverdue: boolean; sosLevel: number | null;
};

/**
 * TAB HỌC VIÊN · CHẾ ĐỘ CẦN HỖ TRỢ (đặc tả §3.7, mockup 06): cùng danh sách lớp, thay cột điểm bằng vấn đề chính · PA đang chạy ·
 * bước tiếp theo + hạn. Chỉ em có Case đang mở (Case theo `/cases?classId=` — lớp em ĐANG học). Case nói trước chọn bằng
 * `chonCaseChinh` (quá hạn → chưa có PA → mức SOS). Badge "n Case đang mở" ở đầu trang mở chế độ này (Q5).
 */
export function BangCanHoTro({ classId, laLopThuong, quyen, onDoi }: {
  classId: number; laLopThuong: boolean; quyen: QuyenDong; onDoi: () => void;
}) {
  const { homNay } = useNgayNghiepVu();
  const roster = useApi<any[]>(`/classes/${classId}/roster`, [classId]);
  const cases = useApi<{ rows: CaseDong[] }>(`/cases?classId=${classId}`, [classId]);
  const tt = useThaoTacDongHocVien({ laLopThuong, quyen, onDone: () => { roster.reload(); cases.reload(); onDoi(); } });
  const theoEm = useMemo(() => {
    const m = new Map<number, CaseDong[]>();
    for (const c of cases.data?.rows ?? []) {
      if (c.status === 'done' || c.studentId === null) continue;
      const ds = m.get(c.studentId) ?? [];
      ds.push(c);
      m.set(c.studentId, ds);
    }
    return m;
  }, [cases.data]);

  if (roster.error || cases.error) {
    const e = (roster.error ?? cases.error)!;
    return <ErrorState message={e.message} hint={e.hint} onRetry={() => { roster.reload(); cases.reload(); }} />;
  }
  if (!roster.data || !cases.data) return <Skeleton rows={4} />;
  const hs = roster.data.filter((s) => !s.archived);
  const coCase = hs.filter((s) => theoEm.has(s.id));
  if (!coCase.length) return <Empty title="Không có học viên nào đang có Case mở" />;
  const tongCase = coCase.reduce((n, s) => n + (theoEm.get(s.id)?.length ?? 0), 0);

  return (
    <div className="space-y-2">
      <p className="m-0 text-xs text-slate-400">{coCase.length} học viên · {tongCase} Case đang mở</p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[780px] table-fixed text-sm">
          <colgroup><col className="w-[24%]" /><col className="w-[26%]" /><col className="w-[24%]" /><col className="w-[22%]" /><col className="w-12" /></colgroup>
          <thead>
            <tr>
              <th className="th">Học viên</th><th className="th">Vấn đề chính</th><th className="th">PA đang chạy</th>
              <th className="th">Bước tiếp theo</th><th className="th"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {coCase.map((s) => {
              const ds = theoEm.get(s.id)!;
              const c = chonCaseChinh(ds)!;
              const buoc = viecTiepTheoCua({ nhapDiem: null, cases: [c], homNay })[0] ?? null;
              return (
                <tr key={s.id} className="row-hover">
                  <td className="td h-12">
                    <Link className="link" to={`/hoc-vien/${s.id}?case=${c.id}`}>{s.fullName}</Link>{' '}
                    <span className="text-[10px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                  </td>
                  <td className="td">
                    <span className="block truncate text-slate-200" title={c.title}>{c.primaryLabel ?? c.topicLabel ?? c.title}</span>
                    {ds.length > 1 && <span className="block text-[11px] text-slate-500">+{ds.length - 1} Case khác</span>}
                  </td>
                  <td className="td">
                    {c.currentPlan
                      ? <span className="block truncate text-slate-300" title={c.currentPlan}>{c.currentPlan}</span>
                      : <span className="text-xs text-amber-200">Chưa có PA học thuật</span>}
                  </td>
                  <td className="td">{buoc ? <Task tone={buoc.tone}>{buoc.nhan}</Task> : <span className="text-xs text-slate-500">Đang theo dõi</span>}</td>
                  <td className="td text-center">
                    <MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, laLopThuong, s.timeline ?? []) })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hs.length > coCase.length && <p className="m-0 text-[11px] text-slate-500">{hs.length - coCase.length} học viên không có Case đang mở.</p>}
      {tt.panels}
    </div>
  );
}
```

- [x] **Step 6: `web/src/modules/students/ClassRoster.tsx` — chỉ còn FT.**
  - Import (dòng 1-10) thay bằng:

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Empty, ExamPlanText, Outcome, Skeleton, Status, Task, Th } from '../../ui/ui.tsx';
import { MenuDong } from '../../ui/MenuDong.tsx';
import { MissingBadge } from './MissingBadge.tsx';
import { CanhBaoYThuc } from '../classes/CanhBaoYThuc.tsx';
import { nhapDiemCua, useThaoTacDongHocVien, type QuyenDong } from '../classes/thaoTacDongHocVien.tsx';
import { fmtBand } from '../../lib/format.ts';
import { ENTRY_SKILL_LABEL, ENTRY_SKILL_SHORT, maHocVienNgan, skillShort, type EntrySkill, type ExamPlan } from '@shared/domain/index.ts';
```
  - `type RosterRow`: thêm `canhBaoYThuc: { count: number; oldestAgeDays: number; message: string } | null;`.
  - Dòng 48-49: `const FT_SKILLS = ['listening', 'reading', 'writing1', 'writing2', 'speaking'] as const;` (thứ tự L R W1 W2 S — đúng
    mockup 06, G-7); xoá `NORMAL_SKILLS`.
  - Chú thích đầu hàm (dòng 51-70) thay bằng:
    `/** TAB HỌC VIÊN · CHẾ ĐỘ ĐIỂM · LỚP FAST TRACK (đặc tả §3.7 "FT: như hiện có (đợt MT)", mockup 06). Lớp thường: BangDiemLopThuong. Mỗi ô điểm là 2–3 mốc (mới nhất trên cùng); ô trống là CHƯA NHẬP. */`
  - Chữ ký + hook (thay dòng 71-80):

```tsx
export function ClassRoster({ classId, quyen, onDoi, onAddStudents }: {
  classId: number; quyen: QuyenDong; onDoi: () => void; onAddStudents?: () => void;
}) {
  const { data, loading, error, reload } = useApi<RosterRow[]>(`/classes/${classId}/roster`, [classId]);
  const [depth, setDepth] = useState<2 | 3>(2);
  const tt = useThaoTacDongHocVien({ laLopThuong: false, quyen, onDone: () => { reload(); onDoi(); } });
```
    (`studentQuery` bỏ — trang danh sách không còn dùng `ClassRoster`.) Trong nhánh rỗng, tiêu đề `Empty` còn `'Lớp chưa có học viên'`.
  - Xoá `isRatio`, `skills`, `skillLabel` (dòng 102-108); thay bằng `const skills = FT_SKILLS;` và
    `const skillLabel = (k: string) => ENTRY_SKILL_SHORT[k as EntrySkill] ?? k;`.
  - Dòng 114-117: `Điểm của {depth} mốc gần nhất, mốc mới nhất ở trên.` (bỏ câu "Lớp Normal …").
  - Bảng: `<table className="w-full text-sm">` → `<table className="w-full min-w-[940px] table-fixed text-sm">` và ngay sau thêm

```tsx
          <colgroup>
            <col className="w-[22%]" /><col className="w-[6%]" /><col className="w-[9%]" /><col className="w-[7%]" /><col className="w-[6%]" />
            {skills.map((k) => <col key={k} className="w-[6%]" />)}
            <col className="w-[14%]" /><col className="w-12" />
          </colgroup>
```
  - Tiêu đề: bỏ mọi `!isRatio &&` / `isRatio ?` — giữ đúng nhánh FT (Target, Dự kiến thi, `Mốc`, OVR); tooltip kỹ năng
    `${ENTRY_SKILL_LABEL[k as EntrySkill] ?? k} ở từng mốc`; thêm `<th className="th"><span className="sr-only">Thao tác</span></th>` cuối.
  - Ô tên (dòng 166-169):

```tsx
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <Link className="link" to={`/hoc-vien/${s.id}`}>{s.fullName}</Link>
                      <span className="text-[10px] tabular-nums text-slate-500">{maHocVienNgan(s.studentCode)}</span>
                      <MissingBadge items={s.missing} gon />
                      <CanhBaoYThuc cb={s.canhBaoYThuc} />
                    </span>
```
  - Ô kỹ năng: chỉ `<Band … />` (bỏ nhánh `Ratio`); xoá hàm `Ratio` (dòng 277-297).
  - Sau `<td className="td"><FollowCell row={s} /></td>` thêm:

```tsx
                  <td className="td text-center">
                    <MenuDong muc={tt.mucCua({ id: s.id, ten: s.fullName, dangHoc: s.status === 'active', nhapDiem: nhapDiemCua(classId, false, s.timeline) })} />
                  </td>
```
  - Sau `</table></div>` (trước `</div>` ngoài cùng) thêm `{tt.panels}`.
  - `FollowCell` dòng 322: `pending.map((k) => ENTRY_SKILL_SHORT[k as EntrySkill] ?? k)` → `pending.map(skillShort)` (§6 chữ thô).
  - `KetLuan` giữ ("Đạt kỳ vọng" đúng cho FT). `export { Outcome };` giữ.
- [x] **Step 7:** bỏ chú thích hai dòng `TabHocVienLop` ở `ClassOverviewPage.tsx` (Task 11 Step 5). `npm run typecheck` xanh.
  `grep -rn "ClassRoster" web/src` → chỉ `TabHocVienLop.tsx` gọi.
- [x] **Step 8:** `npm run check` xanh (N+29).
- [x] **Step 9: Commit.**

```bash
git add web/src/modules/classes/TabHocVienLop.tsx web/src/modules/classes/BangDiemLopThuong.tsx web/src/modules/classes/BangCanHoTro.tsx web/src/modules/students/ClassRoster.tsx web/src/modules/classes/ClassOverviewPage.tsx server/src/tests/hocVienLop.tests.ts
git commit -m "PR-Qa (12): tab Học viên — Điểm (FT, lớp thường Giữa|Cuối khoá đúng/tổng) / Cần hỗ trợ; ⋯ dòng; nhãn cảnh báo Ý thức"
```

---

### Task 13: Web — tab Phân tích lớp + tab Ý thức & Phối hợp

**Files:**
- Create: `web/src/modules/classes/PhanTichLopTab.tsx`
- Modify: `web/src/modules/classes/ClassIssueBoard.tsx` — xoá hàm vỏ `ClassIssueBoard` (dòng 31-82, cả chú thích), đổi
  `function IssueTable` (dòng 84) thành `export function IssueTable`; bỏ import `issueBoardCategoriesFor`, `CASE_CATEGORY_SHORT`
  (giữ `caseCategoryLabel`).
- Modify: `web/src/modules/classes/ClassOverviewPage.tsx` — bỏ chú thích dòng `PhanTichLopTab` (Task 11 Step 5).

**Interfaces:**
- Consumes: `GET /classes/:id/phan-tich-lop` (Task 7), `IssueTable({ classId, category })`, `Th`.
- Tab Ý thức & Phối hợp: `ClassYThucCard` **giữ nguyên** (chỉ đặt vào tab — YT2 đợt 3 sửa nội dung).

- [x] **Step 1: `web/src/modules/classes/PhanTichLopTab.tsx`:**

```tsx
import { Fragment, useState } from 'react';
import { useApi } from '../../lib/useApi.ts';
import { ErrorState, Skeleton, Th } from '../../ui/ui.tsx';
import { IssueTable } from './ClassIssueBoard.tsx';

type PhanTich = {
  loai: 'ft' | 'thuong';
  dong: { key: string; nhan: string; tenDayDu: string; category: string }[];
  cot: { key: string; nhan: string }[];
  o: Record<string, { dat: number; tong: number }>;
  soHocVien: number;
};

/**
 * TAB PHÂN TÍCH LỚP (đặc tả §3.7, mockup 06; Q14). FT: 5 kỹ năng × MT1…MT5 — lớp tiến bộ hay đi lùi ở kỹ năng nào. Lớp thường:
 * 4 môn × Giữa khoá / Cuối khoá, ô "n/N HV đạt". Bấm một dòng mở bảng vấn đề hay gặp của kỹ năng đó ("mở dòng ra từng loại lỗi").
 * Ô dưới một nửa đạt tô đỏ nhạt; ô chưa ai có điểm là "—" (chưa có điểm KHÁC chưa đạt).
 */
export function PhanTichLopTab({ classId }: { classId: number }) {
  const { data, loading, error, reload } = useApi<PhanTich>(`/classes/${classId}/phan-tich-lop`, [classId]);
  const [mo, setMo] = useState<string | null>(null);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  if (loading || !data) return <Skeleton rows={5} />;
  const ft = data.loai === 'ft';
  const goiY = ft
    ? 'Mỗi ô: số học viên đạt kỳ vọng của đợt đó / số học viên đã có điểm kỹ năng đó. W1, W2 so từng bài với kỳ vọng. Bấm một dòng để xem vấn đề hay gặp.'
    : 'Mỗi ô: số học viên đạt (từ 70%) / số học viên đã có điểm môn đó. Bấm một dòng để xem vấn đề hay gặp.';

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] table-fixed text-sm">
        <colgroup><col className="w-40" />{data.cot.map((c) => <col key={c.key} />)}</colgroup>
        <thead>
          <tr>
            <Th hint={goiY}>{ft ? 'Kỹ năng' : 'Môn'}</Th>
            {data.cot.map((c) => <Th key={c.key} align="center">{c.nhan}</Th>)}
          </tr>
        </thead>
        <tbody>
          {data.dong.map((d) => (
            <Fragment key={d.key}>
              <tr className="row-hover cursor-pointer" aria-expanded={mo === d.key} onClick={() => setMo(mo === d.key ? null : d.key)}>
                <td className="td">
                  <span className="mr-1.5 text-slate-500" title={mo === d.key ? 'Thu gọn' : 'Mở rộng'}>{mo === d.key ? '▾' : '▸'}</span>
                  <abbr className="text-slate-100 no-underline" title={d.tenDayDu}>{d.nhan}</abbr>
                </td>
                {data.cot.map((c) => {
                  const o = data.o[`${d.key}|${c.key}`];
                  return (
                    <td key={c.key} className="td text-center tabular-nums">
                      {!o || o.tong === 0
                        ? <span className="text-slate-600">—</span>
                        : <span className={o.dat * 2 < o.tong ? 'text-rose-200' : 'text-slate-200'} title={`${o.dat}/${o.tong} HV đạt`}>
                            {ft ? `${o.dat}/${o.tong}` : `${o.dat}/${o.tong} HV đạt`}
                          </span>}
                    </td>
                  );
                })}
              </tr>
              {mo === d.key && (
                <tr><td className="td" colSpan={data.cot.length + 1}><IssueTable classId={classId} category={d.category} /></td></tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```
- [x] **Step 2:** sửa `ClassIssueBoard.tsx` như mục Files; `grep -rn "ClassIssueBoard\b" web/src` → không còn chỗ gọi vỏ cũ.
- [x] **Step 3:** `npm run typecheck` xanh.
- [x] **Step 4: Commit.**

```bash
git add web/src/modules/classes/PhanTichLopTab.tsx web/src/modules/classes/ClassIssueBoard.tsx web/src/modules/classes/ClassOverviewPage.tsx
git commit -m "PR-Qa (13): tab Phân tích lớp — kỹ năng × đợt, mở dòng ra vấn đề hay gặp"
```

---

### Task 14: Q13 — Thêm học viên hàng loạt rộng ~1440px, bỏ chữ "mặc định cho cả lô"

**Files:**
- Modify: `web/src/modules/students/IntakePanel.tsx:178, 211-216`

- [x] **Step 1:** dòng 178 `width="max-w-5xl"` → `width="max-w-[1440px]"`.
- [x] **Step 2:** dòng 211 `Tuần bắt đầu học — mặc định cho cả lô` → `Tuần bắt đầu học`.
- [x] **Step 3:** dòng 213-216 — ngày ISO `pv.defaultStartWeek` qua G-6: thêm `import { ngay } from '@shared/domain/index.ts';` và
  `import { useNgayNghiepVu } from '../../ui/ngayNghiepVu.ts';`, trong thân `const { homNay } = useNgayNghiepVu();`, rồi
  `` `Đang dùng tuần bắt đầu ${pv.defaultStartWeek}. …` `` → `` `Đang dùng tuần bắt đầu ${ngay(pv.defaultStartWeek, homNay)}. …` ``.
- [x] **Step 4:** `grep -n "cả lô" web/src/modules/students/IntakePanel.tsx` → không còn. `npm run typecheck` xanh.
- [x] **Step 5: Commit.**

```bash
git add web/src/modules/students/IntakePanel.tsx
git commit -m "PR-Qa (14): Thêm học viên hàng loạt rộng 1440px, bỏ chữ mặc định cho cả lô, ngày G-6"
```

---

### Task 15: Tài liệu — bảng định vị §4, CODE_MAP

**Files:**
- Modify: `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §4 (dòng 189, 191)
- Modify: `CODE_MAP.md`

- [x] **Step 1: §4 dòng "Chấm điểm"** (dòng 189) — cột "Nằm ở" thêm ` · ⋯ hộp lớp ở Học viên & Lớp` (Q6, G-12):
  `| Chấm điểm | Test › Cần chấm → lưới · nút Nhập điểm Test ở Hồ sơ lớp · ⋯ dòng HV · ⋯ hộp lớp ở Học viên & Lớp | GV môn đó, QL |` — đã có sẵn từ Q11 (thêm 22/09), không cần sửa.
- [x] **Step 2: §4 dòng "Hồ sơ GV"** (dòng 191) — thêm vào cuối cột "Nằm ở": ` (tên chỉ thành link khi PR-GV bật \`CO_TRANG_HO_SO_GIAO_VIEN\`)`.
- [x] **Step 3: CODE_MAP.md** — tìm các dòng về Học viên / lớp (`grep -n "StudentsPage\|ClassOverviewPage\|ClassRoster" CODE_MAP.md`),
  sửa/thêm để trỏ đúng:
  - `| **Học viên & Lớp** (một trang, nhóm theo lớp, chip lọc, Phạm vi) | web/src/modules/students/StudentsPage.tsx → BangHocVienLop.tsx | GET /hoc-vien-lop → server/src/classes/hocVienLop.ts |`
  - `| **Hồ sơ lớp** (đầu trang, 3 tab, ⋮) | web/src/modules/classes/ClassOverviewPage.tsx → DauTrangLop · TabHocVienLop · PhanTichLopTab | /classes/:id/overview · /roster · /phan-tich-lop · PATCH /thong-tin |`
  - `| Menu ⋯ dòng học viên (Hồ sơ · + Ghi nhận vi phạm · + Case · Nhập điểm) | web/src/modules/classes/thaoTacDongHocVien.tsx + shared/domain/hocVienLop.ts (mucMenuDongHocVien) | — |`
  - `| Luật hiển thị Học viên & Lớp (kết quả gần nhất, khoá, badge lớp, việc tiếp theo) | shared/domain/hocVienLop.ts | server/src/classes/dongHocVien.ts |`
- [x] **Step 4: Commit.**

```bash
git add docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md CODE_MAP.md
git commit -m "PR-Qa (15): bảng định vị §4 (Nhập điểm ở ⋯ hộp lớp, cách bật link hồ sơ GV), CODE_MAP"
```

---

### Task 16: KIỂM bấm thử 4 vai × 1440px / 375px × lớp FT / lớp thường

**Files:** ảnh `thiet-ke/anh/pr-qa/` (tạo thư mục). Không sửa mã (thấy lỗi → sửa ở task tương ứng, commit riêng, ghi Nhật ký).

- [x] **Step 1: Bật máy dev trong worktree, cổng 4137 / 5337** (không dùng `preview_start` — nó chạy mã của thư mục chính; không
  dùng 4000/5173):
  1. `npm run seed` (database riêng của worktree).
  2. Nền: `PORT=4137 node dist-server/server/src/index.js` (sau `npm run build:server`).
  3. Chép file cấu hình Vite TẠM vào gốc worktree `vite.qa.config.ts` (root = thư mục worktree, alias `@shared` → `shared`,
     `server: { port: 5337, strictPort: true, proxy: { '/api': { target: 'http://127.0.0.1:4137', changeOrigin: true } } }`), chạy nền
     `npx vite --config vite.qa.config.ts`. **Không commit** file này; xoá sau khi KIỂM xong.
  4. Đăng nhập bằng `fetch('/api/demo/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: N }) })`
     trong trang (trình duyệt gắn sẵn, `http://localhost:5337`). Vai: **Quản trị = 1**, **QL chi nhánh Nguyễn Khánh Vy = 2**,
     **GVCN Trần Ngọc Hà = 7** (GVCN MB-FT 101 và MB-FOU 12), **GVBM Phạm Thu Trang = 9** (Speaking).
  5. Chụp ảnh: `npm i --no-save playwright` + `chromium.launch({ channel: 'chrome' })` (Chrome có sẵn, không tải trình duyệt), chạy
     script từ Git Bash với `MSYS_NO_PATHCONV=1`. Trang cuộn trong `<main>` → chụp cả trang = nới chiều cao khung theo `main.scrollHeight`.
     Tên ảnh `{vai}-{man}-{ft|thuong}-{1440|375}.png` (vai: `qt`, `ql`, `gvcn`, `gvbm`).
- [x] **Step 2: Chuẩn bị một dữ liệu cho YT-8.** Là GVCN (7), vào hồ sơ lớp MB-FT 101 › Ý thức & Phối hợp › + Ghi nhận vi phạm cho một
  em, ngày cách đây 7 ngày. (DB của worktree, không phải bản chính.)
- [x] **Step 3: KIỂM — Quản trị (1), 1440px.** Ghi ✓/✗ + ảnh:
  1. Tab trình duyệt ghi **PISA Progress** (`document.title`).
  2. `/hoc-vien`: tiêu đề **Học viên & Lớp**; ô tìm; **Phạm vi: Tất cả** mặc định, có "Chi nhánh"; chọn Chi nhánh → hiện ô chọn chi
     nhánh (nếu > 1); **Xếp: Tên A→Z**; 6 chip có số; **không còn** cặp nút Tôi / Tất cả, dải tab chi nhánh, nút "Theo lớp".
  3. Hộp lớp: ▸ · mã (gạch chấm) · chương trình · n học viên · GVCN tên (**chữ thường, không phải link**) · tối đa 2 badge (+n có
     tooltip) · ⋯ (Hồ sơ lớp · Nhập điểm Test · + Học viên). Lớp đầu tiên mở sẵn.
  4. Mở MB-FT 101: 6 cột **Học viên · Kết quả gần nhất · Mục tiêu · Case · Việc tiếp theo · ⋯**; mã 6 số mờ; kết quả dạng "6.0 Thiếu 0.5
     SOS 1" + dòng phụ "MT2 · kỳ vọng 6.5 · Thiếu L 5.5"; em đạt có ✓ nhỏ; cột số canh phải, hàng cao đều (G-2).
  5. Mở MB-FOU 12: cột **Khoá** "FOU · W{n}/8" + "kết thúc W{n} {THÁNG}"; kết quả "Đạt 3/4 môn" + "Giữa khoá · chưa đạt W 12/20";
     **không** có "MT", "kỳ vọng", "Progress", "Final", "Normal", ngày ISO (`get_page_text` + regex `/\d{4}-\d{2}-\d{2}|Progress|Final|Normal/`).
  6. Bấm từng chip: số trên chip = số dòng hiện ra (đếm các lớp đang mở); lớp không còn em thì ẩn. Gõ tên một em → chỉ lớp của em
     hiện, tự mở, chỉ dòng của em. Gõ mã lớp → cả lớp.
  7. Link cũ: `/hoc-vien?view=sos` (chip Đang SOS sáng) · `/hoc-vien?view=case_no_plan&branchId=1` · `/hoc-vien?view=missing_scores`
     → `/test/can-cham` · `/hoc-vien?view=case_working&open={id MB-FT 101}`.
  8. ⋯ cuối một dòng: **Hồ sơ · + Ghi nhận vi phạm · + Case · Nhập điểm …** (không có Lộ trình tiếp theo, Chuyển lớp). + Case mở
     form đã chọn sẵn em; + Ghi nhận vi phạm mở ngăn của em; mở cái này thì cái kia đóng (G-8). Menu ở dòng cuối không bị cắt.
  9. Hồ sơ lớp MB-FT 101 (`/hoc-vien/lop/{id}`): "Hồ sơ lớp" + "MB-FT 101 · Fast Track"; nút **Lộ trình lớp · + Case · + Học viên ·
     Nhập điểm Test · ⋮**; **không** có Chuyển tiếp lớp; ⋮ = **Sửa phân công · Sửa thông tin lớp**; dòng "chi nhánh · LT · n học viên ·
     khai giảng dd/mm/yyyy" + hộp **GVCN Trần Ngọc Hà**; dòng GV bộ môn **một dòng** "L · R Trần Ngọc Hà  W1 …  W2 …  S …", rê chuột
     vào "L · R" ra "Listening · Reading"; tối đa 2 badge; bấm "n Case đang mở" → chế độ Cần hỗ trợ.
  10. Ba tab **Học viên · Ý thức & Phối hợp · Phân tích lớp**; không có tab Giáo viên; `?tab=giao-vien` → tab Học viên. Tab Ý thức có
      ⚠ (dữ liệu Step 2). Tab Học viên: **Điểm / Cần hỗ trợ**; Điểm FT: cột L R W1 W2 S, Gọn/Đầy đủ, ⋯; em ở Step 2 có nhãn
      **⚠ 1 vi phạm** (tooltip câu đầy đủ). Cần hỗ trợ: dòng "n học viên · m Case đang mở" (m = số trên badge), mỗi em một dòng.
  11. Phân tích lớp: FT 5 dòng × MT1…MT5, ô `n/N`; bấm một dòng mở bảng vấn đề; ⓘ ở cột đầu.
  12. Hồ sơ lớp MB-FOU 12: nút **Lịch kiểm tra · Chuyển tiếp lớp · …**; Điểm: hai nhóm **Giữa khoá | Cuối khoá** × L R W S, ô `đúng/tổng`
      đỏ khi chưa đạt, ô chưa có điểm ghi `W{n} {THÁNG}`; Phân tích: 4 dòng × Giữa khoá / Cuối khoá, ô "n/N HV đạt".
  13. Lịch kiểm tra mở panel tiêu đề **Lịch kiểm tra**, chữ "Giữa khoá / Cuối khoá", ngày `W{n} {THÁNG}` (không "Progress", không ISO).
  14. ⋮ › Sửa thông tin lớp: đổi mã MB-FOU 12 → "MB-FOU 12A" → lưu → đầu trang đổi; đổi lại "MB-FOU 12". Ô Chương trình bị khoá kèm câu
      giải thích (lớp có học viên). Gõ mã "FOU 12" → toast lỗi "Mã lớp phải bắt đầu bằng "MB-"…".
  15. + Học viên mở ngăn thêm hàng loạt rộng gần hết 1440px; nhãn "Tuần bắt đầu học" (không "mặc định cho cả lô").
- [x] **Step 4: KIỂM — QL chi nhánh (2), 1440px.** Phạm vi mặc định Chi nhánh (hoặc Lớp tôi dạy nếu QL có dạy); chỉ lớp MB; hộp lớp
  ⋯ đủ 3 mục; hồ sơ lớp đủ nút như Quản trị; ⋮ đủ hai mục; Sửa phân công mở `TeacherAssignDialog` cũ và lưu được.
- [x] **Step 5: KIỂM — GVCN Trần Ngọc Hà (7), 1440px.** Phạm vi mặc định **Lớp tôi dạy**, chỉ lớp mình dạy; "Việc tiếp theo" có
  "Nhập điểm L, R · MT…" (việc CỦA MÌNH); hồ sơ lớp: **+ Case · + Học viên · Nhập điểm Test**, không có Lộ trình lớp / Lịch kiểm tra,
  Chuyển tiếp lớp, ⋮ (nếu GVCN không có `class.edit`/`class.assign`); menu ⋯ dòng có + Ghi nhận vi phạm; bảng điều khiển trình duyệt
  không có lỗi 403 đỏ.
- [x] **Step 6: KIỂM — GVBM Phạm Thu Trang (9), 1440px.** Chỉ lớp mình dạy; ô Phạm vi ẩn nếu chỉ một lựa chọn; hồ sơ lớp **không**
  có + Học viên, Lộ trình lớp, ⋮; có + Case (nếu có quyền báo Case), Nhập điểm Test; menu ⋯ dòng: Hồ sơ · + Ghi nhận vi phạm · + Case ·
  Nhập điểm (chỉ khi em còn bài Speaking chờ chấm); tên đồng nghiệp ở dòng GV bộ môn là chữ thường.
- [x] **Step 7: KIỂM — điện thoại 375×812** (Quản trị, QL, GVCN, GVBM — ít nhất `/hoc-vien`, hồ sơ lớp FT tab Học viên, hồ sơ lớp
  thường tab Học viên, tab Phân tích lớp):
  1. `document.documentElement.scrollWidth <= 375` ở mọi màn trên; bảng cuộn ngang **trong thẻ** (G-11).
  2. Hộp lớp xuống dòng gọn, badge không đè tên; chip cuộn ngang trong hàng của nó.
  3. Dòng GV bộ môn chỉ 2 nhóm + "+k"; bấm "+k" ra đủ danh sách; không xuống hàng khi chưa bấm.
  4. Menu ⋯ ở dòng cuối cùng mở **lên trên**, nằm **trên** thanh dưới 4 nút; menu thông báo/tài khoản ở đầu trang phủ lên thanh dưới
     (thanh dưới z-30). Ngăn trượt (+ Case) phủ thanh dưới; toast hiện trên thanh dưới.
  5. Hàng nút đầu hồ sơ lớp xuống dòng, không tràn; tab cuộn ngang trong hàng tab.
- [x] **Step 8:** Lưu ảnh vào `thiet-ke/anh/pr-qa/`. Tắt API/Vite, xoá `vite.qa.config.ts`, gỡ playwright khỏi `node_modules`
  (`npm prune`), kiểm `git status` không còn file tạm. Xác nhận không còn tiến trình nghe 4137/5337.
- [x] **Step 9:** `npm run check` xanh lần cuối; số phép kiểm ≥ mốc Task 0 + 29. Ghi Nhật ký (✓/✗ từng mục, lỗi đã sửa ở commit nào).
- [x] **Step 10: Commit.**

```bash
git add thiet-ke/anh/pr-qa
git commit -m "PR-Qa (16): ảnh KIỂM bốn vai, 1440px và 375px, lớp FT và lớp thường"
```

**Nhật ký thực thi (Task 16, KIỂM bấm thử):**

Máy dev bật đúng cổng 4137 (API)/5337 (Vite) trong worktree, không đụng bản chính. Đăng nhập bằng
`POST /api/demo/session` cho 4 vai (1, 2, 7, 9). Chụp 15 ảnh 1440px/375px vào `thiet-ke/anh/pr-qa/` bằng Playwright
Chrome tạm thời (gỡ sau khi xong). Kiểm bằng cả ảnh và `get_page_text`/`read_page`/DOM (regex chữ cấm G-6) qua trình
duyệt gắn sẵn.

- Step 3 (Quản trị, 15 mục): ✓ tất cả. Chi tiết đáng chú ý: mục 3.5/3.12/3.13 quét regex `\d{4}-\d{2}-\d{2}|Progress|Final|Normal|kỳ vọng`
  trên `MB-FOU 12` và panel Lịch kiểm tra — sạch. Mục 3.9 xác nhận `<abbr title="Listening · Reading">` đúng khi rê chuột "L · R";
  ⋮ đúng "Sửa phân công · Sửa thông tin lớp"; bấm "11 Case đang mở" chuyển đúng sang chế độ Cần hỗ trợ. Mục 3.11 (Phân tích lớp):
  bấm dòng mở đúng bảng vấn đề; ⓘ trong đặc tả (Q14) hiện dưới dạng thuộc tính `title` thường (không có glyph ⓘ riêng) — cùng quy ước
  với TOÀN BỘ 15 task trước (không có icon ⓘ riêng ở bất kỳ đâu trong `web/src`), nên không coi là lỗi riêng của task này, chỉ ghi
  nhận để Task 17 cân nhắc. Mục 3.14: đổi mã lớp MB-FOU 12 → 12A → lưu → đổi lại; toast lỗi đúng câu khi gõ "FOU 12" thiếu tiền tố "MB-".
  **Mục 3.15 phát hiện LỖI THẬT** (xem bên dưới) — đã sửa.
- Step 4 (QL chi nhánh Nguyễn Khánh Vy): ✓. Riêng "Nhập điểm Test" KHÔNG hiện ở hồ sơ lớp cho QL (khác mô tả brief "đủ nút như
  Quản trị") — đã tra `server/src/permissions.ts` + `server/src/tests/run.ts:699-701`: đây là hành vi ĐÚNG THEO THIẾT KẾ đã có phép
  kiểm tường minh ("Quản lý không có đường nhập bù điểm", chỉ Quản trị hệ thống mới nhập bù được) — không phải lỗi, không sửa. ⋮ đủ
  "Sửa phân công · Sửa thông tin lớp"; mở `TeacherAssignDialog`, đổi rồi Lưu → toast "Đã lưu phân công".
- Step 5 (GVCN Trần Ngọc Hà): ✓. Mặc định chỉ 2 lớp mình dạy (MB-FOU 12, MB-FT 101), không có ô Phạm vi/Chi nhánh. Hồ sơ lớp chỉ
  "+ Case · + Học viên · Nhập điểm Test", không ⋮. "Việc tiếp theo" đúng việc của mình (Nhập điểm L, R). Console không có lỗi 403.
- Step 6 (GVBM Phạm Thu Trang): ✓. Hồ sơ lớp chỉ "+ Case · Nhập điểm Test", không + Học viên/Lộ trình lớp/⋮. Menu ⋯ dòng học viên còn
  bài Speaking chờ chấm có thêm "Nhập điểm MT…"; dòng không còn bài chỉ có "Hồ sơ · + Ghi nhận vi phạm · + Case". Tên đồng nghiệp ở
  dòng GV bộ môn là chữ thường, không phải link.
- Step 7 (375×812, 4 vai): ✓. `scrollWidth` luôn 375 ở mọi màn đã kiểm; bảng cuộn ngang trong thẻ; dòng GV bộ môn gọn 2 nhóm + "+k",
  bấm "+k" ra đủ danh sách; menu ⋯ dòng cuối mở lên trên, trên thanh dưới 4 nút; ngăn "+ Case" phủ kín thanh dưới; hàng nút đầu hồ sơ
  lớp xuống dòng gọn, tab cuộn ngang trong hàng tab.

**Lỗi thật phát hiện và đã sửa (commit riêng):**

1. `web/src/modules/students/IntakePanel.tsx` (thuộc Task 14) — ô "Tuần bắt đầu" của từng dòng trong ngăn + Học viên hàng loạt hiện
   placeholder theo **ISO thô** (`2026-07-27`) thay vì định dạng G-6 (`27/07`), vi phạm "Ngày không bao giờ hiện dạng ISO". Nguyên
   nhân: dùng thẳng `pv.defaultStartWeek` (chuỗi ISO từ máy chủ) làm `placeholder` thay vì qua hàm `ngay()` như dòng gợi ý ngay phía
   trên đã làm đúng. Sửa: bọc qua `ngay(pv.defaultStartWeek, homNay)`. Đã xác nhận lại trên trình duyệt: placeholder đổi thành "27/07".
   Commit: xem SHA bên dưới, message `PR-Qa (16): sửa lỗi phát hiện khi KIỂM — ...`.

**Không tìm thấy lỗi nào khác cần sửa.** Mọi mục ✗ ban đầu (QL thiếu "Nhập điểm Test") sau khi tra code + test hiện có đều xác
định là hành vi đúng theo thiết kế, không phải lỗi.

`npm run check`: **787/787 kiểm tra đạt**, `typecheck` xanh (không đổi so với mốc trước Task 16 vì đây là task KIỂM, không thêm bớt
phép kiểm). Đã dọn sạch: tắt cả 2 tiến trình dev (API 4137, Vite 5337), xoá `vite.qa.config.ts` và `scripts-tmp-qa/`, `npm prune` gỡ
playwright, `git status` sạch trước khi commit.

---

### Task 17: Rà soát, rebase main mới nhất, mở PR (không tự merge)

- [x] **Step 1:** superpowers:requesting-code-review — người rà **Opus 5** (khác model người code) rà `git diff origin/main...HEAD`,
  nhấn vào: (a) nút/mục menu nào hiện ra mà máy chủ từ chối (403) hoặc bấm không làm gì; (b) số chip / số "Case đang mở" có khớp
  danh sách mở ra; (c) chữ lớp thường (không MT, kỳ vọng, Progress/Final, Normal) và G-6 (không ISO); (d) có chạm file của PR-AN /
  PR-S2 / PR-Pa (bảng ranh giới) không; (e) `ngay`/`tuanLich`/`shortDate` giữ chữ ký; (f) hiệu năng `GET /hoc-vien-lop` (không truy vấn
  theo từng em). Xử lý theo superpowers:receiving-code-review; ghi Nhật ký.
- [x] **Step 2: Rebase main mới nhất.** `git fetch origin && git rebase origin/main`. Xung đột dự kiến và cách gỡ:
  - `server/src/tests/run.ts` (khối cuối) → giữ **mọi** khối (PR-AN/S2/Pa) và khối PR-Qa, khối PR-Qa đứng cuối trước dòng in tổng kết.
  - `server/src/routes/index.ts` → giữ mọi import và mọi khối route của cả hai bên.
  - `shared/domain/index.ts` → giữ mọi dòng `export *`.
  - `shared/domain/hienThiNgay.ts` / `display.ts` → PR-Qa sở hữu; nếu PR khác đã sửa, 🛑 hỏi trước khi chọn bên.
  - PR-S2/AN có migrate → chạy `npm run migrate` trên **bản sao** DB dev nếu cần seed lại; không đụng DB bản chính.
  Sau rebase: `npm ci` (nếu `package-lock.json` đổi), `npm run check` xanh, ghi số phép kiểm.
- [ ] **Step 3:** superpowers:finishing-a-development-branch — `git push -u origin pr-qa-hoc-vien-lop --force-with-lease`, mở PR
  **không draft** bằng `gh pr create`, tiêu đề `PR-Qa · Học viên & Lớp + Hồ sơ lớp`. Thân PR: phạm vi (§3.6, §3.7, Q1–Q5, Q10–Q13,
  K2-6a, YT-8, ba nợ PR-O), bảng Q1–Q21 "chỗ tự quyết", "Không migrate; 3 route mới: `GET /hoc-vien-lop`,
  `GET /classes/:id/phan-tich-lop`, `PATCH /classes/:id/thong-tin`", việc để lại cho PR sau (PR-LT bật `MENU_DONG_CHO_PR_LT` + dữ liệu
  "tiếp theo: …" cho `khoaLopThuong`; PR-GV bật `CO_TRANG_HO_SO_GIAO_VIEN`; PR-Rc1 quyết badge "bài chưa chấm" trên hộp lớp), số phép
  kiểm, link ảnh KIỂM, model thật đã code và model rà. Cuối thân: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  **Không tự merge.** Báo chủ sản phẩm link PR.

---

## Chỗ plan đã tự quyết (tóm tắt cho người rà — chi tiết ở bảng Q1–Q21)

1. Không migrate; ba route mới "chỉ thêm khối".
2. Menu ⋯ dòng HV hiện Hồ sơ · + Ghi nhận vi phạm · + Case · Nhập điểm; Lộ trình tiếp theo và Chuyển lớp ẩn bằng một hằng tới PR-LT.
3. Tên GV là chữ thường tới khi PR-GV bật một hằng; luật quyền xem hồ sơ GV đã có sẵn trong hàm.
4. Phạm vi: Lớp tôi dạy / Chi nhánh (một chi nhánh) / Tất cả — chỉ hiện lựa chọn có nghĩa; phạm vi quyết luôn cách đếm bài chưa chấm.
5. Chip lọc học viên thay các hàng đợi cũ; khoá URL cũ giữ nguyên.
6. "Sửa thông tin lớp" đổi chương trình chỉ khi lớp trống.
7. Nhập điểm Test ở ⋯ hộp lớp, cập nhật §4.
8. `CLASS_PHASE_LABEL` đổi sang chữ lớp thường ở một chỗ.

## Nhật ký thực thi

*(Người thực thi ghi sau mỗi task: model thật, số phép kiểm, điều bất ngờ, chỗ phải tự quyết.)*

- **Task 0:** Model thật: Sonnet 5. Worktree tạo bằng `EnterWorktree` (native), nhánh tự sinh `worktree-pr-qa-hoc-vien-lop` được
  đổi tên lại đúng `pr-qa-hoc-vien-lop` (`git branch -m`), base ref khớp `origin/main` @ `67e79c5` (đã có PR-AN #63, PR-S1, spec #60,
  #61, #62 — sau mốc `7843875` của plan nhưng `git diff 7843875..HEAD --stat` trên các file PR-Qa sở hữu **không có gì** nên số dòng
  trong plan vẫn đúng). Biến Turso: sạch. `npm ci` xong (325 packages). `npm run check`: **TẤT CẢ 757 KIỂM TRA ĐỀU ĐẠT**, typecheck
  xanh — mốc N = 757. Xác nhận đủ 9 file spec/kiểm kê/mockup/thuật ngữ tồn tại. Không có Q nào lệch đặc tả ở bước đọc. Sẵn sàng
  Task 1.

- **Task 1:** Model thật: Sonnet 5. Tám bước làm theo đúng thứ tự, đúng code mẫu trong task brief (đã chép nguyên). Bước 2 (đỏ):
  757 đạt, đúng 2 phép kiểm PR-Qa mới ✗ như dự tính. Sau khi sửa `display.ts` (`ngayTheoGioVN`, `shortDate`) và `hienThiNgay.ts`
  (`ngay`, `tuanLich` đi qua `ngayTheoGioVN`) và cập nhật phép kiểm PR-O cũ ở `khung.tests.ts:15` — `npm test`:
  **TẤT CẢ 759 KIỂM TRA ĐỀU ĐẠT** (N+2 = 759, đúng mốc). Phép kiểm cũ `deadlineView`/`shortDate`/`businessDateText` (`run.ts`
  ~7900-7960) và PR-O `khung.tests.ts` vẫn xanh. `npm run check` xanh (build + test + typecheck), thoát mã 0. Điều bất ngờ duy
  nhất: khối PR-AN đã được chèn vào giữa khối PR-O và dòng `console.log` cuối `run.ts` (không có ở lúc viết brief) — tự quyết đặt
  khối `PR-Qa` ngay sau `await runKhungTests(...)` và trước khối PR-AN, giữ đúng ý "ngay sau khối PR-O" mà không chèn giữa PR-AN.
  Không có Q nào lệch đặc tả. Sẵn sàng Task 2 (PR-Pa dùng `ngay`/`tuanLich`/`tuanKhoa`/`shortDate` không cần đổi gì thêm).

- **Task 17 (fix sau rà soát cuối):** Model thật: Sonnet 5. Vòng sửa 2 lỗi Important do rà soát TOÀN NHÁNH cuối cùng (model
  Opus) tìm ra, TRƯỚC khi mở PR — không phải một task mới, phạm vi đúng 2 finding, không mở rộng. Báo cáo đầy đủ:
  `.superpowers/sdd/2026-09-22-pr-qa-hoc-vien-lop/task-17-fix-report.md`.
  - **Điểm a (nút đầu trang ra 403):** `can(PERMISSIONS.STUDENT_EDIT)` phía client (không ngữ cảnh branchId/classId) khiến nút
    "+ Lớp mới"/"+ Học viên" luôn hiện dù GVCN/GVBM bấm vào chắc chắn 403 (`hasAssignment` đòi `ctx.classId` cụ thể). Sửa:
    "+ Học viên" đổi sang `(data?.rows ?? []).some((r) => r.viewer.coTheSuaHocVien)` (cờ đã có sẵn theo từng lớp, thuần web);
    "+ Lớp mới" thêm cờ mới `coTheTaoLop` từ máy chủ (`server/src/classes/hocVienLop.ts` — kiểm `STUDENT_EDIT` theo TỪNG chi
    nhánh người xem thấy được), web đổi sang `data?.coTheTaoLop`, bỏ hẳn `can(PERMISSIONS.STUDENT_EDIT)` và import
    `PERMISSIONS` khỏi `StudentsPage.tsx`.
  - **Điểm b (Q5/G-10, badge "n Case đang mở" không khớp "Cần hỗ trợ"):** `soCaseMoTheoLop` (`dongHocVien.ts`) đổi từ đếm SQL
    thô (không lọc quyền) sang tính dựa trên `listCases(p, {})` (một lời gọi, cùng nguồn mà "Cần hỗ trợ" dùng), gom lại theo
    lớp ĐANG HỌC hiện tại của từng em; thêm `p` vào chữ ký, cập nhật 2 nơi gọi (`hocVienLop.ts`, `classes.ts:610`).
  - **Nợ để lại (KHÔNG sửa, ngoài phạm vi PR-Qa):** nguyên nhân gốc ở `server/src/cases/cases.ts:1789` — bộ lọc quyền của
    `listCases` dùng `eff_class_id = COALESCE(a.class_id, cur.class_id)` (lớp LÚC ĐÁNH GIÁ trước), trong khi WHERE lọc theo
    `classId` của CHÍNH hàm đó (dòng 1688) lại đúng dùng `COALESCE(cur.class_id, a.class_id)` (lớp HIỆN TẠI trước) — hai công
    thức khác thứ tự COALESCE trong cùng một hàm. `cases.ts` thuộc PR-S2/PR-AN, nằm trong bảng ranh giới file cấm sửa của
    PR-Qa — đã ghi chi tiết và đề nghị hướng sửa vào báo cáo Task 17 để route sang người sở hữu file đó.
  - **Test mới:** 2 phép kiểm ở `hocVienLop.tests.ts` (điểm a: `coTheTaoLop` đúng `true`/`false` theo 4 vai; điểm b: tái hiện
    kịch bản em chuyển lớp A→B, Case gắn bài Test cũ ở A, GV chỉ dạy B — badge và "Cần hỗ trợ" phải khớp nhau, cả hai `= 0`).
    2 phép kiểm CŨ của Task 5/Task 6 (so `soCaseMo` với tổng cột Case của `classRoster`) vẫn xanh, KHÔNG phải chỉnh gì — vì cả
    hai đều dùng `P.admin`, và `can()` của Quản trị hệ thống luôn `true` bất kể ngữ cảnh nên việc đổi nguồn đếm không đổi kết
    quả với vai này. `npm run check`: **TẤT CẢ 811 KIỂM TRA ĐỀU ĐẠT** (809 + 2 mới), `typecheck` xanh. Không đụng `cases.ts`
    hay file cấm nào khác trong bảng ranh giới.

- **Task 2–16 (tóm tắt):** Model thật: Sonnet 5 cho toàn bộ 16 task implementer + reviewer theo từng task (dùng skill
  superpowers:subagent-driven-development, mỗi task một implementer subagent + một task reviewer riêng, đúng quy trình).
  Lịch sử thi hành đầy đủ từng task (commit SHA, kết quả review, fix round nếu có) nằm ở ledger SDD:
  `.superpowers/sdd/2026-09-22-pr-qa-hoc-vien-lop/progress.md` — bao gồm 2 fix round trong quá trình code (Task 5: cờ
  `coTheNhapDiem` đổi sang `editableSkills()`/`can()` thật thay vì đọc thẳng phân công; Task 8: bổ sung phép kiểm cho
  nhánh kết thúc phân công GV khi đổi chương trình) và 1 fix round tài liệu (Task 15: dọn dòng cũ/trùng CODE_MAP.md).
  Mọi task đều qua review Approved trước khi sang task kế tiếp; số phép kiểm tăng dần từ 757 (Task 0) lên 809 sau Task 16.

- **Task 17 Step 1 (rà soát toàn nhánh cuối cùng):** Model rà: **Opus 5** (khác Sonnet 5 của người code, đúng chốt ở đầu
  plan). Phạm vi: `61ae2dd..8dabfcd` (20 commit, sau khi rebase lên `origin/main` mới nhất — main đã có PR-S2 merge).
  Kết quả lần 1: "gộp được, nhưng phải sửa trước" — 2 Important (đã sửa, xem mục "Task 17 (fix sau rà soát cuối)" phía
  trên), không Critical. Sáu điểm (a)-(f) bắt buộc: (a) ban đầu có lỗi (đã sửa), (b) ban đầu có lỗi (đã sửa), (c)/(d)/(e)/
  (f) đạt ngay từ đầu. Sau 1 fix round, re-review (Opus, tự chạy lại `npm run check` xác nhận 811/811): **All findings
  addressed**. Các Minor (9 mục ở lần rà đầu + 2 mục mới sau fix) và vấn đề của chính kế hoạch (Q5 không nói rõ nguồn dữ
  liệu "Cần hỗ trợ") đã park theo ruling, không chặn PR — xem chi tiết trong `.superpowers/sdd/.../progress.md`.
  Ghi chú của người rà cuối: mục Nhật ký thực thi này trước khi bổ sung chỉ có Task 0/1/16/17 — các task 2-15 đã được
  code/review đầy đủ (xem ledger SDD) nhưng không phải task nào cũng tự chép lại vào file plan này; đã bổ sung tóm tắt ở
  trên để người đọc plan không phải mở file ledger riêng mới biết đã có review.
