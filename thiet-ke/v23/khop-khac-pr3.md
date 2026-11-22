# NHẸ HƠN PR-3 · TỔNG QUAN — khớp / khác (mockup v23 `tong-quan.html` T1–T4 · `tong-quan-head-gv.html` · phương án C)

Đặc tả `docs/superpowers/specs/2026-11-22-nhe-hon-design.md` mục 3 + 6.1–6.3 (thắng ảnh). PTA chốt #1994: XM-P3-1 = A (Công việc "Tất cả"), XM-P3-2 ẩn Lịch thi / Hồ sơ của Admin, XM-P3-3 bỏ MockTestAdmin, XM-P3-4 đồng ý.
Ảnh cặp: `docs/anh/nh-pr3/{head,admin,cx,qt}-{1440-toi,1280-toi,375-sang}.png` + `*-panel-1440-toi.png`.

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần web | Ảnh | Khớp |
|---|---|---|---|
| Đầu "Tổng quan · chi nhánh · W4 NOV" | `DauTrangTq` (OverviewPage) | mọi ảnh | KHỚP (+ link "Việc của tôi ›", "Lịch thi ›", "Báo cáo ›" — GIỮ, xem XM-P3-5) |
| Hàng "Cần xử lý" 3–4 ô, ô 0 viền đứt "✓ không có" | `OCan` · `HangO` (TongQuanVai) | T1 · T2 · T3 · T4 | KHỚP |
| Head / QT ô GV quá hạn · Chờ duyệt · Em SOS cần chú ý | `TongQuanHead` | head · qt | KHỚP; QT không có ô "Việc hệ thống" (BỎ — chưa có nguồn, XM-P3-4) |
| Admin ô Điểm chưa đủ · Báo cáo PH chưa đủ | `TongQuanAdmin` | admin | KHỚP 2/4; Lịch thi · Hồ sơ BỎ (XM-P3-2: Admin không có việc đó ở Công việc) |
| CX ô Em SOS 2–3 · Meeting chờ kết quả · Chưa chốt bước tiếp › | `TongQuanCx` | cx | KHỚP; "Chưa chốt bước tiếp ›" đổi trang HV & Lớp (GIỮ đích cũ, danh sách em ở đó) |
| Khối Giáo viên NGANG Chờ duyệt, cân đáy; Loại ≤ 3 + "+n" | `KhoiGiaoVien` · `LoaiGv` | head · qt | KHỚP (đặc tả 6.1 thắng ảnh) |
| Lớp cần chú ý — ma trận C ~60 % + Tình hình cạnh | `LopCanChuYC` · `OMaTran` · `TinhHinh` | head · admin · qt | KHỚP; màu ở số: quá hạn = nền đặc đỏ, sắp đến = viền vàng (đặc tả 6.3 + PTA rà #2002 — bỏ chấm tròn + chú giải) |
| Em cần chú ý (CX) | `TongQuanCx` (Bang, 375 `theRieng`) | cx | KHỚP |
| Tình hình 4 số (dọc cạnh ma trận / ngang ở CX) + FT · Lớp thường | `TinhHinh` | mọi ảnh | KHÁC nhẹ: số màu nhấn (luật ô số bấm được — `mauOSo`), mockup chữ trắng |
| Panel T1c "GV quá hạn" nhóm theo GV | `PanelDsViec` | head-panel | KHỚP; bấm dòng → `PanelViec` thay nội dung (‹ quay lại), làm thay N64 |
| Panel T2c "Điểm chưa đủ" bảng cột cố định + hàng tổng | `PanelDiemAdmin` | admin-panel | KHỚP |
| Panel T3c / ô SOS | panel SOS 2–3 sẵn có (`/tong-quan/chi-nhanh/sos23`) | cx-panel | KHỚP |
| Panel ô ma trận (T2d) | `PanelDsViec` lọc lớp + loại | qt-panel | KHỚP (dạng danh sách việc, chip kỹ năng ở dòng phụ) |
| 375: Lớp cần chú ý → Giáo viên → Tình hình 2×2 | `max-sm:contents` + `order` | *-375-sang | KHỚP (Chờ duyệt GIỮ dưới Giáo viên) |
| Bảng "Theo chi nhánh" (QT / CX cũ) | — | — | BỎ theo T3 / T4 (chọn chi nhánh ở ô Chi nhánh; số chi nhánh ở Phân tích › Chi nhánh) |

## Thao tác TRƯỚC → SAU (so `TongQuanV5.tsx` / `MockTestAdmin.tsx` trước PR)

| Trước | Sau | Lý do |
|---|---|---|
| Dải ô Việc của tôi · Chờ duyệt · Đạt MT · Case chưa có PA · Thi tháng này | Cần xử lý (ô theo vai) + Tình hình (Đạt MT · SOS 1·2·3 · Thi tháng này · Đạt Target) | mockup T1–T4; Case chưa có PA → cột "Case chưa PA" của ma trận + Phân tích (XM-15) |
| Ô "Việc của tôi ›" | link "Việc của tôi · n ›" đầu trang (cùng `OViecCuaToi`, số badge) | GIỮ thao tác XM 3 (11/11) — [XM-P3-5] |
| Bảng GV cần chú ý (Hành chính % đúng hạn · Chưa làm · Bài quá hạn; Học thuật) + panel bài trễ / Nhập hộ | Khối Giáo viên (quá hạn · loại) → panel việc quá hạn → bấm dòng chấm mở lưới nhập hộ ngay | XM-15 (chỉ số % sang Phân tích GV); Nhập hộ vẫn tại chỗ qua `PanelViec` |
| Lớp cần chú ý (Đạt MT · SOS · Case · Thi, bấm số → panel) | ma trận lớp × loại (bấm ô → panel đúng lớp + loại); SOS 2–3 vẫn bấm → panel em | phương án C |
| Chờ duyệt cột phải + "+ n yêu cầu" + panel duyệt | GIỮ (ngang khối Giáo viên); ô "Chờ duyệt" mở panel danh sách → duyệt tại chỗ | — |
| QT / CX bảng Theo chi nhánh (bấm dòng đổi chi nhánh) | BỎ — đổi chi nhánh ở ô Chi nhánh đầu trang | mockup T3 / T4 |
| Admin: 3 ô Mock Test + Lịch sắp tới | BỎ; "Lịch tuần ›" đầu trang GIỮ | XM-P3-3 (PTA đồng ý) |
| CX: ô Chờ KQ thi thật › | BỎ khỏi Tổng quan (chip "Đã thi · chờ KQ" ở HV & Lớp) | mockup T3 |
| Chọn chi nhánh · FT / Lớp thường | GIỮ (FT / Lớp thường sang đầu khối Tình hình) | mockup |

## Turso — PTA rà #2002: phương án nhẹ (đo `do-ban-chep`-kiểu, mỗi bộ trước / sau một tiến trình riêng, cùng bản chép mới)

Cách làm: Tổng quan gọi MỘT GET `/tong-quan/v5?gon=1&kemViec=1`:
- `gon=1` — bảng chi nhánh chỉ tính SOS (Tình hình + ma trận); bỏ tập trang không hiện (dưới kỳ vọng, Case, độ phủ, nợ điểm, đã thi chờ KQ). Phép kiểm: SOS theo lớp / id em / Tình hình = bản đủ.
- `kemViec=1` (Head / QT / Admin) — kèm CHÍNH `dong` Công việc "Tất cả" (`myWork` nguoi=tat-ca, cùng quyền route `/my-work`) trong cùng request: lượt / lịch kỹ năng / điểm đọc một lần (`nhoTheoId`). Số khối GV / ma trận vẫn = `demDongViec` Công việc "Của GV" (phép kiểm giữ).
- Bỏ: `/phan-tich/giao-vien` (Head) · `/my-work?nguoi=tat-ca` riêng · `/tong-quan/mock-test` + `/highlights` (Admin) · Trễ chấm + caseGv.

| Cả lượt trang | Bản chép thật (câu · dòng) | Seed (câu · dòng) |
|---|---|---|
| Head / QL | 167 · 27 868 → **136 · 24 271** | 153 · 3 625 → 186 · 3 022 |
| Quản trị toàn hệ thống | 91 · 24 746 → **135 · 25 424** | 140 · 3 910 → 192 · 3 978 |
| CX | 57 · 12 454 → **50 · 11 435** | 72 · 5 307 → 66 · 4 596 |
| Admin | 50 · 4 077 → **45 · 7 036** | 86 · 1 214 → 82 · 2 228 |

- Dòng / ngày (Head ~100 · QT ~20 · CX ~50 · Admin ~50 lần mở): −360 k + 14 k − 50 k + 150 k ≈ **−250 nghìn dòng / ngày** (giảm).
- Câu: Head −31, CX −7, Admin −5; **QT +44 (+48 %)** — vượt mốc +10 % câu (đi vào `myWork` toàn hệ thống); dòng QT +0,7 k / lần.
- Đổi lại: mở Công việc sau Tổng quan không còn dùng chung bản `/my-work?nguoi=tat-ca` (khác URL).
- Trần `tocDoDuong.ts` (seed phép đo): `…/v5?ct=ft&gon=1&kemViec=1` QL 97 · QT 102 · ADMIN 46 câu, CX `gon=1` 35; trang QL 107 → 125 (đo 96), QT mới 132 (đo 101), CX 80 (đo 61), Admin 60 (đo 41).

## Hạn (PTA rà #2002)

- Mọi hạn ở Tổng quan: chữ dd/mm/yyyy tô theo `mucHan`, KHÔNG ⚠ (luật V22 / NH4) — ô Chờ duyệt, danh sách Chờ duyệt, ô Báo cáo PH / Meeting, bảng "Điểm chưa đủ", Em cần chú ý (`NgayHan`).
- Panel việc (GV quá hạn, ô ma trận): dòng quá hạn chỉ "quá hạn n ngày" (như T1c); chưa quá hạn ghi ngày tô màu.
- Ma trận "Lớp cần chú ý": dấu thêm cho quá hạn = NỀN ĐẶC đỏ (sắp đến = viền vàng, còn xa = chữ thường) — khác hình, không chỉ khác màu; thay ⚠ / chấm tròn.

## [XM] cho PTA

- [XM-P3-5] Mockup v23 không có ô "Việc của tôi ›" (XM 3, 11/11; CLAUDE.md "việc của tôi ở trang đầu vai") → giữ dạng link gọn đầu trang. Bỏ hẳn? PTA chốt.
- [XM-P3-6] Đã xử lý bằng `gon=1&kemViec=1` (bảng trên): dòng / ngày giảm; còn QT +44 câu / lần — chủ SP quyết nếu cần thấp hơn (vd khối Giáo viên toàn hệ thống chỉ khi chọn chi nhánh).
- [XM-P3-7] Hướng dẫn (`shared/huongDan` ql / qt / admin / cx, mục Tổng quan) còn tả dải ô cũ — PR này chỉ đổi `data-hd` cho đúng phần tử; cần PR hướng dẫn viết lại chữ (kèm bản EN).
