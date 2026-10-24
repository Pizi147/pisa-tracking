# UI-CON-LAI — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (khung `thiet-ke/v5/con-lai.html`, `con-lai-truy-vet.md` k1–k8; `10` mục 1 P1 P2 P7, mục 8)

PR **nâng cấp** (CLAUDE.md "PR giao diện V5 = NÂNG CẤP"): phần lớn k1–k8 đã có từ V4 / NEN-PANEL / UI-HV-LOP — PR này sửa chỗ còn lệch mockup, giữ mọi thao tác cũ.
Ảnh cặp mockup | web (seed nguyên, ngày demo 14/09/2026): `cap-<khung>-{1440-toi,1440-sang,375}.png`. Vai: QL = Nguyễn Khánh Vy (2) · GVCN = Trần Ngọc Hà (7).
Số trên web là dữ liệu seed (khác số demo mockup) — so khung, thứ tự, tên, kiểu.

## Truy vết khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | k1 ô tìm ở thanh trên, phím **/** hoặc **Ctrl K** | `Header.tsx` (`laPhimTim`, `aria-keyshortcuts`, chữ "Ctrl K" trong ô) — màn hẹp mở ô neo dưới thanh trên | `cap-k1-tim-kiem-*` | KHỚP |
| 2 | k1 kết quả theo nhóm **HV · Lớp · GV** có số; nhóm rỗng gom một dòng ("Lớp · 0 · Giáo viên · 0") | nhóm `nhomTim`; **mới** máy chủ `GET /tim/giao-vien` (`timGiaoVien` = đúng luật `phamViHoSoGv` — GV / TVV không có nhóm GV) | `cap-k1-*` | KHỚP |
| 3 | k1 chữ khớp tô hồng nhận diện; chip SOS cạnh tên | `ToKhop` (không dấu) + `.tim-khop`; `ChipSos tinh` (không lồng nút) | `cap-k1-*` | KHỚP |
| 4 | k1 dòng phím ↑ ↓ Enter Esc · "chỉ trong phạm vi" | chân danh sách (máy tính; 375 không có bàn phím nên ẩn) | `cap-k1-*` | KHỚP |
| 5 | k1 rỗng: "Không thấy 'x' trong phạm vi của bạn … tìm cả HV lưu trữ" | `Không thấy “{q}” trong phạm vi của bạn. Tìm trong HV lưu trữ ›` (`/hoc-vien/luu-tru?q=`) | — | KHỚP |
| 6 | k1 dòng phụ HV "MB FT 101 · GVCN Trần Ngọc Hà" | chỉ mã lớp (`/students` không trả GVCN — không thêm câu SQL cho ô tìm) | `cap-k1-*` | KHÁC (nhỏ) |
| 7 | k2 một kiểu `‹ W3 SEP › Tuần này` | `WeekPicker gon`: nút **Tuần này** luôn ở chỗ, khoá khi đang ở tuần này (trước: link "Về tuần này" chỉ hiện khi ở tuần khác — bố cục nhảy) | `cap-k2-chon-tuan-*` | KHỚP |
| 8 | k2 lịch theo tháng: danh sách mã tuần, tuần thuộc tháng chứa thứ Năm, "tuần này" chữ hồng | `LichNho` kiểu `tuan` → `thanTuan` (`owningMonthOf`, `tuanLich`), ↑ ↓ đi từng tuần qua tháng | `cap-k2-*` | KHỚP |
| 9 | k2 ba tháng cạnh nhau | một tháng + ‹ › tháng (hộp lịch rộng 320 px, dùng chung mọi ô tuần) | `cap-k2-*` | KHÁC (nhỏ) |
| 10 | k2 khoảng tuần Phân tích "tối đa 13" | **không sửa** — P9 (mới hơn) đã làm ở #558: Toàn bộ / tự do, không trần | — | BỎ (P9 thắng) |
| 11 | k3 thẻ thu hồi: lý do · xử lý đã duyệt (ngày) · TVV báo PH · hậu quả trước khi duyệt | thẻ Hộp duyệt (V4) + máy chủ `loaiYeuCau.ts` `thu_hoi_y_thuc.nap`: "Đã thực hiện 07/08", "TVV đã báo PH dd/mm · tên — giữ trong lịch sử" / "TVV chưa báo PH — duyệt thì việc Báo PH thành Đã bỏ"; "Nếu duyệt" thêm nhắc báo lại PH | `cap-k3-hop-duyet-*` | KHỚP |
| 12 | k3 **Hoàn tác 5 s chỉ thao tác của chính mình**, không vòng qua duyệt | toast Hoàn tác chung (`toast.hoanTac`, `HOAN_TAC_MS`) sau Duyệt / Từ chối — chỉ loại máy chủ huỷ được (`khiHuy`: Đề xuất PA, Thu hồi); bấm = đường "Huỷ quyết định" sẵn có (máy chủ kiểm quyền + trong ngày). Phép kiểm UICL-5 khoá danh sách loại | — | KHỚP |
| 13 | k3 danh sách trái + panel duyệt phải (chủ SP 24/10: làm như mockup) | Hộp duyệt đầy đủ: `DongYeuCau` (loại · hạn · việc · em · lớp · dòng lý do; ô chọn hàng loạt giữ) + panel **tại chỗ** bên phải (`KhungTaiCho`, mẫu Chấm Test; 375: bấm dòng → panel thay danh sách, "‹ Chờ duyệt" về lại); `?the=` mở đúng thẻ (chuông, Quay lại); panel: bối cảnh trên nền nhạt, khối vàng "Sau khi duyệt:", hạn + Duyệt · Từ chối… · Mở cuối panel. Bản gọn đầu Công việc giữ thẻ | `cap-k3-hop-duyet-*` | KHỚP |
| 13b | k3 "Lịch sử (3)" gập trong panel | không có — thẻ chưa trả lịch sử (gửi / báo PH / lưu); lịch sử xem ở hồ sơ HV › Ý thức (nút Mở) | `cap-k3-*` | KHÁC (nhỏ) |
| 14 | k4 Công việc (n) = việc của tôi; chuông = tin **chưa đọc**, dáng khác (nền trắng chữ xanh) | chuông nét mảnh mọi bề rộng + chấm tròn `.cham-chuong` (trước: nút chữ "Thông báo" + số nền màu như badge việc) | `cap-k4-thong-bao-*` | KHỚP |
| 15 | k4 nợ #528: badge việc không đếm `mine:false`; `viecQuaHan` chỉ kỹ năng thật sự quá hạn | `mywork.ts` `demSo` (đếm việc `mine`; Nhập điểm đếm `knsQuaHan`); hồ sơ GV xem người khác đếm theo `mine` gốc. Phép kiểm UICL-1…3 | — | KHỚP |
| 16 | k4 không thông báo: "Chưa có thông báo mới" một dòng | đổi chữ + bỏ khối cao | — | KHỚP |
| 17 | k5 lỗi tại ô + "Còn 1 ô cần sửa" | `nhanCanSua` → "Còn n ô cần sửa ↑" (mọi form dùng `useLoiForm`) | `cap-k5-bieu-mau-*` | KHỚP |
| 18 | k5 ô ngày gõ được + nút lịch, không hàng "Hôm nay · Hôm qua" | `ONgay` sẵn có (không đổi) | `cap-k5-*` | KHỚP |
| 19 | k5 xung đột: "Bản đã lưu / Bạn đang sửa", chưa ghi đè, chọn một | **mới** `KhoiXungDot` (`SaveState.tsx`) gắn panel Đánh giá đầu ra (máy chủ đã trả 409 — T15): "Dùng bản đã lưu" / "Lưu bản của tôi". Seed không tạo được 409 nên ảnh không có khối này | — | KHỚP (kiểm bằng mã) |
| 20 | k5 mất mạng: không báo đã lưu giả, Thử lại, giữ chữ | sẵn có (`ChuLuu` + `taoOLuu`, NEN-PANEL) | — | KHỚP |
| 21 | k6 băng mất kết nối | dải "Mất kết nối" sẵn có nay bật cả khi trình duyệt báo `offline` (có mạng lại tự hỏi lại phiên) | `cap-k6-khong-quyen-*` | KHỚP |
| 22 | k6 băng đếm "1 thay đổi chưa gửi … tự gửi lại khi có mạng" | không có hàng đợi gửi lại chung — dải nói "Chữ chưa lưu vẫn giữ trên màn — lưu lại khi có mạng" (không hứa tự gửi) | — | KHÁC (nhỏ) |
| 23 | k6 403 nói lý do + đường khác | `ErrorState`: nhãn "KHÔNG CÓ QUYỀN", câu máy chủ, hồ sơ GV → "Hồ sơ của tôi ›" (vai GV), nút về nguồn | `cap-k6-khong-quyen-*` | KHỚP |
| 24 | k6 404: "lưu trữ hoặc không còn" + tìm lưu trữ + về HV & Lớp | `ErrorState` 404 (`laCauLoi404`): "KHÔNG THẤY", "Đường dẫn có thể cũ. Tìm trong HV lưu trữ ›", nút về — không "Thử lại" vô ích | `cap-k6-khong-thay-*` | KHỚP |
| 25 | k6 rỗng đúng nghĩa một dòng | đã làm ở các PR màn (brief 6.6) — không đổi | — | KHỚP |
| 26 | k7 Xuất theo bộ lọc, số HV trên nút | nút đầu trang HV & Lớp "Xuất Excel · n HV" (trước: "Xuất"); ngăn Xuất (UI-HV-LOP) đã có phạm vi + "Xuất n HV" | `cap-k7-xuat-*` | KHỚP |
| 27 | k7 chọn Excel / CSV | chỉ Excel (V4) — không thêm định dạng không ai xin (P11) | `cap-k7-*` | KHÁC (nhỏ) |
| 28 | k7 In A4 ngang nền sáng, đầu trang "PISA · Báo cáo · … · in lúc · người in" | đổi nền sáng lúc in chuyển từ Báo cáo lên `App` (mọi trang in đều sáng) + dòng đầu trang in `PISA · {trang} · in dd/mm hh:mm · {người}`; Báo cáo giữ A4 ngang | — | KHỚP |
| 29 | k8 375 panel toàn màn, thanh dưới ẩn, chân Lưu trên bàn phím, ô ≥ 44 px, chữ 16 px | sẵn có (NEN-PANEL `useBanPhim`, `index.css`) | `cap-*-375` | KHỚP |
| 30 | k8 ô đang gõ cuộn vào giữa phần còn thấy | **mới** `useBanPhim`: bàn phím vừa mở → `scrollIntoView({ block: 'center' })` ô đang focus | — | KHỚP |
| 31 | k8 bối cảnh dài gập khi bàn phím mở | không làm (panel V5 đã gọn; gập theo bàn phím dễ làm nhảy chỗ đang gõ) | — | KHÁC (nhỏ) |
| — | BỎ: dòng chú thích mockup ("Tuần thuộc tháng chứa thứ Năm…", "Luật hai dấu hiệu…", "Hoàn tác chỉ trong 5 s…", "Panel ở 375 = toàn màn…") — P1 | không lên web | — | BỎ |
| — | BỎ (truy vết): hàng "Hôm nay · Hôm qua" ở ô ngày · chuông dùng chung số việc · xuất ngầm chỉ trang đang thấy | đúng như BỎ | — | BỎ |

