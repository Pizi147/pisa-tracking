> Phụ lục của [Đánh giá lại UX/UI toàn diện 20/10/2026](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md). Báo cáo gốc của agent rà (Opus 5.5), giữ nguyên chữ. Đường `SCR\anh\…` / `SCR\…` là ảnh và tệp tạm của đợt rà (không lưu trong repo); ảnh tiêu biểu đã lưu ở `anh/`.

# Assessment B — Máy dò + bằng chứng trình duyệt (agent b) · 20/10/2026

Đánh giá độc lập (không đọc báo cáo agent khác, không đọc `anh-chu-sp.md`). Chỉ đọc repo, không bấm nút ghi, không đổi dữ liệu demo.
SCR = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad`.

## Phần 0. Phạm vi, cách chạy, bước bỏ / lỗi

**Đích**: worktree `plan-ux-danh-gia` (main e3405b93) · web demo `http://localhost:5621` (Vite dev, ngày demo 14/09/2026) · Edge qua Playwright.

| Bước | Làm gì | Kết quả |
|---|---|---|
| 1 CLI | `impeccable.cmd detect --json web/src` (247 tệp: 226 tsx, 20 ts, 1 css — dưới 500 nên quét một lần) + `index.html`. Engine 0.1.6 có sẵn trong bộ đệm máy, không tải gì. Gọi qua `SCR/b/run-detect.mjs` (khoá worktree chặn gọi `cmd.exe` trực tiếp). DESIGN.md được nạp (các rule `design-system-*` chạy). | mã thoát **0**: 0 lỗi chính, 9 cảnh báo (advisory). `index.html`: 0. |
| 2 Lớp phủ | `impeccable.cmd live-server --background` chạy với cwd = `SCR/b` (không đụng repo, `hasProjectContext:false`), cổng **8400**; tắt bằng `live-server stop --keep-inject` rồi kiểm cổng trống + không còn tiến trình. Preflight (đổi `document.title` thành "[Human] …", gắn `<script>` nội tuyến) đạt cả 5 trang. Chèn `http://localhost:8400/detect.js`, chờ 3 s, đọc console `[impeccable]` + gọi `impeccableDetectAsync()` lấy kết quả có cấu trúc. 1440×900 tối. | Chạy 2 lần: lần 1 (phông dự phòng), lần 2 sau khi điều phối sửa phông. Số liệu dưới đây là **lần 2**. |
| 3 do-khung | Bản chép `SCR/b/do-khung.mjs`, sửa để CHỈ ĐỌC: (1) không đặt `localStorage pisa-ngon-ngu` (app tự `PATCH /me/profile` cho tài khoản chưa chọn tiếng — `web/src/lib/ngonNgu.ts:37-38`); (2) bỏ `PATCH /api/me/profile`; (3) tắt khối `ngon-ngu` (đổi tiếng tài khoản vai 9 sang EN rồi VI = ghi dữ liệu chung, agent khác đang dùng vai 9 sẽ thấy tiếng Anh); (4) tắt khối `hd-chi` (ngoài (a)–(f); mở `/huong-dan` ghi `da_xem_huong_dan`). Thêm 5 kịch bản bù `bu-*` cho 5 kịch bản cũ không mở được. | Chạy lại sau khi sửa phông (xem Phần 3). |
| 4 DOM | `SCR/b/do-dom.mjs`: 9 trang × vai 1/2/10 × (1440 tối, 375 sáng) = 54 lần tải; 13 lần bị chuyển trang vì không có quyền (QL: Quản trị · GV: Kế hoạch Test, Phân tích, Tutor, Quản trị) → **41 lần đo**. (e) lấy tên truy cập từ cây CDP `Accessibility.getFullAXTree`. (f) `do-tab.mjs`: 6 lượt × 30 lần Tab. Kiểm sâu: `kiem-kb.mjs`, `kiem-them*.mjs`. | Chạy lại sau khi sửa phông. |

**Sự cố môi trường (đã xử lý)**: lượt đo đầu, 18–20 tệp phông `@fontsource` (Be Vietnam Pro, Inter) trả **403** ở mọi trang — `node_modules` của worktree là junction tới `D:\Github\Pisa-tracking\node_modules`, Vite chặn `/@fs/…` ngoài thư mục cho phép → `document.fonts` 0/20 nạp, trang vẽ bằng phông dự phòng (system-ui / Segoe UI). Tôi báo trong lượt đầu; điều phối đã thêm `fs.allow` (tạm, không commit). Mọi số liệu cỡ chữ / tràn / cắt chữ / do-khung trong báo cáo này là **lượt chạy lại với phông thật**; kết quả lượt cũ cất ở `SCR/b/_phong-du-phong/`, ảnh cũ ở `SCR/anh/b/_phong-du-phong/`. Lỗi 403 phông không tính vào (i). Ảnh các agent khác chụp trước giờ sửa cũng là phông dự phòng — nhận định về kiểu chữ / chữ số Inter từ các ảnh đó cần kiểm lại.

**Bỏ / lỗi (lý do cụ thể)**
- Khối `ngon-ngu` và `hd-chi` của do-khung: tắt vì ghi dữ liệu chung (lý do ở bảng trên). "Chỉ cho tôi" (HD-a/HD-b) vì thế **chưa kiểm**.
- 5 kịch bản do-khung cũ không mở được ở mọi chiều (bộ chọn cũ sau OV-15) → đã bù bằng bộ chọn mới; riêng hộp nhập điểm ở 375 vẫn không mở được (ở 375 Công việc không tự mở panel nên không có nút "…: Nhập") → hộp nhập điểm 375 chưa đo.
- Một lần tôi chạy nhầm do-khung đủ bộ (tham số bị shell tách); tự dừng cây tiến trình của mình sau ~1 phút (lọc theo đường `SCR/b`), không ảnh hưởng ai.
- do-dom chỉ đo trang (không mở panel / hộp). Panel đo bằng do-khung.
- Không chạy URL-scan của CLI (critique.md: URL dùng lớp phủ trình duyệt).

## Phần 1. Kết quả CLI (`impeccable detect --json web/src`)

Mã thoát 0 · **0 lỗi chính · 9 cảnh báo** (rà 17/10: 0 + 8). Tệp: `SCR/b/detect-websrc.json`.

