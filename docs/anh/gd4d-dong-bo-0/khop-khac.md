# GD-4d — Đồng bộ mockup ⓪ cho phần đã merge (4a, 4b) · "Lưu · việc tiếp ›" ở các panel còn thiếu · khung bậc Xác nhận xử lý ⑤ D1a

Nguồn: `thiet-ke/v21/dong-bo-ghi-chu.md` (mockup ⓪, chủ SP duyệt lời 35–37) mục 0 + dòng 15–19, 40b, 40c, 40d; mockup ⑤ `bang-mau.html` C, D1a, D4, E2, F3, H5; ③ `ho-so-hv.html` K4a. Lời chủ SP: 35 (tên bậc, chip số), 36 (chân panel việc), 40 ("thông tin hiện theo trạng thái"). PTA Plan giao 15/11 (kèm [XM-A] của 4b).

Ảnh cặp (trái mockup · phải web; seed 14/09; 1440 tối, 375 sáng; phông OK):

| Ảnh | Mockup | Web |
|---|---|---|
| `cap-1440-xu-ly.png` · `cap-375-xu-ly.png` | ⑤ D1a · D4 | vai 7 · Ý thức › Xử lý vi phạm › một em |
| `cap-1440-thang-hv.png` | ③ K4a | vai 7 · hồ sơ HV › Ý thức (thang vạch) |
| `cap-1440-xem-vi-pham.png` | ⑤ D1b (khung panel) | vai 7 · Ý thức › Xem vi phạm › một em (chân có nút gộp) |
| `cap-1440-tinh-hinh.png` | ⑤ F3 | "+ Task" › Tình hình học tập (một hộp), gõ "tran" |
| `cap-1440-chip.png` | ⑤ C2 | Công việc › Lớp của tôi (chip số) |
| `zoom-x-ba-cham.png` | ⑤ F2, D1 · ③ | góc ✕ / ⋯ phóng to |

## 1. Truy vết

