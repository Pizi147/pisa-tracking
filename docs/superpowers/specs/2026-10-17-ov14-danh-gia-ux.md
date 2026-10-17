# Tổng hợp rà soát UX/UI + đường lên ≥ 35/40 — PTA Plan · 17/10/2026

Nguồn: docx UX 16/10 · audit 17/10 · 3 góp ý chủ SP · xác minh mã (main 6177d36f) · impeccable critique (A: thiết kế, B: detector) ·
ui-ux-pro-max · hai bên đối thoại. Bản đầy đủ từng bên: `bao-cao/` (xac-minh, assessment-a, assessment-b, uiux-pro-max, doi-thoai-*).
Ảnh: `anh/INDEX.md` (266 ảnh), `a-anh/`, `uiux-tmp/`.

Quy ước: [Đã kiểm] thấy trên demo / mã · [Chủ SP báo] · [Đề xuất] chưa duyệt · [Hỏi] cần chủ SP chốt.

## 1. Điểm hiện tại

| Thang | Điểm | Yếu nhất |
|---|---|---|
| Nielsen 10 nguyên tắc (impeccable) | **27/40** | Nhất quán 2 · Nhận ra hơn nhớ 2 · Tối giản 2 |
| 10 nhóm ui-ux-pro-max | **25/40** | Style 2 · Bố cục/375 2 · Chữ & màu 2 · Form 2 · Điều hướng 2 |
| Detector impeccable (mã) | 0 lỗi chính, 8 cảnh báo | cỡ chữ 16/17/28 px chưa ghi DESIGN.md; 99 chỗ `text-[13px]` lẻ |

Nền tốt (giữ): làm tại chỗ bằng panel, Esc + focus đúng, link bỏ qua, thẻ Chờ duyệt "Nếu duyệt: …", hộp nhập điểm MT (Enter = em tiếp),
mã tuần, quyền kiểm ở máy chủ, lọc nằm trên URL, Back giữ cuộn.

## 2. Đánh giá các nguồn — đúng / sai / xung đột

### 2.1 Audit 17/10 (F01–F12, Q01–Q03) — [Đã kiểm trên mã]
- ĐÚNG cả 12 lỗi F, phần lớn mức nhỏ. Nặng nhất: **F01** Góp ý báo "Đã lưu" sai khi gõ thêm lúc đang lưu; **F03** quay lại trong 10 s thấy bản cũ
  (dễ gặp hơn audit nói); **F02** Sửa cả lớp đóng panel mất chữ gõ lúc đang lưu; **F11** hộp xác nhận đóng được khi đang chạy.
- Q01 (quyền bàn giao theo ngày) KHÔNG có rủi ro thật; chỉ lệch góc nhìn (QL kiêm GVCN ở góc nhìn QL vẫn bàn giao được).
- Q03 kho tệp bằng chứng: đúng — phải chép kho cũ TRƯỚC khi xoá DB cũ ~24/10.
- U01–U12: đồng ý gần hết; U06 (danh sách theo tuần) cần chủ SP chốt luật.
- Gói sửa không cần mockup: F01 F02 F03 F07 F11 F12 · F04 F05 · F06 F09 F10.

### 2.2 Docx 16/10
- ĐÃ SỬA (UX-2, đã deploy): Quá hạn chấm = Bài quá hạn (còn lệch phạm vi 58/53 trên cùng trang Test) · Case quá hạn vào Cần xử lý ·
  menu Công việc + tự mở việc · ⓘ Dưới kỳ vọng / Chưa đạt · nút FT/LT phần lớn · thuật ngữ.
- CÒN: Phân tích dày + tab GV chậm · hàng lớp trống · bộ lọc mỗi trang một chỗ · tầng điều hướng · gạch chấm dưới số · "chỉ lớp có vấn đề".
- XUNG ĐỘT luật / quyết định — KHÔNG làm như docx viết:
  - "Chỉ giữ 3 màu" ↔ Rulebook 3.5 (màu điểm) + góp ý chủ SP #1 (cần phân biệt NHIỀU hơn). Thay bằng: 5 nghĩa màu + luật dáng.
  - "Gộp L/R/W1/W2/S thành cột 2/5" ↔ mockup 11/10 + góp ý #3. Thay bằng: lưới chỉ hiện cột của việc đang làm.
  - "Ô trống ghi —" ↔ mockup 11/10 dùng "Nhập"; "—" còn dễ nhầm với dấu "-" = không có bài. Thay bằng: khung rỗng [Hỏi].
  - "Một định nghĩa SOS" ↔ Rulebook 3.1 + chủ SP 14/10. Giữ hai tên khác hẳn (đã tách ở UX-1).
  - "Tách HV - Case" ↔ quyết định 14/10 [Hỏi].

