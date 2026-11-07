# Audit UI — B: bằng chứng máy (08/11)

Bản: worktree `audit-ui-0811`, main `5a570c2be`. Chỉ đọc + chạy lệnh, không sửa code.
Công cụ: `impeccable detect --json web/src` · skill `web-design-guidelines` (bản Vercel mới nhất) áp bằng quét AST TypeScript
(script `scratchpad/a11y.cjs`) + rg · đo tương phản WCAG 2.x bằng `scratchpad/tp.py`.
Mức: P0 chặn dùng · P1 một nhóm người dùng kẹt · P2 lệch chuẩn rõ, nên sửa · P3 nợ nhỏ. "DTG" = dương tính giả.

## 1. Detector impeccable — 146 phát hiện, gần như hết là DTG

| Luật | Số | Kết luận |
|---|---|---|
| design-system-font-size | 108 | **DTG 107**: 14 / 17 / 28 px đều nằm trong thang G13 (12·13·14·15·17·22·28); detector chỉ đọc khoá YAML, không đọc `note`. 16px !important (index.css:670) = chống Safari phóng to, cố ý. 11px (index.css:1092 `.tvv`) = ngoại lệ chủ SP duyệt 30/10. Nhiều nhất: index.css 43, BangLuotPanel 8, TienDoTrenLop 7, HanhTrinh 7 |
| design-system-radius | 31 | **DTG gần hết**: 2 / 3 / 6 / 9 / 10 px nằm trong ghi chú bán kính DESIGN.md; 0.375 / 0.4rem = ô sửa / btn-sm (Shapes). Lẻ thật nhưng nhỏ: 7px (index.css:1121 `.thang-bc .san`), 16px (index.css:1009 tấm dưới 375 — hợp lý). P3 |
| side-tab | 6 | **DTG**: index.css:448, 473, 977, 978, 1249 = vạch "đang chọn / mở / nháp" theo G14, V18. index.css:321 `.trich` = vạch trích dẫn (blockquote), không phải thẻ trang trí |
| design-system-font | 1 | **DTG**: HieuQuaPa.tsx:184 `[font-family:inherit]` |

## 2. web-design-guidelines (quét AST + đọc tay)

### Bàn phím / vai trò
- worklist/MgmtTasksPage.tsx:229 · `<tr onClick>` mở việc quản lý, trong hàng KHÔNG có link / nút nào → bàn phím không mở được việc · **P1** · thật
- worklist/MeetingPage.tsx:249 · `<td onClick>` mở hộp ô báo cáo meeting, ô chỉ có chữ, không tabIndex / phím · **P2** · thật
- congViec/DanhSachViec.tsx:347, 405, 436 · dòng việc `div onClick` không role/tabIndex; ≥ 640 có nút trong dòng (bàn phím vẫn làm được), 375 ẩn nút theo V18 (chạm cả dòng) · P3 · gần DTG
- 30 hàng / khối `tr|div|article onClick` khác (BangDiemLopThuong:240, BangHoSoLop:190/223, TabTongKetLop:110/135, StudentDetailPage:666/778, CatalogAdmin:98, KhoiNo:110, HopChoDuyet:556, HangNhom:42/83, LopKeHoach:49, NhomDau:13, ChuongLop:121, TheDong:38, PeoplePicker:252…) · đã có link tên / nút "Sửa" / `MuiTenMo` / nút ⋯ trong hàng làm cùng việc → **DTG** (bấm hàng = tiện chuột). Drawer:31, KhungPanel:467, chiChoToi:84, MissingBadge:84 = nền phủ đóng hộp (Esc có) → DTG
- ui/Bang.tsx:101, 151 · hàng có tabIndex + Enter nhưng không `role="button"`/`aria-*` → trình đọc màn chỉ đọc "hàng" · P3
- Nút chỉ biểu tượng thiếu tên: **0 thật** (7 lần quét bắt = nút có component con in chữ: BangCanHoTro:61/76, ChuongLop:161… → DTG). ✕ của Drawer / KhungPanel có `aria-label`
- `<img>` thiếu alt: 0 · `transition: all`: 0 · chặn dán: 0 · `user-scalable=no`: không · có skip link (App.tsx:282)

