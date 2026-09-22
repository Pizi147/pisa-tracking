# PR-Pa · Tổng quan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task, in order. Steps use checkbox (`- [ ]`) syntax — tick
> each one in THIS file as you finish it. Tasks marked 🛑 are **gates**: stop, report to the owner, wait.

| Mục | Chốt |
|---|---|
| Model khuyến nghị | **Fable 5.1 · High** |
| Phương án B | **Opus 5 · High** |
| Subagent | **Cùng model với session** (Fable 5.1 hoặc Opus 5 nếu chạy phương án B). **KHÔNG dùng Haiku** cho bất kỳ subagent nào |
| Người rà soát | **Opus 5** (khác model người code). Nếu người code là Opus 5 (phương án B) thì người rà là **Fable 5.1** — ghi rõ vào Nhật ký |
| Số PR | **Một PR**, nhánh `pr-pa-tong-quan`, không draft, **không tự merge** |
| Đợt | **Đợt 2**, chạy **song song PR-Qa và PR-S2**. Xem "Ranh giới với PR chạy song song" |
| Migrate | **Không có** (không đổi `schema.sql` / `migrate.ts`) |

**Goal:** Làm lại màn Tổng quan theo §3.2: Quản lý có thanh ngữ cảnh (Lớp thường / Fast Track / Cả hai · chi nhánh ·
"Dữ liệu đến {ngày}"), 4 ô số, khối **Cần xử lý** cạnh **Điểm đáng chú ý**, **Lịch sắp tới** thu gọn, bảng **Theo chi
nhánh** mở xuống lớp; Giáo viên có **Việc cần làm của tôi** gom 4 nhóm và **Học viên cần hỗ trợ**; dòng tín hiệu SOS lớp
thường có hai nút **Tạo Case** (form điền sẵn điểm) / **Bỏ qua** (một bấm, lý do không bắt buộc); trả hai món nợ sau rà
PR-S1 (#56).

**Architecture:** Mọi luật thuần (tham số chương trình, ánh xạ 12 loại việc → 4 nhóm, thứ tự dòng Cần xử lý, luật chọn
Điểm đáng chú ý) nằm ở một file mới `shared/domain/tongQuan.ts` để harness máy chủ kiểm được. **Mọi con số** trên Tổng
quan đi qua **một hàm tập ID** (`metricSet` ở `server/src/worklist/metrics.ts`, hợp đồng số liệu luật 1): bộ lọc chương
trình được thêm **một lần** trong `metricSet` (file mới `server/src/worklist/chuongTrinh.ts` biết mỗi phần tử thuộc lớp
nào); ba chỉ số mới vào sổ để mỗi dòng Cần xử lý là một chỉ số. Hai module máy chủ mới — `worklist/tongQuan.ts` (Cần xử lý,
Điểm đáng chú ý, Học viên cần hỗ trợ) và `worklist/bangChiNhanh.ts` (bảng chi nhánh → lớp, kèm đường mở danh sách từng ô)
— chỉ **gọi** `metricSet` và **chia** tập, không đếm lại. Web: `<SoLieu>` tách phần "mở danh sách" ra để ô số, số trong
bảng và dòng Cần xử lý dùng chung; Tổng quan QL và GV dựng từ các component mới nhỏ.

**Tech Stack:** TypeScript 5.9 · React 18.3 + react-router-dom 6.28 · Vite 5 · Tailwind 3.4 (lớp tuỳ ý phải là **chuỗi
tĩnh**) · Express 4 · `libsql` (SQLite khi dev, Turso khi bản chính) · harness tự viết `server/src/tests/run.ts`
(`check` / `assert` / `assertThrows` — **không phải** Jest, **không có bộ lọc**: luôn chạy cả bộ, tìm tên phép kiểm trong
kết quả).

**Spec:** `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` (§1 G-1…G-12 — nhất là G-10; §2; §3.2;
§3.10; §4 dòng "Tín hiệu SOS lớp thường"; §5 dòng S1, 4.1, 4.2; §7 dòng **Pa** kể cả "Nợ sau rà S1 (#56)") · việc có mã:
`docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md` §1.3 (P1–P6, P6b, P6c), §3 (#3, #13, #17), §5.2 · thân PR #56
mục "Chuyển cho PR-Pa" · mockup: `thiet-ke/mockup/02-tong-quan.html` (**QL phương án A**; bản GV), `04-cong-viec.html`
(kiểu gom nhóm), `10b-lop-thuong-v2.html` §5, `12-ban-do-vi-tri.html` (khối D) · chữ: `thiet-ke/THUAT_NGU_DA_CHOT.md`
(g1-052/053, g3-006/007/020, g8-070, g11-038…041, g12-002…022, g12-016…019, g12-028, g14-005, g6-116) · số liệu:
`thiet-ke/HOP_DONG_SO_LIEU.md` §1, §3 · bố cục gốc: `thiet-ke/PISA-Design-Plan-after-PR28.md` §4.1 (thứ tự ưu tiên việc),
§18.2.

**Số dòng trong plan này** đo trên `main` @ `7843875` (22/09/2026, sau PR-O #58, PR-S1 #56, #59, #60). Trước khi sửa, mở
file xem lại — lệch vài dòng là bình thường; **lệch nội dung** thì 🛑 hỏi.

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
| G-6 | Ngày không bao giờ hiện dạng ISO. Ngày: `dd/mm` (cùng năm) hoặc `dd/mm/yyyy`. **Tuần lịch: `W{n} {THÁNG}`**. **Tuần học trong khoá: `W{n}/{tổng}`**. Dùng hàm chung `ngay`, `tuanLich`, `tuanKhoa` (`shared/domain/hienThiNgay.ts`). |
| G-7 | Viết tắt được giữ (GVCN, GVBM, PA, SOS, FT, KV, OVR, L R W1 W2 S) luôn có tooltip bản đầy đủ. Icon ⋮ ⋯ ⓘ ▸ ✓ luôn có tooltip. |
| G-8 | Panel không chồng panel. Mở việc khác từ một panel thì đóng panel cũ rồi mở panel mới. |
| G-9 | Mọi ô dán bằng chứng nhận Ctrl+V ảnh, kéo thả, chọn tệp, dán liên kết. (PR này không có ô bằng chứng.) |
| G-10 | **Mọi số trên dashboard bấm được, mở đúng danh sách tạo ra số đó (`<SoLieu>`). Mọi hạn hiển thị qua `<Han>`.** |
| G-11 | Mobile (375px): bảng rộng cuộn ngang **trong thẻ**, trang không cuộn ngang. |
| G-12 | Mọi module có hơn một lối vào phải có mục trong bảng định vị (§4). Không thêm nút ở chỗ chưa ghi trong §4. |

### Luật chữ (spec §2 + THUAT_NGU — chữ PR này dùng)

- **"Case"** luôn viết hoa. HV/học viên. "Phương án (PA)"; màn trộn ghi "PA học thuật". Không mở đầu câu bằng "Hãy".
- **Lớp thường** — không viết "Normal" trên màn (kể cả nút chọn chương trình: mockup ghi "Normal", đặc tả §2 thắng).
- Chữ đã tra: khối **Cần xử lý** (g9-017) · **Điểm đáng chú ý** (g12-016) · **▸ Lịch sắp tới** (g12-018) · **Dữ liệu đến
  {ngày}** (g12-019) · **Theo chi nhánh** (g2-010) · ô **Học viên dưới kỳ vọng** (g12-002) · **Học viên có Case đang mở**
  (g12-006 sửa thành) · **Chờ xác minh quá hạn** (g12-007) · **PA học thuật cần cập nhật** (g8-095) · dòng phụ **/ {n}
  đánh giá được** (g12-004) · dòng việc **{n} tín hiệu cần xác minh quá hạn** (g11-041 + g8-070 "tín hiệu SOS" → "Tín hiệu
  cần xác minh") · **{n} PA học thuật quá hạn cập nhật** (g11-039) · **{n} PA chờ Quản lý duyệt** (g11-040) · **{n} học
  viên có vi phạm quá 5 ngày chưa xử lý** (g11-038) · nút **Mở** (g3-007) · **Xem** (g3-006) · **Duyệt** (g3-020) · liên
  kết **Tất cả việc →** (g1-052) · nút **Hồ sơ** (g1-053) · khối **Học viên cần hỗ trợ** (g12-028) · cột **Case mở**
  (g5-040) · **Đủ dữ liệu đánh giá** (g5-041) · **Chưa có hạn** (g6-116 sửa thành) · **Không có việc nào đang chờ bạn**
  (g14-005) · hộp Cách tính: **Chỉ số: · Đối tượng tính: · Không đếm trùng: · Thời gian:** (g12-021/022 sửa thành).
- **Chữ bị cấm bởi phép kiểm có sẵn** (quét cả chú thích trong `web/src`, `shared`, `server/src`): `Kế hoạch MT`,
  `Việc của tôi`, `Cả phạm vi quản lý`, `Tiến độ lớp`, `biện pháp`, `BP` (đứng riêng), `Hãy`, `Hoàn thành phương án` —
  xem `server/src/tests/run.ts` ~8698-8708 và `server/src/tests/hoSoHocVien.tests.ts:34-38`. "Việc cần làm của tôi" hợp
  lệ (không chứa chuỗi `Việc của tôi`).

### Luật riêng của PR này

- **An toàn dữ liệu.** Không đặt `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BAN_CHINH`, `PISA_CHO_PHEP_*` trong cửa sổ
  làm việc. Không chạy lệnh nào vào database bản chính. **Không deploy.**
- **Hợp đồng số liệu.** Không đếm riêng ở đâu cả. Mọi số = độ dài một tập ID sinh ra bởi `metricSet` (hoặc chia từ tập
  đó); danh sách mở ra khi bấm gọi **cùng hàm, cùng quyền, cùng bộ lọc**. Phép kiểm khoá "số = số dòng khi bấm".
- **Không đổi luật nghiệp vụ.** Thấy luật có vẻ sai → ghi `plan.md` mục 12, **không sửa**.
- **Route mới chỉ thêm khối** ở `server/src/routes/index.ts` (một khối `// === Tổng quan (PR-Pa)` đặt ngay sau route
  `/highlights` ~1138-1141) + thêm **một tham số `ct`** vào hai route có sẵn `/metrics/:id` (~850) và `/highlights`.
- **Phép kiểm** ở file mới `server/src/tests/tongQuan.tests.ts`, nối vào `run.ts` bằng **3 dòng** ngay sau khối PR-O
  (`runKhungTests`, ~9451-9452). Sửa **một** phép kiểm cũ ở `run.ts` ~7973-7978 (sổ chỉ số 24 → 27).
- **Số phép kiểm chỉ tăng.** Mốc đầu ghi ở Task 0.
- `npm run check` (= build máy chủ + `npm test` + `npm run typecheck`) xanh sau mỗi task.
- Mỗi commit kết thúc bằng dòng `Co-Authored-By` theo hướng dẫn phiên. Không `--no-verify`.

### Ranh giới với PR chạy song song (đợt 2)

| PR | File của họ — PR-Pa **KHÔNG sửa** |
|---|---|
| **PR-AN** (sắp merge) | `server/src/app.ts`, `server/src/platform/auth.ts`/khối `/auth` của `routes/index.ts`, `WelcomePage.tsx`, `cases.ts` (hàm đếm bằng chứng), `netlify.toml`, `netlify/functions/*` |
| **PR-S2** | `server/src/cases/cases.ts`, `server/src/cases/sosAuto.ts`, `web/src/modules/cases/CasePanel.tsx`, `SkillBoard.tsx`, `schema.sql`, `migrate.ts` |
| **PR-Qa** | `StudentsPage.tsx`, `ClassOverviewPage.tsx`, `ClassRoster.tsx`, `IntakePanel.tsx`, `ClassYThucCard.tsx`, `ClassIssueBoard.tsx`, `shared/domain/hienThiNgay.ts`, `shared/domain/display.ts`, `index.html` |

- Hàm ngày G-6 (`ngay`, `tuanLich`) **dùng**, **không sửa** (Qa sửa lệch giờ VN). PR này chỉ đưa vào chúng chuỗi ngày
  không có giờ (`demoDate`, `weekStart`, `verify_due`) nên không dính lỗi lệch giờ.
- Form **Tạo Case** dùng `QuickReport.tsx` (không thuộc PR nào đợt 2; PR-Form đợt 5 sửa sau) — **không** mở `CasePanel` /
  `SkillBoard`.
- `server/src/routes/index.ts`, `server/src/tests/run.ts`: cả ba PR cùng thêm khối → khi rebase **giữ cả hai khối**.
- `DeadlineKind`, `SOS_LABEL`… chỉ **import** từ `display.ts` / `normal.ts`, không sửa.

---

## Quyết định session planning tự chốt khi đặc tả im lặng (ghi lại để người rà soát kiểm)

| # | Chỗ im lặng | Chốt | Vì sao |
|---|---|---|---|
| Q1 | Chương trình đang chọn lưu ở đâu | Tham số `ct` trên địa chỉ trang: `ct=thuong` · `ct=ft` · vắng = **Cả hai** (mặc định). API nhận cùng tham số `ct`. Chỉ Quản lý thấy nút chọn | Cùng cách với `cn` (chi nhánh): gửi link vẫn ra đúng màn |
| Q2 | Một phần tử "thuộc" chương trình nào | **Theo lớp**, một định nghĩa cho mọi đơn vị (file `chuongTrinh.ts`): HV → lớp đang học (không còn lớp đang học thì lớp gần nhất); Case → lớp của lượt Test sinh ra Case, không có thì lớp HV đang học (cùng định nghĩa `classKind` của `listCases`); PA / nghĩa vụ → Case của nó; tín hiệu → lớp của tín hiệu; bài / lượt → lớp của lượt; vi phạm, PA xử lý → HV. `classes.is_fast_track` quyết định. Không xác định được lớp → chỉ có ở "Cả hai" | Một nơi lọc, trong `metricSet`, nên ô số, danh sách và bảng không bao giờ lệch nhau |
| Q3 | Ô 1 "Học viên dưới kỳ vọng" tính thế nào | Chỉ số có sẵn `hv-duoi-ky-vong-mon` **không nêu môn** = em dưới kỳ vọng ở ≥ 1 môn của đợt mới nhất hợp lệ; dòng phụ `/ {N} đánh giá được` (mẫu số của chính chỉ số). Khi `ct=thuong` nhãn đổi thành **Học viên chưa đạt** (§2: lớp thường không viết "kỳ vọng") | Ô đúng nghĩa đặc tả §3.2 (4.1 đã chốt), không bịa chỉ số mới |
| Q4 | Khối Cần xử lý: dòng gộp hay từng việc | **Dòng gộp theo loại** như mockup A ("2 tín hiệu cần xác minh quá hạn · MB-FOU 12 (2)" + nút). Mỗi dòng **là một chỉ số trong sổ** (bấm số hoặc nút → danh sách đúng tập). Thứ tự theo design plan §4.1: quá hạn xác minh/duyệt → thiếu người phụ trách → thiếu PA → thiếu kết quả; thêm bài quá hạn nhập điểm và vi phạm quá 5 ngày ở cuối. Bỏ dòng 0; tối đa 8 dòng; dòng "PA chờ Quản lý duyệt" chỉ khi người xem duyệt được | Mockup A đã duyệt, mới hơn design §18.2; G-10 buộc mỗi số có danh sách |
| Q5 | Ba chỉ số mới cho Cần xử lý | `case-xac-dinh-nguyen-nhan-qua-han` (Case FT tự tạo chờ xác định nguyên nhân, đã quá hạn 3 ngày), `bai-qua-han-nhap-diem` (lượt Test có ô điểm quá hạn nhập — đi qua `scoreDebtCells` của PR-S1), `case-chua-co-nguoi-phu-trach`. Vào sổ + `LISTED_METRICS`; sổ 24 → 27 | Không có chỉ số thì không có số trên dashboard (HĐSL §2) |
| Q6 | Điểm đáng chú ý sinh từ đâu | **Ba luật, mỗi luật dựa một chỉ số có sẵn**, tối đa 3 dòng: (1) môn có tỷ lệ HV dưới kỳ vọng cao nhất, khi ≥ 3 em; (2) `k/N PA học thuật đã kết thúc có cải thiện` khi N ≥ 5; (3) `k/N lần cập nhật PA đúng hạn (30 ngày qua)` khi N ≥ 5 và tỷ lệ < 80%. Mỗi dòng có link "xem {n} …" mở đúng tập. Không đủ điều kiện → "Chưa có điểm nào đủ dữ liệu để nêu." | Ví dụ mockup "tăng 4 → 7" cần lịch sử, "chưa nộp báo cáo" không phải chỉ số — xem mục Mâu thuẫn |
| Q7 | Bảng chi nhánh dùng cột nào | Cột theo **mockup A**: Học viên · Dưới kỳ vọng · SOS · Case mở · Thiếu PA học thuật · Đủ dữ liệu đánh giá (`k/N`). `ct=thuong` đổi "Dưới kỳ vọng" → **Chưa đạt**. Hai cột cũ "PA học thuật cần cập nhật", "Đề xuất chờ duyệt" nay ở ô số / Cần xử lý | Mockup A đã duyệt; P5 "cột rõ" |
| Q8 | Nhiều chi nhánh / một chi nhánh | Chưa chọn chi nhánh **và** phạm vi > 1 chi nhánh → mỗi hàng một chi nhánh, bấm ▸ mở xuống lớp, hàng tổng ở cuối. Đã chọn chi nhánh **hoặc** phạm vi chỉ 1 chi nhánh → bảng lớp luôn, hàng "Cả chi nhánh" ở đầu (P5 "1 CN thì ưu tiên bảng lớp"). Bỏ tầng nhóm "Normal/Fast Track" cũ — nút chọn chương trình thay việc đó | Bớt một tầng mở; không hiện chữ "Normal" |
| Q9 | Bảng mới hay sửa `branchPulse` | **API mới** `GET /tong-quan/chi-nhanh` (file `bangChiNhanh.ts`); `branchpulse.ts` **không sửa** — vẫn phục vụ góc nhìn "Theo giáo viên" và ~10 phép kiểm cũ | Không làm đỏ phép kiểm cũ; không đụng luật S12 vừa sửa |
| Q10 | "Theo giáo viên" ở Tổng quan | **Giữ tạm** (nút "Theo lớp · Theo giáo viên" khi đang xem một chi nhánh, như hiện có). §3.3 nói danh sách GV duy nhất ở Phân tích — PR-GV (đợt 5) bỏ nút này khi Phân tích › Theo giáo viên có | Không làm mất chức năng Quản lý đang dùng trong 3 đợt |
| Q11 | Ô "Đủ dữ liệu đánh giá" `16/18` bấm vào đâu | Số **16** (tử số) bấm được → 16 em đã đủ; `/18` chữ mờ | G-10: số bấm ra đúng tập sinh ra nó |
| Q12 | Ánh xạ 12 loại việc → 4 nhóm GV | **Chấm điểm:** `score`, `decide_move` · **Case học thuật:** `verify`, `cause`, `no_plan`, `result`, `decide`, `do_plan`, `no_owner` · **Ý thức & Phối hợp:** hai dòng nhắc mềm của GVCN (`/y-thuc/my-warnings`, `/y-thuc/my-coordination`) · **Vận hành:** `placement`, `mgmt`, `missing_data`. Loại lạ → Vận hành | Mockup 12 khối D đặt "cần xếp lớp tiếp" ở Vận hành; §3.10 đặt tín hiệu ở Case học thuật |
| Q13 | Nhóm nào tự mở | Nhóm có ≥ 1 việc quá hạn tự mở; nhóm khác gập, header có số. Nhóm Ý thức & Phối hợp **không bao giờ tự mở** — nhắc mềm không có hạn, không quá hạn (W02) | §3.2 "nhóm quá hạn tự mở" |
| Q14 | Mỗi nhóm hiện bao nhiêu dòng | 5 dòng đầu + nút "Xem thêm {n} việc" mở tại chỗ; cuối khối "Tất cả việc →" tới `/cong-viec` | Design §4.2 "preview 5–8 việc + Xem tất cả" |
| Q15 | Ô lý do "Bỏ qua" | Ô nhỏ **luôn hiện** cạnh nút Bỏ qua (placeholder "Lý do (không bắt buộc)", rộng ~9rem, tối đa 200 ký tự); bấm **Bỏ qua** là gửi ngay, không hộp xác nhận; toast "Đã bỏ qua"; dòng biến mất | 10b §5 "một bấm là xong; ô lý do hiện nhỏ" |
| Q16 | Form Tạo Case | Dùng `QuickReport` (có sẵn `idempotencyKey`, `fromSignalId`). Thêm: dòng chỉ đọc "Điểm: {Giữa khoá · Listening} {12/40}", chỉ hiện **đúng một** kỹ năng của tín hiệu (kể cả `writing` lớp thường), tiêu đề "Tạo Case · {môn} · {tên em}", ẩn `SectionNote` khi mở từ tín hiệu. **Không** tự điền tên/mô tả Case | §3.10 "mở form Case môn đó, điền sẵn điểm"; tên và mô tả là nhận định của GV (mục 7.3) |
| Q17 | Hai nút tín hiệu ở đâu | Ở **mọi** nơi dùng `WorkList`/`DongViec`: Tổng quan GV và Công việc › Hỗ trợ học viên | §4: "Việc cần làm › Case học thuật"; hai màn cùng danh sách |
| Q18 | Học viên cần hỗ trợ gồm ai | Em đang học ở lớp người xem được xem (GV: lớp mình dạy), có **SOS ≥ 1 ở đợt mới nhất hợp lệ**, **hoặc** Case đang mở, **hoặc** cảnh báo vi phạm 5 ngày. Xếp: mức SOS giảm dần → số Case → tên. Hiện 8 dòng + "Xem thêm" tại chỗ | Mockup GV; dùng lại `latestAttempts`, `listCases`, `warningsFor` — không luật mới |
| Q19 | Đầu trang GV | "Chào {tên gọi}" + "Dữ liệu đến {dd/mm/yyyy}". **Bỏ** "hôm nay có 5 việc" của mockup | Số đó không bấm được (G-10); số việc đã có ở từng nhóm |
| Q20 | Tên ô khác tên chỉ số trong sổ | Thêm prop `nhan` cho `<SoLieu>` (hiện ở ô); `ten` trong sổ giữ nguyên (hiện ở "Cách tính") | Không đổi sổ vì một ô; không làm đỏ phép kiểm tên chỉ số |
| Q21 | Nợ S1 (1) — cách sửa | `overdueNormalSignalIds` đọc **thẳng SQL** trong phạm vi (`classScopeSql`), cùng điều kiện với `listSignals` (chờ · quá hạn · chương trình tỷ lệ). Phép kiểm: cùng tập với cách cũ cho 4 vai + nguồn hàm không còn `can(`/`listSignals(` | Kết quả không phụ thuộc quyền xử lý từng tín hiệu, chỉ phụ thuộc phạm vi xem |
| Q22 | Nợ S1 (2) — kịch bản | Tạm ngừng phân công Speaking của MB-FOU 12 → tín hiệu Speaking về GVCN → GVCN thấy dòng có `create_case` + `dismiss` → `reportIssue(fromSignalId, idempotencyKey)` thành công, gửi lại cùng khoá ra cùng Case, tín hiệu `linked`, dòng biến mất → khôi phục phân công (`finally`) | Đúng lời đặc tả §7 dòng Pa |
| Q23 | `dashboard.ts` / route `/overview` | **Không sửa** (không màn nào gọi; 4 phép kiểm cũ dùng). Ghi chuyển PR-S3 dọn | Tránh việc không cần |
| Q24 | Lịch sắp tới | Giữ nội dung `Highlights` (3 tuần), đổi tên khối, dòng thu gọn "▸ Lịch sắp tới · {a} đợt Test tuần này · {b} đợt tuần sau", tuần theo G-6 (`tuanLich`), "Lớp thường"/"Giữa khoá"/"Cuối khoá", lọc theo `ct` | P4 |
| Q25 | Cổng thử | API **4127**, Vite **5327** (không 4000/5173; không 4117/5317 để khỏi đụng session song song) | Ba session chạy cùng lúc |

---

## Mâu thuẫn đã gặp và cách xử lý (đặc tả §0: nguồn trên thắng)

1. Mockup 02 bản GV: "Việc cần làm của tôi" là danh sách phẳng ↔ đặc tả §3.2 "gom theo nhóm … nhóm quá hạn tự mở" →
   **đặc tả**.
2. Mockup 02 nút chọn "Normal" ↔ §2 "không viết Normal trên màn" → **Lớp thường**.
3. THUAT_NGU g12-017 "Sự kiện nổi bật → Điểm đáng chú ý" (trùng nghĩa) ↔ §3.2 tách hai khối: Điểm đáng chú ý (nhận định)
   và Lịch sắp tới (khối lịch cũ). → Khối cũ `Highlights` đổi tên **Lịch sắp tới** (g12-018); "Điểm đáng chú ý" là khối
   mới.
4. Mockup ô 4 "6 · 3 quá hạn" ↔ chỉ số `pa-can-cap-nhat` vốn là tập **đã quá hạn** cập nhật → ô 4 **không có dòng phụ**.
5. Mockup ví dụ Điểm đáng chú ý "tăng 4 → 7 sau MT3" (cần lịch sử theo đợt) và "CP-FT 110 chưa nộp báo cáo" (không phải
   chỉ số trong sổ) ↔ G-10/HĐSL → làm 3 luật từ chỉ số có sẵn (Q6); xu hướng ghi chuyển PR-Pb.
6. Design §18.2 "Cần xử lý: mỗi dòng … người phụ trách + hạn" ↔ mockup A dòng gộp → **mockup A** (mới hơn, đã duyệt).
7. Kiểm kê P6c gồm "badge lớp" ↔ badge lớp nằm ở `StudentsPage.tsx` (file PR-Qa) → PR-Pa không sửa; ghi chuyển.
8. §3.10 "Tạo Case mở form Case môn đó" ↔ form hiện chỉ có 5 ô FT, Writing lớp thường chưa chọn được (F07, PR-Form) →
   Q16: khi mở từ tín hiệu, hiện đúng kỹ năng của tín hiệu (kể cả `writing`); chọn tay Writing lớp thường vẫn là việc
   PR-Form.
9. `<Han loai="xac-minh-sos">` ghi "Xác minh nguyên nhân · hạn …" cho tín hiệu lớp thường (việc thật là Tạo Case / Bỏ
   qua) — nhãn nằm ở `display.ts` (file PR-Qa) → giữ; ghi chuyển PR-S3.

---

## File Structure

| File | Tạo/Sửa | Trách nhiệm |
|---|---|---|
| `shared/domain/tongQuan.ts` | Tạo | Luật thuần: chương trình (`ct`), 4 nhóm việc, loại hạn theo loại việc, dòng Cần xử lý, luật Điểm đáng chú ý, cột bảng chi nhánh |
| `shared/domain/index.ts` | Sửa | + `export * from './tongQuan.ts';` |
| `shared/domain/metrics.ts:74-101` | Sửa | + 3 chỉ số (Q5) |
| `server/src/worklist/chuongTrinh.ts` | Tạo | `lopCuaTap`, `locTheoChuongTrinh`, `tachTheoLop` |
| `server/src/worklist/metrics.ts` | Sửa | `metricSet` nhận `program`; 3 chỉ số mới; `rowsFor` thêm `bai-thi`, sửa chữ thô ở `tin-hieu` |
| `server/src/cases/signals.ts:317-326` | Sửa | `overdueNormalSignalIds` đọc SQL (nợ S1) |
| `server/src/worklist/tongQuan.ts` | Tạo | `tongQuanQuanLy` (Cần xử lý + Điểm đáng chú ý), `hocVienCanHoTro` |
| `server/src/worklist/bangChiNhanh.ts` | Tạo | `bangChiNhanh`, `oBangChiNhanh` |
| `server/src/worklist/highlights.ts:62-83` | Sửa | lọc `program` |
| `server/src/routes/index.ts` | Sửa | `ct` ở `/metrics/:id` (~850) và `/highlights` (~1138); khối mới 4 route `/tong-quan/*` |
| `server/src/tests/tongQuan.tests.ts` | Tạo | mọi phép kiểm PR-Pa |
| `server/src/tests/run.ts` | Sửa | 3 dòng nối (~9452); sổ chỉ số 24 → 27 (~7973-7978) |
| `web/src/ui/SoLieu.tsx` | Sửa | tách `DanhSachSoLieu` + `DongDanhSach`; prop `nhan`, `phu`, `tone`, `phamVi.chuongTrinh`; chữ Cách tính mới |
| `web/src/ui/SoLieuO.tsx` | Tạo | số nhỏ bấm được (theo chỉ số hoặc theo đường `nguon`) |
| `web/src/modules/worklist/OverviewPage.tsx` | Sửa (viết lại thân) | bố cục QL / GV |
| `web/src/modules/worklist/ChonChuongTrinh.tsx` | Tạo | nút chọn Lớp thường · Fast Track · Cả hai |
| `web/src/modules/worklist/MetricTiles.tsx` | Sửa | 4 ô §3.2 |
| `web/src/modules/worklist/KhoiCanXuLy.tsx` | Tạo | Cần xử lý + Điểm đáng chú ý (một lần gọi API) |
| `web/src/modules/worklist/Highlights.tsx` | Sửa | → `LichSapToi` |
| `web/src/modules/worklist/BranchPulse.tsx` | Sửa (viết lại bảng lớp) | bảng Theo chi nhánh; giữ bảng Theo giáo viên |
| `web/src/modules/worklist/WorkList.tsx` | Sửa | `WorkItem.signal`; tách `DongViec` (export); hạn qua `<Han>` |
| `web/src/modules/worklist/DongTinHieu.tsx` | Tạo | hai nút Tạo Case / Bỏ qua + ô lý do |
| `web/src/modules/worklist/ViecCuaToi.tsx` | Tạo | Việc cần làm của tôi, 4 nhóm |
| `web/src/modules/worklist/HocVienCanHoTro.tsx` | Tạo | Học viên cần hỗ trợ |
| `web/src/modules/yThuc/YThucReminders.tsx` | Sửa | export hook `useNhacYThuc` |
| `web/src/modules/cases/QuickReport.tsx` | Sửa | điền sẵn điểm khi mở từ tín hiệu (Q16) |
| `CODE_MAP.md` | Sửa | trỏ đúng file mới |

---

### Task 0: Worktree và mốc xuất phát

**Files:** không sửa mã.

- [x] **Step 1:** Dùng superpowers:using-git-worktrees: `git fetch origin && git worktree add ../pisa-pr-pa -b pr-pa-tong-quan origin/main`.
  Mọi lệnh sau chạy trong worktree. **Không** checkout nhánh khác trong thư mục chính (session khác đang dùng).
- [x] **Step 2: Kiểm môi trường không có biến Turso.**

```bash
node -e "for (const k of ['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BAN_CHINH','PISA_CHO_PHEP_MIGRATE_TURSO','PISA_CHO_PHEP_SEED_TURSO']) if (process.env[k]) { console.error('CÓ BIẾN', k); process.exit(1) } ; console.log('sạch')"
```
Expected: `sạch`.

- [x] **Step 3:** `npm ci` rồi `npm run check`. Ghi vào Nhật ký số ở dòng `TẤT CẢ N KIỂM TRA ĐỀU ĐẠT`. Đỏ ngay từ đầu → 🛑.
- [x] **Step 4:** `git diff 7843875..HEAD --stat -- web/src/modules/worklist server/src/worklist server/src/cases/signals.ts web/src/ui/SoLieu.tsx web/src/modules/cases/QuickReport.tsx shared/domain/metrics.ts server/src/routes/index.ts`
  — có thay đổi (ví dụ PR-AN đã merge) thì mở file xem lại số dòng; lệch nội dung ở chỗ plan sửa → 🛑.
- [x] **Step 5:** Đọc: spec §1–§4, §7 dòng Pa; kiểm kê §1.3; bốn mockup; Global Constraints + bảng Q1–Q25 ở trên. Có Q nào
  bạn thấy sai với đặc tả → 🛑 hỏi trước khi code.

---

### Task 1: Luật thuần của Tổng quan (`shared/domain/tongQuan.ts`) + file phép kiểm

**Files:**
- Create: `shared/domain/tongQuan.ts`
- Modify: `shared/domain/index.ts` (thêm một dòng cuối)
- Create: `server/src/tests/tongQuan.tests.ts`
- Modify: `server/src/tests/run.ts` (3 dòng sau khối PR-O, ~9452)

**Interfaces:**
- Consumes: `type DeadlineKind` từ `shared/domain/display.ts` (chỉ import kiểu).
- Produces:
  - `type ChuongTrinh = 'thuong' | 'ft' | 'ca-hai'`; `CHUONG_TRINH`, `CHUONG_TRINH_LABEL`;
    `chuongTrinhTuThamSo(s: string | null | undefined): ChuongTrinh`; `thamSoCt(ct: ChuongTrinh, dau?: '?' | '&'): string`.
  - `type NhomViec = 'cham-diem' | 'case-hoc-thuat' | 'y-thuc' | 'van-hanh'`; `NHOM_VIEC`, `NHOM_VIEC_LABEL`;
    `nhomViecCua(loai: string): NhomViec`; `LOAI_HAN_CUA_VIEC: Partial<Record<string, DeadlineKind>>`;
    `gomNhomViec<T extends ViecGom>(items: T[], soNhacYThuc?: number): NhomViecXem<T>[]`.
  - `type MaCanXuLy` (8 mã = mã chỉ số); `CAN_XU_LY`; `CAN_XU_LY_TOI_DA = 8`;
    `sapCanXuLy(dem: Partial<Record<MaCanXuLy, number>>, coQuyenDuyet: boolean): DongCanXuLyGoc[]`.
  - `NGUONG_DANG_CHU_Y`; `type UngVienChuY`; `type DiemChuY`; `chonDiemDangChuY(ds: UngVienChuY[], ct: ChuongTrinh): DiemChuY[]`.
  - `COT_BANG`, `type CotBang`, `COT_BANG_DON_VI: Record<CotBang, 'hoc-vien' | 'case'>`.
  - `runTongQuanTests(t: YThucTestKit): Promise<void>` trong `tongQuan.tests.ts` (các task sau thêm phép kiểm vào đây).

- [x] **Step 1: Viết phép kiểm đỏ.** Tạo `server/src/tests/tongQuan.tests.ts`:

```ts
/**
 * PHÉP KIỂM PR-Pa — Tổng quan (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.2, §3.10, §7 dòng Pa).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Học viên dùng ở đây do CHÍNH file này tạo
 * (`taoHocVien`), không sửa học viên của bộ demo. Ngày demo cố định: TODAY = 2026-09-14 (thứ Hai).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runTongQuanTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-Pa · Tổng quan');
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);

  // ================================================================== 1. Luật thuần
  check('PR-Pa · Chương trình: đọc tham số ct; mặc định Cả hai; không có chữ "Normal" trên màn', () => {
    eq(d.chuongTrinhTuThamSo('thuong'), 'thuong', 'thuong');
    eq(d.chuongTrinhTuThamSo('ft'), 'ft', 'ft');
    eq(d.chuongTrinhTuThamSo(null), 'ca-hai', 'vắng');
    eq(d.chuongTrinhTuThamSo('normal'), 'ca-hai', 'giá trị lạ');
    eq(d.thamSoCt('ca-hai'), '', 'Cả hai không gắn tham số');
    eq(d.thamSoCt('ft', '?'), '?ct=ft', 'ft');
    eq(d.CHUONG_TRINH_LABEL, { thuong: 'Lớp thường', ft: 'Fast Track', 'ca-hai': 'Cả hai' }, 'Nhãn');
  });

  check('PR-Pa · Gom nhóm việc GV: 12 loại việc về đúng 4 nhóm, nhóm có việc quá hạn tự mở, Ý thức không bao giờ tự mở', () => {
    const cham = ['score', 'decide_move'];
    const kase = ['verify', 'cause', 'no_plan', 'result', 'decide', 'do_plan', 'no_owner'];
    const van = ['placement', 'mgmt', 'missing_data'];
    for (const g of cham) eq(d.nhomViecCua(g), 'cham-diem', g);
    for (const g of kase) eq(d.nhomViecCua(g), 'case-hoc-thuat', g);
    for (const g of van) eq(d.nhomViecCua(g), 'van-hanh', g);
    eq(d.nhomViecCua('loai-la'), 'van-hanh', 'Loại lạ');
    const v = (group: string, urgency: string, due: string | null) => ({ group, urgency, due });
    const nhom = d.gomNhomViec([
      v('result', 'normal', '2026-09-20'), v('verify', 'overdue', '2026-09-10'), v('score', 'normal', null), v('mgmt', 'today', '2026-09-14'),
    ], 2);
    eq(nhom.map((g: any) => g.key), ['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh'], 'Thứ tự nhóm cố định');
    const kh = nhom.find((g: any) => g.key === 'case-hoc-thuat');
    eq([kh.n, kh.quaHan, kh.moSan], [2, 1, true], 'Case học thuật: 2 việc, 1 quá hạn, tự mở');
    eq(kh.items[0].group, 'verify', 'Việc quá hạn lên đầu nhóm');
    const yt = nhom.find((g: any) => g.key === 'y-thuc');
    eq([yt.n, yt.moSan], [2, false], 'Ý thức: đếm dòng nhắc, không tự mở');
    eq(nhom.find((g: any) => g.key === 'cham-diem').moSan, false, 'Nhóm không quá hạn thì gập');
    eq(d.gomNhomViec([], 0), [], 'Không việc thì không nhóm');
    eq(d.LOAI_HAN_CUA_VIEC.verify, 'xac-minh-sos', 'Hạn tín hiệu');
    eq(d.LOAI_HAN_CUA_VIEC.score, 'nhap-diem', 'Hạn nhập điểm');
  });

  check('PR-Pa · Cần xử lý: đúng thứ tự design §4.1, bỏ dòng 0, tối đa 8, "PA chờ Quản lý duyệt" chỉ khi duyệt được', () => {
    eq(d.CAN_XU_LY.map((x: any) => x.metricId), [
      'tin-hieu-qua-han', 'case-xac-dinh-nguyen-nhan-qua-han', 'pa-cho-duyet', 'case-chua-co-nguoi-phu-trach',
      'case-thieu-pa', 'pa-can-cap-nhat', 'bai-qua-han-nhap-diem', 'hv-can-xu-ly',
    ], 'Thứ tự');
    const dem = { 'pa-can-cap-nhat': 3, 'tin-hieu-qua-han': 2, 'pa-cho-duyet': 1, 'case-thieu-pa': 0 };
    const co = d.sapCanXuLy(dem, true);
    eq(co.map((x: any) => [x.metricId, x.n]), [['tin-hieu-qua-han', 2], ['pa-cho-duyet', 1], ['pa-can-cap-nhat', 3]], 'Có quyền duyệt');
    eq(d.sapCanXuLy(dem, false).map((x: any) => x.metricId), ['tin-hieu-qua-han', 'pa-can-cap-nhat'], 'Không quyền duyệt');
    eq(co[0].nhan, 'tín hiệu cần xác minh quá hạn', 'Chữ g11-041 + g8-070');
    eq(co[1].nut, 'Duyệt', 'Nút g3-020');
    const all = Object.fromEntries(d.CAN_XU_LY.map((x: any) => [x.metricId, 5]));
    assert(d.sapCanXuLy(all, true).length === d.CAN_XU_LY_TOI_DA && d.CAN_XU_LY_TOI_DA === 8, 'Tối đa 8 dòng');
  });

  check('PR-Pa · Điểm đáng chú ý: tối đa 3; dưới ngưỡng thì bỏ; lớp thường nói "chưa đạt"; link ghi đúng số dòng sẽ mở', () => {
    const mon = (nhanMon: string, skill: string, tu: number, mau: number) =>
      ({ loai: 'mon-duoi-ky-vong', metricId: 'hv-duoi-ky-vong-mon', extra: { skill }, tu, mau, nhanMon });
    const ds = [
      mon('Listening', 'listening', 7, 20), mon('Reading', 'reading', 2, 4), mon('Writing', 'writing', 5, 10),
      { loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: 5, mau: 6 },
      { loai: 'dung-han', metricId: 'dung-han-cap-nhat', extra: { from: '2026-08-15' }, tu: 12, mau: 20 },
    ];
    const r = d.chonDiemDangChuY(ds, 'ca-hai');
    eq(r.length, 3, 'Ba điểm');
    eq(r[0].cau, 'Writing: 5/10 học viên dưới kỳ vọng', 'Môn tỷ lệ cao nhất, ≥ 3 em (Reading 2/4 dưới ngưỡng)');
    eq([r[0].lienKet, r[0].soDanhSach], ['xem 5 học viên', 5], 'Link môn');
    eq([r[1].cau, r[1].soDanhSach], ['5/6 PA học thuật đã kết thúc có cải thiện', 6], 'PA cải thiện — danh sách là mẫu số');
    eq(r[2].cau, '12/20 lần cập nhật PA đúng hạn (30 ngày qua)', 'Đúng hạn < 80%');
    eq(d.chonDiemDangChuY(ds, 'thuong')[0].cau, 'Writing: 5/10 học viên chưa đạt', 'Lớp thường');
    const it = d.chonDiemDangChuY([
      mon('Listening', 'listening', 2, 20), { loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: 3, mau: 4 },
      { loai: 'dung-han', metricId: 'dung-han-cap-nhat', tu: 19, mau: 20 },
    ], 'ca-hai');
    eq(it, [], 'Không ứng viên nào đủ điều kiện');
  });
}
```

  Nối vào cuối `server/src/tests/run.ts`, **ngay sau** hai dòng `runKhungTests` (~9451-9452) và **trước**
  `console.log(\`\n${'='.repeat(60)}\`);`:

```ts
// ==================================================================== PR-Pa (Tổng quan)

const { runTongQuanTests } = await import('./tongQuan.tests.ts');
await runTongQuanTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```

- [x] **Step 2: Chạy, thấy đỏ.** `npm test` — Expected: FAIL (`d.chuongTrinhTuThamSo is not a function` …, 4 phép ✗).

- [x] **Step 3: Cài đặt.** Tạo `shared/domain/tongQuan.ts`:

```ts
/**
 * LUẬT THUẦN CỦA TỔNG QUAN (PR-Pa, đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §3.2, §3.10).
 *
 * Nằm ở `shared` để harness máy chủ kiểm được (web không có bộ kiểm thử) và để máy chủ lẫn giao diện đọc CÙNG một bảng:
 * chương trình đang chọn, 4 nhóm việc của GV, thứ tự dòng Cần xử lý, luật chọn Điểm đáng chú ý.
 * Không có con số nào được tính ở đây — số luôn đến từ `metricSet` (hợp đồng số liệu luật 1).
 */
import type { DeadlineKind } from './display.ts';

// ------------------------------------------------------------------ chương trình
export const CHUONG_TRINH = ['thuong', 'ft', 'ca-hai'] as const;
export type ChuongTrinh = (typeof CHUONG_TRINH)[number];
export const CHUONG_TRINH_LABEL: Record<ChuongTrinh, string> = { thuong: 'Lớp thường', ft: 'Fast Track', 'ca-hai': 'Cả hai' };

/** Tham số `ct` trên địa chỉ trang / API. Vắng hoặc giá trị lạ = Cả hai. */
export function chuongTrinhTuThamSo(s: string | null | undefined): ChuongTrinh {
  return s === 'thuong' || s === 'ft' ? s : 'ca-hai';
}
/** Chuỗi gắn vào URL: rỗng khi Cả hai. */
export function thamSoCt(ct: ChuongTrinh, dau: '?' | '&' = '&'): string {
  return ct === 'ca-hai' ? '' : `${dau}ct=${ct}`;
}

// ------------------------------------------------------------------ 4 nhóm việc của GV (§3.2)
export const NHOM_VIEC = ['cham-diem', 'case-hoc-thuat', 'y-thuc', 'van-hanh'] as const;
export type NhomViec = (typeof NHOM_VIEC)[number];
export const NHOM_VIEC_LABEL: Record<NhomViec, string> = {
  'cham-diem': 'Chấm điểm', 'case-hoc-thuat': 'Case học thuật', 'y-thuc': 'Ý thức & Phối hợp', 'van-hanh': 'Vận hành',
};
/** 12 loại việc của `mywork.ts` → 4 nhóm (plan PR-Pa Q12). Ý thức & Phối hợp là nhắc mềm, không phải loại việc. */
const NHOM_CUA_LOAI: Record<string, NhomViec> = {
  score: 'cham-diem', decide_move: 'cham-diem',
  verify: 'case-hoc-thuat', cause: 'case-hoc-thuat', no_plan: 'case-hoc-thuat', result: 'case-hoc-thuat',
  decide: 'case-hoc-thuat', do_plan: 'case-hoc-thuat', no_owner: 'case-hoc-thuat',
  placement: 'van-hanh', mgmt: 'van-hanh', missing_data: 'van-hanh',
};
export function nhomViecCua(loai: string): NhomViec { return NHOM_CUA_LOAI[loai] ?? 'van-hanh'; }

/** Loại hạn của từng loại việc — để dòng việc hiện hạn qua `<Han>` (G-10). Loại không có ở đây: hạn là ngày trơn. */
export const LOAI_HAN_CUA_VIEC: Partial<Record<string, DeadlineKind>> = {
  verify: 'xac-minh-sos', cause: 'xac-minh-sos', no_plan: 'lap-pa', result: 'cap-nhat-pa', score: 'nhap-diem',
};

export type ViecGom = { group: string; urgency: 'overdue' | 'today' | 'normal'; due: string | null };
export type NhomViecXem<T> = {
  key: NhomViec; label: string; items: T[];
  /** Số việc (nhóm Ý thức: số dòng nhắc). */
  n: number; quaHan: number; homNay: number;
  /** Nhóm có việc quá hạn tự mở (§3.2). Ý thức không có hạn nên không bao giờ tự mở (W02). */
  moSan: boolean;
};
export function gomNhomViec<T extends ViecGom>(items: T[], soNhacYThuc = 0): NhomViecXem<T>[] {
  const w = (u: ViecGom['urgency']) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);
  return NHOM_VIEC.map((key) => {
    const list = items.filter((i) => nhomViecCua(i.group) === key)
      .sort((a, b) => w(a.urgency) - w(b.urgency) || (a.due ?? '9999').localeCompare(b.due ?? '9999'));
    const quaHan = list.filter((i) => i.urgency === 'overdue').length;
    return {
      key, label: NHOM_VIEC_LABEL[key], items: list,
      n: list.length + (key === 'y-thuc' ? soNhacYThuc : 0),
      quaHan, homNay: list.filter((i) => i.urgency === 'today').length,
      moSan: quaHan > 0,
    };
  }).filter((g) => g.n > 0);
}

// ------------------------------------------------------------------ Cần xử lý (Quản lý)
export type MaCanXuLy =
  | 'tin-hieu-qua-han' | 'case-xac-dinh-nguyen-nhan-qua-han' | 'pa-cho-duyet' | 'case-chua-co-nguoi-phu-trach'
  | 'case-thieu-pa' | 'pa-can-cap-nhat' | 'bai-qua-han-nhap-diem' | 'hv-can-xu-ly';

/**
 * MỖI DÒNG LÀ MỘT CHỈ SỐ TRONG SỔ — bấm số hay bấm nút đều mở đúng tập đó (G-10).
 * Thứ tự theo design plan §4.1: quá hạn xác minh/duyệt → thiếu người phụ trách → thiếu PA → thiếu kết quả; hai dòng
 * cuối là bài quá hạn nhập điểm và vi phạm để lâu. `mau`: đỏ = quá hạn, vàng = đang chờ người quyết, xanh = nhắc.
 */
export const CAN_XU_LY: readonly {
  metricId: MaCanXuLy; nhan: string; nut: 'Mở' | 'Xem' | 'Duyệt'; mau: 'do' | 'vang' | 'xanh'; canQuyenDuyet?: true;
}[] = [
  { metricId: 'tin-hieu-qua-han', nhan: 'tín hiệu cần xác minh quá hạn', nut: 'Mở', mau: 'do' },
  { metricId: 'case-xac-dinh-nguyen-nhan-qua-han', nhan: 'Case quá hạn xác định nguyên nhân', nut: 'Mở', mau: 'do' },
  { metricId: 'pa-cho-duyet', nhan: 'PA chờ Quản lý duyệt', nut: 'Duyệt', mau: 'vang', canQuyenDuyet: true },
  { metricId: 'case-chua-co-nguoi-phu-trach', nhan: 'Case chưa có người phụ trách', nut: 'Xem', mau: 'vang' },
  { metricId: 'case-thieu-pa', nhan: 'Case thiếu PA học thuật', nut: 'Xem', mau: 'vang' },
  { metricId: 'pa-can-cap-nhat', nhan: 'PA học thuật quá hạn cập nhật', nut: 'Xem', mau: 'do' },
  { metricId: 'bai-qua-han-nhap-diem', nhan: 'bài chưa nhập điểm quá hạn', nut: 'Xem', mau: 'do' },
  { metricId: 'hv-can-xu-ly', nhan: 'học viên có vi phạm quá 5 ngày chưa xử lý', nut: 'Xem', mau: 'xanh' },
];
export const CAN_XU_LY_TOI_DA = 8;
export type DongCanXuLyGoc = { metricId: MaCanXuLy; n: number; nhan: string; nut: 'Mở' | 'Xem' | 'Duyệt'; mau: 'do' | 'vang' | 'xanh' };
export function sapCanXuLy(dem: Partial<Record<MaCanXuLy, number>>, coQuyenDuyet: boolean): DongCanXuLyGoc[] {
  return CAN_XU_LY
    .filter((x) => (dem[x.metricId] ?? 0) > 0 && (!x.canQuyenDuyet || coQuyenDuyet))
    .slice(0, CAN_XU_LY_TOI_DA)
    .map((x) => ({ metricId: x.metricId, n: dem[x.metricId]!, nhan: x.nhan, nut: x.nut, mau: x.mau }));
}

// ------------------------------------------------------------------ Điểm đáng chú ý (Quản lý)
export const NGUONG_DANG_CHU_Y = { hvToiThieu: 3, mauToiThieu: 5, dungHanDuoi: 0.8, toiDa: 3 } as const;
export type UngVienChuY = {
  loai: 'mon-duoi-ky-vong' | 'pa-cai-thien' | 'dung-han';
  metricId: string; extra?: Record<string, string>;
  /** Tử số và mẫu số lấy từ chỉ số (`n` / `denominator` hoặc `numerator` / `n`). */
  tu: number; mau: number; nhanMon?: string;
};
export type DiemChuY = {
  loai: UngVienChuY['loai']; metricId: string; extra?: Record<string, string>;
  cau: string; lienKet: string;
  /** Số dòng panel sẽ mở — phải bằng độ dài tập ID của chỉ số (kiểm ở phép kiểm máy chủ). */
  soDanhSach: number;
};
/** Ba luật (plan PR-Pa Q6). Mỗi điểm có số và một link mở đúng tập tạo ra số đó. */
export function chonDiemDangChuY(ds: UngVienChuY[], ct: ChuongTrinh): DiemChuY[] {
  const N = NGUONG_DANG_CHU_Y;
  const out: DiemChuY[] = [];
  const mon = ds.filter((x) => x.loai === 'mon-duoi-ky-vong' && x.tu >= N.hvToiThieu && x.mau > 0)
    .sort((a, b) => b.tu / b.mau - a.tu / a.mau || b.tu - a.tu)[0];
  if (mon) {
    out.push({ loai: mon.loai, metricId: mon.metricId, extra: mon.extra,
      cau: `${mon.nhanMon}: ${mon.tu}/${mon.mau} học viên ${ct === 'thuong' ? 'chưa đạt' : 'dưới kỳ vọng'}`,
      lienKet: `xem ${mon.tu} học viên`, soDanhSach: mon.tu });
  }
  const pa = ds.find((x) => x.loai === 'pa-cai-thien' && x.mau >= N.mauToiThieu);
  if (pa) {
    out.push({ loai: pa.loai, metricId: pa.metricId, extra: pa.extra,
      cau: `${pa.tu}/${pa.mau} PA học thuật đã kết thúc có cải thiện`, lienKet: `xem ${pa.mau} PA học thuật`, soDanhSach: pa.mau });
  }
  const dh = ds.find((x) => x.loai === 'dung-han' && x.mau >= N.mauToiThieu && x.tu / x.mau < N.dungHanDuoi);
  if (dh) {
    out.push({ loai: dh.loai, metricId: dh.metricId, extra: dh.extra,
      cau: `${dh.tu}/${dh.mau} lần cập nhật PA đúng hạn (30 ngày qua)`, lienKet: `xem ${dh.mau} lần`, soDanhSach: dh.mau });
  }
  return out.slice(0, N.toiDa);
}

// ------------------------------------------------------------------ bảng Theo chi nhánh (mockup 02 phương án A)
export const COT_BANG = ['hocVien', 'duoiKyVong', 'sos', 'caseMo', 'thieuPa', 'duDuLieu'] as const;
export type CotBang = (typeof COT_BANG)[number];
export const COT_BANG_DON_VI: Record<CotBang, 'hoc-vien' | 'case'> = {
  hocVien: 'hoc-vien', duoiKyVong: 'hoc-vien', sos: 'hoc-vien', caseMo: 'case', thieuPa: 'case', duDuLieu: 'hoc-vien',
};
```

  `shared/domain/index.ts` — thêm dòng cuối: `export * from './tongQuan.ts';`

- [x] **Step 4: Chạy, xanh.** `npm test` — Expected: 4 phép kiểm PR-Pa ✓, tổng = mốc + 4.
- [x] **Step 5: Commit.**

```bash
git add shared/domain/tongQuan.ts shared/domain/index.ts server/src/tests/tongQuan.tests.ts server/src/tests/run.ts
git commit -m "PR-Pa (1): luật thuần Tổng quan — chương trình, 4 nhóm việc, Cần xử lý, Điểm đáng chú ý"
```

---

### Task 2: Nợ S1 (1) — `overdueNormalSignalIds` đọc thẳng SQL trong phạm vi

**Files:**
- Modify: `server/src/cases/signals.ts:317-326`
- Test: `server/src/tests/tongQuan.tests.ts`

**Interfaces:**
- Consumes: `scopeFor`, `classScopeSql` (`permissions.ts`), `demoToday`.
- Produces: `overdueNormalSignalIds(p, f)` — chữ ký **giữ nguyên**, kết quả **giống hệt** cách cũ.

- [x] **Step 1: Phép kiểm (đỏ).** Thêm vào `runTongQuanTests` (cuối hàm). Khai báo trợ giúp ngay đầu hàm, sau dòng `eq`:

```ts
  const signals: any = await import('../cases/signals.ts');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
```

```ts
  // ================================================================== 2. Nợ S1 (1)
  check('PR-Pa · Nợ S1: overdueNormalSignalIds cùng tập với cách cũ (4 vai, có và không chọn chi nhánh) mà không gọi quyền từng tín hiệu', () => {
    const mb = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
    for (const who of [P.admin, P.mbManager, P.cpManager, P.normalCoreTeacher, P.lrTeacher]) {
      for (const branchId of [null, mb]) {
        const cu = (signals.listSignals(who, { status: 'open', branchId, today: TODAY }).rows as any[])
          .filter((s) => s.kind === 'normal' && s.overdue).map((s) => s.id).sort((a: number, b: number) => a - b);
        eq(signals.overdueNormalSignalIds(who, { branchId, today: TODAY }), cu, `Lệch tập (user ${who.userId}, cn ${branchId})`);
      }
    }
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/cases/signals.ts'), 'utf8');
    const body = src.slice(src.indexOf('export function overdueNormalSignalIds'), src.indexOf('export function signalDetail'));
    assert(body.length > 0 && !/listSignals\(|\bcan\(|canResolveSignal\(/.test(body),
      'overdueNormalSignalIds vẫn gọi quyền từng tín hiệu (listSignals / can) — trên Turso mất vài giây mỗi lần mở Tổng quan');
  });
```

  Ghi chú cho người làm: phép so tập có thể xanh ngay (hàm cũ đúng); phần kiểm nguồn phải **đỏ**.

- [x] **Step 2: Chạy, đỏ** ở câu "vẫn gọi quyền từng tín hiệu".
- [x] **Step 3: Cài đặt.** Thay nguyên hàm `overdueNormalSignalIds` (`signals.ts:317-326`, cả khối chú thích) bằng:

```ts
/**
 * TẬP ID CỦA Ô "CHỜ XÁC MINH QUÁ HẠN" (đặc tả §3.2, §3.10): tín hiệu LỚP THƯỜNG còn chờ mà hạn 3 ngày (tính cả ngày đầu) đã qua.
 * Fast Track tự tạo Case nên không có tín hiệu chờ.
 *
 * ĐỌC THẲNG SQL TRONG PHẠM VI (nợ sau rà PR-S1, plan PR-Pa Task 2). Bản trước đi qua `listSignals`, mà hàm đó dựng `SignalView`
 * cho TỪNG tín hiệu và gọi quyền xử lý 1–2 lần mỗi cái — trên Turso là vài giây mỗi lần mở Tổng quan. Tập này chỉ phụ thuộc
 * PHẠM VI XEM (cùng `classScopeSql` với `listSignals`), không phụ thuộc ai xử lý được, nên không cần quyền từng dòng.
 * Điều kiện giữ ĐÚNG như `listSignals` + `viewOf`: chờ (`pending`) · `verify_due < hôm nay` · chương trình chấm theo tỷ lệ.
 */
export function overdueNormalSignalIds(p: Principal, f: { branchId?: number | null; today?: string } = {}): number[] {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return [];
  const cs = classScopeSql(scope);
  const where = [cs.sql, `sg.status = 'pending'`, 'sg.verify_due < ?', `COALESCE(pg.scoring_mode, pgc.scoring_mode) = 'ratio'`];
  const params: unknown[] = [...cs.params, f.today ?? demoToday()];
  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }
  return (db()
    .prepare(
      `SELECT sg.id FROM case_signals sg
         JOIN students s ON s.id = sg.student_id
         LEFT JOIN classes c ON c.id = sg.class_id
         LEFT JOIN programmes pg ON pg.code = c.programme_code
         LEFT JOIN learning_cycles cy ON cy.id = sg.cycle_id
         LEFT JOIN programmes pgc ON pgc.code = cy.programme_code
        WHERE ${where.join(' AND ')} ORDER BY sg.id`,
    )
    .all(...params) as any[]).map((r) => r.id as number);
}
```
  `scopeFor`, `classScopeSql`, `demoToday`, `db`, `PERMISSIONS` đã import sẵn ở đầu `signals.ts` — kiểm lại.

- [x] **Step 4: Chạy, xanh.** Phép kiểm cũ `S1 · Chỉ số tin-hieu-qua-han…` (`luatMayChu.tests.ts`) vẫn ✓. Đỏ → 🛑.
- [x] **Step 5: Commit.** `git commit -am "PR-Pa (2): nợ S1 — Chờ xác minh quá hạn đọc thẳng SQL trong phạm vi, bỏ quyền từng tín hiệu"`

---

### Task 3: Lọc chương trình trong `metricSet` (P6b) — một chỗ cho mọi con số

**Files:**
- Create: `server/src/worklist/chuongTrinh.ts`
- Modify: `server/src/worklist/metrics.ts:345-445` (`metricSet`)
- Modify: `server/src/routes/index.ts:850-857` (`/metrics/:id` nhận `ct`)
- Test: `server/src/tests/tongQuan.tests.ts`

**Interfaces:**
- Consumes: `type ChiSo` (sổ), `type ChuongTrinh`, `chuongTrinhTuThamSo` (Task 1).
- Produces:
  - `type LopCuaPhanTu = { classId: number | null; code: string | null; isFt: boolean | null }`
  - `lopCuaTap(unit: ChiSo['donVi'], ids: number[]): Map<number, LopCuaPhanTu>`
  - `locTheoChuongTrinh(unit: ChiSo['donVi'], ids: number[], ct: ChuongTrinh): number[]`
  - `tachTheoLop(unit: ChiSo['donVi'], ids: number[], toiDa?: number): string` — `"MB-FT 101 (8) · CP-FT 110 (4) · +2 lớp"`
  - `metricSet(p, id, f)` với `f.program?: ChuongTrinh | null` (vắng = Cả hai, như cũ).

- [x] **Step 1: Phép kiểm (đỏ).** Thêm trợ giúp tạo học viên (ngay sau khối trợ giúp của Task 2):

```ts
  const { loadPrincipal } = await import('../permissions.ts');
  const week: any = await import('../platform/week.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const regular: any = await import('../normal/regular.ts');
  const cases: any = await import('../cases/cases.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const NOW = new Date().toISOString();
  const mbBranch = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  let soThuTu = 0;
  /** Học viên mới trong một lớp có sẵn của bộ demo, một lộ trình đang chạy, một lượt Test ở tuần `weekStart`. */
  function taoHocVien(o: { classCode: 'MB-FOU 12' | 'MB-FT 101'; weekStart: string }) {
    soThuTu += 1;
    const tag = `PA-${soThuTu}`;
    const cid = classId(o.classCode);
    const ft = o.classCode === 'MB-FT 101';
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, mbBranch, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)`)
      .run(sid, cid, NOW);
    const cycleId = Number(conn.prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at)
       VALUES (?, 1, ?, ?, '2026-07-27', 'active', ?)`,
    ).run(sid, ft ? 'LT1' : null, ft ? null : 'FOU', NOW).lastInsertRowid);
    const periodId = week.ensurePeriod(o.weekStart).id;
    const attemptId = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at)
       VALUES (?,?,1,?,?,?, 'planned', ?)`,
    ).run(cycleId, sid, ft ? 'mock' : 'progress', cid, periodId, NOW).lastInsertRowid);
    skillSchedule.ensureSkillRows(attemptId);
    return { sid, cid, cycleId, attemptId };
  }
  const diem = (attemptId: number, skill: string, score: number, total: number) =>
    regular.saveRegularScore(P.admin, attemptId, skill, { score, total });
  const tinHieu = (attemptId: number, skill: string) =>
    conn.prepare('SELECT * FROM case_signals WHERE attempt_id = ? AND skill = ?').get(attemptId, skill) as any;
  const moCase = (sid: number, topic: string) => cases.reportIssue(P.admin, {
    studentId: sid, topic, title: `Case thử PR-Pa ${topic}`, summary: 'Em vướng đúng phần này của môn, đã xem lại bài.',
    primaryCode: d.issuesForTopic(topic)[0].code,
  }) as any;
  const ids = (id: string, f: any = {}) => (metricsSvc.metricSet(P.admin, id, f).ids as number[]);
  void loadPrincipal; void assertThrows; void tinHieu; void diem;
