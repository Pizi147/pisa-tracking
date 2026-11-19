# TU2-6 TRANG-TUTOR — khớp / khác mockup Ⓣ2

Mockup `thiet-ke/v21/tutor.html` (+ `tutor-ghi-chu.md`, [XM] mục 4 đã được PTA Tutor chấp nhận). Ảnh cặp `cap-<khung>.png` = mockup │ web (seed 14/09/2026, khoảng mặc định W4 AUG → W3 SEP; tên người là dữ liệu seed). `document.fonts.check('600 14px "Be Vietnam Pro"')` = true ở mọi ảnh web.

## 1. Truy vết khung → thành phần → ảnh

| Khung | Thành phần web | Ảnh | GIỮ / ĐỔI / BỎ / MỚI |
|---|---|---|---|
| T1 menu + đầu trang một hàng | `dieuHuong.ts` (mục `tutor` sau Phân tích), `App.tsx` route `/tutor` (`nav.tutor`), `TutorPage` hàng đầu: `BoChonThoiGian` (mặc định 4 tuần gồm tuần này, không Toàn bộ) · ô tìm · `NutLoc` · Xuất số buổi · Tải danh sách · Thêm tutor | cap-t1 | ĐỔI (mở lại) |
| T1 chip | `BoLocDoan v8 giuSo` Cần chú ý · Đang dạy · Ngừng · Tất cả + `NutLuat` ⓘ; mặc định tự lùi | cap-t1, cap-e1 | ĐỔI (bỏ "Thiếu thông tin") |
| T1 dải gộp | dải `data-hd=tutor-gop` + "Gộp…" (người sửa danh bạ) | cap-t1, cap-t4 | GIỮ, mở cho Head |
| T2 bảng 9 cột | `ui/Bang` (`hangRieng` cho ô gộp "chưa có buổi trong khoảng"), nhóm đầu cột "Có / có trả lời", nhãn `NhanLoai` GV / Tutor, dòng phụ `bang-phu` (thiếu SĐT / mốc nhận xét) | cap-t2 | ĐỔI (bỏ `<table>` tự viết, gỡ miễn BANG-2/3) |
| T3 Lọc ▾ | `HopNeo`: Nơi dạy (`select`) · Kỹ năng (`NutChon` nhiều) · Loại (`BoLocDoan`) · Bỏ lọc; URL `noi`/`kn`/`loai` | cap-t3 | ĐỔI + MỚI Loại |
| T4 Head | `coDanhBa` → Thêm / Tải / Gộp; nhận xét chỉ đọc | cap-t4 | ĐỔI (TU13) |
| T5 CX | chỉ "Xuất số buổi", không dải gộp, panel chỉ đọc | cap-t5 | MỚI (TU12) |
| P1 panel | `PanelTutor` trong `KhungPanel rong="nguoi-day"` (880): đầu (tên + nhãn · SĐT · nơi dạy · KN · khoảng của trang · Sửa) → dải 5 số (lọc) → Nhận xét (Kết luận * + Nhận xét * ≥ 8) + dòng thời gian Sửa · Xoá → Kết quả đã ghi (`Bang`) + chip lọc ✕ + "Chỉ dòng có Không" | cap-p1 | ĐỔI |
| P2 sau lưu | ở lại, chân trái "✓ Đã lưu nhận xét · giờ", nút chính "Người cần chú ý tiếp ›" | (bấm thử f-sau-luu) | ĐỔI (V12) |
| P3 GV | "Hồ sơ GV ›" (`/giao-vien/:id`), không Sửa; Head / CX: "Chỉ Head tutor và Quản trị viết nhận xét." | cap-p3 | MỚI |
| H1 Xuất số buổi | `HopXuat`: Từ tháng · Đến tháng (mặc định tháng này) → `GET /tutors/xuat-buoi` → xlsx ở web; Đang xuất… · lỗi giữ khoảng | cap-h1 | MỚI (TU14) |
| H2 Thêm / Sửa | `HopTutor`: 4 ô; Head: đoạn [chi nhánh · Chỉ online]; lỗi "SĐT đã có" tại ô; nhắc trùng tên; Xoá tutor khi chưa có buổi | cap-h2 | GIỮ + ĐỔI cho Head |
| H3 Gộp | `HopGop`: `ChonNguoi` tìm máy chủ `/tutors/chon?gop=1` — nhóm Tên gần giống · Giáo viên · Tutor; "+ Thêm «…» vào danh sách"; Hoàn tác | cap-h3 | GIỮ + gợi ý GV |
| H4 Tải danh sách | `TaiDanhSach` (panel 720) — câu "Cột: …" vào ⓘ; bảng xem trước dùng `Bang` | cap-h4 | GIỮ, BỎ chú thích tĩnh |
| E1 danh bạ trống | thanh đầu bảng "Chưa có tutor trong danh sách" + Tải danh sách · Thêm tutor; GV có buổi vẫn hiện | cap-e1 | ĐỔI (R2.10) |
| E2 rỗng / lọc không khớp / tải / lỗi | `Empty` + Bỏ lọc · `Skeleton` · `ErrorState` + Thử lại | (bấm thử f-loi) | GIỮ |
| E3 40 người | `PhanTrang` trên + dưới | (bấm thử f-40) | GIỮ |
| M1–M4 375 | thẻ `theRieng` (tên + nhãn + ★ · KN · nơi dạy · lý do · 4 ô số), hàng đầu: Tutor · 🔍 · Thêm tutor · ⋯ (Tải, Xuất); khoảng + Lọc; chip chia theo chữ | cap-m1, cap-m2, cap-m3, cap-m4 | ĐỔI |
| BỎ | khối "Việc của bạn", tab, chip "Thiếu thông tin", cột "Cần chú ý vì", SĐT dòng hai, bộ chọn thời gian thứ hai trong panel, cột Hình thức, số "Tutor n" trên menu | — | BỎ (R2.4, R2.6, TU17) |

