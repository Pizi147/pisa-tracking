# v21 ⑨ · Phân tích (CHỈNH, không làm lại) — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/phan-tich.html` + `phan-tich.css` (CSS chép nguyên từ nền V2; phần mới ở cuối tệp, ghi "v21:"). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/11-de-bai-mockup-dot-2.md` mục ⑨ R9.1–R9.6 + G1–G5; chi tiết `10-ra-dong-bo.md` mục D.
Nền đã duyệt (giữ hình ảnh sát): `thiet-ke/2026-11-12-phan-tich-v2/phan-tich-v2.html` (+ v19 / v20 / v13). Chỉ vẽ khung CÓ ĐỔI + một khung toàn trang mỗi tab.
Ảnh: `thiet-ke/v21/anh/phan-tich/` — `<khung>-1440-toi.png`, `<khung>-1440-sang.png`, `<khung>-375-sang.png` (46 ảnh) · **ảnh cặp `cap-<khung>.png`** = TRƯỚC │ SAU + một câu "đổi gì" (27 cặp) · `truoc/` = ảnh web thật.
TRƯỚC chụp từ web thật (seed, ngày demo 14/09/2026, vai QL userId 2 · TVV userId 23), dev ở cổng 4410 / 5410 của worktree. Seed chưa có KQ thi thật → TRƯỚC của tab Thi thật lấy khung C1 / C4 của nền V2 (như README nền đã làm). Phông Be Vietnam Pro đã nạp (`document.fonts.check` = true) trước khi chụp. Soát tự động: không chữ < 12 px, không chữ tràn khung (trừ hàng tab 375 cuộn ngang có mờ mép — như nền).

## 0. Lời chủ SP trong session này

(chưa có)

## 1. Khung

| Khung | Nội dung | R |
|---|---|---|
| L1 | Cùng một hàng lọc ở 5 tab (1440), ô mờ = không áp dụng | R9.3 |
| L2 | "Mọi lớp" mở — ô chọn có tìm, nhóm Đang chạy · Đã kết thúc | R9.3 |
| L3 | Tìm GV: đã chọn một GV (✕ bỏ lọc) · đang gõ "linh" | R9.3 |
| L4 | 375: hàng lọc Chi nhánh · Thi thật · Giáo viên | R9.3 |
| A1 · A6 | Chi nhánh toàn trang 1440 · 375 | R9.3, R9.4, R9.6 |
| C1 · C4 | Thi thật toàn trang 1440 · 375 — ô mới "Sắp thi · 6 tuần · còn SOS" | R9.5 |
| C5 · C6 | Panel Sắp thi · còn SOS 1440 · 375 | R9.5 |
| B1 | SOS toàn trang | R9.2, R9.3 |
| B5 · B6 · B3 | ⓘ mở: Theo tuần · PA nào hiệu quả · 375 | R9.2 |
| D1 · D4 | Giáo viên toàn trang 1440 · 375 — ô Chưa làm bấm được | R9.1 |
| D5 · D6 · D7 | Panel Chưa làm nhóm theo GV: tab Chấm Test · tab Việc · 375 | R9.1 |
| Y1 · Y2 · Y3 | Ý thức toàn trang · ⓘ mở · 375 | R9.2, G2 tên bậc |
| E1 | Giáo viên lỗi tải (câu chuẩn) | G2 |
| E2 | Thi thật rỗng trong kỳ; Sắp thi = 0 không bấm | R9.5 |
| E3 · E5 | Panel Chưa làm đang tải · lỗi tải | R9.1 |
| E4 | TVV (chỉ xem): không tab Giáo viên, hàng lọc giữ chỗ | R9.3 |

## 2. Bảng truy vết — khung → thành phần → TRƯỚC → SAU

