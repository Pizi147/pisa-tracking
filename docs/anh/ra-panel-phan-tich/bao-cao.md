# Rà panel số ở Phân tích + Tổng quan — báo cáo (24/11/2026)

Chủ SP 24/11: *"kiểm tra lại các panels hiện lên khi bấm số ở các trang phân tích xem đã phù hợp chưa, có bị to quá, nhỏ quá, thiếu/thừa thông tin, hay thông tin không liên quan, hay không cần thông tin không? đề xuất nhé. Các con số có cần phải để trong badge không, bạn thấy như thế nào dễ nhìn và đẹp hơn?"*

Hiện trạng: main `f3ca7708d`, ngày demo 14/09/2026, vai Head (Nguyễn Khánh Vy · Monbay) + Quản trị. Ảnh và số đo: [danh-sach.md](danh-sach.md) (136 loại ô số · 32 khuôn panel có ảnh 3 cỡ). Không sửa mã web / máy chủ.

## 1. Trả lời ngắn

| Câu hỏi | Trả lời | Bằng chứng |
|---|---|---|
| Panel có to quá không? | **Có, gần như mọi panel.** Chỉ có 2 cỡ cố định: 1080 × 803 (75 % màn) cho 89 / 136 loại ô, 835 × 803 (58 %) cho 43 loại — bất kể 1 hay 51 dòng. 102 / 132 panel ở dữ liệu demo có ≤ 8 dòng. | `thi-01` 2 dòng trống ~85 % · `cn-09` 3 dòng ~88 % · `gv-06` 1 dòng ~93 % · `yt-04` 2 dòng ~88 % |
| Có nhỏ quá không? | Không panel nào nhỏ quá. Thứ duy nhất vừa nội dung là hộp Tuần dạy (404 × 208, `thi-12`). | |
| Thừa thông tin? | **Có.** Cột Lớp lặp khi tiêu đề đã có lớp · "dữ liệu đến 14/09" ở gần mọi đầu panel (trang đã ghi) · nút "Đóng" cạnh ✕ · badge "Chưa làm · quá 5 ngày" lặp nghĩa với cột Hạn và tab "Chưa làm" · số 31 hiện 3 lần ở `sos-06`. | mục 3 |
| Không liên quan? | **Có.** Bấm "51 học viên đang học" ra điểm L R W S từng em (`cn-01`) · bấm "Chưa đạt · L" ra đủ R W S OVR (`thi-04`) · bấm "Chưa chốt PA" ra cả 2 ô "Đang chạy 0 · Chờ kết quả cuối 0" (`sos-06`). | mục 3 |
| Thiếu? | **Có.** `sos-06`: 31 Case chỉ thấy 4 (mỗi nhóm 2 dòng rồi "+ 25 Case"), Case quá hạn không nằm trong 4 dòng đó · `cn-05`: bấm "40 % tăng" nhưng màn đầu là lượt giảm / giữ · `tq-05`: 3 dòng cùng chữ, không có GV nợ điểm · `tq-06`: ô "4 em" mở ra 4 việc, không có tên em. | mục 3 |
| Cột có cân không? | **Không.** Cột tên nuốt hết phần thừa (374–755 px cho tên ~130 px), các cột số dồn sát mép phải; `yt-01`, `yt-09` thừa 176–234 px ở cột cuối. | mục 4 |
| Số có cần badge / ô viền? | **Không.** 85 / 136 loại ô số đang là ô viền 40 × 30; màn SOS có 109 nút số, gần hết là ô viền. Đề xuất: **số trơn** — chi tiết mục 5, vẽ ở mockup đợt hai. | `sos-0-trang-1440`, `thi-0-trang-1440` |

## 2. Cách rà

