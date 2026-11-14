# v21 · Trang đầu TVV (mockup ④) — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/trang-dau-tvv.html` (+ `v21.css` chỉ đọc, + `trang-dau-tvv.css` phần thêm). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/06-de-bai-mockup-2-5.md` mục ④ (R4.1–R4.6) + "Luật chung cho cả bốn mockup" (lời 20).
Ảnh: `thiet-ke/v21/anh/trang-dau-tvv/k{1..7}-{n}-{toi|sang}.png` — 21 khung × Tối + Sáng (chrome-headless-shell có sẵn trong máy, không cài gói; phông Be Vietnam Pro + Inter đã nạp, `document.fonts.check` = true).
Soát tự động cả Tối và Sáng: không phần tử nào tràn / ra ngoài khung, không chữ bị cắt, không chữ < 12 px; bấm thử K1 (chip → panel, ✕ → HV của tôi, tìm em, tab, ô số) chạy đúng.
Đã xem màn thật trước khi vẽ (seed, cổng 4340 / 5340, TVV "Phan Mai" Monbay): Tổng quan TVV 5 ô to · Công việc 2 tab (Báo PH · Bổ sung hồ sơ) + khung phải trống "Chọn một việc ở danh sách" · panel Báo PH · Học viên & Lớp "HV của tôi". Đã tắt tiến trình của mình.
Mã luật (cột "Phục vụ") theo `luat/0-luat-core-mot-trang.md` và `luat/3-y-thuc-phoi-hop-tvv.md`.

**Chủ SP DUYỆT mockup ④ (15/11, trong session mockup ④):** "Duyệt mockup rồi nhé". Code theo mockup này + mục 0 dưới đây; các [XM] mục 3 làm theo đề xuất, trừ khi chủ SP nói khác.

## 0. Chủ SP 14/11 sáng — lời 24 (PTA Overhaul chuyển)

> "Kể cả những trường hợp chỉ có 1 học sinh, thì vẫn để mọi thứ đồng bộ theo form ở bảng công việc: Lớp - Tên công việc ngắn gọn như hiện tại."

Đã sửa: mọi dòng việc TVV ở K1 (tab Báo PH · Phối hợp SOS · Sau thi · Chốt ngày thi) và K7a (375) bỏ dạng "đầu em + cây việc", thành "Lớp · tên việc ngắn" + thẻ phụ tên em (link); bỏ thẻ "GV gửi" ở dòng Tình hình học tập (tên GV gửi đã ở panel) để thẻ phụ không bị cắt. Bảng "HV của tôi" (theo em) giữ nguyên. Ảnh chụp lại: k1-1, k7-1 (Tối + Sáng).

## 1. Bảng truy vết khung → thành phần → luật / việc → TRƯỚC → SAU

