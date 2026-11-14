# v21 · Học viên & Lớp (mockup ⑥) — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/hoc-vien-lop.html` (+ `hoc-vien-lop.css` phần mới; `v21.css`, `bang-mau.css` chỉ đọc). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/11-de-bai-mockup-dot-2.md` mục ⑥ (R6.1–R6.8) + G1–G5; chỗ lệch + thao tác GIỮ: `10-ra-dong-bo.md` C1 (C5 cho lối Lưu trữ). Nền: web đang chạy (`origin/main` 5e2e5d2c9) + `v11/hoc-vien-lop.html` · `v16/lich-thi.html` · `v9/phan-cong-gv.html`.

Ảnh: `thiet-ke/v21/anh/hoc-vien-lop/`
- `truoc/<khung>-{toi|sang}.png` — web thật (seed, cổng riêng 5361, tài khoản demo: GV Trần Ngọc Hà · QL Nguyễn Khánh Vy · Quản trị · TVV Phan Mai).
- `sau/<khung>-{toi|sang}.png` — mockup.
- `cap/<khung>-{toi|sang}.png` — **ảnh cặp TRƯỚC (trái) │ SAU (phải)**, mỗi khung 1440 Tối + Sáng, 375 Sáng.
Chụp bằng chrome-headless-shell có sẵn (CDP, không cài gói); phông Be Vietnam Pro + Inter đã nạp (`document.fonts.check` = true) trước mỗi ảnh. Tên người trong mockup là tên bịa; ảnh TRƯỚC là dữ liệu demo giả của seed.

## 0. Lời chủ SP trong session này

(chưa có)

## 1. Khung

| Khung | Vai | Nội dung | Ảnh cặp (TRƯỚC lấy từ) |
|---|---|---|---|
| K1 | GV (GVCN MB FT 101) | Tất cả: đầu trang + Lưu trữ ›, tab chuẩn, hàng lọc chuẩn, lớp mở, em mở 5 môn, ⋯ em mở | `cap/k1` (web: GV, lớp mở) |
| K2 | Quản trị | Tất cả: ô Xem, lọc lớp đang bật, dòng Đang lọc + Bỏ lọc (nút), chip "Chờ duyệt 3", thẻ đếm "4 bài chờ chấm" | `cap/k2` (web: Quản trị) |
| K2b | GV · QL · TVV · Quản trị | Ô chọn có tìm mở: Mọi lớp (GV "Lớp của tôi" trước; QL đang gõ) · Mọi TVV ("Tôi" trước) · Xem · đã chọn | `cap/k2b` (web: ô `<select>` Quản trị) |
| K3 | GV | Đang SOS: hàng lọc cùng chỗ, cột "Việc cần làm" | `cap/k3` |
| K4 | TVV (có quyền sửa) | Lịch thi THÔNG TIN: đủ 7 trạng thái, bấm giá trị → hộp dưới hàng (Tháng dự kiến / Ngày thi), mở dưới hàng (Chọn bước tiếp · + Ghi chú · Lịch sử · 3), đã lưu + Hoàn tác, lỗi lưu + Thử lại, lọc trạng thái thi [XM-1]. **Bấm thử được** | `cap/k4` (web: TVV, hàng mở + "Đặt lịch ▾") |
| K5 | GV (chỉ xem) | Lịch thi: giá trị là chữ thường, ⌄ chỉ đọc | `cap/k5` |
| K6 | QL | Phân công GV: dòng đang sửa, ô GV mở ô chọn có tìm, thanh "Lưu cả 2 lớp…", tổng hợp + Xếp + Bỏ tô | `cap/k6` |
| K6c | QL | Hộp Lưu phân công: hiệu lực Ngay / Từ tuần (ô tuần W4 SEP + lịch), tạo việc bàn giao, dòng quy chế, Đóng · Lưu | `cap/k6c` (web: bảng PC) |
| K6b | Quản trị | Mở tab → vào chi nhánh gần nhất | `cap/k6b` (web: "Chọn chi nhánh để xem phân công") |
| K7 | GV · QL · CX | Rỗng (Tất cả, Lịch thi) · đang tải · lỗi tải · Phân công chỉ xem | `cap/k7` (web: tìm không thấy) |
| K8a | GV · 375 | Tất cả: lớp là thẻ gập, em là thẻ, chip cao 44 | `cap/k8a` |
| K8b | TVV · 375 | Lịch thi: mỗi em một thẻ (dòng lịch thi · dòng thông tin hiện tại), hộp sửa xếp dọc | `cap/k8b` |