### 2.3 Ba góp ý chủ SP — [Đã kiểm] cả ba đúng
1. **SOS 1/2/3**: SOS 2 ↔ SOS 3 độ khác màu 7 (tối) / 5 (sáng), nền chip ~3; ngưỡng mắt thường phân biệt 15. SOS 2 dùng ĐÚNG màu "Quá hạn",
   SOS 3 trùng màu "Dưới kỳ vọng". Có 2 dáng chip SOS khác nhau.
2. **Em đã thi**: mã có 4 giai đoạn; chỉ TVV/CX thấy "Đã thi · chờ kết quả" — QL/GV ở Học viên & Lớp + hồ sơ lớp thấy "Chưa có kết quả" (lỗi gốc).
3. **Writing**: W = (W1 + 2·W2)/3. Lưới để W1/W2 trong khung ô (nổi), W chữ trơn (chìm); danh sách SOS ghi "R, W1, W2" đọc như 3 môn.
   W1/W2 vẫn cần khi NHẬP và khi giao Case đúng GV → chỉ làm mờ ở bảng XEM.

## 3. Tôi đã tự quyết (khớp đúng ý chủ SP, hai skill đồng ý, có số đo) — chủ SP sửa nếu khác

- **SOS = thang 3 bậc**: SOS 1 vàng **viền** · SOS 2 cam **nền nhạt** · SOS 3 đỏ **nền đặc chữ trắng**; một dáng chip ở mọi màn; SOS tạm = cùng bậc, viền đứt.
  Validator: tối độ khác 31 / mù màu 21; sáng 21 / 13 — ĐẠT (cũ: 7 / 5).
  **"Quá hạn" không bao giờ là chip** — chỉ chữ cam + ⚠. Tách token SOS khỏi token hạn / kết quả. Lớp thường đổi theo.
- **Em đã thi**: dải nền xanh lá nhạt **cả hàng** + vạch trái 3 px + chip chữ "Đã thi · chờ KQ" → "Có KQ · chờ bước tiếp"; tô từ hôm sau ngày thi tới khi
  chọn Bước tiếp. Áp mọi vai (QL, GV, TVV, CX), kèm chip lọc "Đã thi". Để không lẫn: **"đang chọn" đổi thành viền khung 2 px** ở mọi bảng;
  nền hàng chỉ dành cho "đã thi"; quá hạn không tô hàng.
- **Writing**: bảng XEM — cột Writing = số W to, đậm như L/R/S; dưới là "6.0 · 7.0" nhỏ mờ. Lưới NHẬP — W1, W2 là ô nhập rõ, W đậm chỉ đọc
  (theo mẫu hồ sơ Mock đã có). Danh sách SOS ghi "R, W" (W1/W2 xem khi mở).

## 4. Đường lên ≥ 35/40 (mục tiêu 37) — mỗi nguyên tắc cần gì để đạt 4

