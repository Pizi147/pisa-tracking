# PR-Pb2 · Phân tích còn lại + Phân tích giáo viên + FOU 2 GV — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:**
(1) **Bỏ "Cả hai"** ở mọi khối theo kỹ năng / bài test trên toàn web: chỉ còn công tắc `Fast Track · Lớp thường`, Quản lý mặc định FT.
Khối không theo kỹ năng (Ý thức, Chờ duyệt, Việc, lịch) vẫn gộp. Pb2 **giữ hằng `CHUONG_TRINH`** (T60, K1-07, K1-18, K5-43, Q31-1).
(2) **Bỏ góc nhìn "Danh sách Case"**. Mọi đường dẫn cũ chuyển hướng về đúng chỗ, không 404 (T59, K1-27).
(3) **Hiệu quả PA tách hai phần**: "PA do giáo viên thêm" (giữ "Nên dùng") và "PA theo quy chế" (không xếp hạng). Thêm lọc theo giáo viên và theo khoảng tuần
(T61, K1-23, Pb2-23/09 P9, P9b, P12).
(4) **Tổng hợp Test lớp thường**: Giữa khoá theo môn, Cuối khoá theo 4 dải % tổng, Mini Test đạt/trượt (P4, K1-19).
(5) **Bảng Phân tích giáo viên** (góc nhìn mới "Giáo viên", thay chỗ Danh sách Case), đúng mockup 25 đã duyệt (Q30-5, Q31-2, Q31-9).
Kèm hai dữ liệu mới: **ngày nhập đầu** của ô điểm, **hạn xử lý chốt** của vi phạm.
(6) **FOU 2 giáo viên**: lưới phân công FOU mặc định 2 ô "L · R · G+V" và "P", có nút "Tách từng môn" (Q31-5).
(7) **Hồ sơ GV**: bảng lớp thường 4 cột cố định L · R · W (G+V) · S (P), vai "GVCN · L R G+V", chip "Bàn giao n/m em" (Q31-6, Q31-5, O6, P6).
(8) Dữ liệu demo cho bảng giáo viên (D18).

**Architecture:**
- Bảng giáo viên là **một bảng, không phải chỉ số trong sổ** (giống `tongHop.ts`). Mỗi cột có **đúng một hàm trả tập ID theo người**.
  Ô số, panel "Chấm điểm" và phép kiểm đều gọi hàm đó (`thiet-ke/HOP_DONG_SO_LIEU.md` §1).
- Cột nào đã có nguồn thì **gọi lại nguồn đó**, không đếm lần hai:
  - "Ghi kết quả PA" → `metricSet('dung-han-cap-nhat')`;
  - "PA hiệu quả" → hàm mới của `hieuQuaPa.ts` (Hiệu quả PA lọc GV gọi cùng hàm);
  - "Kết quả môn mình dạy" → luật chấm đạt tách ra từ `phanTichLop.ts`.
- Nạp **theo lô cho cả chi nhánh**, rồi gom theo người trong bộ nhớ. Không câu SQL nào chạy một lần cho mỗi GV. Có trần câu SQL trong `tocDoDuong.ts`.
- Luật thuần mới ở `shared/domain/phanTichGv.ts`: khoảng tuần/tháng, chữ ô, màu phần trăm.
- **Migrate** `server/src/migrate/prPb2.ts`: ba cột mới, không lệnh dữ liệu cũ (DB reset trước bản chính).
- Phép kiểm ở `server/src/tests/prPb2.tests.ts`.

**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); harness `check()` của `run.ts`, chạy `npm run check`.

**Spec:**
- **Nguồn chính:** kiểm kê `docs/superpowers/specs/2026-10-01-kiem-ke-truoc-dot-6.md`:
  - mục (c) làn C "PR-Pb2";
  - các dòng B1–B5 ghi Pb2 (T59, T60, T61, Q30-5, D18, K1-07/18/19/23/27, K5-43, P4, P6, O6, Pb2-23/09);
  - (e) dòng C.
- Đặc tả `2026-09-27-nang-cap-sau-deploy-design.md`:
  - §3.1g Q31-1, Q31-2, Q31-4;
  - **§3.1h Q31-5, Q31-6, Q31-9, Q31-12** (Q31-9 thay phần cột của Q31-2);
  - §3.2 T59, T60, T61.
- Mockup **`thiet-ke/mockup/25-phan-tich-giao-vien.html`** (đã duyệt, gồm bảng "Định nghĩa từng cột" và khối "Đã chốt").
  Mockup **`21-ho-so-giao-vien.html`** (hồ sơ GV).
- `thiet-ke/ra-27-09/K1.md` §2.3, §4(a), **§4(b)** (chỗ thay từng chức năng của Danh sách Case).
- `specs/2026-09-22-kiem-ke-truoc-deploy.md` dòng P8b, P9, P9b, P12; `specs/2026-09-23-viec-con-lai-sau-deploy.md` §B dòng PR-Pb2.
- Kế hoạch UXF-a `plans/2026-10-01-pr-uxf-a-so-lieu-khop.md`: bảng "Chuyển cho PR khác" (`noDiemCuaGv`, `baiId`, đơn vị bài) và bảng file chồng.
- `thiet-ke/HOP_DONG_SO_LIEU.md`.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-Pb2** · đợt 6 **lượt 1** · làn **C** · một PR, không draft, **không tự merge**. Khuyên **tách Pb2-a / Pb2-b** (Câu 1) — ranh giới ở dòng "Tách PR" dưới |
| Nhánh · worktree | `pr-pb2-phan-tich-giao-vien` · `.claude/worktrees/pr-pb2-phan-tich-giao-vien`, từ `origin/main` @ `86ddaf04` trở đi |
| Cổng thử | API **4177** · Vite **5377**. Song song: UXF-a 4187/5387 · VAI-a 4157/5357 · VAI-b 4167/5367. Không dùng 4000/5173 |
| Model | **Opus 5.5 · High** · phương án B: **Fable 5.1 · High**. Đầu phiên, session **tự kiểm model thật**; không phải Opus 5.5 thì **DỪNG**, báo chủ sản phẩm (trừ khi chủ sản phẩm đã chọn B) |
| Người rà | **Opus 5.5**, rà **một lượt cuối đợt 6**. Session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. `Co-Authored-By` ghi đúng model thật |
| Migrate? | **Có, chỉ cấu trúc.** Ba cột: `assessment_scores.nhap_dau_ngay`, `violations.han_xu_ly`, `violations.phan_hoi_ngay`. Không lệnh dữ liệu cũ, không lệnh chạy thử. `schema.sql` thêm đúng ba cột ở **cuối** định nghĩa bảng |
| Lệnh impeccable | **`/ponytail lite` đầu phiên**. **`clarify`** ở Task 3, 4, 7, 9 (tên cột, chú thích nổi) · **`layout`** ở Task 9 (bảng rộng, thẻ 375) · **`adapt`** ở Task 6, 9 (375 px) · **`audit`** + **`polish`** (**sáng và tối**) ở Task 11. Không `init`/`document`/`hooks on`/cài đặt. Trước PR: `/ponytail-review` |
| Phụ thuộc | Không chờ PR nào. **Merge TRƯỚC VAI-a** (cùng `shared/domain/tongQuan.ts`). Song song UXF-a, VAI-b (bảng file chồng dưới). Mockup 25, 21 đã duyệt |
| Tách PR (nếu chủ sản phẩm chọn Câu 1 = A) | **Pb2-a** = Task 0–4 + Task 11 (T60, T59, T61, P4 — không migrate, merge sớm cho VAI-a). **Pb2-b** = Task 0, 5–11 (dữ liệu mới, FOU 2 GV, hồ sơ GV, bảng giáo viên, demo), mở từ `main` **sau khi Pb2-a merge**. Cùng cổng 4177/5377 (chạy nối tiếp). Nhánh `pr-pb2a-phan-tich-con-lai` · `pr-pb2b-phan-tich-giao-vien` |
| Không làm | Tổng quan theo vai, 3 tầng Cần xử lý, bỏ dòng "2 lần Test" + `boQuen.ts` (U3), xu hướng ở Điểm đáng chú ý → **PR-VAI-a** · hàng "Chưa phân công" bảng GV chi nhánh, `baiId`, đơn vị bài → **PR-UXF-a** (Q31-12) · mã tuần ở Vấn đề HV / Bỏ quên (B5) → **PR-UXF-b** · bảng quản trị điện thoại → **PR-UXD** (Q31-3) · KPI GV (Q30-5, không làm) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - chạy `npm run check` **một lần, ở foreground**, log `$env:TEMP\check-pb2.log` (tên riêng — `$TEMP` dùng chung giữa các session);
  - xanh, số phép kiểm ≥ mốc B → commit `PR-Pb2 (n): …`.
- Sập segfault → chạy lại **một** lần. Treo > 10 phút → quét `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`, tắt hết, chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai, 1440 và 375, **sáng và tối**, **một lần** ở Task 11:
  - Playwright kênh Chrome; demo `POST /api/demo/session {userId}`;
  - vai tra `tests/tocDo.run.ts:114`;
  - ảnh vào `thiet-ke/anh/pr-pb2/`;
  - API `PORT=4177`, Vite tạm 5377 proxy về 4177 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4177/5377, quét `tests/run.js` treo, dọn file tạm.
- **Cổng gộp** khi UXF-a / VAI-b merge, và ở Task 11: `git fetch origin && git merge origin/main` → gỡ theo bảng file chồng → `npm run check` → ghi Nhật ký.

### File chồng với 3 PR song song lượt 1

Đã đối chiếu kế hoạch UXF-a và VAI-a (`plans/2026-10-01-pr-vai-a-tong-quan-theo-vai.md`, bảng file chồng :72-83, Q5, Q7). VAI-b chưa có kế hoạch — ghi theo phạm vi kiểm kê (c).
VAI-a đã chốt: **Pb2 merge trước**; VAI-a bỏ `ChonChuongTrinh` ở Tổng quan (dùng `CongTacKhung`), Cần xử lý + Chờ duyệt không nhận `ct`, và xoá `boQuen.ts` + route ở cổng gộp sau khi Pb2 đã bỏ Danh sách Case.

