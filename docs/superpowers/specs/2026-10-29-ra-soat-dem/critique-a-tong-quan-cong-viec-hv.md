# Critique ảnh cặp mockup | web — 29/10 (nhánh claude/ra-ui-4, web :5310)

Ảnh: thư mục này. Mỗi màn `<màn>-m.png` (mockup), `<màn>-w.png` (web), lát 1440 `-m1/-w1…`, lát 375 cặp cạnh nhau `-p1…`.
Công cụ: `../cap.mjs` (Playwright, một trình duyệt). Vai: QL 2 · GVCN 7 · TVV 23. 1440 tối, 375 sáng.
Ghi chú đo: tỉ lệ chữ đậm web ≈ mockup (TQ 51 % / 49 %, CV 51 % / 65 %) — không phải lỗi. Màu SOS 1 rỗng = quyết định MAU-MUC 28/10 (mới hơn mockup V5) — không tính lệch.

## Bảng điểm (Nielsen 10 × 0–4)

| Màn | Vai | /40 | 3 vấn đề lớn nhất |
|---|---|---|---|
| Tổng quan | QL | 28 | 375: thẻ bảng nhãn–số lệch lưới · nút đoạn FT/Thường vỡ thành nút rời · SOS chip rỗng + số gạch chân rời (mockup một chip "SOS 1 · 1") |
| Tổng quan | GV | 27 | 1440 cắt chữ cột Lớp ("MB Pre FO…", "LT1 · MT1 · W3 S…") · SOS 3 mức xếp chồng 3 dòng · 375 thẻ nhãn–số lệch |
| Tổng quan | TVV | 29 | 3 thẻ số (mockup 4) → 375 thẻ thứ 3 mồ côi nửa hàng · khối "Thi thật" dòng không dòng phụ (mockup có tên em + hạn) · "– Chưa có dữ liệu" không viền đứt |
| Công việc | GV | 30 | panel phải trống chỉ là hộp 100 px (mockup panel cao hết cột) · hạn viết hoa "Quá hạn / Hạn" (mockup chữ thường) · 375 nút đoạn rời, không full bề rộng |
| Công việc | QL | 26 | "Chờ bạn duyệt" tràn cả hai cột, thẻ dài 3–5 dòng (mockup trong cột trái, thẻ gọn) · hai nhóm nút đoạn cùng "✓ Tất cả" · panel trống bị đẩy xuống dưới |
| Công việc | TVV | 29 | hạn xa là chữ trơn 2 dòng "Hạn 18/09 / còn 4 ngày" (mockup viên "hạn 19/09") · "Gia hạn" thành nút viền (mockup link chữ) · panel trống |
| HV & Lớp | GVCN | 27 | mọi lớp gập, dòng tiêu đề cột không có hàng dưới · nút việc cắt "…bậc kế t…" và lặp tên em trong chính hàng em · 375 "Xuất Excel" gãy 2 dòng, ⋯ rơi dòng |
| Hồ sơ HV | GVCN | 31 | "Case Listening" 17 px nằm trong khối 15 px (phân cấp ngược) · dải việc cắt chữ "tutor Li…" · 375 ⋯ của PA mồ côi một dòng, "Sửa" một dòng riêng |
| Hồ sơ HV · Ý thức | GVCN | 31 | mũi tên mở tại chỗ vẽ "›" (luật: › = đổi trang, mockup ▸) · "Xác nhận cấp bậc vi phạm" chữ mờ, không ra link · tiêu đề "Vi phạm chưa xong" 14 px (mockup 15) |
| Hồ sơ lớp | GVCN | 25 | 375 bảng chỉ thấy Học viên · Target · MT, đường kẻ hàng lệch giữa cột dính và phần cuộn · đầu trang ~380 px (mockup ~170) · hai hàng lọc + "Sửa thông tin" lạc chỗ |

## Lỗi theo màn

### Chung (sửa một chỗ, áp nhiều màn)
1. **P2** — Nút đoạn (`BoLocDoan`) ở < 640 vỡ thành nút rời có khe, không full bề rộng; mockup CV 375 (v7, mới nhất) là một khối liền 3 ô full bề rộng. Gặp ở TQ QL, CV GV/QL, Hồ sơ lớp.
   Sửa: `web/src/ui/ui.tsx:571-578` — bỏ `max-sm:flex-wrap max-sm:gap-1.5 max-sm:border-0` + `max-sm:rounded-lg max-sm:border`; ≤ 3 mục: `max-sm:flex max-sm:w-full` + nút `max-sm:flex-1 justify-center`; > 3 mục mới xuống dòng. (Trái quyết định OV-14b 17/10 → mockup v7 mới hơn thắng; ghi [XM] nếu PTA muốn giữ.)
2. **P2** — Thẻ bảng 375 (`Bang` chế độ thẻ): nhãn đứng TRƯỚC số trong lưới auto-fill → nhãn dài tự gãy thành nhãn-trên-số, ô cạnh nhau lệch ("Việc đúng hạn —" | "Chấm Test đúng hạn / 46 %"). Mockup: lưới 2 cột, nhãn 13 trên, số dưới.
   Sửa: `web/src/ui/Bang.tsx:69-72` — `grid-cols-2` cố định, mỗi ô `flex flex-col items-start` (nhãn 13 `text-dim` trên, số dưới). Áp mọi bảng TQ QL/GV ở 375.
