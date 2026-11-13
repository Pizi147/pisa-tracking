# v21 · Hồ sơ lớp (mockup ②) — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/ho-so-lop.html` (+ `v21.css` chỉ đọc, + `ho-so-lop.css` phần mới). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/06-de-bai-mockup-2-5.md` mục ② (R2.1–R2.10) + "Luật chung cho cả bốn mockup".
Ảnh: `thiet-ke/v21/anh/ho-so-lop/k{1..8}{a..g}-{toi|sang}.png` (24 khung × Tối / Sáng, chụp bằng chrome-headless-shell có sẵn trong máy, phông Be Vietnam Pro + Inter đã nạp).
Soát tự động cả hai chế độ: không phần tử nào tràn khỏi vùng nội dung, không chữ bị cắt, không chữ < 12 px (thanh tab 375 cuộn ngang như web hiện tại — có chủ ý).
Bấm thử ở K1 (đã chạy thử, không lỗi JS): chip Việc cần làm → ngăn dòng việc → panel; ✕ / bấm nền đóng panel · "+ Task" · ⋯ dòng em · dòng GV mở đủ · gập Case dưới hàng.
Màn hiện tại đã xem trên web chạy thật (seed 14/09, GVCN / GVBM / QL, FT + lớp thường, 1440 + 375).
Dữ liệu bịa, cùng bộ với mockup ①: GVCN Đinh Thu Hằng chủ nhiệm MB FT 101, dạy L + R; "Việc cần làm · 5" ở K1 khớp dòng MB FT 101 của "Lớp của tôi" (①).

## 1. Bảng truy vết khung → thành phần → luật / việc → TRƯỚC → SAU

