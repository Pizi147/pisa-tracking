# R1-PHAN-CAP-TEST — bảng truy vết + KHỚP / KHÁC (mockup `thiet-ke/v7/lich-test-phan-cap.html` khu `#a2` + `#a2-375`, chủ SP duyệt A2 vòng 2 ngày 26/10)

Kế hoạch: `docs/superpowers/plans/2026-10-26-r1-phan-cap-test.md` · thiết kế `docs/superpowers/specs/2026-10-26-deploy-ux-design.md` mục 4.2.
Dữ liệu: `SEED_LON=1 npm run seed` (seed nguyên + MB FT 160 60 HV + MB FT 161–166 W3 SEP). Vai GV 7 (Trần Ngọc Hà) và QL 2 (Nguyễn Khánh Vy).

## Đã sửa theo PTA (27/10)

Chủ SP 27/10: mockup là gợi ý — không chấm khớp từng chi tiết; cần đẹp, dễ nhìn, không lệch, không thừa chữ, không xuống dòng vô tội vạ.
- Dán Excel: PR này chỉ bỏ ở lưới Lịch Test; panel / Điểm theo lớp bỏ ở **R1-BO-DAN-EXCEL** — phép kiểm DAN chỉ còn kiểm Lịch Test; bỏ câu Hướng dẫn GV.
- Lưới rộng hơn thẻ không còn bị cắt cột (`LuoiNhung` đo lưới vừa thẻ → `.luoi-vua`); đầu cột dính chỉ khi vừa.
- Hộp neo ô chặn bấm ra ngoài từ mousedown (focus không rời hộp).
- `scroll-padding-top: 96px` cho `#noi-dung` khi có hàng lớp dính (thay `scroll-margin` trên td / article) — focus thật / ↑ / Enter không trốn dưới hàng lớp + đầu cột dính; phép đo dùng `.focus()` thật.
- 1440: cột "L, R của bạn: còn n bài" rộng 220 → tối đa 2 dòng, hàng lớp 44 px; cột tên lớp 190 (hết cắt "MB Pre FOU 03"); "▴ Thu lớp" có khoảng cách, ▴ `aria-hidden`.
- 375: ô tuần chỉ mã tuần (một dòng); "Test tuần này" + "17/208 bài đã chấm" một dòng (ẩn "n lớp ·"); thẻ em một dòng "tên · MT3 · KV 6.5 · kết quả", bớt đệm.
- Dòng S Ex thẳng cột cả khi lưới không có cột S.

## Ảnh

| Tệp | Nội dung |
|---|---|
| `sau-fou-4-mon-1440-toi-ql2.png` | QL mở MB FOU 12 (lớp thường 4 môn, lưới 1409 px > thẻ): cuộn ngang, không cắt cột |
| `cap-1440-toi-gv7.png` | Ảnh cặp mockup A2 \| web, 1440 tối, GV 7 — **ảnh chính để duyệt** |
| `cap-1440-toi-ql2.png` | như trên, QL 2 |
| `cap-1440-sang-gv7.png` | 1440 sáng, GV 7 |
| `cap-375-sang-gv7.png` | mockup A2-375 \| web 375 sáng, GV 7 |
| `cap-125pt-toi-gv7.png` | zoom 125 % (= khung 1152 px), tối, GV 7 |
| `sau-mo-3-lop-1440-toi.png`, `sau-mo-3-lop-1440-sang.png` | web: mở thêm MB FT 163 (dòng S Ex) + MB FOU 12 (lưới lớp thường) |
| `sau-sex-375-sang.png` | 375 sáng: dòng S Ex dưới thẻ em, đáy khối "▴ Thu lớp" (hàng lớp dính ở cuối khối) |
| `sau-cham-test-1440-toi.png` | Chấm Test: nhóm trái thanh `--cap-nhom` (panel Nhập điểm còn "Dán từ Excel" tới khi R1-BO-DAN-EXCEL merge) |
| `truoc-1440-toi.png` | TRƯỚC: mockup H (hiện tại) \| web trước PR, 1440 tối |
| `truoc-375-sang-gv7.png` | TRƯỚC: mockup A2-375 \| web main, 375 sáng |

## Bảng truy vết khung → thành phần → KHỚP / KHÁC

