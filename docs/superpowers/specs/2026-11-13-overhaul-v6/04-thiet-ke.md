# Overhaul V6 — bản thiết kế (chờ chủ SP duyệt)

PTA Overhaul · 13/11. Đọc kèm: `loi-chu-sp.md` (lời 1–14, nguyên văn) · `luat/0-luat-core-mot-trang.md` (luật không đổi) · `luat/5-y-do-thiet-ke-gan-day.md` (ý đồ phải giữ) · `02-de-xuat-hai-nhom.md` (bảng đề xuất, đã duyệt) · `03-de-bai-mockup-1.md`.
Người đọc: session dựng mockup, session code, PTA Plan. Đọc xong phải lên được plan mà không cần hỏi lại chủ SP.

## 1. Ý định và lý do

GV là người nhập liệu chính. GV thật đang: "không biết thao tác ở đâu như thế nào, cần phải làm gì, nhập điểm chỗ nào, thấy UX/UI loạn và khó theo dõi, nhiều cái thừa thãi" (lời 4). Luật và logic ổn; GV chưa thuộc quy chế mới nên web phải hỗ trợ nhiều hơn (lời 5). Web hiện tại là nền có ý đồ — học từ nó, chỉ sửa UI/UX (lời 7).

**Chẩn đoán:** web có đủ thành phần; sai ở **cửa vào và thứ tự** (trang đầu GV là số liệu; lối nhập điểm rải 7 nơi; ba việc GV tự khởi xướng nằm sâu trong tab), ở **dáng không thống nhất** (một việc hiện 5 nơi bằng 4–6 dáng) và ở **mật độ** (luật gọn M1–M10 mới áp vài màn).

## 2. Mục tiêu · không làm · thế nào là thất bại

**Mục tiêu (đo được):**
1. GV mới mở web tự trả lời "tôi cần làm gì" và "nhập điểm ở đâu" trong vài giây, không cần hướng dẫn: việc và lớp nằm ngay trang đầu.
2. Một loại việc **một dáng dòng, một panel**, mở từ đâu cũng giống nhau.
3. GV không cần thuộc quy chế: mỗi panel việc có **một dòng quy chế** (mặc định là gì · lưu xong ai nhận, hạn nào · chọn khác thì sao).
4. Mọi màn gọn theo cùng một bộ luật mật độ và một bộ thành phần.

**Không làm:** đổi luật nghiệp vụ ngoài 6 điểm chủ SP đã chốt (mục 5.10) · làm lại logic, API, quyền · khung / tab Quản trị mới · Tutor, KET / PET thi thật (hoãn) · bảng rộng một dòng một việc · bước xem trước / xác nhận cho thao tác thường ngày · "Đang chờ người khác".

**Thất bại dù chạy được:** mất một thao tác đang có mà không có lý do · web lệch hình ảnh mockup đã duyệt · thêm chữ giải thích tĩnh · thêm request / dòng đọc Turso đáng kể · GV phải học lại cách làm một việc (chỉ được đổi đường tới việc).

## 3. Ràng buộc

- Luật core: `luat/0`. Ý đồ phải giữ + ngôn ngữ thao tác chuẩn: `luat/5` mục 2, 3. Hướng đã bị bác: `luat/5` mục 5.
- CLAUDE.md: mockup HTML duyệt trước khi code (1440 + 375, sáng + tối, đủ trạng thái) · một màn một PR · bảng truy vết + bảng thao tác TRƯỚC → SAU · ảnh cặp, cổng ≥ 90 % KHỚP · chủ SP duyệt ảnh cặp trước merge · hình ảnh theo mockup sát, tính năng theo luật.
- Turso: mỗi PR có trần câu + dòng ở `server/src/tests/tocDoDuong.ts`, đo trước → sau; mục tiêu cả đợt: **không thêm request mới khi mở trang đầu**.
- Model: Fable chỉ làm đề bài / thiết kế / plan / rà; mockup + code = session Opus 5.5 / Sonnet 5.5 (lời 13). **Session mockup: PTA Overhaul tự mở và giao (lời 15). Session code: PTA Plan giao, rà, merge.**

