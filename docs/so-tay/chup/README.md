# Chụp ảnh sổ tay

Ảnh trong sổ tay Giáo viên được chụp tự động từ bản demo, có khung đỏ và số khoanh vùng. Khi giao diện đổi, chạy lại để cập nhật ảnh.

```bash
npm run seed                      # hoặc PISA_DB=data/pisa-so-tay.sqlite npm run seed để không đè DB demo
PISA_DB=data/pisa-so-tay.sqlite PORT=4000 npm run dev    # nền
npm i --no-save playwright        # cần Chrome cài sẵn (kênh 'chrome')
node docs/so-tay/chup/chay.mjs            # chụp tất cả
node docs/so-tay/chup/chay.mjs g-07       # chỉ ảnh có id bắt đầu bằng g-07
```

Mỗi ảnh khai trong `fig-*.mjs`: `{ id, user, url, buoc?, vung?, marks: [{ n, loc, ghi }] }`. `ghi` là chú thích của số `n` (sổ tay lấy chú thích từ đây). **Chỉ đọc**: không bấm Lưu/Xác nhận/Gửi. Ảnh ra ở `docs/so-tay/anh/`.
