# 01 · Feedback Register — sổ góp ý của chủ SP (20/10/2026, sau vòng 4; bổ sung 21/10)

> **Mục đích.** Một sổ duy nhất ghi MỌI góp ý của chủ SP từ 20/10 chiều tới master prompt cuối (gọi tắt **MP**), kèm các quyết định trước 20/10 còn ảnh hưởng UX. Mỗi ý một dòng, mã cố định; biết loại (A–F), mức, nơi áp dụng, đã xử lý ở đâu, đang ở trạng thái nào. Ý trùng được gộp thành **vấn đề hệ thống (HT, mục 6)** nhưng chi tiết và ngoại lệ vẫn nằm ở dòng FB.
> **Cách đọc.** Tra theo vòng (mục 3). Muốn biết một vấn đề lớn gồm những ý nào → mục 6. Muốn biết mục nào của MP đã có dòng → mục 7. Xung đột, quyết định đã chốt, câu hỏi → [`02-conflict-decision-log.md`](02-conflict-decision-log.md). Số mục kiểu "10.2", "11.1a", "12.9-3" là mục của tài liệu chính; mã kiểu "A1-02", "CV-07", "V2B-6", "TST-16" là mã phát hiện ở phụ lục; "Q-A1…Q-E2" là câu PHẢI HỎI ở 02 mục 5; "X-nn" là dòng xung đột ở 02 mục 3.
> **Bộ tài liệu.** [`00-muc-luc.md`](00-muc-luc.md) · **01 · Feedback Register (tệp này)** · [`02-conflict-decision-log.md`](02-conflict-decision-log.md) · [`03-ux-ui-audit.md`](03-ux-ui-audit.md) · [`04-design-system.md`](04-design-system.md) · [`05-ia-workflow.md`](05-ia-workflow.md) · [`06-mockup-gap.md`](06-mockup-gap.md) · [`07-pr-plan.md`](07-pr-plan.md) · tài liệu chính [`../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md`](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md) · phụ lục [`../2026-10-20-danh-gia-ux/`](../2026-10-20-danh-gia-ux/).
> **Trạng thái.** Chỉ tổng hợp / đánh giá — chưa sửa mã, chưa giao PR (MP I: không sửa mã, không merge, không deploy tới khi duyệt vòng cuối). Soạn: agent d1 (Opus 5.5) cho PTA Plan, đêm 20/10.

---

## 0. Tóm tắt

- **97 dòng góp ý (FB):** vòng 0 = 17 · vòng 1 = 12 · vòng 2 = 17 · vòng 3 = 17 · vòng 4 = 34 (gồm FB-4-34 — lời chủ SP 21/10, sau MP). Thêm **59 quyết định trước 20/10** (mã gốc, mục 4) và **27 ý PTA tự đề xuất** (loại C, mục 5) để không lẫn với lời chủ SP.
- **Loại chính:** A 62 · B 11 · D 21 · E 3. Có chữ D ở 41 dòng, E ở 9 dòng, F (xung đột / chưa rõ) ở 9 dòng — F được giải ở 02 mục 3.
- **Gộp thành 22 vấn đề hệ thống** HT-01…HT-22 (mục 6). Lớn nhất: bảng lệch / ô điểm (HT-03), số liệu + chỉ số bấm được (HT-04), làm tại chỗ / panel (HT-05), Tổng quan ↔ Công việc (HT-09), sửa sau lưu (HT-13), MT "-" (HT-14).
- **4 luật Phần II:** mã đang **lệch** ở 3 luật — luật 1 (chưa có việc TVV), luật 3 (khoá R11 sau "đợt hoàn tất" — đúng ảnh v4-4), luật 4 (MT tuần cũ: "-" = Không dự thi). Luật 2 đi cùng luật 1 (chưa có việc nên chưa có hạn). Chỉ hỏi tình huống biên (02 nhóm B, D).
- **Kiểm chéo:** mọi đề mục IV–XV của MP đều có ≥ 1 FB (mục 7). Ý chỉ có ở MP: 4 luật, III.1, III.8 "riêng Phân tích", III.9, XI.1–XI.6, XII, XIII, XIV, XV, GĐ5 "xuyên đêm" (mục 8).
- **Bổ sung 21/10 (agent v4d):** FB-4-35 (A — Tạo Case nhiều kỹ năng trong một panel) · FB-4-36 (B — chuông / nhắc việc "như Base", góp ý GV trung tâm qua chủ SP) → **99 dòng FB**, vòng 4 = 36; loại chính A 63 · B 12. Không câu PHẢI HỎI mới (02 mục 4.5c).
- **Bổ sung 21/10 — vòng phê duyệt cuối (agent d6):** chủ SP **trả lời 17/17 câu** + **đồng ý cả gói PTA tự quyết** (02 mục 5, 2.9). Ý mới thành **FB-4-37…FB-4-42**: luật 4 sửa (MT cũ "-" = huỷ ngay, đếm theo tuần, khôi phục = 2 lần, duyệt thêm = +1) · Hoàn tác 10 s + vẫn khôi phục ("tại sao phải chặn cứng?") · việc TVV 4 việc + hạn · S chéo không cần lớp · tên "Cần làm" · "vẽ mockup Chấm Test, tôi duyệt sau" → **105 dòng FB**, vòng 4 = 42; loại chính A 68 · B 13. Các dòng "Chờ trả lời Q-xx" nay ghi "Đã trả lời 21/10".

---

## 1. Bốn luật nghiệp vụ đã xác nhận 20/10 (MP Phần II) — nguyên văn

> **II. Bốn quy tắc nghiệp vụ đã được tôi xác nhận — KHÔNG HỎI LẠI**
>
> **1. Khi nào tạo công việc TVV về kết quả xử lý vi phạm?**
>
> **Ngay khi GVCN lưu thông tin xử lý vi phạm**, hệ thống phát sinh công việc cho TVV ghi nhận kết quả xử lý. Không cần đợi một bước phê duyệt khác mới tạo công việc, trừ khi sau này tôi thay đổi luật này.
>
> **2. Hạn của công việc TVV nói trên**
>
> **5 ngày lịch**, tính từ thời điểm GVCN lưu xử lý vi phạm; **bao gồm thứ Bảy và Chủ nhật**. Nếu cách tính mốc thời gian/giờ kết thúc hạn trong hệ thống vẫn chưa rõ, có thể làm rõ **chi tiết kỹ thuật về thời điểm hết hạn**, nhưng không được đổi 5 ngày lịch thành 5 ngày làm việc.
>
> **3. Quyền sửa dữ liệu sau khi lưu**
>
> **Nếu vai trò có quyền chỉnh sửa, người dùng vẫn được sửa dữ liệu sau khi đã nhập và lưu; phải có lịch sử thay đổi.** Các bước **duyệt bắt buộc** theo nghiệp vụ vẫn được giữ nguyên. Không được khóa cứng vô lý chỉ vì dữ liệu đã lưu, cũng không được tự bỏ quy trình duyệt với dữ liệu cần duyệt.
>
> **4. Quy tắc dấu “-” cho MT trong cùng chuỗi dời**
>
> **Dấu “-” lần thứ nhất → dời sang tuần tiếp theo. Dấu “-” lần thứ hai trong cùng chuỗi dời → hủy**. Áp dụng nhất quán kể cả khi thao tác với lịch MT của tuần cũ. **Với MT hiện tại vẫn phải giữ workflow gửi duyệt như trước**. Cần phân tích đầy đủ trạng thái và đường chuyển trạng thái để không nhầm “hủy lịch”, “hủy điểm”, “hủy MT”, “dời” và “gửi duyệt”; không tự thay đổi luật này.

**Hiện trạng so với 4 luật** (agent d1 đọc mã `main` chỉ đọc, chưa bấm thử trên demo):

| Luật | Đang chạy (mã / Rulebook) | Kết luận | FB | Tình huống biên (02) |
|---|---|---|---|---|
| 1 | Chưa có việc nào cho TVV về vi phạm. `server/src/yThuc` chỉ có `bao_ph_tvv` (việc của **GVCN** "Báo phụ huynh qua TVV", lớp thường). Việc Ý thức hiện có đều của GVCN: `yt_xem` (ghi nhận), `yt_xu_ly` (xác nhận xử lý), `yt_thuc_hien` (QL đã duyệt, chưa thực hiện) — `server/src/worklist/mywork.ts:153, 1248-1312`. WL 3 / loại ngoài thang qua QL duyệt 5 ngày (Rulebook §20 bảng, dòng 8) | **LỆCH — phải làm mới** (máy chủ + giao diện) | FB-4-09 | Đã trả lời 21/10: Q-D1 ①, Q-D3 ①; nơi làm Q-A1 ① (Tổng quan TVV); bộ việc TVV → FB-4-39 |
| 2 | Chưa có (đi cùng luật 1). Hạn Ý thức đang có của GVCN = "5 ngày, tính cả ngày đầu" (Rulebook §20 bảng, dòng 9) | Làm mới; cách đếm khác hạn Ý thức → làm rõ giờ hết hạn (được phép) | FB-4-10 | PTA tự quyết (02 mục 4.7): ngày lưu + 4, hết 23:59 giờ VN |
| 3 | **R11 (23/09):** sau "đợt hoàn tất" (qua Chủ nhật tuần muộn nhất) GVBM không sửa / xoá điểm đã có — chỉ QL (`server/src/normal/regular.ts:631-643`, `server/src/fasttrack/hoanTat.ts:113-117`; Rulebook dòng 589, 600, 723); MT cũ khoá 7 ngày sau lần nhập cuối (dòng 564); lớp đã kết thúc chỉ QL (OV-11g, 14/10 Q4). Quyết định 13/10 "ai lưu được thì sửa được + QL, có nhật ký" — đúng hướng luật 3 | **LỆCH ở R11 + khoá 7 ngày** (đúng ảnh v4-4: Progress Test chỉ còn "Lịch sử") | FB-4-11, FB-4-25 | Đã trả lời 21/10: Q-B1 ① (giữ khoá đóng hồ sơ), Q-B2 ① |
| 4 | Trong tuần thi: "-" lần 1 dời tuần sau, lần 2 huỷ phần thi (đúng). **Sau tuần thi / MT cũ: "-" = Không dự thi, không dời** (`shared/domain/vang.ts:10-15`, OV-1b; plan 11/10; T23 06/10; Rulebook dòng 744). Lần 2 → GVCN "Xin dời" → QL duyệt (T3) = "luồng gửi duyệt" phải giữ | **LỆCH**: "-" ghi muộn ở MT hiện tại phải dời (không "Không dự thi"); MT cũ theo **luật 4 sửa 21/10** = **huỷ ngay** (khôi phục được), không phải "Không dự thi" | FB-4-12, FB-4-37 | Đã trả lời 21/10 → luật 4 sửa (FB-4-37, FB-4-38) |

**Luật 4 sửa 21/10 (FB-4-37 — thay phần MT cũ của luật 4 ở trên):** MT hiện tại "-" lần 1 → dời tuần kế (không dời được → thẻ QL), **đếm theo tuần** (sửa / gõ lại "-" trong cùng tuần không tính thêm), lần 2 → huỷ; "-" ghi muộn (< 2 tuần) → tuần kế của lịch nếu còn thi được, không thì thẻ QL · **MT cũ (≥ 2 tuần) "-" → huỷ ngay** · QL **Khôi phục** → chuỗi đặt lại, được dời 2 lần · QL **duyệt cho dời thêm** → +1 lần, vắng tiếp → huỷ · gõ nhầm → **Hoàn tác 10 s**, sau đó vẫn khôi phục được (FB-4-38) · lớp thường không đổi. Chi tiết: 02 mục 2.9.

**Bổ sung 21/10 (sau MP — FB-4-34, loại A):** GVCN muốn **thu hồi** một lần xử lý vi phạm đã lưu, hoặc **xử lý mà không tăng bậc** → phải **gửi QL duyệt, bắt buộc kèm lý do**. Đây là một **bước duyệt bắt buộc mới** — khớp luật 3 ("giữ duyệt bắt buộc"), thay quyết định 13/10 "sửa sau lưu không thêm duyệt" ở riêng hai thao tác này. Hiện trạng: `xoaXuLy` (`server/src/yThuc/xuLy.ts:622-638`) cho GVCN **xoá thẳng** lần xử lý mới nhất, không duyệt, không bắt lý do → **lệch**; "không tăng bậc" chưa thấy đường riêng (thang tự lấy bậc kế — `bacKeTiep`, `shared/domain/yThuc.ts:316`; loại ngoài thang đã qua QL duyệt — `xuLy.ts:498-543`) → cần kiểm. Chạm luật 1 (việc TVV đã sinh khi lần xử lý bị thu hồi / bị từ chối) → gộp vào Q-D1.

---

## 2. Quy ước

- **Mã FB-<vòng>-<nn>:** vòng 0 = 20/10 chiều (12 ảnh + lời) · 1 = 20/10 tối · 2, 3 = 20/10 khuya · 4 = MP + 4 ảnh (20/10 khuya) + lời bổ sung sau MP (21/10, FB-4-34 trở đi). Quyết định trước 20/10 dùng **mã gốc** (C06, T18, HD2, "06/10-NGAY"…, mục 4). Ý PTA dùng PTA-nn (mục 5).
- **Ảnh:** v0-1…v0-12b = 12 ảnh 20/10 chiều (mô tả ở `anh-chu-sp.md` của phiên 70d93ba9; chỉ 3 ảnh đầu có tệp) · v1-1…v1-5 = ảnh vòng 1 (không kèm tệp; MP IV mô tả lại, khớp cách PTA đoán ở mục 10) · v2-1 Học viên & Lớp mở Bộ lọc thêm · v2-2 Hồ sơ lớp › Ý thức › Vi phạm · v2-3 Phối hợp SOS · v2-4 lưới MT3 phóng to · v2-5 terminal Vite · v3-1 lưới lớp thường, nút ⋯ (`1.jpg`) · v4-1 Công việc QT Monbay (`2.jpg`) · v4-2 nút "Phân công…" (`3.png`) · v4-3 gạch chân xanh (`4.png`) · v4-4 **bản chính** Progress Test bị khoá (`5.webp` — dữ liệu thật, không chép tên). Ảnh vòng 3–4 nằm ở thư mục `images` của phiên 73e605ad (tệp tạm, không vào repo).
- **MP gọi lại ảnh theo từng phần:** MP IV "Ảnh 1–5" = v1-1…5 · MP VI "Ảnh 3, 4, 5" = v2-3, v2-4, v2-5 · MP VIII "Ảnh 1" = v3-1 · MP XI "Ảnh 1, 2, 3" = v4-1, v4-2, v4-3 · MP XIII.1 "Ảnh 4" = v4-4.
- **Loại (MP I.2):** **A** đã chốt · **B** phương án chủ SP đề xuất / yêu cầu nghiên cứu, chưa chốt · **C** ý PTA (mục 5) · **D** lỗi đã xác nhận · **E** cần kiểm chứng · **F** xung đột / chưa rõ. Ghép "A·D" = chủ SP đã chốt phải sửa một lỗi đã xác nhận. Chữ đầu = loại chính.
- **Mức:** **P0** sai dữ liệu / chặn việc · **P1** gây nhầm, bỏ sót, tốn nhiều bước · **P2** khó chịu, có đường vòng · **P3** chỉnh nhỏ · "—" luật làm việc / quy trình.
- **Trạng thái:** Đã kiểm (có bằng chứng) · Đề xuất (có phương án, chờ duyệt / mockup) · Chốt — chờ làm · Chờ trả lời Q-xx · Hết hiệu lực (vì sao) · Đang áp (luật làm việc) · Cần ảnh / dữ liệu.
- **Viết tắt:** QL quản lý chi nhánh · QT quản trị · GVCN giáo viên chủ nhiệm · GVBM giáo viên bộ môn · TVV tư vấn viên · CX chăm sóc · VP văn phòng · HV học viên · LT lớp thường · FT Fast Track.

