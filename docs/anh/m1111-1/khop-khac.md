# M1111-1 · Dải "Việc của tôi" hồ sơ lớp — khớp / khác mockup

Mockup đã duyệt: `thiet-ke/2026-11-11-mockup-1111/1-dai-viec-cua-toi.html` (#1326, chủ SP duyệt 11/11). Ảnh cặp: `cap-1440.png` (khung K1, GVCN Trần Ngọc Hà · MB FT 101) · `cap-375.png` (khung K4a).

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Mã | Ảnh | Kết quả |
|---|---|---|---|---|
| K1 | 3 ô cùng cao 40 px, một dòng: tên việc · phần phụ · hạn chữ | `ThanhViecLop.tsx` `OViec`, `shared/domain/gopViec.ts` `tachViec` | cap-1440 | KHỚP |
| K1 | "+n việc ở Công việc ›" dưới nhãn "Việc của tôi · n" | `ThanhViecLop.tsx` | cap-1440 | KHỚP |
| K1 | viên "bài chờ chấm" / "việc quá hạn **của lớp**" lên hàng tiêu đề | `DauTrangLop.tsx` `badgeLopNode` | cap-1440 | KHỚP |
| K2 | bấm ô → `PanelViec` tại trang; chi tiết (tên em, điểm SOS) chỉ ở panel | `ThanhViecLop.tsx` (bỏ `TheSosViec` khỏi ô) | bấm thử: ô "Ghi kết quả PA" mở panel Case | KHỚP |
| K3 | 1–3 việc: không link "+n"; ô 1/3 hàng | `ThanhViecLop.tsx` | — (seed GV Hà có 28 việc) | KHỚP theo mã |
| K4a | 375: ô xếp dọc, hai dòng cố định 56 px (tên + hạn / phần phụ), link cuối dải | `OViec` lớp `max-lg:h-14` | cap-375 | KHỚP |
| K5 | hồ sơ HV cùng ô việc | — | — | BỎ trong PR này — [XM] chờ PTA / chủ SP |
| — | dữ liệu: K1 mockup dùng 8 việc minh hoạ, web seed có 28 việc (thứ tự máy chủ, gấp nhất trước) | — | cap-1440 | KHÁC có lý do (dữ liệu) |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Mở làm một việc | bấm ô → panel tại trang | GIỮ |
| Việc tiếp sau khi xong | "Việc tiếp ›" theo thứ tự dải | GIỮ |
| Xem hết việc | "+n ở Công việc ›" cuối hàng | GIỮ — "+n việc ở Công việc ›" dưới nhãn (1440), cuối dải (375) |
| Xem tên em + điểm Phối hợp SOS | trong ô (2 lượt) | DỜI vào panel (đủ mọi lượt) |
| Badge "bài chờ chấm", "việc quá hạn" (+ menu "+n việc") | hàng số, sát lề phải | GIỮ — lên hàng tiêu đề; "của lớp" sau số việc quá hạn |
| Tên lớp trong ô | có | BỎ (đang ở chính lớp) |

## Đọc Turso / tốc độ

0 request thêm, cùng `GET /classes/:id/viec-theo-em?chi=toi`. Máy chủ vẫn gửi `theSos` (Công việc dùng cùng thẻ), không đổi câu SQL.

## Ghi chú

- Tên đọc màn của ô: `aria-label` "tên việc, phần phụ, hạn" (trước đây ba phần dính liền nhau).
- Không có chú thích `ponytail:`.
