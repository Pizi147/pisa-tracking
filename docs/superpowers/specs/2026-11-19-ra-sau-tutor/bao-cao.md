# Rà toàn web sau đợt Tutor (19/11/2026)

PTA Tutor (Fable 5.2 · high). Lời chủ SP 19/11 tối: "kiểm tra lại một lần nữa toàn bộ web xem có conflict gì không, có vấn đề gì không, lỗi gì, như thế nào, có cách nào làm UI/UX trực diện hơn nữa không? có cách nào giảm tải workflow và khiến mọi thứ mượt mà hơn không?"
Mã: `main` b143c5295 (sau 6 PR Tutor #1862 #1864 #1865 #1866 #1868 #1869). **Chỉ rà + đề xuất, chưa sửa gì.**

Cách rà: (1) `npm run check` đầy đủ trên main · (2) agent đọc mã tìm xung đột sau đợt Tutor · (3) agent bấm thử web seed bằng Playwright, 8 vai, 1440 tối + 375 sáng (0 lỗi console / mạng được ghi lại tự động) · (4) `scripts/do-khung.mjs` toàn bộ kịch bản · (5) agent đọc mã tìm bước thừa.
Nhãn bằng chứng: **[PTA]** PTA Tutor tự mở mã / ảnh kiểm · **[A]** agent báo có `tệp:dòng` hoặc ảnh, PTA chưa tự kiểm · **[NGHI]** chưa tái hiện.

## 0. Tóm tắt

- **Không có xung đột, không lỗi chặn người dùng.** Check 5 905 phép kiểm đạt (nhóm Hrana / sqld bỏ qua vì máy không có sqld); không còn dấu xung đột; bấm thử 8 vai: 0 lỗi JS, 0 request 4xx / 5xx, 0 trang trắng, 0 cuộn ngang.
- **9 lỗi P1** (mục 1): 5 do đợt Tutor để lại, 4 có sẵn từ trước. Nặng nhất: lưới ghi nhiều em làm mất dữ liệu nháp PA Tutor; chữ đè nhau ở bảng "Lớp của tôi".
- **Khoảng 20 lỗi P2** (mục 2) — hiển thị, chữ, số đếm lệch nhỏ, tài liệu lệch mã.
- **15 đề xuất giảm bước** không đổi luật (mục 4) + **7 câu hỏi** nếu muốn giảm thêm thì phải đổi luật (mục 5).
- Máy đo khung (không nằm trong check) báo 316 lỗi: ~110 là lệch bảng / cắt chữ tích tụ qua nhiều đợt, ~190 là kịch bản đo đã hỏng (mục 3).

## 1. Lỗi P1

### 1a. Do đợt Tutor (sửa trước)

| # | Chuyện gì | Chỗ | Bằng chứng | Sửa |
|---|---|---|---|---|
| T1 | **Lưới ghi nhiều em làm mất dữ liệu nháp.** Lưới chỉ đọc dòng tutor đầu của nháp. Nháp ghi ở form đầy đủ có 2 tutor, đã tick 3 nút hoặc có đánh giá → lưới vẫn báo "Sẵn lưu"; bấm "Lưu n dòng" (hoặc "Lưu nháp" ở lưới) chỉ gửi một dòng: mất dòng thứ hai + các tick, số buổi dồn cho một tutor → sai trang Tutor và file xuất | `web/src/modules/congViec/LuoiKetQuaPa.tsx:101-107` | [PTA] | Nháp có > 1 dòng hoặc có 3 nút / đánh giá → dòng đó thành "Mở đầy đủ", lưới không ghi đè |
| T2 | **PA quy chế tới kỳ cuối mở từ khối "PA đang chạy" qua lưới lớp bị coi là kỳ thường.** Việc dựng từ khối luôn mang tiêu đề "Ghi kết quả PA"; lưới nhận ra kỳ cuối bằng tiêu đề. Lưu ở lưới → máy chủ vẫn coi là lần cuối, PA khép mà không qua form Kết quả cuối | `web/src/modules/congViec/PaDangChay.tsx:22-27` · `LuoiKetQuaPa.tsx:97` | [PTA] phía web · [A] phía máy chủ (`server/src/cases/cases.ts:4085, 4100`) | `luoi-ket-qua` trả cờ `lanCuoi`; lưới dùng cờ |
| T3 | **GV trong bảng Người dạy giữ tên / kỹ năng / chi nhánh lúc được chọn lần đầu**, không ai sửa được (dòng GV bị khoá sửa). GV đổi tên, thêm kỹ năng, chuyển chi nhánh → trang Tutor, file xuất, buổi mới vẫn ghi giá trị cũ; Head lọc theo nơi dạy cũ | `server/src/cases/cases.ts:4483-4492` · `server/src/tutors/trang.ts:298, 309` | [A] | Dòng có `user_id` đọc tên + kỹ năng + chi nhánh từ tài khoản lúc hiển thị |
| T4 | **Lý do "Cần chú ý" tính mọi thời gian, các cột số tính theo khoảng tuần** → cùng một hàng tự mâu thuẫn: "1 lần không xin tài liệu đúng hạn" cạnh "Tài liệu 1 / 1"; "chưa có buổi trong khoảng" mà vẫn Cần chú ý; panel "Chỉ dòng có Không 0" | trang Tutor (Head tutor · Head · CX) | [A] ảnh `anh/tutor-can-chu-y-lech-khoang.png` | Câu 6 mục 5 |
| T5 | **Tên học viên còn bị cắt "…"** ở panel người dạy và thẻ 375 của khối PA đang chạy (trái N55); phép `kiem-ten-hv` không bắt được vì trường tên khác | `web/src/modules/tutor/PanelTutor.tsx:131` · `web/src/modules/congViec/PaDangChay.tsx:90` | [A] | Bỏ `truncate`; thêm trường `hocVien` vào phép kiểm |

### 1b. Có sẵn từ trước (không do Tutor)

| # | Chuyện gì | Chỗ | Bằng chứng |
|---|---|---|---|
| C1 | **Bảng "Lớp của tôi" (trang đầu GV) đè chữ**: cột "Tôi dạy" cố định 150 px, lớp có 5 môn + "chủ nhiệm" tràn sang cột Test ("chủ nhiệm" đè "MT · W1 SEP / quá hạn 5 ngày", "Final Test · W2 OCT"). 1440 và 1280 | Công việc GV | [PTA] ảnh `anh/lop-cua-toi-de-chu-1440.png` |
| C2 | **Phân tích › Lớp thường, thẻ "Cuối khoá" ở 375**: bốn nhãn "Đạt · 60–69 % · 50–59 % · < 50 %" đè nhau, tràn mép thẻ | Phân tích (Head) 375 | [PTA] ảnh `anh/phan-tich-cuoi-khoa-375.png` |
| C3 | **Phân tích › Ý thức: hai số ngược chiều** — thẻ "Vi phạm 18 · ↓3 so kỳ trước", bảng lớp duy nhất "18 · ± kỳ trước ↑3" | Phân tích (Head) | [A] chữ DOM |
| C4 | **Ngày của buổi tutor theo đồng hồ thật, không theo ngày demo** → trên bản demo, buổi vừa ghi không hiện trong khoảng tuần mặc định (bản chính không bị) | `case_followup_buoi.ghi_luc` | [A] gọi API hai khoảng |

## 2. Lỗi P2

**Giao diện / chữ** — [A] trừ khi ghi khác:
1. Hồ sơ lớp: tên HV xếp theo mã ký tự ("Hoàng → Hà", "Vũ → Đoàn → Đặng"); Học viên & Lớp cùng lớp xếp đúng.
2. Khối PA đang chạy: chốt một em xong dòng lớp vẫn ghi kỳ / hạn cũ và "3 PA"; lưới còn "3 chưa xong".
3. Form Ghi kết quả PA 375: chữ gợi ý trong ô số bị cắt ("đã họ", "dự kiế") và lặp với nhãn dưới ô.
4. Mở lại nháp: ô Tutor mất nhãn phụ "GV · Monbay".
5. Thêm tutor trùng tên không nhắc (mockup có câu nhắc).
6. Quản trị 375: tên chi nhánh ngắt giữa chữ; bảng Case & SOS cột hẹp ngắt 3 dòng.
7. TVV · Học viên & Lớp 375: nút ⋯ rơi dòng riêng.
8. 375 nhiều trang: vùng bấm < 44 px (nút lọc 36, ô số 36 × 34, ✕ panel 36).
9. Panel trang Tutor: hàng bảng "Kết quả đã ghi" cao không đều (do-khung). [PTA đọc log]
10. Lưới: còn câu "nhận xét từng buổi" (luật cũ) — `LuoiKetQuaPa.tsx:401`.
11. Form vừa mở, chưa gõ đã ghi "● chưa lưu · nháp giữ trên máy". [NGHI chủ ý]

**Số đếm:**
12. Head · Công việc: "Của tôi 11 việc · 6 quá hạn" không gồm tab "Chờ bạn duyệt"; badge "Chấm Speaking 18" là số bài, badge tab khác là số quá hạn.
13. [NGHI] Lịch thi "Tất cả 43" nhưng 4 chip đều 0 · hồ sơ lớp "17 việc" cạnh chip cộng 34 · Công việc Head › Ý thức hai nhóm cùng tên "Báo PH" — cần tái hiện trước khi sửa.

**Luật / dữ liệu (đợt Tutor):**
14. Máy chủ chỉ bắt Nội dung khác rỗng; ngưỡng ≥ 8 ký tự (TU6) chỉ ở web — `shared/domain/paDongBo.ts:145`.
15. Điền sẵn tutor kỳ trước không kiểm GV còn vai → điền rồi lưu bị 400 — `server/src/tutors/chon.ts:115`.
16. Nhật ký PA ghi "dạy a buổi", thiếu "/ b" — `paDongBo.ts:302`.
17. Sửa / Điều chỉnh PA Tutor quy chế vẫn hiện ô "Tổng số buổi" với số cũ nhập dưới nhãn "/ 2 tuần". [NGHI]
18. Một người vừa là tutor danh bạ cũ vừa là tài khoản GV → hai dòng, số buổi chia đôi; Gộp chỉ nhận tên gõ tay.
19. Head tutor chỉ có vai Head tutor: trang đầu chỉ có câu "nhờ Quản trị cấp vai Giáo viên", không dẫn tới Tutor.

**Tài liệu lệch mã:** Rulebook dòng 897–898 còn "Tutor vẫn bắt buộc Số buổi / 2 tuần… mỗi buổi một dòng" (trái N54) · `CODE_MAP.md:61` còn "Trang Tutor đang tắt", chưa có `PaDangChay.tsx`.
**Mã chết đợt Tutor:** nhánh `classId` / `studentId` của `/tutors/chon`, ô Người dạy PA Tutor, `hinhThuc` phía web, 5 khoá EN mồ côi, quy ước id âm (đã ở backlog #1871).

**Đã kiểm, không thấy lỗi** [A]: mọi nơi đọc bảng buổi dùng tổng số buổi (không còn đếm dòng) · web không còn bắt Số buổi khi Xác nhận, 3 nút, n dòng · id âm không lọt DB · chốt thì xoá nháp, PA khép thì chặn lưu nháp · `paDangChay` không trùng việc thật, không lọt sang Head / Quản trị · mọi đường ghi trang Tutor kiểm quyền (CX chỉ đọc, GV 403) · trần `tocDoDuong.ts` của đường cũ không nâng · 0 khoá EN thiếu · 4 tệp chung với PR khác cùng ngày không ghi đè nhau.

## 3. Máy đo khung (`scripts/do-khung.mjs`)

316 lỗi + 133 lỗi đã miễn. Không nằm trong `npm run check` nên lỗi dồn qua nhiều đợt.
- ~110 dòng lệch bảng / cắt chữ, sau khi gộp trùng còn ~45 chỗ: Phân tích (chữ "Chưa chốt PA", "Thiếu điểm" bị cắt; tiêu đề lệch ô ở "Theo lớp", "Tiến bộ theo kỹ năng") · lưới nhập điểm / bảng điểm lớp thường (đường cơ sở lệch tới 10 px, tiêu đề "Kết quả" lệch 8 px) · hồ sơ GV (bảng "Lớp đang dạy", "Lớp chủ nhiệm") · hồ sơ HV (tên PA dài cắt 2 dòng — chủ ý, chủ SP 17/11 "tối đa 2 dòng") · Phối hợp SOS của CX (mã lộ trình bị che).
- ~190 dòng là kịch bản không mở được (Tạo Case, Ghi vi phạm, Chờ duyệt, Cuối khoá áp chung, hộp nhập điểm, "Chỉ cho tôi" của Hướng dẫn…). **Chưa rõ** bao nhiêu là kịch bản cũ so với giao diện, bao nhiêu do chạy cùng lúc với agent bấm thử — phải chạy lại một mình mới kết luận.
- 2 dòng miễn đã thừa trong `scripts/mien-do.json`.

## 4. Giảm tải workflow — 15 đề xuất KHÔNG đổi luật

[A] đọc mã, chưa bấm thử. Xếp theo lợi ích / công sức.

| # | Vai · việc | Hiện tại | Đề xuất | Bớt | Cỡ |
|---|---|---|---|---|---|
| 1 | Mọi vai · menu ⋯ | ⋯ vẫn hiện khi chỉ có một mục (hộp nhập điểm, ô điểm chỉ xem, thẻ Ý thức…; 33 nơi gọi) — `web/src/ui/MenuDong.tsx:51` | một mục → nút chữ bấm thẳng (sửa một chỗ) | 1 bấm mỗi lần | S |
| 2 | Head · điền thay bàn giao | hỏi "Head vẫn điền thay?" ở MỖI ô — `server/src/classes/banGiaoGv.ts:263` | đồng ý một lần cho cả phiếu | ~10 hộp → 1 | S |
| 3 | Head · xoá lịch Test lớp thường | ⋯ → Xoá lịch → hộp hỏi → toast Hoàn tác; xoá MT thì không hỏi — `test/keHoach/HopKyNang.tsx:360` | xoá thẳng + Hoàn tác như MT | 3 bấm → 1 | S |
| 4 | TVV · KQ thi thật + Bước tiếp | bước 2 mờ, không lý do, tới khi bấm "Lưu điểm" — `congViec/PanelSauThi.tsx:108` | đủ 4 điểm → mở bước 2; một nút lưu cả hai | 1 bấm, hết ô mờ | S |
| 5 | GV · + Case | Kỹ năng luôn trống dù máy biết môn GV dạy — `cases/QuickReport.tsx:85` | GV chỉ dạy 1 kỹ năng của em → chọn sẵn | 1 bấm | S |
| 6 | GV · Chọn / Thay PA | "Loại PA" là ô thả 6 mục — `cases/FormPa.tsx:54` | chip một hàng, nhóm "cần Head duyệt" ghi trên chip | 2 bấm → 1 | S |
| 7 | GV · + Case | "Nhóm nguyên nhân" là ô thả; trong panel Case là chip | dùng cùng chip | 1 bấm, một cách | S |
| 8 | Mọi vai · sau mỗi lần lưu nhỏ | lưu một ô Case tải lại mọi đường `/students…` + `/my-work`; 42 chỗ `invalidate('/students')`, 40 chỗ `'/classes'` | chỉ làm mới đúng em / lớp vừa đổi | hết giật sau lưu; giảm đọc Turso (đo trước → sau) | M |
| 9 | GV · xử lý vi phạm | web đòi 10 ký tự, máy chủ 8 (lệch N50-6) — `yThuc/XacNhanXuLyPanel.tsx:25` | dùng một ngưỡng 8 | hết chặn lệch | S |
| 10 | GV / TVV · Rút tình hình | hộp hỏi của trình duyệt, rút xong không Hoàn tác | rút thẳng + toast Hoàn tác | 1 hộp, có đường lui | S–M |
| 11 | Mọi vai · "Bỏ chữ đang gõ?" | còn 2 chỗ dùng hộp gốc trình duyệt | dùng hộp chung | một kiểu hộp | S |
| 12 | Quản trị · tạo tài khoản | bắt gõ mật khẩu ban đầu ≥ 6 ký tự | điền sẵn mật khẩu ngẫu nhiên, sửa được | 1 ô gõ | S |
| 13 | TVV · Chốt ngày thi | chọn "Dời tháng dự kiến" thì ô tháng trống | điền sẵn tháng kế | 1 lần chọn | S |
| 14 | Head · nút / ô mờ không lý do | Cuối khoá (ô chọn em đã khoá), "Áp cho n em", "Viết {phần}" | lý do đặt tại nút | hết đoán | S |
| 15 | TVV · KQ thi thật | hai bản giao diện cho một việc (Công việc / hồ sơ HV) | giữ một bản theo khung đã duyệt | một cách làm | M |

## 5. Bảy câu hỏi (muốn giảm thêm thì phải đổi luật)

| # | Câu hỏi | Khuyến nghị | Lý do |
|---|---|---|---|
| 1 | Head mở việc của GV khác phải bấm "Làm thay" rồi mới ra form (N33 ③). Mở thẳng form kèm dải "Bạn đang làm thay…"? | **Có** | bớt 1 bấm mỗi việc; cùng hướng lời 11/11 "làm là làm thôi" |
| 2 | Chuyển lớp: "Lý do" bắt buộc ở mọi kiểu chuyển. Thành tuỳ chọn? | **Có** | lịch sử đã ghi ai · lúc · từ lớp → lớp |
| 3 | Xử lý vi phạm đúng bậc mặc định: "Mô tả" bắt buộc. Cho để trống, máy tự ghi "{BẬC} · {vi phạm}"? | **Có** | đúng bậc mặc định thì không có gì để giải thích |
| 4 | Ghi kết quả PA, "Giữ nguyên": Nhận xét ≥ 8 ký tự mỗi kỳ. Thành tuỳ chọn khi đã chọn Tiến triển? | **Giữ bắt buộc** | nhận xét là thứ làm rõ kết quả và thành nguồn Báo cáo PH |
| 5 | Hoàn thành Case: "Vì sao kết luận vậy" ≥ 8 ký tự. Cho bỏ trống khi chọn "Tiến bộ rõ"? | **Có** | kết quả PA kỳ cuối đã nói lý do |
| 6 | Trang Tutor: "Cần chú ý" tính **mọi thời gian** (để không sót) trong khi cột số theo khoảng tuần → trông mâu thuẫn (T4). Sửa hướng nào? | **Giữ mọi thời gian**, câu lý do ghi kèm ngày ("1 lần không xin tài liệu · 02/09"), bấm lý do mở panel đúng dòng đó dù ngoài khoảng | đổi sang "theo khoảng" thì vấn đề cũ chưa ai xem sẽ tự biến mất |
| 7 | Tài khoản chỉ có vai Head tutor: trang đầu mở thẳng trang Tutor? | **Có** | nay chỉ thấy câu "nhờ Quản trị cấp vai Giáo viên" (N43 vẫn giữ cho người kèm vai GV) |

## 6. Đề xuất chia việc (chờ chủ SP chọn)

| Gói | Gồm | Ai giao | Cỡ |
|---|---|---|---|
| **S1 SUA-TUTOR-P1** | T1, T2, T3, T5 + P2 số 14–17 + C4 | PTA Plan (luật / máy chủ + lưới) | M |
| **S2 SUA-HIEN-THI** | C1, C2 + P2 số 1–10 + T4 theo câu 6 | PTA Tutor (giao diện; C1, C2 đổi bố cục nhỏ → ảnh cặp) | M |
| **S3 SO-LIEU** | C3 + P2 số 12; tái hiện 3 mục [NGHI] số 13 rồi mới sửa | PTA Plan | S–M |
| **S4 GIAM-BUOC** | đề xuất 1–7, 9–14 (+ câu 1, 2, 3, 5, 7 nếu chủ SP đồng ý) | PTA Tutor (giao diện) · phần máy chủ nhỏ kèm theo | M |
| **S5 LAM-MOI-HEP** | đề xuất 8 — đo câu / dòng trước → sau trên bản chép | PTA Plan | M |
| **S6 DON** | Rulebook, CODE_MAP, mã chết Tutor, chạy lại do-khung một mình + sửa kịch bản hỏng, gỡ 2 dòng miễn thừa; đề xuất 15 | PTA Plan | S–M |

## 7. Chưa kiểm được

- Nhóm phép kiểm Hrana / sqld (máy không có sqld) — chưa chạy.
- Lưu chốt với 0 buổi; Sửa một lần ghi cũ hơn lần gần nhất (giao diện không có nút — lệch TU18, cần xem lại); tải tệp ở "Tải danh sách"; Hoàn tác gộp tên; ở 375 các thao tác Thêm / Gộp / Xác nhận PA mới mở, chưa lưu.
- Bản tiếng Anh; in / PDF Báo cáo PH; bản chính (chưa deploy).
- Agent bấm thử dùng trình duyệt Playwright bản cũ hơn bản repo yêu cầu.
- Dữ liệu demo trong worktree `pta-tutor-1119` đã bị bấm thử đổi (3 PA chốt, 1 nháp, 2 tutor thử, 1 lần gộp) — chỉ là DB seed cục bộ, `npm run seed` là sạch.
