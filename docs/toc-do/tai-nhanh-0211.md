# TAI-NHANH 02/11 — đo tải web trước / sau

Cách đo: `vite build` → `vite preview` cổng riêng (gốc = origin/main 5bdc99ef2, cổng 5371; PR, cổng 5370), API demo cục bộ cổng 4370.
Kích thước gzip tính bằng `zlib.gzipSync` mức 9 trên tệp trong `dist/web/assets` (Netlify nén br / gzip — số thật còn nhỏ hơn chút).
"Trang đầu" = các tệp JS tải trước khi request API cuối của trang đầu xong (sau đó `NAP_SAN` nạp ngầm các trang còn lại, không chặn).

## Hiện trạng khi bắt đầu (khác khảo sát của PTA)
- Trang ĐÃ tách gói từ PR-TOCDO: 14 trang qua `lazyTai` (`web/src/lib/taiLaiManh.ts`, bọc `React.lazy`) — tìm chữ `lazy(` thấy 0 vì tên hàm khác.
- Gói chính 1 071 KB vì: từ điển tiếng Anh `shared/i18n/en/*` (~28 % mã nguồn của gói, nạp cả khi trang tiếng Việt) + `shared/domain` (~33 %) + react / router.
- Phông: 5 weight Be Vietnam Pro (400–800) đều có dùng (800 = chữ "PISA" ở thanh trên); fontsource đã `font-display: swap` + `unicode-range`
  → trình duyệt chỉ tải tệp woff2 của weight + bộ chữ đang hiện. Không có gì đáng bớt (xem mục Phông).
- Tầng API (`web/src/lib/useApi.ts`) đã gộp GET đang bay cùng đường, nhớ bản vừa xem 10 s, gộp tải lại sau lưu 1,5 s.

## PR TAI-NHANH-1 (#790) — cache `/assets/*`
- Header cache 1 năm `/assets/*` thật ra đã có ở `public/_headers` (PTA phát hiện sau merge); #790 khai trùng ở `netlify.toml` → TAI-NHANH-2 gỡ, giữ `_headers` một nguồn.
- Phần còn giá trị của #790: mảnh mất → 404 (không rơi xuống `index.html` mang header cache 1 năm).

## PR TAI-NHANH-2 — từ điển tiếng Anh thành mảnh riêng

| Gói | Gốc (raw / gzip) | Sau (raw / gzip) |
|---|---|---|
| `index-*.js` (gói chính) | 1 071 / 366 KB | 558 / 188 KB |
| JS trang đầu QL (Tổng quan, 9 tệp) — tiếng Việt | 1 330 / 421 KB | 758 / 249 KB (−41 %) |
| Mảnh `en-*.js` (chỉ khi trang tiếng Anh) | — | 512 / 177 KB |

- Trang tiếng Anh: tổng như cũ (+1 request `en-*.js` nối sau gói chính).
- Request API trang đầu QL: 8 → 8, không đường nào gọi hai lần (`/demo/session`, `/notifications`, `/ref/classes`, `/yeu-cau/dem`, `/ref/branches`,
  `/tong-quan/v5?ct=ft`, `/phan-tich/giao-vien?...`, `/yeu-cau?hop=cho-duyet...`).
- Thời gian máy cục bộ (không giới hạn mạng, lúc máy đang chạy check — chỉ tham khảo): request API cuối xong ~290–360 ms ở cả hai bản.
  Lợi ích thật nằm ở mạng chậm / máy yếu: bớt 172 KB gzip ≈ 0,9 s ở 1,6 Mbps (3G), và bớt ~510 KB JS phải dịch + chạy trước khi vẽ.