| File | PR khác | PR-Pb2 sửa | Gỡ |
|---|---|---|---|
| `shared/domain/tongQuan.ts` | **VAI-a** (bố cục theo vai, VN05, U3 bỏ dòng "2 lần Test" :88) · **UXF-a** (chữ đơn vị :94, dòng `dung-han` :139-142) | `CHUONG_TRINH` :12-23 (bỏ `'ca-hai'`), bỏ `denLoc` :85,:88 | **Pb2 merge trước VAI-a.** VAI-a xoá hẳn dòng :88 → giữ phần xoá. UXF-a đổi chữ → khác dòng, giữ cả hai |
| `web/src/modules/worklist/OverviewPage.tsx`, `ChonChuongTrinh.tsx`, `KhoiCanXuLy.tsx`, `BranchPulse.tsx`, `MetricTiles.tsx`, `Highlights.tsx`, `ui/SoLieu.tsx` | **VAI-a** (Tổng quan theo vai, K1-08, K1-10, UX-B6) | chỉ chỗ `'ca-hai'`: `OverviewPage.tsx:4,64-69,87,106` · `ChonChuongTrinh.tsx:1-13` · `KhoiCanXuLy.tsx:44` (bỏ nhánh `denLoc`) · `BranchPulse.tsx:72` · `Highlights.tsx:39-61` · `SoLieu.tsx:28` | Pb2 merge trước → VAI-a dựng trên kiểu mới `ChuongTrinh = 'ft' \| 'thuong'` |
| `server/src/worklist/metrics.ts` | **UXF-a** (`overdueScoreAttempts` :388-421, `obligations` :205-248, `rowsFor` :96-130) · **VAI-a** (K1-06 :81-101: dòng Case/PA thêm người + hạn, `href` hồ sơ HV — **cùng đích** với Pb2; xoá chỉ số U3 :504-506) | `metricSet` :357-358 (chương trình `null` = gộp, chỉ số Ý thức luôn gộp — `CHI_SO_GOP` đặt trong file này) · `href` Case :85, :94, :127 → hồ sơ HV | khác dòng → giữ cả hai; `href` Case trùng việc với VAI-a → VAI-a lấy bản của mình (cùng `duongHoSoHocVien`). Pb2 gọi `parseObligation`/`metricSet`, **không** tự tách id nghĩa vụ → UXF-a đổi dạng id thì Pb2 tự đúng |
| `server/src/giaoVien/hoSo.ts` · `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx` · `BangGiaoVienChiNhanh.tsx` | **UXF-a** (`noDiemCuaGv` :86-90, `oHoSoGv` :254-265, `bangGvChiNhanh` :290-349, hàng "Chưa phân công", tiêu đề "Bài chưa nhập / Bài quá hạn") | `locKhung` :51 + mặc định `ct` :54, :94, :101, :226, :300, :310 · nhãn vai :71-72 · chip bàn giao (`hoSoGiaoVien` :163-193) · bảng lớp thường 4 cột (`HoSoGiaoVienPage.tsx:289-315`) · `BangGiaoVienChiNhanh.tsx:26,31` | khác thân hàm → giữ cả hai. **Không đổi chữ ký** `noDiemCuaGv`/`oHoSoGv`/`bangGvChiNhanh` ngoài kiểu `ct` |
| `server/src/phanTich/tongHop.ts`, `vanDeHv.ts`, `shared/domain/phanTich.ts` | **UXF-a** (tooltip `phanTich.ts:233`, vòng `vanDeHv.ts:166-190`, "Chưa phân loại") | `tongHop.ts:97` + cột lớp thường (P4) · `vanDeHv.ts:76` · `phanTich.ts:19-70, 102-111, 150-240, 310-330` | khác khối → giữ cả hai |
| `server/src/students/profile.ts` | **VAI-b** (đầu hồ sơ :440-499) | chỉ `href` Case :190-198 | khác dòng |
| `server/src/routes/index.ts`, `tests/run.ts`, `tests/tocDoDuong.ts`, `shared/domain/index.ts`, `server/src/migrate.ts`, `schema.sql`, `CODE_MAP.md` | cả ba PR | chỉ thêm dòng (route mới, khối phép kiểm **cuối** `run.ts`, trần mới, `migratePrPb2` sau `migratePrCt` :483, ba cột cuối bảng) | giữ cả hai, thứ tự theo merge |
| `shared/domain/cases.ts` (`baiId`) | **UXF-a** Task 5 tạo `baiId` | **dùng**, không tự viết (xem Task 8) | UXF-a chưa merge khi Pb2 tới Task 8 → chép **nguyên văn** hàm của kế hoạch UXF-a Task 5 vào đúng chỗ đó; PR merge sau giữ một bản |

`StudentDetailPage.tsx`, `canCham.ts`, `mywork.ts`, `lenhChuyen.ts`, `TransitionPanel.tsx`: Pb2 **không sửa**.

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 | `CHUONG_TRINH = ['ft', 'thuong']`, FT đứng trước. `chuongTrinhTuThamSo(s, macDinh = 'ft')`: tham số lạ hoặc `ca-hai` của link cũ → mặc định, không lỗi. Chỗ **gộp** dùng `null` (kiểu `ChuongTrinh \| null`), không dùng một giá trị thứ ba | Q31-1; link cũ vẫn mở được |
| Q2 | Khối gộp (`ct = null`): chỉ số Ý thức + Phối hợp SOS (`YTHUC_METRIC_IDS`, `PHOI_HOP_METRIC_IDS` — `metricSet` bỏ qua `program` cho các chỉ số này, **một chỗ**), Phân tích › Ý thức (ẩn công tắc khung), Lịch sắp tới của GV, hồ sơ GV (hai bảng FT / lớp thường tách sẵn). `/metrics/:id` không có `ct` → gộp | "Khối không theo kỹ năng vẫn gộp" (Q31-1, K1-18) |
| Q3 | GV "mặc định khung của lớp mình dạy": **đã có** ở Lịch Test / Kế hoạch Test (`CongTacKhung`, `LichTestTab.tsx:138-140` mở khung đầu có lớp, FT trước). GV không có công tắc khung ở chỗ khác → không làm thêm | kiểm mã |
| Q4 | Chuyển hướng Danh sách Case (K1 §4b), làm trong `duongMoi` (`dieuHuong.ts:144`), đích không chuyển lần nữa: `goc=danh-sach` hoặc có `ky-nang`/`tinh-hinh` → `/phan-tich?goc=van-de` (giữ `cn`, `ct`) · `hang-doi=due` → `/cong-viec?nhom=case-hoc-thuat&loc=qua-han&nguoi=tat-ca` (giữ `cn`) · `hang-doi=<bỏ quên>` → `/` (giữ `cn`, `ct`). Nhánh `/?tab=tinh-hinh…` (`:152-156`) đi thẳng tới đích mới | T59; luật "đích không chuyển tiếp" của PR-O |
| Q5 | `/hoc-thuat/case/:id` → `duongHoSoHocVien(sid, { caseId })` (thay trang). Case không có học viên → giữ trang cũ. Link máy chủ sinh (`metrics.ts:85,94,127`, `profile.ts:190-198`, `HoSoGiaoVienPage.tsx:340,343`) đổi thẳng sang hồ sơ HV khi biết em. Link dự phòng ở `mywork.ts` giữ (chỉ khi không có em) | K1 §4b |
| Q6 | Bỏ `DanhSachCase` + `DanhSachBoQuen` (web). Dòng Cần xử lý "cần hỗ trợ 2 lần Test" bỏ `denLoc` → mở ngăn số như mọi dòng. Máy chủ `boQuen.ts` + `/phan-tich/bo-quen` **để VAI-a** xoá cùng U3 | một PR xoá một chỉ số |
| Q7 | **P8b bỏ**: là dạng điện thoại của Danh sách Case (đã bỏ). K1-22 "Chưa phân loại → Xem trong Công việc": **đã có** (`TongHopVanDeHv.tsx:150-158`) | kiểm mã |
| Q8 | T61: **PA theo quy chế ⇔ `preset = 1`** (gồm PA Bổ trợ `kind = 'bo_tro'`, `boTro.ts:18`); **PA do GV thêm ⇔ `preset = 0`**. Phần "PA do giáo viên thêm" đứng **trước** (câu hỏi của góc nhìn), giữ "Nên dùng". Phần "PA theo quy chế": FT theo **SOS 1 · 2 · 3** (mức của Case) → hàng con loại PA; lớp thường: **Bổ trợ Giữa khoá** · **Bổ trợ sau Cuối khoá** (`nhom_bo_tro` dạng `mt:%`). Thứ tự cố định, không "Nên dùng", không xếp theo tỷ lệ | K1-23 |
| Q9 | Mini Test là **kết quả cuối** của PA bổ trợ sau Cuối khoá: PA có `nhom_bo_tro` mà chưa có kết quả tuần, và `mini_test.ty_le` đã ghi → kết quả = "Tiến bộ" (≥ 70 %) / "Không tiến bộ" (< 70 %). Tính ở `shapePlan` (`effectiveness.ts:244`), **một chỗ** | T61, K1-24; tránh dồn vào "chưa ghi kết quả" |
| Q10 | P9b: cột **"Học viên"** (em khác nhau) cạnh "Số PA"; **"Thời gian thường mất" = trung vị** (thay trung bình, `tuanTrungBinh` → `tuanTrungVi`); hàng có PA chạy chồng thời gian với PA khác của cùng Case ghi chữ nhỏ "k PA chạy cùng PA khác". P9: dòng ngữ cảnh "Fast Track · Monbay · 8 tuần" dưới tiêu đề; chân bảng thêm "n PA chưa rõ nơi học lúc làm PA" (`planOutcomesUnattributed`, `effectiveness.ts:290`). Thanh tỷ lệ + "PA đã xong chưa ghi kết quả": **đã có**. P12: thanh tự vẽ (`HieuQuaPa.tsx:35-40`) đổi sang `<TyLe>` | Pb2-23/09 |
| Q11 | **Nhận định xu hướng** ở Điểm đáng chú ý: **hoãn**. Khối thuộc Tổng quan (VAI-a); kiểm kê (d) Câu 2 khuyên thêm xu hướng khi có 2–3 tháng dữ liệu thật | ghi "Chuyển cho PR khác" |
| Q12 | P4 cột khung Lớp thường: **Bài kiểm tra** · nhóm **Giữa khoá** `Đạt hết · 1 môn trượt · ≥ 2 môn trượt` · nhóm **Cuối khoá** `Dưới 50% · 50–59% · 60–69% · Từ 70%` (`daiCuoiKhoa`, `cuoiKhoa.ts:22`) · **Chưa đủ điểm** · nhóm **Mini Test** `Đạt · Trượt` · nhóm Xử lý giữ nguyên. Mỗi bài rơi đúng một cột kết quả (Σ = Bài). Dòng không có bài loại đó → ô "—". Mini Test gắn vào dòng của **bài Cuối khoá sinh ra nó** (`tu_attempt_id`), đếm học viên | K1-19 |
| Q13 | `nhap_dau_ngay` = **ngày nghiệp vụ** (`demoToday()`) lần đầu ô có điểm. Sửa sau không đổi. Ô **mất hết điểm** (Huỷ điểm, Thi lại, xoá tay — cùng nhánh `matHet`, `attempts.ts:1662`) → về NULL (bài mới). Dấu "-" không đặt | "lần sửa không tính"; ngày nghiệp vụ để demo và giờ VN đúng |
| Q14 | `han_xu_ly` = hạn **lúc vi phạm thành "Cần xử lý" lần đầu** (lấy từ `trangThaiYThuc`, không chép luật). Không ghi đè, trừ khi em **Quay lại học** mà vi phạm chưa có phản hồi (T65: hạn dừng khi Tạm dừng). `phan_hoi_ngay` = ngày nghiệp vụ lần đầu GVCN **xác nhận xử lý** (`xacNhanXuLy`) hoặc **gửi đề xuất** (`guiDeXuat`) có vi phạm đó. Đúng hạn ⇔ `phan_hoi_ngay ≤ han_xu_ly` | mockup 25 "thời gian chờ Quản lý duyệt không tính"; mốc thời gian đang có là giờ máy, không phải ngày nghiệp vụ |
| Q15 | Gán người: **ô điểm** → phân công hiệu lực ở **hạn nhập** (qua `kyNangPhuTrach`, `normal.ts:~137`) · **kết quả / HV tiến bộ** → phân công hiệu lực ở **tuần thi** · **vi phạm** → GVCN của `violations.class_id` hiệu lực ở hạn xử lý (không có lớp → không tính, `ponytail:`) · **Ghi kết quả PA, PA hiệu quả** → người phụ trách Case (`sos_cases.owner_user_id`) | mockup 25 "lúc tới hạn", "lúc thi"; PA theo Case GV phụ trách |
| Q16 | "PA hiệu quả" vào khoảng theo **đúng luật `planOutcomes`** (ngày kết thúc PA), để ô = Hiệu quả PA lọc GV + cùng khoảng | một hàm cho hai nơi |
| Q17 | "Đang dạy" là ngữ cảnh: phân công hiệu lực ở **min(cuối khoảng, hôm nay)**. Bấm → hồ sơ GV (mockup). Khoảng đã qua thì số có thể khác hồ sơ GV (hôm nay) — chú thích nổi nói rõ | mockup "Ngữ cảnh, không phải chỉ số" |
| Q18 | Khoảng mặc định: **4 tuần gần nhất tới tuần hiện tại**. Tối đa **13 tuần** (máy chủ trả 400). "Theo tháng" = các tuần có ngày Thứ Năm thuộc tháng (`owningMonthOf`, `week.ts:29`) | mockup "Đã duyệt" 7 |
| Q19 | Phần trăm = `Math.round(100·n/m)`; màu tính **từ chính số làm tròn đó** (đỏ < 50, vàng 50–69, xanh ≥ 70) để chữ và màu không lệch. Dưới 5 mục: "mẫu nhỏ", không màu. Chữ % **12 px** (Q31-4, thay 11,5 px của mockup) | Q31-9, Q31-4 |
| Q20 | Loại khỏi "Chấm điểm": vắng đã xác nhận, huỷ, "không có bài" (`-`), MT lịch sử, ô chưa tới hạn mà chưa nhập, em đang **Tạm dừng** (`students.status != 'active'`, cùng luật UXF-a Q9). Loại khỏi "Kết quả": em **KCK** (không có kỳ vọng, `luotKck`). "HV tiến bộ" vẫn tính em KCK (so điểm, không so kỳ vọng) | Q31-7; UXF-a Q9 |
| Q21 | "HV tiến bộ": bài trước = **lượt MT gần nhất trước đó** của em (theo tuần thi) **có điểm kỹ năng đó**, ở bất kỳ lớp nào. Tiến bộ ⇔ band cao hơn. W1, W2 so riêng | mockup 25 định nghĩa |
| Q22 | Bấm "Kết quả" / "HV tiến bộ": các mục đến từ **một lớp** → `/hoc-vien/lop/{id}?tab=phan-tich&ky-nang={khoá}` (tham số mới mở sẵn dòng); **nhiều lớp** → hồ sơ GV khối Kết quả gần nhất. Bấm "Xử lý vi phạm": GVCN một lớp → hồ sơ lớp `?tab=y-thuc`; nhiều lớp → `/phan-tich?goc=y-thuc&cn=` | mockup cột "Bấm số mở" |
| Q23 | FOU gộp: `oPhanCong(ct, kyNang, { tach })`. **Không truyền `tach` = 4 ô như cũ** (máy chủ, `CatalogAdmin.tsx:26`, phép kiểm cũ không đổi). Web mở panel: FOU mà L, R, G+V **cùng một người hoặc trống** → 2 ô; **khác người** → mở sẵn chế độ tách, nút "Gộp" tắt kèm lý do. Web trải ô gộp thành 3 dòng `SlotPhanCong` → **máy chủ không đổi** | Q31-5 "dữ liệu không đổi" |
| Q24 | Hồ sơ GV, bảng lớp thường: lớp **Pre FOU** (một ô Tổng hợp) → một ô kéo hết 4 cột, là ô **duy nhất** có chữ "Tổng hợp" | Pre FOU không chia môn (T56) |
| Q25 | O6: chip bàn giao lấy từ `viecBanGiao(gvId)` (`banGiao.ts:330`, 3 câu) → **cùng số với việc Bàn giao ở Công việc**. Chỉ hiện khi còn dở. GVCN "Bàn giao 3/4 em"; GVBM "Bàn giao môn P · 2/4 em". Bấm → hồ sơ lớp (dải Bàn giao) | một nguồn; Q16 PR-GV |
| Q26 | P6 làm theo **Câu 2 = A** (dự kiến): "vấn đề → loại PA → kết quả" của một GV = **Hiệu quả PA lọc GV**. Hồ sơ GV (Quản lý, Quản trị xem) có link "Hiệu quả PA của {tên} ›". Không thêm khối mới vào hồ sơ GV (mockup 21 đã duyệt không có khối đó) | mockup 25 dẫn "PA hiệu quả" về Hiệu quả PA lọc GV |
| Q27 | Mockup 25 đoạn `.why` màn A còn câu "Thanh màu chỉ có ở ô kết quả" — **cũ**. Theo khối "Đã chốt" 4: **không thanh**, chỉ tô màu chữ % | chủ sản phẩm 01/10 |

