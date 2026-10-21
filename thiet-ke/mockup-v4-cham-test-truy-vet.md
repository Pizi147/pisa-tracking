# Truy vết — `mockup-v4-cham-test.html` (M5a · Chấm Test theo hạn) · 21/10/2026

Mockup: [`mockup-v4-cham-test.html`](mockup-v4-cham-test.html) · ảnh: `anh/mockup-v4-cham-test-<khung>.png` (k1–k7 = 1440 tối; a–f = 375 sáng).
Nguồn: 02 mục 2.9 (21/10-SCHEO, 21/10-L4, Q-C1) · 05 mục 3.1–3.6, 4.4, 4.5 · 04 mục 2, 5, 6, 7, 8, 9.2, 12, 15, 16 · 07 M5 · 06 mục 4 (M5a).
Trạng thái: **chờ chủ SP duyệt (Q-C1)**. Khi duyệt, khung này thay ba khối Lịch Test 06/10.

## 1. Quyết định → khung → thành phần

| Mã (02 / 05 / 04) | Nội dung | Khung | Thành phần (tên theo 04) |
|---|---|---|---|
| Q-C1 (05 3.2 B-1) | Một hàm nhãn bài chấm "MT2 · thi W2 SEP · hạn 16/09" cho hàng · đầu khung · hộp · việc | k1–k6, a–f | `tenBaiCham` (MỚI, hàm chữ) · `DauViec` |
| Q-C1 (05 3.2 B-2) | Gom theo hạn, giữ chia khối T15: "Quá hạn chấm" · "Hạn 16/09 · bài thi W2 SEP" · "Bài thi tuần này W3 SEP" (chỉ khi có ô của tôi) | k1, k2, k4, a | `HangDoiViec` nhóm cố định · hàng nhóm 40 px |
| Q-C1 (05 3.2 B-2) | Không dải số, không bộ chọn tuần, không công tắc FT / LT ở chỗ chấm; link "Lịch tuần khác ›" | k1–k4, k7, a | link chữ "›" (04 8.2) |
| Q-C1 (05 3.2 B-3) | Một nguồn với Công việc › Chấm điểm: cùng dòng, cùng số (số trên tab = số ở Công việc) | k1, k2 | máy chủ gộp `gomBaiChuaCham` + `lichTest` (07 SV-M5) |
| Q-C1 (05 3.2 B-4) | Lưới gọn: chỉ cột + ô của tôi; "Chỉ ô còn trống · n" / "Cả lớp · n" | k1–k5, b | `Bang` + `ODiem sua` · `BoLocDoan` |
| Q-C1 (05 3.2 B-5) · m2 1e | Tự sang việc kế khi xong; dòng xong mờ + gạch + "✓ Xong · Hoàn tác" | k2 | HTT-11 · toast Hoàn tác |
| Q-C1 (05 3.2 B-6) · HTT-9 | Rỗng dạy luật một câu; lỗi tải chỉ che vùng, giữ đầu trang + tab | k7 | `Rong` · lỗi vùng |
| Q-A2 ① · 04 3, 15 | Bố cục B: danh sách trái 540 px · khung chi tiết phải; chọn sẵn dòng đầu khi là việc của chính tôi | k1–k5 | `HangDoiViec` · vỏ "Khung việc" bậc 3 |
| 21/10-SCHEO (05 3.4) | Nhóm "Chấm Speaking chéo · n bài · không tính nợ" cho mọi GV có kỹ năng S, kể cả không dạy lớp nào; phạm vi chi nhánh; người chấm mặc định = chính GV | k5, f | như trên + dòng "Người chấm" |
| 05 3.3 · 04 7 | Hộp chấm một mẫu FT: đầu "W2 · {em}" + "MT3 · thi W2 SEP · hạn 16/09"; tiêu chí → band (không tô, ▼ dưới kỳ vọng); nhận xét ≥ 10 + nhóm nguyên nhân khi dưới kỳ vọng; chân Vắng · Thêm ▾ · Lưu · **Lưu · em tiếp** | k3, c | `HopCham` (MỚI — thay `HopNhapDiem` + `ODiemThuong`) |
| V3 I.2 · 05 3.3 A · X-02 | Hộp chấm lớp thường: "Đúng [17] / [25] · 68 % · chưa đạt (cần 70 %)" · **Nhận xét (tuỳ chọn)** trong hộp; 375 ô gõ thẳng + "＋ Nhận xét" dưới hàng | k4, d | `HopCham` · `ODiem ti-le` |
| 04 5.2 · X-33 | Ô lớp thường "✗ 17/25": ký hiệu → số đúng 15/700 tô màu → "/25" mờ; không % trong ô | k4, d | `ODiem ti-le` |
| 04 5.1, 5.2 · V1 I.3 | Tô chính con số `--kq-*` + ✓ / ✗ TRƯỚC số; KCK trung tính; ô đang gõ không tô | k1–k6 | `ODiem` |
| HTT-10 · 04 7 | Ô: đang lưu = đồng hồ xám · đã lưu = dấu lưu xám (không ✓ xanh) · lỗi = viền đỏ + "Lưu lại"; chân: "⚠ 1 ô chưa lưu được — mất kết nối · Thử lại" | k2 | `TrangThaiLuu` |
| 21/10-L4 · 05 4.4 | Nút hộp luôn "Vắng"; gõ "-" ở MT hiện tại → máy dời tuần kế, dòng phụ "vắng · dời W3 SEP", toast Hoàn tác 10 s | k2, b, c | một hàm "-" |
| 05 4.5 · L3 | Huỷ điểm cất điểm: ô "đã huỷ 15/25"; toast Hoàn tác; sau 10 s: Thêm ▾ › Khôi phục điểm (người sửa được ô) | k4, d | `HopCham` Thêm ▾ |
| 05 3.6 (b) · 12.9-11 | QL / QT / Admin VP: tab "Tình trạng chấm" — Lớp · Bài · Tuần thi · Đủ điểm · Còn ô · Ai còn nợ (theo kỹ năng, S "chấm chéo") · Hạn; quá hạn trước; trong `Khoảng tuần` (4 tuần thi gần nhất); bấm hàng → lưới lượt mở dưới hàng (2b), QL nhập hộ, ô S phải chọn người chấm | k6, e | `Bang` · `OSo` · mở dưới hàng · `Khoảng tuần` |
| 9.1-4 · 04 15 | Đầu trang một hàng: tiêu đề = tên menu "Test" · Chi nhánh ▾ · Chương trình · Thời gian (QL) | k1–k7 | khung trang M0 |
| 04 2.2 | Thang 12 · 13 · 14 · 15 · 17 · 22 | mọi khung | token chữ |
| 04 15, 16 | Thanh dưới 375: GV 3 nút; QL 5 nút ("Thêm" gom Phân tích + Tutor); chi tiết toàn màn + "‹ Chấm Test"; nút chính dính đáy; ô 44 px, chữ ô nhập 16 | a–f | khung 375 |

