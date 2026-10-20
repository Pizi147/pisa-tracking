# 02 · Conflict & Decision Log — xung đột, quyết định, câu hỏi (vòng 4 · 21/10/2026)

> **Trạng thái.** Bản trình chủ SP cho **vòng duyệt cuối** (MP I GĐ4). Đã gộp 3 báo cáo nghiên cứu vòng 4 — [`v4a`](../2026-10-20-danh-gia-ux/v4a-cong-viec.md) Công việc · [`v4b`](../2026-10-20-danh-gia-ux/v4b-nghiep-vu.md) nghiệp vụ · [`v4c`](../2026-10-20-danh-gia-ux/v4c-vai-tro-phu-web.md) vai + phủ web — và hướng PTA Plan đã quyết 21/10. **21/10: chủ SP đã trả lời 17/17 câu + đồng ý cả gói PTA tự quyết** — dòng "Chủ SP chọn (21/10)" dưới từng câu ở mục 5; quyết định mới ở mục 2.9 (gồm **luật 4 sửa 21/10**); xung đột mới X-75…X-81.
> **Mục đích.** (1) Ghi mọi quyết định đã chốt (mục 2). (2) Chỉ ra chỗ hai nguồn nói khác nhau và bên nào thắng (mục 3). (3) Gom MỌI câu hỏi đang mở — 9.2 ×38, 10.7 ×12, 11.8 ×18, 12.9 ×22, MP + 21/10 ×33, báo cáo vòng 4 ×18 — và phân loại: đã trả lời / gộp / PTA tự quyết / PHẢI HỎI (mục 4). (4) Rút gọn còn **17 câu PHẢI HỎI** cho vòng duyệt cuối (mục 5).
> **Cách đọc.** Chủ SP đọc **mục 0**, **mục 5** (17 câu, 5 nhóm, mỗi câu có khuyến nghị) và **mục 4.7 A + B** (PTA tự quyết có đảo cái cũ hoặc diễn giải luật — chỉ cần phản đối mục không đồng ý). Mục 1–4 để tra nguồn.
> **Bộ tài liệu.** [`00-muc-luc.md`](00-muc-luc.md) · [`01-feedback-register.md`](01-feedback-register.md) (mã FB, HT, quyết định trước 20/10 ở mục 4) · **02 (tệp này)** · [`03-ux-ui-audit.md`](03-ux-ui-audit.md) · [`04-design-system.md`](04-design-system.md) · [`05-ia-workflow.md`](05-ia-workflow.md) · [`06-mockup-gap.md`](06-mockup-gap.md) · [`07-pr-plan.md`](07-pr-plan.md) · tài liệu chính [`../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md`](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md) (mục 9.1, 9.2, 10.0, 10.7, 11.0, 11.8, 12.0, 12.9) · phụ lục [`../2026-10-20-danh-gia-ux/`](../2026-10-20-danh-gia-ux/).
> **Ký hiệu.** MP = master prompt cuối của chủ SP · V1/V2/V3 = vòng góp ý 1/2/3 · L1–L5 = 5 luật đã chốt (L1–L4 MP Phần II 20/10; L5 lời chủ SP 21/10 — bản nháp gọi "21/10-YT") · X-nn = dòng xung đột · Q-xx = câu PHẢI HỎI (giữ mã bản nháp để 01 dẫn đúng; Q-D2 đã chuyển PTA tự quyết) · v4a-Qn, v4b-Qn, v4c-Qn = câu hỏi trong báo cáo nghiên cứu vòng 4 · FB-x-nn, HT-nn = mã ở 01. Soạn: agent d1 (bản nháp) + d5 (hoàn thiện vòng 4), Opus 5.5, cho PTA Plan.

---

## 0. Tóm tắt cho chủ SP

0. **Trạng thái (21/10): đã trả lời 17/17 câu + đồng ý cả gói PTA tự quyết (4.7).** Chủ SP **sửa luật 4** (MT cũ "-" = huỷ ngay · đếm theo tuần · Khôi phục = được dời 2 lần · QL duyệt thêm = +1 · Hoàn tác 10 s) và thêm 2 luật: **việc TVV + hạn** (Q-A3) · **GV có kỹ năng S chấm chéo kể cả không dạy lớp nào** (Q-C1) — mục 2.9. **Còn chờ:** mockup Chấm Test (Q-C1 — chủ SP duyệt sau khi vẽ) và các mockup màn mới (06 mục 4).
1. **Đã chốt, không hỏi lại — 54 quyết định:** 5 luật nghiệp vụ (L1–L4 ngày 20/10 + **L5 ngày 21/10**: GVCN thu hồi lần xử lý / xử lý không tăng bậc → gửi QL duyệt, lý do bắt buộc; **L4 phần MT cũ đã thay 21/10**) + 4 câu 9.1 + 27 quyết định vòng 1–3 + **yêu cầu 21/10 "Tạo Case nhiều kỹ năng trong một panel"** (mục 2.8) + **17 quyết định vòng phê duyệt cuối 21/10** (mục 2.9). Mã đang **lệch 4/5 luật** (L1, L3, L4, L5; L2 đi cùng L1) + lệch luật mới "Cập nhật kết quả thi thật" (nay GVCN, có hạn — X-80) → "lệch phải sửa", không hỏi lại.
2. **81 dòng xung đột** (51 cũ + 19 mới vòng 4 + 4 bổ sung 21/10 — X-71…X-74 + **7 dòng câu trả lời 21/10 — X-75…X-81**): 80 đã phân xử; còn **X-08** chờ duyệt mockup Chấm Test. Lớn nhất: luật 4 ↔ "-" thành "Không dự thi" (X-05, X-54) · luật 3 ↔ khoá R11 (X-04) · luật 1 chưa có + thiếu dữ liệu TVV (X-52, X-27) · phân vai Tổng quan ↔ Công việc (X-07, X-40) · mockup ba khối chấm Test (X-08).
3. **Sổ câu hỏi 148 câu** (gồm 7 câu v4d 21/10 — mục 4.5c) → (1) đã trả lời / hết hiệu lực **37** · (2) gộp **39** · (3) PTA tự quyết **55** · (4) PHẢI HỎI **17 — đã trả lời hết 21/10** (mục 4.6).
4. **17 câu PHẢI HỎI, 5 nhóm** (mục 5): Phát hành + trang theo vai (4) · Vi phạm + việc TVV (3) · Luật 3–4, chỉ biên (4) · Test, Lịch thi, Báo cáo (4) · Định nghĩa số + xuất (2). **Chủ SP chọn khuyến nghị ① ở 12 câu** + Q-A4 (① nhưng giữ tên "Cần làm"); **khác ①:** Q-A3 (luật mới việc TVV), Q-B3 + Q-B4 (sửa luật 4), Q-C1 (vẽ mockup, duyệt sau + luật S chéo).
5. **PTA tự quyết: 55 câu ở sổ + 63 mục liệt kê đủ ở 4.7** — **A: 20 mục đảo quyết định / mockup / phương án cũ** · **B: 16 mục diễn giải luật** (gồm hạn 5 ngày = hết 23:59 ngày lưu + 4; không Hoàn tác sau lưu xử lý) · C: 27 mục UX mới (21/10 thêm A20, B16, C21–C23: Case nhiều kỹ năng + chuông / nhắc việc; C24–C27: trang đầu Head tutor / Admin VP, QL thu hồi thẳng có lý do, Case nhiều kỹ năng không cần mockup riêng). **Chủ SP 21/10: đồng ý cả gói.**
6. **Không theo** khuyến nghị v4b Q1 ("sinh việc TVV khi GVCN ghi Đã thực hiện"): luật 1 thắng — việc sinh ngay khi GVCN lưu, kể cả khi đang chờ QL duyệt. Chỉ hỏi biên QL từ chối / duyệt thu hồi (Q-D1).

---

## 1. Thứ tự nguồn khi mâu thuẫn (áp cho mục 3)

1. **5 luật đã chốt: L1–L4 (MP Phần II, 20/10) + L5 (21/10)** — không hỏi lại. Mã hoặc Rulebook khác → ghi **lệch phải sửa**. Chỉ hỏi tình huống biên luật chưa nói. Khuyến nghị của báo cáo nghiên cứu trái luật → không theo (vd v4b Q1 — X-53).
2. **Lời chủ SP mới hơn thắng lời cũ hơn khi nói về cùng một điều** (MP 20/10 khuya ≈ V3 > V2 > V1 > 9.1 > quyết định trước 20/10). Hai lời cùng mức mà khác nhau → hỏi.
3. **Luật nghiệp vụ, quyền, bảo mật, chống mất dữ liệu** (Rulebook đã chốt, quyết định nghiệp vụ) — mockup và kế hoạch không thắng được (9.1-1, MP 0).
4. **Khung mockup đã duyệt** thắng câu kế hoạch và luật / quyết định giao diện cũ hơn ngày duyệt; quyết định mới hơn trái khung → sửa mockup (9.1-1).
5. **Kế hoạch, đặc tả, DESIGN.md, phần giao diện của CLAUDE.md** ("bố cục đã khoá", "sửa trên nền có sẵn") — MP 0 cho phép thay khi cản chất lượng.
6. **Skill.**
- **Đề xuất PTA (loại C) — kể cả khuyến nghị của báo cáo v4a / v4b / v4c — không bao giờ thắng lời chủ SP.** PTA chỉ tự quyết phần thẩm mỹ / UX (MP I GĐ1.5: "câu chỉ thẩm mỹ thì tự đề xuất"); chỗ luật cho phép làm rõ (giờ hết hạn L2) hoặc chữ luật chưa nói rõ → PTA ghi cách hiểu ở 4.7 B để chủ SP phản đối nếu sai; mọi thứ khác chạm nghiệp vụ, quyền, định nghĩa số, định hướng lớn → hỏi.
- `CLAUDE.md` mục "Khi các nguồn mâu thuẫn" hiện còn đặt kế hoạch trên mockup → sửa theo 9.1-1 ở GĐ0 (PR QT-UX, luật Q6) — X-10.

---

## 2. Quyết định đã chốt

### 2.1 Năm luật nghiệp vụ — **ĐÃ CHỐT, không hỏi lại** (L1–L4 nguyên văn ở 01 mục 1; L5 ở 01 FB-4-34)

| Mã | Nội dung (tóm tắt) | Ngày | Nguồn | Trạng thái | Hiện trạng mã (đã kiểm v4b, v4c) |
|---|---|---|---|---|---|
| L1 | GVCN lưu xử lý vi phạm → **ngay** sinh việc TVV ghi nhận kết quả; không đợi duyệt khác | 20/10 | MP II.1, XII.2, XVI.A | **ĐÃ CHỐT** | **Chưa có** — TVV chỉ đọc Ý thức; demo 4/129 em có TVV, bản chính chưa gán → làm mới (X-52) |
| L2 | Hạn việc đó **5 ngày lịch** từ lúc GVCN lưu, gồm T7, CN; chỉ được làm rõ giờ hết hạn | 20/10 | MP II.2 | **ĐÃ CHỐT** | Chưa có (đi cùng L1) |
| L3 | Có quyền sửa → sửa được sau lưu, có lịch sử; giữ duyệt bắt buộc; không khoá cứng vô lý; không tự bỏ duyệt | 20/10 | MP II.3, III.9, XIII | **ĐÃ CHỐT** | **Lệch:** R11 (tái hiện trên demo — X-04), khoá MT cũ 7 ngày, "Huỷ điểm" mất nhận xét, không có Khôi phục (X-56) |
| L4 | MT, cùng chuỗi dời: "-" lần 1 → dời tuần tiếp theo; lần 2 → huỷ; ~~áp cả lịch MT tuần cũ~~ (**phần MT cũ ĐÃ THAY 21/10**: MT cũ "-" = huỷ ngay — 2.9 21/10-L4); MT hiện tại giữ gửi duyệt; lập bảng chuyển trạng thái | 20/10 · **sửa 21/10** | MP II.4, XIV.2; chủ SP 21/10 (Q-B4) | **ĐÃ CHỐT** (bản sửa 21/10) | **Lệch:** "-" ở MT cũ (X-05) và "-" ghi sau tuần thi ở MT hiện tại (X-54) đều thành "Không dự thi"; bảng 12 trạng thái × 30 chuyển: v4b Phần B |
| **L5** | GVCN **thu hồi** một lần xử lý đã lưu, hoặc **xử lý không tăng bậc** → **gửi QL duyệt, lý do bắt buộc** (bước duyệt bắt buộc mới, khớp L3) | **21/10** | lời chủ SP qua PTA Plan (FB-4-34) | **ĐÃ CHỐT** | **Lệch:** GVCN xoá thẳng (`xoaXuLy`, `server/src/yThuc/xuLy.ts:622-638`); **thiếu** đường "không tăng bậc" (bậc kế máy điền, `xuLy.ts:185`) (X-49) |

### 2.2 Hướng làm đã quyết theo 5 luật (PTA Plan 21/10 — không hỏi lại; biên đã trả lời 21/10 ở mục 5)

| Luật | Hướng làm | Còn hỏi |
|---|---|---|
| L1 | Việc TVV sinh **ngay khi GVCN (hoặc QL thay) lưu**, kể cả lần xử lý đang chờ QL duyệt (WL 3, ngoài thang, không tăng bậc) — **không theo** khuyến nghị v4b Q1 "sinh lúc Đã thực hiện" (X-53). Trước khi bật: **gán TVV** cho em (bước trong 07) | Đã trả lời 21/10: Q-D1 ① · Q-D3 ① · Q-A1 ① (Tổng quan TVV) · Q-A3 → luật mới (2.9 21/10-TVV) |
| L2 | Hết **23:59 giờ VN ngày (lưu + 4)**, tính cả ngày lưu; vd lưu T2 14/09 10:00 → hết 23:59 T6 18/09 | Không (4.7 B1 — chủ SP đồng ý gói 21/10) |
| L3 | Gỡ R11 cho GVBM sửa đúng ô của mình (`server/src/normal/regular.ts:631-643`), có lịch sử, không thêm duyệt (ở đây không có bước duyệt bắt buộc nào); bỏ khoá MT cũ 7 ngày; "Huỷ điểm" không xoá nhận xét + "Khôi phục điểm"; Tutor sửa nhận xét quá 24 giờ | Đã trả lời 21/10: Q-B1 ① (giữ khoá đóng hồ sơ) · Q-B2 ① (sửa phần đã duyệt → duyệt lại) |
| L4 | **Theo luật 4 sửa 21/10 (2.9 21/10-L4):** MT hiện tại "-" lần 1 → dời tuần kế (máy không tự dời được → thẻ "Dời lịch Test" gửi QL), **đếm theo tuần**, lần 2 → huỷ; "-" ghi muộn (sau tuần thi, < 2 tuần) → tuần kế **của lịch** nếu còn thi được, không thì thẻ QL; **MT cũ "-" → huỷ ngay**; Khôi phục = được dời 2 lần; QL duyệt thêm = +1; Hoàn tác 10 s; bỏ "Không dự thi ngay" của chốt 11/10; MT0 theo L4 trong giới hạn MT0 | Đã trả lời 21/10 (Q-B3, Q-B4 → 2.9) |
| L5 | Thu hồi được duyệt → trạng thái **"Đã thu hồi"**, giữ dòng + lịch sử (không xoá); bỏ đường xoá thẳng `xoaXuLy` của GVCN; "không tăng bậc" dùng lại đường "Đề xuất QL duyệt" sẵn có; bấm nhầm ngay sau lưu cũng đi Thu hồi qua QL (không Hoàn tác) | Không (biên việc TVV → Q-D1) |

### 2.3 Bốn câu 9.1 (20/10 — chủ SP chốt cả bốn theo khuyến nghị)

| Mã | Nội dung | FB |
|---|---|---|
| 9.1-1 | **Khung mockup đã duyệt thắng** câu kế hoạch và luật cũ hơn ngày duyệt, trừ luật nghiệp vụ, quyền, chống mất dữ liệu; quyết định mới trái khung → sửa mockup | FB-0-14 |
| 9.1-2 | PR **đổi bố cục**: chủ SP duyệt 3–5 ảnh cặp mockup ↔ web (hoặc bản chạy) **trước khi merge**; không merge loại này qua đêm; PR chỉ máy chủ vẫn tự merge | FB-0-14, FB-4-08 |
| 9.1-3 | **Sửa GĐ1** (số liệu + lỗi chức năng) rồi mới deploy | Q-E1 |
| 9.1-4 | **Một phạm vi số cho cả trang** (công tắc Tất cả / FT / LT áp cả Tổng quan, bỏ "gộp hai khung") + **một định nghĩa "SOS hiện tại"** cho Tổng quan · Học viên & Lớp · Báo cáo (danh sách SOS 8 tuần sang Phân tích) | FB-0-01, FB-0-09 |

### 2.4 Vòng 1 (20/10 tối — tài liệu chính 10.0)

| Mã | Nội dung | FB |
|---|---|---|
| V1 I.1 | Tăng cỡ chữ, phân cấp rõ, nhất quán; PTA tự chọn phông (tiếng Việt đúng); không đánh đổi khả năng đọc | FB-1-01 |
| V1 I.2 | Thứ tự menu: Tổng quan → Lớp/HV → Test → Công việc → Phân tích → Tutor | FB-1-02 |
| V1 I.3 | Tô màu chính con số điểm, mọi chỗ có điểm | FB-1-03 |
| V1 II.2 | Hướng: không phải số nào cũng bấm; đã bấm thì phải làm được việc | FB-1-05 |
| V1 II.2.1 | Nguyên tắc toàn web: làm được tại chỗ thì làm tại chỗ (không bỏ mọi panel) | FB-1-06 |
| V1 II.3 | Overhaul SOS: vùng bấm, hiển thị, tương tác, panel (yêu cầu) | FB-1-07 |
| V1 II.4 | **Bỏ khối Trễ chấm khỏi Tổng quan** | FB-1-08 |
| V1 II.5 | Thiết kế lại từ đầu "Việc hôm nay" (yêu cầu) | FB-1-09 |
| V1 II.6 | Rà hover toàn web (yêu cầu) | FB-1-10 |

### 2.5 Vòng 2 + Vòng 3 (20/10 khuya — tài liệu chính 11.0, 12.0)

| Mã | Nội dung | FB |
|---|---|---|
| V2 I.1 | Bộ lọc thời gian chỉ **Tuần bắt đầu → Tuần kết thúc**, mặc định từng chỗ, toàn web; logic đặc thù xét riêng | FB-2-01 |
| V2 I.2 | "Tuần thi của kết quả" → **"Thời gian"** | FB-2-02 |
| V2 I.5 | **Thi** = kỳ thi thật · **Test** = MT, Progress, Final, Mini…; nhóm chung gọi Test | FB-2-05 |
| V2 I.6.2 | "Ghi chú họp" → **"Ghi chú"** | FB-2-07 |
| V2 I.6.3 | Tháng dự kiến + ngày thi; đến tháng: chọn ngày hoặc dời tháng; giữ tháng chưa ngày → trạng thái riêng + việc "chốt ngày thi" **không hạn**; A "Đã chốt ngày" / B "Chưa chốt ngày" | FB-2-08 |
| V2 I.7 + II.4 | Ô điểm, bảng lệch: sửa **triệt để ở cấp hệ thống** | FB-2-09, FB-2-14 |
| V2 II.1 | Lưới Điểm MT **gập** mặc định; "Nhập điểm" cuộn tới + mở để nhập trực tiếp; **không panel phải** | FB-2-11 |
| V2 (yêu cầu) | Làm lại: Cần làm (I.3), Lịch thi (I.6.1), mọi bảng Hồ sơ lớp (II.1), Ý thức / Phối hợp lớp (II.2–II.3) + HV (III.1) | FB-2-03, 06, 10, 12, 13, 16 |
| V3 I.1 | Màu trên con số (trùng V1 I.3); không đổi luật phân loại | FB-3-01 |
| V3 I.2 | Nhận xét Test lớp thường **tuỳ chọn**, nằm **trong hộp chấm** | FB-3-02 |
| V3 I.3 | Sửa triệt để lệch tiêu đề ↔ dữ liệu toàn hệ thống | FB-3-04 |
| V3 I.5 | Bỏ nhập điểm bằng Excel, **giữ duy nhất theo lớp × từng MT**; xuất là việc riêng | FB-3-06 |
| V3 II.1.1 | Bỏ gạch chân chấm chấm dưới chỉ số | FB-3-07 |
| V3 II.1.3 | Chỉ số bấm được → đúng dữ liệu, đúng ngữ cảnh, đúng mục đích (toàn hệ thống) | FB-3-09 |
| V3 II.2 | Báo cáo sửa theo mockup đã duyệt | FB-3-10 |
| V3 II.3 | Báo cáo thuần, không lồng việc; chỉ bảng theo dõi việc mới có quá hạn | FB-3-11 |
| V3 II.5 | Thời gian Phân tích chỉ **"Toàn bộ" + "Chọn khoảng tuần"** | FB-3-13 |
| V3 II.6 | Sửa lỗi bộ chọn tự đóng | FB-3-14 |

