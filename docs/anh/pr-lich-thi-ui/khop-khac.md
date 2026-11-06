# LICH-THI-UI — tab Lịch thi (HV & Lớp) theo mockup v16 bản 3 (chủ SP duyệt 06/11, #1039)

Ảnh cặp mockup | web (toàn khung, cùng bề rộng): `cap-lt-<khung>-1440.png` (tối) · `cap-lt-m*-375.png` (sáng); `web-lt-*.png` = riêng phần web.
Dữ liệu web là DB demo (tên em, ngày demo 14/09/2026) — khác mẫu mockup (17/09), danh sách web dài hơn (42 em) nên ảnh web cắt theo chiều cao khung mockup.
Chụp bằng `chup-lt.mjs` (Playwright, QL Nguyễn Khánh Vy = vai 2; g5 = GVCN vai 7).

## Khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | KHỚP |
|---|---|---|---|
| a1 danh sách theo lớp | `GocLichThi` + `HangLichThi` (`CotLich`, `CotViec`, `CotMt`, `CotGhi`), dòng tiêu đề lớp `ChuLop` | cap-lt-a1-1440 | GIỮ |
| b1 Dời tháng · b3 Đặt tháng | `HopLich` (một hàng, ô 36, `ONgay gon`) | b1, b3 | GIỮ |
| b2 sau lưu + em rời khoảng | "Đã dời sang 11/2026 · trước: 10/2026" + "✓ Đã lưu · Hoàn tác" 10 giây | b2 | GIỮ |
| c1 Chốt ngày · d1 Sửa ngày | `HopLich` ("Chốt ngày" / "Lưu ngày") | c1, d1 | GIỮ |
| c2 sau lưu | cùng cơ chế "✓ Đã lưu · Hoàn tác" (đã kiểm ở b2) | — | GIỮ (không chụp riêng) |
| e1 Ghi kết quả | `PanelSauThi` CÓ SẴN (XM-1) | e1 | GIỮ |
| f1 mở hàng | `DaiMo` — 5 khối, dáng `.hvl-dai` / `.okn` | f1 | GIỮ |
| g2 hết việc "Cần làm" · g3 lỗi tải · g4 lỗi lưu · g5 chỉ xem | `lt-rong`, `ErrorState`, `HopLich` + lỗi tại hộp, "Chỉ xem" | g2, g3, g4, g5 | GIỮ |
| g1 rỗng khoảng tháng | **không chụp**: DB demo luôn có em "chưa có lịch" (luôn hiện ở danh sách này) nên không dựng được danh sách rỗng; câu chữ đúng mockup, nhánh code `hien.length === 0` | — | — |
| m1 · m2 · m3 · m4 (375) | `ul.lt-the` thẻ từng em; hộp trong thẻ; panel toàn màn; dải xếp dọc | cap-lt-m*-375 | GIỮ |

Hình ảnh KHÁC (có lý do):
1. Hàng công cụ: ô tìm + ô "Lớp" là `locChung` dùng chung với tab Đang SOS (tính năng cũ, không bỏ, không thêm nhãn "Lớp"/"TVV" trước ô); ô TVV thêm cạnh Lớp như mockup.
2. Ô Overall ở dải: ✓ / ✗ so **kỳ vọng của lượt** (như cột MT gần nhất và HV & Lớp), không so Target như ghi chú mockup — để hai chỗ cùng một em không mâu thuẫn; Target vẫn ghi ở tiêu đề khối.
3. "Đã dời sang 11/2026": cả dòng chữ thường (mockup tô xanh riêng phần tháng) — chữ tháng dịch EN nằm trong mẫu câu.
4. 375: khoảng dọc thẻ hơi thưa hơn mockup ở hàng nút (nút 44 px, giữ vùng chạm).

## Thao tác TRƯỚC → SAU (không mất thao tác nào)