**Đếm** (trừ dòng BỎ): 32 dòng − 1 (dòng 10 BỎ) − 2 dòng chủ SP đã chốt không làm (22 hàng đợi gửi lại — XM-3 "theo đề xuất"; 27 CSV — P11) = 29 · KHỚP 24 · KHÁC nhỏ 5 (6, 9, 13b, 31, và k5 khối xung đột chỉ kiểm bằng mã) → 24 / 29 = **83 %** theo dòng; theo 8 khung yêu cầu: 8 / 8.
Phần KHÁC còn lại đều là chi tiết nhỏ (dòng phụ GVCN ở kết quả tìm, ba tháng cạnh nhau, Lịch sử gập, gập bối cảnh khi bàn phím mở).

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Mở ô tìm | bấm ô (máy tính) / kính lúp (màn hẹp) | GIỮ + phím **/** hoặc **Ctrl K** mọi màn |
| Tìm GV | không có | QL / QT: nhóm Giáo viên → hồ sơ GV |
| Tìm không ra | "Không tìm thấy học viên hoặc lớp" | câu nói phạm vi + link HV lưu trữ |
| Chọn tuần (Lịch Test) | ‹ › · bấm mã tuần mở lịch ngày · "Về tuần này" (chỉ khi ở tuần khác) | ‹ › GIỮ · bấm mã tuần mở **danh sách mã tuần theo tháng** (vẫn ô gõ "W4 SEP / 28/09" + Gần đây) · nút **Tuần này** cố định |
| Chọn tuần (ô tuần trong form: tạo lớp, MT, dự kiến thi…) | lịch ngày, bấm một ngày = chọn tuần | danh sách mã tuần theo tháng (cùng luật khoá tuần ngoài khoảng) |
| Mở một đề xuất ở Hộp duyệt | đọc thẻ tại chỗ trong danh sách dài | bấm dòng → panel phải (danh sách vẫn thấy, chọn dòng khác = đổi panel); 375: panel thay danh sách |
| Duyệt / Từ chối… / Mở / Huỷ quyết định / Sửa… / Rút / Trả lời… | nút trên thẻ | cùng nút, ở cuối panel (cùng hành vi, cùng ô lý do tại chỗ) |
| Duyệt / từ chối hàng loạt | ô chọn ở thẻ + thanh dưới | ô chọn ở dòng + cùng thanh dưới |
| Duyệt / Từ chối thẻ Đề xuất PA, Thu hồi | toast "Đã duyệt"; sửa nhầm = Đã xử lý › Huỷ quyết định (trong ngày) | GIỮ + toast **Hoàn tác (5)** ngay sau bấm |
| Duyệt thẻ loại khác | như cũ | như cũ (máy chủ không cho huỷ → không hứa Hoàn tác) |
| Mở thông báo | nút "Thông báo n" | chuông + chấm số chưa đọc (cùng hộp, cùng Đánh dấu đã đọc) |
| Lưu đánh giá đầu ra khi người khác vừa lưu | 409: câu lỗi + bấm Lưu lần nữa để ghi đè | khối Bản đã lưu / Bạn đang sửa + "Dùng bản đã lưu" / "Lưu bản của tôi" |
| Mở hồ sơ không quyền / không còn | câu lỗi + Thử lại (404) / nút về (403) | nhãn loại lỗi + đường khác + nút về (không Thử lại) |
| Xuất HV & Lớp | nút "Xuất" | "Xuất Excel · n HV" (cùng ngăn Xuất) |
| In | Báo cáo in nền sáng | mọi trang in nền sáng + dòng đầu trang in |

Không mất thao tác nào.

## Chủ SP 24/10 (sau ảnh vòng 1)

| # | Chủ SP | Đã làm |
|---|---|---|
| 1 | Hộp duyệt làm như mockup; còn lại theo đề xuất | k3 danh sách + panel (dòng 13). XM-1 giữ một PR; XM-3 không làm hàng đợi gửi lại |
| 2 | Bỏ chữ dưới điểm Test; MT nên có nhận xét mà thiếu → hộp viền vàng | lưới điểm (`ODiemMt`) + ô lớn hồ sơ MT (`ODiemLon`): bỏ chữ "nên có nhận xét / nên chọn nguyên nhân", ô viền vàng (`--soon`); câu nhắc còn ở tooltip + tên đọc màn (không chỉ màu), chi tiết trong hộp nhập điểm. Cờ máy chủ không đổi (`thieuNhanXetMt`: chỉ MT thường, không MT cũ / MT0). Phép kiểm UICL-6 |

## [XM] — đã chốt (chủ SP 24/10)

- **XM-1 Tách PR.** Prompt: > 25 tệp thì tách 2 PR. PR này 32 tệp nhưng ~440 dòng; 14 tệp là phép kiểm / tiếng Anh sửa 1–3 dòng (khoá chữ mới). Phiên code chỉ được đẩy nhánh `claude/ui-con-lai-v5-pr-d6ugq9` — nếu vẫn cần tách (a = k1 k2 k4 k6 k7 · b = k3 k5 k8), PTA Plan cho tên nhánh thứ hai.
- **XM-2** → làm như mockup (dòng 13).
- **XM-3 k6 hàng đợi "n thay đổi chưa gửi, tự gửi lại".** Web chưa có hàng đợi gửi lại chung (mỗi ô tự giữ chữ + Thử lại). Dựng hàng đợi = thêm trạng thái ở mọi chỗ lưu — đề xuất không làm (luật 08/10: không thêm khi không đổi đầu ra).

## Ghi chú

- Nợ #528 (máy chủ): `mywork.ts` `demSo` + `knsQuaHan`; phép kiểm `prUiConLai.tests.ts` UICL-1…5; SVSO1 sửa theo luật mới.
- Nợ #544 còn lại: `batBuocNx` → `nhacNx` (`attempts.ts`), chú thích "nhận xét bắt buộc" cũ (`keHoachTest.ts`, `attempts.ts`). Các mục khác (#545 đã làm).
- Phép kiểm khoá chữ / dáng cũ sửa theo dáng mới: LOP (10), NEN (9), SANG S4 (màu chuông qua token), Dọn-a (9e) (`/tim/giao-vien` gọi khi gõ), C16a, C31, N1 (6).
