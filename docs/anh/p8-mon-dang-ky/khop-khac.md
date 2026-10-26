# P8 MON-DANG-KY — bảng truy vết KHUNG → THÀNH PHẦN → ẢNH (KHỚP / KHÁC / BỎ / GIỮ)

Nguồn: mockup ĐÃ DUYỆT `thiet-ke/v6/lo-trinh-moi.html` khung k1, k4–k7 + `lo-trinh-moi-truy-vet.md` · luật `plan.md` 1.6 N13, N22 ④ (chỉ FT).
Demo: ngày 14/09/2026. Ảnh cặp `k{n}-1440.png` (tối) / `k{n}-375.png` (sáng) = khung mockup (trái) | web (phải).

- k1 · Đinh Ngọc Quyên (CP FT 110, TVV Nguyễn Thu Hương) — Bước tiếp › Lộ trình mới.
- k4, k5 · Lê Quang Huy / MB FT 101 (QL Nguyễn Khánh Vy) — panel Sửa thông tin tắt W1 (chưa lưu); Sửa cả lớp chọn 2 em, tắt S, Áp cho 2 em.
- k6, k7 · CP FT 110 (Quản trị) — seed cho **Lý Tuấn Bình chỉ học W2**, **Bùi Thu Ninh không học S**; điểm MT4 L 6.0 · R 5.5 · W2 6.0 · S 6.0 của Bình ghi thẳng vào DB chụp ảnh (không có trong seed) để thấy W = W2 + Overall "Không đủ bộ môn".

| Khung | Thành phần mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| k1 | Bước "1 Lộ trình" LT1 · LT2 · RF · Khác (LT2 chọn sẵn) | `PanelLoTrinhMoi` (P7) | k1-1440, k1-375 | GIỮ (P7) |
| k1 | Bước **"2 Môn học"** 5 nút bật L R W1 W2 S, mặc định môn lộ trình cũ | `NutMon` (`aria-pressed`, môn tắt gạch ngang) · mặc định từ `xemTruocLoTrinhMoi().monDangKy` | k1-1440, k1-375 | KHỚP |
| k1 | 3 Target giữ + Sửa · 4 Bắt đầu · 5 Lớp | như P7 | k1 | GIỮ (P7) |
| k1 | "Khi lưu, web sẽ" dòng đầu "… từ 14/09 · đủ 5 môn · Target 6.5" | máy chủ dựng (`docLoTrinhMoi` → "đủ 5 môn" / "chỉ S" / "L · R · W2 · S") | k1 | KHỚP |
| k1 | Nút chính "Mở lộ trình LT2", chân "● Chưa lưu" | như P7 | k1 | KHỚP |
| k4 | Hàng **"Môn học · FT LT1"** dưới Target | `StudentManagePanel` › khối Lộ trình đang học, sau Target | k4-1440, k4-375 | KHỚP |
| k4 | Khối vàng "Khi lưu, web sẽ": Bỏ W1 khỏi MT3 (chưa có điểm) · MT1, MT2 đã chấm giữ · Đóng Case W1 — Không còn học môn · Writing = W2 · Overall: Không đủ bộ môn | `POST /cycles/:id/mon-dang-ky {xemTruoc}` — máy chủ dựng các dòng (`apMonDangKy().dong`); dòng "Đóng Case" chỉ khi có Case mở của môn bỏ (Huy không có Case W1) | k4 | KHỚP |
| k4 | "Lịch sử (1)" trong panel | Lịch sử sửa ở ⋯ › Lịch sử sửa (dòng "Môn học: Đủ môn → L · R · W2 · S") | — (test MDK-4a) | GIỮ (V4: panel Sửa thông tin không có khối Lịch sử) |
| k4 | Panel 3 trường (Họ tên, Target, Môn học) | Panel giữ đủ trường cũ (Ngày sinh, Email, TVV, Liên hệ, Tuần bắt đầu, Dự kiến thi, Điểm đầu vào) | k4 | GIỮ (V4) |
| k5 | Cột **Môn học**, nút nhỏ trong ô (không trong tiêu đề) | cột thứ hai (sau Họ và tên), `NutMon nho`; em lộ trình không FT: "Chỉ lộ trình FT" | k5-1440, k5-375 | KHỚP |
| k5 | Thanh chọn "n em đã chọn · Môn học [5 nút] · Áp cho n em · Bỏ chọn" | thanh trên bảng + ô chọn đầu dòng (chỉ em FT) | k5 | KHỚP |
| k5 | Ô "Chọn tất cả" trong tiêu đề bảng | nút "Chọn tất cả · n" ở thanh chọn | k5 | **KHÁC** — luật V5 cấm điều khiển trong tiêu đề bảng; mẫu `PanelXetLai` (P9a) |
| k5 | Ô đã sửa tô + "đã sửa", chân "1 em đã sửa · {tên} bỏ W1: … · Lưu 1 em" | tô ô + ↺ (sẵn có), cột Lưu ý = dòng tóm tắt từng em, chân = tóm tắt em đầu "+n em", nút "Lưu n em" | k5 | KHỚP |
| k5 | Cột Target, Ghi chú | giữ đủ cột cũ của panel | k5 | GIỮ |
| k6 | Ô **"Không học"** nghiêng, nhạt, nền sọc; không nhận gõ | `OKhongHoc` (`.o-khong-hoc`), `ODiemMt` không vẽ nút khi `cell.khongHoc` (máy chủ `skillCells`) | k6-1440, k6-375 | KHỚP |
| k6 | Chú giải ở hàng công cụ "- vắng · Không học · — chưa có điểm" | `ChuGiaiKhongHoc` (chỉ khi lưới có ô Không học) — cả dạng bảng và dạng thẻ 375 | k6 | KHỚP |
| k6 | Overall "– Không đủ bộ môn" (viền đứt, như Chưa đủ dữ liệu) | `NhanKq kq="thieu"` khi lượt đủ điểm môn đã học mà thiếu bộ môn; còn thiếu điểm → "—" | k6 | KHỚP |
| k6 | "-" vắng giữ như cũ, cột giữ đủ 5 môn | không đổi | k6 | KHỚP |
| k6 | Dữ liệu MB FT 101 / Lê Quang Huy | CP FT 110 / Lý Tuấn Bình, Bùi Thu Ninh | k6 | KHÁC (dữ liệu, không bố cục) — lượt W3 SEP MB FT 101 là lượt "sạch" mà ~10 phép kiểm cũ dựng tình huống trên đó |
| k7 | Dòng đầu "Môn học L · R · W2 · S" (chỉ khi thiếu môn) | `DongThongTin mon` = `cycle.monHoc` | k7-1440, k7-375 | KHỚP |
| k7 | Chỉ vẽ môn em học (ẩn W1), W = W2 | `DiemDau mon` lọc ô; Writing = W2 ở máy chủ (`writingBand(…, boTask)`) | k7 | KHỚP |
| k7 | Badge "– MT3 · Không đủ bộ môn" cạnh tên | `NhanKq` "– MT{n} · Không đủ bộ môn" cạnh tên (chỉ em thiếu môn, lượt kết quả gần nhất không Overall) + cùng nhãn ở ô Overall | k7 | KHỚP (mockup V6 25/10 mới hơn UI-HO-SO-HV) |
| k7 | Tab W dạng bảng lượt (W2 · W · KV) | Hành trình kỹ năng dạng biểu đồ + bảng hiện có | k7 | GIỮ (UI-HO-SO-HV) |

