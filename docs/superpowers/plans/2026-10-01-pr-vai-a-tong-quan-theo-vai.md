# PR-VAI-a · Tổng quan theo vai · Công việc · chuông — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Trang đầu trả lời một câu: **hôm nay tôi phải làm gì**. Làm đúng mockup 23 đã duyệt:
(1) **Giáo viên** (màn A, C): khối "Việc của tôi · hôm nay" gồm việc quá hạn và việc hạn đến hết tuần này, 4 nhóm, mỗi dòng một nhãn
trạng thái + hạn + một nút; "Yêu cầu của tôi" bên cạnh; bảng "Lớp tôi dạy" ở tầng 3 thay khối "Học viên cần hỗ trợ"; điện thoại chỉ 3 việc + "Xem hết".
(2) **Quản lý** (màn B): tầng 1 = dải Chờ duyệt theo bộ lọc chi nhánh + bảng **Cần xử lý** có cột **Người giữ việc** và **Hạn**, nút tới chỗ Nhắc;
việc của chính Quản lý (Vận hành cần quyết định, lớp chưa đủ lệnh chuyển, lớp thiếu GV môn, HV FT xong MT3 chưa có MT kế tiếp, kỳ vọng đầu ra) nằm
chung bảng. Tầng 3 = 4 ô số, Điểm đáng chú ý, Lịch, bảng chi nhánh — theo công tắc `Fast Track · Lớp thường` (mặc định FT, **không "Cả hai"**).
(3) **Công việc**: tên nhóm theo T75, Phối hợp SOS thành việc thật, hai dòng việc mới (khai bậc Ý thức HS cũ, kỳ vọng đầu ra), badge việc quá hạn cho GV.
(4) **Chuông** (màn D): hai nhóm **Cần làm / Để biết**, có giờ, dòng "bấm tới đâu", "Đọc hết", điện thoại neo hai mép.
(5) Lịch Test: dòng Nợ ghi **tên GV đang nợ** (UX-B5).

**Architecture:** Không bảng mới, **không migrate**, `schema.sql` không đổi. Mỗi con số vẫn **một hàm trả tập ID** (`thiet-ke/HOP_DONG_SO_LIEU.md` §1):
- dòng Cần xử lý mới = chỉ số mới trong sổ (`shared/domain/metrics.ts`), hàm tập ID ở `server/src/worklist/metrics.ts`, **gọi lại hàm đang chạy
  màn khác** (`missingForClasses`, `demChuaCoLenh`, `khopHang`, luật `tomTatMt`) — không viết luật thứ hai;
- dải Chờ duyệt và hộp duyệt cùng một hàm đếm `demHop` (PR-DUYET Q8: không đưa vào sổ chỉ số);
- "Lớp tôi dạy" chia tập của `metricSet` theo lớp bằng `lopCuaTap` (cùng hàm bộ lọc khung, cùng hàm UXF-a dùng cho bảng chi nhánh);
- khối việc GV, chip "Đến hết tuần" ở Công việc và "Xem hết (n)" điện thoại cùng một luật thuần `trongKhoiHomNay`;
- chuông: nhóm tính bằng luật thuần `nhomThongBao` ở `shared/domain/duongHoSo.ts`, cạnh `duongThongBao`.

Luật thuần mới nằm ở `shared/domain`. Phép kiểm ở `server/src/tests/prVaiA.tests.ts`.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); harness `check()` của `run.ts`, chạy `npm run check`.
**Spec:**
- **Nguồn chính:** kiểm kê `docs/superpowers/specs/2026-10-01-kiem-ke-truoc-dot-6.md`, mục (c) làn A "PR-VAI-a", mọi dòng B1–B4 ghi "VAI"/"VAI-a"
  thuộc Tổng quan · Công việc · chuông, mục (e) dòng A.
- Đặc tả `2026-09-27-nang-cap-sau-deploy-design.md`:
  - §3.1f Q30-6 (mã tuần); §3.1g Q31-1 (không "Cả hai"), Q31-3 (điện thoại màn GV hằng ngày), Q31-4 (12 px); §3.1h;
  - §3.2 T41 (dải `n chờ duyệt · k quá hạn`), T53 Q2 (đơn vị bài) + Q4 (tên GV dòng Nợ) + Q8 (điện thoại ≤ 3 việc), T60, T75 (4 nhóm, tên việc), T76 (thông báo);
  - §5.5 (ba loại đồ vật: Việc · Yêu cầu · Thông báo); §7.3 ngữ pháp trạng thái + mã tuần; §7.4 token; §7.5 ba tầng.
