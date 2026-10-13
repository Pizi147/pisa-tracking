> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# CA1 · Critique Assessment A — Khung chung · Tổng quan · Phân tích · Quản trị · Hồ sơ cá nhân · Đăng nhập

Mode **Operate**. Môi trường N=9 (web 5519, DB a9 reset, ngày demo 14/09/2026 = W3 SEP). Ảnh: `$SP/anh/critique-A1/`
(`$SP` = `$SP`).
Đánh giá độc lập: không đọc `ket-qua/` khác, không chạy detector. Ghi dữ liệu duy nhất: QT thêm vai Giáo viên · MB cho Nguyễn Khánh Vy (id 2) để thấy dải Góc nhìn; 2 thông báo bị đánh dấu đọc khi thử bấm.

## Đã đi
| Trang | Vai | 1440 tối | 375 sáng | Thao tác |
|---|---|---|---|---|
| `/` Tổng quan | QL, GVCN, GVBM, ADMIN, TVV, CX, QT | ✓ | ✓ | đọc số; bấm ô "Case chờ xác nhận nguyên nhân" (ngăn số); GVCN bấm "1 em"; GVBM điện thoại "Xem hết (13)"; đo tràn ngang 375 |
| Khung: Thông báo · Tìm · Tài khoản · thanh dưới · dải demo | QL, GVCN | ✓ | ✓ | mở chuông, bấm thông báo; gõ "ft1" / "zzzz"; mở menu TK |
| Dải Góc nhìn | QL + vai GV | ✓ | ✓ | đổi sang Giáo viên; bấm thông báo "Chờ duyệt" khi đang ở góc GV; Về Quản lý |
| `/phan-tich` 5 góc nhìn | QL | ✓ | ✓ (Tổng hợp, Vấn đề, GV) | bấm "15 Case chờ xác nhận nguyên nhân" |
| `/giao-vien/9` | QL | ✓ | ✓ | đọc, so số với Tổng quan của GVBM |
| `/quan-tri` Tài khoản · Chương trình · Quyền & nhật ký | QT | ✓ | ✓ | panel Sửa, ⋯ › Sửa thông tin, + Thêm vai trò → Lưu |
| `/ho-so-ca-nhan` | GVCN | ✓ | ✓ | đọc |
| Đăng nhập (chưa đăng nhập) | — | ✓ | ✓ | đăng nhập sai, sai đuôi email |

---

## 1. Design-specificity verdict
**Có — phần lớn vùng này ra dáng "Bàn làm việc của giáo viên".** Tổng quan không phải dashboard chung chung: GV mở ra là "Chào Hà · Tuần W3 SEP", việc chia đúng 4 nhóm nghiệp vụ (Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành), bốn cột thẳng (nhãn · việc · hạn · nút), ⚠ luôn kèm "quá hạn"; QL mở ra là dải **Chờ duyệt theo loại** (Học thuật 6 · Ý thức 1 · Lịch thi 1 · Thông tin HV 2) + **Cần xử lý** có người phụ trách và "Xem và nhắc". Mã tuần, chip SOS, MT1/MT3 · n em ở Lịch sắp tới — một sản phẩm khác không dùng lại nguyên được.
Phần **chung chung**: Quản trị › Tài khoản (bảng admin mẫu), Hồ sơ cá nhân (form + đoạn giải thích dài), Đăng nhập.
Điểm yếu về độ "liền mạch": **từ vựng thành phần trôi** — công tắc Fast Track | Lớp thường có 3 kiểu, ô số có 2 kiểu trên cùng một trang (CX), mũi tên "→" và "›" lẫn nhau, nút "n em" có hai hành vi. Người dùng quen tay sẽ phải dừng lại ở những chỗ "hơi lệch".

