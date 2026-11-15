# Hướng dẫn V3 — nút "?" trả lời đúng thứ đang mở (thiết kế · đề bài mockup ⑭ · plan)

PTA Overhaul · 15/11 · theo lời 54, 55 (`loi-chu-sp.md`). Nền: HD-V2 05/11 (`docs/superpowers/specs/2026-11-05-huong-dan-v2/de-xuat.md`, mockup `thiet-ke/v14/huong-dan.html`). Mã: `shared/huongDan/` · `web/src/modules/huongDan/` · `server/src/tests/prHd.tests.ts`.

## 1. Ý định và lý do

Chủ SP (lời 54): thiết kế lại hệ thống hướng dẫn, dấu "?" "để nó trực diện hơn, cụ thể và chính xác hơn, tính đến mọi trường hợp và hướng dẫn tất cả mọi vai trừ 'quản trị' một cách chính xác, chi tiết nhưng rõ ràng ngắn gọn dễ hiểu". Chủ SP chọn **hướng B** (lời 55).

Hiện trạng (rà mã 15/11): khung V2 dùng tốt (nút "?" cạnh chuông, panel chồng không mất chữ đang gõ, "Chỉ cho tôi", ô tìm bỏ dấu). Yếu ở bốn chỗ:
1. **Ngữ cảnh nông:** chỉ theo đường dẫn + panel trên cùng; bỏ `?query` nên ở Công việc GV thấy 18 dòng bất kể tab / việc đang mở (`index.ts:37-49`).
2. **Thiếu ngoại lệ:** gần như không có mục cho bị chặn, làm sai, em vắng / tạm dừng / chuyển lớp, đổi GV, quá hạn.
3. **Cũ:** ≥ 15 chỗ sai so với lời 12–53; Head tutor chỉ 2 mục; thiếu thẻ cho `xem_nx_s`, `yt_hoi_tinh_hinh`, `no_plan`, báo PH tình hình học tập…
4. **Dài, lặp:** ~40 chữ / mục, dài nhất 106, kiểu liệt kê nhãn "A · B · C"; cùng việc chép lại ở GV, QL và từng panel.

## 2. Mục tiêu · Không làm · Thất bại

**Mục tiêu:** (1) bấm "?" khi đang mở một việc → thấy NGAY hướng dẫn của đúng việc đó, một màn không cuộn; (2) mỗi loại việc một thẻ khuôn cố định, trả lời cả "làm sai thì sao" và "không làm được thì sao"; (3) có chỗ tra theo TÌNH HUỐNG; (4) đúng với web sau overhaul V6, và máy tự báo khi lệch; (5) đủ sáu vai: GV (gồm GVCN, GV Speaking) · Head tutor · TVV · QL · Admin văn phòng · CX.
**Không làm:** vai Quản trị (giữ nội dung đang có) · AI hỏi đáp · tour tự chạy · video · tự mở khi đăng nhập · thêm màn mới ngoài panel "?" và trang `/huong-dan` · thêm câu đọc cơ sở dữ liệu (nội dung tĩnh).
**Thất bại dù chạy được:** thẻ dài phải cuộn · chữ khác nhãn trên web · số ngày gõ tay lệch cấu hình · GV thấy việc của QL như việc mình · mở "?" làm mất panel / chữ đang gõ.

## 3. Hướng đã cân nhắc

| Hướng | Được | Mất | Kết quả |
|---|---|---|---|
| A · Giữ khung, viết lại nội dung | rẻ, nhanh | vẫn 18 dòng ở Công việc, không chữa "trực diện" | không chọn |
| **B · Ngữ cảnh ba tầng + thẻ việc khuôn cố định + tab tình huống + tự kiểm** | trả lời đúng thứ đang mở; một nguồn cho mỗi việc | khối lượng viết lớn (6 vai, VI + EN) | **chủ SP chọn (lời 55)** |
| C · AI hỏi đáp / tour tự chạy | linh hoạt | tốn tiền, có thể sai luật; tour đã bị loại 05/11 | loại |

## 4. Thiết kế