| Rule | Số | Tệp:dòng | Dương tính giả? |
|---|---|---|---|
| `design-system-font-size` (advisory) | 8 | `web/src/index.css:254` (16px !important cho ô nhập < 640px) | **Giả** — DESIGN.md §Typography (dòng 142–143) ghi "ô nhập ở 375 = 16", nhưng khối YAML `typography` ở đầu DESIGN.md chưa có bậc 16 / 17 / 28 nên máy dò không thấy. |
| | | `modules/fasttrack/ODiemLon.tsx:113`, `:153` (28px số điểm lớn) | **Giả** — DESIGN.md "28 (số lớn)". |
| | | `ui/KhungPanel.tsx:121` (17px tiêu đề panel) | **Giả** — DESIGN.md "17 (tiêu đề panel)". |
| | | `modules/students/DauHoSo.tsx:235`, `:248` (17px số ở đầu hồ sơ HV) | Giả một nửa — 17 có trong thang nhưng ghi cho tiêu đề panel, ở đây là số liệu. |
| | | `ui/NutNgonNgu.tsx:20` (17px nút chọn tiếng màn đăng nhập) | Giả một nửa — như trên. |
| | | `modules/students/ChuongLop.tsx:126` (16px mã lớp trên thẻ chương) | Giả một nửa — 16 chỉ ghi cho ô nhập 375. |
| `design-system-radius` (advisory) | 1 | `web/src/index.css:147` — `:focus-visible { border-radius: 4px }` | **Thật, nhẹ (P3)** — 4px không có trong thang bo (6 / 8 / 12 / tròn); vòng focus của phần tử không tự bo (link, ô bảng) bo 4px. Mới so với 17/10. |

Nguyên nhân chung của 8 cảnh báo cỡ chữ: **YAML đầu DESIGN.md lệch phần chữ của chính nó** (cùng lỗi từ 17/10, chưa sửa). Sửa một chỗ: thêm `input-mobile: 16px`, `panel-title: 17px`, `big-number: 28px` vào `typography` (việc của session planning — DESIGN.md).

**Máy dò bỏ sót** (đọc mã kiểm, `SCR/b/dem-co-chu.mjs`): rule cỡ chữ chỉ đọc `text-[Npx]` với dung sai ±0,5 px và không đọc tên lớp Tailwind, nên "0 lỗi" không có nghĩa thang chữ sạch:
`text-[11px]` **86 chỗ / 40 tệp** (11 không có trong thang 12/13/14/16/20) · `text-[13.5px]` 11 chỗ / 7 tệp · `text-lg` (18px) 22 chỗ · `text-2xl` (24px) 7 chỗ · `text-[11.5px]` 71, `text-[12.5px]` 55 (đúng chip / hàng nhóm). Các rule chỉ thấy khi vẽ trang (side-tab, cramped-padding, em-dash) không có ở CLI — xem Phần 2.

## Phần 2. Lớp phủ trình duyệt (detect.js trong trang, 1440 tối)

Chạy 2 lần (phông dự phòng, rồi phông thật) — **kết quả giống hệt**. `__impeccableCoreError`: không. Lượt tương phản thị giác (`vc`): 0 mục ở cả 5 trang.
Ảnh có khung đánh dấu: `SCR/anh/b/overlay-<trang>.png`.

| Trang (vai) | Console `[impeccable]` | Phát hiện (rule → phần tử) | Đánh giá |
|---|---|---|---|
| Tổng quan (1) | "1 anti-pattern found" | `cramped-padding` → chip «Dữ liệu demo» (thanh demo) | **Giả**: chip cao 20 px, chữ 11,5 px đúng mẫu chip của DESIGN.md; chỉ có ở bản demo. |
| Công việc (10) | "2 anti-patterns found" | chip như trên · `side-tab` → `.khoi-nhom-dau.dong` (inset 3px trái) | `side-tab`: **đúng rule nhưng cố ý** — DESIGN.md §Components "hàng nhóm… vạch trái 3 px màu nhấn", `index.css:316`. Máy dò coi đây là dấu hiệu "giao diện AI"; đổi hay giữ là việc chủ SP (câu hỏi Q1). |
| Học viên & Lớp (2) | "3 anti-patterns found" | chip · `cramped-padding` × 2 → hai `section.card` (bảng lớp FT, lớp thường) "sát mép trái" | **Giả**: thứ chạm mép là vạch 3px / nền hàng nhóm, chữ có lề (mũi tên ở x≈40). |
| Test › Lịch Test (1) | "3 anti-patterns found" | chip · `cramped-padding` → `#lich-test-k2` (sát mép phải) · `em-dash-overuse` 10 (advisory) · `side-tab` | `#lich-test-k2`: **đúng một phần (P3)** — lưới chấm mở dưới hàng lớp chạy sát mép phải thẻ (cột Kết quả). `em-dash`: giả một nửa — "—" ở đây là dấu "chưa có" trong ô, không phải văn xuôi; nhưng xác nhận trang dùng "—" dày đặc (xem B-08). |
| Phân tích › Báo cáo (1) | "1 anti-pattern found" | chip | Giả. |

**Dương tính giả của chính công cụ**: mục `dark-glow` "Zero-offset box-shadow glow (#ffba00)" xuất hiện ở MỌI trang trong kết quả có cấu trúc nhưng KHÔNG có trong console lượt quét đầu — đó là bóng vàng của khung đánh dấu do chính lớp phủ vẽ (`detect.js:3292` `0 0 4px oklch(84% 0.19 80 / 0.6)`). Tương tự, kết quả có cấu trúc đếm 11 dấu "—" (console 10) vì dòng chữ trên dải cảnh báo của lớp phủ có một dấu "—". Bỏ cả hai.
**Kết luận Phần 2**: máy dò trong trang chỉ thấy chi tiết trang trí; không có lỗi nặng. Vấn đề thật nằm ở những thứ máy dò không đo (vùng bấm, độ dài trang, bảng tràn thẻ, mật độ thao tác) — Phần 4.

## Phần 3. do-khung (bản chép chỉ đọc, phông thật)

`PW=… KHUNG_BASE=http://localhost:5621 KHUNG_ANH=SCR/anh/b/khung node SCR/chup/khoa.mjs node SCR/b/do-khung.mjs` · nhật ký `SCR/b/do-khung.log` · ảnh lỗi `SCR/anh/b/khung/`.
**276 lần đo** (67 kịch bản = 62 của repo + 5 kịch bản bù `bu-*`, × 1440/375 × tối/sáng; 2 kịch bản Phân tích thêm 1366/1280) · **đạt 246 · lỗi 30**: 20 "không mở được" (5 kịch bản cũ × 4) · 2 kịch bản bù không mở được ở 375 · **8 lỗi thật** (4 vấn đề). Lượt phông dự phòng ra cùng các lỗi này (256 lần, 26 lỗi — trước khi thêm `bu-*`).