### Ô nhập thiếu nhãn (82 bắt → 77 DTG vì nằm trong `Field` / `Truong` dựng `<label>`)
- cases/ChiTietKyNang.tsx:47, 54 · ô điểm / tổng chỉ có placeholder "đạt"/"tổng"/"band", tên thành phần ở `span` không gắn · **P2**
- worklist/MeetingPage.tsx:365 · textarea bằng chứng chỉ placeholder · **P2**
- worklist/MeetingPage.tsx:471 · ô "Gõ tên việc…" chỉ placeholder (+ autoFocus) · **P2**
- yThuc/PhoiHopSosSection.tsx:329 · textarea "Ghi chú (tuỳ chọn)" nhánh không `Truong` · **P2**

### Focus
- outline-none 22 chỗ: 20 là khung `tabIndex=-1` nhận focus lập trình (App `<main>`, khối lỗi `lf.o`, h3 panel) → DTG; Filters.tsx:285 có `has-[:focus-visible]:outline` ở nhãn bọc → DTG
- index.css:615 `.o-xem select { outline: none }` · focus chỉ còn đổi màu viền 1 px (`.o-xem:focus-within`) — mỏng, khác vòng 2 px toàn web · **P2**
- classes/banGiaoChung.tsx:41 · option listbox outline-none, focus = chọn (viền trong 1 px accent) · P3
- `:focus-visible` gốc 2 px accent (index.css:203) — tốt; tr.bam thay bằng box-shadow (index.css:738) → DTG

### Chuyển động
- `.skel`, spinner KhuonViec, QuickReport pulse đã tôn trọng reduced-motion. Cuộn `smooth` KHÔNG kiểm reduced-motion: test/LichTestTab.tsx:228 · students/GocPhanCongGv.tsx:294 · students/HanhTrinh.tsx:199 · test/keHoach/LuoiKeHoach.tsx:89 · students/IntakePanel.tsx:161 · P3 (5 chỗ khác đã kiểm — không đồng bộ)

### Thông báo / aria-live
- ui/Toast.tsx:50 `role="status" aria-live="polite"`; 201 chỗ status/alert — đạt. Không phát hiện lỗ

### Chữ / màu / lớp
- Chữ < 12 px: chỉ `.tvv` 11 px (index.css:1092) → ngoại lệ duyệt, DTG. Không có `text-[10px]`/`text-[11px]`
- Màu cứng trong TSX: **0** (mọi `#…` là số PR trong chú thích). Ngoài khối token index.css: 0 (chỉ chú thích); 1 màu cứng trong data-URI mũi tên `.o-chon-vai` (index.css:659, `%237f8aa6` không đổi theo chế độ) · P3
- Tên bảng màu Tailwind (`text-rose-300`, `text-sky-200`, `border-amber-300`…) ~40 chỗ (WelcomePage 17, MgmtTasksPage 5, ChiTietViPham 5…) · đã ánh xạ về token ở tailwind.config.js:47–53 → **DTG màu**, nợ tên P3
- z-index tuỳ ý 30 chỗ: 1–6 (HanhTrinh 11 chỗ), 59 / 60 / 70 / 95 / 100 / 110 — không có thang token; `pc-che` 59 / `pc-hop` 60 ngang Menu 60, LichNho 70 · P3
- Cắt chữ `truncate`/`line-clamp` không `title` cùng phần tử: 88 chỗ (HanhTrinh 7, YThucPhoiHop 4, HopChoDuyet 3, HoSoGiaoVienPage 3, DanhSachHvLop 3, KhungPanel 3…) · nhiều chỗ title ở cha → cần soát tay · P3
- `autoFocus` 18 chỗ (Header:202 ô tìm, HopTutor:71, MeetingPage:471, 3 nút HoTroHocVienTab…) · đa số trong hộp vừa mở → chấp nhận; ô tìm 375 bật bàn phím ngay · P3
- `btn-lg` dùng 3 lần (students/PanelBuocTiep.tsx:110, 111, 176) nhưng **không định nghĩa** trong index.css → lớp chết · P3
- index.html không có `<meta name="theme-color">` (thanh trình duyệt điện thoại không theo nền) · P3
- Không có `Intl.*`/`toLocale*` — ngày tự định dạng `W2 OCT`, `hạn 28/10` theo luật V8 → DTG

