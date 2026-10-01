# PR-VAI-b · Hồ sơ học viên "hiểu trong 30 giây" + tab Hành trình mới — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** (1) Đầu hồ sơ học viên trả lời bốn câu theo thứ tự đọc: **em là ai** (dòng thông tin có "tuần học thứ n"), **em đang thế nào**
(câu tóm tắt máy viết), **bốn con số** (Kết quả gần nhất · Học thuật · Ý thức · Sắp tới) và **bạn cần làm gì** (thanh việc của chính người xem).
(2) Ba dải trạng thái đọc trước bốn ô: Tạm dừng (vàng, mọi hạn dừng), KCK, Sắp chuyển. Quản lý có dải "n yêu cầu chờ bạn duyệt" và menu ⋮ chia nhóm.
(3) Bảng kỹ năng: **Case = khung rỗng, PA = khối đặc** (luật chung cả hồ sơ), người làm việc tiếp, chữ 12 px; dưới 640 px thành **thẻ**.
(4) Tab Hành trình làm lại theo **mockup 26 bản 2 + bản 1**: thẻ **chương theo lớp** ở đầu tab (thay bảng Lịch sử lớp), dưới là **trục tuần nâng cấp**;
bỏ nút đổi giai đoạn, bỏ khối "Mốc học tập", chú giải gọn.
(5) **Đường dẫn sâu (E.4 / G5):** mọi chỗ trong hồ sơ HV nhắc "MT2 · Speaking" của em mở **hồ sơ Mock của em · MT2 · cuộn tới Speaking**, qua **một** hàm dựng đường dẫn.

**Architecture:** Không bảng mới, **không migrate**. Luật thuần nằm ở `shared/domain` (`tuanHocFt`, `chuTuanHoc`, `cauTomTat`, `oHocThuat`, `oYThuc`, `oSapToi`,
`chiaChuong`, `nhanGhim` bản gọn). Máy chủ thêm **ba hàm một nguồn**:
- `khoangTamDung(ids)` (`server/src/students/tamDung.ts`, mới) — các khoảng Tạm dừng của em, đọc nhật ký `pause`/`resume` một câu;
- `viecCuaHocVien(p, studentId, board)` (`server/src/students/viecHocVien.ts`, mới) — mọi việc của em, **mỗi việc có người làm**, cùng luật người làm với Công việc;
- `hanhTrinhHocVien` mở rộng: nạp **mọi** lộ trình một lần, trả thêm `chuong[]`, `lop[]`, `tamDung[]`, `tuanHoc` — thay `/lich-su-lop`.

`profile.ts` bỏ `headlineOf` + `episodes`, trả `dauHoSo` (thông tin · tóm tắt · bốn ô · việc). Phép kiểm ở `server/src/tests/prVaiB.tests.ts`.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); harness `check()` của `run.ts`, chạy `npm run check`.
**Spec:**
- **Nguồn chính:** kiểm kê `docs/superpowers/specs/2026-10-01-kiem-ke-truoc-dot-6.md`, mục (c) làn B "PR-VAI-b", các dòng B1–B5 ghi VAI-b
  (T72, T74, T65 phần giao diện, K3-01, K3-03, K3-30, K3-32, K3-41, K3-47, Q2, V1, UX-D3, UX-D4), mục (e) dòng B.
- Đặc tả `2026-09-27-nang-cap-sau-deploy-design.md`:
  - §3.1e (KCK, Q29-1), §3.1f Q30-6 (mã tuần), §3.1g Q31-3 (điện thoại), Q31-4 (12 px);
  - **§3.1h Q31-7** (KCK chỉ miễn kỳ vọng MT + SOS tự động), **Q31-8** (câu tóm tắt nêu việc quá hạn của người khác), **Q31-10** (tab Hành trình = mockup 26 bản 2 + bản 1), **Q31-11** (tuần học thứ n);
  - §3.2 T65, T72, T74; §7.3 (ngữ pháp trạng thái, mã tuần), §7.4 (token), §7.5 (ba tầng).
- Kiểm kê B1 dòng **E.4 / G5** (đường dẫn sâu — kiểm kê ghi "PR-VAI", không làn nào nhận → **VAI-b nhận**, planning 01/10); `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md:25` (G5), `:150` (E.4).
- Báo cáo rà `thiet-ke/ra-27-09/K3.md`: K3-01, K3-03, K3-30, K3-32, K3-41, K3-47, K3-48 (menu ⋮), §4(d), §4(e).
- **Mockup đã duyệt:** `thiet-ke/mockup/24-ho-so-hoc-vien-30-giay.html` (màn A, B, C, D1–D3, E, bảng luật câu tóm tắt, khối "Đã chốt";
  phần "A · tab 3 Hành trình" **đã thay** bằng mockup 26) · `thiet-ke/mockup/26-hanh-trinh.html` (**bản 2 + bản 1**; bản 3, 4 chỉ tham khảo — **không làm**).
- Kế hoạch PR-UXF-a `plans/2026-10-01-pr-uxf-a-so-lieu-khop.md` mục "Chuyển cho PR khác" (`chuTuanHoc`, Q6).
- `thiet-ke/HOP_DONG_SO_LIEU.md` §1 (một hàm cho một tập số).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-VAI-b** · đợt 6 **lượt 1** · làn **B** · một PR, không draft, **không tự merge** (xem Câu 1: một PR hai phiên) |
| Nhánh · worktree | `pr-vai-b-ho-so-hoc-vien` · `.claude/worktrees/pr-vai-b-ho-so-hoc-vien`, từ `origin/main` @ `86ddaf04` trở đi |
| Cổng thử | API **4167** · Vite **5367**. Song song: UXF-a 4187/5387 · VAI-a 4157/5357 · Pb2 4177/5377. Không dùng 4000/5173 |
| Model | **Opus 5.5 · High** · phương án B: **Fable 5.1 · High**. Đầu phiên, session **tự kiểm model thật**; không phải Opus 5.5 thì **DỪNG**, báo chủ sản phẩm (trừ khi chủ sản phẩm đã chọn B) |
| Người rà | **Opus 5.5**, rà **một lượt cuối đợt 6**. Session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. `Co-Authored-By` ghi đúng model thật |
| Migrate? | **Không.** DB reset trước deploy nên không có lệnh dữ liệu cũ. `schema.sql` không đổi |
| Lệnh impeccable | **`/ponytail lite` đầu phiên** (PR có giao diện). **`clarify`** ở Task 2, 3, 5 (chữ thanh việc, câu tóm tắt, ô, menu) · **`layout`** ở Task 3, 10, 11 · **`adapt`** ở Task 7, 10, 11 (375 px) · **`audit`** + **`polish`** (**sáng và tối**) ở Task 12. Không `init`/`document`/`hooks on`/cài đặt. Trước PR: `/ponytail-review` |
| Phụ thuộc | Mockup 24, 26 đã duyệt. Không chờ PR nào. Chạy song song UXF-a, VAI-a, Pb2 (bảng file chồng dưới). Dùng chung `chuTuanHoc` với **UXF-a** (Task 1) |
| Không làm | Tổng quan theo vai, chuông, Cần xử lý → **VAI-a** · bảng Phân tích GV, bỏ "Cả hai" → **Pb2** · mã tuần ở Case/PA ngoài bảng kỹ năng (`CasePanel`, `NganCase`, `sosV4.ts:38`, `cases.ts:2630-2642`), R5-1 (ngày ở `DaiChuyenLop.tsx:98`), R5-3, O1, O2 → **UXF-b** · bảng Mock Test / Kết quả kiểm tra trên điện thoại, hàng tab điện thoại → **UXD** · nợ điểm em Tạm dừng (`scoreDebt.ts`) → **UXF-a** · áp đường dẫn sâu G5 ở màn **ngoài** hồ sơ HV (Tổng quan, Lịch Test, Học viên & Lớp, Ngăn Case) → **UXF-b** · mockup 26 bản 3 (dòng thời gian), bản 4 (làn kỹ năng) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - chạy `npm run check` **một lần, ở foreground**, log `$env:TEMP\check-vai-b.log` (tên riêng — `$TEMP` dùng chung giữa các session);
  - xanh, số phép kiểm ≥ mốc B → commit `PR-VAI-b (n): …`.
- Sập segfault → chạy lại **một** lần. Treo > 10 phút → quét `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`, tắt hết, chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai, 1440 và 375, **sáng và tối**, **một lần** ở Task 12:
  - Playwright kênh Chrome; demo `POST /api/demo/session {userId}`;
  - vai tra `tests/tocDo.run.ts:110-116` (QL · GVCN · GVBM · GVCN_THUONG · QT);
  - ảnh vào `thiet-ke/anh/pr-vai-b/`;
  - API `PORT=4167`, Vite tạm 5367 proxy về 4167 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4167/5367, quét `tests/run.js` treo, dọn file tạm.
- **Cổng gộp** khi UXF-a / VAI-a / Pb2 merge, và ở Task 12: `git fetch origin && git merge origin/main` → gỡ theo bảng file chồng → `npm run check` → ghi Nhật ký.

### File chồng với 3 PR song song lượt 1 (UXF-a đã có kế hoạch; VAI-a, Pb2 theo phạm vi kiểm kê (c))

| File | PR khác | PR-VAI-b sửa | Gỡ |
|---|---|---|---|
| `shared/domain/hienThiNgay.ts` | **UXF-a** Task 4 thêm `chuTuanHoc` | thêm `tuanHocFt`; thêm `chuTuanHoc` **chỉ khi** UXF-a chưa merge, **cùng chữ ký, cùng thân** (Task 1) | trùng hàm → giữ một bản, bỏ bản kia; phép kiểm hai bên cùng xanh |
| UXF-a: cách đếm "tuần học thứ n" trong `luatLoTrinh.ts:357-360`, `transition.ts` | **UXF-a** Task 4 | tạo `khoangTamDung` + `tuanHocFt` (Task 1) | PR merge **sau** thay phần đếm tay của mình bằng hai hàm này (một luật đếm, Q1). Ghi thân PR |
| `server/src/cases/cases.ts` | **UXF-a** Task 8 (`:2873-2875`) | `caseCardOf` (`:2451`) thêm `nguoiLam`; `skillSupportBoard` (`:2103`) + chi tiết Case thêm `tamDungTu` | khác hàm → giữ cả hai |
| `server/src/worklist/mywork.ts` | **VAI-a** (V3, K5-10, V8), **UXF-a** (`chiDangHoc`) | **không sửa** — chỉ đọc luật người làm; phép kiểm so key | — |
| `web/src/modules/duyet/TheYeuCau.tsx`, `server/src/duyet/yeuCau.ts` | **VAI-a** (dải Chờ duyệt Tổng quan, VN05) | **không sửa** — dùng `TheYeuCau` + `GET /yeu-cau?studentId=` có sẵn | nếu VAI-a đổi props `TheYeuCau` → áp lại lời gọi |
| `web/src/ui/Menu.tsx` | VAI-a (nếu chuông dùng Menu) | thêm trường tuỳ chọn `nhom`, `phu` vào `MenuItem` (`:3-11`) | union trường |
| `server/src/tests/hanhTrinh.tests.ts`, `lenLop.tests.ts`, `hoSoHocVien.tests.ts`, `prSos.tests.ts:415`, `prS5fb.tests.ts:110`, `run.ts:1269,1292,6795` | UXF-a sửa `tongQuan.tests.ts`, `prS5fA.tests.ts` | đổi kỳ vọng `headline.next` → `dauHoSo.viec`, `episodes`/`lichSuLop` → `chuong` (Task 2, 9) | khác file → không chồng |
| `web/src/lib/format.ts` (`attemptHref :134`), `web/src/modules/fasttrack/MockDetailPage.tsx`, `shared/domain/duongHoSo.ts` | chưa thấy PR lượt 1 nào nhận (kiểm lại ở Task 0) | G5: `attemptHref` gọi hàm mới `duongDotTest`; hồ sơ Mock đọc `?kn=` (Task 8) | nhỏ → áp lại |
| `server/src/fasttrack/attempts.ts` (`attemptHref` bản máy chủ) | **UXF-a** Task 5, 6 | **không sửa** — bản máy chủ đổi sang `duongDotTest` giao UXF-b | — |
| `tests/run.ts`, `tests/tocDoDuong.ts`, `shared/domain/index.ts`, `routes/index.ts`, `CODE_MAP.md` | cả ba PR | khối phép kiểm **cuối** `run.ts`; bỏ route `/lich-su-lop` (`routes/index.ts:1734-1738`) + trần của nó (`tocDoDuong.ts:149, 520-523`) | giữ cả hai, thứ tự theo merge |