| Kịch bản | 1440 tối | 1440 sáng | 375 tối | 375 sáng |
|---|---|---|---|---|
| `menu-tk` (vai 7, mở menu Tài khoản) | ✓ | ✓ | **(a) `<html>` cuộn 839/812** | **(a) `<html>` cuộn 839/812** |
| `gvbm` (vai 9, `/`) | **(b) cuộn lồng 690/1949** «Mọi lớp (5)…» | **(b) như trên** | ✓ | ✓ |
| `cv-van-hanh` (vai 2, Công việc › Vận hành) | ✓ | ✓ | (c) chữ cắt 75×16 < 75×18 «Mọi người» | (c) như trên |
| `bu-ngan-case` (vai 7, `/hoc-vien/3?case=5`) | ✓ | ✓ | (d) nút «ⓘ» bị cắt ở mép, không mép mờ | (d) như trên |
| `bu-hop-diem` (vai 10, hộp nhập điểm) | ✓ | ✓ | không mở được — ở 375 Công việc không tự mở panel | như trên |
| `gv-hop-diem`, `panel-pa`, `panel-them-hv`, `hop-ky-nang-mt`, `panel-xep-lich-mt` | không mở được (hết 8 s chờ nút) ở cả 4 chiều — bộ chọn cũ (B-06) | | | |

Kịch bản đạt ở mọi chiều (57): `hvl`, `hvl-gvcn`, `hvl-cuoi`, `tong-quan`, `tong-quan-gv`, `phan-tich` (+1366/1280), `phan-tich-thuong` (+1366/1280), `cv-ho-tro`, `cv-cho-duyet`, `cv-bao-cao`, `cv-gv`, `lop-ft`, `lop-ft-phan-tich`, `lop-ft-y-thuc`, `lop-thuong`, `lop-thuong-phan-tich`, `hv-hoc-thuat`, `hv-y-thuc`, `hv-hanh-trinh`, `hv-thuong`, `hv-thuong-hanh-trinh`, `luu-tru`, `test-lichTest`, `test-diem-lop`, `test-ke-hoach`, `nhap-diem`, `bang-diem-thuong`, `mock`, `quan-tri`, `quan-tri-quyen`, `ho-so-ca-nhan`, `gvbm-test`, `hvl-gvbm`, `hv-gvbm`, `gv-diem-lop`, `gv-nhap-diem`, `gv-bang-diem-thuong`, `gv-mock`, `gv-yeu-cau`, `gv-ket-qua-pa`, `gv-ho-so`, `hv-menu`, `sos-ql`, `sos-gv`, `sos-tvv`, `sos-cx`, `panel-mot-em-ql`, `panel-mot-em-gv`, `gv-chuong`, `dang-nhap`, `panel-tao-case`, `panel-vi-pham`, `panel-sua-tt`, `chon-nhieu-hv`, và 3 kịch bản bù `bu-hop-ky-nang-mt`, `bu-xep-nhieu-mt`, `bu-them-hv`.

Ghi chú từng lỗi:
- `menu-tk` 375: menu Tài khoản (vai 7) cao hơn màn → cả trang cuộn, "Đăng xuất" ra ngoài màn — B-09; ảnh `SCR/anh/b/khung/menu-tk-375-sang.png`.
- `gvbm` 1440: panel "Chấm Speaking" tự mở tại chỗ và tự cuộn (690/1949 px) cạnh danh sách việc → hai vùng cuộn song song. Cùng mẫu với `gv-ket-qua-pa` mà script đã miễn — script không nhất quán; về UX: P3 (ảnh `khung/gvbm-1440-toi.png`).
- `cv-van-hanh` 375: chữ «Mọi người» trong ô "Người phụ trách" mất 2 px chân chữ. Cùng ảnh (`khung/cv-van-hanh-375-sang.png`) còn thấy bảng "Công việc" ở 375 vẫn là bảng cuộn ngang, cột "Người phụ trách" bị cắt ở mép thẻ (DESIGN.md: < 640 px bảng thành thẻ).
- `bu-ngan-case` 375: nút ⓘ cạnh "Phương án 3" trong ngăn Case thò qua mép phải thẻ (`khung/bu-ngan-case-375-sang.png`).
- 5 kịch bản cũ — nguyên nhân từng cái ở B-06 (`SCR/b/kiem-kb.json`).
- do-khung KHÔNG phát hiện bảng "Lớp tôi dạy" tràn thẻ (B-01): phép (a)/(e) chỉ xét `<html>`/`<main>` trượt ngang, (f) chỉ xét chữ bị khối `overflow:hidden` cắt.

## Phần 4. Đo DOM (phông thật · 1440 tối + 375 sáng · vai 1 QT / 2 QL / 10 GV)

Script `SCR/b/do-dom.mjs` → `SCR/b/dom-ketqua.json`; ảnh khung nhìn mỗi lần đo: `SCR/anh/b/dom/<trang>-v<vai>-<rộng>.png`.
Cột (b): số phần tử bấm được dưới ngưỡng (375: < 44 px một chiều; 1440: < 24 px) — số trong ngoặc tính cả link nằm trong câu; vùng nới bằng `::before/::after` đã tính.
Cột (d): "trang·main X" = số px trượt ngang của `<html>` và `<main>`; "tràn" = phần tử thò khỏi mép `<main>`; "bảng cuộn riêng / tổng".
Cột (h): phần tử bấm được trong khung nhìn đầu (900 / 812 px) = nút · link · ô nhập · tab (tổng / riêng trong `<main>`).