- **Chụp + đo** bằng Playwright (Edge): mỗi màn chụp cả trang, rồi bấm một ô của từng loại (cùng khối, cùng cột), chụp cả màn lúc panel mở ở 1440 × 900 tối · 1280 × 800 tối · 375 × 812 sáng; đo bề rộng × cao panel, bề rộng từng cột, số dòng, phần cuộn. 428 ảnh thô → giữ 129 ảnh (32 khuôn panel khác nhau × 3 cỡ + 33 ảnh trang).
- **`impeccable critique`** — Method: dual-agent (A: rà thiết kế trên 44 ảnh · B: máy dò `impeccable detect` 12 tệp + `detect.js` trên 3 panel + số đo tương phản / vùng bấm / bàn phím). Hai lượt không thấy kết quả của nhau.
- **`ui-ux-pro-max`**: luật áp dụng — `number-tabular` (số trong cột dùng chữ số đều bề rộng) · `touch-target-size` (≥ 44) · `color-not-decorative-only` · `truncation-strategy` · `drill-down-consistency` (đường lui rõ) · `modal-escape`. Tra "badge / bảng số / panel" trong kho không ra luật riêng — phần còn lại là nhận xét của người rà.
- **`dataviz`**: bảng nhiều lớp giá trị → giữ BẢNG, không đổi sang biểu đồ; chữ số mang màu chữ, màu trạng thái dành cho trạng thái; tỉ lệ cạnh con số → "thanh chia đoạn mảnh". Bộ kiểm màu: `--ok` cạnh `--accent` ở nền tối chỉ cách ΔE 11,3 (dưới ngưỡng 15) → không dùng hai màu đó cạnh nhau làm hai đoạn.
- **`web-design-guidelines`** (Vercel Web Interface Guidelines): áp cho mockup đợt hai; ở hiện trạng đã đo các mục `tabular-nums`, vùng bấm, focus, `overscroll-behavior` (mục 6).

## 3. Rà từng nhóm panel

Điểm = Nielsen, chấm khắt khe, 8 tiêu chí áp dụng (bỏ 5 "ngăn lỗi" và 9 "sửa lỗi" — panel chỉ đọc) → **/ 32**. Đa số giao diện thật 16–26 / 32.

