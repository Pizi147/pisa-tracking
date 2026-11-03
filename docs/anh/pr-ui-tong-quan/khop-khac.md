# UI-CONG-VIEC · U09 Tổng quan + menu tài khoản — khớp / khác (mockup `thiet-ke/v11/tong-quan.html`, chủ SP duyệt 03/11)

Ảnh cặp (trái mockup · phải web, demo 14/09/2026, seed nguyên; `document.fonts.check('600 14px "Be Vietnam Pro"') = true`):
`a-ql-1440.png` · `a-ql-375.png` · `c-gv-1440.png` · `c-gv-375.png` · `d-tvv-1440.png` · `d-tvv-375.png` · `f-menu-gv-1440.png` (menu, web).

## Truy vết khung → thành phần → ảnh
| Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| A QL · Fast Track | `TongQuanQlV5` (Đạt MT "2/3 HV · 8 chưa đủ dữ liệu", Điều hướng bỏ số) · `LopCanChuY` (đơn vị "Case" / "HV" dưới số) · `GvCanChuY` → "Giáo viên · kỳ · bài chấm quá hạn lên đầu", sắp quá hạn trước, cột "Kết quả PA đúng hạn" · "Bài chấm quá hạn" ("bài" cả khi 0) | a-ql | KHỚP |
| B QL · Lớp thường · Học thuật | cùng thành phần A (công tắc giữ) | — | KHỚP (không đổi) |
| C GV | `TongQuanGvV5` (Điều hướng "Việc của tôi") · `LopToiDay` ("bài quá hạn", "bài · hạn 23/09"; Dưới kỳ vọng / Thi tháng này "HV", Case "Case") | c-gv | KHỚP |
| D TVV | `TongQuanTvvV5` (Thi thật + Điều hướng bỏ số) | d-tvv | KHỚP |
| E Rỗng | trạng thái sẵn có (V8) | — | GIỮ |
| F Menu tài khoản | `Header.tsx`: tên 15 / 700 · vai 13 · Góc nhìn (phạm vi bên phải dòng) · bỏ khối GVCN + Kỹ năng được phân công (G3 — có ở Hồ sơ GV); "Phạm vi được cấp" chỉ khi một vai (không có Góc nhìn); nút 36 px | f-menu | KHỚP |
| QT / CX (ngoài khung) | `TongQuanQtV5` / `TongQuanCxV5`: cùng Đạt MT "chưa đủ dữ liệu" + Điều hướng bỏ số (G4 mọi Tổng quan) | — | ĐỒNG BỘ |

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | Trước | Sau |
|---|---|---|
| Fast Track / Lớp thường · chi nhánh | có | GIỮ |
| Bấm số ô chỉ số / bảng → panel đúng tập | có | GIỮ |
| Hành chính / Học thuật | có | GIỮ |
| Tên GV / mã lớp → hồ sơ | có | GIỮ |
| Chờ bạn duyệt → panel · Hộp duyệt › | có | GIỮ |
| Điều hướng → trang đích | có số | bỏ số (G4) |
| Menu: Góc nhìn · Hồ sơ cá nhân · Hướng dẫn · Hồ sơ GV · Quản trị / Bảng quy đổi · Giao diện · Ngôn ngữ · Đăng xuất | có | GIỮ |
| Menu: GVCN · Kỹ năng được phân công | có | sang Hồ sơ GV (G3) |
| Mới dùng PISA? Xem · Ẩn | có | GIỮ (#14) |

## Đọc Turso
Không thêm request, không đổi API. Bảng GV sắp lại trên dữ liệu đã nạp.
