# GD-6 — Hồ sơ lớp (mockup v21 ②) · khớp / khác

Mockup: `thiet-ke/v21/ho-so-lop.html` + `ho-so-lop-ghi-chu.md` (chủ SP duyệt 15/11, lời 30). Plan: `09-plan-giao-dien-dot-2.md` dòng GD-6.
Dữ liệu seed 14/09 (tên bịa của bộ demo), GVCN tài khoản 7 · lớp MB FT 101 (id 3) · lớp thường MB FOU 12 (id 6) · QL tài khoản 2. Phông Be Vietnam Pro đã nạp (kiểm `document.fonts` trước khi chụp).

## Ảnh

| Ảnh | Khung | Nội dung |
|---|---|---|
| `cap-k1-1440-toi.png` | K1 | đầu trang 2 hàng + dải số + badge cuối dải · Việc cần làm · bảng · phần mở rộng một em (TVV nhỏ, ô S có viền) — mockup │ web |
| `cap-k2b-1440-toi.png` | K2b | chip "Case · 14" → panel việc đầu "1 / 14", chân "Việc tiếp ›" |
| `cap-k5a-1440-toi.png` | K5a | tab Báo cáo PH: đợt · hạn · "bạn còn n / m em" · "Cả lớp đủ" |
| `cap-k6-1440-toi.png` | K6 | lớp thường cùng khung: Điểm theo lượt │ thẻ Môn → Điểm · Case · PA |
| `cap-k8a-375-sang.png` | K8a | 375 sáng: một cột, chip việc, "+ Task" nút tròn nổi, bảng thẻ |
| `cap-k3c-ql-1440-toi.png` | K3c | QL: giữ badge "n việc quá hạn của lớp ›" ([XM-2]) |
| `web-k6-375-sang.png` · `web-y-thuc-1440-toi.png` | K6 375 · tab Ý thức | web (mockup không vẽ 375 lớp thường / tab Ý thức) |
| `truoc-k1-1440-toi.png` · `truoc-k6-1440-toi.png` | — | TRƯỚC PR |
| `zoom-x-ba-cham.png` | — | ✕ / ⋯ phóng to + số đo |

## 1. Truy vết khung → thành phần → kết quả