| Nhóm (ảnh) | Cỡ so nội dung | Thừa | Thiếu / không liên quan | Mỗi dòng có lý do? (N30) | Cột | Dòng · phân trang | Hành động trong panel | Điểm |
|---|---|---|---|---|---|---|---|---|
| **1 · Bảng điểm theo lượt** — Đạt MT, Lượt MT, SOS n, Dưới kỳ vọng, thi thật, Đạt Test, Cuối khoá (`cn-04` `sos-01` `thi-01` `thi-04` `cn-thuong-06` `sos-thuong-01`) | 1080 × 803. Ít dòng trống 80–85 %; nhiều dòng vẫn trống ~25 % ngang. Che luôn bảng nguồn. | Cột Lớp lặp · hàng chip lớp "CP FT 110 1 · UB FT 401 1" cho 2 dòng · dòng "10 lượt · 10 HV" ngay dưới tab "Chưa đạt 10" · cột Bài "Final Test" ở mọi dòng Cuối khoá · "dữ liệu đến 14/09" · "Đóng" | Số theo MỘT kỹ năng vẫn ra đủ 9–10 cột · `sos-01` 53 lượt không gom theo em (một em 2 dòng rời) · bấm "57 % Đạt MT" mở sẵn tab "Chưa đạt" · tiêu đề "HV · L" khó hiểu | Có — tốt nhất bộ (✓ / ✗ + màu từng kỹ năng, tô nền cột vừa bấm) | Cột tên 374–430 px, thừa ~270 px; `cn-thuong-06` ba bảng con lệch cột nhau | 20 dòng + "Xem thêm 20"; dòng 64 px vì ô MT hai tầng | Tab Đạt / Chưa đạt · ô điểm là NÚT (mở hộp Tuần dạy đè lên panel) · link tên, lớp, MT | **21** |
| **2 · Danh sách học viên dạng dòng** — HV đang học, Vào / Kết thúc, Chưa có KQ, SOS (`cn-01` `tq-01`) | 835 × 803. 51 em × 71 px, cuộn ~3 600 px; mỗi dòng trống ~32 % ngang | Điểm L R W S + Overall / KV ở danh sách "đang học" | "Đang học / Vào học / Kết thúc" thiếu đúng mốc của mình (tuần vào, ngày + lý do kết thúc) · không gom theo lớp · không tiêu đề cột | `tq-01` (SOS) có · `cn-01` không | ~265 px rỗng giữa "S 6.0" và "Overall" ở mọi dòng | 20 + "Xem thêm 20 học viên" | Link tên | **15** |
| **3 · Tiến bộ** (`cn-05` `cn-09`) | 1080 × 803. `cn-09` 3 dòng trống ~88 % | Cột Kỳ vọng + ✓ / ✗ ở cột Sau (chuyện "đạt kỳ vọng", không phải "tiến bộ") · tên lặp tới 5 dòng | Không có tab Tăng / Giữ / Giảm; 14 lượt tăng nằm dưới, phải cuộn 357 px | `cn-09` có · `cn-05` không (màn đầu là giảm / giữ) | **Tệ nhất bộ**: cột tên 546–626 px, thừa 400–480 px | 20 + xem thêm | Link | **18** |
| **4 · Case / PA** (`sos-06` `sos-21`) | 1080 × 803. `sos-06` trống ~45 % ngang; `sos-21` vừa | Số 31 hiện 3 lần · 2 ô phễu "0" ngoài tập vừa bấm · "Chưa có mô tả" lặp ở mọi dòng · cột Hạn rỗng | 31 Case chỉ thấy 4; Case quá hạn bị giấu sau "+ 25 Case" | `sos-21` có (cột Kết quả) · `sos-06` nửa vời | `sos-06` cột Case 509 px cho ~180 px chữ; `sos-21` cân nhất bộ | Mỗi nhóm 2 dòng + "+ n Case" | Lọc theo bước · "+ n Case" · link | **18** |
| **5 · Giáo viên** (`gv-01` `gv-03` `gv-06`) | 1080 / 835 × 803. `gv-06` 1 dòng trống ~93 %; `gv-01` ~800 px rỗng giữa chữ và badge | `gv-03`: 3 / 4 cột là hằng số trên mọi dòng (Bài, Hạn, Trạng thái) · badge **"Chưa làm · quá 5 ngày"** (trái luật hạn 24/11) · tab rỗng không số đếm | — | Có, nhưng nói bằng badge "quá n ngày"; ngày ở cột Hạn lại màu trắng | Cột tên 456–493 px, thừa ~360 px | Không phân trang | Tab Chưa làm / Làm muộn / Đúng hạn · **"Sao chép việc quá hạn để nhắn"** · "Hồ sơ GV ›" | **16** |
| **6 · Ý thức** (`yt-01` `yt-02` `yt-04` `yt-08`) | 1080 × 803. `yt-01` 5 dòng trống ~70 %, `yt-04` ~88 % | `yt-01` và `yt-04` **lặp lại bảng đang có ngay trên trang** (và ít thông tin hơn) · cột Lớp "MB FT 101" ở mọi dòng khi tiêu đề đã là "MB FT 101 · …" · Người ghi | `yt-01`: thẻ ghi "3 bắt buộc xử lý · 1 chờ Head duyệt" nhưng panel không chỉ ra em nào | `yt-02` `yt-08` có | **Thừa ở cột cuối**: `yt-01` 176 px, `yt-09` 234 px; `yt-04` ~330 px giữa GVCN và số | 20 + "Xem thêm 20 mục" | Link | **18** |
| **7 · Tổng quan — việc** (`tq-02` `tq-04` `tq-05` `tq-06`) | 835 × 803. 3–4 dòng trống 75–80 % | Tiêu đề lặp ở đầu thẻ · tên lớp 2–3 lần một dòng · badge "quá hạn 68 ngày" | `tq-05`: 3 dòng cùng chữ, không tên bài / tuần / GV · `tq-06`: không tên em · đơn vị lệch (ô "52 bài" ↔ panel "15 việc") | Một phần | Không phải bảng; ~400 px rỗng giữa chữ và hạn | — | Dòng mở việc (đúng — Tổng quan là nơi làm) · "Công việc · … ›" | **14** |
| **8 · Hộp Tuần dạy** (`thi-12`) | 404 × 208 — **vừa nội dung**, neo cạnh ô; 375 thành tờ đáy | Thanh + "22/22 tuần" + "100 %" nói một điều ba lần | Tiêu đề thiếu ✓ / ✗ và Target | Trả lời câu khác ("ai dạy") | — | — | Đổi kỹ năng L R W S | **23** |

Nhóm 7 thuộc Tổng quan / Công việc (đang được session mockup-v24-cv vẽ lại) — báo cáo này chỉ ghi nhận, không đề xuất riêng.

## 4. Số đo cột (1440, đo bằng script)