## 2. GIỮ

| Giữ | Ở đâu |
|---|---|
| Luật chấm: mở ô từ T2 tuần thi của kỹ năng, hạn T4 tuần kế, chia khối T15, S chấm chéo T18 (không tính nợ GVBM S / GVCN; người chấm muộn bị tính trễ) | k1–k6 |
| Nhận xét MT bắt buộc ≥ 10 ký tự + nhóm nguyên nhân khi dưới kỳ vọng; lớp thường tuỳ chọn | k3, k4 |
| Excel chỉ ở hồ sơ lớp › Điểm Test (lớp × lượt) — không ở Chấm Test, ẩn ở 375 | (không vẽ ở đây) |
| MT cũ: không nợ / không hạn → không vào Chấm Test; "-" ở MT cũ = huỷ ngay + Hoàn tác 10 s → vẽ ở M5 (hộp một đợt) | (M5) |
| Kế hoạch Test (tab, chip mới) | (M5) |

## 3. BỎ (web hiện tại — session code phải xoá)

| Bỏ | Tệp hiện tại (tham khảo) |
|---|---|
| Ba khối "Test quá hạn chấm · Test chấm tuần này · Lịch Test tuần này" + mở / thu mặc định | `web/src/modules/test/LichTestTab.tsx`, `test/lichTest/*` |
| Dải 3 ô số ("Tuần này đã chấm …", "Còn phải chấm …", "Quá hạn chấm …") | `LichTestTab.tsx` |
| Bộ chọn tuần + công tắc FT / Lớp thường + "Tất cả / Của tôi" ở chỗ chấm (Lịch tuần giữ, chỉ xem) | `LichTestTab.tsx` |
| Nhãn "GV khác"; ô S Mock đếm vào "quá hạn" của người xem ở phạm vi Tất cả | `test/lichTest/HangLop.tsx:28-31` |
| Lưới đủ 10 cột cho GV chỉ có một cột (lối Lịch Test không truyền `chiCot`) | `LuoiChamLop` |
| Lớp thường: nút "Nhận xét" trước ô, ⋯ trong ô, hộp "Sửa … Lý do" riêng, "tổng [25] Điền cả cột" trong tiêu đề, dòng "Đạt · 80%" + chip "Đã hoàn tất" dưới tên | `fasttrack/ScoreEntry.tsx`, `cham/LuoiThuong.tsx` |
| Chữ nút "Không dự thi" (→ "Vắng"); "✓ Đã lưu" xanh lá trong ô | `chuNutVang`, `HopNhapDiem.tsx` |
| Trang `/nhap-diem`, `/bang-diem-thuong` (route chuyển hướng) | router |
| Tab "Lịch Test / Chấm Test" (tên cũ) | `shared/domain/dieuHuong.ts:93` |

