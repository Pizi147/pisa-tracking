# v4a — Trang Công việc (XI.1–7) · bố cục việc ở Tổng quan (IV.8) · việc của TVV ở đâu · 20/10/2026

Agent v4a (Opus 5.5). CHỈ ĐÁNH GIÁ: không sửa mã, không git, không lưu gì trên demo (http://localhost:5173, ngày demo 14/09/2026, mã = main).
Không lặp cái đã ghi ở tài liệu chính / a2 / v1 / v3b: dẫn mã (CV-xx, X9, 10.2, 10.3, V3B-03…) và chỉ thêm cái mới, sâu hơn, hoặc sửa cái cũ.
Nhãn ý: **(A)** đã chốt · **(B)** chủ SP đề xuất, chưa chốt · **(C)** PTA đề xuất · **(D)** lỗi đã xác nhận · **(E)** cần kiểm chứng · **(F)** xung đột / chưa rõ.
Ảnh: `ANH = C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\` · số đo DOM: `ANH\do-v4a-dom1.json`, `ANH\do-v4a-dom2.json` · script / spec: `…\scratchpad\chup\v4a-*`.

---

## Tóm tắt 10 dòng

1. **Ảnh 2 (`3.png`) — "Phân công…" sai case là lỗi GỐC, không chỉ nút thừa (D):** web đoán "chưa có người" từ `ownerId === null` rồi mở **phân công cả lớp**; Case 14 thiếu chủ nhưng lớp ĐÃ có GV môn R → lưu phân công **không gán được chủ Case** (không mã nào ghi `owner_user_id` khi phân công) → việc **không bao giờ xong**. Kèm một dòng trùng "Chọn người phụ trách" mở panel **không có ô chọn người**.
2. **Ảnh 3 (`4.png`) — tiêu đề bị che là lỗi lưới CSS (D), không phải z-index:** `WorkList.tsx:148` đặt vùng mở rộng vào cột 2 (`sm:col-start-2`) → cột tiêu đề co **0 px** (đo: lưới `0px 494px`, nút tiêu đề rộng 0) ở 1 024 / 1 280 / 1 440; 375 đúng. Cùng chỗ đó sau khi Lưu ("✓ Đã lưu") cũng mất tiêu đề (đọc mã).
3. **Một danh sách có 5 kiểu mở** (khung phải · mở danh sách em · form dưới dòng · đổi trang ↗ · ngăn phủ chồng) — gốc của cảm giác "lộn xộn". Đề xuất luật **một danh sách, một kiểu mở**.
4. **Danh sách Công việc dày vì nhóm theo LOẠI nghiệp vụ, không theo NGƯỜI PHẢI LÀM / MỨC GẤP:** QT Monbay 84 việc + 10 thẻ; dòng việc đầu ở **y = 752 px** (1440) và **1 505 px** (375); 42–49 phần tử bấm được trong khung nhìn đầu; 24 dấu ⚠. Mockup 2 "Sau" đã duyệt cũng cùng dáng này → phải thiết kế lại hơn cả mockup.
5. **Khuyến nghị bố cục danh sách — phương án A "hàng đợi 3 cột: Hạn · Việc + đối tượng · ›"**, nhóm cố định theo vai, nợ cũ gom một dòng, Chờ duyệt là dòng (không thẻ), mọi dòng mở khung phải. Đếm 8 việc thật: bằng hoặc ít bước hơn, 0 đổi trang, việc "Chưa có người" từ **không xong được → 0–3 bấm**.
6. **Tổng quan ↔ Công việc:** giữ hướng 10.2 (Chờ duyệt là nhóm đầu của MỘT hàng đợi — ảnh 2.jpg chính là bố cục A chủ SP vừa chê) và **làm rõ phân vai**: Tổng quan = việc **TÔI** phải làm/quyết + tình hình; Công việc của QL / QT / Admin = **theo dõi việc của GV + giao việc + lịch sử duyệt**; GV giữ Công việc là trang đầu. Hiện 16/21 việc ở "Cần bạn quyết" trùng y Công việc.
7. **Panel "chữ díu" có số đo:** nhãn ô 11,5 px đậm trên giá trị 14 px; 4–7 cỡ chữ mỗi panel; khoảng dọc 0 px ở 4 panel (Chấm Speaking 25/51 cặp chữ < 4 px); 9/18 panel tiêu đề **khác nghĩa** tên dòng ("Kết quả cuối", "Sửa thông tin", "Case Reading"…); bối cảnh nằm DƯỚI nút Lưu; hầu như không panel nào có lịch sử (trái luật II.3). Đề xuất **giải phẫu panel 6 phần** + thang chữ 17/15/14/13.
8. **Hệ panel:** 7 dáng, ~11 biến thể (`KhungPanel` 63 tệp: 44 đầu cũ 52 px, 19 đầu v3; 3 bề rộng; 2 chế độ; chân v3 ≈ 9/79). Đề xuất **một vỏ "Khung việc"** gắn thang 0–5, 11 thành phần chung, không ép một mẫu.
9. **Excel (XI.7):** panel Nhập điểm ở Công việc (một lớp, theo tuần, 375) đều còn "Dán từ Excel" + "?" — bỏ theo 12.3; thanh công cụ còn **một** công tắc "Hiện cả lớp" + "Còn n bài".
10. **TVV:** chưa có chỗ nào cho việc (Tổng quan = 5 ô đếm, /cong-viec bị chặn). Khuyến nghị **hàng đợi "Việc của bạn" ngay trên Tổng quan TVV** (cùng thành phần hàng đợi), không thêm menu Công việc cho TVV — 2 bấm cho "Ghi nhận kết quả xử lý vi phạm", 0 đổi trang. **3 câu hỏi** cho chủ SP (mục cuối).

---

## Phạm vi đã kiểm

| Vai | Đã chụp / đo (1440 tối + 375 sáng) |
|---|---|
| QT 1 (Monbay, Uông Bí) | đầu trang (`qt1-dau-p1…p3`, `qt1-dau-khung`), 375 (`qt1-375-p1…p5`), Uông Bí (`qt1-ub`), Thêm PA đang chọn, ghi nhanh mở (`E-qt1-ghinhanh`), Phân công… (`P-phancong-qt1`), Chọn người phụ trách (`P-noowner-qt1`), Bước tiếp + Gia hạn (`P-buoctiep-*`) |
| QL 2 | đầu trang + 375, Của tôi (`ql2-cua-toi`), Việc quản lý (`ql2-viec-ql-p1`), Tổng quan (`ql2-tq-p1…p4`) |
| GV 7 (GVCN, L·R) | đầu trang + 375, 11 panel (`P-*-gv7`), ghi nhanh 1 024 / 1 280 / 1 440 / 375, lỗi tải (`L-gv7-loi`) |
| GV 10 (W2, GVCN 102–104) | đầu trang + 375, Nhập điểm (+375), Xác nhận xử lý (+375) |
| GV 9 (S chéo) | đầu trang, Chấm Speaking, Kết quả PA panel lớn |
| Admin VP 22 | Công việc rỗng (`adm22-dau`, +375), Tổng quan Mock Test (`adm22-tq`) |
| TVV 23 · CX 24 · Head tutor 25 | /cong-viec (TVV, CX bị chuyển về Tổng quan; Head tutor về /tutor), Tổng quan TVV (+375), Học viên & Lớp › Cần làm (TVV) |

Đọc mã: `HoTroHocVienTab`, `NhomViec`, `WorkList`, `PanelViec`, `KhungPanel`, `KhuonViec`, `GhiNhanh`, `SoLieu`, `KhoiCanQuyet`, `OverviewPage`, `HocVienCuaToi`, `LuoiChamLop`, `mywork.ts`, `classes.ts`, `cases/owner.ts`, `nav.ts`, `dieuHuong.ts`. Đọc API `/my-work` (GET) 10 vai / chi nhánh: `chup\v4a-mywork-*.txt`.
**Chưa kiểm được:** mọi trạng thái SAU KHI LƯU (luật chỉ đọc) — mô tả bằng mã, ghi (E); việc `khai_bac`, `yt_thuc_hien`, `thi_that`, Xác nhận PA cùng lúc (demo không có); panel Việc vận hành (QL 2 không có việc `mgmt`); việc TVV mới (chưa có trong mã).

---

## V4A-01 Danh sách Công việc: dày, không thứ tự, không trả lời "việc gì · cho ai · vào đâu" (XI.1, ảnh `2.jpg`) · P1

1. **Ở đâu:** `/cong-viec` mọi vai có khu này (QT, QL, GV, GVCN, GV S, Admin VP). `congViec/HoTroHocVienTab.tsx` + `worklist/NhomViec.tsx` + `worklist/WorkList.tsx` (`DongViec gon`) + `duyet/HopChoDuyet.tsx` (`gon`).
2. **Biểu hiện (D, đúng ảnh 2.jpg):**
   - Đầu trang: tiêu đề + 2 hàng lọc (8 lựa chọn + ô Chi nhánh có nhãn trên) + câu "10 chờ bạn duyệt" → khối "Chờ bạn duyệt" thẻ cao 95–130 px rộng hết trang → mới tới danh sách. **Dòng việc đầu ở y = 752 px** (khung 900) khi không tự cuộn; **375: y = 1 505 px (~1,85 màn)**.
   - Vào trang QL / QT: tự mở lưới điểm của GV và **tự cuộn ~470 px** khỏi "Chờ bạn duyệt" (`qt1-dau-khung`) — CV-09 **vẫn còn**.
   - Khung nhìn đầu 1440: **42–49 phần tử bấm được** (7–8 dưới 24 px); 5 cỡ chữ, 51–70 mẩu chữ 12 px, 5–14 mẩu < 12 px. Trên trang (23 dòng đang vẽ): **24 dấu ⚠, 17 chuỗi "quá hạn n ngày"** → mù cảnh báo.
   - Nhóm theo LOẠI nghiệp vụ (Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành/Việc quản lý): QL thấy 31 việc nhập điểm của GV trước; việc của CHÍNH QL (Chốt lộ trình 6 ⚠6, Bước tiếp) nằm ở "Việc quản lý" gập cuối; **"Việc quản lý" của QL lại chứa việc của GV** (Bàn giao · MB FOU 23 · Lê Minh Khoa) [PHÁT HIỆN] (`ql2-viec-ql-p1`).
   - Dòng 2 hàng 52 px: tên 13 px/600; dòng phụ 12 px xám gộp 4–5 thứ (em · lớp · đợt/bài · số bài · người phụ trách) → "Chưa có người" bị cắt "…" (ảnh `3.png`).
   - Tên việc nhiều dạng cho cùng loại: "Nhập điểm Listening, Reading" · "Nhập điểm · MB FT 101 · 15 bài" · "Nhập điểm · W3 SEP · 14 bài" (W3 SEP là tuần **thi**, không ghi "thi") · "Thêm PA học thuật Reading" ↔ "Thiếu PA học thuật · MB FT 101 · 2 em".
   - Thứ tự: GV 7 / GV 10 thấy 4 dòng đầu "⚠ quá hạn 68 / 47 / 26 / 19 ngày" (nợ cũ MT1 W1 JUL…) trước việc tuần này (`gv7-dau-p1`).
   - **5 kiểu mở trong một danh sách** (đọc mã `HoTroHocVienTab.tsx:186–252, 364–370, 418–421`; `WorkList.tsx:93`): khung phải (đa số) · mở danh sách em dưới dòng (dòng gộp: Thiếu PA, Báo PH, Bàn giao, chấm chéo S) · form ghi nhanh dưới dòng (Kết quả PA) · đổi trang ↗ (Chốt lộ trình ×6, Xem nhận xét S, Nhập điểm MT cũ) · ngăn phủ chồng (Phân công…, Gia hạn, + Giao việc).
   - Rỗng (Admin 22): "Xong hết hôm nay ✓ · Việc mới sẽ hiện ở đây khi có." + nút "Xem việc của: một GV" vẫn hiện khi 0 việc; tiêu đề "Chấm điểm" ≠ menu (CV-32).
   - **Lỗi tải [PHÁT HIỆN] (D):** chặn `/my-work` ở trình duyệt → cả trang chỉ còn một câu đỏ + "Thử lại" — mất tiêu đề, bộ lọc, Chờ duyệt (`L-gv7-loi`; `HoTroHocVienTab.tsx:290` trả `ErrorState` cho cả trang).
   - QL "Của tôi": "Xong hết hôm nay ✓" ngay dưới "Chờ bạn duyệt 10 ⚠1" (`ql2-cua-toi`) — CV-06 **vẫn còn**.
3. **Bằng chứng:** ảnh `2.jpg`; `qt1-dau-p1`, `qt1-dau-khung`, `qt1-375-p1`, `gv7-dau-p1/p2`, `gv7-375-p1`, `ql2-viec-ql-p1`, `ql2-cua-toi`, `adm22-dau`, `L-gv7-loi`; `do-v4a-dom1.json` (L-qt1, L-qt1-top, L-qt1-375…); `shared/domain/tongQuan.ts:30–48` (4 nhóm cố định), `:68–83` (sắp: Chấm Speaking → quá hạn → hôm nay → hạn); `WorkList.tsx:81–90` (dòng phụ), `HoTroHocVienTab.tsx:168–169` (đổi nhãn "Vận hành" → "Việc quản lý" cho QL, gồm cả Bàn giao của GV), `:235–240` (tự mở việc đầu).
4. **Nguyên nhân:** (a) nhóm theo mã `group` của máy chủ, không theo "ai phải hành động / mức gấp"; (b) dòng là "bản tin" (mọi thuộc tính dồn một dòng xám) chứ không là "lệnh việc"; (c) mỗi PR thêm một kiểu mở (OV-5a khung phải, OV-13b ghi nhanh, OV-13c cả dòng, OV-15d Phân công / Gia hạn ngăn phủ) — không có luật mở chung; (d) Chờ duyệt dùng nguyên thẻ của hộp duyệt, đặt trên lưới hai cột = bố cục A; (e) tên việc ghép chuỗi riêng từng loại ở `mywork.ts`; (f) **mockup 2 khung "Sau" đã duyệt cùng dáng danh sách** (`SCR\anh\a2\mock2-p2.png`) → đây là lệch kỳ vọng của chủ SP, không chỉ lệch mockup.
5. **Ảnh hưởng:** Chị Vy (QL, 10 phút): mở trang thấy lưới điểm của GV khác; việc của mình ở cuối, gập; 84 việc không phân biệt "của tôi". Cô Linh (GV): 4 dòng đầu là nợ 68 ngày, việc tuần này ở dòng 6–8; điện thoại 4 dòng chữ / việc (72–123 px), 6 việc một màn. Mọi vai: phải học 5 cách mở.
6. **Phương án (C):**

   **Luật dòng việc (áp mọi phương án):** mỗi dòng trả lời đúng 3 câu ở **3 vùng cố định**: **Hạn / trạng thái** (cột trái 76 px: "⚠ 68 ngày" chữ cam + ký hiệu · "Hôm nay" · "T4 16/09" · "—" không hạn) · **Việc gì + cho ai** (dòng 1 = động từ + đối tượng 15 px/600, MỘT hàm tên dùng chung cho dòng và đầu panel — CV-13; dòng 2 = em · lớp · đợt 13 px; người phụ trách chỉ hiện khi xem việc người khác, cột riêng) · **Vào đâu** ("›" = mở khung phải; "↗" = sang trang; không nút thứ hai trên dòng). Dòng 56 px (1440), 64 px (375, 2 dòng: "việc" + "đối tượng · hạn"). Không tô nền cả hàng; SOS là `ChipSos` một dáng; bỏ chip "Bình thường" (CV-28).

   | | **A — Hàng đợi theo người phải làm, nhóm cố định (KHUYẾN NGHỊ)** | B — Bảng việc rộng hết trang, sắp theo hạn | C — Lịch việc "Hôm nay / Tuần này / Nợ cũ / Sau" |
   |---|---|---|---|
   | Bố cục | 1 hàng đầu trang (tiêu đề = menu · Chi nhánh ▾ · Chương trình · chip "⚠ n quá hạn") → **trái danh sách 520 px · phải chi tiết dính** | bảng cột Hạn · Việc · Học viên/Lớp · Người · Trạng thái · [Làm ›]; chip lọc theo loại; bấm dòng → chi tiết thay nửa phải | 4 dải thời gian, mỗi dòng có chip loại; chi tiết bên phải |
   | Nhóm | GV/GVCN: Chấm điểm · Case học thuật · Ý thức & Phối hợp (gồm Phối hợp SOS, Báo PH — CV-15) · Lớp & hồ sơ (Bàn giao, Điền Target, MT cũ). Trong nhóm: vạch mỏng **Quá hạn · Tuần này · Sau (gập)** | không nhóm | theo thời gian |
   | Nợ cũ | việc cùng lớp × môn quá hạn ≥ 14 ngày gom **một dòng** "Nợ chấm cũ · MB FT 101 · W2 · 4 tuần thi · 11 bài · ⚠ 26–68 ngày" (cùng nguồn "Chấm Test theo hạn" 12.2) | mỗi việc một hàng | dải "Nợ cũ" gập |
   | Chờ duyệt (QL) | **dòng** 2 hàng như mọi việc (trích ngắn + "Nếu duyệt" ở chi tiết), ô tích chỉ khi bật "Chọn nhiều" | hàng bảng | trộn trong dải |
   | Kiểu mở | **một**: khung phải (bậc 3); việc bảng nhiều em → panel rộng thay khung phải (bậc 4); hồ sơ → ↗ | khung phải | khung phải |
   | Hợp với | GV làm tuần tự (cùng form → "tự sang việc kế cùng nhóm" — mockup 1e), QL quyết | QL theo dõi nhiều người | người ít việc |
   | Nhược | cần gom "nợ cũ" ở máy chủ | GV làm form trong nửa màn; 375 vẫn thành thẻ; trộn loại → không tự sang việc kế cùng form | trộn loại; QL mất góc "theo người"; nợ cũ gập dễ bị quên |

   **Đếm bước — 8 việc thật (bấm = click / chạm, không tính gõ; "Nay" đếm trên demo không lưu + mã):**

   | # | Vai · việc | Nay | A | B | C |
   |---|---|---|---|---|---|
   | 1 | GV 10 trả hết nợ W2 cũ (4 dòng W1 JUL → W1 SEP, 11 bài) | 4–6 bấm (mỗi dòng 1; tự sang việc có thể nhảy nhóm — CV-05) | **1** (một dòng nợ cũ, lưới chỉ ô của tôi) | 4 | 4 |
   | 2 | GV 10 nhập W2 SEP tuần này (3 bài, 2 lớp) | 2 (chọn dòng + mở lớp thứ 2) | **1** (≤ 3 lớp mở sẵn) | 2 | 1 |
   | 3 | GVCN 7 ghi Kết quả PA Reading (Lý Minh Châu) | 3, **tiêu đề + tên em biến mất** (V4A-06) | **3**, tiêu đề + bối cảnh PA còn | 3 | 3 |
   | 4 | GVCN 7 xử lý vi phạm 3 em (lô) | 2 + gõ | 2 + gõ | 2 | 2 |
   | 5 | QL 2 duyệt 10 thẻ, 5 cần xem bối cảnh | ≈ 21 bấm, **5 đổi trang** ("Mở" → hồ sơ HV — CV-27) | **11, 0 đổi trang** (bối cảnh ở chi tiết) | 11 | 11 |
   | 6 | QL / QT xử lý "Case chưa có người" (Case 14) | **không xong được** (V4A-05) | **0** (tự gán theo phân công) / **3** nếu lớp thiếu GV môn | như A | như A |
   | 7 | QT chọn bước tiếp 2 em UB FT 401 | 7 (mở "Việc quản lý" gập → dòng gộp → em → chip → Lưu × 2) | **5** (nhóm "Sau thi" mở sẵn, tự sang em 2) | 5 | 5 |
   | 8 | Admin VP: GV nào chấm trễ, bài nào | 2–3 ("Xem việc của: một GV ▾" → chọn) | **1** (Công việc Admin gom theo GV) | 1 (lọc cột Người) | — |

   **Khuyến nghị A**: bớt bước ở 5/8 việc, bằng ở 3/8; một kiểu mở; giữ được "tự sang việc kế cùng nhóm" (mockup 1e, đã chốt OV-15d). Ước: khung nhìn đầu ≤ 30 phần tử bấm được; dòng việc đầu ở y ≤ 200 px (1440) / ≤ 420 px (375); GV 7 trang 2 321 → ~1 300 px; 375 3 530 → ~2 000 px (gom nợ cũ + dòng 64 px + bỏ khối "Bị từ chối" rời — đưa thành việc "Sửa đề xuất · bị từ chối" trong nhóm của nó).

   **Trạng thái phải vẽ (dùng bảng 4.4 của `v1-tong-quan.md`, không lặp):** thêm 3 điều mới: (i) lỗi tải **chỉ che vùng danh sách**, giữ đầu trang + bộ lọc + "Thử lại"; (ii) rỗng theo vai: GV "✓ Không còn việc tuần này · việc sau tuần này 3 ▸", Admin "Không GV nào nợ chấm ở CP" (ẩn lọc người khi 0); (iii) vào trang **không tự mở việc của người khác, không đặt con trỏ, không cuộn** (chọn sẵn dòng đầu của nhóm đầu chỉ khi đó là việc của chính người xem).
7. **Xuyên trang / vai:** cùng `DongViec` mới cho: Tổng quan "Cần bạn quyết" (QL), Tổng quan TVV (V4A-08), dải việc dưới hàng lớp ở Học viên & Lớp (11.2), Hồ sơ GV "Việc đang có", chuông (bấm → đúng việc). Chấm điểm dùng chung nguồn với Test › Chấm Test (12.2 B) — **một hàm tên + một cách gom**.
8. **Luật nghiệp vụ:** không đổi loại việc, hạn, luật quá hạn, T18 (chấm chéo không hạn), luật duyệt. Gom "nợ cũ" chỉ đổi cách **trình bày** (vẫn từng bài, từng hạn trong panel).
9. **Kiểm thử:** đo DOM tự động (`v4a-dom.mjs` đưa vào `scripts/`): phần tử bấm được trong khung nhìn đầu ≤ 30; y dòng đầu ≤ 200 / 420 px; mỗi dòng đúng 3 vùng (`data-vung="han|viec|mo"`); số "⚠" ≤ số dòng quá hạn đang hiện + số nhóm; phép kiểm tĩnh: mỗi `group` khai **một** `bac` mở (bảng ở V4A-04); "tên dòng = tên đầu panel" (một hàm). Ảnh cặp mockup mới | web cho QL, GV, Admin, 1440 + 375, đủ trạng thái (rỗng · nhiều việc · đang chọn · vừa xong / Hoàn tác · lỗi tải).
10. **Cần chủ SP?** Không — thẩm mỹ / UX, PTA tự quyết (danh sách ở mục cuối). Chỉ phần **phân vai** (QL thấy gì ở Công việc) phụ thuộc câu hỏi Q1 (V4A-02). Cần **mockup mới** trước khi code (đổi bố cục).

---

## V4A-02 Tổng quan ↔ Công việc: phân vai, không trùng (XI.2 + IV.8) · P1

1. **Ở đâu:** Tổng quan QL / QT (`OverviewPage.tsx`, `KhoiCanQuyet.tsx`), Tổng quan Admin VP (`MockTestAdmin.tsx`), Tổng quan TVV / CX (`HocVienCuaToi.tsx`); Công việc mọi vai.
2. **Biểu hiện (D):** Tổng quan QL "Cần bạn quyết" = Chờ duyệt 10 (**cùng component** `HopChoDuyet gon` với Công việc) + Case chưa chốt PA 5 + Chốt lộ trình 6 → **16/21 việc xuất hiện y hệt ở Công việc** (Chờ bạn duyệt + Việc quản lý). Cùng việc, hai dáng mở: Tổng quan mở **ngăn phủ** (`NganCase`, `PanelViec`, `PanelLoTrinhLop` — `KhoiCanQuyet.tsx:133–135`), Công việc mở **tại chỗ** (Chốt lộ trình thì đổi trang). Công việc QL hiện chính là bố cục A (hộp duyệt trên + trái / phải) — **ảnh 2.jpg là A chạy thật, chủ SP gọi là "dày đặc, chi chít"**.
3. **Bằng chứng:** `ql2-tq-p1/p2`, `qt1-dau-p1`, `ql2-viec-ql-p1`; `OverviewPage.tsx:57–64` (TVV), `:96–99` (QL), `HoTroHocVienTab.tsx:337–345`.
4. **Nguyên nhân:** OV-15d đưa Chờ duyệt + Việc quản lý vào Công việc, OV-15h1 thêm Cần bạn quyết ở Tổng quan — không ai quyết "việc nào ở đâu".
5. **Ảnh hưởng:** QL không biết duyệt ở đâu; hai nơi khác số khi khác chi nhánh (A1-02); hai dáng panel cho một việc.
6. **Phương án (C) — so theo vai:**

   | | **P1 — Việc TÔI ở Tổng quan; Công việc = theo dõi người khác (KHUYẾN NGHỊ, = 10.2 làm rõ)** | P2 — Tổng quan tóm tắt + làm nhanh bậc 1–2; Công việc là nơi làm duy nhất | P3 — Hai nơi đầy đủ (hiện tại) |
   |---|---|---|---|
   | QL / QT · Tổng quan | hàng đợi B "Cần bạn quyết" (Chờ duyệt nhóm đầu · Case quá hạn chốt PA · Sau thi · Bước tiếp · Lộ trình lớp · Phân công · Lịch Test · Vận hành giao cho QL) + Lớp cần chú ý + Tuần này | mỗi nhóm một dòng (số · ⚠ · việc gấp nhất + nút bậc 1–2: Duyệt, Từ chối, Gia hạn, Phân công); việc có form → "Làm ›" sang Công việc | như nay |
   | QL / QT · Công việc | **"Theo dõi & giao việc"**: Việc của GV gom theo GV ("Trần Ngọc Hà · 26 việc · ⚠10 ›") · Vận hành / + Giao việc / Báo cáo đơn vị · Hộp duyệt đầy đủ (đã xử lý, lịch sử) + **một dòng** "Cần bạn quyết · 23 · ⚠12 — ở Tổng quan ›" | hàng đợi đầy đủ: Cần bạn quyết (mở) + Việc của GV (gập theo GV) | như nay |
   | GV / GVCN | không Tổng quan; Công việc = hàng đợi của tôi (trang đầu) | như P1 | như P1 |
   | Admin VP | Tổng quan "Mock Test" (số + việc của Admin nếu có); Công việc = Chấm điểm của GV theo GV (xem) | như P1 | như nay |
   | TVV / CX | Tổng quan = "Việc của bạn" (hàng đợi) + số HV (V4A-08) | Tổng quan dòng tóm tắt; mở Công việc cho TVV | không có chỗ |
   | Duyệt 10 thẻ (5 xem bối cảnh) | **11 bấm · 0 đổi trang** | 11–12 · 1 đổi trang | 21 · 5 đổi trang |
   | Thêm PA 5 Case quá hạn | **11–16 · 0** | 12–17 · 1 | 25–30 · 5 ngăn phủ |
   | Chốt lộ trình 6 lớp | **≈ 12 + em chưa đề xuất · 0** (bậc 4 thay khung phải) | như P1 + 1 đổi trang | 40–60 · 6 lần đổi trang / ngăn phủ |
   | "GV nào đang nợ gì" | Công việc → 1 bấm | Công việc → 1–2 | 2–3 |
   | Trang Tổng quan QL 1440 / 375 | ≈ 1,7 / 2,5 màn | ≈ 1,1 / 1,6 | 2,5 / 5,3 |
   | Trùng | **0** (một dòng dẫn) | top việc lặp ở hai nơi | 16 việc |

   **Khuyến nghị P1.** Luật một câu: **"Việc TÔI phải làm luôn ở trang đầu của tôi"** (GV: Công việc; QL/QT/TVV/Admin: Tổng quan) — **"Công việc" của người quản lý = theo dõi việc của người mình quản lý"**. Trả đúng định hướng chủ SP: Tổng quan = nắm tình hình + xử lý (quyết) nhanh tại chỗ; Công việc = quản lý sâu (theo GV, giao việc, lịch sử). Ít đổi trang nhất; không trùng; cùng một thành phần hàng đợi (`HangDoiViec`) ở cả hai trang. Không chọn P2 vì mọi việc có form thêm 1 đổi trang và vẫn lặp việc gấp ở hai nơi; P3 là hiện trạng.
   **Đề xuất cũ — giữ / đổi:** **giữ** 10.2 B (Chờ duyệt là nhóm đầu, không hộp riêng — nay có thêm bằng chứng ảnh 2.jpg), 10.3 thang 0–5, 7.3 "một việc = một panel đúng việc", "tự sang việc kế cùng nhóm, của chính tôi, đang hiện", badge menu QL chuyển sang Tổng quan; **đổi** 10.2 "Công việc QL chỉ còn việc của GV" → mở rộng thành 3 phần (Việc của GV · Vận hành/giao việc · Lịch sử duyệt); **đổi** 9.2-5 / 9.2-7 / 7.3 "Cần bạn quyết đầu trang Công việc" (đã thay ở 10.2 — xác nhận lại); **sửa** mockup 2 khung 3 + mockup 3 khung 1 theo P1 (luật 9.1-1); **bỏ** dáng thẻ Chờ duyệt trong danh sách (giữ thẻ ở "Hộp duyệt đầy đủ").
7. **Xuyên trang / vai:** badge "Công việc n" (CV-16, A1-13): GV = việc của tôi quá hạn + hôm nay; QL/QT: số chuyển lên "Tổng quan", Công việc QL không số (hoặc "⚠ n GV trễ" xám). Chuông bấm → mở đúng việc ở trang đầu của vai. Thứ tự menu (A): Tổng quan → Lớp/HV → Test → Công việc → Phân tích → Tutor — **mã hiện vẫn Phân tích trước Công việc** (`shared/domain/dieuHuong.ts:45–53`) → sửa ở PR NEN (10.6).
8. **Luật:** không đổi quyền: QL không có `score.edit` → ở "Việc của GV", panel Nhập điểm **chỉ xem** (A1-06, 9.2-1); QL có quyền Case → làm được việc Case của GV khi cần (nút ghi "Làm thay").
9. **Kiểm thử:** phép kiểm "một việc một nơi": mọi `key` việc của QL trả bởi `/tong-quan/quan-ly` không xuất hiện ở danh sách Công việc QL; badge = số dòng "Cần bạn quyết"; bấm chuông → URL `/?viec=<key>` mở đúng dòng. Ảnh cặp Tổng quan QL + Công việc QL (1440 + 375).
10. **Cần chủ SP:** **Có — Q1** (định hướng lớn: Công việc của QL đổi nghĩa thành "theo dõi việc GV").

---

## V4A-03 Panel công việc: "chữ díu", thiếu phân cấp, bối cảnh sai chỗ (XI.3) · P1

1. **Ở đâu:** mọi panel mở từ Công việc (danh sách a2 Phần 0) — đã mở và đo 19 panel (`do-v4a-dom2.json`).
2. **Biểu hiện (D) — số đo:**

   | Panel | Tiêu đề panel ↔ tên dòng | Đầu | Cỡ chữ | Khoảng dọc nhỏ nhất | Nút | Cao nội dung | Ghi chú |
   |---|---|---|---|---|---|---|---|
   | Nhập điểm (GV 10) | "Nhập điểm · W1 JUL" ↔ "Nhập điểm Writing Task 2" | v3 | 5 (11,5–17) | — | 5 + 2 link ↗ | 354 | "Dán từ Excel", "?", "Cả lớp" |
   | Nhập điểm theo tuần (GV 7) | "Nhập điểm · W3 SEP" ↔ "… · 14 bài" | v3 | 6 (11–17) | — | **20** | 699 | 5 "Nhận xét" + 5 "⋯" + "Điền cả cột" |
   | Thêm PA | "Thêm PA" ↔ "Thêm PA học thuật Listening" | v3 | 5 | 18 | 4 | 617 | **"Nguyên nhân" (bối cảnh) nằm DƯỚI nút Thêm PA** |
   | Xác nhận PA | "Xác nhận PA" ↔ "… · Listening · Vũ Ngọc Lan" | v3 | 6 | 12 | 6 | 652 | |
   | Xác nhận Case | "Xác nhận Case" ↔ "… Listening · Phan Khánh Linh" | v3 | 5 | **0** | 9 | 518 | |
   | Ghi nhận xét | "Ghi nhận xét Listening" ↔ "… · MT1 · Đặng Quốc Bảo" | v3 | 5 | 14 | 8 | 462 | |
   | Mini Test | **"Kết quả cuối"** ↔ "Ghi Mini Test · Vương Bảo Ngọc" | v3 | 5 | 14 | 9 | 741 | 14 nhãn 11,5 px |
   | Xử lý vi phạm lô | **"Xác nhận xử lý chung"** ↔ "Xử lý vi phạm · MB FT 101 · 3 em" | v3 | 5 | 19 | 6 | 623 | |
   | Xử lý vi phạm 1 em | "Xác nhận xử lý" ↔ "… (3) · bậc kế tiếp: Report 1" | v3 | 6 | 6 | 4 | 657 (375: **979**) | |
   | Ghi nhận lô | **"Ghi nhận"** ↔ "Ghi nhận vi phạm mới · … · 3 em" | v3 | 4 | **0 (3 cặp)** | 2 | 370 | không thấy vi phạm gì (CV-22 còn) |
   | Bàn giao | "Bàn giao · MB FOU 22" | **cũ 14 px** | 5 | 10 | 4 | 610 / 772 cuộn | tiêu đề khối **IN HOA 11 px** |
   | Phối hợp SOS | = tên dòng ✓ | v3 | 4 | 4 | **29** | **1 421 / 772 cuộn** | 9 "Xác nhận" màu nhấn |
   | Báo PH | = tên dòng ✓ | v3 | 4 | 4 (6/6 cặp ≤ 7) | 3 | 271 | |
   | Điền Target | **"Sửa thông tin"** ↔ "Điền Target" | **cũ** | 4 | **0** | 5 | **940 / 772 cuộn** | ô Target dưới màn (CV-25 còn); "HỌC VIÊN" IN HOA 11 px |
   | Chọn người phụ trách | **"Case Reading"** ↔ "Chọn người phụ trách" | v3 | 6 | 6 | 8 | 707 | **không có ô chọn người**; nút chính "Hoàn thành Case" |
   | Bước tiếp | "Bước tiếp" ↔ "Chọn bước tiếp" | v3 | 6 | — | 7 | 330 | "Gia hạn" → **ngăn phủ 560 px cả chiều cao cho 1 ô ngày** (`P-buoctiep-giahan-qt1`) |
   | Chấm Speaking | "Chấm Speaking" | v3 | 4 | **0 (25/51 cặp < 4 px)** | 2 + 24 link | **1 949 / 772** | tên em là link đổi trang sát ô nhập |
   | Kết quả PA (lớn) | **"Kết quả PA · W1–W2 SEP"** ↔ "Kết quả PA Speaking" | v3 | 6 | 9 | 11 | 645 | **Phương án / Nguyên nhân DƯỚI nút Lưu** |

   Chung: nhãn ô (`Truong`) **11,5 px / 700** trên giá trị 14 px (`KhungPanel.tsx:230`); tiêu đề khối **11 px IN HOA** (`:196`); chữ phụ 12 px hệ số dòng 1,25–1,38 (tiếng Việt dấu chồng cần ≥ 1,5 — 10.1); **9/18 panel tiêu đề khác nghĩa tên dòng, 6 panel khác rút gọn**; 2 kiểu đầu (v3 17 px 2 dòng ↔ cũ 52 px 14 px); "← Case …" ở 7 panel Case trông như "Quay lại" nhưng mở Case đầy đủ (CV-30); **lịch sử** chỉ có ở Case (NganCase) và Bước tiếp — Nhập điểm, Ý thức, Phối hợp, Bàn giao, Target không có "ai sửa, lúc nào" trong panel.
3. **Bằng chứng:** `P-*.png`, `do-v4a-dom2.json`; `KhungPanel.tsx:116–137` (2 đầu), `:192–203` (`Khoi` IN HOA 11 px), `:209–243` (`Truong`); `KhuonViec.tsx:22–47` (`BoiCanh` 13 px).
4. **Nguyên nhân:** thang chữ quá nhỏ cho form tiếng Việt (gốc 10.1); `Truong` dùng đậm thay cỡ để phân cấp; mỗi panel dựng từ khối có sẵn của nơi khác (Case, Sửa thông tin, Thông tin lớp) nên tên + thứ tự khối theo nơi gốc, không theo việc; v3 (OV-12c) mới phủ 19/63 panel.
5. **Ảnh hưởng:** GV đọc nhãn 11,5 px trên điện thoại; quyết định Kết quả PA mà bối cảnh PA nằm dưới nút; QL tưởng "Chọn người phụ trách" mà không có chỗ chọn; Phối hợp SOS 9 nút nhấn cùng màu.
6. **Phương án (C) — giải phẫu panel việc (một khuôn, nội dung theo loại):**
   ```
   ┌─① ĐẦU (dính) ─────────────────────────────────────────────────┐
   │ Kết quả PA · Reading                     ⚠ quá hạn 6 ngày   ✕ │  17/700 · MỘT chip hạn · tên = tên dòng
   │ Lý Minh Châu ↗ · MB FT 101 ↗ · SOS 1 · MT2                    │  14/400 · em/lớp là link xem (↗), tách nút làm
   │ Việc 2/5 trong "Case học thuật" · ‹ ›                          │  13 · chỉ khi đi theo hàng đợi
   ├─② BỐI CẢNH (≤ 3 dòng, TRƯỚC form) ─────────────────────────────┤
   │ PA       Xếp tự học Reading · từ W4 AUG · Trần Ngọc Hà         │  nhãn 13/400 xám, cột 112 px; giá trị 14
   │ Lần trước 28/08 · Tiến bộ một phần                              │
   │ Xem thêm ▾ (nguyên nhân, điểm MT, lịch sử Case)                 │
   ├─③ CẦN LÀM (khối duy nhất có nền nhấn) ─────────────────────────┤
   │ Tiến triển (2 tuần) *        [Tiến bộ rõ][Một phần][Không]…     │  nhãn 13/600 (không 11,5/700), ô 15
   │ Nhận xét *                   [……………………………………]  0/8            │  16 px giữa trường · 6 px nhãn→ô
   ├─④ LỊCH SỬ (gập) ───────────────────────────────────────────────┤
   │ Lịch sử · 2 lần ▾   (ai · lúc nào · trước → sau)               │  luật II.3; chỉ với dữ liệu sửa được
   ├─⑤ CHÂN (dính đáy khung) ───────────────────────────────────────┤
   │ Chưa lưu · Đang lưu… · ✓ Đã lưu 09:12 · Hoàn tác (10 s)        │  trái: trạng thái (chữ + ký hiệu)
   │                       Điều chỉnh / Kết thúc…   [ Lưu kết quả ]  │  phải: nút phụ chữ + MỘT nút chính
   └─⑥ SAU LƯU / NGƯỜI KHÁC ĐÃ LÀM ─────────────────────────────────┘
     ở lại 10 s ("✓ Đã lưu · Hoàn tác") rồi "Việc kế ›"; không tự nhảy khi còn chữ đang gõ
     "Việc này đã được Trần Ngọc Hà làm lúc 09:12 — Xem · Việc kế ›" (tải lại thấy khác bản đang mở)
   ```
   Thang chữ trong panel: **17 (tiêu đề) · 15 (ô nhập, chữ chính) · 14 (giá trị, nội dung) · 13 (nhãn, chữ phụ) · tối thiểu 12** (chỉ chú thích) — khớp thang NEN 10.1; **không IN HOA**; hệ số dòng ≥ 1,5 cho chữ ≥ 13; khoảng: 24 px giữa khối · 16 px giữa trường · 8 px trong cụm chip.
   **Từng panel (chỉ phần khác khuôn):** Nhập điểm → V4A-07 · Thêm PA → bối cảnh (nguyên nhân + điểm hụt) lên trên, chip loại PA 2 nhóm (CV-23) · Kết quả PA → form gọn của ghi nhanh là mặc định, "Điều chỉnh / Kết thúc…" mở phần đủ **trong cùng panel** (V4A-06) · Mini Test → tên "Ghi Mini Test", hạn Mini Test (CV-14) · Xử lý vi phạm → tên "Xử lý vi phạm · 3 em"; danh sách vi phạm là bối cảnh ② · Ghi nhận lô → mỗi em một dòng con "02/09 · Nghỉ không báo · ai ghi" (CV-22) · Phối hợp SOS → mỗi em một khối, **một nút chính / em** (V2B-7), việc xong gập · Báo PH → giữ, thêm dòng "ai sẽ báo: TVV ‹tên›" · Điền Target → chỉ ô thiếu (Target, Dự kiến thi) + "Sửa thông tin khác ↗" · Chọn người phụ trách → bỏ (V4A-05) · Bước tiếp → Gia hạn thành hộp neo (bậc 2) · Chấm Speaking → hàng 52 px, ô điểm `ODiem`, tên em không phải link (link ↗ riêng), bài đã chấm gập cuối (CV-24) · Bàn giao / Thông tin lớp / Gia hạn → đầu v3.
7. **Xuyên trang:** cùng khuôn cho panel từ Tổng quan, Học viên & Lớp (panel một em), hồ sơ lớp (Xác nhận xử lý), Phân tích (PanelChiSo — V3B-03) → V4A-04.
8. **Luật:** giữ mọi ô bắt buộc / ngưỡng ký tự (nhận xét MT ≥ 10, Kết quả PA ≥ 8…); lịch sử phục vụ luật II.3 (sửa sau lưu có lịch sử) — không thêm bước duyệt.
9. **Kiểm thử:** phép kiểm tĩnh: cỡ chữ trong `KhungPanel` ∈ {12, 13, 14, 15, 17}; không `uppercase` trong panel; tên đầu panel = `tenViec(it)` (cùng hàm dòng); đo DOM: khoảng dọc nhỏ nhất giữa hai khối chữ ≥ 4 px, bối cảnh ② đứng trước khối ③ (thứ tự DOM); ảnh cặp 1440 + 375 cho 6 panel tiêu biểu.
10. **Cần chủ SP?** Không (thẩm mỹ / UX). Lịch sử trong panel là hệ quả luật II.3 đã chốt (A).

---

## V4A-04 Hệ panel dùng chung (XI.4) · P2

1. **Ở đâu:** `web/src/ui/KhungPanel.tsx`, `KhuonViec.tsx`, `Drawer.tsx` (`Modal`, `ConfirmDialog`), `SoLieu.tsx` (`NganDanhSach`), popover qua `createPortal` (9 tệp), mở rộng dưới dòng (≥ 6 chỗ).
2. **Biểu hiện — kiểm kê (D):**

   | Dáng | Nơi dùng | Biến thể / chồng chéo |
   |---|---|---|
   | Ngăn phải phủ nền (`KhungPanel` portal) | 63 tệp | 3 bề rộng (560 · 720 · 1 440); **2 kiểu đầu** (44 tệp đầu cũ 52 px · 19 tệp đầu v3); chân: 79 chỗ, **≈ 9** chỗ chân v3 |
   | Khung tại chỗ (`KhungTaiCho`) | **chỉ Công việc** | cùng `PanelViec` ở Tổng quan lại là ngăn phủ (`KhoiCanQuyet.tsx:133–135`) |
   | Modal giữa màn | 6 tệp | `ConfirmDialog` + Tutor + Kế hoạch Test |
   | Hộp neo / popover | 9 tệp (hộp ô điểm, hộp lịch Kế hoạch Test, "Vì sao SOS", lịch nhỏ, menu ⋯, ⓘ) | `HopGiaHan` tên "hộp" nhưng là **ngăn 560 px cả chiều cao cho 1 ô** |
   | Mở rộng dưới dòng | Công việc (ghi nhanh — **lỗi**), `NganDanhSach` (đúng: đầu giữ), Lịch thi, hàng lớp / Đang SOS, Phối hợp SOS "Bỏ ▾", Lịch Test khối | `NganDanhSach` trộn 2 kiểu (mở dưới + thay panel) |
   | Thay nội dung + "← …" | 15 tệp (`quayLai`) | "← Case Reading" nghĩa "mở Case", không phải "quay lại" |
   | Trang riêng | Case `/hoc-thuat/case/:id`, hồ sơ MT, `/nhap-diem`… | dùng làm chỗ "làm việc" (X3) |
   → **7 dáng, ~11 biến thể**; một việc có thể ra 2–3 dáng tuỳ chỗ mở (Kết quả PA: dòng · khung · ngăn; Chốt lộ trình: trang · ngăn).
3. **Bằng chứng:** grep `<KhungPanel` 63 tệp; `dau={` 19; `quayLai=` 15; `chan={{` 79 / v3 9; `createPortal` 10 tệp; ảnh `P-phancong-qt1`, `P-buoctiep-giahan-qt1`.
4. **Nguyên nhân:** không có "hợp đồng panel" (X3); mỗi PR dùng lại panel của nơi khác; KhungTaiCho chỉ được làm cho Công việc.
5. **Ảnh hưởng:** người dùng học lại mỗi màn; panel chồng panel (CV-19 còn: Phân công, Gia hạn); mã sửa một chỗ vỡ chỗ khác.
6. **Phương án (C) — một vỏ "Khung việc", 4 cỡ, gắn thang 0–5 (10.3):**

   | Bậc | Dáng | Khi nào | Ví dụ đích |
   |---|---|---|---|
   | 1 | nút trên dòng / trong chi tiết + Hoàn tác 10 s | 0 ô, đảo được | Duyệt, Xác nhận PA theo quy chế, Đánh dấu đã làm (Báo PH) |
   | 2a | **Hộp neo** ≤ 360 px (đầu 1 dòng · ô · Huỷ / nút chính) | 1–2 ô ngắn | Gia hạn, Phân công 1 môn, Chốt ngày thi, Dời tháng, Từ chối (lý do) |
   | 2b | **Mở dưới hàng** — CHỈ ở bảng rộng hết trang không có khung phải; đầu hàng giữ nguyên, vùng mở thẳng cột 1, ✕ / Esc / bấm lại hàng = thu | ≤ 4 ô, bối cảnh có trên hàng | Thêm PA dưới dòng em (Lớp cần chú ý, Đang SOS), Lịch thi, Phối hợp SOS hồ sơ lớp |
   | 3 | **Khung chi tiết** — trong hàng đợi = cột phải dính; mở từ số / chip / nút đầu trang = ngăn phải 560/720 (**cùng vỏ**, chỉ khác chỗ đặt) | 3–6 ô hoặc cần bối cảnh; tuần tự | mọi việc của hàng đợi; PanelChiSo (V3B-03); panel một em |
   | 4 | **Panel rộng** thay khung phải (≤ 1 440, không phủ thanh trên) | bảng nhiều em | Chốt lộ trình, Nhập điểm cả lớp, Bàn giao 5 em |
   | 5 | Trang | xem hồ sơ (↗), không gian lớn | hồ sơ HV / lớp / MT, Kế hoạch Test |
   | — | Modal giữa màn | **chỉ** xác nhận hậu quả lớn (nêu đúng đối tượng) | Xoá, đổi phân công cả lớp |

   **11 thành phần chung** (một mẫu mỗi cái, không một mẫu cứng cho cả panel): `DauViec` (tên + chip hạn + đối tượng) · `KhoiDoiTuong` (em ↗ + `ChipSos` + lớp ↗ + đợt) · `BoiCanh` · `CanLam` · `ODiem` (11.1a) · `ChipSos` · `ChipHan` · `TrangThaiLuu` · `NutChinh` / `NutChu` · `LichSu` (gập) · `HangDoiViec` (danh sách + khung + tự sang việc kế + Hoàn tác + giữ dòng xong).
   **Luật đi kèm:** một danh sách một dáng mở · mở cái mới thay cái cũ · **không ngăn phủ trong khung / ngăn** (hộp neo trong khung thì được) · trạng thái nằm trên URL (`viec=`, `so=`, `dong=`) → Quay lại về đúng dòng · Esc đóng lớp trên cùng, focus trả về dòng mở nó · nút làm ≠ link xem (↗).
   **Ánh xạ hiện trạng → đích (chính):** Gia hạn, Phân công (Case), Từ chối → 2a · ghi nhanh Kết quả PA ở Công việc → 3 (V4A-06) · Thông tin lớp khi "Phân công…" → 2a chỉ ô môn thiếu · Chốt lộ trình (Công việc đổi trang, Tổng quan ngăn) → 4 ở cả hai · `NganDanhSach` → PanelChiSo 3 (V3B-03) · NganCase mở từ Tổng quan → 3 tại chỗ (khung phải của hàng đợi B) · 44 panel đầu cũ → đầu v3 (`DauViec`).
7. **Xuyên trang:** mọi trang; nối V3B-03 (`PanelChiSo` A / C dùng vỏ bậc 3, dòng = `DongViec`), 11.3 A (Ý thức hồ sơ lớp — 2b), 12.1 (hộp chấm — 2a neo ô).
8. **Luật:** không.
9. **Kiểm thử:** phép kiểm tĩnh: `KhungPanel` không còn đầu 52 px; mỗi loại việc khai đúng một `bac`; không `KhungPanel` (ngăn phủ) mở khi đang có `KhungTaiCho` / ngăn khác (đếm `[role=dialog]` ≤ 1 + hộp neo); đo DOM: hộp neo ≤ 360 px rộng; Esc → focus về phần tử mở. Trang mẫu `/dev/thanh-phan` có đủ 5 dáng + trạng thái.
10. **Cần chủ SP?** Không (UX hệ thống; luật 10.3 đã đưa vào câu 10.7-6).

---

## V4A-05 Ảnh 2 (`3.png`) — nút "Phân công…" hiện sai case (XI.5) · P1 · (D) lỗi gốc

1. **Ở đâu:** Công việc QL / QT, dòng "Thêm PA học thuật Reading · SOS 3 · Dương Ngọc Ánh · MB FOU 12 · Progress Test" (+ dòng trùng "Chọn người phụ trách" cùng em). Mã: `HoTroHocVienTab.tsx:279–280` (`chuaCoNguoi`), `:366–370` (nút), `:419` (`PanelPhanCong`), `PanelViec.tsx:253–264`.
2. **Biểu hiện:** nút "Phân công…" mở **ngăn phủ "Thông tin lớp MB FOU 12"** (Lớp · Phân công GVCN / L / R / G+V / P · Lịch Test) **chồng lên** panel Thêm PA (`P-phancong-qt1`). Ô R **đã là Trần Ngọc Hà** → QL không biết sửa gì; bấm "Lưu phân công" không đổi gì → dòng vẫn "Chưa có người".
3. **Bằng chứng (đã kiểm):**
   - **Điều kiện hiện nút** = suy đoán ở web: `ownerId === null && !mine && !owner && classId && !con && không chấm chéo && group ∉ {chot_len_ft, xet_lai_lo_trinh, ky_vong_dau_ra, mgmt}` + vai QL — **không hỏi máy chủ VÌ SAO không có người**.
   - Dòng Thêm PA có `ownerId = null` vì `nguoiLamThemPa` trả nguyên `owner_user_id` khi nó NULL (`mywork.ts:788–790`) — không suy theo phân công.
   - DB demo: Case 14 (Reading, Progress lớp thường) `owner_user_id NULL`; lớp 6 có GV R đang hiệu lực (user 7). Case 25 (CP FT 110, Speaking) cùng tình trạng; lớp có GV S.
   - Chủ Case chỉ được gán **khi tạo Case** (`cases.ts:711` → `suggestCaseOwner`: GV môn → GVCN, `cases/owner.ts:18–41`) và khi chuyển lớp / cuối khoá (`luatLoTrinh.ts:420`, `cuoiKhoa.ts:256`). **Không có API đổi chủ Case**; `setClassTeachers` / `ghiPhanCong` (`classes.ts:1095–1174`) **không chạm `sos_cases`** → chú thích "người phụ trách Case đi theo phân công" ở `PanelViec.tsx:253` **sai với mã**.
   - Case 14 không chủ vì dữ liệu demo tạo Case không khai `owner` (`seed/build.ts:596`). Thật: xảy ra khi lớp chưa có GVCN / GV môn lúc tạo Case, hoặc dữ liệu cũ.
   - Dòng trùng `no_owner` "Chọn người phụ trách" (`mywork.ts:1193–1240`) hiện cả với **GV dạy lớp** (`teachesClass`, dòng 1219–1220) — GV 7, 8, 9 đều thấy; mở ra là panel Case **không có ô chọn người**, nút chính "Hoàn thành Case" (`P-noowner-qt1`, `P-noowner-gv7`). `actionLabel` "Sửa phân công" chỉ khi lớp thiếu GV môn (`thieu_gv_mon`, dòng 1225).
   - **Các case khác cùng điều kiện** (API `/my-work`, QT mọi chi nhánh): Case 14 (2 dòng), Case 25 (QL CP thấy); và **đúng nghiệp vụ**: "Nhập điểm Pronunciation · UB FOU 07 · Chưa phân công giáo viên" ×2 (lớp thật thiếu GV P — `qt1-ub`). Theo mã còn có thể hiện ở Xác nhận Case / Ghi nhận xét / Xác nhận PA khi chủ Case không còn quyền làm (`mywork.ts:932` `chuLamDuoc ? chu_ : null`).
4. **Nguyên nhân:** (a) web dùng một dấu hiệu (`ownerId null`) cho 3 tình huống khác nhau — lớp thiếu GV môn · Case thiếu chủ · chủ Case hết quyền; (b) OV-13b chọn "dùng lại Thông tin lớp" làm chỗ chọn người phụ trách nhưng không viết đường ghi chủ Case; (c) thiếu phép kiểm "sau khi làm việc, việc biến mất".
5. **Ảnh hưởng:** việc **không bao giờ xong** (đầu ra không đạt); QL có thể đổi nhầm phân công cả lớp (hậu quả: đổi người nhập điểm mọi em); GV thấy việc không phải của mình, badge GV tính cả việc này (CV-08); 2 dòng cho 1 Case.
6. **Phương án (C):**
   - **Sửa gốc (khuyến nghị):** (1) máy chủ trả **lý do thiếu người rõ ràng** trên mỗi việc: `thieuNguoi: { loai: 'gv-mon', classId, mon } | { loai: 'chu-case', caseId } | { loai: 'chu-het-quyen', caseId } | null`; web **bỏ hàm `chuaCoNguoi`**, chỉ vẽ nút theo trường này. (2) `chu-case` khi lớp có GV môn → **tự gán chủ theo luật sẵn có** `suggestCaseOwner` (GV môn → GVCN): đọc thì suy ngay (dòng có người làm), ghi bù một lần cho dữ liệu cũ, mỗi lần gán ghi `sos_case_history` ("tự gán theo phân công") → **không còn việc "Chọn người phụ trách"**. (3) `gv-mon` (lớp thật thiếu GV môn): nút **"Phân công GV P…"** mở **hộp neo** chỉ ô môn thiếu (P · [chọn GV ▾] · Giao), ghi qua `setClassTeachers` (giữ 3 luật kiểm) và **cùng giao dịch gán chủ** các Case mở không chủ của lớp × môn đó. (4) `chu-het-quyen`: dòng ghi "chủ Case không dạy môn này" + QL "Đổi người…" (hộp neo, cần API đổi chủ Case có lịch sử). (5) GV **không** thấy việc không chủ (9.2-10).
   - Phương án tạm (không khuyến nghị): chỉ ẩn nút khi `thieu_gv_mon = 0` → Case 14 vẫn treo, không ai làm.
   - **Bước:** Case 14 nay **không xong được** → **0 bấm** (tự gán, việc về GV R); lớp thiếu GV môn: nay 4–5 bấm trong ngăn cả lớp → **3 bấm** (Phân công… · chọn · Giao), 0 ngăn phủ.
7. **Xuyên trang / vai:** Tổng quan QL nhóm "Phân công" (10.2); Học viên & Lớp hàng lớp chip "Thiếu GV" (`DauTrangLop.tsx:125` mở Thông tin lớp — giữ, vì đó là việc của LỚP); hồ sơ GV "Case đang phụ trách"; xoá tài khoản ("Còn n Case… đổi người phụ trách sau khi xoá" — `xoaTaiKhoan.ts:183` hiện không có đường đổi → cần API ở (4)).
8. **Luật:** dùng đúng luật chọn chủ Case đang chạy lúc tạo (GV môn → GVCN); không đổi luật phân công (một môn một người, GVCN dạy ≥ 1 môn); đổi chủ có lịch sử (II.3).
9. **Kiểm thử:** phép kiểm máy chủ: (a) Case chủ NULL + lớp có GV môn → `/my-work` QL không có `no_owner`, dòng `no_plan` có `ownerId` = GV môn; (b) lớp thiếu GV môn → `thieuNguoi.loai = 'gv-mon'`; sau `setClassTeachers` thêm môn → Case có chủ, lịch sử ghi; (c) GV dạy lớp không nhận dòng không chủ. Web: không còn `chuaCoNguoi`; ảnh trước / sau dòng Case 14. **(E) cần bấm thử trên bản demo riêng:** "Phân công…" → Lưu phân công không đổi → chụp dòng (khẳng định còn "Chưa có người" như mã cho thấy).
10. **Cần chủ SP:** **Có — Q3** (tự gán chủ Case theo phân công; bỏ việc "Chọn người phụ trách").

---

## V4A-06 Ảnh 3 (`4.png`) — mở rộng trong danh sách che đầu mục (XI.6) · P1 · (D)

1. **Ở đâu:** Công việc, dòng "Kết quả PA Reading · SOS 1 · Lý Minh Châu · MB FT 101 · MT2" (và mọi Kết quả PA có `ghiNhanh`). Mã: `WorkList.tsx:102–104, 148`, `HoTroHocVienTab.tsx:186, 241–252, 389–409`, `cases/GhiNhanh.tsx`.
2. **Biểu hiện:** bấm dòng (cả dòng phụ gạch xanh — cùng một nút) → form "Tiến triển · Nhận xét · Lưu" mở **ngay trong danh sách**, dòng chỉ còn chip "SOS 1" + hạn, **tiêu đề và tên em biến mất**; khung phải chuyển thành "Chọn một việc ở danh sách" (trống) (`E-qt1-ghinhanh`, `gv7-kq-1024`).
3. **Bằng chứng — đo DOM (`do-v4a-dom1.json`):** lưới của dòng đổi thành **`0px 494px`**; nút tiêu đề **rộng 0 px** ở 1 440, 1 280 và 1 024; khối mở `grid-column: 2 / -1`; dòng cao 52 → 320 px. 375: một cột, tiêu đề còn (289 px). **Không phải z-index / overflow:** do `col-span-full sm:col-start-2` (`WorkList.tsx:148`) — từ 640 px khối mở chỉ nằm cột 2 (`auto`), nội dung rộng đẩy cột 2 ra ~494 px, cột 1 (`minmax(0,1fr)`) co về 0; chip SOS tràn ra nên còn thấy. Cùng chỗ đó vẽ `DongDaLuu` ("✓ Đã lưu · … · Hoàn tác") → **sau khi lưu, tiêu đề vẫn mất** (đọc mã, (E) cần bấm thử trên demo riêng).
4. **Nguyên nhân:** (a) lỗi CSS (OV-13b) — CV-03 đã nêu, **chưa sửa**; (b) **thiết kế:** OV-13b (mockup OV-13 §1) cho riêng Kết quả PA "ghi nhanh dưới dòng" trong một danh sách mà mọi việc khác mở khung phải → hai kiểu mở, khung phải bỏ trống; (c) đóng / mở: bấm lại dòng gọi `mo()` cùng khoá → **không thu gọn được**; không Esc; không `aria-expanded`; focus ở lại nút 0 px; chỉ nút Lùi trình duyệt (bỏ `viec=`) hoặc bấm dòng khác mới đóng. "Điều chỉnh / Kết thúc…" chuyển việc sang khung phải (chữ mang theo) — lần thứ hai đổi chỗ trong một việc.
5. **Ảnh hưởng:** GV ghi nhận xét mà không thấy ghi cho em nào, PA nào (không có bối cảnh PA / lần trước trong form gọn); dễ ghi nhầm em khi nhiều Kết quả PA liền nhau; người dùng bàn phím mất vị trí.
6. **Phương án (C):**
   - **A (khuyến nghị):** Công việc **một kiểu mở**: Kết quả PA mở ở **khung phải** như mọi việc; form mặc định của panel = form gọn (Tiến triển · Nhận xét · Lưu — vẫn 3 bấm) + bối cảnh ② ("PA … · lần trước …"); "Điều chỉnh / Kết thúc…" mở phần đủ **trong cùng panel**. Bỏ nhánh `laNhanh` ở Công việc. Bước: 3 → 3, tiêu đề + bối cảnh luôn thấy, khung phải không còn trống.
   - B: giữ ghi nhanh dưới dòng, sửa CSS (`sm:col-start-1`, khối mở là phần tử anh em ngoài lưới), thêm thu gọn / Esc / `aria-expanded` → vẫn 2 kiểu mở trong một danh sách, khung phải trống.
   - **Luật mở toàn web (đề xuất):** *danh sách có khung phải → mọi dòng mở ở khung phải; bảng rộng hết trang không có khung phải → mở dưới hàng (2b): đầu hàng giữ nguyên, vùng mở thẳng cột 1, cùng nền "đang chọn", bấm lại hàng / ✕ / Esc thu gọn, focus vào ô đầu, `aria-expanded` + `aria-controls`; việc cần bảng nhiều em → bậc 4; đổi trang chỉ để xem (↗).*
   - **Rà chỗ cùng kiểu (đọc mã + ảnh):** (1) Công việc dòng ghi nhanh — **lỗi** (trên). (2) `NganDanhSach` (panel số liệu) — mở dưới **đúng** (đầu giữ, flex, `SoLieu.tsx:152–209`) nhưng trộn với "thay nội dung panel" → theo V3B-03 thống nhất. (3) Tổng quan "Cần bạn quyết" — cùng việc mở **ngăn phủ** (khác Công việc) → khung phải hàng đợi B. (4) Học viên & Lớp panel một em — `GhiNhanh` trong panel (không lỗi lưới), giữ. (5) Lịch thi — mở dưới hàng trong bảng rộng: đúng luật. (6) Phối hợp SOS "Bỏ ▾" mở trong thẻ — giữ (2b). (7) Thẻ Chờ duyệt: "Từ chối…" mở ô lý do trong thẻ (đúng), "Mở" **đổi trang** (CV-27) → khung phải. (8) Lịch Test khối: mở lưới dưới hàng (bậc 4 tại chỗ — đúng, 12.2). Không thấy chỗ thứ hai bị lỗi `col-start-2` (grep `col-start-2`: các chỗ khác là dòng chữ phụ, không phải vùng mở).
7. **Xuyên trang / vai:** GV, GVCN, QL, QT (mọi người mở Kết quả PA ở Công việc); dòng chung `DongViec` dùng ở Tổng quan cũ (PR-VAI) — cùng sửa.
8. **Luật:** không (Kết quả PA giữ luật: Tiến triển + Nhận xét ≥ 8 ký tự; Quyết định mặc định Giữ nguyên).
9. **Kiểm thử:** đo DOM: khi một dòng đang chọn / mở, mọi `[data-hd=cv-dong] > button` rộng ≥ 50 % dòng (1 024 / 1 280 / 1 440 / 375); phép kiểm tĩnh: `WorkList.tsx` không còn `sm:col-start-2` cho vùng mở; mở việc → URL có `viec=` → Lùi trình duyệt về đúng dòng, focus về dòng; ảnh cặp trước / sau.
10. **Cần chủ SP:** **Có — Q4** (bỏ "ghi nhanh dưới dòng" ở Công việc là đổi một khung mockup OV-13 §1 đã duyệt; khuyến nghị A).

---

## V4A-07 Nhập Excel trong panel Công việc (XI.7) · P2 · (A) đã chốt bỏ — đã kiểm lại

1. **Ở đâu:** panel Nhập điểm ở Công việc (một lớp — `PanelNhapDiem`; theo tuần — `PanelNhapDiemTuan` → `LuoiNhung`), cả 1440 và 375.
2. **Biểu hiện:** còn "Dán từ Excel" + "?" (`P-nhapdiem-gv10`: nút "Dán từ Excel", "?", "Cả lớp"; link "1 lớp · 2 bài ↗", "Mở lưới đầy đủ ↗"; 375: "Dán từ Excel", "?", "Xem dạng bảng", 5 tab kỹ năng — CV-21 còn). Theo tuần (lớp thường): thêm "Điền cả cột", 5 "Nhận xét", 5 "⋯" → 20 nút.
3. **Bằng chứng:** `LuoiChamLop.tsx:109–112` (`coDan` = người xem sửa được ≥ 1 ô — không theo nơi mở), `:179–195` (thanh công cụ `justify-end`, nút dồn mép phải — CV-11); 12.3 bảng 8 lối (#3–4 BỎ).
4. **Nguyên nhân:** OV-15b/h2 bật Dán ở mọi lưới có ô sửa được.
5. **Ảnh hưởng:** thêm 2 nút vô dụng ở việc nhiều nhất của GV; khối dán bị cắt trong panel (CV-02 — hết hiệu lực khi bỏ).
6. **Phương án (A + C):** thêm cờ `choDanExcel` chỉ bật ở **hồ sơ lớp lưới theo lượt** và **panel "Nhập điểm lớp"** (12.3 #7–8). Panel Nhập điểm ở Công việc sau khi bỏ:
   ```
   Nhập điểm Writing Task 2                          ⚠ quá hạn 68 ngày  ✕
   MB FT 101 ↗ · MT1 · thi W1 JUL · 2 bài
   Còn 2 bài · 2 em                                        Hiện cả lớp ◻
   Học viên ─────────── W2 ───── Kết quả W2
   Lương Bảo Anh        [   ]    —
   Tạ Minh Quân         [   ]    —
   ✓ Đã lưu 09:12 · Hoàn tác                       [ Lưu · em tiếp › ]
   ```
   bỏ "?", "Mở lưới đầy đủ ↗", "1 lớp · 2 bài ↗" (11.1c #12, CV-04); "Cả lớp" → công tắc thật "Hiện cả lớp" (thêm em + cột, CV-11); bảng rộng hết panel; cột Kết quả = kết quả kỹ năng của việc (CV-12); "GV chấm S" chỉ khi việc có S; lớp thường: bỏ "Điền cả cột" khỏi panel việc, "Nhận xét" vào hộp chấm (12.1 A). Thanh công cụ: **2 thứ** (trái "Còn n bài", phải công tắc) thay 4–6 nút.
   **Xuất Excel:** Công việc không có nút xuất — không đụng (12.6).
7. **Xuyên trang:** Lịch Test (lối #1–2 cùng thành phần) bỏ cùng PR; hồ sơ lớp giữ.
8. **Luật:** (A) bỏ nhập Excel trừ theo lớp, từng MT; giữ luật nhận xét MT ≥ 10 ký tự.
9. **Kiểm thử:** DOM: không nút "Dán từ Excel" trong `main section.card` ở Công việc (1440 + 375); grep: `DanExcel` chỉ dựng khi `choDanExcel`; máy chủ `luot` bắt buộc ở `/scores/lo` (12.3).
10. **Cần chủ SP?** Không (đã chốt). Câu 12.9-10 (lớp thường "theo từng MT" = theo từng bài?) vẫn chờ.

---

## V4A-08 Việc của TVV: ở đâu, dáng gì (CV-32, 11.2, 7.9) · P1

1. **Ở đâu:** TVV 23: menu Tổng quan · Học viên & Lớp · Phân tích; `/cong-viec` → về Tổng quan (`nav.ts:45` `work` = false; API 403); Tổng quan TVV = 5 ô đếm mở Học viên & Lớp `view=` (`HocVienCuaToi.tsx`, `tvv23-tq`); Học viên & Lớp › Cần làm = 0 (`tvv23-canlam`) — góc này đề xuất bỏ (11.2).
2. **Biểu hiện:** TVV **không có chỗ nhận việc**: không danh sách, không hạn, không badge. Việc gần TVV nhất hiện thuộc người khác: "Báo phụ huynh qua TVV" là việc của GVCN / QL tự đánh dấu (`mywork.ts` nhóm `phoi_hop`; `ql2-cua-toi`). Việc mới theo luật đã chốt (II.1–2) và 11.8-3 chưa có trong mã: **Ghi nhận kết quả xử lý vi phạm** (5 ngày lịch), **Chốt ngày thi** (không hạn), **Bổ sung hồ sơ thiếu**, **Chọn bước tiếp / Chốt lộ trình sau thi** (CX hiện qua ô "Chờ chọn bước tiếp" → Học viên & Lớp).
3. **Bằng chứng:** `tvv23-tq.png`, `tvv23-tq-375.png`, `tvv23-canlam.png`, `tvv23-cv.png`; `OverviewPage.tsx:57–64`; `nav.ts:28, 45`.
4. **Nguyên nhân:** PR-OV2a cho TVV "Học viên của tôi" (chỉ đếm), không có loại việc của TVV.
5. **Ảnh hưởng:** việc GVCN → TVV (luật II.1) không có nơi hiện → không ai biết hạn 5 ngày; TVV phải đổi trang để tra em.
6. **Phương án (C) — chỗ + dáng (loại việc và luật: phần của v4b):**

   | | **T1 — hàng đợi "Việc của bạn" trên Tổng quan TVV (KHUYẾN NGHỊ)** | T2 — mở menu Công việc cho TVV | T3 — trong Học viên & Lớp (Cần làm) |
   |---|---|---|---|
   | Chỗ | trang đầu TVV: đầu trang 1 hàng → **"Việc của bạn · 6 · ⚠2"** (trái danh sách / phải chi tiết, dáng B) → "Học viên của tôi" thu thành **một hàng số** (lọc tại chỗ) | Công việc (vị trí 4) = hàng đợi; Tổng quan giữ ô đếm + một dòng "Việc của bạn · 6 — Công việc ›" | góc Cần làm |
   | Ghi nhận KQ xử lý vi phạm | **2 bấm** + gõ, 0 đổi trang | 3 bấm | 3–4 + 1 đổi trang |
   | Chốt ngày thi | 2 bấm | 3 | 3–4 + 1 |
   | Hợp luật "việc TÔI ở trang đầu" (V4A-02) | ✓ | ✗ (TVV có 2 nơi) | ✗ (trái 11.2) |
   | Thêm menu | không | +1 mục | không |

   **Nhóm (thứ tự cố định, chỉ nhóm có việc):** Kết quả xử lý vi phạm · Lịch thi (chốt ngày) · Sau thi (bước tiếp) · Hồ sơ thiếu.
   **Dáng dòng + panel (cùng `DongViec` / khuôn V4A-03):**

   | Việc | Dòng 1 · dòng 2 | Hạn | Mở |
   |---|---|---|---|
   | Ghi nhận kết quả xử lý vi phạm | "Ghi nhận kết quả xử lý · Lê Quang Huy · Report 1" · "MB FT 101 · GVCN Trần Ngọc Hà lưu 14/09 16:20" | "còn 4 ngày" → chi tiết ghi **giờ hết hạn chính xác** ("hết 23:59 19/09" hoặc "16:20 19/09" — v4b chốt) | khung phải: ② bối cảnh = vi phạm gì · bậc · GVCN đã xử lý thế nào (ghi chú GVCN) → ③ ô do v4b chốt (đã liên hệ PH? · kết quả · PH phản hồi) → ⑤ Lưu |
   | Chốt ngày thi | "Chốt ngày thi · Hồ Gia Hân · 11/2026" · "MB FT 101 · chưa chốt ngày" | "—" (không hạn, không vào số quá hạn) | khung phải nhỏ: [ngày] · [Dời sang 12/2026] · ghi chú (cùng ô với hộp neo ở Lịch thi — 11.2) |
   | Bổ sung hồ sơ thiếu | "Bổ sung hồ sơ · Lê Minh Đức · thiếu SĐT PH, Email" | — | khung phải **chỉ các ô thiếu** (không cả "Sửa thông tin" — CV-25) |
   | Chọn bước tiếp sau thi | "Chọn bước tiếp · Dương Minh Quân · OVR 6.5 Đạt" | hạn sau thi | `PanelBuocTiep` (như QL) |

   **Phía GVCN (để thấy chuỗi bàn giao):** sau "Xác nhận xử lý" ở panel GVCN → dòng chân "✓ Đã lưu · đã giao TVV Nguyễn Thu Hương ghi nhận kết quả (hạn 19/09)"; hồ sơ HV › Ý thức (11.4) Nhật ký hiện chuỗi Vi phạm → GVCN xử lý → TVV ghi nhận → kết quả. **Badge:** số trên "Tổng quan" của TVV = việc quá hạn + hạn hôm nay (cùng nghĩa QL — V4A-02). 375: danh sách → chi tiết toàn màn, nút chính dính đáy.
7. **Xuyên trang / vai:** CX (cũng không có Công việc; ô "Chờ chọn bước tiếp") → cùng mẫu T1 nếu CX có việc; QL kiêm TVV (Góc nhìn) theo góc nhìn; Phân tích Ý thức (V3B-06) không lấy cột việc.
8. **Luật:** (A) II.1–2: việc sinh ngay khi GVCN lưu, hạn **5 ngày lịch** (gồm T7, CN) — dáng chỉ hiển thị, không tính lại; (A) 11.8-3c ai làm Chốt ngày thi (đang chờ chủ SP chốt khuyến nghị "TVV phụ trách em; không có TVV → QL"). Trường form, người nhận trường hợp đặc biệt, "chưa liên hệ được PH": **v4b**.
9. **Kiểm thử:** phép kiểm máy chủ (v4b): GVCN lưu xử lý → `/tong-quan/hoc-vien` (hoặc API việc TVV) có việc, hạn = lúc lưu + 5 × 24 h; web: Tổng quan TVV có "Việc của bạn" khi có việc, ẩn khi 0 ("✓ Không có việc chờ"); TVV không thấy menu Công việc (T1); ảnh cặp TVV 1440 + 375 (rỗng · có việc · quá hạn · vừa xong).
10. **Cần chủ SP:** **Có — Q2** (T1 hay T2: chỗ việc của một vai).

---

## Câu hỏi cho chủ SP (chỉ định hướng / nghiệp vụ — quan trọng trước, mỗi câu có khuyến nghị)

1. **Q1 — Phân vai Tổng quan ↔ Công việc (V4A-02):** "Việc TÔI phải làm / quyết luôn ở trang đầu của tôi" — QL / QT / Admin / TVV: Tổng quan; GV: Công việc. **Công việc của QL / QT / Admin = theo dõi việc của GV (gom theo GV) + giao việc / Vận hành + lịch sử duyệt**, chỉ một dòng dẫn "Cần bạn quyết · n — ở Tổng quan ›"; Chờ duyệt là **nhóm đầu của một hàng đợi** (không hộp riêng ở trên — ảnh 2.jpg cho thấy hộp riêng làm trang dày). — **Khuyến nghị: Có.**
2. **Q2 — Việc của TVV (V4A-08):** hàng đợi "Việc của bạn" ngay trên Tổng quan TVV (không thêm menu Công việc cho TVV), "Học viên của tôi" thu thành một hàng số. — **Khuyến nghị: Có (T1).** (Nếu chủ SP muốn mọi vai có việc đều có mục "Công việc" → T2.)
3. **Q3 — Case không có người phụ trách (V4A-05):** tự gán theo luật đang dùng khi tạo Case (GV dạy môn đó, không có thì GVCN), có lịch sử; bỏ việc "Chọn người phụ trách"; chỉ khi lớp **thật sự thiếu GV môn** mới có việc "Phân công GV môn …" cho QL (hộp nhỏ, một ô). — **Khuyến nghị: Có.**
4. **Q4 — Kết quả PA ở Công việc (V4A-06):** bỏ "ghi nhanh dưới dòng" (khung OV-13 §1 đã duyệt), mở ở khung phải như mọi việc với cùng form gọn (vẫn 3 bấm, giữ tiêu đề + bối cảnh PA). Ghi nhanh vẫn giữ ở panel một em (Học viên & Lớp). — **Khuyến nghị: Có.**

## PTA tự quyết (thẩm mỹ / UX) — liệt kê để chủ SP biết

- Dòng việc 3 vùng (Hạn · Việc + đối tượng · ›), 56 px / 64 px (375), tên 15 px, dòng 2 13 px; một hàm tên việc cho dòng + đầu panel; bỏ chip "Bình thường"; quá hạn = chữ cam + ⚠ (không tô hàng).
- Nhóm GV: Chấm điểm · Case học thuật · Ý thức & Phối hợp (gồm Phối hợp SOS, Báo PH) · Lớp & hồ sơ; vạch Quá hạn / Tuần này / Sau (gập); gom "nợ chấm cũ" ≥ 14 ngày cùng lớp × môn một dòng (cùng nguồn 12.2).
- Sắp trong nhóm: quá hạn lâu nhất → hạn gần → SOS cao → tên.
- "Bị từ chối" thành việc trong nhóm của nó ("Sửa đề xuất · bị từ chối"), bỏ khối thẻ rời cuối trang GV.
- Vào trang không tự mở việc của người khác, không đặt con trỏ, không cuộn; lỗi tải chỉ che vùng danh sách; rỗng theo vai; ẩn lọc người khi 0 việc.
- Một danh sách một kiểu mở; luật mở toàn web (V4A-06); hộp neo cho Gia hạn / Phân công / Chốt ngày thi / Từ chối.
- Giải phẫu panel 6 phần; thang chữ panel 17 · 15 · 14 · 13 · (12); không IN HOA; hệ số dòng ≥ 1,5; khoảng 24 / 16 / 8 px; bối cảnh trước form; một nút chính; lịch sử gập.
- Vỏ "Khung việc" + 11 thành phần chung; 44 panel đầu cũ → đầu v3.
- Panel Nhập điểm Công việc: thanh công cụ còn "Còn n bài" + "Hiện cả lớp".
- Dáng việc TVV (bảng V4A-08) và dòng chân GVCN "đã giao TVV …".

## Cần kiểm thêm (session code, trên bản demo RIÊNG — không phải demo chung, không cần chủ SP chụp)

1. Công việc GV 7 → Kết quả PA Reading (Lý Minh Châu) → chọn "Tiến bộ một phần", gõ 8 ký tự, **Lưu** → chụp dòng "✓ Đã lưu" ở 1 440 (khẳng định tiêu đề vẫn mất — V4A-06).
2. Công việc QL 2 → "Phân công…" ở "Thêm PA học thuật Reading · Dương Ngọc Ánh" → **Lưu phân công** không đổi → chụp dòng sau tải lại (khẳng định còn "Chưa có người" — V4A-05).
3. Sau khi có việc TVV (PR của v4b): GVCN 7 Xác nhận xử lý → đăng nhập TVV 23 → chụp Tổng quan (đủ trạng thái).

## Ghi chú môi trường

Lần chạy đầu quên đặt `BASE` / `ANH_DIR` → công cụ chụp ghi một tệp nhật ký lỗi `index.jsonl` (16 dòng ECONNREFUSED, không ảnh) vào `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\index.jsonl` (thư mục tạm của đợt rà cũ). Vô hại; xoá bị chặn bởi quyền — PTA xoá nếu muốn. Không đụng repo, không đụng dữ liệu demo.

## Ảnh tiêu biểu (đường đủ)

1. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\qt1-dau-p1.png` — Công việc QT: bố cục A thật (hộp duyệt trên + trái / phải), dòng việc đầu ở 752 px.
2. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\qt1-dau-khung.png` — vào trang tự mở lưới GV và tự cuộn mất "Chờ bạn duyệt" (CV-09 còn).
3. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\E-qt1-ghinhanh.png` — Kết quả PA mở dưới dòng: tiêu đề co 0 px, khung phải trống.
4. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\P-phancong-qt1.png` — "Phân công…" mở ngăn phủ Thông tin lớp (R đã có người) chồng lên panel Thêm PA.
5. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\P-noowner-qt1.png` — "Chọn người phụ trách" mở panel Case không có ô chọn người.
6. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\qt1-375-p1.png` — 375: 3 hàng lọc + thẻ duyệt, việc đầu ở 1 505 px.
7. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\gv7-dau-p1.png` — GV: 4 dòng nợ cũ đứng đầu; "Chưa có người" thấy cả ở GV.
8. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\ql2-viec-ql-p1.png` — "Việc quản lý" của QL chứa Bàn giao của GV; Chốt lộ trình đổi trang ↗.
9. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\ql2-tq-p1.png` — Tổng quan QL "Cần bạn quyết" trùng Chờ duyệt + Chốt lộ trình với Công việc.
10. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\P-chamspeaking-gv9.png` — Chấm Speaking: 1 949 px nội dung, chữ sát nhau.
11. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\P-phoihopsos-gv7.png` — Phối hợp SOS: 29 nút, 9 "Xác nhận" màu nhấn.
12. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\P-buoctiep-giahan-qt1.png` — Gia hạn (1 ô ngày) là ngăn phủ 560 px cả chiều cao chồng panel.
13. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\L-gv7-loi.png` — lỗi tải: cả trang chỉ còn một câu + Thử lại.
14. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4a\tvv23-tq.png` — Tổng quan TVV: chỉ ô đếm, không chỗ nhận việc.
