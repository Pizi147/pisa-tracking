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

## Ảnh (demo DB của worktree, tối 1440 · sáng 375; truoc | sau)
`p1-da-thuc-hien` (GVCN 7) · `p2-tinh-hinh` (GVCN 7) · `p3-sau-thi` (TVV 6) · `p4-meeting` (CX 24) · `p5-bao-ph-kq-test` (TVV 2) · `p8-bo-sung-ho-so` (TVV 29) · `xac-nhan-xu-ly-*` · `lo-y-thuc-*`. Soi: không chữ cắt, không tràn 375, ✕ / ⓘ thẳng hàng.
Dữ liệu tạo thêm trong DB thử của worktree (không đụng seed chung): Meeting CX đề xuất → Head duyệt (P1), TVV hỏi tình hình em Lê Quang Huy (P2), GVCN xác nhận Meeting CX (P4). Lỡ tay: duyệt thêm đề xuất PA #10 — chỉ trong DB thử.
Thấy trên ảnh: P1 "hạn 18/09/2026" · P2 "hạn 16/09/2026" (vàng) ở đầu; P3 "hạn 21/09/2026" dòng riêng; P4 "hạn 27/09/2026"; P5 việc không hạn nên đầu có tên em · lớp; P8 đầu chỉ "Sửa thông tin · tên em" vì dòng bổ sung hồ sơ không có lớp (KHÁC, để sau nếu muốn lớp).
`/ponytail-review`: gọn, không cắt được gì.
