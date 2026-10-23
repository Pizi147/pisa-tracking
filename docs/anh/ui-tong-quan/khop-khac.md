# UI-TONG-QUAN — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (khung `thiet-ke/v5/tong-quan.html` phương án B, `tong-quan-truy-vet.md`)

Ảnh cặp mockup | web (seed nguyên, ngày demo 14/09/2026, `scripts/anh-cap.mjs`), mỗi vai `cap-<vai>-1440-toi.png` + `cap-<vai>-375.png`; QL thêm `cap-ql-1440-sang.png` + `cap-ql-1280.png`.
Vai demo: QL = Nguyễn Khánh Vy (2) · QT = Đỗ Vũ Tuấn Phong (1) · GV = Lê Minh Khoa (8) · TVV = Nguyễn Thu Hương (23) · Admin = Đào Minh Ngọc (22) · CX = Vũ Thanh Tâm (24) · Head tutor = Hoàng Thị Hà (25).
**Phản hồi chủ SP 23/10 (đã áp):** chip SOS tách số "n HV" · GV cần chú ý: môn chữ thường + thẻ viền "GVCN" · GV: Case đang xử lý thay Việc đúng hạn · Admin bỏ Đề nghị dời, "HV chưa có MT tiếp theo" · CX thiên điểm số · Head tutor = góc nhìn GV · "Đi tiếp" → "Điều hướng" · XM-1 duyệt · XM-2, XM-3, XM-6 làm theo lời chủ SP.
Số trên web là dữ liệu seed (khác số demo của mockup) — so khung, thứ tự, tên, kiểu ô; số kiểm bằng phép kiểm `prUiTongQuan` (số Tổng quan = Báo cáo Phân tích).

