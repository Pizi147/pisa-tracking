# Test G1-08 + G1-11 — mockup chờ chủ SP duyệt (13/11)

Nguồn: bản rà toàn bộ 11/11 (`docs/superpowers/specs/2026-11-11-ra-toan-bo/bao-cao.md`, dòng G1-08 và G1-11). Chủ SP 13/11: "2 mục cần vẽ mockup cứ vẽ".
Mở `g1-08-xuat.html`, `g1-11-nhap-diem.html` bằng trình duyệt (cần mạng cho phông Google Fonts). CSS: `chung.css` chép nguyên mockup 11/11 đã duyệt
(`thiet-ke/2026-11-11-mockup-1111/1-dai-viec-cua-toi.html`) + `rieng.css` phần mới. Khung 1440 tối, 375 sáng. Nền vàng viền đứt = chú thích mockup, không lên web.

## Ảnh (`anh/`)

| Ảnh | Nội dung |
|---|---|
| `cap-1-lich-test.png` | TRƯỚC web Lịch Test tuần (G1-27, "Xuất Excel" ở hàng lọc) · SAU K1 ("Xuất Excel…" ở hàng tiêu đề) |
| `cap-2-ke-hoach.png` | TRƯỚC web Kế hoạch Test (G1-29, "Xuất Excel" + "Xuất điểm Test") · SAU K3 (một nút, ngăn mở sẵn Lịch Test) |
| `cap-3-panel-nhap-diem.png` | TRƯỚC web panel BE 03 (G1-46, Kết quả và ⋯ của R bị cắt) · SAU L1 (Kết quả dưới tên, ô hai tầng) |
| `g108-k1` … `g108-k8` | Từng khung G1-08: K1 Lịch Test · K2 ngăn Điểm (QL) · K3 ngăn Lịch (QL) · K4 GV · K5a Quản trị lớp thường · K5b Quản trị Lịch · K6a lỗi tuần · K6b rỗng + lỗi máy chủ · K7a–c 375 · K8 mở từ hồ sơ lớp (MT1…MT10) |
| `g111-l1` … `g111-l4b` | Từng khung G1-11: L1 BE 03 (đúng ca bản rà) · L2 FOU Final 4 môn, mọi trạng thái ô · L3a Pre FOU · L3b Checkpoint PET · L4a–b 375 |

## 1. Ý → chỗ trong mockup

| # | Ý (bản rà / giao việc) | Chỗ | Đạt? |
|---|---|---|---|
| 1 | G1-08: một nút xuất cho khu Test | "Xuất Excel…" ở hàng tiêu đề "Test", cùng chỗ trên Lịch Test tuần và Kế hoạch Test (K1, K3, K4, K7) | Đạt |
| 2 | Ngăn chọn Điểm / Lịch | Tab **Điểm Test · Lịch Test** ở đầu ngăn, tiêu đề chung "Xuất Excel" (K2, K3, K5, K8) | Đạt |
| 3 | Hết "hai nút cùng tên ra hai thứ" | Chỉ còn một nút; hai thứ tách bằng tên rõ "Điểm Test" / "Lịch Test" | Đạt |
| 4 | Hết "hai đường cùng xuất điểm" | "Xuất kết quả Test" + "Xuất điểm Test" gộp thành Điểm Test. Cột **Gọn** (19) thêm W1 · W2 · Kết quả + lớp "A → B" của "Chỉ điểm" cũ; **Gọn + nhận xét** (21) = "Điểm + nhận xét" cũ; **Đầy đủ** như cũ. Ba kiểu giải thích ở ⓘ (K2, K8) | Đạt |
| 5 | Giữ mọi lựa chọn, bộ lọc của 3 ngăn cũ | Bảng mục 2 — không mất thao tác | Đạt |
| 6 | Giữ quyền; GV không xuất Lịch (chủ SP 05/11) | K4: GV không có hàng Điểm / Lịch, tiêu đề "Xuất điểm Test", chỉ lớp GVCN. TVV / CX không thấy nút. Quản trị nhiều chi nhánh (K5) | Đạt |
| 7 | G1-11: Kết quả thấy ngay khi chấm, không cuộn ngang | Trong panel, Kết quả nằm dưới tên ở cột "Học viên · Kết quả" (L1–L3) | Đạt |
| 8 | ⋯ của môn không bị cắt | Ô môn hai tầng: điểm "đúng / tổng" trên, "Nhận xét" + ⋯ dưới — ⋯ nằm trong ô (L1–L3) | Đạt |
| 9 | Mọi môn FOU / BE / ELE / Pre FOU vừa | 4 môn (L2 FOU, L3b PET) và 1 môn (L3a Pre FOU) vừa 704 px, không cuộn ngang | Đạt |
| 10 | Đủ trạng thái | Vai GV / QL / Quản trị (K2–K5) · ngăn mở · panel nhiều môn · ô có / không Nhận xét (L2) · lỗi (K6a, K6b, ô lỗi lưu L2) · 375 (K7–K9, L4) | Đạt |
| 11 | Hệ hình ảnh giữ đúng web | Be Vietnam Pro + Inter số, token, nút, đoạn, panel chép nguyên mockup đã duyệt; chỉ thêm ô hai tầng và cột gộp | Đạt |