---

## 3. Sổ góp ý theo vòng

### 3.0 Vòng 0 — 20/10 chiều: 12 ảnh + lời chủ SP (tài liệu chính mục 0, 6.1, 9.1)

| Mã | Lời chủ SP (rút gọn, giữ nghĩa) | Ảnh | Trang · khu | Loại | Mức | Nơi áp dụng | Xử lý ở đâu | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| FB-0-01 | Tổng quan QT (Monbay, FT): "Chờ duyệt 10" mà hiện 12 thẻ, có thẻ BC / CP; 58 ↔ 53 bài trễ chấm; 19 ↔ 5 Case; tiêu đề "Việc hôm nay"; đầu trang nhiều hàng, ô chi nhánh xa; thẻ duyệt cao, "Nếu duyệt" lặp mọi thẻ; chữ mờ "L R W S" | v0-1 | Tổng quan | D | P1 | Tổng quan QL / QT · hộp Chờ duyệt · mọi số trên trang | 6.1; A1-02, A1-03, A1-07…12; A7-01, 03, 17; X1, X6; SL1, SL2, M1 | Đã kiểm (đúng); 9.1-4 đã chốt một phạm vi; chờ làm |
| FB-0-02 | Tutor mở ra rỗng; chip 0 + 0 + 1 + 1 ≠ 8; nút chính "Tải danh sách" | v0-2 | Tutor | D | P1 | Tutor · Head tutor · dữ liệu demo | 6.1; A5-06, A5-34; X11; 12.8 | Đã kiểm; nút chính PTA tự quyết (9.2-34) |
| FB-0-03 | Công việc GV Linh: việc "2 bài" mà panel 3 em; bảng nửa panel; tiêu đề ≠ tên việc; 2 link ↗ rời sang Test; "Chờ 4 kỹ năng"; "Lớp tôi dạy" tràn thẻ; số "Công việc" khác nghĩa theo vai | v0-3 | Công việc | D | P1 | Công việc GV · panel Nhập điểm · số trên menu | 6.1; CV-01, 04, 10, 11, 12; B-01; A7-10, A7-13; mockup 2 khung "Trước" | Đã kiểm |
| FB-0-04 | Hồ sơ lớp › Tổng hợp: trang cực dài; lưới Điểm MT ngay dưới bảng; "Thiếu n" gần mọi em | v0-4 | Hồ sơ lớp | D | P1 | Hồ sơ lớp mọi tab | A3-01, A3-04; X4, X5; 11.3 | Đã kiểm; "bỏ lưới" hết hiệu lực → lưới gập (FB-2-11) |
| FB-0-05 | Hồ sơ lớp › Ý thức: ~45 vi phạm phẳng; lưới MT vẫn ở dưới | v0-5 | Hồ sơ lớp › Ý thức | D | P1 | Ý thức & Phối hợp lớp | A3-15, A3-01; 11.3 (V2B-6) | Đã kiểm; đề xuất phương án A |
| FB-0-06 | Học viên & Lớp › Tất cả: hàng 2–4 dòng; "Thiếu n" mọi em; "+1" giấu việc quá hạn; ô tick trước tên | v0-6 | Học viên & Lớp | D | P1 | bảng HV mọi góc | A3-04, 05, 06; 7.4; 11.2 | Đã kiểm |
| FB-0-07 | Học viên & Lớp › Cần làm: về bản chất là danh sách Công việc lặp lại; "Cần làm 51" = "Tất cả 51"; đầu nhóm đếm theo trang | v0-7 | Học viên & Lớp › Cần làm | D | P1 | góc Cần làm | A3-03; A7-08, 09; 11.2 (V2A-04) | Đã kiểm; **đã trả lời 21/10** (Q-A4: bộ lọc trong bảng Tất cả, giữ tên "Cần làm" — FB-4-41) |
| FB-0-08 | Đang SOS: hai bảng FT / LT khác tiêu đề, chữ cắt "…" | v0-8 | Học viên & Lớp › Đang SOS | D | P1 | Đang SOS | A3-02, A3-09; 9.2-16 | Đã kiểm (thêm: chia trang làm SOS 3 rơi xuống trang 2) |
| FB-0-09 | Báo cáo: SOS 2/3/0 ↔ Tổng quan 6/5/3; "28 bài · 3 GV" mà bảng 4 dòng; ⚠4 ↔ ⚠5; "2 chưa lịch Test" ↔ 3; ô chi nhánh lệch hàng lọc | v0-9 | Phân tích › Báo cáo | D | P1 | Báo cáo · mọi số cùng tên | A5-02…05; A7-12; G7; 9.1-4 | Đã kiểm; "2 ↔ 3" không tái hiện |
| FB-0-10 | Kết quả thi › Mock: không có công tắc FT / LT; ô trống "chưa có" ↔ "—"; chữ cắt | v0-10 | Phân tích › Kết quả thi | D | P2 | Kết quả thi | A5-10, A5-12 | Đã kiểm |
| FB-0-11 | Phân tích GV: câu hướng dẫn + chú giải dài; ô "không có / — / mẫu nhỏ" | v0-11 | Phân tích › Phân tích GV | D | P2 | Phân tích GV | A5-11, A5-12; 9.2-30 (khung 4c) | Đã kiểm |
| FB-0-12 | Kế hoạch Test: chip dày ký hiệu ("L R W S", "/2026" mọi ô), "vào muộn" gần mọi em; nghi hàng hiện hai lần | v0-12a | Test › Kế hoạch Test | D | P1 | Kế hoạch Test | TST-05, 06, 07; TST-28 (hàng lặp = lỗi ghép ảnh, không phải lỗi web) | Đã kiểm |
| FB-0-13 | Lịch Test: 3 ô số trùng đầu khối; "13" không đơn vị; trang rất dài; "Nhận xét", "Điền cả cột" lặp; nút "Tạo bài kiểm tra theo chương trình" | v0-12b | Test › Lịch Test | D | P1 | Lịch Test / Chấm Test | TST-01, 03, 08, 10; 12.2 | Đã kiểm; Q-C1 (21/10): vẽ mockup "theo hạn", chủ SP duyệt sau (FB-4-42) |
| FB-0-14 | Giao diện sau nâng cấp gần như không bám mockup đã duyệt; vài chỗ trải nghiệm tệ hơn bản trước | — | Toàn web | D | P1 | mọi màn có mockup | mục 3 (N1–N12, Q1–Q13), 2.3; 9.1-1, 9.1-2; 06-mockup-gap | Đã kiểm (~60 % khớp; Tổng quan, Hồ sơ lớp ~40 %); quy trình đã chốt ở 9.1 |
| FB-0-15 | Quá nhiều panel thừa; vài thao tác bắt sang hẳn trang khác → rườm rà, đứt mạch | — | Toàn web | D | P1 | panel, link, chip, số | X3, X4 (≥ 15 chỗ); 10.3; 11.1c | Đã kiểm; đề xuất "hợp đồng panel" |
| FB-0-16 | Rà TẤT CẢ trang, panel (chính, phụ, mở khi thao tác), box, bảng, nút, icon, chữ; bố cục, điều hướng, luồng, số bước; tự phát hiện chỗ không có ảnh; cần ảnh thì nói đúng trang / vùng / thao tác / trạng thái | — | Toàn web | A | — | mọi vai | mục 1, 5, 6.2, 6.5; 03-ux-ui-audit | Đã làm đợt 20/10; tiếp ở 03 |
| FB-0-17 | Đánh giá khách quan, không bảo vệ quyết định cũ; được đề xuất thay đổi lớn; CHỈ đánh giá + kế hoạch, không sửa web | — | Quy trình | A | — | mọi session | mục 0, 2; FB-4-05 | Đang áp |

### 3.1 Vòng 1 — 20/10 tối: chung + Tổng quan (tài liệu chính mục 10; ảnh không kèm tệp)

| Mã | Lời chủ SP (rút gọn, giữ nghĩa) | Ảnh | Trang · khu | Loại | Mức | Nơi áp dụng | Xử lý ở đâu | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| FB-1-01 | Chữ vẫn quá nhỏ, nhiều chỗ còn nhỏ hơn bản đang deploy; rà toàn bộ chữ, phân cấp tiêu đề / nội dung / phụ / nhãn / nút / số; được tự chọn phông tiếng Việt đúng; không nhồi thông tin bằng chữ nhỏ; phải tốt hơn THẬT | — | Toàn web | A·D | P1 | mọi trang, bảng, chip; ô nhập 375 | 10.1 (OV-15a hạ ô bảng 14 → 13 px; ~69 % lớp chữ ≤ 12,5 px); MP III.2; 04 | Đã kiểm (đúng một phần); thang mới PTA tự quyết (10.7-7) |
| FB-1-02 | Thứ tự menu: Tổng quan → Lớp/HV → Test → Công việc → Phân tích → Tutor; không đề xuất đổi | — | Thanh trên | A | P2 | thanh trên, thanh dưới 375, mọi vai | 10.1 (`shared/domain/dieuHuong.ts:51-52`); MP III.6 | Chốt — chờ làm (NEN); mockup có "Công việc đầu" hết hiệu lực |
| FB-1-03 | Tô màu chính con số điểm (không chỉ ký hiệu); áp mọi chỗ có điểm; tự kiểm phối màu, tương phản, dễ đọc | — | Toàn web | A | P1 | 19 nơi có điểm (6 cách tô) | 10.1 (3 token `--kq-*`; mù màu ΔE 1,3 → 11,4); 12.1; MP III.3 | Chốt; luật màu PTA tự quyết |
| FB-1-04 | (ảnh 1) Nút gạch chân bấm chỉ "nháy", không ra panel — lỗi thật hay giới hạn demo; thanh thông tin nhồi một dòng, thiếu điểm nhấn | v1-1 | Tổng quan | D | P1 | dải "HV cần chú ý" + hàng "Cả Monbay" | 10.0 II.1; A1-01 (hai nơi chung khoá `?so-lieu=`); X2; SL1; MP IV.1 | Đã kiểm: lỗi thật; dải → PTA đề nghị bỏ (10.7-3) |
| FB-1-05 | (ảnh 2, 3) Quá nhiều chỉ số + panel gần như vô giá trị; số để quan sát thì không cần bấm; đã cho bấm thì phải đủ, rõ, rút gọn việc thật, không lặp thứ đã thấy | v1-2, v1-3 | Tổng quan | A | P1 | 29 thành phần Tổng quan → mọi số trên web | 10.2 (giữ 7 · đổi 15 · bỏ 7; panel danh sách số 6 → 0; 4 loại số); 12.4; MP IV.2 | Đề xuất |
| FB-1-06 | (ảnh 2) Đề xuất: nút "Thêm PA" ngay trên hàng HV, bấm mở rộng khu thêm PA tại chỗ (chưa chốt) + nguyên tắc "làm được tại chỗ thì tại chỗ, không bỏ mọi panel" áp toàn web | v1-2 | Tổng quan → toàn web | B·A | P1 | bảng HV rộng; hàng đợi việc | 10.3 (thang 0–5), 11.1c; MP IV.3, III.5, XVI.B | Đề xuất: áp ở bảng rộng, danh sách hẹp dùng khung phải (02 X-39) |
| FB-1-07 | SOS: phải bấm đúng con số mới mở, vùng bấm quá hẹp → overhaul cả hiển thị, tương tác và nội dung panel SOS | — | Tổng quan | A·D | P1 | chip SOS, ô SOS mọi trang | 10.2 (SOS); B-02 (8×12 px); A3-10, A3-11; MP IV.4 | Đã kiểm; đề xuất mở rộng hàng lớp tại chỗ |
| FB-1-08 | Bỏ phần Trễ chấm khỏi Tổng quan | — | Tổng quan | A | P2 | Tổng quan QL / QT | 10.0 II.4; MP IV.5, XVI.A | Chốt; khối Trễ chấm của mockup 3 hết hiệu lực |
| FB-1-09 | (ảnh 4) Thiết kế lại từ đầu khu "Việc hôm nay": tốn diện tích, dày, cồng kềnh, không phân biệt nhóm việc, rối mắt | v1-4 | Tổng quan | A | P1 | khối "Cần bạn quyết" | 10.2 (A / B / C / D, đếm bước); MP IV.6 | Đã trả lời 21/10: Q-A2 ① bố cục B |
| FB-1-10 | (ảnh 5) Hover của hàng gần như trùng khu chứa; rà hover, phân biệt cấp thông tin, vùng tương tác — toàn web | v1-5 | Toàn web | A·D | P2 | mọi bảng / danh sách | 10.1 (ΔL 2,8–4,5; 29/35 loại hàng có hover mà không bấm được); MP IV.7 | Đã kiểm; hệ trạng thái → 04 (02 X-19) |
| FB-1-11 | (ảnh 5) Thiết kế lại khu công việc + bố cục Tổng quan (vấn đề lớn nhất); chủ SP cân nhắc: hộp duyệt trên, dưới trái danh sách / phải chi tiết, làm ngay tại đây — chưa chốt, có cách hơn thì đề xuất + so sánh | v1-5 | Tổng quan | B | P1 | Tổng quan QL / QT (+ Công việc) | 10.2, 10.7-1, 10.7-2; MP IV.8, XVI.B | Đã trả lời 21/10: Q-A1 ①, Q-A2 ① |
| FB-1-12 | Cách làm: giữ cái đã chốt, xét khách quan cái chưa chốt, mở rộng sang chỗ cùng cấu trúc, tính số bước / chuyển trang, đối chiếu mockup, cập nhật tài liệu; mỗi thành phần hỏi "cần không · giúp gì · gộp được không · làm tại chỗ được không · đơn giản hơn được không"; panel / nút / trang mới không mặc nhiên là cải tiến | — | Quy trình | A | — | mọi đề xuất | 10.4; MP III, XVIII | Đang áp |

### 3.2 Vòng 2 — 20/10 khuya: Học viên & Lớp, Hồ sơ lớp, Hồ sơ HV (tài liệu chính mục 11; 5 ảnh)