## 2. Bảng truy vết khung → thành phần → TRƯỚC → SAU

| Khung | Thành phần (nguồn chuẩn) | TRƯỚC (web) | SAU (mockup) | GIỮ / ĐỔI / BỎ |
|---|---|---|---|---|
| mọi | Đầu trang | tên · Xem (`<select>`) · FT/LT · Xuất Excel · + Thêm học viên · ⋯ (+ Lớp mới · Lưu trữ) | như cũ + **"Lưu trữ ›"** link có số (R6.7, cả 375); ⋯ còn + Lớp mới | GIỮ + thêm link |
| mọi | Thanh tab (⑤ H1) | `HangTab v8 soMo`, số trong viên xám | `.tabs` chuẩn, badge **mờ** (chỉ đếm) · Lịch thi không mang số việc (lời 35) | ĐỔI dáng |
| mọi | Ô "Xem" (⑤ A, dáng gọn) | `<select>` "Xem HV của tôi ▾" | ô chọn có tìm cùng cỡ ô lọc, nhóm Chi nhánh · Khác, có số lớp / HV | ĐỔI dáng, GIỮ URL `phamVi`/`cn` |
| Tất cả · SOS · Lịch thi | Hàng lọc | Tất cả: Tìm + chip; SOS / Lịch thi: Tìm + `<select>` Mọi lớp (+ Mọi TVV ở Lịch thi) — mỗi tab một thứ tự | MỘT thứ tự, cùng chỗ: Tìm · **Mọi lớp** · **Mọi TVV** (ô chọn có tìm, "Lớp của tôi" / "Tôi" trước) · lọc riêng của tab · phải (R6.2) | ĐỔI |
| Tất cả | Chip lọc | `.nut-loc`, số 0 mờ | `.nut-chon` chuẩn, số 0 tắt (viền đứt) | ĐỔI dáng, GIỮ luật 0 không bấm |
| Tất cả | "Mở tất cả" / "Bỏ lọc" / "Xoá lọc thêm" | chữ link | **nút nhỏ** (R6.4) | ĐỔI dáng |
| Tất cả | Đầu lớp | mã · n HV · GVCN · SOS · chip "21 bài chờ chấm" / "8 chờ duyệt" · ⋯ | như cũ; việc CỦA NGƯỜI XEM = nút-chip chuẩn "Nhập điểm 21" / "Chờ duyệt 3" (chữ loại + số, lời 35); số không phải việc của người xem (QL: "4 bài chờ chấm") = thẻ đếm, không bấm | ĐỔI dáng |
| Tất cả | Bảng em | Học viên · Lộ trình · MT gần nhất · Hỗ trợ · Ý thức · Lịch thi · **Việc của tôi** (chữ việc + hạn + "+1 việc") · ⋯ | cùng cột; cột cuối **"Việc cần làm"**: nút-chip mỗi loại việc (Nhập điểm · Case · Ý thức · Vận hành), quá hạn ⚠ + đỏ, không việc = ô trống (R6.3) | ĐỔI cột cuối |
| Tất cả | 5 môn dưới hàng | dải `.hvl-dai`: MT · Hỗ trợ · Việc của tôi | GIỮ dải, khối cuối đổi tên "Việc cần làm · n"; khối Ý thức thêm (đang ở ô Ý thức) | GIỮ |
| Tất cả | ⋯ em | `MenuDong` ⋯ (N26) | menu thả chuẩn ⑤ H2 (+ Task · nhóm · mục đỏ) | ĐỔI dáng |
| SOS | Cột cuối | "Việc tiếp" | "Việc cần làm" nút-chip | ĐỔI tên + dáng |
| Lịch thi | Cột Việc tiếp + "Đặt lịch ▾" + nút chính | có | **BỎ** (lời 35) — thao tác dời vào giá trị lịch thi + phần mở dưới hàng | BỎ (thao tác giữ, xem mục 3) |
| Lịch thi | Công tắc "Cần làm n / Tất cả n" | có | **BỎ** → lọc trạng thái thi Tất cả · Chưa chốt ngày · Đã chốt · Chờ KQ · Có KQ [XM-1] | ĐỔI, chờ chủ SP |
| Lịch thi | Hàng em | Học viên · MT gần nhất · Target · Lịch thi · Việc tiếp · Ghi chú · ⌄ | Học viên · **Lịch thi** · nhóm **Hiện tại** (Target · MT gần nhất · SOS · Lộ trình · tuần) · Ghi chú · ⌄ (R6.5) | ĐỔI thứ tự + thêm SOS, lộ trình |
| Lịch thi | Hộp làm tại chỗ | một hàng dưới hàng (Chốt ngày / Dời tháng) | GIỮ một hàng dưới hàng; thêm đoạn **Tháng dự kiến / Ngày thi** để một lần bấm giá trị làm được cả 4 việc lịch | GIỮ + đoạn |
| Lịch thi | Lịch sử | "Lịch sử lịch thi" 3 dòng + "Xem toàn bộ" tự viết | `details.ls` "Lịch sử · n" chuẩn ⑤ H4 | ĐỔI dáng |
| Lịch thi | Đã lưu / lỗi | "✓ Đã lưu Hoàn tác" (link) · lỗi + "Thử lại" (link) | giá trị mới + "✓ Đã lưu · Hoàn tác" (nút) · "⚠ Không lưu được · Thử lại" (nút), chữ đã gõ giữ | ĐỔI dáng |
| Lịch thi | Chỉ xem | cột Việc tiếp ghi "Chỉ xem" mỗi hàng | giá trị là chữ thường, không ô bấm; bỏ chữ "Chỉ xem" lặp | ĐỔI |
| Phân công | Ô GV | `NoiNeo` + `ChonNguoi` | ô chọn có tìm chuẩn (nhóm "Đang dạy lớp này" → "GV khác · chi nhánh", có số) + "Bỏ trống (Chưa có)" | ĐỔI dáng (đã là ô có tìm) |
| Phân công | Xếp | `<select>` "Xếp: Tổng" | ô chọn thường dáng v21 (danh sách ngắn cố định — ⑤ A6 giữ) | ĐỔI dáng |
| Phân công | Ô tuần hiệu lực | `OTuan` | ô gõ "W4 SEP" + nút lịch (`.o-ngay`) | ĐỔI dáng |
| Phân công | Hộp Lưu | tiêu đề · hiệu lực · đổi người · tạo việc bàn giao · câu hệ quả · nút | cùng nội dung; câu hệ quả thành **dòng quy chế** một dòng; chân "Đóng · Lưu" | GIỮ nội dung |
| Phân công (Quản trị) | Chưa chọn chi nhánh | "Chọn chi nhánh để xem phân công" | vào thẳng chi nhánh gần nhất (`nhoChiNhanh`), đổi ở ô Xem (R6.6) | ĐỔI |
| mọi | Rỗng | câu đầu + câu dài hướng dẫn + nút | một dòng ngắn + nút đi tiếp (R6.4) | ĐỔI chữ |
| mọi | Lỗi tải | `ErrorState` | "⚠ Không tải được … · Thử lại" (⑤ B3) | ĐỔI chữ |
| 375 | Tất cả | thẻ lớp + thẻ em (đã có) | GIỮ, chip việc cao 44 | GIỮ |
| 375 | Lịch thi | thẻ: tên · Đặt lịch ▾ · MT · Target · lịch thi | thẻ: tên + ⌄ · dòng lịch thi (bấm để sửa) · dòng Target · MT · SOS · lộ trình (R6.8) | ĐỔI |

