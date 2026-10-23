# UI-PHAN-TICH — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (khung `thiet-ke/v5/phan-tich.html`, `phan-tich-truy-vet.md`; `10` mục 1, 5, 8)

Ảnh cặp mockup | web (seed nguyên, ngày demo 14/09/2026, `scripts/anh-cap.mjs`): Báo cáo HV `cap-bc-<vai>-*.png`, Phân tích GV `cap-gv-<vai>-*.png`.
Vai demo: QL = Nguyễn Khánh Vy (2, Monbay) · QT = Đỗ Vũ Tuấn Phong (1, nhiều chi nhánh) · CX = Vũ Thanh Tâm (24).
Bề rộng: 1440 tối (QL, QT, CX) + 1440 sáng (QL) · 1280 (QL — bảng GV Gọn **và** Đầy đủ vừa khung, không cuộn) · 375 sáng (QL, QT, CX).
Số trên web là dữ liệu seed (khác số demo mockup) — so khung, thứ tự, tên, kiểu ô; số kiểm bằng phép kiểm `prUiPhanTich`.

## Vòng 2 — phản hồi chủ SP 23/10 (đã áp, sắp lại cả trang)

| # | Chủ SP | Đã làm |
|---|---|---|
| 1 | Khung thời gian phải đồng bộ, theo luật đã chốt | `BoChonThoiGian` (MỘT component cho Phân tích, Tutor, HV & Lớp › Lọc thêm) hiện thẳng **Tuần bắt đầu [ô] → Tuần kết thúc [ô]** (ô gõ + lịch), đổi là áp dụng; Phân tích thêm **Toàn bộ · Chọn khoảng tuần** (DESIGN.md G10). Bỏ hộp bấm mở, bỏ ‹ ›, bỏ chữ "Khoảng thời gian · 31/08 – 13/09/2026 · 2 tuần". Chọn tuần đầu sau tuần cuối → tự kéo đầu kia |
| 2 | "Thi tháng này" vô nghĩa khi chọn kỳ | **"Thi đợt này"** = HV có ngày thi trong kỳ đang chọn (cùng hàm `tapThiThangNayLop`, tham số khoảng); ô số + bảng chi nhánh + panel `o=thi-dot-nay`. Tổng quan giữ "Thi tháng này" |
| 3 | "Ngoài mẫu" vô dụng | bỏ cột Ngoài mẫu + chữ "n ngoài mẫu" ở Đạt MT; Tiến bộ theo kỹ năng thành **Tăng · Giữ nguyên · Giảm** (số bấm được, % dưới) |
| 4 | Dòng chữ nhỏ thừa, chỗ trống dưới bảng trái, "quá hạn" lặp | bỏ dòng "chấm đúng hạn…" (việc GV ở tab Phân tích GV); bỏ khối "Hỗ trợ · Case / PA" (Case có PA trùng ô số) → **dải 5 số**: Đạt MT · Đạt Target thi thật · Thi đợt này · Case có PA · PA cải thiện; hai bảng Kết quả MT · Tiến bộ đứng cạnh nhau **cùng chiều cao** |
| 5 | Cột bị cắt chữ | Tiến bộ đủ 4 cột ở 1440 / 1280 / 375; tiêu đề bảng GV xuống dòng |
| 6 | Bảng chi nhánh dồn phải, thừa ô trống | `Bang deu`: cột tên giữ rộng của nó, phần dư chia đều mọi cột; Báo cáo HV thêm cột **Thi đợt này · SOS 2–3** (Tổng quan cũng hết dồn phải) |
| 7.1 | Dòng "GVCN + danh sách lớp" xấu | **bỏ hẳn** (Phân tích GV và Tổng quan › GV cần chú ý); dòng phụ chỉ môn dạy |
| 7.2 | Quá hạn không nên là một cột | bỏ cột; "⚠ n quá hạn" (bấm → bài trễ) nằm dưới ô Chấm Test đúng hạn, chỉ hiện khi > 0 |
| 7.3 | "Điểm đúng hạn" → "Chấm Test đúng hạn" | đổi ở Phân tích GV, panel, Tổng quan |
| 7.4 | Tách Hành chính / Học thuật rõ hơn | đầu nhóm có nền màu (xanh / hồng) + vạch trên; vạch dọc đậm chạy suốt bảng giữa hai nhóm |
| — | (tự quyết) | Đầy đủ bỏ "Ghi KQ PA" — trùng hẳn "Việc đúng hạn" (cùng một tập việc); "In" lên cuối hàng lọc (ẩn ở 375) |

## Vòng 3 — chủ SP 24/10 (đã áp)

