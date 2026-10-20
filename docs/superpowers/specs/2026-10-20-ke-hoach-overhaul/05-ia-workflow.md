# 05 · Information Architecture & Workflow Proposal — khung trang, luồng việc, phương án (BẢN NHÁP · 21/10/2026)

> **Mục đích.** Với mỗi khu lớn: đưa **nhiều phương án** (gồm "giữ + vá"), so bằng **tình huống thật** (bấm · đổi trang · panel phủ · nguy cơ nhầm, theo vai), ưu / nhược, ảnh hưởng nghiệp vụ / quyền, rồi chọn **một phương án ưu tiên + lý do**. Mỗi khu ghi rõ: **ĐÃ CHỐT** (chỉ bàn cách làm) · **PTA tự quyết** (thẩm mỹ / UX) · **cần chủ SP** (mã câu ở 02 mục 5).
> **Cách đọc.** Chủ SP: Tóm tắt → **bảng quyết định mục 0** → mục 8 (hành trình theo vai). PTA Plan / session code: mục 1–7 theo khu; **mục 9** (ảnh hưởng chéo + thứ tự phụ thuộc) khi viết 07; **mục 10** (chỗ tệp này khác bản nháp 02). Dáng thành phần (chữ, màu, khoảng, trạng thái, panel) ở **04**; bằng chứng lỗi ở **03** và phụ lục.
> **Bộ tài liệu.** [`00-muc-luc.md`](00-muc-luc.md) · [`01-feedback-register.md`](01-feedback-register.md) · [`02-conflict-decision-log.md`](02-conflict-decision-log.md) · [`03-ux-ui-audit.md`](03-ux-ui-audit.md) · [`04-design-system.md`](04-design-system.md) · **05 (tệp này)** · [`06-mockup-gap.md`](06-mockup-gap.md) · [`07-pr-plan.md`](07-pr-plan.md) · tài liệu chính [`../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md`](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md) (mục 7, 10.2–10.4, 11.1–11.4, 12.2–12.8) · phụ lục [`../2026-10-20-danh-gia-ux/`](../2026-10-20-danh-gia-ux/) (v1-tong-quan, v2a, v2b, v3a, v3b, **v4a-cong-viec, v4b-nghiep-vu, v4c-vai-tro-phu-web**, a2, a3, a4).
> **Ký hiệu.** MP = master prompt cuối · L1–L4 = 4 luật Phần II · **L5** = lời chủ SP 21/10 (thu hồi / không tăng bậc → QL duyệt kèm lý do) · Q-xx = câu PHẢI HỎI ở 02 mục 5 · X-nn = dòng xung đột ở 02 · FB-x-nn = dòng ở 01 · "bấm" = click / chạm, không tính gõ chữ · "đổi trang" = rời trang đang làm · "phủ" = panel / ngăn đè lên trang · 1440 / 375 = bề rộng màn đo.
> **Trạng thái.** Chỉ đề xuất — không sửa mã, chưa mockup. Theo đúng **12 hướng PTA Plan đã quyết 21/10** (luật 1 thắng v4b Q1 · hạn ngày lưu + 4 · L5 · gỡ R11 · L4 cả MT cũ · việc TVV ở trang đầu vai · "Toàn bộ" chỉ ở Phân tích · bỏ hàng nút tuần · "đang chọn" = nền + vạch trái · gán TVV trước khi bật…). Soạn: agent **d4** (Opus 5.5) cho PTA Plan, 21/10.

---

## Tóm tắt 10 dòng

1. **Một luật IA: "việc CỦA TÔI nằm ở trang đầu của vai"** — GV: Công việc · QL / QT / Admin VP / TVV: Tổng quan · Head tutor: Tutor. "Công việc" của người quản lý đổi nghĩa thành **"Theo dõi & giao việc"** (việc của GV gom theo GV · Vận hành · Hộp duyệt đầy đủ). Trùng 16/21 việc → 0. **Cần chủ SP: Q-A1** (gộp phần "TVV làm ở đâu" của Q-A3).
2. **Một thành phần hàng đợi** (danh sách trái · chi tiết phải — dáng B) dùng cho Tổng quan QL / QT, Công việc GV, Tổng quan TVV. Chờ duyệt là **nhóm đầu**, không hộp riêng (ảnh v4-1 chính là dáng A chạy thật). **Q-A2.**
3. **Dòng việc 3 vùng** (Hạn · Việc + đối tượng · ›), nhóm cố định theo vai, nợ chấm cũ gom một dòng; **một danh sách một kiểu mở**; thang 0–5 + vỏ "Khung việc". Sửa **gốc** hai lỗi ảnh v4-2 (Phân công sai case) và v4-3 (che tiêu đề) — không chỉ ẩn nút.
4. **Chấm Test "theo hạn, một nguồn"** (giữ luật chia khối T15), hộp chấm một mẫu, lưới gọn, **"Tình trạng chấm"** cho QL / QT / Admin; nhập Excel chỉ còn lưới lớp × lượt (đã chốt). Cô Linh ~11 bấm → 1–2; QL tra "ai còn nợ" 3–6 → 1. **Q-C1.**
5. **MT: 12 trạng thái × 30 chuyển**, sửa theo L3 + L4; **một hàm "-"** cho mọi lối; **một hộp một đợt**; Huỷ điểm có **Khôi phục**; một bộ chữ (Dời lịch · Vắng · Thẻ dời chờ QL · Huỷ điểm · Bỏ khỏi đợt · Đã huỷ · vắng 2 lần · Giữ huỷ · Xóa lịch). Đường đau ≈ 14 bấm → 3–4. Biên: **Q-B3, Q-B4**.
6. **Vi phạm → TVV:** việc sinh **ngay khi GVCN lưu**, kể cả lần đang chờ QL duyệt; hạn **ngày lưu + 4, hết 23:59** (vd lưu T2 14/09 → hết T6 18/09); form 4 hàng chip (**3 bấm, không gõ**); thu hồi / không tăng bậc qua QL kèm lý do, "Đã thu hồi" giữ dòng; **gán TVV trước khi bật**. Biên: **Q-D1, Q-D3**.
7. **Sửa sau lưu:** gỡ R11 cho GVBM đúng ô (ảnh v4-4); 29 khoá → nới 11 · giữ 15 · đã nới 2 · thêm duyệt 1; "Lịch sử" gập ngay trong panel + **Khôi phục điểm** + Hoàn tác 8–10 s cho thao tác đảo được. Biên: **Q-B1, Q-B2**.
8. **SOS / PA:** cả ô SOS là nút → mở rộng hàng lớp; **Thêm PA dưới dòng ở bảng rộng, khung phải ở hàng đợi hẹp**, cùng một form. **Lịch thi:** một hàm trạng thái, chip A / B, việc Chốt ngày thi không hạn (2 bấm). **Phân tích:** luật L1 + panel C, báo cáo thuần, **"Toàn bộ" chỉ ở Phân tích**.
9. **Hành trình 9 vai:** bớt bước ở hầu hết việc chính (QL duyệt 10 thẻ 31 → 11 bấm, 20 → 0 đổi trang; TVV ghi kết quả: không có chỗ → 3–4 bấm). Mọi trang đầu trả lời được "việc đầu tiên của tôi là gì" trong một màn.
10. **Thứ tự gợi ý cho 07:** dữ liệu + máy chủ luật (L3, L4, L5, chủ Case, LT-SV) → nền (chữ, trạng thái, `Bang`, Khung việc, `Khoảng tuần`, `DongViec` / `HangDoiViec`) → màn theo cụm phụ thuộc (mục 9). Việc TVV: máy chủ sau cờ, **chỉ bật cùng màn Tổng quan TVV**.

---

## 0. Bảng quyết định của tệp này

Loại: **CHỐT** = luật / yêu cầu đã chốt, tệp này chỉ chọn cách làm · **PTA** = PTA tự quyết (chủ SP phản đối nếu không đồng ý; ★ = đảo một quyết định / mockup cũ) · **Q-xx** = chờ chủ SP.

| ID | Khu | Phương án ưu tiên | Loại | Mục |
|---|---|---|---|---|
| IA-01 | Menu + tiêu đề trang | Giữ thứ tự đã chốt; tiêu đề = tên menu mọi vai | CHỐT + PTA | 1.1 |
| IA-02 | Trang đầu từng vai | Bảng 1.2 (GV Công việc · QL/QT/VP/TVV Tổng quan · HT Tutor) | PTA (theo Q-A1) | 1.2 |
| IA-03 | Tổng quan ↔ Công việc | **P1** — việc TÔI ở trang đầu; Công việc QL = Theo dõi & giao việc | **Q-A1** | 1.3 |
| IA-04 | Chờ duyệt ở nhiều nơi | Một thành phần dòng duyệt; nơi làm chính = Tổng quan | PTA | 1.3 |
| IA-05 | Việc TVV ở đâu | **T1** — hàng đợi "Việc của bạn" trên Tổng quan TVV, không thêm menu | **Q-A1** (gộp Q-A3) | 1.4 |
| IA-06 | Bộ việc TVV | 4 việc + (đề xuất) Báo PH lớp thường; một việc một người giữ | **Q-A3** | 1.4 |
| IA-07 | Học viên & Lớp | 3 góc (Tất cả · Đang SOS · Lịch thi); Cần làm thành **bộ lọc "Có việc"** | **Q-A4** | 1.5 |
| IA-08 | Tab hồ sơ lớp / HV | 3 tầng (bỏ tab con); một việc một chỗ; tab trên URL | PTA (11.8-11, 12) | 1.6 |
| CV-A | Bố cục khu việc | **B** (Chờ duyệt là nhóm đầu) | **Q-A2** | 2.1 |
| CV-B | Danh sách việc | **A** — dòng 3 vùng, nhóm theo vai, gom nợ cũ | PTA | 2.2 |
| CV-C | Kiểu mở | Một danh sách một kiểu mở; Kết quả PA mở khung phải ★ | PTA ★ | 2.3 |
| CV-D | Hệ panel | Thang 0–5 + vỏ "Khung việc" (dáng ở 04) | PTA (10.7-6) | 2.4 |
| CV-E | "Phân công…" sai case | Sửa gốc: lý do thiếu người + tự gán chủ Case theo luật tạo Case | PTA (xem 10) | 2.5 |
| CV-F | Chuông / nhắc việc (FB-4-36 — góp ý GV, B) | **N2** — hộp chuông thành "Nhắc việc": Cần làm đọc cùng hàm hàng đợi trang đầu, Để biết = tin một chiều; GĐ1 vá N1 trước; không tự bật hộp khi đăng nhập | PTA ★ (02 4.7 A20, C22, C23) | 2.7 |
| TS-A | Workflow chấm | **B** "theo hạn, một nguồn" | **Q-C1** | 3.2 |
| TS-B | Hộp chấm | **A** một mẫu FT + lớp thường; gõ số mở hộp ★ | CHỐT (nhận xét trong hộp) + PTA ★ | 3.3 |
| TS-C | Excel nhập | 2 lối cùng thành phần (lớp × lượt); ẩn 375 | CHỐT + PTA | 3.5 |
| TS-D | Xem lại kết quả | "Tình trạng chấm" + `ODiem` mọi nơi | PTA (12.9-11) | 3.6 |
| MT-A | Bảng chuyển trạng thái | Bảng 4.3 (sửa 6 dòng lệch L3 / L4) | CHỐT (L3, L4) | 4.3 |
| MT-B | Tuần đích "-" lần 1 ở MT cũ | (ii) tuần sau của tuần hiện tại | **Q-B3** | 4.4 |
| MT-C | "Chuỗi dời" | chỉ lần dời do "-" cùng kỹ năng, cùng lượt | **Q-B4** | 4.4 |
| MT-D | Chữ huỷ / dời / gửi duyệt | Bộ chữ 4.5 | PTA ★ | 4.5 |
| MT-E | Luồng thao tác MT | **A** một hộp một đợt + Khôi phục điểm | PTA | 4.6 |
| YT-A | Khi nào sinh việc TVV | Ngay khi lưu, kể cả lần chờ duyệt | CHỐT (L1, PTA 21/10) | 5.3 |
| YT-B | Hạn | ngày lưu + 4, hết 23:59 giờ VN | PTA (L2 cho phép) | 5.4 |
| YT-C | Form TVV | **F2** — 4 hàng chip | PTA | 5.5 |
| YT-D | Người được giao / không TVV | TVV phụ trách em; không có → QL chi nhánh | **Q-D3** | 5.7 |
| YT-E | Chưa liên hệ được PH | Ghi lần thử; được "Kết thúc · không liên hệ được" | **Q-D3** | 5.8 |
| YT-F | Thu hồi / không tăng bậc | TH-A + KB-A | CHỐT (L5) + PTA | 5.9 |
| YT-G | QL từ chối / thu hồi sau khi việc đã sinh | chưa ghi → tự huỷ kèm lý do; đã ghi → giữ + nhãn | **Q-D1** | 5.10 |
| YT-H | Hiển thị Ý thức lớp / HV | dòng phụ trạng thái PH trong ô "Thang" | PTA | 5.11 |
| SL-A | Khoá cứng | Bảng 6.2 | CHỐT (L3) + **Q-B1** | 6.2 |
| SL-B | Lịch sử / hoàn tác / khôi phục | **H-A** | PTA | 6.3 |
| SL-C | Sửa dữ liệu đã duyệt | sửa phần đã duyệt → duyệt lại; chi tiết → lưu thẳng | **Q-B2** | 6.4 |
| SP-A | SOS / Thêm PA | S-B + Thêm PA theo độ rộng | PTA (X-39) | 7.1 |
| SP-B | Tạo Case nhiều kỹ năng (FB-4-35) | **C1** — chip chọn nhiều + một thẻ mỗi kỹ năng, phần chung nhập một lần, lưu một giao dịch ra n Case | CHỐT (21/10-CASE) + PTA (02 4.7 B16, C21) | 7.1b |
| LT-A | Lịch thi | một hàm trạng thái + chip A / B + Chốt ngày (hộp neo) | CHỐT (luật) + **Q-C3, Q-C4** | 7.2 |
| PT-A | Phân tích | L1 + panel C · T1 · Y1 · H2 · K1 | PTA + **Q-C2** | 7.3 |
| PT-B | Thời gian | "Toàn bộ" chỉ Phân tích; nơi khác `Khoảng tuần` có mặc định | CHỐT + PTA ★ | 7.3 |
| XE-A | Xuất Excel | **E1** + chọn em trong panel Xuất | PTA + **Q-E2** | 7.4 |
| TU-A | Tutor | **F1 + B1**; phần cần dữ liệu tách riêng | PTA | 7.5 |

---

## 1. IA tổng

### 1.1 Đã chốt — chỉ bàn cách làm

| Điều đã chốt | Cách làm (PTA) |
|---|---|
| Menu: **Tổng quan → Học viên & Lớp → Test → Công việc → Phân tích → Tutor** (V1 I.2) | Mã còn Phân tích trước Công việc (`shared/domain/dieuHuong.ts:45-53`) → sửa ở PR nền; giữ tên "Học viên & Lớp" (X-38) |
| GV vào thẳng Công việc (19/10) — trang nhà ≠ thứ tự menu (X-46) | giữ |
| Một phạm vi số cho cả trang + một "SOS hiện tại" (9.1-4) | bộ lọc chi nhánh / chương trình là **một trạng thái của trang**, mọi khối đọc chung |
| 375 thanh dưới ≤ 5 nút (10.7-11) | QL / QT gom Phân tích + Tutor vào "Thêm" |
| Tiêu đề trang = tên menu (9.2-2) | nay QL "Việc hôm nay", VP "Mock Test", TVV "Học viên của tôi", CX "Số liệu" → đều "Tổng quan"; tên riêng chuyển thành tên khối |

### 1.2 Trang đầu và "việc của tôi" theo vai (sau đề xuất)

| Vai | Menu | Trang đầu | "Việc của tôi" | Công việc dùng để | Số trên menu |
|---|---|---|---|---|---|
| GVBM · GVCN · GV S chéo | HV & Lớp · Test · Công việc | **Công việc** | hàng đợi của tôi (là trang đầu) | — | Công việc = quá hạn + hôm nay của tôi |
| QL | 6 mục | **Tổng quan** | khu "Cần bạn quyết" (hàng đợi) | **Theo dõi & giao việc**: việc của GV gom theo GV · Vận hành / + Giao việc / Báo cáo đơn vị · Hộp duyệt đầy đủ (đã xử lý, lọc) | trên **Tổng quan**; Công việc không số |
| QT | như QL + Quản trị | Tổng quan (Tất cả chi nhánh / một chi nhánh) | như QL | như QL | như QL |
| Admin VP | Tổng quan · HV & Lớp · Test · Phân tích · Công việc | **Tổng quan** (khối "Mock Test") | việc VP làm được theo quyền (vd lượt MT chưa xếp lịch); rỗng → "Không có việc hôm nay · Tuần sau: n lượt ›" | Chấm điểm của GV gom theo GV (xem; nhập hộ theo `score.override`) | Tổng quan |
| TVV | Tổng quan · HV & Lớp · Phân tích (**không thêm** Công việc) | **Tổng quan** | **"Việc của bạn"** (hàng đợi) + "Học viên của tôi" thu thành một hàng số | — | Tổng quan |
| CX | Tổng quan · HV & Lớp · Phân tích | Tổng quan (số liệu, chỉ xem) | không nhận việc (v4b E17) | — | không |
| Head tutor | Tutor | **Tutor** | khối "Việc của bạn" 1–3 dòng trên bảng (F1) | — | Tutor |
| Góc nhìn (QL / QT kiêm vai) | theo vai đang chọn | theo vai đang chọn | theo vai đang chọn | — | [CẦN ẢNH] — demo không có tài khoản (v4c 1.4) |

Chuông: bấm một thông báo → về **trang đầu của vai**, chọn sẵn đúng việc (URL `?viec=`), không mở ở nơi khác.

### 1.3 Tổng quan ↔ Công việc (MP XI.2, IV.8 · 10.2 B · V4A-02)

**Hiện trạng [ĐÃ KIỂM].** Tổng quan QL "Cần bạn quyết" và Công việc QL dùng **cùng** `HopChoDuyet` → 16/21 việc hiện y hệt hai nơi; cùng việc hai dáng mở (Tổng quan ngăn phủ · Công việc khung tại chỗ · Chốt lộ trình đổi trang); việc của chính QL nằm ở nhóm gập cuối Công việc; một thẻ duyệt hiện ở **5 nơi** (v4c J); số khác nhau khi khác chi nhánh (A1-02).

| Tình huống (vai) | **P1 — việc TÔI ở trang đầu; Công việc QL = theo dõi người khác** | P2 — Tổng quan tóm tắt + làm nhanh bậc 1–2; Công việc là nơi làm duy nhất | P3 — hai nơi đầy đủ (nay) |
|---|---|---|---|
| QL duyệt 10 thẻ, 5 cần xem bối cảnh | **11 bấm · 0 đổi trang** | 11–12 · 1 | 21 · 5 (từ Công việc) / ≈ 31 · 20 (từ Tổng quan) |
| QL Thêm PA cho 5 Case quá hạn | **11–16 · 0** | 12–17 · 1 | 25–30 · 5 ngăn phủ |
| QL chốt lộ trình 6 lớp | **≈ 12 + em chưa đề xuất · 0** (panel rộng thay khung phải) | như P1 + 1 đổi trang | 40–60 · 6 đổi trang / ngăn phủ |
| QL hỏi "GV nào đang nợ gì" | **1** (Công việc) | 1–2 | 2–3 |
| Độ dài Tổng quan QL 1440 / 375 | ≈ 1,7 / 2,5 màn | ≈ 1,1 / 1,6 | 2,5 / 5,3 |
| Việc trùng hai trang | **0** (một dòng dẫn "Cần bạn quyết · 23 · ⚠12 — ở Tổng quan ›") | việc gấp lặp hai nơi | 16 |
| Nguy cơ nhầm | thấp — một nơi, một số | vừa — hai dáng | cao — hai số, hai dáng |

- **Ưu tiên P1.** Đúng định hướng MP XI.2 (Tổng quan = nắm tình hình + quyết nhanh tại chỗ; Công việc = quản lý sâu: theo GV, giao việc, lịch sử) mà **không tạo khác biệt bằng tính năng thừa**; ít đổi trang nhất; một thành phần hàng đợi cho cả hai trang. P2 thêm 1 đổi trang cho mọi việc có form và vẫn lặp việc gấp; P3 là hiện trạng bị chê (ảnh v4-1).
- **Nghiệp vụ / quyền:** không đổi quyền. QL không có `score.edit` → ở "Việc của GV", panel Nhập điểm **chỉ xem**; QL có quyền Case → nút ghi "Làm thay". GV vẫn thấy chữ "chờ QL duyệt" trên việc của mình (v4c 4.3).
- **Chờ duyệt — một thành phần, nơi làm chính** (sửa "5 nơi"): dòng duyệt dùng chung ở (1) Tổng quan hàng đợi — **nơi làm chính**; (2) dải "Chờ duyệt" ở hồ sơ HV và thẻ trong ngăn Case — **cùng thành phần, cùng kết quả** (bối cảnh đúng chỗ, không ép đổi trang); (3) Hộp duyệt đầy đủ (`/cong-viec/cho-duyet`) — chỉ để xem đã xử lý + lọc, link từ đầu nhóm Chờ duyệt; (4) Công việc QL — không còn nhóm Chờ duyệt. Lối cũ trong thông báo chuyển về nhóm Chờ duyệt (`duongMoi`).
- **Cần chủ SP: Q-A1** (định hướng lớn). PTA Plan đã quyết gộp phần "TVV làm ở đâu" của Q-A3 vào câu này — một nguyên tắc cho mọi vai.