`StudentDetailPage.tsx`, `profile.ts`, `SkillBoard.tsx`, `HanhTrinh.tsx`, `students/hanhTrinh.ts`, `shared/domain/hanhTrinh.ts`, `hoSoHocVien.ts`: chỉ VAI-b ở lượt 1.

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 | **Một luật đếm tuần học FT.** `tuanHocFt(batDau, tuan, dung)` (shared) đếm từ tuần bắt đầu lộ trình (`learning_cycles.start_period_id`), **bỏ tuần Tạm dừng** (tuần có ngày Tạm dừng tới trước tuần Quay lại); tuần đang dừng → `null`. `khoangTamDung(ids)` (máy chủ) đọc `journey_events` `pause`/`resume` **một câu** cho nhiều em. Đầu hồ sơ, trục tuần, thẻ chương, UXF-a đều gọi hai hàm này. Tuần của **lớp** FT không hiện ở hồ sơ HV | Q31-11, UXF-a Q6; mockup 26 "hôm nay 15, không phải 17" |
| Q2 | **Việc của em theo người** = hàm mới `viecCuaHocVien`, **không** chạy `myWork` mỗi lần mở hồ sơ (quét cả phạm vi, quá nặng). Người làm theo **đúng luật Công việc**: Xác nhận nguyên nhân / Xác nhận PA → `sos_cases.owner_user_id` (`mywork.ts:747,775`) · Ghi kết quả PA → `performer_user_id ?? recorded_by` (`:452,503`) · Nộp kế hoạch bổ trợ → `performer_user_id` · Báo PH qua TVV, Xử lý vi phạm → GVCN · Mini Test → `nguoiGhiMiniTest` · Bàn giao → theo `dai.nut` · "Chờ Quản lý duyệt…" → "Quản lý" (vai, không tên). Khoá việc dùng **đúng key** của `myWork` (`action:{id}`, `cause:{id}`, `xnpa:{id}`, `kehoach:{id}`, `baoph:{id}`, `minitest:{id}`, `yt_xu_ly:{id}`) để phép kiểm so hai đường | K3-01; hợp đồng số liệu |
| Q3 | Người làm việc tiếp của **một Case** tính **một chỗ**: `caseCardOf` (`cases.ts:2451`) trả `nguoiLam: { id, ten } \| null`. Cột "Việc tiếp" của bảng kỹ năng, thẻ điện thoại và thanh việc cùng đọc trường này | một nguồn |
| Q4 | **Nhập điểm không vào thanh việc** của hồ sơ HV (việc của cả lớp, làm ở lưới chấm; K3-01 không liệt kê). Học viên & Lớp, Công việc vẫn có | tránh đường đếm thứ hai với UXF-a VN29 |
| Q5 | **Bỏ `headline` (`headlineOf`, `profile.ts:448-510`)** — `dauHoSo.viec` thay `headline.next`. Năm chỗ phép kiểm cũ đọc `headline.next` **sửa** sang trường mới, **không xoá** (kỳ vọng giữ nguyên nghĩa: GVBM W2 thấy "Xác nhận nguyên nhân Writing Task 2" là việc của mình). Bảng kỹ năng dựng **một lần** trong `profile.ts` rồi dùng cho cả bốn ô, câu tóm tắt, thanh việc | không hai nguồn "việc gấp nhất" |
| Q6 | **Câu tóm tắt dựng ở máy chủ** bằng hàm thuần `cauTomTat` (shared), trả mảnh `{ chu, tone }[]`, tối đa 3 mệnh đề theo bảng luật mockup 24 (0 trạng thái đặc biệt · 1 kết quả + kỹ năng đang hỗ trợ · 2 việc học thuật gấp nhất **của bất kỳ ai** · 3 Ý thức); mệnh đề "ổn" bỏ; có mệnh đề 0 thì bỏ mệnh đề cuối. Không có gì → "`<kết quả gần nhất>` · không có việc đang mở". Màu: đỏ quá hạn · vàng bắt buộc/tạm dừng · cam SOS 2 (token `late`) · tím chờ duyệt · xanh dương sắp chuyển | Q31-8; mọi màn nói một câu |
| Q7 | **Bốn ô — mỗi ô một nguồn:** Kết quả gần nhất = `ketQuaTestGanNhat` (`hoSoHocVien.ts:138`), Cuối khoá thêm hướng từ `goiYCuoiKhoa` · Học thuật = hàng Case mở của **chính** bảng kỹ năng (số Case = số hàng Case mở bảng hiện) · Ý thức = `trangThaiYThuc` (`yThuc/trangThai.ts:62`) · Sắp tới = `nextCheckpoint` (FT, kèm kỳ vọng + số phần) / Cuối khoá + "xét lên {bậc kế}" / "Chuyển lớp · chờ Quản lý ra lệnh" sau Cuối khoá / "Kết luận: …" khi đã kết thúc. Ô bấm mở đúng chỗ sinh số (đợt Test · bảng kỹ năng ở Case gấp nhất · tab Ý thức · Lịch Test) | K3-03; T72 |
| Q8 | **Thanh việc:** "Việc của bạn" = việc gấp nhất **của người xem** (quá hạn → hạn sớm → không hạn), nút động từ mở đúng Ngăn Case/tab; gập "n việc khác của bạn" và "m việc của người khác" (tên + vai + hạn 12 px). Người xem **không có việc** → **không vẽ** (Q31-8, T72). Em Tạm dừng / đã kết thúc → không vẽ | mockup 24 A, B, D1, D3 |
| Q9 | **Dải chờ duyệt (V1/K3-47):** dùng `GET /yeu-cau?studentId=` (`routes/index.ts:1648-1656` → `hopChoDuyet` `duyet/yeuCau.ts:318`, đã lọc quyền, đã xếp quá hạn lên đầu) + thẻ `TheYeuCau` có sẵn. Web chỉ gọi khi `viewer.coTheDuyet` (cùng quyền `P_DUYET` = `REQUEST_APPROVE`). Không API mới. Nằm **chỗ của thanh việc** | mockup 24 B |
| Q10 | **Menu ⋮** chia nhóm **Thông tin · Lộ trình · Lớp**, mỗi mục có hệ quả thì thêm một dòng phụ; vạch đậm trước Tạm dừng/Kết thúc, vạch đỏ trước Xoá. **Không đổi tập mục và quyền** (`quanLyHocVien.ts:34-68`): GVCN vẫn có "Thông tin học viên" vì luật YC-5.2 cho GVCN sửa họ tên/ngày sinh/email — câu mockup "GVCN thấy Đề xuất sửa thay Thông tin" hiểu là mục GVCN **không** có quyền | K3-48; không tự đổi quyền |
| Q11 | **Tạm dừng chỉ đổi giao diện:** nhãn vàng "Tạm dừng từ dd/mm" thay "Quá hạn" ở bảng kỹ năng, Ngăn Case, trục tuần; ngày dạng dd/mm (ngày của sự việc — được phép). Luật số liệu **không đổi** (máy chủ đã lọc `students.status`). `tamDungTu` = ngày Tạm dừng gần nhất khi `students.status = 'inactive'` | T65; kiểm kê B1 |
| Q12 | **KCK chỉ đổi chữ** (Q31-7): chip điểm xám, dòng phụ "KCK" thay "kỳ vọng 5.5", ô Kết quả "Overall 5.5 · KCK · không đặt kỳ vọng MT", câu mệnh đề 0 "KCK · không đặt kỳ vọng MT, không SOS". Case tay, PA, Ý thức, hạn, thanh việc chạy như mọi em | mockup 24 D2 |
| Q13 | **Case = khung rỗng, PA = khối đặc** — bảng kỹ năng: hàng Case có nhãn viền `Case` + vạch trái trạng thái (giữ `VACH_CASE`); hàng PA có nhãn `PA` **nền đặc** (thay viền ở `SkillBoard.tsx:446`), nền hàng nhạt hơn + đường nối nhỏ từ Case; PA chờ duyệt kế hoạch: nhãn nền tím. Hành trình: chương + trục cùng luật. `CasePanel`/`NganCase` không có nhãn Case/PA → không đổi | Q31-10; mockup 24, 26 |
| Q14 | **Chương theo lớp:** một chương = một ghi danh (`enrollments`). Case thuộc chương chứa **ngày mở**; còn mở qua chương sau hoặc đóng ở chương sau → hiện đủ ở chương sau, chương cũ ghi "Case đi theo em sang {lớp}". PA thuộc chương chứa **ngày bắt đầu PA**. Ghim Test theo `assessment_attempts.class_id`. GVCN = phân công `is_core` giao thời gian học. "Vì sao sang lớp sau" = `end_kind` (`nhanKetThucVi`) + lệnh chuyển (`lenh_chuyen_lop` đã thi hành → "Quản lý ra lệnh"). Dòng "Lặp lại qua các lớp" khi một kỹ năng có Case ở ≥ 2 chương. **Không** việc, hạn, quá hạn, người giữ việc | Q31-10; mockup 26 bản 2 |
| Q15 | Bỏ `/students/:id/lich-su-lop`, `LichSuLop.tsx`, `server/src/classes/lichSuLop.ts`; bỏ `episodes`/`allEpisodes` + `episodesOf` + câu `journeyRows` (`profile.ts:173-258, 727-755, 950-951`) + `Episode` (`StudentDetailPage.tsx:674-733`) + khối "Mốc học tập" (`HanhTrinh.tsx:264-287`, K3-32). **Giữ** nút "Đọc bàn giao" (PR-CT Q17) ở chân thẻ chương có lệnh chuyển đã xác nhận bàn giao. Phép kiểm cũ của lịch sử lớp / episodes **chuyển** sang chương (không xoá) | thay bằng chương; không mất tính năng |
| Q16 | Bỏ nút đổi giai đoạn (`HanhTrinh.tsx:141-144`). Bấm một chương → đặt `?giai-doan=` của chương đó (giữ tham số URL cũ → liên kết cũ vẫn chạy), chương không nằm trong "3 tháng gần nhất" thì tự chuyển "Cả giai đoạn", cuộn tới trục | Q31-10 |
| Q17 | Chú giải theo **mockup 26** (Case khung rỗng · PA khối đặc · đang làm · kết quả PA · quá hạn · chờ · so với lần trước · dự kiến · tạm dừng — **9 mục**, một dòng). ≥ 640 px: hiện một dòng; < 640 px: **thu gọn**, chỉ ký hiệu, nút "Ký hiệu" mở chữ (mockup 24 E). T74 ghi "8 ký hiệu" nhưng Q31-10 (01/10) duyệt mockup 26 sau | quyết định chủ SP mới hơn |
| Q18 | "Chưa có PA", "Chờ nguyên nhân", "Chờ duyệt kế hoạch" trên trục cùng **khối viền đứt tím** (một mục chú giải "chờ"), chữ trong khối nói rõ. Sửa luôn **R5-2** (Case có PA Bổ trợ chờ kế hoạch từng hiện "Chưa có PA", `HanhTrinh.tsx:401-419`) | mockup 26; cùng chỗ đang làm lại |
| Q19 | **Mã tuần** ở các chỗ PR này vẽ lại: Hành trình (`shared/domain/hanhTrinh.ts:173, 222, 226-229`), hàng PA bảng kỹ năng (`SkillBoard.tsx:433` "từ W3 SEP", `:465` "Tiến bộ một phần · W3 SEP"). Phần B5 còn lại giữ cho UXF-b | Q30-6; mockup 24, 26 vẽ mã tuần |
| Q20 | **Không N+1 theo lớp:** máy chủ Hành trình nạp **mọi** lộ trình, lượt, Case, PA, lần ghi kết quả bằng số câu cố định; chương trình của lớp lấy từ JOIN `c.programme_code, c.is_fast_track`, **bỏ** `progOf → programmeOfClass` từng lớp (`students/hanhTrinh.ts:126-131`); GVCN, lệnh chuyển, khoảng Tạm dừng mỗi thứ một câu | quy tắc Turso; kế hoạch planning |
| Q21 | **Không thêm seed.** Phép kiểm tự dựng dữ liệu; bấm thử dựng em Tạm dừng qua giao diện (⋮ › Tạm dừng học / Quay lại học) trên HV 1 (seed FOU → BE → FT). Tránh làm lệch số đếm của phép kiểm cũ | ít rủi ro |
| Q22 | Cỡ chữ Q31-4: kết quả, hạn, người **12 px** ở đầu hồ sơ, bảng kỹ năng, thẻ (`DongHan :177`, `CotPhai :670`, dòng phụ PA `:457`, "Quản lý hạn" `:362` đang 11 px). Chip PA/ghim trên Hành trình giữ cỡ mockup 26 (11,5 px, là nhãn) | §7.4 |
| Q23 | Nhiều hơn 4 chương: khung chương **cuộn ngang** trong thẻ (desktop), chương đang học luôn ở bên phải; điện thoại xếp dọc, chương đang học mở sẵn, chương cũ một dòng | mockup 26 chỉ vẽ 4 |
| Q24 | **G5 — một hàm đường dẫn** `duongDotTest(dot, kn?)` ở `shared/domain/duongHoSo.ts`: FT → `/mock-test/{id}` (+ `?kn=`); lớp thường → bảng điểm lớp thường như cũ (`/bang-diem-thuong/{lop}?kind=…`), **bỏ** `kn` (bảng đó chưa có ô kỹ năng để cuộn — E.4 nói về hồ sơ Mock). `attemptHref` web gọi hàm này; không ai tự ghép `/mock-test/`. "MT2" không kèm kỹ năng → hồ sơ Mock của đợt, không cuộn. VAI-b áp ở **mọi chỗ trong hồ sơ HV**; màn ngoài hồ sơ giao UXF-b (file đang do UXF-a/VAI-a sửa ở lượt 1). Quyền không đổi: hồ sơ Mock vẫn tự kiểm quyền như cũ | E.4, G5; một quy ước |

