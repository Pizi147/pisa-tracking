# HD-V2 PR (a) — khớp / khác mockup v14

Mockup đã duyệt: `thiet-ke/v14/huong-dan.html` (ảnh `thiet-ke/v14/anh/`). Ảnh cặp (trái mockup | phải web, cùng khung nhìn): thư mục này, `<khung>.png`; ảnh web riêng `<khung>-web.png`.
Phông: `document.fonts.check('600 15px "Be Vietnam Pro"')` = true ở mọi ảnh. Dữ liệu demo (seed 14/09/2026), GV = cô Trần Ngọc Hà (id 7, GVCN + có S), F1 = cô Phạm Thu Trang (id 9).

## 1. Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết luận |
|---|---|---|---|
| F0 · "?" trái chuông, tròn, chấm trắng khi chưa mở | `Header.tsx` nút `data-hd="nut-hd"` | f0-1440-toi | KHỚP |
| F1 · 375, "?" 44 px, chấm | như trên (`min-h/w-[44px]`, chấm lệch theo cỡ) | f1-375-sang | KHỚP |
| F3 · menu Tài khoản không còn "Hướng dẫn", còn "Đã xoá" | `Header.tsx` (bỏ nút; "Đã xoá" #1001 giữ) | — (đọc mã) | KHỚP |
| A1 · panel 480: đầu "Hướng dẫn" + chip vai + ✕, ô tìm, 3 tab gạch chân | `NutHuongDan.tsx` trên `KhungPanel` (`anDau`, `longTrong`, `tabs`) | a1-1440-toi, a1-375-sang | KHỚP |
| A1 · Bạn đang ở + Trước / Sau | `BanDangO` | a1 | KHỚP |
| A1 · Việc làm ở đây, việc đầu mở, ô Lối chính + "Ở đây mở cùng ô điểm" | `DongViec kieu="man"` từ `viecOManNay` (sinh từ `loiTat`) | a1 | KHỚP |
| A1 · nhãn "Chỉ GVCN" | `DongViec` (cờ `chiGvcn`) | a1 | KHỚP |
| A1 · Không làm ở đây (link / "việc của QL") | `KhongLam` | a1 (cuộn) | KHỚP |
| B · Case đang mở → "?": mục Case trước, màn nền sau, chữ đang gõ còn | `KhungPanel hd="case"` + `panelHdTren()`; `longTrong` | b-1440-toi, b-375-sang | KHỚP (xem khác 1, 2) |
| C · đang tìm: không tab chọn, "n việc khớp", nhóm, chữ khớp tô hồng, Lối tắt | `KetQuaTim`, `timHd`, `ToKhop` | c-1440-toi, c-375-sang | KHỚP |
| C2 · "đổi lớp" (từ đồng nghĩa) → Đề xuất chuyển lớp + "Việc của vai khác" | `tuKhac`, `vaiKhac` | c2-375-toi | KHỚP |
| D · Tuần của tôi theo nhịp, mở tại chỗ | `TabTuan` | d-1440-toi, d-375-sang | KHỚP khung (nội dung GV — TVV ở PR c) |
| Chân "Mở trang Hướng dẫn ›" | `KhungPanel chan.trai` | mọi ảnh | KHỚP |
| E · màn chưa có mục | `TabToiMuon` + `BanDangO man=null` | — | GIỮ (không chụp: GV không vào được Phân tích, trang về Tổng quan; nội dung QL/TVV có Phân tích ở PR b/c) |

Đếm: 13 / 14 dòng KHỚP (E không chụp được ở vai GV, không phải lệch) → ≥ 90 %.

## 2. Khác (có lý do)
1. B vẽ QL (Vai: Quản lý ▾); web chụp GV vì nội dung QL là PR (b). Ô "Vai: …" của QL/QT có trong mã (`select` "Xem vai khác").
2. B nhóm đầu tên "Case đang mở" (mockup "Case") — cùng tên khối "Bạn đang ở", một khái niệm một tên.
3. B: "Hoàn thành, mở lại, xoá Case" chưa có "Chỉ cho tôi" — trong panel Case chưa có `data-hd`; thêm ở PR sau nếu cần.
4. Thanh "Dữ liệu demo" trên cùng ở ảnh web — chỉ bản demo.
5. A1: dòng thứ ba ở Lịch Test tuần là "Xem Test tuần này, bài quá hạn chấm" (lối chính tại màn này) thay "Xem bài quá hạn chấm" — một việc một tên ở cả 3 tab; cô Hà có S nên thêm dòng "Chấm Speaking chéo".
6. Hồ sơ lớp không có đường chung (cần id lớp) → "Không làm ở đây" của Lịch Test tuần chỉ còn "Xếp, dời lịch MT — việc của QL" (bỏ "Xem điểm cả lớp → Hồ sơ lớp ›" để không link sai).

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Mở hướng dẫn của màn | Tài khoản › Hướng dẫn | Nút **?** trên thanh (mọi trang, 375 44 px) |
| Biết chưa mở lần nào | dải "Mới dùng PISA TRACKING?" (Xem · Ẩn) ở Tổng quan, Công việc | chấm trên "?" (PTA chốt 05/11 — bỏ dải, mockup F1 không có); mở "?" là hết chấm |
| Mở khi đang làm Case / Nhập điểm | mở panel Hướng dẫn đóng panel đang làm (`khoPanelChung`) | mở chồng, panel đang làm và chữ đang gõ còn nguyên; Esc / ✕ chỉ đóng hướng dẫn |
| Xem việc của màn | danh sách mục của màn | 3 khối Bạn đang ở · Việc làm ở đây · Không làm ở đây |
| Tìm | lọc bỏ dấu | lọc bỏ dấu + từ đồng nghĩa + việc vai khác |
| Việc theo nhịp | trang Hướng dẫn › Việc hằng tuần | tab Tuần của tôi (mở tại chỗ) — trang vẫn có |
| Chỉ cho tôi | có | giữ (đóng hướng dẫn rồi khoanh) |
| QL / QT xem vai khác | ô chọn ở trang | ô "Vai: …" trên đầu panel + trang |
| Trang /huong-dan, In | có | giữ (GV: phần đầu là Tôi muốn…; PR c làm lại theo 3 tab) |

Không mất thao tác nào (dải Mới dùng bỏ theo PTA chốt: việc nó làm — báo chưa mở, dẫn tới hướng dẫn — nay là chấm + nút "?").

## 4. [XM] / để sau
- ~~Dải "Mới dùng PISA TRACKING?"~~ — PTA chốt 05/11: BỎ (chấm trên "?" thay). Đã gỡ dải, phép UIC-1 đổi thành "đã bỏ", chữ EN gỡ; cờ `daXemHuongDan` giữ cho chấm.
- Màn GV `/phan-tich`: GV mẫu không có quyền; mục "màn chưa có hướng dẫn riêng" chỉ thấy ở vai có Phân tích.
