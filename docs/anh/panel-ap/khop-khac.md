# 6c PANEL-AP — khớp / khác + thao tác TRƯỚC → SAU

## Dòng KHÁC — chủ SP duyệt (mỗi dòng một câu lý do)

| # | Khung / chỗ | Mockup | Web | Lý do |
|---|---|---|---|---|
| K1 | K ② dòng Case — kỹ năng | chip kỹ năng (W, S…) | chữ tên Case ("Writing Task 2", "Speaking tái diễn…") | Tên Case đã nói kỹ năng (và Case tạo tay có tên riêng), thêm chip là lặp. |
| K2 | K ② dòng Case — Case không có mốc điểm | mọi dòng có "✗ điểm · kỳ vọng · thiếu" | 6 dòng (Case tạo tay, PA xong) không có dòng điểm | Máy chủ chỉ có điểm khi mốc mở Case ghi band; không bịa số. |
| K3 | Dòng chỉ đọc (Đạt MT) | (mockup K ② chỉ vẽ dòng Case) | các đoạn ngăn "·", kết luận "✓ Đạt / ✗ Chưa đạt" | Nâng cấp theo cùng luật: kết luận có ký hiệu, không chỉ màu. |
| K4 | Hộp xác nhận | `.hop-hoi` giữa màn | `ConfirmDialog` giữa màn, phần còn thấy khi bàn phím mở | Cùng mẫu; thêm né bàn phím 375 (ô lý do tự focus). |

**Cổng ảnh cặp 6c-2 (khung K ②):** 6 thành phần — 5 KHỚP (dòng 1 em · Case · lớp · lượt, dòng 2 "✗ điểm · kỳ vọng · thiếu", người giữ việc + chip hạn bên phải, dải nhóm theo bước, dòng chỉ đọc link ↗ không mở rộng) · 1 GIỮ (K1, không tính) → **5 / 5 = 100 %**. K2 là dữ liệu, không phải khung.
Ảnh cặp: `cap-k2-case-1440.png`, `cap-k2-case-375.png` (mockup K ② | web, phông Be Vietnam Pro đã nạp — kiểm `document.fonts`).

