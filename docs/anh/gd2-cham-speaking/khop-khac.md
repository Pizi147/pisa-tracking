# GD-2 PANEL-CHAM-SPEAKING — panel "Chấm Speaking" gom tuần Test → lớp · KHỚP / KHÁC

Mockup đã duyệt `thiet-ke/v21/trang-dau-gv.html` K3 (1440) + K8c (375); `04-thiet-ke.md` 5.5, 12, 13 (thắng hình). Plan `07-plan-giao-dien-dot-1.md` dòng GD-2.
Ảnh cặp (trái mockup | phải web, bộ demo ngày 14/09/2026, vai 17 Đỗ Thu Hương — GV Speaking): `k3-1440-toi.png` (ngăn đầu mở) · `k3-da-co-diem-1440-toi.png` (thêm ngăn chỉ còn bài đã chấm) · `k8c-375-sang.png`.
Phần cột trái / tab / đầu trang Công việc trong ảnh là việc của GD-1 (đổi tên tab "Chấm Speaking", dải "Việc chung của nhóm GV Speaking") — không tính vào PR này.

## Truy vết khung → thành phần → kết quả

| Khung | Thành phần mockup | Thành phần web | Kết quả |
|---|---|---|---|
| K3 đầu panel | "Việc chung · Chấm Speaking" · tiêu đề "Chấm Speaking" · "18 bài · ⚠ 6 quá hạn" | `KhungPanel dau` (`loai`, `dong2`: `{n} bài` + `ChipSoQuaHan`) | KHỚP |
| K3 đầu panel | "MT · MT0" trước số bài | — | BỎ (loại bài đã ở từng ngăn / lưới; ngăn trộn MT + MT0 nên một nhãn chung dễ sai) |
| K3 ô tìm | "Tìm em" | ô tìm tên / email (không dấu) — giữ | KHỚP |
| K3 lọc lớp | — | `<select>` "Mọi lớp" cũ | BỎ (ngăn lớp thay lọc lớp — mockup ghi chú mục 2) |
| K3 đầu tuần | "W3 SEP · 8 bài · hạn 23/09", tuần mới trên | `veTuan`: `tuanLich` · `{n} bài` (bài chờ) · `ChipHan vien` hạn sớm nhất | KHỚP |
| K3 ngăn lớp | mã lớp · n bài, gập / mở, lớp theo mã mặc định | `NganLop` nút `aria-expanded`, `soSanhLop`; mở sẵn ngăn đầu còn bài (hoặc `lopDau`) | KHỚP |
| K3 ngăn lớp | — | "⚠ n quá hạn" ở đầu ngăn khi có | THÊM nhỏ (đầu tuần chỉ có hạn; ngăn quá hạn phải thấy khi gập) |
| K3 ô GV chấm | "GV chấm [Đinh Thu Hằng · tôi]" đầu ngăn | `NutGvCham hang` + `useGvChamCot(lớp, tuần)` — cùng ô nhớ với lưới Nhập điểm; lưới không vẽ nút riêng (`LuoiFT gvCham`) | KHỚP — lưu máy chủ (LG-5c `gv_cham_cot`, người xem × lớp × đợt); hàng đợi gửi kèm lựa chọn theo lô |
| K3 lưới | Học viên · Speaking · Kết quả, cùng lưới K2 | `LuoiFT chiCot=['speaking'] gon` — cùng hộp chấm 4 tiêu chí, "Lưu · bài tiếp ›", Hoàn tác vắng; lưới vài cột ghi tên kỹ năng đầy đủ ("Speaking") và thu cột để vừa 375 (cũng áp K2) | KHỚP |
| K3 Kết quả | "Chờ S" / "Chờ W2, S" / "✓ Đạt" / "SOS 1" | máy chủ gửi `cells` + `result` (từ bundle đã nạp); lưới chỉ vài cột ghi thẳng "Chờ …" thay "–" (cũng áp K2) | KHỚP |
| K3 vắng | "vắng W2 SEP" dưới tên | lưới một cột: chữ vắng lên dòng phụ dưới tên (ô không lặp — DON-HINH B6) | KHỚP |
| K3 Đã có điểm | ngăn con "Đã có điểm · 2 bài", dòng phụ "GV chấm: … · 13/09" | `details` + `LuoiFT` thứ hai, `phu` = `gvCham.ten` (không có → người nhập) · `ngay(enteredAt)` | KHỚP |
| K3 Tuần cũ hơn | gập cuối, "7 bài · 6 quá hạn" | `details` tuần trước tuần trước; trong là cùng đầu tuần + ngăn | KHỚP |
| K3 dòng quy chế | "Quy chế · "-" = vắng: lần 1 dời sang tuần sau · lần 2 huỷ · ⓘ" | — chờ thành phần dòng quy chế của GD-3 (`KhungPanel`) | KHÁC (phụ thuộc GD-3, thêm một dòng khi GD-3 merge) |
| K3 chân | "✓ Đã lưu 1 bài" + "Việc tiếp ›" | `chan.phu` "✓ Đã lưu n bài" (đếm lần lưu từ khi mở panel, `role=status`) + "Việc tiếp ›" — **xanh** như mockup (chủ SP chốt XM-1 14/11: "Đã lưu" luôn xanh, DESIGN.md V12); mọi nơi "✓ Đã lưu" dùng chung `LOP_DA_LUU` | KHỚP |
| K3 hết bài ngăn | — | "Lớp tiếp: {mã} ›" (ngăn kế còn bài) / "Việc tiếp ›" | GIỮ luật R1-LUU-TIEP |
| K8c 375 | toàn màn, "‹ Quay lại", cùng thứ tự | `KhungPanel` 375 toàn màn (sẵn có) | KHỚP |

