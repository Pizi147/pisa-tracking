# 05 — Đề bài mockup Tutor (19/11/2026)

PTA Tutor tự giao session con, tự rà + duyệt + merge (chủ SP 19/11: "mockup, giao diện, UI/UX thì bạn tự chủ động… giao luôn, bạn duyệt và merge"). **Hai mockup, hai session con** — Opus 5.5 · high (B: Sonnet 5.5 · high), chạy song song được (khác tệp).
Luật đã chốt: `02-luat.md` TU1–TU19 (chủ SP 19/11: 6 ý + "Ok cả 4 câu" — nguyên văn `plan.md` mục 4). Workflow + phác form: `03-workflow.md` mục 3, 4. Hiện trạng + đường dẫn mã: `00-hien-trang.md`.

**Đọc trước, cho cả hai:** `plan.md` mục 4 (khối "Chủ SP 19/11" về Tutor) · thư mục này `00` `02` `03` · `CLAUDE.md` · `DESIGN.md` Luật V5 (nhất là V12, V13, V18, V21, V22) · bộ chuẩn `thiet-ke/v21/bang-mau.html` + `bang-mau-ghi-chu.md` + `v21.css` · memory dự án: nang-cap-khong-bat-chuoc, cong-chat-luong-mockup, pta-ra-mockup-theo-yeu-cau, bo-chu-thich, case-pa-bam-thang, feedback-ngan-gon.
**Skill:** `superpowers:brainstorming` (lập bảng "dòng R → khung" TRƯỚC khi vẽ) · `impeccable` (`layout`, `clarify`, `adapt`; `critique` + `ui-ux-pro-max` trước khi báo xong).

## Luật chung

- **G1 Nâng cấp màn đang có, không dựng lại.** Giữ bố cục, hình ảnh, MỌI thao tác của màn hiện tại + mockup nền đã duyệt (ghi ở từng mục). Chỉ đổi điều đề bài nêu. Chạy web thật (`npm run seed`, `npm run dev` ở cổng riêng của worktree) để xem màn hiện tại; tắt tiến trình của mình khi xong (chỉ theo đường worktree / cổng của mình).
- **G2 Hình ảnh theo bộ chuẩn v21** (màu, nền, viền, cỡ chữ, khoảng cách, thành phần: thanh tab, ô chọn có tìm mẫu A, chân panel "Đóng · Lưu nháp · Lưu", "✓ Đã lưu" xanh, dòng quy chế một dòng trên chân, hạn chỉ bằng màu, nút-chip "chữ + số"). **Tính năng theo luật** `02-luat.md`.
- **G3 Mục đích chủ SP (ý 6):** phần Tutor để làm rõ kết quả và đánh giá được tutor, **không sinh thêm việc**. Không thêm bước, ô bắt buộc, trạng thái, cảnh báo, chú thích tĩnh nào ngoài đề bài. Không có chữ "vắng", không nút giao người dạy, không lịch. Thấy chỗ đụng luật khác → [XM], không tự quyết.
- **G4 Đầu ra:** `thiet-ke/v21/<tên>.html` + `<tên>.css` riêng (`v21.css`, `bang-mau.css` CHỈ ĐỌC) + `<tên>-ghi-chu.md` gồm: bảng truy vết **dòng R → khung** (đủ mọi R) · bảng **khung → thành phần web hiện có → TRƯỚC → SAU** có dòng GIỮ / BỎ · bảng **thao tác TRƯỚC → SAU** · [XM] · bảng tự rà từng R (Đạt / Chưa + chỗ trong mockup). Ảnh từng khung ở `thiet-ke/v21/anh/<tên>/`: 1440 Tối + Sáng, 375 Sáng; mỗi khung có ảnh cặp **TRƯỚC (web hiện tại) │ SAU (mockup)**; kiểm `document.fonts` đã nạp Be Vietnam Pro trước khi chụp. Tên người bịa (không dùng tên thật GV / HV).
- **G5 Cổng chất lượng:** `critique` mục tiêu ≥ 35 / 40; chạm 30 thì tối đa 2 vòng sửa nữa; sau đó chỉ cần không còn P0 / P1. Điểm critique không thay bảng tự rà theo R.
- **G6 Xong:** PR chỉ gồm tệp trong `thiet-ke/v21/`, tiêu đề "mockup v21: … — chờ chủ SP duyệt", KHÔNG tự merge; nhắn session **"PTA Tutor"**: số PR, bảng tự rà, [XM], đường dẫn ảnh. Chủ SP nói gì trong session thì ghi nguyên văn vào tệp ghi chú mục 0 và chuyển PTA Tutor.

