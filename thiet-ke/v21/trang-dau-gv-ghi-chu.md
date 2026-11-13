# v21 · Trang đầu GV — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/trang-dau-gv.html` (+ `v21.css`). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/03-de-bai-mockup-1.md`.
Ảnh tự soát: `thiet-ke/v21/anh/k{1..8}-{n}-{toi|sang}.png` (chụp bằng chrome-headless-shell có sẵn trong máy, không cài gói; phông Be Vietnam Pro + Inter đã nạp; soát tự động: không phần tử nào tràn khung, không chữ bị cắt / "…", không chữ < 12 px).
Mã luật (cột "Phục vụ") theo `luat/0-luat-core-mot-trang.md`.

## 0. Chủ SP duyệt 14/11 kèm 3 chỉnh

> "Còn lại duyệt nhé, tôi thấy khá ok"
> "1. Chấm Speaking thì phải hiểu là chủ yếu toàn chấm cho lớp khác, nên cứ để theo thứ tự lớp mặc định
> 2. Phần lớp của tôi bên cạnh đừng để mặc định 'nhập điểm' đẻ chung cùng các việc khác ở cột cuối, và đổi cột cuối để thành 'Việc cần làm' (tất nhiên chỉ hiện việc của người đó) và hiện ra số việc + loại việc, thể hiện rõ hơn đừng để mỗi text, và khi bấm vào sẽ hiện ra panels tương ứng, hoặc đưa đến trang tương ứng nhé
> 3. '+Ghi' thay bằng '+ Task', và xếp theo thứ tự: Case, Vi phạm/ Nhắc nhở, Tình hình học tập."
> "đổi speaking chấm chéo thành 'Chấm Speaking' là được rồi"

