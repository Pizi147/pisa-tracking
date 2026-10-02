# PR-Dọn · Mã thừa + quyền + an toàn — Kế hoạch
| 02/10 | 0 | **Dọn-b** · **Claude Opus 5.5** (phương án B của bổ sung 02/10; gợi ý là Sonnet 5.5). Nhánh `pr-don-b-giao-dien` từ `e8b6dea7` (S3, DEPLOY, UXF-b, UXD đã merge — không cần cổng gộp). **Mốc B: 2334 đạt + tốc độ 33 đạt**, typecheck 0 lỗi; 1 ✗ là tiến trình con `migrate` sập segfault (mã 3221225477) ở DEPLOY-1c, không phải lỗi mã. Đã có sẵn trên main: P0 `POST /tasks` và `/ref/periods/resolve` (PR-DEPLOY 0b), nhãn Vận hành theo THUAT_NGU (PR-S3). Khối `prDonB`: **22/23 đỏ trên main** (12a xanh sẵn — giữ làm khoá). Chạy khối riêng bằng bộ chạy tạm (không commit) cho nhanh; `npm run check` đủ ở cuối. |
| 02/10 | 11+12 | Khối (11)(12) đỏ trên main (12a xanh sẵn). `useLoiForm` cho 6 form (Tài khoản, Danh mục ×2, Thêm HV, Lộ trình HV + Target/điểm đầu vào, Tuần khai giảng, Vận hành ×3); `Field` nhận `loi` như `Truong`. `ManagerTasks` không còn form (Câu 1 = A: form gộp vào "+ Giao việc" của Vận hành) nên là 6 tệp, không 7. **Lệch Q25:** theo bổ sung 02/10 A, giữ chữ THUAT_NGU (Chưa bắt đầu · Đang xử lý · Tạm ngưng · Dừng hẳn · Xong); `NhanTrangThai` thêm `chu` để giữ kiểu nhãn chung. **12d:** Báo cáo đơn vị không có bộ lọc chi nhánh → đơn vị Tutor chỉ liệt kê việc "Toàn hệ thống" (cùng chi nhánh việc tạo từ ô Tutor). Việc giao GV gắn tuần đang chạy (`/ref/period-window`). |
| 02/10 | 13 | Khối (13) đỏ trên main. `setRolePermissions` (kiểm hết khoá trước, một `tx`, mỗi ô một nhật ký; `ponytail:` 3–4 câu/ô ≤ 200 ô). Nút "Huỷ thay đổi" (luật S3, không "Huỷ" trần — check lần 1 bắt). Kết thúc lớp: FT "chuyển lớp từng em hoặc chuyển nhiều em", lớp thường "Quyết định chuyển lớp cho cả lớp" (`CHU_CHUYEN_LOP`), `conTreo` thêm "Sắp chuyển · từ W.. (n em)". |
| 02/10 | 14 | Khối (14) đỏ trên main. `deadlineView` dùng `ngayTheoGioVN` có sẵn ở `display.ts` (không thêm `ngayVn` mới); BangChung `contains(relatedTarget)`; `scoreHistoryOf` thêm `score.nhan_xet` (bỏ dòng chỉ đổi GV chấm). |
| 02/10 | 14b | B2 `monTinhBaoPh` (việc đã làm chỉ trừ môn đóng trước ngày làm). B3 `docTuanLich` chọn tuần gần nhất ±6 tháng; **thêm:** `tuanLich` bỏ năm chỉ khi đọc ngược ra đúng tuần (tuần cùng năm nhưng xa hơn nửa năm nay có năm — giữ ô tuần gõ lại không nhảy năm). Sửa kỳ vọng `prVaiB`, `prUxfB (6)` (truyền `homNay`). B6 thêm danh sách tuần của kỳ tháng ở Báo cáo đơn vị. B7 không sửa. |
| 02/10 | 14c/A | C: `vuaGhi` khoá thêm người/hạn/kỹ năng; PA thay thế (`thayThe`) không qua chặn; `chuTuDo` cho 2 lý do; chú thích `week.ts`; Header đóng ô tìm; `invalidate('/overview')` (19 chỗ) → `/tong-quan`. A: gỡ `trongPhamVi`, 4 cờ cũ, `NEXT_STEP_HINT`, import chết. **Phép kiểm xoá cùng mã chết: 1** ("PR-O · O6 Cờ cũ giữ đúng nghĩa"); sửa 2 (khung O6 dùng cờ mới; run.ts bước PA bỏ `NEXT_STEP_HINT`). P2 không làm → thân PR "Chuyển cho PR khác". |
| 02/10 | 15 | Bấm thử Playwright kênh Chrome (API 4187 · Vite 5387, DB riêng): KIỂM 11 (nhãn, một nút, panel lồng + Esc), 12 (2 thay đổi, Huỷ), 13 (Hoàn tác trả em về Lưu trữ), 15 (Tạo tài khoản 3 ô lỗi) ở 1440/375 sáng/tối; không cuộn ngang trang. impeccable `detect` 0 phát hiện; audit tay: ô bảng quyền 44 px trên điện thoại. `/ponytail-review`: lean (1 shrink). **Check cuối: 2357 đạt + tốc độ 33 + typecheck 0** (mốc 2334 + 23 prDonB − 1 xoá + DEPLOY-1c hết sập). |

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Dọn sạch trước khi reset DB và deploy bản chính. Phần lớn việc ở máy chủ.
(1) **Quyền và an toàn.** Vá các lỗ quyền nhẹ đã biết:
- `/ref/nguoi`;
- nhập bù Case gửi hai lần thành hai Case;
- `helpName` không giới hạn độ dài;
- `duyetNhieu` báo 400 trước khi báo 403;
- `listCases` lọc lớp theo một lớp nhưng kiểm quyền theo lớp khác.

Cộng thêm **24 phát hiện** của lượt quét an toàn 244 đường API (bảng "Quét an toàn" bên dưới), trong đó có **1 lỗi mức Cao**: `POST /attempts` tin `cycleId` do web gửi.
(2) **Một luật cho một khái niệm:**
- một điều kiện "em đang học" (`HV_DANG_HOC_SQL`) thay 34 chỗ viết tay;
- việc nhập điểm dùng cùng luật với Nợ điểm (không tính lớp đã kết thúc);
- "Đề ra PA" có cùng người làm ở Công việc và ở hồ sơ;
- một cách chọn lộ trình cho "tuần học thứ n";
- một luật phân công cho "người giữ việc" và "GV chấm".

(3) **Xoá đường API web không còn gọi và mã chết.** Grep mọi nơi gọi trước khi xoá, rồi sửa phép kiểm theo.
(4) **Tốc độ:**
- hồ sơ HV từ 96–99 câu SQL xuống **≤ 90 câu**;
- trần tốc độ của lớp thường đo đúng lớp;
- phép kiểm "tải trang đầu" bắt được route mới.

(5) Các việc nhỏ đã giao cho Dọn:
- lỗi dữ liệu lộ trình;
- seed demo;
- `useLoiForm` cho 7 panel;
- Vận hành dùng nhãn trạng thái chung;
- bảng quyền có chế độ Sửa;
- Bỏ lưu trữ có Hoàn tác;
- panel Kết thúc lớp nói việc còn treo.

**Architecture:** Không thêm bảng, **không migrate**, `schema.sql` không đổi (DB sẽ reset trước khi deploy). Việc chính là **xoá đường thứ hai**:
- **Quyền:** kiểm ở hàm dịch vụ, và kiểm **trước** mọi bước có thể lộ dữ liệu (câu báo lỗi, tên trong dòng lỗi, dòng trùng). Danh sách luôn lọc theo phạm vi của người xem.
- **SQL:** mọi `IN (…)` chứa dữ liệu không cố định đều đi qua `theoLo` (`server/src/db.ts:303`, tối đa 900 tham số). Mảng id trong thân yêu cầu có trần độ dài.
- **Giá trị do máy chủ tự tính** (người làm, lộ trình của em, ngày nghiệp vụ): không đọc từ thân yêu cầu.
- **Mã chết:** xoá route, hàm, trần tốc độ và phép kiểm cũ trong cùng một commit. Phép kiểm cũ còn ý nghĩa thì **chuyển** sang đường còn sống, không bỏ ý.

Phép kiểm mới nằm ở `server/src/tests/prDon.tests.ts` (`runPrDonTests(t)`), đăng ký **cuối** `run.ts`, theo mẫu `prS6fA.tests.ts`.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso). Harness `check()` của `run.ts`, chạy bằng `npm run check`.
**Spec:**
- **Nguồn chính:** kiểm kê `docs/superpowers/specs/2026-10-01-kiem-ke-truoc-dot-6.md`:
  - mục (c), dòng **PR-Dọn**;
  - B2a: K1-35, K1-36, K2-35;
  - B2b: `summary.approval`;
  - B2c: UX-C7, UX-C8, C-số `listCases`, C-quyền, C-khác;
  - B3: V4, Dn1, Dn7–Dn12, O5;
  - B4: VN02, VN03, VN10, VN15, VN18, VN19, VN20, VN21, VN24, VN25, VN27, VN31;
  - đoạn "PR-S3 còn thật trên mã": `WorkQueue`, `dashboard.ts`, `summary.ts` (nay giao cho Dọn).
- Bảng việc nhỏ `docs/superpowers/specs/2026-09-29-viec-nho-sau-ra-dot-2.md`: mọi dòng "PR-Dọn".
- Mục "Chuyển cho PR khác" của:
  - kế hoạch S6F (`plans/2026-10-01-pr-s6f-sua-sau-ra-dot-6.md:440-460`), VAI-a (`:477-478`), Pb2 (`:771`), UXF-a (`:460`);
  - các báo cáo rà trong `reviews/2026-10-01-ra-dot-6-luot-1/`;
  - bản rà gọn S6F (`scratchpad/ra-dot6/s6f.md`);
  - thân PR #145, #147, #149, #151, #152.