## Global Constraints

- **Số khớp:** mỗi cột có **phép kiểm hai đường**. Không thêm đường đếm thứ hai:
  - ô = số dòng panel (Chấm điểm);
  - ô = số của trang được dẫn tới, lọc cùng người + khoảng (PA hiệu quả ↔ Hiệu quả PA `gv=`; Ghi kết quả PA ↔ `metricSet('dung-han-cap-nhat')`);
  - khung `run.ts:9214-9225` (mọi chỉ số `n = ids.length = rows.length`) phải còn xanh.
- **Quyền:** góc nhìn "Giáo viên" chỉ Quản lý (chi nhánh mình) và Quản trị (chọn một chi nhánh), cùng `scopeFor(p, PERMISSIONS.MEETING_VIEW)` như `bangGvChiNhanh` (`hoSo.ts:291`).
  **Phép kiểm PHỦ ĐỊNH:** GVCN, GVBM → 403; QL chi nhánh khác → 403; thiếu chi nhánh → 400; khoảng > 13 tuần → 400.
  Lọc `gv` ở Hiệu quả PA chỉ trong phạm vi người xem.
- **SQL (Turso):**
  - chỉ `?`, không tham số đặt tên;
  - `IN (…)` theo lô ≤ 400 (≤ 900 tham số);
  - UNION ≤ 20 vế;
  - **không N+1 theo GV / lớp / em** — mọi tập nạp một lần cho cả chi nhánh;
  - ghi trong `tx()`, `BEGIN IMMEDIATE` sẵn trong `tx`;
  - ngày nghiệp vụ `demoToday()` / `useNgayNghiepVu().homNay`.
- **Tốc độ:** route mới vào `tests/tocDoDuong.ts` với trần = `max(đo+10, ⌈đo×1.3⌉)`. Đường đổi số câu đo lại. **Không nâng trần cũ quá 30 %**; vượt → Nhật ký, báo planning.
- **Giao diện:**
  - `/ponytail lite`; Be Vietnam Pro, số Inter (`tabular-nums`); token màu, không màu cứng;
  - **mã tuần** `W2 SEP` cho tuần/khoảng (`tuanLich`); ngày chỉ cho hạn nhập, ngày nhập đầu, hạn xử lý (`<Han>` / `ngay()`);
  - **12 px** cho kết quả, hạn, người phụ trách; nhãn nhỏ 11–11,5 px (`Nhan`);
  - lớp thường **không SOS**; FT không "n/16";
  - không KPI, không xếp hạng, không hàng tổng, không nút sắp theo số;
  - không mã thô trên màn (`ca-hai`, `preset`, `nhom_bo_tro`).
- **Phép kiểm:**
  - tạo `server/src/tests/prPb2.tests.ts` (`runPrPb2Tests(t)`, đăng ký **cuối** `run.ts` sau `runPrS5fbTests` :9807, theo mẫu `prCt.tests.ts:4`);
  - ngày demo 14/09/2026 (`seed/data.ts:15`, Thứ Hai tuần W3 SEP);
  - phép kiểm cũ có `'ca-hai'` (55 chỗ: `phanTich`, `prDuyet`, `prGv`, `prMon`, `prYt4`, `tongQuan`) **sửa** kỳ vọng sang `null`/`'ft'`, không xoá;
  - **tổng số phép kiểm không giảm**.
- **Không bớt** (CLAUDE.md): kiểm dữ liệu nhập, quyền, chống mất dữ liệu. `ponytail:` được phép, liệt kê trong thân PR.

## Hướng dẫn riêng cho phương án B (Fable)

1. Task 1 đổi **kiểu** `ChuongTrinh`. Chạy `npx tsc -p .` sau khi đổi hằng rồi sửa **theo danh sách lỗi**. Đừng tìm bằng mắt.
2. Không "sửa cho khớp" bằng cách chỉnh một phía cho bằng con số phía kia. Hai đường **gọi chung một hàm**. Không làm được như vậy → ghi Nhật ký, dừng.
3. Không tự đổi luật chấm đạt, luật SOS, luật Ý thức (`shared/domain/yThuc.ts`). Chỉ **đọc** chúng; tách hàm dùng chung thì giữ nguyên thân.
4. Bảng giáo viên: viết **máy chủ + phép kiểm** (Task 8) xanh hết rồi mới vẽ web (Task 9).

## Task 0 · Chuẩn bị

- [ ] Kiểm model thật (dòng hệ thống / `Co-Authored-By` mặc định). Không phải **Opus 5.5** → dừng, báo chủ sản phẩm.
- [ ] Worktree `.claude/worktrees/pr-pb2-phan-tich-giao-vien` từ `origin/main`; `/ponytail lite`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm chính + tốc độ) vào Nhật ký.
- [ ] Đọc nguồn:
  - kiểm kê (c) làn C + dòng B1–B5 ghi Pb2;
  - đặc tả §3.1g, §3.1h;
  - mockup 25 (đủ, cả bảng "Định nghĩa từng cột"), mockup 21 màn A, B, E;
  - `K1.md` §4(b);
  - `HOP_DONG_SO_LIEU.md` §1–2;
  - mã: `shared/domain/tongQuan.ts:1-60`, `phanTich.ts` (cả file), `worklist/chuongTrinh.ts`, `worklist/metrics.ts:196-250, 340-370`,
    `phanTich/tongHop.ts`, `phanTich/hieuQuaPa.ts`, `cases/effectiveness.ts:200-300`, `classes/phanTichLop.ts:35-130`,
    `giaoVien/hoSo.ts`, `yThuc/trangThai.ts`, `shared/domain/yThuc.ts:120-215`, `fasttrack/attempts.ts:1600-1700`, `normal/regular.ts:505-560`,
    `shared/domain/phanCong.ts`, `classes/ClassCreatePanel.tsx:55-80, 180-225`, `classes/TeacherAssignPanel.tsx:40-130`.
- [ ] Commit `PR-Pb2 (0): kế hoạch + mốc {B}`.

## Task 1 · Bỏ "Cả hai" toàn web (T60, K1-07, K1-18, K5-43, Q31-1)

**Files:** `shared/domain/tongQuan.ts:12-23, 126` · `shared/domain/phanTich.ts:102-111, 150-167, 180, 226-240` ·
máy chủ `worklist/metrics.ts:357-358` · `worklist/chuongTrinh.ts:15, 98-101` · `worklist/highlights.ts:63, 70, 83` · `worklist/bangChiNhanh.ts:64` ·
`phanTich/tongHop.ts:97` · `phanTich/vanDeHv.ts:76` · `phanTich/yThucPhanTich.ts:46, 60` · `giaoVien/hoSo.ts:51, 54, 94, 101, 226, 300` ·
`routes/index.ts:573, 601, 617, 632, 651, 1121, 1524, 1534, 1547, 1554` ·
web `worklist/ChonChuongTrinh.tsx` · `OverviewPage.tsx:64-69, 87` · `BranchPulse.tsx:44, 72, 101` · `Highlights.tsx:39-61` · `MetricTiles.tsx:12` ·
`KhoiCanXuLy.tsx:17` · `ui/SoLieu.tsx:28` · `phanTich/PhanTich.tsx:29, 80-86, 106, 133` · `phanTich/dungChung.tsx:24` · `phanTich/TongHopTestSos.tsx:78, 120` ·
`giaoVien/BangGiaoVienChiNhanh.tsx:26, 31` · 6 file phép kiểm cũ.

