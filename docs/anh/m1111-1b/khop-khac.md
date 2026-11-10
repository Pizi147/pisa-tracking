# M1111-1b · Hồ sơ HV — cùng ô "Việc của tôi" một dòng với hồ sơ lớp

Mockup đã duyệt: `thiet-ke/2026-11-11-mockup-1111/1-dai-viec-cua-toi.html` khung K5 (#1326, chủ SP duyệt cả tệp 11/11 — PTA Plan xác nhận). Ảnh cặp: `cap-1440.png` (K5a) · `cap-375.png` (K5b) — web: hồ sơ Lý Minh Châu (seed, GVCN Trần Ngọc Hà).

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Mã | Kết quả |
|---|---|---|---|
| K5a | nhãn "Việc của tôi · n" + ô cao 40 px một dòng: tên việc = nhãn hành động · phần phụ (kỹ năng, kỳ, PA) · hạn | `DauHoSo.tsx` `ThanhViec`, `OViec` | KHỚP |
| K5a | cả ô là nút (bỏ nút "Ghi kết quả" riêng + ô 2 dòng) | `OViec` | KHỚP |
| K5a | "n việc khác của tôi ▾" mở thêm tại chỗ, dưới nhãn | `ThanhViec` `nutCon` | KHỚP |
| K5b | 375: ô hai dòng cố định 56 px, "n việc khác" cuối dải | `OViec` `max-lg:h-14` | KHỚP |
| — | hạn dùng `HanViec` sẵn có của hồ sơ HV ("hạn 14/09 · hôm nay"; quá hạn "⚠ quá hạn n ngày") | `HanViec` | KHÁC nhỏ: hôm nay chưa có ⚠ như dải lớp — giữ thành phần hạn chung của hồ sơ HV |
| — | dữ liệu mockup (4 việc) ≠ seed (1–2 việc) | — | KHÁC có lý do (dữ liệu) |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Làm một việc | nút động từ trong ô (việc gấp nhất nút chính) | bấm cả ô — cùng đích (`onLam`: cột Case & PA / ngăn Case / tab Ý thức / panel) |
| Xem thẻ kỳ / PA | thẻ phụ dưới tên việc | phần phụ cùng dòng (cắt "…", đủ ở `title`) |
| Xem thêm việc | "n việc khác của tôi ▾" mở tại chỗ | GIỮ |
| Việc không mở tại hồ sơ (`mo = null`) | ô không nút | GIỮ (ô không bấm) |
| Nút chính cho việc gấp nhất | có | BỎ — mọi ô cùng dáng (một danh sách một kiểu mở); việc gấp nhất vẫn đứng đầu, vạch đỏ |

## Đọc Turso / tốc độ

0 request thêm — cùng dữ liệu `viec` của hồ sơ HV đã nạp.

## Ghi chú

- Dùng chung dáng với `ThanhViecLop` (#1334) bằng cùng lớp Tailwind; chưa tách thành phần chung vì #1334 chưa merge (mỗi PR cắt từ main) — gộp khi cả hai đã vào main.
- `aria-label` "tên việc, phần phụ" cho ô.
