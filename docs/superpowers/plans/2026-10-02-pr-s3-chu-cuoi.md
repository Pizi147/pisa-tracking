# PR-S3 · Chữ cuối trên web — Kế hoạch

> Dành cho session code (có thể là session cloud). Quy trình nhanh: tự code từng Task, không rà từng Task bằng subagent.
> Kế hoạch này gọn hơn mẫu: phần dò mã chi tiết session tự làm bằng `git grep` (việc cơ học); ở đây ghi **quyết định, bẫy và nơi gom chữ** mà planning đã dò sẵn trên main @ `df0d57cf`.

**Goal:** Mọi chữ người dùng nhìn thấy (web, chữ máy chủ dựng, tiêu đề thông báo, Excel) theo **bảng thuật ngữ của chủ sản phẩm** `thiet-ke/THUAT_NGU_2026-10-01.md` + mục **"Đã chốt"** dưới đây. **Chỉ đổi chữ hiển thị** — không đổi tên bảng/cột DB, enum, route, khoá URL, id chỉ số.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Model | Gợi ý **Sonnet 5.5 · High** (phương án B: Opus 5.5 · High). Chỉ là gợi ý; ghi model thật vào thân PR |
| Nhánh | `pr-s3-chu-cuoi`, từ `origin/main` mới nhất. Máy local: worktree `.claude/worktrees/pr-s3-chu-cuoi`, cổng API 4157 · Vite 5357 |
| Đầu phiên | `/ponytail lite`. impeccable `clarify` theo từng nhóm chữ; Task cuối `audit` + `polish` (sáng + tối). Không `init`/`document`/`hooks on`/cài đặt |
| Phép kiểm | Tệp mới `server/src/tests/prS3Chu.tests.ts` (tên `prS3f.tests.ts` đã có), đăng ký cuối `run.ts`. Mẫu quét chuỗi có sẵn: `server/src/tests/hoSoHocVien.tests.ts:10-63` (`walk`, `boChuThich`, `CHO_PHEP`, `LOAI_TRU`) |
| `npm run check` | Mỗi Task một lần, foreground, log riêng (`check-s3.log`). Sập segfault → chạy lại một lần |
| Song song | **PR-Dọn-b** (nếu chủ sản phẩm chạy). Hợp đồng file ở cuối |
| Sau | **PR-DEPLOY** chạy sau S3 (và Dọn-b nếu có) |
| Không làm | Tài liệu luật (Rulebook, TU_DIEN, HOP_DONG_SO_LIEU, Y_THUC, SOS_V3) — session khác đang viết. Không đổi logic nghiệp vụ |

## Đã chốt (chủ sản phẩm 01–02/10) — áp toàn web, kể cả dòng bảng để trống