## Global Constraints

- **Số khớp:** mỗi con số mới có **phép kiểm so hai đường** — ô Học thuật = số hàng Case mở của bảng kỹ năng; việc "của bạn" ⊆ và ⊇ đúng nhóm việc của
  `myWork(người xem)` cho em đó (so theo key); tuần học thứ n ở đầu hồ sơ = ô cùng tuần ở hàng Tuần học của trục = số của UXF-a (panel Chuyển lớp).
  Không thêm đường đếm thứ hai. Khung `run.ts:9214-9225` phải còn xanh.
- **Quyền:** mọi đường mới có **phép kiểm PHỦ ĐỊNH**:
  - `dauHoSo`, `hanh-trinh`: người ngoài phạm vi 403 (QL chi nhánh CP với em MB);
  - dải chờ duyệt: GVCN/GVBM `viewer.coTheDuyet = false`, `GET /yeu-cau?studentId=` 403;
  - thanh việc: GVBM Reading **không** có việc W2 ở "Việc của bạn" (chỉ ở "việc của người khác").
- **SQL (Turso):**
  - chỉ `?` — không tham số đặt tên;
  - `IN (…)` qua `theoLo`, ≤ 900 tham số; UNION ≤ 20 vế;
  - **không N+1 theo lớp / theo Case** — phép kiểm đếm câu theo mẫu `lenLop.tests.ts:936-948`;
  - chỉ đọc — PR này **không ghi** dữ liệu mới (Duyệt/Từ chối dùng đường có sẵn);
  - ngày nghiệp vụ `demoToday()` / `useNgayNghiepVu().homNay`.
- **Tốc độ:** `/students/{hv}`, `/students/{hv}/hanh-trinh` (hai biến thể), `/students/{hv}/skill-board`, `/yeu-cau?studentId=` đo lại trong `tests/tocDoDuong.ts`
  (hiện `:443-450` 100/56, `:456-463` 37–40). Trần mới = `max(sau+10, ⌈sau×1.3⌉)`. **Không nâng trần cũ quá 30 %**; vượt → Nhật ký, báo planning.
  Bỏ dòng `/lich-su-lop` (`:149`, `:520-523`).
- **Giao diện:**
  - `/ponytail lite`; phông Be Vietnam Pro, chữ số Inter, `tabular-nums`; token màu, không màu cứng; SOS 2 = token `late`;
  - mã tuần `W2 OCT` (`tuanLich`); ngày chỉ cho hạn cụ thể (`<Han>`), ngày thi, ngày sinh, ngày Tạm dừng, nhật ký;
  - FT "tuần học thứ n" — **không bao giờ** "n/16"; lớp thường "tuần học x/y"; không "ca học", "đổi ca", "lớp buổi tối";
  - lớp thường không có chữ SOS; tên Case "[Giữa khoá] G+V không đạt";
  - cột/hàng thẳng, không dồn chữ; dấu gập/mở vẽ **SVG** (▾ ▸ nhỏ của Inter thành dấu chấm — `StudentDetailPage.tsx:226` đang dùng ký tự);
  - bảng có ô `sticky`: **mỗi nhóm một bảng** (td sticky bám cả bảng);
  - không mã thô trên màn (`len_lop`, `cho`, `inactive`).
- **Phép kiểm:**
  - tạo `server/src/tests/prVaiB.tests.ts` (`runPrVaiBTests(t)`, đăng ký **cuối** `run.ts`, theo mẫu `prCt.tests.ts:4`);
  - ngày demo 14/09/2026 (`seed/data.ts:15`); người dùng mẫu `P.admin`, `P.mbManager`, `P.w2Teacher` (`run.ts:223-227`);
  - phép kiểm cũ đổi kỳ vọng thì **sửa**, không xoá; **tổng số phép kiểm không giảm**.
- **Không bớt** (CLAUDE.md): kiểm quyền, chống lộ dữ liệu ngoài phạm vi. `ponytail:` được phép, liệt kê trong thân PR.

## Hướng dẫn riêng cho phương án B (Fable)

1. Không tự đổi luật Case, SOS, Ý thức, quyền, hạn. PR này **chỉ đọc** và vẽ lại. Thấy cần đổi luật → ghi Nhật ký, dừng.
2. Người làm một việc lấy **đúng cột** Công việc đang dùng (Q2). Không đoán vai theo tên màn.
3. Hành trình: trước khi vẽ, viết xong `chiaChuong` + phép kiểm của nó (Task 9). Không dựng chương bằng câu SQL mỗi lớp.
4. Chỗ nào mockup và mã hiện có khác nhau mà bảng Q không nói → theo mockup đã duyệt, ghi Nhật ký một dòng.

## Task 0 · Chuẩn bị

- [ ] Kiểm model thật (dòng hệ thống / `Co-Authored-By` mặc định). Không phải **Opus 5.5** → dừng, báo chủ sản phẩm.
- [ ] Worktree `.claude/worktrees/pr-vai-b-ho-so-hoc-vien` từ `origin/main`; `/ponytail lite`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm chính + tốc độ) vào Nhật ký.
- [ ] Kiểm UXF-a đã merge chưa (`git log origin/main --oneline | grep UXF-a`): đã merge → dùng `chuTuanHoc`, `tuanHocFt`, `khoangTamDung` có sẵn; chưa → Task 1 tự thêm **cả ba**, cùng chữ ký, cùng thân (giao kèo ghi ở kế hoạch UXF-a Task 4 — UXF-a cũng viết đúng ba hàm này).
- [ ] Đọc nguồn:
  - mockup 24 (đủ, trừ phần "A · tab 3"), mockup 26 (bản 2, bản 1, "Đã chọn", "Đã chốt");
  - K3.md §4(d), §4(e), K3-01, K3-03, K3-41, K3-47;
  - `profile.ts:448-510, 727-760, 763-1009`, `StudentDetailPage.tsx:159-519, 674-733`, `SkillBoard.tsx:137-499`,
    `HanhTrinh.tsx` (đủ), `students/hanhTrinh.ts` (đủ), `shared/domain/hanhTrinh.ts:143-477`, `classes/lichSuLop.ts`,
    `mywork.ts:440-507, 640-780, 800-900, 1050-1095`, `cases.ts:2103-2330, 2451-2600`, `yThuc/trangThai.ts:62-260`, `students/students.ts:240-303`.
- [ ] Commit `PR-VAI-b (0): kế hoạch + mốc {B}`.

## Task 1 · Nền chung: tuần học thứ n + khoảng Tạm dừng + dòng thông tin đầu hồ sơ

**Files:** `shared/domain/hienThiNgay.ts` · tạo `server/src/students/tamDung.ts` · `server/src/students/profile.ts` (`:763-795`) ·
`web/src/modules/students/StudentDetailPage.tsx` (`:171-255`) · tạo `server/src/tests/prVaiB.tests.ts` + đăng ký cuối `run.ts`.

Hiện trạng:
- Đầu hồ sơ ghi `{lớp} · GVCN · {ct} · W7/10` (lớp thường, `khoaLopThuong` + `tuanKhoa`) hoặc `{lớp} · {chương trình} · GVCN · mục tiêu` (FT); **không** tuần học FT, **không** thi dự kiến (Q2 kiểm kê).
- Nhật ký Tạm dừng / Quay lại nằm ở `journey_events` `pause`/`resume` (`students.ts:293-297`, ngày = `event_date`, lý do = `detail`, người = `created_by`).
- Nút "Lộ trình" dùng ký tự `▾ ▸` 11 px (`StudentDetailPage.tsx:226`).

```ts
/** "tuần học 3/8" (lớp thường, có tổng) · "tuần học thứ 9" (FT — không giới hạn tuần). Cùng thân với UXF-a Task 4. */
export const chuTuanHoc = (tuan: number, tong: number | null): string => (tong ? `tuần học ${tuan}/${tong}` : `tuần học thứ ${tuan}`);
/** Q31-11: tuần học thứ n của em FT tại tuần `tuan` — đếm từ tuần bắt đầu lộ trình, bỏ tuần Tạm dừng. Trước tuần bắt đầu hoặc tuần đang dừng → null. */
export function tuanHocFt(batDau: string, tuan: string, dung: readonly { tu: string; den: string | null }[]): number | null;
```
- [ ] **Phép kiểm trước** (khối 1):
  - `chuTuanHoc(3, 8)` = `tuần học 3/8`; `chuTuanHoc(9, null)` = `tuần học thứ 9`.
  - `tuanHocFt`: bắt đầu 10 tuần trước, dừng 2 tuần rồi quay lại → tuần này = **9**; tuần trong khoảng dừng → `null`; dừng chưa quay lại → đếm tới trước tuần dừng; trước tuần bắt đầu → `null`; Tạm dừng và Quay lại cùng tuần → không trừ tuần nào.
  - `khoangTamDung([a, b])`: một câu SQL (đếm câu); em a dừng 31/08 quay lại 14/09 → `[{ tu: '2026-08-31', den: '2026-09-14' }]`; em b đang dừng → `den: null`; em không dừng → không có khoá.
  - Máy chủ `studentProfile`: em FT HV 1 → `dauHoSo.thongTin.tuanHoc = { tuan: n, tong: null }` và **bằng** số UXF-a trả ở `xemChuyenLop` (nếu UXF-a đã merge; chưa thì so `tuanHocFt` gọi tay). Em lớp thường → `tong` = số tuần khoá. Không payload FT nào có `tong: 16`.
  - **Phủ định:** QL chi nhánh CP mở hồ sơ em MB → 403 (giữ).