| Khung | Thành phần | TRƯỚC (web 14/11) | SAU (mockup) | GIỮ / ĐỔI / BỎ |
|---|---|---|---|---|
| mọi khung | Thanh tab 5 mục | `HangTab` v8 (15 / 500) | tab chuẩn ⑤ H1 (14 / 600, gạch 2 px nhấn); không badge (Phân tích không có việc) | ĐỔI dáng, GIỮ 5 tab + thứ tự |
| mọi khung | Hàng lọc | ô hiện / ẩn theo tab → ô sau bị dời (Thi thật, Ý thức mất Chương trình; Chi nhánh, Giáo viên mất Lớp) | một thứ tự cố định; ô không áp dụng mờ + viền đứt + `disabled` (dáng ô tắt ⑤ A3) | ĐỔI |
| L2 | Ô Lớp | `OChon` (`<select>`, nhóm "Đã kết thúc") | ô chọn có tìm ⑤ mẫu A, nhóm Đang chạy · Đã kết thúc, dòng phụ sĩ số · tuần | ĐỔI dáng, GIỮ nhóm + dữ liệu `/ref/classes` |
| L3 | Tìm GV | ô gõ lọc chữ | ô chọn có tìm: gõ vẫn lọc bảng theo chữ; chọn một GV → còn một dòng; ✕ bỏ | ĐỔI dáng, GIỮ lọc chữ |
| L1 | Xếp theo (SOS) | `<select>` | giữ ô chọn thường (danh sách ngắn cố định, ⑤ A6) | GIỮ |
| L1 | In · ⋯ · Xuất Excel | SOS: ⋯ đứng SAU Xuất Excel | ⋯ trước, **Xuất Excel luôn cuối** (như nền V2) | ĐỔI thứ tự |
| A1 | Ô Thi thật ở Chi nhánh | "Thi thật · trong kỳ" | "Thi thật · W1–W4 NOV" | ĐỔI chữ (R9.4) |
| A1 | Ô Đạt MT | "Đạt MT · trong kỳ" | "Đạt MT · HV · trong kỳ" (cột bảng đã ghi "Đạt MT · HV") | ĐỔI chữ (R9.4) |
| A1 | Số to 48, bảng 6 lớp / trang, hàng tổng, Tiến bộ theo kỹ năng, In | có | như cũ | GIỮ |
| A1 | Xuất Excel Chi nhánh | web đã có (nền V2 ẩn tới PR Excel) | giữ trên web, cuối hàng | GIỮ (theo web) |
| C1 | Khối kết quả (2 ô công tắc + thanh), Không thi, Chưa có KQ | có | như cũ, khối kết quả hẹp lại một chút | GIỮ |
| C1 | **Ô "Sắp thi · 6 tuần · còn SOS"** | — | ô thứ ba: số em + chip SOS 1 · 2 · 3 (bấm được) + "hiện tại · thi W3 NOV – W4 DEC" + ⓘ | MỚI (R9.5, lời 35) |
| C5 / C6 | Panel Sắp thi · còn SOS | — | dáng panel số V2 (loại · ✕ · ⓘ · tiêu đề · dòng ngữ · chip chia), bảng: Học viên (link) · Lớp (link) · Ngày thi (dd/mm + mã tuần) · SOS · MT mới nhất (mức + kỹ năng) · TVV; 375 mỗi em một thẻ | MỚI |
| B1 | Dải 6 ô, bảng Theo tuần, khối PA | có | như cũ | GIỮ |
| B5 | Giải thích cột Theo tuần | `title` ở tiêu đề nhóm cột (`TongHopTestSos.tsx:438`), ô HV - Case (`:226`), ⚠ quá hạn (`:238`) | ⓘ đầu thẻ "Theo tuần" mở hộp: mỗi cột một dòng | ĐỔI (R9.2) |
| B6 | Giải thích khối PA | `title` "mỗi vấn đề ≤ 2 PA có kết quả" (`HieuQuaPa.tsx:218`), chip "Nên dùng" (`:82`), ⓘ riêng ở "PA theo quy chế" | MỘT ⓘ đầu thẻ "PA nào hiệu quả": Có cải thiện · Nên dùng · n vấn đề khác · PA theo quy chế | ĐỔI (R9.2), BỎ ⓘ thứ hai |
| D1 | Ô "Chưa làm" | "⚠ 15 bài 4 việc" — chữ, KHÔNG bấm được | hai ô số đỏ bấm được (6 bài · 4 việc) + "+ 8 bài S chéo chung" bấm được | ĐỔI (R9.1) |
| D5 / D6 / D7 | **Panel Chưa làm** | — | tab con Chấm Test · Việc (badge mờ); nhóm theo GV (tên link · số); mỗi dòng = dòng việc chuẩn ⑤ B1 chỉ đọc: "Lớp · việc" · thẻ phụ (em link, đợt, tuần, số bài) · chip "⚠ quá hạn n ngày"; nhóm cuối "S chéo chung · chưa ai nhận · không vào tỉ lệ" | MỚI |
| D1 | Bảng GV, panel 3 tab của từng GV, "Thi thật theo GV ›", Chưa phân công, Xuất Excel | có | như cũ | GIỮ |
| D1 | `title` "Bấm ▸ xem từng chi nhánh" (QT, `PhanTichGiaoVien.tsx:81`, `:132`) | rê chuột | bỏ — nút ▸ đã có `aria-label` "tách n chi nhánh" | BỎ (R9.2) |
| D4 | Thẻ 375 | "Đạt kỳ vọng Test" | "Đạt kỳ vọng Test · lượt" | ĐỔI chữ (R9.4) |
| Y1 / Y2 | Giải thích cột | `Th hint` (rê chuột) ở 6 cột (`YThucPhoiHop.tsx:157–160`, `:231–232`) | gom vào ⓘ đầu thẻ "Học viên cần chú ý" (cách chọn + từng cột + thang) và "Lớp nhiều vi phạm" (xếp · HV có vi phạm · ± kỳ trước) | ĐỔI (R9.2) |
| Y1 | Tên bậc | "Report 1 › Report 2", "WL 2 › Report 7" | VIẾT HOA: cột viết tắt "REPORT 1 › REPORT 2", "WL 1 › REPORT 4 + MEETING", "WL 2 › WL 3"; thang trong ⓘ viết đủ "WARNING LETTER 1 / 2 / 3" | ĐỔI (G2, lời 35) |
| Y1 | Dải 4 ô, hai bảng, mở nhóm vi phạm, Xuất Excel | có | như cũ | GIỮ |
| E1 / E5 | Lỗi tải | `ErrorState` (tiêu đề + gợi ý + Thử lại) | một dòng "⚠ Không tải được … · Thử lại" (⑤ B3), hàng lọc vẫn dùng | ĐỔI chữ |
| E4 | TVV | không tab Giáo viên, link cũ → toast | như cũ | GIỮ |
| mọi khung | Ô số | web: số trong hộp viền (`OSo` hộp) | theo nền V2: chữ màu nhấn, rê / chạm mới gạch chân | GIỮ nền — xem [XM-3] |

