# GD-2 PANEL-CHAM-SPEAKING — panel "Chấm Speaking" gom tuần Test → lớp · KHỚP / KHÁC

Mockup đã duyệt `thiet-ke/v21/trang-dau-gv.html` K3 (1440) + K8c (375); `04-thiet-ke.md` 5.5, 12, 13 (thắng hình). Plan `07-plan-giao-dien-dot-1.md` dòng GD-2.
Ảnh cặp (trái mockup | phải web, bộ demo, GV Speaking): `k3-1440-toi.png` · `k8c-375-sang.png`.

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
| K3 ô GV chấm | "GV chấm [Đinh Thu Hằng · tôi]" đầu ngăn | `NutGvCham hang` + `useGvChamCot(lớp, tuần)` — cùng ô nhớ với lưới Nhập điểm; lưới không vẽ nút riêng (`LuoiFT gvCham`) | KHỚP (lưu máy chủ đến với LG-5 PR-C — hook dùng chung) |
| K3 lưới | Học viên · Speaking · Kết quả, cùng lưới K2 | `LuoiFT chiCot=['speaking'] gon` — cùng hộp chấm 4 tiêu chí, "Lưu · bài tiếp ›", Hoàn tác vắng | KHỚP |
| K3 Kết quả | "Chờ S" / "Chờ W2, S" / "✓ Đạt" / "SOS 1" | máy chủ gửi `cells` + `result` (từ bundle đã nạp); lưới chỉ vài cột ghi thẳng "Chờ …" thay "–" (cũng áp K2) | KHỚP |
| K3 vắng | "vắng W2 SEP" dưới tên | `gopVangHang` của lưới | KHỚP |
| K3 Đã có điểm | ngăn con "Đã có điểm · 2 bài", dòng phụ "GV chấm: … · 13/09" | `details` + `LuoiFT` thứ hai, `phu` = `gvCham.ten` (không có → người nhập) · `ngay(enteredAt)` | KHỚP |
| K3 Tuần cũ hơn | gập cuối, "7 bài · 6 quá hạn" | `details` tuần trước tuần trước; trong là cùng đầu tuần + ngăn | KHỚP |
| K3 dòng quy chế | "Quy chế · "-" = vắng: lần 1 dời sang tuần sau · lần 2 huỷ · ⓘ" | — chờ thành phần dòng quy chế của GD-3 (`KhungPanel`) | KHÁC (phụ thuộc GD-3, thêm một dòng khi GD-3 merge) |
| K3 chân | "✓ Đã lưu 1 bài" + "Việc tiếp ›" | "Việc tiếp ›" (giữ); trạng thái lưu từng dòng ở `DauLuu` cạnh tên | KHÁC nhỏ (đếm phiên ở chân không có nguồn chung nhiều lưới) |
| K3 hết bài ngăn | — | "Lớp tiếp: {mã} ›" (ngăn kế còn bài) / "Việc tiếp ›" | GIỮ luật R1-LUU-TIEP |
| K8c 375 | toàn màn, "‹ Quay lại", cùng thứ tự | `KhungPanel` 375 toàn màn (sẵn có) | KHỚP |

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
`GET /my-work/cham-speaking`: thêm `cells`, `result`, `mt0Sos`, `studentCode`, `status` cho mỗi dòng — tính từ `loadBundle` đã nạp (`resultOf(a, scores, skips, skillRows)`), số câu đo trước → sau ở dưới.