| Khung | Thành phần | Phục vụ | Trước (web) | Sau (v21) | Loại |
|---|---|---|---|---|---|
| #k1 | Menu TVV: Công việc (badge) · Học viên & Lớp · Phân tích | A5, 5.1 | Tổng quan · HV & Lớp · Công việc · Phân tích; trang đầu = Tổng quan | Công việc đứng đầu, là trang đầu; bỏ Tổng quan | ĐỔI (R4.1) |
| #k1 | Đầu trang "Công việc · Monbay" + Mọi hạn + **+ Task** | D5 | "Công việc · Monbay · 2 việc" + Mọi hạn + Lọc thêm | số việc sang ô "Việc" của dải (khỏi lặp); thêm "+ Task"; "Lọc thêm" giữ khi có (không vẽ — [XM-11]) | ĐỔI nhỏ |
| #k1 | **Dải chỉ số mỏng** 5 ô: Việc · Báo PH đúng hạn · Thi tháng này · Chờ KQ thi thật · Chưa chốt lộ trình tiếp | Y-14, L-19–L-21 | 5 thẻ ô số to ở Tổng quan TVV (`TongQuanTvvV5`) | một dải cao 58, kẻ dọc, cùng số, cùng nguồn, cùng ⓘ; cả ô bấm, "›" = đổi trang, 0 không bấm | ĐỔI (R4.2) |
| #k1 | Tab hạng mục Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ + badge | Y-14, L-20, L-21 | có (`NHOM_CV_TVV`) | giữ thứ tự, tab rỗng ẩn, badge đỏ = quá hạn | GIỮ |
| #k1 | Danh sách trái 640: dải mục (Báo PH · Phối hợp SOS · Sau thi · Chốt ngày thi · Bổ sung hồ sơ), vạch hạn, cột hạn + cột nút cố định | Y-14–Y-19 | dòng phẳng "Báo PH · Report 1" + thẻ tên em, lớp | dòng việc MỘT dạng **"Lớp · tên việc ngắn"** kể cả việc của một em (vd "MB FOU 12 · Báo PH Report 2"); tên em là thẻ phụ (link) cạnh SOS / số vi phạm; cột hạn + cột nút giữ — lời 24, mẫu ⑤ #1558 | ĐỔI dáng (5.3, lời 24) |
| #k1 | **HV của tôi** (khung phải khi chưa chọn việc): Học viên · Lớp · Tình trạng · **Việc cần làm** | A5, L-19, C1 | ô trống "Chọn một việc ở danh sách" | một em một dòng; tình trạng = Thi dd/mm · Đã thi · chờ KQ · SOS n; cột cuối = nút-chip KHÔNG biểu tượng (loại + số, quá hạn ⚠ + màu); em có việc trên, em chỉ có tình trạng dưới vạch, em còn lại gập "n em khác"; ô "Tìm em" | THÊM (R4.3) |
| #k1 | Chip Báo PH / Sau thi / Chốt ngày thi → mở panel ở khung phải; "Bổ sung hồ sơ ›" → đổi trang | 5.3, lời 20 ý 3 | — | như mockup ① | THÊM |
| #k2 | Panel Báo PH: loại · tên + hạn · em · lớp · ⋯ (Bỏ việc…) · dải ① Vi phạm ② GVCN xử lý ③ TVV báo PH · Hạn + Sửa hạn · bối cảnh chỉ đọc · Kết quả · Ngày · Nội dung · Lịch sử · Lưu / Lưu · việc tiếp › | Y-14, Y-15, Y-16 | `PanelBaoPhTvv` | giữ đủ; em + lớp ở đầu panel là link; TVV không có nút sửa vi phạm | GIỮ |
| #k2 | **Dòng quy chế** đổi theo Kết quả: "Hạn 5 ngày · GV của lớp đọc được nội dung" ↔ "Chưa liên hệ được: việc còn mở, hạn giữ"; Tình hình học tập: "Hạn 5 ngày · lưu xong GV … nhận chuông" | Y-14, Y-15, D5 | không có | một dòng 13 px trên chân, ⓘ cuối dòng (mẫu ①) | THÊM (R4.4) |
| #k2 K2c | Việc Báo PH · Tình hình học tập: khối nội dung GV gửi thay dải ①②③ | Y-17 | có (v20 C2) | giữ | GIỮ |
| #k3 | Panel Sau thi hai bước (KQ L R W S + Overall máy tính · Không thi · Lưu điểm → Bước tiếp Tạm dừng/ Kết thúc học · Lộ trình mới) | L-20, L-21, E5 | `PanelSauThi` | giữ; dòng quy chế đổi theo bước / lựa chọn | GIỮ + THÊM dòng quy chế |
| #k3 K3c | Panel Chốt ngày thi: Ngày thi · Dời tháng dự kiến + ô ngày gõ được + nút lịch | L-19 | có | giữ + dòng quy chế | GIỮ |
| #k4 | **+ Task** → một mục "Hỏi tình hình học tập" → ô chọn có tìm (HV của tôi → Cùng chi nhánh) → hộp Hỏi tình hình (GVCN, 3 ngày) | Y-18, D5 | chỉ ở hồ sơ HV (v20 F1) | thêm một cửa ở trang đầu; lối cũ ở hồ sơ HV giữ | THÊM (R4.5) |
| #k5 | Ô "Báo PH đúng hạn" → panel số (cùng nguồn `/tong-quan/tvv/o?o=bao-ph`) ở khung phải | Y-14 | panel từ ô số Tổng quan | cùng panel, mở tại chỗ thay HV của tôi; ✕ trả lại | GIỮ đích, đổi chỗ mở |
| #k6 | Hết việc tab · tìm em (có / không thấy) · TVV mới chưa có em · đang tải · lỗi riêng từng phần | — | Empty / Skeleton / ErrorState | giữ dáng ①; lỗi tách 3 phần | GIỮ / THÊM |
| #k7 | 375: thanh dưới 3 mục · dải số 2 cột · công tắc "Việc · HV của tôi" · dòng chạm cả dòng · "+ Task" nút tròn · thẻ em chip cao 44 · panel toàn màn "‹ Quay lại" | — | thanh dưới 4 mục (có Tổng quan), danh sách chạm | như ① | ĐỔI |
| — | Link "HV của tôi ›" đầu Tổng quan TVV | A5 | có | BỎ — HV của tôi đã nằm ngay trang đầu; menu Học viên & Lớp của TVV mặc định "HV của tôi" (như nay) | BỎ / CHUYỂN |

