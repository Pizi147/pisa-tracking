# Hạn chỉ ngày — các nhãn còn lại (PTA Plan 24/11)

Ảnh trước → sau: `chua-lam-1440-{truoc,sau}.png` (Phân tích › Giáo viên › panel Chấm Test › Chưa làm: cột Hạn tô đỏ ngày, trạng thái "Chưa làm" thay "Chưa làm · quá n ngày"). 375 không chụp được tự động (tab Giáo viên ngoài khung); đổi chữ cùng thành phần.

Đổi sang NGÀY dd/mm/yyyy tô màu (hạn = hôm nay − n ngày khi máy chủ chỉ trả số ngày trễ; không thêm câu SQL / trường):
- `QuaHan` (BangCanHoTro, BanGiaoPanel, ViecTiep): ngày đỏ + sr-only "quá hạn".
- PanelChuaLam (dòng + chữ sao chép), PanelGvTre (chữ sao chép): ngày thay "quá hạn n ngày".
- BangLuotPanel: cột Hạn đỏ khi việc chưa làm quá hạn; trạng thái chỉ "Chưa làm".
- TraLai (dải Chờ GV sửa): ngày hạn sửa tô màu thay "GV quá hạn n ngày" / "hạn sửa …".
- CuoiKhoaLop: "hạn chốt" → chỉ ngày tô màu (tooltip còn "hạn chốt …").

Giữ: `NhanTrangThai qua-han` (nhãn trạng thái), "Làm muộn n ngày" / "Trễ n ngày" (đã làm sau hạn — số ngày trễ, không phải hạn).
Không có nơi nào cần thêm trường máy chủ.
