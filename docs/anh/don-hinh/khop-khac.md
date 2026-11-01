# DON-HINH — hình còn sót: kiểm trên web từng mục

Loại PR: **sửa nhỏ** (không đổi bố cục). Nguồn: `docs/superpowers/plans/2026-10-30-don.md` PR DON-HINH, T10, T11, T13, "Chủ SP trả lời 30/10". Mọi ảnh do `npm run dev` cổng riêng, DB demo, 01/11.

## Ảnh (TRƯỚC | SAU)
`tong-quan-ql-1440-toi.png` · `ho-so-lop-1440-toi.png` · `cong-viec-gv-speaking-1440-toi.png` · `cong-viec-ql-1440-toi.png` · `nhap-diem-lop-375-sang.png` · `vang-mot-lan-1440-toi.png` · `ho-so-luot-375-sang.png` · `ho-so-hv-case-375-sang.png` · `phan-tich-y-thuc-1440-toi.png` · `tai-khoan-1440-toi.png`

## Mục
| # | Chỗ | Kiểm trên web | Trước | Sau | Kết quả |
|---|---|---|---|---|---|
| T10 | chữ phụ tối | còn 183 / 154 | 183 194 216 · 154 168 194 | 186 198 222 · 158 172 200 (D4) | KHỚP |
| C9 / T11 | Công việc, nhóm chấm chéo | còn | "Bài thi Speaking tuần này" | "Speaking chấm chéo" (bản Anh sẵn có) | KHỚP |
| Câu 2 | QL mở Công việc | còn | mặc định "Tất cả" | mặc định "Của tôi", nhớ trong phiên (`sessionStorage`) | KHỚP quyết định chủ SP |
| A1 | Nhập điểm lớp 375 | còn: hai thanh chip, thanh trên bấm không đổi kỹ năng | hai thanh | một thanh | KHÁC kế hoạch, xem dưới |
| B5 | hồ sơ lượt 375 | còn: ô Speaking lệch trái vì "GV chấm: …" đẩy rộng cột | cột `auto` | cột cố định 7,5 rem, dòng phụ xuống dòng | KHỚP |
| B6 | lưới điểm, em vắng đủ kỹ năng | còn: "vắng W2 SEP" 5 lần một dòng | mỗi ô một lần | một lần ở dòng phụ tên em | KHỚP |
| B7 | HV & Lớp, nút việc | còn trong mã (chỉ bỏ tên cuối chữ) | chỉ bỏ " · {em}" cuối | `boTenEm` bỏ ở mọi vị trí | KHỚP |
| B8a | hồ sơ HV 375, "Sửa" Case | còn: một dòng riêng | dưới dòng thông tin | cùng hàng trạng thái Case | KHỚP |
| B8b | ⋯ thẻ PA 375 | còn: mồ côi một dòng | rơi xuống dòng | cùng hàng tên PA | KHỚP |
| B8c | màu ✓ vượt thẻ điểm | không sửa | — | — | luật mới hơn: PANEL-V10 (chủ SP 30/10) "vượt và bằng cùng đạt", `chiToHut` |
| B8d | tab hồ sơ HV 375 cắt chữ | **đã hết** | — | `HangTab` cuộn ngang, tab chọn trong khung | đã hết |
| B9 | `TargetText` "6.5 · KCK" | còn trong mã | gãy được | `whitespace-nowrap` | KHỚP |
| B11a | Phân tích › Ý thức, nhãn trạng thái | còn: "Quá hạn" chữ trơn cạnh hai viên | 2 dáng | một dáng `Nhan` (nền nhạt + ⚠) | KHỚP |
| B11b | Ý thức, "—" trên dòng phụ | còn | "—" + dòng phụ lệch | có dòng phụ thì không "—" | KHỚP |
| B11c | Tài khoản, chip đếm 0 | còn: bấm được | bấm được | xám, không bấm, không ẩn | KHỚP |

## Khác kế hoạch (A1)
Kế hoạch ghi ẩn thanh của `MotKyNang`. Làm ngược: ẩn `ChonMon` khi đang ở dạng một kỹ năng. Lý do kiểm trên web: `ChonMon` không điều khiển `MotKyNang` (bấm "R" không đổi danh sách), còn thanh `MotKyNang` có số đã nhập ("L 13/30") và đổi được kỹ năng. "Xem dạng bảng" vẫn hiện `ChonMon` để lọc cột.

## Không đổi ở hồ sơ lượt
Hồ sơ lượt nay mỗi kỹ năng một hàng, cột Lịch ghi "W2 SEP → W3 SEP · vắng lần 1" theo từng kỹ năng, nên không gộp về một dòng (phép kiểm LNM-4 giữ `chuDoiVang` ở `ODiemLon`).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| QL mở `/cong-viec` | thấy Tất cả | thấy Của tôi; bấm Tất cả được ghi `nguoi=tat-ca`, nhớ trong phiên |
| QL mở số tổng hợp ở Tổng quan / Quá hạn | Tất cả | không đổi: link ghi `nguoi=tat-ca` |
| QL mở việc của người khác từ chuông / link khi đang "Của tôi" | — | panel vẫn mở (tìm trong danh sách đã nạp), đã bấm thử |
| Nhập điểm lớp 375: chọn kỹ năng | hai thanh, một thanh không tác dụng | một thanh có tác dụng; bảng vẫn có lọc cột |
| QT bấm chip đếm 0 | lọc ra rỗng | không bấm; chip đang chọn vẫn bỏ chọn được |
| Còn lại | không đổi | không đổi: mọi nút giữ việc, chỉ đổi hàng ở 375 |

Dòng đọc Turso: +0 câu, +0 dòng (`/my-work` vẫn đọc một lần, lọc tại máy; số liệu dùng dữ liệu đã nạp).