## 2. Thao tác TRƯỚC (mã `TutorPage` đang ẩn) → SAU

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Đổi khoảng thời gian | `BoChonThoiGian` 2 tuần vừa qua | cùng component, mặc định 4 tuần gồm tuần này (URL trống) |
| Lọc chip | 5 chip | 4 chip (Thiếu thông tin → chữ dưới tên) |
| Lọc Nơi dạy / Kỹ năng | 2 `select` (Nơi dạy chỉ người sửa) | Lọc ▾ (mọi vai; Kỹ năng chọn nhiều) |
| Lọc Loại GV / Tutor | — | MỚI |
| Tìm tên / SĐT | ô tìm | GIỮ (375: sau nút 🔍) |
| Phân trang | trên + dưới | GIỮ |
| Mở panel / panel lọc sẵn từ tỉ lệ cam | có | GIỮ |
| Thêm tutor | nút phụ | nút chính |
| Tải danh sách (Chọn tệp · Dán · Tải mẫu · Xem trước · lọc · sửa ô lỗi · Lưu n dòng) | có | GIỮ đủ |
| Gộp tên gõ tay + "+ Thêm vào danh sách" + Hoàn tác | ô chọn danh sách tutor đã nạp | GIỮ, tìm máy chủ có cả GV |
| Sửa / Bổ sung tutor | trong panel | "Sửa" (người sửa được dòng đó); GV: "Hồ sơ GV ›" |
| Xoá tutor (chưa có buổi) | trong hộp Sửa | GIỮ |
| Lọc kết quả bằng 5 ô số | có | GIỮ (+ chip ✕ bỏ lọc) |
| "Chỉ buổi chưa đạt" | nút | "Chỉ dòng có Không" (≤ 2 sao qua ô Đánh giá) |
| Đổi khoảng trong panel | bộ chọn thứ hai | BỎ — dùng khoảng của trang (R2.6) |
| Viết / sửa / xoá nhận xét | Head tutor / QT | GIỮ (tối thiểu 8 ký tự — XM-7, máy chủ cùng đổi) |
| Sau lưu nhận xét | toast | ở lại + "Người cần chú ý tiếp ›" |
| Xuất số buổi | — | MỚI |

Không mất thao tác nào; một thao tác bỏ có lý do (bộ chọn thời gian trong panel — R2.6).

