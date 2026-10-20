# Đánh giá lại UX/UI toàn diện — PISA Tracking · 20/10/2026

> **Trạng thái: CHỈ ĐÁNH GIÁ + KẾ HOẠCH ĐỀ XUẤT.** Chưa sửa gì trên web. Mọi "phương án", "kế hoạch" dưới đây là **đề xuất**, chờ chủ SP góp ý và chốt.
> Người làm: session planning "PTA Plan" (Opus 5.5) điều phối 8 agent rà độc lập (Opus 5.5). Mã: `main` e3405b93 (đã gồm OV-14, OV-15a…i2, Tutor TU-a/b — chưa deploy).
> Web demo chạy cục bộ, ngày demo 14/09/2026. Yêu cầu gốc: 12 ảnh + lời chủ SP chiều 20/10.
> Cách chấm (impeccable critique): **hai đánh giá độc lập** — A: thiết kế (5 agent theo khu vực + 1 agent nguyên nhân lệch mockup + 1 agent số liệu / thuật ngữ) · B: máy dò + đo trình duyệt (1 agent, không xem kết quả A).
> **Phụ lục chi tiết** (mỗi phát hiện đủ Vấn đề · Bằng chứng `tệp:dòng` · Nguyên nhân · Ảnh hưởng · Phương án · Lý do · Lệch mockup): thư mục [`2026-10-20-danh-gia-ux/`](2026-10-20-danh-gia-ux/).

**Nhãn:** **[XÁC NHẬN]** đúng như ảnh chủ SP, đã kiểm lại trên web / mã · **[PHÁT HIỆN]** tự tìm thêm, đã kiểm · **[GIẢ THUYẾT]** chưa kiểm được (ghi cách kiểm) · **[ĐỀ XUẤT]** chưa duyệt · **[CẦN ẢNH]** cần chủ SP chụp / cho thêm thông tin.
**Mức:** **P0** sai dữ liệu / chặn việc · **P1** gây nhầm, bỏ sót việc, tốn nhiều bước · **P2** khó chịu, có đường vòng · **P3** chỉnh nhỏ.
**Mã phát hiện:** `A1-` khung + Tổng quan · `CV-` Công việc + panel · `A3-` Học viên & Lớp + hồ sơ · `TST-` Test + nhập điểm · `A5-` Phân tích + Tutor + Quản trị · `A7-` số liệu + thuật ngữ · `B-` máy dò · `N` nguyên nhân lệch mockup · `X` vấn đề xuyên suốt (tài liệu này).

---

## 0. Đọc nhanh (5 phút)

**Kết luận điểm.** Web hiện đạt khoảng **23/40** theo 10 nguyên tắc Nielsen (mức "tạm được", 20–27) — **không xứng ≥ 35/40**. Năm khu vực chấm riêng đều 21–23/40; nguyên tắc **Nhất quán chỉ 1/4 ở mọi khu vực**.
Con số "≥ 35" trước đây chỉ là **đích** đặt ngày 17/10; sau đợt OV-15 chưa ai chấm lại (mục 2).

**Chủ SP nói đúng — có bằng chứng:**
1. **Không bám mockup đã duyệt.** Tính theo từng quyết định trong khung, web khớp trung bình ~60 %; hai màn dùng nhiều nhất chỉ ~40 % (Tổng quan QL, Hồ sơ lớp).
   Rõ nhất: panel Nhập điểm ở Công việc **giống y khung "TRƯỚC"** của mockup 2 — khung "SAU" đã duyệt không được làm. Phần lệch nằm đúng chỗ nhìn thấy đầu tiên: đầu trang, dải lọc, dáng khối, mật độ (mục 3).
2. **Vài chỗ tệ hơn bản 17/10** (so ảnh sổ tay chụp 17/10): Tổng quan QL từ bảng "Cần xử lý" 5 dòng gọn thành 21–29 thẻ / hàng (2,5 màn; điện thoại 5,3 màn);
   hồ sơ lớp thêm cả lưới điểm 33 em **dưới mọi tab** (+~2 200 px); số liệu lệch nhau nhiều hơn (dải Tổng quan "gộp hai khung").
3. **Panel thừa, chuyển trang thừa** — ≥ 15 chỗ: "Mở" thẻ duyệt sang hồ sơ HV; hai link ↗ trong panel Nhập điểm rời sang Test; "Phân công…" mở cả ngăn Thông tin lớp đè lên panel đang mở;
   hộp lịch → menu → panel chồng 3 lớp; "Cần làm" ở Học viên & Lớp là bản sao Công việc; 2 giao diện nhập điểm cả lớp; 3 panel xuất… (mục 4, X3–X4).

**Lỗi làm SAI SỐ — nên sửa trước mọi thứ (mục 4, X1–X2):**
- **P0** chọn "Theo tháng" ở Phân tích / Tutor ra **tháng trước** (chọn 09/2026 → nhãn và số là 08/2026), không cảnh báo — báo cáo tháng in ra sai.
- **P1** "PA có kết quả trong kỳ" ở Báo cáo **không theo kỳ** (ra 10 ở mọi khoảng, kể cả 01/2026; tab Hiệu quả PA cùng bộ lọc ra 2).
- **P1** "Chờ duyệt 10" nhưng hiện 12 thẻ, có thẻ chi nhánh khác khi đang lọc Monbay (đúng ảnh 1).
- **P1** 8 số ở dải "HV cần chú ý" và hàng "Cả Monbay" **bấm không mở gì**.
- **P1** cùng trang / cùng bộ lọc, một khái niệm ra nhiều số: bài trễ chấm 58 · 53 · 28; SOS 6/5/3 · 9 · 2/3/0 · 3/4/2; Case quá hạn 5 · 4.
- **P1** Đang SOS chia trang làm sai số đầu nhóm lớp và đẩy em SOS 3 xuống trang 2.

