# Phân tích v19 — ô số nổi, cột cân, panel rõ (chờ chủ SP duyệt 12/11)

Mở `phan-tich.html` bằng trình duyệt (tự chứa, phông Google Fonts; nút "Đổi sáng / tối" ở đầu tệp). Ảnh: `anh/`.
Đề bài: `docs/superpowers/specs/2026-11-12-phan-tich-y-thuc/de-bai.md` mục 1–2 (phần MOCKUP-PT). Nền: mockup Phân tích V2 #1400 — giữ bố cục,
số liệu, thứ tự tab, thao tác; v19 chỉ đổi **cách hiện số**, **độ rộng / chiều cao / nhóm cột** và **panel mở từ số**.
Lỗi "bấm số chỉ nháy" và bỏ ① ② ③ là việc của session PT-SO-LOI (code), không nằm ở đây.

## 1. Một luật cho mọi tab

**Hộp = bấm được · màu = cần làm.** Hai kênh độc lập, áp cùng một kiểu ở Chi nhánh, Thi thật, SOS, Giáo viên, Ý thức (cả khối PA nào hiệu quả).

| Loại | Dáng | Dùng ở |
|---|---|---|
| Số bấm được | Hộp cao 30 (375: 36), bo 7, nền `--os-nen`, viền `--os-vien`, chữ Inter 600 15 `--os-chu`. Không gạch chân khi đứng yên; rê = nền đậm hơn + viền nhấn + gạch chân; phím = vòng nhấn 2 px | Đúng hạn, Làm muộn, Đạt, Vi phạm, HV đang học, lượt MT, Dưới kỳ vọng, Số PA… |
| Quá hạn | Hộp nền đỏ thẫm, viền đỏ, chữ đỏ sáng, **⚠ trước số** | Chưa làm (Chấm Test, Việc — đã qua hạn), Chưa phân công, S chéo chung, Chưa xử lý có phần quá hạn |
| Đang chờ | Hộp vàng (nền, viền, chữ), không ⚠; tên cột / nhãn thẻ nói nghĩa | Chưa chốt PA, Thiếu điểm, Chưa xử lý (chưa quá hạn), Chưa có KQ |
| So Target / kỳ vọng | Hộp trung tính, **chỉ con số** đổi màu (luật cũ "chỉ tô con số"): Vượt / Tăng xanh, Chưa đạt / Giảm đỏ; tên cột ghi chữ | Thi thật Vượt · Đạt · Chưa đạt, Tiến bộ ↑ Tăng · ↓ Giảm |
| Chip SOS | Chip SOS 1 · 2 · 3 ở **tiêu đề cột** và thẻ chỉ số; ô số trong bảng là hộp trung tính [XM-7] | SOS 1 · 2 · 3 |
| Đang mở panel | Viền nhấn 2 px + nền nhấn trong lúc panel mở | ô nguồn (khung 2a) |
| Không bấm | 0 và "—" chữ mờ (~4,5 : 1), không hộp · tỉ lệ chỉ để đọc (% đúng hạn), phân số (9/14), điểm thi: chữ thường | mọi tab |
| Tỉ lệ bấm được | Tỉ lệ mở danh sách (Đạt MT %, Đạt kỳ vọng Test %) là hộp; phân số mờ đứng sau. Cặp hộp + phân số là lưới hai cột (hộp căn phải, phân số căn trái) để mọi dòng thẳng nhau | Chi nhánh, Giáo viên, Thi thật, PA |
| Số lớn ở thẻ | Cùng hộp, cỡ 34 (375: 26) | dải thẻ đầu tab |

Tương phản (đo WCAG, nền thẻ `--surface`):

| | Tối | Sáng |
|---|---|---|
| Chữ / nền hộp trung tính | 10,8 : 1 | 10,6 : 1 |
| Viền hộp / nền thẻ (≥ 3 : 1, 1.4.11) | 3,2 | 3,6 |
| Chữ đỏ / nền hộp đỏ · viền | 8,1 · 3,9 | 6,3 · 3,3 |
| Chữ vàng / nền hộp vàng · viền | 9,2 · 4,7 | 6,6 · 3,8 |
| Xanh / đỏ "chỉ tô số" trên nền hộp | 8,0 / 6,3 | 5,8 / 5,7 |

