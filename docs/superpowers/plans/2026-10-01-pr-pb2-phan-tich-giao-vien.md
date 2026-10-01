# PR-Pb2-a + PR-Pb2-b · Phân tích còn lại · Phân tích giáo viên · FOU 2 GV — Kế hoạch (hai PR chạy song song)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.
>
> **Đọc trước:**
> - File này có **hai phần**, cho **hai session chạy cùng lúc**, cùng bắt đầu từ `origin/main`.
> - Session **Pb2-a** chỉ làm **Phần A**; session **Pb2-b** chỉ làm **Phần B**.
> - Cả hai đọc chung các mục: đầu file, "Hợp đồng giữa Pb2-a và Pb2-b", Bảng Q, Global Constraints, Quy trình nhanh.

**Goal:**
- **Phần A — PR-Pb2-a:**
  - (1) **Bỏ "Cả hai"** ở mọi khối theo kỹ năng / bài test trên toàn web. Chỉ còn công tắc `Fast Track · Lớp thường`; Quản lý mặc định FT.
    Khối không theo kỹ năng (Ý thức, Chờ duyệt, Việc, lịch) vẫn gộp. Pb2-a **giữ hằng `CHUONG_TRINH`** (T60, K1-07, K1-18, K5-43, Q31-1).
  - (2) **Bỏ góc nhìn "Danh sách Case"**; mọi đường dẫn cũ chuyển hướng, không 404 (T59, K1-27).
  - (3) **Hiệu quả PA tách** "PA do giáo viên thêm" (giữ "Nên dùng") / "PA theo quy chế" (không xếp hạng). Thêm **lọc giáo viên `gv` + khoảng `tu`/`den`**
    (T61, K1-23, P9, P9b, P12).
  - (4) **Tổng hợp Test lớp thường**: Giữa khoá theo môn, Cuối khoá 4 dải % tổng, Mini Test (P4, K1-19).
- **Phần B — PR-Pb2-b:**
  - (5) Dữ liệu mới: **ngày nhập đầu** ô điểm, **hạn xử lý chốt** + **ngày phản hồi** của vi phạm (migrate).
  - (6) **FOU 2 giáo viên**: lưới phân công mặc định 2 ô "L · R · G+V" và "P", có "Tách từng môn" (Q31-5).
  - (7) **Hồ sơ GV**: lớp thường 4 cột cố định L · R · W (G+V) · S (P), vai "GVCN · L R G+V", chip "Bàn giao n/m em", link Hiệu quả PA của GV
    (Q31-6, Q31-5, O6, P6).
  - (8) **Bảng Phân tích giáo viên**: góc nhìn mới "Giáo viên", đúng mockup 25 (Q30-5, Q31-2, Q31-9).
  - (9) Demo D18.

**Architecture:**
- Bảng giáo viên là **một bảng, không phải chỉ số trong sổ** (như `tongHop.ts`). Mỗi cột có **đúng một hàm trả tập ID theo người**.
  Ô số, panel "Chấm điểm" và phép kiểm gọi cùng hàm đó (`thiet-ke/HOP_DONG_SO_LIEU.md` §1).
- Cột đã có nguồn thì **gọi lại nguồn đó**, không đếm lần hai:
  - "Ghi kết quả PA" → `metricSet('dung-han-cap-nhat')`;
  - "PA hiệu quả" → `paCoKetQua` của `hieuQuaPa.ts` (**Pb2-a tạo**, Hiệu quả PA lọc `gv` cùng hàm);
  - "Kết quả môn" → luật chấm đạt tách từ `phanTichLop.ts`.
- Nạp **theo lô cho cả chi nhánh**, gom theo người trong bộ nhớ. Không câu SQL nào chạy một lần cho mỗi GV. Có trần trong `tocDoDuong.ts`.
- Luật thuần mới của Pb2-b ở `shared/domain/phanTichGv.ts`. Migrate `server/src/migrate/prPb2b.ts`: ba cột, không lệnh dữ liệu cũ (DB reset trước bản chính).
- Phép kiểm: `server/src/tests/prPb2a.tests.ts` (Pb2-a) · `server/src/tests/prPb2b.tests.ts` (Pb2-b).

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
  Mockup **`21-ho-so-giao-vien.html`**.
- `thiet-ke/ra-27-09/K1.md` §2.3, §4(a), **§4(b)**.
- `specs/2026-09-22-kiem-ke-truoc-deploy.md` dòng P8b, P9, P9b, P12; `specs/2026-09-23-viec-con-lai-sau-deploy.md` §B dòng PR-Pb2.
- Kế hoạch UXF-a `plans/2026-10-01-pr-uxf-a-so-lieu-khop.md` và VAI-a `plans/2026-10-01-pr-vai-a-tong-quan-theo-vai.md`: bảng "Chuyển cho PR khác" và bảng file chồng.
- `thiet-ke/HOP_DONG_SO_LIEU.md`.

## Đã chốt 01/10

- **Câu 1 = tách, chạy song song** (chủ sản phẩm): Pb2-a và Pb2-b là hai PR, hai session cùng lúc, cùng từ `origin/main`.
- **Câu 2 = A** (planning): P6 "hồ sơ GV theo kỹ năng" làm bằng **Hiệu quả PA lọc theo giáo viên** + link từ hồ sơ GV. Không thêm khối mới vào hồ sơ GV (Q26).

## Thứ tự merge

1. **Pb2-a trước**: nhỏ hơn, và VAI-a cần nó (`shared/domain/tongQuan.ts`).
2. Sau đó **Pb2-b hoặc VAI-a**, PR nào sẵn trước.
3. **UXF-a** lúc nào cũng được, nhưng nên **trước Pb2-b** (`baiId`).

Pb2-b **mở PR được** khi Pb2-a chưa merge, nhưng thân PR ghi "merge sau Pb2-a". Cổng gộp cuối của Pb2-b (Phần B Task 7) **bắt buộc** đã có Pb2-a trên `main`.

## Hợp đồng giữa Pb2-a và Pb2-b (chạy cùng lúc)

**Luật chung:** mỗi file có **một chủ**. PR kia chỉ được làm đúng phần ghi ở cột "PR kia được". PR **merge thứ hai** gỡ xung đột theo cột "Gỡ".

