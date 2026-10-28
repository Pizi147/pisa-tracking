# RA-UI-2 — thang tiêu đề: panel · hộp · trang · khối

Loại PR: **sửa nhỏ** (chỉ cỡ / độ đậm chữ tiêu đề qua thành phần chung; không đổi bố cục, không đổi thao tác). Nguồn: `docs/superpowers/specs/2026-10-29-ra-soat-dem/ra-ui.md` mục 2 (b1–b4).

## Bốn tầng sau PR (DESIGN G13, V16, V21; mockup `thiet-ke/v5/v5-nen.css` `.h-trang` 22 · `.h-khoi` 17 · `.panel-dau h2` 17)
| Tầng | Trước | Sau |
|---|---|---|
| Trang (h1) | 22 — riêng Cuối khoá 17 | 22 mọi trang (`text-xl`; 3 trang viết thô `text-[22px]` đổi sang token, cùng cỡ) |
| Panel — đầu một dòng (`KhungPanel` không `dau`) | 14 / 700 | **17 / 700** = đầu panel v3 và mockup `.panel-dau h2` |
| Hộp (`Modal`, `ConfirmDialog`) | 14 / 600 | **17 / 700** (cùng tầng tiêu đề panel) |
| Khối (`Card`) | 17 / 700 — riêng "GV chấm quá hạn" (Tổng quan Admin) 15 / 600 | 17 / 700 mọi khối |

## Ảnh (TRƯỚC = cùng trang, gán lại đúng lớp CSS cũ của bản main — máy chủ dev không phải tải lại)
| Tệp | Nội dung |
|---|---|
| `panel-xuat-1440-toi.png`, `panel-xuat-375-sang.png` | panel đầu một dòng (Học viên & Lớp › Xuất Excel) |
| `hop-demo-1440-toi.png`, `hop-demo-375-sang.png` | hộp `Modal` (Công cụ demo — cùng thành phần với mọi hộp xác nhận) |
| `cuoi-khoa-1440-toi.png` | h1 Cuối khoá 17 → 22 (mockup `v6/v6-chung.css` `.dau-hs h1` 22) |

## KHỚP / KHÁC
| # | Chỗ | Mockup | Web SAU | |
|---|---|---|---|---|
| 1 | Tiêu đề panel | 17 / 700 | 17 / 700 (cả đầu một dòng) | KHỚP |
| 2 | Tiêu đề h1 Cuối khoá | 22 / 700 | 22 / 700 | KHỚP |
| 3 | Tiêu đề khối Tổng quan Admin | 17 / 700 | 17 / 700 | KHỚP |
| 4 | Tiêu đề hộp | (mockup không vẽ hộp riêng) | 17 / 700 theo tầng panel | — |

## Thao tác TRƯỚC → SAU
Không đổi: không thêm / bớt / dời nút nào; chỉ cỡ chữ tiêu đề.

## Đã xét, giữ nguyên
- Tiêu đề "Ý thức & Phối hợp" trong tab cùng tên (hồ sơ HV / lớp): mockup M7 `v7/ho-so-hv-y-thuc.html` (đã duyệt 28/10) có đúng h2 này → giữ.
- Số đậm trong dòng đếm đầu Công việc ("**4** nhóm · **12** việc…"): mockup `v7/cong-viec-2.html` cũng in đậm → giữ.
