# UI-2 · Tab Ý thức & Phối hợp hồ sơ lớp — khớp / khác (mockup U10 K1 · K2 · K4 · K6 · K8, chủ SP duyệt 03/11)

Ảnh cặp (trái mockup `thiet-ke/audit-0311/u10-y-thuc.html`, phải web dev `localhost:5831`, lớp seed MB FT 101, `document.fonts` Be Vietnam Pro nạp):
`cap-k1-gvcn-1440.png` (GVCN vai 7, 1440 tối) · `cap-k2-375.png` (375 sáng) · `cap-k4-ql-1440.png` (QL vai 2) · `cap-k6-1440.png` (Lịch sử) · `cap-k8-1440.png` (Phối hợp SOS).
Mockup vẽ CP FT 116 (7 HV); web chụp dữ liệu seed (33 HV) — chữ / số khác là do dữ liệu, so bố cục + hình.

Dùng chung với tab hồ sơ HV (UI-3, chủ SP 03/11: hai tab đồng bộ): `khoiYThuc.tsx` (BadgeViec · CanLamEm · BaoPhEm · DsViPhamCho · LanTruoc · ChipLoc · BangLichSu), `PhoiHopSosSection` (đầu lượt K8).

## Bảng truy vết
| Khung (mockup) | Thành phần web | Ảnh |
|---|---|---|
| K1 thanh công cụ: `Vi phạm \| Phối hợp SOS n` · `Cần làm n HV \| Lịch sử n` · phải `Điểm Mock Test ›` · `+ Ghi vi phạm` · `Khai / sửa cấp bậc` · `Chọn nhiều` | `ClassYThucCard` (`BoLocDoan v8`) | cap-k1 |
| K1 tiêu đề cột một lần: Học viên · Vi phạm chờ · Cần làm · Bậc · Báo PH (TVV) · Việc | lưới `COT` (khung ≥ 1220 px) | cap-k1 |
| K1 nhóm: Bắt buộc xử lý (nền vàng, chữ vàng, câu luật + ⓘ) · Mới, chưa xem (câu + ⓘ) · Chờ QL duyệt · Đã xử lý · 7 ngày (nền thẻ) | `NhomHang` | cap-k1 |
| K1 ô Học viên: tên · TVV · `▾ Chi tiết` / `▴ Thu gọn` | `HangEm` | cap-k1 |
| K1 ô Vi phạm chờ: ngày · tên (≤ 3, "+n") | `DsVpHang` | cap-k1 |
| K1 ô Cần làm: badge (Quá hạn ⚠ đỏ / Phải xử lý vàng / Chưa xem viền chấm / Chờ QL duyệt / Đã xử lý ✓) + dòng hạn ("hạn 05/11 · còn 2 ngày") | `CanLamEm hanDuoi` | cap-k1 |
| K1 ô Bậc: Đã tới (· ngày) · Lần này / Bậc kế (nhạt) / Đề xuất | `HangEm` `oBac` | cap-k1 |
| K1 ô Báo PH: Lần X · badge · hạn ("· đã chỉnh") | `BaoPhEm` | cap-k1 |
| K1 cột Việc: một nút chính rộng cột + nút chữ phụ giữa (Xác nhận xử lý / Đề xuất QL duyệt · Đã xem · n viền / Xác nhận xử lý · Xem lần xử lý) | `HangEm` | cap-k1 |
| K1 hàng mở: nền nhấn + vạch trái; chi tiết 7 : 5 — Vi phạm của lần này (thẻ nhóm · người ghi · tệp, "Không có Đã xem" + ⓘ, Đã xử lý n · Đã xem n · Lịch sử của em ›) · Lần xử lý (Lần này · hạn, Lần trước · Xem ›, Thang ›) · Báo PH (Lần X, Người giữ, Lần này) | `ChiTietEm` · `Khoi` · `Fld` | bấm thử (ảnh trong PR) |
| K1 hàng vừa "Đã xem": nền xanh, "✓ Đã xem n vi phạm · giờ", Hoàn tác · Xem lại | `HangEm` `vua_xem` | bấm thử |
| K1 hàng vừa Xác nhận xử lý: nền xanh, "Đã xử lý hh:mm · vừa lưu" | `HangEm` (`vuaLuu`) | bấm thử |
| K2 375: thẻ em (tên + badge hạn trong badge · vi phạm · Bậc / Báo PH hai ô · nút 44 px rộng thẻ) · `+ Ghi vi phạm` rộng + ⋯ (Điểm Mock Test › · Khai / sửa cấp bậc · Chọn nhiều) · phân đoạn có số | `HangEm` (khung < 1220) · `Menu` | cap-k2 |
| K4 QL: nhóm Chờ QL duyệt gồm đề xuất + xin thu hồi; dòng "GVCN …"; badge Đề xuất / Xin thu hồi; Duyệt (thu hồi) · Từ chối… · Xem tại chỗ | `HangEm` + `PanelDuyetXuLy` (= `PanelDuyet` của Hộp duyệt) | cap-k4 |
| K6 Lịch sử: chip lọc Tất cả · Đã xem · Đã xử lý · Đã thu hồi (có số) · Lộ trình \| Cả lịch sử · Tìm em · bảng Ngày · Học viên · Loại · Nội dung (trường có nhãn) · Ai · lúc nào · nút; dòng vừa làm sáng + "vừa xong" | `ChipLoc` · `BangLichSu coTen` | cap-k6 |
| K8 Phối hợp SOS: mọi lượt · Hiện cả lượt đã xong · đầu lượt một dòng (tên · SOS · MT · n/m việc xong · + Thêm việc) · hàng tên · hạn · Xác nhận ⋯ | `PhoiHopSosSection xanh cot1="hocVien"` | cap-k8 |
| BỎ: cột "Duyệt · thu hồi" · chuỗi chip thang mỗi hàng · "Nhật ký vi phạm của lớp (n)" gập cuối · khung xanh Phối hợp dưới vi phạm · bảng Điểm Mock Test dưới tab Ý thức (#29: ở tab Học viên) · câu chân "Em có n vi phạm…" | — | — |
| GIỮ: mọi thao tác (bảng dưới) | | |

## KHỚP / KHÁC
| # | Chỗ | KHỚP / KHÁC | Ghi chú |
|---|---|---|---|
| 1 | Thanh công cụ hai phân đoạn + nút phải | KHỚP | |
| 2 | Tiêu đề cột một lần, 6 cột | KHỚP | |
| 3 | Bốn nhóm + màu nhóm Bắt buộc, câu luật, ⓘ | KHỚP | "chưa cần biện pháp" → "chưa cần xử lý" (luật chữ: không dùng "biện pháp" trên web) |
| 4 | Ô Học viên (tên · TVV · Chi tiết) | KHỚP | |
| 5 | Ô Vi phạm chờ | KHỚP | |
| 6 | Ô Cần làm (badge + dòng hạn) | KHỚP | |
| 7 | Ô Bậc | KHỚP | |
| 8 | Ô Báo PH | KHỚP | |
| 9 | Cột Việc (nút chính + chữ phụ) | KHỚP | Chờ QL duyệt (GVCN): "Xem đề xuất" thay "Rút đề xuất" — xem dưới |
| 10 | Hàng mở + chi tiết 3 khối | KHỚP | |
| 11 | Hàng vừa Đã xem / vừa lưu | KHỚP | |
| 12 | 375 thẻ em + ⋯ | KHỚP | thêm `▾ Chi tiết` cuối thẻ (K2a không vẽ lối mở, K2b vẽ thẻ đã mở) |
| 13 | K4 Chờ QL duyệt: đề xuất + xin thu hồi, GVCN, Duyệt / Từ chối… / Xem | KHỚP | ô Bậc không có "Lý do" / "Sau thu hồi" (lý do đọc trong panel duyệt) |
| 14 | K6 chip lọc, phạm vi, Tìm em, cột | KHỚP | dòng Đã xem chỉ tên vi phạm (sửa cả tab HV cho đồng bộ); chip lọc viền riêng (`ChipLoc`, cả tab HV); khung < 900 px bảng xếp dọc |
| 15 | K8 đầu lượt + hàng việc | KHỚP | |
| 16 | Bằng chứng trống trong vi phạm mở: một dòng "+ Tệp / liên kết" (U10.8) | KHÁC | `BangChung` dùng chung mọi panel (Case, PA, vi phạm, lần xử lý) — đổi ở đây là đổi toàn web → **[XM] PR riêng** (UI-3 cũng giữ như cũ) |

**Hình: KHỚP 15 / 16 = 94 %** theo dòng; dòng KHÁC #16 là thành phần dùng chung toàn web (không riêng tab này), đề xuất PR riêng. Tính trên phần do PR này vẽ: 15 / 15.

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| + Ghi vi phạm | đầu thẻ | phải thanh công cụ (375: nút rộng) | GIỮ |
| Khai / sửa cấp bậc (cả lớp) | đầu thẻ | phải thanh công cụ (375: ⋯) | GIỮ |
| Chọn nhiều → Xác nhận xử lý · Ghi nhận · Xác nhận cấp bậc theo lô | đầu thẻ + thanh đáy | như cũ; "Ghi nhận · n" → "Đã xem · n" (N34) | GIỮ · ĐỔI chữ |
| Xác nhận xử lý | nút dưới cột Báo PH | cột Việc: nút chính (bắt buộc) / chữ phụ (mới) | GIỮ · ĐỔI chỗ (U10.1) |
| Đề xuất QL duyệt | trong thang khi mở em | chữ phụ dưới Xác nhận xử lý (hàng bắt buộc) | GIỮ · ĐỔI chỗ |
| Ghi nhận n vi phạm (một em) | nút cột Báo PH, hàng biến mất + toast | "Đã xem · n" cột Việc; hàng ở lại + Hoàn tác + Xem lại | GIỮ · ĐỔI chữ + phản hồi (F03) |
| Ghi nhận / Bỏ ghi nhận một vi phạm | chi tiết em | "Đã xem vi phạm này" khi mở vi phạm · "Bỏ xem" ở Lịch sử | GIỮ · ĐỔI chữ |
| Sửa / Xoá vi phạm · tệp | mở vi phạm trong chi tiết em | như cũ (mở dòng); người ghi không quản lý: nút Sửa cuối dòng | GIỮ |
| Xem lần xử lý · Thu hồi… | cột "Duyệt · thu hồi" + Nhật ký | khối Lần xử lý ("Xem ›") · cột Việc (Đã xử lý) · Lịch sử ("Thu hồi…" / "Xem") | GIỮ · ĐỔI chỗ |
| Đã thực hiện… (đề xuất đã duyệt) | cột Việc / chân chi tiết | cột Việc "Đánh dấu đã thực hiện" | GIỮ · ĐỔI chữ (như tab HV) |
| Xác nhận cấp bậc một em (thang) | khối Thang mở sẵn | "Thang ›" trong khối Lần xử lý (mở tại chỗ, nút Khai trong thang) | GIỮ |
| Duyệt / Từ chối đề xuất · xin thu hồi (QL) | Hộp duyệt | như cũ + tại chỗ ở nhóm Chờ QL duyệt (cùng panel duyệt) | GIỮ + THÊM lối (K4) |
| Rút đề xuất (người gửi) | panel Xem lần xử lý | như cũ — nút hàng "Xem đề xuất" mở panel đó | GIỮ |
| Báo PH tại chỗ (TVV / QL) | bấm nút / ô | bấm badge Báo PH · TVV: nút "Ghi kết quả báo PH" cột Việc | GIỮ |
| Nhật ký vi phạm của lớp · lọc nhóm | gập cuối thẻ, ô chọn nhóm | phân đoạn Lịch sử, lọc có số, phạm vi, ô Tìm em (khớp cả tên nhóm / vi phạm) | GIỮ · ĐỔI chỗ |
| Bấm tên em trong Nhật ký → mở hàng em | Nhật ký | tên em ở Lịch sử là link hồ sơ HV · "Lịch sử của em ›" lọc Lịch sử đúng em đó (nút "tên ×" bỏ lọc) | ĐỔI |
| Bỏ ghi nhận ngay trong chi tiết em | chi tiết em (mọi vi phạm) | chi tiết em chỉ vi phạm chờ (U10.4); Bỏ xem ở Lịch sử (150 dòng mới nhất của lớp, "Cả lịch sử") · vi phạm cũ hơn: tab Ý thức hồ sơ HV | ĐỔI chỗ |
| Phối hợp SOS (+ Thêm việc, Xác nhận, Bỏ, Sửa hạn, tệp, Hiện cả lượt đã xong) | dưới vi phạm, khung xanh, "Hiện thêm n HV" | phân đoạn riêng, mọi lượt hiện đủ, lượt xong thu gọn | GIỮ · ĐỔI chỗ (#29) |
| Điểm Mock Test của lớp | khối dưới mọi tab | ẩn ở tab Ý thức; "Điểm Mock Test ›" mở tab Học viên + khối điểm | GIỮ · ĐỔI chỗ (#29) |
| Việc / thông báo `?hv= · mo=xu-ly · khai · da-thuc-hien · cap-bac · sub=phoi-hop` | | như cũ (mở hàng em / panel / phân đoạn) | GIỮ |

Không mất thao tác nào.

## Máy chủ (đọc Turso)
`GET /classes/:id/y-thuc`: thêm tên TVV + tên GVCN vào câu đọc tên em (JOIN + câu con hằng), "đang xin thu hồi" một câu cho cả lớp (trước: chỉ em có hàng), `daChinh` từ câu Báo PH sẵn có, `xemBoi / xemLuc` + `vpIds` từ dữ liệu đã đọc, `coTheDuyet` (quyền, không đọc DB), dòng thời gian mang cờ `trongChuoi` — đổi Lộ trình | Cả lịch sử lọc ở trình duyệt, KHÔNG đọc lại; hàng xin thu hồi kèm vi phạm của lần đó từ danh sách vừa đọc. Số câu không đổi, dòng đọc không đổi đáng kể (câu thu hồi theo id lần xử lý của cả lớp).
Số "Đã xử lý n · Đã xem n" ở chi tiết em đếm từ dòng thời gian đã nạp (150 dòng mới nhất của lớp) — lớp rất nhiều vi phạm có thể ít hơn số ở tab HV.

## [XM] để PTA
- #16 `BangChung` trống gọn một dòng (U10.8) — thành phần chung toàn web → PR riêng (vào Việc để sau).

## Sau rà (audit 15/20 + web-design-guidelines + ponytail-review, agent riêng)
- Sửa: em xin thu hồi sau khi đã xử lý (7 ngày) vào nhóm Chờ QL duyệt + đếm Cần làm · bảng Lịch sử có cột Học viên bật từ khung 900 px (không tràn ở 720–900) · lưới 6 cột bật từ 1220 px, cột Vi phạm chờ ≥ 130 px · "Điểm Mock Test ›" vào ⋯ ở 375 · ⋯ có tên đọc màn hình · Báo PH ở 375 bấm được (TVV / QL) · nút Báo PH của TVV đứng trước nút xem đề xuất · Hoàn tác / Xem lại có tên theo em · phân đoạn ghi vào địa chỉ (`sub`, `doan`) — Quay lại về đúng chỗ · đổi phạm vi không đọc lại (cờ `trongChuoi`) · "Lịch sử của em ›" lọc theo id · Đề xuất không làm hàng sáng "vừa lưu" · không trùng `id` hàng · câu nhóm "đã gửi QL — QL quyết" · số đếm phân đoạn hiện ở 375 · ⓘ cùng dòng câu luật · bỏ trường `phamVi`, gom lớp nút chữ.