## 4. Các hướng đã cân nhắc

| Hướng | Được | Mất | Kết quả |
|---|---|---|---|
| A · Việc dẫn đường (trang đầu chỉ có việc) | Trả lời "làm gì" | Không có cửa cho việc chưa sinh và việc GV tự khởi xướng | Không chọn |
| B · Lớp dẫn đường (trang đầu là các lớp) | Đúng cách GV nghĩ | Phải dò từng lớp; việc không thuộc lớp nào không có chỗ | Không chọn |
| **C · Việc bên trái + lớp bên phải** | Trả lời cả hai câu trên một trang; dùng lại trang Công việc đang có | Phải kỷ luật mật độ | **Chủ SP chọn (lời 6, 12)** |
| Giữ khung, dọn từng màn | Ít rủi ro | Đã làm 5 đợt, không chữa "không biết thao tác ở đâu" | Loại |
| Viết bản mới song song | Sạch | Rơi tính năng (bài học V5), nuôi hai bản | Loại |

## 5. Thiết kế

### 5.1 Cửa vào theo vai
GV / GVCN và TVV: trang đầu = **Công việc**. Admin văn phòng, QL, Quản trị, CX: giữ Tổng quan hiện tại (đã là trang làm việc của họ). Menu GV: Công việc · Học viên & Lớp · Test. Đường `/` của GV, TVV chuyển sang Công việc; link cũ vẫn chạy.
Số liệu ở Tổng quan GV (4 ô số, bảng "Kỹ năng tôi dạy", "Lớp tôi chủ nhiệm") → Hồ sơ GV (cùng nguồn số, cùng hàm). 5 ô số của TVV → một dải mỏng đầu trang Công việc.

### 5.2 Trang đầu GV (mockup ①, đề bài `03`)
Trang Công việc giữ nguyên khung đã duyệt (tab hạng mục + badge, danh sách trái 640, làm ở khung phải). Khung phải khi chưa chọn việc = **"Lớp của tôi"**: mỗi lớp một dòng — mã lớp · tôi dạy gì · tình trạng Test theo luật B2–B4 · việc của tôi ở lớp. Nút "Nhập điểm" chỉ ở lớp đang có bài của tôi. Nhóm gập "Lớp tôi dạy" cuối danh sách bỏ (đã lên khung phải). 375: công tắc hai đoạn "Việc · Lớp của tôi".

### 5.3 Việc: một dáng dòng, một panel, một dòng quy chế
- **Dòng việc** chuẩn = dáng v12 / v18 (S1–S13). Dùng cùng thành phần ở: Công việc · dải "Việc của tôi" hồ sơ lớp · thanh việc hồ sơ HV · hộp chuông. Hồ sơ HV hiện đủ việc của người xem (thêm Nhập điểm, Tình hình đang thiếu). Chuông mở thẳng panel việc.
- **Panel việc** = `PanelViec` đang có; mọi nơi mở cùng panel (hồ sơ HV thôi kiểu "nhảy tab").
- **Dòng quy chế**: một dòng 13 px màu phụ, cố định ngay trên chân panel; nội dung lấy từ luật (không viết tay từng nơi); đổi theo lựa chọn đang chọn. Chi tiết dài → ⓘ / "?". Danh sách câu cho từng loại việc: session mockup ⑤ soạn từ `luat/1`–`4` mục "Người làm cần thấy gì", PTA Overhaul rà.
- **Tên việc** = động từ + đối tượng, đúng hành động nút.

### 5.4 "+ Ghi"
Một nút ở trang đầu GV, đầu hồ sơ lớp, đầu hồ sơ HV: Ghi vi phạm / nhắc nhở · Báo tình hình cho TVV · + Case → chọn em (điền sẵn khi đang ở hồ sơ em / lớp) → form đang có. Nút cũ trong tab Ý thức giữ. Quyền như nay (mọi GV dạy lớp).