Hiện trạng:
- `CHUONG_TRINH = ['thuong', 'ft', 'ca-hai']`; vắng `ct` = Cả hai (`tongQuan.ts:12-23`).
- Nút "Cả hai" ở Tổng quan và Phân tích (`ChonChuongTrinh.tsx`).
- Test (Lịch Test, Kế hoạch Test) **đã** hai khung (`ui/CongTacKhung.tsx`) → **đã có, bỏ**.

```ts
// shared/domain/tongQuan.ts
export const CHUONG_TRINH = ['ft', 'thuong'] as const;
export type ChuongTrinh = (typeof CHUONG_TRINH)[number];
export const CHUONG_TRINH_LABEL: Record<ChuongTrinh, string> = { ft: 'Fast Track', thuong: 'Lớp thường' };
/** Q31-1: tham số `ct`. Vắng / lạ / `ca-hai` của link cũ → `macDinh` (Quản lý: FT). */
export function chuongTrinhTuThamSo(s: string | null | undefined, macDinh: ChuongTrinh = 'ft'): ChuongTrinh {
  return s === 'thuong' || s === 'ft' ? s : macDinh;
}
/** Khối gộp (Q2): `null` = không lọc khung. */
export const thamSoCt = (ct: ChuongTrinh | null, dau: '?' | '&' = '&'): string => (ct ? `${dau}ct=${ct}` : '');
```
- [ ] **Phép kiểm trước** (khối 1):
  - `chuongTrinhTuThamSo(null)`, `('ca-hai')`, `('xyz')` → `'ft'`; `('thuong')` → `'thuong'`.
  - `metricSet` (QL MB):
    - chỉ số học thuật (`case-mo`, `bai-qua-han-nhap-diem`) với `program: 'ft'` ⊂ không lọc;
    - `ft` ∪ `thuong` = tập không lọc (không mất phần tử có lớp);
    - chỉ số Ý thức (`hv-can-xu-ly`, `vi-pham-tong`) **bằng nhau** với `ft`, `thuong`, `null` (Q2).
  - `/phan-tich/y-thuc` có `ct=ft` và không `ct` → cùng số (gộp).
  - `/giao-vien/{gv}` (hồ sơ GV) không `ct` → có cả lớp FT lẫn lớp thường (`lopCuaGv` gộp).
  - **Quét chuỗi**: không còn `'ca-hai'` / `"Cả hai"` trong `shared/`, `server/src/` (trừ `tests/`), `web/src/` — trừ chú thích lịch sử có chữ "đã bỏ".
- [ ] Shared:
  - hằng + hai hàm ở trên;
  - `kyNangTheoCt` bỏ nhánh Cả hai; `NHAN_NHOM_KY_NANG`, `DONG_TU_KY_NANG`, `COT_LUOT.nhan` bỏ khoá `'ca-hai'`;
  - chú thích :102, :109, :226, `tongQuan.ts:126` sửa theo.
- [ ] Máy chủ:
  - `metricSet` :357: `const ct = CHI_SO_GOP.has(id) ? null : f.program ?? null; if (!ct) return r;` với
    `CHI_SO_GOP = new Set<string>([...YTHUC_METRIC_IDS, ...PHOI_HOP_METRIC_IDS])` đặt ngay trong `worklist/metrics.ts`
    (hai danh sách đã import ở :195-196, gốc `yThuc/thongKe.ts:31`, `yThuc/phoiHop.ts:442`);
  - `locTheoChuongTrinh` bỏ nhánh `'ca-hai'`;
  - `highlights`, `bangChiNhanh`, `tongHop`, `vanDeHv` nhận `ChuongTrinh`; `yThucPhanTich` nhận `ChuongTrinh | null`;
  - `hoSo.ts`: `locKhung = (ct: ChuongTrinh | null, k) => ct === null || ct === k`, mặc định `null` ở `lopCuaGv`/`caseMoCuaGv`;
    `oHoSoGv` đọc `ct` **tuỳ chọn** (vắng = gộp); `bangGvChiNhanh` đọc `chuongTrinhTuThamSo(q.ct)` (Tổng quan luôn gửi `ct`);
  - `routes`: đường theo kỹ năng dùng `chuongTrinhTuThamSo`. `/metrics/:id` :1121 và `/phan-tich/y-thuc` :632 dùng "có `ct` hợp lệ thì lọc, vắng thì gộp"
    (hàm nhỏ `ctTuyChon` cạnh `chuongTrinhTuThamSo`).
- [ ] Web:
  - `ChonChuongTrinh` hai nút, **Fast Track trước**; `setCt` luôn ghi `ct` lên URL;
  - Phân tích: góc Ý thức **ẩn** công tắc khung, ô Lớp liệt kê mọi lớp;
  - `OverviewPage.tsx:87` GV `LichSapToi ct={null}`;
  - `BranchPulse.tsx:72` bỏ chip khung (hết trường hợp Cả hai);
  - `SoLieu.tsx:28` `thamSoCt(phamVi?.chuongTrinh ?? null)`.
- [ ] Sửa kỳ vọng 55 chỗ `'ca-hai'` trong 6 file phép kiểm (không xoá phép kiểm).
- [ ] `tocDoDuong`: `/tong-quan/quan-ly`, `/highlights`, `/tong-quan/chi-nhanh` đo lại (số câu không được tăng).
- [ ] `npm run check` → commit `PR-Pb2 (1): bỏ "Cả hai" — hai khung Fast Track · Lớp thường, khối Ý thức vẫn gộp`.

## Task 2 · Bỏ "Danh sách Case" + chuyển hướng (T59, K1-27; P8b bỏ)

**Files:** `shared/domain/phanTich.ts:19-70` (`GOC_NHIN`, `gocNhinTuThamSo`, `thamSoXoaKhiDoiGoc`) · `shared/domain/dieuHuong.ts:144-185` (`duongMoi`) ·
`shared/domain/tongQuan.ts:84-89` (`denLoc`) · `web/src/App.tsx:16, 124` · `web/src/modules/cases/CaseBoardPage.tsx` (xoá `CaseBoard`, `DanhSachCase`, `QueueTile`;
`CaseRoutePage` :246-263 → chuyển hướng) · `web/src/modules/phanTich/PhanTich.tsx:6-7, 32-33, 97-102, 113-114, 134-135, 155-171` ·
`web/src/modules/phanTich/DanhSachBoQuen.tsx` (xoá) · `web/src/modules/worklist/OverviewPage.tsx:4, 106` (import `PhanTich` thẳng) · `KhoiCanXuLy.tsx:44` ·
máy chủ `worklist/metrics.ts:85, 94, 127` · `students/profile.ts:190-198` · `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx:340, 343`.

Hiện trạng:
- `GOC_NHIN` còn `'danh-sach'` (`phanTich.ts:19`).
- Có `hang-doi`/`tinh-hinh`/`ky-nang` là suy về Danh sách Case (`:41, :52`).
- `/hoc-thuat/case/:id` là trang riêng (`App.tsx:124`).
- `KhoiCanXuLy.tsx:44` điều hướng tới `?goc=danh-sach&hang-doi=`.

- [ ] **Phép kiểm trước:**
  - `duongMoi` (hàm thuần), từng dòng Q4:
    - `/phan-tich?goc=danh-sach&cn=2&ct=ft` → `/phan-tich?goc=van-de&cn=2&ct=ft`;
    - `/phan-tich?ky-nang=reading` → `goc=van-de`;
    - `/phan-tich?hang-doi=due&cn=2` → `/cong-viec?nhom=case-hoc-thuat&loc=qua-han&nguoi=tat-ca&cn=2`;
    - `/phan-tich?hang-doi=can-ho-tro-2-lan&cn=2` → `/?cn=2`;
    - `/?tab=tinh-hinh&ky-nang=listening` → thẳng `/phan-tich?goc=van-de` (**một bước**);
    - mọi đích: `duongMoi(đích) === null`.
  - `gocNhinTuThamSo`: `goc=danh-sach` không còn là góc nhìn; không bao giờ trả `'danh-sach'`.
  - Máy chủ: `rowsFor('case', …)` và dòng Case của `/students/:id/profile` không còn `href` `/hoc-thuat/case/` khi Case có em.
  - **Quét chuỗi**: không còn `goc=danh-sach`, `DanhSachCase` ở `web/src`, `shared`.
- [ ] Shared:
  - `GOC_NHIN` bỏ `'danh-sach'` (Task 8 thêm `'giao-vien'` vào cuối);
  - `thamSoXoaKhiDoiGoc` luôn xoá ba tham số cũ;
  - `duongMoi` thêm luật Q4 cho `p === '/phan-tich'` và sửa nhánh `/?tab=tinh-hinh`;
  - `CAN_XU_LY` bỏ `denLoc` (Q6), bỏ trường `denLoc` khỏi kiểu.
- [ ] Web:
  - `PhanTich.tsx` bỏ nhánh `danh-sach` + chip "Học viên cần chú ý" + `laHienTrang`;
  - `OverviewPage` import `PhanTich` (bỏ vỏ `CaseBoard`);
  - `CaseRoutePage` có `student.id` → `<Navigate replace to={duongHoSoHocVien(id, { caseId })}>`; không có em → giữ `NganCase` như cũ (Q5);
  - `KhoiCanXuLy.tsx:44` bỏ nhánh `denLoc`;
  - xoá `DanhSachBoQuen.tsx`.
- [ ] Máy chủ: `href` Case ở `metrics.ts:85,94,127` và `profile.ts:190-198` dùng `duongHoSoHocVien(sid, { caseId })` khi có em.
  Route `/cases` còn nơi khác gọi thì giữ; route **chỉ** Danh sách Case gọi (kiểm bằng grep web) → xoá cùng phép kiểm cũ của nó (sửa, không để đỏ).
- [ ] `npm run check` → commit `PR-Pb2 (2): bỏ Danh sách Case — đường dẫn cũ chuyển về Vấn đề HV, Công việc, hồ sơ HV`.

## Task 3 · Hiệu quả PA: tách "quy chế" / "GV thêm", lọc GV + khoảng tuần (T61, K1-23, P9, P9b, P12) — impeccable `clarify`

**Files:** `server/src/cases/effectiveness.ts:207-259` (`queryPlans`, `shapePlan`), `:290` · `server/src/phanTich/hieuQuaPa.ts` (cả file) ·
`shared/domain/phanTich.ts:305-330, 383-390` (`tuanTrungVi`, kiểu kết quả) · `routes/index.ts:614-628` · `web/src/modules/phanTich/HieuQuaPa.tsx` ·
`web/src/modules/phanTich/PhanTich.tsx` (chip Giáo viên / khoảng) · `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx` (link P6).