| Mã | Lời chủ SP (rút gọn, giữ nghĩa) | Ảnh | Trang · khu | Loại | Mức | Nơi áp dụng | Xử lý ở đâu | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| FB-2-01 | Bộ lọc thời gian chỉ còn Tuần bắt đầu → Tuần kết thúc; bỏ tháng / 2 tuần / khoảng cố định; chỗ cần mặc định thì đặt sẵn (vd tuần trước → tuần sau), chọn lại được; áp mọi bộ lọc tương tự; logic đặc thù (tháng thi, ngày thi thật) xét riêng | v2-1 | Học viên & Lớp → toàn web | A | P1 | 14 chỗ chọn thời gian, 5 dáng | 11.1b (V2A-01); 12.7; MP III.8, V.1 | Chốt; thành phần `Khoảng tuần` cần mockup |
| FB-2-02 | "Tuần thi của kết quả" → "Thời gian"; rà cụm chữ thiếu tự nhiên toàn web | v2-1 | Học viên & Lớp › Bộ lọc thêm | A | P2 | ~20 cụm chữ | 11.2 (V2A-02); MP V.2 | Chốt |
| FB-2-03 | Bảng khi chọn "Cần làm": khó chịu, cột không tự nhiên, lộn xộn; xét mục đích, cột nào cần, tiêu đề tự nhiên, bỏ thứ vô giá trị, trạng thái, nhóm, thao tác ngay trên bảng; không được thì làm lại hoàn toàn. MP V.3 thêm: **không đổi logic xác định việc** | — | Học viên & Lớp › Cần làm | A·F | P1 | góc Cần làm, mọi vai | 11.2 (V2A-04); 9.2-14; 11.8-8; MP V.3, XVI.B | Đã trả lời 21/10: Q-A4 — bộ lọc trong bảng Tất cả, giữ tên "Cần làm" (FB-4-41) |
| FB-2-04 | Ô tick chọn HV để xuất Excel xấu, chiếm chỗ, làm hàng dày. A: bỏ tick, xuất theo phạm vi đang xem (lớp đang mở, bộ lọc), bớt em trong Excel · B: giữ chọn nhưng gọn · được đề xuất phương án 3. MP V.4 thêm: **chưa chốt A/B; nếu A thì nói rõ ưu tiên lớp đang mở hay bộ lọc** | v2-1 | Học viên & Lớp | B | P2 | mọi góc HV & Lớp + panel Xuất | 11.2 (V2A-05: ô tick chỉ +0,5 % chiều cao; "Chọn tất cả" chỉ lấy lớp đang mở); MP V.4 | Đã trả lời 21/10: Q-E2 ① (bớt em ở panel Xuất) |
| FB-2-05 | Thi = kỳ thi thật; Test = MT, Progress, Final, Mini…; nhóm gồm cả hai gọi "Test"; rà mọi tiêu đề, bộ lọc, bảng, nút, panel, thông báo, trạng thái | — | Toàn web | A | P1 | ~295 chuỗi đang dùng "thi" cho Test | 11.1d (V2A-03); MP III.7, V.5 | Chốt; chữ cụ thể PTA tự quyết (11.8-5) |
| FB-2-06 | Overhaul bộ lọc + bảng Lịch thi: thông tin HV + các Test liên quan, cái gì trên hàng / ở phần mở rộng, phân biệt trạng thái lịch thi, ít panel | — | Học viên & Lớp › Lịch thi | A | P1 | Lịch thi, tệp xuất | 11.2 (V2A-06); MP V.6 | Đề xuất (cần mockup) |
| FB-2-07 | "Ghi chú họp" → "Ghi chú"; "Cần xác nhận" ở kết luận: nếu thực chất là chưa có kết luận thì hiện đúng "chưa có kết luận"; có nghĩa nghiệp vụ khác thì giải thích + hỏi | — | Học viên & Lớp › Lịch thi | A·F | P2 | đầu cột, ô nhập, cột xuất, Lịch sử HV | 11.2 (V2A-07); 11.8-6; MP V.6, XVI.C | Đổi tên đã chốt; Q-C4 ① (21/10): bỏ "Cần xác nhận", hiện "Chưa kết luận" |
| FB-2-08 | Chọn được Tháng dự kiến thi + Ngày thi; đến tháng phải chọn ngày hoặc dời tháng; giữ tháng mà chưa có ngày → trạng thái riêng dễ thấy + tự sinh việc "chốt ngày thi" **không hạn**; A "Sắp thi – Đã chốt ngày" / B "Sắp thi – Chưa chốt ngày"; giao diện tự do, không đổi luật | — | Học viên & Lớp, hồ sơ HV | A·D | P1 | hàng HV, đầu hồ sơ HV, Tổng quan, Công việc, TVV, tệp xuất | 11.2 (V2A-08: lỗi P1 "tháng = đã thi" `tongKetLoTrinh.ts:118-119`, dính từ 01/12); LT-SV; MP V.7, XVI.A | Chốt; lỗi đã kiểm mã; Q-C3 ① (21/10); việc Chốt ngày thi = TVV, không hạn (FB-4-39) |
| FB-2-09 | Ô điểm W1 / W2 lệch rõ (chữ phụ nhỏ bên dưới); kiểm cấu trúc ô điểm, căn điểm chính + thông tin phụ; kiểm MỌI ô điểm tương tự, không sửa một chỗ | v2-1 | Học viên & Lớp → toàn web | A·D | P1 | 7 kiểu ô điểm | 11.1a (gốc R4), `ODiem`; MP V.8 | Đã kiểm gốc |
| FB-2-10 | Mọi bảng Hồ sơ lớp: đánh giá + thiết kế lại (cấu trúc, phân cấp, chữ, màu, căn, mật độ, nút, workflow) — không chỉ đổi màu | v2-2 | Hồ sơ lớp | A | P1 | Tổng hợp, Góp ý tuần, Cần hỗ trợ, Kết quả đầu ra, Phân tích lớp | 11.3 (V2B-4); MP VI.1 | Đề xuất (cần mockup) |
| FB-2-11 | Nhập điểm MT: bảng điểm MT ở dưới gập mặc định; bấm "Nhập điểm" ở trên → tự cuộn tới + mở để nhập trực tiếp, không mở panel phải. "Tại sao phải tạo thêm panel khi đã có bảng ngay trên trang?" → áp cho chỗ tương tự | v2-2 | Hồ sơ lớp | A | P1 | Hồ sơ lớp + 12 chỗ "đã có trên trang" | 11.3 (V2B-3), 11.1c (V2B-5); MP VI.2, XVI.A | Chốt; 7.5 và 9.2-17 hết hiệu lực |
| FB-2-12 | Thiết kế lại hoàn toàn Ý thức / Phối hợp Hồ sơ lớp: dàn trải, thao tác không rõ, người mới không biết làm gì; ít panel, gọn, giữ nghiệp vụ | v2-2 | Hồ sơ lớp › Ý thức | A | P1 | Vi phạm & xử lý, Phối hợp SOS | 11.3 (V2B-6, phương án A: một bảng theo em); MP VI.3, XVI.B | Đề xuất A (PTA tự quyết, mockup duyệt) |
| FB-2-13 | (ảnh 3) Bảng / nhóm thông tin quá giống nhau (Phối hợp SOS): khó biết thông tin thuộc em nào, không thấy cái quan trọng, rối | v2-3 | Hồ sơ lớp › Phối hợp SOS | A·D | P2 | mọi "nhóm lặp": Cần hỗ trợ, Lịch Test khối 1, Kế hoạch Test, Cần bạn quyết, nhóm việc | 11.3 (V2B-7); MP VI.4 | Đã kiểm; đề xuất luật thị giác cho nhóm lặp |
| FB-2-14 | (ảnh 4) Bảng điểm lôm côm: chữ phụ đè mép ô, tiêu đề căn khác số, W1 / W2 thấp hơn L / R, cột rộng không đều, thanh "Dán từ Excel · GV chấm S" chen đầu bảng; "đã phản ánh rất nhiều lần"; điều tra gốc, được thay / xây lại cả hệ bảng | v2-4 | Hồ sơ lớp → toàn web | A·D | P1 | 53 tệp có bảng; 6 lối vào lưới MT | 11.1a (lệch 45–69 px; gốc R1–R8; luật căn theo tên lớp `index.css:267`); BANG-0/1; MP III.4, VI.5 | Đã kiểm gốc; đề xuất `Bang` + `ODiem` + phép kiểm máy |
| FB-2-15 | (ảnh 5) Terminal Vite báo `case` trùng ở `PanelViec.tsx` — chủ SP thấy "dấu hiệu lỗi nhưng chưa xác định rõ" (MP VI.6: không kết luận khi chưa đủ bằng chứng) | v2-5 | Công việc / Ý thức | D·E | P2 | việc "Ghi nhận n vi phạm mới" của một em | 11.1e (Ghi nhận bị đổi trang thay vì làm tại chỗ; khối dòng 124 là mã chết); MP VI.6, XVI.C | Đã kiểm bằng mã; còn bấm thử |
| FB-2-16 | Overhaul Ý thức / Phối hợp Hồ sơ HV: cùng ngôn ngữ thiết kế với Hồ sơ lớp nhưng mật độ một em; dữ liệu trọng tâm, ít lặp, rõ thao tác, ít panel. MP VII thêm: **nối với workflow GVCN → TVV xử lý vi phạm** | — | Hồ sơ HV | A | P2 | tab Ý thức hồ sơ HV | 11.4 (V2B-8: một việc hiện 3 chỗ); M3b; MP VII, XII.2 | Đề xuất (mockup) |
| FB-2-17 | Ưu tiên vấn đề hệ thống (căn bảng, component chung, bộ lọc thời gian, workflow mở panel); "không muốn phải liên tục nhắc lại lỗi cơ bản như bảng lệch, chữ quá nhỏ, thông tin lộn xộn, workflow thừa thãi" | — | Quy trình | A | — | mọi PR | 11.1; MP III, XVIII | Đang áp |

### 3.3 Vòng 3 — 20/10 khuya: Test, Phân tích, Tutor (tài liệu chính mục 12; ảnh v3-1)

| Mã | Lời chủ SP (rút gọn, giữ nghĩa) | Ảnh | Trang · khu | Loại | Mức | Nơi áp dụng | Xử lý ở đâu | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| FB-3-01 | Điểm rõ, dễ đọc; màu trực tiếp trên con số; phân biệt mức / trạng thái; đồng bộ Test · Hồ sơ lớp · Hồ sơ HV · báo cáo; không đổi luật phân loại điểm | v3-1 | Test → toàn web | A | P1 | lớp thường ("x / tổng", %, "3/4 môn đạt") + FT | 12.1 (một môn trượt có 6 dáng; chip nền vàng ở hồ sơ HV); MP VIII.1, III.3 | Chốt; luật "x / tổng" PTA tự quyết (12.9-9) |
| FB-3-02 | Nhận xét Test lớp thường TUỲ CHỌN, đưa vào ngay box chấm (mở chỗ chấm là nhập được điểm + nhận xét), không khu nhận xét rời; gọn; rà loại Test khác để không sai luật chấm | v3-1 | Test › lưới lớp thường | A | P1 | lưới lớp thường, hộp chấm FT | 12.1 (3 đường cho một ô; nhận xét MT bắt buộc giữ); MP VIII.2, XVI.A | Chốt; HD2 hết hiệu lực ở máy tính (02 X-02) |
| FB-3-03 | (ảnh 1) Nút "⋯" bị cắt: vì sao, làm gì, có thật cần không, thay bằng gì; chỗ khác cùng lỗi clipping / căn sai | v3-1 | Test › lưới lớp thường | D | P2 | mọi ô lớp thường | 12.1 (không bị cắt mà **đè 41 % ô "tổng"**, chỉ hiện khi rê; menu toàn thao tác hiếm); MP VIII.3, XVI.C | Đã kiểm; đề xuất bỏ ⋯ khỏi ô, đưa vào chân hộp chấm |
| FB-3-04 | Lệch tiêu đề ↔ dữ liệu vẫn còn ở Test và nhiều bảng → tìm gốc, sửa triệt để toàn hệ thống; đo các bảng Test chưa đo; thêm kiểu cột "x / tổng" | v3-1 | Test → toàn web | A·D | P1 | lưới lớp thường, Lịch Test, Kế hoạch Test, hồ sơ Mock, 375 | 12.1 (lệch 86 px, 76,5 px; hàng 34–79 px; tiêu đề chứa ô nhập); 11.1a; MP VIII.4 | Đã kiểm; bổ sung 4 kiểu cột (12.9-21) |
| FB-3-05 | Workflow chấm Test — **quan trọng nhất**: GV còn nhầm chấm tuần nào, chấm ở đâu; ba khung "tương đối hợp lý" nhưng không mặc định tối ưu; phân biệt tuần làm bài ↔ tuần ghi nhận; đối chiếu đủ luật (theo tuần, lớp thường, Speaking chéo, người chấm ≠ GV đứng lớp, quyền); brainstorm nhiều ý, không làm phức tạp hơn; tối ưu cả xem lại cho Admin / QL | — | Test, Công việc, Hồ sơ lớp | B | P1 | GV, GV S, QL, QT, Admin VP | 12.2 (V3A-1…3; 17 ý → giữ 12; Speaking ghi "GV khác", 0 ↔ 49 bài); MP VIII.5–7, XVI.B | Q-C1 (21/10): vẽ mockup lựa chọn ①, chủ SP duyệt sau (FB-4-42); S chéo không cần lớp (FB-4-40) |
| FB-3-06 | Rà mọi chức năng NHẬP điểm bằng Excel; bỏ cái không cần; GIỮ duy nhất nhập theo lớp, theo từng MT; không nhầm với XUẤT. MP XI.7 thêm: **thiết kế lại panel sau khi bỏ** | — | Toàn web | A | P2 | 8 lối dán (một thành phần `DanExcel`) | 12.3 (giữ 2 lối cùng thành phần; chưa ai dùng thật); MP VIII.8, XI.7, XVI.A | Chốt; lớp thường "theo bài" PTA diễn giải (12.9-10) |
| FB-3-07 | Bỏ gạch chân chấm chấm dưới chỉ số; cách thể hiện "bấm được" khác, tinh tế, nhất quán; không phải số nào cũng bấm | — | Phân tích → toàn web | A | P2 | mọi số bấm được | 12.4 (gạch chấm mang 4 nghĩa, 4 dáng bấm khác); MP IX.1, XVI.A | Chốt; dáng "ô số" PTA tự quyết |
| FB-3-08 | Panel mở từ chỉ số: A thông tin đầy đủ · B mở khu làm việc ngay · C kết hợp (chủ SP thấy rất đáng nghiên cứu) — chọn cho TỪNG loại số, không ép một kiểu | — | Phân tích → toàn web | B | P1 | 50 chỉ số | 12.4 (luật L1 + mẫu panel C); MP IX.1, XI.4, XVI.B | Đề xuất (PTA tự quyết, mockup duyệt) |
| FB-3-09 | Chỉ số bấm được → đúng dữ liệu, đúng ngữ cảnh, đúng mục đích (số SOS một lớp mà sang Hồ sơ lớp chung chung = sai); rà mọi chỗ tương tự | — | Toàn web | A·D | P1 | 50 chỉ số; 9 chỗ sai ngữ cảnh | 12.4 (V3B-02); MP IX.2 | Chốt; đã kiểm 9 chỗ |
| FB-3-10 | Báo cáo gần như không giống mockup đã duyệt: đối chiếu chi tiết, nguyên nhân, kế hoạch sửa có hệ thống; đánh giá lại cả mockup: (a) web sai (b) mockup giữ (c) nâng được (d) mới cần duyệt | — | Phân tích › Báo cáo | A·D | P1 | Báo cáo, In, 375 | 12.5 (khớp ~36 %; 18 quyết định); MP IX.3, XVI.B | Đã kiểm; Q-C2 ① (21/10): duyệt cả bốn |
| FB-3-11 | Báo cáo thuần tập trung phân tích; chỉ bảng theo dõi việc mới có quá hạn / chậm xử lý; từng bảng: mục đích · người dùng · kết luận · cột cần / thừa; đặc biệt bảng Ý thức (vì sao có "báo trễ", "quá hạn") — bỏ khỏi hiển thị, không xoá dữ liệu | — | Phân tích (6 tab) | A·E | P1 | 5/7 nhóm bảng có cột việc | 12.5 (T1, Y1); MP IX.4, XVI.A | Chốt nguyên tắc; chữ "báo trễ" cần ảnh (02 mục 4.8) |
| FB-3-12 | Rà mọi chỗ XUẤT Excel: mục đích, ai dùng tệp, cột cần / thừa (vd Ý thức xuất "quá hạn" để làm gì), tổ chức tệp, phạm vi khớp bộ lọc đang áp; không xuất mọi cột trên màn | — | Toàn web | B·D | P1 | 11 lối xuất; 2 lệch phạm vi; 3 lối không ghi nhật ký | 12.6 (V3B-07, E1); MP IX.5 | Đề xuất E1 (PTA tự quyết) |
| FB-3-13 | Thời gian ở Phân tích chỉ hai chế độ "Toàn bộ" + "Chọn khoảng tuần"; mặc định theo mục đích từng bảng (2 tuần gần nhất, 2 tuần trước, 4 tuần…) | — | Phân tích | A·F | P1 | 6 tab Phân tích | 12.7 (bảng mặc định); MP IX.6, III.8 | Chốt; phạm vi "Toàn bộ" thu về riêng Phân tích (02 X-06) |
| FB-3-14 | Lỗi: mở lịch chọn tuần, bấm bất kỳ nút nào trong lịch là cả bộ chọn đóng → gần như không chọn được | — | Phân tích, Tutor, Bộ lọc thêm | D | P1 | 4 chỗ dùng hộp; web có 15 bản "bấm ra ngoài" tự viết | 12.7 (lịch vẽ qua portal, `BoChonThoiGian.tsx:25-33`; tái hiện 6/6); MP IX.7, XVI.C | Đã kiểm; Q-E1 ① (21/10): sửa ở GĐ1 trước deploy |
| FB-3-15 | Overhaul Hiệu quả PA + Tổng hợp vấn đề HV (bảng cũ): mục tiêu, liên hệ vấn đề ↔ PA, trùng / thiếu, nhóm; nghiên cứu gộp (không bắt buộc, ≥ 2–3 phương án, không gộp bằng mọi giá) | — | Phân tích › Hiệu quả PA | B | P2 | Hiệu quả PA | 12.8 (26 tuần chỉ 10 PA; bảng cũ đã bỏ ở OV-15e; H2 "Vấn đề & PA"); MP IX.8, XVI.B | Đề xuất H2 + cần dữ liệu thật |
| FB-3-16 | Tutor: bộ lọc có vẻ quá nhiều, bảng chưa tối ưu; thiếu dữ liệu thật → tách lỗi UI quan sát được / UX từ cấu trúc / cần dữ liệu / giả thuyết; không tạo luật mới | — | Tutor | B·D·E | P2 | Tutor, panel tutor, Head tutor | 12.8 (cột "Cần chú ý vì" 418 px trống; 5 chip chồng nghĩa; F1 + B1); MP X, XVI.B, XVI.C | Đề xuất + cần dữ liệu thật |
| FB-3-17 | "Đừng tạo thêm panel, nút, bộ lọc, bảng chỉ vì có thể; đừng giữ cấu trúc cũ không hợp lý; đừng mặc định mockup cũ hoàn hảo; đừng chỉ sửa chỗ đã chụp; đừng bỏ qua căn bảng, cỡ chữ, clipping, bố cục lộn xộn" | — | Quy trình | A | — | mọi đề xuất | MP III, XVIII | Đang áp |

