# Chuông V2 — mockup 11/11 · vòng 2 (chờ chủ SP duyệt khối Cập nhật)

- Mockup: `chuong-v2.html` (1440 + 375, tối; mở qua máy chủ tĩnh `thiet-ke`, cổng 5480). Ảnh: `anh/`.
- Recon loại tin · vai · giữ / bỏ · dòng đọc: `bang-tin.md`.
- Trong HTML: bảng ý chủ SP → chỗ (vòng 1 + 2), bảng thao tác TRƯỚC → SAU, mục "Đã chốt" (XM-1…3).

## Vòng 2 (chủ SP 11/11: "1. Dùng số chung 2. … 'để biết' nên đổi tên khác 3. … sửa lại bố cục cấu trúc cho rõ ràng và đẹp hơn")

- Số trên chuông = badge Công việc (việc cần làm ngay = quá hạn + hôm nay). Đầu khối việc: "⚠ 3 quá hạn · 1 hôm nay · 11 việc" (hai số đầu cộng = số chuông). Khối việc còn lại giữ như vòng 1 (đã duyệt).
- "Để biết" → **Cập nhật**. Mỗi tin hai hàng: loại tin · giờ, rồi nội dung (kết quả đứng đầu, có màu + chữ: Đã duyệt / Từ chối / Chưa thi hành được) · "›" như dòng việc · chưa đọc = chấm + chữ sáng · "n chưa đọc" ở đầu khối.
- Xem tất cả: nhóm Hôm nay / Hôm qua / Tuần này / Trước đó (đầu nhóm dính khi cuộn), nội dung tối đa 2 hàng, "Đánh dấu đã đọc" thành nút chữ.
- Ảnh trước | sau khối này: `anh/cap-nhat-truoc-sau-1440.png`, `anh/cap-nhat-truoc-sau-375.png`.

## Ảnh

| Tệp | Khung |
|---|---|
| `a-truoc-sau.png` | Trước (Header.tsx hiện tại) · Sau — cùng một GVCN |
| `b1-gv.png` | GV: nhiều loại việc, quá hạn, hôm nay, việc mới; Cập nhật chưa đọc / đã đọc |
| `b2-ql-hai-cn.png` | QL hai chi nhánh: hàng chi nhánh, Duyệt yêu cầu |
| `b3-quan-tri.png` | Quản trị ba chi nhánh, Duyệt tài khoản, không quá hạn |
| `b4-khong-viec.png` · `b5-rong.png` | Không việc (có / không Để biết) |
| `b6-xem-tat-ca.png` | Xem tất cả Cập nhật (thay nội dung hộp tại chỗ) |
| `b7-tai-loi.png` | Việc đang tải · Cập nhật lỗi tải |
| `c-375.png` · `c4-375-xem-tat-ca.png` | 375 (khung 812): GV · QL · TVV · Xem tất cả |
| `cap-nhat-truoc-sau-1440.png` · `cap-nhat-truoc-sau-375.png` | khối Cập nhật + Xem tất cả: vòng 1 | vòng 2 |

## Rà vòng 2

- impeccable critique (2 agent độc lập, phạm vi khối Cập nhật + số chuông): **30/40, không P0**. Tên "Cập nhật": giữ ("Tin mới" lẫn với "● mới" của việc; "Hoạt động" / "Thay đổi" mơ hồ hơn). Đã sửa P1: dòng tin có "›" như dòng việc (một danh sách một kiểu mở) · "Đánh dấu đã đọc" thành nút chữ · đầu khối việc xếp quá hạn + hôm nay trước (thấy 4 = 3 + 1) · 375 dòng 48 px, khung 812. Giữ: tin thứ 3 ở 375 phải cuộn (hộp 70 vh).
- Bộ dò impeccable: không phát hiện mới ở khối Cập nhật.

## Rà vòng 1 (11/11)

- impeccable critique (2 agent độc lập): **33/40, không P0**. Đã sửa P1: bỏ số ở "Xem tất cả" (dễ nhầm với số việc) · "● n mới" luôn ở hàng phụ dưới tên, mọi dòng cao 48 px · tin Để biết một hàng + dấu cắt (đủ chữ ở Xem tất cả, `title`) · 375 đủ chỗ cho Để biết.
  Giữ: "Chưa có người phụ trách" xuống 2 hàng ở 375 (tên loại dài nhất; một khái niệm một tên — không đặt tên tắt riêng cho chuông).
- Bộ dò impeccable: 0 lỗi giao diện; chỉ cảnh báo token (bán kính 10 px hộp, màu chữ trên chip đỏ) — khi code dùng token / lớp `card` của web.
- ui-ux-pro-max: nhãn nút chuông đọc đủ ý ("Thông báo, 11 việc cần làm, 3 quá hạn"), chip không xuống dòng.