## 2. Heuristic Nielsen (cả vùng)
| # | Heuristic | Điểm | Lý do một dòng |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Toast "Đã lưu tài khoản", "Đang thử…", "Dữ liệu đến", badge Công việc = chip Chờ duyệt (QL 10=10, QT 12=12, GV 7 quá hạn = 7); thiếu: không mục nav nào sáng ở /quan-tri, /ho-so-ca-nhan |
| 2 | Match system / real world | 3 | Đúng thuật ngữ trung tâm (SOS, Case, PA, MT, W3 SEP); lọt chữ kỹ thuật: "(SOS v4, K5-51)" trong ngăn Cách tính, "Khung", "HV - CASE 3 - 4" |
| 3 | User control & freedom | 3 | Esc đóng menu và trả focus, "‹ Phân tích" quay lại đúng nguồn, "Về Quản lý", Xoá lọc; nhưng thông báo bị đánh dấu đọc dù bấm không tới đâu |
| 4 | Consistency & standards | 2 | 3 kiểu công tắc FT/LT, 2 kiểu ô số, "n em" hai hành vi, cùng tên khác số (9 vs 15), "Góc nhìn"/"Cần chú ý"/"Chương trình" mỗi chữ hai–ba nghĩa, kỹ năng "L" cạnh "Listening" |
| 5 | Error prevention | 3 | Nút Lưu tắt tới khi đủ ô, lỗi dưới ô (email trùng 409), xác nhận khi lưu quyền theo vai; "Đánh dấu đã đọc" cả chuông không hoàn tác |
| 6 | Recognition rather than recall | 3 | Nhãn chữ cạnh biểu tượng, chip trạng thái có chữ, số bấm được gạch chấm; điện thoại: hàng góc nhìn Phân tích chỉ lộ 2/5 nút |
| 7 | Flexibility & efficiency | 3 | Tìm có ↑↓ Enter, bộ lọc trên URL, gom việc theo lớp, Xuất Excel; tab Quản trị không lên URL |
| 8 | Aesthetic & minimalist | 2 | Nhiều câu giải thích trái luật 1.1 (Hồ sơ cá nhân 5 câu, panel Sửa tài khoản 2 đoạn, chân Cần xử lý), "Cách tính" lặp 4 lần, CX hai tầng ô số |
| 9 | Error recovery | 2 | Đăng nhập sai báo rõ; nhưng góc nhìn chặn đường → về Tổng quan im lặng, ô số lỗi "Không tải được số liệu này." không có Thử lại, GV chưa có lớp bị báo "chưa được cấp phạm vi" |
| 10 | Help & documentation | 3 | Ngăn "Cách tính" + "Đúng những mục tạo nên con số vừa bấm", ⓘ cạnh tiêu đề; có chỗ quá dài / lộ mã nội bộ |
| **Tổng** | | **27/40** | **Acceptable** (cận Good) |

## 3. Cognitive load
Checklist hỏng **3/8 → mức vừa**: Chunking ✗ · Minimal choices ✗ · Visual hierarchy ✗ (riêng CX). Đạt: single focus, grouping, one thing at a time, working memory (trừ 9 vs 15), progressive disclosure (ngăn số, hàng gộp mở ra).
Điểm quyết định > 4 lựa chọn:
- **Phân tích, đầu trang**: 5 góc nhìn + 2 FT/LT + ô tuần + ô lớp, rồi trong bảng thêm Theo tuần/lớp/đợt + chú thích 4 màu + ⋯ ≈ **12 điều khiển** trước khi thấy số.
- **Quản trị › Tài khoản**: tìm + Chi nhánh + Vai trò + Kỹ năng (5 nút) + Nhóm + 3 chip lọc + Đang dùng/Đã xoá + Tạo ≈ **14 điều khiển**.
- **Phân tích › Giáo viên**: Khung (2) + Khoảng (2) + 2 ô tuần + 2 nút lịch + 2 dòng chú thích.
- **Menu tài khoản khi có góc nhìn**: Góc nhìn (n vai) + Phạm vi được cấp (cùng n vai, lặp) + Giao diện + 2–3 hồ sơ + Đăng xuất.

