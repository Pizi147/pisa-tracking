# v21 · Quản trị + Lưu trữ (mockup ⑩) — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/quan-tri.html` (K1–K11) · `thiet-ke/v21/luu-tru.html` (L1–L6) · CSS mới `quan-tri.css`, `luu-tru.css` (trên `v21.css` + `bang-mau.css`, chỉ đọc).
Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/11-de-bai-mockup-dot-2.md` mục ⑩ (R10.1–R10.5) + G1–G5; chỗ lệch + thao tác giữ: `10-ra-dong-bo.md` C5, C6.
Ảnh: `anh/quan-tri/<khung>-{toi|sang}.png`, `anh/luu-tru/<khung>-{toi|sang}.png` (375: theo chế độ của khung) · **ảnh cặp TRƯỚC │ SAU**: `anh/quan-tri/cap-<khung>-<chế độ>.png`, `anh/luu-tru/cap-<khung>-<chế độ>.png`.
TRƯỚC = web thật (`origin/main` 5e2e5d2c9, `npm run seed`, dev cổng 4610/5610, vai Quản trị userId 1 · QL userId 2), phông Be Vietnam Pro đã nạp (`document.fonts.check` = true). Để có dữ liệu "Đã xoá" đã xoá thử 2 Case + 1 học viên trong DB seed cục bộ.
Nguyên tắc: **nâng cấp, không dựng lại** — giữ vị trí cũ, 8 tab, "danh sách → sửa tại dòng → nhật ký" (chủ SP 12/11); chỉ đồng bộ thành phần theo bộ chuẩn ⑤.

## 0. Lời chủ SP trong session này

(chưa có)

## 1. Bảng truy vết khung → thành phần → TRƯỚC → SAU

| Khung | Thành phần | TRƯỚC (web) | SAU (mockup) | Loại | Nguồn |
|---|---|---|---|---|---|
| K1–K10 | Hàng 8 tab Quản trị | `HangTab` 8 tab | giữ 8 tab, dáng tab chuẩn ⑤ H1 | GIỮ | chủ SP 12/11; R10.1 |
| K1 | Lọc Chi nhánh / Vai trò / Nhóm theo | `ChonDangNut` (dáng nút) | ô chọn thường ⑤ A6 (danh sách ngắn cố định) | ĐỔI dáng | R10.1; ⑤ A6 |
| K1 | Ô Vai trò khi duyệt đăng ký | `select.field w-36` | ô chọn thường A6 | ĐỔI dáng | R10.1 |
| K1 | Hộp sửa vai tại chip (SuaTaiDong) | `select.field w-44` + chip chi nhánh + Gỡ | ô chọn thường A6 + chip + Gỡ; Huỷ thay đổi · Lưu | ĐỔI dáng ô | R10.1 |
| K1 | Badge "Đăng ký chờ duyệt" | chip vuông chữ vàng | badge viên tròn mờ (chỉ đếm, không hạn) | ĐỔI | G2 badge |
| K1 | Đang dùng / Đã xoá · + Tạo tài khoản · Sửa · ⋯ · chip kỹ năng | có | giữ | GIỮ | C6 Giữ |
| K2 | Sửa chương trình | panel 720 px (Tên, Môn, Đạt từ, Độ dài, Mốc Test, Còn dùng) | sửa tại ô như Chi nhánh; ô nhiều số (Mốc, Môn) mở hộp neo dưới ô | ĐỔI | R10.2 |
| K2 | Cột bảng | Chương trình · Cách chấm · Độ dài · Mốc Test · Lớp đang chạy · Sửa | + **Môn**, + **Đạt từ**, Cách chấm → chữ mờ dưới tên, nút Sửa → bấm thẳng ô, + cột **Còn dùng** (công tắc) | ĐỔI | R10.2; [XM-4] |
| K2 | "Còn dùng" | ô tick trong panel | công tắc một dáng | ĐỔI | R10.2 công tắc thống nhất |
| K2 | + Chương trình | panel | panel (giữ) | GIỮ | [XM-3] |
| K2–K6 | Nhật ký cột phải (`NhatKyMuc`) | thẻ: dòng việc 12 px đậm · trường · người · giờ; "Xem tất cả ›" chỉ Quản trị | một dáng ⑤ H4 (người đậm · việc · cũ gạch → mới · giờ), đầu "Nhật ký n", "Xem tất cả ›" cả QL | ĐỔI | R10.2 |
| K3 | Chi nhánh sửa tại ô + Hoàn tác, Đơn vị báo cáo | có | giữ | GIỮ | |
| K4 | Kỳ vọng / Ngưỡng / bảng quy đổi / Lịch sử phiên bản | có | giữ (Lịch sử phiên bản ≠ nhật ký sửa) | GIỮ | |
| K5 | Câu chỉ-xem QL | "Quản trị hệ thống sửa; Quản lý xem." dưới tiêu đề trang **và** lặp trong thẻ Hạn | một dải "Chỉ xem · Quản trị hệ thống sửa" dưới hàng tab, mọi tab cấu hình | GỘP | R10.1 |
| K5, K8 | Tab của QL | 6 tab | 6 tab + **Nhật ký** (đích "Xem tất cả ›") | THÊM (tab đang có của Quản trị, QL xem phần nhật ký) | R10.2; [XM-1] |
| K6 | Case & SOS: "Ẩn", "+ Thêm nhóm" | chữ dáng link | nút nhỏ | ĐỔI | G2 "nút là nút" |
| K6 | Tên nhóm | chữ + ✎ | ô có viền (bấm là sửa) như Chi nhánh | ĐỔI dáng | đồng bộ ô sửa tại chỗ |
| K7 | Mở sửa lịch Test | chip "Đang mở/tắt" + nút Bật / Tắt | công tắc như Quyền + toast Hoàn tác | ĐỔI | R10.2 |
| K7 | Quyền theo vai | cột vai │ công tắc, chân Huỷ / Lưu n, hộp xác nhận, So sánh | giữ | GIỮ | C6 Giữ |
| K7 | Nhật ký chung · lọc Người | `ChonDangNut` (select) | **ô chọn có tìm** mẫu A, nhóm "Có trong nhật ký đang xem" | ĐỔI | R10.1; ⑤ bảng kê #52 |
| K7 | Nhật ký chung · lọc Mục | `ChonDangNut` | ô chọn thường A6 (8 mục cố định = tên tab) | ĐỔI dáng | [XM-2] |
| K7 | Từ / Đến | `ONgay` tuần | giữ | GIỮ | CLAUDE.md ô ngày |
| K7 | Dòng nhật ký chung | lưới 4 cột tự viết | dáng ⑤ H4 + nhãn mục | ĐỔI | R10.2 |
| K9 | Đã xoá (Quản trị) | câu tĩnh "Giữ 30 ngày…" + bảng `Bang` | bảng chuẩn chung với Lưu trữ, đầu bảng "Đã xoá · n" + ⓘ (câu 30 ngày) | ĐỔI | R10.3, R10.4 |
| K10 | Rỗng · tải · lỗi · lưu lỗi · xung đột · chưa lưu · công tắc lỗi | có (nhiều câu khác nhau) | câu chuẩn G2 "⚠ Không tải được … · Thử lại" | ĐỔI chữ | G2 |
| K11 | 375 Tài khoản | thẻ mỗi tài khoản, Lọc | giữ, ô chọn cao 44, hộp sửa vai toàn màn | GIỮ | R10.5 |
| L1–L6 | Lọc chi nhánh | `BranchFilter` ("Chi nhánh Tất cả" select) cạnh ô tìm | ô **Xem** cạnh tiêu đề như Học viên & Lớp (nhóm Chi nhánh + Mọi chi nhánh); chỉ hiện khi > 1 chi nhánh | ĐỔI | R10.3 |
| L1–L6 | Tab | 2 tab có số (`HangTab`) | **3 tab** có số, badge mờ: + **Đã xoá** | ĐỔI | R10.3 |
| L1 | Bảng lớp, dải Fast Track / Lớp thường, Tổng kết, Mở lại | có | giữ (bảng chuẩn `.bang`) | GIỮ | |
| L2 | Học viên đã lưu trữ | thẻ mỗi em | **bảng** cùng dáng lớp: Học viên · Trạng thái · Lớp cuối · Lộ trình · Chi nhánh · Từ ngày · nút | ĐỔI | R10.3 |
| L2 | Trạng thái em | `Nhan` tone doing / soon | chữ + chấm, cùng màu | GIỮ ý | |
| L3 | Chọn nhiều + kết quả từng em (U02) | thẻ + thanh dính | bảng có cột tick + thanh dính (giữ dòng kết quả, Xử lý tiếp, Thử lại) | GIỮ | C5 Giữ |
| L4 | Đã xoá học viên | khối dưới danh sách HV, câu tĩnh, ẩn khi rỗng | tab thứ ba, ⓘ, hiện cả khi 0 | ĐỔI | R10.3 |
| L6 | 375 | thẻ | thẻ (một dòng bảng = một thẻ), nút cao 44 | GIỮ | R10.5 |
| — | Lối vào "Lưu trữ ›" ở đầu Học viên & Lớp | trong ⋯ | thuộc mockup ⑥ (không vẽ ở đây) | — | C5 Nâng cấp; [XM-10] |

## 2. Bảng thao tác TRƯỚC → SAU (không mất thao tác)

| Màn | Thao tác | TRƯỚC | SAU | Ghi chú |
|---|---|---|---|---|
| Tài khoản | Duyệt · Không duyệt · Duyệt lại | có | giữ | |
| Tài khoản | + Tạo tài khoản | panel | giữ | |
| Tài khoản | Sửa (panel tài khoản) · ⋯ Sửa thông tin · ⋯ Xoá tài khoản · Khôi phục (Đã xoá) | có | giữ | ⋯ có 2 mục (không "⋯ một mục") |
| Tài khoản | Sửa vai · chi nhánh tại chip · sửa kỹ năng tại chip · Hoàn tác | có | giữ | chỉ đổi dáng ô vai |
| Tài khoản | Tìm · lọc Chi nhánh / Vai trò / Kỹ năng · Nhóm theo · Lọc (375) | có | giữ | |
| Chương trình | Sửa Tên / Môn (thứ tự, bỏ, thêm) / Đạt từ / Độ dài / Mốc Test | panel "Sửa" | bấm thẳng ô, hộp neo dưới ô | không mất trường nào; [XM-4] |
| Chương trình | Còn dùng / Ngừng dùng | ô tick trong panel | công tắc tại dòng + Hoàn tác | |
| Chương trình | + Chương trình | panel | panel | [XM-3] |
| Chương trình | Xác nhận khi đổi Môn mà có lớp đang học | hộp xác nhận | giữ | hậu quả lớn |
| Chi nhánh | Sửa Tên / Địa chỉ / SĐT tại ô · Hoàn tác · xung đột N04 | có | giữ | |
| Band | Sửa kỳ vọng · ngưỡng · Sửa bảng quy đổi · Lịch sử phiên bản | có | giữ | |
| Hạn mặc định | Sửa hạn tại dòng · Hoàn tác | có | giữ | QL chỉ xem |
| Case & SOS | Sửa tên · kéo thả · Ẩn · Hiện lại · + Thêm nhóm · Xoá / Khôi phục | có | giữ | "Ẩn", "+ Thêm nhóm" thành nút; Hiện lại (mục đã ẩn) không vẽ, không đổi |
| Quyền & nhật ký | Mở sửa lịch Test Bật / Tắt | nút | công tắc + toast Hoàn tác | Hoàn tác = bấm lại (máy chủ ghi cả hai lần như nay) |
| Quyền & nhật ký | Đổi quyền · Huỷ thay đổi · Lưu n thay đổi · xác nhận · Hoàn tác · So sánh mọi vai · Tìm quyền · "n tài khoản ›" | có | giữ | |
| Nhật ký | Lọc Mục / Người / Từ / Đến · Xoá lọc · Xem thêm | có | giữ (Người = ô chọn có tìm) | |
| Nhật ký | Xem tất cả › | chỉ Quản trị | Quản trị + QL | [XM-1] |
| Đã xoá | Khôi phục tại dòng | có | giữ | |
| Lưu trữ | Tìm · lọc chi nhánh | ô tìm + `BranchFilter` | ô tìm + ô Xem | |
| Lưu trữ | Tổng kết (lớp) · Mở lại (panel + Hoàn tác) | có | giữ | |
| Lưu trữ | Tổng kết (em) · Sửa thông tin · Quay lại học (một em) + Hoàn tác | có | giữ | |
| Lưu trữ | Chọn nhiều học viên · Quay lại học · n em · Xử lý tiếp · Thử lại · ✕ kết quả · Bỏ chọn | có | giữ | |
| Lưu trữ | Khôi phục học viên đã xoá | khối dưới tab HV | tab Đã xoá | |

**Mất thao tác: không.** Chỉ đổi đường tới: Chương trình bấm thẳng ô thay nút Sửa → panel.

## 3. [XM] — cần PTA Overhaul quyết / chuyển chủ SP

1. **[XM-1] Đích "Xem tất cả ›" của QL.** QL không có tab Quyền & nhật ký. Mockup thêm cho QL tab **Nhật ký** (= phần Nhật ký chung của tab Quyền & nhật ký; máy chủ đã chỉ trả 6 mục QL được xem — `server/src/platform/nhatKyQuanTri.ts:48`, không đổi API). QL thấy 7 tab thay 6. Phương án khác: "Xem tất cả" mở panel nhật ký tại chỗ (khi đó bỏ "›"). Đề xuất: tab (cùng đích, cùng thành phần với Quản trị; không panel lồng).
2. **[XM-2] Ranh giới ô chọn.** R10.1 "người / chi nhánh / vai dài → ô chọn có tìm". Đếm thật: vai 7, chi nhánh 5 (+ Toàn hệ thống), mục nhật ký 8 = tên tab, thứ / tuần ở Hạn, + Môn ≤ 5 → đều là danh sách ngắn cố định → **ô chọn thường A6** (một dáng, thay `ChonDangNut` / `select.field`). Chỉ lọc **Người** của Nhật ký là ô chọn có tìm. Nếu PTA muốn cả ô Vai trò có tìm thì đổi một chỗ.
3. **[XM-3] "+ Chương trình" giữ panel.** Tạo mới cần Mã + Tên + Môn + Độ dài + Mốc cùng lúc (bắt buộc, kiểm lỗi chéo) — làm tại dòng sẽ là một hàng nửa vời nhiều ô trống. Sửa thì tại ô.
4. **[XM-4] Chương trình thêm cột Môn, Đạt từ, Còn dùng** (trước chỉ trong panel) để sửa tại dòng được. Bảng chật hơn: tên dài và Mốc FT xuống dòng ở 1440. Ô khoá (Môn FT / Pre FOU, Độ dài FT, Đạt từ FT) = chữ mờ không viền theo quy ước có sẵn "ô có viền = bấm là sửa".
5. **[XM-5] Turso — badge tab "Đã xoá" ở Lưu trữ cần số lúc mở trang.** Nay `/thung-rac` chỉ nạp khi mở tab Học viên. Đề xuất: `/hoc-vien-lop/luu-tru` trả thêm `demDaXoa` (một `COUNT` theo chi nhánh, ước < 50 dòng / lần mở, 0 request thêm); danh sách `/thung-rac` chỉ nạp khi bấm tab Đã xoá. Các phần khác: 0 đường mới (cột Môn, Đạt từ có sẵn trong `/admin/programmes`; ô Người dùng `nguoi` mà `/admin/nhat-ky` đã trả; tab Nhật ký của QL = cùng đường).
6. **[XM-6] Ngày ở Lưu trữ.** "Kết thúc", "Từ ngày", "Lúc xoá" giữ dạng ngày (hồ sơ lịch sử, kéo dài nhiều năm) — CLAUDE.md cho ngày ở "nhật ký"; không đổi sang mã tuần.
7. **[XM-7] Nhật ký cột phải (320 px):** giờ đặt dưới dòng (cột hẹp); ở Nhật ký chung giờ là cột đầu như `LichSuThayDoi`. Không thêm "Khôi phục" trên dòng nhật ký hệ thống (việc mới — G3); hoàn tác vẫn qua toast 10 giây như nay.
8. **[XM-8] Case & SOS** có mockup riêng đã duyệt (PR #1370): chỉ đổi "Ẩn" / "+ Thêm nhóm" sang nút và tên thành ô có viền (đồng bộ G2); kéo thả, "Khác luôn cuối", đoạn FT / Lớp thường giữ.
9. **[XM-9] Badge "Đăng ký chờ duyệt"**: việc của Quản trị nhưng không có hạn → badge mờ (chỉ đếm) theo G2; nếu muốn tính là việc (vàng / đỏ) cần có hạn duyệt — luật mới, không tự thêm.
10. (Lời 36 — tên bậc vi phạm VIẾT HOA, thang là thanh vạch: mockup ⑩ không hiện tên bậc / thang ở khung nào — Case & SOS chỉ vẽ tab Nguyên nhân; khi code tab Mốc SOS / cấu hình thang thì theo G2 mới.)
11. **[XM-10] Lối vào "Lưu trữ ›"** thấy được ở đầu Học viên & Lớp (C5 nâng cấp) là việc của mockup ⑥ — không vẽ ở đây.

## 4. Bảng tự rà từng dòng R10.x

| Dòng đề bài | Kết quả | Khung |
|---|---|---|
| R10.1 giữ 8 tab | Đạt — Quản trị 8 tab; QL 6 + Nhật ký [XM-1] | K1–K10 |
| R10.1 "danh sách → sửa tại dòng → nhật ký" | Đạt — mọi tab cấu hình: bảng · ô có viền · cột Nhật ký | K1–K6 |
| R10.1 lưu có Hoàn tác | Đạt — toast Hoàn tác ở Chi nhánh, Chương trình, Mở sửa lịch Test, Quyền, Lưu trữ | K3, K7, L2 |
| R10.1 QL chỉ xem, một câu chỉ-xem chung | Đạt — một dải dưới hàng tab, bỏ câu lặp trong thẻ | K5, K8 |
| R10.1 ô chọn người / chi nhánh / vai dài → có tìm; ngắn giữ | Đạt — Người = mẫu A; vai, chi nhánh, mục là danh sách ngắn → A6 [XM-2] | K1, K7, K8 |
| R10.2 nhật ký một dáng mọi tab | Đạt — ⑤ H4 ở cột phải + Nhật ký chung | K2–K8 |
| R10.2 QL có "Xem tất cả ›" | Đạt — đích tab Nhật ký [XM-1] | K5, K8 |
| R10.2 Mở sửa lịch Test là công tắc như Quyền | Đạt | K7, K10 |
| R10.2 Chương trình sửa tại dòng như Chi nhánh | Đạt — sửa tại ô; + Chương trình giữ panel [XM-3] | K2 |
| R10.3 ba tab chuẩn có số, Đã xoá, câu 30 ngày vào ⓘ | Đạt | L1–L4 |
| R10.3 học viên dùng bảng cùng dáng lớp (tên link · trạng thái · ngày · nút) | Đạt | L2, L3 |
| R10.3 lọc chi nhánh dùng ô "Xem" | Đạt (ẩn khi một chi nhánh) | L1, L5 |
| R10.4 giữ Tổng kết · Mở lại · Quay lại học (một / n) · Xử lý tiếp · Sửa thông tin · Chọn nhiều · Khôi phục · Hoàn tác | Đạt | L1–L4 |
| R10.4 Đã xoá ở Quản trị cùng thành phần | Đạt — bảng `.bang` chung (luu-tru.css) | K9, L4 |
| R10.5 375 cho Lưu trữ; Quản trị 375 tab Tài khoản | Đạt | L6a–d, K11a–c |
| G4 1440 Tối + Sáng, 375, đủ trạng thái (rỗng, tải, lỗi, chỉ xem) | Đạt | K10, L5, K5 |
| G4 ảnh cặp TRƯỚC │ SAU mỗi khung | Đạt | `anh/*/cap-*.png` |
| G3 không chú thích tĩnh / bước xác nhận mới / tab mới ngoài đề bài | Đạt — trừ tab Nhật ký của QL [XM-1] | |

## 5. Critique (impeccable) — hai agent độc lập (A rà thiết kế · B máy dò + trình duyệt)

**Điểm A: 30 / 40** (Nielsen; thấp nhất "tối giản" 2 — bảng Chương trình chật). Không P0.

| Mức | Vấn đề | Đã sửa |
|---|---|---|
| P1 | K2 bảng Chương trình tràn: "đúng / tổ…", "Không" bị cắt | Bỏ cột Cách chấm → chữ mờ dưới tên ("Chương trình · cách chấm"); Còn dùng 112 px; công tắc ghi "Có / Không" |
| P1 | 375 chọn nhiều thiếu khung kết quả "Xong 1/3 · Xử lý tiếp · Thử lại"; ô tick nhỏ | Thêm L6e; ô tick 24, chạm cả thẻ; nút 44 |
| P2 | Hai thứ tự đọc dòng nhật ký (cột phải giờ dưới, Nhật ký chung giờ trước) | Cột phải: giờ trước (nhỏ, mờ) như Nhật ký chung |
| P2 | K5 cột ⓘ hiện "ⓘ …" | Ô không cắt chữ |
| P2 | Chip chi nhánh "đang chọn" chỉ khác viền | Thêm ✓ trước chữ |
| P2 (B) | L5 cột nút bị cắt (Tổng kết · Sửa thông tin · Quay lại học) | Bảng QL trải cả hàng |
| P2 (B) | 375: link tên 22 px, ⓘ 28, đoạn Đang dùng / Đã xoá 40, ✕ 36 | Đều ≥ 44 |
| P3 (B) | Ô sửa tại chỗ đệm 3 px | 5 × 9 px, cao 32 |
| P3 (A) | Chữ tĩnh "Quyền này tự có theo phân công GVCN…" | Vào ⓘ cạnh công tắc khoá |

Không sửa (lý do): vạch trái 3 px ở dải nhóm / quyền (dải nhóm v21 đã duyệt) · bóng hộp nổi (cùng `.hop` / `.menu-tha` v21) · Mốc FT xuống hai dòng ở 1440 (đủ chữ, không cắt) · "Đăng ký chờ duyệt 0" một dòng (web đang có, AUDIT-UI QT2) · tiêu đề bảng lặp tên tab (giữ chỗ cho nút Chọn nhiều / ⓘ).
**B dương tính giả:** mọi lỗi tương phản là huy hiệu số `.so-mk` của chú thích; màu / phông / dòng dài ở khung chú thích `.ghi`, `.dau-mk`; thứ tự tiêu đề qua ranh khung. Chữ < 12 px: 0 · tương phản < 4,5 : 1 trong khung: 0 (cả sáng / tối) · tràn khung: 0.
