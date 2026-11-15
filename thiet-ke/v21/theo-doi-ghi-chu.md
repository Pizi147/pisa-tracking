# Mockup ⑬ Theo dõi trực diện — ghi chú

Tệp: `theo-doi.html` + `theo-doi.css` (nạp `v21.css`, `tong-quan.css` chỉ đọc) · ảnh cặp `anh/theo-doi/cap-*.jpg`.
Đề bài `docs/superpowers/specs/2026-11-13-overhaul-v6/13-thiet-ke-dot-4.md` mục 1, H7 · H8 · H9, mục 5 "⑬" (R13.1–R13.3), mục 6 · luật chung G1–G5 (`11-de-bai-mockup-dot-2.md`) · V22 · lời 37, 40, 43–48.
Nền: ① `trang-dau-gv.html` (Lớp của tôi) · ⑧ `tong-quan.html` (panel Case) · ⑨ `phan-tich.html` (panel Chưa làm, tab SOS) · web thật (seed 14/09/2026, cổng 4713 / 5713, đã tắt).

## 0. Lời chủ SP trong session này (nguyên văn, đã chuyển PTA Overhaul)

15/11, lúc session đang xem web thật (Tổng quan Admin văn phòng, đầu trang "Tổng quan · Mock Test · W3 SEP"):

> "tại sao trang tổng quan mà lại có chữ Mocktest ở trên đầu trang? có liên quan gì không? xóa đi"

Session hiểu như sau: chữ "Mock Test" ở dòng phạm vi đầu trang Tổng quan của **Admin văn phòng** (web `worklist/MockTestAdmin.tsx`; mockup ⑧ T5 "Monbay · Mock Test · W3 SEP"; dòng loại panel "Số liệu · Mock Test") → bỏ, đầu trang còn "Monbay · W3 SEP" như QL. Chỗ này ngoài phạm vi ⑬ (tệp ⑧ + mã web) nên đã chuyển PTA Overhaul (SendMessage 15/11). Trong ⑬, panel "GV chấm quá hạn" của Admin (C4) dùng dòng loại "Số liệu · Tổng quan".

## 1. Ba chỗ đổi, mỗi chỗ một câu

| Hạng mục | Đổi gì | Không làm |
|---|---|---|
| H7 Sắp tới (GV) | Một dòng mảnh trên "Lớp của tôi", dáng **dải chỉ số mỏng chuẩn** (cao 44, ⑤ H3). Có ba cụm: Test tuần tới · Ghi kết quả PA tới kỳ thứ Ba · Báo cáo PH mở ngày. Bấm số → hộp nhỏ tại chỗ. Ở 375 gọn thành MỘT hàng 44, bấm "⌄" để mở. | Không vào số việc / badge / chuông. Không màu hạn (việc chưa tới = thường, V22). Không có gì thì không hiện dòng. |
| H8 Case theo bước (QL) | Gom hai panel ("Case chưa có PA 38", "45 Case đang mở") thành **một** panel "Case đang mở". Đầu panel có **dải bước** Chờ mô tả · Chờ chọn PA · Đang chạy · Chờ kết quả cuối, thêm **ngoặc "Chưa có PA · 38"** trùm bước 1 + 2. Bấm để lọc. Danh sách nhóm theo bước, mỗi dòng có GV phụ trách + hạn. | Không thêm ô ở mặt trang Tổng quan / Phân tích. |
| H9 Sao chép (QL / Admin) | Nút "Sao chép" ở cuối dải tên mỗi GV (panel một GV: ở hàng tiêu đề). Chép ra chữ thuần, không tên học viên. Bấm xong hiện "✓ Đã chép" trong 2 giây. | Nhóm "S chéo chung" và "Chưa có GV" không có nút. Không thêm kênh gửi (Zalo / email). |

## 2. Bảng truy vết khung → thành phần → TRƯỚC → SAU

