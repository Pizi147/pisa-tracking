# v21 ⑫ · GV gõ ít hơn — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/gv-viet-it.html` + `gv-viet-it.css` (phần mới; `v21.css` chỉ đọc). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/13-thiet-ke-dot-4.md` mục 1, 2 (H1–H4), 5 "⑫" (R12.1–R12.5), 6; luật chung G1–G5 (`11-de-bai-mockup-dot-2.md`); V22; lời 36, 40, 43–48.
**Nguyên tắc:** khung SAU = panel web hiện tại + đúng điểm R12.x, không gì khác. Gợi ý là KHUNG ghép từ chữ đã ghi trên web (`assessment_scores.comment`, `case_followups.note`, `sos_cases.summary`, `violations.description`, `discipline_measures.note`, Tình hình học tập) — **không AI, không tự điền ô**; GV bấm "Chèn" mới vào ô. Không có gì để gợi ý → không có khối.
Ảnh: `thiet-ke/v21/anh/gv-viet-it/` — `<khung>-1440-toi.png`, `<khung>-1440-sang.png`, `<khung>-375-sang.png` · **ảnh cặp `cap-<khung>.png`** = TRƯỚC │ SAU + một câu "đổi gì" (20 cặp) · `truoc/` = ảnh web thật.
TRƯỚC chụp từ web thật (seed, ngày demo 14/09/2026; vai GV 7 Trần Ngọc Hà · GV 9 Phạm Thu Trang · QL 2), dev ở cổng 4612 / 5612 của worktree (đã tắt). Seed không có bàn giao đổi GV → tạo một bản ghi trong DB demo cục bộ (bỏ qua git) để chụp `truoc/b-doi-gv-1440.png`. GV không đóng được Case nên web không hiện ô "Hoàn thành Case" cho GV → TRƯỚC của D chụp bằng vai QL. Phông Be Vietnam Pro đã nạp (`document.fonts.check` = true) trước mọi lần chụp. Soát tự động: không chữ < 12 px trong khung, không chữ / khung tràn ngang.

## 0. Lời chủ SP trong session này

(chưa có)

## 1. Khung

| Khung | Nội dung | R |
|---|---|---|
| A1 | Báo cáo PH · Reading (FT, Tháng 10) · khối "Bạn đã ghi tháng này" cạnh ô Đề xuất cải thiện — mặc định khi mở | R12.1 |
| A2 | Đã chèn: câu vào cuối ô (tô nhẹ), dòng nguồn "✓ Đã chèn", dưới ô "Hoàn tác chèn" 10 giây | R12.1 |
| A3 | Em chưa có gì để gợi ý: không có khối | R12.1 |
| A4 | Đang tải (không giữ chỗ) · lỗi tải (một dòng dưới ô, không chặn viết) | R12.1 |
| A6 | Lớp thường · em đã đủ (ô có chữ) → khối gập "Bạn đã ghi đợt này · 2 · Xem" | R12.1, lời 40 |
| A5 | Phần Chung của GVCN: nguồn vi phạm + xử lý ("· cô Lan ghi"), Tình hình học tập | R12.1 |
| B1 | GVBM · Bàn giao môn R (chuyển lớp, rộng 720 như web): dòng gợi ý + Chèn dưới ô trống, "Cùng GV", "Chèn cho 2 em", "Còn 3 em ↑" | R12.2 |
| B2 | Sau "Chèn cho 2 em": dải "✓ Đã chèn 2 em · Hoàn tác" | R12.2 |
| B3 | GVCN · bàn giao chuyển lớp: khối cạnh Nhận xét chung (0/15) + "Chèn cho 3 em" đầu danh sách; Môn n/n, Chưa làm · Tạm dừng học giữ | R12.2 |
| B4 | Bàn giao đổi GV: sau chèn hàng loạt, chip "Đã chèn", khối cạnh ô góp ý, "Nhận xét chung cả lớp", "Em tiếp ↓", "Xác nhận bàn giao" giữ | R12.2 |
| C1 | Công việc · tab Case học thuật: dòng gộp "MB FT 101 · Ghi kết quả PA · 6 em · Kỳ W1–W2 OCT" | R12.3 |
| C2 | Lưới Ghi kết quả PA: lỗi · nháp có quyết định Điều chỉnh · đang gõ thiếu (7/8) · sẵn lưu · chưa ghi · Kết quả cuối có Mini Test ("Mở đầy đủ") · đã lưu (gập) | R12.3 |
| C3 | Chân lưới theo trạng thái (đang lưu · dòng dở thành nháp · lưu một phần · đủ) · đang tải · lỗi tải | R12.3 |
| C4 | "Mở đầy đủ" → panel Ghi kết quả PA (dáng ① K4c, đủ ô web) thay chỗ lưới, "‹ Lưới MB FT 101 · 7 PA" | R12.3 |
| D1 | Kết thúc PA cuối (form như web: Quyết định · Ngày kết thúc · Kết luận có bộ đếm · Ghi ngày · Đổi): "Hoàn thành Case" bật sẵn | R12.4 |
| D2 · D3 | Bỏ tick → "Case còn mở · không hạn" · kết quả chưa đạt → tắt sẵn | R12.4 |
| E1–E4 | 375 sáng: Báo cáo PH · bàn giao GVBM (thẻ) · lưới → thẻ · Kết thúc PA cuối | R12.5 + 375 của R12.1–R12.4 |