| # | Nguyên tắc | Nay | Đích | Việc làm điểm tăng |
|---|---|---|---|---|
| 1 | Trạng thái hệ thống | 3 | **4** | Một kiểu báo lưu cho mọi ô: Đang lưu · Đã lưu 14:32 · Lỗi · Thử lại (sửa F01–F03). Mọi số bấm ra đúng danh sách đúng số (hết 58/53). Hàng đang mở panel có viền. Khoảnh khắc xong: "Lớp MB FT 101 đủ điểm MT2 ✓", "Hôm nay xong 6 việc". |
| 2 | Khớp đời thực | 3 | **4** | "3 HV · 4 Case" thay "3 - 4"; ⓘ / chạm vào chữ KCK, Thiếu n, Case tạm, SOS tạm ra nghĩa; cột theo thứ tự L R W S; dải tuần W1–W5 làm trục thời gian. |
| 3 | Kiểm soát, thoát | 3 | **4** | Rời trang khi còn chữ chưa lưu: tự lưu hoặc hỏi một lần (F07, F12); hộp không đóng khi đang chạy (F11); **Hoàn tác** 10 s cho thao tác đảo được thay hộp hỏi. |
| 4 | Nhất quán | 2 | **4** | Hệ thiết kế v2: một chip SOS, một kiểu "đang chọn", một thanh ngữ cảnh (Chi nhánh · Chương trình · Tuần) cùng chỗ mọi trang, một hàm trạng thái → một nhãn cho mọi vai, một biểu tượng tìm, một nút chính mỗi màn, đổi tab "Vận hành" → "Việc quản lý". Thêm phép kiểm tự động chặn màu / cỡ chữ lẻ và emoji (giữ nhất quán lâu dài). |
| 5 | Phòng lỗi | 3 | **4** | Lưới mở đúng ô trống đầu của mình; kiểm khoảng điểm ngay khi gõ; dán từ Excel có xem trước khớp tên; mẫu câu nhận xét. |
| 6 | Nhận ra hơn nhớ | 2 | **4** | Mặc định thấy hết (Đang SOS = mọi em đang SOS); bộ lọc đang bật hiện thành chip có ✕; panel chỉ hiện cột của mình; số bấm được trông như nút (không gạch chấm khắp nơi); "Vừa mở" trong ô tìm. |
| 7 | Linh hoạt, nhanh | 3 | **4** | Ctrl+K / "/" tìm mọi thứ (em, lớp, việc, lệnh); chọn nhiều ở Công việc (Nhắc · Gia hạn); dán Excel; dùng lại nhận xét; hàng đợi việc (xong tự sang việc kế). |
| 8 | Tối giản | 2 | **4** | Bỏ chip "Quá hạn" lặp với ⚠ và chip "Cần làm"; bỏ gạch chấm; ẩn dòng toàn 0; Tổng quan QL 6 khối → 3; Phân tích 4 tầng → 2; thanh trên 10 nút → 6 (?, Sáng/Tối, VI/EN vào menu tài khoản); 8+ màu nghĩa → 5. |
| 9 | Sửa lỗi | 3 | **4** | Không bao giờ mất chữ đang gõ (bản nháp giữ theo người + ô); hết phiên → "Đăng nhập lại, chữ vẫn giữ" (F09); lô lỗi một phần: "Thử lại phần còn lại"; lỗi ghi rõ bước tiếp. |
| 10 | Trợ giúp | 3 | **3–4** | **"Vì sao?"** trên mọi chip SOS / việc / hạn: "SOS 2 vì R và W dưới kỳ vọng ở MT2", "Việc của bạn vì bạn là GVBM W lớp này"; trạng thái rỗng chỉ bước tiếp ("Chưa có lịch MT2 — QL xếp ở Kế hoạch Test ›"). |
| | **Tổng** | **27** | **39–40 (sàn 35)** | Sàn 35 chỉ cần mục 1, 4, 6, 8 lên 4 và 3, 9 lên 4. |

Thang ui-ux-pro-max (25 → ≥ 35) đi cùng các việc trên + riêng: ô nhập 16 px ở 375 · số bấm được ≥ 24 px · nút thu gọn = cả hàng ·
không trượt ngang (Phân tích lớp thường 1469/1440) · chữ không vỡ từng chữ ở 375 · theo sáng/tối của máy · zoom 200 % panel vẫn dùng được ·
ảo hoá trang > 100 dòng · TD7 (Tổng quan / Học viên & Lớp nhanh hơn).

## 5. Ý tưởng lớn (brainstorm — [Đề xuất])