## 4. Emotional journey
- **Đỉnh (tốt)**: mở Tổng quan biết ngay việc hôm nay (QL: Chờ duyệt + Cần xử lý; GV: 7 quá hạn · 3 hôm nay); bấm số ra đúng danh sách tạo nên số đó — yên tâm số không bịa.
- **Thung lũng**: GV thấy 17 dòng, 5 dòng nền đỏ, chuông 41 chưa đọc (28 "Cần làm") — căng nhưng đúng sự thật; chỗ làm hụt hẫng là **bấm thông báo "Cần làm" mà không đi đâu** (Báo phụ huynh qua TVV) và **góc nhìn GV bấm "Chờ duyệt" bị đẩy về Tổng quan, thông báo biến mất** (đã đánh dấu đọc).
- **Lo khi lưu / chốt**: panel Sửa tài khoản có Đóng/Lưu ở chân, toast "Đã lưu tài khoản" — ổn. Hồ sơ cá nhân: "Lưu" ở chân thẻ trên, "Đổi mật khẩu" ở đầu thẻ dưới → dễ nghĩ "Lưu" đổi cả mật khẩu.
- **Kết (end)**: luôn có "Về Quản lý", "Đăng xuất" ở menu; không ai bị kẹt cứng.

## 5. Điểm mạnh
1. **Số liệu kiểm chứng được**: mỗi ô số mở ngăn "Đúng những mục tạo nên con số vừa bấm" + Cách tính; badge Công việc khớp chip Chờ duyệt / số quá hạn ở mọi vai đã thử; điện thoại "Xem hết (13)" mở Công việc đúng "Đến hết tuần 13".
2. **Tổng quan theo vai đúng thứ tự quan trọng**: QL tầng 1 là việc phải quyết, số liệu xuống dưới; GV việc trước, "Yêu cầu của tôi" (bị từ chối đứng đầu, nút "Sửa và gửi lại") bên cạnh, "Lớp tôi dạy" cuối; điện thoại rút còn 3 việc quá hạn + Xem hết.
3. **Khung chắc tay**: thanh dưới 4 nút có chữ, nút 44 px, Esc trả focus về nút mở, ô tìm là combobox có ↑↓ Enter và nhóm Học viên / Lớp, dải "Mất kết nối" không đăng xuất, mã tuần khắp nơi.

---

## 6. Vấn đề ưu tiên

### CA1-1 · P1 · Cùng tên "Case chờ xác nhận nguyên nhân", Tổng quan 9 – Phân tích 15
- Trang · vai: `/` (ô số) và `/phan-tich?goc=van-de` (hàng vàng cuối) · QL Monbay, Fast Track.
- Thấy: Tổng quan ghi **9 case · 1 quá hạn**; tab Phân tích ngay bên cạnh ghi **15 Case chờ xác nhận nguyên nhân (1 quá hạn) · 9 HV · 3 lớp**. Mở hai ngăn: 15 gồm thêm Vũ Ngọc Lan R/S, Đặng Thu Hà L, Chu Nhật Minh R, Kiều Thảo Nhi S.
- Vì sao: H4 + luật "cùng một số liệu ở nhiều nơi phải cùng nguồn, cùng hàm tính". Hàng Phân tích thật ra là "Case chưa phân nhóm nguyên nhân" (gồm Case tạo tay, Case có yêu cầu Không cần theo dõi) nhưng mượn tên của ô Tổng quan.
- Đề xuất: đổi chữ hàng Phân tích thành **"Case chưa phân nhóm"** (và `title`), giữ "Case chờ xác nhận nguyên nhân" chỉ cho tập của ô Tổng quan. Loại: **đổi chữ — không mockup**. (Muốn hai nơi cùng một tập thì là việc máy chủ, chủ SP chọn.)
- File: `web/src/modules/phanTich/TongHopVanDeHv.tsx:155-156` · tập: `server/src/phanTich/vanDeHv.ts:190,366` · ô: `web/src/modules/worklist/MetricTiles.tsx:42`.
- Ảnh: `dem-tile-case-cho-xn.png`, `dem-vande-15.png`, `pt-QL-van-de-1440.png`.