## 2. Bảng truy vết — khung → thành phần → TRƯỚC → SAU

| Khung | Thành phần | TRƯỚC (web 15/11) | SAU (mockup) | GIỮ / ĐỔI / MỚI / BỎ |
|---|---|---|---|---|
| A1 · A5 | Đầu panel (loại "Báo cáo PH · viết", tên, đợt · n/N em đủ · hạn, ✕) | có | như web | GIỮ |
| A1 · A5 | Danh sách em trái (✓ đủ / nháp), Điểm + Sửa, "Cả n tiêu chí", từng tiêu chí 4 mức, "Đặt sẵn như {đợt}", tiêu chí đặt sẵn viền đứt | có (`TabBaoCaoPh.tsx` `PanelVietBc`, `FormEm`) | như web | GIỮ |
| A1 · A5 | Ô "Đề xuất cải thiện" / "Nhận xét chung" | ô trống, rộng hết cột (`formDau` — "ô chữ luôn trống") | ô vẫn TRỐNG khi mở; hẹp lại để khối đứng cạnh | GIỮ luật ô trống · ĐỔI bề rộng |
| A1 | **Khối "Bạn đã ghi tháng này"** | — | 280 px bên phải ô, nền lặng `surface-2`, viền 1 px; mỗi dòng: nguồn MỘT dòng 12 px (lượt · tuần · điểm / kỳ PA · Tiến triển; người khác ghi thì "· cô Lan ghi") + nút "Chèn" cùng dòng + câu đã ghi (≤ 3 dòng, chữ phụ) | MỚI (H1) |
| A2 | Chèn | — | thêm câu vào CUỐI ô (không đè chữ đang có), câu vừa chèn tô nhẹ tới khi gõ; dòng nguồn → "✓ Đã chèn"; dưới ô "✓ Đã chèn câu MT2 · Hoàn tác chèn" 10 giây (chỉ gỡ đúng đoạn đã chèn) | MỚI |
| A3 | Em không có nguồn | — | không có khối, ô rộng như web | MỚI (theo trạng thái, lời 40) |
| A4 | Tải khối | — | đang tải: không giữ chỗ, dưới ô "Đang tải chữ đã ghi…", ô gõ được ngay · lỗi: dưới ô "⚠ Không tải được chữ đã ghi · Thử lại" | MỚI |
| A6 | Khối khi ô đã có chữ / em đã đủ | — | gập một dòng "Bạn đã ghi tháng này / đợt này · n" + "Xem" | MỚI (lời 40) |
| A5 | Nguồn phần Chung | — | vi phạm (tuần · bậc · người ghi · mô tả + xử lý) và Tình hình học tập trong tháng | MỚI |
| A1 · A5 | Chân | "Tự lưu khi rời ô" · "Tiếp: {em}" · "Lưu · em tiếp ›" | thêm "Đóng" (chân chuẩn lời 36); "Tiếp:" là em CHƯA đủ kế tiếp | ĐỔI nhỏ |
| A1 · A5 | Dòng quy chế | "Final · W3 SEP · hạn 22/09" / "Bạn viết phần Chung · GV kỹ năng viết phần môn mình" | như web | GIỮ |
| B1 · B2 | Bảng GVBM rộng 720 (Học viên · Kết quả · Thông tin bàn giao), ô "Viết một câu…", "Cùng GV · không cần bàn giao", "● Đang gõ · lưu khi rời ô", "✓ Đã lưu", "Còn n em ↑", Việc tiếp › | có (`BanGiaoPanel.tsx` mẫu G) | như web; "Đóng" sang phải theo chân chuẩn lời 36 | GIỮ |
| B1 | **Dòng gợi ý dưới ô trống** | — | "nguồn · câu" (≤ 2 dòng, 12,5 px) + "Chèn"; ô đã có câu / "Cùng GV" / em không có nguồn: không có dòng | MỚI (H2) |
| B1 | **"Chèn cho n em"** | — | đầu bảng, phải; chỉ hiện khi ≥ 2 ô trống có gợi ý; chèn dòng đầu (MT gần nhất, không có thì Case) | MỚI |
| B2 | Sau chèn hàng loạt | — | ô có chữ, tự lưu như gõ; dải xanh "✓ Đã chèn 2 em · Hoàn tác" (10 giây) | MỚI |
| B3 | Panel GVCN: danh sách em (Môn n/n, Chưa làm · Tạm dừng học, ↑↓ đi từng em), Tự điền · chỉ đọc, câu GVBM từng môn + Điền thay, Nhận xét chung * (0/15), "GVCN xác nhận bàn giao" (mờ khi thiếu), "Môn còn trống sẽ ghi…" | có (mẫu F) | như web; khối "Bạn đã ghi tháng này" cạnh Nhận xét chung; "Chèn cho 3 em" đầu danh sách | GIỮ + MỚI |
| B4 | Panel đổi GV: "Nhận xét chung cả lớp · tuỳ chọn", danh sách em (Đủ / Chưa có), Tự điền, ô "R · Reading * bắt buộc", "Em tiếp: … ↓", "Còn n em thiếu góp ý ↑", "Xác nhận bàn giao" (mờ khi thiếu), quy chế "Hạn 5 ngày · xác nhận xong GV mới nhận tin" | có (`BanGiaoGvPanel.tsx`) | như web; khối cạnh ô góp ý; sau chèn hàng loạt em mang chip "Đã chèn" | GIỮ + MỚI |
| C1 | Dòng việc Ghi kết quả PA | mỗi em một dòng; ≥ 2 em cùng lớp gộp "Kết quả PA · lớp · n em · m việc" + khay "n em ▾" | cùng lớp **cùng kỳ** ≥ 2 em: "MB FT 101 · Ghi kết quả PA" + "6 em" + "Kỳ W1–W2 OCT", nút "Ghi kết quả" mở lưới (thay khay); 1 em: dòng lẻ như web | ĐỔI (H3) |
| C2 | **Lưới** | — (panel từng em) | một dòng một PA: em (link) · kỹ năng · PA · MT gần nhất │ 5 chip Tiến triển (đúng chữ web) + Nhận xét (≥ 8 ký tự; đang gõ thiếu hiện "Nhận xét ≥ 8 ký tự · 7/8") │ trạng thái (Chưa ghi · Thiếu nhận xét · Sẵn lưu · Nháp · ✓ Đã lưu · ⚠ Chưa lưu được) + nút "Mở đầy đủ" / "Sửa" / "Thử lại"; thứ tự lỗi → chưa xong → đã lưu (gập một dòng) | MỚI |
| C2 | Nháp đã chọn quyết định khác | — | nhãn "Điều chỉnh" + "nháp lưu 10:12 · Sửa PA này", không có ô; "Lưu" lưới KHÔNG đè | MỚI |
| C2 | Quyết định | segmented "Giữ nguyên · Điều chỉnh · Kết thúc PA" trong panel | lưới mặc định Giữ nguyên, nói ở dòng quy chế; đổi → "Mở đầy đủ" | ĐỔI chỗ (giữ đủ ở panel đầy đủ) |
| C2 | Dòng phức tạp (Kết quả cuối, Mini Test, PA Tutor theo buổi) | panel | không có ô trong lưới — một câu "cần gì" + "Mở đầy đủ" | MỚI |
| C2 · C3 | Lưu | "Lưu nháp" · "Lưu" từng PA | "Lưu nháp" (cả lưới) · "Lưu n dòng" (dòng Sẵn lưu) · "Lưu · việc tiếp ›" (lưu dòng sẵn + tự lưu nháp dòng dở; còn dòng dở thì ở lại lưới); lỗi báo tại dòng + "Thử lại"; chân "● Nháp · chưa lưu kết quả" như web | ĐỔI |
| C4 | Panel đầy đủ | `GhiKetQuaPanel` | dáng ① K4c (đã duyệt), giữ đủ ô web: Kết quả kỳ trước, Điểm ✓/✗, bộ đếm Nhận xét, Quyết định, Cách điều chỉnh + Lý do, Ghi ngày · Đổi; thêm "‹ Lưới MB FT 101 · 7 PA" (thay chỗ lưới, không lồng); nút chính "Lưu … · về lưới" | GIỮ + nút quay về |
| D1 | Quyết định "Kết thúc PA", Ngày kết thúc (ô gõ + nút lịch), bộ đếm, Ghi ngày · Đổi | có | như web | GIỮ |
| D1 | Ô tick "Hoàn thành Case" + "Sau cả đợt hỗ trợ, em tiến bộ đến đâu?" + "Kết luận" | có (`CapNhatTuan.tsx:617`), mặc định TẮT | mặc định BẬT khi PA cuối + đóng được + kết quả đạt; mức, kết luận điền sẵn | ĐỔI mặc định (H4) |
| D1 · D2 | Dòng quy chế | không nói về Case | bật: "Kết thúc PA · Case hoàn thành, mở lại được ở thẻ Case" · tắt: "Kết thúc PA · Case còn mở · không hạn" | ĐỔI |
| mọi khung | Chip hạn | `v21.css` có ⚠ | không ⚠ (V22) — `gv-viet-it.css` tắt `::before` | ĐỔI theo V22 |