### 3.4 Vòng 4 — master prompt cuối + 4 ảnh (ý mới hoặc đổi so với vòng 0–3; ý chỉ nhắc lại được nối ở mục 7)

| Mã | Lời chủ SP (rút gọn, giữ nghĩa) | Ảnh | Trang · khu | Loại | Mức | Nơi áp dụng | Xử lý ở đâu | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| FB-4-01 | MP 0: tự đánh giá lại độc lập xem UI có xứng ≥ 35/40 không, chỉ bằng chứng cụ thể | — | Toàn web | A | — | mọi khu | 2.1–2.2 (~23/40, Nhất quán 1/4); 03 | Đã trả lời: không xứng; chấm lại ở GĐ4 |
| FB-4-02 | MP 0: quyền overhaul gần như mọi thứ (trang, panel, bảng, nút, icon, chữ, CSS, component, bố cục, luồng từng vai); được bỏ / gộp / xây lại; không giữ giao diện kém vì đã có; KHÔNG xoá / sửa dữ liệu nghiệp vụ ngoài phạm vi được duyệt | — | Toàn web | A | — | mọi đề xuất | 02 X-11 | Đang áp |
| FB-4-03 | MP 0: tự do KHÔNG gồm bỏ qua bảo mật, phân quyền, toàn vẹn dữ liệu, duyệt bắt buộc, luật đã chốt; muốn đổi / thấy xung đột → hỏi trước; thuật ngữ đã chốt giữ nguyên; chữ chưa chốt viết lại tiếng Việt tự nhiên | — | Toàn web | A | — | mọi đề xuất | 02 mục 1, mục 3 | Đang áp |
| FB-4-04 | MP 0: dùng impeccable, ui-ux-pro-max, skill phù hợp; đọc manual, mockup, tài liệu UX, mã, PR, mọi phản hồi; không suy đoán đã kiểm; mục tiêu: UI dễ nhìn, bảng căn chuẩn, UX dễ hiểu, workflow ít bước cho GV / GVCN / TVV / Admin / QL — UI và workflow quan trọng ngang nhau | — | Quy trình | A | — | 03–05 | brief-v4 mục 3 | Đang áp |
| FB-4-05 | MP I: cổng duyệt — KHÔNG sửa mã / merge / deploy tới khi chủ SP duyệt vòng cuối. GĐ1: gom TẤT CẢ phản hồi (cả kế hoạch, mockup cũ), phân loại A–F, gộp không mất chi tiết / ngoại lệ, đối chiếu mockup ↔ web và cách kiểm soát, chỉ hỏi nghiệp vụ, không hỏi lại 4 luật, câu thẩm mỹ tự đề xuất | — | Quy trình | A | — | 01, 02, 06 | tệp này + 02; 06-mockup-gap | Đang làm |
| FB-4-06 | MP I GĐ2: rà mọi trang, panel, modal, drawer, box, bảng, nút, icon, chữ, bộ lọc; trạng thái hover / focus / chọn / mở / gập / rỗng / tải / lỗi; chuyển trang; ít / nhiều dữ liệu; theo quyền; cả màn chưa chụp ("không chụp không có nghĩa là không lỗi"); theo từng vai, không tối ưu vai này làm khó vai khác; cần ảnh thì nói đúng trang / bước / trạng thái | — | Toàn web | A | — | mọi vai | 03-ux-ui-audit | Chờ 03 |
| FB-4-07 | MP I GĐ3–4: nhiều phương án cho khu lớn (vấn đề, nguyên nhân, bằng chứng, lợi ích, số bước, ảnh hưởng nghiệp vụ / quyền, nhược điểm, thay thế) + một phương án ưu tiên; không thêm feature / panel / nút chỉ vì có thể; một vòng duyệt cuối chỉ hỏi điều thật sự chưa rõ / nghiệp vụ / định hướng lớn; cập nhật plan theo lựa chọn | — | Quy trình | A | — | 05; 02 mục 5 | 05-ia-workflow | Chờ 05 |
| FB-4-08 | MP I GĐ5: PR có phạm vi, phụ thuộc, nghiệm thu, test; design system / component trước; đối chiếu mockup; test luồng thật từng vai; PR liên tiếp, **kể cả xuyên đêm nếu môi trường cho phép**; không hứa làm nền, không báo đã chạy khi chưa, không bỏ test, không vượt cổng duyệt | — | Quy trình | A·F | — | 07 | 07-pr-plan; 02 X-09 | Không xung đột thật với 9.1-2 (02 X-09) |
| FB-4-09 | **Luật 1:** ngay khi GVCN lưu thông tin xử lý vi phạm → phát sinh việc cho TVV ghi nhận kết quả xử lý; không đợi một bước duyệt khác | — | Ý thức → TVV | A·D | P1 | Hồ sơ lớp / HV › Ý thức; nơi làm việc của TVV | mục 1 (mã chưa có việc này); MP XII.2, XVI.A | Chốt; lệch (chưa có) → làm mới; đã trả lời 21/10: Q-D1 ①, Q-D3 ①; nơi làm Q-A1 ① (Tổng quan TVV) |
| FB-4-10 | **Luật 2:** hạn 5 ngày lịch tính từ lúc GVCN lưu, gồm thứ Bảy, Chủ nhật; chỉ được làm rõ giờ hết hạn | — | Việc TVV | A | P1 | hàm hạn, nhãn hạn | mục 1; MP XII.2 | Chốt; giờ hết hạn → PTA tự quyết (02 mục 4.7) |
| FB-4-11 | **Luật 3:** vai có quyền sửa thì được sửa sau khi đã lưu, có lịch sử thay đổi; giữ duyệt bắt buộc; không khoá cứng vô lý, không tự bỏ duyệt | v4-4 | Toàn web | A·D | P1 | điểm FT + lớp thường, MT, Ý thức, PA, thông tin HV | mục 1 (R11 lệch); C22 (OV-15g); MP III.9, XIII, XVI.A | Chốt; lệch R11 → sửa; Q-B1 ①, Q-B2 ① (21/10) |
| FB-4-12 | **Luật 4:** MT, trong cùng chuỗi dời: "-" lần 1 → dời sang tuần tiếp theo; lần 2 → huỷ; áp cả lịch MT tuần cũ (không coi "-" đầu là huỷ vì lịch cũ); MT hiện tại giữ luồng gửi duyệt. MP XIV.2 thêm: lập bảng chuyển trạng thái (lịch hiện tại / cũ, lần dời, điểm đã nhập, duyệt, huỷ, khôi phục), kiểm edge case; không nhầm huỷ lịch / huỷ điểm / huỷ MT / dời / gửi duyệt; xung đột thực tế → chỉ ra và hỏi | — | MT mọi lối nhập | A·D | P1 | lưới MT (Lịch Test, hồ sơ lớp, Công việc, hồ sơ Mock), hộp chấm, gõ "-" | mục 1 (MT cũ "-" = Không dự thi — lệch); 05 (bảng trạng thái); MP XIV.2, XVI.A | Chốt; lệch → sửa; **phần MT cũ đã sửa 21/10** — MT cũ "-" = huỷ ngay (FB-4-37) |
| FB-4-13 | MP III.1: nổi bật có chủ đích (không tô màu mọi thứ); trường lặp (điểm, lớp, HV, Test, MT, SOS, PA, trạng thái, ngày / tuần) một cách hiện ở mọi trang; design system chung cho bố cục, khoảng cách, màu, icon, badge, hover, chọn, hành động; **mỗi bảng / panel / box trả lời: xem gì · làm gì · cho ai · bước tiếp ở đâu**; không nhồi một hàng / panel, không dùng chữ quá nhỏ | — | Toàn web | A | P1 | mọi thành phần | X5, X7, X8; 04 | Đề xuất ở 04 |
| FB-4-14 | MP III.4: sửa triệt để bảng lệch + clipping — **"đã nhắc rất nhiều lần"**: tiêu đề không thẳng dữ liệu, hàng / cột xô lệch, W1 / W2 sai vị trí, nút bị cắt, **nội dung đổi kích thước gây lệch bố cục**; rà MỌI bảng; gốc ở CSS / component / grid / cell sizing / overflow / padding / chữ / responsive / style override; được override / xây lại; không dùng ràng buộc cũ làm lý do; không vượt quyền, không sai dữ liệu | — | Toàn web | A·D | P1 | 53 tệp bảng + lưới div / ARIA | 11.1a, 12.1; BANG-0/1; `do-bang`; MP III.4, XVI.A | Đã kiểm gốc; đề xuất hệ bảng mới + phép kiểm máy |
| FB-4-15 | MP III.8: bộ lọc khoảng tuần tương tự chỉ "Tuần bắt đầu → Tuần kết thúc", không preset tháng / 2 tuần; chỗ cần mặc định điền sẵn (vd tuần trước → tuần sau); **RIÊNG trang Phân tích** có "Toàn bộ" / "Chọn khoảng tuần", mặc định theo bảng; ngoại lệ: chọn tháng thi / ngày thi thật không bị thay bằng bộ chọn tuần | — | Toàn web | A·F | P1 | 14 chỗ chọn thời gian | 11.1b, 12.7; MP III.8, XVI.A | Chốt; đề xuất 12.7 phải thu phạm vi "Toàn bộ" (02 X-06) |
| FB-4-16 | MP III.9: cái một vai có quyền nhập và sửa thì phải sửa lại được sau lưu; cân nhắc hoàn tác / khôi phục; lưu ai sửa, lúc nào, trước / sau; giữ duyệt bắt buộc; rà "hard lock" để phân biệt giới hạn nghiệp vụ thật ↔ giới hạn kỹ thuật vô lý | — | Toàn web | A | P1 | mọi chỗ nhập liệu | C22 (OV-15g); 13/10-SUA; T22; 05 | Chốt; bảng khoá ở 05; Q-B1 ① (21/10); gõ nhầm "-" không khoá cứng (FB-4-38) |
| FB-4-17 | (ảnh 1) Trang Công việc dày đặc, chi chít, không thứ tự rõ, đầu mục lộn xộn, thiếu phân biệt → thiết kế lại TOÀN BỘ: nhóm việc, thứ tự, ưu tiên, trạng thái, đối tượng, thông tin nổi bật, nút; người dùng biết ngay việc gì, cho ai, vào đâu xử lý; không chỉ đổi màu / khoảng cách | v4-1 | Công việc | A·D | P1 | Công việc QL / QT (hộp "Chờ bạn duyệt" rộng hết trang + danh sách nhóm + khung phải trống); mọi vai | X9; CV-06, CV-09, CV-17 (thanh lọc 8 lựa chọn); A1-02 (thẻ BC FT 205 khi đang lọc Monbay); 10.2; 05 | Thấy trong ảnh; nhiều lỗi đã có mã; bố cục: Q-A1 ①, Q-A2 ① (21/10) |
| FB-4-18 | MP XI.2: phân biệt Tổng quan ↔ Công việc, không trùng vô ích — Tổng quan để nắm tình hình và xử lý nhanh, Công việc để quản lý / thực thi sâu hơn (**định hướng cần đánh giá, không mặc định**); dùng component chung khi hợp, mỗi trang có giá trị riêng, không tạo khác biệt bằng tính năng thừa | — | Tổng quan, Công việc | B·F | P1 | QL, QT, GV, TVV | 10.2 (phân vai), 10.7-2; 02 X-07 | Đã trả lời 21/10: Q-A1 ① |
| FB-4-19 | MP XI.3: panel công việc chữ díu vào nhau, thiếu phân cấp, khó nhận ra dữ liệu quan trọng → overhaul khoảng cách, nhãn, số liệu, tên lớp / HV, trạng thái, thông tin nền, lịch sử, hành động; đúng đủ để làm tại chỗ, không bắt mở nhiều trang, không nhồi mọi dữ liệu một lúc | v4-1, v4-3 | Công việc | A·D | P1 | ~30 loại panel / hộp làm việc | CV-04, CV-13 (tên việc ≠ tên panel ở 6 loại), CV-30; X7; 04, 05 | Đề xuất (mẫu panel ở 04) |
| FB-4-20 | MP XI.4: nền tảng panel dùng chung (panel việc, panel từ chỉ số SOS / PA / Test, danh sách HV, Phân tích / Tổng quan); đồng bộ phần cùng mục đích nhưng không ép mọi panel thành một mẫu cứng; chuẩn hoá điểm, lớp, HV, trạng thái, nút, lịch sử | — | Toàn web | A | P1 | mọi panel | X3 (hợp đồng panel), 10.3, 12.4 (panel C); 04 | Đề xuất |
| FB-4-21 | (ảnh 2) Vì sao nút "Phân công giáo viên của lớp" ("Phân công…") hiện ở việc "Thêm PA học thuật Reading · SOS 3 · MB FOU 12 · quá hạn 18 ngày"; kiểm điều kiện hiển thị, loại việc, component dùng chung, phân quyền, case khác; **không chỉ ẩn nút khi chưa biết nguyên nhân** | v4-2 | Công việc | E·D | P1 | dòng việc Case / PA; QL, QT | CV-07 (đã kiểm: "Phân công…" mở cả ngăn Thông tin lớp, đổi phân công cả lớp, đè panel đang mở); CV-08 (Case chưa có người); 03 | Một phần đã kiểm; điều kiện hiển thị ở đúng việc này chưa kiểm |
| FB-4-22 | (ảnh 1, 3) Bấm dòng phụ gạch chân xanh (tên em · lớp · MT · GV) → việc mở rộng NGAY TRONG danh sách, che cả đầu mục (tên việc + em); kiểm điều hướng ngữ cảnh, cấu trúc panel, clipping / overflow, z-index, vùng hiển thị, đường quay lại; rà tình huống tương tự toàn hệ thống | v4-1, v4-3 | Công việc | D·E | P1 | việc "Kết quả PA" và mọi việc ghi nhanh trong danh sách hẹp | CV-03 (đã kiểm 20/10: ghi nhanh Kết quả PA làm dòng mất tên việc + tên em); 10.3 (danh sách hẹp → khung phải); 03 | Đã kiểm một phần; rà toàn hệ thống ở 03 |
| FB-4-23 | MP XII.1: đề xuất nhóm việc TVV thật sự thuộc trách nhiệm TVV (vd bổ sung hồ sơ HV thiếu thông tin, chốt lộ trình sau khi HV thi, việc nghiệp vụ cần thiết khác); tránh quá nhiều nhóm vô ích | — | TVV | B·F | P1 | Tổng quan TVV (TVV chưa có trang Công việc — 11/10) | 7.9, 9.2-13, 11.2 (TVV); 02 X-27 | Đã trả lời 21/10 → FB-4-39 (4 việc + hạn) |
| FB-4-24 | MP XII.2: việc "Ghi nhận kết quả xử lý vi phạm" — TVV ghi thực tế đã xử lý thế nào, kết quả ra sao, phụ huynh phản hồi thế nào…; CHƯA chốt: trường form, cách hiển thị, người được giao khi đặc biệt, trạng thái, xử lý khi chưa liên hệ được phụ huynh → brainstorm, chỉ hỏi điểm nghiệp vụ thiếu; chuỗi Vi phạm → GVCN lưu xử lý → TVV ghi nhận → Theo dõi kết quả; đồng bộ Hồ sơ lớp / HV / báo cáo; không lặp dữ liệu, không thao tác vô nghĩa, không rối thang bậc | — | Ý thức, TVV | B | P1 | Ý thức lớp / HV, báo cáo Ý thức, việc TVV | 05 (form, trạng thái); 02 Q-D1…Q-D3 | Đề xuất ở 05 (gói PTA đồng ý 21/10); Q-D1 ①, Q-D3 ① |
| FB-4-25 | (ảnh 4 — bản chính) GV **không sửa được điểm Progress Test sau khi nhập và lưu** (chip "Đã hoàn tất", ⋯ chỉ có "Lịch sử") — khoá cứng; là lỗi workflow cần sửa theo luật 3 | v4-4 | Test › lưới lớp thường (bản chính) | D | P1 | mọi lưới điểm sau "đợt hoàn tất"; GVBM | `server/src/normal/regular.ts:631-643`, `server/src/fasttrack/hoanTat.ts:113-117` (R11, 23/09); Rulebook dòng 589, 600, 723 | Đã kiểm mã (d1); chưa bấm thử trên demo |
| FB-4-26 | MP XIII.2: rà mọi hard lock — đã lưu không sửa được, trạng thái không quay lại được, phải huỷ rồi tạo mới, phải đi qua nhiều trang để khôi phục; phân loại giới hạn nghiệp vụ / quyền / bảo mật ↔ giới hạn kỹ thuật cũ; history / undo / recovery tương xứng giá trị dữ liệu, không cần sao chép Google Sheets | — | Toàn web | A·E | P1 | điểm, MT, Ý thức, PA, lịch thi, lộ trình | 13/10-SUA (5 khoá giữ); 05 (bảng khoá) | Chờ 03 / 05; Q-B1 ① (21/10) |
| FB-4-27 | MP XIII.3: tra cứu được ai sửa, lúc nào, trước / sau; "được sửa" ≠ "được bỏ duyệt"; không bỏ quyền; dữ liệu đã qua duyệt phải đối chiếu workflow thật, hỏi khi còn xung đột | — | Toàn web | A·F | P1 | dữ liệu có bước duyệt | C22 (OV-15g); 02 X-43 | Đã trả lời 21/10: Q-B2 ① |
| FB-4-28 | MP XIV.1: MT nhiều bước thừa, nhất là **huỷ điểm riêng lẻ → vào Hồ sơ MT → khôi phục điểm vào MT → mới chuyển được lịch**; rà tạo lịch, chấm, chỉnh, dời, huỷ, khôi phục, gửi duyệt, quyền, lịch sử; flow trực diện, không mất kết quả, không sai duyệt | — | Test, hồ sơ Mock | E | P1 | QL, GVCN, GV, Admin VP | T20 (dời bài đã có điểm, điểm đi theo), T21; TST-16 (hộp → menu → panel chồng 3 lớp); 05 | Cần đếm bước thật trên demo |
| FB-4-29 | MP XIV.3: không dùng lẫn huỷ lịch / huỷ MT / huỷ điểm; tối ưu đường thao tác; cảnh báo phù hợp; khôi phục / ghi lịch sử khi được phép; giảm thao tác qua nhiều màn | — | Test, hồ sơ Mock | A·F | P1 | Kế hoạch Test, hồ sơ Mock, lưới MT | 19/10-M6 "Huỷ = Xóa"; T3, T21, T22; 02 X-28; 05 | Chốt yêu cầu; bảng trạng thái ở 05 |
| FB-4-30 | MP XV: rà theo vai, không chỉ theo trang — GV, GVCN, TVV, Admin, QL, vai khác; hành trình: xem việc, chấm Test, chấm S chéo, quản lý MT, SOS / PA, Ý thức / Phối hợp, vi phạm, tra điểm, xuất báo cáo, duyệt (mục tiêu, đầu vào, bước hiện tại, điểm nhầm, quyền, phương án, ảnh hưởng chéo); người mới hiểu ngay; Admin / QL xem lại đúng ngữ cảnh; làm sai sửa được khi có quyền | — | Toàn web | A | P1 | mọi vai | X9, 7.9; 03, 05 | Chờ 03 / 05 |
| FB-4-31 | MP XVI.C: 9 điểm phải kiểm chứng, không kết luận khi thiếu bằng chứng (nút chỉ nháy · hover trùng cấp, ⋯ bị cắt · lỗi ảnh 5 · Phân công sai ngữ cảnh, panel che đầu mục · picker tự đóng · hard lock Progress Test · gốc bảng lệch · Tutor thiếu dữ liệu · nghĩa "Cần xác nhận") | — | Toàn web | E | — | xem các dòng liên quan | 02 mục 2.7 | 6/9 đã kiểm; còn: Phân công (một phần), Tutor (cần dữ liệu), ảnh 5 (bấm thử) |
| FB-4-32 | MP XVII: bộ 7 tài liệu liên kết (Feedback Register, Conflict & Decision Log, UX/UI Audit, Design System, IA & Workflow, Mockup Gap, PR Plan); mỗi vấn đề đủ 10 ý; không dừng ở bảng kế hoạch hình thức; vẫn có bước duyệt cuối trước khi đổi mã | — | Quy trình | A | — | 00–07 | 00-muc-luc | Đang làm |
| FB-4-33 | MP XVIII: UI đẹp, rõ, thống nhất, không xô lệch · UX có ngữ cảnh, không gây nhầm · workflow ít bước, làm tại chỗ · mọi vai không đi vòng · dữ liệu chuẩn, sửa được khi có quyền, có lịch sử, giữ duyệt · bảo toàn luật Test, Speaking chéo, PA, MT, lịch thi, xử lý vi phạm · được đề xuất hơn cả mockup cũ nếu có lý do; phân biệt chốt ↔ đề xuất; hỏi một vòng cuối, cập nhật plan rồi mới PR | — | Toàn web | A | — | mọi tài liệu | 02 mục 5; 07 | Đang áp |
| FB-4-34 | **(21/10, sau MP)** "Khi xử lý vi phạm, đôi khi GVCN muốn **thu hồi** lại xử lý, hoặc chỉ **xử lý mà không tăng cấp bậc**, thì phải **gửi ý kiến duyệt cho QL kèm lý do**." — (a) thu hồi một lần xử lý đã lưu · (b) xử lý không tăng bậc → gửi QL duyệt, lý do bắt buộc | — | Hồ sơ lớp / HV › Ý thức | A·D·E | P1 | GVCN (gửi) · QL (duyệt, thẻ Chờ duyệt) · thang 6 bậc · việc TVV ghi nhận kết quả | mục 1 (bổ sung 21/10): (a) `xoaXuLy` `server/src/yThuc/xuLy.ts:622-638` xoá thẳng, không duyệt → lệch; (b) chưa thấy đường "giữ bậc" → cần kiểm; MP XII.2; luật 1, luật 3; 02 X-49…X-51 | Chốt; (a) lệch → sửa; (b) kiểm mã; việc TVV khi QL từ chối / duyệt thu hồi → Q-D1 ① (21/10) |
| FB-4-35 | **(21/10, sau MP)** "Cho GV lựa chọn **nhiều hơn 1 kĩ năng khi tạo case** để đồng thời tạo luôn **trên 1 panel** vì có nhiều GV sẽ dạy 2 kĩ năng 1 lớp" — mỗi kỹ năng vẫn **một Case riêng** (luật Case giữ), chỉ tạo n Case cùng lúc | — | Hồ sơ HV / hồ sơ lớp › panel Tạo Case | A·D | P1 | GV, GVCN, QL · 4 lối "+ Case" (hồ sơ HV đầu trang + bảng kỹ năng; hồ sơ lớp đầu trang + ⋯ dòng em) · hai chương trình (FT L·R·W1·W2·S; lớp thường theo bộ môn) | v4d: chip kỹ năng chọn một (`web/src/modules/cases/QuickReport.tsx:400-412`), API một `topic` (`server/src/cases/cases.ts:463-739`); 33/73 cặp GV × lớp dạy ≥ 2 kỹ năng (DB demo); 2 kỹ năng nay 16 bấm + 4 gõ, 2 lần lưu → 13 + 4, 1 lần; **lỗi kèm (D):** "+ Case cho {kỹ năng}" không chọn sẵn kỹ năng (`StudentDetailPage.tsx:334`); 02 mục 2.8, X-73, X-74, 4.7 B16, C21; 05 mục 7.1b | Chốt; cách làm PTA tự quyết (C1); lỗi "+ Case cho" → GĐ1 CV-LOI; panel → CASE-NHIEU (07) |
| FB-4-36 | **(21/10, sau MP — góp ý GV trung tâm, chủ SP chuyển)** "Nếu app có thể có **1 ô hiện lên, list thông báo nhắc việc như Base** thì sẽ dễ để GV xử lý không bỏ sót việc nào (hình như việc này làm rồi, nhưng có thể cải thiện phần thông báo cho rõ hơn…)" — "Base" = Base.vn (trung tâm thông báo / nhắc việc) | — | Thanh trên › chuông "Thông báo n" | B·D | P1 | mọi vai có việc (GV, GVCN, QL, QT, TVV sau luật 1, Admin VP) | v4d: GV 7 có 9 việc quá hạn — chuông "Cần làm" chứa 1, "Để biết" 5, không có 3; 4 số khác nhau một màn (⚠10 · 19 · 39 · 18); 8 dòng "SOS n" kẹt Cần làm; trùng A1-04, A7-05, A7-15, 9.2-4; 02 X-71, X-72, 4.7 A20, C22, C23; 05 mục 2.7 | Đề xuất: GĐ1 SL1 vá (N1) → M2 chuông = hộp Nhắc việc một nguồn (N2); không tự bật hộp khi đăng nhập (gói PTA đồng ý 21/10) |
| FB-4-37 | **(21/10, vòng phê duyệt cuối — Q-B4 + câu xác nhận) Luật 4 sửa:** "chỉ đếm các lần '-' nhưng trong 1 tuần, nếu sửa lại và nhập thêm '-' thì không tính là rời, phải sang tuần tới mới tính là rời tiếp lần 2 -> hủy … nếu MT cũ mà bấm '-' thì coi như hủy luôn, nếu QL muốn khôi phục lại thì bấm khôi phục là được, sau khi bấm khôi phục thì reset lại từ đầu, không nhớ quyết định vắng '-' trước đó nữa" · ranh giới MT cũ "Giữ ≥ 2 tuần" · "QL KHÔI PHỤC thì set cho dời 2 lần, còn nếu QL 'duyệt' cho dời thêm 1 lần nữa thì nếu như vẫn vắng thì hủy" | — | MT mọi lối nhập "-" | A·D | P1 | lưới MT, hộp chấm, Kế hoạch Test, thẻ dời, hồ sơ MT; GV, GVCN, QL | **Thay luật 4 (20/10) phần MT cũ**; Q-B3 hết hiệu lực cho MT cũ; mã nay MT cũ "-" = "Không dự thi" → lệch; 02 mục 2.9 (21/10-L4), X-75…X-77; 05 mục 4; 07 LUAT-34 | Chốt; lệch → sửa ở LUAT-34 (GĐ1) |
| FB-4-38 | **(21/10)** Gõ nhầm "-" ở MT cũ: "Hoàn tác 10 giây và vẫn cho khôi phục được, **tại sao phải chặn cứng?**" | — | MT cũ, ô điểm | A | P1 | người gõ "-" (GV, GVCN, QL) | L3; 04 mục 12 (quy tắc Hoàn tác 10 s); PTA diễn giải: người có quyền sửa ô khôi phục, có lịch sử, QL nhận chuông "để biết" (chủ SP sửa nếu muốn chỉ QL); 02 X-78; 05 mục 4.3 T06, T09 | Chốt; cách khôi phục = PTA diễn giải |
| FB-4-39 | **(21/10 — Q-A3) Việc TVV:** "Chốt ngày thi, chọn bước tiếp sa thi, bổ sung hồ sơ thiếu, cập nhật kết quả thi thật, hầu hết các CV này đều không có hạn đâu nhé, chỉ trừ chọn bước tiếp sau thi - 1 tuần" | — | Tổng quan TVV, hồ sơ HV, Lịch thi | A·D | P1 | TVV (người giữ), QL (khi em không có TVV), GVCN (mất việc KQ thi thật) | "Cập nhật kết quả thi thật" nay của GVCN lớp cuối, có hạn → chuyển TVV, không hạn (lệch mã); Bước tiếp hạn 1 tuần từ khi có KQ thi thật (PTA diễn giải, khớp mã `buoc_tiep`); Báo PH lớp thường giữ như nay; 02 mục 2.9 (21/10-TVV), X-80; 05 mục 1.4; 07 SV-TVV-VIEC | Chốt; lệch → sửa ở GĐ1b |
| FB-4-40 | **(21/10 — Q-C1, ý sau)** "nhớ lưu ý các trường hợp GV có dạy kĩ năng Speak, **kể cả không dạy lớp nào** cũng được phép chấm chéo nhé" | — | Test › Chấm Test, Công việc › Chấm Speaking | A | P1 | GV có kỹ năng S (hồ sơ GV), QL | Thay câu "chỉ GV có phân công S" (T18 cách hiểu cũ — 03 AU-41, 05 3.4); **mã đã đúng** từ OV-14c (`laGvSpeaking`, `server/src/permissions.ts:289-297`; phép kiểm `prOv14c.tests.ts` OV14c-2, OV14c-10); 02 mục 2.9 (21/10-SCHEO), X-79 | Chốt; mã đã có — giữ ở SV-M2 / M5 |
| FB-4-41 | **(21/10 — Q-A4)** "Để tên là 'Cần làm' nhé" — góc Cần làm thành bộ lọc trong bảng Tất cả (cột Việc · Người phụ trách · Hạn), **giữ tên "Cần làm"** | — | Học viên & Lớp › Cần làm | A | P2 | mọi vai | 02 X-41, X-81; 05 mục 1.5; 07 M4 | Chốt — làm ở M4 |
| FB-4-42 | **(21/10 — Q-C1)** "Cứ vẽ mockup cho lựa chọn 1 nhé **tôi xem xong sẽ duyệt**" — hướng "Chấm Test theo hạn, một nguồn" chưa chốt hẳn | — | Test › Chấm Test, Công việc › Chấm điểm | B | P1 | GV, GV S, QL, QT, Admin VP | 02 X-08; 05 mục 3.2; 06 mục 4 (M5a — vẽ trước); 07 M5 | Chờ mockup → chủ SP duyệt |