## Truy vết khung → thành phần

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Đầu trang một hàng: "Tổng quan" · phạm vi · mã tuần `W3 SEP`; bộ chọn bên phải | `DauTrangTq` (`TongQuanV5.tsx`) | KHỚP |
| 2 | Dải 4 chỉ số: tên (+ ⓘ) · % to · n/N đơn vị · kỳ / "hiện tại" | `ChiSo` → `OChiSo` + `NutLuat`; % = `OSo` (bấm → panel chỉ đọc) | KHỚP |
| 3 | Mẫu 0 → "– Chưa có dữ liệu", không "0 %" (T19) | `PhanTram` (`rateView`); ô bảng: "—" + `title` | KHỚP |
| 4 | Bố cục B: trái tình hình · phải 360 "Chờ duyệt / Điều hướng"; < 1100 một cột, cột phải lên trước | `BoCuc` | KHỚP |
| 5 | QL: Đạt MT · Case có PA · Chờ duyệt · Thi tháng này | `TongQuanQlV5` (`/tong-quan/v5`, `/yeu-cau?hop=cho-duyet`) | KHỚP |
| 6 | QL: Lớp cần chú ý (Lớp + HV · Đạt MT · SOS hiện tại chip 1/2/3 · Case chưa PA · Thi tháng này), theo lượt từng HV (P8) | `LopCanChuY` (`Bang`); chip chỉ ghi mức "SOS n", số "k HV" đứng ngoài chip, bấm → panel danh sách em (chủ SP 23/10) | KHỚP |
| 7 | Công tắc Fast Track / Lớp thường trên thẻ Lớp cần chú ý | công tắc khung ở đầu trang (áp MỌI số — V4 SL2) | KHỚP (XM-1 chủ SP duyệt 23/10) |
| 8 | QL: GV cần chú ý — Hành chính (Việc đúng hạn · Điểm đúng hạn · Quá hạn nay → web "Quá hạn") / Học thuật (Đạt MT · Tiến bộ · Case có PA) | `GvCanChuY`; Học thuật cột 3 **Case có PA** theo người phụ trách (`caseGv` máy chủ, bấm → Case đang mở của GV); dòng phụ tên: môn + thẻ "GVCN" | KHỚP (XM-2 làm 23/10) |
| 9 | Chờ bạn duyệt: dòng gọn (loại · đối tượng · người gửi · thời gian chờ) → panel duyệt; "Hộp duyệt ›" | `ChoDuyetGon` → `KhungPanel` "DUYỆT" + `TheYeuCau` (V4) | KHỚP |
| 10 | Đi tiếp (web: **Điều hướng**): "n HV thi tháng này" · "Case chưa có PA" · "HV chưa có lịch thi" · "Báo cáo tuần trước" | `DiTiep`: HV thi tháng này (lọc `thi=1`) · **n Case chưa có PA → Công việc nhóm Case học thuật** · **Lịch thi → HV & Lớp › Lịch thi** · Việc của tôi · Báo cáo | KHỚP (XM-3 theo chủ SP 23/10) |
| 11 | QT: bảng Theo chi nhánh (Đạt MT · Case có PA · Đạt Target thi thật · Thi tháng này), hàng "Toàn hệ thống" Σ tử / Σ mẫu (T20); bấm hàng → mức QL | `TheoChiNhanh` (`onHang` → `?cn=`) | KHỚP |
| 12 | QT chỉ số "Chi nhánh cần xem" | thay bằng "Đạt Target thi thật" (Σ tử / Σ mẫu) | KHỚP (XM-4 chủ SP chọn khuyến nghị 23/10) |
| 13 | GV: Việc đúng hạn · Bài chờ chấm · Case đang xử lý · Đạt MT kỹ năng tôi dạy | (chủ SP 23/10) Việc của tôi (+ quá hạn) · **Case đang xử lý** (bấm → danh sách) · Đạt MT kỹ năng tôi dạy · Tiến bộ | KHỚP (theo chủ SP 23/10; ý "17/20" chủ SP bỏ — việc xong không còn trong danh sách nên không có "tổng") |
| 14 | GV: hai khối "Kỹ năng tôi dạy" · "Lớp tôi chủ nhiệm" | GIỮ "Lớp tôi dạy" V4 (`LopToiDay`, cột "Tôi dạy" ghi kỹ năng / GVCN); tách hai khối đã vào `plan.md` mục 4 (SV-TQ-GV) | KHÁC — [XM-5] |
| 15 | TVV: chỉ 3 nhóm Xử lý đúng hạn · Thi tháng này · Chờ KQ / Lộ trình tiếp (V5-D) | `TongQuanTvvV5`: Báo PH đúng hạn (K6) · Thi tháng này · Chờ KQ · Lộ trình tiếp | KHỚP |
| 16 | TVV "Báo PH đúng hạn" = xong ≤ hạn / việc phát sinh trong kỳ; panel nêu "xong trễ n" (K6) | `/tong-quan/tvv` + `/tong-quan/tvv/o?o=bao-ph` | KHỚP |
| 17 | TVV khối "Cần chú ý" dẫn sang danh sách đúng lọc | `DiTiep` "Cần chú ý" (Thi tháng này · Chờ KQ · Chưa chốt lộ trình tiếp → HV & Lớp của tôi) | KHỚP |
| 18 | Admin: Lịch Test đủ % · Bài chưa nhập · Đề nghị dời + Lịch Test 4 tuần | (chủ SP 23/10) 3 ô: Lượt MT tuần này · Ô điểm chưa nhập · **HV chưa có MT tiếp theo**; bỏ Đề nghị dời chờ; + GV chấm quá hạn + Lịch sắp tới; Điều hướng Lịch tuần · Kế hoạch Test | KHỚP (XM-6 theo chủ SP) |
| 19 | CX: chủ SP 23/10 — thiên điểm + tình trạng HV | `TongQuanCxV5`: Đạt MT · Đạt Target thi thật · HV SOS 2–3 · Chờ KQ / bước tiếp; dải "chỉ xem"; Theo chi nhánh (Đạt MT · Đạt Target thi thật · SOS 2–3 · Case chưa PA) / một chi nhánh → Lớp cần chú ý; Điều hướng Báo cáo HV · HV SOS 2–3 · Lịch thi · HV & Lớp | KHỚP (theo chủ SP) |
| 20 | Head tutor | (chủ SP 23/10) tạm dùng góc nhìn GV tới khi có bộ thông tin Tutor | KHỚP (theo chủ SP) |
| 21 | Không ô nhập trên trang khi chưa bấm (C04) | không còn form nhúng | KHỚP |
| 22 | Không xếp hạng GV, không ngưỡng màu (C08) | bảng GV xếp theo tên (máy chủ) | KHỚP |
| 23 | 375: một cột, chỉ số 2 × 2, bảng → thẻ, panel toàn màn | `grid-cols-2`, `Bang` thẻ < 640, `KhungPanel` | KHỚP |
| — | BỎ: dòng chú thích mockup ("Quy tắc Overall…", "Toàn hệ thống = …", "Số chủ nhiệm tách riêng…") — P1 | không lên web; "Lớp tôi dạy" bỏ "Bấm số để xem danh sách em" | BỎ |
| — | BỎ: `KhoiCanQuyet` (Cần bạn quyết), dải tóm tắt, "Tuần này", form nhúng (nợ 145, truy vết mục 3) | việc ở Công việc; Trễ chấm thành cột "Quá hạn" của GV cần chú ý | BỎ |
| — | BỎ: Tổng quan CX cũ (6 ô số, Điểm đáng chú ý, Lịch sắp tới, Theo chi nhánh V4) · TVV "Học viên của tôi" 6 ô đếm | khung V5 | BỎ |

**Đếm (23/10 sau phản hồi chủ SP):** 22 KHỚP · 1 KHÁC (dòng 14 [XM-5], đã vào `plan.md` SV-TQ-GV — cần API mới) → 22 / 23 = **96 % — đạt cổng 90 %**.