| Khung | Thành phần | Phục vụ | Trước (web / mockup đã duyệt) | Sau (v21) | Loại |
|---|---|---|---|---|---|
| #k1 | Hàng ① "‹ Học viên & Lớp" + lớp trước / sau | Quay lại về đúng nguồn | hàng riêng trên cùng (ThanhTruocSau) | gộp vào hàng 1: "‹ nguồn" trước mã lớp, "‹ 1/2 ›" cuối hàng sau vạch | ĐỔI chỗ (R2.1, giữ thao tác) |
| #k1 | Hàng 1: mã lớp + chip Fast Track · sĩ số · tuần + nút | R2.1 | mã + chip + badge + nút | mã + chip + nút; badge xuống dải số | ĐỔI (R2.1) |
| #k1 | Nút **Nhập điểm** | B3, A4, R2.2 | luôn hiện khi `canEnterScores` | chỉ người có ô nhập ở lớp hoặc quyền nhập hộ (QL, Admin) | GIỮ / làm rõ điều kiện (K3) |
| #k1 #k4 | Nút **+ Task** (Case · Vi phạm / Nhắc nhở · Tình hình học tập), nút chính như ① | D1, D5, C (Case tay), 5.4 / 12 | nút "+ Case"; Ghi vi phạm, Báo tình hình ở tab Ý thức | một nút, điền sẵn lớp, chọn em trong lớp; nút cũ ở tab Ý thức GIỮ | ĐỔI (R2.2) |
| #k1 | ⋯ đầu trang (`menuHoSoLop`) | A3, A4, E | có | giữ nguyên mục, thứ tự | GIỮ |
| #k1 | Hàng 2: GV theo kỹ năng **một dòng** gộp theo người ("GVCN, L, R Đinh Thu Hằng │ S … │ W1 … │ W2 … │ TVV …" + ⌄); bấm cả dòng mở bản đủ (ô nhãn trên – tên dưới của web) | A1–A3 | ô nhãn trên – tên dưới (2 dòng chữ), hẹp thì "+k" | thu gọn 1 dòng 13 px; bản đủ giữ dáng cũ (K3a); 375: "+4 người ⌄" | ĐỔI (R2.1) |
| #k1 | **Dải số mỏng**: Lượt mới nhất · Đạt MT ⓘ · SOS + chip mức │ badge phạm vi lớp "›" (chờ chấm · việc quá hạn của lớp · chờ duyệt · Final Test tuần này · chưa chốt lộ trình) | B5, C1, R2.1 | ô số 2 dòng chữ + badge ở hàng tiêu đề | một dải cao 38 px, đủ số, badge cùng đích cũ; nhiều badge thì xuống dòng trong dải (K3b) | ĐỔI (R2.1 — không mất số nào) |
| #k1 #k2 | Dải **Việc cần làm** (thay "Việc của tôi"): nút-chip theo loại, không biểu tượng, ⚠ khi có việc quá hạn, thứ tự Nhập điểm · Case · Ý thức · Vận hành; không Chấm Speaking | A7, 13 (lời 20), R2.3 | tối đa 3 ô việc + "+n việc ở Công việc ›" | chip → ngăn dòng việc ① dưới dải → bấm dòng mở panel việc tại trang; bỏ "+n việc ở Công việc ›" | ĐỔI (R2.3) |
| #k2 | Panel việc (PanelViec / KhungPanel rộng 720, phủ trang) + **dòng quy chế** + "Việc tiếp ›" | C4–C6, lời 5 | panel tại trang, không dòng quy chế | thêm dòng quy chế theo mẫu ① | ĐỔI nhỏ (5.3) |
| #k1 | Thanh 4 tab (Học viên · Ý thức & Phối hợp • · Phân tích lớp · Báo cáo PH [chip đợt]) | R2.4 | có | giữ | GIỮ |
| #k1 | Bảng Học viên: Tổng hợp / Kết quả đầu ra (Thông tin lớp: Admin / TVV / CX như cũ), lọc Tất cả · SOS · Chưa đủ dữ liệu, cột điểm ✓ ✗, Kết quả, Ngày thi, ⋯ | B5, C1, R2.4 | có | giữ; "TVV …" dưới tên chỉ khi khác TVV chính của lớp (M3) | GIỮ |
| #k1 | Case mở dưới hàng (⌄ cạnh tên) | C3, C4 | có | giữ; mũi tên mở dòng là ⌄ (không dùng "›" — "›" = đổi trang) | GIỮ |
| #k4 | ⋯ dòng em | A2, A3, R2.4 | + Case · + Ghi vi phạm · Xác nhận xử lý · Nhập điểm {đợt} │ Sửa thông tin · Cuối khoá… · Chuyển lớp… / Đề xuất chuyển lớp… · Mở hồ sơ | nhóm **+ Task**: Case · Vi phạm / Nhắc nhở · Tình hình học tập │ Xác nhận xử lý · Nhập điểm {đợt} │ việc hiếm │ Mở hồ sơ | ĐỔI (R2.4) |
| #k1 | Khối gập "Điểm Mock Test của lớp" | B7 | có | giữ | GIỮ |
| #k5 | Đầu tab Báo cáo PH: ô chọn đợt · hạn · "bạn còn n / m em" · "Cả lớp đủ n / m em" | D7, lời 12–16, R2.5 | ô chọn đợt + "n/m em đủ" | thêm hạn + phần của bạn; đợt tương lai "sắp mở {ngày}" | ĐỔI (R2.5) |
| #k6 | Lớp thường: cột điểm theo môn (FOU: L · R · G+V · P; Progress / Final, %), Lộ trình tiếp theo | B2, C7, E2, R2.7 | có (#1268) | cùng khung FT | GIỮ |
| #k6 | Dải Cuối khoá (Chốt lộ trình · Bàn giao môn) | E2, E3 | có (DaiLopChuyen) | giữ, ngay dưới dải số | GIỮ |
| #k6 | Khối gập **"Đã chuyển · đang bổ trợ · n em"** dưới bảng | A7, C7, GV-CU-BO-TRO | dòng "Đã chuyển · đang bổ trợ ›" lẫn trong bảng (lớp thường) | gom thành khối gập: em · lớp mới · PA bổ trợ · buổi · Mini Test · "Hồ sơ HV ›" | ĐỔI (R2.6) |
| #k7 | Rỗng · đã kết thúc (tab Tổng kết) · GV cũ chỉ xem (đổi GV / bổ trợ) · đang tải · lỗi · không có quyền | E7, R2.10 | có (Empty, DaiChiXem, DaiChuyenLop, Skeleton, ErrorState) | giữ dáng, chữ một câu ở đầu khung (M7) | GIỮ |
| #k8 | 375: một cột, Nhập điểm + ⋯ cao 44, **"+ Task" nút tròn nổi**, thanh tab dưới, bảng thành thẻ | R2.9 | 375: nút chia đều, "+n việc ở Công việc ›" | như ① | ĐỔI |

## 2. Bảng thao tác TRƯỚC → SAU (hồ sơ lớp)