### 5.5 Nhập điểm và Speaking chấm chéo
- Lưới nhập giữ. Hộp nhập một ô (FT): nút chính "Lưu · bài tiếp ›" + "Vắng"; thao tác khác vào nhóm phụ "⋯" — không mất thao tác nào.
- **Speaking chấm chéo (lời 9–11):** giữ tab riêng; vẫn MỘT việc chung; panel gom **tuần Test → lớp**, cùng lưới nhập; tuần cũ gập; đầu tab "Việc chung của nhóm GV Speaking · n bài · m quá hạn"; ô "GV chấm" ở đầu ngăn lớp, **lưu ở máy chủ** theo lớp × tuần (thay localStorage); "Đã có điểm" ghi "GV chấm: …".

### 5.6 Việc "Báo cáo PH" của GV (lời 12–14) — việc mới
Người giữ: GV có phần phải viết ở lớp (GV kỹ năng: phần mình; GVCN: phần Chung). Mỗi lớp × đợt một dòng (một dòng = 1 việc). Sinh khi đợt mở; xong khi người đó đủ phần của mình cho mọi em; quá hạn sau hạn. Tab riêng "Báo cáo PH" ở Công việc (rỗng thì ẩn); nút "Viết ›" sang tab Báo cáo PH của hồ sơ lớp.
- FT: đợt tháng, mở ngày 20, hạn 30 (tháng 2: 28) — đã đúng trong mã.
- Lớp thường: đợt Progress / Final, mở thứ Hai tuần Test, **hạn thứ Ba tuần kế tiếp** (lời 14 — ĐỔI: mã đang là Chủ nhật tuần Test).
- Vai khác không có việc này; việc Admin "Xuất báo cáo PH" giữ.

### 5.7 Hồ sơ lớp (mockup ②) · Hồ sơ HV (mockup ③)
- Hồ sơ lớp: đầu trang 2 hàng (mã lớp + chip · GV theo kỹ năng thu gọn); nút "+ Ghi"; "Nhập điểm" chỉ hiện với người có ô để nhập hoặc quyền nhập hộ; dải "Việc của tôi" dùng dòng việc chuẩn; giữ tab, ⋯ dòng, khối điểm, tab Báo cáo PH. Em đã chuyển còn bổ trợ: theo GV-CU-BO-TRO.
- Hồ sơ HV: thanh việc dùng dòng việc chuẩn + mở panel; giữ hai cột Tiến độ │ Case, bấm thẳng để sửa, ba tab; tab Ý thức đồng bộ kiểu tab lớp (việc đang dở).

### 5.8 TVV (mockup ④)
Trang đầu = Công việc (Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ) + khung phải "HV của tôi" khi chưa chọn việc (em · lớp · việc đang chờ · thi tháng này). Dải mỏng 5 chỉ số ở đầu.

### 5.9 Các màn còn lại
Áp luật mật độ M1–M10 (`2026-11-05-mat-do-thong-tin/de-xuat.md`) + một bộ thành phần (một thanh tab, một menu thả, một dải chỉ số, một kiểu lịch sử) cho: Học viên & Lớp · Test (Lịch Test, Kế hoạch Test, trang lượt) · Phân tích · Quản trị · Hồ sơ GV · Lưu trữ · Hướng dẫn. Không đổi bố cục các màn này → không cần mockup mới; mỗi màn một PR có ảnh trước | sau. Làm nốt: ô số hộp ở Tổng quan / hồ sơ lớp, tên đầu panel là link. Cập nhật Hướng dẫn "?" theo đường đi mới trong cùng PR đổi đường.

### 5.10 Sáu điểm luật / máy chủ chủ SP đã chốt (lời 12–14)
| # | Đổi | Nguồn |
|---|---|---|
| S1 | GV có việc "Báo cáo PH" (5.6) | lời 12, 13 |
| S2 | Hạn Báo cáo PH lớp thường = thứ Ba tuần sau tuần Test | lời 14 |
| S3 | Việc "Điền Target" bỏ khỏi GVCN, TVV giữ; GVCN thấy nhắc + "Đề xuất sửa" | 2.3 |
| S4 | S chấm chéo: người nhập không phải GV Speaking phải chọn "GV chấm" | 2.4 |
| S5 | Một định nghĩa "GV Speaking" theo quyền N7 | 2.5 |
| S6 | TVV báo PH vi phạm xong → tin "Cập nhật" cho GVCN | 2.7 |