| # | Chủ SP | Đã làm |
|---|---|---|
| 1 | Bỏ chữ "Tuần bắt đầu / Tuần kết thúc" | bộ lọc chỉ **[ô tuần] → [ô tuần]** (tên đọc màn giữ ở aria) |
| 2 | Số Chấm Test đúng hạn và quá hạn lệch nhau; bỏ hẳn quá hạn | Lệch vì hai tập khác nhau: "Chấm Test đúng hạn" = bài Test **tới hạn trong kỳ đang chọn**; "quá hạn" = mọi bài **đang** trễ tới hôm nay (cả kỳ trước). Đã **bỏ hẳn** dòng quá hạn khỏi bảng GV (máy chủ bỏ trường `quaHan`) — hàng không dày thêm |
| 3 | XM-5: tách thi thật khỏi kết quả Test như hồ sơ GV (#557) | gộp `origin/main`; cột **Đạt kỳ vọng Test** (lớp thường **Đạt Test**) = chỉ lượt Test, đơn vị "lượt Test"; cột **Pass Target** (gợi ý "Kết quả thi thật") = theo **lần thi**, CHÍNH `thiThatCuaGv` / `oThi` của hồ sơ GV, bấm → panel thi thật của hồ sơ GV; "bài Test" (HSGV-5); Tổng quan › GV cần chú ý đổi cùng chữ |

## Không hàm đếm thứ hai (số = Tổng quan #551)

| Số | Nguồn (một hàm) | Tổng quan dùng |
|---|---|---|
| Đạt MT · Case có PA · Đạt Target thi thật · Thi tháng này · Theo chi nhánh | `tongQuanV5()` — **chính hàm Tổng quan**, thêm tham số kỳ (`/tong-quan/v5?kieu&tu&den`) | cùng hàm, kỳ mặc định |
| Kết quả MT | `tapKqMt` (SV-SO3) · `/phan-tich/bao-cao/ket-qua-mt` | hàng Thi thật = "Đạt Target thi thật" |
| Tiến bộ theo kỹ năng | `tapTienBo` của Phân tích GV gom theo kỹ năng (`tienBoTheoKyNang`) | — |
| PA có kết quả / PA cải thiện | chỉ số `pa-co-ket-qua` (thêm tử = nhóm success, cùng luật Hiệu quả PA) | — |
| GV: Đạt MT / Đạt Target thi thật | tập Kết quả (`tapKetQua`) tách theo loại mục MT / thi thật | GV cần chú ý › Đạt MT đọc `datMt` (trước: gộp cả thi thật) |
| GV: Quá hạn | `treCham` (Trễ chấm) | cùng hàm |
| GV: Case có PA | `caseCoPaTheoGv` (tách từ `tongQuanV5`) | cùng hàm |
| GV: HV cần chú ý | `hv-sos-hien-tai` ∩ HV lớp GV đang dạy | — |

## Truy vết khung → thành phần

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Tab "Báo cáo HV" · "Phân tích GV" đứng đầu, các tab cũ sau (C22 — tách HV / GV) | `GOC_NHIN` đổi thứ tự + nhãn "Báo cáo HV" | KHỚP |
| 2 | Hàng lọc chung: Fast Track / Lớp thường · ‹ kỳ › · Lớp | `ChonChuongTrinh` + `BoChonThoiGian` (‹ › dời 1 tuần) · ô Lớp giữ ở tab có lớp | KHỚP |
| 3 | P9: "Toàn bộ" / "Chọn khoảng tuần" tự do, không trần | hộp kỳ: hai lựa chọn; `kieu=toan-bo`; bỏ trần 52 tuần (`loiKhoang`, `loiKhoangTuan`) | KHỚP |
| 4 | Báo cáo HV · 4 chỉ số Đạt MT · Case có PA · Đạt Target thi thật · Thi tháng này (+ mẫu số, kỳ / hiện tại) | `ChiSo` Tổng quan; số = `tongQuanV5` theo kỳ; mẫu 0 → "– Chưa có dữ liệu" | KHỚP |
| 5 | Báo cáo HV · bảng "Đường tới Target" → **"Kết quả MT"** (`10` mục 5): hàng MT0 · MT1 · MT2 · **MT3+** · Thi thật; cột Đạt Target · Thiếu 0.5 · Thiếu 1.0 · Thiếu ≥ 1.5 · Chưa đủ · So lượt trước | `KetQuaMt` (`Bang`); số bấm → panel em của ô (`o=kq-mt:<lượt>:<cột>`); % dưới số; ↑ / = / ↓ có chữ số (không chỉ màu) | KHỚP |
| 6 | Hàng không có lượt: chữ "Không có lượt MTn trong kỳ" trải ngang | ô "—" + "0 HV" ở cột Lượt (Bang không gộp ô); 375 ẩn hàng 0 HV | KHÁC (nhỏ) |
| 7 | Tiến bộ theo kỹ năng: L · R · W1 · W2 · S, Tăng % (n/N), Ngoài mẫu | `TienBo` (bảng 3 cột, cả 375); số bấm → panel bài `o=tien-bo:<kỹ năng>` | KHỚP |
| 8 | Hỗ trợ · Case / PA: Case có PA · PA có kết quả · PA cải thiện | `OHoTro` ×3, số bấm → panel | KHỚP |
| 9 | Dòng phụ "chấm đúng hạn trong kỳ 127/132 bài — chi tiết ở Phân tích GV" | cùng dòng + "⚠ n quá hạn" (bấm → panel bài quá hạn) | KHỚP |
| 10 | QT tất cả chi nhánh: Theo chi nhánh (Đạt MT · Case có PA · Đạt Target thi thật · Thi tháng này) + Toàn hệ thống Σ tử / Σ mẫu | `TheoChiNhanh` Tổng quan (bấm hàng → chi nhánh) | KHỚP |
| 11 | Phân tích GV · MỘT bảng, nhóm HÀNH CHÍNH (vạch xanh) / HỌC THUẬT (vạch hồng) | `Bang` + `nhom`; CSS `.bang-gv` vạch nhóm | KHỚP |
| 12 | Bộ cột Gọn (mặc định): Việc đúng hạn · Điểm đúng hạn · **Quá hạn** · Đạt MT · Tiến bộ · HV cần chú ý — vừa 1280 | `COT_GON`; ảnh `cap-gv-ql-1280.png` không cuộn, không cắt chữ | KHỚP |
| 13 | Bộ cột Đầy đủ: + Ghi KQ PA · Case có PA · PA cải thiện · **Đạt Target thi thật** (giữ); **bỏ Xử lý vi phạm** | `COT_DAY` (`?cot=day`); tiêu đề xuống dòng, vừa 1280 | KHỚP |
| 14 | Tìm GV… · "7 GV Monbay · xếp theo tên" | ô tìm (bỏ dấu); dòng đếm + kỳ | KHỚP |
| 15 | Không "mẫu nhỏ" (P1, `10`) — ô `n/m` + % | ô % + "n/m đơn vị"; `effectiveness.ts` gỡ chữ (nợ #522) | KHỚP |
| 16 | Panel số CHỈ ĐỌC (C22) | mọi số mở `NganDanhSach` (danh sách, không nút làm việc) | KHỚP |
| 17 | Kết quả thi chỉ đọc (C16) | Thi thật: Bước tiếp chỉ hiện chữ; chưa chọn → "Hồ sơ HV ›" | KHỚP |
| 18 | 375: chỉ số 2 × 2, bảng → thẻ, bộ lọc gọn | `DaiChiSo` 2 cột; Kết quả MT / GV → thẻ `Bang`; nhãn "Khoảng thời gian" ẩn (sr-only) | KHỚP |
| 19 | Tối / sáng | token | KHỚP |
| 20 | Đầu trang: In · Xuất bên phải | "In" giữ trong Báo cáo HV (V4); **Xuất** không thêm — xem [XM-2] | KHÁC |
| — | BỎ: dòng chú thích mockup ("Báo cáo: mặc định 2 tuần…", "không xếp hạng, không điểm KPI…", chú thích dưới bảng GV) — P1 | không lên web; luật ở "?" (Kết quả MT, Đạt MT) | BỎ |
| — | BỎ (Báo cáo V4 OV-15e): khối Test (HV đã làm bài · Quá hạn theo GV), SOS trong kỳ theo lớp, Kết quả Mock Test, HV cần chú ý (tại lúc xem) | số vẫn ở tab Test + SOS (SOS theo lớp), Kết quả Test (Mock), Phân tích GV (quá hạn theo GV) — xem [XM-1] | BỎ |

**Đếm:** 18 KHỚP · 2 KHÁC (6 nhỏ, 20 [XM-2]) → 18 / 20 = **90 %** — đạt cổng 90 % nếu PTA Plan / chủ SP đồng ý lý do KHÁC.

## [XM] — hỏi PTA Plan

- **XM-1** Báo cáo V4 (OV-15e) có 5 khối (Test, SOS trong kỳ theo lớp, Kết quả Mock, HV cần chú ý, Case / PA). Mockup V5 đã duyệt thay bằng 4 chỉ số + Kết quả MT + Tiến bộ + Hỗ trợ. PR làm theo mockup; số cũ không mất (tab Test + SOS, Kết quả Test, Phân tích GV, Tổng quan). Nếu muốn giữ khối nào ở Báo cáo HV → báo, thêm lại theo mẫu `Bang`.
- **XM-2** Nút "Xuất" đầu trang mockup không định nghĩa xuất gì. Xuất Excel kết quả Test (V4) vẫn ở tab Test + SOS. PR không thêm nút không có việc (P11).
- **XM-3** Tab "Kết quả thi" (mockup) — web giữ "Kết quả Test" (CHU-THI #522: Thi = thi thật; tab có cả Mock). Đổi nếu chủ SP muốn.
- **XM-4** "HV cần chú ý" ở bảng GV mockup chưa có định nghĩa trong từ điển `05`. PR **tự quyết**: HV đang SOS (chỉ số "SOS hiện tại", cùng Tổng quan) ở lớp GV đang dạy; số hiện tại.
- **XM-5** "Đạt MT" của GV ở Tổng quan › GV cần chú ý trước gộp cả kết quả thi thật; nay chỉ lượt MT (thi thật thành cột riêng "Đạt Target thi thật") — số Tổng quan có thể giảm nhẹ khi kỳ có KQ thi thật.

## Thao tác TRƯỚC → SAU (`10` mục 8)

| Thao tác trước PR | Sau PR | Ghi chú |
|---|---|---|
| Báo cáo: bấm mọi số → panel | **GIỮ** (mọi số Báo cáo HV mở panel chỉ đọc) | |
| Báo cáo: In (A4 ngang, giấy sáng) | **GIỮ** | |
| Báo cáo: Kết quả Mock Test bấm → bảng Mock lọc sẵn | Ở tab **Kết quả Test** (cùng bảng) | XM-1 |
| Báo cáo: Quá hạn theo GV (bảng + bấm số bài) | Phân tích GV cột **Quá hạn** (bấm → bài trễ của GV) + dòng phụ "⚠ n quá hạn" ở Báo cáo HV | XM-1 |
| Báo cáo: SOS trong kỳ theo lớp + so kỳ trước | Tab **Test + SOS** (theo lớp) | XM-1 |
| Bộ chọn thời gian: hộp Từ tuần – Đến tuần | **GIỮ** + "Toàn bộ" + ‹ › dời 1 tuần; không trần 52 tuần | P9 |
| Phân tích GV: bấm Chấm điểm → panel Chấm điểm (lọc Trễ, link Lịch Test) | **GIỮ** (cột Điểm đúng hạn) | |
| Phân tích GV: bấm ô khác → panel đúng GV + kỳ | **GIỮ** + cột mới cùng kiểu | |
| Phân tích GV: rê tiêu đề → chú thích cột | **BỎ** (P1: không câu giải thích trên màn) | |
| Phân tích GV: cột Kết quả theo từng kỹ năng (L R W1 W2 S / L+S R+W) | **BỎ** khỏi bảng (mockup: kỹ năng chi tiết ở Hồ sơ GV — truy vết B3 "BỎ") | |
| Phân tích GV: phân trang 10 / 20 / 50 | **GIỮ** | |
| — | **MỚI**: Bộ cột Gọn / Đầy đủ, Tìm GV | |
| Kết quả thi › Thi thật: chọn Bước tiếp trên hàng (menu, Hoàn tác) | **Chỉ đọc** — chọn ở Sau thi (Công việc TVV / hồ sơ HV); hàng chưa chọn có "Hồ sơ HV ›" | C16 |
| Xuất Excel kết quả Test (Test + SOS) | **GIỮ** (không đổi) | |

## Phép kiểm gỡ / đổi (Q-7)
- `prPb2a` (Pb2-a 3): bỏ ca "> 52 tuần → 400" (P9). `prOv15e` OV15e-1 (> 52 tuần hợp lệ), OV15e-10 (Báo cáo HV không còn danh sách dài → bỏ khỏi danh sách phân trang). `prBang0` gỡ `BaoCao.tsx` khỏi danh sách miễn (đã hết `<table>`).
- Thêm `prUiPhanTich`: Báo cáo HV = Tổng quan (cùng kỳ), kỳ 6 tuần = `baoCao().datMt`; Tiến bộ theo kỹ năng số = panel; Phân tích GV: Đạt MT + thi thật = Kết quả gộp, Quá hạn = Trễ chấm, Case có PA = Tổng quan, mỗi ô = số dòng panel; "Toàn bộ" + không trần.
