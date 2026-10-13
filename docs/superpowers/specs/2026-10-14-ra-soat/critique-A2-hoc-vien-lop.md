> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# Critique A2 · Học viên & Lớp · hồ sơ lớp · hồ sơ HV — Assessment A (design review, mode Operate)

Môi trường N=10 (web 5520, DB a10, ngày demo 14/09/2026 = W3 SEP). Ảnh: `$SP/anh/critique-A2/`. Không đọc `ket-qua/`, `.impeccable/`, không chạy detect.
Ghi dữ liệu duy nhất: Tạm dừng em **Hồ Thu Trang (82, MB BE 03)** để thấy trạng thái Tạm dừng (DB riêng).

## Đã đi
| Trang | Vai | Thao tác | Ảnh |
|---|---|---|---|
| `/hoc-vien` | QL, GVCN, TVV, CX, ADMIN (1440 tối) · QL, TVV (375 sáng) | mở lớp FT 101 + FOU 12, chip Đang SOS, tìm rỗng, hover/bấm "+1" | `hvl-*` |
| `/hoc-vien/luu-tru` | QL | xem | `luutru-QL-1440` |
| `/hoc-vien/lop/3` FT | QL (1440 + 375), GVCN, TVV | ⋯ 6 mục (Thông tin lớp, Sửa thông tin HV, + Học viên, Chuyển tiếp lớp, Xuất Excel, Kết thúc lớp), cách xem Tổng hợp / Cần hỗ trợ / Kết quả đầu ra, ⋯ dòng em theo 4 vai, Sửa cả lớp cuộn ngang | `lop3-*`, `suacalop-*` |
| `/hoc-vien/lop/5` RF, `/17` BE, `/30` PET | QL | Tổng hợp, ⋯ (PET: Thông tin lớp) | `lop5-*`, `lop17-*`, `lop30-*` |
| `/hoc-vien/lop/6` FOU 12 | QL (1440 + 375) | Tổng hợp, Lộ trình tiếp theo (cách xem + ⋯), Kết thúc lớp | `lop6-*` |
| `/hoc-vien/46` FT có SOS 2 | QL (1440 + 375) | ⋯ 5 mục (Sửa thông tin, Chuyển lớp, Tạm dừng / Thôi học, Lộ trình, Kết quả thi thật), mở hàng W2 / S, Ngăn Case (Xác nhận, Case, Kết quả PA), + Case, tab Ý thức + Ghi vi phạm, tab Hành trình | `hv46-*`, `ngan-*`, `them-case-*` |
| `/hoc-vien/10` lớp thường · `/65` FT chưa có điểm · `/82` Tạm dừng · `/21` (TVV) | QL, TVV | đầu hồ sơ, bốn ô, bảng kỹ năng, Kết quả Test | `hv10-*`, `hv65-*`, `hv82-*`, `hv21-*` |
| Quay lại | QL | `/hoc-vien?view=sos` cuộn 528 → hồ sơ em → ‹ ; hồ sơ lớp Cần hỗ trợ → hồ sơ em → ‹ | `back-*` |
| Vùng bấm 375 | QL | đo nút / link < 44 px ở 4 trang | — |

Không lỗi API / console nào trong mọi lượt (`loi` rỗng).

## 1. Design-specificity verdict
**Có ra dáng "Bàn làm việc của giáo viên".** Bảng nhóm theo lớp (hàng lớp đậm vạch trái, hàng em nhạt), mã tuần `W3 OCT` ở mọi chỗ, chip SOS theo bảng màu cố định,
cột "Việc tiếp theo" = động từ + đối tượng + hạn + người, Ngăn Case làm tại chỗ, Trước/Sau và "‹ nguồn" — đây là công cụ riêng của trung tâm IELTS, không phải
dashboard mẫu. Chỗ yếu không nằm ở "giống sản phẩm khác" mà ở **độ ồn**: cùng một ý nói 2–3 lần (chip + chữ + dấu "—"), dòng tên em chở 3–4 họ chip,
và vài nhãn trạng thái **sai hoặc lệch nhau giữa các màn** — cái này làm mất niềm tin nhanh hơn mọi chuyện thẩm mỹ.