- Kế hoạch **PR-UXF-b** chạy song song (`plans/2026-10-01-pr-uxf-b-ma-tuan.md`, bảng file chồng `:125-149`). Bảng file chồng dưới đây đã khớp với bảng đó.
- Đặc tả `specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.1e–§3.1h. Q31-3: không làm bảng quản trị cho điện thoại.
- Nguồn từng mục: `thiet-ke/ra-27-09/K1.md:95-96`, `K2.md:81`; kế hoạch UX 26/09 `plans/2026-09-26-ux-sau-danh-gia.md:91-92` (C7, C8).
- `thiet-ke/HOP_DONG_SO_LIEU.md` §1: mỗi con số chỉ do một hàm trả tập ID.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-Dọn**, đợt 6, **lượt 2**, chạy song song **PR-UXD** và **PR-UXF-b**. Một PR, không draft, **không tự merge**. Câu 3 hỏi có tách thành Dọn-a / Dọn-b không |
| Nhánh · worktree | Nhánh `pr-don-ma-thua-quyen`, worktree `.claude/worktrees/pr-don-ma-thua-quyen`, tạo từ `origin/main` @ `0c9c04f6` trở đi |
| Cổng thử | API **4177**, Vite **5377** (Vite tạm đặt ngoài worktree, proxy về 4177). Hai PR song song dùng: UXD 4157/5357, UXF-b 4167/5367. Không dùng 4000/5173 |
| Log check | `$env:TEMP\check-don.log`. Đặt tên riêng vì `$TEMP` dùng chung giữa các session |
| Model | **CỰC KỲ KHUYẾN NGHỊ Opus 5.5 · High.** Lý do: PR chạm phân quyền, an toàn và đường dữ liệu (xoá route, đổi luật "em đang học", ghi lộ trình). Phương án B: **Fable 5.1 · High** |
| Người rà | **Opus 5.5**, rà **một lượt** khi xong lượt 2 đợt 6. Session code không tự rà |
| Subagent | Chỉ dùng khi buộc phải dùng, **cùng model với session, KHÔNG dùng Haiku**. `Co-Authored-By` ghi đúng model thật |
| Migrate? | **Không.** `schema.sql` không đổi; không có lệnh xử lý dữ liệu cũ (DB sẽ reset). Bảng `user_prefs` vẫn giữ trong schema dù xoá route `/prefs` |
| Lệnh skill | **`/ponytail lite` đầu phiên** (PR có sửa web). impeccable: **`harden`** ở Task 11 (form); **`clarify`** + **`polish`** ở Task 12, 13 (chỉ phần nhìn có đổi); **`audit`** + **`polish`** (**sáng và tối**) ở Task 15. Không chạy `init`, `document`, `hooks on`, `npx impeccable install\|update`. Trước khi mở PR: **`/ponytail-review`** |
| Phụ thuộc | Không chờ PR nào. Chạy song song UXD và UXF-b, theo bảng file chồng bên dưới. Không cần mockup mới |
| Không làm | Xem danh sách ngay dưới bảng |

**Không làm trong PR này:**
- bố cục điện thoại, thanh dưới, `TheDong` → **PR-UXD**;
- mã tuần, R5-x, O1, O2, U5, `attemptHref`, `mywork.ts:927` sắp lớp → **PR-UXF-b**;
- UXF-b đã nhận xoá `supportLineOf` (`cases.ts:2659-2672`), `scheduleHeadline` (`attempts.ts:480-490`), `weekLabel` và `formatDateVi` (`util.ts`), `weekCodeShortOf` (`shared/domain/week.ts:58`) → Dọn **không** xoá lại;
- chữ cuối, thuật ngữ, Dn8 (chú thích "của Inter"), `invalidate('/overview')` còn sót ở web → **PR-S3**;
- DEP-1…5 → **PR-DEPLOY**;
- Hiệu quả PA ghi mức SOS lúc sinh PA → **hoãn**. Chủ sản phẩm chọn giữ như cũ (S6F Câu 3 = A); code hiện xếp PA theo mức SOS **hiện tại** của Case (chú thích `ponytail:` ở `hieuQuaPa.ts:118`).

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - chạy `npm run check` **một lần, ở foreground**, ghi log vào `$env:TEMP\check-don.log`;
  - check xanh và số phép kiểm ≥ mốc B thì commit `PR-Dọn (n): …`. Ngoại lệ: phép kiểm cũ **xoá cùng mã chết** được trừ khỏi mốc, nhưng phải ghi rõ số lượng và tên vào Nhật ký.
- Mỗi Task bắt đầu bằng **Phép kiểm trước**. Viết xong, phép kiểm phải **ĐỎ trên `main`** (chạy một lần, ghi số ✗ vào Nhật ký), rồi mới sửa.
  - Task chỉ xoá mã thì phép kiểm trước là **quét chuỗi**: tên hàm / route không còn trong `server/src`, `web/src`, `shared`. Phép này đỏ trên `main` vì tên còn đó.
- Sập segfault / OOM → chạy lại **một** lần. Vẫn sập → chạy thẳng `tsc` + `node dist-server/…/tests/run.js` + `tocDo.run.js`, không qua npm.
- Treo quá 10 phút → tìm tiến trình bằng `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`, tắt hết, chạy lại một lần.
- Không chụp ảnh ở từng Task. Bấm thử theo vai, ở 1440 và 375, **sáng và tối**, **một lần duy nhất** ở Task 15:
  - Playwright kênh Chrome; vào demo bằng `POST /api/demo/session {userId}`; tra vai ở `tests/tocDo.run.ts:114`;
  - ảnh để ở `thiet-ke/anh/pr-don/`;
  - API `PORT=4177`, Vite tạm 5377 proxy về 4177 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy. Mã khác hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- **Xoá mã:** trước khi xoá, chạy grep ghi trong Task và dán kết quả vào Nhật ký. Grep phải phủ cả `server/src/tests/`, `tocDo.run.ts`, `tocDoDuong.ts`, `web/src`, `shared`, `netlify/`, `server/src/seed/`, `server/src/ops/`.
  Thấy nơi gọi ngoài danh sách → không xoá chỗ đó, ghi Nhật ký.
- **Cổng gộp:** làm khi UXD hoặc UXF-b merge, và ở Task 15.
  - Chạy `git fetch origin && git merge origin/main`.
  - Gỡ xung đột theo bảng file chồng.
  - Chạy `npm run check`, ghi Nhật ký.
- Trước khi báo xong: tắt 4177/5377, tìm và tắt `tests/run.js` còn treo, dọn file tạm.

### File chồng với PR-UXD và PR-UXF-b

Nguyên tắc chung:
- **Dọn sở hữu `server/`** ở phần quyền, SQL và mã chết. Ở `web/`, Dọn chỉ sửa các tệp ghi trong bảng.
- **UXD** sở hữu bố cục điện thoại. **UXF-b** sở hữu chữ mã tuần, `href` (G5) và `xinYKien`.
- Ở các tệp **Dọn sở hữu mà UXF-b chỉ sửa một khối nhỏ trong hàm khác** (chữ, `href`, `xinYKien`): **PR nào merge sau thì áp lại khối của mình** lên bản đã merge. Các tệp này là `cases.ts`, `attempts.ts`, `loaiYeuCau.ts`, `mywork.ts`, `metrics.ts`.

| File | PR khác | PR-Dọn sửa | Ai sở hữu · cách gỡ |
|---|---|---|---|
| `shared/domain/oNgay.ts` | **UXF-b**: phần hiển thị tuần (`hienONgay`, `phuONgay`, `loiKhoangNgay`, nhánh `kieu==='tuan'` của `docONgay`; bộ đọc mã tuần `docTuanLich` nằm ở `hienThiNgay.ts`) | **chỉ phần kiểm năm** (VN20): `hop` :17-21 và dòng gọi `hop` trong nhánh ngày của `docONgay` (:57) | **Chia đôi:** UXF-b sở hữu phần tuần, Dọn sở hữu phần kiểm năm. Hai phần khác dòng nên giữ cả hai. Dọn không đụng nhánh `tuan`, UXF-b không đụng `hop` |
| `web/src/modules/students/StudentPlanPanel.tsx` | **UXF-b** sửa đúng **một dòng chữ** `:181-182`: nay còn `W3 SEP 2026` + `dd/mm/yyyy` (`r.code`, `fmtDate`), đổi sang `tuanLich` (B5 #9) | O5 `useLoiForm` (form `save` :66-77 và các ô) | **Dọn** sở hữu tệp. UXF-b một dòng; PR merge sau áp lại dòng đó |
| `web/src/modules/students/IntakePanel.tsx` | **UXD không sửa** (D1 hoãn — kế hoạch UXD Q2, `:77`, `:348`). UXF-b không sửa | O5: thêm `useLoiForm` (state, `lf.o()` trên ô, `ChanForm`); không đổi bố cục | **Dọn**, không chồng |
| `web/src/modules/classes/ClassProgressPanel.tsx` | **UXF-b** `:94`, một chữ mã tuần | O5 `useLoiForm` | **Dọn** sở hữu tệp, UXF-b một dòng. Khác dòng, giữ cả hai |
| `web/src/modules/cases/QuickReport.tsx` | **UXF-b** B5 (`:549, :560` mã tuần) | `idempotencyKey` cho nhập bù (`sendBackfill` :202-226) | Khác hàm, giữ cả hai |
| `web/src/modules/students/StudentsPage.tsx` | **UXD** (`TheDong`, U14). **UXF-b** B5 #11, #19 (`:451, :454, :491`) | **xoá** `WorkQueue` (:381-510) | ⚠ `:451, :454, :491` **nằm trong `WorkQueue`**: hàm chết, web không gọi, không hiện trên màn nào. UXF-b bỏ phần web của B5 #11, #19 (phần máy chủ `pendingWeeks`, `attempts.ts:154` giữ nếu còn nơi đọc). Nếu UXF-b merge trước và đã sửa các dòng đó, Dọn vẫn xoá cả hàm |
| `web/src/modules/worklist/MgmtTasksPage.tsx`, `ManagerTasks.tsx`, `MeetingPage.tsx` | UXD D7 **hoãn** (Q31-3). **PR-S3** chạy sau (C-chữ `:222`) | O5; 2 `Modal` → `KhungPanel`; K1-35; K1-36 (theo Câu 1); Tutor ở `ChonViec` | **Dọn**. S3 chạy sau, gộp lên bản của Dọn |
| `web/src/modules/platform/AdminPage.tsx`, `AccountsAdmin.tsx`, `CatalogAdmin.tsx` | UXD D7 **hoãn** | UX-C7, O5 | Dọn |
| `web/src/modules/students/LuuTruPage.tsx`, `classes/XoaKetThucLopPanel.tsx`, `ui/BangChung.tsx`, `duyet/DeXuatSuaPanel.tsx`, `cases/CaseBoardPage.tsx` | — | UX-C8, K2-35, C-khác, Dn12, `CaseRoutePage` | Dọn |
| `web/src/modules/fasttrack/DongThoiGianLuot.tsx` | UXD (bảng Mock điện thoại, có thể chạm `MockDetailPage`) | Dn7: thêm loại dòng "Nhận xét" | Dọn sở hữu tệp này; UXD không sửa |
| `server/src/students/profile.ts` | **UXF-b không sửa** (ô Học thuật em Tạm dừng sửa ở `shared/domain/hoSoHocVien.ts`) | gom câu SQL `studentProfile`, selector lộ trình (`:757`) | **Dọn**, không chồng |
| `server/src/cases/cases.ts` | **UXF-b**: `:1194` chữ lỗi; xoá `supportLineOf :2659-2672`; skill board thêm `xinYKien`; B5 `:2630-2642` | `listCases` (`:1781-1808, :1895-1906`), `backfillCase` (`:1142-1196`), `PUT /cases/:id/owner` (xoá), độ dài chữ `reportIssue` (`:406, :410`) | **Dọn** sở hữu tệp. Khác hàm, giữ cả hai; PR merge sau áp lại khối của mình |
| `server/src/fasttrack/attempts.ts` | **UXF-b**: `attemptHref :1840`, `:154` chữ, `pendingWeeks` thêm `weekStart`, xoá `scheduleHeadline :480-490` | `createAttempt` (`:1053-1124`, lỗi mức Cao), `resultDate` (`:1613`), Dn7 (`scoreHistory`) | **Dọn** sở hữu tệp. Khác hàm; PR merge sau áp lại |
| `server/src/duyet/loaiYeuCau.ts`, `duyet/yeuCau.ts` | **UXF-b**: U5 (`loaiYeuCau.ts:162,166`), VN01 (`yeuCau.ts:132`) | VN02 `duyetNhieu` (`yeuCau.ts:434-450`); độ dài chữ (`yeuCau.ts:410-432`); `HV_DANG_HOC_SQL` (`loaiYeuCau.ts:265, 497, 513, 520`) | **Dọn** sở hữu tệp. Khác hàm; PR merge sau áp lại |
| `server/src/worklist/mywork.ts` | **UXF-b**: `href` việc `ky_vong_dau_ra` (khối `:1118`, thêm `muc`), `attemptHref` (`:350, :886`) | `summary.approval`; "Đề ra PA" (`:668`); `HV_DANG_HOC_SQL` (9 chỗ); viết lại khối `ky_vong` `:1108-1125` (lớp nguồn, một dòng mỗi em) | **Dọn** sở hữu tệp. ⚠ Cùng khối `ky_vong`: Dọn viết lại khối; UXF-b chỉ thêm `muc` vào `href`. PR merge sau áp lại `href` / khối |
| `server/src/worklist/metrics.ts` | **UXF-b** (`:145, :160` `href` → `duongDotTest`) | `HV_DANG_HOC_SQL` (`:557, :683`), `overdueUpdatePlans` (`:385-405`), `hvLenFtChuaKyVong` (`:551-565`) | **Dọn**. Khác dòng; PR merge sau áp lại |
| `server/src/normal/regular.ts` | **UXF-b** R5-4 (Task 9 của UXF-b) | `allProgrammes` (`:52-66`), `HV_DANG_HOC_SQL` (`:285`) | Khác hàm, giữ cả hai |
| `shared/domain/week.ts` | **UXF-b** xoá `weekCodeShortOf` (:58) | thêm `tuanKetQuaCuaHan(han)` | Khác dòng, giữ cả hai |
| `server/src/yThuc/trangThai.ts`, `yThuc/board.ts` | **UXF-b** VN26 | **không sửa.** `khaiDuoc(em)` đặt ở `yThuc/xuLy.ts` để tránh chồng | UXF-b |
| `server/src/util.ts` | **UXF-b** xoá `weekLabel`, `formatDateVi` | **không sửa** | UXF-b |
| `server/src/routes/index.ts` | Cả hai PR (UXF-b có thể thêm route) | **xoá** 21 route (Task 7); sửa `/ref/nguoi`, `/ref/routes`, `/admin/routes`, `/classes/:id/progress`, `/cycles/:id/suggested-mocks`, trần mảng id | Dọn chỉ xoá / sửa đường của mình. Route mới của PR khác giữ nguyên |
| `server/src/tests/run.ts`, `tocDoDuong.ts`, `tocDo.run.ts`, `CODE_MAP.md`, `shared/domain/index.ts` | Cả hai PR | Thêm khối phép kiểm **cuối** `run.ts`; xoá khối phép kiểm của mã chết; sửa khoá trần `/classes/5/` | Chỉ thêm dòng, trừ các khối xoá có ghi tên. Giữ cả hai, thứ tự theo lần merge |

UXD và UXF-b **không** cần sửa các tệp sau:
- `server/src/worklist/{dashboard,summary,branchpulse}.ts`, `platform/prefs.ts`, `fasttrack/planning.ts` (`bulkPlan`) — Dọn xoá;
- `fasttrack/cycles.ts`, `fasttrack/absence.ts`, `classes/intake.ts`, `platform/timNguoi.ts`, `worklist/mgmttasks.ts`, `worklist/highlights.ts`, `db.ts`.

## Quét an toàn — 244 đường API (01/10, đọc mã từ route vào tới hàm dịch vụ)

Viết tắt `idx` = `server/src/routes/index.ts`. Các đường dẫn khác tính từ `server/src/`.
**24 phát hiện:** 1 Cao · 11 Vừa · 12 Thấp. Trong đó 6 phát hiện đã biết từ trước: #7, #8, #11, #24 (`helpName`), #25, #27.
Bảng không có số #15, #18, #21: #15 trùng #2, #18 trùng #1, #21 là mục đã kiểm và không còn lỗi.

| # | Mức | Chỗ (file:dòng) | Lỗi | Sửa tối thiểu | Task |
|---|---|---|---|---|---|
| 1 | **Cao** | `idx:454` POST `/attempts` → `fasttrack/attempts.ts:1053-1085`, `:1119-1124` (`hoiSinhLuot`) | Máy chủ tin `cycleId` / `classId` của thân yêu cầu: `cycleById(input.cycleId)` không kiểm `cycle.student_id === studentId`. Quản lý gửi HV chi nhánh mình kèm lộ trình của HV chi nhánh khác → hồi sinh / ghi đè lượt của em khác | **Sửa gốc ở `createAttempt`** (mọi nơi gọi đều hưởng: `keHoachTest.ts:561`, seed): lộ trình phải thuộc đúng em, lớp lấy từ ghi danh. **Xoá** route (web không gọi) | 2, 7 |
| 2 | Vừa | `idx:465` POST `/attempts/bulk-plan` → `fasttrack/planning.ts:60-113` (`:93`, `:37`) | Không kiểm quyền trước `SELECT full_name … IN (…)`; dòng lỗi 403 vẫn trả `label: full_name` → GV đọc được tên HV mọi chi nhánh. `IN` không chia lô, mảng không có trần | **Xoá** route + `bulkPlan` (web không gọi) | 7 |
| 3 | Vừa | `idx:1528` GET `/highlights` → `worklist/highlights.ts:63-74` (`visibleClasses`) | Bỏ qua `scope.classIds`: GV thuần thấy mọi lớp đang mở của cả hệ thống; `?branchId=` nhận chi nhánh bất kỳ | Dùng `classScopeSql(scope)` như `listClassSummaries` | 2 |
| 4 | Vừa | `idx:2005` GET `/tasks/:id/history` → `worklist/meeting.ts:704-711` | Không có principal, không kiểm gì: ai đăng nhập cũng đọc được lịch sử việc | **Xoá** route + `taskHistory` (web không gọi) | 7 |
| 5 | Vừa | `idx:2039` POST `/mgmt-tasks` → `worklist/mgmttasks.ts:391, :404-412, :445-448`; lộ ở `:347` | (a) `caseIds` không kiểm tồn tại / phạm vi → chi tiết việc lộ tên Case + tên HV chi nhánh khác. (b) `parentTaskId` của chi nhánh khác → tạo việc con ở chi nhánh đó | (a) `can(ATTEMPT_VIEW, ngữ cảnh Case)` cho từng caseId, trần 50. (b) `require_(MEETING_EDIT, { branchId: taskBranchId })` **sau** khi đã tính `taskBranchId` | 2 |
| 6 | Vừa | `idx:1447` POST `/cases/backfill` → `cases/cases.ts:1182-1196` (quyền chỉ ở `reportIssue :396`) | Câu kiểm trùng chạy trước khi kiểm quyền; lỗi 400 trả `duplicateBackfill {id, title, from, to}` của HV chi nhánh khác | `require_(SOS_REPORT, { classId, studentId })` ở **đầu** `backfillCase` | 1 |
| 7 | Vừa (đã biết) | `idx:315-324` GET `/ref/nguoi` → `platform/timNguoi.ts:87-118` (`:93-94`, `:103`, `:107`) | `activeClassOf(studentId)` và `dangDayLop` chạy không kiểm quyền; lọc chi nhánh chỉ khi gửi `trongPhamVi=1` | Có `studentId` → `require_(STUDENT_VIEW, { studentId })`; mặc định lọc theo phạm vi, trừ khi `scope.all` | 1 |
| 8 | Vừa (đã biết) | `idx:1454` GET `/cases` → `cases/cases.ts:1793-1794` vs `:1807-1808`, `:1906` | Bộ lọc lấy lớp hiện tại trước, quyền lấy lớp của lượt trước → em chuyển chi nhánh: QL hai chi nhánh và GVCN mới mất Case cũ; số lệch | Một mảnh SQL `lopCuaCase(alias)` cho cả bộ lọc lẫn quyền (Q5) | 1 |
| 9 | Thấp | `idx:345` `/ref/teachers`, `idx:326` `/ref/users` | `/ref/teachers` không đối chiếu `branchId` với phạm vi; `/ref/users` trả mọi người dùng | Giao `branchId` với `scopeFor(CLASS_ASSIGN)`; `/ref/users` lọc phạm vi (trừ `scope.all`) | 2 |
| 10 | Thấp | `idx:1233` `/classes/:id/suggested-weeks`; `idx:1338-1341` `/classes/:id/progress`; `idx:1419` `/cycles/:id/suggested-mocks` (`schedule.ts:50`); `idx:2225` `/admin/routes`; `idx:2224` `/ref/routes` (không đăng nhập; `inUse` lộ quy mô) | Không kiểm quyền | `suggested-weeks`: **xoá** (web không gọi). `progress`: `require_(ATTEMPT_VIEW, { classId })`. `suggested-mocks`: `require_(STUDENT_VIEW, { studentId })`. `/admin/routes`: `ADMIN_CONFIG`. `/ref/routes`: thêm `requireAuth`, bỏ `inUse` (`CatalogAdmin.tsx:77,186` đọc `inUse` từ `/admin/routes`) | 2, 7 |
| 11 | Thấp (đã biết) | `idx:1674` → `duyet/yeuCau.ts:446-448` vs `:450` | `ids` sai dạng trả 400 trước khi kiểm quyền (403) | Đưa `require_` lên trước (Q1) | 1 |
| 12 | Thấp | `fasttrack/absence.ts:209, :395, :555, :797`; `cases/cases.ts:152, :1310`; `worklist/mgmttasks.ts:275, :496`; `worklist/meeting.ts:689` | Từ chối quyền nhưng ném 400 | Đổi sang `forbidden(…)` (403) | 2 |
| 13 | Thấp | `idx:1766` PUT `/cases/:id/owner` → `cases/cases.ts:2691-2694` | `ownerUserId` có thể là người không xem được Case | **Xoá** route (web không gọi) | 7 |
| 14 | Vừa | `idx:527` → `keHoach/keHoachTest.ts:887` | `student_id IN (…)` dùng thẳng `studentIds` thô của thân yêu cầu: không bỏ trùng, không chia lô, không trần → > 900 id thì lỗi 500 | Bỏ trùng, trần 500 (Q6), `theoLo` | 3 |
| 16 | Thấp | `intake/preview`, `intake/commit` `rows` (`classes/intake.ts`); `/classes/:id/transition` `dongs` (`classes/lenhChuyen.ts:67`); `/cases/backfill` `actions` (`cases.ts:1142`); `/mgmt-tasks` `caseIds` | Mảng trong thân yêu cầu không có trần (thân tối đa 12 MB, `app.ts:30`) | Trần theo Q6: `rows` 200, `dongs` 500, `actions` 50, `caseIds` 50 | 3 |
| 17 | Thấp | `cases/effectiveness.ts:444, :606, :659` | `IN (sids)` không chia lô (id lấy từ phạm vi lớp, nay chưa vượt 900). `:606 issueSkillRows`, `:659 issueBoardCases` chỉ `tests/run.ts` gọi | `:444` qua `theoLo`; hai hàm kia **xoá** nếu grep xác nhận | 3, 7 |
| 19 | Thấp | `cases/cases.ts:421` `detectedAt`; `fasttrack/attempts.ts:1613-1614` `resultDate` | Nhận ngày tương lai (các route bên cạnh chặn: `:172, :1062, :2904`) | `> demoToday()` → 400 | 2 |
| 20 | Thấp | `fasttrack/cycles.ts:150` (`createCycle`), `idx:1278` | Lưu `route` của thân yêu cầu mà không đối chiếu `activeRouteCodes()`; route trải cả `req.body` | Kiểm `route ∈ activeRouteCodes()`; route chỉ lấy các khoá cần | 2 |
| 22 | Vừa | `idx:1579-1580` GET/PUT `/prefs` → `platform/prefs.ts:14-32` | Khoá bất kỳ, giá trị bất kỳ, không trần → phình DB; giá trị không phải chuỗi → 500 | **Xoá** route + `prefs.ts` (web không gọi; chỉ `run.ts:3607-3611` và `tocDoDuong` dùng) | 7 |
| 23 | Vừa | `idx:2161` POST `/auth/register` (chưa đăng nhập) → `platform/accounts.ts:133-153`; `updateProfile :391-397` | `fullName`, `phone`, `note` không trần, không kiểm kiểu (chỉ giới hạn theo IP) | Tên ≤ 100, điện thoại ≤ 20, ghi chú ≤ 500; không phải chuỗi → 400 | 3 |
| 24 | Thấp | `worklist/mgmttasks.ts:518` `helpName` (đã biết; `.trim()` trên giá trị không phải chuỗi → 500), `:393` tiêu đề, `:442`/`:565` ghi chú; `cases/cases.ts:406, :410` tiêu đề + tóm tắt, ghi chú đóng (~`:171`), ghi chú / tóm tắt nhập bù; `yThuc/violations.ts:131` mô tả; `duyet/yeuCau.ts:410` `ghiChu`, `:420` `lyDo`, `:432` `traLoi`; `classes/lenhChuyen.ts:133` `lyDo`; `idx:1827` `lyDo`; `fasttrack/attempts.ts:1702` ghi chú điểm | Chữ tự do không có trần độ dài | **Một hàm** `chuTuDo(v, ten, toiDa)` (kiểm kiểu + trần, ném 400 "Tối đa n ký tự", không cắt ngầm) đặt cạnh `badRequest` ở `util.ts`. Trần: tên / tiêu đề 200, lý do / ghi chú 2 000, mô tả 2 000 (theo mức đã dùng ở `boTro`, `sosAuto`) | 3 |
| 25 | Vừa (đã biết) | `web/src/modules/cases/QuickReport.tsx:207`; `cases/cases.ts:1142-1196` | Nhập bù không có `idempotencyKey`; kiểm trùng chạy ngoài `tx` và bỏ qua khi `category` null → gửi hai lần ra hai Case | Truyền khoá xuống `reportIssue` (cột `sos_cases.idempotency_key` đã UNIQUE) (Q3) | 1 |
| 26 | Thấp–Vừa | POST `/cases/:id/interventions` (`recordIntervention`, `cases.ts:716`); POST `/cases/:id/followups` (`:1239`); POST `/mgmt-tasks` (`mgmttasks.ts:380`); POST `/tasks` (`meeting.ts:568`) | Bấm đúp tạo hai bản ghi | Cùng mẫu `idempotency_key`: bảng có cột thì dùng; bảng chưa có cột thì **chặn trùng theo trạng thái** (cùng người, cùng đối tượng, cùng nội dung trong 10 giây → trả bản đã có), không thêm cột (không migrate) | 3 |
| 27 | Thấp (đã biết) | `db.ts:275`, `db.ts:288` | `ROLLBACK` / `ROLLBACK TO` không gọi `xoaNho()`. Ví dụ: `quetLenhDenHan` (`lenhChuyen.ts:342-344`) chạy trong GET và nuốt lỗi, nên các lần tra quyền sau đó dùng dữ liệu đã cuộn lại | `xoaNho()` ngay sau cả hai lệnh cuộn lại (Q7) | 3 |

Đã kiểm, **không** còn lỗi:
- `queryPlans` đã chia lô (`effectiveness.ts:216`);
- `raLenh` đã chia lô (`lenhChuyen.ts:88, :95`); chỉ còn thiếu trần `dongs` (#16);
- `khacGoiY` do máy chủ tự tính (`lenhChuyen.ts:123`);
- mức kỷ luật (`xuLy.ts:144`), `performedOn` (`xuLy.ts:76-79`), ngày trạng thái (`students.ts:252-254`) đều do máy chủ tính.

Mười đường không có `requireAuth`: chín đường cố ý (demo trả 404 trên bản chính, đăng nhập/đăng ký trước khi vào) và `/ref/routes` (#10).

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 | Kiểm quyền **trước** mọi bước có thể lộ dữ liệu (câu báo lỗi, tên trong dòng lỗi, dòng trùng). Riêng `duyetNhieu`: id sai dạng thì bỏ qua dòng đó; người gọi không có quyền duyệt ở đâu cả → 403 | VN02, #6, #11 |
| Q2 | `/ref/nguoi` có `studentId` → `require_(STUDENT_VIEW, { studentId })`. Luôn lọc theo phạm vi người xem (không chỉ khi `trongPhamVi=1`), trừ `scope.all` | C-quyền, #7 |
| Q3 | Nhập bù Case nhận `idempotencyKey` như `/cases/report`, dùng cùng cột `sos_cases.idempotency_key`. Web tạo một khoá cho mỗi lần mở form | #25 |
| Q4 | Chữ tự do lưu vào DB có trần độ dài ở máy chủ, đi qua một hàm `chuTuDo`. Vượt trần → 400 "Tối đa n ký tự", **không cắt ngầm**. `helpName` 120 ký tự | #23, #24 |
| Q5 | `listCases`: lọc lớp **và** kiểm quyền dùng cùng một biểu thức `COALESCE(lớp hiện tại, lớp của lượt)` (một hàm SQL). Case của em đã rời lớp đi theo lớp hiện tại của em | #8; cột Case ở roster lớp đã kết thúc |
| Q6 | Mảng id trong thân yêu cầu có trần **500 phần tử** (riêng: `rows` Thêm HV 200, `actions` 50, `caseIds` 50). Vượt trần → 400. SQL bên trong vẫn đi qua `theoLo` | Turso tối đa 900 tham số; chặn yêu cầu khổng lồ |
| Q7 | `ROLLBACK` và `ROLLBACK TO` trong `tx()` luôn kèm `xoaNho()` | #27 |
| Q8 | **Một điều kiện "em đang học"**: 34 chỗ viết tay → `HV_DANG_HOC_SQL(alias)`. Không đổi các chỗ ngữ nghĩa khác: ~15 chỗ `e.status='active' AND s.archived_at IS NULL` (sĩ số lớp, có tính em Tạm dừng) | S6F-a lệch (a); số không đổi |
| Q9 | Việc nhập điểm (Công việc, `listAttempts` nhóm `my_scores`) dùng **cùng luật Nợ điểm**: không tính lớp đã kết thúc (`cl.status = 'active'`, như `scoreDebt.ts:34`). Phép kiểm S6F-a (3e) bỏ điều kiện "chỉ lớp đang hoạt động" | coordinator 01/10 |
| Q10 | "Đề ra PA" (nhóm `no_plan`): **người làm = người phụ trách Case** (`owner_user_id`), `mine = (owner === người xem)`. Case chưa có người phụ trách thì `ownerId: null` như cũ. Dùng cùng khoá `support:{caseId}` với hồ sơ | rà S6F P2 #3 |
| Q11 | "Tuần học thứ n": **một hàm chọn lộ trình** dùng chung cho chương Hành trình, đầu hồ sơ, panel Chuyển lớp một em và cả lớp. Chương đang học (`active`, hoặc `paused` chưa rời) lấy **lộ trình đang chạy**; chương đã rời lấy lộ trình bắt đầu muộn nhất trước ngày vào lớp | rà S6F P2 #1; D17 "một hàm, một số" |
| Q12 | Em ghi danh `paused` **không** mở được panel Chuyển lớp / Lên lớp — **giữ** như hiện tại. Quản lý bấm "Quay lại học" trước. Không làm gì | coordinator 01/10 |
| Q13 | Một luật phân công cho "người giữ việc" (Nợ điểm), "GV chấm" (Lịch Test) và "người khác" (Công việc): `phanCongDangHieuLuc(classIds, ngay)` theo luật của `teacherOf` (đang hiệu lực, `ORDER BY id`, dòng đầu thắng) | vai-a chuyển; ba luật đang lệch |
| Q14 | Đường API web không còn gọi → **xoá route, hàm, trần và phép kiểm cũ**. Danh sách 21 route ở Task 7. Phép kiểm cũ còn đúng ý ("GV không thấy khối QL", "QL chỉ thấy chi nhánh mình", "số = số dòng") → viết lại trên đường còn sống nếu chưa có | Dn9, VN19, S3-23/09, quét an toàn #1, #2, #4, #13, #22. Ít cửa thì ít lỗ |
| Q15 | PATCH `/cycles/:id` đổi target: bắt `lyDo` và đi qua **`reviseTarget`** (ghi `cycle_target_revisions` + Hành trình). Thiếu lý do → 400 "Ghi lý do đổi mục tiêu" | VN25: một đường đổi target |
| Q16 | Thi dự kiến đổi từ ngày → tháng thì xoá `exam_period_id` (tuần cũ không còn đúng) | VN15 |
| Q17 | Luật cận năm (năm nay ± 3) chỉ áp khi giá trị **khác mặc định của lớp** | VN21; cùng luật với `updateCycle` (chỉ kiểm khi đổi) |
| Q18 | `allProgrammes()` nạp **mọi** chương trình, kèm trường `active`. `GET /ref/programmes` (danh sách để chọn) lọc `active` | VN18: sửa một chỗ gốc cho 26 nơi gọi |
| Q19 | Dn8 (chú thích "ký tự nhỏ của Inter", 9 tệp web) → **PR-S3** (chạy sau lượt 2, không chồng UXD) | chỉ là chữ chú thích |
| Q20 | VN27 "Demo H1 thiếu Case chung": **bỏ**. Cố ý: `seed/hvlSeed.ts:19-20` ghi mọi Case có kỹ năng; hàng "Chung" đã kiểm bằng phép kiểm thuần | đã ghi trong mã |
| Q21 | VN31 (`nav.ts` gọi `phamViXuatMt`): **đã có, bỏ**. Hàm này không chạy SQL: `p.assignments` có sẵn, `demoToday()` nhớ theo request và `/demo/session` đã gọi rồi. Task 9 giữ một phép kiểm khoá lại | đo trên mã |
| Q22 | Dn11: bỏ đường `newClass` của `applyTransition`; bỏ cờ `builtin` và nhánh `!builtin` của `sysconfig` (mọi chương trình đều có mẫu, `KHONG_THEM_MA`); bỏ `code`/`route` kiểu cũ của `thongTinLop`; bỏ tham số `programmes?` truyền tay; bỏ điều kiện chết `sysconfig.ts:140`. **Giữ** `ORDER BY … c.code` phụ (UXF-a chủ ý giữ) | `/ponytail-review` của #112 |
| Q23 | UX-C7: nút **"Sửa quyền"** mở chế độ sửa; chân bảng "n thay đổi · Lưu · Huỷ". Lưu gửi **chỉ các ô đã đổi**, trong **một** giao dịch, mỗi ô một dòng nhật ký. Lý do giữ cách này: không ghi đè cả bảng (`AdminPage.tsx:155-160`) | C7 |
| Q24 | UX-C8: Bỏ lưu trữ có **Hoàn tác** (toast `hoanTac`, gọi lại `/students/:id/archive`). Khi hoàn tác, `archived_at` = hôm nay. Ghi `ponytail:`: ngày lưu trữ gốc vẫn nằm trong nhật ký `student.unarchive.before` | C8 |
| Q25 | K1-35, nhãn trạng thái Vận hành theo ngữ pháp C.2: `Chưa bắt đầu` → **Cần làm**; `Tiếp tục xử lý` → **Đang làm**; `Tạm ngưng` giữ; `Dừng hẳn` → **Đã dừng** (không dùng "Đã huỷ", vì việc dừng có lý do); `Đã hoàn thành` → **Xong** | K1.md:95 |
| Q26 | `createAttempt`: lộ trình (`cycleId`) phải thuộc đúng em, nếu không → 400; lớp luôn lấy từ ghi danh đang học, bỏ qua `classId` của thân yêu cầu (quét #1). Sửa ở hàm gốc, không chỉ ở route | lỗi mức Cao |
| Q27 | Câu demo không hàm ý ca học cố định: "Nghỉ buổi sáng" → "Nghỉ học", "Đi muộn 30 phút buổi sáng" → "Đi muộn 30 phút", "thi bù buổi chiều" → "thi bù tuần sau" | luật "không có ca học cố định" |
| Q28 | Pre FOU **không có** Giữa khoá (`shared/domain/normal.ts:168-171`, chỉ có Cuối khoá tuần 5) → nghi ngờ "Pre FOU Giữa khoá rơi cột theo môn" **bỏ**. Task 10 thêm một phép kiểm khoá lại | Pb2-a P2 |

## Global Constraints

- **Quyền:** mỗi chỗ sửa quyền có hai phép kiểm:
  - **phủ định**: người ngoài phạm vi nhận 403, hoặc danh sách rỗng, và không lộ tên hay số;
  - **khẳng định**: người đúng phạm vi vẫn làm được.

  Không nới quyền nào. Không đổi bảng `role_permissions` mặc định.
- **Xoá mã:**
  - grep ghi trong Task phải rỗng (ngoài chỗ đang xoá) trước khi commit;
  - phép kiểm cũ đọc mã chết thì xoá **cùng commit**, ghi tên vào Nhật ký; ý còn đúng thì chuyển sang đường còn sống;
  - số phép kiểm chỉ được giảm đúng bằng số phép kiểm của mã chết đã xoá (ghi cả hai số).
- **SQL (Turso):**
  - chỉ tham số `?`;
  - `IN (…)` qua `theoLo`, tối đa 900 tham số;
  - UNION tối đa 20 vế;
  - không N+1;
  - ghi trong `tx()` (`BEGIN IMMEDIATE`);
  - ngày nghiệp vụ lấy từ `demoToday()`.
- **Tốc độ:**
  - đường có số câu thay đổi → đo lại trong `tests/tocDoDuong.ts`;
  - trần mới = `max(sau+10, ⌈sau×1.3⌉)`, **không nâng trần cũ quá 30 %**;
  - đường **giảm** số câu giữ trần cũ, trừ `/students/{hv}` (Task 9 hạ trần xuống `đo + 10`).
- **Số khớp:** đổi luật "em đang học" hay luật việc nhập điểm không được làm lệch số ô với số dòng. Khung `run.ts:9214-9225` (`n = ids.length = rows.length`) phải còn xanh.
- **Giao diện** (chỉ các tệp web trong bảng file chồng):
  - `/ponytail lite`;
  - không đổi bố cục đã khoá; màu dùng token;
  - kết quả, hạn, người phụ trách 12 px (Q31-4);
  - tuần ghi bằng mã tuần `W2 OCT`, ngày chỉ dùng cho hạn cụ thể và nhật ký;
  - không "ca tối", "đổi ca"; không "Cả hai"; không KPI giáo viên.
- **Phép kiểm:**
  - tạo `server/src/tests/prDon.tests.ts` (`runPrDonTests(t)`), đăng ký **cuối** `run.ts`;
  - ngày demo 14/09/2026 (`seed/data.ts:15`);
  - phép kiểm cũ đổi kỳ vọng thì **sửa**, không xoá (trừ phép kiểm của mã chết).
- **Không bớt** (CLAUDE.md): kiểm dữ liệu nhập, phân quyền, chống mất dữ liệu. Chú thích `ponytail:` được phép, nhưng phải liệt kê trong thân PR.

## Hướng dẫn riêng cho phương án B (Fable)

1. Làm Task 1–3 (quyền, an toàn) **trước**. Mỗi lỗ có một phép kiểm phủ định đỏ trên `main`. Không "sửa" bằng cách ẩn nút ở web: máy chủ phải tự chặn.
2. Xoá mã chỉ khi grep đã rỗng. Gặp nơi gọi lạ (seed, `netlify/functions`, `ops/`) → **dừng**, ghi Nhật ký, không tự quyết.
3. Không tự đổi luật lộ trình, luật SOS, luật Cuối khoá, luật quá hạn. Task 5 chỉ **gom** điều kiện "em đang học" vào hàm chung; số liệu không được đổi, trừ hai điểm đã chốt Q9 và Q10.
4. Gom câu SQL của hồ sơ HV (Task 9): sau mỗi bước gom, so JSON trả về trước và sau phải **giống hệt**.

## Task 0 · Chuẩn bị

- [ ] Ghi **model thật** (đọc ở dòng hệ thống hoặc `Co-Authored-By` mặc định) vào Nhật ký; cũng sẽ ghi vào **thân PR**.
- [ ] Tạo worktree `.claude/worktrees/pr-don-ma-thua-quyen` từ `origin/main`; gõ `/ponytail lite`.
- [ ] Chạy `npm ci` (nếu cần), rồi `npm run check` (log `$env:TEMP\check-don.log`). Ghi **mốc B** (số phép kiểm chính + số phép tốc độ) vào Nhật ký.
- [ ] Tạo `server/src/tests/prDon.tests.ts` với hàm `runPrDonTests(t)` rỗng, đăng ký **cuối** `run.ts` (sau `runPrS6fBTests`, `run.ts:9834`).
- [ ] Đọc nguồn:
  - kiểm kê (c), dòng PR-Dọn, và các bảng B2b/B2c/B3/B4;
  - kế hoạch S6F `:440-460`; `scratchpad/ra-dot6/s6f.md`;
  - bảng "Quét an toàn" ở trên; bảng file chồng của kế hoạch UXF-b (`:125-149`);
  - `routes/index.ts` (cả tệp);
  - `permissions.ts` (`require_`, `can`, `scopeFor`, `classScopeSql`);
  - `db.ts:255-310` (`tx`, `theoLo`);
  - `students/tamDung.ts:7` (`HV_DANG_HOC_SQL`).
- [ ] Commit `PR-Dọn (0): kế hoạch + mốc {B}`.

## Task 1 · Quyền đã biết: `/ref/nguoi`, `duyetNhieu`, `listCases`, nhập bù, `helpName` (quét #6, #7, #8, #11, #25)

**Files:** `server/src/platform/timNguoi.ts` (:87-118) · `server/src/routes/index.ts` (`/ref/nguoi` :315-324) · `server/src/duyet/yeuCau.ts` (`duyetNhieu` :434-450) ·
`server/src/cases/cases.ts` (`listCases` :1781-1808, :1895-1906; `backfillCase` :1142-1196; `reportIssue` :396, :423-425) · `server/src/worklist/mgmttasks.ts` (:487-522) ·
`web/src/modules/cases/QuickReport.tsx` (`sendBackfill` :202-226) · `server/src/tests/prDon.tests.ts`.

- [ ] **Phép kiểm trước** (khối 1, phải đỏ trên `main`):
  - (1a) `/ref/nguoi?studentId={HV chi nhánh CP}`:
    - QL MB gọi → 403 (hoặc danh sách rỗng, không có tên);
    - QL CP gọi → 200, có người;
    - không gửi `trongPhamVi` → vẫn **không** thấy người của chi nhánh khác (Q2).
  - (1b) `duyetNhieu` với `ids: ['abc', 1]`:
    - **GV không có quyền duyệt** gọi → 403, không phải 400 (Q1);
    - QL có quyền gọi → id sai dạng bị bỏ qua, id đúng vẫn được duyệt.
  - (1c) `listCases` lọc theo lớp cũ của em đã chuyển chi nhánh:
    - Case lọc theo lớp nào thì `branchId` trả về và phép kiểm quyền cũng theo đúng lớp đó (Q5);
    - **phủ định:** QL chi nhánh nguồn không thấy Case của em khi lọc theo lớp mới;
    - **khẳng định:** QL chi nhánh mới và GVCN mới vẫn thấy Case cũ của em.
  - (1d) Nhập bù:
    - `POST /cases/backfill` gửi hai lần cùng `idempotencyKey` → **một** Case; lần hai trả lại id cũ (Q3);
    - GV gửi `studentId` của chi nhánh khác → 403, thân lỗi **không** có `duplicateBackfill`.
  - (1e) Tạm ngưng việc Vận hành:
    - `helpName` 121 ký tự → 400 "Tối đa 120 ký tự";
    - `helpName` 120 ký tự → ok;
    - `helpName: 42` → 400, không phải 500.
- [ ] Sửa:
  - `timNguoi.ts`: có `studentId` → gọi `require_` trước `activeClassOf`; lọc chi nhánh theo `scopeFor` luôn bật.
  - `duyetNhieu`: `can(p, REQUEST_APPROVE, { anyScope: true })` chạy **trước** vòng đọc id; id sai dạng đưa vào `failed`.
  - `listCases`: mảnh SQL `lopCuaCase(alias)` dùng chung cho điều kiện `classId`, cho `branchId` trả về và cho `eff_class_id` đưa vào `can()`.
  - `backfillCase`:
    - `require_(SOS_REPORT, { classId, studentId })` ở dòng đầu;
    - nhận `idempotencyKey`; đọc khoá bằng hàm chung `caseDaCoTheoKhoa(key)`, tách từ `reportIssue :423-425`;
    - kiểm trùng chạy **trong** `tx`.
  - `mgmttasks.ts`: `helpName` đi qua `chuTuDo(v, 'Cần ai hỗ trợ', 120)`. Hàm `chuTuDo` đặt ở `util.ts` (Task 3 dùng lại).
  - Web `QuickReport.sendBackfill` gửi `idempotencyKey`, dùng lại khoá `useMemo` có sẵn ở :103.
- [ ] `tocDoDuong`: thêm trần cho `/ref/nguoi?studentId={hv}` nếu chưa có (đo + 10).
- [ ] `npm run check` → commit `PR-Dọn (1): quyền — /ref/nguoi, duyetNhieu 403 trước 400, listCases một lớp cho lọc và quyền, nhập bù kiểm quyền trước và chống gửi đôi, helpName có trần`.

## Task 2 · Quét an toàn: quyền và phạm vi ở các route giữ lại (quét #1, #3, #5, #9, #10, #12, #19, #20)

**Files:** `server/src/fasttrack/attempts.ts` (`createAttempt` :1053-1124; `resultDate` :1613) · `server/src/worklist/highlights.ts:63-74` ·
`server/src/worklist/mgmttasks.ts` (:380-448) · `server/src/routes/index.ts` (`/ref/teachers` :345, `/ref/users` :326, `/classes/:id/progress` :1338, `/cycles/:id/suggested-mocks` :1419,
`/admin/routes` :2225, `/ref/routes` :2224, `/cycles` POST :1276-1280) · `server/src/fasttrack/cycles.ts:122-151` · `server/src/cases/cases.ts:421` ·
các dòng 400→403 ở #12.

- [ ] **Phép kiểm trước** (khối 2; mỗi dòng là một phép kiểm phủ định, đỏ trên `main`):
  - (2a) #1: `createAttempt(QL MB, { studentId: HV MB, cycleId: lộ trình của HV CP, periodId })` → 400 "Lộ trình không thuộc học viên này". Lượt của HV CP không đổi `class_id`, `note` hay dòng kỹ năng. Lớp của lượt mới = lớp đang học, dù thân yêu cầu gửi `classId` khác (Q26).
  - (2b) #3: `/highlights` bằng GV thuần → chỉ lớp GV đó dạy. Thêm `?branchId={chi nhánh khác}` → không ra lớp nào.
  - (2c) #5:
    - QL MB tạo việc Vận hành với `caseIds: [Case chi nhánh CP]` → 403, chi tiết việc không có tên HV chi nhánh khác;
    - `parentTaskId` là việc của chi nhánh CP → 403;
    - `caseIds` 51 phần tử → 400.
  - (2d) #9: QL MB gọi `/ref/teachers?branchId={CP}` → không ra GV nào của CP; `/ref/users` bằng QL MB → chỉ người trong phạm vi.
  - (2e) #10:
    - GV không dạy lớp gọi `/classes/{lớp khác}/progress` → 403;
    - `/cycles/{lộ trình HV chi nhánh khác}/suggested-mocks` → 403;
    - `/admin/routes` bằng GV → 403;
    - `/ref/routes` khi chưa đăng nhập → 401; khi đã đăng nhập, kết quả không có `inUse`.
  - (2f) #12: mỗi chỗ trong danh sách #12, người không có quyền gọi → mã **403**.
  - (2g) #19: `detectedAt` = ngày mai → 400; `resultDate` = ngày mai → 400.
  - (2h) #20: `createCycle` với `route: 'XX'` → 400; route `POST /students/:id/cycles` không trải toàn bộ `req.body`.
- [ ] Sửa theo cột "Sửa tối thiểu" của bảng "Quét an toàn". `createAttempt` sửa ở **hàm gốc** (mọi nơi gọi đều hưởng). Riêng route `POST /attempts` xoá ở Task 7.
- [ ] Kiểm lại web còn chạy: `CatalogAdmin.tsx` đọc `inUse` từ `/admin/routes` (không phải `/ref/routes`). Grep `'/ref/routes'` trong `web/src` trước khi bỏ `inUse`.
- [ ] `tocDoDuong`: `/highlights` và `/ref/teachers` đo lại.
- [ ] `npm run check` → commit `PR-Dọn (2): quét an toàn — lộ trình phải thuộc đúng em, highlights và ref theo phạm vi, việc Vận hành không gắn Case chi nhánh khác, 403 đúng chỗ, không nhận ngày tương lai`.

## Task 3 · Quét an toàn: chia lô, trần mảng, độ dài chữ, chống gửi đôi, ROLLBACK (quét #14, #16, #17 (`:444`), #23, #24, #26, #27)

**Files:** `server/src/keHoach/keHoachTest.ts:887` · `server/src/classes/intake.ts` · `server/src/classes/lenhChuyen.ts:67, :133` · `server/src/cases/cases.ts` (:171, :406, :410, :716, :1142, :1239) ·
`server/src/cases/effectiveness.ts:444` · `server/src/platform/accounts.ts:133-153, :391-397` · `server/src/yThuc/violations.ts:131` · `server/src/duyet/yeuCau.ts:410-432` ·
`server/src/fasttrack/attempts.ts:1702` · `server/src/worklist/mgmttasks.ts:380-393, :442, :565` · `server/src/worklist/meeting.ts:568` · `server/src/routes/index.ts:1827` ·
`server/src/util.ts` (`chuTuDo`) · `server/src/db.ts` (`tx` :265-290).

- [ ] **Phép kiểm trước** (khối 3):
  - (3a) #14: `keHoachTest` nhận 1 200 `studentIds` (có id trùng) → 400 "Tối đa 500"; nhận 600 id trùng thành 300 id → không lỗi; bên trong `IN` qua `theoLo`.
  - (3b) #16: `intake/preview` 201 dòng → 400; `/classes/:id/transition` 501 dòng → 400; `actions` 51 → 400. Không chạm Turso.
  - (3c) #23: `/auth/register` với `fullName` dài 101 ký tự → 400; `phone: {}` → 400, không phải 500.
  - (3d) #24 (quét chuỗi + 3 phép gọi thật): mọi trường trong danh sách #24 đi qua `chuTuDo`. Gọi thật: lý do từ chối duyệt 2 001 ký tự → 400; mô tả vi phạm 2 001 → 400; tiêu đề Case 201 → 400.
  - (3e) #26: `POST /cases/:id/interventions` gửi hai lần cùng `idempotencyKey` (hoặc cùng nội dung trong 10 giây) → **một** PA. Làm tương tự với followups, `/mgmt-tasks`, `/tasks`.
  - (3f) #27: trong `tx()` đọc một giá trị nhớ bằng `nho('k', …)` rồi ném lỗi → sau khi cuộn lại, `nho('k')` đọc lại từ DB (Q7).
  - (3g) #17: `effectiveness.ts:444` nhận 1 200 `sids` → không lỗi "too many SQL variables".
- [ ] Sửa:
  - hàm `chuTuDo(v, ten, toiDa)` ở `util.ts`: kiểm kiểu chuỗi và trần độ dài, ném 400. Dùng ở mọi chỗ #23, #24 (Q4);
  - trần mảng theo Q6;
  - `theoLo` ở `keHoachTest.ts:887` và `effectiveness.ts:444`;
  - chống gửi đôi (#26): bảng đã có cột `idempotency_key` thì dùng cột đó; bảng chưa có thì chặn trùng theo trạng thái (cùng người, cùng đối tượng, cùng nội dung, trong 10 giây → trả bản ghi đã có). **Không thêm cột.** Ghi `ponytail:` "10 giây; thêm cột khoá khi có migrate sau deploy";
  - `tx()`: gọi `xoaNho()` sau `ROLLBACK` (:275) và sau `ROLLBACK TO` (:288).
- [ ] `npm run check` → commit `PR-Dọn (3): quét an toàn — chia lô IN, trần mảng và chữ tự do, chống gửi đôi, ROLLBACK dọn bộ nhớ request`.

## Task 4 · Lộ trình và ngày: VN10, VN15, VN20, VN21, VN25, VN03, và một cách chọn lộ trình cho "tuần học thứ n" (Q11)

**Files:**
- `server/src/fasttrack/absence.ts` (`decideAbsenceMove` :388) · `server/src/fasttrack/cycles.ts` (`updateCycle` :166-300, `reviseTarget` :456);
- `shared/domain/oNgay.ts`, **chỉ** `hop` :17-21 và lời gọi `hop` trong nhánh ngày (:57) — nhánh tuần thuộc UXF-b;
- `server/src/classes/intake.ts` (:212, :289) · `server/src/classes/luatLoTrinh.ts` (:366, :483);
- `server/src/students/hanhTrinh.ts` (:296, :310-312) · `server/src/students/profile.ts` (:478-483, :757) · `server/src/classes/transition.ts` (:180);
- phép kiểm sửa kỳ vọng: `run.ts:1298`, `prKck.tests.ts:136-138`, `prDuyet.tests.ts:292`.

- [ ] **Phép kiểm trước** (khối 4):
  - (4a) VN10: đề nghị dời của **MT lịch sử** (`lich_su = 1`, dựng tay) → `decideAbsenceMove` trả 400, cùng câu báo với `absence.ts:228, :875`.
  - (4b) VN15: lộ trình có `exam_date` 2026-12-07; PATCH `examDate: '2027-01'` → `exam_period_id` = NULL và `examPlanOf` trả loại tháng (Q16).
  - (4c) VN20: `docONgay('01/01/0208', 'ngay', homNay, { toiThieu: '1900-01-01' })` → câu báo cận năm "Không được trước …", **không** phải "Ngày không có thật".
  - (4d) VN21: lớp thường khai giảng 2022-09-05 (năm nay − 4):
    - Thêm HV với `defaultStartWeek` = tuần khai giảng → không lỗi dòng 0;
    - gửi một tuần **khác**, nằm ngoài cận năm → vẫn báo lỗi (Q17).
  - (4e) VN25: `updateCycle(QL, { targetScore: 7 })`:
    - không có `lyDo` → 400;
    - có `lyDo` → có dòng `cycle_target_revisions` và sự kiện Hành trình `target_change` (Q15);
    - GVCN gọi → vẫn 403 như cũ.
  - (4f) Q11: em FT vào MB FT 101 với LT1, sau đó QL mở lộ trình RF (`createCycle`) **không** chuyển lớp → bốn nơi cho **cùng** `tuanHoc`: chương đang học ở Hành trình, đầu hồ sơ, `xemChuyenLop`, `transitionPlan`.
- [ ] Sửa:
  - `decideAbsenceMove`: chặn `attempt.lich_su` ngay sau `loadAttempt`.
  - `updateCycle`:
    - nhánh `examDate` dạng tháng thêm `examPeriodId: null`;
    - đổi `targetScore` → gọi `reviseTarget(p, id, { newTarget, reason: patch.lyDo })`, bỏ `targetScore` khỏi câu UPDATE chung.
  - `oNgay.hop`: đệm năm đủ 4 chữ số (`String(y).padStart(4, '0')`) để luật cận năm báo đúng câu. Không đụng nhánh `tuan`.
  - `intake.ts:212, :289`: chỉ kiểm cận năm khi tuần **khác** `tuanBatDauMacDinh(lớp)`.
  - VN03: thêm một dòng chú thích ở `luatLoTrinh.ts:483`: "FT→FT cũng nhận target: chỉ QL/QT gọi được (CYCLE_EDIT), vô hại — rà #117".
  - Q11: thêm `loTrinhTinhTuan(cycles, { dangHoc, ngayVao })` ở `fasttrack/cycles.ts`.
    - `hanhTrinh.ts:310` gọi với `dangHoc` của chương;
    - `profile.ts` (`dangChay`), `luatLoTrinh.ts:366`, `transition.ts:180` gọi với `dangHoc: true`;
    - xoá `ftCuaNgay` riêng.
- [ ] Sửa kỳ vọng phép kiểm cũ (không xoá):
  - `run.ts:1298` ("Target chốt tại lượt") thêm `lyDo`;
  - `prKck.tests.ts:136-138` thêm `lyDo`;
  - `prDuyet.tests.ts:292` giữ kỳ vọng 403.
- [ ] `npm run check` → commit `PR-Dọn (4): lộ trình — MT lịch sử không dời, thi dự kiến theo tháng bỏ tuần cũ, cận năm đúng chỗ, đổi target có lịch sử; một cách chọn lộ trình cho tuần học`.

## Task 5 · Một luật "em đang học" (Q8), việc nhập điểm theo luật Nợ điểm (Q9), `allProgrammes` (VN18)

**Files (34 chỗ, kiểm ngày 01/10):**
- `worklist/mywork.ts:488, 693, 701, 758, 796, 849, 901, 948, 1044`;
- `keHoach/keHoachTest.ts:85, 98, 139, 238, 596, 604`;
- `duyet/loaiYeuCau.ts:265, 497, 513, 520`;
- `classes/schedule.ts:379, 433, 561`;
- `classes/transition.ts:70, 254` · `classes/lenhChuyen.ts:83, 488`;
- `worklist/metrics.ts:557, 683` · `worklist/meeting.ts:524` · `worklist/tongQuan.ts:216`;
- `normal/regular.ts:285` · `classes/loTrinhTiep.ts:173`;
- `fasttrack/planning.ts:137` (dạng tách; nếu Task 7 đã xoá `bulkPlan` thì kiểm lại chỗ này còn không);
- `worklist/summary.ts:188` — xoá ở Task 7.

Các tệp khác: `fasttrack/attempts.ts` (`listAttempts` :597) · `normal/regular.ts` (`allProgrammes` :52-66) · `routes/index.ts` (`/ref/programmes` :1264) · `tests/prS6fA.tests.ts` (3e).

- [ ] **Phép kiểm trước** (khối 5):
  - (5a) Quét chuỗi `server/src/**` (trừ `tamDung.ts` và `tests/`): không còn mẫu `status\s*=\s*'active'\s+AND\s+s\.archived_at IS NULL` trên bảng `students`. Đỏ trên `main` với 34 chỗ. Chỗ cố ý giữ phải có chú thích `cố ý:` cùng dòng.
  - (5b) **Số không đổi** (Q8): **trước** khi sửa, chụp `n` của mọi chỉ số `CAN_XU_LY` và `/my-work` của QL, GVCN, GVBM trên `main`, ghi vào phép kiểm dạng hằng. Sau khi sửa phải bằng hệt.
  - (5c) Q9, hai đường: lớp **đã kết thúc** còn ô trống của GV L → nhóm `score` ở `/my-work` **không** có lớp đó **và** Nợ điểm cũng không có. Cặp (lớp, đợt) của hai đường bằng nhau **trên mọi lớp**. Phép kiểm S6F-a (3e) bỏ điều kiện "lớp đang hoạt động" (sửa kỳ vọng, không xoá).
  - (5d) VN18: đặt chương trình BE `status = 'inactive'` (dựng tay) → lớp BE vẫn có `mode = 'ratio'` ở `/my-work`, roster và Nợ điểm; `GET /ref/programmes` **không** có BE.
- [ ] Sửa:
  - thay 34 chỗ bằng `${HV_DANG_HOC_SQL('s')}` (đúng alias của từng câu). **Không** đụng ~15 chỗ sĩ số lớp `e.status='active' AND s.archived_at IS NULL`;
  - `listAttempts` nhóm `my_scores` / `chiDangHoc`: thêm `c.status = 'active'`. Một chỗ, mọi nơi gọi đều hưởng;
  - `allProgrammes()`: bỏ `WHERE status = 'active'`, thêm trường `active`; `/ref/programmes` lọc `.active`. Grep nơi duyệt cả map (`[...allProgrammes().values()]`): ngày 01/10 chỉ có `routes/index.ts:1265`.
- [ ] `tocDoDuong`: đo lại `/my-work` mọi vai — số câu không được tăng.
- [ ] `npm run check` → commit `PR-Dọn (5): một luật "em đang học"; việc nhập điểm bỏ lớp đã kết thúc như Nợ điểm; chương trình đã ngưng vẫn xác định được lớp`.

## Task 6 · Việc và người làm: mỗi cặp một nguồn

**Files:**
- `server/src/worklist/mywork.ts`:
  - :655-668 "Đề ra PA";
  - :463-529 `ghi_ket_qua_pa`;
  - :1108-1125 `ky_vong` (UXF-b thêm `muc` vào `href` của khối này — PR merge sau áp lại);
  - :426-436 `ownerOf`;
  - :1055 điều kiện khai bậc.
- `server/src/students/viecHocVien.ts:73` (chỉ đọc).
- `server/src/worklist/metrics.ts` (:385-405 `overdueUpdatePlans`; :551-565 `hvLenFtChuaKyVong`).
- `server/src/worklist/scoreDebt.ts:69-76` (`teacherOf`) · `server/src/fasttrack/attempts.ts:552-571` (`ownersByClass`).
- `server/src/yThuc/xuLy.ts:319` (đặt `khaiDuoc` ở đây; **không** sửa `trangThai.ts`, tệp đó UXF-b đang sửa).
- `shared/domain/tongQuan.ts:136` (`tuanCuaHanGhiKetQua`) · `shared/domain/display.ts:319-334` · `shared/domain/week.ts` · `server/src/platform/thongBao.ts:39-42`.

- [ ] **Phép kiểm trước** (khối 6; mỗi dòng so hai đường):
  - (6a) Q10 "Đề ra PA": Case chưa có PA, người phụ trách là GV A, GV B dạy cùng kỹ năng.
    - `/my-work` của A có dòng `support:{caseId}` với `mine = true`, `ownerId = A`;
    - của B (nếu thấy dòng này) có `mine = false`, `ownerId = A`;
    - hồ sơ em (`viecCuaHocVien`) có cùng khoá, cùng người A.
  - (6b) `ky_vong_dau_ra`: em trong tập có **hai** ghi danh active (dựng tay) →
    - có đúng **một** dòng `ky_vong:{id}`;
    - số dòng = `metricSet('hv-len-ft-chua-ky-vong').n`;
    - lớp ghi trên dòng là **lớp nguồn** của lệnh.
  - (6c) `pa-can-cap-nhat` (chỉ số) và `ghi_ket_qua_pa` (Công việc):
    - em Tạm dừng có PA quá hạn → **không** có ở cả hai;
    - nhóm 3 PA bổ trợ chung quá hạn → chỉ số tính **1**, bằng số dòng Công việc quá hạn;
    - người giữ việc ở hai nơi là cùng một người.
  - (6d) Q13: lớp/môn có hai phân công `active`, một cái `effective_from` ở tương lai → `teacherOf`, `ownersByClass` và `ownerOf` ra **cùng người**.
  - (6e) Thông báo `duyet_tu_choi` của thẻ Case A **vẫn** `con_viec = 1` sau khi cùng người gửi thẻ cùng loại cho **Case B** của cùng em.
  - (6f) Khai bậc: em Tạm dừng → `coTheKhai === false`, và `/my-work` không có việc khai bậc. Hai đường gọi cùng một hàm.
  - (6g) Phép kiểm giữ chỗ: với 8 hạn Thứ Hai liên tiếp, `tuanCuaHanGhiKetQua(han)` = phần tuần của `nhanTuanGhiKetQua(han, …)`.
- [ ] Sửa:
  - "Đề ra PA": `ownerId = c.owner_user_id ?? null`, `owner` = tên người đó, `mine = (ownerId === p.userId)` (Q10).
  - `hvLenFtChuaKyVong` trả `{ id, lopNguonId }`. Dòng việc lấy lớp từ đó, bỏ JOIN `enrollments`; `IN` qua `theoLo`.
  - `overdueUpdatePlans`:
    - JOIN `students` + `HV_DANG_HOC_SQL`;
    - gộp theo `nhom_bo_tro` (lấy id nhỏ nhất);
    - người giữ việc = `COALESCE(performer, sc.owner_user_id)`; Công việc dùng cùng biểu thức.
  - `phanCongDangHieuLuc(classIds, ngay)` (Q13) đặt ở `scoreDebt.ts`; ba nơi gọi chung.
  - `thongBao.ts:39-42`: thêm `AND y2.doi_tuong_loai IS ycd.doi_tuong_loai AND y2.doi_tuong_id IS ycd.doi_tuong_id`. Ghi `ponytail:` "nối thẻ cũ → thẻ mới bằng cột riêng nếu sau này có luồng gửi lại khác đối tượng".
  - `khaiDuoc(em)` ở `yThuc/xuLy.ts`: em có chuỗi vi phạm, chưa xử lý, chưa khai, không Tạm dừng. `xuLy.ts:319` và `mywork.ts:1055` gọi chung.
  - `tuanKetQuaCuaHan(han)` ở `shared/domain/week.ts`; `tuanCuaHanGhiKetQua` và `nhanTuanGhiKetQua` gọi chung.
- [ ] `tocDoDuong`: đo lại `/my-work`, `/tong-quan/quan-ly`, `/metrics/pa-can-cap-nhat?rows=1`.
- [ ] `npm run check` → commit `PR-Dọn (6): việc và người làm — Đề ra PA của người phụ trách Case, kỳ vọng đầu ra một dòng, PA cần cập nhật cùng tập, một luật phân công`.

## Task 7 · Xoá đường API web không còn gọi và hàm chết phía máy chủ (Q14)

**21 route xoá** (web không gọi — grep `web/src` ngày 01/10):
- Tổng quan cũ:
  - `GET /overview` `idx:410-415` (`dashboard.ts`; web chỉ còn `invalidate('/overview')`, vô hại);
  - `GET /summary` `idx:1473-1476` (`summary.ts`);
  - `GET /branch-pulse` `idx:1487-1490` (`branchpulse.ts`; `BranchPulse.tsx:45` gọi `/tong-quan/chi-nhanh`).
- Dời lịch: `GET /move-requests` `idx:752` (lỗi `s.code`, VN19) · `POST /move-requests/:id/decide` `idx:743-750` (cửa thứ hai ngoài hộp Chờ duyệt).
- Quét an toàn:
  - `POST /attempts` `idx:454` (#1) · `POST /attempts/bulk-plan` `idx:465` (#2);
  - `GET /tasks/:id/history` `idx:2005` (#4) · `PUT /cases/:id/owner` `idx:1766` (#13);
  - `GET`/`PUT /prefs` `idx:1579-1580` (#22) · `GET /classes/:id/suggested-weeks` `idx:1233` (#10).
- Không ai gọi:
  - `GET /weekly-rollup` (+ `/ids`) `idx:546, :557` · `GET /attempts/no-plan` `idx:440`;
  - `GET /classes/:id/score-sheet` `idx:841` · `GET /mgmt-tasks/mine` `idx:2034`;
  - `PUT /cases/:id/issues` `idx:1587`;
  - `POST /interventions/:id/respond` `idx:1654` · `POST /interventions/:id/complete` `idx:1710`;
  - `POST /attempts/:id/skills/:skill/sit` `idx:714` · `GET /ref/issue-taxonomy` `idx:1773`.

**Grep bắt buộc trước khi xoá (dán kết quả vào Nhật ký):**
```bash
# mỗi đường: không còn nơi gọi ở web (kể cả chuỗi ghép `${goc}/…` — xem HopThaoTacMt.tsx:80-98: chỉ week/restore/deadline/skip)
grep -rnE "overview'|/summary|branch-pulse|move-requests|bulk-plan|/history|/prefs|suggested-weeks|weekly-rollup|no-plan|score-sheet|mgmt-tasks/mine|/issues|/respond|/complete|/sit'|/owner|issue-taxonomy" web/src
# hàm dịch vụ đi kèm: còn nơi gọi nào ngoài route?
grep -rnE "dashboardSvc|overview\(|branchSummary|summaryColumns|SUMMARY_PRESETS|branchPulse|peopleOf|openMoveRequests|moTaDoiLan2|bulkPlan|taskHistory|setOwner|allPrefs|setPref|getPref|weeklyRollup|weeklyDrill|noPlanQueue|scoreSheet|myMgmtTasks|issueSkillRows|issueBoardCases" server/src shared netlify
grep -rnE "summary\.approval|classAlerts|demCanQuanLyTheoLop|WorkQueue" server/src web/src shared
```
Kết quả ngày 01/10 (planning):
- `summary.approval` không ai đọc;
- `classAlerts` (`schedule.ts:584`), `demCanQuanLyTheoLop` (`normal/cuoiKhoa.ts:567`), `WorkQueue` (`StudentsPage.tsx:387`) chỉ có dòng định nghĩa;
- `moTaDoiLan2` chỉ `prMt.tests.ts:450` gọi;
- `prefs` chỉ route + `run.ts:3607-3611` + `tocDoDuong` dùng;
- `createAttempt` **giữ** (`keHoachTest.ts:561`, seed dùng).

Hàm dịch vụ chỉ xoá khi grep không còn nơi gọi ngoài route và phép kiểm.

- [ ] **Phép kiểm trước** (khối 7, quét chuỗi, đỏ trên `main`): 21 route không còn trong `routes/index.ts`; các tên hàm xoá không còn trong `server/src` (trừ `tests/prDon.tests.ts`), `web/src`, `shared`.
- [ ] Xoá:
  - 21 route ở trên; import thừa (`dashboardSvc`, `summarySvc`, `pulseSvc`, `prefSvc`, `weeklyRollup`, `weeklyDrill` nếu hết dùng);
  - tệp `worklist/dashboard.ts`, `worklist/summary.ts`, `worklist/branchpulse.ts`, `platform/prefs.ts`;
  - các hàm đi kèm có grep rỗng;
  - `mywork.ts:1253` (`approval: demYeuCau(p).cho` — `/my-work` bớt được câu SQL) và `:1320`;
  - `classAlerts`, `demCanQuanLyTheoLop`; ở web: `WorkQueue` trong `StudentsPage.tsx` cùng import thừa;
  - trần trong `tocDoDuong.ts` của các đường đã xoá (`:45, :55, :283-284, :297-298`, `/prefs`, `/mgmt-tasks/mine`…).
- [ ] Phép kiểm cũ:
  - Xoá các khối đọc mã chết:
    - `run.ts`: import `:57, :68, :70`; dashboard `:910-955`; summary `:3519, :3533, :4040-4049, :4376, :4946, :5312, :5645`; branchPulse `:3617-3629, :5577-5659, :9250-9344`; prefs `:3607-3611`;
    - `luatMayChu.tests.ts:273-278`; `prMt.tests.ts:233-249`;
    - `prMt.tests.ts:450` đổi sang gọi `chuTheDoiLan2` trực tiếp;
    - `prUxfA.tests.ts:486` bỏ hai tệp đã xoá khỏi danh sách.
  - Các phép kiểm gọi route đã xoá qua HTTP (`/attempts/no-plan` ở `run.ts`, `/owner` ở `prMon.tests.ts` và `xoaDuLieu.tests.ts`, `/issues` ở `prS3f.tests.ts`, `/complete` ở `dieuChinhPa.tests.ts` và `prS3f.tests.ts`, `/sit` ở `luatMayChu.tests.ts`):
    - hàm dịch vụ còn dùng ở chỗ khác → đổi phép kiểm sang gọi hàm trực tiếp;
    - hàm đã xoá → xoá phép kiểm.
  - **Trước khi xoá mỗi khối:** ý còn đúng ("GV không thấy bảng QL", "QL chỉ thấy chi nhánh mình", "số trên bảng = số dòng") đã có phép kiểm trên `/tong-quan/chi-nhanh` chưa? Chưa thì viết lại một phép kiểm trong `prDon.tests.ts`.
  - Ghi danh sách tên phép kiểm đã xoá và đã chuyển vào Nhật ký.
- [ ] `npm run check` → commit `PR-Dọn (7): xoá 21 đường API web không gọi (gồm /attempts, /prefs, /tasks/:id/history, Tổng quan cũ) và hàm không ai gọi`.

## Task 8 · Gọn mã không đổi hành vi: Dn1, Dn10, Dn11, Dn12, `CaseRoutePage`, chú thích migrate

**Grep bắt buộc:**
```bash
grep -rnE "ACADEMIC_SUPPORTS|OPS_POLICIES" server/src web/src shared            # Dn1: chỉ shared/domain/cases.ts:1075,1083
grep -rnE "\bcanQl\b" shared/domain/cuoiKhoa.ts server/src web/src             # Dn10: bí danh :38,:77; prLt2b.tests.ts:31 đọc
grep -rnE "newClass" server/src web/src                                         # Dn11: transition.ts:206,236; tests keHoachTest/lenLop/prLop/run.ts
grep -rnE "builtin|programmes\?:" server/src/platform/sysconfig.ts server/src/classes/schedule.ts web/src/modules/platform/CatalogAdmin.tsx
grep -rnE "type TruongDeXuat|HAN_XAC_NHAN_NGAY" server/src web/src shared       # Dn12
grep -rnE "hoc-thuat/case/|CaseRoutePage" server/src web/src shared            # mywork.ts:529,664,737,786,1024; duongHoSo.ts:51-53; CasePanel.tsx:27; App.tsx:135
```
- [ ] **Phép kiểm trước** (khối 8: quét chuỗi + một phép kiểm dữ liệu):
  - (8a) Không còn `ACADEMIC_SUPPORTS`, `OPS_POLICIES`; không còn `canQl` trong `shared/domain/cuoiKhoa.ts`; không còn `newClass` trong `transition.ts`; không còn `builtin` trong `sysconfig.ts`.
  - (8b) Seed: mọi `sos_cases` đều có học viên (`COALESCE(student_id, lượt.student_id) IS NOT NULL`). Phép này khoá lại cho bước bỏ đường dự phòng.
  - (8c) Máy chủ không sinh `href` `/hoc-thuat/case/` (quét `mywork.ts`); `duongCase` luôn dẫn tới hồ sơ HV.
- [ ] Sửa:
  - Dn1: xoá hai hằng.
  - Dn10: bỏ bí danh `canQl` (phép kiểm đọc `canQuanLy`). Trường `canQl` ở `prHvl.tests.ts:545` là của **hồ sơ lớp** (`classes.ts:723`) — trường khác, giữ.
  - Dn11 (Q22):
    - bỏ đường `newClass` (`TransitionInput.newClass`, :236-240); phép kiểm đang gửi `newClass` đổi sang tạo lớp trước bằng `taoLop`, như web;
    - `sysconfig.ts`: bỏ `builtin`, nhánh `!builtin` và điều kiện chết `:140`;
    - `thongTinLop.ts`: bỏ `code`/`route` kiểu cũ;
    - bỏ tham số `programmes?` của `classProgressMany` / `missingForClasses`.
  - Dn12:
    - `TruongDeXuat` chỉ còn một bản ở `shared/domain`; `deXuatSua.ts:15` và web `DeXuatSuaPanel.tsx:14` import từ đó;
    - `HAN_XAC_NHAN_NGAY` bỏ `export` (chỉ dùng trong `sosV4.ts`);
    - `goiYGanDay`: nguồn không ghi gợi ý cụ thể → **bỏ**, ghi Nhật ký.
  - `CaseRoutePage` (`CaseBoardPage.tsx:13-31`):
    - chỉ còn chuyển hướng về hồ sơ HV (bỏ nhánh breadcrumb + `NganCase`);
    - bỏ đường dự phòng `/hoc-thuat/case/` ở `mywork.ts` (5 chỗ) và `duongHoSo.ts:51-53`;
    - **giữ** route `App.tsx:135` để link cũ trong thông báo / email vẫn mở được;
    - sửa `prPb2a.tests.ts:195` theo.
  - `migrate.ts:484`: bỏ câu "LUÔN ĐỨNG CUỐI", ghi thứ tự thật (CT đứng trước Pb2-b).
- [ ] `npm run check` → commit `PR-Dọn (8): gọn mã — hằng và bí danh thừa, đường newClass, builtin, TruongDeXuat một bản, Case luôn mở ở hồ sơ HV`.

## Task 9 · Tốc độ: hồ sơ HV ≤ 90 câu, khoá trần lớp thường, tải trang đầu, `doc-het`, khoá `latestAttempts`

**Files:** `server/src/students/profile.ts` (:502-957) · `server/src/cases/cases.ts` (`skillSupportBoard` :2108-2131) · `server/src/classes/loTrinhTiep.ts` (`lopHocCua` :198-221) ·
`server/src/yThuc/access.ts:23` (`activeClassOf`) · `server/src/fasttrack/cycles.ts` (`currentCycle`, `cycleById`) · `server/src/worklist/danhGia.ts:160` ·
`server/src/tests/tocDoDuong.ts` (:440-461, :480-483, :529-530, :547-549, :575-578, :643-679) · `server/src/tests/tocDo.run.ts` (:543-584).

- [ ] **Phép kiểm trước** (khối 9):
  - (9a) `/students/{hv}` ở mọi vai ≤ **90** câu (đỏ trên `main`: 96–99). Trần mới ở `tocDoDuong.ts:480-483` = `đo + 10`, không quá 100.
  - (9b) **Dữ liệu giống hệt:** JSON `/students/{hv}` của 4 vai × 3 em (FT, lớp thường, em Tạm dừng) trước và sau khi gom phải bằng nhau. Chụp trên `main` vào tệp tạm của phép kiểm, so sâu.
  - (9c) Mọi khoá trong `TRAN` khớp một cặp (vai × đường) **đã đo**. Đỏ trên `main` với 27 khoá cũ: `/classes/5/…`, `/cases?classId=5`, `/ke-hoach-test/thuong/5`, `/students/1/chuyen-lop?toClassId=5`.
  - (9d) `POST /notifications/doc-het` có trần trong `TRAN_GHI_LO` (đo + 10).
  - (9e) **Tải trang đầu bắt được route mới** (rà S6F P2 #2):
    - quét chuỗi các tệp web của cây Tổng quan: `OverviewPage.tsx` cùng mọi tệp nó `import` trong `web/src` (đệ quy), cộng `App.tsx` và `Header.tsx`;
    - mọi đường `useApi(` / `api.get(` gọi **khi mở trang** phải có trong `TAI_TRANG[vai].urls`, hoặc nằm trong danh sách "gọi khi bấm" có ghi lý do;
    - đỏ trên `main` nếu danh sách thiếu đường nào.
  - (9f) VN31, khoá lại (Q21): số câu `/demo/session` khi `navOf` có và không có `xuatMt` bằng nhau.
  - (9g) `latestAttempts`: khoá nhớ dài tối đa 80 ký tự với 2 000 id (C-khác).
- [ ] Gom câu `studentProfile` theo danh sách chỗ đọc trùng (kiểm 01/10, ước bớt ≥ 10 câu). **Đo sau từng bước** và ghi Nhật ký:
  - (a) Điểm từng lượt:
    - nạp một lần cho cả lô sau `profile.ts:548` (`loadBundle`, hoặc nới câu `attempt_skills` :558), rồi `datNho('diem:'+id)` / `datNho('bo-mon:'+id)`;
    - nhánh lớp thường đọc qua `scoresOf`, bỏ đọc thẳng `assessment_scores` ở `typedResult` :71-82 và `checkpointView` :115;
    - bớt khoảng 2N−2 câu (N = số lượt).
  - (b) Dòng `students` đang đọc 3 lần (`profile.ts:502`, `cases.ts:2108`, `loTrinhTiep.ts:198`) → `nho('hv:'+id)`. Bớt 2.
  - (c) `activeClassOf` bọc `nho`; JOIN ghi danh ở `:523` thêm `c.programme_code, c.is_fast_track` cho `cuoiKhoaEm` (:762). Bớt 2–3.
  - (d) `currentCycle` / `cycleById` lấy từ `allCycles`; `cases.ts:2131` dùng lộ trình đã có. Bớt 2.
  - (e) `report_periods` theo `start_period_id` chỉ đọc một lần (đang đọc ở :727 và :885). Bớt 1.
  - (f) `lopHocCua`: bỏ `tiepTheo` / `nhacLoTrinh`, vì web không đọc (`StudentDetailPage.tsx:183,207,212` chỉ đọc `chiXem`, `quyen`). Bớt 3–5. (Badge ở hồ sơ lớp theo Câu 2 — Task 10.)
  - (g) Baseline (:608) tìm trong `attemptRows` trước; Mini Test (:735 + :742) gộp thành một câu. Bớt 1–2.
  - (h) `programmeCodeOfCycle(selected.id)` (:868, :871, :957) chỉ tính một lần.
- [ ] Đổi khoá `/classes/5/…` sang id `{lopThuong}` thật (6) và đo lại 27 khoá. Thêm phép kiểm (9c) vào `tocDo.run.ts`: không thấy khoá đã đo thì báo đỏ, không lặng lẽ bỏ qua như `:560`.
- [ ] `latestAttempts`: khoá nhớ `luot-moi:${pick}:${today}:${sha1(ids.join(','))}` (`createHash` của `node:crypto`). Kết quả không đổi.
- [ ] (9e) **Không** đổi web sang hằng dùng chung: đường gọi có tham số động, và các tệp web này thuộc UXD. Ghi `ponytail:` ở `tocDoDuong.ts:670`: "phép quét bắt route mới; chuyển sang hằng dùng chung khi Tổng quan ổn định".
- [ ] `npm run check` → commit `PR-Dọn (9): hồ sơ HV ≤ 90 câu, trần lớp thường đo đúng lớp, tải trang đầu bắt route mới, trần doc-het`.

## Task 10 · Seed demo và badge "lộ trình tiếp theo" (theo Câu 2)

**Files:** `server/src/seed/students.ts:769` · `server/src/seed/sosV3Seed.ts:148` (`hanPa` :88-90) · `server/src/seed/yThucSeed.ts:111, 208, 240, 303` · `server/src/seed/duyetSeed.ts:96`.
Nếu Câu 2 = B, thêm:
- `server/src/classes/classes.ts` (:91-120 `soChuaLoTrinhTiep`, :661 `chuaLoTrinh`);
- `server/src/classes/loTrinhTiep.ts` (:162-182 `demChuaLoTrinh`);
- `server/src/worklist/metrics.ts` (`hv-chua-co-lenh-chuyen`);
- `shared/domain/hocVienLop.ts:185, :219-225` (chữ tooltip). UXF-b sửa `hocVienLop.ts:308` — khác dòng.

- [ ] **Phép kiểm trước** (khối 10):
  - (10a) Sau seed, mọi `case_interventions.action_due` đều là **Thứ Hai** (`strftime('%w', action_due) = '1'`). Đỏ trên `main` ở hai PA:
    - PA 15 (`students.ts:769`): 20/09 là Chủ nhật;
    - PA cháu R (`sosV3Seed.ts:148`): 12/09 là Thứ Bảy.
  - (10b) Quét chuỗi seed: không còn "buổi sáng", "buổi chiều", "ca tối", "đổi ca" trong câu hiện trên màn (Q27).
  - (10c) Q28: không có lượt `kind = 'progress'` nào thuộc lớp PREFOU (khoá lại).
  - (10d) Theo Câu 2:
    - **B:** số trên badge "n HV …" của lớp = `metricSet('hv-chua-co-lenh-chuyen', { classId }).n` = số em có cờ ở bảng học viên của lớp; em có lệnh `cho` → không có cờ;
    - **A:** badge và cờ không còn;
    - **C:** ba nguồn đếm (a)(b)(c) dùng cùng một hàm.
- [ ] Sửa seed:
  - `students.ts:769`: `followupDue: '2026-09-21'`;
  - `sosV3Seed.ts:148`: hạn = `addDays(DEMO_DATE, -7)` (07/09), sửa chú thích thành "quá hạn 1 tuần";
  - câu vi phạm theo Q27; `duyetSeed.ts:96` thành "em thi bù tuần sau";
  - trước khi đổi, grep phép kiểm đọc các chữ / ngày này: `grep -rn "2026-09-20\|buổi sáng\|buổi chiều" server/src/tests`.
- [ ] Badge theo Câu 2 (khuyên **B**):
  - `soChuaLoTrinhTiep` và `chuaLoTrinh` lấy từ **một** tập `hv-chua-co-lenh-chuyen`, chia theo lớp;
  - chữ "n HV chưa có lệnh chuyển lớp", tooltip "Quản lý ra lệnh ở ⋮ Chuyển lớp cả lớp";
  - bỏ `demChuaLoTrinh` nếu hết nơi gọi;
  - `LoTrinhTiepPanel` giữ nguyên.
- [ ] `npm run check` → commit `PR-Dọn (10): seed hạn Thứ Hai, câu demo không hàm ý ca học; badge lớp đếm em chưa có lệnh chuyển lớp`.

## Task 11 · Form: `useLoiForm` cho 7 panel, 2 hộp Vận hành chuyển thành panel (O5), impeccable `harden`

**Files:** `web/src/modules/platform/AccountsAdmin.tsx` · `platform/CatalogAdmin.tsx` · `students/IntakePanel.tsx` (UXD không sửa) · `students/StudentPlanPanel.tsx` (UXF-b sửa một dòng :181-182) ·
`classes/ClassProgressPanel.tsx` (UXF-b sửa một dòng :94) · `worklist/ManagerTasks.tsx` · `worklist/MgmtTasksPage.tsx` (`UpdateDialog` :428-450 và `SuaViec` :514-535, đang dùng `Modal`, chuyển sang `KhungPanel`).

- [ ] **Phép kiểm trước** (khối 11, quét chuỗi như `nenGiaoDien.tests.ts`):
  - cả 7 tệp đều `import { useLoiForm`;
  - mỗi `<Field` có ô bắt buộc đều mang `lf.o(` / `aria-invalid`;
  - `MgmtTasksPage.tsx` không còn `<Modal`.
- [ ] Mỗi panel làm theo mẫu `TeacherAssignPanel.tsx` / `DeXuatSuaPanel.tsx`:
  - luật thiếu đặt ở `shared` hoặc ngay tại chỗ;
  - `lf.o(loi, khoa)` trên ô, `lf.conThieu(loi)` ở chân form;
  - nút chính gọi `lf.bam()` rồi mới gửi.

  **Máy chủ vẫn kiểm như cũ** (không bớt kiểm ở máy chủ).
- [ ] `UpdateDialog`, `SuaViec` chuyển sang `KhungPanel` (như `NganViecVanHanh` :288), giữ nguyên chữ và nút.
- [ ] impeccable **`harden`** trên 7 panel: lỗi hiện dưới ô, focus vào ô lỗi đầu tiên, Enter không gửi khi còn thiếu.
- [ ] `npm run check` → commit `PR-Dọn (11): useLoiForm cho 7 panel; hộp Cập nhật / Sửa việc Vận hành thành panel`.

## Task 12 · Vận hành: nhãn trạng thái theo ngữ pháp C.2 (K1-35/V4), một cửa giao việc (K1-36, theo Câu 1), Tutor ở `ChonViec`. impeccable `clarify` + `polish`

**Files:** `shared/domain/worklist.ts:58-70` (`TASK_PROGRESS_LABEL`) · `web/src/modules/worklist/MgmtTasksPage.tsx` (`KIND` :41-44, `<Status>` :248, :294, :360, :383) ·
`web/src/ui/ui.tsx:511-519` (`NhanTrangThai`, chỉ đọc) · `MeetingPage.tsx` (`ChonViec` :392-400).
Nếu Câu 1 = A, thêm: `web/src/modules/worklist/ManagerTasks.tsx`, `MeetingPage.tsx` (:124), `MgmtTasksPage.tsx` (`CreateTask` :598).

- [ ] **Phép kiểm trước** (khối 12):
  - (12a) `TASK_PROGRESS_LABEL` đúng Q25 (`Cần làm · Đang làm · Tạm ngưng · Đã dừng · Xong`). Quét chuỗi web: không còn "Tiếp tục xử lý", "Chưa bắt đầu", "Dừng hẳn" (trừ lịch sử cũ).
  - (12b) `MgmtTasksPage.tsx` dùng `NhanTrangThai` cho cột trạng thái (quét chuỗi).
  - (12c) Nếu Câu 1 = A:
    - chỉ còn **một** nút "+ Giao việc", ở Vận hành;
    - `MeetingPage.tsx` không còn `<ManagerTasks`, thay bằng link "Giao việc ở Vận hành";
    - form có lựa chọn "Việc chi nhánh" / "Giao GV theo lớp + kỹ năng", gọi đúng API cũ (`/mgmt-tasks`, `/tasks`);
    - máy chủ không đổi.
  - (12d) Quản trị mở `ChonViec` cho đơn vị TUTOR (`branchId` null) → chỉ thấy việc của chi nhánh đang xem ở Báo cáo đơn vị.
- [ ] Sửa theo Q25 và Câu 1. `ChonViec` nhận `branchId` của trang khi đơn vị không có chi nhánh.
- [ ] impeccable **`clarify`** (chữ nhãn trạng thái, nút "+ Giao việc", lựa chọn loại việc) + **`polish`** (cột trạng thái thẳng, chữ 12 px).
- [ ] `npm run check` → commit `PR-Dọn (12): Vận hành — nhãn trạng thái chung, một cửa Giao việc, việc Tutor theo chi nhánh đang xem`.

## Task 13 · Quản trị và lưu trữ: bảng quyền có chế độ Sửa (UX-C7), Bỏ lưu trữ có Hoàn tác (UX-C8), panel Kết thúc lớp (K2-35). impeccable `clarify` + `polish`

**Files:** `web/src/modules/platform/AdminPage.tsx` (`PermCell` :153-194) · `server/src/platform/sysconfig.ts` (`setRolePermission`) · `server/src/routes/index.ts:2070-2077` ·
`web/src/modules/students/LuuTruPage.tsx` (:58-64 `boLuuTru`; `opacity-70` ở :100, :119) · `server/src/classes/xoaKetThucLop.ts` (:36-56, :70, :101) · `web/src/modules/classes/XoaKetThucLopPanel.tsx` (:98).

- [ ] **Phép kiểm trước** (khối 13):
  - (13a) Q23: `PUT /admin/role-permissions` nhận `thayDoi: [{ roleKey, permissionKey, granted }]` (tối đa 200 dòng):
    - ghi trong **một** giao dịch, mỗi dòng một `writeAudit`;
    - một dòng sai khoá → 400 và **không** dòng nào được ghi;
    - người không phải Quản trị → 403;
    - dạng một ô cũ vẫn nhận.
  - (13b) Quét chuỗi `AdminPage.tsx`: có "Sửa quyền", "Lưu", "Huỷ"; ô không bấm được khi chưa vào chế độ sửa.
  - (13c) Q24: quét chuỗi `LuuTruPage.tsx` có `hoanTac(`. Máy chủ: `unarchive` rồi `archive` → em trở lại Lưu trữ (đã có sẵn, khoá lại).
  - (13d) K2-35, câu chặn khi còn em đang học:
    - lớp FT → **không** có "chuyển tiếp lớp", mà là "chuyển lớp từng em hoặc chuyển nhiều em";
    - lớp thường → "ra lệnh chuyển lớp cả lớp";
    - có lệnh `cho` → `conTreo` có "n em có lệnh chuyển lớp chờ thi hành {W..}" (mã tuần).
  - (13e) `LuuTruPage.tsx` không còn `opacity-70`.
- [ ] Sửa theo Q23, Q24 và (13d). Chữ tuần dùng `tuanLich`.
- [ ] impeccable **`clarify`** (chữ chế độ sửa, tóm tắt "n thay đổi", câu ở panel Kết thúc lớp) + **`polish`** (bảng quyền sáng/tối; ô đã đổi có viền token, không chỉ dựa vào màu).
- [ ] `npm run check` → commit `PR-Dọn (13): bảng quyền có chế độ Sửa + Lưu một lần; Bỏ lưu trữ có Hoàn tác; Kết thúc lớp nói đúng loại lớp và lệnh chờ`.

## Task 14 · Việc nhỏ còn lại: `deadlineView` theo giờ VN, kéo thả ở `BangChung`, nhận xét W/S ở dòng thời gian lượt (Dn7)

**Files:** `shared/domain/display.ts` (`deadlineView` :341-370) · `web/src/ui/BangChung.tsx` (:132-137) · `server/src/fasttrack/attempts.ts` (nơi dựng `scoreHistory`; grep `scoreHistory`) ·
`web/src/modules/fasttrack/DongThoiGianLuot.tsx` (`LichSuDiem`, :50-53).

- [ ] **Phép kiểm trước** (khối 14):
  - (14a) `deadlineView({ due: '2026-09-21T18:30:00Z', today: '2026-09-22', … })` → **không** quá hạn. Lý do: 18:30Z là 01:30 ngày 22/09 giờ VN, hạn rơi vào ngày 22. Đỏ trên `main` vì cắt chuỗi theo UTC ra 21/09.
  - (14b) Quét chuỗi `BangChung.tsx`: `onDragLeave` chỉ tắt khi rời khung ngoài (`e.currentTarget.contains(e.relatedTarget)`, hoặc bộ đếm vào/ra).
  - (14c) Dn7: lượt FT có `score.nhan_xet` trong nhật ký → lịch sử lượt (`scoreHistory`) có dòng `kind: 'nhan_xet'` (người, lúc, môn, trước → sau rút gọn còn 80 ký tự).
- [ ] Sửa:
  - một hàm `ngayVn(iso)` (UTC+7) đặt trong `shared`, cạnh `xuatMt.ts:221`, dùng cho `deadlineView`;
  - `BangChung` theo (14b);
  - Dn7: máy chủ thêm dòng; web `DongThoiGianLuot` thêm loại "Nhận xét" (dùng biểu tượng SVG `diem` có sẵn).
- [ ] `npm run check` → commit `PR-Dọn (14): hạn theo ngày giờ VN, kéo thả tệp không nhấp nháy, nhận xét hiện ở dòng thời gian lượt`.

## Task 15 · Bấm thử theo vai, 1440 + 375, sáng/tối; impeccable `audit` + `polish`; `/ponytail-review`; mở PR

- [ ] Cổng gộp `origin/main` (nếu UXD / UXF-b đã merge) → gỡ theo bảng file chồng → `npm run check`.
- [ ] Chạy các mục **KIỂM** theo vai: QL (Nguyễn Khánh Vy, id 2), GVCN, GVBM, Quản trị (id 1). Ảnh lưu `thiet-ke/anh/pr-don/{muc}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] impeccable **`audit`** trên các màn web đã chạm (cột "PR-Dọn sửa" của bảng file chồng), rồi **`polish`** cả sáng **và** tối.
- [ ] `/ponytail-review`. Liệt kê mọi chú thích `ponytail:` mới trong thân PR.
- [ ] Kiểm không còn `npm run check` treo; tắt 4177/5377.
- [ ] Mở PR (không draft, không merge). Thân PR gồm:
  - **model thật** + effort;
  - bảng mục (mã → Task → phép kiểm → đạt), có cả bảng "Quét an toàn";
  - mốc B → số phép kiểm cuối; **danh sách phép kiểm đã xoá cùng mã chết** và phép kiểm đã chuyển chỗ;
  - trần tốc độ đã đổi, đặc biệt `/students/{hv}`;
  - "Chuyển cho PR khác";
  - các chú thích `ponytail:`.

## Câu hỏi cho chủ sản phẩm (3)

> **ĐÃ CHỐT 01/10:** Câu 1 = A — một nút "+ Giao việc" ở Vận hành (chủ sản phẩm) · Câu 2 = B — badge đếm "em chưa có lệnh chuyển lớp", cùng tập với Cần xử lý (planning) · Câu 3 = B — **tách**: **PR-Dọn-a** (máy chủ, Task 0–10 + 15) chạy **lượt 2**, nhánh `pr-don-a-may-chu`, cổng 4177/5377, log `check-don-a.log`; **PR-Dọn-b** (web, Task 0, 11–14 + 15) chạy **lượt 3** cùng S3, nhánh `pr-don-b-giao-dien`, cổng 4187/5387, log `check-don-b.log` (planning).

**Câu 1 — Ba cửa "giao việc" (K1-36).** Hiện có ba nơi tạo việc cho cùng một ý "giao việc cho một người":
- "+ Công việc" ở Vận hành;
- "+ Giao việc" ở Báo cáo đơn vị (việc giao GV theo lớp + kỹ năng, toả thành PA của từng em);
- việc phối hợp TVV.

Chọn một:
- **A.** Một nút "+ Giao việc" ở Vận hành. Trong form chọn "Việc chi nhánh" hay "Giao GV theo lớp + kỹ năng". Báo cáo đơn vị chỉ còn một link. Máy chủ không đổi; khoảng 1 Task web.
- **B.** Giữ hai nút, chỉ đổi chữ cho rõ: "+ Việc vận hành" và "+ Giao việc cho lớp".
- **C.** Hoãn sau deploy.

**Khuyên A.** Đúng đặc tả K1-36, một cửa nên dễ học, chi phí nhỏ. Kế hoạch viết theo A (Task 12).

**Câu 2 — Badge "n HV cần xếp lớp tiếp" (chưa có lộ trình tiếp theo) ở hồ sơ lớp và Học viên & Lớp.** VAI-a đã bỏ việc GVCN "Ghi lộ trình tiếp theo". Nay Quản lý quyết bằng **lệnh chuyển lớp**. Hiện badge đếm theo ba cách lệch nhau.

Chọn một:
- **A.** Bỏ hẳn badge và cờ ở bảng học viên.
- **B.** Giữ badge, nhưng đếm **em chưa có lệnh chuyển lớp**: cùng tập với dòng Cần xử lý "em chưa có lệnh chuyển lớp", chữ "n HV chưa có lệnh chuyển lớp".
- **C.** Giữ nguyên ý cũ, chỉ sửa ba cách đếm về một.

**Khuyên B.** Số trên badge bằng số khi bấm và bằng Tổng quan, đúng việc Quản lý phải làm. Panel "Lộ trình tiếp theo" của GVCN vẫn giữ để ghi hướng. Kế hoạch viết theo B (Task 10).

**Câu 3 — Một PR hay tách hai?** Kế hoạch có **16 Task** (0–15), vượt ngưỡng ~14. Mỗi lần `npm run check` mất khoảng 13 phút.
- **A.** Một PR-Dọn ở lượt 2, như kế hoạch.
- **B.** Tách hai PR:
  - **PR-Dọn-a** (máy chủ: Task 0–10, 15) chạy ngay ở lượt 2;
  - **PR-Dọn-b** (web: Task 0, 11–14, 15) chạy ở **lượt 3**, song song PR-S3.

  Hai PR dùng chung kế hoạch này: phép kiểm `prDonA.tests.ts` / `prDonB.tests.ts`, nhánh `pr-don-a-may-chu` / `pr-don-b-giao-dien`, log `check-don-a.log` / `check-don-b.log`. Dọn-b dùng cổng 4177/5377 sau khi Dọn-a xong. Tệp chung có kiểm soát: chỉ `MgmtTasksPage.tsx` (Dọn-b) với C-chữ của S3 (`:222`, khác dòng).

**Khuyên B.**
- Phần quyền / an toàn lên sớm.
- Lượt 2 không phải chạy 4 phiên `npm run check` cùng lúc (máy đã sập khi 4 phiên chạy song song: Nhật ký UXF-a Task 5, S6F-b Task 13).
- Phần web của Dọn-b chạy sau khi UXD và UXF-b đã merge, nên không phải gộp tay các dòng UXF-b sửa trong `StudentPlanPanel`, `ClassProgressPanel`, `StudentsPage`.

## Đã kiểm, bỏ (không làm)

| Mục | Kết quả kiểm trên `main` 01/10 |
|---|---|
| VN31 `nav.ts` gọi `phamViXuatMt` | Đã có: không thêm câu SQL (Q21). Chỉ thêm phép kiểm khoá lại (9f) |
| VN27 Demo H1 "Case chung" | Cố ý (`hvlSeed.ts:19-20`) (Q20) |
| Rà #121 lần 2: `cycles.ts:160-173` gửi lại `examDate` cũ vẫn 400 | Đã có: `cycles.ts:183` chỉ kiểm cận năm khi giá trị đổi |
| `queryPlans`, `raLenh` gửi `IN` không chia lô | Đã chia lô (`effectiveness.ts:216`; `lenhChuyen.ts:88, :95`). Chỉ còn trần `dongs` (#16) |
| `thamSoXoaKhiDoiGoc` dọn `tu`/`den`/`thang` | Đã có (`shared/domain/phanTich.ts:66-69`, phép kiểm `prS6fB.tests.ts:31-39`) |
| Q6 vế "m bài chưa có người chấm" | Đã có (`worklist/tongQuan.ts:143`) |
| `urgencyOf` nhóm Chấm điểm | Đã có (`mywork.ts:367-368` đọc cờ ô) |
| "ca tối" / "buổi tối" ở web và shared | Đã có. Chỉ còn câu seed "buổi sáng / chiều" → Task 10 (Q27) |
| Gợi ý phân công FOU ghi mã FT | Đã có (`ClassCreatePanel.tsx:253-257` dùng `nhanDayDuoc`) |
| Pre FOU bài Giữa khoá rơi cột "theo môn" | Không có Giữa khoá ở Pre FOU (Q28) |
| Dn2 | = VN19 (Task 7) |
| Dn3–Dn6 | Không có định nghĩa ở nguồn nào (kiểm kê B3 chỉ có Dn1, Dn7–Dn12) → không có việc |
| Dn9 `peopleOf` / `people` | Làm lớn hơn: xoá cả `/branch-pulse` (Task 7) |
| U1 `ORDER BY c.code` thừa (Dn11) | UXF-a chủ ý giữ làm khoá phụ (Q22) |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Giao kèo Dọn để lại |
|---|---|---|
| Dn8: chú thích "ký tự nhỏ của Inter" ở 9 tệp web | **PR-S3** | — |
| `invalidate('/overview')` còn ở ~9 tệp web (vô hại sau khi xoá `/overview`) | **PR-S3** (tuỳ chọn) | route đã xoá |
| `summary.ts` sinh link `/?tab=tinh-hinh` (mục S3 cũ) | **PR-S3** gạch mục này | tệp đã xoá |
| B5 #11, #19 phần web (`StudentsPage.tsx:451, :454, :491`, nằm trong `WorkQueue`) | **PR-UXF-b** gạch phần web | Dọn xoá `WorkQueue` |
| Nối thẻ bị từ chối → thẻ gửi lại bằng cột riêng (nếu có luồng gửi lại khác đối tượng) | sau deploy | `thongBao.ts` so `doi_tuong_*` |
| Chống gửi đôi bằng cột khoá cho PA, followup, việc Vận hành, `/tasks` | sau deploy (cần migrate) | chặn trùng 10 giây (`ponytail:`) |
| Hiệu quả PA ghi mức SOS lúc sinh PA | hoãn (chủ sản phẩm chọn A) | `hieuQuaPa.ts:118` `ponytail:` |
| Nếu Câu 1 = C: K1-36 | sau deploy | — |
| Luật "chặn ngày ghi" K3-17; `apDungDeXuatChuyenLop` lấy lý do của GVCN | **planning** (không thuộc Dọn) | — |

## KIỂM — kịch bản bấm thử

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| 1 | QL | Hồ sơ HV › Báo vấn đề › Ghi lại Case đã xong | bấm "Lưu" hai lần thật nhanh | chỉ **một** Case |
| 2 | GV | Hồ sơ HV › ô chọn người (`/ref/nguoi`) | gõ tên GV chi nhánh khác | không ra người chi nhánh khác |
| 3 | QL | Học viên & Lớp › hồ sơ lớp đã kết thúc của em đã chuyển chi nhánh | cột Case, Danh sách Case lọc lớp | số khớp; QL chi nhánh mới vẫn thấy Case cũ |
| 4 | QL | Hồ sơ HV FT đã mở lộ trình RF mà không chuyển lớp | đầu hồ sơ · tab Hành trình · ⋮ Chuyển lớp | ba nơi cùng "tuần học thứ n" |
| 5 | QL | Hồ sơ HV › ⋮ Lộ trình › đổi Thi dự kiến từ ngày sang tháng | lưu | đầu hồ sơ ghi tháng, không còn tuần cũ |
| 6 | QL | Thêm học viên vào lớp thường khai giảng đã lâu | xem trước | không lỗi dòng 0 |
| 7 | GV | Công việc › Hỗ trợ học viên | dòng "Đề ra PA" của Case người khác phụ trách | ghi đúng người phụ trách Case; hồ sơ em xếp cùng người |
| 8 | GV | Công việc › nhập điểm | lớp đã kết thúc còn ô trống | không có việc của lớp đó; Lịch Test (Nợ) cũng không |
| 9 | QL | Học viên & Lớp › hộp lớp thường tuần cuối | badge | "n HV chưa có lệnh chuyển lớp"; bấm → đúng n em; bằng dòng Cần xử lý (Câu 2 = B) |
| 10 | QL | Hồ sơ HV (FT, lớp thường, Tạm dừng) | tải | không khác trước; mạng: `/students/{id}` ≤ 90 câu (log máy chủ) |
| 11 | QL / QT | Công việc › Vận hành | cột trạng thái; "+ Giao việc" | nhãn Cần làm · Đang làm · Tạm ngưng · Đã dừng · Xong; một nút (Câu 1 = A); Cập nhật / Sửa mở panel |
| 12 | QT | Quản trị › Bảng quyền | Sửa quyền → đổi 2 ô → Lưu | "2 thay đổi"; nhật ký có 2 dòng; Huỷ không ghi gì |
| 13 | QL | Học viên & Lớp › Lưu trữ | Bỏ lưu trữ → Hoàn tác | em trở lại Lưu trữ; dòng không còn mờ 70 % |
| 14 | QT | Hồ sơ lớp FT còn em › Kết thúc lớp | đọc panel | câu nói "chuyển lớp từng em / chuyển nhiều em"; lớp thường: "ra lệnh chuyển lớp cả lớp"; lệnh chờ ghi mã tuần |
| 15 | QL / QT | 7 panel O5 (Tài khoản, Danh mục, Thêm HV, Lộ trình HV, Tuần khai giảng, Giao việc, Vận hành) | bấm Lưu khi thiếu ô | lỗi dưới ô, "n ô cần sửa ↑", focus ô đầu tiên |
| 16 | GVBM | Hồ sơ Mock (FT) › dòng thời gian lượt | sau khi ghi nhận xét W | có dòng "Nhận xét" |
| 17 | mọi vai | mọi màn trên | 375 px, sáng + tối | không cuộn ngang; kết quả / hạn / người 12 px; mã tuần |

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, model thật, phép kiểm trước đỏ bao nhiêu ✗, trần tốc độ, grep xoá mã, phép kiểm đã xoá / chuyển, lệch kế hoạch, cổng gộp) |
|---|---|---|
| 01/10 | 0 | Dọn-a · **Claude Opus 5.5 · effort High** (đúng khuyến nghị). Nhánh `pr-don-a-may-chu` từ `cebb6fff`. **Mốc B: 2232 đạt + tốc độ 29 đạt**, typecheck 0 lỗi. Chạy kiểm ở bản sao worktree trong thư mục nháp (tránh chồng `dist-server` với phiên UXD/UXF-b); npm sập segfault 2 lần ở cùng chỗ → chạy thẳng `tsc` + `run.js` + `tocDo.run.js` (không qua npm). |
| 01/10 | 1 | Khối `prDonA` (1): **6/6 đỏ trên main** → đạt. `/ref/nguoi` kiểm `STUDENT_VIEW` trước rồi luôn lọc theo phạm vi (bỏ tham số `trongPhamVi`); `duyetNhieu` 403 trước 400; `listCases` một biểu thức lớp/chi nhánh (`LOP_CUA_CASE`, `CN_CUA_CASE`) cho lọc, cột chi nhánh và `can()`; nhập bù kiểm `SOS_REPORT` trước, `idempotencyKey` + chặn trùng trong `tx`; `helpName` ≤ 120. **Thêm ngoài quét:** `canCloseCase` còn cho người có `MEETING_EDIT` ở bất kỳ chi nhánh nào đóng Case → bỏ vế đó. |
| 01/10 | 2 | Khối (2): **7/7 đỏ trên main**. `createAttempt` bỏ `classId` từ web, lộ trình phải thuộc em → 400; `resultDate` tương lai → 400; highlights / `/ref/users` / `/ref/teachers` theo phạm vi; `/classes/:id/progress` đòi `ATTEMPT_VIEW`; `/cycles/:id/suggested-mocks` đòi `STUDENT_VIEW`; `/ref/routes` cần đăng nhập, `/admin/routes` đòi `ADMIN_CONFIG`; việc Vận hành: Case gắn kèm phải xem được, việc cha phải của mình; 403 thay 400 ở 6 chỗ. Check toàn bộ: 2244 đạt, 1 ✗ (PR-Qa điểm b dùng `classId` cũ) → sửa phép kiểm. |
| 01/10 | 3 | Khối (3): **7/7 đỏ**. `chuTuDo` (một cửa chữ tự do, không cắt ngầm) ở 14 chỗ; `vuaGhi` chặn bấm đúp 10 giây (PA, theo dõi, việc Vận hành, việc họp) — `ponytail:`; `theoLo` cho `xepHangLoat`, `issueBoard`; trần mảng (intake 200, lệnh chuyển 500, `xepHangLoat` 500, `caseIds` 50, `actions` 50); `xoaNho()` sau ROLLBACK. Sửa sau check: TOC rà (2) thêm 901 em qua 5 lần ≤ 200; S6F-a (11e) 1 000 → 500 dòng (trần mới). |
| 01/10 | 4 | Khối (4) đỏ trên main. VN10 MT lịch sử không dời; Q16 ngày → tháng bỏ tuần cũ (trừ khi chọn tuần khác — panel gửi lại tuần cũ nên phải so); Q15 đổi target qua `reviseTarget` (có lý do, có lịch sử); Q17 cận năm chỉ khi tuần ≠ mặc định; VN20/21 `createCycle` kiểm lộ trình đang mở; VN25 `oNgay.hop` đệm năm; Q11 `loTrinhTinhTuan` một cách chọn (hồ sơ, Hành trình, Chuyển lớp). |
| 01/10 | 5 | Khối (5) đỏ trên main. `HV_DANG_HOC_SQL` thay 34 điều kiện viết tay (13 tệp); việc nhập điểm bỏ lớp đã kết thúc như Nợ điểm (`phanCongDangHieuLuc`); `allProgrammes` nạp cả chương trình đã ngưng (`active`), `/ref/programmes` vẫn chỉ trả chương trình đang mở. |
| 01/10 | 6 | Khối (6) đỏ trên main. Đề ra PA / ghi kết quả PA → người phụ trách Case (`COALESCE(performer, owner)`); kỳ vọng đầu ra một dòng mỗi lớp nguồn; PA cần cập nhật cùng tập ở `metrics` và `mywork`; Q10 người làm; bỏ đường dự phòng `/hoc-thuat/case`. Check: 2265 đạt, 3 ✗ (VAI-b (2) người hồ sơ, S6F-a 10c thông báo cùng Case, Dọn-a 5c vế trùng) → sửa; `thongBao` so cùng Case (`ponytail:` — nối thẻ gửi lại bằng cột riêng sau deploy). |
| 01/10 | 7 | **Grep trước khi xoá**: mỗi đường đã grep `web/src`, `server/src` (gồm tests, `tocDo.run.ts`, `tocDoDuong.ts`), `netlify/`, `ops/`, `scripts/` — không còn nơi gọi ngoài phép kiểm của chính mã đó. Xoá 22 route (`/overview`, `/attempts/no-plan`, `POST /attempts`, `bulk-plan`, `weekly-rollup` (+ids), `sit`, `move-requests` (+decide), `score-sheet`, `suggested-weeks`, `summary`, `branch-pulse`, `/prefs` GET/PUT, `PUT /cases/:id/issues`, PA `respond`/`complete`, `PUT /cases/:id/owner`, `/ref/issue-taxonomy`, `/tasks/:id/history`, `/mgmt-tasks/mine`), 6 tệp (`dashboard`, `summary`, `branchpulse`, `weekly`, `prefs`, `planning`) và 10 hàm chết; web bỏ `WorkQueue`. **44 phép kiểm xoá cùng mã chết** (Tổng quan cũ, bảng tuần, bảng chi nhánh, bộ cột đặt sẵn, kế hoạch MT hàng loạt, bảng phân loại kỹ năng PR-N N2/N3, [10]/[12]/[15]); **7 phép kiểm sửa/đổi tên** (PR-LT (3) ×2, KCK (4), S3F (8), S6F-a (3e), S6F-a (11e), "Chuyển lớp rồi…" → "hồ sơ học viên vẫn giữ lớp lúc đánh giá"). F03 suýt mất do script lọc khối → khôi phục từ HEAD. NEN (7) bỏ `StudentsPage` khỏi danh sách gọi; PR-Z2 dùng `/api/notifications`. |
| 01/10 | 8 | Gọn mã không đổi hành vi: hằng/bí danh thừa (`ACADEMIC_SUPPORTS`, `OPS_POLICIES`, `canQl`, `toNewClass`, `newClass`), `builtin`/kỹ năng không sửa qua sysconfig, `TruongDeXuat` một bản ở `shared`, `duongCase(studentId, caseId)`, `CaseRoutePage` chỉ chuyển hướng về hồ sơ HV, chú thích `migrate.ts`. `goiYGanDay`: không có nguồn gợi ý cụ thể → bỏ. |
| 01/10 | 9 | Hồ sơ HV: gom câu bằng nhớ trong request (`dongHocVien`, `activeClassOf`, `cyclesOf`, `periodById`, `programmeCodeOfCycle`, nạp sẵn `diem:`/`bo-mon:`) — **FT 96/93/98/98 → 84/81/86/86 câu** (QL/QT/GVCN/GVBM), lớp thường và Tạm dừng cùng giảm; **JSON trước/sau giống hệt** (4 vai × 3 em, so byte). Trần `/students/1` 100 → 94/91/96/96 và thêm (9a) **≤ 90**. (9c) khoá trần lớp thường `/5` → `/6` (lớp thường thật, 27 khoá cũ đo nhầm lớp FT) + kiểm khoá TRAN phải khớp đường đo; (9d) `doc-het` 19; `TAI_TRANG` QL 15 URL trần 450; `latestAttempts` khoá sha1. 9e/9g đỏ trên main. Check: 2 lần segfault npm → chạy thẳng. |
| 01/10 | 10 | Seed: hạn PA15 → Thứ Hai 21/09, "Gặp phụ huynh…" 07/09, `sosV3Seed` −7, câu demo Q27 không hàm ý ca học; `pb2bSeed`/`prMtSeed` bỏ `classId`. Badge lớp (Câu 2 = B): **"n HV chưa có lệnh chuyển lớp"** (= tập dòng Cần xử lý, `emChuaCoLenh`, từ tuần Cuối khoá), tooltip "Quản lý ra lệnh ở ⋮ Chuyển lớp cả lớp"; lớp đã hết khoá giữ "n HV cần xếp lớp tiếp". Khối prDonA cuối: 49 phép kiểm (khối 1–10). |
| 01/10 | 15 | Bấm thử (Playwright kênh Chrome, API 4177 · Vite 5377): KIỂM 1 bấm Lưu hai lần → **một** Case (id 88), link cũ `/cases/88` → `/hoc-vien/1?case=88`; KIỂM 2 GV MB tìm GV chỉ có vai CP → 0 người, `studentId` ngoài phạm vi → 403; KIỂM 9 badge có ở MB Pre FOU 03 (4), FOU 12 (7), FOU 22 (1); `/ref/issue-taxonomy` → 404. Ảnh `thiet-ke/anh/pr-don/` (Tổng quan, Học viên & Lớp, hồ sơ HV FT — QL 1440/375 sáng/tối; Công việc GVBM). impeccable **audit** hẹp (badge, dòng phụ Khoá, `CaseRoutePage`): detector 0 phát hiện; badge dài hơn cũ vẫn một dòng ở 1440, thẻ 375 giữ ≤ 2 badge + "+n"; tooltip chỉ hiện khi rê chuột (mẫu badge sẵn có, không đổi trong PR này) → không polish thêm. KIỂM 3–8, 10 đã có phép kiểm máy chủ (khối 3–10); KIỂM 11–16 thuộc Dọn-b. |
| 01/10 | 15 | Cổng gộp: `origin/main` vẫn `cebb6fff` (UXD / UXF-b chưa merge) → không cần gộp. Check `13568cde`: 2235 đạt, 2 ✗ — SOS (11) D8 còn ghi hạn PA Châu −2 ngày (seed đã dời Thứ Hai −7 theo 10a) và VAI-b (2) còn luật cũ `COALESCE(performer, recorded_by)` (luật Task 6: thiếu người thực hiện thì người phụ trách Case) → sửa hai phép kiểm. **Check cuối `11d83482`: 2237 đạt + tốc độ 32 đạt + typecheck 0 lỗi** (mốc B 2232 + 29; +49 khối prDonA, −44 xoá cùng mã chết; tốc độ +3: 9a, 9c, 9d). `/ponytail-review`: Lean already. Không còn `run.js` của phiên này; đã tắt 4177/5377. |

---

## Bổ sung 02/10 cho PR-Dọn-b (planning — đọc TRƯỚC Task 11)

**Model:** gợi ý **Sonnet 5.5 · High** (phương án B: Opus 5.5 · High) — phần chạm luật Case/migrate đã chuyển sang PR-DEPLOY. **Dọn-b không bắt buộc trước deploy**: chủ yếu giao diện quản trị và lỗi nhỏ. Chỉ là gợi ý; ghi model thật vào thân PR.
**Nhánh** `pr-don-b-giao-dien` · cổng 4187/5387 (máy local) · log `check-don-b.log` · phép kiểm `prDonB.tests.ts`. Song song **PR-S3** (`docs/superpowers/plans/2026-10-02-pr-s3-chu-cuoi.md`, mục "Hợp đồng với PR-Dọn-b"): Dọn-b giữ cấu trúc, S3 đổi chữ; PR merge sau áp lại phần của mình.

### A. Sửa kế hoạch cũ theo quyết định chủ sản phẩm (thắng Q25, Q13d cũ)
- **Q25 thay bằng:** trạng thái Vận hành = **Chưa bắt đầu · Đang xử lý · Tạm ngưng · Dừng hẳn · Xong** (bảng `thiet-ke/THUAT_NGU_2026-10-01.md` C-069…C-073). Bỏ "Cần làm/Đang làm/Đã dừng" ở Q25, Task 12 (12a) và bảng bấm thử dòng 11. "Đã dừng" là nhãn khoá học của HV — không dùng cho việc.
- **(13d) và bảng bấm thử dòng 14:** không có chữ "lệnh". Chữ mới: lớp thường → "Quyết định chuyển lớp cho cả lớp"; còn quyết định đang chờ thi hành → "Sắp chuyển · từ {tuần}". Bộ chữ chuyển lớp lấy từ hằng S3 thêm ở `shared/domain/chuyenLop.ts` (nếu S3 chưa merge: dùng đúng chữ ở mục "Đã chốt" của kế hoạch S3, S3 sẽ gom).
- Mọi chữ mới Dọn-b thêm theo bảng THUAT_NGU + mục "Đã chốt" của kế hoạch S3 (nút thoát "Đóng", "Báo QL", Case viết hoa, PA/QL ngắn…).
- Dọn-a để lại: web `PeoplePicker` / `ChonPhuTrach` còn gửi `trongPhamVi` (máy chủ đã bỏ) → gỡ. Từ S3: 4 cờ quyền cũ `mocks/meeting/academic/mgmtTasks` (`shared/domain/dieuHuong.ts:22-23`, `server/src/platform/nav.ts:27`), `NEXT_STEP_HINT` (`shared/domain/cases.ts:914`), import chết `JOURNEY_EVENT_LABEL` (`StudentDetailPage.tsx:23`) → xoá (grep mọi chỗ gọi trước).

### B. Sửa sau rà lượt 2 — PR-UXF-b #157 (báo cáo `docs/superpowers/reviews/2026-10-02-ra-dot-6-luot-2/uxf-b.md`)
1. **[ĐÃ CHUYỂN sang PR-DEPLOY Task 0b — Dọn-b BỎ QUA mục này]** ~~[P1] Case của lớp trước (R5-5) phải nhớ lớp gốc.~~ Hiện đoán lớp gốc qua `sos_cases.attempt_id` (`server/src/cases/cases.ts:2204-2205`) — cột này trỏ bài mới nhất chạm Case, và Case tự báo (QuickReport) có `attempt_id` rỗng (`cases.ts:584`).
   - Thêm cột ghi **lớp + chương trình gốc lúc mở Case** (migrate thêm cột theo mẫu `migrate.ts`; DB reset nên không chép dữ liệu cũ; `schema.sql` = migrate). Ghi ở mọi đường mở Case (Mock/SOS tự động, Giữa khoá, QuickReport, mở tay).
   - **Planning quyết:** lần trượt ở **chương trình mới mở Case mới**; `taoCaseGiuaKhoa` (`server/src/normal/regular.ts:814-820`) không nối lần trượt Writing ở BE vào Case G+V của FOU.
   - Nhóm "Case bàn giao" (S3 đổi tên từ "Từ lớp trước"), tên môn ở bảng kỹ năng, **Ngăn Case** (`caseDetail`, `cases.ts:1532-1579`) và bộ nguyên nhân ở panel Xác nhận nguyên nhân đều dùng **chương trình gốc** → một Case một tên ở mọi chỗ.
   - Phép kiểm: em FOU có Case G+V → lên BE → trượt Writing Giữa khoá BE ⇒ 2 Case (G+V cũ, Writing mới), Case G+V ghi "G+V" ở bảng kỹ năng, Ngăn Case và danh sách; Case tự báo G+V vào đúng nhóm; tổng Case ở Tổng quan / Phân tích không đổi nghĩa.
2. **[P2] Báo PH đã làm không đổi nội dung** (`server/src/yThuc/phoiHop.ts:264-296`): chỉ bỏ môn có Case đóng **trước** ngày làm.
3. **[P2] Gõ mã tuần không năm** (`docTuanLich`): chọn tuần **gần hôm nay nhất** (cuối tháng 12 gõ "W1 JAN" = tháng 1 năm sau). Sửa kỳ vọng phép kiểm Q6 cũ.
4. **[P2] Ô tuần trên điện thoại** dùng `inputMode="text"` (hiện `numeric` nên không gõ được chữ).
5. **[P2]** Dòng "Tạm dừng từ" dùng hàm chung `ngay` (bỏ hàm cắt ngày riêng). Phép kiểm Task 10 của UXF-b: kiểm **tổng Case không đổi** như kế hoạch.
6. **[P2] Mã tuần còn kèm năm** (B5 sót): toast báo vắng lớp thường ("dời sang W4 SEP 2026"), lỗi dời lịch FT, câu "Tuần … chưa bắt đầu" ở Họp tuần → `tuanLich`.
7. Nghi ngờ (ghi, không sửa nếu không chắc): sau khi lên BE, người phụ trách Case G+V là GV Writing của BE (luật S5F-a). Với lớp gốc mới ở B1, người phụ trách Case cũ giữ nguyên người lúc mở; ghi vào thân PR nếu khác.

### C. Sửa sau rà lượt 2 — PR-Dọn-a #155 và tích hợp/UXD #156
**P0/P1 ĐÃ CHUYỂN sang PR-DEPLOY Task 0b** (chủ sản phẩm có thể bỏ Dọn-b). Dọn-b chỉ làm các **P2** rẻ trong hai báo cáo. Xem `docs/superpowers/reviews/2026-10-02-ra-dot-6-luot-2/don-a.md` và `tich-hop-uxd.md`. Làm **mọi P0/P1** ở hai báo cáo đó và P2 nào rẻ; P2 còn lại ghi "Chuyển cho PR khác" ở thân PR.

### Task bổ sung
- **Task 14b** (sau Task 14): mục B ở trên (trừ B1).
- **Task 14c**: mục C ở trên.
- Task 15 bấm thử thêm: ô tuần trên điện thoại gõ "W1 JAN".