## 6. Màn × mức đổi × mockup

| Màn | Mức | Mockup |
|---|---|---|
| Trang đầu GV (Công việc + Lớp của tôi + "+ Ghi" + S chấm chéo + tab Báo cáo PH) | Lớn | ① đang dựng |
| Hồ sơ lớp | Vừa | ② |
| Hồ sơ HV | Vừa | ③ |
| Trang đầu TVV | Vừa | ④ |
| Bảng mẫu: dòng việc · panel việc · dòng quy chế · hộp nhập gọn · chuông | Vừa (nền) | ⑤ |
| Hồ sơ GV (nhận số liệu Tổng quan GV) | Nhỏ | không (theo mẫu sẵn có) |
| Học viên & Lớp · Test · Phân tích · Quản trị · Lưu trữ · Tổng quan QL / Admin / CX | Nhỏ (mật độ + thành phần) | không |

## 7. Thứ tự làm

0. Sửa lỗi F01–F07, L1–L8 (PTA Plan đang giao) — độc lập.
1. Mockup ① → chủ SP duyệt → ⑤ ② ③ ④ (session Opus do PTA Overhaul tự giao, song song được sau khi ① duyệt).
2. Máy chủ: S1–S6 + dữ liệu "Lớp của tôi" / "HV của tôi" (không đổi bố cục → không chờ mockup; PR máy chủ chạy trước PR giao diện).
3. Nền giao diện: dòng việc chuẩn + panel + dòng quy chế + bộ thành phần (theo ⑤).
4. Trang đầu GV → Speaking chấm chéo → "+ Ghi" → hộp nhập gọn.
5. Hồ sơ lớp → hồ sơ HV → TVV.
6. Mật độ các màn còn lại (mỗi màn một PR nhỏ) + Hồ sơ GV + Hướng dẫn + sửa chữ tài liệu (Rulebook, plan.md 1.6).
Mỗi đợt xong là web vẫn nhất quán và deploy được (không có trạng thái nửa cũ nửa mới ở cùng một màn).

## 8. Nghiệm thu chung

- 5 kịch bản bấm thử trên seed, vai GV mới: (1) mở web → nhập điểm lớp đang có bài; (2) ghi một vi phạm cho em lớp mình; (3) GV Speaking chấm một bài chấm chéo của tuần này; (4) GVCN xử lý vi phạm theo mặc định; (5) viết Báo cáo PH khi đợt mở. Mỗi kịch bản: số lần bấm từ lúc mở web, có phải đoán không — so trước | sau.
- Bảng thao tác TRƯỚC → SAU của từng màn không mất dòng nào không có lý do.
- Số đếm: badge = chuông = đầu trang = tổng các tab (một hàm `demDongViec`); tab S chấm chéo ghi rõ "việc chung".
- Turso: trang đầu GV không thêm request so với `/my-work` hiện tại.

## 9. Để người làm quyết (không cần hỏi chủ SP)

Tên biến, cách tách thành phần, cách ghép dữ liệu "Lớp của tôi" vào câu đã có (nguồn gợi ý: dữ liệu bảng "Kỹ năng tôi dạy" + nhóm "Lớp tôi dạy" ở `web/src/modules/worklist/LopToiDay.tsx`), thứ tự PR nhỏ trong một đợt, câu chữ cụ thể của dòng quy chế (theo luật, PTA Overhaul rà).

## 10. Còn mở

- Việc Báo cáo PH: GVCN vừa dạy kỹ năng vừa viết phần Chung → một dòng (đề xuất) hay hai dòng.
- Đợt Báo cáo PH do QL thêm bất chợt (`them`) có sinh việc cho GV không (đề xuất: có, theo hạn QL đặt).
