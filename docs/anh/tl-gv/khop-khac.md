# TL-GV — tỉ lệ GV theo tuần khi bấm điểm thi thật (mockup `thiet-ke/v20/ti-le-gv.html`, chủ SP duyệt #1496, XM-1…9 PTA chốt 12/11)

Ảnh cặp (trái mockup · phải web, demo 14/09, QL Nguyễn Khánh Vy — vai 2, em Đoàn Khánh Chi lộ trình 75 MB FT 101, KQ thi thật nhập 12/09 qua API):
`cap-1440-toi-ho-so.png` (bấm R) · `cap-1440-toi-ho-so-w.png` (W → W1 + W2, ⓘ mở) · `cap-1440-toi-phan-tich.png` (Danh sách, bấm W) ·
`cap-1440-toi-panel-o.png` (panel ô Từng kỹ năng, bấm S) · `cap-1440-toi-tong-ket.png` (Tổng kết lộ trình, bấm S) · `cap-1440-toi-nhap-kq.png` (panel KQ, "Tuần dạy") ·
`cap-375-toi.png` (sheet R) · `cap-1440-sang.png`.
Dữ liệu demo: phân công lớp bắt đầu 01/06, lộ trình 27/04 → 5 tuần "Chưa phân công"; thêm một phân công R 03/08–09/08 cho GV khác để thấy tuần dạy chung (0,5). Tên / số tuần khác mockup là do dữ liệu.

## 1. Truy vết khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | 0 · ô điểm kỹ năng thi thật = hộp (dáng `.os` v19), màu chữ so Target, rê gạch chân, mở = viền 2 px | `.o-diem-thi` (`index.css`) + `OTuanDay` (`ui/TuanDayGv.tsx`) | mọi ảnh | KHỚP (giữ "✓ / ✗" trước số như `DiemKq` / `ODiem` của web — KHÁC-1) |
| 2 | 1 · hộp: tiêu đề kỹ năng + điểm + "thi thật dd/mm" · tên em · ✕ | `NoiDung` `.tg-dau` | cap-1440-toi-ho-so | KHỚP |
| 3 | 1 · hàng L R W S chuyển kỹ năng trong hộp | `.tg-chuyen` | cap-1440-toi-ho-so-w | KHỚP |
| 4 | 1 · "Tuần dạy W… → W… · n tuần" + ⓘ, bấm ⓘ → giải thích trong hộp (1i) | `.tg-khoang`, `.tg-giai` | cap-1440-toi-ho-so-w | KHỚP |
| 5 | 1b · dòng lớp khi chuyển lớp "Lớp A · n tuần → B · m tuần" | `.tg-lop1` (chỉ khi > 1 lớp) | — (demo không có em chuyển lớp có thi thật) | KHỚP (mã + phép kiểm máy chủ) |
| 6 | 1 · dòng GV: tên · lớp · thanh · "x/n tuần" · % ; GV nhiều tuần nhất nền nhạt + viền + đậm | `.tg-dong` / `.cao` | cap-1440-toi-ho-so · cap-375-toi | KHỚP |
| 7 | 1b · tuần dạy chung chia đôi "14,5 / 0,5", phụ "chung W…" ; % cộng 100 | máy chủ `tuanDay.ts` (1/k) + `phanTramTron` | cap-375-toi (73 + 2 + 25) | KHỚP |
| 8 | 1b · "Chưa phân công" viền đứt, thanh gạch chéo | `.tg-dong.trong` | cap-1440-toi-ho-so | KHỚP |
| 9 | 1c · W → hai nhóm W1 · Writing Task 1 / W2 · Writing Task 2, mỗi nhóm % riêng | `nhom` | cap-1440-toi-ho-so-w · cap-1440-toi-phan-tich | KHỚP |
| 10 | 1d · bằng nhau → cả hai nổi | `g.tuan === max` | — | KHỚP (mã) |
| 11 | 1e · chưa có phân công cả khoảng + "Phân công <lớp> ›" chỉ QL / QT | `.tg-rong` + `.tg-chan` (`phanCong` từ máy chủ, `class.assign`) | cap-1440-toi-ho-so (chân "Sửa ở hồ sơ lớp") | KHỚP (chân hiện cả khi CÒN tuần trống — KHÁC-2) |
| 12 | 1f đang tải (khung xương + "Đang tải tuần dạy…") · 1g lỗi + Thử lại | `.tg-skel`, `.tg-loi` | — | KHỚP (mã) |
| 13 | 1h · tóm tắt 5 kỹ năng (nơi chỉ có OVR / panel nhập KQ), bấm dòng → chi tiết trong hộp | `.tg-kn` | cap-1440-toi-nhap-kq | KHỚP |
| 14 | 2a · hồ sơ HV khung web thật, bảng MT L · R · W1 · W2 · S, hàng Thi thật ô W trải W1 + W2 | `StudentDetailPage` `IeltsAttempts` (giữ), `oThi` | cap-1440-toi-ho-so | KHỚP (hộp mở LÊN khi dưới không đủ chỗ — luật lật của `HopNeo`) |
| 15 | 2 · XM-9 ô điểm to đầu hồ sơ giữ bấm = chọn kỹ năng | `DiemDau` không đổi | cap-1440-toi-ho-so | KHỚP |
| 16 | 3a · Phân tích › Thi thật › Danh sách | `KetQuaThi.tsx` `diem` | cap-1440-toi-phan-tich | KHỚP |
| 17 | 3 · panel ô (Theo GV, Từng kỹ năng, Tổng…) cùng ô + hộp | `BangLuotPanel` kiểu thi-that `oDiemH` | cap-1440-toi-panel-o | KHỚP |
| 18 | 3 · panel thi thật dạng dòng điểm (Phân tích GV / hồ sơ GV "Kết quả thi thật", ô Kết quả thi) | `SoLieu` `DongDiem` (`diemHv.thiThat`) | — (chưa bấm thử) | KHỚP (mã) |
| 19 | 3b · tên GV dưới mỗi điểm | — | — | BỎ (PTA chốt XM-2 không làm) |
| 20 | 4a · Tổng kết lộ trình: L R W S thành hộp | `NganTongKet` | cap-1440-toi-tong-ket | KHỚP (web giữ dòng nhỏ dưới OVR, không ô lớn — KHÁC-3) |
| 21 | 4b · panel KQ thi thật: nút chữ "Tuần dạy" cạnh OVR khi đã lưu | `KetQuaThiThatPanel` | cap-1440-toi-nhap-kq | KHỚP |
| 22 | 4c · hồ sơ lớp › Tổng kết: OVR thi thật = hộp → tóm tắt | `TabTongKetLop` (1440 bảng + 375 thẻ) | — (demo: lớp chưa có hàng thi thật ở tab Tổng kết) | KHỚP (mã) |
| 23 | 5 · 375 sheet dưới, nền mờ, vùng bấm 44 px, ✕ 44 px | `Sheet` + `.hop-tuan-day.sheet` | cap-375-toi | KHỚP |
| 24 | 6 · sáng | token sẵn có | cap-1440-sang | KHỚP |

