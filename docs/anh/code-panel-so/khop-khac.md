# PR 1 — ô số trơn + khuôn panel 720 + Thi thật (khop-khac)

Mockup: `thiet-ke/v24/phan-tich-panel-so.html` (đã duyệt 24/11). Ảnh cặp: `cap-*.png` (trái mockup, phải web). Demo chỉ có 3 HV thi thật (mockup 42) nên bảng ngắn hơn.

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| A1 Từng kỹ năng / Theo GV 1440 | `KetQuaThi.tsx` BangKyNang, BangGv; `index.css` SO-TRON | cap-a1-1440 | KHỚP: số trơn căn giữa, màu Vượt xanh lá · Đạt xanh dương · Chưa đạt đỏ, % dưới; Theo GV kỹ năng → 2 GV + "+ n GV" từng kỹ năng, không cột Tuần dạy, 5 cột số bằng nhau. KHÁC: dòng 59 → ~50 px (mockup 49); demo ít GV nên không có "+ n GV" |
| A3 375 | cùng | cap-a3-375 | KHỚP bố cục thẻ; KHÁC nhỏ: Theo GV 375 đang là bảng nhóm theo kỹ năng, chưa so từng pixel đầu cột "Chưa đạt" 2 dòng |
| B1 panel 720 | `KhungPanel` `rong="so720"`, `BangSoPanel`, `BangLuotPanel` kiểu thi-that | cap-b1-1440, cap-b1-1280 | KHỚP: đầu một dòng (tên · tổng nhấn · phạm vi · ⓘ ✕), cột Học viên(+lớp) · Ngày thi · [kỹ năng nền nhấn] · Target · Lệch, dòng 48, không chân Đóng, không nền mờ, cao theo nội dung |
| M1 375 | cùng | cap-m1-375 | KHỚP: toàn màn, cột Học viên (lớp · ngày dưới tên) · kỹ năng · Target · Lệch |
| B2 Theo GV | cùng, cột Tuần dạy khi có `tuan` | cap-b2-1440 | KHÁC có chủ ý: mockup vẽ hộp 560, chốt mới = panel 720. Demo không có dữ liệu tuần dạy nên chưa thấy cột Tuần dạy (code sẵn, xếp % cao trước) — [XM] cần dữ liệu để chụp |
| Bảng Tổng thể (không vẽ) | cùng | sau-thi-tong-1440 | [XM] mockup không vẽ: dùng Học viên · Ngày thi · L R W S · OVR(nền nhấn, ✓/✗) · Target |
| Rỗng / lỗi / tải | `BangLuotPanel` (Empty / ErrorState / Skeleton có sẵn) | — | rỗng chưa chụp được (không có ô số 0 bấm được) |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm số mở panel, số 0 không bấm, Esc, ✕, ⓘ, URL `?so-lieu=`, tên → hồ sơ, lớp → hồ sơ lớp, "Xem thêm" | Có | Giữ |
| Nút "Đóng" chân panel Thi thật | Có | Bỏ (✕ + Esc) — quyết định đã chốt |
| Nền mờ + bấm nền để đóng | Có | Bỏ: trang bên trái bấm được, bấm số khác thì đổi panel — đã chốt |
| Tab Chưa đạt / Đạt trong panel Thi thật | Có | Bỏ; xếp Chưa đạt (lệch thấp) lên đầu |
| Hàng chip lớp | Có | Bỏ (lớp dưới tên) — đã chốt |
| Ô điểm trong panel mở hộp Tuần dạy | Có | Bỏ trong panel (bảng trang giữ) — đã chốt |
| Cột Lớp riêng, "dữ liệu đến" | Có | Bỏ (lớp dưới tên; phạm vi ở đầu) |
| Bảng Theo GV: GV → kỹ năng, mọi GV | #2067 phần nào | Kỹ năng → GV, "+ n GV" từng kỹ năng |
| Ô số viền (trừ SOS 1/2/3) | Có | Số trơn |

## Số đo cột (1440, Playwright)
- Panel kỹ năng: 720 × 152, bảng 719, cột 220 · 4 × 125 (khoảng thừa mỗi cột số 0).
- Panel Tổng thể: 176 · 104 · 6 × 73.
- 375: 375 × 795, cột 169 · 3 × 69.

## Chống cắt
`node scripts/kiem-chong-cat.mjs` (1440×900, 1280×800, 1280×520, 375×812, 375×560; ô đầu / cuối, trang cuộn đáy, bảng cuộn ngang hết phải; khung trọn viewport + `elementFromPoint` 4 góc): 25 đạt, 0 hỏng.

## Chưa làm trong PR này (PR 2–3)
SOS, GV, Chi nhánh, Ý thức, Tổng quan, các `kieu` panel khác (luot, tang-giam, ý thức…) còn khuôn cũ; Ý thức 375 dòng 44 px; `KhungPanel` chỉ thêm chế độ `so720`, mặc định không đổi. CSS SO-TRON dùng chung `.o-so-hop` nên cũng đổi số ở hồ sơ GV / Tổng quan.