## [XM] — trạng thái 23/10

- **XM-1** công tắc FT / Thường ở đầu trang — **chủ SP duyệt**.
- **XM-2** "Case có PA" theo GV — **đã làm**: máy chủ `caseGv` (Case đang mở GV phụ trách ở chi nhánh, trừ Case chưa chốt PA — cùng tập "Case chưa chốt PA" của bảng lớp); bấm % → Case đang mở của GV (`/giao-vien/:id/o?cot=case-mo`, cùng hàm hồ sơ GV). Cột cũng hiện ở Lớp thường (Case không riêng FT).
- **XM-3** — **đã làm**: "n Case chưa có PA" → Công việc nhóm **Case học thuật** (nơi có việc xác định nguyên nhân / nhận xét / xác nhận PA để chốt); "HV chưa có lịch thi" bỏ, thay **Lịch thi** → HV & Lớp › Lịch thi.
- **XM-4** QT "Chi nhánh cần xem" — **chủ SP chọn khuyến nghị (23/10): giữ "Đạt Target thi thật"**, không đặt ngưỡng (luật C08 giữ nguyên).
- **XM-5** tách "Kỹ năng tôi dạy" / "Lớp tôi chủ nhiệm" — **nên làm** (GV thấy rõ phần mình chịu trách nhiệm theo môn và theo lớp CN), nhưng cần API `lop-toi-day` trả hai phần → **đã đưa vào `plan.md` mục 4 (SV-TQ-GV)**; PR này giữ "Lớp tôi dạy" V4 để không mất số bấm được.
- **XM-6** Admin — **đã làm theo chủ SP** (bỏ Đề nghị dời chờ; "MT chưa xếp lịch" → "HV chưa có MT tiếp theo" = em FT đang học không còn lượt MT nào đã xếp tuần, cùng số Kế hoạch Test).
- ~~XM-7~~ ô "17/20": chủ SP bỏ (23/10) — việc làm xong rời danh sách nên không có "tổng"; ô giữ "n việc đang mở · ⚠ k quá hạn".

## Thao tác TRƯỚC → SAU (luật 8b, `10` mục 8)

| Thao tác trước PR | Sau PR | Ghi chú |
|---|---|---|
| QL: duyệt thẻ Chờ duyệt tại chỗ (`HopChoDuyet gon` trong Cần bạn quyết) | **GIỮ** — bấm dòng → panel "DUYỆT" có cùng thẻ `TheYeuCau` (Duyệt / Từ chối / Thêm PA) | C04: không form khi chưa bấm |
| QL: "Mở Case" / "Chọn bước tiếp" / "Chốt lộ trình" trong Cần bạn quyết | Ở **Công việc** (cùng việc, cùng panel) — "Việc của tôi ›" ở Điều hướng | nợ 145 + truy vết mục 3 |
| QL: bấm số ô Lớp cần chú ý (SOS 1/2/3, Case chưa chốt PA) → panel | **GIỮ** (cùng nguồn `/tong-quan/chi-nhanh/o?chuY=1`) | |
| QL: "Chỉ lớp có vấn đề" | **BỎ** — bảng chỉ 5 lớp cần chú ý nhất (SOS 3 → SOS 2 → Case chưa PA → SOS 1 → Thi tháng này) | chủ SP 23/10 |
| QL: Trễ chấm theo GV → bấm số bài → panel | **GIỮ** ở cột "Quá hạn" bảng GV cần chú ý (cùng `/tong-quan/ql/tre`) | |
| QL: Tuần này / Lịch sắp tới | Test › Lịch tuần | mockup không có khối này |
| QL: "Báo cáo ›" | **GIỮ** ở Điều hướng | |
| — | **MỚI** ở Điều hướng: "n Case chưa có PA ›" (Công việc · Case học thuật), "Lịch thi ›" (HV & Lớp › Lịch thi) | XM-3 |
| QL: bấm số SOS trong chip → panel | **GIỮ** — số đứng ngoài chip ("SOS 3 · 5 HV"), cùng panel | chủ SP 23/10 |
| QL / QT / CX: chọn chi nhánh, công tắc FT / Thường | **GIỮ** (đầu trang) | |
| QT: bấm hàng chi nhánh → mức QL | **MỚI** (hàng bấm được, `?cn=`) | |
| GV: Lớp tôi dạy (bấm số → danh sách em / bài) + "Công việc ›" | **GIỮ** Lớp tôi dạy; "n việc của tôi ›" ở Điều hướng | |
| GV: ô "Việc đúng hạn" (bấm % → panel) | **BỎ** khỏi Tổng quan (chủ SP 23/10) — vẫn ở Hồ sơ GV của tôi (Điều hướng) | thay bằng ô **Case đang xử lý** (bấm → danh sách Case) |
| TVV: 6 ô đếm → HV & Lớp lọc sẵn | Chờ KQ · Lộ trình tiếp **GIỮ** (link cùng chip); Thi tháng này (P4); Cần chú ý / Tạm dừng / Thiếu thông tin → "HV của tôi ›" + Công việc | V5-D: TVV chỉ 3 nhóm |
| Admin: 4 ô Mock Test, GV chấm quá hạn, Lịch sắp tới | **GIỮ** 3 ô + GV chấm quá hạn + Lịch sắp tới; ô "Đề nghị dời chờ" **BỎ** (chủ SP 23/10 — đề nghị vẫn duyệt ở Test › Lịch); "MT chưa xếp lịch" đổi tên "HV chưa có MT tiếp theo" (cùng số, cùng đích) | XM-6 |
| CX: ô đếm học viên, Số liệu theo khung | 4 chỉ số điểm / tình trạng + Theo chi nhánh; Chờ KQ / bước tiếp **GIỮ** link chip; Case chưa PA chuyển vào bảng (bấm → panel) | chủ SP 23/10 |
| Dải "Mới dùng PISA?" | **GIỮ** mọi vai | |
| Head tutor: tiêu đề + dải Hướng dẫn | Tổng quan GV (Việc của tôi · Case đang xử lý · Lớp tôi dạy · Hồ sơ GV) — dữ liệu theo quyền máy chủ | chủ SP 23/10 |