---

## Ⓣ1 Ghi kết quả PA Tutor + "PA đang chạy" — `thiet-ke/v21/tutor-ket-qua.html`

Nền: ① `trang-dau-gv.html` K4c (panel Ghi kết quả PA) · ⑫ `gv-viet-it.html` C1–C4 (dòng gộp + lưới + "Mở đầy đủ") · ⑬ `theo-doi.html` (dải "Sắp tới") · ③ `ho-so-hv.html` K1, K3 (thẻ PA, dòng quy chế) · ⑤ `bang-mau` câu Q14, Q20–Q25.
Mã màn hiện tại: `web/src/modules/cases/CapNhatTuan.tsx`, `BuoiTutorO.tsx`, `CasePanel.tsx`, `FormPa.tsx` · `web/src/modules/congViec/HoTroHocVienTab.tsx`, `LuoiKetQuaPa.tsx`, `SapToi.tsx`, `XacNhanPaLo.tsx`.
Vai vẽ: GV bộ môn (chính) · Head (mở việc của GV: tóm tắt chỉ đọc + làm thay như nay) · TVV (chỉ xem thẻ PA).

**A. Form Ghi kết quả PA Tutor** (panel — sửa trên K4c)

- R1.1 Thứ tự ô: Tiến triển \* → Quyết định \* → **Số buổi \*** → Tutor \* → Nội dung \* → 3 nút → "Đánh giá thêm" (gập) → "+ Tutor khác". Mọi ô khác của K4c (Ngày ghi "Ghi ngày · Đổi", Lý do khi Điều chỉnh / Thay, Minh chứng, dòng quy chế, chân) GIỮ.
- R1.2 **Số buổi** = hai ô số liền nhau **`[a] / [b]`** trên MỘT hàng, nhãn "Số buổi", chữ phụ trong ô (placeholder) "đã học" / "dự kiến". b điền sẵn từ kỳ trước (kỳ đầu: trống, GV gõ). Không chữ "vắng" ở bất kỳ đâu. PA có tổng (vd Kỳ vọng 10 buổi): cạnh ô hiện đếm tổng như nay "Đã học 4 / 10".
- R1.3 **a = 0** → ẩn Tutor, Nội dung, 3 nút, "+ Tutor khác"; form chỉ còn Tiến triển · Quyết định · Số buổi.
- R1.4 **Tutor** = ô chọn có tìm mẫu A, MỘT ô cho cả kỳ. Danh sách mở ra theo nhóm: gợi ý ("Monbay · R") → **Giáo viên** → **Tutor** → dòng cuối "Dùng tên: «chữ đang gõ»". Mỗi dòng: tên · nhãn phụ (GV: chi nhánh; tutor: nơi dạy · kỹ năng · 3 số cuối SĐT). Kỳ sau điền sẵn tutor kỳ trước, đổi được.
- R1.5 **Nội dung** = một ô chữ cho cả kỳ, có bộ đếm "n / 300", ngưỡng 8 ký tự (trạng thái "7 / 8" như lưới ⑫).
- R1.6 **3 nút Có / Không** (Có chuẩn bị bài · Xin tài liệu đúng hạn · Gửi feedback về HV cho GV) **chỉ hiện sau khi ô Tutor có tên**; **không dấu \***, không "n ô còn thiếu"; bấm lại nút đang chọn = bỏ chọn; giữ nút tắt "Cả 3 Có". Vẽ đủ: chưa có tên Tutor (không thấy 3 nút) · có tên, chưa chọn gì (lưu được) · chọn 2 / 3 (lưu được).
- R1.7 **"Đánh giá thêm"** gập như nay (sao 1–5 + Nhận xét về tutor); mở / gập không mất chữ; khi Sửa kết quả đã có đánh giá thì mở sẵn.
- R1.8 **"+ Tutor khác"** (nút phụ dưới khối): thêm một dòng nữa gồm ô số buổi nhỏ · Tutor · Nội dung · 3 nút · Đánh giá thêm; dòng 1 khi đó cũng lộ ô số buổi nhỏ; tổng các dòng phải = a — sai thì lỗi tại ô ("Tổng 3, đã học 2"), không mất chữ; mỗi dòng thêm có "Bỏ dòng". Vẽ trạng thái 2 dòng (1 + 1).
- R1.9 **Chân panel:** "Đóng" · **"Lưu nháp"** · "Lưu" (chính; mở từ danh sách còn việc kế → "Lưu · việc tiếp ›"). Lưu nháp không bắt ô nào; sau lưu nháp hiện "✓ Đã lưu nháp · {giờ}" và ở lại. Mở lại thấy dải "Nháp · {ai} · {ngày}" đầu form (đã có ở web — giữ). Bấm Lưu là lưu, không toast Hoàn tác.
- R1.10 **Bỏ khỏi form với PA Tutor:** ô "Người dạy kỳ này", ô "Hình thức", tiêu đề "Buổi 1 / Buổi 2", dấu \* ở 3 nút.
- R1.11 Trạng thái bắt buộc vẽ: mới mở (kỳ đầu, chưa nháp) · có nháp tuần 1 ("1 / 2", có tutor) · a = 0 · thiếu ô khi bấm Lưu (lỗi tại ô, nhảy tới ô đầu, chữ giữ) · đang lưu · lỗi máy chủ (ở lại, giữ chữ) · 409 "Có bản nháp mới hơn" (đã có — giữ câu) · đã lưu · **Sửa kết quả** một lần ghi cũ kiểu "mỗi buổi một dòng" (2 dòng, mỗi dòng 1 buổi — hiện đúng như dữ liệu, sửa được) · chỉ xem (TVV) · Kết quả cuối (PA quy chế chạm mốc — giữ như K4c).
- R1.12 375: panel toàn màn; Số buổi vẫn một hàng; 3 nút Có · Không chia đôi bề ngang, cao 44; ô Tutor mở danh sách toàn bề ngang.

