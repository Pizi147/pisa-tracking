# DAT-XANH-LA — "Đạt" ở Cuối khoá theo mockup (xanh lá)

Chủ SP 24/11 (plan.md 599 mục 3, trước đó [XM-15] PR-5). Mockup `thiet-ke/v23/cuoi-khoa.html` vẽ `.so-f.dat` / `.kq.dat` bằng `--ok` + viền `--ok-vien`, còn web dùng xanh dương `--kq-bang` (MK-6). Đổi sang token **ok sẵn có**, không thêm màu: `--ok-rgb` / `--ok-line-rgb` có giá trị đúng bằng `--ok` / `--ok-vien` của mockup (tối 148 209 174 / 73 117 92 · sáng 56 103 76 / 124 178 147).

## Truy vết khung → thành phần → ảnh

| Khung | Ý | Thành phần (`CuoiKhoaLop.tsx`) | Ảnh | Khớp |
|---|---|---|---|---|
| K1, K3 | Ô Final / MT0 đạt: "✓ 78 %" chữ + viền xanh lá | `VIEN_DAT` → `--ok-rgb` / `--ok-line-rgb` | `k1-1440-toi.png`, `k3-375-sang.png` | KHỚP |
| K1 hộp điểm | Ô kỹ năng đạt trong hộp (L / R / W / S) | `hopDiemCua` dùng chung `VIEN_DAT` | `k1-hop-1440-toi.png` | KHỚP |
| K1, K3 | Cột Kỳ vọng FT "✓ Đạt" xanh lá | `oKv` `text-kq-bang` → `text-ok` | (seed không có em đã có MT0 đạt) | KHỚP theo mã |
| — | Nút chọn "Đạt" (sửa kỳ vọng tại dòng, thanh áp) khi đang chọn | `border-doing text-kq-bang` → `border-ok-line text-ok` | — | ĐỒNG BỘ (mockup không vẽ; một nghĩa một màu) |
| K1, K3 | "Head cân nhắc" (chữ mờ) · "Không đạt" / ✗ (đỏ) | không đổi | các ảnh | GIỮ |

Chỉ đổi trong Cuối khoá. Luật màu chung (DESIGN mục kết quả: ✓ xanh dương = bằng kỳ vọng) vẫn áp ở các màn khác; phép kiểm MK-4 (`prMauKq`) có ngoại lệ chỉ cho `CuoiKhoaLop.tsx`.

## Thao tác TRƯỚC → SAU
Không đổi thao tác (chỉ đổi màu).
