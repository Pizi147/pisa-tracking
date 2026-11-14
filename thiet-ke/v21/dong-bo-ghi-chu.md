# Mockup ⓪ — sửa đồng bộ năm mockup v21 (①–⑤) · 15/11

Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/11-de-bai-mockup-dot-2.md` mục ⓪ (R0.1–R0.7) + luật chung G1–G5. Nguồn từng chỗ: `10-ra-dong-bo.md` mục A, B. Lời chủ SP: 17, 20, 24, 28, 32–35.
Chỉ sửa tại chỗ, không vẽ lại, không đổi bố cục. Ảnh cặp TRƯỚC (origin/main) │ SAU: `anh/dong-bo/<mockup>-<khung>.png` (tối). Ảnh từng khung đã đổi (tối + sáng) chụp lại trong thư mục ảnh của mockup đó. Phông Be Vietnam Pro kiểm `document.fonts` trước mỗi lần chụp.

## 0. Lời chủ SP trong session này

15/11, sau khi xem thang cấp bậc có chữ "WARNING LETTER 1 / 2" trong thanh:

> "KHÔNG ĐỂ HẲN CHỮ WARNING LETTER vào trong progress bar, ý là chỉ để nó khác màu và nổi bật hơn thôi, vẫn đẻ progress bar như bình thường"

Đã làm: thang cấp bậc ở ③ (1440 + 375) và ⑤ D1a / D1b về thanh vạch bình thường; mốc WL 1 / WL 2 = vạch ĐỎ, dày và dài hơn vạch thường, không chữ trong thanh (cũng bỏ nhãn "WL 1" cũ trong thanh). Tên bậc vẫn ở nhãn đọc màn hình (aria-label), `title` và danh sách khi mở "Thang ▾". Chuyển lại PTA Overhaul.

## 1. Đã sửa gì

① = `trang-dau-gv.html` · ② = `ho-so-lop.html` · ③ = `ho-so-hv.html` · ④ = `trang-dau-tvv.html` · ⑤ = `bang-mau.html`.

| # | Tệp | Khung | Trước → Sau | Nguồn |
|---|---|---|---|---|
| 1 | ① | K1, K2, K3, K5a, K6, K7a, K8a, K8d, K8f | Badge tab Chấm Speaking đỏ "6" / "4" → **mờ "⚠ 18" / "⚠ 12"** (đếm số bài, ⚠ vì có bài quá hạn; không đỏ, không vào badge menu) | lời 33 · `10` A |
| 2 | ⑤ | H1, G2 | Như dòng 1. H1: mẫu vàng chuyển sang tab Case học thuật để vẫn đủ ba màu đỏ / vàng / mờ | lời 33 |
| 3 | ① | K1, K6, K7a, K8b, K8e | Nút-chip "Việc cần làm" **bỏ biểu tượng** (bút, cờ, khiên…) | lời 20 · `10` A |
| 4 | ① | K1, K8b | **Bỏ chip "Chấm Speaking · 6 bài"** ở Lớp của tôi; MB FT 108 hết việc → xuống nhóm "không có việc", chữ mờ | lời 20 · `10` A |
| 5 | ① | K6, K8e | Chip "Báo cáo PH · hạn 30/09 ›" → **"Vận hành · 1"** (sang tab Vận hành) | lời 20 · `10` A |
| 6 | ① | K6, K8d | **Bỏ tab riêng "Báo cáo PH"** → nhóm "Báo cáo PH" trong tab **Vận hành** (thêm dòng Bàn giao quá hạn để số đếm khớp badge "Vận hành 1"); dòng viết "lớp · Viết Báo cáo PH" | lời 20, 24 · `10` A |
| 7 | ① | K1, K3 | Dải nhóm "Việc chung của nhóm GV Speaking" → **"Chấm Speaking"** | lời 24 · `10` A |
| 8 | ① | K1 (tab Chấm điểm, Case, Ý thức, Vận hành), K2, K8a | 11 dòng một em "vòng chữ đầu + tên em + cây việc" → **"Lớp · tên việc ngắn"**, tên em là thẻ phụ (link), SOS theo sau | lời 24 · ⑤ B1 · `10` A |
| 9 | ① | K3, K8c | "GV chấm" ô chọn thường → **ô chọn có tìm** (mẫu A, đã chọn "Đinh Thu Hằng · tôi", ✕ đổi) | lời 17 · ⑤ A3 · `10` A |
| 10 | ① | K5b, K5c | Bước chọn em `.goi-y` cũ → **mẫu A** `.oc-vung` (K5b như ⑤ F2 nhóm theo lớp của tôi; K5c chọn nhiều có chip + "2 / 8") | lời 17 · ⑤ F2, F3 · `10` A |
| 11 | ② | K4b | Như dòng 10, nhóm "Lớp này · MB FT 101"; chân hộp "Huỷ · Tiếp ›" → **"Đóng · Tiếp"** (một chân với ⑤ F3) | lời 17 · `10` A, B |
| 12 | ④ | K4b | Như dòng 10, nhóm "HV của tôi" → "Cùng chi nhánh" | lời 17 · `10` A |
| 13 | ⑤ | D5 (câu Q9) | MT0 "-" "chỉ ghi dấu, không dời · hết tuần thành Không dự thi" → **"MT0: "-" = vắng như Mock: lần 1 dời sang tuần sau · lần 2 huỷ"** | lời 32 (LG-9) |
| 14 | ⑤ | D5 (câu Q72) | Duyệt thu hồi "Không tự chốt · duyệt thì bậc tính lại" → **"Còn {5} ngày · hết hạn máy chốt theo GVCN · duyệt thì bậc tính lại"** | lời 33 (LG-10) |
| 15 | ⑤ | D1a, D1b | Panel Xác nhận xử lý thêm **thang cấp bậc** (dùng chung `.vach-bac` của ③): thanh vạch, mốc WL là **vạch đỏ dày hơn, không chữ** (mục 0), vạch "bậc kế" nhạt | lời 28, 35 · R0.4 |
| 16 | ⑤ | H5 (khung mới) | **Ô mẫu "Tên bậc: chỗ viết đủ │ chỗ viết tắt"** — VIẾT HOA hết; WARNING LETTER n ở nơi quyết / PH đọc, WL n ở nơi chật | lời 35 · R0.4 |
| 17 | ③ | K1, K4a, K8 (thang cấp bậc) | Mốc "WL 1 / WL 2" là nhãn chữ đỏ trong thanh → **vạch đỏ dày, dài hơn, không chữ** (thanh vạch bình thường); nhãn đọc màn hình viết đủ WARNING LETTER | chủ SP 15/11 (mục 0) · lời 28 |
| 18 | ③ ④ | mọi khung | "Report n" / "Warning Letter n" → **"REPORT n" / "WARNING LETTER n"** (vd "Báo PH · REPORT 2", "Đã tới REPORT 1") | lời 35 · G2 |
| 19 | ① ② ⑤ | ① K1, K6, K8; ② mọi khung; ⑤ C1, C2 | Chip "Nhập điểm · 6 bài" → **"Nhập điểm · 6"**; ⑤ "Báo cáo PH · còn 1 em ›" → "Báo cáo PH · 1 ›"; chữ ghi chú ⑤ C "đơn vị khi có" → "không đơn vị" | lời 35 · R0.3 |
| 20 | ② | dải số mọi khung | Badge phạm vi lớp "21 bài chờ chấm ›" → **"Chờ chấm · 21 ›"**; "8 chờ duyệt ›" → "Chờ duyệt · 8 ›"; "15 việc quá hạn của lớp ›" → "Quá hạn của lớp · 15 ›"; "7 HV chưa chốt lộ trình" → "Chưa chốt lộ trình · 7" | lời 35 · R0.3 |
| 21 | ② | dải số mọi khung | Dải cao 38, số không bấm → **cao 44, "Đạt MT" và "SOS" là ô số** (gạch chân màu nhấn, bấm → panel chỉ đọc; "0 %" không bấm) | ⑤ H3 · `10` B |
| 22 | ④ | K1, K4a, K5, K6, K7 (dải "Chỉ số của tôi") | Dải 5 ô cao 58 có dòng phụ → **dải mỏng 44 một hàng ⑤ H3** ("nhãn + ô số", ⓘ là nút, ô "›" giữ đổi trang, 0 không bấm); ô "Việc" không bấm, giữ "⚠ m quá hạn" (④ [XM-1]); "Chờ KQ thi thật" → **"Chờ KQ"** | ⑤ H3 · `10` B |
| 23 | ② | mọi khung | Tab Ý thức chỉ có chấm vàng → **badge viên tròn** (đỏ khi việc Ý thức của tôi quá hạn, mờ khi chỉ đếm); tab Báo cáo PH mang chip "Tháng 9 · hạn 30/09" → **badge mờ "1"** (hạn vẫn ở đầu tab) | ⑤ H1 · `10` B |
| 24 | ② | K1–K8 | Menu "+ Task" không biểu tượng → **có biểu tượng** như ⑤ F1 / ① | ⑤ F1 · `10` B |
| 25 | ② | K2b, K8b, panel mẫu | Chân panel chưa lưu "Việc tiếp › + Xác nhận PA" → **"Đóng + Xác nhận PA"**; "Việc tiếp ›" chỉ sau khi lưu | ⑤ D2 · `10` B |
| 26 | ④ | K2a, K2b, K2c, K7c | Chân "Lưu + Lưu · việc tiếp ›" → **"Đóng + Lưu"** (375: "Lưu"); bỏ chấm trước "Chưa lưu" | ⑤ D2 · `10` B · [XM-⓪1] |
| 27 | ② | panel Phối hợp SOS (mẫu) | Câu quy chế → **"Meeting: hạn 18/09 · xác nhận xong TVV nhận việc báo PH"** | bảng ⑤ · `10` B |
| 28 | ③ | K3a–K3f, K4c | 7 câu quy chế → câu bảng ⑤ (Mô tả Case · Chọn PA hai biến thể · Ghi kết quả "Điều chỉnh / Thay PA cần lý do" · Hoàn thành Case hai biến thể · Trả lời tình hình) | bảng ⑤ · `10` B |
| 29 | ④ | K2a–K2c, K3a–K3c, K7c | 7 câu quy chế → câu bảng ⑤ (Báo PH đã báo / chưa liên hệ được · Báo PH tình hình · Cập nhật KQ thi thật · Lộ trình mới · Chốt ngày thi) | bảng ⑤ · `10` B |
| 30 | ② | K1–K8 | Số đếm "Việc cần làm · 5" → **"Việc cần làm · 5 việc · ⚠ 2 quá hạn"** (dạng ①) | `10` B |
| 31 | ③ | K1 | Đầu "Việc cần làm" "2 · ⚠ 1 quá hạn" → **"2 việc · ⚠ 1 quá hạn"** (375 giữ gọn như ① K8a) | `10` B |
| 32 | ① | K6, K8e | Chip hạn "còn 1 ngày · 23/09" (màu hôm nay) → **"hạn 23/09"** (màu còn hạn, như ⑤ B1) | `10` B |
| 33 | ④ ③ | ④ K1 (Sau thi, Chốt ngày thi, Bổ sung hồ sơ), K3a, K3c · ③ K1, K4a (thanh việc, tab Ý thức) | Chip / chữ "không hạn" → **cột hạn trống + vạch nhóm "Không hạn"** (④); bỏ chip "không hạn" ở đầu panel; ③ dòng Phối hợp SOS cột hạn trống, "Chưa phối hợp · không hạn" → "Chưa phối hợp" | ⑤ B1 · `10` B |
| 34 | ③ ④ | ③ K4a, K8; ④ K2a, K2c, K3a | Lịch sử "Lịch sử 3" (viên), "Lịch sử (1)", "▸ Lịch sử" → **"Lịch sử · n"** (④ dùng `details.ls` chung ⑤ H4) | ⑤ H4 · `10` B |
| 35 | ③ ④ | ③ K5 (⋯); chữ ghi chú | "Tạm dừng/ Kết thúc học" → **"Tạm dừng / Kết thúc học"**, mục ⋯ chữ đỏ | ⑤ H2 · `10` B |
| 36 | ② ③ | ② tab Ý thức; ③ K1, K4a, K8 | Nút "+ Ghi vi phạm" → **"+ Vi phạm / Nhắc nhở"** (cùng chữ mục "+ Task") | `10` B |
| 37 | ④ | K5b (panel ô số) | Đầu panel "Chỉ số" → **"Báo cáo · chỉ đọc"** | ⑤ H1 · `10` B |
| 38 | ② | panel trượt (CSS) | Bề rộng panel 720 → **736** (cùng ①⑤) | `10` B |
| 39 | ② ⑤ | ② K7f; ⑤ B3 | Câu lỗi / hết việc theo mẫu ①: "⚠ Không tải được … · Thử lại"; "Hết việc Chấm điểm của bạn · Còn: Case học thuật · 3 việc · Việc tiếp ›" | `10` B |
| 40 | ⑤ | tiêu đề khung B | "dải 'Việc cần làm' hồ sơ lớp" → hồ sơ lớp dùng nút-chip (② đã duyệt) | `10` B |
| 40b | ⑤ | E2 (hộp nhập Writing) | Dòng chú thích "Writing = (W1 + 2×W2) / 3 · Task 1 6.0 → Writing 6.0 · kỳ vọng 5.5 ✓" → chỉ giữ dòng xem trước **"Task 1 6.0 → Writing 6.0 · kỳ vọng 5.5 ✓"**, công thức vào **ⓘ** cạnh dòng (như mockup ⑦) | luật bỏ chú thích tĩnh · PTA Overhaul 15/11 |
| 41 | CSS | `v21.css` | Dời nguyên văn từ `bang-mau.css`: ô chọn có tìm (`.oc*`), dải chỉ số + ô số (`.dai-cs`, `.oso`), badge mờ (`.bd.mo`), lịch sử (`details.ls`, `.ls-ds`), mục nguy hiểm `.menu-tha .nguy`; từ `ho-so-hv.css`: thang cấp bậc `.vach-bac` → ①–⑤ dùng MỘT bản | G2 "cùng thành phần" |
| 42 | ghi chú | `trang-dau-gv-ghi-chu.md` [XM-2], [XM-5] · `bang-mau-ghi-chu.md` [XM-15], bảng mục 3 · `ho-so-lop-ghi-chu.md` [XM-10] · `trang-dau-tvv-ghi-chu.md` [XM-7], [XM-10] | Ghi "ĐÃ CHỐT / ĐÃ XONG" theo lời 33 và mockup ⓪; bảng mục 3: bỏ `test/keHoach/XepTheoHocVien.tsx` khỏi danh sách `soMo`, bỏ `worklist/LamDongSoLieu.tsx` khỏi danh sách dải (giữ số to — [XM-11]) | R0.6 |

**GIỮ (không đổi, theo đề bài):** ③ dòng việc không tiền tố "Lớp ·" (R0.5) · ③ giữ TVV ở đầu hồ sơ, ② không (lời 25, 26) · ① hộp nhập điểm K2b giữ "Lưu · bài tiếp ›" (hộp ⑤ E, không phải panel) · ⑤ F1 menu "+ Task" giữ biểu tượng · Tổng quan QL / Phân tích giữ số to (không thuộc năm tệp này).

## 2. Bảng thao tác TRƯỚC → SAU (chỉ chỗ đổi)

| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| ① Bấm chip Chấm Speaking ở Lớp của tôi | mở panel Chấm Speaking | BỎ chip — vào tab Chấm Speaking | lời 20 (việc toàn chấm chéo) |
| ① Bấm chip "Báo cáo PH ›" | đổi trang → tab Báo cáo PH hồ sơ lớp | chip "Vận hành · n" → tab Vận hành, nhóm Báo cáo PH, nút "Viết ›" đổi trang | lời 20; thêm 1 bấm khi lớp chỉ có việc Báo cáo PH |
| ① Tab "Báo cáo PH" | tab riêng | nhóm trong tab Vận hành | lời 20 |
| ④ Lưu Báo PH rồi sang việc kế | 1 bấm "Lưu · việc tiếp ›" | 2 bấm: "Lưu" → "Việc tiếp ›" | ⑤ D2 một chân — [XM-⓪1] |
| ② Đóng panel khi chưa lưu | ✕ hoặc nền | ✕, nền hoặc nút "Đóng" (Việc tiếp › chỉ sau lưu) | ⑤ D2 |
| ② ④ Bấm số trong dải chỉ số | ② không bấm được; ④ bấm cả ô | ② "Đạt MT", "SOS" bấm → panel chỉ đọc; ④ bấm ô số (ô "Việc" không bấm), ô "›" vẫn đổi trang | ⑤ H3 |
| ① ② ④ Chọn em / GV chấm | gõ trong ô thường, danh sách gợi ý | ô chọn có tìm (gõ không dấu, nhóm liên quan trước, ✕ xoá) | lời 17 |

Không mất thao tác nào khác.

## 3. [XM]

1. **[XM-⓪1] ④ chân Báo PH mất nút gộp "Lưu · việc tiếp ›".** `10` B chọn theo ⑤ D2 ("Đóng" + nút chính; lưu xong "✓ Đã lưu" + "Việc tiếp ›") → thêm một bấm cho TVV khi làm hàng loạt Báo PH. Hộp nhập điểm (⑤ E) vẫn giữ "Lưu · bài tiếp ›". PTA chọn: giữ D2 như đã sửa, hay cho panel có nút gộp "Lưu · việc tiếp ›" ở mọi panel (đổi D2)?
2. **[XM-⓪2] Hộp "Tình hình học tập" ① K5c ↔ ⑤ F3.** ① K5c vẽ hộp đủ (chọn em + Nội dung + "Gửi TVV"); ⑤ F3 vẽ hộp chỉ chọn em + "Gửi tới" rồi "Tiếp" sang form khung phải. Đã đồng bộ ô chọn em (mẫu A) và chữ "Đóng"; chưa đổi chân vì hai mockup trả lời khác nhau "Nội dung nằm ở đâu". PTA chọn một (đề xuất: theo ① K5c — một hộp, ít bước hơn, đúng hộp v20 C đang có).
3. **[XM-⓪3] (đã xong theo chủ SP, mục 0)** Thang cấp bậc không chữ trong thanh; tên bậc viết đủ ở aria-label / title / "Thang ▾".
4. **[XM-⓪4] Số ở badge Chấm Speaking khung K6 (22/09)** — mockup cũ chỉ có số bài quá hạn (4); số bài tổng tự đặt "12" (dữ liệu bịa).
5. **[XM-⓪5] Badge tab Ý thức ở hồ sơ lớp khi người xem không có việc Ý thức** — vẽ mờ "1" (đếm em cần xử lý, thay chấm vàng cũ). Đúng nghĩa "mờ = chỉ đếm"; số lấy cùng nguồn chấm cũ (không thêm request).

Không [XM] nào đụng luật nghiệp vụ.

## 4. Tự rà R0.1–R0.7

| R | Yêu cầu | Kết quả | Chỗ xem |
|---|---|---|---|
| R0.1 | Sửa hết mục A: ① Báo cáo PH vào Vận hành · chip không biểu tượng · bỏ chip Chấm Speaking · "Chấm Speaking" · dòng việc "Lớp · tên việc" · badge Chấm Speaking mờ + ⚠ · "GV chấm" + bước chọn em mẫu A; ⑤ Q9, Q72; ⑤ D1 thang WL | Đạt — 11 dòng mục A đều sửa (dòng 1–15) | `anh/dong-bo/trang-dau-gv-*`, `bang-mau-d1a`, `bang-mau-d1b` |
| R0.2 | Sửa hết mục B theo cột "nên theo" | Đạt — chân panel (25, 26), câu quy chế (27–29), dải chỉ số (21, 22), badge tab (23), menu "+ Task" (24), hộp chọn em (11), câu lỗi / hết việc (39), lịch sử (34), "không hạn" (33), số đếm (30, 31), chip hạn (32), lặt vặt (35–38, 40, 42); tên bậc theo lời 35 (thắng cách PTA quyết ở `10` B) | bảng mục 1 |
| R0.3 | Chip / badge việc chỉ chữ loại + số, cả năm tệp | Đạt — ① ② ⑤ sửa; ③ ④ không có chip mang đơn vị (④ "Báo PH · 1", "Bổ sung hồ sơ ›") | dòng 19, 20 |
| R0.4 | Tên bậc VIẾT HOA; viết đủ ở chỗ nêu; ⑤ D1 có thang WL; ô mẫu viết đủ │ viết tắt | Đạt — ③ ④ viết hoa; ⑤ D1 có thang, mốc WL nổi bằng màu (không chữ — chủ SP mục 0); ⑤ H5 ô mẫu | dòng 15–18 |
| R0.5 | ③ giữ dòng việc không tiền tố, giữ TVV đầu hồ sơ; ② không TVV đầu trang | Đạt — không đổi | ③ K1, ② K1 |
| R0.6 | Cập nhật năm tệp ghi chú: ① [XM-2], [XM-5], ⑤ [XM-15], bảng kê ⑤ mục 3 | Đạt (dòng 42); ③ ghi chú không có [XM] cũ trái lời chốt | các `-ghi-chu.md` |
| R0.7 | Bảng "đã sửa gì" + ảnh cặp TRƯỚC │ SAU từng chỗ sửa; chỗ "chưa chắc" kiểm tận nơi | Đạt — bảng mục 1; ảnh `anh/dong-bo/`; dòng "chưa chắc" duy nhất (⑤ D1 thang WL) đã mở tệp kiểm: D1a / D1b chưa có thang → thêm | `anh/dong-bo/` |
| G3 | Không chú thích tĩnh, không bước xác nhận mới, không thành phần ngoài đề bài | Đạt — thêm duy nhất H5 (R0.4 yêu cầu) và dòng Bàn giao ở ① K6 (để số đếm Vận hành khớp) | |
| Turso | Không thêm request | Đạt — badge / số đếm dùng số đã có (cùng nguồn chip, chấm cũ) | |
