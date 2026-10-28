# HSL-FT — bảng truy vết + KHỚP / KHÁC (mockup `thiet-ke/v7/ho-so-luot-test.html` khu A, A · 375, Thêm PA, Vừa thêm PA)

Màn: `/mock-test/:id` (`MockDetailPage.tsx`). Ảnh cặp mockup | web (trái mockup, phải web thật, DB demo cục bộ, ngày demo 14/09) ở thư mục này:
`cap-{a, them-pa, vua-them-pa, tvv, huy, chuyen-lop, khong-hoc}-1440-toi.png` + `-375-sang.png`. Vai: a / Thêm PA / Vừa thêm = GVCN Trần Ngọc Hà (MT3 Phạm Bảo Ngọc,
Case L chưa PA) · TVV Phan Mai · huỷ / chuyển lớp = QL Nguyễn Khánh Vy · Không học = Quản trị. Ảnh 375 so với khung `#a-375` (mockup chỉ vẽ 375 cho mặc định, Thêm PA, vừa thêm).
"Vừa thêm PA" chụp bằng lưu thật rồi Hoàn tác qua API (DB demo trả về như cũ). Ảnh chụp lại 28/10 trên nhánh đã gộp main.

**Tỉ lệ KHỚP = KHỚP / (KHỚP + KHÁC) = 22 / 28 = 79 % — dưới cổng 90 %.** 6 dòng KHÁC dưới đây cần chủ SP đồng ý (không dòng nào mất thao tác):

| # | KHÁC | Lý do |
|---|---|---|
| 27 | "Chỉnh lịch ▾" chỉ hiện khi có mục | GV không có quyền dời / khôi phục thì nút mở ra menu rỗng. |
| 28 | Form Thêm PA xếp dọc, không 2 cột | Dùng lại đúng `FormPa` của panel Thêm PA — một form một kiểu, 2 cột phải vẽ ô mới. |
| 29 | PA không có ⋯ (Sửa PA · Kết quả) | Dùng lại khối Case / PA của hồ sơ HV: bấm tên PA mở Ngăn Case đúng PA, "Kết quả" là nút dưới khối. |
| 30 | Bỏ dòng riêng "3/4 kỹ năng có điểm" | Số này đã có trong chip kết quả — tránh lặp một số hai chỗ. |
| 31 | Câu giải thích phạm vi / chưa Target vào ⓘ cạnh Overall | Luật V6: giải thích để ⓘ, màn ít chữ. |
| 34 | Việc ô điểm / nhận xét của người khác chưa có tên người | Máy chủ chưa trả người được phân công ô; PTA quyết để việc sau (việc Case đã có tên). |

## Khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Dải Đã huỷ (lý do · ai · ngày, Khôi phục / "Chỉ Quản lý…") | `MockDetailPage` dải `role=status` | GIỮ (có sẵn) |
| 2 | `‹ {nguồn}` | `DuongVe` (`useVe`) | GIỮ |
| 3 | Tên em + ↗ (hồ sơ HV) | `DauHoSo` — link `/hoc-vien/:id` | KHỚP |
| 4 | Ô chọn lượt `MT2 · W2 SEP ▾` | `ChonDot` | KHỚP |
| 5 | ⓘ thông tin lượt (tuần hoàn tất, dự kiến thi, mốc gợi ý) | `NutLuat` cạnh chọn lượt | KHỚP |
| 6 | Dòng nhãn / giá trị: Lớp lúc Test (· nay …) · Lịch · Target · Kỳ vọng MTn | `NhanGt` | KHỚP |
| 7 | "Nhập điểm lớp ›" · "Chỉnh lịch ▾" | Link + `Menu` (cùng mục, cùng điều kiện) | KHỚP |
| 8 | Thẻ tóm tắt: Overall / "– Không đủ bộ môn" · kết quả + n/4 kỹ năng có điểm · Còn lại | `TomTatLuot` | KHỚP |
| 9 | Còn lại: việc của tôi = nút (mở dòng + focus; bỏ "›" theo G6); việc người khác chỉ đọc | `conLaiLuot` + `TomTatLuot` | KHỚP |
| 10 | Bảng 7 cột Kỹ năng · Lịch · Điểm · Trạng thái · Nhận xét · Case · (thao tác) | `BangKetQuaLuot` | KHỚP |
| 11 | Lịch gốc gạch → thực tế + "QL dời 09/09" / "vắng lần 1" | `lichGocKn` (từ `history`) | KHỚP |
| 12 | Ô điểm ✓ / ✗ + phụ (câu · W1 W2) — bấm = hộp nhập điểm | `useODiem` (chung với dải ô lớn) + `HopNhapDiem` | KHỚP |
| 13 | Ô có điểm thiếu nhận xét viền vàng + "Chưa có" cột Nhận xét | `thieuNhanXet` (V15) | KHỚP |
| 14 | Nút chính + ⋯ theo `thaoTacKyNang` | `BangKetQuaLuot` (W gộp W1 + W2) | KHỚP |
| 15 | Vùng mở: Nhận xét | Case & phương án ngang nhau; 375 xếp dọc | `VungMoKn` | KHỚP |
| 16 | Nhận xét gõ tại chỗ + nhóm nguyên nhân; S: GV chấm + nhận xét GV phụ trách | `NhanXetKn` (tách từ `KhoiNhanXet`) | KHỚP |
| 17 | Khối Case + PA thụt có đường nối | `KhoiCase` / `KhoiPa` của `TheKyNang` (dùng lại) | KHỚP |
| 18 | "+ Thêm PA" → form tại chỗ (ô `FormPa`), Huỷ · Thêm PA; đang lưu / lỗi giữ chữ / Thử lại | `FormThemPaTaiCho` + `useThemPa` (chung với `ThemPaPanel`) | KHỚP |
| 19 | PA mới viền nhấn + "✓ Vừa thêm · Hoàn tác" (không toast) | `KhoiPa moi` + `POST /interventions/:id/hoan-tac-them` | KHỚP |
| 20 | Dải "Lịch sử {kỹ năng}" thu gọn (n thay đổi · mới nhất …) | `LichSuGon` + `dongLuot` | KHỚP |
| 21 | Dòng S Ex dưới bảng (chip · điểm · GV · tuần · ⓘ) | `DongSEx` (`sEx` máy chủ) | KHỚP |
| 22 | Lịch sử lượt thu gọn cuối trang (n thay đổi · mới nhất) | `LichSuGon` + `DongThoiGianLuot` | KHỚP |
| 23 | Đang tải / Lỗi tải | `Skeleton` / `ErrorState` (có sẵn) | GIỮ |
| 24 | (H) ô MT đầu trang `OMt` | — | BỎ — trùng ô chọn lượt + bảng (khung A không có); MT lịch sử: nhãn "Nhập bù, không tính hạn" cạnh tên |
| 27 | "Chỉnh lịch ▾" luôn hiện | chỉ hiện khi menu có mục (GV không có quyền nào → không hiện nút rỗng) | KHÁC chấp nhận — không mất thao tác |
| 28 | Form Thêm PA 2 cột (Loại \| Số buổi; Người \| Bắt đầu) | `FormPa phang` xếp dọc như panel Thêm PA (dùng lại, không vẽ ô mới); ô theo Loại (Tự học không có Người thực hiện) | KHÁC chấp nhận — cùng FormPa |
| 29 | PA có ⋯ (Sửa PA · Kết quả) | bấm tên PA → Ngăn Case đúng PA (`KhoiPa` hồ sơ HV); việc tiếp "Kết quả" là nút dưới khối | KHÁC chấp nhận — dùng lại khối hồ sơ HV |
| 30 | "3/4 kỹ năng có điểm" dòng riêng | đã nằm trong chip kết quả ("SOS 1 tạm thời · 2/4 kỹ năng") | KHÁC — bỏ dòng lặp số |
| 31 | Câu giải thích phạm vi / chưa có Target dưới bảng (H) | vào ⓘ cạnh "Overall" (Luật V6) | KHÁC — ít chữ |
| 32 | Còn lại "Case R · Thêm PA" mất sau khi thêm | cùng luật; việc "Kết quả PA" chưa tới hạn không vào Còn lại (Công việc cũng chưa đếm) | KHỚP |
| 33 | `?kn=` mở hộp nhập điểm (H) | `?kn=` mở sẵn dòng kỹ năng + cuộn tới (khung A "?kn=R mở sẵn dòng Reading") | KHỚP khung A |
| 34 | "Nhận xét" ở Còn lại có tên người (TVV) | việc ô điểm / nhận xét của người khác: chỉ đọc, chưa có tên (máy chủ chưa trả người được phân công ô); việc Case có tên (`nguoiLam`) | KHÁC — PTA quyết để việc sau (cần thêm trường máy chủ) |
| 25 | (H) dải 5 ô điểm lớn | ô điểm vào cột Điểm từng dòng | BỎ (khung A) |
| 26 | (H) thẻ Nhận xét riêng · thẻ Lịch Test · thẻ Case | vào bảng + vùng mở | BỎ (khung A) |