## Phép kiểm gỡ / đổi (Q-7)
- `prHk2` C10 (bỏ KhoiCanXuLy, BranchPulse khỏi danh sách bang-dinh), C19, C20, C21 (dòng đọc KhoiCanXuLy).
- `prS6fB` "dải Chờ duyệt báo lỗi" → kiểm KhoiCanXuLy đã gỡ. `prGv` (dòng BranchPulse). `prDonA` 9e (phần MetricTiles). `prBang0` (gỡ 3 tệp khỏi danh sách miễn).
- Thêm `prUiTongQuan` (số = Báo cáo, Σ tử / Σ mẫu, panel theo lớp, quyền). `TAI_TRANG` / `DUONG_DO` thêm GET V5.

## Bước 8b — impeccable `audit` + `web-design-guidelines` (23/10, mọi vai: QL, QT, CX, GV, TVV, Admin, Head tutor)

Máy dò `impeccable detect` (web/src/modules/worklist/): 0 phát hiện. Rà tay theo Web Interface Guidelines + ảnh 1440 / 375 có dữ liệu thật.

| # | Mức | Vấn đề | Chỗ | Xử lý |
|---|---|---|---|---|
| A1 | P1 | Thẻ 375 của `Bang`: ô 76 px, nhãn dài ("Việc đúng hạn", "Đạt Target thi thật") + số tràn chồng sang ô bên ("0 %Điểm đúng hạn") — có từ trước | `web/src/ui/Bang.tsx` (dùng chung) | **Sửa**: nhãn > 8 ký tự → ô 120 px; ô được xuống dòng thay vì `nowrap` |
| A2 | P1 | Số SOS nằm trong chip màu (link xanh trên nền đỏ SOS 3 — tương phản kém, không biết số đếm gì) | Lớp cần chú ý | **Sửa** (chủ SP 23/10): chip chỉ "SOS n", số "k HV" ngoài chip |
| A3 | P2 | Head tutor: ô "Việc của tôi" treo "…" mãi (vai không có Công việc) | `TongQuanGvV5` | **Sửa**: không `workSupport` → không ô Việc |
| A4 | P2 | Ô số "HV SOS 2–3" (CX) là link đổi trang — trái luật "ô số = mở tại chỗ, › = đổi trang" | `TongQuanCxV5` | **Sửa**: số thường; đường sang danh sách ở Điều hướng ("n HV SOS 2–3 ›") |
| A5 | P3 | TVV "Thi tháng này", TVV / CX "Chờ KQ · bước tiếp": số là link sang HV & Lớp lọc sẵn (cùng kiểu A4) | `TongQuanTvvV5`, `TongQuanCxV5` | **Giữ** — thao tác V4 "ô đếm → danh sách lọc" (luật V5: không bỏ thao tác cũ); chủ SP quyết nếu muốn đổi sang panel |
| A6 | P3 | "Lớp tôi dạy" dùng bảng tự viết, không qua `Bang` | `LopToiDay.tsx` | Để SV-TQ-GV (tách hai khối) làm cùng |

Đạt: mọi số mở panel chỉ đọc có `aria-label`; "›" `aria-hidden`; vùng bấm ≥ 44 px ở 375; công tắc `aria-pressed`; trạng thái quá hạn có ⚠ + chữ (không chỉ màu); mẫu 0 → "Chưa có dữ liệu"; tối / sáng dùng token.
