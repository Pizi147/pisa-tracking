# AUDIT-UI 08/11 — rà toàn bộ giao diện PISA Progress

Rà và báo cáo, **không sửa code**. Bản rà là main `5a570c2be` (sau #1230, #1234). Dữ liệu là seed demo, ngày demo 14/09/2026. Không đọc Turso.

## 0. Cách làm và cách đọc báo cáo

- **Phạm vi:** các trang Tổng quan, Học viên & Lớp (4 tab), Hồ sơ lớp (5 tab), Hồ sơ HV, Hồ sơ GV, Test (Lịch tuần, Kế hoạch, Chấm Test), Công việc (mọi tab, Của tôi / Của GV), Phân tích (6 tab), Quản trị, Lưu trữ, Hướng dẫn, Hồ sơ cá nhân. Rà theo 4 vai: GVCN (Hà), QL Monbay (Vy), Quản trị, TVV. Mở thêm 24 panel, hộp và popover: Nhập điểm, + Case, Ghi vi phạm, Xác nhận xử lý, Từ chối, ⋯ lớp, ⋯ hàng, ⋯ HV, chip SOS, ⓘ, ô số Tổng quan, thông báo, menu tài khoản, Thêm HV, Bộ lọc thêm, Tạo tài khoản, hộp điểm ở lưới.
- **Kích thước và chế độ:** 1440 tối là chính, 375 sáng là chính. Có thêm 375 tối và 1440 sáng ở 5 trang. Ảnh chụp bằng Playwright + Edge. Mọi ảnh đã kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') = true`, nên cỡ chữ đo được là thật.
- **Skill đã dùng:** `karpathy-guidelines`, `impeccable` (critique: A = rà thiết kế, B = bộ dò + bằng chứng máy), `ui-ux-pro-max` (tra luật UX: "Compact Label Overflow", "Table Handling"), `web-design-guidelines` (trong phần B).
  ⚠️ **Rà A không chạy riêng một agent.** Nó chạy trong session chính vì cần dùng chung trình duyệt, dữ liệu seed và toàn bộ luật. B chạy riêng một agent, và bản tóm tắt của B chỉ được đọc sau khi rà A đã xong. Bằng chứng máy đầy đủ nằm ở `bang-chung-may.md` cùng thư mục (bộ dò, quét a11y, bảng đo tương phản).
- **Mỗi dòng có cột Kiểu:**
  - **Lỗi** — trái luật đã chốt (DESIGN.md V*/G*, luật 07/11 "bỏ chú thích", M2…). Sửa thì không cần hỏi lại.
  - **Đề xuất** — PTA / chủ SP chọn làm hay không.
  - **[XM]** — đụng khung mockup đã duyệt, luật đã chốt hoặc thao tác V4. Không tự làm.
  - **Xác minh** — thấy lệch số hoặc chữ nhưng chưa rõ là lỗi. PTA kiểm trước.
- **Cột Mockup:** "có" khi phải đổi bố cục; "không" khi chỉ đổi chữ, màu, token, hoặc thêm theo mẫu sẵn có.
- **Không có trong báo cáo:** U02 (khung phải trống ở Công việc — chủ SP chốt giữ như cũ). Báo cáo không đề xuất đổi luật nghiệp vụ nào.

### Điểm Nielsen (chỉ tham khảo — không dùng điểm này để quyết)

Hiển thị trạng thái 3 · Khớp thế giới thật 3 · Kiểm soát 3 · **Nhất quán 2** · Phòng lỗi 3 · **Nhận ra hơn nhớ 2** · Linh hoạt 3 · **Tối giản 2** · Sửa lỗi 3 · Trợ giúp 3 → **27 / 40**.
Ba điểm thấp có chung một gốc:
1. Cùng một số hoặc một chữ xuất hiện 2–3 lần trên một màn.
2. Số đếm đổi nghĩa mà không đổi dáng.
3. Chữ giải thích và chữ lặp còn sót sau đợt BO-CHU-THICH 07/11.

Nền đã tốt và nên giữ: thang chữ, bốn nhóm badge, chip SOS theo độ đặc, ✓ / ✗ tô trên chính con số, tương phản chữ ≥ 4,5 ở cả hai chế độ (trừ một chỗ, xem C10), không trang nào cuộn ngang ở 375.

---

## 1. Mười việc nên làm trước

| # | Việc | Vì sao trước | Mã | Mockup |
|---|---|---|---|---|
| 1 | **Chip, nhãn ngắn không xuống dòng + đổi tên loại cho ngắn**: Tổng quan QL › Chờ bạn duyệt ("Xử lý Ý thức cần duyệt", "Không cần theo dõi" bị gãy hai dòng, tên em lệch cột), người làm "Phạm Thu Trang / GVBM", nút "Thái độ / hành vi" | Trang đầu của QL; vi phạm luật M2; ui-ux-pro-max xếp mức High | C5 | không |
| 2 | **Tab Lịch thi (HV & Lớp) bớt chữ lặp**: 43 dòng đều ghi "Chưa có lịch" + "chưa có tháng thi" + "Đặt tháng · Chốt ngày"; cột Ghi chú trống cả cột | Nhiều chữ thừa nhất trên một màn | HL3 | không |
| 3 | **Dọn chữ giải thích tĩnh còn sót** (Quản trị, Hồ sơ cá nhân có chữ IN HOA, Hồ sơ GV, Phân công GV, Tạo Case, Ghi vi phạm, Xác nhận xử lý) | Lỗi theo luật 07/11, sửa nhanh | C6 | không |
| 4 | **Số 0 và ô rỗng mờ đi** (cột toàn 0, "0 / 0 %", chip lọc "… 0") để số khác 0 nổi lên | Làm nổi điều cần nổi; một luật CSS áp toàn web | C2 | không |
| 5 | **Một số một nghĩa, luôn có đơn vị**: badge tab Công việc đổi nghĩa theo màu (đỏ = quá hạn, vàng = gần hạn, trắng = tổng); công tắc "Fast Track 6" (đếm lớp) nằm sát tab "Tất cả 51" (đếm HV) | Người dùng không đối chiếu được số với danh sách | C8, HL1 | không ([XM] một phần) |
| 6 | **Thẻ "Điều hướng" ở Tổng quan lặp chỉ số và menu**; ở 375 thẻ này đứng TRÊN bảng chính | Bớt một khối ở trang đầu mọi vai | C1, TQ4 | **có** [XM] V10 |
| 7 | **Test gọn**: bỏ cột "MT" lặp chip lượt cạnh tên, bỏ viên "Đang chấm" mặc định, gộp ô "còn chấm" | Lưới dày nhất web, bớt 3 thứ lặp | T1, T3, T4 | không ([XM] T1) |
| 8 | **Dòng Công việc bớt chữ lặp**: chữ "quá hạn n ngày" lặp tên nhóm "Quá hạn"; mã tuần ở cột hạn; "· 3 em" lặp nút. Thêm một câu hỏi chủ SP: ở 375, ẩn nút theo V18 hay giữ nút theo mockup v12 (giữ thì tên việc bị bẻ 2–3 dòng) | Màn GV mở nhiều nhất | CV3, CV4, CV8 (+ CV10 [XM]) | không |
| 9 | **A11y kỹ thuật** (từ B): hàng Việc quản lý chỉ bấm được bằng chuột; chữ khớp tìm `--hong` ở chế độ sáng chỉ 2,9 : 1; hàng làm mờ bằng opacity xuống 2,1–2,9 : 1; viền ô chọn / nút đoạn 1,7–2,2 : 1; vùng chạm ‹ › ở 375 chỉ 20–24 px | Lỗi a11y thật, không ai thấy bằng mắt | C9–C13 | không (token viền cần chủ SP gật) |
| 10 | **Chữ, màu sai luật đã chốt**: "Vấn đề" còn trong Tạo Case (V21 đã đổi thành "Case"); "— · KCK" gạch chấm (G6); chip "GVCN" màu xanh lá của kết quả (V4) | Sửa vài dòng, đúng luật | F1, HSL2, GV1 | không |

Ngoài 10 việc: có **8 chỗ cần PTA xác minh số / quyền** trước khi coi là lỗi (mục 3).

---

## 2. Phát hiện theo trang

Loại: **chữ** = bớt chữ · **tt** = bớt thông tin · **nổi** = nổi bật · **màu** = màu / tương phản · **a11y** · **nq** = nhất quán · **375**.

### 2.1 Toàn web (khung, thành phần dùng chung)

| ID | Chỗ | Vấn đề | Đề xuất cụ thể | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| C1 | Tổng quan › thẻ "Điều hướng" (GV, QL, TVV) | Lặp nội dung đã có: "Việc của tôi ›" trùng ô số "Việc của tôi ›" và menu Công việc; "Thi tháng này", "Case chưa có PA" trùng ô số. Ở 375 thẻ này đứng trước bảng chính (ảnh 01, 02, 15) | Bỏ các dòng trùng ô số / menu. Chỉ giữ link không có ở chỗ khác (Hồ sơ GV của tôi, Lịch thi, Báo cáo), dạng một hàng link nhỏ cuối trang. Ở 375 đặt cuối | tt · 375 | P2 | có | [XM] V10 ("cột Chờ bạn duyệt / Điều hướng") |
| C2 | Mọi bảng, ô số, chip lọc | Số 0 cùng màu, cùng độ đậm với số thật: cột "Thi tháng này" toàn 0, "Case 0", Phân tích "0 / 0 %", Phân công GV, chip "Thi tháng này 0", "Chưa có vai trò 0" | Số 0 dùng `--text-faint` 400 (G6 đã có "số 0 không bấm"). Chip lọc có số 0: mờ + `aria-disabled`, hoặc ẩn. Ô số không có dữ liệu ("—", "Chưa có dữ liệu"): cũng mờ | nổi | P2 | không | Đề xuất |
| C3 | Quản trị › Kỹ năng; tiêu đề việc "Nhập điểm Listening, Reading" | Kỹ năng ghi đủ chữ ở chỗ này, ở chỗ khác ghi chip mã L · R · W1 · W2 · S | Dùng chip mã kỹ năng mọi nơi (tên đủ ở `aria-label` / rê chuột) | nq · chữ | P3 | không | Đề xuất |
| C4 | Nút quay lại và Trước / Sau ở các hồ sơ | Hai dáng: "‹ Học viên & Lớp" chữ trần (hồ sơ lớp) và nút có viền (hồ sơ HV, GV, MT). Bộ chuyển cũng hai dáng: "‹ 1/6 · Fast Track ›" và "‹ Trước 1/33 · Lớp MB FT 101 Sau ›" | Chọn một dáng (nút viền, cao 32, ở 375 cao 44) và một mẫu chữ "‹ n/N · {nguồn} ›" | nq · a11y | P2 | không | Lỗi (nhất quán) |
| C5 | Chip / nhãn ngắn: Tổng quan QL › Chờ bạn duyệt; Công việc QL › người làm; Ghi vi phạm › nút Nhóm; Hồ sơ HV › "Bằng chứng · chưa có" | Chip và nhãn gãy hai dòng, cột tên em lệch theo (ảnh 02) | `white-space: nowrap` cho chip / nhãn; cột loại rộng cố định. Đổi tên loại cho ngắn: "Xử lý Ý thức cần duyệt" → **"Duyệt xử lý"** (đã có chip "Ý thức"), "Không cần theo dõi" → **"Bỏ theo dõi"**; vai sau tên viết mờ cùng dòng ("Phạm Thu Trang · GVBM") | nq · chữ | **P1** | không | Lỗi (M2) |
| C6 | Chữ giải thích tĩnh còn sót | Quản trị "Tài khoản, danh mục và cấu hình quyền của phần mềm."; Hồ sơ cá nhân có 4 câu, trong đó một câu IN HOA "Đây là NĂNG LỰC…" (ảnh 06); Hồ sơ GV "lượt Test của từng HV có tuần Test trong kỳ" (đã có ⓘ cạnh); Phân công GV "số môn đang dạy", "số lớp chủ nhiệm" (cạnh ⓘ); Tạo Case "Chọn học viên trước", "Nhận định của người báo, không phải mức SOS", "Sai ở đâu, bài hay buổi nào" (ảnh 09); Ghi vi phạm "* = bắt buộc" + "(không bắt buộc)"; Xác nhận xử lý "Đã có mức độ vi phạm từ trước? …"; Bằng chứng "Dán ảnh (Ctrl + V) · kéo thả tệp" | Bỏ, hoặc chuyển vào ⓘ / placeholder. GIỮ ràng buộc nhưng chỉ hiện khi gõ sai: "Phải có đuôi .pisa@gmail.com", "Ít nhất 6 ký tự". Không viết IN HOA | chữ | P2 | không | Lỗi (luật 07/11) |
| C7 | Dòng loại panel "VIỆC · CHẤM ĐIỂM", "BÁO CÁO · CHỈ ĐỌC" | Chữ in hoa (G13 cấm) + vạch hồng (V2: hồng chỉ để nhận diện) | Chữ thường 13 / 600 `text-dim`, vạch màu nhấn hoặc bỏ vạch | nq · màu | P3 | không | [XM] mockup NEN-PANEL |
| C8 | Badge số trên tab Công việc / Test | Cùng một dáng mà ba nghĩa: đỏ = số quá hạn, vàng = số gần hạn, trắng = tổng dòng (`badgeTab`). Ví dụ tab "Chấm điểm 4" có 7 dòng. Cùng màn còn có "27 việc · 9 quá hạn" ở đầu trang và badge menu "9" | Badge tab theo đúng một luật với badge menu (V13: dòng cần làm ngay; 0 → không số). Tổng dòng chỉ ở đầu trang. `aria-label` đọc đủ "4 quá hạn trong 7 việc" | nq | P2 | không | [XM] S11 / V13 (badge tab chưa có luật riêng) |
| C9 | Viền `.btn`, `.doan`, `.o-xem` (token `--line-strong`) | Tương phản viền 1,7–2,2 : 1 ở cả hai chế độ. Ô chọn và nút đoạn cần ≥ 3 : 1 (WCAG 1.4.11) | Viền ô chọn / nút đoạn dùng `--o-nhap-vien` (đã đạt 3,1–3,5 : 1); nút có chữ giữ nguyên | màu · a11y | P2 | không | Đề xuất (đổi token → chủ SP gật) |
| C10 | `.khop-tim`, `tr.hang-khop` (index.css:586–587) | Chữ khớp khi tìm dùng `--hong`, ở chế độ sáng chỉ 2,9–3,1 : 1 | Chế độ sáng dùng `--hong-chu` | màu | P2 | không | Lỗi |
| C11 | Hàng làm mờ bằng `opacity-50/60` (AccountsAdmin:263, ChiNhanhAdmin:46, CatalogAdmin:99, TabTongKetLop:110/135, TutorPage:177, HoSoGiaoVienPage:441) | Ở chế độ sáng chữ còn 2,1–2,9 : 1 | Thay opacity bằng màu `--text-faint` + nhãn "Đã xoá" / "Đã khoá" | màu · a11y | P2 | không | Lỗi |
| C12 | Bàn phím | `MgmtTasksPage.tsx:229` hàng Việc quản lý chỉ mở bằng chuột; `MeetingPage.tsx:249` ô `td onClick`; 5 ô chỉ có placeholder làm nhãn (ChiTietKyNang:47/54, MeetingPage:365/471, PhoiHopSosSection:329); `.o-xem select { outline:none }` | Hàng → `button` / link; ô → `<label>` / `aria-label`; focus dùng vòng 2 px chung | a11y | **P1** (229) · P2 | không | Lỗi |
| C13 | Vùng chạm ở 375 | Đo được: ‹ quay lại cao 20 px, Trước / Sau 24, nút thu / mở nhóm Lịch Test 16, ⋯ Quản trị 28, tam giác mở hàng lớp ~8 px | Cao ≥ 44 px ở 375 (DESIGN: `max-sm:min-h-[44px]`); chevron 16 px nằm trong vùng bấm 44 | a11y · 375 | P2 | không | Lỗi (DESIGN Layout) |
| C14 | Chuỗi "a · b · c" dài | Dòng tóm tắt Case "Chờ xác nhận PA · PA Tutor · đến lúc thi · đã lên kế hoạch · Phạm Thu Trang"; Lưu trữ "Beginner · Monbay · GVCN … · 2 HV từng học" | Tách trường theo M10 (trạng thái = viên, người = chữ mờ + biểu tượng, thời hạn = chip); bỏ các trường đã biết | chữ · nq | P3 | không | Đề xuất (M10) |
| C15 | Kỹ thuật (từ B) | 30 chỗ đặt z-index tuỳ ý (`pc-hop` 60 trùng Menu 60); 5 lệnh cuộn `smooth` không kiểm reduced-motion; `btn-lg` không được định nghĩa (PanelBuocTiep:110/111/176); thiếu `meta theme-color` | Lập thang z-index; kiểm `prefers-reduced-motion`; định nghĩa hoặc bỏ `btn-lg` | a11y · nq | P3 | không | Lỗi nhỏ |
| C16 | Ô tìm kiếm › chữ gợi ý "Ctrl K", chế độ sáng | Nhìn ảnh 1440 sáng thấy rất mờ, chưa đo | Đo, nếu < 4,5 : 1 thì dùng `--text-faint` | màu | P3 | không | Xác minh |

### 2.2 Tổng quan

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| TQ1 | GV › dòng sau tiêu đề | "Tổng quan · Trần Ngọc Hà · W3 SEP · kỳ…": tên của chính mình là thừa (đã có ở nút tài khoản) | "Tổng quan · W3 SEP · kỳ W4 AUG – W3 SEP" | chữ | P3 | không | Đề xuất |
| TQ2 | Kỳ của GV và của QL / TVV | GV: "kỳ W4 AUG – W3 SEP" (4 tuần, gồm tuần này). QL / TVV: "kỳ W1 SEP – W2 SEP" (2 tuần trước) | Nếu có chủ đích thì giữ; nếu không thì dùng một hàm kỳ cho mọi vai | nq | P3 | không | Xác minh |
| TQ3 | Bảng "Kỹ năng tôi dạy", "Lớp tôi chủ nhiệm" | Đơn vị lặp dưới mọi ô: "14 / HV", "11/14 lượt" × 10 hàng | Đơn vị lên đầu cột ("Dưới kỳ vọng · HV"); ô chỉ còn số; phân số mờ | chữ | P3 | không | [XM] V13 "đơn vị luôn ghi" |
| TQ4 | TVV (ảnh 07) | Ô "Chờ KQ · Lộ trình tiếp 0 · 1 HV" có hai số trong một ô; thẻ "Thi thật" gồm 3 dòng link không số, trùng ô số; thẻ "Điều hướng" trùng menu | Tách hai ô "Chờ KQ 0", "Chưa chốt LT 1"; hoặc giữ thẻ Thi thật có số và bỏ ô trùng; bỏ Điều hướng (C1) | tt · nổi | P2 | có | [XM] V10 |
| TQ5 | QL › Giáo viên › % | 0 % và 100 % cùng màu nhấn, cái cần chú ý không nổi | Không đổi (N32: "không ngưỡng"); chỉ áp C2 cho 0 / "—" | nổi | — | — | Ghi để không làm |

### 2.3 Công việc

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| CV1 | Tên dòng việc (ảnh 03) | Tên dòng lặp động từ của nút: "Nhập điểm Listening, Reading" + nút **Nhập điểm**; "Thêm PA học thuật · Reading" + **Thêm PA**; "Mô tả Case" + **Mô tả Case** | Trong tab đã nói rõ loại việc: tên = đối tượng ("Listening, Reading" / "PA học thuật · Reading"), động từ chỉ ở nút | chữ | P2 | có (v12) | [XM] V18 (tên việc 15 / 500) |
| CV2 | Nhóm trong tab Chấm điểm | Hai trục trộn nhau: nhóm "Quá hạn" theo hạn, rồi "Mock Test", "Progress / Final Test" theo loại. Việc MT quá hạn nằm ở nhóm Quá hạn, việc MT chưa tới hạn nằm ở nhóm Mock Test | Một trục: theo loại, quá hạn lên đầu mỗi nhóm (đúng như V11 "quá hạn lên đầu nhóm"); hoặc theo hạn, loại thành chip | nq | P2 | có | [XM] mockup v12 |
| CV3 | Cột hạn trong nhóm "Quá hạn" | Tiêu đề nhóm đã nói "Quá hạn", mỗi dòng vẫn có hai dòng chữ "⚠ quá hạn 68 ngày" + "hạn 08/07" | Một dòng "⚠ 68 ngày · 08/07" (rê chuột / aria đọc đủ) | chữ | P3 | không | Đề xuất (M3) |
| CV4 | Cột hạn của dòng chưa quá hạn | "W4 SEP / hạn 23/09": mã tuần ở cột hạn lặp với "tuần W3 SEP" ở dòng phụ; V8 quy định hạn ghi ngày thật | Chỉ giữ "hạn 23/09" | chữ | P3 | không | Đề xuất (V8 hạn = ngày thật) |
| CV5 | Dòng gộp "Nhập điểm · 4 lớp · 15 bài" | Nút ghi "15 bài", khác dáng "n em ▾" của các dòng gộp khác | "4 lớp ▾" theo mẫu `moCaDong` | nq | P3 | không | Đề xuất |
| CV6 | "Yêu cầu của tôi ▸", "Lớp tôi dạy ▸" | Tam giác ~8 px ở sát mép phải, xa tên; "Lớp tôi dạy" lại dùng biểu tượng người | Chevron 16 đặt cạnh tên, cả dải bấm được; biểu tượng lớp | a11y · nq | P3 | không | Đề xuất |
| CV7 | QL › người làm việc | "Nguyễn Khánh Vy · QL" là chính người đang xem; tên và vai gãy hai dòng | Ghi "Bạn"; vai cùng dòng, chữ mờ (C5) | chữ | P3 | không | Đề xuất |
| CV8 | GV › Ý thức & Phối hợp | "MB FT 101 · 1 em quá hạn · 3 em" rồi nút lại ghi "3 em ▾" | Bỏ "· 3 em" ở dòng phụ | chữ | P3 | không | Lỗi (M3) |
| CV9 | QL › tab "Case học thuật" | Tab này chứa nhóm "Báo PH · Báo phụ huynh qua TVV · Final Test 45%" — tên tab không khớp nội dung | Kiểm `nhomViec` → tab; nếu đặt nhầm tab thì chuyển tab | nq | P3 | không | Xác minh |
| CV10 | 375 › dòng việc (ảnh 15) | Ở 375 nút "Nhập điểm" vẫn hiện, nên tên việc gãy 2 dòng, dòng phụ gãy 2–3 dòng, mỗi dòng cao ~110 px. V18: "375: chạm cả dòng, hạn dưới tên, ẩn nút (trừ "n em ▾", Gia hạn)" | Làm theo V18. Lưu ý: mockup v12 (05/11, mới hơn V18) ghi "nút giữ nguyên như web hiện tại", nên chủ SP chọn một trong hai | 375 | P2 | không | [XM] V18 ↔ v12 |
| CV11 | Trang "Chờ duyệt" (Hộp duyệt) và tab "Chờ bạn duyệt" | Cùng một danh sách, hai nơi, hai dáng (dòng gọn và khối em) | Chọn một dáng (khối em của Công việc); Hộp duyệt chỉ còn là bộ lọc của cùng danh sách | nq | P3 | có | [XM] |
| CV12 | Test › "Chấm Test" (GV) và Công việc › Chấm điểm | Cùng việc chấm, hai danh sách, hai cách đếm ("Của tôi: 11 việc · 39 bài" và "27 việc") | Giữ một nơi làm việc (Công việc); Test chỉ là lịch | nq | P2 | có | [XM] |

### 2.4 Học viên & Lớp

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| HL1 | Công tắc "Fast Track 6 / Lớp thường 16" cạnh tab "Tất cả 51 · Đang SOS 17 · Lịch thi 43" | Hai đơn vị khác nhau (lớp, HV), cả hai không ghi đơn vị, nằm sát nhau | Bỏ số ở công tắc khung, hoặc ghi "6 lớp"; tab giữ số HV | nq | P2 | không | Lỗi (V13 "đơn vị luôn ghi") |
| HL2 | Hàng lớp › "GVCN Trần Ngọc Hà" | Chữ "GVCN" lặp ở mọi hàng | Giữ chữ nhưng `text-faint` 400, tên 500 (M1) | chữ | P3 | không | Đề xuất |
| HL3 | Tab Lịch thi (ảnh 05) | Mỗi dòng có hai dòng cùng nghĩa "Chưa có lịch" + "chưa có tháng thi"; link "Đặt tháng · Chốt ngày" lặp 43 lần; cột "Ghi chú" trống cả cột; tab mặc định "Tất cả 43" trong khi "Cần làm 0" | Một chữ "Chưa có lịch" mờ; hai link gộp thành một nút "Đặt lịch ▾" hiện ở dòng đang rê / đang chọn (375: luôn hiện); ẩn cột trống | chữ · tt | **P1** | không | Đề xuất |
| HL4 | Hàng lớp › tam giác ▸ | ~8 px, khó thấy và khó bấm | Chevron 16 trong vùng bấm 32 (375: 44) | a11y | P3 | không | Lỗi (C13) |
| HL5 | Phân công GV › hai bảng tổng | Cột toàn 0 sáng như số thật | Áp C2 | nổi | P3 | không | Đề xuất |

### 2.5 Hồ sơ lớp (ảnh 12)

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| HSL1 | Cột Kết quả | "– Chưa đủ dữ liệu" (21 ký tự) lặp 10 lần; chip lọc "Chưa đủ dữ liệu 10" đã nói điều này | "—" mờ, `title` / aria "Chưa đủ dữ liệu" | chữ | P2 | không | Đề xuất |
| HSL2 | Cột Target "— · KCK", dòng phụ "Thiếu 1" | Viết tắt KCK khó hiểu; gạch chấm chấm dưới chữ (G6 đã bỏ) | "Chưa có KV" (hoặc "—") + ⓘ; bỏ gạch chấm, nếu bấm được thì là ô số | chữ · nq | P2 | không | Lỗi (G6) |
| HSL3 | Đầu trang › chip "+1", "+4" | Không rõ nghĩa khi nhìn (chỉ trình đọc màn biết "1 việc khác của lớp") | "+1 việc", "+4 GV" | chữ | P3 | không | Đề xuất |
| HSL4 | Dòng "TVV Lê Thu" dưới tên em (11 px) | Lặp ở 25 / 33 dòng | Chỉ hiện khi khác TVV của đa số lớp, hoặc một cột TVV | tt | P3 | không | [XM] G13 (ngoại lệ chủ SP duyệt 30/10) |
| HSL5 | Panel Nhập điểm lớp › cột Kết quả | Có ô hiện mã tuần "W3 OCT", "W4 SEP" — là lịch, không phải kết quả | Kiểm ý nghĩa; nếu là lịch thì ghi "lịch W4 SEP" mờ | nq | P3 | không | Xác minh |
| HSL6 | Lưới Nhập điểm (lớp, Công việc, Lịch Test tuần) | Cột "MT" lặp chip lượt đứng cạnh tên ("Hồ Ngọc Diệp MT1 ›" + cột MT "MT1") | Bỏ cột MT; chip cạnh tên vẫn là link | tt | P2 | không | Đề xuất (áp chung với T4) |

### 2.6 Hồ sơ học viên

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| HS1 | Dải 6 thẻ điểm | Thẻ nào cũng ghi "MT3" dưới số; 375 cắt "MT3 · kỳ vọn…" | Ghi "MT3 · W2 SEP" một lần trên dải; thẻ Overall giữ "kỳ vọng 7.0" | chữ · 375 | P3 | không | Đề xuất |
| HS2 | Thẻ "Tiến độ trên lớp · Chưa có ghi nhận" | Thẻ rỗng chiếm nửa hàng, bên cạnh là khối Case dài | Rỗng thì thu thành một dòng (M7) | tt | P3 | không | Đề xuất |
| HS3 | Case › hàng Bằng chứng | "Bằng chứng · chưa có" gãy hai dòng + câu hướng dẫn dán / kéo | Nhãn một dòng; câu hướng dẫn đưa vào `title` của "+ Tệp" (C6) | chữ | P3 | không | Lỗi (C6) |
| HS4 | ⋯ hồ sơ (QL Vy) › "Xoá học viên" (ảnh 13) | Dòng phụ ghi "chỉ Quản trị hệ thống thấy dòng này" nhưng QL đang thấy | Kiểm quyền: nếu QL được xoá (N24 xoá mềm) thì đổi dòng phụ thành "xoá mềm · khôi phục 30 ngày"; nếu không thì đây là lộ quyền | nq · quyền | P2 | không | Xác minh |
| HS5 | Đầu trang › liên hệ | Ổn: chip PH / email / ngày sinh gọn | — | — | — | — | Giữ |

### 2.7 Test

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| T1 | Dải số Lịch tuần (ảnh 04) | "49/98 bài đã chấm" và "49 bài còn chấm": ô thứ hai chỉ là 98 − 49 | Gộp thành "49/98 đã chấm" (còn 49 nằm trong tooltip / panel); giữ ô quá hạn | tt | P3 | không | [XM] UI-LICH-TUAN (DaiSo) |
| T2 | Cùng màn | "45 bài quá hạn" ở dải số, nhưng ngay dưới là nhóm "Quá hạn chấm · 3 lớp · 33 bài" — hai số "quá hạn" khác nhau | G7: nếu hai phạm vi khác nhau (khung và tuần) thì nói rõ phạm vi; nếu cùng phạm vi thì đây là lỗi số | nq | P2 | không | Xác minh |
| T3 | Hàng lớp › viên "Đang chấm" | Lặp trên 7 / 8 lớp, mà "2/27 bài" đã nói | Chỉ hiện khi khác thường ("Chưa chấm", "✓ Đã chấm") | tt | P3 | không | Đề xuất |
| T4 | Lưới › cột "MT" | Như HSL6 | Bỏ cột | tt | P2 | không | Đề xuất |
| T5 | Hộp điểm ở ô | "Nên có nhận xét — dùng làm mô tả Case trên Case" — lặp chữ "Case"; V15 chọn cách nhắc bằng viền vàng + tooltip (cho ô lưới) | Bỏ câu, giữ viền vàng ô nhận xét + tooltip "Nhận xét sẽ thành mô tả Case" | chữ | P3 | không | Đề xuất (cùng hướng V15) |
| T6 | Chân lưới "MT cũ chưa nhập · MB FT 101 · MT1 · 4 em › · MT3 · 1 em ›" | Chuỗi dài, nhiều link nhỏ | "MT cũ chưa nhập: MT1 (4 em) ›, MT3 (1 em) ›" | chữ | P3 | không | Đề xuất |

### 2.8 Phân tích

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| PT1 | Báo cáo HV › Kết quả MT | Mỗi ô có hai số ("1 / 50 %"); nhiều ô "0 / 0 %" | Áp C2 (0 mờ); cân nhắc chỉ hiện %, đưa n vào tooltip | tt · nổi | P3 | không | Đề xuất |
| PT2 | "So lượt trước · HV ↑0 · =1 · ↓0" | Ký hiệu nhỏ, khó đọc | "Tăng 0 · Giữ 1 · Giảm 0" (DESIGN đã dùng chữ "Tăng / Giảm / Không đổi") | chữ · a11y | P3 | không | Lỗi nhỏ (nq) |
| PT3 | Ý thức › bảng "HV cần chú ý" (ảnh 14) | Có cột trạng thái "⚠ Quá hạn" + ô "2 quá hạn" trong báo cáo; G8 nói báo cáo không có cột quá hạn | Chủ SP chọn: bỏ "Quá hạn" khỏi Phân tích (việc đã có ở Công việc), hoặc ghi ngoại lệ vào G8 | nq | P2 | không | [XM] G8 |
| PT4 | Ô số không có dữ liệu ("Đạt Target thi thật —", "Thi trong kỳ 0") | Đứng hàng đầu, sáng như số có dữ liệu | Áp C2 | nổi | P3 | không | Đề xuất |

### 2.9 Hồ sơ giáo viên (ảnh 08)

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| GV1 | Lớp đang dạy › chip "GVCN" | Chip vai dùng màu xanh lá của kết quả "Đạt" (V4: màu mang nghĩa kết quả / tiến độ) | Chip trung tính (`surface-2` + chữ `text-dim`) | màu | P2 | không | Lỗi (V4) |
| GV2 | Case đang phụ trách › hàng chip | "⚠ Quá hạn 1" và "⚠ việc quá hạn 3" đứng cạnh nhau, hai nghĩa | "Case quá hạn 1" · "Việc quá hạn 3", hoặc chỉ giữ một | chữ · nq | P2 | không | Đề xuất |
| GV3 | "Việc đang tồn · hôm nay 14/09 · tuần W3 SEP" | Ngày, tuần lặp với đầu trang | Bỏ phần ngày | chữ | P3 | không | Đề xuất |
| GV4 | "Cần làm trước" › cột phải | "⚠ quá hạn 6 ngày Kết quả PA R · kỳ W4 AUG – W1 SEP" gãy hai dòng | Hạn và việc thành hai cột cố định (M10) | nq | P3 | không | Đề xuất |

### 2.10 Quản trị, Hồ sơ cá nhân, Lưu trữ, Hướng dẫn

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| QT1 | Quản trị › đầu trang (ảnh 11) | Câu mô tả dưới tiêu đề | Bỏ (C6) | chữ | P2 | không | Lỗi |
| QT2 | "Đăng ký chờ duyệt — Không có đăng ký nào đang chờ" | Thẻ rỗng luôn chiếm chỗ | Ẩn khi 0, hoặc hiện như một chip "Đăng ký chờ duyệt 0" | tt | P3 | không | Đề xuất |
| QT3 | "Tài khoản (32)"; chip "Chưa có vai trò 0" | Đếm trong ngoặc khác mẫu chip đếm; chip số 0 mờ khó đọc | Chip đếm như nơi khác; chip 0 theo C2 | nq | P3 | không | Đề xuất |
| QT4 | Cột Kỹ năng | Chữ đủ + "Chấm Speaking" nằm một hàng riêng nên hàng cao thấp không đều | Chip L · R · W1 · W2 · S + chip "Chấm S" cùng hàng | nq · chữ | P3 | không | Đề xuất |
| QT5 | 375 › bảng tài khoản | Bảng không chuyển thành thẻ (cuộn ngang trong bảng, email bị cắt) | Thẻ ở < 640 (DESIGN Layout) | 375 | P2 | không | Lỗi (DESIGN) |
| QT6 | Ô chọn Chi nhánh / Vai trò | Dùng `select` gốc của trình duyệt, khác dáng ô chọn "Mọi hạn ▾" | Dùng một thành phần ô chọn | nq | P3 | không | Đề xuất |
| CN1 | Hồ sơ cá nhân (ảnh 06) | 4 câu giải thích, một câu IN HOA | C6 | chữ | P2 | không | Lỗi |
| CN2 | Ô "Email đăng nhập" | Trông như ô sửa được nhưng (theo câu giải thích) không đổi được | Hiện là chữ + nhãn, không vẽ ô nhập | nq | P3 | không | Xác minh |
| CN3 | Chip kỹ năng L, R có dấu ✓ chồng lên góc chip | Lệch hình | ✓ nằm trong chip | nq | P3 | không | Lỗi nhỏ |
| LT1 | Lưu trữ › dòng lớp | Chuỗi "Beginner · Monbay · GVCN … · 2 HV từng học" | M10 (C14) | chữ | P3 | không | Đề xuất |
| HD1 | Hướng dẫn | Ổn: chế độ Read, cột chữ hẹp, phân nhóm rõ | — | — | — | — | Giữ |

### 2.11 Panel, hộp, popover

| ID | Chỗ | Vấn đề | Đề xuất | Loại | Mức | Mockup | Kiểu |
|---|---|---|---|---|---|---|---|
| F1 | + Case › Tạo Case (ảnh 09) | Nhãn "Vấn đề ⓘ", tab "Đang gặp vấn đề" — V21 đã đổi "Vấn đề" → "Case" | Nhãn "Case"; tab "Đang mở / Đã xong từ trước" | nq | P2 | không | Lỗi (V21) |
| F2 | Ghi vi phạm › nút Nhóm | "Thái độ / hành vi" gãy dòng trong nút | "Thái độ" (tên đủ ở aria), hoặc lưới 2 cột | chữ | P3 | không | Lỗi (M2) |
| F3 | Ghi vi phạm › nhãn | Có "* = bắt buộc" mà vẫn ghi thêm "(không bắt buộc)" | Chỉ dùng dấu * (C6) | chữ | P3 | không | Lỗi |
| TB1 | Thông báo (ảnh 10) | Mỗi tin vừa có "Quá hạn · …" vừa có "⚠ quá hạn 25 ngày"; link "Lớp ›" chiếm một dòng riêng | Bỏ tiền tố "Quá hạn ·"; mã lớp trong tiêu đề là link (luật tên = link) | chữ · tt | P2 | không | Đề xuất (M3) |
| OS1 | Panel ô số (Case đang xử lý…) | Phân trang "1–10 / 26 mục · Mỗi trang 10 20 50" trong panel hẹp | Cuộn + "Xem thêm"; bỏ chọn số dòng mỗi trang | tt | P3 | không | Đề xuất |
| OS2 | Panel "Chấm Test đúng hạn" | Tên bị cắt "Đoàn Minh Kha…" trong khi cột Lớp còn rộng | Chia lại độ rộng cột | nq | P3 | không | Lỗi nhỏ |
| MN1 | Menu ⋯ HV › dòng phụ dưới mục | "lịch MT" (dưới Lộ trình) không nói hậu quả gì; theo mockup 24 B, dòng phụ chỉ dùng khi có hậu quả | Bỏ "lịch MT"; giữ dòng phụ có hậu quả | chữ | P3 | không | Đề xuất |
| SOS | Popover "Vì sao SOS" | Ổn: kết luận → số → kỹ năng | — | — | — | — | Giữ |

---

## 3. Cần PTA xác minh trước (không coi là lỗi khi chưa kiểm)

TQ2 (kỳ khác nhau theo vai) · CV9 (Báo PH nằm trong tab Case học thuật) · HSL5 (mã tuần trong cột Kết quả) · HS4 (QL thấy "Xoá học viên" kèm dòng "chỉ Quản trị thấy") · T2 (45 và 33 bài quá hạn trên cùng màn) · CN2 (email đăng nhập trông như ô sửa được) · C16 ("Ctrl K" ở chế độ sáng) · PT3 (quá hạn trong Phân tích — trái G8).

---

## 4. Gói PR đề xuất

Một màn một PR khi đổi bố cục. Số dòng đổi là ước lượng theo số chỗ sửa, chưa tính phép kiểm. Không gói nào tăng đọc Turso: chỉ đổi chữ / CSS / dữ liệu đã nạp.

| Gói | Nội dung | Mã | Mockup | Ước dòng | Ghi chú |
|---|---|---|---|---|---|
| **A1 CHU-GON-FORM** | Bỏ chữ giải thích: Quản trị, Hồ sơ cá nhân, Tạo Case, Ghi vi phạm, Xác nhận xử lý, Bằng chứng, Hồ sơ GV, Phân công GV; "Vấn đề" → "Case" | C6, F1, F3, QT1, CN1, CN3, HS3, GV3, MN1 | không | ~120 | Sửa nhỏ, PTA tự merge được |
| **A2 CHU-GON-DONG** | Bớt chữ lặp trong dòng: Lịch thi, Kết quả "Chưa đủ dữ liệu", KCK, "+1", quá hạn trong nhóm, mã tuần ở cột hạn, "· 3 em", thông báo, hộp điểm, so lượt trước | HL3, HSL1, HSL2, HSL3, CV3, CV4, CV8, TB1, T5, T6, PT2 | không | ~200 | Nhiều tệp; nên tách HL3 ra riêng nếu muốn nhanh |
| **B SO-0-DON-VI** | Số 0 / ô rỗng mờ toàn web; chip lọc 0; đơn vị công tắc khung; badge tab một nghĩa | C2, HL1, HL5, PT1, PT4, QT3, C8 | không | ~120 | C8 cần chủ SP chọn ([XM] S11) |
| **C NHAN-MOT-DONG** | Chip / nhãn ngắn không xuống dòng + tên loại ngắn; vai cùng dòng; "Bạn" | C5, CV7, F2, GV2, GV4 | không | ~70 | Việc số 1 |
| **D A11Y-KY-THUAT** | Bàn phím (MgmtTasks, Meeting), nhãn ô, focus `.o-xem`, `--hong-chu` ở chế độ sáng, bỏ opacity mờ, vùng chạm 375 cho ‹ › / chevron / ⋯, z-index, reduced-motion, `btn-lg`, theme-color; viền ô chọn ≥ 3 : 1 | C9–C13, C15, C4, HL4, CV6 | không | ~220 | C9 đổi token → chủ SP gật |
| **E TEST-LUOI-GON** | Bỏ cột MT (Test, Nhập điểm lớp, panel Công việc); viên "Đang chấm" chỉ khi khác thường; gộp ô "còn chấm" | T1, T3, T4, HSL6 | không | ~90 | T1 [XM] |
| **F CONG-VIEC-375** | 375 theo V18 (ẩn nút, chạm cả dòng); "4 lớp ▾" | CV10, CV5 | không | ~60 | Chỉ làm sau khi chủ SP chọn V18 hay v12 (CV10 [XM]) |
| **G CONG-VIEC-DONG** | Tên dòng = đối tượng; một trục nhóm | CV1, CV2 | **có** | ~150 | [XM] v12 — chỉ làm khi chủ SP duyệt mockup |
| **H TONG-QUAN-GON** | Bỏ Điều hướng trùng (3 vai), 375 đặt cuối, ô TVV tách số, bỏ tên mình ở dòng đầu | C1, TQ1, TQ4 | **có** | ~150 | [XM] V10; một màn (Tổng quan) một PR |
| **I QUAN-TRI-GON** | Thẻ đăng ký rỗng, chip kỹ năng, select, bảng thành thẻ ở 375 | QT2, QT4, QT5, QT6 | không (QT5 theo mẫu `Bang`) | ~110 | Ít người dùng → làm sau |
| — | Chưa làm, chờ xác minh / chủ SP | TQ2, TQ3, CV9, CV11, CV12, HSL4, HSL5, HS4, T2, PT3, C7, C16, CN2 | — | — | Mục 3 + [XM] |

Thứ tự khuyên làm: **C → A1 → A2 → B → E → F → D**, rồi G / H nếu chủ SP muốn đổi bố cục. A1, A2, B, C, E, F đụng tệp khác nhau phần lớn, có thể chạy tối đa 2 song song (Q-2: khác màn).

---

## 5. Tự rà lại theo lời chủ SP 08/11

| Yêu cầu | Đạt? | Ở đâu |
|---|---|---|
| Từng trang | Đạt — 14 trang + mọi tab chính, 4 vai | Mục 2.1–2.10 |
| Từng panel / hộp / popover | Gần đủ — 24 cái đã mở. Chưa mở: Bước tiếp sau thi, Khai / sửa cấp bậc, Xuất PDF Báo cáo PH, Chuyển lớp, Cuối khoá lớp thường (cần dữ liệu đúng tuần) | 2.11 |
| Từng nút | Đạt ở mức mẫu: nút lặp động từ (CV1), nút "15 bài" (CV5), nút Nhóm gãy (F2), ‹ › hai dáng (C4), vùng chạm (C13) | |
| Từng chữ | Đạt: C6 liệt kê đủ chữ giải thích thấy được; chữ lặp CV3, CV4, CV8, HL3, HSL1, TB1, T5 | |
| Từng phần màu | Đạt: tương phản đo bằng máy (B), chip GVCN xanh lá (GV1), hồng (C7, C10), opacity (C11), số 0 (C2) | |
| Đơn giản, dễ nhìn, accessible | Mỗi dòng có loại, mức, có cần mockup không; a11y tách ra gói D | |
| Bớt chữ / bớt thông tin thừa | ~30 dòng loại chữ / tt | |
| Nổi bật điều cần nổi | C2 (số 0 mờ thì số thật nổi), T3 / HSL1 (bỏ trạng thái mặc định thì ngoại lệ nổi) | |
| Không đổi luật nghiệp vụ; [XM] cho luật / mockup / V4 | Đạt — TQ5 ghi rõ không làm vì N32 | |
| Phân biệt lỗi chắc chắn / đề xuất | Cột Kiểu: Lỗi · Đề xuất · [XM] · Xác minh | |
| Không đề xuất lại U02 | Đạt | |

Ảnh minh hoạ ở thư mục `anh/` (01–15). Ảnh 1440 là chế độ tối, ảnh 15 là 375 sáng.

---

## 6. Chia việc qua đêm (PTA Plan 08/11, theo lời chủ SP "chủ động sửa mọi thứ hợp lý; cái nào khó, đổi luật hay đổi góc nhìn thì gom thành một mockup")

Mục 4 ở trên là gợi ý ban đầu. **Mục này thay mục 4 khi giao việc.**

### 6.1 Nhóm A — sửa ngay qua đêm

Nhóm A chỉ gồm: đổi chữ, đổi màu / tương phản bằng token sẵn có, sửa a11y, bỏ thông tin / chú thích thừa, nhấn đúng chỗ. Không đổi bố cục, luật, quyền, API, hay dòng đọc Turso.

Chia thành **3 gói, không gói nào sửa trùng tệp với gói khác**. Ngoại lệ duy nhất: mỗi gói thêm tệp dịch riêng `shared/i18n/en/auditUi<A1|A2|A3>.ts` và một dòng `import` trong `shared/i18n/en.ts`. Dòng import này có thể trùng nhẹ khi merge; PTA merge lần lượt từng gói.

Mỗi gói làm đủ các bước:
- `/ponytail lite`, `impeccable clarify` (A1, A2) hoặc `harden` (A3), rồi `audit` + `web-design-guidelines` trước khi mở PR.
- Ảnh trước | sau ở 1440 tối + 375 sáng, chỉ cho những chỗ đã sửa.
- Mô tả PR có bảng thao tác trước → sau. Mọi thao tác đều giữ, không mất thao tác nào.
- Dòng đọc Turso trước → sau: 0 thay đổi.

**A1 · CHU-FORM** — bỏ chú thích + sửa chữ trong form / panel / Quản trị / hồ sơ GV và hồ sơ cá nhân.

| | |
|---|---|
| Tệp | `web/src/modules/platform/AdminPage.tsx` · `platform/ProfilePage.tsx` · `platform/AccountsAdmin.tsx` · `platform/ChiNhanhAdmin.tsx` · `platform/CatalogAdmin.tsx` · `cases/QuickReport.tsx` · `cases/ThaoTacCase.tsx` · `cases/CapNhatTuan.tsx` · `yThuc/RecordViolationPanel.tsx` · `yThuc/XacNhanXuLyPanel.tsx` · `yThuc/ThangYThuc.tsx` · `web/src/ui/BangChung.tsx` · `ui/TepCho.tsx` · `shared/domain/bangChung.ts` · `giaoVien/HoSoGiaoVienPage.tsx` · `students/phanCongGv/TongHopPc.tsx` · `shared/domain/quanLyHocVien.ts` |
| Phát hiện | C6 (mọi câu giải thích trong các tệp trên) · F1 "Vấn đề" → "Case" · F2 nút "Thái độ / hành vi" không gãy dòng (lưới hai cột hoặc nowrap, **giữ tên** trong `shared/domain/yThuc.ts`) · F3 · QT1 · QT2 · QT3 · QT4 · CN1 · CN3 · HS3 · GV1 chip GVCN trung tính · GV2 · GV3 · MN1 · HS4 (kiểm quyền trước: nếu QL được xoá thì sửa dòng phụ; nếu không được thì DỪNG và báo PTA) · C11 trong 4 tệp AccountsAdmin / ChiNhanhAdmin / CatalogAdmin / HoSoGiaoVienPage · C2 cho số 0 viết tay trong TongHopPc và chip "… 0" ở AccountsAdmin |
| Giữ | Ràng buộc chỉ hiện khi gõ sai ("Phải có đuôi .pisa@gmail.com", "Ít nhất 6 ký tự"); dấu * bắt buộc; bộ đếm ký tự N35 |
| Ước | ~150 dòng |

**A2 · DONG-GON** — bớt chữ lặp trong danh sách, bảng, đầu trang.

| | |
|---|---|
| Tệp | `congViec/DanhSachViec.tsx` · `congViec/HoTroHocVienTab.tsx` · `duyet/TheYeuCau.tsx` · `duyet/HopChoDuyet.tsx` · `worklist/TongQuanV5.tsx` · `shared/domain/yeuCauDuyet.ts` · `web/src/ui/CongTacKhung.tsx` · `students/HangLichThi.tsx` · `students/StudentsPage.tsx` · `students/StudentDetailPage.tsx` · `students/DauHoSo.tsx` · `classes/BangHoSoLop.tsx` · `classes/DauTrangLop.tsx` · `cases/SkillBoard.tsx` · `cham/LuoiFT.tsx` · `classes/BangDiemLopThuong.tsx` · `test/lichTest/HangLop.tsx` · `test/LichTestTab.tsx` · `cham/DiemTheoLop.tsx` · `shared/domain/nhanXet.ts` · `platform/Header.tsx` · `phanTich/BaoCao.tsx` |
| Phát hiện | C5: chip / nhãn ngắn không gãy dòng; "Xử lý Ý thức cần duyệt" → **"Xử lý Ý thức"**; **giữ tên "Không cần theo dõi"** vì đó là tên của thao tác Case. CV3 · CV4 · CV6 · CV7 · CV8 · TQ1 · HL1 · HL2 · HL3 (chỉ phần chữ: một dòng "Chưa có lịch" mờ, ẩn cột Ghi chú khi cả cột trống, **giữ hai link Đặt tháng / Chốt ngày**) · HSL1 · HSL2 (bỏ gạch chấm, chữ "Chưa có KV") · HSL3 · HS1 · HS2 · T3 · T5 · T6 · TB1 · PT2 · C2 cho số 0 viết tay trong TongQuanV5 / BaoCao / BangHoSoLop · C15 phần cuộn `smooth` của LichTestTab |
| Giữ | Mọi nút, link, phím Enter / Lưu · bài tiếp; badge menu và luật đếm S11 (không động tới C8) |
| Ước | ~220 dòng |

**A3 · MAU-A11Y** — token, CSS, bàn phím, vùng chạm, kỹ thuật.

| | |
|---|---|
| Tệp | `web/src/index.css` · `index.html` · `web/src/ui/OSo.tsx` · `ui/SoLieu.tsx` · `ui/HangNhom.tsx` · `ui/OMt.tsx` · `worklist/MgmtTasksPage.tsx` · `worklist/MeetingPage.tsx` · `cases/ChiTietKyNang.tsx` · `yThuc/PhoiHopSosSection.tsx` · `students/GocPhanCongGv.tsx` · `students/HanhTrinh.tsx` · `students/IntakePanel.tsx` · `students/PanelBuocTiep.tsx` · `students/ChuyenLopPanel.tsx` · `test/keHoach/LuoiKeHoach.tsx` · `classes/TabTongKetLop.tsx` · `tutor/TutorPage.tsx` |
| Phát hiện | C9: viền ô chọn / nút đoạn dùng `--o-nhap-vien` (token sẵn có), nút có chữ giữ nguyên · C10: `.khop-tim` ở chế độ sáng dùng `--hong-chu` · C11 ở các tệp còn lại · C12 · C13: `MuiTenMo` và các nút ⋯ / chevron có vùng bấm ≥ 44 ở 375 bằng lớp chung · C15 (thang z-index trong index.css, reduced-motion ở 4 tệp, `btn-lg`, `theme-color`) · C16 (đo "Ctrl K"; dưới 4,5 : 1 thì dùng `--text-faint`) · C2 phần thành phần chung (`OSo` / `LOP_OSO`: số 0 dùng `--text-faint` 400, không bấm — đã có trong G6) |
| Giữ | Không đổi giá trị token màu nào; chỉ chọn lại token sẵn có cho đúng chỗ |
| Ước | ~200 dòng |

Gói A1 và A2 giao song song được (Q-2: khác màn, khác tệp). Gói A3 chạy song song được với cả hai, vì nó chỉ đụng CSS chung và các tệp riêng.

### 6.2 Nhóm B — để mockup `thiet-ke/2026-11-08-audit-ui-mockup.html`, chủ SP duyệt sáng mai

| Mã | Vì sao không sửa ngay |
|---|---|
| C1 · TQ4 · TQ3 | Đổi bố cục Tổng quan, đụng V10 ("cột Chờ bạn duyệt / Điều hướng") và V13 ("đơn vị luôn ghi") |
| C8 | Đổi luật đếm của badge tab (S11 / V13) |
| CV1 · CV2 · CV5 | Đổi tên dòng việc, trục nhóm, dáng nút gộp — đụng V18 và mockup v12 |
| CV10 | Mâu thuẫn V18 (ẩn nút ở 375) với v12 (giữ nút) — chủ SP chọn |
| CV11 · CV12 | Gộp nơi làm việc (Hộp duyệt, Chấm Test) — đổi góc nhìn |
| HL3 (gộp link) | "Đặt tháng · Chốt ngày" → một nút "Đặt lịch ▾" — đổi thao tác |
| T1 · T4 / HSL6 | Đổi dải số (UI-LICH-TUAN) và bỏ cột trong lưới điểm (đổi bố cục lưới dùng nhiều nhất) |
| HSL4 | Đụng ngoại lệ G13 chủ SP duyệt 30/10 |
| PT3 | Đụng G8 (báo cáo không cột quá hạn) |
| C4 | Một dáng cho Quay lại / Trước-Sau ở mọi hồ sơ — đổi thành phần đầu trang |
| C7 | Dòng loại panel in hoa + vạch hồng của mockup NEN-PANEL |
| C14 · LT1 · GV4 | Tách trường theo M10 — đổi bố cục dòng |
| PT1 · OS1 | Bỏ một trong hai số ở mỗi ô Kết quả MT; bỏ phân trang trong panel số |
| QT5 · QT6 | Bảng tài khoản thành thẻ ở 375; thay `select` gốc |

### 6.3 Chưa giao — chờ PTA xác minh (mục 3)

TQ2 · CV9 · HSL5 · T2 · CN2 · (HS4 nằm trong A1 nhưng phải kiểm quyền trước khi sửa) · (C16 nằm trong A3, đo rồi mới sửa).
