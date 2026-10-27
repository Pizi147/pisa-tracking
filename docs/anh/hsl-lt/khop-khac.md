# HSL-LT — bảng truy vết + KHỚP / KHÁC (mockup `thiet-ke/v7/ho-so-luot-test.html` khu "A · lớp thường" + 375 "Lớp thường · Progress Test")

Màn mới: `/luot-test/:id` (`web/src/modules/fasttrack/LuotThuongPage.tsx`), cùng khung HSL-FT (`MockDetailPage`). Ảnh cặp mockup | web (DB demo cục bộ, ngày demo 14/09):
`cap-a-thuong-1440-toi.png`, `cap-a-thuong-375-sang.png` (GVCN Trần Ngọc Hà — vai 7, MB FOU 12, Progress Test Âu Nhật Nam: L "-" dời W2 → W3 SEP,
R 10/40 chưa đạt → Case R tự mở + PA Bổ trợ, G+V · P chờ điểm), `cap-tvv-1440-toi.png` (TVV Phan Mai — vai 27, chỉ đọc).
Dữ liệu demo khác mockup (em, tuần, số câu) — so khung, không so số.

**Cổng:** tỉ lệ **KHỚP 22/26** (85 %) + 1 GIỮ; tính cả KHÁC chấp nhận (ô điểm gõ trực tiếp, chữ Kết quả của lưới) **24/26 (92 %)**; 2 KHÁC **Để sau** (tên GV môn, khôi phục lượt huỷ).
**impeccable critique:** 28/40 → sửa → 29/40 → sửa → **31/40**, 0 P0 / 0 P1 (hai đánh giá độc lập mỗi vòng + detector: 0 lỗi mã, 3 "nested-cards" = khung con viền mảnh của vùng mở theo khung, "Ctrl K" báo nhầm). Đã sửa: kết quả bằng chữ "✗ Chưa đạt · 25%" (không chỉ màu),
một môn một tên trạng thái (dòng = Còn lại), quá hạn hiện ở Còn lại, cột Case đúng trạng thái, `aria-colindex` cho bảng, ⋯ cùng hàng ở 375, tên em ≥ 44 px, khung Nhận xét không kéo dãn.
Còn P2/P3 để lại: dòng "Lịch" đầu trang khi các môn khác tuần ("L: W3 SEP · R, G+V, P: W3 AUG"); ô "-" của môn đã dời còn hiện "-" (luật "-" của `ODiemThuong` — không tự đổi); ô Listening tổng trống khi mang "-"; thẻ 375 dài.

## Khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | `‹ {nguồn}` | `DuongVe` + `trangCha('luot')` (về hồ sơ em khi mở thẳng) | KHỚP |
| 2 | Tên em ↗ (hồ sơ HV) | Link `/hoc-vien/:id` | KHỚP |
| 3 | Ô chọn lượt `Progress Test · W3 SEP ▾` + ⓘ | `ChonDot` (dùng chung FT; em chỉ một lượt → chữ tên lượt) + `NutLuat` (chương trình · chi nhánh; hạn ở từng môn) | KHỚP |
| 4 | Lớp lúc Test (· nay …) · Lịch · Đạt từ | `NhanGt`; Lịch nhiều tuần → "L: W2 SEP · R, G+V, P: W3 AUG" | KHỚP |
| 5 | "Nhập điểm lớp ›" | `duongNhapDiemCu` → panel Nhập điểm lớp đúng lượt; chỉ khi người xem có môn nhập được | KHỚP |
| 6 | Tóm tắt: % tổng (đủ môn) · kết quả · Còn lại | `% tổng` (`tyLeTong`) · `KetQua` của bảng điểm lớp (cùng hàm — G7) · `ConLaiLuot` (chung FT) | KHỚP |
| 7 | Còn lại: việc của tôi = nút; người khác chỉ đọc (viền đứt) | `conLaiThuong` (ô cần nhập = `oThuong().trong`, vắng chờ xếp lại, "-" chưa tới tuần, Case = `viecCaseLuot` chung FT); việc quá hạn "⚠ quá hạn dd/mm" lên đầu (`ConLaiLuot` chung — FT cũng nhận viền đứt) | KHỚP |
| 8 | Bảng 7 cột Môn · Lịch · Điểm · Trạng thái · Nhận xét · Case · ⋯ | `DongMon` (lưới như FT, cột Môn rộng 12rem cho "Grammar + Vocabulary") | KHỚP |
| 9 | Lịch gốc gạch → tuần mới + "vắng" (dấu "-") | `movedFromStart` → `weekStart` | KHỚP |
| 10 | Điểm "✓ 24/30" + % | `ODiemThuong` của bảng điểm lớp (người nhập được: hai ô đúng / tổng, sửa có lý do; người khác: "✗ 10/40") + % | KHÁC chấp nhận — giữ ô gõ trực tiếp của lưới (thao tác cũ), không đổi thành hộp |
| 11 | Trạng thái + hạn (Chờ điểm · hạn 23/09, Làm bài W4 SEP) | `Status` + "hạn dd/mm" / "⚠ Quá hạn dd/mm" (V8) | KHỚP |
| 12 | Nhận xét "Có · người" / "Chưa có" | "Có · người nhập" / "Chưa nhận xét" chữ mờ (N8: lớp thường không bắt buộc — không màu nhắc V15) | KHỚP |
| 13 | Case "Case R" + "Chưa có PA" | "Case R" + trạng thái Case của thẻ hồ sơ HV (`trangThaiV4`, cùng chữ khối Case) | KHỚP |
| 14 | ⋯ / "Chỉ xem" | `thaoTacKyNang` (laFt = false) như ⋯ ô lưới + mục "Lịch sử" (`NganLichSuBai`) | KHỚP |
| 15 | Vùng mở: Nhận xét \| Case & phương án; 375 xếp dọc | `VungMoKn` (tách từ FT, dùng chung) | KHỚP |
| 16 | Nhận xét gõ tại chỗ, lưu khi rời ô | `ONhanXet` → `useLuuThuong.nhanXet` (lỗi giữ chữ, "Chưa lưu — thử lại") | KHỚP |
| 17 | Khối Case + PA thụt, "+ Thêm PA" form tại chỗ | `CaseLuotKn` (chung FT: `KhoiCase` / `KhoiPa` / `FormThemPaTaiCho`) | KHỚP |
| 18 | Dải "Lịch sử {môn}" thu gọn | `LichSuGon` + `dongLuot` (lịch · điểm · Case / PA — máy chủ trả thêm `lichSuCase`) | KHỚP |
| 19 | Lịch sử lượt thu gọn (n thay đổi · mới nhất) | `LichSuGon` + "Lịch sử chi tiết" | KHỚP |
| 20 | Không S Ex, không Target / kỳ vọng / Overall | — | KHỚP |
| 21 | 375: thẻ từng môn, ô ≥ 44 px | `ODiemThuong lon` dưới 768 px; không tràn ngang | KHỚP |
| 22 | Còn lại "chờ điểm · Phạm Thu Trang" (tên GV môn) | chưa có tên (máy chủ chưa trả người được phân công ô) | KHÁC — **Để sau** (PTA 28/10, như [XM] 2 của HSL-FT) |
| 23 | "SOS 1 tạm · R" + "2/4 môn có điểm" | `KetQua` của lưới: "0/1 môn đạt" + dòng phụ ("L dời sang W3 SEP" / "còn … chưa chấm") | KHÁC chấp nhận — cùng chữ với bảng điểm lớp (một số liệu một hàm) |
| 24 | "chờ G+V, P" cạnh % tổng | "chờ L, G+V, P" (chữ nhỏ thay dấu "—" to khi chưa đủ môn) | KHỚP |
| 25 | Dải Đã huỷ "Chỉ Quản lý khôi phục được" | dải Đã huỷ chỉ lý do · ai · ngày — lượt lớp thường chưa có đường khôi phục (huỷ khi em chuyển lớp / bảo lưu) | KHÁC — PTA 28/10 đồng ý; khôi phục lượt thường đã huỷ (luật "không khoá cứng") = việc máy chủ riêng, **Để sau** |
| 26 | Đang tải / lỗi tải | `Skeleton` / `ErrorState`; id là lượt FT (404) → hồ sơ Mock | GIỮ |