| Trang | Vai | Rộng | (a) <11 / <12 px | (b) bấm nhỏ (bỏ link trong câu) / tổng | (c) <4.5 · <3 | (d) trang·main X · tràn · bảng cuộn riêng / tổng | (e) không tên · ký hiệu | (g) cao main | (h) nút·link·ô·tab (tổng / trong main) | (i) console · mạng |
|---|---|---|---|---|---|---|---|---|---|---|
| tong-quan | 1 | 1440 | 0 / 13 | 74 (74) / 122 | 0 · 0 | 0·0 · 0 · 0/1 | 0 · 0 | 3035 | 22·12·5·0 (39 / 28) | 2 · 0 |
| cong-viec | 1 | 1440 | 0 / 17 | 14 (14) / 86 | 0 · 0 | 0·0 · 0 · 0/1 | 0 · 0 | 2175 | 36·14·3·0 (53 / 42) | 2 · 0 |
| hoc-vien | 1 | 1440 | 0 / 30 | 20 (30) / 95 | 0 · 0 (+2 nút tắt) | 0·0 · 0 · 0/12 | 0 · 0 | 804 | 63·26·6·0 (95 / 84) | 2 · 0 |
| lop-ft101 | 1 | 1440 | 0 / 108 | 142 (144) / 274 | 45 · 45 (+3 nút tắt) | 0·0 · 0 · 0/2 | 0 · 0 | 4800 ⚠ | 35·24·1·3 (63 / 52) | 2 · 0 |
| test-lich | 1 | 1440 | 0 / 106 | 48 (48) / 285 | 66 · 66 | 0·0 · 0 · 0/6 | 0 · 0 | 2629 | 47·12·2·2 (63 / 52) | 2 · 0 |
| test-ke-hoach | 1 | 1440 | 0 / 13 | 11 (11) / 32 | 0 · 0 | 0·0 · 0 · 0/10 | 0 · 0 | 804 | 21·6·3·2 (32 / 21) | 2 · 0 |
| phan-tich | 1 | 1440 | 0 / 3 | 18 (18) / 45 | 0 · 0 | 0·0 · 0 · 0/2 | 0 · 0 | 840 | 31·6·2·6 (45 / 34) | 2 · 0 |
| tutor | 1 | 1440 | 0 / 4 | 0 (0) / 23 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 804 | 13·6·4·0 (23 / 12) | 2 · 0 |
| quan-tri | 1 | 1440 | 0 / 89 | 0 (0) / 79 | 0 · 0 | 0·0 · 0 · 0/1 | 0 · 0 | 1977 | 27·6·5·3 (41 / 30) | 2 · 0 |
| tong-quan | 2 | 1440 | 0 / 13 | 48 (48) / 89 | 0 · 0 | 0·0 · 0 · 0/1 | 0 · 0 | 2263 | 23·12·2·0 (37 / 26) | 2 · 0 |
| cong-viec | 2 | 1440 | 0 / 17 | 13 (13) / 80 | 0 · 0 | 0·0 · 0 · 0/1 | 0 · 0 | 2080 | 37·14·1·0 (52 / 41) | 2 · 0 |
| hoc-vien | 2 | 1440 | 0 / 30 | 20 (30) / 93 | 0 · 0 (+2 nút tắt) | 0·0 · 0 · 0/12 | 0 · 0 | 804 | 63·26·4·0 (93 / 82) | 2 · 0 |
| lop-ft101 | 2 | 1440 | 0 / 108 | 142 (144) / 274 | 45 · 45 (+3 nút tắt) | 0·0 · 0 · 0/2 | 0 · 0 | 4800 ⚠ | 35·24·1·3 (63 / 52) | 2 · 0 |
| test-lich | 2 | 1440 | 0 / 97 | 41 (41) / 249 | 66 · 66 | 0·0 · 0 · 0/5 | 0 · 0 | 2170 | 44·12·1·2 (59 / 48) | 2 · 0 |
| test-ke-hoach | 2 | 1440 | 0 / 9 | 7 (7) / 27 | 0 · 0 | 0·0 · 0 · 0/6 | 0 · 0 | 804 | 17·6·2·2 (27 / 16) | 2 · 0 |
| phan-tich | 2 | 1440 | 0 / 3 | 18 (18) / 44 | 0 · 0 | 0·0 · 0 · 0/2 | 0 · 0 | 810 | 31·6·1·6 (44 / 33) | 2 · 0 |
| tutor | 2 | 1440 | 0 / 4 | 0 (0) / 17 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 804 | 8·6·3·0 (17 / 6) | 2 · 0 |
| quan-tri | 2 | 1440 | → chuyển về `/` (không có quyền) |||||||| 2 · 0 |
| tong-quan | 10 | 1440 | 0 / 19 | 19 (19) / 53 | 0 · 0 | 0·0 · 0 · 0/2 · tràn thẻ 1 | 0 · 0 | 1259 | 28·8·1·0 (37 / 29) | 2 · 0 |
| cong-viec | 10 | 1440 | 0 / 19 | 19 (19) / 53 | 0 · 0 | 0·0 · 0 · 0/2 · tràn thẻ 1 | 0 · 0 | 1259 | 28·8·1·0 (37 / 29) | 2 · 0 |
| hoc-vien | 10 | 1440 | 0 / 13 | 10 (13) / 40 | 0 · 0 | 0·0 · 0 · 0/6 | 0 · 0 | 804 | 26·11·3·0 (40 / 32) | 2 · 0 |
| lop-ft101 | 10 | 1440 | 0 / 107 | 137 (139) / 229 | 36 · 36 (+3 nút tắt) | 0·0 · 0 · 0/2 | 0 · 0 | 4776 ⚠ | 32·20·1·3 (56 / 48) | 2 · 0 |
| test-lich | 10 | 1440 | 0 / 31 | 16 (16) / 43 | 1 · 1 | 0·0 · 0 · 0/3 | 0 · 0 | 1163 | 21·10·1·0 (32 / 24) | 2 · 0 |
| test-ke-hoach | 10 | 1440 | → chuyển về `/test/lich` (không có quyền) |||||||| 2 · 0 |
| phan-tich | 10 | 1440 | → chuyển về `/cong-viec` (không có quyền) |||||||| 2 · 0 |
| tutor | 10 | 1440 | → chuyển về `/cong-viec` (không có quyền) |||||||| 2 · 0 |
| quan-tri | 10 | 1440 | → chuyển về `/cong-viec` (không có quyền) |||||||| 2 · 0 |
| tong-quan | 1 | 375 | 0 / 16 | 69 (69) / 121 · <24: 19 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 5741 ⚠ | 15·8·2·0 (25 / 14) | 2 · 0 |
| cong-viec | 1 | 375 | 0 / 20 | 16 (16) / 70 · <24: 0 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 4191 ⚠ | 16·7·3·0 (26 / 15) | 2 · 0 |
| hoc-vien | 1 | 375 | 0 / 38 | 8 (8) / 69 · <24: 0 | 0 · 0 (+2 nút tắt) | 0·0 · 0 · 0/0 | 0 · 0 | 1840 | 23·6·5·0 (34 / 23) | 2 · 0 |
| lop-ft101 | 1 | 375 | 0 / 76 | 5 (25) / 225 · <24: 2 | 45 · 45 (+1 nút tắt) | 0·0 · 0 · 0/0 | 0 · 0 | 10382 ⚠ | 24·11·0·3 (38 / 27) | 2 · 0 |
| test-lich | 1 | 375 | 0 / 39 | 7 (7) / 140 · <24: 0 | 10 · 10 | 0·0 · 0 · 0/1 | 0 · 0 | 3923 | 26·7·0·2 (35 / 24) | 2 · 0 |
| test-ke-hoach | 1 | 375 | 0 / 10 | 0 (0) / 33 · <24: 0 | 0 · 0 | 0·0 · 0 · 1/10 | 0 · 0 | 1036 | 19·6·2·2 (29 / 18) | 2 · 0 |
| phan-tich | 1 | 375 | 0 / 9 | 24 (24) / 45 · <24: 2 | 0 · 0 | 0·0 · 0 · 0/2 | 0 · 0 | 1893 | 16·6·1·4 (27 / 16) | 2 · 0 |
| tutor | 1 | 375 | 0 / 10 | 0 (0) / 23 · <24: 0 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 784 | 14·6·3·0 (23 / 12) | 2 · 0 |
| quan-tri | 1 | 375 | 0 / 95 | 25 (25) / 79 · <24: 0 | 0 · 0 | 0·0 · 0 · 1/1 | 0 · 0 | 2710 | 15·6·4·3 (28 / 17) | 2 · 0 |
| tong-quan | 2 | 375 | 0 / 16 | 45 (45) / 89 · <24: 10 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 4279 ⚠ | 15·8·1·0 (24 / 13) | 2 · 0 |
| cong-viec | 2 | 375 | 0 / 20 | 14 (14) / 64 · <24: 0 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 3874 | 17·7·1·0 (25 / 14) | 2 · 0 |
| hoc-vien | 2 | 375 | 0 / 38 | 8 (8) / 67 · <24: 0 | 0 · 0 (+2 nút tắt) | 0·0 · 0 · 0/0 | 0 · 0 | 1736 | 26·6·3·0 (35 / 24) | 2 · 0 |
| lop-ft101 | 2 | 375 | 0 / 76 | 5 (25) / 225 · <24: 2 | 45 · 45 (+1 nút tắt) | 0·0 · 0 · 0/0 | 0 · 0 | 10382 ⚠ | 24·11·0·3 (38 / 27) | 2 · 0 |
| test-lich | 2 | 375 | 0 / 36 | 6 (6) / 120 · <24: 0 | 10 · 10 | 0·0 · 0 · 0/1 | 0 · 0 | 3339 | 26·7·0·2 (35 / 24) | 2 · 0 |
| test-ke-hoach | 2 | 375 | 0 / 10 | 0 (0) / 27 · <24: 0 | 0 · 0 | 0·0 · 0 · 1/6 | 0 · 0 | 804 | 18·6·1·2 (27 / 16) | 2 · 0 |
| phan-tich | 2 | 375 | 0 / 9 | 24 (24) / 44 · <24: 2 | 0 · 0 | 0·0 · 0 · 0/2 | 0 · 0 | 1803 | 16·6·0·4 (26 / 15) | 2 · 0 |
| tutor | 2 | 375 | 0 / 10 | 0 (0) / 17 · <24: 0 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 706 | 9·6·2·0 (17 / 6) | 2 · 0 |
| quan-tri | 2 | 375 | → chuyển về `/` (không có quyền) |||||||| 2 · 0 |
| tong-quan | 10 | 375 | 0 / 11 | 17 (17) / 36 · <24: 4 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 1836 | 14·3·0·0 (17 / 9) | 2 · 0 |
| cong-viec | 10 | 375 | 0 / 11 | 17 (17) / 36 · <24: 4 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 1836 | 14·3·0·0 (17 / 9) | 2 · 0 |
| hoc-vien | 10 | 375 | 0 / 16 | 0 (0) / 31 · <24: 0 | 0 · 0 | 0·0 · 0 · 0/0 | 0 · 0 | 872 | 24·3·2·0 (29 / 21) | 2 · 0 |
| lop-ft101 | 10 | 375 | 0 / 67 | 2 (22) / 223 · <24: 2 | 36 · 36 (+1 nút tắt) | 0·0 · 0 · 0/0 | 0 · 0 | 10640 ⚠ | 21·6·0·3 (30 / 22) | 2 · 0 |
| test-lich | 10 | 375 | 0 / 18 | 4 (4) / 50 · <24: 0 | 1 · 1 | 0·0 · 0 · 0/1 | 0 · 0 | 1661 | 24·4·0·0 (28 / 20) | 2 · 0 |
| test-ke-hoach | 10 | 375 | → chuyển về `/test/lich` (không có quyền) |||||||| 2 · 0 |
| phan-tich | 10 | 375 | → chuyển về `/cong-viec` (không có quyền) |||||||| 2 · 0 |
| tutor | 10 | 375 | → chuyển về `/cong-viec` (không có quyền) |||||||| 2 · 0 |
| quan-tri | 10 | 375 | → chuyển về `/cong-viec` (không có quyền) |||||||| 2 · 0 |