| Thao tác hiện có | Trước | Sau v21 | Ghi chú |
|---|---|---|---|
| Quay lại nguồn · lớp trước / sau | hàng riêng | hàng 1 | giữ đích |
| Nhập điểm (panel nhập điểm của lớp) | nút đầu trang | giữ; ẩn với người không có ô và không có quyền nhập hộ | R2.2 |
| + Case | nút đầu trang | "+ Task" › Case | R2.2 |
| Ghi vi phạm · Báo tình hình | tab Ý thức (nút) | "+ Task" ở đầu trang + nút cũ ở tab Ý thức GIỮ | 5.4 |
| ⋯ đầu trang (Thông tin lớp, + Học viên, Lộ trình, Xuất Excel, Lịch sử, Mở lại / Xoá / Kết thúc) | ⋯ | giữ | |
| Bấm tên GV → hồ sơ GV | hàng GV | bấm dòng GV mở bản đủ, tên trong bản đủ là link | [XM-3] thêm một bấm |
| Badge "n bài chờ chấm ›", "n việc quá hạn của lớp ›", "n chờ duyệt ›", "Thiếu GV", "Thiếu n thông tin", "+n" | hàng tiêu đề | dải số, cùng đích | R2.1 |
| ⓘ Cách tính Đạt | hàng số | dải số | |
| Mở việc của tôi (3 ô) → panel tại trang | dải Việc của tôi | chip loại → dòng việc → panel tại trang | R2.3 |
| "+n việc ở Công việc ›" | dải | BỎ — ngăn chip đã đủ việc của tôi ở lớp | R2.3 "không lặp lối tắt" |
| Việc tiếp › trong panel | có | giữ | |
| Đổi tab · chế độ xem · lọc · Chọn nhiều (QL) | có | giữ | |
| Mở Case dưới hàng · Ghi kết quả · Sửa · Lịch sử | có | giữ | |
| ⋯ dòng em: + Case, + Ghi vi phạm | menu dòng | nhóm "+ Task": Case · Vi phạm / Nhắc nhở · Tình hình học tập (mới ở dòng) | R2.4 |
| ⋯ dòng em: Xác nhận xử lý · Nhập điểm {đợt} · Sửa thông tin · Cuối khoá… · Chuyển lớp… / Đề xuất… · Mở hồ sơ | menu dòng | giữ, cùng thứ tự | |
| Mở / gập "Điểm Mock Test của lớp" | cuối trang | giữ | |
| Báo cáo PH: chọn đợt, viết ô của mình, Không báo cáo đợt này, + Đợt báo cáo, Xuất PDF / Excel | tab | giữ (theo quyền); đầu tab thêm hạn + "bạn còn" | R2.5 |
| Bàn giao (Mở phiếu · Ghi bàn giao · Đọc bàn giao · Bàn giao · n/m em) | dải lớp | giữ | |
| Em đã chuyển còn bổ trợ → hồ sơ HV | dòng trong bảng | khối gập dưới bảng | R2.6 |

Không thao tác nào bị mất.

## 3. [XM] — chỗ phải tự đoán

1. **[XM-1] Chip "Việc cần làm" mở ngăn dòng việc, không mở thẳng panel.** R2.3 ghi "nút-chip + dòng việc của ①; bấm = mở panel việc tại trang". Tôi đọc: chip → ngăn dòng việc (thấy việc gì, em nào, hạn nào) → bấm dòng = panel tại trang (không đổi trang). Chip một việc cũng mở ngăn (một kiểu cho mọi chip). Nếu chủ SP muốn một bấm: chip mở thẳng panel việc đầu + "Việc tiếp ›".
2. **[XM-2] Badge "n việc quá hạn của lớp ›" với GV** — máy chủ đếm việc của chính GV (`soQuaHanLop`), nên cùng số với các chip ⚠ ở Việc cần làm (K1: 3 = Nhập điểm 2 + Case 1) — hai chỗ nói một điều (M3). Mockup giữ (không mất số), đề xuất bỏ badge này với GV, giữ cho QL (cả lớp).
3. **[XM-3] Dòng GV thu gọn là MỘT nút** (mở bản đủ). Tên GV ở dòng thu gọn không còn là link hồ sơ GV; link nằm ở bản đủ (thêm một bấm). Gộp theo người: "GVCN, L, R Đinh Thu Hằng" (logic `nhomGiaoVienBoMon` đã gộp theo người).
4. **[XM-4] "+ Task" là nút chính (nền đậm)** như ①; "Nhập điểm" là nút thường. Lời 4 muốn "Nhập điểm" luôn thấy rõ — nút vẫn ở đầu hàng; nếu chủ SP muốn Nhập điểm nổi hơn thì đổi hai kiểu cho nhau.
5. **[XM-5] Badge xuống dải số.** R2.1 hàng 1 chỉ có mã + chip + nút, nên badge phạm vi lớp (MOCKUP-1111 đưa lên hàng tiêu đề) xuống cuối dải số, vẫn tách khỏi "Việc cần làm".
6. **[XM-6] Ngày ở K5** là thứ Hai 21/09 (đợt tháng 9 mở từ ngày 20); khung khác 14/09. Đợt "Giữa kỳ" mở 05/10 là đợt QL thêm (bịa). Bảng đợt chưa mở: ô "–" không bấm, không thêm câu.
7. **[XM-7] Bước chọn em của "+ Task" ở hồ sơ lớp** chỉ có nhóm "Lớp này" (điền sẵn lớp — R2.2); dòng phụ là tình trạng em (SOS / Đạt / Thiếu). Muốn ghi cho em lớp khác thì dùng "+ Task" ở trang Công việc.
8. **[XM-8] GV cũ chỉ xem (R2.10)** vẽ hai nghĩa: (K7c) GV cũ sau đổi GV — dải "Chỉ xem · … còn xem tới …" đang có; (K7d) GV cũ dạy bổ trợ xem lớp MỚI của em (GV-CU-BO-TRO) — dải "Chỉ xem · Bạn dạy bổ trợ …" là chữ MỚI, cần PTA chốt. Cả hai: không Nhập điểm, không + Task, không ⋯ dòng.
9. **[XM-9] Lớp đã kết thúc**: GVCN không có "+ Task" (không còn em đang học); QL vẫn sửa điểm như cũ (HL-10) — không vẽ khung QL.
10. **[XM-10] Panel việc ở hồ sơ lớp** vẽ theo `KhungPanel` rộng 720 phủ trang (lớp mờ) như web hiện tại — khác khung phải cố định của ①; cùng thành phần panel + dòng quy chế.
11. **[XM-11] Turso:** không thêm request. Chip Việc cần làm + ngăn dòng việc đọc từ `viec-theo-em?chi=toi` đã tải (`dongToi`); "bạn còn n / m em" tính từ dữ liệu tab Báo cáo PH đã nạp; khối "Đã chuyển · đang bổ trợ" cần máy chủ trả trong `/roster` (đã có cờ cho dòng hiện tại).

