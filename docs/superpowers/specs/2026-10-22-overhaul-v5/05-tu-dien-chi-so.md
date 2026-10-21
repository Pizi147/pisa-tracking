# 05 — Từ điển chỉ số V5

> V5-A, 22/10. Brief 15 (đề xuất cần kiểm với dữ liệu) + mã hiện có (`shared/domain/metrics.ts:40-290`, `server/src/worklist/metrics.ts`, `server/src/phanTich/giaoVien.ts`, `server/src/phanTich/baoCao.ts`).
> **Không phải cơ chế tính điểm KPI** (C08): không trọng số, không xếp loại, không ngưỡng màu.
> Cột "Mã hiện có": ✓ = đã có hàm gần đúng · ~ = có nhưng phải sửa · ✗ = chưa có (giai đoạn C).

## 1. Quy tắc chung (mọi chỉ số)

1. Hiện **% to** + "**n/N đơn vị**" ngay dưới (C03); bấm n/N → panel chỉ đọc đúng tập N (G7, brief 14.3).
2. Mẫu 0 → "**Chưa có dữ liệu**", không "0 %" (T19). Mẫu < 5 → kèm "mẫu nhỏ" (`TyLe.tsx`).
3. Tổng nhiều chi nhánh / lớp / GV = **Σ tử / Σ mẫu**, không trung bình các % (T20).
4. Ghi rõ **kỳ** ("W1 SEP – W2 SEP") hay **hiện tại** ("đến 14/09"); dữ liệu lịch sử trong kỳ không bị thay bằng trạng thái hôm nay.
5. "Chưa đủ dữ liệu" **không** nằm trong mẫu và không cùng màu / ký hiệu với "chưa đạt" (– viền đứt vs ✗).
6. Việc **huỷ / thu hồi / đã bỏ** ra khỏi mẫu (lượt `cancelled`: `baoCao.ts:27`, `tongHop.ts:175`, `giaoVien.ts:123`; Phối hợp `removed`: `phoiHop.ts:506`).
7. Một bản ghi qua nhiều lối xem vẫn đếm một lần; số không đổi khi thu gọn nhóm / phân trang (T17).
8. Kết quả học thuật gán GV theo **người dạy kỹ năng trong tuần thi** (`giaoVien.ts:230`); chấm đúng hạn gán theo **người được phân công ở hạn nhập** (`:195`), Speaking MT theo **người chấm** (`examiner_user_id`).

## 2. Quy tắc Overall khi xem kết quả GV (brief 15 — CHỐT C09, C10)

| Bước | Luật | Mã hiện có |
|---|---|---|
| 1 | MT: so **Overall** với kỳ vọng của chính lượt (Target − 1,0 MT1 · − 0,5 MT2 · = Target MT3+; MT0 / RF = Target). Thi thật: Overall so Target đầu ra của lần thi | ✓ `server/src/fasttrack/scoring.ts:107-110`; `ketQuaMock` `shared/domain/ketQuaThi.ts:20-23` |
| 2 | Overall đạt → không tính kỹ năng dưới kỳ vọng là tạch (đánh giá GV) | ✓ cho SOS (`scoring.ts:233-236`); **~ chưa** ở Phân tích GV (`phanTichLop.ts:149-152` tính theo kỹ năng) |
| 3 | Overall chưa đạt → kỹ năng dưới kỳ vọng tính "chưa đạt" cho **GV dạy kỹ năng đó** (tập đủ điều kiện) | ~ |
| 4 | Overall thiếu (chưa đủ 4 kỹ năng hoặc có kỹ năng bỏ) → "Chưa đủ dữ liệu", không đạt / không tạch | ✓ `scoring.ts:226-229` |
| 5 | Điểm kỹ năng thật vẫn hiện (✗ 5.0 vẫn đỏ ở bảng điểm) | ✓ |
| 6 | Chỉ cho báo cáo / đánh giá GV — **không** đổi máy SOS / Case | — |

W = (W1 + 2×W2)/3, làm tròn 0,5 (`scoring.ts:40-47`); Overall = TB 4 kỹ năng làm tròn 0,5, x.25 → x.5, x.75 → x+1 (`tongKetLoTrinh.ts:58-60`).

## 3. Từ điển