## 3. Bảng thao tác TRƯỚC → SAU (không mất thao tác nào)

| Thao tác | TRƯỚC | SAU | Ghi chú |
|---|---|---|---|
| Viết phần Báo cáo PH | gõ vào ô trống | gõ, hoặc Chèn câu đã ghi rồi sửa | MỚI Chèn · Hoàn tác chèn |
| Đặt mức tiêu chí, "Cả n tiêu chí", Đặt nhanh, Sửa điểm / Về điểm gốc | có | có | GIỮ |
| Lưu · em tiếp ›, tự lưu khi rời ô, đi từng em | có | có (+ "Đóng" ở chân) | GIỮ |
| Viết hộ (QL), Xuất Excel / PDF, đợt (thêm / sửa / xoá / Không báo cáo) | có | có (ngoài khung, không đổi) | GIỮ |
| GVBM viết câu bàn giao | gõ từng ô | gõ, Chèn từng ô, hoặc "Chèn cho n em" | MỚI |
| "Cần làm lại" + "Giữ và lưu", "Không học {môn}", "Còn n em ↑", Việc tiếp › | có | có | GIỮ |
| GVCN viết Nhận xét chung, Viết / Điền thay câu GVBM, xác nhận từng em, Sửa → Huỷ thay đổi / Lưu, ↑↓ đi từng em | có | có (+ Chèn) | GIỮ |
| Đổi GV: góp ý từng em, Nhận xét chung cả lớp, Em tiếp ↓, Xác nhận bàn giao, Xác nhận · việc tiếp › | có | có (+ Chèn, Chèn cho n em) | GIỮ |
| Ghi kết quả PA từng em (panel) | có | có — qua "Mở đầy đủ" hoặc dòng lẻ | GIỮ |
| Ghi kết quả PA nhiều em cùng lớp | mở từng em trong khay | một lưới, lưu một lần | MỚI |
| Điều chỉnh / Sửa PA / Thay PA / Xin hỗ trợ QL / Đề xuất PA khác / Kết thúc PA | panel | panel đầy đủ (từ lưới: "Mở đầy đủ") | GIỮ |
| Mini Test, PA Tutor theo buổi, Kết quả cuối, Lý do chưa đủ dữ liệu, Ghi ngày · Đổi, Ngày kết thúc | panel | panel đầy đủ | GIỮ |
| Lưu nháp · xử lý xung đột nháp ("Dùng bản mới" / "Lưu bản của tôi") | panel | lưới có "Lưu nháp"; xung đột vẫn ở panel đầy đủ | GIỮ |
| Hoàn thành Case khi kết thúc PA cuối | tự tick | tick sẵn khi đạt, bỏ tick được | ĐỔI mặc định |
| Hoàn thành Case ở thẻ Case (nút riêng, lý do `chanHoanThanh`) | có | có | GIỮ |

