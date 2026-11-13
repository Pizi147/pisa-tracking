# v21 · Hồ sơ học viên (mockup ③) — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/ho-so-hv.html` (+ `v21.css` chỉ đọc, + `ho-so-hv.css` phần riêng). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/06-de-bai-mockup-2-5.md` — "Luật chung" + mục ③ (R3.1–R3.9).
Ảnh: `thiet-ke/v21/anh/ho-so-hv/{khung}-{toi|sang}.png` — 24 khung × 2 chế độ, chụp bằng chrome-headless-shell có sẵn (CDP, không cài gói); phông Be Vietnam Pro + Inter đã nạp (`document.fonts.check` = true). Soát tự động mọi khung, cả Sáng và Tối: không phần tử tràn ngang khung, không chữ bị cắt, không chữ < 12 px.
Nền đã xem: web thật (`main` 45a1a3a79, seed demo, GV Trần Ngọc Hà, hồ sơ Lý Minh Châu — 3 tab, ⋯ của GVCN, form Ghi kết quả) · `v18/ho-so-hv.html` · `v16/case-pa.html` · `v19/y-thuc.html` · `v20/tinh-hinh.html` · mockup ① `trang-dau-gv.html`.
Dữ liệu bịa, hôm nay thứ Hai 14/09/2026 · W3 SEP (cùng ①). Mã luật (cột "Phục vụ") theo `luat/0-luat-core-mot-trang.md`.

## 1. Bảng truy vết khung → thành phần → luật / việc → TRƯỚC → SAU