Hiện trạng:
- "Nên dùng" áp chung mọi PA (`hieuQuaPa.ts:95-104`, `HieuQuaPa.tsx:46`).
- `queryPlans` chưa lấy `preset`, `nhom_bo_tro`, người phụ trách Case, mức SOS.
- Thời gian = trung bình (`tuanTrungBinh`, `phanTich.ts:321`).
- PA huỷ vì "không cần theo dõi" đã ngoài mẫu số (`status = 'completed'`, `effectiveness.ts:234`) → **đã có**, chỉ thêm phép kiểm.

```ts
// hieuQuaPa.ts — MỘT hàm cho Hiệu quả PA (lọc gv) và cột "PA hiệu quả" của bảng giáo viên (Task 8)
export type LocPa = { branchIds: number[] | null; ct: ChuongTrinh; classId?: number | null; tu: string; den: string | null; gv?: number | null };
export function paCoKetQua(l: LocPa): (Plan & { quyChe: boolean; chuCase: number | null; sos: number | null; boTroSau: boolean })[];
```
- [ ] **Phép kiểm trước:**
  - Hai phần tách đúng: PA `preset = 1` (gồm `bo_tro`) chỉ ở `quyChe`; `preset = 0` chỉ ở `gvThem`;
    `quyChe` không dòng nào `nenDung = true`; Σ Số PA hai phần = số PA có kết quả trong phạm vi.
  - PA huỷ "không cần theo dõi" **không** vào Số PA **và không** vào "chưa ghi kết quả".
  - Mini Test (Q9): PA bổ trợ nhóm `mt:X`, Mini Test 75 % → nhóm "success"; 60 % → "không tiến bộ"; chưa ghi Mini Test → vẫn "chưa ghi kết quả".
  - `tuanTrungVi([7, 14, 70])` = 2; `([])` = null.
  - Lọc `gv`:
    - tổng "PA do GV thêm" với `gv=X` = số PA `preset = 0` có Case do X phụ trách;
    - **phủ định**: `gv` là người chi nhánh khác → rỗng, không lộ số.
  - `tu`/`den`: khoảng tuần cho ra đúng tập `planOutcomes({ fromDate, toDate })`.
  - Hai đường: `oHieuQuaPa` mỗi ô = số của ô, cả hai phần.
- [ ] Máy chủ:
  - `queryPlans` thêm `iv.preset, iv.nhom_bo_tro, iv.moc_quy_che, sc.owner_user_id, sc.sos_level` + kết quả Mini Test (một `LEFT JOIN mini_test` theo `nhom_bo_tro`);
  - `shapePlan` suy kết quả từ Mini Test (Q9);
  - `hieuQuaPa` trả `{ gvThem: {…như cũ}, quyChe: { hang, tomTat } }`: hàng quy chế theo Q8, cùng `dongOf` nhưng **không** `nenDung`;
  - Q10: cột `hocVien` (em khác nhau), `tbTuan` → trung vị, `dongThoi` (PA chồng thời gian với PA khác cùng Case, `ponytail:` chỉ xét PA đã có kết quả trong phạm vi);
  - chân bảng `chuaRoNguon = planOutcomesUnattributed(scope).length` + dòng `o` tương ứng;
  - route đọc `gv`, `tu`, `den` (tuần Thứ Hai; `tu`/`den` thắng `tg`; kiểm ≤ 52 tuần như cũ).
- [ ] Web `HieuQuaPa` (**clarify**):
  - hai khối "PA do giáo viên thêm" (trước, có "Nên dùng") và "PA theo quy chế" (câu dẫn một dòng: "PA bắt buộc theo quy chế — không so, không xếp hạng");
  - cột "Học viên";
  - "Thời gian thường mất" (chú thích nổi: "trung vị, từ ngày bắt đầu tới ngày ghi kết quả");
  - thanh → `<TyLe>`;
  - dòng ngữ cảnh `{khung} · {chi nhánh} · {khoảng}`;
  - chip **"Giáo viên: {tên} ✕"** và **"W1 SEP – W4 SEP ✕"** khi có `gv`/`tu`.
- [ ] P6 (Q26): hồ sơ GV — Quản lý, Quản trị xem — đầu khối "Case đang phụ trách" thêm link **"Hiệu quả PA của {tên} ›"** → `/phan-tich?goc=hieu-qua-pa&cn={cn}&gv={id}`. GV tự xem: không hiện (không có Phân tích).
- [ ] `tocDoDuong`: `/phan-tich/hieu-qua-pa`, `?tg=26` đo lại; thêm `?gv={gv}&tu=…&den=…`.
- [ ] `npm run check` → commit `PR-Pb2 (3): Hiệu quả PA tách PA quy chế / PA giáo viên thêm; lọc giáo viên và khoảng tuần; trung vị`.

## Task 4 · Tổng hợp Test lớp thường: Giữa khoá theo môn, Cuối khoá 4 dải, Mini Test (P4, K1-19) — impeccable `clarify`

**Files:** `shared/domain/phanTich.ts:150-240` (`NhomCot`, `COT_KET_QUA_THUONG`, `cotTongHopFor`, `nhomCotLabel`) · `server/src/phanTich/tongHop.ts:81-240` (`tinh`) ·
`web/src/modules/phanTich/TongHopTestSos.tsx` (hàng đầu đề hai tầng, ô "—") · `shared/domain/phanTich.ts:406-432` (`bangXuatTongHop` — Excel theo cột mới).

Hiện trạng:
- Khung lớp thường dùng cột "1 môn trượt / 2 / ≥ 3 môn trượt" cho **cả** Giữa lẫn Cuối khoá (`phanTich.ts:197-206`).
- Không có dải % tổng, không có Mini Test.

- [ ] **Phép kiểm trước:**
  - Lớp thường, lớp MB BE 04 + MB FOU 21 (`lt2bSeed`, `ctSeed`):
    - mỗi bài rơi **đúng một** cột kết quả: `gk-dat + gk-1 + gk-2 + ck-duoi50 + ck-50 + ck-60 + ck-dat + chuaDu = luot` ở mọi dòng và dòng Tổng;
    - bài Cuối khoá 44 % → `ck-duoi50`, 57 % → `ck-50`, 66 % → `ck-60`, 82 % → `ck-dat` (cùng `daiCuoiKhoa`);
    - Giữa khoá trượt 1 môn → `gk-1`.
  - Mini Test: em có Mini Test 75 % → `mini-dat` ở **dòng của bài Cuối khoá gốc**; bấm ô → đúng em đó (`oTongHop`).
  - Khung FT: cột **không đổi** (quét `cotTongHopFor('ft')` như cũ).
  - Dòng chỉ có bài Giữa khoá → `coDot.cuoi = false` (web vẽ "—").
  - Em KCK ngoài mẫu số như cũ.
- [ ] Shared: cột lớp thường theo Q12. Thêm trường `nhomCon: 'giua' | 'cuoi' | 'mini'` cho đầu đề hai tầng (không thêm `NhomCot` mới — menu "Cột hiện" giữ 3 nhóm).
  Tooltip mỗi cột một câu (**clarify**), ví dụ "Cuối khoá · 50–59 %: Quản lý cân nhắc ở panel Chuyển lớp".
- [ ] Máy chủ `tinh`:
  - lượt `ratio`: `kind === 'progress'` → đếm môn trượt từ `ev.skills`; `kind === 'final'` → `daiCuoiKhoa(tyLeTong)` (không viết lại ngưỡng);
  - chưa đủ điểm → `chuaDu`;
  - Mini Test: **một câu** theo lô `SELECT … FROM mini_test WHERE tu_attempt_id IN (…) AND ty_le IS NOT NULL` → gắn `mini-dat`/`mini-truot` theo `NGUONG_MINI_TEST` (xuất hằng từ `cuoiKhoa.ts:404`, không gõ lại 0,7);
  - mỗi dòng trả `coDot: { giua, cuoi }`.
- [ ] Web: đầu đề hai tầng "Giữa khoá (theo môn)" · "Cuối khoá (% tổng)" · "Mini Test"; ô không áp dụng "—" (`text-faint`); Excel xuất cùng cột.
- [ ] `tocDoDuong`: `/phan-tich/tong-hop?ct=thuong` đo lại (**+1 câu cố định**).
- [ ] `npm run check` → commit `PR-Pb2 (4): Tổng hợp Test lớp thường — Giữa khoá theo môn, Cuối khoá 4 dải, Mini Test`.

## Task 5 · Dữ liệu mới: ngày nhập đầu ô điểm, hạn xử lý chốt + ngày phản hồi vi phạm (migrate)

**Files:** tạo `server/src/migrate/prPb2.ts` · `server/src/migrate.ts:24, 483` · `server/src/schema.sql` (cuối `assessment_scores` :669-706, cuối `violations` :1604-1628) ·
`server/src/fasttrack/attempts.ts:1655-1685` (`saveScore`) · `server/src/normal/regular.ts:530-546` · `server/src/yThuc/trangThai.ts` (hàm mới `chotHanXuLy`) ·
`server/src/yThuc/violations.ts:194-260` (`recordViolation`), `:286-340` (`editViolation`) · `server/src/yThuc/xuLy.ts:125` (`xacNhanXuLy`), `:416` (`guiDeXuat`) ·
`server/src/duyet/loaiYeuCau.ts:331` (từ chối đề xuất) · `server/src/students/students.ts:~298` (Quay lại học) · `server/src/seed/seed.ts` (bù dữ liệu **chỉ seed**).

Hiện trạng:
- `assessment_scores` chỉ có `entered_at` — ghi đè **mỗi lần sửa**, giờ máy (`attempts.ts:1657`, `regular.ts:536`).
- Hạn xử lý vi phạm chỉ **suy ra lúc xem** (`trangThaiViPham`, `shared/domain/yThuc.ts:183`); mốc "Cần xử lý" = `batBuocTu` :156.
- Cột xác nhận nguyên nhân lần đầu: **không cần** (cột đã bỏ, mockup 25 "Đã chốt" 2).