**Đọc bảng — theo mục**

- **(a) Chữ nhỏ.** Chữ < 11 px: **0** ở cả 41 lần đo (đạt luật DESIGN.md). Chữ < 12 px dày ở: hồ sơ lớp FT 101 **107–108** phần tử (1440) / 67–76 (375) · Lịch Test **97–106** (QT/QL 1440), 31 (GV) · Quản trị **89 / 95** · Học viên & Lớp 30–38 · Tổng quan 11–19 · Phân tích 3–9 · Tutor 4–10.
  Nguồn chính: số đếm 11,5 px (chuông "30", "Công việc 12"), nhãn thanh điều hướng dưới 11,5 px ở 375 ("Tổng quan", "Học viên", "Test", "Công việc"), "⋯" 11 px (`ui/MenuDong.tsx:106`), "✓" 11 px (`ui/ui.tsx:543`), nhãn ô "Quá hạn chấm", "27 câu" 11 px (Lịch Test), chip phân loại "Học thuật" 11 px (`modules/duyet/TheYeuCau.tsx:188`), mã tuần "W1 OCT" 11,5 px.
- **(b) Vùng bấm.**
  1440 (< 24 px): Tổng quan QT **74/122**, QL 48/89 — gần hết là **số bấm được** (`ui/SoLieuO.tsx:28-30`) cỡ **8×12 px** ("Lớp cần chú ý") và 8×20 px ("HV cần chú ý", 56 nút cùng mẫu trên trang); hồ sơ lớp 137–142/229–274 — chủ yếu link chữ cao 15–20 px trong bảng (tên GV 80×15 ×47, tên HV ×32, "Thiếu 3" 42×20 ×29, "MT1/MT2/MT3" 23–28×20 ×24, chip "SOS 1" 55×22 ×10 — `kiem-them3.mjs`); nút mở/thu gọn hàng **16×16** ở Học viên & Lớp, Lịch Test, Kế hoạch Test, Công việc (vùng nới `before:-inset-3.5` chỉ bật ở < 640 px); ô tích "Chọn: …" 16×16 (Công việc). Quản trị, Tutor: 0.
  375 (< 44 px): Tổng quan QT **69/121**, QL 45/89 — số bấm được **24×36 px** (chỉ nới `max-sm:py-3 px-2`); Phân tích 24 — số bấm được 24×44; Quản trị 25 — nút "Sửa" 44×44 (đạt sát), hàng nút; Công việc 14–16 — dòng việc 289×36, "Mở" 39×44; Học viên & Lớp 8 — nút phân trang 36×44; Lịch Test 4–7 — "Mở lưới đầy đủ ↗" 113×40, "Tuần trước / sau" 32×44.