## 3. Bảng thao tác TRƯỚC → SAU (không mất thao tác nào)

| # | Thao tác (TRƯỚC) | Ai | SAU — nằm ở đâu | Ghi chú |
|---|---|---|---|---|
| 1 | Xuất Excel | mọi vai | đầu trang (giữ); 375 trong ⋯ | |
| 2 | + Thêm học viên | vai có quyền | đầu trang (giữ); 375 trong ⋯ | |
| 3 | + Lớp mới | QL / Quản trị | ⋯ đầu trang (giữ) · rỗng Phân công | |
| 4 | Lưu trữ | QL / Quản trị / GV (trong ⋯) | **link "Lưu trữ ›"** đầu trang, mọi vai [XM-2]; 375 cũng thấy (cạnh ⋯) | R6.7 |
| 5 | Xem (chi nhánh / phạm vi) | nhiều phạm vi | ô Xem (ô chọn có tìm) | |
| 6 | Fast Track / Lớp thường | mọi vai | đoạn đầu trang (giữ) | |
| 7 | Đổi tab Tất cả · Đang SOS · Lịch thi · Phân công GV | theo vai | thanh tab chuẩn (giữ) | |
| 8 | Tìm (mọi chi nhánh khi có quyền) | mọi vai | hàng lọc, cùng chỗ mọi tab | |
| 9 | Lọc lớp | SOS, Lịch thi | ô "Mọi lớp" — nay **có cả ở Tất cả** | R6.2 |
| 10 | Lọc TVV | Lịch thi | ô "Mọi TVV" — nay **có cả ở Tất cả** (và SOS) | R6.2 |
| 11 | Chip Thi tháng này · Có việc quá hạn · Đã thi · chờ KQ · chip theo vai | Tất cả | giữ (dáng `.nut-chon`) | |
| 12 | Bộ lọc thêm (Case/PA · Kỹ năng · Kết quả · Thời gian · Xếp em) · Xoá lọc thêm | Tất cả | giữ; "Xoá lọc thêm" là nút | |
| 13 | Bỏ lọc lớp (chip ✕) · Bỏ lọc | Tất cả | ✕ trong ô Mọi lớp · nút "Bỏ lọc" ở dòng Đang lọc | |
| 14 | Mở tất cả ↔ Thu gọn tất cả | Tất cả | nút nhỏ phải hàng lọc | |
| 15 | Mở / gập lớp · tìm tên tự mở | Tất cả | giữ | |
| 16 | Mã lớp → hồ sơ lớp | mọi vai | giữ (link) | |
| 17 | Chip SOS đầu lớp → tab SOS lọc lớp + mức | Tất cả | giữ | |
| 18 | Chip "n bài chờ chấm" / "n chờ duyệt" đầu lớp | GV / QL | nút-chip "Nhập điểm n" / "Chờ duyệt n" → panel việc đúng loại tại trang | dáng ⑤ C |
| 19 | ⋯ lớp | theo quyền | giữ | |
| 20 | Tên em → hồ sơ HV | mọi vai | giữ (link) | |
| 21 | Ô MT gần nhất → 5 môn dưới hàng · ô điểm → số câu / điểm thành phần | Tất cả | giữ (`.o-mt`, `.okn` bấm được) | |
| 22 | Ô Ý thức → hộp nhỏ (Hồ sơ › · Xác nhận xử lý) | GVCN | giữ (bấm "REPORT 1") | không vẽ lại hộp |
| 23 | Ô "Việc của tôi" → panel việc · "+n việc" → mở dải | GV | nút-chip mỗi loại → panel việc loại đó ("Việc tiếp ›" đi hết loại) · dải mở có danh sách "Việc cần làm · n" | R6.3 |
| 24 | ⋯ em (+ Task · Nhập điểm · Xác nhận xử lý · Sửa thông tin · Đề xuất chuyển lớp · Tạm dừng / Kết thúc học …) | theo quyền | giữ đủ mục, menu thả chuẩn | |
| 25 | Cột Phụ huynh (TVV / CX ở Tất cả) | TVV, CX | giữ (thay cột Việc cần làm như nay; không vẽ lại) | |
| 26 | Phân trang | mọi tab | giữ cuối bảng | |
| 27 | Rỗng: Xem cả chi nhánh · Tìm ở Mọi chi nhánh · Tìm ở FT / LT · Bỏ tìm · Bỏ lọc | mọi vai | giữ, chữ đầu rút còn một dòng | |
| 28 | SOS: chip Tất cả · SOS 3/2/1 · PA quá hạn | SOS | giữ | |
| 29 | SOS: "n Case · m PA" → panel một em đúng Case | SOS | giữ | |
| 30 | Lịch thi: Tháng thi từ → đến | Lịch thi | giữ (ô gõ + lịch) | |
| 31 | Lịch thi: Cần làm / Tất cả | Lịch thi | lọc trạng thái thi | [XM-1] |
| 32 | Đặt tháng dự kiến | TVV, QL | bấm "Chưa có lịch" → hộp, đoạn "Tháng dự kiến" | |
| 33 | Chốt ngày thi (nút chính khi tới tháng / mục menu) | TVV, QL | bấm "Chưa chốt ngày" / "Dự kiến …" → hộp, đoạn "Ngày thi" (tới tháng thì mở sẵn "Ngày thi") | việc tới hạn vẫn ở Công việc TVV |
| 34 | Dời tháng | TVV, QL | bấm "Dự kiến …" → hộp, đoạn "Tháng dự kiến" | |
| 35 | Sửa ngày | TVV, QL | bấm "Thi 26/09" → hộp, đoạn "Ngày thi" | |
| 36 | Ghi kết quả (nút chính) | TVV, QL | bấm "Đã thi … · chờ KQ" → panel Sau thi có sẵn (bước KQ) | panel không đổi |
| 37 | Bước tiếp (nút chính) | TVV, QL | nút "Chọn bước tiếp" ở phần mở dưới hàng · bấm giá trị "chờ bước tiếp" cũng mở panel bước 2 | |
| 38 | Sửa KQ | TVV, QL | bấm giá trị KQ ("✓ 7.0 …", "Xong · …") → panel Sau thi | |
| 39 | Ghi chú: bấm để sửa · "+ Ghi chú" khi rê | TVV, QL | bấm ô Ghi chú để sửa (giữ) · "+ Ghi chú" ở phần mở dưới hàng (hiện luôn, không cần rê) | |
| 40 | Hoàn tác (10 giây) sau lưu lịch | TVV, QL | nút "Hoàn tác" cạnh "✓ Đã lưu" ngay ô lịch thi | |
| 41 | Thử lại khi lỗi lưu (chữ giữ) | TVV, QL | nút "Thử lại" ngay ô lịch thi | |
| 42 | ⌄ mở chi tiết (MT gần nhất · Hỗ trợ đang mở · Test sắp tới · Phụ trách · Lịch sử lịch thi) | mọi vai | giữ; Lịch sử thành "Lịch sử · n" chuẩn (mở = xem toàn bộ, thay "Xem toàn bộ") | |
| 43 | Hỗ trợ đang mở: kỹ năng → panel Case | mọi vai | giữ (link kỹ năng) | |
| 44 | Phân công: Tìm lớp, GV · Thiếu GV | QL, QT | giữ (hàng lọc) | |
| 45 | Phân công: bấm ô → chọn GV · Bỏ trống | QL, QT | ô chọn có tìm chuẩn + "Bỏ trống (Chưa có)" | |
| 46 | Lưu (cuối dòng) · Huỷ sửa · Lưu cả n lớp… · Huỷ hết | QL, QT | giữ | |
| 47 | Hiệu lực Ngay hôm nay / Từ tuần · tạo việc bàn giao (tick) | QL, QT | hộp Lưu (giữ) | N29 |
| 48 | Hoàn tác sau lưu phân công · Chờ đổi (đổi mốc / huỷ lịch đổi, Hoàn tác) | QL, QT | giữ (toast · nút "Chờ đổi" cuối dòng — không vẽ lại) | |
| 49 | Bấm tên GV ở tổng hợp → tô ô · Bỏ tô · Xếp | QL, QT, CX | giữ | |
| 50 | ⓘ Cách dùng (Phân công) | mọi vai | giữ ⓘ | |
| 51 | Chọn chi nhánh (Quản trị) | QT | ô Xem; mặc định chi nhánh gần nhất | R6.6 |
| 52 | 375: nút "Lọc" mở chip / ô lọc · ⋯ có Xuất / Thêm | 375 | giữ | |