| Chủ đề | Chốt |
|---|---|
| PA · Phương án | Ưu tiên **PA**; chỗ rộng (tiêu đề, câu giải thích) mới viết "Phương án" |
| QL · Quản lý | Như PA: chỗ chật **QL**, chỗ rộng "Quản lý"; cùng một chỗ ở hai màn viết giống nhau |
| Case | Luôn viết hoa **Case** (cả chữ máy chủ, lỗi, tiêu đề thông báo) |
| Ý thức | "phương án xử lý" → **lần xử lý** |
| Lịch | "Lịch kiểm tra" → **Lịch Test** (ở hồ sơ lớp ghi "Lịch Test của lớp" để khác tab Test › Lịch Test) |
| Mục tiêu band | Mọi cách gọi → **Target** (viết hoa) |
| Nút thoát hộp | **Đóng** (bỏ "Thôi"; mặc định của `KhungPanel` và `ConfirmDialog` đổi thành "Đóng"); "Huỷ …" chỉ cho hành động huỷ thật |
| Báo lên | → **Báo QL** |
| **Chuyển lớp (02/10, thay B-056/D-070/D-071/F-067)** | Quyết định của QL (6 hướng) gọi là **Quyết định chuyển lớp**. Nút QL: "Quyết định chuyển lớp" (sửa: "Sửa quyết định…", huỷ: **"Huỷ quyết định"**). Ba trạng thái **tách rõ**: "Chưa có quyết định chuyển lớp" · "Chờ QL duyệt đề xuất" · "Sắp chuyển · từ {tuần}". Bàn giao luôn là **"GVCN xác nhận bàn giao"**. Chữ "lệnh" biến mất khỏi màn |
| **Phối hợp (02/10)** | FT: **"Phối hợp SOS"** · lớp thường: **"Phối hợp"** (lớp thường không có chữ SOS) |
| **Tín hiệu (02/10)** | "Tín hiệu…" → **"Case chờ xác nhận nguyên nhân"** (khái niệm "tín hiệu" đã bỏ) |
| **Tạm dừng / Bảo lưu (02/10)** | **Bảo lưu = Tạm dừng học** (một khái niệm). Trạng thái HV: "Tạm dừng học" (chip hẹp được "Tạm dừng"). Hướng "Bảo lưu" trong quyết định QL ghi **"Tạm dừng học (bảo lưu)"**. "Dừng học" → **"Dừng học hẳn"**. ⚠ Session kiểm: hướng Bảo lưu có dẫn tới đúng trạng thái Tạm dừng không — nếu là hai luồng khác nhau thì **không sửa logic**, ghi rõ vào thân PR để planning xử lý |

## Planning tự quyết (bảng Q)