| Khung | Thành phần | Phục vụ | Trước (web / mockup đã duyệt) | Sau (v21) | Loại |
|---|---|---|---|---|---|
| K1 | Trước / Sau em, "‹ Học viên & Lớp" | — | có | giữ | GIỮ |
| K1 | Tên + chip trạng thái | E6, E7 | có | giữ | GIỮ |
| K1 K4 K5 | Nút đầu hồ sơ **+ Task** (Case · Vi phạm / Nhắc nhở · Tình hình học tập), em điền sẵn | A2, D1, D5, C | "+ Case" một nút; Ghi vi phạm / Báo tình hình ở tab Ý thức | một menu 3 mục theo thứ tự chủ SP (lời 17); không bước chọn em | ĐỔI (R3.1) |
| K1 K5 K6 | "⋯" theo vai (`mucQuanLyHocVien`) | A3–A5 | có | giữ đủ mục, đúng thứ tự (K5 vẽ menu GVCN) | GIỮ |
| K1 | Dòng thông tin (Lớp · Lộ trình · Target · Tuần học · Thi thật · GVCN · TVV) + liên hệ | E1 | có (U02) | giữ; ô cách nhau bằng vạch dọc | GIỮ |
| K1 | 6 ô điểm + dòng nguồn "Mock Test gần nhất · MT2 · W2 SEP" | B5 | v18 HS1 | giữ (Overall · L chưa có điểm; ✓ ✗ + màu) | GIỮ |
| K1 K4 K8 | **Việc cần làm** = dòng việc chuẩn ① (tên việc · thẻ phụ · viên hạn · nút) trong một thẻ nhóm; 1440 hai cột dòng, 375 một cột chạm cả dòng | A7, B3, C4, D2, D5 | "Việc của tôi · n" ô 40 px, tối đa 3 + "n việc khác"; thiếu Nhập điểm, Tình hình | ĐỦ việc của người xem với em (thêm **Nhập điểm**, **Trả lời tình hình học tập**); quá hạn lên đầu; không lối tắt "+n" | ĐỔI (R3.2) |
| K2 K4c K8b | Bấm dòng việc → **panel việc** nổi bên phải, nền mờ; ✕ / Esc / bấm nền trả về chỗ cũ | §5.3, lời 20 ý 3 | Case → mở cột Case tại chỗ; Ý thức → nhảy sang tab | cùng panel việc với Công việc (①); không nhảy tab | ĐỔI (R3.2) |
| K2b | Panel Nhập điểm = lưới lớp × tuần của việc, dòng em đang xem tô sẵn | B3, B6, B7 | không có lối từ hồ sơ | panel ① K2 | THÊM |
| K1 | 3 tab Học thuật · Ý thức & Phối hợp · Lộ trình & lớp | — | có | giữ (dáng tab của ①) | GIỮ |
| K1 | Bảng Mock Test (MT ›, lớp lúc đánh giá, tuần, 5 kỹ năng + OVR, kỳ vọng, kết quả) | B5, C1 | có | giữ | GIỮ |
| K1 | **Tiến độ trên lớp │ Case & phương án** (5 : 7) | chủ SP 10/11 | v18 HS2 | giữ: Tiến độ trái, Case phải; Case của tôi mở sẵn, Case người khác gập | GIỮ (R3.3) |
| K1 | Trong Case: Phụ trách · Điểm · Nguyên nhân ▾ · Mô tả ✎ · thẻ PA (nút trạng thái "Ghi kết quả") · Kết luận (Hoàn thành Case mờ + lý do tại nút + ⓘ, Không cần theo dõi…) · Lịch sử · Bằng chứng · Đề nghị QL xoá Case | C3–C6, N37 | v16 bấm thẳng | giữ nguyên dáng v16 | GIỮ (R3.3) |
| K3 K2a | **Dòng quy chế** ở 4 form Case: Mô tả · Chọn PA · Ghi kết quả · Hoàn thành — đổi theo lựa chọn | C4, C5, C6 | có form ghi luật tại chỗ, có form không | một mẫu (`.quy-che`), trên nút của form / trên chân panel | THÊM (R3.4) |
| K4 | Tab Ý thức: **một khối của chính em** — thanh bậc + nút tab · 4 cột Ngày · Vấn đề · Đã xử lý · Bước đang làm · "Đang chờ" trên · **Lịch sử tại khối** | D1–D6 | v20 A4: "Đang chờ" + khối rời "Cả quá trình" (lọc ở đầu khối) | đồng bộ tab lớp v19 (khối em, "Xem lịch sử · n"); lọc loại · Lộ trình \| Cả lịch sử · Mọi nhóm vào trong phần Lịch sử | ĐỔI (R3.5) |
| K4b | 2 tab nhỏ Tình hình học tập / Ý thức · Phối hợp SOS; xác nhận tại dòng | C8 | v20 | giữ | GIỮ |
| K5 | GVCN, em chưa có Target: "Chưa có" màu nhắc + **Đề xuất sửa** ở ô Target | A3, 2.3 | việc "Điền Target" (GVCN không sửa được) | nhắc tại dòng thông tin, không phải việc | ĐỔI (R3.6) |
| K6 | Người chỉ xem: giá trị chữ thường, không nút sửa; một câu "ai làm được" tại chỗ | A2, A5 | không quyền: giá trị chữ thường | + một câu; TVV "+ Task" một mục Hỏi tình hình học tập | ĐỔI nhỏ (R3.7) |
| K7 | Tạm dừng (dải vàng + Quay lại học) · Lưu trữ (dải chỉ xem + Quay lại học nút chính) · chưa có điểm (thẻ "—", hai thẻ rỗng gọn) · đang tải · lỗi | E6, E7 | có | giữ dáng; "+ Task" có ở em lưu trữ (như "+ Case" nay) | GIỮ (R3.9) |
| K8 | 375: Case trước Tiến độ, MT thành dòng thẻ, tab dưới, **nút tròn "+ Task"** (menu bật trên nút) | — | 375 hiện tại | như nay + nút tròn | ĐỔI nhỏ (R3.8) |

## 2. Bảng thao tác TRƯỚC → SAU (hồ sơ học viên)