| Khung | Thành phần | TRƯỚC | SAU | |
|---|---|---|---|---|
| A1 | Danh sách việc trái, tab hạng mục, "14 việc · 9 quá hạn", "+ Task", Lớp của tôi | ① K1 / web GD-1 | như nền, đọc theo V22 (chip hạn, badge, nút-chip chỉ dùng màu, không ⚠); badge Chấm Speaking đỏ (lời 45) | GIỮ |
| A1 | Dòng "Sắp tới" | không có | `.sap-toi` = dáng `.dai-cs`: nhãn "Sắp tới" · cụm "tên + ô số" · ⓘ ở cuối | THÊM |
| A1–A2 | Ô số trong cụm | — | ô số gạch chân (OSo của dải chỉ số) → hộp nhỏ neo dưới số: Test (lớp · đợt · môn tôi chấm · "Lịch Test W4 SEP ›") · PA (em link · lớp · kỹ năng · kỳ) · Báo cáo PH (mã lớp → tab Báo cáo PH · phần tôi viết · "Chung" nếu chủ nhiệm) | THÊM |
| A3 / A4 | Theo trạng thái | — | thiếu cụm nào thì bỏ cụm đó · không cụm nào thì không hiện dòng | THÊM |
| A5 / A6 | 375 | web: công tắc "Việc · Lớp của tôi" | Sắp tới nằm đầu view "Lớp của tôi": khi gọn là MỘT hàng 44 "Sắp tới · Test · Kết quả PA · Báo cáo PH ⌄"; khi mở là mỗi cụm một hàng 44, danh sách hiện ngay dưới hàng bấm (không lặp tiêu đề) | THÊM |
| B1 | Ô "Case chưa có PA 38" · số "45" ở dòng phụ | web: hai panel khác nhau ("Case chưa có PA" nhóm Case trống PA / Chờ mô tả / Chờ xác nhận PA; "Case đang mở" phẳng) | **một** panel "Case đang mở · Monbay · 45". Mở từ 38 thì ngoặc bật sẵn, mở từ 45 thì không lọc | GOM (lời 35) — [XM-2] |
| B1 | Dải bước | không có (web có dải nhóm trong danh sách) | `.buoc`: 4 nút bước (tên trên, số dưới, màu số V22) + ngoặc "Chưa có PA · n" + "Bỏ lọc bước" ở hàng ngoặc | THÊM |
| B1 | Dòng Case | web: em · mô tả Case · lớp · điểm ✗ / kỳ vọng / thiếu · GV · hạn · link "Hồ sơ" | bảng chuẩn `.bang`: Học viên (link, lớp ở dòng phụ) · Case (lượt · kỹ năng · SOS / điểm · kỳ vọng) · Phụ trách · Hạn. Bấm dòng → hồ sơ HV mở sẵn Case | ĐỔI dáng, GIỮ thông tin; bỏ chữ "Hồ sơ" (tên HV đã là link, G2) và "thiếu 1.0" (= kỳ vọng − điểm) |
| B1 | Nhóm theo bước | web: dải nhóm có vạch màu theo bước (V21) | dải nhóm nền surface-2, chữ "Chờ mô tả · 12 · 3 quá hạn" (đỏ, không ⚠). Vạch trung tính | ĐỔI — [XM-5] |
| B2 | Bước "Đang chạy" | — | chỉ 5 Case; hạn = kỳ ghi kết quả tới; PA đang chạy ở dòng phụ | THÊM |
| B3 | Phân tích › SOS "Chưa chốt PA 3" | web: panel danh sách phẳng "Chưa chốt PA · 2 tuần" | cùng panel bước, tập = Case của lượt MT trong kỳ; nhãn ô đề xuất "Chưa có PA" | ĐỔI — [XM-1] |
| B4 | Lọc lớp (cột "Case chưa có PA" của bảng lớp) | ⑧ T2 "Lớp: MB FT 101 ✕" | GIỮ chip "Lớp: … ✕"; bước 0 mờ, không bấm | GIỮ |
| B5 | Đang tải · lỗi · rỗng | web Skeleton · ErrorState · Empty | khung xương cả dải bước · "⚠ Không tải được danh sách Case · Thử lại" (G2) · "Không còn Case đang mở" | GIỮ dáng chuẩn |
| B6 | 375 | web: thẻ dòng | bước 2 × 2, ngoặc trùm hàng đầu (vùng chạm 44); Case thành thẻ: em + chip hạn · lớp, lượt, kỹ năng, SOS · GV | ĐỔI |
| C1 / C2 | Panel "Chưa làm" (⑨ D5 / D6) | ⑨ đã duyệt, web chưa code | GIỮ toàn bộ; thêm "Sao chép" ở cuối dải tên GV; nhóm "S chéo chung" không có nút | THÊM |
| C1 | Khối chữ dán ra | — | khối trắng NGOÀI khung web = chữ đúng như dán ra | THÊM (chỉ cho người duyệt) |
| C3 | Panel GV trễ chấm, một GV (QL bấm "Bài quá hạn") | web `PanelGvTre` | GIỮ; "Sao chép" ở hàng tiêu đề (panel một GV không có dải tên) | THÊM |
| C4 | Panel GV trễ chấm nhiều GV (Admin VP) | web: dải tên + chip "12 bài" | GIỮ; nút ở mỗi dải; badge tròn chỉ số (một kiểu với ⑨, lời 35); "Chưa có GV" không có nút; dòng loại "Số liệu · Tổng quan" (mục 0) | THÊM / ĐỔI nhỏ |
| C5 | Trình duyệt chặn chép · panel rỗng | — | hộp nhỏ ⚠ (lỗi, V22 cho phép): chữ bôi đen sẵn, hướng dẫn "Ctrl + C (máy tính) hoặc giữ ngón tay (điện thoại)" · panel rỗng không có nút | THÊM |
| C6 | 375 | ⑨ D7 | nút cao 44 ở cuối dải tên | THÊM |