- **(c) Tương phản.** Chữ thường: **0 lỗi** ở 7/9 trang (token OV-15a giữ ≥ 7:1). Lỗi chỉ ở chữ dùng màu "chỉ dấu trang trí" `text-slate-600` (= `--chu-mo`, `index.css:85`) nhưng mang nghĩa:
  dấu "—" (chưa có điểm) **1,94:1** (tối) / 2,37:1 (sáng) — **45** chỗ ở hồ sơ lớp FT 101 (36 ở vai GV); dấu "/" giữa hai ô điểm lớp thường ("20 / 25") **2,39:1** (tối) / 2,47:1 (sáng) — 32 chỗ ở Lịch Test; "—" 2,12–2,32:1 — 2–5 chỗ ở Lịch Test.
  32 nút "⋯" mỗi lưới lớp thường đo 1:1 vì **ẩn hẳn (opacity 0) tới khi rê chuột / focus** (`modules/cham/LuoiThuong.tsx:438`) — không phải lỗi tương phản mà là thao tác ẩn (B-10).
  Viền ô nhập (WCAG 1.4.11): **0** ô < 3:1. Chữ trên nút đang tắt (‹ › phân trang 2,1–3,7:1) được WCAG miễn.
- **(d) Tràn ngang.** `<html>` và `<main>` trượt ngang: **0** ở cả 41 lần đo (PR-KHUNG giữ tốt). Một lỗi mà phép đo trang không thấy: **bảng "Lớp tôi dạy" rộng hơn thẻ 201 px** ở trang chính của GV (1440) — B-01. Ở 375 còn bảng cuộn ngang trong khung riêng: Kế hoạch Test (1 bảng), Quản trị (1 bảng) — trái DESIGN.md "điện thoại: bảng chuyển thành thẻ".
- **(e) Tên truy cập.** Phần tử tương tác không tên: **0**; tên chỉ là ký hiệu (⋯, ✕, ‹ ›…): **0** — mọi nút biểu tượng có `aria-label` (cây CDP). Đạt.
- **(f) Bàn phím (Tab).** `do-tab.mjs`, 6 lượt × 30 Tab = 180 bước; ảnh `SCR/anh/b/tab/<trang>-tab{1,8,16}.png`.
  Vòng focus **thấy được ở 180/180 bước** (viền 2 px màu nhấn, `index.css:144-148`). Tab 1 luôn là "Bỏ qua tới nội dung". Không dùng link đó: 13 Tab mới vào nội dung (1440: 3 nút thanh demo + 6 mục điều hướng + tìm + chuông + tài khoản), 7 Tab ở 375.
  Lỗi: **focus bị thanh điều hướng dưới che** ở 375 (Học viên & Lớp, vai 10, Tab 26–27: thẻ "MB FT 104" và nút ⋯ của nó nằm dưới thanh dưới — `elementFromPoint` trả về biểu tượng của thanh) — B-05, ảnh `SCR/anh/b/kt-focus-che-375.png`.
  Ghi nhận: Công việc (GV) tự đặt focus vào ô điểm đầu tiên của panel tự mở khi tải trang (Tab 1 đã ở trong panel; hết panel focus rời trang rồi mới về đầu).
- **(g) Chiều cao trang** (cao nội dung `<main>`): > 4 000 px ở **hồ sơ lớp FT 101: 10 382 px (375, QT/QL), 10 640 px (375, GV) ≈ 13 màn điện thoại; 4 776–4 800 px (1440)** · Tổng quan 375: **5 741 (QT)**, 4 279 (QL) · Công việc 375 QT: 4 191.
  Khối gây dài (`kiem-them2.mjs`): hồ sơ lớp 375 (GV, 10 640 px) = đầu trang 296 + hàng tab 44 + nội dung tab "Tổng hợp" **7 334** + "Điểm Mock Test của lớp" **2 822** (khối điểm luôn nối dưới MỌI tab); 1440 = 216 + 38 + 2 021 + 2 437. Tổng quan 375 (QT) = "Cần bạn quyết" **3 395** + "Lớp cần chú ý" 1 123 + "Tuần này" 596.
- **(h) Mật độ khung nhìn đầu.** 1440: **Học viên & Lớp 93–95 phần tử bấm được** (63 nút + 26 link; 82–84 trong `<main>`) — nhiều nhất · hồ sơ lớp 56–63 · Lịch Test 59–63 · Công việc 52–53 · Phân tích 44–45 · Quản trị 41 · Tổng quan 37–39 · Kế hoạch Test 27–32 · Tutor 17–23. 375: 17–38.
  Ở Học viên & Lớp, thanh phân trang đầy đủ (‹ 1 2 › · Mỗi trang 10 20 50) vẽ **cả trên lẫn dưới bảng** (`modules/students/StudentsPage.tsx:494` và `:525`) — 8 nút lặp ngay khung nhìn đầu.
