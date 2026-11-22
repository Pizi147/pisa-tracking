# NHẸ HƠN PR-2a · CONG-VIEC-TRANG — khớp / khác mockup v23

Khung: `thiet-ke/v23/cong-viec-gv|tvv|admin|head.html` (+ ghi chú). Đặc tả `docs/superpowers/specs/2026-11-22-nhe-hon-design.md` mục 3, 6.

## Truy vết khung → thành phần → ảnh

| Khung | Ý | Thành phần | Ảnh | Khớp |
|---|---|---|---|---|
| G1, T1, A1, H1 | Đầu trang "Công việc · n việc · m quá hạn" mọi vai | `HoTroHocVienTab.tsx` `cv-tom` (bỏ hai số Admin, bỏ dải chỉ số TVV, bỏ tên chi nhánh TVV) | `*-1440-toi.png` | KHỚP |
| H1–H4 | Của tôi / Của GV / Tất cả ở hàng RIÊNG dưới tiêu đề, trên tab | `cv-pham-vi` | `head-*` | KHỚP |
| H1 | "Của GV · 12" = số quá hạn | `soGvQuaHan` (cùng `demDongViec`) | `head-1440-toi.png` | KHỚP (số chỉ khi đã ở Của GV / Tất cả — [XM-A]) |
| H1 | "Của GV" chỉ quá hạn + sắp đến (≤ 2 ngày) | `viecGapCuaGv` (shared, cùng mốc `mucHan`) | `head-*` | KHỚP |
| H1 | Tên GV nhỏ cuối dòng, mỗi người một dòng | `DongPhu` `nguoi` cuối dòng | `head-*` | KHỚP |
| A1 | Admin tab Tất cả · Điểm · Báo cáo PH · Lịch thi · Hồ sơ · Vận hành · Đang theo dõi | `TAB_ADMIN` / `tabAdminCua` | `admin-*` | KHỚP (Lịch thi / Hồ sơ ẩn khi Admin không có việc loại đó — PTA chốt XM-B) |
| A1 panel | Panel lớp: em · còn thiếu · người phụ trách · hạn; S Mock = "GV Speaking" | `PanelLopAdmin.tsx` + `emThieu` (máy chủ, chỉ Admin, +0 câu) | `admin-panel-*` | KHỚP (chân: "Nhập điểm ›" thay "Nhắc GV" — Nhắc đã bỏ OV-12h) |
| T1 vòng 3 | HV của tôi nhóm theo lớp: "lớp · n em" · tên · 1 chip · số việc | `HvCuaToi.tsx` `NhomLop` | `tvv-*` | KHỚP |
| G1 | Dòng: tên 600 · phụ chữ thường · ≤ 2 chip · hạn luật PR-1 | `DanhSachViec.tsx` `DongPhu`, bỏ ô biểu tượng | `gv-*` | KHỚP |
| G1 | Nhập điểm: "MB FT 101 · W3 NOV · thiếu 5 em" + chip "L R W1 W2" | `dongDiem` | `gv-*` | KHỚP |
| G1 | Lớp của tôi bảng 4 cột | `LopCuaToi.tsx` | `gv-*` | KHÁC có lý do: cột việc giữ chip theo loại (bấm mở đúng loại — thao tác V21) thay một số |
| G1 | Vạch hạn trong mục ("Quá hạn" · "Hạn đến 20/09/2026") | `chiaVachHan` (có sẵn) | `gv-*` | GIỮ (mockup không vẽ; bỏ là mất mốc tuần) |
| H1 | "Chờ bạn duyệt" chỉ ở "Của tôi" | tab duyệt ẩn khi Của GV | `head-*` | KHỚP |
| A1 | Danh sách Admin không ghi người phụ trách (người ở panel lớp) | `anNguoi` | `admin-*` | KHỚP |
| A1 | Dòng Điểm gộp một lớp ("MB FT 101 · thiếu 6 bài") | máy chủ gom lớp × tuần × người | `admin-*` | KHÁC: dòng theo người phụ trách như cũ (khoá việc + làm thay theo người); panel lớp gom đủ |
| C1 (panel-cham-diem) | Panel bảng 75 % → cột trái 330 px, dòng gọn không nút; đầu nhóm dính không đè panel (PR-4 báo) | `data-pn="bang"` (KhungPanel) + `:has()` ở trang; cột trái `isolate`, cột phải `z-20` | `gv-panel-bang-gia-lap-1440-toi.png` | KHỚP |
| — | Dải chỉ số TVV (5 ô) | — | — | BỎ (chủ SP mục 0) |
| — | Ô biểu tượng đầu dòng việc | — | — | BỎ (60-30-10, mockup không có) |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Của tôi / Của GV / Tất cả cùng hàng tiêu đề | hàng riêng dưới tiêu đề (giữ) |
| "Mọi hạn ▾" trên hàng đầu | trong "Lọc thêm" (giữ; đang lọc thì Lọc thêm có số + mở sẵn) |
| Head "Của GV" mọi việc của GV | chỉ quá hạn + sắp đến; việc còn xa xem ở "Tất cả" |
| Admin đầu trang "Việc của tôi n · Việc của GV n" | "n việc · m quá hạn" |
| Admin xuất BC PH trong tab Vận hành | tab "Báo cáo PH" riêng (nút Xuất lớp giữ) |
| Admin bấm dòng Nhập điểm → lưới | panel lớp (em · thiếu · người) → "Nhập điểm ›" mở lưới cũ |
| TVV dải 5 chỉ số | bỏ |
| TVV HV của tôi: chip "{nhóm} · n" mỗi nhóm | một số việc / em (bấm = mở việc gấp nhất, như chip cũ); tên nhóm ở `title` / trình đọc màn |
| Mọi thao tác khác (+ Task, + Giao việc, Gia hạn, Bỏ qua, Hoàn thành, Xuất lớp, Tìm em, "n em khác") | giữ |

## [XM] hỏi PTA
- [XM-A] "Của GV · n" khi đang ở "Của tôi": không hiện (cần GET thêm ~50 câu · ~1 200 dòng / lần mở). Đề xuất giữ như vậy.
- [XM-C] Admin: dòng Nhập điểm mở panel lớp trước, lưới sau một bấm. Muốn mở lưới thẳng như cũ thì bỏ một điều kiện.

## Turso
- `/my-work`: +0 câu (trường `emThieu` dựng từ dữ liệu đã đọc, chỉ gửi cho Admin). `tocDoDuong` giữ trần cũ.
- Web: TVV −1 request (`/ref/branches` cho tên chi nhánh đầu trang — đã bỏ). Của GV lọc tại máy; panel lớp dùng dòng đã nạp.
- Còn: `/tong-quan/tvv/em` vẫn tính `chiSo` (dải đã bỏ) — đề xuất PR máy chủ sau bỏ phần đó cho nhẹ.

## Ảnh
`{gv,tvv,admin,head}-1440-toi.png` · `-1280-toi.png` · `-375-sang.png` · `admin-panel-1440-toi.png` · `gv-panel-bang-gia-lap-1440-toi.png` (panel giả lập rộng bảng — panel lưới tuần 75 % đến từ PR-4). Admin chụp bằng Admin Monbay (id 26): Admin Cẩm Phả demo không có việc.