---

## 4. Quyết định trước 20/10 còn ảnh hưởng UX (mã gốc)

Chỉ ghi quyết định chạm giao diện / workflow của đợt overhaul. "Sau 20/10" nói còn hiệu lực hay đã bị thay bởi lời chủ SP mới hơn. Nguồn: `CLAUDE.md`, `plan.md` mục 2c + 3 + khối OV-14, đặc tả `2026-10-18-ov14-thiet-ke-tong-the-design.md` (C01–C31, mục 6 chốt 19/10), đánh giá 17/10, Rulebook, bảng thuật ngữ 01/10.

| Mã gốc | Nội dung | Ngày | Nguồn | Sau 20/10 | Liên quan |
|---|---|---|---|---|---|
| 30/09 | Thời gian trên màn ưu tiên mã tuần `W2 OCT`; ngày chỉ cho hạn cụ thể, ngày thi, ngày sinh, nhật ký | 30/09 | CLAUDE.md | Còn | HT-06; 02 X-21 |
| 01/10-TN | Bảng thuật ngữ: C-028 "Đã thi", C-035 "Không dự thi", C-036 "Đã huỷ phần thi" (dùng "thi" cho Test); B-014 "Test" = gọi chung | 01/10 | `thiet-ke/THUAT_NGU_2026-10-01.md` | Chữ "thi" cho Test bị thay bởi V2 I.5 | 02 X-37 |
| T3 | MT "-" lần 2 → kỹ năng "đã huỷ (vắng 2 lần)", báo GVCN; GVCN có "Xin dời" (thẻ chờ QL) | 05/10 | plan 2c | Còn — đây là "luồng gửi duyệt" của luật 4 (đường gửi duyệt nay = thẻ "Dời lịch Test" — 02 X-55); 21/10: Khôi phục = được dời 2 lần | FB-4-37 |
| T7 | Lý do bắt buộc chỉ khi huỷ / mất kết quả + từ chối; còn lại tuỳ chọn, nhật ký ghi cũ → mới | 05/10 | plan 2c | Còn | HT-13 |
| T15 | Lịch Test chia 3 khối: quá hạn chấm · chấm tuần này (= thi tuần trước) · lịch tuần này; một bài một khối | 05/10 | plan 2c | Còn (luật chia); dáng → Q-C1: chờ mockup (21/10) | 02 X-08 |
| T18 | Speaking MT chấm chéo: không GV mặc định; quá hạn chỉ báo GVBM S + GVCN, không tính nợ; trễ tính cho người chấm thật | 05/10 | plan 2c | Còn; **21/10: người được chấm chéo = mọi GV có kỹ năng S, kể cả không dạy lớp nào** (mã đã đúng từ OV-14c) | 12.9-6; FB-4-40 |
| T19 | Không ai nhập điểm trước tuần thi; hạn chấm FT + lớp thường = thứ Tư tuần sau | 06/10 | plan 2c | Còn | 12.9-22 |
| T20 | QL dời kỹ năng / bài đã có điểm, kể cả về tuần cũ — điểm đi theo | 06/10 | plan 2c | Còn | FB-4-28 |
| T21 | QL khôi phục phần thi đã huỷ vào tuần này hoặc tuần đã qua | 06/10 | plan 2c | Còn | FB-4-29 |
| T22 | Xoá điểm = xoá trắng ô rồi Lưu, lý do tuỳ chọn; MT cũ: QL + GVCN sửa / xoá được | 06/10 | plan 2c | Còn | HT-13 |
| T23 | "-" ở MT cũ = Không dự thi (không dời, không tính vắng) | 06/10 | plan 2c | **Thay bởi luật 4 sửa 21/10** (MT cũ "-" = huỷ ngay, khôi phục được) | 02 X-05, X-75 |
| 06/10-NGAY | Ô nhập ngày mọi nơi = ô gõ + nút lịch (`ONgay`); không hàng nút "Hôm nay · Hôm qua · 2 ngày trước" | 06/10 | CLAUDE.md; plan 3 | Còn — thắng đề xuất 12.7 và hàng nút ở Chuyển lớp | 02 X-20 |
| 06/10-CD | Hộp Chờ duyệt luôn hiện mọi chi nhánh | 06/10 | a7 (câu Q1) | Thay bởi 9.1-4 | 02 X-03 |
| 08/10 | Nghĩ tới đầu ra trước; workflow đơn giản, không kẹt; mặc định làm điều hiển nhiên; "sửa trên nền có sẵn, không làm lại" | 08/10 | CLAUDE.md | Phần workflow còn; phần "không làm lại" thay cho giao diện (MP 0, 9.1-1) | 02 X-11 |
| 09/10 | Lớp thường: dời lịch một môn chỉ QL | 09/10 | v3a (`sd/thaoTacMt.ts:49-70`) | Còn (= 14/10-Q13) | 02 X-31 |
| 11/10-UX | Nguyên tắc workflow + UX: làm tại chỗ; tách nút làm việc / link xem hồ sơ; không panel lồng panel; Quay lại về đúng nguồn; một khái niệm một tên; một số một nguồn; giao diện theo vai đi cùng quyền; trạng thái lưu rõ; xác nhận chỉ khi hậu quả lớn | 11/10 | CLAUDE.md | Còn — nền của HT-04, HT-05 | HT-04, HT-05 |
| 11/10-TVV | TVV xem cả chi nhánh, mặc định "HV của tôi"; không Test, **không Công việc**; CX như TVV mọi chi nhánh, Phân tích trừ phần GV | 11/10 | plan 3 | Còn — Q-A1 ① (21/10): TVV không thêm Công việc, việc ở Tổng quan TVV | 02 X-27; FB-4-39 |
| 11/10-VANG | "-" trong tuần thi = vắng chốt ngay (lần 1 dời tuần sau, lần 2 huỷ phần thi); nhập bù sau tuần thi / MT cũ = Không dự thi | 11/10 | plan 3 | Phần MT cũ **thay bởi luật 4 sửa 21/10** (MT cũ "-" = huỷ ngay) | 02 X-05, X-75 |
| 11/10-HUY | Huỷ cả lượt MT giữ điểm ẩn; Khôi phục = nguyên trạng (chỉ QL) | 11/10 | plan 3 | Thay ở Kế hoạch Test bởi 19/10-M6 "Huỷ = Xóa" | 02 X-28 |
| HD2 | Lớp thường giữ ô gõ thẳng đúng / tổng + nút Nhận xét | 11/10 | plan 3; v3a | Thay ở máy tính bởi V3 I.2 | 02 X-02 |
| 13/10-SUA | Sửa sau khi lưu: ai lưu được thì sửa được + QL; không thêm bước duyệt; nhật ký trước → sau; giữ khoá: báo cáo đơn vị hết cửa sổ, lệnh chuyển lớp đã thi hành, Case hệ thống đóng, nhật ký, chuông đã gửi | 13/10 | plan 3 | Còn — cùng hướng luật 3 | HT-13 |
| 13/10-VAI | Hiển thị theo vai: nút / link chỉ hiện khi máy chủ cho làm | 13/10 | plan 3 | Còn | 9.2-10; FB-4-21 |
| 13/10-TVV | TVV sửa mọi thông tin HV kể cả Target; Tạm dừng / Quay lại / Thôi học; nhập kết quả thi thật | 13/10 | plan 3 | Còn; 21/10: "Cập nhật kết quả thi thật" thành việc TVV, không hạn | FB-4-39 |
| 13/10-KCK | KCK nhẹ: dấu riêng; dưới kỳ vọng không SOS, chip xám | 13/10 | plan 3 (OV-9) | Còn | 10.7-8 |
| 14/10-Q1 | Lớp thường "-": tuần thi cách ≥ 2 tuần → Không dự thi; trong 2 tuần → dời sang tuần sau của tuần hiện tại | 14/10 | plan 3 | Còn (ngoài luật 4 — luật 4 chỉ cho MT; 21/10 xác nhận lớp thường không đổi) | FB-4-37 |
| 14/10-Q3 | "Thiếu thông tin" tính thêm ngày sinh + email; không bắt buộc khi thêm / sửa; TVV cập nhật, không hạn | 14/10 | plan 3 | Còn; Q-D4 ① (21/10): 4 trường — Ngày sinh · Email · Tuần bắt đầu · Target (FT) | 02 X-26 |
| 14/10-Q4 | Lớp đã kết thúc: chỉ QL sửa điểm; hồ sơ Lưu trữ khoá | 14/10 | plan 3 (planning chọn, chủ SP "ok") | Còn — Q-B1 ① (21/10): giữ | HT-13 |
| 14/10-Q13 | Dời lịch môn (lớp thường) chỉ QL; GV gõ "-" máy vẫn tự dời | 14/10 | plan 3 | Còn — trả lời 12.9-7 | 02 X-31 |
| 14/10-OV12 | Hạn kết quả PA 2 tuần (hết thứ Ba); MT bắt buộc nhận xét + nhóm nguyên nhân khi dưới kỳ vọng; "Đang SOS" theo tuần thi; TVV chọn Bước tiếp sau thi cả 3 hướng | 14/10 | plan 3 | Còn, trừ "Đang SOS theo tuần thi" (thay bởi 9.1-4) | 02 X-22 |
| 16/10-OV13p | TVV / CX được tạo lớp, thêm HV; không bước duyệt | 16/10 | plan OV-13 | Còn | FB-4-39 |
| 16/10-OV13q | "Đã thi xong · hạn 1 tuần"; chỉ có tháng → ngày cuối tháng là ngày thi | 16/10 | plan OV-13q | Phần "chỉ tháng" **thay bởi V2 I.6.3** | 02 X-29 |
| 17/10 | Sáng / tối theo máy | 17/10 | plan OV-14 | Còn | — |
| 17/10-PL | (planning tự quyết, mockup 1 duyệt 18/10) "Quá hạn" chỉ chữ cam + ⚠, không chip; hàng đã thi nền xanh + vạch trái 3 px + chip; đang chọn = viền khung 2 px | 17–18/10 | plan OV-14; DESIGN.md | Còn (phần "đang chọn" bị thay 21/10: nền nhấn nhạt + vạch trái 3 px — 02 X-19, 4.7 A11) | 02 X-19 |
| R11 | Sau "đợt hoàn tất" GVBM không sửa / xoá điểm đã có, chỉ QL; MT cũ khoá 7 ngày sau lần nhập cuối | 23/09 | Rulebook dòng 564, 589, 600, 723 | **LỆCH luật 3 → sửa** | FB-4-25 |
| T17-27/09 | Không tự mở lớp ở Học viên & Lớp | 27/09 | PR-N1 (phụ lục a6) | Thay bởi mockup 1 khung 3 (9.1-1) | 02 X-36 |
| Q15-cũ | "Quyết định không hoàn tác" | trước 18/10 | phụ lục a1 (câu 8) | Thay bởi mockup 3 "Hoàn tác 8 s" (9.1-1) | 02 X-47 |
| C02 | Bấm là tới đúng dữ liệu + làm được; số 0 không là link | 18/10 | đặc tả OV-14 | Còn | HT-04 |
| C06 | Số căn giữa + `tabular-nums`; tên / chữ dài căn trái | 18/10 | đặc tả OV-14 | Còn (cách hiện thực đổi) | 02 X-01 |
| C08 | Chip SOS vàng / cam / đỏ chỉ viền (+ viền dày dần) | 18/10 | đặc tả OV-14 | Còn | HT-02 |
| C09 | Thang chữ 12/13/14/16/20, ô bảng 13, đầu cột 12 không in hoa | 18/10 | đặc tả OV-14 | Phần cỡ thay bởi V1 I.1; "không in hoa" còn | 02 X-13 |
| C10 | Dải lọc dính dưới tiêu đề, chip đang lọc có ✕ | 18/10 | đặc tả OV-14 | Còn — chưa PR nào làm | HT-17 |
| C11 | Giao diện, Ngôn ngữ, Hướng dẫn vào menu tài khoản | 18/10 | đặc tả OV-14 | Còn | HT-17 |
| C15 | Dán điểm + nhận xét từ Excel ở mọi lưới nhập | 18/10 | đặc tả OV-14 + mockup 2 | Thay bởi V3 I.5 | 02 X-15 |
| C16 | Bỏ tab Điểm theo lớp; ⋯ hàng lớp → panel nhập điểm tại chỗ | 18/10 | đặc tả OV-14 | Còn (panel chỉ cho lối ngoài hồ sơ lớp) | FB-2-11 |
| C18 | Một ô "Tìm lớp, học viên hoặc email…" | 18/10 | đặc tả OV-14 | Còn | HT-17 |
| C20 | Kế hoạch Test, hộp lịch, xuất: luôn ghi năm `W4 AUG/2026` | 18/10 | đặc tả OV-14 | PTA đề nghị đảo (thẩm mỹ) | 02 X-17 |
| C22 | Một component Lịch sử thay đổi theo đối tượng (trước → sau, ai, lúc, nguồn, lý do) | 18/10 | đặc tả OV-14 (OV-15g) | Còn — nền cho luật 3 | HT-13 |
| C23 | Tổng quan: "Lớp cần chú ý", "HV cần chú ý", "Case chưa chốt PA" (định nghĩa gộp các trạng thái chờ) | 18/10 | đặc tả OV-14 | Còn (định nghĩa); cách hiện → 10.2 | HT-04 |
| C24 | Báo cáo mặc định 2 tuần hoàn chỉnh trước | 18/10 | đặc tả OV-14 | Còn | 12.7 |
| C26 | Panel báo cáo hiện kết quả cụ thể (điểm, của ai, đợt, kết quả); làm tại chỗ | 18/10 | đặc tả OV-14 | Còn (web chưa theo — A5-07) | HT-04 |
| C27 | Kết quả thi lọc Mock · Thi thật · Progress · Final | 18/10 | đặc tả OV-14 | Thay bởi 19/10-M6 (chỉ Mock + Thi thật) | 02 X-16 |
| C29 | Bộ chọn thời gian 4 kiểu dùng chung, giữ khi đổi tab | 18/10 | đặc tả OV-14 | Kiểu thay bởi V2 I.1, V3 II.5; "giữ khi đổi tab" còn | 02 X-14 |
| C30 | Phân tích GV giữ chiều sâu | 18/10 | đặc tả OV-14 | Thay một phần bởi khung 4c (9.1-1) | 02 X-35 |
| C31 | Xuất Excel danh sách HV: "Toàn bộ đang lọc" / "Đã chọn", 3 mẫu cột | 18/10 | đặc tả OV-14 | Phần "Đã chọn" (ô tick) → Q-E2 | 02 X-42 |
| Q6a | Dải tóm tắt nhỏ dẫn tới việc ở Tổng quan | 18/10 | đặc tả OV-14 mục 2 | PTA đề nghị bỏ | 02 X-24 |
| 18/10-S | GV Speaking = có kỹ năng S trong hồ sơ (hoặc dạy S lớp FT); mọi lớp FT ở chi nhánh được cấp; bài hiện từ thứ Hai tuần thi | 18/10 | đặc tả OV-14 mục 0 | Còn | 12.9-6 |
| 19/10-M6 | Mockup v2 duyệt: hạn chỉ ghi ngày; phân trang 10 / 20 / 50 (không áp lưới nhập, hàng đợi); Huỷ = Xóa ở Kế hoạch Test (có điểm thì không xoá; ngoại lệ vắng 2 lần); Kết quả thi chỉ Mock + Thi thật, đếm theo lượt; ✓ / ✗ trơn, bằng kỳ vọng = ✓, bỏ "thiếu / vượt 0.5"; "Nhập bởi" chỉ khi có điểm; bấm chip SOS mở giải thích; "Cần xác nhận" không tự tạo việc; tên trang "Báo cáo" | 19/10 | đặc tả OV-14 mục 6 | Còn | 02 X-18, X-28, X-30 |
| 19/10-BC | Báo cáo là tab đầu Phân tích; mockup 6 duyệt; màu trang đậm hơn | 19/10 | plan OV-14 | Còn (khung 10 của mockup 6 hết hiệu lực phần menu) | 9.2-32 |
| 19/10-GV | GV vào thẳng Công việc (trang nhà của GV) | 19/10 | tài liệu chính 10.1 | Còn (không trái thứ tự menu) | 02 X-46 |

