# PR-S6F · Sửa sau rà đợt 6 lượt 1 — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Sửa mọi lỗi người rà tìm thấy ở 5 PR đợt 6 lượt 1 (#145 Pb2-a, #146 Pb2-b, #147 VAI-a, #148 VAI-b, #149 UXF-a; `main` @ `f814ba26`):
**1 P0 + 24 P1** (22 sau khi gộp trùng) và các P2 rẻ hoặc người dùng thấy được. Lõi:
(1) **P0** "lần nhập đầu" bị chốt khi ô mới có một tiêu chí → bảng Phân tích GV ghi "đúng hạn" sai vĩnh viễn.
(2) **Một luật cho một khái niệm**: một luật "em đang học" (không đếm em Tạm dừng / thôi học / lưu trữ), một luật "quá hạn nhập điểm",
một hàm "tuần học thứ n · đang dừng". Không còn bản sao.
(3) **Số khớp**: số trên ô = số dòng khi bấm, ở Tổng quan, Công việc, chuông, hồ sơ HV, Phân tích GV.
(4) **Trang đầu không gọi lặp route nặng** và đo cả lần tải trang.

**Architecture:** Không bảng mới, **không migrate** (DB reset trước deploy). Việc chính là **xoá đường tính thứ hai** và cho mọi nơi gọi chung một hàm:
- `HV_DANG_HOC_SQL(alias)` (mới, `server/src/students/tamDung.ts`) thay mọi điều kiện "em đang học" viết tay;
- `mocTreNhapDiem(han, tuanThi)` (mới, `server/src/platform/week.ts`) — `quaHanNhapDiem` gọi lại nó; Việc, cột Việc tiếp theo và bảng Phân tích GV đọc cờ / mốc này;
- `tuanHocTai(batDau, ngay, dung)` (mới, `shared/domain/hienThiNgay.ts`) cho đầu hồ sơ, chương Hành trình, panel Chuyển lớp / Lên lớp;
- "Bài chờ chấm" của Lớp tôi dạy tính ở máy chủ theo `baiId`, cùng hàm cho ô và danh sách;
- `useApi` gộp các GET **đang bay** cùng đường dẫn (một chỗ sửa, mọi nơi gọi hưởng).