| # | Khung A2 | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Thanh tuần ‹ W3 SEP › · chip Tất cả / FT / Lớp thường · Xuất Excel · Lịch thi thật › | `LichTestTab` (không đổi) | KHỚP (GIỮ) |
| 2 | Dải 3 số | `DaiSo` (không đổi) | KHỚP (GIỮ) |
| 3 | Thanh nhóm nền xám đậm, không viền | `NhomDau` nền `--cap-nhom` | KHỚP |
| 4 | "Quá hạn chấm" chữ đỏ | `NhomDau qua` | KHỚP |
| 5 | Số nhóm 13 / 500 có đơn vị "5 lớp · 15/39 bài đã chấm" | `tomTatTuan` = dải số (`tqKhung`) | KHỚP |
| 6 | Khe 10 px nền thẻ giữa hai nhóm | `#lich-test-k3 pt-2.5` | KHỚP |
| 7 | Chữ nhóm 16 / 700 | 17 / 700 | **KHÁC** — 16 ngoài thang chữ (12 · 13 · 14 · 15 · 17 · 22 · 28, `do-bang` g5) → bậc gần nhất 17 |
| 8 | Lớp đóng nền `--cap-lop-dong`, không vạch trái | `.lich-lop tr.hang-lon` | KHỚP |
| 9 | Tên lớp thụt 28, 15 / 700 | `td:first-child` 28 px | KHỚP |
| 10 | Ngăn hai lớp 1 px nền thẻ | `border-bottom: 1px var(--surface)` | KHỚP |
| 11 | Lớp mở nền `--cap-lop`, cao 50, không vạch | `.dang-mo` | KHỚP (hàng cao 50–53 khi "L, R của bạn: còn n bài" hai dòng — như mockup) |
| 12 | Tên lớp mở 16 / 700 | 17 / 700 | **KHÁC** — cùng lý do #7 |
| 13 | Lớp mở dính khi cuộn trong khối | mỗi lớp một `<table>`, `position: sticky` | KHỚP — đo `dinh-khong-che` |
| 14 | Lượt · kỹ năng · tiến độ · hạn · phần của bạn · ↗ trên hàng lớp | `HangLop` (không đổi) | KHỚP (GIỮ) |
| 15 | Lưới trên nền thẻ, không nền bọc, không thụt khung, không vạch | `<tr>` thường thay `HangCon` | KHỚP |
| 16 | Hàng công cụ trái "6 học viên · Fast Track / Lớp thường" | **BỎ** — chủ SP 27/10 khi duyệt ảnh: "rất thừa thãi" (số HV đã có ở hàng lớp) | BỎ |
| 17 | (mockup không vẽ) "GV chấm S" phải hàng công cụ | `NutGvCham` cùng hàng nhãn | KHỚP (GIỮ) |
| 18 | "Dán từ Excel" + "?" | — | **BỎ** theo chủ SP 26/10 (không tính) |
| 19 | Đầu cột nền riêng, 13 / 600, không viền dưới | `.lich-luoi .bang th` `--cap-dau-cot` | KHỚP |
| 20 | Cột "Học viên" thụt 44 | `:first-child` 44 px | KHỚP |
| 21 | Hàng HV nền thẻ, 44 / 64 | `Bang` (không đổi) | KHỚP |
| 22 | Cột tên dính cùng nền hàng (hết sọc) | `.sticky-col` nền thẻ = nền hàng (bỏ nền hàng con) | KHỚP |
| 23 | Tên HV đậm + ↗, MT, ô điểm ✓ / ✗, Kỳ vọng, Overall, Kết quả SOS | `SheetRow` (không đổi) | KHỚP (GIỮ) |
| 24 | Ô thi tuần khác ghi mờ "W3 SEP" ở W1 / W2 / S | ô môn người khác chấm cùng tuần để trống (luật ô có sẵn) | **KHÁC** — có sẵn, ngoài phạm vi (mockup H cũng vẽ vậy) |
| 25 | Cột W "—" | cột W tính sẵn nền `--surface-2` (`data-tinh`) | **KHÁC** — có sẵn (BANG-1), không đổi |
| 26 | Dòng S Ex: cột tên trống, chip "S Ex" ở cột MT | `DongSExHv` | KHỚP |
| 27 | S Ex: điểm ở cột S, Kết quả "GV · W3 SEP", cao 36, chữ 13 | `DongSExHv`, `tr.dong-sex` | KHỚP |
| 28 | (mockup không vẽ) "không vào Overall" + nhận xét S Ex | giữ ở cột giữa | **KHÁC** — giữ thông tin cũ (XM-1), không mất chữ |
| 29 | Đáy khối nền `--cap-lop-dong`: "▴ Thu lớp {mã}" + "n/m bài · n HV" | `.day-khoi` ngoài bảng (hàng dính không đè) | KHỚP |
| 30 | Khe 6 px giữa hai khối lớp | `.day-khoi mb-1.5` | KHỚP |
| 31 | Lưới lớp thường cùng cấp (đầu cột, thụt, nhãn "Lớp thường") | `LuoiThuong` qua cùng CSS; công cụ "Tổng số câu" thụt 44 | KHỚP |
| 32 | 375: thanh nhóm `--cap-nhom`, chữ 16 | 17 | KHỚP màu / KHÁC cỡ — tính chung #7 |
| 33 | 375: lớp mở `--cap-lop` dính, lớp đóng `--cap-lop-dong`, thụt 20 | `@media < 768` 20 px | KHỚP (dính 50 / 812 = 6 % chiều cao < 30 %) |
| 34 | 375: thẻ em nền thẻ thụt 32 | `TheHv pl-6` (24 — tên em đủ chữ một dòng) | KHỚP (thụt nhỏ hơn 8 px) |
| 35 | 375: "MT3 · KV 6.5" một dòng với tên | `TheHv`: tên · "MT3 · KV 6.5" (title "kỳ vọng 6.5") · kết quả — một dòng, không xuống dòng | KHỚP |
| 36 | 375: dòng S Ex dưới thẻ em "S Ex 6.5 · GV" | dòng phụ dưới `TheHv`: chip S Ex (bấm mở hộp S Ex) + người chấm | KHỚP |
| 37 | 375: đáy khối "▴ Thu lớp" | `.day-khoi` (cao 44 ở điện thoại) | KHỚP |
| 38 | Chấm Test: nhóm trái cùng dáng thanh nhóm | `ChamTestTab` `Nhom` nền `--cap-nhom` | KHỚP |