## Thao tác TRƯỚC → SAU

| Trước PR (lượt lớp thường không có trang riêng) | Sau PR |
|---|---|
| Hồ sơ HV › bảng Test, Hành trình, chuông, Công việc → `duongDotTest` → bảng điểm cả lớp `/bang-diem-thuong/:lop` (mất lớp → hồ sơ HV) | → `/luot-test/:id` (+ `?kn=` mở sẵn dòng môn); mất lớp + biết em → hồ sơ HV như cũ |
| Tên em ở bảng điểm lớp thường (panel Nhập điểm lớp, Lịch Test tuần, Điểm theo lớp; lưới + một kỹ năng) → hồ sơ HV | → trang lượt (như tên em ở lưới FT → hồ sơ lượt Mock); hồ sơ HV = tên ↗ đầu trang lượt |
| `/mock-test/:id` của lượt thường → chuyển về bảng điểm lớp | → chuyển sang `/luot-test/:id` |
| Chuông "đổi lịch" một em (GVCN) · Cần xử lý "bài quá hạn nhập điểm" → bảng điểm lớp | → trang lượt (chuông) / trang lượt `?kn=` mở đúng môn (Cần xử lý); chuông "n em đổi lịch" cả lớp giữ bảng điểm lớp (`duongBangDiemThuong`) |
| Ô điểm: gõ đúng / tổng, "-" = vắng (dời tuần sau), xoá "-" = hết vắng, sửa điểm có lý do | Giữ — cùng `ODiemThuong` + `useLuuThuong` (lưu từng ô, lỗi giữ nháp + "Lưu lại") |
| Nút Nhận xét cạnh ô → hộp | Ô Nhận xét gõ tại chỗ trong vùng mở (cùng đường lưu, cùng quyền `nhanXetDuoc`); bảng điểm lớp vẫn có nút cũ |
| ⋯ ô: Xếp lại bài vắng · Dời lịch · Dời hạn · Báo vắng · Huỷ / Khôi phục điểm · Lịch sử | Giữ ở ⋯ cột cuối (cùng `thaoTacKyNang`, cùng `HopThaoTacMt`); nút chính dòng khi có việc lịch (Xếp lại bài vắng) |
| Case → Ngăn Case (cột Kết quả chỉ có nhãn) | Cột Case + khối Case / PA trong vùng mở; bấm → Ngăn Case; "+ Thêm PA" form tại chỗ |
| Bảng điểm cả lớp (lưới) | Giữ; "Nhập điểm lớp ›" mở đúng lượt |

Không bỏ thao tác nào.

## Ghi chú mã
- Tách dùng chung từ `MockDetailPage` (không đổi hành vi FT): `ConLaiLuot`, `viecCaseLuot`, `VungMoKn`; export `ChonDot`, `LichSuGon`.
- Máy chủ: `GET /regular/attempts/:id` trả thêm `cycleId` (thẻ Case đúng lộ trình) + `lichSuCase` (như FT). Không đổi luật điểm / SOS / quyền.
- `LoaiHoSo` thêm `luot` (tiêu đề tab "Hồ sơ lượt Test"); khu vực Test, hướng dẫn GV nhận `/luot-test`.

## [XM] — PTA Plan đã quyết (28/10)
1. Tên GV môn ở "Còn lại" / Trạng thái: **Để sau** (như HSL-FT).
2. Dải Đã huỷ không ghi "Chỉ Quản lý khôi phục được" khi không có đường khôi phục; khôi phục lượt thường đã huỷ = việc máy chủ riêng, **Để sau**.
