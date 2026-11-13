# Overhaul V6 — đề xuất bản 1 (ĐỀ XUẤT, chờ chủ SP)

PTA Overhaul viết 13/11 sau khi: đọc bản ChatGPT (`nguon/`), đọc kỹ luật (`luat/0`–`4`), rút ý đồ 4 lần deploy gần nhất (`luat/5`), tự bấm bản thử theo vai GVCN · GV Speaking · QL.
Chưa có gì ở đây là đã duyệt, trừ các dòng ghi **[ĐÃ CHỐT]** (lời chủ SP ở `loi-chu-sp.md`).

## 0. Đề bài (lời chủ SP 13/11)

GV thật: "không biết thao tác ở đâu như thế nào, cần phải làm gì, nhập điểm chỗ nào, thấy UX/UI loạn và khó theo dõi, nhiều cái thừa thãi". Luật và logic ổn, giữ. Web hiện tại là nền có ý đồ — chỉ sửa UI/UX; GV chưa thuộc quy chế nên web phải hỗ trợ nhiều hơn.

## 1. Chẩn đoán: web có đủ thứ, sai ở cửa vào và thứ tự

| GV hỏi | Web đang có | Vì sao GV vẫn không thấy |
|---|---|---|
| "Tôi cần làm gì?" | Trang Công việc: việc chia tab, có hạn, làm tại khung phải | Trang đầu là Tổng quan (số liệu); việc nằm sau một ô số "Việc của tôi ›" |
| "Nhập điểm chỗ nào?" | Bảng "Kỹ năng tôi dạy" có cột Chờ chấm + hạn; nhóm "Lớp tôi dạy" ở Công việc; nút Nhập điểm ở hồ sơ lớp; trang Test | ~7 lối, không lối nào là "cửa chính"; cột Chờ chấm là cột cuối của bảng số liệu, không có nút; "Lớp tôi dạy" gập ở cuối trang |
| "Ghi vi phạm / báo tình hình ở đâu?" | Nút trong tab Ý thức & Phối hợp của hồ sơ lớp / hồ sơ HV | Theo luật đây là việc GV **tự khởi xướng**, không việc nào nhắc — mà nút lại nằm sâu 2–3 lần bấm |
| "Việc này làm sao, theo quy chế nào?" | Nhiều panel đã ghi luật tại chỗ ("Case cần ít nhất 1 PA trước hạn…", "Hết hạn: giữ quyết định GVCN") | Chưa đồng bộ: panel có, panel không; mỗi nơi một kiểu chữ |
| "Loạn, thừa" | Luật mật độ M1–M10 (05/11) đã áp Công việc và vài màn | Các màn khác chưa áp; cùng một việc hiện 5 nơi bằng 4–6 dáng dòng khác nhau; số đếm có chỗ tự mâu thuẫn ("0 việc" cạnh "1 quá hạn") |

Kết luận: **không dựng lại** — đưa phần đang có lên đúng chỗ, thống nhất dáng, cắt phần không phục vụ người đang xem.

## 2. Mẫu C bản 2 — trang đầu của GV [khung ĐÃ CHỐT ở lời 6, chi tiết là đề xuất]

- **Trang đầu của GV = chính trang Công việc** (giữ tab hạng mục + badge, danh sách trái, làm ở khung phải — đúng mockup v12 / v17 đã duyệt).
- **Khung phải khi chưa chọn việc** (nay là ô trống "Chọn một việc ở danh sách") = **"Lớp của tôi"**: mỗi lớp một dòng — mã lớp · tôi dạy gì / chủ nhiệm · tình trạng Test theo luật · số việc của tôi ở lớp.
  - Lớp đang có bài của tôi: "MT tuần này · 6 bài · hạn 20/11" + nút **Nhập điểm** (mở đúng panel nhập của tuần đó).
  - Lớp chưa tới tuần Test: chỉ ghi "Final · W3 OCT". **Không có nút.**
  - GVCN không dạy kỹ năng nào: không bao giờ có nút Nhập điểm.
  - Bấm mã lớp = mở hồ sơ lớp.
- **Nút "+ Ghi"** ở đầu trang: Ghi vi phạm / nhắc nhở · Báo tình hình cho TVV · + Case. Chọn em (gõ tên) rồi ra đúng form đang có.
- **Không có** "Đang chờ người khác" [ĐÃ CHỐT lời 6]. Nhóm "Yêu cầu của tôi" hiện có giữ nguyên chỗ cũ (gập, cuối danh sách).
- Số liệu của GV (Đạt kỳ vọng, Tiến bộ, Kỹ năng tôi dạy, Lớp tôi chủ nhiệm) → **Hồ sơ GV** (đã có trang, cùng nguồn số).
- Menu GV: **Công việc · Học viên & Lớp · Test** (bỏ mục Tổng quan cho GV).
- 375: trang đầu = danh sách việc; "Lớp của tôi" là khối ngay dưới các tab.

## 3. Các vai khác — cùng nguyên tắc "mở web là thấy việc của mình"