### 4.1 Giữ nguyên từ V2
Nút "?" tròn cạnh chuông, 375 vùng bấm 44 · panel `KhungPanel` mở CHỒNG, không đóng panel đang làm, không mất chữ · ô tìm (bỏ dấu, từ đồng nghĩa, "việc của vai khác") · "Chỉ cho tôi" (khoanh `data-hd`) · QL có "Xem vai khác" · trang `/huong-dan` (có In) mở từ chân panel · chữ là khoá `t()` có bản Anh.

### 4.2 Ngữ cảnh ba tầng (mới)
Bấm "?" → tab "Ở đây" chọn nội dung theo tầng SÂU NHẤT đang có:
1. **Việc đang mở** — panel việc (theo loại việc `WorkGroupKey` + `PANEL_HD`) hoặc dòng việc đang chọn ở Công việc → MỘT thẻ việc (4.4), đầu thẻ ghi "Bạn đang mở: {lớp · tên việc}" (chữ lấy từ dòng việc, không đọc thêm dữ liệu).
2. **Tab đang đứng** — tab Công việc (`?nhom=`), tab hồ sơ lớp, tab Học viên & Lớp, tab Phân tích, tab Test → câu "Bạn đang ở" + các việc làm ở TAB đó (≤ 5 dòng, còn lại "+ n việc khác").
3. **Màn** — như V2: "Bạn đang ở" + Trước / Sau + "Việc làm ở đây" + "Không làm ở đây".
Đang ở tầng 1 có dòng "‹ Việc khác ở tab này" lên tầng 2.

### 4.3 Ba tab của panel
**Ở đây** (thay "Màn này") · **Tôi muốn…** · **Khi gặp…** (mới). "Tuần của tôi" KHÔNG còn là tab: thành bộ lọc nhịp trong "Tôi muốn…" (Hằng ngày · Sau tuần Test · 2 tuần một lần · Hằng tháng · Khi có).

### 4.4 Thẻ việc — khuôn cố định (đơn vị nội dung chính)
Mỗi dòng TỐI ĐA MỘT CÂU; dòng không áp dụng thì không hiện (lời 40); cả thẻ đọc trong ~10 giây, không cuộn ở 1440.

| Dòng | Trả lời câu | Ví dụ (GV · Nhập điểm) |
|---|---|---|
| **Khi nào có** | vì sao tôi có việc này | Từ thứ Hai tuần Test, cho ô bạn được phân công |
| **Làm** | bấm gì — ≤ 3 bước, nhãn web in đậm | 1 Gõ điểm vào ô · 2 Em vắng: gõ "-" · 3 **Lưu · bài tiếp ›** |
| **Xong khi** | thế nào là hết việc | Mọi ô có điểm hoặc "-" |
| **Hạn** | bao giờ, quá thì sao | Hết thứ Tư tuần sau · quá hạn vẫn nhập được |
| **Làm sai** | sửa / hoàn tác / khôi phục | Bấm lại ô để sửa; điểm đã xoá khôi phục ở **Lịch sử** |
| **Không làm được** | lý do thường gặp → bước kế / ai | Không thấy ô: chưa tới tuần Test, hoặc không phải kỹ năng của bạn → nhờ QL |
| **Sau đó** (khi có) | lưu xong ai nhận gì | Dưới kỳ vọng → bạn có việc Mô tả Case |

Chân thẻ: **Chỉ cho tôi** · "Đi tới ›" (khi đang ở chỗ khác) · một dòng nhạt "Cũng mở được từ: …" (lối tắt).
- **Hạn không gõ tay:** số ngày lấy từ cấu hình "Hạn mặc định" bằng mã chèn (vd `{han:xac_nhan_pa}`), Quản trị đổi thì hướng dẫn tự đúng.
- **Một thẻ cho một loại việc, dùng mọi nơi:** tab "Ở đây", "Tôi muốn…", kết quả tìm, và **ⓘ ở dòng quy chế của panel việc** mở đúng thẻ này (dòng quy chế = một câu; ⓘ = thẻ đầy đủ — một nguồn chữ).

### 4.5 Một việc, nhiều vai
Thẻ viết MỘT lần theo người giữ việc. Vai khác thấy cùng thẻ với một dải đầu: **"Việc của {vai}. Bạn làm thay được."** (QL, Admin nhập hộ) hoặc **"Việc của {vai}. Bạn chỉ xem."** (TVV, CX) — dòng "Làm" ẩn với vai chỉ xem. GVCN / GV Speaking / TVV phụ trách: nhãn nhỏ "chỉ GVCN" … như V2 (`chiGvcn`, `chiS`).