| # | Khung (ghi chú mockup) | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | K1 hàng 1: ‹ nguồn · mã · chip · Nhập điểm · + Task · ⋯ │ ‹ n/N › | `ThanhTruocSau` + `DauTrangLop` (`giua`) | k1 | KHỚP |
| 2 | K1 hàng 2: GV một dòng gộp theo người, không TVV, bấm mở bản đủ | `DongGiaoVien` (gon / du), `nhomGon` | k1, k8a | KHỚP |
| 3 | K1 ③ dải số mỏng: Lượt mới nhất · Đạt MT ⓘ · SOS + chip mức │ badge phạm vi lớp "›" cuối dải ([XM-5]) | `DaiChiSo` / `ODai` / `OSo` (GD-4) + badge `nutBadge` trong dải | k1, k3c | KHỚP |
| 4 | K1 ④ Việc cần làm: "n việc · m quá hạn" + chip loại (Nhập điểm · Case · Ý thức · Vận hành), không biểu tượng | `ThanhViecLop` dùng `chipViecLop` + `NutChipViec` (chung "Lớp của tôi") | k1 | KHỚP (⚠ → màu, V22) |
| 5 | K2: chip mở THẲNG panel việc đầu (quá hạn trước), "1 / n" đầu panel, "Việc tiếp ›" đi hết loại; Nhập điểm → panel nhập điểm của lớp | `DemViecPanel` (KhungPanel, ô trước ✕) · `PanelViec` · `PanelNhapDiemLop` | k2b | KHỚP |
| 6 | "+ Task" (Case · Vi phạm / Nhắc nhở · Tình hình học tập), chọn em trong lớp ([XM-7]), lớp đã kết thúc không nút ([XM-9]) | `NutTask` `lopId` + `dsEm` (em từ `/roster` đã nạp, lọc tại chỗ, nhóm "Lớp này", dòng phụ tình trạng) + `loai` theo quyền | k1, k8a | KHỚP |
| 7 | Nhập điểm chỉ với người có ô nhập / quyền nhập hộ | `viewer.canEnterScores` = `editableSkills(...)` > 0 (máy chủ: ô của mình, QL, override, GV Speaking) — đúng luật sẵn | k1 | KHỚP (không đổi) |
| 8 | Bỏ badge "n việc quá hạn của lớp" với GV; QL giữ ([XM-2]) | `soViecQuaHan: laVaiQuanLy ? … : 0` | k1, k3c | KHỚP |
| 9 | Phần mở rộng em: Điểm theo lượt │ thẻ Kỹ năng → Điểm · Case · PA · Kết quả PA; TVV nhỏ ở đây; ô điểm đang chọn có viền; thẻ có việc quá hạn của tôi nổi | `MoRongEm` + `TomTatKn` (giữ khung); `quaHanKn` tô chữ màu quá hạn | k1 | KHỚP (⚠ → màu, V22) |
| 10 | Bỏ TVV khỏi đầu trang và dưới tên em (lời 25) | bỏ ô TVV + `tvvRieng` | k1 | KHỚP |
| 11 | K6 lớp thường cùng khung, đơn vị Môn | `MoRongThuong` (Case theo `locCanHoTro`, việc theo `viecCase` chung với `DongCase`) | k6 | KHỚP (cột 3 [XM-K6]) |
| 12 | K6 khối gập "Đã chuyển · đang bổ trợ · n em" | `BangDiemLopThuong` khối gập | — (seed không có em bổ trợ ở lớp đang chạy) | KHỚP (theo code) |
| 13 | K5 tab Báo cáo PH: đợt · hạn · "bạn còn" · "Cả lớp đủ"; đợt tương lai "sắp mở" | `TabBaoCaoPh` | k5a | KHỚP |
| 14 | K8a 375: một cột, "+ Task" nút tròn nổi, bảng thẻ | `NutTask noi="noi"` + `TheDong` | k8a | KHỚP |
| 15 | Tab Ý thức & Phối hợp: lời 28 (Không cần theo dõi / Xác nhận xử lý là NÚT — GD-4a đã làm), thang WL nổi không chữ (lời 36) | `ThangEm` thêm `ThangVach` (cùng hồ sơ HV / panel Xác nhận xử lý) | y-thuc | KHỚP |
| 16 | Lịch sử Case / Nhật ký PA (L1 của GD-4c) | `CasePanel` "Lịch sử · n" → `LichSuGap` (lưới `.ls-ds`, giữ nút Xoá kết quả / Sửa xem lại); `NhatKyPa` → `LichSuGap` + `DsLichSu` | — | KHỚP |

