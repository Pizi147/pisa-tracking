# R4 · ĐẦU PANEL VIỆC ĐỦ THÔNG TIN — khớp / khác

Gói R4 (rà 24/11, mục 4, P1–P11). Dữ liệu ĐÃ CÓ (`WorkItem.due / classCode / reason`, GET của panel) — không thêm request / câu máy chủ. Luật hạn NH4 (DESIGN.md "Luật NHẸ HƠN"): `ChipHan` — quá hạn = "quá hạn n ngày" chip nền đỏ nhạt, còn hạn = ngày dd/mm/yyyy, không ⚠.

| # | Panel | Trước | Sau |
|---|---|---|---|
| P1 | Đã thực hiện | không hạn · lớp · tên em không link; lỗi lưu chỉ toast | đầu `dauTuViec` (hạn · tên em link · lớp); lỗi lưu → chân "⚠ Không lưu được — lý do · Thử lại", chữ giữ |
| P2 | Tình hình học tập · TVV hỏi | tên em chữ trơn, hạn là viên trong thân | đầu: hạn / "quá hạn n ngày" · tên em link · lớp (viên hạn trong thân bỏ vì lặp) |
| P3 | Sau thi · Chọn bước tiếp | không hạn | chip hạn ở đầu |
| P4 | Meeting CX/GĐCN | không hạn | hạn / "quá hạn n ngày" ở đầu (+ chip SOS như cũ) |
| P5 | Báo PH kết quả Test | không hạn | hạn ở đầu (khi việc có hạn) |
| P6 | Khai / sửa bậc một em | không lớp; lỗi / 409 chỉ toast | lớp + hạn ở đầu; lỗi / 409 ở chân kèm Thử lại |
| P7 | Lô Ý thức · Khai bậc lô | lỗi tải = một dòng đỏ, không đầu | đầu (hạn · lớp) lúc tải / lỗi; `ErrorState` có Thử lại; Khai bậc lô nhận hạn từ dòng việc |
| P8 | Bổ sung hồ sơ (TVV) | tên em "" lúc tải, lớp null | tên em (nếu dòng có `con`) + lớp của dòng |
| P9 | Xem vi phạm → Xác nhận xử lý | mất lớp khi chuyển | `lop` + đầu truyền sang |
| P10 | Đã thực hiện / Xác nhận xử lý / Khai bậc lúc tải | đầu trống | đầu dựng từ props (không chờ GET) |
| P11 | Phân công GV môn / Chọn người phụ trách | không nói vì sao có việc | `it.reason` một dòng đầu thân; đầu dùng `dauTuViec` (+ hạn) |

## Thao tác TRƯỚC → SAU
Không mất thao tác nào. Thêm: Thử lại ở lỗi tải lô Ý thức / Khai bậc lô; Thử lại ở chân khi lưu lỗi (P1, P6). Lỗi lưu P1 / P6 không còn toast (chuyển xuống chân) — chủ SP đổi lại được.

## KHÁC / để sau
- P8: tên em lúc tải chỉ có khi dòng việc mang `con` (dòng gộp bổ sung hồ sơ không luôn có) — khi đó đầu chỉ có lớp; tên hiện khi hồ sơ tải xong, như cũ.

## Ảnh (demo, GVCN 7 Trần Ngọc Hà, tối 1440 · sáng 375)
`xac-nhan-xu-ly-*` và `lo-y-thuc-*` (truoc | sau): panel đã tải trông như cũ (đã có đầu); phần mới là LÚC TẢI / LỖI / LƯU LỖI — không chụp tĩnh được, đã xem trực tiếp: lúc tải Xác nhận xử lý hiện ngay "Phạm Bảo Ngọc · MB FT 101 · quá hạn 1 ngày".
KHÁC: P1–P5, P8 cần vai TVV / CX / QL và dữ liệu demo chưa có đủ → chưa chụp ảnh cặp riêng; PTA Plan cần thì chụp theo vai khi rà.