## 2. Bảng thao tác TRƯỚC → SAU (Tổng quan TVV + Công việc TVV)

| Thao tác hiện có | Ở đâu (trước) | Sau v21 | Ghi chú |
|---|---|---|---|
| Mở trang đầu | Tổng quan TVV | Công việc | R4.1 |
| Bấm "Việc của tôi ›" | Tổng quan | ô "Việc" của dải — đã ở Công việc nên không bấm | [XM-1] |
| Bấm "Báo PH đúng hạn" → panel số | Tổng quan | cùng panel, mở ở khung phải Công việc | K5 |
| Bấm Thi tháng này / Chờ KQ thi thật / Chưa chốt lộ trình tiếp → Học viên & Lớp (chip lọc) | Tổng quan | giữ đích, "›" | [XM-2] |
| ⓘ giải thích Báo PH đúng hạn, Thi tháng này | Tổng quan | giữ trong dải | |
| Link "HV của tôi ›" | Tổng quan | khung HV của tôi ở trang đầu + menu Học viên & Lớp | |
| Chọn tab hạng mục, xem badge | Công việc | giữ | |
| Lọc hạn (Mọi hạn), Lọc thêm | Công việc | giữ | Lọc thêm không vẽ |
| Bấm dòng việc → panel tại chỗ (Ghi báo PH · Ghi KQ · Cập nhật KQ · Chọn bước tiếp · Chốt ngày) | Công việc | giữ | |
| "Bổ sung ›" (việc tổng) → Học viên & Lớp lọc Thiếu thông tin | Công việc | giữ | |
| Báo PH: Kết quả · Ngày · Nội dung · Sửa hạn · gọi PH · ⋯ Bỏ việc… · Khôi phục · Lịch sử · Lưu · Lưu · việc tiếp › · Hoàn tác | panel Báo PH | giữ hết | |
| Sau thi: nhập L R W S · Không thi · Lưu điểm · Sửa điểm · Bước tiếp · Lộ trình mới › · Hoàn tác · Lịch sử | panel Sau thi | giữ hết | |
| Chốt ngày thi / Dời tháng dự kiến | panel Chốt ngày thi | giữ | |
| Hỏi tình hình học tập | hồ sơ HV | thêm "+ Task" ở trang đầu; lối cũ giữ | R4.5 |
| Xem em của mình: lớp, SOS, lịch thi, việc | Học viên & Lớp | thêm ở trang đầu (HV của tôi); trang HV & Lớp giữ | R4.3 |
| Việc tiếp › (chân panel / thẻ hết việc) | Công việc | giữ | |