## 2. Heuristics (cả vùng)
| # | Heuristic | Điểm | Lý do một dòng |
|---|---|---|---|
| 1 | Trạng thái hệ thống | 2 | Trạng thái có khắp nơi, nhưng vài chỗ báo sai: "mọi kỹ năng đạt" khi chưa có điểm, "Sắp tới" là bài đã qua, đỏ quá hạn bị giấu sau "+1". |
| 2 | Khớp đời thật | 3 | Thuật ngữ trung tâm chuẩn (SOS, PA, KCK, mã tuần); vài câu lủng củng ("hạn hết T2 14/09", "Tuần này là TUẦN HỌC THỨ 1"). |
| 3 | Kiểm soát / thoát | 3 | Quay lại giữ lọc + cuộn rất tốt; Esc đóng panel; nhưng Kết thúc lớp bị chặn không có đường đi tiếp, dải Tạm dừng không có nút Quay lại học. |
| 4 | Nhất quán | 2 | Một khái niệm nhiều tên (Lộ trình tiếp theo / quyết định chuyển lớp / xếp lớp tiếp), cùng Case hai trạng thái, cùng điểm hai màu, `01/2027` vs `JAN 2027`. |
| 5 | Phòng lỗi | 3 | Ô bắt buộc có `*`, nút tắt kèm "Chọn kết quả trước", Kết thúc lớp chặn khi còn em; ô ngày đa số là ONgay. |
| 6 | Nhận ra hơn nhớ | 3 | ⋯ đầu dòng, tooltip, cột tên dính khi cuộn Sửa cả lớp; trừ chú giải Hành trình 9 mục và số kỳ vọng không nhãn ("MT1 · W3 OCT · 5.5"). |
| 7 | Linh hoạt / nhanh | 3 | Chọn nhiều học viên, Điền cả cột, dán Excel, Xếp "Cần chú ý trước", trạng thái trên URL. |
| 8 | Tối giản | 2 | Lặp: "Chưa có kết quả" + "chưa có điểm" + dãy "—"; banner + dòng tóm tắt + cách xem cùng nói Lộ trình; nhiều câu giải thích dưới ô. |
| 9 | Nhận ra & sửa lỗi | 3 | Câu chặn nói lý do + bước tiếp ("Còn 33 học viên…"), rỗng có gợi ý; nhưng không kèm nút làm bước tiếp. |
| 10 | Trợ giúp | 3 | ⓘ, tooltip, chú giải tại chỗ; phần trợ giúp đang tràn ra thành câu trên màn (trái plan.md 1.1). |
| **Tổng** | | **27/40** | **Acceptable** (sát Good) |

## 3. Cognitive load
- Điểm quyết định > 4: **Chuyển tiếp lớp** (mỗi dòng 3 điều khiển × 33 em + thanh 6 nút + 6 chip tuần) · **Kết quả PA** (5 mức kết quả + 4 quyết định) ·
  **Đầu hồ sơ lớp** (Nhập điểm · + Case · ⋯ 6 mục, rồi 3 tab, 3 cách xem, Sửa thông tin, Chọn nhiều — 2 chỗ đặt nút) · **Chú giải Hành trình** 9 ký hiệu ·
  **Hàng lọc Học viên & Lớp** (5 chip + 2 ô chọn + ô tìm — chấp nhận được vì cùng hàng, cùng cỡ).
- Checklist hỏng 3/8 (mức vừa): **Visual hierarchy** (dòng tên em: chip Thiếu, Ý thức, SOS, "mới vào" ngang hàng tên) · **Minimal choices** (hai màn trên) ·
  **Working memory** (số kỳ vọng không nhãn ở Sắp tới, chú giải Hành trình, "Progress" lẫn `3/4 môn` với `56%` trong một cột).

## 4. Emotional journey
- **Đỉnh:** bấm tên em từ danh sách đã lọc rồi ‹ — về đúng chip, đúng chỗ cuộn; Ngăn Case mở tại chỗ, "← Case Speaking" thay cho panel lồng; toast "Đã lưu".
- **Hố lo:** (a) hồ sơ em mới vào ghi "0 Case · **mọi kỹ năng đạt**" — an tâm giả, TVV có thể báo phụ huynh sai; (b) banner cam "Lộ trình tiếp theo · chốt trước hết W1 SEP"
  đã quá 2 tuần mà không chữ "quá hạn" — biết là có chuyện nhưng không biết nặng cỡ nào; (c) Kết thúc lớp: nút tắt, đóng hộp, tự đi tìm menu khác.
