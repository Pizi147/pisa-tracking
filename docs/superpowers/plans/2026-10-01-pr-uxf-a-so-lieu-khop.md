# PR-UXF-a · Số liệu khớp + sót lớp thường — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** (1) Sửa lỗi **P0 K2-25**: ở panel Chuyển lớp, Quản lý chọn hướng **khác Web gợi ý** mà không phải ghi lý do. Máy chủ phải tự
kiểm, không tin web. (2) Mọi cặp số nói về cùng một tập thì **bằng nhau**, và **số ở ô = số dòng khi bấm**. Mỗi số ghi rõ đơn vị (**bài** = một
kỹ năng của một em trong một lượt — T53 Q2 · ô điểm · HV · Case · đơn vị). Tuần chưa hết thì chưa quá hạn. Em **Tạm dừng** không sinh nợ điểm.
(3) Vá chỗ sót lớp thường: hậu tố hướng ở Kết quả gần nhất, cột % + Hướng gợi ý ở bảng điểm Cuối khoá, "Thiếu thông tin" sai sau Cuối khoá.
(4) Fast Track **không giới hạn tuần học**: hiện "tuần học thứ n", không mẫu số (chủ sản phẩm 01/10).

**Architecture:** Không bảng mới, **không migrate**. Mỗi con số chỉ có **một hàm trả tập ID**; ô số, bảng và danh sách bấm ra đều gọi hàm đó
(`thiet-ke/HOP_DONG_SO_LIEU.md` §1). Việc chính là **xoá đường đếm thứ hai**:
- `signals.ts` SQL riêng → `metricSet`;
- `overdueScoreAttempts` đếm lượt → đếm bài qua `baiId`;
- cột Case ở roster (SQL thô) → `listCases`;
- `viecHocVienTheoLop` bỏ nhập điểm → nhận nhập điểm cùng nguồn với roster;
- mọi chỗ tự tính "quá hạn" → đọc `viewSkill.overdue`.

Luật thuần mới nằm ở `shared/domain` (`khacGoiY`, `baiId`, `chuTuanHoc`, `coMocTiepTheoThuong`). Phép kiểm ở `server/src/tests/prUxfA.tests.ts`.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); harness `check()` của `run.ts`, chạy `npm run check`.
**Spec:**
- **Nguồn chính:** kiểm kê `docs/superpowers/specs/2026-10-01-kiem-ke-truoc-dot-6.md`, mục (c) làn D, cùng các dòng B1/B2/B3/B4 ghi "UXF"/"UXF-a" thuộc số liệu hoặc lớp thường.
- Đặc tả `2026-09-27-nang-cap-sau-deploy-design.md`:
  - §3.1f: Q30-1, Q30-4, Q30-6 và "chọn khác gợi ý phải ghi lý do ngắn";
  - §3.1g: Q31-1 (không "Cả hai"), Q31-4 (12 px);
  - §3.2 T53 Q2;
  - §7.3 mã tuần;
  - §9 dòng "Chưa phân loại → PR-UXF".