### CA1-2 · P1 · Góc nhìn Giáo viên: chuông vẫn của Quản lý, bấm là bị đẩy về Tổng quan và mất thông báo
- Trang · vai: khung chung · QL có thêm vai GV, đang ở "Góc nhìn: Giáo viên".
- Thấy: chuông vẫn 28 thông báo của QL ("Chờ duyệt · Đề xuất chuyển lớp…", dòng xanh "Công việc › Chờ duyệt"). Bấm → URL về `/`, không báo gì; thông báo đã bị đánh dấu đọc. Mở thẳng `/cong-viec/duyet` cũng về `/` im lặng.
- Vì sao: H9 (bị chặn không nói lý do + bước tiếp), H1, luật OV 11/10 "góc nhìn = làm việc đúng quyền vai đang chọn"; nhắc việc bị nuốt → trái "không em nào bị bỏ sót".
- Đề xuất: chuông chỉ hiện thông báo của **vai đang chọn**; thông báo của vai khác không đánh dấu đọc mà hiện mờ kèm nút **"Về Quản lý"**. Loại: **ẩn/lọc + sửa lỗi — không mockup**.
- File: `web/src/modules/platform/Header.tsx:234-240` (đánh dấu đọc trước khi biết có tới được), `web/src/App.tsx:204` (Navigate về `/`).
- Ảnh: `gocnhin-dai-1440.png`, `gocnhin-bam-thongbao-1440.png`, `gocnhin-menu-375.png`.

### CA1-3 · P1 · Thông báo nhóm "Cần làm" không dẫn tới đâu ("Báo phụ huynh qua TVV")
- Trang · vai: chuông · GVCN (7 thông báo loại này).
- Thấy: "Báo phụ huynh qua TVV · Trương Gia Bảo · Progress Test không đạt G+V — Nhờ TVV báo phụ huynh (4 nội dung), xong thì đánh dấu đã làm." Không có dòng xanh "bấm tới đâu"; bấm chỉ đóng chuông, đánh dấu đọc, ở nguyên `/`.
- Vì sao: H6/H9 — bảo "đánh dấu đã làm" mà không chỉ chỗ; nằm trong nhóm Cần làm nên GV sẽ hỏi lại.
- Đề xuất: loại `phoi_hop` trỏ về **hồ sơ HV** (nơi có việc `baoph:` — `server/src/students/viecHocVien.ts:101`), dòng xanh "Hồ sơ {em}". Loại: **sửa lỗi — không mockup**.
- File: `shared/domain/duongHoSo.ts:185-190` (`assessment_attempt` khác `sos` → `null`).
- Ảnh: `khung-GVCN-1440-thongbao.png`.

### CA1-4 · P2 · Ba thông báo giống hệt nhau, không có tên lớp
- Trang · vai: chuông · QL.
- Thấy: 3 dòng "Báo QL · Lớp hết khoá · chưa có quyết định chuyển lớp" (thẻ 27, 30, 31) + "Báo QL · Bàn giao quá hạn" — không lớp, không thân. Phải bấm từng cái mới biết lớp nào.
- Vì sao: H6, H4 — thẻ duyệt có lớp (`loaiYeuCau.ts:595`) nhưng thông báo bỏ mất.
- Đề xuất: tiêu đề nối mã lớp khi không có học viên: **"Báo QL · Lớp hết khoá · MB FOU 12"**. Loại: **đổi chữ — không mockup**.
- File: `server/src/duyet/yeuCau.ts:110`.
- Ảnh: `khung-QL-1440-thongbao.png`, `khung-QL-375-thongbao.png`.