## 3. Thao tác TRƯỚC → SAU

| Tab | Thao tác trước | Sau | Lý do nếu đổi |
|---|---|---|---|
| Chung | Đổi tab, giữ khoảng tuần (C29), link `?goc=` cũ, toast khi không quyền | Giữ | — |
| Chung | Chọn chương trình · Toàn bộ / Chọn khoảng tuần · tuần → tuần | Giữ; ô không áp dụng vẫn thấy nhưng mờ, không bấm | R9.3 |
| Chung | Chọn lớp (`<select>`) | Chọn lớp bằng ô chọn có tìm (gõ mã, ↑ ↓, Esc) | R9.3, lời 17 |
| Chung | Bấm số → panel (một lần) | Giữ | — |
| Chung | Rê chuột xem giải thích | **Bấm ⓘ**: ⓘ ở đầu thẻ mở dải giải thích ngay dưới đầu thẻ (đẩy bảng xuống, không che cột), ✕ / Esc / bấm ⓘ lần nữa đóng; ⓘ ở ô số / panel mở hộp nhỏ (`NutLuat`) | R9.2 — rê chuột không dùng được trên điện thoại; sửa sau critique |
| Chi nhánh | In · Xuất Excel · chuyển trang bảng · bấm ô Thi thật | Giữ | — |
| Thi thật | Hai ô công tắc · bấm đoạn thanh · bảng · phân trang · Mỗi trang · Xuất Excel | Giữ | — |
| Thi thật | — | **Mới:** bấm số "Sắp thi · còn SOS" hoặc chip SOS n → panel em (chip mở panel đã lọc mức đó); bấm tên em → hồ sơ HV, mã lớp → hồ sơ lớp | R9.5 |
| SOS | Xếp theo · mở dòng con · ⋯ (Cột hiện · Xuất kết quả từng lượt · Excel Mock) · Xuất Excel · bấm chip / số | Giữ (⋯ đứng trước Xuất Excel) | Xuất luôn cuối |
| Giáo viên | Tìm GV (gõ lọc) · bấm số → panel 3 tab · bấm tên → hồ sơ GV · phân trang · Xuất Excel · Thi thật theo GV › | Giữ; Tìm GV thêm lối chọn đúng một GV | — |
| Giáo viên | Ô Chưa làm chỉ đọc | **Mới:** bấm "6" bài / "4" việc → panel Chưa làm (tab Chấm Test / Việc); bấm "8" S chéo chung → panel S chéo chung (đang có ở bảng) | R9.1 |
| Ý thức | Mở nhóm vi phạm · bấm số · tên em → hồ sơ (tab Ý thức) · mã lớp → hồ sơ lớp · Xuất Excel | Giữ | — |