Phép kiểm ở `server/src/tests/prS6f.tests.ts` (`runPrS6fTests(t)`, đăng ký **cuối** `run.ts`).
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); harness `check()` của `run.ts`, chạy `npm run check`.
**Spec:**
- **Nguồn chính:** kết quả rà đợt 6 lượt 1 (`scratchpad/ra-dot6/`: `CHUNG.md`, `pb2-a.md`, `pb2-b.md`, `vai-a.md`, `vai-b.md`, `uxf-a.md`, `tich-hop.md`).
- Kế hoạch 5 PR lượt 1: `plans/2026-10-01-pr-{pb2-phan-tich-giao-vien, vai-a-tong-quan-theo-vai, vai-b-ho-so-hoc-vien, uxf-a-so-lieu-khop}.md` (bảng Q của từng PR).
- Đặc tả `specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.1e–§3.1h (Q31-1, Q31-4, Q31-5, Q31-8, Q31-11).
- `thiet-ke/HOP_DONG_SO_LIEU.md` §1 (một số một hàm trả tập ID).
- Mockup 23 (Tổng quan theo vai, chuông), 24 (hồ sơ HV · Tạm dừng D1), 25 (Phân tích GV), 26 (Hành trình).
- Quyết định planning D1–D18 (01/10) — ghi ở bảng Q.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-S6F** · đợt 6 · sửa sau rà lượt 1 · một PR, **không draft**, **không tự merge** (xem Câu 1: có thể tách S6F-a / S6F-b) |
| Nhánh · worktree | `pr-s6f-sua-sau-ra-dot-6` · `.claude/worktrees/pr-s6f-sua-sau-ra-dot-6`, từ `origin/main` @ `f814ba26` trở đi |
| Cổng thử | API **4187** · Vite **5387** (Vite tạm ngoài worktree, proxy về 4187). Không dùng 4000/5173 |
| Log check | `$env:TEMP\check-s6f.log` (tên riêng — `$TEMP` dùng chung giữa các session) |
| Model | **Opus 5.5 · High** · phương án B: **Fable 5.1 · High**. Đầu phiên, session **tự kiểm model thật**; không phải Opus 5.5 thì **DỪNG**, báo chủ sản phẩm (trừ khi chủ sản phẩm đã chọn B) |
| Người rà | **Opus 5.5**, rà **một lượt** khi xong lượt 2 đợt 6 (memory "rà PR theo đợt"). Session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. `Co-Authored-By` ghi đúng model thật |
| Migrate? | **Không.** `schema.sql` không đổi. Không lệnh dữ liệu cũ |
| Lệnh skill | **`/ponytail lite` đầu phiên** (PR có giao diện). impeccable **`clarify`** ở Task 5, 8, 9, 13 (chữ trên màn) · **`polish`** ở Task 6, 7, 13 (chỉ phần nhìn có đổi) · **`audit`** + **`polish`** (**sáng và tối**) ở Task 14. Không `init`/`document`/`hooks on`/`npx impeccable install|update`. Trước PR: **`/ponytail-review`** |
| Phụ thuộc | Không chờ PR nào. Lượt 2 đợt 6 (UXD, UXF-b) **chưa có kế hoạch** → không có file chồng song song, trừ khi chủ sản phẩm chọn tách (Câu 1) |
| Không làm | mã tuần toàn web, `mocChuPa`, `attemptHref` máy chủ, R5-x, O1, O2, U5 → **PR-UXF-b** · điện thoại, DemoBar, thanh dưới biểu tượng → **PR-UXD** · mã chết, nghi ngờ chưa chứng minh → **PR-Dọn** · thuật ngữ, tiêu đề thông báo → **PR-S3** · DEMO.md, `init-ban-chinh` → **PR-DEPLOY** (bảng "Chuyển cho PR khác") |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - chạy `npm run check` **một lần, ở foreground**, log `$env:TEMP\check-s6f.log`;
  - xanh, số phép kiểm ≥ mốc B → commit `PR-S6F (n): …`.
- Mỗi Task bắt đầu bằng **Phép kiểm trước** — viết xong phải **ĐỎ trên `main` hiện tại** (chạy một lần, ghi số ✗ vào Nhật ký), rồi mới sửa.
- Sập segfault / OOM → chạy lại **một** lần; sập lặp → chạy thẳng `tsc` + `node dist-server/…/tests/run.js` + `tocDo.run.js`, không qua npm.
  Treo > 10 phút → quét `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`, tắt hết, chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai, 1440 và 375, **sáng và tối**, **một lần** ở Task 14:
  - Playwright kênh Chrome; demo `POST /api/demo/session {userId}`; vai tra `tests/tocDo.run.ts:114`;
  - ảnh vào `thiet-ke/anh/pr-s6f/`;
  - API `PORT=4187`, Vite tạm 5387 proxy về 4187 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4187/5387, quét `tests/run.js` treo, dọn file tạm.

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 (D1) | Khi **thi hành lệnh chuyển lớp**, vi phạm chưa phản hồi được **chốt lại `han_xu_ly`** như `ghiDe` của Quay lại học: `chotHanXuLy([sid], { ghiDe: true })` trong giao dịch `apDungMotDong` | hạn ở màn Ý thức và hạn bảng GV phải là một |
| Q2 (D2) | Em **không đang học** (`status != 'active' OR archived_at IS NOT NULL` — gồm Tạm dừng, thôi học, lưu trữ) **không** tính ở Phân tích GV (Chấm điểm, Xử lý vi phạm), badge "n bài chờ chấm", Lịch Test. **Một** đoạn SQL `HV_DANG_HOC_SQL(alias)` dùng ở mọi nơi | cùng luật `scoreDebt` (UXF-a Q9) |
| Q3 (D3) | Sửa phân công lớp FOU: lưu **không** tự gán G+V trống cho người dạy L/R. Ô trống vẫn trống. Panel chỉ mở **gộp** khi L, R, G+V **cùng một người và cả ba có người** (hoặc cả ba trống) | Q31-5 "dữ liệu không đổi" |
| Q4 (D4) | Chấp nhận phép kiểm "Không N+1 `tongHop`" đã nới (`n26 − n4 ≤ 2 × số lô`) và trần `congViec30PaChuaNgayThi` 91 → 94 (dưới luật 30 %). **Ghi vào thân PR** | đúng là không N+1 theo lượt; bộ demo lớn lên |
| Q5 (D5) | Thanh việc hồ sơ HV thêm `yt_xem:{sid}` "Ghi nhận n vi phạm mới", `yt_thuc_hien:{id}` "Ghi 'Đã thực hiện' …", `support:{caseId}` "Đề ra PA" — cùng key, cùng người làm, cùng hạn với `myWork`. Số việc hồ sơ = số việc Công việc của em đó | K3-01 "mọi việc của em" |
| Q6 (D6) | **Một** luật quá hạn nhập điểm: tuần thi đã hết **và** qua hạn (`quaHanNhapDiem` / cờ ô `overdue`). Dùng cho `urgencyOf` nhóm Chấm điểm, `viecTiepCuaEm`, bảng Phân tích GV (mốc trễ = `mocTreNhapDiem`). Không bản sao | UXF-a Q10 |
| Q7 (D7) | Khung FT / Lớp thường đã nhớ **theo người dùng**: khoá localStorage thêm `.u{userId}` — áp **mọi trang** dùng `CongTacKhung` (một chỗ sửa). Lớp tôi dạy: khung đã nhớ không có lớp → về khung GV dạy (`khungMacDinhGv`) | máy chung, demo đổi vai |
| Q8 (D8) | Khung Lớp thường: tab, tiêu đề Excel, tên file **bỏ chữ "SOS"** → "Tổng hợp Test", `tong-hop-test-*.xlsx` | lớp thường không có SOS |
| Q9 (D9) | `<Han>` **12 px ở mọi nơi** (bỏ `text-[11px]` ở `Han.tsx:52`), kể cả hàng Case bảng kỹ năng | Q31-4 |
| Q10 (D10) | Cột "Bài chờ chấm / quá hạn" của Lớp tôi dạy đếm **bài** (`baiId`), tính ở **máy chủ** (`tinhLopToiDay` / `oLopToiDay` `cot=bai`), bấm số mở danh sách bài **cùng hàm**. Web bỏ `baiChoChamTheoLop` | số = danh sách mở ra |
| Q11 (D11) | Việc Phối hợp SOS chỉ sinh từ lượt **Mock FT** (`COALESCE(a.kind,'mock') = 'mock'`). Lớp thường không bao giờ có | lớp thường đã có việc `phoi_hop` riêng |
| Q12 (D12) | Thông báo `bao_len` thuộc **Cần làm**, rời Cần làm khi thẻ đã xử lý (`ycd.trang_thai != 'cho'`) | Q18 VAI-a |
| Q13 (D13) | Link Tổng quan → Công việc mang `khung=tat-ca` | số trên Tổng quan = số chip khi mở |
| Q14 (D14) | Tổng quan không gọi lặp route nặng: `useApi` **gộp GET đang bay** cùng đường dẫn; badge GV đọc `/my-work` (`summary.overdue`) thay `/my-work/dem` (xoá route nếu không còn ai gọi); Lớp tôi dạy không cần `/my-work` (Q10). Thêm phép kiểm tốc độ **cả lần tải trang đầu** cho GV và QL | GV `/my-work` ×3, QL `/tong-quan/quan-ly` ×2 |
| Q15 (D15) | Bỏ chữ "ca tối" / "buổi tối" ở `WelcomePage.tsx:313` và seed | không có ca học cố định |
| Q16 (D16) | Xoá route chết **`GET /cases/queues`** (+ `caseQueueCounts` nếu không còn ai gọi + dòng trần tốc độ). **Giữ `GET /cases`**: `StudentManagePanel.tsx:182` còn gọi `?studentId=&status=open`, `tocDo.run.ts:422,520` cũng dùng | D16 "xoá nếu không ai gọi" — `/cases` vẫn có người gọi |
| Q17 (D17) | **Một** hàm `tuanHocTai(batDau, ngay, dung)` → `{ tuan: number \| null; dangDung: boolean } \| null`: ngày nằm trong khoảng dừng → tuần học cuối **trước** tuần dừng + `dangDung`; dừng ngay tuần đầu → `{ tuan: null, dangDung: true }`; trước tuần bắt đầu → `null`. Chữ: "tuần học thứ 14 · đang dừng" / "đang dừng". Đầu hồ sơ, chương Hành trình, panel Chuyển lớp / Lên lớp cùng gọi. Chương của em đang dừng vẫn là **chương đang học**, không "Bảo lưu" | ba nơi đang ra ba kết quả |
| Q18 (D18) | **P0**: `nhap_dau_ngay` chỉ đặt khi ô có giá trị **thật** (`raw !== null \|\| band !== null`), không khi mới gõ một tiêu chí. Đường lớp thường (`regular.ts:532`) đã đúng luật (một số) — chỉ thêm phép kiểm | Q13 Pb2-b "lần đầu ô **có điểm**" |
| Q19 | Phân tích GV gán người theo **lớp em học ở tuần thi** (ghi danh hiệu lực tại `x.tuan`, một câu theo lô), không theo `assessment_attempts.class_id` hiện tại | mockup 25 "tính cho người dạy em **lúc thi**"; `luatLoTrinh.ts:276` dời lượt `planned` sang lớp mới |
| Q20 | Hiệu quả PA phần "PA do giáo viên thêm": **tóm tắt** đếm mọi PA `!quyChe` có kết quả (= `paCoKetQua`), bảng con thêm một hàng mờ "Case chưa phân loại lỗi · n PA" để Σ hàng = tóm tắt | phương án (a) của người rà — một tập, không thêm cờ |
| Q21 | Ghi bù đúng Thứ Hai: tuần k có `due + 7k >= ngày ghi` tính **đúng hạn** (không bỏ khỏi mẫu) → N nghĩa vụ = N của tiêu đề "ghi bù N tuần" | UXF-a Q13 |
| Q22 | Hiệu quả PA quy chế giữ xếp theo **mức SOS hiện tại** của Case; thêm `ponytail:` + một câu ở "Cách đọc" ("theo mức SOS hiện tại của Case") — trừ khi chủ sản phẩm chọn khác ở Câu 3 | rẻ; lưu mức lúc chạy PA cần thêm cột |
| Q23 | Em lớp thường **đã hết khoá** chuyển ở bối cảnh `giua-khoa` (panel một em) vẫn tính `khac_goi_y` từ `cuoiKhoaTheoHocVien` (điều kiện: lớp nguồn là lớp thường và `mocKetKhoa(...).tuCuoiKhoa`) | cờ lưu đúng; không tin web |

## Global Constraints

- **Số khớp — luật của PR:** mỗi sửa số có **phép kiểm so hai đường** (ô = số dòng khi bấm, hoặc hai màn cùng tên). Không thêm đường đếm thứ hai.
  Khung `run.ts` "mọi chỉ số `n = ids.length = rows.length`" phải còn xanh.
- **Quyền:** mọi đường đổi dữ liệu trả về có **phép kiểm PHỦ ĐỊNH** (người ngoài phạm vi không thấy / không bị tính).
- **SQL (Turso):** chỉ `?`; `IN (…)` qua `theoLo`, ≤ 900 tham số; UNION ≤ 20 vế; **không N+1**; ghi trong `tx()` (`BEGIN IMMEDIATE`); ngày nghiệp vụ `demoToday()` / `useNgayNghiepVu().homNay`.
- **Tốc độ:** đường đổi số câu → đo lại trong `tests/tocDoDuong.ts`. Trần mới = `max(sau+10, ⌈sau×1.3⌉)`, **không nâng trần cũ quá 30 %**. `/students/1` đang 96–99 / trần 100: Task 8 thêm việc thì **phải bù câu** (ví dụ `dongThongTin` dùng lại `khoangTamDung` đã nạp), không nâng trần quá 30 %. Vượt → Nhật ký, báo planning.
- **Giao diện:** `/ponytail lite`; mã tuần `W2 OCT` (`tuanLich`), ngày chỉ cho hạn / ngày thi / ngày sinh / nhật ký; **12 px** cho kết quả, hạn, người phụ trách; token màu; cột thẳng, `tabular-nums`; không chữ "SOS" ở lớp thường; không "n/16"; không "ca tối".
- **Phép kiểm:** `server/src/tests/prS6f.tests.ts`; ngày demo 14/09/2026; phép kiểm cũ đổi kỳ vọng thì **sửa**, không xoá; **tổng số phép kiểm không giảm**.
- **Không bớt** (CLAUDE.md): kiểm dữ liệu nhập, quyền, chống mất dữ liệu. `ponytail:` được phép, liệt kê trong thân PR.

## Hướng dẫn riêng cho phương án B (Fable)

1. Task 1 là **P0**: làm trước, phép kiểm trước phải đỏ trên `main`.
2. Không "sửa cho khớp" bằng cách chỉnh một phía cho bằng phía kia. Hai đường **gọi chung một hàm**; không làm được → Nhật ký, dừng.
3. Không tự đổi luật SOS, Cuối khoá, lộ trình, Ý thức. Chỉ đọc chúng, trừ chỗ bảng Q ghi rõ.

## Task 0 · Chuẩn bị

- [ ] Kiểm model thật. Không phải **Opus 5.5** → dừng, báo chủ sản phẩm.
- [ ] Worktree `.claude/worktrees/pr-s6f-sua-sau-ra-dot-6` từ `origin/main`; `/ponytail lite`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (mốc rà: 2162 phép kiểm chính + 28 tốc độ) vào Nhật ký.
- [ ] Đọc: 7 file rà ở `scratchpad/ra-dot6/` (hoặc bản sao chủ sản phẩm đưa); bảng Q của 4 kế hoạch lượt 1; `HOP_DONG_SO_LIEU.md` §1.
- [ ] Commit `PR-S6F (0): kế hoạch + mốc {B}`.

## Task 1 · P0 — "lần nhập đầu" chỉ khi ô có điểm thật (D18)  ·  [S6F-a]

**Files:** `server/src/fasttrack/attempts.ts:1666-1678` · `server/src/seed/pb2bSeed.ts:26-30` · tạo `server/src/tests/prS6f.tests.ts` + đăng ký cuối `run.ts`.
**Nguồn:** Pb2-b P0.

Hiện trạng: `hasValue = raw !== null || crit.some(v => v !== null)` → `nhapDau = hasValue ? existing?.nhap_dau_ngay ?? today : null`. Gõ 1/4 tiêu chí W1 (band vẫn NULL) đã chốt ngày.
- [ ] **Phép kiểm trước** (khối 1, phải đỏ):
  - ô Writing Task 1, hạn 22/09: ngày 20/09 lưu `{ criteria: [6, null, null, null] }` → `nhap_dau_ngay` **NULL**; ngày 28/09 lưu đủ 4 tiêu chí → `nhap_dau_ngay = 28/09` → `tapChamDiem` tính **trễ**;
  - sửa điểm sau giữ ngày đầu (đã có) — giữ;
  - bỏ bớt tiêu chí làm band về NULL → `nhap_dau_ngay` NULL;
  - lớp thường: lưu điểm ngày D → `nhap_dau_ngay = D`; xoá điểm → NULL (đường `regular.ts:532` đã đúng — phép kiểm khoá lại);
  - chéo: ô 1/4 tiêu chí quá hạn nằm trong **cả** `scoreDebtCells(...).filter(overdue)` **và** tập "chưa nhập & trễ" của `tapChamDiem` (phép kiểm (a) kế hoạch Pb2-b Task 4).
- [ ] `attempts.ts`: `const coDiemThat = raw !== null || band !== null; const nhapDau = coDiemThat ? existing?.nhap_dau_ngay ?? today : null;`
  (giữ `hasValue` cho `enteredBy`/`matHet` như cũ).
- [ ] `pb2bSeed.ts` `buNgayPb2b`: bỏ `OR c1..c4 IS NOT NULL` (chỉ `raw_score` / `band`).
- [ ] `npm run check` → commit `PR-S6F (1): P0 — lần nhập đầu chỉ tính khi ô có điểm thật`.

## Task 2 · Một luật "em đang học" (D2)  ·  [S6F-a]

**Files:** `server/src/students/tamDung.ts` (export mới) · `server/src/worklist/scoreDebt.ts:33` · `server/src/fasttrack/attempts.ts:596` ·
`server/src/classes/classes.ts:162-172` (`listClassSummaries.needScores`) · `server/src/cham/canCham.ts:441-455` (`lichTest`) ·
`server/src/phanTich/giaoVien.ts:96-144` (`napBai`), `:268-283` (`tapXuLyViPham`).
**Nguồn:** UXF-a P1 "T65 làm chưa đủ" · Pb2-b P1 "`napBai` chép luật nợ" · Pb2-b P1 "vi phạm em Tạm dừng" · UXF-a "Chuyển cho PR khác" (`napBai`).

```ts
/** Q2 (D2): MỘT điều kiện "em đang học" — Tạm dừng, thôi học, lưu trữ đều không sinh nợ / không tính cho giáo viên. */
export const HV_DANG_HOC_SQL = (s: string) => `${s}.status = 'active' AND ${s}.archived_at IS NULL`;
```
- [ ] **Phép kiểm trước** (phải đỏ):
  - em X (lớp FT, có ô quá hạn tuần đã hết) Tạm dừng → badge `needScores` của lớp **và** `lichTest(periodId cũ).lop[].conBai` / `tongQuan.quaHan` đều giảm đúng số bài của X; Quay lại học → tăng lại;
  - em Y `finished` có lượt MT2 `planned` quá hạn → **không** có trong `tapChamDiem` (bảng GV) và không trong `scoreDebtCells`; em Y lưu trữ → như vậy;
  - GVCN có 3 vi phạm `han_xu_ly = 10/09`, em Tạm dừng 08/09, hôm nay 20/09 → ô Xử lý vi phạm **không** có 3 mục trễ; em `finished` → cũng không;
  - **hai đường**: với QL chi nhánh MB, Σ "chưa nhập & trễ" của bảng GV ⊇ `noDiemCuaGv(...).filter(overdue)` quy về `baiId` (phép kiểm (a) Pb2-b Task 4);
  - quét chuỗi: `server/src` không còn `s.status = 'active' AND s.archived_at IS NULL` viết tay ngoài `HV_DANG_HOC_SQL` (trừ `signals.ts` (a) — đổi luôn).
- [ ] `scoreDebt.ts`, `attempts.ts` (`chiDangHoc`), `signals.ts:87`: dùng `HV_DANG_HOC_SQL('s')`.
- [ ] `classes.ts` câu lượt: `JOIN students s ON s.id = a.student_id AND ${HV_DANG_HOC_SQL('s')}` (không thêm câu).
- [ ] `canCham.ts` `lichTest`: thêm cùng JOIN vào câu lượt tuần đang xem.
- [ ] `giaoVien.ts` `napBai`: bỏ `tamDung = hv_status === 'inactive'`, lọc tập Chấm điểm bằng `HV_DANG_HOC_SQL('s')` trong câu SQL — **chỉ** cho tập Chấm điểm (tập Kết quả / Tiến bộ vẫn giữ bài đã có điểm của em đã thôi học: gom thêm cờ `dangHoc` từ câu, `tapChamDiem` bỏ ô `!dangHoc`).
- [ ] `tapXuLyViPham`: `JOIN students s ON s.id = violations.student_id` + `HV_DANG_HOC_SQL('s')`.
- [ ] `tocDoDuong`: `/classes` (danh sách lớp), `/cham/lich-test`, `/phan-tich/giao-vien` đo lại.
- [ ] `npm run check` → commit `PR-S6F (2): một luật "em đang học" — badge, Lịch Test, Phân tích GV, vi phạm`.

## Task 3 · Một luật quá hạn nhập điểm (D6)  ·  [S6F-a]

**Files:** `server/src/platform/week.ts:97-103` · `server/src/worklist/mywork.ts:254-259` (`urgencyOf`), `:320-400` (`BaiChuaCham`, `gomBaiChuaCham`, bucket `score`) ·
`shared/domain/hocVienLop.ts:350-368` (`viecTiepCuaEm`) · `server/src/classes/dongHocVien.ts:65-84` (`nhapDiemTheoEm`) · `server/src/phanTich/giaoVien.ts:154-180` (`tapChamDiem`) ·
web: nơi lưu điểm (`invalidate`).
**Nguồn:** UXF-a P1 ×2 (`viecTiepCuaEm`, `urgencyOf`) = VAI-a P1 (`urgencyOf`, Task 11 vế 3) · Pb2-b P1 "Chấm điểm dùng luật trễ riêng" · VAI-a P2 "badge không tải lại sau nhập điểm".

```ts
/** Q6 (D6): mốc trễ nhập điểm = max(hạn, Chủ nhật tuần thi). quá hạn ⇔ hôm nay > mốc. */
export const mocTreNhapDiem = (han: string, tuanThi: string) => { const cn = addDays(mondayOf(tuanThi), 6); return han > cn ? han : cn; };
export function quaHanNhapDiem(han, tuanThi, today) { return !!han && !!tuanThi && today > mocTreNhapDiem(han, tuanThi); }
```
- [ ] **Phép kiểm trước** (phải đỏ) — ngày demo 14/09 (Thứ Hai, W3 SEP), em W có ô L tuần W3 SEP với hạn **đặt đè 13/09**:
  - `quaHanNhapDiem` không đổi kết quả với mọi ca cũ (khoá bằng bảng 6 ca);
  - `/my-work` của GVBM L: việc "Nhập điểm L" có `urgency !== 'overdue'`; `summary.overdue` không đếm nó;
  - `/hoc-vien-lop`: chip `qua-han` **không** có W; badge "n HV quá hạn việc" hồ sơ lớp không đếm W;
  - bảng GV: ô của W **chưa tính** (tuần chưa hết); nhập 19/09 (còn trong tuần) → **đúng hạn**; nhập 22/09 → trễ **1 ngày** (đếm từ Chủ nhật 20/09);
  - ô W2 SEP (đã hết), qua hạn → **cả bốn** đường là quá hạn (Việc, chip, ô Tổng quan, bảng GV);
  - **hai đường**: số việc `score` có `urgency='overdue'` của GV = số nhóm có ít nhất một ô trong `bai-qua-han-nhap-diem` của GV đó.
- [ ] `week.ts`: thêm `mocTreNhapDiem`; `quaHanNhapDiem` gọi lại nó.
- [ ] `mywork.ts`: `BaiChuaCham` thêm `overdue` (đã có ở `myPendingDetail[].overdue` / `pendingDetail[].overdue`); bucket mang `quaHan = some(overdue)`;
  `urgency = quaHan ? 'overdue' : first.due === today ? 'today' : 'normal'`. `urgencyOf` giữ cho các nhóm khác (không phải nhập điểm).
- [ ] `dongHocVien.ts`: `x.han` chỉ lấy hạn của ô `overdue` nếu có (không thì hạn sớm nhất). `viecTiepCuaEm`: `tre = n.quaHan` — `deadlineView` chỉ để in chữ hạn, không quyết tone.
- [ ] `giaoVien.ts` `tapChamDiem`: "chưa tới hạn" = `!quaHanNhapDiem(x.han, x.tuan, homNay)` thay `homNay <= x.han`; `dung = nhapDau <= mocTreNhapDiem(han, tuan)`; `tre` đếm từ mốc đó. Panel Chấm điểm hiện **hạn** như cũ (mốc chỉ dùng để tính).
- [ ] Web: sau lưu điểm (FT + lớp thường) gọi thêm `invalidate('/my-work')` để badge đỏ tải lại.
- [ ] Quét: `server/src` không còn so `today > deadline` / `date < today` cho **nhập điểm** ngoài `week.ts`.
- [ ] `npm run check` → commit `PR-S6F (3): một luật quá hạn nhập điểm cho Việc, cột Việc tiếp theo và bảng GV`.

## Task 4 · Phân tích GV — đúng người, đúng tập  ·  [S6F-a]

**Files:** `server/src/phanTich/giaoVien.ts` (`napBai` :96-144, `:163, :196, :231` `nguoiLuc`, panel `:383-397`) · `server/src/phanTich/hieuQuaPa.ts:110-113, :135-181` ·
`server/src/cases/effectiveness.ts:208-243` (`queryPlans`) · `server/src/tests/prPb2b.tests.ts:470-486`.
**Nguồn:** Pb2-b P1 "gán theo `class_id` hiện tại" · Pb2-b P1 "thiếu phép kiểm Task 4" · Pb2-a P1 "PA do GV thêm bỏ Case chưa phân loại" ·
Pb2-b P2 "`gv=` trả tên mọi tài khoản", "phép kiểm N+1 lớp rỗng", "ngày sửa UTC" · Pb2-a P2 "hàng con quy chế sắp theo số", "mức SOS hiện tại" · Pb2-a chuyển "`queryPlans` không chia lô".

- [ ] **Phép kiểm trước** (phải đỏ):
  - (d) em chuyển lớp **giữ khoá** X → Y từ W4 SEP; MT3 W3 SEP: GV A (lớp X) nhập L đúng hạn, W2 chưa nhập → ô L tính **đúng hạn cho A**, ô W2 trễ tính cho **GV W2 lớp X**, không ai ở lớp Y; Kết quả L tính cho A;
  - (b) vắng đã xác nhận / lượt huỷ / MT lịch sử → không có mặt ở Chấm điểm; (c) ô tuần sau `den`, chưa nhập → không có mặt;
  - Case FT do GV báo, **chưa có lỗi chính**, 1 PA tự thêm có kết quả: ô "PA hiệu quả" của GV = "PA do giáo viên thêm · n PA có kết quả" ở `/phan-tich?goc=hieu-qua-pa&gv=…` (Q20);
  - **phủ định**: QL CP gọi `/phan-tich/giao-vien/cham-diem?cn=<CP>&gv=<id GV MB>` → **404**, không có tên;
  - N+1: thêm **2 lớp có em + lượt có điểm** (không phải lớp rỗng) → số câu không tăng theo số lớp/bài;
  - `queryPlans` với 1 000 `sids` → không lỗi tham số (đếm câu ≥ 3 lô);
  - hàng con khối quy chế: thứ tự theo khoá `INTERVENTION_KIND_LABEL`, **không** đổi khi đổi bộ lọc;
  - ngày "sửa dd/mm": bản ghi nhật ký `created_at = …T20:00:00Z` (03:00 giờ VN hôm sau) → hiện **ngày VN**.
- [ ] `napBai`: một câu theo lô lấy ghi danh `(student_id, class_id, started_at, ended_at)` của các em → `lopLucThi(sid, tuan)`; `nguoiLuc` dùng lớp đó (rơi về `a.class_id` khi không có ghi danh khớp). Phạm vi chi nhánh vẫn theo `c.lop` (lớp lúc thi phải thuộc `c.lop`).
- [ ] `hieuQuaPa.ts`: tóm tắt phần GV thêm đếm **mọi** `gvThem`; bảng con thêm hàng mờ "Case chưa phân loại lỗi" (Q20). `con.sort` quy chế theo thứ tự cố định. `ponytail:` + câu "Cách đọc" cho mức SOS hiện tại (Q22).
- [ ] Panel: `gv` không có trong `c.pc` → `notFound('Giáo viên không có lớp ở chi nhánh này')`. Ngày sửa: đổi `created_at` sang giờ VN (+7) trước khi cắt ngày (`ponytail:` ghi trần).
- [ ] `queryPlans`: `IN (…)` qua `theoLo`.
- [ ] `npm run check` → commit `PR-S6F (4): Phân tích GV — người dạy lúc thi, PA hiệu quả khớp Hiệu quả PA, chặn dò tên`.

## Task 5 · Phân tích — chữ và link (D8) — impeccable `clarify`  ·  [S6F-b]

**Files:** `shared/domain/phanTich.ts:23, :62-64, :469` · `web/src/modules/phanTich/TongHopTestSos.tsx:131` · `web/src/modules/phanTich/PhanTichGiaoVien.tsx:345-349` ·
`web/src/modules/giaoVien/HoSoGiaoVienPage.tsx:100-101, :168`.
**Nguồn:** Pb2-a P2 "Excel ghi SOS ở Lớp thường" + chuyển planning (nhãn tab) · Pb2-b P2 "link P6 thiếu `ct`" (= Pb2-a chuyển Pb2-b) · Pb2-b P2 "chip Bàn giao thiếu `mon`", "rời góc GV mang `tu`/`den`/`thang`", "panel Chấm điểm ngày 14 px".

- [ ] **Phép kiểm trước** (phải đỏ):
  - `nhanGocNhin('tong-hop', 'thuong')` = "Tổng hợp Test"; FT giữ "Tổng hợp Test + SOS"; dòng 1 Excel khung thường không chứa "SOS"; tên file `tong-hop-test-*.xlsx` khi thường;
  - `thamSoXoaKhiDoiGoc` khi rời `giao-vien` xoá `tu`, `den`, `thang`;
  - link P6 hồ sơ GV chỉ dạy lớp thường có `ct=thuong`; chip Bàn giao GVBM có `&mon=`;
  - quét chuỗi: hai ô ngày panel Chấm điểm có `text-xs`.
- [ ] Sửa theo phép kiểm. Nhãn tab đọc theo khung (`GOC_NHIN_LABEL` thành hàm nhận `ct`, hoặc một nhánh nhỏ cho `tong-hop`). **clarify**: chữ tab, tiêu đề Excel.
- [ ] `npm run check` → commit `PR-S6F (5): Phân tích — lớp thường không chữ SOS; link mang đúng khung, môn, khoảng`.

## Task 6 · Tạm dừng nhất quán (D17) — impeccable `polish`  ·  [S6F-b]

**Files:** `shared/domain/hienThiNgay.ts:36-60` · `server/src/students/profile.ts:470-480` · `server/src/classes/luatLoTrinh.ts:355-368` (`xemChuyenLop`) · `server/src/classes/transition.ts:172-185` ·
`server/src/students/students.ts:252-262` · `web/src/modules/students/NganCase.tsx:164-168` · `web/src/modules/cases/SkillBoard.tsx:416, :553-554` · `web/src/modules/cases/CasePanel.tsx` (`TheKhoiPa`) ·
`web/src/modules/students/ChuyenLopPanel.tsx`, `web/src/modules/classes/TransitionPanel.tsx` (dòng tuần học).
**Nguồn:** VAI-b P1 "Hành trình em Tạm dừng" (phần ba nơi) = UXF-a P2 "hai màn hai kết quả" · VAI-b P1 "Ngăn Case ghi Quá hạn khi Tạm dừng" ·
VAI-b P2 "hạn chưa quá vẫn hiện", "đầu hồ sơ dừng tuần đầu mất dòng", "`khoangTamDung` ghép cặp khi ngày Tạm dừng lùi".

```ts
/** Q17 (D17): tuần học FT của em tại `ngay`. Trong khoảng dừng → tuần học cuối TRƯỚC tuần dừng + dangDung. Dừng ngay tuần đầu → { tuan: null, dangDung: true }. */
export function tuanHocTai(batDau: string, ngay: string, dung: readonly { tu: string; den: string | null }[]): { tuan: number | null; dangDung: boolean } | null;
export const chuTuanHoc = (tuan: number | null, tong: number | null, dangDung = false): string => …;   // "tuần học thứ 14 · đang dừng" · "đang dừng"
```
- [ ] **Phép kiểm trước** (phải đỏ) — em FT bắt đầu 15 tuần trước, Tạm dừng hôm qua (đang dừng):
  - đầu hồ sơ, `xemChuyenLop(...).hienTai.tuanHoc`, `transitionPlan(...).students[].tuanHoc` **cùng** `{ tuan: 14, dangDung: true }`; chữ ba nơi = "tuần học thứ 14 · đang dừng";
  - dừng ngay tuần đầu → ba nơi "đang dừng" (không mất dòng);
  - em không dừng → như cũ (khoá các phép kiểm UXF-a (4), VAI-b Task 1);
  - Ngăn Case: Case `qua-han` của em đang dừng → `ngCanh` là nhãn Tạm dừng, không "Quá hạn" (phép kiểm chuỗi / dữ liệu `tamDungTu`);
  - bảng kỹ năng: PA `action_due` **ngày mai** của em đang dừng → hàng PA không còn hạn, hiện "Tạm dừng từ dd/mm" (giống `DongHan`);
  - `setStudentStatus('inactive', 05/09)` sau lần Quay lại 07/09 → **400** "Ngày tạm dừng không được trước lần quay lại học gần nhất (07/09)".
- [ ] `hienThiNgay.ts`: thêm `tuanHocTai` (dựa trên `tuanHocFt`); `chuTuanHoc` nhận `dangDung`. Ba nơi máy chủ gọi `tuanHocTai(batDau, homNay, dung)`; trả `{ tuan, tong: null, dangDung }`.
- [ ] Web: ba nơi hiện chữ qua `chuTuanHoc(…, dangDung)`.
- [ ] `NganCase`, `SkillBoard` `HangCase`/`HangPA`, `CasePanel` `TheKhoiPa`: có `tamDungTu` → mọi hạn thay bằng `<NhanTamDung>` (như `DongHan`).
- [ ] `students.ts`: chặn ngày Tạm dừng < MAX(ngày `resume`) (cùng kiểu chặn ngày Quay lại ở `:259-261`).
- [ ] **polish** (sáng + tối): dòng tuần học ba nơi, nhãn Tạm dừng ở Ngăn Case.
- [ ] `npm run check` → commit `PR-S6F (6): Tạm dừng — một hàm tuần học "đang dừng" cho ba nơi; mọi hạn dừng`.

## Task 7 · Hành trình — chương đang dừng, khoảng tuần, mốc điểm — impeccable `polish`  ·  [S6F-b]

**Files:** `server/src/students/hanhTrinh.ts:56, :76, :295-310` · `shared/domain/hanhTrinh.ts:266-270, :583-591` · `web/src/modules/students/ChuongLop.tsx:57-58, :86-96, :217` ·
`web/src/modules/students/HanhTrinh.tsx:228-233, :275-283` (`duongMoc`).
**Nguồn:** VAI-b P1 "Hành trình: chương em Tạm dừng" (phần chương) · VAI-b P2 "dừng và quay lại cùng tuần vẫn vẽ sọc", "mốc điểm lớp thường mở `/mock-test/`", "> 4 chương không cuộn tới chương đang học", "`programmeCodeOfCycle` N+1".

- [ ] **Phép kiểm trước** (phải đỏ):
  - em FT ghi danh `paused` (em `inactive`, `ended_at` trống): chương có `dangHoc = true` (hoặc cờ `dangDung`), **không** chân "Bảo lưu", `tuanHoc` = `tuanHocTai` (= đầu hồ sơ);
  - chương cũ có `ended_at − 1` rơi vào tuần dừng → `den` = tuần học cuối trước tuần dừng (không `null`);
  - `chuKhoangDung` / dải sọc: dừng T2 20/07, quay lại CN 26/07 → **không** có khoảng vẽ;
  - `DiemMoc` mang `kind` + `classId` từ máy chủ; mốc lượt lớp thường chưa xếp tuần → đường `/bang-diem-thuong/…`;
  - số câu `hanhTrinhHocVien` không tăng theo số lộ trình thiếu `programme_code` (dựng 3 lộ trình cũ NULL).
- [ ] Máy chủ: `dangHoc = e.status === 'active' || (e.status === 'paused' && !e.ended_at && emInactive)`; `tu`/`den` qua `tuanHocTai`; `programme_code` lấy từ câu lượt đã nạp (`class_programme` theo `cycle_id`).
- [ ] Web: bỏ khoảng có `mondayOf(tu) === mondayOf(den)`; `duongMoc` đọc `kind`/`classId` của mốc; khung chương `scrollLeft = scrollWidth` khi gắn (như trục).
- [ ] **polish** (sáng + tối) chương đang dừng ở 1440 và 375.
- [ ] `tocDoDuong`: `/students/{hv}/hanh-trinh` đo lại.
- [ ] `npm run check` → commit `PR-S6F (7): Hành trình — chương đang dừng vẫn đang học; khoảng tuần đúng; mốc điểm lớp thường`.

## Task 8 · Hồ sơ HV — mọi việc của em (D5) — impeccable `clarify`  ·  [S6F-b]

**Files:** `server/src/students/viecHocVien.ts:61-135` · `server/src/students/profile.ts:417, :471, :631` · `web/src/modules/students/StudentDetailPage.tsx:254` ·
`web/src/modules/students/StudentPlanPanel.tsx:202` · `web/src/modules/students/IntakePanel.tsx:228` · `web/src/modules/students/DauHoSo.tsx:299` · `web/src/modules/cases/SkillBoard.tsx:490, :518`.
**Nguồn:** VAI-b P1 "thiếu việc Đề ra PA" · VAI-b P2 "việc Ý thức thiếu hai loại", "người làm Mini Test lệch", "liên kết kỹ năng dưới kỳ vọng sai lượt", "còn tự ghép `/mock-test/`", "dải chờ duyệt thiếu `onThemPa`", "lặp chữ 'chưa có lịch'" · tích hợp P2 "hai tuần Cuối khoá trên cùng màn".

- [ ] **Phép kiểm trước** (phải đỏ):
  - **hai đường** (Q5): với 4 em demo (FT có Case chưa PA quá hạn; em có 2 vi phạm mới; em có xử lý đã duyệt chờ thực hiện; em KCK có Case tay) và mỗi vai (GVCN, người phụ trách Case, QL):
    tập `key` việc ở `viecCuaHocVien(...).cuaBan` = tập `key` `/my-work` lọc `studentId` của em (gồm `support:`, `yt_xem:`, `yt_thuc_hien:`, `minitest:`) và **cùng người làm**;
  - câu tóm tắt nêu "Đề ra PA … quá hạn" (Q31-8);
  - nhóm PA có người dạy không tài khoản đứng đầu + người có tài khoản sau → người làm Mini Test **trùng** `mywork.ts:847`;
  - `ketQuaGanNhat.duoi[]` mang `attemptId` của chính hàng kỹ năng (`bandAttemptId`);
  - quét chuỗi: hồ sơ HV không còn tự ghép `` `/mock-test/${`` (đi qua `duongDotTest`, dùng `Link`);
  - hồ sơ HV lớp thường có bài Cuối khoá đã xếp lịch: tuần "Cuối khoá" ở đầu hồ sơ = tuần ô Sắp tới;
  - dòng phụ hàng PA không lặp "chưa có lịch".
- [ ] `viecHocVien.ts`: thêm `de-ra-pa` (`support:{caseId}`, người làm `c.ownerId`, hạn `v.han`; vào `VIEC_HOC_THUAT` của `cauTomTat`), `yt-xem`, `yt-thuc-hien` (đọc `n.yThuc` — `soMoi`/`hanXem`, `daDuyet[]`), Mini Test lấy `performer_user_id` đầu tiên khác null như `myWork`. **clarify** chữ ba loại việc mới (giữ đúng tiêu đề `myWork`).
- [ ] `profile.ts`: `duoi` mang `attemptId`; `thiDuKien` lớp thường ưu tiên tuần bài Cuối khoá (cùng nguồn `mocKeTiep`), rơi về `tuanKetThuc` khi chưa có bài.
- [ ] Web: `kyNangHref` dùng `attemptId` của hàng; `StudentPlanPanel`/`IntakePanel` → `duongDotTest` + `Link`; `DauHoSo` truyền `onThemPa`; bỏ span `chuaLich` thừa.
- [ ] `tocDoDuong`: `/students/1` đo lại — giữ ≤ 100 bằng cách bù câu (Global Constraints).
- [ ] `npm run check` → commit `PR-S6F (8): hồ sơ HV — đủ việc như Công việc (Đề ra PA, Ý thức), liên kết đúng lượt`.

## Task 9 · Tổng quan / Công việc — số và link (D7, D10, D13) — impeccable `clarify`  ·  [S6F-b]

**Files:** `server/src/worklist/tongQuan.ts:79, :103, :113, :120-138` + `tinhLopToiDay`, `oLopToiDay` (cùng file) ·
`web/src/modules/worklist/LopToiDay.tsx` · `web/src/modules/worklist/ViecCuaToi.tsx:78, :111` · `web/src/modules/worklist/OverviewPage.tsx:43` · `web/src/ui/CongTacKhung.tsx:11-19` ·
`web/src/lib/session.tsx` · `shared/domain/congViec.ts:104-115` · `web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx:29` · `server/src/worklist/metrics.ts:300-318` (`tuanTre`).
**Nguồn:** tích hợp P1 "Bài chờ chấm đếm HV" = VAI-a P2 · VAI-a P1 "link không gửi `khung=tat-ca`" · VAI-a P1 "khung nhớ chung khoá" · VAI-a P1 "Q6 thiếu vế m" = tích hợp P1 ·
tích hợp P1 "lệnh chuyển lớp hạn đã qua vẫn Cần làm" = VAI-a P2 · UXF-a P2 "bảng GV giấu hàng Chưa phân công", "ghi bù đúng Thứ Hai".

- [ ] **Phép kiểm trước** (phải đỏ):
  - (D10) GV Trần Ngọc Hà, MB FT 101: ô "Bài quá hạn" của Lớp tôi dạy = số dòng `oLopToiDay(cot='bai-qua-han')` = số dòng `oHoSoGv(7,'qua-han')` lọc lớp 101 (đơn vị **bài**, `baiId`); "Bài chờ chấm" tương tự với `chua-nhap`;
  - (D13) `ViecCuaToi` link "Xem hết" có `khung=tat-ca`; `den` của dòng bài/PA ở `tongQuanQuanLy` có `khung=tat-ca`; GV có việc hai khung, đã nhớ `ft` ở Công việc → số chip "Đến hết tuần" khi mở = `soXemHet`;
  - (D7) khoá nhớ khung có `.u{userId}`: QL ghi `thuong` không đổi khung GV trên cùng máy; GV chỉ dạy FT, khoá của chính GV ghi `thuong` → Lớp tôi dạy vẫn hiện FT (rơi về `khungMacDinhGv`);
  - (Q6) lớp thiếu GV môn W có 3 bài quá hạn → dòng "lớp thiếu GV môn" có `kem` "3 bài chưa có người chấm" = cột Bài quá hạn hàng "Chưa phân công" của bảng GV; chú thích `ponytail:` cũ bị xoá;
  - dòng `hv-chua-co-lenh-chuyen` với lớp kết thúc W3 AUG, hôm nay W3 SEP → `trangThai: 'qua-han'`, chữ "quá hạn từ W4 AUG";
  - bảng GV chi nhánh: `hang = []`, `chuaPhanCong.quaHan = 2` → không phải Empty; Σ = ô;
  - ghi bù đúng Thứ Hai: PA hạn 24/08, ghi 07/09 → 3 nghĩa vụ (2 trễ, 1 đúng) = "ghi bù 3 tuần" (Q21).
- [ ] Máy chủ: `tinhLopToiDay` thêm `baiCho`, `baiQuaHan` mỗi lớp từ **một** `listAttempts(p, { classIds, chiDangHoc: true })` (`myPendingDetail`, cờ `overdue`), khoá `baiId`; `oLopToiDay` nhận `cot=bai-cho|bai-qua-han` trả dòng từ cùng tập. Xoá `baiChoChamTheoLop` (shared) — không còn ai gọi.
- [ ] `tongQuan.ts`: `sapCanXuLy` nhận `'hv-chua-co-lenh-chuyen': !!ketThuc && addDays(ketThuc, 7) <= today`; vế `m` từ `sets.get('bai-qua-han-nhap-diem')` (hoặc `metricSet` cùng `base`) — số ô `chiTiet` không có người; `den` thêm `&khung=tat-ca`.
- [ ] Web: `LopToiDay` bỏ `useApi('/my-work')`, cột bài dùng `SoLieuO` như ba cột kia; `ViecCuaToi` hai link thêm `khung=tat-ca`; `CongTacKhung` khoá theo người (biến module đặt từ `SessionProvider`, Q7); `LopToiDay` khung đã nhớ có 0 lớp → `khungMacDinhGv`. `BangGiaoVienChiNhanh` chỉ Empty khi không hàng **và** không `chuaPhanCong`.
- [ ] `metrics.ts` `tuanTre`: tuần k có `due + 7k >= ghi` → đúng hạn (Q21); sửa kỳ vọng phép kiểm cũ (PR-N N1, UXF-a (8)) nếu đổi, không xoá.
- [ ] **clarify**: nhãn "bài chờ chấm / bài quá hạn", chữ "quá hạn từ {tuần}".
- [ ] `tocDoDuong`: `/tong-quan/lop-toi-day`, `/tong-quan/lop-toi-day/o?cot=bai-qua-han` (thêm), `/tong-quan/quan-ly` đo lại.
- [ ] `npm run check` → commit `PR-S6F (9): Tổng quan — bài chờ chấm đếm bài, link mở đúng khung, khung nhớ theo người, Q6 vế m`.

## Task 10 · Chuông + Phối hợp SOS (D11, D12)  ·  [S6F-a]

**Files:** `server/src/yThuc/phoiHop.ts:287-325` · `shared/domain/duongHoSo.ts:116-123` · `server/src/platform/thongBao.ts:30-36` · `server/src/cases/sosState.ts:131-147` (chỉ đọc) ·
`web/src/modules/platform/Header.tsx` (nút "Đọc hết") · `server/src/tests/tocDoDuong.ts` · `server/src/tests/prVaiA.tests.ts:538`.
**Nguồn:** VAI-a P1 "Phối hợp SOS đếm lượt lớp thường" · VAI-a P1 "`bao_len` rơi vào Để biết" · VAI-a P2 "`duyet_tu_choi` ở lại Cần làm", "Case chờ nguyên nhân thiếu vế Không cần theo dõi", "Đọc hết không try/catch" · tích hợp P2 "`POST /notifications/doc-het` không có trần".

- [ ] **Phép kiểm trước** (phải đỏ):
  - GVCN MB FOU 12 có `bao_ph_tvv` `pending` của lượt Giữa khoá → `/my-work` **không** có `phoi_hop_sos`; lượt Mock FT chưa xong → vẫn có (số = tab Phối hợp lớp FT — phép kiểm sosV3 PR-K, VAI-a (6c) còn xanh);
  - thông báo `bao_len` thẻ đang `cho` → `nhomThongBao` = `can-lam`; thẻ đã xử lý → `de-biet`;
  - `duyet_tu_choi`: thẻ `tu_choi` → Cần làm; đã sửa gửi lại / đóng → Để biết;
  - Case SOS đã gửi thẻ "Không cần theo dõi" (đang chờ QL) → thông báo `sos` của GVBM `con_viec = 0`;
  - danh sách kiểm `prVaiA.tests.ts:538` thêm `bao_len`;
  - `POST /notifications/doc-het` đúng **1** câu ghi (trần trong `tocDoDuong` hoặc `demTruyVan === 1`).
- [ ] `myCoordinationLines`: thêm `AND COALESCE(a.kind, 'mock') = 'mock'` vào JOIN lượt (Q11).
- [ ] `LOAI_CAN_LAM` thêm `bao_len`; `con_viec`: `yeu_cau_duyet` gồm `bao_len` (`trang_thai = 'cho'`) và `duyet_tu_choi` (`trang_thai = 'tu_choi'`); nhánh `sos` dùng chung đoạn `LA_CASE_SOS('sc')` + `NOT CO_THE_KHONG_THEO_DOI('sc')` (đã export ở `sosState.ts:32, :83`).
- [ ] `Header.tsx`: "Đọc hết" bọc try/catch → toast lỗi.
- [ ] `npm run check` → commit `PR-S6F (10): chuông — Báo lên ở Cần làm; Phối hợp SOS chỉ lượt Mock FT`.

## Task 11 · Lớp — chuyển lớp + phân công FOU (D1, D3)  ·  [S6F-a]

**Files:** `server/src/classes/luatLoTrinh.ts:206-326` (`apDungMotDong`) · `server/src/yThuc/trangThai.ts:215` (chỉ gọi) · `server/src/classes/lenhChuyen.ts:101, :565` ·
`server/src/normal/cuoiKhoa.ts:116-118` · `server/src/routes/index.ts:1852-1858` · `shared/domain/phanCong.ts:57-61` (`nenTachFou`) · `web/src/modules/classes/TeacherAssignPanel.tsx:56-59` ·
`web/src/modules/classes/ClassCreatePanel.tsx:256`.
**Nguồn:** Pb2-b P2 "`han_xu_ly` không chốt lại khi chuyển lớp" + câu hỏi planning (1) · Pb2-b P1 "lưu Sửa phân công FOU âm thầm gán G+V" + câu hỏi (3) ·
UXF-a P2 "giữa khoá không tính `khac_goi_y`", "`raLenh` đưa `IN` không chia lô" · tích hợp P2 "gợi ý phân công FOU ghi W1, S".

- [ ] **Phép kiểm trước** (phải đỏ):
  - (D1) em có 3 vi phạm bắt buộc chưa phản hồi; thi hành lệnh chuyển lớp (một em **và** cả lớp) → `violations.han_xu_ly` = hạn `trangThaiYThuc` sau chuyển (màn Ý thức); vi phạm đã phản hồi giữ nguyên;
  - (D3) lớp FOU L = R = người 7, G+V **trống**: mở panel → chế độ **tách**; chỉ đổi GVCN rồi Lưu → **không** có dòng `writing` mới cho người 7; L, R, G+V cùng người 7 → mở gộp như cũ; cả ba trống → gộp, chọn một người → ba môn (người dùng chủ động chọn);
  - `nenTachFou` hàm thuần: {L:7,R:7} → `true`; {L:7,R:7,W:7} → `false`; {} → `false`; {L:7,R:8,W:7} → `true`;
  - (Q23) em lớp thường đã hết khoá, Web gợi ý "Học lại", panel một em chọn lớp FT (`giua-khoa`), lý do trống → `failed` "Ghi lý do ngắn"; có lý do → `khac_goi_y = 1`;
  - `raLenh` với 1 000 `dongs` (đa số không thuộc lớp) → báo "Học viên không thuộc lớp này", không lỗi tham số;
  - gợi ý ứng viên ô P lớp FOU ghi "dạy được P", ô gộp ghi "L, R, G+V" (không W1, S).
- [ ] `apDungMotDong`: sau khi đổi lớp, trong cùng `tx`, `chotHanXuLy([d.sid], { ghiDe: true })`.
- [ ] `nenTachFou`: thêm "có môn gộp đã có người **và** có môn gộp trống → tách". `TeacherAssignPanel` không đổi khác.
- [ ] `lenhChuyen.ts`: tính `ck` khi lớp nguồn là lớp thường và `mocKetKhoa(...).tuCuoiKhoa` (không chỉ `boiCanh === 'cuoi-khoa'`); truyền `dongs.filter(d => hopLe.has(d.studentId))` trước khi gọi `cuoiKhoaTheoHocVien`.
- [ ] `ClassCreatePanel.tsx:256`: tên kỹ năng qua `tenMonNgan(ct, …)`.
- [ ] `npm run check` → commit `PR-S6F (11): chuyển lớp chốt lại hạn xử lý vi phạm; phân công FOU không tự gán G+V trống`.

## Task 12 · Tốc độ — trang đầu, tín hiệu, route chết (D14, D16, D4)  ·  [S6F-b]

**Files:** `web/src/lib/useApi.ts` · `web/src/App.tsx:81-82` · `web/src/modules/worklist/KhoiCanXuLy.tsx:27, :112` (`DaiChoDuyet`) · `server/src/routes/index.ts:405-408, :1591` ·
`server/src/worklist/signals.ts:76-81` · `server/src/cases/cases.ts:2091` (`caseQueueCounts`) · `server/src/tests/tocDoDuong.ts` · `server/src/tests/tocDo.run.ts`.
**Nguồn:** VAI-a P1 "trang đầu gọi lặp route nặng" · VAI-a P2 "`DaiChoDuyet` nuốt lỗi" · UXF-a P1 "tín hiệu Báo cáo đơn vị N+1, không trần" · UXF-a P2 "roster lớp thường không có trần" ·
Pb2-a P2 "hai route Danh sách Case còn sót" (một phần) · Pb2-b P2 / câu hỏi (4) "nới phép kiểm `tongHop`, trần 91 → 94".

- [ ] **Phép kiểm trước** (phải đỏ):
  - **tải trang đầu** (mới, `tocDo.run.ts`): danh sách GET mà Tổng quan GV / QL gọi khi mở (lấy từ một lần chạy Playwright, ghi vào phép kiểm) — **mỗi đường một lần**, tổng số câu SQL ≤ trần mới `TRAN['GV trang Tổng quan']`, `TRAN['QL trang Tổng quan']`. Trên `main` GV gọi `/my-work` 3 lần, QL `/tong-quan/quan-ly` 2 lần → đỏ;
  - `/signals` QL và QT có trong `DUONG_DO` + `TRAN`; số câu không tăng theo số chi nhánh (dựng thêm 2 chi nhánh trống có lớp);
  - `GVCN_THUONG /classes/6/roster` và `QL /classes/6/roster` có trần;
  - `GET /cases/queues` → 404; `GET /cases?studentId=` vẫn chạy.
- [ ] `useApi`: Map module `dangBay: Map<path, Promise>` — GET cùng đường dẫn đang chờ thì dùng chung promise (xoá khỏi map khi xong). Không cache sau khi xong (vẫn tải lại khi `invalidate`).
- [ ] `App.tsx`: badge GV đọc `useApi('/my-work').data?.summary.overdue` (gộp với `ViecCuaToi` ở Tổng quan). Xoá `GET /my-work/dem` + trần của nó nếu không còn ai gọi.
- [ ] `KhoiCanXuLy`: `DaiChoDuyet` hiện lỗi (ErrorState gọn) thay vì biến mất.
- [ ] `signals.ts` `tuSo`: gọi `metricSet(p, id)` **một lần** (không `branchId`), chia `ids` theo chi nhánh bằng `lopCuaTap(unit, ids)`.
- [ ] Xoá `GET /cases/queues`, `caseQueueCounts` (nếu chỉ route này gọi), dòng `tocDoDuong.ts:180, :502-504` (Q16).
- [ ] Ghi Q4 vào Nhật ký + thân PR (không đổi mã: trần 94 đã có ở `tocDoDuong.ts:652`).
- [ ] `npm run check` → commit `PR-S6F (12): Tổng quan không gọi lặp; đo cả lần tải trang; tín hiệu một lượt; bỏ /cases/queues`.

## Task 13 · Chữ, 12 px, sắp lớp, "ca tối" (D9, D15) — impeccable `clarify` + `polish`  ·  [S6F-b]

**Files:** `web/src/ui/Han.tsx:52` · `web/src/modules/worklist/WorkList.tsx:62` · `web/src/ui/SoLieu.tsx:131-137` · `web/src/modules/platform/WelcomePage.tsx:313` ·
`server/src/seed/seed.ts:345`, `ctSeed.ts:109`, `yThucSeed.ts:210` · `web/src/modules/dev/ThanhPhanDemo.tsx:107` · `server/src/giaoVien/hoSo.ts:91` · `server/src/worklist/mywork.ts:927` ·
`web/src/modules/students/ChuongLop.tsx:141` · `shared/domain/hanhTrinh.ts:585` · `web/src/modules/students/HanhTrinh.tsx` (`ChuGiai`) · `shared/domain/hoSoHocVien.ts` (`oSapToi`).
**Nguồn:** VAI-b P2 "hạn hàng Case 11 px" · VAI-a P2 "người phụ trách dòng phụ 11 px", "Cách tính mở rồi tự đóng" · tích hợp P2 "còn chữ ca tối" · UXF-a P2 "Lớp đang dạy sắp theo chữ" + chuyển (`mywork.ts:927`) · VAI-b P2 "chữ lệch mockup".

- [ ] **Phép kiểm trước** (phải đỏ):
  - quét chuỗi: `Han.tsx` không còn `text-[11px]`; `WorkList.tsx` phần người (`it.owner` / "chưa ai phụ trách") ở `span text-xs`;
  - quét chuỗi: `web/src`, `server/src/seed`, `shared` không còn "ca tối", "buổi tối" (trừ `tests/` — lý do tự do của phụ huynh trong phép kiểm giữ); seed đổi chữ thì sửa kỳ vọng phép kiểm đọc chữ đó;
  - `hoSoGv(...).lop` và nhóm việc `mywork` sắp theo `soSanhLop` ("MB FT 9" trước "MB FT 10");
  - `SoLieu` "Cách tính": `onClick` chỉ mở (`setHowTo(true)`), đóng bằng Esc / blur / rời chuột (quét chuỗi `setHowTo(!howTo)` không còn);
  - chữ: ghim chương lớp thường "Giữa khoá · 3/4 môn"; chân "Lên FT + bổ trợ S" khi có bổ trợ; chú giải mục 8 "dự kiến"; ô Sắp tới em Tạm dừng "giữ lịch · Quản lý dời nếu cần" (mockup 24 D1, 26).
- [ ] Sửa theo phép kiểm. `WelcomePage` placeholder → "Ví dụ: rảnh thứ 3, 5, 7".
- [ ] **clarify** chữ mới; **polish** (sáng + tối) các màn có `<Han>` (Tổng quan, Công việc, bảng kỹ năng, Ngăn Case) — kiểm không tràn dòng sau khi 12 px.
- [ ] `npm run check` → commit `PR-S6F (13): hạn và người 12 px; sắp lớp soSanhLop; bỏ chữ ca tối; chữ theo mockup`.

## Task 14 · Bấm thử theo vai, 1440 + 375, sáng/tối — impeccable `audit` + `polish`, `/ponytail-review`, mở PR

- [ ] `git fetch origin && git merge origin/main` (nếu có gì mới) → `npm run check`.
- [ ] Chạy bảng **KIỂM** theo vai QL (Nguyễn Khánh Vy id 2), GVCN FT (7), GVCN lớp thường, GVBM (9), Quản trị (1). Dựng em Tạm dừng qua API như người rà tích hợp (seed không có). Ảnh `thiet-ke/anh/pr-s6f/{muc}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] Ghi danh sách GET của Tổng quan GV/QL từ log mạng Playwright → khớp phép kiểm "tải trang đầu" (Task 12). Mỗi đường **một** lần.
- [ ] impeccable **`audit`** trên các màn đã chạm, rồi **`polish`** (sáng **và** tối): 12 px, mã tuần, không tràn ngang 375, đơn vị ở mọi số.
- [ ] `/ponytail-review`; liệt kê mọi `ponytail:` mới trong thân PR.
- [ ] Quét: không còn `npm run check` treo; tắt 4187/5387; dọn Vite tạm.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - bảng mục rà (nguồn → Task → phép kiểm → ảnh);
  - mốc B → số phép kiểm cuối; trần tốc độ đổi (kể cả **Q4: chấp nhận nới `tongHop` N+1 và trần `congViec30PaChuaNgayThi` 91 → 94**);
  - "Đã loại" và "Chuyển cho PR khác" (bảng dưới);
  - `ponytail:`.

## Câu hỏi cho chủ sản phẩm — ĐÃ CHỐT 01/10

> **Câu 1 = B** (chủ sản phẩm): hai PR song song **PR-S6F-a** (Task 0, 1, 2, 3, 4, 10, 11, 14) và **PR-S6F-b** (Task 0, 5, 6, 7, 8, 9, 12, 13, 14), theo hợp đồng file dưới. Nhánh `pr-s6f-a-may-chu-du-lieu` / `pr-s6f-b-giao-dien-toc-do`; worktree cùng tên trong `.claude/worktrees/`; phép kiểm `prS6fA.tests.ts` / `prS6fB.tests.ts`; commit `PR-S6F-a (n): …` / `PR-S6F-b (n): …`. Không thứ tự merge bắt buộc; PR merge sau làm cổng gộp. **Câu 2 = A, Câu 3 = A** (planning).

- **Câu 1 — Một PR hay hai PR song song?** Kế hoạch có **15 Task** (0–14), vượt ngưỡng ~14. Mỗi lần `npm run check` ~13 phút → một PR chạy nối tiếp khoảng 3–4 giờ chỉ riêng phép kiểm.
  - A. **Một PR-S6F** (như kế hoạch). Ít rủi ro gộp, một lượt rà; chậm hơn.
  - B. **Hai PR song song** theo nhãn ở tiêu đề Task: **PR-S6F-a** (máy chủ / dữ liệu đúng: Task 1, 2, 3, 4, 10, 11) và **PR-S6F-b** (giao diện / chữ / tốc độ trang: Task 5, 6, 7, 8, 9, 12, 13). Mỗi PR có Task 0 và Task 14 riêng. Hợp đồng file:
    - S6F-a **sở hữu**: `attempts.ts`, `regular.ts`, `pb2bSeed.ts`, `scoreDebt.ts`, `classes.ts`, `canCham.ts`, `phanTich/giaoVien.ts`, `hieuQuaPa.ts`, `effectiveness.ts`, `week.ts`, `mywork.ts` (gồm sắp lớp `:927` — chuyển từ Task 13), `hocVienLop.ts` (`viecTiepCuaEm`), `dongHocVien.ts`, `phoiHop.ts`, `thongBao.ts`, `duongHoSo.ts`, `sosState.ts`, `Header.tsx`, `lenhChuyen.ts`, `normal/cuoiKhoa.ts`, `phanCong.ts`, `TeacherAssignPanel.tsx`, `ClassCreatePanel.tsx`, `students/tamDung.ts` (export `HV_DANG_HOC_SQL` — S6F-b chỉ đọc), `signals.ts` (chỉ dòng SQL "đang học" — phần `tuSo` thuộc S6F-b).
    - S6F-b **sở hữu**: `hienThiNgay.ts`, `profile.ts`, `hanhTrinh.ts` (server + shared + web), `transition.ts`, `students.ts`, `viecHocVien.ts`, `NganCase.tsx`, `SkillBoard.tsx`, `CasePanel.tsx`, `tongQuan.ts`, Lớp tôi dạy (server + web), `metrics.ts`, `CongTacKhung.tsx`, `session.tsx`, `congViec.ts`, `useApi.ts`, `App.tsx`, `KhoiCanXuLy.tsx`, `ViecCuaToi.tsx`, phần web Phân tích, `HoSoGiaoVienPage.tsx`, `hoSo.ts`, `Han.tsx`, `WorkList.tsx`, `SoLieu.tsx`, `WelcomePage.tsx`, seed chữ, `routes/index.ts` (xoá route — S6F-a chỉ **thêm** nếu cần).
    - **Chồng có kiểm soát:** `luatLoTrinh.ts` — S6F-a chỉ `apDungMotDong`, S6F-b chỉ `xemChuyenLop`. `signals.ts` — như trên. `tests/run.ts`, `tocDoDuong.ts`, `CODE_MAP.md` — chỉ **thêm dòng**; tệp phép kiểm riêng `prS6fA.tests.ts` / `prS6fB.tests.ts`.
    - Phụ thuộc: Task 9 (S6F-b) dùng cờ `overdue` đã có trong `myPendingDetail` — **không** chờ Task 3. PR merge sau làm cổng gộp.
    - Cổng 4187/5387 cho S6F-a, **4197/5397** cho S6F-b; log `check-s6f-a.log` / `check-s6f-b.log`. Hai phiên chạy check cùng lúc có thể sập Node (memory) → chạy lại một lần.
  - **Khuyên B** — nhanh gấp đôi trước deploy, hai phần ít chồng file; nếu chủ sản phẩm muốn ít PR thì A vẫn chạy được nguyên kế hoạch này.
- **Câu 2 — Thân thông báo "Case mới sau MT2"** hiện là "Case mới sau MT2: {tên Case} · hạn dd/mm", mockup D có thêm "Reading 5.0, kỳ vọng 6.0" (Nhật ký VAI-a đã ghi lý do bỏ).
  - A. Chấp nhận như hiện tại; mẫu tiêu đề thông báo chốt ở **PR-S3**.
  - B. Thêm điểm + kỳ vọng ngay trong PR-S6F.
  - **Khuyên A** (kế hoạch theo A).
- **Câu 3 — Hiệu quả PA theo quy chế** đang xếp PA theo **mức SOS hiện tại** của Case (Case trượt lại thì PA cũ dời sang hàng mức mới).
  - A. Giữ, ghi rõ ở "Cách đọc" (Q22, rẻ).
  - B. Ghi mức SOS vào PA lúc sinh, xếp theo mức lúc chạy (thêm cột, làm ở PR-Dọn).
  - **Khuyên A** (kế hoạch theo A).

## Đã loại (không sửa)

| Phát hiện | Lý do |
|---|---|
| Pb2-a P2 "hai route `GET /cases`, `GET /cases/queues` web không còn gọi" — **phần `GET /cases`** | Sai một nửa: `web/src/modules/students/StudentManagePanel.tsx:182` còn gọi `/cases?studentId=…&status=open`; `tocDo.run.ts:422, 520, 532` cũng dùng. Chỉ xoá `/cases/queues` (Q16) |
| tích hợp ghi chú "StrictMode gọi đôi mọi GET" | Chỉ ở dev, không phải lỗi (gộp GET đang bay ở Task 12 cũng che luôn) |
| VAI-a P2 lặt vặt "Q19 không migrate dòng thông báo cũ" | DB reset trước bản chính; chỉ ảnh hưởng bản nháp — không làm gì |
| Pb2-b P2 "nới phép kiểm N+1 `tongHop`" | Không sửa mã: planning chấp nhận (Q4), ghi thân PR. Trần 94 đã có |

Mọi P0 / P1 đều **đúng** khi mở mã (`attempts.ts:1666-1678`, `giaoVien.ts:127, :163-166, :273-280`, `luatLoTrinh.ts:276`, `TeacherAssignPanel.tsx:56-59`, `mywork.ts:254-259, :372`,
`hocVienLop.ts:358-361`, `classes.ts:162-172`, `canCham.ts:441-455`, `signals.ts:76-81`, `phoiHop.ts:300-306`, `duongHoSo.ts:116-119`, `thongBao.ts:34-35`, `LopToiDay.tsx:25-31`,
`CongTacKhung.tsx:11`, `ViecCuaToi.tsx:78, 111`, `KhoiCanXuLy.tsx:27, 112`, `tongQuan.ts:81, 121-138`, `congViec.ts:105-115`, `hanhTrinh.ts:297-302`, `NganCase.tsx:166`,
`viecHocVien.ts:61-104`, `hieuQuaPa.ts:135-141`) — không loại mục nào.

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | Nguồn | PR nhận | Lý do |
|---|---|---|---|
| Chuông điện thoại `top-14` đè thanh trên khi có DemoBar | VAI-a P2 | **PR-UXD** | chỉ bản demo/nháp; việc bố cục điện thoại |
| Thanh dưới biểu tượng (UX-D9), bảng quản trị thành thẻ | VAI-a chuyển | **PR-UXD** | kế hoạch VAI-a đã ghi |
| Bảng Mock Test / Kết quả kiểm tra điện thoại, hàng tab điện thoại | VAI-b chuyển | **PR-UXD** | Nhật ký audit VAI-b |
| Ô chọn khoảng Phân tích GV hiện ngày `24/08/2026` thay mã tuần | tích hợp P2 | **PR-UXF-b** | `ONgay kieu="tuan"` dùng nhiều nơi — đổi cả web ở gói mã tuần |
| `mocChuPa` "1 tháng · đến 18/10" (mã tuần PA quy chế) | VAI-b chuyển | **PR-UXF-b** (B5) | Nhật ký VAI-b |
| `attemptHref` bản máy chủ + G5 ở màn ngoài hồ sơ HV | VAI-b chuyển | **PR-UXF-b** (Q24) | ngoài hồ sơ HV |
| "Đánh dấu kỳ vọng đầu ra" / "Mở hồ sơ" chưa tới mục Kết luận khoá | VAI-a P2 lặt vặt | **PR-UXF-b** | cần neo cuộn trong hồ sơ |
| Thẻ Lịch thi bỏ năm (`loaiYeuCau.ts:161,165`, U5) · R5-1, R5-3, O1, O2 | UXF-a / VAI-b chuyển | **PR-UXF-b** | đã giao từ trước |
| Pre FOU bài Giữa khoá rơi cột "theo môn" (*nghi ngờ*) | Pb2-a P2 | **PR-Dọn** | phải kiểm Pre FOU có Giữa khoá không trước khi sửa |
| `ky_vong_dau_ra` hai ghi danh active → hai việc trùng key (*nghi ngờ*) | VAI-a P2 lặt vặt | **PR-Dọn** | seed một ghi danh mỗi em |
| Khai bậc chép điều kiện `coTheKhai`; `tuanCuaHanGhiKetQua` trùng `nhanTuanGhiKetQua` | VAI-a P2 lặt vặt | **PR-Dọn** | kết quả hiện trùng, chỉ gọn mã |
| Mã chết `classAlerts`, `demCanQuanLyTheoLop`; badge "chưa có lộ trình tiếp theo" | VAI-a P2 + chuyển | **PR-Dọn** | kế hoạch VAI-a đã ghi |
| `pa-can-cap-nhat` vs việc `ghi_ket_qua_pa` lọc khác; "Người giữ việc" vs "GV chấm" hai nguồn tên (*nghi ngờ*) | VAI-a chuyển | **PR-Dọn** | có từ trước, cần soi |
| `listCases` COALESCE lệch quyền (`cases.ts:1781` vs `:1795`) | UXF-a chuyển | **PR-Dọn** | đã giao |
| Gom số câu `studentProfile` (96–99 / 100) | VAI-b P2 | **PR-Dọn** | Task 8 chỉ giữ không vượt trần |
| Chú thích `migrate.ts:484` "PR-CT luôn đứng cuối" đã sai · Nhật ký B thiếu dòng cổng gộp 2 | Pb2-b P2 | **PR-Dọn** | chỉ chữ / tài liệu |
| Seed `action_due` Thứ Bảy → "hạn hết T2 12/09" | tích hợp P2 | **PR-Dọn** | chỉ dữ liệu demo (`sosV3Seed.ts:89`) |
| Chú thích nổi bảng GV vào `THUAT_NGU_DA_CHOT.md`; tiêu đề thông báo "việc + em + lớp"; thân thông báo Case mới (Câu 2) | Pb2-b / VAI-a chuyển | **PR-S3** | kế hoạch đã ghi |
| `init-ban-chinh` có ba cột mới · DEMO.md kịch bản D18 · seed D18 "PA GV thêm có kết quả" | Pb2-b chuyển + P2 | **PR-DEPLOY** | cùng gói kịch bản demo |
| Luật "chặn ngày ghi" K3-17 | UXF-a chuyển | **planning / chủ sản phẩm** | nguồn chỉ một câu; cần chủ sản phẩm chốt luật |

## KIỂM — kịch bản bấm thử

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| 1 | GVBM | Test › Lịch Test › bảng điểm MT (FT) | gõ 1 tiêu chí W1 ngày 20/09, đủ 4 tiêu chí 28/09 (hạn 22/09) | QL › Phân tích › Giáo viên › ô Chấm điểm của GV → panel: dòng đó **Trễ**, "Lần nhập đầu 28/09" |
| 2 | QL | Hồ sơ HV có ô quá hạn › ⋮ Tạm dừng | quay lại danh sách lớp, Lịch Test tuần cũ, Phân tích GV | badge "n bài chờ chấm", dòng lớp Lịch Test, ô Chấm điểm đều giảm; Quay lại học → tăng lại |
| 3 | GVBM | Tổng quan › Việc của tôi · Công việc · Học viên & Lớp | em có ô tuần đang chạy, hạn đặt đè đã qua | **không** "Quá hạn" ở cả ba; ô tuần đã hết → "Quá hạn" ở cả ba và badge đỏ |
| 4 | QL | Phân tích › Giáo viên | em chuyển lớp giữ khoá sau MT3 | ô L tính cho GV lớp cũ; bấm ô PA hiệu quả → Hiệu quả PA cùng số |
| 5 | QL | Phân tích › Tổng hợp, khung Lớp thường | tab, Xuất Excel | tab "Tổng hợp Test", dòng 1 Excel và tên file không có "SOS" |
| 6 | QL | Hồ sơ HV FT đang Tạm dừng | đầu hồ sơ · tab Hành trình · ⋮ Chuyển lớp | ba nơi "tuần học thứ 14 · đang dừng"; chương lớp hiện tại viền "đang học", không "Bảo lưu"; Ngăn Case không nhãn "Quá hạn"; mọi hạn ở bảng kỹ năng → "Tạm dừng từ …" |
| 7 | GVCN | Hồ sơ HV có Case chưa PA quá hạn, 2 vi phạm mới | thanh "Việc của bạn" | có "Đề ra PA", "Ghi nhận 2 vi phạm mới"; số việc = Công việc lọc em đó |
| 8 | GV (Hà, id 7) | Tổng quan › Lớp tôi dạy | cột Bài chờ chấm / quá hạn → bấm số | số = số dòng danh sách bài = cột "Bài quá hạn" hồ sơ GV cùng lớp |
| 9 | GV dạy 2 khung | Tổng quan › "Xem hết (n)" | bấm | Công việc mở khung "Tất cả", chip "Đến hết tuần" = n |
| 10 | QL rồi GV (cùng máy, demo đổi vai) | QL chọn "Lớp thường" ở Số liệu → đổi sang GV chỉ dạy FT | Lớp tôi dạy | vẫn hiện lớp FT |
| 11 | QL | Tổng quan › Cần xử lý | dòng "lệnh chuyển lớp", dòng "thiếu GV môn" | nhãn **Quá hạn** + "quá hạn từ {tuần}"; "· m bài chưa có người chấm" khi có |
| 12 | GVCN lớp thường | Tổng quan › Việc của tôi | lớp có Báo PH Giữa khoá đang chờ | **không** có "Phối hợp SOS" |
| 13 | QL | Chuông | thẻ Báo lên mới | nằm ở **Cần làm**; xử lý thẻ → sang Để biết |
| 14 | QL | Hồ sơ lớp FOU (L = R = một người, G+V trống) › Sửa phân công | đổi GVCN, Lưu | mở sẵn tách; G+V vẫn trống sau khi lưu; gợi ý ghi "L, R, G+V" / "P" |
| 15 | QL | Hồ sơ HV có vi phạm chưa xử lý › Chuyển lớp | thi hành | hạn ở tab Ý thức = hạn ô Xử lý vi phạm bảng GV |
| 16 | GV, QL | Tổng quan (mở tab Mạng) | tải trang | mỗi GET một lần; không lặp `/my-work`, `/tong-quan/quan-ly` |
| 17 | mọi vai | mọi màn trên | 375 px, sáng + tối | không cuộn ngang; hạn, người 12 px; không "ca tối"; mã tuần |

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, model thật, phép kiểm trước đỏ bao nhiêu ✗, trần tốc độ, lệch kế hoạch, cổng gộp) |
|---|---|---|
| 01/10 | [S6F-a] 0 | Model thật **Opus 5.5** (claude-opus-5-5). Worktree `pr-s6f-a-may-chu-du-lieu` từ `origin/main` @ `ceecd0da`. **Mốc B = 2162 + 28** (xanh; chạy ~40 phút vì S6F-b check cùng lúc). Phép kiểm trước viết đủ khối 1–4 rồi chạy trên mã `main`: 19 ✗ / 22 (1c, 4f, 4h xanh sẵn — phép kiểm khoá lại). |
| 01/10 | [S6F-a] 1–4, 10, 11 | Phép kiểm trước viết trước, chạy trên bản chụp `main` (Node `--experimental-transform-types`, DB riêng): ✗ trên main khối 1: 3 · 2: 5 · 3: 4 · 4: 5 · 10: 4 · 11: 5 (xanh sẵn = khoá lại / đối chứng: 1c, 2d, 3d, 4b, 4f, 4h, 10e) → sửa → 32/32 xanh. `npm run check` từng Task chạy trên bản chụp đúng commit (worktree tạm): Task 1 xanh **2166 + 28**; Task 2 **2169 + 28, 2 ✗** "Badge bằng đúng danh sách" (badge bỏ em không đang học, danh sách `need: my_scores` chưa bỏ) → sửa `listAttempts` (commit "(2): sửa"); Task 3 sập OOM / "database disk image is malformed" (máy quá tải, phiên bị ngắt); Task 4 segfault 139 (cùng 2 ✗ trên); Task 10, 11 dừng (commit chưa có bản sửa) → kiểm một lần trên HEAD. |
| 01/10 | [S6F-a] lệch kế hoạch | (a) Quét chuỗi "em đang học" chỉ phủ tệp luật nợ / bảng GV (~30 chỗ viết tay khác ở tệp ngoài phạm vi, nhiều tệp S6F-b) → PR-Dọn. (b) Q23: demo không có em gợi ý "Học lại" ở lớp hết khoá — phép kiểm dùng em Pass chuyển ngang (cùng `khacGoiY`). (c) `cuoiKhoa.ts` không đổi: `raLenh` chỉ đưa em hợp lệ vào `IN`. (d) Q20 hàng mờ + câu "Cách đọc" Q22 sửa ở `HieuQuaPa.tsx` (tệp web Phân tích không S6F-b nào chạm). (e) 3c: "nhập 22/09 → trễ 1 ngày" của kế hoạch tính sai (22 − 20 = 2) → phép kiểm dùng 21/09. |
| 01/10 | [S6F-a] 14 | impeccable `audit` (HieuQuaPa, ClassCreatePanel, Header) 19/20, detector 0; `polish`: hàng "Case chưa phân loại lỗi" bỏ nhãn "Ít dữ liệu"; ảnh `thiet-ke/anh/pr-s6f/a-*` 1440/375 sáng/tối, không tràn ngang. `/ponytail-review`: net −3 dòng (tuỳ chọn, giữ). |