**Mất thao tác: không.** Bỏ ba thứ trên màn Lịch thi (cột Việc tiếp, menu "Đặt lịch ▾", nút chính) — thao tác của chúng chuyển sang dòng 32–38 (lời 35).

## 4. [XM] — cần chủ SP / PTA quyết

- **[XM-1] Lọc Lịch thi theo trạng thái thi** thay "Cần làm / Tất cả": Tất cả · Chưa chốt ngày · Đã chốt · Chờ KQ · Có KQ (Có KQ = chờ bước tiếp + xong). Đề bài nêu, chủ SP quyết. Đề xuất: theo — tab là thông tin nên lọc theo tình trạng thi; "việc cần làm" đã ở Công việc TVV. Số trên đoạn dùng dữ liệu đã nạp (không thêm request).
- **[XM-2] "Lưu trữ ›" mọi vai xem được:** nay TVV / CX không có lối Lưu trữ (`StudentsPage.tsx` menu ⋯: `laVai ? []`). Nếu máy chủ chặn `/hoc-vien/luu-tru` với TVV / CX thì đây là đổi quyền → chủ SP quyết; nếu chỉ giao diện ẩn thì làm theo R6.7. Phiên code kiểm quyền máy chủ trước.
- **[XM-4] Bỏ "⚠ quá hạn" trên tab Lịch thi:** web nay ghi đỏ "⚠ quá hạn 12/09" ở hàng chờ bước tiếp. Tab là thông tin (lời 35) nên mockup ghi trung tính "hạn chọn 12/09"; cảnh báo quá hạn nằm ở việc "Sau thi" bên Công việc TVV (badge đỏ). Đề xuất: theo mockup; chủ SP muốn giữ đỏ thì đổi lại một dòng.
- **[XM-3] "Lớp" ở hàng Lịch thi:** R6.5 ghi hàng gồm "em · lớp · …"; mockup giữ lớp ở **dải nhóm lớp** (xếp theo lớp, chủ SP duyệt v16 bản 3) thay vì thêm cột lớp lặp ở mọi hàng. Đổi sang cột nếu chủ SP muốn.