| # | Ý tưởng | Ai lợi | Nguyên tắc tăng | Cần mockup |
|---|---|---|---|---|
| 1 | **Hàng đợi việc GV**: Tổng quan GV = Công việc (một màn); làm xong một việc tự mở việc kế; hết việc hiện "Xong hết hôm nay ✓" | GV | 1, 7, 8 | Có |
| 2 | **Lưới điểm v2**: một lưới dùng chung; mở từ việc → chỉ cột của việc + con trỏ ở ô trống đầu; 4 dáng ô (cần nhập · có điểm · của người khác · "-"/Vắng); W to, W1/W2 nhỏ; dán Excel có xem trước; mẫu nhận xét | GV | 5, 6, 7 | Có |
| 3 | **Tổng quan QL kiểu giao ban**: 3 khối — Cần bạn quyết · Lớp có em bị bỏ sót (chưa lịch · chưa điểm · SOS 1·2·3 · chưa PA · đã thi chờ KQ) · Tuần này | QL, QT | 4, 6, 8 | Có |
| 4 | **Báo cáo tuần**: một trang để chiếu / in khi họp — chữ lớn, sáng, số bấm ra danh sách | QL | 2, 8 | Có |
| 5 | **Thanh ngữ cảnh cố định**: Chi nhánh · Chương trình · Tuần ở cùng chỗ mọi trang, chip lọc đang bật có ✕ | mọi vai | 4, 6 | Có |
| 6 | **Ctrl+K tìm mọi thứ**: em, lớp, việc, lệnh ("Nhập điểm MB FT 101") | thạo việc | 7 | Không (hộp nhỏ theo mẫu) |
| 7 | **"Vì sao?"** trên mọi trạng thái: hiện đúng luật đang áp | người mới, QL | 2, 10 | Không |
| 8 | **Hoàn tác thay hộp hỏi** cho thao tác đảo được (xoá nhận xét, bỏ vắng, gia hạn) | mọi vai | 3, 8 | Không |
| 9 | **Lưới an toàn bản nháp**: mọi ô chữ dài giữ bản nháp theo người + ô, mở lại thấy "Bản nháp chưa lưu" | GV | 3, 9 | Không |
| 10 | **Công việc một danh sách**: bỏ 4 tab; "Chờ bạn duyệt" lên đầu khi có; nhóm theo loại, xếp theo hạn; chọn nhiều; bộ lọc 11 → 3 | QL | 4, 7, 8 | Có |
| 11 | **Phân tích thành mục riêng**: 2 tầng, mỗi bảng ≤ 8 cột, cột đầu ghim, tab theo câu hỏi ("Lớp nào tụt?", "GV nào trễ chấm?") | QL | 6, 8 | Có |
| 12 | **Phép kiểm giữ nhất quán**: `npm run check` đỏ khi dùng màu / cỡ chữ ngoài token, emoji, chip SOS tự chế | (giữ lâu dài) | 4 | Không |

Giảm tải đo trên demo (trước → sau): GVBM nhập điểm lớp thường 3 thao tác (+1 chuyển trang) → 1 bấm · GV Writing nhập MT 2 → 1 bấm ·
QL xem ai trễ chấm 1 bấm + 1 chuyển trang + đọc 18 dòng → 0 chuyển trang, 4 dòng theo GV · GV xem hết việc 1 chuyển trang → 0 ·
xem mọi em SOS (có SOS 3) 2 bấm → 0 · tìm em đã thi: không lọc được → 1 chip · bộ lọc Công việc QL 11 → 3 · Phân tích 4 tầng / 13 lựa chọn → 2 / ≤ 7 ·
QL duyệt từ Tổng quan 1 chuyển trang → 0 · chọn chi nhánh 3 lần → 1.

## 6. Thứ tự đề xuất

0. **Gói sửa ngay (không mockup, không đổi bố cục)**: lỗi mất chữ F01 F02 F03 F07 F11 F12 (+ F04 F05, F06 F09 F10) · nhãn "Đã thi · chờ KQ" cho QL/GV ·
   Đang SOS mặc định Toàn bộ · phạm vi 58/53 · ⚠ cho "1 việc quá hạn" · bỏ emoji ô lọc · bỏ tự focus · ô nhập 16 px ở 375 · một nút "Xác nhận PA" ·
   chữ gợi ý nhận xét đúng kỹ năng · chép kho tệp bằng chứng (vận hành).
1. **Mockup đợt 1 — hệ thiết kế v2**: bảng token 5 nghĩa, chip SOS thang 3 bậc, dải "đã thi", "đang chọn" = viền khung, thang chữ, thanh ngữ cảnh.
2. **Mockup đợt 2 — Lưới điểm v2** (+ W to).
3. **Mockup đợt 3 — Công việc + Tổng quan** (hàng đợi GV, giao ban QL).
4. **Mockup đợt 4 — Phân tích + Báo cáo tuần.**
Trước đợt 1: chụp bù 4 panel chưa mở được (PA, Thêm HV, hộp kỹ năng MT, Xếp lịch MT).

## 7. Còn cần chủ SP chốt (vòng sau)
- Ô trống trong lưới: khung rỗng thay chữ "Nhập" (đổi mockup 11/10)?
- Cột "HV - Case": tách 2 cột hay "13 HV / 21 Case" xếp chồng (đổi quyết định 14/10)?
- Bỏ tab "Điểm theo lớp" (trùng hồ sơ lớp)?
- Cỡ chữ: ô bảng 13 · đầu cột 12 không in hoa (đổi DESIGN.md)?
- U06: Góp ý tuần cũ hiện em của tuần đó hay em đang học?
- Hai người cùng sửa một ô Góp ý: người lưu sau thắng (nhật ký giữ bản trước)?
- "Case chưa chốt PA" (19) và "Case chưa có PA" (5) — đặt tên khác hẳn?