| Q | Quyết định |
|---|---|
| Q1 | Trạng thái Vận hành: **Chưa bắt đầu · Đang xử lý · Tạm ngưng · Dừng hẳn · Xong** (bảng chủ SP C-069…C-073 thắng kế hoạch Dọn Q25). Map duy nhất `TASK_PROGRESS_LABEL` (`shared/domain/worklist.ts:60-66`); xoá map trùng `TRANG_THAI_LABEL` ở `MgmtTasksPage.tsx:47-48` |
| Q2 | 48 dòng "Sửa thành" = chữ cũ: **gom mọi cách viết khác về chữ đó**, trừ chỗ bảng ghi giữ riêng (C-004: MT lịch sử giữ "Không tính hạn" → nhãn "Nhập bù, không tính hạn") |
| Q3 | Động từ: nút hành động **"Nhập điểm"** (D-022, D-024); chữ về hạn/số liệu giữ **"chấm"** ("Hạn chấm", "Chấm đúng hạn", "quá hạn chấm") |
| Q4 | B-005: **"Case bàn giao"** thay cả nhóm "Từ lớp trước" (PR-UXF-b) — sửa `prUxfB.tests.ts:388,394,395` theo |
| Q5 | A-037/A-038: "Hồ sơ Mock Test" là tên **trang** (tiền tố tiêu đề h1 / link FT). Khối `<details>` con giữ tên mô tả nội dung. Link "Hồ sơ đợt ›" của **lớp thường** (`StudentDetailPage.tsx:578,609`, mở `/bang-diem-thuong`) → "Bảng điểm đợt ›" — tuyệt đối không có chữ Mock/MT ở lớp thường |
| Q6 | A-045: tab đã tên "Việc hôm nay" → bỏ tiêu đề khối trùng ngay dưới tab |
| Q7 | B-022 OVR/Overall: cột hẹp (bảng, chip) **OVR**; câu, tiêu đề, Excel **Overall** |
| Q8 | C-070 "Đang xử lý" trùng nhãn Case: chấp nhận (khác màn) |
| Q9 | Cột "Case mở" → "Case đang mở"; ô hẹp 375 px được rút "Case mở" nếu tràn (ghi ở thân PR) |
| Q10 | Ô tap < 44 px trên điện thoại (PR #156 để lại: "Thu gọn", "Thu tất cả", "← Quay lại", "Lộ trình / + Case / ⋮", chip lọc 26 px, 7 nút số "Lớp tôi dạy"): **nâng lên 44 px vùng bấm** (padding, không đổi cỡ chữ) |
| Q11 | Chữ đã lưu trong DB (thông báo cũ, nhật ký, lỗi chuyển lớp) giữ nguyên — DB reset trước deploy |

## Bẫy đã dò (đọc trước khi sửa)

- **Chuỗi được so như giá trị** — đổi cùng lúc ở mọi nơi: `'chưa có hạn'` (`hoSoHocVien.ts:348-349`, `TheKyNang.tsx:114`) · `'Đề ra PA'` → "Thêm PA" (`viecHocVien.ts:71-73`, `QuickReport.tsx:304`) · `RUT_GON` khớp tiền tố "Ghi kết quả" (`hocVienLop.ts:336`). Tốt nhất: so theo khoá/hằng, không so chuỗi hiển thị.
- **Không đổi định danh:** bảng `lenh_chuyen_lop`, cột `nguoi_ra_lenh`, `xac_nhan_luc`, route `/lenh-chuyen/...`, khoá nhật ký `lenh_chuyen.*`, enum `bao_len_*`/`'bao-len'`, id chỉ số `hv-chua-co-lenh-chuyen`, kind thông báo `huy_lenh`, khoá `huy-lenh`, route `/notifications/doc-het`, khoá `KHOA_CHUA_PHAN_LOAI`, `'chua-phan-loai'`, `ban_giao.xac_nhan`.
- **Chữ khác nghĩa — để nguyên:** "Tạm ngưng" (việc Vận hành) ≠ "Tạm dừng học" (HV) · "Đã hoàn tất" (khoá đợt) · "Chưa có người phụ trách" (Case không người điều phối) ≠ C-042 · "Không đổi/Giảm" (xu hướng điểm) · "Lưu lại" (thử lại sau lỗi) · "+ Lớp mới" (tạo lớp) · "Lớp dự kiến" (kế hoạch) · "Kết thúc khoá" (dải hết khoá, B-061) · "Cảnh báo" ở Kế hoạch Test · "Không duyệt" là nút động từ ở `AccountsAdmin.tsx:218` · "dòng lệnh/câu lệnh" kỹ thuật.
- **Nơi gom một lần sửa nhiều màn:** `NHAN_TRANG_THAI`/`chuTrangThai` (`shared/domain/trangThai.ts`; gộp `NHAN_TRANG_THAI_O` ở `hoSoHocVien.ts:243` và `hocVienLop.ts:45-47`) · `TASK_PROGRESS_LABEL` · `INTERVENTION_STATUS_LABEL`, `COORDINATION_STATUS_LABEL`, `ATTEMPT_STATUS_LABEL`, `CASE_STATE_LABEL` (server) · map duyệt `cases.ts:704`, `XU_LY_STATUS_LABEL` (`yThuc.ts:122`) · `CHU_THAO_TAC` · `PHAN_LOAI_LABEL` (`yeuCauDuyet.ts:13`) · `nhatKy.ts` · `STUDENT_STATUS_LABEL` (`students.ts:9`, thêm `chuTamDung(tu)`) · `ISSUE_ROLE_LABEL` (`cases.ts:485`, cho B-065/066) + hằng "Nhóm nguyên nhân" (B-064) · `TAB_CONG_VIEC_LABEL` (A-012) · **hằng mới trong `shared/domain/chuyenLop.ts`** cho bộ chữ chuyển lớp (đang lặp ở ~12 tệp) · `lenLop.ts nhanHuong` (B-054) · `nhapHocVien.ts` (`COT_FT`, "Dự kiến thi", OVR — đổi tiêu đề cột nhập an toàn vì bí danh `du kien thi` đã có) · thành phần `KhungPanel` (nút thoát), `ConfirmDialog`, `MenuDong` (mặc định "Thao tác khác"), `SaveState` ("Không lưu được").
- **Dài ra, dễ tràn 375 px:** "Đánh dấu đã đọc" (`Header.tsx:223`) · "Nhập điểm" (`KhoiNo.tsx:126`) · chân panel `ChuyenLopPanel.tsx:137,151,173` · `TransitionPanel.tsx:225,467,471` · `DaiChuyenLop.tsx:36,89` · "Chưa chọn nhóm nguyên nhân" (`TongHopVanDeHv.tsx:157`) · "Case đang mở" (`LopToiDay.tsx:80,96`, `BranchPulse.tsx:33`). Chụp 375 px từng chỗ.
- **Excel:** tên trang tính có dấu (A-054: `TongHopTestSos.tsx:135`, `YThucPhoiHop.tsx:67-69`, đều < 31 ký tự); tên tệp giữ ASCII.
- Phép kiểm cũ khẳng định chữ cũ phải sửa theo (không xoá): ví dụ `panelUx3.tests.ts:406`, `lenLop.tests.ts:149,163`, `prCt.tests.ts:45,90,283,815,817,846`, `prDonA.tests.ts:805`, `prHvl.tests.ts:71,167`, `hanhTrinh.tests.ts:342,345`, `prSos.tests.ts:225,388`, `prMt.tests.ts:487,492`, `prHsm.tests.ts:204,218,235`, `sosV3.tests.ts:133`, `prS6fA.tests.ts:317`, `prVaiB`, `prUxfB` (dò bằng grep chữ cũ trong `server/src/tests`).

## Các Task

Mỗi Task: phép kiểm trước (quét chuỗi cũ — phải đỏ) → sửa → `npm run check` → commit `PR-S3 (n): …`.

0. **Chuẩn bị:** ghi model thật; mốc B (số phép kiểm); trích danh sách 147 dòng có "Sửa thành" từ `THUAT_NGU_2026-10-01.md`; tạo `prS3Chu.tests.ts` với hàm quét dùng chung.
1. **Điều hướng & tên trang (nhóm A)** + Excel A-054 + Q5, Q6.
2. **Khái niệm nghiệp vụ (nhóm B)** + hằng chuyển lớp mới (Đã chốt "Chuyển lớp") + Tạm dừng/Bảo lưu + Target + Tín hiệu + B-054 "Lên FT" + B-047 "Dự kiến thi".
3. **Trạng thái & chip (nhóm C)** + Q1 Vận hành + gom map trạng thái.
4. **Nút (nhóm D)** + nút thoát "Đóng" + "Báo QL" + bẫy so chuỗi "Đề ra PA".
5. **Tiêu đề cột & số liệu (nhóm E)** + tooltip cột bảng Phân tích GV (`PhanTichGiaoVien.tsx:23-32`) chép vào `THUAT_NGU_2026-10-01.md` (mục mới cuối tệp).
6. **Vai trò, việc, thông báo (nhóm F)**: HS → HV, PH, TVV; **tiêu đề thông báo theo mẫu "việc · em · lớp"** cho các tiêu đề còn lệch (`boTro.ts:265`, `sos.ts:527`, `sosAuto.ts:507`, `banGiao.ts:289`, `lenhChuyen.ts:249,384`, `yeuCau.ts:106,137,181,191,243`, `absence.ts:753`, `nhacViec.ts:59`, `phoiHop.ts:128`, `xuLy.ts:171,359,362`). Thân "Case mới sau MT2" giữ như hiện tại.
7. **Ý thức & vi phạm (nhóm G)** + "lần xử lý" + Phối hợp SOS/Phối hợp theo khung + "Lần xử lý gần nhất" kèm nhãn trạng thái (đang chờ duyệt/bị từ chối không được trông như đã xong) + "Chưa xử lý lần nào" không áp cho em bị Đình chỉ/đã khai bậc (khi đó hiện bậc).
8. **Case viết hoa + PA/QL ngắn-dài** quét toàn bộ chữ máy chủ (`cases.ts` ~20 lỗi, `sosAuto.ts`, `sos.ts`, `regular.ts:830`, `standing.ts:115-116`, `metrics.ts` định nghĩa chỉ số, `people.ts` nhãn quyền) + "Normal/Progress Test/Final Test" còn sót (`permissions.ts:456`, `skillSchedule.ts:712`, `people.ts:135`, `metrics.ts:221`, `StudentPlanPanel.tsx:147`).
9. **Việc nhỏ chuyển cho S3:** A5 giữ `ct` khi đổi tab Tổng quan → Phân tích (`OverviewPage.tsx:31-34`) · A6 một tham số chi nhánh `cn` (thay `branchId` ở `StudentsPage.tsx:65`, `LuuTruPage.tsx:33`, `KeHoachTestTab.tsx:25`, `TestPage.tsx:30`; link cũ `branchId` vẫn đọc được) · A8 đọc ngày nghiệp vụ qua `useNgayNghiepVu()` (~9 tệp đọc thẳng `session.demoDate`) · A10 PA bị thay hiện "Được thay thế" (`hoSoHocVien.ts:97` xét `closedReason`) · A11 bỏ chữ "chu kỳ" (`cases.ts:2830`) · A13 "đợt" trong lỗi xếp lịch (`skillSchedule.ts:143,506-525,542`, `absence.ts:66,852`) · A16 link "chấm điểm" ở Việc mở đúng tuần (kiểm bằng bấm thử) · A17 thêm `mgmt` vào `LOAI_HAN_CUA_VIEC` (`tongQuan.ts:51-55`) · Q10 ô bấm 44 px · `THUAT_NGU_DA_CHOT.md` ghi đầu tệp "đã thay bằng THUAT_NGU_2026-10-01.md".
10. **Bấm thử theo vai** 1440 + 375, sáng + tối (nếu môi trường có trình duyệt; session cloud không có thì ghi rõ "chưa bấm thử" trong thân PR) — chú ý chỗ chữ dài ra; impeccable `audit` + `polish`; `/ponytail-review`; mở PR (không draft, không tự merge). Thân PR: số dòng THUAT_NGU đã áp, dòng cố ý không áp + lý do, chú thích `ponytail:`, mục Chuyển cho PR khác.

**Ràng buộc:** không bỏ nút "Xin hỗ trợ từ Quản lý" khi kết quả tốt (S2-a). `DeleteViolationConfirm` vẫn là hộp riêng.

## Hợp đồng với PR-Dọn-b (nếu chạy song song)

Dọn-b sở hữu **cấu trúc** các tệp: `AccountsAdmin`, `CatalogAdmin`, `IntakePanel`, `StudentPlanPanel`, `ClassProgressPanel`, `ManagerTasks`, `MgmtTasksPage`, `MeetingPage`, `AdminPage`, `LuuTruPage`, `XoaKetThucLopPanel`, `xoaKetThucLop.ts`, `sysconfig.ts`, `display.ts` (`deadlineView`), `BangChung.tsx`, `DongThoiGianLuot.tsx`, `attempts.ts` (`scoreHistory`), `shared/domain/worklist.ts`. S3 chỉ đổi **chuỗi chữ** trong đó; PR merge sau áp lại phần của mình. `routes/index.ts`, `run.ts`, `tocDoDuong.ts`, `CODE_MAP.md`: chỉ thêm dòng. Phép quét chữ của S3 bắt mọi chữ cũ Dọn-b thêm vào — Dọn-b dùng ngay chữ mới (bảng THUAT_NGU + mục Đã chốt ở đây).

## Chuyển cho PR khác
- 4 cờ quyền cũ `mocks/meeting/academic/mgmtTasks` (`dieuHuong.ts:22-23`, `nav.ts:27`), `NEXT_STEP_HINT`, import chết `JOURNEY_EVENT_LABEL` (`StudentDetailPage.tsx:23`) → **Dọn-b**.
- U12 (bảng Kết quả kiểm tra lớp thường theo K4-33), A12 tên loại PA "Điều chỉnh cách dạy", màn dev `SetupHelp` → chờ chủ sản phẩm / sau deploy.