Không thao tác nào bị bỏ.

## 4. [XM] cần PTA Overhaul chốt

- **[XM-1] Bàn giao môn của GVBM không có nút Xác nhận** (tự lưu khi rời ô). R12.2 viết "rồi GV rà (vẫn phải bấm Xác nhận như nay)" — đúng cho panel GVCN và panel đổi GV (nút giữ, B3 · B4). Ở bảng GVBM (B1 · B2) mockup cho "Chèn cho n em" **tự lưu như gõ** + dải "Đã chèn n em · Hoàn tác" 10 giây; không thêm bước xác nhận (luật 08/10). Chữ bàn giao là nội bộ, không gửi PH.
- **[XM-2] Chip "Đã chèn" ở panel đổi GV / GVCN** chỉ để GV biết em nào mới có chữ chèn, KHÔNG chặn Xác nhận; chip tự mất khi GV mở em đó hoặc sửa ô. Không thêm trạng thái máy chủ (chỉ ở giao diện, trong phiên). "Chèn cho n em" chèn dòng đầu của khối (MT gần nhất; không có thì Case).
- **[XM-3] "Kết quả cuối đạt" để bật sẵn Hoàn thành Case:** mockup dùng Tiến triển "Tiến bộ rõ" (PA có Mini Test: ≥ 70 %). "Tiến bộ một phần" → tắt sẵn. Cần PTA chốt (hoặc dùng điểm MT ≥ kỳ vọng).
- **[XM-4] Nhãn khối:** giữ chữ đề bài "Bạn đã ghi tháng này" (FT) dù vài nguồn do người khác ghi — nguồn đó thêm "· cô Lan ghi". Lớp thường = "Bạn đã ghi đợt này" (từ đợt trước). Bàn giao: 30 ngày gần nhất, nhãn giữ "tháng này". Critique gợi ý đổi thành "Đã ghi" — chưa đổi vì là chữ chủ SP đã nghe ở lời 48.
- **[XM-5] Chèn đưa vào ô CHỈ câu đã ghi**, không kèm nguồn (lượt, điểm) — điểm đã có dòng "Điểm" của báo cáo. Hai nguồn trùng câu → khối hiện một dòng.
- **[XM-6] Gộp lưới theo "cùng lớp, cùng kỳ":** hai kỳ khác nhau → hai dòng gộp. PA của GV khác không vào lưới của tôi. PA Tutor / Mini Test / Kết quả cuối vào lưới nhưng chỉ có "Mở đầy đủ".
- **[XM-7] Lượt đọc (LG-13a):** khối A / B gọi MỘT đường "chữ đã ghi" theo lớp khi mở panel (ước 3–4 câu, ≤ ~500 dòng); lưới C dùng dữ liệu `/my-work` + một câu đọc PA của lớp × kỳ (≈ số PA dòng) — thêm trần ở `tocDoDuong.ts`.
- **[XM-8] 375 lưới:** chân chỉ hai nút "Lưu nháp" · "Lưu · việc tiếp ›" (bỏ "Lưu n dòng" vì ba nút 44 px không vừa 343 px); "Lưu · việc tiếp ›" đã lưu dòng sẵn + nháp dòng dở, nên không mất thao tác.