## 3. Tương phản token (WCAG; chữ ≥ 4,5 · viền / biểu tượng ≥ 3)

| Cặp | Tối bg / surface / surface-2 | Sáng bg / surface / surface-2 | Đạt? |
|---|---|---|---|
| text | 16,8 / 14,4 / 13,1 | 15,9 / 17,3 / 15,7 | ✓ |
| text-dim | 11,5 / 9,9 / 9,0 | 7,0 / 7,7 / 7,0 | ✓ |
| text-faint | 8,7 / 7,4 / 6,7 | 5,0 / 5,5 / 4,97 | ✓ (sáng sát ngưỡng) |
| accent | 10,2 / 8,8 / 8,0 | 9,0 / 9,9 / 9,0 | ✓ |
| ok / bad / soon / doing | 6,9–12,1 | 5,3–7,3 (soon thấp nhất 5,3) | ✓ |
| ok/bad/soon/doing trên nền riêng (-bg) | 7,1–8,7 | 5,4–6,5 | ✓ |
| hong (`--hong`) | 7,8 / 6,7 / 6,1 | **2,88 / 3,14 / 2,85** | ✗ sáng |
| hong trên hàng khớp `tr.hang-khop` (sáng) | — | **2,90** | ✗ |
| hong-chu | 9,9 / 8,5 / 7,7 | 5,5 / 6,1 / 5,5 | ✓ |
| nút chính chữ / nền | 9,15 | 9,86 | ✓ |
| viền nút chính | 4,0 / 3,5 | 9,0 / 9,9 | ✓ |
| SOS 1 chữ / nền · viền | 10,2 · 8,7 | 6,4 · 3,8 | ✓ |
| SOS 2 chữ / nền · viền | 7,1 · 3,5 | 5,8 · 3,6 | ✓ |
| SOS 3 chữ / nền · viền | 6,4 · 4,0 | 8,6 · 8,6 | ✓ |
| thanh điều hướng chữ / nền | 11,3 | 7,6 | ✓ |
| lịch thi chữ / nền | 6,8 | 7,2 | ✓ |
| accent trên accent-soft (đang chọn) | 7,4 | 8,7 | ✓ |
| viền ô nhập `--o-nhap-vien` / ô sửa | 4,5 / 3,8 / 3,5 | 3,2 / 3,5 / 3,1 | ✓ (sáng sát 3) |
| viền `.btn`, `.doan`, `.o-xem` = `--line-strong` | **2,2 / 1,9 / 1,7** | **1,8 / 2,0 / 1,8** | ✗ (nút có chữ → WCAG 1.4.11 không bắt buộc; `.doan`/`.o-xem` là điều khiển chọn → nên ≥ 3) |
| `--line` (kẻ bảng) | 1,5 / 1,3 / 1,2 | 1,2 / 1,4 / 1,2 | trang trí, không yêu cầu |
| chu-mo (slate-600, dấu ·, ›, "—") | 4,5 / 3,8 / 3,5 | **2,9 / 3,2 / 2,9** | ✗ sáng — gần hết `aria-hidden` (DTG); ODiemLon:203 / MockDetailPage:406 "—" 28 px dùng làm giá trị → P3 |
| hàng mờ `opacity-60` (text-dim / faint) | 4,4 / 3,5 | **2,9 / 2,5** | ✗ |
| hàng mờ `opacity-50` (text / dim / faint) | 4,5 / 3,5 / 2,9 | **3,4 / 2,4 / 2,1** | ✗ |
| nút tắt `opacity .45` | 3,8 | 2,8 | miễn (điều khiển tắt) |

Hàng / khối mờ bằng opacity (nội dung vẫn phải đọc): AccountsAdmin.tsx:263 (TK đã xoá), ChiNhanhAdmin.tsx:46, CatalogAdmin.tsx:99/117, TabTongKetLop.tsx:110/135/149 (em rời sớm), TutorPage.tsx:177, HoSoGiaoVienPage.tsx:441, ChuyenLopPanel.tsx:555/568, OMt.tsx:39.