- Báo cáo rà `thiet-ke/ra-27-09/K1.md`: K1-04, K1-05, K1-06, K1-08, K1-09, K1-10, K1-15, K1-42, K1-44 và bảng §4(f) thông báo; `K5.md` K5-10, K5-11.
- **Mockup 23 `thiet-ke/mockup/23-tong-quan-theo-vai.html`** (màn A, B, C, D + mục "Mockup chọn khác mã hoặc đặc tả"). Đây là thiết kế đã duyệt.
- Kế hoạch UXF-a `plans/2026-10-01-pr-uxf-a-so-lieu-khop.md` mục "Chuyển cho PR khác": K5-52, VN05, UX-B5, `mywork.ts:927`, `urgencyOf`.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-VAI-a** · đợt 6 **lượt 1** · làn **A** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-vai-a-tong-quan-theo-vai` · `.claude/worktrees/pr-vai-a-tong-quan-theo-vai`, từ `origin/main` @ `86ddaf04` trở đi |
| Cổng thử | API **4157** · Vite **5357**. Song song: UXF-a 4187/5387 · VAI-b 4167/5367 · Pb2 4177/5377. Không dùng 4000/5173 |
| Model | **Opus 5.5 · High** · phương án B: **Fable 5.1 · High**. Đầu phiên, session **tự kiểm model thật**; không phải Opus 5.5 thì **DỪNG**, báo chủ sản phẩm (trừ khi chủ sản phẩm đã chọn B) |
| Người rà | **Opus 5.5**, rà **một lượt cuối đợt 6**. Session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. `Co-Authored-By` ghi đúng model thật |
| Migrate? | **Không.** DB reset trước deploy nên không có lệnh dữ liệu cũ. `schema.sql` không đổi. Đổi tên `kind` thông báo (Q19) chỉ áp cho dòng mới |
| Lệnh impeccable | **`/ponytail lite` đầu phiên**. **`layout`** ở Task 3, 5, 6, 8 · **`clarify`** ở Task 3, 6, 10 (nhãn trạng thái, tên nhóm, tiêu đề thông báo) · **`adapt`** ở Task 9, 10 (375 px) · **`audit`** + **`polish`** (**sáng và tối**) ở Task 12. Không `init`/`document`/`hooks on`/cài đặt. Trước PR: `/ponytail-review` |
| Phụ thuộc | Không chờ PR nào để **bắt đầu**. **Thứ tự merge: Pb2 merge TRƯỚC VAI-a (bắt buộc)**; nên để UXF-a (có P0) merge trước VAI-a. VAI-b độc lập |
| Không làm | bỏ hằng `'ca-hai'` / `CHUONG_TRINH` / `chuongTrinhTuThamSo` / `ChonChuongTrinh` (T60) và Danh sách Case (T59) → **PR-Pb2** · đơn vị "bài", `baiId`, luật quá hạn nhập điểm, `tuanThi` dòng Nợ → **PR-UXF-a** · đầu hồ sơ HV, dải Tạm dừng, dải chờ duyệt trong hồ sơ, Hành trình → **PR-VAI-b** · thanh dưới biểu tượng (UX-D9), bảng quản trị thành thẻ → **PR-UXD** |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - chạy `npm run check` **một lần, ở foreground**, log `$env:TEMP\check-vai-a.log` (tên riêng — `$TEMP` dùng chung giữa các session);
  - xanh, số phép kiểm ≥ mốc B → commit `PR-VAI-a (n): …`.
- Sập segfault → chạy lại **một** lần. Treo > 10 phút → quét `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`, tắt hết, chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai, 1440 và 375, **sáng và tối**, **một lần** ở Task 12:
  - Playwright kênh Chrome; demo `POST /api/demo/session {userId}`;
  - vai tra `tests/tocDo.run.ts:114`;
  - ảnh vào `thiet-ke/anh/pr-vai-a/`;
  - API `PORT=4157`, Vite tạm 5357 proxy về 4157 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4157/5357, quét `tests/run.js` treo, dọn file tạm.
- **Cổng gộp** khi Pb2 / UXF-a / VAI-b merge, và bắt buộc ở Task 12: `git fetch origin && git merge origin/main` → gỡ theo bảng file chồng → `npm run check` → ghi Nhật ký.

### File chồng với 3 PR song song lượt 1

| File | PR khác | PR-VAI-a sửa | Gỡ |
|---|---|---|---|
| `shared/domain/tongQuan.ts` | **Pb2** bỏ `'ca-hai'` (:12-23) · **UXF-a** chữ đơn vị "bài" dòng :94, dòng `dung-han` :139-142 | `NHOM_VIEC_LABEL` :28-30 (T75), `NHOM_CUA_LOAI` :32-39 (khoá mới), `LOAI_HAN_CUA_VIEC` :43-47, `CAN_XU_LY` + `sapCanXuLy` :73-106 viết lại, `chonDiemDangChuY` :123-145 (câu lớp thường) | **Pb2 merge trước.** VAI-a **không đụng** :11-23. Gộp: giữ khối hằng của Pb2, áp lại khối Cần xử lý của VAI-a; chữ "bài" của UXF-a áp lại vào dòng `bai-qua-han-nhap-diem` mới |
| `web/src/modules/worklist/OverviewPage.tsx` | **Pb2** (:64-70 `setCt`, :97 `ChonChuongTrinh`) | viết lại gần hết (bố cục theo vai) | VAI-a bỏ hẳn `ChonChuongTrinh` + `setCt` ở trang này, dùng `CongTacKhung` (không "Tất cả"). Gộp: lấy bản VAI-a |
| `web/src/modules/worklist/KhoiCanXuLy.tsx` | **Pb2** (:44 link `?goc=danh-sach`) | viết lại thành bảng 4 cột; bỏ `denLoc` | lấy bản VAI-a (dòng :44 biến mất cùng `denLoc`) |
| `server/src/worklist/tongQuan.ts` | UXF-a **không sửa** (UXF-a Q18) · Pb2 có thể đổi kiểu `ct` | `tongQuanQuanLy` :21-57 (bỏ `ct`), xoá `hocVienCanHoTro` :59-135, hàm mới | lấy bản VAI-a; kiểu `ct` theo Pb2 |
| `shared/domain/metrics.ts` | **UXF-a** donVi `'bai'` (:28, :76-80) · **Pb2** (nếu bỏ `ca-hai`) | thêm donVi `'lop'`, `'viec-van-hanh'` (:28, :251-255), 4 chỉ số mới, **xoá** `hv-can-ho-tro-2-lan-chua-case` (:238-245) | union; khác mục |
| `server/src/worklist/metrics.ts` | **UXF-a** `overdueScoreAttempts` :388-421, `obligations` :205-248, `rowsFor('bai')` · **Pb2** lọc khung | `rowsFor` 'case'/'phuong-an' thêm người + hạn, href hồ sơ HV (:81-101); `overdueUpdatePlans` trả hạn cũ nhất (:295-313); `LISTED_METRICS` :190-195; 4 `case` mới + xoá case U3 :504-506 | khác hàm → giữ cả hai. `MetricRow` gộp trường |
| `server/src/worklist/mywork.ts` | **UXF-a** tham số `chiDangHoc` ở `listAttempts` (:280, :403) | khoá `result` → `ghi_ket_qua_pa` (:497, :1133), xoá khối `next_step` (:561-605), việc `phoi_hop_sos`, `khai_bac`, `ky_vong_dau_ra`, `:927` sắp `soSanhLop` | khác dòng → giữ cả hai |
| `shared/domain/congViec.ts` · `web/src/modules/congViec/HoTroHocVienTab.tsx` | **UXF-a** F5 biến `soNhac` (:89-95, :151) | thêm `LOC_NHANH` `'den-het-tuan'` + `trongKhoiHomNay`; **xoá** nhắc mềm (`nhac`, `soNhacYThuc`) vì Phối hợp SOS thành việc thật | UXF-a merge trước thì VAI-a xoá luôn `soNhac` (không còn nhắc mềm — mọi số đếm từ `items`). Ghi Nhật ký |
| `server/src/cham/canCham.ts` (`noTuanTruoc` :213-300) · `web/src/modules/test/lichTest/KhoiNo.tsx` · `lichTest/kieu.ts` `DongNo` :11-20 | **UXF-a** `tuanThi`, sắp `soSanhLop`, luật quá hạn | thêm trường `gvNo` + một cột "GV chấm" | khác trường → `DongNo` giữ cả `tuanThi` (UXF-a) lẫn `gvNo` (VAI-a) |
| `server/src/duyet/yeuCau.ts` (`hopChoDuyet` :318-342, `demYeuCau` :355-374) | **VAI-b** V1 đọc `hopChoDuyet(p, { studentId })` (không sửa hàm) | thêm tham số `branchId` cho `demYeuCau`, lọc `quaHan` cho `hopChoDuyet` — **chỉ thêm trường tuỳ chọn**, không đổi chữ ký cũ | không xung đột logic |
| `shared/domain/duongHoSo.ts` (`duongThongBao` :93-126) | VAI-b có thể thêm đường dẫn sâu hồ sơ | thêm `nhomThongBao`, `noiDenThongBao`; nhánh `kind` mới | khác hàm → giữ cả hai |
| `server/src/phanTich/boQuen.ts` + route `/phan-tich/bo-quen` (`routes/index.ts:645-653`) + `tests/phanTich.tests.ts:851-1000` | **Pb2** bỏ Danh sách Case (nơi dùng còn lại) | xoá **nếu** lúc cổng gộp Pb2 đã bỏ Danh sách Case; chưa thì để nguyên (Q7) | Pb2 merge trước → VAI-a xoá phần còn sót |
| `tests/run.ts`, `tests/tocDoDuong.ts`, `shared/domain/index.ts`, `routes/index.ts`, `CODE_MAP.md` | cả ba PR | khối phép kiểm **cuối** `run.ts`; ceiling mới; chỉ thêm dòng (và xoá dòng `/tong-quan/hoc-vien-can-ho-tro`) | giữ cả hai, thứ tự theo merge |

`StudentDetailPage.tsx`, `profile.ts`, `HanhTrinh.tsx`, `SkillBoard.tsx`, `PhanTich.tsx`, `BangGiaoVienChiNhanh.tsx`, `bangChiNhanh.ts`: VAI-a **không sửa**.

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 | **Khối việc GV** = việc **quá hạn** + việc có hạn **từ hôm nay đến hết Chủ nhật tuần này**; trong nhóm quá hạn lên đầu, rồi hạn gần. Việc không có hạn không vào khối, được đếm trong dòng cuối "n việc khác chưa đến hạn tuần này · Tất cả việc (N) trong Công việc". Một luật thuần `trongKhoiHomNay(it, homNay)` ở `congViec.ts`, dùng cho khối, cho chip mới **"Đến hết tuần"** (`loc=den-het-tuan`) ở Công việc và cho "Xem hết (n)" | mockup 23 màn A, C ("đúng 7 việc như màn A"); planning 01/10 |
| Q2 | **Điện thoại GV:** "Hôm nay" = 3 dòng đầu của **cùng danh sách** Q1, không chia nhóm (quá hạn lâu nhất → hạn hôm nay → hạn gần); dòng chỉ còn nhãn trạng thái + một mốc hạn + tên việc (dòng phụ ẩn); cả dòng là nút ≥ 44 px; "Xem hết (n)" → `/cong-viec?loc=den-het-tuan` | T53 Q8; mockup màn C |
| Q3 | Việc Quản lý **tự quyết** (Case chờ nguyên nhân quá hạn, vi phạm quá 5 ngày) **chỉ** ở hộp Chờ duyệt (thẻ Báo lên), **không** lặp ở Cần xử lý. Mã hiện đã đúng (`tongQuan.ts:88-89, 95`) — thêm phép kiểm giữ luật | planning 01/10; mockup màn B |
| Q4 | **Cần xử lý** có cột **Người giữ việc**: việc GV trễ ghi "n giáo viên" + tên (sắp theo tên, quá 3 thì "+k"); việc của chính người xem ghi **"Bạn"** (mockup vẽ "Chị" — web không biết xưng hô). Nút **"Xem và nhắc"** mở Công việc › Hỗ trợ học viên đã lọc sẵn nhóm + Quá hạn + chi nhánh (có tên từng người, nút Nhắc). **Bấm số** vẫn mở panel danh sách (hợp đồng số liệu) | K1-06; planning 01/10 |
| Q5 | **Cần xử lý và dải Chờ duyệt luôn gộp hai khung** (không nhận `ct`). **Bốn ô số, Điểm đáng chú ý, Lịch sắp tới, bảng chi nhánh** xuống tầng 3, theo công tắc `Fast Track · Lớp thường` đặt **đầu phần Số liệu**; mặc định **FT**; không "Cả hai". Dùng lại `ui/CongTacKhung.tsx` (thêm trang `'tong-quan'`, nhớ theo máy), không dùng `ChonChuongTrinh` | Q31-1; mockup màn B mục "planning quyết" |
| Q6 | "Case chưa có người phụ trách" đổi thành **gốc của nó**: dòng **"n lớp thiếu GV môn · k Case chưa có người nhận · m bài chưa có người chấm"**, dòng phụ "MB BE 06 thiếu W · HD FT 108 thiếu S", nút **"Sửa phân công"** (một lớp → `/hoc-vien/lop/{id}?viec=phan-cong`; nhiều lớp → panel danh sách lớp, mỗi dòng mở đúng lớp). Chỉ số mới `lop-thieu-gv-mon` (đơn vị `lop`) gọi `missingForClasses` (`schedule.ts:719`) — cùng hàm badge "Thiếu GV" ở Học viên & Lớp. `k` = chỉ số `case-chua-co-nguoi-phu-trach` (giữ, chỉ bỏ dòng). `m` = bài chưa phân công GV (hàng "Chưa phân công" của UXF-a Q8); UXF-a chưa merge thì bỏ vế `m`, ghi Nhật ký | K1-05; planning 01/10 |
| Q7 | Bỏ dòng **"2 lần Test liền, chưa có Case"** (K1-04/U3): xoá chỉ số `hv-can-ho-tro-2-lan-chua-case`, dòng Cần xử lý, cơ chế `denLoc`. `boQuen.ts` + route + phép kiểm UX4 xoá ở cổng gộp khi Pb2 đã bỏ Danh sách Case (nơi dùng còn lại); chưa thì để Pb2. Bỏ dòng **"Case thiếu PA học thuật"** khỏi Cần xử lý (chỉ số giữ cho cột "Thiếu PA học thuật" của bảng chi nhánh) | mockup mục "planning quyết"; K1-04 |
| Q8 | **Bốn dòng "việc của Bạn"** mới ở Cần xử lý, mỗi dòng một chỉ số, **gọi đúng hàm màn khác đang dùng**: (a) `van-hanh-can-quyet-dinh` = `listMgmtTasks` + `khopHang('can-quyet-dinh')` (`congViec.ts:104-121`) → nút "Mở Vận hành" `/cong-viec/van-hanh?hang=can-quyet-dinh`; (b) `hv-chua-co-lenh-chuyen` = `demChuaCoLenh` (`lenhChuyen.ts:472`) như việc "Chuyển lớp cả lớp" (`mywork.ts:536-564`), chữ "Chuyển lớp cả lớp · {lớp} · n em chưa có lệnh" (nhiều lớp: "k lớp · n em chưa có lệnh chuyển lớp") → nút "Mở chuyển lớp" `?viec=chuyen-tiep`; (c) `hv-ft-xong-mt-cuoi-chua-mt-ke` = luật `tomTatMt` (`schedule.ts:552-566`) + `coMocTiepTheo` (có ngày/tháng thi thì không tính) → nút "Kế hoạch Test" `/test/ke-hoach?classId=` (một lớp) ; (d) `hv-len-ft-chua-ky-vong` (K5-11) → nút "Mở hồ sơ" | K1-09, V8, K5-11; mockup màn B |
| Q9 | Chữ dòng (c) giữ mockup "**học viên FT xong MT3, chưa có MT kế tiếp**"; tooltip "Lộ trình RF: xong MT2" | mockup; RF chỉ có MT1, MT2 (T33) |
| Q10 | **Tầng** Quản lý: tầng 1 = dải Chờ duyệt + Cần xử lý; tầng 3 = Số liệu. Tab đổi tên **"Việc hôm nay · Phân tích"**; bỏ tiêu đề trang "Tổng quan" lặp (K1-10). "Cách tính" thành **chú thích nổi** (rê chuột, Tab, bấm), không đẩy giãn hàng ô (K1-08) — sửa một chỗ ở `ui/SoLieu.tsx:112-137`, áp mọi ô | K1-08, K1-10; §7.5 |
| Q11 | **Điểm đáng chú ý**: nhãn chữ **"Cần chú ý" / "Tốt"** thay chấm màu; bỏ "· tối đa 3". Lớp thường thêm câu theo chương trình "**FOU: 5/22 học viên chưa đạt ở bài gần nhất**" — `hv-duoi-ky-vong-mon` khung thường, thêm tham số `ctLop` (FOU/BE/ELE/Pre FOU) lọc trong `metricSet`, cùng hàm cho câu và danh sách bấm ra. Mockup ghi "chưa đạt Giữa khoá": chỉ ghi tên bài khi mọi em trong câu cùng một loại bài | mockup màn B; T58 |
| Q12 | **GV bỏ khối "Học viên cần hỗ trợ"** và khối Lịch sắp tới; thay bằng bảng **"Lớp tôi dạy"** ở tầng 3. FT: Lớp · Tôi dạy · Học viên · Dưới kỳ vọng · SOS · Case mở · Bài chờ chấm · Test kế tiếp. Lớp thường: Lớp · Tôi dạy · Tuần học · Học viên · Chưa đạt · Case mở · Bài chờ chấm · Test kế tiếp (**không SOS**). FT **không** có cột tuần khoá. Dạy một khung → ẩn công tắc; dạy cả hai → mặc định FT. Số: `metricSet` (`hv-duoi-ky-vong-mon`, `hv-sos-hien-tai`, `case-mo`) chia theo lớp bằng `lopCuaTap` (`chuongTrinh.ts:70`); **Bài chờ chấm** = tổng bài của việc Chấm điểm cùng lớp trong `/my-work` (cùng nguồn khối việc); **Test kế tiếp** = luật `MOC_KE_TIEP_SQL` (FT, sớm nhất trong lớp) / mốc Giữa-Cuối khoá của lớp (`classProgressMany`). Mỗi số bấm ra danh sách qua route riêng tính lại bằng cùng hàm | mockup màn A, C; Q31-1 (GV mặc định khung lớp mình dạy) |
| Q13 | **T75 tên nhóm:** "Ý thức" (bỏ "& Phối hợp"), "Lớp & vận hành" (thay "Vận hành"). Khoá việc `result` → **`ghi_ket_qua_pa`** (V3) | T75; mockup mục "planning quyết" |
| Q14 | **K5-10:** Phối hợp SOS thành **việc thật** `phoi_hop_sos` — một dòng mỗi lớp GVCN "Phối hợp SOS · MB FT 101 · 3 lượt", không hạn, nhóm Case học thuật (cạnh Báo PH qua TVV), đếm bằng chính `myCoordinationLines` (`phoiHop.ts:287`). **Bỏ** dòng "nhắc mềm" (`useNhacYThuc`, `nhac` trong `NhomViec`, `soNhacYThuc`) — mọi chip đếm từ `items` | K5-10; §5.5 "Việc có người làm" |
| Q15 ⚠ | **K1-15 khai bậc Ý thức HS cũ:** việc cho GVCN, **một dòng mỗi lớp** "Khai bậc Ý thức HS cũ · {lớp} · n em", em tính khi `coTheKhai` (`xuLy.ts:318`) **và** hồ sơ em tạo trong **14 ngày** gần nhất; không hạn; hết khi khai hoặc qua 14 ngày. Không cho mọi em (sẽ ngập việc) | T27; K1-15 (sau reset DB HS thật nhập lại) |
| Q16 | **V2 badge GV:** số đỏ cạnh "Công việc" (thanh trên + thanh dưới) = số việc **quá hạn** của GV (`summary.overdue` của `myWork`) qua `GET /my-work/dem`. Tải khi mở web và khi `/my-work` bị làm mới — **không** tải lại mỗi lần đổi trang (một lần `myWork` ~ 76 câu). Quản lý giữ badge Chờ duyệt đã có (`App.tsx:37-47`) | K1-44; mockup màn C |
| Q17 | **Dải Chờ duyệt** theo **chi nhánh đang chọn** (VN05), **không** theo khung. "k quá hạn" bấm mở hộp lọc quá hạn (`?qua-han=1`); "gồm n Báo lên" mở `?phan=bao-len`; dòng phụ "Học thuật 3 · Ý thức 1 · Báo lên 3 (2 Case chờ nguyên nhân quá hạn, 1 vi phạm quá 5 ngày)". Số dải = số thẻ ở hộp cùng bộ lọc (cùng `demHop`). Không thêm vào sổ chỉ số (PR-DUYET Q8) | K5-52, VN05, U2 |
| Q18 | **Chuông:** nhóm theo **loại** — Cần làm = trỏ tới việc/thẻ đang chờ chính người đọc; Để biết = tin một chiều. Dòng Cần làm **rời nhóm khi việc xong**: biết được với Case (còn chờ nguyên nhân) và thẻ yêu cầu (còn `cho`) — tính trong **cùng câu SQL** `thongBaoCua`; loại khác ở lại Cần làm tới khi bị đẩy khỏi danh sách. "Đọc hết" chỉ tắt chấm, không xoá. Danh sách = mọi dòng chưa đọc + mới nhất, tối đa **50** (nay 30). Tải lại mỗi lần mở chuông | T76; mockup màn D "đã đọc mà việc chưa xong vẫn Cần làm" |
| Q19 | Bốn chỗ `notify` dùng chung một `kind` cho hai nhóm được **tách tên loại** (không đổi schema): `cuoiKhoa.ts` "Mang theo PA Bổ trợ miễn phí" `sos` → `bo_tro_mien_phi` (Để biết) · `xuLy.ts:163` "Đã xử lý … để biết" `discipline` → `discipline_de_biet` · `absence.ts:754` "Đã tự dời" `schedule_move` → `tu_doi_lich` · `yeuCau.ts:183` từ chối `duyet_ket_qua` → `duyet_tu_choi` (Cần làm "Sửa và gửi lại"); `duongThongBao` nhận cả tên mới | T76 |
| Q20 | Đổi **tiêu đề** theo mockup D ở **hai** chỗ K1-42 nêu: `absence.ts:620` "Lịch thi cần xử lý" → "Duyệt dời {môn} lần 2 — {HV} · {lớp}"; `sosAuto.ts:148` "Case mới: …" → "Xác nhận nguyên nhân {môn} — {HV} · {lớp}", thân "Case mới sau {đợt}: {môn} {điểm}, kỳ vọng {x} · hạn dd/mm". Tiêu đề khác đã theo mẫu "việc + em + lớp" — `audit` thấy chỗ sót thì ghi "Chuyển cho PR-S3" | K1-42; §4(f) K1 |
| Q21 | **Chuông điện thoại** (< 640 px): bảng neo **hai mép** ngay dưới thanh trên (`fixed inset-x-2 top-14`), cao tối đa 70 vh, cuộn trong; máy tính giữ bảng thả dưới nút. Mỗi dòng: tiêu đề · giờ (hôm nay chỉ giờ, ngày khác thêm ngày) · thân · một dòng xanh "Hồ sơ Vũ Ngọc Lan › Case Reading" (`noiDenThongBao`) | UX-D6; mockup màn D |
| Q22 | Lời chào GV giữ đúng mockup đã duyệt **"Tuần W1 OCT · hôm nay 01/10"** (mockup 01/10 sau luật mã tuần 30/09; ngày hôm nay là ngày cụ thể, tuần vẫn là mã) | mockup màn A |
| Q23 | **UX-B5:** dòng Nợ ghi tên GV đang nợ, lấy từ `pendingOwners` (`attempts.ts:607-612, 717, 801`) — không câu SQL mới; nhiều người "A, B"; môn chưa phân công "chưa phân công". Cột "GV chấm" 12 px, bản hẹp thêm vào dòng phụ | T53 Q4 |
| Q24 | **Cột Hạn** của Cần xử lý: bài → "quá hạn a–b ngày" (ngắn nhất–dài nhất); PA → "hạn hết T2 dd/mm · quá hạn n ngày" (hạn cũ nhất); Vận hành → hạn gần nhất qua `<Han>`; chuyển lớp → "trước {mã tuần}"; thiếu GV, MT kế tiếp, kỳ vọng đầu ra → "chưa có hạn". Hạn tính từ **cùng tập ID** của dòng | mockup màn B; §7.3 |
| Q25 | Ô **"PA quá hạn ghi kết quả"** dòng phụ "tuần W4 SEP" = tuần của hạn cũ nhất (`nhanTuanGhiKetQua`, `display.ts:326`). `overdueUpdatePlans` trả thêm hạn cũ nhất **trong cùng câu** → `MetricResult.hanCu` → lean response. Dòng Cần xử lý và ô số đọc cùng trường | mockup màn B; một nguồn |
| Q26 | **Panel danh sách** khi bấm số (K1-06): dòng Case/PA thêm "người phụ trách · quá hạn n ngày" (12 px); bấm dòng mở **hồ sơ HV ở Ngăn Case** (`duongHoSoHocVien(sid, { caseId })`), không mở trang Case riêng (Pb2 chuyển hướng trang đó) | K1-06 |
| Q27 | **Bỏ việc "Ghi lộ trình tiếp theo" của GVCN** (`next_step`, `mywork.ts:561-605`) và mọi chỗ đọc nhóm này. Quản lý quyết mọi lần chuyển lớp; việc `placement` "Chuyển lớp cả lớp · … · n em chưa có lệnh" của Quản lý (và dòng Cần xử lý Q8b) đã phủ. Không đụng badge "chưa có lộ trình tiếp theo" ở hồ sơ lớp (`classes.ts:91-106`, `loTrinhTiep.ts:220`) — ngoài phạm vi, chuyển planning | Q30-1; planning 01/10 (lượt 2) |

## Global Constraints

- **Số khớp — luật của PR:** mỗi con số mới có **phép kiểm so hai đường**: số ở dòng/ô = số dòng khi bấm = tổng các hàng. Không thêm đường đếm thứ hai.
  Khung `run.ts:9214-9225` (mọi chỉ số `n = ids.length = rows.length`) phải còn xanh và tự phủ 4 chỉ số mới.
- **Quyền:** mọi đường mới có **phép kiểm PHỦ ĐỊNH**: GV gọi `/tong-quan/quan-ly` → 403; QL chi nhánh khác không thấy dòng / thẻ / lớp của MB;
  GV không thấy lớp mình không dạy trong "Lớp tôi dạy"; "Đọc hết" chỉ đụng thông báo của chính người gọi.
- **SQL (Turso):**
  - chỉ `?` — không tham số đặt tên;
  - `IN (…)` theo lô ≤ 400 (≤ 900 tham số); UNION ≤ 20 vế;
  - **không N+1**: người giữ việc, hạn, tên lớp nạp **một câu mỗi chỉ số**, không mỗi dòng;
  - ghi trong `tx()`; "Đọc hết" là **một** câu `UPDATE`;
  - ngày nghiệp vụ `demoToday()` / `useNgayNghiepVu().homNay`.
- **Tốc độ:** đường đổi số câu → đo lại trong `tests/tocDoDuong.ts`. Route mới (`/tong-quan/diem-chu-y`, `/tong-quan/lop-toi-day`, `/tong-quan/lop-toi-day/o`,
  `/my-work/dem`) → **thêm trần**. Trần mới = `max(sau+10, ⌈sau×1.3⌉)`. **Không nâng trần cũ quá 30 %**; vượt → Nhật ký, báo planning. Xoá dòng `/tong-quan/hoc-vien-can-ho-tro`.
- **Giao diện:**
  - `/ponytail lite`; tinh chỉnh, **không làm lại**: Be Vietnam Pro (chữ số Inter), bảng màu, `KhungPanel`, `Card`, `TheDong`, `NhanTrangThai`, `Han` có sẵn;
  - một dòng = **một** nhãn trạng thái bằng chữ (`Cần làm · Đang làm · Chờ duyệt · Quá hạn · Xong · Đã huỷ`) + hạn bằng chữ + người bằng tên (§7.3);
  - mã tuần `W2 OCT` (`tuanLich`) cho tuần; ngày chỉ cho hạn cụ thể (`<Han>`), giờ thông báo, lời chào (Q22);
  - FT **không** "n/16", không cột tuần khoá; lớp thường "tuần 7/10"; **không** "ca tối / đổi ca / lớp buổi tối";
  - lớp thường **không SOS**; SOS 1 vàng · 2 cam · 3 đỏ;
  - **cỡ chữ Q31-4**: kết quả, hạn, người giữ việc **12 px**; nhãn nhỏ 11–11,5 px (`Nhan`);
  - token màu, không màu cứng; cột thẳng, `tabular-nums`, không dồn chữ; nút ≥ 44 px trên điện thoại;
  - **không** KPI, **không** xếp hạng GV; tên người sắp theo tên;
  - không mã thô trên màn (`ghi_ket_qua_pa`, `can-quyet-dinh`).
- **Phép kiểm:**
  - tạo `server/src/tests/prVaiA.tests.ts` (`runPrVaiATests(t)`, đăng ký **cuối** `run.ts`, theo mẫu `prCt.tests.ts:4`);
  - ngày demo 14/09/2026 (`seed/data.ts:15`);
  - phép kiểm cũ đổi kỳ vọng thì **sửa**, không xoá: `tongQuan.tests.ts:77` (tên nhóm), `:103`, `:291` (Cần xử lý mới, không `ct`), `:324` (Học viên cần hỗ trợ → Lớp tôi dạy),
    `prYt4.tests.ts:344-351` (nhãn Ý thức nay ở việc `yt_*` của khối GV), `lenLop.tests.ts:410-418` + `prCt.tests.ts:818-819` (không còn việc `next_step` — Q27);
  - **tổng số phép kiểm không giảm**.
- **Không bớt** (CLAUDE.md): kiểm dữ liệu nhập, quyền, chống mất dữ liệu. `ponytail:` được phép, liệt kê trong thân PR.

## Hướng dẫn riêng cho phương án B (Fable)

1. Mỗi dòng Cần xử lý mới **phải** là một chỉ số trong sổ và gọi đúng hàm đã có ở cột "Vì sao" của Q8 — không viết lại câu SQL đếm.
2. Không động vào `CHUONG_TRINH`, `chuongTrinhTuThamSo`, `thamSoCt`, `'ca-hai'` — đó là việc của Pb2. Cần "gộp hai khung" thì **không truyền** `program`.
3. Không "sửa cho khớp" bằng cách chỉnh một phía cho bằng con số phía kia. Không làm được hai đường gọi chung một hàm → ghi Nhật ký, dừng.
4. Không đổi luật SOS, luật Cuối khoá, luật hạn, luật quá hạn nhập điểm (UXF-a). Chỉ đọc chúng.

## Task 0 · Chuẩn bị

- [ ] Kiểm model thật (dòng hệ thống / `Co-Authored-By` mặc định). Không phải **Opus 5.5** → dừng, báo chủ sản phẩm.
- [ ] Worktree `.claude/worktrees/pr-vai-a-tong-quan-theo-vai` từ `origin/main`; `/ponytail lite`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm chính + tốc độ) vào Nhật ký.
- [ ] Đọc nguồn:
  - mockup 23 **cả bốn màn** và mọi dòng "Vì sao" + mục "planning quyết";
  - kiểm kê (c) làn A, (e) dòng A; K1.md dòng K1-04…K1-10, K1-15, K1-42, K1-44, §4(f); K5.md K5-10, K5-11;
  - `HOP_DONG_SO_LIEU.md` §1–2;
  - mã: `worklist/OverviewPage.tsx`, `KhoiCanXuLy.tsx`, `ViecCuaToi.tsx`, `NhomViec.tsx`, `WorkList.tsx:37-71`, `MetricTiles.tsx`, `Highlights.tsx`, `BranchPulse.tsx`,
    `server/src/worklist/tongQuan.ts`, `metrics.ts:30-200, 295-313, 347-535`, `mywork.ts:240-300, 480-620, 780-900, 995-1060, 1125-1140`, `nhacViec.ts`,
    `shared/domain/tongQuan.ts`, `congViec.ts:20-121`, `metrics.ts`, `duongHoSo.ts:80-126`, `duyet/yeuCau.ts:300-380`, `platform/thongBao.ts`,
    `web/src/modules/platform/Header.tsx:160-200`, `App.tsx:34-80`, `congViec/HoTroHocVienTab.tsx`, `duyet/HopChoDuyet.tsx:30-60`.
- [ ] Xem Pb2 / UXF-a đã merge chưa (`git log origin/main`); ghi Nhật ký để biết cổng gộp nào sẽ tới.
- [ ] Commit `PR-VAI-a (0): kế hoạch + mốc {B}`.

## Task 1 · Dọn Cần xử lý cũ + gộp hai khung (K1-04/U3, K1-05, Q3, Q5–Q7)

**Files:** `shared/domain/tongQuan.ts` (:73-106) · `shared/domain/metrics.ts` (:28, :238-245, :251-255) · `server/src/worklist/metrics.ts` (:190-195, :504-506, `case` mới) ·
`server/src/worklist/tongQuan.ts` (:21-57) · `server/src/routes/index.ts` (:1530-1537, route mới `/tong-quan/diem-chu-y`) · tạo `server/src/tests/prVaiA.tests.ts` + đăng ký cuối `run.ts`.

Hiện trạng (đã kiểm trên main):
- `CAN_XU_LY` còn 5 dòng: `case-chua-co-nguoi-phu-trach` (:90, nút "Xem" chỉ mở danh sách), `hv-can-ho-tro-2-lan-chua-case` (:91, U3), `case-thieu-pa` (:92), `pa-can-cap-nhat` (:93), `bai-qua-han-nhap-diem` (:94).
- `tongQuanQuanLy` truyền `program: f.ct` cho mọi dòng Cần xử lý (:24) — đổi công tắc là số Cần xử lý đổi theo.
- Điểm đáng chú ý tính chung route với Cần xử lý (:40-53), nên đổi công tắc thì cả khối tải lại (~75 câu).
- Việc `no_owner` đã có nút "Sửa phân công" khi lớp thiếu GV môn (`mywork.ts:1011, 1031-1043`) — chỉ Tổng quan còn dòng cũ.

- [ ] **Phép kiểm trước** (khối 1):
  - `sapCanXuLy` không còn `hv-can-ho-tro-2-lan-chua-case`, `case-thieu-pa`, `case-chua-co-nguoi-phu-trach`; không còn `case-xac-dinh-nguyen-nhan-qua-han`, `pa-cho-duyet`, `hv-can-xu-ly` (Q3 — giữ luật);
  - `metricById('hv-can-ho-tro-2-lan-chua-case') === null`; `/metrics/hv-can-ho-tro-2-lan-chua-case` → 404;
  - `lop-thieu-gv-mon` (QL MB): `ids` = lớp đang mở của MB mà `missingForClasses(...).missingSkills.length > 0` (seed có lớp "Thiếu GV W1, W2", "Thiếu GV Speaking" — `seed/journeys.ts:350, 371`) — **hai đường**: cùng tập với badge "Thiếu GV" ở `/hoc-vien-lop` của QL;
    Pre FOU thiếu GVBM không tính (chỉ nhắc GVCN, `schedule.ts:744`); **phủ định**: QL CP không thấy lớp MB;
  - `tongQuanQuanLy(QL, { branchId })` **không nhận `ct`**: số mỗi dòng = `metricSet(id, { branchId }).n` (không lọc khung);
  - `/tong-quan/diem-chu-y?ct=ft|thuong` trả đúng `chonDiemDangChuY` cũ; GV → 403.
- [ ] Shared:
  - donVi `'lop'` (nhãn "lớp"); chỉ số `lop-thieu-gv-mon` (câu hỏi, tập đủ điều kiện, `hien-trang`);
  - xoá chỉ số U3 khỏi sổ; `CAN_XU_LY` bỏ 3 dòng, thêm `lop-thieu-gv-mon` (nhãn "lớp thiếu GV môn", nút "Sửa phân công"); bỏ trường `denLoc` + kiểu `LoaiBoQuen` khỏi `tongQuan.ts`.
- [ ] Máy chủ:
  - `metricSet` case `lop-thieu-gv-mon`: lớp `status='active'` trong phạm vi (`resolveScope`, quyền `CLASS_ASSIGN` như `mywork.ts:1031`) → `missingForClasses` → id lớp; `rowsFor('lop')`: "MB BE 06 · thiếu W", href `/hoc-vien/lop/{id}?viec=phan-cong`;
  - `lopCuaTap('lop', ids)` = chính lớp đó (cho bộ lọc khung và dòng phụ);
  - xoá case U3 (:504-506) và khỏi `LISTED_METRICS`;
  - `tongQuanQuanLy(p, { branchId })`: bỏ `ct`; Điểm đáng chú ý tách thành `diemChuY(p, { branchId, ct })` + route `GET /tong-quan/diem-chu-y`;
  - dòng thiếu GV có dòng phụ `k Case chưa có người nhận` (= `metricSet('case-chua-co-nguoi-phu-trach').n`) và `m bài chưa có người chấm` (Q6).
- [ ] Sửa kỳ vọng `tongQuan.tests.ts:103, 291` (không xoá). `phanTich.tests.ts:976` (dòng `denLoc`) đổi thành "Cần xử lý không còn dòng bỏ quên".
- [ ] `tocDoDuong`: `/tong-quan/quan-ly` đo lại; thêm `/tong-quan/diem-chu-y?ct=ft` (QL, QT; GV 403).
- [ ] `npm run check` → commit `PR-VAI-a (1): Cần xử lý gộp hai khung; bỏ dòng "2 lần Test", "Case thiếu PA"; Case chưa có người → lớp thiếu GV môn`.

## Task 2 · Bốn dòng "việc của Bạn" ở Cần xử lý (K1-09, V8, K5-11, Q8, Q9)

**Files:** `shared/domain/metrics.ts` (donVi `'viec-van-hanh'`, 4 chỉ số) · `server/src/worklist/metrics.ts` · `server/src/worklist/mgmttasks.ts` (`listMgmtTasks` :89, chỉ đọc) ·
`server/src/classes/lenhChuyen.ts` (`demChuaCoLenh` :472, chỉ đọc) · `server/src/classes/schedule.ts` (`tomTatMt` :552-566 — tách phần điều kiện thành hằng SQL dùng chung) ·
`server/src/normal/cuoiKhoa.ts` (`ghiKetLuanFt` :506, chỉ đọc) · `shared/domain/tongQuan.ts`.

Hiện trạng:
- "HS FT hết MT3 chưa có MT kế tiếp" chỉ có ở Báo cáo đơn vị › tín hiệu "chưa có tuần MT tiếp theo" (`signals.ts:69-86`, đếm mọi em không có lượt planned — khác luật).
- "Vận hành cần quyết định" chỉ là hàng số trong tab Vận hành (`congViec.ts:104-121`, `MgmtTasksPage.tsx:76` nhận `?hang=`).
- Việc "Chuyển lớp cả lớp" đã có trong `myWork` của QL (`mywork.ts:536-564`) nhưng Tổng quan QL không có khối Việc → không thấy.
- K5-11: `ghiKetLuanFt` có (`cuoiKhoa.ts:506`), không có việc nào nhắc Quản lý đánh dấu.

- [ ] **Phép kiểm trước — hai đường, mỗi chỉ số:**
  - (a) `van-hanh-can-quyet-dinh`: `ids` = id việc Vận hành mà `listMgmtTasks(QL).rows` lọc `khopHang('can-quyet-dinh')` — **bằng** `hangSo['can-quyet-dinh']` của `listMgmtTasks` (cùng bộ lọc chi nhánh). Tạo việc tạm ngưng tới hạn xem lại → +1; mở lại → −1;
  - (b) `hv-chua-co-lenh-chuyen`: tập em = em của các lớp thường tới tuần Cuối khoá chưa có lệnh (`demChuaCoLenh`); Σ theo lớp = `count` của việc `placement` cùng lớp trong `myWork(QL)`; ra lệnh cho một em → −1;
  - (c) `hv-ft-xong-mt-cuoi-chua-mt-ke`: em FT đang học, đã có MT3 có điểm (RF: MT2), không có mốc kế tiếp, **chưa** có ngày/tháng thi. Tổng theo lớp = `tomTatMt(lớp).daXongMtCuoi − (số em xong mà có mốc)` — kiểm bằng dựng một em demo: xếp MT4 → ra khỏi tập; đặt tháng thi → ra khỏi tập;
  - (d) `hv-len-ft-chua-ky-vong`: em có lệnh `fast_track` từ lớp BE/ELE (`cho` hoặc `da_chuyen`), có bài Cuối khoá ở lớp nguồn, chưa có `ky_vong_dat` ở `lo_trinh_tiep_theo (em, lớp nguồn)`. `ghiKetLuanFt(dat: true)` → ra khỏi tập;
  - **phủ định quyền** cả 4: QL CP không thấy dữ liệu MB; GV gọi `/metrics/{id}` → tập rỗng có nhãn hoặc 403 như chỉ số QL khác;
  - khung `run.ts:9214` phủ 4 chỉ số (`n = ids.length = rows.length`).
- [ ] Shared: 4 chỉ số trong sổ (câu hỏi, tập đủ điều kiện, `hien-trang`); `CAN_XU_LY` thêm 4 dòng có cờ `cuaNguoiXem: true` (cột Người giữ việc = "Bạn").
- [ ] Máy chủ:
  - (a) gọi `listMgmtTasks(p, { branchId })` + `khopHang` — **không** câu SQL mới; `rowsFor('viec-van-hanh')` đọc tiêu đề từ cùng lượt;
  - (b) lớp lấy như `mywork.ts:536-548` (lớp đang mở, `mocKetKhoa(...).tuCuoiKhoa`, không FT) → `demChuaCoLenh` → id em chưa có lệnh (hàm trả số — thêm biến thể trả **tập em** cạnh hàm cũ, hàm cũ gọi biến thể mới rồi đếm, để một luật);
  - (c) tách điều kiện của `tomTatMt` thành hằng SQL `XONG_MT_CUOI_SQL` ở `schedule.ts` (hoặc `lichMt.ts`), `tomTatMt` và chỉ số mới cùng dùng; loại em có `exam_month`/ngày thi như `coMocTiepTheo`;
  - (d) một câu JOIN `lenh_chuyen_lop` × `programmes` (BE/ELE) × `lo_trinh_tiep_theo` × `assessment_attempts kind='final'`;
  - `tongQuanQuanLy` thêm 4 dòng với dòng phụ theo lớp (`tachTheoLop`) và nút đúng việc (Q8).
- [ ] `tocDoDuong`: `/tong-quan/quan-ly` đo lại (**+≤ 6 câu cố định**, không theo số lớp).
- [ ] `npm run check` → commit `PR-VAI-a (2): Cần xử lý có việc của Quản lý — Vận hành cần quyết định, lớp chưa đủ lệnh chuyển, FT xong MT3, kỳ vọng đầu ra`.

## Task 3 · Cần xử lý 4 cột: trạng thái · việc · Người giữ việc · Hạn (K1-06, UX-B6, Q4, Q24–Q26) — impeccable `layout` + `clarify`

**Files:** `server/src/worklist/tongQuan.ts` · `server/src/worklist/metrics.ts` (`rowsFor` :61-163, `MetricRow` :55, `overdueUpdatePlans` :295-313, `MetricResult` :30-52, `metricResponse` :173-188) ·
`server/src/worklist/scoreDebt.ts` (chỉ đọc) · `shared/domain/tongQuan.ts` (`DongCanXuLyGoc` :98-100) · `web/src/modules/worklist/KhoiCanXuLy.tsx` · `web/src/ui/SoLieu.tsx` (`DanhSachSoLieu`, dòng panel).

Hiện trạng:
- Dòng Cần xử lý: chấm màu 8 px (`KhoiCanXuLy.tsx:14, 34`) là tín hiệu duy nhất của mức gấp; không tên người, không hạn; nút "Xem" mở panel chỉ đọc.
- Panel danh sách: dòng Case/PA mở `/hoc-thuat/case/{id}` (`metrics.ts:84, 93`), không có người phụ trách.
- Nhắc chỉ có ở Công việc › Hỗ trợ học viên (`HoTroHocVienTab.tsx:102-123`, lọc `nhom`, `loc`, `cn` trên URL).

- [ ] **Phép kiểm trước:**
  - Mỗi dòng có `trangThai` ∈ {`qua-han`, `can-lam`}; sắp **quá hạn trước**, rồi dòng GV trễ trước dòng "của Bạn" (mockup B);
  - `nguoiGiuViec` dòng bài: tập tên = tập GV phụ trách các ô thuộc tập của chỉ số (đọc `scoreDebtCells`, so theo `baiId` nếu UXF-a đã merge, không thì theo `attemptId`); sắp theo tên (`localeCompare 'vi'`); ô chưa phân công không thêm tên;
  - `nguoiGiuViec` dòng PA: người thực hiện PA (`performer_user_id`, không có thì người phụ trách Case) — **một** câu cho cả tập;
  - `han` dòng bài = min/max ngày quá hạn của các ô; dòng PA = hạn cũ nhất = `MetricResult.hanCu` (Q25);
  - `hrefNhac` dòng bài = `/cong-viec?nhom=cham-diem&loc=qua-han[&cn=]`, dòng PA = `/cong-viec?nhom=case-hoc-thuat&loc=qua-han[&cn=]`; mở link đó bằng `myWork(QL, {nguoi:'tat-ca'})` → mọi GV trong `nguoiGiuViec` có ít nhất một dòng có `nhac` (**hai đường**: tên ở Tổng quan = người được Nhắc ở Công việc);
  - Panel: `rowsFor('case', ids)` và `'phuong-an'` có `nguoi` + `han`, `href` = `duongHoSoHocVien(sid, { caseId })`; số dòng không đổi;
  - **Phủ định:** tên GV chi nhánh khác không lọt vào `nguoiGiuViec` của QL MB.
- [ ] Máy chủ:
  - `overdueUpdatePlans` chọn thêm `action_due`, trả `{ ids, hanCu }` (cùng câu); `MetricResult.hanCu?`; `metricResponse` lean kèm `hanCu`;
  - `tongQuan.ts`: hàm `nguoiVaHan(metricId, ids)` — một câu mỗi chỉ số, theo lô 400; dòng "của Bạn" → `nguoiGiuViec: 'ban'`;
  - `rowsFor` 'case' + 'phuong-an': JOIN `users` lấy tên người phụ trách/thực hiện trong **cùng câu**; `MetricRow` thêm `nguoi?`, `han?`.
- [ ] Web `KhoiCanXuLy` (**layout**):
  - tiêu đề "Cần xử lý · n việc · quá hạn lên đầu", dòng phụ "Gộp hai khung · việc giáo viên đang trễ và việc chờ bạn sắp xếp";
  - bảng 5 cột thẳng: `NhanTrangThai` (Quá hạn / Cần làm) · Việc (số `SoLieuO` + nhãn, dòng phụ lớp/khung 12 px) · Người giữ việc (12 px) · Hạn (`<Han>` / chữ, 12 px) · nút đúng việc;
  - nút: "Xem và nhắc" (dòng GV trễ) · "Mở Vận hành" · "Mở chuyển lớp" · "Sửa phân công" · "Kế hoạch Test" · "Mở hồ sơ";
  - cuối khối: "'Xem và nhắc' mở Công việc đã lọc sẵn, có tên từng người và nút Nhắc" + "Tất cả việc trong Công việc →";
  - < 640 px: mỗi dòng một `TheDong` (nhãn · việc · người · hạn · nút), không cuộn ngang.
- [ ] Web panel `DanhSachSoLieu`: dòng có "người · quá hạn n ngày" 12 px; bấm dòng theo `href` mới.
- [ ] **clarify:** nhãn dòng theo mockup B ("14 bài chưa nhập điểm quá hạn", "4 PA chưa ghi kết quả tuần W4 SEP", "1 việc Vận hành cần quyết định", …); không chữ "QL".
- [ ] `npm run check` → commit `PR-VAI-a (3): Cần xử lý — nhãn trạng thái, Người giữ việc, Hạn, nút tới chỗ Nhắc; panel có người phụ trách`.

## Task 4 · Dải Chờ duyệt theo bộ lọc + bấm ra danh sách (VN05, K5-52, U2, Q17)

**Files:** `server/src/duyet/yeuCau.ts` (`hopChoDuyet` :318-342, `demYeuCau` :355-374) · `shared/domain/yeuCauDuyet.ts` (`demHop` :86-89) · `server/src/routes/index.ts` (:1648-1657) ·
`server/src/worklist/tongQuan.ts:56` · `web/src/modules/worklist/KhoiCanXuLy.tsx` (`DaiChoDuyet` :80-92) · `web/src/modules/duyet/HopChoDuyet.tsx` (:37-41, chip).

Hiện trạng: `demYeuCau(p)` không nhận chi nhánh (`tongQuan.ts:56`, `yeuCau.ts:355`) → chọn Hải Dương mà dải vẫn đếm cả 5 chi nhánh. "k quá hạn" là chữ, không bấm được; hộp không có lọc quá hạn.

- [ ] **Phép kiểm trước — hai đường:**
  - `demYeuCau(QL, { branchId: MB })` = `hopChoDuyet(QL, { branchId: MB }).dem` (cùng `demHop`): `tong`, `quaHan`, `baoLen`, chip từng phân loại;
  - `hopChoDuyet(QL, { branchId, quaHan: true }).the.length` = `demYeuCau(...).quaHan`;
  - `baoLenTheoLoai` (Case chờ nguyên nhân quá hạn / vi phạm quá 5 ngày / Mini Test trượt / …) cộng lại = `baoLen`;
  - không `branchId` → như cũ (badge `App.tsx` không đổi số);
  - **phủ định:** QL MB hỏi `branchId` CP → 403 (như `resolveScope`); GV gọi → không có phần hộp (chỉ `cuaToi*`).
- [ ] Máy chủ: `demYeuCau(p, f: { branchId? } = {})` lọc `chi_nhanh_id` sau `trongPhamVi`; thêm `chip` + `baoLenTheoLoai`; `hopChoDuyet` nhận `quaHan?: boolean` (lọc `han_duyet < homNay`, cùng điều kiện `demHop`); route `/yeu-cau` đọc `quaHan=1`; `tongQuanQuanLy` gọi `demYeuCau(p, { branchId })`.
- [ ] Web:
  - `DaiChoDuyet` theo mockup B: "Chờ duyệt **7** chờ · **2** quá hạn · gồm **3** Báo lên", dòng phụ phân loại; "2 quá hạn" → `/cong-viec/cho-duyet?qua-han=1[&cn=]`, "3 Báo lên" → `?phan=bao-len[&cn=]`, nút "Mở hộp duyệt";
  - `HopChoDuyet`: đọc `qua-han=1`, hiện chip "Quá hạn · n" (bỏ được), truyền `quaHan=1` lên API.
- [ ] `npm run check` → commit `PR-VAI-a (4): dải Chờ duyệt theo chi nhánh; số quá hạn, Báo lên bấm mở đúng thẻ ở hộp`.

## Task 5 · Bố cục Quản lý 3 tầng + phần Số liệu theo khung (K1-08, K1-10, T60 phần Tổng quan, Q5, Q10, Q11, Q25) — impeccable `layout`

**Files:** `web/src/modules/worklist/OverviewPage.tsx` (:92-116) · `MetricTiles.tsx` · `Highlights.tsx` (`LichSapToi` :39) · `BranchPulse.tsx` (chỉ vị trí) ·
`web/src/ui/SoLieu.tsx` (:112-137 "Cách tính") · `web/src/ui/CongTacKhung.tsx` (trang `'tong-quan'`) · `shared/domain/dieuHuong.ts:131` · `shared/domain/tongQuan.ts` (`chonDiemDangChuY` :123-145) ·
`server/src/worklist/metrics.ts` (`hv-duoi-ky-vong-mon` nhận `ctLop`) · `server/src/worklist/tongQuan.ts` (`diemChuY`).

Hiện trạng: tiêu đề "Tổng quan" + tab "Tổng quan" + menu "Tổng quan" (K1-10); `ChonChuongTrinh` "Lớp thường · Fast Track · Cả hai" ở đầu trang (:97), mặc định Cả hai; 4 ô đứng **trên** Cần xử lý (:109);
"Cách tính" mở rộng làm giãn cả hàng (`SoLieu.tsx:117, 131`); Điểm đáng chú ý chỉ có câu FT, ghi "· tối đa 3".

- [ ] **Phép kiểm trước:**
  - `TAB_TONG_QUAN_LABEL['tong-quan'] === 'Việc hôm nay'`;
  - `chonDiemDangChuY(ung, 'thuong')` có câu chương trình khi đủ ngưỡng (`FOU: 5/22 học viên chưa đạt ở bài gần nhất`), `soDanhSach` = số dòng khi mở `hv-duoi-ky-vong-mon` với `ctLop=FOU`;
    mọi câu có trường `loai` hiển thị ("can-chu-y" / "tot");
  - `/metrics/hv-duoi-ky-vong-mon?ct=thuong&ctLop=FOU`: `ids` ⊆ tập `ct=thuong`; `ctLop` lạ → 400;
  - `/metrics/pa-can-cap-nhat` lean có `hanCu` = MIN `action_due` của tập (Q25).
- [ ] Máy chủ: `metricSet('hv-duoi-ky-vong-mon', { ctLop })` lọc em theo `programme_code` lớp đang học (một câu theo lô); `diemChuY` thêm ứng viên lớp thường theo chương trình.
- [ ] Web (**layout**), thứ tự trang QL theo mockup B:
  - hàng tab "Việc hôm nay · Phân tích" + bộ lọc chi nhánh; **bỏ** `<h1>Tổng quan`, bỏ `ChonChuongTrinh` và `setCt` (:64-70, :97);
  - tầng 1: `DaiChoDuyet` (khối riêng) → `KhoiCanXuLy`;
  - tầng 3 "Số liệu": `CongTacKhung trang="tong-quan"` (không "Tất cả", mặc định FT) + câu "Chỉ phần số đổi theo khung · Chờ duyệt và Cần xử lý luôn gộp" → 4 ô → Điểm đáng chú ý + Lịch sắp tới cạnh nhau → bảng Theo chi nhánh;
  - 4 ô: "Học viên dưới kỳ vọng / chưa đạt" · "Học viên có Case đang mở" (phụ "n Case") · **"Case chờ xác nhận nguyên nhân"** (`case-cho-xac-dinh-nguyen-nhan`, phụ "k quá hạn · đã thành thẻ Báo lên") · **"PA quá hạn ghi kết quả"** (phụ "tuần W4 SEP" từ `hanCu`);
  - "Cách tính" → chú thích nổi (rê chuột + Tab + bấm; Esc đóng), không đẩy ô;
  - Điểm đáng chú ý: nhãn chữ "Cần chú ý" / "Tốt", link "xem n học viên"; bỏ "· tối đa 3";
  - Lịch sắp tới: danh sách phẳng `W1 OCT · MT2 · MB FT 103 · 11 em · tuần này` theo khung (cùng `/highlights`), không còn ba tab tuần;
  - khung đang chọn đi xuống `/metrics`, `/tong-quan/diem-chu-y`, `/highlights`, `/tong-quan/chi-nhanh` bằng `ct=ft|thuong` (không bao giờ vắng tham số).
- [ ] `npm run check` → commit `PR-VAI-a (5): Tổng quan Quản lý ba tầng — Chờ duyệt, Cần xử lý trên; Số liệu theo khung FT · Lớp thường ở dưới`.

## Task 6 · Công việc: nhóm T75, luật "đến hết tuần", Phối hợp SOS thành việc, bỏ "Ghi lộ trình tiếp theo" (T75, V3, K5-10, Q1, Q13, Q14, Q27) — impeccable `clarify`

**Files:** `shared/domain/tongQuan.ts` (:26-47) · `shared/domain/congViec.ts` (:23-55) · `server/src/worklist/mywork.ts` (:113-114, :170, :184, :497, :561-605, :1133-1134; khối Phối hợp mới cạnh :836-866) ·
`tests/lenLop.tests.ts:410-418` · `tests/prCt.tests.ts:810-825` · `tests/nenGiaoDien.tests.ts:91-95` ·
`server/src/yThuc/phoiHop.ts` (`myCoordinationLines` :287-316, chỉ đọc) · `web/src/modules/worklist/NhomViec.tsx` (:15, :54-64) · `ViecCuaToi.tsx` · `congViec/HoTroHocVienTab.tsx` (:14, :52, :85-95, :151) ·
`web/src/modules/yThuc/YThucReminders.tsx` (xoá nếu hết nơi dùng) · `web/src/modules/worklist/WorkList.tsx` (`DongViec` :37-71).

Hiện trạng:
- Tên nhóm "Ý thức & Phối hợp", "Vận hành" (`tongQuan.ts:29`); khoá `result` (`mywork.ts:497`).
- Phối hợp SOS là **nhắc mềm** ngoài `WorkItem` (`YThucReminders.tsx:10-14`, `NhomViec.tsx:54-64`, cộng tay vào số nhóm `HoTroHocVienTab.tsx:89-95, 151`, `ViecCuaToi.tsx:27`).
- Chưa có lọc "quá hạn + hạn đến hết tuần" (`LOC_NHANH` :23 có `tuan-nay` **không** gồm quá hạn).
- `DongViec` không có cột nhãn trạng thái; hạn 11 px (`WorkList.tsx:62`).
- GVCN lớp thường còn việc `next_step` "Ghi lộ trình tiếp theo" ở hai tuần cuối khoá (`mywork.ts:561-605`) — việc của luồng cũ, nay Quản lý quyết mọi lần chuyển lớp (Q30-1)
  và đã có việc `placement` "Chuyển lớp cả lớp · … · n HV" (`mywork.ts:536-559`). Nơi còn đọc nhóm `next_step`: kiểu `WorkGroupKey` (:114), `GROUP_META` (:184),
  danh sách nhóm (:1134), `NHOM_CUA_LOAI` (`tongQuan.ts:36`), `DongViec` (`WorkList.tsx:51`), phép kiểm `lenLop.tests.ts:410-418`, `prCt.tests.ts:818-819`,
  `nenGiaoDien.tests.ts:95`. **Không** có thông báo nào dùng nhóm này. Nhãn nhật ký `student.next_step` (`nhatKy.ts:51`) và `case_followups.next_step` là chuyện khác — **giữ**.

- [ ] **Phép kiểm trước:**
  - **GVCN không còn việc `next_step`:** lớp thường ở tuần 7/8 có em chưa có lộ trình → `myWork(GVCN)`, `myWork(GVBM)`, `myWork(QL, { nguoi: 'tat-ca' })` đều **không** có dòng `group === 'next_step'`;
    việc của Quản lý vẫn còn: từ tuần Cuối khoá, `placement` "Chuyển lớp cả lớp" của lớp đó có mặt (sửa `lenLop.tests.ts:410-418` và `prCt.tests.ts:818-819` theo kỳ vọng mới — không xoá);
  - `NHOM_VIEC_LABEL` = Chấm điểm · Case học thuật · Ý thức · Lớp & vận hành; `nhomViecCua('ghi_ket_qua_pa') === 'case-hoc-thuat'`; `LOAI_HAN_CUA_VIEC.ghi_ket_qua_pa === 'cap-nhat-pa'`; không còn khoá `result` trong `mywork.ts`;
  - `trongKhoiHomNay`: quá hạn → true; hạn hôm nay → true; hạn Chủ nhật tuần này → true; hạn Thứ Hai tuần sau → false; không hạn → false. `khopLocNhanh(it, 'den-het-tuan')` = `trongKhoiHomNay`;
  - `phoi_hop_sos`: GVCN MB FT 101 có n lượt chưa xong → **một** việc lớp đó, `count` = `pendingCount` của `myCoordinationLines` (**hai đường**) = số lượt ở tab Phối hợp SOS của lớp (`coordinationOfClass`); xong hết lượt → việc biến mất; GVBM không có việc này (**phủ định**);
  - `gomNhomViec(items)` không còn tham số `soNhacYThuc`; chip "Tất cả" = Σ nhóm (UXF-a F5 vẫn đúng mà không cần `soNhac`).
- [ ] Shared: đổi nhãn + khoá; `LOC_NHANH` thêm `'den-het-tuan'` nhãn "Đến hết tuần"; `trongKhoiHomNay`.
- [ ] Máy chủ `mywork.ts`: **xoá** khối 2d `next_step` (:561-605) cùng `'next_step'` ở kiểu (:114), `GROUP_META` (:184), danh sách nhóm (:1134); bỏ import không còn dùng (`demChuaLoTrinh`,
  `trongHaiTuanCuoi`, `demCanQuanLyTheoLop` — grep trước, còn nơi khác dùng thì giữ). Shared: bỏ `next_step` khỏi `NHOM_CUA_LOAI`. Web: `WorkList.tsx:51` bỏ vế `next_step`.
  `nenGiaoDien.tests.ts:95` bỏ `'next_step'` khỏi vòng lặp (phép kiểm giữ cho `placement`).
- [ ] Máy chủ `mywork.ts`: đổi khoá `result` → `ghi_ket_qua_pa` (:113, :170, :497, :1133); khối `phoi_hop_sos` gọi `myCoordinationLines(p)` (không câu mới), `href` = `/hoc-vien/lop/{id}?tab=y-thuc&sub=phoi-hop` (theo đường tab lớp đang có), `actionLabel` "Mở Phối hợp".
- [ ] Web:
  - xoá nhắc mềm: `useNhacYThuc`, prop `nhac` của `NhomViec`, `soNhacYThuc`; xoá `YThucReminders.tsx` và route `/y-thuc/my-coordination` **nếu** không còn nơi dùng (grep trước; còn thì giữ route);
  - `DongViec`: thêm cột nhãn trạng thái (`NhanTrangThai` "Quá hạn" / "Cần làm", theo `urgency`) đứng đầu dòng, hạn 12 px; bốn cột thẳng qua mọi nhóm;
  - Công việc › Hỗ trợ học viên: chip "Đến hết tuần" trong hàng lọc nhanh.
- [ ] **clarify:** tên việc = động từ + đối tượng + hạn (T75) — rà các `tieuDe` của `mywork.ts` còn thiếu động từ; ghi Nhật ký chỗ đã đổi.
- [ ] `tocDoDuong`: `/my-work` (GVCN, GVCN_THUONG) đo lại — bỏ khối 2d làm **giảm** câu; ghi số mới, **không** hạ trần quá mức đo (trần = `max(sau+10, ⌈sau×1.3⌉)`).
- [ ] `npm run check` → commit `PR-VAI-a (6): Công việc — nhóm Ý thức, Lớp & vận hành; Phối hợp SOS là việc thật; bỏ việc "Ghi lộ trình tiếp theo" của GVCN; lọc Đến hết tuần; nhãn trạng thái trên dòng`.

## Task 7 · Hai dòng việc mới: khai bậc Ý thức HS cũ, kỳ vọng đầu ra (K1-15, K5-11, Q15)

**Files:** `server/src/worklist/mywork.ts` · `server/src/yThuc/xuLy.ts` (`coTheKhai` :318, chỉ đọc) · `server/src/yThuc/trangThai.ts:118` (chỉ đọc) · `shared/domain/tongQuan.ts` (`NHOM_CUA_LOAI`).

Hiện trạng: khai bậc chỉ là nút trong thang Ý thức (`ThangYThuc.tsx:25-28`), không có việc; kỳ vọng đầu ra chỉ ở Kết luận khoá / panel Chuyển lớp (`TransitionPanel.tsx:450`), không có việc.

- [ ] **Phép kiểm trước:**
  - GVCN lớp có em mới (tạo trong 14 ngày), `coTheKhai` → một việc `khai_bac` "Khai bậc Ý thức HS cũ · {lớp} · n em", nhóm Ý thức, không hạn; em khai xong → n giảm; em tạo 20 ngày trước → không tính; GVBM không có việc (**phủ định**);
  - QL có việc `ky_vong_dau_ra` mỗi em thuộc tập `hv-len-ft-chua-ky-vong` (Task 2) — **hai đường**: số việc của QL MB = `metricSet('hv-len-ft-chua-ky-vong', { branchId: MB }).n`; nhóm "Lớp & vận hành"; QL CP không thấy em MB.
- [ ] Máy chủ: hai khối trong `myWork`, mỗi khối **một câu** theo lô; `href` khai bậc = hồ sơ em đầu tiên tab Ý thức `?mo=khai` (hoặc hồ sơ lớp tab Ý thức nếu nhiều em — chọn đường đã có, ghi Nhật ký); kỳ vọng = hồ sơ HV mục Kết luận khoá.
- [ ] Shared: `NHOM_CUA_LOAI` thêm `khai_bac: 'y-thuc'`, `ky_vong_dau_ra: 'van-hanh'`, `phoi_hop_sos: 'case-hoc-thuat'`.
- [ ] `tocDoDuong`: `/my-work` (GVCN, QL, `nguoi=tat-ca`) đo lại (**+≤ 2 câu**).
- [ ] `npm run check` → commit `PR-VAI-a (7): việc Khai bậc Ý thức HS cũ (GVCN) và Đánh dấu kỳ vọng đầu ra (Quản lý)`.

## Task 8 · Tổng quan giáo viên: Việc của tôi · Yêu cầu của tôi · Lớp tôi dạy (E.1, Q1, Q12, Q22) — impeccable `layout`

**Files:** `web/src/modules/worklist/OverviewPage.tsx` (:74-90) · `ViecCuaToi.tsx` · xoá `HocVienCanHoTro.tsx` · `server/src/worklist/tongQuan.ts` (xoá `hocVienCanHoTro` :59-135; hàm `lopToiDay`) ·
`server/src/worklist/chuongTrinh.ts` (`lopCuaTap`, chỉ đọc) · `server/src/classes/schedule.ts` (`classProgressMany` :402, chỉ đọc) · `shared/domain/lichMt.ts` (`MOC_KE_TIEP_SQL` :121, chỉ đọc) ·
`server/src/routes/index.ts` (:1539-1543 xoá; route mới) · `tests/tongQuan.tests.ts:324-349` · `tests/prYt4.tests.ts:344-351`.

Hiện trạng: GV thấy "Việc cần làm của tôi" (mọi việc, 5 dòng/nhóm) + "Học viên cần hỗ trợ" + Lịch sắp tới "Cả hai" (`OverviewPage.tsx:83-87`).

- [ ] **Phép kiểm trước:**
  - `lopToiDay(GVCN MB FT 101)`: hàng = đúng các lớp người đó có phân công hiệu lực hôm nay; cột `toiDay` "GVCN · Reading" (tên môn theo chương trình);
  - **hai đường** mỗi cột số: `duoiKyVong`/`sos`/`caseMo` của một lớp = số dòng `oLopToiDay(p, { classId, cot })`; Σ hàng ⊆ tập `metricSet` cùng khung;
  - Bài chờ chấm (web, luật thuần `baiChoChamTheoLop(items)`) = Σ `count` việc `score` cùng `classId` — kiểm bằng hàm thuần với danh sách việc mẫu;
  - Test kế tiếp FT = lượt planned sớm nhất (không lịch sử, từ tuần này) trong lớp, ghi `MT3 · W3 OCT`; lớp thường = mốc Giữa/Cuối khoá kế tiếp;
  - Lớp thường: không có cột SOS; FT: không có cột tuần khoá;
  - **phủ định:** GV không dạy MB FOU 12 không có hàng đó; hỏi `oLopToiDay` lớp không dạy → 403;
  - `mucMacDinhKhung`: dạy cả hai → `ft`; chỉ lớp thường → `thuong`;
  - sửa `tongQuan.tests.ts:324` → kiểm "Lớp tôi dạy"; `prYt4.tests.ts:344` → nhãn Ý thức ở việc `yt_xu_ly`/`yt_xem` trong `myWork` (Quá hạn / Cần làm, có hạn).
- [ ] Máy chủ: `lopToiDay(p, { ct })` + `oLopToiDay(p, { ct, classId, cot })` dùng **một** hàm tính nội bộ; routes `GET /tong-quan/lop-toi-day`, `GET /tong-quan/lop-toi-day/o`; xoá `hocVienCanHoTro` + route.
- [ ] Web (**layout**, mockup màn A):
  - đầu trang "Chào Hà" + "Tuần W1 OCT · hôm nay 01/10" (Q22);
  - hàng 1: **"Việc của tôi · hôm nay"** (trái, rộng) — số tổng "2 quá hạn · 2 hạn hôm nay · 7 việc đến hết W1 OCT"; 4 nhóm lọc bằng `trongKhoiHomNay`; nhóm trống ẩn; dòng cuối "n việc khác chưa đến hạn tuần này · Tất cả việc (N) trong Công việc";
    **"Yêu cầu của tôi"** (phải) — "n chờ duyệt · k bị từ chối", tối đa 3 thẻ gọn (bị từ chối lên đầu, nhãn Cần làm, nút "Sửa và gửi lại"), "Mở Yêu cầu của tôi" (dùng `/yeu-cau?hop=cua-toi`, ẩn khi không có gì);
  - tầng 3: **"Lớp tôi dạy"** + `CongTacKhung trang="tong-quan"` (ẩn khi dạy một khung) + câu "bấm số để xem danh sách em"; số bấm ra `DanhSachSoLieu`-kiểu panel qua `/tong-quan/lop-toi-day/o`;
  - xoá `HocVienCanHoTro.tsx`, bỏ `LichSapToi` ở GV.
- [ ] `tocDoDuong`: thêm `/tong-quan/lop-toi-day?ct=ft` (GVCN, GVBM, GVCN_THUONG) và `/tong-quan/lop-toi-day/o?...` (một ô); xoá `/tong-quan/hoc-vien-can-ho-tro`.
- [ ] `npm run check` → commit `PR-VAI-a (8): Tổng quan giáo viên — việc đến hết tuần, Yêu cầu của tôi, bảng Lớp tôi dạy (bỏ Học viên cần hỗ trợ)`.

## Task 9 · Điện thoại + badge (T53 Q8, V2/K1-44, Q2, Q16) — impeccable `adapt`

**Files:** `web/src/modules/worklist/OverviewPage.tsx` · `ViecCuaToi.tsx` · `KhoiCanXuLy.tsx` (thẻ < 640 px, Task 3) · `web/src/App.tsx` (:37-47 `SoCho`, :49-70, :77) ·
`server/src/routes/index.ts` (route `/my-work/dem` cạnh :385) · `shared/domain/congViec.ts` (`baViecDau`).

- [ ] **Phép kiểm trước:**
  - `baViecDau(items, homNay)` = 3 phần tử đầu của `items.filter(trongKhoiHomNay)` sắp quá hạn lâu nhất → hôm nay → hạn gần; `soXemHet` = độ dài danh sách đó = số chip "Đến hết tuần" ở Công việc (**hai đường**);
  - `GET /my-work/dem` (GV) → `{ quaHan }` = `myWork(p).summary.overdue`; QL → như cũ không có trường thừa; chưa đăng nhập → 401.
- [ ] Máy chủ: route `/my-work/dem` gọi `myWork(p)` và chỉ trả `{ quaHan }`.
- [ ] Web (**adapt**):
  - < 640 px GV: khối "Hôm nay" = `baViecDau` (dòng chỉ nhãn + hạn + tên việc, cả dòng là nút ≥ 44 px) + "Xem hết (n)" → `/cong-viec?loc=den-het-tuan`; dưới là một dòng "Yêu cầu của tôi · n chờ duyệt · k bị từ chối"; "Lớp tôi dạy" thành thẻ mỗi lớp 3 số (FT: dưới kỳ vọng · SOS · bài quá hạn/chờ chấm; thường: chưa đạt · Case mở · bài chờ chấm; dòng tên có "R · tuần 7/10");
  - QL < 640 px: dải Chờ duyệt xuống hai dòng; Cần xử lý là thẻ (Task 3); bảng chi nhánh cuộn **trong khung** của nó, trang không cuộn ngang;
  - `App.tsx`: GV (`!workApprove && workSupport`) đọc `/my-work/dem` **một lần** (deps rỗng; tự tải lại khi `/my-work` bị làm mới); `SoCho` nhận số quá hạn → số đỏ cạnh "Công việc" ở thanh trên và thanh dưới; `sr-only` "n việc quá hạn".
- [ ] `tocDoDuong`: thêm `/my-work/dem` (GVCN, GVBM, GVCN_THUONG).
- [ ] `npm run check` → commit `PR-VAI-a (9): điện thoại — Hôm nay 3 việc + Xem hết; badge việc quá hạn cho giáo viên`.

## Task 10 · Chuông: Cần làm / Để biết, giờ, "Đọc hết", neo mép điện thoại (T76, K1-42, UX-D6, Q18–Q21) — impeccable `clarify` + `adapt`

**Files:** `server/src/platform/thongBao.ts` (:12-30) · `server/src/routes/index.ts` (:1999-2006) · `shared/domain/duongHoSo.ts` (:93-126) ·
`web/src/modules/platform/Header.tsx` (:32, :96, :162-197) · notify: `fasttrack/absence.ts:620, 754` · `cases/sosAuto.ts:146-151` · `yThuc/xuLy.ts:163` · `normal/cuoiKhoa.ts` (dòng `'sos', 'Mang theo PA Bổ trợ miễn phí'` ~:305) · `duyet/yeuCau.ts:183`.

Hiện trạng: một danh sách phẳng 30 dòng (`thongBao.ts:27`), bảng `absolute right-0` cắt nửa trái trên điện thoại (`Header.tsx:172`), không giờ, không "Đọc hết", không nhóm; tải một lần.
SOS chỉ gửi GVCN đã đúng (`sos.ts:516-531`); các loại mới (quá hạn duyệt, Báo lên, bắt buộc xử lý, vi phạm mới, đăng ký) **đã có** — không làm lại.

- [ ] **Phép kiểm trước:**
  - `nhomThongBao` đủ bảng loại: Cần làm = `nhac_viec`, `nhac_ban_giao`, `duyet_moi`, `duyet_qua_han`, `duyet_tu_choi`, `sos`, `discipline`, `schedule_move`, `phoi_hop`, `dang_ky`, `lenh_loi`, `ban_giao` (nếu là việc bàn giao — kiểm chữ khi làm); Để biết = `duyet_ket_qua`, `duyet_tu_duyet`, `transfer_in`, `sap_nhan`, `huy_lenh`, `bo_tro_mien_phi`, `discipline_de_biet`, `tu_doi_lich`; loại lạ → Để biết;
  - dòng Cần làm của Case đã có nguyên nhân / thẻ không còn `cho` → sang Để biết (**cùng câu SQL**, đếm câu = 1);
  - `noiDenThongBao` ra "Hồ sơ {HV} › Case {môn}", "Công việc › Yêu cầu của tôi", "Công việc › Chờ duyệt", "Lớp {mã} › Ý thức", "Test › Lịch Test", "Quản trị › Tài khoản";
  - `POST /notifications/doc-het` → mọi dòng chưa đọc **của người gọi** có `read_at`; của người khác không đổi (**phủ định**); trả số dòng đã đánh dấu;
  - `thongBaoCua` trả mọi dòng chưa đọc + mới nhất, ≤ 50;
  - tiêu đề mới ở `absence.ts:620` và `sosAuto.ts:148` đúng mẫu Q20 (quét chuỗi: không còn "Lịch thi cần xử lý").
- [ ] Máy chủ: `thongBaoCua` thêm `ten_hv`, `mon` (JOIN `students`, `sos_cases` sẵn có), `con_viec` (Case còn chờ nguyên nhân / thẻ còn `cho`), sắp `read_at IS NULL` trước, `LIMIT 50`;
  route "Đọc hết" (một `UPDATE … WHERE user_id = ? AND read_at IS NULL`); đổi `kind` ở 4 chỗ (Q19); đổi tiêu đề 2 chỗ (Q20).
- [ ] Shared: `nhomThongBao(n)`, `noiDenThongBao(n)`; `duongThongBao` nhận `duyet_tu_choi` như `duyet_ket_qua`, `tu_doi_lich` như `schedule_move`.
- [ ] Web `Header` (**clarify** + **adapt**, mockup màn D):
  - đầu bảng "Thông báo · n chưa đọc" + nút "Đọc hết"; nhóm "Cần làm n" rồi "Để biết n";
  - dòng: chấm xanh chưa đọc · tiêu đề · giờ bên phải (12 px, hôm nay chỉ giờ) · thân 12 px · dòng xanh `noiDenThongBao` 12 px;
  - < 640 px: `fixed inset-x-2 top-14`, `max-h-[70vh]`, cuộn trong; ≥ 640 px giữ thả dưới nút;
  - mở chuông → `notifications.reload()`; Esc/Tab giữ như cũ.
- [ ] `tocDoDuong`: `/notifications` đo lại (vẫn một câu).
- [ ] `npm run check` → commit `PR-VAI-a (10): chuông — Cần làm / Để biết, giờ, Đọc hết, tiêu đề theo việc, neo hai mép trên điện thoại`.

## Task 11 · Lịch Test dòng Nợ ghi tên GV + hai việc nhận từ UXF-a (UX-B5, Q23, `mywork.ts:927`, `urgencyOf`)

**Files:** `server/src/cham/canCham.ts` (`DongNo` :73, `noTuanTruoc` :235-300) · `web/src/modules/test/lichTest/kieu.ts` (:11-20) · `KhoiNo.tsx` (:128-160) ·
`server/src/fasttrack/attempts.ts` (`pendingOwners` :717, :801, chỉ đọc) · `server/src/worklist/mywork.ts` (:927, :240-245, :350-372).

- [ ] **Phép kiểm trước:**
  - dòng Nợ có `gvNo` = tên GV phụ trách các kỹ năng còn nợ (từ `pendingOwners`), sắp theo tên, không trùng; môn chưa phân công → `'chưa phân công'`; số câu SQL `/cham/lich-test` **không đổi**;
  - việc `missing_data` "target" sắp lớp bằng `soSanhLop` (`MB FT 9` trước `MB FT 10`);
  - **nếu** UXF-a đã merge: việc Chấm điểm quá hạn ⇔ ô có `overdue` (tuần thi đã hết) — cùng cờ với `bai-qua-han-nhap-diem`; tuần đang chạy không quá hạn. UXF-a chưa merge → bỏ vế này, ghi Nhật ký, làm ở cổng gộp.
- [ ] Máy chủ: `noTuanTruoc` gom `a.pendingOwners[skill]` vào `gvNo`; `mywork.ts:927` bỏ `ORDER BY c.code`, sắp JS `soSanhLop`; `urgencyOf` của việc score đọc cờ ô (nếu UXF-a có).
- [ ] Web `KhoiNo`: cột "GV chấm" (12 px, `truncate` + `title`) ở bản rộng; bản hẹp thêm vào dòng phụ; giữ ô Đợt `MT3 · W3 SEP` của UXF-a nếu đã có.
- [ ] `npm run check` → commit `PR-VAI-a (11): dòng Nợ Lịch Test có tên GV đang nợ; sắp lớp soSanhLop ở việc thiếu target`.

## Task 12 · Bấm thử theo vai, 1440 + 375, sáng/tối — impeccable `audit` + `polish`, `/ponytail-review`, mở PR

- [ ] Cổng gộp `origin/main` (Pb2 phải đã merge; UXF-a / VAI-b nếu có) → gỡ theo bảng file chồng → xoá phần `boQuen` còn sót (Q7) → thay mọi chỗ còn tự đọc `ct` bằng hàm của Pb2 → `npm run check`.
- [ ] Chạy mục **KIỂM** theo vai QL (Nguyễn Khánh Vy id 2), QT (id 1), GVCN MB FT 101, GVBM MB FT 101, GVCN lớp thường (MB FOU 12). Ảnh `thiet-ke/anh/pr-vai-a/{muc}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] impeccable **`audit`** trên Tổng quan (GV, QL), Công việc › Hỗ trợ học viên, hộp Chờ duyệt, chuông, Lịch Test khối Nợ; rồi **`polish`** (sáng **và** tối). Kiểm:
  - cỡ chữ Q31-4 (kết quả / hạn / người giữ việc 12 px);
  - mã tuần; không "n/16"; lớp thường không SOS;
  - một nhãn trạng thái mỗi dòng; không chấm màu làm tín hiệu duy nhất;
  - 375 px không cuộn ngang; nút ≥ 44 px; chuông neo hai mép;
  - tương phản ≥ 4,5:1 cả hai chế độ.
