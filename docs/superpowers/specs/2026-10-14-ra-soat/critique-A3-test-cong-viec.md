> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# Critique A3 — Test + Công việc (Assessment A, độc lập) — mã CA3

Môi trường N=11 (http://127.0.0.1:5521, ngày demo 14/09/2026 = W3 SEP), bản build main. Mode **Operate**. Không đọc `ket-qua/`, `.impeccable/`, không chạy detector.
Ảnh: `$SP/anh/critique-A3/` (ghi tắt `anh/`).
Đã ghi thật vào DB riêng a11: L=25 Kiều Thu Trang (MB FT 102), "Vắng" R Kiều Thu Trang, S=15 Hồ Thu Trang (MB BE 03).

## Đã đi
| Trang | Vai | Thao tác |
|---|---|---|
| /test/lich (3 khối, dòng lớp, lưới mở dưới dòng) | QL, GVBM, GVW, GVCN, ADMIN | 1440 tối + 375 sáng; mở khối 1 (GVW, GVCN) |
| Hộp nhập điểm MT (Lịch Test khối 2) | QL; GVW 375 | mở L / W1 / S; gõ số, gõ chữ sai, ngoài khoảng; Enter = Lưu · em tiếp (cả em cuối); Esc khi đã gõ; bấm ra ngoài; Tab 4 tiêu chí; ô Vắng; ô Đã huỷ phần thi; nút Vắng (ghi thật); tấm trượt 375 |
| /test/diem-lop?lop=3 (FT 101) · ?lop=17 (BE 03) | QL, GVBM | 1440 tối + 375 sáng |
| /test/ke-hoach FT (lưới Ô MT, hộp một đợt, ⋯ đợt, ⋯ kỹ năng, Huỷ MT1 — không xác nhận, ô "chưa xếp", Xếp nhiều MT…) · lớp thường (BE 03, hộp một đợt) | QL | 1440 tối + 375 sáng (danh sách) |
| /mock-test/177 (hồ sơ một lượt) | QL | 1440 tối + 375 sáng, đo nút 375 |
| /cong-viec Hỗ trợ học viên (danh sách trái + panel phải) | QL, GVCN, GVBM, ADMIN | 1440 tối; QL + GVCN 375 sáng; mở gom Nhập điểm; panel Xác nhận nguyên nhân gom (bấm xác nhận rỗng → lỗi, "Không cần theo dõi…"); panel Nhập điểm lớp thường (25/20 lỗi, 15 lưu, "-" ô đã có điểm); panel Bàn giao (bấm "Xong" khi 0/5) |
| /cong-viec/cho-duyet · /van-hanh · /bao-cao | QL | 1440 tối |

## 1. Design-specificity verdict
**Có — vùng này ra dáng "Bàn làm việc của giáo viên".** Mã tuần `W2 SEP` ở mọi nơi, chip `L R W S · W3 SEP`, "W của bạn: còn 1 bài · W, S: GV khác", hộp điểm neo ngay ô với kỳ vọng MT và band xem trước, Chờ duyệt có dòng "Nếu duyệt: …" — sản phẩm khác không dùng nguyên được. Bố cục, phông, màu nhất quán với DESIGN.md.
Chỗ vỡ là **ngôn ngữ trạng thái của ô điểm**: cùng một bài hiện "W3 SEP" ở Lịch Test, "S · huỷ" ở Kế hoạch Test, "Vắng lần 1" trong hộp, "Đã huỷ phần thi · Đã dời do vắng 1 lần" ở hồ sơ MT; "-", "—", "–" ba nghĩa. Bàn làm việc gọn nhưng "sổ điểm" nói nhiều giọng.

## 2. Nielsen (cả vùng)
| # | Heuristic | Điểm | Lý do một dòng |
|---|---|---|---|
| 1 | Trạng thái hệ thống | 2 | "Chưa lưu:" và "1 ô chưa lưu" tốt; nhưng "✓" đã lưu 11 px tự tắt 3 s, hộp em kế che ô vừa lưu, toast "Đã ghi vắng" khi thật ra là Không dự thi, ô huỷ hiện thành mã tuần. |
| 2 | Khớp thế giới thật | 3 | Mã tuần, MT, SOS, Case đúng nghề; lệch ở "Chờ 4 kỹ năng" / "391 trống" cho lượt tháng 12 chưa thi. |
| 3 | Kiểm soát & tự do | 3 | Esc, bấm ra ngoài giữ chữ, Bỏ vắng, Khôi phục; nút Vắng một chạm đi luôn em kế, đường lui phải mở lại đúng ô cũ. |
| 4 | Nhất quán | 2 | Ba gạch; Vắng / Báo vắng / "-" / Không dự thi; "L" vs "Listening"; "Xong" = đóng panel; Nhận xét lưu bằng nút ở hộp, tự lưu ở hồ sơ MT; 1440 ≠ 375 trong khối 2. |
| 5 | Phòng lỗi | 3 | Kiểm số câu 0–40, đúng ≤ tổng, chữ sai trước khi gửi; hộp Huỷ MT1 nêu hậu quả; nút Vắng (lần 2 = huỷ phần thi) không hỏi. |
| 6 | Nhận ra hơn nhớ | 3 | Nhãn đủ; nhưng "Không xếp được" không lý do trên màn, "↗", "ⓘ", "KV", "cũ" phải đoán / rê chuột. |
| 7 | Linh hoạt & hiệu quả | 3 | Enter = Lưu · em tiếp cùng cột, Tab 4 tiêu chí, Điền cả cột, gom Xác nhận, Nhắc tất cả, Xếp nhiều MT; "em tiếp" không nhảy ô trống. |
| 8 | Tối giản | 2 | Công việc: chip "Quá hạn" + "⚠ quá hạn 68 ngày" + "Nhắc" mỗi dòng; 5 nút chính trong một thẻ hồ sơ MT; câu giải thích dưới ô. |
| 9 | Nhận biết & sửa lỗi | 3 | Lỗi nói rõ, giữ chữ, "3 ô cần sửa ↑", "Lưu lại"; lỗi trong panel bị cắt "Số câu đúng (25…"; xác nhận đóng là hộp trình duyệt. |
| 10 | Trợ giúp | 2 | Lý do nằm ở `title` (không có trên điện thoại); luật Vắng vs Không dự thi không hiện tại chỗ quyết định. |
| | **Tổng** | **26/40** | **Acceptable** (cận Good) |

## 3. Cognitive load
Checklist: Single focus ½ (GV mở Lịch Test bị dải số cả lớp kéo chú ý) · Chunking ✓ · Grouping ✓ · **Visual hierarchy ✗** (5 nút "Nhập điểm" chính chồng ở khối 1; 5 nút chính trong thẻ Lịch Test hồ sơ MT) · One thing at a time ✓ · **Minimal choices ✗** · **Working memory ✗** (bấm Vắng xong mới biết là Không dự thi; lý do "Không xếp được" phải rê chuột) · Progressive disclosure ✓ → **3½ hỏng = mức vừa, sát cao**.
Điểm quyết định > 4 lựa chọn:
- Công việc (QL): Của tôi / Của GV + Tất cả / Quá hạn / Hôm nay / Tuần này + Lọc thêm + Nhắc tất cả = 8 nút trước khi thấy việc.
- Hộp một đợt: Tuần chung ‹ › + 4 ô tích + 5 nút ⋯ (đợt + 4 kỹ năng) + Đóng / Lưu; menu ⋯ kỹ năng 5 mục.
- Thẻ Chờ duyệt tự gửi: Sửa… · Rút · Duyệt · Từ chối… · Mở (5).
- Xếp lịch MT: MT mới + MT1…MT5 (6) ngay bước 1.

## 4. Emotional journey
- **Đỉnh tốt:** gõ 25 → Enter → hộp đã ở em kế, Kết quả đổi "Chờ 3 kỹ năng"; Công việc: lưu xong dòng thành "Xong" gạch mờ, số Tất cả giảm ngay; Huỷ MT1 nói "Khôi phục được" — yên tâm.
- **Thung lũng (lo):** (1) GVCN tối Chủ nhật mở Lịch Test: "Quá hạn chấm 49" cam đỏ, "Còn phải chấm 29" — dù mọi dòng của mình "✓ xong" (`anh/lt-gvcn-1440.png`). (2) Bấm "Vắng" → toast "Đã ghi vắng R" → ô thành "-" "Không dự thi" — GV nghĩ em được dời lịch, thật ra không (`anh/vang-ft-sau.png`). (3) Mở ô "Đã huỷ phần thi" thấy "Vắng lần 1" + Bỏ vắng — không biết bấm có mất gì (`anh/hop-L-huy.png`). (4) Đóng hộp đã gõ → hộp trình duyệt "Bỏ các giá trị đã gõ?" không nói của em nào.
- **Kết:** dòng lớp "✓ W của bạn xong" là cái kết tốt — nhưng dải số trên đầu vẫn đỏ, nên cảm giác cuối là "vẫn còn nợ".

## 5. Điểm mạnh
1. **Hộp nhập điểm MT cho bàn phím**: con trỏ đứng sẵn ở ô, Tab TA→CC→LR→GRA→Nhận xét, Enter = "Lưu · em tiếp ›" cùng cột, Esc đóng, bấm ra ngoài khi đã gõ giữ hộp; lỗi "Chưa lưu: …" giữ chữ; 375 là tấm trượt đáy, ô 44 px, nút ở vùng ngón cái (`anh/hop-L-go25.png`, `anh/hop-375-gvw-go.png`).
2. **Công việc làm tại chỗ**: danh sách trái + panel phải, dòng xong giữ chỗ (mờ + gạch), số đếm cập nhật; Xác nhận nguyên nhân gom lớp × kỹ năng × lượt, lỗi ngay tại ô + "3 ô cần sửa ↑", "Xác nhận · việc tiếp ›" (`anh/cv-xnnn-loi.png`, `anh/cv-nhapS-sau.png`).
3. **Xác nhận có hậu quả nêu đúng đối tượng**: "Huỷ MT1? Chu Minh Hiếu · MT1 · 5 điểm đã nhập (L 5.5 · …) ẩn đi · Khôi phục được" (`anh/huy-mt1.png`); Chờ duyệt mỗi thẻ có "Nếu duyệt: …".

## 6. Vấn đề ưu tiên

### CA3-1 · P1 · Nút "Vắng" ghi thành "Không dự thi" nhưng nút + thông báo vẫn nói "vắng"
- Trang · vai: Lịch Test khối 2 (hộp nhập điểm MT, ô thi tuần trước) · QL, GV.
- Thấy: R Kiều Thu Trang (MT1 · W2 SEP, đang W3 SEP) → bấm "Vắng" → toast "Đã ghi vắng R · Kiều Thu Trang", ô thành "-" + "Không dự thi · …"; hồ sơ MT ghi "Không dự thi · Tuần W2 SEP". Không dời lịch.
- Vì sao: H1, H2, H4 — đúng luật (nhập bù sau tuần thi = Không dự thi, plan.md mục 3 dòng 11/10) nhưng chữ nói ngược hậu quả; GV tưởng em được dời. Đầu ra "em có lịch" bị hiểu sai.
- Đề xuất: hộp đọc trạng thái ô — sau tuần thi / MT cũ: nút **"Không dự thi"**, toast "Đã ghi Không dự thi · R · Kiều Thu Trang"; trong tuần thi giữ "Vắng", toast thêm hậu quả "… · dời W4 SEP" / "… · huỷ phần thi" (lần 2).
- Loại: đổi chữ (không mockup).
- Mã: `web/src/modules/fasttrack/HopNhapDiem.tsx:351` (nút Vắng) · `web/src/modules/cham/thongBaoVang.ts:13` (chú thích "FT không dời" đã cũ).
- Ảnh: `anh/vang-ft-ngay.png`, `anh/vang-ft-sau.png`.

### CA3-2 · P1 · Ô điểm nhiều trạng thái không đọc được khi bỏ màu
- Trang · vai: Lịch Test, Điểm theo lớp, Kế hoạch Test · mọi vai.
- Thấy: "-" (Không dự thi / dấu chưa chốt), "—" (không có lịch, không phải phần mình, chỉ đọc), "–" (W tổng chưa đủ) đứng cạnh nhau; ô Không dự thi chỉ là nút "-" + chữ phụ cắt "Không dự thi · …"; ô vắng chỉ đọc ghi "vắng" thường, ô bấm được ghi "Vắng"; Ô MT ở Kế hoạch Test: "xong" (nền xanh lá) và "có lịch" (viền xanh) chỉ khác màu, trong khi lớp thường ghi chữ "Xong … ✓".
- Vì sao: H4, H1; DESIGN.md "chip … chữ luôn có nghĩa khi bỏ màu"; CLAUDE.md "trạng thái không chỉ phân biệt bằng màu".
- Đề xuất: ô đã chốt hiện **chữ** như ô Vắng hai dòng đã có — "Không" / "dự thi"; "Vắng" / "→ W3 OCT"; "Đã huỷ". Chỉ dùng **một** ký tự "—" cho "không có gì để nhập". Chip Ô MT FT xong thêm "✓" (như lớp thường `W2 SEP ✓`). Viết hoa thống nhất "Vắng".
- Loại: sửa lỗi hiển thị (không mockup — dùng mẫu ô Vắng hai dòng sẵn có).
- Mã: `HopNhapDiem.tsx:61` (`coDau → '-'`), `:76` (`DongDau` cắt `max-w-[6rem]`), `:107` ("vắng") · `shared/domain/oMt.ts` (chip).
- Ảnh: `anh/vang-ft-sau.png`, `anh/dl-ql-ft101-1440.png`, `anh/lt-gvw-1440.png`, `anh/kh-ft102-mo.png` so với `anh/kh-thuong-be03.png`.

### CA3-3 · P1 · Ô đã huỷ: mỗi nơi một trạng thái, hộp còn ghi "Vắng lần 1"
- Trang · vai: Lịch Test khối 2, Kế hoạch Test, /mock-test/177 · QL, GV.
- Thấy: S Kiều Thu Trang (huỷ phần thi, W3 SEP) — Lịch Test hiện chữ "W3 SEP" như còn lịch; Kế hoạch Test "S · huỷ W3 SEP"; hồ sơ MT "Đã huỷ phần thi" + "Đã dời do vắng 1 lần" + "(dời từ W2 SEP · vắng lần 1)" trong khi Lịch sử ghi "Huỷ do vắng 2 lần". Ô "Đã huỷ phần thi" của Lý Thanh Tâm mở hộp: "Vắng lần 1 · Ghi … bởi Trần Ngọc Hà" + "Bỏ vắng" — không có chữ "huỷ".
- Vì sao: H1, H4; CLAUDE.md "cùng một số liệu ở nhiều nơi phải cùng nguồn". QL không biết có nên Khôi phục.
- Đề xuất: (a) Lịch Test không đổi ô huỷ thành mã tuần — ô huỷ luôn hiện "Đã huỷ"; (b) hộp ô huỷ: dòng đầu "**Đã huỷ phần thi** · vắng 2 lần", nút giữ "Bỏ vắng"; (c) hồ sơ MT: một dòng trạng thái, bỏ "Đã dời do vắng 1 lần" khi đã huỷ. (Số "lần 1" có thể do dữ liệu demo — planning kiểm thêm.)
- Loại: sửa lỗi hiển thị (không mockup).
- Mã: `web/src/modules/cham/LuoiFT.tsx:53-54` (`khacTuanFt` không loại `progress === 'cancelled'`) · `HopNhapDiem.tsx:252` (`Vắng lần {Math.max(1, lan)}`, không nhánh huỷ).
- Ảnh: `anh/vang-ft-sau.png` (S "W3 SEP"), `anh/kh-hop-dot.png`, `anh/mt177-1440.png`, `anh/hop-L-huy.png`.

### CA3-4 · P1 · Số đầu Lịch Test của GV tính cả phần GV khác; khối 1 không tách "phần của bạn"
- Trang · vai: Lịch Test · GVCN (7), GVW (10), GVBM (9).
- Thấy: GVCN — dòng lớp "✓ L, R của bạn xong", "✓ L của bạn xong" nhưng badge "Test chấm tuần này 4", "Còn phải chấm 29", "Quá hạn chấm 49" (cam đỏ). GVBM: "S của bạn: còn 1 bài" nhưng badge 4. Khối 1: mọi dòng chip "Chờ bạn chấm" + "10 bài / 19 bài" của cả lớp (L, R, W1, W2, S), không có cột "phần của bạn / GV khác" như khối 2.
- Vì sao: H1, H4, cảm xúc — CLAUDE.md "việc đã xong không được nơi nào còn báo chờ / quá hạn"; plan.md mục 3 (11/10) "nhãn và số đếm cùng một cách tính".
- Đề xuất: với vai GV, dải số + badge khối đếm **phần của bạn** (cùng hàm `phan` của khối 2); muốn xem lớp thì ghi rõ "Lớp: còn 29". Khối 1 dùng lại ô "W của bạn: còn n · GV khác" của khối 2 thay chip "Chờ bạn chấm".
- Loại: số + chữ (không mockup) cho dải số; khối 1 đổi cột → **cần mockup** (nhẹ, chép mẫu khối 2).
- Mã: `web/src/modules/test/lichTest/DaiSo.tsx:15-21` · `lichTest/KhoiNo.tsx:37` · `server/src/cham/canCham.ts` (`noQuaHan`, `hangLopTuan`).
- Ảnh: `anh/lt-gvcn-1440.png`, `anh/k1-GVW-1440.png`, `anh/lt-gvbm-1440.png`.

### CA3-5 · P1 · "Không dự thi" vẫn báo "Chờ nhập điểm" ở hồ sơ MT, mất hẳn ở Kế hoạch Test
- Trang · vai: /mock-test/177, Kế hoạch Test · QL.
- Thấy: hồ sơ MT, Reading: "▶ Chờ nhập điểm" + "Không dự thi · Tuần W2 SEP"; Lịch Test đã tính bài này là "đã chấm" (31→33/65). Kế hoạch Test: chip MT1 chỉ còn "L W2 SEP" (R biến mất), hộp một đợt dòng R chỉ "W2 SEP".
- Vì sao: H1, H4; "việc đã xong không được nơi nào còn báo chờ".
- Đề xuất: một nhãn "Không dự thi" ở cả ba nơi: hồ sơ MT thay "Chờ nhập điểm" bằng chip "Không dự thi"; chip Ô MT ghi "R · không dự thi"; hộp một đợt dòng R ghi "W2 SEP · Không dự thi".
- Loại: đổi chữ (không mockup).
- Mã: `web/src/modules/fasttrack/MockDetailPage.tsx` (trạng thái kỹ năng) · `shared/domain/oMt.ts` (chip; cờ `khongDuThi` đã có trong `/ke-hoach-test/ft/:id`).
- Ảnh: `anh/mt177-1440.png`, `anh/kh-ft102-mo.png`, `anh/kh-hop-dot.png`.

### CA3-6 · P2 · "Đang lưu: 16/25" nghĩa là giá trị đã lưu
- Trang · vai: ô lớp thường đã có điểm (Công việc panel, Lịch Test, Điểm theo lớp) · GVBM.
- Thấy: hộp "Sửa Pronunciation · Lâm Gia Bảo CT — Đang lưu: 16/25 (64%)". Cùng chữ với trạng thái "Đang lưu…" khi đang gửi.
- Vì sao: H1, H4 — đúng chỗ chủ SP yêu cầu "phân biệt đang lưu / đã lưu".
- Đề xuất: "**Đã lưu: 16/25 (64%)**".
- Loại: đổi chữ. Mã: `web/src/modules/fasttrack/ScoreEntry.tsx:759`. Ảnh: `anh/cv-thuong-gach.png`.

### CA3-7 · P2 · "Đã lưu" quá kín khi nhập liền tay
- Trang · vai: Lịch Test / Điểm theo lớp (hộp MT, Enter = em tiếp) · GV.
- Thấy: sau Enter, dấu duy nhất là "✓" 11 px xám cạnh mã HV ("000066 ✓"), tự tắt sau 3 s; hộp em kế lật lên che ô vừa lưu (ô kế ở nửa dưới màn).
- Vì sao: H1 — GV gõ 20 em liền không chắc em nào đã vào.
- Đề xuất: giữ ✓ (màu `ok`) ở góc ô tới khi lưới tải lại, không tự tắt; khi mở hộp em kế cuộn ô kế lên giữa `main` (`block: 'center'`) để hộp neo dưới, ô vừa lưu vẫn thấy.
- Loại: sửa lỗi hiển thị (không mockup). Mã: `HopNhapDiem.tsx:389` (`scrollIntoView … 'nearest'`) · `LuoiFT.tsx:412`, `:444` (hẹn giờ 3 s).
- Ảnh: `anh/hop-L-saukhiluu.png`.

### CA3-8 · P2 · Xác nhận bỏ chữ đã gõ là hộp trình duyệt, không nêu đối tượng
- Trang · vai: hộp nhập điểm MT, hộp Nhận xét lớp thường · GV.
- Thấy: Esc khi đã gõ → `confirm('Bỏ các giá trị đã gõ?')` của trình duyệt; mọi xác nhận khác (Huỷ MT1) là hộp trong web nêu em + lượt.
- Vì sao: H4, H9; CLAUDE.md "xác nhận … nêu đúng đối tượng bị ảnh hưởng".
- Đề xuất: thay bằng dòng ngay chân hộp đang mở: "Bỏ điểm Listening · Kiều Thu Trang?" + nút **"Bỏ"** / **"Gõ tiếp"** (không mở hộp thứ hai).
- Loại: thêm nút theo mẫu sẵn có (không mockup). Mã: `HopNhapDiem.tsx:227`, `:478`.

### CA3-9 · P2 · Khối 2: 1440 và 375 cho nhập khác nhau
- Trang · vai: Lịch Test khối 2 · GVW, QL.
- Thấy: em thi R/W/S tuần W1 SEP (Lý Thanh Tâm, Ngô Bảo Châu, Võ Minh Triết) — 1440 ghi chữ "W1 SEP" không bấm được; 375 tab R / W2 hiện "Nhập" và mở hộp "Writing Task 2 · MT1 · W1 SEP". Bài W1 SEP thuộc khối 1 (quá hạn) lại nhập được từ khối 2 trên điện thoại; bộ đếm tab "R 5/8" cũng tính các em này.
- Vì sao: H4; Rulebook T15 "một bài chỉ nằm đúng một khối".
- Đề xuất: màn một kỹ năng (375) dùng cùng điều kiện `khacTuanFt` với lưới 1440 (ô tuần khác ghi mã tuần, không đếm vào tab).
- Loại: sửa lỗi hiển thị (không mockup). Mã: `web/src/modules/cham/MotKyNang.tsx` so với `LuoiFT.tsx:132`.
- Ảnh: `anh/lt-ql-375.png`, `anh/hop-375-gvw-go.png`, `anh/lt-ql-1440.png`.

### CA3-10 · P2 · Điểm theo lớp đếm cả lượt chưa tới tuần thi
- Trang · vai: /test/diem-lop?lop=3 · QL (GV cùng màn).
- Thấy: "MB FT 101 · 391 trống"; MT3 có ~20 hàng tuần W1 OCT…W4 DEC, mỗi hàng 5 "—" + "Chờ 4 kỹ năng" như đang chờ chấm.
- Vì sao: H2, H8 — T19 cấm nhập trước tuần thi, nên "trống" không phải việc; số lớn gây hoảng, che 5 hàng thật cần nhập.
- Đề xuất: "trống" chỉ đếm ô đã tới tuần thi; hàng chưa tới tuần: cột Kết quả ghi mã tuần ("W4 DEC") thay "Chờ 4 kỹ năng".
- Loại: đổi chữ / số (không mockup). Mã: `web/src/modules/test/TabDiemLop.tsx` · `server/src/cham/diemTheoLuot.ts` (`lopCuaToi`).
- Ảnh: `anh/dl-ql-ft101-1440.png`, `anh/dl-ql-ft101-375.png`.

### CA3-11 · P2 · Cắt chữ ở 1440 và câu lỗi bị cắt
- Thấy: "MT1, MT2, M…" (khối 2 cột Đợt), "MT2 · W2 A…" (khối 1), công tắc "Lớp thường ·" (Điểm theo lớp cột trái), "▶ C…" (Kết quả lớp thường BE 03), "Trần Ng…", "Cao Khán…" (người giữ việc ở Công việc, trong khi panel phải trống ~820 px), câu lỗi "Số câu đúng (25…" trong panel Nhập điểm.
- Vì sao: DESIGN.md "không cắt chữ" (PR-KHUNG); lỗi bị cắt = H9.
- Đề xuất: cho xuống dòng (bỏ `truncate`) ở cột Đợt, tên người, câu lỗi; công tắc Điểm theo lớp xếp hai dòng hoặc cột trái rộng theo chữ.
- Loại: sửa lỗi hiển thị (không mockup).
- Ảnh: `anh/lt-ql-1440.png`, `anh/k1-GVW-1440.png`, `anh/dl-ql-ft101-1440.png`, `anh/dl-gvbm-be03-1440.png`, `anh/cv-QL-1440.png`, `anh/cv-nhapS-quatong2.png`.

### CA3-12 · P2 · Một khái niệm nhiều tên, một chữ nhiều nghĩa
- Thấy: "Xác nhận nguyên nhân · L" cạnh "· Listening"; vắng có ba lối ba tên — gõ "-", nút "Vắng" (hộp), "Báo vắng" (⋯ kỹ năng); "**Xong**" ở panel Bàn giao chỉ đóng panel (0/5 vẫn "Cần làm") trong khi "Xong" là chip việc đã làm; Nhận xét lưu bằng nút ở hộp nhưng tự lưu khi rời ô ở hồ sơ MT; đơn vị trong cùng danh sách: "3 việc", "2 em", "4 HV", "10 bài"; dòng lớp GVW "W của bạn: còn 1 bài · W, S: GV khác" (W ở cả hai vế vì W1, W2 tách người).
- Vì sao: H4; CLAUDE.md "một khái niệm một tên".
- Đề xuất: tên kỹ năng đầy đủ ở mọi dòng Công việc; "Báo vắng" → "Vắng"; panel Bàn giao "Xong" → "**Đóng**"; dòng lớp ghi "W2 của bạn: còn 1 · W1, S: GV khác"; dòng gom đếm một đơn vị ("em").
- Loại: đổi chữ (không mockup).
- Ảnh: `anh/cv-QL-1440.png`, `anh/cv-gvbm-bangiao.png`, `anh/lt-gvw-1440.png`, `anh/menu-kynang.png`.

## 7. Persona red flags
- **GV bận nhập điểm cuối tuần:** Enter đi em kế **theo hàng**, kể cả em đã có điểm (Mạc Đức Long 27 → phải Enter thêm) — không có "em kế còn trống". Nút "Vắng" một chạm, không hỏi, đi luôn em kế — lỡ tay khi gõ nhanh là Không dự thi; muốn lui phải mở lại đúng ô đó. "✓" đã lưu 11 px tự tắt. Dải số cả lớp làm GV tưởng mình còn nợ 49 bài.
- **QL chi nhánh nhiều lớp:** Công việc "Của GV" 64 nhóm, mỗi lớp lặp 4 dòng (một dòng mỗi GV) + "Nhắc" mỗi dòng + "Quá hạn" hai lần; panel phải trống lúc vào. Xếp lịch MT: "Sẽ xếp 0" nhưng nút "Xếp lịch 1 em · 4 bài"; 4 em "✕ Không xếp được" không ghi lý do trên màn (`anh/kh-xep-nhieu.png`).
- **TVV ít quen web:** không dùng Test / Công việc (đúng OV-2a). Admin vào Công việc thấy "0 nhóm việc · 0 bài cần chấm — Không có việc nào khớp bộ lọc" với bộ lọc mặc định → tưởng mình lọc sai (`anh/cv-ADMIN-1440.png`).
- **Người dùng điện thoại:** tấm trượt nhập điểm tốt. Nút ⋯ "Thao tác khác" ở hồ sơ MT 28×28 px (< 44); hàng tab bị cắt "Kế h…", "Test / Chấm Test"; "Không dự thi · Tuần W2…" cắt ở thẻ Reading; chevron khối 16×16 (hàng vẫn bấm được).

## 8. Minor observations
- Câu giải thích dưới ô (plan.md 1.1): "Task 2 chưa có · Writing = (Task 1 + Task 2 × 2) / 3 khi đủ hai task", "Có số buổi thì web đếm sau mỗi tuần Kết quả", "Áp chung cho 1 em đã chọn; sửa riêng…", "Lưu từng dòng khi rời ô", "⇆ cuộn ngang" (1440 không cuộn), "Xếp: quá hạn trước → hạn gần nhất", "Đánh dấu ô ở thẻ để duyệt nhiều cùng loại."
- Placeholder Nhận xét "Ví dụ: Nghe phần 3 còn chậm…" dùng cho cả Reading, Writing (`web/src/modules/fasttrack/NhanXet.tsx:57`).
- Hồ sơ MT: chip đầu "MT1 · W3 SEP · huỷ S" cạnh ô chọn "MT1 · W2 SEP" (hai tuần); 5 nút chính trong thẻ Lịch Test; khối Nhận xét 4 ô lớn đứng trước Lịch Test.
- Công việc: nền nâu chỉ ở dòng gom quá hạn, dòng đơn quá hạn không — tín hiệu không đều.
- Panel Xác nhận nguyên nhân: bấm "Không cần theo dõi…" mở thêm phần dưới nhưng lỗi đỏ của phần xác nhận vẫn hiện (`anh/cv-xnnn-khongcan.png`); "Mô tả 0/15" đọc như tối đa 15.
- Câu lỗi viết hoa không đều: "Số câu đúng là số nguyên…" vs "số câu đúng từ 0 đến 40."
- "↗" (Mở lưới đầy đủ) và "ⓘ" chỉ có biểu tượng.
- Kế hoạch lớp thường: MB FOU 24 "đã hết khoá" vẫn có nút "Xếp cả lớp theo đề xuất".
- Báo cáo đơn vị: "Nháp · chưa nộp" ngay trên "đã nộp 2/3".
- Huỷ MT1: "Lý do (không bắt buộc)" — đối chiếu T22 (lý do bắt buộc khi huỷ lượt) xem OV-4a đã thay chưa.

## 9. Câu hỏi khiêu khích cho chủ SP
1. Nếu ô điểm luôn hiện **chữ** ("Vắng → W3 OCT", "Không dự thi", "Đã huỷ") thay ký hiệu "-", GV còn phải nhớ "-" nghĩa là gì không?
2. Dải số đầu Lịch Test của GV là "việc của tôi" hay "tiến độ lớp"? Nếu là lớp, sao không ghi "Lớp: còn 29" để GV khỏi tưởng mình nợ?
3. "Lưu · em tiếp" nên dừng ở em kế **còn trống** — GV cuối tuần có bao giờ cần Enter qua em đã có điểm?