## 2. Thao tác TRƯỚC → SAU (không mất thao tác)

### G1-08 · Xuất

| Thao tác cũ | Ai | Sau |
|---|---|---|
| Lịch Test tuần › "Xuất Excel" (hàng lọc) → ngăn "Xuất kết quả Test" | GV (lớp GVCN), QL, Quản trị | Hàng tiêu đề › "Xuất Excel…" → ngăn mở sẵn **Điểm Test**, khung đang lọc, đúng tuần đang xem (như cũ) |
| Kế hoạch Test › "Xuất Excel" → ngăn "Xuất Excel · Kế hoạch Test" (lịch MT1…MT10) | QL, Quản trị | Hàng tiêu đề › "Xuất Excel…" → ngăn mở sẵn tab **Lịch Test**, phạm vi = bộ lọc đang xem (chip "Mọi lớp Fast Track đang hiện", như cũ). Thêm: thu hẹp lớp; Quản trị đổi chi nhánh (một chi nhánh mỗi lần — cùng tham số `branchId` cũ) |
| Kế hoạch Test › "Xuất điểm Test" → Điểm + nhận xét / Chỉ điểm · Theo tuần / Theo lớp (nhiều MT) / Lớp + khoảng tuần | QL, Quản trị | Ngăn › Điểm Test: **Gọn + nhận xét** / **Gọn** · Theo tuần (từ = đến) / chọn lớp + Theo đợt MT1…MT10 (K8) / chọn lớp + Theo tuần (khoảng) |
| Khung FT / Lớp thường · chi nhánh (nhiều) · lớp (tìm, nhiều) · tuần / tháng / đợt · Mọi lượt / Chỉ lượt đủ điểm · Cột gọn / đầy đủ · xem trước số lượt + dòng đầu | như cũ | Giữ nguyên trong Điểm Test (K2, K5) |
| Xem trước sheet "Kế hoạch Test" 4 hàng + sheet "Thông tin xuất" | QL, Quản trị | Giữ trong Lịch Test (K3, K5b) |
| Hồ sơ lớp ⋮ "Xuất kết quả Test" · Phân tích › Tổng hợp Test "Xuất Excel" (mở `NganXuatMt`) | như cũ | Giữ chỗ cũ, mở cùng ngăn mới với Điểm Test + lớp / chi nhánh đặt sẵn (không vẽ — cùng ngăn K2) |
| 375 Kế hoạch: ⋯ "Thao tác trang" (Xếp · Xuất Excel · Xuất điểm Test) | QL, Quản trị | ⋯ còn một mục nên bỏ (luật không ⋯ một mục): "Xuất Excel…" + "Xếp nhiều MT…" thành hai nút ở hàng tiêu đề (K7) |
| Xem trước lỗi máy chủ: phải đổi lọc để gọi lại | mọi vai | Thêm "Thử lại" tại dòng lỗi (K6b) |

Thêm: ngăn nhớ kiểu thời gian, lượt, cột lần trước của từng người (trình duyệt); ngày luôn theo tuần / tháng đang xem.

Mất thao tác: **không**. Đổi chữ: "Tải file .xlsx" (ngăn lịch cũ) → "Xuất Excel · 51 HV", cùng mẫu nút với Điểm Test.

### G1-11 · Panel Nhập điểm lớp thường (chỉ khi lưới trong panel; lưới đầy đủ ở trang Test không đổi)

| Thao tác cũ | Sau |
|---|---|
| Gõ "đúng" / "tổng", Enter / ↓ / ↑ đi theo cột | Giữ — ô điểm vẫn là hai ô trên cùng một hàng |
| "Nhận xét" trái ô điểm → hộp nhận xét | Giữ chữ "Nhận xét", xuống tầng dưới của ô; có nhận xét = "● Nhận xét" đậm màu nhấn (thêm dấu ●, trước chỉ khác màu) |
| Bàn phím: Enter / ↓ / ↑ theo cột; Tab Nhận xét → đúng → tổng → ⋯ | Enter / ↓ / ↑ giữ; Tab đúng → tổng → Nhận xét → ⋯ (cùng 4 điểm dừng, số đứng trước) |
| ⋯ của ô (Dời lịch, Lịch sử bài, Khôi phục điểm, gỡ "-"…), ẩn tới khi rê / focus | Giữ, cạnh "Nhận xét" ở tầng dưới. Tầng này luôn hiện ở hàng đang làm và ô có nhận xét / lỗi; hàng khác hiện khi rê / Tab vào (như cũ); 375 luôn hiện |
| Cột Kết quả (chip + nhãn Case + một dòng phụ), ⓘ luật Đạt | Cùng nội dung, dưới tên em; tiêu đề "Học viên · Kết quả ⓘ" (ⓘ gộp luật Đạt + % tổng của Checkpoint) |
| Cột "% tổng" (Checkpoint) | Gộp vào dòng Kết quả: "Đạt · 76% tổng" (L3b) |
| Hàng "Tổng số câu" + "Điền ô trống" · viền vàng tổng khác cột · lỗi lưu + "Lưu lại" · "-" dời tuần · ô chỉ đọc khi đợt hoàn tất · ⚠ quá hạn · tuần khác | Giữ nguyên (L2) |
| 375: lưới cuộn ngang cả tên | Cột "Học viên · Kết quả" đứng yên (dính trái), môn cuộn — Kết quả luôn thấy (L4); ⋯ và "Nhận xét" vùng bấm 44 |

