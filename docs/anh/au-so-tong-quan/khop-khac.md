# AU-SO gói 10 · TONG-QUAN-QL — khớp / khác (AUDIT-1611)

Ảnh: seed, ngày demo 14/09/2026, tối, phông Be Vietnam Pro đã tải (kiểm `document.fonts`), không trang nào cuộn ngang.
- `cap-mockup-web-tong-quan-1440.png` · `-375.png`: mockup `thiet-ke/v21/tong-quan.html` (T1, T7a) | web sau PR (QL Monbay).
- `cap-truoc-sau-*.png`: web trước | sau.

## Bảng truy vết mã → thành phần → ảnh

| Mã | Sửa | Thành phần | Ảnh | KHỚP / KHÁC |
|---|---|---|---|---|
| P1-12 (A2-03) | < 1400 px một cột (Chờ duyệt lên trước, như < 1280 cũ); cột SOS 340 → 372 | `BoCuc`, `COT_LOP` | `cap-truoc-sau-tong-quan-ql-1280` (trước: giấu "Thi tháng này", "Trần Ngọ…"; sau: đủ cột, đủ tên), `-1440` (SOS 3 · 5 không xén) | KHỚP mockup T1 ở 1440; 1280 không có khung mockup — dùng bố cục một cột sẵn có |
| A2-07 | 375: nhãn thẻ lớp 12 px ("Case chưa có PA" một dòng); thẻ GV căn số theo đáy | `LopCanChuY`, `theGv` | `cap-truoc-sau-tong-quan-ql-375`, `cap-mockup-web-tong-quan-375` | KHỚP mockup T7a (`.cap .n` 12 px, `align-content:end`) |
| A2-20 | Chờ duyệt: cột chip loại 96 → 116 px, khoảng 12 | `ChoDuyetTq` | `cap-truoc-sau-tong-quan-ql-1440` | KHỚP mockup T1 (~20 px) |
| A2-11 | Tab mặc định = tab nhiều quá hạn nhất (QL: Việc quản lý · 6, trước: Chờ bạn duyệt · 1) | `tabMacDinh` | `cap-truoc-sau-cong-viec-ql-1440`, `-375` | — |
| A2-12 | Rời "Của tôi" khi ở Chờ bạn duyệt → tab việc của GV (bấm thử: `nhom=duyet` → `nhom=cham-diem`) | `HoTroHocVienTab` | (bấm thử) | — |
| A2-28 | Cột hạn · người gửi 170 → 190 px — "tên · GVBM" một dòng | `HopChoDuyet` | `cap-truoc-sau-cho-duyet-qt-1440` | — |
| A2-15 | "· hiện tại" một cụm | `BaoCao` | `cap-truoc-sau-phan-tich-chi-nhanh-1440` | — |
| A2-17 | Lưu trữ: "‹ Học viên & Lớp" dáng `nut-ve` có viền | `LuuTruPage` | `cap-truoc-sau-luu-tru-1440` | KHỚP mockup ⑩ L1 |
| A2-09 | Trang lượt: một số "✗ 52%" màu kết quả + "→ QL cân nhắc"; bỏ chip "52%" lặp | `LuotThuongPage`, `KetQua anTyLe` | `cap-truoc-sau-luot-116-1440` | — (G12) |

## Không sửa (có lý do)

| Mã | Lý do |
|---|---|
| A2-21 bỏ vạch dọc nhóm bảng GV | [XM] trái chủ SP 14/11 (#1669 "vạch nhóm chạy suốt bảng", `index.css` `data-vn`) — quyết định mới hơn mockup v21. Giữ. |
| A2-10 hộp đếm ngược Ý thức → ChipHan | [XM] hộp "Còn n ngày" + 5 vạch là mockup v20 E chủ SP duyệt 12/11 (`DemNguocYThuc`). Giữ. |
| A2-14 số to 48 / 40 → 28 | Audit nhầm: mockup v21 `phan-tich.css` vẽ `.so-to .gt` 48 px, `.so-thi` 40 px. Web đúng mockup. |
| B3-11 đổi GV một kỹ năng từ dải GV | Thêm thao tác mới (ô chọn GV + hộp hiệu lực tại dải) — tách PR riêng ngay sau PR này (cần nạp ô phân công + phiên bản). |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| QL mở Công việc | tab Chờ bạn duyệt | tab có nhiều quá hạn nhất (bấm tab khác như cũ) |
| QL đang ở Chờ bạn duyệt, bấm "Của GV" / "Tất cả" | vẫn Chờ bạn duyệt (danh sách của QL) | sang tab việc của GV; bấm lại "Chờ bạn duyệt" vẫn được |
| Tổng quan 1280–1399 | hai cột, bảng giấu cột | một cột, Chờ duyệt trên (mọi nút, ô số, link giữ) |
| Trang lượt: bấm số / gợi ý | giữ | giữ |
| Lưu trữ "‹ Học viên & Lớp" | về HV & Lớp | về HV & Lớp (chỉ đổi dáng) |
Không mất thao tác.