| Vai | Trang đầu | Mức đổi |
|---|---|---|
| GV / GVCN | Công việc + Lớp của tôi (mục 2) | Lớn (cửa vào), vừa (từng màn) |
| TVV | Công việc (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ) + khung phải "HV của tôi"; 5 ô số Tổng quan thành một dải mỏng đầu trang | Vừa |
| Admin văn phòng | Giữ Tổng quan hiện tại (Lượt MT tuần này · Bài chưa nhập · GV chấm quá hạn · Lịch sắp tới) — đã là trang làm việc | Nhỏ |
| QL | Giữ Tổng quan (Lớp cần chú ý · Giáo viên · Chờ bạn duyệt) — đã chắc | Nhỏ: đồng bộ dáng |
| Quản trị · CX | Giữ Tổng quan chi nhánh | Nhỏ |

## 4. Nhóm 1 — Nên có (không đụng luật)

| # | Đề xuất | Trước → Sau | Phục vụ luật / việc | Ý đồ cũ giữ thế nào |
|---|---|---|---|---|
| 1.1 | Khung phải Công việc hiện "Lớp của tôi" | Ô trống → danh sách lớp + tình trạng Test + nút Nhập điểm đúng lúc | B2, B3 | Khung trái / phải v12 giữ nguyên; chọn việc thì panel thay vào như nay. (07/11 bạn giữ khung này khi có đề xuất BỎ nó — đây là lấp nội dung, không bỏ) |
| 1.2 | Nút "+ Ghi" một cửa | 3 nút ở 3 nơi → một nút ở trang đầu, hồ sơ lớp, hồ sơ HV | D1, D5, C (Case tay) | Nút trong tab Ý thức và "+ Case" đầu hồ sơ vẫn còn; form giữ nguyên |
| 1.3 | Một dáng dòng việc ở mọi nơi | Công việc · dải việc hồ sơ lớp · thanh việc hồ sơ HV · chuông: 4–6 dáng → một thành phần, cùng mở panel việc | A7 | Dáng dòng v12 (S1–S13) là chuẩn; hồ sơ HV thêm việc Nhập điểm, Tình hình đang thiếu; chuông mở thẳng việc |
| 1.4 | Dòng "theo quy chế" thống nhất ở mọi panel việc | Có chỗ có, chỗ không → một dòng cố định trên nút chính: mặc định là gì · lưu xong ai nhận, hạn nào · chọn khác thì sang QL mấy ngày | C5, D3 | Đúng loại "lưu ý cần thiết" bạn cho giữ 07/11; không thêm đoạn chú thích tĩnh; chi tiết ở ⓘ / "?" |
| 1.5 | Tên việc = động từ + đối tượng, đúng hành động của nút | "Mở Phối hợp SOS" (thực ra mở panel tại chỗ)… → tên đúng | — | Bảng thuật ngữ §21.4 giữ |
| 1.6 | Speaking chấm chéo [ĐÃ CHỐT lời 11] | Danh sách phẳng theo tên em → một việc chung, panel gom tuần Test → lớp, cùng lưới nhập; đầu tab "Việc chung của nhóm GV Speaking · n bài" | B4, N39 | Tab riêng giữ; một việc chung (OV-14c) giữ; luật đếm 09/11 giữ |
| 1.7 | "GV chấm S" lưu ở máy chủ | Nhớ trên từng máy → nhớ theo lớp × tuần, đổi máy vẫn còn | B4 | Thao tác không đổi |
| 1.8 | Hộp nhập điểm FT gọn chân | Tới 7 nút → nút chính "Lưu · bài tiếp ›" + "Vắng"; phần còn lại vào một nhóm phụ | B3, B6, B7 | Mọi thao tác còn (D.V12); không đổi cách nhập |
| 1.9 | Hồ sơ lớp: đầu trang gọn + nút đúng người | 5 hàng đầu trang → 2 hàng; "Nhập điểm" chỉ hiện với người có ô để nhập (hoặc quyền nhập hộ) | B3, A2 | Dải "Việc của tôi" (11/11), ⋯ dòng (v8), tab Báo cáo PH giữ |
| 1.10 | Áp luật mật độ M1–M10 cho MỌI màn còn lại | Mới áp Công việc + vài màn → Hồ sơ lớp, Hồ sơ HV, Học viên & Lớp, Test, Phân tích, Quản trị | — | Bố cục từng màn theo mockup đã duyệt; chỉ sửa chữ, độ đậm, lặp, dáng trường |
| 1.11 | Làm nốt việc đồng bộ đang dở | Tab Ý thức hồ sơ HV theo kiểu tab lớp · ô số hộp ở Tổng quan / hồ sơ lớp · tên ở đầu panel là link | — | Đã ghi "để sau" ở plan.md |
| 1.12 | Một bộ thành phần | 2 thanh tab, 2 menu thả, 2 dải chỉ số, 2 kiểu lịch sử → mỗi loại một | — | Không đổi hình |
| 1.13 | Trang đầu TVV = Công việc + "HV của tôi" | Tổng quan 5 ô số (nhiều ô 0) → việc trước | A5 | 5 chỉ số còn, thành dải mỏng |
| 1.14 | Sửa chữ tài liệu theo lời mới | Rulebook, plan.md 1.6 còn ~20 chỗ cũ | — | Chỉ tài liệu |