**Vì sao làm ra không giống mockup — lỗi QUY TRÌNH do planning đặt ra, không phải một session làm ẩu (mục 3):**
1. Kế hoạch dịch hơn 50 khung mockup thành 34 gạch đầu dòng chữ; tiêu chí duy nhất là "chữ giống mockup", không có "bố cục giống khung X".
2. Luật "sửa trên nền có sẵn / bố cục đã khoá / dùng lại component" khiến session **vá màn cũ** thay vì dựng lại theo khung; luật cũ (27/09) còn thắng khung mới duyệt.
3. 6 PR song song chia theo **tệp**, không theo **màn** → một màn bị 5–9 PR chạm, không ai chịu trách nhiệm cả màn (đầu trang, dải lọc, khối cũ cần bỏ).
4. Không bước nào **đặt ảnh web cạnh khung mockup**: rà PR chỉ đọc diff + 1 ảnh khung nhìn; lệch đã lộ trong ảnh PR vẫn merge; bản OV-15d khớp mockup hơn (#471) bị đóng vì bản kia merge trước.
5. Chủ SP chỉ duyệt khung tĩnh; 14 PR giao diện merge trong ~24 giờ (5 PR lúc đêm) — chủ SP thấy web khi cả loạt đã merge.

**Hướng đi khuyến nghị (mục 8):**
- **GĐ0 — đổi quy trình trước:** bảng truy vết "khung mockup → thành phần → ảnh nghiệm thu", ảnh cặp mockup | web toàn trang, một màn một PR, chủ SP duyệt ảnh cặp trước khi merge PR đổi bố cục,
  khung đã duyệt thắng kế hoạch / luật cũ (trừ luật nghiệp vụ). Kèm dữ liệu demo đủ trạng thái.
- **GĐ1 — sửa lỗi số liệu + lỗi chức năng** (không đổi bố cục, không cần mockup mới).
- **GĐ2 — làm lại từng màn theo mockup:** khung trang chung → Tổng quan → Công việc → Hồ sơ lớp → Học viên & Lớp → Test → Phân tích → Tutor / Quản trị.
- **GĐ3 — thống nhất thành phần, chữ, 375; chấm lại bằng cùng phương pháp** rồi mới nói "đạt".

**Chủ SP cần làm:** (1) xem 10 cặp ảnh "mockup | web" ở mục 3.1; (2) 4 câu chính (mục 9.1) — **đã chốt 20/10, cả bốn theo khuyến nghị**; các câu còn lại (mục 9.2) xem dần, có khuyến nghị sẵn; (3) góp ý thêm sau khi xem web — gộp xong mới giao PR. **Đã nhận:** vòng 1 (mục 10, câu 10.7) · vòng 2 (mục 11, câu 11.8).

---

## 1. Phạm vi và cách rà

| Mục | Đã làm |
|---|---|
| Vai | QT (Đỗ Vũ Tuấn Phong — vai chủ SP chụp), QL Monbay, QL chi nhánh khác, GVCN, GV từng môn (L·R, W1, W2, S chấm chéo), Admin văn phòng, TVV, CX, Head tutor, chưa đăng nhập |
| Trang | Tổng quan; Công việc; Học viên & Lớp (Tất cả · Đang SOS · Cần làm · Lịch thi · Đã thi · Bộ lọc thêm); Hồ sơ lớp FT + lớp thường (mọi tab, tab con); Hồ sơ HV (mọi tab); trang Case; Lưu trữ; Test › Lịch Test / Chấm Test, Kế hoạch Test, Lịch thi thật; trang Nhập điểm; Bảng điểm lớp thường; Hồ sơ Mock; Phân tích (6 tab); Tutor; Quản trị; Hồ sơ GV; Hồ sơ cá nhân; Hướng dẫn; Thông báo; menu tài khoản; ô tìm; thanh demo |
| Panel / hộp | mọi panel mở được mà không phải lưu (≈ 60 loại): Nhập điểm (lớp / nhiều lớp / một em), Dán từ Excel, hộp ô điểm, Ghi nhận xét, Thêm / Xác nhận PA, Xác nhận Case, Kết quả PA, Mini Test, Ghi nhận / Xử lý vi phạm, Bàn giao, Phối hợp SOS, Chọn người phụ trách, Phân công, Giao việc, Chốt lộ trình, Bước tiếp, Gia hạn, Chấm Speaking, Vì sao SOS, panel một em, Xuất (3 loại), + Học viên, + Lớp mới, Sửa thông tin (một em / cả lớp), Chuyển lớp, Lịch sử thay đổi, hộp lịch MT, Xếp nhiều MT, Xếp lại bài vắng, Ghi chú lớp, panel số liệu Phân tích / Báo cáo, panel tutor, Thêm / Tải danh sách / Gộp tutor, panel tài khoản, ma trận quyền… |
| Khổ màn | 1440 tối (chính), 1440 sáng, 375 sáng; thanh trên đo thêm 800 / 1 100 / 1 280 |
| Bằng chứng | **1 789 ảnh**; 7 mockup đã duyệt chụp toàn trang; 10 ảnh ghép "mockup \| web"; đếm DOM (nút, ô, chữ lặp, chiều cao); 53 lần mở trang · 518 lần gọi API (chỉ đọc) để so số giữa các nơi; đọc mã để truy nguyên; đọc 33 PR #445–#485 |
| Phương pháp | impeccable **critique** (hai đánh giá độc lập: A — thiết kế; B — máy dò + trình duyệt) · 10 nguyên tắc Nielsen (0–4) · tải nhận thức 8 mục · persona: Alex (thạo việc), Sam (bàn phím / trình đọc màn), **Cô Linh** (GV 5 lớp, nhập 20 bài cuối buổi, hay dùng điện thoại), **Chị Vy** (QL, giao ban sáng 10 phút) · luật ui-ux-pro-max · đếm bước 30+ việc thật · đối chiếu mockup · truy vết mockup → đặc tả → kế hoạch → PR → web |

**Giới hạn:**
- Dữ liệu demo, không chạm bản chính. Không bấm Lưu / Duyệt / Xóa (để không đổi dữ liệu dùng chung) → trạng thái **sau khi lưu** chỉ kiểm bằng đọc mã.
- Chưa thử trình đọc màn hình thật, zoom 200 %; bản tiếng Anh chưa rà kỹ.
- Máy thử lúc đầu không tải được phông (lỗi máy thử — node_modules nằm ngoài thư mục Vite cho phép; **không phải lỗi web**, bản build đóng gói phông) → đã sửa giữa chừng; mọi ảnh dùng để nhận xét chữ đã chụp lại với phông đúng. Sau khi sửa: 0 lỗi console, 0 lần gọi API bị từ chối trên 9 vai.
- Demo thiếu vài trạng thái (Tutor có buổi trong kỳ, thi thật có kết quả, em "Đã thi · chờ KQ" ở Monbay) → các màn đó rà một phần (mục 6.5).

---

## 2. Điểm khách quan

### 2.1 Nielsen — từng khu vực và toàn web (mỗi agent chấm độc lập, không xem điểm của nhau)

| # | Nguyên tắc | Khung + Tổng quan | Công việc + panel | HV & Lớp + hồ sơ | Test + nhập điểm | Phân tích + Tutor + QT | Số liệu | **Toàn web** |
|---|---|---|---|---|---|---|---|---|
| 1 | Trạng thái hệ thống | 2 | 2 | 2 | 3 | 2 | 2 | **2** |
| 2 | Khớp đời thực | 2 | 2 | 2 | 2 | 2 | 2 | **2** |
| 3 | Kiểm soát, lối thoát | 3 | 2 | 3 | 3 | 2 | — | **3** |
| 4 | Nhất quán | 1 | 1 | 1 | 1 | 1 | 1 | **1** |
| 5 | Phòng lỗi | 2 | 2 | 3 | 3 | 2 | — | **2** |
| 6 | Nhận ra hơn nhớ | 2 | 2 | 2 | 2 | 2 | — | **2** |
| 7 | Linh hoạt, nhanh | 3 | 2 | 3 | 3 | 3 | — | **3** |
| 8 | Tối giản | 2 | 2 | 1 | 1 | 2 | — | **2** |
| 9 | Nhận ra / sửa lỗi | 3 | 3 | 3 | 3 | 2 | 3 | **3** |
| 10 | Trợ giúp | 3 | 3 | 3 | 2 | 3 | — | **3** |
| | **Tổng** | **23/40** | **21/40** | **23/40** | **23/40** | **21/40** | 8/16 | **23/40** |
| | Tải nhận thức (mục trượt / 8) | 6 | 5 | 6 | 6 | 5 | 3 | cao |

"Toàn web" = trung vị các khu vực. Mức: 36–40 xuất sắc · 28–35 tốt · **20–27 tạm được** · 12–19 kém.

### 2.2 Có xứng ≥ 35/40 không? — **Không.**
- ≥ 35 cần gần như mọi nguyên tắc 3–4. Hiện **Nhất quán = 1** ở cả 6 phạm vi: cùng tên khác số; cùng việc nhiều dáng (2 giao diện nhập điểm cả lớp, 3 panel xuất, chip SOS 4 dáng, 3 kiểu hộp / panel).
- **Trạng thái = 2**: số sai, số chết, số không nói phạm vi (trong kỳ hay hiện tại, HV hay lượt, FT hay cả hai khung).
- **Tối giản = 1–2**: trang quá dài (hồ sơ lớp 4 800–5 400 px, điện thoại > 10 000 px; Lịch Test QT 2 172 px, mở khối 3 → 5 476 px), nhãn nhiễu ở gần như mọi hàng.
- Đường lên ước tính: GĐ1 → ~27–28 · GĐ2 → ~32–34 · GĐ3 → ≥ 35. **Chỉ nói "đạt" sau khi chấm lại bằng cùng phương pháp** (đợt 17/10 đã đặt đích mà không đo lại).

### 2.3 So với rà 17/10 (27/40)
- Không so khít được: đợt này sâu hơn (9 vai, mọi panel, đo số giữa các trang).
- **Thoái lui thật** (ảnh sổ tay chụp 17/10 ↔ web hôm nay):
  - Tổng quan QL: bảng "Cần xử lý · 5 việc" (một dòng mỗi loại việc, một nút "Xem" — đọc hết trong một màn) → khối "Cần bạn quyết" 21–29 dòng thẻ cao từng mục (riêng khối này: 3 395 px khi QT xem ở 375). Bản mới hơn ở chỗ duyệt được ngay tại chỗ, nhưng mất cái nhìn gộp "hôm nay có mấy loại việc".
  - Hồ sơ lớp: thêm lưới "Điểm Mock Test của lớp" 33 em dưới **mọi** tab.
  - Số liệu: dải Tổng quan "gộp hai khung" mới → 58 ≠ 53 bài trễ chấm trên cùng màn; "⚠5 quá hạn" không thuộc "19 Case".
  - Công việc GV: thêm dải "Mới dùng PISA?" + lời chào; panel Nhập điểm giữ nguyên vỏ cũ.
- **Tiến bộ thật** (giữ): trạng thái lưu từng ô + "Lưu lại"; hộp nhập điểm MT (Enter = em tiếp, nhận xét bắt buộc); Dán từ Excel (xem trước, ghi đè trước → sau, Hoàn tác); Kết quả thi theo mockup 6; phân trang 10 / 20 / 50;
  Lịch thi sửa tại hàng; panel một em; hàng đợi Chấm Speaking; Xuất Excel 3 mẫu; chip SOS viền; Esc / Quay lại giữ chỗ cuộn; lọc nằm trên URL; Hướng dẫn "Chỉ cho tôi".

### 2.4 Máy dò + đo trên trình duyệt (Assessment B, chạy độc lập) và 10 nhóm luật ui-ux-pro-max

**Máy dò làm tốt — giữ:** máy dò impeccable quét 247 tệp `web/src`: 0 lỗi chính (8/9 cảnh báo là dương tính giả); `<html>` / `<main>` không trượt ngang ở 41/41 lần đo; mọi phần tử bấm được có tên truy cập;
vòng focus thấy được ở 180/180 bước Tab, có "Bỏ qua tới nội dung"; tương phản chữ thường và viền ô nhập đạt; 0 lỗi API / JS khi tải; không chữ < 11 px.
→ **Nền kỹ thuật ổn; vấn đề nằm ở thiết kế, luồng và số liệu** — máy dò không bắt được những lỗi đó.

**Máy dò bắt được (phải sửa):**
- **B-01 P1** bảng "Lớp tôi dạy" rộng hơn thẻ 201 px trên trang chính của GV (≥ 1 280 px) — đúng ảnh 3.
- **B-02 P1** số bấm được (mở danh sách) chỉ **8×12 px** ở 1440 và 24×36 px ở 375; Tổng quan QT có 74/122 phần tử bấm được < 24 px. Một chỗ sửa cho mọi màn (`ui/SoLieuO.tsx`).
- **B-03 P2** trang quá dài: hồ sơ lớp 375 = **10 640 px (~13 màn)**, trong đó khối điểm 2 822 px nối dưới mọi tab; Tổng quan 375 = 5 741 px; Công việc 375 (QT) = 4 191 px.
- **B-04 P2** Học viên & Lớp có **93–95 phần tử bấm được ngay khung nhìn đầu**; thanh phân trang vẽ hai lần.
- **B-05 P2** ở 375, thanh điều hướng dưới **che phần tử đang focus** (WCAG 2.4.11).
- **B-06 P2** công cụ đo khung `do-khung` của repo lỗi thời sau OV-15 (5/62 kịch bản không mở được nhưng vẫn báo "xanh"; không đo "bảng rộng hơn thẻ") → lỗi bố cục lọt qua.
- **B-07…B-10 P3** chữ < 12 px dày (hồ sơ lớp 107 chỗ; `text-[11px]` 86 chỗ / 40 tệp); dấu "—" và "/" mang nghĩa nhưng tương phản 1,9–2,5:1; menu Tài khoản 375 cao hơn màn; nút ⋯ ô điểm lớp thường ẩn tới khi rê chuột.

**10 nhóm luật ui-ux-pro-max (ước của PTA Plan từ số đo A + B; 17/10 chấm 25/40):**

| Nhóm | Điểm | Vì sao |
|---|---|---|
| 1 Truy cập | 3 | focus, tên truy cập, tương phản chữ thường đạt; trừ: "—" / "/" 1,9:1, focus bị thanh dưới che, ⋯ ẩn tới khi rê chuột, tab không phím mũi tên |
| 2 Chạm & tương tác | 2 | số bấm 8×12 px; nút mở / thu hàng 16×16; hàng đợi tự nhảy, Hoàn tác mất |
| 3 Hiệu năng | 3 | tải 1,2–1,8 s bản dev, API ≤ 250 ms; còn GET trùng, 7 GET khung mỗi trang |
| 4 Phong cách | 2 | token màu thống nhất, nhưng chip / panel / hộp nhiều dáng, lệch mockup |
| 5 Bố cục & 375 | 2 | không trượt ngang trang; nhưng bảng tràn thẻ, Dán Excel bị cắt, thanh trên cắt ở 1 280, trang 375 dài 10 000+ px, bảng chưa thành thẻ ở 375 |
| 6 Chữ & màu | 2 | chữ < 12 px dày; xanh dương mang 5 nghĩa; vàng nền cho trạng thái thường |
| 7 Chuyển động | n/a | ít dùng, không gây vấn đề |
| 8 Form & phản hồi | 3 | lưu từng ô, lỗi tại ô, giữ chữ tốt; trừ: Hoàn tác mất, "Thôi học" lưu ngay, form mở sai phạm vi (Phân công, Điền Target) |
| 9 Điều hướng | 2 | link sâu tốt; nhưng thứ tự menu lệch mockup, ≥ 15 chỗ chuyển trang thừa, Quay lại mất trạng thái ở vài lối, thanh dưới 6 mục |
| 10 Dữ liệu & bảng | 2 | số không đơn vị / phạm vi, lệch giữa các nơi, bảng dày, số bấm được không rõ |
| | **21/36 (≈ 23/40)** | khớp với điểm Nielsen |

---

## 3. Vì sao web không giống mockup đã duyệt

### 3.1 Mức khớp từng màn (tính theo từng quyết định trong khung: KHỚP = 1, MỘT PHẦN = ½)

| Màn | Khớp | Lệch nhìn thấy đầu tiên | Ảnh cặp "mockup \| web" |
|---|---|---|---|
| Tổng quan QL | **~40 %** | tiêu đề "Việc hôm nay" (nhãn tab cũ); đầu trang 3 hàng thay 1 hàng; Chờ duyệt thẻ cao thay hàng gọn; "Tuần này" dùng lại khối "Lịch sắp tới" cũ thay dải 6 tuần + "Test tuần này"; số gạch chấm thay ô viền | [01](2026-10-20-danh-gia-ux/anh/cap-01-tong-quan-dau-trang.jpg) · [02](2026-10-20-danh-gia-ux/anh/cap-02-tong-quan-tuan-nay.jpg) |
| Hồ sơ lớp | **~42 %** | khung chỉ vẽ bảng HV — web thêm lưới điểm 33 em dưới mọi tab; ✓/✗ đứng sau số (khung: trước số, số cùng màu); chip SOS thiếu kỹ năng | [04](2026-10-20-danh-gia-ux/anh/cap-04-ho-so-lop-ca-trang.jpg) |
| Học viên & Lớp | **~58 %** | không có dải lọc dính chung (C10 đã CHỐT — không PR nào làm); hàng lớp không tóm tắt SOS 1/2/3 · Đã thi · Case, "+1" giấu quá hạn; lớp gập hết (khung: lớp đầu mở sẵn); Đang SOS 9 cột thay 6 cột của mockup 6 | [03](2026-10-20-danh-gia-ux/anh/cap-03-hoc-vien-lop-tat-ca.jpg) |
| Công việc | **~65 %** | panel Nhập điểm = khung "Trước" (bảng nửa panel, 2 link ↗, không "Còn n bài"); QL dùng bố cục hàng đợi GV; bỏ "Mẫu nhận xét", "Việc i/N", "✓ Xong · Hoàn tác" | [07](2026-10-20-danh-gia-ux/anh/cap-07-cong-viec-gv.jpg) · [10](2026-10-20-danh-gia-ux/anh/cap-10-cong-viec-ql.jpg) |
| Test | **~70 %** | chip Kế hoạch Test giữ kiểu cũ một dòng "L R W S · trễ W4 JUL/2026" (khung: 2 dòng "tuần / Đã thi", email dưới tên); Lịch Test lưới đủ cột mọi em (khung ba khối: chỉ em + cột còn nợ) | [08](2026-10-20-danh-gia-ux/anh/cap-08-ke-hoach-test.jpg) |
| Phân tích | **~75 %** | Báo cáo không có chế độ chiếu (sáng, chữ lớn); Phân tích GV giữ bảng cũ 12 cột + câu dài (khung 4c: bảng gọn 7 cột); Chi nhánh tách khỏi hàng lọc | [05](2026-10-20-danh-gia-ux/anh/cap-05-phan-tich-gv.jpg) · [06](2026-10-20-danh-gia-ux/anh/cap-06-bao-cao.jpg) |
| Tutor | cấu trúc ~88 % | đúng khung, nhưng mở ra **trang rỗng** (dữ liệu demo ghi buổi tutor theo giờ thật 20/10, ngoài khoảng xem) | [09](2026-10-20-danh-gia-ux/anh/cap-09-tutor.jpg) |
| Nền chung (màu, chip, menu tài khoản) | ~80 % | thứ tự thanh trên (khung: Công việc đầu), chuông có số, ô tìm "…hoặc email" | — |

Chỗ khớp cao đều là chỗ kế hoạch **trỏ đúng một khung** ("mockup 6 khung 6", "khung 2", "theo mockup 3"). Chỗ lệch nặng là chỗ kế hoạch chỉ ghi một chữ ("Tuần này", "Cần bạn quyết"), ghi ngược ý ("giữ chiều sâu bảng cũ") hoặc không ghi gì (dải lọc C10, đầu trang, khối cũ cần bỏ, vị trí ✓/✗).

### 3.2 Nguyên nhân gốc (có bằng chứng — chi tiết `2026-10-20-danh-gia-ux/a6-nguyen-nhan-lech-mockup.md`)

| # | Nguyên nhân | Bằng chứng chính | Mức |
|---|---|---|---|
| N1 | **Kế hoạch dịch mockup thành chữ, mất bố cục; không có tiêu chí "giống khung X"** | 6 mockup ≈ 50+ khung → kế hoạch OV-15 có 34 ý, chỉ 5 ý trỏ một khung; tiêu chí duy nhất "chữ trên màn = chữ mockup"; dải lọc C10 [CHỐT] nằm ở đặc tả §5 nhưng rơi khỏi kế hoạch 15a | Cao |
| N2 | **Luật "sửa trên nền có sẵn / bố cục đã khoá / dùng lại component"** đẩy session vá màn cũ | CLAUDE.md (Luật cứng 08/10, mục Giao diện "bố cục đã khoá"), DESIGN.md "bản ghi hệ đang có… không phải thiết kế mới"; kết quả: dùng lại `HopChoDuyet` (thẻ Công việc), `LichSapToi` (OV-6a), `KhoiDiemLop` (04/10), bảng GV cũ, chip lịch cũ, ô chi nhánh nhãn trên, banner HD-a | Cao |
| N3 | **Thứ tự nguồn đặt kế hoạch + luật cũ TRÊN mockup** | CLAUDE.md "Khi các nguồn mâu thuẫn": kế hoạch > mockup → luật 27/09 "không tự mở lớp" thắng khung "MB FT 101 đang mở"; luật một chữ thắng nhãn mockup; plan §7 đổi "Báo cáo" mà không sửa mockup → web không theo cả hai ("Việc hôm nay") | Cao |
| N4 | **Không có cổng "giống mockup" khi rà / merge** | 0/13 PR có ảnh mockup cạnh web; mẫu rà 10B không có mục so mockup; rà = "planning đọc diff + xem ảnh"; 124/133 ảnh PR chỉ là một khung nhìn; lệch đã lộ trong ảnh PR #463 #469 #462 #464 vẫn merge; #471 (khớp mockup 3 hơn) bị đóng vì #463 merge trước | Cao |
| N5 | **Luật tiết kiệm token bỏ bước kiểm hình** | plan.md 1.3b: không `polish`, bấm thử MỘT lần; kế hoạch OV-15 bỏ cả `layout`; phần dưới trang (Lớp tôi dạy, khối điểm cuối hồ sơ lớp) gần như không ai xem | Cao |
| N6 | **Chủ SP chỉ duyệt khung tĩnh, không xem bản chạy trước merge** | mockup 6 (10 khung) duyệt ≤ 20 phút; "không nhắc = duyệt" ≈ 60 khung duyệt ngầm; 14 PR giao diện (~18 500 dòng) merge trong 23,5 giờ, 5 PR lúc 22:14–04:17; mở → merge trung vị ~46 phút | Cao |
| N7 | **6 PR song song chia theo TỆP, không theo MÀN** | "chỉ sửa file trong phạm vi mình"; Công việc bị 9 PR chạm, Hồ sơ lớp 8, Test 8, Học viên & Lớp 6, Tổng quan 5; đầu trang / dải lọc / khối cũ không ai sở hữu; OV-15d chạy hai lần song song | TB–Cao |
| N8 | **Việc lẻ chỉ theo mục session tự khai; đợt sau bị cấm đổi bố cục** | 15h/15i chỉ gom mục PR tự ghi; "#469: Chưa xác minh… 2 bài hiện 3 em" không vào đâu; kế hoạch 15g/h/i ghi "không màn mới → không mockup" | TB |
| N9 | **Phép kiểm đọc chuỗi mã nguồn khoá bố cục cũ** | DL-6 buộc khối "Điểm Mock Test của lớp" có + mở sẵn; #463 phải sửa 12 phép kiểm "giao diện trước"; không phép kiểm nào nói "giống mockup" | TB |
| N10 | **Mockup viết tay, không từ thành phần thật; mockup mâu thuẫn nhau** | CSS riêng mỗi mockup; `/dev/thanh-phan` không có thành phần OV-15; thanh trên m1 ≠ m3; Chờ duyệt là thẻ (m2) và là hàng (m3); "Báo cáo" ở 3 chỗ khác nhau | TB |
| N11 | **Dữ liệu demo không đủ trạng thái của khung** | buổi tutor ghi giờ thật → Tutor rỗng; Lịch thi tháng tới 0 HV; ảnh PR TU-b chụp trên DB khác; demo dày hơn mockup (33 em, ~45 vi phạm) → trang dài mà mockup không lường | TB |
| N12 | **Session cloud không hỏi lại được** | gặp mockup ≠ mã ≠ luật thì tự quyết, ghi cuối PR; planning chỉ thấy khi đã xong | TB |

**Đã kiểm và BÁC:** "model yếu" (12/13 PR giao diện chạy Opus; #471 và #463 cùng Opus mà kết quả khác xa) · "một session làm ẩu" (lệch có hệ thống ở mọi PR).
**[GIẢ THUYẾT] N13:** session đọc mockup dạng mã HTML (~700 KB) chứ không chụp ra hình để nhìn — kiểm bằng transcript session cloud #463 / #471.

### 3.3 Thay đổi quy trình đề xuất [ĐỀ XUẤT — chủ SP duyệt rồi mới ghi vào CLAUDE.md / plan.md]

| # | Luật mới (chữ đề xuất) | Thay chỗ | Kiểm thế nào |
|---|---|---|---|
| Q1 | PR có giao diện phải có **bảng truy vết**: mỗi khung mockup (tệp + tên khung) → thành phần / tệp web → Task → ảnh nghiệm thu; thêm dòng **BỎ** (khối cũ phải xoá) và **GIỮ** (phần ngoài khung giữ nguyên). Thiếu bảng → không giao. | plan.md 1.2 | số dòng bảng = số khung của màn |
| Q2 | Ảnh nghiệm thu = **ảnh cặp mockup \| web**, cùng vai, cùng dữ liệu, **toàn trang**, 1440 tối + 375 sáng; mô tả PR có bảng khung → KHỚP / KHÁC (lý do). Công cụ ghép ảnh vào `scripts/`. | plan.md 1.2, mẫu prompt 9.0 | đủ ảnh cho mọi dòng bảng Q1 |
| Q3 | PR đổi bố cục chia theo **MÀN** (một màn một PR, sở hữu cả đầu trang, dải lọc, khối cũ); phần máy chủ tách PR riêng chạy trước; chỉ song song khi khác màn. | kế hoạch đợt | không màn nào bị > 1 PR giao diện trong một đợt |
| Q4 | **Cổng độ khớp** trước merge: agent rà xem ảnh cặp, chấm từng dòng bảng; < 90 % KHỚP (KHÁC chỉ tính khi chủ SP đã đồng ý lý do) → không merge. Kết quả rà ghi thành **bình luận PR**. | plan.md 1.3, mẫu 10B | PR thiếu bình luận chấm → chưa merge |
| Q5 | PR đổi bố cục: **chủ SP xem 3–5 ảnh cặp hoặc bản chạy, trả "đạt / sửa" trước merge**; không merge PR đổi bố cục qua đêm. PR chỉ máy chủ giữ luồng tự merge. | bộ nhớ "Planning tự merge", "Luồng qua đêm" | bình luận "chủ SP: đạt" trên PR |
| Q6 | "Khi các nguồn mâu thuẫn": **khung mockup đã duyệt thắng câu kế hoạch và mọi quyết định cũ hơn ngày duyệt**, trừ luật nghiệp vụ, quyền, chống mất dữ liệu. Quyết định mới trái khung → sửa mockup trong cùng PR tài liệu. | CLAUDE.md | không còn "theo plan §… trái mockup" mà mockup chưa sửa |
| Q7 | "Tinh chỉnh, không làm lại" — **trừ màn có mockup mới đã duyệt: làm lại theo khung, được xoá khối / component cũ không có trong khung**. DESIGN.md thêm "Mẫu trang" (đầu trang, dải lọc, khối). | CLAUDE.md, DESIGN.md | bảng BỎ của Q1 làm đủ |
| Q8 | 1.3b tách hai loại PR: **sửa nhỏ** giữ như nay; **làm lại màn** được `layout` + `polish` trong phạm vi, bấm thử ≥ 2 vòng, ảnh toàn trang. Kế hoạch ghi rõ loại. | plan.md 1.3b | kế hoạch có dòng "Loại PR" |
| Q9 | PR làm lại màn được xoá / sửa phép kiểm đọc chuỗi nguồn khẳng định bố cục cũ; không thêm phép kiểm chuỗi mới cho bố cục — dùng ảnh cặp. | plan.md 1.2 | mô tả PR liệt kê phép kiểm bỏ / sửa |
| Q10 | Mọi "tự quyết / lệch mockup / chưa xác minh" trong mô tả PR được chép vào plan.md mục 4 **trước khi merge**; còn "chưa xác minh" ở luồng chính → không merge. | plan.md 1.3 | grep "Chưa xác minh" ở PR đã merge = 0 |
| Q11 | Dữ liệu demo dựng đủ trạng thái của từng khung (tutor có buổi trong 2 tuần trước ngày demo, Lịch thi có em tháng tới, thi thật có kết quả, em Đã thi · chờ KQ), theo **ngày demo**, không giờ thật. Ảnh PR chụp trên `npm run seed` nguyên. | seed | mở /tutor, Lịch thi, Thi thật đều có dòng |
| Q12 | Mockup dựng từ thành phần thật: mở rộng `/dev/thanh-phan` thành sân mẫu; mockup vẽ **cả trang**, có trạng thái rỗng và dữ liệu dày; thành phần mới ghi "MỚI" → kế hoạch có Task tạo nó. | quy trình mockup | mockup không có dáng ngoài sân mẫu mà không ghi MỚI |
| Q13 | Không nêu điểm Nielsen "đạt" khi chưa chấm lại bằng cùng phương pháp trên bản đã merge. | plan.md | báo cáo đợt có bảng chấm lại |

---

## 4. Vấn đề xuyên suốt (một gốc, nhiều màn) — sửa ở gốc thì nhiều màn cùng lên

Mỗi mục: **Vấn đề · Nguyên nhân · Ảnh hưởng · Phương án · Lý do · Kế hoạch**. Mã chi tiết trỏ tới phụ lục.

### X1. Số liệu không cùng nguồn, cùng phạm vi — P0 / P1 · [XÁC NHẬN] + [PHÁT HIỆN]
- **Vấn đề:**
  - **P0** "Theo tháng" ra tháng trước (chọn 09/2026 → "08/2026 · 03/08–30/08", số của tháng 8) ở cả 6 tab Phân tích và Tutor (A5-01).
  - "PA có kết quả trong kỳ" ở Báo cáo luôn = 10 ở mọi khoảng; Hiệu quả PA cùng bộ lọc = 2 (A7-02, A5-02).
  - "Chờ duyệt 10 ⚠1" nhưng 3 thẻ + "Xem thêm 9" = 12, có thẻ BC / CP khi đang lọc Monbay; 2 thẻ đỏ "Quá hạn" (A7-01, A1-02) — **đúng ảnh 1**.
  - Công tắc Fast Track / Lớp thường chỉ áp nửa trang Tổng quan: dải "58 bài · 4 GV" (gộp hai khung) ≠ khối "53 bài · 3 GV" (FT); "⚠5 quá hạn" có 2 Case lớp thường nên không thuộc "19 Case"; khối Chốt lộ trình lớp FOU hiện khi đang xem FT (A1-03, A7-03).
  - SOS bốn định nghĩa, nhãn không nói: Tổng quan 6/5/3 (hiện tại, gồm SOS tạm) · Đang SOS 9 (8 tuần thi) · Báo cáo 2/3/0 (HV trong kỳ, bỏ tạm) · Kết quả thi 3/4/2 (lượt, gồm tạm) (A7-04, A5-03, A3-08).
  - Đầu nhóm lớp ở Đang SOS và Cần làm **đếm trên trang đang xem** (MB FT 101 "2 em" → thật 7; "⚠ 8 việc" ↔ "⚠ 22" khi đổi 10 → 50 dòng/trang) (A3-02, A7-09).
  - "Cần làm 51" = "Tất cả 51" (46/51 em bị tính "Thiếu thông tin") (A3-03, A7-08). "Đạt" hai nghĩa (Test + SOS = không SOS; Kết quả thi = OVR ≥ kỳ vọng); "Thiếu điểm" ≠ "Chưa đủ điểm" (A7-11).
  - Badge "Công việc n": GV = việc quá hạn, QL = thẻ chờ duyệt mọi chi nhánh (A7-13, CV-16). Chuông xếp 3 loại việc quá hạn vào "Để biết"; thẻ đã xử lý vẫn tên "Chờ duyệt" và vẫn được đếm (A7-05, A1-04).
  - Việc "2 bài" mở panel 3 em (em thứ 3 là MT lịch sử nhập bù, không nhãn) (A7-10, CV-01) — **đúng ảnh 3**. "78 bài chờ chấm" gồm cả bài chưa tới hạn + MT cũ.
- **Nguyên nhân:** mỗi màn tự đếm / tự lọc thay vì đọc **một sổ chỉ số** (`shared/domain/metrics.ts` có nhưng nhiều nơi không qua); quyết định cũ chồng nhau (06/10 "hộp duyệt luôn mọi chi nhánh" ↔ OV-15h1 "số theo chi nhánh"; "Cần xử lý luôn gộp hai khung" ↔ công tắc FT / LT); chia trang trước khi đếm; hàm tháng suy từ ngày Thứ Hai (`khoangThoiGian.ts:59-61, 76-80`); không có phép kiểm "cùng tập giữa các nơi".
- **Ảnh hưởng:** QL / QT không tin con số; giao ban mất thời gian đối chiếu; **báo cáo in sai tháng, sai số PA**; có thể duyệt thẻ chi nhánh khác; bỏ sót em SOS 3 — trái nguyên tắc số 1 của sản phẩm "không em nào bị bỏ sót".
- **Phương án — "một sổ số liệu":** (1) bộ lọc trang = bộ lọc mọi số trên trang (chi nhánh nhớ / URL, khung, khoảng); số cố ý khác phạm vi (badge, chuông) ghi "mọi chi nhánh" ngay cạnh;
  (2) một khái niệm = một chỉ số trong sổ = một tên; hai định nghĩa thật khác nhau → hai tên khác hẳn ("SOS hiện tại" ↔ "Lượt SOS trong kỳ"); (3) số luôn kèm đơn vị + phạm vi ngắn ("6 HV · hiện tại", "28 bài · trong kỳ");
  (4) đếm trên toàn bộ rồi mới chia trang; (5) chuông = Công việc (cùng hàm, việc xong thì rời số đếm); (6) sửa 2 lỗi dữ liệu (tháng, PA trong kỳ).
- **Lý do:** đúng luật chủ SP "cùng số liệu cùng nguồn, cùng hàm"; nâng Trạng thái + Nhất quán nhiều nhất; không đổi bố cục, không cần mockup.
- **Kế hoạch:** GĐ1 — PR **SL1** (lỗi dữ liệu + Chờ duyệt chi nhánh + khoá panel số + chuông + đếm toàn bộ + panel chỉ em của việc) chạy ngay; PR **SL2** (một phạm vi cả trang, định nghĩa SOS, đơn vị) sau khi chủ SP chốt câu 9.1-4.
  Phép kiểm bắt buộc: "số trên trang = số dòng trong panel", "cùng chỉ số ở hai tab = cùng tập", "12 tháng 2026 đúng tháng".

### X2. Số bấm được: chết, quá nhỏ, không rõ số nào bấm được, panel chỉ ra tên — P1 · [PHÁT HIỆN]
- **Vấn đề:** 8 số ở dải "HV cần chú ý" + hàng "Cả Monbay" bấm không mở gì (A1-01); số bấm được chỉ 8×12 px (B-02); số gạch chấm khắp nơi, số lớn ở Báo cáo không bấm còn số nhỏ thì bấm (A5-19);
  panel từ số của Báo cáo chỉ là danh sách tên, không điểm / kết quả / số ngày trễ, panel từ dòng GV mất tên GV (A5-07) — trái C26 đã chốt; panel "17 bài trễ chấm" ghi "Nhập điểm" nhưng QL không nhập được (A1-06).
- **Nguyên nhân:** dải và hàng tổng dùng **cùng khoá panel** `?so-lieu=` → hai panel cùng mở, luật "một panel một lúc" đóng cả hai; kiểu "số gạch chấm" (16/10) khác mockup (ô viền); một panel danh sách chung `NganDanhSach` cho mọi số; quyền `score.edit` chỉ GV (mockup 1d giả định QL nhập thay).
- **Ảnh hưởng:** thao tác chính của trang quản lý "bấm số → thấy đúng danh sách → làm" (C02) hỏng một nửa; Hướng dẫn QL lại dạy "bấm số mở danh sách".
- **Phương án:** sửa khoá panel; số bấm được = ô viền như mockup (vùng bấm ≥ 24 px máy tính, 44 px điện thoại); số 0 không bấm; **một mẫu "panel kết quả cụ thể"**: bảng nhỏ Học viên · Lớp · Đợt · Điểm / kết quả · Việc tiếp + nút làm theo quyền; giữ tên đối tượng ở tiêu đề.
- **Lý do:** C02, C26 đã chốt; WCAG 2.5.8; một mẫu dùng mọi nơi.
- **Kế hoạch:** GĐ1 (khoá panel + vùng bấm — sửa 1–2 tệp `ui/SoLieuO.tsx`, `ui/SoLieu.tsx`); GĐ2 (ô viền + panel kết quả theo mockup 3 khung 1d, Báo cáo).

### X3. Bắt chuyển trang, panel chồng panel, hai giao diện cho một việc — P1 · [XÁC NHẬN] + [PHÁT HIỆN]
- **Vấn đề (≥ 15 chỗ):**
  - Đổi trang khi đáng lẽ làm tại chỗ: "Mở" thẻ Chờ duyệt → hồ sơ HV (Tổng quan, Công việc) trong khi "Mở Case" ngay dưới mở panel (A1-10, CV-27); 2 link ↗ trong panel Nhập điểm → Test, trang đích không có "‹ Công việc" (CV-04);
    ↗ ở Lịch Test → trang `/nhap-diem` theo tuần, Quay lại mất khối đang mở (TST-02, TST-11); cột "Việc tiếp theo" có 3 hành vi (panel / sang Test / sang hồ sơ HV) (A3-07); chip hồ sơ lớp "8 chờ duyệt", "78 bài chờ chấm", "+1" dẫn sang 3 trang khác (A3-07);
    Chốt lộ trình: Công việc chuyển trang, Tổng quan mở panel (CV-20); Xem nhận xét Speaking → trang Mock (CV-31).
  - Chồng lớp: "Phân công…" mở cả ngăn "Thông tin lớp" (đổi phân công **cả lớp**) đè lên panel đang mở (CV-07); "+ Giao việc", "Gia hạn", số "Lớp tôi dạy" mở ngăn phủ chồng panel (CV-19);
    hộp lịch → ⋯ → "Đổi tuần" → panel "Xếp lại bài vắng" chồng lên hộp (3 lớp) (TST-16); Tutor: hộp Thêm chồng hộp Gộp (A5-26).
  - Hai giao diện cho một việc: nhập điểm cả lớp = trang theo **tuần** (13 cột) và panel theo **lượt** — cùng lớp ra 5 / 8 / 32 em (TST-02); 3 lối xuất, 2 panel cùng "xuất điểm" khác bộ lọc, khác tên tệp (TST-04); Case một gốc sinh hai dòng việc (CV-08).
- **Nguyên nhân:** mỗi PR đổi một lối, lối cũ giữ (N7, N8); chưa có "hợp đồng panel" chung; dùng lại panel có sẵn sai mục đích (Thông tin lớp cho Case thiếu người).
- **Ảnh hưởng:** rời ngữ cảnh, mất bộ lọc / vị trí cuộn; 2–4 lần đổi trang cho việc đáng lẽ 1–2 bấm; học hai giao diện cho một việc; nguy cơ đổi phân công cả lớp ngoài ý.
- **Phương án — "hợp đồng panel":** mọi việc từ hàng / chip / số mở **panel tại chỗ** (khung phải thay nội dung, không ngăn phủ chồng); việc ngắn → **hộp nhỏ** ngay dòng (Phân công, Gia hạn, Xếp lại bài vắng);
  một panel cho một việc ("Nhập điểm lớp" = panel theo lượt cho mọi lối; route cũ chuyển hướng; một "Xuất điểm Test"); **chỉ chuyển trang để xem hồ sơ** — link "Hồ sơ ↗" tách khỏi nút làm việc.
- **Lý do:** CLAUDE.md "xử lý tại chỗ; tách nút làm việc với link xem hồ sơ; không panel lồng panel; Quay lại về đúng nguồn".
- **Kế hoạch:** GĐ1 các lỗi đơn (Phân công → hộp nhỏ; Chốt lộ trình dùng chung panel; "Mở" → Case tại chỗ; ↗ trong panel bỏ); GĐ2 gộp Nhập điểm lớp + Xuất điểm khi làm lại màn Test.

### X4. Trùng lặp khối và việc — P1 · [XÁC NHẬN] + [PHÁT HIỆN]
- **Vấn đề:** góc "Cần làm" ở Học viên & Lớp = danh sách Công việc lọc chi nhánh (A3-03) — **đúng ảnh 7**; lưới "Điểm Mock Test của lớp" cuối hồ sơ lớp = panel Nhập điểm (A3-01) — **đúng ảnh 4, 5**;
  3 ô số đầu Lịch Test = đầu các khối (TST-03) — **đúng ảnh 12b**; panel "Quá hạn chấm" 58 dòng = khối 1; chuông "Cần làm" = thẻ Chờ duyệt (A1-17); "Tạo bài kiểm tra theo chương trình" (Lịch Test) = "Xếp cả lớp theo đề xuất" (Kế hoạch Test) (TST-10); 4 dòng Bàn giao cho một lớp (CV-28).
- **Nguyên nhân:** thêm cái mới không bỏ cái cũ — kế hoạch không có danh sách **BỎ**; thiết kế 14/10 (Cần làm) giả định "Thiếu thông tin 12/100", thực tế 46/51.
- **Ảnh hưởng:** trang dài gấp 2–6; hai nơi cùng việc nhưng khác số, khác cách xếp → không biết dùng nơi nào.
- **Phương án:** bỏ góc Cần làm (thay chip "⚠ n quá hạn" trên hàng lớp mở panel việc của lớp); bỏ khối lưới cuối hồ sơ lớp (lưới chỉ qua nút Nhập điểm); bỏ 3 ô Lịch Test (số + đơn vị ở đầu khối); bỏ nút tạo bài ở lưới chấm; gộp dòng việc trùng gốc.
- **Lý do:** một việc một nơi; giảm ~2 200 px mỗi tab hồ sơ lớp; giảm một góc nhìn + 3 lọc phụ.
- **Kế hoạch:** GĐ2 theo màn (bỏ Cần làm và bỏ khối lưới cần chủ SP chốt — mục 9.2).

### X5. Trang quá dài, hàng quá dày, nhãn nhiễu — P1 / P2 · [XÁC NHẬN] + [PHÁT HIỆN]
- **Vấn đề (số đo):** hồ sơ lớp 4 800 px (1440) / 10 640 px (375 ≈ 13 màn); Tổng quan 2 263 / 5 741 px; Lịch Test QT 2 172 px, mở khối 3 → 5 476 px; Công việc 375 (QT) 4 191 px; Học viên & Lớp mở một lớp ở 375: 10 830 px.
  Hàng em 2–5 dòng, cùng tin lặp 3 lần ("S dưới kỳ vọng" ở chip + "Không đạt: S" + "5.0 ×") (A3-06). Nhãn có ở gần mọi hàng nên mất nghĩa: "Thiếu n" 46/51 em (A3-04), "vào muộn" 20/33 (TST-07), "/2026" 108 lần, "L R W S" ~99 chip (TST-06),
  "Nhận xét" 32 nút + "Điền cả cột" 8 (TST-08), "Nếu duyệt: …" lặp mọi thẻ (A1-09). Khung nhìn đầu Học viên & Lớp có 93–95 phần tử bấm được (B-04).
- **Nguyên nhân:** thêm cột / khối không bớt (C13 thêm cột điểm mà giữ ô "Kết quả gần nhất" 3 dòng); mockup vẽ 8–10 hàng dữ liệu đẹp; định nghĩa "Thiếu thông tin" gồm trường được phép trống (Điểm đầu vào); không ai sở hữu "độ dài trang".
- **Ảnh hưởng:** Chị Vy không nhìn ra việc gấp; Cô Linh vuốt 13 màn; tải nhận thức cao (5–6/8 ở mọi khu vực).
- **Phương án:** mỗi màn có **ngân sách**: trang làm việc 1440 ≤ ~2 màn, 375 ≤ ~4 màn ở trạng thái mặc định; hàng em 1–2 dòng (bỏ thông tin trùng); nhãn chỉ khi có nghĩa (Thiếu → một số ở hàng lớp; bỏ "vào muộn"; năm chỉ ở đầu cột / khi khác năm; "Nhận xét" chỉ ở ô đang làm);
  lưới chỉ em + cột còn nợ (nút "Cả lớp" xem đủ); "Cần bạn quyết" ≤ 5 dòng mỗi nhóm + "Xem tất cả n ›".
- **Lý do:** Tối giản + tải nhận thức; luật chủ SP "thông tin vừa đủ, cái quan trọng trước, chi tiết mở khi cần".
- **Kế hoạch:** GĐ2 theo màn; tiêu chí nghiệm thu có số đo chiều cao trang (script đo của đợt rà đưa vào `scripts/`).

### X6. Không có khung trang chung — P1 / P2 · [XÁC NHẬN] + [PHÁT HIỆN]
- **Vấn đề:** đầu trang 3 hàng (Tổng quan) / 4 hàng (Phân tích) thay vì 1 hàng; ô Chi nhánh kiểu form có nhãn trên, dồn góc phải xa ~1 200 px (A1-08, A5-09) — **đúng ảnh 1, 9**; công tắc chương trình mỗi trang một kiểu ("Tất cả · FT · LT" / "FT · LT" / không có ở Kết quả thi / ô chọn "Loại lớp: …");
  **không có dải lọc dính chung** (C10 đã CHỐT — không PR nào làm); thanh trên: thứ tự khác mockup (Công việc thứ 5), "Thông báo 30" chữ thay chuông, **mất mục Tutor ở 1 280 px**, mất số Công việc ở 1 100 px, 375 thanh dưới 6 nút (A1-05);
  tiêu đề trang ≠ tên menu ("Việc hôm nay", "Mock Test", "Số liệu", "Học viên của tôi", "Chấm điểm") (A1-07); dải "Mới dùng PISA?" chen giữa; logo không bấm được; menu tài khoản 375 cao hơn màn (B-09).
- **Nguyên nhân:** N1 (dải lọc C10 rơi khỏi kế hoạch), N7 (không ai sở hữu đầu trang), luật dùng lại `BranchFilter` có nhãn trên.
- **Ảnh hưởng:** mỗi trang học lại chỗ lọc; QT khó biết đang xem chi nhánh nào; laptop 13–14" mất mục menu; mất ~110 px trước nội dung.
- **Phương án — "khung trang" một thành phần:** hàng 1 = Tiêu đề (= tên menu) · Chi nhánh ▾ (nút gọn) · Chương trình (Tất cả | FT n lớp | LT n lớp) · Thời gian (nếu có) · Dữ liệu đến · nút chính; dính khi cuộn; chip đang lọc có ✕ + "Bỏ lọc".
  Thanh trên theo mockup: Công việc đầu, chuông có số, ô tìm "lớp, học viên hoặc email"; thiếu chỗ (≤ ~1 300 px) gom "Thêm ▾"; 375 ≤ 5 nút.
- **Lý do:** mockup 1 khung 2a / 2b đã duyệt; nâng Nhất quán + Nhận ra hơn nhớ cho mọi trang cùng lúc.
- **Kế hoạch:** GĐ2 bước đầu tiên (nền cho mọi màn); phần thanh trên bị cắt sửa ngay ở GĐ1.

### X7. Thành phần nhiều dáng — P2 · [PHÁT HIỆN]
- **Vấn đề:** chip SOS 4 dáng, kỹ năng lúc trong lúc ngoài chip, W1 / W2 tách thành hai môn (A3-10); ✓/✗ trước số / sau số / không có (A3-23, C6 của a6); ô trống "—" · "–" · "chưa có" · "không có" · "0" · để trống (A7-25, A5-12);
  xanh dương = nhấn = đang chọn = bằng kỳ vọng = "Đang xử lý" = tuần này; vàng nền cho trạng thái thường (A3-17); mã tuần 3 dạng (W2 SEP · W2 SEP/2026 · W2 SEP 2026) (TST-22); hộp / panel 3 dáng (neo chip, giữa màn, ngăn phải; đầu panel v3 ↔ đầu cũ 52 px) (TST-24, CV-30);
  tên việc ≠ tên panel ở 6 loại việc (CV-13); "Mở" dùng cho cả làm việc lẫn xem; "✕" hai nghĩa (A7-27, A7-28); chữ < 12 px dày (`text-[11px]` 86 chỗ / 40 tệp); "—" và "/" tương phản 1,9–2,5:1 (B-07, B-08).
- **Nguyên nhân:** OV-15a "chip SOS MỘT component" chưa phủ hết; không phép kiểm chống trôi; mockup không dựng từ thành phần thật (N10).
- **Ảnh hưởng:** người dùng phải học lại ý nghĩa ở mỗi màn; màu mất nghĩa.
- **Phương án:** sân mẫu `/dev/thanh-phan` + phép kiểm chặn trôi: một `ChipSos` (kèm kỹ năng, W gộp); một `DauKetQua`; một luật ô trống ("—" = không áp dụng, để trống = chưa có); màu theo 5 nghĩa của mockup 1 §1a; một hàm định dạng tuần;
  một mẫu panel (đầu = tên việc + hạn) + một mẫu hộp nhỏ; một hàm tên việc dùng cho cả dòng và panel; chữ ≥ 12 px.
- **Lý do:** Nhất quán 1 → 3 không cần đổi luật.
- **Kế hoạch:** GĐ3 (phần nhỏ làm kèm từng màn ở GĐ2 khi màn đó chạm thành phần).

### X8. Thuật ngữ: một khái niệm nhiều tên, một tên nhiều nghĩa — P2 · [PHÁT HIỆN]
- **Vấn đề:** **9 tên** cho "bài quá hạn chưa có điểm" (trễ chấm, quá hạn chấm, bài quá hạn, nợ điểm, chưa điểm — đơn vị HV…); "Tổng quan" ↔ "Việc hôm nay"; "Chờ duyệt" 2 nghĩa 3 đơn vị; "Đạt" 2 nghĩa; "bài" 2 nghĩa (một ô kỹ năng ↔ cả bài kiểm tra);
  "Kết quả" 5 nghĩa; "Cần chú ý" 4 định nghĩa; "Người giữ" ↔ "Người phụ trách"; "Việc tiếp" ↔ "Việc tiếp theo"; "Cả lớp" (thực ra = hiện mọi cột) (A7 §2.2, A7-20…24).
- **Nguyên nhân:** chữ viết rải trong từng màn; thuật ngữ chốt (`THUAT_NGU_DA_CHOT.md`) không có phép kiểm.
- **Phương án:** bảng chốt ở phụ lục a7 §2.2 → cập nhật `THUAT_NGU_DA_CHOT.md` (chủ SP duyệt) → từ điển chữ dùng chung → phép kiểm chặn tên cũ; một tên cho bài quá hạn ("bài quá hạn chấm" — khuyến nghị).
- **Kế hoạch:** GĐ1 đổi các chữ sai nghĩa rõ ("Việc hôm nay", "Cả lớp", "Chờ 4 kỹ năng"); GĐ3 đổi toàn web + Hướng dẫn + sổ tay.

### X9. Việc hiện cho sai người, sai thứ tự — P1 · [PHÁT HIỆN]
- **Vấn đề:** QL: việc của chính QL (Chốt lộ trình, Bước tiếp, Phân công) bị tính "Của GV", nằm nhóm gập cuối trang; "Của tôi" báo "Xong hết hôm nay ✓" ngay dưới "Chờ bạn duyệt 10 ⚠1" (CV-06);
  vào Công việc, panel **tự mở lưới điểm của GV** và trang tự cuộn khỏi "Chờ bạn duyệt" (CV-09); GV thấy việc "Chưa có người" / "Chọn người phụ trách" không phải của mình, mở ra panel có nút chính "Hoàn thành Case" (CV-08);
  hàng đợi tự sang việc khác loại, việc đang gập, việc không phải của mình; "Hoàn tác 10 s" bị thay ngay (CV-05); GV thấy chip "Chờ duyệt 6", "Thiếu thông tin 39" (việc của QL) (A3-30); TVV / CX không có khu Công việc (CV-32); CX thấy tên GV ở Báo cáo (A5-28).
- **Nguyên nhân:** "của tôi" chỉ tính theo người phụ trách; bố cục hàng đợi GV áp nguyên cho QL; mockup 3 đặt "Việc quản lý" cuối, gập.
- **Ảnh hưởng:** Chị Vy giao ban không thấy việc của chính mình; GV bị kéo vào việc không phải của mình, có thể bấm nhầm.
- **Phương án:** QL: khối **"Cần bạn quyết"** đầu Công việc (Chờ duyệt + Chưa có người + Việc quản lý quá hạn / ≤ 7 ngày), việc của GV gập theo GV; không tự mở việc của người khác, không tự cuộn; hàng đợi chỉ sang việc **cùng nhóm, của chính tôi, đang hiện**, giữ "✓ Xong · Hoàn tác";
  chỉ hiện chip / việc mà vai đó làm được.
- **Lý do:** CLAUDE.md "giao diện theo vai đi cùng quyền"; nguyên tắc "không em nào bị bỏ sót".
- **Kế hoạch:** GĐ1 (tự mở / tự cuộn, nút chính Case, chip theo vai, hàng đợi cùng nhóm); GĐ2 (Công việc QL theo mockup 3).

### X10. Chữ giải thích dài, trợ giúp nói sai — P2 · [XÁC NHẬN] + [PHÁT HIỆN]
- **Vấn đề:** ⓘ Kế hoạch Test là đoạn văn 4 đoạn và **nói sai màu** ("Xám = đã thi xong"; thật: xanh lá) (TST-05); Phân tích GV có câu hướng dẫn + dòng chú giải dài (A5-11) — **đúng ảnh 11**; "Đánh dấu ô ở thẻ để duyệt nhiều cùng loại.";
  "Nếu duyệt: … hạn hết T3" (ghi thứ, trái chốt "hạn chỉ ghi ngày") (A1-09); Hồ sơ cá nhân 5 câu lý do (A1-22); Hướng dẫn QL dạy "bấm số mở danh sách" trong khi số đó đang chết.
- **Nguyên nhân:** luật "chữ ngắn 1–3 từ" không có phép kiểm; chú giải viết tay, không sinh từ nguồn màu thật; Hướng dẫn không kiểm cùng màn.
- **Phương án:** bỏ câu dưới nút (đưa vào ⓘ ngắn); chú giải màu sinh từ bảng màu thật, hiện thành dải chip mẫu; "Nếu duyệt" ghi ngày cụ thể; Hướng dẫn sửa cùng PR với màn.
- **Kế hoạch:** GĐ1 (ⓘ sai màu, "hạn hết T3"); GĐ3 (gọn chữ toàn web).

### X11. Dữ liệu demo và công cụ kiểm không đủ để nghiệm thu — P2 cho quy trình · [PHÁT HIỆN]
- **Vấn đề:** Tutor mở ra rỗng (buổi tutor ghi giờ thật 20/10, ngoài khoảng xem) — **đúng ảnh 2**; thi thật chưa có kết quả; Lịch thi tháng tới 0 HV; thông báo "Ghi nhận 20/10" trong demo 14/09;
  `do-khung` lỗi thời (5/62 kịch bản không mở được mà vẫn báo xanh; không đo "bảng rộng hơn thẻ") (B-06); ảnh PR chụp trên DB tự thêm dữ liệu.
- **Phương án:** dữ liệu demo theo **ngày demo**, đủ trạng thái của từng khung mockup; cập nhật `do-khung` + thêm phép đo tràn thẻ, chiều cao trang, vùng bấm; đưa công cụ ảnh cặp + đo DOM của đợt rà này vào `scripts/`.
- **Kế hoạch:** GĐ0.

---

## 5. Vấn đề theo khu vực (bảng tra; đủ 6 mục của từng mã ở phụ lục)

Loại: **XN** = [XÁC NHẬN] (ảnh chủ SP số mấy) · **PH** = [PHÁT HIỆN] · **GT** = [GIẢ THUYẾT]. P3 gom một dòng cuối mỗi bảng.

### 5.1 Khung chung + Tổng quan — 23/40 · phụ lục [`a1-khung-tong-quan.md`](2026-10-20-danh-gia-ux/a1-khung-tong-quan.md)

| Mã | Mức | Loại | Vấn đề | Phương án (tóm tắt) |
|---|---|---|---|---|
| A1-01 | P1 | PH | 8 số ở dải "HV cần chú ý" + hàng "Cả Monbay" bấm không mở gì (hai nơi chung khoá panel `?so-lieu=`) | khoá theo vùng; phép kiểm "bấm số dải mở 1 panel" |
| A1-02 | P1 | XN ảnh 1 | "Chờ duyệt 10" theo chi nhánh đã nhớ, thẻ lấy mọi chi nhánh (12, có BC / CP) | truyền chi nhánh của trang vào hộp duyệt; số = thẻ |
| A1-03 | P1 | XN ảnh 1 | công tắc FT / LT chỉ áp nửa trang: 58 ≠ 53 bài, ⚠5 ∉ 19 Case, Chốt lộ trình FOU khi xem FT | một phạm vi cho cả trang ("Tất cả · FT · LT") |
| A1-04 | P1 | PH | 3 loại thông báo tự động thay "Nhắc" (quá hạn chấm, Chốt lộ trình, Case quá hạn) nằm ở "Để biết" | đưa vào nhóm "Cần làm" |
| A1-05 | P1 | PH | thanh trên cắt mục Tutor ở 1 280 px, mất số Công việc ở 1 100 px; 375 thanh dưới 6 nút | gom "Thêm ▾" khi thiếu chỗ; 375 ≤ 5 nút |
| A1-06 | P2 | PH | panel "bài trễ chấm" ghi "Nhập điểm" nhưng QL chỉ xem được (quyền `score.edit` chỉ GV) | chủ SP chọn: cho QL nhập thay (mockup 1d) hoặc đổi nhãn + ghi số ngày trễ |
| A1-07 | P2 | PH | tiêu đề trang ≠ tên menu ("Việc hôm nay", "Mock Test", "Số liệu", "Học viên của tôi"); thứ tự menu lệch mockup | "Tổng quan" cho mọi vai; Công việc đứng đầu |
| A1-08 | P2 | XN ảnh 1 | đầu trang 3 hàng; ô chi nhánh kiểu form, nhãn trên, góc phải xa | một hàng như mockup 3 + dải lọc dính |
| A1-09 | P2 | XN ảnh 1 | thẻ Chờ duyệt cao 95–130 px, "Nếu duyệt …" lặp mọi thẻ, "hạn hết T3" ghi thứ, chip loại có khoảng trống lạ | hàng gọn 4 cột (mockup 3); "Nếu duyệt" ghi ngày |
| A1-10 | P2 | PH | "Mở" ở thẻ duyệt đổi trang; "Mở Case" ngay dưới mở panel | "Mở" mở Case tại chỗ; link "Hồ sơ ↗" riêng |
| A1-11 | P2 | XN ảnh 1 | "Tuần này" = khối "Lịch sắp tới" cũ; chữ mờ "L R W S" vô nghĩa; số trên tab tuần không đơn vị | dải 6 tuần + bảng "Test tuần này" (mockup 3) |
| A1-12 | P2 | XN ảnh 1 | "Case chưa chốt PA" một tên hai số (19 ở dải, 5 ở khối); "Chốt lộ trình" 3 lần một dòng | "Case quá hạn chốt PA · 5"; dòng lộ trình có "đã đề xuất x/y" |
| A1-13 | P2 | PH | số cạnh "Công việc" hai nghĩa theo vai, tô cam cả khi không quá hạn | số xám = tổng, "⚠ n" cam = quá hạn |
| A1-14 | P2 | PH | "Chọn hết n" chọn cả thẻ đang ẩn sau "Xem thêm" → duyệt thẻ chưa đọc | chỉ chọn thẻ đang hiện |
| A1-15 | P2 | PH | mở Case "trống PA" từ Tổng quan → nút chính là "Hoàn thành Case" | nút chính theo việc tiếp ("+ Thêm PA") |
| A1-16…25 | P3 | PH | dòng Case thiếu chip SOS; chuông lặp thẻ duyệt + giờ thật "20/10"; ô tìm hẹp, không tìm GV, chữ gợi ý thiếu "email"; bảng Lớp cần chú ý giãn 1 400 px; Tổng quan TVV / CX / Admin nhiều ô 0, ba kiểu; panel Chốt lộ trình toàn màn; Hồ sơ cá nhân hai kiểu nút lưu + 5 câu giải thích; menu tài khoản nặng; ô ngày demo đổi máy chủ chung; logo không bấm được | phụ lục |
| A1-26 | — | XN (khác nguyên nhân) | ~32 lỗi 403 khi mở Tổng quan | **không phải lỗi web**: tệp phông bị máy thử chặn; 0 lỗi `/api/` |

### 5.2 Công việc + mọi panel làm việc — 21/40 · phụ lục [`a2-cong-viec.md`](2026-10-20-danh-gia-ux/a2-cong-viec.md)

| Mã | Mức | Loại | Vấn đề | Phương án (tóm tắt) |
|---|---|---|---|---|
| CV-01 | P1 | XN ảnh 3 | panel Nhập điểm hiện em NGOÀI việc (việc 2 bài → 3 em; việc 1 em → 3 em); con trỏ tự đứng ở em nhập bù | chỉ em của việc; "Hiện cả lớp" là công tắc thật |
| CV-02 | P1 | PH | "Dán từ Excel" trong panel bị cắt mép trái, lưới biến mất (≥ 1 280 px) | trong panel xếp chồng (khối dán trên, lưới dưới) |
| CV-03 | P1 | PH | mở "Kết quả PA" ghi nhanh → dòng việc mất tên việc + tên em | sửa lưới cột; thêm bối cảnh PA một dòng |
| CV-04 | P1 | XN ảnh 3 | panel Nhập điểm = **khung "Trước" của mockup 2**: tiêu đề theo tuần ≠ tên việc, 2 link ↗ đều rời sang Test | đầu = tên việc + hạn; bỏ 2 link; "Việc i/N · Còn n bài" |
| CV-05 | P1 | PH + GT | hàng đợi tự sang việc khác loại / đang gập / không phải của mình; "Hoàn tác 10 s" bị thay ngay; có thể mất chữ đang gõ | việc kế = cùng nhóm, của tôi, đang hiện; "✓ Xong · Hoàn tác" |
| CV-06 | P1 | PH | QL: việc của chính QL bị tính "Của GV", nằm nhóm gập cuối; "Xong hết hôm nay ✓" dưới "Chờ bạn duyệt 10" | khối "Cần bạn quyết" đầu trang, mở sẵn |
| CV-07 | P1 | PH | "Phân công…" mở cả ngăn "Thông tin lớp" (đổi phân công cả lớp) đè lên panel | hộp nhỏ chọn người phụ trách cho Case |
| CV-08 | P1 | PH | một Case sinh hai dòng việc; GV thấy việc chưa giao; mở ra panel có nút chính "Hoàn thành Case" | gộp một dòng; chỉ QL thấy việc chưa giao |
| CV-09 | P1 | PH | QL / QT vào trang: panel tự mở lưới điểm của GV, trang tự cuộn khỏi "Chờ bạn duyệt" | không tự mở việc người khác; không tự cuộn |
| CV-10 | P2 | XN ảnh 3 | "Lớp tôi dạy" tràn khỏi thẻ 201 px (= B-01) | bỏ lớp `bang-dinh` ở bảng này |
| CV-11 | P2 | XN ảnh 3 | bảng chỉ nửa panel, 4 nút dồn mép phải; "Cả lớp" thực ra = hiện mọi cột | bảng rộng hết; đổi tên + làm đúng nghĩa |
| CV-12 | P2 | XN ảnh 3 | cột "Kết quả: Chờ 4 kỹ năng" vô ích với GV chấm một kỹ năng | trống tới khi có điểm; rồi Đạt / Chưa đạt của kỹ năng đó |
| CV-13 | P2 | PH | tên việc ≠ tên panel ở 6 loại việc | một hàm tên việc cho dòng + panel |
| CV-14 | P2 | PH | hạn Mini Test trên dòng 15/09, trong panel 22/09 | một nguồn hạn |
| CV-15 | P2 | PH | nhóm "Ý thức & Phối hợp" không chứa việc Phối hợp; việc không hạn chìm sau "Xem thêm" | đổi nhãn hoặc chuyển việc |
| CV-16 | P2 | PH | badge "Công việc n" hai nghĩa, khác số trên trang | một nghĩa, cùng phạm vi chi nhánh |
| CV-17 | P2 | PH | thanh lọc QL 8 lựa chọn (mockup đã duyệt: 3) | gộp "Của GV ▾"; chương trình lên khung trang |
| CV-18 | P2 | PH | mockup 2 bị bỏ không lý do: "Mẫu nhận xét", "Việc i/N · Còn n bài", "✓ Xong · Hoàn tác" | làm theo mockup |
| CV-19 | P2 | PH | ngăn phủ chồng panel: + Giao việc, Gia hạn, số "Lớp tôi dạy" | thay khung phải / hộp nhỏ |
| CV-20 | P2 | PH | Chốt lộ trình: Công việc chuyển trang, Tổng quan mở panel | một panel cho cả hai |
| CV-21 | P2 | PH | 375: việc một kỹ năng hiện tab cả 5 kỹ năng (2 hàng) | chỉ tab của việc |
| CV-22…27 | P2 | PH | Ghi nhận vi phạm (lô) không thấy vi phạm gì; Thêm / Xác nhận PA lệch panel v3; Chấm Speaking đếm lớp lệch, ô "Người chấm" thừa; "Điền Target" mở cả Sửa thông tin; panel nhiều lớp phải mở từng hàng; "Mở" thẻ duyệt rời Công việc | phụ lục |
| CV-28…33 | P3 | PH | chip "Bình thường", "Chưa có hạn" lặp, câu dưới nút; khung phải trống "Chọn một việc"; hai lối lùi ở 375; Xem nhận xét S đổi trang; TVV / CX không có Công việc, Admin tiêu đề "Chấm điểm"; Công việc đứng cuối thanh trên của GV | phụ lục |

### 5.3 Học viên & Lớp + Hồ sơ lớp + Hồ sơ HV + Case — 23/40 · phụ lục [`a3-hoc-vien-lop.md`](2026-10-20-danh-gia-ux/a3-hoc-vien-lop.md)

| Mã | Mức | Loại | Vấn đề | Phương án (tóm tắt) |
|---|---|---|---|---|
| A3-01 | P1 | XN ảnh 4, 5 | lưới "Điểm Mock Test của lớp" mở sẵn dưới MỌI tab hồ sơ lớp (+~2 200 px; 33 em hiện hai lần) | bỏ khối; lưới chỉ qua nút Nhập điểm (panel) |
| A3-02 | P1 | PH | Đang SOS chia trang theo lượt → một lớp nằm 3 trang, đầu nhóm sai (2 em ↔ 7), em SOS 3 ở trang 2 | xếp SOS 3 trước; đếm toàn bộ; chia trang theo lớp |
| A3-03 | P1 | XN ảnh 7 | "Cần làm 51" = "Tất cả 51"; góc Cần làm = bản sao Công việc | bỏ góc; chip "⚠ n quá hạn" ở hàng lớp mở panel việc |
| A3-04 | P1 | XN ảnh 6 | "Thiếu n" ở 46/51 em (Tháng thi 43, Điểm đầu vào 44 — trường được phép trống) | một số ở hàng lớp + lọc; chỉ vai điền được thấy; luật trường nào |
| A3-05 | P1 | XN ảnh 6 | hàng lớp: "+1" giấu "⚠ 22 việc quá hạn"; không tóm tắt SOS 1/2/3 · Đã thi · Case như mockup 1 | hàng lớp theo mockup 1, quá hạn luôn hiện |
| A3-06 | P1 | XN ảnh 6 | hàng em 2–5 dòng, một tin lặp 3 lần, "−0.5" (mockup 6 đã bỏ) | 1–2 dòng, bỏ trùng |
| A3-07 | P1 | PH | cột "Việc tiếp theo" 3 hành vi; chip hồ sơ lớp sang 3 trang khác; số trên chip ≠ trang đích | mọi việc mở panel tại chỗ; số = dòng |
| A3-08 | P1 | PH | 3 số SOS khác nhau (Tổng quan 14 · Đang SOS 9 · Báo cáo 2/3/0) | một định nghĩa hoặc hai tên khác hẳn |
| A3-09 | P1 | XN ảnh 8 | Đang SOS 9 cột chữ bị cắt, hai bảng FT / LT khác tiêu đề | bảng 6 cột của mockup 6 khung 1 |
| A3-10…20 | P2 | PH | chip SOS 4 dáng, W1 / W2 tách thành hai môn; hộp "Vì sao SOS" hai nội dung, không việc; 375 điều khiển chiếm nửa màn; không lọc mức SOS / Lớp, Đang SOS không chọn để xuất; Nhập điểm mở MT3 thay lượt quá hạn; Ý thức ~45 dòng phẳng, chip "Quá hạn" nền (XN ảnh 5); đơn vị đếm lẫn; màu nghĩa chồng; Tất cả không có "Mở" panel một em; Sửa cả lớp 4 cột hay thiếu ngoài màn; Lịch thi 12 nút tháng, mặc định tháng rỗng | phụ lục |
| A3-21…32 | P3 | PH | "6/11" không chú thích; Xuất luôn qua panel; ô trống / ✓✗ mỗi bảng một kiểu; chọn nhiều 2 kiểu; lớp gập mặc định; 34 nút ⋯ cùng tên với trình đọc màn; TVV / CX từ khác; Cần hỗ trợ tiêu đề cột tách; chữ việc lặp tên em; GV thấy chip không phải việc mình; Tạo lớp không lấy chi nhánh đang xem; tên Case chuỗi thô "[MT1] … [SOS 3]" | phụ lục |

### 5.4 Test + nhập điểm — 23/40 · phụ lục [`a4-test.md`](2026-10-20-danh-gia-ux/a4-test.md)

| Mã | Mức | Loại | Vấn đề | Phương án (tóm tắt) |
|---|---|---|---|---|
| TST-01 | P1 | XN ảnh 12b | Lịch Test: mọi lớp còn bài tự mở lưới đủ 10 cột, đủ em (QT 2 172 px, 141 nút; mở khối 3 → 5 476 px) | lưới gọn: chỉ em + cột còn nợ (mockup ba khối); một lớp mở một lúc |
| TST-02 | P1 | PH | hai giao diện nhập điểm cả lớp (trang theo tuần ↔ panel theo lượt); cùng lớp ra 5 / 8 / 32 em | một panel theo lượt cho mọi lối; route cũ chuyển hướng |
| TST-03 | P1 | XN ảnh 12b | 3 ô số trùng đầu khối; "117/177" gộp hai tuần; "13" không đơn vị (= ô điểm); tuần sau báo "Còn phải chấm 44" | bỏ dải (chủ SP quyết); số + đơn vị ở đầu khối |
| TST-04 | P1 | PH | 3 lối xuất; 2 panel cùng xuất điểm khác bộ lọc / tên tệp; "Xuất Excel" hai nghĩa | một "Xuất điểm Test"; nút kia "Xuất lịch Test" |
| TST-05 | P1 | PH | ⓘ chú giải Kế hoạch Test nói sai màu ("Xám = đã thi xong"; thật: xanh lá) | sinh chú giải từ bảng màu thật |
| TST-06 | P1 | XN ảnh 12a | chip Kế hoạch dày ký hiệu ("L R W S" ~99, "/2026" 108 lần); lệch mockup 4 (ô 2 dòng, email dưới tên, GVCN đầu lớp, 375 thẻ) | ô theo mockup 4 |
| TST-07…18 | P2 | XN / PH | "vào muộn" 20/33 em (XN 12a); "Nhận xét" + "Điền cả cột" lặp (XN 12b); Progress lớp thường thiếu nhãn SOS trái Rulebook §20.17; "Tạo bài kiểm tra theo chương trình" ở lưới chấm, trùng nút khác (XN 12b); Quay lại từ ↗ mất trạng thái; người chấm S mặc định khác nhau, QT / QL thành người chấm; Dán Excel W/S phải 4 tiêu chí một ô; "Không xếp được" không lý do; Chấm Speaking không hạn; hộp → menu → panel chồng; khối quá hạn 8 nút chính giống nhau; 375 hàng lọc + 3 ô chiếm nửa màn | phụ lục |
| TST-19…27 | P3 | PH | hai "Tất cả" khác nghĩa; hồ sơ Mock 3 lối nhập; phần mockup 2 bị bỏ; 3 dạng mã tuần + chữ cắt; "bài" hai nghĩa; 3 dáng hộp; Xếp lịch lớp thường khác dáng FT; số lệch nhỏ; tên không xếp theo ABC tiếng Việt | phụ lục |
| TST-28 | — | XN ảnh 12a → bác | "6 em hiện hai lần" ở MB FT 101 | **không phải lỗi web** (DOM 33 hàng / 33 tên; DB 33 ghi danh) — do công cụ ghép ảnh toàn trang chồng mép |

### 5.5 Phân tích + Báo cáo + Tutor + Quản trị — 21/40 · phụ lục [`a5-phan-tich-tutor-quan-tri.md`](2026-10-20-danh-gia-ux/a5-phan-tich-tutor-quan-tri.md)

| Mã | Mức | Loại | Vấn đề | Phương án (tóm tắt) |
|---|---|---|---|---|
| A5-01 | **P0** | PH | "Theo tháng" ra tháng trước, cả nhãn lẫn số (6 tab Phân tích + Tutor) | ghi tháng thẳng lên URL; phép kiểm 12 tháng |
| A5-02 | P1 | PH | "PA có kết quả trong kỳ" không theo kỳ | dùng chung hàm theo khoảng với Hiệu quả PA |
| A5-03 | P1 | XN ảnh 9 | cùng bộ lọc, Báo cáo / Test + SOS / Kết quả thi / Tổng quan ra 4 bộ số SOS · Đạt · lượt | bảng định nghĩa; nhãn đơn vị + thời điểm |
| A5-04 | P1 | XN ảnh 1, 9 | bài quá hạn 28 / 53 / 58; Case quá hạn ⚠4 / ⚠5 — phạm vi khác, nhãn không nói | một tên + phạm vi ngay sau số |
| A5-06 | P1 | XN ảnh 2 | Tutor mở ra rỗng; chip đếm chồng nhau (0 + 0 + 1 + 1 ≠ 8) | mặc định "Tất cả" khi không ai đang dạy; dữ liệu demo theo ngày demo |
| A5-07 | P1 | PH | panel số của Báo cáo chỉ là danh sách tên (trái C26); panel từ dòng GV mất tên GV | panel "kết quả cụ thể" |
| A5-08 | P1 | PH (mã) | "Thôi học" ở Kết quả thi › Thi thật lưu ngay, không Hoàn tác | Hoàn tác trong thông báo |
| A5-05, 09…12 | P2 | XN ảnh 9–11 | "3 GV" mà bảng 4 dòng; ô Chi nhánh tách khỏi hàng lọc; Kết quả thi mất công tắc, không nói "Fast Track"; Phân tích GV chữ hướng dẫn dài, 60 % ô không có số, lệch khung 4c; "— / không có / chưa có / mẫu nhỏ / 0" | phụ lục |
| A5-13…25 | P2 | PH | hộp thời gian che "Tùy chọn"; Phân tích GV chỉ nhận 13 tuần; Quay lại không mở lại panel; panel Mock cuộn ngang; link Lịch Test không lọc GV; In bỏ dòng ngoài trang 1; số nào bấm được không rõ; 375 bảng 17 cột cuộn ngang; Hiệu quả PA mặc định gần trống; Báo cáo lớp thường không có khối kết quả; Quản trị: Tạo một panel, Sửa hai đường; Quyền & nhật ký 5 248 px; demo thiếu dữ liệu | phụ lục |
| A5-26…37 | P3 | PH / GT | hộp Thêm chồng hộp Gộp (Tutor); Tutor 375 chữ vụn; TVV / CX thấy tên GV; "So kỳ trước" hai kiểu; Quản trị vụn; chuyển hướng im lặng; Tải danh sách chữ dài; tab không phím mũi tên; nút chính Tutor "Tải danh sách"; "Báo cáo" trùng tên; Báo cáo kỳ cũ in số "hiện tại"; "2 chưa lịch Test" ↔ 3 không tái hiện | phụ lục |

### 5.6 Số liệu + thuật ngữ — 8/16 (≈ 20/40) · phụ lục [`a7-so-lieu-thuat-ngu.md`](2026-10-20-danh-gia-ux/a7-so-lieu-thuat-ngu.md)
- **Bản đồ 23 con số** xuất hiện ở ≥ 2 nơi (cùng vai QT · Monbay · FT): **≥ 12 cặp cùng nhãn khác số**; chỉ 5 cặp khớp (Case chưa chốt PA 19, HV chưa điểm 12, quá hạn chấm của GV 11, Cần xếp lại 5, HV FT 51). Bảng đủ ở phụ lục §2.1.
- **P1:** A7-01 Chờ duyệt 10 / 12 · A7-02 PA trong kỳ · A7-03 dải trộn khung · A7-04 bốn số SOS · A7-05 chuông "Để biết" + thẻ đã xử lý vẫn đếm.
- **P2:** A7-07 hai số "việc quá hạn" cùng nguồn (33 ↔ 40) · A7-08 Cần làm = Tất cả · A7-09 đầu nhóm đếm theo trang · A7-10 "2 bài" = 3 em, "78 bài chờ chấm" gồm bài chưa tới hạn · A7-11 "Đạt" hai nghĩa · A7-12 nơi báo "chưa lịch Test" và nơi xếp lịch đếm khác luật · A7-13 badge hai nghĩa · A7-14 Tổng quan không làm mới sau "Duyệt nhiều" · A7-15 chuông trễ ≤ 5 phút · A7-16 Tutor chip · A7-17…22 tên.
- **Thuật ngữ** (bảng chốt đề xuất ở phụ lục §2.2): 15 khái niệm đang có 2–9 tên. **Lỗi nền:** sau khi sửa máy thử — 0 lỗi console, 0 request ≥ 400 trên 53 lần mở trang × 9 vai.

### 5.7 Máy dò + đo trình duyệt — phụ lục [`b-may-do.md`](2026-10-20-danh-gia-ux/b-may-do.md)
B-01 P1 "Lớp tôi dạy" tràn thẻ · B-02 P1 số bấm 8×12 px · B-03 P2 trang quá dài · B-04 P2 93–95 phần tử bấm được ở khung nhìn đầu, phân trang vẽ hai lần · B-05 P2 focus bị thanh dưới che (375) ·
B-06 P2 `do-khung` lỗi thời · B-07 P3 chữ < 12 px dày · B-08 P3 "—" / "/" 1,9–2,5:1 · B-09 P3 menu Tài khoản 375 cao hơn màn · B-10 P3 ⋯ ô điểm lớp thường ẩn tới khi rê chuột. Xem mục 2.4.

---

## 6. Phân loại theo yêu cầu của chủ SP

### 6.1 Vấn đề đã xác nhận từ 12 ảnh chủ SP

| Ảnh | Màn (vai QT trừ khi ghi) | Điều thấy trong ảnh | Kết luận sau khi kiểm |
|---|---|---|---|
| 1 | Tổng quan · Monbay · FT | "Chờ duyệt 10 ⚠1" mà 12 thẻ, có thẻ BC / CP; 2 thẻ "Quá hạn" | **Đúng — lỗi bộ lọc** (A1-02, A7-01) |
| 1 | | "58 bài trễ chấm · 4 GV" ↔ khối "53 bài · 3 GV" | **Đúng** — dải gộp FT + LT, khối chỉ FT; "3 GV" bỏ dòng chấm chéo S (A1-03, A7-03, A7-18) |
| 1 | | "19 Case chưa chốt PA ⚠5" ↔ danh sách 5 | **Đúng** — một tên cho hai nhóm; 2/5 là Case lớp thường (A1-12, A7-17) |
| 1 | | tiêu đề "Việc hôm nay", ô chi nhánh xa, bảng giãn, thẻ cao, chữ mờ "L R W S" | **Đúng** (A1-07, 08, 09, 11, 19); thêm: 8 số dải **bấm không mở gì** (A1-01) |
| 2 | Tutor | trang rỗng; chip 0 + 0 + 1 + 1 ≠ 8; nút chính "Tải danh sách" | **Đúng** — mặc định "Đang dạy" = 0 + dữ liệu demo sai ngày (A5-06); nút chính đúng mockup đã duyệt → chủ SP quyết (A5-34) |
| 3 | Công việc · GV Linh | việc "2 bài" mà panel 3 em; bảng nửa panel; tiêu đề ≠ tên việc; 2 link ↗; "Chờ 4 kỹ năng"; "Lớp tôi dạy" tràn | **Đúng tất cả** (CV-01, 04, 11, 12, 10 / B-01); panel = khung "Trước" của mockup 2; em thứ 3 là MT lịch sử nhập bù, con trỏ đứng sẵn ở em đó |
| 3 | | "Công việc 5" (GV) ↔ "Công việc 12" (QT); "10 việc đến hết W3 SEP" ↔ 11 dòng | badge hai nghĩa theo vai (A7-13); "10 việc" đúng nhãn, danh sách có thêm 1 việc tuần sau (P3) |
| 4 | Hồ sơ lớp MB FT 101 › Tổng hợp | trang cực dài; lưới MT ngay dưới bảng; "Thiếu n" gần mọi em | **Đúng** — lưới dưới **mọi** tab, 4 800 px (375: 10 640 px) (A3-01); "Thiếu" 46/51 em (A3-04) |
| 5 | Hồ sơ lớp › Ý thức | ~45 vi phạm phẳng; lưới MT vẫn ở dưới | **Đúng** (A3-15, A3-01) |
| 6 | HV & Lớp › Tất cả | hàng rất dày, "Thiếu n" mọi em, chip "+1" | **Đúng** (A3-06, A3-04); "+1" giấu "⚠ 22 việc quá hạn" (A3-05) |
| 7 | HV & Lớp › Cần làm | bản sao danh sách Công việc; "Cần làm 51" | **Đúng** — "Cần làm 51" = "Tất cả 51" vì tính cả Thiếu thông tin (A3-03, A7-08); đầu nhóm đếm theo trang (A7-09) |
| 8 | HV & Lớp › Đang SOS | hai bảng, chữ cắt "…" | **Đúng** (A3-09); thêm: chia trang cắt lớp, em SOS 3 rơi xuống trang 2 (A3-02) |
| 9 | Phân tích › Báo cáo | SOS 2/3/0 ↔ Tổng quan 6/5/3; "28 bài · 3 GV" mà 4 dòng; ⚠4 ↔ ⚠5 | **Đúng** — khác định nghĩa mà nhãn không nói (A5-03, 04, 05); thêm: "10 PA có kết quả trong kỳ" không theo kỳ (A5-02) |
| 9 | | "2 chưa lịch Test" ↔ Tổng quan 3 | **Không tái hiện** — lúc rà cả hai là 3, cùng một hàm; [GIẢ THUYẾT] hai ảnh chụp lúc dữ liệu demo khác (A7-12, A5-37) |
| 10 | Phân tích › Kết quả thi | không công tắc FT / LT; "chưa có" ↔ "—"; chữ cắt | **Đúng** (A5-10, A5-12) |
| 11 | Phân tích › Phân tích GV | câu hướng dẫn + chú giải dài; "không có" / "—" / "mẫu nhỏ" | **Đúng** (A5-11, A5-12); lệch khung 4c đã duyệt |
| 12a | Test › Kế hoạch Test | chip nhiều màu, "/2026" mọi ô, "vào muộn"; 6 em hiện hai lần | chip + chữ: **đúng** (TST-06, 07); thêm: ⓘ nói sai màu (TST-05). **Hàng lặp: KHÔNG phải lỗi web** — do công cụ ghép ảnh toàn trang (TST-28) |
| 12b | Test › Lịch Test / Chấm Test | 3 ô số trùng khối; "13"; trang dài; "Nhận xét", "Điền cả cột" lặp; "Tạo bài kiểm tra theo chương trình" | **Đúng** (TST-01, 03, 08, 10); "13" = số ô điểm còn trống, không đơn vị; nút "Tạo bài…" tạo bài cho em chưa có bài — trùng "Xếp cả lớp theo đề xuất" ở Kế hoạch Test |
| (PTA nghi) | mọi trang | ~32 lỗi 403 trong console | **Không phải lỗi web** — lỗi máy thử (tệp phông bị chặn), 0 lỗi `/api/` (A1-26, A7-06) |

### 6.2 Vấn đề tự phát hiện thêm (không có trong ảnh) — nặng nhất trước
- **P0** A5-01 "Theo tháng" ra tháng trước.
- **P1 số liệu:** A7-02 / A5-02 PA trong kỳ không theo kỳ · A1-01 8 số dải bấm không mở gì · A3-02 Đang SOS chia trang sai, SOS 3 ở trang 2 · A3-08 / A7-04 bốn định nghĩa SOS · A1-04 / A7-05 chuông xếp việc quá hạn vào "Để biết", thẻ đã xử lý vẫn đếm · B-02 số bấm được 8×12 px.
- **P1 thao tác:** CV-02 Dán Excel trong panel bị cắt · CV-03 Kết quả PA mất tên em · CV-05 hàng đợi nhảy sai việc, mất Hoàn tác · CV-06 việc của QL gập cuối, "Xong hết" sai · CV-07 "Phân công…" mở phân công cả lớp · CV-08 Case hai dòng, GV thấy việc chưa giao, nút chính "Hoàn thành Case" ·
  CV-09 QL vào Công việc bị tự mở lưới của GV · A5-07 panel Báo cáo chỉ là danh sách tên · A5-08 "Thôi học" lưu ngay không Hoàn tác · TST-02 hai giao diện nhập điểm cả lớp · TST-04 ba lối xuất · TST-05 ⓘ sai màu · A3-07 cùng cột "Việc tiếp theo" ba hành vi · A1-05 thanh trên cắt ở 1 280 px.
- **P2 đáng chú ý:** A1-14 "Chọn hết" chọn cả thẻ ẩn · A1-15 nút chính sai việc khi mở Case · CV-14 một việc hai hạn · TST-09 Progress lớp thường thiếu nhãn SOS (trái Rulebook §20.17) · TST-12 người chấm S mặc định khác nhau · TST-16 panel chồng hộp lịch ·
  A3-14 Nhập điểm mở lượt chưa tới thay lượt quá hạn · A3-18 Tất cả không có "Mở" panel một em · A5-13 hộp thời gian che "Tùy chọn" · A5-18 In bỏ dòng ngoài trang 1 · A7-14 Tổng quan không làm mới sau Duyệt nhiều · B-05 focus bị thanh dưới che · B-06 công cụ đo khung lỗi thời.

### 6.3 Nhận định / giả thuyết cần kiểm thêm
| # | Giả thuyết | Cách kiểm | Ai kiểm |
|---|---|---|---|
| G1 | Hàng đợi tự sang việc kế khi danh sách tải lại có thể **làm mất chữ đang gõ** ở ô khác (CV-05) | bản demo riêng: lưu ô cuối của việc "2 bài", gõ ngay vào ô em khác, chờ danh sách tải lại | PTA (demo riêng) |
| G2 | "‹ việc vừa xong" mở lại form Thêm PA trống → dễ thêm PA lần hai (CV-05) | như trên, sau khi Thêm PA | PTA |
| G3 | Sau Esc ở Công việc, focus không về dòng việc (CV, persona Sam) | thử bàn phím | PTA |
| G4 | Tổng quan không làm mới số sau "Duyệt nhiều / Từ chối nhiều" (A7-14, đọc mã) | bản demo riêng: duyệt 2 thẻ cùng lúc | PTA |
| G5 | Chuông trễ ≤ 5 phút, nhớ theo tiến trình — trên Netlify nhiều tiến trình có thể lệch hơn (A7-15) | đo trên bản nháp Netlify | PTA + chủ SP |
| G6 | Session cloud đọc mockup dạng mã HTML, không chụp ra hình để nhìn (N13) | mở transcript session #463, #471 | PTA |
| G7 | "2 chưa lịch Test" ↔ 3: hai ảnh chụp lúc dữ liệu khác | chụp Báo cáo và Tổng quan liền nhau (mục 6.5) | chủ SP (nếu còn thấy) |
| G8 | Tốc độ trên Turso bản chính các màn đã đổi (đợt này chỉ đo bản dev) | log `[cham]` sau deploy | PTA |

### 6.4 Đề xuất cải thiện do PTA chủ động đưa ra
Ở **mục 7** (đề xuất lớn theo từng màn, có số bước trước / sau) và cột "Phương án" của từng mã (mục 5 + phụ lục). Đề xuất quy trình ở **mục 3.3**. Tất cả là [ĐỀ XUẤT], chưa duyệt.

### 6.5 Cần thêm ảnh / thông tin từ chủ SP
**(a) Chỉ chủ SP làm được** (máy thật, dữ liệu thật, thiết bị thật):
1. **Laptop của chủ SP**, cỡ cửa sổ hay dùng (1 280–1 366 px, zoom 125 %): chụp thanh trên ở Tổng quan — còn thấy mục "Tutor" và số cạnh "Công việc" không (A1-05).
2. **Bản chính, vai QL chi nhánh đông nhất:** Học viên & Lớp › Tất cả → mở lớp FT đông nhất → chụp toàn trang; bấm "Thiếu n" của 3 em → chụp hộp hiện ra (đo tỉ lệ "Thiếu" trên dữ liệu thật — A3-04).
3. **Bản chính, cùng chi nhánh, cùng Fast Track, chụp liền nhau:** Tổng quan (bảng Lớp cần chú ý, cột SOS) → Học viên & Lớp › Đang SOS trang 1 → trang 2 (A3-02, A3-08).
4. **Điện thoại của một GV:** mở hồ sơ một lớp → cuộn tới cuối, đếm số lần vuốt; Test › Kế hoạch Test (nếu GV có quyền) / Lịch Test (TST-18, B-03).
5. **GV nước ngoài (Speaking) trên bản chính:** Công việc › "Chấm Speaking" — có em quá hạn không; chấm một em rồi chụp ô "Người chấm" (TST-12, TST-15).
6. Nếu có **tài khoản kiêm hai vai** (QL kiêm GV): menu tài khoản › Góc nhìn + chuông khi đang ở vai GV.
7. Không bắt buộc: chụp lại ảnh 12a **từng màn, không ghép** để chắc chắn không có hàng trùng (đã kết luận do ghép ảnh — TST-28).

**(b) PTA tự làm được trên bản demo riêng (không cần chủ SP):** trạng thái sau khi lưu (G1–G4), "Lưu phân công", Hoàn tác, Thi thật + Bước tiếp + "Thôi học", Tutor "Cần chú ý" sau khi sửa dữ liệu demo, In Báo cáo > 10 dòng.

---

## 7. Đề xuất lớn — web sau khi sửa (chưa duyệt)

### 7.0 Năm nguyên tắc chung (áp mọi màn)
1. **Một sổ số liệu** (X1): bộ lọc trang = bộ lọc mọi số; một khái niệm = một chỉ số = một tên; số kèm đơn vị + phạm vi; chuông = Công việc.
2. **Một khung trang** (X6): hàng đầu một dòng (tiêu đề = tên menu · chi nhánh · chương trình · thời gian · dữ liệu đến · nút chính), dính khi cuộn, chip đang lọc có ✕.
3. **Hợp đồng panel** (X3): làm tại chỗ; một việc một panel / hộp; không chồng; chỉ chuyển trang để xem hồ sơ (link "↗" tách khỏi nút làm việc).
4. **Ngân sách độ dài + nhãn có nghĩa** (X5): trang làm việc mặc định ≤ ~2 màn 1440, ≤ ~4 màn 375; nhãn chỉ khi khác thường.
5. **Một mẫu mỗi thành phần, một tên mỗi khái niệm** (X7, X8), có phép kiểm chống trôi.

### 7.1 Thanh trên + khung trang
> **Thứ tự menu ở mục này đã HẾT HIỆU LỰC** — chủ SP chốt 20/10: Tổng quan → Lớp/HV → Test → Công việc → Phân tích → Tutor (mục 10.0 I.2, 10.1).
- **Hiện trạng:** menu 6 mục (Công việc thứ 5), "Thông báo 30" chữ, cắt ở 1 280 px; mỗi trang một kiểu đầu trang / bộ lọc.
- **Đề xuất:** theo mockup 1 khung 2a / 2b + mockup 3: Công việc đầu (mọi vai có khu này); chuông + số; ô tìm "lớp, học viên hoặc email" (+ GV với QL / QT); "Thêm ▾" khi thiếu chỗ; 375 ≤ 5 nút. Một thành phần **khung trang** cho mọi trang.
- **Bước:** đổi chi nhánh + chương trình ở mọi trang cùng một chỗ, 1 bấm; QT nhìn ngay đang ở chi nhánh nào.

### 7.2 Tổng quan QL / QT — "bàn giao ban một màn, một phạm vi" (A1 Phần 3, mockup 3 + ý tốt của #471)
> **THAY BỞI mục 10.2** (góp ý chủ SP vòng 1: bỏ Trễ chấm, thiết kế lại cả trang, khuyến nghị bố cục B). Giữ đoạn dưới để tra số bước gốc.
- **Đề xuất:** một phạm vi `{chi nhánh, chương trình}` cho mọi khối; dải "HV cần chú ý" là nút viền mở panel; "Cần bạn quyết" dạng **hàng gọn** (chip loại · việc + người gửi · "Nếu duyệt" có ngày · hạn · nút), mỗi nhóm ≤ 5 dòng quá hạn trước + "Xem tất cả n ›" mở tại chỗ;
  mọi "Mở" mở panel tại chỗ; "Tuần này" = dải 6 tuần (Test · HV · Chấm x/y · ⚠) + bảng "Test tuần này" + Trễ chấm cùng hàm với dải.

| Việc (QL Monbay, sáng) | Nay | Sau |
|---|---|---|
| Biết hôm nay phải quyết gì | cuộn ~2,5 màn (375: 5,3 màn), thấy 3 thẻ đầu | ≤ 1 màn, nhóm có số + 5 dòng đầu |
| Xem danh sách "12 chưa điểm" | bấm dải (không mở) → cuộn → bấm số từng lớp | 1 bấm |
| Duyệt 10 thẻ cần xem PA | ≈ 31 bấm, 20 lần đổi trang | ≈ 21 bấm, 0 đổi trang |
| Biết đúng số trễ chấm | đọc 58 và 53, tự suy | một số, tổng dòng = dải |
| QT: toàn hệ thống → Monbay | 2 bấm + danh sách có thể sai khi quay lại | 1 bấm (bấm hàng chi nhánh), luôn đúng |

### 7.3 Công việc — "một việc = một panel đúng việc; hàng đợi theo loại; QL thấy việc của mình trước" (CV Phần 3, mockup 2 "Sau" + mockup 3)
- **Đề xuất:** đầu panel = tên việc của dòng + hạn (một hàm tên, một hạn); thân chỉ đối tượng của việc ("Việc i/N · Còn n bài", "Hiện cả lớp" là công tắc thật); bỏ 2 link ↗; việc cần không gian lớn mở panel rộng **thay** khung phải;
  hàng đợi sang việc **cùng nhóm, của chính mình, đang hiện**, dải "✓ Xong · Hoàn tác 10 s"; "Mẫu nhận xét" (3 câu gần nhất + "Như em trước"); QL / QT: khối **"Cần bạn quyết"** đầu trang (Chờ duyệt + Chưa có người — hộp Phân công nhỏ + Việc quản lý quá hạn / ≤ 7 ngày), việc của GV gập theo GV, không tự mở lưới của GV.

| Việc | Nay | Sau |
|---|---|---|
| GV nhập điểm 3 lớp cuối buổi (20 bài W2, mỗi bài nhận xét) | ≈ 8–10 bấm (sửa con trỏ sai em, mở hàng gập, kéo về việc định làm sau mỗi lần tự chuyển); Dán Excel hỏng ở máy tính; 20 nhận xét gõ tay | **3 bấm**, 0 chuyển trang; Dán Excel trong panel; "Mẫu" → 1 bấm mỗi nhận xét |
| GV ghi kết quả PA | 3 bấm nhưng dòng mất tên em | 3 bấm, giữ tên em + bối cảnh PA |
| QL duyệt đề xuất PA cần xem bối cảnh | 1 + 2 (đổi trang, quay lại) | 2, 0 đổi trang |
| QL phân công việc chưa có người | 4–5 bấm trong ngăn phân công cả lớp, dễ đổi nhầm | **3 bấm** trong hộp nhỏ |
| QL / QT chọn bước tiếp sau thi | 5 bấm (mở nhóm gập cuối trang) | 3 bấm (khối đầu trang) |

### 7.4 Học viên & Lớp — 3 góc, hàng lớp tóm tắt, hàng em một dòng (A3 Đ1, Đ2; mockup 1 khung 3, mockup 5, mockup 6 khung 1)
- **Đề xuất:** bỏ góc **Cần làm** (đã có Công việc); hàng lớp theo mockup 1: số em · SOS 1/2/3 · Đã thi n · Case · ⚠ quá hạn · chờ duyệt (không "+n"), bấm số → panel; hàng em: tên (+ chip SOS kèm kỹ năng) · OVR L R W S (✓/✗) · Target · Sắp tới · Việc tiếp (1 việc + "+n") · Mở · ⋯;
  "Thiếu" thành một số ở hàng lớp + lọc; **Đang SOS** = bảng 6 cột mockup 6, lọc SOS 3 · 2 · 1 + Trống PA · Chờ nhận xét · PA chờ xác nhận, mặc định SOS 3 trước, ô tích + Xuất.

| Việc | Nay | Sau |
|---|---|---|
| Biết lớp nào có SOS 3 / quá hạn | sang Đang SOS + lật 3 trang, hoặc mở 6 lớp | 0 bấm (đọc hàng lớp) |
| QL tìm em SOS chưa có PA rồi xử lý | 6–9 bấm, dò 3 trang | ≈ 5 bấm, 0 dò |
| Xuất danh sách em SOS 3 | không làm được trong app | 2–3 bấm |

### 7.5 Hồ sơ lớp — mỗi tab chỉ nội dung tab (A3 Đ3; mockup 1 khung 4, mockup 6 khung 2)
- **Đề xuất:** ~~bỏ khối "Điểm Mock Test của lớp" cuối trang~~ (**hết hiệu lực** — chủ SP chốt vòng 2: lưới **gập** mặc định, nút Nhập điểm **cuộn tới + mở lưới tại chỗ**, không panel — mục 11.3); nút Nhập điểm mở lượt có ô quá hạn sớm nhất + "Chỉ ô còn trống"; chip "n chờ duyệt" → hộp duyệt lọc lớp tại chỗ, "bài chờ chấm" → panel Nhập điểm, "⚠ quá hạn" luôn hiện → panel việc của lớp; Ý thức mặc định chỉ vi phạm chưa xong, gom theo em.
- **Chiều cao ước (1440):** Tổng hợp 4 800 → ~2 600 px · Phân tích 3 012 → ~800 · Ý thức 5 431 → ~1 800 · 375: 10 382 → ~6 800 (thêm thẻ em gọn ở GĐ3 để xuống ~4 màn).
- **Bước — GVCN nhập điểm còn thiếu:** 4 bấm + 1 đổi trang + phải nhớ MT nào quá hạn → 2 bấm, không phải nhớ.

### 7.6 Test — Lịch Test là hàng đợi chấm gọn; Kế hoạch Test đúng mockup 4; một "Nhập điểm lớp", một "Xuất điểm" (TST Đ1–Đ3)
- **Lịch Test:** bỏ dải 3 ô (số + đơn vị ở đầu khối); khối quá hạn gom theo lớp; lưới mở ra chỉ em còn ô trống + cột còn nợ + Kết quả, nút "Cả lớp"; một lớp mở một lúc; khối "tuần này" không tự mở; ↗ mở panel. Ước 2 172 → ~1 000 px, 141 → ~40 nút.
- **Kế hoạch Test:** ô theo mockup 4 (tuần + một chữ trạng thái; kỹ năng chỉ khi tách tuần), email dưới tên, đầu lớp có GVCN · khai giảng; chú giải sinh từ bảng màu thật; dời lịch em vắng ngay trên dòng của hộp (bỏ panel chồng); lý do "Không xếp được" trên hàng; 375 dạng thẻ.
- **Một panel "Nhập điểm lớp"** theo lượt cho mọi lối (route `/nhap-diem` chuyển hướng); **một panel "Xuất điểm Test"** ở cả hai tab; nút lịch ghi "Xuất lịch Test"; một luật người chấm S mặc định.

| Việc | Nay | Sau |
|---|---|---|
| QL tìm ô còn trống tuần này | cuộn ~2,4 màn, 141 nút | 1 màn, ~40 nút |
| QL dời lịch một em vắng | 6–7 thao tác, 3 lớp chồng | 4–5, một lớp |
| QL xuất điểm Test một lớp | 2 panel khác nhau, 4–8 thao tác | 1 panel, 4 thao tác |

### 7.7 Phân tích — một nguồn số, khung gọn, panel "kết quả cụ thể" (A5 3.1–3.3; mockup 3 khung 3, 4, 4c; mockup 6 khung 6)
- **Đề xuất:** sửa 2 lỗi dữ liệu; bảng định nghĩa (SOS hiện tại ↔ trong kỳ; HV ↔ lượt; Đạt = OVR ≥ kỳ vọng; Chưa đủ điểm; SOS tạm) và nhãn đơn vị + thời điểm ở mọi ô; một hàng lọc dính dưới tab (Chi nhánh · Chương trình — Kết quả thi ghi cố định "Fast Track" · Thời gian · Lớp);
  tiêu đề Báo cáo một dòng như mockup 3 + nút **"Chiếu"** (sáng, chữ lớn); một mẫu panel bảng nhỏ cho mọi số (điểm · đợt · kết quả · việc tiếp + nút làm theo quyền), panel nằm trên URL; Phân tích GV theo khung 4c + "⚠ n bài quá hạn" mở panel "Chấm trễ · GV" dùng chung với Báo cáo.

| Việc | Nay | Sau |
|---|---|---|
| Giải thích một số trong giao ban | 1 bấm + 1 đổi trang mỗi em | 1 bấm, 0 đổi trang |
| QT so sánh chi nhánh | đổi ô chi nhánh 5 lần, nhớ số | bảng "Theo chi nhánh" khi chọn Tất cả: 1 bấm |
| QL tìm GV chấm trễ → bài trễ | 4–5+ bấm, 2 đổi trang, phải nhớ lớp / đợt | 3 bấm, 1 đổi trang |
| Báo cáo tháng | **sai tháng** | đúng tháng (phép kiểm 12 tháng) |

### 7.8 Tutor + Quản trị (A5 3.4–3.5)
- **Tutor:** mặc định "Tất cả" khi không ai "Cần chú ý" / "Đang dạy"; "Cần chú ý" là công tắc riêng (chip trạng thái không chồng nhau); sau "Lưu nhận xét" tự mở tutor cần chú ý kế; nút chính "Thêm tutor" (chủ SP quyết). Head tutor: 5–9 bấm → 3 bấm cho tutor đầu.
- **Quản trị:** một panel tài khoản (Tạo = Sửa) có khối "Quyền riêng" gập; "Quyền & nhật ký" tách 3 tab con, nhật ký có lọc + phân trang: 10–14 bấm, 2 panel → 6–10 bấm, 1 panel.

### 7.9 TVV / CX / Admin văn phòng
Tổng quan TVV / CX / Admin đang ba kiểu khác QL, nhiều ô 0; TVV / CX không có Công việc, chọn bước tiếp phải sang Học viên & Lớp. Đề xuất: thêm khối "Cần làm" tại Tổng quan của TVV / CX mở panel tại chỗ (4 bấm + 1 đổi trang → 3 bấm) — chờ chủ SP quyết (mục 9.2).

---

## 8. Kế hoạch thực hiện (ĐỂ XEM XÉT — chưa giao việc nào)

**Thứ tự lý do:** sửa cách làm trước (để không lặp lại), rồi sửa số sai (rủi ro thật cho người dùng), rồi mới làm lại bố cục theo mockup (một màn một lần, có chủ SP duyệt), cuối cùng thống nhất chi tiết và chấm lại.

### GĐ0 — Quy trình + dữ liệu + công cụ (trước mọi PR giao diện)
| PR | Nội dung | Điều kiện |
|---|---|---|
| **QT-UX** (tài liệu) | ghi Q1–Q13 (mục 3.3) vào CLAUDE.md / plan.md / mẫu rà 10B; mẫu "bảng truy vết khung → thành phần → ảnh" có dòng BỎ / GIỮ; luật "khung đã duyệt thắng kế hoạch + luật cũ" | chủ SP trả lời 9.1-1, 9.1-2 |
| **SEED-UX** | dữ liệu demo theo **ngày demo**, đủ trạng thái của mọi khung: tutor có buổi trong 2 tuần trước ngày demo; thi thật có kết quả; em "Đã thi · chờ KQ" ở Monbay; Lịch thi tháng tới có em; thông báo theo ngày demo | — |
| **CONG-CU** | `scripts/`: chụp ảnh cặp mockup \| web toàn trang; cập nhật `do-khung` (5 kịch bản hỏng + đo "bảng rộng hơn thẻ", chiều cao trang, vùng bấm); đo DOM của đợt rà này | — |

### GĐ1 — Sửa số sai + lỗi chức năng (không đổi bố cục, không cần mockup mới) — **khuyến nghị làm TRƯỚC khi deploy**
| PR | Gồm | Kiểm nghiệm thu |
|---|---|---|
| **SL1 — số liệu đúng** | A5-01 Theo tháng (P0) · A7-02 PA trong kỳ · A7-01 Chờ duyệt theo chi nhánh của trang · A1-01 khoá panel số · A7-05 chuông "Cần làm" + thẻ đã xử lý rời số đếm · A7-14 làm mới sau Duyệt nhiều · A3-02 / A7-09 đếm toàn bộ trước khi chia trang, SOS 3 lên đầu · CV-01 / A7-10 panel chỉ em của việc, con trỏ đúng em | phép kiểm: 12 tháng 2026; "số trên trang = số dòng panel"; "cùng chỉ số hai tab = cùng tập" |
| **SL2 — một phạm vi một trang** | công tắc chương trình áp cả trang Tổng quan (bỏ "gộp hai khung"); định nghĩa SOS + tên; đơn vị + phạm vi cạnh số; "Đạt" / "Chưa đủ điểm" một nghĩa; badge một nghĩa | chủ SP trả lời 9.1-4 trước; bảng số ở phụ lục a7 §2.1 hết cặp lệch không nhãn |
| **CV-LOI — Công việc chạy đúng** | CV-02 Dán Excel trong panel · CV-03 Kết quả PA mất tên · CV-10 / B-01 Lớp tôi dạy tràn · CV-09 QL không tự mở / tự cuộn · CV-07 Phân công hộp nhỏ · CV-08 gộp Case hai dòng, GV không thấy việc chưa giao, A1-15 nút chính theo việc · CV-14 một hạn · CV-05 hàng đợi cùng nhóm + giữ Hoàn tác (+ kiểm G1, G2) · A1-14 "Chọn hết" chỉ thẻ hiện · A5-08 Hoàn tác "Thôi học" | bấm thử trên bản demo riêng các trạng thái sau lưu |
| **KHUNG-LOI — khung không vỡ** | A1-05 thanh trên "Thêm ▾" + 375 ≤ 5 · B-02 vùng bấm số · B-05 focus không bị che · B-09 menu tài khoản 375 · B-08 tương phản "—" "/" · TST-05 chú giải sinh từ màu thật · A1-07 tiêu đề = tên menu · A1-09 "hạn hết T3" → ngày | `do-khung` mới xanh ở 1 100 / 1 280 / 1 440 / 375 |

### GĐ2 — Làm lại từng màn theo mockup (mỗi PR: bảng truy vết → mã → ảnh cặp toàn trang 1440 + 375 → cổng ≥ 90 % khớp → **chủ SP duyệt** → merge)
Trước khi bắt đầu: PTA gỡ các chỗ mockup mâu thuẫn nhau / đã bị quyết định sau thay đổi (thanh trên m1 ↔ m3; "Báo cáo" ở đâu; dải 3 ô Lịch Test; Chờ duyệt thẻ ↔ hàng) — sửa ngay trong tệp mockup để mỗi màn chỉ còn **một** khung đúng.

| Thứ tự | PR (một màn) | Khung mockup | Ghi chú |
|---|---|---|---|
| M0 | Khung trang chung + dải lọc C10 + thanh trên | m1 khung 2a / 2b, m3 đầu trang | nền cho mọi màn — làm trước |
| M1 | Tổng quan QL / QT | m3 khung 1, 1c, 1d, 2 (+ ý tốt của #471) | X1–X5 ở màn dùng nhiều nhất |
| M2 | Công việc GV + QL | m2 "Sau" + 1b / 1e / 1f; m3 Công việc QL | hợp đồng panel việc |
| M3 | Hồ sơ lớp | m1 khung 4, m6 khung 2 | ~~bỏ khối lưới~~ → lưới gập + Nhập điểm tại chỗ (11.3); Ý thức một bảng theo em (11.3) |
| M4 | Học viên & Lớp (+ Đang SOS, Lịch thi, Xuất) | m1 khung 3, m6 khung 1, m5 | bỏ Cần làm nếu chủ SP đồng ý |
| M5 | Test (Lịch Test, Kế hoạch Test, Nhập điểm lớp, Xuất) | ba khối 06/10, m4, m2 khung 1a / 1b, m6 khung 9 | gộp 2 giao diện + 3 lối xuất |
| M6 | Phân tích (khung, panel kết quả, GV 4c, Báo cáo chiếu) | m3 khung 3, 4, 4b, 4c; m6 khung 6 | — |
| M7 | Tutor + Quản trị + TVV / CX | mT; m vai 13/10 | — |

Song song: chỉ khi khác màn, tối đa 2 PR giao diện cùng lúc (để chủ SP kịp duyệt); PR máy chủ đi trước PR giao diện của màn đó.

### GĐ3 — Thống nhất chi tiết
- **TP — thành phần một mẫu:** `ChipSos`, `DauKetQua`, ô trống, màu 5 nghĩa, mã tuần, mẫu panel + hộp nhỏ, hàm tên việc; sân mẫu `/dev/thanh-phan`; phép kiểm chặn màu / cỡ chữ lẻ, emoji, chip tự chế; chữ ≥ 12 px.
- **CHU — thuật ngữ:** bảng chốt (phụ lục a7 §2.2, chủ SP duyệt) → `THUAT_NGU_DA_CHOT.md` → đổi toàn web + Hướng dẫn + sổ tay PDF.
- **375:** bảng → thẻ ở Kế hoạch Test, Quản trị, Vận hành; thẻ em gọn; ngân sách chiều cao.

### GĐ4 — Chấm lại
Cùng phương pháp, cùng cách chia khu vực, cùng số đo (điểm Nielsen, chiều cao trang, vùng bấm, bảng số liệu, % khớp mockup). Chỉ khi ≥ 35/40 và bảng số liệu không còn cặp lệch không nhãn mới ghi "đạt".

**Tiêu chí nghiệm thu chung cho mọi PR giao diện từ nay** (khi chủ SP duyệt quy trình): bảng truy vết đủ dòng (kể cả BỎ) · ảnh cặp toàn trang 1440 tối + 375 sáng, cùng vai, cùng dữ liệu · ≥ 90 % KHỚP (KHÁC chỉ khi chủ SP đồng ý lý do) · chiều cao trang trong ngân sách · "số trên trang = số dòng panel" · `do-khung` xanh · chủ SP "đạt" trên PR.

---

## 9. Câu hỏi cho chủ SP

### 9.1 Bốn câu cần trả lời trước (chặn bước tiếp theo) — **CHỦ SP ĐÃ CHỐT 20/10: cả bốn theo khuyến nghị**
> (1) **Khung mockup đã duyệt thắng** kế hoạch / luật cũ, trừ luật nghiệp vụ, quyền, chống mất dữ liệu · (2) **chủ SP duyệt ảnh cặp / bản chạy trước khi merge PR đổi bố cục**, không merge loại PR này qua đêm; PR chỉ máy chủ vẫn tự merge ·
> (3) **sửa GĐ1 rồi mới deploy** · (4) **một phạm vi số cho cả trang** (công tắc Tất cả / FT / LT áp cả Tổng quan, bỏ "gộp hai khung") + **một định nghĩa SOS ("SOS hiện tại")** cho Tổng quan · Học viên & Lớp · Báo cáo.
> Chưa giao PR nào: chủ SP còn xem web và góp ý thêm; sau đó gộp góp ý, chốt phương án cuối rồi mới làm GĐ0 → GĐ1.

1. **Nguồn nào thắng** khi khung mockup đã duyệt khác câu kế hoạch hoặc luật cũ (vd luật 27/09 "không tự mở lớp" ↔ khung "MB FT 101 đang mở")? — Khuyến nghị: **khung thắng**, trừ luật nghiệp vụ, quyền, chống mất dữ liệu.
2. **Thêm bước chủ SP duyệt** 3–5 ảnh cặp "mockup | web" (hoặc bản chạy) trước khi merge PR **đổi bố cục**, không merge loại PR này qua đêm (PR chỉ máy chủ vẫn tự merge)? — Khuyến nghị: **có**.
3. **Sửa số sai (GĐ1: SL1 + CV-LOI) trước khi deploy** bản đang chờ? (Nếu deploy ngay: báo cáo tháng sai tháng, "PA trong kỳ" sai, Chờ duyệt lẫn chi nhánh, 8 số không bấm được sẽ lên bản chính.) — Khuyến nghị: **có**, deploy sau SL1 + CV-LOI.
4. **Một phạm vi cho mọi số trên một trang:** công tắc "Tất cả · Fast Track · Lớp thường" áp cả trang Tổng quan (bỏ luật "Cần xử lý gộp hai khung") và **một định nghĩa SOS** ("SOS hiện tại") cho Tổng quan · Học viên & Lớp · Báo cáo (danh sách SOS 8 tuần chuyển sang Phân tích)? — Khuyến nghị: **có**.

### 9.2 Các quyết định còn lại (xem dần — mỗi câu có khuyến nghị; cần trước PR ghi ở cột cuối)
| # | Câu hỏi | Khuyến nghị | Cần trước |
|---|---|---|---|
| 1 | QL được **nhập thay** bài trễ chấm ngay ở panel (mockup 1d; hiện chỉ GV có quyền)? | có, trong phạm vi chi nhánh | M1 |
| 2 | Tiêu đề mục Tổng quan thống nhất "Tổng quan" cho mọi vai; ~~Công việc đứng đầu menu~~ (**hết hiệu lực** — thứ tự menu chủ SP chốt 20/10, mục 10.0) | có (phần tiêu đề) | KHUNG-LOI, M0 |
| 3 | Hộp Chờ duyệt theo chi nhánh đang chọn (kèm dòng "n thẻ ở chi nhánh khác") thay luật 06/10 "luôn mọi chi nhánh"? | có | SL1 |
| 4 | Số trên chuông chỉ đếm việc còn mở (không đếm thông báo đã xong)? 3 loại thông báo tự động vào "Cần làm"? | có / có | SL1 |
| 5 | Badge "Công việc n" một nghĩa cho mọi vai = việc của tôi quá hạn + thẻ tôi phải quyết, theo chi nhánh đang chọn? | có | SL2 |
| 6 | "Hoàn tác 8 s" sau Duyệt (mockup 3) hay luật Q15 "quyết định không hoàn tác"? | Hoàn tác cho thao tác đảo được | M1 |
| 7 | QL mở Công việc: khối "Cần bạn quyết" đầu trang, việc của GV gập theo GV? (**đổi hướng** — mục 10.2 đề xuất "Cần bạn quyết" chỉ ở Tổng quan, câu 10.7-2) | xem 10.7-2 | M2 |
| 8 | Hàng đợi tự sang việc kế **chỉ trong cùng nhóm** (mockup 1e)? | có | CV-LOI |
| 9 | Làm "Mẫu nhận xét" (3 câu gần nhất + "Như em trước") của mockup 2? | có | M2 |
| 10 | GV có cần thấy việc "Chưa có người" / "Chọn người phụ trách" của lớp mình dạy? | không — chỉ QL | CV-LOI |
| 11 | Panel nhập điểm một kỹ năng: cột Kết quả trống tới khi có điểm, rồi Đạt / Chưa đạt của kỹ năng đó? | có | M2 |
| 12 | Chấm Speaking có hạn + "⚠ quá hạn" (mockup 2b) hay giữ không hạn (T18)? | có hạn | M2 / M5 |
| 13 | TVV / CX có khối "Cần làm" tại Tổng quan để chọn bước tiếp tại chỗ? | có | M7 |
| 14 | **Bỏ góc "Cần làm"** ở Học viên & Lớp (việc đã ở Công việc)? (vòng 2 xét lại theo I.3: vẫn khuyến nghị bỏ, thêm lối thay thế — **gộp vào câu 11.8-8**) | có | M4 |
| 15 | "Thiếu thông tin" chỉ tính Target, Tuần bắt đầu, Email; không gắn nhãn từng em, chỉ số ở hàng lớp + lọc; chỉ vai điền được thấy? | có | M4 |
| 16 | Đang SOS dùng bảng 6 cột mockup 6 khung 1? | có | M4 |
| 17 | ~~**Bỏ khối "Điểm Mock Test của lớp"** cuối hồ sơ lớp (lưới chỉ qua nút Nhập điểm)?~~ **HẾT HIỆU LỰC** — chủ SP chốt vòng 2: giữ khối, gập mặc định, nút Nhập điểm cuộn + mở tại chỗ (11.3) | — | M3 |
| 18 | Thứ tự chip hàng lớp: quá hạn luôn hiện đầu, bỏ "+n" (mockup 1)? | có | M4 |
| 19 | Chuyển lớp: hàng nút "Ngay hôm nay T2 14/09 · W4 SEP…" (trái luật 06/10 không hàng nút ngày) — đổi sang ô chọn tuần? | đổi | M4 |
| 20 | Bỏ dải 3 ô số đầu Lịch Test (mockup ba khối 06/10 có dải này)? | bỏ | M5 |
| 21 | Lưới gọn ở Lịch Test: chỉ em + cột còn nợ, ẩn W / Kỳ vọng / Overall, "Cả lớp" xem đủ? | có | M5 |
| 22 | Năm "/2026" chỉ ở đầu cột / khi khác năm (thay luật C20 "luôn ghi năm")? | có | M5 |
| 23 | Bỏ chữ "vào muộn", thay email dưới tên (mockup 4)? | có | M5 |
| 24 | Dán Excel W / S nhận thêm 4 cột tiêu chí liền nhau; ô lỗi chỉ chặn ô đó? | có | CV-LOI / M5 |
| 25 | Người chấm S: GV có kỹ năng S mặc định chính mình mọi lối; QL / QT nhập hộ phải chọn người chấm? | có | M5 |
| 26 | Progress lớp thường hiện chip SOS theo số môn trượt (Rulebook §20.17 đã chốt, web chưa theo)? | có | M5 |
| 27 | Bỏ trang `/nhap-diem` theo tuần, mọi lối dùng panel theo lượt? Gộp hai panel xuất điểm? | có / có | M5 |
| 28 | Báo cáo: SOS theo lớp đếm **HV trong kỳ** (nay) hay **lượt**? SOS "tạm" có tính? | HV trong kỳ, ghi nhãn; tạm ghi riêng | SL2 |
| 29 | Lớp thường xem Đạt / Chưa đạt Progress / Final ở đâu — thêm khối vào Báo cáo? | có | M6 |
| 30 | Phân tích GV theo khung 4c (đã duyệt) thay bảng cũ (PR #462 giữ)? | 4c | M6 |
| 31 | Số bấm được quay lại kiểu **ô viền** của mockup (nay gạch chấm)? | có | M0 |
| 32 | Báo cáo: giữ là tab Phân tích, thêm nút "Chiếu" (sáng, chữ lớn)? | có | M6 |
| 33 | TVV / CX có thấy bảng "Quá hạn theo GV" (tên GV) ở Báo cáo? | không | M6 |
| 34 | Tutor: nút chính "Thêm tutor" hay "Tải danh sách" (mockup); mặc định "Tất cả" khi không ai cần chú ý? | "Thêm tutor"; "Tất cả" | M7 |
| 35 | Quản trị cần thêm / sửa **chi nhánh** trên web? | hỏi nhu cầu thật | M7 |
| 36 | Một tên cho bài quá hạn chưa có điểm: "bài quá hạn chấm" / "bài trễ chấm" / "nợ điểm"? | "bài quá hạn chấm" | CHU |
| 37 | Vạch trái 3 px của hàng nhóm (máy dò coi là dấu hiệu "giao diện AI"; DESIGN.md đang là mẫu chuẩn) — giữ? | giữ (đúng mẫu, có nghĩa nhóm) | TP |
| 38 | Nút ⋯ ở ô điểm lớp thường ẩn tới khi rê chuột — luôn hiện mờ? | luôn hiện mờ | M5 |

---

## 10. Góp ý chủ SP vòng 1 (20/10 tối) — chung toàn web + trang Tổng quan

Nguồn: tin nhắn chủ SP 20/10 tối (nhắc tới ảnh 1–5 nhưng **không kèm ảnh**; PTA đoán: ảnh 1 = dải "HV cần chú ý", ảnh 2 = panel danh sách Case có nút Thêm PA, ảnh 3 = panel số ít giá trị, ảnh 4 = khối "Cần bạn quyết" dưới tiêu đề "Việc hôm nay", ảnh 5 = hàng Case / Chốt lộ trình khi rê chuột — chủ SP gửi lại ảnh nếu đoán sai).
Nghiên cứu: 2 agent Opus (chỉ đọc mã + ảnh đã chụp + đo token) — phụ lục [`v1-nen-chung.md`](2026-10-20-danh-gia-ux/v1-nen-chung.md), [`v1-tong-quan.md`](2026-10-20-danh-gia-ux/v1-tong-quan.md). **Vẫn chỉ là kế hoạch: chưa code, chưa mockup.**

### 10.0 Bảng quyết định vòng 1
| # | Nội dung | Trạng thái | Thay đổi mục cũ |
|---|---|---|---|
| I.1 | Tăng cỡ chữ, hệ chữ phân cấp rõ, nhất quán; PTA tự chọn phông (tiếng Việt đúng); không đánh đổi khả năng đọc để nhồi thông tin | **ĐÃ CHỐT** (cách làm: đề xuất 10.1) | nâng từ GĐ3 lên **nền làm trước** (10.6) |
| I.2 | Thứ tự menu: **Tổng quan → Lớp/HV → Test → Công việc → Phân tích → Tutor** | **ĐÃ CHỐT** | thay 7.1 và 9.2-2 ("Công việc đầu" — hết hiệu lực); mockup 6 khung 10 hết hiệu lực |
| I.3 | Tô màu **chính con số điểm** (không chỉ ký hiệu), nhất quán mọi chỗ có điểm, tương phản đạt | **ĐÃ CHỐT** (luật màu: đề xuất 10.1) | thêm vào X7, nền làm trước |
| II.1 | Số bấm "nháy rồi không ra panel" — kiểm nguyên nhân | **ĐÃ KIỂM: lỗi thật** (không phải giới hạn demo) = A1-01 | GĐ1 SL1 giữ |
| II.2 | Bớt chỉ số / panel không giá trị; không phải số nào cũng bấm; đã bấm thì phải làm được việc | **Hướng đã chốt**, cách phân loại: đề xuất 10.2 | thay X2 ("mọi số bấm được = ô viền") |
| II.2.1 | "Thêm PA ngay trên hàng HV, mở rộng tại chỗ" + nguyên tắc "làm được tại chỗ thì làm tại chỗ" | ý cụ thể **ĐỀ XUẤT chủ SP**; nguyên tắc = **hướng tư duy chủ SP yêu cầu áp toàn web** | thêm thang "làm tại chỗ" (10.3) vào X3 |
| II.3 | SOS: vùng bấm + hiển thị + tương tác + nội dung panel — overhaul | **Yêu cầu đã chốt**, cách làm: đề xuất 10.2 | gộp với A3-09…11 |
| II.4 | **Bỏ khối Trễ chấm khỏi Tổng quan** | **ĐÃ CHỐT** | thay 7.2 (bỏ "Trễ chấm cùng hàm với dải") |
| II.5 | Thiết kế lại từ đầu khu "Việc hôm nay" | **Yêu cầu đã chốt**, cách làm: đề xuất 10.2 | thay 7.2 |
| II.6 | Hover hàng không rõ — rà toàn web | **Yêu cầu đã chốt**, hệ trạng thái: đề xuất 10.1 | thêm vào X7 |
| II.7 | Bố cục chủ SP cân nhắc: hộp duyệt trên, dưới trái danh sách / phải chi tiết | **ĐỀ XUẤT chủ SP** — PTA khuyến nghị biến thể B (10.2) | thay 7.2, 9.2-5, 9.2-7 (chờ câu hỏi 10.7) |

### 10.1 Nền chung toàn web (I.1, I.2, I.3, II.6)

**Chữ (I.1) — lời chủ SP "nhiều chỗ nhỏ hơn bản đang deploy" = ĐÚNG MỘT PHẦN [ĐÃ KIỂM]:**
- OV-15a (#460) hạ **mọi ô bảng không tự đặt cỡ từ 14 → 13 px** (238 mẫu ô, 55 bảng); đầu cột 11 px in hoa → 12 px thường (chữ nhìn thấy thấp đi ~21 %); khối chính Tổng quan QL: dòng 14 → 13, số 16 → 13 (OV-15d / h1). Ngược lại ô điểm và cột Kỳ vọng / Overall to lên.
- ~69 % lớp cỡ chữ vẫn ≤ 12,5 px ở cả hai bản; khối thêm sau deploy làm ở 11–12 px. → nguyên nhân gốc: thang chữ hiện tại quá nhỏ cho bảng dày tiếng Việt, và mỗi PR tự đặt cỡ.
- **Đề xuất phông:** **giữ Be Vietnam Pro (chữ) + Inter (chữ số)** — đo cả hai đủ 134/134 ký tự tiếng Việt; đổi sang Inter chỉ cao chữ hơn ~3 %, còn tăng cỡ 13 → 15 được ~15 %. Không in hoa chữ Việt; line-height ≥ 1,5 ở chỗ có dấu chồng.
- **Đề xuất thang cỡ (px):** 12 · 13 · 14 · **15** · 17 · 22 · 28. Ô bảng, chữ thường, nút: **15**; lưới nhập điểm: 14; chữ phụ / nhãn / đầu cột / chip: 13; **không chữ nào < 12**; ô nhập ở 375: 16. Bảng dài thêm ~8–11 % → bù bằng bỏ khối trùng (X4) và hàng một dòng (X5) **ngay trong PR của màn đó**.

**Màu số điểm (I.3) [ĐÃ KIỂM + ĐỀ XUẤT]:**
- Hiện có **6 cách tô ở 19 nơi**; nhiều nơi chỉ tô ký hiệu. Lỗi màu hiện tại: ở chế độ tối xanh lá / đỏ gần như trùng với người mù màu đỏ–lục (ΔE 1,3); màu "bằng kỳ vọng" trùng màu link / nhấn (ΔE 2,4 tối, 0 sáng); token `ok` ở chế độ sáng dưới 4,5 : 1 trên hai nền.
- **Đề xuất một luật cho 17 nơi:** tô **chính con số** + giữ ✓ / ✗ (không chỉ dựa màu); 3 token mới `--kq-vuot` / `--kq-bang` / `--kq-duoi` — tối `#86efac / #a5b4fc / #ff8282`, sáng `#166534 / #1e40af / #c81e1e` (tương phản thấp nhất 4,67 : 1 trên 9 nền thật; mù màu ΔE 1,3 → 11,4); "chưa đủ điểm" trung tính; ô đang gõ không tô; không lẫn màu SOS (vàng / cam / hồng).

**Hover + trạng thái (II.6) [ĐÃ KIỂM + ĐỀ XUẤT]:**
- Hover hàng hiện chỉ chênh ΔL 2,8–4,5 (gần như không thấy; `.row-hover` phủ trắng 4 %); không hover ở cột tên dính, hàng nhóm, hàng đã thi; **29/35 loại hàng có hover mà không bấm được**; danh sách việc ở Tổng quan không có hover.
- **Đề xuất một hệ trạng thái:** rê chuột = nền phủ 8 % (tối) / 9 % (sáng), ΔL ≥ 5,8 trên mọi nền + một tín hiệu nữa (động từ gạch chân / con trỏ tay) — **chỉ cho thứ bấm được**; đang chọn = nền nhấn nhạt + viền trái 3 px (khác hẳn hover); focus = vòng 2 px; bảng không bấm được bỏ hover (giữ "dò hàng" nhẹ cho bảng ≥ 8 cột — hỏi chủ SP).

**Thứ tự menu (I.2) [ĐÃ CHỐT]:** chỉ đổi chỗ Phân tích ↔ Công việc (`shared/domain/dieuHuong.ts:51-52`) + sửa 2 phép kiểm; GV giữ trang đầu Công việc (quyết định 19/10). Tăng cỡ chữ làm thanh trên cắt nặng hơn ở 1 280 px → dưới 1 440 px ô tìm thu thành nút kính lúp; thanh dưới 375 ≤ 5 nút, QT / QL gom Phân tích + Tutor vào "Thêm".

### 10.2 Tổng quan QL / QT — thiết kế lại (II.1–II.7)
**Kiểm kê 29 thành phần:** giữ 7 · đổi cách bấm / chỗ / tên 15 · **bỏ 7** · thêm 1–3 nhóm việc của QL. Panel "danh sách số" mở từ Tổng quan: 6 loại → **0**. Bảng đủ ở phụ lục `v1-tong-quan.md` Phần 2.

**Phân loại số (II.2.2) — bốn loại:** (a) **chỉ xem** — số trơn, không gạch, không hover · (b) **bấm để lọc / nhảy tới nhóm** ngay trên trang · (c) **bấm để làm việc tại chỗ** (đủ chức năng) · (d) **mở trang khác** chỉ khi cần không gian lớn. Ví dụ: "Chưa điểm" (QL không có quyền nhập) = (a); số trong bảng Lớp cần chú ý = (c) mở rộng hàng lớp; ô tuần của "Tuần này" = (d) sang Lịch Test tuần đó.

**Dải "HV cần chú ý":** đề xuất **bỏ** — nó vẽ lại đúng số của hàng tổng "Cả Monbay" (cũng là gốc lỗi "nháy"); số chỉ còn ở hàng tổng, chữ số to hơn, chỉ xem. Trái quyết định Q6a cũ → hỏi (10.7). Bỏ Trễ chấm kéo theo bỏ "n bài trễ chấm · n GV" ở dải; trễ chấm theo GV xem ở Lịch Test / Phân tích GV / Báo cáo; thông báo tự động nhắc GV phải vào nhóm "Cần làm" (sửa A1-04 ở GĐ1).

**SOS (II.3):** hiện vùng bấm chỉ là chữ số trong chip (8×12 px), panel chỉ ra tên. Đề xuất: **cả ô SOS là một nút** (≥ 44 px cao) → **mở rộng hàng lớp ngay tại chỗ**: mỗi em một dòng (mức SOS + kỹ năng · MT · tuần · Case / PA · việc tiếp + hạn · nút theo quyền, gồm Thêm PA ngay dưới dòng em) — theo mockup 6 khung 1; chip SOS + hộp "Vì sao SOS" một mẫu toàn web (A3-10, A3-11).

**Bố cục — so 4 phương án** (QL Monbay sáng thứ Hai; chi tiết + sơ đồ ở phụ lục Phần 4):

| Tình huống | Hiện tại | **A** chủ SP: hộp duyệt trên + dưới trái / phải | **B** một hàng đợi trái / phải, Chờ duyệt là nhóm đầu | **C** Tổng quan chỉ là bức tranh, việc ở Công việc | **D** trái hàng đợi, phải mặc định Lớp cần chú ý |
|---|---|---|---|---|---|
| Duyệt 10 thẻ có xem bối cảnh | ≈ 31 bấm · **20 đổi trang** | 20 bấm + ~10 lần cuộn (chi tiết ở dưới, xa chỗ bấm) hoặc 2 kiểu thao tác | **11 bấm · 0 đổi trang · 0 cuộn** | 12 · 1 đổi trang | 11 · 0 |
| Thêm PA 5 Case quá hạn | 25–30 bấm · 5 panel phủ | 11–16 · 0 | **11–16 · 0** (tự sang Case kế) | +1 đổi trang | 11–16 |
| Chốt lộ trình 6 lớp | 40–60 · 6 panel toàn màn | ≈ 12 + em chưa đề xuất | **≈ 12 + em chưa đề xuất** | như B + 1 đổi trang | như B |
| Biết lớp nào có SOS 3, em nào, có PA chưa | 3 bấm · 1 đổi trang · 1 panel | 1 bấm | **1 bấm** | 1 bấm | 1 bấm |
| Độ dài trang 1440 / 375 | 2,5 / 5,3 màn | ≈ 2 / 3,2 | **≈ 1,7 / 2,5** | ≈ 0,8 / 1,2 (+ trang Công việc) | ≈ 1,15 / 2,5 |
| Trùng trang Công việc QL | trùng Chờ duyệt | **trùng y bố cục** (Công việc QL hiện đúng là A) | không (khi phân vai) | không | không |

- **Khuyến nghị: B** — giữ lõi ý chủ SP (trái danh sách, phải chi tiết, làm ngay tại đây); khác A một điểm: **Chờ duyệt là nhóm đầu của danh sách, luôn mở** (có "Chọn nhiều" để duyệt hàng loạt cùng loại), không tách hộp riêng ở trên. Lý do: chi tiết luôn ngang hàng chỗ vừa bấm; một kiểu thao tác cho mọi nhóm; ngắn hơn ~250–300 px; đúng mẫu "nhóm trong một danh sách" của mockup 2 + 3; không sao y Công việc. Điểm A hơn B: hàng duyệt rộng hết trang đọc được "Nếu duyệt" không cần bấm → B bù bằng dòng 2 ghi trích ngắn + "Chọn nhiều". Không chọn C (mọi việc thêm 1 đổi trang, trái ý "làm ngay tại đây"); không chọn D (một khung hai vai, cuộn lồng với QT).
- **B cụ thể:** đầu trang một hàng (Tổng quan · Chi nhánh ▾ · Tất cả | FT n | LT n · Dữ liệu đến · Báo cáo ›) → "Cần bạn quyết · 23 việc · ⚠ 12 quá hạn · 2 hạn hôm nay" → **trái 560 px danh sách / phải ~820 px chi tiết (dính)** → "Lớp cần chú ý" (số = cả ô, mở rộng hàng) → "Tuần này" một hàng ô tuần.
  Nhóm cố định thứ tự: Chờ duyệt · Case quá hạn chốt PA · Sau thi · Bước tiếp · Lộ trình lớp · Phân công (chưa có người) · Lịch Test (chưa lịch MT kế) · Vận hành quá hạn — chỉ nhóm có việc mới hiện; Chờ duyệt luôn mở (≤ 5 dòng + "Xem thêm"), nhóm có quá hạn mở (≤ 3), còn lại gập.
  Dòng 2 hàng ~52 px: tên + lớp / một dữ kiện bối cảnh / hạn + **động từ** ("Duyệt ›", "Thêm PA ›", "Chốt ›"); cả dòng là vùng bấm; mức ưu tiên phân biệt bằng chữ + ký hiệu ("⚠ quá hạn 5 ngày", "Hạn hôm nay", "còn 3 ngày"), không tô nền cả hàng.
  Đủ trạng thái: rê chuột · focus · đang chọn · đang lưu · vừa xong (Hoàn tác) · lỗi giữ chữ · người khác đã xử lý · hết nhóm · trống · lô lỗi một phần. Vào trang chọn sẵn việc đầu, **không đặt con trỏ, không cuộn**. 375: danh sách → chi tiết toàn màn, nút chính dính đáy, "Việc 2 / 10", Quay lại về đúng chỗ.
- **Phân vai Tổng quan ↔ Công việc [ĐỀ XUẤT]:** việc QL / QT phải quyết **chỉ ở Tổng quan**; Công việc của QL / QT chỉ còn **việc của GV** (gập theo GV) + một dòng "Cần bạn quyết · 23 — ở Tổng quan ›"; số trên menu của QL chuyển sang "Tổng quan". Thứ tự menu đã chốt (Tổng quan đầu) ủng hộ Tổng quan là trang nhà của QL.
- **Bỏ khi làm lại màn:** dải "HV cần chú ý" (nếu chủ SP đồng ý) · Trễ chấm · link "Thống kê theo kỳ" · "Lịch sắp tới" (tab tuần + "L R W S") · câu hướng dẫn dưới nút · mọi panel danh sách số · nút "Mở" đổi trang · khối "Chờ bạn duyệt" + "Việc quản lý" ở Công việc QL.

### 10.3 Thang "làm tại chỗ" — áp toàn web [ĐỀ XUẤT, theo hướng tư duy chủ SP II.2.1]
| Bậc | Dạng | Khi nào |
|---|---|---|
| 0 | Chỉ xem (số / chữ không bấm) | số để quan sát; vai đó không có việc gì để làm |
| 1 | Một bấm trên hàng / trong chi tiết (+ Hoàn tác 8–10 s) | 0 ô, đảo được, bối cảnh đã thấy |
| 2 | Hộp nhỏ neo tại nút / mở rộng ngay dưới hàng | 1–2 ô ngắn; hoặc ≤ 4 ô khi danh sách rộng hết trang và bối cảnh có sẵn trên hàng |
| 3 | Khung chi tiết bên phải (375 = toàn màn + "‹ Quay lại") | 3–6 ô hoặc cần khối bối cảnh; làm tuần tự nhiều việc cùng loại |
| 4 | Panel rộng **thay** khung phải (không phủ thanh trên, không chồng) | bảng nhiều em của một lớp / một lượt |
| 5 | Trang riêng | xem hồ sơ (link "↗" tách khỏi nút làm); không gian lớn |

Luật kèm: chọn bậc **thấp nhất** đủ dùng · một danh sách một kiểu mở (không trộn bậc 2 và 3) · mở cái mới thì thay cái cũ · nút làm việc ≠ link xem hồ sơ · xác nhận chỉ khi hậu quả lớn · số bấm được phải trông bấm được, vùng bấm ≥ 24 / 44 px.
**Ý "Thêm PA trên hàng HV":** đúng ở **bảng lớp rộng hết trang** (vùng mở rộng của Lớp cần chú ý, Đang SOS: form gọn 2 hàng ~220 px; 3–4 bấm thay 5–7, 0 panel); ở **danh sách hẹp 560 px** (hàng đợi) dùng khung phải; **cùng một form**. Áp thang cho 13 thao tác của Tổng quan: phụ lục `v1-tong-quan.md` 5.3 (Duyệt bậc 1; Từ chối, Gia hạn, Phân công, Xếp lịch MT kế bậc 2; Thêm PA, Ghi nhận xét, Xác nhận Case, Bước tiếp bậc 3; Chốt lộ trình bậc 4; xem hồ sơ bậc 5).

### 10.4 Mở rộng sang chỗ khác cùng cấu trúc
Báo cáo (số → panel chỉ tên — A5-07) → "bảng kết quả" mở rộng dưới hàng · hàng lớp ở Học viên & Lớp → **cùng thành phần "hàng lớp mở rộng"** với Tổng quan · Đang SOS + panel một em → dòng em dùng chung với Tổng quan · chip hồ sơ lớp ("8 chờ duyệt", "78 bài chờ chấm") → lọc tại chỗ / nhóm Chờ duyệt lọc lớp · Lịch Test 3 ô → bỏ · "Lớp tôi dạy" → khung phải · Phân công / Giao việc / Gia hạn → hộp nhỏ · hàng đợi Công việc → cùng luật tự sang việc kế với Tổng quan · hộp lịch Kế hoạch Test → thao tác trong hộp · Tutor hộp chồng → thay nội dung · chuông → mở đúng việc tại chỗ · Tổng quan TVV / CX / Admin → cùng mẫu hàng đợi + chi tiết.
Chữ nhỏ / số không màu / hover mờ ở chỗ khác: phụ lục `v1-nen-chung.md` Phần E.

### 10.5 Đối chiếu mockup
- **Hết hiệu lực:** mockup 6 khung 10 ("Báo cáo" thay "Tổng quan", Công việc đầu menu) — theo thứ tự menu đã chốt; khối Trễ chấm của mockup 3 — đã chốt bỏ. Theo luật đã chốt 9.1-1 (quyết định mới trái khung thì sửa mockup), sửa các khung này trong PR tài liệu kế tiếp.
- **Mockup cũng có vấn đề chủ SP vừa chê:** mockup 3 vẽ cùng số hai lần (dải = hàng Cả Monbay), ~60 con số, vùng bấm chỉ quanh số, không vẽ hover / đang chọn, giả định QL nhập được điểm.
- **Giữ từ mockup 3 / PR #471:** đầu trang một hàng, ý nhóm việc + hàng gọn, dòng Case có chip SOS + "PA … chờ xác nhận từ …", dòng Bước tiếp có OVR + Đạt, Lộ trình lớp "đã đề xuất x/y", nhóm chỉ hiện khi có việc, trống "✓ Không có việc chờ", Tuần này là một hàng ô tuần.
- Thiết kế lại theo B **cần mockup mới** (1440 tối + 375 sáng, QL + QT "Tất cả chi nhánh", đủ trạng thái) — chỉ soạn sau khi chủ SP gửi xong góp ý và duyệt hướng.

### 10.6 Cập nhật kế hoạch (mục 8)
- **Nền làm trước GĐ2 (mới — "NEN"):** thang chữ + phông + line-height; 3 token màu kết quả + tô con số ở 17 nơi; hệ trạng thái hover / đang chọn / focus; thứ tự menu + thanh trên < 1 440 + thanh dưới ≤ 5 nút. Có bảng mẫu chữ tiếng Việt + bảng màu cho chủ SP duyệt trước khi code; phép kiểm chặn chữ < 12 px và màu điểm ngoài token.
- **GĐ1 SL1** giữ vá 1 dòng lỗi "nháy" (để deploy được) dù thiết kế lại sẽ bỏ dải; thêm sửa A1-04 (thông báo tự động vào "Cần làm").
- **GĐ2 M1 Tổng quan** đổi sang bố cục B (khi chủ SP duyệt) + phân vai với Công việc (M2 Công việc QL bớt phần "Cần bạn quyết").

### 10.7 Câu hỏi vòng 1 (hỏi gộp khi chủ SP gửi xong góp ý; mỗi câu có khuyến nghị)
1. **Bố cục Tổng quan:** B (một hàng đợi trái / phải, Chờ duyệt là nhóm đầu luôn mở + "Chọn nhiều") thay A (hộp duyệt riêng ở trên)? — **B.**
2. **Phân vai:** việc QL / QT phải quyết chỉ ở Tổng quan; Công việc của QL chỉ còn việc của GV; số trên menu QL chuyển sang "Tổng quan"? — **Có.**
3. **Bỏ dải "HV cần chú ý"** (thay Q6a cũ): số chỉ còn ở hàng tổng của bảng, chỉ xem? — **Có.**
4. **Số trong "Lớp cần chú ý"** (gồm SOS): bấm cả ô → mở rộng hàng lớp tại chỗ (có Thêm PA dưới dòng em), bỏ mọi panel danh sách tên? — **Có.**
5. **Hệ quả bỏ Trễ chấm:** bỏ luôn "n bài trễ chấm · n GV" ở dải; "Tuần này" còn một hàng ô tuần (Test · HV · Chấm x/y), bấm ô → Lịch Test tuần đó? — **Có.**
6. **Thang "làm tại chỗ" 0–5** làm luật toàn web (ghi DESIGN.md + CLAUDE.md sau khi duyệt)? — **Có.**
7. **Phông:** giữ Be Vietnam Pro + chữ số Inter, chỉ tăng cỡ (ô bảng 15, lưới điểm 14, nhãn 13, tối thiểu 12) + sửa line-height; chấp nhận bảng dài thêm ~8–10 %, bù bằng bỏ khối trùng trong cùng PR? — **Có.**
8. **Overall FT** tô màu theo cùng luật (so kỳ vọng của lượt)? Em **KCK** dưới kỳ vọng: số trung tính + chữ "KCK" mọi nơi (đúng quyết định OV-9)? — **Có / có.**
9. **Bảng không bấm được** bỏ hover, chỉ giữ "dò hàng" nhẹ cho bảng ≥ 8 cột? — **Có.**
10. **Chữ "Lớp/HV"** trong góp ý: có đổi tên mục "Học viên & Lớp" không (thuật ngữ đã chốt, dùng ở 55 tệp + Hướng dẫn)? — **Không đổi tên, chỉ đổi thứ tự.**
11. **375:** QT / QL gom Phân tích + Tutor vào nút "Thêm" (thanh dưới ≤ 5 nút)? — **Có.**
12. **Ảnh 1–5:** gửi lại nếu PTA đoán sai nội dung ảnh (đầu mục 10).

---

## 11. Góp ý chủ SP vòng 2 (20/10 khuya) — Học viên & Lớp · Hồ sơ lớp · Hồ sơ HV + vấn đề hệ thống

Nguồn: tin nhắn chủ SP 20/10 khuya + **5 ảnh có kèm** — ảnh 1 Học viên & Lớp (QT Monbay, Bộ lọc thêm mở) · ảnh 2 Hồ sơ lớp MB FT 101 › Ý thức › Vi phạm & xử lý + lưới Điểm MT mở · ảnh 3 cùng trang › Phối hợp SOS · ảnh 4 lưới MT3 phóng to, khoanh đỏ cột L, R, W1, W2, Kỳ vọng / Overall · ảnh 5 terminal Vite: 2 cảnh báo "duplicate case" ở `PanelViec.tsx`.
Quyền chủ SP vòng này: **được đề xuất overhaul toàn bộ giao diện, bố cục, bảng, panel, chữ, workflow; được bỏ / thay component, CSS, cấu trúc cũ không hợp lý; KHÔNG đổi luật nghiệp vụ; chỗ chưa rõ phải hỏi.** Vẫn chỉ đánh giá + kế hoạch.
Nghiên cứu: 2 agent Opus chạy trên web demo (chỉ đọc, 208 ảnh, đo DOM 46 trang × 1 440 / 1 280 / 375) + PTA kiểm ảnh 5. Đủ 8 ý cho mỗi vấn đề (vấn đề · nguyên nhân · ảnh hưởng · phương án · vì sao · chỗ khác · trình tự · cần xác nhận) ở phụ lục
[`v2a-hoc-vien-lop.md`](2026-10-20-danh-gia-ux/v2a-hoc-vien-lop.md) (mã **V2A-01…09**) và [`v2b-bang-ho-so.md`](2026-10-20-danh-gia-ux/v2b-bang-ho-so.md) (mã **V1…V9**, ở đây ghi **V2B-1…9**). Dưới đây là bản gọn.

### 11.0 Bảng quyết định vòng 2
| # | Nội dung | Trạng thái | Thay đổi mục cũ |
|---|---|---|---|
| I.1 | Bộ lọc thời gian chỉ còn **Tuần bắt đầu → Tuần kết thúc**, bỏ tháng / 2 tuần / khoảng cố định, mỗi chỗ có mặc định riêng, áp toàn web; chỗ có logic thời gian đặc thù xét riêng | **ĐÃ CHỐT** · cách làm: đề xuất 11.1b · ngoại lệ Lịch thi theo tháng: **hỏi** 11.8-7 | thay C29 (bộ chọn 4 kiểu) |
| I.2 | "Tuần thi của kết quả" → **"Thời gian"**; rà cụm thiếu tự nhiên | **ĐÃ CHỐT** · ~20 cụm khác: đề xuất (V2A-02) | — |
| I.3 | Bảng góc "Cần làm" | **Yêu cầu rà đã chốt** · khuyến nghị **bỏ góc** + 3 lối thay thế: đề xuất 11.2 · **hỏi** 11.8-8 | giữ hướng 9.2-14, thêm lối thay thế |
| I.4 | Ô tick chọn HV để xuất Excel | **CHƯA CHỐT** · khuyến nghị **phương án 3** (bỏ ô tick khỏi bảng, chọn em trong panel Xuất) · **hỏi** 11.8-9 | — |
| I.5 | **Thi** = kỳ thi thật · **Test** = MT / Progress / Final / Mini…; nhóm gồm cả hai gọi **Test** | **ĐÃ CHỐT — nghiệp vụ** · chữ cụ thể: **hỏi** 11.8-5 | bảng thuật ngữ 01/10 (C-028, C-035, C-036), chữ Rulebook, mockup 4 / 5 phải sửa theo |
| I.6.1 | Overhaul bộ lọc + bảng Lịch thi | **Yêu cầu đã chốt** · đề xuất 11.2 | mockup 5 khung 1 sửa |
| I.6.2 | "Ghi chú họp" → **"Ghi chú"** · "Cần xác nhận" là gì | đổi tên **ĐÃ CHỐT** · nghĩa **ĐÃ KIỂM** (11.2) · bỏ nút: **hỏi** 11.8-6 | — |
| I.6.3 | Tháng dự kiến thi + ngày thi; tới tháng chưa có ngày → trạng thái riêng + việc "chốt ngày thi" **không hạn**; A "Đã chốt ngày" / B "Chưa chốt ngày" | **ĐÃ CHỐT — nghiệp vụ** · 5 điểm luật còn mở: **hỏi** 11.8-3 · **lỗi P1 mới** (11.2) | thêm PR **LT-SV** vào GĐ1 |
| I.7 + II.4 | Ô điểm W1 / W2 lệch; bảng lôm côm, xô lệch toàn web — sửa **triệt để ở cấp hệ thống** | **ĐÃ CHỐT** · gốc **ĐÃ KIỂM** (11.1a) · hệ thống bảng mới: đề xuất · căn giữa hay trái: **hỏi** 11.8-4 | thêm **BANG-0 / BANG-1**; X7 nâng thành vấn đề hệ thống |
| II.1 | Mọi bảng Hồ sơ lớp: đánh giá + thiết kế lại | **Yêu cầu đã chốt** · đề xuất 11.3 | 7.5 sửa |
| II.1 | Lưới Điểm MT **gập mặc định**; nút **Nhập điểm** cuộn tới + mở lưới để nhập trực tiếp, **không panel phải**; áp cách nghĩ này cho chỗ tương tự | **ĐÃ CHỐT** · chi tiết: đề xuất 11.3 · 12 chỗ tương tự: 11.1c | **hết hiệu lực:** 7.5 "bỏ khối lưới", 9.2-17, M3 "bỏ khối lưới" |
| II.2 + II.3 | Thiết kế lại Ý thức / Phối hợp Hồ sơ lớp; bảng / nhóm quá giống nhau (Phối hợp SOS) | **Yêu cầu đã chốt** · khuyến nghị phương án A (11.3) · **hỏi** 11.8-11 | — |
| II.5 | Ảnh 5 — lỗi bất thường | **ĐÃ KIỂM bằng mã: lỗi thật** (11.1e) · bấm thử trên web: chưa | thêm vào GĐ1 CV-LOI |
| III.1 | Ý thức / Phối hợp Hồ sơ HV: cùng ngôn ngữ với Hồ sơ lớp, mật độ một em | **Yêu cầu đã chốt** · đề xuất 11.4 · **hỏi** 11.8-12 | thêm màn **M3b** |

### 11.1 Vấn đề hệ thống (ưu tiên — mỗi cái chạm nhiều trang)

**11.1a Bảng xô lệch — nguyên nhân gốc [ĐÃ KIỂM — đo DOM + mã + git] (V2B-1, V2B-2)**
- **Vấn đề:** lưới Điểm MT lệch tiêu đề ↔ ô **45–69 px** (S 68 px, L 51 px) ở **cả 6 lối vào** (hồ sơ lớp, panel Nhập điểm, Lịch Test, Công việc, `/nhap-diem`, Điểm theo lớp); trong một hàng con số chính lệch đường cơ sở **7–20 px** (Học viên & Lớp: W cao hơn L / R / S 20 px vì ô W 3 dòng); cùng cột lệch mép ±16 px (Tổng hợp); hàng cao 46–101 px; một bảng 4–5 cỡ chữ (11 · 11,5 · 12 · 13 · 15). Ở 1 280 px Học viên & Lớp vỡ thêm 8/13 cột. **Đối chứng:** Kết quả thi, Báo cáo, Hồ sơ GV, Quản trị, Mock Test hồ sơ HV đo **0 cột lệch** → lỗi do cách dựng bảng, không do phông / màn hình.
- **Gốc (8, có bằng chứng):** R1 **không có component bảng** — 65 `<table>` ở 53 tệp, ~190 lớp căn viết tay trên từng ô, tiêu đề và ô của một cột viết ở hai chỗ (có khi hai tệp) · R2 OV-15a (#460, `31b4f24f`, 19/10) hiện thực C06 "số căn giữa" bằng **luật theo tên lớp** `index.css:267` → tiêu đề `align="right"` thành giữa, ô `text-right` vẫn phải; **trước OV-15a lưới này thẳng** · R3 cột giãn (`w-full` + colgroup px: L 104 → 134 px; colgroup % vỡ ở 1 280) · R4 **ô điểm 7 cấu trúc** khác nhau + căn giữa dọc → ô 1–3 dòng đẩy số lên xuống; `align-top` đặt trên `<tr>` (`ClassRoster.tsx:240`) không có tác dụng · R5 thanh công cụ (Dán từ Excel, GV chấm S) nằm **trong** khung bảng · R6 ~100 phép kiểm đọc **chuỗi mã** của tệp bảng → dựng lại là vỡ hàng chục phép kiểm, nên mỗi PR chỉ dám sửa số px; `do-khung` **bỏ qua** lưới chấm · R7 quy trình vá số ("TT 118 → 146, Kết quả 150 → 136…" ghi ngay trong mã) · R8 lệch mockup 6 khung 3 đã duyệt (ký hiệu trước số, cột hẹp, thẳng).
- **Ảnh hưởng:** Cô Linh nhập 20 bài dò từ tiêu đề "L" sang ô cách 51 px, dễ nhầm L ↔ R; Chị Vy không so được L / R / W / S của một em; chủ SP phải nhắc mỗi đợt, mỗi lần sửa một chỗ thì chỗ khác vỡ.
- **Phương án [ĐỀ XUẤT] — hệ thống bảng mới, không vá:** một `Bang` + **kiểu cột** (tên · chữ · số · điểm · nổi bật · chip · tuần/ngày · việc · nút) — kiểu cột sinh cùng `data-kieu` cho tiêu đề và ô nên **không thể lệch**; cột rộng px theo kiểu, chỉ một cột linh hoạt, không %; hàng **44 px (1 dòng) / 64 px (2 dòng)**, căn **đường cơ sở**, không ô > 2 dòng; tối đa một dải nền nhấn; công cụ **ngoài** khung bảng; hover / chọn / mở rộng theo hệ trạng thái vòng 1; 375 tự thành thẻ **từ cùng định nghĩa cột**. Một **`ODiem`** thay 7 kiểu ô: ký hiệu ✓ / ✗ **trước** số, khung rộng cố định (số trong cột luôn thẳng), số 15 / 700 tô theo 3 token kết quả vòng 1, **một** dòng phụ 12 px ưu tiên "thiếu nhận xét" > "vắng lần n" > "n câu", dấu lưu ở góc trên. Bỏ luật `index.css:267`. Thang chữ vòng 1 (ô 15, phụ 13, tối thiểu 12).
- **Chống tái phát (để chủ SP không phải nhắc lại):** phép kiểm tĩnh `bang.tests.ts` trong `npm run check` (cấm lớp căn trên `td` / `th` ngoài `Bang`; cấm luật căn theo tên lớp; `<table>` chỉ trong `Bang`, danh sách tệp miễn **chỉ được giảm**; cỡ chữ trong ô ∈ thang; cột số / điểm rộng px) + **`do-bang`** đo DOM (script đã viết ở đợt rà) gắn vào `do-khung`: lệch tiêu đề ↔ ô ≤ 2 px, đường cơ sở ≤ 2 px, cao hàng ∈ {44, 64}, không tràn, ở 1 440 / 1 280 / 375; bỏ miễn đo cho lưới chấm. Phép kiểm đọc chuỗi mã cũ viết lại theo hành vi.
- **Vì sao:** so B "chỉ sửa CSS toàn cục" (một tệp nhưng tái phát — đã tái phát 07/10 và 19/10) và C "thêm thư viện bảng" (thư viện không lo phần căn / ô điểm, thêm phụ thuộc): A là cách duy nhất có luật **kiểm được bằng máy**.
- **Chỗ khác:** 53 tệp có bảng + ~10 danh sách dạng lưới div + 5 lưới ARIA (danh sách ở V2B-1 mục 6).
- **Trình tự:** **BANG-0** (nền: `Bang`, `ODiem`, CSS, phép kiểm, `do-bang`, bảng mẫu `/dev/thanh-phan`, DESIGN.md — ~6–8 tệp; cùng NEN) → **BANG-1** lưới điểm (~7 tệp + viết lại ~40 phép kiểm; sửa 6 lối vào một lần; không đổi bố cục, đã có mockup 6 khung 3) → chuyển dần theo màn M3–M7 (~50 tệp) — xong khi danh sách miễn về 0.
- **Hỏi:** 11.8-1 (BANG-0/1 trước deploy), 11.8-4 (căn giữa hay trái), 11.8-13 (duyệt bằng bảng mẫu), 11.8-14 (W1 / W2 có ✓ / ✗; một dòng phụ).

**11.1b Bộ lọc thời gian — 14 chỗ, 5 dáng [ĐÃ KIỂM] (V2A-01)**
- **Vấn đề:** 14 chỗ chọn thời gian, 5 dáng, 9 chế độ (bảng đủ tệp:dòng ở V2A-01). Đổi khoảng ở Phân tích 5 thao tác; hộp Bộ lọc thêm rộng 360 px **mất nút "Tùy chọn"**; chip "Mọi lúc ✕" sáng đúng lúc **đang lọc** (nói ngược trạng thái); "Theo tháng" ra tháng trước (P0 A5-01).
- **Gốc:** C29 chốt bộ chọn 4 kiểu, sau đó mỗi PR thêm bộ chọn riêng (`ChonTuanSos`, 12 nút tháng Lịch thi, mỗi panel xuất một kiểu); không thành phần chung.
- **Phương án [ĐỀ XUẤT]:** một thành phần **`Khoảng tuần`**: `Thời gian ‹ [W1 SEP ▾] → [W2 SEP ▾] ›  Mặc định` ngay trên dải lọc, đổi là áp dụng (không hộp, không "Áp dụng"); mỗi ô gõ được hoặc mở lịch tuần (`ONgay kieu="tuan"` — đúng luật 06/10); chọn ngược tự đổi chỗ; cùng tuần hợp lệ; năm chỉ hiện khi khác năm; ‹ › dời cả khoảng; khoảng nằm trên URL → Quay lại giữ đúng; 375 hai ô 44 px. Dáng **một tuần** (Lịch Test, Góp ý tuần) là cùng thành phần khoá một ô. Máy chủ chỉ còn `tu`, `den`; link cũ `kieu=thang` vẫn đọc được (đọc theo tháng chứa thứ Năm tuần đầu — **sửa luôn gốc P0**).
- **Mặc định đề xuất:** Phân tích 2 tuần hoàn chỉnh trước (giữ C24) · Tutor + Bộ lọc thêm tuần trước → tuần này · Hiệu quả PA 8 tuần · Lịch Test / Góp ý tuần một tuần · Báo cáo đơn vị bỏ "Tháng" · Đang SOS bỏ hẳn bộ lọc thời gian (theo 9.1-4 "SOS hiện tại").
- **Xét riêng (logic đặc thù):** Lịch thi lọc theo **tháng dự kiến thi** (nghiệp vụ, Rulebook dòng 258) — cùng dáng nhưng đơn vị tháng · ô **nhập** ngày / tuần (ngày thi, tuần bắt đầu, nhập bù Case) không phải bộ lọc, giữ `ONgay` · cửa sổ cố định "Đã xử lý 30 ngày / 7 ngày", "Sắp thi 6 tuần" là định nghĩa chỉ số, không phải ô chọn → giữ (hỏi có đổi sang tuần không).
- **Vì sao:** Phân tích 5 → 1–2 thao tác; Tutor mặc định có dữ liệu (0 thao tác); 375 hết hộp phủ bảng; một cách chọn cho cả web.
- **Trình tự:** GĐ1 SL1 bỏ 3 kiểu thừa trong hộp cũ (không đổi bố cục) → M0 dựng `Khoảng tuần` (thành phần mới — **cần mockup**) → thay theo màn. **Hỏi:** 11.8-7, 11.8-10.

**11.1c "Đã có trên trang thì làm ngay đó" — 12 chỗ [ĐÃ KIỂM mã] (V2B-5)**
Câu chủ SP "tại sao phải tạo thêm panel khi đã có bảng ngay trên trang" áp toàn web; luật: nội dung đã có trên trang → bậc 0–2 tại chỗ; chưa có → bậc 3 khung phải; bậc 5 chỉ để xem hồ sơ (thang 10.3).

| # | Chỗ | Nay | Sau (bậc) |
|---|---|---|---|
| 1 | Hồ sơ lớp · nút **Nhập điểm** | panel toàn màn = **bản thứ 2** của lưới đã có cuối trang | cuộn + mở lưới (0–1) [ĐÃ CHỐT] |
| 2 | Hồ sơ lớp · chip "78 bài chờ chấm" | đổi trang Lịch Test | như #1, chip đếm ô **đã tới hạn** (1) |
| 3 | Hồ sơ lớp · chip "⚠ 7 việc quá hạn" (GV) | đổi trang Học viên & Lớp | lọc bảng tại chỗ, em quá hạn lên đầu (1) |
| 4 | Hồ sơ lớp · chip "Thiếu n thông tin" | đổi trang | mở "Sửa thông tin" có sẵn, lọc em thiếu (4) |
| 5 | Hồ sơ lớp · chip "8 chờ duyệt" (QL) | đổi trang Công việc | khung phải Chờ duyệt lọc lớp (3) — hỏi 11.8-17 |
| 6 | Hồ sơ lớp · cột Theo dõi "Xử lý vi phạm" | đổi trang hồ sơ HV | tab Ý thức của lớp, mở hàng em (2) |
| 7 | Hồ sơ lớp · cột Theo dõi "Nhập điểm L, R · MT1" | đổi trang Test | cuộn + mở lưới đúng lượt / ô (1) |
| 8 | Lưới MT · "xếp ở panel Lộ trình" | đổi trang hồ sơ HV + panel | QL: hộp nhỏ chọn tuần; GV: chữ (2) |
| 9 | Hồ sơ lớp · cột Đợt "MT3" | đổi trang hồ sơ HV | mở rộng hàng: 4 kỹ năng + nhận xét (2) |
| 10 | Hồ sơ HV · "Ghi nhận 1 vi phạm" | hiện **3 chỗ** một màn | 2 chỗ (thanh đầu hồ sơ + nút trên dòng) |
| 11 | Lịch Test · "Mở lưới đầy đủ ↗" | đổi trang `/nhap-diem` | "Cả lớp · mọi cột" tại chỗ (1) |
| 12 | Công việc · panel nhập điểm · ↗ | rời sang Test | bỏ link, "Cả lớp" tại chỗ (1) |
Giữ (đúng bậc): ⋯ hàng lớp "Nhập điểm" ở Học viên & Lớp (lưới không có trên trang — panel), "Xác nhận xử lý" (form 4–6 ô — khung phải), tên em → hồ sơ (xem). Cô Linh ước bớt ~6–10 lần đổi trang mỗi buổi.

**11.1d Thi ↔ Test [ĐÃ CHỐT — nghiệp vụ; ĐÃ KIỂM — đếm bằng script] (V2A-03)**
- **Vấn đề:** 549 chuỗi hiện ra có chữ "thi": **~295 dùng "thi" cho Test** (web 118 · shared 59 · Hướng dẫn 33 · máy chủ / thông báo / tên việc 85), ~208 đúng thi thật. Nhiều nhất: "Tuần thi" 79 · "Đã thi" (MT) 46 · "phần thi" 43 · "Không dự thi" 23 · "Dời lịch thi" (MT) 20. "Đã thi" và "Lịch thi" mỗi chữ **hai nghĩa** trên cùng màn (chip Kế hoạch Test vs "Đã thi · chờ KQ"; góc Lịch thi vs loại thẻ duyệt "Lịch thi" = dời MT). Danh sách đủ tệp:dòng: `v2a-thi-loai.tsv` của đợt rà.
- **Mâu thuẫn nguồn đã chốt (phải sửa nguồn, không chỉ web):** `THUAT_NGU_2026-10-01.md` C-028 "Đã thi", C-035 "Không dự thi", C-036 "Đã huỷ phần thi" (cùng bảng B-014 lại nói Test = gọi chung bài kiểm tra); chữ trong Rulebook §17.7, dòng 762, 818; mockup 4 ô "Đã thi", mockup 5 cột "Tuần thi". Theo 9.1-1 (quyết định mới trái nguồn cũ → sửa nguồn) — **chỉ đổi chữ, không đổi luật**.
- **Phương án [ĐỀ XUẤT]:** một luật **Thi = thi thật; còn lại = Test** (danh từ), **"làm bài"** (động từ / trạng thái): "Tuần Test", "Đã làm bài", "Không làm bài", "Huỷ kỹ năng", "Dời lịch Test", "Test lại", "Ghi chú lịch Test"; tab Phân tích "Kết quả thi" (gồm Mock + thi thật) → **"Kết quả Test"** (tab con Mock Test · Thi thật). Giữ: Dự kiến thi, Ngày thi, Kết quả thi thật, Sắp thi, Lịch thi (góc HV & Lớp). Một từ điển chữ + **phép kiểm chặn** chữ cũ trong tệp Test.
- **Trình tự:** PR tài liệu (bảng thuật ngữ, chữ Rulebook, mockup 4 / 5) → **CHU-THI** ở GĐ1 (chỉ chữ, không mockup) gồm cả EN, Hướng dẫn, tệp xuất. **Hỏi:** 11.8-5.

**11.1e Ảnh 5 — lỗi lọt qua kiểm [ĐÃ KIỂM bằng mã; bấm thử: chưa] (PTA)**
- **Đã xác nhận:** `lamTaiCho` có `case 'yt_xem': return laLo(it)` (dòng 50, OV-13d) **trước** `case 'yt_xem': case 'phoi_hop'` (dòng 56, OV-13b) → với việc **"Ghi nhận n vi phạm mới · <em>"** của **một em**, nhánh "làm tại chỗ" của OV-13b **không bao giờ chạy**: bấm việc ở Công việc / Học viên & Lớp **đổi trang** sang hồ sơ lớp (`&loc=moi`) thay vì mở tại chỗ; việc này cũng bị loại khỏi hàng đợi "việc tiếp" (`HoTroHocVienTab.tsx:175`). Trong `PanelViec` khối "Ghi nhận" (dòng 124) là **mã chết**; nếu sau này ai sửa nửa vời `lamTaiCho`, việc "Ghi nhận" sẽ mở nhầm panel **"Xác nhận xử lý"** (dòng 105).
- **Gốc:** hai PR song song (OV-13d 11:07, OV-13b 11:11 ngày 15/10) cùng sửa một `switch`, git gộp không báo xung đột; `tsc` không bắt `case` trùng; esbuild chỉ cảnh báo ở terminal, không làm `npm run check` đỏ — đúng nguyên nhân N3 (PR chia theo tệp, song song). Quét cả 830 tệp `.ts/.tsx`: chỉ có 2 cảnh báo này.
- **Cần kiểm chứng:** bấm thử trên demo (GV 7, Công việc, việc "Ghi nhận … vi phạm mới" một em) để thấy đổi trang — làm ở session code khi sửa.
- **Sửa [ĐỀ XUẤT, GĐ1 CV-LOI]:** theo ý OV-13b — "Ghi nhận" một em làm tại chỗ (nếu II.2 làm lại Ý thức thì dùng thành phần mới); gỡ `case` trùng; thêm phép kiểm: **cảnh báo esbuild = lỗi** trong `npm run check` (+ luật `no-duplicate-case`). **Hỏi:** 11.8-18.

### 11.2 Học viên & Lớp (I.2–I.6)
- **Góc "Cần làm" (I.3) [ĐỀ XUẤT: BỎ] (V2A-04):** bảng 5 cột — "Học viên" mà 8/10 hàng là "Cả lớp · n em", có ô trống; "Việc" chip xám; "Người giữ" (sai thuật ngữ, đúng là "Người phụ trách"); "Hạn" 2 dòng; nút "Mở" không nói làm gì; đầu nhóm đếm theo trang (sai); GV thấy cả "Chờ duyệt", "Thiếu thông tin" không phải việc của GV; QT Monbay 181 việc trong khi Công việc cùng chi nhánh 84 (cùng nguồn `/my-work`, khác cách đếm). **Mục đích thật:** "lớp nào tồn việc gì, của ai, trễ bao lâu" — chính là **hàng lớp**.
  Thay thế: chip "⚠ n quá hạn" trên hàng lớp → **dải việc của lớp mở ngay dưới hàng** (mỗi việc một dòng 40 px: Việc · Người phụ trách · Hạn · nút động từ → cùng panel Công việc; cùng hàm đếm) · "Thiếu TT n" → Sửa cả lớp đúng cột · "n chờ duyệt" → nhóm Chờ duyệt ở Tổng quan lọc lớp · **TVV** (không có trang Công việc) → khối việc ở **Tổng quan TVV** (trùng 9.2-13). Bốn tình huống thật đều ít bước hơn hoặc bằng (1 / 1 / 1+điền / 1 so với 1–3 / 3 / 2+n / 3). Phương án dự phòng nếu chủ SP muốn giữ: bảng phẳng "Việc · Học viên / Lớp · Người phụ trách · Hạn · [nút động từ]", đếm toàn bộ, bỏ lọc phụ của GV.
- **Ô tick xuất Excel (I.4) [CHƯA CHỐT → khuyến nghị phương án 3] (V2A-05):** đo: ô tick chỉ làm bảng cao thêm **0,5 %** (hàng dày là do ô 3–4 dòng — 11.1a) nhưng chiếm 12 % cột tên + 34 điều khiển / lớp; **lỗi luồng:** "Chọn tất cả" chỉ lấy lớp **đang mở ở trang này** → "xuất cả chi nhánh bỏ 2 em" ≈ 28 bấm qua 2 trang; đổi bộ lọc mất hết chọn. A (bỏ, xuất theo phạm vi) thua khi cần bớt em (phải sửa Excel); B (giữ chọn, gọn) giữ lỗi "chỉ lớp đang mở". **Phương án 3:** bỏ ô tick khỏi bảng; panel Xuất có khối **"Học viên · n"** (gom theo lớp, chọn sẵn hết, ô tìm, tick bỏ em, nút "Xuất 49 HV") — một chỗ chọn cho Tất cả / Đang SOS / Lịch thi / TVV-CX: 5 em SOS 3 lớp 10–11 → 8 bấm; cả chi nhánh bỏ 2 em ≈ 28 → 6. "Chọn nhiều" ở hồ sơ lớp (thao tác hàng loạt) giữ.
- **Lịch thi (I.6.1) [ĐỀ XUẤT] (V2A-06):** nay 4 nút Kết luận + 1 ô ghi chú mỗi hàng (34 nút / 10 hàng), 12 nút tháng (mockup vẽ một ô chọn), 41/45 em "chưa có dự kiến thi" trộn chung bảng, không nhóm theo trạng thái; **dải đếm cộng sai** (chọn 11/2026: "1 HV" nhưng "1 giữ tháng + 1 cần xác nhận"). Đề xuất: lọc **Tháng dự kiến [10/2026] → [11/2026]** (mặc định tháng này → tháng sau); **nhóm theo trạng thái** (Chưa chốt ngày — đã tới tháng · Đã chốt ngày · Dự kiến · Chưa có tháng thi — gập); **hàng một dòng ~44 px**: Học viên (link hồ sơ ↗, dòng phụ lớp · TVV) · Gần nhất "MT3 · 6.0 / 6.5 ✗" · Target · **Lịch thi** (chip trạng thái) · Ghi chú (sửa tại chỗ) · **[Chốt ngày] [Dời tháng]**; **mở rộng dưới hàng**: 4 kỹ năng MT gần nhất so kỳ vọng · các Test sắp tới · PA "đến lúc thi" · GVCN · lịch sử lịch thi (ai đặt / chốt, lúc nào) · ghi chú cũ. 375 thẻ 2 dòng. Nút / hàng 4 → 2; 10 hàng ≈ 1 màn.
- **"Ghi chú họp" → "Ghi chú" + "Cần xác nhận" (I.6.2) [ĐÃ KIỂM] (V2A-07):** đổi tên ở đầu cột, ô nhập, cột tệp xuất, Lịch sử HV (đang gọi "Ghi chú lịch thi" — trùng tên ghi chú lịch **MT**). **"Cần xác nhận"** = một trong 4 kết luận buổi họp, ý định (mockup 5) là "đã bàn, còn chờ phụ huynh / HV xác nhận"; nhưng mã cho thấy nó **không đổi lịch, không sinh việc, không ai phụ trách, không hạn** (đã chốt 19/10 "không tự tạo việc"), chỉ hiện ở dải đếm → **về đầu ra giống hệt "chưa có kết luận"**; lý do chờ nằm ở ghi chú. Đề xuất: bỏ hai nút "Cần xác nhận" và "Giữ tháng"; trạng thái **tự suy** (Dự kiến · Chưa chốt ngày · Đã chốt ngày); lý do ghi vào "Ghi chú"; dữ liệu cũ giữ trong DB, không migrate. (Nếu chủ SP muốn giữ "đã bàn, còn treo": dòng phụ "đã bàn 14/10" tự ghi khi sửa Ghi chú — không thêm nút.)
- **Tháng / ngày thi (I.6.3) [ĐÃ CHỐT — nghiệp vụ; ĐÃ KIỂM mã] (V2A-08):**
  - DB đã đủ 3 mức: tháng (`exam_month`) · tuần (`exam_period_id`) · ngày (`exam_date`). Demo: 101 lộ trình chưa có gì · 16 chỉ tháng · 8 có tuần không ngày · 1 có ngày.
  - **LỖI P1 [ĐÃ KIỂM — mã; PTA kiểm lại `tongKetLoTrinh.ts:118-119`]:** khi chưa có ngày, máy lấy **ngày cuối tháng dự kiến làm ngày thi** (và Chủ nhật của tuần dự kiến) → hết tháng mà chưa ai chốt ngày, em tự thành **"Đã thi · chờ KQ"**, hàng tô màu "đã thi", GVCN nhận việc "Cập nhật kết quả thi thật" **có hạn**, quá hạn đỏ — trái luật vừa chốt. Từ **01/12** mọi em dự kiến 11/2026 chưa có ngày sẽ dính. Kèm: ô "Chốt ngày" ở Lịch thi **chặn ngày đã qua** (em đã thi thật không ghi được); hồ sơ HV thi 17/09 (còn 3 ngày) ghi "Sắp tới: Chưa có mốc"; "Thi thật · chưa có ngày" hiện cho em **chưa có cả tháng**; một dữ liệu 4 dạng chữ ("17/09/2026", "NOV 2026", "11/2026", "W2 JAN 2027").
  - **Đề xuất:** **một hàm `trangThaiLichThi`** dùng chung cho hàng HV, đầu hồ sơ, Tổng quan, Công việc, Lịch thi, tệp xuất: chưa có · dự kiến · **B chưa chốt ngày** (có tháng, chưa ngày, tháng dự kiến ≤ tháng này) · **A đã chốt ngày** · đã thi chờ KQ (**chỉ** khi có ngày và ngày đã qua) · …
    Hiển thị (không chỉ bằng màu, không lẫn màu SOS / kết quả): **A** chip "Thi 21/11 · còn 9 ngày" họ màu "đã thi" (theo gợi ý chủ SP) + biểu tượng lịch ✓ · **B** chip "Chưa chốt ngày thi · 11/2026" **viền đứt, trung tính** + ◌ · Dự kiến chữ thường · Chưa có chữ mờ. Đặt ở: hàng HV (gộp "Dự kiến thi" + "Sắp tới" thành cột **"Thi thật"**), **đầu dòng 2 thanh thông tin hồ sơ HV**, nhóm "Lịch thi thật · n chưa chốt ngày" trong "Cần bạn quyết" (Tổng quan QL), Tổng quan TVV, Công việc.
    **Việc "Chốt ngày thi"**: sinh khi B đúng (tính khi đọc — không migrate, không cron, như "Điền Target"); **không hạn**, không vào số quá hạn / chuông; tắt khi có ngày · dời tháng · có kết quả / "Không thi" · em tạm dừng / lưu trữ; làm tại chỗ bằng **hộp nhỏ neo tại chip** [ngày] · [Dời sang 12/2026] · Ghi chú (2 bấm); cho chọn ngày đã qua (hỏi một dòng "Em đã thi 28/11?" → vào luồng Đã thi).
  - **PR máy chủ LT-SV (GĐ1):** hàm + phép kiểm bảng trạng thái · bỏ nhánh "tháng → ngày thi" ở `ngayThiSauThi`, cận dưới `thiThat.ts:132-133`, `profile.ts:802` (kiểm trước bằng lệnh chỉ đọc: lộ trình nào đang "Đã thi" chỉ nhờ tháng) · nhóm việc `chot_ngay_thi` · "Sắp thi" TVV tách A / B · nhận ngày đã qua · "Sắp tới" hồ sơ HV gồm kỳ thi thật · một hàm nhãn ("11/2026", "W2 JAN/2027", "21/11/2026").
  - **Hỏi:** 11.8-2, 11.8-3.
- **Cụm chữ khác (I.2) (V2A-02):** "Mọi lúc ✕" → bỏ (khoảng có ✕ riêng) · "Chọn khoảng" → bỏ · "Người giữ" → "Người phụ trách" · "Lịch hiện tại" → "Lịch thi" · "Gồm HV chưa có dự kiến thi · 41" → nhóm gập "Chưa có tháng thi · 41" · "Chọn tất cả HV đang hiện ở trang này" → bỏ · "Lọc trong danh sách này…" → "Tìm học viên, lớp" · "Kết quả đến nay" (Đang SOS) → "Kết quả PA" · "Loại thi" (tab con) → "Loại" · nhãn "Phạm vi: / Loại lớp: / Xếp:" trong ô chọn → bỏ tiền tố (M0). Bảng đủ ở V2A-02.

### 11.3 Hồ sơ lớp (II.1–II.3)
- **Nhập điểm MT tại chỗ [ĐÃ CHỐT workflow; ĐÃ KIỂM hiện trạng] (V2B-3):** nay nút "Nhập điểm" mở **panel toàn màn** chứa **bản thứ hai** của lưới đang mở sẵn cuối trang (lưới vẽ dưới **mọi** tab, +~2 200 px), cả hai mở **MT3** dù 29/32 em chưa tới tuần; "Chỉ ô còn trống" tắt; lưới cuối trang không đặt con trỏ. GV 7 nhập bài L thiếu: **4 bấm + 1 panel + phải nhớ lượt nào quá hạn**.
  Đề xuất trong khuôn đã chốt: (1) lưới **gập** thành một thanh "Điểm Mock Test · MT1 ⚠ 4 ô quá hạn · MT3 2 ô tuần này ›" (đếm ô **đã tới hạn**, theo vai) — chỉ ở tab Học viên · (2) "Nhập điểm" (và chip "⚠ n ô quá hạn chấm" thay "78 bài chờ chấm") → mở + cuộn để thanh công cụ lưới nằm ngay dưới đầu trang · (3) chọn sẵn lượt có **ô quá hạn của người xem** sớm nhất · (4) bật sẵn "Chỉ ô còn trống" (= ô **tôi** nhập được) · (5) mở luôn hộp nhập ô trống đầu, Enter = "Lưu · em tiếp ›" (đã có) · (6) công cụ một hàng **ngoài** khung bảng · (7) lưu từng ô giữ luật hiện tại (đang lưu / đã lưu / lỗi, không mất chữ) · (8) em chưa có lịch lượt này gom một dòng; **QL có "Xếp lịch MT3"** hộp nhỏ chọn tuần (GV chỉ thấy chữ — Rulebook §20.9) · (9) URL `?diem=mt:1` → Quay lại đúng lượt, đúng chỗ · (10) 375 dùng `MotKyNang` một kỹ năng · (11) panel `PanelNhapDiemLop` **chỉ còn** cho lối vào **ngoài** hồ sơ lớp (⋯ hàng lớp, Công việc). → **1 bấm**; trang tab Học viên 4 800 → ~2 650 px.
- **Từng bảng của Hồ sơ lớp (V2B-4):** 4 tầng điều hướng (tab → cách xem → tab con → 375 "Theo xử lý / Theo vi phạm"); trang 3 000–5 400 px (375: ~10 400 px).
  **Tổng hợp** 12 cột, hàng 46–71 px, "Thiếu n" ở 30/33 em, cột ⋯ 154 px cho nút 28 px, "Theo dõi" đổi trang → `Bang` một dòng / em: Học viên (+ chip SOS) · Target · Dự kiến thi · MT gần nhất · OVR L R W S (mốc cũ mở rộng hàng) · Việc tiếp (mở tại chỗ) · ⋯ · **Góp ý hàng tuần** 33 em × 4 ô = 132 ô trống → GV chỉ có ô môn mình, cột khác chỉ đọc gập · **Cần hỗ trợ** tiêu đề IN HOA 11 px bị phân trang chen giữa, thẻ em giống nhau → `Bang` có hàng nhóm theo em · **Kết quả đầu ra 1 đợt** ở lớp FT là kết quả lớp **trước** (BE) → đổi tên (hỏi) · **Phân tích lớp** "6/11" không chú thích → thêm "đạt / có điểm".
- **Ý thức & Phối hợp (II.2) [ĐỀ XUẤT phương án A] (V2B-6):** nay hai khung (trái: em theo 5 nhóm IN HOA; phải **mặc định** dòng thời gian **45 vi phạm** cả lớp, phần lớn đã xử lý) + Phối hợp ở **tab con khác**; khung trái không có nút; "Quá hạn" là chip nền (trái DESIGN.md "quá hạn chỉ chữ + ⚠"); 375 tab "Phối hợp S…" **bị cắt**; Rulebook §19 nói hồ sơ lớp **mặc định theo học sinh** — web mặc định theo vi phạm. Tải nhận thức **6/8 trượt**.
  **A — một bảng theo em, việc ngay trên hàng, mở rộng tại chỗ:** lọc `Cần làm · 8 em | Tất cả em · 33 | Nhật ký vi phạm` (mặc định Cần làm, xếp quá hạn → bắt buộc → hôm nay → chờ QL → mới → phối hợp); cột **Học viên · Việc cần làm · Hạn · Vi phạm 2 tuần · Thang · Phối hợp SOS · [một nút động từ] ▸**; ▸ mở 3 cột ngay dưới hàng: Thang (+ Xác nhận xử lý · Đề xuất QL duyệt) · Vi phạm chưa xong (+ "n đã xử lý ▾") · Việc phối hợp (Xác nhận / Bỏ ▾ · Sửa · Đưa lại Cần xử lý · + Thêm việc). Quá hạn = chữ cam + ⚠; một nút chính / hàng; GVBM không có nút xử lý; "Chọn nhiều" giữ; 375 thẻ em + chi tiết toàn màn; **bỏ tab con**.
  So B (giữ hai khung, sửa) và C (giữ hai tab con, gọn từng tab): A thắng ở xử lý quá hạn **5 → 3 bấm**, xác nhận phối hợp **4 bấm + dò ~1 700 px → 3 bấm, 0 dò**, xem nhanh một em **3–4 bấm + đổi trang → 1–2**, phần Ý thức **~2 800 → ~700 px**, đúng §19. Giữ nguyên nghiệp vụ (thang 6 bậc, Ghi nhận biến mất khi bắt buộc, WL 3 / ngoài thang qua QL duyệt, hạn 5 ngày, phối hợp không phải vi phạm, xác nhận / bỏ kèm lý do).
- **Phối hợp SOS — nhóm giống nhau (II.3) (V2B-7):** 6 thẻ cùng nền, cùng viền; câu "Học thuật theo dõi ở bảng kỹ năng" **lặp mọi thẻ**; mức SOS chỉ là chữ (không `ChipSos`); **9 nút "Xác nhận" màu nhấn**; việc xong cùng cỡ việc chờ. Luật thị giác cho mọi "nhóm lặp" (toàn web): **cấp em** tên 15 / 700 + `ChipSos` + một dòng "MT2 · W2 SEP", xếp SOS cao trước · **cấp việc** thụt 16 px, 14 / 400, nền hàng con, trạng thái **ký hiệu + chữ** ở cột cố định ("○ Cần làm" · "✓ Xong 13/09 · Trần Ngọc Hà" · "– Đã bỏ: lý do") · **chỉ việc chờ đầu tiên của em có nút chính**, việc khác nút viền · việc xong gập "✓ 1 việc đã xong ▾" · bỏ câu lặp (đưa vào ⓘ) và chip "Đang làm" (đã có "1/2"). Phân cấp bằng **cấu trúc + chữ + một màu** (không tô nền thẻ theo mức — sẽ thành nghĩa màu thứ sáu). ~1 700 → ~450 px. Cùng gốc ở: Cần hỗ trợ, Lịch Test khối 1, Kế hoạch Test, Tổng quan "Cần bạn quyết", nhóm việc Công việc.

### 11.4 Hồ sơ học viên (III.1) [ĐỀ XUẤT] (V2B-8)
- **Vấn đề [ĐÃ KIỂM]:** một việc "Ghi nhận 1 vi phạm mới" hiện **3 chỗ** trên một màn (thanh "VIỆC CỦA TÔI" đầu hồ sơ · thanh trong tab · nút trên dòng); khối Thang có **nút chính "Xác nhận xử lý"** trong khi việc thật là Ghi nhận (hai nút chính tranh nhau); ô "Ý thức · WL 1" ở dải 4 ô lặp Thang; hai tab con; chữ "XỬ LÝ" in hoa 11 px; 375 ~3 200 px.
- **Đề xuất — cùng ngôn ngữ với 11.3 A, mật độ một em (mở sẵn, không phải mở rộng):** Thang một dòng → hai cột **Vi phạm chưa xong | Phối hợp SOS** (xếp chồng ở 375) → nút **theo việc** (bắt buộc / quá hạn: "Xác nhận xử lý" là nút chính; chỉ có vi phạm mới: "Ghi nhận" trên dòng là chính, "Xác nhận xử lý" viền) → **Nhật ký · n ▾** gập (vi phạm + lần xử lý + việc phối hợp, lọc). Việc hiện tại chỉ ở thanh đầu hồ sơ + nút trên dòng (bỏ thanh trong tab); bỏ hai tab con; tiêu đề không in hoa. Thang, dòng vi phạm, dòng phối hợp, nhãn trạng thái **cùng component** với hàng em mở rộng ở hồ sơ lớp — khác mật độ: lớp = một hàng / em + mở rộng; HV = mở sẵn. Thấy đủ tình trạng **0 bấm** (nay 1–2); một việc một chỗ.
- **Trình tự:** màn mới **M3b — Hồ sơ HV · Ý thức** (cùng mockup với 11.3 A).

### 11.5 Phân loại theo yêu cầu IV của chủ SP
**1. Đã chốt:** bộ lọc thời gian chỉ "Tuần bắt đầu → Tuần kết thúc" · "Tuần thi của kết quả" → "Thời gian" · Thi ↔ Test · "Ghi chú họp" → "Ghi chú" · luật tháng thi / ngày thi + việc "chốt ngày thi" không hạn · lưới Điểm MT gập mặc định · nút Nhập điểm cuộn + mở lưới, không panel phải · sửa triệt để căn bảng toàn hệ thống · overhaul các khu được chỉ định (Cần làm, Lịch thi, mọi bảng Hồ sơ lớp, Ý thức / Phối hợp lớp + HV).
**2. Đang nghiên cứu, chưa chốt (đã có khuyến nghị):** ô tick xuất Excel → phương án 3 (11.2) · cột bảng Cần làm → khuyến nghị bỏ góc, có phương án dự phòng (11.2) · hiển thị Sắp thi A / B (11.2) · bố cục Ý thức / Phối hợp → A (11.3, 11.4) · thiết kế lại bảng Hồ sơ lớp / HV → hệ thống `Bang` + từng bảng (11.1a, 11.3). Tất cả **cần mockup** trước khi code, trừ BANG-1 (đã có mockup 6 khung 3).
**3. Cần xác minh:**
| Việc | Trạng thái |
|---|---|
| Ý nghĩa "Cần xác nhận" | **Đã xác minh** bằng mã + đặc tả 19/10 + mockup 5 + DB demo: "đã bàn, còn chờ" nhưng đầu ra = chưa có kết luận (11.2). Bỏ hay giữ: chủ SP quyết (11.8-6) |
| Lỗi ảnh 5 | **Đã xác nhận bằng mã** (11.1e); còn bấm thử trên web |
| Gốc bảng xô lệch | **Đã xác minh** bằng đo DOM + mã + `git show` trước / sau OV-15a (11.1a); 3 bảng còn nghi (`PhanTichGiaoVien`, `BangDiemLopThuong`, `CatalogAdmin`) đo khi chuyển |
| Bộ lọc thời gian đặc thù | **Đã kiểm kê** 14 chỗ (11.1b): Lịch thi (tháng — nghiệp vụ), ô nhập ngày / tuần (không phải bộ lọc), cửa sổ cố định 7 / 30 / 60 ngày, 6 tuần (định nghĩa chỉ số); Báo cáo tháng in ra dùng khoảng tuần + nhãn tháng tự ghi |
| "Tháng = đã thi" trên dữ liệu thật | [GIẢ THUYẾT trên web] — kiểm bằng demo riêng đặt ngày 01/12/2026, hoặc lệnh chỉ đọc trên DB thật trước khi sửa (LT-SV) |

### 11.6 Mục cũ hết hiệu lực / đổi
- **Hết hiệu lực:** 7.5 "bỏ khối Điểm MT cuối trang" · 9.2-17 · bảng GĐ2 dòng M3 "bỏ khối lưới" → thay bằng 11.3 (đã đánh dấu tại chỗ).
- **Đổi:** C29 (bộ chọn 4 kiểu) → `Khoảng tuần` · C06 "số căn giữa" hiện thực bằng `index.css:267` → bỏ luật này, căn theo kiểu cột (chờ 11.8-4) · 9.2-14 bỏ Cần làm → giữ + lối thay thế (11.8-8) · bảng thuật ngữ 01/10 C-028 / C-035 / C-036 + chữ Rulebook + mockup 4 / 5 → sửa theo luật Thi ↔ Test · mockup 5 khung 1 (Lịch thi 4 nút Kết luận) và khung 2 (danh sách có cột tick) → sửa theo 11.2 · luật CLAUDE.md "dùng lại component sẵn có / bố cục đã khoá" **không áp** cho bảng và ô điểm (chủ SP cho phép thay — ghi vào QT-UX).

### 11.7 Cập nhật kế hoạch (mục 8)
- **GĐ0 · QT-UX** thêm: luật "Thi / Test", "kiểu cột", "không giữ component cũ khi nó là gốc lỗi"; **PR tài liệu** sửa bảng thuật ngữ, chữ Rulebook, mockup 4 / 5 / 6 cho khớp quyết định vòng 1–2. **CONG-CU** thêm `do-bang` (đo lệch bảng) + quét cảnh báo esbuild.
- **GĐ1 (trước deploy)** thêm / mở rộng:
  - **SL1** + bỏ 3 kiểu thời gian thừa trong `BoChonThoiGian` (chỉ còn Từ tuần – Đến tuần) + đọc link cũ `kieu=thang` đúng tháng (sửa gốc P0) · `luotMacDinh` theo ô quá hạn của người xem + chip đếm ô **đã tới hạn** · dải đếm Lịch thi cộng sai.
  - **LT-SV (mới, máy chủ, tự merge được):** `trangThaiLichThi` + bỏ "tháng = ngày thi" + việc `chot_ngay_thi` không hạn + "Sắp tới" hồ sơ HV + nhận ngày đã qua.
  - **CHU-THI (mới, chỉ chữ):** ~295 chuỗi Thi → Test + "Thời gian" + "Ghi chú" + từ điển + phép kiểm; sau PR tài liệu.
  - **CV-LOI** + sửa `case` trùng `yt_xem` (Ghi nhận tại chỗ) + `npm run check` đỏ khi có cảnh báo esbuild.
  - **BANG-0 + BANG-1** (nếu chủ SP đồng ý 11.8-1): nền bảng + lưới điểm 6 lối vào; duyệt bảng mẫu + ảnh cặp.
  - Hệ quả: GĐ1 dài hơn → deploy muộn hơn; đổi lại bản chính không mang lỗi "tháng = đã thi" (từ 01/12) và lưới điểm lệch.
- **NEN** thêm `ODiem` + thang chữ trong bảng (cùng BANG-0).
- **GĐ2:** **M0** + `Khoảng tuần` (mockup) · **M3 Hồ sơ lớp**: lưới gập + Nhập điểm tại chỗ + `Bang` cho mọi bảng + Ý thức A + 12 chỗ "làm tại đó" · **M3b (mới) Hồ sơ HV · Ý thức** · **M4**: bỏ Cần làm + hàng lớp mở dải việc + Lịch thi mới + chip A / B + cột "Thi thật" + panel Xuất chọn em · **M5**: Lịch Test dáng một tuần, gộp 2 panel xuất · **M7**: Tổng quan TVV có khối việc (gồm Chốt ngày thi).
- **Mockup mới cần (soạn sau khi chủ SP gửi xong góp ý, 1440 tối + 375 sáng, đủ trạng thái):** bảng mẫu `Bang` / `ODiem` · `Khoảng tuần` · Lịch thi (sửa mockup 5) + chip A / B + hộp Chốt ngày · panel Xuất có khối chọn em · hàng lớp mở dải việc · Hồ sơ lớp (tab Học viên lưới gập, Ý thức A) · Hồ sơ HV Ý thức.

### 11.8 Câu hỏi vòng 2 (hỏi gộp cùng 10.7 + 9.2 khi chủ SP gửi xong góp ý; quan trọng trước, mỗi câu có khuyến nghị)
1. **Sửa lệch bảng trước deploy:** đưa BANG-0 + BANG-1 (nền bảng + lưới điểm, ~13 tệp, không đổi bố cục, theo mockup 6 khung 3) vào GĐ1? — **Có.** (Nếu buộc deploy sớm: vá tạm `index.css:267`, ghi rõ tạm.)
2. **"Tháng = đã thi" + việc Chốt ngày thi (LT-SV) ở GĐ1 trước deploy?** — **Có** (không thì từ 01/12 em chỉ có tháng 11 bị đánh "Đã thi", GVCN nhận việc sai).
3. **Năm điểm luật lịch thi:** (a) đã có **tuần** chưa có ngày = "Chưa chốt ngày"? — **Có**, chip "W2 JAN · chưa chốt ngày" · (b) "đến tháng" = mùng 1 tháng dự kiến? — **Có**, không nhắc sớm hơn · (c) ai làm việc Chốt ngày thi? — **TVV phụ trách em; không có TVV → QL chi nhánh; GVCN chỉ thấy chip** · (d) dời tháng? — **mặc định tháng sau, cho chọn tháng khác** · (e) lớp thường có trạng thái B + việc? — **Chỉ Fast Track; lớp thường chỉ hiện chip.**
4. **Căn cột điểm:** C06 "số căn giữa" (18/10) và mockup 6 khung 3 (19/10) "căn trái, ký hiệu trước số" khác nhau. — **Căn giữa mọi cột số / điểm, lấy từ mockup 6 phần ký hiệu trước số + ô rộng cố định**; tiêu đề cùng căn.
5. **Chữ cho Test:** "Tuần Test", "Đã làm bài", "Không làm bài", "Huỷ kỹ năng", "Dời lịch Test", "Test lại", tab "Kết quả Test"; sửa luôn bảng thuật ngữ 01/10, chữ Rulebook, mockup 4 / 5? — **Có.**
6. **Lịch thi bỏ "Giữ tháng" + "Cần xác nhận"**, trạng thái tự suy + 2 nút "Chốt ngày" · "Dời tháng", lý do ghi vào Ghi chú, dữ liệu cũ giữ? — **Có.**
7. **Lịch thi lọc theo tháng** (ngoại lệ của luật "chỉ tuần"): "Tháng dự kiến [10/2026] → [11/2026]", mặc định tháng này → tháng sau, nhóm theo trạng thái? — **Có.**
8. **Bỏ góc "Cần làm"**, thay bằng chip "⚠ n quá hạn" mở dải việc dưới hàng lớp; việc của TVV lên Tổng quan TVV? — **Có.**
9. **Xuất Excel — phương án 3** (bỏ ô tick khỏi bảng, chọn / bỏ em trong panel Xuất, áp mọi danh sách)? — **Có.**
10. **Mặc định khoảng thời gian** từng trang (11.1b) + cửa sổ cố định 7 / 30 / 60 ngày giữ nguyên + Báo cáo tự ghi "(tháng 09/2026)" khi khoảng trùng đủ tuần của tháng? — **Đồng ý cả gói.**
11. **Ý thức & Phối hợp lớp — phương án A** (một bảng theo em, mặc định "Cần làm", dòng thời gian thành "Nhật ký" gập, bỏ hai tab con — chỉ đổi cách trình bày, Rulebook §19 không đổi)? — **A.**
12. **Hồ sơ HV:** bỏ thanh việc trong tab Ý thức (giữ thanh đầu hồ sơ), bỏ hai tab con, hai cột Vi phạm chưa xong | Phối hợp, Nhật ký gập? — **Có.**
13. **Duyệt hệ thống bảng một lần:** chủ SP duyệt bảng mẫu `/dev/thanh-phan` + ảnh cặp 3 bảng (lưới MT, Tổng hợp, Học viên & Lớp); PR chuyển bảng sau chỉ cần ảnh cặp? — **Có.**
14. **Ô điểm:** W1 / W2 có ✓ / ✗ như L / R / S (mockup 6)? Chữ phụ một dòng, ưu tiên "thiếu nhận xét" > "vắng" > "n câu"; Học viên & Lớp bỏ dòng "W1 · W2" dưới W? — **Có / có.**
15. **Nhập điểm:** thanh gập chỉ ở tab Học viên? Bấm Nhập điểm mở luôn hộp nhập ô trống đầu? QL xếp lịch MT ngay tại lưới bằng hộp nhỏ? — **Có / có / có.**
16. **Phối hợp SOS:** một nút chính / em, việc xong gập, bỏ câu "Học thuật theo dõi ở bảng kỹ năng" và chip "Đang làm"? — **Có.**
17. **Nhỏ (Hồ sơ lớp):** chip "8 chờ duyệt" mở khung phải Chờ duyệt lọc lớp tại chỗ · Góp ý tuần: GV chỉ ô môn mình · lớp FT đổi "Kết quả đầu ra 1 đợt" → "Kết quả lớp trước"? — **Có / có / có.**
18. **Ảnh 5:** sửa ở GĐ1 theo ý OV-13b (Ghi nhận một em làm tại chỗ) + cảnh báo esbuild làm `npm run check` đỏ? — **Có.**

---

## Phụ lục

### A. Báo cáo chi tiết từng phần (thư mục `2026-10-20-danh-gia-ux/`)
| Tệp | Nội dung | Điểm |
|---|---|---|
| [`a1-khung-tong-quan.md`](2026-10-20-danh-gia-ux/a1-khung-tong-quan.md) | thanh trên, menu, tìm, thông báo, Hướng dẫn, Hồ sơ cá nhân, Tổng quan mọi vai + mọi panel mở từ Tổng quan | 23/40 · 26 mã |
| [`a2-cong-viec.md`](2026-10-20-danh-gia-ux/a2-cong-viec.md) | Công việc mọi vai + ~30 loại panel / hộp làm việc, hàng đợi | 21/40 · 33 mã |
| [`a3-hoc-vien-lop.md`](2026-10-20-danh-gia-ux/a3-hoc-vien-lop.md) | Học viên & Lớp (5 góc), hồ sơ lớp, hồ sơ HV, Case, Lưu trữ | 23/40 · 32 mã |
| [`a4-test.md`](2026-10-20-danh-gia-ux/a4-test.md) | Lịch Test / Chấm Test, Kế hoạch Test, Nhập điểm, Bảng điểm thường, hồ sơ Mock, Chấm Speaking | 23/40 · 28 mã |
| [`a5-phan-tich-tutor-quan-tri.md`](2026-10-20-danh-gia-ux/a5-phan-tich-tutor-quan-tri.md) | Phân tích (6 tab), Báo cáo, Tutor, Quản trị, Hồ sơ GV | 21/40 · 37 mã |
| [`a6-nguyen-nhan-lech-mockup.md`](2026-10-20-danh-gia-ux/a6-nguyen-nhan-lech-mockup.md) | ma trận truy vết mockup → đặc tả → kế hoạch → PR → web; N1–N14; Q1–Q13 | — |
| [`a7-so-lieu-thuat-ngu.md`](2026-10-20-danh-gia-ux/a7-so-lieu-thuat-ngu.md) | bản đồ 23 con số, kiểm kê thuật ngữ, lỗi nền, số request mỗi trang | 8/16 · 29 mã |
| [`b-may-do.md`](2026-10-20-danh-gia-ux/b-may-do.md) | máy dò impeccable, lớp phủ 5 trang, `do-khung` 276 lần đo, đo DOM 41 lần | 10 mã |
| [`v1-nen-chung.md`](2026-10-20-danh-gia-ux/v1-nen-chung.md) · [`v1-tong-quan.md`](2026-10-20-danh-gia-ux/v1-tong-quan.md) | góp ý vòng 1: chữ, màu số điểm, hover, menu · Tổng quan làm lại | mục 10 |
| [`v2a-hoc-vien-lop.md`](2026-10-20-danh-gia-ux/v2a-hoc-vien-lop.md) | góp ý vòng 2 nhóm I: bộ lọc thời gian (14 chỗ), Thi ↔ Test (549 chuỗi), Cần làm, ô tick xuất, Lịch thi, tháng / ngày thi | mục 11 · V2A-01…09 |
| [`v2b-bang-ho-so.md`](2026-10-20-danh-gia-ux/v2b-bang-ho-so.md) | góp ý vòng 2 nhóm II–III: gốc bảng xô lệch (đo DOM 46 trang), ô điểm, Nhập điểm tại chỗ, bảng Hồ sơ lớp, Ý thức / Phối hợp lớp + HV | mục 11 · V1…V9 |

Đường ảnh trong phụ lục (`SCR\anh\…`) là ảnh tạm của đợt rà (1 789 ảnh, không lưu vào repo); ảnh tiêu biểu đã lưu ở mục B.

### B. Ảnh tiêu biểu đã lưu (`2026-10-20-danh-gia-ux/anh/`)
- **Cặp mockup | web:** `cap-01-tong-quan-dau-trang` · `cap-02-tong-quan-tuan-nay` · `cap-03-hoc-vien-lop-tat-ca` · `cap-04-ho-so-lop-ca-trang` · `cap-05-phan-tich-gv` · `cap-06-bao-cao` · `cap-07-cong-viec-gv` · `cap-08-ke-hoach-test` · `cap-09-tutor` · `cap-10-cong-viec-ql`.
- **Tổng quan / khung:** `a1-cho-duyet-10-ma-12-the` (ảnh 1 tái hiện) · `a1-so-dai-bam-khong-mo` · `a1-lop-can-chu-y-tuan-nay` · `a1-cong-tac-nua-trang` · `a1-chuong-de-biet` · `a1-thanh-tren-1280-cat-tutor` · `a1-tong-quan-375`.
- **Công việc:** `a2-panel-nhap-diem-ban-truoc` · `a2-mockup2-khung-truoc` · `a2-mockup2-khung-sau` · `a2-dan-excel-bi-cat` · `a2-ket-qua-pa-mat-ten` · `a2-ql-tu-mo-luoi-gv` · `a2-phan-cong-mo-ca-lop` · `b-lop-toi-day-tran-the`.
- **Học viên & Lớp:** `a3-hang-em-day-thieu-n` · `a3-plus1-giau-qua-han` · `a3-dang-sos-trang-1` · `a3-dang-sos-trang-2` · `a3-can-lam-bang-tat-ca` · `a3-ho-so-lop-luoi-diem-duoi` · `a3-mockup6-dang-sos`.
- **Test:** `a4-lich-test-3-o-luoi-du-cot` · `a4-mockup-ba-khoi-luoi-gon` · `a4-chu-giai-sai-mau` · `a4-panel-chong-hop-lich` · `a4-trang-nhap-diem-theo-tuan` · `a4-panel-nhap-diem-theo-luot`.
- **Phân tích / Tutor:** `a5-theo-thang-chon-09` → `a5-theo-thang-ra-08` · `a5-bao-cao` · `a5-panel-mat-ten-gv` · `a5-tutor-rong`.
- **Vòng 2:** `v2-luoi-mt3-lech-cot` (ảnh 4 tái hiện) ↔ `v2-mockup6-luoi-diem` · `v2-ho-so-lop-y-thuc` · `v2-phoi-hop-sos-the-giong-nhau` · `v2-ho-so-hv-ghi-nhan-3-cho` · `v2-loc-them-tuan-thi-cua-ket-qua` · `v2-can-lam-ca-lop` · `v2-lich-thi-12-nut-thang`. Ảnh tạm của vòng 2 (208 tệp) ở scratchpad phiên `73e605ad-…`, không lưu repo.

### C. Cách đã chạy (để lặp lại ở GĐ4)
Web demo cục bộ (worktree riêng, `npm run seed`, cổng riêng); công cụ chụp Playwright + Edge đăng nhập demo theo vai, cắt lát trang dài, tối đa 3 trình duyệt cùng lúc; chỉ đọc (chặn chữ Lưu / Xác nhận / Duyệt / Xóa / Gửi; agent a1 chặn mọi request ghi).
Mỗi khu vực một agent độc lập (Opus 5.5) theo một brief chung; máy dò chạy riêng, không xem đánh giá thiết kế (đúng luật impeccable critique hai đánh giá độc lập).