3. **P2** — Hạn: xa hạn là chữ trơn (TVV 2 dòng), sắp/quá hạn là viên; chữ viết hoa đầu ("Quá hạn 68 ngày", "Hạn 16/09"). Mockup: mọi hạn là viên 22 px, chữ thường ("quá hạn 3 ngày", "hạn 21/09" viên xám).
   Sửa: `web/src/ui/Nhan.tsx:129-134` — xa hạn thêm `h-[22px] rounded-full px-2 text-xs bg-white/[.06]`; bỏ `first-letter:uppercase`, đổi khoá `t('Quá hạn {n} ngày')` → `quá hạn {n} ngày`. TVV: `modules/congViec/DanhSachViec.tsx:398-404` (`HanPhu`) gộp vào viên, không dòng 2.
4. **P3** — SOS ba kiểu vẽ trên ba màn: TQ chip rỗng + số gạch chân rời; HV & Lớp ô số trong viền; Hồ sơ lớp "1·4 2·2 3·5". Mockup TQ: số trong chip "SOS 2 · 1".
   Sửa: `web/src/modules/worklist/LopToiDay.tsx:213-219` (và Lớp cần chú ý QL) — đưa số vào trong chip (chip là nút OSo), `flex-nowrap`; một hàm vẽ chung ở `ui/Nhan.tsx` cạnh `CHIP_SOS`.

### Tổng quan
5. **P2** GV 1440 cắt chữ cột Lớp + dòng phụ. `modules/worklist/LopToiDay.tsx:148` (`lop` rong 112 → ~140, bớt `ky` 72→60) và `:197` bỏ "· tuần này" khỏi dòng phụ (đã có ở cột Chờ chấm / Test) hoặc cho dòng phụ 2 dòng thay "…".
6. **P2** GV/QL "Lớp tôi chủ nhiệm" SOS xếp 3 dòng làm hàng cao gấp đôi. `LopToiDay.tsx:155` cột `sos` 100 → 150, `:214` `flex-nowrap`.
7. **P2** TVV 375 thẻ số thứ 3 mồ côi nửa hàng: lưới 4 thẻ có 3 → `max-sm` thẻ cuối `col-span-2` (`modules/worklist/TongQuanV5.tsx`, dải thẻ chỉ số).
8. **P3** QL 1440 cột bảng Lớp cần chú ý dồn: khoảng trống lớn giữa "SOS hiện tại" và "Case chưa PA" — dùng `deu` như bảng GV.
9. **P3** "– Chưa có dữ liệu" (TVV Báo PH) là chữ đậm trơn; mockup viên viền đứt (`ChipDuoiKck`/kiểu `.bd-thieu`).

### Công việc
10. **P1 [BỐ CỤC]** QL: "Chờ bạn duyệt" là section full width TRƯỚC lưới hai cột → panel phải bắt đầu ở hàng 2, thẻ duyệt kéo dài cả 1400 px. Mockup c1: nhóm đầu trong cột trái 600 px. `modules/congViec/HoTroHocVienTab.tsx:366-372` → chuyển vào đầu cột trái (`:377`).
11. **P2** QL hai nhóm nút đoạn cạnh nhau cùng "✓ Tất cả" (phạm vi + khung) — đọc như trùng. Nhóm khung đổi chữ "Mọi khung" hoặc thành `select` như "Mọi hạn".
12. **P2** Panel trống "Chọn một việc…" là hộp 100 px; mockup panel cao hết cột. `HoTroHocVienTab.tsx:441` thêm `lg:sticky lg:top-4 lg:min-h-[calc(100vh-200px)] flex items-center justify-center`.
13. **P3** "Gia hạn" (TVV) là nút viền thứ hai cùng cỡ "Chốt bước tiếp"; mockup link chữ dưới nút chính → `btn-ghost text-accent` ở `nutPhu`.
14. **P3** [XM] QL mặc định "Tất cả 96"; mockup mặc định "Của tôi" (luật "việc của tôi ở trang đầu vai") — hỏi PTA.

### Học viên & Lớp
15. **P2** Mọi lớp gập khi vào trang; dòng tiêu đề cột (Lộ trình · MT gần nhất · …) đứng trơ không hàng nào. Mockup mở lớp đầu. Sửa: mở sẵn lớp đầu (hoặc lớp chủ nhiệm) ở `modules/students/StudentsPage.tsx` (`moSet` khởi tạo) hoặc ẩn dòng tiêu đề cột khi mọi nhóm gập.
16. **P2** Nút việc trong hàng em lặp tên em + cắt: "Xử lý vi phạm · Kiều Minh Đức (2) · bậc kế t…". Bỏ tên em khi hiển thị trong hàng của chính em (chữ việc dùng `chuViec` dạng ngắn) — `ui/ViecTiep.tsx:20`.
17. **P2** 375 đầu trang: "Xuất Excel · 70 HV" gãy 2 dòng, đứng riêng; ⋯ của hàng lớp rơi xuống dòng riêng làm hàng cao lệch. `StudentsPage.tsx:395-400` — `max-sm:w-full` cho nhóm nút, nút `whitespace-nowrap`; ⋯ hàng lớp `self-start` cùng dòng tên.
18. **P3 [BỐ CỤC]** Cột em khác khung (web "MT gần nhất" gộp OVR + L R W S chữ 13; mockup cột riêng L · R · W · S · Kết quả). Xác nhận với PTA đây là quyết định sau mockup.