```ts
// migrate/prPb2.ts — chỉ cấu trúc, chạy lặp được, lần hai không báo gì
const COT: [bang: string, cot: string, lyDo: string][] = [
  ['assessment_scores', 'nhap_dau_ngay', 'Ô điểm: ngày nhập đầu (tính chấm đúng hạn; sửa sau không đổi)'],
  ['violations', 'han_xu_ly', 'Vi phạm: hạn xử lý chốt lúc thành "Cần xử lý"'],
  ['violations', 'phan_hoi_ngay', 'Vi phạm: ngày GVCN xác nhận xử lý hoặc gửi đề xuất lần đầu'],
];
export function migratePrPb2(conn: any, applied: string[]) {
  for (const [bang, cot, lyDo] of COT) {
    if ((conn.prepare(`PRAGMA table_info(${bang})`).all() as any[]).some((c) => c.name === cot)) continue;
    conn.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} TEXT`);
    applied.push(lyDo);
  }
}
```
- [ ] **Phép kiểm trước:**
  - Migrate:
    - lần một thêm 3 cột, lần hai rỗng;
    - DB dựng từ `schema.sql` → rỗng;
    - cột **giống hệt** (tên, kiểu, thứ tự) — mẫu `prCt.tests.ts:129-150`.
  - `nhap_dau_ngay`:
    - nhập L lần đầu ngày D → `nhap_dau_ngay = D`;
    - sửa ngày D+3 (có lý do) → vẫn D, `entered_at` đổi;
    - Huỷ điểm → NULL; nhập lại D+5 → D+5;
    - dấu "-" → NULL;
    - lớp thường (`saveRegularScore`) cùng luật.
  - `han_xu_ly`:
    - ghi vi phạm thứ 3 trong cửa sổ → cả 3 có `han_xu_ly` = `trangThaiYThuc(...).viPham.get(id).han`;
    - ghi thêm vi phạm thứ 4 → 3 cái cũ **không đổi**;
    - em Tạm dừng rồi Quay lại, vi phạm chưa phản hồi → hạn tính lại theo mốc Quay lại;
    - vi phạm đã phản hồi → giữ.
  - `phan_hoi_ngay`:
    - `guiDeXuat` → vi phạm liên kết có ngày = hôm nay (ngày nghiệp vụ);
    - đề xuất bị từ chối rồi gửi lại → giữ ngày đầu;
    - `deXuat` (nháp) → không đặt.
  - **Phủ định**: đánh dấu vi phạm không chính xác (`valid = 0`) → không bao giờ có trong tập "Xử lý vi phạm" (Task 8).
- [ ] Máy chủ:
  - migrate + `schema.sql` (ba cột ở **cuối** hai bảng) + đăng ký `migratePrPb2` ngay sau `migratePrCt` (:483);
  - `saveScore`/`saveRegularScore`: `nhap_dau_ngay = hasValue ? COALESCE(cũ, demoToday()) : NULL` (Q13);
  - `chotHanXuLy(conn, studentIds, { ghiDe })` ở `trangThai.ts`: đọc `trangThaiYThuc` **không qua bộ nhớ request** (xoá khoá `yt4:` của các em đó trước khi đọc), `UPDATE violations SET han_xu_ly = ?` cho vi phạm `can_xu_ly`/`qua_han` (`lyDoQuaHan = 'xu-ly'`) có `han`, `han_xu_ly IS NULL` (hoặc `ghiDe` và `phan_hoi_ngay IS NULL`); gọi trong cùng `tx` ở 4 chỗ ghi;
  - `phan_hoi_ngay`: `UPDATE … WHERE id IN (vi phạm liên kết) AND phan_hoi_ngay IS NULL` ở `xacNhanXuLy` và `guiDeXuat`;
  - seed (không phải migrate): cuối `runSeed` bù `nhap_dau_ngay` cho ô có điểm, gọi `chotHanXuLy` cho em có vi phạm, bù `phan_hoi_ngay` từ lần xử lý — để demo có số ngay.
- [ ] `tocDoDuong`: đường ghi vi phạm, `guiDeXuat`, lưu điểm (nếu có trong danh sách) đo lại (+ ≤ 2 câu).
- [ ] `npm run check` → commit `PR-Pb2 (5): migrate — ngày nhập đầu ô điểm, hạn xử lý chốt và ngày phản hồi vi phạm`.

## Task 6 · Lớp FOU hai giáo viên: phân công 2 ô + "Tách từng môn" (Q31-5) — impeccable `adapt`

**Files:** `shared/domain/phanCong.ts:4-15` (`OPhanCong`, `oPhanCong`) + hàm mới `slotsTuO`, `nenTachFou` · `shared/domain/normal.ts:131-134` (`kyNangGoiY` — **chỉ đọc**, gộp ở nơi gọi) ·
`web/src/modules/classes/ClassCreatePanel.tsx:63-73` (ô + slots), `:186-222` (`LuoiPhanCong`: gợi ý ô gộp) · `web/src/modules/classes/TeacherAssignPanel.tsx:47-62, 108-113` ·
**không đổi:** `server/src/classes/classes.ts:921-992` (`kiemTruocPhanCong`, `ghiPhanCong`, `setClassTeachers`), `classes/intake.ts:606-637`, `platform/CatalogAdmin.tsx:26`.

Hiện trạng:
- FOU luôn 4 ô môn + GVCN (`oPhanCong`, `phanCong.ts:11-15`).
- Một người nhận nhiều ô **đã được phép** (`kiemPhanCong` chỉ chặn hai người một môn, `:35`).
- GVCN phải dạy ≥ 1 môn (`:38-39`).

```ts
export type OPhanCong = { khoa: string; skill: string | null; laGvcn: boolean; nhan: string; gop?: readonly string[] };
/** Q31-5: FOU mặc định 2 ô "L · R · G+V" và "P". Không truyền `tach` = 4 ô như cũ (máy chủ, Danh mục, phép kiểm cũ). */
export function oPhanCong(ct: string | null, kyNangLop: readonly string[], o: { tach?: boolean } = { tach: true }): OPhanCong[];
/** Ô gộp trải thành một dòng mỗi môn — máy chủ nhận đúng dạng cũ. */
export function slotsTuO(oList: readonly OPhanCong[], chon: Record<string, number | ''>): SlotPhanCong[];
/** L, R, G+V đang có người KHÁC nhau → phải tách (không gộp được). */
export function nenTachFou(ct: string | null, bySkill: readonly { skill: string; userId: number }[]): boolean;
```
- [ ] **Phép kiểm trước:**
  - `oPhanCong('FOU', 4 môn, { tach: false })` → 3 ô: GVCN · `L · R · G+V` (gộp `listening, reading, writing`) · `P`;
  - `oPhanCong('FOU', …)` (mặc định) → 5 ô như cũ; BE, ELE, FT với `tach: false` → **không đổi**; Pre FOU → một ô GVCN;
  - `slotsTuO` ô gộp chọn người 7 → 3 dòng `listening/reading/writing` người 7;
  - `kiemPhanCong` với kết quả đó → không lỗi; GVCN = người 7 → đủ luật "GVCN dạy ≥ 1 môn";
  - `nenTachFou`: L = 7, R = 7, G+V trống → false; L = 7, R = 9 → true;
  - Máy chủ `PUT /classes/{MB FOU}/teachers` với slots đã trải → `teacher_assignments` có đúng 1 GVCN + 4 dòng môn (L, R, W, S), **không** thêm dạng dữ liệu mới;
  - phép kiểm cũ `prLop.tests.ts:50-69, 166-180`, `prMon.tests.ts:59` xanh, không sửa.
- [ ] Shared: như trên. Lỗi `kiemPhanCong` theo môn (`listening`…) hiện ở ô gộp chứa môn đó.
- [ ] Web:
  - Tạo lớp / Sửa phân công, lớp FOU: mặc định 2 ô (`nenTachFou` → true thì mở sẵn chế độ tách);
  - link chữ nhỏ **"Tách từng môn"** / **"Gộp L · R · G+V"** dưới lưới (12 px, `link`); nút Gộp tắt khi đang khác người, `title` "L, R, G+V đang do nhiều người dạy";
  - gợi ý ô gộp = người khai **một trong** L / R / W1 / W2 (hợp `kyNangGoiY` của từng môn);
  - câu dưới lưới: "Lớp FOU thường có hai giáo viên: một người L · R · G+V, một người P".
- [ ] **adapt** 375 px: lưới 2 ô không tràn; link ≥ 44 px vùng bấm.
- [ ] `npm run check` → commit `PR-Pb2 (6): lớp FOU phân công hai ô L · R · G+V và P, có Tách từng môn`.

## Task 7 · Hồ sơ GV: 4 cột cố định lớp thường, vai "GVCN · L R G+V", chip bàn giao (Q31-6, Q31-5, O6) — impeccable `clarify`

**Files:** `server/src/giaoVien/hoSo.ts:41-83` (`LopGv.vai`), `:152-193` (`HoSoGv.lop[].banGiao`) · `shared/domain/hoSoGiaoVien.ts` (`nhanVaiLop`) ·
`web/src/modules/giaoVien/HoSoGiaoVienPage.tsx:153-155` (`VaiChip`), `:162-225` (KhoiLop), `:289-315` (bảng lớp thường), `:335-345` (link P6 — Task 3) · `server/src/classes/banGiao.ts:330` (**chỉ gọi**).

Hiện trạng:
- Bảng lớp thường một đầu đề "Môn · đạt / có điểm", mỗi ô có nhãn môn (`HoSoGiaoVienPage.tsx:295-307`).
- Viền xanh ô môn mình dạy: **đã có** (`MON_CUA_MINH` :57) → bỏ.
- Vai = nhiều chip rời `GVCN` `L` `R` `G+V` (`hoSo.ts:71-72`).
- Chip bàn giao: chưa có.

- [ ] **Phép kiểm trước:**
  - `nhanVaiLop({ gvcn: true, mon: ['L','R','G+V'] })` = `GVCN · L R G+V`; `({ gvcn: false, mon: ['P'] })` = `P`; `({ gvcn: true, mon: [] })` = `GVCN`.
  - Hồ sơ GV của GVCN MB FOU 22 (`ctSeed` — lệnh ra hôm qua, 3/4 môn đã ghi):
    - lớp có `banGiao = { loai: 'gvcn', da: 0, n: 4 }` = đúng số của việc "Bàn giao n em · MB FOU 22" ở `/my-work` của người đó (hai đường, cùng `viecBanGiao`);
    - GVBM P lớp đó: `{ loai: 'gvbm', mon: 'P', da: …, n: … }` = việc "Bàn giao môn P".
  - Lớp không có lệnh → không có `banGiao`.
  - `ketQuaHoSoGv` lớp thường: `o[].dong` ∈ `listening/reading/writing/speaking` (Pre FOU: `tong_hop`).
- [ ] Máy chủ:
  - `lopCuaGv` trả `vai: string` = `nhanVaiLop(...)` (giữ `monDay`);
  - `hoSoGiaoVien` gọi `viecBanGiao(gvId)` **một lần**, gắn theo `lopId` (+3 câu cố định).
- [ ] Web (**clarify**):
  - bảng lớp thường: đầu đề `L` · `R` · `W (G+V)` · `S (P)` (chú thích nổi "BE, ELE: Writing, Speaking. FOU: Grammar + Vocabulary, Pronunciation"), ô **chỉ số**, xếp theo khoá cố định;
  - Pre FOU một ô kéo 4 cột (Q24);
  - vai một chip `GVCN · L R G+V`;
  - chip bàn giao 12 px cạnh mã lớp, link hồ sơ lớp;
  - thẻ 375 px (`TheDong`) giữ nhãn môn theo chương trình (thẻ một lớp — mockup 21 màn E).
- [ ] `tocDoDuong`: `/giao-vien/{gv}` đo lại (+≤ 3 câu).
- [ ] `npm run check` → commit `PR-Pb2 (7): hồ sơ GV — lớp thường 4 cột cố định, vai GVCN · L R G+V, chip Bàn giao n/m em`.

## Task 8 · Bảng Phân tích giáo viên — máy chủ (Q30-5, Q31-9)

**Files:** tạo `shared/domain/phanTichGv.ts` · tạo `server/src/phanTich/giaoVien.ts` · `server/src/classes/phanTichLop.ts:88-122` (tách `danhGiaMon` dùng chung) ·
`server/src/phanTich/hieuQuaPa.ts` (`paCoKetQua`, Task 3) · `server/src/worklist/metrics.ts` (**gọi** `metricSet('dung-han-cap-nhat')`, `parseObligation`) ·
`shared/domain/phanTich.ts:19-27` (`GOC_NHIN` + `'giao-vien'`, nhãn "Giáo viên") · `shared/domain/cases.ts` (`baiId` — của UXF-a) · `routes/index.ts` (2 route) · `tests/tocDoDuong.ts`.

```ts
// shared/domain/phanTichGv.ts
export const TOI_DA_TUAN_GV = 13;
export type OPtGv = { k: 'na' } | { k: 'rong' } | { k: 'so'; dung: number; tong: number };
export type HangPtGv = {
  id: number; ten: string;
  /** "R · W1 · W2 · GVCN MB FT 103" — môn theo tên ngắn của chương trình, GVCN kèm mã lớp (mockup 25). */
  phu: string;
  dangDay: { lop: number; hv: number };
  chamDiem: OPtGv; ghiKetQuaPa: OPtGv;
  xuLyViPham: OPtGv & { lopGvcn?: number[] };
  paHieuQua?: OPtGv;                                        // chỉ FT
  ketQua: Record<string, OPtGv & { lop?: number[] }>;       // FT: listening reading writing1 writing2 speaking · thường: listening reading writing speaking
  tienBo?: OPtGv & { lop?: number[] };                      // chỉ FT
};
export type PhanTichGvKq = { cn: number; tenChiNhanh: string; ct: ChuongTrinh; tu: string; den: string; hang: HangPtGv[] };
/** Khoảng: `thang=YYYY-MM` → các tuần có Thứ Năm thuộc tháng; `tu`,`den` (Thứ Hai) → ≤ 13 tuần; vắng → 4 tuần tới tuần hiện tại (Q18). */
export function khoangPtGv(q: { tu?: string | null; den?: string | null; thang?: string | null }, homNay: string): { tu: string; den: string } | { loi: string };
/** "18/20" + "90%" · dưới 5 mục "mẫu nhỏ" · "—" · "không có". */
export function chuOPtGv(o: OPtGv): { so: string | null; phu: string | null };
/** Q19: màu từ % đã làm tròn; < 5 mục → null. Chỉ ô kết quả dùng. */
export function mauKetQuaGv(dung: number, tong: number): 'thap' | 'vua' | 'cao' | null;
```

Mỗi cột một hàm tập (máy chủ), nạp một lần cho cả chi nhánh + khung + khoảng, trả `Map<gvId, { dung: number[]; tong: number[] }>`:

| Cột | Hàm | Một mục (id) | Đúng / đạt | Nguồn đang có |
|---|---|---|---|---|
| Chấm điểm | `tapChamDiem` | `baiId(attemptId, skill)` | `nhap_dau_ngay ≤ hạn`; chưa nhập mà `hôm nay > hạn` = trễ | `skillCells` / `regularSkillViews` (hạn, tiến độ) + `loadBundle`, như `scoreDebt.ts:70-92` |
| Ghi kết quả PA | `tapGhiKetQuaPa` | id nghĩa vụ | `numeratorIds` | `metricSet(p, 'dung-han-cap-nhat', { branchId, program, from, to })` → `parseObligation` → Case → người phụ trách |
| Xử lý vi phạm | `tapXuLyViPham` | `violations.id` (`valid = 1`, `han_xu_ly` trong khoảng) | `phan_hoi_ngay ≤ han_xu_ly`; chưa phản hồi mà `hôm nay > hạn` = trễ; chưa tới hạn → không tính | cột Task 5 + GVCN hiệu lực |
| PA hiệu quả (FT) | `paCoKetQua({ … })` lọc `!quyChe` | id PA | nhóm "success" | Task 3 |
| Kết quả môn (L…S) | `tapKetQuaMon` | `baiId` của ô có điểm | `danhGiaMon` (FT: band ≥ kỳ vọng; thường: môn ≥ 70 %) | tách từ `phanTichLop.ts:94-121` |
| HV tiến bộ (FT) | `tapTienBo` | `baiId` | band > band bài trước (Q21) | điểm các lượt MT trước của cùng em (một câu theo lô) |
| Đang dạy | `dangDay` | lớp · em | — | `teacher_assignments` hiệu lực + `enrollments` (như `bangGvChiNhanh` :305-321) |

- [ ] **Phép kiểm trước** (seed demo + dữ liệu dựng trong phép kiểm):
  - Luật thuần:
    - `khoangPtGv({ thang: '2026-09' })` = W1 SEP – W4 SEP (31/08 – 21/09);
    - 14 tuần → `loi`; vắng → 4 tuần tới tuần 14/09;
    - `chuOPtGv` bốn dạng;
    - `mauKetQuaGv(12, 21)` → vàng (57 %), `(8, 21)` → đỏ, `(13, 17)` → xanh, `(3, 4)` → null.
  - **Chấm điểm, hai đường**:
    - ô `n/m` của GV X = số dòng `/phan-tich/giao-vien/cham-diem?gv=X` (m) và số dòng "Trễ" (m − n);
    - ô nhập đúng hạn rồi sửa sau hạn → vẫn đúng hạn;
    - ô quá hạn chưa nhập → trễ; ô tuần sau chưa nhập → không có mặt;
    - vắng / "-" / huỷ / MT lịch sử / em Tạm dừng → không có mặt;
    - GV đổi phân công giữa khoảng: ô gán theo người **ở hạn nhập**;
    - chéo UXF-a: tập "chưa nhập & trễ" ⊇ `noDiemCuaGv(...).filter(overdue)` (quy về `baiId`) với lớp đang dạy trong khoảng.
  - **Ghi kết quả PA**: Σ `tong` các GV + nghĩa vụ của Case không người phụ trách = `metricSet('dung-han-cap-nhat').n` cùng khoảng (không mất, không trùng).
  - **Xử lý vi phạm**:
    - chỉ GVCN của lớp vi phạm có mục; GVBM → `{ k: 'na' }`;
    - gửi đề xuất trước hạn, QL duyệt sau hạn → **đúng hạn**.
  - **PA hiệu quả**: ô = `hieuQuaPa({ gv, tu, den, ct: 'ft' }).gvThem.tomTat` (cùng số PA, cùng số cải thiện).
  - **Kết quả**:
    - GV L lớp MB FT 101: ô L = số em có điểm L ở bài có tuần thi trong khoảng;
    - GV dạy R không có cột L → `na`;
    - em đã chuyển lớp vẫn tính cho người dạy lúc thi;
    - em KCK không tính.
  - **HV tiến bộ**: em MT2 L 6.0, MT1 L 5.5 → tiến bộ; em chỉ có MT1 → không có mặt.
  - Lớp thường: không có `paHieuQua`, `tienBo`; `ketQua` đúng 4 khoá; FOU G+V nằm khoá `writing`.
  - Hàng sắp theo tên (`localeCompare('vi')`); không hàng tổng; GV không có phân công trong khung + khoảng → không có hàng.
  - **Phủ định quyền**: GVCN / GVBM → 403; QL CP xem `cn` = MB → 403; Quản trị không `cn` → 400; khoảng 14 tuần → 400.
  - **Không N+1**: số câu SQL của `/phan-tich/giao-vien` **bằng nhau** khi chi nhánh có thêm 3 GV + 2 lớp (dựng trong phép kiểm).
- [ ] Máy chủ:
  - `danhGiaMon(a, scores, prog, mucTieu)` tách nguyên thân từ `phanTichLop` (`phanTichLop` gọi lại nó — một luật);
  - `phanTichGiaoVien(p, f)` + `oChamDiemGv(p, f & { gv })` (dòng panel: học viên, lớp · bài · kỹ năng, tuần thi, hạn, ngày nhập đầu, số ngày trễ; trễ trước rồi lớp, tên);
  - quyền như `bangGvChiNhanh:291-295`;
  - `baiId`: dùng của UXF-a (bảng file chồng);
  - routes `GET /phan-tich/giao-vien`, `GET /phan-tich/giao-vien/cham-diem` (đặt cạnh các route Phân tích :577-660).
- [ ] `tocDoDuong`: thêm `QL`/`QT` × `/phan-tich/giao-vien?cn={cn}&ct=ft`, `…&ct=thuong&thang=2026-09`, `/phan-tich/giao-vien/cham-diem?cn={cn}&ct=ft&gv={gv}`; `GVCN` `maChuDich: 403`. Trần theo công thức.
- [ ] `npm run check` → commit `PR-Pb2 (8): bảng Phân tích giáo viên — máy chủ, mỗi cột một hàm tập, không N+1`.

## Task 9 · Bảng Phân tích giáo viên — web (mockup 25 màn A–D) — impeccable `clarify`, `layout`, `adapt`

**Files:** tạo `web/src/modules/phanTich/PhanTichGiaoVien.tsx` · `web/src/modules/phanTich/PhanTich.tsx` (góc nhìn "Giáo viên", bộ lọc khoảng riêng) ·
`web/src/modules/classes/PhanTichLopTab.tsx:21-23` (tham số `ky-nang` mở sẵn dòng) · `web/src/modules/classes/ClassOverviewPage.tsx:33, 98` (truyền tham số).

- [ ] Khung:
  - hàng góc nhìn thêm **"Giáo viên"** ở cuối (chỉ người có `nav.analysis`, cùng quyền máy chủ);
  - bộ lọc riêng:
    - Chi nhánh (Quản trị bắt chọn; thiếu → `Empty` "Chọn một chi nhánh");
    - Khung (công tắc Task 1);
    - Khoảng: `Theo tuần` `ChonTuan` từ – đến · `Theo tháng` `ChonThang` + mã tuần phụ (`ui/ChonNgay.tsx:40, 55`);
  - ẩn `tg` và ô Lớp;
  - tham số URL `tu`, `den` | `thang`.
- [ ] Bảng FT (1440) đúng mockup màn A:
  - cột Giáo viên dính trái (tên → `/giao-vien/{id}`, dòng phụ `phu`) · Đang dạy · nhóm **Đúng hạn** (Chấm điểm · Ghi kết quả PA · Xử lý vi phạm) · PA hiệu quả · nhóm **Kết quả môn mình dạy** L R W1 W2 S · HV tiến bộ;
  - ô `n/m` trên, `%` 12 px dưới (hoặc "mẫu nhỏ"); "—" / "không có" màu `text-faint`;
  - **chỉ % ô kết quả** tô `text-bad` / `text-soon` / `text-ok` (token có sẵn; không thanh — Q27);
  - chú giải một dòng như mockup;
  - không nút sắp, không hàng tổng.
- [ ] Bảng lớp thường màn B: nhóm Đúng hạn với "Ghi kết quả PA" **mờ** (`text-slate-400`, đầu đề chữ thường), Kết quả 4 cột `L · R · W (G+V) · S (P)`.
- [ ] Đầu đề 2–3 chữ + **chú thích nổi** (**clarify**, chữ đúng cột "Một mục là" / "Tử số" của mockup):
  - component nhỏ trong file: `tabIndex=0`, `aria-describedby`, hiện khi rê chuột **và** khi Tab tới (`group-hover` + `group-focus-within`);
  - không dùng `title` một mình.
- [ ] Bấm số (bảng "Bấm số mở" của mockup, Q22):
  - Đang dạy → `/giao-vien/{id}`;
  - **Chấm điểm → panel** (`KhungPanel`) màn C: công tắc `Tất cả n · Trễ k`, dòng trễ trước, tick SVG 12 px, "Trễ 3 ngày" / "chưa nhập · tới hôm nay 01/10", "sửa 26/09 · lần sửa không tính", chân "Mở Lịch Test ›";
  - Ghi kết quả PA → `/cong-viec?nguoi={id}&nhom=case-hoc-thuat&khung={ct}&cn={cn}`;
  - Xử lý vi phạm → hồ sơ lớp `?tab=y-thuc` / `/phan-tich?goc=y-thuc&cn=`;
  - PA hiệu quả → `/phan-tich?goc=hieu-qua-pa&cn=&ct=ft&gv=&tu=&den=`;
  - Kết quả / HV tiến bộ → `/hoc-vien/lop/{id}?tab=phan-tich&ky-nang={khoá}` hoặc `/giao-vien/{id}`.
- [ ] `PhanTichLopTab`: `useState(params.get('ky-nang'))` mở sẵn dòng đó + cuộn tới; khoá lạ bỏ qua.
- [ ] **adapt** 375 px (màn D):
  - mỗi GV một `TheDong`;
  - dòng không áp dụng **ẩn** (không "—");
  - số bấm được như bảng;
  - không cuộn ngang trang.
- [ ] **layout**: `table-layout: fixed`, cột thẳng, `tabular-nums`, bảng cuộn ngang trong khung (`table-scroll`) ≥ 1000 px, cột tên dính trái (mỗi nhóm một bảng nếu cần — memory "bẫy sticky").
- [ ] `npm run check` → commit `PR-Pb2 (9): bảng Phân tích giáo viên — web, panel Chấm điểm, bấm số mở trang đã lọc, thẻ 375`.

## Task 10 · Dữ liệu demo cho bảng giáo viên (D18)

**Files:** tạo `server/src/seed/pb2Seed.ts` · `server/src/seed/seed.ts` (gọi `buildPb2Demo` sau `buildCtDemo`, trước phần bù Task 5) · `DEMO.md` (chỉ **một mục** kịch bản D18 — nội dung, không viết lại tài liệu).

- [ ] Dựng qua **chính hàm nghiệp vụ** (như `ctSeed.ts`: `createClass`, `saveScore`, `recordViolation`, `guiDeXuat`…). Chỉnh ngày bằng SQL khi cần. Chi nhánh MB, tuần W1 SEP – W3 SEP:
  - 5–7 GV FT có đủ dạng ô: đúng hạn, trễ, **sửa sau hạn nhưng lần đầu đúng hạn**, quá hạn chưa nhập, "mẫu nhỏ" (< 5), "—", "không có";
  - kết quả đủ ba màu (đỏ, vàng, xanh);
  - một GVCN có vi phạm xử lý đúng hạn và trễ;
  - PA GV thêm có kết quả cuối;
  - **một lớp FOU hai GV**: một người L · R · G+V kiêm GVCN, một người P (Q31-5) — người P dạy thêm một lớp FOU khác (như mockup 25 màn B).
- [ ] **Phép kiểm trước**:
  - bảng MB FT tháng 09/2026 có ≥ 5 hàng, có ít nhất một ô mỗi dạng (`so` ≥ 5 mục, `so` < 5, `na`, `rong`), ba màu kết quả;
  - bảng lớp thường có lớp FOU hai GV;
  - `/phan-tich/giao-vien/cham-diem` của một GV có ≥ 1 dòng trễ và 1 dòng "sửa sau".
- [ ] `npm run check` → commit `PR-Pb2 (10): demo bảng Phân tích giáo viên (D18) + lớp FOU hai giáo viên`.

## Task 11 · Bấm thử theo vai, 1440 + 375, sáng/tối — impeccable `audit` + `polish`, `/ponytail-review`, mở PR

- [ ] Cổng gộp `origin/main` (nếu UXF-a / VAI-b đã merge) → gỡ theo bảng file chồng → `npm run check`. UXF-a đã merge: bỏ bản `baiId` chép (nếu có), giữ một.
- [ ] Chạy mục **KIỂM** theo vai QL (Nguyễn Khánh Vy id 2), Quản trị (id 1), GVCN lớp FOU, GVBM. Ảnh `thiet-ke/anh/pr-pb2/{muc}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] impeccable **`audit`** trên các màn đã chạm, rồi **`polish`** (sáng **và** tối). Kiểm:
  - cỡ chữ Q31-4 (kết quả / hạn / người 12 px);
  - mã tuần;
  - màu % chỉ ở ô kết quả;
  - chú thích nổi mở được bằng Tab;
  - không "Cả hai", không "Danh sách Case" ở bất kỳ đâu.