- **Kết:** sau Tạm dừng thấy cùng một tin 3 lần (chip "Tạm dừng học", dòng vàng, dải vàng) nhưng không thấy nút "Quay lại học" ngay đó.

## 5. Điểm mạnh
1. **Quay lại đúng nguồn** chạy thật: `/hoc-vien?view=sos` cuộn 528 → hồ sơ → ‹ về đúng URL + cuộn 528; từ hồ sơ lớp nút ghi "‹ Hồ sơ lớp MB FT 101 · Cần hỗ trợ" (`back-*`).
2. **Việc tiếp theo** viết như người nói: "⚠ quá hạn 2 ngày Xác nhận nguyên nhân W2 · Cao Khánh Linh"; trên 375 hồ sơ HV thành thẻ "Case gấp lên trước" có nút chính
   "Xác nhận nguyên nhân" / "Kết quả" ngay dưới (`hv46-375-clip2`).
3. **Panel gọn, đúng một tầng:** Thông tin lớp chia 3 khối có "Sửa" riêng; Ngăn Case đổi nội dung trong cùng panel; Sửa cả lớp giữ cột Họ tên dính khi cuộn ngang.

## 6. Vấn đề ưu tiên

### CA2-1 · P1 · Ô "Học thuật" báo "mọi kỹ năng đạt" khi em chưa có điểm nào
- Trang · vai: hồ sơ HV `/hoc-vien/65` (Hà Gia Bình, tuần học 14, chưa điểm nào) và `/hoc-vien/82` · QL, TVV, GV.
- Thấy: ô Kết quả gần nhất "— · chưa có điểm nào" ngay cạnh ô Học thuật "0 Case · **mọi kỹ năng đạt**".
- Vì sao: H1 — báo trạng thái sai; trái nguyên tắc "không em nào bị bỏ sót" (em không có điểm lại trông như em ổn nhất).
- Đề xuất: không kỹ năng nào có điểm → chữ phụ **"chưa có điểm"**; có điểm, không Case → giữ "mọi kỹ năng đạt".
- Loại: sửa lỗi hiển thị (không mockup). File: `shared/domain/hoSoHocVien.ts:287` (`oHocThuat`, nhánh `!dong.length`).
- Ảnh: `hv65-QL-1440.png`, `hv82-tamdung-QL-1440.png`.

### CA2-2 · P1 · "Sắp tới" ở hồ sơ HV lớp thường là bài đã qua, lệch với danh sách lớp
- Trang · vai: `/hoc-vien/10` (Bùi Khánh Linh, MB FOU 12) · QL. Cũng thấy ở `/hoc-vien/82` (Tạm dừng): "Progress Test · W2 SEP".
- Thấy: ô Sắp tới "**Progress Test · W3 AUG** · 4 môn" (đã qua 4 tuần, còn thiếu P); roster cùng em `nextAttemptLabel` = **Final Test W1 OCT**; hồ sơ lớp ghi "Thi Final Test tuần này".
- Vì sao: H1 + H4 — cùng một số liệu hai hàm tính (CLAUDE.md: "cùng nguồn, cùng hàm").
- Đề xuất: hồ sơ HV lớp thường dùng cùng hàm mốc kế tiếp với danh sách (lượt từ tuần này trở đi); bài đã qua tuần mà thiếu điểm nằm ở ô Kết quả ("Chờ 1 môn"), không ở Sắp tới.
- Loại: sửa lỗi (không mockup). File: `server/src/students/profile.ts:672-674` (nhánh lớp thường `attemptRows.filter(planned).sort(soThuTuLuot)[0]`, không lọc tuần).
- Ảnh: `hv10-QL-1440.png`, `lop6-QL-1440.png`.