Không thao tác nào bị mất.

## 3. [XM] — chỗ phải tự đoán

1. **[XM-1] Ô "Việc"** đứng đầu dải (R4.2 đòi 5 ô) nhưng trang đang là Công việc → ô không bấm; số = "n việc · ⚠ m quá hạn" cũ ở đầu trang (bỏ khỏi đầu trang để không lặp). Cùng hàm `demDongViec`, = badge menu khi không có việc hôm nay.
2. **[XM-2] Ba ô "›"** giữ đích đổi trang như nay (R4.2 "như nay"). Đề xuất để sau (không vẽ): bấm thì lọc ngay HV của tôi bên phải — làm tại chỗ, đỡ một lần chuyển trang.
3. **[XM-3] HV của tôi dài** (TVV thật ~37 em): em không việc, không tình trạng gập "n em khác" (dáng gập `details`); ô tìm tìm cả nhóm gập. Đề bài ghi "mỗi em một dòng" — gập là chủ ý để không đẩy em có việc xuống; nếu chủ SP muốn hiện hết thì bỏ gập.
4. **[XM-4] Chip "Bổ sung hồ sơ ›"** không có số: việc Bổ sung hồ sơ là MỘT dòng tổng ("4 em"), không có việc riêng từng em; chip đổi trang sang hồ sơ em (Sửa thông tin). Các chip khác có số (Báo PH · 1…) như ①.
5. **[XM-5] Thứ tự chip** = thứ tự tab TVV (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ); chip "Báo PH" gồm cả "Báo PH · Meeting CX/GĐCN" (mục Phối hợp SOS, cùng tab — như `nhomViecTvvCua`).
6. **[XM-6] "+ Task" một mục** vẫn mở menu (cùng một kiểu với GV, chừa chỗ thêm mục). Cách ít bấm hơn: bấm "+ Task" đi thẳng vào bước chọn em — chủ SP chọn.
7. **[XM-7] Ô chọn em** vẽ theo dáng gợi ý của ① (mẫu ⑤ chưa duyệt): nhóm "HV của tôi" trước, "Cùng chi nhánh" sau, dòng phụ lớp · GVCN. Y-18 cho TVV hỏi "từng em" — giả định TVV hỏi được em cùng chi nhánh không phải của mình; nếu chỉ em của mình thì bỏ nhóm thứ hai. TVV mới chưa có em (K6d) vẫn có "+ Task" vì lý do này.
8. **[XM-8] "Em chưa có TVV / TVV khác → không hiện"** hiểu là: HV của tôi chỉ gồm em có TVV = tôi (cùng tập `phamVi=cua-toi`); em chưa có TVV do QL giữ việc (`chuViecTvv`), em của TVV khác không hiện kể cả khi gõ đúng tên (K6c).
9. **[XM-9] Tình trạng** chỉ ba loại đề bài nêu (Thi dd/mm khi đã chốt ngày trong tháng · Đã thi · chờ KQ · SOS n — dùng đúng chip lọc của Học viên & Lớp). Em chưa chốt ngày không ghi tình trạng (chip "Chốt ngày thi" đã nói).
10. **[XM-10] Dòng quy chế** (≤ 90 ký tự, từ `luat/3` mục 4, `luat/4` L-19–L-21): Báo PH "Hạn 5 ngày · GV của lớp đọc được nội dung" / "Chưa liên hệ được: việc còn mở, hạn giữ" · Tình hình học tập "Hạn 5 ngày · lưu xong GV … nhận chuông" · KQ thi thật "Overall máy tính · có KQ thì chọn bước tiếp trong 7 ngày" · Bước tiếp Lộ trình mới "Lộ trình mới: Target giữ · đầu vào = KQ thi thật · Case cũ đóng" · Tạm dừng/ Kết thúc học "Em vào Lưu trữ · Tạm dừng giữ lớp, dừng mọi hạn" (không vẽ riêng) · Chốt ngày thi "Hôm sau ngày thi bạn có việc Cập nhật KQ thi thật". Mẫu ⑤ soạn bảng câu chung — khi khác thì theo ⑤.
11. **[XM-11] "Lọc thêm"** (đang có ở Công việc TVV) không vẽ trong khung cho gọn; giữ khi code.
12. **[XM-12] Tab 375** ghi "Bổ sung" (đủ 4 tab một hàng, `aria-label` đủ tên) — như ① rút "Ý thức", "Case" ở 375.
13. **[XM-13] Turso** — HV của tôi cần: em của TVV (lớp, SOS, lịch thi) + việc từng em. Việc: các dòng `/my-work` đã nạp (`studentId`, `group`, `urgency`). Danh sách em: hiện Tổng quan TVV gọi `/tong-quan/tvv` + `/tong-quan/hoc-vien`; trang đầu mới thay Tổng quan nên đề xuất một đường đọc em của TVV (đi chỉ mục `idx_student_consultant`, ~40 dòng) thay hai đường đó → không thêm request khi mở trang đầu. Đo ở plan PR.
14. **[XM-14] Bóng** — chỉ menu thả, hộp nổi, nút tròn 375 (như ①).

