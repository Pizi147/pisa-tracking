# PR-Pb-gọn · Phân tích cho Quản lý theo dõi SOS và Case các chi nhánh — Kế hoạch

| Mục | Chốt |
|---|---|
| Mã PR | **PR-Pb-gọn** (phần trước deploy của PR-Pb; kiểm kê P7, P8, P10, P11, P15) |
| Đợt | **3 — trước deploy** (quyết định chủ sản phẩm 23/09 01:30) |
| Nhánh / worktree | `pr-pb-phan-tich-gon` · `.claude/worktrees/pr-pb-phan-tich-gon` |
| Cổng thử | API **4177** · Vite **5377** (không 4000/5173 và không cổng của session khác) |
| Model khuyến nghị | **Opus 5.5 · High** |
| Phương án B | **Opus 5 · XHigh** |
| Người rà | **Fable 5.1** (khác model người code) — planning gọi, session code không tự rà |
| Migrate | **Không** (chỉ đọc bảng đã có) |
| Phụ thuộc | **Merge sau PR-Pa** (bắt buộc: dùng `SoLieuO`, `ChonChuongTrinh`, `ChuongTrinh`/`thamSoCt`, `metricSet(program)` của Pa). S1, S2 đã có trên `main` |
| Route web mới | Không. Vẫn `/phan-tich` (tab Phân tích của PR-O), vẫn qua `CaseBoard` mà `OverviewPage` đang gọi |
| File KHÔNG được chạm | Xem mục "Ranh giới" |

## QUY TRÌNH NHANH (bắt buộc, thay mọi hướng dẫn quy trình khác)

- **KHÔNG** dùng `superpowers:subagent-driven-development`; **KHÔNG** rà từng Task bằng subagent. Session tự code từng
  Task, chạy `npm run check` sau mỗi Task (phải xanh, số phép kiểm **không giảm**), rồi commit. Nếu có dùng subagent:
  cùng model với session, **KHÔNG Haiku**.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375px **một lần** ở Task cuối, ảnh lưu `thiet-ke/anh/pr-pb/`.
- Không tự rà code cuối PR (planning rà bằng model khác). Cuối PR: push, mở PR, báo planning.
- Task 0: tạo worktree + nhánh từ `origin/main` mới nhất, chép file kế hoạch này vào nhánh và commit.
- Mỗi commit kết thúc bằng đúng dòng `Co-Authored-By` của **model thật** đang chạy (Opus 5.5 → `Claude Opus 5.5
  <noreply@anthropic.com>`; chạy phương án B thì ghi Opus 5).
- Máy thử: theo bộ nhớ "Máy chủ dev trong worktree" — **không** `preview_start`; API `PORT=4177`, Vite tạm cổng 5377.
- Gặp chỗ kế hoạch sai với mã thật hoặc trái đặc tả: sửa theo mã/đặc tả nếu chắc, ghi vào Nhật ký; không chắc thì dừng hỏi.

## Mục tiêu

Quản lý chi nhánh và Quản trị hệ thống mở **Tổng quan › Phân tích** là theo dõi được **kết quả Test, SOS và Case của các
chi nhánh**: một hàng chọn góc nhìn + bộ lọc chung; góc nhìn mặc định **Tổng hợp Test + SOS** (bảng lớn, mọi số bấm ra
đúng danh sách, xuất Excel); góc nhìn **Vấn đề học viên** (ma trận nhiệt kỹ năng × lớp/chi nhánh). Ba góc nhìn đang chạy
(**Danh sách Case**, **Kết quả hỗ trợ**, **Ý thức & Phối hợp**) chỉ được đưa vào hàng chọn và nhận bộ lọc chung, không làm lại.

**Nguồn** (thứ tự ưu tiên của đặc tả §0): `docs/superpowers/specs/2026-09-22-ux-toan-web-truoc-deploy-design.md` §1
(G-1…G-12), §2, **§3.3**, §6 (dòng "tỷ lệ câu đúng" gắn Pb) · mockup `thiet-ke/mockup/03b-phan-tich-v2.html` ·
`thiet-ke/THUAT_NGU_DA_CHOT.md` · kiểm kê `docs/superpowers/specs/2026-09-22-kiem-ke-truoc-deploy.md` §1.3 P7–P15 ·
`thiet-ke/HOP_DONG_SO_LIEU.md` §1 (sáu luật số liệu).

### Phạm vi theo mã việc (không chép thành việc = không tồn tại, nên ghi đủ)

| Mã | Làm ở PR này? | Ghi chú |
|---|---|---|
| P7 | **Làm** | Hàng góc nhìn: Tổng hợp Test + SOS · Vấn đề học viên · Danh sách Case · Kết quả hỗ trợ · Ý thức & Phối hợp |
| P8 | **Làm** | Ma trận nhiệt + panel `{n} học viên — {vấn đề}` |
| P8b | Không — sau deploy | 375px: cuộn ngang trong thẻ, cột đầu dính (G-11). Dạng danh sách + cột thao tác làm sau |
| P9, P9b | Không — sau deploy | "Kết quả hỗ trợ" giữ màn `IssueAnalysis` hiện có |
| P10 | **Làm** | Tổng hợp Test + SOS: 3 nhóm cột, bộ chọn cột, 4 cách xếp dòng, dòng con, dòng tổng, xuất Excel |
| P11 | **Làm** | Bỏ "Việc đã giao", "+ Giao việc", tuần giao việc, tên "Thực trạng" khỏi Phân tích |
| P12 | Không — sau deploy | |
| P13, P14 | Không — sau deploy | Ô "lớp" ẩn ở góc nhìn Ý thức (máy chủ chưa nhận `classId`) |
| P15 | **Làm** | Phối hợp SOS chia SOS 1/2/3 + sửa N+1 của `phoiHopMetric` |
| Theo giáo viên | Không — PR-GV sau deploy | Không vẽ nút chờ |
| §6 "tỷ lệ câu đúng" | **Làm** | `CaseBoardPage.tsx:44` (hàng chip Loại lớp bỏ, thay bằng chương trình chung — Task 5) · `CatalogAdmin.tsx:100` |

## Luật phải nhớ (tóm tắt — đọc bản đầy đủ ở đặc tả §1, §2)

- **G-2** số `tabular-nums`, cột số canh phải, `colgroup` cố định độ rộng · **G-3** tối đa một dòng phụ ≤ 60 ký tự ·
  **G-5** không khối chữ giải thích; luật đưa vào tooltip tiêu đề cột (`<Th hint>`) · **G-6** tuần `W3 SEP` qua
  `tuanLich()`, ngày qua `ngay()` (`shared/domain/hienThiNgay.ts`), không bao giờ ISO · **G-7** viết tắt (L R W1 W2 W S,
  SOS, HV, PA) có tooltip · **G-8** panel không chồng panel · **G-10** mọi số bấm được, mở đúng tập tạo ra số
  (`<SoLieuO nguon>` của Pa) · **G-11** 375px: bảng cuộn ngang trong thẻ, trang không cuộn ngang.
- **Hợp đồng số liệu §1:** một ô = một tập ID; số = `.size`; danh sách khi bấm = **chính tập đó**, tính lại bằng
  **cùng hàm, cùng quyền, cùng bộ lọc**; phạm vi rỗng trả rỗng; **không cộng số học viên** giữa dòng (dòng tổng = hợp
  tập, đếm duy nhất); ba loại thời gian không trộn thiếu nhãn (nhóm Xử lý = **tình trạng hiện tại**).
- **Chữ:** "Case" viết hoa; không viết "Normal" trên màn (viết **Lớp thường**); lớp thường: **Giữa khoá · Cuối khoá**,
  **Đạt / Chưa đạt**, kỹ năng **L R W S**; "Thực trạng" → không dùng; "Đang hỗ trợ" → **Đang theo dõi** (g6-074);
  "Cột theo lớp/chi nhánh" → **Theo lớp / Theo chi nhánh** (g2-013/014); "Lỗi gặp nhiều nhất" → **Lỗi phổ biến nhất**
  (g5-044); "HV có case" → **HV có Case** (g5-038); "ít mẫu" → **Ít dữ liệu** (g6-072). Không mở đầu câu bằng "Hãy".

## Ranh giới với PR khác

