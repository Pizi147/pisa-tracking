# 03 · UX/UI Audit — rà theo trang → thành phần → vai → luồng (20–21/10/2026)

> **Mục đích.** Một chỗ hợp nhất MỌI phát hiện UX/UI đã có — tài liệu chính (mục 0–12) và 18 phụ lục (a1–a7, b, v1, v2a, v2b, v3a, v3b, v4a, v4b, v4c). Gộp trùng thành **62 vấn đề** (55 mã AU + 7 luồng F), không bỏ mã gốc nào (Phụ lục A), giữ ngoại lệ. Mỗi vấn đề đủ 10 ý theo MP XVII.3.
> **Cách đọc.** Chủ SP: đọc §0 (điểm, 10 vấn đề nặng nhất, số đếm) và §5 (ảnh / dữ liệu cần). Người làm PR: đọc §1 (gốc hệ thống) trước §2 (từng trang). §3 (vai) và §4 (luồng) dẫn về AU / F. Muốn tra một mã gốc (A1-, CV-, V4B-…) → Phụ lục A.
> **Bộ tài liệu.** [`00-muc-luc.md`](00-muc-luc.md) · [`01-feedback-register.md`](01-feedback-register.md) (FB, HT) · [`02-conflict-decision-log.md`](02-conflict-decision-log.md) (X-nn, Q-xx) · **03 (tệp này)** · [`04-design-system.md`](04-design-system.md) · [`05-ia-workflow.md`](05-ia-workflow.md) · [`06-mockup-gap.md`](06-mockup-gap.md) · [`07-pr-plan.md`](07-pr-plan.md) · tài liệu chính [`../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md`](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md) · phụ lục [`../2026-10-20-danh-gia-ux/`](../2026-10-20-danh-gia-ux/).
> **Ký hiệu.** **AU-nn** vấn đề hợp nhất · **F-nn** luồng · loại (MP I.2): **A** đã chốt · **B** phương án chủ SP chưa chốt · **C** ý PTA · **D** lỗi đã xác nhận · **E** cần kiểm chứng · **F** xung đột / chưa rõ; "A·D" = chủ SP đã chốt phải sửa một lỗi đã xác nhận · mức **P0** sai dữ liệu / chặn việc · **P1** gây nhầm, bỏ sót, nhiều bước · **P2** khó chịu, có đường vòng · **P3** chỉnh nhỏ · trạng thái: đã kiểm (web / mã / đo) · giả thuyết · cần ảnh · cần dữ liệu · ⚑ = phụ lục nói khác hướng PTA đã quyết 21/10.
> **10 ý mỗi vấn đề:** 1 ở đâu · 2 biểu hiện · 3 bằng chứng · 4 nguyên nhân · 5 ảnh hưởng · 6 phương án ưu tiên · 7 xuyên trang / vai · 8 luật nghiệp vụ · 9 cách kiểm thử · 10 cần chủ SP xác nhận.
> **Bằng chứng.** `tệp:dòng` = mã `main` e3405b93 (chưa deploy). Id ảnh = ảnh tạm của đợt rà (scratchpad, không vào repo) hoặc `../2026-10-20-danh-gia-ux/anh/`. Ảnh chủ SP v0-1…v4-4 theo 01 §2; v4-4 là **bản chính** — không chép tên người.
> **Trạng thái.** Chỉ đánh giá — chưa sửa mã, chưa giao PR. Soạn: agent d3 (Opus 5.5) cho PTA Plan, 21/10. Theo 12 hướng PTA đã quyết 21/10. **21/10 — chủ SP đã trả lời 17/17 + đồng ý gói PTA tự quyết (02 mục 5, 2.9):** ý 10 "Chủ SP" ở các vấn đề dưới ghi lựa chọn; F-02 theo **luật 4 sửa 21/10**; F-03 / AU-17 theo **việc TVV + hạn**; AU-41 theo **S chéo không cần lớp**; AU-26 giữ tên "Cần làm" (agent d6).

---

## 0. Kết luận

### 0.1 Điểm Nielsen: **23/40 — không xứng ≥ 35**

| Khu vực | Điểm | Nguyên tắc thấp nhất |
|---|---|---|
| Khung + Tổng quan | 23/40 | Nhất quán 1 · Trạng thái, Khớp đời thực, Phòng lỗi, Nhận ra, Tối giản 2 |
| Công việc + panel | 21/40 | Nhất quán 1 · 7 nguyên tắc ở mức 2 |
| Học viên & Lớp + hồ sơ | 23/40 | Nhất quán 1 · Tối giản 1 |
| Test + nhập điểm | 23/40 | Nhất quán 1 · Tối giản 1 |
| Phân tích + Tutor + Quản trị | 21/40 | Nhất quán 1 |
| Số liệu | 8/16 | Nhất quán 1 |
| **Toàn web (trung vị)** | **23/40** | "Tạm được" (20–27). ui-ux-pro-max ước 21/36. Tải nhận thức trượt 5–6/8 |

**Vì sao không xứng 35 (≥ 35 cần gần như mọi nguyên tắc 3–4):**
- **Nhất quán = 1 ở cả 6 phạm vi:** ≥ 12 cặp cùng nhãn khác số (AU-05); 2 giao diện nhập điểm cả lớp (AU-38); 11 lối xuất, 5 bộ tên cột (AU-18); chip SOS 4 dáng (AU-27); một môn trượt 7 dáng (AU-03); panel 7 dáng (AU-08); "đang chọn" 5 dáng (AU-09); chọn thời gian 14 chỗ 5 dáng (AU-11).
- **Tối giản 1–2:** hồ sơ lớp 4 800 px (375: 10 640 px ≈ 13 màn); Lịch Test 2 172 → 5 476 px; "Thiếu n" ở 46/51 em; việc đầu tiên ở Công việc nằm y 752 px (AU-15, AU-42).
- **Trạng thái hệ thống 2:** "Theo tháng" ra tháng trước (P0); 8 số bấm không mở gì; dấu "✓ đã lưu" trùng "✓ đạt"; hover ΔL 0–4,5 (AU-04, AU-06, AU-10, AU-09).
- **Phòng lỗi 2:** Chờ duyệt lẫn chi nhánh; "Chọn hết" chọn thẻ đang ẩn; "Phân công…" đổi phân công cả lớp; "Thôi học" lưu ngay (F-07, AU-43, AU-52).
- **Vòng 4 thêm bằng chứng kéo xuống:** Công việc (V4A-01…06), 29 khoá cứng (V4B-05), 3 luật Phần II + lời 21/10 đang lệch mã (AU-14, F-02, F-03).
- **Giữ (nền kỹ thuật tốt):** 0 lỗi API / JS; focus thấy ở 180/180 bước Tab; không trượt ngang 41/41; lưu từng ô; Esc / Quay lại giữ cuộn; Skeleton; dải mất kết nối; Dán Excel có xem trước + Hoàn tác.
- **Đường lên (ước):** GĐ1 → ~27–28 · GĐ2 → ~32–34 · GĐ3 → ≥ 35. Chỉ nói "đạt" khi chấm lại cùng phương pháp trên bản đã merge (Q13).

### 0.2 Mười vấn đề nặng nhất

| # | Vấn đề | Mức | Mã | Vì sao nặng |
|---|---|---|---|---|
| 1 | Số sai dữ liệu: "Theo tháng" ra tháng trước; "PA trong kỳ" không theo kỳ; Chờ duyệt lẫn chi nhánh; em SOS 3 rơi trang 2; panel việc hiện em ngoài việc | P0 | AU-04 | báo cáo in sai; duyệt nhầm chi nhánh; bỏ sót em SOS 3 |
| 2 | Luật 4 lệch: "-" ghi muộn = Không dự thi (luật: dời); "-" ở MT cũ = Không dự thi (luật 4 sửa 21/10: **huỷ ngay**, Hoàn tác 10 s, khôi phục được); huỷ điểm → hồ sơ MT → khôi phục → dời ≈ 14 bấm | P1 | F-02 | em mất quyền thi bù (ghi muộn), không đường khôi phục rõ; nhầm 5 loại "huỷ" |
| 3 | Luật 3 lệch: GV không sửa được điểm Progress đã lưu (R11) + 10 khoá cứng khác | P1 | AU-14 | điểm sai tồn tại; QL phải sửa thay |
| 4 | Luật 1, 2 và lời 21/10 chưa có: GVCN lưu xử lý không sinh việc TVV; GVCN xoá thẳng lần xử lý | P1 | F-03 | vòng xử lý vi phạm không khép; mất dấu vết kỷ luật |
| 5 | Bảng lệch tiêu đề ↔ ô 45–86 px ở mọi lưới điểm ("đã nhắc rất nhiều lần") | P1 | AU-01 | nhập nhầm L ↔ R; tái phát mỗi đợt |
| 6 | Chấm Test: GV nhầm tuần; cùng khối lượng ra 4 con số; Speaking ghi "GV khác" | P1 | F-01 | chấm nhầm / bỏ sót bài; QL không tra được ai còn nợ |
| 7 | ≥ 12 cặp cùng nhãn khác số (58 / 53 / 28 bài; 4 định nghĩa SOS) | P1 | AU-05 | QL không tin số, giao ban mất thời gian |
| 8 | "Tháng = đã thi": từ 01/12 em chỉ có tháng tự thành "Đã thi · chờ KQ", GVCN nhận việc có hạn sai | P1 | F-05 | sai trạng thái hàng loạt, có hạn đếm ngược |
| 9 | Công việc dày đặc; "Phân công…" mở phân công cả lớp và việc không xong được; dòng mở rộng che tên việc + tên em | P1 | AU-42, AU-43, AU-44 | không biết làm gì, cho ai; ghi nhầm em |
| 10 | Số bấm "nháy" không mở; vùng bấm 8×12 px; bộ chọn tuần tự đóng khi bấm trong lịch | P1 | AU-06, AU-12 | thao tác chính của QL hỏng; gần như không chọn được tuần |

### 0.3 Số đếm