| Thao tác | Trước | Sau |
|---|---|---|
| Đặt tháng (em chưa có lịch) | nút "Dời tháng" | chữ phụ **Đặt tháng**, cùng hộp / API `chuyen-thang`; không đếm "Cần làm" (XM-8) |
| Dời tháng · Chốt ngày · Sửa ngày | hai nút ngang, hộp nổi phải, ô tháng "trồi" | nút chính **Chốt ngày** khi đã tới tháng, còn lại chữ phụ; hộp một hàng, ô cùng cao 36 |
| Ghi chú tại hàng | ô nhập mọi hàng, rời ô = lưu | một dòng chữ; bấm → ô (Enter / rời ô lưu · Esc huỷ); người · ngày ở Lịch sử + tooltip |
| Ghi kết quả · Bước tiếp · Sửa KQ | không có ở tab | mở `PanelSauThi` có sẵn (XM-1) |
| Hoàn tác sau lưu lịch | không có | "✓ Đã lưu · Hoàn tác" 10 giây: PUT lại giá trị cũ; lần Đặt tháng đầu tiên → `boLich` (lịch về "chưa có"), có nhật ký (XM-2) |
| Chi tiết em | ▸ nền xanh 4 khối | mũi tên xuống, dải 5 khối (MT ↑↓, Hỗ trợ đang mở → panel Case, Test sắp tới, Phụ trách, Lịch sử 3 dòng) |
| Lịch sử lịch thi | 3 dòng | 3 dòng + "Xem toàn bộ" (mở rộng tại chỗ, ≤ 50 dòng, 1 request khi bấm) |
| Lọc | Từ → Đến · Lớp / khung · ô tìm | giữ + **TVV** (trên dữ liệu đã nạp, +0 câu) + **Cần làm / Tất cả** (thay chữ đếm cuối hàng công cụ) |
| Thứ tự | thi gần nhất trước | theo lớp A→Z, trong lớp: có ngày → có tháng → chưa có lịch → Xong cuối; lưu xong hàng không nhảy chỗ |
| Tên TVV dưới tên em | có | bỏ (có ở dải mở + lọc TVV) |
| Xuất Excel đúng danh sách đang hiện | có | giữ (`onIds`) |

## [XM] hỏi PTA Plan
- **[XM-A] "Đã thi · chờ KQ" không có "quá hạn 15/09".** Mockup vẽ hạn + ⚠ cho hàng Ghi kết quả, nhưng `trangThaiSauThi` (luật 21/10-TVV, cùng việc "Cập nhật KQ thi thật" ở Công việc) đặt `han = null` cho giai đoạn này. Web theo luật + Công việc: không dòng quá hạn ở hàng Ghi KQ; ⚠ đỏ chỉ ở hàng **Bước tiếp** (có hạn). Muốn có hạn ở Ghi KQ → đổi luật cả Công việc.
- **[XM-B] "Xem toàn bộ" lịch sử mở rộng tại chỗ** thay vì panel Lịch sử: panel `thi-that` có sẵn chỉ chứa nhật ký sau thi (KQ, bước tiếp), không chứa lịch / ghi chú lịch thi; đổi nó cần OR hai loại nhật ký (Turso quét cả bảng). Thêm `GET /hoc-vien-lop/lich-thi/:cycleId/lich-su` (2 câu có chỉ mục, chỉ khi bấm).
- **[XM-C] Lớp thường: dải mở hàng không có khối MT từ từng môn** (hiện "—"), như HV & Lớp (chỉ em Fast Track có điểm 5 kỹ năng).
- **[XM-D] "Cần làm" đếm theo em trong tab** (em người xem sửa được + việc đã tới lúc), còn Công việc chia theo người giữ (TVV của em / QL chi nhánh nếu chưa có TVV) — cùng hàm điều kiện, test `LICH-THI-UI` kiểm mọi việc "Chốt ngày thi" ở tab đều có ở Công việc.
- Mỗi lần lưu trong panel Sau thi, panel dùng chung xả `/hoc-vien-lop` nên danh sách tải lại 1 lần (≈ 250 dòng); web giữ thứ tự và việc đang làm của hàng.

## Dòng đọc Turso
Danh sách vẫn MỘT request. Thêm: 3 cột thi thật trên cùng hàng lộ trình (0 dòng thêm) + subquery ngày có KQ (chỉ em chờ bước tiếp), `luotTheoLoTrinh` (so MT trước, nhớ theo lượt) + `diemCuaLuot` lượt trước, 1 câu đếm PA theo lô Case mở. Đo (QL, `tocDo.run`): 20 câu, 946 dòng (×3 → 2 704) — dưới trần cũ (28 câu / 1 154 dòng). Mở hàng 0 request; "Xem toàn bộ" 2 câu.

## `ponytail:`
Không thêm chú thích `ponytail:` mới.