- [ ] Shared: thêm hai hàm (Task 0 quyết `chuTuanHoc` có sẵn hay thêm); xuất qua `shared/domain/index.ts`.
- [ ] Máy chủ:
  - `tamDung.ts`: `khoangTamDung(ids)` — `SELECT student_id, event_type, event_date, detail, created_by … WHERE event_type IN ('pause','resume') AND student_id IN (…)`, ghép cặp theo thứ tự ngày; trả thêm `lyDo`, `boiId` cho dải Tạm dừng;
  - `profile.ts` trả `dauHoSo.thongTin`: `{ lop, lopId, lotrinh (LT1/RF/ct), target | 'KCK', tuanHoc: { tuan, tong }, thiDuKien (FT: tháng/tuần thi theo `examPlan`; lớp thường: "Cuối khoá W4 OCT"), gvcn, tamDung: { tu, lyDo, boi } | null }`. Dùng dữ liệu sẵn có (`current`, `selected`, `khoa`), thêm **một** câu `khoangTamDung`.
- [ ] Web `StudentDetailPage` đầu trang (mockup 24 A, C, D1):
  - dòng mã "Hồ sơ học viên · PISA-000087", tên 20 px, dòng thông tin `MB FT 101 · LT1 · target 6.5 · tuần học thứ 9 · thi dự kiến 06/2027 · GVCN Lê Thu Trang` (12,5 px, dấu `·` mờ, giá trị chính đậm);
  - lớp thường: `MB FOU 15 · FOU · tuần học 7/10 · Cuối khoá W4 OCT · GVCN …` (không target); Tạm dừng: `tuần học thứ 14 · đang dừng`;
  - nút "Lộ trình" dùng SVG mũi tên (như `MuiTen`, `SkillBoard.tsx:290`).
- [ ] `tocDoDuong`: `/students/{hv}` đo lại (+1 câu).
- [ ] `npm run check` → commit `PR-VAI-b (1): tuần học thứ n (một luật, bỏ tuần Tạm dừng) + dòng thông tin đầu hồ sơ`.

## Task 2 · Việc của em theo người + thanh việc của người xem (K3-01, Q31-8) — impeccable `clarify`

**Files:** `server/src/cases/cases.ts` (`caseCardOf :2451`) · tạo `server/src/students/viecHocVien.ts` · `server/src/students/profile.ts` (bỏ `headlineOf :448-510`, `:937`) ·
`web/src/modules/cases/SkillBoard.tsx` (kiểu `CaseCard :57-91`) · `web/src/modules/students/StudentDetailPage.tsx` · sửa `hanhTrinh.tests.ts:631-639`,
`hoSoHocVien.tests.ts:128,155`, `prS5fb.tests.ts:110`, `prSos.tests.ts:415`.

Hiện trạng:
- Ô "Việc cần làm tiếp" (`StudentDetailPage.tsx:479-494`) đọc `headline.next` — **một** việc của **bất kỳ ai**, chỉ nhặt từ bảng kỹ năng, không Ý thức / Phối hợp / Mini Test / Bàn giao, không biết người xem (K3-01).
- Công việc (`myWork`) đã có người làm từng việc nhưng quét cả phạm vi.

```ts
export type ViecHocVien = {
  key: string;                                   // đúng key của myWork (Q2)
  loai: 'nguyen-nhan' | 'xac-nhan-pa' | 'ghi-ket-qua' | 'ke-hoach' | 'cho-duyet' | 'bao-ph' | 'mini-test' | 'y-thuc' | 'ban-giao' | 'ban-giao-mon';
  chu: string;                                   // "Ghi kết quả tuần W4 SEP · PA Tăng cường bài tập Writing Task 2"
  kyNang: string | null; caseId: number | null; paId: number | null;
  han: string | null; quaHanNgay: number | null; tone: 'danger' | 'warn' | 'info' | 'wait';
  nguoi: { id: number | null; ten: string; vai: string | null };   // "Đỗ Thanh Tùng · GVBM Speaking" · "Quản lý"
  cuaBan: boolean;
};
```
- [ ] **Phép kiểm trước** (khối 2):
  - `nguoiLam` của Case: chờ nguyên nhân → `owner_user_id`; PA đang chạy chờ ghi kết quả → `performer_user_id` (thiếu thì `recorded_by`); Case không ai phụ trách → `null`.
  - **Hai đường:** với GVBM W2 (`P.w2Teacher`) và GVCN MB FT 101, mọi dòng `myWork(p).items` của em X thuộc nhóm `cause`, `xnpa`, `result`, `ke_hoach_bo_tro`, `phoi_hop`, `mini_test`, `yt_xu_ly` **có mặt** trong `viecCuaHocVien(p, X)` với `cuaBan = true`, **cùng key, cùng người làm**. Ngược lại mỗi việc `cuaBan` có hạn ≤ ngày mai có trong `myWork`.
  - GVBM Reading mở cùng em: việc Xác nhận nguyên nhân W2 **không** `cuaBan` (**phủ định**), có trong "việc của người khác" kèm tên GV W2.
  - GVCN: có "Xử lý vi phạm" khi em ở nhóm `bat_buoc`/`qua_han`; "Báo phụ huynh qua TVV" (lớp thường); QL: không có việc học thuật nào → `viec.cuaBan = []`.
  - Em Tạm dừng → `viec` rỗng (mọi hạn dừng, T65).
  - Sửa 5 phép kiểm cũ `headline.next` → `dauHoSo.viec` (cùng nghĩa); `prSos.tests.ts:415`: GVBM W2 → việc đầu `cuaBan` = "Xác nhận nguyên nhân Writing Task 2".
- [ ] Máy chủ:
  - `caseCardOf` thêm `nguoiLam` (tên người phụ trách Case: **một** câu `users IN (…)` cho cả bảng, dựng trong `skillSupportBoard`, không mỗi Case một câu);
  - `viecCuaHocVien(p, sid, board)`: Case/PA từ `board` (không gọi lại `skillSupportBoard`), Ý thức từ `trangThaiYThuc([sid])`, Báo PH từ `emCoBaoPhChuaLam([sid])` (`yThuc/phoiHop.ts:137`), Mini Test từ `miniTest` đã có (`profile.ts:981-991`), Bàn giao từ `dai.nut` (`daiChuyenLop.ts:76`); tên người một câu;
  - xếp: quá hạn → hạn sớm → không hạn; `cuaBan = nguoi.id === p.userId`;
  - `profile.ts`: bỏ `headlineOf`, dựng `skillSupportBoard` **một lần**, trả `dauHoSo.viec = { cuaBan: ViecHocVien[], nguoiKhac: ViecHocVien[] }`.
- [ ] Web (mockup 24 A, D3, E):
  - thanh "VIỆC CỦA BẠN" dưới bốn ô: nền `surface-2` + vạch trái xanh; quá hạn → nền đỏ nhạt + vạch đỏ; chữ việc 13,5 px, hạn 12 px có ⚠ SVG; nút chính động từ (`Ghi kết quả`, `Xác nhận nguyên nhân`, `Nộp kế hoạch`, `Đánh dấu đã làm`, `Bàn giao môn W`) mở đúng Ngăn Case / tab Ý thức / trang bàn giao như `onMoCase`/`DaiHocVienChuyen` đang làm;
  - nút chữ "n việc khác của bạn ▾" và "m việc của người khác ▾" (SVG) mở danh sách gập: `việc · Tên, vai` — hạn 12 px căn phải;
  - người xem không có việc nào với em → **không vẽ gì** (T72): không thanh, không dòng "việc của người khác"; việc của người khác xem ở cột Việc tiếp và trong câu tóm tắt;
  - **clarify:** động từ đầu dòng, không "Việc cần làm tiếp", không viết tắt "QL".
- [ ] `tocDoDuong`: `/students/{hv}` (bốn vai), `/students/{hv}/skill-board` đo lại.
- [ ] `npm run check` → commit `PR-VAI-b (2): việc của em theo người — thanh Việc của bạn, việc của người khác gập`.

## Task 3 · Câu tóm tắt + bốn ô (T72, K3-03, Q31-7, Q31-8) — impeccable `clarify` + `layout`

**Files:** `shared/domain/hoSoHocVien.ts` (hàm mới) · `shared/domain/cuoiKhoa.ts` (xuất `tenBacKe :48` nếu cần) · `server/src/students/profile.ts` ·
`web/src/modules/students/StudentDetailPage.tsx` (thay `HeaderStats :424-497`, `Stat :499-519`).

Hiện trạng: bốn ô cũ "Kết quả Test gần nhất · Kỹ năng cần hỗ trợ · Case đang mở · Việc cần làm tiếp" — ô 2 và 3 gần như luôn cùng số, không ô Ý thức, không ô Sắp tới, không câu tóm tắt.

- [ ] **Phép kiểm trước** (khối 3) — hàm thuần, theo bảng luật mockup 24:
  - `cauTomTat`:
    - FT SOS 2 hai kỹ năng + PA W2 quá hạn 3 ngày (của GV khác) + Ý thức bắt buộc → 3 mảnh `MT1 SOS 2: đang hỗ trợ Writing Task 2 và Speaking` (tone sos2) · `PA Writing Task 2 quá hạn ghi kết quả 3 ngày` (danger) · `Ý thức: bắt buộc Report 2, hạn hết 04/10` (warn);
    - Tạm dừng → mảnh đầu `Tạm dừng từ 07/09` (warn), còn tối đa 2 mảnh sau;
    - KCK → `KCK · không đặt kỳ vọng MT, không SOS` + `MT1 Overall 5.5: đang hỗ trợ Reading`;
    - Sắp chuyển → `Sắp chuyển MB FT 103 từ W2 OCT` (accent);
    - lớp thường Giữa khoá → `Giữa khoá 2/4 môn đạt: không đạt G+V và P` · `PA Bổ trợ chung chờ Quản lý duyệt kế hoạch` (wait) — **không** chữ SOS;
    - đạt hết, không Case → `MT2 đạt kỳ vọng · không có việc đang mở`;
    - đã kết thúc → mảnh đầu `Đã kết thúc`;
    - không bao giờ quá 3 mảnh; không có mã thô.
  - `oHocThuat(rows)`: số = số Case mở; mỗi kỹ năng một dòng `W2 · Quá hạn · ghi kết quả` (nhãn §7.3); lớp thường có dòng `PA Bổ trợ chung · 2 buổi/tuần · kế hoạch chờ Quản lý`; không Case → `0 · mọi kỹ năng đạt`.
  - `oYThuc(em)`: `Report 1` + `3 vi phạm / 2 tuần → bắt buộc Report 2 · hạn hết 04/10` (warn) · quá hạn (late) · chờ Quản lý duyệt (wait) · `Chưa xử lý lần nào · không có vi phạm mở`.
  - `oSapToi`: FT `MT2 · W4 OCT` + `kỳ vọng 6.0 · 5 phần` (KCK: `so với MT1, không kỳ vọng`); lớp thường `Cuối khoá · W4 OCT` + `4 môn · xét lên BE`; sau Cuối khoá `Chuyển lớp` + `chờ Quản lý ra lệnh · lớp kết thúc W4 OCT`; đã kết thúc `Kết luận: …`.
  - **Hai đường:** HV 1, bốn vai — `dauHoSo.o.hocThuat.so` = số hàng Case mở của `/students/1/skill-board` (Case `status !== 'done'`); mảnh 2 của câu = việc học thuật gấp nhất trong `dauHoSo.viec` (cả hai nhóm).
  - Q31-8: GVBM môn khác (không có việc) vẫn thấy mảnh "PA … quá hạn …" của người khác.