Trạng thái không chỉ bằng màu: đỏ luôn có ⚠; vàng và xanh / đỏ kết quả luôn nằm dưới tên cột / nhãn thẻ nói nghĩa (Chưa chốt PA, Vượt, Chưa đạt…).
Không thêm màu ngưỡng cho tỉ lệ (C08 — không xếp hạng GV).

**Vì sao không tô màu mọi cột (Đúng hạn xanh, Muộn vàng, Chưa làm đỏ):** bảng GV 8 dòng × 6 cột sẽ thành lưới đèn giao thông, ô cần làm không nổi hơn
ô bình thường. Màu chỉ dành cho ô có người phải làm — nhìn bảng là thấy ngay chỗ đỏ.

## 2. Cân hàng cột từng tab (1440)

| Tab | Trước (web / V2) | v19 |
|---|---|---|
| Chung | Hàng cao theo nội dung (44 hoặc 2 dòng), tiêu đề cột xuống dòng lệch | Hàng 52 (bảng có tên 2 dòng) / 48 (bảng gọn); tiêu đề nhóm 32 có nền riêng + đơn vị mờ ("Chấm Test · bài"), tiêu đề cột 44 căn giữa trên số; vạch dọc 1 px giữa nhóm; hàng tổng / chân bảng nền `surface-2`, kẻ đậm trên |
| Giáo viên | Cột tên ~28 %; % dưới Đúng hạn, "+ 108 S chéo chung" dưới Chưa làm ở **mọi dòng** → dòng cao thấp lệch | Tên 20 % (tên + môn hai dòng, mọi dòng như nhau) · 8 cột số 8,2 % đều nhau (mỗi nhóm Đúng hạn · Làm muộn · Chưa làm · **% đúng hạn** cột riêng nền nhạt) · Đạt kỳ vọng Test 14,4 % (hộp % + phân số mờ cùng dòng) · chân bảng: **Chưa phân công** và **S chéo chung** mỗi hàng một số ở cột Chưa làm |
| Chi nhánh | Ô tỉ lệ: % trên, phân số dưới | Hộp % + phân số mờ một dòng; Lớp 22 %, 4 cột số bằng nhau; Tiến bộ theo kỹ năng: hộp số + % mờ |
| Thi thật | Vượt · Đạt · Chưa đạt: số trên, % dưới | Hộp số em + % mờ một dòng; Từng kỹ năng và Theo GV cùng cao hàng 48; Danh sách: L R W S OVR Target 6,5 % mỗi cột (như V2-9), điểm chữ thường có màu |
| SOS | Kết quả · Dưới kỳ vọng · Xử lý (V2-5); "HV - Case" một ô hai số "12 - 14"; ô SOS tô màu chip | Tuần 13 % · Kết quả 5 cột (5,6–6,4 %) · Dưới kỳ vọng 5 × 5,2 % · Xử lý 4 cột: **HV có Case · Case** tách hai cột (hai cột domain có sẵn `hvCoCase`, `case` — bỏ cột gộp) · Chưa chốt PA · Đang xử lý; ô SOS 1 · 2 · 3 hộp trung tính, chip ở tiêu đề cột; hàng tuần 52 · lớp con 46 · tổng 52 |
| Ý thức | Hai bảng cạnh nhau, 7 cột HV cần chú ý chật | Hai bảng **chồng nhau** hết bề rộng; HV cần chú ý: Học viên 20 · Lớp 12 · Vi phạm 9 · Chưa xử lý 9 · **Bậc (hiện tại › kế) 26** · Lần xử lý gần nhất phần còn lại; Lớp nhiều vi phạm: 6 cột, số 9–12 % |
| PA nào hiệu quả | Hai bảng cạnh nhau | Giữ; số thành hộp, "Có cải thiện" hộp + % mờ |