**KHỚP 13 / 14 (93 %)** — tính các dòng so được (bỏ BỎ / THÊM / GIỮ). 1 KHÁC: dòng quy chế chờ thành phần của GD-3.
Khác hình nhỏ không thành dòng: ô điểm trống dáng viền đứt của lưới chung (mockup vẽ viền liền) — giữ để cùng dáng lưới Nhập điểm; tên + "MTn ›" ở 375 có thể bị cắt một chữ (rê / đọc màn có đủ tên).

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Tìm em (tên, email, không dấu) | ô tìm | ô tìm | GIỮ |
| Lọc lớp | `<select>` | bấm ngăn lớp | ĐỔI chỗ |
| Chấm ô S (4 tiêu chí + nhận xét) | `ODiemMt` một dòng một em | `LuoiFT` ô S → cùng `HopNhapDiem` | GIỮ |
| Lưu · bài tiếp ›, Vắng, Hoàn tác, Khôi phục điểm, Bỏ vắng | hộp | hộp (không đổi) | GIỮ |
| Chọn GV chấm | trong hộp từng em (mặc định tôi) | ô đầu ngăn (lớp × tuần) + vẫn sửa riêng từng em trong hộp | GIỮ + thêm |
| Xem bài đã có điểm, sửa lại | nhóm "Đã có điểm" chung, "Nhập bởi …" | ngăn con mỗi lớp, "GV chấm: … · dd/mm" | ĐỔI chỗ + chữ |
| Mở hồ sơ em / lượt MT | tên = link | tên = link · "MTn ›" | GIỮ + thêm |
| Việc tiếp › | chân | chân + khi hết bài mọi ngăn | GIỮ |
| QL theo dõi hàng đợi của GV (`?nguoi=`) | có | có | GIỮ |

Không mất thao tác nào.

## Turso
`GET /my-work/cham-speaking` (GV Speaking, bộ demo, `prOv14c` OV14c-9): **18 câu → 19 câu** (+1: `docGvChamCotLo` — lựa chọn GV chấm của người xem ở các lớp của hàng đợi, một câu theo khoá chính), 23 dòng → 23 dòng (trần 24 giữ). Thêm `cells`, `result`, `mt0Sos`, `studentCode`, `status` mỗi dòng — tính từ `loadBundle` đã nạp (`resultOf(a, scores, skips, skillRows)`), không câu đọc mới. Trang đầu / Công việc không thêm request (panel chỉ gọi khi bấm việc, như trước).

## Phụ thuộc
- **GD-3** (dòng quy chế trong `KhungPanel`): khi merge, thêm một dòng "\"-\" = vắng: lần 1 dời sang tuần sau · lần 2 huỷ" cho panel này.
- **LG-5c** (#đã merge, GV chấm lưu máy chủ): panel ghi qua `useGvChamCot` → `PUT /cham/gv-cham-cot`, đọc kèm hàng đợi (`gvChamCot`).
- **GD-1** đổi tên tab / dải đầu tab; tệp không chồng với PR này.

## Chú thích `ponytail:`
Không có.

## Đổi thêm theo chủ SP 14/11 (XM-1)
"✓ Đã lưu" luôn xanh: hằng `LOP_DA_LUU = 'text-ok'` (`ui/KhuonViec.tsx`) dùng ở `ChuLuu`, Hoàn tác, lưới FT, `ODiem`, hộp nhập điểm, panel Sau thi, Xác nhận xử lý, Hộp chờ duyệt, Tạm dừng / Kết thúc, Xét lại, Bàn giao, Công việc. Phép `prNenTypoMau` K-HTT-3 đổi thành "Đã lưu luôn xanh — một lớp màu" (giữ ngoài lệ "Đã lưu nháp").
