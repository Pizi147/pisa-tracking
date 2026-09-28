# Nâng cấp sau deploy — Đặc tả tổng (27/09/2026)

> **Trạng thái:** bản nháp chờ chủ sản phẩm duyệt. Chưa giao session code.
> **Người soạn:** session planning (Opus 5.5). **Nhánh:** `ke-hoach-nang-cap-27-09`.
>
> **Nguồn (đọc kèm):**
> - `thiet-ke/nguon-27-09/YEU_CAU_CHINH_SUA.md` — **yêu cầu chính**, không được bỏ sót mục nào (ma trận §4).
> - `thiet-ke/nguon-27-09/FEEDBACK_DOI_NGU.md` — gợi ý của đội ngũ → phân tích ở `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md`.
> - `thiet-ke/nguon-27-09/NGUON_QUY_DINH_LOP_THUONG.md` — quy định P. Học thuật cho lớp thường (§6).
> - Ảnh chủ sản phẩm: `thiet-ke/anh/nguon-27-09/anh1…anh5` (yêu cầu gọi là "Ảnh 1…5").
> - Kế hoạch cũ chưa làm: `docs/superpowers/plans/2026-09-26-ux-sau-danh-gia.md` (gói UX-A…F),
>   `docs/superpowers/specs/2026-09-23-viec-con-lai-sau-deploy.md` (PR-GV, Pb2, S3, Dọn) — ghép ở §9.
> - Mockup: `thiet-ke/mockup/19-nang-cap-27-09.html` (M1…M12).

---

## 1. Tóm tắt cho chủ sản phẩm (đọc 3 phút)

**Làm gì:** 16 nhóm yêu cầu của anh/chị + luật lớp thường mới + những việc cũ chưa làm, chia thành **6 đợt**,
mỗi đợt 2–3 session code chạy song song. Đợt 1 sửa các lỗi đang cản việc trên bản chính.

| Đợt | Nội dung chính | Anh/chị kiểm gì sau đợt |
|---|---|---|
| **1** | Sửa lỗi nóng (lớp biến mất, SOS hai nút chồng, ô tên PA tự đóng, bộ lọc vi phạm, báo lỗi rõ, màu SOS sai) · tạo lớp kiểu tên mới + RF · ô ngày/ô "Khác"/ô chọn người thống nhất toàn web · tên web "Pisa Tracking" | Tạo thử 1 lớp FT, 1 lớp RF, 1 lớp FOU; bấm thử mọi ô ngày |
| **2** | Hộp **Chờ duyệt** cho QL (có phân loại) · lịch MT tự tạo + học sinh cũ + đánh số MT · Thêm học viên mới (email, ngày thi, tuần bắt đầu) | Thêm thử HS cũ đã học 20 tuần; xem MT1–MT3 tự hiện |
| **3** | SOS mới (Xác nhận nguyên nhân / Không cần theo dõi → QL duyệt) · **Ý thức mới** (Ghi nhận / Xác nhận xử lý, thang bậc) · panel Xếp lịch MT mới | Đi hết một vòng SOS và một vòng vi phạm |
| **4** | Hồ sơ Mock mới (điểm to, 4 ô tiêu chí, nhập tại chỗ, nhận xét W/S) · Xuất Excel MT · Học viên & Lớp (dòng kết quả, Cần hỗ trợ 4 hàng, Phân tích lớp) · **chế độ sáng/tối** | Xem mockup M4, M10 so với web thật |
| **5** | Luật lớp thường theo quy định P. Học thuật · hồ sơ giáo viên + KPI tháng | Nhập thử một Giữa khoá trượt |
| **6** | Tổng quan theo vai, hồ sơ HV "hiểu trong 30 giây", điện thoại, số liệu khớp, chữ cuối, dọn lỗi nhỏ | Dùng thử trên điện thoại |

**Rà toàn web 27–28/09 (§4.9):** 5 người rà tìm **253 phát hiện, 13 lỗi P0** — đã áp vào đặc tả; 6 câu còn mở đang theo khuyến nghị (§3.1c).

**Anh/chị cần làm ngay:** đọc bảng **§3.2 "Những gì tôi tự quyết"** (54 dòng) và gạch dòng nào không đồng ý;
xem mockup `thiet-ke/mockup/19-nang-cap-27-09.html` (M4 là mockup "Cần hỗ trợ" anh/chị yêu cầu).

---

## 2. Nguồn luật — thứ tự ưu tiên từ 27/09/2026

1. **Yêu cầu chủ sản phẩm 27/09** (`YEU_CAU_CHINH_SUA.md`) + 4 câu trả lời §3.1.
2. **Quy định lớp thường** của P. Học thuật (§6) — áp cho Pre FOU, FOU, BE, ELE (Pre FOU chỉ có Cuối khoá, §6.6).
3. Đặc tả này (§5, §6) — **thay** các phần tương ứng của:
   `thiet-ke/SOS_VA_PHOI_HOP_V3.md` (S04, S05, S06, Q-V3-1, Q-V3-4),
   `thiet-ke/Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` (Y01, B05, B12, B13, W02, danh sách 9 biện pháp),
   `thiet-ke/PISA-Rulebook-2026-09-19.md` (kỳ vọng MT theo lộ trình RF; nhập danh sách không lập lịch MT).
4. **Báo cáo rà toàn web 27–28/09** `thiet-ke/ra-27-09/K1.md … K5.md` (§4.9): mọi dòng trạng thái **"SỬA ĐẶC TẢ"** và **"MỚI"** là một phần của đặc tả này. Dòng báo cáo mâu thuẫn với dòng cũ ở §3–§8 thì **dòng báo cáo thắng**, trừ các điểm §5.8 chốt khác.
5. Các file cũ ở `thiet-ke/` — vẫn đúng ở chỗ không bị nhắc lại ở đây.
6. Mã nguồn — **hiện trạng, không phải luật**.

Danh sách xung đột đầy đủ (J1–J15): `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md` mục J.

---

## 3. Quyết định

### 3.1. Chủ sản phẩm chốt 27/09 (qua 4 câu hỏi)

| Mã | Câu hỏi | Chốt |
|---|---|---|
| **Q27-1** | Thang xử lý Ý thức | **Bắt buộc theo thứ tự.** Mỗi lần "Xác nhận xử lý", web tự điền bậc kế tiếp. Muốn nặng hơn → "Đề xuất QL duyệt" |
| **Q27-2** | MT đã qua của HS cũ, nhập bù có SOS | **Chỉ MT gần nhất tạo Case** (tuần thi trong 4 tuần trước ngày nhập); MT cũ hơn chỉ lưu điểm + mức SOS |
| **Q27-3** | Nơi QL nhận yêu cầu duyệt | **Một hộp "Chờ duyệt", có phân loại** |
| **Q27-4** | Kỳ vọng MT của lộ trình RF | **Mọi MT của RF = target** |

### 3.1b. Chủ sản phẩm chỉnh 27/09 (vòng 2, sau khi đọc bản nháp)

| Mã | Nội dung | Ảnh hưởng |
|---|---|---|
| Q27-5 | "5 ngày" là 5 ngày liên tiếp, không có "ngày làm việc" | T24 |
| Q27-6 | Không thêm Placement | bỏ T10; §6.4 |
| Q27-7 | Bỏ dòng thu gọn "Bắt đầu theo dõi: hôm nay · Đổi" | T12(a) |
| Q27-8 | Thêm chương trình **Pre FOU** (5 tuần, sửa được, chỉ Cuối khoá) | T51, L2, §6.6 |
| Q27-9 | Hạn ghi kết quả PA học thuật hằng tuần: **hết Thứ Hai** | §5.6 (R-PA1…5) |
| Q27-10 | **Phân tích** vẫn là tab trong Tổng quan; góc nhìn "Danh sách Case" sửa lại hoặc bỏ | T53 Q7, §4.9 |
| Q27-11 | Thang xử lý hiện **một dòng**; thư cảnh cáo ký hiệu **WL 1, WL 2, WL 3** | V4-8, M6 |
| Q27-12 | Rà lại **toàn bộ** logic + workflow mọi trang/panel và mọi kế hoạch chưa làm theo luật mới; làm nổi bật đúng chỗ | §4.9 (kết quả rà), §7.5 |
| Q27-13 | **Hệ môn học** (chỉnh sau): Pre FOU không chia môn, học theo unit, một bài Cuối khoá tổng hợp; FOU 4 môn **L · R · G+V · P**; BE, ELE **L · R · W · S**; kỹ năng GV "phụ trách được" luôn chỉ **L · R · W1 · W2 · S**; tên môn lớp thường chỉ hiện ở bài test, bảng điểm, hồ sơ lớp/HV; bộ lọc không dày — **tách hẳn khung FT và khung Lớp thường** | §5.7 (MH1–MH9), PR-MON |

### 3.1c. Câu hỏi còn mở sau rà — **đang theo khuyến nghị**, anh/chị đổi nếu muốn

Không chặn việc soạn kế hoạch: mọi dòng dưới đây đã được viết vào đặc tả theo phương án khuyến nghị (**in đậm**).

| Mã | Câu hỏi | Phương án | Đang áp |
|---|---|---|---|
| Q-A | Dấu "-" lần đầu (FT): ai dời bài? (K4-03) | **A. Máy tự dời sang tuần kế tiếp, báo GVCN + GVBM** · B. GVCN tự bấm "Xử lý vắng" (như mã hiện nay) + thêm việc nhắc · C. GVBM chọn dời ngay lúc gõ "-" | A — M8 |
| Q-B | Huỷ cả lượt MTn và dùng lại số (K4-09) | **A. Chỉ huỷ cả lượt với lượt lớn nhất chưa có điểm → số dùng lại; lượt khác chỉ huỷ phần còn lại** · B. Huỷ lượt bất kỳ, các lượt sau dồn số (kỳ vọng, SOS tính lại) · C. Không bao giờ dùng lại số | A — T36 |
| Q-C | Thang Ý thức ở **lớp thường** có về Report 1 mỗi lần lên lớp không? (K2-39, K5 Q-02) | A. Về Report 1 mỗi khoá · **B. Đếm liên tục qua chuỗi lớp thường (Pre FOU → FOU → BE → ELE, kể cả học lại); về Report 1 khi sang FT hoặc nghỉ học** · C. Không bao giờ về lại | B — T27 |
| Q-D | QL tự gửi yêu cầu (QL kiêm GVCN/GVBM) thì ai duyệt? (K5 Q-01) | **A. Tự duyệt được; thẻ ghi "tự duyệt", có nhật ký + báo Quản trị** · B. Bắt QL khác / Quản trị duyệt · C. Không vào hộp, coi như quyết luôn | A — §5.5 |
| Q-E | KPI tháng "theo giáo viên" tính cho ai? (K5 Q-03) | **A. Mọi GV có phân công ở lớp lúc tuần thi, mỗi bài đếm cho từng người** · B. Chỉ GVCN · C. GVBM tính theo môn mình | A — §6.5 |
| Q-F | FOU Giữa khoá: ai phụ trách PA Bổ trợ chung 2 buổi/tuần khi nhiều môn trượt? (K3 Q-2, K5 M-03) | **A. Người dạy buổi bổ trợ, mặc định GVCN (đổi được) — nộp một kế hoạch chung, ghi kết quả một lần cho cả nhóm** · B. GVBM của môn trượt đầu tiên · C. Tách mỗi môn một PA, tổng ≤ 2 buổi/tuần | A — N1 |

### 3.1d. Chủ sản phẩm chỉnh 28/09 — thêm / ghi kết quả PA (giao **PR-SOS**, đợt 3)