| Panel | Rộng panel | Cột tên | Chữ dài nhất ~ | Thừa trong cột tên | Các cột còn lại |
|---|---|---|---|---|---|
| `cn-09` Tiến bộ L · Tăng (3 dòng) | 1080 | 626 | 130 | **~480** | 93 · 81 · 98 · 65 · 76 dồn phải |
| `cn-05` Tiến bộ | 1080 | 546 | 130 | ~400 | 93 · 76 · 83 · 99 · 65 · 76 |
| `cn-thuong-10` Đạt Test · lớp (1 dòng) | 1080 | **755** | 120 | **~620** | 125 · 85 · 73 |
| `gv-03` S chéo chung | 1080 | 493 | 130 | ~360 | 264 · 111 · 171 |
| `cn-04` / `sos-01` / `thi-01` bảng điểm | 1080 | 407–424 | 140 | ~270 | 9 cột 61–105 |
| `sos-06` Chưa chốt PA | 1080 | 200 | — | cột Case 509 cho ~180 px chữ | 180 · 150 (Hạn rỗng) |
| `yt-01` HV cần chú ý | 1080 | 327 | 130 | ~190 | cột cuối 304, **thừa 176 ở mép phải** |
| `yt-09` HV có vi phạm · lớp | 1080 | 269 | 130 | ~130 | cột cuối 362, **thừa 234 ở mép phải** |
| `yt-04` Lớp có vi phạm | 1080 | 311 | 80 | ~230 | GVCN 445 (thừa ~330) · 116 · 77 · 91 |

Gốc: bảng `width: 100 %` trong panel rộng cố định, cột tên (hoặc cột chữ cuối) nhận hết phần thừa. Sửa theo LUẬT CỘT: cột tên vừa chữ (180–220), các cột còn lại chia đều, số căn phải, cột cuối sát mép phải; ít cột thì thu khung.

## 5. Số trên trang — có cần badge không

| | Hiện trạng (đo trên 136 loại ô số) |
|---|---|
| Dáng | **15 dáng** cho một khái niệm: ô viền chữ 12 / 14 / 16 / 20 px đậm 400 / 600 / 700 (85 loại) · số trơn 12 / 14 / 20 / 26 / 40 / 48 px (51 loại) |
| "Có viền = bấm được"? | **Không còn đúng.** Số to đầu trang (51, 57 %, 53) trơn mà bấm được; bảng Giáo viên ở Tổng quan số trơn bấm được; `gv` "100 %" có viền đứng cạnh "62 %" trơn không bấm; bảng Lớp cần chú ý có 3 dáng trong một bảng |
| Viền gánh nhiều nghĩa | Viền xanh = bấm được · nền vàng / cam / đỏ = mức SOS · viền vàng nâu = thiếu điểm / chưa chốt PA — trong khi tiêu đề cột đã là chip "SOS 1 / 2 / 3" |
| Mật độ | Bảng "Theo tuần" (SOS): 109 nút số trên một màn, gần hết là ô viền; số 1 và số 53 cùng một ô 40 × 30 → mất cảm giác lớn nhỏ; số căn giữa nên hàng đơn vị không thẳng cột |
| Nhịp dòng | "Từng kỹ năng": ô viền + % dưới → dòng 67 px cho 4 dòng dữ liệu |
| Chỗ xấu nhất | Ô viền chèn giữa câu: "vào [3] · kết thúc [1] trong kỳ", "Chưa có KQ [0]" (`cn-0-trang-1440`) |
| Đang đúng — giữ | Số 0 xám, không viền, không bấm |
| Vùng bấm 375 | Hộp nút 40 × 30 nhưng vùng thật 44 × 44 nhờ `::after` (Thi thật 37 / 37, SOS 77 / 77 đạt). **Ý thức 375: 9 / 22 nút chỉ 44 × 26** (nút xếp dọc cách nhau 26 px) |
| Lỗi nhìn thấy | SOS › Theo tuần, hàng W3 SEP: chữ "14/09/2026–20/09/2026 · tuần này" rộng 209 px trong cột 196 px, **đè lên ô số đầu** (nút còn 40 × 18) |

**Đề xuất: bỏ ô viền, số là chữ số.** Cả hai lượt rà cùng kết luận này; khác nhau ở MÀU của số bấm được:

| | B · màu nhấn (ý PTA) | C · màu chữ chính (ý lượt rà A) |
|---|---|---|
| Bấm được | Chữ số 15 px đậm 600 **màu nhấn** | Chữ số 15 px đậm 600 **màu chữ chính** |
| Không bấm (Điểm TB, %) | Màu chữ, thường | Màu phụ, thường |
| % phụ | Nhỏ, **dưới** số (dòng ~50 px) | Nhỏ, **cùng dòng** sau số (dòng ~40 px) |
| Được | Nhìn là biết số nào bấm được; cột số thẳng một hàng | Dày hơn; không đụng màu trạng thái; giống bảng Lớp cần chú ý vừa duyệt |
| Mất | Bảng nhiều số thành mảng xanh; đứng cạnh đỏ / vàng trạng thái | Chưa rê thì không có dấu "bấm được" ngoài độ đậm |

Chung cho cả hai: rê / bàn phím = gạch chân + nền nhấn nhạt · số 0 mờ, không bấm · màu đỏ / vàng / SOS chỉ ở cột vốn là trạng thái (chữ, không nền) · số căn phải, chữ số đều bề rộng · vùng bấm vô hình ≥ 32 × 32 (375: 44 × 44) · bỏ ô viền chèn trong câu.
Mockup đợt hai vẽ A (hiện tại) · B · C cạnh nhau trên bảng "Từng kỹ năng" + "Theo GV" để chủ SP chọn bằng mắt. **Người rà khuyến nghị B** (lý do ở ghi chú mockup).

## 6. Vấn đề ưu tiên

Không có P0.

| # | Mức | Vấn đề | Hại gì | Sửa |
|---|---|---|---|---|
| 1 | **P1** | Panel một cỡ 835 / 1080 × 803, không theo nội dung | Che 58–75 % màn kể cả bảng nguồn → mất dấu ô vừa bấm, phải đóng mở để so; 2 dòng dữ liệu giữa mảng trống trông như lỗi tải. Đúng điều chủ SP vừa chê ở panel Công việc | Khung theo nội dung: rộng theo số cột (không còn 1080), cao theo số dòng; trang phía sau vẫn đọc được |
| 2 | **P1** | Dòng không nói lý do, hoặc nói thứ không liên quan (`cn-01`, `cn-05`, `sos-06`, `yt-01`, `tq-05`, `tq-06`) | Trái N30. Head mở ra vẫn phải sang trang khác mới biết em nào, gọi ai | Mỗi loại số một bộ cột tối thiểu = đúng lý do; tab mở sẵn phần con số đếm; quá hạn lên đầu, không giấu sau "+ n" |
| 3 | **P1** | Cột lệch: cột tên nuốt 270–620 px, cột số co cụm bên phải; `yt-01` / `yt-09` thừa ở cột cuối | Mắt băng ngang 300–500 px rỗng để nối tên với số, dễ nhầm dòng. Chủ SP: "rất khó chịu" | LUẬT CỘT (mục 4) |
| 4 | P2 | Chữ lặp + hạn sai luật: badge "quá n ngày" ở 8 panel · Lớp lặp · "dữ liệu đến…" · "Đóng" + ✕ · tiêu đề lặp | Chữ không mang tin đẩy tin thật xuống; ở 375 đầu + chân chiếm ~1/3 màn | Hạn = ngày dd/mm/yyyy tô màu · cột một giá trị → lên tiêu đề / đầu nhóm · bỏ chân "Đóng" |
| 5 | P2 | 32 khuôn panel, 15 dáng số, tên gọi lệch ("Overall / KV" ↔ "OVR / Kỳ vọng" · "Phụ trách" ↔ "Người phụ trách" · "Đóng" trái / phải / không có · ⓘ có / không) | Mỗi panel phải học lại cách đọc | Một khuôn đầu + 3 khuôn thân + một dáng số + bảng tên gọi chung |
| 6 | P2 | Cuộn nền rò: lăn chuột trên nền mờ / đầu panel thì trang phía sau cuộn (khoá đặt ở `body`, khung cuộn thật là `main`) — đo bằng Playwright, cần thử tay | Đóng panel thì trang đã trôi | Khoá cuộn ở `main`, hoặc bỏ nền mờ (panel không che) |
| 7 | P3 | ⓘ "Cách tính" ở đầu panel: vùng bấm 14 × 18 px ở ≥ 640 · link tên trong panel cao 18–21 px · ô lọc bước đang tắt tương phản 3,36 : 1 | Khó bấm | Nút ⓘ 24 × 24 trở lên |