| Thao tác hiện có | Ở đâu (trước) | Sau v21 | Ghi chú |
|---|---|---|---|
| ‹ Học viên & Lớp · em trước / sau | đầu trang | giữ | |
| + Case | nút đầu hồ sơ | "+ Task" → Case (cùng form, em điền sẵn) | 1 bấm → 2 bấm — [XM-2] |
| Ghi vi phạm / nhắc nhở · Báo tình hình | tab Ý thức | giữ ở tab + thêm cửa "+ Task" | 5.4 "nút cũ giữ" |
| ⋯ (Sửa thông tin · Tạm dừng/ Kết thúc học · Lịch MT · Đề xuất chuyển lớp… · Kết quả thi thật · Lịch sử · Đề xuất sửa thông tin… · Xoá HV…) | đầu hồ sơ | giữ, cùng điều kiện, cùng thứ tự | |
| Quay lại học · Gia hạn | đầu hồ sơ / dải tạm dừng | giữ | |
| Bấm ô điểm đổi kỹ năng | dải ô điểm | giữ | |
| Bấm một việc ở "Việc của tôi" | thanh việc → cột Case tại chỗ / nhảy tab Ý thức | → panel việc nổi phải (cùng panel Công việc) | R3.2 — [XM-3] |
| "+n việc khác của tôi" | thanh việc | bỏ — hiện ĐỦ việc (một em ít việc) | M4 |
| Chờ bạn duyệt (QL) | dưới thanh việc | giữ (không vẽ — vai QL ngoài đề bài) | |
| MT › mở hồ sơ lượt | bảng Mock Test | giữ | |
| + Ghi tiến độ · sửa / xoá dòng · Hoàn tác | Tiến độ trên lớp | giữ | |
| Mọi thao tác trong Case (đổi người, Nguyên nhân, Mô tả, tên Case, + Thêm PA, mở thẻ PA, Xác nhận / Chọn PA, Ghi kết quả, Lưu nháp, Cần thêm hỗ trợ?, Hoàn thành, Không cần theo dõi…, Lịch sử, Bằng chứng, Đề nghị QL xoá) | cột Case | giữ, cùng chỗ; thêm dòng quy chế | |
| Ý thức: Khai / sửa cấp bậc · Báo tình hình · + Ghi vi phạm · Thang | đầu tab | giữ (thanh đầu khối) | |
| Ý thức: Đã xem · Xác nhận xử lý · Trả lời · Sửa hạn · Rút / Sửa lý do | cột Bước đang làm | giữ | |
| Ý thức: lọc Tất cả / Vi phạm / Nhắc nhở / Tình hình · Lộ trình \| Cả lịch sử · Mọi nhóm | đầu khối "Cả quá trình" | trong phần "Lịch sử" của khối | R3.5 |
| Phối hợp SOS: Xác nhận · Bỏ… | tab nhỏ | giữ | |
| Lộ trình & lớp: Các lộ trình · Học thuật › · Hành trình · Xem trục tuần | tab 3 | giữ | |

Không thao tác nào bị mất.

## 3. [XM] — chỗ phải tự đoán

1. **[XM-1] Thanh Việc cần làm dùng DÒNG việc, không nút-chip theo loại.** Đề bài cho "dòng việc / nút-chip". Một em chỉ có 1–4 việc và GV cần thấy hạn từng việc → dòng việc chuẩn (tên · thẻ phụ · viên hạn · nút). 1440 xếp hai cột dòng cho đỡ trống bề ngang; 375 một cột.
2. **[XM-2] "+ Case" vào "+ Task".** R3.1 chỉ ghi "+ Task" + "⋯". Tạo Case từ hồ sơ thành 2 bấm (mở menu · Case). Không thêm "+ Case" riêng trong cột Case (web nay cũng không có).
3. **[XM-3] Case: hai lối, cùng form.** Bấm việc Case ở thanh việc → panel việc (R3.2); bấm hàng Case ở cột phải → Case mở tại chỗ như nay (v16, N33 ①). Cả hai cùng thân form, cùng dòng quy chế.
4. **[XM-4] Lịch sử Ý thức gập mặc định** (như "Xem lịch sử · n" tab lớp); K4 vẽ trạng thái đã mở.
5. **[XM-5] Em lưu trữ**: "Quay lại học" là nút chính, "+ Task" thành nút thường (tránh hai nút chính cạnh nhau).
6. **[XM-6] TVV "+ Task"** một mục "Hỏi tình hình học tập" — lấy theo đề bài ④ R4.5; cần khớp với mockup ④.
7. **[XM-7] GV không dạy em**: không "+ Task", không "⋯" (như web: không có mục). Câu chỉ xem: "Chỉ xem · việc của em do GV lớp MB FT 112 và GVCN … làm".
8. **[XM-8] Chữ nút lưu** Ghi kết quả = "Lưu" (theo ①, thay "Lưu kết quả" trên web); Mô tả Case = "Lưu mô tả" (v16 XM4 đề xuất tự lưu — chưa thấy chốt, giữ nút).
9. **[XM-9] Câu quy chế** (≤ 90 ký tự, từ `luat/2` mục 4; mockup ⑤ sẽ có bảng câu chuẩn — khi khác thì theo ⑤):
   - Mô tả: "Hạn 5 ngày từ lượt chốt · lưu xong: xác nhận PA theo quy chế"
   - Chọn PA mặc định: "PA của bạn dừng, kết quả giữ · PA quy chế chạy từ hôm nay" · Giữ PA của tôi: "QL duyệt trong 3 ngày · quá hạn theo bạn · PA của bạn vẫn chạy"
   - Ghi kết quả: "Kỳ 2 tuần · hạn thứ Ba 08/09 · Lưu là chốt, đổi bằng Sửa" · Điều chỉnh: "Điều chỉnh cần lý do · PA quy chế vẫn chạy tới MT2 · Lưu là chốt"
   - Hoàn thành: "Lưu là đóng Case · kết luận điền sẵn theo PA gần nhất · Mở lại được" · còn PA mở: "PA … đang chạy sẽ dừng, kết quả giữ · Mở lại được"
   - Trả lời tình hình (K4c): "Hạn 3 ngày · TVV đọc câu trả lời rồi tự báo PH"