- [ ] Máy chủ `profile.ts`: `dauHoSo.tomTat`, `dauHoSo.o` từ **cùng** `board`, `viec`, `trangThaiYThuc([sid])` (Task 2 đã nạp), `attempts`, `nextCheckpoint`, `cuoiKhoa`, `dai`. Không câu SQL mới ngoài Task 1–2.
- [ ] Web (mockup 24 A, C, D2):
  - khung đầu hồ sơ: dòng thông tin → vạch mảnh → câu tóm tắt 14 px, mỗi mảnh một màu theo `tone`, ngăn bằng `·` mờ;
  - bốn ô cùng cỡ (`repeat(4, minmax(0,1fr))`, < 760 px 2×2): nhãn 11,5 px, dòng trên 12 px, giá trị 17 px đậm, dòng phụ 12 px; ô là `<button>` có `title`;
  - ô Kết quả: chip SOS (sos2 = cam `late`) / `2/4 môn đạt` / `Cuối khoá 66%` + hướng / KCK `Overall 5.5`; dòng phụ `5/5 phần có điểm · dưới kỳ vọng: W2 · S`;
  - **layout:** thứ tự dọc đúng mockup: khung thông tin + câu → dải trạng thái (Task 4) → bốn ô → thanh việc / dải chờ duyệt → hàng tab.
- [ ] `npm run check` → commit `PR-VAI-b (3): câu tóm tắt máy viết + bốn ô Kết quả · Học thuật · Ý thức · Sắp tới`.

## Task 4 · Dải trạng thái: Tạm dừng, KCK, Sắp chuyển (T65/K3-41 phần giao diện, Q31-7)

**Files:** `web/src/modules/students/StudentDetailPage.tsx` (`:257-263`) · `server/src/cases/cases.ts` (`skillSupportBoard`, chi tiết Case) ·
`web/src/modules/cases/SkillBoard.tsx` (`CotCase :243`, `HangCase :318`, `DongHan :174`) · `web/src/modules/cases/CasePanel.tsx` (nhãn trạng thái Case).

Hiện trạng: em Tạm dừng chỉ có nhãn "Tạm dừng" cạnh tên (`StudentDetailPage.tsx:186`); bảng kỹ năng và Ngăn Case vẫn hiện "Quá hạn" (kiểm kê B1 T65). Dải Sắp chuyển đã có (`DaiHocVienChuyen`, đúng chỗ — **đã có, giữ**).

- [ ] **Phép kiểm trước:**
  - `skillSupportBoard` + chi tiết Case của em Tạm dừng trả `tamDungTu` = ngày Tạm dừng; em đang học → `null`; em đã Quay lại → `null`.
  - Em Tạm dừng: `dauHoSo.viec.cuaBan` rỗng; câu mảnh đầu "Tạm dừng từ dd/mm".
  - KCK (Hồ Gia Hân, `sosV3Seed.ts:182`): `dauHoSo.o.ketQua.phu` chứa "KCK"; **không** chữ "kỳ vọng"; Case tay/PA/Ý thức vẫn tính (thanh việc có "Ghi kết quả" nếu có PA).
- [ ] Máy chủ: `tamDungTu` lấy từ `khoangTamDung` (Task 1) — một câu mỗi đường.
- [ ] Web:
  - dải vàng (mockup 24 D1) ngay dưới khung thông tin, trên bốn ô: biểu tượng tạm dừng SVG, `Tạm dừng từ 21/09 · mọi hạn đang dừng · lý do: … · Quản lý Nguyễn Khánh Vy`, dòng phụ `Quay lại học thì hạn tính lại từ ngày quay lại`; < 640 px chữ một dòng trọn;
  - bảng kỹ năng + Ngăn Case: khi `tamDungTu` → thay `NhanTrangThai` "Quá hạn" và `DongHan` quá hạn bằng nhãn vàng `Tạm dừng từ 21/09` (một thành phần nhỏ dùng chung, xuất từ `SkillBoard.tsx`);
  - KCK: chip điểm xám + dòng phụ `MT1 · KCK` (`ScoreCell :541-546`, `CotCase :268-270`).
- [ ] `tocDoDuong`: `/students/{hv}/skill-board`, `/cases/{id}` đo lại.
- [ ] `npm run check` → commit `PR-VAI-b (4): dải Tạm dừng, nhãn Tạm dừng thay Quá hạn, chữ KCK`.

## Task 5 · Quản lý: dải "n yêu cầu chờ bạn duyệt" (V1/K3-47) + menu ⋮ chia nhóm (K3-48) — impeccable `clarify`

**Files:** `server/src/students/profile.ts` (`viewer :952-975`) · `web/src/modules/students/StudentDetailPage.tsx` · `web/src/ui/Menu.tsx` (`:3-11`) ·
`shared/domain/quanLyHocVien.ts` (`:34-68`).

- [ ] **Phép kiểm trước:**
  - `viewer.coTheDuyet`: QL chi nhánh MB = true; GVCN, GVBM = false (**phủ định**); `GET /yeu-cau?studentId=` với GVCN → 403 (giữ).
  - QL có hai thẻ chờ của em (một quá hạn) → `hopChoDuyet({ studentId })` trả thẻ quá hạn **trước**.
  - `mucQuanLyHocVien` trả thêm `nhom` (`thong-tin` | `lo-trinh` | `lop`) và `phu` (một dòng hệ quả) cho: Chuyển lớp (`chọn lớp đích và tuần bắt đầu`), Tạm dừng (`mọi hạn của em dừng · giữ lớp, lộ trình`), Kết thúc (`đóng lộ trình · hồ sơ chỉ xem`), Xoá (`chỉ Quản trị hệ thống thấy dòng này`); **tập mục và thứ tự quyền không đổi** (so với bản cũ ở cả 5 vai).
- [ ] Máy chủ: `viewer.coTheDuyet = can(p, PERMISSIONS.REQUEST_APPROVE, { studentId })`.
- [ ] Web:
  - dải tím gập (mockup 24 B) ở chỗ thanh việc: `Chờ duyệt · 2 yêu cầu chờ bạn duyệt · 1 quá hạn ▾` (SVG); mở ra từng `TheYeuCau` có sẵn (Duyệt / Từ chối… / Duyệt = ra lệnh), xong một thẻ thì tải lại dải + hồ sơ; không có thẻ → không vẽ;
  - `Menu`: tiêu đề nhóm 11 px chữ hoa mờ, mục có `phu` 11,5 px mờ dưới nhãn; vạch đậm trước Tạm dừng/Kết thúc, vạch đỏ trước Xoá.
- [ ] `tocDoDuong`: thêm `/yeu-cau?studentId={hv}` (QL, QT), đo trần.
- [ ] `npm run check` → commit `PR-VAI-b (5): Quản lý duyệt ngay trong hồ sơ; menu ⋮ chia nhóm, nói hệ quả`.

## Task 6 · Bảng kỹ năng: Case khung rỗng / PA khối đặc, người làm, 12 px, mã tuần — impeccable `clarify`

**Files:** `web/src/modules/cases/SkillBoard.tsx` (`HangCase :318-417`, `HangPA :424-499`, cột Việc tiếp `:211-218`, `nextStepOf :608-614`, `CotPhai :666-673`).

- [ ] **Phép kiểm trước** (hàm thuần tách khỏi component, để kiểm được):
  - `nextStepOf` trả thêm `nguoi` (từ `nguoiLam`), chữ phụ `hạn hết 02/10 · Đỗ Thanh Tùng`.
  - Chữ khoảng PA: `từ W3 SEP · đến MT2 · W4 OCT` (không `dd/mm`); kết quả gần nhất `Tiến bộ một phần · W3 SEP`.
  - Quét chuỗi: `SkillBoard.tsx` không còn `text-[11px]` cho hạn, kết quả, người (Q22).
- [ ] Web (mockup 24 A bảng):
  - hàng Case: nhãn viền `Case` (viền chữ chính, không nền) trước chip MT; giữ vạch trái `VACH_CASE`; dòng phụ nguyên nhân · "1 PA đang làm";
  - hàng PA: nhãn `PA` **nền đặc** (`line-strong`), chờ duyệt kế hoạch → nền tím nhạt; nền hàng `surface`; đường nối SVG/CSS từ Case xuống (mockup `.kb tr.hp td:first-child::before`);
  - cột Việc tiếp: việc 12 px + `hạn hết … · {tên người}` 12 px; quá hạn: ⚠ SVG + `quá hạn 3 ngày` đỏ;
  - giữ khoá "theo quy chế", nút trên / chữ phụ dưới (YC-12.5.4).
- [ ] `npm run check` → commit `PR-VAI-b (6): bảng kỹ năng — Case khung rỗng, PA khối đặc, người làm, chữ 12 px`.

## Task 7 · Điện thoại 375 px: bảng kỹ năng thành thẻ (UX-D3) + đầu hồ sơ xếp dọc (Q31-3) — impeccable `adapt`

**Files:** tạo `web/src/modules/cases/TheKyNang.tsx` · `web/src/modules/cases/SkillBoard.tsx` (`SkillBoard :137-171` chọn biến thể bằng `useDienThoai` — `ui/TheDong.tsx:8`) ·
`web/src/modules/students/StudentDetailPage.tsx`.

Hiện trạng: `<table min-w-[680px]>` (`SkillBoard.tsx:156`) cuộn ngang ở 375 px, GV không thấy cột Việc tiếp.

- [ ] **Phép kiểm trước:** hàm thuần `xepTheKyNang(rows)` — kỹ năng có Case mở lên trước, quá hạn trước; kỹ năng đạt → dạng gọn; thứ tự trong nhóm giữ thứ tự bảng.
- [ ] Web (mockup 24 E):
  - `< 640 px` chỉ vẽ thẻ (không vẽ bảng rồi ẩn); tiêu đề "Tiến độ theo kỹ năng · Case gấp lên trước";
  - thẻ kỹ năng có Case: tên + chip điểm; `MT1 · kỳ vọng 5.5 · thiếu 0.5`; khối Case (nhãn `Case` viền + chip MT + tên + chip SOS; nhãn trạng thái + "1 PA đang làm"); khối PA thụt vào nền `surface-2` + đường nối (khối đặc), `người · đến MT2 · W4 OCT`, kết quả, dòng việc + nút; việc của người khác: `Việc của Đỗ Thanh Tùng · Mở Case`;
  - kỹ năng đạt: thẻ một dòng `Listening · vượt 0.5 · 6.0 ✓` (dấu tích SVG), bấm mở;
  - đầu hồ sơ: bốn ô 2×2, thanh việc xếp dọc (chữ một dòng trọn, nút dưới), vùng bấm ≥ 44 px;
  - **adapt:** không cuộn ngang toàn trang ở 375 px, sáng và tối.
- [ ] `npm run check` → commit `PR-VAI-b (7): điện thoại — bảng kỹ năng thành thẻ, đầu hồ sơ xếp dọc`.

## Task 8 · Đường dẫn sâu "MT2 · Speaking" → hồ sơ Mock cuộn tới kỹ năng (E.4 / G5)

**Files:** `shared/domain/duongHoSo.ts` (hàm mới `duongDotTest`, `docKnMock`) · `web/src/lib/format.ts` (`attemptHref :134` gọi hàm mới) ·
`web/src/modules/fasttrack/MockDetailPage.tsx` (`useParams :110`, `moODiem :183`) · `server/src/cases/cases.ts` (`skillSupportBoard` thêm `bandAttemptId`) ·
`web/src/modules/cases/SkillBoard.tsx` (`ScoreCell :541-546`) · `web/src/modules/cases/TheKyNang.tsx` · `web/src/modules/students/StudentDetailPage.tsx`
(`IeltsAttempts :580-583`, ô Kết quả gần nhất của Task 3).