**Chữ dán ra** (chép đúng tab đang xem; dòng của một em ghi "1 bài" / "1 em", không tên):
```
Cao Khánh Linh · 4 bài quá hạn (tới 14/09)
• MB FT 101 · Chấm MT2 Writing 2 · 3 bài · quá hạn 4 ngày
• MB FT 108 · Chấm MT1 Reading · 1 bài · quá hạn 2 ngày
```
```
Trần Ngọc Hà · 2 việc quá hạn (tới 14/09)
• MB FT 108 · Viết Báo cáo PH tháng 8 · 4 em · quá hạn 6 ngày
• MB FT 108 · Xác nhận xử lý vi phạm · 1 em · quá hạn 1 ngày
```

## 3. Bảng thao tác TRƯỚC → SAU

| Việc | TRƯỚC | SAU | Mất? |
|---|---|---|---|
| GV biết tuần tới có gì | không có; tự nhớ hoặc mở Lịch Test | đọc dòng Sắp tới; bấm số → hộp → link đúng chỗ (hồ sơ HV mở sẵn Case / tab Báo cáo PH / Lịch Test tuần đó) | — |
| GV đóng hộp Sắp tới | — | ✕ · Esc · bấm ngoài · bấm lại số (375: bấm lại hàng) | — |
| QL bấm ô "Case chưa có PA 38" | panel 38 dòng, nhóm Case trống PA / Chờ mô tả / Chờ xác nhận PA | panel "Case đang mở", ngoặc "Chưa có PA · 38" bật sẵn, 38 dòng nhóm Chờ mô tả / Chờ chọn PA | không (gom) |
| QL bấm "45" | panel 45 dòng phẳng | cùng panel, không lọc, nhóm theo 4 bước | không |
| QL lọc theo bước | không có | bấm bước / ngoặc; bấm lại hoặc "Bỏ lọc bước" để bỏ | — |
| QL bấm số lớp ở bảng "Lớp cần chú ý" | panel lọc lớp | GIỮ: chip "Lớp: … ✕" | không |
| QL mở Case | link "Hồ sơ" cuối dòng | tên HV (link) hoặc cả dòng → hồ sơ HV mở sẵn Case | không (đổi chỗ bấm) |
| Phân tích › SOS bấm "Chưa chốt PA" | danh sách phẳng | cùng panel bước | không |
| QL / Admin nhắc GV quá hạn | chụp màn hoặc gõ tay | "Sao chép" → dán Zalo | — |
| Panel GV trễ chấm: bấm dòng → em còn trống → Nhập hộ | có | GIỮ y nguyên (không vẽ lại) | không |
| Panel Chưa làm: tab Chấm Test / Việc, link tên GV, Đóng | có | GIỮ | không |