### CA1-5 · P2 · Công tắc "Fast Track | Lớp thường": 3 kiểu, 3 tên
- Trang · vai: `/` (✓ viền xanh lục), `/phan-tich` 4 góc (nền xanh "doing", không nhãn, nằm phải), `/phan-tich?goc=giao-vien` (✓ + nhãn **"Khung"**, nằm trái); trong bảng thêm kiểu thứ 4 (Theo tuần/lớp/đợt). Hồ sơ GV có cột **"KHUNG"**; Học viên & Lớp gọi **"Loại lớp"**; aria Phân tích gọi **"Chương trình"** — trùng tên tab Quản trị "Chương trình" (Pre FOU, FOU…).
- Vì sao: H4 + luật "một khái niệm một tên; dùng lại component sẵn có". Đổi tab Tổng quan ↔ Phân tích là công tắc đổi hình, đổi chỗ.
- Đề xuất: Phân tích dùng `CongTacKhung` như Tổng quan, bỏ `ChonChuongTrinh`; một tên **"Loại lớp"** (nhãn PT GV, cột hồ sơ GV, aria). Loại: **dùng lại component + đổi chữ — không mockup**.
- File: `web/src/modules/worklist/ChonChuongTrinh.tsx:9` · `web/src/modules/phanTich/PhanTich.tsx:131` · `PhanTichGiaoVien.tsx:117` · `HoSoGiaoVienPage.tsx:225`.
- Ảnh: `tq-QL-1440.png`, `pt-QL-tong-hop-1440.png`, `pt-QL-giao-vien-1440.png`, `gv-QL-1440.png`.

### CA1-6 · P2 · Tổng quan CX / Quản trị trượt ngang 23 px ở 375
- Trang · vai: `/` · CX, QT (Tất cả chi nhánh).
- Thấy: thẻ "Điểm đáng chú ý" và "Lịch sắp tới" rộng 398 px, chữ "(30 ngày qua)", "Xem toàn bộ lịch" bị cắt mép phải; `main.scrollWidth` 398 > 375. QL/GV/Admin không bị.
- Vì sao: DESIGN.md Layout "trang không trượt ngang"; người dùng điện thoại.
- Đề xuất: lưới hai thẻ thêm `grid-cols-1` (= `minmax(0,1fr)`). Đã thử trong trang: 398 → 375. Loại: **sửa lỗi hiển thị — không mockup**.
- File: `web/src/modules/worklist/OverviewPage.tsx:133`.
- Ảnh: `tq-CX-375.png`.

### CA1-7 · P2 · Câu giải thích dưới ô / nút (trái plan.md 1.1) — có câu "Bản demo…" lọt bản chính
- Trang · vai: `/ho-so-ca-nhan` (GV), panel Sửa tài khoản (QT), `/` QL, `/phan-tich?goc=giao-vien`, `/quan-tri`.
- Thấy: Hồ sơ cá nhân 5 câu ("Đổi email đăng nhập là đổi danh tính tài khoản…", "Đây là NĂNG LỰC…", "Vai trò và chi nhánh do Quản trị hệ thống cấp — … bước duyệt thành vô nghĩa…", **"Bản demo không gửi email thật…"** — câu này không có điều kiện, hiện cả bản chính). Panel Sửa tài khoản: đoạn 3 câu về quyền cấp riêng + "Hệ thống chưa có luồng quên mật khẩu…". Chân Cần xử lý: '"Xem và nhắc" mở Công việc đã lọc sẵn…'. PT GV: "rê chuột hoặc Tab vào tên cột gạch chấm…". Quản trị: phụ đề "Tài khoản, danh mục và cấu hình quyền của phần mềm."
- Vì sao: H8; luật chủ SP "nhãn 1–3 từ, không câu giải thích dưới nút/ô".
- Đề xuất (chữ thật): ô email đăng nhập chỉ đọc → bỏ câu, nhãn **"Email đăng nhập (QT đổi)"**; Email khác → placeholder **"cách nhau dấu phẩy"**, bỏ câu; kỹ năng → bỏ câu; Vai trò → bỏ đoạn, giữ chip; mật khẩu → **"Quên? Nhờ Quản trị"** (bỏ chữ "Bản demo"); panel quyền → giữ một dòng **"Cộng thêm vào quyền vai trò"**; bỏ chân Cần xử lý, bỏ phụ đề Quản trị, bỏ dòng "rê chuột…" (đã có ⓘ). Loại: **đổi chữ — không mockup**.
- File: `web/src/modules/platform/ProfilePage.tsx:122-180` (đặc biệt `:177-180`), `AccountsAdmin.tsx:521-566`, `KhoiCanXuLy.tsx:98`, `PhanTichGiaoVien.tsx:156`, `AdminPage.tsx:44-46`.
- Ảnh: `hscn-GVCN-1440.png`, `qt-panel-sua-1440.png`, `tq-QL-1440.png`.

