# Mockup v21 ⑪ · Chuông mới + vi phạm — ghi chú

Mockup: `thiet-ke/v21/chuong-vi-pham.html` + `chuong-vi-pham.css` (token, thành phần: `v21.css` chỉ đọc). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/13-thiet-ke-dot-4.md` mục 1, 3, 4, 5 "⑪", 6 · lời chủ SP 33, 36, 40, 43–48 · luật chung G1–G5 (`11-de-bai-mockup-dot-2.md`) · `DESIGN.md` V22.
Ảnh: `thiet-ke/v21/anh/chuong-vi-pham/` — `{khung}-{toi|sang}.png` (1440 Tối + Sáng, 375 Sáng), `truoc/` = web hiện tại (seed, ngày demo 14/09/2026), `cap-*.png` = ảnh cặp TRƯỚC │ SAU kèm một câu "đổi gì". Chụp bằng chrome-headless-shell có sẵn; `document.fonts.check` Be Vietnam Pro + Inter = true. Soát tự động mọi khung: không phần tử tràn ngang, không chữ < 12 px, không lỗi console.

## 0. Lời chủ SP trong session này

- 15/11, sau khi PTA Overhaul gửi ảnh cặp và session đã áp 4 chỉnh (commit 722f2f949):
  > "ok nhé"

  Session hiểu: chủ SP duyệt mockup ⑪ như bản hiện tại trên PR #1726. Đã chuyển lại PTA Overhaul; PR không tự merge.

## 0b. PTA Overhaul rà (15/11) — đã áp

PTA Overhaul rà qua cap-k1, k3, k5, k6: **ĐẠT hướng**. Quyết [XM]: 1 đồng ý (việc + panel tên "Xử lý vi phạm"; nút vẫn "Xác nhận xử lý") · 2 KHÔNG (→ chỉnh 2) · 3–9 đồng ý. Bốn chỉnh, đã sửa:
1. Form giữ tiêu đề **"Vi phạm / Nhắc nhở"** (lời 17, web đang dùng) ở mọi khung — K5a–d, K8c.
2. "Không xử lý" = việc XONG → em **không** còn ở "Chưa xong"; xuống "Các em khác", khối em vẫn hiện vi phạm + "Không xử lý · «lý do»", đếm "n / 3 trong 2 tuần", nút "Xác nhận xử lý" tại đó; đủ 3 → lên lại nhóm cần xử lý như luật cũ. Hồ sơ HV **không** thêm nhóm: vi phạm ở Lịch sử, nút tại dòng — K7a, K7b.
3. Cập nhật: ✓ và ⌄ của tin gom **không viền lúc nghỉ**, viền khi rê / focus; 375 vùng chạm vẫn 44 — K1, K3, K4, K8.
4. `cap-k1-chuong.png` SAU = trạng thái mặc định (mọi thanh đóng, gom đóng); mở một thanh + mở tin gom ở ảnh cặp riêng `cap-k1b-mo-thanh.png`.

## 1. Khung

| Khung | Nội dung | R |
|---|---|---|
| K1a / K1b | Chuông GVCN 1440: mọi thanh đóng (bấm thử ⌄, gom, ✓, Đã xem hết) · một thanh mở + tin gom lớp mở | R11.1, R11.3 |
| K2a / K2b | Bấm thanh → Công việc tab Ý thức & Phối hợp · bấm việc trong phần mở → cùng trang, dòng đang chọn + panel Xử lý vi phạm | R11.2, R11.5 |
| K3a–c | Cập nhật: GV bộ môn nhận "GVCN không xử lý · lý do" · vừa "Đã xem hết" (Hoàn tác 10 giây) · Xem tất cả | R11.3 |
| K4a–g | Trạng thái chuông: hết việc · chỉ có Cập nhật · rỗng · đang tải · lỗi; vai TVV, QL | R11.1 |
| K5a–d | Form "Vi phạm / Nhắc nhở": công tắc tắt · bật · Chỉ nhắc nhở (ẩn) · GVCN tự ghi (ẩn) — bấm thử ở K5a | R11.4 |
| K6a–c | Panel Xử lý vi phạm lối Không xử lý: đang gõ · lý do trống báo lỗi · lưu xong + Hoàn tác (bấm thử hai lối ở K6a) | R11.5 |
| K7a / K7b | Tab Ý thức hồ sơ lớp (dáng web hiện tại) + hồ sơ HV (③) | R11.6 |
| K8a–d | 375 Sáng: chuông toàn màn đóng · một thanh mở · form công tắc bật · panel Không xử lý | R11.7 |

## 2. Bảng truy vết khung → thành phần → TRƯỚC → SAU

| Khung | Thành phần | TRƯỚC (web / mockup nền) | SAU | GIỮ / BỎ / ĐỔI |
|---|---|---|---|---|
| K1 | Nút chuông | số = quá hạn + hôm nay; chấm khi có tin (khi không có số) | số giữ luật cũ; tin chưa xem → chấm hồng góc trái, KHÔNG cộng số, có cả khi đang có số | GIỮ số · ĐỔI chấm |
| K1 | Đầu khối việc | "Việc cần làm · 9 quá hạn · 33 việc" + "Công việc ›" | "Việc cần làm" + "Công việc ›" hàng 1; "13 việc · 4 quá hạn · 1 hôm nay" hàng 2 (màu, không ⚠ — V22) | GIỮ (bảng mẫu G) |
| K1 | Danh sách việc | một dòng mỗi LOẠI việc (Nhập điểm, Thiếu PA, Kết quả PA, Xem vi phạm mới…) + "›" | **một thanh mỗi TAB Công việc** (Chấm điểm · Case học thuật · Ý thức & Phối hợp · Vận hành), cùng thứ tự; "n việc" + **badge viên tròn đúng như badge tab** (đỏ = số quá hạn · vàng = số hôm nay · không viên khi chưa tới); "›" mờ sau tên tab | ĐỔI (lời 47 ý 4) |
| K1 | Đích bấm thanh | trang Công việc đúng tab của loại | trang Công việc đúng tab (giữ); tên tab có "›" mờ (= đổi trang), ô ⌄ tách bằng vạch dọc + nền nghỉ | GIỮ |
| K1 | Nút ⌄ cuối thanh | — | mở tại chỗ ≤ 3 việc gấp nhất: "Lớp · việc" + thẻ phụ (em, nguồn) + hạn; "+ n việc ›" → tab; một lúc một thanh | MỚI |
| K1 | Dòng Chấm Speaking | không có | không có (việc chung, không đếm — giữ) | GIỮ |
| K1 | "● n mới" của loại việc | có (localStorage) | bỏ khỏi thanh (thanh theo tab; việc mới đã nằm trong phần mở theo hạn) — [XM-3] | BỎ (hỏi) |
| K3 | Khối Cập nhật | hai hàng (loại · giờ / nội dung) + "›"; "n chưa đọc"; "Xem tất cả ›" | giữ hai hàng + lớp ở hàng trên; "›" → **✓ đã xem** (không viền lúc nghỉ); "n mới"; **"Đã xem hết"** (Hoàn tác 10 giây); "Xem tất cả ›" | GIỮ dáng · ĐỔI cuối tin |
| K3 | Tin vi phạm | việc "Xem vi phạm mới" ở khối việc | tin "Vi phạm mới" / "Nhắc nhở" (chữ loại tin màu đỏ cho vi phạm); ≥ 2 tin vi phạm cùng lớp chưa xem → gom "3 vi phạm mới · MB FT 101": ⌄ = mở từng em (cùng luật ⌄ với thanh), bấm dòng = tab Ý thức của lớp, ✓ từng em / cả nhóm | ĐỔI (luật D2 mới) |
| K3 | Tin "GVCN không xử lý" | — | cho người ghi: "Vi phạm · MB FT 101" / "GVCN không xử lý · em · «lý do»" — hai hàng, không cắt lý do | MỚI (lời 48) |
| K3 | Tin TVV đã báo PH | có | giữ | GIỮ |
| K4 | Hết việc / rỗng / tải / lỗi | v2 B4, B7 | giữ dáng; câu lỗi chuẩn "⚠ Không tải được … · Thử lại" | GIỮ |
| K4 | TVV, QL | dòng theo loại; QL có Chờ duyệt | thanh theo tab của vai; QL giữ "Chờ bạn duyệt"; vi phạm ở lớp chưa có GVCN → tin tới QL | ĐỔI theo K1 |
| K2a | Công việc tab Ý thức & Phối hợp | "Xem vi phạm mới · 3 em ▾" (Đã xem từng em) + "Xử lý vi phạm · 3 em ▾" | bỏ "Xem vi phạm mới"; "Xử lý vi phạm" giữ; việc do được yêu cầu có thẻ phụ "Vũ Thu Lan yêu cầu", hạn 5 ngày | BỎ / MỚI |
| K5 | Form "Vi phạm / Nhắc nhở" (tiêu đề giữ) | Vi phạm │ Chỉ nhắc nhở · Học viên · Nhóm · Vi phạm 0/60 · Môn · Ngày · Mô tả · + Thêm vi phạm · Bằng chứng · quy chế "GVCN nhận việc xem…" | giữ hết; thêm **một dòng công tắc "Yêu cầu GVCN xử lý"** ngay trên dòng quy chế (tên GVCN cuối dòng); quy chế đổi theo công tắc | GIỮ + MỚI |
| K5 | Gợi ý "Tự điền môn bạn dạy lớp này" | có (chữ dưới ô Môn) | bỏ chữ (bỏ chú thích tĩnh — ① K5d); môn vẫn tự điền | BỎ chữ, GIỮ hành vi |
| K6 | Panel việc vi phạm | "Xem vi phạm mới" (Đã xem · 1, Đã xem · việc tiếp ›, Xác nhận xử lý) · "Xác nhận xử lý" (Vi phạm đưa vào, 4 cách, Ngày, Người thực hiện) | panel **"Xử lý vi phạm"**: khối vi phạm được yêu cầu (người ghi, ngày, môn, mô tả, đếm 1 / 3) + hai lối **Xác nhận xử lý │ Không xử lý**; lối Xác nhận = panel đang có (mockup vẽ rút gọn như ⑤ D1a) | BỎ "Xem" · MỚI lối |
| K6 | Lý do Không xử lý | — | ô "Lý do *" (gửi người ghi), ≥ 8 ký tự, báo tại ô; lưu xong "✓ Đã lưu · Không xử lý" + Hoàn tác 10 giây + Việc tiếp › | MỚI |
| K7a | Tab Ý thức lớp — cột Bước | "Chưa xem · hạn" + "Đã xem · 1" + "Xác nhận xử lý" | bỏ "Chưa xem", "Đã xem · n"; vi phạm lẻ: "Trong 2 tuần: 1 / 3" + "Xác nhận xử lý"; được yêu cầu: viên "Vũ Thu Lan yêu cầu · hạn 19/09" + "Xử lý" | BỎ / ĐỔI |
| K7a | Cột Đã xử lý | — / biện pháp | thêm trạng thái "Không xử lý · 11/09" (viên viền đứt) + lý do; cột Bước vẫn "Xác nhận xử lý" | MỚI |
| K7a | Nhóm "Chưa xong" (em chưa xử lý lên đầu) | em có việc Chưa xem / bắt buộc / … | chỉ em **có việc đang chờ** (bắt buộc, được yêu cầu); em đã "Không xử lý" hoặc chỉ có vi phạm lẻ không việc → "Các em khác" (khối em vẫn hiện vi phạm, trạng thái, nút); đủ 3 → lên lại (PTA quyết XM-2) | ĐỔI |
| K7b | Hồ sơ HV — Việc cần làm "Xem 1 vi phạm mới · Đã xem" | có | bỏ | BỎ |
| K7b | Khối Ý thức của em | "Đang chờ" (Chưa xem · Đã xem · 1) | không thêm nhóm: "Đang chờ" chỉ khi có việc; vi phạm không việc (mới, Không xử lý) nằm ở **Lịch sử** với trạng thái + lý do + "Xác nhận xử lý" tại dòng; "Trong 2 tuần: 2 / 3 vi phạm" cạnh thang | ĐỔI |
| K8 | 375 | chuông neo hộp 70 vh; form panel toàn màn | chuông **toàn màn** dưới thanh trên ("Thông báo" + ✕ dính); thanh 52, ⌄ / ✓ 44; form công tắc hai hàng | ĐỔI (R11.7) |

## 3. Bảng thao tác TRƯỚC → SAU

| Vai | Thao tác TRƯỚC | SAU | Ghi chú |
|---|---|---|---|
| GVCN | Mở chuông → bấm một loại việc → Công việc đúng tab | Mở chuông → bấm thanh tab → Công việc đúng tab | giữ, đổi đơn vị dòng (loại → tab) |
| GVCN | — | Mở chuông → ⌄ → thấy 3 việc gấp nhất → bấm một việc → panel việc mở thẳng | MỚI (bớt một lần chuyển trang + một lần tìm) |
| GVCN | Việc "Xem vi phạm mới" → "Đã xem · 1" / "Đã xem · việc tiếp ›" | **BỎ**: vi phạm do người khác ghi = tin Cập nhật; "xem" = bấm tin (mở đúng em, tab Ý thức) hoặc ✓ | **mất có chủ ý** — lời 47 ý 3 + mục 8 "Ok": bỏ việc "Đã xem" vi phạm, GV "xem" thông báo vi phạm ở chuông |
| GVCN | Tab Ý thức lớp / hồ sơ HV: nút "Đã xem · n" | BỎ (như trên) | cùng lý do |
| GVCN | Xác nhận xử lý ở tab Ý thức / panel | giữ, mọi lúc (kể cả sau Không xử lý) | lời 48 |
| GVCN | — | Việc "Xử lý vi phạm" do được yêu cầu: Xác nhận xử lý hoặc Không xử lý + lý do | MỚI (lời 47 ý 5, lời 48) |
| GVCN | — | Hoàn tác Không xử lý trong 10 giây; lịch sử ghi | như mọi nơi |
| Mọi vai | Tin: bấm tin "›" | bấm tin = mở đối tượng + đã xem; ✓ = chỉ đánh dấu đã xem; "Đã xem hết" + Hoàn tác | ✓ / Đã xem hết MỚI |
| Mọi vai | Xem tất cả Cập nhật | giữ | |
| GV bộ môn | Ghi vi phạm → GVCN có việc xem | Ghi vi phạm → GVCN nhận tin; bật "Yêu cầu GVCN xử lý" → GVCN có việc Xử lý vi phạm, hạn 5 ngày | công tắc MỚI, mặc định tắt |
| GV bộ môn | — | Nhận tin "GVCN không xử lý · lý do"; không có vòng trao đổi trên web | lời 48 "báo lại là xong" |
| Mọi vai ghi | + Thêm vi phạm, Bằng chứng (+ Tệp, + Liên kết), Chỉ nhắc nhở | giữ hết | |

Không mất thao tác nào khác.

## 4. [XM] — cần PTA Overhaul / chủ SP quyết

PTA Overhaul đã quyết (15/11): XM-1 đồng ý · XM-2 KHÔNG (xem mục 0b chỉnh 2) · XM-3 … XM-9 đồng ý.

- **[XM-1] Tên việc / panel "Xử lý vi phạm" vs "Xác nhận xử lý".** Web: loại việc `yt_xu_ly` = "Xử lý vi phạm", panel = "Xác nhận xử lý"; bảng mẫu ⑤ G2 viết dòng việc "Xác nhận xử lý". Mockup: dòng việc + tiêu đề panel = **"Xử lý vi phạm"** (khớp đề bài + chuông), hai lối bên trong = "Xác nhận xử lý" │ "Không xử lý". Đề xuất dùng một tên "Xử lý vi phạm" cho việc ở mọi nơi.
- **[XM-2] Vi phạm "Không xử lý" ở tab Ý thức lớp nằm nhóm nào.** ~~Đề xuất: ở lại "Chưa xong"; hồ sơ HV nhóm mới "Chưa xử lý".~~ **PTA quyết: KHÔNG** — việc đã xong thì không nơi nào báo chờ: em xuống "Các em khác", vi phạm vẫn hiện + đếm luật + nút Xác nhận xử lý; hồ sơ HV dùng nhóm đang có (Lịch sử). Đã sửa.
- **[XM-3] "● n mới" của chuông v2.** Thanh theo tab không còn chỗ cho "● n mới" theo loại (mới chỉ ở localStorage). Mockup bỏ; việc mới vẫn thấy trong phần mở (xếp theo hạn). Muốn giữ: chấm nhỏ cạnh tên tab khi tab có việc mới.
- **[XM-4] "›" trên thanh.** Phác chữ lời 47 vẽ thanh không "›"; critique chỉ ra người dùng (nhất là 375, không có rê chuột) không biết bấm thanh là đổi trang. Mockup: "›" mờ NGAY SAU tên tab (G2: "›" = đổi trang), cách xa ô ⌄ (ô ⌄ tách bằng vạch dọc, có nền nghỉ). Chủ SP muốn bỏ "›" thì chỉ xoá một ký tự.
- **[XM-8] Bấm dòng tin gom → đâu.** Mockup: dòng "3 vi phạm mới · MB FT 101" = mở tab Ý thức của lớp đó (như tin đơn mở đúng em); ⌄ = xem từng em tại chỗ. Đề bài ghi "bấm mở ra" — đã đổi để "⌄ = mở" một nghĩa trong cả hộp.
- **[XM-9] Badge thanh = badge tab.** Tab chỉ có MỘT viên (đỏ nếu có quá hạn, không thì vàng nếu có hôm nay); thanh chép đúng viên đó + "n việc". Việc "hôm nay" của tab đang có quá hạn chỉ thấy ở đầu khối ("1 hôm nay") và trong phần mở. Muốn thấy cả hai: hai viên (đỏ + vàng) trên thanh — khác tab.
- **[XM-5] Tab Công việc của QL / TVV.** Mockup lấy tên tab từ web (`TAB_CONG_VIEC_LABEL`: Chờ bạn duyệt · Hỗ trợ học viên · Vận hành) và mockup TVV (Báo PH · Bổ sung hồ sơ · Chốt ngày thi · Sau thi). Session code lấy đúng danh sách tab theo vai từ `tabCongViecHienThi`.
- **[XM-6] Chỉ nhắc nhở → GVCN có nhận tin?** Đề bài mục 3: "Chỉ nhắc nhở cũng là tin" → mockup K5c quy chế "Không tính vào bậc · GVCN nhận tin ở chuông" (thay câu ① K5e "không sinh việc"). Tin nhắc nhở không gom với tin vi phạm.
- **[XM-7] Lối Xác nhận xử lý vẽ rút gọn.** Mockup vẽ như ⑤ D1a (2 cách). Web đang có "Vi phạm đưa vào" (tick), 4 cách, Ngày, Người thực hiện — giữ nguyên khi code; vi phạm được yêu cầu luôn được tick sẵn.

## 5. Bảng tự rà từng dòng R

| R | Yêu cầu | Khung | Đạt |
|---|---|---|---|
| R11.1 | Chuông theo mục 4: thanh theo tab; đóng / một thanh mở / hết việc / chỉ Cập nhật / rỗng / đang tải / lỗi | K1a, K1b, K4a–e, K8a, K8b | Đạt |
| R11.1 | Cùng tên, thứ tự, số, màu badge với tab; tab rỗng không thanh; không thanh Chấm Speaking; TVV / QL theo tab vai, QL giữ "Chờ bạn duyệt" | K1, K2a (so tab), K3a (GV bộ môn 2 thanh), K4f, K4g | Đạt |
| R11.1 | "⌄" (không "›"), ≤ 3 việc "Lớp · việc · hạn", "+ n việc", một lúc một thanh | K1b, bấm thử K1a | Đạt |
| R11.1 | Số chuông giữ luật cũ, tin chưa xem = chấm nhỏ không cộng số | K1, K4b (chỉ chấm) | Đạt |
| R11.2 | Bấm thanh → Công việc đúng tab; bấm việc → panel; vẽ cả hai đích | K2a, K2b | Đạt |
| R11.3 | Tin vi phạm đơn + gom lớp; "GVCN không xử lý · lý do"; TVV đã báo PH; ✓ / Đã xem hết / Xem tất cả | K1b, K3a, K3b, K3c | Đạt |
| R11.4 | Công tắc "Yêu cầu GVCN xử lý" một dòng, nổi bật; quy chế đổi (bật "GVCN có việc Xử lý vi phạm, hạn 19/09" · tắt "GVCN nhận tin ở chuông"); ẩn khi Chỉ nhắc nhở / người ghi là GVCN | K5a–d, K8c | Đạt |
| R11.5 | Dòng việc ghi nguồn "Vũ Thu Lan yêu cầu"; panel hai lối; lý do bắt buộc; câu quy chế "Người ghi nhận lý do · vi phạm vẫn tính vào luật 3 vi phạm / 2 tuần" | K2a, K2b, K6a–c, K8d | Đạt |
| R11.6 | Tab Ý thức lớp + hồ sơ HV: không "Đã xem"; "Không xử lý" có trạng thái + lý do + "Xác nhận xử lý"; em chưa xử lý lên đầu | K7a, K7b | Đạt (theo PTA quyết XM-2: em có việc chờ lên đầu; Không xử lý = xong, xuống Các em khác) |
| R11.7 | 375 chuông toàn màn + form | K8a–d | Đạt |
| V22 | Hạn chỉ màu, không ⚠ ở chip / badge / số hạn | mọi khung (⚠ chỉ ở câu lỗi K4e, K6b) | Đạt |
| G2 | Dùng lại thành phần chuẩn: dòng việc, panel + dòng quy chế + chân "Lưu · việc tiếp ›", công tắc đoạn, hộp chuông v2, khối Ý thức ③ | mọi khung | Đạt |
| G3 | Không chú thích tĩnh, không bước xác nhận cho thao tác thường | — | Đạt (Đã xem hết dùng Hoàn tác, không hỏi) |
| Lời 40 | Thông tin theo trạng thái: công tắc chỉ khi có ý nghĩa; tin đã xem không có ✓; chỉ có tin → chỉ chấm; Không xử lý = xong, không hạn, không ở nhóm chờ | K4, K5c/d, K7 | Đạt |

## 6. Số đo ✕ / ⌄ / ✓ (tâm nét so với tâm nút)

Đo bằng script trên trang (getBoundingClientRect, 1600 × 1000, cả 1440 và 375; đo lại sau chỉnh PTA): ⌄ 34 nút — lệch tối đa **0,00 px** · ✓ 27 nút — **0,00 px** · ✕ 12 nút — **0,33 px**. ⌄ và ✓ là SVG 16 × 16 (nét đối xứng quanh (8, 8) trong viewBox) đặt `place-items:center` trong nút vuông 36 / 32 (375: 44); ✕ là chữ trong nút 36 / 44 như v21. Mọi giá trị ≤ 1 px.

## 7. Dòng đọc Turso

Không thêm request: thanh + phần mở lấy từ `/my-work` đã nạp (0 câu); tin Cập nhật nạp khi mở chuông như nay (`/notifications`), gom theo lớp làm ở máy khách. ✓ / Đã xem hết = ghi `read_at` (ghi, không đọc thêm). Panel Xử lý vi phạm dùng dữ liệu panel Xác nhận xử lý đang có + cờ yêu cầu (LG-12: một cột).

## 8. Critique (impeccable) — đã chạy `distill`, `layout`, `clarify` khi dựng

Method: dual-agent (A: rà thiết kế độc lập · B: bộ dò `impeccable detect` + đo trên trình duyệt).

**Điểm: 29 / 40, không P0.** Heuristic: trạng thái 3 · khớp thực tế 3 · kiểm soát 3 · nhất quán 2 · phòng lỗi 3 · nhận ra hơn nhớ 3 · hiệu quả 3 · tối giản 3 · sửa lỗi 3 · trợ giúp 3.

| Mức | Vấn đề | Đã làm |
|---|---|---|
| P1 | Bấm thanh = đổi trang không lộ (chỉ thấy ⌄; 375 không có rê) | "›" mờ sau tên tab; ô ⌄ có vạch dọc + nền nghỉ ([XM-4]) |
| P1 | Dòng gom ngược luật: bấm dòng = mở, ⌄ chỉ trang trí | ⌄ thành nút mở thật; dòng = tab Ý thức lớp ([XM-8]) |
| P1 | Chữ "Vi phạm mới" màu đỏ lẫn với đỏ quá hạn (V22); chip thanh khác badge tab | bỏ đỏ (chấm chưa xem đã đủ); thanh dùng đúng viên badge tab ([XM-9]) |
| P2 | Lưu xong Không xử lý vẫn hiện "hạn 19/09" | thay bằng viên "Không xử lý" |
| P2 | Đã xem hết: không đếm giây; nhóm gom biến mất | "Hoàn tác · 9 giây" như panel; nhóm giữ, hiện đã xem |
| P2 | Không có thanh Chấm Speaking | GIỮ — đã chốt ở đề bài mục 4 |
| P3 | Chấm xám ở dòng việc mở giống chấm chưa xem | bỏ |
| P3 | K4e còn chấm tin khi tin lỗi; hai kiểu lỗi | bỏ chấm; một kiểu câu lỗi |
| P3 | 375: đoạn 40 px, ô lý do một dòng | đoạn 44, ô lý do 96 px |
| P3 | Dữ liệu Âu Nhật Nam lệch giữa chuông / K7 | thống nhất (10/09 Không xử lý 11/09, 14/09 mới) |
| P3 | Hộp cao ~835 px khi mở một thanh + một nhóm | giữ: K1b cố ý mở cả hai để vẽ; dùng thật thường mở một |

Bộ dò B: 46 phát hiện — 34 tương phản ở chấm số vàng của chú thích mockup (`.so-mk`, không lên web) · 2 phông "không có trong DESIGN.md" (Be Vietnam Pro + Inter đã khoá — sai) · 8 màu / bán kính của phần chú thích · `side-tab` ở `.viec.chon` (v21.css, dòng đang chọn chuẩn) và `.yt-dong.cho` (đã xoá khỏi css riêng). Trình duyệt: 0 chữ < 12 px, 0 tương phản < 4,5 cả Sáng và Tối. Vùng bấm 375 < 44 (✕, ⓘ, nút chọn nhóm, link "+ Tệp", đoạn, chip em) → đã nâng lên 44 trong css riêng; công tắc "Yêu cầu GVCN xử lý" nhỏ (40 × 24) nhưng cả dòng 56 px là vùng bấm (khi code: `<label>` bọc).