```

```ts
  // ================================================================== 3. Lọc chương trình
  check('PR-Pa · Chương trình: cùng một chỉ số, Lớp thường chỉ có em lớp thường, Fast Track chỉ có em FT, cả hai tập nằm trong Cả hai', () => {
    const thuong = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const ft = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });
    const cThuong = moCase(thuong.sid, 'listening');
    const cFt = moCase(ft.sid, 'reading');
    for (const [id, a, b] of [['hv-co-case-mo', thuong.sid, ft.sid], ['case-mo', cThuong.id, cFt.id]] as const) {
      const all = ids(id), t = ids(id, { program: 'thuong' }), f = ids(id, { program: 'ft' });
      assert(t.includes(a) && !t.includes(b), `${id}: Lớp thường sai`);
      assert(f.includes(b) && !f.includes(a), `${id}: Fast Track sai`);
      assert([...t, ...f].every((x) => all.includes(x)), `${id}: tập lọc lọt ngoài Cả hai`);
      assert(!t.some((x) => f.includes(x)), `${id}: một phần tử ở cả hai chương trình`);
    }
    const r = metricsSvc.metricSet(P.admin, 'hv-duoi-ky-vong-mon', { program: 'thuong' });
    const mau = (r.denominatorIds ?? []) as number[];
    eq(chuongTrinh.locTheoChuongTrinh('hoc-vien', mau, 'thuong'), mau, 'Mẫu số cũng phải được lọc theo chương trình');
    assert(r.n === r.ids.length && r.ids.every((x: number) => mau.includes(x)), 'n = độ dài tập; tập đếm ⊆ mẫu số');
    eq(ids('tin-hieu-qua-han', { program: 'ft' }), [], 'Tín hiệu quá hạn chỉ có ở lớp thường');
  });

  check('PR-Pa · Chương trình: /metrics nhận tham số ct; Cả hai = không lọc', () => {
    const src = fsMod.readFileSync(pathMod.join(REPO, 'server/src/routes/index.ts'), 'utf8');
    const block = src.slice(src.indexOf("api.get('/metrics/:id'"), src.indexOf("api.get('/metrics/:id'") + 600);
    assert(/program:\s*chuongTrinhTuThamSo\(qStr\(req, 'ct'\)\)/.test(block), 'Route /metrics/:id chưa đọc ct');
    eq(ids('case-mo', { program: 'ca-hai' }), ids('case-mo'), 'Cả hai = không lọc');
  });