- [ ] `/ponytail-review`; liệt kê mọi `ponytail:` mới trong thân PR.
- [ ] Quét: không còn `npm run check` treo; tắt 4177/5377.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - bảng mục (mã → ảnh trước/sau → đạt);
  - mốc B → số phép kiểm cuối;
  - trần tốc độ mới / đổi;
  - migrate (3 cột);
  - "Chuyển cho PR khác";
  - `ponytail:`;
  - ghi rõ "**merge trước PR-VAI-a**".

## Câu hỏi cho chủ sản phẩm

- **Câu 1 — Tách PR-Pb2 làm hai?**
  - A. **Pb2-a** (bỏ "Cả hai", bỏ Danh sách Case, Hiệu quả PA tách hai phần, Tổng hợp lớp thường — không migrate) mở và merge **trước**. **Pb2-b** (dữ liệu mới, FOU 2 GV, hồ sơ GV, bảng Phân tích giáo viên, demo) mở sau đó.
  - B. Một PR 12 Task như kế hoạch.
  - **Khuyên A**:
    - VAI-a cần `tongQuan.ts` ổn định sớm;
    - 12 Task có bảng cỡ L + migrate là quá một phiên;
    - hai phần gần như không chung file.
  - Kế hoạch viết đủ cho cả hai cách.