**B. Xác nhận / Thêm / Sửa PA Tutor**

- R1.13 Xác nhận PA (một em — K của ① / ③, và "Xác nhận n PA" cùng lúc): PA Tutor **không còn** ô "Số buổi / 2 tuần" và ô "Người dạy" → còn Nội dung PA + Ngày bắt đầu + nút Xác nhận. Vẽ TRƯỚC │ SAU.
- R1.14 Thêm PA / Sửa PA loại Tutor: không còn ô "Người dạy"; ô "Số buổi" đổi nhãn **"Tổng số buổi"**, tuỳ chọn. PA loại khác không đổi (vẽ một PA Tự học cạnh để thấy không đổi).

**C. Thẻ PA và lịch sử trong Case** (hồ sơ HV, hồ sơ lớp, Ngăn Case — ③ K1)

- R1.15 Thẻ PA Tutor đang chạy: dòng tóm tắt kỳ gần nhất "2 / 2 buổi · {tên tutor}"; có nháp → nhãn "nháp 1 / 2 · 20/11" (bấm = mở form). Không còn dòng "Người dạy: …".
- R1.16 Lịch sử kết quả: mỗi lần ghi một khối "Kỳ W1–W2 NOV · 1 / 2 buổi" → dòng "{tutor} · {số buổi nếu > 1 dòng}: {nội dung}" + 3 dấu ✓ / ✗ kèm chữ **chỉ khi có trả lời** + sao nếu có. Lần ghi cũ (mỗi buổi một dòng, có Hình thức) hiện như cũ.

**D. Công việc của GV — khối "PA đang chạy"** (trang đầu GV, tab đang chứa nhóm "Kết quả PA")

- R1.17 Ngay dưới nhóm việc "Kết quả PA" thêm khối **"PA đang chạy"**: dải đầu khối cùng dáng dải nhóm (V18) nhưng **vạch trái trung tính + chip đếm mờ "12 PA"** — nhìn là biết không phải việc cần làm ngay. Không cộng vào "n việc", badge tab, badge menu, chuông.
- R1.18 Mỗi dòng: tên em (link hồ sơ) · thẻ phụ "kỹ năng · MT" như dòng việc · tên PA ("Học Tutor", "Tự học"…) · **hạn kỳ** "hạn 01/12" (màu thường) · bên phải: nhãn nháp "nháp 1 / 2 · 20/11" hoặc nút phụ "Ghi nháp". Gom theo lớp như nhóm trên (dòng lớp "CP FT 131 · 7 PA ▾" mở khay em / mở lưới).
- R1.19 Bấm dòng em → mở form mục A (nút chính lúc này vẫn là "Lưu"; "Lưu nháp" đứng cạnh). Bấm dòng lớp → lưới mục E.
- R1.20 Khối mặc định **gập khi > 10 dòng** (dải đầu khối + "▾"), nhớ trạng thái gập theo người (localStorage). Áp mọi loại PA.
- R1.21 **Bỏ** cụm "Ghi kết quả PA · {ngày} n" khỏi dải "Sắp tới" (⑬ H7) — cụm "Test" giữ nguyên.
- R1.22 Trạng thái: không có PA đang chạy → không vẽ khối · đang tải (khung xương cùng `/my-work`) · lỗi tải (theo câu chuẩn của trang, không thêm câu riêng) · GV nhiều lớp (3 lớp, 25 PA — gập) · em có KQ thi thật / Tạm dừng không có trong khối.
- R1.23 375: mỗi PA một thẻ hai dòng (tên em · hạn │ kỹ năng · PA · nhãn nháp); dải đầu khối cao 44.