```

  Thêm ở đầu hàm (cạnh các `await import` khác):

```ts
  const chuongTrinh: any = await import('../worklist/chuongTrinh.ts').catch(() => ({}));
```
```ts
  check('PR-Pa · tachTheoLop: gom theo lớp, hai lớp nhiều nhất, còn lại "+k lớp"; một phần tử ghi đúng lớp', () => {
    const a = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const b = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const c = taoHocVien({ classCode: 'MB-FT 101', weekStart: '2026-09-07' });
    eq(chuongTrinh.tachTheoLop('hoc-vien', [a.sid, b.sid, c.sid]), 'MB-FOU 12 (2) · MB-FT 101 (1)', 'Hai lớp');
    eq(chuongTrinh.tachTheoLop('hoc-vien', [c.sid]), 'MB-FT 101', 'Một em');
    eq(chuongTrinh.tachTheoLop('hoc-vien', []), '', 'Rỗng');
    const m = chuongTrinh.lopCuaTap('hoc-vien', [a.sid, c.sid]);
    eq([m.get(a.sid).isFt, m.get(c.sid).isFt], [false, true], 'isFt theo lớp đang học');
  });
```
  Ghi chú: `taoHocVien` dùng trong phép thứ nhất phải khai báo **trước** phép kiểm (khối trợ giúp ở trên). Đầu hàm
  `runTongQuanTests` lấy thêm `checkAsync` từ `t`: `const { check, checkAsync, assert, assertThrows, conn, TODAY, P, classId } = t;`.

- [x] **Step 2: Chạy, đỏ.** Expected: 3 phép ✗ (`metricSet` bỏ qua `program`; route chưa đọc `ct`; chưa có mô-đun).

- [x] **Step 3: Tạo `server/src/worklist/chuongTrinh.ts`:**

```ts
import { db } from '../db.ts';
import type { ChiSo, ChuongTrinh } from '../../../shared/domain/index.ts';
import { parseObligation } from './metrics.ts';

/**
 * MỖI PHẦN TỬ CỦA MỘT TẬP CHỈ SỐ THUỘC LỚP NÀO (plan PR-Pa Q2) — một định nghĩa cho cả bộ lọc chương trình lẫn dòng phụ
 * "MB-FT 101 (8) · CP-FT 110 (4)" của Cần xử lý, để hai thứ không bao giờ nói hai chuyện khác nhau.
 *
 *   học viên            lớp ĐANG học (active trước), không còn thì lớp gần nhất
 *   Case                lớp của lượt Test sinh ra Case; Case tạo tay thì lớp của học viên — cùng `classKind` của `listCases`
 *   PA / nghĩa vụ       qua Case của nó
 *   tín hiệu            lớp của tín hiệu
 *   bài / lượt          lớp của lượt
 *   vi phạm / PA xử lý  qua học viên
 * Chương trình = `classes.is_fast_track`. Không tìm được lớp → `isFt = null`: chỉ có mặt khi xem "Cả hai".
 * Truy vấn theo lô 400 — không một câu mỗi phần tử.
 */
export type LopCuaPhanTu = { classId: number | null; code: string | null; isFt: boolean | null };
const RONG: LopCuaPhanTu = { classId: null, code: null, isFt: null };

function theoLo<T>(ids: number[], fn: (chunk: number[], ph: string) => T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    out.push(...fn(chunk, chunk.map(() => '?').join(',')));
  }
  return out;
}
const lopTu = (r: any): LopCuaPhanTu =>
  r && r.class_id ? { classId: r.class_id, code: r.code ?? null, isFt: r.is_fast_track === null ? null : !!r.is_fast_track } : RONG;

/** Lớp của học viên: lớp đang học trước, rồi lớp gần nhất. */
function lopHocVien(ids: number[]): Map<number, LopCuaPhanTu> {
  const out = new Map<number, LopCuaPhanTu>();
  for (const r of theoLo(ids, (chunk, ph) => db().prepare(
    `SELECT e.student_id AS id, c.id AS class_id, c.code, c.is_fast_track
       FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE e.student_id IN (${ph})
      ORDER BY e.student_id, CASE WHEN e.status = 'active' THEN 0 ELSE 1 END, e.id DESC`,
  ).all(...chunk) as any[])) if (!out.has(r.id)) out.set(r.id, lopTu(r));
  return out;
}
function lopCase(ids: number[]): Map<number, LopCuaPhanTu> {
  const out = new Map<number, LopCuaPhanTu>();
  const hvCuaCase = new Map<number, number>();
  for (const r of theoLo(ids, (chunk, ph) => db().prepare(
    `SELECT sc.id, COALESCE(sc.student_id, a.student_id) AS sid, c.id AS class_id, c.code, c.is_fast_track
       FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
       LEFT JOIN classes c ON c.id = a.class_id WHERE sc.id IN (${ph})`,
  ).all(...chunk) as any[])) {
    if (r.class_id) out.set(r.id, lopTu(r)); else if (r.sid) hvCuaCase.set(r.id, r.sid);
  }
  const hv = lopHocVien([...new Set(hvCuaCase.values())]);
  for (const [cid, sid] of hvCuaCase) out.set(cid, hv.get(sid) ?? RONG);
  return out;
}
function quaCase(pairs: { id: number; caseId: number }[]): Map<number, LopCuaPhanTu> {
  const cm = lopCase([...new Set(pairs.map((x) => x.caseId))]);
  return new Map(pairs.map((x) => [x.id, cm.get(x.caseId) ?? RONG]));
}
function quaHocVien(pairs: { id: number; sid: number }[]): Map<number, LopCuaPhanTu> {
  const hm = lopHocVien([...new Set(pairs.map((x) => x.sid))]);
  return new Map(pairs.map((x) => [x.id, hm.get(x.sid) ?? RONG]));
}

export function lopCuaTap(unit: ChiSo['donVi'], ids: number[]): Map<number, LopCuaPhanTu> {
  if (!ids.length) return new Map();
  const conn = db();
  switch (unit) {
    case 'hoc-vien': return lopHocVien(ids);
    case 'case': return lopCase(ids);
    case 'phuong-an':
      return quaCase(theoLo(ids, (chunk, ph) => conn.prepare(
        `SELECT id, case_id AS caseId FROM case_interventions WHERE id IN (${ph})`).all(...chunk) as any[]));
    case 'nghia-vu': {
      const ivOf = new Map(ids.map((id) => [id, parseObligation(id).interventionId]));
      const iv = lopCuaTap('phuong-an', [...new Set(ivOf.values())]);
      return new Map(ids.map((id) => [id, iv.get(ivOf.get(id)!) ?? RONG]));
    }
    case 'tin-hieu': {
      const out = new Map<number, LopCuaPhanTu>();
      for (const r of theoLo(ids, (chunk, ph) => conn.prepare(
        `SELECT sg.id, c.id AS class_id, c.code, c.is_fast_track FROM case_signals sg
           LEFT JOIN classes c ON c.id = sg.class_id WHERE sg.id IN (${ph})`).all(...chunk) as any[])) out.set(r.id, lopTu(r));
      return out;
    }
    case 'bai-thi': case 'dot-test': case 'luot-sos': {
      const out = new Map<number, LopCuaPhanTu>();
      for (const r of theoLo(ids, (chunk, ph) => conn.prepare(
        `SELECT a.id, c.id AS class_id, c.code, c.is_fast_track FROM assessment_attempts a
           LEFT JOIN classes c ON c.id = a.class_id WHERE a.id IN (${ph})`).all(...chunk) as any[])) out.set(r.id, lopTu(r));
      return out;
    }
    case 'vi-pham':
      return quaHocVien(theoLo(ids, (chunk, ph) => conn.prepare(
        `SELECT id, student_id AS sid FROM violations WHERE id IN (${ph})`).all(...chunk) as any[]));
    case 'bien-phap':
      return quaHocVien(theoLo(ids, (chunk, ph) => conn.prepare(
        `SELECT id, student_id AS sid FROM discipline_measures WHERE id IN (${ph})`).all(...chunk) as any[]));
    default:
      return new Map();
  }
}

/** Giữ phần tử thuộc đúng chương trình. Cả hai = không lọc. Không xác định được lớp → bị loại khỏi cả hai chương trình. */
export function locTheoChuongTrinh(unit: ChiSo['donVi'], ids: number[], ct: ChuongTrinh): number[] {
  if (ct === 'ca-hai' || !ids.length) return ids;
  const m = lopCuaTap(unit, ids);
  const muonFt = ct === 'ft';
  return ids.filter((id) => { const x = m.get(id); return !!x && x.isFt !== null && x.isFt === muonFt; });
}

