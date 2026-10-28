# LUOT-TEN-GV — tên GV ở việc của người khác + dòng "Lịch" nhiều tuần (mockup `thiet-ke/v7/ho-so-luot-test.html`)

Hai việc "Để sau" của HSL-FT (#638, [XM] 2) và HSL-LT (#653, dòng 22 + P2 "Lịch"). Ảnh cặp mockup | web cùng giao diện (1440: mockup `?theme=dark` | web tối; 375: `?theme=light` | web sáng; DB demo cục bộ, ngày demo 14/09):
`cap-thuong-1440-toi.png` + `cap-thuong-375-sang.png` (GVCN Trần Ngọc Hà — vai 7, MB FOU 12, Progress Test Âu Nhật Nam: L, R của tôi; G+V Lê Minh Khoa, P Phạm Thu Trang),
`cap-ft-1440-toi.png` + `cap-ft-375-sang.png` (vai 7, MB FT 101, MT3 Lê Quang Huy: W1 / W2 hai GV, S chấm chéo). Dữ liệu demo khác mockup (em, tuần, quá hạn) — so khung, không so số.

## Khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Còn lại: việc người khác `.viec.khac` "G+V chờ điểm · Phạm Thu Trang" (viền đứt, cao 30, chữ 13 / 500 màu text-dim, nhãn môn màu nhấn) | `ConLaiLuot` (chung FT / LT) — `ai` = `tenNguoiLam(nguoiLam, ô)`; chip cao 30, nền `--surface`, viền đứt mảnh `--line-strong`, chữ 13 / 500 text-dim (`slate-400`), nhãn môn `--accent` (như `.viec b` — nút việc của tôi cũng đổi sang `--accent`), một dấu cách giữa các mẩu; "⚠ Quá hạn" của người khác cùng màu text-dim (không đỏ). Tên không cắt: mỗi mẩu dấu cách không ngắt, hẹp thì xuống dòng giữa các mẩu | KHỚP |
| 2 | Cột Trạng thái: chip + `<small>` tên (12 px, text-faint) | dòng `text-xs text-slate-500` dưới chip / hạn — chỉ khi môn còn nợ mà người xem không nhập được; LT: "⚠ Quá hạn" của môn người khác chữ mờ (đỏ chỉ khi là việc của người xem) | KHỚP |
| 2b | (mockup không vẽ) ô Reading có chữ gợi ý "tổng", Listening không | luật có sẵn của `ODiemThuong` (chung lưới lớp): ô mang "-" (vắng) thì ô tổng tắt, không cần tổng — không phải lỗi | GIỮ |
| 3 | Việc của tôi = nút (không tên) | giữ — nút mở dòng + focus ô | KHỚP |
| 4 | "P thi W4 SEP · Phạm Thu Trang" (môn đã dời bằng "-") | "P Làm bài W4 SEP · Phạm Thu Trang" (cùng chữ với cột Trạng thái) | KHỚP |
| 5 | Chữ "chờ điểm" thường | "Chờ điểm" — cùng một tên với chip cột Trạng thái (luật một khái niệm một tên; FT đã duyệt chữ này ở #638) | KHÁC chấp nhận |
| 6 | (FT) Writing hai ô W1 / W2 | hai GV → "Lê Minh Khoa, Cao Khánh Linh"; một ô còn nợ → chỉ người của ô đó | KHỚP (mockup không vẽ, theo luật phân công FT) |
| 7 | (FT) Speaking Mock | "GV chấm chéo" (cùng `pendingOwners` của danh sách lượt — T18) | KHỚP |
| 8 | Môn chưa phân công | "Chưa phân công" (không giấu nợ — PR-UXF-a Q8) | KHỚP (mockup không vẽ) |
| 9 | Dòng "Lịch" (mockup một tuần `W3 SEP`) | một tuần → như cũ; nhiều tuần → nhóm theo tuần, tuần sớm trước: "**W3 AUG** R, G+V, P · **W3 SEP** L" (dấu "·" mờ giữa nhóm) (tuần 600, môn 12 px / 500 text-faint như `.tt dd small`), mỗi nhóm `whitespace-nowrap`, xuống dòng chỉ giữa các nhóm — 1440 và 375 đều một hàng | KHỚP |

**Cổng:** KHỚP 8/9, 1 KHÁC chấp nhận (chữ hoa "Chờ điểm") → 9/9.
**impeccable critique:** 29/40 (2 P1: tên bị cắt ở 375, nhóm tuần sát nhau) → 31 → 34 (chip sát `.viec.khac`, ảnh cùng giao diện) → **35/40**, 0 P0 / 0 P1; detector 0 phát hiện. Còn P2: FT hạn ở cột Trạng thái là `DeadlinePill` dùng chung nhiều màn — quá hạn môn người khác vẫn đỏ (để PR sau); P3: "Chưa phân công" cùng kiểu chữ với tên. web-design-guidelines: phần diff đạt.

## Thao tác TRƯỚC → SAU

| Trước PR | Sau PR |
|---|---|
| Còn lại: việc của tôi = nút; việc người khác "G+V Chờ điểm" không tên | Giữ nút; việc người khác thêm tên GV môn ("· Lê Minh Khoa"), FT S "· GV chấm chéo", chưa phân công "· Chưa phân công" |
| FT "Chờ nhận xét" (người khác) không tên | thêm tên người của ô thiếu nhận xét |
| Cột Trạng thái: chip + hạn | chip + hạn + tên người giữ việc (chỉ khi người xem không nhập được) |
| Lịch nhiều tuần: "L: W3 SEP · R, G+V, P: W3 AUG" (theo thứ tự môn, dễ xuống dòng giữa chừng) | "W3 AUG R, G+V, P · W3 SEP L" (theo tuần, tuần sớm trước) |

Không bỏ thao tác nào; không thêm nút.

## Ghi chú mã
- Máy chủ: `GET /attempts/:id` + `GET /regular/attempts/:id` trả `nguoiLam` (ô → tên | "GV chấm chéo" | null). Cùng hàm `nguoiLamMon` với `pendingOwners` của danh sách lượt (tách từ `ownersOf`), phân công `phanCongDangHieuLuc` của lớp lúc Test. FT theo ô nhập (W1 / W2 riêng — phân công FT ghi `writing1` / `writing2`).
- Web: `tenNguoiLam` (MockDetailPage, dùng chung LT).
- Phép kiểm: `prLuotTenGv` LTGV-1 (FT: tên thật L/R/W1/W2, S chấm chéo, gỡ phân công W2 → null), LTGV-2 (lớp thường: đủ môn, tên thật).