- **Pa (đã merge trước):** KHÔNG sửa `OverviewPage.tsx`, `MetricTiles.tsx`, `Highlights.tsx`, `BranchPulse.tsx`,
  `KhoiCanXuLy.tsx`, `WorkList.tsx`, `ChonChuongTrinh.tsx` (chỉ import), `web/src/ui/SoLieu.tsx`, `SoLieuO.tsx`
  (chỉ import), `server/src/worklist/{dashboard,highlights,mywork,tongQuan,bangChiNhanh,chuongTrinh}.ts`,
  `shared/domain/{metrics,tongQuan}.ts`. **Ngoại lệ duy nhất:** `server/src/worklist/metrics.ts` — sửa **đúng khối
  `isPhoiHopMetric`** (2 dòng, Task 4). Không thêm chỉ số mới vào sổ: bảng Tổng hợp và ma trận là **bảng**, đi đường
  `nguon` như `bangChiNhanh.ts`/`oBangChiNhanh` của Pa.
- **Qa / Qb / Rc1 / Rc2 / Form / YT2 / LT:** không chạm `StudentsPage`, `ClassOverviewPage`, `ClassRoster`,
  `StudentDetailPage`, `JourneyTimeline`, `hienThiNgay.ts` (chỉ import), `attempts.ts`, `scoring.ts`, `regular.ts`
  (chỉ import), `web/src/modules/{cham,test,fasttrack,normal}/*`, `Filters.tsx`, `CasePanel.tsx` (chỉ import),
  `SkillBoard.tsx`, `QuickReport.tsx`, `PeoplePicker.tsx`, `cases.ts`, `measures.ts`, `schema.sql`, `migrate.ts`,
  `dieuHuong.ts`, `App.tsx`.
- **File dùng chung — chỉ thêm một khối liền:** `server/src/routes/index.ts` (một khối route `/phan-tich/*` ngay sau
  `/weekly-rollup/ids`, ~`index.ts:410`), `server/src/tests/run.ts` (2 dòng cuối file, trước dòng in tổng kết),
  `shared/domain/index.ts` (+1 dòng export).
- **Của Pb (ma trận kiểm kê §5.2), sửa thoải mái:** `CaseBoardPage.tsx`, `IssueAnalysis.tsx`, `WeeklyBoard.tsx`,
  `YThucAnalysisView.tsx`, `weekly.ts`, `phoiHop.ts`, `SummaryTable.tsx`.

## Quyết định planning tự chốt (người rà kiểm lại)