/** Dòng phụ ≤ 60 ký tự (G-3): hai lớp nhiều nhất kèm số, còn lại "+k lớp". Một phần tử: chỉ tên lớp. */
export function tachTheoLop(unit: ChiSo['donVi'], ids: number[], toiDa = 2): string {
  if (!ids.length) return '';
  const m = lopCuaTap(unit, ids);
  const dem = new Map<string, number>();
  for (const id of ids) { const code = m.get(id)?.code ?? 'Chưa rõ lớp'; dem.set(code, (dem.get(code) ?? 0) + 1); }
  if (ids.length === 1) return [...dem.keys()][0];
  const xep = [...dem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'));
  const phan = xep.slice(0, toiDa).map(([c, n]) => `${c} (${n})`);
  if (xep.length > toiDa) phan.push(`+${xep.length - toiDa} lớp`);
  return phan.join(' · ');
}
```

  > Vòng import `chuongTrinh.ts` ↔ `metrics.ts` (cả hai import nhau): `parseObligation` là hằng hàm nên an toàn khi gọi lúc
  > chạy. Nếu `tsc`/node báo lỗi vòng import → chuyển `obligationId`/`parseObligation` sang `chuongTrinh.ts` và
  > `metrics.ts` import lại từ đó (ghi Nhật ký).

- [x] **Step 4: `metricSet` nhận `program`.** Ở `metrics.ts`:
  - import: `import { locTheoChuongTrinh } from './chuongTrinh.ts';` và thêm `type ChuongTrinh` vào dòng import từ shared.
  - Đổi tên hàm hiện có `export function metricSet(` (dòng 345) thành `function metricSetGoc(` (bỏ `export`), giữ nguyên
    thân. Thêm **ngay trước** nó:

```ts
/**
 * MỘT CHỈ SỐ → MỘT TẬP ID, đã áp quyền của người gọi — và, nếu có, CHƯƠNG TRÌNH đang chọn ở Tổng quan (P6b). Đây là hàm
 * DUY NHẤT mà cả ô số lẫn panel danh sách gọi. Bộ lọc chương trình đặt ở ĐÂY, một lần, cho mọi chỉ số: lọc cả tập đếm lẫn
 * tử số/mẫu số/tập chia, nên "9 / 38 đánh giá được" và danh sách khi bấm vẫn cùng một phạm vi.
 */
export function metricSet(
  p: Principal, id: string,
  f: { branchId?: number | null; skill?: string | null; from?: string | null; to?: string | null; kind?: string | null; program?: ChuongTrinh | null } = {},
): MetricResult {
  const r = metricSetGoc(p, id, f);
  const ct = f.program ?? 'ca-hai';
  if (ct === 'ca-hai') return r;
  const moi = [...new Set([...r.ids, ...(r.numeratorIds ?? []), ...(r.denominatorIds ?? [])])];
  const giu = new Set(locTheoChuongTrinh(r.unit, moi, ct));
  const loc = (xs?: number[]) => xs?.filter((x) => giu.has(x));
  const ids = loc(r.ids)!;
  return {
    ...r, ids, n: ids.length,
    numeratorIds: loc(r.numeratorIds), denominatorIds: loc(r.denominatorIds),
    splits: r.splits ? { tamThoi: loc(r.splits.tamThoi)!, ketQuaCuoi: loc(r.splits.ketQuaCuoi)! } : undefined,
    byKind: r.byKind ? Object.fromEntries(Object.entries(r.byKind).map(([k, v]) => [k, loc(v)!])) : undefined,
  };
}
```
  Chữ ký của `metricSetGoc` giữ kiểu `f` cũ (không cần `program`). Mọi nơi khác gọi `metricSet` (branchpulse, routes,
  yThuc…) không đổi.

- [x] **Step 5: Route.** `server/src/routes/index.ts` ~850-857, trong object truyền cho `metricSet` thêm một dòng
  `program: chuongTrinhTuThamSo(qStr(req, 'ct')),` và thêm `chuongTrinhTuThamSo` vào import từ `shared/domain/index.ts`
  (dòng import có sẵn ở đầu file; không có thì thêm một dòng import mới).
- [x] **Step 6: Chạy, xanh** (mốc + 7). Phép kiểm cũ về `metricSet`/bảng chi nhánh vẫn ✓.
- [x] **Step 7: Commit.** `git commit -am "PR-Pa (3): lọc chương trình Lớp thường/Fast Track một chỗ trong metricSet; /metrics nhận ct"` (nhớ `git add server/src/worklist/chuongTrinh.ts`).

---

### Task 4: Ba chỉ số mới cho Cần xử lý + `rowsFor` bài thi, chữ tín hiệu

**Files:**
- Modify: `shared/domain/metrics.ts` (thêm 3 mục sau `tin-hieu-qua-han`, dòng ~80)
- Modify: `server/src/worklist/metrics.ts` — `LISTED_METRICS` (191-197), `switch (id)` (~379), `rowsFor` (92, 156-160)
- Modify: `server/src/tests/run.ts:7973-7978` (sổ 24 → 27)
- Test: `server/src/tests/tongQuan.tests.ts`

**Interfaces:**
- Consumes: `awaitingCauseCaseIds` (`sosState.ts`, đã import), `scoreDebtCells` (`scoreDebt.ts`), `labelOf` (`signals.ts`).
- Produces: chỉ số `case-xac-dinh-nguyen-nhan-qua-han` (case), `bai-qua-han-nhap-diem` (bai-thi),
  `case-chua-co-nguoi-phu-trach` (case) — dùng được qua `metricSet` và `/metrics/:id`.

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 4. Ba chỉ số mới
  check('PR-Pa · Chỉ số case-chua-co-nguoi-phu-trach: Case mở không người phụ trách có; gán người thì hết; luôn ⊆ case-mo', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    const c = moCase(hv.sid, 'reading');
    conn.prepare('UPDATE sos_cases SET owner_user_id = NULL WHERE id = ?').run(c.id);
    assert(ids('case-chua-co-nguoi-phu-trach').includes(c.id), 'Case không người phụ trách phải có');
    conn.prepare('UPDATE sos_cases SET owner_user_id = ? WHERE id = ?').run(P.normalCoreTeacher.userId, c.id);
    assert(!ids('case-chua-co-nguoi-phu-trach').includes(c.id), 'Đã có người phụ trách thì không đếm');
    const mo = ids('case-mo');
    assert(ids('case-chua-co-nguoi-phu-trach').every((x) => mo.includes(x)), 'Phải là tập con của Case đang mở');
  });

  check('PR-Pa · Chỉ số case-xac-dinh-nguyen-nhan-qua-han = Case chờ xác định nguyên nhân mà hạn 3 ngày của tín hiệu nối đã qua', () => {
    const cho = ids('case-cho-xac-dinh-nguyen-nhan');
    const quaHan = cho.filter((id) => {
      const r = conn.prepare(`SELECT MIN(verify_due) AS due FROM case_signals WHERE case_id = ? AND status = 'linked'`).get(id) as any;
      return r?.due && r.due < TODAY;
    }).sort((a, b) => a - b);
    eq(ids('case-xac-dinh-nguyen-nhan-qua-han'), quaHan, 'Lệch tập');
  });

  await checkAsync('PR-Pa · Chỉ số bai-qua-han-nhap-diem = lượt có ô điểm quá hạn (cùng hàm scoreDebtCells của bảng chấm); GV chỉ thấy lớp mình', async () => {
    const debt: any = await import('../worklist/scoreDebt.ts');
    const want = [...new Set((debt.scoreDebtCells(P.admin, TODAY, null) as any[]).filter((x) => x.overdue).map((x) => x.attemptId))]
      .sort((a: number, b: number) => a - b);
    eq(ids('bai-qua-han-nhap-diem'), want, 'Quản trị');
    const gv = metricsSvc.metricSet(P.lrTeacher, 'bai-qua-han-nhap-diem', {}).ids as number[];
    const lopGv = new Set((conn.prepare(`SELECT class_id FROM teacher_assignments WHERE user_id = ? AND status = 'active'`)
      .all(P.lrTeacher.userId) as any[]).map((r) => r.class_id));
    for (const a of gv) {
      const cl = (conn.prepare('SELECT class_id FROM assessment_attempts WHERE id = ?').get(a) as any).class_id;
      assert(lopGv.has(cl), `GV thấy lượt của lớp không dạy: ${a}`);
    }
  });

  check('PR-Pa · rowsFor: tín hiệu ghi tên môn (không chữ thô "listening"); bài thi có dòng', () => {
    const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    diem(hv.attemptId, 'listening', 10, 40);
    const sg = tinHieu(hv.attemptId, 'listening');
    const row = metricsSvc.rowsFor('tin-hieu', [sg.id])[0];
    assert(/Listening/.test(row.title) && !/listening/.test(row.title), `Chữ thô: ${row.title}`);
    const bai = metricsSvc.rowsFor('bai-thi', [hv.attemptId])[0];
    assert(bai.href !== '#' && /Giữa khoá|Bài/.test(bai.title), `Bài thi không có dòng: ${JSON.stringify(bai)}`);
  });
```
  > `check` nhận hàm đồng bộ; phép nào có `await` dùng `await checkAsync(...)`.

- [x] **Step 2: Chạy, đỏ** (`Không tìm thấy chỉ số` / 501; chữ thô).
- [x] **Step 3: Sổ chỉ số.** `shared/domain/metrics.ts`, thêm ngay sau khối `tin-hieu-qua-han`:

```ts
  /* Ba chỉ số của khối Cần xử lý (PR-Pa, đặc tả §3.2) — mỗi dòng của khối là một chỉ số, để bấm vào ra đúng tập. */
  {
    id: 'case-xac-dinh-nguyen-nhan-qua-han', ten: 'Case quá hạn xác định nguyên nhân',
    cauHoi: 'Bao nhiêu Case SOS tự tạo đã quá hạn 3 ngày mà GVBM chưa xác định nguyên nhân hoặc chưa xác nhận PA gợi ý?',
    donVi: 'case',
    tapDuDieuKien: 'Trong tập "Case chờ xác định nguyên nhân": Case mà hạn 3 ngày của tín hiệu đã nối (sớm nhất) đã qua. Hết ngày hạn mới tính quá hạn.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT case_id', drilldown: '/metrics/case-xac-dinh-nguyen-nhan-qua-han',
  },
  {
    id: 'bai-qua-han-nhap-diem', ten: 'Bài chưa nhập điểm quá hạn',
    cauHoi: 'Bao nhiêu lượt Test có ô điểm đã quá hạn nhập mà người được phân công chưa nhập?',
    donVi: 'bai-thi',
    tapDuDieuKien: 'Lượt Test (không huỷ, lớp đang hoạt động) có ít nhất một ô điểm còn nợ đã quá hạn — cùng luật với ô ở bảng chấm: lớp thường theo số câu đúng, hạn Chủ nhật tuần thi môn đó; Fast Track theo band, dấu "-" theo cặp W1/W2. Vắng đã xác nhận, huỷ phần thi, chờ duyệt dời không phải nợ.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT attempt_id', drilldown: '/metrics/bai-qua-han-nhap-diem',
  },
  {
    id: 'case-chua-co-nguoi-phu-trach', ten: 'Case chưa có người phụ trách',
    cauHoi: 'Bao nhiêu Case đang mở mà chưa ai nhận điều phối?',
    donVi: 'case',
    tapDuDieuKien: 'Case HỌC THUẬT chưa kết luận trong phạm vi mà chưa có người phụ trách.',
    thoiGian: 'hien-trang', khuTrung: 'COUNT DISTINCT case_id', drilldown: '/metrics/case-chua-co-nguoi-phu-trach',
  },
```

- [x] **Step 4: Hàm tập ID** (`server/src/worklist/metrics.ts`):
  - `LISTED_METRICS`: thêm `'case-xac-dinh-nguyen-nhan-qua-han', 'bai-qua-han-nhap-diem', 'case-chua-co-nguoi-phu-trach',` sau `'tin-hieu-qua-han',`.
  - import: `import { scoreDebtCells } from './scoreDebt.ts';` · `labelOf` thêm vào import từ `'../cases/signals.ts'`.
  - Thêm hai trợ giúp trên `metricSetGoc`:

```ts
/** Case chờ xác định nguyên nhân mà hạn 3 ngày của tín hiệu đã nối (sớm nhất) đã qua — cùng hạn `mywork.ts` dùng cho dòng `cause`. */
function causeOverdue(caseIds: number[], today: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < caseIds.length; i += 400) {
    const chunk = caseIds.slice(i, i + 400);
    out.push(...(db().prepare(
      `SELECT case_id AS id FROM case_signals WHERE status = 'linked' AND case_id IN (${chunk.map(() => '?').join(',')})
        GROUP BY case_id HAVING MIN(verify_due) < ? ORDER BY case_id`,
    ).all(...chunk, today) as any[]).map((r) => r.id as number));
  }
  return out;
}

/**
 * Lượt có ô điểm QUÁ HẠN nhập, trong phạm vi. `scoreDebtCells` lọc theo chi nhánh; giáo viên (phạm vi theo LỚP) lọc thêm theo
 * lớp — không được đổi quyền theo lớp thành quyền cả chi nhánh.
 */
function overdueScoreAttempts(p: Principal, branchId: number | null, today: string): number[] {
  const sc = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (sc.none) return [];
  let branches: number[] | null = null;
  if (branchId) branches = [branchId];
  else if (!sc.all) {
    const set = new Set<number>(sc.branchIds);
    if (sc.classIds.length) {
      for (const r of db().prepare(`SELECT DISTINCT branch_id FROM classes WHERE id IN (${sc.classIds.map(() => '?').join(',')})`)
        .all(...sc.classIds) as any[]) set.add(r.branch_id);
    }
    branches = [...set];
  }
  const onlyClasses = !sc.all && !sc.branchIds.length ? new Set<number>(sc.classIds) : null;
  const ids = new Set<number>();
  for (const x of scoreDebtCells(p, today, branches)) {
    if (!x.overdue) continue;
    if (onlyClasses && !onlyClasses.has(x.classId)) continue;
    ids.add(x.attemptId);
  }
  return [...ids].sort((a, b) => a - b);
}
```
  - Trong `switch (id)` của `metricSetGoc`, thêm sau `case 'tin-hieu-qua-han': …`:

```ts
    case 'case-xac-dinh-nguyen-nhan-qua-han':
      return done(causeOverdue(awaitingCauseCaseIds(openCases().map((c: any) => c.id as number)), today));
    case 'bai-qua-han-nhap-diem':
      return done(overdueScoreAttempts(p, scope.branchId, today));
    case 'case-chua-co-nguoi-phu-trach':
      return done(openCases().filter((c: any) => !c.ownerUserId).map((c: any) => c.id as number));
```
  - `rowsFor`: dòng 92 `} else if (unit === 'dot-test') {` → `} else if (unit === 'dot-test' || unit === 'bai-thi') {`.
    Dòng tín hiệu (~158): `title: \`Tín hiệu cần xác minh · ${r.skill ?? 'chưa rõ kỹ năng'}\`` →
    `title: \`Tín hiệu cần xác minh · ${labelOf(r)}\``.
- [x] **Step 5: Phép kiểm sổ chỉ số cũ** (`run.ts` ~7973-7978): đổi `list.length === 24` → `=== 27`; câu thông báo
  "Phải có hai mươi bốn chỉ số (…)" → "Phải có hai mươi bảy chỉ số (… + một của PR-S1: tin-hieu-qua-han + ba của PR-Pa:
  case-xac-dinh-nguyen-nhan-qua-han, bai-qua-han-nhap-diem, case-chua-co-nguoi-phu-trach)"; thêm ba mã vào mảng
  `expected` sau `'tin-hieu-qua-han',`. Tên phép kiểm giữ nguyên. Nếu có phép kiểm khác đếm `LISTED_METRICS` → sửa tương
  tự, ghi Nhật ký.
- [x] **Step 6: Chạy, xanh** (mốc + 11). **Step 7: Commit.** ✓ `git commit -am "PR-Pa (4): ba chỉ số của khối Cần xử lý; rowsFor bài thi; chữ môn ở dòng tín hiệu"`

---

### Task 5: Máy chủ — Cần xử lý, Điểm đáng chú ý, Học viên cần hỗ trợ (`worklist/tongQuan.ts`) + route

**Files:**
- Create: `server/src/worklist/tongQuan.ts`
- Modify: `server/src/routes/index.ts` (khối mới sau `/highlights`, ~1141)
- Test: `server/src/tests/tongQuan.tests.ts`

**Interfaces:**
- Consumes: `metricSet` (Task 3/4), `sapCanXuLy`, `chonDiemDangChuY`, `CAN_XU_LY` (Task 1), `tachTheoLop` (Task 3),
  `latestAttempts`, `studentsInScope` (`danhGia.ts`), `listCases`, `warningsFor` (`yThuc/canhBao.ts`).
- Produces:
  - `tongQuanQuanLy(p, f: { branchId?: number | null; ct: ChuongTrinh }): { canXuLy: (DongCanXuLyGoc & { phu: string })[]; diemDangChuY: DiemChuY[] }` — ném 403 khi không có phạm vi `MEETING_VIEW`.
  - `hocVienCanHoTro(p): { rows: DongHvCanHoTro[]; tong: number }` với
    `DongHvCanHoTro = { studentId: number; ten: string; lop: string | null; huyHieu: { text: string; tone: 'info' | 'warn' | 'danger' } | null; phu: string }`.
  - Route `GET /tong-quan/quan-ly?branchId=&ct=` · `GET /tong-quan/hoc-vien-can-ho-tro`.

- [x] **Step 1: Phép kiểm (đỏ).** (thêm `const tq: any = await import('../worklist/tongQuan.ts').catch(() => ({}));` ở đầu hàm)

```ts
  // ================================================================== 5. Cần xử lý · Điểm đáng chú ý · HV cần hỗ trợ
  check('PR-Pa · Cần xử lý: mỗi dòng có số = độ dài tập của đúng chỉ số đó (cùng chi nhánh, cùng chương trình); đúng thứ tự; ≤ 8', () => {
    const mb = mbBranch;
    for (const [who, f] of [[P.admin, { ct: 'ca-hai' }], [P.mbManager, { branchId: mb, ct: 'thuong' }], [P.mbManager, { ct: 'ft' }]] as const) {
      const r = tq.tongQuanQuanLy(who, f);
      assert(r.canXuLy.length <= 8, 'Quá 8 dòng');
      const thuTu = d.CAN_XU_LY.map((x: any) => x.metricId);
      let truoc = -1;
      for (const dong of r.canXuLy) {
        const n = metricsSvc.metricSet(who, dong.metricId, { branchId: (f as any).branchId ?? null, program: f.ct }).n;
        eq(dong.n, n, `Số dòng ${dong.metricId}`);
        assert(dong.n > 0, 'Dòng 0 phải bị bỏ');
        assert(thuTu.indexOf(dong.metricId) > truoc, 'Sai thứ tự');
        truoc = thuTu.indexOf(dong.metricId);
        assert(typeof dong.phu === 'string' && dong.phu.length <= 60, `Dòng phụ quá 60 ký tự: ${dong.phu}`);
      }
    }
  });

  check('PR-Pa · Điểm đáng chú ý: ≤ 3; mỗi link mở đúng số dòng đã ghi', () => {
    const r = tq.tongQuanQuanLy(P.admin, { ct: 'ca-hai' });
    assert(r.diemDangChuY.length <= 3, 'Quá 3 điểm');
    for (const x of r.diemDangChuY) {
      const set = metricsSvc.metricSet(P.admin, x.metricId, { ...(x.extra ?? {}), program: 'ca-hai' });
      eq(x.soDanhSach, set.ids.length, `Link ${x.loai} ghi ${x.soDanhSach} mà danh sách có ${set.ids.length}`);
    }
  });

  check('PR-Pa · Khối Quản lý: giáo viên bị từ chối (403), không trả tập rút gọn', () => {
    assertThrows(() => tq.tongQuanQuanLy(P.normalCoreTeacher, { ct: 'ca-hai' }), /Quản lý/, 'GVCN mở khối Quản lý');
  });

  check('PR-Pa · Học viên cần hỗ trợ: em có SOS ở lớp tôi dạy có mặt kèm nhãn SOS; em không có gì thì không; GV lớp khác không thấy', () => {
    const co = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    for (const [s, sc, tt] of [['listening', 10, 40], ['reading', 10, 40], ['writing', 5, 20], ['speaking', 20, 25]] as const) diem(co.attemptId, s, sc, tt);
    const khong = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
    for (const [s, sc, tt] of [['listening', 35, 40], ['reading', 35, 40], ['writing', 18, 20], ['speaking', 22, 25]] as const) diem(khong.attemptId, s, sc, tt);
    const r = tq.hocVienCanHoTro(P.normalCoreTeacher);
    const dong = r.rows.find((x: any) => x.studentId === co.sid);
    assert(dong && /^SOS [123]/.test(dong.huyHieu?.text ?? ''), `Thiếu em có SOS hoặc thiếu nhãn: ${JSON.stringify(dong)}`);
    assert(!r.rows.some((x: any) => x.studentId === khong.sid), 'Em đạt hết không phải "cần hỗ trợ"');
    eq(r.tong, r.rows.length, 'tong = số dòng');
    assert(!tq.hocVienCanHoTro(P.w2Teacher /* GV W2 MB-FT 101, không dạy MB-FOU 12 */).rows.some((x: any) => x.studentId === co.sid), 'GV lớp khác thấy em');
    const sos = r.rows.filter((x: any) => x.huyHieu && /^SOS/.test(x.huyHieu.text)).map((x: any) => Number(x.huyHieu.text[4]));
    assert(sos.every((v: number, i: number) => i === 0 || sos[i - 1] >= v), 'Phải xếp mức SOS giảm dần');
  });
```
  > **Không** dùng `P.coreTeacher`: GVCN MB-FT 101 và GVCN MB-FOU 12 cùng là Trần Ngọc Hà. Nếu `P.w2Teacher` hoá ra cũng
  > dạy MB-FOU 12 (`SELECT … FROM teacher_assignments`) → chọn một GV khác không dạy lớp đó; ghi Nhật ký.
  > Phép "Bảng chi nhánh … Quản lý một chi nhánh" giả định `P.mbManager` chỉ có chi nhánh MB; nếu phạm vi có > 1 chi nhánh
  > thì đổi kỳ vọng thành `cheDo === 'chi-nhanh'` khi không chọn và `'lop'` khi truyền `branchId: mbBranch`; ghi Nhật ký.

- [x] **Step 2: Chạy, đỏ.**
- [x] **Step 3: Tạo `server/src/worklist/tongQuan.ts`:**

```ts
import { db } from '../db.ts';
import {
  CAN_XU_LY, PERMISSIONS, REGULAR_SKILL_LABEL, SOS_LABEL, caseTopicLabel, chonDiemDangChuY, sapCanXuLy,
  type ChuongTrinh, type DiemChuY, type DongCanXuLyGoc, type MaCanXuLy, type UngVienChuY,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, forbidden } from '../util.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { listCases } from '../cases/cases.ts';
import { warningsFor } from '../yThuc/canhBao.ts';
import { latestAttempts, studentsInScope } from './danhGia.ts';
import { metricSet } from './metrics.ts';
import { tachTheoLop } from './chuongTrinh.ts';

/**
 * TỔNG QUAN (PR-Pa, đặc tả §3.2). File này KHÔNG ĐẾM gì: mọi số lấy từ `metricSet` (hợp đồng số liệu luật 1), ở đây chỉ
 * chọn chỉ số nào lên khối nào, xếp thứ tự và viết dòng phụ.
 */

export function tongQuanQuanLy(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }) {
  if (scopeFor(p, PERMISSIONS.MEETING_VIEW).none) throw forbidden('Khối này dành cho Quản lý.');
  const base = { branchId: f.branchId ?? null, program: f.ct };

  /* CẦN XỬ LÝ — mỗi dòng một chỉ số của sổ. */
  const sets = new Map<MaCanXuLy, ReturnType<typeof metricSet>>();
  const dem: Partial<Record<MaCanXuLy, number>> = {};
  for (const x of CAN_XU_LY) {
    const r = metricSet(p, x.metricId, base);
    sets.set(x.metricId, r);
    dem[x.metricId] = r.n;
  }
  const coQuyenDuyet = can(p, PERMISSIONS.CASE_APPROVE, { anyScope: true });
  const canXuLy: (DongCanXuLyGoc & { phu: string })[] = sapCanXuLy(dem, coQuyenDuyet).map((x) => {
    const r = sets.get(x.metricId)!;
    return { ...x, phu: tachTheoLop(r.unit, r.ids) };
  });

  /* ĐIỂM ĐÁNG CHÚ Ý — ba luật (plan Q6), mỗi ứng viên là một chỉ số có sẵn. */
  const ung: UngVienChuY[] = [];
  for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
    const r = metricSet(p, 'hv-duoi-ky-vong-mon', { ...base, skill });
    ung.push({ loai: 'mon-duoi-ky-vong', metricId: 'hv-duoi-ky-vong-mon', extra: { skill }, tu: r.n,
      mau: r.denominatorIds?.length ?? 0, nhanMon: REGULAR_SKILL_LABEL[skill] });
  }
  const tl = metricSet(p, 'ty-le-co-cai-thien', base);
  ung.push({ loai: 'pa-cai-thien', metricId: 'ty-le-co-cai-thien', tu: tl.numeratorIds?.length ?? 0, mau: tl.n });
  const from = addDays(demoToday(), -30);
  const dh = metricSet(p, 'dung-han-cap-nhat', { ...base, from });
  ung.push({ loai: 'dung-han', metricId: 'dung-han-cap-nhat', extra: { from }, tu: dh.numeratorIds?.length ?? 0, mau: dh.n });
  const diemDangChuY: DiemChuY[] = chonDiemDangChuY(ung, f.ct);

  return { canXuLy, diemDangChuY };
}

export type DongHvCanHoTro = {
  studentId: number; ten: string; lop: string | null;
  huyHieu: { text: string; tone: 'info' | 'warn' | 'danger' } | null;
  phu: string;
};

/**
 * HỌC VIÊN CẦN HỖ TRỢ — khối của giáo viên (§3.2, mockup 02 bản GV). Em ĐANG HỌC ở lớp người xem được xem, có SOS ≥ 1 ở
 * đợt mới nhất hợp lệ, hoặc Case đang mở, hoặc cảnh báo vi phạm 5 ngày. Mọi phần dùng lại hàm có sẵn (không luật mới):
 * `latestAttempts` (SOS), `listCases` (Case), `pa-can-cap-nhat` (PA quá hạn), `warningsFor` (vi phạm).
 */
export function hocVienCanHoTro(p: Principal): { rows: DongHvCanHoTro[]; tong: number } {
  const today = demoToday();
  const sids = studentsInScope(p, null);
  if (!sids.length) return { rows: [], tong: 0 };
  const trong = new Set(sids);
  const latest = latestAttempts(sids, 'valid', today);

  const caseCua = new Map<number, { n: number; mon: Set<string> }>();
  const caseHv = new Map<number, number>();
  for (const c of listCases(p, {}).rows as any[]) {
    if (c.state === 'done' || !c.studentId || !trong.has(c.studentId)) continue;
    caseHv.set(c.id, c.studentId);
    const x = caseCua.get(c.studentId) ?? { n: 0, mon: new Set<string>() };
    x.n += 1;
    if (c.topic) x.mon.add(caseTopicLabel(c.topic));
    caseCua.set(c.studentId, x);
  }
  const paQuaHan = new Map<number, number>();
  const pa = metricSet(p, 'pa-can-cap-nhat', {}).ids;
  for (let i = 0; i < pa.length; i += 400) {
    const chunk = pa.slice(i, i + 400);
    for (const r of db().prepare(`SELECT case_id FROM case_interventions WHERE id IN (${chunk.map(() => '?').join(',')})`)
      .all(...chunk) as any[]) {
      const sid = caseHv.get(r.case_id);
      if (sid) paQuaHan.set(sid, (paQuaHan.get(sid) ?? 0) + 1);
    }
  }
  const canhBao = warningsFor(sids, today);

  const info = new Map<number, { ten: string; lop: string | null }>();
  for (let i = 0; i < sids.length; i += 400) {
    const chunk = sids.slice(i, i + 400);
    for (const r of db().prepare(
      `SELECT s.id, s.full_name,
              (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id
                WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS lop
         FROM students s WHERE s.id IN (${chunk.map(() => '?').join(',')})`,
    ).all(...chunk) as any[]) info.set(r.id, { ten: r.full_name, lop: r.lop ?? null });
  }

  const rows: (DongHvCanHoTro & { _sos: number; _case: number })[] = [];
  for (const sid of sids) {
    const ev = latest.get(sid);
    const sos = ev?.sosLevel ?? 0;
    const cs = caseCua.get(sid);
    const cb = canhBao.get(sid);
    const coCanhBao = !!cb?.active;
    if (sos <= 0 && !cs && !coCanhBao) continue;
    const huyHieu = sos > 0
      ? { text: `${SOS_LABEL[sos as 1 | 2 | 3]}${ev?.provisional ? ' · tạm thời' : ''}`, tone: (sos >= 3 ? 'danger' : sos === 2 ? 'warn' : 'info') as 'info' | 'warn' | 'danger' }
      : coCanhBao ? { text: 'Ý thức', tone: 'info' as const } : null;
    const k = paQuaHan.get(sid) ?? 0;
    const phu = cs
      ? [`${cs.n} Case`, k ? `${k} PA quá hạn` : [...cs.mon].join(', ')].filter(Boolean).join(' · ')
      : coCanhBao ? `${cb!.count} vi phạm chưa xử lý` : '';
    rows.push({ studentId: sid, ten: info.get(sid)?.ten ?? 'Học viên', lop: info.get(sid)?.lop ?? null, huyHieu,
      phu: phu.length > 60 ? `${phu.slice(0, 57)}…` : phu, _sos: sos, _case: cs?.n ?? 0 });
  }
  rows.sort((a, b) => b._sos - a._sos || b._case - a._case || a.ten.localeCompare(b.ten, 'vi'));
  const out = rows.map(({ _sos, _case, ...r }) => r);
  return { rows: out, tong: out.length };
}
```
- [x] **Step 4: Route** — thêm khối mới ngay sau route `/highlights` (~1141):

```ts
// ============================================================ Tổng quan (PR-Pa, đặc tả §3.2)

/** Khối Quản lý: Cần xử lý + Điểm đáng chú ý. Mọi số đi qua `metricSet` — cùng số với `/metrics/:id`. */
api.get('/tong-quan/quan-ly', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongQuanSvc.tongQuanQuanLy(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
  });
}));

/** Khối giáo viên: Học viên cần hỗ trợ (lớp tôi dạy). */
api.get('/tong-quan/hoc-vien-can-ho-tro', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return tongQuanSvc.hocVienCanHoTro(principalOf(req));
}));
```
  Import ở đầu file (cạnh `highlightSvc`): `import * as tongQuanSvc from '../worklist/tongQuan.ts';`.

- [x] **Step 5: Chạy, xanh** (mốc + 15). **Step 6: Commit** (thêm file mới vào `git add`): ✓
  `"PR-Pa (5): máy chủ khối Cần xử lý, Điểm đáng chú ý, Học viên cần hỗ trợ — số lấy từ metricSet"`

---

### Task 6: Máy chủ — bảng Theo chi nhánh mở xuống lớp (`worklist/bangChiNhanh.ts`) + route

**Files:**
- Create: `server/src/worklist/bangChiNhanh.ts`
- Modify: `server/src/routes/index.ts` (cùng khối Task 5)
- Test: `server/src/tests/tongQuan.tests.ts`

**Interfaces:**
- Consumes: `metricSet`, `listCases`, `rowsFor`, `COT_BANG`, `COT_BANG_DON_VI`, `METRIC_UNIT_LABEL`.
- Produces:
  - `type OBang = { n: number; mau?: number }`
  - `type HangBang = { khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null; o: Record<CotBang, OBang>; lop?: HangBang[] }`
  - `bangChiNhanh(p, f: { branchId?: number | null; ct: ChuongTrinh }): { cheDo: 'chi-nhanh' | 'lop'; hang: HangBang[]; tong: Record<CotBang, OBang>; tenChiNhanh: string | null }`
  - `oBangChiNhanh(p, f & { cot: CotBang; khoa: string }): { n: number; unit: string; tieuDe: string; rows: MetricRow[] }`
  - Khoá ô: `'tong'` · `'cn:{id}'` · `'lop:{id}'`.
  - Route `GET /tong-quan/chi-nhanh?branchId=&ct=` · `GET /tong-quan/chi-nhanh/o?cot=&khoa=&branchId=&ct=`.

- [x] **Step 1: Phép kiểm (đỏ).** (`const bang: any = await import('../worklist/bangChiNhanh.ts').catch(() => ({}));` ở đầu hàm)

```ts
  // ================================================================== 6. Bảng Theo chi nhánh
  const moiO = (who: any, f: any, cb: (khoa: string, cot: string, o: any) => void) => {
    const b = bang.bangChiNhanh(who, f);
    for (const cot of d.COT_BANG) cb('tong', cot, b.tong[cot]);
    for (const h of b.hang) {
      for (const cot of d.COT_BANG) cb(h.khoa, cot, h.o[cot]);
      for (const l of h.lop ?? []) for (const cot of d.COT_BANG) cb(l.khoa, cot, l.o[cot]);
    }
    return b;
  };

  check('PR-Pa · Bảng chi nhánh: bấm MỌI ô ra đúng số dòng đã ghi (G-10); hàng tổng là tập gốc của chỉ số', () => {
    moiO(P.admin, { ct: 'ca-hai' }, (khoa, cot, o) => {
      const r = bang.oBangChiNhanh(P.admin, { ct: 'ca-hai', cot, khoa });
      eq(r.rows.length, o.n, `Ô ${khoa}/${cot}`);
    });
    const t = bang.oBangChiNhanh(P.admin, { ct: 'ca-hai', cot: 'caseMo', khoa: 'tong' });
    eq(t.rows.map((x: any) => x.id).sort((a: number, b: number) => a - b), ids('case-mo').slice().sort((a, b) => a - b), 'Tổng Case mở = case-mo');
    const dd = bang.bangChiNhanh(P.admin, { ct: 'ca-hai' }).tong.duDuLieu;
    const phu = metricsSvc.metricSet(P.admin, 'do-phu-danh-gia', {});
    eq([dd.n, dd.mau], [phu.numeratorIds.length, phu.n], 'Đủ dữ liệu = tử số / mẫu số của do-phu-danh-gia');
  });

  check('PR-Pa · Bảng chi nhánh: Quản trị không chọn chi nhánh → hàng chi nhánh mở xuống lớp; Quản lý một chi nhánh → bảng lớp luôn', () => {
    const a = bang.bangChiNhanh(P.admin, { ct: 'ca-hai' });
    assert(a.cheDo === 'chi-nhanh' && a.hang.every((h: any) => h.loai === 'chi-nhanh' && Array.isArray(h.lop)), 'Quản trị');
    const m = bang.bangChiNhanh(P.mbManager, { ct: 'ca-hai' });
    assert(m.cheDo === 'lop' && m.hang.every((h: any) => h.loai === 'lop') && m.tenChiNhanh === 'Monbay', `Quản lý MB: ${m.cheDo}`);
  });

  check('PR-Pa · Bảng chi nhánh: Lớp thường không có hàng lớp FT; giáo viên bị từ chối', () => {
    const b = bang.bangChiNhanh(P.admin, { branchId: mbBranch, ct: 'thuong' });
    assert(b.hang.length > 0 && b.hang.every((h: any) => h.laFt === false), 'Lọt lớp FT vào Lớp thường');
    assertThrows(() => bang.bangChiNhanh(P.normalCoreTeacher, { ct: 'ca-hai' }), /Quản lý/, 'GV mở bảng chi nhánh');
  });
```

- [x] **Step 2: Chạy, đỏ.**
- [x] **Step 3: Tạo `server/src/worklist/bangChiNhanh.ts`:**

```ts
import { db } from '../db.ts';
import {
  COT_BANG, COT_BANG_DON_VI, METRIC_UNIT_LABEL, PERMISSIONS, type ChuongTrinh, type CotBang,
} from '../../../shared/domain/index.ts';
import { forbidden, badRequest } from '../util.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { listCases } from '../cases/cases.ts';
import { metricSet, rowsFor, type MetricRow } from './metrics.ts';

/**
 * BẢNG "THEO CHI NHÁNH" (§3.2, mockup 02 phương án A; kiểm kê P5) — Học viên · Dưới kỳ vọng · SOS · Case mở · Thiếu PA học
 * thuật · Đủ dữ liệu đánh giá.
 *
 * KHÔNG ĐẾM LẠI. Năm tập gốc lấy từ `metricSet` (cùng hàm, cùng quyền, cùng chương trình với ô số); bảng chỉ CHIA chúng về
 * lớp: học viên theo lớp ĐANG học, Case theo lớp nơi em đang được chăm sóc (`homeClassId`, như `branchpulse.ts`). Hàng tổng
 * là TẬP GỐC, không phải tổng các hàng — một em ở hai lớp có mặt ở cả hai hàng nhưng một lần ở tổng (HĐSL luật 4).
 * Mỗi ô mở được danh sách qua `oBangChiNhanh`, tính lại bằng CHÍNH hàm này — số và danh sách không thể lệch.
 */
export type OBang = { n: number; mau?: number };
export type HangBang = {
  khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null;
  o: Record<CotBang, OBang>; lop?: HangBang[];
};
type Tap = Record<CotBang, Set<number>> & { duDuLieuMau: Set<number> };
const tapRong = (): Tap => ({
  hocVien: new Set(), duoiKyVong: new Set(), sos: new Set(), caseMo: new Set(), thieuPa: new Set(), duDuLieu: new Set(), duDuLieuMau: new Set(),
});
const gop = (a: Tap, b: Tap) => { for (const k of Object.keys(a) as (keyof Tap)[]) for (const x of b[k]) a[k].add(x); };
const soCua = (t: Tap): Record<CotBang, OBang> => {
  const o = {} as Record<CotBang, OBang>;
  for (const c of COT_BANG) o[c] = { n: t[c].size };
  o.duDuLieu.mau = t.duDuLieuMau.size;
  return o;
};
const NHAN_COT: Record<CotBang, string> = {
  hocVien: 'Học viên', duoiKyVong: 'Dưới kỳ vọng', sos: 'SOS', caseMo: 'Case mở', thieuPa: 'Thiếu PA học thuật', duDuLieu: 'Đủ dữ liệu đánh giá',
};

function tinh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }) {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) throw forbidden('Bảng này dành cho Quản lý.');
  const conn = db();
  /* Một chi nhánh: đã chọn, hoặc phạm vi chỉ có một chi nhánh (P5 "1 CN thì ưu tiên bảng lớp"). */
  const branchId = f.branchId ?? (!scope.all && scope.branchIds.length === 1 ? scope.branchIds[0] : null);
  const base = { branchId, program: f.ct };
  const duoi = metricSet(p, 'hv-duoi-ky-vong-mon', base);
  const sos = metricSet(p, 'hv-sos-hien-tai', base);
  const caseMo = metricSet(p, 'case-mo', base);
  const thieu = metricSet(p, 'case-thieu-pa', base);
  const phu = metricSet(p, 'do-phu-danh-gia', base);

  const where = [`c.status = 'active'`];
  const args: unknown[] = [];
  if (!scope.all) {
    where.push(scope.branchIds.length ? `c.branch_id IN (${scope.branchIds.map(() => '?').join(',')})` : '1=0');
    args.push(...scope.branchIds);
  }
  if (branchId) { where.push('c.branch_id = ?'); args.push(branchId); }
  if (f.ct !== 'ca-hai') { where.push('c.is_fast_track = ?'); args.push(f.ct === 'ft' ? 1 : 0); }
  const lop = conn.prepare(
    `SELECT c.id, c.code, c.branch_id, c.is_fast_track, b.name AS branch_name FROM classes c
       JOIN branches b ON b.id = c.branch_id WHERE ${where.join(' AND ')} ORDER BY b.id, c.code`,
  ).all(...args) as any[];

  const tapLop = new Map<number, Tap>();
  for (const c of lop) tapLop.set(c.id, tapRong());
  if (lop.length) {
    const ph = lop.map(() => '?').join(',');
    for (const r of conn.prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.status = 'active' AND s.archived_at IS NULL AND e.class_id IN (${ph})`,
    ).all(...lop.map((c) => c.id)) as any[]) tapLop.get(r.class_id)!.hocVien.add(r.student_id);
  }
  const hvSet = (xs?: number[]) => new Set(xs ?? []);
  const sDuoi = hvSet(duoi.ids), sSos = hvSet(sos.ids), sDu = hvSet(phu.numeratorIds), sMau = hvSet(phu.ids);
  for (const t of tapLop.values()) {
    for (const sid of t.hocVien) {
      if (sDuoi.has(sid)) t.duoiKyVong.add(sid);
      if (sSos.has(sid)) t.sos.add(sid);
      if (sDu.has(sid)) t.duDuLieu.add(sid);
      if (sMau.has(sid)) t.duDuLieuMau.add(sid);
    }
  }
  const lopCuaCase = new Map<number, number | null>();
  for (const c of listCases(p, { branchId: branchId ?? undefined }).rows as any[]) lopCuaCase.set(c.id, (c.homeClassId ?? c.classId) ?? null);
  for (const id of caseMo.ids) { const l = lopCuaCase.get(id); if (l && tapLop.has(l)) tapLop.get(l)!.caseMo.add(id); }
  for (const id of thieu.ids) { const l = lopCuaCase.get(id); if (l && tapLop.has(l)) tapLop.get(l)!.thieuPa.add(id); }

  const tongTap = tapRong();
  for (const t of tapLop.values()) for (const sid of t.hocVien) tongTap.hocVien.add(sid);
  sDuoi.forEach((x) => tongTap.duoiKyVong.add(x)); sSos.forEach((x) => tongTap.sos.add(x));
  caseMo.ids.forEach((x) => tongTap.caseMo.add(x)); thieu.ids.forEach((x) => tongTap.thieuPa.add(x));
  sDu.forEach((x) => tongTap.duDuLieu.add(x)); sMau.forEach((x) => tongTap.duDuLieuMau.add(x));

  const hangLop = (c: any) => ({ khoa: `lop:${c.id}`, id: c.id, loai: 'lop' as const, nhan: c.code, laFt: !!c.is_fast_track, tap: tapLop.get(c.id)! });
  let cheDo: 'chi-nhanh' | 'lop';
  let hang: { khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null; tap: Tap; lop?: ReturnType<typeof hangLop>[] }[];
  if (branchId) {
    cheDo = 'lop';
    hang = lop.map(hangLop);
  } else {
    cheDo = 'chi-nhanh';
    const theoCn = new Map<number, { nhan: string; lop: ReturnType<typeof hangLop>[] }>();
    for (const c of lop) {
      if (!theoCn.has(c.branch_id)) theoCn.set(c.branch_id, { nhan: c.branch_name, lop: [] });
      theoCn.get(c.branch_id)!.lop.push(hangLop(c));
    }
    hang = [...theoCn.entries()].map(([id, x]) => {
      const t = tapRong();
      for (const l of x.lop) gop(t, l.tap);
      return { khoa: `cn:${id}`, id, loai: 'chi-nhanh' as const, nhan: x.nhan, laFt: null, tap: t, lop: x.lop };
    });
  }
  const tenChiNhanh = branchId ? (lop[0]?.branch_name ?? (conn.prepare('SELECT name FROM branches WHERE id = ?').get(branchId) as any)?.name ?? null) : null;
  return { cheDo, hang, tongTap, tenChiNhanh };
}