- [ ] `/ponytail-review`; liệt kê mọi `ponytail:` mới trong thân PR.
- [ ] Quét: không còn `npm run check` treo; tắt 4157/5357.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - bảng mục (mã → ảnh trước/sau → đạt);
  - "tầng 1 của màn này là: …" cho Tổng quan GV, Tổng quan QL, chuông (§7.5);
  - mốc B → số phép kiểm cuối; trần tốc độ đổi / mới;
  - "Chuyển cho PR khác"; `ponytail:`.

## Câu hỏi cho chủ sản phẩm

Không có. Mọi chỗ planning tự quyết nằm ở bảng Q (Q4 "Bạn", Q15 cửa sổ 14 ngày, Q27 bỏ việc "Ghi lộ trình tiếp theo" — planning đã chốt 01/10). Anh/chị gạch dòng nào không đồng ý.

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Giao kèo VAI-a để lại |
|---|---|---|
| Bỏ `'ca-hai'`, `CHUONG_TRINH`, `chuongTrinhTuThamSo`, `thamSoCt`, `ChonChuongTrinh` (T60) | **PR-Pb2** (merge trước VAI-a) | Tổng quan không còn dùng `ChonChuongTrinh`; Cần xử lý / Chờ duyệt không truyền `program` |
| Xoá `boQuen.ts`, route `/phan-tich/bo-quen`, `DanhSachBoQuen.tsx`, phép kiểm UX4 — nếu Danh sách Case còn dùng lúc VAI-a gộp | **PR-Pb2** | chỉ số U3 và dòng Cần xử lý đã xoá |
| Thanh dưới biểu tượng 20 px + vạch chọn (UX-D9, mockup 23 màn C vẽ sẵn) | **PR-UXD** | badge quá hạn GV đã có ở thanh dưới |
| Bảng Vận hành / Báo cáo đơn vị / Tài khoản thành thẻ (D7) | **PR-UXD** (Q31-3 hoãn) | — |
| E.4 / G5 đường dẫn sâu "MT2 · Speaking → hồ sơ Mock cuộn tới kỹ năng" | **PR-VAI-b** (planning đã báo) | việc Chấm điểm vẫn mở Lịch Test đúng lớp + môn; VAI-a không đổi `href` của hồ sơ Mock |
| Badge / cờ "chưa có lộ trình tiếp theo" ở hồ sơ lớp và Học viên & Lớp (`classes.ts:91-106` `soChuaLoTrinhTiep`, `nhacLoTrinh`; `loTrinhTiep.ts:220`) — còn sau khi bỏ việc `next_step` (Q27) | **planning** xác nhận → PR-Dọn | VAI-a chỉ bỏ dòng việc, không sửa `classes.ts`, `loTrinhTiep.ts` |
| `summary.approval` luôn 0 (`mywork.ts:1286`) | **PR-Dọn** | — |
| Tiêu đề thông báo còn chưa theo mẫu "việc + em + lớp" (nếu `audit` thấy) | **PR-S3** | `nhomThongBao`, `noiDenThongBao` sẵn |
| Bảng chi nhánh gán Case theo lớp của lượt | **PR-UXF-a** | "Lớp tôi dạy" đã dùng `lopCuaTap` (cùng hàm) |