| # | Tên trên web | Đơn vị | Tử | Mẫu | Kỳ | Vai thấy (phạm vi) | Thiếu dữ liệu | Panel (chỉ đọc) | Mã hiện có |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Đạt MT** | HV (lượt MT mới nhất đã chốt trong kỳ của mỗi HV) | HV Overall ≥ kỳ vọng lượt | HV có lượt MT chốt, đủ Overall | kỳ chọn | QL (chi nhánh), QT (toàn / chi nhánh), GV (lớp / kỹ năng mình — theo luật mục 2), Hồ sơ lớp | HV thiếu Overall → nhóm "Chưa đủ dữ liệu" ngoài mẫu | HV · lớp · lượt · kỳ vọng · Overall · L R W S · kết quả; ghi số "ngoài mẫu" | ~ `baoCao.ts` (Mock dat / chua-dat / chua-du) — đơn vị hiện là lượt |
| 2 | **Đạt Test** (lớp thường) | HV | HV đạt ≥ 70 % mọi môn bài Progress / Final | HV đủ điểm | kỳ | như 1 | thiếu môn → ngoài mẫu | HV · bài · điểm / tổng | ~ |
| 3 | **Đạt Target thi thật** | HV | HV Overall ≥ Target đầu ra | HV có KQ thi thật hợp lệ trong phạm vi | kỳ (ngày thi trong kỳ) | QL, QT, GV (HV mình dạy lúc thi), TVV | chưa có KQ → hiện riêng "n HV chưa có KQ", không tính trượt | HV · ngày thi · Target · Overall · L R W S | ~ `KetQuaThi` |
| 4 | **Tiến bộ** | HV | HV tăng **Overall** giữa hai mốc so sánh được | HV có 2 mốc hợp lệ (cùng loại thang: MT liền kề) | kỳ (mốc sau trong kỳ) | QL, QT, GV, Hồ sơ GV | < 2 mốc → ngoài mẫu; khoảng trống ≠ không tiến bộ | HV · mốc 1 · mốc 2 · chênh | ~ `giaoVien.ts:243` (FT, band > MT trước, theo kỹ năng) — [XM] tiến bộ theo Overall hay theo kỹ năng của GV |
| 5 | **Case có PA** | Case | Case đã có PA hợp lệ | Case cần PA (mở trong kỳ, không huỷ) | hiện tại / kỳ | QL, QT, GV (Case mình phụ trách) | Case 0 → Chưa có dữ liệu | Case · HV · kỹ năng · người phụ trách · PA · ngày | ✓ `case-thieu-pa` (`metrics.ts:104`) — đảo thành tỷ lệ |
| 6 | **PA có kết quả** | PA | PA đã có kết quả đánh giá | PA đến hạn đánh giá | kỳ | QL, QT, GV | — | PA · HV · kết quả · ngày | ✓ `pa-co-ket-qua` (`:125`) |
| 7 | **PA cải thiện** | PA | PA kết quả "cải thiện" (+ "một phần" — [XM]) | PA đã có kết quả xác định (bỏ "chưa đủ dữ liệu") | kỳ | QL, QT, GV | PA chưa đánh giá hiện riêng | PA · kết quả | ✓ `ty-le-co-cai-thien` (`:132`) — hiện tính cả "một phần" |
| 8 | **Việc đúng hạn** | việc | việc xong ≤ hạn | việc **có hạn rơi trong kỳ** (gồm việc chưa làm đã trễ) | kỳ | GV (mình), QL / QT (GV chi nhánh), Hồ sơ GV | không việc có hạn → Chưa có dữ liệu | việc · loại · hạn · ngày xong · trễ n ngày | ✗ chưa có tỷ lệ chung (có riêng: PA, vi phạm — `giaoVien.ts:276`, `:303`) |
| 9 | **Điểm đúng hạn** | bài (ô điểm kỹ năng × HV × lượt) | bài nhập lần đầu ≤ mốc trễ | bài đến hạn thuộc trách nhiệm (phân công ở hạn; S MT theo người chấm) | kỳ | GV, QL, QT, Admin, Hồ sơ GV | loại: vắng, huỷ, bỏ, chờ dời, MT cũ, `-`, HV không còn học, chưa tới hạn | lớp · lượt · kỹ năng · HV · hạn · ngày nhập | ✓ `tapChamDiem` `giaoVien.ts:181-211` |
| 10 | **Quá hạn hiện tại** | việc (+ "gồm n bài" khi là chấm) | — (số đếm) | — | hiện tại (đến hôm nay) | GV, QL, QT, Hồ sơ GV | 0 → "0" không bấm | việc · hạn · trễ n ngày | ✓ nhiều nguồn (`bai-qua-han-nhap-diem` `:76`…) |
| 11 | **Xử lý vi phạm đúng hạn** | lần xử lý | `phan_hoi_ngay ≤ han_xu_ly` | lần cần xử lý hợp lệ, HV đang học | kỳ | GVCN, QL, QT | — | HV · bậc · hạn · ngày xử lý | ✓ `tapXuLyViPham` `giaoVien.ts:298-320` |
| 12 | **Báo PH xong** (TVV) | việc Báo PH | việc "Đã báo PH" (trong hạn hoặc không — hiện 2 số) | việc Báo PH phát sinh trong kỳ (không tính đã thu hồi) | kỳ | TVV (mình), QL / QT | — | HV · lớp · ngày phát sinh · hạn · lần thử · kết quả | ✗ (việc TVV chưa có — `06` điểm 1) |
| 13 | **Chưa liên hệ được** | HV | HV có việc Báo PH mở mà lần ghi gần nhất "Chưa liên hệ được" | — | hiện tại | TVV, QL | — | HV · số lần thử · ngày thử gần nhất · hạn | ✗ |
| 14 | **Thi tuần này** | HV | HV có ngày thi đã chốt trong tuần đang xem | — | tuần | QL, QT, GV, TVV | tháng / tuần dự kiến **không** tính | HV · lớp · ngày thi · Target | ~ |
| 15 | **Chờ KQ / bước tiếp** | HV | HV đã thi chưa có KQ + HV có KQ chưa chốt bước tiếp (2 số riêng) | — | hiện tại | TVV, QL, CX | — | HV · ngày thi · trạng thái · hạn bước tiếp | ✓ `trangThaiSauThi` `tongKetLoTrinh.ts:92-136` |
| 16 | **Chờ duyệt** | đề xuất | — (đếm) | — | hiện tại | QL, QT | — | (panel **việc** duyệt, không phải panel báo cáo) | ✓ |
| 17 | **SOS hiện tại** | HV | HV có SOS ≥ 1 ở lượt hợp lệ mới nhất | HV đang học có lượt | hiện tại | QL, QT, GV, Hồ sơ lớp | — | HV · mức · kỹ năng · lượt | ✓ `hv-sos-hien-tai` (`metrics.ts:40`) |
| 18 | **Độ đủ lịch Test** (Admin) | lớp × lượt | lượt có ngày + đủ người phụ trách kỹ năng | lượt đến hạn xếp trong kỳ | kỳ | Admin, QL | — | lớp · lượt · thiếu gì | ~ `lop-thieu-gv-mon` (`:254-288`) |
| 19 | **Ghi nhận trên lớp** | lần ghi | — (đếm, tuỳ chọn) | — | kỳ | GV, Hồ sơ HV | không ghi = bình thường, **không cảnh báo** (C11) | — | ✗ (T18) |

## 4. Nội dung panel báo cáo (mẫu chung)

1. Dòng loại: "BÁO CÁO · CHỈ ĐỌC".
2. Tiêu đề = tên chỉ số + giá trị vừa bấm ("Đạt MT2 · 75 % = 15/20").
3. Phạm vi: chi nhánh · chương trình · lớp · kỳ · kỹ năng · "số chốt lúc …" hoặc "hiện tại đến 14/09".
4. Cách tính: tử / mẫu bằng chữ; "Không tính: …" (nhóm ngoài mẫu và lý do).
5. Tóm tắt: tử · (mẫu − tử) · ngoài mẫu.
6. Bảng đúng tập mẫu, cột liên quan; tìm / lọc / xuất theo quyền; "Đang thấy 10 / 20 dòng".
7. Không nút xử lý (Thêm PA, Tạo Case, Ghi kết quả, Duyệt, Làm thay) — C22. Tên ↗ để tra hồ sơ.