## 4. Lượt đọc cơ sở dữ liệu (Turso — CLAUDE.md)

| Hạng mục | Mở trang | Khi bấm | Ước tính |
|---|---|---|---|
| H7 | `/my-work` vai GV: Test tuần tới **0 câu** (đã có trường "Test sắp tới" của LG-8) · PA tới kỳ **+1 câu**: PA của Case GV phụ trách, `action_due` trong (hôm nay + 2, hôm nay + 7], trả kèm em · lớp · kỹ năng (≤ ~15 dòng / GV) · Báo cáo PH: ngày mở tính từ lịch (0 câu), lớp lấy từ `session.assignments` (0) | hộp nhỏ dùng dữ liệu đã nạp: **0 request** | ≤ ~30 dòng mỗi `/my-work` GV. Khoảng 50 GV × 20 lần mở / ngày ≈ 30 nghìn dòng / ngày (≈ 0,2 % mức 15 triệu). Cần chỉ mục theo `action_due` (PTA Plan đo trên bản chép, thêm trần ở `tocDoDuong.ts`) |
| H8 | 0 (không thêm ô) | panel đang có đã tính `k`, `coPa`, hạn, GV (`xuLyCaseMany`). Tách "Đang chạy" / "Chờ kết quả cuối" cần mốc PA: **≤ +1 câu** theo `caseIds` (≤ ~60 dòng PA). Gom hai panel còn một đường. | ≤ ~100 dòng mỗi lần mở panel; khoảng 50 lần mở / ngày ≈ 5 nghìn dòng / ngày |
| H9 | 0 | 0: chữ ghép từ dữ liệu panel đã tải | 0 |

## 5. [XM] — chờ PTA Overhaul / chủ SP

1. **[XM-1] Một tên cho "chưa có PA".** Tổng quan ghi "Case chưa có PA". Phân tích › SOS (⑨, ô và cột bảng) ghi "Chưa chốt PA". Mã (`giaoVien/hoSo.ts:334`): Case chưa có PA = Case đang mở ∩ "Case chưa chốt PA", nên hai tập gần như trùng nhau. Đề xuất: dùng một tên **"Chưa có PA"** ở cả hai nơi. Ngoặc trong panel đã dùng tên này; B3 vẽ nhãn ô theo đề xuất. PTA Plan kiểm hai tập có trùng thật không; nếu khác nghĩa thì giữ hai tên và đặt ngoặc theo tên ô vừa bấm.
2. **[XM-2] Gom hai panel.** ⑧ T2 đã duyệt tiêu đề "Case chưa có PA · Monbay · 38". Nay ô 38 mở panel "Case đang mở · Monbay · 45" với ngoặc "Chưa có PA · 38" bật sẵn (số vừa bấm vẫn thấy ngay ở ngoặc). Lý do: muốn thấy Case kẹt ở bước nào thì cần đủ bốn bước trong một panel (lời 35 "gom chung").
3. **[XM-3] Gộp nhóm vào bước.** "Chờ chọn PA" = "Case trống PA" (GV phải Thêm PA) + "Chờ xác nhận PA" (PA quy chế chờ GV xác nhận); việc của GV đều là chọn PA. "Chờ mô tả" = Chờ mô tả Case + Chờ xác nhận Case. Case đang "Chờ QL duyệt" (đổi PA, không theo dõi) đề xuất xếp vào bước đang đứng và hiện thẻ "Chờ duyệt"; chưa vẽ. Muốn tách thêm bước thì báo.
4. **[XM-4] Màu số bước.** Số = tổng Case của bước. Màu lấy theo Case gấp nhất trong bước: đỏ nếu có Case quá hạn, vàng nếu có Case tới hạn trong 2 ngày. Số Case quá hạn ghi bằng chữ ở đầu nhóm danh sách ("3 quá hạn"). Phương án khác: thêm badge đỏ riêng cho số quá hạn ngay trong nút bước, nhưng dày hơn.
5. **[XM-5] Không dùng vạch màu theo bước của V21.** V21 cho dải nhóm theo bước vạch đỏ / vàng / xanh. Nay V22 dành đỏ cho quá hạn, nên nhóm dùng vạch trung tính; ý nghĩa bước nằm ở tên bước.
6. **[XM-6] Sao chép: phạm vi và đơn vị.** (a) Chép **tab đang xem** (Chấm Test hoặc Việc). Muốn một tin gom cả hai tab của một GV thì đổi được. (b) Dòng đầu dùng đơn vị theo badge: "4 bài quá hạn" ở Chấm Test / GV trễ chấm, "2 việc quá hạn" ở tab Việc. Đề bài ghi luôn "n việc", nhưng bản rà thấy GV nhận tin dễ hiểu hơn khi số khớp badge.
7. **[XM-7] Cụm Test của Sắp tới trùng một phần cột "Test" của Lớp của tôi.** Cột Test cho đợt gần nhất của từng lớp; cụm Sắp tới gom các lớp có Test tuần tới vào một chỗ. Giữ theo đề bài; nếu thấy thừa thì bỏ cụm Test.
8. **[XM-8] Ghi chú cho PR code (không đổi luật):** hộp nhỏ Sắp tới có `role="dialog"`; khi mở thì đưa tiêu điểm vào hộp, Esc trả tiêu điểm về ô số. Nút Sao chép đổi `aria-label` theo trạng thái và báo qua vùng `aria-live` (mockup đã có). Khi `navigator.clipboard` lỗi thì mở hộp chữ bôi đen (C5). Head tutor có Sắp tới như GV (lời 16); TVV không có.
9. **[XM-9] Mục 0** (chữ "Mock Test" ở Tổng quan Admin) → PTA Overhaul.