### 1.4 Việc của TVV / CX / Admin VP / Head tutor

**Nơi đặt việc TVV** (V4A-08, V4B-03, V4C-01 — v4a và v4c khuyến nghị khác nhau; PTA Plan chọn hướng v4a theo nguyên tắc 1.3). Đếm cho việc "Ghi kết quả xử lý vi phạm", form F2 (5.5):

| | **T1 — "Việc của bạn" trên Tổng quan TVV** | T2 — mở menu Công việc cho TVV | T3 — góc / bộ lọc ở Học viên & Lớp |
|---|---|---|---|
| Bấm (việc đầu / việc khác) | **3 / 4** (vào trang là thấy; việc đầu chọn sẵn) | 4 / 5 (+ menu) | 6 + có thể 1 đổi trang (menu · góc · dòng · form) |
| Đổi trang | 0 | 0 | 0–1 |
| Khớp "việc TÔI ở trang đầu" | ✓ | ✗ — TVV có hai nơi nhìn | ✗ — trái 11.2 (bỏ Cần làm) |
| Thêm menu / trang | không | +1 mục cho ≤ 5 loại việc | không |
| Người mới | thấy việc ngay khi đăng nhập | phải biết vào Công việc | phải biết góc |

**Ưu tiên T1** — cùng thành phần hàng đợi (1.3), không thêm trang. Nếu chủ SP muốn "mọi vai có việc đều có mục Công việc" thì chọn T2 (vẫn dùng chung thành phần). → **Q-A1**.

**Bộ việc TVV** (MP XII.1: chỉ việc thật sự của TVV, tránh nhóm vô ích). Luật chung: **một việc một người giữ** (nay "Chọn bước tiếp" là "của tôi" cho cả QL + mọi TVV chi nhánh → làm trùng / chờ nhau — V4B-03).

| Việc | Đầu ra | Sinh khi | Hạn | Người giữ (dự phòng) | Trạng thái |
|---|---|---|---|---|---|
| **Ghi kết quả xử lý vi phạm** | PH được báo + phản hồi được ghi | GVCN lưu xử lý (5.3) | 5 ngày lịch | TVV (QL chi nhánh) | **CHỐT** (L1, L2); dự phòng → Q-D3 |
| **Chốt ngày thi** | có ngày thi thật | tới tháng dự kiến, chưa có ngày (FT) | không | TVV (QL) | **Q-A3** (11.8-3c) |
| **Chọn bước tiếp sau thi** | lộ trình mới / tạm dừng / thôi | có kết quả thi thật | như nay | TVV (QL) | **Q-A3** |
| **Bổ sung hồ sơ thiếu** | đủ trường cần thiết | cờ thiếu | không | TVV, QL | **Q-A3** + định nghĩa **Q-D4**; hiện **một dòng tổng** "n em thiếu …", không mỗi em một việc |
| Báo PH kết quả Test lớp thường (nay là việc GVCN nhờ TVV ngoài web) | như việc 1 | như nay (Progress / Final có môn trượt) | không | TVV (GVCN như nay) | đề xuất gộp vào **Q-A3** (v4b Q8) — cùng form với việc 1 |
| Cập nhật kết quả thi thật | 4 kỹ năng / Không thi | hôm sau ngày thi | ngày thi + 7 | GVCN lớp cuối (nay) | giữ như nay; v4b Q9 đề xuất chuyển TVV — gộp **Q-A3** nếu chủ SP muốn |

Phương án bộ việc: **(a) 4 việc đầu + Báo PH lớp thường (khuyến nghị)** — TVV là người liên hệ PH (mockup vai 13/10), bớt một vòng nhắn GVCN ↔ TVV · (b) chỉ việc vi phạm (02 Q-A3 c) — việc khác vẫn rải rác, QL ôm · (c) đủ cả "Kết quả thi thật" — đổi người chịu trách nhiệm của GVCN, cần chủ SP. **Không thêm:** "Liên hệ lại PH", "TVV xác nhận đã đọc", "Theo dõi em SOS" (ô Cần chú ý đã có — để xem, không phải việc).

**Vai khác:** CX không nhận việc — Tổng quan chỉ xem, bỏ tiêu đề IN HOA (A1-20) · Admin VP: như bảng 1.2 · Head tutor: khối "Việc của bạn" ở đầu Tutor (7.5) — đúng cùng nguyên tắc.

### 1.5 Học viên & Lớp — 3 góc, "Cần làm" thành bộ lọc (MP V.3 · 11.2 · V2A-04)

**Hiện trạng [ĐÃ KIỂM].** 4 góc (Tất cả · Đang SOS · Cần làm · Lịch thi) + chip Đã thi + Bộ lọc thêm. "Cần làm 51" = "Tất cả 51" ở Công việc (cùng nguồn `/my-work`, khác cách đếm: QT Monbay 181 ↔ 84); 8/10 hàng "Cả lớp · n em"; "Người giữ" sai thuật ngữ; nút "Mở" không nói làm gì; GV thấy cả "Chờ duyệt", "Thiếu thông tin" không phải việc của GV.

| Tình huống | **(a) Bộ lọc "Có việc" trong bảng Tất cả** | (b) Bỏ hẳn; chip "⚠ n quá hạn" trên hàng lớp mở dải việc dưới hàng | (c) Giữ góc riêng, làm lại 5 cột |
|---|---|---|---|
| GV: "lớp 101 còn việc gì?" | 1 (chip ⚠ trên hàng lớp = bật bộ lọc cho lớp đó) | 1 | 2 (góc + lọc lớp) |
| QL: "em nào cả chi nhánh có việc quá hạn?" | **1** (bật bộ lọc, quá hạn trước) | n bấm (mở từng lớp) | 1 |
| Làm việc từ đây | nút động từ → cùng panel với Công việc | như (a) | như (a) |
| Số khớp Công việc | ✓ (cùng hàm đếm) | ✓ | ✓ nếu sửa đếm |
| Bảng việc thứ hai | không | không | **có** (trùng Công việc) |

- **Ưu tiên (a)** — đúng chữ chủ SP gọi là "bộ lọc", không thêm bảng việc thứ hai, vẫn có lối nhanh theo lớp. Khi bật: thêm cột **Việc** (động từ + đối tượng, cùng hàm tên với Công việc) · **Người phụ trách** · **Hạn** · [nút động từ]; việc cấp lớp (Chốt lộ trình, Bàn giao) hiện trên **hàng lớp**. Bộ lọc theo vai = đúng tập việc vai đó thấy ở trang đầu (cùng nguồn). **Không đổi logic xác định việc** (MP V.3).
- Còn 3 góc: **Tất cả · Đang SOS** (bảng 6 cột mockup 6, bỏ bộ lọc thời gian — 9.1-4) · **Lịch thi** (7.2). "Bộ lọc thêm › Thời gian" để trống = không lọc (7.3).
- **Cần chủ SP: Q-A4.**

### 1.6 Hồ sơ lớp / Hồ sơ HV — tab

| | Hồ sơ lớp | Hồ sơ HV |
|---|---|---|
| Nay | **4 tầng**: tab (Học viên · Ý thức & Phối hợp · Phân tích lớp) → cách xem (Tổng hợp · Góp ý tuần · Cần hỗ trợ · Kết quả đầu ra) → tab con (Vi phạm · Phối hợp) → 375 "Theo xử lý / Theo vi phạm"; lưới Điểm MT vẽ dưới **mọi** tab (+~2 200 px); trang 3 000–5 400 px (V2B-4) | tab Học thuật · Ý thức & Phối hợp (2 tab con) · Hành trình; một việc hiện **3 chỗ** (V2B-8); Hành trình vẽ một hành trình 3 lần (V4C-06); "Lộ trình tiếp theo" đổi trang + hộp giữa màn (V4C-07); 2 bản menu ⋯ (V4C-03) |
| **Sau (A — khuyến nghị)** | **3 tầng**: tab Học viên (cách xem Tổng hợp · Góp ý tuần · Cần hỗ trợ · Kết quả lớp trước; **lưới Điểm Test gập chỉ ở tab này** — đã chốt) · tab Ý thức & Phối hợp = **một bảng theo em** (phương án A, bỏ tab con) · tab Phân tích lớp · (lớp kết thúc) Tổng kết | Thanh "Việc của tôi" đầu hồ sơ là **chỗ duy nhất** có việc + nút trên dòng; Ý thức hai cột (Vi phạm chưa xong · Phối hợp SOS) + Nhật ký gập; Hành trình một dòng thời gian; Lộ trình tiếp theo mở tại hồ sơ; một menu ⋯ |
| B | Gộp Ý thức thành cột trong tab Học viên — bảng quá rộng, mất chỗ cho thang + phối hợp | — |
| C (giữ + vá) | giữ 4 tầng, sửa từng bảng — vẫn 4 tầng, vẫn dài | giữ 3 chỗ một việc |
| Chung | tab · cách xem · dòng đang mở nằm trên **URL** → link "↗ đúng tab" từ Phân tích / Công việc (sửa 9 chỗ sai ngữ cảnh — 12.4); chip đầu trang mở **tại chỗ** (11.1c, 12 chỗ) | như hồ sơ lớp |

**PTA tự quyết** (11.8-11, 11.8-12; Rulebook §19 "mặc định theo học sinh" không đổi) — **cần mockup** (màn M3, M3b).

---

## 2. Công việc — danh sách, kiểu mở, hệ panel

### 2.1 Bố cục khu việc — dùng chung Tổng quan QL / QT, Công việc GV, Tổng quan TVV (MP IV.8 · 10.2 · v1-tong-quan Phần 4)

| Tình huống (QL Monbay, sáng T2) | Nay | **A** — chủ SP: hộp duyệt trên + dưới trái / phải | **B** — một hàng đợi, Chờ duyệt là nhóm đầu | C — Tổng quan chỉ bức tranh, việc ở Công việc | D — trái hàng đợi, phải mặc định Lớp cần chú ý |
|---|---|---|---|---|---|
| Duyệt 10 thẻ có xem bối cảnh | ≈ 31 bấm · 20 đổi trang | 20 bấm + ~10 lần cuộn (chi tiết ở dưới hộp) hoặc 2 kiểu thao tác | **11 · 0 đổi trang · 0 cuộn** | 12 · 1 | 11 · 0 |
| Duyệt 10 thẻ không cần xem | 11 | 10 | **2–3** ("Chọn nhiều") | 3–4 + 1 | 2–3 |
| Thêm PA 5 Case quá hạn | 25–30 · 5 phủ | 11–16 · 0 | **11–16 · 0** (tự sang Case kế) | +1 đổi trang | 11–16 |
| Lớp nào SOS 3, em nào, có PA chưa | 3 bấm · 1 đổi trang · 1 phủ | 1 | **1** | 1 | 1 |
| Dài trang 1440 / 375 | 2,5 / 5,3 màn | ≈ 2 / 3,2 | **≈ 1,7 / 2,5** | ≈ 0,8 / 1,2 (+ trang Công việc) | ≈ 1,15 / 2,5 |
| Trùng Công việc QL | trùng Chờ duyệt | **trùng y** (Công việc QL nay là A) | không | không | không |

- **Ưu tiên B** — giữ lõi ý chủ SP (trái danh sách, phải chi tiết, làm tại đây); khác A đúng một điểm: Chờ duyệt **là nhóm đầu của danh sách, luôn mở**, có "Chọn nhiều". Chi tiết luôn ngang chỗ vừa bấm; một kiểu thao tác; ngắn hơn ~250–300 px; đúng mockup 2 + 3 (Chờ duyệt là nhóm). Điểm A hơn B (đọc "Nếu duyệt" không cần bấm) → B bù bằng dòng 2 ghi trích ngắn. **Bằng chứng mới:** ảnh v4-1 là A chạy thật, chủ SP gọi "dày đặc, chi chít". **Cần chủ SP: Q-A2.**
- 375: danh sách → chi tiết toàn màn, "‹ Quay lại", nút chính dính đáy, "Việc 2 / 10", Quay lại về đúng nhóm + vị trí cuộn.

### 2.2 Danh sách việc — dòng 3 vùng, nhóm cố định theo vai (V4A-01)

**Luật dòng (mọi phương án):** mỗi dòng trả lời 3 câu ở **3 vùng cố định** — **Hạn / trạng thái** (cột trái: "⚠ 68 ngày" chữ cam + ký hiệu · "Hôm nay" · "16/09" · "—") · **Việc gì + cho ai** (dòng 1 = động từ + đối tượng; **một hàm tên** cho dòng và đầu panel; dòng 2 = em · lớp · đợt; người phụ trách chỉ khi xem việc người khác) · **Vào đâu** ("›" mở khung phải; "↗" sang trang xem; không nút thứ hai trên dòng). Không tô nền cả hàng; SOS một `ChipSos`; bỏ chip "Bình thường". Dáng cụ thể ở 04.

| # | Vai · việc thật | Nay | **A — hàng đợi, nhóm cố định theo vai** | B — bảng việc rộng, sắp theo hạn | C — dải Hôm nay / Tuần này / Nợ cũ / Sau |
|---|---|---|---|---|---|
| 1 | GV 10 trả hết nợ W2 cũ (4 dòng, 11 bài) | 4–6 | **1** (một dòng nợ cũ) | 4 | 4 |
| 2 | GV 10 nhập W2 tuần này (3 bài, 2 lớp) | 2 | **1** | 2 | 1 |
| 3 | GVCN 7 ghi Kết quả PA Reading | 3, **tiêu đề + tên em biến mất** | **3**, giữ tiêu đề + bối cảnh PA | 3 | 3 |
| 4 | GVCN 7 xử lý vi phạm 3 em (lô) | 2 + gõ | 2 + gõ | 2 | 2 |
| 5 | QL duyệt 10 thẻ, 5 cần bối cảnh | ≈ 21 · 5 đổi trang | **11 · 0** | 11 | 11 |
| 6 | QL / QT "Case chưa có người" (Case 14) | **không xong được** | **0** (tự gán) / 3 (lớp thiếu GV môn) | như A | như A |
| 7 | QT chọn bước tiếp 2 em | 7 | **5** | 5 | 5 |
| 8 | Admin VP: GV nào chấm trễ, bài nào | 2–3 | **1** (gom theo GV) | 1 | — |
| | Tự sang việc kế cùng form (mockup 1e) | có, hay nhảy nhóm | **giữ** (cùng nhóm, của tôi, đang hiện) | mất (trộn loại) | mất |

**Ưu tiên A** — bớt bước 5/8, bằng 3/8; một kiểu mở; khung nhìn đầu ≤ 30 phần tử bấm được (nay 42–49); dòng việc đầu ở y ≤ 200 px 1440 / ≤ 420 px 375 (nay 752 / 1 505). B hợp QL theo dõi nhưng GV làm form trong nửa màn, mất "tự sang việc kế"; C trộn loại, nợ cũ gập dễ quên. **PTA tự quyết**; cần mockup mới.

**Nhóm theo vai (thứ tự cố định — chỉ nhóm có việc mới hiện):**

| Trang · vai | Nhóm |
|---|---|
| Công việc · GV / GVCN | Chấm điểm (vạch Quá hạn · Tuần này · Sau — gập) · Case học thuật · Ý thức & Phối hợp (gồm Phối hợp SOS, Báo PH) · Lớp & hồ sơ (Bàn giao, Điền Target, MT cũ) |
| Tổng quan · QL / QT | Chờ duyệt · Case quá hạn chốt PA · Sau thi · Bước tiếp · Lộ trình lớp · Phân công (chỉ khi lớp **thật** thiếu GV môn) · Lịch Test (chưa lịch MT kế) · Lịch thi thật (khi QL giữ thay TVV) · Vận hành quá hạn / ≤ 7 ngày |
| Công việc · QL / QT | Việc của GV gom theo GV ("Trần Ngọc Hà · 26 việc · ⚠10 ›") · Vận hành / + Giao việc / Báo cáo đơn vị · Hộp duyệt đầy đủ |
| Tổng quan · TVV | Kết quả xử lý vi phạm · Lịch thi (chốt ngày) · Sau thi · Hồ sơ thiếu (một dòng tổng) |

Trong nhóm: quá hạn lâu nhất → hạn gần → SOS cao → tên. Nợ chấm cũ ≥ 14 ngày cùng lớp × môn gom **một dòng** (cùng nguồn "Chấm Test theo hạn" — 3.2). "Bị từ chối" thành việc "Sửa đề xuất · bị từ chối" trong nhóm của nó (bỏ khối thẻ rời cuối trang GV). **Vào trang:** không tự mở việc của người khác, không đặt con trỏ, không cuộn; chọn sẵn dòng đầu **chỉ khi** đó là việc của chính người xem (sửa CV-09 vẫn còn). Lỗi tải **chỉ che vùng danh sách**, giữ đầu trang + bộ lọc (nay mất cả trang — V4A-01). Trạng thái phải vẽ (rỗng theo vai, đang chọn, vừa xong + Hoàn tác, người khác đã xử lý, lô lỗi một phần…): **04** + v1-tong-quan 4.4.

### 2.3 Luật "một danh sách một kiểu mở" (V4A-06 · ảnh v4-1, v4-3)

**Hiện trạng [ĐÃ KIỂM].** Một danh sách Công việc có **5 kiểu mở**: khung phải · mở danh sách em dưới dòng · form ghi nhanh dưới dòng (Kết quả PA) · đổi trang ↗ · ngăn phủ chồng (Phân công, Gia hạn, + Giao việc). Ảnh v4-3: ghi nhanh đặt vùng mở vào cột 2 (`WorkList.tsx:148` `sm:col-start-2`) → cột tiêu đề co **0 px** ở 1 024 / 1 280 / 1 440 — lỗi lưới CSS, không phải z-index; không thu lại được, không Esc, khung phải bỏ trống.

**Luật (PTA tự quyết, toàn web):** danh sách **có khung phải** → mọi dòng mở ở khung phải · bảng **rộng hết trang, không có khung phải** → mở dưới hàng (đầu hàng giữ nguyên, vùng mở thẳng cột 1, bấm lại / ✕ / Esc thu, `aria-expanded`) · việc cần bảng nhiều em → panel rộng thay khung phải · đổi trang **chỉ để xem** (↗).

| Kết quả PA ở Công việc | **A — mở khung phải như mọi việc (khuyến nghị)** | B — giữ ghi nhanh dưới dòng, sửa CSS + Esc |
|---|---|---|
| Bấm | 3 (giữ) | 3 |
| Tiêu đề + tên em + bối cảnh PA | luôn thấy | thấy (sau khi sửa) nhưng không có bối cảnh PA |
| Kiểu mở trong danh sách | 1 | 2; khung phải trống khi ghi nhanh |
| "Điều chỉnh / Kết thúc…" | mở phần đủ **trong cùng panel** | chuyển việc sang khung phải (đổi chỗ lần 2) |

**Ưu tiên A** — ★ đảo khung OV-13 §1 đã duyệt (v4a hỏi ở Q4) → PTA Plan đưa vào 02 mục 4.7. Ghi nhanh **vẫn giữ** ở panel một em (Học viên & Lớp — không lỗi). **Rà chỗ cùng kiểu:** `NganDanhSach` (đúng, nhưng trộn hai kiểu → theo panel C, 7.3) · Tổng quan "Cần bạn quyết" (ngăn phủ → khung phải hàng đợi B) · Lịch thi, Phối hợp SOS "Bỏ ▾", Lịch Test mở lưới dưới hàng (đúng luật) · thẻ Chờ duyệt "Mở" đổi trang (→ khung phải, CV-27).

### 2.4 Hệ panel dùng chung — thang 0–5 + vỏ "Khung việc" (MP XI.3–4 · 10.3 · V4A-03, 04)

**Hiện trạng [ĐÃ KIỂM].** 7 dáng, ~11 biến thể (`KhungPanel` 63 tệp: 44 đầu cũ 52 px, 19 đầu v3; 3 bề rộng); 9/18 panel tiêu đề **khác nghĩa** tên dòng; bối cảnh nằm **dưới** nút Lưu; "Gia hạn" (1 ô) là ngăn 560 px cả chiều cao chồng panel; lịch sử hầu như không có trong panel.