## 7. Đang tốt — giữ

1. Cách nói lý do ở bảng điểm: ✓ / ✗ + màu + số, tô nền cột kỹ năng vừa bấm (`thi-04`); cột "Kết quả" ở `sos-21`.
2. Tiêu đề panel lặp đúng nhãn ô vừa bấm + đếm có đơn vị ("Tiến bộ L · ↑ Tăng", "53 lượt · 37 HV"); số 0 xám không bấm.
3. Hộp Tuần dạy: neo cạnh số, cỡ theo nội dung, 375 thành tờ đáy. Bản thẻ 375 của `cn-01`, `cn-05` (2–3 dòng một em) gọn hơn bản máy tính.
4. Bàn phím: mở panel focus vào panel, Tab không ra ngoài, Esc đóng và focus về đúng ô số, URL có `?so-lieu=`. Tương phản chữ đang dùng ≥ 6,3 : 1.

## 8. Nghi lỗi dữ liệu — cần session code kiểm (chỉ thấy trên ảnh)

| Chỗ | Thấy gì |
|---|---|
| `cn-05` Tiến bộ | Dòng "Đặng Thu Hà · S · MT2 6.5 → MT1 6.5" — cột Sau là MT1 (thứ tự Trước / Sau ngược?) |
| `sos-06` Chưa chốt PA | Nhóm "Chờ chọn PA" vẫn ghi "Chưa có mô tả" |
| `yt-01` ↔ bảng trên trang | Kiều Minh Đức, Lương Gia Bảo: cột "Lần xử lý gần nhất" hai nơi ra hai nội dung (trái "cùng nguồn, cùng hàm tính") |
| `tq-05` · `tq-06` | Ô "52 bài" ↔ panel "15 việc"; ô "4 em" ↔ panel 4 việc (4 + 6 + 8 + 3 em) — số trên trang ≠ số dòng panel (G7) |
| SOS › Theo tuần › W3 SEP | Chữ ngày đè ô số (mục 5) |
| Ý thức 375 | 9 / 22 nút số vùng bấm 44 × 26 |
| DESIGN.md frontmatter | Còn thang chữ cũ 12 · 13 · 14 · 15 · 17 · 22 · 28 (NH2 đã chốt 12 · 13 · 14 · 16 · 20 · 26) → máy dò báo 16 phát hiện giả `design-system-font-size` |

Máy dò `impeccable detect`: 17 phát hiện trên 12 tệp (1 warning, 16 advisory), **đều là dương tính giả** (thang chữ frontmatter cũ; ngoặc "Chưa có PA" bị nhận là thẻ có vạch; "Ctrl K"; dải lọc bước bị nhận là thẻ lồng thẻ). Vấn đề thật đều đến từ số đo.

## 9. Hướng đề xuất (vẽ ở mockup đợt hai — `thiet-ke/v24/phan-tich-panel-so.html`)

1. **Số trơn** thay ô viền ở mọi bảng Phân tích (mục 5).
2. **Một khuôn panel số**: đầu MỘT dòng (tên số · tổng + đơn vị · ⓘ · ✕; phạm vi chỉ khi trang bị che) · thân một bảng đúng tập sinh ra số, cột 1 = Học viên (lớp chữ nhỏ dưới), sau đó chỉ các cột là lý do · không chân "Đóng" · hạn = ngày tô màu.
3. **Cỡ theo nội dung**: danh sách ngắn (≤ 8 dòng, ≤ 5 cột) → hộp nhỏ neo cạnh số (cùng họ hộp Tuần dạy) · còn lại → panel phải 720 (cùng khung panel Công việc v24). 375: tờ đáy / toàn màn.
   **[XM]** Lượt rà A phản đối hai kiểu mở trong cùng một cột (trái "một danh sách một kiểu mở") và đề xuất MỘT kiểu: panel phải 720, cao theo số dòng. Mockup vẽ cả hai để chủ SP chọn.
4. **Bảng Theo GV**: mỗi kỹ năng hiện 2 GV dạy nhiều tuần nhất + "+ n GV" mở tại chỗ (chủ SP 24/11).
5. `yt-01`, `yt-04`: bỏ panel (bảng đã ở ngay trên trang) — bấm số thì cuộn tới bảng. **[XM]** đề xuất, chờ duyệt.