- **Câu 2 — P6 "hồ sơ GV theo kỹ năng" (mockup 06d cũ) làm thế nào?**
  - A. Dùng **Hiệu quả PA lọc theo giáo viên** (vấn đề → loại PA → kết quả của GV đó). Hồ sơ GV có link "Hiệu quả PA của {tên} ›" cho Quản lý. Không thêm khối vào hồ sơ GV.
  - B. Thêm khối "theo kỹ năng" kiểu 06d vào hồ sơ GV (cần mockup mới trước khi code).
  - **Khuyên A**: mockup 21 đã duyệt không có khối này; mockup 25 đã dẫn "PA hiệu quả" về Hiệu quả PA lọc GV. Kế hoạch theo A (Q26).

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Giao kèo Pb2 để lại |
|---|---|---|
| Tổng quan theo vai dựng trên kiểu mới; xoá dòng "cần hỗ trợ 2 lần Test" + `boQuen.ts` + `/phan-tich/bo-quen` + `LOAI_BO_QUEN` (U3) | **PR-VAI-a** | `ChuongTrinh = 'ft' \| 'thuong'`, gộp = `null`, `chuongTrinhTuThamSo(s, macDinh)`, `CHI_SO_GOP`; `CAN_XU_LY` không còn `denLoc` |
| Nhận định xu hướng ở Điểm đáng chú ý (Pb2-23/09) — khi có 2–3 tháng dữ liệu thật | **PR-VAI-a** hoặc sau deploy | — |
| Hàng "Chưa phân công" bảng GV chi nhánh (Q31-12), `baiId`, đơn vị "bài" | **PR-UXF-a** | bảng Phân tích GV dùng `baiId` làm id ô |
| Mã tuần ở Vấn đề HV (`vanDeHv.ts:361`), Bỏ quên | **PR-UXF-b** (B5) | — |
| `CaseRoutePage` còn trang cũ cho Case không có học viên — xem có Case nào như vậy sau reset không, nếu không thì xoá | **PR-Dọn** | — |
| `summary.ts:269-308` còn sinh link `/?tab=tinh-hinh…` (đã chuyển hướng đúng) — dọn cùng `summary.ts` | **PR-S3** (đã có trong danh sách dọn) | `duongMoi` giữ luật chuyển |
| Chữ chú thích nổi bảng giáo viên vào `THUAT_NGU_DA_CHOT.md` | **PR-S3** | chữ ở `phanTichGv.ts` / `PhanTichGiaoVien.tsx` |
| `init-ban-chinh` có ba cột mới (schema.sql đã có) · DEMO.md kịch bản D18 đầy đủ | **PR-DEPLOY** | phép kiểm "schema.sql → migrate không làm gì" |

## KIỂM — kịch bản bấm thử

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| 1 | QL | Tổng quan (tab Tổng quan và tab Phân tích) | công tắc khung | chỉ **Fast Track · Lớp thường**, mặc định FT; không có "Cả hai" |
| 2 | QL | Tổng quan › Phân tích › Ý thức | xem | không có công tắc khung; số gộp hai khung |
| 3 | QL | gõ `/phan-tich?goc=danh-sach&cn=2`, `/phan-tich?hang-doi=due`, `/hoc-thuat/case/{id}` | mở | về Vấn đề HV · Công việc lọc Case học thuật quá hạn · hồ sơ HV mở Ngăn Case — không 404, một bước |
| 4 | QL | Phân tích › Hiệu quả PA | xem | hai khối "PA do giáo viên thêm" (có Nên dùng) và "PA theo quy chế" (không Nên dùng); cột Học viên; "Thời gian thường mất"; chân có "chưa rõ nơi học" |
| 5 | QL | Phân tích › Tổng hợp Test + SOS · Lớp thường · Theo đợt | xem, bấm ô Mini Test đạt | đầu đề Giữa khoá / Cuối khoá (4 dải) / Mini Test; ô không áp dụng "—"; bấm ra đúng em |
| 6 | QL | Hồ sơ lớp MB FOU (lớp mới) › ⋮ Sửa phân công | xem, bấm "Tách từng môn" | mặc định hai ô L · R · G+V và P; tách ra 4 ô; lưu hai người → hồ sơ GV đúng vai |
| 7 | QL | Hồ sơ GV (người L · R · G+V kiêm GVCN FOU) | xem | vai `GVCN · L R G+V`; bảng lớp thường đầu đề L · R · W (G+V) · S (P), ô chỉ số, ô môn mình viền xanh; chip "Bàn giao n/m em" nếu có lệnh; link "Hiệu quả PA của …" |
| 8 | QL | Tổng quan › Phân tích › **Giáo viên** · FT · W1 SEP – W3 SEP | xem | sắp theo tên, không tổng, không sắp; ô `n/m` + % 12 px; "mẫu nhỏ"; "—" / "không có"; chỉ % kết quả có màu |
| 9 | QL | như 8 | Tab qua tên cột | chú thích nổi hiện khi rê chuột **và** khi Tab tới |
| 10 | QL | như 8 | bấm ô Chấm điểm một GV | panel Tất cả / Trễ; số dòng = m, "Trễ" = m − n; dòng "sửa … · lần sửa không tính" |
| 11 | QL | như 8 | bấm PA hiệu quả, Ghi kết quả PA, Kết quả L, Xử lý vi phạm | tới Hiệu quả PA có chip Giáo viên + khoảng (số khớp) · Công việc lọc người · hồ sơ lớp tab Phân tích lớp mở sẵn dòng L · hồ sơ lớp tab Ý thức |
| 12 | QL | như 8 · Lớp thường · Theo tháng 09/2026 | xem | Ghi kết quả PA mờ; Kết quả 4 cột; lớp FOU hai GV: người P chỉ có cột S (P) |
| 13 | Quản trị | Phân tích › Giáo viên | chưa chọn chi nhánh | "Chọn một chi nhánh" |
| 14 | GVCN | gõ `/phan-tich?goc=giao-vien`; API `/phan-tich/giao-vien` | mở | không thấy góc nhìn; API 403 |
| 15 | GVBM | Lịch Test | nhập điểm một ô rồi sửa | Phân tích GV (QL xem) ngày nhập đầu giữ ngày đầu |
| 16 | mọi vai | mọi màn trên | 375 px, sáng + tối | bảng giáo viên thành thẻ, không cuộn ngang trang; số `tabular-nums`; mã tuần; hạn qua `<Han>` |

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, model thật, trần tốc độ, lệch kế hoạch, cổng gộp) |
|---|---|---|
| | | |