24 / 24 dòng KHỚP hoặc BỎ có lý do → ≥ 90 %.

## 2. KHÁC (có lý do)

- **KHÁC-1** Số trong ô có "✓ / ✗" trước như mọi ô điểm của web (`DiemKq`, `ODiem` — chủ SP 04/11); mockup chỉ tô màu. Giữ để nhất quán (một khái niệm một dáng).
- **KHÁC-2** Chân "Sửa ở hồ sơ lớp · Phân công <lớp> ›" hiện cả khi CÒN tuần trống (mockup chỉ vẽ ở 1e). Cùng việc sửa, cùng quyền; QL thấy ngay chỗ thiếu. Một chân cho cả hộp W.
- **KHÁC-3** Tổng kết lộ trình web không có ô điểm lớn L R W S (mockup 4a vẽ ô lớn); web giữ bố cục ngăn hiện có (OVR lớn + dòng L R W S) — chỉ đổi điểm thành hộp, không đổi bố cục ngăn (PR này không phải PR đổi bố cục ngăn).

## 3. Thao tác TRƯỚC → SAU

| Việc | TRƯỚC | SAU |
|---|---|---|
| Biết GV nào dạy em kỹ năng X tới lúc thi | không có trên web | bấm điểm X ở mọi nơi → hộp (1 bấm, không đổi trang) |
| Xem kỹ năng khác | — | hàng L R W S trong hộp, 0 request thêm |
| Sửa phân công còn trống (QL / QT) | vào lớp › phân công | link trong hộp → `/hoc-vien/lop/<id>?viec=phan-cong` |
| Nhập / sửa KQ thi thật, Bước tiếp, Xuất Excel, + Case, ⋯, link tên / lớp, ô điểm to chọn kỹ năng | như cũ | **giữ nguyên** — không mất thao tác |
| Theo GV (Phân tích, hồ sơ GV) | tuần dạy chung tính trọn mỗi GV | chia đều (1/k) — cùng hàm với hộp (XM-7) |

## 4. Turso

- Mở trang: +0 câu, +0 dòng. Bấm lần đầu một lần thi: GET `/cycles/:id/tuan-day` — đo 9 câu (QL) · 6 (QT) · 10 (GV) gồm phiên; 11 dòng.
  Trần ở `tocDoDuong.ts`: câu 19 / 16 / 20 / 20, dòng 61. Bấm kỹ năng khác / mở lại trong 10 s: 0 request (`useApi` nhớ).
- Theo GV: không thêm câu (cùng 2 câu ghi danh + phân công như trước).
