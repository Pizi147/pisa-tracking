# PANEL-GON · khung panel 720 + luật cột lưới điểm — khớp / khác mockup v24

Mockup: nhánh `claude/mockup-v24-cv-65e402` — `thiet-ke/v24/cong-viec-gon.html`, ghi chú mục 2 (luật cột) · 4 (khung 720). Ảnh cặp CẢ MÀN (trái mockup | phải web), 1440 / 1280 tối + 375 sáng.
Danh sách bên trái KHÔNG thuộc PR này (session khuon-a-danh-sach làm khuôn A) — ảnh web còn dòng việc kiểu cũ.

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần | Ảnh | Kết luận |
|---|---|---|---|
| Mục 4 · khung 720 mọi panel | `KhungPanel`: 'viec' · 'bang' · tên cũ cùng 720 (portal + tại chỗ); màn < 720 toàn màn | mọi `cap-*` | KHỚP |
| A1 / A3 · danh sách 680 (1440) / 520 (1280) cạnh panel | `HoTroHocVienTab`: cột trái min(680, 100vw − 760); bỏ "lưới Ghi kết quả PA ẩn danh sách, 1040" | `cap-*-1440`, `cap-*-1280` (đo ds = 680 / 520) | KHỚP |
| Đầu panel một dòng: tên · lớp · bài · hạn | khối tên + phần phụ co giãn; thiếu chỗ phần phụ xuống dòng dưới tên | `cap-cham-p-1440`, `cap-cham-mock-1440` (một dòng) · `cap-case-1440` (hai dòng: tên em + Case dài) | KHỚP |
| Hạn ở đầu panel = ngày tô màu chữ | `HanChiNgay` (Nhan.tsx) trong đầu `KhungPanel` — mọi panel dùng `dau.han` | `cap-cham-p-1440` 26/08/2026 đỏ · `cap-case-1440` 16/09/2026 vàng | KHỚP |
| ⓘ ⋯ ✕ ô 36, tâm cách 36, thẳng dòng tên | đo 8 panel × 1440 / 1280: ô 36 × 36, tâm cách 36,0, tâm dọc = dòng tên (lệch 0 px), ✕ cách mép 8 | — | KHỚP |
| P1 · lưới P: tên 2 phần · cột điểm 1 phần · Kết quả sát mép 14 | `Bang deu` trong panel: `--ten-pt` + index.css | `cap-cham-p-1440`: tên 338,5 · P 169,3 · Kết quả 169,3 (= mockup 338,5 / 169,3 / 169,3); Kết quả cách mép 14,0 | KHỚP |
| P2 · lưới Mock cột bằng nhau | như trên | `cap-cham-mock-1440`: tên 270,8 · L 135,4 · R 135,4 · Kết quả 135,4; cách mép 14,0 | KHỚP (cột khác mockup — xem [XM-1]) |
| "Đã có điểm · n em" dòng gập trong cùng lưới, em thiếu ở trên | `DongTach` (Bang.tsx) + nhóm chốt lúc mở ở `LuoiFT` / `LuoiThuong` (chỉ trong panel) | `cap-cham-mock-1440` ("Đã có điểm · 1 em") | KHỚP |
| P1 · lưới một lớp trong khung viền, không khối lớp lặp | `PanelNhapDiemTuan` một lớp → lưới thẳng trong `.luoi-khung` | `cap-cham-p-1440` | KHỚP |
| Nhiều cột hơn bề ngang → cuộn ngang trong lưới, tên dính trái | `min-width` của `Bang` giữ sàn cột; cột tên `sticky-col` | Mock "Cả lớp" 9 cột: cuộn trong lưới, tên 200 | KHỚP |
| A2 · panel Case | khung 720 + đầu; nội dung Case giữ (trường web thật) | `cap-case-*` | KHÁC nội dung (mockup minh hoạ — ghi chú [XM5]) |
| Ý thức · Vận hành (không có khung riêng) | cùng khung 720 | `cap-y-thuc-*`, `cap-van-hanh-*` (đối với A2 / A3 / A5) | KHỚP khung |
| P3 · 375 lưới bảng | GIỮ màn chấm từng kỹ năng cũ ở 375 (`MotKyNang`) | `cap-cham-p-375-sang` | KHÁC — [XM-2] |
| Chân "Lưu" + "Lưu · việc tiếp ›" | GIỮ chân web (ô tự lưu từng ô + "Việc tiếp ›"; panel form: Đóng / nút chính) | mọi `cap-*` | KHÁC — luật tự lưu giữ nguyên |

Máy dò (tự viết, Playwright 1440): mở 61 việc của 6 vai (GV 7 · 9 · 11, Head 2, TVV 23, CX 24) ở khung 720 → 0 phần tử lòi khung, 0 chữ bị cắt "…", 0 thân panel cuộn ngang.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Mở panel việc | 58 % / 75 % (835 / 1080 ở 1440) | 720 mọi panel |
| Danh sách cạnh panel lưới | thu còn 330 px (lưới Ghi kết quả PA: ẩn hẳn danh sách) | 680 (1440) / 520 (1280), không ẩn |
| Nhập điểm (ô, Enter / ↑ ↓, tự lưu, ⋯ ô, Nhận xét, Vắng, "Việc tiếp ›", "Lớp tiếp ›", Cả lớp, Mở lưới đầy đủ ›, Tổng số câu + Điền ô trống) | có | giữ |
| Xem em đã có điểm | lẫn trong danh sách em | nhóm "Đã có điểm · n em" dưới em còn thiếu, bấm để gập / mở |
| Kết quả lưới lớp thường trong panel | dưới tên em (G1-11 `luoiGon`) | cột Kết quả riêng ở mép phải (như P1) |
| ⓘ quy chế · ⋯ · ✕ · Esc · ‹ Quay lại · hỏi "Bỏ chữ?" | có | giữ |

## Chỗ tự quyết ([XM])

- **[XM-1]** P2 vẽ đủ L R W1 W2 S Overall (cột người khác chấm là số xám). Web giữ luật cũ: mở từ việc chỉ cột của người xem + Kết quả; "Cả lớp" mở đủ cột (kèm Kỳ vọng). Đổi mặc định là đổi tính năng → chờ chủ SP.
- **[XM-2]** P3 (375) vẽ lưới bảng; web giữ màn chấm từng kỹ năng (chip L 1/6 · R…, mỗi em một ô to) — đổi là đổi luồng nhập ở điện thoại.
- **[XM-3]** Mockup chân "Lưu" + "Lưu · việc tiếp ›"; lưới web tự lưu từng ô nên chân chỉ "Việc tiếp ›" (+ giờ lưu) — giữ.
- **[XM-4]** Nhóm "Đã có điểm" chốt lúc mở lưới: em vừa nhập xong vẫn đứng ở nhóm trên tới khi mở lại (không nhảy chỗ khi đang gõ).
- **[XM-5]** Lưới nhiều lớp (một tuần thi nhiều lớp) giữ khối lớp gập / mở (`pc-kl`); mockup chỉ vẽ một lớp.
- Hạn dạng "quá hạn n ngày" ở NƠI KHÁC (dòng việc, thẻ) không đổi ở PR này — chỉ đầu panel (danh sách: session khuon-a-danh-sach).