**E. Lưới Ghi kết quả PA** (⑫ C2 — dòng gộp cùng lớp + cùng kỳ)

- R1.24 Dòng PA Tutor ghi được ngay trong lưới: thêm cụm **`[a] / [b]`** + ô Tutor (mẫu A, hẹp) trước ô Nhận xét (= Nội dung). 3 nút, Đánh giá thêm, "+ Tutor khác" KHÔNG nằm trong lưới → "Mở đầy đủ" (đã có). Dòng PA khác không đổi. Cột thẳng hàng giữa dòng Tutor và dòng thường (ô không dùng để trống, không co cột).
- R1.25 Trạng thái dòng Tutor: chưa ghi · nháp · thiếu (a ≥ 1 mà chưa có Tutor / Nội dung < 8) · sẵn lưu · lỗi + Thử lại · đã lưu gập + "Sửa". Chân lưới giữ ba nút như ⑫.

**Tiêu chí nghiệm thu Ⓣ1** (PTA rà từng dòng): mọi R1.1–R1.25 có khung · không có chữ "vắng", "Người dạy", "Hình thức", "Buổi 1" ở form PA Tutor · ghi một kỳ thường của PA Tutor GV gõ **tối đa 5 ô** (Tiến triển · Quyết định · a · Tutor · Nội dung — b và Tutor điền sẵn từ kỳ trước; nay 2 buổi hơn 10 ô) · khối "PA đang chạy" không làm đổi số "n việc" trong ảnh · bảng thao tác TRƯỚC → SAU không mất thao tác nào ngoài các ô ở R1.10, R1.13, R1.14.

---

## Ⓣ2 Trang Tutor — `thiet-ke/v21/tutor.html`

Nền: `thiet-ke/mockup-v4-phan-tich-tutor.html` khung t1, t2, t3 + `-truy-vet.md` (chủ SP duyệt 22/10 — **bố cục và nội dung**) · `thiet-ke/mockup-tutor-1-head-tutor-2026-10-19.html` mục 4, 5 (Tải danh sách, Gộp tên) · hình ảnh theo bộ chuẩn v21 (`phan-tich.html`, `bang-mau.html`).
Mã (đang ẩn — bật lại để xem: tạm sửa route cục bộ, không commit): `web/src/modules/tutor/TutorPage.tsx`, `PanelTutor.tsx`, `HopTutor.tsx`, `TaiDanhSach.tsx`; máy chủ `server/src/tutors/trang.ts`.
Vai vẽ: Head tutor (toàn hệ thống, chính) · Head (một chi nhánh) · CX (chỉ xem) · Quản trị như Head tutor (không cần khung riêng).