| # | Câu hỏi | Chọn | Vì sao |
|---|---|---|---|
| Q1 | Thứ tự và tên góc nhìn | **Tổng hợp Test + SOS** (mặc định) · **Vấn đề học viên** · **Danh sách Case** · **Kết quả hỗ trợ** · **Ý thức & Phối hợp** | Brief: Tổng hợp mặc định. Tên theo đặc tả §3.3 ("Test + SOS", không "Mock Test" vì có lớp thường). Danh sách Case: planning sửa 23/09 (xem Q2) |
| Q2 | Bỏ gì / giữ gì ở Phân tích | **Bỏ:** bảng "Theo chi nhánh/Theo lớp" (`SummaryTable`), "+ Giao việc", ô "Tuần giao việc", "Việc đã giao". **Giữ (planning sửa 23/09):** góc nhìn **Danh sách Case** — màn hiện có (ba ô trạng thái + khối Lọc + danh sách + ngăn Case, `CaseBoardPage.tsx:257-474`), không làm lại, chỉ thành một mục trong hàng góc nhìn và nhận bộ lọc chung | Chủ sản phẩm yêu cầu rõ QL theo dõi được Case của các chi nhánh; link `?hang-doi=`/`?tinh-hinh=` từ nơi khác (vd `server/src/worklist/summary.ts:287-306`) đang trỏ vào màn này. Bỏ phần còn lại: mockup 03b không có, audit §595 (#9); bảng chi nhánh đã có ở Tổng quan (Pa); Giao việc vẫn còn ở `MeetingPage` |
| Q3 | "Kết quả hỗ trợ" | = màn `IssueAnalysis` hiện có (hạng mục → phân loại → hiệu quả PA), chỉ nhận bộ lọc chung | Brief "giữ màn hiện có, không làm lại"; P9/P9b sau deploy |
| Q4 | Bộ lọc chung đặt ở đâu | Chi nhánh = ô chi nhánh **đầu trang** có sẵn (`BranchFilter`, tham số `cn`). Hàng góc nhìn chứa: chương trình (`ChonChuongTrinh`, tham số `ct`) · khoảng thời gian (`tg`) · lớp (`lop`) | Không vẽ ô chi nhánh thứ hai (hai điều khiển cùng một việc). Không sửa `OverviewPage` (file Pa) |
| Q5 | Khoảng thời gian | **4 tuần · 8 tuần · 12 tuần · 6 tháng** (g4-031), mặc định **8 tuần** (mockup). Từ thứ Hai tuần hiện tại lùi `n−1` tuần. Áp cho Tổng hợp (tuần kế hoạch của lượt), Kết quả hỗ trợ và Ý thức (`from`). **Vấn đề học viên là hiện trạng**: ẩn ô, thay chữ "Hiện trạng · đến dd/mm" | Mockup ghi "30 ngày" cho Vấn đề, nhưng luật đang chạy (`IssueAnalysis.tsx:63-67`, HĐSL luật 5) nói hiện trạng vấn đề luôn là hiện tại; trộn là sai luật 5 |
| Q6 | Ô lớp | "Mọi lớp ▾" liệt kê lớp đang hoạt động trong phạm vi + chi nhánh + chương trình (`/ref/classes?branchId=`, lọc `scoring_mode` ở web). Đổi `cn`/`ct` làm lớp không còn hợp lệ thì xoá `lop`. **Ẩn ở Ý thức** | P14 sau deploy (máy chủ Ý thức chưa nhận lớp) |
| Q7 | Cột/hàng kỹ năng khi "Cả hai" | Hợp hai bộ: **L · R · W1 · W2 · W · S** (W = Writing lớp thường, tooltip nói rõ). Ô không áp dụng hiện "—", không bấm | Không gộp W1/W2 vào W: việc hỗ trợ phải về đúng ô (`scoring.ts:63-81`). FT: L R W1 W2 S; Lớp thường: L R W S |
| Q8 | "Dưới kỳ vọng" theo kỹ năng | FT: `failingEntrySkills(expectationFor(target_at_attempt, attempt_no), entryBandsOf(scores), skips)` — W1/W2 chỉ tính khi band Writing tổng hợp trượt (luật chủ sản phẩm 13/09, **cùng luật sinh Case**). Lớp thường: môn có `outcome === 'fail'` trong `evaluateRegular`. **Thiếu điểm ≠ chưa đạt** | Một luật với nơi sinh Case — bảng không được nói khác Case |
| Q9 | Cách xếp dòng Tổng hợp | **Theo tuần** (mặc định) · **Theo lớp** · **Theo đợt** · **Theo chi nhánh** (ẩn khi đang xem một chi nhánh hoặc phạm vi chỉ một chi nhánh). Dòng con một tầng: tuần→lớp · lớp→đợt · đợt→lớp · chi nhánh→lớp. Đợt: FT `MT1…MT5`, lớp thường `Giữa khoá` · `Cuối khoá` | Brief (thêm chi nhánh) + mockup ("tuần → lớp, lớp → đợt") |
| Q10 | Quyền của đường mới | `meeting.view` (cùng cờ `nav.analysis`, `nav.ts:14,21`). Không có → 403 "Phân tích dành cho Quản lý." Chi nhánh hỏi ngoài phạm vi → **rỗng** (không phải toàn hệ thống) | Brief: QL chỉ thấy chi nhánh trong phạm vi; GV không thấy Phân tích. `/weekly-rollup` cũ dùng `attempt.view` — giữ nguyên cho phép kiểm cũ, web thôi gọi |
| Q11 | Ô ma trận Vấn đề | **n / N**: N = HV đang học trong cột (enrollment active, không lưu trữ) **thuộc chương trình có kỹ năng đó**; n = trong N, em có **Case chưa xong** (`status != 'done'`) hạng mục đó. Dòng loại lỗi: `case_issues` vai **primary + secondary** (một em có thể 2 lỗi); Case chưa có loại lỗi → dòng "Chưa phân loại". **Lỗi phổ biến nhất** = loại lỗi nhiều HV nhất ở cột Tổng, không tính "Chưa phân loại", hoà thì theo tên | Mockup "3 / 8, 1 / 9, 1 / 12" (mẫu số giống nhau cả cột = sĩ số) và chú thích mockup "một em có thể gặp 2 lỗi" |
| Q12 | Màu nhiệt | Theo n/N: 0 → chữ mờ; < 10% → nền rất nhạt; < 25% → nhạt; < 40% → vàng nhạt; ≥ 40% → đỏ nhạt. Số vẫn in rõ | Mockup h0–h4. Chỉ để liếc, không thay số |
| Q13 | Xuất Excel | **.xlsx thật** bằng thư viện `xlsx` **đã có** trong `package.json` (chưa ai dùng), nạp động `await import('xlsx')` khi bấm. Xuất đúng các cột đang hiện, dòng chính + dòng con (thụt 2 dấu cách) + dòng tổng, dòng đầu ghi bộ lọc | CSV vỡ cột trên máy đặt dấu phân cách `;` (máy tiếng Việt). Thư viện có sẵn nên không tốn gì |
| Q14 | "Cột hiện ▾" | Bật/tắt **3 nhóm** (Kết quả · Dưới kỳ vọng · Xử lý), nhớ bằng `localStorage` (bọc try/catch; lỗi thì hiện đủ) | P10 "bộ chọn cột"; theo nhóm cho gọn |
| Q15 | P15 hiển thị | Ô "Lượt SOS" có một dòng phụ `SOS 1 · n  SOS 2 · n  SOS 3 · n`, mỗi số bấm được (`SoLieuO id="phoi-hop-luot-sos" extra={{kind:'sos1'}}`) | Đúng G-3 (một dòng phụ); không thêm ba ô to |
| Q16 | Đường dẫn cũ | `?xem=tuan` → Tổng hợp (xoá `xem`); `goc=y-thuc` giữ; **`goc=danh-sach`, hoặc có `hang-doi` / `tinh-hinh` / `ky-nang` → Danh sách Case, GIỮ nguyên các tham số đó** (chúng là bộ lọc của màn); `loai-lop=normal|ft` → đổi thành `ct=thuong|ft` (xoá `loai-lop`) | Không sửa `dieuHuong.ts` (PR-O): `/tong-hop-tuan` đã được chuyển thành `/phan-tich?xem=tuan` |
| Q17 | Một định nghĩa cho sáu cột Kết quả và trạng thái Xử lý | Tách hai hàm thuần `phanLoaiLuot` và `trangThaiXuLy` ra `server/src/phanTich/tongHop.ts`; `weekly.ts:190-209` và `:245-252` gọi lại chúng | HĐSL luật 1: không có hai đường đếm cùng một thứ |
| Q18 | Nhãn | Cột lượt: FT **Lượt MT**, lớp thường **Bài kiểm tra**, Cả hai **Lượt**. Nhóm: **Kết quả Test (đếm lượt)** · **Dưới kỳ vọng theo kỹ năng (đếm HV)** (lớp thường **Chưa đạt theo môn (đếm HV)**, Cả hai **Dưới kỳ vọng · chưa đạt (đếm HV)**) · **Xử lý (tình trạng hiện tại)**. Cột: Đạt · SOS 1 · SOS 2 · SOS 3 · Tạm thời · Chưa đủ điểm · HV có Case · Case · Đang xử lý · Thiếu PA học thuật | Mockup + THUAT_NGU g5-032…034, g5-038, g6-059, g6-065 |
| Q19 | Chương trình của một lượt | Theo lớp của lượt (`classes.is_fast_track`), như `chuongTrinh.ts` của Pa. Lượt không có lớp chỉ có mặt ở "Cả hai" | Một định nghĩa chương trình cho cả web |

## Bản đồ file

| File | Tạo/Sửa | Việc |
|---|---|---|
| `shared/domain/phanTich.ts` | Tạo | Góc nhìn, khoảng thời gian, cột Tổng hợp, kỹ năng theo chương trình, nhãn đợt, mức nhiệt, `tuDauKhoang`, kiểu dữ liệu trả về, `bangXuatTongHop` |
| `shared/domain/index.ts` | +1 dòng | `export * from './phanTich.ts';` |
| `server/src/phanTich/tongHop.ts` | Tạo | Lõi tập ID Tổng hợp + `tongHop` + `oTongHop` + hai hàm thuần Q17 |
| `server/src/phanTich/vanDe.ts` | Tạo | `maTranVanDe` + `oVanDe` |
| `server/src/worklist/weekly.ts` | Sửa nhỏ | Gọi `phanLoaiLuot` / `trangThaiXuLy` (Q17); phần khác giữ nguyên |
| `server/src/yThuc/phoiHop.ts` | Sửa | P15 `byKind` + lọc `kind`; bỏ N+1 |
| `server/src/worklist/metrics.ts` | Sửa 2 dòng | Khối `isPhoiHopMetric`: truyền `kind`, trả `byKind` |
| `server/src/routes/index.ts` | +1 khối | `GET /phan-tich/tong-hop`, `/phan-tich/tong-hop/o`, `/phan-tich/van-de`, `/phan-tich/van-de/o` |
| `server/src/tests/phanTich.tests.ts` | Tạo | Phép kiểm PR-Pb |
| `server/src/tests/run.ts` | +2 dòng cuối | Gọi `runPhanTichTests` |
| `web/src/modules/phanTich/PhanTich.tsx` | Tạo | Khung: hàng góc nhìn + bộ lọc chung + chọn view |
| `web/src/modules/phanTich/TongHopTestSos.tsx` | Tạo | Bảng Tổng hợp + Cột hiện + Xuất Excel |
| `web/src/modules/phanTich/VanDeHocVien.tsx` | Tạo | Ma trận nhiệt |
| `web/src/modules/cases/CaseBoardPage.tsx` | Sửa lớn | `CaseBoard` chỉ còn render `<PhanTich />`; phần danh sách Case tách thành `DanhSachCase` (cùng file); giữ `CaseRoutePage` |
| `web/src/modules/cases/IssueAnalysis.tsx` | Sửa | Nhận bộ lọc chung |
| `web/src/modules/yThuc/YThucAnalysisView.tsx` | Sửa | Nhận bộ lọc chung; SOS 1/2/3 |
| `web/src/modules/worklist/WeeklyBoard.tsx`, `SummaryTable.tsx` | Xoá | Không còn ai import (đã grep: chỉ `CaseBoardPage.tsx:8-9`) |
| `web/src/modules/platform/CatalogAdmin.tsx:100` | Sửa chữ | "chấm theo tỷ lệ câu đúng" → "chấm theo số câu đúng / tổng số câu" |
| `CODE_MAP.md` | Sửa | Dòng Phân tích |

---

### Task 0: Chuẩn bị

- [ ] `git fetch origin`; kiểm `git log --oneline origin/main | grep -i "pr-pa"` có commit merge PR-Pa. **Chưa có → dừng,
  báo planning** (kế hoạch dựa trên mã của Pa).
- [ ] Tạo worktree `.claude/worktrees/pr-pb-phan-tich-gon`, nhánh `pr-pb-phan-tich-gon` từ `origin/main`; `npm ci` nếu
  thiếu `node_modules`. Không checkout nhánh khác ở thư mục chính.
- [ ] Kiểm không có biến Turso (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BAN_CHINH`, `PISA_CHO_PHEP_*`) trong môi trường.
- [ ] `npm run check` → ghi số phép kiểm vào Nhật ký, gọi là **B** (≥ 779 cộng phần Pa/Qa/Rc1 đã merge).
- [ ] Chép file kế hoạch này vào `docs/superpowers/plans/` của nhánh; commit `PR-Pb: kế hoạch`.
- [ ] Đọc nhanh (không sửa) để đối chiếu con trỏ: `CaseBoardPage.tsx`, `IssueAnalysis.tsx`, `WeeklyBoard.tsx`,
  `YThucAnalysisView.tsx`, `server/src/worklist/weekly.ts`, `server/src/worklist/bangChiNhanh.ts` (mẫu `tinh`/`o…`),
  `web/src/ui/SoLieuO.tsx` (mẫu `nguon`), `server/src/yThuc/phoiHop.ts:335-359`. Số dòng trong kế hoạch đo trên `main`
  @ `37786fd` + nhánh Pa; lệch vài dòng là bình thường.

### Task 1: Luật thuần `shared/domain/phanTich.ts`

**Files:** tạo `shared/domain/phanTich.ts`, `server/src/tests/phanTich.tests.ts`; +1 dòng `shared/domain/index.ts`;
+2 dòng cuối `server/src/tests/run.ts` (theo mẫu `runKhungTests`, `run.ts:~9458`, dùng kiểu `YThucTestKit`).

**Việc:**
- `GOC_NHIN = ['tong-hop','van-de','danh-sach','ket-qua','y-thuc']` + `GOC_NHIN_LABEL` (Q1); `gocNhinTuThamSo(params)` áp Q16
  (trả `{ goc, boThamSo: string[] }` — các tham số cũ cần xoá khỏi URL).
- `KHOANG = [4, 8, 12, 26]`, nhãn `4 tuần · 8 tuần · 12 tuần · 6 tháng`, mặc định 8; `khoangTuThamSo(s)`;
  `tuDauKhoang(homNay, soTuan)` = `mondayOfDate(homNay)` lùi `7*(soTuan-1)` ngày (dùng `shared/domain/week.ts:22`).
  Máy chủ và web cùng dùng hàm này (một mốc "từ ngày" cho mọi góc nhìn).
- `kyNangTheoCt(ct)`: `ft` → `FT_CASE_CATEGORIES`; `thuong` → `NORMAL_CASE_CATEGORIES`; `ca-hai` → `listening, reading,
  writing1, writing2, writing, speaking` (Q7). Nhãn ngắn qua `CASE_CATEGORY_SHORT`, tooltip qua `CASE_CATEGORY_LABEL`
  (W lớp thường: "Writing (lớp thường)").
- `THEO_DONG = ['tuan','lop','dot','cn']` + nhãn "Theo tuần · Theo lớp · Theo đợt · Theo chi nhánh"; `nhanDot(kind,
  attemptNo)` → `MT{n}` / `Giữa khoá` / `Cuối khoá`; `khoaDot(kind, attemptNo)` → `mt:{n}` / `giua` / `cuoi`; thứ tự
  sắp: MT1…MT5, Giữa khoá, Cuối khoá.
- `COT_TONG_HOP`: danh sách cột có `{ khoa, nhom: 'ket-qua'|'ky-nang'|'xu-ly', donVi, nhan(ct), goiY }`. Khoá cột:
  `luot, dat, sos1, sos2, sos3, tamThoi, chuaDu` (đơn vị `dot-test`) · `kn:<category>` (đơn vị `hoc-vien`, sinh từ
  `kyNangTheoCt`) · `hvCoCase` (`hoc-vien`) · `case, dangXuLy, thieuPa` (`case`). Nhãn, nhóm theo Q18. `goiY` là tooltip
  tiêu đề cột — chép ý từ `WeeklyBoard.tsx:40-72` (đã đúng nghĩa), sửa chữ theo luật chữ; ghi rõ "sáu cột Kết quả cộng
  lại đúng bằng cột Lượt" và "Xử lý là tình trạng hôm nay của Case sinh từ các lượt trong dòng".
- `mucNhiet(n, N): 0|1|2|3|4` theo Q12 (N = 0 → 0).
- Kiểu trả về dùng chung máy chủ ↔ web: `TongHopKetQua` (`{ theo, ct, cot: string[], hang: DongTongHop[], tong:
  Record<string, number>, scopeEmpty }`, `DongTongHop = { khoa, nhan, phu?, o: Record<string, number>, con?:
  DongTongHop[] }`) và `MaTranVanDe` (xem Task 3).
- `bangXuatTongHop(kq, cotHien, moTaBoLoc): (string|number)[][]` — mảng hai chiều cho Excel: dòng 1 `Tổng hợp Test + SOS
  · {moTaBoLoc}`, dòng trống, hai dòng tiêu đề (nhóm, cột), dòng chính, dòng con thụt `"  "`, dòng `Tổng`.

**Phép kiểm (≥ 6):** `tuDauKhoang('2026-09-23', 8) === '2026-08-03'` (thứ Hai 21/09 lùi 7 tuần);
`kyNangTheoCt` đúng ba bộ; `mucNhiet` đủ 5 ngưỡng + N = 0; `gocNhinTuThamSo` cho `?xem=tuan` (→ tong-hop, bỏ `xem`),
`?goc=danh-sach&hang-doi=due` và `?hang-doi=review` và `?tinh-hinh=no_plan` (→ danh-sach, **không** bỏ tham số),
`?loai-lop=normal` (→ `ct=thuong`), `?goc=y-thuc`; `nhanDot`/thứ tự đợt; `bangXuatTongHop` bỏ đúng nhóm cột ẩn, có dòng con thụt,
dòng tổng cuối, không lộ khoá kỹ thuật (`kn:`), không ISO.

**Xong khi:** `npm run check` xanh, B + mới. Commit `PR-Pb (1): luật thuần Phân tích`.

### Task 2: Máy chủ — Tổng hợp Test + SOS

**Files:** tạo `server/src/phanTich/tongHop.ts`; sửa `server/src/worklist/weekly.ts`; +khối route; phép kiểm.

**Việc:**
1. **Hai hàm thuần (Q17)** trong `tongHop.ts`, chép nguyên luật hiện có:
   - `phanLoaiLuot({sosLevel, complete})` → `'dat'|'sos1'|'sos2'|'sos3'|'tamThoi'|'chuaDu'` đúng thứ tự xét của
     `weekly.ts:200-208` (chưa đủ điểm: `sosLevel === null` → chuaDu, còn lại → tamThoi; đủ điểm: null → chuaDu, 0 → dat,
     1/2/≥3 → sos1/2/3).
   - `trangThaiXuLy({supportDone, status, disposition, ivCount}, today)` → `'dangXuLy'|'thieuPa'|null` đúng
     `weekly.ts:248-250` (`supportDone <= today` → dangXuLy; không thì `isNoPlanCase` → thieuPa).
   - Sửa `weekly.ts:200-208` và `:248-250` gọi hai hàm này. Phép kiểm cũ mục "15. Tổng hợp theo tuần"
     (`run.ts:~2152-2230`) phải xanh nguyên, không sửa.
2. **Lõi** `tapTongHop(p, f: { branchId, ct, soTuan, classId, theo })`:
   - Quyền: `scopeFor(p, PERMISSIONS.MEETING_VIEW)`; `none` → `forbidden('Phân tích dành cho Quản lý.')`. Lọc lớp bằng
     `classScopeSql(scope)`; thêm `c.branch_id = ?`, `c.id = ?` (lớp), `c.is_fast_track = ?` (ct ≠ ca-hai, Q19). Cửa sổ
     `rp.week_start BETWEEN tuDauKhoang(today, soTuan) AND mondayOf(today)` (`soTuan` kẹp 1…52).
   - **Một câu** lấy lượt (mẫu `weekly.ts:137-147`) — thêm `c.code, c.branch_id, b.name AS branch_name, c.is_fast_track`
     (LEFT JOIN `branches b`). `loadBundle(ids)` + `allProgrammes()` một lần. Lượt "đã chấm" = câu `scored` như
     `weekly.ts:157-170` (lô 400).
   - Mỗi lượt đã chấm: `ev = evaluateAttemptRow(a, bundle, programmes)` → `phanLoaiLuot`; **kỹ năng dưới kỳ vọng**
     theo Q8: FT (`prog?.scoringMode !== 'ratio'`) → `failingEntrySkills(expectationFor(a.target_at_attempt,
     a.attempt_no), entryBandsOf(bundle.scores.get(a.id) ?? []), bundle.skips.get(a.id) ?? [])`; lớp thường →
     `evaluateRegular(prog.skills, scores).skills.filter(s => s.outcome === 'fail')`, mã môn qua
     `LEGACY_REGULAR_SKILL_MAP`. Thêm `student_id` vào tập `kn:<skill>` của dòng (đếm **học viên**).
   - Case: **một câu** (lô 400) như `weekly.ts:232-253` nhưng lấy `a.id AS attempt_id` thay `planned_period_id`; Case vào
     dòng của **lượt sinh ra nó**; tập `case`, `hvCoCase` (student_id), `dangXuLy`/`thieuPa` qua `trangThaiXuLy`.
   - Khoá dòng từ lượt: `tuan` → `planned_period_id` (nhãn `tuanLich(week_start)`, phụ `dd/mm–dd/mm` + " · tuần này");
     `lop` → `class_id` (nhãn mã lớp, phụ tên chi nhánh khi xem nhiều chi nhánh); `dot` → `khoaDot`; `cn` → `branch_id`.
     Dòng con (Q9): tuần→lớp, lớp→đợt, đợt→lớp, cn→lớp; khoá con `"{khoaCha}|{khoaCon}"`.
   - Chỉ giữ dòng (và dòng con) có `luot > 0 || case > 0` (luật "chỉ hiện dòng có dữ liệu", `weekly.ts:273-282`).
     Sắp: tuần mới nhất trước; lớp theo chi nhánh rồi mã; đợt theo Task 1; chi nhánh theo id.
   - **Dòng tổng = hợp các tập** (đếm duy nhất), không cộng số. Tập lượt/Case vốn rời nhau nên tổng = tổng các dòng;
     cột học viên thì không.
3. `tongHop(p, f)` → `TongHopKetQua` (số = `.size`). `oTongHop(p, f & {khoa, cot})`: tính lại bằng **chính
   `tapTongHop`**, tìm dòng/dòng con/`tong`, trả `{ n, tieuDe, rows: rowsFor(donVi, ids) }`; `tieuDe` =
   `"{n} {METRIC_UNIT_LABEL[donVi]} — {nhãn cột} · {nhãn dòng}"`. Cột/khoá lạ → `badRequest`.
4. Route (một khối, sau `/weekly-rollup/ids`): `GET /phan-tich/tong-hop` nhận `branchId, ct, tg, lop, theo`;
   `GET /phan-tich/tong-hop/o` thêm `khoa, cot`. `maybeSimulateReadError()` như các route đọc khác. Parse `ct` bằng
   `chuongTrinhTuThamSo`, `tg` bằng `khoangTuThamSo`.

**Tốc độ (Turso — mỗi câu SQL một vòng mạng):** số câu SQL của `tongHop` **không phụ thuộc số lượt/số dòng** (chỉ theo
lô 400): 1 câu lượt + `loadBundle` + 1 câu `scored` + 1 câu Case (+ `allProgrammes`). Không có câu nào trong vòng lặp
theo lượt/Case/dòng. `oTongHop` chạy lại lõi một lần mỗi cú bấm (chấp nhận, như `oBangChiNhanh`).

**Phép kiểm (≥ 10):**
- Mỗi dòng và dòng con, mọi cách xếp, mọi `ct`: `dat+sos1+sos2+sos3+tamThoi+chuaDu === luot`.
- Tổng `luot` và tổng `case` **bằng nhau** giữa bốn cách xếp dòng; dòng con của một dòng cộng lại = dòng đó (lượt, Case).
- Cột học viên ở dòng tổng = số em **duy nhất** (so với hợp tính lại bằng SQL độc lập) và ≤ tổng các dòng.
- `oTongHop` với vài ô bất kỳ (gồm `tong`, một dòng con, một `kn:`): `n` = số trong bảng, `rows.length === n`.
- `ct='thuong'`: không có cột `kn:writing1`/`kn:writing2`; `ct='ft'`: không có `kn:writing`; mọi lượt trong
  `oTongHop(...,'luot')` thuộc lớp đúng chương trình.
- Q8: chọn một lượt FT trong seed có W1 < kỳ vọng mà band Writing đạt → em **không** có ở `kn:writing1`; (nếu seed không
  có ca này thì tạo trong phép kiểm bằng `conn` rồi dọn).
- Quyền: `P.coreTeacher` → ném 403; `P.mbManager` hỏi `branchId` của CP → mọi số 0, `hang` rỗng; `P.mbManager` mặc định →
  mọi lượt thuộc lớp chi nhánh MB (kiểm qua `oTongHop(... 'tong','luot')`).
- **Không N+1:** đếm `conn.prepare` (chép helper `demCauHoi` của `anToan.tests.ts:41-49`) khi gọi `tongHop(P.admin,
  {theo:'lop', soTuan: 4})` và `soTuan: 26` → **bằng nhau** và ≤ 12.

**Xong khi:** `npm run check` xanh. Commit `PR-Pb (2): máy chủ Tổng hợp Test + SOS — 4 cách xếp dòng, cột kỹ năng, mọi ô mở đúng tập`.

### Task 3: Máy chủ — Vấn đề học viên (ma trận)

**Files:** tạo `server/src/phanTich/vanDe.ts`; +2 route trong khối Task 2; phép kiểm.

**Việc:**
- `maTranVanDe(p, f: { branchId, ct, classId, cot: 'lop'|'cn' })`, quyền như Task 2 (Q10). Ba câu SQL (lô 400):
  1. HV đang học trong phạm vi: `enrollments e (status='active') JOIN classes c (status='active') JOIN students s
     (archived_at IS NULL) JOIN branches b LEFT JOIN programmes pg`, lọc `classScopeSql`, chi nhánh, lớp, `ct`
     (`c.is_fast_track`). Chương trình của lớp → bộ kỹ năng (`caseCategoriesFor(pg.scoring_mode)`).
  2. Case chưa xong của các em đó: `SELECT id, student_id, category, topic FROM sos_cases WHERE status != 'done' AND
     student_id IN (…)`; hạng mục = `category ?? categoryOf(topic)` (như `effectiveness.ts:421`).
  3. `SELECT case_id, taxonomy_code FROM case_issues WHERE role IN ('primary','secondary') AND case_id IN (…)`.
- Cột: `cot='lop'` → mỗi lớp một cột (nhãn mã lớp); `cot='cn'` → mỗi chi nhánh một cột. Mỗi (kỹ năng, cột): **N** =
  HV đang học trong cột ở lớp có kỹ năng đó; **n** = trong N, em có Case chưa xong hạng mục đó (Q11). Không áp dụng →
  `null`. Dòng loại lỗi: với mỗi `taxonomy_code`, em trong N có Case chưa xong hạng mục đó mang mã ấy; Case chưa xong
  không có mã nào → dòng `__chua-phan-loai__` ("Chưa phân loại"). Nhãn loại lỗi: `issueLabel(code)`.
- Cột **Tổng** = hợp các cột (đếm duy nhất); **Lỗi phổ biến nhất** theo Q11 (`{ code, nhan, n } | null`). Sắp dòng
  kỹ năng theo `kyNangTheoCt(ct)`; dòng con theo n giảm dần, "Chưa phân loại" cuối.
- Trả `MaTranVanDe = { cot, cotDs: {khoa, nhan}[], hang: { kn, nhan, o: Record<khoaCot, {n, N}|null>, tong: {n, N},
  loiNhieuNhat, con: { ma, nhan, o: Record<khoaCot, number|null>, tong: number }[] }[], scopeEmpty }` (kiểu ở
  `shared/domain/phanTich.ts`).
- `oVanDe(p, f & { kn, ma?, khoaCot | 'tong' })`: tính lại bằng chính hàm lõi, trả `{ n, tieuDe: "{n} học viên —
  {vấn đề} · {cột}", rows: rowsFor('hoc-vien', ids) }` — `{vấn đề}` là tên loại lỗi, hoặc tên kỹ năng khi bấm ô dòng
  kỹ năng (P8 "panel {n} học viên — {vấn đề}").
- Route: `GET /phan-tich/van-de` (`branchId, ct, lop, cot`), `GET /phan-tich/van-de/o` (+ `kn, ma, khoaCot`).

**Phép kiểm (≥ 7):** mọi ô `n ≤ N`; `oVanDe(...).n` = số trong ô (ô kỹ năng, ô loại lỗi, cột Tổng); cột Tổng là hợp
duy nhất (em ở hai lớp không đếm hai lần) — tạo tình huống bằng `conn` nếu seed không có; `ct='thuong'` không có dòng
W1/W2, `ct='ft'` không có dòng W; một Case chưa xong bất kỳ trong seed: em của nó có trong ô (kỹ năng, lớp đang học);
đóng Case đó (`status='done'` trong giao dịch thử rồi trả lại) → em biến mất khỏi ô; `loiNhieuNhat` khớp dòng con lớn
nhất ở cột Tổng; quyền như Task 2 (GV 403, QL MB hỏi CP → rỗng); số câu SQL ≤ 6 và không đổi khi thêm cột.

**Xong khi:** `npm run check` xanh. Commit `PR-Pb (3): máy chủ ma trận Vấn đề học viên`.

### Task 4: P15 — Phối hợp SOS chia SOS 1/2/3, bỏ N+1

**Files:** `server/src/yThuc/phoiHop.ts:335-359`; `server/src/worklist/metrics.ts` (khối `isPhoiHopMetric`, ~dòng 450
sau Pa); `web/src/modules/yThuc/YThucAnalysisView.tsx:34-36, 81-89`; phép kiểm.

**Việc:**
- `phoiHopMetric(p, id, f & { kind?: string|null })`: sau câu lấy lượt, **một** `loadBundle(ids)` và **một** câu
  `SELECT attempt_id, status FROM sos_coordination_actions WHERE attempt_id IN (…)` (lô 400) thay cho
  `resultOf(a)` + câu trạng thái **trong vòng lặp** (`phoiHop.ts:351-356`, N+1). Mức SOS: `resultOf(a,
  bundle.scores.get(a.id) ?? [], bundle.skips.get(a.id) ?? []).sosLevel` (chữ ký `attempts.ts:155`). Trả thêm
  `byKind: { sos1, sos2, sos3 }` (mức 1 / 2 / ≥ 3) cho **cả ba** chỉ số phối hợp; `kind` ∈ `sos1|sos2|sos3` → `ids` chỉ
  còn phần đó (danh sách khi bấm số con).
- `metrics.ts`, khối `isPhoiHopMetric`: truyền `kind: f.kind ?? null`; trả `done(r.ids, r.byKind ? { byKind: r.byKind }
  : {})` (y như khối Ý thức ngay trên). Không sửa gì khác trong file.
- Web: ô "Lượt SOS" nhận `phu` = một dòng `SOS 1 · <SoLieuO …kind sos1>  SOS 2 · …  SOS 3 · …` (Q15); các `SoLieuO` dùng
  `phamVi` và `extra` y như ô (cộng `kind`).

**Phép kiểm (≥ 3):** `byKind.sos1 ∪ sos2 ∪ sos3 = ids`, rời nhau, cho cả ba chỉ số; `metricSet(P.admin,
'phoi-hop-luot-sos', {kind:'sos2'}).ids` = `byKind.sos2`; số câu SQL của `phoiHopMetric` không đổi khi thêm một lượt có
phối hợp (tạo bằng `conn`, dọn sau). Các phép kiểm Phối hợp cũ (`sosV3.tests.ts`) xanh nguyên.

**Xong khi:** `npm run check` xanh. Commit `PR-Pb (4): P15 Phối hợp SOS chia SOS 1/2/3, gộp truy vấn`.

### Task 5: Khung Phân tích — hàng góc nhìn + bộ lọc chung (P7, P11)

**Files:** tạo `web/src/modules/phanTich/PhanTich.tsx`; sửa `CaseBoardPage.tsx`, `IssueAnalysis.tsx`,
`YThucAnalysisView.tsx`, `CatalogAdmin.tsx:100`; xoá `SummaryTable.tsx`.

**Vị trí trên màn:** Tổng quan › tab **Phân tích** (`/phan-tich`). Đầu trang giữ nguyên của Pa (tiêu đề "Tổng quan",
ô chi nhánh bên phải, tab Tổng quan | Phân tích, "Dữ liệu đến …"). Ngay dưới tab là **một hàng**: bên trái nhóm nút góc
nhìn; bên phải `ChonChuongTrinh` · ô khoảng thời gian · ô lớp. Dưới hàng là nội dung góc nhìn.

**Việc:**
- `CaseBoardPage.tsx`: `CaseBoard` chỉ còn `return <PhanTich />` (giữ tên export và prop `embedded` cho
  `OverviewPage.tsx:105` của Pa). Xoá: `mode` (`xem`), `angle`, `ModeTab`, `SummaryTable`, `WeeklyBoard`,
  `ManagerTasks`/`ManagerTaskList`/`WeekPicker`/`taskPeriod` (P11); dòng `export { ISSUE_TAXONOMY, KpiTile }` (không ai
  import — đã grep). **Giữ** `CaseRoutePage` (route `/hoc-thuat/case/:id`).
- **Danh sách Case (Q2 — giữ, không làm lại):** tách phần `angle === 'list'` (`CaseBoardPage.tsx:257-460` + ngăn Case
  `:472-474` + `QueueTile`, `FilterRow`, `Chip`, `STATE_LABEL`, `set`, `clearFilters`) thành `function DanhSachCase({
  branchId, ct, classId })` ngay trong file; giữ nguyên ba ô trạng thái, danh sách, ngăn `CasePanel`, và các tham số
  URL `hang-doi`, `tinh-hinh`, `ky-nang`. Bộ lọc chung (rẻ — `/cases` đã nhận sẵn, `routes/index.ts:1097-1110`):
  `branchId` ← `cn`; `classKind` ← `ct` (`thuong` → `normal`, `ft` → `ft`, `ca-hai` → không gửi); `classId` ← `lop`.
  Hàng chip **Loại lớp** (`:297-305`) và `CLASS_KINDS` (chữ "Normal", "tỷ lệ câu đúng") **bỏ** — chương trình chung thay
  nó; hàng **Kỹ năng** (`:313-333`) hiện khi `ct !== 'ca-hai'` (thay điều kiện `classKind`); `setKind` đổi thành xoá
  `ky-nang` không hợp lệ khi `ct` đổi. Hàng "Đang lọc" bỏ chip loại lớp, "Xoá hết bộ lọc" xoá `ky-nang, tinh-hinh,
  hang-doi`. Bỏ `SectionNote` `:366-371` (G-5). Khoảng thời gian **không áp** (Case là hiện trạng) — hiện chữ
  `Hiện trạng · đến dd/mm` như Vấn đề học viên. Hàng chip Chi nhánh (`:280-290`) đã tắt khi `embedded` — để nguyên.
- `PhanTich.tsx`: đọc/ghi URL (`goc, ct, tg, lop, theo, cot`; `cn` đọc chung với đầu trang). Chuyển nguyên `useEffect`
  tự chọn chi nhánh khi phạm vi chỉ một chi nhánh (`CaseBoardPage.tsx:151-158`). Áp Q16 bằng `gocNhinTuThamSo`
  (`setParams(..., { replace: true })` chỉ xoá `xem`, `loai-lop` — **không** xoá `hang-doi`/`tinh-hinh`/`ky-nang`). Nhóm nút góc nhìn: kiểu nút liền như `ChonChuongTrinh`
  (`role="radiogroup"`), không dùng `HangTab` (tránh hai tầng tab trông giống nhau); 375px: hàng cuộn ngang trong chính
  nó. Ô khoảng thời gian: `<select>` bốn giá trị Q5; ở Vấn đề học viên và Danh sách Case thay bằng chữ `Hiện trạng · đến {ngay(demoDate)}`.
  Ô lớp (Q6): `useApi('/ref/classes?branchId=…')`, lọc theo `ct` (`scoring_mode === 'ratio'` ↔ Lớp thường), option đầu
  "Mọi lớp"; ẩn ở Ý thức. Tính `from = tuDauKhoang(demoDate, tg)`.
- `IssueAnalysis.tsx`: prop mới `{ branchId, ct, from, classId }`. `ct !== 'ca-hai'` → khoá `ratio` theo `ct`, ẩn hai
  nút FT/Normal (`:100-105`); `ca-hai` → giữ hai nút nhưng chữ **"Lớp thường"** thay "Normal", bỏ câu giải thích `:103-105`
  (G-5). Bỏ ô "Khoảng báo cáo hiệu quả" và `WINDOWS`/tự tính `from` (`:69-93, :107-120`) — dùng `from` của khung; câu
  `:116-120` rút còn một dòng "Hiện trạng tính đến hôm nay · kết quả PA từ {ngay(from)}". Thêm `classId` vào query.
  Cột "Đang hỗ trợ" (`:140`) → "Đang theo dõi".
- `YThucAnalysisView.tsx`: prop `{ branchId, ct, from }`; bỏ hai ô ngày (`:24-25, 44-53`); `useMetric` thêm
  `thamSoCt(ct)` và `from`; mọi `SoLieu` dùng `phamVi={{ branchId, chuongTrinh: ct }}`, `extra={{ from }}`. Sửa chú
  thích `:20-21` (đã có bộ lọc chung; lớp chưa có — P14).
- `CatalogAdmin.tsx:100`: "chấm theo tỷ lệ câu đúng" → "chấm theo số câu đúng / tổng số câu".
- Xoá `web/src/modules/worklist/SummaryTable.tsx`. Không xoá route máy chủ `/summary` (ghi "Chuyển cho S3").
- Phép kiểm máy chủ (thêm vào `phanTich.tests.ts`): `listCases(P.mbManager, { classKind: 'normal', classId })` chỉ trả
  Case của lớp đó — khoá cách ánh xạ bộ lọc chung ở trên.
- Tạm thời góc nhìn `tong-hop` và `van-de` render chỗ giữ chỗ `Skeleton`/`Empty` — Task 6, 7 thay.

**Xong khi:** `npm run check` xanh (typecheck bắt import thừa). `grep -rn "Việc đã giao\|Thực trạng\|tỷ lệ câu đúng"
web/src` không còn ở các file Pb. Commit `PR-Pb (5): khung Phân tích — hàng góc nhìn + bộ lọc chung; bỏ Giao việc, Việc đã giao, bảng chi nhánh cũ`.

### Task 6: Giao diện Tổng hợp Test + SOS (P10)

**Files:** tạo `web/src/modules/phanTich/TongHopTestSos.tsx`; xoá `web/src/modules/worklist/WeeklyBoard.tsx`.

**Vị trí:** Phân tích › **Tổng hợp Test + SOS** (góc nhìn mặc định). Một thẻ; thanh công cụ trên đầu thẻ: bên trái nút
liền **Theo tuần · Theo lớp · Theo đợt · Theo chi nhánh** (ẩn "Theo chi nhánh" khi `cn` có giá trị hoặc `/ref/branches`
chỉ một), bên phải **Cột hiện ▾** và **⤓ Xuất Excel**.

**Việc:**
- `useApi<TongHopKetQua>('/phan-tich/tong-hop?…')` với `branchId, ct, tg, lop, theo`.
- Bảng: `table-layout: fixed` + `colgroup` (cột đầu ~180px, cột số ~64px) · hai hàng tiêu đề: hàng nhóm (vạch dọc
  ngăn nhóm, như `.vsep` mockup) và hàng cột (`<Th align="right" hint={goiY}>`; nhãn kỹ năng ngắn L/R/W1… có tooltip
  tên đầy đủ, G-7) · cột đầu `sticky-col` · bọc `table-scroll` (G-11).
- Dòng: `▸/▾` (có `title` "Mở theo lớp"/"Mở theo đợt", G-7) mở dòng con thụt vào; dòng phụ một dòng (G-3). Dòng **Tổng**
  cuối, chữ đậm, nhãn "Cộng {n} tuần" / "Cộng {n} lớp" / "Cộng {n} đợt" / "Cộng {n} chi nhánh".
- Mọi ô số > 0: `<SoLieuO giaTri={v} nguon={'/phan-tich/tong-hop/o?' + qs + '&khoa=' + khoa + '&cot=' + cot}
  tieuDe={…} />` (G-10). Số 0 hiện `—` mờ. Màu chữ nhẹ cho Đạt (xanh lá), SOS 1 (xanh), SOS 2 (vàng), SOS 3 (đỏ),
  Thiếu PA học thuật (vàng) — **chỉ màu chữ**, không badge, không ⚠ (G-4).
- **Cột hiện ▾** (Q14): menu nhỏ ba ô tích Kết quả / Dưới kỳ vọng / Xử lý; không cho tắt cả ba.
- **⤓ Xuất Excel** (Q13): `const XLSX = await import('xlsx')` → `XLSX.utils.aoa_to_sheet(bangXuatTongHop(data, nhomHien,
  moTa))` → `book_new` / `book_append_sheet(wb, ws, 'Tong hop')` → `XLSX.writeFile(wb, 'tong-hop-test-sos-{dd-mm-yyyy}.xlsx')`.
  `moTa` = "{tên chi nhánh | Tất cả chi nhánh} · {chương trình} · {khoảng} · {lớp nếu có} · dữ liệu đến {dd/mm/yyyy}".
  Nút tắt khi chưa có dữ liệu.
- Trạng thái: đang tải `Skeleton`; rỗng `Empty` "Chưa có lượt nào có điểm trong {khoảng}"; lỗi `ErrorState`;
  `scopeEmpty` → "Bạn chưa được cấp phạm vi nào".
- Xoá `WeeklyBoard.tsx` (hết người import sau Task 5).

**Xong khi:** `npm run check` xanh; `npm run build` qua (xác nhận `xlsx` tách thành chunk riêng, không vào bundle
chính — xem bảng kích thước của Vite). Commit `PR-Pb (6): bảng Tổng hợp Test + SOS — nhóm cột, bộ chọn cột, dòng con, xuất Excel`.

### Task 7: Giao diện Vấn đề học viên (P8)

**Files:** tạo `web/src/modules/phanTich/VanDeHocVien.tsx`.

**Vị trí:** Phân tích › **Vấn đề học viên**. Một thẻ; thanh công cụ: nút liền **Theo lớp · Theo chi nhánh** (ẩn "Theo
chi nhánh" như Task 6). Không có ô khoảng thời gian (Q5).

**Việc:**
- `useApi<MaTranVanDe>('/phan-tich/van-de?…')` với `branchId, ct, lop, cot`.
- Ma trận: cột đầu "Kỹ năng / loại lỗi" (`sticky-col`, `<Th hint>` ghi luật Q11 ngắn gọn: "Dòng kỹ năng: số HV có Case
  chưa xong / số HV đang học. Dòng loại lỗi: số HV gặp lỗi đó — một em có thể gặp hai lỗi.") · một cột mỗi lớp/chi nhánh
  · **Tổng** · **Lỗi phổ biến nhất** (chữ, một dòng, cắt `…` + `title` đầy đủ). `colgroup` cố định; bọc `table-scroll`.
- Dòng kỹ năng: `▸ Listening` (tên đầy đủ; W lớp thường ghi "Writing"). Ô: `n / N` trong ô nền theo `mucNhiet` (Q12,
  lớp Tailwind **chuỗi tĩnh**, tông nhạt, đủ tương phản cả nền tối); `n` là `<SoLieuO nguon='/phan-tich/van-de/o?…&kn=…
  &khoaCot=…' tieuDe=…>`; `N` không bấm; ô `null` → `—` mờ.
- Dòng loại lỗi (mở ra khi bấm ▸): thụt vào, chữ thường, ô chỉ `n` (bấm được). "Chưa phân loại" chữ mờ, cuối.
- Mặc định mở sẵn dòng kỹ năng có `tong.n` lớn nhất (mockup mở Writing Task 2); các dòng khác đóng.
- Trạng thái rỗng: "Không có học viên nào đang học trong phạm vi này" / "Chưa có Case nào đang mở" (khi mọi n = 0 — vẫn
  hiện bảng N để thấy sĩ số).

**Xong khi:** `npm run check` xanh. Commit `PR-Pb (7): ma trận Vấn đề học viên — nhiệt, mở loại lỗi, panel {n} học viên`.

### Task 8: Tài liệu, bấm thử một lần, mở PR

- [ ] `CODE_MAP.md`: thay dòng Thực trạng/Học thuật bằng `| **Phân tích** (Tổng hợp Test + SOS · Vấn đề học viên · Kết quả
  hỗ trợ · Ý thức & Phối hợp) | web/src/modules/phanTich/*, cases/IssueAnalysis.tsx, yThuc/YThucAnalysisView.tsx |
  server/src/phanTich/{tongHop,vanDe}.ts · cases/effectiveness.ts · yThuc/phoiHop.ts |`. Bỏ dòng `WeeklyBoard`/`SummaryTable`.
- [ ] Máy thử: kiểm cổng 4177/5377 trống → `npm run seed` → nền `PORT=4177 node dist-server/server/src/index.js` → cấu hình
  Vite tạm `vite.pb.config.ts` ở gốc worktree (`server: { port: 5377, strictPort: true, proxy: { '/api': { target:
  'http://127.0.0.1:4177' } } }`, giữ alias `@shared` của `vite.config.ts`) → `npx vite --config vite.pb.config.ts`.
  **Không commit** file tạm. Đăng nhập theo `DEMO.md` (Quản trị = 1, QL Monbay Nguyễn Khánh Vy = 2, GVCN = 7, GVBM = 9).
  Chụp bằng Playwright kênh Chrome (`npm i --no-save playwright`, `chromium.launch({ channel: 'chrome' })`).
- [ ] **KIỂM một lần** (ghi ✓/✗ vào Nhật ký; ảnh `thiet-ke/anh/pr-pb/`):
  1. **Quản trị (1), 1440px:** `/phan-tich` mở thẳng **Tổng hợp Test + SOS**, xếp Theo tuần, nhãn tuần dạng `W3 SEP`
     (không ISO, không "Tuần 36"). Đổi Theo lớp / Theo đợt / Theo chi nhánh — dòng Cộng giữ nguyên tổng Lượt và Case. Mở ▸
     một dòng. Bấm 3 số khác nhóm (Lượt, một cột kỹ năng, Thiếu PA học thuật) → panel đúng `{n}` dòng. Tắt nhóm Xử lý ở
     Cột hiện. Xuất Excel → mở tệp: có dấu tiếng Việt, đúng cột đang hiện. Chọn Lớp thường: cột "Bài kiểm tra", L R W S,
     "Chưa đạt theo môn". Không chữ "Normal", "Thực trạng", "Việc đã giao", "+ Giao việc" nào trên màn.
  2. **Quản trị, Vấn đề học viên:** Theo lớp ↔ Theo chi nhánh; ô `n / N` có màu nhiệt; mở ▸ một kỹ năng thấy loại lỗi;
     bấm một ô → panel `"{n} học viên — {vấn đề} · {lớp}"`; có chữ "Hiện trạng · đến dd/mm", không có ô khoảng thời gian.
  3. **Quản trị, Kết quả hỗ trợ và Ý thức & Phối hợp:** đổi khoảng thời gian → số đổi theo; Ý thức không có ô lớp; ô Lượt SOS
     có dòng SOS 1 · SOS 2 · SOS 3 bấm được.
  4. **QL Monbay (2):** chỉ thấy lớp/chi nhánh Monbay (ô chi nhánh không có chi nhánh khác; "Theo chi nhánh" ẩn).
  5. **GV (7 và 9):** không có tab Phân tích; gõ thẳng `/phan-tich` → về `/`; gọi `fetch('/api/phan-tich/tong-hop')` → 403.
  6. **375px (Quản trị):** hàng góc nhìn và bộ lọc không làm trang cuộn ngang; bảng Tổng hợp và ma trận cuộn ngang **trong
     thẻ**, cột đầu dính; panel danh sách mở đầy màn.
  7. Đường dẫn cũ: `/tong-hop-tuan` và `/phan-tich?xem=tuan` mở Tổng hợp, URL sạch `xem`.
  7b. **Link `?hang-doi=`:** mở `/?tab=tinh-hinh&hang-doi=due` và `/phan-tich?hang-doi=review` và `/phan-tich?goc=danh-sach&tinh-hinh=no_plan`
     → mở **Danh sách Case**, chip "Đang lọc" đúng (Tới hạn xem lại / Mức cao hoặc gấp / Chưa có PA học thuật), số dòng =
     số ở ô trạng thái; đổi chương trình → danh sách lọc theo; chọn một lớp → chỉ Case lớp đó; bấm một dòng mở ngăn Case.
  8. Tốc độ: ghi thời gian `/api/phan-tich/tong-hop` (6 tháng, Theo lớp, Quản trị) từ tab Network — chỉ để PR-Z2c có mốc.
- [ ] Sửa lỗi phát hiện khi bấm thử (mỗi lỗi một commit, `npm run check` xanh).
- [ ] Xoá file Vite tạm, tắt hai tiến trình. `git fetch && git rebase origin/main` nếu `main` đã đi tiếp (giữ cả hai
  khối ở `routes/index.ts`, `run.ts`, `shared/domain/index.ts`); `npm run check` lần cuối → ghi số phép kiểm.
- [ ] Push, mở PR (không draft, không tự merge) tiêu đề `PR-Pb-gọn: Phân tích cho Quản lý — Tổng hợp Test + SOS, Vấn đề
  học viên, hàng góc nhìn chung`. Mô tả: phạm vi theo mã việc (bảng đầu kế hoạch), bảng Q có lệch mockup (Q5, Q7, Q11,
  Q13), kết quả KIỂM + ảnh, số phép kiểm trước/sau, **"Chuyển cho PR khác"** bên dưới. Báo planning: link PR + số phép kiểm.

---

## Chuyển cho PR khác (chép vào mô tả PR)

- **Sau deploy — PR-Pb phần còn lại:** P8b (Vấn đề học viên dạng danh sách trên điện thoại + cột thao tác), P9/P9b (Kết
  quả hỗ trợ theo mockup: chia kỹ năng rồi loại PA, "Thời gian thường mất", "Ít dữ liệu", nhóm "chưa xác định nguồn"),
  P12, P13 (bảng vi phạm 5 nhóm × 4 trạng thái), P14 (lọc lớp ở Ý thức). Nhận định xu hướng ở Điểm đáng chú ý mà Pa
  chuyển sang (cần chỉ số theo đợt).
- **PR-GV:** thêm nút **Theo giáo viên** vào hàng góc nhìn (`GOC_NHIN` ở `shared/domain/phanTich.ts`).
- **PR-S3:** (1) `OverviewPage.goTab` chỉ giữ `cn` — nay Phân tích đọc cả `ct`, nên giữ luôn `ct` khi đổi tab; (2) route
  `/summary` + `server/src/worklist/summary.ts` không còn màn nào gọi (đã xoá `SummaryTable.tsx`) — xoá cùng phép kiểm
  của nó; (3) route `/weekly-rollup`, `/weekly-rollup/ids` web thôi gọi — giữ vì phép kiểm mục 15, dọn khi chuyển các phép
  kiểm đó sang `tongHop`; (4) `MeetingPage` vẫn còn "Việc đã giao" (Công việc › Báo cáo — PR-Ra quyết).
- **PR-Z2c:** đo `/api/phan-tich/tong-hop` và `/api/phan-tich/van-de` trên Turso bằng log `[cham]`; mỗi cú bấm số chạy
  lại lõi một lần — nếu chậm, nhớ tạm kết quả lõi theo khoá bộ lọc trong vài giây.

## Mâu thuẫn nguồn ↔ mã thật (đã xử lý trong kế hoạch)

| # | Nguồn nói | Mã / nguồn khác nói | Xử lý |
|---|---|---|---|
| 1 | Mockup 03b + THUAT_NGU g2-020: "Tổng hợp Mock Test" | Đặc tả §3.3: "Tổng hợp Test + SOS" (có lớp thường) | Theo đặc tả (§0: đặc tả thắng) |
| 2 | Mockup Vấn đề học viên có ô "30 ngày" | `IssueAnalysis.tsx:63-67` + HĐSL luật 5: hiện trạng vấn đề luôn là hiện tại | Q5: Vấn đề là hiện trạng, không ô thời gian |
| 3 | Kiểm kê P7: 4 góc nhìn gồm "Theo tuần" | Đặc tả §3.3: Tổng hợp **thay** Theo tuần, 5 góc (Theo GV sau deploy) | Theo đặc tả |
| 4 | Kiểm kê §5.2 ghi Pb sửa `shared/domain/metrics.ts`, `worklist/metrics.ts` | Pa đã sửa hai file này; bảng không phải chỉ số trong sổ | Không thêm chỉ số; bảng đi đường `nguon` (mẫu `bangChiNhanh.ts` của Pa); `metrics.ts` chỉ 2 dòng P15 |
| 5 | Mockup Tổng hợp "W1 W2" cho FT | Mức SOS FT tính trên 4 kỹ năng (W gộp, `scoring.ts:169`) | Cột theo 5 ô bằng `failingEntrySkills` (cùng luật sinh Case) — Q8 |
| 6 | Mockup "Lớp Normal: cột đầu đổi thành Bài kiểm tra, bỏ W1/W2 thay Writing" | Không có ghi "Cả hai" | Q7, Q18 |
| 7 | `WeeklyBoard` lọc chương trình theo `a.kind`, Pa lọc theo `classes.is_fast_track` | — | Đường mới theo Pa (Q19); `/weekly-rollup` cũ giữ nguyên cho phép kiểm cũ |
| 8 | `phoiHopMetric` (`phoiHop.ts:351-356`) chạy `resultOf` + một câu SQL **mỗi lượt** | Turso: mỗi câu một vòng mạng | Sửa ở Task 4 |
| 9 | Đặc tả §6: "tỷ lệ câu đúng" ở `CaseBoardPage.tsx:44` và `CatalogAdmin` | — | Task 5 |
| 10 | `/weekly-rollup` cho phép `attempt.view` (GV gọi thẳng API được, trong phạm vi lớp mình) | Brief: GV không thấy Phân tích | Đường mới dùng `meeting.view`; đường cũ không lộ gì ngoài phạm vi lớp — ghi S3 dọn |

## Nhật ký thực thi

(Session code ghi: B, số phép kiểm sau mỗi Task, lệch kế hoạch, kết quả KIỂM, link PR.)
