# v27 · Tuyến công việc Ý thức & Phối hợp — ghi chú

Mockup: `tuyen-cong-viec.html` (mục lục T0–T11, nút Gốc / Tối / Sáng). Ảnh: `anh/*.png` (31 khung).
Đặc tả: `docs/superpowers/specs/2026-11-26-tuyen-cong-viec-yt-phoi-hop/thiet-ke.md` (chủ SP duyệt 26/11, #2206). Luật **N72** ①–⑥ (`plan.md` 1.6, #2208; ⑥ thêm 26/11 sau góp ý mockup — đặc tả mục 2 C5 · C6, mục 4.6).
Nền: `../v23/v23.css` + `v24-chep.css` (chép nguyên khuôn A, panel 720, Chờ duyệt của v24 — chủ SP duyệt 24/11). `v27.css` chỉ thêm khối Tuyến, chuỗi chấm, dải theo dõi, bảng em, hồ sơ rút gọn. Không màu / cỡ chữ mới.
Dữ liệu bịa: thứ Hai 14/09/2026, MB FT 101 — GVCN Trần Ngọc Hà · TVV Phan Mai · BPXL Lương Thu Trang · CX Vũ Thanh Tâm · Head Nguyễn Khánh Vy.

## 1. Khối Tuyến (T0) — thành phần mới duy nhất

| Phần | Vẽ thế nào |
|---|---|
| Đầu khối | nhãn mục "Tuyến · {loại · em · lượt}" + "Xong a/b · đang n" · ⓘ — **không khung viền / nền** (gọn, như nhãn "Việc con"); kẻ trên + dưới |
| Một dòng một bước | dấu · tên bước (= tên nhóm việc ở Công việc) · chi tiết ngắn · người ("Bạn" đậm) · ngày làm / "hạn dd/mm/yyyy" · ▸ |
| Dấu (khác HÌNH, không chỉ màu) | ✓ vòng xanh lá = xong · chấm đặc màu nhấn = đang ở · vòng đứt mờ = chưa tới lượt · × = bỏ / thu hồi · ⏸ vàng = tạm dừng. Tên đọc màn đọc trạng thái trước tên bước |
| Đang ở | dòng nền nhấn nhạt + tên đậm |
| Chưa tới lượt | chữ mờ; cột ngày ghi điều kiện ("sau khi bạn lưu", "chờ GVCN xác nhận", "trong 5 ngày") — không thành việc, không đếm, không chuông (N72 ③) |
| Song song | dòng nhỏ "… cùng lúc" + bước con thụt, nhánh ngang 20 px; cột người / ngày vẫn thẳng bước cha |
| Vòng lặp | thêm dòng theo thời gian ("Báo PH · lần 1 / 2 / 3", "Vi phạm bị trả lại") — không ghi đè |
| Nội dung | bấm ▸ → mở ngay dưới dòng (khung nền `surface-2`), không đổi panel, không panel lồng. Không quyền xem → không có ▸ (title "Không xem được nội dung") — N72 ④ |
| Gập | tuyến > 4 bước: gập **các bước đã xong** vào "Xem n bước đã xong"; bước đang ở, bước sau, bước cha còn con mở luôn hiện (T0 b). **Chủ SP chọn: (b) gập hay (c) mở sẵn** |
| Cột | subgrid chung: dấu 34 · tên co giãn · chi tiết co giãn · người · ngày sát phải · ▸ 32 (lề 14 / 8 nằm trong cột đầu / cuối). 375 (≤ 560 px khung): hai tầng — tên + ngày · người + chi tiết |
| Chuỗi chấm | 10 px, nối 6 px, cùng hình / màu với dấu; `role="img"` + nhãn "2 xong, 1 đang ở, 3 chưa tới lượt" |

## 1b. Khung việc base (góp ý chủ SP 26/11 sau bản đầu #2214 — C5, C6)

Mọi panel: **đầu** (tên việc · em · lớp · ⓘ ⋯ ✕ — không còn ngày hạn ở đầu) → **khối việc** `.kgv` = web `KhoiGiaoViec` (Phụ trách {tên} bạn · "mặc định" / "{tên} giao" · Đổi · **Hạn = ngày bấm được** như `HanBam` #2211 · Theo dõi chip + "+") → **Tuyến** gọn → nội dung / form → **Việc con** ("+ Việc con", tick xong, người · hạn bấm sửa) → Lịch sử gập → chân Lưu. Đúng thứ tự panel Vận hành.

| Ý chủ SP 26/11 | Khung | Đạt? |
|---|---|---|
| "luật vẫn như cũ, không thêm việc head phải duyệt" | Rà mọi khung: bước "Head duyệt" chỉ ở Xử lý khác mặc định (N1 — T1-375, T2, T9) và Thu hồi (N5 — T0 e); thẻ Sửa cấp bậc (N70 — T9). Báo PH mọi nguồn: Head chỉ ở **Theo dõi**, không duyệt (T3, T6d, T7a, T11) | đạt |
| "có hạn và bấm vào hạn sửa được" | Hạn ở khối việc mọi panel là ngày gạch chấm bấm được (T1–T11); hạn tạm dừng hiện "dừng · 16/09/2026" (T3) | đạt |
| "chọn / đổi người thực hiện (mặc định theo đúng luật)" | Phụ trách + thẻ "mặc định" / "{tên} trả" + Đổi ở mọi panel, kể cả Xử lý vi phạm, Đã thực hiện (T1, T2), từng em trong khay Phối hợp / Trao đổi gia đình / Meeting nhiều em (T5, T6b, T11a). Vi phạm bị trả lại không Đổi (về đúng người ghi — giữ v22) | đạt ([XM] 10) |
| "có thể tạo công việc con nếu muốn" | Mục Việc con + "+ Việc con" ở mọi panel một việc; có việc con mẫu ở T2 (1/2 xong), T3, T6a | đạt |
| "gọn gàng, đơn giản, rõ ràng, đẹp hơn" | Tuyến bỏ khung viền + nền, dòng 36 px; hạn không lặp ở đầu panel; một thứ tự cho mọi panel | đạt (critique vòng 3) |

## 2. Bảng ý → khung (tự rà từng ý)

| # | Ý (đặc tả / N72) | Khung | Đạt? |
|---|---|---|---|
| C1 | Làm xong phần mình → rời việc cần làm, tự theo dõi cả tuyến | T5 (em vừa xác nhận rời bảng, thông báo "theo dõi ở Đang theo dõi · Hoàn tác"), T8a (dòng tuyến ở Đang theo dõi) | đạt |
| C1 | Số việc / chuông không đổi | đầu trang và badge giữ cách đếm v24; Đang theo dõi không badge (T8a, T8b) | đạt |
| C2 | Bước chưa tới lượt chỉ xám trong Tuyến | T1 (○ Báo PH), T1-375 (○ Head duyệt + 2 bước), T5, T9, T10a (TVV thấy ○ Báo PH Meeting · chờ GVCN xác nhận) | đạt |
| C3 | Khung ai trong tuyến cũng thấy; nội dung theo quyền | T6a BPXL: dòng "Báo PH Meeting · Đã báo PH" không ▸; T0 d | đạt |
| 4.1 | Một kiểu khối Tuyến mọi nơi | T0 + mọi panel T1–T11, Đang theo dõi T8, Chờ duyệt T9, hồ sơ T10 | đạt |
| 4.1 | Thay câu luật "Sau khi chốt…" / dòng bối cảnh / thanh bước cũ | T1 (bỏ ⓘ "Sau khi chốt"), T6 (bỏ dòng phần người khác + dòng Báo PH + bối cảnh), T10 (bỏ `ThanhBuoc`) | đạt |
| 4.1 | Bấm bước mở nội dung tại chỗ | T0 a, T2 (Head duyệt mở), T4 (lý do trả lại mở), T7 | đạt |
| 4.2 | Panel nhiều em: chuỗi chấm + mở Tuyến dưới dòng | T5, T6b, T11a | đạt |
| 4.2 | Meeting nhiều em của TVV có ba phần | T6b | đạt |
| 4.2 | Đang theo dõi: một dòng một tuyến, "Đang ở {bước} · {người}", panel chỉ đọc có nội dung | T8a, T8b, T8d; rỗng T8c | đạt |
| 4.2 | Chờ duyệt Head: Tuyến trong chi tiết, có "Lần trước" | T9 | đạt |
| 4.2 | Hồ sơ HV / lớp | T10a, T10b, T10c | đạt (đầu hồ sơ rút gọn — chỉ vẽ tab Ý thức & Phối hợp) |
| 4.3 | Bỏ theo dõi = bỏ cả tuyến | T8a / T8d nút "Bỏ theo dõi" ở dải | đạt |
| 4.4 | Một khái niệm một tên: tên bước = tên nhóm việc | Xử lý vi phạm · Đã thực hiện · Head duyệt · Báo PH · Vi phạm bị trả lại · Tình hình học tập · Xếp lịch họp · Kết quả meeting | đạt |
| 4.4 | Bỏ nhóm "Báo PH" thứ hai + chữ "Nhờ TVV" ở GVCN | T1 / T5 danh sách GVCN không còn nhóm Báo PH | đạt |
| 4b | Mọi nguồn báo PH là việc TVV, một nhóm "Báo PH", chi tiết = nguồn | T11c (Meeting · Vi phạm · Trao đổi gia đình · Tình hình · Báo lại · Kết quả Progress · Kết quả Final) | đạt |
| 4b | Trao đổi gia đình / Progress / Final sinh thẳng việc TVV, nội dung máy điền | T11a (Trao đổi gia đình: "Máy điền sẵn" MT · Overall · môn trượt · Case), T11b (Progress: điểm từng môn + nhận xét GV) | đạt |
| 4b | Theo dõi mặc định Head + CX + người tạo việc | T3, T7a, T11a, T11b dải Theo dõi | đạt |
| 4b | Em không TVV → Head | T11d | đạt |
| 4b | Xét lại lộ trình hiện tên TVV thật | — (chỉ đổi nguồn dữ liệu; không vẽ) | ghi cho PR |
| Luật | Hạn chỉ là ngày tô màu (NH4) | mọi dòng việc + bước đang ở; tiền tố "hạn" chỉ trong Tuyến để phân biệt ngày làm / hạn | đạt ([XM] 6) |
| Luật | Không chú thích tĩnh lên web | chữ giải thích chỉ ở dải vàng của mockup; trên web chỉ ⓘ | đạt |
| Luật | 1440 tối + 375 sáng, đủ trạng thái | 31 khung; T0 có cả tối / sáng | đạt |

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Biết bước sau của việc mình | câu luật / ⓘ "Sau khi chốt…" | dòng ○ trong Tuyến (người + điều kiện) |
| Biết việc mình đã giao đi tới đâu | sang hồ sơ lớp (Phối hợp) / không có (Xử lý, Tình hình) | Đang theo dõi → dòng "Đang ở…" → panel chỉ đọc có Tuyến |
| Xác nhận Phối hợp SOS · Xác nhận n em ▾ · Hoàn tác | có | GIỮ; em xác nhận rời bảng + thông báo trỏ Đang theo dõi |
| Panel Meeting: phần người khác một dòng · dòng Báo PH · bối cảnh GVCN | 3 khối riêng | một khối Tuyến (ba phần cùng lúc, bối cảnh = nội dung bước GVCN) |
| Phần Meeting của mình: Ngày giờ họp · Kết quả · Hoàn thành | có | GIỮ (dưới Tuyến) |
| TVV Meeting nhiều em | bảng không có phần Meeting | bảng chuỗi chấm, mở Tuyến dưới em |
| Đổi người · Theo dõi + / ✕ | có (Báo PH, Meeting, Tình hình…) | GIỮ, trong khối việc base; **thêm** cho Xử lý vi phạm, Đã thực hiện, Phối hợp SOS (N72 ⑥) |
| Sửa hạn | nút "Sửa hạn" / ⋯ | **bấm vào ngày hạn** ở khối (#2211) |
| Việc con | chỉ việc Vận hành | **+ Việc con** ở mọi việc Ý thức / Phối hợp / Báo PH (N72 ⑥) |
| Trả lại · Rút · Bỏ việc · Hoàn tác 60 s | có | GIỮ |
| Lưu · Lưu · việc tiếp › · Gửi Head duyệt · Gửi lại | có | GIỮ |
| Lịch sử (đổi người, hạn, lần liên hệ) | có | GIỮ gập cuối panel |
| GVCN "Trao đổi với gia đình" · GVCN "Báo PH kết quả Test" · Head "Báo PH Final" | việc của họ | **bỏ** — thành việc TVV (N72 ⑤); họ thành người theo dõi |
| Đang theo dõi mở ra | chỉ khối Phụ trách | Tuyến + nội dung theo quyền + Bỏ theo dõi |
| Chờ duyệt Head: xem lần xử lý trước / Báo PH | phải mở hồ sơ em | dòng "Lần trước" + Tuyến trong chi tiết |

Mất thao tác: không. Thao tác bỏ duy nhất là ba việc báo PH của GVCN / Head — theo N72 ⑤ (chủ SP duyệt).

## 4. [XM] — cần PTA / chủ SP xem

1. **Gập hay mở sẵn** khối Tuyến dài (T0 b / c). Mockup đặt mặc định gập khi > 4 bước. Panel nào cũng có bước đang ở ngay đầu nên gập không mất việc cần làm.
2. ~~Vị trí khối Tuyến~~ — đã theo khung base: khối việc trên, Tuyến dưới (đặc tả 4.1 sửa theo).
3. ~~Xử lý vi phạm không có khối~~ — có khối base (N72 ⑥).
4. **Lịch sử** vẫn giữ ở panel có giao việc (đổi người, đổi hạn) — trùng một phần với Tuyến (lần liên hệ). PR có thể chỉ để lại đổi người / hạn trong Lịch sử.
5. **Phụ huynh (SĐT)** của Meeting nằm trong nội dung bước GVCN xác nhận (mở sẵn ở BPXL / TVV / CX). Muốn luôn hiện một dòng riêng thì báo.
6. Tiền tố **"hạn"** trước ngày chỉ dùng TRONG khối Tuyến (một khối có cả ngày đã làm và hạn) — dòng việc ở danh sách giữ ngày trơn (NH4).
7. Hồ sơ HV / lớp (T10) chỉ vẽ tab Ý thức & Phối hợp, đầu hồ sơ rút gọn — không đổi phần khác.
8. Dải "Chờ GV sửa" (T3) giữ chữ nút "Rút" như web.
10. **Đổi người cho Xử lý vi phạm / Đã thực hiện / Phối hợp SOS** (mở rộng N58 theo lời "chọn / đổi người thực hiện"): người nhận làm được đúng việc đó, lịch sử ghi tên. Trước đây chỉ GVCN / Head làm (N64 làm thay). Nếu chủ SP chỉ muốn đổi người ở việc TVV / Báo PH thì bỏ nút Đổi ở ba việc này.
11. Việc con không vào số việc của việc cha và không chặn việc cha xong (như Vận hành N59).

## 5. Skill đã chạy
- `superpowers:brainstorming` (đặc tả), `impeccable` critique (hai agent độc lập: A rà thiết kế bằng ảnh · B máy dò + đo Playwright) — kết quả và sửa ở mục 6.
- Máy dò tự viết khi chụp: chữ nowrap tràn ô = 0 ở 31 khung.

## 6. Critique (impeccable) — hai agent độc lập, hai vòng

| Vòng | Điểm Nielsen | P0 / P1 | Đã sửa sau vòng |
|---|---|---|---|
| 1 | **27/40** | 2 P1 | ① Meeting hai tên / hai bộ đếm → mọi vai cùng tuyến "Phối hợp SOS · {em} · MT2" · ② gập giấu bước sau → chỉ gập bước ĐÃ XONG, giữ bước đang ở + bước sau + bước cha còn con mở · ③ "›" mở tại chỗ trái G6 → ˅ / ˄, cả dòng là vùng bấm · ④ "Đang ở" chọn một trong các bước song song → bước của người xem trước, không thì "Meeting · 3 phần cùng lúc"; bộ đếm "Xong a/b · đang n" · ⑤ danh sách vi phạm lặp ở T1 → bước "GV ghi" không mở trong panel Xử lý · ⑥ 375: khoảng ngày không gãy dòng, dòng ≥ 44 px · ⑦ dấu đang ở giống nút radio → chấm đặc + quầng; tạm dừng = ô vuông · ⑧ T5-375 tràn khung 157 px (máy dò B) → `contain:inline-size` khay + cột `minmax(0,1fr)` |
| 3 (sau góp ý chủ SP: khung base) | **32/40** | 2 P1 → **0** | ⑫ khay nhiều em (T5, T6b, T11a) và panel "TVV hỏi" (T7b) thiếu Việc con → thêm · ⑬ Lịch sử gập ở mọi panel một việc · ⑭ ⓘ sát chữ "Xong a/b" → cách 6 px. Không còn bước Head duyệt mới (chỉ N1 / N5 / N70) — agent rà xác nhận |
| 2 | **31/40** | **0** | ⑨ Meeting mỗi vai một mốc thời gian → một mốc chung (ba phần đều đang mở, không thứ tự — N58) · ⑩ Đang theo dõi của Head nhóm theo loại tuyến · ⑪ dòng xong có nội dung (phân biệt "không nội dung" với "không quyền"); T0 (d) mở sẵn để thấy dòng không ˅ |

Máy dò (B): 16 mục tư vấn / cảnh báo — màu, phông của phần đọc mockup và Google Fonts (phông đã khoá), vạch trái 3 px (luật dự án G14 / v23), sọc chéo `.cc i.b` / `.od.huy` (trạng thái, không trang trí) → không sửa. Tương phản chữ < 18 px trong khối Tuyến: **0 lỗi** (thấp nhất 6,39 tối · 5,20 sáng). Sau sửa: 0 khung tràn ở 31 khung.

Còn để PR code (không phải mockup): vùng bấm 36 px của ✕ / ⋯ / ‹ ở đầu panel 375 là khung v23 đã duyệt — giữ như web hiện tại.

[XM] 9 — chevron: v24 dùng "›" cho dải gập "Lịch sử" (G6 nói "›" = đổi trang). v27 dùng ˅ / ˄ trong khối Tuyến; dải "Lịch sử" chưa đổi (ngoài phạm vi) — PR code có thể đổi cùng lúc cho thống nhất.