## 5. Tự rà từng dòng R6.x

| R | Yêu cầu | Đạt? | Ở đâu |
|---|---|---|---|
| R6.1 | Giữ 4 tab về thanh tab chuẩn; lớp gập, tìm tên tự mở; 5 môn mở dưới hàng; em nghỉ không hiện | Đạt | K1, K2, K6 (tab `.tabs` + badge mờ); K1 lớp mở / gập, em mở 5 môn; em nghỉ không có trong dữ liệu vẽ |
| R6.2 | "Mọi lớp", "Mọi TVV" là ô chọn có tìm, "Lớp của tôi" / "Tôi" trước, có ở cả Tất cả; ô Xem cùng dáng; hàng lọc cùng vị trí mọi tab | Đạt | K1–K5 (cùng thứ tự Tìm · lớp · TVV), K2b (nhóm liên quan trước), K2 / K4 / K6b ô Xem; Phân công: Tìm cùng chỗ, không lọc lớp / TVV (bảng theo lớp + GV) |
| R6.3 | Một tên cột "Việc cần làm", nút-chip chuẩn, chỉ việc người xem, bấm = panel việc tại trang | Đạt | K1 (cột + đầu lớp + dải), K3 |
| R6.4 | Mở tất cả, Bỏ lọc, Xoá lọc thêm, Hoàn tác, Thử lại là nút chuẩn; rỗng một dòng | Đạt | K1 / K2 (Mở tất cả, Bỏ lọc), K4 (Hoàn tác, Thử lại), K7 (rỗng); "Xoá lọc thêm" nằm trong Bộ lọc thêm — ghi ở bảng mục 2 (không vẽ ngăn mở) |
| R6.5 | Lịch thi = THÔNG TIN: không badge việc, không cột việc, không nút-chip, không "Đặt lịch ▾"; hàng em · lớp · lịch thi · thông tin hiện tại; thao tác giữ đủ (bấm giá trị / mở dưới hàng, Hoàn tác); lọc trạng thái [XM] | Đạt (lớp ở dải nhóm — [XM-3]) | K4 (TVV), K5 (GV chỉ xem), K8b; bảng thao tác 30–43; [XM-1] |
| R6.6 | Phân công: một bảng cả chi nhánh, sửa theo dòng, Ngay / Từ tuần, hỏi bàn giao; Xếp, ô tuần chuẩn; Quản trị vào chi nhánh gần nhất | Đạt | K6, K6c, K6b |
| R6.7 | Xuất Excel · + Thêm học viên · ⋯ giữ; link "Lưu trữ ›" thấy được, mọi vai | Đạt (quyền TVV / CX — [XM-2]) | mọi khung 1440 |
| R6.8 | 375: lớp thẻ gập; Lịch thi mỗi em một thẻ hai dòng | Đạt | K8a, K8b |
| G2 | thanh tab + badge · chip chữ + số · ô chọn có tìm · chân hộp Đóng + nút chính · dòng quy chế · menu chuẩn · Lịch sử · n · câu lỗi chuẩn · tên bậc HOA (REPORT 1) · mã tuần | Đạt | K1 (REPORT 1, W2 SEP), K4 (Lịch sử · 3), K6c (dòng quy chế, Đóng · Lưu), K7 (câu lỗi) |
| G3 | Không chú thích tĩnh, không bước xác nhận thêm, không tab / màn mới | Đạt | chỉ có ⓘ sẵn có; hộp Lưu phân công là hộp cũ |

