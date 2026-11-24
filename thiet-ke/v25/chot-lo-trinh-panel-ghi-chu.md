# v25 · Chốt lộ trình — panel 720 + trang Cuối khoá cân cột — ghi chú

Mockup: `chot-lo-trinh-panel.html` (mở bằng trình duyệt; mục lục A · A 1280 · A 375 · B). Ảnh: `anh/chot-lo-trinh-*.png` (12 ảnh).
Dữ liệu bịa: lớp **MB FOU 21**, 6 em, Final W1 SEP, hạn chốt 27/08/2026 (T5 tuần trước Final, N20), hôm nay thứ Hai 14/09/2026 (W2 SEP); QL Nguyễn Khánh Vy.
Chưa có code. Chờ chủ SP duyệt (CLAUDE.md: màn / luồng đổi phải có mockup duyệt trước).

## 1. Chủ SP 25/11 → đáp ở đâu

| Lời chủ SP (plan.md mục 4 #2121, ý 5) | Đáp |
|---|---|
| "Nhìn cách bố trí cột ở ảnh 4 … sửa lại cho cân đối" · "LUÔN LUÔN ĐỂ Ý ĐẾN CÂN ĐỐI HÀNG CỘT" | B1 · B2 · B3 (trang) và lưới panel A1–A7: mục 4 + số đo |
| "có cách nào cho việc chốt lộ trình thành 1 panel bên phải không?" · "không muốn bị direct sang trang khác nữa" | A1–A9: bấm dòng "Chốt lộ trình" → panel 720 bên phải, danh sách ở lại bên trái, không "›" |
| "Thiết kế hợp lý và có thể lược bỏ thông tin không cần thiết" | mục 3 (bỏ / gộp, kèm lý do) |
| "trang đó chỉ khi vào làm ở các đường khác thì ok" | Trang Cuối khoá giữ cho lối vào từ hồ sơ lớp / Tổng quan (B); ⋯ trong panel có "Mở ở trang riêng ›" |

## 2. Đã vẽ

| Ảnh | Nội dung |
|---|---|
| A1 · 1440 | Mặc định: gợi ý máy đã điền; dải Lên BE đã có lớp + tuần; Ngọc đã chốt Lên FT, MT0 + Kỳ vọng FT ở hộp dưới dòng; Gia Huy, Thịnh chưa có hướng; Khoa chờ chọn lớp |
| A2 · 1440 | Chọn tất cả (6 em) + "Ngay hôm nay": khung vàng, chân nêu tên em sẽ chuyển ngay |
| A3 · 1440 | Chọn dải Lên BE (3 em): thanh Áp + hộp chọn lớp có "+ Mở lớp mới…"; dòng "Reset bậc vi phạm" ở chân (N36) |
| A4 · 1440 | Chặn: Khoa chờ chọn lớp · Gia Huy Tạm dừng thiếu lý do · Ngọc Không đạt / Học viên thiếu phương án · Thịnh Lên FT hiện Target; chân "2 em cần sửa", Chốt chỉ 2 em hợp lệ |
| A5 · 1440 | Sau Chốt: 2 em chuyển ngay (rời lớp, thông báo **Hoàn tác**), 1 em lỗi → danh sách tự lọc "Lỗi", chân "Thử lại 1 em" |
| A6 · 1440 | Lọc Chưa chốt rỗng: "Mọi em đã chốt", chân thành "Việc tiếp ›"; menu ⋯ mở |
| A7 · 1280 | Danh sách 520 (dòng hai tầng) \| panel 720; hộp ⓘ mở; Ngọc đang "Sửa" (Bỏ sửa · Huỷ quyết định) |
| A8 · 375 | Panel toàn màn, thẻ mỗi em; "Sửa" mở ô tại thẻ (Thịnh đang mở) |
| A9 · 375 | Chọn 2 em: tấm Áp dưới, trên chân hai nút |
| B1–B3 | Trang Cuối khoá cân cột: 1440 (đang chọn 2 em, thanh Áp một hàng) · 1280 · 375 |

## 3. Panel: thiết kế

- **Mở từ**: dòng "Chốt lộ trình" ở tab Việc quản lý (bỏ "›"; "n em" không mũi tên = mở thẳng panel lưới). Panel 720 phủ phần phải (1440: danh sách 656 | panel 720; 1280: 520 | 720). Việc rời danh sách khi xong (N71: không chặn sớm, không ẩn vội).
- **Đầu một dòng** (khung chung v24): Chốt lộ trình · mã lớp (link hồ sơ) · n/n đã chốt · hạn (đỏ khi quá) · ⓘ · ⋯ · ✕.
- **Thân từ trên xuống**: thanh công cụ (☐ Chọn tất cả · n … Lọc: Chưa chốt · Xét lại · Còn bàn giao · Lỗi — chip chỉ hiện khi có) → **thanh Áp** (chỉ khi có em chọn: "n em đã chọn", Bước tiếp · Lớp · Tuần · Ngay hôm nay, Bỏ chọn; Kỳ vọng FT khi mọi em chọn đều Lên FT) → lưới → (chân) "Khi chốt".
- **Lưới 5 cột**: ☐ 28 · Học viên (co giãn, tối thiểu 176) · Final % 68 · ba ô nhập **112 bằng nhau** (Bước tiếp · Lớp mới · Tuần); ô cuối cách mép **14 px** (đo 15 gồm viền). Mọi dòng, dải nhóm, hộp dưới dòng là subgrid của MỘT lưới nên thẳng cột tuyệt đối.
- **Em đã chốt lên đầu lưới, ngoài dải** (Ngọc, Lên FT): dải nhóm chỉ gồm em còn sửa được, nên chọn dải không tick em đã chốt.
- **Dải nhóm** (≥ 2 em cùng gợi ý Lên / Học lại, luật 11/11): ☐ chọn cả nhóm · tên nhóm · n em · **Lớp + Tuần cho cả nhóm đặt đúng cột Lớp / Tuần**. Dòng trong nhóm hiện lớp / tuần dạng ô **mờ** (không viền, có mũi tên; rê = viền) nên một nhóm nhìn là một khối. Em ngoài dải: ô viền đầy đủ + nhãn nhỏ dưới tên (Học lại FOU · Head cân nhắc · Chờ Final).
- **Ngoại lệ**: sửa ngay trên dòng (ô Bước tiếp / Lớp / Tuần của em) — cùng phép Áp-rồi-sửa như trang, em ngoài dải tự thành ô viền.
- **Hộp dưới dòng** (chỉ khi cần, cùng bề ngang từ cột Học viên): em đã chốt Lên FT → MT0 (✓/✗ band · mốc) + Kỳ vọng FT [Đạt][Không đạt] + Nguyên nhân + Kỹ năng / Phương án; Tạm dừng → "Có thể quay lại học" + tuần xem lại + Lý do; Lên FT chưa có Target → Target + KCK; em đã chốt đang "Sửa" → Bỏ sửa · Huỷ quyết định. Lỗi báo ngay cạnh ô sai (chữ + ⚠, không chỉ màu).
- **Chân dính** (khung chung, trái = "Khi chốt", phải = Lưu nháp · Chốt · n em): dòng 1 = n em sẵn sàng · n → lớp · bắt đầu tuần; dòng 2 = tác động (Case bổ trợ, Báo PH, Case Tutor FT) và việc còn thiếu (⚠ chờ chọn lớp · cần sửa · chưa có hướng); dòng 3 chỉ khi có em đang có bậc vi phạm = ô "Reset bậc vi phạm". Một em lỗi giữ dòng + lý do, chân thành "Thử lại n em" (Đóng · Thử lại).
- **Ngay hôm nay** (N22 ③): không hộp xác nhận thêm — khung vàng "⚠ Chuyển ngay khi chốt · có Hoàn tác" ở thanh Áp, **tên em sẽ chuyển** nằm ngay ở chân (A2), sau Chốt có thông báo **Hoàn tác** một lời gọi cho cả lô.
- **Số đo** (Playwright, 12 khung, máy dò chữ tràn ô / lòi khung / lề phải): **0 lỗi**. Panel: tâm cột Final lệch **0 px** giữa các dòng, ba ô 112 / 112 / 112, lề phải 15 px. Trang 1440: tên 259,4 · Final, MT0, Kỳ vọng FT mỗi cột 129,7 (căn giữa) · ba ô 194,5 · lề phải 16 px; 1280: tên 230 · 112,3 · 168,4 · 16 px.

## 4. Trang Cuối khoá: cân cột (B)

| | Trước (`CuoiKhoaLop.tsx` `LUOI`) | Sau |
|---|---|---|
| Cột | 28 · tên `minmax(260,1fr)` · 92 · 92 · 92 · 148 · 148 · 148 | 28 · tên **2 phần** (≥ 230) · Final · MT0 · Kỳ vọng FT **1 phần mỗi cột** · Bước tiếp · Lớp · Tuần **1,5 phần mỗi ô** |
| Tên ở 1440 (thẻ rộng 1392) | ≈ 514 px (37 % bề ngang, chữ tên dài nhất ≈ 170) — nuốt hết chỗ thừa | **259 px** |
| Tên ở 1280 | ≈ 354 px | **230 px** |
| Cột số | 92 px, dính trái cột tên | 129,7 (1440) / 112,3 (1280), căn giữa |
| Ô nhập | 148 px | 194,5 (1440) / 168,4 (1280) |
| Ô cuối | sát lề 16 | sát lề 16 |

Cùng bảng, cùng thao tác, cùng hộp dưới dòng (Kỳ vọng FT từ cột Kỳ vọng tới Tuần). 375: thẻ như panel.

## 5. Bỏ / gộp — và vì sao

| Thông tin ở trang | Ở panel | Lý do |
|---|---|---|
| Cột MT0 + cột Kỳ vọng FT cho mọi em | **Chỉ em Lên FT**, trong hộp dưới dòng (MT0 · mốc · Kỳ vọng) | 5/6 em ô "—"; Kỳ vọng chỉ có ở em đã Lên FT (N17 / N22) và chỉ QL chốt |
| Dải "Kỳ vọng FT · n em đạt · n em chờ MT0" | Bỏ | Đếm lại điều đã thấy ở từng hộp; luật Kỳ vọng FT vào ⓘ |
| "‹ MB FOU 21" quay lại, tiêu đề "Cuối khoá · MB FOU 21" | ✕ + danh sách ở lại; tiêu đề "Chốt lộ trình" (đúng tên việc) | Không còn đổi trang |
| Meta "FOU · 6 em · Final W1 SEP · GVCN …" | Còn mã lớp · n/n đã chốt · hạn; phần còn lại vào ⓘ | Không dùng để quyết định |
| Câu quy chế (`qcChot`) + NutLuat Kỳ vọng FT | Gộp một ⓘ ở đầu panel | Đã là ⓘ; không tăng chữ |
| "hạn dd/mm/yyyy" cạnh chip Chờ bàn giao | Bỏ ngày ở dòng, chip còn | Chen vào ô Final ở 720; hạn bàn giao xem ở panel Bàn giao như cũ |
| Hàng nhãn nhóm dưới tên cho em lẻ | Giữ (nhãn nhỏ); nhóm ≥ 2 em dùng dải | Luật 11/11 |
| "Đổi lớp" (link ẩn khi rê) | Ô lớp / tuần mờ, rê = viền | Một cách sửa, thấy rõ hơn |
| Cột Bước tiếp rộng 148 | 112, ô hiện "Tạm dừng", menu hiện đủ "Tạm dừng / Kết thúc học" | Ba ô bằng nhau (NH9) |
| Ô tuần + nút "Ngay hôm nay" ở thanh Áp | Nút bật thì ô Tuần mờ đi (một điều khiển); dòng ghi đủ "Ngay hôm nay" (ô không mũi tên cho vừa 112 px) | Một khái niệm một tên |
| Dải "Kỳ vọng FT · …" ở trang | Bỏ ở cả trang (B) | Đếm lại điều đã có ở cột + hộp từng em; luật nằm ở ⓘ |

Không bỏ thao tác nào. Mọi thao tác TRƯỚC → SAU:

| Thao tác | Trước (trang) | Sau (panel) |
|---|---|---|
| Vào chốt | Bấm "›" → đổi trang | Bấm dòng → panel |
| Chọn tất cả / theo nhóm / từng em | Có | Giữ (☐ tất cả, ☐ dải nhóm, ☐ dòng) |
| Lọc Chưa chốt · Xét lại · Còn bàn giao · Lỗi | Có | Giữ (chip chỉ hiện khi có) |
| Áp chung rồi sửa ngoại lệ | Thanh Áp (Bước tiếp · Lớp · Tuần · Kỳ vọng) | Giữ nguyên thứ tự, thanh Áp 2 hàng |
| Bước tiếp từng em · chọn lớp (gõ tìm, chi nhánh khác sau, + Mở lớp mới…) · tuần | Có | Giữ |
| "Ngay hôm nay" | Nút cạnh ô tuần, khung vàng | Giữ; tên em hiện ở chân; Hoàn tác |
| Lưu nháp · Chốt · n em · Thử lại n em · Đóng | Chân dính | Giữ |
| Reset bậc vi phạm (N36) | Dòng trong chân | Giữ, dòng 3 của "Khi chốt" khi có em có bậc |
| Kỳ vọng FT (Đạt / Không đạt, nguyên nhân, kỹ năng, phương án) | Cột + hộp dưới dòng | Giữ, trong hộp dưới dòng của em Lên FT |
| Target + KCK, Tạm dừng (quay lại học, tuần xem lại), Lý do | Hộp dưới dòng | Giữ |
| Sửa · Bỏ sửa · Huỷ quyết định (có lý do, Hoàn tác) | Có | Giữ (A7) |
| Chip Chờ bàn giao → mở Bàn giao | Có | Giữ — xem [XM1] |
| Hoàn tác chuyển ngay | Thông báo | Giữ (A5) |
| Mở trang Cuối khoá đầy đủ | — | Mới: ⋯ → "Mở ở trang riêng ›" — [XM4] |
| Việc tiếp sau khi xong | — | Mới: chân thành "Việc tiếp ›" (khung chung) |

## 6. Còn mở — cần PTA / chủ SP xem ([XM])

- **[XM1] Panel lồng panel.** Hai chỗ hiện mở panel riêng: chip Chờ bàn giao (`BanGiaoPanel`) và "+ Mở lớp mới…" (`ClassCreatePanel`). Luật "không panel lồng panel": đề xuất **thay trong cùng khe 720** có "‹ Quay lại Chốt lộ trình", phần đã sửa chưa lưu giữ nguyên (đã có chặn rời nháp); lớp mới tạo xong điền thẳng vào ô lớp. Mockup chưa vẽ hai màn thay này (khuôn là khung panel v24).
- **[XM2] Xác nhận nêu tên em (N22 ③) vs Hoàn tác (DUONG-LUI-2, code hiện hành).** Mockup theo code: không hộp xác nhận; tên em chuyển ngay nằm ở chân + Hoàn tác. Muốn hộp xác nhận thì nói; mất thêm một bấm.
- **[XM3] Panel chỉ cho QL** (`coTheRaLenh`). GVCN (nhận xét) và vai chỉ đọc không có việc "Chốt lộ trình" trong Công việc, nên họ vẫn dùng trang Cuối khoá (B) — giả định, chưa vẽ panel cho họ.
- **[XM4] ⋯ có hai mục:** "Mở ở trang riêng ›" (mới, lối ra bảng rộng) và "Gia hạn" (khung chung, [XM2] của v24). Nếu chủ SP muốn ⋯ chỉ 1 mục thì bỏ "Mở ở trang riêng".
- **[XM5] Nhãn ô.** "Tạm dừng" thay cho "Tạm dừng / Kết thúc học" trong ô 112 px; menu và tooltip giữ đủ chữ. Nếu muốn ô rộng hơn thì giảm cột Học viên (còn 177 → ≥ 160 mới không cắt tên dài nhất).
- **[XM6] Nhóm "Chờ Final" chốt trước Final** được (N22), mockup hiện nhãn "Chờ Final" nhỏ dưới tên, không dải — giữ luật 11/11.
- **[XM8] Trang giữ cột MT0 + Kỳ vọng FT** (đề bài: "cùng bảng") nhưng 5/6 em ô "—" (~20 % bề ngang). Khuyến nghị: trang cũng gập hai cột này vào hộp dưới dòng như panel cho một kiểu duy nhất — chủ SP quyết.
- **[XM9] A5:** sau khi 2 em chuyển ngay rời lớp, mẫu số "n/6" thành "n/4" (lớp còn 4 em).
- **[XM7]** Tên em, nhãn, hạn trong mockup là minh hoạ; khi code lấy đúng trường đang có.

## 7. Skill đã chạy

- `impeccable`: `context` → `shape` (khung dưới) → `critique` (một lượt rà độc lập bằng ảnh, không nhận kết luận của người vẽ): **panel 29/40, trang 26/40, không P0**; P1 đã sửa: nhóm Lên BE lẫn em đã chốt · ba tên cho "Ngay hôm nay" · "sẵn sàng" tính khác nhau giữa B1 / B2 · chip lọc mất ở 375 · vùng bấm 375 · Kỳ vọng FT lặp ba chỗ ở trang · P2 rẻ: chip lọc không sáng khi chưa lọc, ✓ ở chip đang chọn, em chưa hướng ghi "—", nhận xét GVCN 2 dòng, A6 bớt lặp "6/6" + lối "Xem lộ trình đã chốt ›", nút Ngay hôm nay đủ tương phản. Lượt 2 sau sửa: xem mô tả PR.
- `ui-ux-pro-max` (domain ux): hành động chính một chỗ (Chốt), lỗi cạnh ô sai, vùng bấm 44 ở 375, trạng thái không chỉ màu (✓ ✗ ⚠ + chữ).
- Chuẩn nội bộ: NH9 luật cột, NH10 khung 720, N17 / N20 / N21 / N22 / N25 / N36 / N71, v24 `cong-viec-gon-ghi-chu.md`.

### shape — tóm tắt

- Người dùng: QL chi nhánh, ngồi máy tính ở trung tâm, chốt cả lớp một lần sau Final; cũng phải xong trên 375.
- Việc cần làm trong một lượt: nhìn gợi ý máy → áp chung → sửa vài ngoại lệ → bấm Chốt (một bước, theo lô). Không bước thêm.
- Thông tin quyết định: Final, gợi ý, lớp đích, tuần; MT0 / Kỳ vọng chỉ khi Lên FT.
- Hình thức: Operate — dày thông tin nhưng một lưới, một kiểu ô, cột thẳng; nhấn (accent) chỉ cho dòng đang chọn, thanh Áp và nút Chốt.