### CA2-3 · P1 · Cùng một Case, tab Học thuật "Quá hạn", tab Hành trình "Cần làm"
- Trang · vai: `/hoc-vien/46` · QL.
- Thấy: Case Writing Task 2 quá hạn xác nhận 2 ngày → Học thuật: chip đỏ "Quá hạn"; Hành trình: chip vàng "**Cần làm · chờ nguyên nhân**". Speaking "Đang làm" trắng ở Học thuật, đỏ ở Hành trình.
- Vì sao: H4 + CLAUDE.md "việc đã xong / quá hạn mọi nơi cùng một cách báo".
- Đề xuất: Hành trình dùng chung trạng thái v4 của Case: "⚠ Quá hạn · chờ nguyên nhân"; màu "Đang làm" theo một bảng.
- Loại: sửa lỗi (không mockup). File: `shared/domain/hanhTrinh.ts:218-219` (`trangThaiHop` không xét hạn).
- Ảnh: `hv46-hanhtrinh-QL-1440.png` so với `hv46-mo-w2-QL-1440.png`.

### CA2-4 · P1 · Một khái niệm, nhiều tên (Lộ trình tiếp theo / chuyển lớp)
- Trang · vai: Học viên & Lớp, hồ sơ lớp 3 và 6 · QL.
- Thấy: lớp thường — cách xem / banner / cột ghi "**Lộ trình tiếp theo**", badge ghi "**4 HV chưa có quyết định chuyển lớp**", panel Kết thúc lớp ghi
  "**Quyết định chuyển lớp** cho cả lớp trước", lớp hết khoá ghi "**cần xếp lớp tiếp**". FT — menu ⋯ "**Chuyển tiếp lớp**" mở panel tiêu đề "**Chuyển lớp** · MB FT 101 · 33 em".
- Vì sao: H4 — CLAUDE.md "một khái niệm một tên"; QL phải tự nối ba chữ là một việc.
- Đề xuất (giữ quyết định 11/10 "FT giữ Chuyển tiếp lớp"): badge lớp thường **"4 HV chưa chốt lộ trình"**; Kết thúc lớp **"Còn 7 em chưa chốt Lộ trình tiếp theo"**;
  tiêu đề panel FT **"Chuyển tiếp lớp · MB FT 101 · 33 em"**. "cần xếp lớp tiếp" giữ nếu đúng là trạng thái khác (sau hết khoá) — chủ SP xác nhận.
- Loại: đổi chữ (không mockup). File: `shared/domain/hocVienLop.ts:264` (`CHU_CHUYEN_LOP.chua`) · tiêu đề panel `web/src/modules/students/ChuyenLopPanel.tsx:380` (và `classes/TransitionPanel.tsx:215`).
- Ảnh: `hvl-QL-1440.png`, `lop3-QL-Chuyển_tiếp_lớp.png`, `lop6-QL-Kết_thúc_lớp.png`.

### CA2-5 · P2 · Badge đỏ "HV quá hạn việc" bị giấu sau "+1" với QL
- Trang · vai: `/hoc-vien`, đầu hồ sơ lớp 3 · QL.
- Thấy: MB FT 101 hiện "8 chờ duyệt · 78 bài chờ chấm · +1"; "+1" = "**6 HV quá hạn việc**" (đỏ). GVCN cùng lớp thấy đỏ ngay.
- Vì sao: H1/H8 — "cái quan trọng trước"; badge nguy hiểm duy nhất lại là cái bị gập.
- Đề xuất: badge tone `danger` không bao giờ vào "+n" (đưa lên đầu). Thứ tự QL hiện tại là luật cũ (B4/T53) → **đề xuất, chủ SP quyết**.
- Loại: ẩn-gộp (không mockup). File: `shared/domain/hocVienLop.ts:240-242, 274-275`.
- Ảnh: `hvl-plus1-QL-1440.png`.

### CA2-6 · P2 · Quá hạn chỉ báo bằng màu, không ⚠
- Trang · vai: hồ sơ lớp 6 (FOU 12) · QL; hồ sơ HV 46.
- Thấy: banner cam "Lộ trình tiếp theo · chốt trước hết W1 SEP · 0/7 em" (đã qua 2 tuần) + nút "**Mở**"; dòng tóm tắt "QL chốt trước hết **W1 SEP**" chỉ tô cam;
  dòng đỏ đầu hồ sơ HV "Writing Task 2 quá hạn xác nhận…" không ⚠. Banner vẫn hiện khi đang ở cách xem Lộ trình tiếp theo (nút "Mở" mở chính chỗ đang đứng).