- **(i) Lỗi khi tải.** API 4xx/5xx: **0** · lỗi JS (`pageerror`): **0** · console error: 0 (sau khi sửa phông; trước đó 1 564 dòng 403 phông — môi trường, không tính) · console warning: 2 cảnh báo "React Router Future Flag" mỗi lần tải (bản dev, P3).
- **Chuyển trang vì quyền** (đúng thiết kế, ghi để biết): QL vào `/quan-tri` → `/`; GV vào `/test/ke-hoach` → `/test/lich`; GV vào `/phan-tich`, `/tutor`, `/quan-tri` → `/cong-viec`. Với GV, `/` hiển thị nội dung Công việc ("Chào Linh") và mục "Công việc" sáng trên thanh điều hướng.

**Đạt (giữ)**: CLI 0 lỗi chính · `<html>`/`<main>` không trượt ngang ở 41/41 lần đo · 0 phần tử tương tác thiếu tên · vòng focus thấy ở 180/180 bước Tab + link "Bỏ qua tới nội dung" · tương phản chữ thường và viền ô nhập đạt · 0 lỗi API / JS khi tải.

## Phần 5. 10 phát hiện nặng nhất

Tất cả là [PHÁT HIỆN] (tự đo trên web demo với phông thật + đọc mã), xếp từ nặng tới nhẹ.

### B-01 · P1 · Bảng "Lớp tôi dạy" tràn khỏi thẻ 201 px trên trang chính của GV
- Vai: GV (trang `/` = Công việc, ≥ 1280 px). Ảnh `SCR/anh/b/kt-bang-lop-toi-day.png` — cột "Bài chờ chấm", "Test sắp tới" nằm ngoài viền thẻ, lấn sang cột bên phải (ngay dưới panel việc).
- Số đo: bảng 760 px trong `div.table-scroll.bang-dinh` rộng 558 px (`overflow-x: visible`) trong `section.card` 560 px (cả hai lượt phông).
- Nguyên nhân (triển khai): `web/src/modules/worklist/LopToiDay.tsx:92-93` gắn `bang-dinh` cho bảng `min-w-[760px]`; từ 1280 px `.bang-dinh { overflow: visible }` (`web/src/index.css:188-189`) bỏ khung cuộn — trái chú thích ngay trên (`index.css:186`): "Bảng phải cuộn ngang thì KHÔNG gắn lớp này". Bố cục hai cột (danh sách 1fr + panel 1.2fr) chỉ chừa 560 px. `KhoiCanXuLy.tsx:79-80` cùng mẫu (chưa tràn vì đang ở khung rộng).
- Sửa: bỏ `bang-dinh` ở LopToiDay (giữ `table-scroll` → cuộn trong thẻ), hoặc ngoại lệ kiểu `bang-dinh-1440`. Thêm phép đo "bảng rộng hơn thẻ" vào do-khung (B-06).

### B-02 · P1 · Số bấm được (mở danh sách) quá nhỏ: 8×12 px ở máy tính, 24×36 px ở điện thoại
- Vai: QL / QT (Tổng quan, Phân tích), GV (Lớp tôi dạy). Đây là thao tác chính "bấm số → xem danh sách em" của Tổng quan (luật G-10).
- Số đo: 1440 — 8×12 px ("Lớp cần chú ý"), 8×20 px ("HV cần chú ý"); Tổng quan QT có 56 nút số cùng mẫu; 375 — 24×36 px (Tổng quan), 24×44 (Phân tích). Tổng quan QT: 74/122 phần tử < 24 px (1440), 69/121 < 44 px (375). Chuẩn: DESIGN.md §Layout (44 px điện thoại, 40 px máy tính), WCAG 2.5.8 (24×24). Ảnh `SCR/anh/b/dom/tong-quan-v1-1440.png`.
- Nguyên nhân: `web/src/ui/SoLieuO.tsx:28-30` (`p-0`, chỉ nới `max-sm:py-3 -my-3 px-2 -mx-2`) và `ui/SoLieu.tsx:313`.
- Sửa một chỗ cho mọi màn: vùng bấm bằng `::after` tuyệt đối (mẫu sẵn của `ui/MenuDong.tsx:106` `after:-inset-[9px]`): ≥ 24×24 ở máy tính, 44×44 ở < 640 px; hình chữ giữ nguyên.

### B-03 · P2 · Trang quá dài — hồ sơ lớp 10 640 px trên điện thoại (≈ 13 màn)
- Vai: GV (Cô Linh dùng điện thoại), QL.
- Số đo: hồ sơ lớp MB FT 101 — 375: 10 382 (QT/QL) / 10 640 px (GV); 1440: 4 776–4 800 px. Khối "Điểm Mock Test của lớp" 2 822 px (375) **nối dưới mọi tab**; tab "Tổng hợp" 7 334 px. Tổng quan 375 (QT) 5 741 px — khối "Cần bạn quyết" 3 395 px; Công việc 375 (QT) 4 191 px.
- Sửa: khối điểm lớp thành tab riêng (hoặc thu gọn mặc định ở < 640 px); các khối trong "Tổng hợp" thu gọn mặc định trên điện thoại; "Cần bạn quyết" ở 375 giới hạn số thẻ + "Xem thêm" như 1440.

### B-04 · P2 · Quá nhiều thao tác ngay khung nhìn đầu (Học viên & Lớp 93–95)
- Vai: QL (Chị Vy giao ban 10 phút), QT.
- Số đo (1440): Học viên & Lớp **93–95** phần tử bấm được trong khung nhìn đầu (63 nút + 26 link) · hồ sơ lớp 56–63 · Lịch Test 59–63 · Công việc 52–53 · so với Tutor 17–23. Thanh phân trang đầy đủ (‹ 1 2 › · Mỗi trang 10 20 50) vẽ **hai lần** trên cùng màn (`modules/students/StudentsPage.tsx:494` và `:525`). Ảnh `SCR/anh/b/overlay-hoc-vien-lop.png`.
- Sửa: đầu bảng chỉ để "1–10 / 20 lớp" (+ ‹ ›), chọn "Mỗi trang" chỉ ở cuối bảng; gộp chip đếm của hàng (Assessment A quyết phương án gộp cụ thể).

### B-05 · P2 · Focus bàn phím bị thanh điều hướng dưới che (điện thoại)
- Vai: mọi vai dùng bàn phím / trình đọc màn hình ở < 768 px (persona Sam).
- Số đo: Học viên & Lớp 375 vai 10, Tab 26–27 — phần tử đang focus ở y 763–807, thanh dưới bắt đầu y 755 → che hết; WCAG 2.2 SC 2.4.11 (AA). Ảnh `SCR/anh/b/kt-focus-che-375.png`.
- Nguyên nhân: `<main>` (`web/src/App.tsx:231`) có `pb-20` nhưng không có `scroll-padding-bottom`; thanh dưới `fixed bottom-0` (`App.tsx:273`).
- Sửa (một lớp): `max-md:scroll-pb-20` trên `<main>`.