## 4. Tự rà R2.1–R2.10 + luật chung

| R | Đạt / Chưa | Khung |
|---|---|---|
| R2.1 hai hàng + dải số mỏng, không mất số | Đạt (XM-3, XM-5) | #k1, #k3 (K3a bản đủ), #k8 |
| R2.2 "+ Task" + "⋯"; Nhập điểm theo người có ô / nhập hộ; GVCN không dạy → không nút | Đạt | #k1, #k3 (K3a GV bộ môn · K3b GVCN chỉ chủ nhiệm · K3c QL), #k4 K4a–K4b |
| R2.3 "Việc cần làm" nút-chip + dòng việc ①, mở panel tại trang, bỏ "+n việc ở Công việc" | Đạt (XM-1) | #k1, #k2 K2a–K2b, #k8 K8b |
| R2.4 4 tab · bảng · lọc SOS · ✓ ✗ · ⋯ dòng nhóm "+ Task" · khối điểm · trước / sau | Đạt | #k1, #k4 K4c |
| R2.5 đầu tab Báo cáo PH: "Tháng 9 · hạn 30/09 · bạn còn 21 / 33 em" · lớp thường "Progress W3 SEP · hạn 22/09" · "sắp mở {ngày}" | Đạt (XM-6) | #k5 K5a–K5c, #k8 K8c |
| R2.6 khối gập "Đã chuyển · đang bổ trợ · n em" dưới bảng | Đạt | #k6 |
| R2.7 lớp thường cùng khung, cột theo môn, dải Cuối khoá giữ | Đạt | #k6, #k3 K3b |
| R2.8 M1–M10 | Đạt — một chữ đậm mỗi dòng (tên em / mã lớp); chip nền nhạt cho lượt / tuần; hạn là viên tròn theo mức; SOS chip vuông viền; không lặp lớp trong ngăn việc (M3), "TVV …" chỉ khi khác TVV chính; không chú thích tĩnh | #k1, #k2, #k6 |
| R2.9 375 một cột, "+ Task" nút tròn, bảng thẻ | Đạt | #k8 K8a–K8d |
| R2.10 lớp chưa có em · đã kết thúc (tab Tổng kết) · GV cũ chỉ xem | Đạt (XM-8, XM-9) | #k7 K7a–K7d |
| Luật chung: chip không biểu tượng, không Chấm Speaking, Báo cáo PH trong "Vận hành", "+ Task", tên bịa, đang tải / lỗi / không có quyền, 1440 + 375, Sáng + Tối | Đạt | #k1, #k5 (chip Vận hành), #k7 K7e–K7g, ảnh `anh/ho-so-lop/` |

Skill: `impeccable` (nạp ngữ cảnh, rà `clarify` chữ trạng thái lỗi / rỗng / không quyền, `layout` một vòng ảnh 1440 + 375 hai chế độ); CHƯA chạy critique chấm điểm.