| File | Chủ | PR kia được | Gỡ (PR merge thứ hai làm) |
|---|---|---|---|
| `shared/domain/phanTich.ts` — `GOC_NHIN`, `GOC_NHIN_LABEL` (:19-27) | **Pb2-a** (xoá `'danh-sach'`) | **Pb2-b** thêm **đúng** `'giao-vien'` vào **cuối** mảng + nhãn `'giao-vien': 'Giáo viên'`. Không đụng dòng khác của file | kết quả: `['tong-hop', 'van-de', 'hieu-qua-pa', 'y-thuc', 'giao-vien']`, không còn `'danh-sach'` |
| `shared/domain/phanTich.ts` — phần còn lại | **Pb2-a** | — | — |
| `web/src/modules/phanTich/PhanTich.tsx` | **Pb2-a** | **Pb2-b** chỉ ba chỗ: (1) một dòng `import { PhanTichGiaoVien }`; (2) một dòng `{goc === 'giao-vien' && <PhanTichGiaoVien branchId={branchId} />}` cuối danh sách góc nhìn; (3) bọc **nhóm bộ lọc chung** bên phải (`:132-148` trên main) trong `{goc !== 'giao-vien' && (…)}` | giữ nội dung bộ lọc của Pb2-a (đã bỏ "Cả hai", Ý thức ẩn khung) **bên trong** điều kiện của Pb2-b |
| Kiểu chương trình `ChuongTrinh`, `CHUONG_TRINH`, `chuongTrinhTuThamSo`, `thamSoCt`, `ChonChuongTrinh` | **Pb2-a** | **Pb2-b không import, không sửa** các tên này. Pb2-b dùng kiểu riêng `export type KhungPtGv = 'ft' \| 'thuong'` + hàm `khungPtGvTuThamSo(s)` (vắng/lạ → `'ft'`) ở `shared/domain/phanTichGv.ts`. Kiểu này gán được cho `ChuongTrinh` cả **trước** lẫn **sau** Pb2-a nên gọi `metricSet({ program })`, `paCoKetQua({ ct })` không cần đổi | không cần gỡ. **Không** gộp hai kiểu làm một trong đợt này |
| Gọi `lopCuaGv` / `caseMoCuaGv` / `oHoSoGv` (không truyền `ct`) | **Pb2-a** đổi mặc định `'ca-hai'` → `null` (cùng nghĩa "gộp") | **Pb2-b** gọi **không truyền `ct`**; phép kiểm Pb2-b **không** dùng chuỗi `'ca-hai'`, luôn truyền `ct` tường minh ở route của mình | cùng hành vi trước/sau → không gỡ |
| `server/src/giaoVien/hoSo.ts` | chia dòng | **Pb2-a**: `locKhung` :51, mặc định `ct` :54, :94, :101, :226, :300, :310. **Pb2-b**: vai :71-72, `HoSoGv` + `hoSoGiaoVien` :152-193 (chip bàn giao) | khác dòng; nếu dính nhau thì giữ cả hai |
| `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx` | **Pb2-b** (4 cột, vai, chip, link P6, `href` Case :340, :343) | Pb2-a **không sửa** (`/hoc-thuat/case/:id` đã chuyển hướng nên link cũ vẫn đúng) | — |
| `web/src/modules/giaoVien/BangGiaoVienChiNhanh.tsx` | **Pb2-a** (`ct` :26, :31) | Pb2-b không sửa | — |
| `server/src/phanTich/hieuQuaPa.ts`, `server/src/cases/effectiveness.ts`, `web/src/modules/phanTich/HieuQuaPa.tsx` | **Pb2-a** | **Pb2-b chỉ gọi** `paCoKetQua(l: LocPa)` (chữ ký dưới). Chưa có trên `main` thì cột "PA hiệu quả" làm **cuối cùng**, sau cổng gộp có Pb2-a (Phần B Task 4) | — |
| **URL Hiệu quả PA** (Pb2-a định nghĩa, Pb2-b dẫn tới) | **Pb2-a** | **Pb2-b** dẫn đúng: `/phan-tich?goc=hieu-qua-pa&cn={branchId}&ct={ft\|thuong}&gv={userId}&tu={YYYY-MM-DD Thứ Hai}&den={YYYY-MM-DD Thứ Hai}`. `gv` = id người dùng (số nguyên dương); `tu`/`den` = Thứ Hai tuần đầu / tuần cuối, **gồm cả tuần `den`**; có `tu`/`den` thì bỏ qua `tg`. API cùng tên: `/phan-tich/hieu-qua-pa?branchId=&ct=&gv=&tu=&den=` | tên tham số **không đổi** sau khi chốt ở đây |
| `web/src/modules/classes/PhanTichLopTab.tsx`, `ClassOverviewPage.tsx` (tham số `ky-nang`), `server/src/classes/phanTichLop.ts` (`danhGiaMon`) | **Pb2-b** | Pb2-a không sửa | — |
| `shared/domain/phanCong.ts`, `ClassCreatePanel.tsx`, `TeacherAssignPanel.tsx`, `ui/CongTacKhung.tsx` (thêm trang `'phan-tich-gv'`), `yThuc/*`, `fasttrack/attempts.ts`, `normal/regular.ts`, `duyet/loaiYeuCau.ts`, `students/students.ts`, `migrate/prPb2b.ts`, `seed/*` | **Pb2-b** | Pb2-a không sửa | — |
| `shared/domain/tongQuan.ts`, `dieuHuong.ts`, `worklist/*` (web + máy chủ), `phanTich/tongHop.ts`, `vanDeHv.ts`, `yThucPhanTich.ts`, `cases/CaseBoardPage.tsx`, `students/profile.ts`, `ui/SoLieu.tsx` | **Pb2-a** | Pb2-b **chỉ gọi** (`metricSet`, `parseObligation`), không sửa | — |
| `server/src/routes/index.ts` | chung | **chỉ thêm** route. Pb2-a sửa các dòng `chuongTrinhTuThamSo` có sẵn + đọc `gv`/`tu`/`den` ở `filterHieuQuaPaOf`. Pb2-b thêm khối route `/phan-tich/giao-vien*` **ngay sau** route `/phan-tich/bo-quen` (:646-653 trên main), không sửa dòng cũ | giữ cả hai |
| `server/src/tests/run.ts` | chung, **chỉ thêm cuối** | Pb2-a: `await runPrPb2aTests(…)`; Pb2-b: `await runPrPb2bTests(…)` — mỗi PR một dòng sau `runPrS5fbTests` (:9807) | giữ cả hai dòng, thứ tự theo merge |
| `server/src/tests/tocDoDuong.ts` | chung, **chỉ thêm** | mỗi PR thêm mục `DUONG_DO` + khoá `TRAN` của route mình ở **cuối** mỗi khối. Pb2-a sửa trần đường cũ nó đo lại (Tổng quan, Hiệu quả PA, Tổng hợp); Pb2-b sửa trần `/giao-vien/{gv}` | giữ cả hai; cùng khoá (không nên xảy ra) → lấy trần lớn hơn, ghi Nhật ký |
| `CODE_MAP.md`, `shared/domain/index.ts` | chung, **chỉ thêm dòng** | mỗi PR thêm dòng của file mới của mình | giữ cả hai |
| `server/src/migrate.ts`, `schema.sql` | **Pb2-b** | Pb2-a không sửa (không migrate) | — |
| `DEMO.md` | **Pb2-b** (một mục D18) | — | — |

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | PR | Quyết định | Vì sao |
|---|---|---|---|
| Q1 | a | `CHUONG_TRINH = ['ft', 'thuong']`, FT trước. `chuongTrinhTuThamSo(s, macDinh = 'ft')`: tham số lạ hoặc `ca-hai` của link cũ → mặc định, không lỗi. Chỗ **gộp** dùng `null` (`ChuongTrinh \| null`), không dùng giá trị thứ ba | Q31-1; link cũ vẫn mở được |
| Q2 | a | Khối gộp (`ct = null`): chỉ số Ý thức + Phối hợp SOS (`metricSet` bỏ qua `program`, **một chỗ**), Phân tích › Ý thức (ẩn công tắc khung), Lịch sắp tới của GV, hồ sơ GV. `/metrics/:id` không `ct` → gộp | Q31-1, K1-18 |
| Q3 | a | GV "mặc định khung lớp mình dạy": **đã có** ở Lịch Test / Kế hoạch Test (`CongTacKhung`, `LichTestTab.tsx:138-140`). Chỗ khác GV không có công tắc khung → không làm thêm | kiểm mã |
| Q4 | a | Chuyển hướng Danh sách Case (K1 §4b), trong `duongMoi` (`dieuHuong.ts:144`), **đích không chuyển lần nữa**: `goc=danh-sach` hoặc có `ky-nang`/`tinh-hinh` → `/phan-tich?goc=van-de` (giữ `cn`, `ct`) · `hang-doi=due` → `/cong-viec?nhom=case-hoc-thuat&loc=qua-han&nguoi=tat-ca` (giữ `cn`) · `hang-doi=<bỏ quên>` → `/` (giữ `cn`, `ct`). Nhánh `/?tab=tinh-hinh…` (`:152-156`) đi thẳng tới đích mới | T59; luật PR-O |
| Q5 | a / b | `/hoc-thuat/case/:id` → `duongHoSoHocVien(sid, { caseId })` (thay trang); Case không có học viên → giữ trang cũ (**a**). Link máy chủ `metrics.ts:85,94,127`, `profile.ts:190-198` đổi thẳng sang hồ sơ HV (**a**). `HoSoGiaoVienPage.tsx:340,343` (**b**, theo hợp đồng) | K1 §4b |
| Q6 | a | Bỏ `DanhSachCase` + `DanhSachBoQuen` (web). Dòng Cần xử lý "cần hỗ trợ 2 lần Test" bỏ `denLoc` → mở ngăn số. Máy chủ `boQuen.ts` + `/phan-tich/bo-quen` **để VAI-a** xoá cùng U3 (kế hoạch VAI-a Q7) | một PR xoá một chỉ số |
| Q7 | a | **P8b bỏ** (dạng điện thoại của Danh sách Case). K1-22: **đã có** (`TongHopVanDeHv.tsx:150-158`) | kiểm mã |
| Q8 | a | T61: **quy chế ⇔ `preset = 1`** (gồm PA Bổ trợ `kind = 'bo_tro'`, `boTro.ts:18`); **GV thêm ⇔ `preset = 0`**. "PA do giáo viên thêm" đứng **trước**, giữ "Nên dùng". "PA theo quy chế": FT theo **SOS 1 · 2 · 3** → hàng con loại PA; lớp thường **Bổ trợ Giữa khoá** · **Bổ trợ sau Cuối khoá** (`nhom_bo_tro` dạng `mt:%`); thứ tự cố định, không "Nên dùng" | K1-23 |
| Q9 | a | Mini Test là **kết quả cuối** PA bổ trợ sau Cuối khoá: chưa có kết quả tuần mà `mini_test.ty_le` đã ghi → ≥ 70 % "Tiến bộ", < 70 % "Không tiến bộ". Tính ở `shapePlan` (`effectiveness.ts:244`), một chỗ | T61, K1-24 |
| Q10 | a | P9b: cột **"Học viên"**; **"Thời gian thường mất" = trung vị** (`tuanTrungBinh` → `tuanTrungVi`); chữ nhỏ "k PA chạy cùng PA khác". P9: dòng ngữ cảnh `{khung} · {chi nhánh} · {khoảng}`; chân "n PA chưa rõ nơi học lúc làm PA" (`planOutcomesUnattributed`, `effectiveness.ts:290`). Thanh + "chưa ghi kết quả": **đã có**. P12: thanh tự vẽ (`HieuQuaPa.tsx:35-40`) → `<TyLe>` | Pb2-23/09 |
| Q11 | — | **Xu hướng** ở Điểm đáng chú ý: **hoãn** (Tổng quan thuộc VAI-a; chờ 2–3 tháng dữ liệu thật — kiểm kê (d) Câu 2) | "Chuyển cho PR khác" |
| Q12 | a | P4 cột Lớp thường: **Bài kiểm tra** · **Giữa khoá** `Đạt hết · 1 môn trượt · ≥ 2 môn trượt` · **Cuối khoá** `Dưới 50% · 50–59% · 60–69% · Từ 70%` (`daiCuoiKhoa`, `cuoiKhoa.ts:22`) · **Chưa đủ điểm** · **Mini Test** `Đạt · Trượt` · Xử lý giữ nguyên. Σ cột kết quả = Bài. Dòng không có bài loại đó → "—". Mini Test gắn dòng của **bài Cuối khoá sinh ra nó** (`tu_attempt_id`), đếm học viên | K1-19 |
| Q13 | b | `nhap_dau_ngay` = **ngày nghiệp vụ** (`demoToday()`) lần đầu ô có điểm; sửa sau không đổi; ô **mất hết điểm** (nhánh `matHet`, `attempts.ts:1662`) → NULL; dấu "-" không đặt | "lần sửa không tính"; mốc đang có là giờ máy |
| Q14 | b | `han_xu_ly` = hạn **lúc vi phạm thành "Cần xử lý" lần đầu** (đọc `trangThaiYThuc`, không chép luật); không ghi đè, trừ khi em **Quay lại học** mà chưa phản hồi (T65). `phan_hoi_ngay` = ngày nghiệp vụ lần đầu GVCN **xác nhận xử lý** hoặc **gửi đề xuất** có vi phạm đó. Đúng hạn ⇔ `phan_hoi_ngay ≤ han_xu_ly` | mockup 25 "chờ Quản lý duyệt không tính" |
| Q15 | b | Gán người: **ô điểm** → phân công hiệu lực ở **hạn nhập** (`kyNangPhuTrach`, `normal.ts:139`) · **kết quả / HV tiến bộ** → phân công ở **tuần thi** · **vi phạm** → GVCN của `violations.class_id` ở hạn xử lý (không lớp → không tính, `ponytail:`) · **Ghi kết quả PA, PA hiệu quả** → người phụ trách Case | mockup 25 "lúc tới hạn", "lúc thi" |
| Q16 | a / b | "PA hiệu quả" vào khoảng theo **đúng luật `planOutcomes`** (ngày kết thúc PA) để ô = Hiệu quả PA `gv` + cùng khoảng | một hàm cho hai nơi |
| Q17 | b | "Đang dạy" = ngữ cảnh, phân công hiệu lực ở **min(cuối khoảng, hôm nay)**; bấm → hồ sơ GV | mockup |
| Q18 | b | Khoảng mặc định **4 tuần gần nhất tới tuần hiện tại**; tối đa **13 tuần** (400); "Theo tháng" = tuần có Thứ Năm thuộc tháng (`owningMonthOf`, `week.ts:29`) | mockup "Đã duyệt" 7 |
| Q19 | b | % = `Math.round(100·n/m)`; màu từ chính số làm tròn (đỏ < 50, vàng 50–69, xanh ≥ 70); < 5 mục "mẫu nhỏ", không màu; chữ % **12 px** | Q31-9, Q31-4 |
| Q20 | b | "Chấm điểm" loại: vắng xác nhận, huỷ, "-", MT lịch sử, ô chưa tới hạn chưa nhập, em **Tạm dừng** (UXF-a Q9). "Kết quả" loại em **KCK**; "HV tiến bộ" vẫn tính KCK | Q31-7 |
| Q21 | b | "HV tiến bộ": bài trước = **lượt MT gần nhất trước đó** có điểm kỹ năng đó, bất kỳ lớp; tiến bộ ⇔ band cao hơn; W1, W2 riêng | mockup 25 |
| Q22 | b | Bấm "Kết quả" / "HV tiến bộ": **một lớp** → `/hoc-vien/lop/{id}?tab=phan-tich&ky-nang={khoá}`; **nhiều lớp** → hồ sơ GV. "Xử lý vi phạm": một lớp → `?tab=y-thuc`; nhiều → `/phan-tich?goc=y-thuc&cn=` | mockup "Bấm số mở" |
| Q23 | b | FOU gộp: `oPhanCong(ct, kyNang, { tach })`; **không truyền `tach` = 4 ô như cũ**. L, R, G+V cùng người hoặc trống → 2 ô; khác người → mở sẵn tách. Web trải ô gộp thành 3 dòng → **máy chủ không đổi** | Q31-5 |
| Q24 | b | Hồ sơ GV lớp thường, Pre FOU → một ô kéo 4 cột, ô duy nhất có chữ "Tổng hợp" | T56 |
| Q25 | b | O6 từ `viecBanGiao(gvId)` (`banGiao.ts:330`) → cùng số việc Bàn giao; chỉ khi còn dở; bấm → hồ sơ lớp | một nguồn |
| Q26 | b | P6 = Câu 2 A: link "Hiệu quả PA của {tên} ›" ở hồ sơ GV (Quản lý, Quản trị xem) → URL hợp đồng (không `tu`/`den`) | Đã chốt 01/10 |
| Q27 | b | Mockup 25 `.why` màn A "Thanh màu chỉ có ở ô kết quả" — **cũ**; theo "Đã chốt" 4: **không thanh** | chủ sản phẩm 01/10 |

## Global Constraints (cả hai phần)

- **Số khớp:** mỗi số có **phép kiểm hai đường**; không thêm đường đếm thứ hai. Khung `run.ts:9214-9225` (mọi chỉ số `n = ids.length = rows.length`) phải còn xanh.
- **Quyền:** mọi đường mới có **phép kiểm PHỦ ĐỊNH** (người ngoài phạm vi không thấy / 403). Danh sách bấm ra áp đúng quyền của ô số.
- **SQL (Turso):**
  - chỉ `?`, không tham số đặt tên;
  - `IN (…)` theo lô ≤ 400 (≤ 900 tham số);
  - UNION ≤ 20 vế;
  - **không N+1 theo GV / lớp / em**;
  - ghi trong `tx()` (`BEGIN IMMEDIATE` sẵn), gom lệnh ghi;
  - ngày nghiệp vụ `demoToday()` / `useNgayNghiepVu().homNay`.
