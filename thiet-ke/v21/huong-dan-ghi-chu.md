# Mockup v21 ⑭ · Hướng dẫn V3 — ghi chú

Mockup: `thiet-ke/v21/huong-dan.html` + `huong-dan.css` (token, thành phần: `v21.css` chỉ đọc). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/15-huong-dan-v3.md` mục 1, 2, 4, 5 (R14.1–R14.11) · lời chủ SP 36, 40, 43–55 · luật chung G1–G5 (`11-de-bai-mockup-dot-2.md`) · V22. Nền đã duyệt: HD-V2 `thiet-ke/v14/huong-dan.html` + ghi chú, đặc tả `2026-11-05-huong-dan-v2/de-xuat.md`. Chữ thẻ đối chiếu: `luat/0`–`4` (mục "Việc sinh ra"), `13-thiet-ke-dot-4.md` mục 3, bảng câu quy chế ⑤ (`bang-mau.html`), mockup đã duyệt ① ② ⑪ ⑫ (nhãn nút).
Ảnh: `thiet-ke/v21/anh/huong-dan/` — `{khung}-{toi|sang}.png` (1440 Tối + Sáng; K12 = 375 Sáng), `truoc/` = web hiện tại (seed, ngày demo 14/09/2026, dev cổng 4614/5614 — đã tắt), `cap-*.png` = 18 ảnh cặp TRƯỚC │ SAU kèm một câu "đổi gì". Chụp bằng chrome-headless-shell có sẵn; `document.fonts.check` Be Vietnam Pro + Inter = true. Soát tự động mọi khung: không lỗi console, không chữ < 12 px, không thẻ việc nào bị cắt / phải cuộn ở 1440 (chỉ danh sách K5a, K6b, K8d cuộn — có chủ ý).

## 0. Lời chủ SP trong session này

(chưa có)

## 1. Khung

| Khung | Nội dung | R |
|---|---|---|
| K1 | GV mở panel Nhập điểm (MB FT 104), bấm "?" → tab Ở đây = MỘT thẻ việc đủ bảy dòng, chồng lên panel việc (panel việc còn dưới nền mờ) · "‹ Việc khác ở tab này" | R14.1 |
| K2a–e | Biến thể dòng: MT cũ (không hạn → không dòng Hạn) · Xử lý vi phạm (hai lối) · TVV Báo PH · QL làm thay (dải "Việc của GV. Bạn làm thay được.") · CX chỉ xem (dải "Bạn chỉ xem", ẩn Làm / Làm sai / Không làm được) | R14.2 |
| K3 | Tầng 2: Công việc · tab Case học thuật, chưa chọn việc — ≤ 5 việc của tab + "+ 3 việc khác" + Không làm ở đây | R14.3 |
| K4 | Tầng 3: Hồ sơ học viên — dáng V2 gọn (Bạn đang ở · Trước · Việc làm ở đây · Không làm ở đây) | R14.4 |
| K5a / K5b | Tôi muốn…: nhóm theo tên tab Công việc + bộ lọc nhịp (dính đầu khi cuộn) · lọc "Sau tuần Test", mở "Mô tả Case" → thẻ có Đi tới › + Chỉ cho tôi | R14.5 |
| K6a / K6b | Khi gặp…: 11 tình huống của GV · mở "Em vắng Test" (Máy làm gì · Bạn làm gì · Ai khác nhận việc) | R14.6 |
| K7a / K7b | Tìm "vang": Việc · Khi gặp… · Việc của vai khác · không có kết quả | R14.7 |
| K8a–d | Có gì mới: chấm trên "?" · dải gập (mặc định khi mở lần đầu) · đã xem · dải mở ≤ 5 dòng | R14.8 |
| K9 | ⓘ ở dòng quy chế panel Nhập điểm → cùng panel, cùng thẻ K1; bước khớp quy chế tô nền 2 giây | R14.9 |
| K10a / K10b | Chỉ cho tôi (khoanh ô điểm + một dòng, dáng V2) · trang /huong-dan (Thẻ việc · Khi gặp… · Luật và hạn · Thuật ngữ, nút In) | R14.10 |
| K11a–c | Trạng thái: hạn đang nạp · nạp hạn lỗi ("⚠ Không tải được hạn · Thử lại") · việc chưa có thẻ (lưới an toàn) | G4 "đủ trạng thái" |
| K12a–f | 375 Sáng: tầng 1 · tầng 2 · Tôi muốn… · Khi gặp… · tìm · Có gì mới | R14.10 |

## 2. Bảng truy vết so V2 (khung → thành phần → TRƯỚC → SAU)

| Khung | Thành phần | TRƯỚC (HD-V2 / web hiện tại) | SAU (V3) | GIỮ / ĐỔI / BỎ |
|---|---|---|---|---|
| mọi | Nút "?" thanh trên | tròn, cạnh chuông, 375 vùng chạm 44 | như cũ | GIỮ |
| mọi | KhungPanel 480 phủ nền, ✕ / Esc chỉ đóng Hướng dẫn, panel việc + chữ đang gõ còn nguyên | có | như cũ | GIỮ |
| mọi | Đầu panel: "Hướng dẫn" + chip vai; QL / QT "Vai: … ▾" (Xem vai khác) | có | như cũ (K2d) | GIỮ |
| mọi | Ô tìm bỏ dấu, từ đồng nghĩa, "việc của vai khác" | có | như cũ + gộp thêm thẻ tình huống (K7a) | GIỮ + mở rộng |
| mọi | Hàng tab | Màn này · Tôi muốn… · Tuần của tôi | **Ở đây · Tôi muốn… · Khi gặp…** | ĐỔI (15 mục 4.3) |
| K1, K2 | Nội dung khi đang mở panel việc | mục "{panel} đang mở" (ô Lối chính + 3 bước) rồi MỌI việc của trang (18 dòng, phải cuộn) | **MỘT thẻ việc** khuôn bảy dòng, đầu thẻ "Bạn đang mở: lớp · việc" | ĐỔI (tầng 1) |
| K1 | Ô "Lối chính · Công việc › Chấm điểm · Đi tới ›" khi đang ở đúng chỗ | có | bỏ (đang ở đúng chỗ); lối tắt thành một dòng nhạt "Cũng mở được từ: …" | BỎ ô · GIỮ ý |
| K1 | Lối lên | — | "‹ Việc khác ở tab này" (tầng 2) / "‹ Việc khác ở màn này" (tầng 3) | MỚI |
| K2d/e | Vai khác xem việc | QL thấy việc như của mình (nhãn "làm thay GVCN" trong tên) | cùng thẻ gốc + dải "Việc của {vai}. Bạn làm thay được / chỉ xem." | ĐỔI (4.5) |
| K3 | Tầng 2 (tab đang đứng) | không có — "?" ở tab nào cũng 18 dòng | "Bạn đang ở Công việc · Case học thuật" + ≤ 5 việc của TAB + số việc bạn đang có | MỚI |
| K4 | Tầng 3 (màn): Bạn đang ở · Trước / Sau · Việc làm ở đây · Không làm ở đây | dòng đầu mở sẵn, ô Lối chính trong từng dòng | như cũ, mọi dòng đóng, mở ra là thẻ việc | GIỮ dáng · ĐỔI nội dung dòng |
| K5 | Tôi muốn… nhóm | Điểm · Case và PA · Học viên và lớp · Lịch Test · Duyệt · Khác | **đúng tên tab Công việc của vai** + Học viên & lớp + Khác | ĐỔI (4.6, một khái niệm một tên) |
| K5 | "Tuần của tôi" | tab riêng, nhóm theo nhịp | **bộ lọc nhịp** đầu tab Tôi muốn… (Tất cả · Hằng ngày · Sau tuần Test · 2 tuần một lần · Hằng tháng · Khi có) | **ĐỔI có chủ ý** (lời 55) |
| K5 | Dòng việc mở ra | ô Lối chính + bước + "Lối tắt: …" + Chỉ cho tôi | thẻ việc (cùng thành phần K1) + Đi tới › + Chỉ cho tôi + "Cũng mở được từ" | ĐỔI |
| K6 | Khi gặp… | không có (ngoại lệ gần như không được hướng dẫn) | 11 tình huống, thẻ ba dòng, link sang thẻ việc | MỚI |
| K8 | Chấm trên "?" | chấm khi tài khoản chưa mở lần nào | chấm khi nội dung có phiên bản mới (tài khoản mới = chưa xem phiên bản nào, vẫn có chấm) + dải Có gì mới | ĐỔI [XM-6] |
| K9 | ⓘ dòng quy chế | hộp chữ nổi riêng ("Tuần Test đã qua 2 tuần: …") | mở panel Hướng dẫn, đúng thẻ việc — một nguồn chữ | ĐỔI (4.4) |
| K10a | Chỉ cho tôi | đóng Hướng dẫn, khoanh `data-hd` + một dòng + Esc | như cũ | GIỮ |
| K10b | Trang /huong-dan | Tôi muốn… · Tuần của tôi · Theo màn · Luật và hạn · Thuật ngữ, In | **Thẻ việc · Khi gặp… · Luật và hạn · Thuật ngữ**, In; thẻ in đủ dòng | ĐỔI (4.9) |
| K11 | Trạng thái hạn | — (không có số hạn trong hướng dẫn) | Hạn đang nạp / lỗi chỉ ở dòng Hạn | MỚI |
| — | "Theo màn" (trang) | mục lục theo màn | bỏ — nội dung theo màn nằm ở tầng 3 của panel | BỎ |
| — | Mục "Màn này chưa có hướng dẫn riêng" | có | còn ở tầng 3; thêm K11c cho việc chưa có thẻ | GIỮ |

## 3. Bảng thao tác TRƯỚC → SAU

| Thao tác | TRƯỚC | SAU | Mất? |
|---|---|---|---|
| Mở hướng dẫn đúng việc đang làm | "?" → mục panel ở đầu (3 bước) + 18 dòng khác | "?" → một thẻ đúng việc, không cuộn | không |
| Xem việc khác ở cùng chỗ | cuộn panel | "‹ Việc khác ở tab này / màn này" | không |
| Tìm | ô tìm | ô tìm (thêm thẻ tình huống) | không |
| Xem việc theo nhịp | tab Tuần của tôi | bộ lọc nhịp ở Tôi muốn… | không (đổi chỗ) |
| Đi tới chỗ làm | "Đi tới ›" trong ô Lối chính | "Đi tới ›" ở chân thẻ (khi đang ở chỗ khác) | không |
| Chỉ cho tôi | nút trong dòng việc | nút ở chân thẻ | không |
| Xem lối tắt | "Lối tắt: …" | "Cũng mở được từ: …" | không |
| Xem vai khác (QL / QT) | ô Vai ▾ | ô Vai ▾ | không |
| Mở trang /huong-dan, In | chân panel | chân panel | không |
| Xem chi tiết quy chế | ⓘ → hộp chữ | ⓘ → thẻ việc | không (đầy đủ hơn) |
| Tra "khi gặp sự cố" | không có | tab Khi gặp… | thêm |

## 4. Dòng Hạn = mã chèn từ cấu hình (không gõ tay)

Số ngày trong thẻ là bản luật hiện hành, **lấy từ cấu hình "Hạn mặc định"** (Quản trị đổi thì thẻ tự đúng — phép HD-HAN). Tên mã là gợi ý, người làm HD-1 đặt (15 mục 7).

| Thẻ | Câu hiển thị | Mã chèn gợi ý | Nguồn luật |
|---|---|---|---|
| Nhập điểm, Chấm Speaking | Hết thứ Tư tuần sau | `{han:cham_diem}` | T-15 |
| Xử lý vi phạm | 5 ngày từ vi phạm thứ 3 hoặc từ yêu cầu | `{han:y_thuc_xu_ly}` | D2, `13` mục 3 |
| Báo PH (TVV) | 5 ngày từ khi có việc | `{han:bao_ph}` | D3, D5 |
| Ghi kết quả PA | Hết thứ Ba sau mỗi kỳ 2 tuần | `{han:ket_qua_pa}` | C4 |
| Mô tả Case | 5 ngày (SOS 3: 3 ngày) | `{han:sos}` / `{han:sos_3}` | C4 |
| Nhập điểm MT cũ | — (không hạn → không dòng Hạn) | — | T-20 |
"10 giây" Hoàn tác (Xử lý vi phạm) là hằng số giao diện, không phải hạn.

## 5. Đếm chữ từng thẻ (đếm từ có chữ / số; dấu "-", "›", "→" không tính; ngưỡng 4.10: dòng ≤ ~16, thẻ ≤ ~80)

| Thẻ | Khi nào có | Làm | Xong khi | Hạn | Làm sai | Không làm được | Sau đó | Tổng | Dòng dài nhất |
|---|---|---|---|---|---|---|---|---|---|
| Nhập điểm MT · Progress · Final (K1, K9, K12a) | 10 | 8+9+4 | 5 | 10 | 11 | 14 | 13 | **84** | 14 |
| ↳ QL làm thay (K2d, ẩn Không làm được) | | | | | | — | | 70 | 13 |
| Nhập điểm MT cũ (K2a) | 13 | 7+4+4 | 6 | — | 11 | 13 | 14 | 72 | 14 |
| Xử lý vi phạm (K2b) | 16 | 13+8 (hai lối) | 6 | 15 | 12 | — | 15 | **85** | 16 |
| Báo PH (K2c) | 15 | 7+7+4 | 5 | 11 | — | 14 | 11 | 74 | 15 |
| Ghi kết quả PA (đủ) | 16 | 6+11+7 | 5 | 8 | 6 | 11 | 9 | 79 | 16 |
| ↳ CX chỉ xem (K2e) | 16 | — | 5 | 8 | — | — | 9 | 38 | 16 |
| Mô tả Case (K5b, K12c) | 14 | 4+9+2 | 7 | 15 | — | 14 | 9 | 74 | 15 |
| Chấm Speaking (K7a) | 15 | 9+3+4 | 10 | 12 | 11 | — | 16 | 80 | 16 |
| Tình huống Em vắng Test (K6b) | Máy làm gì 16 · Bạn làm gì 13 · Ai khác nhận việc 16 | | | | | | | 45 | 16 |
Hai thẻ vượt ~80 (84, 85) — [XM-4]. Đọc dò (nhãn trái → câu phải) trong ~10 giây; đọc hết từng chữ ~20 giây (critique A).

**Chữ chưa chắc 100 % trên mã (HD-2 / HD-3 kiểm lại khi viết nội dung):** "Sửa hạn" (Báo PH — theo `luat/3` mục 4) · "Hiện từ Chủ nhật trước hạn" (Ghi kết quả PA — `luat/2` mục 3) · "Việc được giao" ở tab Vận hành (K11c). Dòng **Làm sai** của Báo PH và Mô tả Case **để ẩn** vì chưa thấy đường sửa rõ trên web — không đoán [XM-5].

## 6. [XM] cần PTA Overhaul quyết

1. **[XM-1] "?" bị nền mờ che (web hiện tại).** Panel phủ nền đang mở (vd QL › Tổng quan › "Chấm quá hạn") thì nút "?" nằm dưới nền mờ, KHÔNG bấm được (`truoc/r2d-ql-lam-thay.png`; Playwright báo click bị chặn). Đặc tả 4.1 "mở chồng" đòi bấm được. Đề xuất HD-1: nút "?" của thanh trên nổi trên nền mờ KhungPanel (chỉ nút này), hoặc thêm "?" nhỏ ở đầu KhungPanel. Mockup vẽ K2d theo giả định đã bấm được.
2. **[XM-2] Tầng 2 có số việc bạn đang có** ở mỗi dòng ("3 việc") và việc đang có lên trước — đề bài chỉ nói "≤ 5 việc của tab". Số lấy từ `/my-work` đã nạp (0 câu đọc). Giữ hay bỏ?
3. **[XM-3] Làm thay → ẩn "Không làm được".** Thẻ viết theo người giữ việc; dòng này là lý do của người đó ("không phải kỹ năng bạn → nhờ QL") — sai với QL. Builder ẩn cho vai làm thay (vai chỉ xem ẩn thêm Làm, Làm sai). Đồng thời đổi quy tắc viết: **Khi nào có / Sau đó viết theo vai (GV, GVCN, TVV), không dùng "bạn"** để vai khác đọc cùng thẻ không hiểu sai; "bạn" chỉ ở các dòng thao tác. Đề xuất ghi vào 15 mục 4.10.
4. **[XM-4] Hai thẻ quá ~80 chữ:** Nhập điểm 84 (giữ đủ ba bước + luật "-"), Xử lý vi phạm 85 (hai lối). Cắt thêm sẽ mất thông tin "tính đến mọi trường hợp". Giữ hay nâng ngưỡng HD-DAI lên 90?
5. **[XM-5] Dòng Làm sai ẩn ở Báo PH, Mô tả Case** (xem mục 5). HD-2/HD-3 kiểm mã: có đường sửa thì thêm.
6. **[XM-6] Chấm trên "?"** đổi nghĩa: V2 = "chưa mở lần nào"; V3 = "có phiên bản nội dung chưa xem". Một cờ theo phiên bản (`daXemHuongDan` → số phiên bản); tài khoản mới chưa xem phiên bản nào nên vẫn có chấm như V2; người mới KHÔNG thấy dải Có gì mới (với họ chưa có gì "mới").
7. **[XM-7] K9 tô bước khớp 2 giây** khi mở từ ⓘ — chi tiết nhỏ thêm ngoài đề bài.
8. **[XM-8] Bộ lọc nhịp dính đầu** thân panel khi cuộn (thấy đang lọc gì); 375 một hàng vuốt ngang, mép phải mờ.
9. **[XM-9] Tên việc "Nhập điểm MT · Progress · Final"** giữ tên V2 (`gv.ts`); critique gợi ý "Nhập điểm Test" (dấu "·" trùng dấu tách lớp · việc). PTA chọn.
10. **[XM-10] Web hiện tại còn việc "Xem vi phạm mới"** (`truoc/r2b-xu-ly-vp.png`) — GD-19 (lời 47, ⑪) chưa lên web. Thẻ Xử lý vi phạm viết theo luật mới; HD-2 phải chờ GD-19 (15 mục 6 đã ghi).
11. **[XM-11] Tổng quan QL không có danh sách tab** → panel mở từ đó dùng lối "‹ Việc khác ở màn này" (tầng 3); hồ sơ HV cũng vậy (K2e). Tên lối thứ hai này là builder đặt.

## 7. `impeccable` — distill · layout · clarify, rồi critique

Dựng: `distill` (bỏ ô Lối chính khi đang ở đúng chỗ, bỏ danh sách 18 dòng ở tầng 1, thẻ không viền / không hộp trong hộp ở tầng 1) · `layout` (cột nhãn cố định 108 px, mắt quét dọc theo nhãn; ba khối cách 14–16 px; thẻ không cuộn ở 1440) · `clarify` (câu bắt đầu bằng động từ, nhãn web in đậm, "Không làm được" = lý do → bước kế / ai).

Critique (dual-agent: A = rà thiết kế, subagent riêng · B = detector + Playwright, subagent riêng):

| Vòng | Điểm | P0 / P1 | Đã sửa |
|---|---|---|---|
| 1 | **30/40** | P0 0 · P1 3 | P1 Xử lý vi phạm đánh số 1-2-3 cho hai lối loại trừ → hai dòng nhánh, không số · P1 "Hồ sơ học viên › Case & phương án" không phải tab → "Hồ sơ học viên › Học thuật" (mọi dòng "Cũng mở được từ") · P1 "⋯ › Khôi phục điểm" trông như "--- ›" cạnh dấu "-" → phím ⋯ có khung: "xoá nhầm: [⋯] rồi **Khôi phục điểm**" · P2 "bạn" trong thẻ khi QL / CX đọc → Khi nào có / Sau đó viết theo vai [XM-3] · P2 Hạn thiếu "quá hạn thì sao" → thêm ở Xử lý vi phạm, Mô tả Case · P2 QL / CX mất lối lên → "‹ Việc khác ở màn này" · P2 375 chip lọc 36 px, nút Có gì mới 40 px → 44 · P2 ký tự "⌄" trong dải Có gì mới → chữ · P3 K9 tô cả dòng Làm → chỉ bước "Em vắng" · P3 cột nhãn trong danh sách 96 → 108 · K5b thẻ mở bị cắt → thân tự cuộn vừa đủ + bộ lọc dính đầu |
Cổng (luật 28/10): chạm 30, sau vòng sửa không còn P0 / P1 → dừng.
Detector B: 57 phát hiện, KHÔNG có lỗi thật trong `huong-dan.css` — 38 tương phản = huy hiệu số chú thích mockup `.so-mk` (không lên web); phông Inter / Be Vietnam Pro, vạch trái 3 px mục đang chọn = hệ thiết kế đã duyệt; bo 10 px = dáng danh sách V2 đã duyệt (v14). Tương phản chữ nhạt thấp nhất 4,84 : 1 (nhãn dòng trên nền tô K9, Sáng) — đạt.
P2 / P3 để lại (ghi để PTA biết): thẻ Báo PH chưa có Làm sai [XM-5] · 1440 sáu chip lọc xuống hai hàng (giữ chip — G2 "danh sách ngắn cố định giữ dáng chip") · dải Có gì mới mở thì thân cuộn (K8d — đóng dải là thẻ trọn; không thêm "›" vì "›" = đổi trang).

## 8. Đo ✕ / ⓘ / ⌄ (Playwright, hộp chữ thật so tâm nút)

| Nút | Số nút | Lệch ngang | Lệch dọc |
|---|---|---|---|
| ✕ đóng Hướng dẫn | 27 | 0,01 px | 0,33 px |
| ✕ xoá chữ tìm | 3 | 0,01 px | 0,38 px |
| ⓘ dòng quy chế | 3 | 0,00 px | 0,00 px |
| ⌄ dòng gập (svg 16 × 16, nét 4–12 cân trong hộp) | 97 | (cột riêng 16 px) | 0,00 px |
| ⌄ dải Có gì mới | 3 | (cột riêng) | 0,00 px |
Tất cả ≤ 1 px.

## 9. Lượt đọc (Turso)

0 câu thêm: thẻ là nội dung tĩnh trong mã; "Bạn đang mở" lấy chữ từ dòng việc đã có; số việc tầng 2 từ `/my-work` đã nạp; "Có gì mới" so phiên bản nội dung với cờ trong phiên (`session`). Hạn: dùng cấu hình web đã nạp; vai chưa nạp sẵn thì nạp MỘT lần khi mở "?" lần đầu trong phiên (K11a) — HD-1 đo và ghi trần.

## 10. Tự rà từng dòng R

| R | Yêu cầu | Khung | Đạt? |
|---|---|---|---|
| R14.1 | Tầng 1: GV mở Nhập điểm bấm "?" → thẻ đủ bảy dòng, chồng lên panel, không cuộn 1440; "‹ Việc khác ở tab này" | K1 (+ K12a 375) | Đạt — panel việc còn dưới nền mờ (thấy tiêu đề, cột học viên) |
| R14.2 | Biến thể: không hạn · Xử lý vi phạm hai lối · TVV Báo PH · QL "làm thay được" · TVV / CX "chỉ xem" không dòng Làm | K2a–e | Đạt (K2e vẽ CX; TVV cùng dáng) · kèm [XM-3] |
| R14.3 | Tầng 2: Công việc tab Case học thuật, chưa chọn việc → Bạn đang ở + ≤ 5 việc + Không làm ở đây | K3, K12b | Đạt · [XM-2] |
| R14.4 | Tầng 3: màn không tab (Hồ sơ HV) dáng V2 gọn | K4 | Đạt |
| R14.5 | Tôi muốn…: nhóm theo tab + bộ lọc nhịp; mở dòng ra thẻ; Đi tới › + Chỉ cho tôi | K5a, K5b, K12c | Đạt |
| R14.6 | Khi gặp…: danh sách + thẻ "Em vắng Test" ba dòng | K6a, K6b, K12d | Đạt |
| R14.7 | Tìm "vang": thẻ việc, thẻ tình huống, việc vai khác; không có kết quả | K7a, K7b, K12e | Đạt |
| R14.8 | Có gì mới: dải + chấm; đã xem | K8a–d, K12f | Đạt · [XM-6] |
| R14.9 | ⓘ dòng quy chế mở đúng thẻ (cùng thành phần) | K9 | Đạt · [XM-7] |
| R14.10 | Chỉ cho tôi khoanh (V2) · trang /huong-dan (In) · 375 panel toàn màn, thẻ, tab | K10a, K10b, K12a–f | Đạt |
| R14.11 | Chữ thật theo 4.10, đếm chữ từng thẻ | mọi thẻ; mục 5 | Đạt — trừ 2 thẻ 84 / 85 chữ [XM-4] |
| G1 | Nâng cấp V2, giữ thao tác | mục 2, 3 | Đạt — không mất thao tác |
| G2 | Đồng bộ thành phần (tab gạch chân, ô tìm, ✕, chip, ⓘ, "›" = đổi trang, câu lỗi chuẩn) | mọi khung | Đạt |
| G3 | Không chú thích tĩnh / bước xác nhận / tab ngoài đề bài | — | Đạt (tab Khi gặp… là đề bài) |
| G4 | 1440 Tối + Sáng, 375 Sáng, đủ trạng thái, ảnh cặp | anh/huong-dan | Đạt (K11 trạng thái; 18 ảnh cặp) |
| V22 | Hạn chỉ bằng màu, không ⚠ | nền Công việc | Đạt (tắt ⚠ của v21.css trong tệp này); ⚠ chỉ ở lỗi tải K11b |
| Lời 40 | Thông tin theo trạng thái — dòng không áp dụng không hiện | K2a, K2d, K2e, K11 | Đạt |
| Lời 36 | Tên bậc viết đủ ở Hướng dẫn | Báo PH: "REPORT 1" ở tiêu đề việc | Đạt |
| 15 mục 2 thất bại | thẻ phải cuộn · chữ khác nhãn web · số ngày gõ tay · GV thấy việc QL như của mình · mở "?" mất panel / chữ | K1–K12, mục 4 | Không mắc (việc QL chỉ hiện "việc của QL", không bước) |

## 11. Ảnh cặp (TRƯỚC web │ SAU mockup)

`cap-k1-tang-1` · `cap-k2a-khong-han` · `cap-k2b-xu-ly-vp` · `cap-k2c-tvv-bao-ph` · `cap-k2d-ql-lam-thay` · `cap-k2e-cx-chi-xem` · `cap-k3-tang-2` · `cap-k4-tang-3` · `cap-k5-toi-muon` · `cap-k6-khi-gap` · `cap-k7a-tim` · `cap-k7b-tim-rong` · `cap-k8-co-gi-moi` · `cap-k9-nut-i` · `cap-k10a-chi-cho-toi` · `cap-k10b-trang` · `cap-k12a-375` · `cap-k12c-375-toi-muon`. Với khung chỉ vẽ panel (K2, K5–K7), ảnh TRƯỚC cắt đúng panel 480 px bên phải. K2a: web không có việc MT cũ trong seed GV → TRƯỚC dùng panel Phối hợp SOS (việc không hạn gần nhất).