| Bậc | Dạng | Khi nào | Ví dụ đích |
|---|---|---|---|
| 0 | Chỉ xem | số để quan sát; vai không có việc | hàng tổng "Cả Monbay" |
| 1 | Một bấm + Hoàn tác 8–10 s | 0 ô, đảo được, bối cảnh đã thấy | Duyệt · Xác nhận PA theo quy chế · Đánh dấu đã báo |
| 2a | **Hộp neo** ≤ 360 px | 1–2 ô ngắn | Gia hạn · Phân công một môn · Chốt ngày thi · Dời tháng · Từ chối / Thu hồi (lý do) |
| 2b | **Mở dưới hàng** — chỉ ở bảng rộng không có khung phải | ≤ 4 ô, bối cảnh có trên hàng | Thêm PA dưới dòng em (Lớp cần chú ý, Đang SOS, hồ sơ lớp) · Lịch thi · Ý thức lớp A |
| 3 | **Khung chi tiết** (cột phải dính trong hàng đợi; ngăn phải khi mở từ số / chip — **cùng vỏ**) | 3–6 ô hoặc cần bối cảnh; làm tuần tự | mọi việc của hàng đợi · panel C (7.3) · panel một em |
| 4 | **Panel rộng thay khung phải** (không phủ thanh trên) | bảng nhiều em | Chốt lộ trình · Nhập điểm cả lớp · Bàn giao 5 em |
| 5 | Trang | xem hồ sơ (↗), không gian lớn | hồ sơ HV / lớp / MT · Kế hoạch Test |
| — | Modal giữa màn | **chỉ** xác nhận hậu quả lớn, nêu đúng đối tượng | Xoá · đổi phân công cả lớp |

Luật kèm: chọn bậc **thấp nhất** đủ dùng · mở cái mới thay cái cũ · **không ngăn phủ trong khung / ngăn** (hộp neo trong khung thì được) · trạng thái trên URL → Quay lại về đúng dòng · Esc đóng lớp trên cùng, focus về chỗ mở · nút làm ≠ link xem. Giải phẫu panel việc 6 phần (Đầu dính · Bối cảnh **trước** form · Cần làm · Lịch sử gập · Chân dính có trạng thái lưu · Sau lưu / người khác đã làm) và 11 thành phần chung (`DauViec`, `KhoiDoiTuong`, `BoiCanh`, `CanLam`, `ODiem`, `ChipSos`, `ChipHan`, `TrangThaiLuu`, `NutChinh` / `NutChu`, `LichSu`, `HangDoiViec`): **dáng ở 04**. So "một mẫu cứng cho mọi panel" (MP XI.4 cấm) và "giữ 7 dáng, vá chữ" (người dùng vẫn học lại mỗi màn). **PTA tự quyết** (10.7-6).

### 2.5 Ảnh v4-2 — "Phân công…" ở việc Thêm PA SOS 3 (MP XI.5 · V4A-05)

**Gốc [ĐÃ KIỂM mã + DB demo].** Web đoán "chưa có người" từ `ownerId === null` rồi mở **phân công cả lớp**; Case 14 thiếu chủ nhưng lớp **đã có** GV môn R → lưu phân công **không gán được chủ Case** (không mã nào ghi `owner_user_id` khi phân công; chú thích `PanelViec.tsx:253` sai với mã) → việc **không bao giờ xong**. Kèm dòng trùng "Chọn người phụ trách" mở panel **không có ô chọn người**, hiện cả cho GV dạy lớp.

| | **Sửa gốc (khuyến nghị)** | Ẩn nút khi lớp không thiếu GV môn |
|---|---|---|
| Cách | máy chủ trả **lý do thiếu người** trên mỗi việc (thiếu GV môn · Case thiếu chủ · chủ hết quyền); Case thiếu chủ + lớp có GV môn → **tự gán theo luật đang dùng khi tạo Case** (GV môn → GVCN), có lịch sử; lớp **thật** thiếu GV môn → hộp neo "Phân công GV P…" chỉ ô môn thiếu, cùng giao dịch gán chủ Case; GV không thấy việc không chủ | 1 điều kiện ở web |
| Case 14 | **0 bấm** (việc về GV R) | vẫn treo, không ai làm |
| Lớp thiếu GV môn | **3 bấm**, 0 ngăn phủ (nay 4–5 trong ngăn cả lớp, dễ đổi nhầm cả lớp) | như nay |
| Nghiệp vụ | dùng **đúng** luật chọn chủ Case hiện có; không đổi luật phân công; đổi chủ có lịch sử (L3) | — |

**Ưu tiên sửa gốc.** v4a xếp là câu hỏi (Q3); 02 xếp PTA tự quyết (MP-22). Tệp này đề xuất **PTA tự quyết, đưa vào 02 mục 4.7** (chủ SP phản đối nếu không muốn tự gán) — vì chỉ áp luật chọn chủ đã có, không tạo luật mới.

### 2.6 Nhập điểm trong panel Công việc sau khi bỏ Excel (MP XI.7 · V4A-07)

Đã chốt bỏ Excel ngoài lớp × MT. Panel còn: đầu "Nhập điểm Writing Task 2 · ⚠ quá hạn 68 ngày" · "MB FT 101 ↗ · MT1 · thi W1 JUL · 2 bài" · thanh công cụ **2 thứ** ("Còn n bài" · công tắc "Hiện cả lớp") thay 4–6 nút · bỏ "?", "Mở lưới đầy đủ ↗", "1 lớp · 2 bài ↗" · lớp thường: bỏ "Điền cả cột", nhận xét vào hộp chấm (3.3). **PTA tự quyết.** Xuất Excel: Công việc không có nút xuất — không đụng.

### 2.7 Chuông = hộp "Nhắc việc" — nhắc việc / thông báo (FB-4-36 · góp ý GV trung tâm, B · A1-04, A7-05, A7-15 · agent v4d)

**Lời GV (chủ SP chuyển 21/10):** "1 ô hiện lên, list thông báo nhắc việc như Base … để GV xử lý không bỏ sót việc nào". "Base" = Base.vn: một trung tâm nhắc việc gồm (i) danh sách việc của tôi theo hạn, (ii) tin sự kiện tách riêng, (iii) bấm mở đúng việc. PISA **đã có** (i) = Công việc / hàng đợi trang đầu, (iii) = `duongThongBao`; **thiếu**: chuông không đọc từ (i).

**Hiện trạng [ĐÃ KIỂM v4d, demo 14/09].** Chuông (`web/src/modules/platform/Header.tsx:211-288`) là **nhật ký sự kiện**: mỗi `notify` một dòng; "Cần làm" đoán theo danh sách `kind` cứng (`shared/domain/duongHoSo.ts:150-158`); số trên nút = số **chưa đọc**; 3 loại tự động OV-15d đồng bộ ≤ 1 lần / 5 phút (`server/src/platform/thongBaoTuDong.ts`).

| Vai | Nút | Cần làm | Để biết | Trang đầu / menu | Lệch |
|---|---|---|---|---|---|
| GV 7 | **39** | 18 | 21 | Công việc ⚠10 · "19 việc đến hết W3 SEP" | 9 việc quá hạn của Hà: **1** ở Cần làm · **5** ở Để biết · **3** không có (Kết quả PA, Ghi nhận / Xử lý vi phạm); 8 dòng "SOS n · em" (tin cho GVCN) kẹt ở Cần làm; Case 56 hai dòng |
| GV 10 | 9 | 1 | 8 | 11 việc · 5 quá hạn | 4 "Quá hạn chấm" + 1 Case quá hạn ở Để biết |
| QL 2 | 30 | 13 | 17 | "Chờ duyệt 10" · menu "Công việc 10" | 6 "Chốt lộ trình … quá hạn 8–29 ngày" ở Để biết |
| TVV 23 | 0 | 0 | 0 | không việc | luật 1 sẽ sinh việc TVV — chuông phải tự có |

| | N1 — vá chuông hiện có | **N2 — chuông = hộp "Nhắc việc" một nguồn (khuyến nghị)** | N3 — trang / ngăn "Nhắc việc" riêng kiểu Base (danh sách + tick xong) |
|---|---|---|---|
| "Cần làm" lấy từ | `kind` (+3 loại tự động) + `con_viec` | **cùng hàm hàng đợi trang đầu** (GV Công việc của tôi · QL / QT Cần bạn quyết · TVV / VP Việc của bạn — 1.2) | bảng riêng |
| GV 7: việc quá hạn thấy ở Cần làm | 6 / 9 | **9 / 9** | 9 / 9 |
| Số trên nút | 16 (Cần làm còn mở) | **19 · ⚠10 = đầu trang Công việc = badge** | thêm một số |
| Từ trang khác tới việc quá hạn lâu nhất | 2 bấm + dò 16 dòng | **2** (dòng đầu) | 2–3 + 1 đổi trang |
| Việc mới do người khác giao | +1 loại thông báo (C23) | dòng Cần làm có chấm "Mới" | có |
| Panel / trang mới | không | **không** (dùng hộp sẵn có) | +1, trùng Công việc |
| Mã | +3 loại vào danh sách, `con_viec` cho SOS-lượt, +1 `notify` | **bỏ** `thongBaoTuDong.ts` (bản sao việc, trễ 5 phút); Cần làm đọc hàm sẵn có | nhiều nhất |
| Luật | vẫn hai nguồn | 11/10-UX một nguồn · 9.2-4 · Rb 20.10, 20.11 | trái "không trùng Công việc"; tick "xong" không có đầu ra (08/10) |

**Ưu tiên N2, hai bước:** **GĐ1 (SL1)** làm N1 — rẻ, đã có trong kế hoạch (A1-04, A7-05) + 3 vá v4d (SOS-lượt của GVCN → Để biết; một Case một dòng; Case tạo tay cho người khác → chuông người phụ trách). **M2** đổi sang N2 cùng `HangDoiViec` / `DongViec`.

**Hộp N2 (PTA tự quyết — 02 4.7 C22):**
- Đầu: "Cần làm · 19 · ⚠10 quá hạn" (chữ thường). **Khối Cần làm** ≤ 8 dòng `DongViec` 3 vùng (Hạn · Việc + đối tượng · ›), **cùng thứ tự Công việc**, nợ chấm cũ gom một dòng; phạm vi = quá hạn + hạn tới hết CN tuần này (Rb 20.10) + việc có thông báo chưa đọc (chấm "Mới" — việc mới giao, hạn xa vẫn thấy); chân "Xem đủ 26 việc ở Công việc ›" (QL: "… ở Tổng quan ›").
- **Khối Để biết**: tin một chiều (dời bài vắng, huỷ vắng 2 lần, được duyệt, chuyển lớp, SOS n lớp chủ nhiệm…), chấm chưa đọc, "Đánh dấu đã đọc" chỉ cho khối này, gập khi > 5 dòng; thông báo trỏ việc không hiện lần hai ở đây.
- Số trên nút = số dòng Cần làm (9.2-4); Để biết chưa đọc = chấm không số. Bấm dòng → trang đầu vai, `?viec=` mở đúng việc tại chỗ (1.2); thông báo của việc đó tự đọc. Rỗng: "✓ Không còn việc tuần này · Việc sau: 3 ›". 375: tấm rộng như nay.
- **Không:** tự bật hộp khi đăng nhập (★ 4.7 A20 — đảo chữ "ô hiện lên" của GV: thêm một bước đóng mỗi lần vào, trang đầu GV đã là danh sách việc) · tick "xong" tay · email / Zalo (Rb 20.11).

**Đếm (GV 7 đang ở hồ sơ lớp, "còn việc gì quá hạn?"):** nay 2 bấm + dò 39 dòng, vẫn sót 3 việc · N1 2 bấm + dò 16, sót 3 · **N2 2 bấm, 0 sót, số khớp Công việc**. QL 2 lộ trình quá hạn: nay ở Để biết · N1, N2 ở Cần làm.
**Kiểm thử:** phép kiểm "id dòng Cần làm = id hàng đợi trang đầu (lát tuần này + chưa đọc)" cho GV 7, GV 10, QL 2, QT 1, TVV (sau L1); việc xong rời Cần làm ở lần tải kế; không `kind` một chiều nào ở Cần làm; số trên nút = số dòng; ảnh trước / sau 1440 + 375.
**Cần chủ SP:** không (UX / IA). Ảnh N2 đưa chủ SP chuyển lại GV trung tâm.

---

## 3. Chấm Test · nhập điểm Excel · xem lại kết quả

### 3.1 Đã chốt / luật phải giữ (bảng luật đủ ở v3a Phần 1)

- **Đã chốt:** nhận xét Test lớp thường **tuỳ chọn, trong hộp chấm** (V3 I.2) · Excel nhập chỉ **theo lớp × từng MT** (V3 I.5) · màu trên con số (V1 I.3) · bảng thẳng (V2 I.7, V3 I.3).
- **Luật giữ nguyên:** MT L / R / W1 / W2 / S theo kỹ năng của GV được phân công; mở ô từ T2 tuần thi **của kỹ năng đó**; hạn hết **T4 tuần kế**; nhận xét MT ≥ 10 ký tự + nhóm nguyên nhân khi dưới kỳ vọng · **S chấm chéo (T18):** không GV mặc định, không tính nợ, người chấm muộn bị tính trễ cho chính họ · MT cũ không nợ / không hạn · MT0 · Progress (70 %, SOS theo số môn trượt §20.17) · Final (gợi ý dải) · Checkpoint · Mini Test (ở việc Case) · **chia khối Lịch Test (T15, 05/10)**: khối 1 = thi trước tuần trước + quá hạn · khối 2 = thi tuần trước · khối 3 = thi tuần đang xem · dời lịch lớp thường **chỉ QL** (14/10-Q13).

### 3.2 "Ba khung chấm" — chấm tuần nào, ở đâu (MP VIII.5 · 12.2 · V3A-1)

**Hiện trạng [ĐÃ KIỂM].** "Ba khung" có hai nghĩa, cả hai gây nhầm: (A) ba khối Lịch Test — khối "**Test chấm tuần này**" chứa bài **thi tuần trước**; khối "**Lịch Test tuần này**" (chấm được ngay) bị **thu gọn** · (B) ba nơi chấm (Lịch Test theo tuần thi · Công việc theo việc · hồ sơ lớp theo lượt) — gom khác, **đếm khác đơn vị** → GV 10 thấy **4 con số** cho cùng khối lượng. Công việc ghi "Nhập điểm · W1 JUL" (là tuần **thi**, không chữ "thi", quá hạn 68 ngày); hộp chấm không ghi hạn; lưới mở đủ 10 cột cho GV chỉ có cột W2.

| Tình huống | Nay | A — giữ ba khối, vá chữ | **B — "theo hạn, một nguồn"** | C — chỉ chấm ở Công việc |
|---|---|---|---|---|
| Cô Linh (GV 10, W2) chấm mọi bài đến hạn + quá hạn, 2 lớp | ~11 bấm · 3 khối · 8 lưới 10 cột (hoặc Công việc 6–7 bấm, 6 panel) | ~9–11, số vẫn lệch giữa Test ↔ Công việc | **1–2 bấm**, 1 lưới gọn / nhóm | 1–2 nhưng mất chỗ chấm quen ở Test |
| GV S chấm chéo | 5 (nhãn "GV khác", số 0 ↔ 49) | 4–5 | **2** | 2 |
| GV nhập bài quá hạn | 3 + dò 6 dòng giống nhau | 3 | **1** | 1 |
| GV lớp thường Progress + nhận xét 3 em | ~8 bấm · 4 hộp | 8 · 4 | **2 · 1 hộp** (3.3) | 2 |
| QL "MB FT 101 MT2 đủ chưa, ai còn nợ" | 3–6 + cộng nhẩm / 5–6 + 1 đổi trang | 3–5 | **1 · 0** (Tình trạng chấm) | không có chỗ |
| Cùng một con số ở mọi nơi | ✗ (4 số) | ✗ | **✓** | ✓ nhưng một nơi |

**B cụ thể:** (1) **một hàm nhãn bài chấm** cho hàng · hộp · việc · thông báo: **"MT2 · thi W2 SEP · hạn 16/09"** (không ghi thứ — 19/10-M6, X-18) · (2) **Chấm Test** = một danh sách gom **theo hạn**, luật chia khối giữ nguyên, chỉ đổi tên + thứ tự: "⚠ Quá hạn chấm · n bài" · "Hạn 16/09 · bài thi W2 SEP" · "Bài thi tuần này W3 SEP · hạn 23/09" (**mở khi có ô của tôi**) · "Chấm Speaking chéo · n bài · không tính nợ" (chỉ GV có phân công S); không dải số, không bộ chọn tuần (luôn theo hôm nay — T16), link "Lịch tuần khác ›" · (3) **một nguồn** cho Công việc › Chấm điểm và Test (gộp `gomBaiChuaCham` + `lichTest`) · (4) **lưới gọn**: chỉ cột + ô của tôi; ô bài tuần khác khoá trong nhóm này; "Cả lớp" xem đủ · (5) tự sang nhóm kế khi xong (mockup 2 khung 1e) · (6) trạng thái rỗng dạy luật một câu ("Bài thi tuần này chấm trước T4 tuần sau").

**Ba nơi sau B:** Test › Chấm Test (theo hạn — chỗ chấm chính) · Công việc › Chấm điểm (**cùng nguồn, cùng dòng, cùng số**) · Hồ sơ lớp › Điểm Test (theo **lượt** — xem / nhập cả lớp, **nơi duy nhất có Dán Excel**). Bỏ trang `/nhap-diem` và `/bang-diem-thuong` (route chuyển hướng). Lịch tuần (đổi tuần) chỉ xem.

**Ưu tiên B** — phương án duy nhất **cùng một con số ở mọi nơi** và **bớt** (một cách gom, không dải số, một dáng hộp). Đổi tên / thứ tự / gom = đổi mockup ba khối 06/10 đã duyệt → **Cần chủ SP: Q-C1**. Phần chữ (nhãn "thi … · hạn …", "GV khác" → "chấm chéo") làm được ở GĐ1 không cần chờ.

### 3.3 Hộp chấm một mẫu (MP VIII.2–3 · 12.1 · V3A-6)

**Hiện trạng [ĐÃ KIỂM].** Lớp thường **3 đường cho một ô** (ô gõ thẳng · nút "Nhận xét" · hộp "Sửa … Lý do" không có nhận xét); nút ⋯ không bị cắt mà **đè 41 % ô "tổng"**; menu ⋯ toàn thao tác hiếm.

| | **A — lớp thường dùng cùng hộp chấm FT (khuyến nghị)** | B — giữ gõ thẳng, nhận xét mở dải dưới hàng | C — chỉ nới cột 190 → 230 px |
|---|---|---|---|
| 3 em có nhận xét | **1–2 bấm, 1 hộp** | 3–4, hàng nhảy khi mở dải | ~8, 4 hộp (như nay) |
| 20 em chỉ điểm | bằng nay (gõ số → Enter = "Lưu · em tiếp") | bằng nay | bằng nay |
| Đúng lời chủ SP "nhận xét trong box chấm" | ✓ | một phần (2 chỗ khi sửa) | ✗ |