export function bangChiNhanh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh }) {
  const r = tinh(p, f);
  const gon = (h: any): HangBang => ({
    khoa: h.khoa, id: h.id, loai: h.loai, nhan: h.nhan, laFt: h.laFt, o: soCua(h.tap), lop: h.lop?.map(gon),
  });
  return { cheDo: r.cheDo, hang: r.hang.map(gon), tong: soCua(r.tongTap), tenChiNhanh: r.tenChiNhanh };
}

/** Danh sách của MỘT ô — tính lại bằng chính `tinh`, nên danh sách luôn đúng bằng con số (G-10). */
export function oBangChiNhanh(p: Principal, f: { branchId?: number | null; ct: ChuongTrinh; cot: string; khoa: string }):
  { n: number; unit: string; tieuDe: string; rows: MetricRow[] } {
  if (!(COT_BANG as readonly string[]).includes(f.cot)) throw badRequest(`Cột "${f.cot}" không có trong bảng.`);
  const cot = f.cot as CotBang;
  const r = tinh(p, f);
  let tap: Tap | null = null; let noi = '';
  if (f.khoa === 'tong') { tap = r.tongTap; noi = r.tenChiNhanh ? `cả ${r.tenChiNhanh}` : 'tất cả chi nhánh'; }
  for (const h of r.hang) {
    if (h.khoa === f.khoa) { tap = h.tap; noi = h.nhan; }
    for (const l of h.lop ?? []) if (l.khoa === f.khoa) { tap = l.tap; noi = l.nhan; }
  }
  if (!tap) throw badRequest('Không tìm thấy hàng này trong bảng — có thể bộ lọc vừa đổi.');
  const ids = [...tap[cot]].sort((a, b) => a - b);
  const unit = COT_BANG_DON_VI[cot];
  return { n: ids.length, unit, tieuDe: `${ids.length} ${METRIC_UNIT_LABEL[unit]} — ${NHAN_COT[cot]} · ${noi}`, rows: rowsFor(unit, ids) };
}
```
  `type MetricRow` đã export ở `metrics.ts:56`.

- [x] **Step 4: Route** — thêm vào khối Tổng quan (Task 5):

```ts
/** Bảng Theo chi nhánh → lớp. Chỉ số của từng ô; danh sách ô ở route dưới. */
api.get('/tong-quan/chi-nhanh', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return bangSvc.bangChiNhanh(principalOf(req), { branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')) });
}));

/** Danh sách đúng những bản ghi tạo nên MỘT ô của bảng (G-10). */
api.get('/tong-quan/chi-nhanh/o', requireAuth, wrap((req) => {
  maybeSimulateReadError();
  return bangSvc.oBangChiNhanh(principalOf(req), {
    branchId: qInt(req, 'branchId') ?? null, ct: chuongTrinhTuThamSo(qStr(req, 'ct')),
    cot: qStr(req, 'cot') ?? '', khoa: qStr(req, 'khoa') ?? '',
  });
}));
```
  Import: `import * as bangSvc from '../worklist/bangChiNhanh.ts';`.

- [x] **Step 5: Chạy, xanh** (mốc + 18). Nếu phép "mọi ô" chậm (> 20 s cả bộ) → không sao, ghi thời gian vào Nhật ký cho PR-Z2c.
- [x] **Step 6: Commit.** `"PR-Pa (6): máy chủ bảng Theo chi nhánh mở xuống lớp; mỗi ô mở đúng danh sách"`

---

### Task 7: Lịch sắp tới lọc chương trình (`highlights.ts`)

**Files:**
- Modify: `server/src/worklist/highlights.ts:62-83`
- Modify: `server/src/routes/index.ts` (`/highlights` ~1138-1141 thêm `program`)
- Test: `server/src/tests/tongQuan.tests.ts`

- [x] **Step 1: Phép kiểm (đỏ).**

```ts
  // ================================================================== 7. Lịch sắp tới
  await checkAsync('PR-Pa · Lịch sắp tới: Fast Track không có mốc lớp thường; Lớp thường không có MT/dự kiến thi', async () => {
    const hl: any = await import('../worklist/highlights.ts');
    const ft = hl.highlights(P.admin, { program: 'ft' });
    assert(ft.weeks.every((w: any) => !w.normal.progressClasses.length && !w.normal.finalClasses.length && !w.normal.endingClasses.length), 'FT lẫn lớp thường');
    const th = hl.highlights(P.admin, { program: 'thuong' });
    assert(th.weeks.every((w: any) => !w.ft.mockClasses.length && w.ft.examStudents === 0) && th.examMonthOnly.students === 0, 'Lớp thường lẫn FT');
  });
```
- [x] **Step 2: Chạy, đỏ.**
- [x] **Step 3:** `highlights.ts`: `visibleClasses(p, branchId)` thêm tham số `program: ChuongTrinh = 'ca-hai'` và điều kiện
  `if (program !== 'ca-hai') { where.push('c.is_fast_track = ?'); args.push(program === 'ft' ? 1 : 0); }`; SELECT thêm
  `c.is_fast_track`. `highlights(p, f: { branchId?: number | null; program?: ChuongTrinh | null } = {})` truyền
  `f.program ?? 'ca-hai'`. Trong vòng lớp thường (dòng ~116-117) đổi `if (c.kind === 'ft') continue;` thành
  `if (c.is_fast_track) continue;` (một định nghĩa chương trình — Q2; ghi Nhật ký nếu số mốc lớp thường ở demo đổi).
  Route `/highlights`: truyền `program: chuongTrinhTuThamSo(qStr(req, 'ct'))`.
- [x] **Step 4: Chạy, xanh** (mốc + 19). **Step 5: Commit.** `"PR-Pa (7): Lịch sắp tới lọc theo chương trình"`

---

### Task 8: Nợ S1 (2) — phép kiểm đầu–cuối: GVCN nhận tín hiệu Speaking, Tạo Case thành công

**Files:**
- Test: `server/src/tests/tongQuan.tests.ts`

- [x] **Step 1: Phép kiểm.** Thêm ở đầu hàm (cạnh các `await import` khác): `const mywork: any = await import('../worklist/mywork.ts');`

```ts
  // ================================================================== 8. Nợ S1 (2)
  check('PR-Pa · Nợ S1: không ai dạy Speaking → tín hiệu về GVCN; GVCN thấy hai nút; Tạo Case thành công, gửi lại cùng khoá ra cùng Case; dòng biến mất', () => {
    const cid = classId('MB-FOU 12');
    const tam = (conn.prepare(`SELECT id FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active'`)
      .all(cid) as any[]).map((r) => r.id as number);
    assert(tam.length > 0, 'Bộ demo phải có GV Speaking ở MB-FOU 12');
    const ph = tam.map(() => '?').join(',');
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE id IN (${ph})`).run(...tam);
    try {
      const gvcn = loadPrincipal(P.normalCoreTeacher.userId);
      const hv = taoHocVien({ classCode: 'MB-FOU 12', weekStart: '2026-09-07' });
      diem(hv.attemptId, 'speaking', 5, 25);
      const sg = tinHieu(hv.attemptId, 'speaking');
      assert(sg && sg.owner_user_id === gvcn.userId, `Tín hiệu Speaking phải về GVCN: ${sg?.owner_user_id}`);
      const dong = (mywork.myWork(gvcn).items as any[]).find((i) => i.key === `verify:${sg.id}`);
      assert(dong?.signal, 'GVCN không thấy dòng tín hiệu');
      eq(dong.signal.actions, ['create_case', 'dismiss'], 'Hai nút');
      const gui = () => cases.reportIssue(gvcn, {
        studentId: hv.sid, topic: 'speaking', fromSignalId: sg.id, idempotencyKey: `pa-e2e-${sg.id}`,
        title: 'Speaking — trả lời cụt, không mở rộng ý', summary: 'Part 2 nói dưới một phút, lặp từ nối; đã nghe lại bài thi.',
        primaryCode: d.issuesForTopic('speaking')[0].code,
      }) as any;
      const c = gui();
      eq(gui().id, c.id, 'Gửi lại cùng idempotencyKey phải ra cùng Case');
      const sau = conn.prepare('SELECT status, case_id FROM case_signals WHERE id = ?').get(sg.id) as any;
      eq([sau.status, sau.case_id], ['linked', c.id], 'Tín hiệu phải gắn vào Case');
      assert(!(mywork.myWork(gvcn).items as any[]).some((i) => i.key === `verify:${sg.id}`), 'Dòng tín hiệu phải biến mất');
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE id IN (${ph})`).run(...tam);
    }
  });