## Thao tác TRƯỚC → SAU

| Thao tác ở H | Sau PR |
|---|---|
| Đường về ‹ nguồn · "Lưu · em tiếp ›" | Giữ nguyên |
| Chọn lượt khác | Giữ, cạnh tên |
| Nút "Hồ sơ học viên" | Tên em là link ↗ |
| "Nhập điểm" (lưới cả lớp đúng tuần) | "Nhập điểm lớp ›", cùng điều kiện |
| Chỉnh lịch ▾ (dời lịch cả đợt · dời hạn cả đợt · đưa lại 4 kỹ năng · khôi phục kết quả · khôi phục MT cũ) | Giữ nguyên |
| Ô điểm lớn → hộp; W1 · W2 hai nút | Ô điểm trong dòng → cùng hộp; W1 · W2 hai nút ở dòng phụ |
| Nút chính + ⋯ từng dòng lịch (L · R · W1 · W2 · S) | Một dòng mỗi kỹ năng; W: thao tác lịch của W1 + huỷ / khôi phục điểm (hộp Huỷ điểm tick từng task) |
| Nhận xét L/R/W/S · nhóm nguyên nhân · GV chấm S · nhận xét GV phụ trách | Vào vùng mở của dòng |
| "Thông tin đợt Mock Test" | Lớp, lịch, Target, kỳ vọng lên dòng đầu; còn lại vào ⓘ |
| Case & phương án (DongCase → Ngăn Case) | Cột Case + khối Case / PA trong vùng mở; bấm → Ngăn Case |
| Thêm PA (Ngăn Case → panel) | Form tại chỗ trong cột Case & PA; Ngăn Case vẫn có Thêm PA |
| Nút "Lịch sử" đầu bảng + thẻ Lịch sử (nút Lịch sử chi tiết) | Lịch sử lượt thu gọn cuối trang (giữ nút "Lịch sử chi tiết") + Lịch sử kỹ năng |
| Dải Đã huỷ + Khôi phục MTn | Giữ |
| MT0 ✓ / chip SOS MT0 · Hạn chấm cả đợt | Giữ ở thẻ tóm tắt |

Không bỏ thao tác nào.

## Rà
- impeccable critique (một lần, hai đánh giá độc lập): **27/40**, 0 P0. P1 đã sửa: câu giải thích phạm vi / chưa Target → ⓘ cạnh Overall; "– – Đã huỷ" hai gạch. P2 đã sửa: "Sửa điểm" không còn là nút chính (ô điểm đã mở hộp), ô huỷ không lặp chữ, "Ngoài phạm vi" ngắn (lý do ở tooltip).
  Để lại: câu phụ "Có số buổi thì web đếm…" trong `FormPa` (component chung với panel Thêm PA — đổi thì đổi cả panel).
- audit + web-design-guidelines: P1 đã sửa — form Thêm PA giữ nháp theo Case khi thu dòng / mở dòng khác / mở form Case khác (không mất chữ). P2/P3 đã sửa: focus sau lưu → "Hoàn tác", sau huỷ / hoàn tác → "+ Thêm PA"; vùng đọc màn `aria-live`; ô điểm / nút Case ≥ 44 px ở 375; vùng mở là `row > cell aria-colspan=7`; dấu mở dòng ▸ / ▾ (không "›"); ▸ cho dải Lịch sử; ↗ `aria-hidden`; `aria-controls` chỉ khi mở; h2 trong vùng mở; tôn trọng giảm chuyển động.
- Detector: 3 cỡ chữ 20 px ngoài thang → `text-xl` (22).

## [XM] — PTA Plan đã quyết (27/10)
1. Nút việc ở "Còn lại": bỏ "›" (G6: "›" chỉ cho đổi trang) — đã sửa.
2. Tên người ở việc ô điểm / nhận xét của người khác: để việc sau, không làm trong PR này.