Hai bố cục lưới: lưới trong panel (gọn, hai tầng) và lưới đầy đủ ở trang Test (một tầng, cột Kết quả riêng) — cùng `LuoiThuong`, đổi theo `useTrongKhung()` (đã có). Lưới đầy đủ không đổi trong mục này.

Mất thao tác: **không**.

## 3. Dòng đọc Turso

- G1-08: không thêm đường API, không thêm câu. Ngăn gọi đúng hai đường cũ (`/xuat-mt/xem-truoc` 400 ms sau lần đổi lọc cuối; `/ke-hoach-test/xuat` xem trước) — chỉ gọi đường của phần đang chọn, không gọi cả hai khi mở.
  "Gọn + nhận xét" cần nhận xét mà "Đầy đủ" đã đọc (cột nhận xét từng bài) — PR code kiểm lại để không thêm câu, đo trước → sau.
- G1-11: chỉ đổi bố cục, không đổi dữ liệu.

## 4. [XM] cần PTA Plan / chủ SP chốt

- **[XM-1] Cột "Gọn" thêm 3 cột.** Để gộp "Chỉ điểm" cũ không mất gì, mockup thêm W1 · W2 · Kết quả và lớp "A → B" vào "Gọn" (16 → 19 cột). Ai đang dùng tệp "Gọn" cũ sẽ thấy thêm 3 cột. Khuyến nghị: nhận (một mẫu, ít lựa chọn).
- **[XM-2] "Gọn + nhận xét" cho lớp thường?** Cũ chỉ FT xuất kèm nhận xét theo nhóm. Mockup giữ như cũ (lớp thường: Gọn / Đầy đủ).
- **[XM-3] MT9, MT10 trong "Theo đợt".** `DOT_XUAT_FT` hiện MT1–MT8; mockup nâng lên MT10 cho khớp ngăn điểm cũ (máy chủ `xuat-diem` đã nhận ≤ 20).
- **[XM-4] Tên nút.** Bản rà ghi "Xuất…"; mockup dùng **"Xuất Excel…"** cho cùng tên nút xuất ở hồ sơ lớp, Phân tích (một khái niệm một tên); "…" báo mở ngăn chọn.
- **[XM-5] Đường máy chủ cho GV.** `/ke-hoach-test/xuat-diem` trả 403 cho GV. Ngăn chung cần một đường cho cả "Gọn + nhận xét": khuyến nghị gom về `/xuat-mt` (đã theo phạm vi GVCN) — việc của PR code, ghi đo dòng đọc trước → sau.

## 5. Cổng critique (impeccable `critique`, hai agent tách: A rà thiết kế · B máy dò)

| Vòng | G1-08 Xuất | G1-11 Nhập điểm | Sửa sau vòng |
|---|---|---|---|
| 1 | 26/40 | 27/40 | P1: thiếu MT9–MT10; "Gọn" thiếu W1 · W2 · Kết quả · "A → B"; ô Lớp ở Lịch tự mâu thuẫn; hạn lặp; 375 vùng bấm < 44 · P2: Điểm / Lịch thành tab, ⓘ thay câu tĩnh, khung mở từ hồ sơ lớp (K8), nhớ lựa chọn |
| 2 | 30/40 | 29/40 | P2: chip "Mọi lớp" bỏ ✕; tầng "Nhận xét · ⋯" hiện khi cần (hàng thấp hơn) |
| 3 | **31/40** | **31/40** | Không còn P0 / P1. P3 còn: cột tên cao 3 dòng (~90 px / hàng) |

Chạm 30 ở vòng 2, làm thêm 1 vòng, dừng theo luật cổng (không còn P0 / P1). Máy dò (B): không P0 / P1; các phát hiện là màu / phông của hệ đã duyệt (máy dò không đọc token), chấm số chú thích mockup `.so-mk`, bóng ngăn phủ 32 px — giữ.