Hộp: đầu "G+V · {em}" + "Progress · thi W2 SEP · hạn 16/09" · "Đúng [17] / [25] · 68 % · chưa đạt (cần 70 %)" · **Nhận xét (tuỳ chọn)** · "＋ Lý do sửa" gập (chỉ khi sửa điểm có sẵn) · chân: Vắng · Thêm ▾ (Lịch sử · Huỷ điểm / Khôi phục · Dời hạn · Dời lịch — theo quyền) · Lưu · **Lưu · em tiếp ›**. Bỏ nút "Nhận xét", ⋯ trong ô, hộp "Sửa" riêng, "tổng [25] Điền cả cột" trên tiêu đề. 375: giữ ô to gõ thẳng + "＋ Nhận xét" mở dưới hàng. Giữ đúng luật nhận xét từng loại (MT bắt buộc ≥ 10 + nhóm nguyên nhân; MT cũ / MT0 tuỳ chọn; S chéo bắt buộc). **PTA tự quyết ★** — đảo HD2 11/10 "gõ thẳng đúng / tổng" (02 mục 4.7 #3).

### 3.4 Speaking chấm chéo (12.9-6 · V3A-2)

Nhóm riêng "Chấm Speaking chéo" chỉ cho GV có phân công S; chữ **"chấm chéo"** thay "GV khác"; người chấm mặc định = **chính GV có kỹ năng S** đang chấm (nay mặc định người đang xem → QL nhập hộ thành người chấm và bị tính trễ); QL nhập hộ **phải chọn** người chấm; hạn hiện để nhìn. **Không đổi T18** (không tính nợ). Đếm: 5 → 2 bấm. **PTA tự quyết.**

### 3.5 Nhập điểm Excel — giữ duy nhất lớp × lượt (ĐÃ CHỐT · 12.3 · V3A-5)

Một thành phần `DanExcel` đang hiện ở **8 lối** → giữ **2 lối cùng thành phần**: hồ sơ lớp › Điểm Test (tab MT1 / MT2 / MT3 · Progress / Final) và panel "Nhập điểm lớp" (lối ngoài hồ sơ lớp). Bỏ ở Lịch Test, Công việc, `/nhap-diem`, `/bang-diem-thuong`, và **ở 375**. Cách làm (PTA): nút ở thanh công cụ **ngoài** khung bảng, chỉ khi lượt có ô **tôi** nhập được · tiêu đề "Dán từ Excel · MT2 · MB FT 101 · 33 em" + câu nói cột nhận theo vai · "Sao chép mẫu" đúng cột của người xem · giữ bảng xem trước (khớp tên, ghi đè trước → sau, lỗi từng ô, Hoàn tác) · máy chủ **`luot` bắt buộc** ở `/scores/lo`. Lớp thường "theo từng MT" = **theo từng bài** Progress / Final (02 mục 4.7 #12). Không đụng "Thêm học viên" (điểm đầu vào), Tải danh sách tutor, và **mọi chỗ xuất Excel**.

### 3.6 Xem lại kết quả — QL / QT / Admin VP / TVV / CX (MP VIII.7 · V3A-3)

| | **(b) "Tình trạng chấm" ở Test + `ODiem` mọi nơi (khuyến nghị)** | (a) thêm cột "Còn nợ" vào khối 1 | (c) chỉ dùng Phân tích GV |
|---|---|---|---|
| QL "lớp X MT2 đủ chưa, ai nợ" | **1 bấm, 0 đổi trang** | vẫn 2–3 dòng / bài (chia theo tuần thi) | báo cáo, không làm tại chỗ |
| Nhập hộ / sửa | bấm hàng → lưới lượt mở **dưới hàng** (theo quyền) | — | đổi trang |
| Thêm khối mới? | không — **thay** dải 3 ô + khối 1 kiểu cũ của QL | thêm cột | — |

"Tình trạng chấm": Lớp · Bài · Tuần thi · Đủ x/y em · Còn n ô · **Ai còn nợ theo kỹ năng** ("Hà L,R 6 · Linh W2 3 · chấm chéo S 6") · Hạn / ⚠ quá hạn; quá hạn lên đầu; trong `Khoảng tuần` (mặc định 4 tuần thi gần nhất). **Ai dùng:** QL / QT (chi nhánh / mọi chi nhánh) · Admin VP (chi nhánh, nhập hộ theo `score.override`) · **TVV / CX không có khu Test** (11/10) → xem điểm ở hồ sơ HV tab Học thuật, số tô màu theo kỳ vọng bằng `ODiem` (nay là link xanh không màu — R 5.0 < 5.5 trông như đạt). Đếm Admin tra một em: 2 → 2 bấm, nhưng đọc được kỹ năng nào dưới kỳ vọng. **PTA tự quyết** (12.9-11) — nằm trong cùng mockup Q-C1.

---

## 4. Mock Test — lịch · chấm · dời · huỷ · khôi phục · gửi duyệt

### 4.1 Luật áp

- **L4 (CHỐT):** trong **cùng chuỗi dời**: "-" lần 1 → dời sang tuần tiếp theo; "-" lần 2 → huỷ; áp **cả lịch MT tuần cũ** và "-" ghi **sau tuần thi**; MT hiện tại **giữ luồng gửi duyệt**. Mã đang lệch: sau tuần thi / MT cũ "-" = **"Không dự thi"** ngay, không dời, không đếm (`attempts.ts:2135-2136`, `absence.ts:975`, `shared/domain/vang.ts:11-16`) — chốt 11/10 bị L4 thay → **lệch phải sửa**.
- **L3 (CHỐT):** gỡ R11 "đợt hoàn tất" cho GVBM đúng ô; Huỷ điểm phải **khôi phục được**.
- **Giữ:** dời vượt MT sau bị chặn (08/10) · chưa tới tuần thi không nhập điểm (06/10) · lớp đã kết thúc không ghi "-" · Huỷ = Xóa ở Kế hoạch Test, có điểm thì không xoá (19/10-M6) · dời lịch MT chỉ QL (09/10; Admin VP xếp / dời, không huỷ / khôi phục).
- **"Gửi duyệt" PTA hiểu (v4b):** khi máy **không tự dời được** lần 1 → **thẻ "Dời lịch Test" gửi QL** (QL Duyệt / Từ chối / hết hạn). Đây là đường gửi duyệt duy nhất còn trên web; "Xin dời" chỉ còn route máy chủ, không nút.

### 4.2 Trạng thái một kỹ năng trong một lượt (tên đề xuất)

| Mã | Trạng thái | Ghi chú |
|---|---|---|
| S1 | Chưa xếp | sau Xóa lịch / Đặt tuần "Chưa xếp" |
| S2 | Chưa tới tuần | không ai nhập điểm |
| S3 | Chờ điểm (qua hạn: "quá hạn chấm") | hạn T4 tuần kế |
| S4 | Không có bài (Writing một task "-", chờ task kia) | — |
| S5 | Có điểm | **không còn khoá GV** sau "đủ điểm" (L3) |
| S6 | Vắng · chờ QL (thẻ dời) | đường gửi duyệt |
| S7 | Vắng · chờ xếp lại | QL "Xếp lại" |
| S8 | Đã dời do vắng | dòng phụ "dời từ W… · vắng lần n" |
| S9 | Đã huỷ · vắng 2 lần | QL quyết |
| S10 | Đã huỷ · QL từ chối dời / thẻ hết hạn | — |
| S11 | Không dự thi | **chỉ dữ liệu cũ** sau L4; liệt kê cho QL trước deploy |
| S12 | Bỏ khỏi đợt | không còn bắt buộc |

Cờ cấp lượt: **MT cũ** (tính lại sau **mọi** lần xếp / dời) · **Đủ điểm** (thay "Hoàn tất" — chỉ là trạng thái, bỏ câu "chỉ Quản lý sửa") · Lượt đã huỷ (dữ liệu cũ) · Chưa xếp.

### 4.3 Bảng chuyển trạng thái (từ v4b B2, sửa theo L3 + L4 + PTA 21/10 mục 5)

"Đếm" = số lần vắng trong chuỗi. Cột cuối: **khớp** = giữ · **SỬA** = mã lệch luật.

| # | Từ → Sang | Sự kiện (ai) | Điều kiện / hệ quả | So mã |
|---|---|---|---|---|
| T01 | S1 → S2/S3 | Xếp lịch (QL, Admin VP) | tuần đã qua: chỉ QL; cờ MT cũ tính lại | khớp |
| T02 | S2/S3 → tuần mới | Dời lịch (QL) | không vượt MT sau, không thẻ chờ; đếm giữ | khớp |
| T03 | S2 → S3 | tới T2 tuần thi | — | khớp |
| T04 | S3 → S8 / S6 / S9 | "-" / Vắng **trong tuần thi**, MT hiện tại (GV ô, GVCN, QL) | lần 1: tuần kế thi được → **S8** (máy dời, chuông GVCN + GVBM); không được / vướng → **S6** (thẻ QL); lần 2 → **S9** (chuông QL) | khớp |
| T05 | S3 → như T04 | "-" ghi **sau tuần thi**, MT hiện tại | tuần kế còn chạy → S8; đã hết hẳn / vướng → **S6** (tuần đích mặc định = tuần chưa bắt đầu gần nhất); lần 2 → S9 | **SỬA** (nay S11) |
| T06 | S3 (MT cũ) → S8 / S7 / S9 | "-" ở **MT cũ** | lần 1 → **S8 tại tuần đích Q-B3**, không thẻ; vướng MT sau → **S7**; lần 2 → S9; tính lại cờ MT cũ | **SỬA** (nay S11) |
| T07 | S4 → như T04–T06 | task W kia "-" hoặc có điểm | lần 1 dời **cả W**, điểm task kia đi theo (PTA) | **SỬA** (nay W không đủ sau tuần) |
| T08 | S3/S4/S8 → S5 | Nhập điểm | đã tới tuần | khớp |
| T09 | S6/S8/S9 → như trước khi gõ | Gỡ "-" (GV ô, GVCN, QL; S9 chỉ QL) | đếm −1, thẻ rút | khớp |
| T10 | S6 → S8 | QL Duyệt thẻ | **gửi duyệt như trước**; +1 | khớp |
| T11 | S6 → S10 | QL Từ chối (lý do bắt buộc) | — | khớp |
| T12 | S6 → S10 | thẻ hết hạn (CN tuần gửi) | — | khớp |
| T13 | S7 → S8 | Xếp lại / Dời lịch (QL) | +1; nút **chỉ hiện cho vai máy chủ cho** (sửa H15: GVCN FT thấy nút mà 403) | khớp + sửa nút |
| T14–15 | S9/S10 → S1 hoặc S2/S3 | QL **[Đặt tuần ▾]** (có lựa chọn "Chưa xếp") | gộp "Khôi phục → Chưa xếp" + "Khôi phục và đặt tuần"; đếm giữ (Q-B4) | khớp, gộp chữ |
| T16 | S9 → S12 | QL **[Giữ huỷ]** | = "Không mock lại" (một tên) | khớp, một tên |
| T17 | S9 → S6 | "Xin dời" | chỉ còn route → bỏ khỏi luồng (QL đã có Đặt tuần) | dọn |
| T18 | S2/S3/S5/S7 → S12 | **Bỏ khỏi đợt** (QL, FT) | có điểm → **cất điểm** (nay xoá) | **SỬA** (L3) |
| T19 | S12/S10 → S1/S2/S3 | Đưa lại vào đợt (QL) | có điểm cất → hỏi "Trả lại điểm cũ 6.5?" | thêm |
| T20 | S5 → S3 | Huỷ điểm (người sửa được ô, **gồm GVBM sau "đủ điểm"**) | điểm + nhận xét + nhóm nguyên nhân + GV chấm **cất**; dòng "Đã huỷ 6.5 · Khôi phục"; SOS / Case tính lại | **SỬA** (L3; nay xoá hẳn, GV bị khoá) |
| T20b | S3 (có điểm cất) → S5 | **Khôi phục điểm** (1 bấm) | hết hiệu lực khi đã nhập điểm mới | mới |
| T21 | S5 → S5 | Sửa điểm | GVBM đúng ô **mọi lúc** (lớp kết thúc: Q-B1); nhật ký, lý do tuỳ chọn | **SỬA** (L3; nay 403) |
| T22 | S5 → tuần mới | Dời lịch (QL) | điểm đi theo; cờ MT cũ tính lại | khớp |
| T23 | S5 → S2/S3 | Thi lại (QL) | điểm cũ vào Lịch sử | khớp |
| T24 | lượt → S1 | **Xóa lịch** (QL, Admin VP) | chặn khi có điểm / đã thi / thẻ chờ — câu mờ "Đã có điểm — dời tuần thay vì xoá"; Hoàn tác | khớp |
| T25 | lượt | Huỷ MT{n} | đã bỏ khỏi web (OV-15c); lượt huỷ cũ còn "Khôi phục MT" | khớp |
| T26 | lượt | Dời vượt MT sau | chặn (luật giữ); hộp đề nghị **"Dời cả MT{n+1} sang …"** xem trước hai đợt, lưu một lần (C — vào mockup để chủ SP xem) | khớp + gợi ý |
| T27 | lượt | mọi xếp / dời | cờ MT cũ tính lại — **thiếu** ở `applyMove` | **SỬA** |
| T28 | lượt | đủ điểm + qua CN | chỉ đổi trạng thái "Đủ điểm", **không khoá** | **SỬA** (L3) |
| T29 | lượt | lớp kết thúc | không ghi "-" (giữ); sửa điểm theo Q-B1 | giữ / Q-B1 |
| T30 | S11 (cũ) → S3/S5 | Gỡ "-" / nhập điểm | — | khớp |

**Phép kiểm (PTA):** một bảng → một tệp test (mỗi dòng T01–T30 dựng trạng thái trước bằng hàm máy chủ thật, kỳ vọng trạng thái sau · đếm · thẻ · chuông · Case); dòng **SỬA** viết theo đích mới (đỏ trước khi sửa). Hàm thuần `chuyenVang({lan, tuanThi, homNay, mtCu, vuong, laMt0})` 12 ca ngày (CN 23:59 / T2 00:00 giờ VN, tuần kế còn chạy / hết hẳn, MT cũ cách 2 / 3 tuần, vướng MT sau, MT0 vượt hạn chót).

### 4.4 Một hàm "-" cho mọi lối (gõ "-" · nút Vắng · ⋯ Vắng · Báo vắng)

| Ca | Lần 1 (đếm 0) | Lần 2 (cùng chuỗi) |
|---|---|---|
| MT hiện tại — trong tuần thi | tuần kế thi được → máy dời; không → thẻ QL | Đã huỷ · vắng 2 lần → QL quyết |
| MT hiện tại — "-" ghi sau tuần thi | tuần kế còn chạy → máy dời; hết hẳn / vướng → **thẻ QL** (gửi duyệt) | như trên |
| **MT cũ** | dời sang **tuần đích Q-B3**, không thẻ; vướng MT sau → Vắng · chờ xếp lại | như trên |
| MT0 (lớp thường lên FT) | **PTA hiểu MT0 là MT → theo L4** trong giới hạn MT0 (≤ T2 tuần 2 FT, luôn trước MT1); vượt → thẻ QL | như trên |
| Lớp thường (Progress / Final) | **ngoài L4** — giữ luật riêng (14/10-Q1, OV-11a) | — |

Nút trong hộp chấm luôn ghi **"Vắng"** (bỏ chữ đổi "Không dự thi" — `chuNutVang`). Đếm bước "GV ghi '-' muộn, em cần thi bù": nay 5+ bấm, 2 người (gỡ "-" → nhờ QL → QL đổi tuần) → **1 bấm** (máy dời) hoặc QL Duyệt thẻ (1).

**Q-B3 — MT cũ dời sang tuần nào** (PTA Plan quyết: hỏi đúng điểm này, nêu cả hai). Ví dụ: MT thi W1 JUL, hôm nay W3 SEP.

| Tình huống | (i) Tuần kế **của lịch cũ** (W2 JUL) | **(ii) Tuần kế tính từ hôm nay** (W4 SEP) — khuyến nghị PTA |
|---|---|---|
| S1 — nhập bù lịch sử: em vắng W1 JUL, **đã** thi bù W2 JUL, GV nay mới nhập | **"-" + nhập điểm W2: 1 bấm + gõ** | "-" → lịch W4 SEP → nhờ QL Dời lịch về W2 JUL (+3 bấm, 2 người) rồi nhập |
| S2 — em vắng thật, **chưa** thi bù | lịch W2 JUL (đã qua) → vẫn MT cũ, không hạn, **không ai nhắc** → dễ bị quên; QL phải dời tay (+3 bấm) | **1 bấm**, lịch đúng tuần sắp tới, hiện ở Kế hoạch Test, có hạn |
| Tạo lịch trong quá khứ | có | **không** |

Với MT cũ, tuần kế của lịch **luôn đã qua** → khuyến nghị (ii) "tuần kế tính từ hôm nay nếu tuần kế của lịch cũ đã qua" = (ii) cho mọi MT cũ. Chủ SP chọn.

**Q-B4 — "chuỗi dời" gồm gì.** Khuyến nghị **(a)**: chỉ các lần dời **do "-"** của cùng kỹ năng trong cùng lượt; QL dời tay / thẻ được duyệt **không tính và không xoá chuỗi**; Gỡ "-" trả lại lần đó; sau QL **[Đặt tuần]** từ trạng thái Đã huỷ, chuỗi **giữ** (v4b Q6 — "-" tiếp theo huỷ lại để QL quyết lần nữa). (b) mọi lần dời đều tính — phạt nhầm em QL dời vì lý do khác · (c) QL dời tay mở chuỗi mới — dời vô hạn được.

**[E] cần kiểm khi làm:** thẻ dời hiện ghi "Dời S · MT3 · **lần 2** … Hết 20/09 chưa duyệt thì … phần thi bị huỷ" (v4c, ảnh `b2-cv-yeucau-gv7-p1`) — xác nhận thẻ chỉ sinh ở **lần 1 không tự dời được** (đúng T04/T05), đổi chữ để không đọc thành "vắng lần 2"; loại thẻ đang mang nhãn "**Lịch thi**" (trùng thi thật — 11.1d) → "Dời lịch Test". Còn lối "Huỷ lượt" nào ngoài Kế hoạch Test không (X-28).

### 4.5 Phân biệt chữ — "huỷ lịch · huỷ MT · huỷ điểm · dời · gửi duyệt" (MP XIV.3)

| Chủ SP gọi | Chữ trên web (đề xuất) | Làm gì | Điểm | Ai | Đảo lại |
|---|---|---|---|---|---|
| dời | **Dời lịch** | đổi tuần một / nhiều kỹ năng | đi theo | QL, Admin VP (FT) | dời lại |
| dời (do vắng) | **Vắng** (máy dời) | "-" lần 1 → tuần đích | — | máy | Gỡ "-" |
| gửi duyệt | **Thẻ "Dời lịch Test" chờ QL** | lần 1 không tự dời được | — | máy gửi, QL quyết | — |
| huỷ điểm | **Huỷ điểm** | xoá giá trị một ô | **cất, Khôi phục được** | người sửa được ô | Khôi phục |
| (huỷ kỹ năng) | **Bỏ khỏi đợt** | kỹ năng không còn bắt buộc | cất | QL (FT) | Đưa lại vào đợt |
| huỷ (do vắng) | **Đã huỷ · vắng 2 lần** / **Đã huỷ · QL từ chối dời** | trạng thái sau "-" lần 2 / thẻ bị từ chối | — | máy → QL | Đặt tuần / Giữ huỷ |
| (không thi lại) | **Giữ huỷ** | thôi kỹ năng đó | — | QL | Đưa lại vào đợt |
| huỷ lịch | **Xóa lịch** (19/10-M6 "Huỷ = Xóa") | bỏ tuần mọi kỹ năng chưa thi | chặn khi có | QL, Admin VP | Hoàn tác / xếp lại |
| huỷ MT | (đã bỏ khỏi web) | — | — | — | "Khôi phục MT" cho lượt cũ |
| — | **Thi lại** | kỹ năng đã có điểm thi tuần mới | vào Lịch sử | QL | — |

Chữ "Huỷ" chỉ còn ở: Huỷ điểm · Đã huỷ (vắng 2 lần / QL từ chối) · Giữ huỷ. "Không dự thi" chỉ ở dữ liệu cũ. **PTA tự quyết ★** — khác 02 mục 4.7 #7 ở một chữ: 4.7 #7 dùng "**Huỷ kỹ năng**" thay C-036 "Đã huỷ phần thi", nhưng trong mã "Huỷ kỹ năng" lại là **nút** bỏ kỹ năng khỏi đợt (`CHU_THAO_TAC['bo-ky-nang']`) → một chữ hai nghĩa. Đề xuất: trạng thái = "Đã huỷ · vắng 2 lần", nút = "Bỏ khỏi đợt" (mục 10).

### 4.6 Luồng thao tác — một hộp một đợt (MP XIV.1 · V4B-08)

**Hiện trạng [ĐÃ KIỂM mã + mở hộp].** 4 thao tác cùng chữ "huỷ / xoá" khác nghĩa; **cùng trạng thái hai bộ nút** (hộp lịch "Khôi phục → Chưa xếp · Giữ huỷ" ↔ hồ sơ MT "Khôi phục và đặt tuần · Không mock lại"); Huỷ điểm **xoá luôn** nhận xét ≥ 10 ký tự + nhóm nguyên nhân + GV chấm; Khôi phục / Xếp lại từ hộp mở panel **chồng** lên hộp (TST-16).

| Đường thật (QL, Kế hoạch Test) | Nay | **A — một hộp, một bộ chữ, không mất kết quả (khuyến nghị)** | B — giữ hai nơi, đồng bộ chữ |
|---|---|---|---|
| Đ1 — điểm L nhập nhầm MT2, QL dọn rồi dời MT2 (đúng mô tả chủ SP "huỷ điểm → hồ sơ MT → khôi phục → mới chuyển lịch") | **≈ 14 bấm · 1–2 đổi trang · gõ lại 2 ô** | chip (1) → Dời lịch chọn tuần (2) → Lưu (1); điểm đi theo (T20 đã cho); lỡ Huỷ điểm → "Đã huỷ 6.5 · Khôi phục" (1) → **3–4 bấm · 0 đổi trang · 0 gõ lại** | ≈ 12, vẫn mất điểm khi huỷ |
| Đ2 — em vắng 2 lần, QL cho thi bù | ≈ 6 bấm (hoặc 4 + đổi trang), 2 bộ chữ | dòng "Đã huỷ · vắng 2 lần — [Đặt tuần ▾] · [Giữ huỷ]" → **3 bấm** | 6 |
| Đ3 — GV ghi "-" muộn, em cần thi bù | 5+ bấm, 2 người | **1** (máy dời, 4.4) | 5+ |

**A gồm:** mọi thao tác lịch / trạng thái của một em × một đợt **chỉ ở hộp một đợt** — hồ sơ MT, Lộ trình hồ sơ HV, lưới đều mở **cùng hộp** (bỏ bộ nút riêng ở hồ sơ MT) · Huỷ điểm / Bỏ khỏi đợt **cất điểm** · dời vượt MT sau: gợi ý "Dời cả MT{n+1}" một lần lưu · nút chỉ hiện khi máy chủ cho · bộ chữ 4.5 · không panel chồng hộp. **Ưu tiên A** (PTA tự quyết); đổi bố cục hộp → **cần mockup**. **[CẦN ẢNH]** đúng đường chủ SP đã gặp (trang · từng bước · trạng thái ô / kỹ năng; bản chính 18/10 còn "Huỷ MT{n}") — để đếm lại Đ1.

---

## 5. Vi phạm → GVCN lưu xử lý → TVV ghi kết quả → theo dõi

### 5.1 Luật

- **L1 (CHỐT):** GVCN lưu xử lý vi phạm → **ngay** sinh việc TVV ghi nhận kết quả xử lý; không đợi bước duyệt khác. **PTA Plan 21/10: luật 1 thắng khuyến nghị v4b Q1** — kể cả lần xử lý **đang chờ QL duyệt** (WL 3 · Meeting CX/GĐCN riêng · Đình chỉ · Khác · không tăng bậc). Không đề xuất "sinh khi ghi Đã thực hiện".
- **L2 (CHỐT):** hạn **5 ngày lịch**, gồm T7, CN; chỉ làm rõ giờ hết hạn (5.4).
- **L3 (CHỐT):** có quyền thì sửa sau lưu, có lịch sử; giữ duyệt bắt buộc.
- **L5 (CHỐT 21/10):** GVCN **thu hồi** lần xử lý đã lưu, hoặc xử lý **không tăng bậc** → gửi QL duyệt, **lý do bắt buộc**. Thu hồi được duyệt → "**Đã thu hồi**", giữ dòng + lịch sử; bỏ đường xoá thẳng `xoaXuLy` (`server/src/yThuc/xuLy.ts:622-638`). "Không tăng bậc" đi đường "Đề xuất QL duyệt" sẵn có.
- **Giữ nguyên:** thang 6 bậc, bậc kế máy điền, Ghi nhận bị chặn khi bắt buộc, WL 3 / ngoài thang qua QL 5 ngày, hạn 5 ngày của GVCN, thẻ Báo QL khi quá hạn, Phối hợp SOS ≠ vi phạm (Rulebook §19, §20.3).
- **Hiện trạng [ĐÃ KIỂM mã]:** không có gì cho TVV (TVV chỉ đọc Ý thức; GVCN tự ghi "Đã gửi Report cho PH qua Zalo" trong ô mô tả) → **lệch L1, L2**; xoá thẳng → **lệch L5**; không có đường không tăng bậc → **thiếu**.

### 5.2 Luồng (sau)

```
GV ghi vi phạm ──► GVCN (hoặc QL) lưu xử lý ──┬─► [ngay] Việc TVV "Ghi kết quả xử lý · Report 2 · {em}"  hạn = ngày lưu + 4, 23:59
                                               │        (lần cần QL duyệt: dòng ghi "chờ QL duyệt" — không chặn TVV)
                                               ├─► QL duyệt / từ chối (nếu ngoài thang / không tăng bậc) ──► việc TVV: 5.3
                                               └─► chân panel GVCN: "✓ Đã lưu · đã giao TVV {tên} · hạn 18/09"
TVV ghi kết quả (Đã báo PH / Chưa liên hệ được · cách · PH phản hồi) ──► dòng phụ ở ô "Thang" (Ý thức lớp / HV)
      │                                                                   ──► chuông GVCN khi "PH có ý kiến khác" / "Không liên hệ được"
      └─► Theo dõi: Nhật ký em (Vi phạm → xử lý → kết quả TVV) · Phân tích › Ý thức "Đã báo PH n/m" · Excel Ý thức
GVCN xin thu hồi / không tăng bậc ──► thẻ Chờ duyệt (Ý thức) kèm lý do ──► QL duyệt → "Đã thu hồi" (giữ dòng) / từ chối → giữ nguyên
```

### 5.3 Khi nào sinh / đổi / đóng việc TVV

| Sự kiện (ai) | Việc TVV | Ghi chú |
|---|---|---|
| Xác nhận xử lý bậc thang (GVCN hoặc QL; một em hay "Chọn nhiều") | **sinh ngay**, một việc / em / lần xử lý | L1; QL lưu thay cũng là "lưu xử lý" (PTA) |
| Gửi Đề xuất QL duyệt (WL 3, Meeting, Đình chỉ, Khác) hoặc "Không tăng bậc" | **sinh ngay**; dòng 2 ghi "chờ QL duyệt" | L1 thắng v4b Q1 (PTA 21/10); TVV tự chọn chờ hay báo, hạn vẫn chạy |
| QL Duyệt | giữ; bỏ chữ "chờ QL duyệt" | — |
| QL Từ chối · GVCN Rút đề xuất còn chờ · QL Duyệt thu hồi · QL tự thu hồi | **Q-D1**: TVV chưa ghi → **tự huỷ kèm lý do**; đã ghi → giữ bản ghi + nhãn "Lần xử lý đã bị từ chối / thu hồi" + chuông TVV "để biết" (không sinh việc "báo lại PH") | rút đề xuất xử lý như từ chối (PTA, X-51) |
| GVCN gửi Thu hồi… (đang chờ QL) | việc **chạy tiếp**; dòng ghi "GVCN đang xin thu hồi" | lần xử lý còn hiệu lực tới khi QL duyệt |
| GVCN ghi "Đã thực hiện" (sau duyệt) | không sinh mới (đã sinh lúc gửi) | khác v4b (do luật 1) |
| GVCN "Chưa thực hiện" (bỏ bấm nhầm) | **giữ** — biện pháp vẫn được duyệt | khác v4b E5 (PTA) |
| Sửa ngày / người / mô tả / vi phạm của lần xử lý (L3) | giữ, **hạn không đổi**; TVV đã ghi → chuông TVV "nội dung đã sửa — kiểm lại với PH" | — |
| Ghi nhận · Bỏ ghi nhận · Khai bậc HS cũ | không sinh | không phải lần xử lý |
| Em chuyển lớp | việc theo em; hạn không đặt lại | khác hạn GVCN theo lớp (M-08) |
| Em Tạm dừng | ẩn, dừng hạn; quay lại → hạn = max(ngày lưu, ngày quay lại) + 4 | T65 |
| Em Lưu trữ / Kết thúc học | chưa ghi → đóng "Em đã nghỉ"; đã ghi → giữ | — |
| Lần xử lý trước ngày bật tính năng | không sinh | tránh dồn quá hạn giả |
| Bấm nhầm ngay sau lưu | **không có Hoàn tác** — dùng Thu hồi qua QL | 02 mục 4.7 B15 (luật 5) |

### 5.4 Hạn — PTA tự quyết (L2 cho phép làm rõ giờ hết hạn)

- **Hạn = ngày lưu (giờ VN) + 4, hết 23:59** — cùng quy ước "n ngày liên tiếp, tính cả ngày đầu" đang dùng cho hạn 5 ngày của GVCN (`hanTheoNgay`, Q27-5). Tính theo **lần lưu đầu**; sửa sau không dời hạn; T7, CN luôn tính.
- Ví dụ: lưu **T2 14/09/2026 10:00 → hết 23:59 T6 18/09/2026**, quá hạn từ T7 19/09 · lưu T5 15/10 16:20 → hết 23:59 T2 19/10 (gồm T7 17/10, CN 18/10) · lưu 23:30 T6 16/10 → hết 23:59 T3 20/10 (đếm theo ngày VN, không lệch UTC).
- Nhãn trên dòng: "còn 4 ngày" / "Hôm nay" / "⚠ quá hạn 2 ngày"; trong chi tiết ghi giờ chính xác "hết 23:59 18/09" (hạn chỉ ghi ngày, không thứ — 19/10-M6).
- Nếu chủ SP muốn đủ 5 × 24 giờ: đổi thành ngày lưu + 5 — **một hằng số**. Đưa vào danh sách "PTA tự quyết — phản đối nếu không đúng". ⚠ Ví dụ trong ghi chú PTA ("T2 14/09 → **CN** 18/09") và v4b ("T5 15/10 → **CN** 19/10") ghi nhầm thứ: 18/09/2026 là **thứ Sáu**, 19/10/2026 là **thứ Hai**.

### 5.5 Form TVV — ba phương án (MP XII.2: "thực tế đã xử lý như thế nào, kết quả ra sao, phụ huynh phản hồi thế nào")

Đầu form (chỉ đọc — **không nhập lại** dữ liệu GVCN): "**Report 2** · 3 vi phạm (BTVN 07/10, 09/10 · Đi muộn 10/10) · GVCN Trần Ngọc Hà lưu 14/09 10:00 · hạn 18/09" · nội dung GVCN · "PH: {tên} ({quan hệ}) · {SĐT} [Gọi]" (thiếu SĐT → ô thêm ngay trong form, không sinh việc riêng).

| | F1 "Một câu" | **F2 "Bốn hàng chip" (khuyến nghị)** | F3 "Kịch bản báo PH" |
|---|---|---|---|
| Ô | Đã báo PH / Chưa liên hệ được · ghi chú bắt buộc | ① **Liên hệ PH** [Đã báo PH · Chưa liên hệ được] · ② **Cách + ngày** [Gọi · Zalo / nhắn · Gặp trực tiếp · GVCN đã báo trực tiếp] · ngày (`ONgay`, mặc định hôm nay, ≥ ngày GVCN lưu, ≤ hôm nay) · ③ **PH phản hồi** [Đồng ý phối hợp · Có ý kiến khác] (ghi chú bắt buộc khi "ý kiến khác") · ④ **Kết quả / ghi chú** + tệp — tuỳ chọn | F2 + danh sách nội dung phải báo, tick "Đã báo đủ" |
| Ca thường ("đã gọi, PH đồng ý") | 3 bấm + gõ ≥ 10 ký tự | **3 bấm, không gõ** (Đã báo · Đồng ý · Lưu; "Gọi" + hôm nay mặc định) — +1 nếu chưa chọn dòng | 4–5 |
| Dùng cho báo cáo / chuông | không đếm được | đếm "Đã báo PH n/m"; chuông GVCN khi ý kiến khác | như F2 |
| Nhược | không biết PH phản ứng | nhiều ô hơn (gom 1 hàng mỗi ý) | tick vô nghĩa |

Ánh xạ ba ý của chủ SP: "đã xử lý thế nào" → ① ② · "kết quả ra sao" → ① + ④ · "PH phản hồi thế nào" → ③. Thêm link **"＋ Thực tế khác nội dung GVCN"** mở một ô ghi chú (0 bấm ở ca thường) — để TVV ghi khi thực tế khác với điều GVCN đã lưu. **Ưu tiên F2** (PTA tự quyết). Tên việc **"Ghi kết quả xử lý · Report 2 · {em}"**, nút "Ghi kết quả" — giữ ý chữ của chủ SP nhưng **tránh chữ "Ghi nhận"** (đã là tên thao tác GVCN "Ghi nhận vi phạm mới" — một khái niệm một tên). Một em có ≥ 2 lần xử lý chưa ghi → một dòng, **một form ghi chung**, mỗi lần một bản ghi.

### 5.6 Trạng thái việc TVV (một tên mỗi trạng thái, chữ + ký hiệu)

`Chờ ghi kết quả` (mở) → `Chưa liên hệ được · lần n` (mở) → `Đã báo PH · dd/mm` hoặc `Không liên hệ được` (đóng) · `Đã huỷ · {lý do}` (hệ thống: từ chối / thu hồi / em nghỉ — khi chưa ghi). **Quá hạn** = đang mở và hôm nay > hạn → chữ cam + ⚠ (không chip nền). Sau khi đóng: TVV / QL **sửa được mọi lúc** (L3), nhật ký trước → sau; "Không liên hệ được" sửa thành "Đã báo PH" khi liên hệ được muộn.

### 5.7 Người được giao

| Ca | Người giữ việc | Ghi chú |
|---|---|---|
| Mặc định | **TVV phụ trách em** (`students.consultant_user_id`, tài khoản hoạt động, cùng chi nhánh) | — |
| Em chưa có TVV / tài khoản TVV khoá | **QL chi nhánh**; dòng ghi "Chưa có TVV · Gán TVV" | **Q-D3** (PTA 21/10 khuyến nghị) |
| Gán / đổi TVV khi việc đang mở | việc đi theo TVV mới, **hạn giữ**; kết quả đã ghi giữ tên người ghi | tính khi đọc, không migrate |
| Ai ghi được | TVV chi nhánh của em + QL / QT (thay khi cần) | GV / GVCN chỉ xem (máy chủ trả 403) |
| "Chọn nhiều" 3 em | 3 việc; danh sách TVV gom theo lớp | — |
| CX | không nhận; xem được | — |
| Việc TVV quá hạn | chỉ chuông tự động cho người giữ; QL thấy ở Công việc › Việc của người khác | **không** thêm thẻ Báo QL (Q-D3) |

### 5.8 Chưa liên hệ được phụ huynh

| | (a) Việc mở tới khi liên hệ được (02 nháp Q-D3 a) | **(b) Ghi lần thử; được "Kết thúc · không liên hệ được" (khuyến nghị — v4b Q2)** | (c) Tự đóng khi hết hạn |
|---|---|---|---|
| Đầu ra | có thể không bao giờ có | luôn có: đã báo, hoặc "không liên hệ được" + lý do | không rõ ai đã thử gì |
| Cảnh báo | việc quá hạn mãi → mù cảnh báo | quá hạn chỉ khi chưa thử / chưa kết thúc | mất cảnh báo |
| Người cần biết | không ai được báo | **GVCN nhận chuông** (tự quyết bước tiếp: gặp trực tiếp, nhờ CX) | không |
| Bấm | lần thử: chip [Không nghe máy · Chưa trả lời tin · Sai số] + Lưu lần thử (2) | như (a) + nút phụ "Kết thúc · không liên hệ được" (ghi chú bắt buộc) | — |

**Ưu tiên (b)** — có đầu ra, không thêm điều kiện chặn (không bắt "đủ n lần thử"), sửa được sau (L3). → **Q-D3** (02 nháp đang khuyến nghị (a) ở phần này — mục 10).

### 5.9 Thu hồi / xử lý không tăng bậc (L5 · V4B-02)

| | **TH-A / KB-A (khuyến nghị)** | TH-B / KB-B |
|---|---|---|
| Thu hồi | nút **"Thu hồi…"** thay "Xoá lần xử lý" (chỉ lần mới nhất của chuỗi — giữ thứ tự) → hộp neo "Lý do thu hồi *" → Gửi QL. Thẻ Chờ duyệt (Ý thức): "Thu hồi Report 2 · {em} · lý do · **Nếu duyệt:** bậc về Report 1, 3 vi phạm về chưa xử lý". Đang chờ: lần xử lý **vẫn tính**, dòng "⏳ Chờ QL duyệt thu hồi". Duyệt → **"Đã thu hồi"** (giữ dòng, không tính bậc / thống kê, vi phạm tính lại). Từ chối (lý do) → giữ nguyên. **QL tự thu hồi** = làm thẳng, lý do bắt buộc, nhật ký "tự duyệt" | xoá vật lý sau khi QL duyệt — mất lịch sử trên web, trái L3 |
| Không tăng bậc | trong panel Xác nhận xử lý, cạnh "Bậc xử lý: WL 1" có link **"Không tăng bậc…"** → chọn **bậc hiện tại (lặp)** hoặc bậc thấp hơn → lý do → Gửi QL (đi đúng đường Đề xuất sẵn có; bậc em không đổi vì bậc hiện tại = max) | dùng "Khác" gõ tên + bắt tệp — mất bậc thật trong thống kê |
| Bấm | thu hồi: GVCN 2 + lý do, QL 1 (nay 2 bấm xoá thẳng, không ai duyệt — sai luật) · không tăng bậc: GVCN 3 + lý do, QL 1 (nay không làm được trên web) | — |
| Bằng chứng | **lý do bắt buộc, tệp tuỳ chọn** (đúng lời chủ SP "kèm lý do"; khác WL 3 bắt tệp) | — |

Kèm (PTA): GVCN bấm nhầm bậc kế → **một** thẻ "Thu hồi" có ô "Ghi lại thành xử lý không tăng bậc (Report 1)" (thay 2 thẻ) · **bớt vi phạm** khỏi lần xử lý = **sửa** (L3, không duyệt, bậc không đổi) · rút một **đề xuất còn chờ** không phải thu hồi (chưa có hiệu lực — X-51) · máy chủ chặn GVCN gọi xoá (403 "Gửi QL thu hồi"). Rulebook §20.3 "bậc không lùi" → lùi khi QL duyệt thu hồi (sửa chữ).

### 5.10 QL từ chối / duyệt thu hồi **sau khi** việc TVV đã sinh — Q-D1 (biên luật duy nhất còn hỏi ở luồng này)

| | **(a) chưa ghi → tự huỷ kèm lý do; đã ghi → giữ + nhãn (khuyến nghị PTA 21/10)** | (b) giữ việc, TVV ghi "không thực hiện" | (c) huỷ ngay kể cả đã ghi (ghi chép vẫn trong lịch sử) |
|---|---|---|---|
| TVV | không phải ghi việc không xảy ra; không mất gì đã ghi | +1 việc vô nghĩa (3 bấm) | mất bản ghi trên màn |
| PH đã được báo một biện pháp bị từ chối | TVV nhận chuông "để biết"; quyết báo lại ngoài luồng (không sinh việc mới) | như (a) | không ai biết đã báo |
| Thống kê "Đã báo PH" | bản ghi giữ, gắn nhãn | thêm dòng nhiễu | thiếu |

### 5.11 Hiển thị — không lặp dữ liệu (Ý thức A ở hồ sơ lớp — 11.3; hồ sơ HV — 11.4)

| Nơi | Hiện gì | Phương án khác (không chọn) |
|---|---|---|
| **Hồ sơ lớp › Ý thức** (một bảng theo em) | ô "Thang" thêm **một dòng phụ**: "PH: chờ TVV · hạn 18/09" · "⚠ TVV quá hạn 2 ngày" · "PH ✓ 15/09" · "PH ✗ không liên hệ được" (chữ + ký hiệu); mở rộng hàng → lần xử lý + kết quả TVV đủ chữ | cột riêng "PH" (bảng 7 cột thêm cột, phần lớn trống) · chỉ ở Nhật ký (khuất) |
| **Hồ sơ HV › Ý thức** | cùng thành phần, mở sẵn; thanh "Việc của tôi" đầu hồ sơ ghi người giữ việc (TVV) + hạn; **Nhật ký** hiện chuỗi Vi phạm → GVCN xử lý → TVV kết quả | — |
| **Panel Xác nhận xử lý (GVCN)** sau lưu | "✓ Đã xác nhận · TVV {tên} nhận việc · hạn 18/09" (hoặc "Chưa có TVV — việc về Quản lý") — 0 bước thêm; placeholder mô tả đổi thành nội dung để TVV báo ("Report 2 — bỏ BTVN 3 buổi; nhờ PH kiểm tra vở") | — |
| **Tổng quan TVV** | hàng đợi "Việc của bạn" (dáng B), nhóm Kết quả xử lý vi phạm đầu; 375 danh sách → chi tiết toàn màn, nút [Gọi PH] | — |
| **QL** | không thêm ô số Tổng quan; việc QL giữ (em chưa TVV) vào "Cần bạn quyết"; việc của TVV xem ở Công việc › Việc của người khác | thêm ô "TVV quá hạn" (thêm số, trái 10.2) |
| **Báo cáo** | Phân tích › Ý thức (Y1) bảng "Xử lý đã làm trong kỳ theo loại" + cột **"Đã báo PH n/m"**; Excel Ý thức sheet xử lý + 3 cột (Báo PH · ngày · PH phản hồi) — làm cùng màn Phân tích | — |

### 5.12 Điều kiện dữ liệu — gán TVV trước khi bật (PTA 21/10 mục 11)

Demo **4/129** em có TVV; bản chính chưa gán TVV cho tới OV-2b; cột chữ `consultant_name` (từ Thêm HV) **không** phải tài khoản. Trình tự: (1) lệnh **chỉ đọc** trên bản chính: số em đang học có / chưa có TVV theo chi nhánh + số lần xử lý / tuần + số em có SĐT PH **[CẦN DỮ LIỆU]** → (2) QL gán TVV qua "Sửa cả lớp" (cột TVV đã có) → (3) PR máy chủ sinh việc **sau cờ tắt** → (4) bật cờ **cùng lúc** với màn Tổng quan TVV (không thì việc sinh ra mà không ai thấy, quá hạn âm thầm) → (5) lần xử lý trước ngày bật không sinh việc.

**Phép kiểm chính (v4b K1–K12, sửa theo luật 1):** lưu bậc thang → 1 việc, hạn = ngày lưu VN + 4, người giữ = TVV · lưu 23:30 ngày D → hạn D+4 · **gửi đề xuất WL 3 → việc sinh ngay**, dòng "chờ QL duyệt" · QL từ chối khi TVV chưa ghi → "Đã huỷ · QL từ chối" · đã ghi → giữ + nhãn + chuông · em không TVV → QL; gán TVV → đổi người, hạn giữ · Ghi nhận / Khai bậc → 0 việc · Tạm dừng → ẩn, không quá hạn · GV / GVCN ghi kết quả → 403 · 2 lần xử lý cùng em → 1 lần ghi, 2 bản ghi · quá hạn → 1 chuông (chống trùng). Ảnh cặp Tổng quan TVV 1440 tối + 375 sáng (rỗng · có việc · quá hạn · vừa xong) — **màn mới, cần mockup**.

---

## 6. Sửa sau lưu · khoá cứng · lịch sử / hoàn tác / khôi phục

### 6.1 Nguyên tắc (L3, L5, MP III.9, XIII)

Có quyền nhập ô / bản ghi → sửa được sau lưu, có "ai · lúc · trước → sau". **Giữ duyệt bắt buộc** (Target, lộ trình GVCN đề xuất → QL; WL 3 / ngoài thang; thu hồi / không tăng bậc). "Được sửa" ≠ "được bỏ duyệt". Khoá chỉ giữ khi có **lý do nghiệp vụ / toàn vẹn**, và khi chặn phải **nói lý do + bước tiếp**.

### 6.2 Rà 29 khoá (V4B-05) — nới 11 · giữ 15 · đã nới 2 · thêm duyệt 1

| # | Khoá | Đề xuất | Ghi chú |
|---|---|---|---|
| H01 | GVBM không sửa / xoá điểm sau "đợt hoàn tất" (R11 — **ảnh v4-4**) | **NỚI** | "hoàn tất" phụ thuộc điểm **mọi** môn → GV bị khoá vì người khác nhập xong; không có bước duyệt nào ("nhờ QL hiệu chỉnh" ngoài web) |
| H02 | MT cũ khoá 7 ngày sau lần nhập cuối | **NỚI** | — |
| H03 | Lớp đã kết thúc: chỉ QL sửa điểm | **Q-B1** | v4b đề xuất nới có lý do bắt buộc; 02 nháp khuyến nghị giữ (khoá vì đóng hồ sơ) |
| H04 | Huỷ điểm xoá nhận xét + nhóm + GV chấm, không khôi phục | **THÊM Khôi phục** (cất điểm) | 1 bấm |
| H05 | Bỏ khỏi đợt có điểm → xoá điểm | **CẤT điểm** | "Đưa lại vào đợt" hỏi trả điểm |
| H08 | Kỹ năng đã huỷ không đổi tuần thẳng | **NỚI** (hộp lịch: đặt tuần = đưa lại + tuần) | — |
| H14 | "-" sau tuần / MT cũ = Không dự thi | **BỎ** (L4) | mục 4 |
| H15 | GVCN FT thấy "Xếp lại bài vắng" mà 403 | **SỬA** nút theo quyền máy chủ | lỗi (D) |
| H20 | Lần xử lý Ý thức không xem được lịch sử | **THÊM** loại "y-thuc" vào `/lich-su` + Nhật ký trong tab | cần cho L3, L5, kết quả TVV |
| H21 | Sửa chữ lần ghi KQ PA khi Case đã hoàn thành phải "Mở lại" | **Q-B1** (khoá vì đóng Case — cùng nhóm "đóng hồ sơ") | v4b: nới phần chữ, đổi lựa chọn vẫn qua Mở lại |
| H28 | Tutor sửa nhận xét chỉ trong 24 giờ | **NỚI sửa** (xoá vẫn 24 giờ) + lưu trước → sau | L3 — khoá "vì đã lưu" (PTA, mục 10) |
| H16 | **GVCN xoá thẳng lần xử lý** (ngược: thiếu duyệt) | **THÊM duyệt QL + lý do** | L5 — 5.9 |
| Giữ (15) | H06 Xóa lịch khi có điểm · H07 dời vượt MT sau · H09 thẻ dời đang chờ · H10 gỡ "-" đã huỷ chỉ QL · H11 lớp kết thúc không "-" · H12 chưa tới tuần thi · H13 em Lưu trữ · H17 sửa bậc đã khai chỉ QL · H18 thu hồi chỉ lần mới nhất · H19 Ghi nhận khi bắt buộc · H22 sửa KQ PA cũ / PA có KQ / Case có PA / PA hệ thống · H23 PA đã duyệt không hoàn tác · H25 lệnh chuyển lớp đã thi hành · H26 lớp có Test không đổi chương trình · H27 Target / lộ trình qua QL duyệt | **GIỮ** | mỗi khoá giữ có câu "vì sao + làm gì thay" (vd H06 "Đã có điểm — dời tuần thay vì xoá") |
| Đã nới (2) | H24 sửa Mini Test (OV-7a) · H29 báo cáo tuần quá hạn / góp ý lớp kết thúc (OV-13h) | — | Rulebook §20.6 còn ghi "chỉ QL" → sửa chữ |

**Q-B1 (khoá "đóng hồ sơ" còn giữ không)** — khuyến nghị 02 (a): giữ "lớp đã kết thúc → chỉ QL sửa" và "hồ sơ Lưu trữ khoá" (khoá vì đóng hồ sơ, không phải "vì đã lưu"; QL vẫn sửa được, có lịch sử); tệp này đề xuất **gộp H21 vào cùng câu**. Phương án khác: (b) bỏ cả hai · (c) lớp kết thúc: GV đúng môn sửa thêm 2 tuần / sửa có lý do bắt buộc (v4b).

### 6.3 Cơ chế lịch sử / hoàn tác / khôi phục (MP III.9, XIII.2–3)

| | **H-A — nhật ký có sẵn + "Lịch sử" gập tại chỗ + Khôi phục cho dữ liệu đắt + Hoàn tác ngắn (khuyến nghị)** | H-B — hoàn tác nhiều bước kiểu Google Sheets | H-C — chỉ trang `/lich-su` |
|---|---|---|---|
| Xem "ai · lúc · trước → sau" | ngay trong hộp / panel (khối ④ gập) — 1 bấm | có | đổi trang + lọc (3–4 bấm) |
| Lấy lại điểm đã huỷ | **Khôi phục 1 bấm** | Ctrl+Z (dễ đảo nhầm thao tác người khác) | gõ lại tay |
| Chi phí | thấp (nhật ký đã đủ cho điểm, HV, lớp, thi thật) | rất cao; MP nói không cần | thấp nhưng không khôi phục |

**Áp theo loại dữ liệu (PTA):**

| Dữ liệu | Sửa sau lưu | Lịch sử ở đâu | Hoàn tác / Khôi phục |
|---|---|---|---|
| Điểm mọi Test | người nhập ô + QL; lý do tuỳ chọn (lớp kết thúc: Q-B1) | "Lịch sử" trong hộp chấm + `/lich-su` | **Khôi phục điểm** sau Huỷ điểm; không hoàn tác cả lô (12.2 đã bỏ) |
| Lịch MT | QL (Admin VP xếp / dời) | hộp một đợt › Lịch sử | Hoàn tác Xóa lịch (có); Đặt tuần / Giữ huỷ |
| Lần xử lý Ý thức | sửa chi tiết thẳng (L3); thu hồi / không tăng bậc qua QL (L5) | **thêm** loại "y-thuc" + Nhật ký trong tab | **không** Hoàn tác sau lưu (21/10-YT) |
| Kết quả TVV · Phối hợp SOS | TVV / QL · GVCN như nay | loại "y-thuc" | Phối hợp: "Đưa lại Cần xử lý" (có) |
| Case / PA | theo luật Case (H22 giữ) | ngăn Case | — |
| Thông tin HV · Target · lộ trình | theo quyền; Target / lộ trình qua QL (H27) | hồ sơ HV › Lịch sử | — |
| Nhận xét Tutor | người ghi, mọi lúc (H28) | **thêm** trước → sau (nay chỉ `sua_luc`) | xoá trong 24 giờ |
| Quyết định duyệt | QL | Hộp duyệt đầy đủ › Đã xử lý | **Hoàn tác 8 s** = gửi trễ (trong 8 s chưa ghi — mockup 3, X-47); sau đó giữ luật không hoàn tác (H23) |

### 6.4 Sửa dữ liệu ĐÃ được duyệt — Q-B2

Ví dụ: PA đã duyệt, xử lý WL 3 đã duyệt, Target đã duyệt. Khuyến nghị 02 (a): sửa **đúng phần đã được duyệt** (loại PA, bậc xử lý, Target) → gửi duyệt lại; sửa chi tiết (ghi chú, ngày, người dạy) → lưu thẳng + lịch sử. (b) mọi sửa đều duyệt lại — thêm việc QL vô nghĩa · (c) không duyệt lại, chỉ lịch sử + báo QL — biến "được sửa" thành "bỏ duyệt" (trái L3).

### 6.5 Ảnh v4-4 — Progress Test sau khi sửa

GV nhập nhầm thứ Sáu, thứ Hai phát hiện: **nay** không tự sửa được → nhắn QL ngoài web → QL tìm lớp / bài / tuần (~6–8 bấm) → sửa · **sau** GV bấm ô → hộp chấm → sửa → Lưu (**2–3 bấm**, có nhật ký). Chip "Đã hoàn tất" → "**Đủ điểm**" (không còn nghĩa khoá). Hệ quả đã có sẵn vì QL vẫn sửa được: SOS / Case / PA quy chế / Báo PH tính lại; "Đúng hạn" ở Phân tích GV **không đổi** (giữ thời điểm nhập đầu). Không cần mockup (đổi quyền + chữ).

---

## 7. SOS / PA · Lịch thi · Phân tích · Xuất Excel · Tutor

### 7.1 SOS / PA — làm tại chỗ (MP IV.3–4, III.5 · 10.2–10.3 · v1-tong-quan Phần 3, 5)

**SOS ở bảng "Lớp cần chú ý"** — nay vùng bấm chỉ là chữ số **8 × 12 px**, panel chỉ ra tên + lớp.

| "Lớp nào có SOS 3, em nào, có PA chưa" | S-A panel phải, nội dung giàu | **S-B mở rộng ngay dưới hàng lớp (khuyến nghị)** | S-C sang Đang SOS lọc lớp |
|---|---|---|---|
| Bấm · đổi trang | 1 · 0 | **1 · 0** | 1 · 1 (+1 quay lại) |
| Bối cảnh | phủ nửa bảng — mất so sánh lớp | giữ — lớp khác vẫn thấy | rời trang |
| Thành phần | panel mới | **cùng dòng em với Đang SOS** | trang có sẵn |

**Cả ô SOS (3 số + nền ô) là một nút** ≥ 40 / 44 px → hàng lớp mở rộng, lọc sẵn "SOS" (SOS 3 → 1), chip lọc `Tất cả · SOS · Case · Chưa điểm · Chưa lịch`; mở lớp khác thì lớp cũ gập; URL giữ. Mỗi em: tên ↗ · `ChipSos` kèm kỹ năng ("tạm" nếu tạm) · MT · tuần ↗ · Case / PA (một trong 5 trạng thái) · việc tiếp + hạn · **một nút theo quyền**. Chip SOS bấm = hộp "Vì sao SOS" một mẫu toàn web.

**Thêm PA tại chỗ** (phương án chủ SP MP IV.3 — X-39):

| | Chủ SP: nút trên dòng em, mở rộng tại chỗ **ở mọi nơi** | **Theo độ rộng (khuyến nghị)**: dưới dòng ở bảng rộng · khung phải ở hàng đợi hẹp | Panel ở mọi nơi (nay) |
|---|---|---|---|
| Bấm cho 1 Case | 3–4 | **3–4** (hàng đợi: tự sang Case kế) | 5–7 |
| Panel phủ | 0 | **0** | 1 |
| Danh sách hẹp 520–560 px | form 500–560 px đẩy dòng dưới, trang nhảy, **che tiêu đề** (đúng lỗi ảnh v4-1, v4-3) | khung phải — không đẩy danh sách | — |
| Bảng rộng 1 400 px | form gọn 2 hàng ~220 px | như cột trái | — |

**Ưu tiên theo độ rộng** — giữ đúng ý chủ SP ở nơi nó hợp (Lớp cần chú ý mở rộng, Đang SOS, hồ sơ lớp), dùng khung phải ở hàng đợi; **cùng một form, cùng thứ tự ô, cùng phản hồi** "✓ Đã thêm PA · Hoàn tác". Form: Loại PA thành chip 2 nhóm (Bạn tự làm được · Cần QL duyệt) · Nội dung · Người · Bắt đầu · bối cảnh (nguyên nhân + điểm hụt) **trước** form. **PTA tự quyết** (02 X-39).

**Case quá hạn:** QL — nhóm "Case quá hạn chốt PA" ở hàng đợi Tổng quan (tự sang Case kế: 5 Case 25–30 → 11–16 bấm); GV — nhóm Case học thuật ở Công việc; từ số "Case chưa chốt PA ⚠" ở Phân tích / hồ sơ lớp → **panel C** (dòng = việc + em + ⚠, bấm mở đúng việc — mẫu tốt có sẵn, 12.4).

### 7.1b Tạo Case nhiều kỹ năng trong một panel (FB-4-35 · 21/10-CASE — ĐÃ CHỐT · agent v4d)

**Đã chốt:** GV chọn nhiều kỹ năng, tạo cùng lúc trên một panel. **Luật giữ:** mỗi kỹ năng **một Case** (một em × một hạng mục); tên ≥ 6, mô tả ≥ 15, nhóm nguyên nhân của đúng kỹ năng — bắt buộc từng Case; người phụ trách = GV dạy kỹ năng đó, chưa có thì GVCN (`suggestCaseOwner`); hạn có PA 5 / 3 ngày theo mức; trùng hạng mục → gợi ý ghi vào Case đang có (7.13); Case chờ xác nhận cùng kỹ năng → làm ở Case đó (K3-23); tạo Case = QL + mọi GV có phân công trong lớp, **mọi môn** (Rb §20.9) — không vướng quyền.

**Hiện trạng [ĐÃ KIỂM v4d].** Một panel `QuickReport.tsx` cho 4 lối (hồ sơ HV "+ Case" · bảng kỹ năng "+ Case cho {kỹ năng}" · hồ sơ lớp "+ Case" có ô chọn em · ⋯ dòng em); kỹ năng chọn **một** (`:400-412`); lưu xong panel đóng, form xoá (`:220`); `POST /cases/report` một `topic` (`server/src/cases/cases.ts:463-739`). Lỗi (D): "+ Case cho Listening" mở form **không chọn sẵn** kỹ năng (`StudentDetailPage.tsx:334`). Case tự động (SOS Mock, Giữa khoá, kỳ vọng cuối khoá) đã một Case mỗi kỹ năng — không đụng. Nhu cầu: 33/73 cặp GV × lớp (45 %) dạy ≥ 2 kỹ năng (DB demo).

| Cô Hà (L·R) tạo Case cho một em ở 2 kỹ năng | Nay | **C1 — chip chọn nhiều + một thẻ mỗi kỹ năng (khuyến nghị)** | C2 — mô tả chung, chỉ nguyên nhân + tên riêng | C3 — một kỹ năng + "Lưu và tạo cho kỹ năng khác" |
|---|---|---|---|---|
| Bấm + gõ · hồ sơ HV | 16 + 4 | **13 + 4** | 12 + 3 | 14 + 4 |
| Hồ sơ lớp (chọn em) | 20 + 6 | **15 + 5** | 14 + 4 | 16 + 5 |
| 3 kỹ năng (Thầy Khoa L·R·W) | 24 + 6 | **18 + 6** | 16 + 4 | 20 + 6 |
| Lần lưu / mở panel / chọn tệp | 2 / 2 / 2 | **1 / 1 / 1** | 1 / 1 / 1 | 2 / 1 / 1 |
| Đúng "đồng thời trên một panel" | ✗ | ✓ | ✓ | ✗ |
| Mô tả mỗi Case đúng kỹ năng đó | ✓ | ✓ | ✗ (Case Reading mang chữ Listening) | ✓ |

**Ưu tiên C1** (PTA tự quyết — 02 4.7 B16, C21):
- **Kỹ năng\***: chip **chọn nhiều** (HTT-5); không chọn sẵn (Case có hạn PA — chọn thừa phải xoá); "+ Case cho X" chọn sẵn X; chữ nhỏ "bạn dạy" dưới chip kỹ năng của người xem.
- **Phần chung, một lần:** Học viên (lối hồ sơ lớp) · Mức độ\* (một mức cả lô; khác thì sửa từng Case sau) · Bắt đầu theo dõi · Bằng chứng (tải sau khi có id, gắn mọi Case bằng `/attachments/chep` sẵn có).
- **Một thẻ mỗi kỹ năng** (`Khoi` + `Truong` sẵn có, theo thứ tự chip): "Reading · phụ trách: Trần Ngọc Hà" · Nhóm nguyên nhân\* (+ Ghi rõ khi "Khác") · Tên Case\* · Mô tả\*. Bỏ chip → thẻ ẩn, chữ giữ tới khi đóng panel. **Một kỹ năng = panel y như nay.**
- Nút chính nói đầu ra: "Tạo 2 Case" · "Tạo 1 Case · ghi thêm 1". Ghi bù "Đã xong từ trước" giữ **một** kỹ năng. Pre FOU (một chủ đề) không đổi; lớp thường theo bộ môn chương trình (FOU L · R · G+V · P).

| Lô lỗi một phần | Biết lúc | Xử lý |
|---|---|---|
| Kỹ năng có Case **chờ xác nhận** | chọn chip (`choNguyenNhan` sẵn có) | thẻ chỉ còn "… chờ xác nhận (MT2 · SOS 1) · Mở form Xác nhận Case"; không vào lô |
| Kỹ năng có **Case mở cùng hạng mục** | chọn chip (`case-topics` trả thêm `dangMo`) | dòng vàng trên thẻ + **Ghi vào Case đang có** (mặc định — thẻ còn Mô tả) / Vấn đề khác, mở Case riêng; không còn vòng lỗi 400 |
| Thiếu ô | bấm nút | lỗi dưới ô + "n ô cần sửa ↑" (`useLoiForm`), không gửi |
| Máy chủ từ chối một kỹ năng | sau gửi | **không tạo Case nào** (một giao dịch), giữ chữ, lỗi trên đúng thẻ |
| Mạng đứt sau khi đã lưu | bấm lại | khoá chống gửi đôi theo lô + kỹ năng → trả Case đã có, không trùng |
| Tệp lỗi | sau lưu | bước "Đã lưu" như nay, Thử lại gắn mọi Case |

**Sau lưu:** toast "✓ Đã tạo 2 Case · Listening, Reading" + "Thêm PA" (khi người tạo phụ trách) mở Case đầu; Case kia ở Công việc › Case học thuật (tự sang việc kế); người phụ trách khác người tạo nhận chuông (02 4.7 C23; 2.7).
**Máy chủ (nhỏ, không migrate):** `POST /cases/report` nhận `kyNang: [{ topic, primaryCode, observation, title, summary, gop? }]` + phần chung, gọi thân `reportIssue` n lần trong **một** `tx`; `GET /students/:id/case-topics` trả thêm `dangMo` + `phuTrach` theo kỹ năng.
**Kiểm thử:** `caseLo.tests.ts` — 2 kỹ năng → 2 Case đúng người phụ trách, đúng hạn · trùng chọn "Ghi vào" → 1 mới + 1 ghi thêm · kỹ năng chờ xác nhận → 0 Case · một thẻ sai → 0 Case · gửi lại cùng khoá → không trùng · GV ngoài lớp → 403 cả lô · tệp gắn đủ n Case; bấm thử GV 7 (L + R), GVCN 10 (W2 + S → S về GV 9, có chuông); ảnh 1440 + 375 (1 kỹ năng phải giống hệt nay).
**Cần chủ SP:** không (yêu cầu đã chốt; cách làm là UX).

### 7.2 Lịch thi — tháng / ngày thi, A / B, việc Chốt ngày thi (MP V.6–7 · 11.2 · V2A-06…08)

**Đã chốt (luật):** có tháng dự kiến + ngày thi; đến tháng dự kiến phải chọn ngày **hoặc** chuyển tháng; giữ tháng mà chưa ngày → trạng thái riêng "Sắp thi – Chưa chốt ngày" + **việc không hạn cố định**; có ngày → "Sắp thi – Đã chốt ngày". Bộ chọn **tháng / ngày thi thật không bị thay bằng bộ chọn tuần**. "Ghi chú họp" → "Ghi chú".

**Lỗi P1 [ĐÃ KIỂM mã]:** chưa có ngày thì máy lấy **ngày cuối tháng** làm ngày thi → hết tháng em tự thành "Đã thi · chờ KQ", GVCN nhận việc có hạn, quá hạn đỏ — trái luật; dính từ **01/12** (`tongKetLoTrinh.ts:118-119`). → PR máy chủ LT-SV (trước deploy — Q-E1).

| Cách hiện trạng thái | **(a) Một hàm `trangThaiLichThi` + chip A / B (khuyến nghị)** | (b) Tô nền hàng theo trạng thái | (c) Cột chữ trạng thái |
|---|---|---|---|
| A "Đã chốt ngày" | chip "Thi 21/11 · còn 9 ngày" họ màu "đã thi" + biểu tượng lịch ✓ | nền xanh | chữ |
| B "Chưa chốt ngày" | chip "Chưa chốt ngày thi · 11/2026" **viền đứt, trung tính** + ◌ | nền vàng — trùng màu SOS 1 | chữ |
| Không chỉ dựa màu | ✓ (ký hiệu + chữ + dáng viền) | ✗ | ✓ nhưng khó dò |
| Dùng chung | hàng HV (cột "Thi thật") · đầu hồ sơ HV · Lịch thi · hàng đợi TVV / QL · Excel | — | — |

**Bảng Lịch thi:** lọc **"Tháng dự kiến [10/2026] → [11/2026]"** (ngoại lệ tháng — mặc định tháng này → tháng sau) · **nhóm theo trạng thái** (Chưa chốt ngày — đã tới tháng · Đã chốt ngày · Dự kiến · Chưa có tháng thi — gập) · hàng một dòng ~44 px: Học viên ↗ (lớp · TVV) · MT gần nhất · Target · Lịch thi (chip) · Ghi chú (sửa tại chỗ) · **[Chốt ngày] [Dời tháng]** (4 → 2 nút / hàng) · mở rộng dưới hàng: 4 kỹ năng MT gần nhất so kỳ vọng · Test sắp tới · PA "đến lúc thi" · GVCN · lịch sử lịch thi.

**Việc "Chốt ngày thi":** sinh khi B đúng (tính khi đọc, không cron); **không hạn**, không vào số quá hạn / chuông; tắt khi có ngày · dời tháng · có kết quả / "Không thi" · em tạm dừng / lưu trữ; làm bằng **hộp neo tại chip**: [ngày] · [Dời sang 12/2026] · Ghi chú — **2 bấm**; cho chọn ngày đã qua ("Em đã thi 28/11?" → luồng Đã thi). Người giữ: TVV phụ trách em (không có → QL) — **Q-A3**; GVCN chỉ thấy chip.

**Cần chủ SP:** **Q-C3** ((1) có **tuần** mà chưa ngày = "Chưa chốt ngày"? khuyến nghị Có · (2) lớp thường chỉ hiện chip, không sinh việc) · **Q-C4** ("Cần xác nhận": mã cho thấy đầu ra = chưa kết luận → khuyến nghị bỏ nút, hiện "Chưa kết luận", lý do ở Ghi chú; dữ liệu cũ giữ). Cách hiện (a) + bảng: **PTA tự quyết**, sửa mockup 5.

### 7.3 Phân tích — panel, báo cáo, thời gian (MP IX · 12.4–12.8)

**Luật chọn panel cho số bấm được** (MP IX.1–2; nay gần như mọi số mở cùng panel chỉ có tên + lớp; 9 chỗ sai ngữ cảnh):

| | **L1 theo bản chất số (khuyến nghị)** | L2 mọi số đều "thông tin + nút" | L3 mọi số đổi trang |
|---|---|---|---|
| Luật | số **trong kỳ** → A thông tin cụ thể · số **hiện tại = việc chờ** → C thông tin + nút làm · số tổng / tiến độ → **0 chỉ xem** · trang chuyên có lọc đúng → D đổi trang **giữ đủ lọc** | nút giả ở số đã xong | trái "xử lý tại chỗ" |
| SOS 2 một lớp, 2 em, thêm PA | **7 bấm · 0 đổi trang** (nay 14 + 2) | 7 | 9 + 2 |
| Bài quá hạn của một GV | **2 bấm** (nay 4–5 + 2 đổi trang, phải nhớ lớp / đợt) | 2 | 3 + 1 |

**Panel C (mẫu):** tiêu đề = chỉ số · phạm vi · đúng số vừa bấm · một dòng định nghĩa + ⓘ · chip lọc trạng thái · bảng **≤ 6 cột, không cuộn ngang** (điểm gộp "R 5.5/6.0 · thiếu 0.5") · **một nút / dòng theo quyền** · việc ngắn mở dưới dòng, việc dài thay nội dung panel + "‹ Danh sách (3)" · tên em ↗ **đúng tab** · dòng xong ở lại mờ "✓ Xong" tới khi đóng · panel trên URL. Máy chủ trả **cột theo loại số**. Một dáng **"ô số"** thay gạch chấm (đã chốt bỏ gạch chấm); ⓘ = giải thích; "›" = đổi trang. **PTA tự quyết** (12.9-12, 13) — cần mockup.

**Báo cáo thuần (đã chốt nguyên tắc):** 5/7 nhóm bảng có cột việc, số đổi theo giờ xem → in kỳ cũ ra số hôm nay. **T1 tách hẳn (khuyến nghị)**: bảng chỉ số đã xảy ra trong kỳ; bỏ khỏi **hiển thị** (dữ liệu giữ) cột "HV - Case · Chưa chốt PA · Đang xử lý", "Case / PA · Việc tiếp", chân Hiệu quả PA, "bài quá hạn"; ngoại lệ có lý do: Thi thật giữ "Bước tiếp trên hàng" (mockup 6 khung 6), khối "tại hôm nay" của Báo cáo ghi rõ. So T2 (mỗi cột việc thành panel C — một việc hai lối) · T3 (công tắc "Hiện cột xử lý" — thêm điều khiển). **Ý thức Y1:** bỏ bảng "Học viên cần chú ý" (thực chất là hàng đợi việc — trùng 3–4 nơi) + sheet Excel đó; còn "Vi phạm theo lớp" · "Theo loại vi phạm" · "Xử lý đã làm trong kỳ theo loại" (+ "Đã báo PH n/m" sau luật 1); một dòng "6 em đang chờ xử lý — ở Hồ sơ lớp › Ý thức ›". **[CẦN ẢNH]** chữ "báo trễ" chủ SP thấy ở đâu.

**Báo cáo vs mockup (~36 % khớp):** K1 — PR tài liệu sửa mockup 3 khung 3 → máy chủ trước → **một PR màn Báo cáo** có bảng truy vết + ảnh cặp 1440 / 375 / Chiếu (khuyến nghị) · K2 vá từng chỗ (~60 %, lặp chuỗi lỗi cũ). Phần nâng cấp mới (nút **"Chiếu"**, "bài chấm trễ trong kỳ" thay "bài quá hạn tới hôm nay", bảng "Theo chi nhánh" cho QT, khối lớp thường) → **Q-C2**.

**Hiệu quả PA + Tổng hợp vấn đề HV:** H1 giữ hai bảng (phải tính lại "Nên dùng" cấp loại PA — đụng luật) · **H2 một bảng "Vấn đề & PA"** (khuyến nghị: hàng lớn = kỹ năng, hàng con = nhóm nguyên nhân; HV có vấn đề · Đã có PA · PA có KQ · Có cải thiện % · PA đã dùng + chip "Nên dùng" đúng luật hiện tại · "Không tiến bộ n" → panel C; trả lời 3 câu của Chị Vy ≤ 1 bấm; không đổi logic PA) · H3 theo loại PA (mất liên hệ vấn đề ↔ PA) · H4 ma trận nhiệt (mẫu thưa → % 0 / 100 gây hiểu lầm). **[CẦN DỮ LIỆU]** số PA kết thúc / tháng / chi nhánh; lớp thường có cần bảng này.

**Thời gian (đã chốt: "Toàn bộ" + "Chọn khoảng tuần" — riêng Phân tích):** `Thời gian [Toàn bộ | Khoảng tuần] ‹ [W1 SEP ▾] → [W2 SEP ▾] › Mặc định`. "Toàn bộ" = từ tuần đầu có dữ liệu của bảng trong phạm vi đang lọc, nhãn "Toàn bộ · W4 JUN – W2 SEP" (mã tuần — X-21); cột "So kỳ trước" ẩn khi Toàn bộ; đổi tab giữ khoảng người dùng đã chọn.

| Bảng / nơi | Mặc định | "Toàn bộ"? |
|---|---|---|
| Báo cáo | 2 tuần hoàn chỉnh trước | có |
| Test + SOS | 8 tuần hoàn chỉnh | có |
| Kết quả Test › Mock | 4 tuần gồm tuần này | có |
| Kết quả Test › Thi thật · Vấn đề & PA | Toàn bộ | có |
| Phân tích GV | 4 tuần hoàn chỉnh | có — **phải nâng trần 13 tuần** ở máy chủ (đo tốc độ trên DB lớn nhất trước; chậm thì kẹp + ghi nhãn) |
| Ý thức | 4 tuần hoàn chỉnh | có |
| **Tutor + panel một tutor** | 4 tuần gồm tuần này | **không** — chỉ `Khoảng tuần` (PTA 21/10 ★) |
| **Bộ lọc thêm › "Thời gian"** (HV & Lớp) | **trống = không lọc**, nút ✕ xoá lọc | **không** (★) |
| **Panel Xuất** | = khoảng của trang gọi | **không** (★) |
| Lịch Test · Góp ý tuần | một tuần (cùng thành phần, khoá một ô) | không |
| Lịch thi | tháng (nghiệp vụ) | không |
| Đang SOS | không có bộ lọc thời gian (9.1-4) | không |

★ = PTA tự quyết **thay** đề xuất 12.7 / 12.9-17 (cho "Toàn bộ" ở Tutor, Bộ lọc thêm, panel Xuất) theo MP III.8 "riêng trang Phân tích". **Bỏ hàng nút "Tuần này · Tuần trước · 2 tuần trước" trong lịch tuần** (luật 06/10 — ‹ › + "Mặc định" đủ; ★ thay khuyến nghị "giữ" của 12.7). Lỗi bộ chọn tự đóng: vá + gom 15 bản "bấm ra ngoài" về một hook (GĐ1), thay hẳn bằng `Khoảng tuần` không hộp nổi.

### 7.4 Xuất Excel (MP IX.5, V.4 · 12.6 · V2A-05)

**Hiện trạng [ĐÃ KIỂM mã].** 11 lối, 5 bộ tên cột; 3 lối dựng ở trình duyệt **không ghi nhật ký** (tệp Ý thức có email + tình trạng kỷ luật); lệch phạm vi (Lịch Test xem 1 tuần → tệp từ đầu tháng; "Chỉ cần xếp lại" → tệp mọi em).

| | **E1 (khuyến nghị)** | E2 chỉ sửa 3 lỗi |
|---|---|---|
| Tên cột | **một từ điển cột** ("Tên · Email" đầu, cùng tên mọi tệp) | vẫn 5 bộ |
| Phạm vi | panel xuất **mặc định = bộ lọc trang gọi**, đổi được trong panel; nút ghi đúng "Xuất · n lượt" | sửa 2 chỗ lệch |
| Cột theo mục đích | Test + SOS bỏ 3 cột việc · Kết quả Test bỏ "Case / PA · Việc tiếp", thêm Email + Chi nhánh · Ý thức bỏ sheet "HV cần chú ý" · "Ghi chú họp" → "Ghi chú", thêm "Thi thật" (A / B) · "Tuần thi" → "Tuần Test" | giữ |
| An toàn | **mọi xuất qua máy chủ + nhật ký** | 3 lối không nhật ký |

**Chọn học viên khi xuất — Q-E2:** nay ô tick làm cột tên mất 12 %, 34 điều khiển / lớp, "Chọn tất cả" chỉ lấy lớp **đang mở ở trang này** → xuất cả chi nhánh bỏ 2 em ≈ 28 bấm qua 2 trang. **Phương án 3 (khuyến nghị)**: bỏ ô tick khỏi bảng; panel Xuất có khối "Học viên · n" (gom theo lớp, chọn sẵn hết, ô tìm, tick bỏ em) — một chỗ chọn cho Tất cả / Đang SOS / Lịch thi: 5 em SOS 3 lớp 10–11 → 8 bấm; cả chi nhánh bỏ 2 em ≈ 28 → **6** · A: bỏ ô tick, xuất **theo bộ lọc** (lớp đang mở không ảnh hưởng), bớt em trong Excel · B: giữ ô tick nhưng gọn (vẫn lỗi "chỉ lớp đang mở"). "Chọn nhiều" ở hồ sơ lớp (thao tác hàng loạt) giữ.

### 7.5 Tutor (MP X · 12.8 · V3B-11, 12)

| | T-A giữ + vá | **T-B F1 + B1 (khuyến nghị)** | T-C làm lại hẳn khi có dữ liệu |
|---|---|---|---|
| Lỗi UI thấy ngay (bộ chọn tự đóng · cột "Cần chú ý vì" 418 px trống · tiêu đề panel bị cắt + bộ chọn thời gian thứ hai · chữ 12–13 px · 375 bộ lọc ~460 px trước tutor đầu) | sửa | sửa | chờ |
| 5 chip chồng nghĩa ("Cần chú ý" mọi thời gian, "Đang dạy" theo khoảng, "Thiếu thông tin" không phải trạng thái) → Head tutor mở trang **rỗng** | mặc định "Tất cả" | **"Việc của bạn"** 1–3 dòng (Cần chú ý · tên gõ tay · thiếu thông tin) + chip còn **Đang dạy · Ngừng · Tất cả** (mặc định Tất cả khi Đang dạy = 0) | — |
| Bảng | giữ | gộp "Cần chú ý vì" vào cột **"Kết luận / lý do"**; tên một dòng; tutor 0 buổi → một ô "chưa có buổi"; Nơi dạy + Kỹ năng vào "Lọc ▾" (≤ ~30 tutor) | — |
| Head tutor tới tutor cần chú ý đầu | 5–9 bấm | **3** (sau "Lưu nhận xét" tự mở tutor cần chú ý kế) | — |

**Ưu tiên T-B** — khớp nguyên tắc "việc của tôi ở trang đầu"; **không đổi** định nghĩa "Cần chú ý", "Đang dạy", "Ngừng hợp tác"; nút chính "Thêm tutor" (★ 02 mục 4.7 #6). **Tách rõ:** lỗi UI (làm ngay) ↔ giả thuyết cần dữ liệu thật (không tạo luật mới): demo chỉ 8 tutor, 2 buổi, 1 nhận xét → **[CẦN DỮ LIỆU]** số tutor thật · buổi / tuần / chi nhánh · tỉ lệ buổi "Không" / đánh giá ≤ 2 · Head tutor có lọc nơi dạy / kỹ năng hằng ngày · có gọi tutor từ trang · nhịp viết nhận xét · tên gõ tay nhiều không; seed buổi tutor theo ngày demo để chụp lại.

---

## 8. Hành trình theo vai (MP XV · v4c mục 4)

### 8.1 Bảng tóm tắt — vai × hành trình → bước nay / sau

"b" = bấm · "đt" = đổi trang · "phủ" = panel phủ. Nguồn số: v1-tong-quan 4.3, 5.1 · v3a 3.4 · v4a V4A-01 · v4b V4B-04, 07, 08 · 11.2–11.3 · 12.4 · 7.6–7.8.

| Vai | Hành trình (MP XV) | Nay | Sau | Mục |
|---|---|---|---|---|
| GV (Cô Linh) | Xem việc tuần này | việc đầu ở y 752 px (375: 1 505), 4 dòng nợ 68 ngày đứng đầu, 42–49 thứ bấm được | y ≤ 200 px (375 ≤ 420), nợ cũ gom 1 dòng, ≤ 30 thứ bấm được | 2.2 |
| GV | Chấm mọi bài đến hạn + quá hạn, 2 lớp | ~11 b · 3 khối · 8 lưới 10 cột | **1–2 b** · lưới gọn | 3.2 |
| GV | Nhập bài quá hạn | 3 b + dò | **1 b** | 3.2 |
| GV lớp thường | Progress + nhận xét 3 em | ~8 b · 4 hộp | **2 b · 1 hộp** | 3.3 |
| GV | Sửa điểm Progress đã lưu (ảnh v4-4) | **không làm được** → nhắn QL, QL 6–8 b | **2–3 b**, có nhật ký | 6.5 |
| GVCN | Nhập điểm MT còn thiếu ở hồ sơ lớp | 4 b + 1 phủ + phải nhớ lượt nào quá hạn | **1 b** | 1.6 |
| GVCN | Ghi Kết quả PA | 3 b, mất tiêu đề + tên em | 3 b, giữ tiêu đề + bối cảnh | 2.3 |
| GVCN | Xử lý vi phạm quá hạn · xác nhận phối hợp | 5 b · 4 b + dò ~1 700 px | **3 b · 3 b, 0 dò** | 1.6 |
| GVCN | Thu hồi một lần xử lý | 2 b xoá thẳng (sai L5) | 2 b + lý do → QL 1 b | 5.9 |
| GV · GVCN | Ghi "-" muộn, em cần thi bù | 5+ b, 2 người | **1 b** | 4.4 |
| GV S chéo | Chấm Speaking chéo | 5 b, nhãn "GV khác" | **2 b** | 3.4 |
| GV · GVCN | Tạo Case cho một em ở 2 kỹ năng mình dạy (FB-4-35) | 16 b + 4 gõ · 2 lần lưu (hồ sơ lớp 20 + 6) | **13 b + 4 gõ · 1 lần lưu** (15 + 5) | 7.1b |
| GV | Từ trang khác, biết còn việc quá hạn nào (chuông — FB-4-36) | 2 b + dò 39 dòng; 5/9 việc quá hạn nằm "Để biết", 3/9 không có | **2 b, 9/9, số khớp Công việc** | 2.7 |
| TVV | Ghi kết quả xử lý vi phạm | **không có chỗ** (GVCN tự ghi trong mô tả) | **3–4 b · 0 đt** | 1.4, 5.5 |
| TVV | Chốt ngày thi | không có việc (ngày cuối tháng tự thành "đã thi" — lỗi) | **2 b**, không hạn | 7.2 |
| TVV · CX | Tra điểm một em | 2 b, số không màu | 2 b, số tô màu theo kỳ vọng | 3.6 |
| QL (Chị Vy) | Duyệt 10 thẻ cần bối cảnh | ≈ 31 b · 20 đt (Tổng quan) / 21 · 5 (Công việc) | **11 b · 0 đt** | 1.3, 2.1 |
| QL | Thêm PA cho 5 Case quá hạn | 25–30 b · 5 phủ | **11–16 b · 0** | 2.1, 7.1 |
| QL | Chốt lộ trình 6 lớp | 40–60 b · 6 phủ toàn màn | **≈ 12 + em chưa đề xuất** | 1.3 |
| QL | Lớp nào SOS 3, em nào, có PA chưa | 3 b · 1 đt · 1 phủ | **1 b** | 7.1 |
| QL | "MT2 lớp X đủ chưa, ai còn nợ" | 3–6 b + cộng nhẩm / 5–6 + 1 đt | **1 b** | 3.6 |
| QL | Case chưa có người (Case 14) | **không xong được** | 0 (tự gán) / 3 b | 2.5 |
| QL | Dọn điểm nhầm rồi dời MT (Đ1) | ≈ 14 b · 1–2 đt · gõ lại 2 ô | **3–4 b · 0** | 4.6 |
| QL | Em vắng 2 lần, cho thi bù (Đ2) | ≈ 6 b, 2 bộ chữ | **3 b** | 4.6 |
| QL | Dời lịch một em vắng | 6–7 thao tác, 3 lớp chồng | 4–5, một lớp | 4.6 |
| QL | Duyệt thu hồi / không tăng bậc | (không có — GVCN xoá thẳng) | 1 b ở hàng đợi | 5.9 |
| QL | Giải thích một số trong giao ban | 1 b + 1 đt mỗi em | **1 b · 0** | 7.3 |
| QL | GV chấm trễ → bài trễ | 4–5+ b · 2 đt · phải nhớ lớp / đợt | **2–3 b** | 7.3 |
| QT | So sánh chi nhánh | đổi ô chi nhánh 5 lần, nhớ số | **1 b** (bảng "Theo chi nhánh" — Q-C2) | 7.3 |
| Admin VP | GV nào chấm trễ, bài nào | 2–3 b | **1 b** | 2.2 |
| Admin VP | Xuất điểm Test một lớp | 2 panel khác nhau · 4–8 thao tác | 1 panel · 4 | 7.4 |
| QL · QT · VP | Xuất cả chi nhánh bỏ 2 em | ≈ 28 b qua 2 trang | **6 b** (Q-E2) | 7.4 |
| Head tutor | Tới tutor cần chú ý đầu | trang **rỗng** ("Đang dạy 0") · 5–9 b | **3 b**, mở trang là thấy | 7.5 |

**Ảnh hưởng chéo đáng chú ý:** bỏ "Chờ duyệt" khỏi Công việc QL → GV vẫn thấy chữ "chờ QL duyệt" trên việc của mình · việc TVV mới → GVCN mất bước "nhắn TVV ngoài web" nhưng phải thấy trạng thái PH ở ô Thang · gỡ R11 → QL bớt việc nhập hộ · một nguồn chấm → số trên Công việc, Test, hồ sơ lớp, Tổng quan khớp nhau.

### 8.2 Kiểm "người mới hiểu ngay" — trang đầu từng vai (1440 + 375)

| Vai | Nay thấy đầu tiên (v4c 4.3) | Hiểu ngay? | Sau | Phép kiểm |
|---|---|---|---|---|
| QL / QT | "Việc hôm nay" + dải số + 21–29 thẻ, 2,5 màn | ✗ quá dày | "Cần bạn quyết · 23 · ⚠12" + nhóm có số + việc đầu chọn sẵn ở khung phải | trong **1 màn** thấy việc đầu + nút làm |
| GV / GVCN | "Chào Hà · ⚠10 quá hạn · 19 việc", việc cũ nhất tự mở; không hiểu "W1 JUL" là tuần thi | ~ | nhóm Chấm điểm có nhãn "MT1 · thi W1 JUL · hạn 08/07"; nợ cũ gom 1 dòng | đọc to dòng đầu: trả lời được "chấm bài nào, lớp nào, hạn khi nào" |
| GV S chéo | panel Chấm Speaking mở sẵn | ✓ | giữ + hạn để nhìn | — |
| Admin VP | "Mock Test" + 4 ô **0**, tiêu đề ≠ menu | ~ | "Tổng quan" + việc VP hoặc "Không có việc hôm nay · Tuần sau: n lượt ›" | rỗng luôn có câu + bước tiếp |
| TVV | 5 ô số (3 · 0 · 0 · 0 · 0), không danh sách việc | ✗ | "Việc của bạn · n · ⚠k" + một hàng số "Học viên của tôi" | có việc → thấy việc đầu ở khung phải; rỗng → "✓ Không có việc chờ" |
| CX | 6 ô + 4 thẻ IN HOA + "Điểm đáng chú ý" | ~ (CX chủ yếu xem) | số liệu gọn, không IN HOA, số bấm được theo L1 | — |
| Head tutor | "Không có tutor khớp bộ lọc" | ✗ tưởng không có dữ liệu | "Việc của bạn" + bảng "Tất cả" | trang đầu không bao giờ rỗng khi có tutor |

Thêm: dải "Mới dùng PISA?" cho mọi vai (nay VP không có); nghiệm thu chữ chụp ở **100 % và 125 %** (v4c mục 5); trạng thái rỗng dạy luật một câu (vd "Bài thi tuần này chấm trước T4 tuần sau").

### 8.3 Không tối ưu vai này làm khó vai khác (kiểm chéo)

1. Công việc QL thành "Theo dõi & giao việc" → QL vẫn làm thay được việc Case của GV (nút "Làm thay"), Nhập điểm chỉ xem (không có `score.edit`).
2. Việc TVV mới không kéo việc của GVCN sang (chỉ nhóm việc TVV); GVCN vẫn xem được kết quả.
3. Bỏ trang `/nhap-diem`, `/bang-diem-thuong`, đổi `/cong-viec/cho-duyet` → link cũ trong thông báo chuyển hướng (`duongMoi`).
4. Đổi dáng "đang chọn" (nền nhấn + vạch trái 3 px) → sổ tay "Chỉ cho tôi" chụp lại.
5. Gỡ R11 → GV sửa được nhưng "Đúng hạn" ở Phân tích GV không đổi (không ai "lách" chỉ số).
6. L4 → GV ghi "-" muộn không làm em mất quyền thi bù, nhưng lần 2 vẫn huỷ để QL quyết (không dời vô hạn).

---

## 9. Ảnh hưởng chéo + thứ tự phụ thuộc (gợi ý cho 07)

### 9.1 Đổi cái này thì cái kia phải đổi theo

| Đổi | Kéo theo | Chung thành phần / nguồn |
|---|---|---|
| Phân vai Tổng quan ↔ Công việc (Q-A1) | bố cục Tổng quan QL (Q-A2), Công việc QL "Theo dõi & giao việc", số trên menu, đường chuông, Tổng quan TVV / VP, mockup 2 khung 3 + mockup 3 khung 1 | `HangDoiViec` dùng chung — làm **một lần** |
| Dòng việc 3 vùng + một hàm tên (`tenViec`) | Công việc, Tổng quan, bộ lọc "Có việc" ở HV & Lớp, chuông, hồ sơ GV "Việc đang có", đầu panel | `DongViec` |
| Một nguồn chấm `hangCham` (Q-C1) | Công việc › Chấm điểm, Test › Chấm Test, chip "n ô quá hạn" hồ sơ lớp, Tình trạng chấm, gom "nợ chấm cũ" | `hangCham` + `LuoiChamLop` gọn |
| Hộp chấm một mẫu | lớp thường (nhận xét — đã chốt), `ODiem`, bảng lưới (BANG-1), menu Thêm ▾ (Huỷ điểm / Khôi phục theo L3) | `HopCham` |
| Gỡ R11 (L3) | hộp chấm, chip "Đủ điểm", bảng MT T20–T21–T28, Dán Excel (GVBM ghi đè ô có điểm), Rulebook R7 | — |
| Hàm "-" (L4) | bảng MT T05–T07, nút "Vắng" ở hộp chấm, chip Kế hoạch Test, SOS chốt, Excel ("Vắng" / "Không dự thi" cũ), danh sách dữ liệu cũ cho QL | `chuyenVang` |
| Việc TVV (L1, L2) + L5 | Ý thức A hồ sơ lớp + M3b hồ sơ HV (dòng phụ PH), Chờ duyệt (2 thẻ mới), Tổng quan TVV, Phân tích Ý thức Y1, Excel Ý thức, `/lich-su` loại "y-thuc", gán TVV (dữ liệu) | thẻ duyệt dùng chung; `LichSu` |
| Một hàm `trangThaiLichThi` (LT-SV) | Lịch thi, hàng HV (cột "Thi thật"), đầu hồ sơ HV, hàng đợi TVV / QL (Chốt ngày thi), Excel | `ChipLichThi` |
| `Khoảng tuần` | mọi bộ lọc tuần; Phân tích "Toàn bộ"; Tutor; Bộ lọc thêm; panel Xuất; Lịch Test (một tuần); Lịch thi (biến thể tháng) | một thành phần + hook "bấm ra ngoài" |
| Thang 0–5 + "Khung việc" | mọi panel; hộp neo (Gia hạn, Phân công, Chốt ngày thi, Từ chối, Thu hồi); panel C | 11 thành phần chung (04) |
| Bỏ góc Cần làm (Q-A4) | cần `DongViec` + cùng hàm đếm; việc TVV phải có chỗ ở Tổng quan TVV **trước** khi bỏ | — |
| Panel C (`PanelChiSo`) | Phân tích, Báo cáo, Tổng quan, hồ sơ lớp; máy chủ trả cột theo loại số | vỏ bậc 3 |
| Tự gán chủ Case | bỏ việc "Chọn người phụ trách", nút "Phân công…", nhóm "Phân công" ở Tổng quan chỉ còn ca lớp thiếu GV môn; xoá tài khoản cần API đổi chủ | — |
| Chữ Thi ↔ Test (CHU-THI) | bộ chữ MT (4.5), tên thẻ "Dời lịch Test", nhãn "thi … · hạn …", Excel "Tuần Test" | từ điển chữ |
| Hệ trạng thái ("đang chọn" = nền + vạch trái) | dòng hàng đợi, hàng lớp mở rộng, ô số đang mở panel, chip lọc | 04 |
| Chuông = hộp "Nhắc việc" (2.7 N2) | thanh trên mọi vai (M0), Công việc + Tổng quan (cùng hàng đợi), badge menu, bỏ `thongBaoTuDong.ts`, việc TVV (L1) tự vào chuông TVV, Hướng dẫn / sổ tay chụp lại | hàm hàng đợi trang đầu + `DongViec` |
| Tạo Case nhiều kỹ năng (7.1b) | hồ sơ HV + hồ sơ lớp (một panel), Công việc của từng người phụ trách, chuông người phụ trách (C23), Tổng quan QL "Case chưa chốt PA" +n | `reportIssue` trong một giao dịch; `case-topics` |

### 9.2 Thứ tự gợi ý (cụm phụ thuộc — PTA viết 07)

| Bậc | Cụm | Phụ thuộc | Cần mockup? | Ghi chú |
|---|---|---|---|---|
| 0 | **Tài liệu + dữ liệu + công cụ:** Rulebook sửa chữ (R1–R16), mockup cũ sửa theo quyết định, luật "thang 0–5" + "một danh sách một kiểu mở" vào DESIGN.md / CLAUDE.md; lệnh chỉ đọc: em chưa có TVV, ô "Không dự thi" cũ, lộ trình "đã thi" chỉ nhờ tháng; seed: TVV, tutor theo ngày demo, tài khoản đa vai; công cụ đo `do-bang`, phép kiểm DOM | — | không | chặn mọi thứ sau |
| 1 | **Máy chủ luật (trước deploy — Q-E1):** L3 gỡ R11 + Khôi phục điểm + cất điểm · L4 hàm "-" (sau Q-B3, Q-B4) · L5 thu hồi / không tăng bậc qua QL (+ thẻ Chờ duyệt, nút web nhỏ) · LT-SV · tự gán chủ Case + lý do thiếu người · `/lich-su` "y-thuc" · H15 · nhãn "thi … · hạn …", "chấm chéo", CHU-THI | bậc 0 | không (đổi quyền / chữ / điều kiện) | PR máy chủ tự merge được |
| 1b | **Máy chủ việc TVV (L1, L2) sau cờ tắt** | gán TVV (dữ liệu) | không | bật ở bậc 4 cùng màn TVV |
| 2 | **Nền:** thang chữ, token màu điểm, hệ trạng thái · `Bang` + `ODiem` (BANG-0) · vỏ "Khung việc" + hộp neo · `Khoảng tuần` + hook bấm ra ngoài · `DongViec` + `HangDoiViec` + `tenViec` | bậc 0 | **có** (bảng mẫu, `Khoảng tuần`, hàng đợi) | một trang mẫu `/dev/thanh-phan` duyệt một lần |
| 3 | **BANG-1** lưới điểm 6 lối + hộp chấm một mẫu (lớp thường) | bậc 2 | có (mockup 6 khung 3 + hộp chấm) | — |
| 4 | **Màn khu việc:** Tổng quan QL / QT (B) + Công việc (A, kiểu mở, Kết quả PA khung phải) + **Tổng quan TVV** (bật cờ việc TVV) | Q-A1, Q-A2; bậc 1b, 2 | có | dùng chung `HangDoiViec` → nên cùng một chuỗi PR liền nhau |
| 5 | **Hồ sơ lớp (M3) + Hồ sơ HV Ý thức (M3b):** lưới gập + Nhập điểm tại chỗ, Ý thức A (dòng PH), tab 3 tầng | bậc 2–3; việc TVV (để hiện dòng PH) | có | — |
| 6 | **Học viên & Lớp (M4):** 3 góc + bộ lọc "Có việc" (Q-A4) · Lịch thi (Q-C3, Q-C4) · panel Xuất chọn em (Q-E2) | bậc 4 (DongViec, Tổng quan TVV có việc trước khi bỏ Cần làm) | có | — |
| 7 | **Test (M5):** Chấm Test theo hạn + Tình trạng chấm + Lịch tuần · hộp một đợt MT (dòng Đã huỷ, Khôi phục) | Q-C1; bậc 1, 3 | có | Công việc › Chấm điểm đổi sang cùng nguồn trong PR này |
| 8 | **Phân tích (M6):** Báo cáo một PR màn (+ Chiếu — Q-C2) · panel C · báo cáo thuần · Ý thức Y1 (+ "Đã báo PH") · Vấn đề & PA · thời gian · xuất E1 | bậc 2; máy chủ panel / "chấm trễ trong kỳ" / "Toàn bộ" đi trước | có | đo tốc độ "Toàn bộ" trước |
| 9 | **Tutor (M7):** F1 + B1 | bậc 2; dữ liệu thật / seed | có | phần lỗi UI làm được sớm hơn |

### 9.3 Câu nào chặn cụm nào

| Câu (02 mục 5) | Chặn |
|---|---|
| Q-E1 (gói trước deploy) | thứ tự bậc 1 ↔ deploy |
| Q-B3, Q-B4 | phần L4 ở bậc 1 (hàm "-") — phần còn lại của L4 (sau tuần thi ở MT hiện tại) **không chờ** |
| Q-B1, Q-B2 | riêng H03 / H21 và "sửa dữ liệu đã duyệt"; gỡ R11 cho đợt chưa kết thúc **không chờ** |
| Q-A1 (+ phần nơi làm của Q-A3), Q-A2 | bậc 4 (mockup khu việc) |
| Q-A3 (bộ việc), Q-D1, Q-D3, Q-D4 | bậc 1b (luật sinh / đóng việc TVV), bậc 4 phần TVV |
| Q-A4 | bậc 6 phần Cần làm |
| Q-C1 | bậc 7 (mockup Chấm Test) |
| Q-C2 | bậc 8 phần nâng cấp Báo cáo (sửa theo mockup **không chờ**) |
| Q-C3, Q-C4 | LT-SV (phần tuần / lớp thường) và bậc 6 Lịch thi |
| Q-E2 | bậc 6 panel Xuất |

---

## 10. Ghi chú cho PTA Plan — chỗ tệp này khác bản nháp 02 / cần cập nhật

1. **Q-D2 → PTA tự quyết** (theo PTA 21/10 mục 2): hạn = ngày lưu + 4, hết 23:59 giờ VN; đưa vào 02 mục 4.7 ("phản đối nếu muốn đủ 5 × 24 giờ"). **Sửa thứ trong ví dụ**: 18/09/2026 là T6 (không phải CN); 19/10/2026 là T2 (v4b ghi CN).
2. **Q-A1 + Q-A3:** gộp phần "TVV làm ở đâu" vào Q-A1 (nguyên tắc chung); Q-A3 còn "bộ việc TVV + người giữ" — tệp này đề xuất thêm **Báo PH kết quả Test lớp thường** (v4b Q8) và tuỳ chọn **Kết quả thi thật** (v4b Q9) vào cùng câu.
3. **Q-D3 phần (2) "chưa liên hệ được":** 02 nháp khuyến nghị "việc mở tới khi có kết quả"; tệp này khuyến nghị **cho kết thúc "Không liên hệ được"** (ghi chú bắt buộc, GVCN nhận chuông) — có đầu ra, không mù cảnh báo (5.8).
4. **Q-B3:** đổi khuyến nghị theo PTA 21/10 mục 5 và trình bày **cả hai** tuần đích kèm tình huống S1 / S2 (4.4). v4b khuyến nghị ngược lại (tuần kế của lịch) — đã nêu chi phí của cả hai.
5. **Q-B1:** gộp H21 (sửa chữ KQ PA khi Case đã hoàn thành) vào cùng câu "khoá vì đóng hồ sơ"; H28 (Tutor 24 giờ) xếp **lệch L3 → nới** (khoá "vì đã lưu"), không hỏi.
6. **02 mục 4.7 #7:** "Huỷ kỹ năng" trùng tên nút bỏ kỹ năng khỏi đợt trong mã → đề xuất trạng thái "Đã huỷ · vắng 2 lần", nút "Bỏ khỏi đợt" (4.5).
7. **02 X-19 / 4.7 #11** ("giữ viền khung 2 px cho đang chọn") **bị PTA 21/10 mục 9 thay**: đang chọn = nền nhấn nhạt + vạch trái 3 px, khác hẳn vòng focus 2 px (cùng v4c HTT-6) — cập nhật 02 + 04.
8. **Thêm vào 02 mục 4.7 (PTA tự quyết có đảo cái cũ):** Kết quả PA ở Công việc mở khung phải (đảo khung OV-13 §1 — v4a Q4) · tự gán chủ Case theo luật tạo Case, bỏ việc "Chọn người phụ trách" (v4a Q3) · MT0 theo L4 trong giới hạn MT0 (v4b Q7) · "Chưa thực hiện" không huỷ việc TVV · rút đề xuất còn chờ xử lý như QL từ chối (đối với việc TVV) · tên việc "Ghi kết quả xử lý" (tránh chữ "Ghi nhận").
9. **v4b Q1 không còn là câu hỏi** (luật 1 thắng); v4b Q5 (a) Hoàn tác 10 s sau lưu xử lý — **không áp** (02 mục 4.7 B15); (b), (c) theo khuyến nghị v4b (chuông "để biết"; lý do bắt buộc, tệp tuỳ chọn).
10. **[E] cần kiểm khi làm bậc 1:** chữ "lần 2" trên thẻ dời MT (v4c ảnh `b2-cv-yeucau-gv7-p1`) · lối "Huỷ lượt" ngoài Kế hoạch Test (X-28) · bấm thử demo riêng: Kết quả PA "✓ Đã lưu" vẫn mất tiêu đề; "Lưu phân công" không gỡ "Chưa có người".

---

## 11. PTA tự quyết trong tệp này — liệt kê để chủ SP biết (★ = đảo một quyết định / mockup cũ)

- Trang đầu theo vai (1.2); tiêu đề trang = tên menu; chuông mở đúng việc ở trang đầu.
- Chờ duyệt: một thành phần dòng duyệt, nơi làm chính là Tổng quan; Hộp duyệt đầy đủ chỉ để xem đã xử lý.
- Dòng việc 3 vùng, nhóm cố định theo vai, gom nợ chấm cũ, "Bị từ chối" vào nhóm; vào trang không tự mở việc người khác; lỗi tải chỉ che danh sách.
- ★ Một danh sách một kiểu mở; Kết quả PA mở khung phải (đảo OV-13 §1); ghi nhanh giữ ở panel một em.
- Thang 0–5 + vỏ "Khung việc" (dáng ở 04); hộp neo cho Gia hạn / Phân công / Chốt ngày thi / Từ chối / Thu hồi.
- Sửa gốc "Phân công…": lý do thiếu người + tự gán chủ Case theo luật tạo Case (★ nếu chủ SP coi đây là đổi người chịu trách nhiệm).
- ★ Hộp chấm một mẫu cho lớp thường (gõ số mở hộp — đảo HD2); Speaking "chấm chéo", người chấm mặc định; Excel 2 lối, ẩn 375, lớp thường theo từng bài; "Tình trạng chấm" cho QL / QT / VP.
- Bảng chuyển trạng thái MT (4.3); một hàm "-"; MT0 theo L4; nút luôn "Vắng"; ★ bộ chữ huỷ / dời (4.5); một hộp một đợt; Khôi phục điểm; gợi ý "Dời cả MT sau".
- Việc TVV: QL lưu thay cũng sinh việc; hạn ngày lưu + 4, 23:59; form F2 + "Thực tế khác nội dung GVCN"; tên "Ghi kết quả xử lý"; trạng thái 5.6; "Chưa thực hiện" giữ việc; một form cho ≥ 2 lần xử lý; dòng phụ PH ở ô Thang; không ô số mới ở Tổng quan QL; "Đã báo PH n/m" ở Phân tích / Excel.
- L5: "Thu hồi…" thay "Xoá lần xử lý"; "Đã thu hồi" giữ dòng; QL tự thu hồi có lý do; bớt vi phạm = sửa; một thẻ "Thu hồi + ghi lại thành không tăng bậc"; lý do bắt buộc, tệp tuỳ chọn.
- Khoá: nới H01, H02, H04, H05, H08, H14, H15, H20, H28; thêm duyệt H16; giữ 15 khoá có câu "vì sao + làm gì thay". Lịch sử gập trong panel; Hoàn tác 8 s sau Duyệt = gửi trễ.
- SOS: cả ô là nút, mở rộng hàng lớp; Thêm PA theo độ rộng, cùng một form.
- Lịch thi: một hàm trạng thái, chip A / B, bảng nhóm theo trạng thái, 2 nút / hàng, hộp neo Chốt ngày.
- Phân tích: L1 + panel C; "ô số"; T1 báo cáo thuần; Y1; H2 "Vấn đề & PA"; mặc định thời gian theo bảng; ★ "Toàn bộ" không áp Tutor / Bộ lọc thêm / panel Xuất; ★ bỏ hàng nút "Tuần này · Tuần trước" trong lịch tuần.
- Xuất E1 (từ điển cột, mặc định = bộ lọc trang, mọi xuất qua máy chủ + nhật ký).
- Tutor F1 + B1; ★ nút chính "Thêm tutor".
- (21/10, v4d) Tạo Case nhiều kỹ năng (7.1b): chip chọn nhiều, không chọn sẵn ("+ Case cho X" chọn sẵn X); phần chung một lần; một thẻ mỗi kỹ năng có "phụ trách"; một giao dịch; ghi bù giữ một kỹ năng.
- (21/10, v4d) ★ Chuông = hộp "Nhắc việc" một nguồn (2.7 N2; GĐ1 vá N1); **không** tự bật hộp khi đăng nhập (đảo chữ "ô hiện lên" của GV — 02 4.7 A20); không tick "xong" tay; Case tạo tay cho người khác → chuông người phụ trách.