10. **[XM-10] Turso.** Thanh việc thêm Nhập điểm + Trả lời tình hình: máy chủ `server/src/students/viecHocVien.ts` phải trả thêm hai loại cho đúng một em (ước +1–2 câu, < 50 dòng / lần mở hồ sơ). Panel việc dùng lại đường của Công việc (chỉ đọc khi bấm). Đo trước → sau ở PR code.

## 4. Tự rà R3.1–R3.9 + luật chung

| R | Đạt / Chưa | Khung |
|---|---|---|
| R3.1 đầu hồ sơ giữ; "+ Task" (em điền sẵn) + "⋯" | Đạt | #k1, #k4, #k5 (⋯ mở), #k6 (TVV) |
| R3.2 Việc cần làm dòng việc ①, đủ việc (Nhập điểm, Tình hình), bấm = panel việc | Đạt (XM-1, XM-3) | #k1, #k2 (K2a, K2b), #k4 (K4a, K4c), #k8 |
| R3.3 3 tab, bảng MT, hai cột Tiến độ │ Case, Case bấm thẳng, Trước / Sau, Hành trình | Đạt | #k1 (tab 3 bấm thử), #k6 |
| R3.4 dòng quy chế ở Mô tả · Chọn PA · Ghi kết quả · Hoàn thành | Đạt | #k3 (K3a–K3f), #k2 K2a |
| R3.5 tab Ý thức đồng bộ kiểu tab lớp, hai tab nhỏ | Đạt (XM-4) | #k4 K4a, K4b, #k8 K8c |
| R3.6 GVCN: "Em chưa có Target" + "Đề xuất sửa" ở dòng thông tin | Đạt | #k5 |
| R3.7 chỉ xem: không nút sửa, một câu "ai làm được" | Đạt (XM-6, XM-7) | #k6 K6a, K6b |
| R3.8 M1–M10; 375 như nay + nút tròn "+ Task" | Đạt | #k8 K8a–K8d |
| R3.9 Tạm dừng · lưu trữ · chưa có điểm | Đạt (+ đang tải, lỗi) | #k7 K7a–K7e |
| Chung: lời 20 (chip không biểu tượng — không dùng chip; tên "+ Task"; bấm việc mở panel) | Đạt | toàn bộ |
| Chung: 1440 + 375, Sáng + Tối, không tràn / cắt / chữ < 12 | Đạt (soát tự động) | `anh/ho-so-hv/` |
| Chung: ô chọn người / lớp / em theo "ô chọn có tìm" | Không áp — màn này không có ô chọn người (em điền sẵn) | — |

Đã dùng impeccable (layout, clarify) trong phạm vi; chưa chạy critique chấm điểm.