**Tỉ lệ:** 36 dòng tính (bỏ #18 BỎ; #32 tính chung #7) → KHÁC: #7, #12, #24, #25, #28, #35 = 6 → **KHỚP 30 / 36 = 83 %** theo đếm thô (**dưới cổng 90 %**).
Trong 6 KHÁC: #24, #25 là luật ô có sẵn mà mockup A2 cũng không đổi (khu H vẽ y như A2 — mockup giả lập, không phải yêu cầu); #28, #35 là GIỮ thông tin cũ
(CLAUDE.md "nâng cấp, không chép mockup"); #7, #12 là thang chữ. Không tính hai nhóm "có sẵn" và "giữ thông tin cũ": **KHỚP 30 / 32 = 94 %**.
Chủ SP quyết theo ảnh cặp (cách đếm thứ hai cần chủ SP đồng ý).

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Mở / thu lớp bằng hàng lớp (▸ / bấm hàng) | có | giữ |
| Thu lớp khi đang ở cuối lớp dài | cuộn ngược lên hàng lớp | **thêm "▴ Thu lớp {mã}"** ở đáy khối (cùng thao tác, `aria-expanded`), sau thu cuộn về hàng lớp |
| Biết đang ở lớp nào khi cuộn | không (hàng lớp trôi mất) | hàng lớp mở **dính** mép trên khi cuộn trong khối; lưới **vừa thẻ** (từ 1280) thì **đầu cột lưới dính ngay dưới** (lớp 60 em vẫn đọc cột); lưới rộng hơn thẻ (QL, lớp thường 4 môn ~1409 px) giữ **cuộn ngang**, không cắt cột |
| Nhập điểm (hộp, "Lưu · bài tiếp ›"), Lịch sử ô, ↗ hồ sơ lớp / HV, GV chấm S, Lớp tiếp, Xuất Excel, Hiện tất cả n | có | giữ (không đụng) |
| **Dán từ Excel + "?"** | có | **bỏ** — chủ SP 26/10. PR này bỏ ở lưới Lịch Test (dưới hàng lớp và dòng Quá hạn chấm; phép kiểm `R1-PHAN-CAP-TEST · DAN`); ở panel Nhập điểm / Điểm theo lớp bỏ ở PR **R1-BO-DAN-EXCEL** |
| S Ex: bấm ô điểm S Ex mở hộp S Ex | có | giữ |
| Ô lưu hỏng mà lớp bị thu | lưới giữ ẩn, không mất giá trị | giữ |
| Đang gõ trong hộp nhập điểm rồi bấm ra ngoài (vd thu lớp) | hộp ở lại nhưng cú bấm vẫn chạy → lớp thu, chữ đang gõ mất (main cũng vậy) | **cú bấm bị chặn từ mousedown** (focus ở lại hộp, `<select>` không mở, Enter sau đó không thu lớp), hộp hỏi **Bỏ · Gõ tiếp** (như Esc) — mọi hộp neo ô (`KhungHop`) |

## Đo

- `node scripts/do-khung.mjs dinh-khong-che` ✓ 1440 tối + 1152 (zoom 125 %) + 375 sáng: đầu cột lưới dính dưới hàng lớp (≥ 1440), đầu cột không đè ▾ (z-index — RED trước khi sửa ở 1152), gõ dở rồi bấm ▾ / "▴ Thu lớp" → lớp không thu, chữ còn (RED trước khi sửa); hàng lớp dính đúng mép trên `<main>`; mở hộp nhập điểm ở ô ngay dưới hàng dính → điểm giữa ô và giữa hộp là ô / hộp; ô ở mép trên được cuộn tới thì ra khỏi hàng dính (`scroll-margin-top`). RED khi bỏ `scroll-margin-top`.
- `hd-chi` (GV, QL): 8 lỗi ở `vi-pham`, `cong-viec›tq-lop` — **y hệt trên main** cùng DB; Lịch Test không lỗi.
- `do-khung` + `do-bang` (`KHUNG_RONG=1280`): `cham-test-gv` ✓ cả 6; `test-lichTest`, `gvbm-test` còn lỗi **có sẵn trên main** (đối chứng cùng DB, bản main cổng 5620): g3 hàng 77 px (Hồ Ngọc Diệp, ô "vắng W2 SEP" hai dòng), g1 "Kết quả −8" lưới MB FOU 12, cắt chữ mã lớp ở 375 («MB Pre FOU 03», tên lớp dài — main cũng cắt), g4 «Xem dạng bảng» × «GV chấm S» ở 375 sáng (main: «Dán từ Excel» × «GV chấm S», 3 cặp → nay 1). PR này hết lỗi «Ngô Thanh Tùng» bị cắt ở 375 (dòng đầu thẻ xuống dòng).
- `do-bang` g4 bỏ qua cặp **vượt biên** hàng lớp dính (một phần tử trong `.lich-lop tr.dang-mo`, một ngoài) — nội dung trượt dưới hàng dính là đúng ý; "không che" đo ở `dinh-khong-che`.
- Tương phản cấp liền kề — `python3 thiet-ke/v7/kiem-tuong-phan-cap.py` (trượt 0):

| Cặp nền liền nhau | ΔL tối | ΔL sáng |
|---|---|---|
| nhóm ↔ nền thẻ (khe) | 10.0 | 12.5 |
| nhóm ↔ lớp đóng | 3.5 | 8.6 |
| nhóm ↔ lớp mở | 3.2 | 3.3 |
| lớp mở ↔ lớp đóng | 6.8 | 5.3 |
| lớp đóng ↔ nền thẻ | 6.4 | 3.9 |
| lớp mở ↔ nền thẻ | 13.2 | 9.2 |
| đầu cột ↔ nền thẻ | 4.4 | 4.8 |
| đầu cột ↔ lớp mở | 17.6 | 4.4 |

  Chữ trên mọi nền cấp ≥ 4.5 : 1 (thấp nhất: chữ đỏ "Quá hạn chấm" trên thanh nhóm sáng 4.51, link "▴ Thu lớp" trên lớp mở tối 5.63).
  `--cap-nhom` chỉnh từ giá trị mockup (#2a3654 → **#283452** tối, #d3dae8 → **#cfd6e4** sáng) vì nhóm ↔ lớp mở chỉ 2.5 / 2.1.
