# NHẸ HƠN · PR-4 LUOI-DIEM — khớp / khác mockup v23

Mockup: `lich-test.html` L1 / L2, `panel-cham-diem.html` C1 / C3. Kế hoạch: `docs/superpowers/plans/2026-11-22-nhe-hon.md` mục PR-4 (+ PTA chốt XM 22/11: thêm `KhoiNo.tsx`, `LuoiNhung.tsx`, tách `PanelNhapDiemTuan`, khối `.lt-*` ở `index.css`).
Ảnh cặp mockup | web (seed, ngày demo 14/09/2026, Playwright Edge, phông Be Vietnam Pro đã nạp): `docs/anh/nh-pr4-luoi-diem/`.

## Bảng truy vết khung → thành phần → ảnh
| Khung mockup (v23) | Thành phần web | Ảnh | |
|---|---|---|---|
| L1: MỘT bộ cột cho mọi bảng lớp (Lớp · Đợt · Hạn chấm · Tiến độ · Trạng thái), bỏ Kỹ năng | `COT_LICH_TEST` = 256 (mũi tên + Lớp) · giãn · 140 · 180 · 180 (`HangLop.tsx`); khối Quá hạn chấm (`KhoiNo.tsx`) cùng `ColLichTest`, bỏ ô Môn | l1 | KHỚP — đo trên ảnh: cột Hạn chấm x = 931 ở Quá hạn chấm và Test tuần này; `do-bang` không lỗi |
| L1: lưới mở cùng cột tên, các lớp thẳng hàng; Kết quả trùng cột Trạng thái | `.lt-luoi` (td lưới trong `HangLop` / `KhoiNo`): cột tên 256 (tên em thẳng mã lớp, đệm 36), ô điểm chia đều, cột cuối 180 | l1 | KHỚP (≥ 1024; < 1024 giữ thẻ / lưới cuộn như cũ) |
| L1: hạn chấm = ngày dd/mm/yyyy tô màu, không chip "Quá hạn n ngày" | `<Han loai="nhap-diem">` (PR-1, `mucHan`: đỏ + ⚠ / vàng / thường) ở cả hai khối; lớp xong → trống (giữ) | l1 | KHỚP — web ghi "hạn 23/09/2026" (chữ "hạn" từ `<Han>` của PR-1), mockup chỉ ngày |
| L1: tiến độ = số + vạch xám mảnh | `TienDo` thêm `ti` → `<i>` vạch 56 px, không màu (`.lt-td > i`) | l1 | KHỚP |
| L1: trạng thái là chữ (≤ 1 điểm màu / hàng) | `.lt-vien` → chữ, không viên / chấm; "Chờ bạn chấm" đậm, "✓ Đã chấm" xanh | l1 | KHỚP |
| L1: W1 / W2 tách | lưới FT sẵn có | l1 | GIỮ |
| L1: lưới không có cột W / Kỳ vọng | lưới web giữ cột W (máy tính, XM-6) và Kỳ vọng | l1 | KHÁC — giữ dữ liệu đã có (không bỏ tính năng) |
| L2: 375 thẻ hai dòng, lưới 4–5 ô | thẻ lớp ⑦ A6 sẵn có (bỏ chip môn ở dòng phụ); lưới 375 dạng thẻ từng em sẵn có | l2 | KHỚP phần thẻ; lưới 375 giữ dáng cũ (đã duyệt, không tràn ngang) |
| C1: panel bảng ~75 % | `PanelNhapDiemTuan` + `PanelNhapDiemLop` → `KhungPanel rong="bang"` | c1, c1b | KHỚP |
| C1: mỗi lớp một khối, đầu nổi (lớp · đợt + tuần · kỹ năng của bạn · số bài) | `.pc-kl` / `.pc-kl-dau` (nền surface-2, vạch nhấn trái 3 px, mã 16 / 700); bấm đầu khối gập / mở | c1 | KHỚP — một lớp: giữ dáng GD-3 (tên việc + "lớp · tuần · còn n / m" ở đầu panel, lưới ngay dưới) |
| C1: ô 88 · Kết quả 168 · tên lấy phần còn lại | `LuoiFT` trong panel: ô 112 → 88, Kết quả 132 → 168 | c1b | KHỚP |
| C1: ô đã huỷ có chip, "−" vắng | `ChipDaHuy` (#1979) · ô vắng sẵn có | l1 (lưới Quá hạn: "Đã huỷ") | GIỮ |
| Khối "Em này còn" | không còn ở web (grep rỗng) | — | KHỚP sẵn |
| C3: 375 toàn màn | `KhungPanel` 375 toàn màn (PR-1) · khối lớp xuống dòng, không cắt | c3 | KHỚP |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| ‹ tuần › · Tuần này · Tất cả / Fast Track / Lớp thường · Mở tất cả lớp · Lịch thi thật › · Xuất Excel… | có | có | GIỮ |
| Bấm hàng lớp → lưới dưới hàng (tải khi tới gần, #1969) | có | có | GIỮ |
| Khối Quá hạn chấm: Nhập điểm / Xem / Thu gọn · hỏi trước khi đóng lưới còn ô chưa lưu | có | có | GIỮ |
| Bấm ô → hộp nhập (Vắng · Lưu · bài tiếp ›) · Lớp tiếp › · Việc tiếp › | có | có | GIỮ |
| Link lớp / em / đợt ("MT3 ›") · "Còn chờ: …" | có | có | GIỮ |
| Cột "Môn / Môn của bạn" ở Lịch Test | có | bỏ (chủ SP vòng 2 ý 3) — kỹ năng của mình vẫn thấy trong lưới (ô sửa được) và ở đầu khối panel chấm | BỎ (không phải thao tác) |
| Panel chấm nhiều lớp: gập / mở từng lớp | dòng chữ nhỏ | khối đầu nổi, cùng thao tác | GIỮ |

## [XM] / để sau
- **Panel 75 % đè danh sách Công việc:** đầu nhóm dính của danh sách bên trái (`HoTroHocVienTab.tsx`, cột min(556 px, 42vw − 48 px)) vẽ đè lên panel `rong="bang"` ở 1440. **PR-2a sửa** (PTA giao 23/11: đầu nhóm dính không đè + cột trái ~330 px khi panel rộng bảng). PR-4 không đụng `HoTroHocVienTab.tsx`.
- Chữ "hạn" trước ngày ở cột Hạn chấm: do `<Han>` (PR-1) — nếu muốn chỉ ngày như mockup cần prop mới ở `Han.tsx`.

## Turso
Không đổi máy chủ, không thêm request: lưới vẫn chỉ tải khi mở / tới gần; panel chấm vẫn chỉ tải lớp đang mở.