Quyết định trước 20/10 còn hiệu lực / đã bị thay: xem 01 mục 4 (59 dòng, mã gốc).

### 2.6 MP XVI.A (16 mục "đã chốt") → đối chiếu

| # | Mục XVI.A | Trùng quyết định | Ghi chú |
|---|---|---|---|
| 1 | Thứ tự 6 tab | V1 I.2 | — |
| 2 | Cỡ chữ / typography; màu trên con số | V1 I.1, I.3; V3 I.1 | — |
| 3 | Sửa tận gốc căn bảng + clipping toàn hệ thống | V2 I.7 + II.4; V3 I.3 | — |
| 4 | Bộ lọc tuần đơn giản; Phân tích có Toàn bộ / Chọn khoảng tuần; thi thật giữ tháng / ngày | V2 I.1; V3 II.5 | MP III.8 thêm "**riêng** Phân tích" → X-06 |
| 5 | Thi ↔ Test; "Thời gian"; "Ghi chú" | V2 I.5, I.2, I.6.2 | — |
| 6 | Bỏ Trễ chấm | V1 II.4 | — |
| 7 | Nhập điểm MT tại Hồ sơ lớp (gập, cuộn + mở, không panel) | V2 II.1 | — |
| 8 | Nhận xét lớp thường tuỳ chọn, trong hộp chấm | V3 I.2 | thay HD2 → X-02 |
| 9 | Bỏ nhập Excel trừ theo lớp × từng MT | V3 I.5 | — |
| 10 | Bỏ gạch chấm ở Phân tích | V3 II.1.1 | — |
| 11 | Báo cáo không lẫn việc; xem / xuất đúng mục đích | V3 II.3 (+ II.4 xuất) | — |
| 12 | Tháng thi: chọn ngày hoặc chuyển tháng; chưa chốt ngày → trạng thái riêng + việc không hạn | V2 I.6.3 | — |
| 13 | GVCN lưu xử lý → việc TVV ngay; hạn 5 ngày lịch | L1, L2 | giờ hết hạn: 4.7 B1 |
| 14 | Có quyền thì sửa sau lưu, có lịch sử; giữ duyệt | L3 | + L5 (21/10) |
| 15 | MT "-" lần 1 dời, lần 2 huỷ; MT hiện tại gửi duyệt | L4 | **sửa 21/10:** MT cũ "-" = huỷ ngay; đếm theo tuần; Khôi phục = 2 lần (2.9) |
| 16 | Chỉ triển khai sau phê duyệt cuối | MP I; 9.1-3 | — |

### 2.7 MP XVI.B (chưa chốt) và XVI.C (cần kiểm chứng) → đi đâu

21/10: mọi câu Q-xx dưới đây đã có câu trả lời (mục 5, 2.9); riêng Q-C1 chờ chủ SP duyệt mockup Chấm Test.

| XVI.B — phương án chưa chốt | Đi đâu |
|---|---|
| Thêm PA inline tại hàng HV; kiểu inline / panel thay thế | PTA tự quyết: áp ở bảng rộng, danh sách hẹp dùng khung phải (X-39; 4.7 A14) |
| Tổng quan: hộp duyệt trên, danh sách trái, chi tiết phải | Q-A2 (cùng Q-A1) |
| Xuất Excel HV: bỏ checkbox hay chọn gọn | Q-E2 |
| Bảng "Cần làm": cột, nhóm, hành động | Q-A4 → chủ SP 21/10: bộ lọc trong bảng Tất cả, **giữ tên "Cần làm"** |
| Hiển thị Sắp thi / Đã chốt ngày / Chưa chốt ngày | PTA tự quyết (04, 05) + biên luật ở Q-C3 |
| Cấu trúc Ý thức / Phối hợp lớp + HV | PTA tự quyết (11.3 A, 11.4) + mockup duyệt |
| Cải thiện 3 khung chấm Test, chống chấm nhầm tuần | Q-C1 |
| Panel Phân tích: chỉ đọc / hành động / kết hợp | PTA tự quyết (L1 + panel C) + mockup duyệt |
| Nâng cấp mockup Báo cáo | Q-C2 |
| Gộp Hiệu quả PA + Tổng hợp vấn đề HV | PTA tự quyết (H2) + mockup + xin dữ liệu |
| Đơn giản hoá Tutor | PTA tự quyết (F1 + B1) + xin dữ liệu |
| Chi tiết việc TVV xử lý vi phạm (form, trạng thái, bàn giao) | Q-D1, Q-D3, Q-A3 + PTA (hạn, phạm vi, tên, form — 4.7 B1–B3, B15, A15, A17, A18, C10) |
| Chi tiết UI + trường hợp đặc biệt MT, lịch sử / khôi phục | Q-B1…Q-B4 (đã trả lời — luật 4 sửa 21/10) + PTA (bảng 13 trạng thái × 31 chuyển ở 05 mục 4.3, từ v4b Phần B; 4.7 B8–B11, C9) |

| XVI.C — cần kiểm chứng | Trạng thái |
|---|---|
| Nút chỉ "nháy" ở Tổng quan | **Đã kiểm: lỗi thật** (A1-01, hai nơi chung khoá panel) |
| Hover trùng cấp; ⋯ bị clipped ở Test | **Đã kiểm** (10.1: ΔL 2,8–4,5) · ⋯ không bị cắt mà **đè 41 % ô "tổng"** (12.1) |
| Lỗi bất thường ảnh 5 Hồ sơ lớp | **Đã kiểm bằng mã** (11.1e: `case` trùng, Ghi nhận một em bị đổi trang); còn bấm thử |
| Nút Phân công sai ngữ cảnh; panel che đầu mục | **Đã kiểm (v4a):** "Phân công…" là lỗi gốc — web đoán "chưa có người" từ `ownerId null`, mở phân công cả lớp, không đường ghi chủ Case → việc không bao giờ xong (V4A-05, X-63); che đầu mục = lỗi lưới CSS `WorkList.tsx:148`, cột tiêu đề co 0 px, không phải z-index (V4A-06, X-62) |
| Date / week picker tự đóng | **Đã kiểm** (12.7: lịch vẽ qua portal; 4 chỗ bị) |
| Hard lock Progress Test + tương tự | **Đã kiểm + tái hiện demo** (v4b V4B-04: GV 20 / 21, MB FOU 14); rà 29 khoá: nới 11 · giữ 15 · đã nới 2 · ngược (thiếu duyệt) 1 (V4B-05); **sau Q-B1 ① (21/10): nới 9 · giữ 17** (H03, H21 giữ) |
| Gốc bảng / cột liên tục lệch | **Đã kiểm** (11.1a R1–R8; 12.1) |
| Workflow Tutor khi thiếu dữ liệu | **Cần dữ liệu thật** (mục 4.8) |
| Nghĩa "Cần xác nhận" | **Đã kiểm mã**: đầu ra = chưa có kết luận; ý định = "đã bàn, chờ xác nhận" → Q-C4 |

### 2.8 Yêu cầu chủ SP 21/10 sau MP (ngoài 5 luật) — agent v4d

| Mã | Nội dung | Ngày | Nguồn | Trạng thái | Hiện trạng mã (đã kiểm v4d) |
|---|---|---|---|---|---|
| 21/10-CASE | GV chọn được **nhiều kỹ năng** khi tạo Case, tạo **cùng lúc trên một panel** (nhiều GV dạy 2 kỹ năng một lớp). Luật Case giữ nguyên: **mỗi kỹ năng một Case** (một em × một hạng mục), mỗi Case tên + mô tả + nhóm nguyên nhân bắt buộc, người phụ trách = GV dạy kỹ năng đó, hạn PA theo mức, trùng hạng mục → gợi ý ghi vào Case đang có (7.13); tạo Case = QL + mọi GV có phân công trong lớp, mọi môn (Rb §20.9) | 21/10 | lời chủ SP (FB-4-35) | **ĐÃ CHỐT** (yêu cầu; cách làm PTA tự quyết — 4.7 B16, C21) | **Chưa có:** chip kỹ năng chọn một (`web/src/modules/cases/QuickReport.tsx:400-412`), `POST /cases/report` nhận một `topic` (`server/src/cases/cases.ts:463-739`); kèm lỗi "+ Case cho {kỹ năng}" mở form không chọn sẵn kỹ năng (`web/src/modules/students/StudentDetailPage.tsx:334`) — X-73, X-74 |

Ý thứ hai cùng ngày (FB-4-36 — chuông / nhắc việc "như Base", góp ý GV trung tâm qua chủ SP) là **B, chưa chốt** → không vào bảng này; xử lý ở X-71, X-72, 4.7 A20, C22, C23 và 05 mục 2.7.

### 2.9 Vòng phê duyệt cuối 21/10 — chủ SP trả lời 17 câu + gói PTA (17 quyết định mới; nguyên văn ở mục 5; FB-4-37…42)

Lời chủ SP 21/10 là lời mới nhất → thắng mọi đề xuất cũ, kể cả khuyến nghị PTA và **luật 4 ngày 20/10 phần MT cũ**.

| Mã | Quyết định | Thay / đổi gì | Nơi làm |
|---|---|---|---|
| **21/10-L4** (Q-B3, Q-B4 + 3 câu xác nhận) | **Luật 4 sửa — 6 ý:** (1) **MT hiện tại** (tuần thi chưa qua 2 tuần): "-" lần 1 → dời tuần kế (tự động; không dời được → thẻ gửi QL duyệt như cũ). **Đếm theo tuần:** trong cùng một tuần, sửa / gõ lại "-" không tính thêm lần (chốt T2 như hiện nay); chỉ "-" ở tuần đã dời tới mới là lần 2 → huỷ. "-" ghi muộn (sau tuần thi, < 2 tuần) → tuần kế **của lịch** nếu còn thi được, không thì thẻ QL · (2) **MT cũ** (lịch kỹ năng xếp vào tuần đã qua ≥ 2 tuần — giữ ranh giới mã hiện tại): "-" → **huỷ ngay** · (3) **Khôi phục** (QL bấm, mọi MT): chuỗi **đặt lại từ đầu = được dời 2 lần** (không nhớ "-" trước) · (4) **QL duyệt cho dời thêm 1 lần** (thẻ dời): chỉ **+1 lần**; vắng tiếp → huỷ · (5) **Gõ nhầm:** Hoàn tác 10 s ngay sau khi gõ; quá 10 s **vẫn khôi phục được — không khoá cứng**; PTA diễn giải (L3): **người có quyền sửa ô** (gồm GV đã gõ) khôi phục, có lịch sử, QL nhận chuông "để biết" — chủ SP sửa nếu muốn chỉ QL · (6) lớp thường "-" (OV-11a, Progress / Final) không đổi | **Thay L4 20/10 phần MT cũ** (bỏ câu "không tự hiểu '-' đầu tiên là huỷ vì lịch cũ"); Q-B3 hết hiệu lực cho MT cũ; khuyến nghị PTA Q-B3 ①, Q-B4 ① không theo (X-75…X-78). Dữ liệu "Không dự thi" cũ của MT cũ hiện như **"Đã huỷ"** (giữ bản ghi, khôi phục được). PTA kiểm: không còn xung đột với L3 (Hoàn tác + khôi phục, có lịch sử); "MT hiện tại giữ gửi duyệt" giữ; lớp thường không đổi | 05 mục 4; 07 LUAT-34 |
| **21/10-TVV** (Q-A3) | TVV của em giữ **4 việc**: Chốt ngày thi · Chọn bước tiếp sau thi · Bổ sung hồ sơ thiếu · **Cập nhật kết quả thi thật** (chuyển từ GVCN lớp cuối). **Không hạn**, trừ **Chọn bước tiếp sau thi: hạn 1 tuần** (mốc: từ khi có kết quả thi thật — PTA diễn giải; khớp hạn `buoc_tiep` đang chạy = ngày có kết quả + 7). "Báo PH kết quả Test lớp thường" **không** chuyển — giữ như nay. Em không có TVV → QL chi nhánh giữ (Q-D3). Việc "Ghi kết quả xử lý vi phạm" vẫn hạn 5 ngày lịch (L2) | "Cập nhật kết quả thi thật": GVCN lớp cuối, có hạn → TVV, không hạn (lệch mã — X-80); khuyến nghị PTA ① (giữ GVCN, thêm Báo PH lớp thường) không theo | 05 mục 1.4; 07 GĐ1b SV-TVV-VIEC |
| **21/10-SCHEO** (Q-C1, ý sau) | **GV có dạy kỹ năng Speaking — kể cả không dạy lớp nào — được chấm chéo Speaking.** PTA diễn giải: = GV có kỹ năng S trong hồ sơ GV (`user_skills`, Quản trị › Kỹ năng); phạm vi = chi nhánh của GV; thấy nhóm "Chấm Speaking chéo"; T18 phần khác giữ (không tính nợ GVBM S / GVCN; người nhập muộn bị tính trễ) | Thay câu "chỉ GV có phân công S" ở 03 AU-41, 05 3.2 / 3.4 (X-79). **Đã kiểm mã 21/10: luật này đã chạy** từ OV-14c (18/10) — `laGvSpeaking` gồm kỹ năng hồ sơ (`server/src/permissions.ts:289-297`), phạm vi = chi nhánh của grant GV (`:281-287`), việc Công việc đọc cùng hàm (`server/src/worklist/mywork.ts:380`), phép kiểm `prOv14c.tests.ts` OV14c-2, OV14c-10 → **không cần PR máy chủ mới**; chỉ giữ khi làm SV-M2 / M5 | 05 3.4; 07 SV-M2 |
| **Q-A4** | Góc Cần làm = **bộ lọc trong bảng Tất cả** (cột Việc · Người phụ trách · Hạn, quá hạn trước, cùng hàm đếm với Công việc) — **giữ tên "Cần làm"** | khuyến nghị đổi tên "Có việc" không theo (X-81) | 05 1.5; 07 M4 |
| Q-E1 ① | GĐ1 trước deploy = số liệu, lỗi chức năng, bộ chọn tuần, lịch thi, Thi / Test, luật 3–4–5, nền bảng + lưới điểm; việc TVV ở GĐ1b ngay sau deploy | — | 07 mục 4, 5 |
| Q-A1 ① | Việc của tôi ở trang đầu vai (GV: Công việc; QL / QT / Admin VP / TVV / CX: Tổng quan; Head tutor: Tutor — 4.7 C24); Công việc QL = theo dõi việc GV + giao việc; TVV **không** thêm mục Công việc | — | 05 1.2–1.4 |
| Q-A2 ① | Bố cục B: một hàng đợi trái / chi tiết phải, Chờ duyệt là nhóm đầu | phương án A (MP IV.8) không làm (X-40) | 05 2.1 |
| Q-D1 ① | Việc TVV đã sinh mà QL từ chối / GVCN rút / thu hồi được duyệt: TVV chưa ghi → tự huỷ kèm lý do; đã ghi → giữ + nhãn + chuông "để biết" | — | 05 5.3, 5.10 |
| Q-D3 ① | Em không có TVV → QL chi nhánh giữ; TVV được "Kết thúc · không liên hệ được" (ghi chú bắt buộc, GVCN nhận chuông) | — | 05 5.7, 5.8 |
| Q-B1 ① | Giữ 3 khoá "vì đóng hồ sơ": lớp đã kết thúc chỉ QL sửa điểm · hồ sơ Lưu trữ khoá · sửa chữ KQ PA khi Case xong phải "Mở lại" (H21) | — | 05 6.2 |
| Q-B2 ① | Sửa đúng phần đã duyệt (loại PA, bậc, Target) → duyệt lại; sửa chi tiết → lưu thẳng + lịch sử | — | 05 6.4 |
| Q-C2 ① | Duyệt cả bốn: Chiếu · "bài chấm trễ trong kỳ" · bảng Theo chi nhánh · khối kết quả lớp thường | — | 05 7.3; 07 M6 |
| Q-C3 ① | Có tuần mà chưa ngày = "Chưa chốt ngày"; lớp thường chỉ chip, không sinh việc | — | 05 7.2; 07 LT-SV |
| Q-C4 ① | Bỏ "Cần xác nhận", hiện "Chưa kết luận" (lý do ở Ghi chú; dữ liệu cũ giữ) | — | 05 7.2 |
| Q-D4 ① | "Thiếu thông tin" = Ngày sinh · Email · Tuần bắt đầu · Target (FT) | 7 trường của mã → 4 (X-26) | 05 1.4; 07 SV-TVV-VIEC |
| Q-E2 ① | Bỏ ô tick khỏi bảng; bớt em trong panel Xuất | cột tick C31 / OV-15h2 (X-42) | 05 7.4; 07 M4 |
| 4.7 | **Đồng ý cả gói PTA tự quyết** (A 20 · B 16 · C 27) | mục A đảo quyết định / mockup cũ nay thành quyết định | 4.7 |
| *Q-C1 (trạng thái)* | "Cứ vẽ mockup cho lựa chọn 1 … tôi xem xong sẽ duyệt" → hướng "Chấm Test theo hạn, một nguồn" **CHƯA chốt hẳn**: PTA vẽ mockup (ưu tiên), chủ SP duyệt rồi mới làm M5 | ba khối 06/10 còn hiệu lực tới khi duyệt mockup (X-08) | 06 mục 4; 07 M5 |

---

## 3. Bảng xung đột

**[LỚN]** = 5 xung đột lớn nhất (X-07 + X-40 và X-27 + X-52 tính chung). "Hỏi" = Không (đã phân xử) hoặc mã câu ở mục 5. Dòng ghi "(v4)" đã cập nhật theo báo cáo vòng 4; X-52…X-70 là dòng mới (v4a, v4b, v4c).