### 4.6 Tab "Tôi muốn…"
Nhóm theo ĐÚNG TÊN TAB Công việc của vai (GV: Chấm điểm · Chấm Speaking · Case học thuật · Ý thức & Phối hợp · Vận hành) + "Học viên & lớp" + "Khác" — thay nhóm cũ (Điểm · Case…) để một khái niệm một tên. Mỗi dòng: tên việc (động từ + đối tượng, đúng tên dòng việc) → mở thẻ. Bộ lọc nhịp ở đầu.

### 4.7 Tab "Khi gặp…" (mới) — thẻ tình huống, ba dòng
**Máy làm gì** (tự động) · **Bạn làm gì** · **Ai khác nhận việc**. Danh sách cố định theo vai (ẩn tình huống vai đó không gặp), khoảng 12:
Em vắng Test · Em tạm dừng / kết thúc học · Em chuyển lớp / lên lớp · Đổi GV, tôi nhận lớp mới / rời lớp · Việc quá hạn · Không thấy nút / không có quyền · Lưu lỗi, mất mạng · Nhập sai, muốn sửa / xoá / khôi phục · Em chưa có TVV / thiếu Target · Chờ QL duyệt lâu · Làm nhiều em, lỗi một phần · Em thi thật xong.

### 4.8 "Có gì mới"
Dải mảnh đầu panel + chấm trên "?" khi nội dung có phiên bản mới (sau mỗi đợt đổi lớn); ≤ 5 dòng, mỗi dòng mở một thẻ; xem xong tự hết (cờ đã xem theo phiên bản nội dung, lưu như `daXemHuongDan`).

### 4.9 Trang `/huong-dan`
Giữ: toàn bộ thẻ việc + tình huống + "Luật và hạn" + "Thuật ngữ", In được. Dùng chung dữ liệu với panel.

### 4.10 Quy tắc viết (áp cho mọi thẻ)
Câu bắt đầu bằng động từ · nhãn nút / tab in đậm, ĐÚNG chữ trên web · không liệt kê cả giao diện kiểu "A · B · C" · không "vui lòng", không thuật ngữ nội bộ · tên việc = tên dòng việc trên web · mỗi dòng ≤ 1 câu, ≤ ~16 chữ; cả thẻ ≤ ~80 chữ · không viết tên thật.

### 4.11 Máy tự kiểm (mở rộng `prHd.tests.ts`)
- **HD-DU:** mọi loại việc (`WorkGroupKey` của `mywork.ts`) mà vai giữ đều có thẻ; mọi `PANEL_HD` có thẻ; cả Head tutor.
- **HD-NHAN:** chữ đậm phải có trong TỆP CỦA MÀN đó (không so cả repo).
- **HD-CAM:** danh sách nhãn đã bỏ ("Đã xem", "Đánh dấu đã đọc", "Speaking chấm chéo", "+ Ghi", "Hộp duyệt"…) không được xuất hiện.
- **HD-HAN:** trong thẻ không có số ngày gõ tay ở dòng Hạn — phải là mã chèn.
- **HD-DAI:** mỗi dòng ≤ 1 câu, thẻ ≤ ngưỡng chữ.
- Giữ: HD-NAV, HD-ROUTE, HD-CHI, HD-LOI, bản Anh đủ.

### 4.12 Lượt đọc
0 câu thêm: nội dung tĩnh trong mã. Hạn lấy từ cấu hình web đã nạp; nếu chưa nạp sẵn ở vai đó thì nạp MỘT lần khi mở "?" lần đầu trong phiên (đo và ghi trần).

## 5. Đề bài mockup ⑭ — `thiet-ke/v21/huong-dan.html` (một session Opus 5.5 · high)