## 6. Soi ✕ / ⓘ (đo trên ảnh chụp 2×: tâm phần mực so với tâm nút, cả Tối lẫn Sáng)

| Nút | Số chỗ | Lệch ngang | Lệch dọc |
|---|---|---|---|
| ✕ panel / hộp 36 × 36 | 18 | ≤ 0,25 px | ≤ 0,5 px |
| ✕ chip lọc 22 × 22 | 1 | 0,5 px | 0,25 px |
| ⓘ 28 × 28 | 17 | ≤ 0,25 px | ≤ 0,75 px |
| ⓘ 36 × 36 (375) | 2 | 0 | 0 |

Mọi nút đạt ≤ 1 px. Không có "⋯" mới.

## 7. Critique (impeccable, hai bản rà tách riêng) — đã sửa

- Detector: 24 dấu. 14 dấu tương phản là số tròn vàng của phần chú thích mockup (`.so-mk`, v21.css, không lên web). 7 + 1 + 2 dấu là màu / bo / phông của phần đọc mockup hoặc phông đã khoá. `.viec.chon` có sẵn ở v21.css, ⑬ không dùng. Không có lỗi ở giao diện web.
- Rà thiết kế: **29 / 40**, không có P0. Đã sửa hết 4 P1: (1) B3 tên ô ≠ tên ngoặc → XM-1 + vẽ nhãn "Chưa có PA"; (2) hạn 15/09 – 16/09 (≤ 2 ngày) sửa thành vàng ở mọi bước + Lớp của tôi, số "Đang chạy" vàng; (3) chữ chép đơn vị khớp badge (XM-6); (4) ngoặc 375 vùng chạm 44. Đã sửa luôn các P2: 375 Sắp tới gọn một hàng 44, hộp 375 không lặp tiêu đề; báo "Đã chép" cho trình đọc màn hình; badge nhóm GV một kiểu (C1 = C4); bỏ dòng đếm lặp "38 / 45" ("Bỏ lọc bước" lên hàng ngoặc); chữ "+ n Case" một mẫu; hộp chặn chép có cách chép trên điện thoại. Còn lại ghi nhận nhỏ, không sửa: vạch trái 3 px ở dải nhóm là luật G14 / V21 đã có; dòng GV trễ chấm vừa có "hạn 09/09" vừa có chip "quá hạn" là thành phần web cũ, ngoài phạm vi.

## 8. Tự rà từng dòng R