### CA1-8 · P2 · Một tài khoản, hai nút sửa: "Sửa" và "⋯ › Sửa thông tin"
- Trang · vai: `/quan-tri` › Tài khoản · QT.
- Thấy: "Sửa" mở **"Sửa tài khoản"** — chỉ vai trò, kỹ năng, quyền riêng, đặt lại mật khẩu (không có tên, email). Tên / email / SĐT nằm ở **⋯ › "Sửa thông tin"** — panel thứ hai. Panel "Tạo tài khoản" thì có đủ mọi ô.
- Vì sao: H4/H6 — QT muốn sửa email bấm "Sửa" không thấy, phải đoán mục ⋯; luật "việc ngắn → hộp nhỏ, một thao tác một chỗ".
- Đề xuất: panel Sửa tài khoản hiện lại 5 ô thông tin ở đầu (như panel Tạo), **bỏ mục "Sửa thông tin"** trong ⋯ (⋯ còn "Xoá tài khoản"). Loại: **ẩn-gộp nút — không mockup** (theo mẫu panel Tạo có sẵn).
- File: `web/src/modules/platform/AccountsAdmin.tsx:266-270`, `:442-474` (nhánh `editing` ẩn ô), `:618`.
- Ảnh: `qt-panel-sua-1440.png`, `qt-panel-suatt-1440.png`.

### CA1-9 · P2 · Nút "n em": cái mở tại chỗ, cái chuyển trang; nền đỏ quá hạn chỉ ở dòng gộp
- Trang · vai: `/` Việc hôm nay · GVCN, GVBM.
- Thấy: "3 việc ⌄", "2 em ⌄" mở danh sách em ngay dòng; "1 em", "2 em" (không ⌄) ở Xác nhận nguyên nhân thì **rời Tổng quan** sang `/cong-viec?viec=gop:cause…`. Dòng gộp quá hạn có nền đỏ, dòng lẻ quá hạn ("Thêm PA học thuật Reading · quá hạn 18 ngày") không.
- Vì sao: H4 (cùng hình, khác hành vi), luật "tách nút làm việc với link xem; cùng loại thao tác cùng phản hồi"; trạng thái không chỉ bằng màu nhưng màu phải nhất quán.
- Đề xuất: dòng chuyển trang dùng động từ của việc (**"Xác nhận"**, **"Thêm PA"**) thay "n em"; "n em ⌄" chỉ cho dòng mở danh sách. Nền đỏ: bỏ ở dòng gộp (chip "Quá hạn" + ⚠ đã đủ) hoặc áp cho mọi dòng quá hạn — đề xuất **bỏ**. Loại: **đổi chữ / sửa hiển thị — không mockup**.
- File: `shared/domain/gopViec.ts:98` (`actionLabel: n em`), `web/src/modules/worklist/WorkList.tsx:81` (nền), `:107-119`.
- Ảnh: `tq-GVCN-1440.png`.

### CA1-10 · P2 · GV chưa có lớp bị báo "Bạn chưa được cấp phạm vi nào"; máy tính và điện thoại nói hai câu khác
- Trang · vai: `/` · QL ở Góc nhìn Giáo viên (vai GV · Monbay, chưa có lớp).
- Thấy: máy tính "Bạn chưa được cấp phạm vi nào" (sai — đã có vai GV · Monbay; dải ghi đúng "chưa có lớp"); điện thoại "Không có việc quá hạn hay đến hạn tuần này."
- Vì sao: H9/H2 — nói sai lý do, không có bước tiếp; cùng trạng thái hai chữ.
- Đề xuất: cả hai nơi **"Chưa được phân công lớp"**. Loại: **đổi chữ — không mockup**.
- File: `web/src/modules/worklist/ViecCuaToi.tsx:59` và `:93` (chữ "chưa được cấp phạm vi" còn ở 5 chỗ Phân tích / Công việc — xem lại cùng lúc).
- Ảnh: `gocnhin-dai-1440.png`, `gocnhin-dai-375.png`.

