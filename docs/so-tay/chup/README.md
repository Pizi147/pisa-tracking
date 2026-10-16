# Sổ tay PDF — chụp ảnh và dựng (PR-SOTAY-2)

Mười PDF ở `docs/so-tay/ban-2026-10/`, dựng từ `noi-dung/*.mjs` + Hướng dẫn trên web (`shared/huongDan/*.ts`, cùng chữ với nút `?`) + ảnh `anh/{vi,en}/`.

```bash
npm ci && npm i --no-save playwright@1.56.1     # Edge cài sẵn (kênh 'msedge')
npm run seed                                     # bộ demo cục bộ của worktree (data/pisa-demo.sqlite), KHÔNG Turso
```

Trước khi chụp, chỉnh bộ demo cục bộ (chỉ DB cục bộ) để ảnh có dữ liệu:

```sql
UPDATE user_roles SET branch_id = 1 WHERE user_id IN (22, 23);   -- Admin, TVV về chi nhánh Monbay
UPDATE students SET consultant_user_id = 23 WHERE id IN (SELECT student_id FROM enrollments e JOIN classes c ON c.id = e.class_id
  WHERE e.status = 'active' AND c.code IN ('MB FT 101', 'MB FT 102', 'MB BE 03'));
-- em 2: đã có kết quả thi thật (chờ bước tiếp); em 3: đã thi, chờ kết quả — đặt exam_date / thi_that_* ở lộ trình mới nhất
```

```bash
PORT=4417 WEB_PORT=5417 npm run dev              # nền; ảnh chụp ở http://localhost:5417 (SO_TAY_BASE đổi được)
node docs/so-tay/chup/chay.mjs [vi|en] [tiền tố id…]   # chụp; ✓ / ⚠ thiếu số / ✗ lỗi
node docs/so-tay/dung/dung.mjs [mã sổ…]          # dựng PDF + kiểm; thoát 1 khi kiểm đỏ
```

- Ảnh khai trong `anh-gv.mjs`, `anh-ql.mjs`, `anh-tvv.mjs`: `{ id, user, url, w?, buoc?, vung?, panel?, marks: [{ n, loc }] }`. FULL 1440 tối; `w: 375` điện thoại sáng. `en: true` = chụp cả bản EN (ảnh `anh/en/`).
- Chọn phần tử theo vai trò / aria-label / `data-hd` / tên học viên; chữ nút viết tiếng Việt, ảnh EN dịch qua từ điển app.
- **Chỉ đọc**: mở panel, gõ / dán thử, không bấm Lưu / Xác nhận / Duyệt.
- Kiểm của `dung.mjs`: đủ ảnh, MINI 2–4 trang, mọi `<kbd>` (chữ nút) có trong mã (VI) / từ điển EN, không chữ lỗi thời, sổ EN không còn chữ Việt.