Hiện trạng:
- Chưa có quy ước đường dẫn "em + lượt + kỹ năng" (G5). Hồ sơ Mock có `moODiem(k)` (mở ô kỹ năng + cuộn tới `#dai-diem`) nhưng **chỉ bấm trong trang**, không đọc URL.
- `?dot=&kn=` hiện có (`duongHoSoHocVien`) mở **hồ sơ HV**, không phải hồ sơ Mock.
- Chỗ nhắc "MT1 · kỹ năng" trong hồ sơ HV chỉ là chữ: dòng `MT1 · kỳ vọng 5.5` ở bảng kỹ năng, ô band L/R/W/S ở bảng Mock Test, "dưới kỳ vọng: W2 · S" ở ô Kết quả.
- Có **hai** `attemptHref` (web `format.ts:134`, máy chủ `fasttrack/attempts.ts`) cùng luật — bản web đổi ở đây, bản máy chủ giao UXF-b (Q24).

```ts
/** G5: một đường tới kết quả một đợt Test của em. FT → hồ sơ Mock (+ cuộn tới kỹ năng); lớp thường → bảng điểm lớp thường (bỏ `kn`). */
export function duongDotTest(d: { id: number; kind?: string | null; classId?: number | null }, kn?: string | null): string;
/** `kn` trên URL hồ sơ Mock → ô lớn: writing1/writing2/writing → 'writing'; lạ → null. */
export function docKnMock(kn: string | null | undefined): 'listening' | 'reading' | 'writing' | 'speaking' | null;
```
- [ ] **Phép kiểm trước** (khối 8):
  - `duongDotTest({ id: 5, kind: 'mock' }, 'speaking')` = `/mock-test/5?kn=speaking`; không `kn` → `/mock-test/5`; `kn` lạ → bỏ; lớp thường `{ id: 7, kind: 'progress', classId: 3 }, 'speaking'` = `/bang-diem-thuong/3?kind=progress` (bỏ `kn`, Q24); `attemptHref(a)` = `duongDotTest(a)` với mọi mẫu của phép kiểm cũ (không đổi đường cũ).
  - `docKnMock`: `writing2` → `writing`; `listening` → `listening`; `abc`, `null` → `null`.
  - `skillSupportBoard` trả `bandAttemptId` **cùng lượt** với `bandAttemptNo` ở mọi hàng FT (HV 1); không thêm câu SQL (đếm câu `/students/1/skill-board` không đổi).
  - Quét chuỗi: `SkillBoard.tsx`, `TheKyNang.tsx`, `StudentDetailPage.tsx`, `HanhTrinh.tsx`, `ChuongLop.tsx` không tự ghép `` `/mock-test/ `` (chỉ qua `duongDotTest`).
  - **Phủ định:** người ngoài phạm vi mở `/mock-test/{id}?kn=speaking` vẫn bị chặn như `/mock-test/{id}` (đường máy chủ có sẵn, tham số `kn` không đổi quyền).
- [ ] Shared: hai hàm trên; xuất qua `shared/domain/index.ts`. Web `attemptHref` chỉ còn gọi `duongDotTest` (giữ tên để không sửa 8 chỗ gọi).
- [ ] Máy chủ: `skillSupportBoard` thêm `bandAttemptId` từ dòng lượt đã nạp (không câu mới).
- [ ] Web:
  - hồ sơ Mock: đọc `?kn=` một lần khi dữ liệu có → `moODiem(docKnMock(kn))`, cuộn bằng `cuonOnDinh` (như hồ sơ HV R7); không có ô kỹ năng đó trong đợt → không cuộn, không lỗi;
  - bảng kỹ năng (bảng và thẻ): `MT1` trong dòng `MT1 · kỳ vọng 5.5` là liên kết `duongDotTest(…, row.category)`, có `title` "Mở hồ sơ Mock · MT1 · Speaking";
  - bảng Mock Test hồ sơ HV: ô L/R/W/S là liên kết tới đúng kỹ năng (Tab vào được, `stopPropagation` như ô MT hiện có `:562`); hàng vẫn bấm mở đợt;
  - ô Kết quả gần nhất: mỗi mã trong "dưới kỳ vọng: W2 · S" là liên kết tới đúng kỹ năng;
  - Hành trình (Task 10, 11): ghim đợt + thẻ chương → hồ sơ Mock của đợt; mốc điểm trong chuỗi điểm của hộp kỹ năng → `?kn=`.
- [ ] `npm run check` → commit `PR-VAI-b (8): đường dẫn sâu MT · kỹ năng → hồ sơ Mock cuộn tới kỹ năng (G5)`.

> **Điểm tách phiên (Câu 1 = A):** hết Task 8 thì phiên 1 dừng: `npm run check` xanh, commit, ghi Nhật ký "phiên 1 xong Task 0–8", **không** mở PR. Phiên 2 mở lại cùng worktree, chạy Task 0 rút gọn (kiểm model + `npm run check` ghi mốc B2), rồi Task 9–12.

## Task 9 · Hành trình máy chủ: chương theo lớp + dữ liệu trục mới; bỏ Lịch sử lớp và Mốc học tập (Q31-10, K3-32)

**Files:** `shared/domain/hanhTrinh.ts` (hàm mới `chiaChuong`, `lapLaiQuaLop`) · `server/src/students/hanhTrinh.ts` · xoá `server/src/classes/lichSuLop.ts`,
route `routes/index.ts:1734-1738` · `server/src/students/profile.ts` (bỏ `episodesOf :173-258`, câu `journeyRows :727-755`, `:950-951`) ·
sửa `lenLop.tests.ts:881-948, 1081-1092`, `hanhTrinh.tests.ts:641-650`, `run.ts:1269, 1292, 6795` · `tests/tocDoDuong.ts`.

Hiện trạng:
- `hanhTrinhHocVien` chỉ nạp **một** giai đoạn (`:60-93`), PA + lần ghi kết quả chỉ của Case trong giai đoạn (`:164-189`), `progOf` gọi `programmeOfClass` **mỗi lớp** (`:126-131`).
- Lịch sử lớp là route riêng; `typedResult(a)` **không** truyền `pre` → mỗi lớp thêm câu (`lichSuLop.ts:56-58`).
- `episodes` chỉ dùng cho khối "Mốc học tập" (K3-32 bỏ).

```ts
export type Chuong = {
  enrollmentId: number; lop: { id: number; code: string; ngan: string }; nhan: string;   // "FOU · lớp thường" · "FT · LT1 · target 6.5"
  tu: string; den: string | null; dangHoc: boolean; soTuan: number | null;               // lớp thường: số tuần; FT: null
  tuanHoc: { tu: number; den: number | null } | null;                                     // FT: "tuần học 1–8" / "tuần học thứ 15"
  gvcn: string | null; tamDung: { tu: string; den: string | null }[];
  ghim: GhimTest[]; caseDong: { caseId: number; ten: TenCase; sos: number | null; xongO: string | null; diTheoSang: string | null;
    pa: { id: number; ten: string; tone: 'ok' | 'part' | 'bad' | 'run' | 'wait' }[]; diem: string | null }[];
  ra: { loai: 'len' | 'chuyen' | 'hoc-lai' | 'bao-luu' | 'dung' | 'ket-thuc' | null; chu: string; how: string | null; docBanGiao: { lenhId: number; lopNguonId: number } | null } | null;
};
```
- [ ] **Phép kiểm trước** (khối 8):
  - `chiaChuong` (thuần): Case mở ở chương 3 còn mở sang chương 4 → chương 3 có `diTheoSang = 'MB FT 101'`, chương 4 có Case đó; PA bắt đầu ở chương 3 nằm chương 3, PA bắt đầu ở chương 4 nằm chương 4; ghim theo `class_id` lượt; chương không có Case → `caseDong = []`.
  - `lapLaiQuaLop`: Speaking có Case ở BE và FT → một dòng "Speaking …"; chỉ một chương → không dòng.
  - Máy chủ HV 1 (FOU → BE → FT): `chuong.length` = số ghi danh; đúng thứ tự thời gian; mỗi chương có `gvcn`; chương lớp thường ghi `Giữa khoá · 3/4 môn`, `Cuối khoá · 80%` — **không** chữ SOS; chương FT đang học `tuanHoc.tu = tuanHocFt(...)` của tuần này (**bằng** `dauHoSo.thongTin.tuanHoc.tuan`, hai đường).
  - Chuyển các phép kiểm `lichSuLop` sang `chuong`: nhãn kết thúc vì (`nhanKetThucVi`), kết quả Cuối khoá của **chính em** (`lenLop.tests.ts:1081` — không lộ "đạt" của bạn cùng lớp), **phủ định** QL chi nhánh CP → 403.
  - Đếm câu: thêm 6 lớp cũ **không** tăng quá 1 câu (mẫu `lenLop.tests.ts:936-948`).
  - `profile` không còn `episodes`; Ý thức vẫn không vào Hành trình (chuyển `hanhTrinh.tests.ts:641` sang kiểm `chuong`/`tamDung`).
  - Chân chương có lệnh chuyển đã xác nhận bàn giao → `docBanGiao` có `lenhId` (PR-CT Q17 không mất).
- [ ] Máy chủ `hanhTrinhHocVien`:
  - nạp lượt, điểm, `attempt_skills`, Case, PA, lần ghi kết quả của **mọi** lộ trình (số câu cố định); chương trình lớp từ JOIN (Q20);
  - thêm ba câu: ghi danh + lớp; GVCN `teacher_assignments is_core = 1 AND class_id IN (…)`; lệnh chuyển `lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'da_chuyen'`; cộng `khoangTamDung([sid])`;
  - trả thêm `chuong`, `lop` (đoạn cho hàng Lớp: mã, mã ngắn, GVCN, `chuyen`), `tamDung`, `tuanHoc` (FT: tuần bắt đầu mỗi lộ trình; lớp thường: tuần khai giảng + tổng tuần); **bỏ** `doan`;
  - phần trục (`giaiDoan`, `ghim`, `hop`) giữ, vẫn theo `?giai-doan=`.
- [ ] `tocDoDuong`: `/students/{hv}/hanh-trinh` (hai biến thể) đo lại; bỏ `/lich-su-lop`.
- [ ] `npm run check` → commit `PR-VAI-b (9): Hành trình máy chủ — chương theo lớp, nạp một lần; bỏ Lịch sử lớp và Mốc học tập`.

## Task 10 · Hành trình web: thẻ chương (mockup 26 bản 2) — impeccable `layout` + `adapt`

**Files:** `web/src/modules/students/HanhTrinh.tsx` (bỏ `:141-144`, `:264-287`, import `Episode`) · xoá `web/src/modules/students/LichSuLop.tsx` ·
`web/src/modules/students/StudentDetailPage.tsx` (`:359-372`, bỏ `Episode :674-733`) · tạo `web/src/modules/students/ChuongLop.tsx`.

- [ ] **Phép kiểm trước:** quét chuỗi — `HanhTrinh.tsx` không còn `Mốc học tập`, `BoLocDoan ariaLabel="Giai đoạn"`; `StudentDetailPage.tsx` không còn `LichSuLop`, `Episode`.
- [ ] Web (mockup 26 bản 2):
  - đầu tab: `4 lớp · từ W2 JAN · 39 tuần` + chữ phụ `Mới nhất ở bên phải · cuối mỗi thẻ là cách em sang lớp sau`;
  - thẻ chương (desktop: lưới các chương, chương đang học rộng hơn, mũi tên SVG giữa hai thẻ; > 4 chương cuộn ngang — Q23): nhãn chương trình 11 px chữ hoa · mã lớp 16 px đậm · `W2 JAN → W2 MAR · 10 tuần` / `từ W3 AUG · tuần học thứ 15` · `GVCN …`; dải sọc vàng Tạm dừng; ghim Test (chip màu theo mức, sos2 cam) + dòng phụ `dưới kỳ vọng: W2 · S`; mỗi Case: nhãn `Case` viền + chip MT + tên + chip SOS (+ `xong ở MT2`), PA là chip **nền đặc** có dấu kết quả SVG; `Case đi theo em sang …`; chân thẻ: `Lên BE · theo Cuối khoá · từ W3 MAR` / `Chuyển lớp · Quản lý ra lệnh · từ W3 AUG` + "Đọc bàn giao" nếu có; chương đang học viền xanh + nút "Xem trục tuần";
  - dòng cảnh báo "Lặp lại qua các lớp" (⚠ cam) + chữ phụ "Máy tự viết dòng này khi …";
  - ghim Test trong thẻ là liên kết `duongDotTest` (G5, Task 8) — bấm ghim không kích hoạt bấm thẻ;
  - bấm thẻ / "Xem trục tuần" → Q16;
  - **adapt** (< 640 px): chương đang học mở sẵn; chương cũ gập một dòng `MB FT 104 · W2 JUN → W2 AUG · MT1 SOS 1 · Case Reading · Tạm dừng 2 tuần`, giữa các dòng là mối nối `chuyển lớp · W3 AUG` / `lên FT + bổ trợ S · W2 JUN`; mới nhất ở trên.
- [ ] `npm run check` → commit `PR-VAI-b (10): Hành trình — thẻ chương theo lớp thay Lịch sử lớp; bỏ nút giai đoạn, bỏ Mốc học tập`.

## Task 11 · Trục tuần nâng cấp (mockup 26 bản 1) + chú giải gọn (T74/K3-30, UX-D4) — impeccable `layout` + `adapt`

**Files:** `shared/domain/hanhTrinh.ts` (`nhanGhim :329-388` thêm bản hai dòng, `trangThaiHop :206-224`, `nhanKhoiPa :164-192`, `dongPhuVanDe :226-229`,
`xepHangLuoi :456-477`, bỏ `nhanGiaiDoan :409-414`) · `web/src/modules/students/HanhTrinh.tsx` (lưới, `HopKyNang :297-365`, `VanDeHang :384-409`,
`ChuaCoPa :411-422`, `ChuGiai :443-483`) · `server/src/tests/hanhTrinh.tests.ts` (kỳ vọng `xepHangLuoi :386-399`, nhãn ghim, `Xong dd/mm`).

- [ ] **Phép kiểm trước:**
  - `nhanGhim` trả `hai: [tren, duoi]`: FT `['MT1', '5.5']`, chưa điểm `['MT3', '']`; lớp thường `['Giữa', '3/4']`, `['Cuối', '80%']`; tooltip `day` giữ đủ chữ; lớp thường không "MT", không "SOS".
  - `trangThaiHop` xong → `Xong W2 SEP` (mã tuần); `dongPhuVanDe` → `từ W2 SEP · 1 PA` / `W3 JUL → W2 SEP · 2 PA`; `nhanKhoiPa.day` dùng mã tuần.
  - `xepHangLuoi` mới: hàng tháng · tuần · Tuần học/Tuần khoá · Lớp · Đợt Test; mỗi Case **một hàng khung** + các tầng PA (sửa kỳ vọng cũ, không xoá).
  - Khối chờ (Q18): Case chờ nguyên nhân, chưa có PA, PA Bổ trợ chờ kế hoạch → khối `wait` với chữ đúng (R5-2: không còn "Chưa có PA" khi có PA Bổ trợ chờ kế hoạch).
  - Hàng Tuần học: FT tuần dừng → `–`; tuần này = `dauHoSo.thongTin.tuanHoc.tuan` (hai đường); lớp thường ghi tuần khoá 1…n.
  - Quét chuỗi: không `n/16`; chú giải ≤ 9 mục.
- [ ] Web (mockup 26 bản 1):
  - **tháng**: tên căn giữa, ngoặc viền trải đúng số tuần của tháng; vạch đầu tháng đậm;
  - **đợt Test**: mỗi đợt gọn trong **một cột tuần**, hai dòng `MT1 / 5.5`, màu theo mức; đợt dự kiến ở cột **tuần tới** viền đứt; bấm mở **hồ sơ Mock** của đợt bằng `duongDotTest` (G5 — thay `duongHoSoHocVien(…, { dot })` ở `HanhTrinh.tsx:240`); mốc điểm trong chuỗi điểm của hộp kỹ năng là liên kết `duongDotTest(…, kyNang)`;
  - **hàng Lớp**: đoạn mỗi lớp (`MB FT 104` + `GVCN …`; Xem gọn: `FT 104`), biểu tượng chuyển lớp SVG ở lớp mới;
  - **hàng Tuần học** (FT) / **Tuần khoá** (lớp thường); chỉ tuần học của em, không tuần của lớp FT (Q31-11);
  - **Tạm dừng**: dải sọc vàng từ hàng Tuần học xuống hết lưới + chip `Tạm dừng` (Xem gọn: chỉ biểu tượng);
  - **Case** = khung rỗng viền theo mức SOS (lớp thường viền trung tính), từ tuần mở tới tuần xong (mở: mép phải đứt), chữ `mở W2 SEP · đang mở` / `✓ Xong W2 SEP`; cột tên: nhãn `Case` viền + chip MT + chip SOS, dòng phụ mã tuần;
  - **PA** = khối đặc ở hàng dưới (tầng như cũ), cột tên nhãn `PA` nền đặc + `2 phương án · {người}`; khối chờ viền đứt tím;
  - cột **tuần tới** kiểu mờ/đứt; cột tuần này giữ nền nhạt;
  - bỏ hàng Khoá/Lộ trình cũ (`:205-223`);
  - **chú giải** (Q17): một dòng 9 mục bằng SVG (không ký tự ▾ ▸ ✓ nhỏ); < 640 px thu gọn chỉ ký hiệu + nút "Ký hiệu";
  - **adapt / UX-D4**: Xem gọn bật sẵn < 640 px; cột tên ghim trái; nhãn `Case` + chip `SOS 2` đọc được ở Xem gọn; không cuộn ngang toàn trang.
- [ ] `tocDoDuong`: không đổi số câu (chỉ web + hàm thuần) — xác nhận.
- [ ] `npm run check` → commit `PR-VAI-b (11): trục tuần nâng cấp — tháng có ngoặc, ghim gọn, hàng Lớp/Tuần học, Tạm dừng, Case khung/PA khối; chú giải gọn`.

## Task 12 · Bấm thử theo vai, 1440 + 375, sáng/tối — impeccable `audit` + `polish`, `/ponytail-review`, mở PR

- [ ] Cổng gộp `origin/main` (nếu UXF-a / VAI-a / Pb2 đã merge) → gỡ theo bảng file chồng → `npm run check`. UXF-a đã merge → bỏ bản `chuTuanHoc` trùng, đưa phần đếm tay của UXF-a về `tuanHocFt` + `khoangTamDung` nếu còn.
- [ ] Dựng dữ liệu bấm thử qua giao diện (Q21): QL mở HV 1 › ⋮ › Tạm dừng học (ngày 31/08) → Quay lại học (07/09); chọn một em FT khác › Tạm dừng học (hôm nay) và **để nguyên**.
- [ ] Chạy mục **KIỂM** theo vai QL (Nguyễn Khánh Vy id 2), GVCN FT, GVBM, GVCN lớp thường, Quản trị (id 1). Ảnh `thiet-ke/anh/pr-vai-b/{muc}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] impeccable **`audit`** trên đầu hồ sơ, bảng kỹ năng (bảng + thẻ), tab Hành trình, rồi **`polish`** (sáng **và** tối). Kiểm:
  - cỡ chữ Q31-4 (kết quả / hạn / người 12 px);
  - mã tuần; FT "tuần học thứ n", không "/16";
  - Case khung rỗng / PA khối đặc ở cả ba chỗ;
  - SOS 2 cam; không chữ SOS ở lớp thường;
  - mọi "MT · kỹ năng" trong hồ sơ HV bấm được, mở hồ sơ Mock cuộn đúng ô (G5);
  - tương phản ≥ 4.5:1 ở chữ phụ, sáng và tối.
