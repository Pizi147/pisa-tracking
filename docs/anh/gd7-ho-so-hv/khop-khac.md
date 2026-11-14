# GD-7 — Hồ sơ học viên theo mockup ③ (`thiet-ke/v21/ho-so-hv.html`, chủ SP duyệt 15/11 lời 28; đã sửa đồng bộ ⓪)

Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/09-plan-giao-dien-dot-2.md` dòng GD-7. Luật áp: V22 (hạn chỉ bằng màu), lời 26 (giữ TVV), 35 (tên bậc VIẾT HOA), 36 (thang vạch không chữ), 40 (hiện theo trạng thái).
Ảnh cặp (trái mockup · phải web, seed demo 14/09; phông Be Vietnam Pro + Inter đã nạp — `document.fonts.check` = true):
- `cap-1440-toi.png` — K1 ↔ `/hoc-vien/4`, GVCN Trần Ngọc Hà (vai 7), tab Học thuật
- `cap-1440-y-thuc.png` — K4a ↔ `/hoc-vien/4?tab=y-thuc` (Lịch sử gập mặc định, [XM-4]); `y-thuc-lich-su-mo-1440.png` = Lịch sử đã mở
- `cap-375-sang.png` — K8a ↔ `/hoc-vien/4` 375 sáng (khung mockup K8a vẽ tối)
- `cap-1440-target.png` — K5 ↔ `/hoc-vien/32`, GVBM (vai 15), em chưa có Target
- `panel-nhap-diem-1440.png` — K2b: bấm dòng Nhập điểm → panel lưới lớp × tuần của việc, ngay tại hồ sơ
- `zoom-nut-task-x.png` — "+ Task" │ "⋯" đầu hồ sơ · ✕ panel việc (zoom 3×)
- `truoc-1440.png`, `truoc-y-thuc-1440.png` — ảnh TRƯỚC PR (mockup │ web main)

Dữ liệu demo khác dữ liệu mockup (tên, số việc, Case) — không tính lệch.

## 1. Truy vết khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | K1 ‹ Học viên & Lớp · Trước / Sau em | `ThanhTruocSau` (giữ) | cap-1440-toi | KHỚP |
| 2 | K1 Tên + chip trạng thái | `h1` (giữ) | cap-1440-toi | KHỚP |
| 3 | K1 **+ Task** (Case · Vi phạm / Nhắc nhở · Tình hình học tập), em điền sẵn, thay "+ Case" | `NutTask noi="dau" em dauHoSo` + `muc` theo quyền máy chủ | cap-1440-toi, zoom | KHỚP |
| 4 | K1 "⋯" theo vai, đủ mục, cùng thứ tự | `mucQuanLyHocVien` + `MenuDong` (giữ) | cap-1440-target | KHỚP |
| 5 | K1 Dòng thông tin Lớp · Lộ trình · Target · Tuần học · Thi thật · GVCN · **TVV** (lời 26 GIỮ) + liên hệ | `DongThongTin` · `DongLienHe` (giữ) | cap-1440-toi | KHỚP |
| 6 | K1 6 ô điểm + "Mock Test gần nhất · MT · tuần" | `DiemDau` (giữ; lời 40: đã thi → ô Thi thật thay Overall) | cap-1440-toi | KHỚP |
| 7 | K1 **Việc cần làm** = thẻ nhóm: dải "Việc cần làm · n việc · n quá hạn" (đỏ, không ⚠) | `ThanhViec` (viết lại) | cap-1440-toi | KHỚP (KHÁC theo V22: bỏ ⚠) |
| 8 | K1 dòng việc chuẩn: ô vuông · tên việc ngắn · thẻ phụ kỹ năng → kỳ / tuần → số · viên hạn · nút; 1440 hai cột | `DongViecHs` + `ThePhu` / `thePhu` / `IconNhom` của Công việc + `ChipHan vien` | cap-1440-toi | KHỚP |
| 9 | K1 đủ việc của người xem (thêm Nhập điểm, Trả lời tình hình), quá hạn lên đầu, bỏ "+n việc khác" | máy chủ `viecHocVien.ts` (#1648) — web hiện hết | cap-1440-target (Nhập điểm), cap-1440-toi | KHỚP |
| 10 | K2 bấm dòng việc → **panel việc** nổi phải (cùng panel Công việc), ✕ / Esc / nền trả về chỗ cũ; không nhảy tab | `viecSangPanel` → `PanelViec` (lazy) tại hồ sơ; "Lưu · việc tiếp ›" khi còn việc kế | panel-nhap-diem-1440 | KHỚP |
| 11 | K2b panel Nhập điểm = lưới lớp × tuần của việc, em đang xem lên đầu | `PanelNhapDiemTuan` (máy chủ trả thêm `periodId` / `kind` của việc, cùng Công việc) | panel-nhap-diem-1440 | KHỚP |
| 12 | K1 3 tab Học thuật · Ý thức & Phối hợp · Lộ trình & lớp | `HangTab` (giữ; bỏ chấm cảnh báo tab Ý thức — V22, mockup không có) | cap-1440-toi | KHỚP |
| 13 | K1 bảng Mock Test | `KhoiMockTest` (giữ) | cap-1440-toi | KHỚP |
| 14 | K1 hai cột **Tiến độ │ Case & phương án** (5 : 7) | (giữ) | cap-1440-toi | KHỚP |
| 15 | K1 trong Case: Lịch sử · n | `CasePanel` → `LichSuGap` (một kiểu lịch sử GD-4c) | — (Case demo chưa có lịch sử) | KHỚP (KHÁC-1) |
| 16 | K1 thẻ PA: Nhật ký | `CasePanel` `ThePa` → `LichSuGap tieuDe="Nhật ký"` | — | KHỚP |
| 17 | K3 dòng quy chế ở Mô tả · Chọn PA · Ghi kết quả · Hoàn thành | đã có từ GD-3 / GD-4b (`DongQuyChe`, `quyCheCase.ts`) — cùng thân Case ở cột và panel | — | KHỚP (GIỮ) |
| 18 | K4a tab Ý thức: thanh "Đã tới REPORT 1 · thang vạch · Bậc kế · Thang ▾" + Khai / Báo tình hình / **+ Vi phạm / Nhắc nhở** | `StudentYThucSection` dải bậc ("Đã tới", nút viền, chữ mới) | cap-1440-y-thuc | KHỚP |
| 19 | K4a MỘT bảng: đầu cột Ngày · Vấn đề · Đã xử lý · Bước đang làm → "Đang chờ · n việc" (vạch vàng trái) | `DauCotEm` một lần + dòng `DongLan` (giữ) | cap-1440-y-thuc | KHỚP |
| 20 | K4a "Lịch sử · n" tại khối, lọc loại · Lộ trình \| Cả lịch sử · Mọi nhóm bên trong | `LichSuGap` (gập mặc định — [XM-4]) | y-thuc-lich-su-mo-1440 | KHỚP |
| 21 | K4a "Xác nhận xử lý" / "Đã xem · n" là NÚT (lời 28) | (đã có GD-4a) | cap-1440-y-thuc | KHỚP |
| 22 | K4b hai tab nhỏ Tình hình học tập / Ý thức · Phối hợp SOS | `TabNho` (giữ) | cap-1440-y-thuc | KHỚP |
| 23 | K5 GVCN / GV lớp, em chưa có Target: ô Target "Chưa có" màu nhắc + **Đề xuất sửa** | `DongThongTin deXuatTarget` (bỏ nhãn "Em chưa có Target" cạnh tên) | cap-1440-target | KHỚP |
| 24 | K6 người chỉ xem / TVV: "+ Task" chỉ mục làm được (TVV: Hỏi tình hình học tập) | `muc` + `hoi` (quyền `coTheHoi` / `coTheBao` / `canRecord` / `canReport` từ đường `/y-thuc` đã nạp) | — | KHỚP (mã) |
| 25 | K7 Tạm dừng · Lưu trữ ("Quay lại học" nút chính, "+ Task" nút thường — [XM-5]) | `DaiTamDung` (giữ) · `NutTask phu` | — | KHỚP (mã) |
| 26 | K8a 375: Case trước Tiến độ, MT thẻ, nút tròn "+ Task" | (giữ) + `NutTask noi="noi"` | cap-375-sang | KHỚP |
| 27 | K8a 375 dải việc: số + "n" quá hạn gọn, dòng chạm cả dòng, hạn dưới tên, "›" | `ThanhViec` 375 | cap-375-sang | KHỚP |
| 28 | Hướng dẫn "?" | `shared/huongDan/{gv,ql,tvv}.ts` + `en/gd7.ts` | — | KHỚP |

**KHỚP 28 / 28 = 100 %** thành phần; lệch hình có lý do ở mục 2.

## 2. KHÁC (có lý do)
- **KHÁC theo V22** (lời 43, 44): mockup còn "⚠ 1 quá hạn", "⚠ quá hạn 6 ngày", "● Chưa xem" → web chỉ màu (đỏ / vàng / xám), không ⚠ / ●.
- **KHÁC-1** "Lịch sử · n" trong Case: mockup vẽ hàng chữ "Lịch sử · 4 … Xem ▾"; web dùng gập chung `LichSuGap` (biểu tượng đồng hồ + chevron, khung viền) — plan GD-7 + GD-4c H4 "một kiểu lịch sử". Tab Ý thức cùng dáng đó (bỏ khung viền vì nằm trong bảng).
- **KHÁC-2** viên hạn dòng việc "hạn 18/09" là viên xám (mockup ① / ③ chữ trơn): CÙNG `ChipHan vien` với dòng Công việc (GD-4c [XM-B] 4a — một dáng ở mọi nơi).
- **KHÁC-3** tab Ý thức có thêm ngày lần xử lý gần nhất "07/08" sau thang vạch — thông tin cũ GIỮ.
- **KHÁC-4** 375: Case của tôi vẫn mở sẵn như 1440 (mockup 375 vẽ gập) — hành vi cũ GIỮ, ngoài phạm vi.
- **[XM] "Đã tới"**: mã cũ ghi "chủ SP 12/11: không 'Đã tới'"; mockup ③ (duyệt 15/11, mới hơn) vẽ "Đã tới REPORT 1" → theo mockup (CLAUDE.md "khung mockup đã duyệt thắng luật giao diện cũ hơn ngày duyệt"). PTA Plan muốn giữ bản cũ thì bỏ một dòng.
- Mockup K1 GV bộ môn có "+ Ghi tiến độ" trên Tiến độ; web chỉ hiện khi đã chọn một kỹ năng (Overall không ghi) — hành vi cũ, ngoài phạm vi.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| + Case (đầu hồ sơ) | nút "+ Case" | "+ Task › Case" (cùng form `QuickReport`, em + lộ trình điền sẵn; Case trùng / "Thêm PA" vẫn mở Case tại hồ sơ) | ĐỔI 1 → 2 bấm ([XM-2]) |
| Ghi vi phạm / nhắc nhở | tab Ý thức "+ Ghi vi phạm" | giữ ở tab (chữ "+ Vi phạm / Nhắc nhở") + cửa "+ Task" | GIỮ + THÊM |
| Báo tình hình (GV) · Hỏi tình hình (TVV) | tab Ý thức | giữ ở tab + cửa "+ Task" (TVV: "Hỏi tình hình học tập") | GIỮ + THÊM |
| Bấm một việc ở thanh việc | Case → mở trong cột Case; Ý thức → nhảy tab; Nhập điểm / Tình hình → (không có ở hồ sơ) | panel việc nổi phải, cùng panel Công việc; "Lưu · việc tiếp ›" | ĐỔI ([XM-3]: bấm hàng Case ở cột phải vẫn mở tại chỗ) |
| "+n việc khác của tôi" | thanh việc | bỏ — hiện ĐỦ việc | BỎ (M4) |
| Chọn bước tiếp / Cập nhật KQ thi thật (từ thanh việc) | đổi URL mở panel | panel Sau thi tại chỗ (cùng Công việc) | ĐỔI nhỏ |
| Báo PH kết quả Test · Bàn giao (từ thanh việc) | tab Phối hợp / trang lớp | giữ | GIỮ |
| Đề xuất sửa (em chưa có Target) | chữ cạnh tên | ô Target "Chưa có · Đề xuất sửa" | ĐỔI chỗ |
| ⋯ (mọi mục), Quay lại học, Gia hạn, Trước / Sau em, ô điểm đổi kỹ năng, MT ›, + Ghi tiến độ, mọi thao tác trong Case | — | giữ, cùng chỗ | GIỮ |
| Ý thức: Khai / sửa cấp bậc · Thang ▾ · Đã xem · Xác nhận xử lý · Trả lời · Sửa hạn · Rút | — | giữ | GIỮ |
| Ý thức: lọc loại · Lộ trình \| Cả lịch sử · Mọi nhóm | đầu khối "Cả quá trình" (luôn mở) | trong "Lịch sử · n" (gập mặc định; "Xem lại" sau Đã xem tự mở) | ĐỔI chỗ (R3.5) |
| Chờ bạn duyệt (QL) | dưới thanh việc | giữ | GIỮ |

Không thao tác nào bị mất.

## 4. Đo
- **Turso**: mở hồ sơ `/hoc-vien/4` (GVCN) — TRƯỚC 10 request API · SAU 10 request, cùng danh sách (tab Ý thức: 10 · 10). Máy chủ: `viecHocVien.ts` chỉ gắn thêm `periodId` / `kind` / `soBai` (Nhập điểm) và `cauHoi` (Tình hình) từ dữ liệu đã đọc — **0 câu SQL thêm**. Panel việc chỉ đọc khi bấm (đường cũ của Công việc). Quyền "+ Task" lấy từ `/students/:id/y-thuc` vốn đã gọi cho tab.
- **✕ / ⋯** (`getBoundingClientRect`, 1440): "+ Task" top 155.2 · cao 36 · tâm y 173.2 │ "⋯" top 155.2 · cao 36 · tâm y 173.2 → lệch 0 px (trước sửa: "+ Task" cao 34, lệch 1 px tâm — đã chỉnh `dauHoSo`). ✕ panel việc: cao 36, tâm y 28, mép phải cách mép panel 20 px — cùng `KhungPanel` của Công việc (không đổi).
- `npm run check` đầy đủ: xanh.

## 5. Thành phần chung đã sửa (bắt buộc)
- `congViec/NutTask.tsx`: thêm prop (không đổi hành vi nơi khác) — `muc` (mục theo quyền), `hoi` (TVV), `onXong`, `cycleId` + `onMoCase` (giữ thao tác cũ của "+ Case"), `phu` (nút thường khi em lưu trữ), `dauHoSo` (cao 36 như "⋯").
- `cases/CasePanel.tsx`: "Lịch sử · n" và "Nhật ký" của PA → `LichSuGap` (áp mọi nơi mở Case: cột Case hồ sơ HV, panel Công việc, hồ sơ lớp).