- Vì sao: DESIGN.md "late — luôn kèm ⚠"; CLAUDE.md "trạng thái không chỉ phân biệt bằng màu"; H8 lặp.
- Đề xuất: banner **"⚠ Quá hạn 2 tuần · Lộ trình tiếp theo · 0/7 em"**, nút **"Chốt lộ trình"**; ẩn banner khi đang ở cách xem Lộ trình tiếp theo; dòng đầu hồ sơ HV thêm "⚠".
- Loại: đổi chữ + ẩn (không mockup).
- Ảnh: `lop6-lotrinh-QL-1440.png`, `hv46-QL-1440.png`.

### CA2-7 · P2 · Dòng tên em quá tải chip, chip trùng màu khác nghĩa
- Trang · vai: Học viên & Lớp (mở lớp), hồ sơ lớp Tổng hợp FT · QL, GV; CX.
- Thấy: tên + mã + "**Thiếu 3**" (vàng, chip vuông — DESIGN.md dành chip vuông cho mã) + "**Cần xử lý**" / "**Quá hạn · 1 ngày**" (là Ý thức nhưng không nói) + "mới vào",
  dòng dưới thêm chip "SOS 1" cùng màu vàng với "Thiếu". 46/99 em có "Thiếu n" → nhiễu. Hồ sơ lớp FT: "Chưa có kết quả" (chip) + "chưa có điểm" (cột Mốc) + 7 dấu "—" cho cùng một ý.
  CX lại vẽ cùng khái niệm thành chip xám "Thiếu thông tin" và chip "Ý thức".
- Vì sao: H8 + H4; vàng = "soon/SOS 1" theo DESIGN.md, dùng cho Thiếu thông tin là màu trạng thái làm trang trí.
- Đề xuất: "Thiếu n" thành chữ mờ không viền (vẫn bấm được); chip Ý thức ghi rõ **"Ý thức · quá hạn 1 ngày"** / **"Ý thức · cần xử lý"** (như CX đang dùng "Ý thức");
  bỏ chip "Chưa có kết quả" khi cột Mốc đã ghi "chưa có điểm"; QL và CX một kiểu chip Thiếu.
- Loại: đổi chữ / ẩn (không mockup). File: `web/src/modules/students/MissingBadge.tsx`, `web/src/modules/classes/CanhBaoYThuc.tsx:16-17`.
- Ảnh: `hvl-mo-QL-1440.png`, `lop3-dau-clip.png`, `hvl-CX-1440.png`.

### CA2-8 · P2 · Mã tuần và chip bị bẻ dòng
- Trang · vai: cột Việc tiếp theo (Học viên & Lớp), Theo dõi (hồ sơ lớp) ở 1440; ô Kết quả hồ sơ HV ở 375 · QL.
- Thấy: "Kết quả PA R · tuần **W2 / SEP** · hạn hết T2 14/09" (W2 và SEP hai dòng); "Xử lý vi / phạm"; 375: chip "Đã đủ điểm · SOS / 2" gãy trong chip.
- Vì sao: DESIGN.md "không dồn chữ"; mã tuần là đơn vị đọc chính.
- Đề xuất: mã tuần trong chữ việc dùng dấu cách không ngắt (hoặc bọc nowrap); chip `whitespace-nowrap`.
- Loại: sửa lỗi hiển thị (không mockup). File: `web/src/ui/ViecTiep.tsx:21-23` (`break-words` trên `v.viec`).
- Ảnh: `hvl-mo-QL-1440.png`, `lop3-QL-1440.png`, `hv46-375-clip1.png`.

### CA2-9 · P2 · Cùng dữ liệu, khác cách hiện giữa các màn
- Thấy: Dự kiến thi "**01/2027**" (đầu hồ sơ HV 21, Sửa cả lớp) vs "**JAN 2027**" (Học viên & Lớp); 27/40 chưa đạt **đỏ** ở bảng kỹ năng nhưng **vàng** ở Kết quả Test cùng trang (`hv10`);
  điểm MT ở bảng Mock Test hồ sơ HV **xanh link** vs xanh lá / đỏ ở hồ sơ lớp; cùng hạn PA Speaking: desktop "**hôm nay**", 375 + danh sách "**hạn hết T2 14/09**";
  MT1 của em 46: "chờ" (panel Lộ trình) vs "cũ" (bảng Mock Test); PET 66%: trắng ở Tổng hợp, vàng + "SOS · L+S" ở Điểm Test.