- [ ] `/ponytail-review`; liệt kê mọi `ponytail:` mới trong thân PR.
- [ ] Quét: không còn `npm run check` treo; tắt 4167/5367.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - bảng mục (mã → ảnh trước/sau → đạt);
  - **tầng 1** của từng màn (§7.5): đầu hồ sơ → mức/kết quả gần nhất + việc của bạn; bảng kỹ năng → điểm + việc tiếp; Hành trình → chương đang học + Case đang mở;
  - mốc B → số phép kiểm cuối;
  - trần tốc độ đổi (kể cả dòng `/lich-su-lop` bỏ);
  - "Chuyển cho PR khác";
  - `ponytail:`.

## Câu hỏi cho chủ sản phẩm — ĐÃ CHỐT 01/10 (planning): Câu 1 = A, một PR hai phiên nối tiếp

- **Câu 1 — PR này lớn (13 Task). Làm một PR hay hai?**
  - A. **Một PR, hai phiên nối tiếp** trên cùng nhánh: phiên 1 Task 0–8 (đầu hồ sơ, bảng kỹ năng, điện thoại, đường dẫn sâu), phiên 2 Task 9–12 (Hành trình, bấm thử, mở PR). Một lượt rà, một lần merge.
  - B. **Hai PR:** VAI-b1 (Task 0–8) và VAI-b2 (Task 9–11 + bấm thử riêng). VAI-b2 chạy sau VAI-b1 (dùng chung `tuanHocFt`, `khoangTamDung`). Hai lượt bấm thử, hai lần merge.
  - **Khuyên A** (anh/chị ưu tiên gộp PR; hai nửa cùng file `StudentDetailPage.tsx`, `profile.ts`). Kế hoạch viết theo A, có "Điểm tách phiên" sau Task 8.

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Giao kèo VAI-b để lại |
|---|---|---|
| Đếm "tuần học thứ n" ở panel Chuyển lớp (UXF-a Task 4) dùng **cùng** `tuanHocFt` + `khoangTamDung`; `chuTuanHoc` một bản | **PR-UXF-a** (PR merge sau gỡ) | `shared/domain/hienThiNgay.ts`, `server/src/students/tamDung.ts` |
| Mã tuần còn lại ở Case/PA ngoài bảng kỹ năng: `CasePanel.tsx:234-235`, `NganCase.tsx:170`, `sosV4.ts:38`, `cases.ts:2630-2642`, `StudentDetailPage.tsx:332` (Mục tiêu đã đổi) | **PR-UXF-b** (B5) | Hành trình + hàng PA bảng kỹ năng **đã** đổi (Q19) — UXF-b bỏ hai dòng đó khỏi B5 |
| R5-2 "Chưa có PA" với PA Bổ trợ chờ kế hoạch | **PR-UXF-b** | **đã sửa ở đây** (Q18) — UXF-b gạch |
| R5-1 ngày ở dải Sắp chuyển (`DaiChuyenLop.tsx:98`), R5-3 hạn duyệt kế hoạch ở hàng Case chính, O1 dòng Xin ý kiến ở `HangPA`, O2 panel Tạm dừng đếm vi phạm | **PR-UXF-b** | `HangPA`/`HangCase` đã theo luật Case khung / PA khối — thêm dòng tím Xin ý kiến vào `HangPA` **và** thẻ `TheKyNang.tsx` |
| Bảng Mock Test / Kết quả kiểm tra trên điện thoại (`StudentDetailPage.tsx:528-650`), hàng tab điện thoại | **PR-UXD** | `useDienThoai` + mẫu thẻ `TheKyNang.tsx` dùng lại được |
| Tổng quan / Công việc có muốn dùng `viecCuaHocVien` (việc theo em, có người làm) | **PR-VAI-a** (nếu cần) | hàm một em; nhiều em thì **không** gọi lặp — dùng `myWork` |
| Nợ điểm em Tạm dừng (`scoreDebt.ts:29`) | **PR-UXF-a** (Task 5) | hồ sơ HV vẫn hiện ô điểm; nhãn Tạm dừng thay Quá hạn ở hồ sơ đã có |
| G5 ở màn **ngoài** hồ sơ HV: danh sách bấm ra "bài quá hạn" (`worklist/metrics.ts:108`, dòng `bai` của UXF-a — mỗi dòng một kỹ năng), dòng Nợ Lịch Test (`KhoiNo.tsx`), ô Kết quả gần nhất Học viên & Lớp, dòng lịch sử MT ở Ngăn Case (`CasePanel.tsx:370`), bản máy chủ `attemptHref` (`fasttrack/attempts.ts`) gọi `duongDotTest` | **PR-UXF-b** | `duongDotTest(dot, kn?)`, `docKnMock` ở `shared/domain/duongHoSo.ts`; hồ sơ Mock đã đọc `?kn=` |

