# PR OV-11i — Giao diện chung: a11y · 375 · tương phản (impeccable audit P1–P3, trong khuôn DESIGN.md)

Nguồn: `impeccable audit` 14/20 — phụ lục `docs/superpowers/specs/2026-10-14-ra-soat/impeccable-B-audit.md` (P1-*, P2-*, P3-*) + mục 44 px của các khu (QT-9, CA2-11, HV-23, TE-12),
lỗi 403 không đường về (HL-15, PT-11, TQ-16). Đặc tả mục 3 Q14. Đợt 3, **song song với OV-11g, OV-11h**. Rà: mặc định (xem ảnh trước / sau).
Mockup: không cần — chỉ token, kích thước vùng chạm, heading, tiêu đề tab; **không đổi phông, màu, bố cục** (DESIGN.md).

## Đầu ra
1. **[P1-2] Chữ gợi ý trong ô nhập đạt tương phản ở chế độ sáng.** `web/src/index.css` `@layer base`: `input::placeholder, textarea::placeholder { color: var(--text-faint) }`
   (sáng 5.8:1, tối 5.7:1 — hiện 2.5:1 do mặc định Tailwind).
2. **[P1-3 · Q14] Tiêu đề tab theo màn.** `document.title = "{tên màn} · PISA Tracking"` (hồ sơ HV: tên em; hồ sơ lớp: mã lớp; còn lại: tên khu vực) — một chỗ chung (`App.tsx`, nơi đã tính `khuVucCuaDuong`).
3. **[P2-1] Nút và ô nhập 44 px trên điện thoại.** `index.css:237-243`: `.btn`, `.field` `min-height: 44px` ở < 640 px (đang 40, trái DESIGN.md / PRODUCT.md).
4. **[⋯ 44 px]** `web/src/ui/MenuDong.tsx`: nút ⋯ vùng chạm 44 × 44 ở < 640 px (mẫu `after:` đã có ở `HangNhom.tsx:16`) — phủ Tài khoản (QT-9), hàng lớp / đầu hồ sơ lớp (CA2-11),
   PA trong Ngăn Case (HV-23), hộp một đợt (TE-12), hồ sơ MT.
5. **[P2-3]** Ô chọn thẻ Chờ duyệt bọc `<label>` vùng 44 × 44 ở 375 (`web/src/modules/duyet/TheYeuCau.tsx:195`). (Link nhỏ ở hồ sơ lớp / thẻ em → OV-11g; ở hồ sơ HV → OV-11d.)
6. **[P2-4]** `web/src/ui/ui.tsx:14-16` `Card` không vẽ `<h2>` khi không có `title`.
7. **[P2-6]** `.row-active { --text-faint-rgb: var(--text-dim-rgb); }` (chữ phụ trên hàng đang chọn 4.1 → 5.1:1, `index.css:257`).
8. **[P3-1]** Dấu "—" mang nghĩa "không có" (ô điểm) dùng `text-faint` (≥ 4.5:1); giữ màu mờ cho dấu ngăn `·`, `/`, `→` — ở `web/src/modules/cham/LuoiFT.tsx:317,339` (phần ở `classes/*` → OV-11g).
9. **[P3-2]** Chip "cũ" chữ `text-dim` (đang 4.3–4.4:1).
10. **[P3-3]** ⋯ ở ô lưới lớp thường chỉ ẩn chờ rê chuột khi `@media (hover: hover)` (`web/src/modules/cham/LuoiThuong.tsx:425`) — máy tính bảng cảm ứng thấy nút.
11. **[P3-4]** `@media (prefers-reduced-motion: reduce)`: tắt shimmer `.skel` (`index.css:306`) và `animate-pulse` (`QuickReport.tsx:391`).
12. **[HL-15 · PT-11 · TQ-16] Lỗi 403 có đường về.** `ui/ui.tsx:273` (khung lỗi): lỗi 403 không hiện "Thử lại"; hiện nút về trang cha ("‹ Học viên & Lớp", "‹ Tổng quan"… theo `trangCha` OV-5b).
13. **[TE-12 route]** TVV / CX mở thẳng `/nhap-diem/:id`, `/bang-diem-thuong/:id` → về Tổng quan như `/test` (`App.tsx:201`, theo `nav.test`).

## Ranh giới
- Vùng: `web/src/index.css`, `web/src/App.tsx`, `web/src/ui/{ui,MenuDong}.tsx`, `duyet/TheYeuCau.tsx` (ô chọn), `cham/LuoiThuong.tsx` (:425), `cham/LuoiFT.tsx` (:317,339 lớp màu dấu),
  `cases/QuickReport.tsx` (:391). Không file máy chủ.
- KHÔNG đụng: `classes/*`, `students/*` (OV-11g song song) · `phanTich/*` (OV-11h song song); logic, chữ, bố cục các màn.
- KHÔNG: đổi phông / bảng màu / bố cục; `polish`, `animate`, `colorize`, `bolder`, `delight`, `overdrive` (plan.md 1.3b); xoá CSS chết `.o-sua` (chờ chủ SP duyệt sửa DESIGN.md).

## Kiểm
- Không phép kiểm máy chủ (chỉ giao diện) — một phép kiểm thuần nếu tách hàm tên màn cho `document.title`.
- Đo lại bằng Playwright (script đo của audit: `getComputedStyle`, `getBoundingClientRect`): placeholder sáng ≥ 4.5:1 · `.btn/.field` 44 px ở 375 · ⋯ 44 × 44 · `/phan-tich` không còn h2 rỗng ·
  `document.title` khác nhau ở 5 màn · 403 không có "Thử lại". Ghi số đo trước / sau vào mô tả PR.
- `npm run check` xanh MỘT lần cuối. Ảnh 375 sáng + 1440 tối: đăng nhập, Tài khoản, hồ sơ lớp, Chờ duyệt, Sửa thông tin HV. `/impeccable audit` cuối (mục tiêu ≥ 17/20).

## Prompt (Opus 5.5 · High; B: Sonnet 5.5 · High)
```
Session CODE cho PR OV-11i (giao diện chung: a11y · 375 · tương phản), repo Pizi147/pisa-tracking, nhánh mới từ origin/main mới nhất. Không dùng Fable.
Gọi skill karpathy-guidelines. Gõ /ponytail lite. Đọc CLAUDE.md, DESIGN.md, plan.md mục 1.3b, rồi docs/superpowers/plans/2026-10-14-pr-ov11i-giao-dien-chung.md (làm ĐỦ 13 mục)
+ phụ lục docs/superpowers/specs/2026-10-14-ra-soat/impeccable-B-audit.md (vị trí, số đo).
PORT/WEB_PORT 4328/5501; npm run check tối đa 3 máy cùng lúc. Task ngay trong session (executing-plans, KHÔNG subagent).
Giữ phông, màu, bố cục đã khoá (DESIGN.md); chỉ token / vùng chạm / heading / tiêu đề tab. Chạy song song với OV-11g, OV-11h: chỉ sửa file trong mục Ranh giới.
impeccable: adapt · harden trong phạm vi PR (KHÔNG polish / animate / colorize); /impeccable audit cuối, ghi điểm trước → sau. Ảnh 375 sáng + 1440 tối đính PR.
/ponytail-review trước khi mở PR. Không deploy, không chạm Turso/Netlify. Gộp origin/main mới nhất trước khi mở PR. Xong: một dòng mục 11 plan.md.
Mở PR vào main, KHÔNG merge, gửi link cho chủ SP. Báo cáo tiếng Việt, ≤ 15 dòng.
```