---

## 5. Ý do PTA tự đề xuất (loại C) — để không lẫn với lời chủ SP

Tất cả là **đề xuất chưa duyệt**. Chỗ nào chạm nghiệp vụ / quyền / định nghĩa số đã đẩy thành câu hỏi ở 02 mục 5; phần thẩm mỹ / UX PTA tự quyết (02 mục 4) và trình bằng mockup.

| Mã | Ý PTA | Nguồn | Gắn với | Trạng thái |
|---|---|---|---|---|
| PTA-01 | Quy trình Q1–Q13: bảng truy vết khung → thành phần → ảnh, ảnh cặp mockup ↔ web toàn trang, một màn một PR, cổng ≥ 90 % khớp, chủ SP duyệt, khung thắng kế hoạch cũ | 3.3 | HT-18 | Một phần đã chốt (9.1-1, 9.1-2); còn lại ghi ở GĐ0 |
| PTA-02 | Một sổ số liệu: bộ lọc trang = bộ lọc mọi số; một khái niệm một chỉ số một tên; số kèm đơn vị + phạm vi | X1 | HT-04 | Đề xuất (9.1-4 đã chốt một phần) |
| PTA-03 | Khung trang chung: tiêu đề = tên menu, chi nhánh, chương trình, thời gian, dải lọc dính (C10) | X6 | HT-17 | Đề xuất (C10 đã chốt 18/10) |
| PTA-04 | Hợp đồng panel + thang "làm tại chỗ" 0–5 | X3, 10.3 | HT-05 | Đề xuất (PTA tự quyết) |
| PTA-05 | Ngân sách chiều cao trang (≤ ~2 màn 1440, ≤ ~4 màn 375) + nhãn chỉ khi có nghĩa | X5 | HT-22 | Đề xuất |
| PTA-06 | Một mẫu mỗi thành phần + sân mẫu `/dev/thanh-phan` + phép kiểm chống trôi | X7 | HT-08 | Đề xuất |
| PTA-07 | Từ điển chữ + phép kiểm chặn tên cũ | X8 | HT-07 | Đề xuất |
| PTA-08 | Thang chữ 12 · 13 · 14 · 15 · 17 · 22 · 28; giữ Be Vietnam Pro + chữ số Inter | 10.1 | HT-01 | PTA tự quyết |
| PTA-09 | 3 token màu kết quả + luật "x / tổng" ("✗ 17/25", không % trong ô) | 10.1, 12.1 | HT-02 | PTA tự quyết |
| PTA-10 | Hệ trạng thái hover / đang chọn / focus | 10.1 | HT-08 | PTA tự quyết (02 X-19) |
| PTA-11 | Tổng quan bố cục B + bỏ dải "HV cần chú ý" + phân vai với Công việc | 10.2 | HT-09 | Q-A1 ①, Q-A2 ① B (21/10); bỏ dải PTA tự quyết (gói đồng ý) |
| PTA-12 | Hệ bảng `Bang` + `ODiem` + kiểu cột + `do-bang` + phép kiểm tĩnh | 11.1a, 12.1 | HT-03 | Đề xuất; Q-E1 ① (21/10): BANG-0/1 trong GĐ1 |
| PTA-13 | Thành phần `Khoảng tuần` + một hook "bấm ra ngoài" dùng chung | 11.1b, 12.7 | HT-06 | Đề xuất |
| PTA-14 | Bỏ góc "Cần làm", thay chip ⚠ trên hàng lớp mở dải việc | 11.2 | HT-20 | Chủ SP 21/10 (Q-A4): không bỏ — bộ lọc trong bảng Tất cả, giữ tên "Cần làm" (FB-4-41) |
| PTA-15 | Xuất Excel phương án 3: chọn / bỏ em trong panel Xuất | 11.2 | HT-12 | Q-E2 ① (21/10) |
| PTA-16 | Lịch thi nhóm theo trạng thái + hàm `trangThaiLichThi` + việc "Chốt ngày thi" | 11.2, LT-SV | HT-15 | Đề xuất; Q-C3 ①, Q-C4 ① (21/10) |
| PTA-17 | Ý thức lớp phương án A (một bảng theo em) + hồ sơ HV hai cột | 11.3, 11.4 | HT-10 | PTA tự quyết, mockup duyệt |
| PTA-18 | Hộp chấm một mẫu cho FT + lớp thường (gõ số mở hộp) | 12.1 | HT-11 | PTA tự quyết (thay HD2 — báo) |
| PTA-19 | Chấm Test "theo hạn, một nguồn" + "Tình trạng chấm" cho QL | 12.2 | HT-11 | Q-C1 (21/10): vẽ mockup, chủ SP duyệt sau (FB-4-42) |
| PTA-20 | Dáng "ô số" + luật chọn panel L1 + mẫu panel C | 12.4 | HT-04, HT-05 | PTA tự quyết, mockup duyệt |
| PTA-21 | Báo cáo một PR màn + nút "Chiếu" + "bài chấm trễ trong kỳ" + bảng "Theo chi nhánh" | 12.5 | HT-16 | Q-C2 ① (21/10) |
| PTA-22 | Báo cáo thuần T1 + Ý thức Y1 | 12.5 | HT-16 | PTA tự quyết (theo nguyên tắc đã chốt) |
| PTA-23 | Xuất E1: từ điển cột, mặc định = bộ lọc trang, mọi xuất qua máy chủ + nhật ký | 12.6 | HT-12 | PTA tự quyết |
| PTA-24 | Một bảng "Vấn đề & PA" (H2) thay Hiệu quả PA | 12.8 | HT-16 | PTA tự quyết, mockup duyệt |
| PTA-25 | Tutor F1 (khối "Việc của bạn", 3 chip, "Lọc ▾") + B1 (cột "Kết luận / lý do") | 12.8 | HT-21 | PTA tự quyết + cần dữ liệu |
| PTA-26 | Lộ trình GĐ0 → GĐ4; PR SL1, SL2, CV-LOI, KHUNG-LOI, LT-SV, CHU-THI, BANG-0/1, NEN; màn M0…M7 | 8, 10.6, 11.7, 12.10 | HT-18 | Q-E1 ① (21/10); chi tiết ở 07 |
| PTA-27 | Dữ liệu demo theo ngày demo (SEED-UX) + công cụ đo (`do-khung`, `do-bang`, ảnh cặp) | X11 | HT-18, HT-21 | Đề xuất (GĐ0) |