Không mất thao tác nào.

## 4. Luật "số không trùng" — ô Sắp thi · còn SOS

| | Tab SOS | Ô Sắp thi · còn SOS (Thi thật) |
|---|---|---|
| Đếm gì | **lượt** MT có mức SOS (SOS 1 · 2 · 3), Case, PA | **em** đang SOS ở MT mới nhất |
| Thời gian | lượt MT chốt **trong kỳ đã chọn (quá khứ)** | **hiện tại**, nhìn về trước: ngày thi đã chốt trong 6 tuần tới |
| Câu hỏi | "Em bị tụt có được giúp không?" | "Em sắp đi thi mà vẫn SOS — còn kịp gì?" |

Không số nào trên tab SOS bằng số này theo định nghĩa: em SOS lâu ngày có thể không có lượt nào trong kỳ (SOS không đếm, ô này đếm); em có lượt SOS trong kỳ nhưng chưa chốt ngày thi (SOS đếm, ô này không). Cũng không trùng các số của Thi thật (Em thi, Chưa có KQ, Không thi — đều về ngày thi đã qua) và Chi nhánh (Đạt MT · HV — kết quả trong kỳ). Tab Chi nhánh **không** chép ô này (ngoại lệ chép số chỉ dành cho ô Thi thật đã duyệt).

## 5. Dòng đọc Turso (chủ SP 30/10, 06/11)

| Phần | Đường | Ước thêm | Ghi chú |
|---|---|---|---|
| Ô Sắp thi · còn SOS | kèm `GET /phan-tich/thi-that` (cùng lần tải) | **+ 2–3 câu**, ≤ ~400 dòng / lần mở (một chi nhánh) | (1) chu kỳ thi có `exam_date` từ hôm nay → +42 ngày, em đang học, theo chi nhánh / lớp — vài chục dòng; (2) mức SOS ở MT mới nhất của các em đó (một câu theo lô `IN`, ≤ 5 kỹ năng × n em); (3) tên TVV nếu chưa có trong câu (1). Đọc đúng phạm vi chi nhánh, không quét lịch thi cả hệ thống |
| Panel Sắp thi | `GET /phan-tich/thi-that/o?o=sap-thi` (đường panel đang có) | 2–3 câu, ≤ 300 dòng, **chỉ khi bấm** | cùng hàm với ô → số khớp |
| Panel Chưa làm | `GET /phan-tich/giao-vien/danh-sach` (đang có, Excel dùng) | như đường đang có, **chỉ khi bấm** | không đọc thêm khi mở tab; lọc `chua` + nhóm theo GV ở web hoặc tham số |
| Ô chọn Lớp / Tìm GV | dữ liệu đã nạp (`/ref/classes`, hàng GV của bảng) | 0 | không request mới |
| ⓘ | chữ tĩnh | 0 | |

Ước ngày: ~20 lần mở Thi thật / chi nhánh / ngày × 5 chi nhánh × ~400 dòng ≈ **40 000 dòng / ngày** (trần giữ < 15 triệu). Không cần cảnh báo. PR code thêm trần câu + dòng cho `/phan-tich/thi-that` (có ô mới) vào `server/src/tests/tocDoDuong.ts`.

## 6. [XM] — cần PTA Overhaul / chủ SP quyết