- **Tốc độ:** route mới vào `tests/tocDoDuong.ts`, trần = `max(đo+10, ⌈đo×1.3⌉)`. **Không nâng trần cũ quá 30 %**; vượt → Nhật ký, báo planning.
- **Giao diện:**
  - `/ponytail lite`; Be Vietnam Pro, số Inter (`tabular-nums`); bảng màu + bố cục đã khoá, token màu, không màu cứng;
  - **mã tuần** `W2 SEP` (`tuanLich`); ngày chỉ cho hạn cụ thể, ngày nhập đầu, hạn xử lý, nhật ký (`<Han>` / `ngay()`);
  - **12 px** cho kết quả, hạn, người phụ trách; nhãn nhỏ 11–11,5 px (`Nhan`);
  - lớp thường **không SOS**; FT không "n/16", không "ca học";
  - không KPI, không xếp hạng, không hàng tổng, không nút sắp theo số;
  - không mã thô trên màn (`ca-hai`, `preset`, `nhom_bo_tro`).
- **Phép kiểm:**
  - mỗi PR một file (`prPb2a.tests.ts` / `prPb2b.tests.ts`, theo mẫu `prCt.tests.ts:4`), đăng ký **cuối** `run.ts`;
  - ngày demo 14/09/2026 (`seed/data.ts:15`, Thứ Hai W3 SEP);
  - phép kiểm cũ đổi kỳ vọng thì **sửa**, không xoá;
  - **tổng số phép kiểm không giảm**.
- **Không bớt** (CLAUDE.md): kiểm dữ liệu nhập, quyền, chống mất dữ liệu. `ponytail:` được phép, liệt kê trong thân PR.

## Quy trình nhanh (bắt buộc, cả hai phần — giá trị riêng ở Bảng điều hành từng phần)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task:
  - `npm run check` **một lần, ở foreground**, log **riêng của phần mình** (`$TEMP` dùng chung giữa các session);
  - xanh, số phép kiểm ≥ mốc B → commit **đúng tiền tố của phần mình**.
