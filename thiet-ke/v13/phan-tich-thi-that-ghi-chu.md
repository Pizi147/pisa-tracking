# v13 · Phân tích — panel có điểm, Test lớp thường gọn, tab Thi thật, mở hết lớp — ghi chú

Đặc tả: `docs/superpowers/specs/2026-11-05-phan-tich-thi-that/de-xuat.md` (mục 2A–2F, chủ SP "Ok hết nhé" 05/11).
Khung nền: `thiet-ke/v11/phan-tich.html` (U08 đã duyệt) · `v11/ke-hoach-test.html` · `v11/lich-test-tuan.html` · panel `web/src/ui/BangLuotPanel.tsx` (#901).
Mật độ: M1–M10 (`docs/superpowers/specs/2026-11-05-mat-do-thong-tin/de-xuat.md`). Mockup: `thiet-ke/v13/phan-tich-thi-that.html`.

**Trạng thái:** PTA duyệt bảng 05/11 (fc6168d) → vẽ.

## 0. Brief (impeccable `shape`, tự rà — không hỏi chủ SP)

- **Ai, lúc nào:** QL, Quản trị, CX ngồi máy ở trung tâm, xem chất lượng đầu ra chi nhánh. TVV và GV xem kết quả lớp mình. Chế độ Operate, báo cáo thuần (G8).
- **Việc chính:** bấm một số → thấy ngay **em nào, điểm bao nhiêu, so mục tiêu ra sao**, không phải mở hồ sơ từng em. Tab Thi thật trả lời "bao nhiêu em vượt / đạt / trượt, kỹ năng nào yếu, GV nào".
- **Hướng:** giữ nguyên khung U08 (token, hàng lọc, thẻ chỉ số, thẻ bảng, panel 720). Không thêm dáng mới. Hộp c1–c4 chép dáng U03 / U04-1. Không thanh tỷ lệ (bảng hàng × cột, số + %).
- **Biên:** chỉ mockup. Không đổi luật, quyền, thứ tự tab (trừ đổi tên tab). Không thêm request ngoài "panel tải khi bấm" + một đường thống kê Thi thật.
- **Trạng thái cần vẽ:** có dữ liệu · rỗng (khoảng không có lượt thi) · vai TVV / GV · 375 sáng.

## 1. Bảng "ý → mockup"

Khu trong mockup: **A** panel · **B** Test lớp thường · **C** tab Thi thật · **D** mở hết lớp. Khung 1440 tối, 375 sáng.

| Ý (đặc tả) | Nội dung | Khu / khung | Cách vẽ (ngắn) |
|---|---|---|---|
| 2A-1 | Mọi ô số → panel BẢNG: danh sách em + điểm đúng đợt (FT: L R W1 W2 S + OVR; lớp thường: theo môn chương trình) | A1, A1m (FT) · A3 (lớp thường) | Panel 720 (dáng V11 A2). Đầu: loại · tiêu đề ô · "chi nhánh · khung · dữ liệu đến". Tổng "n lượt · m HV". Bảng. Khối Cách tính. |
| 2A-2 | Bấm điểm một kỹ năng → chi tiết tại chỗ: W / S ra c1–c4, L / R ra số câu đúng / tổng; dáng hộp U03 | A1 (ô W1 mở "TA 5.5 · CC 5 · LR 5.5 · GRA 5 → 5.5") · A1m 375 (ô L mở "18/40 câu") | Hộp `.hop-tc` của v11 hồ sơ lớp, neo dưới ô; ô chỉ có band không bấm. |
| 2A-3 | Cột riêng "Kỳ vọng" (FT) / "Target" (thi thật) cạnh điểm; ô điểm vẫn ✓ / ✗ | A1, A1m, C2, C3 | Thứ tự cột: … L R W1 W2 S · **OVR** · **Kỳ vọng**. Thi thật: L R W S · OVR · Target. ✓ / ✗ trước số (G12). |
| 2A-4 | Ô Tăng / Giữ / Giảm (Báo cáo HV, Phân tích GV): em · điểm kỹ năng bài trước → bài sau · chênh · mục tiêu | A2 | Cột: Học viên · Lớp · Trước (MT1 · 5.0) · Sau (MT2 · ✗ 5.5) · Chênh (+0.5) · Kỳ vọng. Không ghép chuỗi một ô (M10). |
| 2A-5 | Nền `BangLuotPanel`; ô đếm theo HV lấy bài gần nhất trong khoảng; cột kỹ năng đang xét tô nền | A1m (ô "Dưới kỳ vọng · L" → cột L tô nền) · C2 (ô "Fail · W" → cột W) · C3 (GV W1 → cột W) | Nền `--accent-soft` cả cột, đầu cột đậm. |
| 2A-6 | Không ô nào ra panel chỉ có tên; kiểm kê mọi ô số 6 tab | mục 2 file này | Bảng kiểm kê: tab · ô · panel hiện tại · panel mới (cột). |
| 2A-7 | Panel chỉ đọc; tên em → hồ sơ, MTn → đợt test, mã lớp → hồ sơ lớp; link chữ thường, gạch chân khi rê | A1–A4, C2, C3 | Dáng `.ten-hv` / `.lk-t` v11 (U08-6); khung vẽ một dòng đang rê để thấy. Không nút làm việc. |
| 2B | Test lớp thường bỏ Checkpoint, Mini Test, Xử lý; giữ Bài kiểm tra · Progress Test · Final Test · Thiếu điểm; Excel như cũ | B (1440) · Bm (375) | Bảng v11 lớp thường, bớt ba nhóm cột. Nút Xuất Excel giữ chỗ. |
| 2C-1 | Bỏ phần Mock Test, tab đổi tên "Thi thật"; Xuất Excel MT giữ ở chỗ hợp lý | C1 (hàng tab, hàng lọc) · bảng thao tác mục 3 | Hàng tab: … Test + SOS · **Thi thật** · … Bỏ ô đoạn Mock / Thi thật. Excel MT: ⋯ của Test + SOS "Xuất kết quả từng lượt" (đã có). |
| 2C-2 | Danh sách kết quả thi thật giữ như hiện có | C1 (thẻ cuối) | Bảng v11 A4: Học viên · Lớp · Ngày thi · OVR · L R W S · Target · Kết quả · Bước tiếp. |
| 2C-3 | Bộ lọc: chi nhánh · khoảng ngày thi · lớp; chỉ IELTS | C1 | Chi nhánh ở đầu trang (như cũ) · Thời gian "Toàn bộ \| Chọn khoảng" với 2 ô ngày (G10: thi thật giữ ngày) · Mọi lớp. |
| 2C-4 | Tổng: số em thi; Exceed (OVR > Target) · Đạt (=) · Fail (<), số + %; "Không thi" đếm riêng, không vào % | C1 thẻ chỉ số | 5 thẻ: Em thi · Exceed · Đạt · Fail · Không thi. Số bấm được; % cạnh số; mẫu số ghi ở thẻ Em thi ("23 có Target"). |
| 2C-5 | Từng kỹ năng L R W S: Exceed / Đạt / Fail theo điểm kỹ năng so **Target overall**, kèm điểm TB | C1 thẻ "Từng kỹ năng" | Bảng 4 hàng × cột Em · Exceed · Đạt · Fail · Điểm TB. Mỗi ô số + % mờ dưới (dáng Kết quả MT của Báo cáo HV). |
| 2C-6 | Theo GV: mọi GV từng dạy; mỗi GV × kỹ năng một dòng: số em, tổng tuần dạy, điểm TB, % Exceed / Đạt / Fail; trọng số tuần | C1 thẻ "Theo GV" | Bảng: Giáo viên · Kỹ năng · Em · Tuần dạy · Điểm TB · Exceed · Đạt · Fail. % theo trọng số (số lớn, bấm được) + "n em" mờ — cùng dáng ô % của Phân tích GV. Tên GV chỉ ở dòng đầu nhóm, kẻ bậc 1 giữa hai GV (M9). ⓘ ghi cách tính. |
| 2C-7 | Trọng số = tuần GV dạy kỹ năng cho em ÷ tổng tuần em học kỹ năng đó trong lộ trình (đến ngày thi) | C1 ⓘ Theo GV · C3 | Bảng chỉ hiện % đã tính trọng số; trọng số từng em ở panel C3. |
| 2C-8 | Mọi số → panel bảng: em · lớp · ngày thi · L R W S · OVR · Target (✓ / ✗) | C2 (ô "Fail · W") | Panel 720, cột W tô nền. |
| 2C-9 | Panel GV thêm cột "tuần dạy / tổng (8/12 · 67 %)" | C3 (dòng "Đỗ Vũ Tuấn Phong · W1") | Cột "Tuần dạy" cuối bảng. |
| 2C-10 | Thi lại một kỹ năng: kỹ năng lấy lại không tính lần thi mới; OVR vẫn tính | C1 danh sách · C2 · ⓘ Từng kỹ năng | Ô lấy lại mờ, có dấu "↺" + `title` "lấy lại từ 12/09"; chip "Thi lại W" ở cột Kết quả. Em ở Từng kỹ năng chỉ đếm W. |
| 2D | Kế hoạch Test, Lịch Test tuần: một nút "Mở tất cả lớp" ↔ "Thu gọn tất cả", chỉ QL / QT; mặc định gập; mẫu nút sẵn có | D1 (Kế hoạch Test) · D2 (Lịch Test tuần) · D3 375 | Nút chữ `.lk` 13 / 600 cạnh bộ đếm lớp (đúng mẫu U04 HV & Lớp). Một khung "đã mở hết" đổi chữ thành "Thu gọn tất cả". |
| 2E-1 | Ô không phải điểm (vi phạm, PA, bài chấm đúng hạn) giữ nội dung riêng; đủ: em · lớp · ngày / tuần · nội dung · trạng thái / kết quả | A4 (vi phạm) | Cột: Học viên · Lớp · Ngày · Nhóm · Mô tả · Người ghi · Trạng thái (viên `.nhan-td`). |
| 2E-2 | Theo GV chỉ QL, QT, CX; TVV / GV thấy Tổng + Từng kỹ năng | C5 (375, vai GV) | Không có thẻ Theo GV, không chỗ trống thay. |
| 2E-3 | W1 / W2 hai GV: trọng số tách theo task, W thi thật chia đều hai task | C1 Theo GV (dòng W1, W2) · C3 | Kỹ năng ghi "W1" / "W2"; ⓘ "mỗi task ½ W". |
| 2E-4 | Em KCK không vào % | C1 thẻ Em thi · danh sách | Thẻ Em thi: "23 có Target · 1 KCK". Dòng KCK: Target "KCK" mờ, Kết quả "—". |
| 2F-1 | Luật mới thay C10 ở cả ba nơi (tab Thi thật, Phân tích GV, hồ sơ GV), một hàm dùng chung | C1 (nhãn Exceed / Đạt / Fail) · B2 v11 không vẽ lại | Mockup chỉ vẽ tab Thi thật; Phân tích GV, hồ sơ GV đổi số, không đổi bố cục → ghi ở kế hoạch PR. |
| 2F-2 | Bỏ Mock Test kể cả chip SOS → panel Case, lọc "Mọi kết quả", xếp theo SOS | bảng thao tác mục 3 | Ghi BỎ + lý do. |
| 3 | Turso: panel tải khi bấm; thống kê Thi thật vài câu cả tab | mục 4 | Ước câu / dòng. |

### Điểm người vẽ tự quyết (đặc tả mục 4)

- **Bảng, không thanh tỷ lệ.** Chủ SP 27/10 muốn bảng đơn giản; thanh chỉ khi chủ SP thấy dễ đọc hơn.
- **Thứ tự khối:** Tổng → (Từng kỹ năng | Theo GV cạnh nhau ở 1440) → Danh sách kết quả. Từng kỹ năng hẹp (5 cột), Theo GV rộng.
- **Trọng số:** bảng chỉ hiện % đã tính trọng số + số em thật mờ; trọng số từng em xem ở panel GV. Không hiện "2,4 em".
- **375:** thẻ chỉ số 2 cột; Từng kỹ năng giữ bảng (5 cột hẹp vừa 343 px); Theo GV xếp thẻ mỗi GV; danh sách kết quả xếp thẻ em (như v11 C2).
- **Nhãn Exceed / Đạt / Fail** ở cả cột Kết quả của danh sách (thay "✓ Đạt / ✗ Chưa đạt") — một tên một thứ (M5). **[XM-1]** vì đặc tả ghi "giữ như hiện có".

## 2. Kiểm kê ô số 6 tab Phân tích (main a525b9e, đọc code 05/11)

### 2a. Bảy loại panel mới (dùng chung; số trên ô = số dòng panel — G7)

| Mã | Panel | Cột | Khung vẽ |
|---|---|---|---|
| **P-FT** | Bảng lượt FT | Học viên · Lớp · MT (+ tuần) · L R W1 W2 S · OVR · Kỳ vọng. Ô kỹ năng ✓ / ✗ trước số, bấm → hộp c1–c4 / số câu. Cột kỹ năng đang xét tô nền. Ô đếm HV → lượt gần nhất trong khoảng. | A1, A1m |
| **P-TG** | Tăng / Giữ / Giảm | Học viên · Lớp · Trước (MTn · điểm) · Sau (MTn · ✓/✗ điểm) · Chênh · Kỳ vọng | A2 |
| **P-LT** | Bảng bài lớp thường | Học viên · Lớp · Bài (+ tuần) · môn theo chương trình (BE / ELE: L R W S; FOU: L R G+V P) ghi "✗ 15/25" (G12) · Tổng (Final Test). Ngưỡng "đạt từ 70 %" ở dòng phụ đầu panel (M3: giống mọi dòng). | A3 |
| **P-TT** | Bảng thi thật | Học viên · Lớp · Ngày thi · L R W S · OVR · Target (✓ / ✗). Ô lấy lại khi thi lại mờ "↺". | C2 |
| **P-GV** | P-TT của một GV × kỹ năng | P-TT + **Tuần dạy** "8/12 · 67 %" | C3 |
| **P-VP** | Vi phạm | Học viên · Lớp · Ngày · Nhóm · Mô tả · Người ghi · Trạng thái (Chưa xử lý / Đang chuẩn bị xử lý / Đã xử lý). Ô đếm HV → mỗi em một dòng: Học viên · Lớp · Vi phạm · Chưa xử lý · Bậc hiện tại · Lần xử lý gần nhất (cùng cột bảng "Học viên cần chú ý"). Ô đếm lớp → Lớp · GVCN · HV có vi phạm / sĩ số · Vi phạm · Chưa xử lý. | A4 |
| **P-PA** | PA | Học viên · Lớp · Case (kỹ năng) · PA (loại) · Tuần bắt đầu · Kết quả (Cải thiện rõ / Một phần / Chưa cải thiện / Chờ kết quả) · Người phụ trách | không vẽ (cùng dáng A4) |

Giữ nguyên, không đổi: panel Case (`diemCase` + trạng thái + người + hạn — đã đủ) · `PanelChamDiem` (Chấm Test đúng hạn).

### 2b. Từng ô

"CHỈ TÊN" = dòng chỉ tên + lớp + tuần (lỗi chủ SP báo). "Điểm sai lượt" = có dòng điểm nhưng là lượt hiện tại của em, không phải lượt làm em vào ô.

| Tab | Ô | Panel hiện tại | Panel mới |
|---|---|---|---|
| Báo cáo HV | Thẻ Đạt MT · Chưa đủ dữ liệu | dòng điểm đúng lượt | **P-FT** |
| Báo cáo HV | Thẻ Thi trong kỳ | điểm sai lượt (lượt hiện tại, không phải bài thi) | **P-TT** |
| Báo cáo HV | Thẻ PA cải thiện | PA + chip cải thiện, không lớp / loại / tuần | **P-PA** |
| Báo cáo HV | Thẻ Case có PA | panel Case | giữ |
| Báo cáo HV | Kết quả MT: MT0 · MT1 · MT2 · MT3+ × Đạt · Thiếu 0.5 · 1.0 · ≥ 1.5 · Chưa đủ | dòng điểm đúng lượt | **P-FT** (hàng "Thi" → **P-TT**) |
| Báo cáo HV | Tiến bộ theo kỹ năng: L R W1 W2 S × Tăng · Giữ · Giảm | "MTn · R" + chip "MT1 5.5 → MT2 6.0", không mục tiêu, không lớp rõ | **P-TG** |
| Báo cáo HV (QT chưa chọn chi nhánh) | Bảng theo chi nhánh: Đạt MT · Thi · Case | như các dòng trên | như các dòng trên |
| Phân tích GV | Việc đúng hạn | "PA · đợt n" + Đúng hạn / Quá hạn, không ngày | **P-PA** + cột Hạn · Ngày ghi · Đúng hạn / Trễ n ngày |
| Phân tích GV | Chấm Test đúng hạn | `PanelChamDiem` | giữ |
| Phân tích GV | Đạt kỳ vọng Test (FT) | dòng điểm; lượt chưa điểm → CHỈ TÊN | **P-FT** (cột GV phụ trách viền nhấn như nay) |
| Phân tích GV | Đạt Test (lớp thường) | dòng điểm %; chưa điểm → CHỈ TÊN | **P-LT** |
| Phân tích GV | Tiến bộ (FT) | gần như CHỈ TÊN (không điểm hai lượt) | **P-TG** |
| Phân tích GV | HV cần chú ý | điểm sai lượt, không lý do | **P-FT** lượt gần nhất (lý do = cột tô nền) |
| Phân tích GV (Đầy đủ) | Case có PA | panel Case | giữ |
| Phân tích GV (Đầy đủ) | PA cải thiện | CHỈ TÊN + trạng thái, không nhãn cải thiện | **P-PA** |
| Phân tích GV (Đầy đủ) | Kết quả thi thật | dòng điểm thi + Target | **P-GV** (luật mới 2F) |
| Test + SOS · FT | Lượt MT · Đạt · SOS 1/2/3 · Thiếu điểm (bảng + thẻ) | `BangLuotPanel` L R W1 W2 S | **P-FT** (thêm OVR, Kỳ vọng, hộp c1–c4) |
| Test + SOS · FT | Dưới kỳ vọng · L R W1 W2 S | điểm sai lượt, cột không tô nền | **P-FT** lượt gần nhất, tô cột kỹ năng |
| Test + SOS · FT | HV - Case (số trước) | điểm sai lượt | **P-FT** lượt sinh Case |
| Test + SOS · FT | HV - Case (số sau) · Chưa chốt PA · Đang xử lý | panel Case | giữ |
| Test + SOS · Lớp thường | Bài kiểm tra · Progress Test (Đạt hết · 1 môn trượt · ≥ 2 môn trượt) · Final Test (4 dải %) · Thiếu điểm | **CHỈ TÊN** | **P-LT** |
| Test + SOS · Lớp thường | Checkpoint · Mini Test · Xử lý | CHỈ TÊN / điểm sai lượt / Case | **BỎ cột** (2B) |
| Kết quả Test → **Thi thật** | Mock: thẻ Lượt · Đạt · Chưa đạt · Chưa đủ · chip SOS · chip SOS trong bảng → `PanelCaseLuot` | dòng điểm / panel Case | **BỎ** (2C, 2F) |
| Thi thật | Thẻ Em thi · Exceed · Đạt · Fail · Không thi | (cũ: Lượt thi · Đạt Target · Chưa đạt · Bước tiếp chưa chọn — dòng điểm không ✓ / ✗) | **P-TT** |
| Thi thật | Từng kỹ năng: L R W S × Exceed · Đạt · Fail | mới | **P-TT** tô cột kỹ năng |
| Thi thật | Theo GV: Em · Exceed · Đạt · Fail | mới | **P-GV** |
| Hiệu quả PA | PA có kết quả · Có cải thiện (bảng + thẻ) | PA, không loại / kết quả | **P-PA** |
| Hiệu quả PA | Học viên | điểm sai lượt | **P-PA** gộp theo em |
| Hiệu quả PA | Chưa tính: PA chờ kết quả · chưa rõ nơi học | PA (+ nút Ghi kết quả) | **P-PA** (giữ nút Ghi kết quả — [XM-4]: G8 báo cáo thuần) |
| Hiệu quả PA | Case chưa chọn nhóm | panel Case | giữ |
| Ý thức | Vi phạm · Chưa xử lý (thẻ, hàng lớp, nhóm, HV) | "Loại · dd/mm" + tên, không lớp / mô tả / trạng thái | **P-VP** |
| Ý thức | HV có vi phạm · thẻ HV cần chú ý | điểm sai lượt, không vi phạm | **P-VP** theo em |
| Ý thức | Thẻ Lớp có vi phạm | **CHỈ TÊN** (mã lớp) | **P-VP** theo lớp |

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước (main) | Sau | Giữ / bỏ / đổi |
|---|---|---|---|
| Bấm ô số → panel | 6 tab | 6 tab, panel P-* | GIỮ, đổi nội dung |
| Bấm ô điểm kỹ năng trong panel → c1–c4 / số câu | không có | P-FT, P-TT, P-GV | THÊM (2A-2) |
| Tên em / mã lớp / MTn trong panel → hồ sơ | có ở BangLuotPanel | mọi panel | GIỮ |
| Tab "Kết quả Test / Thi" | tên cũ | "Thi thật" | ĐỔI tên |
| Ô đoạn Mock Test \| Thi thật | đầu hàng lọc | bỏ | BỎ (một loại) |
| Lọc "Mọi kết quả", Xếp theo SOS, chip SOS → panel Case | phần Mock | bỏ | BỎ (2F: Test + SOS đã chia mức SOS; Case xem ở hồ sơ qua tên em) |
| Xuất Excel · n lượt (Mock) | cuối hàng lọc phần Mock | Test + SOS (FT) ⋯ "Xuất kết quả từng lượt" — hiện cho vai có `xuatMt` **và** vai từng thấy nút cũ (PTA XM-3) | ĐỔI chỗ, không vai nào mất |
| Xuất Excel (Thi thật) | cuối hàng lọc | như cũ | GIỮ |
| Bộ lọc chi nhánh · thời gian · lớp | có | có; thời gian theo ngày thi | GIỮ |
| Test lớp thường: ô Checkpoint, Mini Test, Xử lý | bảng | bỏ cột; Excel giữ cột | BỎ trên màn (2B) |
| Test lớp thường: Cột hiện, Xuất Excel | ⋯ / cuối hàng | như cũ | GIỮ |
| Kế hoạch Test, Lịch Test tuần: mở từng lớp | có | có | GIỮ |
| "Mở tất cả lớp" ↔ "Thu gọn tất cả" | không có | QL, QT | THÊM (2D) |

**PTA chốt 05/11:** XM-1 đồng ý (Exceed xanh lá · Đạt xanh dương · Fail đỏ, cùng màu ô ✓ / ✗) · XM-2 đồng ý (Bài = Progress + Final + Thiếu điểm) · **XM-3 đổi chỗ, không ai mất:** mục ⋯ "Xuất kết quả từng lượt" ở Test + SOS (FT) hiện cho **hợp hai tập vai**: vai có `xuatMt` (như nay, tệp đầy đủ) **và** mọi vai từng thấy nút Excel Mock cũ (tệp = đúng dữ liệu nút cũ). Một nhãn, một chỗ · XM-4 giữ nút Ghi kết quả · XM-5 đồng ý · Theo GV đọc theo `class_id` của em trong tập, có trần ở `tocDoDuong` (ghi cho PR code).

Câu hỏi đã gửi PTA (giữ để tra): **XM-1** cột Kết quả danh sách thi thật đổi "✓ Đạt / ✗ Chưa đạt" → Exceed / Đạt / Fail (một tên một thứ) · **XM-2** bỏ Checkpoint thì "Bài kiểm tra" có còn đếm bài Checkpoint (PET / KET)? Đề xuất: không đếm, để Bài = Progress + Final + Thiếu điểm cộng đúng · **XM-3** Excel MT như trên · **XM-4** nút Ghi kết quả trong panel Hiệu quả PA trái G8 — đề xuất giữ (đã có, không bớt thao tác) · **XM-5** "Thi trong kỳ" (Báo cáo HV) đổi sang P-TT nghĩa là chỉ em ĐÃ có kết quả; em có ngày thi chưa có kết quả ghi "Chưa có kết quả" ở ô điểm.

## 4. Dòng đọc Turso (ước, chi nhánh Cẩm Phả ~200 HV)

| Đường | Lúc chạy | Câu | Dòng |
|---|---|---|---|
| Panel P-FT / P-TG / P-LT (một ô) | chỉ khi bấm | 3–5 (lượt theo id + điểm theo lô; c1–c4, số câu đã có trong `SELECT s.*`) | ≤ 40 lượt × ~8 điểm ≈ 350 |
| Panel P-TT / P-GV | khi bấm | 2–3 | ≤ 60 kết quả ≈ 300 |
| Panel P-VP / P-PA | khi bấm | 2–3 | ≤ 100 |
| Tab Thi thật — Tổng + Từng kỹ năng | mở tab | 1–2 (kết quả thi thật + điểm kỹ năng trong khoảng) | ~50–200 |
| Tab Thi thật — Theo GV (QL / QT / CX) | mở tab | +2 (`teacher_assignments` của các lớp đó · `enrollments` của các em đó) | ~300 + ~600 |

Cả tab ~5 câu, ~1 000 dòng với khoảng 2 tháng. **Cảnh báo:** "Toàn bộ" cả năm có thể ~500 kết quả → Theo GV ~2 500 dòng (> 2 000). Đề xuất: Theo GV đọc đúng `class_id` của em trong tập (không đọc cả chi nhánh), và đường có trần ở `tocDoDuong.ts`. Vai TVV / GV không chạy 2 câu Theo GV.

## 5. Tự rà mockup theo bảng ý (mở `phan-tich-thi-that.html`, 05/11)

| Ý | Đạt? | Ở đâu |
|---|---|---|
| 2A-1 panel bảng có điểm | ✓ | A1 (FT, ô "SOS 3 · W5 OCT" đúng ảnh chủ SP) · A1m · A3 (lớp thường, môn theo chương trình) |
| 2A-2 hộp c1–c4 / số câu tại chỗ | ✓ | A1 ô W1 Lê Minh Thư · A1m ô L "17/40 câu" · C2 ô W Đinh Tuấn Kiệt |
| 2A-3 cột Kỳ vọng / Target cạnh điểm | ✓ | A1, A1m (góc phải thẻ), A2, C2, C3 |
| 2A-4 Tăng / Giữ / Giảm: trước → sau · chênh · mục tiêu | ✓ | A2 |
| 2A-5 tô nền cột kỹ năng đang xét | ✓ | A1m (L) · C2 (W) · C3 (W) |
| 2A-6 kiểm kê ô số | ✓ | mục 2 |
| 2A-7 chỉ đọc, link chữ thường | ✓ | mọi panel; A1 dòng 3 vẽ trạng thái rê |
| 2B bỏ Checkpoint · Mini Test · Xử lý | ✓ | B, Bm (bỏ cả thẻ "Chưa chốt PA" của khung lớp thường) |
| 2C-1 tab "Thi thật", bỏ Mock, chỗ mới Excel MT | ✓ | C1 hàng tab · C7 (⋯ Test + SOS) |
| 2C-2 danh sách giữ | ✓ (đổi nhỏ, xem dưới) | C1 thẻ cuối |
| 2C-3 bộ lọc chi nhánh · ngày thi · lớp | ✓ | C1 |
| 2C-4 Tổng Exceed / Đạt / Fail + % · Không thi riêng | ✓ | C1 thẻ chỉ số (5 + 9 + 9 = 23 có Target) |
| 2C-5 Từng kỹ năng so Target overall + điểm TB | ✓ | C1 (L 21 · R 21 · W 23 · S 21) |
| 2C-6, 2C-7 Theo GV, trọng số tuần | ✓ | C1 · C3 |
| 2C-8 panel ô số | ✓ | C2 "Fail · W" đủ 15 dòng |
| 2C-9 panel GV cột "tuần dạy / tổng · %" | ✓ | C3 |
| 2C-10 thi lại một kỹ năng | ✓ | C1 Trần Khánh Vy · C2 Lý Thanh Mai (↺) |
| 2D nút Mở tất cả lớp ↔ Thu gọn tất cả | ✓ | D1, D1b (mở đủ 7 em CP FT 116), D2, D3 |
| 2E-1 panel vi phạm đủ thông tin | ✓ | A4 (cuộn trong panel, 36 dòng) |
| 2E-2 TVV / GV không có Theo GV | ✓ | C5 |
| 2E-3 W1 / W2 tách task | ✓ | C1 dòng W1, W2 · C3 "W1 tính nửa W" |
| 2E-4 KCK không vào % | ✓ | C1 thẻ Em thi "trừ 1 KCK khi tính %" · dòng Hồ Đức Thịnh |
| 2F-1 một hàm cho 3 nơi | ghi cho PR | chỉ tab Thi thật có bố cục mới; Phân tích GV, hồ sơ GV đổi số, không đổi khung |
| 2F-2 bỏ 3 thao tác Mock | ✓ | mục 3 |

**Quyết định thêm khi vẽ (sau critique vòng 1):**
- Danh sách thi thật đổi thứ tự cột thành **L R W S · OVR · Target**, cùng thứ tự mọi panel (một loại một chỗ). Trước đây OVR đứng trước L.
- Theo GV xếp **GV có Fail cao nhất trước**; trong một GV, kỹ năng theo thứ tự L R W1 W2 S. Ô % không kèm "n em" (% có trọng số, số em thật ở panel).
- M1: chỉ tên em / tên GV đậm. OVR, Điểm TB chữ thường.
- Panel bảng điểm rộng 820; ô điểm 14 (thang lưới điểm G13).

**Cho PR code (`web-design-guidelines` + detector):**
- Ô ngày dùng `ONgay` (ô gõ + nút lịch, có nhãn). Ô chọn dùng `OChon` (`select` thật).
- Panel mở và lớp mở ghi lên URL như nay (`?panel=`, `mo`).
- Ô số trong bảng dày giữ vùng bấm `VUNG_BAM_SO` của `OSo`. Ô điểm bấm được là `button`, có `aria-expanded`; hộp đóng bằng Esc hoặc bấm ra ngoài.
- Detector: 22 cảnh báo mức advisory, không có lỗi. Các cảnh báo là màu / phông / bo góc lệch DESIGN.md, nằm ở phần chú thích mockup. Logo "PISA" 3,1 : 1 là chữ thương hiệu cỡ lớn, giữ như cũ.

## 6. Cổng chất lượng (impeccable `critique`, A + B hai agent độc lập)

| Vòng | Điểm | P0 / P1 | Đã sửa |
|---|---|---|---|
| 1 | 28/40 | P1 × 2 | Số trên ô ≠ số dòng panel (C2 vẽ đủ 15 dòng; A4 cuộn trong panel; D1b mở đủ 7 HV) · bỏ "n em" cạnh % trọng số · OVR cùng một chỗ ở danh sách và panel · Theo GV xếp Fail cao trước · chỉ tên đậm (M1) · bỏ chuỗi "·" ở thẻ 375 |
| 2 | 30/40 | không | dữ liệu panel khớp danh sách · cùng thứ tự GV ở 375 · số câu đúng thang IELTS · "Chưa có MT kế tiếp · 4 em" khớp 4 dòng · đầu cột MT khi mở lớp |
| 3 | 30/40 | P1 × 1 | % panel GV đối chiếu được ("tỉ lệ 4,0 / 7,3 · 55 %" + Cách tính) · một tên "HV" trong tab Thi thật · thi thật chỉ có band → ô không mở hộp c1–c4 |

Dừng sau vòng 3 theo luật 28/10 (chạm 30 → tối đa 2 vòng nữa; xong chỉ cần không P0 / P1). P1 cuối đã sửa và tự kiểm trên ảnh C3. Giữ như v11 đã duyệt: dấu ✓ / ✗ (✓ xanh lá vượt · ✓ xanh dương bằng), ẩn ô chi nhánh ở 375, mờ mép hàng tab 375, hộp điểm thành phần đè dòng dưới (dáng U03).

**Ảnh:** `anh/*-1440-toi.jpg` và `anh/*-375-sang.jpg` (18 khung). Mở `phan-tich-thi-that.html`, nút "Đổi sáng / tối" để xem 1440 sáng.