- Kế hoạch UX 26/09, gói **UX-F F1–F7** (`plans/2026-09-26-ux-sau-danh-gia.md:132-146`).
- `specs/2026-09-23-viec-con-lai-sau-deploy.md` §C dòng **G-10**.
- Bảng việc nhỏ `specs/2026-09-29-viec-nho-sau-ra-dot-2.md`.
- `thiet-ke/HOP_DONG_SO_LIEU.md`.
- Mockup 20 màn D, I (đã sửa 01/10: "tuần học thứ 9", lớp đích FT không có tuần).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-UXF-a** · đợt 6 **lượt 1** · làn **D** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-uxf-a-so-lieu-khop` · `.claude/worktrees/pr-uxf-a-so-lieu-khop`, từ `origin/main` @ `86ddaf04` trở đi |
| Cổng thử | API **4187** · Vite **5387**. Song song: VAI-a 4157/5357 · VAI-b 4167/5367 · Pb2 4177/5377. Không dùng 4000/5173 |
| Model | **Opus 5.5 · High** · phương án B: **Fable 5.1 · High**. Đầu phiên, session **tự kiểm model thật**; không phải Opus 5.5 thì **DỪNG**, báo chủ sản phẩm (trừ khi chủ sản phẩm đã chọn B) |
| Người rà | **Opus 5.5**, rà **một lượt cuối đợt 6**. Session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. `Co-Authored-By` ghi đúng model thật |
| Migrate? | **Không.** DB reset trước deploy nên không có lệnh dữ liệu cũ, không lệnh chạy thử. `schema.sql` không đổi |
| Lệnh impeccable | **`/ponytail lite` đầu phiên** (PR có giao diện). **`clarify`** ở Task 2, 6, 7, 9 (nhãn đơn vị, tiêu đề cột) · **`audit`** + **`polish`** (**sáng và tối**) ở Task 11. Không `init`/`document`/`hooks on`. Trước PR: `/ponytail-review` |
| Phụ thuộc | Không chờ PR nào. Chạy song song VAI-a, VAI-b, Pb2 (bảng file chồng dưới). Không cần mockup mới |
| Không làm | Tổng quan theo vai, chuông, Cần xử lý 3 tầng, tên GV ở dòng Nợ (UX-B5) → **PR-VAI-a** · đầu hồ sơ HV, dải Tạm dừng, "tuần học thứ n" ở đầu hồ sơ → **PR-VAI-b** · bỏ "Cả hai", Danh sách Case, bảng Phân tích GV, "lần nhập đầu" → **PR-Pb2** · mã tuần toàn web, R5-x, O1, O2, U5, VN01/26/28 → **PR-UXF-b** · điện thoại → **PR-UXD** · `listCases` COALESCE lệch quyền → **PR-Dọn** |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - chạy `npm run check` **một lần, ở foreground**, log `$env:TEMP\check-uxf-a.log` (tên riêng — `$TEMP` dùng chung giữa các session);
  - xanh, số phép kiểm ≥ mốc B → commit `PR-UXF-a (n): …`.
- Sập segfault → chạy lại **một** lần. Treo > 10 phút → quét `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`, tắt hết, chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai, 1440 và 375, **sáng và tối**, **một lần** ở Task 11:
  - Playwright kênh Chrome; demo `POST /api/demo/session {userId}`;
  - vai tra `tests/tocDo.run.ts:114`;
  - ảnh vào `thiet-ke/anh/pr-uxf-a/`;
  - API `PORT=4187`, Vite tạm 5387 proxy về 4187 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4187/5387, quét `tests/run.js` treo, dọn file tạm.
- **Cổng gộp** khi VAI-a / VAI-b / Pb2 merge, và ở Task 11: `git fetch origin && git merge origin/main` → gỡ theo bảng file chồng → `npm run check` → ghi Nhật ký.

### File chồng với 3 PR song song lượt 1 (kế hoạch của họ chưa có — theo phạm vi kiểm kê (c))

| File | PR khác (dự kiến) | PR-UXF-a sửa | Gỡ |
|---|---|---|---|
| `server/src/cham/canCham.ts` (`noTuanTruoc` :240-300, lịch :446, :546-549) · `web/src/modules/test/lichTest/KhoiNo.tsx` · `lichTest/kieu.ts` `DongNo` | **VAI-a** UX-B5: tên GV nợ trên dòng Nợ | khoá dòng, tuần thi trong ô Đợt, nhóm theo lớp, đơn vị "bài", `soSanhLop`, quá hạn đọc `view.overdue` | khác trường → giữ cả hai. `DongNo` gộp trường (`gvNo` của VAI-a + `tuanThi` của UXF-a) |
| `server/src/worklist/metrics.ts` | **VAI-a** K1-06 (:84-126 danh sách Cần xử lý chỉ đọc), U3 bỏ chỉ số "2 lần Test" · **Pb2** lọc khung | `overdueScoreAttempts` (:388-421), `obligations` (:205-248), `rowsFor` thêm `'bai'` (:96-130) | khác hàm → giữ cả hai. VAI-a xoá chỉ số `hv-can-ho-tro-2-lan` thì giữ phần xoá |
| `shared/domain/metrics.ts` | VAI-a (bỏ U3 :240) · Pb2 (bỏ `ca-hai`) | thêm donVi `'bai'`, đổi donVi của `bai-qua-han-nhap-diem` | union |
| `shared/domain/tongQuan.ts` | **VAI-a** (bố cục theo vai, VN05) · **Pb2** (bỏ `'ca-hai'` :12-18) | **chỉ** chữ đơn vị dòng :94 ("bài") và dòng `dung-han` :139-142 nếu cần | đổi một dòng chữ → giữ luồng của họ, áp lại chữ |
| `server/src/giaoVien/hoSo.ts` (`noDiemCuaGv` :86-90, `oHoSoGv` :254-265, `bangGvChiNhanh` :290-349) · `web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx` | **Pb2**: bảng Phân tích GV (Q31-2), P6, O6, chấm đúng hạn | id bài qua `baiId`, hàng "Chưa phân công", tiêu đề "Bài chưa nhập / Bài quá hạn" | **không đổi chữ ký** 3 hàm. Pb2 gọi `noDiemCuaGv` thì tự nhận đơn vị bài. PR merge sau gộp lại |
| `server/src/phanTich/tongHop.ts`, `server/src/phanTich/vanDeHv.ts`, `shared/domain/phanTich.ts` | **Pb2**: P4 Tổng hợp lớp thường, bỏ `danh-sach`, `ca-hai` | tooltip :233 (một câu); vòng gom `vanDeHv.ts:166-190` | khác khối → giữ cả hai |
| `web/src/modules/worklist/KhoiCanXuLy.tsx`, `OverviewPage.tsx`, `server/src/worklist/tongQuan.ts` | VAI-a, Pb2 (T59 :44) | **không sửa** (K5-52 chuyển VAI-a — Q18) | — |
| `server/src/worklist/mywork.ts` | **VAI-a** (V3, K5-10, V8) | **một** tham số `chiDangHoc` ở lời gọi `listAttempts` (:280, :403) | giữ khối của VAI-a, thêm lại tham số |
| `web/src/modules/congViec/HoTroHocVienTab.tsx`, `shared/domain/congViec.ts` `demLocNhanh` | VAI-a (Công việc, nếu chạm) | một biến `soNhac` dùng chung (F5) | nhỏ → áp lại |
| `shared/domain/hocVienLop.ts` `ketQuaGanNhat` :135-148 | **VAI-b** (ô "Kết quả gần nhất" có thể dùng lại hàm) | hậu tố hướng ở `dong1` | chữ ký giữ → không xung đột logic |
| `tests/run.ts`, `tests/tocDoDuong.ts`, `shared/domain/index.ts`, `routes/index.ts`, `CODE_MAP.md` | cả ba PR | khối phép kiểm **cuối** `run.ts`; chỉ thêm dòng | giữ cả hai, thứ tự theo merge |

`StudentDetailPage.tsx`, `profile.ts`, `Header.tsx`, `PhanTich.tsx`: UXF-a **không sửa**.

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 | "Khác gợi ý": gợi ý `len` khớp `len_lop` **và** `fast_track`; gợi ý `hoc_lai` khớp `hoc_lai`. Gợi ý `null` (50–59 % "Quản lý cân nhắc", hoặc chưa đủ điểm) → không coi là khác. Bảo lưu / Dừng học vẫn bắt lý do như cũ | `HuongGoiY` ghi "'len' = lên bậc kế hoặc sang FT" (`cuoiKhoa.ts:29`). Q30-4: thiếu điểm vẫn chuyển |
| Q2 | Máy chủ **tự tính** `khac_goi_y` từ `cuoiKhoaTheoHocVien`. **Bỏ** trường `khacGoiY` khỏi thân yêu cầu (`dongTuBody`, `suaTuBody`, `DongLenhVao`) | không tin web (P0) |
| Q3 | Hậu tố hướng (K2-01) nằm ở **dòng 1** ("Cuối khoá → học lại"), không dính vào số `58%` | cột số thẳng, `tabular-nums` |
| Q4 | K2-12: sau nhóm **Cuối khoá** thêm cột `%` (FOU/BE/ELE) và cột **Hướng gợi ý** (mọi lớp thường kể cả Pre FOU). Chữ = `goiY.nhanHuong`, 50–59 % = chip "Quản lý cân nhắc" — cùng hàm, cùng chữ với panel Chuyển lớp | một nguồn chữ |
| Q5 | K2-05: em lớp thường có bài **Cuối khoá** (không huỷ) thì **không** bị "thiếu mốc tiếp theo". Việc tiếp theo là lệnh chuyển lớp, không phải mốc | hết khoá không còn mốc |
| Q6 | **Chủ sản phẩm chốt 01/10 (Q31-11):** FT "tuần học thứ n" tính từ **tuần bắt đầu lộ trình của em** (`learning_cycles.start_period_id`), không từ lớp, **bỏ các tuần em Tạm dừng** (lấy từ nhật ký Tạm dừng / Quay lại học, `students/students.ts:~300`; tuần có ngày Tạm dừng tới trước tuần Quay lại). Lớp FT có số tuần riêng của lớp — không dùng lẫn với số của em. Lớp đích FT không hiện tuần. Lớp thường giữ "tuần x/y" của lớp | khớp lịch MT tuần 6/12/16 (`lichMt.ts:24`); mockup 20 màn D, I |
| Q7 | **Bài = ô nhập** (T53 Q2): FT W1 và W2 là hai bài. `baiId(attemptId, skill) = attemptId × 10 + chỉ số kỹ năng` trong `CASE_CATEGORIES` (7 mục, < 10) | một id ổn định cho ô số, bảng GV, hồ sơ GV |
| Q8 | Bài quá hạn của môn **chưa phân công GV** vẫn tính ở Tổng quan. Bảng "Theo giáo viên" thêm hàng **"Chưa phân công"** (khi > 0) → Σ hàng = ô | số khớp; không giấu nợ (xem Câu 2) |
| Q9 | Em **Tạm dừng** (`students.status != 'active'`) không sinh nợ điểm ở: `scoreDebtCells`, Việc, dòng Nợ Lịch Test, badge. Hồ sơ HV vẫn hiện ô điểm | T65 "mọi hạn dừng" |
| Q10 | Quá hạn nhập điểm chỉ khi **tuần thi đã hết** (qua Chủ nhật) **và** qua hạn. Áp cứng cả khi hạn bị đặt đè sớm hơn | T53 Q2 |
| Q11 | Báo cáo đơn vị: "Chưa báo cáo / Đang nhập / Đã nộp" đếm **đơn vị** (khớp bộ lọc bấm ra). `weeksReported` = tuần **đã nộp** / tuần **đã bắt đầu** trong tháng | F4; PR-Ra Q13 |
| Q12 | K1-37: bỏ SQL riêng của `signals.ts`. (b) "bài còn thiếu điểm" → `bai-qua-han-nhap-diem` · (c) "case SOS chưa xử lý xong" → `case-xac-dinh-nguyen-nhan-qua-han` + `pa-can-cap-nhat` · (a) "HV chưa có tuần MT" giữ | sổ chỉ số là một cửa (K1.md:97) |
| Q13 | U7/K3-17: ghi bù N tuần = **N nghĩa vụ trễ**. N = `nhanTuanGhiKetQua(hạn, ngày ghi).soTuan` — cùng hàm với tiêu đề "ghi bù N tuần" | trễ 3 tuần không thành 1 |
| Q14 | Cột kỹ năng FT ở Phân tích › Tổng hợp **giữ** đếm cả lượt Tạm thời; tooltip thêm "Kể cả lượt Tạm thời (chưa đủ điểm)" | khớp Case sinh từ điểm một phần (`sos.ts:286-292`) |
| Q15 | Vấn đề HV: Case không vào được hàng kỹ năng nào → nhóm **"Chưa phân loại"**, không rơi im | §9 đặc tả |
| Q16 | Việc Vận hành: lần **đặt hạn đầu** không phải "đổi hạn". `hanGoc` = hạn đặt đầu; `soLanDoiHan` chỉ đếm dòng `old_value` khác null; lịch sử ghi "Đặt hạn" | G-10 |
| Q17 | Cột Case ở tab Học viên của hồ sơ lớp đếm từ `listCases(p,{classId})` (theo quyền người xem) — cùng nguồn với "n Case đang mở" | G-10 "hai nguồn đếm" |
| Q18 | **K5-52 chuyển PR-VAI-a** (cùng VN05). Cùng dòng `worklist/tongQuan.ts:56`, cùng hàm `demYeuCau`, cùng `KhoiCanXuLy.tsx:90`. PR-DUYET Q8 đã chốt không đưa Chờ duyệt vào sổ chỉ số | một PR sửa một chỗ |
| Q19 | F5: nhắc Phối hợp SOS (không có hạn) chỉ tính ở "Tất cả", không tính ở "Quá hạn"/"Hôm nay". Mọi chip "Tất cả" của tab dùng **một** biến `soNhac` | `khopLocNhanh` (`congViec.ts:37-45`) |
| Q20 | U1: sắp lớp bằng `soSanhLop` ở 6 file kiểm kê + `xuatMt.ts:66,196,202`. `mywork.ts:927` để VAI-a | VAI-a đang sửa mywork |

## Global Constraints

- **Số khớp — luật của PR:** mỗi sửa có **phép kiểm so hai đường**: ô số = số dòng khi bấm = tổng các hàng (hoặc hai màn cùng tên). Không thêm
  đường đếm thứ hai. Có sẵn khung `run.ts:9214-9225` (mọi chỉ số `n = ids.length = rows.length`) — phải còn xanh.
- **Quyền:** mọi đường đổi dữ liệu trả về đều có **phép kiểm PHỦ ĐỊNH**: người ngoài phạm vi không thấy dòng / không bị tính.
  Danh sách bấm ra áp **đúng quyền** của ô số.
- **SQL (Turso):**
  - chỉ `?` — không tham số đặt tên;
  - `IN (…)` qua `theoLo`, ≤ 900 tham số;
  - UNION ≤ 20 vế;
  - **không N+1** — nạp theo lô: `cuoiKhoaTheoHocVien` gọi **một lần/lớp**, nhập điểm theo em dựng một lần/trang;
  - ghi trong `tx()`;
  - ngày nghiệp vụ `demoToday()` / `useNgayNghiepVu().homNay`.
- **Tốc độ:** đường đổi số câu → đo lại trong `tests/tocDoDuong.ts`. Trần mới = `max(sau+10, ⌈sau×1.3⌉)`. **Không nâng trần cũ quá 30 %**; vượt → Nhật ký, báo planning.
- **Giao diện:**
  - `/ponytail lite`;
  - mã tuần `W2 OCT` (`tuanLich`) cho tuần, ngày chỉ cho hạn cụ thể (`<Han>`);
  - **cỡ chữ Q31-4**: kết quả, hạn, người phụ trách **12 px**, nhãn nhỏ 11–11,5 px (`Nhan`);
  - token màu, không màu cứng; cột thẳng, `tabular-nums`, không dồn chữ;
  - không mã thô trên màn (`len_lop`, `tamThoi`).
- **Phép kiểm:**
  - tạo `server/src/tests/prUxfA.tests.ts` (`runPrUxfATests(t)`, đăng ký **cuối** `run.ts`, theo mẫu `prCt.tests.ts:4`);
  - ngày demo 14/09/2026 (`seed/data.ts:15`);
  - phép kiểm cũ đổi kỳ vọng thì **sửa**, không xoá — `tongQuan.tests.ts:232-245` (lượt → bài), `prS5fA.tests.ts:325` (bỏ `khacGoiY: true`);
  - **tổng số phép kiểm không giảm**.
- **Không bớt** (CLAUDE.md): kiểm dữ liệu nhập, quyền, chống mất dữ liệu. `ponytail:` được phép, liệt kê trong thân PR.

## Hướng dẫn riêng cho phương án B (Fable)

1. Task 1 là **P0**: kiểm ở **máy chủ trước**, web sau. Khi thân yêu cầu không có `khacGoiY` mà hướng lệch gợi ý và thiếu lý do, `raLenh` phải trả `failed` "Ghi lý do ngắn".
2. Không "sửa cho khớp" bằng cách chỉnh một phía cho bằng con số phía kia. Luôn cho **hai đường gọi chung một hàm**. Không sửa được như vậy → ghi Nhật ký, dừng.
3. Không tự đổi luật lộ trình, luật SOS, luật Cuối khoá. Chỉ đọc chúng.

## Task 0 · Chuẩn bị

- [ ] Kiểm model thật (dòng hệ thống / `Co-Authored-By` mặc định). Không phải **Opus 5.5** → dừng, báo chủ sản phẩm.
- [ ] Worktree `.claude/worktrees/pr-uxf-a-so-lieu-khop` từ `origin/main`; `/ponytail lite`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** (số phép kiểm chính + tốc độ) vào Nhật ký.
- [ ] Đọc nguồn:
  - kiểm kê (c) làn D;
  - UX-F F1–F7;
  - `HOP_DONG_SO_LIEU.md` §1–2;
  - `lenhChuyen.ts:62-160`, `normal/cuoiKhoa.ts:108-140`, `worklist/metrics.ts:90-130, 200-250, 380-425`, `worklist/scoreDebt.ts`,
    `giaoVien/hoSo.ts:80-100, 250-350`, `worklist/signals.ts`, `worklist/meeting.ts:170-240`, `classes/hocVienLop.ts:100-230`,
    `classes/dongHocVien.ts:60-120`, `classes/classes.ts:295-660`.
- [ ] Commit `PR-UXF-a (0): kế hoạch + mốc {B}`.

## Task 1 · P0 K2-25 — chọn khác Web gợi ý phải ghi lý do (máy chủ kiểm)

**Files:** `shared/domain/chuyenLop.ts` · `server/src/classes/lenhChuyen.ts` · `web/src/modules/classes/TransitionPanel.tsx` ·
tạo `server/src/tests/prUxfA.tests.ts` + đăng ký cuối `run.ts` · `tests/prS5fA.tests.ts:325`.

Hiện trạng:
- `TransitionPanel.tsx:111` gửi cứng `khacGoiY: false`.
- Ô Lý do chỉ hiện với bảo lưu / dừng / chuyển / đổi (`:431`).
- Máy chủ tin `khacGoiY` của thân yêu cầu (`lenhChuyen.ts:113-115`, `dongTuBody :253`).

```ts
/** Q1: hướng Quản lý chọn có KHÁC Web gợi ý (luật Cuối khoá) không. Gợi ý null (chưa đủ điểm / 50–59 % Quản lý cân nhắc) → false. */
export function khacGoiY(huong: HuongLenh | null, goiY: { huong: HuongGoiY } | null): boolean {
  if (!huong || !goiY?.huong) return false;
  return goiY.huong === 'hoc_lai' ? huong !== 'hoc_lai' : !(huong === 'len_lop' || huong === 'fast_track');
}
```
- [ ] **Phép kiểm trước** (khối 1):
  - `khacGoiY` đủ 6 nhánh: Pass + học lại → true · < 50 % + lên → true · 50–59 % + học lại → false · gợi ý null → false · Pass + FT → false · hướng null → false.
  - Máy chủ, lớp **MB BE 04** (seed `lt2bSeed.ts`):
    - `raLenh` QL cho **Tạ Đức Huy (78 %, Pass)** hướng `hoc_lai`, **không** lý do, **không** gửi `khacGoiY` → `failed` "Ghi lý do ngắn";
    - cùng dòng có lý do "Phụ huynh xin học lại" → ok, `lenh_chuyen_lop.khac_goi_y = 1`;
    - thân gửi `khacGoiY: false` **vẫn** bị chặn (**phủ định**: web cũ / API trực tiếp không lách được);
    - **Đặng Minh Khôi (55 %)** học lại không lý do → ok, `khac_goi_y = 0`.
  - `suaLenh` đổi hướng sang lệch gợi ý mà không lý do → 400.
- [ ] Máy chủ:
  - `raLenh`: khi `boiCanh === 'cuoi-khoa'`, gọi `cuoiKhoaTheoHocVien(v.lopNguonId)` **một lần** trước vòng lặp;
  - mỗi dòng dùng `khacGoiY(d.huong, ck.get(sid)?.goiY ?? null)` cho `kiemDongLenh` **và** cột `khac_goi_y`;
  - bỏ `khacGoiY` khỏi `DongLenhVao`/`dongTuBody`/`suaTuBody`/`suaLenh :210` (Q2);
  - `prS5fA.tests.ts:325` bỏ `khacGoiY: true` (lý do đã có).
- [ ] Web `TransitionPanel`:
  - `kiemTra` gọi `khacGoiY(HUONG_CUA[d.kieu], ck?.goiY)`;
  - ô **Lý do \*** hiện thêm khi khác gợi ý, nhãn phụ "khác Web gợi ý" (12 px, `text-slate-400`).
- [ ] Tốc độ: `POST /classes/:id/transition` có trong `tocDoDuong` chưa? Chưa → thêm, đo trần.
- [ ] `npm run check` → commit `PR-UXF-a (1): P0 K2-25 — máy chủ bắt lý do khi chọn khác Web gợi ý`.

## Task 2 · Lớp thường Cuối khoá: hậu tố hướng (K2-01) + cột % và Hướng gợi ý (K2-12) — impeccable `clarify`

**Files:** `shared/domain/hocVienLop.ts` (`ketQuaGanNhat` :135-148) · `server/src/classes/classes.ts` (`classRoster` :295) ·
`web/src/modules/classes/BangDiemLopThuong.tsx` (:55 `coPhanTram`, bảng + thẻ điện thoại).

- [ ] **Phép kiểm trước:**
  - `ketQuaGanNhat` lớp thường Cuối khoá đủ điểm 45 % / 55 % / 64 % / 78 % → `dong1` = `Cuối khoá → học lại` · `→ QL cân nhắc` · `→ lên + bổ trợ` · `→ Pass`;
  - thiếu điểm → không hậu tố; Giữa khoá → không hậu tố.
  - **Hai đường**, lớp MB BE 04: với mọi em, `roster[].cuoiKhoa.tyLe` = `cuoiKhoaTheoHocVien(be04).get(id).tyLe`,
    hậu tố `/hoc-vien-lop` = `goiY.nhanNgan` của cùng hàm, và chữ cột Hướng gợi ý = `goiY.nhanHuong` panel Chuyển lớp đọc (`transitionPlan.students[].cuoiKhoa`).
- [ ] Shared: trong nhánh `ratio` + `attemptKind === 'final'` + đủ điểm + `tyLeTong != null`,
  dùng `goiYCuoiKhoa({ ct, tyLe: k.tyLeTong, monTruot: k.failedSkills.map((f) => f.skill) })?.nhanNgan` và nối vào `dong1` (Q3). Không cần sửa máy chủ.
- [ ] Máy chủ `classRoster` (nhánh `isRatio`): mỗi em thêm `cuoiKhoa: { tyLe, goiY } | null` từ **một** lần `cuoiKhoaTheoHocVien(classId, undefined, { daRoi: finished })`.
- [ ] Web `BangDiemLopThuong`:
  - sau nhóm Cuối khoá thêm cột `%` (FOU/BE/ELE; Pre FOU đã có) và **Hướng gợi ý**;
  - chip "Quản lý cân nhắc" dùng lại đúng lớp chữ của `TransitionPanel.tsx:371` (tách thành `ChipCanNhac` nhỏ nếu dùng 2 nơi);
  - số `%` 12 px `tabular-nums`; thẻ điện thoại thêm một dòng "Hướng gợi ý";
  - **clarify:** tiêu đề cột "% tổng", "Hướng gợi ý", tooltip "Theo luật Cuối khoá — Quản lý quyết ở panel Chuyển lớp".
- [ ] `tocDoDuong`: `/classes/{lopThuong}/roster` đo lại (**+≤ 4 câu cố định**, không theo số em).
- [ ] `npm run check` → commit `PR-UXF-a (2): lớp thường — hậu tố hướng + cột % và Hướng gợi ý Cuối khoá`.

## Task 3 · Hồ sơ lớp / Học viên & Lớp: ba cặp số (K2-05, VN29, cột Case G-10)

**Files:** `shared/domain/hocVienLop.ts` (hàm mới) · `server/src/classes/hocVienLop.ts` (:112, :200-223) · `server/src/classes/classes.ts`
(:365-391 `openCases`, :466-469, :508-510, :595, :632-636, :646-654, :729) · `server/src/classes/dongHocVien.ts` (:63, :67, :114).

Hiện trạng:
- (a) K2-05: hai đường `hasNextMilestone` lớp thường — `so_luot_ke_hoach > 0` (`hocVienLop.ts:221`) và `timeline.some(planned)` (`classes.ts:633`). Em xong Cuối khoá bị "Thiếu thông tin".
- (b) VN29: `viecHocVienTheoLop` truyền `nhapDiem: null` (`dongHocVien.ts:114`). Chip **Cần làm** / **Quá hạn**, `soEmQuaHan`, badge hồ sơ lớp (`classes.ts:729`) không thấy nhập điểm quá hạn, nhưng cột "Việc tiếp theo" của roster (`classes.ts:646-654`) có.
- (c) Cột Case ở tab Học viên đếm bằng SQL thô không lọc quyền (`classes.ts:365-391, 595`); "n Case đang mở" (`:762`) dùng `listCases`.
- (d) FT roster `overdueSkills` (`:510`) đếm mọi ô, không chỉ ô của người xem; `myPending` (`:508`) bỏ `'sat'`.

- [ ] **Phép kiểm trước — hai đường:**
  - (a) em lớp thường đã có Cuối khoá, không lượt planned: `/hoc-vien-lop` **không** có `thieu_tt` **và** roster `missing` không có `next_milestone`. Em chưa có bài nào → cả hai có.
  - (b) GVBM môn L có ô L quá hạn của em X:
    - chip `can-lam` và `qua-han` có X;
    - số `dem['qua-han']` = số dòng khi lọc = badge "n HV quá hạn việc" hồ sơ lớp;
    - **phủ định:** GVBM môn R (không nợ) → X **không** vào `can-lam` vì ô L.
  - (c) với GVBM: Σ cột Case roster = `soCaseMo` đầu hồ sơ lớp. **Phủ định:** Case ngoài quyền người xem không đếm.
- [ ] (a) `coMocTiepTheoThuong({ soLuotKeHoach, coCuoiKhoa })` ở shared; hai nơi gọi (Q5). `hocVienLop.ts:112` thêm một cột con
  `EXISTS(… kind='final' AND status!='cancelled')` trong câu có sẵn — không thêm câu.
- [ ] (b) `viecHocVienTheoLop` nhận `nhapDiemTheoEm: Map<sid, NhapDiemViec>`, dựng **một lần/trang**:
  - nguồn giống roster (`myPendingDetail` của `listAttempts(p, { chiDangHoc: true })`, như `mywork.ts:280,399`);
  - roster dùng cùng hàm dựng → một luật.
  - (d) FT `overdueSkills` chỉ ô `x.viec`, `myPending` gồm `'sat'` như nhánh lớp thường.
- [ ] (c) `openCaseCount` = `listCases(p, { classId }).rows` với `state !== 'done'`, gom theo `studentId`. `handoverCount` giữ luật chu kỳ cũ (Q17).
- [ ] `tocDoDuong`: `/hoc-vien-lop`, `/classes/{lopThuong}/roster`, `/classes/{lopFT}/roster` đo lại.
- [ ] `npm run check` → commit `PR-UXF-a (3): hồ sơ lớp — mốc tiếp theo sau Cuối khoá, nhập điểm quá hạn vào Cần làm, cột Case theo quyền`.

## Task 4 · Fast Track không giới hạn tuần học — "tuần học thứ n" (chủ sản phẩm 01/10)

**Files:** `shared/domain/hienThiNgay.ts` · `server/src/classes/luatLoTrinh.ts` (:357-360 `xemChuyenLop`) · `server/src/classes/transition.ts`
(`students[]` panel FT) · `web/src/modules/students/ChuyenLopPanel.tsx:162` · `web/src/modules/classes/TransitionPanel.tsx` (dòng phụ em FT).

Hiện trạng:
- Máy chủ chỉ trả `tuanHoc` khi lớp có `totalWeeks`. FT `weeks: null` (`normal.ts:164`, `mocChupVaoLop` FT → null), nên FT **không hiện gì**.
- Web ghép `tuần học {tuan}/{tong}`.
- Mockup 20 (sửa 01/10):
  - màn D: `Đang học MB FT 101 · LT1 · tuần học thứ 9`;
  - màn I: dòng em `LT1 · tuần học thứ 9`;
  - lớp đích FT không có tuần.
- Grep `/16`, `n/16`, `tuần học` trong `web/src`, `server/src`, `shared` (01/10): không còn chỗ nào hiện mẫu 16 cho FT. `luatLoTrinh.ts:80` và `transition.ts:138` đã ra null cho lớp FT — giữ.

```ts
/** "tuần học 3/8" (lớp thường, có tổng) · "tuần học thứ 9" (FT — không giới hạn tuần). */
export const chuTuanHoc = (tuan: number, tong: number | null): string => (tong ? `tuần học ${tuan}/${tong}` : `tuần học thứ ${tuan}`);
```
- [ ] **Phép kiểm trước:**
  - `chuTuanHoc(3, 8)` = `tuần học 3/8`; `chuTuanHoc(9, null)` = `tuần học thứ 9`.
  - `xemChuyenLop` em FT `hvlSeed` "Trịnh Bảo Ngọc" (bắt đầu 8 tuần trước ngày demo) → `tuanHoc = { tuan: 9, tong: null }`.
  - Em lớp thường → `tong` = số tuần lớp.
  - `transitionPlan` lớp FT: mọi em có `tuanHoc.tong === null`.
  - Quét chữ: không payload FT nào có `tong: 16`.
  - Em FT bắt đầu 10 tuần trước, Tạm dừng 2 tuần rồi Quay lại → `tuan = 9` (không phải 11).
- [ ] Máy chủ:
  - FT: `tuan = studyWeekOf(tuần bắt đầu lộ trình của em, mondayOf(homNay))` **trừ số tuần Tạm dừng** trong khoảng đó, `tong: null` (Q6);
  - `xemChuyenLop`: một câu (một em);
  - `transitionPlan`: một câu cho cả lớp (JOIN `learning_cycles` + `report_periods` sẵn có).
- [ ] Web: `ChuyenLopPanel.tsx:162` và dòng phụ em ở panel FT dùng `chuTuanHoc`.
- [ ] Báo **VAI-b**: đầu hồ sơ HV dùng `chuTuanHoc` (ghi thân PR, mục Chuyển cho PR khác).
- [ ] `npm run check` → commit `PR-UXF-a (4): FT — "tuần học thứ n", không mẫu số`.

## Task 5 · Bài quá hạn nhập điểm: một đơn vị "bài" (UX-F1, T53 Q2) + em Tạm dừng không nợ (T65)

**Files:** `shared/domain/metrics.ts` (donVi `'bai'`, :76-80) · `shared/domain/tongQuan.ts:94` (chữ) · `shared/domain/cases.ts` (`baiId`) ·
`server/src/worklist/metrics.ts` (`overdueScoreAttempts` :388-421, `rowsFor` :96-130) · `server/src/worklist/chuongTrinh.ts:80` ·
`server/src/worklist/scoreDebt.ts` (:29, :63-68, :83, :90) · `server/src/fasttrack/attempts.ts` (`listAttempts` :577-597) ·
`server/src/giaoVien/hoSo.ts` (:86-90, :254-265, :290-349) · `web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx:19-20` · `tests/tongQuan.tests.ts:232-245`.

Hiện trạng:
- Ô "bài chưa nhập điểm quá hạn" gom về **attemptId** — đơn vị **lượt** (`metrics.ts:405,417`).
- Bảng Theo giáo viên và hồ sơ GV đếm **ô** (`hoSo.ts:343, 89`). Ví dụ 14 ≠ 38.
- Drill hồ sơ GV dùng `attemptId*10+k` theo **thứ tự**, không theo kỹ năng (`hoSo.ts:254-265`).
- `scoreDebtCells` bỏ ô chưa có GV (`:83,90`); `teacherOf` (`:63-68`) không lọc `effective_from/to` như `lopCuaGv`.
- Không lọc em Tạm dừng (`:29`); `listAttempts` cũng không.

- [ ] **Phép kiểm trước — hai đường:**
  - ô `bai-qua-han-nhap-diem` (QL chi nhánh MB): `n = ids.length = rows.length` **và** = Σ `bangGvChiNhanh.quaHan` (gồm hàng "Chưa phân công")
    **và** mỗi hàng GV = số dòng `oHoSoGv(gv, 'qua-han')`.
  - `baiId` ổn định: cùng ô ra cùng id ở ba đường. Ô FT W1 và W2 → hai id.
  - Đơn vị: `rowsFor('bai')` mỗi dòng = một ô, `sub` ghi **tuần thi của môn** (`W2 SEP`), không tuần của lượt.
  - **Phủ định quyền:** GVBM chỉ thấy bài lớp mình; QL chi nhánh khác không thấy.
  - T65:
    - Tạm dừng em có ô quá hạn → ô Tổng quan, bảng GV, hồ sơ GV, Việc (`/my-work`), dòng Nợ Lịch Test **đều giảm đúng 1 bài**;
    - Khôi phục → tăng lại;
    - hồ sơ HV vẫn hiện ô.
  - GV hết hiệu lực phân công (`effective_to` < hôm nay) không được gán bài.
- [ ] Shared:
  - `export const baiId = (attemptId: number, skill: string) => attemptId * 10 + CASE_CATEGORIES.indexOf(skill);`
    kèm `ponytail:` "≤ 10 kỹ năng; thêm kỹ năng thứ 11 thì đổi hệ số". Kỹ năng không có trong danh sách (`indexOf` = −1) → **ném lỗi**, không để trùng id. Lớp thường G+V / P dùng khoá `writing` / `speaking` nên có trong danh sách;
  - donVi `'bai'` nhãn "bài";
  - `bai-qua-han-nhap-diem` donVi `'bai'`;
  - chữ dòng Cần xử lý "n bài chưa nhập điểm quá hạn" giữ.
- [ ] Máy chủ:
  - `overdueScoreAttempts` trả `baiId` của ô quá hạn (đổi tên `overdueScoreBai`);
  - `rowsFor('bai')` dùng chung phần dựng dòng với `oHoSoGv`;
  - `chuongTrinh.ts:80` nhận `'bai'` (tách `Math.floor(id/10)` ra attemptId);
  - `scoreDebt`: `JOIN students s` + `s.status = 'active' AND s.archived_at IS NULL`, `teacherOf` lọc hiệu lực như `lopCuaGv`, giữ ô chưa có GV với `userId: null`;
  - `listAttempts(p, { chiDangHoc })` tuỳ chọn, bật ở Việc (`mywork.ts:280,403`), `canCham.ts:220`, `dashboard.ts:21`;
  - `bangGvChiNhanh`: hàng "Chưa phân công" khi > 0 (Q8).
- [ ] Web `BangGiaoVienChiNhanh`: tiêu đề **"Bài chưa nhập" · "Bài quá hạn"** (**clarify**); hàng "Chưa phân công" chữ mờ, không link hồ sơ.
- [ ] Sửa kỳ vọng `tongQuan.tests.ts:232-245` (lượt → bài), không xoá.
- [ ] `tocDoDuong`: `/tong-quan`, `/metrics/bai-qua-han-nhap-diem?rows=1`, bảng GV chi nhánh, `/my-work` đo lại.
- [ ] `npm run check` → commit `PR-UXF-a (5): bài quá hạn = một ô ở mọi màn; em Tạm dừng không sinh nợ điểm`.

## Task 6 · Một luật quá hạn (UX-F2, T53 Q2) + Lịch Test dòng Nợ (UX-F7 / K4-06) — impeccable `clarify`

**Files:** `server/src/fasttrack/skillSchedule.ts:333-336` · `server/src/platform/week.ts:301-311` · `server/src/fasttrack/attempts.ts`
(:386-390, :687-691, :775) · `server/src/cham/canCham.ts` (:121, :220, :240-300, :446, :525-549) · `server/src/normal/regular.ts:998,1014` ·
`server/src/classes/classes.ts:466-469` · `web/src/modules/test/lichTest/KhoiNo.tsx` (:133, :146-149) · `lichTest/kieu.ts` (`DongNo`).

- [ ] **Phép kiểm trước:**
  - Ngày demo 14/09 (Thứ Hai). Mọi đường sau **đều** không quá hạn với ô tuần **W3 SEP** (tuần đang chạy) và **W1 OCT** (tương lai), **kể cả** ô có hạn đặt đè sớm hơn Chủ nhật tuần thi:
    `skillCells`, `classRoster.overdueSkills`, `canCham` lịch + Nợ, Việc (`urgency`), `bai-qua-han-nhap-diem`.
  - Ô tuần W2 SEP (đã hết), qua hạn → **cả năm** đường là quá hạn.
  - Nợ: lớp FT có MT3 ở hai tuần thi → hai dòng **khác chữ** (`MT3 · W3 SEP` / `MT3 · W4 SEP`).
  - Dòng Nợ nhóm theo lớp (`soSanhLop`); trong lớp: quá hạn trước.
  - `conBai` = số bài (ô) = tổng bài của các dòng.
- [ ] Máy chủ:
  - `viewSkill.overdue` thêm điều kiện **hết tuần thi** (Q10) — một chỗ;
  - mọi bản sao (`attempts.ts:386-390, 687-691, 775`, `canCham.ts:267, 288, 546-549`, `regular.ts:998, 1014`, `classes.ts:466-469`) đọc `view.overdue` / cờ ô, không tự tính lại;
  - `mywork.ts:240-242` (VAI-a đang sửa): chỉ đổi nếu một dòng; không thì ghi "Chuyển cho PR khác".
- [ ] Nợ (`canCham.ts`):
  - `DongNo` thêm `tuanThi` (Thứ Hai tuần thi);
  - sắp theo `soSanhLop` rồi quá hạn → hạn;
  - U1 ở `canCham.ts:121, 299, 446`: `soSanhLop`.
- [ ] Web `KhoiNo`: ô Đợt ghi `MT3 · W3 SEP` (`tuanLich`) ở cả bản rộng lẫn hẹp; bỏ tooltip tuần; đơn vị "n bài" (**clarify**).
- [ ] `npm run check` → commit `PR-UXF-a (6): một luật quá hạn nhập điểm (tuần chưa hết chưa quá hạn); dòng Nợ có tuần thi, nhóm theo lớp`.

## Task 7 · Báo cáo đơn vị: F3, F4, K1-37, `weeksReported` — impeccable `clarify`

**Files:** `server/src/worklist/signals.ts` (:60-126) · `server/src/worklist/meeting.ts` (:180-183, :207, :223-235) ·
`web/src/modules/worklist/MeetingPage.tsx` (:109, :154-163, :241-244) · `shared/domain/congViec.ts` (`trangThaiO` :194, `trangThaiDonVi` :203).

- [ ] **Phép kiểm trước — hai đường:**
  - F3/K1-37: mỗi dòng tín hiệu còn giữ (b, c) có `n` = `metricSet(id).n` **và** = số dòng mở ra; không còn câu `sos_cases … sos_level > 0` trong `signals.ts`.
  - F4: tổng "Chưa báo cáo / Đang nhập / Đã nộp" = số **đơn vị** khi bấm lọc; ba số cộng = số đơn vị.
  - `weeksReported`: tháng có 2 tuần đã nộp, 1 tuần nháp, 2 tuần chưa bắt đầu → `2/3`; `worstStatus` bỏ qua nháp.
  - **Phủ định quyền:** QL chi nhánh khác không thấy tín hiệu chi nhánh MB.
- [ ] `signals.ts`: (b), (c) gọi `metricSet` (Q12); (a) giữ; xoá SQL thừa.
- [ ] `meeting.ts`: đếm từ `unitRows.map(u => u.trangThai.ma)`; `weeksReported` = `trangThaiO === 'da-nop'`, mẫu = tuần `week_start <= homNay`.
- [ ] Web (**clarify**):
  - nhãn "n đơn vị chưa báo cáo" / "đang nhập" / "đã nộp";
  - dòng tín hiệu ghi đơn vị (bài / Case / PA);
  - "Việc đang tồn (n)" ghi rõ "n loại việc", hoặc bỏ số nếu không có danh sách.
- [ ] `npm run check` → commit `PR-UXF-a (7): Báo cáo đơn vị lấy số từ sổ chỉ số; đếm đơn vị; tuần đã nộp`.

## Task 8 · "Đúng hạn cập nhật": ghi bù N tuần = N lần trễ (U7 / K3-17)

**Files:** `server/src/worklist/metrics.ts` (`obligations` :205-248, drill :111-128) · `server/src/worklist/chuongTrinh.ts:76` ·
`shared/domain/display.ts:326` (`nhanTuanGhiKetQua`, chỉ đọc) · `shared/domain/tongQuan.ts:139-142` (chữ `dung-han` nếu cần) · `server/src/cases/cases.ts:2873-2875`.

Hiện trạng:
- Một nghĩa vụ = (PA, đợt), với `iv*1000 + cycle` (`metrics.ts:205-207`).
- Ghi một lần khi đã trễ 3 tuần → đóng 3 tuần mà chỉ tính **1** trễ (`cases.ts:2957-2958, 3013`). PA bỏ quên nhiều tuần cũng chỉ **1**.

- [ ] **Đọc trước:** K3.md mục K3-17 (và `plans/2026-09-29-pr-sos-sos-v4.md:516`) — luật "chặn ngày ghi" nói gì. Luật rõ → làm ở `cases.ts:2873-2875` + phép kiểm phủ định (400). Không rõ → ghi Nhật ký, **không** tự đặt luật.
- [ ] **Phép kiểm trước:**
  - PA hạn Thứ Hai W1, ghi ở W4 → 3 nghĩa vụ, 3 trễ;
  - chữ "ghi bù 3 tuần" (`nhanTuanGhiKetQua`) cùng N;
  - PA chưa ghi, quá 2 tuần → 2 nghĩa vụ trễ;
  - ghi đúng hạn → 1 nghĩa vụ đúng;
  - `n = ids.length = rows.length` (khung `run.ts:9214`);
  - lọc khung (`chuongTrinh.ts:76`) còn đúng.
- [ ] Id nghĩa vụ `iv * 1e6 + cycle * 1e3 + k` (`ponytail:` ≤ 999 tuần/đợt). Sửa `parseObligation`, drill, `chuongTrinh.ts:76` theo một hàm tách id.
- [ ] `npm run check` → commit `PR-UXF-a (8): Đúng hạn cập nhật — mỗi tuần ghi bù là một lần trễ`.

## Task 9 · Bảng chi nhánh + sắp lớp + chip Công việc (C-số bangChiNhanh, U1, UX-F5) — impeccable `clarify`

**Files:** `server/src/worklist/bangChiNhanh.ts` (:17, :67, :89-92) · `server/src/worklist/chuongTrinh.ts` (`lopCuaTap`, chỉ đọc) ·
U1: `fasttrack/planning.ts:164`, `worklist/branchpulse.ts:137`, `worklist/summary.ts:160`, `platform/xoaTaiKhoan.ts:119,158`, `phanTich/xuatMt.ts:66,196,202` ·
`web/src/modules/congViec/HoTroHocVienTab.tsx` (:85, :93, :96, :134, :151) · `shared/domain/congViec.ts` (`demLocNhanh`).

- [ ] **Phép kiểm trước — hai đường:**
  - Bảng chi nhánh, khung FT: em có Case từ lượt FT nay học lớp thường → Case nằm ở **hàng lớp của lượt**, Σ hàng = tổng ô = số Case mở ở hồ sơ GV người phụ trách.
  - U1: thứ tự lớp ở 6 đường = `soSanhLop` (`MB FT 9` trước `MB FT 10`).
  - F5: hàm thuần — cho `n` dòng + `m` nhắc: Lọc nhanh "Tất cả" = Nhóm "Tất cả" = Σ nhóm; "Quá hạn"/"Hôm nay" không gồm nhắc.
- [ ] `bangChiNhanh`: gán hàng bằng `lopCuaTap('case', ids)` — **cùng hàm** bộ lọc khung dùng (`chuongTrinh.ts:10` "Case = lớp của lượt Test"); sửa chú thích :17.
- [ ] U1: sau mỗi câu, `.sort(soSanhLop)` bằng JS. `xoaTaiKhoan` bỏ `group_concat … ORDER BY`, ghép chuỗi bằng JS.
- [ ] F5: một biến `soNhac` (Q19); `demLocNhanh(items, soNhac)` cho mọi chip "Tất cả".
- [ ] `npm run check` → commit `PR-UXF-a (9): bảng chi nhánh theo lớp của lượt; sắp lớp soSanhLop; chip Tất cả một số`.

## Task 10 · Phân tích + Vận hành: Tạm thời, Chưa phân loại, hạn gốc (C-số tongHop, §9, mgmttasks)

**Files:** `shared/domain/phanTich.ts:233` (tooltip) · `server/src/phanTich/vanDeHv.ts` (:166-190, :213, :354-371) ·
`server/src/worklist/mgmttasks.ts` (:160-164, :199, :228-230, :289-298, :300-330, :639-640) · `web/src/modules/worklist/MgmtTasksPage.tsx:299`.

- [ ] **Phép kiểm trước — hai đường:**
  - Vấn đề HV, lớp Pre FOU: Case `tong_hop` (vấn đề `locHo` null) → vào "Chưa phân loại"; Σ nhóm + Chưa phân loại = số Case trong phạm vi = `tomTat`; bấm nhóm ra đúng số dòng. Bật `chiChinh` (Case chỉ có vấn đề phụ) → cũng không rơi.
  - Vận hành:
    - việc đặt hạn 10/09, dời 12/09 → `hanGoc = 10/09`, `soLanDoiHan = 1`;
    - việc chỉ đặt hạn → `soLanDoiHan = 0`;
    - lịch sử ghi "Đặt hạn" rồi "Dời hạn".
  - `tongHop`: tooltip có chữ "Tạm thời" (quét chuỗi).
- [ ] `vanDeHv`: theo dõi `coDong` mỗi Case; Case không có hàng → `chuaPhanLoai` (Q15).
- [ ] `mgmttasks`:
  - `soLanDoiHan` lọc `old_value IS NOT NULL`;
  - `hanGoc` = `new_value` của dòng đặt đầu nếu có;
  - API chi tiết trả `hanGoc` (`MgmtTasksPage.tsx:299` đang đọc mà không có), hoặc bỏ dòng web nếu thừa — chọn một, ghi Nhật ký.
- [ ] `tongHop`: chỉ tooltip (Q14) — không đổi số.
- [ ] `npm run check` → commit `PR-UXF-a (10): Chưa phân loại không rơi Case; hạn gốc và số lần dời hạn đúng; tooltip Tạm thời`.

## Task 11 · Bấm thử theo vai, 1440 + 375, sáng/tối — impeccable `audit` + `polish`, `/ponytail-review`, mở PR

- [ ] Cổng gộp `origin/main` (nếu VAI-a / VAI-b / Pb2 đã merge) → gỡ theo bảng file chồng → `npm run check`.
- [ ] Chạy mục **KIỂM** theo vai QL (Nguyễn Khánh Vy id 2), GVCN lớp thường, GVBM, Quản trị (id 1). Ảnh `thiet-ke/anh/pr-uxf-a/{muc}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] impeccable **`audit`** trên các màn đã chạm, rồi **`polish`** (sáng **và** tối). Kiểm:
  - cỡ chữ Q31-4 (kết quả / hạn / người 12 px);
  - mã tuần;
  - đơn vị có mặt ở mọi số.
