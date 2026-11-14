# GD-5 — Ô chọn có tìm ở mọi nơi (O-CHON-CO-TIM)

Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/09-plan-giao-dien-dot-2.md` dòng GD-5 · lời 17 ý 5 (`loi-chu-sp.md`) · `04-thiet-ke.md` mục 12 (5.11).
Mockup: ⑤ `thiet-ke/v21/bang-mau.html` khu A (A1–A7) + F2 / F3; bảng kê 63 chỗ `thiet-ke/v21/bang-mau-ghi-chu.md` mục 1 (R5.2); ⓪ `dong-bo-ghi-chu.md` dòng 9, 41, 78.

Ảnh cặp (trái mockup · phải web; seed demo 14/09; phông Be Vietnam Pro đã nạp — `document.fonts.check` = true):

| Ảnh | Mockup | Web |
|---|---|---|
| `cap-1440-toi-task-chon-em.png` | ⑤ khu A (A1–A7) | Công việc, vai 7 GVCN › "+ Task" › Tình hình học tập, gõ "ng" (nhóm theo lớp, chọn nhiều 0 / 8) |
| `cap-375-sang-chon-em.png` | ⑤ A7 (Học viên, chọn nhiều) | Công việc 375, nút tròn "+ Task" › Tình hình học tập → toàn màn, gõ "ng" |
| `cap-1440-toi-loc-lop.png` | ⑤ A3 (trạng thái ô) | Phân tích › Ý thức, vai 2 QL — ô lọc "Mọi lớp" mở, gõ "ft" |
| `zoom-x.png` | ⑤ A3 · A2 góc ✕ (×3) | ô lọc lớp đã chọn · đang gõ ✕ xoá chữ (×3) |

Chụp bằng `scripts/anh-cap.mjs` (không đổi công cụ).

**Đo ✕ (`getBoundingClientRect`, chủ SP 14/11):** mockup `.oc .bo` = ô 28 · tâm lệch 0 px so với tâm ô · lề phải 7 px. Web: ô lọc đã chọn (cao 36) 28 · 0 · 7; ô lọc đang gõ 28 · 0 · 7; "+ Task" chọn nhiều đang gõ (cao 40) 28 · 0 · 7. **≤ 1 px: ĐẠT.**

## 1. Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | A1/A2 ô `.oc`: kính lúp trái · ô gõ · ▾ phải, cao 40, chữ 15, viền ô nhập; rê / focus viền nhấn + vòng | `ChonNguoi` (`ui/PeoplePicker.tsx`) — CSS `.oc*` dời từ `v21.css` vào `index.css` | loc-lop, task-chon-em | KHỚP |
| 2 | A2 đang gõ: ✕ xoá chữ thay ▾, chữ khớp màu nhấn đậm (không nền) | `.oc .bo` + `ToKhop` trong `.oc-muc` | task-chon-em, zoom-x | KHỚP |
| 3 | A2 danh sách nổi `.oc-ds`: nhãn nhóm 12/600 + số mờ, dính đầu khi cuộn; mục hai hàng 14/500 · 12 mờ, cao 44; mục đang chọn nền nhấn nhạt | `.oc-ds` / `.oc-nhom` / `.oc-muc` (mọi 47 chỗ `ChonNguoi` / `ChonLop` cũ nhận dáng mới) | task-chon-em, loc-lop | KHỚP |
| 4 | A2 / A5 nhóm "liên quan trước" | `/ref/nguoi`: GV của lớp → Cùng chi nhánh → Chi nhánh khác (máy chủ thêm `cungCn`, 0 câu thêm) · GV Speaking: "GV Speaking của lớp / chi nhánh" · em: Lớp này → từng lớp của tôi ("· chủ nhiệm") → Lớp khác · lớp lọc: Lớp của tôi → Lớp khác / Đang chạy → Đã kết thúc · TVV: Tôi → TVV chi nhánh · tutor gộp: Tên gần giống → Khác · Báo cáo PH: Chưa xong → Xong | task-chon-em | KHỚP |
| 5 | A2 chân "Gõ để tìm thêm" khi chưa gõ | `.oc-chan` khi `/ref/nguoi` trả đủ 20 | — | KHỚP (mã) |
| 6 | A3 đã chọn: tên đậm · dòng phụ + ✕ | ô chọn người: ✕ = Đổi (mở lại, giữ người cũ tới khi chọn khác — như "Đổi" cũ, ⓪ dòng 9 "✕ đổi"); ô lớp / ô lọc: ✕ = bỏ chọn | zoom-x | KHỚP |
| 7 | A3 tắt (nét đứt, mờ) · lỗi (viền đỏ + vòng) | `.oc.tat` · `.oc.loi` (`invalid`) | — | KHỚP (mã) |
| 8 | A3 rỗng "Không thấy "…"" + câu phụ · đang tải (khung xương) · lỗi tải + Thử lại, chữ gõ giữ | `.oc-rong` · `.oc-tai` · `.oc-loi` (`/ref/nguoi` và tìm em nay có trạng thái lỗi + Thử lại, trước nuốt lỗi thành rỗng) | — | KHỚP (mã) |
| 9 | A4 chọn nhiều: chip ✕ trong ô, "n / 8", "✓ đã chọn" bên phải, tới trần "Tối đa 8 em một lần" + mục tắt "bỏ bớt một em", Backspace ô trống chọn chip cuối rồi bỏ | `ChonNguoi nhieu` — "+ Task" Tình hình (8), hộp Tình hình "+ Chọn em" (8 / Hỏi 1), Ghi vi phạm (trần `TOI_DA_EM_GHI_VI_PHAM`) | task-chon-em | KHỚP |
| 10 | A5 Ghi vi phạm: "Cả lớp" là mục đầu nhóm "Lớp này" | `ChonNguoi dau` ("Cả lớp · n", ✓ khi bật) | — | KHỚP (mã) |
| 11 | A6 danh sách ngắn cố định ≤ 7 mục | không đổi (chip / ô chọn thường giữ) | — | GIỮ |
| 12 | A7 375: chạm ô mở toàn màn — ‹ + tên ô (+ n / 8), ô tìm 44, mục 52, chọn nhiều có "Xong · n em" | `.oc-man` (cổng ra `body`) khi `< 640 px` | 375-sang-chon-em | KHỚP |
| 13 | F2 / F3 bước chọn em của "+ Task" dùng mẫu A trong hộp (danh sách nằm trong hộp) | `HopChonEm` → `ChonNguoi tim tinh` (`/tim/hoc-vien`, cờ `lop=toi` giữ) | task-chon-em | KHỚP |
| 15 | A2 nhãn nhóm kèm mã: "GV của lớp · MB FT 101", "Cùng chi nhánh MB" | `/ref/nguoi` trả `lopMa`, `cnMa` (bảng nhớ lớp + chi nhánh đã đọc cùng câu — 0 câu thêm) | — | KHỚP |
| 16 | A2 tô chữ khớp kể cả khi gõ liền không dấu cách ("ft1" → **MB FT 1**01) | `ToKhop` bỏ qua dấu cách như bộ lọc | loc-lop | KHỚP |
| 14 | Lọc "Mọi lớp" / "Người" / "Mọi TVV" là ô chọn có tìm (`10-ra-dong-bo.md` mục B, dòng 43, 68, 75) | `ChonLop gon` · `ChonLoc` (mới, giá trị chuỗi như `<select>` cũ) cao 36, đang lọc viền nhấn như `OChon dangLoc` | loc-lop | KHỚP |

**Cổng: 16 KHỚP / 17 dòng so hình (B3 KHÁC theo luật thang chữ) = 94 % ≥ 90 % — ĐẠT.**

Dòng BỎ / GIỮ / KHÁC:

| # | Khung / chỗ | Quyết định | Lý do |
|---|---|---|---|
| B1 | Dòng phụ cùng hàng đẩy phải của `ChonLop` (`phuPhai`, mockup V6 cũ) | BỎ | ⑤ A5 lớp đích = mục hai hàng (mã · dòng phụ) |
| B3 | `.oc-man-dau h2` 17 px (mockup 16) | KHÁC nhỏ | luật thang chữ K-CHU-1 (12·13·14·15·17·22·28); 16 chỉ cho ô nhập |

## 2. Bảng thay 16 chỗ (R5.2 C + D)

| # R5.2 | Chỗ | Trước | Sau |
|---|---|---|---|
| 48 | Báo cáo PH · viết (điện thoại) — đi tới em | `<select>` + ‹ › | `ChonNguoi ds` (Chưa xong → Xong), giữ ‹ › |
| 49 | Chấm Speaking "Mọi lớp" | — | không còn `<select>` ở mã hiện tại (đã thành ô tìm lọc) — không đổi |
| 50 | Chờ duyệt — lọc Lớp | `<select>` dáng nút lọc | `ChonLop gon` |
| 51 | Phân tích "Mọi lớp ▾" (+ Đã kết thúc) | `OChon` | `ChonLop gon` — Đang chạy → Đã kết thúc |
| 52 | Quản trị › Nhật ký chung — Người | `ChonDangNut` | `ChonLoc` |
| 53 | Lịch thi "Mọi TVV" | `<select>` | `ChonLoc` — Tôi → TVV chi nhánh → Chưa có TVV |
| 54 | Học viên & Lớp "Mọi lớp" | `<select>` | `ChonLop gon` — Lớp của tôi → Lớp khác |
| 55 | Tutor — Gộp tên gõ tay "Gộp vào" | `<select>` + "+ Thêm vào danh sách" | `ChonNguoi ds` + `them` "+ Thêm vào danh sách" (giữ), choTrong "— Chưa gộp —" |
| 56 | Hộp Tình hình "+ Chọn em" | `<select>` thêm chip | `ChonNguoi nhieu` (≤ 8, Hỏi = 1) |
| 57 | Thanh trên — Tìm (Ctrl K) | combobox tự viết | GIỮ logic (mở hồ sơ, đã LIMIT 6); nhãn nhóm `.oc-nhom`, dòng chọn nền nhấn, cao 44 |
| 58 | Kế hoạch Test "Tìm lớp, học viên hoặc email" | combobox tự viết | dáng `.oc` + `.oc-ds` (nhóm Lớp / Học viên có số, tô chữ khớp, tải / rỗng / lỗi); GIỮ ô gõ điều khiển (chữ còn lọc lưới) |
| 59, 60 | Xuất kế hoạch / Xuất MT "Tìm lớp…" | combobox lọc web | `TimLop` dựng trên `ChonLop` |
| 61 | Ghi vi phạm — Học viên | nút ▾ + danh sách tick | `ChonNguoi nhieu` + "Cả lớp · n" (`dau`); Mô tả riêng từng em giữ |
| 62 | Xếp MT theo học viên — tick 1–3 em | ô tìm + danh sách tick có trạng thái MT | GIỮ [XM-a] |
| 63 | Bàn giao — Học viên cần bàn giao | listbox ↑ ↓ | GIỮ [XM-a] |
| — | "+ Task" bước chọn em (`HopChonEm`, `ponytail:` chờ GD-5) | ô tìm riêng | `ChonNguoi tim` — gỡ `ponytail:` |

47 chỗ `ChonNguoi` / `ChonLop` (R5.2 A + B) đổi dáng qua thành phần, không sửa nơi gọi (kể cả `PanelViec.tsx` #13, `GvCham` / `KhungPanel` #9 — không sửa tệp đó).

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Chọn người / lớp / em | gõ trong ô, cuộn `<select>`, hoặc ô tự viết mỗi nơi một kiểu | gõ không dấu hoặc chọn ngay trong nhóm liên quan; ↓ ↑ Enter Esc Tab |
| Đổi người đã chọn | chữ "Đổi" | ✕ (= Đổi, giữ người cũ nếu rời ô không chọn) hoặc bấm cả ô |
| "Tôi", "Dùng tên ngoài hệ thống", `choTrong`, Tutor, "+ Mở lớp mới…", "Không đổi · hiện", "Mặc định: …" | có | giữ nguyên |
| Esc | đóng danh sách | lần 1 đóng danh sách, lần 2 xoá chữ gõ (không đóng panel) |
| Chọn nhiều em | `<select>` thêm chip / tick | chip trong ô, Backspace bỏ chip cuối (2 lần), bấm lại mục đã chọn = bỏ |
| Lọc lớp / TVV / người | `<select>` | ô lọc có tìm, ✕ bỏ lọc; URL / giá trị như cũ |
| Báo cáo PH đi tới em (375) | `<select>` + ‹ › | ô chọn có tìm + ‹ › |
| 375 | `<select>` gốc / danh sách trong ô | toàn màn ‹ · ô tìm · danh sách · (Xong) |
| Lỗi tải danh sách | im lặng thành rỗng | "Không tải được" + Thử lại, chữ gõ giữ |

Không mất thao tác nào.

## 4. Turso (đo `tocDo.run.ts`, seed)

| Đường | Câu / lần | Dòng / lần | Trần câu · dòng |
|---|---|---|---|
| `/ref/nguoi?nhom=nhan_vien` (chưa gõ) | 3 | 12 (QT 22) | 25 · 62 (QT 72) |
| `/ref/nguoi?q=ng&nhom=nhan_vien` (mỗi lần gõ) | 3 | 12 (QT 22) | 25 · 62 (QT 72) |
| `/ref/nguoi?q=ng&nhom=gv_speaking` | 3 | 6 (QT 10) | 25 · 56 (QT 60) |
| `/tim/hoc-vien?q=ng&lop=toi` (em, đã có) | 3 | LIMIT 40 | 13 (giữ) |

Trước → sau: `/ref/nguoi` cùng một câu SQL (chỉ đổi `GROUP_CONCAT` chi nhánh sang `id|mã` để nhóm) → câu và dòng không đổi; ô lọc mới dùng dữ liệu trang đã nạp (0 request thêm); ô "+ Task" vẫn một GET mỗi lần gõ ≥ 2 chữ (trễ 250 ms). Bốn cảnh báo dòng đọc ở bảng kê đã được OV6-DOC-CHON xử lý trước PR này (`/ref/users` không còn gọi, `/classes?gon=1`, `/students?gioiHan=6`, một GET lớp đích).

## 5. [XM] — hỏi PTA Plan

- **[XM-a]** #62 Xếp MT theo học viên và #63 Bàn giao: danh sách làm việc (mỗi dòng có trạng thái MT / bàn giao, master–detail), không phải ô nhập — đổi sang ô chọn mất thông tin để quyết. Giữ; ô tìm lọc của #62 là loại "ô tìm LỌC bảng" (bảng kê: giữ). Muốn thêm ô tìm cùng dáng cho #63 thì làm PR riêng.
- **[XM-b]** ⑤ F3 gộp chọn em + Nội dung vào MỘT hộp Tình hình (lời 36) — chưa làm ở đây (hộp Tình hình là GD-4d); PR này chỉ thay ô chọn trong hai bước hiện có.
- **[XM-c]** Chọn nhiều: mockup A4 không vẽ ✕ xoá chữ; giữ ✕ (đã đo ở #1602), đặt sát mép phải sau "n / 8".
- **[XM-d]** Nhóm "Gần đây" (⑤ A5 người nhận việc, [XM-4] tờ mẫu: đề xuất) — chưa làm.
- **[XM-e]** Chỗ ô chọn nằm trong `KhungPanel` / `PanelViec.tsx` (#9, #13) nhận dáng mới qua thành phần, không sửa hai tệp đó (GD-4b đang sửa).