## 4. Đích đo (K2)

| Khung | Đích |
|---|---|
| k1 | dòng việc đầu y ≤ 200 px; 0 dải số; khung nhìn đầu ≤ 30 phần tử bấm được; bài quá hạn đầu: gõ ngay (0 bấm) |
| k1–k3 | Cô Linh chấm hết bài đến hạn + quá hạn 2 lớp: ~11 bấm → 1–2 bấm, 0 đổi trang |
| k5 | GV S chấm chéo: 5 → 2 bấm |
| k4 | 3 em lớp thường có nhận xét: ~8 bấm · 4 hộp → 1–2 bấm · 1 hộp |
| k6 | QL "MB FT 101 MT2 đủ chưa, ai nợ": 3–6 bấm → 1 bấm, 0 đổi trang |
| mọi khung | không chữ < 12; ô bảng 15 (lưới > 8 cột 14); đầu cột 13 không in hoa; tiêu đề ↔ ô cùng `data-kieu` (lệch ≤ 2 px) |

## 5. Cần chủ SP chọn

1. Duyệt hướng "Chấm Test theo hạn, một nguồn" (Q-C1) — thay ba khối 06/10.
2. Tên tab: GV "Chấm Test · Lịch tuần"; QL / QT / Admin VP "Tình trạng chấm · Kế hoạch Test · Lịch tuần".
3. Hai khung (danh sách trái · lưới phải) thay lưới mở dưới dòng.
4. Cột "Nhận xét" (xem nhanh) trong lưới gọn — giữ hay bỏ.

## 6. Seed cần thêm (SEED-UX)

- Một GV có kỹ năng S, không dạy lớp nào ("Đoàn Minh Thư", chi nhánh MB + BC).
- MB FT 101 MT3 W2 SEP: ô có / trống / "-" vắng dời W3 SEP; MB FOU 15 Progress W2 SEP có một ô đã huỷ điểm.