- Vì sao: H4 + CLAUDE.md "cùng số liệu cùng hàm".
- Đề xuất: một hàm hiện tháng dự kiến (`JAN 2027`), một bảng màu đạt/chưa đạt cho điểm, một hàm chữ hạn (hôm nay / mai / ⚠ quá hạn).
- Loại: sửa lỗi hiển thị (không mockup).
- Ảnh: `hv21-TVV-1440.png`, `hv10-QL-1440.png`, `hv46-QL-1440.png`, `hv46-375-clip2.png`, `hv46-QL-Lộ_trình.png`, `lop30-QL-1440.png`.

### CA2-10 · P2 · Câu giải thích trên màn (trái plan.md 1.1)
- Thấy: Thêm học viên 5 câu ("Cột "Lớp" và "Lộ trình" trong file dán sẽ bị bỏ qua…", "Lấy sẵn tuần khai giảng…", "Ô trống hoặc "-" = …", "Em đã có hồ sơ thì…");
  panel Lộ trình "Tuần này là TUẦN HỌC THỨ 1 của em…" (đụng chữ với nút "Tuần này" ngay cạnh) + đoạn 3 dòng về MT4/MT5; Chuyển tiếp lớp "Chỉ chọn từ tuần sau trở đi…" +
  "Gửi phần đã quyết trước, quyết nốt sau."; menu ⋯ hồ sơ HV có dòng phụ dưới từng mục; "Bấm một hàng để mở chi tiết ngay bên dưới"; "bấm để thu gọn";
  "Điểm của 2 mốc gần nhất, mốc mới nhất ở trên."; 375: "(điểm 2 mốc gần nhất ở bảng trên máy tính)".
- Đề xuất: bỏ hoặc dời vào ⓘ; panel Lộ trình đổi thành **"W3 JUN = tuần học 1"**; menu ⋯ chỉ một dòng nhãn.
- Loại: đổi chữ (không mockup).
- Ảnh: `lop3-QL-_Học_viên.png`, `hv46-QL-Lộ_trình.png`, `lop3-QL-Chuyển_tiếp_lớp.png`, `hv46-QL-menu.png`.

### CA2-11 · P2 · Vùng bấm < 44 px ở 375
- Thấy (đo): ⋯ hàng lớp và đầu hồ sơ lớp **28×28**; badge lớp (là nút) cao 28; "+2" GV bộ môn **15×16**; checkbox "Chỉ ô còn trống" **13×13**; "Thiếu n" cao 21.
- Vì sao: DESIGN.md "điện thoại nút ≥ 44 px"; PRODUCT.md Accessibility.
- Đề xuất: `max-sm:min-h-[44px] max-sm:min-w-[44px]` cho ⋯ (`MenuDong`), badge, "+n"; checkbox bọc nhãn cao 44.
- Loại: sửa lỗi hiển thị (không mockup).
- Ảnh: `lop3-375-dau-clip.png`, `hvl-QL-375.png`.

### CA2-12 · P3 · Bị chặn mà không có nút đi tiếp; Tạm dừng nói 3 lần, không có "Quay lại học"
- Thấy: Kết thúc lớp: "Còn 33 học viên đang học — chuyển lớp từng em hoặc chuyển nhiều em trước." + nút tắt, không có nút sang Chuyển tiếp lớp / Lộ trình tiếp theo.
  Em Tạm dừng: chip "Tạm dừng học" + dòng "Tạm dừng từ 14/09" + dải vàng (lý do, người ghi) — không nút "Quay lại học" (chỉ trong ⋯).
- Đề xuất: panel Kết thúc lớp thêm nút **"Chuyển tiếp lớp"** (FT) / **"Lộ trình tiếp theo"** (lớp thường) — đóng panel này, mở panel kia (không lồng);
  dải Tạm dừng thêm nút **"Quay lại học"**, bỏ dòng tóm tắt trùng.
- Loại: ẩn-gộp / thêm nút theo mẫu sẵn có (không mockup).
- Ảnh: `lop3-QL-Kết_thúc_lớp.png`, `hv82-tamdung-QL-1440.png`.