Thành phần mockup có so (bỏ GIỮ): 16 — **KHỚP 15 · KHÁC 1 bố cục (Chọn tất cả) → 94 % KHỚP.** KHÁC dữ liệu demo (k6/k7 ở CP FT 110) không đổi bố cục, ghi riêng.

## Thao tác TRƯỚC → SAU PR

| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| Bỏ riêng W1 / W2 | không làm được (phạm vi lượt chỉ QL, Writing một dòng) | ⋯ › Sửa thông tin › tắt W1 › Lưu (4 bấm) | N13 Q4 |
| Em không học S | QL "Huỷ kỹ năng" từng lượt | Sửa thông tin / Sửa cả lớp › tắt S (mọi MT chưa thi + MT sinh sau) | N13 |
| Cả lớp không học S | — | Sửa cả lớp › Chọn tất cả › tắt S › Áp › Lưu (5) | k5 |
| Đổi môn khi đã có điểm | — | cùng 4 bấm; tóm tắt: bài bỏ khỏi đợt, bài giữ, Case đóng | Q5 |
| Môn học lộ trình mới | không chọn | bước 2 panel Lộ trình mới (mặc định môn cũ) | N13 |
| Nhập điểm ô môn không học | nhập được | ô "Không học", máy chủ 400 | N13 |
| GIỮ — Lộ trình mới | Hoàn tác Bước tiếp, Huỷ hẹn, Gia hạn, Target giữ + Sửa, Lớp khác, Lịch sử | như cũ | P7 |
| GIỮ — Sửa thông tin | mọi trường + Đề xuất sửa (GVCN), KCK, Điểm đầu vào | như cũ | V4 |
| GIỮ — Sửa cả lớp | mọi cột, ↺ từng ô, xem trước 400 ms, lưu theo lô "Đã lưu n · m em chưa lưu", hỏi khi đóng | như cũ | V4 |
| GIỮ — Huỷ kỹ năng / Đưa lại (QL) | ⋯ lượt | như cũ (đổi môn dùng lại `setSkillScope`) | — |

Không có thao tác nào bị bỏ.

## Sửa theo rà PTA Plan (#595, 26/10)

- k1, k4, k5: nút Môn học ghi "✓ L" — dấu ✓ nằm TRONG nút như mockup (trước: huy hiệu tròn đè góc). Môn tắt gạch ngang.
- k4: khối "Khi lưu, web sẽ" nền + viền cảnh báo vàng (`--soon-bg` / `--soon-line`, cùng `.tom-tat.vang` mockup).
- k5: dòng đã chọn nền nhấn + vạch trái + ô tick (chụp lại với 2 em đầu bảng được chọn); cột Môn học rộng đủ 5 nút một hàng.
- k7: ô kỹ năng đã có điểm của môn đã bỏ vẫn hiện (chỉ ẩn ô chưa có điểm); nhãn "Không đủ bộ môn" đọc cờ máy chủ.
- Quyền (chủ SP 26/10 đêm): QL, Quản trị, GVCN, TVV đổi Môn học ở cả 3 nơi; CX, GV bộ môn không.