### B-06 · P2 · Công cụ đo khung của repo (do-khung) lỗi thời — báo "xanh" nhưng bỏ trống 5 panel
- Vai: đội phát triển; gián tiếp mọi vai (lỗi bố cục lọt qua).
- Bằng chứng: 5/62 kịch bản của repo "không mở được" ở cả 4 chiều (20/256 lần đo của bộ gốc trống): `gv-hop-diem` (tab Điểm theo lớp đã bỏ; nút nay là "Nhập MT1 cũ lớp …"), `panel-pa` (`/hoc-thuat/case/5` chuyển về `/hoc-vien/3?case=5`, không còn nút "Kết quả"), `panel-them-hv` ("+ Học viên" không còn trên hồ sơ lớp — nay trong ⋯ hàng lớp, `StudentsPage.tsx:663`), `hop-ky-nang-mt` (ô `[aria-expanded]` đầu tiên giờ là ô Tìm), `panel-xep-lich-mt` (nút đổi tên "Xếp nhiều MT…") — `SCR/b/kiem-kb.json`, ảnh `SCR/anh/b/_phong-du-phong/kb-*.png`. Không có phép đo bảng rộng hơn thẻ → bỏ lọt B-01. Miễn "cuộn lồng" của panel tại chỗ chỉ áp `gv-ket-qua-pa`, không áp `gvbm` → báo lỗi giả.
- Sửa: cập nhật 5 bộ chọn (bản bù đã chạy được: kịch bản `bu-*` trong `SCR/b/do-khung.mjs`); thêm phép đo "khối / bảng rộng hơn thẻ cha"; miễn `b` cho mọi panel tại chỗ.

### B-07 · P3 · Chữ < 12 px dày đặc trên màn làm việc chính
- Vai: GV trên điện thoại, QL.
- Số đo: hồ sơ lớp 107–108 phần tử < 12 px, Lịch Test 97–106, Quản trị 89–95; 0 chữ < 11 px (đạt luật). Mã: `text-[11px]` 86 chỗ / 40 tệp — ngoài thang 12/13/14/16/20 mà CLI không bắt (Phần 1). Nhãn thanh điều hướng dưới 11,5 px.
- Sửa: nâng 11 → 12 px theo thang DESIGN.md; nhãn thanh dưới 12 px.

### B-08 · P3 · "—" và "/" mang nghĩa nhưng dùng màu trang trí (1,9–2,5:1)
- Vai: mọi vai đọc bảng điểm.
- Số đo: 45 "—" ở hồ sơ lớp FT (1,94:1 tối / 2,37:1 sáng), 32 "/" giữa hai ô điểm lớp thường ở Lịch Test (2,39:1 / 2,47:1), "—" ở Lịch Test 2,1–2,3:1. `text-slate-600` = `--chu-mo`, mà `index.css:85` ghi "chỉ dấu trang trí". Ảnh `SCR/anh/b/kt-chamba-lichtest.png`.
- Sửa: "—" và "/" dùng `text-faint` (≥ 7:1 theo DESIGN.md) — và thống nhất "—" / "chưa có" / "0" (brief §5.4).

### B-09 · P3 · Menu Tài khoản ở điện thoại cao hơn màn hình, trang bị cuộn
- Vai: mọi vai trên điện thoại (nặng với GV dạy nhiều lớp).
- Bằng chứng: do-khung `menu-tk` 375 sáng + tối: `<html>` cuộn 839/812 (trái luật "chỉ `<main>` cuộn"); menu vai 7 có 8 chip GVCN + ~20 chip kỹ năng, "Đăng xuất" ra ngoài màn. Ảnh `SCR/anh/b/khung/menu-tk-375-sang.png`.
- Sửa: menu chỉ giữ thao tác (Hồ sơ cá nhân, Hướng dẫn, Giao diện, Ngôn ngữ, Đăng xuất); phạm vi + kỹ năng phân công chuyển vào Hồ sơ cá nhân; hoặc giới hạn chiều cao + cuộn trong menu.

### B-10 · P3 · Nút ⋯ của ô điểm lớp thường ẩn hẳn tới khi rê chuột
- Vai: GV / QL nhập điểm lớp thường trên máy tính.
- Bằng chứng: 32 nút "Thao tác · <môn> · <HV>" ở Lịch Test nằm trong khối `opacity: 0` khi máy có chuột, chỉ hiện khi rê / focus (`web/src/modules/cham/LuoiThuong.tsx:438`); điện thoại luôn hiện. Máy dò đo 1:1.
- Đánh giá: có lý do (bớt rối mắt) nhưng là thao tác "giấu" (Nielsen #6; cognitive load "hidden navigation"): người mới không biết ô có menu. Hỏi chủ SP (Q2).

**Phát hiện nhẹ khác (P3)**: panel "Chấm Speaking" (GV vai 9) cuộn trong trang 690/1949 → hai vùng cuộn song song ở 1440 · ngăn Case ở 375: nút ⓘ bị cắt ở mép khung cuộn ngang không có mép mờ · ô tích "Chọn: …" và nút mở/thu gọn hàng 16×16 ở máy tính (< 24) · ở 375 Kế hoạch Test, Quản trị và Công việc › Vận hành còn bảng cuộn ngang (Vận hành: cột "Người phụ trách" bị cắt ở mép thẻ, chữ «Mọi người» mất 2 px chân chữ) — DESIGN.md: < 640 px bảng thành thẻ · `:focus-visible { border-radius: 4px }` ngoài thang bo (CLI) · cảnh báo React Router future-flag mỗi lần tải (bản dev).

**Câu hỏi cho chủ SP**
- Q1. Vạch trái 3 px của hàng nhóm (máy dò gọi là dấu hiệu "giao diện AI"; DESIGN.md đang ghi là mẫu chuẩn): giữ hay đổi?
- Q2. Nút ⋯ trong ô điểm lớp thường: ẩn tới khi rê chuột (như nay) hay hiện mờ thường trực?
- Q3. Menu Tài khoản có cần danh sách GVCN + kỹ năng phân công không, hay chuyển sang Hồ sơ cá nhân?