### Hồ sơ HV
19. **P2** Phân cấp ngược: khối "Case & phương án" 15/700 chứa "Case Listening" h2 17/700. `web/src/ui/KhungPanel.tsx:309` → `trongCot ? 'text-[15px]' : 'text-[17px]'`.
20. **P2** Dải việc đầu hồ sơ cắt "…tutor Li…". `modules/students/DauHoSo.tsx:188` `sm:truncate` → `sm:line-clamp-2`.
21. **P2** 375 Case: "Sửa" chiếm một dòng riêng dưới meta; ⋯ của thẻ PA mồ côi một dòng trên "Cập nhật trước hạn". Đặt ⋯ cùng hàng tiêu đề PA (`justify-between`), "Sửa" cùng hàng tiêu đề Case.
22. **P3 [XM]** Đầu mục Case có vạch nhấn trái (`DauMuc`, M6) — mockup M5 chữ trơn 13/700. `modules/cases/CasePanel.tsx:338-344`. Theo M6 ở DESIGN.md hay M5 — hỏi PTA.
23. **P3** Thẻ điểm: ✓ vượt kỳ vọng mockup xanh lá (L ✓7.0), web mọi ✓ cùng xanh nhấn — kiểm `--kq-vuot` có dùng ở thẻ đầu hồ sơ.
24. **P3** 375 thanh tab cắt "Lộ trình & lớ…" (mockup vừa). Bớt `px` tab ở `ui/HangTab.tsx` max-sm hoặc thêm bóng mờ mép cuộn.

### Ý thức
25. **P2** Dòng vi phạm mở tại chỗ nhưng mũi tên là "›" nét (luật: › = đổi trang; mockup ▸ đặc). `modules/yThuc/NhanViPham.tsx:20` → tam giác đặc `M4 2.5 8.5 6 4 9.5z` `fill="currentColor"` (dùng chung GvCham, ClassYThucCard, PhoiHop).
26. **P3** "Xác nhận cấp bậc vi phạm" chữ mờ không giống link; mockup gạch chân màu nhấn. `ThangYThuc.tsx` → lớp `ten-ho-so`/`text-accent underline`.
27. **P3** "Vi phạm chưa xong" h3 14 px; nhóm = 15/700. `modules/yThuc/StudentYThucSection.tsx:167` `text-sm` → `text-[15px]`.

### Hồ sơ lớp
28. **P1** 375: bảng HV tắt chế độ thẻ (`the375={false}`) → chỉ thấy Học viên · Target · MT, điểm L R W S Overall phải cuộn ngang; mockup 375 là thẻ em đủ điểm. `modules/classes/BangHoSoLop.tsx:198` bỏ `the375={false}` (Bang đã có chế độ thẻ) — kiểm ô sửa tại chỗ còn dùng được.
29. **P1** 375: đường kẻ hàng lệch / đứt giữa cột tên dính và phần cuộn (hàng có dòng phụ "Thiếu 1", "Ý thức · cần xử lý" cao khác). `web/src/index.css:378` `.sticky-col` — kẻ bằng `box-shadow: inset 0 -1px var(--line)` trên mọi `td` thay vì `border` để cột dính và phần cuộn cùng vạch; hoặc hết lỗi khi làm mục 28.
30. **P2 [BỐ CỤC]** Đầu trang ~380 px (lưới nhãn GVCN/HV/Lượt/Đạt/SOS + dòng GV kỹ năng + 2 viên + 3 thẻ việc + "+25 việc") so với mockup ~170 px (2 dòng). Gộp viên "21 bài chờ chấm · 6 việc quá hạn" vào dòng GV; 3 thẻ việc → 1 dòng việc cấp lớp như mockup.
31. **P2** Hai hàng lọc (nút đoạn Tổng hợp/Cần hỗ trợ/KQĐR + viên Tất cả/SOS/Chưa đủ) + "Sửa thông tin" lạc ở cuối hàng lọc. Mockup một hàng. "Sửa thông tin" về menu ⋯ đầu trang.
32. **P3** "Trần Ngọc Hà" (GVCN) ở đầu trang chữ xanh 17 — link xanh to nhất trang; mockup chữ thường. Dùng `ten-ho-so` màu chữ thường.
33. **P3** Hàng "Hồ Gia Hân" Target "— · KCK" gãy 2 dòng, gạch chấm — `whitespace-nowrap` ô Target.