### CA1-11 · P3 · Tổng quan nhiều chữ lặp: "Cách tính" ×4, "Cần chú ý" ba nghĩa
- Trang · vai: `/` · QL, QT, CX.
- Thấy: mỗi ô số có chữ "Cách tính" (4 lần một hàng; ở 375 đẩy nhãn ô xuống 3–4 dòng). "Cần chú ý" vừa là ô học viên (TVV/CX), vừa là chip vàng ở "Điểm đáng chú ý", vừa là bảng "Học viên cần chú ý" ở Phân tích › Ý thức. CX có hai tầng ô số khác kiểu chồng nhau.
- Vì sao: H8, H4.
- Đề xuất: "Cách tính" → biểu tượng **ⓘ** (aria "Cách tính") như ⓘ đang dùng ở Phân tích; chip ở Điểm đáng chú ý → **"Chưa ổn"** (giữ "Tốt"). Loại: **đổi chữ / ẩn-gộp — không mockup**. (Thống nhất hai kiểu ô số trên trang CX là đổi bố cục → cần mockup, chỉ làm nếu chủ SP muốn.)
- File: `web/src/ui/SoLieu.tsx:137` (nút Cách tính), `web/src/modules/worklist/KhoiCanXuLy.tsx:139` (chip `MUC_CHU_Y_LABEL`).
- Ảnh: `tq-CX-1440.png`, `tq-QL-375.png`.

### CA1-12 · P3 · Vị trí nút cùng loại lệch nhau
- Trang · vai: `/ho-so-ca-nhan` (GV), `/quan-tri` (QT), nhiều thẻ.
- Thấy: Hồ sơ cá nhân "Lưu" ở **chân** thẻ (chú thích K1-54 ngay trong file), "Đổi mật khẩu" ở **đầu** thẻ dưới; Quản trị "+ Tạo tài khoản" nút chính góc trên phải, "+ Chương trình" nút phụ góc dưới trái; link đi tiếp lẫn "→" ("Tất cả việc trong Công việc →", "Mở Yêu cầu của tôi →") và "›" ("Xem toàn bộ lịch ›", "Việc của Trang ›").
- Vì sao: H4 — cùng loại thao tác cùng vị trí.
- Đề xuất: "Đổi mật khẩu" xuống chân thẻ như "Lưu"; "+ Chương trình" lên đầu bảng góc phải như "+ Tạo tài khoản"; một mũi tên **"›"** cho mọi link đi tiếp. Loại: **sửa hiển thị — không mockup**.
- File: `web/src/modules/platform/ProfilePage.tsx:158-162`, `CatalogAdmin.tsx:124`, `KhoiCanXuLy.tsx:99`, `ViecCuaToi.tsx:112,166`.
- Ảnh: `hscn-GVCN-1440.png`, `qt-chuongtrinh-1440.png`.

**Số đề xuất cần mockup: 0** (CA1-11 phần "thống nhất hai kiểu ô số" và câu hỏi 1 bên dưới sẽ cần mockup nếu chủ SP chọn làm).

---