## 4b. Critique (impeccable, 15/11) — hai đánh giá tách riêng

- **B · máy dò** (`impeccable detect`): 81 dấu, đều là giả (chú thích vàng `.so-mk`, token v21 máy dò không đọc được, nhóm nút 4 mức) hoặc thừa kế `v21.css` (`.dai-nhom`, `.viec.chon`). Đo trình duyệt: 0 chữ < 12 px, 0 tràn; tương phản chữ phụ ≥ 4,8 : 1 cả sáng / tối; vùng bấm 375 < 44 px → **đã sửa** (mọi nút, chip, Chèn, link 375 ≥ 44 px).
- **A · rà thiết kế** (Nielsen 27 / 40, không P0). **P1 đã sửa hết:** (1) form Kết thúc PA mất ô đang có → vẽ lại đủ Quyết định · Ngày kết thúc · bộ đếm · Ghi ngày · Đổi; (2) dòng lưới thiếu bị bỏ qua im lặng → trạng thái "Thiếu nhận xét 7/8", "Lưu · việc tiếp ›" tự lưu nháp dòng dở; (3) nút "Chèn cho n em" mất viền ở danh sách em → sửa CSS, rút chữ; (4) panel đầy đủ vẽ thiếu → vẽ theo ① K4c + đủ ô web. **P2 / P3 đã sửa:** khối nhẹ hơn (nguồn một dòng, câu chữ phụ, 280 px), tác giả khác "· cô Lan ghi", khối gập theo trạng thái (A6) + biến thể "đợt này", đang tải không giữ chỗ, tiêu chí đặt sẵn viền đứt, bảng GVBM 720 + "Cùng GV" + "Còn n em ↑", panel GVCN giữ Môn n/n · Chưa làm · ↑↓ · 0/15 · nút mờ, đã lưu gập + bỏ nền xanh 1440, nháp Điều chỉnh không bị đè, nút là nút, "● Nháp · chưa lưu kết quả", bỏ câu giải thích trong dải, bỏ nhãn "Mặc định", E1 vẽ đủ tiêu chí, "Tiếp:" về em chưa xong, E3 đủ trạng thái.
- **Giữ, có lý do:** nhãn khối ([XM-4]); 375 lưới hai nút ([XM-8]).

