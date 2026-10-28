# RA-UI-4 — Lịch Test 768–1023 (Quá hạn chấm) · Kế hoạch Test 375 (nút xuất / xếp)

Loại PR: **sửa nhỏ** — PTA Plan quyết 29/10 (ra-ui.md mục 5 "còn mở" 1, 3). Chồng trên #676 (cùng tệp `KeHoachTestTab.tsx`) — merge SAU #676.

## Ảnh
| Tệp | Nội dung |
|---|---|
| `qua-han-900-toi.png` | TRƯỚC \| SAU — bảng Quá hạn chấm ở 900 px |
| `kht-375-sang.png` | TRƯỚC (#676) \| SAU — hàng nút Kế hoạch Test 375 |

## Sửa
| # | Chỗ | Trước | Sau |
|---|---|---|---|
| 1 | Lịch Test › Quá hạn chấm, 768–1023 px | 8 cột cố định (~800 px) không vừa: cột "GV chấm" co về 0, tên GV xuống dòng từng chữ chồng dưới chip trạng thái, nút "Nhập điểm" bị che ở 800 | dùng dáng hai cột sẵn có của điện thoại: "lớp · đợt · kỹ năng" / "còn · hạn · trạng thái" / dòng phụ "GV chấm: …" + nút bên phải — đủ thông tin (PTA đồng ý "cột GV chấm vào dòng phụ") |
| 2 | Kế hoạch Test 375 | "51 học viên · Xuất ▾ · Xếp nhiều MT…" canh phải | "Xuất ▾ · Xếp nhiều MT…" sát trái như mockup `v7/ke-hoach-test.html`; "51 học viên" giữ, chữ nhỏ, cuối hàng |

≥ 1024 px: không đổi (8 cột như cũ).

## Thao tác TRƯỚC → SAU
| Màn | TRƯỚC | SAU |
|---|---|---|
| Quá hạn chấm | Nhập điểm / Xem / Thu từng dòng, link mã lớp (≥ 1024) | giữ đủ; 768–1023 dòng thẻ như điện thoại; mã lớp là link hồ sơ ở cả dáng thẻ (trước đây dáng thẻ điện thoại chỉ là chữ — nay thêm link, không mất thao tác) |
| Kế hoạch Test 375 | Xuất ▾ (Excel, điểm Test) · Xếp nhiều MT… | giữ đủ |
