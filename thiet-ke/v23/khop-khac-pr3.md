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
| Lớp cần chú ý — ma trận C ~60 % + Tình hình cạnh | `LopCanChuYC` · `OMaTran` · `TinhHinh` | head · admin · qt | KHỚP; màu ở số: quá hạn = badge nền đỏ + ⚠, sắp đến = chữ vàng viền mảnh (đặc tả 6.3 — bỏ chấm tròn + chú giải) |
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

## Turso (đo `scripts/do-ban-chep.mjs`-kiểu, bản chép 12/11 đã migrate · seed) — trước → sau

| Đường | Bản chép thật | Seed |
|---|---|---|
| `/tong-quan/v5?ct=ft` một chi nhánh (QL) | 37 → **31** câu · 7 321 → 7 308 dòng | 36 → 34 · 2 234 → 2 218 |
| Cả lượt trang **Head / QL** | 108 → **144** câu · 25 364 → 27 208 dòng | 153 → 201 |
| Cả lượt trang **Quản trị** Toàn hệ thống | 88 → **147** câu · 24 745 → 35 138 dòng | 136 → 204 |
| Cả lượt trang **CX** | 54 → 61 câu · 12 453 → 13 167 dòng | 67 → 74 |
| Cả lượt trang **Admin** | 48 → 58 câu · 4 076 → 10 069 dòng | 81 → 98 |

- Thêm: `/my-work?branchId&nguoi=tat-ca` (Head 60 câu / 3 794 dòng · QT 59 / 10 393 · Admin 15 / 2 291) — CHÍNH URL Công việc "Tất cả": mở Công việc trong 5 phút sau dùng lại, 0 GET.
- Bỏ: `/phan-tich/giao-vien?v2=1` (Head) · `/tong-quan/mock-test` + `/highlights` (Admin) · Trễ chấm + caseGv trong `/tong-quan/v5`.
- Ước / ngày (Head ~100 · QT ~20 · Admin ~50 · CX ~50 lần mở): ≈ +180 k + 210 k + 300 k + 35 k ≈ **+0,7 triệu dòng / ngày (~5 % trần 15 triệu)**, trước khi trừ phần Công việc dùng lại.
- Trần `tocDoDuong.ts`: `QL /tong-quan/v5?ct=ft` giữ 46 (đo 34); thêm ADMIN `/tong-quan/v5` 45 câu · ADMIN `/my-work?nguoi=tat-ca&branchId` 26 · CX `sos23` 18; trang QL 107 → 145, QT (mới) 150, CX 80 → 95, Admin 60 → 73.

## [XM] cho PTA

- [XM-P3-5] Mockup v23 không có ô "Việc của tôi ›" (XM 3, 11/11; CLAUDE.md "việc của tôi ở trang đầu vai") → giữ dạng link gọn đầu trang. Bỏ hẳn? PTA chốt.
- [XM-P3-6] Số đọc tăng theo cả lượt trang (bảng trên) — ước trước (đo từng đường riêng) nói Head giảm; đo cả lượt thì `/phan-tich/giao-vien` rẻ hơn khi đi sau `/tong-quan/v5` (bộ nhớ trong tiến trình). PTA báo chủ SP con số đúng.
- [XM-P3-7] Hướng dẫn (`shared/huongDan` ql / qt / admin / cx, mục Tổng quan) còn tả dải ô cũ — PR này chỉ đổi `data-hd` cho đúng phần tử; cần PR hướng dẫn viết lại chữ (kèm bản EN).