| Mã | Nội dung | Ảnh hưởng |
|---|---|---|
| Q28-1 | Gợi ý (chữ mờ trong ô) **Mô tả** khi tạo PA: *"Nêu hướng dẫn và trọng tâm cụ thể; ai sẽ thực hiện / hỗ trợ / tutor"* | Mọi form tạo PA học thuật: Thêm PA, Thay PA, PA quy chế (Q28-3), nhập bù |
| Q28-2 | Gợi ý **Mô tả kết quả** khi ghi kết quả PA: *"Đã cải thiện ở phần nào, như thế nào, kết quả cụ thể; ai đã thực hiện / hỗ trợ / tutor"* | Form Ghi kết quả PA (tuần và cuối), ô Kết quả PA của nhập bù |
| Q28-3 | **PA theo quy chế SOS** (PA hỗ trợ mặc định) **không huỷ được**, nhưng **không tự chạy**: tạo ra ở trạng thái **Chờ xác nhận**; GV bấm **Xác nhận PA** → mở **panel giống Thêm PA**, khác ở chỗ: **Phân loại PA khoá** (theo quy chế), **không có ô Tình trạng**, **không có ô Ngày bắt đầu** (luôn = ngày xác nhận). Lưu → PA "Đang làm". Thay luật "PA quy chế gán tự động, chạy ngay" của PR-N1 (#108) | T22, YC-12.3, R-PA |
| Q28-4 | **Bỏ ô "Dự kiến kết thúc"** khỏi mọi form tạo PA. PA thường chạy tới khi GV chọn **Kết thúc PA** ở lần Ghi kết quả; PA quy chế kết thúc theo **mốc quy chế** (hiện chỉ đọc trong panel: "Kết thúc theo quy chế: đến MT2") | T53 Q1, T63, `ThaoTacCase.tsx:146` |
| Q28-5 | (chủ sản phẩm 28/09, trả lời PR #110) Case từ SOS hiện **Chưa xử lý** tới khi **đã xác nhận nguyên nhân** VÀ có **PA do người xác nhận** đủ mô tả và thông tin (PA quy chế đã bấm Xác nhận PA, hoặc PA GV tự thêm). PA máy gán chưa ai xác nhận không làm Case thành "Đang xử lý" | PR-N1 phần 2 (#110) áp luật trạng thái (`dangXuLyCase`); panel Xác nhận PA (Q28-3) vẫn ở PR-SOS |

**Planning tự quyết (theo Q28-3, Q28-4):**
- **Nơi bấm Xác nhận PA:** (1) ngay sau khi bấm **Xác nhận Case**, ngăn Case **chuyển thẳng** sang panel "Xác nhận PA theo quy chế" (không phải tìm nút); (2) nếu GV đóng giữa chừng, hàng PA quy chế dưới Case hiện nhãn **Chờ xác nhận** + nút **Xác nhận PA**, và Việc cần làm (nhóm Case học thuật) có việc **"Xác nhận PA · {kỹ năng} · {tên HV}"**, **hạn = hạn xác nhận Case** (`sos_cases.han_xac_nhan`, 3 ngày).
- **Mốc quy chế tính từ ngày xác nhận PA** (thay "từ ngày Xác nhận Case" ở T22). "1 tháng" = ngày xác nhận PA + 1 tháng; "đến MT kế tiếp" / "đến lúc thi" giữ nguyên.
- **Ghi kết quả hằng tuần (§5.6) chỉ bắt đầu sau khi PA được xác nhận**; PA "Chờ xác nhận" không sinh việc Ghi kết quả, không vào số liệu hiệu quả PA, không chặn đóng Case bằng luật khác ngoài T63.
- Panel xác nhận có đúng các ô: **Người thực hiện** (điền sẵn GV môn, đổi được) · **Mô tả** (bắt buộc, gợi ý Q28-1, ≥ 15 ký tự như YC-12.5.2) · dòng chỉ đọc "Phân loại: {loại quy chế} · Bắt đầu: hôm nay · Kết thúc theo quy chế: {mốc}". Không Bằng chứng (giữ YC-12.3.5).
- **Q28-4, dữ liệu cũ:** PA đang có ngày dự kiến kết thúc giữ nguyên dữ liệu nhưng **không hiện** nhãn "Dự kiến kết thúc" nữa; không có việc nào sinh từ ngày đó (T53 Q1 đã bỏ "Làm PA … hạn"). PA mới lưu ngày này = trống. Form **Điều chỉnh PA** cũng bỏ ô ngày.
- PR-N1 (#108) đã chạy luật "PA quy chế chạy ngay" trên bản chính: PR-SOS có migrate nhỏ — PA quy chế **chưa có lần ghi kết quả nào** chuyển về "Chờ xác nhận"? **Không** — giữ nguyên PA đang chạy (GV đã làm), chỉ áp luật mới cho PA sinh sau khi PR-SOS lên.

### 3.2. Những gì tôi tự quyết — anh/chị gạch dòng nào không đồng ý

Ký hiệu ⚠ = điểm tôi ít chắc nhất, nên xem trước.

| # | Chủ đề | Tôi quyết |
|---|---|---|
| T1 | Tên lớp | `{CN} {KIỂU} {số}`: `MB FT 101`, `MB FT RF 12`, `MB FOU 12`, `MB BE 03`, `MB ELE 05`. Phần số: 1–4 chữ số, được thêm **một** chữ cái cuối (`101A`). Không phân biệt hoa/thường khi kiểm trùng |
| T2 | Lớp cũ | Đổi tên lớp đang có sang kiểu mới lúc migrate (`CP-FT 139` → `CP FT 139`). Ô tìm lớp chấp nhận cả kiểu cũ có dấu `-` |
| T3 | RF | RF là **một lộ trình** như LT1/LT2 (không phải chương trình mới). Lớp RF tên có chữ `RF` |
| T4 ⚠ | RF — PA quy chế và Phối hợp SOS | Vì mọi MT của RF bằng target, RF dùng **hàng "MT3 trở đi"** của bảng FT: PA `Tutor · đến lúc thi`; việc phối hợp theo hàng `MT4, MT5 trở đi` |
| T5 | Tạo lớp | **Một lệnh duy nhất** tạo lớp + phân công. Phân công sai → không tạo gì, báo lỗi ngay tại ô sai. Tạo xong mở thẳng hồ sơ lớp |
| T6 | Phạm vi mặc định | Người có vai **Quản lý / Quản trị** mở Học viên & Lớp ở phạm vi **Chi nhánh** (kể cả khi có dạy lớp). GV thuần giữ "Lớp tôi dạy" |
| T7 | Lớp "tàng hình" đã lỡ tạo trên bản chính | Lệnh chỉ đọc liệt kê lớp không có phân công; QT xoá bằng nút "Xoá lớp" đã có hoặc bổ sung phân công — hỏi anh/chị từng lớp lúc deploy |
| T8 | Email học viên | Bắt buộc khi **thêm mới**. HS đã có mà thiếu email: **không** bật badge "Thiếu thông tin" (không cản chuyên môn), chỉ hiện "chưa có email" trong Thông tin HV |
| T9 | Ngày thi dự kiến | Thêm ô ngày cụ thể (tuỳ chọn). Gõ `mm/yyyy` → chỉ lưu tháng. Gõ `dd/mm/yyyy` → lưu ngày, tự suy ra tuần và tháng |
| ~~T10~~ | ~~Placement lớp thường~~ | **Bỏ (chủ sản phẩm 27/09):** không thêm cột Placement ở bất kỳ đâu |
| T11 | Ô ngày thống nhất | Một ô **gõ được `dd/mm/yyyy`** + **nút lịch** mở lịch tự vẽ (không dùng lịch của trình duyệt vì nó hiện `mm/dd/yyyy` trên máy tiếng Anh). Giữ nguyên luật từng chỗ (ví dụ "không sau hôm nay"). Danh sách gợi ý nhanh cũ ("Hôm nay", "Hôm qua"…) chuyển thành nút "Gần đây" trong lịch |
| T12 | Chỗ ngày **đặc biệt** — giữ dạng hiện tại | (a) **đã bỏ 27/09**: dòng thu gọn "Bắt đầu theo dõi: hôm nay · Đổi" **thay bằng ô ngày thống nhất** hiện sẵn ngày hôm nay (riêng form Xác nhận Case SOS vẫn khoá = hôm nay theo 12.3.4); (b) thanh `‹ tuần ›` ở Lịch Test / Kế hoạch Test giữ; (c) chip tuần trong ô kỹ năng Kế hoạch Test giữ; (d) "Từ tuần / Đến tuần" của nhập bù giữ nghĩa đầu tuần / cuối tuần; (e) thanh ngày của bản demo không đổi |
| T13 | "Khác" | Một thành phần dùng chung: chọn "Khác" → ô chữ nhỏ hiện **ngay dưới**, bắt buộc ≥ 3 ký tự. Bỏ luật cũ "chọn Khác thì mô tả phải ≥ 30 ký tự" |
| T14 | Ô chọn người | Bấm là thấy danh sách ngay (không bắt gõ 3 ký tự); luôn có dòng "Dùng tên ngoài hệ thống: …". **Ngoại lệ**: phân công GV cho lớp và bộ lọc chỉ chọn tài khoản (vì cần quyền nhập điểm) |
| T15 | Sáng / tối | Nút nhỏ ◐ ở góc phải thanh đầu, cạnh Thông báo. Mặc định **Tối** như hiện nay. Nhớ theo từng máy |
| T16 ⚠ | Font | Tải kèm web font **Be Vietnam Pro** (thiết kế cho dấu tiếng Việt, số cùng độ rộng). Hiện web khai báo Inter nhưng không tải → mỗi máy một font |
| T17 | HV & Lớp mở lớp | Không tự mở lớp nào khi vào trang. Khi đang lọc/tìm thì vẫn mở sẵn các lớp có kết quả (tối đa 5) như hiện nay |
| T18 ⚠ | Dòng kết quả gần nhất (11.2) | `MT3 · kỳ vọng 7.0 · 3/4 kỹ năng có điểm` / `Không đạt: L R W`. Tôi **giữ chữ "kỳ vọng"** trước 7.0 để không lẫn với điểm. Lớp thường: `Cuối khoá · 2/4 kỹ năng có điểm` / `Không đạt: L R` |
| T19 | Cần hỗ trợ (11.3.1) | Mỗi em một khối **4 hàng L · R · W · S**. FT: hàng W có hai dòng con W1, W2. Hàng không có Case: một dòng mờ "—". Chỉ hiện em có ≥ 1 Case mở |
| T20 | Case và PA (12.2) | Case = hàng đậm, vạch trái màu theo trạng thái, có nút gập ▾. PA = dòng thụt vào, nền nhạt hơn, nhãn nhỏ "PA". Gập lại vẫn giữ tiêu đề + `2 PA · 1 đang chạy · hạn …` |
| T21 | Xác nhận nguyên nhân (12.3) | Form tên **"Xác nhận Case"**; tiêu đề hiện `[MT2] Reading không đạt [SOS 2]`, chỉ phần giữa sửa được; máy lưu phần giữa, hai đầu tự ghép |
| T22 | PA quy chế SOS (12.3.6) | **Không xoá, không thay, không kết thúc sớm.** Đổi được người thực hiện. Mốc: "1 tháng" tính từ ngày **Xác nhận PA** (Q28-3, §3.1d — PA quy chế chờ GV xác nhận, không tự chạy); "đến MT kế tiếp" / "đến lúc thi". Tuần chạm mốc: form thành **"Ghi kết quả cuối"** (không có khối Quyết định); quá mốc chưa ghi → việc "Ghi kết quả cuối" hạn hết Thứ Hai — không tự đóng im lặng (M-17). Khoá của form Ghi kết quả: T63. Mốc chưa có lịch (MT4+ / ngày thi chưa biết): PA chạy tiếp, hiện "chờ lịch MT kế tiếp" (K3-14) |
| T23 | Không cần theo dõi (12.4) | Lúc chờ: Case hiện `Chờ QL duyệt · không theo dõi`, GVBM coi như đã làm đúng hạn 3 ngày. QL **từ chối** (bắt buộc lý do) → Case quay về "Chờ xác nhận nguyên nhân", hạn mới 3 ngày tính từ lúc từ chối. QL quá hạn → thẻ đỏ "Quá hạn duyệt" + báo QL và Quản trị. **Không bao giờ tự duyệt** |
| T24 | Đếm ngày của mọi hạn | **Chủ sản phẩm 27/09:** "5 ngày" (kể cả chỗ yêu cầu ghi "5 ngày làm việc") là **5 ngày liên tiếp theo lịch**, tính cả Thứ Bảy, Chủ nhật, **tính cả ngày bắt đầu** (M-16) — không có khái niệm "ngày làm việc" trên web. Em **Tạm dừng** học → mọi hạn của em dừng (T65) |
| T25 | "2 tuần" của Ý thức (12.6.1) | **Tuần này + tuần trước** (Thứ Hai → Chủ nhật). Đếm mọi vi phạm trong khoảng đó **chưa nằm trong một lần xử lý** — vi phạm đã "Ghi nhận" **vẫn được đếm** |
| T26 | Hạn 5 ngày Ý thức | Tính từ ngày vi phạm thứ 3 (ngày việc xử lý thành bắt buộc). Vi phạm chưa ai Ghi nhận / Xử lý sau 5 ngày cũng thành Quá hạn + báo QL |
| T27 | Thang theo lộ trình | FT: đếm trong một lộ trình, sang lộ trình mới thì về Report 1 (Y02). **Lớp thường: đếm liên tục qua chuỗi lớp thường** (Pre FOU → FOU → BE → ELE, kể cả học lại); về Report 1 khi sang FT hoặc nghỉ học (Q-C). **HS cũ**: GVCN hoặc QL khai **một lần** "đã xử lý trước khi dùng web: bậc n" (có nhật ký; chỗ đặt: T73) |
| T28 | Bậc 4, 6 và ngoài thang | Bậc 4 = một lần xử lý gồm hai phần **Report 4 + Meeting CX/GĐCN**, không cần QL. Bậc 6 = **WL 3** (cần QL). **Đình chỉ** và **Meeting CX/GĐCN đứng riêng** đề xuất được bất cứ lúc nào (cần QL), **không** đẩy bậc |
| T29 | Biện pháp cần QL | Ba bước: **Đề xuất** (mô tả + bằng chứng bắt buộc) → **QL duyệt** trong 5 ngày → GVCN bấm **"Đã thực hiện"** (ngày). Report, WL 1, WL 2: **một bước** "Xác nhận xử lý", tệp **không bắt buộc** (theo 12.6.2) |
| T30 | "Khác" trong xử lý | Chỉ còn trong nhánh "Đề xuất QL duyệt" (Khác + ghi rõ) |
| T31 | Chữ "Ghi nhận" | Nút ghi vi phạm đổi thành **"+ Ghi vi phạm"**. "Ghi nhận" từ nay chỉ có một nghĩa: GVCN đã xem, không cần biện pháp |
| T32 | Dữ liệu Ý thức cũ | Biện pháp loại cũ giữ để xem lịch sử, nhãn "(loại cũ)", không chọn mới được. Biện pháp cũ đang "Đang chuẩn bị" → hiện nút "Hoàn tất theo cách cũ" một lần rồi thôi. Session code **đếm trên bản chính (chỉ đọc)** trước khi viết migrate |
| T33 | MT mặc định (13.2) | Tạo khi HS FT có lộ trình: thêm mới, chuyển vào lớp FT, mở lộ trình mới. FT: MT1 tuần 6 · MT2 tuần 12 · MT3 tuần 16. RF: MT1 tuần 4 · MT2 tuần 8. Bốn kỹ năng cùng tuần. Không tự tạo MT4+ |
| T34 | "MT lịch sử" | Lượt có tuần thi **kết thúc trước ngày lượt được tạo** (M-13). Cờ `lich_su` **lưu lúc tạo**, không suy lại. GVCN của lớp và QL nhập được cả 4 kỹ năng; không hạn chấm; không vào **bất kỳ** số nợ / quá hạn / chờ chấm / việc Nhập điểm nào (danh sách nơi đọc cờ: K4-01); không nhận dấu "-", không vào luồng vắng; khoá R11 sau **7 ngày** kể từ lần nhập cuối (K4-20). Nhãn nhỏ xám `lịch sử` cạnh "MT2" ở mọi nơi |
| T35 | HS FT đã có trên bản chính | Lệnh `bo-sung-mt-mac-dinh` chạy **thử** trước, in danh sách lượt sẽ tạo + cột "lịch sử / lượt thường"; mốc lịch sử = **ngày chạy lệnh** (K4-02); chủ sản phẩm duyệt danh sách rồi mới ghi |
| T36 | Đánh số MT (13.3) | Lượt mới = số lớn nhất còn hiệu lực + 1; không tạo MTn khi chưa có MT(n−1) — chặn ở **cả ba đường** `createAttempt`, `POST /ke-hoach-test/xep-moi`, `/hang-loat` (K4-08); lưới Kế hoạch Test chỉ ô MT kế tiếp có "+ xếp". **Huỷ cả lượt** chỉ với **lượt lớn nhất và chưa có điểm nào** → số được dùng lại (Q-B); lượt khác chỉ "Huỷ phần còn lại", giữ số (K4-09, M-12). Huỷ lượt đóng Case/PA/Phối hợp sinh từ lượt đó (T67) |
| T37 | Xếp lịch MT (13.4) | Tối đa **MT8**. Ép vào đợt trùng → hộp nói kỹ năng nào đã làm ở đợt đó rồi mới hỏi lại. Chỉ QL |
| T38 | Tên và chỗ của thao tác MT (13.6) | Tên: **Dời lịch thi** · **Dời hạn chấm** · **Bỏ kỹ năng khỏi đợt** · **Báo vắng** · **Huỷ điểm** · **Huỷ lượt MTn**. Thao tác hiện **theo trạng thái** của kỹ năng (bảng K4 §4d: chưa tới tuần / trong-qua tuần chưa điểm / đã có điểm / vắng / đã huỷ) — mỗi dòng ≤ 1 nút chính + ≤ 3 mục menu (K4-27). Lý do **bắt buộc** khi dời tuần đã bắt đầu, bỏ kỹ năng, báo vắng, huỷ điểm, huỷ lượt, dời hạn chấm; xếp/đổi tuần **tương lai** không cần lý do (K4-15). "Báo vắng" = ghi "-" cho mọi ô nhập của kỹ năng + chốt ngay (K4-28). Bỏ kỹ năng bị chặn khi đã có điểm hoặc tuần thi đã bắt đầu (K4-13). Lớp thường: menu ⋯ ở từng ô lưới (K4-32) |
| T39 | Nhận xét W/S, GV chấm (13.5) | Nhận xét: dòng gập **"+ Nhận xét"** dưới 4 ô tiêu chí, ≤ 1000 ký tự, không bắt buộc; Enter ở ô tiêu chí vẫn là Lưu. **GV chấm Speaking chọn một lần** ở đầu cột S của lưới (nhớ theo lớp × tuần, sửa riêng được trong hộp); điện thoại: ở đầu danh sách một kỹ năng; hồ sơ Mock là nơi chính để viết/sửa nhận xét dài (K4-24). Tiêu chí W1 `TA CC LR GRA`, W2 `TR CC LR GRA` (K4-25) |
| T40 | Xuất Excel (13.9) | Nút ở **đầu Lịch Test** (mọi vai xem được Test, phạm vi tự khoá theo quyền), ở **hồ sơ lớp ⋮** (điền sẵn lớp) và Phân tích › Tổng hợp Test (K4-34). Hai khung xuất sheet riêng; điểm là ô số, thiếu để trống; cột gọn `Mã · Tên · Chi nhánh · Lớp · Lộ trình · MT · Tuần · L · R · W · S · Overall · Target · Kỳ vọng · SOS · Trạng thái lượt` (K4-35). Thêm sheet "Bộ lọc đã dùng" |
| T41 | Hộp Chờ duyệt | Tab **đầu tiên** của Công việc với QL. Chip phân loại: **Tất cả · Học thuật · Ý thức · Lịch thi · Thông tin HV · Báo lên**. Tổng quan QL có dòng `n chờ duyệt · k quá hạn`. Chuông chỉ trỏ vào thẻ. GV có mục "Yêu cầu của tôi" |
| T42 | Dời lịch MT lần 2 | Thẻ **Lịch thi** trong Chờ duyệt; hạn duyệt = **hết Chủ nhật của tuần GV gửi** (K4-04); tuần đích mặc định = tuần chưa bắt đầu gần nhất không trùng T15; hết hạn không duyệt → yêu cầu tự huỷ (C09) |
| T43 | Đề xuất PA cần QL duyệt (luồng cũ) | Chuyển vào hộp Chờ duyệt (loại Học thuật) |
| T44 | Yêu cầu cập nhật thông tin (mục 15) | Nút **"Đề xuất sửa"** ở chỗ GV không có quyền sửa (lộ trình, target, lịch MT, lớp) → thẻ loại "Thông tin HV". Hiện GVCN **đang** sửa được target/lộ trình/lớp → rút quyền đó, chuyển sang "Đề xuất sửa" (M-18). GVCN vẫn tự sửa họ tên, ngày sinh, email, tuần bắt đầu (YC-5.2) |
| T45 | Head cơ sở, TVV | Head cơ sở = vai **Quản lý**. TVV không có tài khoản → "Báo phụ huynh qua TVV" là **việc phối hợp** GV tự đánh dấu (ngày, ghi chú) sau khi đã tạo task trên Base |
| T46 | Lớp thường · Giữa khoá (§6) | Kỹ năng < 70% → Case kỹ năng đó + PA **"Bổ trợ"** bắt buộc đến Cuối khoá (FOU: 2 buổi/tuần chung cho các kỹ năng trượt; BE/ELE: 1 buổi/tuần/kỹ năng), ghi "trừ buổi Free". **Bỏ nút "Bỏ qua"** với Giữa khoá. Kế hoạch bài giảng → QL duyệt trước khi PA bắt đầu |
| T47 ⚠ | Lớp thường · Cuối khoá | "% Cuối khoá" = **tổng câu đúng / tổng số câu của 4 kỹ năng**. Kỹ năng không đạt = kỹ năng < 70%. Mini Test đạt khi **≥ 70%** (quy định ghi "trên 70%" — tôi hiểu là cùng mức Pass chung). Mini Test trượt → Báo lên QL xử lý case-by-case |
| T48 | Cuối khoá vào luồng nào | Vào "Chuyển tiếp lớp / Lộ trình tiếp theo" đã có: web gợi ý hướng theo bảng %, riêng 50–59% bắt buộc QL quyết (thẻ Chờ duyệt) |
| T49 | BE/ELE lên FT | Ở Kết luận khoá, QL đánh dấu "Đạt kỳ vọng đầu ra?" + nguyên nhân (Trung tâm / Học sinh). Trung tâm → web tự tạo PA "Tutor 10 buổi/kỹ năng" ở lộ trình FT. Học sinh → QL đề xuất case-by-case |
| T50 ⚠ | KPI tháng | Hiện ở Phân tích › Theo giáo viên và Theo chi nhánh. Một "HS pass một bài" = % tổng ≥ 70% (Giữa khoá hoặc Cuối khoá). ≥ 70% HS pass → 5 điểm · 60–69% → 3 · < 60% → 0 |
| T51 | Pre FOU (chủ sản phẩm 27/09) | Chương trình lớp thường mới **Pre Foundation**, ký hiệu **Pre FOU**, **không chia môn** (học theo unit), mặc định **5 tuần** (Quản trị sửa được), **chỉ một bài Cuối khoá tổng hợp** (không có Giữa khoá). Tên lớp `MB Pre FOU 12`. Bậc thang: Pre FOU → FOU (và FT như mọi bậc — luật 13/09). Luật chi tiết §6.6 |
| T52 | Model rà chéo (yêu cầu 16) | Người rà luôn **Opus 5.5** (session riêng). Người code: Sonnet 5 / Fable 5.1; việc chạm dữ liệu thật: Opus 5.5 code + Opus 5.5 rà ở session khác |
| T53 | 7 câu còn treo của đánh giá 26/09 | Q1: "Làm PA … hạn 30/08" là **dự kiến kết thúc** → **bỏ hẳn ô và nhãn này** (Q28-4, 28/09), không nằm trong Việc cần làm (việc thật là "Ghi kết quả PA" hằng tuần, hạn hết Thứ Hai — §5.6). Q2: đếm theo **bài** = một kỹ năng của một em trong một lượt; luôn ghi đơn vị; tuần chưa hết thì chưa quá hạn. Q4: Lịch Test giữ nhóm theo lớp, dòng Nợ ghi thêm **tên GV** đang nợ. Q5: gộp hai badge lớp; với GV "bài chờ chấm" đứng đầu. Q6: môn đã xác nhận vắng **không** nhập trong lưới; muốn nhập bù thì QL "Khôi phục" trước. Q7: **Phân tích vẫn là một tab trong Tổng quan** (chủ sản phẩm 27/09 — không tách ra menu). Q8: trên điện thoại "Hôm nay" tối đa **3 việc** + "Xem hết" |
| T54 ⚠ | Hạn duyệt mới | Kế hoạch bổ trợ (Giữa khoá): QL duyệt trong **3 ngày**. Quyết định Cuối khoá 50–59%: **sớm hơn** trong hai mốc — ngày khai giảng lớp kế tiếp · hết Chủ nhật tuần sau tuần Cuối khoá (M-19). Đề xuất sửa thông tin HV, Xin ý kiến, Đề xuất PA: 5 ngày |
| T58 | Lớp thường **không có nhãn SOS** (K2, K3, K4 cùng khuyến nghị) | Không hiện "SOS n" ở bất kỳ đâu với lớp thường (lưới, hồ sơ, Lịch Test, Học viên & Lớp, Tổng quan, Phân tích, xuất Excel). Giữa khoá: `n/4 môn đạt · Không đạt: G+V P`; Cuối khoá: **% tổng** là tầng 1 (đậm) + hướng gợi ý; Pre FOU: `Cuối khoá · 68%` |
| T59 | Góc nhìn **"Danh sách Case"** (Q27-10) | **Bỏ hẳn**. Từng chức năng chuyển về chỗ có hành động theo bảng K1 §4(b); đường dẫn cũ `?goc=danh-sach…` và trang `/hoc-thuat/case/:id` **chuyển hướng** (không 404) — làm ở PR-Pb2 đợt 6, sau PR-DUYET và PR-SOS |
| T60 | "Cả hai" (FT + lớp thường gộp) | **Bỏ** ở mọi khối theo kỹ năng / bài test (Tổng quan, Phân tích, Test). Khối không theo kỹ năng (Chờ duyệt, Ý thức, Việc) vẫn gộp (K1-Q1) |
| T61 | Hiệu quả PA | Tách **"PA theo quy chế"** (không xếp hạng, không "Nên dùng") và **"PA do GV thêm"** (giữ "Nên dùng"); PA huỷ do "không cần theo dõi" ngoài mẫu số; Mini Test là kết quả cuối của PA bổ trợ miễn phí (K1-Q3, K1-23, K1-24) |
| T62 | Quản trị › Lộ trình & chương trình | **Không** thêm lộ trình/chương trình mới từ màn này (chỉ sửa tên, số tuần, còn dùng) (K1-Q4). Số tuần **một nguồn** là bảng `programmes`; lớp **chụp** số tuần + mốc lúc tạo (cột `classes.so_tuan`) (K1-46). Hai cột chỉ đọc "Kỳ vọng MT" và "Lịch MT mặc định" (K1-49) |
| T63 | Form Ghi kết quả với **PA bắt buộc** | Theo bảng K3 §4(a): Giữ nguyên · Điều chỉnh (chỉ người thực hiện + mô tả) · Xin hỗ trợ QL — **ẩn** Thay PA và Kết thúc PA, kèm dòng "PA theo quy chế — không thay, không kết thúc sớm · + Thêm PA". "Chưa đủ dữ liệu" ở lần ghi cuối → PA khép "Không xác định" + lý do (K3-13). Điều kiện Hoàn thành Case: K3 §4(a); còn PA bắt buộc chưa tới mốc thì **ẩn** nút Hoàn thành, hiện dòng "Hoàn thành được sau khi PA theo quy chế kết thúc (đến MT2 · W2 OCT)" (K3-09) |
| T64 | "Xin hỗ trợ từ QL" | **Không dừng PA** (hiện đang dừng + xoá mốc — K3-11). Thành thẻ Chờ duyệt loại **"Xin ý kiến"** (Học thuật, hạn 5 ngày): QL **trả lời** (bắt buộc chữ) và/hoặc "+ Thêm PA cho em" — không có Duyệt/Từ chối (K1-31, K3 §4a) |
| T65 | Em **Tạm dừng** học | Mọi hạn của em dừng (Case, PA, Ý thức, nhập điểm); việc của em ẩn khỏi Việc cần làm; đầu hồ sơ có dải vàng "Tạm dừng từ dd/mm · mọi hạn đang dừng" (K3-41) |
| T66 | Hàm hạn dùng chung | Mọi hạn "n ngày" **tính cả ngày bắt đầu** (M-16); mọi hạn hiện qua `<Han>` (thêm loại `duyet`, `y-thuc`, `mini-test`) |
| T67 | Huỷ lượt MT ↔ Case | Huỷ lượt đóng mọi Case / PA quy chế / việc Phối hợp **sinh từ lượt đó** với lý do "lượt đã huỷ", không tính thất bại, không vào hiệu quả PA; hộp Huỷ lượt nói trước hệ quả (K4-10) |
| T68 | Ý thức — việc và trạng thái | Việc Ý thức là **Việc thật có hạn** (xử lý bắt buộc, ghi nhận vi phạm mới, ghi đã thực hiện, khai bậc) (K1-11, K5-03); **một hàm trạng thái vi phạm** dùng chung cho mọi số và mọi nhãn (K1-26); bắt buộc **"dính"** từ ngày vi phạm thứ 3 tới khi có lần xử lý xong, "Cần xử lý" thắng "Đã ghi nhận" (M-10, K5-23); lúc deploy, vi phạm cũ lấy mốc bắt buộc = **ngày deploy** (không ai bị quá hạn ngược) |
| T69 | Quyền duyệt | Quyền mới `request.approve` (QL, Quản trị) — **GVCN không tự duyệt** đề xuất Ý thức của mình dù có `discipline.manage` (K5-32); QL tự gửi → Q-D |
| T70 | Case Cuối khoá lớp thường | Cuối khoá **không** tạo Case "chờ xác nhận nguyên nhân". Chỉ khi web tạo **PA bổ trợ miễn phí** (50–59% được lên, 60–69%) mới tạo Case "Cuối khoá · {môn} không đạt" (Pre FOU: "Cuối khoá · Tổng hợp") ở **lộ trình của lớp kế tiếp**, chạy ngay; Mini Test là kết quả cuối của PA đó (M-01, K3-27). Tín hiệu lớp thường đang chờ lúc deploy: Giữa khoá → thành Case theo §6.2; Cuối khoá → thu hồi (K5-66, K3-26) |
| T71 | Chuyển tiếp lớp / Lộ trình tiếp theo | Theo luồng K2 §4(a): web **gợi ý** hướng theo dải % (không còn "chọn 1 trong 6–7 hướng"); người xác nhận hoặc đổi **có lý do**; 50–59% và đổi theo chiều có lợi cho em → thẻ Chờ duyệt "Quyết định Cuối khoá"; dòng chưa đủ điểm Cuối khoá **khoá**. "+ Mở lớp mới" trong Chuyển tiếp dùng **panel Tạo lớp M1** (K2-16). Chuyển vào lớp FT lấy lộ trình **của lớp đích** (LT1/LT2/RF), không mặc định LT1 (K2-17); đổi LT ↔ RF = lộ trình mới (M-20) |
| T72 | Đầu hồ sơ HV "hiểu trong 30 giây" | Bản cuối K3 §4(e): dòng thông tin (có **tuần học n/16**, thi dự kiến, GVCN) · câu tóm tắt máy viết · 4 ô **Kết quả gần nhất · Học thuật · Ý thức · Sắp tới** · **thanh việc của chính người xem** (không có việc thì không vẽ) (K3-01, K3-03) |
| T73 | Tab Ý thức của HV | Bố cục K3 §4(f): thanh việc · thang một dòng · bộ lọc một hàng · dòng thời gian trộn vi phạm + lần xử lý (không ô tick; chọn vi phạm trong panel Xác nhận xử lý). Ô khai "đã xử lý trước khi dùng web: bậc n" (T27) đặt **ở dòng thang**, chỉ hiện khi lộ trình chưa có lần xử lý nào trên web; sửa khai chỉ QL (K3 §4f). HS cũ đã có biện pháp kiểu cũ trên bản chính: web **gợi ý bậc** từ dữ liệu cũ (K5-69) |
| T74 | Chú giải Hành trình | Rút từ 16 xuống **8** ký hiệu, một dòng, mặc định thu gọn (K3 §4d) |
| T75 | Bộ nhóm việc mới | Theo K5 §3 và K1 §4(c): bỏ `verify`, chuyển `decide`/`decide_move` sang Chờ duyệt, gộp `do_plan` + `result` thành **"Ghi kết quả PA tuần … · hạn hết T2"**, thêm các việc Ý thức, kế hoạch bổ trợ, Mini Test, Báo PH qua TVV, khai bậc. Hiển thị **4 nhóm**: `Chấm điểm · Case học thuật · Ý thức · Lớp & vận hành`; bỏ ô "Loại việc" 13 mục. Tên việc = **động từ + đối tượng + hạn** |
| T76 | Thông báo | Theo bảng K1 §4(f): mỗi thông báo trỏ **đúng thẻ hoặc dòng việc**; bỏ thông báo SOS gửi mọi GV (chỉ GVCN), bỏ "biện pháp không cần duyệt", thêm quá hạn duyệt · Báo lên · bắt buộc xử lý · vi phạm mới · Mini Test trượt · kế hoạch bổ trợ được duyệt · đăng ký tài khoản; chia **Cần làm / Để biết** |
| T77 | Thẻ Báo lên | Có nút **"Nhắc {GV}"**; **tự đóng** khi việc gốc xong; không có nút Duyệt (K1-57) |
| T78 | Migrate của các PR chạy song song | Mỗi PR một file `server/src/migrate/<ma-pr>.ts`, chỉ thêm **một dòng gọi** cuối danh sách; mọi dòng CSDL của `PREFOU` do PR-LOP làm, PR-MON chỉ mã (K5 §5) |
| T55 ⚠ | FOU dùng ô chuẩn nào | FOU giữ **bốn ô chuẩn** của lớp thường, chỉ đổi **tên hiện**: ô Writing hiện là **G+V**, ô Speaking hiện là **P**. Điểm FOU cũ giữ nguyên, không migrate. Phân công FOU: ô G+V gợi ý người phụ trách W1/W2, ô P gợi ý người phụ trách S |
| T56 ⚠ | Phân công lớp Pre FOU | **Chỉ một ô GVCN — GVCN dạy luôn** (chủ sản phẩm 28/09; bỏ ô "GV dạy"). Máy chủ tự gán ô môn `tong_hop` cho GVCN. Điểm Cuối khoá: GVCN hoặc QL nhập. Chỗ nào ở K2/K5 còn ghi "GV dạy" cho Pre FOU → đọc là GVCN |
| T57 | Case lớp thường theo môn | FOU: Case L · R · G+V · P; BE/ELE: L · R · W · S; Pre FOU: **một** chủ đề "Tổng hợp". Phân loại nguyên nhân: G+V dùng nhóm Từ vựng/ngữ pháp, P dùng nhóm mới **Phát âm**, Tổng hợp dùng nhóm chung |

---

## 4. Ma trận yêu cầu — mọi mục của `YEU_CAU_CHINH_SUA.md`

Cột **Hiện trạng** là kết quả đọc mã thật trên `main` @ 705ca9e. Cột **PR** trỏ tới §8.

### 4.1. Lớp (yêu cầu 1–4)

| Mã | Yêu cầu | Hiện trạng (bằng chứng) | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-1 | Tạo lớp fail khi 2 GVCN / GVCN không dạy kỹ năng; lớp tàng hình nhưng chặn trùng tên | `ClassCreatePanel.tsx:65-89` gọi **hai lệnh**: `POST /classes` rồi `PUT /classes/:id/teachers`; lệnh hai bị `setClassTeachers` (`classes.ts:889-901`) từ chối → lớp còn đó, không phân công. Người vừa QL vừa dạy mở trang ở phạm vi "Lớp tôi dạy" (`hocVienLop.ts:72-76` `phamViMacDinh`) nên không thấy | (a) máy chủ: một đường `POST /classes` nhận luôn `slots`, **kiểm ba luật phân công trước**, ghi lớp + phân công trong **một giao dịch**; (b) giao diện: kiểm tại chỗ, nút Tạo lớp khoá kèm lý do; (c) T6 phạm vi mặc định; (d) T7 lệnh chỉ đọc `kiem-lop-mo-coi` + hướng dẫn dọn | Chọn 2 GVCN → không tạo được, ô GVCN báo đỏ; tạo thành công → mở hồ sơ lớp; QL có dạy lớp vẫn thấy lớp mới ở trang Học viên & Lớp | PR-LOP |
| YC-2 | Tên lớp: bỏ `-`, `CP ` thay `CP-`, chọn kiểu lớp, FT cố định `CN FT #`, lớp thường chọn FOU/BE/ELE, GV không tự gõ FT/FOU… | Panel ghép `${branch.code}-` + ô gõ tự do (`ClassCreatePanel.tsx:56,156`); máy chủ bắt đầu bằng `CN-` (`intake.ts:511-512`) | Luồng mới (mockup **M1**): Chi nhánh → **Kiểu lớp** (FT · Lớp thường) → FT: Lộ trình (LT1 · LT2 · RF) / Lớp thường: FOU · BE · ELE → ô chỉ gõ **số**. Dòng xem trước "Lớp sẽ là **MB FT RF 12**". Máy chủ tự ghép mã (T1), từ chối mã sai mẫu. Sửa thông tin lớp (`SuaThongTinLopPanel.tsx`) cũng theo mẫu. Migrate đổi tên lớp cũ (T2) | Không gõ được chữ vào ô số; đổi kiểu lớp thì xem trước đổi theo; lớp cũ hiện tên mới | PR-LOP |
| YC-3 | Loại FT **RF (Refire)** — tên `CN FT RF #` | `ROUTES = ['LT1','LT2']` (`shared/domain/students.ts:41`); lộ trình đọc từ bảng `/ref/routes` | Thêm lộ trình `RF` vào danh mục + hằng số; tên lớp; kỳ vọng MT của RF = target (Q27-4); lịch MT mặc định RF (YC-13.2); PA quy chế / phối hợp theo T4 | Tạo lớp RF, thêm HS → MT1 tuần 4, MT2 tuần 8, kỳ vọng = target | PR-LOP (danh mục, tên) · PR-MT (kỳ vọng, lịch) |
| YC-4 | Không 2 GV cùng một nhiệm vụ; GVCN dạy ≥ 1 kỹ năng | Máy chủ **đã chặn** (`classes.ts:856-901`). Giao diện cho chọn nhiều người mỗi ô (`TeacherPick`, `ClassCreatePanel.tsx:237-271`) và còn ghi "một môn có hai người dạy cũng vậy" (dòng 218) | Mỗi ô (GVCN, từng kỹ năng) là **ô tìm một người**; GVCN không dạy kỹ năng nào → báo ngay dưới ô GVCN "GVCN phải dạy ít nhất một kỹ năng — chọn kỹ năng cho cô/thầy này". Áp cả `TeacherAssignPanel.tsx` (Sửa phân công). Bỏ câu sai | Không có cách nào chọn người thứ hai cho một ô | PR-LOP |

### 4.2. Thêm học viên — Ảnh 1 (yêu cầu 5)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-5.1 | Thông tin phụ đang chèn vào ô, vỡ lưới | Dòng lỗi/lưu ý in dưới từng ô ("Thiếu họ tên", "Chưa có target — nhập được nhưng…") làm hàng cao khác nhau | Hàng **cao cố định**. Ô có vấn đề: viền màu + dấu nhỏ ⚠/!. Cột cuối **"Tình trạng"**: `✓` hoặc `1 lỗi · 1 lưu ý` — bấm mở **một dòng chi tiết trải ngang** ngay dưới hàng. Rút 3 đoạn ghi chú cuối panel còn 2 câu (UX 26/09 §5.2). Mockup **M2** | Dán 20 dòng có lỗi → mọi hàng cùng chiều cao, cột thẳng | PR-NHAP |
| YC-5.2 | Thêm cột **Email** sau Ngày sinh; **Thời gian thi dự kiến** cạnh Target ở cuối; vẫn dán Excel; trống được; bắt buộc: Họ tên, Email, Tuần bắt đầu (mặc định tuần của lớp); GVCN sửa lại được | Chưa có cột `students.email`; có `learning_cycles.exam_month` + `exam_period_id`, **không** lưu ngày (schema.sql:299-319) | Migrate: `students.email`, `learning_cycles.exam_date`. Thứ tự cột FT: `Họ tên · Ngày sinh · Email · OVR · L · R · W · S · Target · Thi dự kiến · Tuần bắt đầu`. Lớp thường: `Họ tên · Ngày sinh · Email · Tuần bắt đầu`. Nhận dạng cột dán theo **tiêu đề** (không theo thứ tự). Thông tin HV cho GVCN + QL sửa **họ tên, ngày sinh, email, tuần bắt đầu** (có nhật ký) | Dán thiếu cột Email → dòng báo lỗi đúng ô Email; sửa email sau ở Thông tin HV | PR-NHAP |
| YC-5.3 | Bỏ ô "Định dạng ngày"; mặc định `dd/mm/yyyy`; Thi dự kiến nhận `dd/mm/yyyy` **hoặc** `mm/yyyy` | `IntakePanel.tsx:94,257-258` có ô chọn `dmy/mdy/iso` | Bỏ ô chọn; máy chủ chỉ đọc `dd/mm/yyyy` (và `d/m/yyyy`); từ chối ngày không có thật (31/02 — UX-C C10); Thi dự kiến theo T9 | Gõ `05/2027` → "Thi dự kiến 05/2027"; `31/02/2010` → lỗi đúng ô | PR-NHAP |
| YC-5.4 | Tuần bắt đầu điền **ngay** theo tuần của lớp; ô mỗi dòng giống ô "Tuần bắt đầu học": gõ được + nút lịch | Ô đầu panel là ô ngày trình duyệt để trống `dd/mm/yyyy` (ảnh 1); ô dòng là chữ `01/06` | Ô đầu panel điền sẵn tuần khai giảng của lớp ngay khi mở; mỗi dòng dùng **ô ngày thống nhất** kiểu tuần (YC-9) | Mở panel là thấy tuần của lớp; đổi ô đầu → các dòng chưa sửa tay đổi theo | PR-NHAP |

### 4.3. Toàn web (yêu cầu 6–10, 14)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-6 | Đổi tên thành **Pisa Tracking** | "PISA Progress" ở `web/src/App.tsx:84`, `WelcomePage.tsx:137`, `index.html:7`, log máy chủ `server/src/index.ts:21`, tài liệu | Đổi mọi chỗ hiển thị + tiêu đề tab + tài liệu hướng dẫn (README, TRIEN_KHAI, DEMO). Không đổi tên thư mục/repo | Quét chữ "PISA Progress" chỉ còn trong lịch sử/nhật ký | PR-N1 |
| YC-7 | Nút nhỏ góc trên đổi sáng/tối | Chỉ có nền tối: `index.css:7 color-scheme: dark`; 866 chỗ gọi thẳng tên màu `slate-*`/`ink-*` | (1) chuyển bảng màu Tailwind (`slate`, `ink`, `teal`…) sang **biến CSS**; (2) bảng màu sáng (§7.4) đạt tương phản ≥ 4.5:1; (3) sửa chỗ dùng màu cứng (`bg-white/10`, mã hex trong `style`); (4) nút ◐ (T15); (5) phép kiểm tương phản cho **cả hai** chế độ (mở rộng `nenGiaoDien.tests.ts`) | Chụp 10 trang chính ở cả hai chế độ; ảnh xám vẫn đọc được | PR-SANG |
| YC-8 | Chọn "Khác" ở đâu cũng hiện ngay ô chữ nhỏ | Mỗi nơi xử lý một kiểu: phân loại nguyên nhân (không có ô, bắt mô tả ≥ 30 ký tự — `QuickReport.tsx:271`), lý do Không cần theo dõi (có), Phối hợp SOS (có), nhóm vi phạm, lý do chuyển lớp/kết thúc (`students.ts:14-24`), PA đề xuất `other_proposal`, báo cáo tutor `tutor_other`… | Thành phần chung **`OKhac`** (T13) + quét mọi danh sách có mục Khác. Phép kiểm quét: mọi hằng số nhãn có giá trị "Khác" phải đi qua `OKhac` | Bảng kiểm §10.2 đủ ≥ 10 chỗ | PR-NEN |
| YC-9 | Mọi ô ngày/tháng/thời gian: gõ số + chọn lịch; ngày hiện ngày, tuần hiện tuần; chỗ đặc biệt hỏi trước | Ba kiểu: 17 ô ngày trình duyệt (`TransitionPanel`, `MockDetailPage`, `IntakePanel`, `StudentPlanPanel`, `ManagerTasks`, `MgmtTasksPage`, `CaseSosControls`, `PhoiHopSosSection`, `Filters`…); 19 file dùng danh sách thả xuống `ChonNgayGan/ChonTuan/ChonThang` (không gõ, không lịch); `WeekPicker` (có lịch + gõ) | Thành phần chung **`ONgay`** bốn kiểu: `ngay` · `tuan` · `thang` · `ngay-hoac-thang`; gõ `dd/mm/yyyy` (chấp nhận `dd/mm`), nút lịch mở lịch tự vẽ (portal, không bị cắt trong panel), nút "Gần đây". Thay **mọi** chỗ trừ T12 | Phép kiểm: không còn `type="date"`/`"month"` trong `web/src`; `ChonNgayGan/ChonTuan/ChonThang` chỉ còn là lớp bọc `ONgay` | PR-NEN |
| YC-10 | Mọi ô "tên người thực hiện" là ô tìm nhỏ; nhập được người ngoài hệ thống | `ChonNguoi` (`ui/PeoplePicker.tsx`) đã hỗ trợ `kieu:'ngoai'`, dùng ở 10 file. Còn: ô chọn phụ trách bắt gõ 3 ký tự (`congViec/ChonPhuTrach.tsx`); việc Vận hành chỉ nhận tài khoản; GV chấm Speaking chưa có | T14; quét mọi ô người; Vận hành nhận tên ngoài hệ thống (không nhận thông báo) | Bảng kiểm §10.2 | PR-NEN (+ PR-HSM cho GV chấm) |
| YC-14 | Làm nổi bật thông tin quan trọng, gọn, dễ chịu | Chữ phụ 10–11 px dày đặc; số quan trọng cỡ bằng chữ phụ (đánh giá 26/09 §3.6) | Hệ "ba tầng thông tin" §7.5 áp cho mọi màn đụng tới trong các PR; font (T16); cỡ chữ tối thiểu 12 px cho kết quả/hạn (UX-E E4) | Mỗi PR giao diện có ảnh trước/sau; mỗi màn nói rõ "tầng 1" của nó là gì | Mọi PR giao diện |

### 4.4. Học viên & Lớp (yêu cầu 11)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-11.1 | Không tự mở một lớp; hàng tiêu đề (HV, Kết quả gần nhất…) dính khi cuộn | `lopMoSan` mở lớp đầu tiên (`shared/domain/hocVienLop.ts:235-238`); bảng không có tiêu đề dính | T17; tiêu đề cột `position: sticky` trong vùng cuộn của trang (`<main>`), kèm tên lớp đang xem | Cuộn 3 lớp vẫn thấy tiêu đề cột | PR-N1 |
| YC-11.2 | Dòng dưới điểm gần nhất gọn, tối đa 2 dòng (ví dụ FT / lớp thường); các khu khác nổi bật hơn; **đề xuất** thêm cột | Dòng hiện tại dài, bị cắt "…" (ảnh 2): `MT2 · kỳ vọng 6.5 · mới có 2/4 kỹ năng · Thiếu W 6.0, S …` | T18. Badge SOS giữ màu thang SOS; tên em đậm hơn; "Việc tiếp theo" thành liên kết (UX-B B8). **Đề xuất cột mới (chưa làm, chờ anh/chị chọn ở M3):** "Sắp tới" = mốc kế tiếp của em (`MT2 · W2 OCT` hoặc `Cuối khoá · W4 OCT`). Tôi **không** đề xuất thêm cột nào khác | Không còn dấu "…" ở cột kết quả | PR-HVL |
| YC-11.3.1 | "Cần hỗ trợ": rộng hơn, **4 hàng theo 4 kỹ năng**, mỗi hàng: thông tin case + phương án đang làm — **mockup** | `BangCanHoTro.tsx`: mỗi em **một** hàng, chỉ case chính | T19. Mockup **M4** (đã vẽ). Cột: Kỹ năng · Case (tên, nguyên nhân, mức gấp, mở từ) · PA đang làm (tên, người, đến khi) · Việc tiếp + hạn | Em có Case L và S → khối 4 hàng, R và W mờ "—" | PR-HVL |
| YC-11.3.2 | Bộ lọc "Vi phạm xử lý" (ảnh 3) lỗi, gần như vô dụng | **Đã tìm ra**: số trên dòng em chỉ đếm vi phạm *chưa xử lý đúng nhóm*, còn danh sách "Vi phạm gần đây" lấy thêm vi phạm trong phương án đang chuẩn bị **không lọc theo nhóm** (`ClassYThucCard.tsx:126,163-166`) → "0 vi phạm" nhưng hiện 4 dòng BTVN khi lọc Chuyên cần; 12 nút lọc trên 3 hàng | Đợt 1: sửa nhanh cho số và danh sách cùng một tập (PR-N1). Đợt 3: dựng lại tab theo luật Ý thức mới (YC-11.4) — bộ lọc còn 1 hàng: `Tất cả · Cần xử lý · Chờ duyệt · Đã xử lý` + nhóm vi phạm dạng thả xuống | Lọc Chuyên cần → mọi số và mọi dòng đều là Chuyên cần | PR-N1 → PR-YT4 |
| YC-11.3.3 | Phân tích lớp: mở rộng theo kỹ năng giống bảng phân tích Tổng quan: số HV có vấn đề · số case ở kỹ năng · đang theo dõi · đã có phương án · đã xong → thành công (không hiện "không thành công"); hiệu quả PA: đang thực hiện · đã thực hiện · thành công · tỷ lệ thành công | `PhanTichLopTab.tsx` + `ClassIssueBoard.tsx` (năm con số mỗi hàng, cách mở rộng khác Tổng quan) | Mở một kỹ năng → **hai bảng nhỏ** (mockup **M5**): *Vấn đề* (HV gặp vấn đề · Case · Đang theo dõi · Đã có PA · Đã xong → Thành công) và *Hiệu quả PA theo loại* (Đang thực hiện · Đã thực hiện · Thành công · Tỷ lệ thành công `n/N (x%)`, `<TyLe>`, mẫu nhỏ khi N < 5). Mọi số bấm được ra danh sách (hợp đồng số liệu). Số dùng chung hàm với Phân tích › Hiệu quả PA | Số ở tab lớp = số ở Phân tích khi lọc đúng lớp | PR-HVL |
| YC-11.4 | Ý thức + phương án xử lý trong hồ sơ lớp: giống bên ngoài, **hai panel cạnh nhau** (Phương án · Các vi phạm) | Mỗi em một khối xếp dọc, trong khối lại hai cột (ảnh 3) → rất dài | Mockup **M6**: trái **Xử lý** — danh sách em theo trạng thái (Bắt buộc xử lý · Quá hạn · Chờ QL duyệt · Đã xử lý gần đây), mỗi dòng: tên · bậc hiện tại · số vi phạm mở · hạn; phải **Vi phạm** — dòng thời gian của em đang chọn (mặc định: mọi em, mới nhất trước), mỗi vi phạm có nút **Ghi nhận** / chọn để **Xác nhận xử lý**. Trên điện thoại: hai khung thành hai tab | Chọn một em bên trái → bên phải chỉ còn vi phạm của em đó; không cuộn trang quá 2 màn cho lớp 20 em | PR-YT4 |

### 4.5. Hồ sơ học viên — SOS, Case (yêu cầu 12.1–12.5)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-12.1 | Bấm "Không cần theo dõi" mà nút "Xác nhận nguyên nhân" vẫn còn; bấm cả hai thì vỡ giao diện (ảnh 4) | `CaseSosControls.tsx` cho mở **cùng lúc** hai khối chọn | Đợt 1: hai khối loại trừ nhau (mở khối này thì đóng khối kia). Đợt 3: thay bằng luồng YC-12.3 / 12.4 | Không thể thấy hai khối cùng lúc | PR-N1 → PR-SOS |
| YC-12.2 | Case và PA khó phân biệt; Case gập/mở được, gập vẫn giữ thông tin hàng tiêu đề | `SkillBoard.tsx` `TheCase` / `KhoiPhuongAn` cùng màu, khác mỗi dấu ▶ | T20, mockup **M7** | Ảnh xám vẫn phân biệt Case / PA | PR-SOS |
| YC-12.3 | Workflow "Xác nhận nguyên nhân" (12.3.1–12.3.6) | Hiện là một dải chip trong hàng kỹ năng + PA "Gợi ý tự động · chờ xác nhận" với Xác nhận/Sửa/Thay | Bấm **Xác nhận nguyên nhân** → mở **Ngăn Case** với form "Xác nhận Case" (mockup **M7**): không có tab "Đã xong từ trước" (12.3.1); kỹ năng khoá (12.3.2); **bắt buộc** Phân loại nguyên nhân + Mức độ gấp; tên mặc định `{kỹ năng} không đạt`, sửa được, hai phần cố định `[MT#]` (nổi bật) và `[SOS n]` (T21) (12.3.3); Bắt đầu theo dõi = **hôm nay**, không đổi (12.3.4); **không** có khối Bằng chứng, chỉ Mô tả (12.3.5); khối "Phương án theo quy chế SOS" hiện sẵn, không xoá được, có "+ Thêm phương án" (12.3.6). Bấm **Xác nhận Case** → Case chạy, ngăn chuyển sang panel **Xác nhận PA theo quy chế** (Q28-3, §3.1d); PA quy chế ở trạng thái Chờ xác nhận tới khi GV lưu panel đó — dưới Case, trạng thái "Đang làm" | GVBM đi hết luồng trong ≤ 4 lần bấm + gõ mô tả | PR-SOS |
| YC-12.4 | "Không cần theo dõi": lý do → tự chuyển QL → QL xác nhận trong 5 ngày → duyệt: Case + PA huỷ; lịch sử ghi rõ GV quyết định + lý do | S05 hiện: GVBM tự đóng ngay (`SOS_VA_PHOI_HOP_V3.md` S05) | Luật §5.3; thẻ loại **Học thuật** trong Chờ duyệt (§5.5); T23, T24 | Duyệt → Case "Đã huỷ · không cần theo dõi"; lịch sử có 3 dòng: GV xin (lý do) · QL duyệt · huỷ PA | PR-SOS (dùng PR-DUYET) |
| YC-12.5.1 | Form "Case đã xong từ trước": gõ 1 chữ vào tên PA là dòng tự đóng | **Đã tìm ra**: `QuickReport.tsx:417` — `dangSua = moSua.includes(i) \|\| !a.description.trim()` → có chữ là coi như xong | Dòng mới luôn ở chế độ sửa cho tới khi bấm **Xong**; thêm phép kiểm | Gõ cả câu không bị đóng | PR-N1 |
| YC-12.5.2 | Báo thiếu nhưng không nói thiếu gì; nên viền đỏ khi rời ô | Chân form ghi "Còn thiếu: Mô tả" trong khi luật là ≥ 15 ký tự (`QuickReport.tsx:265-279`) | Khi rời ô: viền đỏ + câu ngay dưới ô `Cần ít nhất 15 ký tự (đang có 8)`; bộ đếm ký tự nhỏ; chân form ~~liệt kê **tên ô + lý do**~~ → **chỉ một dòng xám `n ô cần sửa ↑`** (chủ sản phẩm 28/09, kế hoạch PR-N1 Q26); bấm thì nhảy tới ô lỗi đầu tiên. Áp cho **mọi form dùng `KhungPanel`** | Gõ 5 ký tự ở Mô tả rồi bấm sang ô khác → thấy đỏ + lý do | PR-N1 |
| YC-12.5.3 | Chỗ điền **Kết quả phương án** (ảnh 4: PA đã xong "Chưa có kết quả") | Form nhập bù chỉ có "Kết quả cuối" của cả Case | Mỗi PA đã áp dụng có ô **Kết quả PA** bắt buộc (Tiến bộ rõ · Tiến bộ một phần · Không tiến bộ · Chưa đủ dữ liệu — cùng bộ `FOLLOWUP_OUTCOMES`). Hàng PA trong bảng kỹ năng hiện kết quả đó | PA nhập bù hiện kết quả thay vì "Chưa có kết quả" | PR-SOS |
| YC-12.5.4 | Cột KQ PA: nút (Mở case, Ghi kết quả…) nằm **trên** dòng chữ phụ, đồng bộ | "Ghi kết quả" bị đẩy sang phải cạnh dòng chữ (ảnh 4) | Cột bên phải của mọi hàng Case/PA: **nút ở trên, chữ phụ ở dưới**, căn trái cùng một mép | Mọi nút trong cột cùng một mép trái | PR-N1 |

### 4.6. Ý thức (yêu cầu 12.6) — luật đầy đủ ở §5.4

| Mã | Yêu cầu | Làm gì | PR |
|---|---|---|---|
| YC-12.6.1 | Không phải lúc nào cũng cần report/biện pháp; ≥ 3 lỗi trong 2 tuần → bắt buộc xử lý; xử lý ngay nếu nghiêm trọng; > 5 ngày chưa xử lý → quá hạn + báo QL | §5.4 luật V4-1…V4-6; T25, T26 | PR-YT4 |
| YC-12.6.2 | Bỏ bước trung gian (tổng hợp → ghi PA → bắt đầu → xác nhận) → **Xác nhận xử lý** một bước; không bắt buộc tệp; bắt buộc mô tả; bỏ "Xoá PA" | §5.4 V4-7; panel mockup **M6** | PR-YT4 |
| YC-12.6.3 | Ghi nhận thông thường khác biệt rõ với Đã xử lý | §5.4 bảng trạng thái vi phạm | PR-YT4 |
| YC-12.6.4 | Thang Report 1 → Report 2 → WL 1 → Report 4 + Meeting CX/GĐCN → WL 2 (WL = thư cảnh cáo, chủ sản phẩm 27/09); QL duyệt Meeting CX/GĐCN, WL 3, Đình chỉ trong 5 ngày; ngoại lệ Report 4; mỗi lần trình QL có mô tả + bằng chứng; bỏ 2 loại meeting + trao đổi ngắn | §5.4 V4-8…V4-12; Q27-1; T27–T32 | PR-YT4 |

### 4.7. Test / Mock Test (yêu cầu 13)

| Mã | Yêu cầu | Hiện trạng | Làm gì | Nghiệm thu | PR |
|---|---|---|---|---|---|
| YC-13.1 | Kiểm luật dấu `-` khi dời: dời 1 tuần được; tuần 2 vẫn dời → QL duyệt; demo chưa thể hiện | Cơ chế **có** (`fasttrack/absence.ts`: `pendingMove`, `canRequest`; nhóm việc "Duyệt dời lịch do vắng" `mywork.ts:147+`) nhưng bộ demo **không có** em nào dời lần hai | (1) kiểm từ đầu tới cuối bằng phép kiểm (FT: `-` lần 1 → tự dời; lần 2 → yêu cầu QL; QL duyệt/không trả lời hết tuần → C09); (2) thêm **2 em demo**: một em chờ duyệt dời lần 2, một em đã được duyệt; (3) hiện rõ ở Lịch Test (`Chờ QL duyệt dời lần 2`) và hộp Chờ duyệt (T42) | Anh/chị mở demo thấy đúng 2 tình huống | PR-MT |
| YC-13.2 | Tự tạo lịch MT mặc định: FT MT1 tuần 6 · MT2 tuần 12 · MT3 tuần 16; RF MT1 tuần 4 · MT2 tuần 8; QL sửa sau; HS cũ (đã học > 20 tuần) vẫn tạo đủ; MT đã qua → GVCN và QL nhập đủ 4 kỹ năng | Hằng số `MOCK_FT_STUDY_WEEK` có; **không** tự tạo — nhập danh sách cố ý không lập lịch (`intake.ts:472-479`) | §5.2 luật M1–M6; T33–T35; Q27-2 | Thêm HS bắt đầu cách đây 22 tuần → thấy MT1, MT2, MT3 đều "MT lịch sử", GVCN nhập được cả 4 kỹ năng; chỉ MT3 (nếu trong 4 tuần) tạo Case | PR-MT |
| YC-13.3 | Đánh số MT: sang lộ trình khác → MT1 (FT); không có MT3, MT4 khi chưa có MT1, MT2; MT đầu tiên luôn là MT1; tăng dần | Số lượt theo lộ trình (đã reset theo `cycle`); nhưng `createAttempt` nhận `attemptNo` tuỳ ý (`attempts.ts:986`) → nhảy cóc được | T36, luật M7 §5.2 — kiểm ở máy chủ cho `createAttempt` và `POST /ke-hoach-test/dot` | Gọi thẳng API tạo MT3 khi chưa có MT2 → bị từ chối, câu lỗi tiếng Việt | PR-MT |
| YC-13.4 | Nâng cấp panel xếp lịch MT: lọc CN, lớp, tìm HS; HS đã chọn lên đầu; chọn đợt tới MT8; trùng/đã làm → tự sang MT kế tiếp; hàng cạnh tên liệt kê MT đã/chưa làm, tick trực tiếp; ép vào đợt trùng → pop-up kỹ năng đã mock; 4 kỹ năng mặc định cùng tuần (tuần tới), thanh tuần chung ở trên, lịch riêng từng kỹ năng bên dưới | `test/keHoach/NganXepHangLoat.tsx` (chọn sẵn đợt sai — UX-C C4; 14 điều khiển) | Dựng lại theo mockup **M9**; T37; giữ "xem trước từng em · lưu theo em · giữ hàng lỗi" đang có | QL xếp MT3 cho 12 em thuộc 2 lớp trong ≤ 5 lần bấm | PR-XLMT |
| YC-13.5 | Chấm W và S: ô nhận xét chung phía dưới (không bắt buộc); S thêm **tên GV chấm** | Chưa có cột nhận xét/GV chấm (`assessment_scores` chỉ có `note`) | Migrate: `assessment_scores.comment`, `examiner_user_id`, `examiner_name`; T39; hiện ở hồ sơ Mock, lưới chấm (hộp 4 tiêu chí), xuất Excel | Nhận xét hiện dưới điểm W ở hồ sơ Mock | PR-HSM |
| YC-13.6 | Panel thêm hoạt động (ảnh 5): gọn, thuật ngữ ngắn; Lịch sử giữ nhưng rõ hơn; tích hợp vào dashboard kế hoạch MT | Menu "Thêm" ở màn một lượt (`MockDetailPage.tsx:373-407`) chạy ngay, lý do ghi cứng | T38; thao tác có mặt ở **hai chỗ dùng chung một hộp**: hộp kỹ năng của Kế hoạch Test (`HopKyNang.tsx`) và hàng kỹ năng ở hồ sơ Mock. Lịch sử: dòng thời gian gọn (biểu tượng · việc · ai · khi · lý do) gập dưới đợt | Không thao tác nào ghi ngay mà không có hộp lý do | PR-XLMT |
| YC-13.7 | Làm nổi bật **Writing tổng** (ảnh 5) | Hàng "Writing (tổng)" chữ nhỏ, xám, lẫn giữa W2 và S | Writing tổng là **một ô điểm lớn** ngang hàng L, R, S; W1/W2 là hai ô con bên trong; công thức thành chữ phụ nhỏ | Nhìn 1 giây thấy 4 điểm kỹ năng + Overall | PR-HSM |
| YC-13.8 | Hồ sơ Mock: điểm to rõ; W 4 ô tiêu chí; S 4 ô tiêu chí; đúng vai + đúng GVBM thì nhập ngay tại đây; giống dashboard Lịch Test | Bảng dòng chữ (ảnh 5); nhập phải sang lưới | Mockup **M10**: đầu trang (em · MT · tuần · lớp · kỳ vọng · kết quả `<KetQuaDot>`), dải 5 ô lớn L · R · W · S · Overall, ô W/S mở 4 ô tiêu chí; bấm ô (nếu có quyền) → sửa tại chỗ, lưu từng ô (`SaveState`), sửa điểm đã có vẫn bắt ghi lý do (RB-5); cột lịch + tình trạng từng kỹ năng gọn bên dưới | GVBM Speaking nhập 4 tiêu chí Speaking ngay ở hồ sơ Mock | PR-HSM |
| YC-13.9 | Nút xuất Excel kết quả MT, lọc linh hoạt (CN · tuần · lớp · thời gian · kết hợp); **đề xuất thiết kế + workflow** | Có thư viện `xlsx` (package.json) và nút xuất ở Phân tích › Tổng hợp Test | Đề xuất §7.8 + mockup **M11**; T40 | Xuất "chi nhánh MB, W1–W4 SEP" ra đúng số dòng như xem trước | PR-XUAT |

### 4.8. Luồng phối hợp, học sinh cũ, model (yêu cầu 15–16)

| Mã | Yêu cầu | Làm gì | PR |
|---|---|---|---|
| YC-15a | Rà logic **học sinh cũ** | Bảng kịch bản §10.3 (HS cũ vào web: lịch MT, MT lịch sử, SOS gần nhất, thang Ý thức khai bậc cũ, lộ trình, email thiếu) — mỗi PR liên quan chạy đúng các dòng của mình | PR-MT, PR-NHAP, PR-YT4 |
| YC-15b | Thông báo QL, gửi yêu cầu QL duyệt, yêu cầu QL cập nhật thông tin, tạo/theo dõi task, phối hợp phòng ban và toàn chi nhánh — **brainstorm + đề xuất** | §5.5 (hộp Chờ duyệt, ba loại đồ vật: Việc · Yêu cầu duyệt · Thông báo), mockup **M8**; phối hợp phòng ban qua "việc phối hợp" có tên ngoài hệ thống (TVV, Phòng xếp lịch) | PR-DUYET (+ PR-VAI cho Tổng quan) |
| YC-16 | Không đổi model Fable crosscheck; crosscheck giữ Opus 5.5 | T52; cập nhật `PROMPT_SESSION_CODE.md` mục 0 | PR tài liệu |

---

### 4.9. Kết quả rà toàn web 27–28/09 (yêu cầu vòng 2, ý 8–9)

Năm người rà chỉ đọc (Opus 5.5), mỗi người một khu, soi **mọi** trang/tab/panel/luồng qua 6 lăng kính (luật mới · logic ·
workflow · nổi bật & phân loại · kế hoạch cũ · môn học & bộ lọc). Báo cáo đầy đủ, có bằng chứng file:dòng và ảnh:
`thiet-ke/ra-27-09/` — K1 Tổng quan/Phân tích/Công việc/Quản trị · K2 Học viên & Lớp · K3 Hồ sơ HV/Case/Ý thức · K4 Test/chấm/Mock ·
K5 luật máy chủ, hạn, quyền, số liệu, migrate, demo.

**253 phát hiện: 13 P0 · 148 P1 · 92 P2.** Khoảng một nửa là "SỬA ĐẶC TẢ" (đặc tả có ý nhưng chưa đủ/sai) — đã áp vào §3.2, §5, §6
hoặc theo quy tắc §2 mục 4.

**13 lỗi P0 và cách chốt:**

| Mã | Lỗi | Chốt ở | PR |
|---|---|---|---|
| K4-01 | MT lịch sử sẽ tràn "Nợ tuần trước" / "Quá hạn" (lớp 15 em cũ ≈ 225 bài nợ giả) | T34, M3 | PR-MT |
| K4-02 | Lệnh bổ sung MT tạo lượt thường đã quá hạn ngay khi tạo | T35, M6 | PR-MT |
| K5-21 | Khoá R11 chặn GVBM/GVCN nhập MT lịch sử | T34 (khoá sau 7 ngày) | PR-MT |
| K5-22 | Không có cờ `lich_su` → nợ giả, kể cả qua lệnh bổ sung | T34, M-13 | PR-MT |
| K5-31 | Chưa có đường quyền cho GVCN nhập đủ 4 kỹ năng MT lịch sử | T34 | PR-MT |
| K5-37 | Mã chương trình Pre FOU chưa có → lớp Pre FOU bị coi là FT | PF1, T78 | PR-LOP |
| K5-38 | Lịch một lượt Pre FOU tạo 4 kỹ năng ảo, không có ô Tổng hợp | PF6 | PR-MON |
| K5-39 | Nợ điểm tính cứng 4 môn → Pre FOU mỗi em 4 bài nợ ảo | PF6 | PR-MON |
| K5-30 | GVCN Pre FOU không nhập được điểm, không xử lý được Case; máy chủ từ chối lớp chỉ có GVCN | T56, M-09, PF6 | PR-LOP + PR-MON |
| K1-46 | Số tuần sửa ở Quản trị không có tác dụng (tiến độ đọc hằng số trong mã) | T62 | PR-LOP |
| K1-11 | Việc Ý thức của GVCN chỉ là dòng "Nhắc" không hạn, trái hạn cứng 5 ngày | T68, T75 | PR-YT4 |
| K1-26 | Mọi số "vi phạm chưa xử lý" sẽ đếm cả vi phạm đã Ghi nhận → quá hạn + báo QL sai hàng loạt | T68 | PR-YT4 |
| K2-25 | Chuyển tiếp lớp không đọc điểm Cuối khoá, trong khi luật mới quyết hướng theo % | T71 | PR-LT2b |

**Việc thêm cho từng PR** — người soạn kế hoạch PR **phải** mở từng mã dưới đây trong `thiet-ke/ra-27-09/` và đưa vào kế hoạch
(hoặc ghi rõ vì sao không làm). Một phát hiện có thể thuộc hai PR (mỗi PR làm phần của mình).

| PR | Số phát hiện (P0 · P1 · P2) | Mã phát hiện (**đậm** = P0) |
|---|---|---|
| PR-N1 | 14 (0 · 9 · 5) | K1-45, K2-10, K2-37, K3-02, K3-17, K3-18, K3-45, K5-02, K5-12, K5-19, K5-20, K5-24, K5-58, K5-67 |
| PR-LOP | 20 (3 · 13 · 4) | K1-05, K1-43, **K1-46**, K1-47, K1-48, K1-49, K1-50, K2-07, K2-08, K2-15, K2-16, K2-17, K2-18, K2-24, **K5-30**, K5-36, **K5-37**, K5-45, K5-67, K5-68 |
| PR-NEN | 1 (0 · 1 · 0) | K1-56 |
| PR-DUYET | 42 (0 · 24 · 18) | K1-01, K1-15, K1-16, K1-27, K1-29, K1-30, K1-31, K1-32, K1-33, K1-39, K1-41, K1-44, K1-52, K1-53, K1-55, K1-56, K1-57, K2-06, K2-29, K3-11, K3-18, K3-20, K3-35, K3-40, K3-47, K4-04, K5-04, K5-05, K5-12, K5-13, K5-14, K5-17, K5-24, K5-27, K5-28, K5-32, K5-33, K5-52, K5-58, K5-59, K5-63, K5-67 |
| PR-MT | 28 (5 · 18 · 5) | K1-04, K1-49, K1-53, K1-55, K2-05, K2-17, K2-31, K2-32, K2-33, K3-14, **K4-01**, **K4-02**, K4-03, K4-04, K4-08, K4-09, K4-12, K4-18, K4-20, K5-09, K5-15, **K5-21**, **K5-22**, **K5-31**, K5-49, K5-54, K5-60, K5-67 |
| PR-NHAP | 6 (0 · 4 · 2) | K2-19, K2-20, K2-21, K2-33, K2-41, K5-33 |
| PR-MON | 40 (3 · 25 · 12) | K1-07, K1-17, K1-18, K1-22, K1-30, K1-34, K1-45, K1-47, K1-51, K1-54, K2-02, K2-03, K2-09, K2-12, K2-40, K2-43, K3-05, K3-25, K3-31, K4-05, K4-07, K4-16, K4-19, K4-22, K4-32, K5-29, **K5-30**, **K5-38**, **K5-39**, K5-40, K5-41, K5-42, K5-43, K5-44, K5-45, K5-46, K5-47, K5-48, K5-57, K5-67 |
| PR-SOS | 43 (0 · 28 · 15) | K1-02, K1-05, K1-13, K1-14, K1-20, K1-22, K1-23, K1-24, K1-27, K1-38, K2-04, K3-06, K3-07, K3-08, K3-09, K3-10, K3-11, K3-12, K3-13, K3-14, K3-15, K3-16, K3-17, K3-19, K3-21, K3-22, K3-23, K3-24, K3-29, K3-35, K3-41, K3-44, K3-46, K3-48, K4-10, K5-05, K5-06, K5-07, K5-15, K5-25, K5-51, K5-55, K5-67 |
| PR-YT4 | 32 (2 · 16 · 14) | **K1-11**, K1-15, K1-17, K1-25, **K1-26**, K1-40, K1-41, K1-53, K1-55, K1-56, K2-04, K2-30, K2-38, K2-39, K3-33, K3-34, K3-35, K3-36, K3-37, K3-38, K3-41, K3-48, K5-03, K5-11, K5-16, K5-18, K5-23, K5-24, K5-32, K5-34, K5-53, K5-69 |
| PR-XLMT | 14 (0 · 9 · 5) | K1-21, K4-08, K4-10, K4-11, K4-13, K4-14, K4-15, K4-17, K4-18, K4-19, K4-27, K4-28, K4-29, K4-32 |
| PR-HSM | 7 (0 · 3 · 4) | K2-32, K4-24, K4-25, K4-26, K4-30, K4-31, K4-33 |
| PR-HVL | 15 (0 · 8 · 7) | K2-01, K2-02, K2-03, K2-04, K2-06, K2-11, K2-13, K2-14, K2-22, K2-23, K2-31, K2-36, K2-37, K2-40, K2-42 |
| PR-XUAT | 4 (0 · 2 · 2) | K1-53, K4-34, K4-35, K5-35 |
| PR-LT2 | 48 (1 · 36 · 11) | K1-02, K1-03, K1-04, K1-12, K1-15, K1-19, K1-41, K1-55, K2-01, K2-04, K2-12, K2-23, **K2-25**, K2-26, K2-27, K2-28, K2-29, K2-30, K2-34, K2-35, K3-04, K3-12, K3-26, K3-27, K3-28, K3-31, K3-39, K3-43, K4-21, K4-23, K4-36, K5-01, K5-08, K5-10, K5-11, K5-18, K5-26, K5-44, K5-50, K5-51, K5-55, K5-56, K5-61, K5-62, K5-64, K5-65, K5-66, K5-67 |
| PR-GV | 2 (0 · 1 · 1) | K1-28, K5-56 |
| PR-Pb2 | 1 (0 · 1 · 0) | K1-27 |
| PR-VAI | 11 (0 · 3 · 8) | K1-06, K1-08, K1-09, K1-10, K3-01, K3-03, K3-32, K3-42, K3-47, K3-48, K5-10 |
| PR-UXD | 3 (0 · 0 · 3) | K1-42, K3-30, K3-48 |
| PR-UXF | 3 (0 · 2 · 1) | K1-04, K1-37, K4-06 |
| PR-Dọn | 3 (0 · 0 · 3) | K1-35, K1-36, K2-35 |

PR-LT2 ở bảng trên nay tách làm **PR-LT2a** (Giữa khoá: Case tự tạo, PA bổ trợ, kế hoạch bài giảng, Báo PH qua TVV, bỏ tín hiệu) và
**PR-LT2b** (Cuối khoá: % tổng, Chuyển tiếp lớp / Lộ trình tiếp theo, Mini Test, BE/ELE lên FT, KPI) — người soạn kế hoạch chia mã theo nội dung.

**Mockup phải sửa trước khi giao code** (theo K2, K4): M1 (FT đủ ô W1, W2; lớp Pre FOU chỉ một ô GVCN) · M4 (hai Case cùng kỹ năng,
lớp thường, gộp hàng trống, công tắc "Chỉ kỹ năng tôi dạy") · M6 (một bộ lọc, em thuộc hai nhóm, khung phải khi chưa chọn em) · M9
(MT3 dở → "Xếp nốt", chặn đúng M7, chip trạng thái dở / lịch sử / huỷ / chờ duyệt, khung lớp thường) · M10 (menu theo trạng thái, W1 và W2
hai hàng tiêu chí, trạng thái huỷ / lịch sử / vắng) · M11 (đặt ở Lịch Test, cột theo T40). Phần đã sửa ngay trong bản này: xem ghi chú
đầu `thiet-ke/mockup/19-nang-cap-27-09.html`.

## 5. Luật mới

### 5.1. Lớp — tên, kiểu, lộ trình, phân công

| Mã | Luật |
|---|---|
| L1 | Mã lớp do **máy ghép**: `{mã chi nhánh} {FT \| FT RF \| FOU \| BE \| ELE} {số}` (T1). Người dùng chỉ chọn và gõ số |
| L2 | Kiểu lớp **FT** → chọn lộ trình `LT1 · LT2 · RF`. Kiểu **Lớp thường** → chọn `Pre FOU · FOU · BE · ELE` |
| L3 | Mỗi nhiệm vụ (GVCN, từng kỹ năng) **đúng một** người; GVCN phải dạy ≥ 1 kỹ năng của lớp — kiểm ở máy chủ **trước khi ghi** |
| L4 | Tạo lớp và phân công là **một giao dịch**. Được tạo lớp chưa đủ phân công (thiếu kỹ năng), nhưng **không** được tạo với phân công sai luật |

### 5.2. Lịch Mock Test

| Mã | Luật |
|---|---|
| M1 | Khi một em có lộ trình FT (thêm mới, chuyển vào lớp FT, mở lộ trình mới) → tự tạo các lượt **đã lên kế hoạch**: FT `MT1` tuần học 6, `MT2` tuần 12, `MT3` tuần 16; RF `MT1` tuần 4, `MT2` tuần 8. Tuần học 1 = tuần bắt đầu của lộ trình. Bốn kỹ năng cùng tuần |
| M2 | Kỳ vọng: LT1/LT2 giữ `target − 1.0 / − 0.5 / target`; **RF: mọi MT = target** (Q27-4) |
| M3 | **MT lịch sử** — định nghĩa và hành vi ở T34. **Một hàm** (mở rộng `pendingSkillsOf` + `skillScoreDeadline`) trả "không nợ, không hạn" cho lượt `lich_su`; mọi nơi đếm nợ đọc hàm đó (K4-01). Phép kiểm: thêm em đã học 22 tuần → dải số Lịch Test, Tổng quan, Việc cần làm **không đổi** |
| M4 | SOS của MT lịch sử: chỉ lượt **gần nhất** có tuần thi trong **4 tuần** trước ngày tạo lượt mới tự tạo Case + PA quy chế + Phối hợp SOS (Q27-2). Lượt cũ hơn: lưu điểm, mức SOS chỉ hiện ở hồ sơ Mock/Hành trình, **không** tính là "SOS hiện tại" ở bất kỳ số liệu nào (M-14) |
| M5 | QL sửa/xoá lịch mặc định như lịch thường (luật thứ tự đợt T15 giữ nguyên) |
| M6 | Em FT đã có trên bản chính mà chưa có lượt → lệnh `bo-sung-mt-mac-dinh`: chạy thử in danh sách (kèm cột lịch sử/lượt thường theo **ngày chạy lệnh**) → chạy thật khi chủ sản phẩm duyệt (T35). Sửa tuần bắt đầu của em sau khi đã tạo lượt: lượt **chưa có điểm** dời theo, lượt có điểm giữ (K2-33) |
| M7 | Đánh số và huỷ lượt: theo T36 |
| M8 | Dời do vắng (**Q-A**, đang theo khuyến nghị): dấu `-` của FT còn tới hết Chủ nhật → chốt "Không dự thi" → **máy tự dời lần 1** sang tuần kế tiếp, ghi lịch sử, báo GVCN + GVBM; Lịch Test tuần mới hiện dòng đó kèm `dời từ W3 SEP · vắng lần 1` (K4-03). Lần 2 liên tiếp → thẻ Lịch thi (T42). QL đổi tuần một kỹ năng **đang vắng** ở bất kỳ đâu (kể cả Kế hoạch Test) = dời do vắng, +1 lần (K4-12). MT lịch sử không vào luồng này. Lớp thường: dời từ lần 2 → báo GVCN; Cuối khoá dời quá tuần cuối khoá → thẻ Báo lên (K4-23) |

### 5.3. SOS Fast Track — bản v4 (thay S04, S05, S06 của v3)

| Mã | Luật |
|---|---|
| S4-1 | Mock có kỹ năng dưới kỳ vọng → tự tạo/gắn Case kỹ năng đó (**giữ S01, S02**) + **PA theo quy chế** (bảng v3 §4, RF theo T4) ở trạng thái **bắt buộc**, không còn "gợi ý chờ xác nhận" |
| S4-2 | GVBM đúng kỹ năng có **3 ngày** (tính cả ngày đầu) để chọn **một trong hai**: **Xác nhận nguyên nhân** hoặc **Không cần theo dõi**. Hai lựa chọn loại trừ nhau trên giao diện |
| S4-3 | Xác nhận nguyên nhân = điền form "Xác nhận Case" (YC-12.3): bắt buộc Phân loại nguyên nhân, Mức độ gấp, Mô tả (≥ 15 ký tự); tên theo T21; Bắt đầu theo dõi = hôm nay; không bằng chứng |
| S4-4 | PA quy chế: không xoá / thay / kết thúc sớm (T22). GV thêm PA khác theo luồng thường. Case đóng khi mọi PA đã có kết quả (luật đóng Case giữ nguyên) |
| S4-5 | Không cần theo dõi: chọn lý do (`Học sinh có lý do đặc biệt` · `Tình huống đơn lẻ` · `Khác` + ghi rõ) → tạo **yêu cầu duyệt** loại Học thuật, hạn **5 ngày** (T24) từ ngày GV gửi. Duyệt → Case + mọi PA chưa xong **huỷ** (không tính thất bại, không vào thống kê hiệu quả); Từ chối → T23 |
| S4-6 | Lịch sử Case ghi: GV quyết định không theo dõi · lý do · QL duyệt/từ chối · ai · khi nào |
| S4-7 | Thu hồi khi sửa điểm (S08) giữ nguyên; Case đang "Chờ QL duyệt" mà điểm sửa thành đạt → yêu cầu duyệt tự đóng với lý do "điểm đã sửa" |

### 5.4. Ý thức — bản v4 (thay Y01, B05, B12, B13 (phần tệp), W02 và danh sách biện pháp)

**Trạng thái của một vi phạm** (hiện bằng đúng một nhãn):

| Nhãn | Nghĩa | Kiểu hiển thị |
|---|---|---|
| `Mới` | chưa ai xem | viền trung tính |
| `Đã ghi nhận` | GVCN đã xem, không cần biện pháp | chữ xám + ✓ mảnh, **không nền** |
| `Cần xử lý` | thuộc tập bắt buộc (≥ 3 / 2 tuần) | nền vàng nhạt |
| `Quá hạn` | quá 5 ngày chưa xử lý | nền cam, "quá hạn n ngày" |
| `Chờ QL duyệt` | nằm trong một đề xuất đang chờ | tím nhạt |
| `Đã xử lý · {tên bậc}` | nằm trong một lần xử lý đã xong | nền trung tính đậm + tên bậc (ví dụ "Đã xử lý · Report 2") |

| Mã | Luật |
|---|---|
| V4-1 | Mọi vi phạm phải được GVCN đóng bằng **Ghi nhận** hoặc **Xác nhận xử lý** |
| V4-2 | **Bắt buộc xử lý**: khi em có **≥ 3** vi phạm (mọi nhóm) trong **tuần này + tuần trước** chưa nằm trong một lần xử lý (T25) → nút Ghi nhận **biến mất** cho các vi phạm đó; chỉ còn **Xác nhận xử lý** |
| V4-3 | GVCN được Xác nhận xử lý **bất cứ lúc nào** (vi phạm nghiêm trọng không cần chờ đủ 3) |
| V4-4 | **Quá hạn**: bắt buộc xử lý mà quá **5 ngày** (T26) chưa có lần xử lý đã xong → nhãn Quá hạn + thẻ **Báo lên** trong hộp Chờ duyệt của QL + thông báo |
| V4-5 | Vi phạm `Mới` quá 5 ngày chưa ai Ghi nhận/Xử lý → cũng Báo lên (thay cảnh báo mềm W01–W06) |
| V4-6 | Ghi nhận **không** đẩy bậc. Ghi nhận xong vẫn đếm vào luật ≥ 3 (T25) |
| V4-7 | **Xác nhận xử lý = một bước** (panel M6): danh sách vi phạm đưa vào (mặc định: mọi vi phạm chưa xử lý của em, tick bỏ được) · bậc (tự điền, không chọn) · ngày thực hiện (≤ hôm nay) · người thực hiện · **Mô tả bắt buộc** · tệp **tuỳ chọn**. Lưu là xong. Không có "Đang chuẩn bị", không có "Xoá PA" |
| V4-8 | **Thang bắt buộc** (Q27-1), đếm theo lộ trình (T27). Ký hiệu thư cảnh cáo là **WL** (chủ sản phẩm 27/09): bậc 1 `Report 1` · bậc 2 `Report 2` · bậc 3 `WL 1` · bậc 4 `Report 4 + Meeting CX/GĐCN` (một lần xử lý, không cần QL) · bậc 5 `WL 2` · bậc 6 `WL 3` (**cần QL**). Trên màn hình thang là **một dòng** không xuống hàng (bậc đã qua thu gọn thành ✓ khi hẹp) |
| V4-9 | Ngoài thang, luôn **cần QL**: `Meeting CX/GĐCN` (đứng riêng), `Đình chỉ học tạm thời`, `Khác` (ghi rõ). Không đẩy bậc (T28) |
| V4-10 | Đề xuất cần QL: bắt buộc **mô tả + bằng chứng** (tệp hoặc liên kết). QL duyệt trong **5 ngày** (lịch, theo yêu cầu 12.6.4). Quá hạn → thẻ đỏ + báo Quản trị. Duyệt → GVCN bấm **Đã thực hiện** (ngày). Từ chối → vi phạm quay về `Cần xử lý`, bậc giữ nguyên |
| V4-11 | Bỏ khỏi danh sách chọn: `GV trao đổi ngắn với HV`, `GV meeting với HV`, `CX / GĐCN meeting với HV / PH` (bản cũ). Dữ liệu cũ giữ (T32) |
| V4-12 | Sửa/xoá vi phạm (V11′–V14′ của v3) giữ nguyên. Xoá vi phạm nằm trong lần xử lý đã xong: lần xử lý còn, số vi phạm giảm, **bậc không lùi** |
| V4-13 | Phối hợp SOS **không đổi** (vẫn có trao đổi HS/gia đình, GVCN meeting, CX meeting — đây là việc sau Mock, không phải xử lý vi phạm) |

### 5.5. Hộp "Chờ duyệt" và ba loại đồ vật (mục 15)

**Ba loại đồ vật — mỗi thứ chỉ ở một nơi:**

| Loại | Là gì | Ở đâu | Hết khi nào |
|---|---|---|---|
| **Việc** | có người làm + hạn; **suy ra** từ dữ liệu | Công việc › Việc của tôi; Tổng quan "Hôm nay" | tự biến mất khi làm xong ở bất cứ đâu |
| **Yêu cầu duyệt** | ai đó xin QL quyết định; **lưu** thành bản ghi | Công việc › **Chờ duyệt** (QL); "Yêu cầu của tôi" (người xin) | QL Duyệt / Từ chối, hoặc tự đóng khi không còn ý nghĩa |
| **Thông báo** | tin một chiều | chuông | đọc xong; **luôn trỏ** tới Việc hoặc Yêu cầu, không tự mang việc |

**Bản ghi yêu cầu duyệt (bảng mới dùng chung):** `loai` · `phan_loai` (Học thuật · Ý thức · Lịch thi · Thông tin HV) ·
`doi_tuong` (HS, lớp, Case, lượt MT, xử lý) · `nguoi_xin` · `ly_do` · `bang_chung` · `han_duyet` · `trang_thai`
(`cho` · `duyet` · `tu_choi` · `tu_dong`) · `nguoi_duyet` · `ly_do_tu_choi` · thời điểm. Mỗi loại khai **một hàm
"khi duyệt"** và **một hàm "khi từ chối"** — không viết luồng duyệt riêng từng nơi.

**Các loại ở vòng này:**

| Loại | Phân loại | Người xin | Hạn duyệt | Nguồn |
|---|---|---|---|---|
| Không cần theo dõi Case SOS | Học thuật | GVBM | 5 ngày | 12.4 |
| Đề xuất PA cần QL (luồng cũ) | Học thuật | GV | theo luật cũ | T43 |
| Kế hoạch bổ trợ lớp thường | Học thuật | GV | 3 ngày ⚠ | §6 |
| Quyết định Cuối khoá 50–59% | Học thuật | GVCN | trước ngày khai giảng lớp kế tiếp | §6 |
| Meeting CX/GĐCN · WL 3 · Đình chỉ · Khác | Ý thức | GVCN | 5 ngày | 12.6.4 |
| Dời lịch MT lần 2 | Lịch thi | GV | hết tuần (C09) | 13.1 |
| Ép xếp MT vào đợt trùng | Lịch thi | — (QL tự làm, chỉ ghi lịch sử) | — | 13.4 |
| Đề xuất sửa thông tin HV | Thông tin HV | GV | 5 ngày | T44 |
| **Xin ý kiến** (từ nút "Xin hỗ trợ QL" trong Ghi kết quả PA) — QL trả lời, không Duyệt/Từ chối | Học thuật | GV | 5 ngày | T64 |
| Quyết định Cuối khoá (đổi hướng gợi ý theo chiều có lợi cho em ở dải khác 50–59%) | Học thuật | GVCN | như 50–59% | T71 |
| **Báo lên** (không có nút Duyệt): vi phạm quá hạn, Case chờ nguyên nhân quá hạn, Mini Test trượt, yêu cầu quá hạn duyệt | Báo lên | hệ thống | — | V4-4, V4-5, T47 |

**Người duyệt:** quyền `request.approve` (QL, Quản trị — T69). QL tự gửi yêu cầu thì **tự duyệt được**, thẻ ghi "tự duyệt", có nhật ký và báo Quản trị (Q-D).

**Thẻ yêu cầu** (mockup **M8**): `[Phân loại] Loại · Học viên · Lớp` / `Người xin · ngày xin · lý do (2 dòng)` /
`Bằng chứng (nếu có)` / `Hạn duyệt: còn 2 ngày` hoặc `quá hạn 1 ngày` / `[Duyệt] [Từ chối…] [Mở hồ sơ]`. Từ chối
bắt buộc lý do. Chọn nhiều thẻ cùng loại → "Duyệt n yêu cầu".

**Phối hợp phòng ban / toàn chi nhánh:** việc giao cho người **không có tài khoản** (TVV, Phòng xếp lịch) là
**việc phối hợp** gắn vào hồ sơ (Case, lượt Test, Kết luận khoá), người có tài khoản đánh dấu xong. Việc giữa các
chi nhánh đi qua Vận hành (tab đã có) với "Người phụ trách" nhận tên ngoài hệ thống (YC-10).

### 5.6. Hạn ghi kết quả PA hằng tuần — **hết Thứ Hai** (chủ sản phẩm 27/09)

| Mã | Luật |
|---|---|
| R-PA1 | Kết quả của một tuần học (Thứ Hai → Chủ nhật) phải ghi xong **trước hết Thứ Hai tuần kế tiếp** (thay "hết Chủ nhật" của rulebook mục 5 và `HE_GIAO_DIEN.md` §4 loại `cap-nhat-pa`) |
| R-PA2 | Áp cho **mọi PA học thuật** (FT, lớp thường, PA quy chế SOS, PA bổ trợ). Không áp cho Ý thức, Phối hợp SOS |
| R-PA3 | Nhãn hiển thị: `Ghi kết quả tuần W4 SEP · hạn hết T2 28/09`; quá hạn: `quá hạn n ngày` tính từ sau Thứ Hai đó |
| R-PA4 | Đổi ở **hàm hạn tuần thật** `weeklyUpdateDue` (`shared/domain/cases.ts`) — **không** phải `cycleDeadline` (M-15). 11 chỗ chữ/hàm phải đổi: bảng K3 §4(c). `cycleDeadline` chỉ còn dùng cho hạn duyệt đề xuất PA → đổi thành 5 ngày (K3-18) |
| R-PA5 | Hạn tuần **được lưu** ở `case_interventions.action_due` → migrate **một câu** dời mọi hạn của PA đang chạy từ Chủ nhật sang Thứ Hai (K5-19); chạy thử in số PA bị dời trước. Tuần đang dở lúc deploy không ai bị tính quá hạn ngược |

### 5.7. Hệ môn học và hai khung FT / Lớp thường (chủ sản phẩm 27/09, Q27-13)

| Chương trình | Môn hiện trên màn | Ô chuẩn máy dùng | Bài kiểm tra |
|---|---|---|---|
| FT (LT1 · LT2 · RF) | L · R · W1 · W2 · S (Writing tổng = W) | `listening` `reading` `writing1` `writing2` `speaking` | Mock Test |
| BE, ELE | L · R · W · S | `listening` `reading` `writing` `speaking` | Giữa khoá + Cuối khoá, mỗi môn một điểm |
| FOU | L · R · **G+V** · **P** | `listening` `reading` `writing` (hiện "G+V") `speaking` (hiện "P") — T55 | Giữa khoá + Cuối khoá, mỗi môn một điểm |
| Pre FOU | **không chia môn** — học theo unit | một ô mới `tong_hop` ("Tổng hợp") | **chỉ Cuối khoá**, một điểm |

| Mã | Luật |
|---|---|
| MH1 | Kỹ năng GV **"phụ trách được"** (Hồ sơ cá nhân, Quản trị › Tài khoản) chỉ có **L · R · W1 · W2 · S**. Bỏ các môn lớp thường khỏi danh sách này |
| MH2 | Tên môn đi qua **một hàm** `tenMon(chươngTrình, ôChuẩn)` (và bản viết tắt). Không chỗ nào tự viết "Writing"/"Speaking" cho lớp thường |
| MH3 | Tên môn riêng của lớp thường **chỉ** hiện ở: bài test, lưới chấm/bảng điểm, hồ sơ lớp, hồ sơ HV (bảng kỹ năng, Hành trình, Case), Kế hoạch Test / Lịch Test khung lớp thường, xuất Excel. **Không** đưa vào bộ lọc |
| MH4 | **Hai khung tách hẳn** ở mọi trang có số liệu theo kỹ năng hoặc theo bài test (Tổng quan, Phân tích, Test, Công việc › Hỗ trợ học viên, danh sách Case nếu còn): công tắc `Fast Track · Lớp thường` đứng đầu trang. Khung FT: lọc kỹ năng **L · R · W · S** (W gồm W1, W2). Khung Lớp thường: lọc theo **chương trình** (`Pre FOU · FOU · BE · ELE`) và lớp — **không có bộ lọc môn** |
| MH5 | Bảng/số liệu **không trộn** hai khung trong cùng một cột (ví dụ không có cột "W" vừa là Writing FT vừa là G+V FOU) |
| MH6 | Phân công: lớp FT 5 ô; BE/ELE 4 ô (W: gợi ý người phụ trách W1/W2); FOU 4 ô L · R · G+V · P (T55); Pre FOU chỉ một ô GVCN, GVCN dạy luôn (T56). Luật "một nhiệm vụ một người" (L3) áp cho mọi ô |
| MH7 | Đạt / không đạt lớp thường: FOU, BE, ELE xét **từng môn ≥ 70%** và **% tổng**; Pre FOU chỉ **% tổng** (§6.6) |
| MH8 | Case lớp thường theo môn của chương trình (T57); FOU Giữa khoá trượt G+V → Case "Giữa khoá · G+V không đạt" |
| MH9 | Quản trị › Lộ trình & loại lớp: bộ môn của một loại lớp chọn trong **bộ môn của chương trình đó**, không hiện hợp mọi môn (`CatalogAdmin.tsx` đang gộp `ENTRY_SKILLS` + `REGULAR_SKILLS`) |

---

### 5.8. Chốt 22 mâu thuẫn trong đặc tả (K5 §8)

| Mã | Chốt |
|---|---|
| M-01 | Cuối khoá lớp thường và Case: T70 |
| M-02 | QL tự gửi yêu cầu: Q-D |
| M-03 | FOU một PA chung: mỗi Case một dòng PA cùng `nhom_bo_tro`, ghi một lần chép cả nhóm; người phụ trách theo Q-F |
| M-04 | Case "Chờ QL duyệt" mà em chuyển lớp: FT → FT hoặc lớp thường → lớp thường thì yêu cầu **đi theo em** (phạm vi duyệt theo chi nhánh hiện tại; QL từ chối → hạn 3 ngày giao GVBM đúng môn lớp mới); FT ↔ lớp thường thì Case bị hệ thống đóng → yêu cầu tự đóng |
| M-05 | Hạn mới: kế hoạch bổ trợ = cùng hạn xác nhận nguyên nhân (3 ngày); Mini Test = ngày buổi đó + 2; "Đã thực hiện" = 5 ngày từ ngày QL duyệt; Báo PH qua TVV = không hạn |
| M-06 | KPI tháng: tháng = tháng chứa tuần thi; đơn vị = bài đủ môn; người được tính theo Q-E |
| M-07 | Thang Ý thức lớp thường: Q-C |
| M-08 | Vi phạm của em chuyển lớp: hạn 5 ngày **đặt lại** từ ngày chuyển cho GVCN mới; thẻ Báo lên cũ tự đóng; chỉ GVCN lớp đang học được xử lý |
| M-09 | Pre FOU: GVCN là người dạy duy nhất (được gán ô `tong_hop`), nên có đủ quyền nhập điểm và xử lý Case; người phụ trách Case = GVCN |
| M-10 | Đã ghi nhận rồi đủ 3 → "Cần xử lý" thắng; bắt buộc dính (T68) |
| M-11 | Đề xuất ngoài thang được duyệt thì bậc giữ nguyên — chấp nhận; thẻ ghi rõ "bậc kế tiếp đang là WL 2" để QL thấy |
| M-12 | Huỷ cả lượt MTn chỉ khi không còn MT(n+1) hiệu lực (T36) |
| M-13 | MT lịch sử theo ngày tạo lượt, cờ lưu lúc tạo (T34) |
| M-14 | SOS lượt lịch sử ngoài 4 tuần không tính "SOS hiện tại" (M4) |
| M-15 | R-PA4 hàm `weeklyUpdateDue`; R-PA5 có migrate một câu |
| M-16 | Hạn tính cả ngày bắt đầu (T24, T66) |
| M-17 | PA quy chế tới mốc → "Ghi kết quả cuối", không tự đóng im lặng (T22) |
| M-18 | Rút quyền sửa target/lộ trình/lớp của GVCN → "Đề xuất sửa" (T44) |
| M-19 | Hạn thẻ "Quyết định Cuối khoá" = sớm hơn trong hai: ngày khai giảng lớp kế tiếp · hết Chủ nhật tuần sau tuần Cuối khoá (T54) |
| M-20 | Đổi LT ↔ RF = mở lộ trình mới (MT đánh lại từ MT1, Case đang mở chuyển theo) (T71) |
| M-21 | BE/ELE lên FT không đạt kỳ vọng đầu ra (nguyên nhân Trung tâm): tạo Case FT "Kỳ vọng đầu ra chưa đạt · {kỹ năng}" để gắn PA Tutor 10 buổi; W của lớp thường → W2 mặc định |
| M-22 | §4.9 đã thêm |

## 6. Lớp thường theo quy định P. Học thuật

Nguồn: `thiet-ke/nguon-27-09/NGUON_QUY_DINH_LOP_THUONG.md`. Áp cho **Pre FOU, FOU, BE, ELE**; riêng Pre FOU ở §6.6.

### 6.1. Giữ nguyên
- Mức Pass **70%** (đã chạy — `RATIO_PASS_THRESHOLD`).
- Giữa khoá / Cuối khoá, điểm = số câu đúng / tổng số câu, dấu `-` dời tuần sau (C08).

### 6.2. Giữa khoá (Progress Test) — thay mô hình "tín hiệu · Tạo Case / Bỏ qua" (Q-V3-1)

| Mã | Luật |
|---|---|
| N1 | Môn < 70% (FOU: L · R · G+V · P; BE/ELE: L · R · W · S — §5.7) → **tự tạo Case** `Giữa khoá · {môn} không đạt` + **PA Bổ trợ bắt buộc** đến tuần Cuối khoá, ghi "trừ buổi Free". FOU: `2 buổi/tuần` **chung** cho các môn trượt — mỗi Case một dòng PA cùng `nhom_bo_tro`, ghi kết quả một lần chép sang cả nhóm (M-03); người phụ trách + người nộp kế hoạch chung = **người dạy buổi bổ trợ, mặc định GVCN** (**Q-F**). BE/ELE: `1 buổi/tuần/môn`, mỗi Case một PA |
| N2 | GVBM kỹ năng đó xác nhận nguyên nhân như SOS FT (form "Xác nhận Case", YC-12.3) **và** nộp **kế hoạch bài giảng** (nội dung yếu + kế hoạch) → yêu cầu duyệt **Học thuật** cho QL. PA ở trạng thái `Chờ duyệt kế hoạch` → duyệt → `Đang làm` |
| N3 | Tự tạo **việc phối hợp** "Báo phụ huynh qua TVV" (4 nội dung của quy định) cho GVCN; GVCN đánh dấu xong khi đã tạo task trên Base (T45) |
| N4 | Không còn nút "Bỏ qua". "Không cần theo dõi" vẫn có, đi qua QL duyệt như S4-5 |
| N5 | Hạn 3 ngày xác nhận nguyên nhân như FT |

### 6.3. Cuối khoá (Final Test)

| % Cuối khoá (T47) | Hướng web gợi ý | Cần QL? | Web tự tạo |
|---|---|---|---|
| < 50% | Học lại level hiện tại | Không (QL/GVCN xác nhận ở Chuyển tiếp lớp) | Việc phối hợp "Báo phụ huynh qua TVV" (người làm: QL) |
| 50–59% | QL + GV đánh giá: học lại **hoặc** lên level + bổ trợ | **Có** — thẻ "Quyết định Cuối khoá" | Nếu lên: PA bổ trợ miễn phí (FOU: 1 buổi/kỹ năng trượt, 1 buổi/tuần/kỹ năng, 2 tuần) + **Mini Test** sau buổi cuối |
| 60–69% | Lên level + bổ trợ | Không | PA bổ trợ miễn phí (FOU: 1 buổi/kỹ năng trượt, trong 1 tuần) + Mini Test ở buổi 2 |
| ≥ 70% | Pass, tiếp tục lộ trình | Không | — |

- **Luồng màn hình** (ai làm bước nào, ở đâu, web gợi ý gì): bảng 7 bước ở K2 §4(a) — áp nguyên (T71). Case và Mini Test: T70. Lớp thường **không** có nhãn SOS: T58.
- BE → ELE dùng đúng bảng của FOU (quy định mục V).
- **Mini Test**: một ô ghi `% · ngày` ở hồ sơ HV (không phải một loại Test mới trong lịch). Đạt khi ≥ 70% (T47).
  Trượt → thẻ **Báo lên** cho QL.
- "Miễn phí, không tính lương GV" là nhãn của PA (`Bổ trợ miễn phí`), để P. Học thuật và Phòng xếp lịch đếm được.

### 6.4. BE / ELE lên Fast Track — kỳ vọng đầu ra
- **Không** lưu điểm Placement trên web (chủ sản phẩm 27/09). Kỳ vọng đầu ra BE `4.0`, ELE `4.5–5.0` chỉ hiện làm chữ nhắc cho QL khi kết luận.
- Ở Kết luận khoá lên FT, QL đánh dấu **Đạt / Không đạt kỳ vọng đầu ra** + nguyên nhân (T49):
  Trung tâm → web tạo ở lộ trình FT PA `Tutor 10 buổi/kỹ năng không đạt` (tính buổi Free, có lương GV);
  Học sinh → QL ghi phương án case-by-case (chữ tự do) vào Kết luận.

### 6.5. KPI tháng
Phân tích › Theo giáo viên và Theo chi nhánh có cột **"Tỷ lệ pass tháng"** và **"Điểm KPI"** (T50). Tháng = tháng chứa tuần thi; đơn vị = bài đủ môn; theo giáo viên = mọi GV có phân công ở lớp lúc tuần thi (Q-E, M-06). Mọi số bấm
được ra danh sách HS tạo nên nó.

### 6.6. Pre FOU — Pre Foundation (chủ sản phẩm 27/09, T51, T56)

| Mã | Luật |
|---|---|
| PF1 | Chương trình mới `Pre FOU` (Pre Foundation), **không chia môn** (học theo unit), chấm theo tỷ lệ (số câu đúng / tổng số câu) **một điểm tổng hợp**, mặc định **5 tuần**. Quản trị sửa số tuần ở Quản trị › Lộ trình & loại lớp (áp cho lớp tạo **sau** khi sửa; lớp đang học giữ số tuần lúc tạo) |
| PF2 | **Chỉ có một bài Cuối khoá**, ở tuần cuối khoá. Không có Giữa khoá → các luật Giữa khoá (§6.2, quy định mục II) **không áp** cho Pre FOU. Đây là chỗ khác với văn bản quy định (văn bản có Progress Test cho PreFound) — theo chủ sản phẩm |
| PF3 | Cuối khoá theo bảng §6.3 nhưng số buổi riêng của Pre FOU (quy định III.3.1): 50–59% lên level → **4 buổi** miễn phí (2 buổi/tuần, 2 tuần), Mini Test sau buổi 4; 60–69% → **2 buổi** (2 buổi/tuần, 1 tuần), Mini Test ở buổi 2. Không tính theo kỹ năng |
| PF4 | Bậc thang: `Pre FOU → FOU → BE → ELE`; ở mọi bậc vẫn có hướng lên FT (luật 13/09) |
| PF5 | Tên lớp `{CN} Pre FOU {số}`, ví dụ `MB Pre FOU 03` |
| PF6 | Pre FOU dùng **một ô `tong_hop`** ở mọi chỗ: lịch một lượt, nợ điểm, lưới chấm, Kế hoạch Test (chỉ cột Cuối khoá), Lịch Test, hồ sơ (K5-38, K5-39, K4-16). Ô **Tạo lớp** chỉ cho chọn Pre FOU khi PR-MON đã có trong cùng đợt deploy (tránh lớp Pre FOU dựng trên bộ 4 môn) |

---

## 7. Kế hoạch UX/UI (impeccable + taste-skill)

### 7.1. Bản tóm tắt thiết kế (impeccable `shape`)

- **Ai dùng, lúc nào:** GVBM nhập điểm và theo Case của môn mình (laptop ở trung tâm, điện thoại giữa hai tiết);
  GVCN theo dõi cả lớp, xử lý vi phạm; QL duyệt, nhìn chi nhánh; Quản trị cấu hình. Tiếng Việt, nền tối là thói quen.
- **Chế độ:** **Operate** — người dùng đang làm việc; độ tin cậy và tốc độ quét quan trọng hơn biểu cảm.
- **Kết quả mong muốn:** mở màn nào cũng thấy ngay (1) điều quan trọng nhất và (2) một nút cho việc tiếp theo.
- **Hướng thiết kế:** **tinh chỉnh thế giới đang có** (không thiết kế lại): giữ nền xanh mực, thang SOS vàng/cam/đỏ,
  4 màu điểm, khuôn `KhungPanel`. Thêm: chế độ sáng, một font thật, hệ ba tầng thông tin, ngữ pháp trạng thái.
- **Không làm:** hiệu ứng chuyển động trang trí, gradient, card lồng card, modal khi panel bên là đủ, màu mới cho
  từng khu.
- **Ràng buộc:** mọi luật "tinh tế" của chủ sản phẩm (dấu nhỏ gọn, cột/hàng thẳng, không dồn chữ); 375 px; bàn phím.

### 7.2. Chọn skill cho session code

| Skill | Dùng ở PR | Để làm gì |
|---|---|---|
| impeccable `clarify` | PR-N1, PR-NHAP, PR-SOS, PR-YT4 | Câu báo lỗi, nhãn nút, chữ trạng thái |
| impeccable `distill` | PR-YT4, PR-HVL, PR-VAI | Bỏ badge/bộ lọc thừa, một nút chính mỗi vùng |
| impeccable `layout` | PR-HSM, PR-HVL, PR-XLMT | Phân cấp, nhịp khoảng cách, căn cột |
| impeccable `colorize` | PR-SANG, PR-HSM | Nhấn màu có chủ đích (trị "đơn điệu" — yêu cầu 14), bảng màu sáng |
| impeccable `adapt` | PR-UXD | Bảng → thẻ dưới 640 px |
| impeccable `audit` + `polish` | cuối mọi PR giao diện | Kiểm a11y, tương phản, trạng thái; một lượt chau chuốt |
| taste-skill `redesign-skill` | PR-SANG, PR-NEN | Bảng kiểm: font, `tabular-nums`, độ đậm 500/600, hover/active/focus, trạng thái rỗng/lỗi |
| **Không dùng** | — | taste-skill bộ chính / `gpt-tasteskill` / `soft-skill` (thiên landing page, chuyển động GSAP), `minimalist-skill` (bảng màu ấm đơn sắc đánh nhau với màu SOS), `brutalist-skill`, nhóm vẽ ảnh |

Trước khi dùng impeccable trong repo: chạy `/impeccable init` (viết `PRODUCT.md` từ §7.1) và `/impeccable document`
(viết `DESIGN.md` từ `HE_GIAO_DIEN.md` + `index.css`), thêm `.impeccable/` vào `.gitignore` — làm ở PR-NEN Task 0.

### 7.3. Ngữ pháp trạng thái (áp dần trong mọi PR giao diện)
Một dòng = **một** nhãn trạng thái chính (`Cần làm · Đang làm · Chờ duyệt · Quá hạn · Xong · Đã huỷ`) + hạn viết
bằng chữ + người phụ trách bằng tên. Chi tiết và ví dụ: `thiet-ke/BRAINSTORM_FEEDBACK_2026-09-27.md` mục C.2.
Màu điểm và mức SOS là hệ riêng (không đổi).

### 7.4. Token

**Chữ** (Be Vietnam Pro, `tabular-nums` cho mọi số):

| Vai | Cỡ | Độ đậm |
|---|---|---|
| Số chính ở hồ sơ Mock, ô đầu hồ sơ | 28 / 20 px | 700 |
| Tiêu đề trang / khối | 20 / 16 px | 700 / 600 |
| Nội dung, số trong bảng | 14 px | 400 / 500 |
| Phụ (không dùng cho kết quả, hạn, người phụ trách) | 12 px | 400 |
| Nhãn nhỏ (`Nhan`) | tối thiểu 11.5 px | 600 |

**Chế độ sáng** — mọi màu đi qua biến CSS; giá trị đề xuất (session code chỉnh cho đạt ≥ 4.5:1 bằng phép kiểm):

| Token | Tối (đang có) | Sáng |
|---|---|---|
| Nền trang | `#0c1220` | `#f5f7fa` |
| Bề mặt / bề mặt 2 | `#141d2f` / `#1a2437` | `#ffffff` / `#eef1f5` |
| Viền | `rgba(160,178,214,.14)` | `rgba(15,23,42,.12)` |
| Chữ chính / phụ | `#dde5f2` / `rgb(147,163,192)` | `#0f172a` / `#475569` |
| Nhấn (nút chính, đang chọn) | `#7db3f0` | `#1d5fbf` |
| SOS 1 · 2 · 3 (chữ / nền) | vàng · cam · đỏ hiện tại | `#8a5a00/#fdf1cf` · `#b4400f/#fde6d8` · `#b42323/#fde2e2` |
| Đạt | `rgb(111,220,159)` | `#157a42/#dcf3e5` |

### 7.5. Ba tầng thông tin (yêu cầu 14 "nổi bật hơn, không ngợp")

| Tầng | Là gì | Cách trình bày |
|---|---|---|
| **1** | con số / quyết định: điểm, mức SOS, việc quá hạn, việc tiếp theo, số chờ duyệt | 16–28 px, đậm, màu nghĩa |
| **2** | tên, mô tả | 14 px, chữ chính |
| **3** | metadata: người nhập, giờ, mã, công thức | 12 px, chữ phụ, **ẩn được** trên điện thoại |

Mỗi màn trong PR phải ghi "tầng 1 của màn này là: …" trong mô tả PR. Ví dụ: hồ sơ Mock → 4 điểm kỹ năng + Overall;
Học viên & Lớp → mức SOS + việc tiếp theo; hộp Chờ duyệt → hạn duyệt.

### 7.6. Thành phần dùng chung mới

| Thành phần | Thay cho | PR |
|---|---|---|
| `ONgay` (ngày · tuần · tháng · ngày-hoặc-tháng) | 17 ô ngày trình duyệt + 3 bộ chọn thả xuống | PR-NEN |
| `OKhac` | mỗi nơi tự làm "Khác" | PR-NEN |
| `ChonNguoi` (mở danh sách ngay) | bản cũ bắt gõ 3 ký tự | PR-NEN |
| `NhanTrangThai` | chữ trạng thái tự đặt ở từng khu | PR-NEN (dựng) → các PR sau (dùng) |
| `TheYeuCau` + `HopChoDuyet` | các chỗ duyệt rời rạc | PR-DUYET |
| `HangCase` / `HangPA` | `TheCase` / `KhoiPhuongAn` cùng màu | PR-SOS |
| `ODiemLon` (ô điểm lớn + 4 ô tiêu chí + sửa tại chỗ) | bảng dòng chữ ở hồ sơ Mock | PR-HSM |
| `ToastHoanTac` | thao tác ghi ngay không hoàn tác | PR-N1 (gói UX-C C1) |

### 7.7. Mockup — `thiet-ke/mockup/19-nang-cap-27-09.html`

| Mã | Nội dung | Nằm ở |
|---|---|---|
| M1 | Tạo lớp (kiểu lớp, xem trước tên, phân công một người mỗi ô) | Học viên & Lớp › + Lớp mới |
| M2 | Thêm học viên (cột mới, cột Tình trạng, dòng chi tiết) | Hồ sơ lớp › + Học viên |
| M3 | Dòng kết quả gần nhất + cột đề xuất "Sắp tới" | Học viên & Lớp › bảng |
| **M4** | **Cần hỗ trợ — 4 hàng theo kỹ năng** (yêu cầu 11.3.1) | Hồ sơ lớp › Học viên › Cần hỗ trợ |
| M5 | Phân tích lớp mở rộng một kỹ năng | Hồ sơ lớp › Phân tích lớp |
| M6 | Ý thức lớp hai khung + panel Xác nhận xử lý | Hồ sơ lớp › Ý thức & Phối hợp |
| M7 | Case/PA phân biệt + form Xác nhận Case | Hồ sơ HV › Học thuật |
| M8 | Hộp Chờ duyệt có phân loại | Công việc › Chờ duyệt (QL) |
| M9 | Xếp lịch MT mới | Test › Kế hoạch Test › Xếp lịch MT |
| M10 | Hồ sơ Mock mới | Test › một lượt MT |
| M11 | Xuất Excel kết quả MT | Test › Kế hoạch Test › Xuất Excel |
| M12 | Ô ngày, ô Khác, ô chọn người, nút sáng/tối | toàn web |

### 7.8. Xuất Excel kết quả Mock Test — thiết kế và luồng (yêu cầu 13.9)

**Luồng:** Test › Kế hoạch Test › nút **Xuất Excel** (cũng có ở Phân tích › Tổng hợp Test) → ngăn bên phải:

1. **Phạm vi**: Chi nhánh (chọn nhiều; QL một chi nhánh thì chọn sẵn) → Lớp (chọn nhiều, lọc theo chi nhánh đã chọn;
   để trống = mọi lớp).
2. **Thời gian**: chọn một trong ba — *Theo tuần* (từ tuần … đến tuần …, ô tuần thống nhất) · *Theo tháng* ·
   *Theo đợt* (MT1…MT8, chọn nhiều). Các điều kiện **cộng dồn** (ví dụ "chi nhánh MB" + "W1–W4 SEP").
3. **Chỉ lượt**: `Đủ điểm` / `Mọi lượt` (mặc định Mọi lượt).
4. **Cột**: *Gọn* (mã, tên, lớp, MT, tuần, L, R, W, S, Overall, kỳ vọng, SOS) / *Đầy đủ* (+ W1, W2, 4 tiêu chí W và
   S, nhận xét W/S, GV chấm, tuần thi từng kỹ năng, người nhập).
5. **Xem trước** (luôn hiện, cập nhật khi đổi lọc): `312 lượt · 87 học viên · 6 lớp` + 5 dòng đầu.
6. **Xuất** → tệp `Pisa-Tracking_MT_{phạm vi}_{khoảng}.xlsx`: sheet `Kết quả` (một dòng = em × MT), sheet `Bộ lọc đã
   dùng` (ai xuất, lúc nào, điều kiện).

Máy chủ trả dữ liệu đã lọc theo quyền (T40); trình duyệt dựng tệp bằng thư viện `xlsx` sẵn có. Mỗi lần xuất ghi nhật ký.

---

## 8. Kế hoạch PR — 6 đợt

Luật chung: mỗi PR một nhánh, **không tự merge**; người rà **Opus 5.5** ở session riêng (T52); subagent cùng model,
**không Haiku**; `npm run check` **một lần, ở foreground**, sau mỗi task; bấm thử theo vai + 375 px + ảnh trước/sau ở
cuối PR (`thiet-ke/anh/<ma-pr>/`); PR có migrate → migrate **DB THỬ** trước deploy nháp. Kế hoạch chi tiết từng PR
soạn **ngay trước đợt của nó** (mã đổi sau mỗi lần merge).

Cổng thử cho các làn song song: **A 4157/5357 · B 4167/5367 · C 4177/5377 · D 4187/5387** (không dùng 4000/5173).

| Đợt | Làn | PR | Nội dung (mã yêu cầu) | Migrate | Model code (B) | Phụ thuộc |
|---|---|---|---|---|---|---|
| **1** | A | **PR-N1** Sửa lỗi nóng + sửa sai sự thật | YC-6, 11.1, 11.3.2 (sửa nhanh), 12.1 (tạm), 12.5.1, 12.5.2, 12.5.4; **§5.6 hạn PA hết Thứ Hai**; gói **UX-A** A1–A9; UX-C **C1** (Toast hoàn tác); **S4-1 phần gán tự động PA quy chế** (PA chạy ngay, 🔒 theo quy chế, GVBM chỉ còn xác định nguyên nhân — chủ sản phẩm 28/09) | Có (nhỏ): PA quy chế chờ xác nhận → đang chạy (S4-1) + dời `action_due` CN → T2 (R-PA5) | Sonnet 5 · High (Fable 5.1 · High) | — |
| 1 | B | **PR-LOP** Tạo lớp · tên lớp · RF · **Pre FOU** · phân công | YC-1, 2, 3 (danh mục + tên), 4; T1–T7; §6.6 PF1, PF4, PF5 (chương trình Pre FOU, số tuần sửa được) | **Có** (`server/src/migrate/prLop.ts`: đổi tên lớp, thêm lộ trình RF, chương trình Pre FOU; cột `classes.so_tuan/tuan_giua_khoa/tuan_cuoi_khoa` (chụp số tuần lớp cũ); chỉ mục mã lớp chuẩn hoá `ux_classes_ma_chuan` khi dữ liệu sạch. Tạo lớp Pre FOU mở bằng cờ `CHO_TAO_PRE_FOU` ở PR-MON) | Fable 5.1 · High (Opus 5.5 · High) | — |
| 1 | C | **PR-NEN** Nền giao diện | YC-8, 9, 10; T11–T14; UX-E **E1, E2, E3, E6**; UX-B **B3**; `NhanTrangThai`; impeccable init/document | Không | Fable 5.1 · High (Opus 5.5 · High) | — |
| **2** | A | **PR-DUYET** Hộp Chờ duyệt | §5.5; T41–T44; chuyển "Duyệt dời lịch" + "Đề xuất PA" vào hộp | **Có** (bảng yêu cầu duyệt) | Opus 5.5 · High (Fable 5.1 · High) | N1, NEN |
| 2 | B | **PR-MT** Lịch MT tự tạo · HS cũ · đánh số · RF · dời lần 2 | YC-13.1, 13.2, 13.3, RF kỳ vọng; §5.2 M1–M8; T33–T36 | **Có** | Opus 5.5 · XHigh (Fable 5.1 · High) | LOP |
| 2 | C | **PR-NHAP** Thêm học viên | YC-5.1–5.4; T8, T9; UX-C **C10** | **Có** (email, ngày thi) | Sonnet 5 · High (Fable 5.1 · High) | NEN (dùng `ONgay`); gọi hàm tạo MT của PR-MT (merge MT trước) |
| 2 | D | **PR-MON** Hệ môn học + hai khung FT / Lớp thường | §5.7 MH1–MH9; T55–T57; Pre FOU nhập điểm Cuối khoá một ô (lưới lớp thường, điện thoại); công tắc hai khung ở Test (Lịch Test, Kế hoạch Test) và bộ lọc Công việc | Có (ô `tong_hop`, nhãn môn theo chương trình trong danh mục) | Fable 5.1 · High (Opus 5.5 · High) | LOP (chương trình Pre FOU) |
| **3** | A | **PR-SOS** SOS v4 + Case/PA | YC-12.1–12.5.3; §5.3; T20–T23; **§3.1d Q28-1…5** (gợi ý mô tả PA, PA quy chế chờ xác nhận, bỏ Dự kiến kết thúc, trạng thái Case); S4-1 phần còn lại (xem "Chuyển cho PR-SOS" trong kế hoạch PR-N1); UX-B **B1, B2**; UX-C **C5, C6** | Có (nhỏ) | Fable 5.1 · High (Opus 5.5 · High) | DUYET |
| 3 | B | **PR-YT4** Ý thức v4 | YC-11.4, 11.3.2 (dựng lại), 12.6.1–12.6.4; §5.4; T25–T32; UX-B **B7**; UX-D **D5** | **Có** (loại xử lý, trạng thái vi phạm, bậc khai trước) | Opus 5.5 · XHigh (Fable 5.1 · High) | DUYET |
| 3 | C | **PR-XLMT** Xếp lịch MT + thao tác MT | YC-13.4, 13.6; T37, T38; UX-C **C3, C4** | Không | Fable 5.1 · High (Opus 5.5 · High) | MT |
| **4** | A | **PR-HSM** Hồ sơ Mock + chấm W/S | YC-13.5, 13.7, 13.8; T39; UX-C **C2, C9**; UX-E **E5, E8**; UX-F **F8** | **Có** (nhận xét, GV chấm) | Fable 5.1 · High (Opus 5.5 · High) | XLMT |
| 4 | B | **PR-HVL** Học viên & Lớp + hồ sơ lớp | YC-11.2, 11.3.1, 11.3.3; T18, T19; UX-B **B4, B8, B9**; UX-D **D2** | Không | Sonnet 5 · High (Fable 5.1 · High) | YT4 (tab lớp) |
| 4 | C | **PR-XUAT** Xuất Excel MT | YC-13.9; §7.8; T40 | Không | Sonnet 5 · High (Fable 5.1 · Medium) | HSM (cột nhận xét) — hoặc chạy sau HSM |
| 4 | C′ | **PR-SANG** Sáng/tối + font | YC-7, 14 (nền); T15, T16; UX-E **E4, E9** | Không | Sonnet 5 · High (Fable 5.1 · High) | chạy **sau cùng đợt 4** (chạm nhiều file) |
| **5** | A | **PR-LT2a** Lớp thường · Giữa khoá | §6.2; T45, T46, T70 (tín hiệu cũ); Q-F | **Có** (loại PA `bo_tro`, `nhom_bo_tro`, `bao_ph_tvv`; tín hiệu cũ → Case) | Opus 5.5 · XHigh (Fable 5.1 · High) | DUYET, SOS, MON |
| 5 | C | **PR-LT2b** Lớp thường · Cuối khoá | §6.3–§6.5; T47–T50, T58, T70, T71 | **Có** (`mini_test`, cột kết luận lên FT) | Opus 5.5 · XHigh (Fable 5.1 · High) | LT2a, NHAP |
| 5 | B | **PR-GV** Hồ sơ GV + Theo giáo viên + KPI | việc cũ PR-GV (23/09 §B) + §6.5 | Không | Fable 5.1 · High (Opus 5.5 · High) | LT2b (KPI) — phần hồ sơ GV chạy song song được |
| **6** | A | **PR-VAI** Tổng quan theo vai + hồ sơ HV 30 giây + đường dẫn sâu | Brainstorm E.1, E.3, E.4 (đường dẫn), T53 Q8; UX-B **B5, B6** | Không | Fable 5.1 · High (Opus 5.5 · High) | các đợt trước |
| 6 | B | **PR-UXD** Điện thoại | UX-D còn lại (D1, D3, D4, D6–D9) | Không | Fable 5.1 · High (Opus 5.5 · High) | VAI |
| 6 | C | **PR-UXF** Số liệu khớp | UX-F F1–F7; T53 Q2 | Không | Opus 5.5 · High (Fable 5.1 · High) | — |
| 6 | D | **PR-Pb2** Phân tích còn lại + **bỏ Danh sách Case** | T59, T60 (Phân tích), T61; kiểm kê 23/09 §B | Không | Fable 5.1 · High (Opus 5.5 · High) | DUYET, SOS |
| sau | — | **PR-S3** chữ cuối · **PR-Dọn** lỗi nhỏ | kiểm kê 23/09 §B, §C | Không | Sonnet 5 · High | — |

**Migrate (K5 §5):** PR-N1 có một câu dời hạn PA sang Thứ Hai (R-PA5); PR-MON đổi kỹ năng phụ trách `writing` → `writing1` + `writing2`; PR-SOS thêm `sos_cases.han_xac_nhan`; PR-DUYET thêm quyền `request.approve`; mỗi PR một file migrate (T78). Khoảng 10 lệnh phải **chạy thử in danh sách trên bản chính** trước (bảng K5 §5). Thứ tự bắt buộc: LOP → MON; DUYET → SOS, YT4, LT2a; MT → NHAP; N1 → SOS, LT2a.

**Deploy:** sau mỗi đợt, deploy gộp một lần (quy trình `TRIEN_KHAI.md`): sao lưu → migrate DB THỬ → nháp → bấm thử →
migrate DB CHÍNH → `--prod`. Đợt 2 có **lệnh bổ sung MT** (T35) cần chủ sản phẩm duyệt danh sách.

**Tách thêm PR?** Chỉ tách PR-YT4 nếu lúc soạn kế hoạch thấy phần migrate dữ liệu cũ (T32) phức tạp → PR-YT4a (luật +
migrate) và PR-YT4b (giao diện). Các PR còn lại để nguyên vì chạm cùng bộ file.

---

## 9. Kế hoạch cũ chưa làm → ghép vào đâu

| Nguồn | Mục | Ghép vào |
|---|---|---|
| UX 26/09 · UX-A | A1–A9 | PR-N1 (A5 theo T53 Q1) |
| UX-B | B1, B2 → PR-SOS · B3 → PR-NEN · B4, B8, B9 → PR-HVL · B5, B6 → PR-VAI · B7 → PR-YT4 | |
| UX-C | C1 → PR-N1 · C2, C9 → PR-HSM · C3, C4 → PR-XLMT · C5, C6 → PR-SOS · C7, C8 → PR-Dọn · C10 → PR-NHAP | |
| UX-D | D2 → PR-HVL · D5 → PR-YT4 · còn lại → PR-UXD | |
| UX-E | E1, E2, E3, E6 → PR-NEN · E4, E9 → PR-SANG · E5, E8 → PR-HSM · E7 → PR-HVL | |
| UX-F | F1–F7 → PR-UXF · F8 → PR-HSM | |
| UX 26/09 câu treo | Q1, Q2, Q4–Q8 | T53 |
| Kiểm kê 23/09 §B | PR-GV → đợt 5 · PR-Pb2, PR-S3 → sau | |
| Kiểm kê 23/09 §C | PR-Dọn (lỗi nhỏ) → sau; riêng `thongTinLop.ts:31` (trùng mã lớp hoa/thường) → PR-LOP; "Chưa phân loại" `vanDe.ts:83` → PR-UXF | |
| Kiểm kê 23/09 · câu treo | GVCN không dạy môn đó không nhập bù Case môn đó (C02) | **Giữ C02**. Khác với M3 (điểm MT lịch sử): M3 là điểm, C02 là Case |
| Kiểm kê 23/09 §D (hoãn có chủ ý) | taxonomy, I01–I26, AN-14… | vẫn hoãn |

---

## 10. Nghiệm thu chung

### 10.1. Mỗi PR
- Mọi mục của PR có dòng trong mô tả PR: mã YC/T → ảnh trước/sau → đạt/không.
- Không chữ máy lọt ra (mã kỹ thuật, ngày ISO, lệnh npm) — phép kiểm quét chữ của UX-A.
- Luật thuần mới có phép kiểm trong `server/src/tests/`.
- Trước khi báo xong: không còn `npm run check` chạy chồng.

### 10.2. Bảng kiểm "toàn web" (PR-NEN phải đi hết, các PR sau không được thêm chỗ mới sai)
- **Ô ngày**: mọi chỗ ở YC-9 cột Hiện trạng + mọi form mới của đợt 2–5.
- **"Khác"**: phân loại nguyên nhân · PA đề xuất · lý do Không cần theo dõi · Phối hợp SOS (loại việc + lý do bỏ) ·
  nhóm vi phạm · xử lý ngoài thang · lý do chuyển lớp / kết thúc học · báo cáo tutor · loại việc Vận hành · lý do
  từ chối duyệt.
- **Chọn người**: người thực hiện PA (4 form) · người thực hiện xử lý Ý thức · Phối hợp SOS · người phụ trách Vận
  hành · bộ lọc phụ trách · GV chấm Speaking.

### 10.3. Dữ liệu demo

Mỗi PR thêm vào bộ demo (`npm run seed`) đúng các kịch bản của mình trong bảng **K5 §6** (18 kịch bản: em dời lần 2 chờ QL, em RF, lớp Pre FOU, HS cũ có MT lịch sử, Case chờ QL duyệt không theo dõi, em bắt buộc xử lý Ý thức, em ở bậc WL 2…), để chủ sản phẩm nhìn thấy luật mới trên bản demo.

### 10.4. Kịch bản học sinh cũ (YC-15a)

| # | Kịch bản | Phải thấy | PR |
|---|---|---|---|
| H1 | Thêm HS FT bắt đầu cách đây 22 tuần | MT1–MT3 "MT lịch sử", không việc Nhập điểm quá hạn | PR-MT |
| H2 | GVCN nhập đủ 4 kỹ năng MT2 lịch sử có SOS 2 (tuần thi cách 10 tuần) | Lưu điểm + SOS 2, **không** tạo Case | PR-MT |
| H3 | Nhập MT3 lịch sử có SOS (tuần thi cách 2 tuần) | Tạo Case + PA quy chế + Phối hợp SOS | PR-MT |
| H4 | HS RF mới | MT1 tuần 4, MT2 tuần 8, kỳ vọng = target | PR-MT |
| H5 | HS cũ đã từng bị Report 2 ngoài đời | GVCN khai "đã xử lý: bậc 2" → lần xử lý kế tiếp là WL 1 | PR-YT4 |
| H6 | HS cũ chưa có email | Không badge Thiếu thông tin; Thông tin HV ghi "chưa có email" | PR-NHAP |
| H7 | HS FT đã có trên bản chính, chưa có lượt MT | Có trong danh sách chạy thử của `bo-sung-mt-mac-dinh` | PR-MT |

---

## 11. Chủ sản phẩm cần làm

1. Xem **§3.1c** (6 câu Q-A…Q-F đang theo khuyến nghị) — đổi câu nào thì báo.
2. Đọc §3.2, gạch dòng không đồng ý (đặc biệt các dòng ⚠: T4, T16, T18, T47, T50, T54).
3. Mở `thiet-ke/mockup/19-nang-cap-27-09.html` — xem M4 (Cần hỗ trợ) và chọn có thêm cột "Sắp tới" (M3) hay không.
4. Báo "duyệt đặc tả" → session planning soạn kế hoạch chi tiết **đợt 1** (PR-N1, PR-LOP, PR-NEN) và đưa 3 prompt.
5. Trước đợt 1 deploy: cho biết trên bản chính có lớp nào "tàng hình" đã lỡ tạo (T7) — hoặc để session code liệt kê.