- Sập segfault → chạy lại **một** lần. Treo > 10 phút → quét `Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`.
  **Chỉ tắt tiến trình có đường dẫn worktree của mình** (session kia đang chạy song song) → chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai, 1440 và 375, **sáng và tối**, **một lần** ở Task cuối:
  - Playwright kênh Chrome; demo `POST /api/demo/session {userId}`;
  - vai tra `tests/tocDo.run.ts:114`;
  - API/Vite đúng cổng của phần mình (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy. Mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt cổng của mình, quét `tests/run.js` treo **của mình**, dọn file tạm.
- **Cổng gộp** khi PR khác merge (Pb2-a/Pb2-b, UXF-a, VAI-a, VAI-b) và ở Task cuối: `git fetch origin && git merge origin/main` → gỡ theo "Hợp đồng" + bảng file chồng → `npm run check` → ghi Nhật ký.

---

# PHẦN A — PR-Pb2-a · Bỏ "Cả hai" · Bỏ Danh sách Case · Hiệu quả PA · Tổng hợp lớp thường

## Bảng điều hành — Pb2-a

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-Pb2-a** · đợt 6 lượt 1 · làn C · một PR, không draft, **không tự merge**. **Merge đầu tiên** trong hai phần |
| Nhánh · worktree | `pr-pb2a-bo-ca-hai-danh-sach-case` · `.claude/worktrees/pr-pb2a-bo-ca-hai-danh-sach-case`, từ `origin/main` (@ `86ddaf04` trở đi) |
| Cổng thử | API **4177** · Vite **5377**. Song song: Pb2-b 4197/5397 · UXF-a 4187/5387 · VAI-a 4157/5357 · VAI-b 4167/5367. Không dùng 4000/5173 |
| Log · commit · ảnh | `$env:TEMP\check-pb2a.log` · `PR-Pb2-a (n): …` · `thiet-ke/anh/pr-pb2a/` |
| Model | **Opus 5.5 · High** · phương án B: **Fable 5.1 · High**. Đầu phiên **tự kiểm model thật**; không phải Opus 5.5 → **DỪNG**, báo chủ sản phẩm (trừ khi chủ sản phẩm đã chọn B) |
| Người rà | **Opus 5.5**, một lượt cuối đợt 6. Session code không tự rà |
| Subagent | chỉ khi buộc phải: **cùng model, KHÔNG Haiku**. `Co-Authored-By` = model thật |
| Migrate? | **Không.** `schema.sql` không đổi |
| Lệnh impeccable | `/ponytail lite` đầu phiên · **`clarify`** ở Task 3, 4 · **`audit`** + **`polish`** (sáng và tối) ở Task 5. Không `init`/`document`/`hooks on`/cài đặt. Trước PR: `/ponytail-review` |
| Phụ thuộc | Không chờ PR nào. Merge **trước** Pb2-b và VAI-a |
| Không làm | Mọi mục Phần B · xoá `boQuen.ts` + route (VAI-a) · xu hướng (hoãn) |

### Hướng dẫn riêng cho phương án B (Fable) — Pb2-a

1. Task 1 đổi **kiểu** `ChuongTrinh`. Chạy `npx tsc -p .` rồi sửa **theo danh sách lỗi**, đừng tìm bằng mắt.
2. Không chỉnh một phía cho bằng con số phía kia; hai đường gọi chung một hàm. Không được → Nhật ký, dừng.
3. Không đổi luật chấm đạt, SOS, Ý thức; chỉ đọc.
4. Không đụng file của Pb2-b (Hợp đồng).

## A · Task 0 · Chuẩn bị

- [ ] Kiểm model thật. Không phải **Opus 5.5** → dừng, báo chủ sản phẩm.
- [ ] Worktree `.claude/worktrees/pr-pb2a-bo-ca-hai-danh-sach-case` từ `origin/main`; `/ponytail lite`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** vào Nhật ký A.
- [ ] Đọc:
  - kiểm kê (c) làn C;
  - `K1.md` §4(b);
  - `HOP_DONG_SO_LIEU.md` §1–2;
  - "Hợp đồng giữa Pb2-a và Pb2-b" ở trên;
  - mã: `shared/domain/tongQuan.ts:1-60`, `phanTich.ts` (cả file), `dieuHuong.ts:140-185`, `worklist/chuongTrinh.ts`, `worklist/metrics.ts:340-370`,
    `phanTich/tongHop.ts`, `phanTich/hieuQuaPa.ts`, `cases/effectiveness.ts:200-300`, `cases/CaseBoardPage.tsx`, `phanTich/PhanTich.tsx`.
- [ ] Commit `PR-Pb2-a (0): kế hoạch + mốc {B}`.

## A · Task 1 · Bỏ "Cả hai" toàn web (T60, K1-07, K1-18, K5-43, Q31-1)

**Files:** `shared/domain/tongQuan.ts:12-23, 126` · `shared/domain/phanTich.ts:102-111, 150-167, 180, 226-240` ·
máy chủ `worklist/metrics.ts:357-358` · `worklist/chuongTrinh.ts:15, 98-101` · `worklist/highlights.ts:63, 70, 83` · `worklist/bangChiNhanh.ts:64` ·
`phanTich/tongHop.ts:97` · `phanTich/vanDeHv.ts:76` · `phanTich/yThucPhanTich.ts:46, 60` · `giaoVien/hoSo.ts:51, 54, 94, 101, 226, 300` ·
`routes/index.ts:573, 601, 617, 632, 651, 1121, 1524, 1534, 1547, 1554` ·
web `worklist/ChonChuongTrinh.tsx` · `OverviewPage.tsx:64-69, 87` · `BranchPulse.tsx:44, 72, 101` · `Highlights.tsx:39-61` · `MetricTiles.tsx:12` ·
`KhoiCanXuLy.tsx:17` · `ui/SoLieu.tsx:28` · `phanTich/PhanTich.tsx:29, 80-86, 106, 133` · `phanTich/dungChung.tsx:24` · `phanTich/TongHopTestSos.tsx:78, 120` ·
`giaoVien/BangGiaoVienChiNhanh.tsx:26, 31` · 6 file phép kiểm cũ (55 chỗ `'ca-hai'`).

Hiện trạng:
- `CHUONG_TRINH = ['thuong', 'ft', 'ca-hai']`; vắng `ct` = Cả hai (`tongQuan.ts:12-23`).
- Nút "Cả hai" ở Tổng quan và Phân tích.
- Test đã hai khung (`ui/CongTacKhung.tsx`) → **đã có, bỏ**.

```ts
// shared/domain/tongQuan.ts — CHỮ KÝ CHỐT (Pb2-b không import các tên này, xem Hợp đồng)
export const CHUONG_TRINH = ['ft', 'thuong'] as const;
export type ChuongTrinh = (typeof CHUONG_TRINH)[number];
export const CHUONG_TRINH_LABEL: Record<ChuongTrinh, string> = { ft: 'Fast Track', thuong: 'Lớp thường' };
/** Q31-1: vắng / lạ / `ca-hai` của link cũ → `macDinh` (Quản lý: FT). */
export function chuongTrinhTuThamSo(s: string | null | undefined, macDinh: ChuongTrinh = 'ft'): ChuongTrinh {
  return s === 'thuong' || s === 'ft' ? s : macDinh;
}
/** Khối gộp (Q2): `null` = không lọc khung. */
export const thamSoCt = (ct: ChuongTrinh | null, dau: '?' | '&' = '&'): string => (ct ? `${dau}ct=${ct}` : '');
```
- [ ] **Phép kiểm trước** (`prPb2a.tests.ts`, khối 1):
  - `chuongTrinhTuThamSo(null)`, `('ca-hai')`, `('xyz')` → `'ft'`; `('thuong')` → `'thuong'`.
  - `metricSet` (QL MB):
    - chỉ số học thuật (`case-mo`, `bai-qua-han-nhap-diem`) với `ft` ⊂ không lọc;
    - `ft` ∪ `thuong` = không lọc (phần tử có lớp);
    - chỉ số Ý thức (`hv-can-xu-ly`, `vi-pham-tong`) **bằng nhau** với `ft`, `thuong`, `null`.
  - `/phan-tich/y-thuc` có `ct=ft` và không `ct` → cùng số.
  - `/giao-vien/{gv}` không `ct` → có cả lớp FT lẫn lớp thường.
  - **Quét chuỗi**: không còn `'ca-hai'` / `"Cả hai"` trong `shared/`, `server/src/` (trừ `tests/`), `web/src/` — trừ chú thích có chữ "đã bỏ".
- [ ] Shared:
  - hằng + hai hàm trên;
  - `kyNangTheoCt` bỏ nhánh Cả hai; `NHAN_NHOM_KY_NANG`, `DONG_TU_KY_NANG`, `COT_LUOT.nhan` bỏ khoá `'ca-hai'`;
  - chú thích :102, :109, :226, `tongQuan.ts:126` sửa theo.
- [ ] Máy chủ:
  - `metricSet` :357: `const ct = CHI_SO_GOP.has(id) ? null : f.program ?? null; if (!ct) return r;` với
    `CHI_SO_GOP = new Set<string>([...YTHUC_METRIC_IDS, ...PHOI_HOP_METRIC_IDS])` đặt ngay trong `worklist/metrics.ts`
    (đã import ở :195-196; gốc `yThuc/thongKe.ts:31`, `yThuc/phoiHop.ts:442`);
  - `locTheoChuongTrinh` bỏ nhánh `'ca-hai'`;
  - `highlights`, `bangChiNhanh`, `tongHop`, `vanDeHv` nhận `ChuongTrinh`; `yThucPhanTich` nhận `ChuongTrinh | null`;
  - `hoSo.ts`: `locKhung = (ct: ChuongTrinh | null, k) => ct === null || ct === k`, mặc định `null` ở `lopCuaGv`/`caseMoCuaGv`;
    `oHoSoGv` đọc `ct` tuỳ chọn (vắng = gộp); `bangGvChiNhanh` dùng `chuongTrinhTuThamSo(q.ct)`;
  - routes: đường theo kỹ năng dùng `chuongTrinhTuThamSo`; `/metrics/:id` :1121 và `/phan-tich/y-thuc` :632 dùng `ctTuyChon` (hợp lệ → lọc, vắng → gộp).
- [ ] Web:
  - `ChonChuongTrinh` hai nút, **Fast Track trước**; `setCt` luôn ghi `ct`;
  - Phân tích: góc Ý thức **ẩn** công tắc khung, ô Lớp liệt kê mọi lớp;
  - `OverviewPage.tsx:87` GV `LichSapToi ct={null}`;
  - `BranchPulse.tsx:72` bỏ chip khung;
  - `SoLieu.tsx:28` `thamSoCt(phamVi?.chuongTrinh ?? null)`.
- [ ] Sửa kỳ vọng 55 chỗ `'ca-hai'` trong `phanTich`, `prDuyet`, `prGv`, `prMon`, `prYt4`, `tongQuan` `.tests.ts` (không xoá).
- [ ] `tocDoDuong`: `/tong-quan/quan-ly`, `/highlights`, `/tong-quan/chi-nhanh` đo lại (không tăng).
- [ ] `npm run check` → commit `PR-Pb2-a (1): bỏ "Cả hai" — hai khung Fast Track · Lớp thường, khối Ý thức vẫn gộp`.

## A · Task 2 · Bỏ "Danh sách Case" + chuyển hướng (T59, K1-27; P8b bỏ)

**Files:** `shared/domain/phanTich.ts:19-70` · `shared/domain/dieuHuong.ts:144-185` · `shared/domain/tongQuan.ts:84-89` (`denLoc`) ·
`web/src/App.tsx:16, 124` · `web/src/modules/cases/CaseBoardPage.tsx` (xoá `CaseBoard`, `DanhSachCase`, `QueueTile`; `CaseRoutePage` :246-263 → chuyển hướng) ·
`web/src/modules/phanTich/PhanTich.tsx:6-7, 32-33, 97-102, 113-114, 134-135, 155-171` · `web/src/modules/phanTich/DanhSachBoQuen.tsx` (xoá) ·
`web/src/modules/worklist/OverviewPage.tsx:4, 106` · `KhoiCanXuLy.tsx:44` · máy chủ `worklist/metrics.ts:85, 94, 127` · `students/profile.ts:190-198`.

Hiện trạng:
- `GOC_NHIN` còn `'danh-sach'`; tham số `hang-doi`/`tinh-hinh`/`ky-nang` suy về Danh sách Case (`phanTich.ts:41, 52`).
- `/hoc-thuat/case/:id` là trang riêng.
- `KhoiCanXuLy.tsx:44` điều hướng `?goc=danh-sach&hang-doi=`.

- [ ] **Phép kiểm trước:**
  - `duongMoi` (hàm thuần), từng luật Q4:
    - `/phan-tich?goc=danh-sach&cn=2&ct=ft` → `/phan-tich?goc=van-de&cn=2&ct=ft`;
    - `?ky-nang=reading` → `goc=van-de`;
    - `?hang-doi=due&cn=2` → `/cong-viec?nhom=case-hoc-thuat&loc=qua-han&nguoi=tat-ca&cn=2`;
    - `?hang-doi=can-ho-tro-2-lan&cn=2` → `/?cn=2`;
    - `/?tab=tinh-hinh&ky-nang=listening` → `/phan-tich?goc=van-de` (**một bước**);
    - `duongMoi(đích) === null` với mọi đích.
  - `gocNhinTuThamSo` không bao giờ trả `'danh-sach'`.
  - `rowsFor('case', …)` và dòng Case của hồ sơ HV không còn `/hoc-thuat/case/` khi Case có em.
  - **Quét chuỗi**: không còn `goc=danh-sach`, `DanhSachCase` ở `web/src`, `shared`.
- [ ] Shared:
  - `GOC_NHIN` bỏ `'danh-sach'` (Pb2-b sẽ thêm `'giao-vien'` ở cuối — Hợp đồng);
  - `thamSoXoaKhiDoiGoc` luôn xoá ba tham số cũ;
  - `duongMoi` thêm luật Q4 và sửa nhánh `/?tab=tinh-hinh`;
  - `CAN_XU_LY` bỏ `denLoc`, bỏ trường khỏi kiểu.
- [ ] Web:
  - `PhanTich.tsx` bỏ nhánh `danh-sach`, chip "Học viên cần chú ý", `laHienTrang`;
  - `OverviewPage` import `PhanTich` thẳng;
  - `CaseRoutePage` có `student.id` → `<Navigate replace to={duongHoSoHocVien(id, { caseId })}>`; không có em → giữ `NganCase`;
  - `KhoiCanXuLy.tsx:44` bỏ nhánh `denLoc`;
  - xoá `DanhSachBoQuen.tsx`.
- [ ] Máy chủ:
  - `href` Case ở `metrics.ts:85,94,127` và `profile.ts:190-198` dùng `duongHoSoHocVien(sid, { caseId })` khi có em;
  - route **chỉ** Danh sách Case gọi (grep web) → xoá + sửa phép kiểm cũ của nó; route còn nơi khác gọi → giữ.
- [ ] `npm run check` → commit `PR-Pb2-a (2): bỏ Danh sách Case — đường dẫn cũ chuyển về Vấn đề HV, Công việc, hồ sơ HV`.

## A · Task 3 · Hiệu quả PA: tách "quy chế" / "GV thêm", lọc `gv` + `tu`/`den` (T61, K1-23, P9, P9b, P12) — impeccable `clarify`

**Files:** `server/src/cases/effectiveness.ts:207-259`, `:290` · `server/src/phanTich/hieuQuaPa.ts` · `shared/domain/phanTich.ts:305-330, 383-390` ·
`routes/index.ts:614-628` (`filterHieuQuaPaOf`) · `web/src/modules/phanTich/HieuQuaPa.tsx` · `web/src/modules/phanTich/PhanTich.tsx` (chip Giáo viên / khoảng).

Hiện trạng:
- "Nên dùng" áp chung mọi PA (`hieuQuaPa.ts:95-104`, `HieuQuaPa.tsx:46`).
- `queryPlans` chưa lấy `preset`, `nhom_bo_tro`, người phụ trách, mức SOS.
- Thời gian = trung bình (`phanTich.ts:321`).
- PA huỷ "không cần theo dõi" đã ngoài mẫu số (`effectiveness.ts:234`) → **đã có**, chỉ thêm phép kiểm.

```ts
// hieuQuaPa.ts — CHỮ KÝ CHỐT: Pb2-b gọi hàm này cho cột "PA hiệu quả" (Hợp đồng). Không đổi tên/trường sau khi Pb2-b bắt đầu.
export type LocPa = {
  branchIds: number[] | null; ct: ChuongTrinh; classId?: number | null;
  /** Thứ Hai tuần đầu / tuần cuối (gồm cả tuần `den`); `den = null` = tới hôm nay. */
  tu: string; den: string | null;
  /** Chỉ PA của Case do người này phụ trách (`sos_cases.owner_user_id`). */
  gv?: number | null;
};
export function paCoKetQua(l: LocPa): (Plan & { quyChe: boolean; chuCase: number | null; sos: number | null; boTroSau: boolean })[];
```
- [ ] **Phép kiểm trước:**
  - Hai phần tách đúng:
    - `preset = 1` (gồm `bo_tro`) chỉ ở `quyChe`; `preset = 0` chỉ ở `gvThem`;
    - `quyChe` không dòng nào `nenDung = true`;
    - Σ Số PA hai phần = số PA có kết quả trong phạm vi.
  - PA huỷ "không cần theo dõi" không vào Số PA, không vào "chưa ghi kết quả".
  - Mini Test (Q9): nhóm `mt:X` 75 % → "success"; 60 % → không tiến bộ; chưa ghi → vẫn "chưa ghi kết quả".
  - `tuanTrungVi([7, 14, 70])` = 2; `([])` = null.
  - `gv`:
    - tổng "PA do GV thêm" với `gv=X` = số PA `preset = 0` của Case do X phụ trách;
    - **phủ định**: `gv` là người chi nhánh khác → rỗng.
  - `tu`/`den` → đúng tập `planOutcomes({ fromDate, toDate })`; `tu` > `den` hoặc > 52 tuần → 400.
  - Hai đường: `oHieuQuaPa` mỗi ô = số của ô, cả hai phần.
- [ ] Máy chủ:
  - `queryPlans` thêm `iv.preset, iv.nhom_bo_tro, iv.moc_quy_che, sc.owner_user_id, sc.sos_level` + kết quả Mini Test (một `LEFT JOIN mini_test` theo `nhom_bo_tro`);
  - `shapePlan` suy kết quả từ Mini Test (Q9);
  - `paCoKetQua` + `hieuQuaPa` trả `{ gvThem: {…như cũ}, quyChe: { hang, tomTat } }`;
  - Q10: `hocVien`, trung vị, `dongThoi` (`ponytail:` chỉ xét PA có kết quả trong phạm vi), `chuaRoNguon` + dòng `o`;
  - route đọc `gv`, `tu`, `den` (tên **đúng** như Hợp đồng; `tu`/`den` thắng `tg`).
- [ ] Web `HieuQuaPa` (**clarify**):
  - khối "PA do giáo viên thêm" (trước, có "Nên dùng") + khối "PA theo quy chế" (câu dẫn "PA bắt buộc theo quy chế — không so, không xếp hạng");
  - cột "Học viên"; "Thời gian thường mất" (chú thích nổi "trung vị"); thanh → `<TyLe>`;
  - dòng ngữ cảnh; chip **"Giáo viên: {tên} ✕"** và **"W1 SEP – W4 SEP ✕"** khi có `gv` / `tu` (tên GV lấy từ API, không tin URL).
- [ ] `tocDoDuong`: `/phan-tich/hieu-qua-pa`, `?tg=26` đo lại; thêm `?gv={gv}&tu=2026-08-31&den=2026-09-14`.
- [ ] `npm run check` → commit `PR-Pb2-a (3): Hiệu quả PA tách PA quy chế / PA giáo viên thêm; lọc giáo viên và khoảng tuần; trung vị`.

## A · Task 4 · Tổng hợp Test lớp thường: Giữa khoá, Cuối khoá 4 dải, Mini Test (P4, K1-19) — impeccable `clarify`

**Files:** `shared/domain/phanTich.ts:150-240, 406-432` · `server/src/phanTich/tongHop.ts:81-240` · `server/src/normal/cuoiKhoa.ts:404` (xuất `NGUONG_MINI_TEST`) ·
`web/src/modules/phanTich/TongHopTestSos.tsx`.

Hiện trạng: khung lớp thường dùng "1 / 2 / ≥ 3 môn trượt" cho cả Giữa lẫn Cuối khoá (`phanTich.ts:197-206`). Không có dải % tổng, không có Mini Test.

- [ ] **Phép kiểm trước:**
  - Lớp MB BE 04 + MB FOU 21 (`lt2bSeed`, `ctSeed`):
    - mỗi bài rơi **đúng một** cột: `gk-dat + gk-1 + gk-2 + ck-duoi50 + ck-50 + ck-60 + ck-dat + chuaDu = luot` ở mọi dòng và Tổng;
    - Cuối khoá 44 % → `ck-duoi50`, 57 % → `ck-50`, 66 % → `ck-60`, 82 % → `ck-dat` (cùng `daiCuoiKhoa`);
    - Giữa khoá trượt 1 môn → `gk-1`.
  - Mini Test 75 % → `mini-dat` ở **dòng bài Cuối khoá gốc**; bấm ô → đúng em (`oTongHop`).
  - Khung FT: cột **không đổi**.
  - Dòng chỉ có Giữa khoá → `coDot.cuoi = false`.
  - Em KCK ngoài mẫu số như cũ.
- [ ] Shared: cột theo Q12; trường `nhomCon: 'giua' | 'cuoi' | 'mini'` cho đầu đề hai tầng (không thêm `NhomCot`); tooltip mỗi cột một câu (**clarify**).
- [ ] Máy chủ `tinh`:
  - `progress` → đếm môn trượt từ `ev.skills`; `final` → `daiCuoiKhoa(tyLeTong)`; chưa đủ điểm → `chuaDu`;
  - Mini Test **một câu** theo lô (`tu_attempt_id IN (…) AND ty_le IS NOT NULL`), ngưỡng `NGUONG_MINI_TEST`;
  - dòng trả `coDot: { giua, cuoi }`.
- [ ] Web: đầu đề hai tầng "Giữa khoá (theo môn)" · "Cuối khoá (% tổng)" · "Mini Test"; ô không áp dụng "—"; Excel cùng cột.
- [ ] `tocDoDuong`: `/phan-tich/tong-hop?ct=thuong` đo lại (+1 câu cố định).
- [ ] `npm run check` → commit `PR-Pb2-a (4): Tổng hợp Test lớp thường — Giữa khoá theo môn, Cuối khoá 4 dải, Mini Test`.

## A · Task 5 · Bấm thử, `audit` + `polish`, `/ponytail-review`, mở PR

- [ ] Cổng gộp `origin/main` (UXF-a / VAI-b nếu đã merge) → gỡ → `npm run check`.
- [ ] KIỂM A (bảng dưới) theo vai QL (Nguyễn Khánh Vy id 2), Quản trị (id 1), GVCN. Ảnh `thiet-ke/anh/pr-pb2a/{muc}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] impeccable **`audit`** các màn đã chạm, rồi **`polish`** (sáng **và** tối): 12 px, mã tuần, không "Cả hai", không "Danh sách Case".
- [ ] `/ponytail-review`; liệt kê `ponytail:` mới trong thân PR.
- [ ] Tắt 4177/5377; quét `tests/run.js` treo của worktree này.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - bảng mục → ảnh → đạt;
  - mốc B → số phép kiểm cuối;
  - trần tốc độ;
  - "Chuyển cho PR khác";
  - `ponytail:`;
  - dòng "**merge trước Pb2-b và VAI-a**";
  - **chữ ký chốt** `ChuongTrinh` + `paCoKetQua` + tham số URL `gv`/`tu`/`den` (để Pb2-b, VAI-a đối chiếu).

### KIỂM A

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| A1 | QL | Tổng quan và tab Phân tích | công tắc khung | chỉ **Fast Track · Lớp thường**, mặc định FT |
| A2 | QL | Phân tích › Ý thức | xem | không có công tắc khung; số gộp |
| A3 | QL | gõ `/phan-tich?goc=danh-sach&cn=2`, `/phan-tich?hang-doi=due`, `/hoc-thuat/case/{id}` | mở | Vấn đề HV · Công việc lọc Case học thuật quá hạn · hồ sơ HV mở Ngăn Case — không 404, một bước |
| A4 | QL | Phân tích › Hiệu quả PA | xem | hai khối (GV thêm có Nên dùng; quy chế không); cột Học viên; "Thời gian thường mất"; chân "chưa rõ nơi học" |
| A5 | QL | gõ `/phan-tich?goc=hieu-qua-pa&cn=2&ct=ft&gv={id}&tu=2026-08-31&den=2026-09-14` | mở | chip Giáo viên + chip khoảng; ✕ bỏ lọc |
| A6 | QL | Tổng hợp Test + SOS · Lớp thường · Theo đợt | bấm ô Mini Test đạt | đầu đề Giữa / Cuối (4 dải) / Mini Test; "—"; bấm ra đúng em |
| A7 | mọi vai | các màn trên | 375, sáng + tối | không cuộn ngang trang; `tabular-nums` |

---

# PHẦN B — PR-Pb2-b · Phân tích giáo viên · FOU 2 GV · Hồ sơ GV · dữ liệu mới

## Bảng điều hành — Pb2-b

| Mục | Chốt |
|---|---|
| Mã · đợt · làn | **PR-Pb2-b** · đợt 6 lượt 1 · làn C · một PR, không draft, **không tự merge**. Merge **sau Pb2-a** |
| Nhánh · worktree | `pr-pb2b-phan-tich-giao-vien` · `.claude/worktrees/pr-pb2b-phan-tich-giao-vien`, từ `origin/main` (@ `86ddaf04` trở đi), **cùng lúc** với Pb2-a |
| Cổng thử | API **4197** · Vite **5397**. Song song: Pb2-a 4177/5377 · UXF-a 4187/5387 · VAI-a 4157/5357 · VAI-b 4167/5367. Không dùng 4000/5173 |
| Log · commit · ảnh | `$env:TEMP\check-pb2b.log` · `PR-Pb2-b (n): …` · `thiet-ke/anh/pr-pb2b/` |
| Model | **Opus 5.5 · High** · phương án B: **Fable 5.1 · High**. Đầu phiên **tự kiểm model thật**; không phải Opus 5.5 → **DỪNG**, báo chủ sản phẩm (trừ khi chủ sản phẩm đã chọn B) |
| Người rà | **Opus 5.5**, một lượt cuối đợt 6. Session code không tự rà |
| Subagent | chỉ khi buộc phải: **cùng model, KHÔNG Haiku**. `Co-Authored-By` = model thật |
| Migrate? | **Có, chỉ cấu trúc.** `assessment_scores.nhap_dau_ngay`, `violations.han_xu_ly`, `violations.phan_hoi_ngay`. Không lệnh dữ liệu cũ, không lệnh chạy thử. `schema.sql`: ba cột ở **cuối** bảng |
| Lệnh impeccable | `/ponytail lite` đầu phiên · **`clarify`** ở Task 3, 5 · **`layout`** ở Task 5 · **`adapt`** ở Task 2, 5 · **`audit`** + **`polish`** (sáng và tối) ở Task 7. Không `init`/`document`/`hooks on`/cài đặt. Trước PR: `/ponytail-review` |
| Phụ thuộc | Bắt đầu ngay, song song Pb2-a. **Cần Pb2-a trên `main`** cho: bước "PA hiệu quả" ở Task 4 (`paCoKetQua`) và Task 7 (cổng gộp cuối). UXF-a nên merge trước (`baiId`) |
| Không làm | Mọi mục Phần A · đổi `ChuongTrinh`/`CHUONG_TRINH` (Hợp đồng) · hàng "Chưa phân công" (UXF-a, Q31-12) · bảng quản trị điện thoại (UXD) |

### Hướng dẫn riêng cho phương án B (Fable) — Pb2-b

1. Viết **máy chủ + phép kiểm** bảng giáo viên (Task 4) xanh hết rồi mới vẽ web (Task 5).
2. Không chỉnh một phía cho bằng con số phía kia; hai đường gọi chung một hàm. Không được → Nhật ký, dừng.
3. Không đổi luật chấm đạt, SOS, Ý thức (`shared/domain/yThuc.ts`); tách hàm dùng chung thì giữ nguyên thân.
4. Không import `ChuongTrinh`, `chuongTrinhTuThamSo`, `thamSoCt`; không sửa file của Pb2-a (Hợp đồng).

## B · Task 0 · Chuẩn bị

- [ ] Kiểm model thật. Không phải **Opus 5.5** → dừng, báo chủ sản phẩm.
- [ ] Worktree `.claude/worktrees/pr-pb2b-phan-tich-giao-vien` từ `origin/main`; `/ponytail lite`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** vào Nhật ký B.
- [ ] Đọc:
  - mockup 25 (đủ, cả "Định nghĩa từng cột"), mockup 21 màn A, B, E;
  - đặc tả §3.1h;
  - "Hợp đồng giữa Pb2-a và Pb2-b";
  - `HOP_DONG_SO_LIEU.md` §1–2;
  - mã: `giaoVien/hoSo.ts`, `classes/phanTichLop.ts:35-130`, `worklist/scoreDebt.ts`, `worklist/metrics.ts:196-250`, `yThuc/trangThai.ts`,
    `shared/domain/yThuc.ts:120-215`, `fasttrack/attempts.ts:1600-1700`, `normal/regular.ts:505-560`, `shared/domain/phanCong.ts`,
    `classes/ClassCreatePanel.tsx:55-80, 180-225`, `classes/TeacherAssignPanel.tsx:40-130`, `classes/banGiao.ts:320-380`.
- [ ] Commit `PR-Pb2-b (0): kế hoạch + mốc {B}`.

## B · Task 1 · Dữ liệu mới: ngày nhập đầu ô điểm, hạn xử lý chốt + ngày phản hồi vi phạm (migrate)

**Files:** tạo `server/src/migrate/prPb2b.ts` · `server/src/migrate.ts:24, 483` · `server/src/schema.sql` (cuối `assessment_scores` :669-706, cuối `violations` :1604-1628) ·
`server/src/fasttrack/attempts.ts:1655-1685` (`saveScore`) · `server/src/normal/regular.ts:530-546` · `server/src/yThuc/trangThai.ts` (hàm mới `chotHanXuLy`) ·
`server/src/yThuc/violations.ts:194-260, 286-340` · `server/src/yThuc/xuLy.ts:125, 416` · `server/src/duyet/loaiYeuCau.ts:331` · `server/src/students/students.ts:~298` ·
`server/src/seed/seed.ts` (bù dữ liệu **chỉ seed**).

Hiện trạng:
- `assessment_scores` chỉ có `entered_at` — ghi đè mỗi lần sửa, giờ máy (`attempts.ts:1657`, `regular.ts:536`).
- Hạn xử lý vi phạm chỉ suy ra lúc xem (`trangThaiViPham`, `shared/domain/yThuc.ts:183`; mốc "Cần xử lý" = `batBuocTu` :156).
- Cột xác nhận nguyên nhân lần đầu: **không cần** (đã bỏ cột).

```ts
// migrate/prPb2b.ts — chỉ cấu trúc, chạy lặp được, lần hai không báo gì
const COT: [bang: string, cot: string, lyDo: string][] = [
  ['assessment_scores', 'nhap_dau_ngay', 'Ô điểm: ngày nhập đầu (tính chấm đúng hạn; sửa sau không đổi)'],
  ['violations', 'han_xu_ly', 'Vi phạm: hạn xử lý chốt lúc thành "Cần xử lý"'],
  ['violations', 'phan_hoi_ngay', 'Vi phạm: ngày GVCN xác nhận xử lý hoặc gửi đề xuất lần đầu'],
];
export function migratePrPb2b(conn: any, applied: string[]) {
  for (const [bang, cot, lyDo] of COT) {
    if ((conn.prepare(`PRAGMA table_info(${bang})`).all() as any[]).some((c) => c.name === cot)) continue;
    conn.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} TEXT`);
    applied.push(lyDo);
  }
}
```
- [ ] **Phép kiểm trước** (`prPb2b.tests.ts`):
  - Migrate: lần một thêm 3 cột, lần hai rỗng; DB từ `schema.sql` → rỗng; cột **giống hệt** (tên, kiểu, thứ tự) — mẫu `prCt.tests.ts:129-150`.
  - `nhap_dau_ngay`:
    - nhập L lần đầu ngày D → D;
    - sửa D+3 (có lý do) → vẫn D, `entered_at` đổi;
    - Huỷ điểm → NULL; nhập lại D+5 → D+5;
    - dấu "-" → NULL;
    - lớp thường cùng luật.
  - `han_xu_ly`:
    - vi phạm thứ 3 trong cửa sổ → cả 3 có hạn = `trangThaiYThuc(...).viPham.get(id).han`;
    - vi phạm thứ 4 → 3 cái cũ không đổi;
    - Tạm dừng rồi Quay lại, chưa phản hồi → tính lại; đã phản hồi → giữ.
  - `phan_hoi_ngay`:
    - `guiDeXuat` → vi phạm liên kết = hôm nay (ngày nghiệp vụ);
    - bị từ chối rồi gửi lại → giữ ngày đầu;
    - `deXuat` (nháp) → không đặt.
  - **Phủ định**: vi phạm `valid = 0` không bao giờ vào tập "Xử lý vi phạm" (Task 4).
- [ ] Máy chủ:
  - migrate + `schema.sql` + đăng ký `migratePrPb2b` ngay sau `migratePrCt` (:483);
  - `saveScore`/`saveRegularScore`: `nhap_dau_ngay = hasValue ? COALESCE(cũ, demoToday()) : NULL` (Q13);
  - `chotHanXuLy(conn, studentIds, { ghiDe })` ở `trangThai.ts`:
    - đọc `trangThaiYThuc` **không qua bộ nhớ request** (xoá khoá `yt4:` của các em đó trước);
    - `UPDATE violations SET han_xu_ly = ?` cho vi phạm `can_xu_ly`/`qua_han` (`lyDoQuaHan = 'xu-ly'`) có `han`, `han_xu_ly IS NULL` (hoặc `ghiDe` và `phan_hoi_ngay IS NULL`);
    - gọi trong cùng `tx` ở `recordViolation`, `editViolation`, từ chối đề xuất (`loaiYeuCau.ts:331`), Quay lại học (`ghiDe`);
  - `phan_hoi_ngay`: `UPDATE … WHERE id IN (vi phạm liên kết) AND phan_hoi_ngay IS NULL` ở `xacNhanXuLy`, `guiDeXuat`;
  - seed (không phải migrate): cuối `runSeed` bù `nhap_dau_ngay` cho ô có điểm, gọi `chotHanXuLy` cho em có vi phạm, bù `phan_hoi_ngay` từ lần xử lý.
- [ ] `tocDoDuong`: đường ghi vi phạm, `guiDeXuat`, lưu điểm (nếu có trong danh sách) đo lại (+ ≤ 2 câu).
- [ ] `npm run check` → commit `PR-Pb2-b (1): migrate — ngày nhập đầu ô điểm, hạn xử lý chốt và ngày phản hồi vi phạm`.

## B · Task 2 · Lớp FOU hai giáo viên: phân công 2 ô + "Tách từng môn" (Q31-5) — impeccable `adapt`

**Files:** `shared/domain/phanCong.ts:4-15` + `slotsTuO`, `nenTachFou` · `shared/domain/normal.ts:131-134` (`kyNangGoiY` — chỉ đọc) ·
`web/src/modules/classes/ClassCreatePanel.tsx:63-73, 186-222` · `web/src/modules/classes/TeacherAssignPanel.tsx:47-62, 108-113` ·
**không đổi:** `server/src/classes/classes.ts:921-992`, `classes/intake.ts:606-637`, `platform/CatalogAdmin.tsx:26`.

Hiện trạng:
- FOU luôn 4 ô môn + GVCN (`phanCong.ts:11-15`).
- Một người nhiều ô **đã được phép** (`:35`).
- GVCN phải dạy ≥ 1 môn (`:38-39`).

```ts
export type OPhanCong = { khoa: string; skill: string | null; laGvcn: boolean; nhan: string; gop?: readonly string[] };
/** Q31-5: FOU mặc định 2 ô "L · R · G+V" và "P". Không truyền `tach` = 4 ô như cũ (máy chủ, Danh mục, phép kiểm cũ). */
export function oPhanCong(ct: string | null, kyNangLop: readonly string[], o: { tach?: boolean } = { tach: true }): OPhanCong[];
/** Ô gộp trải thành một dòng mỗi môn — máy chủ nhận đúng dạng cũ. */
export function slotsTuO(oList: readonly OPhanCong[], chon: Record<string, number | ''>): SlotPhanCong[];
/** L, R, G+V đang có người KHÁC nhau → phải tách. */
export function nenTachFou(ct: string | null, bySkill: readonly { skill: string; userId: number }[]): boolean;
```
- [ ] **Phép kiểm trước:**
  - `oPhanCong('FOU', 4 môn, { tach: false })` → 3 ô: GVCN · `L · R · G+V` (gộp `listening, reading, writing`) · `P`;
  - mặc định → 5 ô như cũ; BE, ELE, FT với `tach: false` → **không đổi**; Pre FOU → một ô GVCN;
  - `slotsTuO` ô gộp chọn người 7 → 3 dòng người 7;
  - `kiemPhanCong` với kết quả đó → không lỗi; GVCN = người 7 → đủ luật "GVCN dạy ≥ 1 môn";
  - `nenTachFou`: L = 7, R = 7, G+V trống → false; L = 7, R = 9 → true;
  - `PUT /classes/{MB FOU}/teachers` với slots đã trải → đúng 1 GVCN + 4 dòng môn, **không** dạng dữ liệu mới;
  - phép kiểm cũ `prLop.tests.ts:50-69, 166-180`, `prMon.tests.ts:59` xanh, không sửa.
- [ ] Shared: như trên. Lỗi `kiemPhanCong` theo môn hiện ở ô gộp chứa môn đó.
- [ ] Web:
  - Tạo lớp / Sửa phân công, lớp FOU: mặc định 2 ô (`nenTachFou` → mở sẵn tách);
  - link nhỏ **"Tách từng môn"** / **"Gộp L · R · G+V"** dưới lưới (12 px); nút Gộp tắt khi khác người, `title` "L, R, G+V đang do nhiều người dạy";
  - gợi ý ô gộp = người khai **một trong** L / R / W1 / W2;
  - câu dưới lưới: "Lớp FOU thường có hai giáo viên: một người L · R · G+V, một người P".
- [ ] **adapt** 375 px: không tràn; vùng bấm link ≥ 44 px.
- [ ] `npm run check` → commit `PR-Pb2-b (2): lớp FOU phân công hai ô L · R · G+V và P, có Tách từng môn`.

## B · Task 3 · Hồ sơ GV: 4 cột cố định, vai "GVCN · L R G+V", chip bàn giao, link P6 (Q31-6, Q31-5, O6, P6) — impeccable `clarify`

**Files:** `server/src/giaoVien/hoSo.ts:71-72, 152-193` (chỉ các dòng này — Hợp đồng) · `shared/domain/hoSoGiaoVien.ts` (`nhanVaiLop`) ·
`web/src/modules/giaoVien/HoSoGiaoVienPage.tsx:153-155, 162-225, 289-315, 335-345` · `server/src/classes/banGiao.ts:330` (chỉ gọi).

Hiện trạng:
- Bảng lớp thường một đầu đề "Môn · đạt / có điểm", mỗi ô có nhãn môn (`:295-307`).
- Viền xanh ô môn mình dạy: **đã có** (`MON_CUA_MINH` :57) → bỏ.
- Vai = nhiều chip rời (`hoSo.ts:71-72`).
- Chip bàn giao: chưa có.

- [ ] **Phép kiểm trước:**
  - `nhanVaiLop({ gvcn: true, mon: ['L','R','G+V'] })` = `GVCN · L R G+V`; `({ gvcn: false, mon: ['P'] })` = `P`; `({ gvcn: true, mon: [] })` = `GVCN`.
  - GVCN MB FOU 22 (`ctSeed`): lớp có `banGiao = { loai: 'gvcn', da: 0, n: 4 }` = số việc "Bàn giao n em · MB FOU 22" ở `/my-work` người đó (hai đường, cùng `viecBanGiao`).
    GVBM P lớp đó: `{ loai: 'gvbm', mon: 'P', … }` = việc "Bàn giao môn P".
  - Lớp không có lệnh → không `banGiao`.
  - `ketQuaHoSoGv` lớp thường: `o[].dong` ∈ `listening/reading/writing/speaking` (Pre FOU `tong_hop`).
- [ ] Máy chủ:
  - `lopCuaGv` trả `vai: string` = `nhanVaiLop(...)` (giữ `monDay`);
  - `hoSoGiaoVien` gọi `viecBanGiao(gvId)` **một lần**, gắn theo `lopId` (+3 câu cố định);
  - **không** sửa `locKhung`/`ct` (của Pb2-a).
- [ ] Web (**clarify**):
  - bảng lớp thường: đầu đề `L` · `R` · `W (G+V)` · `S (P)` (chú thích nổi "BE, ELE: Writing, Speaking. FOU: Grammar + Vocabulary, Pronunciation"), ô **chỉ số**, xếp theo khoá cố định; Pre FOU một ô kéo 4 cột (Q24);
  - vai một chip `GVCN · L R G+V`; chip bàn giao 12 px cạnh mã lớp, link hồ sơ lớp;
  - Q5: link Case `:340, :343` → `duongHoSoHocVien(sid, { caseId })`;
  - Q26: Quản lý / Quản trị xem → đầu khối "Case đang phụ trách" có link **"Hiệu quả PA của {tên} ›"** → `/phan-tich?goc=hieu-qua-pa&cn={cn}&gv={id}` (URL hợp đồng);
  - thẻ 375 px giữ nhãn môn theo chương trình (mockup 21 màn E).
- [ ] `tocDoDuong`: `/giao-vien/{gv}` đo lại (+≤ 3 câu).
- [ ] `npm run check` → commit `PR-Pb2-b (3): hồ sơ GV — lớp thường 4 cột cố định, vai GVCN · L R G+V, chip Bàn giao n/m em`.

## B · Task 4 · Bảng Phân tích giáo viên — máy chủ (Q30-5, Q31-9)

**Files:** tạo `shared/domain/phanTichGv.ts` · tạo `server/src/phanTich/giaoVien.ts` · `server/src/classes/phanTichLop.ts:88-122` (tách `danhGiaMon`) ·
`shared/domain/phanTich.ts:19-27` (**chỉ** thêm `'giao-vien'` — Hợp đồng) · `routes/index.ts` (khối route mới sau `/phan-tich/bo-quen`) · `tests/tocDoDuong.ts` ·
chỉ gọi: `worklist/metrics.ts` (`metricSet`, `parseObligation`), `phanTich/hieuQuaPa.ts` (`paCoKetQua`, của Pb2-a), `shared/domain/cases.ts` (`baiId`, của UXF-a).

```ts
// shared/domain/phanTichGv.ts
/** Kiểu riêng của Pb2-b (Hợp đồng): gán được cho `ChuongTrinh` trước và sau Pb2-a. */
export type KhungPtGv = 'ft' | 'thuong';
export const khungPtGvTuThamSo = (s: string | null | undefined): KhungPtGv => (s === 'thuong' ? 'thuong' : 'ft');
export const TOI_DA_TUAN_GV = 13;
export type OPtGv = { k: 'na' } | { k: 'rong' } | { k: 'so'; dung: number; tong: number };
export type HangPtGv = {
  id: number; ten: string;
  /** "R · W1 · W2 · GVCN MB FT 103" (mockup 25). */
  phu: string;
  dangDay: { lop: number; hv: number };
  chamDiem: OPtGv; ghiKetQuaPa: OPtGv;
  xuLyViPham: OPtGv & { lopGvcn?: number[] };
  paHieuQua?: OPtGv;                                        // chỉ FT
  ketQua: Record<string, OPtGv & { lop?: number[] }>;       // FT: listening reading writing1 writing2 speaking · thường: listening reading writing speaking
  tienBo?: OPtGv & { lop?: number[] };                      // chỉ FT
};
export type PhanTichGvKq = { cn: number; tenChiNhanh: string; khung: KhungPtGv; tu: string; den: string; hang: HangPtGv[] };
/** `thang=YYYY-MM` → tuần có Thứ Năm thuộc tháng; `tu`,`den` (Thứ Hai) → ≤ 13 tuần; vắng → 4 tuần tới tuần hiện tại (Q18). */
export function khoangPtGv(q: { tu?: string | null; den?: string | null; thang?: string | null }, homNay: string): { tu: string; den: string } | { loi: string };
/** "18/20" + "90%" · < 5 mục "mẫu nhỏ" · "—" · "không có". */
export function chuOPtGv(o: OPtGv): { so: string | null; phu: string | null };
/** Q19: màu từ % đã làm tròn; < 5 mục → null. Chỉ ô kết quả dùng. */
export function mauKetQuaGv(dung: number, tong: number): 'thap' | 'vua' | 'cao' | null;
```

Mỗi cột một hàm tập, nạp một lần cho chi nhánh + khung + khoảng, trả `Map<gvId, { dung: number[]; tong: number[] }>`:

| Cột | Hàm | Một mục (id) | Đúng / đạt | Nguồn đang có |
|---|---|---|---|---|
| Chấm điểm | `tapChamDiem` | `baiId(attemptId, skill)` | `nhap_dau_ngay ≤ hạn`; chưa nhập mà `hôm nay > hạn` = trễ | `skillCells` / `regularSkillViews` + `loadBundle`, như `scoreDebt.ts:70-92` |
| Ghi kết quả PA | `tapGhiKetQuaPa` | id nghĩa vụ | `numeratorIds` | `metricSet(p, 'dung-han-cap-nhat', { branchId, program: khung, from, to })` → `parseObligation` → Case → người phụ trách |
| Xử lý vi phạm | `tapXuLyViPham` | `violations.id` (`valid = 1`, `han_xu_ly` trong khoảng) | `phan_hoi_ngay ≤ han_xu_ly`; chưa phản hồi mà `hôm nay > hạn` = trễ | cột Task 1 + GVCN hiệu lực |
| PA hiệu quả (FT) | `paCoKetQua({ …, ct: khung, tu, den })` lọc `!quyChe` | id PA | nhóm "success" | **Pb2-a** Task 3 |
| Kết quả môn | `tapKetQuaMon` | `baiId` ô có điểm | `danhGiaMon` (FT: band ≥ kỳ vọng; thường: môn ≥ 70 %) | tách từ `phanTichLop.ts:94-121` |
| HV tiến bộ (FT) | `tapTienBo` | `baiId` | band > band bài trước (Q21) | điểm lượt MT trước (một câu theo lô) |
| Đang dạy | `dangDay` | lớp · em | — | phân công hiệu lực + `enrollments` (như `bangGvChiNhanh` :305-321) |

- [ ] **Phép kiểm trước** (seed + dữ liệu dựng trong phép kiểm):
  - Luật thuần:
    - `khoangPtGv({ thang: '2026-09' })` = W1 SEP – W4 SEP (31/08 – 21/09); 14 tuần → `loi`; vắng → 4 tuần tới tuần 14/09;
    - `chuOPtGv` bốn dạng;
    - `mauKetQuaGv(12, 21)` vàng, `(8, 21)` đỏ, `(13, 17)` xanh, `(3, 4)` null;
    - `khungPtGvTuThamSo('ca-hai')` = `'ft'`.
  - **Chấm điểm, hai đường**:
    - ô `n/m` = số dòng `/phan-tich/giao-vien/cham-diem?gv=X` (m) và số dòng "Trễ" (m − n);
    - nhập đúng hạn rồi sửa sau hạn → đúng hạn;
    - quá hạn chưa nhập → trễ; tuần sau chưa nhập → không có mặt;
    - vắng / "-" / huỷ / MT lịch sử / em Tạm dừng → không có mặt;
    - đổi phân công giữa khoảng → gán theo người ở hạn nhập;
    - chéo UXF-a: "chưa nhập & trễ" ⊇ `noDiemCuaGv(...).filter(overdue)` (quy về `baiId`), lớp đang dạy trong khoảng.
  - **Ghi kết quả PA**: Σ `tong` các GV + nghĩa vụ Case không người phụ trách = `metricSet('dung-han-cap-nhat').n` cùng khoảng.
  - **Xử lý vi phạm**: chỉ GVCN lớp vi phạm có mục, GVBM `na`; gửi đề xuất trước hạn, QL duyệt sau hạn → đúng hạn.
  - **PA hiệu quả** (sau khi có Pb2-a): ô = `hieuQuaPa({ gv, tu, den, ct: 'ft' }).gvThem.tomTat`.
  - **Kết quả**: GV L MB FT 101 → ô L = số em có điểm L, tuần thi trong khoảng; GV R → cột L `na`; em chuyển lớp vẫn tính cho người dạy lúc thi; KCK không tính.
  - **HV tiến bộ**: MT2 L 6.0, MT1 L 5.5 → tiến bộ; chỉ MT1 → không có mặt.
  - Lớp thường: không `paHieuQua`, `tienBo`; `ketQua` đúng 4 khoá; FOU G+V ở `writing`.
  - Sắp theo tên (`localeCompare('vi')`); không hàng tổng; GV không phân công trong khung + khoảng → không có hàng.
  - **Phủ định**: GVCN / GVBM → 403; QL CP xem `cn` = MB → 403; Quản trị không `cn` → 400; 14 tuần → 400.
  - **Không N+1**: số câu SQL `/phan-tich/giao-vien` **bằng nhau** khi chi nhánh có thêm 3 GV + 2 lớp.
- [ ] Máy chủ:
  - `danhGiaMon(a, scores, prog, mucTieu)` tách nguyên thân từ `phanTichLop` (`phanTichLop` gọi lại nó);
  - `phanTichGiaoVien(p, f)` + `oChamDiemGv(p, f & { gv })` (dòng panel: học viên, lớp · bài · kỹ năng, tuần thi, hạn, ngày nhập đầu, số ngày trễ; trễ trước rồi lớp, tên);
  - quyền như `bangGvChiNhanh:291-295` (`MEETING_VIEW`);
  - `baiId`: UXF-a đã merge → import; chưa → chép **nguyên văn** hàm của kế hoạch UXF-a Task 5 vào `shared/domain/cases.ts`, ghi Nhật ký;
  - route `GET /phan-tich/giao-vien?cn=&ct=&tu=&den=|thang=`, `GET /phan-tich/giao-vien/cham-diem?…&gv=`;
  - **cột "PA hiệu quả" làm sau cùng**: `paCoKetQua` có trên `main` thì cổng gộp rồi nối; chưa có thì trả `paHieuQua` rỗng tạm, phép kiểm cột này đánh dấu chờ, ghi Nhật ký — **Task 7 không mở PR khi cột này còn tạm**.
- [ ] `tocDoDuong`: `QL`/`QT` × `/phan-tich/giao-vien?cn={cn}&ct=ft`, `…&ct=thuong&thang=2026-09`, `/phan-tich/giao-vien/cham-diem?cn={cn}&ct=ft&gv={gv}`; `GVCN` `maChuDich: 403`.
- [ ] `npm run check` → commit `PR-Pb2-b (4): bảng Phân tích giáo viên — máy chủ, mỗi cột một hàm tập, không N+1`.

## B · Task 5 · Bảng Phân tích giáo viên — web (mockup 25 màn A–D) — impeccable `clarify`, `layout`, `adapt`

**Files:** tạo `web/src/modules/phanTich/PhanTichGiaoVien.tsx` · `web/src/modules/phanTich/PhanTich.tsx` (**đúng ba chỗ** — Hợp đồng) · `web/src/ui/CongTacKhung.tsx` (thêm trang `'phan-tich-gv'`) ·
`web/src/modules/classes/PhanTichLopTab.tsx:21-23` · `web/src/modules/classes/ClassOverviewPage.tsx:33, 98`.

- [ ] Khung:
  - góc nhìn **"Giáo viên"** cuối hàng (người có `nav.analysis`);
  - `PhanTichGiaoVien` **tự vẽ bộ lọc riêng**:
    - Chi nhánh (Quản trị bắt chọn; thiếu → `Empty` "Chọn một chi nhánh");
    - Khung `CongTacKhung` trang `'phan-tich-gv'` (không "Tất cả"), đọc/ghi URL `ct` qua `khungPtGvTuThamSo`;
    - Khoảng `Theo tuần` (`ChonTuan` từ – đến) · `Theo tháng` (`ChonThang` + mã tuần phụ) (`ui/ChonNgay.tsx:40, 55`);
  - URL `tu`, `den` | `thang`;
  - bộ lọc chung của Phân tích **ẩn** ở góc này (Hợp đồng, chỗ 3).
- [ ] Bảng FT (1440) màn A:
  - Giáo viên dính trái (tên → `/giao-vien/{id}`, dòng phụ `phu`) · Đang dạy · **Đúng hạn** (Chấm điểm · Ghi kết quả PA · Xử lý vi phạm) · PA hiệu quả · **Kết quả môn mình dạy** L R W1 W2 S · HV tiến bộ;
  - ô `n/m` trên, `%` 12 px dưới (hoặc "mẫu nhỏ"); "—" / "không có" `text-faint`;
  - **chỉ % ô kết quả** tô `text-bad` / `text-soon` / `text-ok` (không thanh, Q27);
  - chú giải một dòng; không nút sắp, không hàng tổng.
- [ ] Bảng lớp thường màn B: "Ghi kết quả PA" **mờ** (`text-slate-400`); Kết quả 4 cột `L · R · W (G+V) · S (P)`.
- [ ] Đầu đề 2–3 chữ + **chú thích nổi** (**clarify**, chữ theo cột "Một mục là" / "Tử số" của mockup): `tabIndex=0`, `aria-describedby`,
  hiện khi rê chuột **và** Tab tới (`group-hover` + `group-focus-within`); không dùng `title` một mình.
- [ ] Bấm số (Q22, URL hợp đồng):
  - Đang dạy → `/giao-vien/{id}`;
  - **Chấm điểm → panel** (`KhungPanel`) màn C: `Tất cả n · Trễ k`, trễ trước, tick SVG 12 px, "Trễ 3 ngày" / "chưa nhập · tới hôm nay 01/10", "sửa 26/09 · lần sửa không tính", chân "Mở Lịch Test ›";
  - Ghi kết quả PA → `/cong-viec?nguoi={id}&nhom=case-hoc-thuat&khung={ct}&cn={cn}`;
  - Xử lý vi phạm → hồ sơ lớp `?tab=y-thuc` / `/phan-tich?goc=y-thuc&cn=`;
  - PA hiệu quả → `/phan-tich?goc=hieu-qua-pa&cn={cn}&ct=ft&gv={id}&tu={tu}&den={den}`;
  - Kết quả / HV tiến bộ → `/hoc-vien/lop/{id}?tab=phan-tich&ky-nang={khoá}` hoặc `/giao-vien/{id}`.
- [ ] `PhanTichLopTab`: `useState(params.get('ky-nang'))` mở sẵn dòng + cuộn tới; khoá lạ bỏ qua.
- [ ] **adapt** 375 px (màn D): mỗi GV một `TheDong`; dòng không áp dụng **ẩn**; số bấm được; không cuộn ngang trang.
- [ ] **layout**: `table-layout: fixed`, cột thẳng, `tabular-nums`, `table-scroll` ≥ 1000 px, cột tên dính trái (mỗi nhóm một bảng nếu cần — memory "bẫy sticky").
- [ ] `npm run check` → commit `PR-Pb2-b (5): bảng Phân tích giáo viên — web, panel Chấm điểm, bấm số mở trang đã lọc, thẻ 375`.

## B · Task 6 · Dữ liệu demo cho bảng giáo viên (D18)

**Files:** tạo `server/src/seed/pb2bSeed.ts` · `server/src/seed/seed.ts` (gọi `buildPb2bDemo` sau `buildCtDemo`, trước phần bù Task 1) · `DEMO.md` (một mục D18).

- [ ] Dựng qua **chính hàm nghiệp vụ** (như `ctSeed.ts`); chỉnh ngày bằng SQL khi cần. Chi nhánh MB, W1 SEP – W3 SEP:
  - 5–7 GV FT đủ dạng ô: đúng hạn, trễ, **sửa sau hạn nhưng lần đầu đúng hạn**, quá hạn chưa nhập, "mẫu nhỏ", "—", "không có";
  - kết quả đủ ba màu;
  - một GVCN có vi phạm xử lý đúng hạn và trễ;
  - PA GV thêm có kết quả cuối;
  - **lớp FOU hai GV**: một người L · R · G+V kiêm GVCN, một người P dạy thêm một lớp FOU khác (mockup 25 màn B).
- [ ] **Phép kiểm trước**:
  - bảng MB FT tháng 09/2026 ≥ 5 hàng, có đủ dạng ô (`so` ≥ 5, `so` < 5, `na`, `rong`), ba màu;
  - bảng lớp thường có lớp FOU hai GV;
  - panel Chấm điểm một GV có ≥ 1 dòng trễ và 1 dòng "sửa sau".
- [ ] `npm run check` → commit `PR-Pb2-b (6): demo bảng Phân tích giáo viên (D18) + lớp FOU hai giáo viên`.

## B · Task 7 · Bấm thử, `audit` + `polish`, `/ponytail-review`, mở PR

- [ ] **Cổng gộp bắt buộc có Pb2-a trên `main`** (+ UXF-a nếu đã merge) → gỡ theo Hợp đồng:
  - `GOC_NHIN`;
  - ba chỗ `PhanTich.tsx`;
  - `run.ts` / `tocDoDuong.ts` / `routes` / `CODE_MAP.md` giữ cả hai;
  - UXF-a đã merge → bỏ bản `baiId` chép, giữ một.
  Sau gộp: nối cột "PA hiệu quả" nếu còn tạm → `npm run check`.
- [ ] KIỂM B theo vai QL (id 2), Quản trị (id 1), GVCN lớp FOU, GVBM. Ảnh `thiet-ke/anh/pr-pb2b/{muc}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] impeccable **`audit`**, rồi **`polish`** (sáng **và** tối): 12 px, mã tuần, màu % chỉ ở ô kết quả, chú thích nổi mở được bằng Tab.
- [ ] `/ponytail-review`; liệt kê `ponytail:` mới.
- [ ] Tắt 4197/5397; quét `tests/run.js` treo của worktree này.
- [ ] Mở PR (không draft, không merge). Thân PR:
  - bảng mục → ảnh → đạt;
  - mốc B → số cuối;
  - trần tốc độ;
  - migrate 3 cột;
  - "Chuyển cho PR khác";
  - `ponytail:`;
  - dòng "**merge sau Pb2-a**".

### KIỂM B

| # | Vai | Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| B1 | QL | Hồ sơ lớp MB FOU (lớp mới) › ⋮ Sửa phân công | xem, "Tách từng môn" | mặc định 2 ô; tách ra 4 ô; lưu hai người → hồ sơ GV đúng vai |
| B2 | QL | Hồ sơ GV người L · R · G+V kiêm GVCN FOU | xem | vai `GVCN · L R G+V`; lớp thường L · R · W (G+V) · S (P), ô chỉ số, ô môn mình viền xanh; chip "Bàn giao n/m em" nếu có lệnh; link "Hiệu quả PA của …" |
| B3 | QL | Tổng quan › Phân tích › **Giáo viên** · FT · W1 SEP – W3 SEP | xem | sắp theo tên, không tổng, không sắp; `n/m` + % 12 px; "mẫu nhỏ"; "—" / "không có"; chỉ % kết quả có màu |
| B4 | QL | như B3 | Tab qua tên cột | chú thích nổi hiện khi rê chuột **và** Tab |
| B5 | QL | như B3 | ô Chấm điểm một GV | panel Tất cả / Trễ; số dòng = m, Trễ = m − n; dòng "sửa … · lần sửa không tính" |
| B6 | QL | như B3 | PA hiệu quả, Ghi kết quả PA, Kết quả L, Xử lý vi phạm | Hiệu quả PA có chip GV + khoảng (số khớp) · Công việc lọc người · Phân tích lớp mở sẵn dòng L · hồ sơ lớp tab Ý thức |
| B7 | QL | như B3 · Lớp thường · Theo tháng 09/2026 | xem | Ghi kết quả PA mờ; Kết quả 4 cột; FOU hai GV: người P chỉ có S (P) |
| B8 | Quản trị | Phân tích › Giáo viên | chưa chọn chi nhánh | "Chọn một chi nhánh" |
| B9 | GVCN | gõ `/phan-tich?goc=giao-vien`; API `/phan-tich/giao-vien` | mở | không thấy góc nhìn; API 403 |
| B10 | GVBM | Lịch Test | nhập một ô rồi sửa | bảng GV (QL xem) giữ ngày nhập đầu |
| B11 | mọi vai | các màn trên | 375, sáng + tối | bảng GV thành thẻ, không cuộn ngang trang; mã tuần; hạn qua `<Han>` |

---

## File chồng với PR khác (ngoài hợp đồng a ↔ b)

Đã đối chiếu kế hoạch UXF-a và VAI-a (`plans/2026-10-01-pr-vai-a-tong-quan-theo-vai.md`, bảng :72-83, Q5, Q7). VAI-b chưa có kế hoạch — ghi theo kiểm kê (c).
VAI-a đã chốt:
- Pb2(-a) merge trước;
- VAI-a bỏ `ChonChuongTrinh` ở Tổng quan (dùng `CongTacKhung`);
- Cần xử lý + Chờ duyệt không nhận `ct`;
- xoá `boQuen.ts` + route ở cổng gộp sau khi Danh sách Case đã bỏ.

| File | PR khác | Pb2-a sửa | Pb2-b sửa | Gỡ |
|---|---|---|---|---|
| `shared/domain/tongQuan.ts` | **VAI-a** (bố cục, VN05, U3 :88) · **UXF-a** (chữ :94, `dung-han` :139-142) | `CHUONG_TRINH` :12-23, bỏ `denLoc` :85, :88 | — | **Pb2-a trước VAI-a.** VAI-a xoá dòng :88 → giữ phần xoá; UXF-a khác dòng |
| `worklist/OverviewPage.tsx`, `ChonChuongTrinh.tsx`, `KhoiCanXuLy.tsx`, `BranchPulse.tsx`, `MetricTiles.tsx`, `Highlights.tsx`, `ui/SoLieu.tsx` | **VAI-a** | chỉ chỗ `'ca-hai'` + `KhoiCanXuLy.tsx:44` | — | VAI-a dựng trên kiểu mới; lấy bản VAI-a ở chỗ nó viết lại |
| `server/src/worklist/metrics.ts` | **UXF-a** (:388-421, :205-248, `rowsFor`) · **VAI-a** (:81-101 `href` hồ sơ HV — cùng đích; xoá U3 :504-506) | `metricSet` :357-358 + `CHI_SO_GOP`; `href` :85, :94, :127 | **chỉ gọi** `metricSet`, `parseObligation` | khác dòng; `href` → lấy bản VAI-a. UXF-a đổi dạng id nghĩa vụ → Pb2-b tự đúng |
| `server/src/giaoVien/hoSo.ts` · `HoSoGiaoVienPage.tsx` · `BangGiaoVienChiNhanh.tsx` | **UXF-a** (`noDiemCuaGv` :86-90, `oHoSoGv` :254-265, `bangGvChiNhanh` :290-349, hàng "Chưa phân công") | `ct` :51, :54, :94, :101, :226, :300, :310; `BangGiaoVienChiNhanh.tsx:26,31` | vai :71-72, :152-193; `HoSoGiaoVienPage.tsx` | khác thân hàm → giữ cả ba; **không đổi chữ ký** 3 hàm của UXF-a ngoài kiểu `ct` |
| `phanTich/tongHop.ts`, `vanDeHv.ts`, `shared/domain/phanTich.ts` | **UXF-a** (tooltip :233, `vanDeHv.ts:166-190`) | `tongHop.ts:97` + P4 · `vanDeHv.ts:76` · `phanTich.ts:19-70, 102-111, 150-240, 310-330` | `phanTich.ts` chỉ `'giao-vien'` | khác khối |
| `server/src/students/profile.ts` | **VAI-b** (:440-499) | `href` :190-198 | — | khác dòng |
| `shared/domain/cases.ts` (`baiId`) | **UXF-a** tạo | — | dùng (chép nguyên văn nếu UXF-a chưa merge) | PR merge sau giữ một bản |
| `routes/index.ts`, `tests/run.ts`, `tocDoDuong.ts`, `shared/domain/index.ts`, `migrate.ts`, `schema.sql`, `CODE_MAP.md` | mọi PR | chỉ thêm | chỉ thêm (+ migrate, schema) | giữ tất cả, thứ tự theo merge |

`StudentDetailPage.tsx`, `canCham.ts`, `mywork.ts`, `lenhChuyen.ts`, `TransitionPanel.tsx`: Pb2-a và Pb2-b **không sửa**.

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Giao kèo để lại |
|---|---|---|
| Cột "PA hiệu quả" + link P6 + link bảng GV tới Hiệu quả PA | **Pb2-b** (từ Pb2-a) | `paCoKetQua(l: LocPa)` + URL `goc=hieu-qua-pa&cn&ct&gv&tu&den` đúng chữ ký ở Phần A Task 3 |
| Góc nhìn "Giáo viên" | **Pb2-b** (từ Pb2-a) | `GOC_NHIN` đã bỏ `'danh-sach'`; Pb2-b thêm `'giao-vien'` ở cuối |
| Tổng quan theo vai dựng trên kiểu mới; xoá dòng "2 lần Test" + `boQuen.ts` + `/phan-tich/bo-quen` + `LOAI_BO_QUEN` (U3) | **PR-VAI-a** (từ Pb2-a) | `ChuongTrinh = 'ft' \| 'thuong'`, gộp = `null`, `chuongTrinhTuThamSo(s, macDinh)`, `CHI_SO_GOP`; `CAN_XU_LY` không còn `denLoc`; `DanhSachBoQuen.tsx` đã xoá |
| Nhận định xu hướng ở Điểm đáng chú ý — khi có 2–3 tháng dữ liệu thật | **PR-VAI-a** hoặc sau deploy | — |
| Hàng "Chưa phân công" (Q31-12), `baiId`, đơn vị "bài" | **PR-UXF-a** | Pb2-b dùng `baiId` làm id ô; UXF-a nên merge trước Pb2-b |
| Mã tuần ở Vấn đề HV (`vanDeHv.ts:361`), Bỏ quên | **PR-UXF-b** (B5) | — |
| `CaseRoutePage` còn trang cũ cho Case không học viên — xoá nếu sau reset không còn Case như vậy | **PR-Dọn** | — |
| `summary.ts:269-308` còn sinh link `/?tab=tinh-hinh…` (đã chuyển hướng đúng) | **PR-S3** | `duongMoi` giữ luật |
| Chữ chú thích nổi bảng GV vào `THUAT_NGU_DA_CHOT.md` | **PR-S3** | chữ ở `phanTichGv.ts` / `PhanTichGiaoVien.tsx` |
| `init-ban-chinh` có ba cột mới · DEMO.md kịch bản D18 đầy đủ | **PR-DEPLOY** | phép kiểm "schema.sql → migrate không làm gì" |

## Nhật ký A (Pb2-a)

| Ngày | Task | Ghi chú (mốc B, model thật, trần tốc độ, lệch kế hoạch, cổng gộp) |
|---|---|---|
| 01/10 | 0 | Model thật Opus 5.5 (`claude-opus-5-5`). Từ `origin/main` @ `4379cc63`. `npm run check` lần 1 sập Node (0xC0000409, giữa PR-GV, máy đang chạy 3 check của session khác) → chạy thẳng không qua npm: **mốc B = 1986 ✓, 0 ✗**; tốc độ 28/28 |
| 01/10 | 1 | **Lệch kế hoạch (nhỏ):** Task 1 ghi `/phan-tich/y-thuc` dùng `ctTuyChon` (hợp lệ → lọc) nhưng phép kiểm đòi "`ct=ft` và không `ct` → cùng số". Theo Q2 (Ý thức là khối gộp, công tắc khung ẩn) route Ý thức **bỏ qua `ct`** (`ct: null`); `/metrics/:id` vẫn `ctTuyChon` (chỉ số Ý thức tự bỏ khung qua `CHI_SO_GOP`). `/highlights` cũng `ctTuyChon` (GV gửi không `ct` = gộp). `bangGvChiNhanh` vẫn `chuongTrinhTuThamSo` (mặc định FT). Check lần 1: 2008 ✓ + 2 ✗ (hai phép kiểm mới) → sửa. Lần 2: **2010 ✓**; tốc độ 27/28: `/tong-quan/quan-ly` 81–83 câu (vắng `ct` nay = FT nên có lọc khung; trước đây vắng = không lọc) → trần QL 75→87 (+16 %), QT 71→87 (+22,5 %), dưới 30 %. `/highlights` 28→20, `/tong-quan/chi-nhanh` 45→40 (giảm, giữ trần) |
| 01/10 | 2 | 2014 ✓, tốc độ 28/28. Đích chuyển hướng giữ đúng Q4; `hang-doi` khác `due`/bỏ quên (vd `review` từ `summary.ts`) → Vấn đề HV |
| 01/10 | 3 | Check qua npm sập Node 2 lần (exit 9, máy tải nặng, phiên bị ngắt một lần) → chạy thẳng: **2023 ✓**, tốc độ 28/28. Hiệu quả PA 24→16 câu (giữ trần); đường mới `?gv&tu&den` 17/16 câu → trần 27/26. `NGUONG_MINI_TEST` chuyển lên `shared/domain/cuoiKhoa.ts` (ghi Mini Test, Hiệu quả PA, Tổng hợp đọc chung) thay vì xuất từ `normal/cuoiKhoa.ts`. `queryPlans` so `toDate` theo 10 ký tự ngày. Chip lọc dùng chữ `✕` như các chip lọc sẵn có (nhất quán) |
| | | |

## Nhật ký B (Pb2-b)

| Ngày | Task | Ghi chú (mốc B, model thật, trần tốc độ, lệch kế hoạch, cổng gộp, trạng thái cột PA hiệu quả, `baiId`) |
|---|---|---|
| | | |