## 5. Nhóm 2 — Đụng luật hoặc lời đã chốt (mỗi dòng cần bạn đồng ý riêng)

| # | Bạn đã bảo | Tôi định làm | Vì sao tôi thấy nên đổi |
|---|---|---|---|
| 2.1 | "Trang đầu mọi vai = Tổng quan tình hình, không form làm việc" (V10, 22/10); sáng 13/11 "Không cần đổi tổng quan nữa" | GV và TVV vào thẳng Công việc; Tổng quan của hai vai này bỏ, số liệu sang Hồ sơ GV / dải mỏng | GV thật không biết cần làm gì; Tổng quan GV chỉ có số, việc ở sau một lần bấm. Bạn đã nói "mẫu C ổn" — ghi lại đây cho đủ |
| 2.2 | Thứ tự menu Tổng quan → HV & Lớp → Test → Công việc → Phân tích (20/10) | GV: Công việc · Học viên & Lớp · Test. Vai khác giữ | Hệ quả của 2.1 |
| 2.3 | Việc "Điền Target" giao GVCN (đang chạy); Target chỉ QL / TVV / CX sửa | Bỏ việc này khỏi GVCN; để TVV giữ (đã nằm trong "Bổ sung hồ sơ thiếu"); GVCN chỉ thấy nhắc "Em chưa có Target" kèm "Đề xuất sửa" | Việc người nhận không tự làm xong được; cùng một chỗ thiếu đang giao hai người |
| 2.4 | 09/11 "Chấm hộ thì tính cho GV phân công" — nhưng S chấm chéo không có GV phân công; nay QL nhập hộ không chọn ai thì máy ghi QL là người chấm | Khi người nhập không phải GV Speaking: **bắt chọn "GV chấm"** trước khi lưu (một ô, nhớ theo lớp × tuần) | Đúng tinh thần "điền tên người chấm thì tính cho GV đó"; hết cảnh ghi nhầm QL |
| 2.5 | Quyền chấm S: có kỹ năng S trong hồ sơ HOẶC đang dạy S lớp FT (N7). Sổ đếm + ô chọn người chấm: chỉ người có kỹ năng trong hồ sơ | Dùng MỘT định nghĩa (theo quyền N7) ở cả ba nơi | Hai định nghĩa làm số "S chéo chung" và danh sách chọn lệch nhau |
| 2.6 | 05/11 "Không cần tạo hẳn task báo cáo PH đâu" | KHÔNG tạo việc. Chỉ một dòng nhắc ở "Lớp của tôi" trong 10 ngày mở đợt: "Báo cáo PH tháng 11 · hạn 30/11 · chưa viết" (không vào số, không chuông) | Báo cáo có hạn (D7) mà GV không thấy ở đâu ngoài tab Báo cáo PH của từng lớp. Bạn bác thì tôi bỏ |
| 2.7 | TVV báo PH về vi phạm xong: GVCN không có chuông (tình hình học tập thì có) | Thêm một tin "Cập nhật" (không vào số) cho GVCN | 11/11 bạn muốn GV đọc được TVV báo gì; hiện phải tự vào tab mới biết đã có |

## 6. Không đề xuất (đã bị bác — ghi để nhớ)

Công việc thành bảng rộng (05/11) · bỏ khung phải Công việc (07/11) · khung / tab Quản trị mới (12/11) · tab riêng Phối hợp SOS (12/11) · panel trượt một em ở Học viên & Lớp (03/11) · Tiến độ thành dải ngang (10/11) · Hoàn tác sau lưu kết quả PA (13/11) · nhắc xếp lại MT đã huỷ (05/11) · Tutor, KET/PET thi thật (hoãn).
Từ bản ChatGPT không lấy: bước xem trước / xác nhận cho thao tác thường ngày, khoá idempotency tổng quát, cờ rollout hai bản, chế độ trình chiếu, "Đang chờ người khác".

## 7. Bước tiếp (sau khi chủ SP duyệt hướng)

1. Mockup HTML (1440 + 375, tối + sáng, đủ trạng thái) — thứ tự: ① trang đầu GV (Công việc + Lớp của tôi + "+ Ghi", gồm tab Speaking chấm chéo) · ② hồ sơ lớp · ③ hồ sơ HV · ④ trang đầu TVV · ⑤ bảng mẫu "dòng việc + panel việc + dòng quy chế".
2. Bản thiết kế đầy đủ + bảng TRƯỚC → SAU từng màn.
3. Plan PR: mỗi PR phạm vi · mockup · model + effort + phương án B · skill · phép kiểm · đo Turso → chủ SP chuyển PTA Plan.

Turso: các đề xuất trên dùng lại dữ liệu trang Công việc đã nạp (`/my-work`); "Lớp của tôi" cần thêm tình trạng Test từng lớp — sẽ đo và đặt trần trước khi viết plan (mục tiêu: không thêm request, ghép vào câu đã có).