---

## 6. Vấn đề hệ thống (HT) — gộp ý trùng, giữ ngoại lệ

| HT | Vấn đề hệ thống | FB thành phần (+ mã gốc) | Ngoại lệ / chi tiết phải giữ | Xử lý ở đâu | Câu hỏi |
|---|---|---|---|---|---|
| HT-01 | Chữ quá nhỏ, phân cấp chữ yếu | FB-1-01, FB-4-13, FB-2-17, FB-3-17; C09 | Ô nhập 375 = 16 px; lưới điểm 14; không chữ < 12; không in hoa chữ Việt; line-height ≥ 1,5 chỗ dấu chồng; bù chiều dài bảng bằng bỏ khối trùng trong cùng PR | 10.1; 04 | — |
| HT-02 | Màu điểm trên chính con số + ký hiệu, đồng bộ mọi nơi | FB-1-03, FB-3-01, FB-2-09; C05, C08, 19/10-M6 | Không đổi ngưỡng / luật phân loại (70 % lớp thường); KCK trung tính + chữ "KCK"; "Chưa đủ điểm" trung tính; ô đang gõ không tô; không lẫn màu SOS; ✓ / ✗ để không chỉ dựa màu | 10.1, 12.1; 04 | — |
| HT-03 | Bảng lệch, clipping, ô điểm nhiều dáng, nút đè ô | FB-2-09, FB-2-14, FB-3-03, FB-3-04, FB-4-14, FB-0-03 (bảng tràn thẻ), FB-4-22 (che đầu mục); C06 | Bảng đang 0 lệch (Kết quả thi, Báo cáo, Hồ sơ GV, Quản trị, Mock hồ sơ HV) làm đối chứng; cấm ô nhập / nút trong tiêu đề; vùng bấm ≥ 44 px bằng `min-height`, không padding âm; 375 tự thành thẻ từ cùng định nghĩa cột | 11.1a, 12.1; 04, 07 | Q-E1 (thời điểm) |
| HT-04 | Số liệu một nguồn; chỉ số bấm được: chết, nhỏ, sai ngữ cảnh, panel chỉ ra tên | FB-0-01, FB-0-09, FB-1-04, FB-1-05, FB-1-07, FB-3-07, FB-3-08, FB-3-09, FB-4-36; C02, C23, C26, 9.1-4 | Số cố ý khác phạm vi (badge, chuông) ghi "mọi chi nhánh"; số 0 không bấm; số chỉ để xem để trơn; dòng xong ở lại tới khi đóng panel; đổi trang phải giữ đủ lọc; **(21/10) chuông "Cần làm" đọc cùng hàm hàng đợi trang đầu — số trên chuông = số dòng đó (9.2-4); chỉ chuông trong ứng dụng (Rb 20.11)** | X1, X2, 10.2, 12.4; 03, 05 | Q-C2 (số mới) |
| HT-05 | Làm tại chỗ; panel thừa / chồng; chuyển trang thừa; mở rộng sai chỗ | FB-0-15, FB-1-06, FB-2-11, FB-4-19, FB-4-20, FB-4-21, FB-4-22, FB-4-35; 11/10-UX | Chỉ chuyển trang để xem hồ sơ / cần không gian lớn; danh sách hẹp không mở rộng tại dòng (ảnh v4-1, v4-3) mà dùng khung phải; panel nhập điểm lớp chỉ cho lối ngoài hồ sơ lớp; không panel lồng panel; **(21/10) tạo Case nhiều kỹ năng trong một panel nhưng mỗi kỹ năng vẫn một Case (một em × một hạng mục, trùng → gợi ý ghi vào Case đang có)** | X3, 10.3, 11.1c, 12.4; 05 | — |
| HT-06 | Bộ lọc thời gian + lỗi bộ chọn tự đóng | FB-2-01, FB-3-13, FB-3-14, FB-4-15; C29, 30/09, 06/10-NGAY | Tháng thi / ngày thi thật giữ bộ chọn tháng / ngày; ô NHẬP ngày giữ `ONgay`; "Toàn bộ" chỉ ở Phân tích; Đang SOS không có bộ lọc thời gian (9.1-4); Báo cáo mặc định 2 tuần (C24); không hàng nút ngày / tuần | 11.1b, 12.7; 04, 05 | Q-E1 (vá bộ chọn) |
| HT-07 | Thuật ngữ: Thi ↔ Test, một khái niệm nhiều tên, chữ dài | FB-2-02, FB-2-05, FB-2-07, FB-0-11, FB-4-03; 01/10-TN | Giữ "Dự kiến thi", "Ngày thi", "Kết quả thi thật", "Sắp thi", "Lịch thi" (góc HV & Lớp); giữ tên "Học viên & Lớp"; chỉ đổi chữ, không đổi luật | X8, 11.1d; 04 | — |
| HT-08 | Hover, trạng thái, phân cấp thị giác, nhóm lặp | FB-1-10, FB-2-13, FB-4-13; 17/10-PL | Nền hàng chỉ cho "Đã thi"; đang chọn = nền nhấn nhạt + vạch trái 3 px (khác vòng focus 2 px — quyết định 21/10, 02 4.7 A11); quá hạn chỉ chữ cam + ⚠ (không chip, không tô hàng); không thêm nghĩa màu thứ sáu | 10.1, 11.3 (V2B-7); 04 | — |
| HT-09 | Tổng quan ↔ Công việc: bố cục khu việc, hàng đợi, phân vai | FB-1-09, FB-1-11, FB-4-17, FB-4-18, FB-0-03, FB-4-36; 19/10-GV | GV giữ trang nhà là Công việc; thứ tự menu đã chốt; một hàng đợi một luật tự sang việc kế (cùng nhóm, của tôi, đang hiện) | 10.2, X9; 05 | Q-A1 ①, Q-A2 ① (21/10) |
| HT-10 | Ý thức / Phối hợp + xử lý vi phạm + việc TVV | FB-0-05, FB-2-12, FB-2-13, FB-2-16, FB-3-11, FB-4-09, FB-4-10, FB-4-23, FB-4-24, FB-4-34 | Giữ thang 6 bậc, WL 3 / ngoài thang qua QL duyệt, hạn 5 ngày GVCN, phối hợp không phải vi phạm, xác nhận / bỏ kèm lý do; Rulebook §19 (hồ sơ lớp mặc định theo học sinh); việc TVV sinh ngay khi GVCN lưu; **thu hồi lần xử lý đã lưu / xử lý không tăng bậc → QL duyệt, bắt buộc lý do (21/10)**; **TVV giữ 4 việc — Chốt ngày thi · Chọn bước tiếp (hạn 1 tuần) · Bổ sung hồ sơ thiếu · Cập nhật KQ thi thật (không hạn); Báo PH lớp thường giữ như nay (21/10)** | 11.3, 11.4, 12.5 (Y1); 05 | Đã trả lời 21/10: Q-A3 (FB-4-39), Q-D1 ①, Q-D3 ①, Q-D4 ① |
| HT-11 | Workflow chấm Test: tuần thi ↔ hạn, ba khung, Speaking chéo, hộp chấm | FB-0-13, FB-3-02, FB-3-05, FB-0-03, FB-4-40, FB-4-42; T15, T18, T19, HD2 | Giữ luật chia khối (T15), T18 (không tính nợ S), T19 (không nhập trước tuần thi); nhận xét MT bắt buộc ≥ 10 ký tự; nhãn hạn chỉ ghi ngày; **(21/10) chấm chéo S = mọi GV có kỹ năng S, kể cả không dạy lớp nào** | 12.1, 12.2; 05 | Q-C1: chờ mockup (21/10) |
| HT-12 | Nhập / xuất Excel | FB-2-04, FB-3-06, FB-3-12; C15, C31 | Xuất ≠ nhập; "Thêm học viên" (điểm đầu vào) ngoài phạm vi bỏ; xuất khớp đúng bộ lọc trang gọi; tệp có email / kỷ luật phải ghi nhật ký | 11.2, 12.3, 12.6; 05, 07 | Q-E2 ① (21/10) |
| HT-13 | Sửa sau lưu, hard lock, lịch sử, duyệt | FB-4-11, FB-4-16, FB-4-25, FB-4-26, FB-4-27, FB-4-34; 13/10-SUA, R11, T7, T22, C22, 14/10-Q4 | Giữ 5 khoá của 13/10 (báo cáo đơn vị hết cửa sổ, lệnh chuyển lớp đã thi hành, Case hệ thống đóng, nhật ký, chuông đã gửi); không biến "được sửa" thành "bỏ duyệt"; lý do bắt buộc khi huỷ / từ chối **và khi GVCN thu hồi / không tăng bậc một lần xử lý vi phạm (21/10 — qua QL duyệt)** | 05 | Q-B1 ①, Q-B2 ① (21/10) |
| HT-14 | MT: lịch, dời, huỷ, khôi phục, dấu "-" | FB-4-12, FB-4-28, FB-4-29, FB-4-37, FB-4-38; T3, T20, T21, T23, 11/10-VANG, 11/10-HUY, 19/10-M6 | MT hiện tại giữ luồng gửi duyệt (thẻ "Dời lịch Test" → QL); lớp thường giữ 14/10-Q1; Writing chỉ chốt vắng khi cả W1 và W2 "-"; Huỷ = Xóa ở Kế hoạch Test (có điểm thì không xoá; ngoại lệ vắng 2 lần); **(21/10) MT cũ "-" = huỷ ngay · đếm theo tuần · Khôi phục = được dời 2 lần · QL duyệt thêm = +1 · Hoàn tác 10 s, vẫn khôi phục được** | 05 | Đã trả lời 21/10 → luật 4 sửa (FB-4-37) |
| HT-15 | Lịch thi thật: tháng / ngày, Chưa chốt ngày, "Cần xác nhận", Ghi chú | FB-2-06, FB-2-07, FB-2-08; 16/10-OV13q, 19/10-M6 | Việc "chốt ngày thi" KHÔNG hạn, không vào số quá hạn / chuông; cho chọn ngày đã qua (em đã thi); Lịch thi lọc theo tháng (ngoại lệ) | 11.2; 05, 07 | Q-C3 ①, Q-C4 ① (21/10); người giữ việc Chốt ngày thi = TVV (FB-4-39) |
| HT-16 | Phân tích / Báo cáo: bám mockup, báo cáo thuần, gộp bảng PA | FB-0-09, FB-0-10, FB-0-11, FB-3-10, FB-3-11, FB-3-15; C24, C27, C30, 19/10-BC | Không xoá dữ liệu nguồn khi bỏ cột; ngoại lệ Thi thật giữ "Bước tiếp" trên hàng; khối "tại hôm nay" ghi rõ khi xem kỳ cũ; không đổi logic PA ("Nên dùng") | 12.4–12.8; 03, 06 | Q-C2 |
| HT-17 | Khung trang, điều hướng, menu, tìm | FB-1-02, FB-0-01 (tiêu đề "Việc hôm nay", ô chi nhánh), FB-0-09 (ô chi nhánh); C10, C11, C18 | Tiêu đề = tên menu; 375 thanh dưới ≤ 5 nút; dưới 1 440 px gom "Thêm ▾" | X6, 10.1; 04, 05 | — |
| HT-18 | Bám mockup + quy trình làm (ảnh cặp, một màn một PR, chủ SP duyệt, cổng) | FB-0-14, FB-4-05, FB-4-08, FB-4-32; 9.1-1, 9.1-2 | PR chỉ máy chủ vẫn tự merge; PR bố cục không merge qua đêm | mục 3; 06, 07 | Q-E1 |
| HT-19 | Rà theo vai + hành trình | FB-4-06, FB-4-30, FB-0-16; 11/10-TVV, 13/10-VAI | Giao diện theo vai đi cùng quyền máy chủ; không tối ưu vai này làm khó vai khác | X9, 7.9; 03, 05 | Q-A3 |
| HT-20 | Học viên & Lớp: hàng dày, "Thiếu n", Cần làm, Đang SOS | FB-0-06, FB-0-07, FB-0-08, FB-2-03; 14/10-Q3 | Không đổi logic xác định việc (MP V.3); "Thiếu" chỉ hiện cho vai điền được | X4, X5, 7.4, 11.2; 05 | Q-A4 (bộ lọc, giữ tên "Cần làm"), Q-D4 ① (21/10) |
| HT-21 | Tutor: bộ lọc, bảng, dữ liệu demo | FB-0-02, FB-3-16 | Không đổi định nghĩa "Cần chú ý", "Đang dạy", "Ngừng hợp tác"; tách lỗi UI ↔ giả thuyết cần dữ liệu | 12.8, X11; 03 | (xin dữ liệu, 02 mục 4.8) |
| HT-22 | Trang quá dài, khối trùng | FB-0-04, FB-0-05, FB-0-13 | Lưới Điểm MT giữ nhưng gập (không bỏ); chỉ bỏ khối trùng khi có lối thay thế | X4, X5; 05, 07 | — |

