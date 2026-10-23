# UI-TONG-QUAN — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (khung `thiet-ke/v5/tong-quan.html` phương án B, `tong-quan-truy-vet.md`)

Ảnh cặp mockup | web (seed nguyên, ngày demo 14/09/2026, `scripts/anh-cap.mjs`), mỗi vai `cap-<vai>-1440-toi.png` + `cap-<vai>-375.png`; QL thêm `cap-ql-1440-sang.png` + `cap-ql-1280.png`.
Vai demo: QL = Nguyễn Khánh Vy (2) · QT = Đỗ Vũ Tuấn Phong (1) · GV = Lê Minh Khoa (8) · TVV = Nguyễn Thu Hương (23) · Admin = Đào Minh Ngọc (22) · CX = Vũ Thanh Tâm (24) · Head tutor = Hoàng Thị Hà (25).
Số trên web là dữ liệu seed (khác số demo của mockup) — so khung, thứ tự, tên, kiểu ô; số kiểm bằng phép kiểm `prUiTongQuan` (số Tổng quan = Báo cáo Phân tích).

## Truy vết khung → thành phần

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Đầu trang một hàng: "Tổng quan" · phạm vi · mã tuần `W3 SEP`; bộ chọn bên phải | `DauTrangTq` (`TongQuanV5.tsx`) | KHỚP |
| 2 | Dải 4 chỉ số: tên (+ ⓘ) · % to · n/N đơn vị · kỳ / "hiện tại" | `ChiSo` → `OChiSo` + `NutLuat`; % = `OSo` (bấm → panel chỉ đọc) | KHỚP |
| 3 | Mẫu 0 → "– Chưa có dữ liệu", không "0 %" (T19) | `PhanTram` (`rateView`); ô bảng: "—" + `title` | KHỚP |
| 4 | Bố cục B: trái tình hình · phải 360 "Chờ duyệt / Đi tiếp"; < 1100 một cột, cột phải lên trước | `BoCuc` | KHỚP |
| 5 | QL: Đạt MT · Case có PA · Chờ duyệt · Thi tháng này | `TongQuanQlV5` (`/tong-quan/v5`, `/yeu-cau?hop=cho-duyet`) | KHỚP |
| 6 | QL: Lớp cần chú ý (Lớp + HV · Đạt MT · SOS hiện tại chip 1/2/3 · Case chưa PA · Thi tháng này), theo lượt từng HV (P8) | `LopCanChuY` (`Bang`, chip `CHIP_SOS`); máy chủ chia CHÍNH `tapDatMt` theo lớp của lượt mỗi em | KHỚP |
| 7 | Công tắc Fast Track / Lớp thường trên thẻ Lớp cần chú ý | công tắc khung ở đầu trang (áp MỌI số — V4 SL2) | KHÁC — [XM-1] |
| 8 | QL: GV cần chú ý — Hành chính (Việc đúng hạn · Điểm đúng hạn · Quá hạn nay → web "Quá hạn") / Học thuật (Đạt MT · Tiến bộ · Case có PA) | `GvCanChuY` (bảng Phân tích GV 4 tuần + Trễ chấm V4) | KHÁC một cột — [XM-2] |
| 9 | Chờ bạn duyệt: dòng gọn (loại · đối tượng · người gửi · thời gian chờ) → panel duyệt; "Hộp duyệt ›" | `ChoDuyetGon` → `KhungPanel` "DUYỆT" + `TheYeuCau` (V4) | KHỚP |
| 10 | Đi tiếp: "n HV thi tháng này" · "Case chưa có PA" · "HV chưa có lịch thi" · "Báo cáo tuần trước" | `DiTiep`: HV thi tháng này (lọc `thi=1`) · Việc của tôi · Báo cáo | KHÁC — [XM-3] |
| 11 | QT: bảng Theo chi nhánh (Đạt MT · Case có PA · Đạt Target thi thật · Thi tháng này), hàng "Toàn hệ thống" Σ tử / Σ mẫu (T20); bấm hàng → mức QL | `TheoChiNhanh` (`onHang` → `?cn=`) | KHỚP |
| 12 | QT chỉ số "Chi nhánh cần xem" | thay bằng "Đạt Target thi thật" (Σ tử / Σ mẫu) | KHÁC — [XM-4] |
| 13 | GV: Việc đúng hạn · Bài chờ chấm · Case đang xử lý · Đạt MT kỹ năng tôi dạy | Việc của tôi (+ quá hạn) · Việc đúng hạn · Đạt MT kỹ năng tôi dạy · Tiến bộ (`/giao-vien/:id/chi-so`) | KHÁC — [XM-5] |
| 14 | GV: hai khối "Kỹ năng tôi dạy" · "Lớp tôi chủ nhiệm" | GIỮ "Lớp tôi dạy" V4 (`LopToiDay`, cột "Tôi dạy" ghi kỹ năng / GVCN) | KHÁC — [XM-5] |
| 15 | TVV: chỉ 3 nhóm Xử lý đúng hạn · Thi tháng này · Chờ KQ / Lộ trình tiếp (V5-D) | `TongQuanTvvV5`: Báo PH đúng hạn (K6) · Thi tháng này · Chờ KQ · Lộ trình tiếp | KHỚP |
| 16 | TVV "Báo PH đúng hạn" = xong ≤ hạn / việc phát sinh trong kỳ; panel nêu "xong trễ n" (K6) | `/tong-quan/tvv` + `/tong-quan/tvv/o?o=bao-ph` | KHỚP |
| 17 | TVV khối "Cần chú ý" dẫn sang danh sách đúng lọc | `DiTiep` "Cần chú ý" (Thi tháng này · Chờ KQ · Chưa chốt lộ trình tiếp → HV & Lớp của tôi) | KHỚP |
| 18 | Admin: Lịch Test đủ % · Bài chưa nhập · Đề nghị dời + Lịch Test 4 tuần | GIỮ 4 ô Mock Test V4 + GV chấm quá hạn + Lịch sắp tới; Đi tiếp Lịch tuần · Kế hoạch Test | KHÁC — [XM-6] |
| 19 | CX: HV chưa đạt MT · Case chưa có PA · Chờ KQ / bước tiếp; dải "chỉ xem"; Theo chi nhánh (SOS 2–3 · Case chưa PA) | `TongQuanCxV5` | KHỚP |
| 20 | Head tutor | chỉ dòng "Tutor tạm ẩn." (nợ #537, P10) | KHỚP (theo nợ 146) |
| 21 | Không ô nhập trên trang khi chưa bấm (C04) | không còn form nhúng | KHỚP |
| 22 | Không xếp hạng GV, không ngưỡng màu (C08) | bảng GV xếp theo tên (máy chủ) | KHỚP |
| 23 | 375: một cột, chỉ số 2 × 2, bảng → thẻ, panel toàn màn | `grid-cols-2`, `Bang` thẻ < 640, `KhungPanel` | KHỚP |
| — | BỎ: dòng chú thích mockup ("Quy tắc Overall…", "Toàn hệ thống = …", "Số chủ nhiệm tách riêng…") — P1 | không lên web; "Lớp tôi dạy" bỏ "Bấm số để xem danh sách em" | BỎ |
| — | BỎ: `KhoiCanQuyet` (Cần bạn quyết), dải tóm tắt, "Tuần này", form nhúng (nợ 145, truy vết mục 3) | việc ở Công việc; Trễ chấm thành cột "Quá hạn" của GV cần chú ý | BỎ |
| — | BỎ: Tổng quan CX cũ (6 ô số, Điểm đáng chú ý, Lịch sắp tới, Theo chi nhánh V4) · TVV "Học viên của tôi" 6 ô đếm | khung V5 | BỎ |

**Đếm:** 16 KHỚP · 7 KHÁC (đều có [XM]) → 16 / 23 = **70 % — chưa đạt cổng 90 %**. Nếu chủ SP chấp nhận XM-1, XM-5, XM-6 (giữ thao tác V4) → 20 / 23 = 87 %; chấp nhận cả 6 → 100 %. Các KHÁC còn lại cần số / bộ lọc máy chủ chưa có — chủ SP chọn làm tiếp ở PR này hay để sau.

## [XM] — cần chủ SP chọn (không tự quyết)

- **XM-1** Công tắc FT / Thường: mockup đặt trên thẻ Lớp cần chú ý + ô "Mọi chương trình" đầu trang; V4 (SL2) một công tắc áp mọi số trên trang. Web giữ một công tắc đầu trang (Đạt MT / SOS chỉ có ở FT nên "Mọi chương trình" sẽ trộn hai luật). Đề xuất: giữ.
- **XM-2** Học thuật cột 3: mockup "Case có PA" theo GV — máy chủ chưa có tập này theo GV; web dùng "PA hiệu quả" (có sẵn, cùng Phân tích GV). Cần thì thêm tập ở máy chủ.
- **XM-3** Đi tiếp "Case chưa có PA" · "HV chưa có lịch thi": HV & Lớp chưa có bộ lọc đích (góc Cần làm đã bỏ ở UI-HV-LOP). Số Case chưa PA vẫn bấm được ở chỉ số Case có PA (panel).
- **XM-4** QT "Chi nhánh cần xem": cần một ngưỡng (vd Đạt MT < 50 %) — C08 cấm ngưỡng; web thay bằng "Đạt Target thi thật".
- **XM-5** GV: "Bài chờ chấm", "Case đang xử lý" + tách hai khối "Kỹ năng tôi dạy" / "Lớp tôi chủ nhiệm" — web giữ "Lớp tôi dạy" V4 (bài chờ chấm / quá hạn, SOS, Case theo lớp, bấm số mở danh sách) để không mất thao tác; tách hai khối cần API mới.
- **XM-6** Admin "Lịch Test đủ %" (lượt đủ 4 kỹ năng 4 tuần tới): chưa có chỉ số; web giữ 4 ô V4 (Lượt MT tuần này · Ô điểm chưa nhập · Đề nghị dời chờ · MT chưa xếp lịch) + GV chấm quá hạn.

## Thao tác TRƯỚC → SAU (luật 8b, `10` mục 8)

| Thao tác trước PR | Sau PR | Ghi chú |
|---|---|---|
| QL: duyệt thẻ Chờ duyệt tại chỗ (`HopChoDuyet gon` trong Cần bạn quyết) | **GIỮ** — bấm dòng → panel "DUYỆT" có cùng thẻ `TheYeuCau` (Duyệt / Từ chối / Thêm PA) | C04: không form khi chưa bấm |
| QL: "Mở Case" / "Chọn bước tiếp" / "Chốt lộ trình" trong Cần bạn quyết | Ở **Công việc** (cùng việc, cùng panel) — "Việc của tôi ›" ở Đi tiếp | nợ 145 + truy vết mục 3 |
| QL: bấm số ô Lớp cần chú ý (SOS 1/2/3, Case chưa chốt PA) → panel | **GIỮ** (cùng nguồn `/tong-quan/chi-nhanh/o?chuY=1`) | |
| QL: "Chỉ lớp có vấn đề" | **BỎ** — bảng chỉ 5 lớp cần chú ý nhất (SOS 3 → SOS 2 → Case chưa PA → SOS 1 → Thi tháng này) | chủ SP 23/10 |
| QL: Trễ chấm theo GV → bấm số bài → panel | **GIỮ** ở cột "Quá hạn" bảng GV cần chú ý (cùng `/tong-quan/ql/tre`) | |
| QL: Tuần này / Lịch sắp tới | Test › Lịch tuần | mockup không có khối này |
| QL: "Báo cáo ›" | **GIỮ** ở Đi tiếp | |
| QL / QT / CX: chọn chi nhánh, công tắc FT / Thường | **GIỮ** (đầu trang) | |
| QT: bấm hàng chi nhánh → mức QL | **MỚI** (hàng bấm được, `?cn=`) | |
| GV: Lớp tôi dạy (bấm số → danh sách em / bài) + "Công việc ›" | **GIỮ** Lớp tôi dạy; "n việc của tôi ›" ở Đi tiếp | |
| TVV: 6 ô đếm → HV & Lớp lọc sẵn | Chờ KQ · Lộ trình tiếp **GIỮ** (link cùng chip); Thi tháng này (P4); Cần chú ý / Tạm dừng / Thiếu thông tin → "HV của tôi ›" + Công việc | V5-D: TVV chỉ 3 nhóm |
| Admin: 4 ô Mock Test, GV chấm quá hạn, Lịch sắp tới | **GIỮ** | [XM-6] |
| CX: ô đếm học viên, Số liệu theo khung | 3 chỉ số + Theo chi nhánh; Chờ KQ / bước tiếp **GIỮ** link chip | |
| Dải "Mới dùng PISA?" | **GIỮ** mọi vai | |
| Head tutor: tiêu đề + dải Hướng dẫn | + dòng "Tutor tạm ẩn." | nợ 146 |

## Phép kiểm gỡ / đổi (Q-7)
- `prHk2` C10 (bỏ KhoiCanXuLy, BranchPulse khỏi danh sách bang-dinh), C19, C20, C21 (dòng đọc KhoiCanXuLy).
- `prS6fB` "dải Chờ duyệt báo lỗi" → kiểm KhoiCanXuLy đã gỡ. `prGv` (dòng BranchPulse). `prDonA` 9e (phần MetricTiles). `prBang0` (gỡ 3 tệp khỏi danh sách miễn).
- Thêm `prUiTongQuan` (số = Báo cáo, Σ tử / Σ mẫu, panel theo lớp, quyền). `TAI_TRANG` / `DUONG_DO` thêm GET V5.