Đã sửa: (1) K3, K8c — ngăn lớp theo mã lớp, bỏ chip "lớp tôi dạy"; (2) Lớp của tôi ở K1, K6, K7a, K8b, K8e — bỏ cột nút, cột cuối "Việc cần làm" = nút-chip theo loại (thứ tự cố định Nhập điểm · Chấm Speaking · Case · Ý thức · Báo cáo PH · Vận hành), bấm mở panel / sang tab, chỉ "Báo cáo PH ›" đổi trang; K2 là trạng thái sau khi bấm chip Nhập điểm; (3) "+ Task" mọi khung, menu Case · Vi phạm / Nhắc nhở · Tình hình học tập (hộp bước sau đổi tiêu đề cho khớp tên mục); (4) tên cũ trên web: Speaking chấm chéo (#1475) → **Chấm Speaking** (tab, loại panel, chip Việc cần làm); dải đầu tab vẫn "Việc chung của nhóm GV Speaking"; bỏ chip "chấm chéo" ở cột Test.

## 1. Bảng truy vết khung → thành phần → luật / việc → TRƯỚC → SAU

| Khung | Thành phần | Phục vụ | Trước (web / mockup đã duyệt) | Sau (v21) | Loại |
|---|---|---|---|---|---|
| #k1 | Thanh trên GV: Công việc (badge) · Học viên & Lớp · Test · ô tìm · ? · chuông · tên | A1–A3, lời 4 (1)(2) | Tổng quan · HV & Lớp · Test · Công việc · Phân tích; trang đầu GV = Tổng quan | Công việc đứng đầu, là trang đầu; bỏ Tổng quan, Phân tích khỏi menu GV | ĐỔI (2.1, 2.2 — đã chốt lời 12) |
| #k1 | Đầu trang "Công việc · 14 việc · ⚠ 9 quá hạn" + Mọi hạn | — (số đếm v12 S11) | v12: bỏ tổng đầu trang | Giữ một tổng theo DÒNG việc, cùng số badge menu | GIỮ dáng / ĐỔI nhỏ |
| #k1 #k5 | Nút **+ Task** → menu 3 mục theo thứ tự Case · Vi phạm / Nhắc nhở · Tình hình học tập | D1, D5, C (Case tay) | 3 nút ở hồ sơ lớp / HV (tab Ý thức, "+ Case") | thêm một cửa ở trang đầu; nút cũ ở hồ sơ GIỮ | THÊM (1.2; tên + thứ tự chủ SP 14/11) |
| #k1 | Tab hạng mục + badge (v17) | A7, B4 | có | giữ; tab rỗng ẩn; thêm tab Báo cáo PH (K6) | GIỮ |
| #k1 #k2 | Danh sách trái 640: dải nhóm Mock Test / Progress – Final, vạch hạn, dòng "Cả lớp" + dòng theo em, chip hạn cột cố định, nút Nhập điểm | B2, B3 | v12 S1–S13 + v18 | giữ nguyên dáng | GIỮ |
| #k1 | Nhóm gập "Lớp tôi dạy" cuối danh sách | B3 | v18 CV6 (gập, bảng 7 cột số) | **BỎ khỏi cột trái** — nội dung lên khung phải thành "Lớp của tôi"; các cột số sang Hồ sơ GV (mục 4) | BỎ / CHUYỂN |
| #k1 | Nhóm gập "Yêu cầu của tôi" | E3, C5 | v18 CV6 | giữ, cuối danh sách | GIỮ |
| #k1 | "Đang chờ người khác" | — | đề xuất mẫu C | không có | BỎ (lời 6) |
| #k1 #k6 #k7 #k8 | **Lớp của tôi** (khung phải khi chưa chọn việc): một lớp một dòng, 4 cột Lớp · Tôi dạy · Test · **Việc cần làm** | A2, B2, B3, B4, D7 | ô trống "Chọn một việc ở danh sách" | danh sách lớp; cột Test chỉ chữ + chip hạn; cột cuối = nút-chip theo LOẠI việc của chính tôi (Nhập điểm · Chấm Speaking · Case · Ý thức · Báo cáo PH · Vận hành; số; ⚠ + màu quá hạn), không còn cột nút "Nhập điểm" riêng; lớp không việc để trống; mã lớp = link hồ sơ lớp | ĐỔI (1.1; chủ SP 14/11) |
| #k1 | Dòng lớp (a) FT có bài tuần này | B2, B3 | — | Test "MT · W3 SEP" + hạn 23/09; chip "Nhập điểm · 10 bài" (MB FT 104) | THÊM |
| #k1 | Dòng lớp (b) quá hạn | B3 | — | chip hạn ⚠ đỏ + chip "⚠ Nhập điểm · 6 bài" màu quá hạn (MB FT 101) | THÊM |
| #k1 | Dòng lớp (c) lớp thường chưa tới tuần Test | B2, B3 ("chưa tới tuần Test thì chưa nhập được") | — | "Final · W3 OCT", không nút (MB BE 03) | THÊM |
| #k1 | Dòng lớp (d) chỉ chủ nhiệm | A2, A3 | — | không bao giờ có chip Nhập điểm; chip "⚠ Ý thức · 2", "⚠ Vận hành · 1" (MB FOU 12) | THÊM |
| #k1 | Dòng lớp (e) Chấm Speaking | B4 | — | Test "Speaking · W3 SEP" + hạn; chip "Chấm Speaking · 6 bài" mở panel K3 (MB FT 108) | THÊM |
| #k1 | Dòng lớp (f) không có gì | — | — | mã lớp + kỹ năng, mờ, cuối (MB FT RF 12) | THÊM |
| #k2 | Panel nhập điểm (lưới FT, chỉ em có bài, L · R · Kết quả, hạn ở đầu) | B3, B5, B7 | PanelViecLuoi / LuoiFT | giữ; ✕ trả lại Lớp của tôi | GIỮ |
| #k2 #k3 #k4 #k5 | **Dòng quy chế**: một dòng, 13 px, màu phụ, cố định trên chân panel, ⓘ ở cuối | B6, C4–C6, D1–D2, lời 5 | có panel ghi luật tại chỗ, có panel không, mỗi nơi một kiểu | một mẫu, một chỗ cho mọi panel việc | ĐỔI (1.4) |
| #k2 | Chân panel "Việc tiếp ›" + trạng thái lưu | A7 | có | giữ | GIỮ |
| #k2 (K2b) | Hộp một ô: "Lưu · bài tiếp ›" + "Vắng"; "⋯" chứa Lưu · đóng · Khôi phục điểm · Bỏ vắng | B6, B7 | tới 7 nút một hàng (Khôi phục, Bỏ vắng, Vắng, Lưu, Lưu · bài tiếp…) | 2 nút + ⋯; mọi thao tác còn | ĐỔI (1.8) |
| #k3 | Đầu tab "Việc chung của nhóm GV Speaking · 18 bài · ⚠ 6 quá hạn"; một dòng "Chấm Speaking" | B4 | "0 việc" cạnh "1 quá hạn"; danh sách phẳng theo tên em | đếm bài, một việc chung | ĐỔI (lời 11) |
| #k3 | Panel gom tuần Test → lớp (ngăn gập), lớp theo thứ tự mã lớp mặc định (bỏ "lớp tôi dạy" lên đầu — chủ SP 14/11), "Tuần cũ hơn" gập cuối, cùng lưới K2 | B4 | lọc lớp + danh sách theo em | theo tuần + lớp | ĐỔI (lời 11, chủ SP 14/11) |
| #k3 | Ô "GV chấm" đầu ngăn (mặc định tôi); "Đã có điểm" ghi "GV chấm: …" | B4, 2.4 | "Người chấm" trong từng hộp; "Nhập bởi …" | một ô mỗi ngăn | ĐỔI chữ + chỗ |
| #k3 | Em vắng "vắng W2 SEP" · ô tìm em | B6 | có | giữ | GIỮ |
| #k4 | Panel Chọn PA (tiêu đề "Chọn PA · Reading"): Theo PA quy chế (mặc định) / Giữ PA của tôi, dòng quy chế đổi theo chọn | C5 | panel Xác nhận PA | thêm dòng quy chế đổi theo lựa chọn | ĐỔI nhỏ |
| #k4 | Panel Ghi kết quả PA: Lưu nháp + Lưu | C4, C6 | CapNhatTuan ("Lưu kết quả") | chữ nút "Lưu" (lời 13/11) + dòng quy chế | ĐỔI chữ |
| #k5 | Ô gõ tên em (gợi ý em lớp của tôi, lớp bên cạnh); Báo tình hình nhiều em ≤ 8 | D1, D5 | chọn em trong form từ hồ sơ lớp | bước chọn em trước form | THÊM |
| #k5 | Form Ghi vi phạm (Nhóm · Vi phạm · Môn · Ngày · Mô tả · Bằng chứng) + công tắc "Chỉ nhắc nhở" | D1, D2 | v20 B | giữ; dòng quy chế đổi theo công tắc thay câu mô tả dưới công tắc | GIỮ / ĐỔI nhỏ |
| #k6 | Tab Báo cáo PH: một lớp một dòng + "Viết ›" | D7, lời 12 | không có việc (chỉ tab Báo cáo PH ở hồ sơ lớp) | việc thật, hạn 30 (tháng 2: 28), hiện từ ngày 20 | THÊM (lời 12) |
| #k6 | Lớp của tôi: chip "Báo cáo PH · hạn 30/09 ›" (đổi trang — duy nhất có "›") | D7 | — | thêm ở cột Việc cần làm | THÊM |
| #k7 | Hết việc tab (thẻ V18) · GV mới · đang tải · lỗi | — | có (V18, Empty, Skeleton, ErrorState) | giữ; khung xương phẳng, lỗi riêng từng cột | GIỮ |
| #k8 | 375: thanh tab dưới 3 mục · công tắc "Việc · Lớp của tôi" · dòng chạm cả dòng · "+ Task" nút tròn nổi · thẻ lớp: hàng chip Việc cần làm cao 44 · panel S toàn màn "‹ Quay lại" | A1, B3, B4 | 375: menu ☰, Lớp tôi dạy gập cuối trang | như cột trái | ĐỔI |

## 2. Bảng thao tác TRƯỚC → SAU (trang Công việc + Tổng quan GV)

| Thao tác hiện có | Ở đâu (trước) | Sau v21 | Ghi chú |
|---|---|---|---|
| Mở trang đầu | Tổng quan GV | Công việc | 2.1 |
| Xem "Việc của tôi ›" (ô số) | Tổng quan GV | bỏ — trang đầu đã là việc | thừa khi việc là trang đầu |
| Chọn tab hạng mục, xem badge | Công việc | giữ | |
| Lọc hạn (Mọi hạn) | Công việc | giữ | |
| Bấm dòng việc → panel tại chỗ; Nhập điểm / Làm / Xem lại | Công việc | giữ | |
| "n em ▾" mở dòng gộp, "Xem thêm n dòng" | Công việc | giữ | |
| Việc tiếp › (chân panel / hộp hết bài) | Công việc | giữ | |
| Nhập điểm một ô: Lưu, Lưu · bài tiếp ›, Vắng, Khôi phục điểm, Bỏ vắng, Lưu điểm · đóng, Hoàn tác 10 s | hộp nhập | Lưu · bài tiếp › + Vắng ở ngoài; **Lưu · đóng** (thay "Lưu" ở lại + "Lưu điểm · đóng"), Khôi phục điểm, Bỏ vắng trong ⋯; Hoàn tác giữ | "Lưu" ở lại (R1-LUU-TIEP) gộp vào "Lưu · đóng" — [XM-3] |
| Chọn "Người chấm" S trong từng hộp | hộp S | ô "GV chấm" đầu ngăn lớp | 2.4 / 1.7 |
| Lọc lớp, tìm em ở panel S | panel S | tìm em giữ; lọc lớp thay bằng ngăn lớp xếp theo mã lớp | |
| Mở / gập "Yêu cầu của tôi", Mở ›, Xem thêm | Công việc | giữ | |
| Mở "Lớp tôi dạy", đổi Fast Track / Lớp thường, bấm ô số (dưới KV, SOS, Case, chờ chấm) | Công việc (gập) + Tổng quan GV | Lớp của tôi (khung phải, không công tắc — mỗi dòng đã ghi kỹ năng); ô số → Hồ sơ GV | mục 4 |
| Bấm mã lớp → hồ sơ lớp | bảng Lớp tôi dạy | giữ (Lớp của tôi) | |
| Nhập điểm theo lớp | hồ sơ lớp, Test, bảng Kỹ năng tôi dạy (không nút) | chip "Nhập điểm · n bài" trong cột Việc cần làm của Lớp của tôi (chỉ khi có bài) | lối cũ giữ |
| Ghi vi phạm / Báo tình hình / + Case | hồ sơ lớp / HV | "+ Task" ở trang đầu: Case · Vi phạm / Nhắc nhở · Tình hình học tập; lối cũ giữ | 1.2 |
| Xem bảng Kỹ năng tôi dạy / Lớp tôi chủ nhiệm (Đạt KV, Tiến bộ, Chờ chấm, Dưới KV, SOS, Case, Thi tháng này) | Tổng quan GV | Hồ sơ GV | mục 4 |
| "Hồ sơ GV của tôi" | đầu Tổng quan GV | menu tên (góc phải) | không vẽ — [XM-6] |
| Viết Báo cáo PH | tab Báo cáo PH hồ sơ lớp (không việc nhắc) | việc ở tab Báo cáo PH + "Viết ›" sang đúng tab đó | lời 12 |

Không thao tác nào bị mất.

## 3. [XM] — chỗ phải tự đoán hoặc đụng lời cũ

1. **[XM-1] Số đầu trang** — đề bài ghi ví dụ "30 việc · 9 quá hạn"; mockup ghi "14 việc · ⚠ 9 quá hạn" để khớp đúng dữ liệu mẫu (5 + 4 + 3 + 2 dòng; luật "cùng số liệu cùng nguồn"). v12 S11 đã bỏ tổng đầu trang; R2 đưa lại — PTA xác nhận.
2. **[XM-2] Badge tab Chấm Speaking** — có badge đỏ riêng "6" (bài quá hạn của nhóm), KHÔNG cộng vào badge menu / tổng (bài chung, OV-14c) — chờ chủ SP xem.
3. **[XM-3] "Lưu" ở lại** (R1-LUU-TIEP 26/10) — đề bài liệt kê ⋯ = Lưu · đóng, Khôi phục điểm, Bỏ vắng; nút "Lưu" (ở lại, "✓ Đã lưu") không còn. Mockup theo đề bài; nếu GV cần sửa lại ô vừa lưu, đề xuất ⋯ có thêm "Lưu".
4. **[XM-4] Hộp W1 trong K2** — GV mẫu dạy L + R nên lưới K2 không có cột W1; hộp W1 vẽ riêng (K2b) như hộp của GV Writing, cùng thành phần.
5. **[XM-5] Việc cần làm** — chip Case / Ý thức / Vận hành bấm = sang tab đó, lọc lớp, mở việc đầu tiên (mockup K1 chỉ chuyển tab); không "›" (G6). Chỉ chip "Báo cáo PH ›" có "›" (đổi trang). Lớp chỉ chủ nhiệm (d): cột Test để trống. Tự đoán: biểu tượng từng loại dùng lại biểu tượng tab; một chip mang ⚠ khi có ÍT NHẤT một việc quá hạn trong loại đó.
6. **[XM-6] Lối vào Hồ sơ GV** của chính GV khi bỏ Tổng quan — đề xuất: menu tên ở thanh trên. Không vẽ.
7. **[XM-7] Panel Chọn PA** — không có mockup panel này; vẽ bằng thẻ lựa chọn `.cach` (v20 D). Nội dung PA ("Bổ trợ Reading · 2 buổi / 2 tuần") là dữ liệu bịa.
8. **[XM-8] Speaking "Tuần cũ hơn · 7 bài · 6 quá hạn"** — bài thứ 7 coi là MT0 (cách tính quá hạn riêng 09/11). Đếm thật lấy máy chủ.
9. **[XM-9] Bóng** — chỉ menu thả, hộp nổi, nút tròn 375 có bóng (để tách lớp nổi, như v20 `.menu3` / `.hop`); không bóng trang trí.
10. **[XM-10] Báo cáo PH lớp thường** — chủ SP chốt 13–14/11: cũng sinh việc, hạn thứ Ba tuần sau tuần Test. K6 đã thêm dòng "Viết Báo cáo PH · MB FOU 15 · Progress W3 SEP · còn 12 / 12 em · hạn 22/09".
11. **[XM-11] Turso** — "Lớp của tôi" cần tình trạng Test + số việc từng lớp: đề xuất ghép vào `/my-work` (đã nạp danh sách việc; tình trạng Test lấy từ lịch lớp của chính GV), không thêm request; đo ở plan PR.
13. **[XM-13] Hai lối "Nhập điểm"** — cùng một lớp có nút ở danh sách việc lẫn chip ở "Lớp của tôi": chủ ý (hai lối cùng mở một panel) — chờ chủ SP xem có thấy lặp không.
14. Sửa theo PTA 14/11: bỏ chip đợt "MT1 / MT2" ở dòng việc theo lớp × tuần và dòng một em (N39; panel theo em giữ); nhóm vi phạm theo `shared/domain/yThuc.ts` (Chuyên cần · BTVN · Thái độ / hành vi · Kỷ luật lớp học · Khác); bộ đếm nhận xét MT 300 (N35); chip hạn "⚠ còn 1 ngày · 23/09"; K4 tiêu đề "Chọn PA · Reading" (việc `xac_nhan_pa` khi GV đã có PA khác quy chế).
12. Bỏ phụ đề "TVV báo lại PH · kết quả về đây" của hộp Báo tình hình (câu giải thích; "Gửi tới / Hạn TVV" đã nói đủ).

## 4. Số liệu GV chuyển sang Hồ sơ GV

| Ô / bảng (Tổng quan GV hiện tại) | Sang Hồ sơ GV |
|---|---|
| Bảng "Kỹ năng tôi dạy" (`HaiKhoiGv`): Lớp · Kỹ năng · Đạt kỳ vọng Test · Tiến bộ · Chờ chấm | tab Học thuật — cùng ô bấm `/giao-vien/:id/chi-so/o` (đã cùng nguồn) |
| Bảng "Lớp tôi chủ nhiệm": Dưới kỳ vọng · SOS hiện tại · Case · Thi tháng này | tab Lớp / Chủ nhiệm (cùng `/tong-quan/lop-toi-day/o`) |
| "Lớp tôi dạy" (gập ở Công việc): Học viên · Dưới KV · SOS · Case đang mở · Bài chờ chấm · Test sắp tới | các cột số → Hồ sơ GV; mã lớp, kỹ năng, Test sắp tới, bài chờ chấm → Lớp của tôi |
| Ô số "Đạt kỳ vọng", "Tiến bộ" đầu Tổng quan GV | đầu Hồ sơ GV |
| Ô "Việc của tôi ›" | bỏ (trang đầu là Công việc) |

## 5. Tự rà R1–R26

| R | Đạt / Chưa | Khung |
|---|---|---|
| R1 | Đạt | #k1 |
| R2 | Đạt (số khác ví dụ — XM-1) | #k1 |
| R3 | Đạt | #k1 (Báo cáo PH ở #k6) |
| R4 | Đạt | #k1 |
| R5 | Đạt (cột cuối đổi thành "Việc cần làm", chip theo loại — chủ SP 14/11) | #k1 |
| R6 a–f | Đạt (nút Nhập điểm nay là chip trong Việc cần làm) | #k1 (FT 104 · FT 101 · BE 03 · FOU 12 · FT 108 · FT RF 12) |
| R7 | Đạt (lớp không việc: cột Việc cần làm trống) | #k1 |
| R8 | Đạt (✕ bấm thử ở K1) | #k2, #k1 |
| R9 | Đạt | #k2 |
| R10 | Đạt (XM-3, XM-4) | #k2 K2b |
| R11 | Đạt | #k3 |
| R12 | Đạt — ĐỔI theo chủ SP 14/11: lớp xếp theo mã lớp, không đưa lớp tôi dạy lên đầu | #k3, #k8 K8c |
| R13 | Đạt | #k3 |
| R14 | Đạt | #k3 |
| R15 | Đạt | #k4 K4a / K4b |
| R16 | Đạt | #k4 K4c |
| R17 | Đạt — ĐỔI theo chủ SP 14/11: "+ Task", menu Case · Vi phạm / Nhắc nhở · Tình hình học tập | #k5 K5a–K5c |
| R18 | Đạt | #k5 K5d / K5e |
| R19 | Đạt (quá hạn + tháng 2 ở K6b; thêm dòng lớp thường MB FOU 15) | #k6 |
| R20 | Đạt (chip "Báo cáo PH · hạn 30/09 ›") | #k6, #k8 K8e |
| R21 | Đạt | #k7 K7a, #k8 K8f |
| R22 | Đạt | #k7 K7b |
| R23 | Đạt | #k7 K7c / K7d |
| R24 | Đạt ("+ Task" nút tròn) | #k8 K8a |
| R25 | Đạt (chip Việc cần làm cao 44 dưới dòng Test) | #k8 K8b, K8e |
| R26 | Đạt (ngăn theo mã lớp) | #k8 K8c |

Đã nạp ngữ cảnh impeccable, tự rà phân cấp; CHƯA chạy critique chấm điểm. Ảnh đã chụp: tối 24 khung + sáng 24 khung ở `anh/`.