## 4. Nợ nhất quán (đếm)
- Biến thể nút: 13 tổ hợp lớp — `btn btn-sm` 233 · `btn btn-primary` 125 · `btn` 90 · `btn btn-ghost btn-sm` 61 · `btn btn-primary btn-sm` 61 · `btn btn-ghost` 9 · `btn btn-danger` 8 · `btn btn-danger btn-sm` 4 · `btn-lg` 3 (lớp chết); các tổ hợp "btn-danger btn-primary" là ternary → DTG. Ngoài ra nhiều nút tự đặt `text-[13px] font-semibold min-h-[44px] sm:h-8` cạnh `btn-sm` (DanhSachViec:259, HopChoDuyet:585) → cỡ nút việc chưa gom vào một lớp
- Màu cứng: 0 trong TSX; ~442 `style={{ color/background/border: var(--…) }}` inline (dùng token nhưng rải inline, nên thành lớp)
- In hoa: 2 (XoaTaiKhoanPanel:75 `first-letter:uppercase`, CatalogAdmin:271 ô mã) → cả hai DTG; không có `text-transform: uppercase` trong CSS
- Ký hiệu làm biểu tượng không `aria-hidden` / nhãn trong 3 cấp cha: 129 — ✓ 52 · ⚠ 50 · › 18 · ‹ 2 · ▾ 2 · ✕ 2 · ✗ 2 · × 1 (nhiều nhất CuoiKhoaLop 10, CasePanel 9, SoLieu 7, TaiCho 6, KhuonViec 6). Đều đứng cạnh chữ → trình đọc màn đọc thêm "dấu kiểm / cảnh báo", không mất nghĩa · P3. Riêng "Mọi lúc ✕" (StudentsPage:514) và "✕ Không xếp được" (NganXepLichMt:332) đọc thành "nhân"
- `title=` toàn web: 610 chỗ — nhiều nơi dùng title làm giải thích (dòng Công việc, HopChoDuyet:556) thay ⓘ; không thay nhãn cho nút chỉ biểu tượng (0)

## 5. 10 phát hiện máy quan trọng nhất
1. **P1** worklist/MgmtTasksPage.tsx:229 — hàng việc quản lý chỉ mở bằng chuột (không link/nút, không tabIndex).
2. **P2** index.css:587 `.khop-tim` + :586 `tr.hang-khop` — chữ khớp tìm màu `--hong` ở sáng 2,9–3,1 : 1 (< 4,5); dùng `--hong-chu` (#ae3463) ở sáng.
3. **P2** Hàng mờ bằng `opacity-50/60` ở sáng: text-dim 2,4–2,9, text-faint 2,1–2,5 (AccountsAdmin:263, ChiNhanhAdmin:46, CatalogAdmin:99, TabTongKetLop:110/135, TutorPage:177, HoSoGiaoVienPage:441) — đổi sang màu `row-muted` thay opacity.
4. **P2** worklist/MeetingPage.tsx:249 — ô báo cáo `td onClick` không bàn phím.
5. **P2** 5 ô chỉ có placeholder làm nhãn: ChiTietKyNang.tsx:47/54, MeetingPage.tsx:365/471, PhoiHopSosSection.tsx:329.
6. **P2** index.css:615 `.o-xem select { outline:none }` — focus chỉ đổi màu viền 1 px, lệch vòng 2 px chuẩn.
7. **P2/P3** Viền `--line-strong` của `.btn`, `.doan`, `.o-xem` 1,7–2,2 : 1 cả hai chế độ — điều khiển đoạn / ô chọn khó thấy ranh giới (nút có chữ thì WCAG cho qua).
8. **P3** z-index rải 30 chỗ không thang (1–6, 59, 60, 70, 95, 100, 110); hộp `pc-hop` 60 trùng Menu 60.
9. **P3** 5 lệnh cuộn `smooth` không kiểm reduced-motion (LichTestTab:228, GocPhanCongGv:294, HanhTrinh:199, LuoiKeHoach:89, IntakePanel:161) trong khi 5 chỗ khác có kiểm.
10. **P3** `btn-lg` không tồn tại (PanelBuocTiep:110/111/176); thiếu `meta theme-color`; 88 chỗ cắt chữ không title cùng phần tử cần soát tay.

Ghi chú DTG lớn: 145/146 phát hiện detector là DTG do detector không đọc ghi chú thang chữ / bán kính và luật G14 trong DESIGN.md — cân nhắc thêm 14/17/28 và 2/3/6/9/10 vào khoá YAML để lần sau sạch.