---

## 7. Kiểm chéo: đề mục IV–XV của MP → FB

Mọi đề mục đều có ≥ 1 dòng. "Nhắc lại" = ý đã có ở vòng trước, dòng FB gốc ghi thêm phần MP bổ sung.

| Đề mục MP | Nội dung ngắn | FB | Ghi chú |
|---|---|---|---|
| IV.1 | Nút chỉ nháy; thanh thông tin quá dày | FB-1-04 | nhắc lại vòng 1 |
| IV.2 | Quá nhiều số / panel vô dụng | FB-1-05 | nhắc lại |
| IV.3 | Thêm PA tại dòng HV (phương án cần đánh giá) | FB-1-06 | nhắc lại |
| IV.4 | SOS: vùng bấm + overhaul panel SOS | FB-1-07 | nhắc lại |
| IV.5 | Bỏ Trễ chấm (đã chốt) | FB-1-08 | nhắc lại |
| IV.6 | "Việc hôm nay" thiết kế lại toàn bộ | FB-1-09 | nhắc lại |
| IV.7 | Hover trùng cấp | FB-1-10 | nhắc lại |
| IV.8 | Hộp duyệt trên, trái / phải (chưa chốt) | FB-1-11 | nhắc lại |
| V.1 | Bộ lọc tuần bắt đầu → kết thúc | FB-2-01 | nhắc lại |
| V.2 | "Thời gian" | FB-2-02 | nhắc lại |
| V.3 | Bảng "Cần làm" | FB-2-03 | MP thêm "không đổi logic xác định việc" |
| V.4 | Checkbox xuất Excel A / B / C | FB-2-04 | MP thêm "nếu A thì ưu tiên lớp đang mở hay bộ lọc" |
| V.5 | Thi / Test | FB-2-05 | nhắc lại |
| V.6 | Lịch thi; "Ghi chú"; "Cần xác nhận" | FB-2-06, FB-2-07 | nhắc lại |
| V.7 | Tháng thi / ngày thi; việc không hạn | FB-2-08 | nhắc lại |
| V.8 | Ô W1 / W2 lệch | FB-2-09 | nhắc lại |
| VI.1 | Mọi bảng Hồ sơ lớp | FB-2-10 | nhắc lại |
| VI.2 | Nhập điểm MT tại chỗ (đã chốt) | FB-2-11 | nhắc lại |
| VI.3 | Ý thức / Phối hợp lớp | FB-2-12 | nhắc lại |
| VI.4 | Phối hợp SOS cùng màu (ảnh 3) | FB-2-13 | nhắc lại |
| VI.5 | Bảng điểm lệch (ảnh 4) | FB-2-14, FB-4-14 | nhắc lại |
| VI.6 | Lỗi bất thường (ảnh 5) | FB-2-15 | MP thêm "không kết luận khi chưa đủ bằng chứng" |
| VII | Hồ sơ HV Ý thức | FB-2-16, FB-4-24 | MP thêm "nối workflow GVCN → TVV" |
| VIII.1 | Điểm rõ, màu trên số | FB-3-01 | nhắc lại |
| VIII.2 | Nhận xét trong hộp chấm (ảnh 1) | FB-3-02 | nhắc lại |
| VIII.3 | Nút ⋯ bị cắt (ảnh 1) | FB-3-03 | nhắc lại |
| VIII.4 | Bảng Test lệch | FB-3-04 | nhắc lại |
| VIII.5 | Ba khung chấm Test, chống chấm nhầm tuần | FB-3-05 | nhắc lại |
| VIII.6 | Luật chấm phải bảo toàn | FB-3-05 | nhắc lại (vòng 3 I.4.2) |
| VIII.7 | Tra cứu kết quả cho Admin / QL | FB-3-05 | nhắc lại (vòng 3 I.4.4) |
| VIII.8 | Excel nhập chỉ theo lớp × MT | FB-3-06 | nhắc lại |
| IX.1 | Bỏ gạch chấm; panel A / B / C | FB-3-07, FB-3-08 | nhắc lại |
| IX.2 | Điều hướng đúng ngữ cảnh | FB-3-09 | nhắc lại |
| IX.3 | Báo cáo ↔ mockup; nâng mockup | FB-3-10 | nhắc lại |
| IX.4 | Báo cáo có mục tiêu; Ý thức "báo trễ" | FB-3-11 | nhắc lại |
| IX.5 | Xuất Excel theo mục đích | FB-3-12 | nhắc lại |
| IX.6 | Toàn bộ / Chọn khoảng tuần | FB-3-13, FB-4-15 | MP thêm "riêng Phân tích" |
| IX.7 | Picker tự đóng | FB-3-14 | nhắc lại |
| IX.8 | Hiệu quả PA + Tổng hợp vấn đề | FB-3-15 | nhắc lại |
| X | Tutor | FB-3-16 | nhắc lại |
| XI.1 | Công việc dày đặc (ảnh 1) | FB-4-17 | **mới** |
| XI.2 | Tổng quan ↔ Công việc | FB-4-18 | **mới** |
| XI.3 | Panel công việc chữ díu | FB-4-19 | **mới** |
| XI.4 | Hệ panel dùng chung | FB-4-20 | **mới** (gần vòng 3 II.1.2) |
| XI.5 | Nút Phân công sai case (ảnh 2) | FB-4-21 | **mới** |
| XI.6 | Gạch chân xanh mở panel che đầu mục (ảnh 3) | FB-4-22 | **mới** |
| XI.7 | Nhập Excel ở panel | FB-3-06 | nhắc lại (+ làm lại panel) |
| XII.1 | Nhóm việc TVV | FB-4-23, FB-4-39 | **mới** (+ trả lời 21/10: 4 việc + hạn) |
| XII.2 | Việc "Ghi nhận kết quả xử lý vi phạm" | FB-4-09, FB-4-10, FB-4-24, FB-4-34 | **mới** (+ bổ sung 21/10: thu hồi / không tăng bậc qua QL duyệt) |
| XIII.1 | Progress Test không sửa được (ảnh 4) | FB-4-25 | **mới** |
| XIII.2 | Rà mọi hard lock | FB-4-26 | **mới** |
| XIII.3 | Lịch sử và duyệt | FB-4-27 | **mới** |
| XIV.1 | Overhaul workflow MT | FB-4-28 | **mới** |
| XIV.2 | Dấu "-" (đã chốt) | FB-4-12, FB-4-37, FB-4-38 | **mới** (+ luật 4 sửa 21/10) |
| XIV.3 | Huỷ lịch / huỷ MT / huỷ điểm | FB-4-29 | **mới** |
| XV | Rà theo vai | FB-4-30 | **mới** |

Ngoài IV–XV: Phần 0 → FB-4-01…04 · Phần I → FB-4-05…08 · Phần II → FB-4-09…12 · III.1 → FB-4-13 · III.2–III.7 → FB-1-01, FB-1-03, FB-2-14 / FB-4-14, FB-1-06, FB-1-02, FB-2-05 · III.8 → FB-4-15 · III.9 → FB-4-16 · XVI.A → 02 mục 2.6 · XVI.B, XVI.C → 02 mục 2.7, FB-4-31 · XVII → FB-4-32 · XVIII → FB-4-33.

## 8. Ý chỉ có ở MP (vòng 0–3 chưa nói)

1. **4 luật Phần II** (FB-4-09…12) — 3 luật lệch mã (mục 1).
2. **III.1** câu hỏi bắt buộc cho mỗi bảng / panel / box: "xem gì · làm gì · cho ai · bước tiếp ở đâu" (FB-4-13).
3. **III.8 "RIÊNG trang Phân tích"** có "Toàn bộ" — thu hẹp đề xuất 12.7 (FB-4-15, 02 X-06).
4. **III.9** chỉnh sửa / hoàn tác / lịch sử như nguyên tắc chung (FB-4-16).
5. **Phần XI** Công việc overhaul toàn diện: XI.1 bố cục, XI.2 phân vai với Tổng quan, XI.3 panel, XI.4 hệ panel, XI.5 nút Phân công, XI.6 panel che đầu mục (FB-4-17…22). Trước đó chỉ có ảnh v0-3 (GV) và mã PTA tự tìm (CV-01…33).
6. **Phần XII** việc TVV + workflow vi phạm (FB-4-23, FB-4-24).
7. **Phần XIII** sửa sau lưu, hard lock, lịch sử + duyệt (FB-4-25…27).
8. **Phần XIV** MT: dời / huỷ / khôi phục, bảng trạng thái, phân biệt các loại huỷ (FB-4-28, FB-4-29).
9. **Phần XV** rà theo vai và hành trình (FB-4-30).
10. **GĐ5 "xuyên đêm nếu môi trường cho phép"** (FB-4-08) — đối chiếu 9.1-2 ở 02 X-09.
11. Chi tiết nhỏ mới ở đề mục cũ: V.3 "không đổi logic xác định việc" · V.4 "ưu tiên lớp đang mở hay bộ lọc" · VI.6 "không kết luận khi thiếu bằng chứng" · VII "nối GVCN → TVV" · XI.7 "làm lại panel sau khi bỏ Excel".
12. **Sau MP (21/10):** GVCN thu hồi lần xử lý vi phạm đã lưu / xử lý không tăng bậc → gửi QL duyệt, bắt buộc lý do (FB-4-34) — một bước duyệt bắt buộc mới, chạm luật 1 (việc TVV đã sinh) và quyết định 13/10 (02 X-49…X-51).
13. **Sau MP (21/10, agent v4d):** tạo Case **nhiều kỹ năng trong một panel** (FB-4-35, A — mỗi kỹ năng vẫn một Case) · chuông / nhắc việc "như Base" cho GV không bỏ sót việc (FB-4-36, B — góp ý GV trung tâm) — 02 mục 2.8, X-71…X-74; 05 mục 2.7, 7.1b.
14. **Vòng phê duyệt cuối (21/10):** chủ SP trả lời 17/17 câu + đồng ý gói PTA tự quyết; **sửa luật 4** (FB-4-37, FB-4-38), thêm luật **việc TVV + hạn** (FB-4-39) và **S chéo không cần lớp** (FB-4-40); giữ tên "Cần làm" (FB-4-41); Chấm Test "vẽ mockup, tôi duyệt sau" (FB-4-42) — 02 mục 2.9, X-75…X-81.