## KIỂM — kịch bản bấm thử

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| 1 | GVBM W2 | Học viên & Lớp › MB FT 101 › em có Case W2 + S (SOS 2) | mở hồ sơ | dòng thông tin `… · tuần học thứ n · thi dự kiến …` (không `/16`); câu 3 mảnh (cam · đỏ · vàng); bốn ô; thanh **đỏ** "Ghi kết quả tuần W… · PA …" + "2 việc của người khác ▾" có tên GV S, GVCN |
| 2 | GVBM Reading (cùng em) | như 1 | mở hồ sơ | câu vẫn nêu "PA W2 quá hạn …" (Q31-8); **không** thanh việc (không có việc) |
| 3 | QL | cùng em | mở hồ sơ | **không** thanh việc; dải tím "n yêu cầu chờ bạn duyệt · k quá hạn ▾" (nếu có thẻ), mở ra Duyệt / Từ chối được; menu ⋮ chia nhóm Thông tin · Lộ trình · Lớp, dòng hệ quả |
| 4 | GVCN lớp thường | Hồ sơ em FOU có Giữa khoá trượt G+V, P | mở | `tuần học 7/10 · Cuối khoá W4 OCT`; câu "Giữa khoá 2/4 môn đạt: không đạt G+V và P · PA Bổ trợ chung chờ Quản lý duyệt kế hoạch"; **không chữ SOS**; thanh "Báo phụ huynh qua TVV" |
| 5 | GVCN | em vừa Tạm dừng (bước dựng Task 12) | mở | dải vàng "Tạm dừng từ dd/mm · mọi hạn đang dừng · lý do · người"; câu mở đầu "Tạm dừng từ …"; không thanh việc; bảng kỹ năng nhãn vàng "Tạm dừng từ …" thay "Quá hạn"; Ngăn Case cũng vậy |
| 6 | GVBM R | Hồ Gia Hân (KCK) | mở | câu "KCK · không đặt kỳ vọng MT, không SOS · …"; chip điểm xám, dòng phụ "KCK"; Case tay/PA vẫn có việc |
| 7 | GVBM W | Trần Minh Khoa CT (sắp chuyển) | mở | dải Sắp chuyển trên bốn ô; câu có "Sắp chuyển MB FT 103 từ W2 OCT"; "1 việc khác của bạn" = Bàn giao môn W |
| 8 | mọi vai | Hồ sơ HV 1 › tab Hành trình | xem | 3–4 thẻ chương FOU → BE → FT; không việc/hạn/người giữ việc trong thẻ; Case khung rỗng, PA khối đặc; chương FT có dải Tạm dừng (bước dựng); "Lặp lại qua các lớp" nếu có; **không** bảng Lịch sử lớp, **không** "Mốc học tập", **không** nút giai đoạn |
| 9 | GVCN | như 8 | bấm chương FOU | trục chuyển sang Lớp thường, cả giai đoạn; hàng "Tuần khoá"; ghim `Giữa / 3/4`, `Cuối / 80%` |
| 10 | GVCN | như 8 | trục FT | tháng căn giữa có ngoặc; ghim `MT1 / 5.5` gọn một cột; hàng Lớp đổi FT 104 → FT 101; hàng Tuần học bỏ tuần dừng (tuần này = số ở đầu hồ sơ); Case khung từ tuần mở; cột tuần tới đứt có MT dự kiến |
| 11 | GVCN | chương có lệnh chuyển đã xác nhận bàn giao | chân chương "Đọc bàn giao" | mở phiếu bàn giao (chỉ đọc nếu không phải GVCN lớp cũ) |
| 12 | GVBM | 375 px · hồ sơ như 1 | xem | bốn ô 2×2, thanh việc dọc; bảng kỹ năng thành **thẻ**, Case gấp lên trước, kỹ năng đạt một dòng; không cuộn ngang trang |
| 13 | GVBM | 375 px · tab Hành trình | xem | chương đang học mở sẵn, chương cũ một dòng có mối nối; trục Xem gọn, nhãn `Case` + `SOS 2` đọc được; chú giải thu gọn, "Ký hiệu" mở chữ |
| 14 | QL chi nhánh CP | URL hồ sơ em MB | mở | 403 cả `/students/{id}` lẫn `/hanh-trinh` |
| 14b | GVBM S | Hồ sơ em như 1 › bảng kỹ năng dòng Speaking `MT1 · kỳ vọng 5.5` · bảng Mock Test ô S · ô Kết quả "dưới kỳ vọng: W2 · S" · Hành trình mốc điểm S | bấm `MT1` / ô `S` / mã `S` | mở `/mock-test/{id}?kn=speaking`, trang cuộn tới dải điểm, ô Speaking mở sẵn; Tab tới được mọi liên kết; ghim đợt trên trục mở hồ sơ Mock không cuộn |
| 15 | mọi vai | mọi màn trên | 1440 + 375, sáng + tối | chữ 12 px cho kết quả/hạn/người; mã tuần; SOS 2 cam; mũi tên gập là SVG |

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, model thật, trần tốc độ, lệch kế hoạch, cổng gộp) |
|---|---|---|
| 01/10 | 0 | Model thật **Opus 5.5** (claude-opus-5-5). Worktree từ `origin/main` @ `4379cc63`. UXF-a **chưa merge** → Task 1 tự viết `chuTuanHoc`/`tuanHocFt`/`khoangTamDung` theo giao kèo. **Mốc B: 2000 phép kiểm + 28 tốc độ, xanh.** Trần hiện: `/students/1` 96/93/98/98 · `skill-board` 45/42/45/45 · `/cases/1` 37/34/37/37 · `hanh-trinh` 22/20/23/23, `?giai-doan=thuong` 24/22/25/25 · `lich-su-lop` 21/19/23/23 (QL/QT/GVCN/GVBM). Hai lượt check đầu sập giữa khối PR-GV (3) — máy còn ~600 MB RAM do 4 session chạy check cùng lúc (Node hết bộ nhớ, không phải phép kiểm đỏ); chờ RAM trống rồi chạy lại thẳng các bước (không qua `npm.ps1`) thì xanh |
| 01/10 | 1–2 | Commit gộp `(1)+(2)` (hai Task chung `profile.ts`, `StudentDetailPage.tsx`, phép kiểm). `tuanHocFt`/`chuTuanHoc`/`khoangTamDung` viết đúng giao kèo UXF-a (UXF-a chưa merge). Bỏ `headlineOf`; 6 chỗ phép kiểm cũ đọc `headline` chuyển sang `dauHoSo.viec` / `dauHoSo.duoi` (cùng nghĩa; run.ts [4.1] đọc `dauHoSo.duoi`). Việc K2-6e: `skillSupportBoard` phải gọi **luôn** (kể cả chưa có lộ trình) vì nó là chỗ chặn GV chỉ dạy lớp cũ — giữ. Phép kiểm VAI-b chọn em demo "sạch" (ghi danh mới nhất, có tuần bắt đầu, chưa từng dừng) vì các khối trước đổi dữ liệu demo |
| 01/10 | 3 | Câu tóm tắt dựng ở máy chủ (`cauTomTat`), mệnh đề 0 luôn đứng đầu theo bảng luật (mockup D3 vẽ "Sắp chuyển" ở giữa — theo bảng luật). Phép kiểm cũ S3F (5), (10), S5F-b (6) quét chữ trong `HeaderStats` đã bỏ → chuyển sang hàm thuần (`cauTomTat`, `oHocThuat`), cùng nghĩa. FT "n phần" lấy `required` sẵn có (4 kỹ năng đánh giá), mockup vẽ "5 phần" — giữ số hiện có của hệ thống |
| 01/10 | 4–8 | Tạm dừng: nhãn vàng ở bảng kỹ năng / Ngăn Case qua context `TamDungCtx` (không truyền tay từng tầng). Menu ⋮: tập mục theo quyền giữ nguyên, thứ tự đổi theo nhóm (Kết luận lộ trình về nhóm Lộ trình — UX3 (6) sửa kỳ vọng); PR-XOA (3) kỳ vọng `keTruoc: 'do'`. Task 6: `nextStepOf` thành hàm thuần `viecTiepHang` (shared) — UX3 (5), SOS (8), S5F-b (7) đổi chỗ quét. Chữ hạn giữ luật `deadlineView` ("hạn 02/10" cho loại xác nhận; mockup vẽ "hạn hết 02/10"). Mốc PA `1 tháng · đến 18/10` (`mocChuPa`, `sosV4.ts`) còn dd/mm — thuộc UXF-b B5 |
| 01/10 | tốc độ | `/students/1` sau Task 1–3 lên 104/101/106/106 (> trần cứng 100). Cắt gốc: `programmeOfClass` nhớ theo request (`nho`), tên người làm việc tiếp lấy qua JOIN câu Case/PA (bỏ câu `users`), dòng thông tin dùng lại `examPlanOf` đã tính → **97/94/99/99**; giữ trần 100. `skill-board` 45/42/45/45 (không đổi). Mới: `/yeu-cau?studentId=1` 21/20/7 → trần 31/30/17. `journeyRows` sẽ bỏ ở Task 9 (−1 câu) |
| 01/10 | máy | Lượt check hay sập (mã 127, không lỗi) ở khối PR-GV (3) khi RAM < ~2 GB — nhiều session check cùng lúc (mỗi lượt tới 2,5 GB). Chạy thẳng các bước, không qua `npm.ps1` (npm.ps1 ném NullReference); chạy lại khi RAM trống |
| 01/10 | impeccable | `clarify` (thanh việc, ô, dải, menu, thẻ điện thoại: nút "Xác nhận" trơn → động từ đủ; "người ghi:" ở dải Tạm dừng); `layout`/`adapt` bấm thử nhanh 1440 + 375 (GVBM W2 hồ sơ HV 46, QL menu ⋮ + dải chờ duyệt): không cuộn ngang ở 375 px; sửa dòng ô Học thuật bị cắt ở 2×2. `detect`: 0 phát hiện. Sáng/tối + ảnh đầy đủ để Task 12 (phiên 2) |
| 01/10 | **phiên 1 xong Task 0–8** | `npm run check` (các bước chạy thẳng): **2024 phép kiểm + 28 tốc độ, xanh** (mốc B 2000 + 28; +24 phép kiểm VAI-b khối 1–8, phép kiểm cũ sửa kỳ vọng không xoá). Task 4–8 một commit (cùng tệp `cases.ts`, `SkillBoard.tsx`, `StudentDetailPage.tsx`, `DauHoSo.tsx`, `prVaiB.tests.ts`). Chưa mở PR. Phiên 2: Task 0 rút gọn (mốc B2) → Task 9–12 |
