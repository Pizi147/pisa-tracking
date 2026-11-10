# Chuông V2 — mockup 11/11 (chờ chủ SP duyệt)

- Mockup: `chuong-v2.html` (1440 + 375, tối; mở qua máy chủ tĩnh `thiet-ke`, cổng 5480). Ảnh: `anh/`.
- Recon loại tin · vai · giữ / bỏ · dòng đọc: `bang-tin.md`.
- Trong HTML: bảng ý chủ SP → chỗ, bảng thao tác TRƯỚC → SAU, [XM-1…3] hỏi PTA Plan.

## Ảnh

| Tệp | Khung |
|---|---|
| `a-truoc-sau.png` | Trước (Header.tsx hiện tại) · Sau — cùng một GVCN |
| `b1-gv.png` | GV: nhiều loại việc, quá hạn, hôm nay, việc mới; Để biết chưa đọc / đã đọc |
| `b2-ql-hai-cn.png` | QL hai chi nhánh: hàng chi nhánh, Duyệt yêu cầu |
| `b3-quan-tri.png` | Quản trị ba chi nhánh, Duyệt tài khoản, không quá hạn |
| `b4-khong-viec.png` · `b5-rong.png` | Không việc (có / không Để biết) |
| `b6-xem-tat-ca.png` | Xem tất cả Để biết (thay nội dung hộp tại chỗ) |
| `b7-tai-loi.png` | Việc đang tải · Để biết lỗi tải |
| `c-375.png` · `c4-375-xem-tat-ca.png` | 375: GV · QL · TVV · Xem tất cả |

## Rà (11/11)

- impeccable critique (2 agent độc lập): **33/40, không P0**. Đã sửa P1: bỏ số ở "Xem tất cả" (dễ nhầm với số việc) · "● n mới" luôn ở hàng phụ dưới tên, mọi dòng cao 48 px · tin Để biết một hàng + dấu cắt (đủ chữ ở Xem tất cả, `title`) · 375 đủ chỗ cho Để biết.
  Giữ: "Chưa có người phụ trách" xuống 2 hàng ở 375 (tên loại dài nhất; một khái niệm một tên — không đặt tên tắt riêng cho chuông).
- Bộ dò impeccable: 0 lỗi giao diện; chỉ cảnh báo token (bán kính 10 px hộp, màu chữ trên chip đỏ) — khi code dùng token / lớp `card` của web.
- ui-ux-pro-max: nhãn nút chuông đọc đủ ý ("Thông báo, 11 việc cần làm, 3 quá hạn"), chip không xuống dòng.