## 7. Persona red flags
**GV bận nhập điểm cuối tuần (Trần Ngọc Hà, GVCN):** Tổng quan 17 dòng, chuông 41 chưa đọc (28 "Cần làm") — chuông thành danh sách việc thứ hai trùng Công việc; 7 "Báo phụ huynh qua TVV" bấm không đi đâu (CA1-3). Nút "1 em"/"2 em" không đoán được là mở hay chuyển trang (CA1-9). "Đánh dấu đã đọc" xoá hết một lần, không lọc theo nhóm.
**QL chi nhánh nhiều lớp (Nguyễn Khánh Vy):** tầng 1 tốt; nhưng 9 ở Tổng quan, 15 ở Phân tích cho cùng một tên (CA1-1); 3 thông báo "Lớp hết khoá" giống hệt (CA1-4); cần câu chú thích mới hiểu "Xem và nhắc"; bảng Theo lớp hàng tổng ở đầu, còn QT/CX hàng tổng ở cuối. QL kiêm GV đổi góc nhìn thì chuông thành bẫy (CA1-2).
**TVV ít quen web (Nguyễn Thu Hương):** Tổng quan chỉ 4 ô số, không một tên em — "3 Cần chú ý" phải bấm mới biết ai; phụ đề "SOS · Case mới · Ý thức" là chữ của GV. Tab Phân tích mở ra bảng Test + SOS dày 17 cột — không phải việc của TVV.
**Người dùng điện thoại:** CX/QT trượt ngang 23 px (CA1-6); "Theo giáo viên" bị mờ cắt ở mép thẻ "Theo lớp · Monbay"; Phân tích chỉ lộ 2/5 góc nhìn; nhãn ô số xuống 4 dòng vì "Cách tính"; Quản trị vẫn là bảng (UX-D7 đã hoãn có chủ ý — không đề xuất lại). Tốt: thanh dưới 4 nút có chữ, nút 44 px, menu TK có Sáng/Tối.

## 8. Minor observations
- Tên sản phẩm: màn ghi **"PISA Tracking"** (thanh đầu, đăng nhập, cả mockup), PRODUCT.md / DESIGN.md ghi **"PISA Progress"**.
- Kỹ năng nhiều kiểu: "Xác nhận nguyên nhân · L" cạnh "· Listening"; ngăn số "Writing Task 2" ↔ Phân tích "W2"; Quản trị "Writing, Writing Task 1, Writing Task 2", "Tổng hợp" (không có trong ô chọn L R W1 W2 S).
- Ngăn "Cách tính" lộ mã nội bộ "(SOS v4, K5-51)" và dấu `…`; thông báo SOS thân "MT1 · PISA-000070" (mã dài, chỗ khác dùng mã ngắn); "Case mới sau Progress Test: [Progress Test] L không đạt" lặp chữ.
- Đầu cột: "Cần xử lý", "Lớp tôi dạy" chữ thường; "Theo lớp", Phân tích chữ in hoa 11 px (DESIGN.md: in hoa).
- Phân tích: chọn "8 tuần" mà hàng cuối "Tổng 7 tuần"; cột "HV - CASE" ghi "3 - 4" đọc như phép trừ (đề xuất "3 · 4").
- Tổng quan chip **"Tốt · 9/10 PA… có cải thiện"** trong khi Hiệu quả PA ghi "0 vấn đề đủ dữ liệu".
- Menu TK khi có góc nhìn: khối "Góc nhìn" và "Phạm vi được cấp" lặp cùng danh sách vai — ẩn khối sau khi có khối trước.
- Quản trị: tab không lên URL (`AdminPage.tsx:38`) — tải lại về Tài khoản; không mục nav nào sáng ở /quan-tri, /ho-so-ca-nhan.
- Đăng nhập: sai đuôi email vẫn "Email hoặc mật khẩu không đúng" (đã biết luật đuôi thì nói thẳng); placeholder tối rgb(156,163,175) trông như đã điền; tab "Đăng nhập" trùng chữ nút "Đăng nhập".
- Dải demo: "Đổi tài khoản demo" là nút sáng nhất màn, điện thoại ghi "Tài khoản" cạnh vòng TK "V" — chỉ ở demo, không gấp.

## 9. Câu hỏi cho chủ sản phẩm
1. TVV mở Tổng quan chỉ thấy 4 con số. Có muốn hiện luôn **3–5 tên em "Cần chú ý"** ngay dưới ô (bớt một lần bấm) không? (đổi bố cục → cần mockup; khuyến nghị: có.)
2. Tên trên màn là **"PISA Tracking"** hay **"PISA Progress"**? (khuyến nghị: theo PRODUCT.md "PISA Progress", đổi một lần ở thanh đầu + đăng nhập trước PR-EN.)
3. Khi đang ở **Góc nhìn Giáo viên**, chuông chỉ hiện việc của vai đang chọn (khuyến nghị, CA1-2), hay hiện đủ nhưng bấm thì tự về đúng vai?