```
- [x] **Step 2: Chạy.** Kỳ vọng **xanh** ngay (máy chủ S1 đã làm). Nếu **đỏ** vì `reportIssue` / quyền từ chối GVCN →
  🛑 **dừng**: sửa nằm ở `cases.ts` (file PR-S2/AN đang sửa) — báo chủ sản phẩm kèm câu lỗi; không tự sửa `cases.ts`.
- [x] **Step 3: Commit.** `"PR-Pa (8): nợ S1 — phép kiểm GVCN nhận tín hiệu Speaking tạo Case thành công"`

---

### Task 9: Web — `<SoLieu>` tách phần mở danh sách; `<SoLieuO>` số nhỏ bấm được

**Files:**
- Modify: `web/src/ui/SoLieu.tsx` (toàn file, 126 dòng)
- Create: `web/src/ui/SoLieuO.tsx`

**Interfaces:**
- Produces:
  - `SoLieu({ id, giaTri, phamVi?: { branchId?: number | null; chuongTrinh?: ChuongTrinh }, rong?, className?, extra?, nhan?: string, phu?: ReactNode, tone?: 'danger' | 'warn' })`
  - `DanhSachSoLieu({ id, giaTri, phamVi?, extra?, open, onClose })` — Drawer "{n} {đơn vị} — {tên}" + Cách tính + danh sách.
  - `DongDanhSach({ rows, onPick })` — danh sách dòng `{id, title, sub, href}`.
  - `qsSoLieu(phamVi?, extra?): string` — `rows=1&branchId=…&ct=…&skill=…`.
  - `SoLieuO(props: { giaTri: number; className?: string } & ({ id: string; phamVi?; extra? } | { nguon: string; tieuDe: string }))`.

- [x] **Step 1: Sửa `SoLieu.tsx`.** Giữ nguyên chú thích đầu file. Cấu trúc mới:

```tsx
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { METRIC_UNIT_LABEL, metricById, thamSoCt, type ChiSo, type ChuongTrinh } from '@shared/domain/index.ts';
import { useApi } from '../lib/useApi.ts';
import { Drawer } from './Drawer.tsx';
import { Empty, ErrorState, Skeleton } from './ui.tsx';
import { useNgayNghiepVu } from './ngayNghiepVu.ts';

const THOI_GIAN_NHAN: Record<ChiSo['thoiGian'], string> = { /* giữ nguyên 3 dòng */ };
type Drill = { /* giữ nguyên */ };
export type PhamViSoLieu = { branchId?: number | null; chuongTrinh?: ChuongTrinh };
export type DongSoLieu = { id: number; title: string; sub: string; href: string };

/** Tham số truy vấn của một lần mở danh sách — Y HỆT tham số đã dùng để tính con số. */
export function qsSoLieu(phamVi?: PhamViSoLieu, extra?: Record<string, string>): string {
  const b = phamVi?.branchId ?? null;
  const ex = extra ? Object.entries(extra).map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('') : '';
  return `rows=1${b ? `&branchId=${b}` : ''}${thamSoCt(phamVi?.chuongTrinh ?? 'ca-hai')}${ex}`;
}

/** Hộp "Cách tính" — chữ đọc thẳng từ sổ; nhãn theo THUAT_NGU g12-021/022. */
function CachTinh({ cs }: { cs: ChiSo }) {
  const { homNay, ngan } = useNgayNghiepVu();
  return (
    <div className="text-[11px] text-slate-400 leading-relaxed space-y-1">
      <div><strong className="text-slate-300">Chỉ số:</strong> {cs.cauHoi}</div>
      <div><strong className="text-slate-300">Đối tượng tính:</strong> {cs.tapDuDieuKien}</div>
      <div><strong className="text-slate-300">Không đếm trùng:</strong> {cs.khuTrung}</div>
      <div><strong className="text-slate-300">Thời gian:</strong> {THOI_GIAN_NHAN[cs.thoiGian]}</div>
      <div><strong className="text-slate-300">Dữ liệu đến:</strong> {ngan(homNay)}</div>
    </div>
  );
}

