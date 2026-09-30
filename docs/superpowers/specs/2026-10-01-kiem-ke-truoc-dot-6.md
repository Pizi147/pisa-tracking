# Kiểm kê trước đợt 6 (01/10/2026)

> Người soạn: agent kiểm kê của session planning (Opus 5.5). Mã đối chiếu: `origin/main` @ `86ddaf04` (đợt 1–5 + S5F-a #143, S5F-b #142).
> Cách làm: đối chiếu **đặc tả với mã thật** (grep/đọc), không tin ô tick. Bằng chứng `file:dòng` là đường dẫn trong repo.
> Trạng thái: xong bản kiểm kê, chờ session planning + chủ sản phẩm đọc. Mục P2 của K1–K5 giao PR đã merge **chưa kiểm** (để lượt rà đợt 6).

## (a) Tóm tắt cho chủ sản phẩm

1. **Đúng, đợt 6 là đợt cuối về tính năng.** Sau đợt 6 còn một **bước dọn** (chữ cuối + dọn lỗi nhỏ + chuẩn bị reset) rồi mới reset database và deploy bản chính.
2. Đợt 1–5 làm **khá đủ**: kiểm lại ~150 mục P0/P1 trong mã, gần hết đã có. Phần giao cho các PR đã merge chỉ sót **1 lỗi P0** (Chuyển tiếp lớp: chọn khác gợi ý mà không bắt ghi lý do) và ~15 mục nhỏ.
3. Việc còn lại chính là **4 nhóm đã lên lịch cho đợt 6** và chưa ai làm: Tổng quan theo vai, hồ sơ học viên "hiểu trong 30 giây", Phân tích (bỏ "Danh sách Case", bỏ "Cả hai", **bảng Phân tích giáo viên** mới), và số liệu khớp nhau.
4. Việc mới anh/chị thêm 30/09: **bảng Phân tích giáo viên** chưa có gì. **Mã tuần `W2 OCT`** còn khoảng 10 màn hiện ngày, như bộ chọn tuần, Case/PA, Hành trình, hồ sơ lớp.
5. Điện thoại: đã có mẫu "bảng → thẻ" và dùng ở Học viên & Lớp. Chưa dùng ở bảng kỹ năng của hồ sơ HV, thông báo, các bảng quản trị và thanh dưới.
6. Còn khoảng 60 việc nhỏ, hầu hết cỡ S: chữ, mã thừa, một số lỗ quyền nhẹ. Các lỗ quyền (`/ref/nguoi`, nhập bù không chống gửi đôi) **không được bỏ**.
7. **Reset DB:** lệnh `init-ban-chinh` đã tạo đủ bảng của đợt 1–5, có chặn chạy nhầm lên DB có dữ liệu. Cron sáng Thứ Hai chốt vắng **và** thi hành lệnh chuyển lớp. Demo không lọt lên bản chính.
8. Cần sửa 2 lỗi nhỏ ở migrate trước khi reset. Hướng dẫn TRIEN_KHAI.md có khoảng 10 chỗ lỗi thời và chưa có mục "Reset bản chính".
9. Đề xuất **8 PR**. Đợt 6 lượt 1 chạy 4 PR song song, lượt 2 chạy 2 PR. Bước cuối có PR-S3 và PR-Dọn song song, rồi PR-DEPLOY. Sau đó anh/chị làm 7 bước tay: sao lưu, tạo DB mới, init với chi nhánh + quản trị thật, deploy.
10. **Cần mockup trước khi code** 3 màn: Tổng quan theo vai, đầu hồ sơ HV, Phân tích giáo viên. Có **4 câu** cần anh/chị chọn ở mục (d).

## (b) Bảng việc còn lại

### B1. Từ đặc tả chính (2026-09-27 §3–§10) — đã kiểm mã

| Mã | Việc | Nguồn | Bằng chứng trong mã | Cỡ | PR đề xuất |
|---|---|---|---|---|---|
| T59 | Bỏ góc nhìn "Danh sách Case" ở Phân tích; `?goc=danh-sach` và `/hoc-thuat/case/:id` chuyển hướng (không 404); chức năng về chỗ có hành động (K1 §4b) | spec:206 | Còn: `shared/domain/phanTich.ts:19` (`'danh-sach'`), `web/src/modules/phanTich/PhanTich.tsx:155-170`, `App.tsx:124`, `worklist/KhoiCanXuLy.tsx:44` trỏ `?goc=danh-sach` | M | PR-Pb2 |
| T60 | Bỏ "Cả hai" ở mọi khối theo kỹ năng / bài test (Tổng quan, Phân tích, Test) | spec:207 | Còn: `shared/domain/tongQuan.ts:12-14` (`'ca-hai'`), `worklist/ChonChuongTrinh.tsx`, `OverviewPage.tsx:64-69`, `PhanTich.tsx:106,133` | M | PR-Pb2 (Phân tích) + PR-VAI (Tổng quan) |
| T61 | Hiệu quả PA tách "PA theo quy chế" (không xếp hạng, không "Nên dùng") và "PA do GV thêm"; PA huỷ vì không theo dõi ngoài mẫu số | spec:208 | Không có tách: `phanTich/HieuQuaPa.tsx:12,46` "Nên dùng" áp chung | M | PR-Pb2 |
| Q30-5 + CSP 30/09 | **Bảng Phân tích giáo viên** ở Tổng quan › Phân tích (không KPI; số liệu để QL tự đánh giá) | spec:133; chủ SP 30/09 | Không có: `GOC_NHIN` = tong-hop · van-de · hieu-qua-pa · y-thuc · danh-sach (`shared/domain/phanTich.ts:19`). Chỉ có bảng vận hành "Theo giáo viên" ở Tổng quan (`giaoVien/BangGiaoVienChiNhanh.tsx`, gọi từ `worklist/BranchPulse.tsx:9`) | L | PR-Pb2 (cần mockup) |
| T72 | Đầu hồ sơ HV "hiểu trong 30 giây": dòng thông tin có **tuần học thứ n (FT không giới hạn tuần, không mẫu số)**, thi dự kiến, GVCN · câu tóm tắt máy viết · 4 ô **Kết quả gần nhất · Học thuật · Ý thức · Sắp tới** · thanh việc của người xem | spec:219; Brainstorm E.3 | Chưa: `students/StudentDetailPage.tsx:424-497` vẫn 4 ô cũ (Kết quả Test gần nhất · Kỹ năng cần hỗ trợ · Case đang mở · Việc cần làm tiếp); không câu tóm tắt, không ô Ý thức/Sắp tới, không tuần học FT | L | PR-VAI (cần mockup) |
| T74 | Chú giải Hành trình rút 16 → 8 ký hiệu, một dòng, mặc định thu gọn | spec:221 | Chưa: `students/HanhTrinh.tsx:442-480` ~16 mục, luôn hiện | S | PR-VAI |
| E.1 + T53 Q8 | Tổng quan theo vai kiểu Hybrid (trên: việc "Hôm nay"/"Cần tôi"; dưới: số); điện thoại "Hôm nay" ≤ 3 việc + "Xem hết" | spec:203,761; Brainstorm E.1 | Một phần: GV/QL đã tách (`worklist/OverviewPage.tsx:74-90`), QL có dòng Hộp Chờ duyệt (`KhoiCanXuLy.tsx:86-90`); chưa có giới hạn 3 việc + "Xem hết" | M | PR-VAI (cần mockup) |
| E.4 / G5 | Đường dẫn sâu: mọi chỗ nhắc "MT2 · Speaking" của em mở hồ sơ Mock cuộn tới kỹ năng | spec:761; Brainstorm E.4 | (xem B2 — agent kiểm) | M | PR-VAI |
| T65 (K3-41) | Em **Tạm dừng** (bảo lưu): mọi hạn dừng, việc ẩn, dải vàng "Tạm dừng từ dd/mm · mọi hạn đang dừng" | spec:212 | **Máy chủ đã dừng hạn** (lọc `students.status='active'`: `worklist/mywork.ts:469,649,730…968`, Báo lên `duyet/loaiYeuCau.ts:264`, Ý thức `yThuc/trangThai.ts:138,170`, quay lại tính lại `cases/sosAuto.ts:317`). **Còn thiếu:** giao diện (bảng kỹ năng/Ngăn Case vẫn hiện Quá hạn, không dải vàng — `StudentDetailPage.tsx:186` chỉ một nhãn); nợ điểm không lọc em tạm dừng (`worklist/scoreDebt.ts:29`) | S–M | PR-VAI (dải + nhãn) · PR-UXF (nợ điểm) |
| T76 | Thông báo chia **Cần làm / Để biết**; mỗi thông báo trỏ đúng thẻ/dòng | spec:223 | Chưa chia nhóm: `platform/Header.tsx:171-190` một danh sách phẳng (trỏ đúng chỗ qua `duongThongBao` đã có) | S | PR-VAI |
| §7.3 Q30-6 | Mã tuần `W2 OCT` thay ngày toàn web (phần các PR chưa đổi) | spec:647 | (bảng B5) | M | PR-UXF |
| §9 | "Chưa phân loại" `vanDe.ts:83` (Case hạng mục ngoài bộ kỹ năng bị bỏ im) | spec:789 | File đã xoá; nhóm "Chưa phân loại" nay hiện ở `server/src/phanTich/vanDeHv.ts:364-368`, `cases/effectiveness.ts:482,663` — kiểm nhanh | S | UXF-a |
| K5 §7 | Tài liệu luật chưa cập nhật theo v4: Rulebook mục 5 còn "hết Chủ nhật" (`PISA-Rulebook-2026-09-19.md:137`) và "PISA Progress"; `TU_DIEN_VA_CHU.md` còn 6 chỗ "Đang chuẩn bị"; `HOP_DONG_SO_LIEU.md:33,49` còn đơn vị `tin-hieu`; `THUAT_NGU_DA_CHOT.md` còn "PISA Progress"; `Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` 6 chỗ "Đang chuẩn bị" | K5.md §7 | Tài liệu, không phải mã | M | PR-S3 (Rulebook: session planning soạn, chủ SP duyệt) |
| §10.3 D18 | Demo KPI tháng | K5.md D18 | Không có (đúng — KPI đã bỏ Q30-5). Thay bằng dữ liệu demo cho bảng Phân tích GV | S | PR-Pb2 |

Đã kiểm, **đã xong** (không đưa vào bảng): §7.6 thành phần chung `ONgay` (22 file), `OKhac`, `ChonNguoi`, `NhanTrangThai`, `TheYeuCau`/`HopChoDuyet`, `HangCase`/`HangPA`, `ODiemLon`, toast Hoàn tác (`ui/Toast.tsx`, `ScoreEntry.tsx:247`); §10.2 ô ngày: chỉ còn `type="date"` ở `platform/DemoBar.tsx:105` (T12e — cố ý giữ); T77 nút "Nhắc {GV}" (`duyet/TheYeuCau.tsx:211`); T75 bốn nhóm việc (`shared/domain/tongQuan.ts:26`); §10.3 demo D1–D17 đều có trong `server/src/seed/*` (prMtSeed, sosV3Seed, lt2aSeed, lt2bSeed, yThucSeed, duyetSeed, hvlSeed).

### B2. Từ báo cáo rà K1–K5, kế hoạch UX 26/09, việc còn lại 23/09

**B2a. Mục K1–K5 giao PR đợt 6 (chưa làm — đúng dự kiến):**

| Mã | Việc | Nguồn | Bằng chứng | Cỡ | PR |
|---|---|---|---|---|---|
| K1-06 | Số/dòng "Cần xử lý" mở danh sách chỉ đọc, không tên người giữ việc, không "Nhắc" | K1.md:51 | `server/src/worklist/metrics.ts:84,93,126` | M | VAI |
| K1-08 | Tổng quan QL 3 tầng: Cần tôi / Cần xử lý / ô số; "Cách tính" thành popover | K1.md:53 | `OverviewPage.tsx:95-113` | M | VAI |
| K1-09 | Thêm dòng "HS FT hết MT3 chưa có MT kế tiếp", dòng Vận hành "cần quyết định" | K1.md:54 | không có (grep rỗng) | M | VAI |
| K1-10 | "Tổng quan" lặp 3 lần; mức gấp chỉ bằng chấm màu | K1.md:55 | `KhoiCanXuLy.tsx:36-55` | S | VAI |
| K3-01, K3-03 | Đầu hồ sơ theo **người xem** + 4 ô E.3 (= T72) | K3.md:34,36 | `server/src/students/profile.ts:440-499`; `StudentDetailPage.tsx:424-497` | L | VAI |
| K3-32 | Bỏ khối "Mốc học tập" lặp ở tab Hành trình | K3.md:65 | `students/HanhTrinh.tsx:273` | S | VAI |
| K3-47 | = V1 dải yêu cầu chờ duyệt trong hồ sơ | K3.md:80 | web chưa dùng API | S | VAI |
| K5-10 | Phối hợp SOS vào Việc của tôi (Báo PH qua TVV đã có nhóm `phoi_hop` — `mywork.ts:836-850`) | K5.md:37 | chỉ `bao_ph_tvv` | S | VAI |
| UX-B5 | Dòng Nợ ở Lịch Test ghi tên GV chấm (T53 Q4) | ux-26/09:65 | `test/lichTest/KhoiNo.tsx` | S | VAI |
| UX-B6 | "Cần xử lý" xếp theo mức gấp, có chữ Quá hạn/Cần làm | ux-26/09:66 | `KhoiCanXuLy.tsx:36-45` | S | VAI |
| K1-42 | Thông báo: tiêu đề theo việc, nhóm Cần làm / Để biết (= T76) | K1.md:108 | `platform/Header.tsx:171-190` | M | VAI (giao UXD — gộp VAI vì cùng Header) |
| K3-30 | Chú giải Hành trình 16 → 8 (= T74) | K3.md:63 | `HanhTrinh.tsx:442-480` | S | VAI-b |
| K3-48 | Menu ⋮ (VAI), chú giải (UXD); C5 cũ đã chết | K3.md:82 | — | S | VAI/UXD |
| UX-D1,3,4,6–9 | Điện thoại: mẫu bảng→thẻ (`TheDong` đã có, mới áp HV&Lớp), bảng kỹ năng thẻ, Hành trình mở tuần này, thông báo neo mép, bảng Vận hành/BC đơn vị/Theo lớp/Tài khoản thành thẻ, Lịch Test gom "Lọc ▾", thanh dưới biểu tượng 20 px | ux-26/09:104-112 | (xem B2c) | L | UXD |
| K1-04 | Bỏ dòng "cần hỗ trợ 2 lần Test liền, chưa có Case" (= U3) | K1.md:49 | `server/src/phanTich/boQuen.ts` | S | VAI-a |
| K1-37 | Báo cáo đơn vị đếm bằng SQL riêng → lấy từ sổ chỉ số | K1.md:97 | `worklist/signals.ts:60-88` | M | UXF |
| K4-06 | Nợ ở Lịch Test chưa nhóm theo lớp; hai dòng MT3 giống hệt (thiếu tuần thi) (= UX-F7) | K4.md:39 | `server/src/cham/canCham.ts:256-257` | M | UXF |
| UX-F1–F7 | Các cặp số lệch (xem B2c) | ux-26/09:140-146 | — | M–L | UXF |
| T53 Q2 | Đếm theo **bài**, luôn ghi đơn vị; tuần chưa hết chưa quá hạn | spec:203 | (F2 — B2c) | S | UXF |
| K1-27 | = T59 bỏ Danh sách Case | K1.md:82 | xem B1 | M | Pb2 |
| Pb2-23/09 | P8b danh sách mobile + cột thao tác · P9 thanh tỷ lệ, "Thời gian thường mất", nhóm chưa xác định nguồn (hàm `planOutcomesUnattributed` có ở `cases/effectiveness.ts:290`, chưa có màn) · P9b so PA trong một vấn đề, trung vị, "hỗ trợ đồng thời" · P12 `<KetQuaDot>`/`<TyLe>` thêm màn · nhận định xu hướng | viec-con-lai:20 | grep "trung vị", "Thời gian thường mất" rỗng | M–L | Pb2 |
| K1-35, K1-36 | Trạng thái Vận hành theo ngữ pháp C.2; ba form giao việc → một nút "+ Giao việc" | K1.md:95-96 | `MgmtTasksPage.tsx:43`; `worklist/ManagerTasks.tsx:38` + `MeetingPage.tsx` | S–M | Dọn |
| K2-35 | Panel Kết thúc lớp liệt kê việc còn treo | K2.md:81 | `XoaKetThucLopPanel.tsx` | S | Dọn |

**B2b. Mục giao PR ĐÃ merge mà mã CHƯA có / có một phần** (kiểm P0+P1 của K1–K5; đã loại mục bị Q30-1/3/4/5 thay):

| Mã | Mức | Việc còn | Bằng chứng | Cỡ | PR đề xuất |
|---|---|---|---|---|---|
| K2-25 | P0 | Chuyển tiếp lớp: chọn khác gợi ý **không bắt ghi lý do** — panel gửi cứng `khacGoiY: false` (máy chủ có nhận) | `web/src/modules/classes/TransitionPanel.tsx:111`; `server/src/classes/lenhChuyen.ts:25,115` | S | UXF (sửa sớm nhất) |
| K2-12 | P1 | Bảng điểm lớp thường FOU/BE/ELE Cuối khoá chưa có cột % tổng + "Hướng gợi ý" (chỉ Pre FOU có) | `classes/BangDiemLopThuong.tsx:55` | S–M | UXF |
| K2-01 | P1 | Cột Kết quả gần nhất lớp thường thiếu hậu tố hướng (`→ học lại` / `→ lên + bổ trợ` / `→ Pass`) | `shared/domain/hocVienLop.ts:141-148` | S | UXF |
| K2-05 | P1 | "Mốc tiếp theo" lớp thường: em đã xong Cuối khoá bị gắn "Thiếu thông tin" | `server/src/classes/hocVienLop.ts:221`; `classes.ts:633`; `schedule.ts:708` | S | UXF |
| K2-26 | P1 | Lộ trình tiếp theo: lối "Ghi hướng cho cả lớp"; gộp "Chưa rõ"/"Xếp sau" — cần xác nhận còn cần sau Q30-1 | `students/LoTrinhTiepPanel.tsx:19,129`; `shared/domain/lenLop.ts:13-15` | S–M | planning quyết → UXF |
| K1-05 | P1 | Dòng Cần xử lý "Case chưa có người phụ trách · Xem" → "n lớp thiếu GV · Sửa phân công" | `shared/domain/tongQuan.ts:90` | S | VAI |
| K1-07, K1-18, K5-43 | P1 | "Cả hai" vẫn còn và **mặc định** ở Tổng quan/Phân tích (đã đẩy sang Pb2; phần không trộn cột môn đã có `phanTich.ts:228`) | `shared/domain/tongQuan.ts:12-18` | M | Pb2 + VAI (= T60) |
| K1-19 | P1 | Tổng hợp Test lớp thường: Cuối khoá 4 dải + Mini Test (= P4) | `shared/domain/phanTich.ts:196-201` | M | Pb2 |
| K1-23 | P1 | Hiệu quả PA tách quy chế / GV chọn (= T61; dữ liệu đã loại đúng `effectiveness.ts:234-238`) | — | M | Pb2 |
| K1-15, K5-11 | P1 | Chưa có **dòng Việc**: khai bậc Ý thức HS cũ (chỉ là nút `ThangYThuc.tsx:16`); QL đánh dấu kỳ vọng đầu ra BE/ELE lên FT (`normal/cuoiKhoa.ts:92`) | grep `worklist/` rỗng | S | VAI (sau reset DB, khai bậc HS cũ **còn cần** vì HS thật nhập lại) |
| K3-14 | P1 phụ | Mốc quy chế chưa có lịch quá 16 tuần → thẻ Báo lên (phần chính đã có `mywork.ts:954-983`) | không có loại trong `duyet/loaiYeuCau.ts` | S | planning xác nhận (có thể Q8 đã bỏ) |
| K5-52 | P1 | Chỉ số `yeu-cau-cho-duyet`/`-qua-han-duyet` không qua hợp đồng số liệu, không bấm ra danh sách | `worklist/tongQuan.ts:56`; không có trong `shared/domain/metrics.ts` | S | UXF |
| K3-41 | P1 | = T65 (B1): giao diện Tạm dừng + nợ điểm | xem B1 | S–M | VAI + UXF |
| — | nhỏ | `summary.approval` đếm theo nhóm `decide` đã bỏ → luôn 0, không nơi đọc | `worklist/mywork.ts:1286` | S | Dọn |

Đã xong (kiểm P0/P1): K1 01, 02, 04 (phần MT lịch sử), 11–14, 20, 22, 24–26, 30, 31, 38, 40, 41, 46–48, 56, 57 · K2 02–04, 06, 07, 09, 10, 15–20, 23, 24, 27, 28, 31–33, 36, 38, 39 · K3 02, 04–07, 09, 11–13, 15, 16, 18, 23, 26–28, 31, 33, 39, 40, 43, 45 · K4 01–05, 07–13, 16–22, 24, 27, 30, 32, 34–36 · K5 01–06, 08, 13, 14, 19–23, 25, 28–33, 36–42, 44, 45, 49–51, 53, 54, 58–62, 64, 68. Thay bởi luật mới: K5-26, K2-29 (Q30-3), K5-56, K1-28 (Q30-5), K5-66, K5-69, K4-02 (reset DB). P2 của K1–K5 giao PR đã merge: **chưa kiểm** (ngoài phạm vi; để lượt rà đợt 6).

**B2c. Kế hoạch UX 26/09 và việc còn lại 23/09 §A, §C**

Đã xong (mã có): toàn bộ mục UX giao PR đã merge — A1–A9, B1–B4, B7–B9, C1–C6, C9, C10, D1 (`ui/TheDong.tsx`), D2, D5, E1–E9, F6, F8; `thongTinLop.ts:83` (so mã chuẩn hoá); **§A A2–A5 đã xong** (`app.ts:101`, `Filters.tsx:128-139`, `ScoreEntry.tsx:1013-1032`; 3 chỗ `skillCells` không truyền `hoanTat` là cố ý R11). C5 làm theo V4 (form xác nhận, không Hoàn tác) — chấp nhận.

| Mã | Việc | Bằng chứng | Cỡ | PR |
|---|---|---|---|---|
| UX-D3 | Bảng kỹ năng hồ sơ HV thành thẻ dưới 640 px | `cases/SkillBoard.tsx:156` `<table min-w-[680px]>` | M | VAI-b |
| UX-D4 | Hành trình điện thoại: kiểm nhãn SOS khi Xem gọn (phần còn lại đã có `HanhTrinh.tsx:83`) | — | S | VAI-b |
| UX-D6 | Thông báo trên điện thoại neo mép, giờ, "Đọc hết", nhóm Chưa đọc | `platform/Header.tsx:171-195` `absolute right-0` | M | VAI-a (cùng T76) |
| UX-D7 | Vận hành, Báo cáo đơn vị, Theo lớp, Tài khoản thành thẻ | `MgmtTasksPage.tsx:205`, `MeetingPage.tsx:175`, `BranchPulse.tsx:85`, `AccountsAdmin.tsx:95` | L | UXD |
| UX-D8 | Lịch Test gom "Tuần này" + Chi nhánh vào "Lọc ▾" | `test/LichTestTab.tsx:~216` | S | UXD |
| UX-D9 | Thanh dưới biểu tượng 20 px + vạch chọn | `App.tsx:62-70` chỉ chữ 11 px | M | UXD |
| UX-F1 | Bài quá hạn: Tổng quan đếm **bài** (`metrics.ts:388`), hồ sơ GV đếm **ô** (`giaoVien/hoSo.ts:89`) — cần thống nhất (T53 Q2 = bài) | như cột trước | M | UXF |
| UX-F2, F3, F5 | Bài tuần sau tính quá hạn · 13/14 Case lệch · chip "Tất cả" ≠ tổng nhóm (`HoTroHocVienTab.tsx:151`) — cần chạy demo để xác nhận | — | S–M | UXF |
| UX-F4 | "Chưa báo cáo" đếm ô mà ghi như đơn vị | `worklist/meeting.ts:223-235`; `MeetingPage.tsx:154` | S | UXF |
| UX-F7 | Dòng Nợ trùng (tuần thi chỉ ở tooltip) (= K4-06) | `lichTest/KhoiNo.tsx:146-149` | S | UXF |
| UX-C7 | Bảng quyền: chế độ "Sửa quyền" + Lưu (nay bấm là ghi) | `platform/AdminPage.tsx:168-195` | M | Dọn |
| UX-C8 | "Bỏ lưu trữ" có Hoàn tác | `students/LuuTruPage.tsx:58-64` | S | Dọn |
| C-số | `listCases` lọc lớp (cur,a) nhưng quyền (a,cur) | `cases/cases.ts:1781-1782` vs `:1795-1796,1895` | S | Dọn |
| C-số | Bảng chi nhánh xếp Case theo lớp đang học, lọc chương trình theo lớp bài Test | `bangChiNhanh.ts:90` vs `chuongTrinh.ts:47-49` | S | UXF |
| C-số | Cột kỹ năng FT tính cả lượt thiếu điểm, tooltip không nói; `weeksReported` đếm theo mức; `hanGoc`/`soLanDoiHan` tính cả lần đặt đầu | `phanTich/tongHop.ts:180-201`; `meeting.ts:207`; `mgmttasks.ts:162-163,228-230` | S | UXF |
| C-chữ | SoLieu ghi "dưới kỳ vọng" khi chọn Lớp thường; dòng phụ Tạm ngưng bị cắt | `ui/SoLieu.tsx:~70`; `MgmtTasksPage.tsx:222` | S | S3 |
| C-quyền | `/ref/nguoi` không kiểm quyền với `studentId` · nhập bù Case không `idempotencyKey` · `helpName` không giới hạn độ dài | `platform/timNguoi.ts:93`, `routes/index.ts:315-324`; `QuickReport.tsx:207`; `mgmttasks.ts:507` | S | Dọn (**quyền/an toàn — không bớt**) |
| C-khác | `deadlineView` cắt ngày `slice(0,10)` (UTC) · BangChung `onDragLeave` nhấp nháy · Tutor ở ChonViec không lọc chi nhánh · `exec('ROLLBACK')` không `xoaNho()` · khoá `latestAttempts` dài | `shared/domain/display.ts:358`; `ui/BangChung.tsx:137`; `MeetingPage.tsx:396`; `server/src/db.ts:47,265-288`; `worklist/danhGia.ts:160` | S | Dọn |

§C đã xong/không còn: badge "n Case đang mở", ô Chờ xác minh, WorkList "quá hạn" ×3, "giờ máy", khối `hanGoc` trên màn, Hành trình Qb (4 mục), R9b, màu cứng `keHoach`, "Tôi" ở Phụ trách PA, `vanDe.ts:83` (file đã xoá; nhóm "Chưa phân loại" nay hiện ở `phanTich/vanDeHv.ts:364-368` — kiểm nhanh ở PR-UXF).

### B3. Từ thân PR #108–#143 và mục cuối các kế hoạch 28–30/09

36/36 PR đã merge. Chỉ ghi việc **chưa có trong mã** (đã grep); trùng với B1/B4 thì ghi mã bên kia.

| Mã | Việc | Nguồn | Bằng chứng | Cỡ | PR |
|---|---|---|---|---|---|
| U1 | Sắp xếp lớp bằng `soSanhLop` (6 file còn `ORDER BY code`: planning, canCham, bangChiNhanh, branchpulse, summary, xoaTaiKhoan) | #112 | không dùng `soSanhLop` | S | UXF |
| U2 | = VN05 dải Chờ duyệt theo bộ lọc | #117 | `tongQuan.ts:56` | S | VAI |
| U3 | Bỏ chỉ số "HV cần hỗ trợ 2 lần Test liền, chưa có Case" (K1-04) | #119 | `shared/domain/metrics.ts:240`, `tongQuan.ts:91`, `server/src/phanTich/boQuen.ts` | S | VAI-a |
| U4 | `ConfirmDialog` nút "Huỷ" → "Đóng" | #119, #126 | `web/src/ui/Drawer.tsx:49` | S | S3 |
| U5 | Thẻ Lịch thi bỏ năm khỏi mã tuần (G-6) | #119 | `duyet/loaiYeuCau.ts:161,165` ("W4 SEP 2026") | S | UXF |
| U6 | Viết đủ "Quản lý" thay "QL" (còn ở `loaiYeuCau.ts:48`, `ViecCuaToi.tsx:39`, `ClassYThucCard.tsx:92,225,228`, `YThucPhoiHop.tsx:103,130,143`) | #119 | như cột trước | S | S3 |
| U7 | "Đúng hạn cập nhật": đếm trễ cả khoảng ghi bù (K3-17) | N1 → SOS → #127 | `worklist/metrics.ts:210-245` | M | UXF |
| U11 | = R5-2 Hành trình "chờ duyệt kế hoạch" | #139 | `shared/domain/hanhTrinh.ts` | S | UXF |
| U12 | Bảng Kết quả kiểm tra lớp thường theo mẫu K4-33 (nếu chủ SP muốn) | #131 | `StudentDetailPage.tsx:642` | S | UXF |
| U13 | Viền ô nhập chế độ tối < 3:1 | #134 | chưa làm | M | UXD |
| U14 | Dòng phụ hàng lớp thiếu LT1/LT2 (mockup 21 mục 5) | #112 | `StudentsPage.tsx` | S | UXD |
| V1 | Dải "n yêu cầu chờ bạn duyệt" ở hồ sơ HV (K3-47) — API có (`duyet/yeuCau.ts:318` nhận `studentId`) | #117 | web chưa dùng | S | VAI |
| V2 | Badge "việc quá hạn" cho GV (K1-44) | #117, #128 | không có | M | VAI |
| V3 | Nhóm việc: khoá `result` → `ghi_ket_qua_pa` (T75 tên) | #117 | `worklist/mywork.ts:497` | S | VAI |
| V4 | Việc Vận hành tạm ngưng/dừng dùng `NhanTrangThai` (K1-35) | #113 | `MgmtTasksPage.tsx:43` | S | Dọn |
| V8 | Tổng quan theo vai thêm: Nộp kế hoạch/Báo PH, khối "Sắp chuyển lớp", Mini Test | #139–#141 | `OverviewPage.tsx` chưa có | L | VAI |
| V9 | Ba tầng thông tin (§7.5) mỗi màn còn lại | #134 | chưa làm | M | VAI + UXD |
| D1 | Lưới Thêm học viên dạng thẻ trên điện thoại | #120 | không có | M | UXD |
| D2 | Dùng lại `TheDong` cho các bảng UX-D D1, D3–D9 (mới có ở Học viên & Lớp) | #133 | chưa áp | L | UXD |
| P4 | Tổng hợp Test lớp thường: 4 dải % + Mini Test (K1-19) | #139, #141 | không có | M | Pb2 |
| P6 | Hồ sơ GV theo kỹ năng (mockup 06d) + "Hỗ trợ đã thực hiện" | kế hoạch GV | không có | M | Pb2 (cùng bảng Phân tích GV) |
| S1 | Nhãn chặng dùng chữ "thi" cho bài nội bộ | #112 | `shared/domain/fasttrack.ts:86-89` | S | S3 |
| S2 | "Đề ra PA" → "Lập phương án" toàn web | #133 | `server/src/students/profile.ts:486`, `QuickReport.tsx:302` | S | S3 |
| Dn1 | Hằng `ACADEMIC_SUPPORTS`, `OPS_POLICIES` không dùng | #113 | `shared/domain/cases.ts:1062,1070` | S | Dọn |
| Dn7 | Nhận xét W/S hiện trong dòng thời gian lượt | #131 | `DongThoiGianLuot.tsx` không đọc nhận xét | S | Dọn |
| Dn8 | Chú thích "ký tự nhỏ của Inter" → "của phông" (8 file) | #134 | SkillBoard, DongThoiGianLuot, ODiemLon, … | S | Dọn |
| Dn9 | Xoá `peopleOf`/`people` của `/branch-pulse` + phép kiểm cũ | #138 | `worklist/branchpulse.ts:236,243` | S | Dọn |
| Dn10 | Bỏ bí danh `canQl` (nợ `ponytail:`) | #141 | `shared/domain/cuoiKhoa.ts:35,75` | S | Dọn |
| Dn11 | Phần thừa `/ponytail-review` #112 (~50 dòng): `transition.ts:198,228`, `sysconfig.ts:75,104,140`, … | #112 | còn | S–M | Dọn |
| Dn12 | Gợi ý gọn nhỏ: `goiYGanDay`, `TruongDeXuat` khai trùng, `HAN_XAC_NHAN_NGAY`… | #113–#127 | còn | S | Dọn |
| **O1** | Dòng tím **Xin ý kiến** ở `HangPA` (K3-11) — giao PR-SOS, PR tự báo chưa làm | #117 → #127 | chỉ có ở `CasePanel.tsx:271`, `SkillBoard` không | S | UXF |
| **O2** | Panel Tạm dừng thiếu "n vi phạm cần xử lý tạm dừng hạn" (K3-41) | #128 | `StudentManagePanel.tsx:83-90` chỉ đếm Case | S | UXF (cùng T65) |
| **O3** | Nhật ký Quản trị ghi mã máy (`talk_family`) cho phối hợp SOS | #110 → SOS/YT4 | `yThuc/phoiHop.ts:374,402,433` `entityLabel = r.kind` | S | S3 |
| **O4** | Menu dòng "Ghi Mini Test" (K2-30 phần còn) — có thể cố ý | #128 → LT2b | `shared/domain/hocVienLop.ts:257` | S | planning xác nhận |
| **O5** | 7 panel dùng `Field` chưa có `useLoiForm` (AccountsAdmin, CatalogAdmin, IntakePanel, StudentPlanPanel, ClassProgressPanel, ManagerTasks, MgmtTasksPage); 2 hộp Vận hành còn `Modal` (`MgmtTasksPage.tsx:449,534`) | #113, chưa giao | còn | M | Dọn |
| **O6** | Chip "Bàn giao n/m em" trong hồ sơ GV | kế hoạch GV, #140 | `giaoVien/` không có | S | Pb2 |
| Q2 | Đầu hồ sơ HV không hiện ngày thi dự kiến | #120 | `StudentDetailPage.tsx` đầu trang | S | VAI (T72) |

Nợ `ponytail:` còn trong mã (5, ghi nhận, không phải việc): `lenhChuyen.ts:294` (40 nhóm/lượt), `mywork.ts:268` (nạp cả bảng lớp), `yThuc/trangThai.ts:211`, `yThuc/xuLy.ts:442` (nháp bỏ dở không tự dọn), `cuoiKhoa.ts:35` (= Dn10).

### B4. Việc nhỏ (2026-09-29 + bản nháp) và rà đợt 5

Nguồn `_nhap-viec-nho.md` (bản `2026-09-29-viec-nho-sau-ra-dot-2.md` = dòng 5–27 của bản nháp). Đã xong, bỏ: VN06, 07, 09, 11–14, 16, 23 (+ VN08 còn sót một câu). Không phải việc: VN04 (cố ý), VN30 (planning chấp nhận).

| Mã | Việc | Nguồn | Bằng chứng | Cỡ | PR |
|---|---|---|---|---|---|
| VN01 | Thẻ Xin ý kiến "Bổ sung": câu cũ và mới dính một dòng | nháp:5 | `duyet/yeuCau.ts:132` ghép `\n`; `TheYeuCau.tsx:154` `<p>` không `pre-line` | S | UXF |
| VN02 | `duyetNhieu`: id sai dạng trả 400 trước khi kiểm quyền | nháp:6 | `duyet/yeuCau.ts:434-438` | S | Dọn |
| VN03 | `apDungCaLop` FT→FT thiếu chú thích | nháp:7 | `classes/luatLoTrinh.ts:472` | S | Dọn |
| VN05 | Dải Chờ duyệt ở Tổng quan QL không theo bộ lọc chi nhánh/chương trình | nháp:9 | `demYeuCau` không nhận branchId/ct (`yeuCau.ts:355`, `tongQuan.ts:56`) | M | VAI |
| VN08b | Câu "QL đã duyệt, quá 5 ngày…" còn viết tắt "QL" | nháp:12 | `duyet/loaiYeuCau.ts:48` | S | S3 |
| VN10 | `decideAbsenceMove` không chặn MT lịch sử; `moTaDoiLan2` chỉ phép kiểm dùng | nháp:14 | `fasttrack/absence.ts:388` (baoVang `:868` có chặn), `:176` | S | Dọn |
| VN15 | Đổi Thi dự kiến ngày → tháng vẫn giữ `exam_period_id` cũ | nháp:19 | `students/cycles.ts:185-187` | S | Dọn |
| VN17 | Toast "Đã đọc n dòng" che nút | nháp:21 | `ui/Toast.tsx:46` | S | UXD |
| VN18 | mywork `lopMap` chỉ lấy chương trình `active` | nháp:22 | `normal/regular.ts:56`, `worklist/mywork.ts:274` | S | Dọn |
| VN19 | `openMoveRequests` lỗi `s.code` (cột là `student_code`) — đường chết | nháp:23 | `fasttrack/absence.ts:843` | S | Dọn (xoá) |
| VN20 | Năm `0208` báo "ngày không có thật" thay vì câu cận năm | nháp:24 | `shared/domain/oNgay.ts:17-20,57` | S | Dọn |
| VN21 | Lớp thường khai giảng trước (năm nay − 3) → tuần mặc định lỗi dòng 0 | nháp:25 | chưa thấy commit sửa | S | Dọn |
| VN22 | Đo tốc độ thật trên DB THỬ Turso | nháp:26 | việc tay | — | trước deploy |
| VN24 | Seed PA hạn rơi Chủ nhật 20/09 | nháp:28 | `seed/students.ts:769` | S | Dọn |
| VN25 | PATCH `/cycles` đổi target không ghi lịch sử, không đòi lý do (khác `reviseTarget`) | nháp:29 | `students/cycles.ts:209-212,261` vs `:458-489` | M | Dọn |
| VN26 | Sau khi QL từ chối vẫn ghi "2 vi phạm / 2 tuần" | nháp:30 | `yThuc/ClassYThucCard.tsx:227` | S | UXF |
| VN27 | Demo H1 thiếu "Case chung" | nháp:31 | `seed/hvlSeed.ts:19-20` | S | Dọn |
| VN28 | Ô hạn ghi "hết T2 14/09" thay vì "hạn hết T2 …" | nháp:32 | `shared/domain/hocVienLop.ts:308` | S | UXF |
| VN29 | Nhập điểm quá hạn mà em không vào chip "Cần làm" | nháp:33 | `shared/domain/hocVienLop.ts:44` | M | UXF |
| VN31 | `nav.ts` gọi `phamViXuatMt` mỗi lần tải phiên | nháp:35 | `server/src/platform/nav.ts:28` | S | Dọn |
| VN32 | Hạn 11 px (E4 muốn 12 px) | nháp:36 | `ui/Han.tsx:52` | S | chủ SP quyết → S3 |
| VN33 | 375 px: ô tìm bị cắt "Tìm học", tên tài khoản cắt | nháp:37 | `platform/Header.tsx:101` `w-28` | S | UXD |

**Rà đợt 5 — còn sau S5F-a (#143) / S5F-b (#142)** (mọi phát hiện Important/Critical đã sửa; đối chiếu thân PR + mã):

| Mã | Việc | Bằng chứng | Cỡ | PR |
|---|---|---|---|---|
| R5-1 | CT Minor 2: dải "Sắp chuyển" ở hồ sơ HV còn "lệnh … **ngày 14/09**" — #143 ghi đã sửa nhưng **mã chưa đổi** | `classes/DaiChuyenLop.tsx:98` | S | UXF |
| R5-2 | LT2a: Hành trình ghi "Chưa có PA" cho Case có PA Bổ trợ chờ kế hoạch | `students/HanhTrinh.tsx:401-419` | S | UXF |
| R5-3 | LT2a: hàng Case chính không hiện hạn duyệt kế hoạch (chỉ hàng con) | `cases/SkillBoard.tsx:362,476` | S | UXF |
| R5-4 | LT2a: Báo PH qua TVV sinh theo môn trượt của bài, không theo Case còn mở | chưa PR nhận | S | planning quyết → UXF |
| R5-5 | Luồng m-1: Case G+V nằm hàng Writing ở hồ sơ BE sau chuyển lớp, classId cũ | chưa kiểm sâu | S–M | UXF |
| R5-6 | LT2b chưa rà: ảnh 375 px, cột Excel "Hướng gợi ý", Hành trình ghim, panel Kết thúc lớp "Còn treo" (= K2-35) | chưa ai rà | M | UXD (375) + Dọn (K2-35) |
| R5-7 | Cần chủ SP **biết**: PA bổ trợ Giữa khoá không tự khép khi chuyển lớp (GV cũ vẫn có việc Ghi kết quả cuối, có thể quá hạn) — a#4; GVBM một môn nay 403 khi ghi PA chung FOU — b#3; lệnh `cho` luôn huỷ được; hộp Kết luận khoá lớp vừa rời vẫn hiện (#143) | thân #142/#143 | — | báo chủ SP |

### B5. Mã tuần `W2 OCT` — màn còn hiện ngày (Q30-6, gom PR-UXF)

Hàm có sẵn: `tuanLich()` (`shared/domain/hienThiNgay.ts:22`, ra "W3 SEP"), `tuanKhoa()` ("W8/8"), `weekCodeShortOf()` (`week.ts:58`). Giữ ngày đúng luật: `<Han>`/"hạn …", hạn bàn giao, ngày thi/Mini Test, ngày sinh, nhật ký (Ý thức, dòng thời gian, thẻ "đề xuất dd/mm", audit), DemoBar, Lưu trữ.

| Màn | file:dòng | Đang hiện | Đổi |
|---|---|---|---|
| Bộ chọn tuần (Chấm điểm, Tạo lớp, Tuần khai giảng, Lộ trình HV, Lịch Test, Họp tuần) | `ui/Filters.tsx:182-183` | "14/09 – 20/09" to, "W3 SEP" nhỏ | Mã tuần chính, khoảng ngày thành phụ/tooltip |
| Hồ sơ lớp · Tuần khai giảng / lớp đã kết thúc | `ClassProgressPanel.tsx:94`; `DauTrangLop.tsx:137` | "Khai giảng W2 SEP · 14/09"; "Lớp đã kết thúc 02/11" | Bỏ ngày / mã tuần |
| Hồ sơ HV · dải Sắp chuyển | `DaiChuyenLop.tsx:98` | "lệnh … ngày 14/09" | Bỏ ngày (R5-1) |
| Hồ sơ HV · Case/PA (khoảng PA, kết quả gần nhất, mốc "1 tháng", "mở 31/08") | `CasePanel.tsx:234-235`; `SkillBoard.tsx:433,465`; `shared/domain/sosV4.ts:38`; `NganCase.tsx:170`; `server/src/cases/cases.ts:2630-2642` | "14/09 → 28/09", "Giữ nguyên · 21/09", "đến 14/10", "· xong 14/09" | Mã tuần (giữ ngày cho `until_exam`, Mini Test) |
| Hồ sơ HV · Hành trình (khối PA, vấn đề) | `shared/domain/hanhTrinh.ts:173,222,228` | "14/09 → 28/09", "Xong 14/09", "từ 14/09" | Mã tuần |
| Hồ sơ HV · Mục tiêu đã đổi / lịch sử chương | `StudentDetailPage.tsx:332,686` | "lần gần nhất 14/09", "dd/mm → dd/mm" | Mã tuần (giữ `:703` nhật ký) |
| Bảng Case · Báo vấn đề | `CaseBoardPage.tsx:194`; `QuickReport.tsx:549,560` | ngày phát hiện, "trùng khoảng 01/09 → 14/09", "Mở 31/08" | Mã tuần (bảng Case bỏ luôn nếu T59) |
| Phân tích · Vấn đề HV, Bỏ quên | `server/src/phanTich/vanDeHv.ts:361`; `boQuen.ts:109` | "mở dd/mm", "Case đóng dd/mm" | Mã tuần |

Đã đúng, giữ: Phân tích › Tổng hợp theo tuần (`tongHop.ts:140`), lịch MT ở Lộ trình HV (`StudentPlanPanel.tsx:181`), hồ sơ Mock (`MockDetailPage.tsx:180,266,620`).

### B6. Chuẩn bị deploy bản chính + reset DB

**Hiện trạng (đã kiểm mã):**
- `npm run init-ban-chinh` (`package.json:18` → `server/src/ops/runInit.ts`, `initBanChinh.ts:87-118`) chạy `schema.sql` + `napDuLieuNen` trong **một** giao dịch; chặn DB đã có dòng (`initBanChinh.ts:74-75`), chặn mật khẩu demo (`:80`), in "Đích: BẢN CHÍNH/THỬ/KHÔNG RÕ" (`runInit.ts:31-32`). Tạo: quyền, vai, lộ trình LT1/LT2/RF, chương trình + kỹ năng + mốc (có Pre FOU), ngưỡng 70 %, chi nhánh thật từ `CHI_NHANH`, đơn vị TUTOR, 1 Quản trị `NV001` từ `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- `schema.sql` **khớp** migrate đợt 1–5: 40 bảng/cột/chỉ mục của 13 migrate (N1, LOP, DUYET, MT, NHAP, MON, KCK, SOS, YT4, HSM, LT2a, LT2b, CT + `thu_ngay` S5F-a) đều có, ví dụ `lenh_chuyen_lop` `schema.sql:1794`, `mini_test` `:1832`, `ban_giao_mon` `:1819`; mỗi PR có phép kiểm "schema.sql → migrate không làm gì" (`tests/prCt.tests.ts:129-137`).
- Cron: `netlify.toml:17-18` lập lịch `chot-vang` 00:05 + 06:05 sáng Thứ Hai (giờ VN) → `netlify/functions/chot-vang.ts` → `ops/chotVangDinhKy.ts:28` chốt vắng **và** `:31` thi hành lệnh chuyển lớp (`classes/lenhChuyen.ts:287`, ≤ 40 nhóm/lượt); dự phòng quét khi đọc (`lenhChuyen.ts:331`). `quetYeuCau` (quá hạn duyệt) và `sweepExpiredMoves` chỉ chạy khi có người mở trang (không cron) — chấp nhận theo thiết kế.
- Seed demo **không** lọt lên bản chính: `npm run seed` từ chối Turso trừ khi `PISA_CHO_PHEP_SEED_TURSO` = đúng tên DB thử (`db.ts:179-185`, `moiTruong.ts:69-73`); "Vào nhanh" 404 khi `BAN_CHINH` (`routes/index.ts:108-113`).
- **Không** còn lệnh `bo-sung-mt-mac-dinh` (planning 29/09 bỏ vì reset DB — `server/src/migrate/chayThuMt.ts:7`) → H7 (§10.4) và T35 hết hiệu lực.

| Mã | Việc | Bằng chứng | Cỡ | Ai |
|---|---|---|---|---|
| DEP-1 | `napDuLieuNen` ghi luôn khoá `xoa_du_lieu_backfill_at` (nếu không, lần `migrate` đầu tiên trên DB mới sẽ lưu trữ lại HV đã thôi học mà QL đã "Bỏ lưu trữ") + phép kiểm "init → migrate không làm gì" | `seed/duLieuNen.ts:64`, `migrate.ts:3324-3331` | S | PR-DEPLOY |
| DEP-2 | Rà các bước dữ liệu chạy lại mỗi lần migrate: `migratePrN1` (chỉ dời hạn rơi Chủ nhật → an toàn lặp, rủi ro thấp), `prDuyet.ts:69-71` (`napYeuCauTuNguonCu`), `prMon.ts:41-43`; sau reset có thể gỡ hoặc khoá chạy-một-lần | `migrate/prN1.ts:12-13,44-47` | M | PR-DEPLOY |
| DEP-3 | Mọi PR đợt 6 giữ `schema.sql` = migrate (theo mẫu `prCt.tests.ts:129-137`) | quy trình | S | mọi PR đợt 6 |
| DEP-4 | TRIEN_KHAI.md: thêm mục **"Reset bản chính"** (các bước tay dưới); sửa dòng lỗi thời: L6-7 (Z2 chưa merge), L89-96 (bảng nhắc Z2a/Z2c), L102/L110 (tên DB mới phải bắt đầu `pisatracking-`, vd `pisatracking-v2`; tạo lại đúng tên cũ thì Blobs dùng lại kho tệp cũ — `khoTep.ts:17`), L247 ("một lần duy nhất"), L317-318 ("chưa từng chạy trên Turso rỗng"), L382-386 (DB THỬ phải lên schema đợt 6 trước), L407 (§9 bước 4 "Xếp lịch MT" — nay tự tạo; thiếu email bắt buộc), L508-579 (§11.1 lệnh chạy thử đợt 1–2 → lịch sử), §12 thiếu `PISA_CHO_PHEP_SEED_TURSO`; `package.json:22` `kiem-sau-xoa` trỏ mục không còn | `TRIEN_KHAI.md` | M | PR-DEPLOY |
| DEP-5 | DEMO.md, README: tên lớp mẫu mới, kịch bản D1–D17, bỏ kịch bản v3 (K5 §7) | `DEMO.md` | S | PR-DEPLOY |
| TAY-1 | `git pull` + `npm install` main đã có đợt 6; **sao lưu DB chính cũ + tệp** (giữ làm lưu trữ, chưa xoá) | TRIEN_KHAI §10 | S | chủ SP |
| TAY-2 | DB THỬ: `npm run migrate` (`PISA_CHO_PHEP_MIGRATE_TURSO`) hoặc seed lại (`PISA_CHO_PHEP_SEED_TURSO`) trước deploy nháp | §11.1 | S | chủ SP + session |
| TAY-3 | Tạo DB Turso mới `pisatracking-<hậu tố>` (Ohio); tập dượt init trên DB tạm (lần cuối 23/09) | §2, §7a | S | chủ SP |
| TAY-4 | `npm run init-ban-chinh` với `CHI_NHANH` = **danh sách chi nhánh thật `MÃ=Tên`**, `ADMIN_EMAIL`/`ADMIN_PASSWORD` **tài khoản quản trị thật** | §7 | S | chủ SP |
| TAY-5 | `netlify env:set TURSO_DATABASE_URL/TURSO_AUTH_TOKEN --context production` → deploy nháp → thử → `--prod`; kiểm không có "Vào nhanh", ngày thật; Thứ Hai đầu xem log `[chot-vang]` | §6, §8, §11.3 | S | chủ SP |
| TAY-6 | Nhập dữ liệu thật: tài khoản QL/GV, lớp + phân công, học viên (email bắt buộc, lịch MT tự tạo) | §9 | M | chủ SP / QL |
| TAY-7 | Sau vài tuần: xoá DB cũ + DB tạm; mọi người đăng nhập lại (phiên nằm ở DB cũ) | — | S | chủ SP |

**PR-S3 (23/09 §B) còn thật trên mã** (kiểm nhanh): 29 `<SectionNote>` / 60 `<Empty>` cần rà chữ · `WorkQueue` chết (`StudentsPage.tsx`) · `server/src/worklist/dashboard.ts`, `summary.ts` chưa dọn · 30 chỗ đọc `demoDate` ở `web/src` (RB-4) · nhãn "Việc đã giao" (`MeetingPage.tsx:212`) · THUAT_NGU ~170 dòng, RB-2 tự viết "hạn", DOC-x, `cn`↔`branchId`, nút thanh dưới 44 px — chưa kiểm từng dòng (session S3 kiểm lại đầu PR). Cỡ **M–L**.

## (c) Đề xuất gom PR

Nguyên tắc: mỗi PR ≤ ~12 task; PR chạm cùng file thì nối tiếp; P0 sót (K2-25) làm sớm nhất. Model theo đặc tả §8 (người rà luôn Opus 5.5, session riêng; rà theo đợt).

**Đợt 6 — lượt 1 (song song 4 làn):**

| Làn | PR | Nội dung (mã ở bảng B) | ~Task | Model (B) | Chờ |
|---|---|---|---|---|---|
| A | **PR-VAI-a** Tổng quan theo vai · Công việc · chuông | E.1 + T53 Q8 (Hôm nay ≤ 3 + Xem hết), K1-06, K1-08, K1-09, K1-10, K1-05, K1-04/U3 (bỏ dòng "2 lần Test"), V8 (Nộp kế hoạch/Báo PH, Sắp chuyển lớp, Mini Test), VN05/U2, UX-B5, UX-B6, V2 badge quá hạn GV, V3 + K1-15/K5-11 (dòng việc khai bậc, kỳ vọng đầu ra), K5-10, T76/K1-42/UX-D6 (chuông Cần làm/Để biết, neo mép điện thoại) | 12 | Fable 5.1 · High (Opus 5.5 · High) | **mockup A** |
| B | **PR-VAI-b** Hồ sơ HV "hiểu trong 30 giây" | T72/K3-01/K3-03/Q2 (dòng thông tin có tuần học thứ n (FT không giới hạn tuần, không mẫu số) + thi dự kiến, câu tóm tắt, 4 ô Kết quả · Học thuật · Ý thức · Sắp tới, thanh việc của người xem — máy chủ `profile.ts`), V1/K3-47 dải chờ duyệt, T65/K3-41 phần giao diện (dải vàng Tạm dừng, nhãn Case/PA), K3-32, T74/K3-30 chú giải 8 ký hiệu, UX-D3 bảng kỹ năng thành thẻ 375 px, UX-D4 | 9 | Fable 5.1 · High (Opus 5.5 · High) | **mockup B** |
| C | **PR-Pb2** Phân tích còn lại | T59 (bỏ Danh sách Case + chuyển hướng), T60/K1-07/K1-18/K5-43 (bỏ "Cả hai" toàn web — sở hữu hằng `CHUONG_TRINH`), T61/K1-23, P4/K1-19 (Tổng hợp Test lớp thường 4 dải + Mini Test), **bảng Phân tích giáo viên** (Q30-5), P6 hồ sơ GV theo kỹ năng, O6 chip bàn giao, Pb2-23/09 (P8b, P9, P9b, P12, xu hướng), demo cho bảng GV | 11 | Fable 5.1 · High (Opus 5.5 · High) | **mockup C** (T59/T60/T61/P4 làm trước được) |
| D | **PR-UXF-a** Số liệu khớp + sót lớp thường | **K2-25 (P0) làm task 1**, K2-12, K2-01, K2-05, UX-F1–F5, F7/K4-06, T53 Q2, K1-37, K5-52, U1, U7/K3-17, C-số (bảng chi nhánh, tongHop, meeting, mgmttasks), VN29, T65 nợ điểm (`scoreDebt.ts`) | 12 | Opus 5.5 · High (Fable 5.1 · High) | — |

**Đợt 6 — lượt 2 (sau khi lượt 1 merge):**

| Làn | PR | Nội dung | ~Task | Model (B) | Chờ |
|---|---|---|---|---|---|
| A | **PR-UXD** Điện thoại 375 px | UX-D7 (Vận hành, BC đơn vị, Theo lớp, Tài khoản → `TheDong`), D8, D9, D1 Thêm HV dạng thẻ, D2 áp `TheDong` còn lại, VN17, VN33, U13 viền ô tối, U14, R5-6 ảnh 375 LT2b, V9 ba tầng phần còn | 11 | Fable 5.1 · High (Opus 5.5 · High) | VAI-a, VAI-b |
| B | **PR-UXF-b** Mã tuần + sót đợt 5 | B5 toàn bộ (bộ chọn tuần, hồ sơ lớp, Case/PA, Hành trình, Phân tích), R5-1…R5-5, O1 (Xin ý kiến ở `HangPA`), O2, U5, VN01, VN26, VN28, K2-26 (nếu chủ SP giữ) | 11 | Sonnet 5 · High (Fable 5.1 · High) | VAI-b, Pb2 (cùng file hồ sơ/Phân tích) |

**Bước cuối trước deploy (tách 3 PR, hai PR đầu song song):**

| PR | Nội dung | ~Task | Model (B) | Chờ |
|---|---|---|---|---|
| **PR-S3** Chữ cuối + tài liệu luật | S3-23/09 (mục trên), S1, S2, U4, U6, VN08b, O3, C-chữ, VN32 (theo quyết định Câu 4), K5 §7 tài liệu luật (Rulebook mục 5, TU_DIEN, THUAT_NGU, HOP_DONG_SO_LIEU, Y_THUC, SOS_V3 — **Rulebook do planning soạn, chủ SP duyệt**, session code chỉ áp) | 12 | Sonnet 5 · High (Fable 5.1 · Medium) | lượt 2 |
| **PR-Dọn** Mã thừa + quyền + an toàn | VN02, VN03, VN10, VN15, VN18, VN19/Dn2, VN20, VN21, VN24, VN25, VN27, VN31, Dn1, Dn3–Dn12, O5 (`useLoiForm` 7 panel), UX-C7, UX-C8, C-quyền (`/ref/nguoi`, idempotency nhập bù, `helpName`), C-khác, K1-35/V4, K1-36, K2-35, `summary.approval` | 12 (gộp nhóm S) | Sonnet 5 · High (Fable 5.1 · High) | lượt 2 (song song S3: Dọn chủ yếu `server/`, S3 chủ yếu chữ `web/` + tài liệu) |
| **PR-DEPLOY** Chuẩn bị reset | DEP-1 (khoá backfill trong `napDuLieuNen`), DEP-2 (khoá chạy-một-lần / gỡ bước dữ liệu cũ), DEP-4 TRIEN_KHAI mục "Reset bản chính" + sửa dòng lỗi thời, DEP-5 DEMO/README, tập dượt init trên DB tạm, đo tốc độ DB THỬ (VN22) | 6 | Opus 5.5 · High (Fable 5.1 · High) | S3 + Dọn merge |

Rồi chủ SP làm TAY-1…TAY-7 (B6). **Tổng còn: 8 PR** (6 đợt 6 + S3/Dọn song song + DEPLOY). Nếu muốn ít PR hơn: gộp PR-UXF-b vào PR-UXD (một PR ~20 task, cần tách session) — không khuyên.

Phụ thuộc: VAI-a ∥ VAI-b ∥ Pb2 ∥ UXF-a → UXD, UXF-b → S3 ∥ Dọn → DEPLOY → reset. Xung đột dự kiến: `shared/domain/tongQuan.ts` (VAI-a, Pb2 T60, UXF-a K5-52) — Pb2 merge trước VAI-a nếu được, hoặc VAI-a gộp lại sau; `StudentDetailPage.tsx` chỉ VAI-b ở lượt 1.

## (d) Hoãn có chủ ý · câu hỏi cho chủ sản phẩm

**Hoãn có chủ ý (không làm):** taxonomy vấn đề (chờ tổ chuyên môn) · kho ý tưởng I01–I26 · DS còn lại · màn tạo chi nhánh AN-14 (giữ lệnh `them-chi-nhanh`) · F-4 cảnh báo trùng Case · 3 ý tưởng đã loại (plan §20.1) · khối "Cần quyết định trong cuộc họp", số trên hàng tab · `/demo/accounts` N+1 (bản chính 404) · **KPI tháng GV** (Q30-5; D18, K1-28, K5-56) · thẻ "Quyết định Cuối khoá" (Q30-3) · lệnh `bo-sung-mt-mac-dinh` + migrate dữ liệu cũ (T35, H7, K4-02, K5-66, K5-69 — vì reset DB) · luật C02 (GVCN không dạy môn đó không nhập bù Case môn đó) **giữ** · Brainstorm §H (ý tưởng lớn).

**Planning tự quyết (ghi vào kế hoạch, không hỏi):** K2-25 bắt lý do khi chọn khác gợi ý (luật PR-CT đã chốt) · O4 "Ghi Mini Test" ở menu dòng: không thêm (đã ghi ở form Ghi kết quả) · K3-14 thẻ Báo lên 16 tuần: không thêm nếu Q8 đã bỏ, tra lại · R5-4 Báo PH theo Case còn mở · quá hạn duyệt chỉ quét khi có người mở web (không thêm cron) · K2-26 "Ghi hướng cả lớp": bỏ (Q30-1 — QL quyết ở panel Chuyển lớp).

**Chủ sản phẩm cần biết (đã chạy khác kế hoạch — đợt 5):** PA bổ trợ Giữa khoá không tự khép khi em chuyển lớp (GV lớp cũ vẫn có việc Ghi kết quả cuối); GVBM một môn không ghi được PA chung FOU (chỉ người phụ trách); lệnh chuyển "chờ" luôn huỷ được; hộp Kết luận khoá của lớp vừa rời vẫn hiện.

**Câu hỏi (4):**

1. **Bỏ "Cả hai" (T60)?** A. Bỏ hẳn; QL mặc định Fast Track, GV mặc định khung của lớp mình dạy · B. Giữ "Cả hai" nhưng không mặc định. **Khuyên A** (đặc tả đã chốt; số theo kỹ năng không cộng được giữa hai khung).
2. **Bảng Phân tích giáo viên hiện gì?** A. Mỗi GV một hàng, theo khoảng thời gian + khung: lớp/HV đang dạy · bài chấm đúng hạn `n/N` · Case phụ trách: mở · đóng · thành công `n/N` · PA do GV thêm: tỷ lệ tiến bộ · vi phạm xử lý đúng hạn (GVCN) · bàn giao đúng hạn — sắp theo tên, không xếp hạng, không màu tốt/xấu, mọi số bấm ra danh sách · B. Như A + đường xu hướng theo tháng từng GV. **Khuyên A**, thêm B sau khi có 2–3 tháng dữ liệu thật.
3. **Điện thoại (PR-UXD) làm tới đâu?** A. Đủ D1–D9 (cả bảng Vận hành, BC đơn vị, Tài khoản — màn QL/Quản trị) · B. Chỉ màn GV dùng trên điện thoại (hồ sơ HV, Lịch Test, thông báo, thanh dưới, Thêm HV); bảng quản trị để laptop, hoãn D7. **Khuyên B** (bớt một phần L; QL/Quản trị làm việc trên laptop) — nếu chọn A thì UXD tách hai PR.
4. **Chữ nhỏ 11 px → 12 px?** (VN32, D3 kế hoạch SANG, E4) A. Mọi `text-[11px]` lên 12 px · B. Chỉ kết quả, hạn, người phụ trách lên 12 px (đúng §7.4); nhãn `Nhan` giữ 11,5 px. **Khuyên B** (ít vỡ bố cục, đủ dễ đọc).

## (e) Màn cần mockup trước khi code

Đã kiểm `thiet-ke/mockup/`: **không có** mockup đã duyệt cho ba màn chính của đợt 6 (`02-tong-quan.html` là bản 22/09 trước nâng cấp; hồ sơ HV chỉ có phác ASCII ở Brainstorm E.3 + chữ K3 §4(e); `21-ho-so-giao-vien.html` màn D là bảng **vận hành** ở Tổng quan, không phải Phân tích).

| Mockup | Nằm ở | Nội dung phải vẽ | Chặn PR |
|---|---|---|---|
| **A. Tổng quan theo vai** | Tổng quan (trang đầu) — GV / QL / Quản trị | Hybrid: trên "Hôm nay"/"Cần tôi" (≤ 3 dòng điện thoại + Xem hết), dưới số; khối Sắp chuyển lớp, Nộp kế hoạch/Báo PH, Mini Test; dòng Chờ duyệt theo bộ lọc; chuông Cần làm / Để biết (điện thoại neo mép) | PR-VAI-a |
| **B. Hồ sơ HV "hiểu trong 30 giây"** | Học viên & Lớp › mở một em › đầu hồ sơ + tab Học thuật | Dòng thông tin (tuần học thứ n (FT không giới hạn tuần, không mẫu số), thi dự kiến, GVCN), câu tóm tắt, 4 ô Kết quả · Học thuật · Ý thức · Sắp tới, thanh việc người xem, dải Tạm dừng, dải chờ duyệt (QL); bảng kỹ năng dạng thẻ 375 px; chú giải Hành trình 8 ký hiệu | PR-VAI-b |
| **C. Phân tích giáo viên** | Tổng quan › tab Phân tích › góc nhìn mới "Giáo viên" (thay chỗ "Danh sách Case" bị bỏ) | Bảng theo Câu 2; bấm số ra danh sách; khung FT / Lớp thường; + phác Tổng hợp Test lớp thường 4 dải + Mini Test và Hiệu quả PA tách "theo quy chế" / "GV thêm" | PR-Pb2 (phần GV) |

Không cần mockup mới: PR-UXF-a/b (số, chữ, mã tuần), PR-UXD (dùng mẫu `TheDong` có sẵn; ảnh 375 px trước/sau), PR-S3, PR-Dọn, PR-DEPLOY.