1. **[XM-1] ⓘ chỉ ở đầu thẻ, không ở đầu cột.** R9.2 ghi "ⓘ ở đầu thẻ / đầu cột", nhưng luật giao diện (CLAUDE.md, DESIGN.md Luật V5) cấm điều khiển trong tiêu đề bảng. Mockup gom mọi giải thích cột vào MỘT ⓘ đầu thẻ (mỗi cột một dòng trong hộp). Đề xuất giữ.
2. **[XM-2] "Sắp thi" chỉ tính ngày thi ĐÃ CHỐT.** Em chỉ có tháng dự kiến không tính (không biết ngày → không biết có trong 6 tuần không). Muốn tính cả tháng dự kiến rơi vào 6 tuần tới thì ô to hơn nhưng kém chính xác. Đề xuất: chỉ ngày đã chốt.
3. **[XM-3] Dáng ô số.** Web hiện vẽ số bấm được trong hộp viền; nền V2 và bộ chuẩn ⑤ H3 vẽ chữ màu nhấn có gạch chân (⑤) / gạch khi rê (V2). Mockup giữ theo nền V2 (đề bài: giữ hình ảnh sát nền). PR code cần một dáng chung với ⑤ — PTA chọn.
4. **[XM-4] Cột "HV - Case" ở SOS.** Web đã tách hai cột "HV có Case" · "Case"; nền V2 gộp "HV - Case". Không thuộc R9 → mockup không vẽ lại; PR code **giữ như web** (hai cột), ⓘ ghi theo cột đang có.
5. **[XM-5] Tên bậc "REPORT 4 + MEETING CX / GĐCN".** Viết hoa theo G2; chờ ⓪ chốt bảng "chỗ viết đủ │ chỗ viết tắt" rồi theo. Biện pháp ngoài thang ("Đình chỉ học tạm thời") giữ chữ thường (không phải tên bậc).
6. **[XM-6] Panel Chưa làm có nhóm "S chéo chung".** Nhóm cuối của tab Chấm Test, không cộng vào "6 bài" (khớp ô và tỉ lệ). "Chưa phân công" không vào panel này (ô riêng bên cạnh, đã bấm được). Đề xuất giữ.
7. **[XM-7] Ô Chương trình ở Ý thức** mờ cả hai nút (Ý thức tính cả hai khung). Nếu sau này Ý thức lọc được theo khung thì ô bật lại tại chỗ, không dời gì.
8. Lặt vặt `10` mục D không vẽ (ngoài R9): Excel Ý thức theo khung `xuatV2.ts` → PR Excel; dòng "Chưa tính" ở khối PA — web 14/11 không còn hiện dòng này, giải thích vào ⓘ khối PA nếu PR thấy còn.

## 7. Tự rà từng dòng R

| R | Yêu cầu | Chỗ trong mockup | Đạt? |
|---|---|---|---|
| R9.1 | Ô "Chưa làm" bấm được → panel mọi bài / việc quá hạn nhóm theo GV, mỗi dòng lớp · việc · hạn, dòng việc chuẩn, chỉ đọc | D1 (hai ô số đỏ bấm được), D5 tab Chấm Test, D6 tab Việc, D7 375; mỗi dòng "Lớp · việc" + thẻ phụ + chip "⚠ quá hạn n ngày", không nút; E3 / E5 tải · lỗi | Đạt |
| R9.2 | Giải thích trong rê chuột → ⓘ đầu thẻ / đầu cột (Ý thức, SOS, khối PA); 375 đọc được | B5 (Theo tuần), B6 (PA), Y2 (Ý thức); B3 / Y3 375 hộp hết bề ngang; mọi `title` giải thích đã bỏ. Đầu cột: không — [XM-1] | Đạt (đầu thẻ) |
| R9.3 | Hàng lọc cố định giữa 5 tab, ô không áp dụng mờ; Mọi lớp, Tìm GV là ô chọn có tìm | L1 (5 hàng cùng vị trí), L2, L3, L4; mọi khung toàn trang | Đạt |
| R9.4 | Ô Thi thật ở Chi nhánh ghi rõ kỳ; nhãn "Đạt MT · HV", "Đạt kỳ vọng Test · lượt" | A1, A6 ("Thi thật · W1–W4 NOV", "Đạt MT · HV"); D1 cột + D4 thẻ "Đạt kỳ vọng Test · lượt" | Đạt |
| R9.5 | Ô mới "Sắp thi · 6 tuần · còn SOS" → panel em: lớp · ngày thi · mức SOS · TVV; ước đọc | C1, C4, C5, C6, E2 (0 không bấm), E4 (TVV); mục 4 (không trùng), mục 5 (+ 2–3 câu) | Đạt |
| R9.6 | Thanh tab, panel, Xuất theo bộ chuẩn; không đổi gì khác | tab ⑤ H1, panel 736 (bảng có điểm 820) dáng panel số, Xuất Excel cuối hàng; mục 2 dòng GIỮ | Đạt |
| G1 | Nâng cấp, giữ bố cục + mọi thao tác | mục 3: không mất thao tác | Đạt |
| G2 | Đồng bộ: ô chọn có tìm, câu lỗi chuẩn, tên bậc hoa, mã tuần | L2 / L3, E1 / E5, Y1 / Y2, mọi thời gian dạng mã tuần (ngày chỉ ở ngày thi, hạn) | Đạt |
| G3 | Không chú thích tĩnh, không bước xác nhận, không tab mới | không thêm câu tĩnh; dòng mẫu dưới số là đơn vị / phạm vi (như nền) | Đạt |
| G4 | html + css riêng + ghi chú + ảnh 1440 Tối / Sáng, 375 Sáng; ảnh cặp; đủ trạng thái | 46 ảnh + 27 ảnh cặp; E1–E5 | Đạt |
| G5 | PR chỉ `thiet-ke/v21/`, không merge | xem mô tả PR | Đạt |