export function DongDanhSach({ rows, onPick }: { rows: DongSoLieu[]; onPick?: () => void }) {
  return (
    <ul className="list-none p-0 m-0 space-y-1.5">
      {rows.map((r) => (
        <li key={r.id}>
          <Link to={r.href} onClick={onPick} className="block rounded-lg border px-3 py-2 no-underline hover:brightness-125"
            style={{ borderColor: 'var(--line)' }}>
            <span className="block text-sm text-slate-100">{r.title}</span>
            {r.sub && <span className="block text-[11px] text-slate-500 mt-0.5">{r.sub}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Panel "{n} {đơn vị} — {tên}": đúng tập ID sinh ra con số (cùng hàm, cùng quyền, cùng bộ lọc). */
export function DanhSachSoLieu({ id, giaTri, phamVi, extra, open, onClose }: {
  id: string; giaTri: number; phamVi?: PhamViSoLieu; extra?: Record<string, string>; open: boolean; onClose: () => void;
}) {
  const cs = metricById(id);
  const qs = qsSoLieu(phamVi, extra);
  const { data, loading, error, reload } = useApi<Drill>(open && cs ? `/metrics/${id}?${qs}` : null, [id, open, qs]);
  if (!cs) return null;
  const dv = METRIC_UNIT_LABEL[cs.donVi];
  return (
    <Drawer open={open} onClose={onClose} title={`${data ? data.n : giaTri} ${dv} — ${cs.ten}`}
      subtitle="Đúng những mục tạo nên con số vừa bấm">
      <div className="mb-3"><CachTinh cs={cs} /></div>
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <Skeleton rows={5} />
        : data.empty ? <Empty title="Không có dữ liệu trong phạm vi" />
        : !data.rows?.length ? <Empty title={`Không có ${dv} nào trong tập này`} />
        : <DongDanhSach rows={data.rows} onPick={onClose} />}
    </Drawer>
  );
}

export function SoLieu({ id, giaTri, phamVi, rong, className = '', extra, nhan, phu, tone }: {
  id: string; giaTri: number; phamVi?: PhamViSoLieu; rong?: boolean; className?: string; extra?: Record<string, string>;
  /** Nhãn hiện ở ô khi khác tên trong sổ (plan PR-Pa Q20). "Cách tính" vẫn ghi tên trong sổ. */
  nhan?: string;
  /** Một dòng phụ dưới số (G-3). */
  phu?: ReactNode;
  tone?: 'danger' | 'warn';
}) {
  const cs = metricById(id);
  const [open, setOpen] = useState(false);
  const [howTo, setHowTo] = useState(false);
  if (!cs) return <span className="text-xs text-rose-300">Chỉ số không có trong sổ: {id}</span>;
  const dv = METRIC_UNIT_LABEL[cs.donVi];
  const clickable = giaTri > 0;
  const mau = tone === 'danger' ? 'text-rose-200' : tone === 'warn' ? 'text-amber-200' : 'text-slate-100';
  return (
    <div className={`card p-4 h-full ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{nhan ?? cs.ten}</div>
        <button type="button" onClick={() => setHowTo(!howTo)} aria-expanded={howTo}
          className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-[11px] text-slate-500 hover:text-slate-300 whitespace-nowrap"
          title={`${cs.cauHoi} — ${cs.tapDuDieuKien}`}>Cách tính</button>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
        {clickable ? (
          <button type="button" onClick={() => setOpen(true)}
            className={`appearance-none bg-transparent border-0 p-0 cursor-pointer text-2xl font-semibold tabular-nums underline decoration-dotted underline-offset-4 hover:text-white ${mau}`}
            aria-label={`${giaTri} ${dv} — ${nhan ?? cs.ten}. Bấm để xem danh sách`}>{giaTri}</button>
        ) : (
          <span className="text-2xl font-semibold tabular-nums text-slate-500">{giaTri}</span>
        )}
        <span className="text-xs text-slate-400">{dv}</span>
      </div>
      {phu ? <div className="text-[11px] text-slate-500 mt-1">{phu}</div>
        : (rong || giaTri === 0) && <div className="text-[11px] text-slate-500 mt-1">{rong ? 'Không có dữ liệu trong phạm vi' : 'Không có mục nào'}</div>}
      {howTo && <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--line)' }}><CachTinh cs={cs} /></div>}
      <DanhSachSoLieu id={id} giaTri={giaTri} phamVi={phamVi} extra={extra} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
```
  Kiểm lại mọi nơi đang dùng `SoLieu` (`grep -rn "<SoLieu" web/src`) — prop cũ vẫn hợp lệ (`phamVi={{ branchId }}`).

- [x] **Step 2: Tạo `web/src/ui/SoLieuO.tsx`:**

```tsx
import { useState } from 'react';
import { useApi } from '../lib/useApi.ts';
import { Drawer } from './Drawer.tsx';
import { Empty, ErrorState, Skeleton } from './ui.tsx';
import { DanhSachSoLieu, DongDanhSach, type DongSoLieu, type PhamViSoLieu } from './SoLieu.tsx';

/**
 * SỐ NHỎ BẤM ĐƯỢC (G-10) — dùng trong bảng, dòng phụ, dòng Cần xử lý. Hai nguồn, cùng một luật "số = số dòng khi bấm":
 *   · `id`    — một chỉ số trong sổ: mở `DanhSachSoLieu` (cùng `/metrics/:id` với ô số).
 *   · `nguon` — một đường máy chủ trả `{ n, tieuDe, rows }` tính bằng CHÍNH hàm sinh ra số (ví dụ ô bảng chi nhánh).
 * Số 0 không bấm được, chữ mờ.
 */
type Props = { giaTri: number; className?: string } & (
  | { id: string; phamVi?: PhamViSoLieu; extra?: Record<string, string>; nguon?: undefined; tieuDe?: undefined }
  | { nguon: string; tieuDe: string; id?: undefined; phamVi?: undefined; extra?: undefined }
);

export function SoLieuO(props: Props) {
  const [open, setOpen] = useState(false);
  const { giaTri, className = '' } = props;
  if (giaTri <= 0) return <span className={`tabular-nums text-slate-600 ${className}`}>{giaTri}</span>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`appearance-none bg-transparent border-0 p-0 cursor-pointer tabular-nums underline decoration-dotted underline-offset-4 hover:text-white ${className}`}
        aria-label={`${giaTri} — bấm để xem danh sách`}>{giaTri}</button>
      {props.id
        ? <DanhSachSoLieu id={props.id} giaTri={giaTri} phamVi={props.phamVi} extra={props.extra} open={open} onClose={() => setOpen(false)} />
        : <DanhSachNguon nguon={props.nguon!} tieuDe={props.tieuDe!} open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

function DanhSachNguon({ nguon, tieuDe, open, onClose }: { nguon: string; tieuDe: string; open: boolean; onClose: () => void }) {
  const { data, loading, error, reload } = useApi<{ n: number; tieuDe: string; rows: DongSoLieu[] }>(open ? nguon : null, [nguon, open]);
  return (
    <Drawer open={open} onClose={onClose} title={data?.tieuDe ?? tieuDe} subtitle="Đúng những mục tạo nên con số vừa bấm">
      {error ? <ErrorState message={error.message} hint={error.hint} onRetry={reload} />
        : loading || !data ? <Skeleton rows={5} />
        : !data.rows.length ? <Empty title="Không có mục nào" />
        : <DongDanhSach rows={data.rows} onPick={onClose} />}
    </Drawer>
  );
}
```

- [x] **Step 3:** `npm run typecheck` xanh; `npm run check` xanh.
- [x] **Step 4: Commit.** `"PR-Pa (9): SoLieu tách panel danh sách; SoLieuO số nhỏ bấm được; chữ Cách tính theo THUAT_NGU"`

---

### Task 10: Web — Tổng quan Quản lý (thanh ngữ cảnh, 4 ô, Cần xử lý + Điểm đáng chú ý, Lịch sắp tới, bảng chi nhánh)

**Files:**
- Create: `web/src/modules/worklist/ChonChuongTrinh.tsx`, `web/src/modules/worklist/KhoiCanXuLy.tsx`
- Modify: `web/src/modules/worklist/OverviewPage.tsx` (viết lại thân, giữ chú thích tab/cn đang có), `MetricTiles.tsx`,
  `Highlights.tsx`, `BranchPulse.tsx`

**Interfaces:**
- Consumes: `/tong-quan/quan-ly`, `/tong-quan/chi-nhanh[/o]`, `/metrics/:id?ct=`, `/highlights?ct=`, `/branch-pulse` (chỉ phần `people`);
  `SoLieu`, `SoLieuO`, `DanhSachSoLieu` (Task 9); `chuongTrinhTuThamSo`, `thamSoCt`, `CHUONG_TRINH_LABEL`, `COT_BANG` (Task 1);
  `ngay`, `tuanLich`.
- Produces: `ChonChuongTrinh({ value, onChange })`, `MetricTiles({ branchId, ct })`, `KhoiCanXuLy({ branchId, ct })`,
  `LichSapToi({ branchId, ct })` (export từ `Highlights.tsx`), `BranchPulse({ branchId, ct })`.

- [ ] **Step 1: `ChonChuongTrinh.tsx`:**

```tsx
import { CHUONG_TRINH, CHUONG_TRINH_LABEL, type ChuongTrinh } from '@shared/domain/index.ts';

/** Thanh ngữ cảnh (§3.2, P6b): Lớp thường · Fast Track · Cả hai. Một nhóm nút liền, nút đang chọn tô màu nhấn. */
export function ChonChuongTrinh({ value, onChange }: { value: ChuongTrinh; onChange: (v: ChuongTrinh) => void }) {
  return (
    <div role="radiogroup" aria-label="Chương trình" className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--line)' }}>
      {CHUONG_TRINH.map((k) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)}
          className={`px-3 py-1 text-xs border-0 cursor-pointer ${value === k ? 'bg-sky-500/20 text-sky-200 font-semibold' : 'bg-transparent text-slate-400 hover:text-slate-200'}`}>
          {CHUONG_TRINH_LABEL[k]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `MetricTiles.tsx`** (viết lại, giữ chú thích đầu cập nhật đúng bốn ô):

```tsx
import { useApi } from '../../lib/useApi.ts';
import { Skeleton } from '../../ui/ui.tsx';
import { SoLieu } from '../../ui/SoLieu.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { thamSoCt, type ChuongTrinh } from '@shared/domain/index.ts';

/**
 * BỐN Ô SỐ Ở ĐẦU TỔNG QUAN (§3.2, 4.1 đã chốt) — mỗi ô đi qua `<SoLieu>`: con số và danh sách mở ra là CÙNG một tập ID.
 *   Học viên dưới kỳ vọng (lớp thường: chưa đạt) · Học viên có Case đang mở · Chờ xác minh quá hạn · PA học thuật cần cập nhật.
 */
type Lean = { n: number; denominator: number | null; empty: boolean };
const qs = (branchId: number | null, ct: ChuongTrinh) => `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');
function useSo(id: string, branchId: number | null, ct: ChuongTrinh) {
  return useApi<Lean>(`/metrics/${id}?${qs(branchId, ct)}`, [id, branchId, ct]);
}
function O({ id, branchId, ct, nhan, phu, tone }: {
  id: string; branchId: number | null; ct: ChuongTrinh; nhan: string; tone?: 'danger' | 'warn';
  phu?: (d: Lean) => React.ReactNode;
}) {
  const { data, loading, error } = useSo(id, branchId, ct);
  if (error) return <div className="card p-4 text-xs text-rose-300">Không tải được số liệu này.</div>;
  if (loading || !data) return <div className="card p-4"><Skeleton rows={2} /></div>;
  return <SoLieu id={id} giaTri={data.n} rong={data.empty} phamVi={{ branchId, chuongTrinh: ct }} nhan={nhan} tone={data.n ? tone : undefined} phu={phu?.(data)} />;
}
function CaseMo({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const { data } = useSo('case-mo', branchId, ct);
  if (!data) return null;
  return <><SoLieuO id="case-mo" giaTri={data.n} phamVi={{ branchId, chuongTrinh: ct }} /> Case</>;
}

export function MetricTiles({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4" aria-label="Số liệu chính">
      <O id="hv-duoi-ky-vong-mon" branchId={branchId} ct={ct} nhan={ct === 'thuong' ? 'Học viên chưa đạt' : 'Học viên dưới kỳ vọng'}
        phu={(d) => (d.denominator !== null ? `/ ${d.denominator} đánh giá được` : null)} />
      <O id="hv-co-case-mo" branchId={branchId} ct={ct} nhan="Học viên có Case đang mở" phu={() => <CaseMo branchId={branchId} ct={ct} />} />
      <O id="tin-hieu-qua-han" branchId={branchId} ct={ct} nhan="Chờ xác minh quá hạn" tone="danger" phu={() => 'tín hiệu SOS lớp thường'} />
      <O id="pa-can-cap-nhat" branchId={branchId} ct={ct} nhan="PA học thuật cần cập nhật" tone="warn" />
    </div>
  );
}
```
  (Import `type ReactNode` thay cho `React.ReactNode` nếu tsconfig không có namespace `React` toàn cục.)

- [ ] **Step 3: `KhoiCanXuLy.tsx`:**

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Skeleton, ErrorState } from '../../ui/ui.tsx';
import { SoLieuO } from '../../ui/SoLieuO.tsx';
import { DanhSachSoLieu } from '../../ui/SoLieu.tsx';
import { thamSoCt, type ChuongTrinh, type DiemChuY, type DongCanXuLyGoc } from '@shared/domain/index.ts';

/**
 * CẦN XỬ LÝ cạnh ĐIỂM ĐÁNG CHÚ Ý (§3.2, mockup 02 phương án A). Một lần gọi `/tong-quan/quan-ly`. Mỗi dòng Cần xử lý là
 * MỘT chỉ số của sổ: bấm số hay bấm nút đều mở đúng tập đó. Điểm đáng chú ý: tối đa ba nhận định có số, link mở đúng tập.
 */
type Data = { canXuLy: (DongCanXuLyGoc & { phu: string })[]; diemDangChuY: DiemChuY[] };
const CHAM: Record<'do' | 'vang' | 'xanh', string> = { do: 'bg-rose-300', vang: 'bg-amber-300', xanh: 'bg-sky-300' };

export function KhoiCanXuLy({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const url = `/tong-quan/quan-ly?${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`;
  const { data, loading, error, reload } = useApi<Data>(url, [branchId, ct]);
  const [mo, setMo] = useState<{ id: string; n: number; extra?: Record<string, string> } | null>(null);
  const phamVi = { branchId, chuongTrinh: ct };
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr] items-start">
      <Card title={<span>Cần xử lý {data && <span className="text-slate-500 font-normal">· {data.canXuLy.length} việc, việc gấp nhất lên đầu</span>}</span>} bodyClass="p-0">
        {loading || !data ? <div className="p-4"><Skeleton rows={4} /></div> : !data.canXuLy.length ? (
          <p className="m-0 px-4 py-3 text-sm text-slate-400">Không có việc nào đang tồn trong phạm vi.</p>
        ) : (
          <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
            {data.canXuLy.map((x) => (
              <li key={x.metricId} className="grid grid-cols-[10px_minmax(0,1fr)_auto] gap-3 items-center px-4 py-2.5">
                <span className={`w-2 h-2 rounded-full ${CHAM[x.mau]}`} aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm text-slate-100">
                    <SoLieuO id={x.metricId} giaTri={x.n} phamVi={phamVi} className="font-semibold" /> {x.nhan}
                  </span>
                  {x.phu && <span className="block text-[11px] text-slate-500 truncate">{x.phu}</span>}
                </span>
                <button type="button" className={`btn btn-sm ${x.nut === 'Xem' ? '' : 'btn-primary'}`}
                  onClick={() => setMo({ id: x.metricId, n: x.n })}>{x.nut}</button>
              </li>
            ))}
          </ul>
        )}
        <div className="px-4 py-2.5 border-t text-xs" style={{ borderColor: 'var(--line)' }}>
          <Link to="/cong-viec" className="link">Tất cả việc →</Link>
        </div>
      </Card>

      <Card title={<span>Điểm đáng chú ý <span className="text-slate-500 font-normal">· tối đa 3</span></span>} bodyClass="p-0">
        {loading || !data ? <div className="p-4"><Skeleton rows={3} /></div> : !data.diemDangChuY.length ? (
          <p className="m-0 px-4 py-3 text-sm text-slate-400">Chưa có điểm nào đủ dữ liệu để nêu.</p>
        ) : (
          <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
            {data.diemDangChuY.map((x) => (
              <li key={x.loai} className="px-4 py-2.5">
                <span className="block text-sm text-slate-100">{x.cau}</span>
                <button type="button" className="link text-[11px] appearance-none bg-transparent border-0 p-0 cursor-pointer"
                  onClick={() => setMo({ id: x.metricId, n: x.soDanhSach, extra: x.extra })}>{x.lienKet}</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {mo && <DanhSachSoLieu id={mo.id} giaTri={mo.n} phamVi={phamVi} extra={mo.extra} open onClose={() => setMo(null)} />}
    </div>
  );
}
```

- [ ] **Step 4: `Highlights.tsx` → `LichSapToi`.** Giữ cấu trúc; sửa:
  - `export function Highlights({ branchId })` → `export function LichSapToi({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh })`;
    URL `/highlights?${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}` (bỏ `&` đầu nếu không có chi nhánh).
  - Tiêu đề `Sự kiện nổi bật` → `Lịch sắp tới` (cả chỗ Skeleton). Dòng thu gọn: thay `tuần này: ${summaryLine(thisWeek)}` bằng
    `· ${soDot(data.weeks[0])} đợt Test tuần này · ${soDot(data.weeks[1])} đợt tuần sau`, với
    `const soDot = (w?: Week) => w ? w.normal.progressClasses.length + w.normal.finalClasses.length + w.ft.mockClasses.length : 0;`.
    Hai tuần đều 0 → `· không có đợt Test nào trong hai tuần tới`. Xoá `summaryLine` nếu hết dùng.
  - Nút tuần: `<span …>{w.code}</span>` → `{tuanLich(w.weekStart, homNay)}` (`const { homNay } = useNgayNghiepVu();`).
    Dòng `week.range` giữ (đã `dd/mm – dd/mm`).
  - Cột: `Lớp Normal` → `Lớp thường`; `Bài kiểm tra giữa khoá` → `Giữa khoá`; `Bài kiểm tra cuối khoá` → `Cuối khoá`.
    Ẩn cột Lớp thường khi `ct === 'ft'`, ẩn cột Fast Track khi `ct === 'thuong'` (grid còn một cột).
  - Chú thích đầu file: "LỊCH SẮP TỚI (PR-Pa, §3.2; trước đây 'Sự kiện nổi bật')".
- [ ] **Step 5: `BranchPulse.tsx`.** Giữ nguyên phần **Theo giáo viên** (`PersonRow`, `PEOPLE_COLS`, bảng người, đoạn
  chú thích không xếp hạng) — chuyển nó vào function `BangTheoGiaoVien({ branchId })` trong cùng file, tự gọi
  `useApi<Pulse | null>('/branch-pulse?branchId=…')` và chỉ dùng `data.people`. Thay phần bảng lớp/chi nhánh bằng:

```tsx
type OBang = { n: number; mau?: number };
type Hang = { khoa: string; id: number; loai: 'chi-nhanh' | 'lop'; nhan: string; laFt: boolean | null; o: Record<CotBang, OBang>; lop?: Hang[] };
type Bang = { cheDo: 'chi-nhanh' | 'lop'; hang: Hang[]; tong: Record<CotBang, OBang>; tenChiNhanh: string | null };

const COT: { key: CotBang; nhan: (ct: ChuongTrinh) => string; goiY: string }[] = [
  { key: 'hocVien', nhan: () => 'Học viên', goiY: 'Học viên đang học, không tính em đã kết thúc.' },
  { key: 'duoiKyVong', nhan: (ct) => (ct === 'thuong' ? 'Chưa đạt' : 'Dưới kỳ vọng'),
    goiY: 'Học viên dưới kỳ vọng ít nhất một kỹ năng ở đợt Test mới nhất hợp lệ (lớp thường: chưa đạt ít nhất một môn).' },
  { key: 'sos', nhan: () => 'SOS', goiY: 'Học viên có SOS ở đợt Test mới nhất hợp lệ, kể cả SOS tạm thời.' },
  { key: 'caseMo', nhan: () => 'Case mở', goiY: 'Case học thuật chưa kết luận — đếm Case, không đếm học viên.' },
  { key: 'thieuPa', nhan: () => 'Thiếu PA học thuật', goiY: 'Case đã mở nhưng chưa ai ghi sẽ làm gì cho em.' },
  { key: 'duDuLieu', nhan: () => 'Đủ dữ liệu đánh giá', goiY: 'Em đã chấm đủ mọi kỹ năng ở đợt đã đến lịch mới nhất / em cần được đánh giá.' },
];

export function BranchPulse({ branchId, ct }: { branchId: number | null; ct: ChuongTrinh }) {
  const navigate = useNavigate();
  const q = `${branchId ? `branchId=${branchId}` : ''}${thamSoCt(ct)}`.replace(/^&/, '');
  const { data, loading } = useApi<Bang>(`/tong-quan/chi-nhanh?${q}`, [branchId, ct]);
  const [mo, setMo] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'lop' | 'gv'>('lop');
  if (loading) return <Card title="Theo chi nhánh"><Skeleton rows={3} /></Card>;
  if (!data) return null;
  const coGv = data.cheDo === 'lop' && branchId !== null;       // Q10 — giữ tạm tới PR-GV
  const o = (h: { khoa: string; nhan: string }, c: CotBang, x: OBang) => (
    <td key={c} className="td text-right tabular-nums">
      <SoLieuO giaTri={x.n} tieuDe={`${COT.find((k) => k.key === c)!.nhan(ct)} · ${h.nhan}`}
        nguon={`/tong-quan/chi-nhanh/o?cot=${c}&khoa=${h.khoa}${q ? `&${q}` : ''}`} />
      {c === 'duDuLieu' && <span className="text-slate-500">/{x.mau ?? 0}</span>}
    </td>
  );
  const hangTong = (nhan: string) => (
    <tr className="bg-white/5">
      <td className="td sticky-col whitespace-nowrap font-medium text-slate-100">{nhan}</td>
      {COT.map((c) => o({ khoa: 'tong', nhan }, c.key, data.tong[c.key]))}
    </tr>
  );
  const tenLop = (h: Hang) => (
    <span className="whitespace-nowrap">
      <Link to={`/hoc-vien/lop/${h.id}`} className="link">{h.nhan}</Link>
      {ct === 'ca-hai' && h.laFt !== null && <span className="text-[11px] text-slate-500 ml-1.5">{h.laFt ? 'FT' : 'Lớp thường'}</span>}
    </span>
  );
  return (
    <Card title={data.cheDo === 'lop' ? `Theo lớp${data.tenChiNhanh ? ` · ${data.tenChiNhanh}` : ''}` : 'Theo chi nhánh'}
      action={coGv ? (
        <div className="flex gap-1">
          <button className={`btn btn-sm ${view === 'lop' ? 'btn-primary' : ''}`} onClick={() => setView('lop')}>Theo lớp</button>
          <button className={`btn btn-sm ${view === 'gv' ? 'btn-primary' : ''}`} onClick={() => setView('gv')}>Theo giáo viên</button>
        </div>
      ) : undefined}
      bodyClass="p-0">
      {coGv && view === 'gv' ? <BangTheoGiaoVien branchId={branchId} /> : (
        <div className="table-scroll">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '44rem' }}>
            <colgroup><col style={{ width: '26%' }} />{COT.map((c) => <col key={c.key} style={{ width: `${74 / COT.length}%` }} />)}</colgroup>
            <thead><tr>
              <Th className="sticky-col">{data.cheDo === 'lop' ? 'Lớp' : 'Chi nhánh'}</Th>
              {COT.map((c) => <Th key={c.key} align="right" hint={c.goiY}>{c.nhan(ct)}</Th>)}
            </tr></thead>
            <tbody>
              {data.cheDo === 'lop' && hangTong(data.tenChiNhanh ? `Cả ${data.tenChiNhanh}` : 'Cả chi nhánh')}
              {data.hang.map((h) => (
                <Fragment key={h.khoa}>
                  <tr className="row-hover">
                    <td className="td sticky-col">
                      {h.loai === 'chi-nhanh' ? (
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <button type="button" aria-expanded={mo.has(h.khoa)} title="Mở xuống từng lớp"
                            className="appearance-none bg-transparent border-0 p-0 cursor-pointer text-slate-500"
                            onClick={() => setMo((s) => { const n = new Set(s); n.has(h.khoa) ? n.delete(h.khoa) : n.add(h.khoa); return n; })}>
                            {mo.has(h.khoa) ? '▾' : '▸'}
                          </button>
                          <button type="button" className="link appearance-none bg-transparent border-0 p-0 cursor-pointer"
                            onClick={() => navigate(`/?cn=${h.id}${thamSoCt(ct)}`)}>{h.nhan}</button>
                        </span>
                      ) : tenLop(h)}
                    </td>
                    {COT.map((c) => o(h, c.key, h.o[c.key]))}
                  </tr>
                  {h.loai === 'chi-nhanh' && mo.has(h.khoa) && (h.lop ?? []).map((l) => (
                    <tr key={l.khoa} className="row-hover">
                      <td className="td sticky-col pl-8">{tenLop(l)}</td>
                      {COT.map((c) => o(l, c.key, l.o[c.key]))}
                    </tr>
                  ))}
                </Fragment>
              ))}
              {data.cheDo === 'chi-nhanh' && hangTong('Tất cả chi nhánh')}
            </tbody>
          </table>
        </div>
      )}
      <p className="m-0 px-4 py-2 text-[11px] text-slate-500 border-t" style={{ borderColor: 'var(--line)' }}>
        {data.cheDo === 'chi-nhanh' ? 'Bấm ▸ để mở ra từng lớp · bấm số để xem danh sách' : 'Bấm số để xem danh sách'}
      </p>
    </Card>
  );
}
```
  Import: `Fragment, useState` · `Link, useNavigate` · `Card, Skeleton, Th` · `SoLieuO` · `thamSoCt, type ChuongTrinh, type CotBang`.
  Xoá `CLASS_COLS`, `COL_STUDENTS`, `COL_WORK`, `FragmentRows`, prop `activeGroup/onGroup` (hết người dùng). Cập nhật chú
  thích đầu file: bảng "Theo chi nhánh" (mockup 02 A); cột cũ "PA học thuật cần cập nhật / Đề xuất chờ duyệt" nay ở ô số
  và Cần xử lý.
- [ ] **Step 6: `OverviewPage.tsx`.** Giữ: import, `canSeeBoard`, `goTab`, chú thích tab/`cn`. Bỏ: `useApi('/my-work')`,
  `workGroup`/`setWorkGroup`, `WorkList`, `YThucReminders`, khối Empty. Thân mới:

```tsx
  const ct = chuongTrinhTuThamSo(params.get('ct'));
  const setCt = (v: ChuongTrinh) => {
    const next = new URLSearchParams(params);
    if (v === 'ca-hai') next.delete('ct'); else next.set('ct', v);
    setParams(next, { replace: true });
  };
  const duLieuDen = `Dữ liệu đến ${ngay(session?.demoDate)}`;   // không truyền "hôm nay" → dd/mm/yyyy (mockup)

  if (!canSeeBoard) {
    /* GIÁO VIÊN (§3.2): Việc cần làm của tôi + Học viên cần hỗ trợ; lịch thu gọn ở cuối. */
    const ten = (session?.user?.fullName ?? '').trim().split(/\s+/).pop() ?? '';
    return (
      <div className="page space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold text-slate-100 m-0">{ten ? `Chào ${ten}` : 'Tổng quan'}</h1>
          <span className="text-xs text-slate-500">{duLieuDen}</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr] items-start">
          <ViecCuaToi />
          <HocVienCanHoTro />
        </div>
        <LichSapToi branchId={null} ct="ca-hai" />
      </div>
    );
  }

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-100 m-0">Tổng quan</h1>
        <div className="flex flex-wrap items-center gap-2">
          {tab === 'work' && <ChonChuongTrinh value={ct} onChange={setCt} />}
          <BranchFilter branchId={branchId} onBranch={setBranchId} />
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <HangTab ariaLabel="Tổng quan" value={tabProp} onChange={goTab}
          tabs={(['tong-quan', 'phan-tich'] as const).map((k) => ({ key: k, label: TAB_TONG_QUAN_LABEL[k] }))} />
        <span className="text-xs text-slate-500 pb-1">{duLieuDen}</span>
      </div>
      {tab === 'board' && <CaseBoard embedded />}
      {tab === 'work' && (
        <>
          <MetricTiles branchId={branchId} ct={ct} />
          <KhoiCanXuLy branchId={branchId} ct={ct} />
          <LichSapToi branchId={branchId} ct={ct} />
          <BranchPulse branchId={branchId} ct={ct} />
        </>
      )}
    </div>
  );
```
  `goTab` chỉ giữ `cn` (Phân tích không đọc `ct`) — như hiện có. Nếu `HangTab` không nằm vừa trên một hàng với chữ ngày ở
  375px thì để chữ ngày xuống dòng (flex-wrap đã lo). Import mới: `ChonChuongTrinh`, `KhoiCanXuLy`, `LichSapToi`,
  `ViecCuaToi`, `HocVienCanHoTro` (hai cái sau tạo ở Task 12 — tạm để Task 12 thêm import GV, hoặc tạo file rỗng export
  component trả `null` ở task này rồi viết thật ở Task 12; chọn cách nào ghi Nhật ký), `chuongTrinhTuThamSo`,
  `type ChuongTrinh`. Chú thích đầu component cập nhật: "TỔNG QUAN (§3.2): Quản lý — thanh ngữ cảnh, 4 ô, Cần xử lý cạnh
  Điểm đáng chú ý, Lịch sắp tới, bảng chi nhánh. Giáo viên — Việc cần làm của tôi, Học viên cần hỗ trợ."
- [ ] **Step 7:** `npm run check` xanh. `grep -rn "Normal\b" web/src/modules/worklist/*.tsx | grep -v "^\s*//\|\*"` — không
  còn chữ "Normal" trên màn trong các file PR này chạm.
- [ ] **Step 8: Commit.** `"PR-Pa (10): Tổng quan Quản lý — thanh ngữ cảnh, 4 ô, Cần xử lý + Điểm đáng chú ý, Lịch sắp tới, bảng chi nhánh mở xuống lớp"`

---

### Task 11: Web — dòng tín hiệu SOS lớp thường: Tạo Case (điền sẵn điểm) / Bỏ qua

**Files:**
- Create: `web/src/modules/worklist/DongTinHieu.tsx`
- Modify: `web/src/modules/worklist/WorkList.tsx` (kiểu `WorkItem`, tách `DongViec`, hạn qua `<Han>`)
- Modify: `web/src/modules/cases/QuickReport.tsx:28-49, 85-93, 209-213, 301-311, 355-360`

**Interfaces:**
- Consumes: `POST /signals/pending/:id/dismiss { reason }` (S1), `POST /cases/report` (qua `QuickReport`),
  `WorkItem.signal` (S1), `LOAI_HAN_CUA_VIEC` (Task 1), `<Han>`.
- Produces: `WorkItem.signal` ở kiểu web; `export function DongViec({ it, onOpen })`; `DongTinHieu({ it })`;
  `QuickReport` prop `signal` mở rộng `{ id; skill; label; kind?: 'normal' | 'ft'; scoreText?: string | null; contextLabel?: string | null }`.

- [ ] **Step 1: `WorkList.tsx`.**
  - Kiểu `WorkItem` (dòng 7-20) thêm:
    `signal?: { id: number; kind: 'normal' | 'ft'; skill: string | null; skillLabel: string; score: number | null; total: number | null; deadline: string; actions: ('create_case' | 'dismiss')[] } | null;`
  - Tách thân `<li>` (dòng 169-214) thành component export (thẻ ngoài là `div`, không lồng `button` trong `button`):

```tsx
export function DongViec({ it, onOpen }: { it: WorkItem; onOpen: (href: string) => void }) {
  const { homNay } = useNgayNghiepVu();
  const loaiHan = LOAI_HAN_CUA_VIEC[it.group];
  const coNut = !!it.signal && it.signal.actions.length > 0;
  return (
    <div className="px-4 py-3 hover:bg-white/5 grid gap-x-3 gap-y-1.5 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
      <button type="button" className="appearance-none bg-transparent border-0 p-0 text-left min-w-0 cursor-pointer" onClick={() => onOpen(it.href)}>
        {/* Ô 1–2 giữ nguyên nội dung cũ (tên, lớp, contextLabel, số HV, Level, Alert quá hạn, reason) */}
        {/* Ô 3–5: người phụ trách · hạn · trạng thái */}
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500">
          <span>{it.owner ?? 'Chưa có người phụ trách'}</span>
          {loaiHan && it.due ? <Han loai={loaiHan} han={it.due} /> : <span>{it.due ? `Hạn ${ngay(it.due, homNay)}` : 'Chưa có hạn'}</span>}
          <Status kind={it.group === 'decide' ? 'waiting' : it.group === 'no_plan' || it.group === 'no_owner' ? 'idle' : 'doing'}>{it.statusLabel}</Status>
        </span>
      </button>
      {coNut ? <DongTinHieu it={it} /> : <Task>{it.actionLabel}</Task>}
    </div>
  );
}
```
  (chép nguyên khối "Ô 1–2" từ dòng 176-194 cũ vào vị trí chú thích; giữ chú thích cũ về LỚP/BÀI.) Trong `WorkList`,
  `visible.map` thành `<li key={it.key}><DongViec it={it} onOpen={navigate} /></li>`. Bỏ import `fmtDate` nếu hết dùng;
  thêm `Han`, `useNgayNghiepVu`, `ngay`, `LOAI_HAN_CUA_VIEC`, `DongTinHieu`.
- [ ] **Step 2: `DongTinHieu.tsx`:**

```tsx
import { useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useToast } from '../../ui/Toast.tsx';
import { QuickReport } from '../cases/QuickReport.tsx';
import type { WorkItem } from './WorkList.tsx';

/**
 * DÒNG TÍN HIỆU SOS LỚP THƯỜNG (§3.10, mockup 10b §5). Mỗi môn chưa đạt là một dòng riêng, hai nút:
 *   Tạo Case — mở form Case ĐÚNG MÔN, điền sẵn điểm (QuickReport, có idempotencyKey, gửi fromSignalId).
 *   Bỏ qua   — một bấm là xong; ô lý do nhỏ bên cạnh, không bắt buộc (quyết định S1 của chủ sản phẩm).
 * Nút nào hiện do máy chủ quyết (`signal.actions`) — người xem không xử lý được thì không có nút.
 */
const lamMoi = () => { invalidate('/my-work'); invalidate('/metrics'); invalidate('/tong-quan'); invalidate('/signals'); };

export function DongTinHieu({ it }: { it: WorkItem }) {
  const s = it.signal!;
  const toast = useToast();
  const [moForm, setMoForm] = useState(false);
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const boQua = async () => {
    setBusy(true);
    try {
      await api.post(`/signals/pending/${s.id}/dismiss`, { reason: lyDo.trim() || null });
      toast.push('ok', 'Đã bỏ qua');
      lamMoi();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
      {s.actions.includes('create_case') && (
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setMoForm(true)}>Tạo Case</button>
      )}
      {s.actions.includes('dismiss') && (
        <>
          <input className="field h-7 text-xs w-36" value={lyDo} maxLength={200} onChange={(e) => setLyDo(e.target.value)}
            placeholder="Lý do (không bắt buộc)" aria-label="Lý do bỏ qua (không bắt buộc)" />
          <button type="button" className="btn btn-sm" disabled={busy} onClick={boQua}>Bỏ qua</button>
        </>
      )}
      {it.studentId !== null && (
        <QuickReport open={moForm} onClose={() => setMoForm(false)} studentId={it.studentId} studentName={it.studentName}
          signal={{ id: s.id, skill: s.skill, label: s.skillLabel, kind: s.kind,
            scoreText: s.score !== null && s.total !== null ? `${s.score}/${s.total}` : null, contextLabel: it.contextLabel }}
          onDone={lamMoi} />
      )}
    </div>
  );
}
```
- [ ] **Step 3: `QuickReport.tsx`.**
  - Prop `signal` (dòng 48): `signal?: { id: number; skill: string | null; label: string; kind?: 'normal' | 'ft'; scoreText?: string | null; contextLabel?: string | null } | null;`
  - Dòng 91-92 thay bằng: kỹ năng khi mở từ tín hiệu là **đúng một** kỹ năng của tín hiệu (kể cả `writing` lớp thường):

```ts
  /* MỞ TỪ TÍN HIỆU: chỉ đúng môn của tín hiệu (§3.10 "form Case môn đó") — máy chủ cũng từ chối môn khác. */
  const topics: readonly string[] = signal?.skill ? [signal.skill] : ENTRY_SKILLS;
  const topicLabel = (k: string) => ENTRY_SKILL_LABEL[k as keyof typeof ENTRY_SKILL_LABEL]
    ?? REGULAR_SKILL_LABEL[k as keyof typeof REGULAR_SKILL_LABEL] ?? k;
```
    (thêm `REGULAR_SKILL_LABEL` vào import từ shared.)
  - Tiêu đề Modal (dòng 211-213): khi `signal?.kind === 'normal'` →
    `` `Tạo Case · ${signal.label}${studentName ? ` · ${studentName}` : ''}` ``; FT giữ chữ cũ.
  - Ngay đầu `<div className="space-y-3">` (sau khối hai tab), khi có `signal?.scoreText`:

```tsx
        {signal?.scoreText && (
          <p className="m-0 text-xs text-slate-400">
            Điểm: <span className="text-slate-200">{signal.contextLabel ?? signal.label}</span>{' '}
            <span className="tabular-nums text-rose-200">{signal.scoreText}</span>
          </p>
        )}
```
  - `SectionNote` (dòng 355-360): điều kiện `mode === 'now' && !signal` (G-5; khi mở từ tín hiệu đã có bài và mức SOS).
  - **Không** tự điền tên/mô tả Case (Q16).
- [ ] **Step 4:** `npm run check` xanh.
- [ ] **Step 5: Commit.** `"PR-Pa (11): dòng tín hiệu SOS lớp thường — Tạo Case điền sẵn điểm, Bỏ qua một bấm; hạn qua Han"`

---

### Task 12: Web — Tổng quan Giáo viên (Việc cần làm của tôi 4 nhóm · Học viên cần hỗ trợ)

**Files:**
- Create: `web/src/modules/worklist/ViecCuaToi.tsx`, `web/src/modules/worklist/HocVienCanHoTro.tsx`
- Modify: `web/src/modules/yThuc/YThucReminders.tsx` (export `useNhacYThuc`)

**Interfaces:**
- Consumes: `/my-work`, `/y-thuc/my-warnings`, `/y-thuc/my-coordination`, `/tong-quan/hoc-vien-can-ho-tro`; `gomNhomViec`
  (Task 1); `DongViec` (Task 11).
- Produces: `ViecCuaToi()`, `HocVienCanHoTro()`, `useNhacYThuc(): { classId: number; className: string; text: string }[]`.

- [ ] **Step 1: `YThucReminders.tsx`** — tách hook, component giữ nguyên hành vi:

```tsx
export type NhacYThuc = { classId: number; className: string; text: string };
/** Hai dòng nhắc mềm của GVCN — dùng chung cho khối này và nhóm "Ý thức & Phối hợp" ở Tổng quan GV (PR-Pa). */
export function useNhacYThuc(): NhacYThuc[] {
  const warnings = useApi<{ rows: NhacYThuc[] }>('/y-thuc/my-warnings');
  const coordination = useApi<{ rows: NhacYThuc[] }>('/y-thuc/my-coordination');
  return [...(warnings.data?.rows ?? []), ...(coordination.data?.rows ?? [])];
}
export function YThucReminders() {
  const lines = useNhacYThuc();
  if (!lines.length) return null;
  /* …phần vẽ giữ nguyên… */
}
```
- [ ] **Step 2: `ViecCuaToi.tsx`:**

```tsx
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Empty, ErrorState, Skeleton, Status } from '../../ui/ui.tsx';
import { gomNhomViec } from '@shared/domain/index.ts';
import { DongViec, type WorkGroup, type WorkItem } from './WorkList.tsx';
import { useNhacYThuc } from '../yThuc/YThucReminders.tsx';

/**
 * VIỆC CẦN LÀM CỦA TÔI — Tổng quan giáo viên (§3.2). Bốn nhóm cố định: Chấm điểm · Case học thuật · Ý thức & Phối hợp ·
 * Vận hành; mỗi nhóm có số; nhóm có việc quá hạn tự mở, nhóm khác gập. Mỗi nhóm hiện 5 dòng + "Xem thêm" tại chỗ; đủ danh
 * sách ở Công việc. Tín hiệu SOS lớp thường nằm ở Case học thuật, có hai nút ngay trên dòng (§3.10).
 */
type Work = { summary: { total: number }; items: WorkItem[]; groups: WorkGroup[]; scopeEmpty: boolean };
const HIEN = 5;

export function ViecCuaToi() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi<Work>('/my-work');
  const nhac = useNhacYThuc();
  const nhom = useMemo(() => (data ? gomNhomViec(data.items, nhac.length) : []), [data, nhac.length]);
  const [mo, setMo] = useState<Record<string, boolean>>({});
  const [them, setThem] = useState<Record<string, number>>({});
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  return (
    <Card title="Việc cần làm của tôi" bodyClass="p-0">
      {loading || !data ? <div className="p-4"><Skeleton rows={5} /></div> : !nhom.length ? (
        <div className="p-4"><Empty title={data.scopeEmpty ? 'Bạn chưa được cấp phạm vi nào' : 'Không có việc nào đang chờ bạn'} /></div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {nhom.map((g) => {
            const dangMo = mo[g.key] ?? g.moSan;
            const soHien = HIEN + (them[g.key] ?? 0);
            return (
              <section key={g.key}>
                <button type="button" aria-expanded={dangMo}
                  className="w-full appearance-none bg-transparent border-0 px-4 py-2.5 flex items-center gap-2 text-left cursor-pointer hover:bg-white/5"
                  onClick={() => setMo((s) => ({ ...s, [g.key]: !dangMo }))}>
                  <span className="text-slate-500" aria-hidden>{dangMo ? '▾' : '▸'}</span>
                  <span className="text-sm font-semibold text-slate-100">{g.label}</span>
                  <span className="tabular-nums text-xs text-slate-300 rounded-full px-1.5" style={{ background: 'var(--surface-2)' }}>{g.n}</span>
                  {(g.quaHan > 0 || g.homNay > 0) && (
                    <span className="text-[11px] text-slate-500">
                      {[g.quaHan ? `${g.quaHan} quá hạn` : null, g.homNay ? `${g.homNay} hạn hôm nay` : null].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </button>
                {dangMo && g.key === 'y-thuc' && (
                  <ul className="list-none m-0 p-0 pb-2">
                    {nhac.map((l, i) => (
                      <li key={`${l.classId}-${i}`} className="px-4 py-1.5">
                        <Link to={`/hoc-vien/lop/${l.classId}`} className="no-underline"><Status kind="idle">{l.text}</Status></Link>
                      </li>
                    ))}
                  </ul>
                )}
                {dangMo && g.key !== 'y-thuc' && (
                  <>
                    <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
                      {g.items.slice(0, soHien).map((it) => <li key={it.key}><DongViec it={it} onOpen={navigate} /></li>)}
                    </ul>
                    {g.items.length > soHien && (
                      <div className="px-4 py-2">
                        <button type="button" className="btn btn-sm" onClick={() => setThem((s) => ({ ...s, [g.key]: (s[g.key] ?? 0) + HIEN }))}>
                          Xem thêm {Math.min(HIEN, g.items.length - soHien)} việc
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
      <div className="px-4 py-2.5 border-t text-xs" style={{ borderColor: 'var(--line)' }}>
        <Link to="/cong-viec" className="link">Tất cả việc →</Link>
      </div>
    </Card>
  );
}
```
- [ ] **Step 3: `HocVienCanHoTro.tsx`:**

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/useApi.ts';
import { Card, Level, Skeleton, ErrorState } from '../../ui/ui.tsx';

/** HỌC VIÊN CẦN HỖ TRỢ — Tổng quan giáo viên (§3.2, mockup 02 bản GV). Số trong tiêu đề = số dòng của chính khối này. */
type Dong = { studentId: number; ten: string; lop: string | null; huyHieu: { text: string; tone: 'info' | 'warn' | 'danger' } | null; phu: string };
const HIEN = 8;

export function HocVienCanHoTro() {
  const { data, loading, error, reload } = useApi<{ rows: Dong[]; tong: number }>('/tong-quan/hoc-vien-can-ho-tro');
  const [het, setHet] = useState(false);
  if (error) return <ErrorState message={error.message} hint={error.hint} onRetry={reload} />;
  const rows = data ? (het ? data.rows : data.rows.slice(0, HIEN)) : [];
  return (
    <Card title={<span>Học viên cần hỗ trợ <span className="text-slate-500 font-normal">· lớp tôi dạy{data ? ` · ${data.tong}` : ''}</span></span>} bodyClass="p-0">
      {loading || !data ? <div className="p-4"><Skeleton rows={4} /></div> : !data.rows.length ? (
        <p className="m-0 px-4 py-3 text-sm text-slate-400">Chưa em nào cần hỗ trợ thêm.</p>
      ) : (
        <ul className="list-none m-0 p-0 divide-y" style={{ borderColor: 'var(--line)' }}>
          {rows.map((r) => (
            <li key={r.studentId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center px-4 py-2.5">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-100 font-medium">{r.ten}</span>
                  {r.huyHieu && <Level tone={r.huyHieu.tone}>{r.huyHieu.text}</Level>}
                </span>
                <span className="block text-[11px] text-slate-500 truncate">{[r.lop, r.phu].filter(Boolean).join(' · ')}</span>
              </span>
              <Link to={`/hoc-vien/${r.studentId}`} className="btn btn-sm no-underline">Hồ sơ</Link>
            </li>
          ))}
        </ul>
      )}
      {data && data.rows.length > HIEN && (
        <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--line)' }}>
          <button type="button" className="btn btn-sm" onClick={() => setHet((v) => !v)}>
            {het ? 'Thu gọn' : `Xem thêm ${data.rows.length - HIEN} học viên`}
          </button>
        </div>
      )}
    </Card>
  );
}
```
  > G-10: số `· {tong}` ở tiêu đề = số dòng của chính khối (bấm "Xem thêm" ra đủ); không phải số dashboard mở nơi khác.
- [ ] **Step 4:** Nối import GV vào `OverviewPage.tsx` (nếu Task 10 để tạm). `npm run check` xanh.
- [ ] **Step 5: Commit.** `"PR-Pa (12): Tổng quan giáo viên — Việc cần làm của tôi gom 4 nhóm, Học viên cần hỗ trợ"`

---

### Task 13: CODE_MAP + KIỂM bấm thử 4 vai (1440px và 375px)

**Files:**
- Modify: `CODE_MAP.md` (dòng Tổng quan, Công việc › Hỗ trợ học viên, chỉ số)
- Ảnh: `thiet-ke/anh/pr-pa/` (tạo thư mục)

- [ ] **Step 1: CODE_MAP.** Sửa/thêm dòng: `| **Tổng quan** (QL: 4 ô · Cần xử lý · Điểm đáng chú ý · Lịch sắp tới · Theo chi nhánh; GV: Việc cần làm của tôi · Học viên cần hỗ trợ) | web/src/modules/worklist/OverviewPage.tsx | server/src/worklist/tongQuan.ts · bangChiNhanh.ts · metrics.ts (metricSet + chương trình) |` ·
  `| Dòng tín hiệu SOS lớp thường (Tạo Case / Bỏ qua) | web/src/modules/worklist/DongTinHieu.tsx → QuickReport.tsx | /signals/pending/:id/dismiss · /cases/report |` ·
  `| Lọc chương trình Lớp thường / FT cho mọi chỉ số | shared/domain/tongQuan.ts | server/src/worklist/chuongTrinh.ts |`.
  Dòng cũ "Sự kiện nổi bật" → "Lịch sắp tới".
- [ ] **Step 2: Bật máy thử trong worktree** (theo memory "Máy chủ dev trong worktree"; **không** `preview_start`, **không**
  cổng 4000/5173): kiểm cổng trống `Get-NetTCPConnection -LocalPort 4127,5327 -ErrorAction SilentlyContinue` → rỗng.
  `npm run seed` → chạy nền `PORT=4127 node dist-server/server/src/index.js` → chép cấu hình Vite **tạm** vào gốc worktree
  (`vite.pa.config.ts`: root = worktree, alias `@shared`, `server: { port: 5327, strictPort: true, proxy: { '/api': { target: 'http://127.0.0.1:4127', changeOrigin: true } } }`)
  → `npx vite --config vite.pa.config.ts` (nền). **Không commit** file tạm; xoá sau khi xong. Đăng nhập bằng
  `fetch('/api/demo/session', { method: 'POST', … body: {userId} })` trong trang. Quản trị = 1, QL Nguyễn Khánh Vy = 2,
  GVCN Trần Ngọc Hà = 7, GVBM Phạm Thu Trang = 9. Chụp ảnh: khung trình duyệt có sẵn, hoặc `npm i --no-save playwright` +
  `chromium.launch({ channel: 'chrome' })` (không tải trình duyệt).
- [ ] **Step 3: Chuẩn bị tín hiệu lớp thường** (nếu GVCN 7 chưa có dòng "Chưa đạt"): đăng nhập Quản trị (1), mở Bảng điểm
  lớp thường MB-FOU 12 (`/bang-diem-thuong/{id}?kind=progress`), nhập cho **hai** em: Listening `10/40` (về GVCN Hà) và
  Speaking `5/25` (về GVBM Speaking). Ghi tên em vào Nhật ký.
- [ ] **Step 4: KIỂM — QL chi nhánh (2), 1440px.** Ghi ✓/✗ + ảnh:
  1. Thanh ngữ cảnh: **Lớp thường · Fast Track · Cả hai** (mặc định Cả hai), chọn chi nhánh (nếu > 1), hàng tab
     **Tổng quan | Phân tích** và bên phải "Dữ liệu đến 14/09/2026". Không chữ "Normal" nào trên màn.
  2. 4 ô: **Học viên dưới kỳ vọng** (dòng phụ "/ N đánh giá được") · **Học viên có Case đang mở** (dòng phụ "k Case", k bấm
     được) · **Chờ xác minh quá hạn** · **PA học thuật cần cập nhật**. Bấm **từng** số (kể cả k) → panel "{n} {đơn vị} — …"
     có **đúng n dòng**; "Cách tính" có bốn nhãn Chỉ số / Đối tượng tính / Không đếm trùng / Thời gian.
  3. Đổi **Lớp thường** → địa chỉ có `ct=thuong`; ô 1 thành "Học viên chưa đạt"; số đổi; bấm lại vẫn khớp. **Fast Track** →
     ô 3 = 0 "Không có mục nào". F5 giữ lựa chọn.
  4. **Cần xử lý** cạnh **Điểm đáng chú ý** (hai cột ~1.25 : 1). Cần xử lý ≤ 8 dòng, thứ tự đúng bảng Q4, mỗi dòng: chấm
     màu · "{n} …" · dòng phụ lớp (≤ 60 ký tự, không xuống hai dòng) · nút Mở/Xem/Duyệt. Bấm số và bấm nút → cùng panel, n dòng.
     "Tất cả việc →" mở `/cong-viec`.
  5. **Điểm đáng chú ý** ≤ 3 dòng; mỗi link "xem {n} …" mở panel đúng n dòng. Không có gì → "Chưa có điểm nào đủ dữ liệu để nêu."
  6. **▸ Lịch sắp tới** gập một dòng "· a đợt Test tuần này · b đợt tuần sau"; mở ra: nút tuần ghi `W3 SEP` (không năm,
     không ISO); cột **Lớp thường** / **Fast Track**, chữ "Giữa khoá", "Cuối khoá". Chọn Fast Track → mất cột Lớp thường.
  7. **Theo lớp · Monbay** (QL một chi nhánh → bảng lớp luôn): hàng "Cả Monbay" đầu bảng; 6 cột theo mockup; cột số thẳng
     phải, `tabular-nums`, hàng cao bằng nhau; bấm **mọi loại ô** (ít nhất một ô mỗi cột + hàng tổng) → đúng số dòng; ô Đủ
     dữ liệu "k/N" chỉ k bấm được. Tên lớp mở hồ sơ lớp. Nút **Theo giáo viên** vẫn mở bảng người cũ.
  8. Không lỗi đỏ console/network 4xx/5xx.
- [ ] **Step 5: KIỂM — Quản trị (1), 1440px.** Không chọn chi nhánh → bảng **Theo chi nhánh**, mỗi hàng có ▸; bấm ▸ mở
  xuống các lớp (thụt vào); hàng "Tất cả chi nhánh" cuối; bấm tên chi nhánh → `/?cn=…` và bảng thành bảng lớp. Bấm một ô
  hàng chi nhánh và một ô hàng lớp con → đúng số dòng. Khối Cần xử lý có dòng "PA chờ Quản lý duyệt" nếu có.
- [ ] **Step 6: KIỂM — GVCN Trần Ngọc Hà (7), 1440px.**
  1. Đầu trang "Chào Hà" + "Dữ liệu đến …"; **không** có thanh chương trình, 4 ô, Cần xử lý, bảng chi nhánh, tab Phân tích.
  2. **Việc cần làm của tôi**: các nhóm theo thứ tự Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành (chỉ nhóm có
     việc), mỗi nhóm có số; nhóm có việc quá hạn **tự mở**, nhóm khác gập; bấm header mở/gập. Hạn hiện qua `<Han>` (ví dụ
     "Xác minh nguyên nhân · hạn 16/09", "Hạn nhập điểm …"), không ISO. "Tất cả việc →".
  3. Nhóm **Case học thuật** có dòng tín hiệu Listening "… chưa đạt (10/40)" với **Tạo Case**, ô lý do nhỏ, **Bỏ qua**.
  4. **Tạo Case** → form tiêu đề "Tạo Case · Listening · {tên em}", dòng "Điểm: Giữa khoá · Listening 10/40", chỉ **một**
     nút kỹ năng (Listening, đã chọn), không có hai tab "Đang gặp vấn đề / Đã xong từ trước", không có khối chữ giải thích.
     Điền tên + mô tả + phân loại → Ghi nhận → toast, dòng biến mất; ô số "Chờ xác minh quá hạn" của QL không còn đếm nó
     (kiểm lại ở vai QL).
  5. Nhập tín hiệu thứ hai (hoặc dùng em thứ hai): gõ lý do "Em ốm hôm thi" → **Bỏ qua** → toast "Đã bỏ qua", dòng biến
     mất; (tuỳ chọn) một tín hiệu khác bấm Bỏ qua **không** lý do → cũng xong ngay.
  6. **Học viên cần hỗ trợ · lớp tôi dạy · n**: có em vừa nhập điểm thấp với nhãn "SOS …"; nút **Hồ sơ** mở hồ sơ em;
     "Xem thêm" nếu > 8.
  7. Công việc › Hỗ trợ học viên: dòng tín hiệu (nếu còn) cũng có hai nút (Q17).
- [ ] **Step 7: KIỂM — GVBM Phạm Thu Trang (9), 1440px.** Thấy tín hiệu Speaking (nếu Trang dạy Speaking MB-FOU 12) với hai
  nút; không thấy tín hiệu Listening của GVCN. Học viên cần hỗ trợ chỉ em lớp mình dạy.
- [ ] **Step 8: KIỂM — 375×812** (QL 2 và GVCN 7). `document.documentElement.scrollWidth <= 375` ở `/` cả hai vai và
  `/?ct=thuong`. 4 ô xếp 2 cột; Cần xử lý và Điểm đáng chú ý xếp dọc; bảng chi nhánh **cuộn ngang trong thẻ**, cột tên
  dính trái; dòng tín hiệu: nút Tạo Case / ô lý do / Bỏ qua xuống hàng dưới thông tin, không đè chữ; thanh dưới 4 nút
  không che nội dung cuối trang; panel danh sách mở full màn.
- [ ] **Step 9:** Lưu ảnh `thiet-ke/anh/pr-pa/{vai}-{man}-{1440|375}.png` (vai: `quantri`, `ql`, `gvcn`, `gvbm`; màn:
  `tongquan`, `tongquan-thuong`, `panel-o`, `bang-mo-lop`, `taocase`, `boqua`, `congviec`). Tắt máy, xoá `vite.pa.config.ts`,
  kiểm lại không còn tiến trình nghe 4127/5327.
- [ ] **Step 10:** `npm run check` xanh lần cuối; ghi số phép kiểm (≥ mốc Task 0 + 20).
- [ ] **Step 11: Commit.** `git add CODE_MAP.md thiet-ke/anh/pr-pa && git commit -m "PR-Pa (13): CODE_MAP + ảnh KIỂM bốn vai (1440px, 375px)"`

---

### Task 14: Rà soát, rebase, mở PR

- [ ] **Step 1:** superpowers:requesting-code-review — người rà **Opus 5** (hoặc Fable 5.1 nếu người code là Opus 5) rà cả
  diff `git diff origin/main...HEAD`, nhấn vào: (a) có con số nào trên Tổng quan **không** đi qua `metricSet`/tập chia từ
  nó, hoặc số ≠ số dòng khi bấm; (b) bộ lọc chương trình có lọt phần tử sai chương trình, lọc thiếu tử/mẫu số; (c) GV có
  gọi được `/tong-quan/quan-ly`, `/tong-quan/chi-nhanh[/o]` (phải 403); `oBangChiNhanh` có mở rộng phạm vi; (d) file ngoài
  ranh giới đợt 2 bị chạm (`cases.ts`, `CasePanel`, `SkillBoard`, `hienThiNgay.ts`, `display.ts`, file Qa); (e) chữ mới đúng
  THUAT_NGU, không "Normal", không chuỗi cấm; (f) truy vấn N+1 mới trên Turso. Xử lý theo superpowers:receiving-code-review.
- [ ] **Step 2: Rebase `main` mới nhất.** `git fetch origin && git rebase origin/main`. Xung đột:
  - `server/src/tests/run.ts` → giữ **cả** khối PR-AN / PR-S2 / PR-Qa (nếu đã merge) **và** 3 dòng PR-Pa; phép sổ chỉ số:
    nếu PR khác cũng thêm chỉ số → cộng dồn con số và mảng `expected`.
  - `server/src/routes/index.ts` → giữ cả hai khối; kiểm dòng import không trùng.
  - `shared/domain/metrics.ts`, `metrics.ts` (máy chủ) → giữ chỉ số của cả hai bên.
  - `shared/domain/index.ts` → giữ mọi dòng `export *`.
  Sau rebase: `npm ci` (nếu `package-lock.json` đổi) + `npm run check` xanh. Đỏ vì thay đổi của PR khác (ví dụ PR-Qa sửa
  `ngay`) → sửa phía PR-Pa nếu là dùng sai; nếu là luật mới của PR khác → 🛑 hỏi.
- [ ] **Step 3:** superpowers:finishing-a-development-branch — `git push -u origin pr-pa-tong-quan`, mở PR **không draft**,
  tiêu đề `PR-Pa · Tổng quan`, thân PR: việc đã làm theo mã (§3.2, P1–P6, P6b, P6c, §3.10 dòng tín hiệu, nợ S1 ×2), bảng
  Q1–Q25 rút gọn, mục Mâu thuẫn, "Chuyển cho PR khác", số phép kiểm trước → sau, ảnh KIỂM (link thư mục), "Không có migrate".
  Cuối thân PR: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. **Không tự merge.**

---

## Chuyển cho PR-Ra (đợt 4 — làm lại Công việc › Hỗ trợ học viên)

- Kiểu gom nhóm đã có: `gomNhomViec` + `NHOM_VIEC` + `nhomViecCua` (`shared/domain/tongQuan.ts`) và `DongViec`
  (`WorkList.tsx`, export). Công việc › Hỗ trợ học viên nên dùng **cùng** hai thứ này (mockup 04: "cùng kiểu gom nhóm đã
  duyệt ở Tổng quan"); `ViecCuaToi.tsx` là bản xem trước 5 dòng/nhóm — có thể gộp thành một component có chế độ.
- `WorkList` phẳng (bộ lọc Tất cả / Quá hạn / Đến hạn / Chờ duyệt, "Người phụ trách" Tôi / Tất cả) **chưa** đổi theo §3.4
  (Tất cả / Quá hạn / Hôm nay / Tuần này; dropdown Người phụ trách có "Chọn giáo viên…"; Loại việc; nút Nhắc / Duyệt).
- Tham số `?viec=` của `HoTroHocVienTab` vẫn là mã loại việc cũ (`verify`, `score`…); Tổng quan mới **không** còn gửi tham số
  này (bảng chi nhánh cũ từng gửi) — có thể đổi sang mã nhóm `NhomViec`.
- Dòng tín hiệu có hai nút ở cả hai nơi (Q17) — giữ khi làm lại.
- `mywork.ts` vẫn trả `groups` (12 loại) — Tổng quan không dùng; Ra quyết giữ hay bỏ.
- Dòng `mgmt` dẫn `/tien-do-cong-viec?viec=` (nợ sau rà PR-O, đã ghi §7 dòng Ra).

## Chuyển cho PR khác

- **PR-GV (đợt 5):** bỏ nút "Theo giáo viên" khỏi bảng Tổng quan (`BranchPulse.tsx` → `BangTheoGiaoVien`) khi Phân tích ›
  Theo giáo viên có (§3.3 "danh sách GV duy nhất").
- **PR-Form (đợt 5):** `QuickReport` — chọn tay Case **Writing** lớp thường (F07 nửa giao diện) khi mở **không** từ tín
  hiệu; dòng "Điểm:" đã có cho đường mở từ tín hiệu.
- **PR-Pb (đợt 4):** Điểm đáng chú ý kiểu xu hướng ("Writing Task 2 dưới kỳ vọng tăng 4 → 7 sau MT3") cần chỉ số theo đợt
  (lịch sử); nhận định "loại PA X cải thiện k/N" cần `ty-le-co-cai-thien` lọc theo loại PA.
- **PR-Qa / PR-S3:** P6c "badge lớp" (số trên hộp lớp ở `StudentsPage.tsx`) phải đi qua `<SoLieuO>` — file của Qa, PR-Pa
  không sửa. Nhãn `<Han loai="xac-minh-sos">` ("Xác minh nguyên nhân · hạn …") chưa hợp tín hiệu lớp thường (việc thật là
  Tạo Case / Bỏ qua) — `display.ts`. Việc `do_plan`, `decide`, `mgmt`… chưa có loại hạn → chưa qua `<Han>` (RB-2).
- **PR-S3:** dọn `server/src/worklist/dashboard.ts` + route `/overview` (không màn nào gọi) và 4 phép kiểm cũ của nó;
  `web/src/modules/yThuc/YThucReminders.tsx` (component) hết người dùng — chỉ còn hook `useNhacYThuc`.
- **PR-Z2c:** đo thời gian mở Tổng quan trên Turso. Chỗ nặng còn lại: `latestAttempts` chạy ~7 lần mỗi lần mở (ô 1, 4 môn
  của Điểm đáng chú ý, bảng: dưới kỳ vọng / SOS / đủ dữ liệu); `listCases` gọi `can()` mỗi dòng; chỉ số
  `tin-hieu-cho-xac-minh` vẫn qua `listSignals` (quyền từng tín hiệu); vòng `cause` của `mywork.ts` gọi `can()` mỗi Case.

---

## Nhật ký thực thi

*(Người thực thi ghi sau mỗi task: số phép kiểm, điều bất ngờ, chỗ phải tự quyết, model thật đang chạy.)*

- **Task 0:** (22/09/2026, session Fable 5.1 · High; subagent cài đặt = Fable 5.1, người rà từng task và cuối = Opus 5)
  worktree `../pisa-pr-pa` nhánh `pr-pa-tong-quan` từ `origin/main` @ `a0937ef`. Env sạch (không biến Turso). `npm ci` +
  `npm run check` xanh: **mốc 730 phép kiểm**. `git diff 7843875..HEAD` trên các file plan chạm: không có thay đổi (chỉ thêm
  file plan này). Đọc spec §1–§5, §7 dòng Pa; Q1–Q25 không thấy trái đặc tả §3.2/§3.10. Quyết định nhỏ: Task 10 sẽ tạo hai
  file stub `ViecCuaToi.tsx` / `HocVienCanHoTro.tsx` (component trả `null`) để typecheck xanh, Task 12 viết thật. Ghi chú:
  `web/src/ui/OSoNho.tsx` (PR-HV) là ô nhãn+số không bấm được, khác `SoLieuO` — không trùng.
- **Task 1:** commit `721c90f`. Đỏ đúng 4 phép (`is not a function`) → xanh **734**. Mã chép nguyên văn plan; bốn giá trị
  `DeadlineKind` đều có trong `DEADLINE_KINDS`. Rà (Opus 5): đạt, không lỗi; ghi chú nhỏ để dành: giới hạn 8/3 là no-op khi
  danh sách có đúng 8/3 mục (phép kiểm "tối đa 8" chưa thật sự kiểm), `mau` trùng tên (màu / mẫu số), thiếu assert
  `thamSoCt` dấu `&`.
- **Task 2:** commit `22c27f4`. Đỏ đúng chỗ quét nguồn (phần so tập xanh sẵn vì hàm cũ đúng) → xanh **735**; phép cũ
  `S1 · Chỉ số tin-hieu-qua-han…` vẫn ✓. `REPO` đi lên 4 cấp là đúng vì harness chạy từ `dist-server/`. Rà (Opus 5): đạt;
  chứng minh tập giống hệt (bốn LEFT JOIN bỏ đi đều theo khoá duy nhất, không lọc không nhân dòng). Ghi chú nhỏ để dành:
  phép so tập chưa assert tập admin > 0; `JOIN students s` trông thừa nhưng giữ để ngang hàng `SIGNAL_SELECT`.
- **Task 3:** commit `2d77aca` + `dcf6cba` (vòng sửa 1). Đỏ hai bậc: `tsc` TS2307 vì thiếu mô-đun (`.catch` không đỡ được lỗi
  biên dịch) → tạo file → 2 ✗ đúng dự kiến → xanh **738**. Vòng import `chuongTrinh.ts` ↔ `metrics.ts` chạy sạch, không cần
  phương án B. Rà (Opus 5): 1 quan trọng — phép kiểm "mẫu số cũng được lọc" có thể xanh rỗng → thêm `assert(mau.length > 0)`
  (mẫu số thật sự có em trên bộ demo), thêm assert "+1 lớp" với `toiDa = 1`, sửa chú thích `metricSetGoc`. Rà lại: đạt.
  Ghi nhận (giữ theo Q2, không đổi luật): vi phạm / PA xử lý gán chương trình theo lớp HV đang học chứ không theo `class_id`
  ghi lúc vi phạm; Case theo lớp của lượt Test (cùng `classKind`) chứ không theo `homeClassId` mà bảng chi nhánh dùng —
  hai chỗ này ghi vào "Chuyển cho PR khác". `tongQuan.tests.ts` tạo dữ liệu thật nên phải luôn là bộ chạy cuối.
- **Task 4:** commit `8b6173e` + `5d07a60` (vòng sửa 1). Đỏ 5 phép đúng dự kiến → xanh **742**. Chỉ `run.ts:7975` đếm sổ
  (24 → 27); phép `run.ts:8320` so `LISTED_METRICS` với sổ theo kiểu tương đối nên tự phủ ba chỉ số mới. Rà (Opus 5): 1 quan
  trọng — `overdueScoreAttempts` nới phạm vi cho người vừa dạy lớp vừa có quyền chi nhánh (bỏ lọc lớp khi `branchIds` khác
  rỗng) → sửa theo đúng luật OR của `classScopeSql` (lớp mình dạy HOẶC chi nhánh mình quản), thêm phép kiểm principal lai
  (GV MB không dạy MB-FOU 12 + quyền QL CP tạm) → **743**. Ghi nhận: `scoreDebtCells` gọi `settleNoShows` (ghi) và quét
  nặng — nay chạy mỗi lần mở Tổng quan (chuyển Z2c); tên phép kiểm `run.ts:7973` "hai mươi chỉ số" đã lệch 27 (plan bảo giữ).
- **Task 5:** commit `0c010eb`. Đỏ (TS2307 rồi 4 ✗ `is not a function`) → xanh **747**. `P.w2Teacher` (user 10, Cao Khánh
  Linh) đúng là không dạy MB-FOU 12 — dùng như plan. `P.mbManager` chỉ có chi nhánh MB (ghi cho Task 6). Ba tổ hợp Cần xử lý
  đều có dòng (6/4/4). Rà (Opus 5): đạt; hướng `tu`/`mau` đúng cho cả ba luật (với `ty-le-co-cai-thien` và
  `dung-han-cap-nhat`, `ids` là mẫu số). Ghi nhận: `DiemChuY.extra` không mang chi nhánh/chương trình — web phải gắn
  `phamVi` khi mở (Task 10 đã dự tính); mỗi lần mở khối QL chạy ~6 lượt `listCases` + 4 lượt `latestAttempts` (chuyển Z2c);
  bộ demo cho "0/14 lần cập nhật PA đúng hạn" — đúng luật, chỉ trông gắt.
- **Task 6:** commit `c439650` + `b3c57e3` (vòng sửa 1). Đỏ 3 ✗ → xanh **750**; bộ kiểm chậm thêm ~8 s (52 → 60 s) vì phép
  "bấm mọi ô" tính lại bảng cho từng ô (ghi cho Z2c). Rà (Opus 5): hai lỗ hổng ở TẦNG KẾ HOẠCH — (A) hàng tổng cột Học
  viên là hợp các hàng (lớp đang hoạt động) còn năm cột kia là tập gốc của chỉ số (dân số `studentsInScope`, không lọc
  trạng thái lớp) → cột con có thể lớn hơn Học viên. **Tự quyết:** hàng tổng Học viên = dân số của chỉ số
  (`studentsInScope` lọc chương trình), thêm assert các cột HV của hàng tổng ⊆ Học viên. (B) Case mà lớp đang học không
  nằm trong danh sách lớp của bảng (em chuyển chương trình / lớp đóng) chỉ có ở hàng tổng, nên hàng `cn:X` có thể nhỏ
  hơn tổng khi chọn chính X. **Tự quyết: không sửa trong PR** — thêm hàng "Chưa xếp lớp" là đổi hình dạng bảng; ghi chú
  thích trong file và nêu ở thân PR để session planning quyết. Bộ demo không có trường hợp nào của A/B.
- **Task 7:** commit `ae71240`. Đỏ 1 ✗ ("FT lẫn lớp thường") → xanh **751**. Đổi `c.kind === 'ft'` → `c.is_fast_track`
  KHÔNG đổi số mốc demo (đo trước/sau giống hệt): seed ghi `kind = 'FT'` viết hoa nên điều kiện cũ chưa từng khớp — lớp FT
  chỉ thoát vòng lớp thường nhờ không có mốc; điều kiện mới mới là thật. Rà (Opus 5): đạt; ghi chú `c.kind` còn trong SELECT
  nhưng hết người dùng.
- **Task 8:** commit `9d2e3d1`. Phép kiểm đầu–cuối **xanh ngay** (máy chủ S1 đúng): tạm ngừng phân công Speaking MB-FOU 12
  → tín hiệu về GVCN → `myWork` có dòng với `['create_case','dismiss']` → `reportIssue(fromSignalId, idempotencyKey)`
  thành công, gửi lại cùng khoá ra cùng Case, tín hiệu `linked`, dòng biến mất → khôi phục phân công. Cửa 🛑 không xảy ra,
  không chạm `cases.ts`/`signals.ts`. Tổng **752**.
- **Task 9:** commit `28e6b62`. Session bị ngắt giữa chừng (đã tạo `SoLieuO.tsx`, chưa sửa `SoLieu.tsx`) → nối lại
  cùng subagent làm nốt. `SoLieuO.tsx` chép nguyên văn; `SoLieu.tsx` chỉ khác plan ở hai chỗ `/* giữ nguyên */` (chép từ
  file cũ) và giữ JSDoc đầu file. `npm run check` xanh (752 + typecheck). Prop mới (`nhan`/`phu`/`tone`/`chuongTrinh`) và
  `SoLieuO` chưa có người gọi cho tới Task 10 — kiểm giao diện dồn về Task 13.