| Dòng | Yêu cầu | Đạt | Ở đâu |
|---|---|---|---|
| H7 | MỘT dòng mảnh trên Lớp của tôi; việc chưa sinh trong 7 ngày (Test tuần tới · PA thứ Ba · Báo cáo PH mở ngày) | ✓ | A1, dải cao 44 |
| H7 | Mỗi cụm bấm ra đúng chỗ | ✓ | A2: hộp → hồ sơ HV mở sẵn Case / tab Báo cáo PH / "Lịch Test W4 SEP ›" |
| H7 | Không có gì thì không hiện; không tính vào số việc / badge | ✓ | A4; số việc 14, badge 9 không đổi |
| R13.1 | đủ ba cụm / một cụm / không có; 375 | ✓ | A1 · A3 · A4 · A5 · A6 |
| H8 | panel mở từ ô "Case chưa có PA" / số Case ở Tổng quan và Phân tích SOS; dải bước 4 bước, số + màu V22, bấm để lọc | ✓ | B1 · B2 · B3 |
| H8 | dòng có GV phụ trách + hạn; không thêm ô ở mặt trang | ✓ | cột Phụ trách · Hạn; mặt trang không đổi |
| R13.2 | dải bước + danh sách lọc; bấm dòng → Case; panel rỗng | ✓ | B1–B6 (B5 rỗng / tải / lỗi) |
| H9 | nút ở đầu mỗi nhóm GV trong panel Chưa làm + panel theo GV ở Tổng quan | ✓ | C1 · C2 · C3 (một GV) · C4 (Admin, nhiều GV) |
| H9 | chữ thuần, không tên HV, mẫu "{GV} · n … quá hạn (tới dd/mm)" + "• lớp · việc · số bài / em · quá hạn n ngày"; "✓ Đã chép" 2 giây | ✓ (đơn vị theo badge — XM-6) | khối chữ C1 · C2 · C3; nút C1 |
| R13.3 | vẽ khung "chữ dán ra" ngoài khung web | ✓ | khối trắng cạnh C1, C3 |
| G1 | nâng cấp, giữ bố cục + thao tác nền | ✓ | mục 3, không mất thao tác |
| G2 | dùng thành phần chuẩn (dải chỉ số, panel, bảng, dải nhóm, nút nhỏ, chip lọc, câu lỗi) | ✓ | — |
| G3 | không chú thích tĩnh / bước xác nhận / tab mới | ✓ | giải thích ở ⓘ |
| G4 | html + css riêng + ghi chú + ảnh 1440 Tối + Sáng, 375 Sáng, ảnh cặp | ✓ | `anh/theo-doi/` 22 ảnh cặp |
| V22 | hạn chỉ dùng màu, không ⚠ (⚠ chỉ ở lỗi) | ✓ | tắt `::before ⚠` của hai tệp nền |
| Lời 37 | số bấm được trong bảng = hộp viền; không chữ nhỏ dưới số | ✓ | bảng nền giữ hộp viền; nút bước: tên trên, số dưới (dáng ô số) |
| Lời 40 | thông tin theo trạng thái | ✓ | cụm / dòng ẩn khi rỗng; bước 0 mờ; không nút ở S chéo chung / Chưa có GV / panel rỗng |
| ✕ / ⋯ | tâm lệch ≤ 1 px | ✓ | mục 6 |

## 9. Ảnh (`anh/theo-doi/`, mỗi ảnh = TRƯỚC │ SAU + một câu "đổi gì")

`cap-a1-toi` · `cap-a1-sang` · `cap-a2` · `cap-a3` · `cap-a4` · `cap-a5` · `cap-a6` · `cap-b1-toi` · `cap-b1-sang` · `cap-b2` · `cap-b3` · `cap-b4` · `cap-b5` · `cap-b6` · `cap-c1-toi` (kèm chữ dán) · `cap-c1-sang` · `cap-c2` · `cap-c3-toi` (kèm chữ dán) · `cap-c3-sang` · `cap-c4` · `cap-c5` · `cap-c6`.
TRƯỚC lấy từ web seed (GV Trần Ngọc Hà, QL Nguyễn Khánh Vy, Admin VP — dữ liệu demo). Riêng panel Chưa làm, web chưa code nên TRƯỚC lấy từ mockup ⑨ D5 / D6 / D7 đã duyệt.