375: Giáo viên, SOS, Ý thức, Chi nhánh = thẻ (không cuộn ngang); mỗi nhóm 3 (SOS: 5) ô một hàng, nhãn trên hộp; hộp 36 cao, vùng bấm 44 (`VUNG_BAM_SO` có sẵn).
Tìm GV và Xuất Excel chung một hàng.

## 3. Panel mở từ số (khung 2a–2d, 7b)

- Bấm một ô của nhóm Chấm Test / Việc → panel mở **đúng tab** của cột vừa bấm (Chưa làm · Làm muộn · Đúng hạn, mỗi tab có số; Chưa làm số đỏ).
  Ba tab cùng một lần tải: đường cũ `/phan-tich/giao-vien/o?…&cot=cham-diem|viec-dung-han` đã trả mọi bài của người đó — web chỉ chia theo trạng thái.
- Đầu: **"Tên GV · Chấm Test"** (19 / 700) + một dòng ngữ cảnh (chi nhánh · chương trình · mã tuần · môn). Hết dòng "loại" nhỏ trên tiêu đề.
- Thân: đầu cột Học viên · Bài · Hạn · Trễ; nhóm theo lớp (dải nhóm "MB FT 101 · 5 bài"); dòng 50 px: tên em (link hồ sơ) · "MT3 · S" · "hạn 02/11" · "⚠ quá 10 ngày".
  Quá hạn lâu nhất trước (như luật `NganDanhSach` đang có: quá hạn lên đầu). Tab Làm muộn: "muộn n ngày" vàng; Đúng hạn: "✓ chấm 04/11" xanh.
- Chân: tổng + "Hồ sơ GV ›" (đổi trang). Esc / ✕ đóng, focus về ô nguồn.
- Đang tải: tiêu đề + số tab đã đúng (lấy từ ô vừa bấm), thân là khung xám theo cột. Rỗng: "Không còn bài nào chưa làm" + vì sao + **Tải lại số**.
  Lỗi: hộp đỏ nói lý do + **Thử lại**, panel không đóng, số trên bảng giữ.
- 375: panel phủ cả màn, tab chia đều, dòng hai tầng (tên + trễ / bài + hạn).
- Panel khác mở từ số ở Phân tích (Chi nhánh "Đạt MT", Thi thật, SOS bảng có điểm, Ý thức) giữ bố cục V2 / `BangLuotPanel`, chỉ đổi đầu panel theo cùng mẫu
  (tên đối tượng · chỉ số to, ngữ cảnh một dòng) — không vẽ lại từng cái ở đây.

## 4. Thao tác TRƯỚC → SAU

| Chỗ | Trước | Sau (v19) | Lý do |
|---|---|---|---|
| Mọi ô số bấm được | Chữ màu nhấn, 500, không viền (gần giống số thường trên nền tối) | Hộp nhỏ, cùng một lần bấm → panel | chủ SP: số chìm, "để trong một cái box nhỏ" |
| Số 0 | Mờ, không bấm | Giữ | — |
| Chưa làm | Chữ đỏ | Hộp đỏ + ⚠ | quá hạn luôn kèm ⚠ (luật màu) |
| Chưa chốt PA, Thiếu điểm, Chưa xử lý, Chưa có KQ | Chữ màu nhấn | Hộp vàng | "đang chờ" phải nổi, khác quá hạn |
| GV · % đúng hạn | Chữ nhỏ dưới ô Đúng hạn | Cột riêng cuối nhóm | hàng đều, đọc dọc so được |
| GV · "+ 108 S chéo chung" | Dưới ô Chưa làm ở **mọi** dòng, bấm 108 → danh sách | Một hàng chân "S chéo chung", bấm 108 → **cùng** danh sách [XM-1] | một số lặp 8 lần = nhiễu |
| GV · Chưa phân công | Ô gộp 3 cột "6 bài chưa có GV" | Hàng chân, số ở cột Chưa làm, dòng phụ "bài chưa có GV" | thẳng cột với S chéo chung |
| Panel từ ô GV | Một danh sách mọi bài của người đó (bấm Chưa làm vẫn ra cả bài đúng hạn) | Ba tab, mở đúng tab của cột đã bấm | "panel cần rõ ràng" |
| Panel · ô nguồn | Không đánh dấu | Viền nhấn 2 px khi panel mở | biết panel nói về ô nào |
| SOS · ô SOS 1 · 2 · 3 | Chip màu SOS trong từng ô | Hộp trung tính; chip ở tiêu đề cột và thẻ chỉ số [XM-7] | chip SOS 1 viền vàng trùng hộp vàng "đang chờ" (critique P1); bảng bớt 3 họ màu |
| SOS · HV - Case | Một ô "12 - 14", hai số bấm riêng | Hai cột HV có Case · Case, mỗi ô một số bấm (cùng hai panel cũ) | "3 3" khó đọc (critique P2) |
| Ý thức · Bậc hiện tại, Bậc kế | Hai cột | Một cột "Bậc · hiện tại › kế" [XM-4] | cột Lần xử lý gần nhất khỏi xuống dòng |
| Ý thức · hai bảng | Cạnh nhau | Chồng nhau | 7 cột không đủ chỗ ở nửa bề rộng |
| Xuất Excel, In, ⋯, Theo tuần ▾, Mọi lớp ▾, Tìm GV, Toàn bộ / Chọn khoảng tuần, tuần → tuần, FT / Lớp thường, Mock Test / Thi thật, Thi thật theo GV ›, Hồ sơ GV ›, ⓘ, ▸ mở dòng, chuyển trang, "Xem 3 GV còn lại" | — | **Giữ nguyên chỗ, nguyên chữ** | — |

