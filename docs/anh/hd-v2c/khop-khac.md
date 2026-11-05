# HD-V2 PR (c) — khớp / khác mockup v14

Mockup: `thiet-ke/v14/huong-dan.html` trạng thái D (TVV · Tuần của tôi). Ảnh cặp (trái mockup | phải web): `d-1440-toi.png`, `d-375-sang.png`; ảnh web riêng `*-web.png`. CX Hồ sơ HV và trang `/huong-dan` không có khung mockup (nội dung vai + trang theo đặc tả 3.7) — chỉ ảnh web. Phông: `document.fonts.check('600 15px "Be Vietnam Pro"')` = true ở mọi ảnh. Demo: TVV Phan Mai (27), CX Vũ Thanh Tâm (24).

## 1. Truy vết
| Khung | Thành phần | Ảnh | Kết luận |
|---|---|---|---|
| D · Tuần của tôi theo nhịp, dòng gập / mở tại chỗ | `TabTuan` + `shared/huongDan/tvv.ts` | d-1440-toi, d-375-sang | KHỚP |
| D · mỗi dòng gập có chữ nhạt = lối chính | `DongViec` | d | KHỚP |
| CX · Hồ sơ HV, Màn này (Kết quả thi thật là việc đầu) | `TabManNay` + `cx.ts` | cx-ho-so-hv-1440-toi-web | không có mockup |
| Trang `/huong-dan` ba phần như ba tab | `HuongDanPage` (dùng lại `DsNhom`, `TabTuan`, `TheoMan`) | trang-1440-toi-web | không có mockup |

## 2. Khác (có lý do)
1. Mockup D mở sẵn dòng "Báo PH vi phạm" làm ví dụ; web không mở sẵn dòng nào ở Tuần của tôi (như PR a).
2. Mockup D: "Mỗi sáng" 2 việc; web thêm "Lọc nhóm em cần theo dõi" (Học viên & Lớp › lọc).
3. Mockup ghi "Hồ sơ HV › ⋯ › Tạm dừng/ Kết thúc học"; mã main: TVV / CX thấy NÚT trên đầu hồ sơ (`vaiXemHocVien`), không có ⋯ → web ghi "Hồ sơ HV › Tạm dừng/ Kết thúc học". Phép HD-VAI-C đối chiếu với `NHAN_VIEC_QUAN_LY` / `NHOM_CV_TVV_LABEL`.
4. Trang `/huong-dan`: thứ tự Tôi muốn… · Tuần của tôi · Theo màn, rồi Luật và hạn · Thuật ngữ (giữ, panel không có). `?phan=viec` cũ rơi về Tôi muốn….

## 3. Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Hướng dẫn TVV / CX / HT | viết theo màn (việc hằng tuần cũ, mượn `gvCu.ts`) | một lối chính mỗi việc, Tuần của tôi, Không làm ở đây |
| Trang `/huong-dan` | 4 phần cũ | Tôi muốn… · Tuần của tôi · Theo màn + Luật + Thuật ngữ; in cả trang |
| Tìm, Chỉ cho tôi, Xem vai khác (QL/QT) | có | giữ |