## 5. Soi ✕ / ⋯ (lệch tâm ≤ 1 px)

Đo bằng Playwright: tâm hộp chữ "✕" so tâm nút `.x` ở 12 khung có ✕ (a1, a5, b1, b3, b4, c2, c4, d1, e1–e4): **ngang 0 px · dọc −0,3 px** ở mọi khung. Không có "⋯" trong mockup này (không thêm menu).

## 6. Bảng tự rà từng dòng R

| R | Yêu cầu | Khung | Đạt |
|---|---|---|---|
| R12.1 | Panel viết một phần Báo cáo PH có khối "Bạn đã ghi tháng này" + "Chèn" | A1, E1 | ✓ |
| R12.1 | Trạng thái có gợi ý / đã chèn (sửa được, "Hoàn tác chèn") / không có gì (không khối) | A1, A2, A3 (+ A4 đang tải / lỗi, A6 gập khi đã có chữ) | ✓ |
| R12.1 | Phần Chung của GVCN | A5 | ✓ |
| R12.1 | Ô KHÔNG tự điền; không AI | A1 (ô trống khi mở), ghi chú đầu trang | ✓ |
| R12.2 | Bàn giao chuyển lớp (bảng em × môn): "Chèn" từng ô | B1, E2 | ✓ |
| R12.2 | "Chèn cho n em còn trống" một lần rồi GV rà; vẫn bấm Xác nhận như nay | B1, B2, B3, B4 | ✓ (GVBM không có Xác nhận — [XM-1]) |
| R12.2 | Bàn giao đổi GV | B4 | ✓ |
| R12.2 | Khối `TuDien` giữ | B3, B4 | ✓ |
| R12.3 | Dòng việc gộp ở Công việc → lưới | C1 → C2 | ✓ |
| R12.3 | Trạng thái dòng: chưa ghi / nháp / đã lưu / lỗi / "Mở đầy đủ" | C2, E3 | ✓ |
| R12.3 | "Lưu · việc tiếp ›"; "Lưu nháp" giữ; lưu từng dòng, lỗi dòng nào báo dòng đó | C2, C3 | ✓ |
| R12.3 | Dòng phức tạp → "Mở đầy đủ" = panel đang có | C2, C4 | ✓ |
| R12.4 | Form kết thúc PA cuối: "Hoàn thành Case" bật sẵn | D1, E4 | ✓ ([XM-3] định nghĩa "đạt") |
| R12.4 | Bỏ tick → dòng quy chế "Case còn mở · không hạn" | D2 | ✓ |
| R12.5 | 375: lưới thành thẻ | E3 | ✓ |
| chung | 1440 Tối + Sáng, 375 Sáng mỗi khung | ảnh `*-1440-toi`, `*-1440-sang`, `e*-375-sang` | ✓ |
| chung | Chân panel việc theo lời 36 | A, B, C, D | ✓ |
| chung | V22: hạn chỉ màu, không ⚠ | mọi chip hạn | ✓ |
| chung | Không chú thích tĩnh, không bước mới, không màn mới | — | ✓ |
| chung | Ảnh cặp TRƯỚC │ SAU + câu "đổi gì" mỗi khung | `cap-*.png` (20) | ✓ |
| chung | Critique: sửa hết P0 / P1 | mục 4b | ✓ |