## KIỂM — kịch bản bấm thử

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| 1 | GVCN MB FT 101 | Tổng quan (trang đầu) | xem | "Chào …", "Tuần W3 SEP · hôm nay 14/09"; khối "Việc của tôi · hôm nay" chỉ việc quá hạn + hạn đến hết tuần; 4 nhóm Chấm điểm · Case học thuật · Ý thức · Lớp & vận hành; mỗi dòng nhãn Quá hạn/Cần làm + hạn 12 px + một nút; dòng cuối "n việc khác …" |
| 2 | GVCN | Tổng quan › Yêu cầu của tôi | xem | thẻ bị từ chối đứng đầu, nhãn Cần làm, nút "Sửa và gửi lại"; không có yêu cầu → khối ẩn |
| 3 | GVCN dạy cả hai khung | Tổng quan › Lớp tôi dạy | đổi FT ↔ Lớp thường | FT có SOS, không cột tuần khoá; Lớp thường "tuần n/y", không SOS; bấm "4" Dưới kỳ vọng → panel 4 em |
| 4 | GVBM một khung | Tổng quan › Lớp tôi dạy | xem | không có công tắc |
| 5 | GVCN | Tổng quan · 375 px | xem, bấm "Xem hết (n)" | 3 dòng, cả dòng bấm được; Công việc mở chip "Đến hết tuần" đúng n việc |
| 6 | GV có việc quá hạn | thanh trên / thanh dưới 375 | xem | số đỏ cạnh "Công việc" = số việc quá hạn |
| 7 | QL | Tổng quan › Việc hôm nay | xem | tab "Việc hôm nay · Phân tích", không tiêu đề "Tổng quan" lặp; dải Chờ duyệt; Cần xử lý 5 cột, quá hạn lên đầu; Số liệu ở dưới có công tắc FT · Lớp thường, mặc định FT |
| 8 | QL | Tổng quan › chọn chi nhánh Hải Dương | xem dải Chờ duyệt | số đổi theo chi nhánh; bấm "k quá hạn" → hộp chỉ còn thẻ quá hạn của HD, đúng k thẻ |
| 9 | QL | Cần xử lý › "n bài chưa nhập điểm quá hạn" | bấm số; bấm "Xem và nhắc" | panel n dòng có người phụ trách; Công việc mở nhóm Chấm điểm + Quá hạn, đủ tên ở cột Người giữ việc, có nút Nhắc |
| 10 | QL | Cần xử lý › "lớp thiếu GV môn" | "Sửa phân công" | mở hồ sơ lớp, panel Sửa phân công mở sẵn |
| 11 | QL | Cần xử lý › dòng "Bạn" (Vận hành, chuyển lớp, MT kế tiếp, kỳ vọng) | bấm nút | tới đúng tab Vận hành `hang=can-quyet-dinh` / panel chuyển lớp / Kế hoạch Test đúng lớp / hồ sơ HV; số khớp số ở đích |
| 12 | QL | Số liệu | đổi Lớp thường | ô 1 "Học viên chưa đạt"; bảng chi nhánh không cột SOS; Cần xử lý và Chờ duyệt **không** đổi số; "Cách tính" nổi, không giãn hàng |
| 13 | GVCN | chuông | mở | "Cần làm n" trên, "Để biết n" dưới; giờ; dòng xanh "Hồ sơ … › Case …"; "Đọc hết" tắt chấm, không xoá dòng |
| 14 | GVCN | chuông · 375 px | mở | bảng neo hai mép, cuộn trong, không cắt chữ |
| 15 | GVBM | Test › Lịch Test › khối Nợ | xem | cột "GV chấm" có tên; môn chưa phân công ghi "chưa phân công" |
| 16 | GVCN | Công việc › Hỗ trợ học viên | chip "Tất cả" và nhóm | không còn dòng "Nhắc" mềm; Phối hợp SOS là việc có nút "Mở Phối hợp"; chip Tất cả = Σ nhóm; GVCN lớp thường hai tuần cuối khoá **không** còn việc "Ghi lộ trình tiếp theo" |
| 17 | mọi vai | mọi màn trên | 375 px, sáng + tối | không cuộn ngang trang; số `tabular-nums`; hạn, kết quả, người 12 px |

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, model thật, trần tốc độ, lệch kế hoạch, cổng gộp) |
|---|---|---|
| | | |