## 8. Critique (impeccable)

Chạy đúng quy trình hai agent độc lập (A rà thiết kế đọc ảnh từng khung · B detector `impeccable detect`).
- **Vòng 1: 29/40.** P1: (1) hộp ⓘ nổi che chính các cột nó giải thích, không có nút đóng; (2) nút ⓘ 28 px trên điện thoại (< 44). P2: ô khoá "Fast Track" ở Thi thật trông như đang chọn; số ở panel Chưa làm dễ hiểu nhầm (chip "+ S chéo chung"); 375 hàng lọc tốn chỗ; khung L2 / L3 tràn. P3: thang cấp bậc một dòng dài.
- **Đã sửa:** ⓘ đầu thẻ mở thành **dải ngay dưới đầu thẻ, đẩy bảng xuống** (không che cột), có ✕; vùng chạm ⓘ / ✕ 44 px ở 375; ô khoá chữ 600 + nền nhạt + viền đứt rõ; bỏ chip, câu "S chéo chung để riêng" vào ⓘ của panel; 375 hàng lọc luôn hai cột Lớp │ ô riêng; L2 / L3 vẽ trong khung; thang thành danh sách dọc có "(WL 1)".
- **Vòng 2 (xác nhận): 31/40, không còn P0 / P1.** Còn P2 / P3 nhỏ đã sửa hoặc chấp nhận: câu tĩnh trong panel (đã chuyển vào ⓘ) · ô khoá lẫn với "không chọn" (đã thêm nền nhạt) · dải ⓘ Ý thức hơi dài (P3, giữ — đọc một lần) · thẻ phụ D6 có chip SOS (đúng dáng ⑤ B1).
- **Detector:** 12 phát hiện, đều báo nhầm (màu / phông / bo góc của phần ghi chú mockup; Inter là phông chữ số theo DESIGN.md; vạch 3 px trái là vạch hàng nhóm đã duyệt G14; "—" là ô trống). Không phát hiện nặng.
- Dừng theo cổng chất lượng mockup (chạm ~30 → tối đa 2 vòng, rồi chỉ cần không P0 / P1). Điểm 31 < mục tiêu 35 chủ yếu do phần GIỮ của nền (vd "+ 8 S chéo chung" hiện ở hai GV trong bảng — dáng đã duyệt).

## 9. Ghi cho PR code

- Hàng lọc: ô không áp dụng là `disabled` thật (ô đoạn) / `aria-disabled` (ô chọn), `aria-label` nói lý do ("Chương trình: thi thật chỉ có ở Fast Track", "Lớp — báo cáo này không lọc theo lớp"); KHÔNG dùng `title`.
- Ô Lớp / Tìm GV: dựng trên `ChonLop` / `ChonNguoi` đã có (⑤ bảng kê dòng 51), dữ liệu đã nạp, không request mới.
- ⓘ ở đầu thẻ (`DauThe cachTinh`): mở thành dải dưới đầu thẻ (đẩy nội dung, không nổi), có ✕, Esc đóng, `aria-expanded`; vùng chạm 44 px ở 375. ⓘ ở ô số / đầu panel giữ hộp nổi `NutLuat` (`web/src/ui/NutLuat.tsx`).
- Ô Sắp thi: số và panel cùng một hàm máy chủ; chip SOS n mở panel lọc sẵn mức đó.
- Panel Chưa làm: tái dùng dòng việc chuẩn (⑤ B1) ở chế độ chỉ đọc (không nút, không hover hàng).
