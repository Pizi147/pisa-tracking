# 6c PANEL-AP — khớp / khác + thao tác TRƯỚC → SAU

Kế hoạch: `docs/superpowers/plans/2026-10-28-6c-panel-ap.md` · bảng kê `docs/superpowers/specs/2026-10-27-panel-inventory.md` · mockup `thiet-ke/v7/panel-pilot.html` (M6, chủ SP duyệt #605).
Ảnh chụp trên seed demo (14/09/2026), cổng riêng 5610. Không có ảnh "TRƯỚC" riêng: cột TRƯỚC tả theo mã `origin/claude/pilot-viec-de3f5a`.

## 6c-1 (không đổi bố cục màn — sửa hành vi)

| # | Chỗ | TRƯỚC | SAU | Ảnh |
|---|---|---|---|---|
| ① | 16 panel bảng kê lỗi 5 (+ thẻ duyệt trong panel Tổng quan) | ✕ / Esc / nền đóng luôn, mất chữ / lựa chọn | còn chữ chưa lưu → hộp "Bỏ chữ đang gõ?" (Ở lại / Bỏ chữ, đóng); chưa gõ → đóng ngay | `1-tu-choi-dang-go-hoi.jpg` |
| ① | Hộp xếp lịch `HopKyNang` | bấm ngoài / Esc / ✕ đóng, mất thay đổi | còn thay đổi → cùng hộp hỏi | — |
| ② | 11 chỗ bảng kê lỗi 6 | lỗi tải = rỗng / "Đang tải…" mãi / "chỉ dành cho Quản trị" khi rớt mạng | `ErrorState` + Thử lại (chỗ hẹp: `LoiTaiNho`); "chỉ dành cho Quản trị" chỉ khi 403 | — |
| ③ | Gia hạn sau thi | ngăn 480 phủ panel đang mở | hộp nhỏ (`Modal`) trong panel | — (seed không có em đủ điều kiện) |
| ③ | Sửa công việc (Vận hành) | ngăn thứ hai đè ngăn việc | view kế trong cùng panel: ‹ về việc, ✕ đóng cả panel | `3-sua-cong-viec-view-ke.jpg` |
| ⑥ | Nhập hộ (panel GV chấm quá hạn) | lưới có cột "Kết quả · Chờ n kỹ năng" + nút "Cả lớp" đứng lẻ | chỉ Học viên + cột kỹ năng của dòng (như mockup khu ③) | `6-nhap-ho-gon.jpg` |
| ⑥ | Dòng 2 đầu panel ở 375 | xuống hàng thì "·" đứng đầu dòng | dấu đầu dòng bị cắt, chữ thẳng cột tiêu đề | `6-dong2-375-khong-cham-dau-dong.jpg`, `6-em-con-trong-375.jpg` |
| ⑥ | View Case mở từ việc | thẻ PA của chính việc đó lặp ô ghi nhanh / Xác nhận PA / Kết quả | không lặp (việc ở view dưới, ‹ về) | — |

**Mất thao tác:** không. "Cả lớp" trong Nhập hộ vẫn tới được qua "lớp · lượt ↗" ở đầu panel và "Mở lưới lớp ở Lịch Test ›".
Máy chủ: gỡ `GET /tong-quan/ql/tre` (web không gọi từ 6b-4; panel dùng `/tong-quan/gv-tre`).

## 6c-2 (đổi bố cục dòng danh sách — chờ chủ SP duyệt ảnh)

| Khung mockup | Thành phần | Web | Ảnh mockup · web | Kết luận |
|---|---|---|---|---|
| K ② Case chưa chốt PA | dòng 2 "✗ 5.0 · kỳ vọng 6.0 · thiếu 1.0" | có (✗ + chữ, `DiemKq`); Case không có mốc điểm giữ dòng cũ | `5-mockup-k2-case-chua-chot.jpg` · `5-dong-case-co-diem-1440.jpg` | KHỚP |
| K ② | lớp · lượt ở dòng 1 cạnh tên | lớp · lượt · việc tiếp ở cuối dòng 2 (dòng 1 giữ tên Case + người giữ việc) | như trên | KHÁC nhỏ — giữ tên Case, người phụ trách (thông tin cũ không mất) |
| K ② | chip kỹ năng (W, S…) | không có — tên Case đã ghi kỹ năng | như trên | GIỮ (không thêm chip trùng) |
| K ② dòng chỉ đọc | không mở rộng, tên link ↗ | không mở rộng, tên link ↗, dòng tự đủ người · hạn · tình trạng | `4-dong-chi-doc-link-thang-1440.jpg` | KHỚP |

**Đếm:** 4 dòng khung — 2 KHỚP · 1 KHÁC nhỏ có lý do · 1 GIỮ (không tính) → 2 / 3 = 67 % (< cổng 90 %: chủ SP quyết dòng KHÁC — đưa lớp · lượt lên dòng 1 thì đạt 100 %).

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Xem hồ sơ từ dòng chỉ đọc | bấm dòng → mở rộng → "Mở trang ↗" (2 bấm) | bấm tên ↗ (1 bấm) |
| Xem tình trạng / người / hạn dòng chỉ đọc | mở rộng dòng | đọc ngay trên dòng |

## 6c-2 ④ Bỏ (mã chết, không đổi màn)
Ô số `SoLieu` (0 nơi gọi) · `NutMoDanhSach` · `BangGiaoVienChiNhanh.tsx` · tham số `kqMacDinh` / `trongPanel` của `BangMock` + gỡ 3 phép kiểm cũ chỉ đọc các mã đó.

## Để sau / [XM] hỏi PTA
- **Bỏ chưa làm:** `SkillBoard()` và phần bảng `BangSos()` — kéo theo chuỗi hàm phụ + phép kiểm cũ đọc nội dung (panelUx3, prDh, prBang0); hộp "Hướng dẫn nạp lại" chồng Modal (`DemoBar`).
- **Gộp chạm bố cục — cần chủ SP:** link trùng ở Điều hướng Tổng quan (QL "Case chưa có PA ›", "HV thi tháng này ›"; TVV 3 link Cần chú ý) · bảng "Lớp tôi dạy" V4 cuối Công việc · ⋯ › Hồ sơ lớp ở HV & Lớp · badge "n bài chờ chấm" + Nhập điểm hồ sơ lớp · Lịch Test ô "bài quá hạn" · "Xuất điểm Test" · hồ sơ MT hai nút "Lịch sử" · Quản trị Sửa (vai) + Sửa thông tin.
- **Gộp mã (không đổi màn) chưa làm:** `?mo-viec=` → `?viec=mgmt:<id>` · ⋯ › Quay lại học → `useQuayLaiHoc` · `NeedsEvaluation` → `NganDanhSach` · `DeleteViolationConfirm` trùng hộp xoá của `ChiTietViPham`.
- **Ngoài bảng kê:** 9 hộp xác nhận khác vẫn là `KhungPanel longTrong` (MenuXoaPa, ThaoTacCase xoá Case, DeleteViolationConfirm, XemXuLyPanel thu hồi, GvCham, NganLichSuBai, HopThaoTacMt…).