Luật chung G1–G5 + G2 ở `11-de-bai-mockup-dot-2.md`, V22, lời 36, 40. Nền: `thiet-ke/v14/huong-dan.html`. Skill `impeccable` (`distill`, `layout`, `clarify`, rồi `critique`). Vai vẽ: GV / GVCN (chính) · TVV · QL. Ảnh cặp TRƯỚC web │ SAU.
- R14.1 Tầng 1: GV đang mở panel Nhập điểm bấm "?" → thẻ việc đủ bảy dòng, chồng lên panel, không cuộn ở 1440; "‹ Việc khác ở tab này".
- R14.2 Tầng 1 các biến thể dòng ẩn / hiện: việc không hạn (không dòng Hạn) · việc của GVCN "Xử lý vi phạm" (hai lối) · TVV "Báo PH" · QL xem việc của GV (dải "Việc của GV. Bạn làm thay được.") · TVV / CX xem việc của GV (dải "chỉ xem", không dòng Làm).
- R14.3 Tầng 2: GV ở Công việc tab Case học thuật, chưa chọn việc → "Bạn đang ở" + ≤ 5 việc của tab + "Không làm ở đây".
- R14.4 Tầng 3: một màn không có tab (vd Hồ sơ học viên) theo dáng V2 đã gọn.
- R14.5 Tab "Tôi muốn…": nhóm theo tên tab Công việc + bộ lọc nhịp; mở một dòng ra thẻ; "Đi tới ›" + "Chỉ cho tôi".
- R14.6 Tab "Khi gặp…": danh sách tình huống + một thẻ tình huống mở (Em vắng Test) ba dòng.
- R14.7 Ô tìm: gõ "vang" → kết quả gồm thẻ việc, thẻ tình huống, "việc của vai khác"; không có kết quả.
- R14.8 "Có gì mới": dải đầu panel + chấm trên "?"; trạng thái đã xem.
- R14.9 ⓘ ở dòng quy chế của một panel việc mở đúng thẻ việc (cùng thành phần).
- R14.10 "Chỉ cho tôi" đang khoanh (giữ dáng V2) · trang `/huong-dan` (một khung, In) · 375 (panel toàn màn, thẻ việc, tab).
- R14.11 Chữ trong thẻ theo 4.10 — session viết THẬT nội dung cho các thẻ vẽ (đối chiếu `luat/0`–`4`, `13-thiet-ke-dot-4.md`), không chữ giả; đếm chữ từng thẻ trong ghi chú.

## 6. Plan (gửi PTA Plan sau khi chủ SP duyệt mockup ⑭)

| Mã | Phạm vi | Model · effort (B) | Ghi chú |
|---|---|---|---|
| **HD-1** KHUNG | Kiểu dữ liệu thẻ việc + thẻ tình huống + biến thể vai + mã chèn hạn; ngữ cảnh ba tầng; ba tab; "Có gì mới"; ⓘ dòng quy chế mở thẻ; chuyển nội dung cũ sang kiểu mới ở mức chạy được | Opus 5.5 · high | theo mockup ⑭; 0 câu đọc |
| **HD-2** NỘI DUNG GV + GVCN + GV Speaking + Head tutor | mọi thẻ việc + tình huống, VI + EN | Opus 5.5 · high | viết SAU khi các GD của GV đã merge (nhãn, `data-hd` khớp web mới) |
| **HD-3** NỘI DUNG TVV + CX | như trên | Opus 5.5 · high (B: Sonnet 5.5 · high) | sau GD-8, GD-13b |
| **HD-4** NỘI DUNG QL | như trên; dải "làm thay" dùng thẻ gốc | Opus 5.5 · high | sau GD-14, GD-21 |
| **HD-5** NỘI DUNG Admin văn phòng | như trên | Sonnet 5.5 · high (B: Opus 5.5 · medium) | sau GD-11, GD-14 |
| **HD-6** PHÉP KIỂM | HD-DU, HD-NHAN theo tệp, HD-CAM, HD-HAN, HD-DAI | Sonnet 5.5 · high | chạy cùng HD-1 hoặc ngay sau |
Mỗi PR nội dung: PTA Overhaul rà từng thẻ theo `luat/0`–`4` + `loi-chu-sp.md` trước khi merge (độ chính xác là mục tiêu số một); chủ SP duyệt ảnh cặp của HD-1.

## 7. Để người làm quyết
Tên biến, cách lưu phiên bản nội dung, cách lấy "việc đang mở" từ panel (prop hay context), thứ tự tình huống, câu chữ cụ thể (theo 4.10, PTA Overhaul rà).