Không mất thao tác nào.

**Khung trang và chữ = web thật (PTA rà #1481):** thanh trên "PISA TRACKING" · Tổng quan · Học viên & Lớp · Test · Công việc · Phân tích, góc phải chuông · ? · avatar;
375 thanh dưới Tổng quan · Học viên · Test · Công việc · Thêm (Phân tích trong Thêm). Mọi nhãn thẻ / cột / tiêu đề lấy đúng chữ web
(`PhanTichGiaoVien`, `BaoCao`, `TongHopTestSos`, `KetQuaThi`, `YThucPhoiHop`): bỏ nhóm "Học trò" (cột "Đạt kỳ vọng Test · lượt" như web), "Tiến bộ · lượt",
"Thi thật", "Kết quả" (không "· lượt"), "Chưa chốt PA · hôm nay" + "⚠ n quá hạn", "gồm SOS tạm", "Lớp / nhóm vi phạm", "Kết quả thi thật · trong kỳ" (hai ô công tắc
"✓ đang xem / Xem" + thanh Vượt · Đạt · Chưa đạt), Từng kỹ năng có HV + Điểm TB, Theo GV có Kỹ năng · HV · Điểm TB · KN dưới Target. Thi thật không có đoạn
Mock Test | Thi thật (web V2 bỏ). Chữ còn khác web chỉ là các dòng có lý do trong bảng trên và [XM]. Mockup không vẽ lại Lớp thường, Tất cả chi nhánh (QT) — dùng cùng luật ô số và cùng độ rộng nhóm (V2 A2, A3, B2, B4, C3, D2 giữ bố cục).

## 5. Turso

Không đổi đường, không thêm request khi mở trang: v19 chỉ đổi cách vẽ dữ liệu đã có.
- % đúng hạn: tính ở web từ ba số đã có (như dải thẻ).
- Hàng S chéo chung: `sChung` đã có trong mỗi dòng (cùng một số) — lấy một lần; panel dùng đúng nguồn của ô "+ 108" cũ.
- Panel 3 tab: một GET như cũ, chia ở web. Chưa / muộn / đúng hạn của từng bài: dòng trả về đã có trạng thái (cột "Trễ"). **Cần PR code kiểm lại** —
  nếu dòng chưa mang trạng thái đúng hạn / muộn thì thêm trường vào phản hồi (cùng câu, không thêm câu).
- Chưa xử lý đỏ khi có quá hạn (Ý thức): số quá hạn từng dòng **chưa chắc có sẵn** trong `/phan-tich/y-thuc` → nếu thiếu, thêm một cột đếm trong cùng câu gom (không thêm câu). Không có thì để vàng.

## 6. [XM] — chờ PTA Plan / chủ SP

1. **[XM-1] S chéo chung thành một hàng chân bảng** thay "+ 108" ở mọi dòng. Mất: nhìn dòng GV không còn thấy "người này cũng thấy 108 bài S". Đề xuất giữ hàng chân;
   nếu chủ SP muốn biết GV nào có S thì môn đã ghi ở dòng phụ tên.
2. **[XM-2] Dải thẻ "Chưa làm"** không cộng S chéo chung (như hiện nay), ghi "+ 108 bài S chéo chung" ở dòng phụ. Giữ.
3. **[XM-3] Vàng cho "đang chờ"** là màu mới trên bảng Phân tích (trước chỉ đỏ quá hạn). Dùng token `--soon` có sẵn, nghĩa "sắp hạn · cần chú ý" — đúng nghĩa.
4. **[XM-4] Ý thức gộp Bậc hiện tại + Bậc kế** thành một cột "hiện tại › kế". Chữ không đổi, chỉ gộp chỗ.
5. **[XM-5] Thẻ chỉ số: số lớn cũng vào hộp** (thẻ trước là số trơn 28 / 700 có gạch chân khi bấm được). Thẻ có số không bấm được (Chấm Test đúng hạn %, Tổng thể) giữ số trơn —
   nhìn ra ngay số nào mở được danh sách. Ngoại lệ cỡ 48 / 40 của Chi nhánh (XM-10, XM-14 V2) giữ, hộp ôm số.
6. **[XM-6] Luật G6 trong DESIGN.md** đổi chữ: "số bấm được trong bảng / thẻ Phân tích = hộp nhỏ; số trong câu ở dòng phụ chữ nhỏ giữ gạch chân (WCAG 1.4.1)".
   Planning cập nhật DESIGN.md sau khi chủ SP duyệt; nếu duyệt, nên áp cả Tổng quan / hồ sơ lớp (cùng `OSo`) — PR riêng, vào Việc để sau.

7. **[XM-7] Ô SOS 1 · 2 · 3 trong bảng SOS thành hộp trung tính**, chip màu chuyển lên tiêu đề cột (thẻ chỉ số giữ chip). Lệch khung V2 đã duyệt (ô tô màu chip):
   lý do là chip SOS 1 (viền vàng) trùng hộp vàng "đang chờ", và bảng 95 hộp 4 họ màu lại "chìm" như cũ. Đề xuất đổi; muốn giữ chip trong ô thì phải đổi màu "đang chờ".
8. **[XM-8] Thẻ "Chưa làm" (dải đầu tab Giáo viên) không bấm được** như web hiện nay — giữ số trơn đỏ ⚠. Muốn bấm ra danh sách mọi bài quá hạn thì cần đường mới (chỉ đọc khi bấm).

## 7. Tự rà đề bài (mục 1–2, phần MOCKUP-PT)

| # | Ý chủ SP / PTA | Chỗ trong mockup | Đạt? |
|---|---|---|---|
| 1 | "các con số ở đây đang bị chìm… các con số khá giống nhau" | Khung 0 (bảng mẫu), 1a: số bấm được trong hộp nền thẫm viền rõ, 0 / "—" mờ, tỉ lệ chữ thường → ba lớp nhìn khác nhau | Đạt |
| 2 | "có thể nên để ở trong một cái box nhỏ? hoặc… color code" | Chọn **một** cách: hộp (bấm được) + màu theo nghĩa chỉ cho ô cần làm (đỏ ⚠ / vàng); mục 1 | Đạt |
| 3 | Số bấm được nhìn ra là bấm được (G6), không gạch chân | Hộp = nút; gạch chân chỉ khi rê / focus (khung 0 "Rê chuột · focus") | Đạt |
| 4 | Quá hạn / chưa làm nổi | Chưa làm, Chưa phân công, S chéo chung: hộp đỏ ⚠ (1a, 1b, 7a); đang chờ vàng (SOS 5a, Ý thức 6a, Thi thật 4a) | Đạt |
| 5 | "rà lại các panels khác… giao diện có dễ nhìn hay không" | Panel GV làm lại (2a–2d, 7b); panel khác giữ mẫu V2, đổi đầu panel theo cùng mẫu (mục 3) | Đạt (panel GV vẽ đủ; panel khác ghi luật) |
| 6 | "Các cột, hàng ở TẤT CẢ CÁC TRANG PHÂN TÍCH… cân đối" | Chi nhánh 3a · Thi thật 4a · SOS 5a (+ PA) · Giáo viên 1a · Ý thức 6a — mục 2 | Đạt |
| 7 | Dòng phụ "+ 108 S chéo chung" | Thành hàng chân (XM-1) | Đạt |
| 8 | 375 không cuộn ngang khó chịu | 7a GV, 7c SOS, 7d Ý thức = thẻ; Chi nhánh 375 giữ thẻ V2 A6 với hộp mới | Đạt |
| 9 | Panel mở từ số: rõ, đủ trạng thái | 2a có dữ liệu · 2b đang tải · 2c rỗng · 2d lỗi · 7b 375 | Đạt |
| 10 | Giữ mọi thao tác | Bảng mục 4 | Đạt |
| 11 | Tối + sáng | 0a/0b, 1a/1b, 7a/7e; nút đổi nền cho mọi khung | Đạt |
| 12 | Turso không tăng đọc khi mở trang | Mục 5 | Đạt (2 điểm PR code kiểm) |

## 8. Ghi cho PR code

- Một chỗ: `LOP_OSO` (`web/src/ui/SoLieu.tsx`) + luật `.so-bam` trong `index.css` → thêm lớp hộp (`.so-hop`) dùng cho ô bảng / thẻ Phân tích; `mauOSo` ánh xạ
  `text-bad|text-late` → biến thể đỏ (+ ⚠), lớp mới `text-cho` → vàng, `text-kq-vuot|kq-duoi` → chỉ chữ. Token mới `--os-*` (cả khối sáng) đặt cạnh token màu nghĩa,
  thêm vào phép kiểm `nenGiaoDien.tests.ts`.
- Số giữa câu ở dòng phụ chữ nhỏ (`.text-xs`) giữ dáng cũ (gạch chân) — WCAG 1.4.1.
- Ô nguồn khi panel mở: `aria-expanded="true"` trên nút, CSS theo thuộc tính (không state mới).
- Panel 3 tab: tab mặc định = cột đã bấm (`cot` sẵn trong `tieuDe` / tham số), cùng `nguon`; Esc / ✕ trả focus về nút nguồn.
- Lệnh impeccable cho session code: `/ponytail lite` · `layout` + `harden` + `adapt` trong phạm vi, `audit` + `web-design-guidelines` trước PR.

## 9. Cổng chất lượng

- Ảnh tự soát hai lượt (Playwright + Chrome, 1440 + 375): lượt 1 sửa phân trang vỡ, Ý thức chật, tiêu đề cột xuống dòng lệch, Xuất Excel 375 một mình một hàng.
- Tương phản đo bằng công thức WCAG (mục 1).
- Rà UX bảng (`ui-ux-pro-max`): bảng rộng ở 375 → thẻ (đạt); trạng thái không chỉ bằng màu (đỏ có ⚠, vàng / xanh / đỏ luôn dưới tên cột nói nghĩa).
- **Critique** (impeccable, agent riêng đọc mã + 19 ảnh): vòng 1 **28/40** (P1: panel trạng thái đứng riêng mất token; chip SOS 1 trùng hộp vàng) →
  sửa hết P1 / P2 → vòng 2 **30/40**, không P0 / P1 → sửa P2 / P3 → vòng 3 **31/40**, không còn P0 / P1 / P2. Dừng theo cổng (chạm 30, đã chạy 2 vòng thêm).
  P3 còn lại (không sửa): 7d cột "Bậc" lệch vài px giữa các thẻ; 4a khoảng trống dưới "Từng kỹ năng" cạnh "Theo GV" cao hơn.