- R2.1 Menu **"Tutor"** sau "Phân tích" (G11) cho Head tutor · Head · Quản trị · CX. 375: nằm trong "Thêm" (thanh dưới ≤ 5 nút). GV không có.
- R2.2 Một trang, **một bảng "Người dạy"** (không tab): Tên (kèm nhãn nhỏ **GV** / **Tutor**) · Nơi dạy · Kỹ năng · **Buổi** (trong khoảng) · Chuẩn bị · Tài liệu · Feedback GV · Đánh giá · Kết luận / lý do. Ba cột tỉ lệ ghi "Có / có trả lời" (vd "5 / 6"); kỳ không ai trả lời → "—". Có "Không" → chữ cam + lý do bằng chữ ở cột cuối (không chỉ màu). Dùng thành phần bảng chuẩn; không điều khiển trong tiêu đề bảng (G9).
- R2.3 Đầu trang một hàng: tiêu đề · **Khoảng tuần** (mặc định 4 tuần gồm tuần này; không "Toàn bộ") · ô tìm tên / SĐT · "Lọc ▾" (Nơi dạy, Kỹ năng, Loại GV / Tutor) · bên phải: **"Xuất số buổi"** (phụ) · "Tải danh sách" (phụ) · **"Thêm tutor"** (chính). Head: thấy "Thêm tutor" + "Tải danh sách"; CX: chỉ thấy "Xuất số buổi".
- R2.4 Chip lọc có số: **Cần chú ý** · **Đang dạy** · **Ngừng** · **Tất cả**; mặc định "Cần chú ý" khi > 0, không thì "Đang dạy", không có ai đang dạy thì "Tất cả" — trang không bao giờ mở ra trống khi có người dạy. **Không** khối "Việc của bạn" (chủ SP chốt C2).
- R2.5 Dải mỏng trên bảng khi có: **"n tên gõ tay chưa có trong danh sách · m buổi · Gộp…"** (Head tutor, Quản trị, Head trong chi nhánh mình).
- R2.6 **Panel một người dạy** (bấm tên / hàng; bấm số ở 3 cột → panel lọc sẵn dòng "Không"): đầu (tên · nhãn GV / Tutor · SĐT · nơi dạy · kỹ năng · "Sửa" — GV thì không có "Sửa", thông tin lấy từ hồ sơ GV, có link "Hồ sơ GV ›") → dải 5 số (Buổi · Chuẩn bị · Tài liệu · Feedback GV · Đánh giá; bấm = lọc) → khối **Nhận xét** (Kết luận \* Ổn · Cần cải thiện · Ngừng hợp tác + Nhận xét \* ≥ 8 ký tự + "Lưu nhận xét"; Head / CX chỉ đọc) + dòng thời gian nhận xét → bảng **Kết quả đã ghi** (Ngày ghi · Học viên + "lớp · ghi: người ghi" · KN · **Số buổi** · 3 dấu ✓ / ✗ / "—" · Đánh giá · Nội dung + Nhận xét về tutor nếu có) + công tắc "Chỉ dòng có Không". Dùng khoảng tuần của trang (không bộ chọn thứ hai). Không link sang hồ sơ HV / Case từ panel (giữ 20/10).
- R2.7 **Xuất số buổi**: hộp nhỏ chọn khoảng tháng (mặc định tháng này) → tải Excel "người dạy × tháng: số buổi" (+ cột loại, nơi dạy). Trong bảng không thêm cột tháng. Vẽ hộp + trạng thái đang xuất / lỗi.
- R2.8 **Thêm / Sửa tutor** (hộp nhỏ): Tên \* · SĐT · Nơi dạy chính (chi nhánh · Chỉ online · trống) · Kỹ năng \* (L R W1 W2 S). Head: Nơi dạy cố định chi nhánh mình (hoặc Chỉ online). Lỗi tại ô ("SĐT đã có: {tên}"); trùng tên chỉ nhắc. Thiếu SĐT / nơi dạy: chữ nhỏ trung tính dưới tên trong bảng, không chip, không lọc riêng.
- R2.9 **Tải danh sách** (panel) và **Gộp tên gõ tay** (hộp nhỏ + Hoàn tác): giữ luồng 20/10 (mockup tutor-1 mục 4, 5), vẽ lại theo v21; Gộp: ô chọn có tìm mẫu A, gợi ý cả GV.
- R2.10 Trạng thái: bảng rỗng lần đầu (danh bạ trống — đúng tình trạng bản chính: câu một dòng + nút "Thêm tutor" / "Tải danh sách"; vẫn hiện GV có buổi nếu có) · lọc không khớp · đang tải · lỗi tải + Thử lại · CX / Head chỉ xem phần không có quyền (không nút, không 403 trống) · nhiều dữ liệu (40 người, phân trang 20) · người dạy 0 buổi trong khoảng (một ô "chưa có buổi trong khoảng").
- R2.11 375: mỗi người một thẻ — tên + nhãn · kỹ năng · nơi dạy │ lý do / kết luận │ Buổi · 3 tỉ lệ một hàng │ ★; bộ lọc ≤ 120 px trước thẻ đầu; panel toàn màn + "‹ Quay lại".
- R2.12 Chữ: một tên một khái niệm — "Người dạy" (bảng, gồm GV + tutor) · "Tutor" (tên trang / menu, nút "Thêm tutor") · "Buổi" · "Kết luận". Không IN HOA, không chú thích tĩnh; định nghĩa "Cần chú ý", cách tính tỉ lệ → ⓘ.

**Tiêu chí nghiệm thu Ⓣ2:** mọi R2.1–R2.12 có khung · Head tutor tới người cần chú ý đầu tiên ≤ 3 bấm (mở trang → hàng → Lưu nhận xét) · bảng ≤ 10 cột không cuộn ngang ở 1280 · mọi ✕ / ⋯ thẳng hàng ≤ 1 px · danh bạ trống không ra trang trắng · bảng thao tác TRƯỚC (mã `TutorPage` hiện có) → SAU không mất thao tác nào (Thêm · Sửa · Xoá khi chưa có buổi · Tải danh sách · Gộp + Hoàn tác · Nhận xét + sửa / xoá nhận xét · lọc · tìm · phân trang).
