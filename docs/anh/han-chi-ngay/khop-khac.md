# Hạn chỉ ngày tô màu (chủ SP 24/11)

Ảnh trước → sau CẢ MÀN (1440 tối · 375 sáng): `cv-gv-*` (Công việc GV + panel mở), `cho-duyet-head-*`, `lich-test-*`, `tong-quan-head-*`.

Luật: hạn = CHỈ ngày dd/mm/yyyy, chữ đỏ quá hạn · vàng hôm nay → còn ≤ 2 ngày · thường còn xa. Không "quá hạn n ngày", không chữ "hạn" trước ngày, không nền / viền; `sr-only` "quá hạn" + tooltip đầy đủ giữ. Số đếm "m quá hạn" giữ.

Sửa: `LOP_MUC_HAN` (bỏ nền đỏ), `ChipHan`, `Han`, `DongHan`, `HanDong` (SoLieu), `NgayHan` (Tổng quan), `HanEm` (Phối hợp), `CotCaseHv`, `HopGiaHan`, `TabTheoDoi`.

Phép kiểm sửa khớp luật mới: `prOv12e.tests.ts` OV12e-1b (CotCaseHv không còn BadgeHan → tô theo `LOP_MUC_HAN`) · `thanhPhanChung.tests.ts` V22+HAN-BO-DAU (LOP_MUC_HAN.qua chỉ chữ đỏ, không nền) và BADGE-QUA-HAN (ChipHan không còn badge).

CHƯA đổi (ngoài "hạn là ngày", ghi cho PTA Plan quyết): nhãn trạng thái / đếm không có ngày để hiện — `QuaHan` (BangCanHoTro, BanGiaoPanel, ViecTiep chỉ có số ngày), `NhanTrangThai qua-han`, PanelChuaLam / BangLuotPanel ("Chưa làm · quá n ngày"), TraLai ("GV quá hạn n ngày"), LuotThuongPage, CuoiKhoaLop "hạn chốt". Bố cục dòng việc không đụng (chờ mockup v24).