## 7. Persona red flags
- **GV bận nhập điểm cuối tuần (GVCN):** khối "Điểm Test của lớp" nằm dưới bảng Tổng hợp 33 em — phải cuộn qua cả bảng (FT); mỗi dòng nhập lặp "Nhận xét" 4 lần;
  việc "Kết quả PA … tuần W2 / SEP" gãy dòng nên khó quét; hạn "hạn hết T2 14/09" không nói "hôm nay".
- **QL chi nhánh nhiều lớp:** 20 lớp gập sẵn, badge đỏ quá hạn bị gập vào "+1"; ba tên cho cùng việc chốt lộ trình; banner quá hạn không ⚠; Kết thúc lớp ngõ cụt.
- **TVV ít quen web:** màn riêng gọn (tốt), nhưng hồ sơ em mới ghi "mọi kỹ năng đạt" (dễ báo phụ huynh sai); "Đang xem: HV của tôi · Tất cả" lặp lại ô chọn + chip;
  Dự kiến thi "01/2027" ở hồ sơ, "JAN 2027" ở danh sách.
- **Điện thoại:** ⋯ 28 px; tab "Phân tích lớ…" và "Kết quả đầu ra 1 đợ…" cắt mép; mỗi thẻ em ~330 px (lớp 33 em ≈ 11 000 px cuộn) vì khoảng trống giữa các dòng Kết quả / Việc tiếp;
  chip SOS gãy đôi.

## 8. Minor observations
- Admin: badge "1 HV quá hạn việc" nằm dưới cột "Ô chưa nhập" → đọc như số ô; chip "Đang SOS 0" vẫn hiện.
- `/hoc-vien/luu-tru` "Chưa có lớp nào kết thúc" dù demo có MB FOU 03 / MB BE 08 `status='ended'` — `server/src/classes/luuTru.ts:36` lọc `'finished'` (chuyển agent chức năng).
- Tìm không ra kết quả thì nút "+ Học viên" biến mất (`StudentsPage.tsx` dựa vào `rows.some(viewer…)`); khung rỗng không có nút "Xoá tìm".
- Ba kiểu "đang chọn": chip lọc nền nhấn, đoạn chọn viền teal + ✓, chip có huy hiệu ✓ ở góc (Lộ trình "Tất cả 7", tuần "W4 SEP").
- Nút "Xác nhận nguyên nhân" mở panel tên "Xác nhận Case"; Ngăn Case có hai nút "Kết quả" (trong thẻ PA + chân panel); Case "Đang làm" vs PA "Đang thực hiện".
- Thêm học viên: ô Ngày sinh không có nút lịch (Sửa cả lớp thì có) — trái quyết định 06/10 ONgay; placeholder "dd/mm/yyy" bị cắt.
- Cột Progress (Lộ trình tiếp theo) lẫn đơn vị `3/4 môn` · `▼56%` · `70%`; CX: "SOS 3" hiện cả ở Kết quả lẫn Cần chú ý.
- Lưu trữ dùng link "‹ Học viên & Lớp" chữ trần, các hồ sơ dùng nút viền.
- "Không cần theo dõi…" bị cắt ở hàng Case mở rộng; Hành trình điểm "6.5 ?" — dấu "?" không rõ nghĩa.
- Bảng Điểm MT lớp 3: MT1 "12/35", MT3 "3/34" trong khi lớp 33 HV — mẫu số khác nhau không giải thích.

**Câu hỏi cho chủ SP**
1. Nếu một em mới vào và một em đạt hết trông giống nhau ở hồ sơ, "không em nào bị bỏ sót" còn đứng được không — có nên coi "chưa có điểm" là một trạng thái cần làm riêng?
2. Badge lớp của QL: nên xếp theo "việc của QL" (chờ duyệt trước) hay theo "độ nguy hiểm" (đỏ trước)? Hiện là cách thứ nhất và đỏ bị gập.
3. Dòng tên em có cần chở cả Thiếu thông tin không, khi đã có chip lọc "Thiếu thông tin 46" riêng?

Tổng: 12 vấn đề (P1 ×4, P2 ×7, P3 ×1) · cần mockup: 0.