- [ ] `/ponytail-review`; liệt kê mọi `ponytail:` mới trong thân PR.
- [ ] Quét: không còn `npm run check` treo; tắt 4187/5387.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - bảng mục (mã → ảnh trước/sau → đạt);
  - mốc B → số phép kiểm cuối;
  - trần tốc độ đổi;
  - "Chuyển cho PR khác";
  - `ponytail:`.

## Câu hỏi cho chủ sản phẩm — ĐÃ CHỐT 01/10 (Câu 1 = A + bỏ tuần Tạm dừng; Câu 2 = A)

- **Câu 1 — FT "tuần học thứ n" tính từ đâu?**
  - A. Từ **tuần em bắt đầu lộ trình FT** (khớp lịch MT tuần 6/12/16; chuyển lớp FT vẫn đếm tiếp);
  - B. Từ tuần em vào **lớp hiện tại**.
  - **Khuyên A**; kế hoạch theo A (Q6).
- **Câu 2 — Bài quá hạn của môn chưa phân công GV:**
  - A. Vẫn tính ở ô Tổng quan, bảng Theo giáo viên có hàng **"Chưa phân công"** (số khớp, không giấu nợ);
  - B. Không tính ở đâu cả (lớp thiếu GV đã có badge "Thiếu GV").
  - **Khuyên A**; kế hoạch theo A (Q8).

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Giao kèo UXF-a để lại |
|---|---|---|
| **K5-52** chỉ số / danh sách Chờ duyệt + **VN05** lọc chi nhánh (cùng `demYeuCau`, `worklist/tongQuan.ts:56`, `KhoiCanXuLy.tsx:90`) — số "k quá hạn" chưa có danh sách (thêm lọc quá hạn ở `hopChoDuyet`) | **PR-VAI-a** | — |
| Tên GV nợ trên dòng Nợ (UX-B5, T53 Q4) — dữ liệu `pendingOwners` (`attempts.ts:715,800`) | **PR-VAI-a** | `DongNo` đã có `tuanThi`; thêm trường riêng |
| `mywork.ts:927` sắp lớp `soSanhLop`; `urgencyOf` ở `mywork.ts:240-242` đọc cờ quá hạn ô (nếu UXF-a chưa đổi được) | **PR-VAI-a** | `viewSkill.overdue` đã đúng luật Q10 |
| Đầu hồ sơ HV "tuần học thứ n" (T72) | **PR-VAI-b** | `chuTuanHoc(tuan, tong)` ở `hienThiNgay.ts`; FT `tong = null` |
| Bảng Phân tích GV dùng số bài chưa nhập / quá hạn | **PR-Pb2** | `noDiemCuaGv`, `oHoSoGv`, `baiId` — đơn vị **bài** |
| `listCases` lọc lớp `COALESCE(cur,a)` mà quyền `COALESCE(a,cur)` (`cases.ts:1781-1782` vs `:1795,1895`) | **PR-Dọn** | — |
| Thẻ Lịch thi bỏ năm `W4 SEP 2026` (`loaiYeuCau.ts:161,165`) | **PR-UXF-b** (U5) | — |
| Luật "chặn ngày ghi" K3-17, nếu nguồn không rõ | planning | Nhật ký Task 8 |