## 6. Dòng đọc Turso (CLAUDE.md)

Không thêm request khi mở trang. Ô Mọi lớp lấy từ `rows` đã nạp; số "Lưu trữ" = `demLuuTru` đã có; số đoạn trạng thái Lịch thi đếm từ danh sách đã nạp. Cần phiên code kiểm, nếu thiếu thì thêm cột vào câu đang có (không thêm câu): `tvvId` của em trong `/hoc-vien-lop` (để lọc TVV ở Tất cả / SOS), mức SOS + lộ trình / tuần học trong `/hoc-vien-lop/lich-thi`. Ô chọn mở danh sách không gọi máy chủ (dữ liệu tại chỗ).

## 7. Critique (impeccable `critique`, hai đánh giá tách riêng)

- Đánh giá A (thiết kế): 28 / 40. Đánh giá B (detector): 156 dòng, không dòng nào chặn — gần hết từ ô ghi chú vàng của tờ mockup và token v21 dùng chung (đã duyệt); 6 dòng "side-tab" là vạch trái 3 px của hàng / dải đang mở, đúng mẫu đã duyệt ở ①–⑤.
- **P1 đã sửa:** (1) ô "Việc cần làm" của Bùi Khánh Vy trống trong hàng nhưng dải mở có 1 việc → hàng có chip "Case 1" (K1, K8a), cùng nguồn với K3 · (2) giá trị lịch thi sửa được chỉ lộ khi rê (375 không có rê) → lúc nghỉ đã có viền nhạt + gạch chấm; chỉ xem (K5) là chữ thường · (3) "⚠ quá hạn" đỏ trên tab thông tin → trung tính "hạn chọn 12/09" [XM-4].
- **P2 đã sửa:** "Lưu trữ ›" thấy ở 375 · ô MT cao 44 ở 375 · tab 375 khít hơn · thẻ đếm "bài chờ chấm" của QL không viền (không trông như nút) · ô chọn GV ở K6 không đè nút hàng khác · số "ô đổi" khớp ô có "trước:" · ghi chú K6b ra ngoài khung.
- Để lại (P3): phần mở dưới hàng K4 cao vì Lịch sử đang mở (cố ý vẽ mở để thấy dáng chuẩn); "Lưu cả 2 lớp…" giữ dấu "…" vì nút mở hộp (chữ web hiện tại).