## 3. KHỚP / KHÁC (34 mục kiểm)

| # | Mục | Kết quả |
|---|---|---|
| 1–6 | Menu sau Phân tích · tiêu đề + khoảng tuần + tìm + Lọc ▾ một hàng · ba nút phải đúng thứ bậc · chip có số + ⓘ · dải gộp · thanh đầu bảng "n người dạy · khoảng" | KHỚP |
| 7–12 | 9 cột, nhóm "Có / có trả lời" · nhãn GV / Tutor · tỉ lệ cam đậm bấm được · "—" · lý do chữ cam + mốc nhận xét · ô gộp "chưa có buổi trong khoảng" | KHỚP |
| 13 | Ngừng hợp tác: hàng mờ, cuối bảng | KHỚP |
| 14–20 | Panel: dòng loại + tên + nhãn + dòng 2 · dải 5 số chọn viền nhấn · Cần chú ý + khối form nền · đoạn Kết luận · dòng thời gian · Kết quả đã ghi + số + chip ✕ + công tắc · bảng cột đúng thứ tự | KHỚP |
| 21–25 | Hộp Xuất · Thêm (Head đoạn chi nhánh / Chỉ online) · Gộp (nhóm, dòng phụ loại · nơi dạy · KN) · Tải danh sách · E1 danh bạ trống | KHỚP |
| 26–30 | 375: thẻ · Thêm tutor + ⋯ · khoảng + Lọc · chip một hàng · panel toàn màn, dải 5 số 3 cột | KHỚP |
| 31 | Đầu bảng nhóm: `Bang` kẻ vạch dọc hai bên nhóm "Có / có trả lời" (mockup không kẻ) | KHÁC — dáng chuẩn của `Bang` (BANG-0), không sửa riêng một màn |
| 32 | Hàng có dòng phụ cao 64 (mockup 52) | KHÁC — luật hàng 44 / 64 của `Bang` (do-bang g3) |
| 33 | 375: nút 🔍 ở hàng tiêu đề (mockup ở hàng khoảng tuần); ⓘ chip ẩn ở 375 | KHÁC — mockup đặt 🔍 cạnh ô tuần làm chữ "W4 AUG" bị cắt ở 375 (do-khung (c)); chip cần đủ bề ngang |
| 34 | Panel 375: ✕ góc phải (mockup "‹ Quay lại") · "Sửa" ở hàng tiêu đề (mockup hàng loại) | KHÁC — khung `KhungPanel` chung của cả web |

**KHỚP 30 / 34 = 88 %; tính theo hình ảnh trong phạm vi màn (bỏ 31, 32, 34 là dáng thành phần chung đã duyệt): 30 / 31 = 97 %.** [XM-T1] cho PTA Tutor: chấp nhận ba KHÁC dáng chung hay sửa `Bang` / `KhungPanel` ở PR riêng.

## 4. Sửa so với mockup (đã giao khi code)

- Nút "Gộp…" 375 cao 44 nằm trong dải 54 (cách 5 px trên / dưới) — không cao hơn dải.
- Panel: ô Nhận xét 2 dòng; dòng thời gian gọn (một hàng mỗi nhận xét) — bảng Kết quả đã ghi lộ sớm.
- Ô chọn của hộp Gộp hiện danh sách trong hộp (`tinh`) — danh sách nổi bị khung hộp cắt.

## 5. [XM]

- **XM-T1** (trên): KHÁC do thành phần chung.
- **XM-T2** Head tutor ở 375 có thanh dưới 2 nút (Tổng quan · Tutor). Mockup M (XM-6 cũ) vẽ không thanh dưới vì "một mục" — nay có hai mục; không thanh thì điện thoại không vào được Tutor. Đã chọn: 2 nút (luật `chiaThanhDuoi`: ≤ 1 mục mới ẩn).
- **XM-T3** Nhận xét ≥ 8 ký tự (XM-7 mockup) — máy chủ `kiemNhanXet` đổi 10 → 8 cùng PR để web và máy chủ một luật.
- Không thêm số "Tutor n" trên menu (TU17 không chuông / số mới; mockup không vẽ) — `/tutors/dem` không gọi.