## KIỂM — kịch bản bấm thử

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| 1 | QL | Hồ sơ lớp **MB BE 04** › ⋮ `Chuyển lớp cả lớp…` (panel B) | Tạ Đức Huy (Web gợi ý "Lên ELE") chọn `Học lại` | ô **Lý do \*** hiện "khác Web gợi ý"; để trống → `Tiếp tục` báo "Ghi lý do ngắn"; ghi lý do → gửi được. Đặng Minh Khôi (chip "Quản lý cân nhắc") chọn Học lại → không đòi lý do |
| 2 | QL | API `POST /classes/{BE 04}/transition` | Huy `hoc_lai`, không lý do, `khacGoiY:false` | `failed` "Ghi lý do ngắn" |
| 3 | GVCN | Hồ sơ lớp BE 04 › tab Học viên › chế độ Điểm | xem | sau nhóm Cuối khoá có `% tổng` + `Hướng gợi ý` (45 % Học lại BE · 55 % chip Quản lý cân nhắc · 64 % Lên ELE + bổ trợ · 78 % Lên ELE); 375 px: thẻ có dòng Hướng gợi ý |
| 4 | QL | Học viên & Lớp › lớp BE 04 | cột Kết quả gần nhất | `64%` · dòng 1 `Cuối khoá → lên + bổ trợ`; em xong Cuối khoá **không** có "Thiếu thông tin" |
| 5 | GVBM có ô quá hạn | Học viên & Lớp | chip `Cần làm`, badge "n HV quá hạn việc" hồ sơ lớp | em nợ điểm có trong chip; badge = số dòng khi bấm |
| 6 | GVBM | Hồ sơ lớp › tab Học viên | cột Case vs "n Case đang mở" đầu trang | bằng nhau |
| 7 | QL | Hồ sơ HV FT (MB FT 101) › ⋮ `Chuyển lớp…` | xem dòng "Đang học" | `MB FT 101 · LT1 · tuần học thứ n` — không `/16`; lớp đích FT không có tuần. Panel FT `Chuyển nhiều em…`: dòng em `LT1 · tuần học thứ n` |
| 8 | QL | Tổng quan › Cần xử lý | "n bài chưa nhập điểm quá hạn" → bấm | số dòng = n; mỗi dòng một môn + tuần thi môn. Tổng quan › bảng Theo giáo viên: Σ "Bài quá hạn" (kể cả "Chưa phân công") = n; bấm một GV → hồ sơ GV cùng số |
| 9 | QL | Hồ sơ HV có ô quá hạn › ⋮ Tạm dừng | quay lại Tổng quan, Lịch Test, Công việc GV | mọi số bài giảm 1; Khôi phục → tăng lại |
| 10 | GVBM | Test › Lịch Test › khối Nợ | xem | dòng có tuần thi `MT3 · W3 SEP`, không hai dòng giống hệt; nhóm theo lớp; bài tuần chưa hết **không** quá hạn |
| 11 | QL | Công việc › Báo cáo đơn vị | chip "Chưa báo cáo" | số = số đơn vị trong danh sách; nhãn "đơn vị"; dòng tín hiệu có đơn vị; "n/m tuần" chỉ tính tuần đã bắt đầu |
| 12 | QL | Tổng quan › điểm đang chú ý "Đúng hạn cập nhật" | bấm | PA ghi bù 3 tuần = 3 dòng trễ |
| 13 | GV | Công việc › Hỗ trợ học viên | chip "Tất cả" ở hai hàng chip | cùng một số = Σ nhóm |
| 14 | QL | Tổng quan › Phân tích › Vấn đề HV (lớp thường) | nhóm "Chưa phân loại" | Case Pre FOU có mặt; Σ = tổng |
| 15 | QL | Công việc › Vận hành › mở một việc đã dời hạn | xem | "Hạn gốc …", "Dời hạn 1 lần"; lịch sử có "Đặt hạn" |
| 16 | mọi vai | mọi màn trên | 375 px, sáng + tối | không cuộn ngang; số 12 px `tabular-nums`; mã tuần, hạn qua `<Han>` |

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, model thật, trần tốc độ, lệch kế hoạch, cổng gộp) |
|---|---|---|
| | | |