| # | Khung / lời | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | ⓪ dòng 16, 18 · ⑤ H5 · lời 35: tên bậc VIẾT HOA; viết ĐỦ "WARNING LETTER n" nơi quyết / PH đọc, TẮT "WL n" nơi chật | `bacNgan` / `bacDu` (`shared/domain/yThuc.ts`, `mocTuNhan` dùng lại). Viết đủ: danh sách "Thang ▾" (`ThangYThuc` `BacO`, `ChipDeXuat`), panel Xác nhận xử lý (bối cảnh, 4 cách, nút chọn bậc, nút "Xác nhận · {bậc}", toast), Thu hồi (`XemXuLyPanel`), "Bậc kế" hồ sơ HV, Xem vi phạm, Đã thực hiện, Khai bậc (một em, lô — nút chọn), Báo PH (`BangLan`), tiêu đề panel (`KhungPanel` h2). Viết tắt: badge Đã xử lý / Thu hồi…, cột bảng (`DanhSachHvLop`), dòng việc + thẻ phụ (`tenViec`, `DongPhu`), lô | xu-ly, thang-hv, xem-vi-pham | KHỚP |
| 2 | ⓪ mục 0, dòng 15, 17 (chủ SP 15/11: "KHÔNG ĐỂ HẲN CHỮ WARNING LETTER vào trong progress bar"): thang = vạch bình thường, mốc WL vạch đỏ dày / dài hơn, không chữ; bậc kế nhạt | `ThangVach` (`ThangYThuc.tsx`) — vạch 22×5 (375: 14), đã tới màu nhấn, bậc kế nhạt, WL 30×9 đỏ (375: 20), đã tới viền mờ đỏ; tên bậc viết đủ ở `aria-label` / `title`. Dùng ở hồ sơ HV (thay nhãn "WL n" đỏ của #1602) và panel Xác nhận xử lý | thang-hv, xu-ly | KHỚP |
| 3 | ⑤ D1a: khối "Bậc hiện tại · Bậc kế · TVV" + "Thang xử lý" | `XacNhanXuLyPanel` — thay dòng "REPORT 1 · 07/08 Bậc kế Report 2"; TVV chỉ khi em có (lời 40); GIỮ 4 cách xử lý, danh sách vi phạm, Ngày / Người / Mô tả / Bằng chứng, dòng quy chế | xu-ly | KHỚP |
| 4 | Lời 36 · ⓪ 40c · [XM-A] 4b: panel mở từ danh sách còn việc kế → "Đóng" · nút lưu · "Lưu · việc tiếp ›" (chính); lẻ → "Đóng" · nút lưu (chính) | dùng lại `onTiep` / `luuRoiTiep` / `NutVaTiep` / `NutDongPanel`: Xác nhận xử lý · Đã thực hiện · Khai bậc (một em: "Đóng" vào hàng nút; lô: nút gộp khi khai được ≥ 1 em) · Xem vi phạm ("Đã xem · việc tiếp ›") · Bàn giao GVCN (em cuối: "Xác nhận · việc tiếp ›") / GV môn ("Việc tiếp ›" thành chính khi hết em thiếu) · Bàn giao đổi GV ("Xác nhận · việc tiếp ›") · Phối hợp SOS ("Việc tiếp ›" thành chính khi hết em làm được — lưu từng dòng em, không thêm nút gộp vô nghĩa, lời 40). 375: "Đóng" ẩn (⑤ D4) | xu-ly, xem-vi-pham | KHỚP |
| 5 | ⓪ dòng 19 · lời 35: nút-chip "Việc cần làm" = "{loại} · {số}", không đơn vị; "›" khi đổi trang | `LopCuaToi` đã đúng số; thêm "›" khi việc đầu của chip đổi trang (`lamTaiCho`); trình đọc màn hình vẫn nghe đủ nghĩa ("6 bài chờ nhập điểm"); badge tab đã đúng (số; Chấm Speaking "⚠ n") | chip | KHỚP |
| 6 | ⓪ 40d · ⑤ F3: Tình hình học tập từ "+ Task" = MỘT hộp: chọn em (≤ 8) + Gửi tới + Nội dung + "Đóng · Gửi TVV" | `HopTinhHinh` nhận `chonEm` (`TinhHinh.tsx`); ô chọn em `OTimEm` tách từ `NutTask` (kính lúp, ✕ xoá chữ, nhóm lớp, tô khớp, chip + "n / 8"); cùng đường gửi / kiểm 10–500 ký tự / Hoàn tác / câu quy chế Q36; hồ sơ HV: em cố định. "Gửi tới" + hạn ẩn khi chưa chọn em (lời 40) | tinh-hinh | KHỚP |
| 7 | ⓪ 40b · ⑤ E2: hộp nhập Writing chỉ giữ dòng xem trước; công thức vào ⓘ | `HopNhapDiem` — dòng "Task 1 6.0 → Writing 6.0 · kỳ vọng 5.5" (công thức máy chủ `writingBand`), ⓘ "Cách tính Writing" | — (kiểm mã; ảnh hộp W cần vai GV Writing) | KHỚP (mã) |

**KHỚP 7 / 7 = 100 %.**

## 2. KHÁC / [XM] (hỏi PTA Plan)
- **[XM-1] Nhãn bậc ở máy chủ giữ "Report 1" / "WL 1"**: `MEASURE_KIND_LABEL` / `nhanLoaiXuLy` dựng tiêu đề việc, thông báo, dòng lưu trong DB — đổi ở đó là đổi dữ liệu / API và vỡ ~25 phép kiểm chạy thật. Web viết hoa khi HIỂN THỊ qua `bacNgan` / `bacDu` (cả chuỗi máy chủ cũ). Tệp xuất / thông báo chuông chưa viết hoa — PR riêng nếu cần.
- **[XM-2] Ngoài thang** (Meeting CX/GĐCN, Đình chỉ, Khác) giữ chữ thường (cùng nhãn dùng ở Case và Hướng dẫn); WL 3 vốn đã hoa.
- **[XM-3] Xem vi phạm 375 khi còn việc kế**: chân 3 nút xuống hai hàng (Xác nhận xử lý · Đã xem · n / "Đã xem · việc tiếp ›" cả hàng) — đã chụp `cap-375-xem-vi-pham.png`, đủ rộng, vùng bấm 44; mockup D4 chỉ vẽ 2 nút. Bỏ "Đã xem · n" ở 375 nếu PTA muốn một hàng.
- **[XM-4] Đầu hộp "Báo tình hình"** ở hồ sơ lớp / HV cũng đổi theo (cùng hộp: "Tình hình học tập · Gửi TVV" + ✕); loại Hỏi / Sửa / Ghi kết quả giữ đầu cũ.
- **[XM-5] Ô chọn em trong hộp Tình hình**: chip em đặt trên ô gõ (như ô hiện có), danh sách gợi ý đẩy nội dung (mockup F3: chip trong ô, danh sách nổi) — để GD-5 (ô chọn có tìm chung).
- **[XM-6] Dòng xem trước Writing** dùng mũi tên kỳ vọng sẵn có (▲ / ▼) thay "✓" của mockup, cho khớp các ô khác.
- **[XM-7] Chip "›"**: ⑤ C2 vẽ "Vận hành · 1" không "›"; web thêm "›" khi việc đầu của chip đổi trang (vd Báo cáo PH sang hồ sơ lớp) — theo luật ⑤ C "› = đổi trang".
- Ngày lần xử lý trước không còn ở khối bậc (⑤ D1a không vẽ) — vẫn xem ở lịch sử.

Từ 4b chuyển backlog (PTA chép): Q27 chữ theo mã · Q29 tối thiểu 8 ký tự theo hằng · Q74 / Q75 / Q77 (trang Cuối khoá), Q80, Q82, Q83 chưa gắn câu.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| + Task › Tình hình học tập | hộp chọn em ("Đóng · Tiếp ›") → hộp thứ hai (Nội dung → Gửi TVV) | MỘT hộp: chọn em + Nội dung + "Đóng · Gửi TVV" | GỘP (⓪ 40d) |
| Lưu rồi sang việc kế ở Xác nhận xử lý / Đã thực hiện / Khai bậc / Xem vi phạm / Bàn giao | lưu → tự đóng / ở lại, bấm việc kế tay | + "… · việc tiếp ›" (một bấm) | THÊM (lời 36) |
| Đóng các panel trên (≥ 640) | ✕ / "Đóng" (một số) | "Đóng" ở hàng nút mọi panel | GIỮ / THÊM |
| Đóng Xác nhận xử lý ở 375 | "Đóng" ở chân | ✕ / ‹ ở đầu panel (chân chỉ nút việc, ⑤ D4) | ĐỔI chỗ |
| Đọc thang cấp bậc | vạch + nhãn "WL n" đỏ trong thanh | vạch, mốc WL vạch đỏ dày; tên ở rê / đọc màn hình / "Thang ▾" | ĐỔI dáng (chủ SP 15/11) |
| Đọc công thức Writing | dòng chú thích trong hộp | ⓘ cạnh dòng xem trước | ĐỔI chỗ |
| Bấm chip "Việc cần làm" | như cũ | như cũ (chip đổi trang có "›") | GIỮ |

Không thao tác nào bị mất.

## 4. Ẩn theo trạng thái (lời 40)
- Khối bậc Xác nhận xử lý: TVV chỉ khi em có TVV.
- Hộp Tình hình: "Gửi tới" + "Hạn TVV" ẩn khi chưa chọn em.
- Nút gộp chỉ khi còn việc kế VÀ người xem làm được (Đã thực hiện: chỉ khi đang chờ ghi; Khai bậc lô: khi khai được ≥ 1 em; Xem vi phạm: khi xử lý được và còn vi phạm mới; Bàn giao GVCN: ở em cuối chưa xác nhận); việc đã xong / chỉ xem thì không có nút lưu.
- Phối hợp SOS: không thêm nút gộp (lưu từng dòng em) — "Việc tiếp ›" thành nút chính khi hết em làm được.

## 5. Đo ✕ / ⋯ (≤ 1 px)

| Chỗ | 1440 | 375 |
|---|---|---|
| ✕ hộp Tình hình (mới, `NUT_DONG`) | 36×36, lệch 0,3 | 44×44, lệch 0,3 |
| ✕ hộp chọn em | 36×36, lệch 0,3 | 44×44, lệch 0,3 |
| ✕ panel việc · Case (dòng loại) | 36×36, lệch 0 | 44×44, lệch 0 |
| ✕ panel Xem vi phạm | 36×36, lệch 0 | 44×44, lệch 0 |
| ⋯ đầu hồ sơ HV (so với "+ Case") | 36×36, lệch 0 | 44×44, lệch 0 |

## 6. Hướng dẫn "?"
`shared/huongDan/gv.ts` mục `cv-task`: thêm câu Tình hình học tập một hộp (+ EN `shared/i18n/en/gd4.ts`).

## 7. Turso
0 câu, 0 request thêm (hộp Tình hình vẫn MỘT câu `/tim/hoc-vien?lop=toi` mỗi lần gõ; gửi cùng đường `POST /tinh-hinh`).