| 17 | (PTA rà #1654 ý 1) chip phạm vi lớp "loại · số" — "Chờ chấm · 21 ›", "Chờ duyệt · 8 ›", "Quá hạn của lớp · 15 ›" (lời 35) | `badgeLop` nhãn "loại · số" + `so`; MỘT thành phần `ChipBadgeLop` (Nhan.tsx) ở đầu hồ sơ lớp VÀ hộp lớp trang Học viên & Lớp | k1, k3c, k6 | KHỚP |
| 18 | (ý 2) badge tab là SỐ, đỏ khi có việc quá hạn của tôi (lời 35, V22) — "Ý thức & Phối hợp 1", "Báo cáo PH 1" | `badgeTabLop` (ClassOverviewPage): Ý thức = số em cần xử lý (đỏ khi tôi có việc Ý thức quá hạn), Báo cáo PH = số việc Báo cáo PH của tôi; nguồn `viec-theo-em` đã tải | k1, k6, k8a | KHỚP |
| 19 | (ý 4) nhãn tab chỉ "Báo cáo PH" (+ số); đợt + hạn ở đầu nội dung tab | bỏ `chip` đợt trong tab; `TabBaoCaoPh` đã ghi "Tháng 9 · hạn 30/09 · bạn còn …" | k5a, k6 | KHỚP |
| 20 | (ý 3) ⋯ thẻ em 375 trong lề thẻ | `NUT_BA_CHAM` chung (BangHoSoLop, BangDiemLopThuong): 44×44, cách mép thẻ 13 px, lệch dọc −0,5 px | k8a, zoom | KHỚP |
| 21 | (ý 5) dải "Chốt lộ trình n/m em đã chốt · Cuối khoá ›" + "Bàn giao môn … · Ghi bàn giao" hiện theo bước (lời 40) | máy chủ `daiChuyenLop`: dải chốt lộ trình cho MỌI người xem lớp (trước chỉ QL) từ mốc nhắc tới hết khoá, "7/7 em đã chốt" vẫn hiện (hết hạn chốt); chip "Chưa chốt lộ trình" tự ẩn khi có dải (`boXep`). Dải Bàn giao môn giữ (hiện khi có lệnh chuyển) | k6 | KHỚP |
| 22 | (ý 6) TVV không dưới tên em ở mọi tab (cả tab Ý thức); "Xem lịch sử" cùng dáng lịch sử gập | bỏ TVV ở `hvEm` (ClassYThucCard); `NutLichSuGap` (LichSuThayDoi.tsx, cùng markup + CSS đầu gập `LichSuGap`) thay `ThanhLs` | y-thuc | KHỚP |
| 23 | 375 dải số: SOS + chip mức một hàng | CSS `.dai-cs-o` lẻ cuối chiếm hai cột cả khi chip lớp đứng sau | k8a | KHỚP |

**KHỚP 23 / 23 = 100 %.** Chỗ mockup vẽ ⚠ cạnh hạn / quá hạn (chip Việc cần làm, thẻ kỹ năng "⚠ Có Case", "⚠ 2 quá hạn"): **KHÁC theo V22** (hạn chỉ màu — chủ SP 14/11, mockup không sửa), không tính lệch.

## 2. GIỮ / KHÁC / [XM] — hỏi PTA Plan

- **[XM-B1] → PTA chốt, đã làm** (dòng 17): chip lớp "loại · số" một thành phần, áp cả Học viên & Lớp; phép kiểm cũ sửa theo.
- **[XM-K6] → PTA đồng ý giữ cột "Việc tiếp"**; backlog (PTA ghi): máy chủ trả Kết quả PA / Mini Test cho lớp thường.
- **[XM-Y1] → PTA chốt, đã làm** (dòng 22). Cột "Đã xử lý · TVV" và bước "Chờ TVV" ở tab Ý thức GIỮ (người làm bước, không phải dòng dưới tên em).
- Dải "Bàn giao môn": web một dải mỗi môn ("Bàn giao môn L", "Bàn giao môn R" — mỗi môn số em + hạn + nút riêng) thay một dải gộp "L, R" của mockup — số em mỗi môn khác nhau, nút mở đúng bảng môn.
- **[XM-N1] "Lớp này" nhóm** trong bước chọn em: ô chọn có tìm chung chỉ vẽ nhãn nhóm khi có ≥ 2 nhóm → hồ sơ lớp (một nhóm) không hiện chữ "Lớp này"; dòng phụ = tình trạng em (SOS n / Đạt / Chưa có kết quả).
- **[XM-P1] Chân panel việc** (K2 vẽ "✓ Đã lưu · Việc tiếp ›"): web theo lời 36 (Đóng · Lưu · "Lưu · việc tiếp ›" / "Việc tiếp ›") — luật mới hơn mockup.
- GIỮ: Nhập điểm nút thường, "+ Task" nút chính ([XM-4] mockup). ⋯ đầu trang giữ đủ mục (`menuHoSoLop`). Khối gập "Điểm Mock Test của lớp" giữ.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | Ghi chú |
|---|---|---|---|
| Quay lại nguồn · lớp trước / sau | hàng 1 | hàng 1 | giữ |
| Nhập điểm (panel của lớp) | nút đầu trang | nút đầu trang (theo `canEnterScores`) + chip "Nhập điểm · n" mở cùng panel | thêm lối |
| + Case | nút đầu trang (chọn em từ `/roster` tải khi mở) | "+ Task › Case" (em từ `/roster` đã nạp) | R2.2 |
| Ghi vi phạm · Báo tình hình | tab Ý thức, ⋯ dòng em | + "+ Task" đầu trang; nút cũ GIỮ | 5.4 |
| ⋯ đầu trang | đủ mục | giữ | |
| Badge chờ chấm / chờ duyệt / thiếu GV / thiếu TT / "+n" | hàng tiêu đề / dải | cuối dải số, cùng đích | [XM-5] |
| Badge "n việc quá hạn của lớp ›" | GV + QL | QL giữ ("Quá hạn của lớp · n ›"); GV bỏ (trùng chip Việc cần làm đỏ) | [XM-2] |
| Chip lớp ở Học viên & Lớp (bấm → đích cũ) | "21 bài chờ chấm" | "Chờ chấm · 21 ›" (cùng đích, thêm "›" vì đổi trang) | lời 35 |
| Mở Cuối khoá từ hồ sơ lớp thường (GV) | ⋯ › Cuối khoá… | + nút "Cuối khoá ›" trên dải Chốt lộ trình | ý 5 |
| Ô số Đạt MT / SOS → panel em | có (GD-4) | giữ | |
| Mở việc của tôi | 3 ô "Việc của tôi" + "+n việc ở Công việc ›" | chip loại → panel việc đầu "1 / n" + "Việc tiếp ›" đi hết loại | R2.3, bỏ lối tắt trùng |
| Bấm tên GV → hồ sơ GV | bản đủ | giữ (bấm dòng mở bản đủ) | [XM-3] |
| Mở rộng em, chọn kỹ năng / môn, ‹ lượt ›, Hồ sơ HV ›, Xem chi tiết, + Case | có | giữ; lớp thường cùng khung | |
| Việc của Case ở lớp thường (Xác nhận Case / PA, Ghi kết quả PA) | dòng `DongCase` | nút ở cột "Việc tiếp" (cùng `viecCase`, cùng panel) | [XM-K6] |
| Xem TVV của em | đầu trang + dưới tên | đầu khối "Điểm theo lượt" | lời 25 |
| Lịch sử Case · Nhật ký PA (panel Case) | `details` riêng / danh sách chữ | "Lịch sử · n" / "Nhật ký PA · n" gập chung (`LichSuGap`), Xoá kết quả / Sửa xem lại giữ | L1 |
| Thang cấp bậc ở hộp thang em (tab Ý thức) | chip bậc | thang vạch (WL đỏ dày) + chip bậc | lời 28, 36 |

Không thao tác nào bị mất.

## 4. Lời 40 (hiện theo trạng thái)
Dải Việc cần làm không vẽ khi không có việc; "m quá hạn" chỉ khi > 0; ô "i / n" chỉ khi n > 1; "Lịch sử · 0" / "Nhật ký PA · 0" không vẽ; "+ Task" không vẽ khi không có mục nào theo quyền hoặc lớp đã kết thúc.

## 5. Đo ✕ / ⋯ (≤ 1 px) — `zoom-x-ba-cham.png`

| Chỗ | 1440 | 375 |
|---|---|---|
| ⋯ đầu trang (so với "Nhập điểm") | 36×36 · lệch dọc 0,3 · ngang 0 | 44×44 · 0,3 · 0 |
| ⋯ dòng em / thẻ em (so với tên em) | 28×28 · −1,0 · 0 | 44×44 · −0,5 · 0 · cách mép thẻ 13 px |
| ✕ panel việc (so với ô "1 / n") | 36×36 · 0,4 · 0 | 44×44 · 0,4 · 0 |

## 6. Hướng dẫn "?"
`shared/huongDan/gv.ts` (Hồ sơ lớp › Các tab: Việc cần làm theo loại, Việc tiếp; phần dưới dòng em + TVV; "+ Task › Case") · `ql.ts` (Tạo Case tay qua "+ Task › Case"). Khoá dịch ở `shared/i18n/en/gd6HoSoLop.ts`.

## 7. Turso — không thêm request
Badge tab dùng `viec-theo-em` đã tải (cùng URL với dải Việc cần làm — không thêm lời gọi). Dải "Chốt lộ trình" cho mọi người xem: +1 câu đếm cho ĐÚNG lớp (`demChotTheoLop([lớp])`, ~sĩ số dòng) chỉ khi lớp thường đã tới mốc nhắc chốt (trước: chỉ QL) — ước < 2 000 dòng / ngày toàn hệ.
Mở hồ sơ lớp: cùng các đường cũ (`/overview`, `/roster`, `/diem-theo-luot`, `/viec-theo-em?chi=toi`, `/cases?classId`, `/xet-lai`, `/hoc-vien-lop/ids`) — không đường mới. "+ Task" dùng `/roster` đã nạp (trước: "+ Case" tải `/roster` lần nữa khi mở → bớt 1 request mỗi lần ghi Case). Chip + panel "i / n" dựng từ `viec-theo-em` đã tải. Thang vạch dùng `/students/:id/y-thuc` đã đọc khi mở hộp thang. Lớp thường: `locCanHoTro` chạy trên `/can-ho-tro` đã đọc.