Kế hoạch: `docs/superpowers/plans/2026-10-28-6c-panel-ap.md` · bảng kê `docs/superpowers/specs/2026-10-27-panel-inventory.md` · mockup `thiet-ke/v7/panel-pilot.html` (M6, chủ SP duyệt #605).
Ảnh chụp bằng Playwright (`scripts/anh-cap.mjs` + chụp web cùng cách) trên seed demo 14/09/2026, cổng riêng 5610, giao diện tối. Cột TRƯỚC tả theo mã `origin/claude/pilot-viec-de3f5a`.

## 6c-1 (không đổi bố cục màn — sửa hành vi)

| # | Chỗ | TRƯỚC | SAU | Ảnh |
|---|---|---|---|---|
| ① | 16 panel bảng kê lỗi 5 (+ thẻ duyệt trong panel Tổng quan) | ✕ / Esc / nền đóng luôn, mất chữ / lựa chọn | còn chữ chưa lưu → hộp "Bỏ chữ đang gõ?" (Ở lại / Bỏ chữ, đóng); chưa gõ → đóng ngay | `1-tu-choi-dang-go-hoi-1440.png` |
| ① | Hộp xếp lịch `HopKyNang` | bấm ngoài / Esc / ✕ đóng, mất thay đổi | còn thay đổi → cùng hộp hỏi | — |
| ② | 11 chỗ bảng kê lỗi 6 | lỗi tải = rỗng / "Đang tải…" mãi / "chỉ dành cho Quản trị" khi rớt mạng | `ErrorState` + Thử lại (chỗ hẹp: `LoiTaiNho`); "chỉ dành cho Quản trị" chỉ khi 403 | — |
| ③ | Gia hạn sau thi | ngăn 480 phủ panel đang mở | hộp nhỏ (`Modal`) | — (seed không có em đủ điều kiện) |
| ③ | Sửa công việc (Vận hành) | ngăn thứ hai đè ngăn việc | view kế trong cùng panel: ‹ về việc, ✕ đóng cả panel | `3-sua-cong-viec-view-ke-1440.png` |
| ⑥ | Nhập hộ (panel GV chấm quá hạn) | lưới có cột "Kết quả · Chờ n kỹ năng" + nút "Cả lớp" đứng lẻ | chỉ Học viên + cột kỹ năng của dòng (như mockup khu ③) | `6-nhap-ho-gon-1440.png` |
| ⑥ | Dòng 2 đầu panel ở 375 | xuống hàng thì "·" đứng đầu dòng | dấu đầu dòng bị cắt, chữ thẳng cột tiêu đề | `6-dong2-375-khong-cham-dau-dong.png`, `6-em-con-trong-375.png` |
| ⑥ | View Case mở từ việc | thẻ PA của chính việc đó lặp ô ghi nhanh / Xác nhận PA / Kết quả | không lặp (việc ở view dưới, ‹ về) | — |

**Mất thao tác:** không. "Cả lớp" trong Nhập hộ vẫn tới được qua "lớp · lượt ↗" ở đầu panel và "Mở lưới lớp ở Lịch Test ›".
Máy chủ: gỡ `GET /tong-quan/ql/tre` (web không gọi từ 6b-4; panel dùng `/tong-quan/gv-tre`).
Phép kiểm cũ nới regex (ý giữ nguyên — nháp thì ‹ không hỏi): prOv12e OV12e-2c, prKhungNganXep 6b-1 (`veLai` thêm `daSuaRieng || conSua`).

## 6c-2 — dòng danh sách panel số

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Thấy em thiếu bao nhiêu (Case chưa chốt PA) | mở từng Case | đọc ngay dòng 2 "✗ 5.5 · kỳ vọng 6.5 · thiếu 1.0" |
| Xem hồ sơ từ dòng chỉ đọc | bấm dòng → mở rộng → "Mở trang ↗" (2 bấm) | bấm tên ↗ (1 bấm) |
| Xem việc / tình trạng / người / hạn dòng chỉ đọc | mở rộng dòng | đọc ngay trên dòng |

Ảnh: `cap-k2-case-1440.png`, `cap-k2-case-375.png`, `4-dong-chi-doc-link-thang-1440.png`, `4-dong-chi-doc-link-thang-375.png`.
Critique (impeccable, 2 agent tách biệt): vòng 1 = 28/40 · vòng 2 = 31/40, không P0 / P1; bộ dò 0 phát hiện thật trong phạm vi (nested-cards ở dải nhóm, em-dash ở bảng Tổng quan = báo nhầm, có sẵn từ 6b-2). Đã sửa hết P2 / P3 của vòng 2.

## 6c-2 ③ Hộp xác nhận (PTA 28/10: hộp `KhungPanel longTrong` → hộp nhỏ)

| Hộp | TRƯỚC | SAU |
|---|---|---|
| Xoá PA · Kết thúc PA (`MenuXoaPa`) · Xoá Case (`ThaoTacCase`) · Xoá vi phạm (`DeleteViolationConfirm`) · Thu hồi / Rút xử lý (`XemXuLyPanel`) | ngăn 480 đè panel đang mở | `ConfirmDialog` giữa màn, nêu đúng đối tượng; ô lý do đang gõ → ✕ / Esc / nền / Huỷ hỏi "Lý do chưa lưu…" một lần; nút đang chạy nói đúng việc ("Đang xoá…") |

Phép kiểm cũ SL-7 (PR-SL I4: Xoá vi phạm phải là `KhungPanel longTrong`) đổi theo luật M6 mới hơn "không panel chồng panel" (V11 / V19).
Chưa bấm thử trên trình duyệt: vai QL demo không có PA / Case đủ điều kiện Kết thúc / Xoá.

## 6c-2 ④ Bỏ (mã chết, không đổi màn)
Ô số `SoLieu` (0 nơi gọi) · `NutMoDanhSach` · `BangGiaoVienChiNhanh.tsx` · tham số `kqMacDinh` / `trongPanel` của `BangMock` + gỡ phép kiểm cũ chỉ đọc các mã đó (prGv, prS6fB ×2, prBang0).

## Để sau / [XM] hỏi PTA
- **"Một danh sách một kiểu mở" (luật 21/10):** panel số trộn dòng làm được (mở rộng tại chỗ) với dòng chỉ đọc (link ↗) — V11 có coi là ngoại lệ không?
- **Bỏ chưa làm:** `SkillBoard()` và phần bảng `BangSos()` — kéo theo chuỗi hàm phụ + phép kiểm cũ đọc nội dung (panelUx3, prDh, prBang0); hộp "Hướng dẫn nạp lại" chồng Modal (`DemoBar`).
- **Gộp chạm bố cục — để lại có lý do:** QL "Case chưa có PA ›" do chủ SP thêm (XM-3, 23/10) · QL "HV thi tháng này ›" là đường sang trang lọc lớn · TVV khối "Thi thật": gỡ thì cột trái trống → cần thiết kế lại · bảng "Lớp tôi dạy" cuối Công việc: gỡ thì `LopToiDay()` thành mã chết mà 4 phép kiểm cũ đọc thân hàm · ⋯ › Hồ sơ lớp: thao tác V4 giữ có chủ đích (V1) · badge "n bài chờ chấm", Lịch Test ô "bài quá hạn", "Xuất điểm Test", hồ sơ MT hai nút "Lịch sử", Quản trị Sửa (vai) + Sửa thông tin — chưa rà.
- **Gộp mã (không đổi màn) chưa làm:** `?mo-viec=` → `?viec=mgmt:<id>` · ⋯ › Quay lại học → `useQuayLaiHoc` · `NeedsEvaluation` → `NganDanhSach` · `DeleteViolationConfirm` trùng hộp xoá của `ChiTietViPham`.
- **`longTrong` còn lại:** `GvCham` (ô chọn người có danh sách thả — `Modal` thân `overflow` dễ cắt, cần bấm thử) · `NganLichSuBai`, `HopThaoTacMt` (mở từ hộp xếp lịch nổi) · Tạo lớp từ Chuyển tiếp, Việc con (form lớn — nên là view kế, cần thiết kế).
- **Môi trường chụp:** worktree dùng `node_modules` nối ra thư mục gốc → Vite chặn phông (403). Chụp ảnh: tạm thêm `server.fs.allow` (không commit).