- **62 vấn đề hợp nhất** từ **277 mã gốc** (A1 26 · CV 33 · A3 32 · TST 28 · A5 37 · A7 29 · B 10 · X 11 · V2A 9 · V2B 9 · V3A 9 — không có V3A-4 · V3B 13 · V4A 8 · V4B 9 · V4C 14) + các mục v1 (không đánh mã) + FB của 01.
- **Theo mức:** P0 **1** · P1 **44** · P2 **15** · P3 **2**.
- **Theo loại:** cả 62 đều có lỗi đã xác nhận (D) bằng web / mã / đo — trong đó **26** là A·D (chủ SP đã chốt phải sửa) · **28** là D · **6** là B·D (phương án chủ SP chưa chốt: AU-22, AU-53, AU-54, F-01, F-04, F-07) · **2** có xung đột F (AU-25, AU-26).
- **Còn phần E (cần kiểm chứng): 16** — AU-04, AU-05, AU-10, AU-16, AU-32, AU-35, AU-36, AU-43, AU-44, AU-46, AU-50, AU-52, AU-53, AU-54, F-02, F-05 (bấm thử sau Lưu, ảnh bản chính, dữ liệu thật — §5).
- **Đã bác — không phải lỗi web:** A1-26 = A7-06 (~32 lỗi 403: máy thử chặn tệp phông), TST-28 ("6 em hiện hai lần": lỗi ghép ảnh). Đúng mockup / tên đã chốt, chỉ nêu: A5-34 (nút chính Tutor — PTA vẫn đề nghị đổi, 02 4.7 #6), A5-35 ("Báo cáo" ↔ "Báo cáo đơn vị").

---

## 1. Vấn đề hệ thống — một gốc, nhiều trang

Sửa ở gốc thì nhiều trang cùng lên. Các khối ở §2 chỉ ghi phần riêng của trang và dẫn về đây.

#### AU-01 · Bảng lệch tiêu đề ↔ dữ liệu, ô điểm 7 dáng, nút đè ô
`A·D` · **P1** · đã kiểm (đo DOM + mã + `git show`) · HT-03 · Mã: V2B-1, V2B-2, V2B-9, V3A-7, V3A-9, B-01, FB-2-09, FB-2-14, FB-3-03, FB-3-04, FB-4-14
1. **Ở đâu:** mọi bảng / lưới có điểm — lưới MT ở 6 lối vào (hồ sơ lớp, panel Nhập điểm, Lịch Test, Công việc, `/nhap-diem`, Điểm theo lớp), Học viên & Lớp, Tổng hợp hồ sơ lớp, Đang SOS, lưới lớp thường, Lịch Test khối 1, Kế hoạch Test, `HangNhom` ở Phân tích, Tutor. 53 tệp có `<table>` + ~10–15 lưới div + 5 lưới ARIA.
2. **Biểu hiện:** tiêu đề ↔ ô lệch 45–69 px (lưới MT: S 67,9, L 51,2), 86 px (ô "tổng" lớp thường), 76,5 px (cột Hạn khối 1), 45–53 px (`HangNhom`); số cùng hàng lệch đường cơ sở 7–24 px; hàng cao 34–101 px; W1 / W2 thấp hơn L / R 6,9 px; ô 1–3 dòng; ⋯ đè 41 % ô "tổng"; "Lớp tôi dạy" tràn thẻ 201 px; 375: tên em đè 6 px lên ô hàng dưới; 1 280 px Học viên & Lớp vỡ 8/13 cột.
3. **Bằng chứng:** bảng đo V2B-1 (lưới MT hồ sơ lớp 9/10 cột lệch; Lịch Test 33 cột / 6 bảng, 69 px; HV & Lớp 47,9 px, hàng 100,6 px); `v3a-bang.json`, `v3a-cat.json`; `index.css:267` (OV-15a #460 `31b4f24f` — trước đó lưới thẳng); `ClassRoster.tsx:240`; `LuoiFT.tsx:89-94, 174`; `LuoiThuong.tsx:438`; `LopToiDay.tsx:92-93`; ảnh `v2-luoi-mt3-lech-cot` ↔ `v2-mockup6-luoi-diem`; ảnh chủ SP v2-4, v3-1. **Đối chứng 0 lệch:** Kết quả thi, Báo cáo, Hồ sơ GV, Quản trị, Mock hồ sơ HV, bảng Tutor.
4. **Nguyên nhân (đã kiểm, 8 gốc):** R1 không có component bảng (~190 lớp căn viết tay, tiêu đề và ô một cột ở 2 chỗ) · R2 luật căn theo tên lớp `index.css:267` · R3 colgroup px + `w-full` / % · R4 ô điểm 7 cấu trúc + căn giữa dọc · R5 công cụ (Dán Excel, GV chấm S, "tổng [25] Điền cả cột") nằm trong khung / tiêu đề · R6 ~100 phép kiểm đọc chuỗi mã khoá cách viết; `do-khung` bỏ qua lưới chấm · R7 vá số px · R8 lệch mockup 6 khung 3.
5. **Ảnh hưởng:** Cô Linh dò "L" sang ô cách 51 px → dễ nhập nhầm L ↔ R khi nhập 20 bài; Chị Vy không so được L / R / W / S một em; chủ SP phải nhắc mỗi đợt.
6. **Phương án:** hệ bảng mới, không vá — `Bang` + kiểu cột (tên · chữ · số · điểm · `diem-ti-le` · `phan-tram` · chip · tuần/ngày · việc · nút; cùng `data-kieu` cho `th` và `td`), cột px theo kiểu, một cột co giãn; hàng 44 / 64 px căn đường cơ sở; công cụ ngoài khung; **cấm ô nhập / nút trong `th`**; nhóm cột 2 tầng; 375 tự thành thẻ từ cùng định nghĩa cột; một `ODiem` (ký hiệu ✓/✗ trước số, ô rộng cố định, một dòng phụ). Bỏ `index.css:267`; cột số căn giữa (C06) + ký hiệu trước số (02 X-01). → 04 (Bảng, Ô điểm) · 07 (BANG-0, BANG-1).
7. **Xuyên trang / vai:** mọi vai, mọi trang có bảng; đi cùng AU-02 (chữ), AU-03 (màu), AU-20 (375).
8. **Luật:** không đổi luật; ô nhập theo vai giữ nguyên.
9. **Kiểm thử:** `bang.tests.ts` trong `npm run check` (cấm lớp căn trên `td`/`th` ngoài `Bang`; cấm luật căn theo tên lớp; `<table>` chỉ trong `Bang`, danh sách miễn chỉ được giảm; cấm `input`/`button` trong `th`; cỡ chữ ô ∈ thang) + `do-bang` đo DOM ở 1 440 / 1 280 / 375: lệch tiêu đề ↔ ô ≤ 2 px, đường cơ sở ≤ 2 px, cao hàng ∈ {44, 64}, không tràn thẻ, không đè > 2 px, vùng bấm ≥ 44 px bằng `min-height` + ảnh cặp 3 bảng (lưới MT, Tổng hợp, HV & Lớp) với mockup 6 khung 3.
10. **Chủ SP:** thời điểm → **Q-E1 ① (21/10): trước deploy (GĐ1)**. Căn giữa: PTA tự quyết (02 4.7 #4 — gói đồng ý).

#### AU-02 · Chữ quá nhỏ, IN HOA, phân cấp yếu
`A·D` · **P1** · đã kiểm (đo DOM, đếm lớp) · HT-01 · Mã: v1-nen A1, A2, A3, E2, E10, E11; B-07; FB-1-01; C09
1. **Ở đâu:** toàn web; nặng ở ô bảng, đầu cột, chip Kế hoạch Test, Lịch thi, khối Tổng quan, nhãn ô và tiêu đề khối trong panel, Hành trình, lưới Test lớp thường.
2. **Biểu hiện:** OV-15a hạ ô bảng 14 → 13 px, đầu cột 11 IN HOA → 12 (chữ thấy thấp ~21 %); khối Tổng quan số 16 → 13; ~69 % lớp chữ ≤ 12,5 px; lưới lớp thường 81 % ký tự ≤ 12,5 px; `text-[11px]` 86 chỗ / 40 tệp (hồ sơ lớp 108, Lịch Test 106, Quản trị 95 chỗ < 12 px); panel 4–7 cỡ chữ, nhãn 11,5 px đậm, tiêu đề khối IN HOA 11 px ở 9 tệp; h1 18/600 ≠ DESIGN 20/700; 4 panel khoảng dọc 0 px (Chấm Speaking 25/51 cặp chữ cách < 4 px).
3. **Bằng chứng:** `index.css:261, 265`; `KhoiCanQuyet.tsx:35-48`; `ChipKyNang.tsx:70`; `KhungPanel.tsx:121, 131, 196, 230`; `do-v4a-dom2.json`; ảnh `P-chamspeaking-gv9`; v4c mục 5 (lưới lớp thường tên + điểm 14 → 13 px).
4. **Nguyên nhân:** thang chữ quá nhỏ cho bảng dày tiếng Việt; mỗi PR tự đặt cỡ; không có phép kiểm cỡ.
5. **Ảnh hưởng:** khó đọc ở laptop và ở 125 % (chủ SP hay dùng); dấu chồng tiếng Việt dính; lời chủ SP "nhỏ hơn bản deploy" — đúng một phần.
6. **Phương án:** thang 12 · 13 · 14 · 15 · 17 · 22 · 28; ô bảng / chữ thường / nút 15, lưới điểm 14, nhãn / chip / đầu cột 13, tối thiểu 12, ô nhập 375 = 16; tiêu đề trang 22, khối / panel 17, mục 15 chữ thường; không IN HOA chữ Việt; line-height ≥ 1,5 chỗ dấu chồng; giữ Be Vietnam Pro + số Inter (đủ 134/134 ký tự). Bù chiều dài (+8–11 %) bằng bỏ khối trùng trong cùng PR. → 04 (Chữ) · 07 (NEN).
7. **Xuyên:** mọi vai; làm thanh trên cắt nặng hơn ở 1 280 px (AU-16).
8. **Luật:** không.
9. **Kiểm thử:** phép kiểm tĩnh chặn `text-[11px]`, cỡ ngoài thang, `uppercase` trong `modules` (trừ mã tuần); DOM: `td` < 13 px (1 440) / < 14 px (375) = lỗi; ảnh cặp bảng mẫu chữ tiếng Việt ở 100 % và 125 % so bản deploy cùng màn.
10. **Chủ SP:** không (PTA tự quyết 10.7-7); duyệt bảng mẫu chữ.

#### AU-03 · Màu điểm: 6 cách tô, 7 dáng cho một môn trượt
`A·D` · **P1** · đã kiểm (đo tương phản, mô phỏng mù màu) · HT-02 · Mã: v1-nen B1, B2, E7, E8, E9, E13, E14; V3A-8; V4C-09; A3-17; A3-23; FB-1-03; FB-3-01
1. **Ở đâu:** 19 nơi có điểm — lưới FT (L/R/S, W1/W2, W tổng, Kỳ vọng / Overall), hộp đang gõ, Mock lớn, HV & Lớp, hồ sơ lớp, Kết quả thi, hồ sơ HV (tab Học thuật), Hành trình, SkillBoard, lưới lớp thường, `MotKyNang` 375, Phân tích GV, Target, Tổng kết lớp đã kết thúc.
2. **Biểu hiện:** 6 cách tô (chỉ ký hiệu · số đỏ · chip nền · link xanh · % 3 mức · không tô); một môn trượt lớp thường 6 dáng (số đỏ trong ô, đỏ không ký hiệu, chip nền đỏ "3/4 môn đạt", "× 27/40", khung nền đỏ, chip nền **vàng** ở hồ sơ HV) + dáng 7 (cùng "70 %" Tổng kết vàng, lưới đỏ); R 5.0 < 5.5 là link xanh trông như đạt; KCK ✗ đỏ chỗ này, xám chỗ kia; ✓/✗ khi trước khi sau số, W1/W2 không dấu; ô trống 4 kiểu; xanh dương mang 5 nghĩa, vàng dùng cho trạng thái thường.
3. **Bằng chứng:** `chipSos.ts:82`; `index.css:50, 105`; `ScoreEntry.tsx:742, 778`; `LuoiThuong.tsx:599-611`; `StudentDetailPage.tsx:501, 600-608`; `LuoiFT.tsx:405`; `SkillBoard:677`; ảnh `v3-mon-truot-3-dang-mau`, `e-hv8-fou-qt-p1`, `b2-lop1-ketthuc-ql-p1`; đo: chế độ tối xanh ↔ đỏ với mù đỏ–lục ΔE 1,3; "bằng" ↔ link ΔE 2,4 (tối) / 0 (sáng); token `ok` sáng 4,38:1 < 4,5.
4. **Nguyên nhân:** mỗi màn tự dựng ô điểm, dùng chung token trạng thái (`ok/bad/warn`); `warn` trùng nghĩa SOS 1; hai hàm tô màu.
5. **Ảnh hưởng:** đọc nhầm đạt ↔ trượt (người mù màu, chế độ tối); Admin VP / TVV tra điểm thấy dưới kỳ vọng như đạt.
6. **Phương án:** tô chính con số + ký hiệu trước số; 3 token `--kq-vuot / --kq-bang / --kq-duoi` (tối `#86efac / #a5b4fc / #ff8282`, sáng `#166534 / #1e40af / #c81e1e`; ≥ 4,67:1 trên 9 nền; mù màu ΔE 1,3 → 11,4); "x / tổng" = "✗ 17/25", không % trong ô (% ở hộp chấm); Progress = chip SOS viền theo số môn trượt; KCK trung tính + chữ "KCK"; "Chưa đủ điểm" trung tính; ô đang gõ không tô; điểm không là link màu nhấn; một `ODiem` (biến thể `ti-le`); ô trống "—" = không áp dụng, để trống = chưa có. → 04 (Màu điểm).
7. **Xuyên:** mọi vai; 19 nơi; nối AU-01 (`ODiem`), AU-10 (dấu "đã lưu" không dùng màu xanh đạt).
8. **Luật:** không đổi ngưỡng (70 % lớp thường; so kỳ vọng FT; bằng kỳ vọng = ✓ — 19/10-M6); §20.17; 13/10-KCK.
9. **Kiểm thử:** phép kiểm tĩnh chặn lớp màu đỏ / lục trên số điểm ngoài `ODiem`; tương phản 9 nền + mô phỏng mù màu; "cùng giá trị → cùng lớp màu" (Tổng kết ↔ lưới); ảnh cặp một môn trượt ở 6 nơi.
10. **Chủ SP:** không — PTA tự quyết (02 4.7 #5 đảo "64 %" của mockup 2 khung 1a).

#### AU-04 · Lỗi số liệu làm SAI dữ liệu
`D` · **P0** (A5-01) / P1 · đã kiểm; A7-14, A7-15 đọc mã — cần bấm thử; A7-19 nguyên nhân là giả thuyết · HT-04 · Mã: A5-01, A5-02, A7-02, A1-02, A7-01, A7-14, A3-02, A7-09, CV-01, A7-10, A1-04, A7-05, A7-15, A7-19, X1 (phần)
1. **Ở đâu:** Phân tích 6 tab + Tutor (Theo tháng); Báo cáo (PA trong kỳ); Tổng quan + Công việc (Chờ duyệt); Đang SOS + Cần làm (đầu nhóm); panel Nhập điểm của việc; chuông.
2. **Biểu hiện:** chọn 09/2026 → nhãn và số 08/2026; "PA có kết quả trong kỳ" = 10 ở mọi kỳ (Hiệu quả PA cùng lọc ra 2); "Chờ duyệt 10" mà 12 thẻ, có BC / CP khi lọc Monbay bằng chi nhánh "nhớ" (ảnh v0-1); số không làm mới sau "Duyệt nhiều"; đầu nhóm "MB FT 101 · 2 em" (thật 7), "⚠ 8 việc" ↔ "⚠ 22" khi đổi 10 → 50 dòng; em SOS 3 rơi xuống trang 2; việc "2 bài" mở panel 3 em, con trỏ đứng sẵn ở em MT lịch sử (ảnh v0-3); 3 loại thông báo tự động (quá hạn chấm, Chốt lộ trình, Case chưa chốt PA) nằm "Để biết"; thẻ đã xử lý vẫn đếm; chuông trễ ≥ 5 phút.
3. **Bằng chứng:** `khoangThoiGian.ts:59-61, 76-80` (ảnh `a5-theo-thang-chon-09` → `a5-theo-thang-ra-08`); `metrics.ts:902-907`; `HopChoDuyet.tsx:50-51, 113, 133`, `OverviewPage.tsx:35-36`, `KhoiCanQuyet.tsx:92` (ảnh `bam-qt-mb-nho`); `StudentsPage.tsx:541`, `BangSos.tsx:129-143`, `BangCanLam.tsx:56-74`; `PanelViec.tsx:239-242`, `scoreDebt.ts:29`; `duongHoSo.ts:150-158` ↔ `thongBaoTuDong.ts:20, 101-117`; `signals.ts:140-143`.
4. **Nguyên nhân:** tháng suy từ thứ Hai đầu khoảng; chỉ số bỏ qua `from/to`; hộp duyệt chỉ đọc `cn` trên URL; thiếu invalidate; chia trang trước khi đếm; panel theo tuần không truyền `chiAttempt`; `LOAI_CAN_LAM` thiếu 3 loại; chuông đồng bộ theo chu kỳ; (giả thuyết) `case_signals` còn báo việc không có ở Công việc.
5. **Ảnh hưởng:** báo cáo tháng in sai; QT có thể duyệt thẻ chi nhánh khác; bỏ sót em SOS 3 (trái nguyên tắc "không em nào bị bỏ sót"); GV nhập nhầm em ngoài việc; GV bỏ qua "quá hạn chấm".
6. **Phương án — PR SL1 (GĐ1, không đổi bố cục):** URL ghi tháng / `Khoảng tuần` đọc link cũ `kieu=thang` theo tháng chứa thứ Năm tuần đầu; "PA trong kỳ" dùng hàm Hiệu quả PA; truyền `branchId` của trang vào hộp duyệt + dòng "n thẻ ở chi nhánh khác · Xem"; invalidate Tổng quan sau duyệt; đếm toàn bộ rồi mới chia trang, chia theo lớp, SOS 3 trước; panel chỉ em của việc + công tắc "Hiện cả lớp"; thêm 3 loại vào "Cần làm"; việc xong rời số đếm ngay (xoá theo `dedup_key`). → 07 (SL1).
7. **Xuyên:** QL, QT, CX (Phân tích), Head tutor (Tutor), GV (panel, chuông).
8. **Luật:** 11/10-UX "việc đã xong không nơi nào còn báo"; 9.1-3 (sửa trước deploy); 9.1-4.
9. **Kiểm thử:** phép kiểm 12 tháng 2026 (nhãn + khoảng); "số trên trang = số dòng panel"; "cùng chỉ số ở hai tab = cùng tập"; "số thẻ hiện + Xem thêm = số đầu nhóm"; API Đang SOS: tổng đầu nhóm không đổi theo cỡ trang; panel việc = đúng `emIds` của việc; demo riêng: Duyệt nhiều 2 thẻ → số đổi ngay; việc xong → chuông hết đếm ngay.
10. **Chủ SP:** không (9.1-3, 9.1-4 đã chốt); thời điểm gói GĐ1 → **Q-E1 ① (21/10)**.

#### AU-05 · Cùng tên khác số, khác phạm vi, khác định nghĩa
`A·D` · **P1** · đã kiểm; "chưa lịch Test 2 ↔ 3" không tái hiện (giả thuyết: hai ảnh chụp lúc dữ liệu khác) · HT-04 · Mã: X1 (phần), A1-03, A1-12, A1-13, A7-03, A7-04, A7-07, A7-08, A7-11, A7-12, A7-13, A7-17, A7-18, A3-08, A5-03, A5-04, A5-05, A5-36, A5-37, CV-14, CV-16
1. **Ở đâu:** Tổng quan (dải, khối), Học viên & Lớp, Báo cáo, Kết quả thi, Test + SOS, Lịch Test, Công việc, badge menu.
2. **Biểu hiện:** bài trễ chấm 58 · 4 GV / 53 · 3 GV / 28 · 3 GV (bảng 4 dòng); SOS 6/5/3 · 14 · 9 · 2/3/0 · 3/4/2; Case quá hạn ⚠5 / ⚠4, ⚠5 không thuộc 19; "Đạt" 5 ↔ 6, "Chưa đủ điểm" 8 ↔ 5; việc quá hạn 33 ↔ 40; Cần làm 51 = Tất cả 51; badge Công việc: GV = việc quá hạn, QL = thẻ mọi chi nhánh (QT 12 ↔ 10 trên trang); Mini Test hạn 15/09 trên dòng, 22/09 trong panel; Báo cáo kỳ cũ in số "tại 14/09"; khối Chốt lộ trình lớp FOU hiện khi đang xem FT.
3. **Bằng chứng:** a7 §2.1 (23 con số, ≥ 12 cặp cùng nhãn khác số, chỉ 5 cặp khớp); `tongQuan.ts:39-41, 75, 81-85` ↔ `tongQuanQl.ts:16-23`; `danhGia.ts:237-245`; `hocVienSos.ts:94`; `baoCao.ts:33-45, 54-70, 98`; `ketQuaThi.ts:82`; `tongHop.ts:33-40`; `StudentsPage.tsx:209-271`; `App.tsx:70-80, 150-158`; `mywork.ts:1072-1084`; ảnh chủ SP v0-1, v0-9; ảnh `a1-cong-tac-nua-trang`.
4. **Nguyên nhân:** mỗi màn tự đếm thay vì đọc một sổ chỉ số (`shared/domain/metrics.ts` có nhưng nhiều nơi không qua); API Tổng quan "gộp hai khung" còn khối dưới theo công tắc; 4 định nghĩa SOS, nhãn không nói; chấm chéo S không có `gvId`; hai nguồn hạn.
5. **Ảnh hưởng:** QL / QT không tin số; giao ban mất thời gian đối chiếu; quyết sai mức độ.
6. **Phương án — "một sổ số liệu":** bộ lọc trang = bộ lọc mọi số; một khái niệm = một chỉ số = một tên ("SOS hiện tại" ↔ "Lượt SOS trong kỳ"); số kèm đơn vị + phạm vi ("6 HV · hiện tại"); "53 bài quá hạn chấm: 39 của 3 GV · 14 chấm chéo"; một phạm vi Tất cả / FT / LT cho cả trang; badge một nghĩa (việc của tôi quá hạn + thẻ tôi phải quyết, theo chi nhánh đang chọn) hoặc ghi "mọi chi nhánh"; một nguồn hạn. → 05 (Một sổ số liệu) · 07 (SL2).
7. **Xuyên:** QL, QT, CX, GV; mọi trang có số.
8. **Luật:** 9.1-4 (một phạm vi, một định nghĩa SOS hiện tại); không đổi định nghĩa nghiệp vụ khác.
9. **Kiểm thử:** script gọi API GET theo vai, chạy lại bảng a7 §2.1 → 0 cặp lệch không nhãn; "dải = khối" cùng hàm; grep "Đạt" / "Chưa đủ điểm" một nghĩa; ảnh liền Tổng quan + Đang SOS + Báo cáo cùng chi nhánh (§5 #3).
10. **Chủ SP:** số mới "bài chấm trễ trong kỳ", bảng "Theo chi nhánh" → **Q-C2 ① (21/10): duyệt**; còn lại đã chốt (9.1-4).

#### AU-06 · Số bấm được: chết, quá nhỏ, gạch chấm 4 nghĩa, panel chỉ ra tên, sai ngữ cảnh
`A·D` · **P1** · đã kiểm · HT-04 · Mã: X2, A1-01, A5-07, A5-19, B-02, V3B-01, V3B-02, V3B-03, V3B-13, FB-1-04, FB-1-05, FB-3-07, FB-3-08, FB-3-09, v1-tq (P1, P6)
1. **Ở đâu:** Tổng quan (dải "HV cần chú ý", hàng "Cả Monbay", Lớp cần chú ý), Phân tích 6 tab + Báo cáo, Hồ sơ GV, Tutor, Công việc, mã lớp ở Học viên & Lớp, chip hồ sơ lớp, Tổng quan Admin VP.
2. **Biểu hiện:** 8 số ở dải + hàng tổng bấm chỉ "nháy", không panel (cả 375 — ảnh v1-1); vùng bấm 8×12 px (1 440), 24×36 px (375); Tổng quan QT 74/122 phần tử bấm < 24 px; gạch chấm mang 4 nghĩa (mở panel · đổi trang · giải thích tên cột · chú thích viết tắt) + 4 dáng bấm khác; số lớn ở Báo cáo không bấm, số nhỏ cạnh lại bấm; 50 chỉ số gần như mở cùng một panel chỉ tên + lớp; panel "7 bài quá hạn" mất tên GV; **9 chỗ đổi trang sai ngữ cảnh** (tên lớp ở Ý thức → tab mặc định · "Đề nghị dời chờ", "MT chưa xếp lịch" → Lịch Test / Kế hoạch không lọc · "Mở Lịch Test" ở Phân tích GV không lọc · "+n" hàng lớp → hồ sơ lớp chung · "n bài chờ chấm" → sai lượt · "n chờ duyệt", "Thiếu n" → đổi trang · "Việc tiếp" → trang Case).
3. **Bằng chứng:** `KhoiCanQuyet.tsx:34-36`, `TongQuanQl.tsx:54-56, 71`, `SoLieuO.tsx:20, 28-30`, `quayLai.ts:124-129`, `khoPanel.ts:16-20` (ảnh `a1-so-dai-bam-khong-mo`); `metrics.ts:191-205`; `StudentsPage.tsx:667-669`; `PhanTichGiaoVien.tsx:50, 187`; bảng 50 chỉ số ở V3B-02; ảnh `a5-panel-mat-ten-gv`, `bc-ql-pn-gv`.
4. **Nguyên nhân:** dải và hàng tổng chung khoá `?so-lieu=` → hai panel cùng mở, kho "một panel một lúc" đóng cả hai; `SoLieuO` đặt `p-0`; kiểu gạch chấm (16/10) thay ô viền của mockup; máy chủ chỉ trả tên + lớp (C26 chưa làm); link không mang bộ lọc.
5. **Ảnh hưởng:** thao tác chính của QL "bấm số → thấy đúng danh sách → làm" hỏng một nửa; Hướng dẫn QL dạy điều đang hỏng (`shared/huongDan/ql.ts:58`); SOS 2 của một lớp: 14 bấm + 2 đổi trang.
6. **Phương án:** GĐ1 vá khoá (`&vung=dai`) + vùng bấm ≥ 24 / 44 px. GĐ2 dáng **"ô số"** (`OSo`, viền 1 px): ô số = mở panel / mở tại chỗ · chữ "›" = đổi trang · ⓘ = giải thích · số chỉ để xem thì trơn · số 0 không bấm; bỏ dải "HV cần chú ý" (02 4.7 #2). Luật chọn panel **L1**: số trong kỳ → A thông tin cụ thể · số việc đang chờ → C thông tin + nút làm · số tổng → 0 chỉ xem · có trang chuyên → D đổi trang giữ đủ lọc. Mẫu `PanelChiSo`: tiêu đề = chỉ số · phạm vi · đúng số vừa bấm; ≤ 6 cột; một nút / dòng theo quyền; dòng xong ở lại tới khi đóng; panel trên URL. SOS 2: 14 → 7 bấm, 0 đổi trang; bài quá hạn của một GV 4–5 → 2. → 04 (Ô số) · 05 (Panel từ chỉ số).
7. **Xuyên:** QL, QT, CX, Admin VP, Head tutor; mọi trang có số.
8. **Luật:** C02, C26 (18/10); V3 II.1.1–1.3 (đã chốt); nút làm theo quyền (QL không có `score.edit`).
9. **Kiểm thử:** Playwright "bấm số dải → đúng 1 `[role=dialog]`"; quét không còn `decoration-dotted`; đo vùng bấm mọi `OSo` ≥ 24×24 (1 440) / 44×44 (375); "số tiêu đề panel = số dòng"; "link giữ lọc" (URL đích có lớp / tuần / tab / em); ảnh cặp mockup 3 khung 1d.
10. **Chủ SP:** không (12.9-12, 12.9-13 PTA tự quyết); mockup panel C cần duyệt.

#### AU-07 · Chuyển trang thừa, panel chồng panel, không làm tại chỗ
`A·D` · **P1** · đã kiểm · HT-05 · Mã: X3, V2B-5, A1-10, A5-15, FB-0-15, FB-1-06, FB-2-11 (nguyên tắc), 10.3, 11.1c
1. **Ở đâu (≥ 15 chỗ):** "Mở" thẻ duyệt → hồ sơ HV (Tổng quan, Công việc) trong khi "Mở Case" ngay dưới mở panel; 2 link ↗ trong panel Nhập điểm → Test; ↗ Lịch Test → `/nhap-diem`; cột "Việc tiếp theo" 3 hành vi; chip hồ sơ lớp sang 3 trang khác; Chốt lộ trình (Công việc đổi trang, Tổng quan mở panel); Xem nhận xét S → trang Mock; Lộ trình một em → bảng lớp + Modal; Quay lại đóng panel (Báo cáo, Phân tích GV, Tutor); chồng lớp: "Phân công…" mở ngăn Thông tin lớp đè panel, + Giao việc / Gia hạn / số "Lớp tôi dạy" mở ngăn phủ, hộp lịch → ⋯ → "Đổi tuần" → panel (3 lớp), Tutor hộp Thêm chồng hộp Gộp; 12 chỗ ở hồ sơ lớp "đã có trên trang mà vẫn mở panel / đổi trang".
2. **Biểu hiện:** rời ngữ cảnh, mất bộ lọc / vị trí cuộn; 2–4 lần đổi trang cho việc 1–2 bấm; panel chồng panel.
3. **Bằng chứng:** tài liệu chính X3 + bảng 12 chỗ ở 11.1c; `DauTrangLop.tsx:118-127`; `ClassRoster.tsx:265`; `BaoCao.tsx:45` (panel trong state, không URL); `TutorPage.tsx:199-202`; `HopKyNang.tsx:291-293`; `PanelViec.tsx:36-40, 254-264`; ảnh `a2-phan-cong-mo-ca-lop`, `a4-panel-chong-hop-lich`, `bam-cd-mo`.
4. **Nguyên nhân:** mỗi PR đổi một lối, lối cũ giữ (N7, N8); chưa có "hợp đồng panel"; dùng lại panel có sẵn sai mục đích; panel không nằm trên URL.
5. **Ảnh hưởng:** Cô Linh ~6–10 lần đổi trang mỗi buổi; nguy cơ đổi phân công cả lớp; Quay lại mất panel.
6. **Phương án:** **thang "làm tại chỗ" 0–5** thành luật toàn web — 0 chỉ xem · 1 một bấm + Hoàn tác 8–10 s · 2 hộp nhỏ neo tại nút / mở dưới hàng (bảng rộng) · 3 khung chi tiết bên phải (375 toàn màn + "‹ Quay lại") · 4 panel rộng thay khung phải · 5 trang riêng (chỉ để xem hồ sơ / cần không gian lớn); chọn bậc thấp nhất đủ dùng; một danh sách một kiểu mở; mở cái mới thì thay cái cũ; nút làm việc ≠ link "↗" xem hồ sơ; nội dung đã có trên trang → bậc 0–2 tại chỗ; không ngăn phủ chồng; panel trên URL (Quay lại mở lại đúng dòng). Form ngắn (Thêm PA…) mở dưới dòng ở bảng rộng, khung phải ở danh sách hẹp, cùng một form (02 X-39). 13 thao tác Tổng quan theo bậc: Duyệt 1; Từ chối, Gia hạn, Phân công, Xếp lịch MT kế 2; Thêm PA, Ghi nhận xét, Xác nhận Case, Bước tiếp 3; Chốt lộ trình 4; xem hồ sơ 5. → 05 (Thang làm tại chỗ) · 04.
7. **Xuyên:** mọi vai. Chỗ cụ thể: AU-29, AU-30, AU-35, AU-37, AU-40, AU-43, AU-44, AU-45, AU-47, AU-54, F-07.
8. **Luật:** CLAUDE.md 11/10-UX (xử lý tại chỗ, tách nút / link, không panel lồng panel, Quay lại đúng nguồn); V1 II.2.1; V2 II.1 ("tại sao phải tạo thêm panel khi đã có bảng").
9. **Kiểm thử:** Playwright cho 13 thao tác + 12 chỗ: pathname không đổi (trừ link "↗"), `[role=dialog]` ≤ 1; Quay lại sau khi mở panel → panel mở lại; đếm đổi trang theo kịch bản Cô Linh; phép kiểm tĩnh: không `navigate()` trong nút làm việc (danh sách miễn chỉ giảm).
10. **Chủ SP:** không (10.7-6 PTA tự quyết, theo MP III.5).

#### AU-08 · Hệ panel: 7 dáng, chữ díu, đầu panel cũ, tên panel ≠ tên việc
`A·D` · **P1** · đã kiểm (đo DOM 19 panel) · HT-05, HT-08 · Mã: V4A-03, V4A-04, CV-13, CV-30, V4C-13, X7 (phần panel), FB-4-19, FB-4-20
1. **Ở đâu:** 63 tệp `KhungPanel` (44 tệp còn đầu cũ 52 px), `KhungTaiCho` (chỉ Công việc), 6 modal, 9–10 popover, 15 tệp "← …"; 19 panel mở từ Công việc; panel hồ sơ HV (Chuyển lớp, KQ thi thật, Tạm dừng, Xoá, Đề xuất sửa — đầu 14 px, còn "Lịch sử" đầu v3 17 px).
2. **Biểu hiện:** 7 dáng ~11 biến thể; nhãn ô 11,5 px đậm 700, tiêu đề khối IN HOA 11 px; khoảng dọc 0 px ở 4 panel; 9/18 tiêu đề panel khác tên dòng (6 loại việc; "Thiếu PA" 3 tên); bối cảnh nằm DƯỚI nút (Thêm PA, Kết quả PA); Phối hợp SOS 29 nút; lịch sử chỉ có ở Case và Bước tiếp; 375 hai nút lùi chồng nhau.
3. **Bằng chứng:** `KhungPanel.tsx:118-136, 196, 230`; `KhuonViec.tsx:22-47`; `do-v4a-dom2.json`; ảnh `P-chamspeaking-gv9` (panel cao 1 949 px), `gv10-375-them-pa-p1`, `gv10-ban-giao`, `b2-hv47-lichsu` ↔ `b2-hv47-chuyenlop`, `gv7-mini`, `gv9-thieu-pa`.
4. **Nguyên nhân:** chưa có quy ước panel chung; đầu v3 mới phủ 19/63; panel mượn khối của nơi khác; không có hàm tên việc dùng chung.
5. **Ảnh hưởng:** chủ SP: "chữ díu vào nhau, thiếu phân cấp"; người dùng bấm nút trước khi đọc bối cảnh; không biết panel đang cho việc nào.
6. **Phương án:** panel 6 phần — Đầu (= tên việc + hạn) · Bối cảnh (trước form) · Cần làm · Lịch sử (gập) · Chân (1 nút chính + trạng thái lưu) · Sau lưu; một hàm `tenViec(it)` cho dòng và panel; bậc mở theo thang AU-07; không ngăn phủ trong khung, không chồng. **Không ép một mẫu cứng** (MP XI.4): panel nhập điểm, panel chỉ số, panel hồ sơ khác thân, chung đầu / chân / trạng thái / thang chữ 17 · 15 · 14 · 13. → 04 (Panel) · 05.
7. **Xuyên:** mọi vai, mọi trang có panel (Tổng quan, HV & Lớp, hồ sơ lớp, `PanelChiSo`).
8. **Luật:** giữ ô bắt buộc + ngưỡng ký tự (nhận xét MT ≥ 10, Kết quả PA ≥ 8…); lịch sử theo luật 3.
9. **Kiểm thử:** DOM: `[role=dialog]` ≤ 1 mọi lúc; Esc trả focus về chỗ mở; phép kiểm đơn vị: tên đầu panel = `tenViec(it)` cho mọi loại việc; cỡ chữ trong panel ∈ {12, 13, 14, 15, 17}; `KhungPanel` thiếu `dau` → lỗi build; ảnh cặp 5 panel tiêu biểu.
10. **Chủ SP:** không (PTA tự quyết); mẫu panel cần mockup.

#### AU-09 · Hover, đang chọn, focus, bàn phím
`A·D` · **P2** · đã kiểm (đo ΔL, thử phím) · HT-08 · Mã: v1-nen C1, E16; V4C-02, V4C-03, V4C-04; B-05; A5-33; A3-26; FB-1-10
1. **Ở đâu:** mọi bảng / danh sách; hàng em, hàng lớp, đầu khối Công việc / Lịch Test, chip lọc, tab, menu ⋯ hồ sơ HV, "Chỉnh lịch" hồ sơ Mock; 375 thanh dưới.
2. **Biểu hiện:** hover ΔL 2,8–4,5 (gần như không thấy), = 0 ở hàng em, hàng lớp, đầu khối, `.nut-loc`; hàng tổng ≈ hàng đang rê (ΔL 0,9); 29/35 loại hàng có hover mà không bấm được, còn `HangNhom`, `SoLieuO` bấm được mà không hover; "đang chọn" 5 dáng (một dáng trùng vòng focus); menu cũ: Enter mở nhưng focus ở nút, ↓ không chạy, Esc làm focus rơi về `body`; tab không đổi bằng ←/→; 34 nút ⋯ cùng đọc "Thao tác khác"; 375 focus bị thanh dưới che (WCAG 2.4.11); không trạng thái chạm `:active`.
3. **Bằng chứng:** `index.css:234-237, 268, 271, 274-277, 281, 289-292, 305, 311-317`; `ui/Menu.tsx:33-43, 53, 62` ↔ `ui/MenuDong.tsx:71-122`; `HangTab.tsx:34-50`; `BangHocVienLop.tsx:269`; `App.tsx:231, 273`; `ui/ui.tsx:540-543`; `trangthai.json`, `trangthai2.json` (v4c); ảnh chủ SP v1-5.
4. **Nguyên nhân:** `.row-hover` phủ trắng 4 %, nền `td` che hover của `tr`; mỗi thành phần tự làm dáng chọn; `MenuDong` làm sau nhưng chưa thay hết `Menu`; thiếu `scroll-padding`.
5. **Ảnh hưởng:** không biết cái gì bấm được, đang ở hàng nào; người dùng bàn phím (Sam) kẹt.
6. **Phương án:** hệ trạng thái — rê = phủ 8 % (tối) / 9 % (sáng) trên từng ô, ΔL ≥ 5,8 + tín hiệu thứ hai, **chỉ cho thứ bấm được**; bảng không bấm bỏ hover ("dò hàng" 3,5 % cho bảng ≥ 8 cột); **đang chọn = nền nhấn nhạt + vạch trái 3 px** (PTA quyết 21/10 #9), khác hẳn focus vòng 2 px; chọn một trong nhóm = nền + viền 1 px + ✓ trước chữ; vạch hàng nhóm đổi màu trung tính; một menu `MenuDong` (gỡ `Menu`, 3 nơi gọi); tab có ←/→; ⋯ có tên "Thao tác · {tên}"; `max-md:scroll-pb-20`; `:active` cho chạm. → 04 (Trạng thái tương tác).
7. **Xuyên:** mọi vai; khi đổi dáng phải chụp lại "Chỉ cho tôi" và sổ tay.
8. **Luật:** không.
9. **Kiểm thử:** đưa `v4c-trangthai.mjs` vào `scripts/`: mọi `cursor:pointer` có ΔL hover ≥ 5,8 ở hai chế độ, thứ không bấm ΔL 0; Playwright bàn phím: Enter mở menu → focus mục đầu, ↓ đổi mục, Esc → về nút ⋯; tab ←/→; Tab tới phần tử cuối trang ở 375 không bị che; cấm import `ui/Menu.tsx`; cấm `box-shadow inset var(--accent)` ngoài 2 lớp chuẩn; ảnh cặp khi rê.
10. **Chủ SP:** không. ⚑ "Đang chọn = nền + vạch trái 3 px" **đảo** X-19 / DESIGN.md 17/10 (viền khung 2 px, mockup 1 duyệt 18/10) — PTA tự quyết, chủ SP có quyền phủ quyết.

#### AU-10 · Trạng thái lưu / lỗi / rỗng / "không mở được" / hoàn tác
`D` · **P2** · đã kiểm mã; lưu thật và G1–G3 cần bấm thử (E) · Mã: V4C-10, V4C-11, A1-20 (phần rỗng), v4c P3 (401 + mất mạng), G1–G3 (xem AU-46)
1. **Ở đâu:** panel, lưới điểm, Lịch thi, Hồ sơ cá nhân; mọi trang khi id sai / không quyền / mất mạng; trang đầu TVV, Admin VP, Head tutor khi rỗng.
2. **Biểu hiện:** 3 cách báo lưu (`SaveIndicator` chỉ 5 module dùng · "✓" 11 px xanh lá trùng ✓ đạt · chữ trên nút / toast); đóng panel đang sửa dùng `window.confirm`; "Không tìm thấy" là chữ đỏ + "Thử lại" vô ích, không lối về; đường sai / không quyền → về trang đầu **im lặng**; Head tutor gõ `/hoc-vien` thấy khung rỗng; lỗi tải Công việc → cả trang chỉ một câu đỏ; ô số 0 không câu giải thích; 401 + mất mạng cùng lúc → 2 nút Thử lại, 2 câu trái nhau; "Hoàn tác 10 s" bị thay khi tự sang việc kế (AU-46); "Thôi học" lưu ngay (AU-52).
3. **Bằng chứng:** `ui/SaveState.tsx:1-15`; `cham/LuoiFT.tsx:484-490`; `ui/KhungPanel.tsx:70, 107`; `App.tsx:239, 264`; `WelcomePage.tsx:26-35, 121-126`; `HoTroHocVienTab.tsx:290`; ảnh `b1-hv-khongco`, `b1-404-gv10`, `b1-ht-hv`, `b1-het401`, `L-gv7-loi`. Mẫu tốt sẵn có: trang ngoài phạm vi (`b1-gv10-lop-cn-khac`), Skeleton, dải Mất kết nối, tải lại khi lỗi vẫn giữ dữ liệu.
4. **Nguyên nhân:** không có hợp đồng trạng thái chung; route `*` chuyển hướng im lặng.
5. **Ảnh hưởng:** GV không chắc đã lưu; người dùng kẹt ở trang lỗi; người mới thấy số 0 không biết làm gì.
6. **Phương án:** đang lưu / đã lưu (dấu xám, ẩn sau 2 s) / lỗi (viền đỏ + "Lưu lại", giữ chữ) / nháp — dòng trạng thái cạnh nút chính; `ConfirmDialog` thay `window.confirm` (xác nhận chỉ khi hậu quả lớn, nêu đúng đối tượng); mẫu "Trang không mở được" (lý do + 1 nút về; "Thử lại" chỉ khi lỗi mạng / 5xx), `*` dùng mẫu này, `/hoc-vien` chặn theo quyền; Hoàn tác 8–10 s cho thao tác đảo được (Duyệt — X-47, Thôi học), **trừ** lần xử lý vi phạm đã lưu (X-51); câu rỗng có hướng ("Không có việc hôm nay · Tuần sau: 5 lượt W1 OCT ›"); lỗi theo khối, không cả trang. → 04 (Trạng thái).
7. **Xuyên:** mọi vai.
8. **Luật:** CLAUDE.md "không báo xong khi chưa lưu, không mất chữ, xác nhận chỉ khi hậu quả lớn"; L3 (sửa sau lưu cần thấy trạng thái + lịch sử).
9. **Kiểm thử:** sân mẫu 4 trạng thái lưu; Playwright chặn request để giả lỗi → ô giữ chữ + "Lưu lại"; id sai → có nút về, không "Thử lại"; tắt mạng + 401 → một thông báo; ảnh lưới chấm trên điện thoại mạng yếu (§5 #13).
10. **Chủ SP:** không.

#### AU-11 · Bộ lọc thời gian 14 chỗ 5 dáng; ô nhập tuần 4 dáng
`A·D` · **P1** · đã kiểm · HT-06 · Mã: V2A-01, V3B-08, A5-13, V4C-05, TST-22, FB-2-01, FB-3-13, FB-4-15, 9.2-19
1. **Ở đâu:** bộ lọc: Phân tích 6 tab, Tutor, Bộ lọc thêm, Đang SOS (+ TVV / CX), Lịch thi, Lịch / Chấm Test, `/nhap-diem`, Báo cáo đơn vị, 2 panel Xuất, Góp ý tuần, KQ thi thật. Ô NHẬP tuần: Thêm HV, Tạo lớp, Chuyển lớp, Chuyển tiếp lớp, Báo cáo đơn vị, Tạm dừng, Lịch Test.
2. **Biểu hiện:** 5 dáng, 9 chế độ; đổi khoảng ở Phân tích 5 thao tác; hộp 360 px che "Tùy chọn" (418 px trong 334 px); chip "Mọi lúc ✕" sáng đúng lúc đang lọc (nói ngược); mọi tab mặc định 2 tuần → Hiệu quả PA, Tutor gần trống; Phân tích GV > 13 tuần báo lỗi (AU-51); Lịch thi 12 nút tháng (F-05); ô nhập tuần 4 dáng: `ONgay` (gợi ý cắt "W4 SEP hoặc d"), stepper ‹ W3 SEP ›, hàng chip "Ngay hôm nay · W4 SEP · W1 OCT…" (2 dòng ở 375), `ChonTuan`; mã tuần 3 dạng (W2 SEP · W2 SEP/2026 · W2 SEP 2026), "W3 JAN 20…" bị cắt.
3. **Bằng chứng:** bảng 14 chỗ (V2A-01); `BoChonThoiGian.tsx:57-60`; `khoangThoiGian.ts:17-18, 59-61`; `StudentsPage.tsx:457, 460`; `ChuyenLopPanel.tsx:83-99`; `TransitionPanel.tsx:497-504`; `ui/ChonNgay.tsx:40`; `QuickReport.tsx:476-491`; ảnh `v2-loc-them-tuan-thi-cua-ket-qua`, `b2-hvl-themhv`, `b2-hv47-chuyenlop`, `lt-qt-dan-p1`.
4. **Nguyên nhân:** C29 chốt bộ chọn 4 kiểu, rồi mỗi PR thêm bộ chọn riêng; luật 06/10 mới áp ô ngày, chưa áp ô tuần; không có thành phần chung, không hàm định dạng tuần chung.
5. **Ảnh hưởng:** QL đổi khoảng 5 thao tác; Head tutor mở trang rỗng; người dùng học 5 dáng; 375 hộp phủ bảng.
6. **Phương án:** một **`Khoảng tuần`**: `Thời gian ‹ [W1 SEP ▾] → [W2 SEP ▾] › Mặc định`, đổi là áp dụng, ô gõ được + lịch tuần (`ONgay kieu="tuan"`), khoảng trên URL, 375 hai ô 44 px; dáng một tuần (Lịch Test, Góp ý tuần) = cùng thành phần khoá một ô. **"Toàn bộ" chỉ ở 6 tab Phân tích** (PTA #7): Báo cáo 2 tuần hoàn chỉnh trước · Test + SOS 8 · Mock 4 gồm tuần này · Thi thật, Vấn đề & PA: Toàn bộ · Phân tích GV 4 (trần 13 — "Toàn bộ" chỉ khi nâng trần, đo tốc độ trước) · Ý thức 4. **Tutor + panel tutor:** Khoảng tuần mặc định 4 tuần gồm tuần này · **panel Xuất:** khoảng của trang gọi · **Bộ lọc thêm › Thời gian:** để trống = không lọc (✕ để bỏ), không phải chế độ "Toàn bộ". **Bỏ hàng nút "Tuần này · Tuần trước · 2 tuần trước"** trong lịch (PTA #8, luật 06/10) — ‹ › và "Mặc định" đủ. Giữ ngoại lệ: Lịch thi lọc theo tháng dự kiến; ô NHẬP ngày giữ `ONgay`; cửa sổ 7 / 30 / 60 ngày, "Sắp thi 6 tuần" là định nghĩa chỉ số; Đang SOS không lọc thời gian (9.1-4). Ô NHẬP tuần: một `ONgay kieu="tuan"`, điền sẵn tuần đề xuất, "Ngay hôm nay" là một lựa chọn trong lịch (giữ nghĩa OV-13l). Một hàm định dạng tuần (năm chỉ khi khác năm — 02 4.7 #1). → 04 (Khoảng tuần) · 05.
7. **Xuyên:** QL, QT, CX, Head tutor, GVCN (Chuyển lớp), Admin VP.
8. **Luật:** V2 I.1, V3 II.5, MP III.8 ("Toàn bộ" riêng Phân tích), 06/10-NGAY, 30/09 (mã tuần), C24, C29 "giữ khoảng khi đổi tab".
9. **Kiểm thử:** phép kiểm 12 tháng 2026 + link cũ `kieu=thang`; grep không còn bộ chọn ngoài `Khoảng tuần` / `ONgay`; `scrollWidth ≤ clientWidth` ở 3 panel có ô tuần; Playwright: đổi khoảng → URL `tu`, `den`; Quay lại giữ; Tutor mặc định có dòng (với SEED-UX); ảnh cặp mockup `Khoảng tuần` 1 440 + 375.
10. **Chủ SP:** không (đã chốt; mặc định PTA tự quyết). V4C hỏi "hàng chip tuần có tính là hàng nút bị cấm 06/10?" → PTA hiểu là có, không hỏi lại.

#### AU-12 · Hộp "bấm ra ngoài": bộ chọn tuần tự đóng + 15 bản tự viết
`A·D` · **P1** · đã kiểm (mã + tái hiện 6/6) · HT-06 · Mã: V3B-09, FB-3-14
1. **Ở đâu:** hộp "Khoảng thời gian" ở Phân tích (6 tab, 1 440 + 375), Tutor, panel một tutor, Bộ lọc thêm. Gốc chung: 15 hộp tự viết luật "bấm ra ngoài thì đóng" — `ChipSos`, `MenuDong`, `Menu`, `LichNho`, `ScoreEntry`, `PeoplePicker`, `NutLuat`, `ChonPhuTrach`, `BoChonThoiGian`, `HopNhapDiem`, `MissingBadge`, `TimLop`, `TimKeHoach`, `HopKyNang`, `Header`.
2. **Biểu hiện:** mở lịch, bấm ‹ › hoặc một ngày → cả hộp đóng, tuần không đổi; chỉ còn cách gõ "W1 AUG". Không bị: 2 panel xuất Test, `HopKyNang`, bộ chọn một tuần.
3. **Bằng chứng:** `ui/LichNho.tsx:208-211` (lịch vẽ qua portal) + `phanTich/BoChonThoiGian.tsx:25-33` (đóng khi `mousedown` ngoài cây DOM của hộp); `tg-ket-qua.json`; ảnh `v3-bo-chon-lich-truoc-khi-bam` → `v3-bo-chon-tu-dong-sau-khi-bam`.
4. **Nguyên nhân:** lịch ở ngoài cây DOM của hộp → mọi cú bấm trong lịch bị tính là "bấm ngoài"; mỗi hộp một luật đóng.
5. **Ảnh hưởng:** gần như không chọn được tuần bằng chuột ở 4 chỗ; hộp nào sau này chứa ô ngày cũng có thể dính.
6. **Phương án:** GĐ1 vá (bỏ qua bấm trong lịch con, như `HopKyNang`) + gom 15 bản về **một hook dùng chung biết portal**; M0 thay hẳn bằng `Khoảng tuần` (không hộp nổi). → 07 (SL1, NEN).
7. **Xuyên:** QL, QT, CX, Head tutor; mọi hộp có ô ngày.
8. **Luật:** không.
9. **Kiểm thử:** Playwright cho mọi hộp có ô ngày: mở lịch → bấm ‹ → hộp cha còn mở, tuần đổi; phép kiểm tĩnh: không bắt `mousedown` "bấm ra ngoài" ngoài hook chung.
10. **Chủ SP:** thời điểm → **Q-E1 ① (21/10): GĐ1**.

#### AU-13 · Thuật ngữ: Thi ↔ Test, một khái niệm nhiều tên, ô trống, chữ dài, trợ giúp sai
`A·D` · **P1** (Thi / Test) / P2–P3 (tên khác) · đã kiểm (đếm script ± 10 %) · HT-07 · Mã: V2A-02, V2A-03, X8, X10, A7-20…A7-28, A5-12, B-08, FB-2-02, FB-2-05, FB-0-11
1. **Ở đâu:** toàn web: web, `shared`, Hướng dẫn, máy chủ (thông báo, tên việc, tệp xuất), bản EN.
2. **Biểu hiện:** 549 chuỗi có "thi", ~295 dùng "thi" cho Test ("Tuần thi" 79, "Đã thi" của MT 46, "phần thi" 43, "Không dự thi" 23, "Dời lịch thi" 20…); "Đã thi", "Lịch thi" hai nghĩa trên cùng màn (thẻ duyệt "Lịch thi" = dời MT); tab "Kết quả thi" gồm Mock + thi thật; 9 tên cho "bài quá hạn chưa có điểm"; "Chờ duyệt" 2 nghĩa 3 đơn vị; "Đạt" 2 nghĩa; "Kết quả" 5 nghĩa; "Cần chú ý" 4 định nghĩa; "Người giữ" ↔ "Người phụ trách"; "Mở" cho cả làm lẫn xem; "✕" hai nghĩa; mốc giờ 3 kiểu; ô trống "— / – / chưa có / không có / 0 / trống"; "—", "/" tương phản 1,9–2,5:1; "Tuần thi của kết quả"; "Ghi chú họp"; ~20 cụm thiếu tự nhiên ("Mọi lúc ✕", "Chọn khoảng", "Lịch hiện tại", "Kết quả đến nay", "−0.5 · Không đạt"…); ⓘ Kế hoạch Test 4 đoạn nói sai màu (AU-40); câu giải thích dưới nút; Hướng dẫn QL dạy "bấm số mở danh sách" (đang chết).
3. **Bằng chứng:** `v2a-thi-loai.tsv`; `ScoreEntry.tsx:325`; `thaoTacMt.ts:14`; `dieuHuong.ts:160`; `TongQuanQl.tsx:202-217`; `BangCanLam.tsx:28, 119`; `TheYeuCau.tsx:267`; `HopChoDuyet.tsx:168`; `phanTichGv.ts:78`; `index.css:85`; `shared/huongDan/ql.ts:58, 62`; a7 §2.2 (15 khái niệm 2–9 tên); nguồn mâu thuẫn: `THUAT_NGU_2026-10-01.md` C-028 / C-035 / C-036, Rulebook §17.7, mockup 4 / 5.
4. **Nguyên nhân:** chữ viết rải từng PR; thuật ngữ chốt không có phép kiểm; tài liệu nguồn dùng "thi" cho Test.
5. **Ảnh hưởng:** GV, TVV, phụ huynh (tệp xuất) nhầm thi thật ↔ Test; người mới không hiểu; hai nơi cùng việc khác tên.
6. **Phương án:** Thi = thi thật; còn lại "Test" (danh từ) / "làm bài" ("Tuần Test", "Đã làm bài", "Không làm bài", "Huỷ kỹ năng", "Dời lịch Test", "Test lại"); tab "Kết quả Test" (Mock Test · Thi thật); **giữ** "Dự kiến thi", "Ngày thi", "Kết quả thi thật", "Sắp thi", "Lịch thi" (góc HV & Lớp), "Học viên & Lớp"; một tên mỗi khái niệm theo a7 §2.2 ("bài quá hạn chấm", "Người phụ trách", "Chờ bạn duyệt", "SOS hiện tại" / "Lượt SOS trong kỳ", "Chưa đủ điểm"…); ô trống: "—" = không áp dụng, để trống = chưa có, tương phản ≥ 4,5:1; "Mở" → động từ việc, "Tên đích ›" để xem; bỏ câu dưới nút (ⓘ ngắn); chú giải sinh từ bảng màu thật; Hướng dẫn sửa cùng PR màn. Sửa nguồn trước (thuật ngữ, Rulebook, mockup 4 / 5) rồi CHU-THI (GĐ1, chỉ chữ). → 04 (Từ điển chữ) · 07 (CHU-THI, CHU).
7. **Xuyên:** mọi vai; tệp xuất, chuông, sổ tay PDF, EN.
8. **Luật:** V2 I.5, I.2, I.6.2 (đã chốt); MP 0 "thuật ngữ đã chốt giữ nguyên"; chỉ đổi chữ, không đổi luật.
9. **Kiểm thử:** từ điển chữ + phép kiểm regex chặn chữ cũ trong tệp Test / Công việc / xuất (danh sách miễn chỉ giảm); grep "Tuần thi của kết quả", "Ghi chú họp", "Người giữ" = 0; tương phản "—" ≥ 4,5:1; ảnh cặp 3 màn có chữ đổi.
10. **Chủ SP:** không (đã chốt; chữ cụ thể PTA tự quyết — 02 4.7 #7).

#### AU-14 · Khoá cứng sau lưu, khôi phục, lịch sử — luật 3 đang lệch
`A·D` · **P1** · đã kiểm mã + tái hiện trên demo (chưa bấm Lưu) · HT-13 · Mã: V4B-04, V4B-05, V4B-06, FB-4-11, FB-4-16, FB-4-25, FB-4-26, FB-4-27, R11, ảnh v4-4
1. **Ở đâu:** lưới Test lớp thường + FT sau "đợt hoàn tất" (Lịch Test, hồ sơ lớp, `/nhap-diem`, Công việc); MT cũ; lớp đã kết thúc; Huỷ điểm; Huỷ kỹ năng; Tutor; Kết quả PA khi Case đã xong; lịch sử Ý thức.
2. **Biểu hiện:** dòng "Đã hoàn tất": ⋯ chỉ còn "Lịch sử", FT hiện "nhờ Quản lý hiệu chỉnh", API trả 403 — GV **không sửa được điểm Progress Test đã lưu** (bản chính, ảnh v4-4); MT cũ khoá 7 ngày sau lần nhập cuối; Huỷ điểm không khôi phục được, mất cả nhận xét; Huỷ kỹ năng xoá luôn điểm; nút "Xếp lại bài vắng" hiện cho GVCN FT mà trả 403; Tutor chỉ sửa trong 24 h; lần xử lý Ý thức và Phối hợp SOS chỉ nằm trong `audit_logs`, web không xem được.
3. **Bằng chứng:** `server/src/normal/regular.ts:631-643` (R11, 23/09) — **cùng gốc phải gỡ đủ:** `fasttrack/hoanTat.ts:31-49, 112-130`, `attempts.ts:1415-1419, 2033-2044`, `regular.ts:1259-1267`, `shared/domain/thaoTacMt.ts:61`, `LuoiThuong.tsx:462-468`, `ScoreEntry.tsx:118`; định nghĩa hoàn tất `shared/domain/keHoachTest.ts:63-81`; Huỷ điểm `keHoachTest.ts:646-657`, `attempts.ts:2256-2262`; Huỷ kỹ năng `attempts.ts:1377-1390`; `skillSchedule.ts:881-882`; `thaoTacMt.ts:62` ↔ `permissions.ts:432-436`; `cases.ts:3769-3771`; `tutors/trang.ts:327`; `xuLy.ts:321-340`; tái hiện demo v4b-01 (GV 20, `/test/lich?classId=28&loai=thuong`), v4b-02, v4b-16; Rulebook dòng 564, 589, 600, 723.
4. **Nguyên nhân (đã kiểm):** R11 coi đợt là hoàn tất khi mọi kỹ năng có điểm + đã qua CN tuần muộn nhất → GV bị khoá chỉ vì GV môn khác đã nhập xong; mỗi PR thêm một chặn cho một ca, không rà lại theo luật 3; Huỷ điểm đi chung đường lưu điểm.
5. **Ảnh hưởng:** GV nhắn QL nhờ sửa, QL 6–8 bấm; điểm sai tồn tại; huỷ nhầm là mất kết quả + nhận xét.
6. **Phương án (bảng 29 khoá của v4b — chi tiết ở 05):** **GỠ / SỬA 9** (sau Q-B1 ① 21/10; ban đầu 11) — H01 R11 · H02 MT cũ khoá 7 ngày · (H03 lớp đã kết thúc — **giữ** theo Q-B1 ① 21/10) · H04 Huỷ điểm → khôi phục được · H05 Huỷ kỹ năng cất điểm · H08 kỹ năng đã huỷ đổi tuần thẳng · H14 "-" ghi muộn (F-02) · H15 nút Xếp lại theo quyền thật · H20 xem lịch sử Ý thức · (H21 sửa chữ KQ PA khi Case xong — **giữ** theo Q-B1 ①) · H28 Tutor sửa sau 24 h → nay **GỠ 9**, giữ 17. **ĐẢO 1** — H16 GVCN xoá thẳng lần xử lý → phải qua QL duyệt (F-03). **GIỮ 15** — vd không xoá lịch đã có điểm, có thẻ dời đang chờ, "-" ở "Đã huỷ · vắng 2 lần" chỉ QL gỡ (MT cũ huỷ do "-": Hoàn tác 10 s + người có quyền sửa ô khôi phục — 21/10), chưa tới tuần thi, em đã Lưu trữ, lệnh chuyển lớp đã thi hành, đổi chương trình lớp, Target / lộ trình qua QL duyệt, toàn vẹn Case / PA. GVBM đúng ô sửa được mọi lúc; chip "Đã hoàn tất" → "Đủ điểm"; một component Lịch sử (C22: trước → sau, ai, lúc, nguồn, lý do); Khôi phục điểm 1 bấm qua `saveScore`; Huỷ điểm không xoá nhận xét. Bước: nhắn QL + QL 6–8 bấm → GV 2–3 bấm. → 05 (Bảng khoá) · 07.
7. **Xuyên:** GVBM, GVCN, QL, Admin VP, Tutor; Test, hồ sơ lớp, hồ sơ MT, Ý thức, Case.
8. **Luật:** **L3** (lệch → sửa, không hỏi lại); T22; 13/10-SUA (5 khoá giữ); giữ duyệt bắt buộc (Target, lộ trình, PA đã duyệt).
9. **Kiểm thử:** mỗi khoá GỠ có test API: GV đúng ô → 200 + dòng nhật ký; GV khác môn → 403; mỗi khoá GIỮ có test chặn đúng câu báo; Huỷ → Khôi phục trả nguyên điểm + nhận xét; khôi phục khi đã có điểm mới → 400; bấm thử GV 20 ở `/test/lich?classId=28&loai=thuong`: ⋯ có "Sửa"; ảnh cặp sau deploy như 5.webp (§5 #14).
10. **Chủ SP (21/10):** **Q-B1 ①** giữ khoá đóng hồ sơ (lớp đã kết thúc, Lưu trữ, H21) · **Q-B2 ①** sửa phần đã duyệt → duyệt lại. H28 nới (4.7 A19 — gói đồng ý).

#### AU-15 · Trang quá dài, khối trùng, nhãn nhiễu
`D` · **P1** · đã kiểm (đo chiều cao) · HT-22 · Mã: X4, X5, B-03, B-04, FB-0-04, FB-0-05, FB-0-13
1. **Ở đâu:** hồ sơ lớp, Tổng quan, Lịch Test, Công việc 375, Học viên & Lớp, Kế hoạch Test, Phối hợp SOS, Hành trình.
2. **Biểu hiện:** hồ sơ lớp 4 800 px (375: 10 640 px ≈ 13 màn; khối điểm 2 822 px nối dưới mọi tab); Tổng quan 2 263 / 5 741 px; Lịch Test QT 2 172 px, mở khối 3 → 5 476; Công việc 375 (QT) 4 191; HV & Lớp mở một lớp ở 375: 10 830; 93–95 phần tử bấm được ở khung nhìn đầu HV & Lớp, thanh phân trang vẽ hai lần. Nhãn ở gần mọi hàng nên mất nghĩa: "Thiếu n" 46/51, "vào muộn" 20/33, "/2026" 108 lần, "L R W S" ~99 chip, "Nhận xét" 32 nút + "Điền cả cột" 8, "Nếu duyệt" mọi thẻ. Khối trùng: Cần làm = Công việc; lưới MT cuối hồ sơ lớp = panel Nhập điểm; 3 ô Lịch Test = đầu khối; chuông = thẻ Chờ duyệt; "Tạo bài…" = "Xếp cả lớp…"; 4 dòng Bàn giao một lớp.
3. **Bằng chứng:** B-03, B-04 (`StudentsPage.tsx:494, 525`); tài liệu chính X4, X5; ảnh chủ SP v0-4, v0-5, v0-6, v0-12a, v0-12b.
4. **Nguyên nhân:** thêm cái mới không bỏ cái cũ (kế hoạch không có danh sách BỎ); mockup vẽ 8–10 hàng; "Thiếu thông tin" gồm trường được phép trống; không ai sở hữu độ dài trang.
5. **Ảnh hưởng:** Chị Vy không thấy việc gấp; Cô Linh vuốt 13 màn; tải nhận thức 5–6/8.
6. **Phương án:** ngân sách mỗi màn (trang làm việc 1 440 ≤ ~2 màn, 375 ≤ ~4 màn ở trạng thái mặc định); hàng em 1–2 dòng; nhãn chỉ khi khác thường; bảng truy vết có dòng **BỎ**; bỏ khối trùng khi có lối thay thế (lưới MT giữ nhưng gập — V2 II.1). Cụ thể ở AU-25, AU-29, AU-37, AU-40. → 04 (Ngân sách) · 06 · 07 (Q1).
7. **Xuyên:** mọi vai; nặng nhất GV dùng điện thoại.
8. **Luật:** lưới MT gập, không bỏ (đã chốt).
9. **Kiểm thử:** `do-khung` mới đo chiều cao trang mặc định 1 440 / 375 = tiêu chí nghiệm thu; phần tử bấm được ở khung nhìn đầu ≤ 30; grep nhãn lặp trên trang.
10. **Chủ SP:** không.

#### AU-16 · Khung trang, thanh trên, điều hướng, tiêu đề
`A·D` · **P1** (A1-05) / P2 · đã kiểm; laptop thật cần ảnh · HT-17 · Mã: X6, A1-05, A1-07, A1-08, A5-09, CV-33, A3-31, A7-29, v1-nen D, E15, FB-1-02
1. **Ở đâu:** thanh trên, thanh dưới 375, đầu mọi trang (Tổng quan 3 hàng, Phân tích 4 hàng), ô Chi nhánh, công tắc chương trình.
2. **Biểu hiện:** thứ tự menu đang là Tổng quan · HV & Lớp · Test · Phân tích · Công việc · Tutor (đã chốt đổi); 6 mục cần 587 px: 1 280 px cắt "Tutor", 1 100 px mất số Công việc, 800 px chỉ còn 4 mục; 375 thanh dưới 6 nút, Head tutor 1 nút; tiêu đề trang ≠ tên menu (AU-13); ô Chi nhánh kiểu form nhãn trên, xa ~1 200 px; công tắc chương trình 4 kiểu; **không có dải lọc dính chung** (C10 đã chốt — không PR nào làm); "+ Lớp mới" không lấy chi nhánh đang xem; logo không bấm (AU-21); 7 GET khung mỗi trang, GET trùng.
3. **Bằng chứng:** `App.tsx:112, 208, 273`; `index.css:139`; `dieuHuong.ts:45-55`; `PhanTichPage.tsx:24-29`; ảnh `f-top-1280-qt`, `f-top-1100-qt`, `f-top-800` (`scrollW=587 clientW=570 / 475 / 332`), `a1-thanh-tren-1280-cat-tutor`, `hvl-lop-moi`; a7 bảng 2.3(b); ảnh chủ SP v0-1, v0-9.
4. **Nguyên nhân:** N1 (dải lọc C10 rơi khỏi kế hoạch), N7 (không ai sở hữu đầu trang); dùng lại `BranchFilter` nhãn trên; menu cuộn ngang, không gom.
5. **Ảnh hưởng:** QL / QT trên laptop 13–14" tưởng mất chức năng; học lại chỗ lọc ở mỗi trang; QT không biết đang xem chi nhánh nào; mất ~110 px trước nội dung.
6. **Phương án:** một thành phần **khung trang**: hàng 1 = Tiêu đề (= tên menu) · Chi nhánh ▾ (nút gọn) · Chương trình (Tất cả | FT n lớp | LT n lớp) · Thời gian (nếu có) · Dữ liệu đến · nút chính; dính khi cuộn; chip đang lọc có ✕ + "Bỏ lọc". Menu đúng thứ tự đã chốt **Tổng quan → Học viên & Lớp → Test → Công việc → Phân tích → Tutor** (giữ tên "Học viên & Lớp" — X-38; GV vẫn vào thẳng Công việc — X-46); < 1 440 px ô tìm thành kính lúp; thiếu chỗ gom "Thêm ▾"; 375 ≤ 5 nút (QT / QL gom Phân tích + Tutor vào "Thêm"); ẩn thanh dưới khi ≤ 1 mục; mỗi GET một lần. → 04 (Khung trang) · 07 (KHUNG-LOI, M0).
7. **Xuyên:** mọi vai, mọi trang.
8. **Luật:** V1 I.2 (thứ tự menu); C10, C11, C18; 19/10-GV.
9. **Kiểm thử:** `do-khung` mới ở 800 / 1 100 / 1 280 / 1 440 / 375: không mục nào bị cắt (`scrollWidth ≤ clientWidth`), số Công việc thấy được; thanh dưới ≤ 5; sửa phép kiểm thứ tự menu (`prOv15e.tests:84`, `khung.tests:50`); h1 = nhãn menu; ảnh cặp đầu trang với mockup 1 khung 2a / 2b + mockup 3.
10. **Chủ SP:** không (đã chốt); xin ảnh laptop thật (§5 #1).

#### AU-17 · Việc hiện cho sai người; giao diện không theo vai
`D` · **P1** · đã kiểm · HT-19 · Mã: X9, CV-06, CV-09, A3-30, A5-28, V4B-03
1. **Ở đâu:** Công việc QL / QT ("Của tôi", "Việc quản lý"); HV & Lớp (chip của GV); Báo cáo (TVV / CX); việc nhiều người cùng "của tôi" (Cần làm TVV, Bước tiếp, KQ thi thật).
2. **Biểu hiện:** việc của chính QL (Chốt lộ trình, Bước tiếp, Phân công) bị tính "Của GV", nằm nhóm gập cuối; "Xong hết hôm nay ✓" ngay dưới "Chờ bạn duyệt 10"; QL / QT vào Công việc → panel tự mở lưới điểm của GV, trang tự cuộn ~470–600 px khỏi Chờ duyệt; GV thấy chip "Chờ duyệt 6", "Thiếu thông tin 39"; GVCN thấy "cần xếp lớp tiếp"; TVV / CX thấy tên GV ở bảng "Quá hạn theo GV"; một việc `mine` với nhiều người (Chọn bước tiếp = QL + QT + mọi TVV; KQ thi thật = GVCN + TVV); chữ "Hạn 4 tuần" sai (hạn thật = ngày thi + 7; **21/10: KQ thi thật thành việc TVV, không hạn**).
3. **Bằng chứng:** `congViec.ts:292`; `HoTroHocVienTab.tsx:235-240`; `mywork.ts:221-224`; `buocTiep.ts:367-394`; `thiThat.ts:149-188`; `StudentsPage.tsx:247`; `hocVienLop.ts:345-349`; ảnh `a2-ql-tu-mo-luoi-gv`, `ql2-cua-toi-p1`, `v2-ql2-dau`, `a5-cx-pt`.
4. **Nguyên nhân:** "của tôi" chỉ tính theo người phụ trách; bố cục hàng đợi GV áp nguyên cho QL; luật tự mở việc đầu (UX-2) áp cả QL; chip không lọc theo vai.
5. **Ảnh hưởng:** Chị Vy giao ban không thấy việc của chính mình; GV bị kéo vào việc không phải của mình; nhiều TVV cùng nhận một việc.
6. **Phương án:** nguyên tắc "**việc CỦA TÔI nằm ở trang đầu của vai**" (PTA #6 — chủ SP chọn Q-A1 ① 21/10: GV → Công việc; QL / QT / TVV / CX / Admin VP → Tổng quan; Head tutor → Tutor); một việc một người giữ (**21/10: Chọn bước tiếp + KQ thi thật = TVV của em**, không có → QL); không tự mở việc của người khác, không tự cuộn; chỉ hiện chip / việc mà vai đó làm được; TVV / CX không thấy tên GV ở Báo cáo. → 05 (Phân vai trang).
7. **Xuyên:** QL, QT, GV, GVCN, TVV, CX; nối AU-22 (Tổng quan), AU-42 (Công việc), F-03 (việc TVV).
8. **Luật:** 13/10-VAI (giao diện theo vai đi cùng quyền); 11/10-TVV ("CX xem Phân tích trừ phần GV").
9. **Kiểm thử:** API `/my-work` theo vai: mỗi việc `mine` đúng 1 người; key việc QL không lặp ở Công việc QL; Playwright: vào Công việc QL không panel nào tự mở, `scrollY = 0`; TVV / CX: Báo cáo không có cột tên GV; GV không thấy chip Chờ duyệt.
10. **Chủ SP (21/10):** **Q-A1 ①**; **Q-A3** → luật mới: TVV giữ Chốt ngày thi · Chọn bước tiếp (hạn 1 tuần) · Bổ sung hồ sơ thiếu · Cập nhật KQ thi thật (không hạn); Báo PH lớp thường giữ như nay (02 2.9, X-80).

#### AU-18 · Nhập / xuất Excel
`A·D` (chọn em: B) · **P1** · đã kiểm mã · HT-12 · Mã: V3A-5, V4A-07, CV-02 (hết hiệu lực), TST-04, TST-13, V3B-07, A3-22, V2A-05, FB-2-04, FB-3-06, FB-3-12
1. **Ở đâu:** Dán từ Excel ở 8 lối (Lịch Test hàng lớp + dòng khối 1, panel Công việc một / nhiều lớp, `/nhap-diem`, `/bang-diem-thuong`, hồ sơ lớp "Điểm Test của lớp", panel "Nhập điểm lớp") + màn < 768 px; 11 lối xuất (HV & Lớp, Lịch thi, TVV / CX + Đang SOS, Kế hoạch "Xuất Excel", Kế hoạch "Xuất điểm Test", Lịch Test "Xuất kết quả Test", hồ sơ lớp ⋯, Test + SOS ×2, Kết quả thi Mock, Ý thức); ô tick chọn HV.
2. **Biểu hiện:** Dán Excel còn ở Công việc (cả 375) dù đã chốt bỏ; W1 / W2 / S phải dán 4 tiêu chí trong một ô, một ô lỗi chặn cả dòng; 3 lối xuất điểm, 2 panel cùng "xuất điểm" khác bộ lọc / tên tệp, "Xuất Excel" hai nghĩa; 5 bộ tên cột (Tên / Tên học sinh / Học viên; Email / Gmail; OVR / Overall; Tuần / Tuần thi); 2 lối lệch phạm vi (Lịch Test xem 1 tuần → tệp từ đầu tháng, chọn "Tất cả" → chỉ FT; Kế hoạch "Chỉ cần xếp lại" → tệp mọi em); 3 lối dựng ở trình duyệt, không ghi nhật ký (tệp Ý thức có email + kỷ luật); Thi thật, Báo cáo, Hiệu quả PA, Phân tích GV, Tutor không có xuất; ô tick chiếm 12 % cột tên, 34 điều khiển / lớp, "Chọn tất cả" chỉ lấy lớp đang mở → bỏ 2 em cả chi nhánh ≈ 28 bấm; Xuất luôn qua panel (2 bấm).
3. **Bằng chứng:** `LuoiChamLop.tsx:105-112, 179-195, 207-209`; `luuLo.ts:60-117`; `DanExcel.tsx:50`; `audit_logs` 0 lần dán (tính năng merge 19/10, sau bản deploy 18/10); `NganXuatMt.tsx:146`; `NganXuatDiem.tsx:95`; `KeHoachTestTab.tsx:99-102`; `YThucPhoiHop.tsx:45-74`; `StudentsPage.tsx:325-328`; ảnh `P-nhapdiem-gv10`, `a2-dan-excel-bi-cat`, `hvl-xuat`.
4. **Nguyên nhân:** nút Dán hiện khi người xem "sửa được ≥ 1 ô", không theo nơi mở; mockup 1d "mọi lưới"; OV-15c thêm panel không gộp; mỗi lối tự đặt tên cột; ô tick gắn vào bảng có sẵn (OV-15h2).
5. **Ảnh hưởng:** dán nhầm lượt; tệp sai phạm vi gửi đi; lộ email / kỷ luật không vết; học 3 panel cho một việc.
6. **Phương án — Nhập:** giữ duy nhất lưới theo lượt (hồ sơ lớp + panel "Nhập điểm lớp", cùng thành phần), lớp thường = theo từng bài Progress / Final (02 4.7 #12), ẩn ở 375, máy chủ bắt buộc `luot`, cờ `choDanExcel`; tiêu đề "Dán từ Excel · MT2 · MB FT 101 · 33 em", mẫu chỉ có cột của người xem + Nhận xét; W / S nhận 4 cột liền nhau, ô lỗi chỉ chặn ô đó; làm lại panel sau khi bỏ (MP XI.7). **Xuất (E1):** một từ điển cột ("Tên · Email" đầu); panel mặc định = bộ lọc trang gọi; nút "Xuất · n lượt" cùng hàm xem trước; mọi xuất qua máy chủ + nhật ký; một "Xuất điểm Test" (nút còn lại "Xuất lịch Test"); cột theo mục đích (Test + SOS bỏ 3 cột việc; Ý thức bỏ sheet "HV cần chú ý"; Kết quả thi bỏ "Case / PA · Việc tiếp", thêm Email + Chi nhánh). **Chọn em:** phương án 3 — bỏ ô tick khỏi bảng, chọn / bỏ em trong panel Xuất (Q-E2 ① — chủ SP chọn 21/10). → 05 (Xuất) · 07 (M5, M6).
7. **Xuyên:** GV, QL, QT, Admin VP, TVV / CX.
8. **Luật:** V3 I.5 (bỏ nhập Excel trừ theo lớp × từng MT); quyền ô theo vai; "Thêm học viên" (điểm đầu vào), Tải danh sách tutor ngoài phạm vi bỏ.
9. **Kiểm thử:** API `/scores/lo` thiếu `luot` → 400; grep không có nút Dán ngoài 2 lối; 375 không có Dán; mỗi lối xuất: số dòng tệp = số dòng trang cùng bộ lọc (test riêng 2 lối lệch); tên cột ∈ `COT_XUAT`; mọi xuất có dòng nhật ký; "cả chi nhánh bỏ 2 em" ≤ 6 bấm.
10. **Chủ SP:** **Q-E2 ① (21/10)** bớt em ở panel Xuất; lớp thường "theo từng bài" là PTA diễn giải (02 4.7 #12 — gói đồng ý).

#### AU-19 · Không bám mockup; dữ liệu demo và công cụ kiểm không đủ
`D` · **P2** (quy trình) · đã kiểm · HT-18, HT-21 · Mã: X11, B-06, A5-25, A1-26 (đã bác), A7-06 (đã bác), TST-28 (đã bác), N1–N13, FB-0-14
1. **Ở đâu:** toàn web ↔ 7 mockup đã duyệt; dữ liệu demo; công cụ `do-khung`; ~100 phép kiểm đọc chuỗi.
2. **Biểu hiện:** web khớp mockup ~60 % (Tổng quan, hồ sơ lớp ~40 %; Báo cáo ~36 %); panel Nhập điểm Công việc = khung "Trước" của mockup 2; Tutor rỗng (buổi ghi giờ thật 20/10); 0 lượt thi thật có kết quả; Lịch thi tháng tới 0 HV; thông báo "Ghi nhận 20/10" trong demo 14/09; `do-khung` 5/62 kịch bản không mở được mà vẫn báo xanh, không đo bảng tràn thẻ, bỏ qua lưới chấm. **Đã bác:** ~32 lỗi 403 (máy thử chặn tệp phông qua junction `node_modules`), "6 em hiện hai lần" ở Kế hoạch Test (lỗi ghép ảnh — DOM 33 hàng / 33 tên).
3. **Bằng chứng:** tài liệu chính mục 3 (N1–N12, ảnh cặp `cap-01…10`); a6; `pb2bSeed.ts:187`; `SCR/b/kiem-kb.json`; `a4-dom.mjs`.
4. **Nguyên nhân:** N1–N12 (kế hoạch dịch mockup thành chữ, luật "sửa trên nền có sẵn", PR chia theo tệp, không ảnh cặp, chủ SP chỉ duyệt khung tĩnh…); seed theo giờ thật.
5. **Ảnh hưởng:** chủ SP thấy web khác xa thiết kế đã duyệt; màn không nghiệm thu được vì demo rỗng; lỗi bố cục lọt qua kiểm.
6. **Phương án:** quy trình Q1–Q13 (bảng truy vết khung → thành phần → ảnh, ảnh cặp toàn trang, một màn một PR, cổng ≥ 90 % khớp, chủ SP duyệt ảnh cặp trước merge — 9.1-1, 9.1-2 đã chốt); SEED-UX theo ngày demo, đủ trạng thái của mỗi khung; `do-khung` mới + `do-bang` + đo chiều cao + vùng bấm; phép kiểm chuỗi cũ viết lại theo hành vi. → 06 · 07 (GĐ0).
7. **Xuyên:** mọi PR giao diện.
8. **Luật:** 9.1-1, 9.1-2.
9. **Kiểm thử:** trên `npm run seed` nguyên: /tutor, Lịch thi tháng tới, Thi thật đều có dòng; `do-khung` báo đỏ khi kịch bản không mở; ảnh cặp đủ dòng bảng truy vết.
10. **Chủ SP:** **Q-E1 ① (21/10)**; quy trình đã chốt.

#### AU-20 · Màn 375 / điện thoại
`D` · **P2** · đã kiểm (ảnh 375) · Mã: A3-12, TST-18, A5-20, A5-27 (chữ Tutor, xem AU-54), CV-21 (xem AU-45), B-09 (xem AU-21), V3A-7 (c, g)
1. **Ở đâu:** HV & Lớp, hồ sơ lớp, Lịch Test, Kế hoạch Test, Phân tích (Test + SOS, tab), Tutor, Công việc, menu Tài khoản, thanh dưới.
2. **Biểu hiện:** điều khiển chiếm tới y ≈ 600–740 px trước dữ liệu; thẻ em ~330 px; ô nhập đầu tiên Lịch Test ở y ≈ 1 000 px; Kế hoạch Test và Test + SOS (17 cột) cuộn ngang; hàng tab che 2 tab; mỗi dòng khối 1 dài 5–6 dòng chữ; tên em `-my-3` đè 6 px lên ô hàng dưới; việc một kỹ năng hiện tab cả 5 kỹ năng; menu Tài khoản cao hơn màn; tab "Phối hợp S…" bị cắt; bộ lọc Tutor ~460 px.
3. **Bằng chứng:** ảnh `hvl2-375-tatca-p1`, `lop-ft-375-p1`, `lt-qt-mb-375-p1`, `kh-qt-375-p1`, `a5-L-375-th`, `c-gv10-375-k1--mo`, `v2-gv10-375-mo-p1`, `menu-tk-375-sang`; `LuoiChamLop.tsx:160`.
4. **Nguyên nhân:** bảng không tự thành thẻ; lọc không gom; padding âm; không có ngân sách 375.
5. **Ảnh hưởng:** Cô Linh (điện thoại, cuối buổi) vuốt nhiều, chạm nhầm ô hàng dưới.
6. **Phương án:** 375 tự thành thẻ từ cùng định nghĩa cột (`Bang`); lọc gom vào một nút "Bộ lọc" / một hàng dính; tab thành ô chọn; ngân sách ≤ ~4 màn; vùng bấm ≥ 44 px bằng `min-height`; chỉ tab của việc; menu Tài khoản chỉ giữ thao tác. → 04 (375).
7. **Xuyên:** GV, GVCN, QL giao ban trên điện thoại.
8. **Luật:** không; Dán Excel ẩn ở 375 (AU-18).
9. **Kiểm thử:** `do-bang` 375: không cuộn ngang, không đè; y ô nhập đầu ≤ 420 px; ảnh cặp 375 sáng; ảnh điện thoại thật của GV (§5 #4).
10. **Chủ SP:** không.

---

## 2. Theo trang

Mỗi trang: vấn đề hệ thống chạm trang (dẫn §1) + khối riêng của trang.

### 2.1 Khung chung · Thông báo · Hướng dẫn · tìm · tài khoản
Hệ thống: AU-16 (thanh trên, khung trang), AU-02, AU-09, AU-10, AU-04 (chuông xếp sai nhóm, thẻ đã xử lý vẫn đếm).

#### AU-21 · Chuông, ô tìm, menu tài khoản, Hướng dẫn, Hồ sơ cá nhân, logo, thanh demo
`D` · **P3** · đã kiểm (Góc nhìn đa vai chưa kiểm — §5 #6) · HT-17 · Mã: A1-17, A1-18, A1-22, A1-23, A1-24, A1-25, B-09
1. **Ở đâu:** thanh trên (chuông, ô tìm, menu tài khoản, logo), dải "Mới dùng PISA?", `/huong-dan`, `/ho-so-ca-nhan`, thanh demo.
2. **Biểu hiện:** chuông có 8 dòng "Cần làm" trùng thẻ Chờ duyệt, giờ ghi 20/10 trong demo 14/09; ô tìm gợi ý thiếu "email", khung 288 px làm tên xuống 3 dòng, không tìm được GV; Hồ sơ cá nhân 2 kiểu nút lưu, 5 câu giải thích, rời trang mất nháp; menu tài khoản là nút có viền, GV thấy 12 chip, Hướng dẫn chỉ còn ở đây, ở 375 cao hơn màn; logo không bấm; "Mới dùng PISA? Xem" rời sang trang Hướng dẫn; thanh demo: "Ngày demo" lưu ngay khi rời ô (đổi máy chủ chung), 375 hai chữ "Tài khoản", chọn TK demo 25 thẻ không có ô tìm; mở `/huong-dan` tự ghi "đã xem".
3. **Bằng chứng:** `Header.tsx:52-53, 61, 129, 137`; `ProfilePage.tsx:126-185`; `App.tsx:199-207`; `DemoBar.tsx:109-110`; ảnh `top-tb-ql2`, `f-tim-ten`, `top-hoso-gv10`, `top-tk-gv10`, `menu-tk-375-sang`.
4. **Nguyên nhân:** thông báo không gom; khung tìm hẹp; mỗi thẻ tự đặt nút lưu; logo là `div`.
5. **Ảnh hưởng:** nhiễu; khó tìm GV; mất chữ đang gõ ở Hồ sơ cá nhân; người mới khó thấy Hướng dẫn.
6. **Phương án:** gom thông báo cùng loại cùng đích ("10 thẻ chờ duyệt ›"); ô tìm "lớp, học viên hoặc email" (C18), khung ≥ 26 rem, thêm nhóm "Giáo viên" (QL / QT); Hồ sơ cá nhân nút lưu ở chân thẻ + hỏi khi rời trang có nháp; menu tài khoản dạng dòng (C11: Giao diện, Ngôn ngữ, Hướng dẫn), gom "Phạm vi của tôi ›", Đăng xuất tách cuối; logo = link trang đầu của vai; "Xem" mở panel Hướng dẫn đúng màn; thanh demo có "Áp dụng" + xác nhận, dữ liệu demo theo ngày demo. → 04.
7. **Xuyên:** mọi vai.
8. **Luật:** C11, C18.
9. **Kiểm thử:** tìm bằng email / tên GV ra kết quả; rời Hồ sơ cá nhân có nháp → hỏi; menu 375 ≤ chiều cao màn; ảnh cặp mockup 1 khung 2a.
10. **Chủ SP:** không.

### 2.2 Tổng quan (mọi vai)
Hệ thống: AU-04, AU-05, AU-06 (dải "HV cần chú ý" chết, ô SOS 8×12 px), AU-07, AU-15, AU-16. SOS / Thêm PA tại chỗ → F-04. Duyệt → F-07. Việc TVV → F-03.

#### AU-22 · Tổng quan QL / QT: bố cục, "Cần bạn quyết" dày, trùng Công việc
`B·D` · **P1** · đã kiểm (bố cục mới cần mockup) · HT-09 · Mã: A1-09, A1-11, A1-16, A1-19, A1-21, V4A-02, v1-tq P4 (29 thành phần), FB-1-09, FB-1-11, FB-4-18, X-07, X-40
1. **Ở đâu:** Tổng quan QL / QT, 1 440 + 375.
2. **Biểu hiện:** tiêu đề "Việc hôm nay"; "Cần bạn quyết" 21–29 thẻ cao 95–130 px (trang 2,5 màn; 375: 5,3 màn — riêng khối này 3 395 px khi QT xem ở 375); 7 loại thẻ trộn một danh sách, cùng trọng lượng; "Nếu duyệt: … hạn hết T3" lặp mọi thẻ (ghi thứ); "Chốt lộ trình" lặp 3 lần một dòng, panel toàn màn, nút chốt chỉ hiện sau khi chọn từng em; dòng Case thiếu chip SOS + "đang chờ gì"; "Tuần này" = khối "Lịch sắp tới" cũ, chữ mờ "L R W S", số trên tab tuần không đơn vị; bảng "Lớp cần chú ý" giãn 1 400 px, số kém nổi, hàng chi nhánh không bấm lọc được; **16/21 việc "Cần bạn quyết" trùng Công việc** (cùng `HopChoDuyet gon`), một việc hai dáng mở; dòng việc không hover.
3. **Bằng chứng:** `KhoiCanQuyet.tsx:74, 94, 133-135`; `TongQuanQl.tsx:139-143, 245`; `Highlights.tsx:45, 130`; `TheYeuCau.tsx:179-189`; `OverviewPage.tsx:96-99`; ảnh `f-tq-ql2-p1`, `f-tq-ql2-p2`, `a1-lop-can-chu-y-tuan-nay`, `ql2-tq-p1`, ảnh cặp `cap-01`, `cap-02`; ảnh chủ SP v0-1, v1-4, v1-5; kiểm kê 29 thành phần: giữ 7 · đổi 15 · bỏ 7, panel danh sách số 6 → 0.
4. **Nguyên nhân:** PR #463 ghép khối có sẵn (thẻ Công việc, Lịch sắp tới OV-6a, bảng chi nhánh cũ) thay bố cục mockup 3; OV-15d / 15h1 không chốt "việc nào ở đâu".
5. **Ảnh hưởng:** Chị Vy (giao ban 10 phút) không thấy ngay việc gấp; duyệt 10 thẻ có xem bối cảnh ≈ 31 bấm, 20 đổi trang; Chốt lộ trình 6 lớp 40–60 bấm, 6 panel toàn màn; trùng Công việc làm rối (ảnh v4-1).
6. **Phương án ưu tiên B:** đầu trang một hàng (Tổng quan · Chi nhánh ▾ · Tất cả | FT n | LT n · Dữ liệu đến · Báo cáo ›) → "Cần bạn quyết · 23 việc · ⚠ 12 quá hạn" → **trái ~560 px danh sách / phải ~820 px chi tiết dính** → "Lớp cần chú ý" (số = cả ô, mở rộng hàng lớp — F-04) → "Tuần này" một hàng ô tuần (Test · HV · Chấm x/y; bấm → Lịch Test tuần đó). Chờ duyệt là **nhóm đầu luôn mở** (≤ 5 dòng + "Chọn nhiều"); nhóm cố định (Chờ duyệt · Case quá hạn chốt PA · Sau thi · Bước tiếp · Lộ trình lớp "đã đề xuất x/y" · Phân công · Lịch Test · Vận hành quá hạn), chỉ nhóm có việc mới hiện; dòng 2 hàng ~52 px có động từ ("Duyệt ›", "Thêm PA ›"); mức gấp bằng chữ + ký hiệu, không tô nền. **Bỏ:** dải "HV cần chú ý" (02 4.7 #2), Trễ chấm (AU-23), "Thống kê theo kỳ", "Lịch sắp tới", câu dưới nút, mọi panel danh sách số, "Mở" đổi trang. So **A** (chủ SP: hộp duyệt riêng ở trên — Công việc QL hiện chính là dáng A và bị chê ở v4-1), **C** (Tổng quan chỉ là bức tranh, +1 đổi trang mỗi việc), **D**: B = 11 bấm · 0 đổi trang · ≈ 1,7 / 2,5 màn. → 05 (Tổng quan ↔ Công việc) · 06.
7. **Xuyên:** QL, QT; Công việc QL (phân vai — AU-42), badge, chuông; cùng thành phần hàng đợi cho Tổng quan TVV / CX / Admin VP (AU-24).
8. **Luật:** V1 II.4 (bỏ Trễ chấm); 9.1-4; C23 (định nghĩa nhóm giữ); 19/10-GV.
9. **Kiểm thử:** chiều cao 1 440 ≤ ~1,7 màn, 375 ≤ ~2,5 màn; key việc QL không lặp ở Công việc QL; Playwright: "duyệt 10 thẻ" ≤ 11 bấm, 0 đổi pathname; vào trang không đặt con trỏ, không cuộn; ảnh cặp mockup mới (QL + QT "Tất cả chi nhánh"; đủ trạng thái: rê, focus, đang chọn, đang lưu, vừa xong + Hoàn tác, lỗi giữ chữ, người khác vừa xử lý, trống, lô lỗi một phần).
10. **Chủ SP (21/10):** **Q-A1 ①** (phân vai), **Q-A2 ①** (B).

#### AU-23 · Khối Trễ chấm; panel ghi "Nhập điểm" mà QL không nhập được
`A·D` · **P2** · đã kiểm · Mã: A1-06, FB-1-08, 9.2-1
1. **Ở đâu:** Tổng quan QL / QT, khối Trễ chấm + panel "n bài".
2. **Biểu hiện:** dòng "Nhập điểm · em · lớp · MT1 · R" nhưng QL chỉ xem được; mở dòng chỉ có "Xem hồ sơ ↗"; không hạn từng bài, không lọc lớp; Hướng dẫn QL dạy "bấm số bài để nhập thay".
3. **Bằng chứng:** `server/src/worklist/metrics.ts:312-316` (`han: null`, `lam = can(score.edit)`); `score.edit` chỉ vai `teacher`; `shared/huongDan/ql.ts:62`; `TongQuanQl.tsx:193`; `OverviewPage.tsx:111`; ảnh `bam-tre-17`, `d-tre-dong`.
4. **Nguyên nhân:** mockup 3 khung 1d giả định QL nhập thay; quyền không có.
5. **Ảnh hưởng:** QL tưởng làm được; chữ "Nhập điểm" là việc của GV.
6. **Phương án:** **bỏ khối Trễ chấm** (đã chốt) → hết lỗi tại đây; trễ chấm theo GV xem ở "Tình trạng chấm" (F-01), Phân tích GV, Báo cáo ("bài chấm trễ trong kỳ"); mọi panel chỉ hiện nút "Nhập điểm" khi vai có `score.edit`, không thì "tên GV · chưa nhập · ⚠ quá hạn n ngày"; sửa Hướng dẫn QL. 9.2-1 hết hiệu lực (không thêm quyền). → 05.
7. **Xuyên:** QL, QT; Hướng dẫn; mockup 3 khung 1d (sửa).
8. **Luật:** quyền `score.edit` giữ nguyên; V1 II.4.
9. **Kiểm thử:** Tổng quan không còn khối Trễ chấm; quét mọi panel: nút "Nhập điểm" chỉ khi `can(score.edit)`; Hướng dẫn không còn câu "nhập thay".
10. **Chủ SP:** không (đã chốt).

#### AU-24 · Trang đầu TVV, CX, Admin VP, Head tutor
`D` · **P2** · đã kiểm · HT-19 · Mã: A1-20, CV-32
1. **Ở đâu:** `/` "Học viên của tôi" (TVV), "Số liệu" (CX), "Mock Test" (Admin VP); Head tutor không có Tổng quan (vào thẳng /tutor); Công việc của Admin VP ("Chấm điểm").
2. **Biểu hiện:** ô lớn nhiều số 0 không câu giải thích (TVV 3·0·0·0·0; Admin 4 ô 0); TVV mất "Cần chú ý" của mockup overhaul-3, không có danh sách việc; CX 6 ô + 4 thẻ IN HOA 11 px; Admin tiêu đề "Mock Test" ≠ menu, đơn vị "3 ô" ↔ QL "17 bài"; Admin menu có Công việc (chỉ "Chấm điểm"); TVV / CX gõ `/cong-viec` → 403; Head tutor mở /tutor "Đang dạy 0" rỗng.
3. **Bằng chứng:** `HocVienCuaToi.tsx:41-49`; `MockTestAdmin.tsx:31-60`; `OverviewPage.tsx:57-64, 81-86`; `nav.ts:45`; ảnh `tq-tvv23`, `tq-cx24`, `tq-admin22`, `adm22-dau-p1`, `cx24-cv-p1`; mockup `mko3-tvv`, `mk-vai--admin`.
4. **Nguyên nhân:** OV-2a chỉ làm phần đếm; ba kiểu dựng khác QL.
5. **Ảnh hưởng:** TVV / Admin mở trang thấy số 0, không biết làm gì; người mới không hiểu.
6. **Phương án:** theo PTA #6 "việc CỦA TÔI ở trang đầu của vai": Tổng quan TVV / CX / Admin VP dùng **cùng thành phần hàng đợi + chi tiết** của Tổng quan QL; TVV có "Việc của bạn" (F-03); ô 0 thu thành một dòng "0 Tạm dừng · 0 Sắp thi …"; câu rỗng có hướng ("Không có việc hôm nay · Tuần sau: 5 lượt W1 OCT ›"); tiêu đề "Tổng quan"; một đơn vị "bài". Admin VP: **giữ** mục Công việc (4.7 C25). Head tutor: /tutor là trang đầu, khối "Việc của bạn" (4.7 C24) — chủ SP đồng ý gói 21/10. → 05.
7. **Xuyên:** TVV, CX, Admin VP, Head tutor.
8. **Luật:** 11/10-TVV (TVV không Test, không Công việc; CX như TVV mọi chi nhánh); L1; 13/10-VAI.
9. **Kiểm thử:** Playwright từng vai: trang đầu có hàng đợi hoặc câu rỗng có hướng, không ô số 0 to; h1 = "Tổng quan"; TVV / CX không có menu Công việc; ảnh trang đầu TVV + Head tutor sáng thứ Hai trên bản chính (§5 #15).
10. **Chủ SP (21/10):** Q-A1 ① (TVV làm ở Tổng quan, không thêm Công việc); Q-A3 → 4 việc TVV + hạn; Admin VP, Head tutor: PTA chốt (4.7 C24, C25 — gói đồng ý).

### 2.3 Học viên & Lớp
Hệ thống: AU-01, AU-03, AU-04 (Đang SOS chia trang), AU-05 (số SOS, Cần làm), AU-06 ("+n", mã lớp), AU-11 (Bộ lọc thêm), AU-13 ("Tuần thi của kết quả" → "Thời gian"), AU-15, AU-17 (chip theo vai), AU-18 (ô tick, Xuất), AU-20. Lịch thi → F-05.

#### AU-25 · Hàng lớp / hàng em dày; "Thiếu n" ở 46/51 em; "+1" giấu quá hạn
`D·F` · **P1** · đã kiểm · HT-20 · Mã: A3-04, A3-05, A3-06, A3-16, A3-25, V2A-09, FB-0-06, X-26
1. **Ở đâu:** HV & Lớp › Tất cả (hàng lớp, hàng em); "Thiếu n" cũng ở hồ sơ lớp Tổng hợp.
2. **Biểu hiện:** hàng em 2–5 dòng; một tin lặp 3 lần ("S dưới kỳ vọng" ở chip + "Không đạt: S" + "5.0 ×"); "−0.5" (mockup 6 đã bỏ); 33 em = 2 846 px; "Thiếu n" ở 46/51 em (Tháng dự kiến thi 43, Điểm đầu vào 44 — trường được phép trống); hàng lớp "+1" giấu "⚠ 22 việc quá hạn", không tóm tắt SOS 1/2/3 · Đã thi · Case; lớp gập hết mặc định, "Xếp: Cần chú ý" không thấy tác dụng; chip lúc đếm việc lúc đếm HV, 4 đơn vị phân trang, nút góc đổi số khi lọc.
3. **Bằng chứng:** `BangHocVienLop.tsx:278-293`; `server/src/classes/schedule.ts:757-783` (`missingForStudent` 7 trường); `hocVienLop.ts:301-304, 338, 430-434`; `StudentsPage.tsx:275, 420`; ảnh `a3-hang-em-day-thieu-n`, `a3-plus1-giau-qua-han`, `hvl2-mo101-thieu`, ảnh cặp `cap-03`, ảnh chủ SP v0-6.
4. **Nguyên nhân:** C13 thêm cột điểm mà giữ ô "Kết quả gần nhất" 3 dòng; định nghĩa "Thiếu" gồm trường được phép trống; OV-15 không làm tóm tắt hàng lớp; luật T17 "không tự mở lớp".
5. **Ảnh hưởng:** biết lớp nào có SOS 3 / quá hạn phải ≥ 6 bấm, lật 3 trang; nhãn "Thiếu" mất nghĩa.
6. **Phương án:** hàng lớp theo mockup 1 khung 3: số em · SOS 1/2/3 · Đã thi n · Case · ⚠ quá hạn (luôn hiện, không "+n") · chờ duyệt; lớp đầu mở sẵn (X-36), GV ≤ 3 lớp mở sẵn; hàng em 1–2 dòng: tên + `ChipSos` kèm kỹ năng · OVR L R W S (✓/✗) · Target · Thi thật (F-05) · Việc tiếp (1 việc + "+n") · Mở · ⋯; "Thiếu" thành **một số ở hàng lớp** + lọc, chỉ vai điền được thấy, bấm → Sửa cả lớp đúng cột; một đơn vị đếm (HV). ≥ 6 bấm → 0. → 05 · 06 (M4).
7. **Xuyên:** QL, QT, GVCN, GV, TVV; hồ sơ lớp; Tổng quan (cùng thành phần "hàng lớp mở rộng").
8. **Luật:** 14/10-Q3 ("Thiếu" tính thêm ngày sinh + email); MP V.3 "không đổi logic xác định việc".
9. **Kiểm thử:** `do-bang` hàng em ≤ 64 px; tổng ⚠ hàng lớp = việc quá hạn của lớp ở Công việc (cùng hàm); "Thiếu" trên bản chính (§5 #2); ảnh cặp mockup 1 khung 3.
10. **Chủ SP (21/10):** **Q-D4 ①** — "Thiếu thông tin" = Ngày sinh · Email · Tuần bắt đầu · Target (FT).

#### AU-26 · Góc "Cần làm"
`A·F` · **P1** · đã kiểm · HT-20 · Mã: A3-03, A3-29, V2A-04, FB-0-07, FB-2-03, X-41 (số: A7-07, A7-08, A7-09 ở AU-04 / AU-05)
1. **Ở đâu:** HV & Lớp › Cần làm (mọi vai).
2. **Biểu hiện:** "Cần làm 51" = "Tất cả 51" (46/51 em vì "Thiếu thông tin"); là bản sao danh sách Công việc lọc chi nhánh; 8/10 hàng cột "Học viên" là "Cả lớp · n em", có ô trống; "Người giữ —" (sai thuật ngữ); "Hạn" 2 dòng; "Mở" mọi hàng; chữ việc lặp tên em; đầu nhóm đếm theo trang; QT Monbay 181 việc ↔ Công việc 84 (cùng nguồn `/my-work`, khác đếm), quá hạn 40 ↔ 33; GV thấy Chờ duyệt / Thiếu TT; 375 việc đầu ở y ≈ 745.
3. **Bằng chứng:** `StudentsPage.tsx:162-166, 242`; `BangCanLam.tsx:52-60`; ảnh `a3-can-lam-bang-tat-ca`, `v2-can-lam-ca-lop`, `cl-qt-p1`, `hvl2-gv10-canlam-p1`, ảnh chủ SP v0-7.
4. **Nguyên nhân:** thiết kế 14/10 (OV-12-3) giả định "Thiếu thông tin 12/100" (thật 46/51); bản sao `/my-work` gom theo lớp.
5. **Ảnh hưởng:** hai nơi cùng việc khác số, khác cách xếp → không biết dùng nơi nào.
6. **Phương án (chủ SP chọn (a), 21/10 — giữ tên "Cần làm"):** (a) giữ "Cần làm" là **bộ lọc** của bảng HV: chỉ em có việc, cột Việc · Người phụ trách · Hạn (quá hạn trước), cùng hàm đếm Công việc, không đổi logic xác định việc; (b) đề xuất cũ 11.2 — bỏ góc, chip "⚠ n quá hạn" trên hàng lớp mở dải việc dưới hàng (4 tình huống 1–3 / 3 / 2+n / 3 → 1 / 1 / 1+điền / 1). Cả hai: "Người phụ trách", nút động từ, đếm toàn bộ, chỉ việc vai đó làm được, việc TVV về Tổng quan TVV. → 05.
7. **Xuyên:** QL, QT, GV, GVCN, TVV, CX; Công việc.
8. **Luật:** MP V.3 (không đổi logic xác định việc).
9. **Kiểm thử:** số "Cần làm" = số việc ở Công việc cùng vai, cùng chi nhánh; không còn chữ "Người giữ"; ảnh cặp mockup mới.
10. **Chủ SP (21/10):** **Q-A4** — "Để tên là 'Cần làm' nhé": phương án (a), giữ tên "Cần làm".

#### AU-27 · Đang SOS
`D` · **P1** · đã kiểm · Mã: A3-09, A3-10, A3-11, A3-13, FB-0-08, 9.2-16 (chia trang: A3-02 ở AU-04; số: A3-08 ở AU-05)
1. **Ở đâu:** HV & Lớp › Đang SOS (+ góc TVV / CX), hộp "Vì sao SOS", chip SOS mọi trang.
2. **Biểu hiện:** 9 cột chữ bị cắt "…"; hai bảng FT / LT khác tiêu đề; chế độ tuần mất cột; chip SOS 4 dáng, W1 / W2 tách như hai môn; "Vì sao SOS" hai nội dung, không link tới việc; không lọc mức SOS / Lớp; không chọn để xuất (không xuất riêng SOS 3 được).
3. **Bằng chứng:** `BangSos.tsx:55, 86-87, 192-197`; `display.ts:215`; `locThem.ts:11-20`; ảnh `a3-dang-sos-trang-1`, `a3-dang-sos-trang-2`, `hvl-sos-chip`, `a3-mockup6-dang-sos`, ảnh chủ SP v0-8.
4. **Nguyên nhân:** OV-15 không chép bảng mockup 6; OV-15a "ChipSos một component" chưa phủ chip trạng thái lượt.
5. **Ảnh hưởng:** QL tìm em SOS chưa có PA 6–9 bấm, dò 3 trang; xuất SOS 3 không làm được trong app.
6. **Phương án:** bảng 6 cột mockup 6 khung 1, một bảng; lọc SOS 3 · 2 · 1 + Trống PA · Chờ nhận xét · PA chờ xác nhận; SOS 3 trước; **không bộ lọc thời gian** ("SOS hiện tại" — 9.1-4); một `ChipSos` (kèm kỹ năng, W gộp) + một hộp "Vì sao SOS" (kết luận, số, "Mở hồ sơ MT3 ↗"); chi tiết ở hàng mở rộng / panel một em (F-04); xuất qua panel Xuất (AU-18). 6–9 → ~5 bấm; xuất SOS 3: 2–3 bấm. → 05 · 06.
7. **Xuyên:** QL, GVCN, TVV, CX; chip SOS mọi trang.
8. **Luật:** 9.1-4 (một định nghĩa SOS hiện tại); C08 (chip SOS viền).
9. **Kiểm thử:** grep: `ChipSos` là thành phần duy nhất vẽ mức SOS; tổng Đang SOS = "SOS hiện tại" ở Tổng quan / Báo cáo cùng phạm vi; ảnh cặp mockup 6 khung 1.
10. **Chủ SP:** không (9.2-16 theo 9.1-1).

#### AU-28 · Panel một em, chọn nhiều, góc TVV / CX
`D` · **P2** · đã kiểm · Mã: A3-18, A3-24, A3-27 (khác: A3-12 → AU-20, A3-26 → AU-09, A3-30 → AU-17, A3-31 → AU-16, B-04 → AU-15)
1. **Ở đâu:** HV & Lớp (Tất cả), hồ sơ lớp (chọn nhiều), góc nhìn TVV / CX.
2. **Biểu hiện:** Tất cả không có "Mở" panel một em, bấm tên đổi trang; hai kiểu "chọn nhiều", hai bộ thao tác (HV & Lớp ↔ hồ sơ lớp); TVV / CX dùng từ khác ("Cần chú ý" / "Cần làm"), TVV 8 nút lọc, CX 2 chip SOS.
3. **Bằng chứng:** ảnh `hvl2-mo101-menuem`, `hvl2-mo101-chon`, `lop-ft-chonnhieu`, `hvl2-tvv23-p1`, `hvl2-cx24-p1`.
4. **Nguyên nhân:** mỗi góc nhìn dựng riêng.
5. **Ảnh hưởng:** xem nhanh một em phải đổi trang; TVV / CX học giao diện khác QL.
6. **Phương án:** bấm hàng / "Mở" → panel một em, tên là link "↗" (tách làm việc / xem); một thanh "Chọn nhiều" dùng chung; TVV / CX dùng cùng thành phần QL, cột theo vai. → 04 · 05.
7. **Xuyên:** QL, GVCN, TVV, CX.
8. **Luật:** 11/10-TVV.
9. **Kiểm thử:** Playwright: bấm hàng em → panel một em, pathname không đổi; thanh chọn nhiều cùng một thành phần (phép kiểm import); ảnh cặp góc TVV.
10. **Chủ SP:** không.

### 2.4 Hồ sơ lớp
Hệ thống: AU-01, AU-02, AU-07 (12 chỗ "đã có trên trang"), AU-15 (4 800 / 10 640 px), AU-20.

#### AU-29 · Lưới Điểm MT dưới mọi tab; "Nhập điểm" mở bản thứ hai của lưới
`A·D` · **P1** · đã kiểm · Mã: A3-01, A3-14, V2B-3, FB-0-04, FB-2-11, 9.2-17 (hết hiệu lực)
1. **Ở đâu:** hồ sơ lớp (mọi tab), nút "Nhập điểm", chip "78 bài chờ chấm".
2. **Biểu hiện:** lưới "Điểm Mock Test của lớp" mở sẵn dưới MỌI tab (+~2 200 px; 33 em hiện hai lần); "Nhập điểm" mở panel toàn màn = bản thứ hai của lưới đó; cả hai mở MT3 dù 29/32 em chưa tới tuần; MT1 quá hạn phải tự chọn; "Chỉ ô còn trống" tắt; chip đếm cả ô chưa tới hạn; "xếp ở panel Lộ trình" đổi trang dù GV không có quyền.
3. **Bằng chứng:** `ClassOverviewPage.tsx:48, 145`; `DauTrangLop.tsx:121, 179`; `diemTheoLuot.ts:37, 41-52`; gập lưới: tab Phân tích 3 012 → 804 px; ảnh `a3-ho-so-lop-luoi-diem-duoi`, `wf-gvcn-nhapdiem`, ảnh cặp `cap-04`, ảnh chủ SP v0-4, v0-5, v2-2.
4. **Nguyên nhân:** OV-15b đổi "Nhập điểm" sang panel mà không bỏ khối cũ; `luotMacDinh` lấy lượt gần nhất đã tới tuần.
5. **Ảnh hưởng:** GVCN nhập bài thiếu: 4 bấm + 1 panel + phải nhớ lượt nào quá hạn; trang dài gấp đôi.
6. **Phương án (khuôn đã chốt):** lưới **gập** thành thanh "Điểm Mock Test · MT1 ⚠ 4 ô quá hạn · MT3 2 ô tuần này ›" (chỉ tab Học viên; đếm ô đã tới hạn theo vai); "Nhập điểm" / chip "⚠ n ô quá hạn chấm" → **mở + cuộn tại chỗ**, không panel phải; chọn sẵn lượt có ô quá hạn của người xem sớm nhất; bật "Chỉ ô còn trống"; mở luôn hộp ô trống đầu (Enter = "Lưu · em tiếp ›"); công cụ ngoài khung bảng; QL có "Xếp lịch MT3" hộp nhỏ (GV chỉ thấy chữ); URL `?diem=mt:1`; 375 dùng `MotKyNang`; `PanelNhapDiemLop` chỉ còn cho lối ngoài hồ sơ lớp. 4 bấm → 1; tab Học viên 4 800 → ~2 650 px. → 05 · 06 · 07 (M3).
7. **Xuyên:** GVCN, GV, QL; Lịch Test (chip "bài chờ chấm"); HV & Lớp (⋯ "Nhập điểm" giữ panel).
8. **Luật:** V2 II.1 (đã chốt); Rulebook §20.9 (xếp lịch MT chỉ QL); T19 (không nhập trước tuần thi).
9. **Kiểm thử:** Playwright: bấm "Nhập điểm" → không `[role=dialog]`, lưới mở, cuộn tới thanh công cụ, focus ô trống đầu của lượt quá hạn; URL có `?diem=`; Quay lại đúng lượt; tab Học viên ≤ ~2 650 px; chip = số ô đã tới hạn.
10. **Chủ SP:** không (đã chốt; chi tiết 11.8-15 PTA tự quyết).

#### AU-30 · Các bảng hồ sơ lớp; chip đầu trang đổi trang
`A·D` · **P1** · đã kiểm · Mã: V2B-4, V2B-5 (12 chỗ — luật chung ở AU-07), A3-07, A3-19, A3-21, A3-28, FB-2-10
1. **Ở đâu:** hồ sơ lớp: Tổng hợp, Góp ý tuần, Cần hỗ trợ, Kết quả đầu ra, Phân tích lớp; chip đầu trang; cột "Theo dõi", "Đợt"; Sửa cả lớp; cột "Việc tiếp theo" (cũng ở HV & Lớp).
2. **Biểu hiện:** 4 tầng điều hướng (tab → cách xem → tab con → 375 "Theo xử lý / Theo vi phạm"); cao 1 440: Tổng hợp 4 800 · Góp ý 5 036 · Cần hỗ trợ 4 448 · KQ đầu ra 3 026 · Ý thức 5 431 · Phối hợp 4 349 · Phân tích 3 012 px; Tổng hợp 12 cột, hàng 46–71 px, cùng cột lệch ±16 px, "Thiếu n" 30/33, cột ⋯ 154 px cho nút 28 px; Góp ý tuần 132 ô viền đứt (GV thấy cả môn khác); Cần hỗ trợ tiêu đề cột IN HOA 11 px bị phân trang tách khỏi bảng, "quá hạn" lặp 2 cột; KQ đầu ra 1 đợt ở lớp FT là kết quả lớp **trước** (BE); Phân tích "6/11" chỉ giải thích ở tooltip, MT4 / MT5 trống; cột "Việc tiếp theo" 3 hành vi (panel / sang Test / sang hồ sơ HV); chip "8 chờ duyệt", "78 bài chờ chấm", "⚠ 7 việc quá hạn", "Thiếu n" sang 3 trang khác, số trên chip ≠ số ở trang đích; Sửa cả lớp: 4 cột học tập (Tuần BĐ, Dự kiến thi, Target, Điểm ĐV) nằm ngoài khung 1 440.
3. **Bằng chứng:** `DauTrangLop.tsx:118-127`; `ClassRoster.tsx:265`; `thaoTacDongHocVien.ts:58-66`; `PhanTichLopTab.tsx:37-39, 60`; `SuaCaLopPanel.tsx:28-35`; ảnh `lop-ft-tonghop-p1`, `lop-ft-canhotro-p1`, `lop-thuong-tonghop-p1`.
4. **Nguyên nhân:** mỗi PR đổi một lối, lối cũ giữ (OV-12f, OV-15b); OV-10b chèn 4 cột liên hệ phía trước Sửa cả lớp; thiếu luật "có trên trang thì làm tại đó".
5. **Ảnh hưởng:** Cô Linh ~6–10 lần đổi trang mỗi buổi; GV gặp 132 ô không phải của mình; GVCN đọc nhầm KQ lớp trước.
6. **Phương án:** mọi bảng dùng `Bang` một dòng / em; Tổng hợp: Học viên (+ chip SOS) · Target · Dự kiến thi · MT gần nhất · OVR L R W S (mốc cũ mở rộng hàng) · Việc tiếp (mở tại chỗ) · ⋯; Góp ý tuần: GV chỉ ô môn mình, cột khác chỉ đọc gập; Cần hỗ trợ: hàng nhóm theo em; lớp FT "Kết quả lớp trước"; "6 đạt / 11 có điểm"; ẩn cột MT chưa ai thi; 12 chỗ theo thang AU-07 (Nhập điểm 0–1 · chip quá hạn → lọc tại chỗ 1 · "Thiếu" → Sửa cả lớp đúng cột 4 · "chờ duyệt" → khung phải lọc lớp 3 · "Xử lý vi phạm" → tab Ý thức mở hàng em 2 · cột Đợt → mở rộng hàng 2…); Sửa cả lớp đưa cột học tập lên sau Email; số chip = số dòng đích. → 05 · 06 (M3).
7. **Xuyên:** GVCN, GV, QL; HV & Lớp hàng lớp.
8. **Luật:** không đổi quyền ghi (11.8-17).
9. **Kiểm thử:** bấm 12 chỗ: pathname không đổi (trừ link "↗"); "số chip = số dòng"; `do-bang` từng bảng; chiều cao tab trong ngân sách; ảnh cặp mockup 1 khung 4, mockup 6 khung 2 (cập nhật).
10. **Chủ SP:** không (11.8-17 PTA tự quyết).

#### AU-31 · Ý thức & Phối hợp (hồ sơ lớp)
`A·D` · **P1** · đã kiểm · HT-10 · Mã: V2B-6, V2B-7, A3-15, FB-0-05, FB-2-12, FB-2-13
1. **Ở đâu:** hồ sơ lớp › Ý thức (Vi phạm & xử lý, Phối hợp SOS).
2. **Biểu hiện:** hai khung: trái em theo 5 nhóm IN HOA (không nút), phải **mặc định** dòng thời gian ~45 vi phạm cả lớp, phần lớn đã xử lý; Phối hợp ở tab con khác; "Quá hạn" là chip nền (trái DESIGN.md "chỉ chữ + ⚠"); 375 tab "Phối hợp S…" bị cắt; Phối hợp SOS 6 thẻ y hệt, câu "Học thuật theo dõi ở bảng kỹ năng" lặp mọi thẻ, mức SOS chỉ là chữ, 9 nút "Xác nhận" màu nhấn, việc xong cùng cỡ việc chờ, chip "Đang làm" trùng "1/2"; tải nhận thức trượt 6/8.
3. **Bằng chứng:** `PhoiHopSosSection.tsx:69-201`; ảnh `v2-ho-so-lop-y-thuc`, `v2-phoi-hop-sos-the-giong-nhau`, `lop-ft-ythuc-p1..p3` (5 431 px), `qt-lop3-yt-p1`, ảnh chủ SP v0-5, v2-2, v2-3.
4. **Nguyên nhân:** PR-YT4 và các PR sau chỉ thêm nút; một khuôn thẻ không phân cấp; Rulebook §19 nói hồ sơ lớp mặc định theo học sinh — web mặc định theo vi phạm.
5. **Ảnh hưởng:** người mới không biết làm gì; xử lý quá hạn 5 bấm; xác nhận phối hợp 4 bấm + dò ~1 700 px; xem một em 3–4 bấm + đổi trang.
6. **Phương án A (PTA tự quyết, mockup duyệt):** một bảng theo em — lọc `Cần làm · 8 em | Tất cả em · 33 | Nhật ký vi phạm` (mặc định Cần làm; xếp quá hạn → bắt buộc → hôm nay → chờ QL → mới → phối hợp); cột Học viên · Việc cần làm · Hạn · Vi phạm 2 tuần · Thang · Phối hợp SOS · [một nút động từ] ▸; ▸ mở 3 cột dưới hàng (Thang + Xác nhận xử lý · Đề xuất QL duyệt · **Thu hồi…** (F-03) · Vi phạm chưa xong + "n đã xử lý ▾" · Việc phối hợp); quá hạn = chữ cam + ⚠; GVBM không có nút xử lý; bỏ tab con; thêm dấu "TVV: chưa ghi nhận · hạn 18/09" (F-03). Luật thị giác "nhóm lặp" toàn web: cấp em (tên 15/700 + `ChipSos` + "MT2 · W2 SEP") · cấp việc (thụt 16 px, trạng thái ký hiệu + chữ ở cột cố định) · chỉ việc chờ đầu tiên có nút chính · việc xong gập. 5 → 3 bấm; 4 + dò → 3, 0 dò; Ý thức ~2 800 → ~700 px; Phối hợp ~1 700 → ~450 px. So B (giữ hai khung), C (giữ hai tab con). → 05 · 06 (M3).
7. **Xuyên:** GVCN, QL, GVBM, TVV; hồ sơ HV (AU-34), Phân tích › Ý thức, Công việc; cùng gốc "nhóm lặp": Cần hỗ trợ, Lịch Test khối 1, Kế hoạch Test, "Cần bạn quyết", nhóm việc.
8. **Luật:** Rulebook §19, §20 (thang 6 bậc; Ghi nhận biến mất khi bắt buộc; WL 3 / ngoài thang qua QL duyệt; hạn 5 ngày GVCN; phối hợp không phải vi phạm; xác nhận / bỏ kèm lý do); L1; 21/10.
9. **Kiểm thử:** đếm bấm 3 tình huống; phần Ý thức ≤ ~700 px (1 440); mỗi hàng ≤ 1 nút chính (DOM); 375 không tab bị cắt; ảnh cặp mockup mới.
10. **Chủ SP:** không (11.8-11, 11.8-16 PTA tự quyết, mockup duyệt).

#### AU-32 · Ảnh 5 — `case 'yt_xem'` trùng: "Ghi nhận" một em bị đổi trang
`D·E` · **P2** · đã kiểm bằng mã; chưa bấm thử · Mã: 11.1e, FB-2-15
1. **Ở đâu:** `PanelViec.tsx` hàm `lamTaiCho`; việc "Ghi nhận n vi phạm mới · <em>" của **một** em (Công việc, HV & Lớp).
2. **Biểu hiện:** terminal Vite báo 2 cảnh báo "duplicate case" (ảnh chủ SP v2-5); bấm việc → **đổi trang** sang hồ sơ lớp (`&loc=moi`) thay vì mở tại chỗ; việc bị loại khỏi hàng đợi "việc tiếp"; khối "Ghi nhận" là mã chết; sửa nửa vời sẽ mở nhầm panel "Xác nhận xử lý".
3. **Bằng chứng:** `PanelViec.tsx:50` (`case 'yt_xem': return laLo(it)` — OV-13d) đứng trước `:56` (`case 'yt_xem': case 'phoi_hop'` — OV-13b), `:105`, `:124`; `HoTroHocVienTab.tsx:175`; quét 830 tệp `.ts/.tsx`: chỉ 2 cảnh báo này.
4. **Nguyên nhân:** OV-13d (11:07) và OV-13b (11:11) ngày 15/10 song song sửa một `switch`, git gộp không báo xung đột; `tsc` không bắt; esbuild chỉ cảnh báo, `npm run check` không đỏ.
5. **Ảnh hưởng:** GVCN rời trang khi ghi nhận; việc không vào hàng đợi.
6. **Phương án:** "Ghi nhận" một em làm tại chỗ (theo ý OV-13b; dùng thành phần Ý thức mới nếu AU-31 làm trước); gỡ `case` trùng; cảnh báo esbuild = lỗi trong `npm run check` + luật `no-duplicate-case`. → 07 (CV-LOI).
7. **Xuyên:** GVCN, GV; Công việc, HV & Lớp, hồ sơ lớp.
8. **Luật:** không.
9. **Kiểm thử:** bấm thử GV 7 → Công việc → việc "Ghi nhận … vi phạm mới" một em: pathname không đổi, mở đúng panel; `npm run check` đỏ với tệp mẫu có `case` trùng.
10. **Chủ SP:** thời điểm → **Q-E1 ① (21/10): GĐ1**.

#### AU-33 · Lớp đã kết thúc, Tổng kết, Lưu trữ, Chuyển tiếp lớp
`D` · **P3** · đã kiểm · Mã: V4C-14 (màu "70 %" hai màu: V4C-09 ở AU-03; Chuyển tiếp lớp: V4C-04 / 05 / 13 ở AU-09 / 11 / 08)
1. **Ở đâu:** Tổng kết lộ trình, `/hoc-vien/luu-tru`, lớp đã kết thúc › Tổng kết, Chuyển tiếp lớp.
2. **Biểu hiện:** "Mở hồ sơ" dẫn về chính trang đang đứng; ở Lưu trữ "Tổng kết" là link mặc áo nút, đứng cạnh "Học lại", "Bỏ lưu trữ"; Lưu trữ chưa qua `t()`; Chuyển tiếp lớp tiêu đề cột IN HOA, 33 hàng × 3 = 99 điều khiển, chip tuần.
3. **Bằng chứng:** `NganTongKet.tsx:191`; `LuuTruPage.tsx:135, 161`; ảnh `b2-hv96-tongket`, `b2-lop1-ketthuc-ql-p1`, `b2-lop6-lotrinhtiep-p1`.
4. **Nguyên nhân:** chưa tách nút làm việc với link xem.
5. **Ảnh hưởng:** QL bấm vòng; dễ nhầm link xem với thao tác (Học lại).
6. **Phương án:** ẩn link trùng trang; link xem dùng dáng chữ + "›"; Lưu trữ qua `t()`; Chuyển tiếp lớp theo AU-08 / 09 / 11. Mẫu tốt giữ: Kết thúc lớp, Xoá HV, trang ngoài phạm vi.
7. **Xuyên:** QL, QT.
8. **Luật:** 14/10-Q4 (lớp đã kết thúc chỉ QL sửa điểm — **giữ**, Q-B1 ① 21/10).
9. **Kiểm thử:** link có đích = `location.pathname` thì không vẽ (phép kiểm); quét chuỗi Lưu trữ qua `t()`; ảnh cặp.
10. **Chủ SP:** không.

### 2.5 Hồ sơ học viên
Hệ thống: AU-03 (điểm tab Học thuật là link xanh), AU-08 (đầu panel cũ ở Chuyển lớp, KQ thi thật, Tạm dừng, Xoá, Đề xuất sửa), AU-09 (menu ⋯ cũ), AU-11 (Chuyển lớp: hàng chip tuần), AU-14 (lịch sử Ý thức). Tab Học thuật: không lỗi riêng (v4c).

#### AU-34 · Ý thức & Phối hợp (hồ sơ HV)
`A·D` · **P1** · đã kiểm · HT-10 · Mã: V2B-8, FB-2-16
1. **Ở đâu:** hồ sơ HV › tab Ý thức.
2. **Biểu hiện:** một việc "Ghi nhận 1 vi phạm mới" hiện **3 chỗ** trên một màn (thanh "VIỆC CỦA TÔI" đầu hồ sơ, thanh trong tab, nút trên dòng); khối Thang có nút chính "Xác nhận xử lý" trong khi việc thật là Ghi nhận; ô "Ý thức · WL 1" ở dải 4 ô lặp Thang; hai tab con; "XỬ LÝ" IN HOA 11 px; 375 3 174 px.
3. **Bằng chứng:** `StudentYThucSection.tsx:136`; `ThangYThuc.tsx:64`; ảnh `v2-ho-so-hv-ghi-nhan-3-cho`.
4. **Nguyên nhân:** thanh đầu hồ sơ thêm sau, không bỏ thanh cũ.
5. **Ảnh hưởng:** hai nút chính tranh nhau → bấm nhầm; người mới không biết làm việc nào trước.
6. **Phương án:** cùng ngôn ngữ AU-31, mật độ một em, mở sẵn: Thang một dòng → hai cột **Vi phạm chưa xong | Phối hợp SOS** (xếp chồng ở 375) → nút theo việc (bắt buộc / quá hạn: "Xác nhận xử lý" chính; chỉ có vi phạm mới: "Ghi nhận" chính) → **Nhật ký · n ▾** gập; việc hiện tại chỉ ở thanh đầu hồ sơ + nút trên dòng; bỏ hai tab con; không IN HOA; cùng component với hàng em mở rộng ở hồ sơ lớp; hiện trạng thái việc TVV + "Thu hồi…" (F-03). Thấy đủ tình trạng: 0 bấm (nay 1–2). → 05 · 06 (M3b).
7. **Xuyên:** GVCN, TVV, QL.
8. **Luật:** §19, §20; L1; 21/10.
9. **Kiểm thử:** DOM: một việc hiện đúng 2 chỗ; ≤ 1 nút chính trong tab; không `uppercase`; ảnh cặp mockup chung với AU-31.
10. **Chủ SP:** không (11.8-12 PTA tự quyết).

#### AU-35 · Hành trình; Lộ trình tiếp theo của một em
`D` (bản chính em ≥ 2 lớp: E) · **P2** · đã kiểm demo · Mã: V4C-06, V4C-07
1. **Ở đâu:** hồ sơ HV › Hành trình (1 440 + 375); ⋯ › Lộ trình tiếp theo (lớp thường).
2. **Biểu hiện:** một lộ trình vẽ 3 lần (bảng "Các lộ trình" → thẻ → trục tuần, thêm nút "Xem trục tuần" thừa); chú giải 9 ký hiệu; "1 PA" ngay trên "chưa có PA"; "Đã huỷ" màu xanh lá; "5.0 ?"; 375 chữ cắt, chip đè lưới; một lộ trình dài ≈ 2 000 px. Lộ trình tiếp theo rời hồ sơ sang `/hoc-vien/lop/6?che-do=lo-trinh` rồi mở Modal giữa màn: 4–5 bấm + 2 lần đổi trang; dáng hộp thứ 3.
3. **Bằng chứng:** `students/HanhTrinh.tsx:414, 507`; `classes/BangLoTrinhTiep.tsx`; ảnh `b1-hanhtrinh-47-qt-p1`, `b1-hanhtrinh-47-375-p2`, `b2-hv11-lotrinhtiep`.
4. **Nguyên nhân:** OV-5, OV-11d, OV-13 chồng lớp; đếm PA hai cách; form một em nằm trong bảng cả lớp.
5. **Ảnh hưởng:** GVCN / TVV đọc lộ trình khó, số PA mâu thuẫn; đổi trang thừa.
6. **Phương án:** một dòng thời gian theo lớp; trục tuần là công tắc, chỉ ở ≥ 1 280 px; chú giải ≤ 4 ký hiệu; một hàm đếm PA; "Đã huỷ" trung tính; 375 chỉ dòng dọc. Lộ trình một em: panel phải 560 px ngay tại hồ sơ HV (bảng lớp dùng lại form) → 3 bấm, 0 đổi trang. Cần mockup. → 05 · 06.
7. **Xuyên:** GVCN, TVV, QL; Tổng kết lộ trình, Lưu trữ › Tổng kết, tab Học thuật; Chốt lộ trình ở Công việc / Tổng quan (AU-47).
8. **Luật:** không.
9. **Kiểm thử:** một lộ trình vừa 1 màn 1 440; phép kiểm hàm đếm PA "cùng PA cùng số"; Lộ trình một em: pathname không đổi; ảnh em ≥ 2 lớp trên bản chính (§5 #8).
10. **Chủ SP:** không; cần mockup.

### 2.6 Case

#### AU-36 · Ngăn Case: nút chính sai việc / sai vai, mã thô
`D` (PA loại cũ trên bản chính: E) · **P2** · đã kiểm demo · Mã: V4C-08, A1-15, A3-32
1. **Ở đâu:** `/hoc-thuat/case/:id`, ngăn Case mở từ Tổng quan / Công việc / hồ sơ HV.
2. **Biểu hiện:** tên PA hiện mã thô "teacher_change_request"; QT thấy nút chính "Xác nhận PA" dù đó là việc của GV; Case trống PA mà nút chính "Hoàn thành Case"; tên Case là chuỗi thô "[MT1] Reading không đạt [SOS 3]". Chưa mở: Nhật ký PA, Sửa / Xoá Case, Xoá / Kết thúc PA.
3. **Bằng chứng:** `seed/students.ts:806`; `shared/domain/cases.ts:617-639`; `CasePanel.tsx:328, 354, 473, 530`; `CapNhatTuan.tsx:295`; ảnh `b1-case-16-qt`, `bam-mocase`, `d-375-mocase`, `hv-sos3-hocthuat-p1`.
4. **Nguyên nhân:** nút chính không theo việc tiếp và vai; thiếu tên dự phòng; tên Case ghép chuỗi.
5. **Ảnh hưởng:** QL bấm "Hoàn thành Case" khi chưa có PA; QT làm thay việc GV.
6. **Phương án:** nút chính theo việc tiếp của Case + theo vai (Case trống PA → "+ Thêm PA"); tên dự phòng "Loại PA khác" + ghi log; sửa seed; tên Case hiển thị "MT1 · Reading · SOS 3" từ trường dữ liệu. Giữ panel Case trong hồ sơ (mẫu tốt). → 05.
7. **Xuyên:** QL, QT, GV, GVCN; Hành trình, Hiệu quả PA.
8. **Luật:** quyền xác nhận PA theo vai; toàn vẹn Case / PA (H22 giữ).
9. **Kiểm thử:** mọi `kind` ∈ `INTERVENTION_KINDS`; quét DOM không in chuỗi có "_"; bảng nút chính (trạng thái Case × vai) có phép kiểm; ảnh Case có PA loại cũ trên bản chính (§5 #7).
10. **Chủ SP:** không.

### 2.7 Test (Lịch Test, Kế hoạch Test, lưới, hộp chấm, Speaking)
Hệ thống: AU-01 (lệch 69 / 76,5 / 86 px), AU-03, AU-11, AU-13 (Thi ↔ Test), AU-14 (Progress khoá — ảnh v4-4), AU-18 (Dán / Xuất Excel), AU-20. Luồng chấm → F-01. MT dời / huỷ → F-02.

#### AU-37 · Lịch Test: lưới đủ cột mọi lớp, dải 3 ô trùng, khối 1 nhiều nút
`D` · **P1** · đã kiểm · Mã: TST-01, TST-03, TST-10, TST-11, TST-17, TST-19, TST-23, FB-0-13, 9.2-20, 9.2-21
1. **Ở đâu:** Test › Lịch Test / Chấm Test (QL, QT, GV).
2. **Biểu hiện:** mọi lớp còn bài tự mở lưới đủ 10 cột, đủ em kể cả em đã xong (QT 2 172 px, 141 nút; mở khối 3 → 5 476 px); 3 ô số đầu trùng đầu khối, "117/177" gộp hai tuần, "13" không đơn vị (= số ô điểm còn trống), tuần sau báo "Còn phải chấm 44"; khối 1: 8 nút chính giống nhau, chip "Chờ chấm" mọi dòng, một lớp chiếm 5 dòng; nút "Tạo bài kiểm tra theo chương trình" ở mọi lưới lớp thường, trùng "Xếp cả lớp theo đề xuất" (cùng API); ↗ → `/nhap-diem`, Quay lại thì khối thu lại, cuộn về đầu; hai nút "Tất cả" khác nghĩa, mặc định "Lớp thường" che bài S của FT; "bài" lúc là ô kỹ năng, lúc là cả bài.
3. **Bằng chứng:** `HangLop.tsx:187-195`; `DaiSo.tsx:19-33`; `LichTestTab.tsx:98, 168-175, 198-216`; `KhoiNo.tsx:132-139`; `LuoiThuong.tsx:308-324`; `LopKeHoach.tsx:27`; ảnh `a4-lich-test-3-o-luoi-du-cot` ↔ `a4-mockup-ba-khoi-luoi-gon`, ảnh chủ SP v0-12b.
4. **Nguyên nhân:** OV-15b dùng lưới một component, bỏ chế độ "còn nợ"; dải có trong mockup ba khối 06/10 nhưng nhãn không sửa khi thêm khối 2; khối mở là state, không nằm trên URL.
5. **Ảnh hưởng:** QL tìm ô trống tuần này cuộn ~2,4 màn, 141 nút; 28 lần Tab mới tới khối đầu.
6. **Phương án:** theo F-01 — lưới gọn chỉ em + cột còn nợ + nút "Cả lớp"; một lớp mở một lúc; nhóm bài thi tuần này mở khi có ô của tôi; bỏ dải 3 ô (số + đơn vị ở đầu nhóm / "Tình trạng chấm"); khối quá hạn gom theo lớp, nút phụ; bỏ nút tạo bài ở lưới (giữ một nút, một tên ở Kế hoạch Test); ↗ mở tại chỗ hoặc ghi khối lên URL; "Lớp của tôi · Mọi lớp", có bài S chéo thì mặc định "Tất cả"; đơn vị "ô". 2 172 → ~1 000 px, 141 → ~40 nút. → 05 (Chấm Test) · 06 · 07 (M5).
7. **Xuyên:** GV, QL, QT, GV S.
8. **Luật:** T15 (chia khối — giữ), T19.
9. **Kiểm thử:** chiều cao Lịch Test QT mặc định ≤ ~1 000 px, ≤ ~40 nút; Quay lại từ ↗ giữ khối (URL); ảnh cặp mockup M5 mới.
10. **Chủ SP (21/10):** **Q-C1** — vẽ mockup "theo hạn" (lựa chọn ①), chủ SP duyệt sau (dải 3 ô có trong mockup 06/10).

#### AU-38 · Hai giao diện nhập điểm cả lớp; `/nhap-diem`, `/bang-diem-thuong`, hồ sơ Mock
`D` · **P1** · đã kiểm · Mã: TST-02, TST-20, 12.9-5
1. **Ở đâu:** trang `/nhap-diem` (theo tuần, 13 cột) ↔ panel "Nhập điểm lớp" (theo lượt); `/bang-diem-thuong`; hồ sơ Mock (`/mock-test/:id`).
2. **Biểu hiện:** cùng lớp ra 5 / 8 / 32 em tuỳ lối; hồ sơ Mock 3 lối nhập điểm, nhận xét ở 2 nơi, 2 nút cùng về hồ sơ HV, "Nhập điểm" dẫn sang trang theo tuần; `/bang-diem-thuong` ô tự lưu khi rời ô.
3. **Bằng chứng:** `ChamDiemPage.tsx:30-148`; `PanelNhapDiemLop.tsx:11-29`; ảnh `a4-trang-nhap-diem-theo-tuan` ↔ `a4-panel-nhap-diem-theo-luot`, `mt-qt-171-p1`.
4. **Nguyên nhân:** OV-15b giữ trang `/nhap-diem` cho nút ↗; lối cũ không bỏ.
5. **Ảnh hưởng:** học hai giao diện cho một việc; số em khác nhau gây nghi ngờ.
6. **Phương án:** **chấm theo tuần thi** ở danh sách chấm (F-01); **xem / nhập cả lớp theo lượt** ở hồ sơ lớp + panel "Nhập điểm lớp"; bỏ `/nhap-diem`, `/bang-diem-thuong` (route chuyển hướng qua `duongMoi`); hồ sơ Mock chỉ nhập qua ô lớn / hộp chấm, bỏ nút "Hồ sơ học viên" trùng. → 05 · 07 (M5).
7. **Xuyên:** GV, QL, QT.
8. **Luật:** không.
9. **Kiểm thử:** route cũ chuyển hướng đúng lớp / lượt; cùng lớp × lượt → cùng số em ở mọi lối; ảnh cặp.
10. **Chủ SP (21/10):** **Q-C1** — chờ duyệt mockup Chấm Test.

#### AU-39 · Lưới Test lớp thường: 3 đường cho một ô, ⋯ đè ô "tổng", Progress thiếu chip SOS
`A·D` · **P1** · đã kiểm (đo DOM 40 cặp) · HT-11 · Mã: V3A-6, TST-08, TST-09, B-10, FB-3-02, FB-3-03, X-02, 9.2-26, 9.2-38 (hết hiệu lực)
1. **Ở đâu:** lưới lớp thường (Lịch Test, `/bang-diem-thuong`, hồ sơ lớp Progress / Final).
2. **Biểu hiện:** 3 đường cho một ô — gõ thẳng đúng / tổng · nút "Nhận xét" 66 px → hộp chỉ có chữ · ô đã có điểm → hộp "Sửa … Lý do" (không có nhận xét); nút ⋯ 28×28 `absolute` **không bị cắt mà đè 18×24 px (41 %) ô "tổng"**, chỉ hiện khi rê; menu ⋯ toàn thao tác hiếm (Dời lịch · Huỷ điểm · Vắng · Lịch sử · Dời hạn); 20 "Nhận xét" + 4 "Điền cả cột" mỗi trang; "tổng [25] Điền cả cột" nằm trên tiêu đề; Progress hiện chip đỏ "3/4 môn đạt" thay nhãn SOS theo số môn trượt (trái Rulebook §20.17); 3 em có nhận xét ≈ 8 bấm, 4 hộp.
3. **Bằng chứng:** `LuoiThuong.tsx:202, 367-381, 438, 505-509, 561-634`; `chamDiem.ts:81-92`; `v3a-cat.json`; ảnh `v3-lop-thuong-nut-3-cham-de-o-tong`, `a1-qt-thuong28--hover`, ảnh chủ SP v3-1.
4. **Nguyên nhân:** OV-4b nhét nút "Nhận xét" vào cột 190 px → ⋯ thành lớp phủ; lớp thường gõ thẳng còn FT dùng hộp; chưa theo §20.17.
5. **Ảnh hưởng:** số "25" như bị khuyết khi rê; nhận xét rời ô; GV mất bước.
6. **Phương án A** (đã chốt "nhận xét tuỳ chọn, trong hộp chấm"; cách làm PTA tự quyết — đảo HD2 ở máy tính, 02 4.7 #3): gõ số / bấm ô = mở **hộp chấm chung với FT** (nhánh đúng / tổng): đầu "G+V · em · Progress · thi W2 SEP · hạn 16/09"; "Đúng [17] / [25] · 68 % · chưa đạt (cần 70 %)"; "Nhận xét (tuỳ chọn)"; "＋ Lý do sửa" gập (chỉ khi sửa điểm có sẵn); chân: Vắng · Thêm ▾ (Lịch sử · Huỷ điểm · Dời hạn · Dời lịch — theo quyền) · Lưu · **Lưu · em tiếp ›** (Enter). Bỏ nút "Nhận xét", ⋯ trong ô, hộp "Sửa" riêng, "Điền cả cột" (thay "/25 ✎" mở hộp nhỏ). 375 giữ ô to gõ thẳng + "＋ Nhận xét" dưới hàng. Progress = chip SOS viền theo số môn trượt; đủ đạt "✓ Đạt" không nền. 3 em có nhận xét: ~8 bấm, 4 hộp → 1–2 bấm, 1 hộp; 20 em chỉ nhập điểm: bằng nay. So B (dải nhận xét dưới hàng — hàng nhảy), C (nới cột 190 → 230 px — không giải quyết). → 05 (Hộp chấm) · 04.
7. **Xuyên:** GV, QL; FT dùng chung hộp; hồ sơ lớp lớp thường.
8. **Luật:** V3 I.2 (nhận xét lớp thường tuỳ chọn); nhận xét MT bắt buộc ≥ 10 ký tự + nhóm nguyên nhân khi dưới kỳ vọng (giữ); MT cũ, MT0 tuỳ chọn; S chéo bắt buộc; §20.17; L3 (sửa sau lưu — AU-14).
9. **Kiểm thử:** `do-bang` phép đo "đè nhau" = 0 trên mọi ô lớp thường; không `button` trong `th`; Playwright: gõ "17" → hộp mở, Enter → em tiếp; lớp thường nhận xét trống vẫn lưu; MT nhận xét < 10 ký tự → chặn; Progress 2 môn trượt → chip "SOS 2 · …"; đếm bấm 3 em.
10. **Chủ SP:** không (12.9-8, 12.9-9 PTA tự quyết; báo đảo HD2).

#### AU-40 · Kế hoạch Test
`D` · **P1** · đã kiểm · Mã: TST-05, TST-06, TST-07, TST-14, TST-16, TST-24, TST-25, TST-26, TST-27, FB-0-12, 9.2-22, 9.2-23
1. **Ở đâu:** Test › Kế hoạch Test (QL, QT, Admin VP), hộp lịch một đợt, Xếp nhiều MT, Xếp lịch lớp thường.
2. **Biểu hiện:** ⓘ chú giải 4 đoạn và **nói sai màu** ("Xám = đã thi xong"; thật là xanh lá); chip "L R W S · chờ W1 JUL/2026", 9 trạng thái, "L R W S" ~99 chip, "/2026" 108 lần; "vào muộn" dưới 20/33 em (sai với FT cuốn chiếu); "✕ Không xếp được" 23 em, lý do chỉ ở `title`; dời em vắng: hộp → ⋯ → "Đổi tuần" → panel chồng hộp (3 lớp, 6–7 thao tác); 3 dáng hộp / panel trong một lưới, hộp 375 không có nền mờ; Xếp lịch lớp thường ngăn phải ↔ FT toàn màn, mở sẵn lớp đã hết khoá; "Cần xếp lại (5)" mà ghi 38 HV, "MT1 đang thi" sai với FT, lớp 0 HV vẫn hiện; tên không xếp theo ABC tiếng Việt.
3. **Bằng chứng:** `KeHoachTestTab.tsx:185-193` ↔ `OMt.tsx:22-31`; `ChipKyNang.tsx:121-142`; `shared/domain/keHoachTest.ts:89-95`; `NganXepLichMt.tsx:421-428`; `HopKyNang.tsx:291-293, 442-448`; `LuoiKeHoach.tsx:128-133`; `server/.../keHoachTest.ts:288` (ORDER BY theo byte); ảnh `a4-chu-giai-sai-mau`, `a4-panel-chong-hop-lich`, `kh-qt-mb-101-p1`, `kh-qt-hop-vang`, ảnh cặp `cap-08`, ảnh chủ SP v0-12a.
4. **Nguyên nhân:** chip FT đổi màu mà chú giải viết tay không đổi; OV-15c không đưa ô của mockup 4 vào phạm vi; luật "vào muộn" = ngày vào > khai giảng + 14 ngày; SQL sắp theo byte.
5. **Ảnh hưởng:** QL đọc nhầm trạng thái; dời một em vắng 6–7 thao tác; xếp MT cả lớp 7–9.
6. **Phương án:** ô theo mockup 4 (tuần + một chữ trạng thái; kỹ năng chỉ khi tách tuần; năm chỉ ở đầu cột / khi khác năm — đảo C20, 02 4.7 #1); email dưới tên, bỏ "vào muộn"; đầu lớp có GVCN · khai giảng; chú giải sinh từ `MAU_O_MT`, hiện dải chip mẫu; lý do "Không xếp được" ngắn trên hàng + gợi ý tuần sớm nhất hợp lệ; dời em vắng ngay trên dòng của hộp (một lớp, dùng nút Lưu của hộp); một hộp neo cho mọi thao tác "một em × một đợt"; một khung Xếp lịch (Lớp → Đợt → Tuần → HV); sắp `localeCompare(…, 'vi')`; 375 dạng thẻ. Dời em vắng 6–7 → 4–5; xếp MT cả lớp 7–9 → 5–6. → 05 · 06.
7. **Xuyên:** QL, QT, Admin VP (xếp / dời MT).
8. **Luật:** 19/10-M6 "Huỷ = Xóa" ở Kế hoạch Test (có điểm thì không xoá; ngoại lệ vắng 2 lần); luật 4 (F-02); quyền xếp lịch.
9. **Kiểm thử:** phép kiểm chú giải sinh từ `MAU_O_MT`; số "/2026" trên trang = số cột khác năm; sắp tên tiếng Việt ("Đ" sau "D"); `[role=dialog]` ≤ 1 khi dời; ảnh cặp mockup 4 khung 1, 5.
10. **Chủ SP:** không (9.2-22, 9.2-23 đã trả lời / PTA tự quyết).

#### AU-41 · Speaking chấm chéo
`D` · **P1** · đã kiểm · Mã: V3A-2, TST-12, TST-15, CV-24, CV-31, 9.2-12, 9.2-25, 12.9-6
1. **Ở đâu:** Lịch Test (FT "Tất cả"), Công việc › Chấm Speaking, hồ sơ Mock, hộp chấm.
2. **Biểu hiện:** GV 9 (S, MB + BC) mặc định "Lớp thường" nên không thấy bài S; chọn FT + Tất cả: dải "0/0 bài", ô "Quá hạn chấm **49** bài · 1 lớp" trong khi khối 1 ngay dưới "**0** · 2 lớp"; ô S của chính mình ghi "**GV khác**"; việc thật "Chấm Speaking · 24 bài" chỉ có ở Công việc; hộp ghi "Người chấm: Chưa chọn", còn lưới lấy người đang xem → QL / QT nhập hộ thành người chấm và **bị tính trễ** (T18); không hạn / quá hạn từng em (em quá hạn 47 ngày trông như tuần này); dòng "4 lớp" ↔ ô lọc "(5)"; bài đã chấm xen giữa; "Xem nhận xét" đổi sang trang Mock.
3. **Bằng chứng:** `HangLop.tsx:28-31`; `GvCham.tsx:42-52`; `PanelChamSpeaking.tsx:40, 93, 99-100`; `mywork.ts:530-559, 555`; API `{n:49}` ↔ `ft.no.bai=0`; ảnh `v3-speaking-cheo-gv-khac`, `b-gv9-tatca-ft-p1`, `gv9-xem-nx`.
4. **Nguyên nhân:** T18 "S không có GV mặc định" → máy gắn "GV khác", bài không vào `phan.toi`; ô quá hạn đếm mọi ô; hai hàm đếm lớp; luật người chấm (06/10) chỉ áp ở lưới.
5. **Ảnh hưởng:** GV S (thường là GV nước ngoài) bỏ sót bài; QL nhập hộ bị tính trễ sai người; 5 bấm cho việc 2 bấm.
6. **Phương án (T18 phần khác giữ):** nhóm riêng "Chấm Speaking chéo · 24 bài · không tính nợ" trong danh sách chấm của **mọi GV có kỹ năng S trong hồ sơ, kể cả không dạy lớp nào** (luật 21/10 — Q-C1; mã đã đúng từ OV-14c: `permissions.ts:289-297`, `prOv14c.tests.ts` OV14c-2), phạm vi chi nhánh; chữ "chấm chéo" thay "GV khác"; đếm theo phạm vi (ô quá hạn = khối 1 cùng phạm vi); có bài S chéo thì mặc định "Tất cả"; người chấm mặc định = chính GV có kỹ năng S ở mọi lối, QL / QT nhập hộ phải chọn người chấm; hạn hiện để nhìn (⚠, không tính nợ), quá hạn lên đầu; bài đã chấm gập cuối; "Xem nhận xét" mở tại chỗ. 5 → 2 bấm. → 05 (Chấm Test).
7. **Xuyên:** GV S, QL, QT, GVCN (nhận báo quá hạn).
8. **Luật:** **T18** giữ (quá hạn chỉ báo GVBM S + GVCN, không tính nợ; trễ tính cho người chấm thật); 18/10-S; **21/10: GV có kỹ năng S, kể cả không dạy lớp nào, được chấm chéo**.
9. **Kiểm thử:** API "ô quá hạn S = khối 1 cùng phạm vi"; GV 9 mở Lịch Test thấy nhóm S chéo không cần đổi lọc; QL nhập hộ không chọn người chấm → chặn; grep chuỗi "GV khác" = 0; ảnh GV Speaking trên bản chính (§5 #5).
10. **Chủ SP:** không (12.9-6 PTA tự quyết — gói đồng ý 21/10); luật S chéo 21/10 (Q-C1) đã ghi ở ý 6, 8.

### 2.8 Công việc
Hệ thống: AU-04 (panel 3 em), AU-05 (badge, hai hạn), AU-07, AU-08 (19 panel), AU-17 (việc sai người, tự mở lưới GV), AU-18 (Dán Excel còn trong panel). Duyệt → F-07. Chấm → F-01.

#### AU-42 · Danh sách Công việc dày đặc, không thứ tự (ảnh v4-1)
`D` · **P1** · đã kiểm (đo DOM) · HT-09 · Mã: V4A-01, CV-15, CV-17, CV-28, CV-29, FB-4-17
1. **Ở đâu:** `/cong-viec` (QT, QL, GV, GVCN, Admin VP; 1 440 + 375).
2. **Biểu hiện:** tiêu đề + 2 hàng lọc ("Của tôi 1 · Của GV 83 · Tất cả 84 · Xem việc của: một GV ▾ · ⚠ 33 quá hạn · 10 chờ bạn duyệt" + "Tất cả · Fast Track · Lớp thường" + Chi nhánh — 8 lựa chọn, 375 chiếm 3 hàng) → hộp "Chờ bạn duyệt" thẻ 95–130 px rộng hết trang (có thẻ BC FT 205 khi lọc Monbay) → 4 nhóm theo LOẠI (Chấm điểm 31 ⚠18 · Case học thuật 35 ⚠5 · Ý thức & Phối hợp 3 · Việc quản lý 15 ⚠8, gập) → khung phải trống "Chọn một việc ở danh sách" chiếm nửa màn; việc đầu tiên ở y 752 px (375: 1 505 px); 42–49 phần tử bấm được ở khung nhìn đầu; 24 dấu ⚠; GV thấy 4 dòng nợ 19–68 ngày đứng trước việc tuần này; "Việc quản lý" của QL chứa Bàn giao của GV; nhóm "Ý thức & Phối hợp" không chứa Phối hợp SOS / Báo PH (nằm ở Case học thuật, sau "Xem thêm"); một danh sách có 5 kiểu mở; chip "Bình thường", "Chưa có hạn" lặp; 4 dòng Bàn giao cho một lớp; lỗi tải → cả trang một câu đỏ.
3. **Bằng chứng:** ảnh chủ SP v4-1 (`2.jpg`); `shared/domain/tongQuan.ts:30-48, 34, 42-43, 68-83`; `HoTroHocVienTab.tsx:186-252, 290, 364-370, 418-421`; `WorkList.tsx:93`; `HopChoDuyet.tsx:191`; ảnh `qt1-dau-p1`, `qt1-375-p1`, `ql2-dau-p1`, `v2-ql2-375-p1`, `gv10-esc`, `L-gv7-loi`; ảnh cặp `cap-10` (mockup 3 Công việc QL: 3 lựa chọn lọc).
4. **Nguyên nhân (đã kiểm):** nhóm theo `group` của máy chủ, không theo người phải làm hay mức gấp; mỗi PR thêm một kiểu mở; bố cục hàng đợi GV áp cho QL; mockup 2 "Sau" cũng cùng dáng nhóm.
5. **Ảnh hưởng:** chủ SP: "dày đặc, chi chít, không thứ tự, đầu mục lộn xộn"; không biết việc gì cần làm, cho ai, vào đâu; GV làm nợ cũ trước việc gấp tuần này.
6. **Phương án (V4A "A"):** hàng đợi, mỗi dòng 3 vùng **Hạn · Việc + đối tượng · ›**; trái danh sách ~520 px, phải chi tiết; nhóm GV cố định, chia vạch Quá hạn / Tuần này / Sau; nợ cũ ≥ 14 ngày gom 1 dòng; Chờ duyệt chỉ còn một dòng dẫn (QL duyệt ở Tổng quan — Q-A1 ① 21/10); **một kiểu mở** (khung phải); thanh lọc 3 lựa chọn ("Của tôi · Của GV ▾ · …"), chi nhánh + chương trình lên khung trang (AU-16); bỏ chip thừa, gộp dòng Bàn giao; khung phải không trống (bối cảnh / "Việc kế") hoặc ẩn; lỗi theo khối. Nợ cũ 4–6 → 1; duyệt 10 thẻ 21 (5 đổi trang) → 11 (0); Admin xem GV trễ 2–3 → 1. → 05 (Công việc) · 06 · 07 (M2).
7. **Xuyên:** mọi vai có Công việc; Tổng quan (phân vai), chuông, badge.
8. **Luật:** 19/10-GV (GV trang nhà Công việc); không đổi luật sinh việc.
9. **Kiểm thử:** `v4a-dom.mjs`: ≤ 30 phần tử bấm được ở khung nhìn đầu; dòng đầu y ≤ 200 px (1 440) / ≤ 420 px (375); mọi dòng mở khung phải (một kiểu mở); ảnh cặp mockup mới (QT, QL, GV; 1 440 tối + 375 sáng).
10. **Chủ SP (21/10):** **Q-A1 ①**, **Q-A2 ①**; cần mockup mới.

#### AU-43 · Nút "Phân công…" sai ngữ cảnh; Case thiếu chủ không xong được (ảnh v4-2)
`D·E` · **P1** · nguyên nhân đã kiểm mã; bước "Lưu phân công" chưa bấm thử · HT-05 · Mã: V4A-05, CV-07, CV-08, CV-19, FB-4-21, MP-22
1. **Ở đâu:** Công việc QL / QT — dòng "Thêm PA học thuật Reading · SOS 3 · MB FOU 12 · Progress Test · quá hạn 18 ngày" + dòng trùng "Chọn người phụ trách" (hiện cả với GV 7 / 8 / 9); ngăn phủ "+ Giao việc", "Gia hạn", số "Lớp tôi dạy".
2. **Biểu hiện:** "Phân công…" mở cả ngăn "Thông tin lớp" (đổi phân công **cả lớp**) chồng lên panel Thêm PA đang mở; ô R đã có GV → bấm Lưu không đổi gì, dòng vẫn "Chưa có người"; "Chọn người phụ trách" mở panel Case không có ô chọn người, nút chính "Hoàn thành Case"; một Case thành 2 dòng; Giao việc / Gia hạn mở ngăn 560 px chồng panel.
3. **Bằng chứng:** ảnh chủ SP v4-2 (`3.png`); điều kiện hiện nút `chuaCoNguoi` `HoTroHocVienTab.tsx:279-280` (`ownerId === null && !mine && !owner && classId && !con` && không chấm chéo && `group` ∉ {chot_len_ft, xet_lai_lo_trinh, ky_vong_dau_ra, mgmt} + vai QL), nút `:366-370`, `PanelPhanCong :419`; `PanelViec.tsx:253-264` (chú thích sai); `mywork.ts:788-790` (`nguoiLamThemPa` trả nguyên `owner_user_id` NULL), `:932`, `:1193-1240`, `:1219-1220`; `cases.ts:711` → `cases/owner.ts:18-41` (`suggestCaseOwner`); `classes.ts:1095-1174` (`setClassTeachers` không chạm `sos_cases`); `seed/build.ts:596` (Case 14 thiếu chủ); ảnh `P-phancong-qt1`, `P-noowner-qt1`, `qt1-gia-han`, `ql2-giao-viec`.
4. **Nguyên nhân (đã kiểm mã):** chủ Case chỉ được gán khi tạo Case / chuyển lớp / cuối khoá, **không có API đổi chủ**; một dấu hiệu "chưa có người" dùng cho 3 tình huống (lớp thiếu GV môn · Case thiếu chủ · chủ hết quyền); web dùng lại panel lớp cho Case thiếu người.
5. **Ảnh hưởng:** QL đổi nhầm phân công cả lớp; việc Case thiếu chủ **không xong được**; GV bị kéo vào việc không phải của mình.
6. **Phương án (sửa gốc, không chỉ ẩn nút — MP XI.5):** máy chủ trả `thieuNguoi {gv-mon | chu-case | chu-het-quyen}`, web bỏ `chuaCoNguoi`; `chu-case` → tự gán theo `suggestCaseOwner`, có lịch sử, bỏ việc "Chọn người phụ trách"; `gv-mon` → hộp neo 1 ô cho môn thiếu, gán chủ Case trong cùng giao dịch; `chu-het-quyen` → "Đổi người…" (API mới); Giao việc / Gia hạn → hộp nhỏ / khung phải, không ngăn phủ; một Case một dòng, chỉ QL thấy. Bước: "không xong được" → 0 (tự gán); lớp thiếu GV 4–5 → 3, không ngăn phủ. → 05 · 07 (CV-LOI).
7. **Xuyên:** QL, QT, GV 7 / 8 / 9; Case 25 (CP FT 110); Xác nhận Case / Ghi nhận xét / Xác nhận PA khi chủ hết quyền; `xoaTaiKhoan.ts:183`.
8. **Luật:** chủ Case theo luật gán sẵn có (GV môn → GVCN — `suggestCaseOwner`); đổi chủ phải có lịch sử; 13/10-VAI.
9. **Kiểm thử:** API: Case chủ NULL + lớp có GV môn → `/my-work` không còn `no_owner`, `no_plan` có `ownerId`; GV không nhận `no_owner`; Playwright: không ngăn phủ nào mở trên panel đang mở (`[role=dialog]` ≤ 1); demo riêng: QL 2 "Lưu phân công" → tải lại, dòng hết "Chưa có người".
10. **Chủ SP:** không (dùng luật gán chủ sẵn có); v4a Q3 → PTA tự quyết, ghi vào 02 nếu coi là chạm quyền.

#### AU-44 · Dòng mở rộng ngay trong danh sách che tên việc + tên em (ảnh v4-3)
`D·E` · **P1** · đã kiểm (đo DOM); sau Lưu chưa bấm thử · HT-05 · Mã: V4A-06, CV-03, FB-4-22, MP-23
1. **Ở đâu:** Công việc · dòng "Kết quả PA Reading · <em> · MB FT 101" (ghi nhanh) ở 1 024 / 1 280 / 1 440; bấm dòng phụ gạch chân xanh (tên em · lớp · MT · GV).
2. **Biểu hiện:** form "Tiến triển (2 tuần)* · Nhận xét* · Lưu · Giữ nguyên PA · Điều chỉnh / Kết thúc…" mở ngay trong danh sách, **mất tiêu đề việc và tên em** (chỉ còn chip "SOS 1" + "hạn … ⚠"); khung phải trống; dòng cao 52 → 320 px; bấm lại dòng không thu; không có Esc / `aria-expanded`; focus kẹt ở nút rộng 0 px. 375 hiển thị đúng.
3. **Bằng chứng:** ảnh chủ SP v4-1, v4-3 (`2.jpg`, `4.png`); `WorkList.tsx:102-104, 148` (`col-span-full sm:col-start-2`); `HoTroHocVienTab.tsx:241-252, 389-409`; `do-v4a-dom1.json` (lưới `0px 494px`, nút tiêu đề rộng 0 px); ảnh `a2-ket-qua-pa-mat-ten`, `E-qt1-ghinhanh`.
4. **Nguyên nhân (đã kiểm):** **lỗi lưới CSS, không phải z-index** — từ 640 px khối mở rơi vào cột 2 (`auto` ~494 px), cột 1 `minmax(0,1fr)` co về 0; `DongDaLuu` nằm cùng chỗ nên sau Lưu tiêu đề vẫn mất (E); về thiết kế, OV-13b cho riêng Kết quả PA mở dưới dòng → một danh sách trộn 2 kiểu mở.
5. **Ảnh hưởng:** GV / QL không biết đang ghi kết quả cho em nào → ghi nhầm em.
6. **Phương án A:** mở ở **khung phải** như mọi việc; form gọn mặc định + bối cảnh PA (PA · kỳ trước); "Điều chỉnh / Kết thúc…" trong cùng panel; bỏ nhánh `laNhanh`; vẫn 3 bấm. (B chỉ sửa `sm:col-start-1` → còn 2 kiểu mở.) Luật mở toàn web: danh sách có khung phải → mở ở khung phải; bảng rộng → mở dưới hàng, giữ đầu hàng, Esc để thu (X-39). → 05 (Thang làm tại chỗ).
7. **Xuyên (đã rà):** grep `col-start-2` không thấy chỗ lỗi khác; `NganDanhSach` (`SoLieu.tsx:152-209`) mở đúng nhưng trộn kiểu; thẻ Chờ duyệt "Mở" đổi trang (F-07). Vai: GV, GVCN, QL, QT.
8. **Luật:** nhận xét Kết quả PA ≥ 8 ký tự; hạn kết quả PA 2 tuần (14/10-OV12).
9. **Kiểm thử:** DOM ở 1 024 / 1 280 / 1 440 / 375: mọi `[data-hd=cv-dong] > button` rộng ≥ 50 % dòng; mở việc → khung phải có tên việc + tên em; bấm lại / Esc thu; demo riêng: GV 7 chọn "Tiến bộ một phần" + gõ 8 ký tự → Lưu → dòng "✓ Đã lưu" còn tiêu đề.
10. **Chủ SP:** không (v4a Q4 → PTA tự quyết theo X-39).

#### AU-45 · Panel Nhập điểm ở Công việc = khung "Trước" của mockup 2
`D` · **P1** · đã kiểm · HT-11 · Mã: CV-04, CV-11, CV-12, CV-18, CV-21, CV-26, TST-21, FB-0-03 (em ngoài việc: CV-01 ở AU-04; Dán Excel: V4A-07 ở AU-18)
1. **Ở đâu:** Công việc › panel Nhập điểm (GV, QL, QT; 1 440 + 375).
2. **Biểu hiện:** tiêu đề "Nhập điểm · W1 JUL" ≠ tên việc; 2 link ↗ rời sang Test (trang đích không có "‹ Công việc"); bảng 404 px trong panel 825 px, 4 nút dồn mép phải; "Cả lớp" thực ra chỉ thêm cột; cột "Kết quả: Chờ 4 kỹ năng" vô ích với GV chấm một kỹ năng; thiếu "Mẫu nhận xét", "Việc i/N · Còn n bài", "✓ Xong · Hoàn tác" (mockup 2 bị bỏ không lý do); 375 việc một kỹ năng hiện tab cả 5 kỹ năng (2 hàng), "0/3" cho việc 2 bài, viết tắt "KV"; panel nhiều lớp: mỗi lớp một hàng gập, tiêu đề lấy tuần đầu; 20 nút.
3. **Bằng chứng:** `PanelViec.tsx:211-219`; `LuoiFT.tsx:168, 420`; `LuoiChamLop.tsx:160`; ảnh `a2-panel-nhap-diem-ban-truoc` ↔ `a2-mockup2-khung-truoc` / `a2-mockup2-khung-sau`, `gv10-luoi-day-du-p1`, `v2-gv10-375-mo-p1`, `gv7-w3sep`; ảnh cặp `cap-07`; ảnh chủ SP v0-3.
4. **Nguyên nhân:** OV-15b không đổi vỏ panel; `w-full` chỉ khi không có `chiCot`; "Mẫu nhận xét" không được đưa vào kế hoạch.
5. **Ảnh hưởng:** GV nhập 3 lớp cuối buổi (20 bài) ≈ 8–10 bấm (sửa con trỏ sai em, mở hàng gập, kéo về việc); 20 nhận xét gõ tay.
6. **Phương án (theo mockup 2 "Sau" — đã duyệt):** đầu = tên việc + hạn ("MT2 · thi W2 SEP · hạn 16/09"); thân chỉ đối tượng của việc, "Việc i/N · Còn n bài", "Hiện cả lớp" là công tắc thật; bỏ 2 link ↗; bảng rộng hết panel; cột Kết quả trống tới khi có điểm, rồi Đạt / Chưa đạt của kỹ năng đó; "Mẫu nhận xét" (3 câu gần nhất + "Như em trước"); dải "✓ Xong · Hoàn tác 10 s"; 375 chỉ tab của việc, đếm theo bài; nhiều lớp: mở sẵn ≤ 3 hoặc "Lớp 1/3 ›"; bỏ Dán Excel. 8–10 → 3 bấm, 0 chuyển trang. → 05 · 06 · 07 (M2).
7. **Xuyên:** GV, QL, QT; cùng nguồn với chấm Test (F-01).
8. **Luật:** quyền ô theo vai; nhận xét MT bắt buộc ≥ 10 ký tự.
9. **Kiểm thử:** tên đầu panel = `tenViec(it)`; không có `a[href*="/test"]` trong panel; bảng rộng = panel (DOM); 375 số tab = số kỹ năng của việc; ảnh cặp mockup 2 khung "Sau".
10. **Chủ SP:** không (mockup 2 đã duyệt — 9.1-1; 9.2-9, 9.2-11).

#### AU-46 · Hàng đợi tự sang việc kế sai; Hoàn tác mất; có thể mất chữ đang gõ
`D·E` · **P1** · đã kiểm mã; G1–G3 cần demo riêng · Mã: CV-05, G1, G2, G3, 9.2-8
1. **Ở đâu:** Công việc (mọi vai); hàng đợi Tổng quan sau khi làm lại.
2. **Biểu hiện:** sau Lưu, hàng đợi tự sang việc khác loại / đang gập / không phải của mình / đang ẩn; "Hoàn tác 10 s" bị thay ngay; **G1** danh sách tải lại có thể làm mất chữ đang gõ ở ô khác; **G2** "‹ việc vừa xong" mở lại form Thêm PA **trống** → dễ thêm PA lần hai; **G3** sau Esc focus không về dòng việc.
3. **Bằng chứng:** `HoTroHocVienTab.tsx:175, 202-207, 224-229`; `KhuonViec.tsx:131`; mockup 2 khung 1e (đã duyệt: việc kế cùng loại).
4. **Nguyên nhân:** `keTiep` lấy mọi việc có panel.
5. **Ảnh hưởng:** GV lạc việc; mất chữ; thêm PA trùng.
6. **Phương án:** việc kế = cùng nhóm, của chính tôi, đang hiện; dải "✓ Xong · Hoàn tác 10 s" không bị thay; "‹ việc vừa xong" mở bản đã lưu (sửa được — L3), không form trống; Esc trả focus về dòng. → 05.
7. **Xuyên:** GV, GVCN, QL, QT.
8. **Luật:** L3; 11/10-UX "không mất chữ đang gõ".
9. **Kiểm thử:** phép kiểm đơn vị `keTiep` (nhóm × người × hiện / gập); demo riêng: G1 lưu ô cuối việc "2 bài" rồi gõ ngay vào ô em khác → chữ còn; G2 "‹ việc vừa xong" sau Thêm PA → hiện PA đã thêm; G3 `document.activeElement` sau Esc = dòng việc.
10. **Chủ SP:** không (9.2-8 theo mockup đã duyệt).

#### AU-47 · Các panel việc khác: Chốt lộ trình, Ghi nhận vi phạm (lô), Thêm / Xác nhận PA, Điền Target
`D` · **P2** · đã kiểm · Mã: CV-20, CV-22, CV-23, CV-25 (tên ≠ việc: CV-13 ở AU-08; hai hạn: CV-14 ở AU-05; "Mở" thẻ duyệt: CV-27 ở F-07; Xem nhận xét S: CV-31 ở AU-41)
1. **Ở đâu:** Công việc: Chốt lộ trình, Ghi nhận vi phạm (lô), Thêm PA / Xác nhận PA, Điền Target.
2. **Biểu hiện:** Chốt lộ trình ở Công việc chuyển trang sang hồ sơ lớp, ở Tổng quan mở tại chỗ (panel toàn màn, nút chốt chỉ hiện sau khi chọn từng em); Ghi nhận vi phạm (lô) không thấy ngày, lỗi gì, ai ghi; Thêm PA: Loại PA là ô chọn, thiếu "Người thực hiện"; Xác nhận PA bắt gõ ≥ 15 ký tự; Điền Target mở cả form Sửa thông tin, ô Target nằm dưới màn.
3. **Bằng chứng:** `PanelViec.tsx:36-40, 133`; `TongQuanQl.tsx:245`; ảnh `gv7-ghi-nhan-vp`, `gv10-them-pa`, `gv7-xn-pa`, `bam-chotlotrinh`.
4. **Nguyên nhân:** `chot_len_ft` không làm tại chỗ; lệch panel v3 (§3, §6); dùng lại form lớn.
5. **Ảnh hưởng:** thêm bước, đổi trang; GVCN ghi nhận mà không biết vi phạm gì.
6. **Phương án:** Chốt lộ trình dùng `BangLoTrinhTiep` tại chỗ, một panel cho cả Tổng quan và Công việc, dòng ghi "đã đề xuất x/y", nút "Chốt các em đã có đề xuất (x)" cố định ở chân; Ghi nhận lô: mỗi em một dòng con ngày · lỗi · người ghi; Thêm / Xác nhận PA theo panel v3 (Xác nhận bấm thẳng — kiểm trước ngưỡng 15 ký tự là luật giao diện của PR, không phải Rulebook); Điền Target: panel một ô, con trỏ đặt sẵn. Chốt lộ trình 6 lớp 40–60 bấm → ≈ 12. → 05.
7. **Xuyên:** QL, QT, GVCN, GV; Tổng quan (Chốt lộ trình), hồ sơ HV (AU-35).
8. **Luật:** Target qua QL duyệt khi là đề xuất sửa (H27 giữ).
9. **Kiểm thử:** Chốt lộ trình từ Công việc: pathname không đổi; Ghi nhận lô có cột ngày / lỗi / người; Điền Target focus đúng ô; ảnh cặp panel v3.
10. **Chủ SP:** không.

#### AU-48 · Trang con Công việc; "Lớp tôi dạy" tràn thẻ
`D` · **P2** · đã kiểm · Mã: CV-10, V4C-12, v4c (Vận hành, Báo cáo đơn vị) (B-01 ở AU-01; CV-32 ở AU-24; CV-33 ở AU-16)
1. **Ở đâu:** "Lớp tôi dạy" (trang chính GV ≥ 1 280 px); `/cong-viec/cho-duyet` (QL / QT); `/cong-viec/yeu-cau` (GV); `/cong-viec/van-hanh`; `/cong-viec/bao-cao`.
2. **Biểu hiện:** bảng "Lớp tôi dạy" 760–780 px tràn thẻ 560 px (201 px); `/cho-duyet`: ô tick chỉ có ở thẻ duyệt hàng loạt được → chip loại nhảy 54 ↔ 78 px, hai dải nút đoạn cùng dáng (trạng thái ↔ loại); `/yeu-cau`: thẻ tự gửi 4–5 nút, nhãn "Lịch thi" cho thẻ dời MT; Vận hành: cột "Việc con" toàn "–", 375 cuộn ngang; Báo cáo đơn vị: ô tuần dáng thứ 3 + "Kỳ".
3. **Bằng chứng:** `LopToiDay.tsx:92-93`; `index.css:188-189`; `TheYeuCau.tsx`; ảnh `b-lop-toi-day-tran-the`, `b2-cv-choduyet-ql-p1`, `b2-cv-yeucau-gv7-p1`.
4. **Nguyên nhân:** lớp `bang-dinh` bỏ khung cuộn khi dời sang cột hẹp; thẻ duyệt dùng chung ở 5 nơi.
5. **Ảnh hưởng:** GV thấy bảng vỡ ở trang đầu; QL dò chip lệch.
6. **Phương án:** bỏ `bang-dinh` ở "Lớp tôi dạy" (hoặc đưa ra bề rộng trang / khung phải); `/cho-duyet`: cột tick luôn giữ chỗ, dải "loại" thành chip lọc, Sửa · Rút vào ⋯, về lâu dài thay bằng nhóm Chờ duyệt của hàng đợi (F-07) và chuyển hướng link cũ; Vận hành bỏ cột trống, 375 dạng thẻ; ô tuần theo AU-11; nhãn thẻ "Dời lịch Test" (AU-13).
7. **Xuyên:** GV, QL, QT.
8. **Luật:** L3 (GV sửa / rút yêu cầu còn chờ, có lịch sử).
9. **Kiểm thử:** `do-khung` đo "bảng rộng hơn thẻ" = 0; vị trí x chip lệch ≤ 1 px; link `/cong-viec/cho-duyet` cũ chuyển hướng đúng.
10. **Chủ SP:** không.

### 2.9 Phân tích (6 tab + Báo cáo)
Hệ thống: AU-04 (Theo tháng P0, PA trong kỳ), AU-05 (4 bộ số SOS / Đạt), AU-06 (gạch chấm, panel tên, 9 chỗ sai ngữ cảnh — có A5-07, A5-15, A5-19), AU-11 ("Toàn bộ" riêng Phân tích; hộp che "Tùy chọn" A5-13), AU-12 (bộ chọn tự đóng), AU-16 (ô Chi nhánh tách hàng lọc — A5-09), AU-18 (xuất), AU-20 (Test + SOS 17 cột ở 375 — A5-20). Test + SOS: bỏ 3 cột việc (AU-49, T1).

#### AU-49 · Báo cáo lệch mockup (~36 %), báo cáo lẫn việc, In thiếu dòng
`A·D` · **P1** · đã kiểm · HT-16 · Mã: V3B-04, V3B-05, A5-18, A5-22, A5-35, FB-0-09, FB-3-10, FB-3-11, X-16, X-23
1. **Ở đâu:** Phân tích › Báo cáo (1 440, 375, In) + 5/7 nhóm bảng Phân tích có cột / khối việc.
2. **Biểu hiện:** khớp mockup 3 khung 3 ~36 % (18 quyết định: 2 KHỚP · 9 MỘT PHẦN · 7 KHÁC): đầu trang 4 hàng (mockup 1); **không có chế độ chiếu** (chỉ sáng khi In); khối số xếp dọc + gạch chấm (mockup: ô viền + chữ ngang "41 ✓ Đạt"); SOS theo lớp là số trơn (mockup: chip màu, SOS tạm viền đứt, hàng tổng nền nhấn); panel "Chưa đạt" 14 cột cuộn ngang, không "Kỹ năng cần cải thiện", không nút việc; In chỉ 10 dòng / bảng, ẩn "Dữ liệu đến"; Báo cáo lớp thường không có khối Đạt Progress / Final; 5/7 nhóm bảng có cột việc tính theo hôm nay (Test + SOS "HV - Case · Chưa chốt PA · Đang xử lý"; Kết quả thi "Case / PA · Việc tiếp"; chân Hiệu quả PA; Báo cáo "bài quá hạn"; Ý thức) → in kỳ cũ ra số hôm nay; "Báo cáo" ↔ "Báo cáo đơn vị" gần trùng tên (tên đã chốt — chỉ nêu).
3. **Bằng chứng:** ảnh cặp `mk3-bc--bc1440` ↔ `bc-ql-1440`, `mk3-bc--panel` ↔ `bc-ql-pn-chuadat`, `v3-mockup3-bao-cao` ↔ `v3-bao-cao-web`, `cap-06`; `BaoCao.tsx:87, 97, 126`; `phanTich.ts:252` ("tính theo hôm nay"); `v3b-do.json`; PR #462; ảnh chủ SP v0-9.
4. **Nguyên nhân (đã kiểm):** kế hoạch dịch "mở sáng, chữ lớn để chiếu" thành "sáng khi in"; dùng lại `SoLieuO` gạch chấm + panel tên chung; rà PR không có ảnh cặp; mỗi bảng sinh thêm cột việc (PR-HK2, PR-YT4).
5. **Ảnh hưởng:** giao ban không chiếu được; in thiếu dòng; số kỳ cũ sai nghĩa; lớp thường không có chỗ xem kết quả.
6. **Phương án K1:** PR tài liệu sửa mockup 3 khung 3 phần (c) nâng được (panel "Chưa đạt" 5 cột gộp điểm; "bài chấm trễ trong kỳ" thay "bài quá hạn tới hôm nay"; khối "tại hôm nay" ghi rõ khi xem kỳ cũ — X-23; QT bảng "Theo chi nhánh") + vẽ khung "Chiếu" (d) → máy chủ trước (A5-02, nguồn panel trả cột cụ thể, "chấm trễ trong kỳ", "Theo chi nhánh") → **một PR màn M6**: bảng truy vết 18 dòng + ảnh cặp 1 440 / 375 / Chiếu → cổng ≥ 90 % → chủ SP duyệt. **Báo cáo thuần T1:** bỏ cột việc khỏi hiển thị (dữ liệu giữ; Test + SOS 14 → 11 cột); ngoại lệ Thi thật giữ "Bước tiếp trên hàng" (mockup 6 khung 6), khối "tại" ghi rõ; "Đúng hạn" ở Phân tích GV là đánh giá việc đã làm — giữ. In đủ dòng + "Dữ liệu đến". Vá từng chỗ (K2) chỉ tới ~60 %. → 06 (Báo cáo) · 05 · 07 (M6).
7. **Xuyên:** QL, QT, CX; mọi tab Phân tích.
8. **Luật:** V3 II.2, II.3 (đã chốt); C24 (2 tuần hoàn chỉnh trước); 19/10-BC; 9.1-4.
9. **Kiểm thử:** In PDF > 10 dòng: đủ dòng + "Dữ liệu đến"; "Chiếu" không cuộn ngang ở 1 280; bảng Phân tích không còn cột việc (danh sách cột theo từ điển); số kỳ cũ không đổi khi xem lại vào ngày khác; ảnh cặp mockup đã sửa, chấm 18 dòng ≥ 90 %.
10. **Chủ SP (21/10):** **Q-C2 ①** — duyệt cả bốn (Chiếu · "bài chấm trễ trong kỳ" · "Theo chi nhánh" · khối lớp thường).

#### AU-50 · Phân tích › Ý thức: bảng "Học viên cần chú ý" là hàng đợi việc; "báo trễ"
`A·D` (chữ "báo trễ": E — cần ảnh) · **P1** · đã kiểm mã · HT-16 · Mã: V3B-06, A5-29, 12.9-15
1. **Ở đâu:** Phân tích › Ý thức (bảng "Học viên cần chú ý", "Lớp nhiều vi phạm", panel, tệp Excel).
2. **Biểu hiện:** "Học viên cần chú ý" thực chất là hàng đợi việc tính tại hôm nay (Quá hạn · Bắt buộc · Chờ QL duyệt + bậc hiện tại / bậc kế); chỉ cột "Vi phạm" theo khoảng; panel "Chưa xử lý" chỉ lặp chữ + "Mở trang ↗" (không làm được gì); cùng tập em có ở 3–4 nơi; "So kỳ trước" hai kiểu ("Tăng 1 HV" ↔ "↑24" đỏ); chủ SP nói "báo trễ" — tab không có chữ "trễ" (có "Quá hạn", "Chờ QL duyệt", "QL từ chối"; Phân tích GV có "Đúng hạn › Xử lý vi phạm").
3. **Bằng chứng:** `yThucPhanTich.ts:116-139`; `YThucPhoiHop.tsx:77-81`; ảnh `v3-y-thuc-hang-doi-viec`, `pt-yt-ql-pn-mo`.
4. **Nguyên nhân:** PR-UX4 đặt bảng để QL nhìn nhanh em cần xử lý; PR-YT4 đổi định nghĩa sang cửa trạng thái hôm nay.
5. **Ảnh hưởng:** báo cáo lẫn việc; số đổi theo giờ xem; một việc 3–4 nơi.
6. **Phương án Y1:** bỏ bảng "Học viên cần chú ý" khỏi hiển thị + bỏ sheet đó khỏi Excel (dữ liệu giữ); "Lớp nhiều vi phạm" → "Vi phạm theo lớp" (bỏ "Chưa xử lý", thêm "Loại nhiều nhất", "±" chữ trung tính); thêm "Theo loại vi phạm" và "Xử lý đã làm trong kỳ theo loại"; một dòng đầu tab "6 em đang chờ xử lý — ở Hồ sơ lớp › Ý thức ›" (đổi trang đúng lọc); sau F-03 thêm số "TVV đã báo PH n / n" trong kỳ (số đã xảy ra). → 05.
7. **Xuyên:** QL, QT, CX; Hồ sơ lớp › Ý thức, Công việc, Tổng quan.
8. **Luật:** không đổi cửa trạng thái, thang 6 bậc, hạn 5 ngày; MP IX.4 (bỏ khỏi hiển thị, không xoá dữ liệu).
9. **Kiểm thử:** tab Ý thức không còn cột trạng thái việc; tệp xuất còn 3 sheet; "So kỳ trước" một kiểu chữ trung tính; ảnh "báo trễ" từ chủ SP (§5 #17).
10. **Chủ SP:** không (12.9-15 PTA tự quyết) + **cần ảnh** chữ "báo trễ".

#### AU-51 · Phân tích GV
`D` · **P2** · đã kiểm · Mã: A5-11, A5-14, A5-17, FB-0-11, X-35, 9.2-30
1. **Ở đâu:** Phân tích › Phân tích GV.
2. **Biểu hiện:** câu hướng dẫn + dòng chú giải dài (ảnh v0-11); bảng cũ 12 cột (khung 4c đã duyệt: 7 cột); 42/70 ô "—" / "không có" / "mẫu nhỏ"; chọn > 13 tuần → báo lỗi, "Thử lại" vô dụng; panel "Chấm đúng hạn" → link Lịch Test không lọc lớp / đợt.
3. **Bằng chứng:** `PhanTichGiaoVien.tsx:103-117`; `a5-gv-20tuan`; ảnh `a5-ql-gv-cham--lich`, ảnh cặp `cap-05`, ảnh chủ SP v0-11.
4. **Nguyên nhân:** PR #462 giữ bảng cũ (C30 "giữ chiều sâu"); bộ chọn chung 52 tuần trong khi máy chủ chỉ nhận ≤ 13; link không mang lớp – đợt.
5. **Ảnh hưởng:** QL tìm GV chấm trễ → bài trễ 4–5+ bấm, 2 đổi trang, phải nhớ lớp / đợt.
6. **Phương án:** khung 4c (7 cột), chiều sâu chuyển vào panel từ số (đúng GV, đúng khoảng); bỏ câu dài (ⓘ ngắn); "⚠ n bài quá hạn" mở panel "Chấm trễ · GV" dùng chung với Báo cáo; link sâu đúng lớp + đợt; mặc định 4 tuần, tự kẹp 13 tuần (hoặc nâng trần sau khi đo); thêm Xuất. 4–5+ → 3 bấm, 1 đổi trang. → 06 · 07 (M6).
7. **Xuyên:** QL, QT, Admin VP; TVV / CX không thấy (11/10-TVV).
8. **Luật:** C30 thay một phần bởi khung 4c (9.1-1).
9. **Kiểm thử:** chọn 20 tuần → không lỗi, nhãn ghi đã kẹp; link panel → Lịch Test có lớp + lượt; ảnh cặp khung 4c.
10. **Chủ SP:** không.

#### AU-52 · Kết quả thi (Mock, Thi thật): "Thôi học" lưu ngay, mất công tắc, panel cuộn ngang
`D` (Thi thật: cần dữ liệu) · **P1** · đã kiểm mã · Mã: A5-08, A5-10, A5-16, A5-25, FB-0-10
1. **Ở đâu:** Phân tích › Kết quả thi › Mock / Thi thật (+ menu Bước tiếp).
2. **Biểu hiện:** "Thôi học" ở menu Bước tiếp lưu ngay, không Hoàn tác; công tắc FT / LT biến mất, không có chữ báo "Fast Track"; panel Mock bảng 1 180 px trong panel 720 px (cuộn ngang); ô trống "chưa có" ↔ "—"; link bị `truncate` cắt; demo 0 lượt thi thật có kết quả (chỉ rà một phần).
3. **Bằng chứng:** `KetQuaThi.tsx:197-216`; `PhanTich.tsx:86`; `pb2bSeed.ts:187`; ảnh `a5-L-bc-pn-mock--pn`, ảnh chủ SP v0-10.
4. **Nguyên nhân:** mockup 6 cho lưu ngay mà thiếu đường sửa; thiếu nhãn ngữ cảnh; bảng đủ cột trong panel hẹp; seed thiếu.
5. **Ảnh hưởng:** QL / TVV bấm nhầm "Thôi học" khó gỡ; không biết đang xem FT.
6. **Phương án:** "Thôi học" có toast Hoàn tác 8–10 s + mục màu nguy hiểm; chữ cố định "Fast Track" + ⓘ (tab chỉ Mock + Thi thật — 19/10-M6); panel Mock theo `PanelChiSo` ≤ 6 cột; ô trống theo luật chung (AU-13); tab đổi tên "Kết quả Test" (AU-13); seed thi thật có kết quả. → 05 · 07.
7. **Xuyên:** QL, QT, TVV (Bước tiếp sau thi).
8. **Luật:** 19/10-M6 (chỉ Mock + Thi thật, đếm theo lượt); 14/10-OV12 (TVV chọn Bước tiếp cả 3 hướng).
9. **Kiểm thử:** demo riêng: "Thôi học" → toast Hoàn tác, Hoàn tác trả trạng thái; panel không cuộn ngang ở 1 440; seed có ≥ 1 lượt thi thật mỗi trạng thái; ảnh menu Bước tiếp + toast.
10. **Chủ SP:** không.

#### AU-53 · Hiệu quả PA → "Vấn đề & PA"
`B·D` · **P2** · đã kiểm demo; cần dữ liệu thật · HT-16 · Mã: V3B-10, A5-21, FB-3-15, 12.9-19
1. **Ở đâu:** Phân tích › Hiệu quả PA.
2. **Biểu hiện:** xếp theo ~30 mã vấn đề → Monbay FT 26 tuần chỉ 10 PA, cả 10 dồn vào hàng gập "8 vấn đề khác" → không thấy loại PA nào; "mẫu nhỏ" + "Ít dữ liệu" trùng; "Thời gian thường mất" luôn "—"; cột số lệch 45–47 px; không có "em nào PA không ăn thua"; mặc định 2 tuần gần trống; bảng "Tổng hợp vấn đề HV" đã bỏ ở OV-15e (bản chính 18/10 có thể còn) → câu "kỹ năng nào nhiều vấn đề nhất" không còn nơi trả lời.
3. **Bằng chứng:** `hieuQuaPa.ts:15-19`; phép kiểm đã bỏ `phanTich.tests.ts:303`; ảnh `pt-pa-ql-26t-mo-p1`, `a5-pt-pa-mb`; demo 19 PA xong / 7 loại.
4. **Nguyên nhân:** xếp theo mã lỗi nên mỗi ô < 5 PA; mặc định 2 tuần + gập.
5. **Ảnh hưởng:** Chị Vy không trả lời được "PA nào hiệu quả".
6. **Phương án H2** — một bảng "Vấn đề & PA": hàng lớn = kỹ năng (L · R · W · S · G+V), hàng con = vấn đề (nhóm nguyên nhân); cột HV có vấn đề (thanh một màu) · Đã có PA · PA có kết quả · Có cải thiện % · PA đã dùng ("Tutor 3/4 · Tự học 1/3" + "Nên dùng" đúng luật hiện tại, ở cấp vấn đề) · Không tiến bộ n (ô số → panel C); dòng tóm tắt đầu bảng; khối PA quy chế giữ riêng; mặc định "Toàn bộ"; máy chủ khôi phục đếm theo kỹ năng / nhóm nguyên nhân. So H1 (giữ hai bảng — phải tính lại "Nên dùng" ở cấp loại PA, đụng luật), H3 (theo loại PA — mất liên hệ vấn đề ↔ PA), H4 (ma trận nhiệt — mẫu thưa, % 0 / 100 gây hiểu lầm). → 05 · 06.
7. **Xuyên:** QL, QT.
8. **Luật:** không đổi logic PA ("Nên dùng"; ≥ 5 PA mới xếp hạng).
9. **Kiểm thử:** khôi phục phép kiểm `phanTich.tests.ts:303`; 3 câu của Chị Vy trả lời ≤ 1 bấm (bấm thử); ảnh cặp mockup mới.
10. **Chủ SP:** không (PTA tự quyết, mockup duyệt) + **cần dữ liệu**: số PA kết thúc / tháng / chi nhánh; lớp thường có cần bảng này không.

### 2.10 Tutor

#### AU-54 · Tutor: mở ra rỗng, chip chồng nghĩa, cột trống, hộp chồng
`B·D·E` · **P1** (trang rỗng) · lỗi UI đã kiểm; UX cần dữ liệu thật · HT-21 · Mã: A5-06, A7-16, V3B-11, V3B-12, A5-26, A5-27, A5-32, A5-34, FB-0-02, FB-3-16, X-34, 9.2-34
1. **Ở đâu:** `/tutor`, panel một tutor; Head tutor (trang duy nhất), QT, QL.
2. **Biểu hiện — lỗi UI đã thấy:** mở ra rỗng (mặc định "Đang dạy" = 0); chip 0 + 0 + 1 + 1 ≠ 8 (5 chip chồng nghĩa: "Cần chú ý" tính mọi thời gian, "Đang dạy" theo khoảng, "Thiếu thông tin" là dữ liệu thiếu chứ không phải trạng thái); cột "Cần chú ý vì" rộng 418 px trống cả 8/8 dòng; panel: tiêu đề "Feedback G…" bị cắt + có bộ chọn thời gian thứ hai + tiêu đề khối IN HOA nhỏ; số lệch đường cơ sở 8 px; chữ 12–13 px; 375 bộ lọc ~460 px trước tutor đầu, chữ vụn "Tài liệu đúng / hạn", thẻ toàn "—"; hộp Thêm chồng hộp Gộp; Tải danh sách giải thích 2 dòng, chữ sát mép; nút chính "Tải danh sách" (đúng mockup tutor) trong khi việc hằng ngày khác; Theo tháng sai (AU-04); bộ chọn tự đóng (AU-12). **Cần dữ liệu / giả thuyết:** demo 8 tutor, 2 buổi, 1 nhận xét, buổi ghi theo giờ thật 20/10; có cần SĐT trên hàng; Head tutor có lọc nơi dạy / kỹ năng hằng ngày.
3. **Bằng chứng:** `TutorPage.tsx:21-58, 199-202`; `server/src/tutors/trang.ts:48-80`; `TaiDanhSach.tsx:110`; `pb2bSeed.ts:187`; `v3b-do.json`; ảnh `a5-tutor-rong`, `v3-tutor-cot-trong`, `tu-ht-macdinh`, `tu-qt-pn-lan`, `a5-L-375-tu-tatca-p1`, ảnh cặp `cap-09`, ảnh chủ SP v0-2.
4. **Nguyên nhân:** "Đang dạy" theo buổi trong 2 tuần + seed ngày thật; chip trộn trạng thái với dữ liệu thiếu; vẽ cả hai hộp.
5. **Ảnh hưởng:** Head tutor tưởng không có dữ liệu; 5–9 bấm cho tutor đầu, 4 mỗi tutor sau, không tự mở tutor kế.
6. **Phương án F1 + B1:** khối **"Việc của bạn"** 1–3 dòng (Cần chú ý · tên gõ tay · thiếu thông tin); chip Đang dạy · Ngừng · Tất cả (mặc định Tất cả khi Đang dạy = 0); một hàng `Tìm · [chip] · Thời gian · Lọc ▾ (Nơi dạy, Kỹ năng)`; cột "Kết luận / lý do" thay "Cần chú ý vì" (cần chú ý → chữ cam lý do; không → chip kết luận + ngày); tutor 0 buổi → một ô "chưa có buổi"; hàng 44 px; panel dùng khoảng của trang (**Khoảng tuần mặc định 4 tuần gồm tuần này, không "Toàn bộ"** — PTA #7); Thêm mở dưới dòng (không chồng hộp); nút chính "Thêm tutor", "Tải danh sách" phụ (02 4.7 #6); sau "Lưu nhận xét" tự mở tutor cần chú ý kế; 375 theo mockup m7; seed theo ngày demo. Head tutor 5–9 → 3 bấm. → 05 · 06 · 07 (M7).
7. **Xuyên:** Head tutor, QT, QL.
8. **Luật:** không đổi định nghĩa "Cần chú ý", "Đang dạy", "Ngừng hợp tác"; không tạo luật mới khi thiếu dữ liệu (MP X).
9. **Kiểm thử:** với SEED-UX: /tutor mặc định có dòng; tổng chip = Tất cả; cột lý do không trống khi có tutor cần chú ý; `[role=dialog]` ≤ 1 khi Gộp + Thêm; Playwright bộ chọn trong panel không tự đóng; ảnh cặp mockup tutor + ảnh bản chính sáng thứ Hai (§5 #15).
10. **Chủ SP:** không (12.9-20 PTA tự quyết) + **cần dữ liệu** 7 ý (02 4.8 #3).

### 2.11 Quản trị

#### AU-55 · Quản trị: Tạo ≠ Sửa, trang quyền dài, chuyển hướng im lặng
`D` · **P2** · đã kiểm (ma trận quyền chưa có ảnh vòng 4) · Mã: A5-23, A5-24, A5-30, A5-31, 9.2-35
1. **Ở đâu:** `/quan-tri` (Tài khoản, Quyền & nhật ký, Chương trình / danh mục).
2. **Biểu hiện:** Tạo tài khoản là một panel, Sửa đi hai đường; "Quyền & nhật ký" dài 5 248 px, 4 ô số thừa, nhật ký không lọc / phân trang; tên kỹ năng dài, lọc W gộp, sắp tên sai tiếng Việt; Admin VP / TVV gõ `/quan-tri`, `?goc=y-thuc` → chuyển hướng im lặng; không sửa chi nhánh trên web.
3. **Bằng chứng:** `AccountsAdmin.tsx:387, 578, 634`; `AdminPage.tsx:329-347`; ảnh `a5-L-qt-sua--panel`, `a5-ad-qt`.
4. **Nguyên nhân:** form tách theo đường; gom 3 thứ một trang.
5. **Ảnh hưởng:** QT 10–14 bấm, 2 panel cho một tài khoản; khó tra nhật ký.
6. **Phương án:** một panel tài khoản (Tạo = Sửa) có khối "Quyền riêng" gập; "Quyền & nhật ký" 3 tab con, nhật ký có lọc + phân trang; "L · R · W2"; sắp tiếng Việt; chuyển hướng có lý do (mẫu "Trang không mở được" — AU-10); 375 dạng thẻ; **không** thêm sửa chi nhánh (9.2-35 — chưa có yêu cầu). 10–14 → 6–10 bấm, 1 panel. → 07 (M7).
7. **Xuyên:** QT; Admin VP, TVV (bị chặn).
8. **Luật:** phân quyền giữ nguyên.
9. **Kiểm thử:** đếm bấm tạo / sửa một tài khoản; trang Quyền ≤ 2 màn; ảnh ma trận quyền khi làm PR.
10. **Chủ SP:** không.

#### AU-56 · Tạo Case chỉ được một kỹ năng mỗi lần (bổ sung 21/10)
`A·D` · **P2** · đã kiểm (mã + demo chỉ đọc) · Mã: FB-4-35, X-73, v4d ý 1
1. **Ở đâu:** mọi lối tạo Case — "+ Case" đầu hồ sơ lớp, hồ sơ HV ("+ Case cho {kỹ năng}"), Công việc, sau Test / SOS (`QuickReport.tsx:400-412`, `server/src/cases/cases.ts:463-739`).
2. **Biểu hiện:** một lần tạo = một Case một kỹ năng; GV dạy 2 kỹ năng một lớp phải mở form 2 lần. Kèm lỗi: "+ Case cho {kỹ năng}" mở form **không chọn sẵn** kỹ năng đó (`StudentDetailPage.tsx:334`).
3. **Bằng chứng:** demo 33/73 cặp GV × lớp (45 %) dạy ≥ 2 kỹ năng; tạo Case 2 kỹ năng nay 16 bấm + 4 lần gõ, 2 lần lưu (v4d, ảnh `anh\v4d\`).
4. **Nguyên nhân:** form dựng cho "một em × một hạng mục" (Rb §4.1), không có chế độ lô.
5. **Ảnh hưởng:** GV mất bước, nhập lại phần chung (em, mức độ, tuần theo dõi, bằng chứng); dễ bỏ sót kỹ năng thứ hai.
6. **Phương án:** C1 (khuyến nghị) — chip **chọn nhiều** kỹ năng, phần chung nhập một lần, một thẻ mỗi kỹ năng (nguyên nhân, tên, mô tả riêng), nút "Tạo n Case", **một giao dịch** (tất cả hoặc không), trùng / Case chờ xác nhận báo ngay khi chọn chip → 13 bấm + 4 gõ, 1 lần lưu. C2 tạo xong hỏi "Tạo tiếp Case kỹ năng khác?" (vẫn 2 lần lưu). C3 một mô tả chung cho mọi kỹ năng (trái Rb §4.1). → 05 mục 7.1b; 07 CASE-NHIEU.
7. **Xuyên:** hồ sơ lớp, hồ sơ HV, Công việc, Test / SOS; chuông người phụ trách khi Case tạo cho kỹ năng người khác (02 C23).
8. **Luật:** mỗi kỹ năng vẫn **một Case riêng** (Rb §4.1, §20.9 — mọi GV có phân công trong lớp tạo được Case mọi môn); không đổi luật.
9. **Kiểm thử:** phép kiểm máy chủ: lô 2–3 kỹ năng tạo đúng n Case trong một giao dịch; một kỹ năng trùng → không tạo Case nào, báo đúng thẻ; "+ Case cho X" chọn sẵn X; ảnh trước / sau panel.
10. **Chủ SP:** không (yêu cầu đã chốt 21/10; chi tiết UX ở 02 4.7 C21, C27).

#### AU-57 · Chuông thông báo không phải danh sách nhắc việc đáng tin (bổ sung 21/10)
`B·D` · **P1** · đã kiểm (demo chỉ đọc, GV 7 / GV 10 / QL 2 / TVV 23) · Mã: FB-4-36, X-71, X-72, A1-04, A7-05, A7-15, 9.2-4, v4d ý 2
1. **Ở đâu:** nút "Thông báo n" trên thanh trên + hộp thông báo (khối "Cần làm" / "Để biết"), thông báo tự động OV-15d (`thongBaoTuDong.ts`).
2. **Biểu hiện:** GV 7 có **9 việc quá hạn** nhưng "Cần làm" chỉ chứa 1, "Để biết" chứa 5, **3 việc không có ở đâu**; một màn hiện **4 con số khác nhau** cho cùng ý "việc của tôi" (⚠ 10 · 19 · 39 · 18); việc đã xong vẫn nằm trong thông báo; bấm thông báo không luôn mở đúng việc tại chỗ.
3. **Bằng chứng:** v4d (ảnh `anh\v4d\`), A7-05 (chuông đếm thông báo đã xong).
4. **Nguyên nhân:** thông báo là **bản ghi lưu lúc sinh** (OV-15d), không đọc cùng hàm với hàng đợi Công việc / Tổng quan → lệch số, không tự tắt khi xong.
5. **Ảnh hưởng:** GV không tin chuông để biết còn gì phải làm (đúng lời GV trung tâm: "để không bỏ sót việc"); phải mở Công việc và tự đối chiếu.
6. **Phương án:** N1 (GĐ1 SL1) — vá chuông hiện có: chỉ đếm việc còn mở, thông báo của việc đã xong rời số. N2 (khuyến nghị, M2) — chuông thành hộp **"Nhắc việc"**: khối **Cần làm** đọc **cùng hàm** hàng đợi trang đầu của vai (quá hạn + tới hết CN tuần này + việc mới chưa đọc), số trên nút = số dòng đó, bấm dòng mở đúng việc tại chỗ; khối **Để biết** = tin một chiều; bỏ cơ chế lưu thông báo tự động. N3 hộp tự bật khi đăng nhập kiểu Base — **không chọn** (thêm bước đóng mỗi lần vào — luật 08/10). → 05 mục 2.7; 02 4.7 A20, C22.
7. **Xuyên:** mọi vai; Công việc, Tổng quan, trang đầu vai; X1 (số không cùng nguồn).
8. **Luật:** không đổi luật; luật 08/10 (không thêm bước), CLAUDE.md "cùng số liệu cùng nguồn, cùng hàm".
9. **Kiểm thử:** phép kiểm "số trên chuông = số dòng Cần làm = số việc quá hạn + tới hạn ở trang đầu"; việc vừa xong rời chuông ngay; bấm thử GV 7 / QL 2 / TVV 23.
10. **Chủ SP:** không (góp ý B — PTA đề xuất N1 + N2, không tự bật hộp; chủ SP có thể phủ quyết ở 02 4.7 A20).

### 2.12 Hồ sơ GV
Không lỗi riêng (a5, v4c). "Mở Công việc ›" đúng chỗ; CX bị chặn đúng. Số gạch chấm → AU-06; ô trống → AU-13.

### 2.13 Trang khác (bảng phủ v4c)

| Trang / thành phần | Đã kiểm | Chưa kiểm | Vấn đề · mã |
|---|---|---|---|
| Lưu trữ `/hoc-vien/luu-tru` | 1 440 + 375 | Bỏ lưu trữ hàng loạt (bước xem trước) | link mặc áo nút, chưa `t()` · AU-33 |
| Vận hành `/cong-viec/van-hanh` | QL 1 440 + 375 | — | "Việc con" toàn "–", 375 cuộn ngang · AU-48 |
| Báo cáo đơn vị `/cong-viec/bao-cao` | QL 1 440 + 375 | form sửa | ô tuần dáng 3 · AU-11, AU-48 |
| `*` đường sai, id không có, không quyền | QT, GV 10, HT | — | về trang đầu im lặng / "Thử lại" vô ích · AU-10 |
| Màn chào / đăng nhập / đăng ký | chưa đăng nhập 1 440 + 375, mất mạng | — | bản demo báo nhầm "chưa seed" · AU-10 |
| 10 đường cũ (`duongMoi`) | chỉ có phép kiểm | giao diện chuyển hướng | chưa rà · §5 |
| Dải Góc nhìn (đa vai) | — | **chưa kiểm** (demo không có TK đa vai) | §5 #6 |
| Hồ sơ Mock `/mock-test/:id` | QL / QT | Xử lý vắng, Khôi phục kết quả | menu "Chỉnh lịch" cũ · AU-09, AU-38, F-02 |
| Case `?viec=ghi-ket-qua` | người giữ việc | — | nền đen trống (chấp nhận được) |
| Hộp Kết luận khoá (lớp thường) | — | **chưa mở** | §5 #11 |
| NeedsEvaluation | — | có thể đã mất lối vào | §5.3 |
| `/dev/thanh-phan` | — | không phải màn sản phẩm | dùng làm sân mẫu (AU-08, AU-19) |

Mẫu tốt cần giữ (v4c): Kết thúc lớp, Xoá HV, trang ngoài phạm vi, tải lại khi lỗi vẫn giữ dữ liệu, dải Mất kết nối, Skeleton, màn Admin khi tuần rỗng có hướng dẫn, panel Case trong hồ sơ, Enter = em tiếp ở Chấm Speaking.

---

## 3. Theo vai

Nguồn: v4c mục hành trình (vai demo, ngày 14/09) + a1–a5. Nguyên tắc PTA #6: **việc CỦA TÔI nằm ở trang đầu của vai** (GV: Công việc; QL / QT / TVV / CX / Admin VP: Tổng quan; Head tutor: trang Tutor — 02 4.7 C24). Số bước "nay → đề xuất" đếm trên demo, chỉ đọc.

| Vai (demo) | Trang đầu: nay → đề xuất | Việc chính | Bước nay → đề xuất | Điểm nhầm lớn nhất | Vấn đề |
|---|---|---|---|---|---|
| **GV bộ môn** (8, 17–21) | Công việc, tự mở việc quá hạn lâu nhất ("Nhập điểm · W1 JUL · quá hạn 68 ngày") → Công việc, hàng đợi Hạn · Việc · › | chấm môn mình; ghi vi phạm; Thêm PA / KQ PA đúng kỹ năng; "-" → dời; gửi / sửa / rút yêu cầu | chấm 2 lớp ~11 bấm, 3 khối, 8 lưới → 1–2; nhập 3 lớp 8–10 → 3; sửa Progress đã lưu: nhờ QL → 2–3 | "W1 JUL" là tuần thi hay hạn; "✓" xanh = đã lưu hay đạt; thấy việc của QL; không sửa được điểm đã lưu | F-01, AU-45, AU-46, AU-14, AU-10, AU-17, AU-39 |
| **GVCN** (7, 10) | như GVBM | + lưu xử lý vi phạm, phối hợp SOS, đóng Case Ý thức, chốt lộ trình, (lớp thường: dời một môn — chỉ QL, 14/10-Q13) | xử lý quá hạn 5 → 3; xác nhận phối hợp 4 + dò ~1 700 px → 3; Lộ trình một em 4–5 + 2 đổi trang → 3, 0 | hạn 5 ngày gắn GVCN, không khép vòng với TVV; "Ghi nhận" 3 chỗ; xoá thẳng được lần xử lý | F-03, AU-31, AU-34, AU-35, AU-32 |
| **GV Speaking chấm chéo** (9) | Công việc mở sẵn "Chấm Speaking · 24 bài" ✓ | chấm S chéo các lớp FT cùng chi nhánh | 5 → 2 | Lịch Test mặc định Lớp thường ẩn bài S; "GV khác"; 49 ↔ 0; không thấy hạn | AU-41, F-01 |
| **TVV** (23) | Tổng quan "Học viên của tôi" 5 ô số (3·0·0·0·0) → Tổng quan TVV có hàng đợi "Việc của bạn" | ghi nhận kết quả xử lý vi phạm (**chưa có**), Báo PH qua TVV, Chốt ngày thi, bổ sung hồ sơ, Bước tiếp sau thi, tra điểm 2 bấm, xuất DS | việc vi phạm: chưa có → 2 bấm + gõ, 0 đổi trang; Bước tiếp ~4 + 1 đổi trang → 3 | thấy số 0 không biết làm gì; ô điểm là link màu nhấn; không có Công việc, không Test (11/10) | F-03, AU-24, AU-26, F-05, AU-03 |
| **CX** (24) | Tổng quan "Số liệu" 6 ô + 4 thẻ IN HOA → Tổng quan gọn (chủ yếu xem) | xem số, tra điểm 2 bấm | — | IN HOA 11 px; Theo tháng sai; gõ `/test` → về Tổng quan im lặng | AU-24, AU-02, AU-04, AU-10 |
| **Admin văn phòng** (22) | Tổng quan "Mock Test" 4 ô 0 + menu Công việc ("Chấm điểm") → Tổng quan hàng đợi (⚑ menu Công việc của Admin: PTA chốt) | xếp / dời MT (không huỷ, không khôi phục — `people.ts:11-13`), sửa điểm có lý do, xuất Excel | xem GV trễ 2–3 → 1; tra điểm một em 2 → 2 (số có màu) | tiêu đề khác menu; điểm Mock là link xanh dưới kỳ vọng như đạt; "Đề nghị dời chờ" → Lịch Test không lọc | AU-24, AU-03, AU-06, F-02, AU-40 |
| **QL chi nhánh** (2–6) | Tổng quan "Việc hôm nay" 2,5 màn → Tổng quan bố cục B | duyệt; Case quá hạn chốt PA; Bước tiếp; lộ trình lớp; phân công; tra tình trạng chấm; giao ban; xuất | duyệt 10 thẻ ≈ 31 bấm / 20 đổi trang → 11 / 0; Chốt lộ trình 6 lớp 40–60 → ≈ 12; "MT2 lớp X ai nợ" 3–6 + đổi trang → 1; phân công 4–5 → 3 | số cùng tên khác số; "Phân công…" đổi cả lớp; tự mở lưới GV; 70 % hai màu; "Xác nhận PA" của GV | AU-22, F-07, AU-05, AU-43, F-01, AU-49, AU-17 |
| **QT** (1) | như QL, mọi chi nhánh + Quản trị | + so chi nhánh; tài khoản, quyền | so chi nhánh: đổi ô 5 lần → bảng "Theo chi nhánh" 1 bấm; tài khoản 10–14 → 6–10 | Chờ duyệt lẫn chi nhánh khi chi nhánh "nhớ"; thanh trên 1 280 cắt Tutor; ⋯ hồ sơ HV 7 mục (Xoá HV chỉ QT) | AU-04, AU-16, AU-36, AU-55 |
| **Head tutor** (25) | `/tutor` rỗng "Đang dạy 0" (không có Tổng quan) → `/tutor` có "Việc của bạn" (⚑ PTA xác nhận đây là trang đầu) | rà tutor cần chú ý, ghi nhận xét, thêm / gộp tutor | tutor đầu 5–9 → 3; mỗi tutor sau 4 → tự sang tutor kế | tưởng không có dữ liệu; gõ `/hoc-vien` thấy khung rỗng | AU-54, AU-10 |
| Chưa đăng nhập | màn chào ✓ | đăng nhập | — | demo mất mạng báo nhầm "chưa seed" | AU-10 |
| Tài khoản kiêm hai vai | **chưa kiểm** (demo không có) | Góc nhìn, chuông khi ở vai GV | — | — | §5 #6 |

**Kiểm chéo giữa vai (không tối ưu vai này làm khó vai khác):**
- Bỏ Chờ duyệt khỏi Công việc của QL → GV vẫn phải thấy chữ "chờ QL duyệt" ở yêu cầu mình gửi (F-07).
- Việc TVV không được kéo việc của GVCN sang (GVCN vẫn lưu xử lý; TVV chỉ ghi nhận kết quả với phụ huynh — F-03).
- Bỏ `/cong-viec/cho-duyet`, `/nhap-diem`, `/bang-diem-thuong` → link trong thông báo cũ phải chuyển hướng (`duongMoi`).
- Đổi dáng "đang chọn" / hover → chụp lại "Chỉ cho tôi" (Hướng dẫn) và sổ tay PDF.
- "Toàn bộ" chỉ ở Phân tích → Head tutor và TVV / CX dùng `Khoảng tuần` có mặc định, không bị trang rỗng.
- Một việc một người giữ (AU-17) → khi em không có TVV, việc về QL chi nhánh (PTA #11, F-03), không rơi mất.

---

## 4. Theo luồng

#### F-01 · Chấm Test: ba khung, nhầm tuần, một nguồn, tra cứu cho QL / Admin
`B·D` · **P1** · đã kiểm · HT-11 · Mã: V3A-1, V3A-3, V3A-10, FB-0-13, FB-3-05, X-08, 12.2 (+ AU-37, AU-38, AU-39, AU-41, AU-45)
1. **Ở đâu:** Lịch Test 3 khối (Quá hạn chấm · Test chấm tuần này · Lịch Test tuần này), Công việc › Chấm điểm, hồ sơ lớp (theo lượt), hộp chấm; QL / QT / Admin VP tra cứu.
2. **Biểu hiện:** "ba khung" có hai nghĩa đều đúng (ba khối Lịch Test; ba nơi chấm Lịch Test · Công việc · hồ sơ lớp) — gom khác, đếm khác đơn vị → GV 10 thấy **4 con số** cho cùng khối lượng; khối "Test chấm tuần này" chứa bài **thi tuần trước**; khối "Lịch Test tuần này" chấm được ngay (hạn T4 tuần sau) mà thu gọn (GV 7 có 24 bài ẩn); Công việc ghi "Nhập điểm · W1 JUL" — là tuần thi, không có chữ "thi", đã quá hạn 68 ngày; hộp chấm không ghi hạn; lưới mở 10 cột cho GV chỉ có 1 cột; việc "W3 SEP" lẫn ô thi W3 AUG (dễ sửa nhầm bài cũ); QL hỏi "MB FT 101 MT2 đủ chưa, ai nợ": MT2 rải 2 dòng khối 1 + 1 dòng gộp khối 2, cột "GV chấm" chỉ có tên → 3–6 bấm + cộng nhẩm; Admin VP thấy R 5.0 < 5.5 là link xanh; Rulebook lệch mã 4 chỗ.
3. **Bằng chứng:** `LichTestTab.tsx:121, 260, 380`; `mywork.ts:500, 530-559`; `KhoiNo.tsx:45-58`; `StudentDetailPage.tsx:600-608`; ảnh `d-cv-gv10--ds`, `v3-lich-test-gv-ba-khoi`, `f-qt-lt-k1`; Rulebook 605, 631, 772, 818 ↔ `week.ts:89-93`, `nhanXet.ts:16-52`, `permissions.ts:596-599`; bảng luật chấm theo loại Test ở v3a Phần 1.
4. **Nguyên nhân:** `khoiCham` chia theo tuần thi nhưng đặt tên theo tuần đang xem; hai hàm gom riêng (`gomBaiChuaCham` ↔ `lichTest`); nhãn tuần trơn; Lịch Test không truyền `chiCot`; Lịch Test dựng cho người chấm, không có góc nhìn lớp × bài.
5. **Ảnh hưởng:** GV chấm nhầm tuần / sửa nhầm bài cũ / bỏ sót bài; QL không tra được tình trạng; người mới không biết "chấm tuần nào, chấm vào đâu".
6. **Phương án B — "theo hạn, một nguồn" (không đổi luật):** một hàm nhãn bài chấm dùng mọi nơi (hàng, hộp, việc, thông báo): **"MT2 · thi W2 SEP · hạn 16/09"** (không ghi thứ — X-18); danh sách gom theo hạn, giữ luật chia khối T15 (chỉ đổi tên + thứ tự): "⚠ Quá hạn chấm · n bài" · "Hạn 16/09 · bài thi W2 SEP" · "Bài thi tuần này W3 SEP · hạn 23/09" (mở khi có ô của tôi) · "Chấm Speaking chéo · n bài · không tính nợ" (mọi GV có kỹ năng S, kể cả không dạy lớp nào — 21/10); không dải số, không bộ chọn tuần trong phần chấm (luôn theo hôm nay) + link "Lịch tuần khác ›"; **một nguồn** cho Công việc › Chấm điểm và Test (cùng hàng, cùng chữ, cùng số); lưới gọn chỉ cột + ô của tôi, "Cả lớp" xem đủ, tự sang nhóm kế; một hộp chấm mọi loại Test (AU-39); QL / QT **"Tình trạng chấm"**: lớp × bài · tuần thi · đủ x/y em · còn n ô · **ai còn nợ theo kỹ năng** ("Hà L,R 6 · Linh W2 3 · chấm chéo S 6") · hạn / ⚠, bấm hàng → lưới lượt mở dưới hàng; hồ sơ lớp giữ là góc theo lượt; người mới: ⓘ một câu "Bài thi tuần này chấm trước T4 tuần sau". So **A** (giữ ba khối, vá chữ — số vẫn lệch) và **C** (chỉ chấm ở Công việc — GV mất chỗ quen). Đếm: Cô Linh ~11 bấm, 3 khối, 8 lưới → 1–2; bài quá hạn 3 + dò → 1; lớp thường 3 em có nhận xét ~8 → 2; QL tra 3–6 → 1; Admin 2 → 2 (số có màu). → 05 (Chấm Test) · 07 (M5, M2).
7. **Xuyên:** GV, GVCN, GV S, QL, QT, Admin VP; Công việc, Test, hồ sơ lớp, chuông.
8. **Luật (giữ):** T15 (chia khối), T18 (S chéo), T19 (không nhập trước tuần thi; hạn T4 tuần sau từng kỹ năng), nhận xét MT bắt buộc ≥ 10 ký tự (OV-12b); Rulebook sửa chữ 3 chỗ (hạn lớp thường T4; nhận xét MT bắt buộc; PR-LT3 đã có); **12.9-7 đã trả lời** (14/10-Q13: chỉ QL dời lịch môn lớp thường) → sửa chữ Rulebook §20.9 + chặn ở máy chủ (`permissions.ts:596-599` đang cho GV — lệch quyền).
9. **Kiểm thử:** phép kiểm "số Công việc › Chấm điểm = số danh sách chấm Test" cùng vai; nhãn có đủ "thi … · hạn …" ở 4 nơi; "ai nợ = số ô trống theo phân công"; API: GV lớp thường dời lịch môn → 403; bấm thử GV 7, GV 10, GV 9, QL 2 theo 6 tình huống đếm bước; ảnh cặp mockup M5 mới.
10. **Chủ SP (21/10):** **Q-C1** — "Cứ vẽ mockup cho lựa chọn 1 nhé tôi xem xong sẽ duyệt": hướng "theo hạn, một nguồn" chưa chốt hẳn, **chờ mockup**; luật S chéo không cần lớp (AU-41).

#### F-02 · MT: dấu "-", dời, huỷ, khôi phục, gửi duyệt — luật 4 đang lệch
`A·D` · **P1** · đã kiểm mã + demo; đường đau chủ SP gặp cần ảnh (E) · HT-14 · Mã: V4B-07, V4B-08, V4B-09, FB-4-12, FB-4-28, FB-4-29, X-05, X-28 (+ AU-14: H04, H05, H08, H14, H15)
1. **Ở đâu:** ô điểm MT (Lịch Test, hồ sơ lớp, Công việc, hồ sơ MT), nút Vắng / ⋯ Vắng, hộp một đợt (`HopKyNang`), hồ sơ Mock, thẻ "Xin dời".
2. **Biểu hiện:** "-" ghi sau CN tuần thi (MT hiện tại) và "-" ở **MT cũ** đều thành "Không dự thi" ngay, không dời; Writing 1 task "-" → Không dự thi; MT cũ bị chặn khỏi mọi luồng vắng; 4 thao tác cùng chữ "huỷ / xoá" mà khác nghĩa; một trạng thái có 2 bộ nút ("Khôi phục → Chưa xếp · Giữ huỷ" ↔ "Khôi phục và đặt tuần · Không mock lại"); Huỷ điểm mất cả nhận xét, sau hoàn tất chỉ QL làm được; "Xin dời" chỉ còn route; `applyMove` không tính lại cờ MT cũ; đường chủ SP nêu: huỷ điểm → hồ sơ MT → Lịch sử → gõ lại điểm + nhận xét → dời lịch ≈ 14 bấm, 1–2 đổi trang.
3. **Bằng chứng:** `attempts.ts:2126-2158` (2135-2136), `absence.ts:224, 283-317, 356, 441-465, 483, 965, 975`, `shared/domain/vang.ts:10-16`, `routes/index.ts:940`, `HopKyNang.tsx:291-293, 442-448`; demo v4b-03, -04, -05, -06, -14; **bảng trạng thái v4b**: S1 Chưa xếp · S2 Chưa tới tuần · S3 Chờ điểm · S4 Không có bài · S5 Có điểm · S6 Vắng · chờ QL · S7 Vắng · chờ xếp lại · S8 Đã dời do vắng · S9 Huỷ · vắng 2 lần · S10 Huỷ phần thi · S11 Không dự thi (chỉ còn ở dữ liệu cũ) · S12 Bỏ khỏi đợt; chuyển lệch **L4**: T05 ("-" sau tuần, MT hiện tại → S11), T06 ("-" ở MT cũ → S11), T07 (Writing 1 task); lệch **L3**: T20 (Huỷ điểm mất nhận xét), T21, T28 (hoàn tất khoá GV); **thiếu** T27 (`applyMove` không tính lại MT cũ); Rulebook lệch 16 chỗ (V4B-09: R1 "Không dự thi" dòng 677, 688…; R4 GVCN Xin dời 680; R7 sửa sau hoàn tất 723, 816…; R11 §20.3 thiếu L1 / L2 / L5; R12 "bậc không lùi").
4. **Nguyên nhân (đã kiểm):** chốt 11/10 + T23 (06/10) "MT cũ: '-' = Không dự thi" — nay luật 4 thay; mỗi PR thêm nút cho một ca; Huỷ điểm đi chung đường lưu điểm; hồ sơ MT giữ bộ nút cũ.
5. **Ảnh hưởng:** em vắng ở MT cũ mất quyền thi bù mà không ai quyết; QL / GV đi vòng nhiều trang; nhầm "huỷ lịch / huỷ điểm / huỷ MT / dời / gửi duyệt".
6. **Phương án (luật 4 sửa 21/10 — 02 mục 2.9):** một hàm `chuyenVang` cho mọi cổng ghi vắng (gõ "-", nút Vắng, ⋯ Vắng); **MT hiện tại: "-" lần 1 → dời tuần kế, lần 2 → huỷ (S9), đếm theo tuần** (sửa / gõ lại trong cùng tuần không tính); "-" ghi muộn (< 2 tuần) → tuần kế **của lịch** nếu còn thi được; **MT cũ (≥ 2 tuần) "-" → huỷ ngay (S13)**, Hoàn tác 10 s, sau đó người có quyền sửa ô khôi phục được; QL **Khôi phục** → được dời 2 lần; QL **duyệt thẻ dời** → +1 lần; **MT hiện tại giữ luồng gửi duyệt** (không dời được → thẻ "Dời lịch Test" gửi QL, `absence.ts:283-317` có sẵn); nút luôn là "Vắng"; dữ liệu S11 cũ giữ (gỡ "-" hoặc nhập điểm được; ở MT cũ hiện "Đã huỷ"); `applyMove` gọi `tinhLaiMtCu`; mọi nơi dùng chung một hộp một đợt; **Huỷ điểm = cất điểm** + dòng "Đã huỷ 6.5 · Khôi phục" (không mất nhận xét); điểm đi theo lịch khi dời (T20). Tên phân biệt (theo 05 mục 4.5): **Dời lịch** · **Đã huỷ · vắng 2 lần / vắng MT cũ** · **Bỏ khỏi đợt** · **Huỷ điểm** (cất, khôi phục được) · **Xóa lịch** (chỉ khi chưa có điểm) · thẻ **"Dời lịch Test"** chờ QL. Đếm: Đ1 ≈ 14 → 3–4 bấm, 0 đổi trang; Đ2 vắng 2 lần rồi cho thi bù 6 → 3; Đ3 "-" ghi muộn 5+ bấm, 2 người → 1. → 05 (Bảng chuyển trạng thái MT) · 07.
7. **Xuyên:** GV, GVCN, QL, Admin VP (xếp / dời; không huỷ, không khôi phục — `people.ts:11-13`); Test, hồ sơ lớp, Công việc, hồ sơ MT; tệp xuất (S11 cũ).
8. **Luật:** **L4** (lệch → sửa, không hỏi lại); L3; T3, T20, T21, T22; 19/10-M6 "Huỷ = Xóa" ở Kế hoạch Test (có điểm thì không xoá; ngoại lệ vắng 2 lần); lớp thường giữ 14/10-Q1 (L4 chỉ cho MT); Writing chỉ chốt vắng khi cả W1 và W2 "-".
9. **Kiểm thử:** hàm thuần `chuyenVang` với ≥ 12 ca (MT hiện tại trong tuần / ghi muộn / MT cũ × lần 1 / lần 2 × dời được / vướng MT sau × Writing 1–2 task × sau Khôi phục × MT0); API: "-" ở MT cũ lần 1 → lịch tuần kế, không "Không dự thi"; `applyMove` → cờ MT cũ đúng; GVCN FT không thấy nút "Xếp lại" khi không có quyền (H15); demo riêng: đi lại đường Đ1, đếm bước; ảnh đường đau từ chủ SP (§5 #16).
10. **Chủ SP (21/10):** Q-B3 + Q-B4 → **luật 4 sửa**: MT cũ "-" = huỷ ngay (Q-B3 hết hiệu lực cho MT cũ; "tuần kế của lịch" chỉ cho MT hiện tại ghi muộn) · đếm theo tuần · Khôi phục = được dời 2 lần · QL duyệt thêm = +1 · gõ nhầm: Hoàn tác 10 s, "tại sao phải chặn cứng?" (02 2.9, X-75…X-78). MT0 theo L4 (4.7 A16 — gói đồng ý). Còn cần ảnh đường đau.

#### F-03 · Vi phạm → GVCN lưu xử lý → TVV ghi nhận kết quả → theo dõi (luật 1, 2 và lời 21/10)
`A·D` · **P1** · đã kiểm mã (tính năng chưa có) · HT-10 · Mã: V4B-01, V4B-02, V4C-01, V4A-08, FB-4-09, FB-4-10, FB-4-23, FB-4-24, FB-4-34, X-27, X-45, X-49, X-50, X-51 (+ AU-31, AU-34, AU-50)
1. **Ở đâu:** Hồ sơ lớp / HV › Ý thức (Xác nhận xử lý, Xem xử lý, Đề xuất ngoài thang), thẻ Chờ duyệt Ý thức, Tổng quan TVV, chuông.
2. **Biểu hiện:** GVCN lưu xử lý → **không sinh việc nào cho TVV**; hạn 5 ngày đang là của GVCN ("Đã thực hiện"); TVV không có quyền `discipline.*`, không việc, không chuông, chỉ thấy em ở ô "Cần chú ý · Ý thức"; phần báo phụ huynh nằm lẫn trong mô tả của GVCN (gợi ý "Đã gửi Report cho PH qua Zalo"); "Báo PH qua TVV" là việc của GVCN; **GVCN xoá thẳng lần xử lý mới nhất** (bậc lùi, không vết, không lý do); chưa có đường "xử lý không tăng bậc" (thang tự lấy bậc kế); demo chỉ 4/129 em có TVV, bản chính chưa gán TVV.
3. **Bằng chứng:** `server/src/yThuc/xuLy.ts:97-121, 153-206, 273-294, 493-553, 558-561, 622-638` (`xoaXuLy`), `:661-675` (xoá khỏi DB); `XacNhanXuLyPanel.tsx:280`; `XemXuLyPanel.tsx:115`; `shared/domain/yThuc.ts:225-277, 300-302, 316`; `phoiHop.ts:97-135`; `mywork.ts:994-1030`; `worklist/hvCuaToi.ts:102-104`; `platform/nav.ts:24, 42, 45`; `seed/data.ts:103`; `ov2aSeed.ts:3`; ảnh `b3-dau-tvv23`, `tvv23-tq`.
4. **Nguyên nhân:** Ý thức v4 để GVCN làm hết, TVV thêm sau và chỉ được đọc; luật 20/10, 21/10 chưa vào mã; OV-7a làm trước lời 21/10.
5. **Ảnh hưởng:** không ai ghi phụ huynh đã được báo thế nào, phản hồi ra sao; vòng xử lý không khép; GVCN thu hồi không ai duyệt → mất dấu vết kỷ luật.
6. **Phương án (PTA #1, #2, #3, #6, #11):** mỗi lần lưu xử lý (GVCN hoặc QL, kể cả "Chọn nhiều") → **ngay** một việc / em "Ghi nhận kết quả xử lý" cho TVV phụ trách — **kể cả khi lần xử lý đang chờ QL duyệt** (⚑ v4b Q1 khuyến nghị sinh lúc "Đã thực hiện" — trái L1 "không đợi bước duyệt khác", không dùng); **hạn = 23:59 (giờ VN) ngày lưu + 4**, tính cả ngày lưu (lưu T2 14/09 10:00 → hết CN 18/09 23:59) — ⚑ V4A-08 ghi "lưu + 5 × 24 h" là sai; form tối thiểu (Liên hệ · Cách + ngày · PH phản hồi · tệp tuỳ chọn), không chép lại dữ liệu GVCN đã ghi; trạng thái Chờ báo PH → Chưa liên hệ được · lần n → Đã báo PH / Không liên hệ được / Đã huỷ; nơi làm: hàng đợi **"Việc của bạn" trên Tổng quan TVV**, mở ở khung phải (⚑ V4C-01 đề xuất mở trang Công việc cho TVV — khác hướng PTA; ⚑ v4b đề xuất form mở dưới dòng — trái luật "một kiểu mở" của v4a), 2 bấm + gõ, 0 đổi trang; dòng vi phạm ở Ý thức lớp / HV hiện "TVV: chưa ghi nhận · hạn 18/09". **Lời 21/10:** nút **"Thu hồi…"** thay nút Xoá (chỉ lần mới nhất), lý do bắt buộc → thẻ QL duyệt; trong lúc chờ, lần xử lý vẫn tính; QL duyệt → "Đã thu hồi", giữ dòng + lịch sử, bậc tính lại; bỏ `xoaXuLy`; **"Không tăng bậc…"** = chọn bậc hiện tại / thấp hơn + lý do → đi qua đường "Đề xuất QL duyệt" sẵn có; không Hoàn tác sau khi lưu (X-51); rút một đề xuất còn chờ QL không phải "thu hồi" (X-51). **Trước khi bật:** gán TVV (dữ liệu chặn); em không có TVV → QL chi nhánh. Việc TVV khác (chủ SP 21/10 — mỗi việc một người giữ = TVV của em): Chốt ngày thi (F-05) · Chọn bước tiếp sau thi (hạn 1 tuần) · Bổ sung hồ sơ thiếu · Cập nhật KQ thi thật (chuyển từ GVCN) — không hạn; **Báo PH qua TVV (lớp thường) giữ như nay** (GVCN). → 05 (Luồng vi phạm, form TVV) · 07.
7. **Xuyên:** GVCN, TVV, QL, QT; Hồ sơ lớp / HV, Tổng quan TVV, Phân tích › Ý thức, Tổng quan QL "Vận hành quá hạn".
8. **Luật:** **L1, L2, 21/10** (lệch → làm mới / sửa); L3; Rulebook §20 (thang 6 bậc; WL 3 / ngoài thang qua QL duyệt; hạn 5 ngày GVCN; phối hợp không phải vi phạm); V4B-09 R11 (§20.3 phải thêm L1 / L2 / L5), R12 "bậc không lùi" (sửa chữ khi thu hồi được duyệt).
9. **Kiểm thử:** API: GVCN lưu xử lý → đúng 1 việc TVV / em, `han` = 23:59 ngày lưu + 4 (thêm ca lưu 23:30 giờ VN); lưu lần đang chờ QL duyệt → việc vẫn sinh; QL từ chối / duyệt thu hồi → việc TVV chưa ghi tự huỷ có lý do, đã ghi thì giữ + nhãn; GVCN gọi DELETE → 403; thu hồi thiếu lý do → 400; GV / TVV khác ghi → 403; em không có TVV → việc về QL; Playwright TVV 23: Tổng quan có hàng đợi, không có menu Công việc; ảnh cặp đủ 4 trạng thái.
10. **Chủ SP (21/10):** **Q-D1 ①** (TVV chưa ghi → tự huỷ kèm lý do; đã ghi → giữ + nhãn) · **Q-D3 ①** (không có TVV → QL; được "Kết thúc · không liên hệ được") · **Q-A1 ①** (Tổng quan TVV) · **Q-A3** → 4 việc TVV + hạn · **Q-D4 ①** (4 trường). Giờ hết hạn (4.7 B1) và QL tự thu hồi có lý do (4.7 C26): PTA quyết, chủ SP đồng ý gói.

#### F-04 · SOS / Case / PA làm tại chỗ
`B·D` · **P1** · đã kiểm · Mã: FB-1-06, FB-1-07, v1-tq P3, 10.2 (SOS), 10.3, X-39 (+ AU-06, AU-27, AU-36, AU-44, AU-47)
1. **Ở đâu:** Tổng quan (Lớp cần chú ý, Case quá hạn chốt PA), Đang SOS, panel một em, hồ sơ lớp Cần hỗ trợ, Công việc (Thêm PA, Kết quả PA, Xác nhận PA, Case), Báo cáo / Phân tích (panel số SOS).
2. **Biểu hiện:** phải bấm trúng chữ số SOS 8×12 px; panel SOS chỉ có tên + lớp; "Vì sao SOS" hai nội dung, không link việc; Thêm PA 5–7 bấm + panel phủ; Case trống PA mà nút chính "Hoàn thành Case"; dòng Case thiếu chip SOS + "đang chờ gì, từ bao giờ"; Thêm PA: Loại PA là ô chọn, thiếu Người thực hiện; Kết quả PA ghi nhanh che đầu mục (ảnh v4-3); SOS 2 của một lớp: 14 bấm + 2 đổi trang.
3. **Bằng chứng:** `TongQuanQl.tsx:60`; `bangChiNhanh.ts:198`; `SoLieuO.tsx:28-30`; ảnh `bam-mocase`, `gv10-them-pa`, `hvl-sos-chip`, ảnh chủ SP v4-3; đếm bước V3B-03.
4. **Nguyên nhân:** `SoLieuO` đặt trong chip; panel danh sách chung; panel Thêm / Xác nhận PA lệch panel v3; nhánh ghi nhanh riêng.
5. **Ảnh hưởng:** QL bỏ sót em SOS chưa có PA; nhiều panel, nhiều đổi trang.
6. **Phương án:** cả ô SOS là một nút ≥ 44 px → **mở rộng hàng lớp ngay tại chỗ** (bảng rộng): mỗi em một dòng (mức SOS + kỹ năng · MT · tuần · Case / PA · việc tiếp + hạn · nút theo quyền) + **"Thêm PA" mở ngay dưới dòng em** (form gọn 2 hàng ~220 px; 3–4 bấm thay 5–7; 0 panel) — đúng ý chủ SP MP IV.3 ở **bảng rộng**; ở **danh sách hẹp** (hàng đợi) dùng khung phải; **cùng một form** (X-39, PTA tự quyết). Một `ChipSos` + một hộp "Vì sao SOS"; nút chính theo việc tiếp của Case; Thêm / Xác nhận PA theo panel v3. SOS 2: 14 → 7 bấm, 0 đổi trang. → 05 (Làm tại chỗ, SOS) · 04.
7. **Xuyên:** QL, QT, GVCN, GV; Tổng quan, Đang SOS, hồ sơ lớp, Công việc, Báo cáo.
8. **Luật:** 9.1-4 ("SOS hiện tại"); 14/10-OV12 (hạn kết quả PA 2 tuần); "Nên dùng"; nhận xét Kết quả PA ≥ 8 ký tự; Mini Test ≥ 70 % → Case xong.
9. **Kiểm thử:** vùng bấm ô SOS ≥ 44 px; Playwright: bấm SOS → hàng lớp mở rộng (URL có `lop-vd`), không `[role=dialog]`; Thêm PA dưới dòng (bảng rộng) và ở khung phải (hàng đợi) import cùng một thành phần; đếm SOS 2 ≤ 7 bấm, 0 đổi trang; ảnh cặp mockup 6 khung 1.
10. **Chủ SP:** không — MP IV.3 là phương án chủ SP, PTA đánh giá áp một phần (02 X-39); mockup cần duyệt.

#### F-05 · Lịch thi thật: tháng / ngày, "Chưa chốt ngày", "Cần xác nhận", Ghi chú
`A·D` · **P1** · đã kiểm mã; trên web cần demo 01/12 (E) · HT-15 · Mã: V2A-06, V2A-07, V2A-08, A3-20, FB-2-06, FB-2-07, FB-2-08, X-29, X-30
1. **Ở đâu:** Học viên & Lớp › Lịch thi; hàng HV; đầu hồ sơ HV; Tổng quan (TVV, QL); Công việc GVCN; tệp xuất.
2. **Biểu hiện:** 34 nút Kết luận / 10 hàng, hàng 66 px; 12 nút tháng (mockup vẽ một ô), mặc định là tháng rỗng, không lọc Lớp; 41/45 em chưa có dự kiến trộn chung, không nhóm theo trạng thái; dải đếm cộng sai (11/2026: "1 HV" nhưng "1 giữ tháng + 1 cần xác nhận"); 375 4 055 px, hàng đầu ở y 789. **LỖI P1:** hết tháng dự kiến mà chưa có ngày → máy lấy ngày cuối tháng (hoặc CN của tuần dự kiến) làm ngày thi → em thành "Đã thi · chờ KQ", hàng tô "đã thi", GVCN nhận việc "Cập nhật kết quả thi thật" **có hạn**, quá hạn đỏ — từ **01/12** mọi em dự kiến 11/2026 chưa có ngày sẽ dính. Kèm: "Chốt ngày" chặn ngày đã qua (em đã thi thật không ghi được); thi 17/09 mà "Sắp tới: Chưa có mốc"; "Thi thật · chưa có ngày" hiện cho em chưa có cả tháng; 4 dạng nhãn ("17/09/2026", "NOV 2026", "11/2026", "W2 JAN 2027"); TVV "Sắp thi" gộp A / B; "Ghi chú họp" ≠ "Ghi chú lịch thi" ở Lịch sử (trùng tên ghi chú lịch MT); "Cần xác nhận" không đổi lịch, không sinh việc, không ai phụ trách, không hạn → đầu ra giống "chưa có kết luận".
3. **Bằng chứng:** `tongKetLoTrinh.ts:118-119`; `thiThat.ts:132-133`; `profile.ts:802`; `hvCuaToi.ts:79`; `sosAuto.ts:55`; `hoSoHocVien.ts:346`; `sapToi.ts:16`; `GocLichThi.tsx:107, 126, 182, 230`; `cycles.ts:115`; `lichThiOv15f.ts:64, 74`; `lichThi.ts:6, 148`; `lichSuSua.ts:53`; `HopKyNang.tsx:384`; DB demo 126 lộ trình (101 chưa có gì · 16 chỉ tháng · 8 có tuần · 1 có ngày); ảnh `v2-lich-thi-12-nut-thang`.
4. **Nguyên nhân:** thiếu trạng thái "tới tháng mà chưa có ngày"; 16/10-OV13q "chỉ có tháng → ngày cuối tháng là ngày thi" (đã bị V2 I.6.3 thay); OV-15f lệch mockup 5.
5. **Ảnh hưởng:** từ 01/12 GVCN nhận việc sai, em bị tính "đã thi"; TVV không ghi được ngày đã qua; Lịch thi khó dùng khi họp.
6. **Phương án:** một hàm **`trangThaiLichThi`** (chưa có · dự kiến · **B chưa chốt ngày** · **A đã chốt ngày** · đã thi chờ KQ — chỉ khi có ngày và ngày đã qua · …) dùng chung cho hàng HV, đầu hồ sơ, Tổng quan, Công việc, Lịch thi, tệp xuất; chip **A** "Thi 21/11 · còn 9 ngày" (họ màu "đã thi" + biểu tượng lịch ✓) / **B** "Chưa chốt ngày thi · 11/2026" viền đứt, trung tính + ◌ (không chỉ bằng màu, không lẫn SOS); việc **"Chốt ngày thi"** sinh khi đọc (không migrate, không cron), **không hạn**, không vào số quá hạn / chuông, tắt khi có ngày / dời tháng / có kết quả / "Không thi" / tạm dừng; hộp nhỏ neo tại chip [ngày] · [Dời sang 12/2026] · Ghi chú (2 bấm), nhận ngày đã qua ("Em đã thi 28/11?" → vào luồng Đã thi); Lịch thi: lọc "Tháng dự kiến [10/2026] → [11/2026]" (ngoại lệ tháng, mặc định tháng này → tháng sau), nhóm theo trạng thái (Chưa chốt ngày · Đã chốt ngày · Dự kiến · Chưa có tháng thi — gập), hàng 44 px, 2 nút [Chốt ngày] [Dời tháng], chi tiết mở dưới hàng (4 kỹ năng MT gần nhất, Test sắp tới, GVCN, lịch sử lịch thi); "Ghi chú"; bỏ nút "Cần xác nhận" + "Giữ tháng" (dữ liệu cũ giữ) — Q-C4 ① (21/10); việc Chốt ngày thi + Cập nhật KQ thi thật của **TVV, không hạn** (21/10). PR máy chủ **LT-SV** (GĐ1). 34 → ~20 nút; 10 hàng ≈ 1 màn. → 05 (Lịch thi) · 07 (LT-SV).
7. **Xuyên:** TVV, GVCN, QL, QT; HV & Lớp, hồ sơ HV, Tổng quan, Công việc, xuất.
8. **Luật:** V2 I.6.3 (đã chốt — mã lệch phải sửa); 16/10-OV13q phần "chỉ tháng" hết hiệu lực; 19/10-M6 ("Cần xác nhận" không tự tạo việc); Rulebook dòng 258 (lọc theo tháng).
9. **Kiểm thử:** phép kiểm bảng trạng thái `trangThaiLichThi` (≥ 10 ca: chỉ tháng — trước / trong / sau tháng; có tuần chưa ngày; có ngày tương lai / quá khứ; có kết quả; tạm dừng); lệnh chỉ đọc trên DB bản chính: lộ trình nào đang "Đã thi" chỉ nhờ tháng; demo riêng đặt ngày 01/12/2026 → em chỉ có tháng 11 là "Chưa chốt ngày", không có việc GVCN; "Chốt ngày" nhận ngày đã qua; tổng các nhóm = số HV; ảnh cặp mockup 5 đã sửa.
10. **Chủ SP (21/10):** **Q-C3 ①** (có tuần chưa ngày = Chưa chốt ngày; lớp thường chỉ chip) · **Q-C4 ①** (bỏ "Cần xác nhận", hiện "Chưa kết luận") · **Q-A3**: Chốt ngày thi + Cập nhật KQ thi thật = **TVV, không hạn** · **Q-E1 ①** (LT-SV trước deploy).

#### F-06 · Xuất báo cáo: Báo cáo, In, Chiếu, Xuất Excel
`A·D` · **P1** · đã kiểm · Mã: dẫn AU-04 (A5-01, A5-02), AU-49 (V3B-04, A5-18), AU-18 (V3B-07, TST-04)
1. **Ở đâu:** Phân tích › Báo cáo (In), 11 lối Xuất Excel.
2. **Biểu hiện:** báo cáo tháng ra tháng trước (P0); "PA trong kỳ" sai; In chỉ 10 dòng / bảng, ẩn "Dữ liệu đến"; không có chế độ chiếu cho giao ban; kỳ cũ in số "hôm nay"; tệp xuất lệch phạm vi trang, 5 bộ tên cột, 3 lối không nhật ký; Thi thật, Báo cáo, Hiệu quả PA, Phân tích GV, Tutor không có xuất.
3. **Bằng chứng:** `khoangThoiGian.ts:59-61`; `metrics.ts:902-907`; `BaoCao.tsx:97, 126`; `KeHoachTestTab.tsx:99-102`; `YThucPhoiHop.tsx:45-74`; ảnh `a5-theo-thang-ra-08`, `v3-bao-cao-web`.
4. **Nguyên nhân:** như AU-04, AU-18, AU-49.
5. **Ảnh hưởng:** Chị Vy giao ban bằng số sai; tệp gửi đi sai phạm vi hoặc lộ dữ liệu không vết.
6. **Phương án:** SL1 sửa số trước (GĐ1) → Báo cáo một PR màn (K1) + nút **"Chiếu"** (toàn màn, nền sáng, số 40 / nhãn 17, ẩn thanh trên) + In đủ dòng + "Dữ liệu đến" khi in + khối "tại hôm nay" ghi rõ khi xem kỳ cũ; xuất E1 (từ điển cột, mặc định = bộ lọc trang, mọi xuất qua máy chủ + nhật ký). Giải thích một số khi giao ban: 1 bấm + 1 đổi trang mỗi em → 1 bấm; QT so chi nhánh: đổi ô 5 lần → bảng "Theo chi nhánh" 1 bấm. → 05 · 06 · 07 (SL1, M6).
7. **Xuyên:** QL, QT, CX (xem); TVV / CX không thấy tên GV (AU-17).
8. **Luật:** C24 (Báo cáo 2 tuần hoàn chỉnh trước); V3 II.2–II.4; 19/10-BC (Báo cáo là tab đầu Phân tích).
9. **Kiểm thử:** phép kiểm 12 tháng; In thử > 10 dòng (PDF đủ dòng, có "Dữ liệu đến"); "Chiếu" không cuộn ngang ở 1 280; số dòng tệp = số dòng trang; ảnh cặp mockup 3 khung 3 + khung Chiếu.
10. **Chủ SP (21/10):** **Q-C2 ①** (duyệt cả bốn); **Q-E2 ①** (bớt em ở panel Xuất).

#### F-07 · Duyệt: thẻ Chờ duyệt ở 5 nơi
`B·D` · **P1** · đã kiểm (sau Duyệt: đọc mã) · Mã: A1-09, A1-10, A1-14, CV-27, V4C-12 (phần thẻ), X-03, X-47, FB-0-01 (+ A1-02, A7-01, A7-14 ở AU-04; A7-22 ở AU-13)
1. **Ở đâu:** Tổng quan QL / QT ("Cần bạn quyết"), Công việc (hộp "Chờ bạn duyệt" rộng hết trang), `/cong-viec/cho-duyet`, hồ sơ HV (dải duyệt), `/cong-viec/yeu-cau` (GV gửi), thông báo.
2. **Biểu hiện:** cùng thẻ ở 5 nơi; thẻ cao 95–130 px, "Nếu duyệt: … hạn hết T3" lặp mọi thẻ (ghi thứ, trái "hạn chỉ ghi ngày" 19/10); chip loại nhảy vị trí vì ô tick chỉ có ở thẻ duyệt hàng loạt được; "Chọn hết n" chọn cả thẻ đang ẩn sau "Xem thêm" → duyệt thẻ chưa đọc; thẻ chi nhánh khác khi đang lọc (ảnh v4-1: BC FT 205 khi lọc Monbay); "Mở" ở thẻ đổi trang sang hồ sơ HV + ngăn Case phủ, còn "Mở Case" ngay dưới mở panel; Duyệt không Hoàn tác (mockup 3 có "Hoàn tác · 8 s"); số không làm mới sau Duyệt nhiều; thẻ GV tự gửi có 4–5 nút; thẻ dời MT mang nhãn "Lịch thi". Duyệt 10 thẻ có xem bối cảnh: ≈ 21–31 bấm, 5–20 đổi trang.
3. **Bằng chứng:** `TheYeuCau.tsx:179-189, 267`; `HopChoDuyet.tsx:51, 92, 113, 133, 144, 227-229`; ảnh `bam-cd-tick`, `bam-cd-mo`, `ql2-mo-the`, `b2-cv-choduyet-ql-p1`, `b2-cv-yeucau-gv7-p1`, `a1-cho-duyet-10-ma-12-the`; ảnh chủ SP v0-1, v4-1.
4. **Nguyên nhân:** dùng nguyên thẻ hộp duyệt của Công việc ở mọi nơi; `chonHet` chạy trên toàn danh sách; thiếu invalidate; chưa phân vai trang; "Q15 không hoàn tác" cũ.
5. **Ảnh hưởng:** duyệt nhầm thẻ chưa đọc / thẻ chi nhánh khác; QL đổi trang liên tục.
6. **Phương án:** một nơi chính để QL duyệt = Tổng quan (theo Q-A1, PTA #6); Chờ duyệt là **nhóm đầu của hàng đợi** (bố cục B — Q-A2), hàng gọn 2 dòng (trích ngắn + "Nếu duyệt …" ghi ngày); "Chọn nhiều" chỉ trên thẻ đang hiện, cột tick luôn giữ chỗ; "Mở" → bối cảnh / Case trong khung phải, link "Hồ sơ ↗" tách riêng; **Hoàn tác 8 s sau Duyệt** (X-47, mockup 3); thẻ theo chi nhánh của trang + dòng "n thẻ ở chi nhánh khác · Xem" (X-03); GV vẫn thấy "chờ QL duyệt" ở yêu cầu mình gửi, Sửa · Rút vào ⋯; thẻ thu hồi xử lý vi phạm (21/10) đi cùng đường này (F-03); link cũ `/cong-viec/cho-duyet` chuyển hướng. 10 thẻ: 21–31 → 11 bấm, 0 đổi trang. → 05.
7. **Xuyên:** QL, QT (duyệt); GV, GVCN (gửi); TVV (theo dõi).
8. **Luật:** duyệt bắt buộc giữ nguyên (L3); 9.1-4; X-47 (Hoàn tác không đổi luật duyệt); 21/10 (thẻ thu hồi / không tăng bậc).
9. **Kiểm thử:** "số thẻ hiện + Xem thêm = số đầu nhóm" theo chi nhánh; "Chọn hết" chỉ chọn thẻ có trong DOM; demo riêng: Duyệt nhiều → số làm mới ngay, Hoàn tác trong 8 s trả trạng thái; vị trí x chip lệch ≤ 1 px; Playwright đếm 10 thẻ ≤ 11 bấm, 0 đổi pathname.
10. **Chủ SP (21/10):** **Q-A1 ①**, **Q-A2 ①**.

---

## 5. Chưa kiểm được + ảnh / dữ liệu cần chủ SP cung cấp

### 5.1 Ảnh chủ SP chụp trên **bản chính** (chỉ mở, không bấm Lưu)

| # | Trang | Bước thao tác | Trạng thái cần thấy | Để kiểm |
|---|---|---|---|---|
| 1 | Tổng quan, laptop của chủ SP 1 280–1 366 px, zoom 125 % | mở trang, chụp thanh trên | còn mục "Tutor" và số cạnh "Công việc" không | AU-16 |
| 2 | HV & Lớp › Tất cả (QL chi nhánh đông nhất) | mở lớp FT đông nhất → chụp toàn trang → bấm "Thiếu n" của 3 em | tỉ lệ "Thiếu" thật, trường nào thiếu | AU-25, Q-D4 |
| 3 | Tổng quan → HV & Lớp › Đang SOS trang 1 → trang 2 → Phân tích › Báo cáo (cùng chi nhánh, cùng FT, chụp liền) | chụp liền nhau | số SOS, "chưa lịch Test" 2 ↔ 3 | AU-05, AU-27 |
| 4 | Điện thoại của một GV | hồ sơ một lớp → cuộn tới cuối (đếm số lần vuốt); Lịch Test / Kế hoạch Test | độ dài, ô nhập đầu ở đâu | AU-20, AU-15 |
| 5 | Công việc › Chấm Speaking (GV Speaking) | xem danh sách; chấm một em → chụp ô "Người chấm" | có em quá hạn; người chấm sau khi lưu | AU-41 |
| 6 | Tài khoản kiêm hai vai (QL kiêm GV) | menu tài khoản › Góc nhìn › Giáo viên → dải + trang đầu + "Về Quản lý" + chuông | **chưa kiểm** (demo không có tài khoản đa vai) | §3 |
| 7 | Một Case có PA loại cũ | mở ngăn Case | tên loại PA có chữ "_" không | AU-36 |
| 8 | Hồ sơ HV ≥ 2 lớp › Hành trình (1 440 + điện thoại) | cuộn hết tab | chữ cắt, số PA khớp | AU-35 |
| 9 | Hồ sơ Mock có vắng đã xác nhận / điểm bị huỷ | mở "Xử lý vắng", "Khôi phục kết quả" (không lưu) | bộ nút, chữ | F-02 |
| 10 | Ý thức của em đã xử lý | mở Xoá vi phạm, Khai báo bậc, Đã thực hiện (không lưu) | panel, quyền | F-03 |
| 11 | HV lớp thường có Final chưa kết luận | mở hộp Kết luận khoá | **chưa mở được** trên demo | §2.13 |
| 12 | Lưu trữ › chọn 2 em › Bỏ lưu trữ | dừng ở bước xem trước | bước xem trước hàng loạt | AU-33 |
| 13 | Lưới chấm trên điện thoại khi mạng yếu | gõ một ô | đang lưu / "Lưu lại" | AU-10 |
| 14 | Lưới Test như ảnh 5.webp, sau deploy, cùng máy, ở 100 % và 125 % | mở cùng lớp | ⋯ có "Sửa"; cỡ chữ so bản trước | AU-14, AU-02 |
| 15 | Trang đầu TVV + Head tutor, sáng thứ Hai | mở trang | có việc / rỗng | AU-24, AU-54 |
| 16 | **Đường MT chủ SP đã gặp** | (a) chữ trên nút lúc huỷ điểm · (b) hồ sơ MT lúc khôi phục · (c) hộp / trang lúc chuyển lịch · (d) câu lỗi nếu có; bản chính 18/10 còn nút "Huỷ MT{n}" — huỷ một ô hay cả MT? | đường thật trên bản chính | F-02 |
| 17 | Bảng Ý thức có chữ "báo trễ" | chụp đúng màn đã thấy | chữ "báo trễ" ở đâu (tab Ý thức của Phân tích không có chữ "trễ") | AU-50 |
| 18 | (không bắt buộc) Kế hoạch Test như ảnh 12a | chụp từng màn, không ghép | chắc chắn không có hàng trùng | TST-28 (đã bác) |

Không cần thêm ảnh: v4-4 (khoá R11 đã xác nhận bằng mã + tái hiện demo); ảnh vòng 1 (MP IV mô tả lại, khớp cách PTA đoán).

### 5.2 Dữ liệu bản chính (lệnh chỉ đọc hoặc chủ SP cung cấp)
- **TVV:** số em có / chưa có TVV theo chi nhánh (**chặn bật luật 1** — PTA #11; demo 4/129, bản chính chưa gán); số lần xử lý vi phạm / tuần; số em có SĐT phụ huynh.
- **MT:** số ô "Không dự thi" từ 18/10 (dữ liệu cũ khi đổi luật 4).
- **Lịch thi:** lộ trình nào đang "Đã thi" chỉ nhờ tháng (trước LT-SV).
- **"Thiếu thông tin":** tỉ lệ thiếu theo từng trường (Q-D4).
- **Hiệu quả PA:** số PA kết thúc / tháng / chi nhánh; lớp thường có cần bảng này không.
- **Tutor:** số tutor thật · buổi / tuần / chi nhánh · tỉ lệ buổi "Không" / đánh giá ≤ 2 · Head tutor có lọc nơi dạy / kỹ năng hằng ngày · có gọi tutor từ trang (SĐT trên hàng?) · nhịp viết nhận xét · tên gõ tay có nhiều không.
- **Dán Excel:** lượng dùng thật (0 trên demo; tính năng merge sau bản deploy 18/10).
- **Tốc độ:** "Toàn bộ" > 52 tuần trên DB lớn nhất; log `[cham]` trên Turso sau deploy.

### 5.3 PTA tự kiểm được (demo riêng, không cần chủ SP)
- Trạng thái sau Lưu: G1–G3 (AU-46); Kết quả PA còn tiêu đề (AU-44); "Lưu phân công" (AU-43); Duyệt nhiều làm mới số (A7-14), chuông sau khi việc xong (A7-15) — AU-04; "Thôi học" + Hoàn tác (AU-52).
- Bấm thử ảnh 5 (`case` trùng — AU-32); R11 (GV 20, `classId=28` — AU-14); đếm lại Đ1, Đ2 (F-02); demo đặt ngày 01/12/2026 (F-05); In Báo cáo > 10 dòng (AU-49).
- Chưa rà: Kế hoạch Test "Xếp nhiều MT" bước chọn lớp (lỗi khi đo); trình đọc màn thật + zoom 200 %; bản EN; 3 bảng nghi lệch (`PhanTichGiaoVien`, `BangDiemLopThuong`, `CatalogAdmin`); bảng ở 1 280–1 439 px; 10 đường cũ `duongMoi`; form sửa Báo cáo đơn vị; NeedsEvaluation (có thể đã mất lối vào); Nhật ký PA, Sửa / Xoá Case, Xoá / Kết thúc PA; hộp xác nhận Lưu quyền / Xoá tài khoản; Đăng ký chờ duyệt; "Cần bạn quyết" rỗng thật (demo không có QL 0 việc); trạng thái đang tải / lỗi qua "Kịch bản demo" (chỉ đọc mã); Tổng hợp lớp thường (lỗi `rowSpan` khi đo).

### 5.4 Chỗ phụ lục nói khác nhau — PTA chốt (không hỏi chủ SP)
1. v4b Q1 sinh việc TVV lúc "Đã thực hiện" ⚑ → theo L1 + PTA #1: sinh ngay khi lưu.
2. V4A-08 hạn "lưu + 5 × 24 h" ⚑ → PTA #2: 23:59 ngày lưu + 4.
3. V4C-01 mở trang Công việc cho TVV ⚑ → PTA #6: hàng đợi trên Tổng quan TVV.
4. v4b form việc TVV mở dưới dòng ↔ v4a khung phải → khung phải (luật một kiểu mở).
5. Tên việc TVV: "Ghi nhận kết quả xử lý" (v4a) ↔ "Báo PH · {bậc} · {em}" (v4b); nút "Ghi kết quả" ↔ "Việc của bạn / Việc của tôi"; số loại việc TVV 4 (v4a) ↔ 5–6 (v4b) → chọn một ở 05.
6. v4b cho QL tự thu hồi trực tiếp, có lý do → PTA quyết (02 4.7 C26), chủ SP đồng ý gói 21/10.
7. v4b Q5 "Hoàn tác 10 s" cho thu hồi ↔ L5 + X-51 (không Hoàn tác sau lưu ở xử lý vi phạm) → theo X-51.
8. Head tutor trang đầu (/tutor, không có Tổng quan) ↔ PTA #6 → /tutor là trang đầu (02 4.7 C24 — chủ SP đồng ý 21/10).
9. Admin VP còn menu Công việc ("Chấm điểm") ↔ PTA #6 → giữ mục Công việc (02 4.7 C25 — chủ SP đồng ý 21/10).
10. "Đang chọn" = nền + vạch trái 3 px (PTA #9) ↔ X-19 / DESIGN.md (viền khung 2 px) → PTA tự quyết, liệt kê ở 02 4.7 để chủ SP phủ quyết.
11. R11: cùng gốc còn 8 chỗ ngoài `regular.ts:631-643` (AU-14) → kế hoạch PR phải gỡ đủ.
12. v4c mục 1.4 ghi "ảnh #5" cho Case nhưng bảng ảnh #5 là Ý thức → sai số trong v4c, đã ghi đúng ở §5.1.

---

## Phụ lục A · Bảng tra mã gốc → vấn đề

Mỗi mã gốc có **một** chỗ chính (AU / F); khối có thể nhắc thêm mã liên quan. FB-x-nn tra ở [01](01-feedback-register.md) — khối nào cũng ghi FB chính.

- **A1:** 01 AU-06 · 02 AU-04 · 03 AU-05 · 04 AU-04 · 05 AU-16 · 06 AU-23 · 07 AU-16 (chữ: AU-13) · 08 AU-16 · 09 F-07 · 10 AU-07 (F-07) · 11 AU-22 · 12 AU-05 (AU-22) · 13 AU-05 · 14 F-07 · 15 AU-36 · 16 AU-22 · 17 AU-21 · 18 AU-21 · 19 AU-22 · 20 AU-24 · 21 AU-22 (AU-47) · 22 AU-21 · 23 AU-21 · 24 AU-21 · 25 AU-21 · 26 AU-19 (đã bác)
- **CV:** 01 AU-04 · 02 AU-18 (hết hiệu lực) · 03 AU-44 · 04 AU-45 · 05 AU-46 · 06 AU-17 · 07 AU-43 · 08 AU-43 · 09 AU-17 · 10 AU-48 · 11 AU-45 · 12 AU-45 · 13 AU-08 · 14 AU-05 · 15 AU-42 · 16 AU-05 · 17 AU-42 · 18 AU-45 · 19 AU-43 · 20 AU-47 · 21 AU-45 · 22 AU-47 · 23 AU-47 · 24 AU-41 · 25 AU-47 · 26 AU-45 · 27 F-07 · 28 AU-42 · 29 AU-42 · 30 AU-08 · 31 AU-41 · 32 AU-24 · 33 AU-16
- **A3:** 01 AU-29 · 02 AU-04 · 03 AU-26 · 04 AU-25 · 05 AU-25 · 06 AU-25 · 07 AU-30 · 08 AU-05 · 09 AU-27 · 10 AU-27 · 11 AU-27 · 12 AU-20 · 13 AU-27 · 14 AU-29 · 15 AU-31 · 16 AU-25 · 17 AU-03 · 18 AU-28 · 19 AU-30 · 20 F-05 · 21 AU-30 · 22 AU-18 · 23 AU-03 · 24 AU-28 · 25 AU-25 · 26 AU-09 · 27 AU-28 · 28 AU-30 · 29 AU-26 · 30 AU-17 · 31 AU-16 · 32 AU-36
- **TST:** 01 AU-37 · 02 AU-38 · 03 AU-37 · 04 AU-18 · 05 AU-40 · 06 AU-40 · 07 AU-40 · 08 AU-39 · 09 AU-39 · 10 AU-37 · 11 AU-37 · 12 AU-41 · 13 AU-18 · 14 AU-40 · 15 AU-41 · 16 AU-40 (F-02) · 17 AU-37 (F-01) · 18 AU-20 · 19 AU-37 · 20 AU-38 · 21 AU-45 · 22 AU-11 · 23 AU-37 · 24 AU-40 · 25 AU-40 · 26 AU-40 · 27 AU-40 · 28 AU-19 (đã bác)
- **A5:** 01 AU-04 · 02 AU-04 · 03 AU-05 · 04 AU-05 · 05 AU-05 · 06 AU-54 · 07 AU-06 · 08 AU-52 · 09 AU-16 · 10 AU-52 · 11 AU-51 · 12 AU-13 · 13 AU-11 · 14 AU-51 · 15 AU-07 · 16 AU-52 · 17 AU-51 · 18 AU-49 · 19 AU-06 · 20 AU-20 · 21 AU-53 · 22 AU-49 · 23 AU-55 · 24 AU-55 · 25 AU-19 · 26 AU-54 · 27 AU-54 · 28 AU-17 · 29 AU-50 · 30 AU-55 · 31 AU-55 · 32 AU-54 · 33 AU-09 · 34 AU-54 · 35 AU-49 · 36 AU-05 · 37 AU-05
- **A7:** 01 AU-04 · 02 AU-04 · 03 AU-05 · 04 AU-05 · 05 AU-04 · 06 AU-19 (đã bác) · 07 AU-05 · 08 AU-05 · 09 AU-04 · 10 AU-04 · 11 AU-05 · 12 AU-05 · 13 AU-05 · 14 AU-04 · 15 AU-04 · 16 AU-54 · 17 AU-05 · 18 AU-05 · 19 AU-04 · 20 AU-13 · 21 AU-13 · 22 AU-13 · 23 AU-13 · 24 AU-13 · 25 AU-13 · 26 AU-13 · 27 AU-13 · 28 AU-13 · 29 AU-16
- **B:** 01 AU-01 · 02 AU-06 · 03 AU-15 · 04 AU-15 · 05 AU-09 · 06 AU-19 · 07 AU-02 · 08 AU-13 · 09 AU-21 · 10 AU-39
- **X (tài liệu chính mục 4):** X1 AU-04 + AU-05 · X2 AU-06 · X3 AU-07 · X4 AU-15 · X5 AU-15 · X6 AU-16 · X7 AU-08 + AU-09 + AU-03 · X8 AU-13 · X9 AU-17 · X10 AU-13 · X11 AU-19
- **V2A:** 01 AU-11 · 02 AU-13 · 03 AU-13 · 04 AU-26 · 05 AU-18 · 06 F-05 · 07 F-05 · 08 F-05 · 09 AU-25
- **V2B:** 1 AU-01 · 2 AU-01 · 3 AU-29 · 4 AU-30 · 5 AU-07 (12 chỗ ở AU-30) · 6 AU-31 · 7 AU-31 · 8 AU-34 · 9 AU-01
- **V3A** (không có V3A-4): 1 F-01 · 2 AU-41 · 3 F-01 · 5 AU-18 · 6 AU-39 · 7 AU-01 · 8 AU-03 · 9 AU-01 · 10 F-01
- **V3B:** 01 AU-06 · 02 AU-06 · 03 AU-06 · 04 AU-49 · 05 AU-49 · 06 AU-50 · 07 AU-18 · 08 AU-11 · 09 AU-12 · 10 AU-53 · 11 AU-54 · 12 AU-54 · 13 AU-06 (gốc chung: AU-12, AU-18, AU-49)
- **V4A:** 01 AU-42 · 02 AU-22 · 03 AU-08 · 04 AU-08 · 05 AU-43 · 06 AU-44 · 07 AU-18 · 08 F-03
- **V4B:** 01 F-03 · 02 F-03 · 03 AU-17 · 04 AU-14 · 05 AU-14 · 06 AU-14 · 07 F-02 · 08 F-02 · 09 F-02 (+ F-03 phần §20.3)
- **V4C:** 01 F-03 · 02 AU-09 · 03 AU-09 · 04 AU-09 · 05 AU-11 · 06 AU-35 · 07 AU-35 · 08 AU-36 · 09 AU-03 · 10 AU-10 · 11 AU-10 · 12 AU-48 · 13 AU-08 · 14 AU-33
- **v1 (không đánh mã):** v1-nen A1, A2, A3, E2, E10, E11 → AU-02 · B1, B2, E7, E8, E9, E13, E14 → AU-03 · C1, E16 → AU-09 · D, E15 → AU-16 · E1, E3–E6, E12 (dấu lưu, chip / chữ 11 px) → AU-02, AU-03, AU-10 · v1-tq P1 → AU-06 · P2 → AU-22, AU-23, AU-36, AU-04 · P3 → F-04 · P4 → AU-22 · P6 → AU-07 · P7 (mockup cũng có lỗi) → AU-19, 06.
- **Giả thuyết G1–G8 (tài liệu chính 6.3):** G1–G3 → AU-46 · G4 → AU-04 (A7-14) · G5 → AU-04 (A7-15) · G6 → AU-19 (N13) · G7 → AU-05 (A5-37) · G8 → §5.2 (tốc độ).

