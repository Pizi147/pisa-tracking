# Yêu cầu của tôi theo khuôn A — khớp / khác mockup v26 (phương án A)

Ảnh cặp cả màn trước | sau: `cap-1440.png` · `cap-1280.png` · `cap-375.png` (tối 1440 / 1280, sáng 375; vai GV Trần Ngọc Hà, dữ liệu demo). Ảnh riêng: `truoc/`, `sau/`.

## Truy vết mockup → thành phần → ảnh
| Mockup v26 | Thành phần | Ảnh |
|---|---|---|
| Đề mục nhóm = trạng thái, đếm, "n quá hạn" | `YeuCauCuaToi.tsx` `DanhSach` + `DaiNhom` | cap-1440 |
| Dòng 4 ô Lớp · Tên HV · Thông tin · ngày | `DongYc` (lưới `.cvA` dùng lại) | cap-1440 / 1280 |
| Dòng phụ phản hồi (lý do từ chối / trả lời), viền trái đỏ ở Bị từ chối | `DongYc` `phanHoi` | cap-1440 |
| Phần mở tại dòng (Đã gửi · Mở › · Sửa… · Rút) | `TheYeuCau dong` (sẵn có, mẫu Chờ bạn duyệt) | sau/1440-cho |
| 375: hai tầng lớp + ngày · tên + thông tin | CSS `.cvA` sẵn có | cap-375 |
| Rỗng | `Empty` giữ nguyên | — |

## Thao tác TRƯỚC → SAU
| Trước (thẻ) | Sau | Ghi chú |
|---|---|---|
| Sửa… / Rút hiện sẵn ở thẻ đang chờ | Mở tại dòng (bấm dòng) rồi Sửa… / Rút | +1 bấm; đúng mockup A, cùng mẫu Chờ bạn duyệt |
| Mở › luôn hiện mọi thẻ | Bị từ chối: ở dòng phụ (0 bấm); còn lại trong phần mở | +1 bấm cho dòng không bị từ chối |
| Đoạn trích 1 dòng cắt "…" + Xem thêm | Nội dung đầy đủ trong phần mở | không còn cắt chữ |
| Lý do từ chối / trả lời trong thẻ | Dòng phụ luôn hiện, đủ chữ | giữ, không mất |
| Chip loại, chip trạng thái, hạn dạng chip | Loại ở ô Thông tin; trạng thái = đề mục (+ chữ "Đã duyệt / Đã trả lời / Tự đóng" ở cột cuối); hạn = ngày tô màu chữ | |
| Dòng "n đang chờ · m đã xử lý" | Số ở đề mục từng nhóm | |
| Chuông `?the=` mở thẻ + nháy viền | Mở sẵn đúng dòng + viền | giữ |
| Thứ tự: chờ trước, rồi đã xử lý | Bị từ chối → Đang chờ → Đã xử lý (việc cần làm lên trên) | đổi thứ tự có lý do |

## Khác mockup (có lý do)
- Dữ liệu thật dài hơn mockup (tên việc + ngữ cảnh) → ô Thông tin xuống dòng ở 375, không cắt.
- Phần mở không lặp hàng "Kết quả" khi phản hồi đã ở dòng phụ (prop `boKetQua`, chỉ khi không có `lyDoDong`).
- Giữ nguyên: bản `gon` (cuối Công việc của GV, hồ sơ HV) — ngoài phạm vi PR.
