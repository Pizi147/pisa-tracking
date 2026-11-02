# TAI-NHANH 02/11 — đo tải web trước / sau

Cách đo: `vite build` → `vite preview` cổng riêng (gốc = origin/main 5bdc99ef2, cổng 5371; PR, cổng 5370), API demo cục bộ cổng 4370.
Kích thước gzip tính bằng `zlib.gzipSync` mức 9 trên tệp trong `dist/web/assets` (Netlify nén br / gzip — số thật còn nhỏ hơn chút).
"Trang đầu" = các tệp JS tải trước khi request API cuối của trang đầu xong (sau đó `NAP_SAN` nạp ngầm các trang còn lại, không chặn).

## Hiện trạng khi bắt đầu (khác khảo sát của PTA)
- Trang ĐÃ tách gói từ PR-TOCDO: 14 trang qua `lazyTai` (`web/src/lib/taiLaiManh.ts`, bọc `React.lazy`) — tìm chữ `lazy(` thấy 0 vì tên hàm khác.
- Gói chính 1 071 KB vì: từ điển tiếng Anh `shared/i18n/en/*` (~28 % mã nguồn của gói, nạp cả khi trang tiếng Việt) + `shared/domain` (~33 %) + react / router.
- Phông: 5 weight Be Vietnam Pro (400–800) đều có dùng (800 = chữ "PISA" ở thanh trên); fontsource đã `font-display: swap` + `unicode-range`
  → trình duyệt chỉ tải tệp woff2 của weight + bộ chữ đang hiện. Chỗ thừa: chữ số Inter (xem TAI-NHANH-4).
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

## PR TAI-NHANH-3 (#796) — Header đọc `/ref/classes` khi gõ tìm
`/ref/classes` (mọi lớp active cả hệ thống + đếm ghi danh từng lớp) bị gọi ở MỖI lần mở trang chỉ để gợi ý lớp ở ô tìm. Nay gọi khi gõ ≥ 2 chữ.

| Trang đầu (phép tocDo `TAI_TRANG`) | Trước | Sau |
|---|---|---|
| QL | 114 câu / 8 GET | 111 / 7 |
| GV (GVCN / GVBM cùng trang) | 128 / 7 | 125 / 6 |
| TVV | 83 / 6 | 80 / 5 |
| CX | 115 / 6 | 112 / 5 |
| Admin | 50 / 6 | 47 / 5 |

Request trùng (cùng URL hai lần) ở trang đầu 5 vai: không có (đo bản build, trình duyệt). `/me/profile` thấy lúc đo là PATCH đồng bộ tiếng
khi tiếng máy ≠ tiếng tài khoản, không phải GET thường. Sau khi lưu: đã có `invalidateGop` (gộp 1,5 s) + vô hiệu theo tiền tố; `invalidateAll` chỉ khi đổi tài khoản.

## PR TAI-NHANH-4 — chữ số Inter cắt còn 0–9
Chữ số lấy từ Inter qua `unicode-range: U+0030-0039`, nhưng tệp là cả bộ latin (~24 KB / weight). Cắt bằng fontTools (`pyftsubset`, giữ mọi tính năng
số: tnum, pnum, frac…) → ~2,7 KB / weight, tệp riêng (không nhúng vào CSS). Tải phông trang đầu QL: Inter 4 tệp ~95 KB → 13 KB (−82 KB);
toàn bộ phông 16 tệp 280 KB → ~200 KB. Kiểm hình: độ rộng chuỗi số 5 weight × (thường / tabular-nums) bằng hệt trước; ảnh vùng ô số Tổng quan
trước / sau trùng từng byte.

## Đã thử, KHÔNG làm (lợi ít)
- Bỏ barrel `@shared/domain/index.ts` ở 21 tệp của gói chính: gói chính 558 → 513 KB nhưng JS trang đầu QL không đổi (gzip 249 = 249 KB) —
  Tổng quan cần đúng các mô-đun đó, chỉ dời từ gói chính sang mảnh trang.
- `treeshake.moduleSideEffects: false` cho `shared/`: −46 KB, rủi ro bỏ nhầm mô-đun có tác dụng phụ.
- Nạp ngầm trang theo vai (`NAP_SAN`): nạp đủ 14 trang ≈ 500 KB gzip mỗi người MỘT lần mỗi deploy (đã cache 1 năm); lọc theo vai chỉ bớt ~60 KB.
- Preload phông: tệp phông bắt đầu tải ~160 ms (máy cục bộ) cùng lúc CSS; preload đúng tệp cần biết weight + bộ chữ trước khi vẽ, lợi nhỏ.