## 4. Tự rà R4.1–R4.6 + luật chung

| R | Đạt / Chưa | Khung |
|---|---|---|
| Lời 20: chip không biểu tượng, một hàng, ⚠ khi quá hạn | Đạt (mỗi em tối đa 2 chip, một hàng ở 1440) | #k1, #k6 K6a, #k7 K7b |
| Lời 20: "+ Task" | Đạt | #k1, #k4 |
| Lời 24: dòng việc một dạng "Lớp · tên việc ngắn", tên em là thẻ phụ | Đạt | #k1, #k7 K7a |
| Lời 20: bấm việc → panel / đúng trang | Đạt (chip, dòng việc, ô số) | #k1, #k5 |
| Luật chung: 1440 + 375, Sáng + Tối, rỗng / tải / lỗi / không quyền | Đạt (không quyền: TVV chỉ xem vi phạm, không nút sửa — K2; em TVV khác không hiện — K6c) | #k1–#k7 |
| Luật chung: chữ ngắn, không chú thích tĩnh (trừ dòng quy chế) | Đạt | mọi khung |
| Luật chung: ô chọn người / em = ô chọn có tìm, mục liên quan trước | Đạt ([XM-7]) | #k4 K4b |
| R4.1 Trang đầu = Công việc; menu Công việc · Học viên & Lớp · Phân tích; tab TVV giữ, tab rỗng ẩn | Đạt | #k1, #k6 K6d |
| R4.2 Dải mỏng 5 chỉ số, ô bấm như nay, không khối to | Đạt ([XM-1], [XM-2]) | #k1, #k5 |
| R4.3 HV của tôi: tên link · lớp · tình trạng · Việc cần làm (chip); em có việc trên; ô tìm em | Đạt ([XM-3], [XM-9]) | #k1, #k6 K6b / K6c |
| R4.4 Panel giữ dáng (Báo PH: Đã báo PH / Chưa liên hệ được + một ô Nội dung; Bước tiếp; KQ thi thật) + dòng quy chế | Đạt | #k2, #k3 |
| R4.5 "+ Task": Hỏi tình hình học tập (→ GVCN, 3 ngày), một mục, chọn em | Đạt ([XM-6]) | #k4 |
| R4.6 375 + trạng thái: hết việc, em chưa có TVV / TVV khác không hiện, đang tải, lỗi | Đạt | #k7, #k6 |

Đã nạp ngữ cảnh impeccable (layout, clarify), tự rà phân cấp và chữ; chưa chạy critique chấm điểm.