| Mã | Phía 1 (cũ / nguồn) | Phía 2 (mới / nguồn) | Bên thắng — vì sao | Xử lý đề xuất | Hỏi |
|---|---|---|---|---|---|
| X-01 | C06 "số căn giữa" (chủ SP 18/10); OV-15a hiện thực bằng luật tên lớp `index.css:267` → lưới lệch 45–69 px | Mockup 6 khung 3 (duyệt 19/10): căn trái, ký hiệu ✓ / ✗ trước số, cột hẹp | Thẩm mỹ → PTA quyết; giữ ý chủ SP C06 + phần tốt của khung | Căn giữa theo kiểu cột, ký hiệu trước số, ô rộng cố định; bỏ `index.css:267`; sửa mockup 6 khung 3 | Không (4.7 A5) |
| X-02 | HD2 (11/10): lớp thường gõ thẳng đúng / tổng + nút Nhận xét riêng | V3 I.2 (20/10): nhận xét tuỳ chọn, nằm trong hộp chấm "khi bấm chấm điểm" | V3 — lời mới hơn | Gõ số trên ô = mở hộp chấm (Enter = em tiếp) để giữ tốc độ; 375 giữ ô to + "＋ Nhận xét" | Không (4.7 A3) |
| X-03 | 06/10: hộp Chờ duyệt luôn hiện mọi chi nhánh | 9.1-4: một phạm vi số cho cả trang; lỗi A1-02 (10 ≠ 12 thẻ, có thẻ BC / CP) | 9.1-4 | Thẻ theo chi nhánh của trang + dòng "n thẻ ở chi nhánh khác · Xem" (không giấu); badge thanh trên nếu giữ tổng thì ghi "mọi chi nhánh" | Không |
| X-04 **[LỚN]** | R11 (23/09) + Rulebook dòng 589, 600, 723: sau "đợt hoàn tất" GVBM không sửa điểm đã có, chỉ QL (`regular.ts:631-643`); MT cũ khoá 7 ngày (dòng 564) | L3 (20/10) + ảnh v4-4 (Progress Test chỉ còn "Lịch sử") | L3 — lệch phải sửa | (v4) Tái hiện trên demo (GV 20 / 21, MB FOU 14); không có bước duyệt nào (chỉ "nhờ QL hiệu chỉnh" ngoài web) → gỡ R11 + khoá 7 ngày cho GVBM đúng ô, lịch sử C22, không thêm duyệt; chip "Đã hoàn tất" → "Đủ điểm" | Biên → Q-B1, Q-B2 |
| X-05 **[LỚN]** | Plan 11/10 + T23 (06/10) + OV-1b (`shared/domain/vang.ts:10-15`) + Rulebook 744: "-" ở MT cũ = Không dự thi, không dời | L4 (20/10): áp cả lịch MT tuần cũ; "-" lần 1 dời, lần 2 huỷ | L4 — lệch phải sửa | Một hàm cho mọi cổng ghi vắng (gõ "-", nút Vắng, ⋯ Vắng); nút hộp chấm luôn "Vắng"; dữ liệu "Không dự thi" cũ giữ + liệt kê cho QL; tính lại cờ MT cũ sau khi dời; lớp thường giữ 14/10-Q1. (v4) Ca MT hiện tại ghi "-" sau tuần thi: X-54. **(21/10) Phần MT cũ thay bởi luật 4 sửa: MT cũ "-" = huỷ ngay (X-75)** | Không — đã trả lời 21/10 (Q-B3, Q-B4 → X-75…X-78) |
| X-06 | Đề xuất 12.7 / 12.9-17: "Toàn bộ" áp Phân tích + Tutor + Bộ lọc thêm + panel Xuất | MP III.8: "**riêng** trang Phân tích" có Toàn bộ / Chọn khoảng tuần | MP — lời mới | "Toàn bộ" chỉ 6 tab Phân tích (Phân tích GV phải nâng trần 13 tuần — đo tốc độ trước); Tutor chỉ khoảng tuần (mặc định 4 tuần); Bộ lọc thêm: thời gian là bộ lọc tuỳ chọn (không đặt = không lọc, ✕ để bỏ); Xuất = khoảng của trang gọi | Không |
| X-07 **[LỚN]** | Đề xuất 10.2 / 10.7-2: việc QL / QT phải quyết chỉ ở Tổng quan; Công việc QL chỉ còn việc của GV | MP XI.2: Tổng quan = nắm tình hình + xử lý nhanh; Công việc = quản lý / thực thi sâu (định hướng cần đánh giá, không mặc định) | Chưa phân — cả hai chưa chốt | (v4) v4a P1 làm rõ: "việc TÔI ở trang đầu của tôi"; Công việc QL = theo dõi việc GV + giao việc + lịch sử duyệt; nay 16/21 việc trùng hai trang | Q-A1 |
| X-08 **[LỚN]** | Mockup ba khối Lịch Test (duyệt 06/10) + T15 (05/10, luật chia khối) | Đề xuất 12.2 "Chấm Test theo hạn, một nguồn"; MP VIII.5 "giữ các quy tắc hiện có" | Luật chia khối giữ (nghiệp vụ); đổi tên / thứ tự / gom = đổi mockup đã duyệt + luồng chính → chủ SP quyết | Gom theo hạn, đúng luật T15, một nguồn với Công việc, "Tình trạng chấm" cho QL | Q-C1 → chủ SP 21/10: vẽ mockup ①, duyệt sau (**chờ mockup**) |
| X-09 | 9.1-2: không merge PR đổi bố cục qua đêm | MP GĐ5: PR liên tiếp, xuyên đêm nếu môi trường cho phép, không vượt cổng duyệt | Không xung đột thật — MP cũng cấm vượt cổng | Làm + mở PR xuyên đêm được; PR máy chủ tự merge; PR bố cục xếp hàng chờ chủ SP duyệt ảnh cặp | Không |
| X-10 | CLAUDE.md "Khi các nguồn mâu thuẫn": kế hoạch PR đã duyệt > mockup | 9.1-1: khung đã duyệt thắng kế hoạch / luật cũ hơn ngày duyệt | 9.1-1 | Sửa CLAUDE.md ở GĐ0 (QT-UX, Q6) | Không |
| X-11 | CLAUDE.md "tinh chỉnh, không làm lại; phông / màu / bố cục đã khoá"; 08/10 "sửa trên nền có sẵn"; DESIGN.md | MP 0 + V2 + V3: tự do overhaul, không viện dẫn component / CSS cũ | MP cho phần giao diện; 08/10 phần "đầu ra trước, ít bước" vẫn giữ | Sửa CLAUDE.md, DESIGN.md (Q7) ở GĐ0 | Không |
| X-12 | plan.md 1.3b: không `polish`, bấm thử một lần, mockup chỉ cho màn mới | Q8 + MP GĐ5: đối chiếu mockup, test luồng thật từng vai | MP cho PR làm lại màn; 1.3b giữ cho sửa nhỏ | Kế hoạch ghi "Loại PR" (07) | Không |
| X-13 | C09 (18/10): thang 12/13/14/16/20, ô bảng 13 | V1 I.1 + MP III.2: chữ quá nhỏ, xây lại thang | V1 | Thang mới ở 04 (PTA tự quyết) | Không |
| X-14 | C29 (18/10): bộ chọn thời gian 4 kiểu | V2 I.1, V3 II.5, MP III.8 | Lời mới | `Khoảng tuần` (11.6 đã ghi); giữ "nhớ khi đổi tab" của C29 | Không |
| X-15 | C15 + mockup 2 khung 1d (duyệt 18/10): dán Excel ở mọi lưới | V3 I.5, MP VIII.8, XI.7: giữ duy nhất theo lớp × từng MT | Lời mới | Bỏ 6 lối; sửa mockup 2 khung 1d | Không |
| X-16 | C27: Kết quả thi gồm Progress / Final | 19/10-M6: chỉ Mock + Thi thật; 9.2-29 muốn khối lớp thường ở Báo cáo | 19/10 cho tab Kết quả; khối lớp thường ở Báo cáo là nâng cấp mới | — | Q-C2 |
| X-17 | C20 (18/10): luôn ghi năm `W4 AUG/2026` ở Kế hoạch Test, hộp lịch, xuất | 9.2-22 + luật 30/09 (mã tuần ngắn): "/2026" lặp 108 lần là nhiễu | Thẩm mỹ → PTA | Năm ở đầu cột / khi khác năm; tệp xuất giữ năm | Không (4.7 A1) |
| X-18 | 19/10-M6 + DESIGN.md: hạn chỉ ghi ngày, không ghi thứ | Đề xuất 12.2 / 12.9-3/4: nhãn "hạn T4 16/09" | 19/10 — đề xuất PTA không thắng lời chủ SP | Nhãn "MT2 · thi W2 SEP · hạn 16/09" | Không |
| X-19 | DESIGN.md (17/10) + mockup 1 §1d (duyệt 18/10) + phụ lục v1 C2: đang chọn = viền khung 2 px; vạch trái 3 px = hàng nhóm / Đã thi | 10.1: đang chọn = nền nhấn nhạt + vạch trái 3 px; (v4) V4C-04: viền trong 2 px **trùng màu, trùng độ dày vòng focus** | Thẩm mỹ → PTA quyết (**đổi so với bản nháp**, PTA Plan 21/10) | Đang chọn = nền nhấn nhạt + vạch trái 3 px, khác hẳn vòng focus 2 px; vạch trái hàng nhóm sang màu trung tính; sửa DESIGN.md + mockup 1 | Không (4.7 A11 — đảo mockup) |
| X-20 | 06/10-NGAY: ô ngày = `ONgay`, không hàng nút "Hôm nay · Hôm qua" | 12.7 giữ hàng nút "Tuần này · Tuần trước" trong lịch tuần; Chuyển lớp có hàng nút ngày (9.2-19); (v4) hàng chip "Ngay hôm nay · W4 SEP · W1 OCT…" ở Chuyển lớp, Chuyển tiếp lớp (V4C-05, v4c Q2) | 06/10 — lời chủ SP | PTA hiểu luật áp cả ô TUẦN: bỏ hàng nút / hàng chip; một `ONgay kieu="tuan"` điền sẵn tuần đề xuất, "Ngay hôm nay" là lựa chọn trong lịch; lịch tuần ‹ › + "Mặc định" | Không (4.7 B12) |
| X-21 | 30/09: thời gian trên màn ưu tiên mã tuần | 12.7: "Toàn bộ · 22/06 – 13/09/2026" | 30/09 | "Toàn bộ · W4 JUN – W2 SEP" | Không |
| X-22 | 14/10-OV12: "Đang SOS" theo tuần thi; đánh giá 17/10: giữ hai tên SOS | 9.1-4: một định nghĩa "SOS hiện tại" cho Tổng quan · HV & Lớp · Báo cáo | 9.1-4 | Đang SOS bỏ bộ lọc thời gian; số trong kỳ ở Phân tích mang tên khác hẳn ("Lượt SOS trong kỳ") | Không |
| X-23 | 9.1-4: Báo cáo dùng "SOS hiện tại" | V3 II.3: báo cáo thuần — số đã xảy ra trong kỳ | F — hai lời chủ SP chạm nhau | PTA hiểu: "SOS hiện tại" nằm ở khối **"tại hôm nay"** của Báo cáo (mockup 3 đã tách "trong kỳ ↔ tại"); xem kỳ cũ thì khối này ghi "số hôm nay" | Không (báo; khác thì nêu ở Q-C2) |
| X-24 | Q6a (18/10): dải tóm tắt nhỏ dẫn tới việc ở Tổng quan | 10.7-3 bỏ dải "HV cần chú ý"; MP IV.1–2 "thanh quá dày, nhiều số vô dụng" | MP (mới hơn) ủng hộ bỏ; IA / thẩm mỹ → PTA | Số chỉ ở hàng tổng "Cả Monbay", chỉ xem | Không (4.7 A2) |
| X-25 | Mockup 3: khối Trễ chấm; mockup 1 / 3 / 6 khung 10: Công việc đầu menu, "Báo cáo" thay "Tổng quan" | V1 II.4, V1 I.2 | V1 | Sửa mockup trong PR tài liệu (10.5) | Không |
| X-26 | Mã `missingForStudent` (`server/src/classes/schedule.ts:757-783`): 7 trường (tuần bắt đầu, Target FT, tháng thi FT, điểm đầu vào, mốc tiếp + ngày sinh, email theo 14/10-Q3) → 46/51 em "Thiếu" | Đề xuất 9.2-15: chỉ Target, Tuần bắt đầu, Email; luật Lịch thi mới cho tháng thi trạng thái riêng; điểm đầu vào được phép trống | F — định nghĩa số | — | Q-D4 |
| X-27 **[LỚN]** | 11/10-TVV: TVV không Test, **không Công việc** | L1 + MP XII.1 + 9.2-13 + 11.8-3c; (v4) v4a: hàng đợi "Việc của bạn" trên Tổng quan TVV ↔ v4c: mở mục Công việc cho TVV | L1 thắng phần "TVV có việc"; nơi làm: PTA khuyến nghị v4a (đúng 11/10, không thêm menu) — định hướng nên hỏi | (21/10) TVV làm ở Tổng quan TVV, không thêm Công việc; bộ việc theo 2.9 21/10-TVV | Không — đã trả lời 21/10: Q-A1 ①, Q-A3 (X-80) |
| X-28 | 11/10-HUY: huỷ cả lượt MT giữ điểm ẩn, Khôi phục nguyên trạng (chỉ QL) | 19/10-M6: "Huỷ = Xóa" ở Kế hoạch Test (bỏ "Huỷ MT{n}"; có điểm thì không xoá; ngoại lệ vắng 2 lần) + MP XIV.3 | 19/10 cho Kế hoạch Test | (v4 đã kiểm) web đã bỏ "Huỷ MT{n}" (OV-15c); lượt huỷ cũ chỉ còn "Khôi phục MT" (`attempts.ts:1576-1584, 1656-1725`); bảng trạng thái v4b Phần B → 05 | Không |
| X-29 | 16/10-OV13q (planning chọn): chỉ có tháng → ngày cuối tháng là ngày thi → "Đã thi · chờ KQ" | V2 I.6.3 + MP V.7: giữ tháng chưa ngày = "Chưa chốt ngày" + việc không hạn | Lời mới — lệch P1 (`tongKetLoTrinh.ts:118-119`, dính từ 01/12) | Sửa ở LT-SV | Q-E1 (thời điểm) |
| X-30 | 19/10-M6: "Cần xác nhận" không tự tạo việc; mockup 5: 4 nút Kết luận | MP V.6: nếu = chưa kết luận thì hiện đúng; nghĩa khác thì hỏi | F — mã: đầu ra = chưa kết luận; ý định = "đã bàn, chờ xác nhận" | — | Q-C4 |
| X-31 | Rulebook §20.9: GVCN / GVBM đúng môn dời lịch lớp thường; máy chủ vẫn cho GV | 09/10 + 14/10-Q13 (chủ SP chốt): dời lịch môn chỉ QL | 14/10 | Sửa chữ Rulebook; chặn ở máy chủ (lệch quyền — GĐ1) | Không (12.9-7 đã trả lời) |
| X-32 | Rulebook 772 (hạn lớp thường CN tuần thi), 605 (nhận xét MT không bắt buộc), "PR-LT3 chưa có trong code" | T19 (06/10), 14/10-OV12, PR-LT3 #218 đã merge | Luật mới | Chỉ sửa chữ Rulebook (PR tài liệu GĐ0) | Không |
| X-33 | Mockup 2 khung 1a: "✗ 16/25 64%" trong ô | 12.9-9: không % trong ô (% ở hộp / tooltip / cột riêng) | Thẩm mỹ → PTA | "✗ 17/25", % ở hộp chấm | Không (4.7 A6) |
| X-34 | Mockup tutor (duyệt 20/10): nút chính "Tải danh sách" | 7.8 / 9.2-34: nút chính "Thêm tutor" | Thẩm mỹ → PTA | "Thêm tutor" chính, "Tải danh sách" phụ | Không (4.7 A7) |
| X-35 | C30 (18/10): Phân tích GV giữ chiều sâu; PR #462 giữ bảng cũ 12 cột | Khung 4c (duyệt 19/10): bảng gọn 7 cột | 9.1-1 | Khung 4c; chiều sâu chuyển vào panel từ số (đúng GV, đúng khoảng) | Không |
| X-36 | T17-27/09: không tự mở lớp | Mockup 1 khung 3: "MB FT 101 đang mở" | 9.1-1 | Lớp đầu mở sẵn | Không |
| X-37 | Thuật ngữ 01/10: C-028 "Đã thi", C-035 "Không dự thi", C-036 "Đã huỷ phần thi"; Rulebook §17.7; mockup 4 / 5 | V2 I.5 (Thi ≠ Test); MP 0 "thuật ngữ đã chốt giữ nguyên" | V2 I.5 — lời mới, cụ thể hơn | Đổi chữ, không đổi luật (11.1d); từ điển + phép kiểm | Không (4.7 A8) |
| X-38 | MP III.6 gọi "Lớp/HV" | Thuật ngữ đã chốt "Học viên & Lớp" (55 tệp + Hướng dẫn) | MP 0 "thuật ngữ đã chốt giữ nguyên" | Giữ tên, chỉ đổi thứ tự | Không |
| X-39 | Phương án chủ SP (MP IV.3): Thêm PA ngay ở dòng HV, mở rộng tại chỗ | 10.3: chỉ ở bảng rộng, danh sách hẹp dùng khung phải; ảnh v4-1, v4-3: chủ SP chê việc mở rộng trong danh sách hẹp che tiêu đề | PTA đánh giá → áp một phần | Bảng rộng (Lớp cần chú ý, Đang SOS, hồ sơ lớp): mở dưới dòng; hàng đợi hẹp: khung phải; cùng một form | Không (4.7 A14) |
| X-40 **[LỚN, cùng X-07]** | Phương án chủ SP A (MP IV.8): hộp duyệt riêng ở trên, dưới trái / phải | Đề xuất B (10.2); bằng chứng: Công việc QL **hiện chính là dáng A** và bị chủ SP chê ở ảnh v4-1 | Chưa phân | — | Q-A2 |
| X-41 | Đề xuất 11.2 / 11.8-8: bỏ góc "Cần làm" | MP V.3 + XVI.B: làm lại bảng Cần làm (cột trọng tâm), không đổi logic xác định việc | Chưa phân — đề xuất PTA ↔ lời chủ SP (phương án chưa chốt) | (21/10) bộ lọc trong bảng Tất cả (cột Việc · Người phụ trách · Hạn), logic không đổi, **giữ tên "Cần làm"** (X-81) | Không — đã trả lời 21/10 (Q-A4) |
| X-42 | C31 (18/10): xuất "Toàn bộ đang lọc / Đã chọn"; OV-15h2 thêm cột tick ở bảng lớp | MP V.4: checkbox xấu; A / B chưa chốt | Chưa phân | — | Q-E2 |
| X-43 | 13/10-SUA: sửa sau lưu "không thêm bước duyệt" | L3 "giữ duyệt bắt buộc" + MP XIII.3 "dữ liệu đã qua duyệt đối chiếu workflow, hỏi khi xung đột" | Không trái nhau; biên: sửa dữ liệu đã được duyệt | — | Q-B2 |
| X-44 | L2: 5 ngày lịch "tính từ thời điểm GVCN lưu" | Quy ước hạn hệ thống (Rb 708, Q27-5; `hanTheoNgay`, `shared/domain/cases.ts:766-769`): "n ngày liên tiếp, tính cả ngày đầu" | L2 cho phép làm rõ giờ → PTA quyết (**đổi so với bản nháp**: không hỏi) | Hết 23:59 giờ VN ngày (lưu + 4), tính cả ngày lưu; vd lưu T2 14/09 10:00 → hết 23:59 T6 18/09, quá hạn từ T7 19/09; theo lần lưu đầu, sửa không dời hạn | Không (4.7 B1 — phản đối nếu không đúng) |
| X-45 | L1: việc TVV sinh ngay, không đợi duyệt | Rulebook: WL 3 / loại ngoài thang cần QL duyệt 5 ngày; `yt_thuc_hien` (QL đã duyệt, GVCN chưa thực hiện) | Không trái — L1 sinh việc ngay cả khi lần xử lý đang chờ QL (X-53); biên: QL từ chối sau khi việc đã sinh | — | Q-D1 |
| X-46 | 19/10-GV: GV vào thẳng Công việc | V1 I.2: menu Tổng quan đứng đầu | Không xung đột (trang nhà ≠ thứ tự menu) | Giữ cả hai (10.1) | Không |
| X-47 | Q15-cũ: "quyết định không hoàn tác" | Mockup 3 (duyệt): "Hoàn tác · 8 s" sau Duyệt | 9.1-1 | Hoàn tác cho thao tác đảo được; không đổi luật duyệt | Không |
| X-48 | Mockup 5 khung 1 (4 nút Kết luận) + khung 2 (cột tick) | V2 (Lịch thi, xuất) | Lời mới | Sửa mockup 5 sau khi có Q-C4, Q-E2 | Theo Q-C4, Q-E2 |
| X-49 | 13/10-SUA "sửa sau lưu không thêm bước duyệt" + mã `xoaXuLy` (`server/src/yThuc/xuLy.ts:622-638`): GVCN **xoá thẳng** (xoá vật lý) lần xử lý mới nhất, không duyệt, không lý do | L5 (21/10): thu hồi / xử lý không tăng bậc → QL duyệt, lý do bắt buộc | L5 — lời mới, khớp L3; mã lệch phải sửa | (v4 đã kiểm) "Thu hồi…" thay "Xoá" → thẻ Chờ duyệt (Ý thức) + lý do; lần xử lý vẫn hiệu lực tới khi QL duyệt; duyệt → "Đã thu hồi" (giữ dòng + lịch sử, bậc tính lại); từ chối → giữ. "Không tăng bậc": **chưa có đường** → dùng lại "Đề xuất QL duyệt" (chọn bậc hiện tại / thấp hơn + lý do). QL tự thu hồi có lý do (tự duyệt). Sửa chi tiết vẫn lưu thẳng + lịch sử (L3) | Không (4.7 B4, B5) |
| X-50 | L1: việc TVV sinh ngay khi GVCN lưu | L5: xử lý không tăng bậc phải chờ QL; thu hồi có thể xảy ra sau khi việc TVV đã sinh | Không trái — L1 vẫn sinh việc ngay khi lưu; biên: QL từ chối / QL duyệt thu hồi | — | Q-D1 |
| X-51 | Đề xuất PTA (MP-29): Hoàn tác 8–10 s cho thao tác đảo được; mã cho GVCN rút đề xuất còn chờ (`rutDeXuatYThuc`) không cần duyệt | L5: thu hồi xử lý phải qua QL | L5 cho lần xử lý **đã lưu** | Rút một **đề xuất còn chờ QL** chưa phải "thu hồi" (chưa có hiệu lực) → vẫn rút được, có lịch sử; "Chưa thực hiện" và bớt vi phạm = sửa (L3). Hoàn tác ngay sau lưu → X-58 | Không (4.7 B7) |
| X-52 **[LỚN, cùng X-27]** | Mã: GVCN lưu xử lý → không việc nào cho TVV; TVV không có quyền `discipline.*`, chỉ đọc Ý thức; placeholder GVCN "Đã gửi Report cho PH qua Zalo"; dữ liệu: demo 4/129 em có TVV, bản chính chưa gán (`server/src/seed/ov2aSeed.ts:3`) | L1 + L2 (V4B-01, V4C-01) | L1 — lệch phải sửa (làm mới) | Việc TVV gắn một-một với lần xử lý, hạn theo 4.7 B1, tự đóng khi thu hồi / em nghỉ; lần xử lý trước ngày bật không sinh; **bước gán TVV cho em trước khi bật** (lệnh chỉ đọc đếm em chưa có TVV theo chi nhánh) | Biên → Q-D1, Q-D3; nơi → Q-A1 |
| X-53 | Khuyến nghị v4b Q1: lần xử lý cần QL duyệt (WL 3, ngoài thang, không tăng bậc) → sinh việc TVV lúc GVCN ghi "Đã thực hiện" sau duyệt | L1: "ngay khi GVCN lưu… không cần đợi một bước phê duyệt khác" | L1 — luật thắng khuyến nghị nghiên cứu (nguồn 1) | Sinh ngay khi lưu, kể cả đang chờ QL; dòng việc TVV ghi "QL đang duyệt"; QL từ chối / duyệt thu hồi → Q-D1 | Không (4.7 B2) |
| X-54 | Mã: MT **hiện tại**, "-" ghi sau CN tuần thi → "Không dự thi" ngay, không dời, không đếm (`attempts.ts:2135-2136`, `absence.ts:975`; ảnh v4b-04) | L4: "-" lần 1 dời, lần 2 huỷ; MT hiện tại giữ gửi duyệt | L4 — lệch phải sửa | Như "-" trong tuần: lần 1 → tuần kế của lịch nếu còn thi được; hết hẳn / vướng MT sau → thẻ "Dời lịch" gửi QL; lần 2 → Huỷ (vắng 2 lần) | Không |
| X-55 | Rb 680 + 01 mục 4 (dòng T3): "luồng gửi duyệt" = GVCN "Xin dời" → QL duyệt | Mã + luật 09/10: "Xin dời" chỉ còn route (`server/src/routes/index.ts:940`), không có nút web; đường gửi duyệt duy nhất = thẻ dời khi máy không tự dời được (`absence.ts:283-317`) | Mã + 09/10 (mới hơn Rb); L4 không đổi | PTA hiểu "MT hiện tại giữ gửi duyệt như trước" = thẻ "Dời lịch Test" gửi QL; không dựng lại nút "Xin dời"; sửa chữ Rb 680 | Không (4.7 B8) |
| X-56 | Mã: "Huỷ điểm" xoá cả nhận xét + nhóm nguyên nhân + GV chấm, không có Khôi phục (`attempts.ts:2256-2262`) — nhập lại phải gõ nhận xét ≥ 10 ký tự; "Huỷ kỹ năng" có điểm xoá điểm (`attempts.ts:1377-1390`) | L3 + MP III.9, XIV.1 (khôi phục, không mất kết quả) | L3 | Điểm cất; dòng phụ "Đã huỷ 6.5 · Khôi phục" (1 bấm, ghi qua đường lưu điểm, có nhật ký); "Bỏ khỏi đợt" cũng cất, "Đưa lại vào đợt" hỏi trả điểm | Không (4.7 B11) |
| X-57 | Mã: nút "Xếp lại bài vắng" hiện cho GVCN lớp FT (`shared/domain/thaoTacMt.ts:62`) nhưng máy chủ trả 403 (`server/src/permissions.ts:432-436`, luật 09/10) | 13/10-VAI: nút chỉ hiện khi máy chủ cho làm | 13/10-VAI — lỗi (D) | Điều kiện nút theo quyền máy chủ | Không |
| X-58 | Đề xuất v4b Q5a: GVCN bấm nhầm → "Hoàn tác" 10 s ngay sau lưu xử lý, không qua QL (việc TVV vừa sinh tự huỷ) | L5: thu hồi lần xử lý đã lưu phải qua QL; bản nháp 02 (4.7 #14) + 05 mục 5.3: không Hoàn tác | L5 — luật thắng khuyến nghị nghiên cứu (không tự nới duyệt bắt buộc) | Không có Hoàn tác sau lưu xử lý; bấm nhầm cũng gửi "Thu hồi…" qua QL (lý do "bấm nhầm") | Không (4.7 B15) |
| X-59 | Đường "Đề xuất QL duyệt" ngoài thang hiện bắt ≥ 1 tệp (`xuLy.ts:493-553`) | L5: "gửi QL duyệt **kèm lý do**" | L5 — lời mới, cụ thể | Thu hồi / không tăng bậc: lý do bắt buộc, tệp tuỳ chọn; WL 3 / ngoài thang giữ bắt tệp | Không (4.7 B6) |
| X-60 | Rulebook — 16 chỗ lệch (v4b V4B-09, R1–R16): "-" MT cũ = Không dự thi (677, 688, 743-744) · GVBM không sửa sau hoàn tất / MT cũ 7 ngày / lớp kết thúc (723, 816, 696, 608, 564) · §20.3 không có TVV, thu hồi, không tăng bậc; "bậc không lùi" (727-737, 730) · "GVCN Xin dời" (680, 743) · dời vượt không chặn (679) · "Vai chỉ có 3" (809) · OV-15c/d "chưa merge" (906-908)…; câu hướng dẫn việc "Cập nhật kết quả thi thật: hạn 4 tuần" (`mywork.ts:221-224`) ≠ hạn thật ngày thi + 7 | L1–L5 + mã đã merge + chốt chủ SP mới hơn | Luật / mã (nguồn 1) thắng Rulebook (nguồn 2) — chỉ sửa chữ | Sửa đủ 16 chỗ + câu hướng dẫn ở PR tài liệu GĐ0; R13 theo Q-A3; R14 = 14/10-Q13 (đã trả lời); gộp X-31, X-32 | Không |
| X-61 | Mã MT: 4 thao tác cùng chữ "huỷ / xoá" khác nghĩa (Huỷ điểm · Huỷ kỹ năng · Xóa lịch · Huỷ vắng 2 lần); một trạng thái hai bộ nút ("Khôi phục → Chưa xếp · Giữ huỷ" ở hộp lịch ↔ "Khôi phục và đặt tuần · Không mock lại" ở hồ sơ MT) | 11/10-UX "một khái niệm một tên" + MP XIV.1, XIV.3 | 11/10-UX + MP | Một hộp một đợt; bộ chữ 05 mục 4.5; đường "huỷ điểm → hồ sơ MT → khôi phục → dời" ≈ 14 bấm → 3–4 | Không (4.7 C9) |
| X-62 | Mockup OV-13 §1 (đã duyệt): Kết quả PA "ghi nhanh dưới dòng" ở Công việc | MP XI.6 + ảnh v4-1, v4-3 (chủ SP chê che đầu mục); lỗi lưới `WorkList.tsx:148`, cột tiêu đề co 0 px (V4A-06) | MP — lời mới, cụ thể (nguồn 2 thắng khung cũ) | Một danh sách một kiểu mở: Kết quả PA mở ở khung phải, form gọn mặc định (vẫn 3 bấm), tiêu đề + bối cảnh PA luôn thấy; ghi nhanh giữ ở panel một em | Không (4.7 A12 — đảo mockup) |
| X-63 | OV-13b: việc "Chọn người phụ trách" + nút "Phân công…" mở cả Thông tin lớp | Mã: không đường nào ghi chủ Case khi phân công (`classes.ts:1095-1174` không chạm `sos_cases`) → Case 14 **không bao giờ xong**; chú thích `PanelViec.tsx:253` sai với mã (V4A-05, ảnh v4-2) | Đầu ra (08/10) — lỗi (D) | Máy chủ trả lý do thiếu người; Case không chủ + lớp có GV môn → tự gán theo luật tạo Case (GV môn → GVCN), có lịch sử, ghi bù dữ liệu cũ; lớp thiếu GV môn → hộp nhỏ "Phân công GV môn"; GV không thấy việc không chủ | Không (4.7 A13 — phản đối nếu không muốn tự gán) |
| X-64 | Mockup 2 khung "Sau" (duyệt 18/10): danh sách Công việc nhóm theo loại nghiệp vụ | MP XI.1 + ảnh v4-1 (20/10): "thiết kế lại TOÀN BỘ" — việc gì, cho ai, vào đâu | MP — lời mới | Mockup Công việc mới (dòng 3 vùng, nhóm theo vai — 4.7 C4); dáng khu việc theo Q-A1, Q-A2 | Q-A2 |
| X-65 | Mã còn hai menu ⋯: `Menu` (hồ sơ HV, Mock — Esc làm mất focus, ↓ không chạy, tiêu đề nhóm IN HOA 11 px) ↔ `MenuDong` | Đặc tả §3.7 `MenuDong` + 11/10-UX "dùng lại component" | 11/10-UX | Một menu ⋯ = `MenuDong`, gỡ `Menu` (V4C-03) | Không |
| X-66 | Mã: "Chọn bước tiếp" là "của tôi" với QL + QT + mọi TVV chi nhánh; "Kết quả thi" của GVCN lớp cuối **và** TVV; "Báo PH qua TVV" (Progress / Final lớp thường) là việc GVCN (Rb 773, M-05) | Mockup vai TVV 13/10 (TVV báo PH, giữ chân HV) + MP XII.1 + đề xuất v4b "một việc một người giữ" | Đổi người chịu trách nhiệm = nghiệp vụ | (21/10) theo 2.9 21/10-TVV | Không — đã trả lời 21/10 (X-80) |
| X-67 | Khoá chủ SP giữ 14–15/10: lớp đã kết thúc chỉ QL sửa điểm (14/10-Q4) · sửa chữ kết quả PA khi Case đã xong phải "Mở lại" (H21) · Tutor sửa nhận xét ≤ 24 giờ (H28) | L3 "không khoá cứng vô lý"; v4b đề xuất nới cả ba | H28 là khoá "vì đã lưu" → L3 thắng, nới (4.7 A19); lớp kết thúc + H21 là khoá "vì đóng hồ sơ" → chủ SP chọn | — | Q-B1 |
| X-68 | Mã: MT0 (lớp thường lên FT) — "-" không chốt, không dời ("Không có bài" / "Không dự thi"; `chotVangNgay` chỉ cho `kind = mock`) | L4 nói "MT" | PTA hiểu MT0 là MT → L4 (05 mục 4.4) | Áp L4 trong giới hạn MT0 (≤ T2 tuần 2 FT, luôn trước MT1); vượt → thẻ QL | Không (4.7 A16) |
| X-69 | Mã: menu vẫn Phân tích trước Công việc (`shared/domain/dieuHuong.ts:45-53`) | V1 I.2 thứ tự đã chốt | V1 — lệch phải sửa | Sửa ở NEN | Không |
| X-70 | Thẻ dời MT mang nhãn loại "Lịch thi"; thẻ "Dời S · MT3 · lần 2" | V2 I.5 (Thi = kỳ thi thật) | V2 I.5 | Nhãn "Dời lịch Test" | Không (4.7 C20) |
| X-71 | Góp ý GV trung tâm (FB-4-36, B): "**1 ô hiện lên**, list thông báo nhắc việc như Base" | Luật 08/10 (không thêm bước) + Rb 20.10 (trang đầu GV = danh sách việc của tôi) + 9.2-4 (chuông chỉ đếm việc còn mở) + Rb 20.11 (chỉ chuông trong ứng dụng) | Ý GV là B (chưa chốt) → PTA đánh giá: giữ ý "một hộp liệt kê nhắc việc, không sót"; không tự bật hộp mỗi lần đăng nhập (thêm một bước đóng) | Hộp chuông (bấm mở) thành hộp "Nhắc việc" — 05 mục 2.7 N2 | Không (4.7 A20 — đảo phương án GV nêu) |
| X-72 | OV-15d (C03): 3 loại thông báo tự động **lưu thành dòng**, đồng bộ khi mở chuông ≤ 1 lần / 5 phút (`server/src/platform/thongBaoTuDong.ts`); "Cần làm" đoán theo danh sách `kind` (`shared/domain/duongHoSo.ts:150-158`) | 11/10-UX "một nguồn, việc xong không nơi nào còn báo chờ" + 9.2-4 + X1(5) tài liệu chính "chuông = Công việc, cùng hàm"; (v4d) GV 7: 9 việc quá hạn — Cần làm có 1, Để biết 5, không có 3 | 11/10-UX + 9.2-4 (chốt) thắng cơ chế triển khai OV-15d; **hành vi C03 giữ** (nhắc tự động, không Nhắc tay) | GĐ1 SL1 vá (A1-04, A7-05 + SOS-lượt GVCN sang Để biết); M2: Cần làm đọc cùng hàm hàng đợi trang đầu, bỏ `thongBaoTuDong.ts` | Không (4.7 C22) |
| X-73 | Mã + chữ số ít Rb §4.1 ("chọn học viên, nhóm và kỹ năng"): một lần tạo = một Case (`QuickReport.tsx:400-412`, `cases.ts:463-739`) | 21/10-CASE (FB-4-35, mục 2.8): chọn nhiều kỹ năng, tạo cùng lúc một panel | 21/10-CASE — lời mới; luật "một em × một hạng mục" giữ (mỗi kỹ năng một Case) | Lô = n Case độc lập, một giao dịch; trùng / chờ xác nhận báo theo từng kỹ năng ngay khi chọn chip — 05 mục 7.1b | Không (4.7 B16, C21) |
| X-74 | Nút "+ Case cho {kỹ năng}" (`web/src/modules/cases/SkillBoard.tsx:294`) hứa chọn sẵn kỹ năng | Mã `StudentDetailPage.tsx:334` bỏ tham số, `QuickReport` không nhận kỹ năng ban đầu → form "Chọn kỹ năng trước" (ảnh v4d `gv7-case-cho2--form`) | 11/10-UX (chữ nút = việc nút làm) — lỗi (D) | Truyền kỹ năng vào panel, chọn sẵn | Không |
| X-75 | **L4 20/10** (MP II.4): "áp cả lịch MT tuần cũ" — "-" lần 1 ở MT cũ dời tuần kế, không coi "-" đầu là huỷ; 2.2 + 05 mục 4 (bản 21/10 sáng): MT cũ lần 1 → tuần đích Q-B3 | **Chủ SP 21/10 (Q-B4) sửa luật 4:** MT cũ "-" → **huỷ ngay**; Khôi phục = được dời 2 lần; Hoàn tác 10 s | Lời chủ SP mới hơn về cùng điều (nguồn 1–2) — chủ SP tự sửa luật | LUAT-34 theo 2.9 21/10-L4; ô "Không dự thi" cũ của MT cũ hiện "Đã huỷ" (giữ bản ghi, khôi phục được) | Không |
| X-76 | Q-B3 khuyến nghị PTA ①: MT cũ "-" lần 1 dời **tuần sau hôm nay**; chủ SP chọn ② "tuần kế của lịch cũ" | Câu Q-B4 cùng ngày: MT cũ "-" = huỷ ngay | Câu sau của chủ SP đè câu trước | Q-B3 **hết hiệu lực cho MT cũ**; "tuần kế của lịch" chỉ áp cho **MT hiện tại ghi "-" muộn** (sau tuần thi, < 2 tuần) nếu còn thi được, không thì thẻ QL (khớp X-54) | Không |
| X-77 | Q-B4 khuyến nghị PTA ① + v4b Q6: chỉ đếm lần dời do "-", QL dời tay / duyệt thẻ không tính; **sau QL "Đặt tuần" từ Đã huỷ, chuỗi giữ** ("-" tiếp theo huỷ lại) | Chủ SP 21/10: **đếm theo tuần** (sửa / gõ lại "-" trong cùng tuần không tính); **Khôi phục → đặt lại, được dời 2 lần**; **QL duyệt cho dời thêm → chỉ +1**, vắng tiếp → huỷ | Lời chủ SP thắng khuyến nghị PTA | Bảng 05 mục 4.3 sửa T04, T10, T14–15 + thêm T31 (đếm theo tuần) | Không |
| X-78 | 05 mục 6.2 H10 + T09 (bảng MT): gỡ "-" ở kỹ năng **đã huỷ** chỉ QL (khoá giữ) | Chủ SP 21/10: gõ nhầm "-" ở MT cũ → "Hoàn tác 10 giây và vẫn cho khôi phục được, **tại sao phải chặn cứng?**" | Lời chủ SP + L3 (không khoá cứng vô lý) | MT cũ huỷ do "-": Hoàn tác 10 s; sau đó **người có quyền sửa ô** (gồm GV đã gõ) khôi phục, có lịch sử, QL nhận chuông "để biết" (PTA diễn giải — chủ SP sửa nếu muốn chỉ QL); "Đã huỷ · vắng 2 lần" của MT hiện tại vẫn do QL quyết (H10 giữ cho ca này) | Không (PTA diễn giải — 2.9 ý 5) |
| X-79 | T18 (05/10) + 03 AU-41 / 05 3.2, 3.4: nhóm "Chấm Speaking chéo" **chỉ GV có phân công S** (ở một lớp FT cùng chi nhánh) | Chủ SP 21/10 (Q-C1): GV có dạy kỹ năng S, **kể cả không dạy lớp nào**, được chấm chéo | Lời chủ SP mới hơn; phần còn lại của T18 giữ | Theo kỹ năng S trong hồ sơ GV (`user_skills`), phạm vi chi nhánh. **Mã đã đúng từ OV-14c** (`permissions.ts:289-297`; `prOv14c.tests.ts` OV14c-2, OV14c-10) — chỉ sửa chữ tài liệu + giữ khi làm SV-M2 / M5 | Không |
| X-80 | Mã: "Cập nhật kết quả thi thật" là việc **GVCN lớp cuối**, có hạn (`mywork.ts:220-224`: chữ "hạn 4 tuần"; X-60: hạn thật ngày thi + 7); "Chọn bước tiếp" là "của tôi" với QL + mọi TVV chi nhánh; khuyến nghị PTA Q-A3 ①: giữ KQ thi thật ở GVCN, chuyển "Báo PH lớp thường" sang TVV | Chủ SP 21/10 (Q-A3): TVV giữ Chốt ngày thi · Chọn bước tiếp (hạn 1 tuần) · Bổ sung hồ sơ thiếu · **Cập nhật KQ thi thật (không hạn)**; Báo PH lớp thường **không** chuyển | Lời chủ SP (luật mới) thắng mã + khuyến nghị PTA | Lệch phải sửa ở máy chủ: đổi người giữ + bỏ hạn KQ thi thật, một người giữ Bước tiếp (TVV của em; không có → QL) — 07 SV-TVV-VIEC; sửa câu hướng dẫn "hạn 4 tuần" | Không |
| X-81 | Q-A4 khuyến nghị PTA ①: đổi góc thành bộ lọc tên **"Có việc"** | Chủ SP 21/10: "Để tên là 'Cần làm' nhé" | Lời chủ SP (tên) | Bộ lọc trong bảng Tất cả, tên **"Cần làm"**; cột + logic theo ① | Không |

Thống kê: 70 dòng (51 cũ + 19 mới vòng 4) · 50 phân xử xong ("Không"; X-23 kèm điều kiện) · 20 dòng nối câu hỏi (X-04, X-05, X-07, X-08, X-16, X-26, X-27, X-29, X-30, X-40, X-41, X-42, X-43, X-45, X-48, X-50, X-52, X-64, X-66, X-67). Bản nháp còn X-44 nối câu hỏi — nay PTA tự quyết (4.7 B1).
Bổ sung 21/10 (agent v4d): X-71…X-74 — cả 4 đã phân xử ("Không") → tổng **74 dòng · 54 phân xử xong · 20 nối câu hỏi**.
Bổ sung 21/10 (câu trả lời vòng cuối, agent d6): X-75…X-81 — đều phân xử (lời chủ SP mới nhất thắng). 20 dòng nối câu hỏi nay theo câu trả lời ở mục 5 / 2.9 → tổng **81 dòng · 80 phân xử xong · còn X-08 chờ chủ SP duyệt mockup Chấm Test (Q-C1)**.

---

## 4. Sổ câu hỏi — mọi câu đang mở

Trạng thái: **(1)** đã được trả lời / hết hiệu lực (nói rõ bởi đâu) · **(2)** gộp vào câu khác · **(3)** PTA tự quyết (chỉ thẩm mỹ / UX, không đụng nghiệp vụ / quyền — ghi lựa chọn mặc định) · **(4)** PHẢI HỎI chủ SP (mục 5).

### 4.1 Mục 9.2 (38 câu)

| Mã | Câu (rút gọn) | TT | Trả lời / gộp vào / mặc định |
|---|---|---|---|
| 9.2-1 | QL nhập thay bài trễ chấm ngay ở panel (mockup 1d)? | (1) | Hết hiệu lực: khối Trễ chấm đã bỏ (V1 II.4). Không thêm quyền nhập cho QL; QL sửa điểm theo quyền hiện có |
| 9.2-2 | Tiêu đề "Tổng quan" cho mọi vai (phần "Công việc đầu menu" đã hết hiệu lực) | (3) | Tiêu đề trang = tên menu ở mọi vai (A1-07) |
| 9.2-3 | Chờ duyệt theo chi nhánh đang chọn (thay 06/10)? | (1) | 9.1-4 "một phạm vi số cho cả trang" (X-03); thêm dòng "n thẻ ở chi nhánh khác · Xem" |
| 9.2-4 | Chuông chỉ đếm việc còn mở; 3 thông báo tự động vào "Cần làm"? | (1) | Luật 11/10-UX "việc đã xong không nơi nào còn báo chờ / quá hạn" → làm ở SL1 |
| 9.2-5 | Badge "Công việc n" một nghĩa cho mọi vai? | (2) | Gộp Q-A1 (badge đi theo trang chứa việc của vai) |
| 9.2-6 | "Hoàn tác 8 s" sau Duyệt (mockup 3) hay "không hoàn tác" (Q15 cũ)? | (1) | 9.1-1: mockup 3 thắng luật giao diện cũ (X-47) |
| 9.2-7 | QL mở Công việc: "Cần bạn quyết" đầu trang? | (2) | Gộp Q-A1 |
| 9.2-8 | Hàng đợi tự sang việc kế chỉ trong cùng nhóm? | (1) | Mockup 2 khung 1e đã duyệt (9.1-1); sửa CV-05 |
| 9.2-9 | Làm "Mẫu nhận xét" của mockup 2? | (1) | Mockup 2 đã duyệt (9.1-1) → làm ở M2 |
| 9.2-10 | GV có thấy việc "Chưa có người" / "Chọn người phụ trách"? | (3) | Không — chỉ vai có quyền phân công (13/10-VAI); liên quan ảnh v4-2 |
| 9.2-11 | Cột Kết quả trống tới khi có điểm (panel một kỹ năng)? | (3) | Có (CV-12) |
| 9.2-12 | Chấm Speaking có hạn + "⚠ quá hạn" hay không hạn (T18)? | (2) | Gộp 12.9-6: hạn hiện để nhìn, không tính nợ |
| 9.2-13 | TVV / CX có khối "Cần làm" ở Tổng quan? | (2) | Gộp Q-A1 (nơi việc TVV) |
| 9.2-14 | Bỏ góc "Cần làm"? | (2) | Đã gộp 11.8-8 → Q-A4 |
| 9.2-15 | "Thiếu thông tin" chỉ Target, Tuần bắt đầu, Email; không nhãn từng em; chỉ vai điền được thấy? | (2) | Định nghĩa gộp Q-D4 (X-26); cách hiện (một số ở hàng lớp, chỉ vai điền được thấy) PTA |
| 9.2-16 | Đang SOS dùng bảng 6 cột mockup 6 khung 1? | (1) | 9.1-1 |
| 9.2-17 | Bỏ khối "Điểm Mock Test của lớp"? | (1) | Hết hiệu lực — V2 II.1: lưới gập + Nhập điểm tại chỗ |
| 9.2-18 | Chip hàng lớp: quá hạn luôn đầu, bỏ "+n"? | (1) | Mockup 1 khung 3 (9.1-1) |
| 9.2-19 | Chuyển lớp: hàng nút ngày → ô chọn tuần? | (1) | 06/10-NGAY → lệch phải sửa (X-20) |
| 9.2-20 | Bỏ dải 3 ô số đầu Lịch Test? | (2) | Gộp Q-C1 |
| 9.2-21 | Lưới gọn ở Lịch Test (em + cột còn nợ)? | (2) | Gộp Q-C1 |
| 9.2-22 | Năm chỉ ở đầu cột / khi khác năm (thay C20)? | (3) | Có — đảo C20 (X-17; 4.7 A1) |
| 9.2-23 | Bỏ "vào muộn", email dưới tên (mockup 4)? | (1) | 9.1-1 |
| 9.2-24 | Dán Excel W / S nhận 4 cột tiêu chí; ô lỗi chỉ chặn ô đó? | (3) | Có, chỉ ở lưới theo lượt (12.3) |
| 9.2-25 | Người chấm S mặc định = GV có S; QL nhập hộ phải chọn người chấm? | (2) | Gộp 12.9-6 |
| 9.2-26 | Progress lớp thường hiện chip SOS theo số môn trượt (§20.17)? | (1) | Rulebook §20.17 đã chốt → lệch phải sửa |
| 9.2-27 | Bỏ `/nhap-diem`; gộp hai panel xuất điểm? | (2) | Trang → Q-C1; xuất → 12.9-18 |
| 9.2-28 | Báo cáo: SOS theo lớp đếm HV trong kỳ hay lượt; SOS tạm? | (1) | 9.1-4: khối "tại hôm nay" dùng "SOS hiện tại"; số trong kỳ ở Phân tích; SOS tạm ghi riêng "trong đó n tạm" (X-23) |
| 9.2-29 | Khối Đạt / Chưa đạt lớp thường ở Báo cáo? | (2) | Gộp Q-C2 |
| 9.2-30 | Phân tích GV theo khung 4c? | (1) | 9.1-1 (X-35) |
| 9.2-31 | Số bấm được = ô viền? | (1) | V3 II.1.1 bỏ gạch chấm; dáng "ô số" (12.9-12) |
| 9.2-32 | Báo cáo là tab Phân tích + nút "Chiếu"? | (1) | Vị trí đã chốt 19/10-BC; "Chiếu" → Q-C2 |
| 9.2-33 | TVV / CX thấy bảng "Quá hạn theo GV"? | (1) | Không — 11/10-TVV "CX xem Phân tích trừ phần GV"; TVV như CX |
| 9.2-34 | Tutor: nút chính; mặc định "Tất cả"? | (3) | "Thêm tutor"; "Tất cả" khi không ai cần chú ý — đảo mockup tutor phần nút (X-34; 4.7 A7) |
| 9.2-35 | Quản trị thêm / sửa chi nhánh trên web? | (3) | Không làm trong đợt này (không có yêu cầu; MP "không thêm tính năng chỉ vì có thể") |
| 9.2-36 | Một tên cho bài quá hạn chưa có điểm? | (3) | "bài quá hạn chấm" (chữ chưa chốt) |
| 9.2-37 | Vạch trái 3 px hàng nhóm — giữ? | (3) | Giữ vạch nhưng đổi sang **màu trung tính**; vạch trái màu nhấn dành cho "đang chọn" (X-19; 4.7 A11) |
| 9.2-38 | Nút ⋯ ô lớp thường luôn hiện mờ? | (1) | Hết hiệu lực — V3: bỏ ⋯ khỏi ô (12.1) |

### 4.2 Mục 10.7 (12 câu)

| Mã | Câu (rút gọn) | TT | Trả lời / gộp vào / mặc định |
|---|---|---|---|
| 10.7-1 | Bố cục Tổng quan B thay A? | (4) | → **Q-A2** |
| 10.7-2 | Phân vai: việc QL chỉ ở Tổng quan; Công việc QL chỉ việc GV? | (4) | → **Q-A1** (MP XI.2; gộp v4a Q1, Q2, v4c Q1) |
| 10.7-3 | Bỏ dải "HV cần chú ý" (thay Q6a)? | (3) | Bỏ; số chỉ ở hàng tổng, chỉ xem — đảo Q6a (X-24; 4.7 A2) |
| 10.7-4 | Số "Lớp cần chú ý" bấm cả ô → mở rộng hàng lớp tại chỗ, bỏ panel tên? | (3) | Có (MP III.5, IV.4); mockup duyệt |
| 10.7-5 | Hệ quả bỏ Trễ chấm: bỏ "n bài trễ · n GV"; "Tuần này" một hàng ô tuần? | (1) | V1 II.4; "Tuần này" theo mockup 3 |
| 10.7-6 | Thang "làm tại chỗ" 0–5 thành luật toàn web? | (3) | Có — hiện thực MP III.5; ghi DESIGN.md / CLAUDE.md ở GĐ0 |
| 10.7-7 | Phông + cỡ chữ? | (3) | MP III.2 "font nào cũng được" → Be Vietnam Pro + chữ số Inter, ô 15 / lưới 14 / nhãn 13 / tối thiểu 12 (thay C09) |
| 10.7-8 | Overall FT tô màu; KCK trung tính + "KCK"? | (3) | Có (13/10-KCK) |
| 10.7-9 | Bảng không bấm được bỏ hover? | (3) | Có; "dò hàng" nhẹ cho bảng ≥ 8 cột |
| 10.7-10 | Đổi tên "Học viên & Lớp" thành "Lớp/HV"? | (1) | Không — MP 0 "thuật ngữ đã chốt giữ nguyên" (X-38) |
| 10.7-11 | 375: QT / QL gom Phân tích + Tutor vào "Thêm"? | (3) | Có (thanh dưới ≤ 5 nút) |
| 10.7-12 | Gửi lại ảnh 1–5 vòng 1? | (1) | MP IV mô tả lại, khớp cách PTA đoán → không cần gửi |

### 4.3 Mục 11.8 (18 câu)

| Mã | Câu (rút gọn) | TT | Trả lời / gộp vào / mặc định |
|---|---|---|---|
| 11.8-1 | BANG-0 + BANG-1 vào GĐ1 trước deploy? | (2) | Gộp Q-E1 |
| 11.8-2 | LT-SV ("tháng = đã thi", việc Chốt ngày thi) ở GĐ1? | (2) | Gộp Q-E1 |
| 11.8-3 | 5 điểm luật lịch thi: (a) có tuần chưa ngày = Chưa chốt ngày (b) "đến tháng" = mùng 1 (c) ai làm việc Chốt ngày (d) dời tháng mặc định tháng sau (e) lớp thường có trạng thái B + việc? | (4) | (a)(e) → **Q-C3** · (c) → Q-A3 · (b) đúng lời "khi đến tháng" (PTA) · (d) PTA (UX) |
| 11.8-4 | Căn cột điểm: C06 ↔ mockup 6 khung 3? | (3) | Căn giữa + ký hiệu trước số + ô rộng cố định; sửa mockup 6 khung 3 (X-01; 4.7 A5) |
| 11.8-5 | Chữ cho Test ("Tuần Test", "Đã làm bài", "Không làm bài", "Huỷ kỹ năng", "Dời lịch Test", "Test lại", tab "Kết quả Test"); sửa thuật ngữ 01/10, Rulebook, mockup 4 / 5? | (3) | Có — hiện thực V2 I.5 (X-37; 4.7 A8); riêng "Huỷ kỹ năng" (trùng tên nút trong mã) → trạng thái "Đã huỷ · vắng 2 lần", nút "Bỏ khỏi đợt" (05 mục 4.5) |
| 11.8-6 | Lịch thi bỏ "Giữ tháng" + "Cần xác nhận", trạng thái tự suy? | (4) | "Cần xác nhận" → **Q-C4** · "Giữ tháng" bỏ: trạng thái "Chưa chốt ngày" tự suy theo V2 I.6.3 (PTA) |
| 11.8-7 | Lịch thi lọc theo tháng (ngoại lệ)? | (1) | MP III.8 + XVI.A (ngoại lệ tháng thi); mặc định tháng này → tháng sau (PTA) |
| 11.8-8 | Bỏ góc "Cần làm"? | (4) | → **Q-A4** · 21/10: bộ lọc trong bảng Tất cả, giữ tên "Cần làm" (X-81) |
| 11.8-9 | Xuất Excel phương án 3? | (4) | → **Q-E2** |
| 11.8-10 | Mặc định khoảng thời gian từng trang | (1) | Hết hiệu lực — thay bởi 12.9-17 |
| 11.8-11 | Ý thức lớp phương án A? | (3) | A; mockup duyệt (Rulebook §19 không đổi) |
| 11.8-12 | Hồ sơ HV Ý thức: bỏ thanh việc trong tab, bỏ hai tab con, hai cột, Nhật ký gập? | (3) | Có; mockup duyệt |
| 11.8-13 | Duyệt hệ thống bảng một lần (bảng mẫu + ảnh cặp 3 bảng)? | (1) | 9.1-2 (ảnh cặp trước merge); cách gom lần duyệt ở 07 |
| 11.8-14 | W1 / W2 có ✓ / ✗; một dòng phụ; bỏ "W1 · W2" dưới W? | (1) | Mockup 6 khung 3 (9.1-1); chữ phụ PTA |
| 11.8-15 | Thanh gập chỉ ở tab Học viên; mở luôn hộp ô trống đầu; QL xếp lịch MT tại lưới? | (3) | Có — hiện thực V2 II.1; không đổi quyền xếp lịch |
| 11.8-16 | Phối hợp SOS một nút chính / em, việc xong gập? | (3) | Có |
| 11.8-17 | Chip "8 chờ duyệt" mở khung phải; Góp ý tuần GV chỉ ô môn mình; "Kết quả lớp trước"? | (3) | Có — chỉ đổi hiển thị; không đổi quyền ghi ở đợt này |
| 11.8-18 | Ảnh 5 (`case` trùng) sửa ở GĐ1 + cảnh báo esbuild làm check đỏ? | (2) | Gộp Q-E1 |

### 4.4 Mục 12.9 (22 câu)

| Mã | Câu (rút gọn) | TT | Trả lời / gộp vào / mặc định |
|---|---|---|---|
| 12.9-1 | Vá bộ chọn tự đóng ở GĐ1 + hook "bấm ra ngoài" chung? | (1) | Sửa = V3 II.6 đã chốt; thời điểm → Q-E1 |
| 12.9-2 | "Ba khung chấm Test" là ba khối Lịch Test hay ba nơi chấm? | (2) | Gộp Q-C1 (PTA xử lý cả hai nghĩa) |
| 12.9-3 | Chấm Test gom theo hạn thay ba khối (giữ luật chia khối)? | (4) | → **Q-C1** |
| 12.9-4 | Một nguồn Công việc ↔ Test + một nhãn "MT2 · thi W2 SEP · hạn …"? | (2) | Gộp Q-C1; nhãn hạn bỏ thứ ("hạn 16/09") — X-18 |
| 12.9-5 | Chấm theo tuần thi, xem / nhập cả lớp theo lượt; bỏ `/nhap-diem`, `/bang-diem-thuong`? | (2) | Gộp Q-C1 |
| 12.9-6 | Speaking chấm chéo: nhóm riêng, chữ "chấm chéo", người chấm mặc định = GV có S, QL nhập hộ chọn người chấm, hạn chỉ để nhìn? | (3) | Có — giữ T18 (không tính nợ; trễ tính cho người chấm thật); chỉ đổi chữ, cách đếm, mặc định người chấm |
| 12.9-7 | LUẬT: GV lớp thường dời lịch một môn? | (1) | **Đã trả lời** bởi 14/10-Q13 "dời lịch môn chỉ QL" (= 09/10); sửa Rulebook §20.9 + chặn máy chủ (X-31) |
| 12.9-8 | Lớp thường dùng hộp chấm như FT; bỏ "Nhận xét", "Điền cả cột", ⋯ trong ô; thay HD2? | (1) | V3 I.2 đã chốt "trong hộp chấm"; cách làm A = PTA (X-02; 4.7 A3) |
| 12.9-9 | "✗ 17/25", không % trong ô; Progress = chip SOS viền; hồ sơ HV bỏ chip nền vàng? | (3) | Có; sửa mockup 2 khung 1a (X-33); chip theo §20.17 |
| 12.9-10 | Excel giữ ở lưới theo lượt; lớp thường "theo từng MT" = theo từng bài; ẩn ở điện thoại; bắt buộc lượt? | (1) | V3 I.5 đã chốt; diễn giải lớp thường + ẩn 375 = PTA (4.7 B14) |
| 12.9-11 | "Tình trạng chấm" cho QL / QT? | (2) | Gộp Q-C1 |
| 12.9-12 | Một dáng "ô số" thay gạch chấm? | (3) | Có |
| 12.9-13 | Luật chọn panel L1 + mẫu panel C? | (3) | Có; mockup duyệt |
| 12.9-14 | Báo cáo thuần T1 (+ ngoại lệ Thi thật, khối "tại")? | (1) | V3 II.3 + XVI.A đã chốt; ngoại lệ PTA |
| 12.9-15 | Ý thức Y1: bỏ bảng "HV cần chú ý" + sheet Excel; "báo trễ" ở đâu? | (3) | Có — chỉ bỏ khỏi hiển thị (MP IX.4); ảnh "báo trễ" → 4.8 |
| 12.9-16 | Báo cáo một PR màn + "Chiếu" + "bài chấm trễ trong kỳ" + "Theo chi nhánh"? | (4) | → **Q-C2** |
| 12.9-17 | Thời gian: định nghĩa "Toàn bộ", mặc định theo bảng, phạm vi "Toàn bộ", trần 52 tuần, hàng nút trong lịch? | (1) | MP III.8: "Toàn bộ" CHỈ ở Phân tích (X-06); mặc định + trần = PTA; hàng nút bỏ (X-20) |
| 12.9-18 | Xuất E1 (từ điển cột, mặc định = bộ lọc trang, mọi xuất qua máy chủ + nhật ký)? | (3) | Có — đúng MP IX.5; nhật ký để chống lộ dữ liệu |
| 12.9-19 | Hiệu quả PA → "Vấn đề & PA" (H2)? | (3) | H2; không đổi logic PA; mockup duyệt; dữ liệu → 4.8 |
| 12.9-20 | Tutor F1 + B1? | (3) | Có; dữ liệu → 4.8 |
| 12.9-21 | Bổ sung 11.1a (4 kiểu cột, cấm điều khiển trong tiêu đề)? | (3) | Có |
| 12.9-22 | Rulebook sửa chữ 3 chỗ lệch mã? | (1) | Đã có luật: T19 (06/10), 14/10-OV12, PR-LT3 đã merge → chỉ sửa chữ (X-32) |

### 4.5 Câu mới từ MP và lời bổ sung 21/10 (33 câu)

| Mã | Câu (rút gọn) | TT | Trả lời / gộp vào / mặc định |
|---|---|---|---|
| MP-01 | L1: QL từ chối xử lý (WL 3 / ngoài thang) sau khi việc TVV đã sinh? | (4) | → **Q-D1** |
| MP-02 | L2: hạn 5 ngày lịch hết lúc nào? | (3) | Hết 23:59 giờ VN ngày (lưu + 4), tính cả ngày lưu; vd lưu T2 14/09 10:00 → hết 23:59 T6 18/09 (X-44; 4.7 B1). **Đổi so với bản nháp** (Q-D2 nghỉ) |
| MP-03 | Việc TVV: em không có TVV / TVV nghỉ → ai nhận? | (4) | → **Q-D3** |
| MP-04 | Việc TVV: chưa liên hệ được phụ huynh → trạng thái? | (2) | Gộp Q-D3 |
| MP-05 | Việc TVV: GVCN sửa xử lý sau khi lưu → một việc hay việc mới; hạn có dời? | (2) | Gộp MP-02: một việc, nội dung cập nhật, hạn không dời; TVV đã báo PH thì nhận chuông "nội dung đã sửa" |
| MP-06 | Việc TVV: trường form, hiển thị, trạng thái | (3) | PTA đề xuất ở 05 + mockup: tối thiểu, không chép lại dữ liệu GVCN đã ghi |
| MP-07 | TVV làm việc ở đâu (11/10: không Công việc) + nhận nhóm việc nào (XII.1)? | (4) | Nhóm việc → **Q-A3**; nơi làm gộp **Q-A1** |
| MP-08 | L3: khoá nào còn giữ (lớp đã kết thúc, Lưu trữ)? | (4) | → **Q-B1** |
| MP-09 | L3 / XIII.3: sửa dữ liệu ĐÃ được duyệt có phải duyệt lại? | (4) | → **Q-B2** |
| MP-10 | L4: "-" lần 1 ở lịch MT tuần cũ dời sang tuần nào? | (4) | → **Q-B3** · 21/10: hết hiệu lực — MT cũ "-" = huỷ ngay (X-75, X-76) |
| MP-11 | L4: "chuỗi dời" gồm những lần nào? | (4) | → **Q-B4** · 21/10: đếm theo tuần, Khôi phục = 2 lần, duyệt thêm = +1 (X-77) |
| MP-12 | L4 có áp cho Test lớp thường? | (1) | Không — luật ghi "cho MT"; lớp thường giữ 14/10-Q1 |
| MP-13 | XIV.3: tên + bảng chuyển trạng thái huỷ lịch / huỷ MT / huỷ điểm / dời / gửi duyệt | (3) | PTA lập ở 05 theo 19/10-M6, T3, T21, T22 (X-28) |
| MP-14 | XIV.1: đường "huỷ điểm → Hồ sơ MT → khôi phục → mới chuyển lịch" | (3) | PTA đếm bước trên demo rồi đề xuất (T20 đã cho dời bài có điểm) |
| MP-15 | XI.2: vai trò Tổng quan ↔ Công việc | (2) | Gộp Q-A1 (neo 10.7-2) |
| MP-16 | IV.8: hộp duyệt trên, trái / phải | (2) | Gộp Q-A2 (neo 10.7-1) |
| MP-17 | V.3: bảng "Cần làm" — cột trọng tâm, không đổi logic | (2) | Gộp Q-A4 (neo 11.8-8) |
| MP-18 | V.4: xuất A / B; nếu A thì ưu tiên lớp đang mở hay bộ lọc | (2) | Gộp Q-E2 (neo 11.8-9) |
| MP-19 | V.6: "Cần xác nhận" có nghĩa nghiệp vụ khác? | (2) | Gộp Q-C4 (neo 11.8-6) |
| MP-20 | XII.1: "Thiếu thông tin" tính trường nào? | (4) | → **Q-D4** (X-26) |
| MP-21 | 9.1-3: gói sửa trước deploy gồm những gì sau vòng 2–4? | (4) | → **Q-E1** |
| MP-22 | XI.5: nút "Phân công…" ở việc Thêm PA SOS 3 | (3) | Đã kiểm (V4A-05): lỗi gốc — máy chủ trả lý do thiếu người, tự gán chủ Case theo luật tạo Case; không chỉ ẩn nút (X-63; 4.7 A13) |
| MP-23 | XI.6: bấm dòng phụ mở rộng trong danh sách, che đầu mục | (3) | Lỗi lưới CSS (V4A-06); danh sách hẹp không mở rộng tại dòng — chi tiết ở khung phải, giữ tên việc + em (X-62; 4.7 A12) |
| MP-24 | VIII.7: Admin / QL tra điểm, tình trạng chấm | (2) | Gộp Q-C1 |
| MP-25 | IX.3: mockup Báo cáo nâng phần nào | (2) | Gộp Q-C2 |
| MP-26 | X: Tutor khi thiếu dữ liệu | (3) | Tách lỗi UI / giả thuyết; không tạo luật mới; seed + dữ liệu thật (4.8) |
| MP-27 | GĐ5 "xuyên đêm" ↔ 9.1-2 | (1) | Không xung đột thật (X-09) |
| MP-28 | MP 0: UI có xứng 35/40? | (1) | Không — ~23/40 (tài liệu chính 2.2); chấm lại ở GĐ4 |
| MP-29 | III.9: hoàn tác / khôi phục cho thao tác nào | (3) | Hoàn tác 8–10 s cho thao tác đảo được (riêng lần xử lý vi phạm đã lưu: không Hoàn tác — 4.7 B15); khôi phục + lịch sử C22 cho dữ liệu đã lưu ("Khôi phục điểm" — X-56); xác nhận chỉ khi hậu quả lớn |
| MP-30 | XV: bản đồ hành trình theo vai | (3) | PTA lập ở 05 |
| MP-31 | 21/10: lần xử lý được QL **duyệt thu hồi** (hoặc "không tăng bậc" bị từ chối) khi việc TVV đã sinh | (2) | Gộp Q-D1 |
| MP-32 | 21/10: sửa chi tiết một lần xử lý đã lưu (ngày, ghi chú, tệp) có phải duyệt? Đổi loại xuống bậc thấp hơn / giữ bậc? | (3) | Sửa chi tiết: không duyệt, có lịch sử (L3). Đổi loại làm **không tăng bậc** hoặc hạ bậc = trường hợp (b) của 21/10 → gửi QL duyệt kèm lý do |
| MP-33 | 21/10: rút một **đề xuất còn chờ QL** có tính là "thu hồi xử lý"? | (3) | Không — đề xuất chưa có hiệu lực; rút được, có lịch sử (X-51; 4.7 B7) |

### 4.5b Câu của 3 báo cáo nghiên cứu vòng 4 (v4a 4 · v4b 10 · v4c 2 → 18 dòng; v4b-Q5 tách 3 ý)

| Mã | Câu (rút gọn) | TT | Trả lời / gộp vào / mặc định |
|---|---|---|---|
| v4a-Q1 | Phân vai: việc TÔI ở trang đầu; Công việc QL = theo dõi GV + giao việc + lịch sử duyệt | (2) | Gộp **Q-A1** |
| v4a-Q2 | Việc TVV: hàng đợi trên Tổng quan TVV (T1) hay mở Công việc (T2)? | (2) | Gộp **Q-A1** (khuyến nghị T1 của v4a) |
| v4a-Q3 | Case không người phụ trách: tự gán theo luật tạo Case, bỏ việc "Chọn người phụ trách" | (3) | Có — dùng đúng luật đang chạy (GV môn → GVCN), có lịch sử; chỉ lớp thiếu GV môn mới có "Phân công GV môn" (X-63; 4.7 A13 — đảo OV-13b) |
| v4a-Q4 | Bỏ "ghi nhanh dưới dòng" Kết quả PA ở Công việc (khung OV-13 §1 đã duyệt) | (3) | Có — khung phải như mọi việc, form gọn, vẫn 3 bấm (X-62; 4.7 A12 — đảo mockup) |
| v4b-Q1 | Lần xử lý cần QL duyệt: sinh việc TVV lúc gửi hay lúc "Đã thực hiện"? | (1) | **Luật 1 đã trả lời: lúc GVCN lưu** (không đợi duyệt) — không theo khuyến nghị v4b (X-53); biên QL từ chối → Q-D1 |
| v4b-Q2 | PH không liên hệ được: TVV được kết thúc việc? | (2) | Gộp **Q-D3** |
| v4b-Q3 | Em chưa có TVV → QL chi nhánh; TVV quá hạn không thẻ Báo QL? | (2) | Gộp **Q-D3** |
| v4b-Q4 | MT cũ "-" lần 1 dời sang tuần nào? | (2) | Gộp **Q-B3** (PTA khuyến nghị tuần kế tính từ hôm nay — ngược v4b) · **21/10: MT cũ "-" = huỷ ngay — hết hiệu lực (X-75, X-76)** |
| v4b-Q5a | Bấm nhầm ngay sau lưu xử lý: Hoàn tác 10 s không qua QL? | (3) | Không áp — bấm nhầm cũng gửi "Thu hồi…" qua QL (đúng chữ L5; 05 mục 5.3) (X-58; 4.7 B15) |
| v4b-Q5b | Thu hồi được duyệt mà TVV đã báo PH: chỉ chuông "để biết"? | (2) | Gộp **Q-D1** |
| v4b-Q5c | Thu hồi / không tăng bậc: chỉ bắt lý do, tệp tuỳ chọn? | (3) | Có — đúng chữ L5 "kèm lý do" (X-59; 4.7 B6) |
| v4b-Q6 | "Cùng chuỗi dời" có bắt đầu lại sau khi QL Khôi phục? | (2) | Gộp **Q-B4** · **21/10: có — Khôi phục đặt lại, được dời 2 lần (X-77)** |
| v4b-Q7 | MT0 có theo luật "-" của MT? | (3) | Có — MT0 là MT, theo L4 trong giới hạn MT0; vượt → thẻ QL (X-68; 4.7 A16) |
| v4b-Q8 | "Báo PH qua TVV" lớp thường chuyển thành việc TVV? | (2) | Gộp **Q-A3** (trong khuyến nghị ①) · **21/10: không chuyển, giữ như nay (X-80)** |
| v4b-Q9 | Kết quả thi + Chọn bước tiếp: một người giữ = TVV? | (2) | Gộp **Q-A3** (Chọn bước tiếp trong ①; Kết quả thi thật là lựa chọn ③) · **21/10: có — cả hai là việc TVV (X-80)** |
| v4b-Q10 | Nới Tutor > 24 giờ + sửa chữ kết quả PA khi Case xong? | (2) | Gộp **Q-B1** phần H21; H28 (Tutor) nới theo L3, không hỏi (4.7 A19) |
| v4c-Q1 | Việc TVV đặt ở đâu (v4c khuyến nghị mở Công việc cho TVV) | (2) | Gộp **Q-A1** — PTA khuyến nghị theo v4a (Tổng quan TVV); cách của v4c là lựa chọn ② |
| v4c-Q2 | Hàng chip tuần có tính là hàng nút bị cấm 06/10? | (3) | Có — bỏ hàng chip, ô tuần gõ được + lịch, điền sẵn tuần đề xuất (X-20; 4.7 B12) |

### 4.5c Câu của báo cáo v4d (21/10 — Case nhiều kỹ năng FB-4-35 · chuông / nhắc việc FB-4-36; 7 câu, không câu PHẢI HỎI)

| Mã | Câu (rút gọn) | TT | Trả lời / gộp vào / mặc định |
|---|---|---|---|
| v4d-Q1 | Tạo Case nhiều kỹ năng: mô tả chung hay riêng từng kỹ năng? | (3) | Riêng — mỗi Case tên + mô tả nói đúng vấn đề kỹ năng đó (Rb §4.1); người đọc sau là GV môn đó (4.7 C21) |
| v4d-Q2 | Lô lỗi một phần: lưu phần đúng hay tất cả-hoặc-không? | (3) | Tất cả-hoặc-không (một giao dịch); trùng hạng mục / Case chờ xác nhận báo ngay khi chọn chip; giữ chữ, lỗi trên đúng thẻ (4.7 C21) |
| v4d-Q3 | Mức độ (Bình thường / Gấp) chung hay riêng từng Case? | (3) | Chung cho lô; khác thì sửa từng Case sau (`suaCase` đã cho) |
| v4d-Q4 | "Đã xong từ trước" (ghi bù) có chọn nhiều kỹ năng? | (3) | Không — giữ một kỹ năng (ít dùng, chỉ môn mình dạy — C02) |
| v4d-Q5 | Có tự bật hộp nhắc việc khi đăng nhập ("1 ô hiện lên")? | (3) | Không — trang đầu GV đã là danh sách việc; hộp chuông bấm mở (X-71; 4.7 A20) |
| v4d-Q6 | Chuông "Cần làm" = dòng thông báo hay danh sách việc sống? | (3) | Danh sách việc cùng hàm hàng đợi trang đầu của vai; Để biết = tin một chiều (X-72; 4.7 C22) |
| v4d-Q7 | Nhắc qua email / Zalo như Base? | (1) | Đã có luật: chỉ chuông trong ứng dụng (Rb §20.11) |

### 4.6 Tổng đếm

| Nhóm | (1) Đã trả lời / hết hiệu lực | (2) Gộp | (3) PTA tự quyết | (4) PHẢI HỎI | Tổng |
|---|---|---|---|---|---|
| 9.2 | 18 | 11 | 9 | 0 | 38 |
| 10.7 | 3 | 0 | 7 | 2 | 12 |
| 11.8 | 4 | 3 | 7 | 4 | 18 |
| 12.9 | 7 | 4 | 9 | 2 | 22 |
| MP + 21/10 | 3 | 10 | 11 | 9 | 33 |
| Báo cáo vòng 4 (v4a, v4b, v4c) | 1 | 11 | 6 | 0 | 18 |
| Báo cáo v4d (21/10) | 1 | 0 | 6 | 0 | 7 |
| **Tổng** | **37** | **39** | **55** | **17** | **148** |

17 dòng (4) ↔ 17 câu ở mục 5, một đối một: MP-21 → Q-E1 · 10.7-2 → Q-A1 · 10.7-1 → Q-A2 · 11.8-8 → Q-A4 · MP-01 → Q-D1 · MP-03 → Q-D3 · MP-07 → Q-A3 · MP-08 → Q-B1 · MP-09 → Q-B2 · MP-10 → Q-B3 · MP-11 → Q-B4 · 12.9-3 → Q-C1 · 12.9-16 → Q-C2 · 11.8-3 → Q-C3 · 11.8-6 → Q-C4 · MP-20 → Q-D4 · 11.8-9 → Q-E2.
So với bản nháp: Q-D2 (MP-02) chuyển PTA tự quyết (4.7 B1); Q-A3 chỉ còn bộ việc TVV + người giữ (nơi làm gộp Q-A1); Q-B1 thu về khoá "vì đóng hồ sơ" (+ H21), Tutor 24 giờ chuyển PTA (4.7 A19); Q-B3 đổi khuyến nghị sang tuần kế tính từ hôm nay (khớp 05 mục 4.4); MT0 và "Hoàn tác sau lưu xử lý" là PTA tự quyết (4.7 A16, B15) — không thêm câu mới.
Bổ sung 21/10 (v4d, mục 4.5c): 7 câu — 1 đã có luật, 6 PTA tự quyết (4.7 A20, B16, C21, C22); **không thêm câu PHẢI HỎI** (vẫn 17).
**21/10 (vòng phê duyệt cuối): 17/17 câu (4) đã có câu trả lời** (mục 5, 2.9); Q-C1 còn chờ chủ SP duyệt mockup.

### 4.7 PTA tự quyết — danh sách đủ (chủ SP có quyền phủ quyết khi duyệt)

**Chủ SP 21/10: "Đồng ý cả gói"** — 63 mục dưới đây thành quyết định (sửa theo câu trả lời 21/10 ở chỗ chạm: B10).

Ba nhóm: **A** đảo một quyết định / mockup đã duyệt / phương án chủ SP nêu — **phản đối nếu không đồng ý** · **B** diễn giải luật / quyết định đã chốt (chỗ luật cho làm rõ hoặc chữ chưa nói rõ) — **phản đối nếu PTA hiểu sai** · **C** UX / thẩm mỹ mới, không đảo gì (để biết). Mặc định của 55 câu trạng thái (3) nằm ở cột cuối 4.1–4.5b; ba bảng dưới gom đủ, không lặp chi tiết; khớp 05 mục 10 và 11.

**A — Đảo quyết định / mockup / phương án cũ (20)**

| # | Đảo cái gì | Thành gì | Cơ sở |
|---|---|---|---|
| A1 | C20 "luôn ghi năm `W4 AUG/2026`" | Năm ở đầu cột / khi khác năm; tệp xuất giữ năm | thẩm mỹ; luật 30/09 mã tuần ngắn (X-17) |
| A2 | Q6a dải "HV cần chú ý" (18/10) | Bỏ dải; số ở hàng tổng, chỉ xem | MP IV.1–2 (X-24) |
| A3 | HD2 lớp thường gõ thẳng đúng / tổng (11/10) | Gõ số trên ô mở hộp chấm có nhận xét tuỳ chọn (Enter = em tiếp); 375 giữ ô to | V3 I.2 đã chốt (X-02) |
| A4 | C09 thang chữ 12/13/14/16/20, ô bảng 13 | Ô nhập 15 · lưới 14 · nhãn 13 · tối thiểu 12; Be Vietnam Pro + chữ số Inter | V1 I.1, MP III.2 (X-13) |
| A5 | Mockup 6 khung 3: điểm căn trái | Căn giữa (C06) + ký hiệu trước số, ô rộng cố định | thẩm mỹ; C06 là lời chủ SP (X-01) |
| A6 | Mockup 2 khung 1a: "✗ 16/25 64 %" trong ô | "✗ 17/25", % ở hộp chấm | thẩm mỹ (X-33) |
| A7 | Mockup tutor 20/10: nút chính "Tải danh sách" | "Thêm tutor" là nút chính | thẩm mỹ (X-34) |
| A8 | Thuật ngữ 01/10 C-028 / C-035 / C-036 (chữ "thi" cho Test) | Chữ Test: "Đã làm bài", "Không làm bài"…; C-036 "Đã huỷ phần thi" → trạng thái **"Đã huỷ · vắng 2 lần"**, nút bỏ kỹ năng **"Bỏ khỏi đợt"** (không dùng "Huỷ kỹ năng" — trùng tên nút trong mã) | V2 I.5 đã chốt (X-37); 05 mục 4.5 |
| A9 | Mockup 1 / 3 / 6 khung 10 (Công việc đầu menu) + khối Trễ chấm | Sửa mockup theo V1 | V1 đã chốt (X-25) |
| A10 | Mockup 2 khung "Sau" (Công việc nhóm theo loại, duyệt 18/10) | Vẽ lại Công việc (dòng 3 vùng, nhóm theo vai); dáng khu việc theo Q-A1, Q-A2 | MP XI.1 (X-64) |
| A11 | Đang chọn = viền khung 2 px (DESIGN.md, mockup 1 §1d 17/10; bản nháp 02 cũng giữ) | Nền nhấn nhạt + vạch trái 3 px, khác hẳn vòng focus 2 px; vạch trái hàng nhóm sang màu trung tính | viền 2 px trùng vòng focus (V4C-04); 10.1 (X-19) |
| A12 | Mockup OV-13 §1: Kết quả PA ghi nhanh dưới dòng ở Công việc | Mở ở khung phải như mọi việc, form gọn mặc định (vẫn 3 bấm) | MP XI.6, ảnh v4-1, v4-3 (X-62) |
| A13 | OV-13b: việc "Chọn người phụ trách" + "Phân công…" mở cả Thông tin lớp | Tự gán chủ Case theo luật tạo Case (GV môn → GVCN), lịch sử, ghi bù dữ liệu cũ; chỉ lớp thiếu GV môn mới có hộp "Phân công GV môn" | việc hiện không bao giờ xong (X-63) |
| A14 | Phương án chủ SP MP IV.3 (chưa chốt): Thêm PA ngay ở dòng HV, mở rộng tại chỗ | Áp ở bảng rộng (Lớp cần chú ý, Đang SOS, hồ sơ lớp); hàng đợi hẹp dùng khung phải; cùng một form | ảnh v4-1, v4-3: mở rộng trong danh sách hẹp che tiêu đề (X-39) |
| A15 | Tên việc trong luật 1 "Ghi nhận kết quả xử lý vi phạm" | Tên dòng **"Ghi kết quả xử lý · Report 2 · {em}"**, nút "Ghi kết quả" — giữ ý chữ chủ SP, tránh chữ "Ghi nhận" (đã là thao tác GVCN "Ghi nhận vi phạm mới"); luật không đổi | một khái niệm một tên (05 mục 5.5) |
| A16 | MT0 (lớp thường lên FT): "-" không chốt, không dời (mã nay) | Theo L4 trong giới hạn MT0 (≤ T2 tuần 2 FT, luôn trước MT1); vượt → thẻ QL | PTA hiểu MT0 là MT (v4b Q7; X-68; 05 mục 4.4) |
| A17 | Đề xuất v4b (E5): GVCN "Chưa thực hiện" → việc TVV chưa ghi tự huỷ | **Giữ** việc TVV — biện pháp vẫn đang được duyệt | 05 mục 5.3 |
| A18 | (chưa có luật) GVCN rút đề xuất còn chờ QL khi việc TVV đã sinh (L1) | Xử lý như QL từ chối (theo câu trả lời Q-D1) | 05 mục 5.3; X-51 |
| A19 | Tutor sửa / xoá nhận xét chỉ trong 24 giờ (thiết kế 19/10, giữ 15/10 — H28) | **Sửa mọi lúc**, lưu trước → sau; xoá vẫn trong 24 giờ | L3 — khoá "vì đã lưu" (05 mục 6.2; X-67) |
| A20 | Góp ý GV trung tâm (FB-4-36, B — chủ SP chuyển): "**1 ô hiện lên**, list thông báo nhắc việc như Base" | **Không** tự bật hộp khi đăng nhập; hộp chuông (bấm mở) thành hộp "Nhắc việc" một nguồn (C22); trang đầu GV vẫn là danh sách việc | luật 08/10 không thêm bước (đóng hộp mỗi lần vào); Rb 20.10 (X-71; 05 mục 2.7) |

**B — Diễn giải luật / quyết định đã chốt (16)**

| # | Luật | PTA hiểu / làm | Cơ sở |
|---|---|---|---|
| B1 | L2 — giờ hết hạn | 5 ngày lịch tính cả ngày lưu → **hết 23:59 giờ VN ngày (lưu + 4)**. Vd GVCN lưu **T2 14/09 lúc 10:00** → hạn hết **23:59 T6 18/09**, quá hạn từ T7 19/09; lưu T5 15/10 → hết 23:59 T2 19/10 (có T7, CN). Theo lần lưu đầu; sửa không dời hạn; em Tạm dừng thì dừng hạn. Muốn đủ 5 × 24 giờ → đổi thành "lưu + 5" (một hằng số) | cùng quy ước hạn hệ thống (Rb 708, Q27-5; `shared/domain/cases.ts:766-769`) (X-44) |
| B2 | L1 — thời điểm | Sinh **ngay** khi GVCN (hoặc QL thay) lưu xử lý, kể cả lần xử lý đang chờ QL duyệt (WL 3, ngoài thang, không tăng bậc) — không theo v4b Q1 | chữ L1 "không cần đợi một bước phê duyệt khác" (X-53) |
| B3 | L1 — phạm vi | Ghi nhận / Bỏ ghi nhận / Khai bậc không sinh việc; lần xử lý trước ngày bật không sinh; "Chọn nhiều" n em → n việc; một em ≥ 2 lần chưa báo → một form ghi chung | V4B-01 6a, 6d |
| B4 | L5 — thu hồi | "Thu hồi…" thay "Xoá lần xử lý" (chỉ lần mới nhất, như nay); chờ QL thì lần xử lý vẫn tính; duyệt → "Đã thu hồi", giữ dòng + lịch sử, bậc tính lại; QL tự thu hồi = làm thẳng, lý do bắt buộc, nhật ký "tự duyệt" | L5 + L3 lịch sử (X-49) |
| B5 | L5 — không tăng bậc | Link "Không tăng bậc…" cạnh bậc máy điền → chọn bậc hiện tại hoặc thấp hơn + lý do → đi đường "Đề xuất QL duyệt" sẵn có; GVCN lỡ lưu bậc kế → một thẻ Thu hồi có ô "ghi lại thành không tăng bậc" | L5 (X-49) |
| B6 | L5 — bằng chứng | Chỉ bắt **lý do**; tệp tuỳ chọn (WL 3 / ngoài thang giữ bắt tệp) | chữ L5 "kèm lý do" (X-59) |
| B7 | L5 — cái không phải thu hồi | Rút đề xuất còn chờ QL · "Chưa thực hiện" (bỏ "Đã thực hiện" bấm nhầm) · bớt vi phạm khỏi lần xử lý (bậc không đổi) = sửa, có lịch sử, không qua duyệt | biện pháp chưa / vẫn có hiệu lực (X-51) |
| B8 | L4 — "MT hiện tại giữ gửi duyệt" | = thẻ "Dời lịch Test" gửi QL khi máy không tự dời được (đường duy nhất đang chạy); không dựng lại nút "Xin dời" | X-55 |
| B9 | L4 — Writing | Một task "-", task kia có điểm → lần 1 dời cả W, điểm task kia đi theo | v4b B2 T07 |
| B10 | L4 — dữ liệu cũ | "Không dự thi" chỉ còn ở dữ liệu cũ (giữ, liệt kê cho QL trước deploy); nút hộp chấm luôn "Vắng"; **(21/10) ô "Không dự thi" cũ ở MT cũ hiện như "Đã huỷ"** (giữ bản ghi, khôi phục được — luật 4 sửa) | X-05, X-54, X-75 |
| B11 | L3 | Gỡ R11 + khoá MT cũ 7 ngày cho GVBM đúng ô; chip "Đã hoàn tất" → "Đủ điểm"; Huỷ điểm / Bỏ khỏi đợt → cất điểm + "Khôi phục điểm" 1 bấm; `/lich-su` thêm loại "Ý thức" | X-04, X-56 |
| B12 | 06/10-NGAY áp cả ô TUẦN | Bỏ hàng chip "Ngay hôm nay · W4 SEP…" (Chuyển lớp, Chuyển tiếp lớp) và hàng nút "Tuần này · Tuần trước" trong lịch tuần; ô tuần gõ được + lịch, điền sẵn tuần đề xuất; ‹ › + "Mặc định" | v4c Q2 (X-20) |
| B13 | MP III.8 "riêng Phân tích" | "Toàn bộ" chỉ ở 6 tab Phân tích; Tutor, panel tutor, panel Xuất dùng `Khoảng tuần` có mặc định; Bộ lọc thêm "Thời gian" trống = không lọc (✕) — **đè đề xuất 12.7 / 12.9-17** | X-06 |
| B14 | V3 I.5 — nhập Excel lớp thường | "Theo từng MT" ở lớp thường = theo từng bài Progress / Final; ẩn dán ở điện thoại | 12.9-10 |
| B15 | L5 — bấm nhầm ngay sau lưu xử lý | **Không có Hoàn tác**; bấm nhầm cũng gửi "Thu hồi…" qua QL (lý do "bấm nhầm") — không theo v4b Q5a | chữ L5: thu hồi lần xử lý đã lưu phải qua QL (X-58; 05 mục 5.3) |
| B16 | 21/10-CASE (FB-4-35) — "nhiều kỹ năng" | Lô = **n Case độc lập**: mỗi Case một kỹ năng, tên, mô tả, nhóm nguyên nhân, người phụ trách theo luật sẵn có (GV dạy kỹ năng đó → GVCN), hạn PA theo mức, PA và Hoàn thành riêng; trùng hạng mục xử lý **từng kỹ năng** theo 7.13 (mặc định ghi vào Case đang có); kỹ năng có Case chờ xác nhận không vào lô (K3-23) | Rb §4.1, §18.2, §20.9; `suggestCaseOwner` (X-73; 05 mục 7.1b) |

**C — UX / thẩm mỹ mới, không đảo gì (27)**

| # | Nội dung | Nguồn |
|---|---|---|
| C1 | Hệ trạng thái HTT-1…12: hover lớp phủ 8 % / 9 % trên từng ô, chỉ cho thứ bấm được; hai dáng "chọn"; một mẫu báo lưu; `ConfirmDialog` thay `window.confirm` | V4C-02, 04, 11 |
| C2 | Một menu ⋯ (`MenuDong`) | V4C-03 (X-65) |
| C3 | Một ô nhập tuần `ONgay kieu="tuan"` cho 7 panel | V4C-05 |
| C4 | Dòng việc 3 vùng (Hạn · Việc + đối tượng · ›), 56 / 64 px; nhóm cố định theo vai; gom "nợ chấm cũ" ≥ 14 ngày cùng lớp × môn một dòng; "Bị từ chối" thành việc trong nhóm; một hàm tên cho dòng + đầu panel | V4A-01 |
| C5 | Một danh sách một kiểu mở; luật mở toàn web; hộp neo cho Gia hạn / Phân công / Chốt ngày thi / Từ chối; không ngăn phủ trong ngăn | V4A-04, 06 |
| C6 | Giải phẫu panel 6 phần (đầu · bối cảnh trước form · cần làm · lịch sử gập · chân dính · sau lưu); thang chữ panel 17 · 15 · 14 · 13 · 12; một đầu panel v3, không IN HOA; vỏ "Khung việc" 5 bậc + 11 thành phần chung | V4A-03, 04; V4C-13 |
| C7 | Vào Công việc không tự mở việc người khác, không tự cuộn; lỗi tải chỉ che danh sách; rỗng theo vai; ẩn lọc người khi 0 việc | V4A-01 |
| C8 | Panel Nhập điểm ở Công việc: bỏ "Dán từ Excel", "?", link ↗; công tắc "Hiện cả lớp" + "Còn n bài" | V4A-07 |
| C9 | MT: một hộp một đợt cho mọi thao tác lịch / trạng thái (hồ sơ MT mở cùng hộp); bộ chữ Dời lịch · Vắng · thẻ "Dời lịch Test" chờ QL · Huỷ điểm · Bỏ khỏi đợt · Đã huỷ · vắng 2 lần / Đã huỷ · QL từ chối dời · Giữ huỷ · Xóa lịch · Thi lại; dòng "Đã huỷ" [Đặt tuần ▾] · [Giữ huỷ]; gợi ý "dời cả MT sau" đưa vào mockup | V4B-08; 05 mục 4.5–4.6 (X-61) |
| C10 | Việc TVV: form F2 bốn hàng chip (Liên hệ PH · Cách + ngày · PH phản hồi · Kết quả / ghi chú + tệp) — ca thường 3 bấm, không gõ; link "＋ Thực tế khác nội dung GVCN"; đầu form có nội dung GVCN + SĐT PH; dòng trạng thái PH ở ô "Thang" (Ý thức lớp / HV); panel GVCN sau lưu ghi "TVV … nhận việc · hạn …"; báo cáo / Excel thêm cột "Đã báo PH n/m" | V4B-01; 05 mục 5.5–5.11 |
| C11 | `/lich-su` thêm loại "Ý thức" (lần xử lý, kết quả TVV, Phối hợp) | V4B-06 |
| C12 | Tab Hành trình một dòng thời gian (trục tuần thành công tắc ≥ 1 280 px); "Lộ trình tiếp theo" một em mở tại hồ sơ HV | V4C-06, 07 |
| C13 | Mẫu "Trang không mở được" (nói rõ vì sao + một nút về); `/hoc-vien` chặn theo quyền máy chủ; đường sai có báo | V4C-10 |
| C14 | Ngăn Case: tên dự phòng "Loại PA khác"; nút chính theo vai người xem | V4C-08 |
| C15 | Chờ duyệt / Yêu cầu của tôi: cột tick giữ chỗ; dải "loại" thành chip lọc | V4C-12 |
| C16 | Ẩn nút trùng trang ("Mở hồ sơ" khi đang ở hồ sơ); link xem = chữ + "›" | V4C-14 |
| C17 | Một `ODiem` cho Tổng kết lớp + lưới (cùng số cùng màu) | V4C-09 |
| C18 | Nghiệm thu chữ chụp ở 100 % **và** 125 % | v4c mục 5 |
| C19 | Sửa chữ Rulebook R1–R16 + câu hướng dẫn "hạn 4 tuần" | X-60 |
| C20 | Thẻ dời MT: nhãn "Dời lịch Test" (không "Lịch thi"); chữ "lần 2" trên thẻ đổi để không đọc thành "vắng lần 2" | X-70; 05 mục 4.4 |
| C21 | Panel Tạo Case nhiều kỹ năng (C1): chip **chọn nhiều**, không chọn sẵn ("+ Case cho X" chọn sẵn X), chữ "bạn dạy" dưới chip; phần chung nhập một lần (em, mức độ, tuần theo dõi, bằng chứng gắn mọi Case); một thẻ mỗi kỹ năng (nguyên nhân, tên, mô tả, "phụ trách: …"); nút "Tạo n Case"; **một giao dịch** (tất cả hoặc không); trùng / chờ xác nhận báo ngay khi chọn chip; một kỹ năng = y như nay; ghi bù giữ một kỹ năng | v4d; 05 mục 7.1b (X-73) |
| C22 | Chuông = hộp "Nhắc việc" (N2): khối **Cần làm** đọc **cùng hàm** hàng đợi trang đầu của vai (quá hạn + tới hết CN tuần này + việc mới chưa đọc), số trên nút = số dòng đó; khối **Để biết** = tin một chiều; bỏ cơ chế lưu thông báo tự động OV-15d (giữ hành vi C03); không tick "xong" tay; không email / Zalo. GĐ1 vá trước (N1) | v4d; A1-04, A7-05, A7-15; 05 mục 2.7 (X-72) |
| C23 | Case tạo tay cho kỹ năng **người khác** phụ trách → chuông người phụ trách ("Thêm PA · Case Reading · em · hạn …") — cùng mẫu Rb 20.11 "Case SOS mới → GVBM đúng môn" | v4d (4/9 Case tạo tay ở demo: người tạo ≠ người phụ trách) |
| C24 | **Head tutor**: trang đầu = trang **Tutor** (khối "Việc của bạn" của F1 ở đầu trang) — đúng nguyên tắc "việc của tôi ở trang đầu vai" | PTA 21/10 (03 — điểm PTA cần chốt) |
| C25 | **Admin văn phòng**: trang đầu = Tổng quan (việc của tôi); **giữ** mục Công việc (theo dõi ô điểm chưa nhập / thẻ dời lịch của chi nhánh) — không bỏ chức năng đang dùng; xem lại sau Q-A1 | PTA 21/10 (03) |
| C26 | **QL thu hồi** một lần xử lý vi phạm: làm thẳng (QL là người duyệt), **lý do bắt buộc**, ghi nhật ký + lịch sử, trạng thái "Đã thu hồi" như GVCN (luật 5 chỉ nói GVCN phải gửi duyệt) | PTA 21/10 (v4b Phần D; 03) |
| C27 | **CASE-NHIEU** (Case nhiều kỹ năng) xếp loại **"thêm ô theo mẫu sẵn có"** (CLAUDE.md / plan 1.3b) — không cần mockup riêng; PR kèm ảnh trước / sau panel Tạo Case cho chủ SP xem | PTA 21/10 (v4d; 07 GĐ1) |

### 4.8 Xin ảnh / dữ liệu (không phải quyết định)

1. **[CẦN ẢNH]** Chữ "báo trễ" ở bảng Ý thức chủ SP thấy ở đâu (tab Ý thức của Phân tích không có chữ "trễ"; Phân tích GV có "Đúng hạn › Xử lý vi phạm") — chụp đúng màn đã thấy (FB-3-11).
2. **[CẦN ẢNH]** Đường đau MT anh / chị đã gặp (MP XIV.1): (1) trang + ô / hộp lúc bấm "huỷ điểm" (chữ nút) · (2) hồ sơ MT lúc khôi phục (nút nào) · (3) hộp / trang lúc chuyển lịch · (4) câu lỗi nếu có. Nói rõ huỷ điểm một ô hay huỷ cả MT (bản chính 18/10 còn "Huỷ MT{n}") — v4b V4B-08.
3. **[CẦN DỮ LIỆU — chặn bật luật 1]** Lệnh chỉ đọc trên bản chính: số em đang học có / chưa có TVV theo chi nhánh · số lần xử lý vi phạm / tuần · số ô "Không dự thi" từ 18/10 · số em có SĐT phụ huynh (v4b Phần C).
4. **[CẦN DỮ LIỆU]** Hiệu quả PA: số PA kết thúc / tháng / chi nhánh trên bản chính; lớp thường có cần bảng này không (12.9-19).
5. **[CẦN DỮ LIỆU]** Tutor (12.8): số tutor thật · buổi / tuần / chi nhánh · tỉ lệ buổi "Không" / đánh giá ≤ 2 · Head tutor có lọc nơi dạy / kỹ năng hằng ngày · có gọi tutor từ trang · nhịp viết nhận xét · tên gõ tay nhiều không.
6. **[CẦN ẢNH]** 10 ảnh bản chính ở v4c mục 8 (chỉ mở, không lưu): Góc nhìn QL kiêm GV · Case có PA loại cũ · Hành trình em ≥ 2 lớp · Mock có kỹ năng vắng / điểm bị huỷ · 3 hộp Ý thức · hộp "Kết luận khoá" · Lưu trữ bỏ lưu trữ (chỉ xem trước) · lưới chấm khi mạng yếu · lưới Test như ảnh 5.webp cùng máy, cùng tỉ lệ · trang đầu TVV + Head tutor sáng thứ Hai.
7. Tài liệu chính 6.5 (a), chỉ chủ SP làm được: laptop 1 280–1 366 px chụp thanh trên · bản chính "Thiếu n" lớp FT đông nhất · bản chính Tổng quan + Đang SOS chụp liền nhau · điện thoại GV cuộn hồ sơ lớp · GV Speaking chấm chéo · tài khoản kiêm hai vai.
8. Không cần chủ SP chụp: v4-4 (R11 đã xác nhận bằng mã + tái hiện demo); 3 bước "Lưu thật" ở v4a mục "Cần kiểm thêm" do session code làm trên bản demo riêng.

---

## 5. Danh sách câu PHẢI HỎI (17) — quan trọng trước, 5 nhóm, ≤ 4 câu / nhóm

Mỗi câu: ≤ 2 dòng + khuyến nghị (lý do) + 2–3 lựa chọn ngắn (≤ 5 chữ), **lựa chọn khuyến nghị đứng đầu**; chữ trong ngoặc sau lựa chọn chỉ để giải nghĩa. Không câu nào hỏi lại 5 luật — nhóm 2, 3 chỉ hỏi chỗ luật chưa nói. Mã giữ như bản nháp (Q-D2 đã chuyển PTA tự quyết — 4.7 B1); khuyến nghị khớp 05. Sau khi chủ SP trả lời: ghi dòng **"Chủ SP chọn: …"** dưới từng câu (MP XVII.2 "lựa chọn cuối của tôi").
**21/10: chủ SP đã trả lời 17/17** (hộp chọn trong phiên PTA Plan). Dòng **"Chủ SP chọn (21/10)"** = lời chủ SP (trong ngoặc kép, nguyên văn) → cách PTA ghi. Khuyến nghị trong thân câu giữ làm lịch sử; chỗ khác lựa chọn thì dòng "Chủ SP chọn" thắng.

### Nhóm 1 — Phát hành và trang theo vai (định hướng lớn)

**Q-E1 · Sửa gì trước deploy (GĐ1)?** (9.1-3; X-29)
Gói đề xuất: lỗi số (SL1, SL2) · lỗi chức năng (CV-LOI, KHUNG-LOI, LT-SV, bộ chọn tự đóng, `case` trùng, "Phân công…" / Case không chủ, ghi nhanh che tiêu đề, nút 403) · lệch luật 3, 4, 5 · lệch bảng BANG-0/1 · CHU-THI.
- Khuyến nghị ①: bản chính hết lỗi số, khoá sửa, luật lệch; việc TVV (luật 1–2) cần màn mới + gán TVV trước → làm ngay sau deploy, không chặn deploy.
- Lựa chọn: ① Cả gói, trừ việc TVV · ② Chỉ gói 9.1-3 cũ · ③ Cả gói, kể cả TVV.
- **Chủ SP chọn (21/10):** "Cả gói, trừ việc TVV (Khuyến nghị)" → ①. GĐ1 = số liệu, lỗi chức năng, bộ chọn tuần, lịch thi, Thi / Test, luật 3–4–5, nền bảng + lưới điểm; việc TVV ở **GĐ1b** ngay sau deploy.

**Q-A1 · Việc của ai nằm ở trang nào?** (MP XI.2; 10.7-2; v4a Q1, Q2; v4c Q1; X-07, X-27)
Luật một câu: "việc TÔI phải làm nằm ở trang đầu của tôi" — GV: Công việc; QL, QT, Admin VP, TVV: Tổng quan. Công việc của QL / QT = theo dõi việc GV + giao việc + lịch sử duyệt.
- Khuyến nghị ①: 0 việc trùng hai trang (nay 16/21 trùng); QL duyệt 10 thẻ 21 → 11 bấm, 5 → 0 lần đổi trang; TVV không thêm menu, 2 bấm tới việc.
- Lựa chọn: ① Trang đầu theo vai · ② TVV dùng trang Công việc (như ①, TVV có mục Công việc riêng — cách của v4c) · ③ Mọi việc ở Công việc (Tổng quan chỉ tình hình; +1 đổi trang mỗi việc có form).
- **Chủ SP chọn (21/10):** "Trang đầu theo vai (Khuyến nghị)" → ①. Việc của tôi ở trang đầu vai (GV: Công việc; QL / QT / Admin VP / TVV / CX: Tổng quan; Head tutor: Tutor — 4.7 C24); Công việc QL = theo dõi việc GV + giao việc; TVV **không** thêm mục Công việc.

**Q-A2 · Khu việc: một hàng đợi (B) hay hộp duyệt riêng ở trên (A — phương án anh/chị nêu)?** (MP IV.8; 10.7-1; X-40, X-64)
Áp cho trang chọn ở Q-A1. Ảnh v4-1 chính là A đang chạy ở Công việc QL: dòng việc đầu ở 752 px, 42–49 nút trong màn đầu.
- Khuyến nghị ① B: Chờ duyệt là nhóm đầu của danh sách trái, chi tiết bên phải; duyệt 10 thẻ 11 bấm, 0 đổi trang, 0 cuộn; một kiểu mở cho mọi việc.
- Lựa chọn: ① B — một hàng đợi · ② A — hộp duyệt trên · ③ A, hộp gập một dòng.
- **Chủ SP chọn (21/10):** "Một hàng đợi trái/phải (Khuyến nghị)" → ① bố cục B (Chờ duyệt là nhóm đầu danh sách trái, chi tiết phải).

**Q-A4 · Góc "Cần làm" ở Học viên & Lớp: làm lại thế nào?** (11.8-8, MP V.3, XVI.B; X-41)
Hiện là bản sao danh sách Công việc ("Cần làm 51" = "Tất cả 51"). MP: làm lại cột, không đổi logic xác định việc.
- Khuyến nghị ①: thành bộ lọc "Có việc" trong bảng Tất cả (cột Việc · Người phụ trách · Hạn, quá hạn trước; cùng hàm đếm với Công việc) — không thêm bảng việc thứ hai; QL tìm em có việc quá hạn cả chi nhánh: 1 bấm.
- Lựa chọn: ① Bộ lọc "Có việc" · ② Bỏ, dùng chip ⚠ (chip quá hạn trên hàng lớp mở dải việc) · ③ Giữ góc, làm 5 cột.
- **Chủ SP chọn (21/10):** "Để tên là 'Cần làm' nhé" → theo ① (**bộ lọc trong bảng Tất cả**: cột Việc · Người phụ trách · Hạn, quá hạn trước, cùng hàm đếm với Công việc) nhưng **giữ tên "Cần làm"** (không đổi thành "Có việc") — X-81.

### Nhóm 2 — Vi phạm và việc TVV (luật 1, 2, 5 — chỉ biên)

**Q-D1 · Việc TVV đã sinh, sau đó QL từ chối, GVCN rút đề xuất còn chờ, hoặc lần xử lý bị thu hồi (L5) — việc TVV ra sao?** (MP-01, MP-31, v4b Q5b; X-45, X-50)
Theo luật 1, việc sinh ngay khi GVCN lưu, kể cả khi lần xử lý đang chờ QL duyệt (WL 3, ngoài thang, không tăng bậc).
- Khuyến nghị ①: TVV chưa ghi gì → việc tự huỷ kèm lý do; TVV đã ghi → giữ bản ghi, nhãn "lần xử lý đã bị từ chối / thu hồi", TVV nhận chuông "để biết" (không sinh việc báo lại PH).
- Lựa chọn: ① Chưa ghi thì tự huỷ · ② Giữ việc, TVV ghi tiếp · ③ Luôn huỷ ngay (kể cả đã ghi; ghi chép còn trong lịch sử).
- **Chủ SP chọn (21/10):** "Chưa ghi thì tự huỷ (Khuyến nghị)" → ①.

**Q-D3 · Em chưa có TVV, hoặc không liên hệ được phụ huynh, thì sao?** (MP-03, MP-04, v4b Q2, Q3; X-52)
Bản chính gần như chưa gán TVV (demo 4/129 em) → trước khi bật luật 1 có bước QL gán TVV.
- Khuyến nghị ①: không có TVV → QL chi nhánh giữ việc ("Chưa có TVV · Gán TVV"; gán xong việc sang TVV, hạn giữ); TVV ghi từng lần thử, được "Kết thúc · không liên hệ được" (ghi chú bắt buộc, GVCN nhận chuông); quá hạn chỉ chuông, không thêm thẻ Báo QL.
- Lựa chọn: ① QL giữ · được kết thúc · ② GVCN giữ · được kết thúc · ③ QL giữ · không kết thúc (việc mở tới khi liên hệ được).
- **Chủ SP chọn (21/10):** "QL giữ · được kết thúc (Khuyến nghị)" → ①. Phần "em không có TVV → QL chi nhánh giữ" áp cả 4 việc ở Q-A3 (theo câu trả lời Q-A3).

**Q-A3 · TVV nhận những việc nào, mỗi việc ai giữ?** (MP-07, MP XII.1; 11.8-3c; v4b Q8, Q9; X-66)
Ngoài việc vi phạm (L1): Chốt ngày thi · Chọn bước tiếp sau thi · Bổ sung hồ sơ thiếu · Báo PH kết quả Test lớp thường (nay việc GVCN nhờ TVV ngoài web). Luật chung: một việc một người giữ (nay "Chọn bước tiếp" là "của tôi" với QL + mọi TVV chi nhánh).
- Khuyến nghị ①: người giữ = TVV của em (không có TVV → QL cho Chốt ngày thi / Bước tiếp, GVCN cho Báo PH lớp thường); TVV là người liên hệ PH, theo lộ trình em (mockup vai 13/10); bớt vòng nhắn GVCN ↔ TVV. "Cập nhật kết quả thi thật" giữ GVCN lớp cuối như nay.
- Lựa chọn: ① Bốn việc, trừ KQ thi · ② Chỉ việc vi phạm · ③ Thêm cả KQ thi thật (chuyển cả việc của GVCN lớp cuối sang TVV).
- **Chủ SP chọn (21/10):** "Chốt ngày thi, chọn bước tiếp sa thi, bổ sung hồ sơ thiếu, cập nhật kết quả thi thật, hầu hết các CV này đều không có hạn đâu nhé, chỉ trừ chọn bước tiếp sau thi - 1 tuần" → **luật mới (2.9 21/10-TVV)**: TVV của em giữ 4 việc — Chốt ngày thi · Chọn bước tiếp sau thi · Bổ sung hồ sơ thiếu · **Cập nhật kết quả thi thật (chuyển từ GVCN lớp cuối)**; **không hạn**, trừ Chọn bước tiếp sau thi **hạn 1 tuần** (mốc: từ khi có kết quả thi thật — PTA diễn giải); "Báo PH kết quả Test lớp thường" **không** chuyển (giữ như nay); em không có TVV → QL chi nhánh (Q-D3); "Ghi kết quả xử lý vi phạm" vẫn hạn 5 ngày lịch (L2). Khác khuyến nghị ① (X-80).

### Nhóm 3 — Luật 3 và luật 4 (chỉ biên)

**Q-B1 · Luật 3: các khoá "vì đóng hồ sơ" còn giữ không?** (MP-08, v4b Q10; X-04, X-67)
PTA gỡ R11 (đúng ảnh v4-4), khoá MT cũ 7 ngày và khoá Tutor 24 giờ (khoá "vì đã lưu" — trái L3). Còn 3 khoá vì đóng hồ sơ: lớp đã kết thúc chỉ QL sửa điểm (14/10-Q4) · hồ sơ Lưu trữ khoá · sửa chữ kết quả PA khi Case đã xong phải "Mở lại" (H21).
- Khuyến nghị ①: giữ cả ba — khoá vì hồ sơ đã đóng, không phải "vì đã lưu"; QL vẫn sửa / Mở lại được, có lịch sử.
- Lựa chọn: ① Giữ khoá đóng hồ sơ · ② Nới, lý do bắt buộc (v4b: GV đúng môn sửa lớp kết thúc kèm lý do; sửa chữ KQ PA không cần Mở lại; Lưu trữ vẫn khoá) · ③ Bỏ cả ba khoá.
- **Chủ SP chọn (21/10):** "Giữ khoá đóng hồ sơ (Khuyến nghị)" → ① giữ cả ba (lớp đã kết thúc chỉ QL sửa điểm · Lưu trữ · H21).

**Q-B2 · Luật 3: sửa dữ liệu ĐÃ được QL duyệt có phải duyệt lại?** (MP-09, MP XIII.3; X-43)
Vd PA đã duyệt, xử lý WL 3 đã duyệt, Target đã duyệt.
- Khuyến nghị ①: sửa đúng phần đã duyệt (loại PA, bậc, Target) → gửi duyệt lại; sửa chi tiết (ghi chú, ngày, người dạy) → lưu thẳng + lịch sử. Giữ nghĩa bước duyệt, không bắt duyệt vì sửa vặt.
- Lựa chọn: ① Sửa phần duyệt: duyệt lại · ② Mọi sửa đều duyệt lại · ③ Chỉ lịch sử, báo QL.
- **Chủ SP chọn (21/10):** "Sửa phần duyệt thì duyệt lại (Khuyến nghị)" → ①.

**Q-B3 · Luật 4: MT cũ, "-" lần 1 dời sang tuần nào?** (MP-10, v4b Q4; X-05)
MT cũ = xếp vào tuần ≥ 2 tuần trước, nên tuần kế của lịch cũ luôn đã qua. Vd MT thi W1 JUL, hôm nay W3 SEP, GV gõ "-" lần đầu.
- Khuyến nghị ① tuần kế TÍNH TỪ HÔM NAY (W4 SEP): đúng ý luật — em được thi bù thật; 1 bấm, lịch hiện ở Kế hoạch Test, có hạn; không tạo lịch trong quá khứ mà không ai nhắc. Ca nhập bù lịch sử (em đã thi bù W2 JUL): QL dời lịch về tuần cũ (+3 bấm). Chi tiết hai tình huống: 05 mục 4.4.
- Lựa chọn: ① Tuần sau hôm nay · ② Tuần kế của lịch cũ (W2 JUL: nhập bù 1 bấm, nhưng em chưa thi bù thì lịch nằm ở quá khứ, không ai nhắc).
- **Chủ SP chọn (21/10):** "Tuần kế của lịch cũ" (②) — nhưng câu sau (Q-B4) chủ SP **đè**: MT cũ "-" = huỷ luôn → Q-B3 **hết hiệu lực cho MT cũ**. "Tuần kế của lịch" chỉ còn áp cho **MT hiện tại ghi "-" muộn** (sau tuần thi nhưng < 2 tuần): dời tuần kế của lịch nếu còn thi được, không thì thẻ gửi QL duyệt như cũ (X-76).

**Q-B4 · Luật 4: "cùng chuỗi dời" tính thế nào?** (MP-11, v4b Q6; X-05)
Quyết định khi nào "-" là lần 2 (huỷ).
- Khuyến nghị ①: chỉ đếm các lần dời do "-" của cùng kỹ năng trong cùng lượt; QL dời tay / duyệt thẻ không tính và không xoá chuỗi; sau QL "Đặt tuần" từ trạng thái Đã huỷ, chuỗi **giữ** ("-" tiếp theo huỷ lại để QL quyết lần nữa); gỡ "-" trả lại lần đó.
- Lựa chọn: ① Chỉ đếm lần "-" · ② Mọi lần dời đều đếm · ③ Khôi phục: chuỗi mới.
- **Chủ SP chọn (21/10):** "chỉ đếm các lần '-' nhưng trong 1 tuần, nếu sửa lại và nhập thêm '-' thì không tính là rời, phải sang tuần tới mới tính là rời tiếp lần 2 -> hủy. Phần này có vẻ hơi conflict với luật cho MT cũ, nên thôi override lại, nếu MT cũ mà bấm '-' thì coi như hủy luôn, nếu QL muốn khôi phục lại thì bấm khôi phục là được, sau khi bấm khôi phục thì reset lại từ đầu, không nhớ quyết định vắng '-' trước đó nữa, xem lại xem luật có conflict gì không nhé". Ba câu xác nhận sau đó: ranh giới MT cũ "Giữ ≥ 2 tuần (Khuyến nghị)" · "QL KHÔI PHỤC thì set cho dời 2 lần, còn nếu QL 'duyệt' cho dời thêm 1 lần nữa thì nếu như vẫn vắng thì hủy" · gõ nhầm "-" ở MT cũ: "Hoàn tác 10 giây và vẫn cho khôi phục được, tại sao phải chặn cứng?" → **luật 4 sửa 21/10 (2.9 21/10-L4, 6 ý)**: đếm theo tuần · MT cũ "-" = huỷ ngay · Khôi phục = được dời 2 lần · QL duyệt thêm = +1 · Hoàn tác 10 s + vẫn khôi phục · lớp thường không đổi. Khác ① ở phần khôi phục (① giữ chuỗi) — X-77, X-78.

### Nhóm 4 — Test, Lịch thi, Báo cáo

**Q-C1 · Chấm Test: duyệt hướng "theo hạn, một nguồn" thay bố cục ba khối Lịch Test (mockup duyệt 06/10)?** (12.9-3; X-08)
Giữ luật chia khối (T15), T18, T19; chỉ đổi tên, thứ tự, cách gom; một danh sách cho Test + Công việc; "Tình trạng chấm" cho QL; bỏ trang `/nhap-diem`.
- Khuyến nghị ①: cùng một số ở mọi nơi; Cô Linh ~11 bấm → 1–2; QL tra "MT2 lớp X ai còn nợ" 3–6 bấm → 1.
- Lựa chọn: ① Theo hạn, vẽ mockup · ② Giữ ba khối, sửa chữ · ③ Chỉ chấm ở Công việc.
- **Chủ SP chọn (21/10):** "Cứ vẽ mockup cho lựa chọn 1 nhé tôi xem xong sẽ duyệt, nhớ lưu ý các trường hợp GV có dạy kĩ năng Speak, kể cả không dạy lớp nào cũng được phép chấm chéo nhé" → hướng "theo hạn, một nguồn" **CHƯA chốt hẳn — PTA vẽ mockup (ưu tiên), chủ SP duyệt sau**. **Luật mới (2.9 21/10-SCHEO):** GV có kỹ năng S (hồ sơ GV), kể cả không dạy lớp nào, được chấm chéo S, phạm vi chi nhánh; T18 phần khác giữ. Mã đã đúng từ OV-14c (X-79).

**Q-C2 · Báo cáo: duyệt phần nâng cấp mới (ngoài sửa theo mockup đã duyệt)?** (12.9-16, MP IX.3; X-16)
Gồm: nút "Chiếu" · số mới "bài chấm trễ trong kỳ" (thay "quá hạn tới hôm nay", không đổi khi in lại) · bảng "Theo chi nhánh" cho QT · khối kết quả lớp thường.
- Khuyến nghị ①: số không đổi theo ngày xem; dùng ngay ở giao ban; lớp thường có chỗ xem kết quả.
- Lựa chọn: ① Duyệt cả bốn · ② Chỉ sửa theo mockup · ③ Chọn từng phần.
- **Chủ SP chọn (21/10):** "Duyệt cả bốn (Khuyến nghị)" → ① (Chiếu · "bài chấm trễ trong kỳ" · bảng Theo chi nhánh · khối kết quả lớp thường).

**Q-C3 · Lịch thi — hai biên của luật tháng / ngày thi** (11.8-3 a, e; V2 I.6.3)
(1) Em có TUẦN thi nhưng chưa có ngày = "Chưa chốt ngày"? (2) Lớp thường có trạng thái này + việc không hạn như FT?
- Khuyến nghị ①: tuần chưa phải ngày; lớp thường ít thi thật, chỉ cần thấy (chip), không sinh việc.
- Lựa chọn: ① Có · LT chỉ chip · ② Có · LT như FT · ③ Không · LT chỉ chip.
- **Chủ SP chọn (21/10):** "Có · lớp thường chỉ chip (Khuyến nghị)" → ①.

**Q-C4 · "Cần xác nhận" ở Lịch thi có nghĩa riêng không?** (11.8-6, MP V.6; X-30)
Mã: không đổi lịch, không sinh việc, không ai phụ trách — đầu ra = "chưa có kết luận"; ý định ban đầu "đã bàn, chờ PH / HV xác nhận".
- Khuyến nghị ①: đúng lời MP "không tạo từ gây hiểu nhầm"; lý do chờ ghi ở Ghi chú (tự thêm "đã bàn dd/mm").
- Lựa chọn: ① Bỏ, hiện "Chưa kết luận" · ② Giữ, chỉ để nhìn · ③ Giữ, sinh việc TVV.
- **Chủ SP chọn (21/10):** "Bỏ, hiện 'Chưa kết luận' (Khuyến nghị)" → ①.

### Nhóm 5 — Định nghĩa số và xuất

**Q-D4 · "Thiếu thông tin" (việc bổ sung hồ sơ) tính những trường nào?** (MP-20, MP XII.1; X-26)
Mã tính 7 trường → 46/51 em "Thiếu"; 14/10 đã thêm ngày sinh + email; điểm đầu vào được phép trống; tháng thi nay có trạng thái riêng.
- Khuyến nghị ①: Ngày sinh · Email · Tuần bắt đầu · Target (FT) — chỉ thứ thiếu thì không làm việc được.
- Lựa chọn: ① Bốn trường cần thiết · ② Giữ đủ 7 trường · ③ Chỉ ngày sinh, email (phần học thuật thành việc riêng của QL / GVCN).
- **Chủ SP chọn (21/10):** "Bốn trường cần thiết (Khuyến nghị)" → ① Ngày sinh · Email · Tuần bắt đầu · Target (FT).

**Q-E2 · Chọn học viên khi xuất Excel** (11.8-9, MP V.4 — A / B chưa chốt; X-42)
- Khuyến nghị ① (phương án 3): bỏ ô tick khỏi bảng; panel Xuất có danh sách em theo lớp, chọn sẵn hết, bỏ tick em không cần; xuất cả chi nhánh bỏ 2 em ~28 → 6 bấm.
- Lựa chọn: ① Bớt em ở panel Xuất · ② A: theo bộ lọc (bỏ ô tick, lớp đang mở không ảnh hưởng) · ③ B: ô tick gọn.
- **Chủ SP chọn (21/10):** "Bớt em ở panel Xuất (Khuyến nghị)" → ①.

**Gói PTA tự quyết (4.7 A, B, C) — Chủ SP chọn (21/10):** "Đồng ý cả gói (Khuyến nghị)".

---

## 6. Việc PTA Plan cần làm tiếp

1. ✓ (21/10) Đã gửi mục 5 + 4.7; chủ SP trả lời **17/17** + **đồng ý cả gói**; đã ghi "Chủ SP chọn (21/10)" dưới từng câu, mục 2.9, X-75…X-81; agent d6 đã cập nhật 00, 01, 03–07 + plan.md theo câu trả lời.
2. **Việc tiếp:** chủ SP **duyệt plan cuối = merge PR #486** → GĐ0 (TL-QT, TL-LUAT — Rulebook ghi **luật 4 sửa 21/10** + 2 luật mới: việc TVV + hạn, S chéo theo kỹ năng hồ sơ; SEED-UX; CONG-CU).
3. **Vẽ mockup Chấm Test theo hạn (Q-C1) trước tiên** — chủ SP đang chờ để duyệt hướng; sau đó mockup màn mới theo 06 mục 4 (Tổng quan B, Tổng quan TVV, Công việc, bộ lọc "Cần làm", …).
4. Trước khi bật luật 1 + việc TVV (GĐ1b): lệnh chỉ đọc trên bản chính đếm em chưa có TVV theo chi nhánh (4.8-3) + liệt kê việc "Cập nhật kết quả thi thật" đang mở của GVCN (sẽ chuyển TVV); trước LUAT-34: liệt kê ô "Không dự thi" ở MT cũ (sẽ hiện "Đã huỷ").
5. Session code (bản demo riêng, được Lưu): 3 bước "Cần kiểm thêm" của v4a; bấm thử lỗi ảnh 5 (`case` trùng); đếm lại đường Đ1 / Đ2 của MT (v4b V4B-08).
6. Còn từ v4d: **04** (hộp chuông dùng `DongViec` + HTT-5 chip chọn nhiều), **06** (khung hộp chuông N2 — đã thêm vào bộ M2), **03** (vấn đề chuông / Case nhiều kỹ năng). Đã xong: chép `v4d-case-thong-bao.md` vào phụ lục; 00; dòng "Mặc định của 55 câu" ở 4.7.
7. Đã xong ở vòng 4: kiểm lối "Huỷ lượt MT" (X-28) · đường "không tăng bậc" (chưa có — X-49) · điều kiện nút "Phân công…" (X-63) · đếm bước đường đau MT (≈ 14 bấm theo mã + mở hộp — X-61).
