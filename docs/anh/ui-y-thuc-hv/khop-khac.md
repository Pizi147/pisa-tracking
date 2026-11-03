# UI-3 · Tab Ý thức & Phối hợp hồ sơ HV — khớp / khác (mockup U10 K3 · K6 · K8, chủ SP duyệt 03/11)

Ảnh cặp (trái mockup `thiet-ke/audit-0311/u10-y-thuc.html`, phải web dev `localhost:5831`, dữ liệu seed, `document.fonts.check('600 14px "Be Vietnam Pro"')` = true):
`cap-k3-gvcn-1440.png` (GVCN, em 1, 1440 tối) · `cap-k3-gvbm-1440.png` (GVBM vai 9) · `cap-375.png` (GVCN, 375 sáng, so K2b) · `cap-k6-1440.png` (Lịch sử) · `cap-k8-1440.png` (Phối hợp SOS, em 58).
Mockup vẽ bằng dữ liệu CP FT 116; web chụp dữ liệu seed (MB FT 101) — chữ / số khác nhau là do dữ liệu, so bố cục + hình.

Thành phần dùng chung `web/src/modules/yThuc/khoiYThuc.tsx` (BadgeViec · CanLamEm · BaoPhEm · TomTatEm · DsViPhamCho · LanTruoc · BangLichSu) — UI-2 (tab lớp) dùng lại y hệt (chủ SP 03/11: hai tab đồng bộ).

## Bảng truy vết
| Khung (mockup) | Thành phần web | Ảnh |
|---|---|---|
| K3 phân đoạn `Vi phạm \| Phối hợp SOS n` + `Cần làm n \| Lịch sử n` · `+ Ghi vi phạm` phải | `StudentYThucSection` (`BoLocDoan v8`) | cap-k3-* |
| K3 dải tóm tắt: Cần làm (badge khung + chấm) · Người xử lý (vai xem) · Đã tới · Lần này / Bậc kế · Báo PH · lần X | `TomTatEm` · `CanLamEm` · `BaoPhEm` | cap-k3-gvcn, cap-k3-gvbm |
| K3 danh sách vi phạm chờ: ngày · tên · thẻ (nhóm, người ghi) · Sửa | `DsViPhamCho` | cap-k3-* |
| K1 khối Lần xử lý (một dòng "Lần trước") · Thang › · Lịch sử của em › | `LanTruoc` · `ThangYThuc` (mở bằng "Thang ›") | cap-k3-gvcn |
| K1 nút: Xác nhận xử lý · Đã xem · n (viền) · Đề xuất QL duyệt (chữ) · "Không có Đã xem" khi bắt buộc | `StudentYThucSection` | cap-k3-gvcn |
| K1 hàng vừa "Đã xem": ✓ Đã xem n vi phạm · giờ · Hoàn tác · Xem lại | `StudentYThucSection` (`vuaXem`) | (bấm thử) |
| K6 Lịch sử: lọc Tất cả · Đã xem · Đã xử lý · Đã thu hồi (có số) · phạm vi Lộ trình \| Cả lịch sử · bảng Ngày · Loại · Nội dung (trường có nhãn) · Ai · lúc nào · thao tác | `BangLichSu` | cap-k6-1440 |
| K8 Phối hợp SOS: đầu lượt một dòng (SOS · MT · n/m việc xong · + Thêm việc) · hàng tên · hạn · Xác nhận ⋯ · "mọi lượt" | `PhoiHopSosSection` `TheSos` (k8) · `ActionRow` | cap-k8-1440 |
| K2b 375: thẻ mở xếp dọc | cùng thành phần, container query | cap-375 |
| BỎ: tiêu đề "Ý thức & Phối hợp" (trùng tab) · khối Thang mở sẵn · dòng "Duyệt · thu hồi · Báo PH" hai ô · khối vàng "Vi phạm chưa xong" · Nhật ký gập cuối trang · "Thu hồi được · QL duyệt" · chữ phụ Meeting CX "không phải xử lý vi phạm…" · "Cần xử lý" ở từng việc phối hợp | — | — |
| GIỮ: mọi thao tác (bảng dưới) | | |

## KHỚP / KHÁC
| # | Chỗ | KHỚP / KHÁC | Ghi chú |
|---|---|---|---|
| 1 | Phân đoạn hai tầng + nút phải | KHỚP | |
| 2 | Dải tóm tắt tách ô, nhãn trên giá trị dưới, kẻ dọc | KHỚP | |
| 3 | Badge Cần làm: Phải xử lý vàng đặc / Chưa xem xanh viền chấm / Quá hạn đỏ ⚠ | KHỚP | |
| 4 | Báo PH ghi "lần X" + badge | KHỚP | em seed chưa có Báo PH → "—" |
| 5 | Danh sách vi phạm: ngày · tên đậm · thẻ nhóm · "n tệp ›" · Sửa phải | KHỚP | người ghi xem khi mở dòng; số tệp một câu đếm theo lô (một em) |
| 6 | Hàng nút (Xác nhận xử lý · Đã xem viền · Đề xuất chữ) | KHỚP | |
| 7 | Không có hàng "Lần trước" (K3) | KHỚP | rà PTA 04/11: bỏ hàng chân; lần cũ xem ở Lịch sử ("Xem" → Thu hồi…); Thang trong ⓘ cạnh "Đã tới"; chỉ hiện dòng khi đang xin thu hồi / QL từ chối |
| 8 | Lịch sử: lọc có số, phạm vi, bảng 5 cột, trường có nhãn | KHỚP | tab HV bỏ cột Học viên (một em) |
| 9 | Lịch sử "Đã xử lý": trường Vi phạm (tên từng vi phạm) | KHỚP | máy chủ `dongThoiGian` thêm `tenViPham` từ chính danh sách đã đọc — 0 câu thêm |
| 10 | Lịch sử "Đã xử lý": trường Báo PH | KHỚP | `baoPh` của lần (gộp vào câu đang có, 2 câu con theo `measure_id` có chỉ mục) — chỉ hiện khi lần đó có việc Báo PH |
| 11 | Phối hợp: đầu lượt một dòng, hàng 3 cột, ⋯ | KHỚP | |
| 12 | Phối hợp: "Học thuật ›" | KHÁC (giữ thao tác) | lối sang tab Học thuật đã có trước — giữ, chữ ngắn |
| 13 | 375 xếp dọc, nút 44 px | KHỚP | |

**Hình: KHỚP 12 / 12 = 100 %.** KHÁC duy nhất (#12) là TÍNH NĂNG giữ thao tác cũ (lối "Học thuật ›"), không phải lệch hình (chủ SP 04/11: > 96 % hình thì merge; KHÁC chỉ cho tính năng / luật có lý do).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| + Ghi vi phạm | đầu tab | phải thanh phân đoạn | GIỮ |
| Xác nhận / Sửa cấp bậc (khai) | trong khối Thang | nút "Khai / sửa cấp bậc" phải thanh | GIỮ · ĐỔI chỗ |
| Xác nhận xử lý · Đề xuất QL duyệt | trong khối Thang | hàng nút dưới tóm tắt | GIỮ · ĐỔI chỗ |
| Ghi nhận (một / tất cả) | "Ghi nhận" ở dòng / "Ghi nhận tất cả" | "Đã xem · n" (tất cả) · "Đã xem vi phạm này" khi mở một vi phạm | GIỮ · ĐỔI chữ (N34 ④) |
| Bỏ ghi nhận | Nhật ký | "Bỏ xem" ở Lịch sử + Hoàn tác ngay sau "Đã xem" | GIỮ · ĐỔI chữ |
| Đánh dấu đã thực hiện | dòng trạng thái | hàng nút | GIỮ |
| Xem lần xử lý (→ Thu hồi…) | ô Duyệt · thu hồi / Nhật ký | "Lần trước … Xem ›" · "Xem" ở Lịch sử | GIỮ |
| Ghi kết quả Báo PH (TVV / QL) | nút trong ô Báo PH | bấm badge Báo PH | GIỮ |
| Sửa / Xoá vi phạm, bằng chứng | mở vi phạm | "Sửa" cuối dòng + mở vi phạm (Sửa · Xoá · tệp) | GIỮ |
| Lọc nhóm vi phạm · Xem cả lịch sử | Nhật ký | Lịch sử (ô nhóm · phạm vi Lộ trình \| Cả lịch sử) | GIỮ |
| Thang xử lý | luôn mở | "Thang ›" mở tại chỗ | GIỮ |
| Phối hợp: Xác nhận · Bỏ · Sửa · Đưa lại · Khôi phục · + Thêm việc · Sửa hạn · tệp | thẻ lượt | như cũ trong phân đoạn (Bỏ qua ⋯) | GIỮ |
| Sang tab Học thuật từ Phối hợp | link dài | "Học thuật ›" | GIỮ |

Không mất thao tác nào.

## Sau rà (audit + web-design-guidelines + ponytail-review, agent riêng)
- Lịch sử theo KHUNG (container 720 px) — panel Công việc 480 px không cuộn ngang · dòng "Đã xem" mở tại chỗ (mô tả, tệp, Sửa / Xoá — người ghi vẫn sửa được) · badge đề xuất bấm → Xem lần xử lý · badge Báo PH có tên "Ghi kết quả báo PH ›" · nút lặp có `aria-label` theo dòng · lượt Phối hợp đã xong thu gọn (như trước) · "Đã xem" từng vi phạm ẩn khi bắt buộc (máy chủ từ chối) · thanh "Đã xem" trong `aria-live`, tắt khi panel con lưu.
- BỎ có chủ ý: dòng đếm cuối Nhật ký ("Lộ trình X: n vi phạm · theo nhóm") — số đã ở phân đoạn "Lịch sử n" + lọc nhóm ("thừa thì đừng thêm chữ").

## [XM] để PTA
- Không còn.

## Rà PTA 04/11 (#892)
- "Bậc kế" → "Lần này" (mọi nhóm, như K3) · hạn nằm trong badge ("Chưa xem · hạn 16/09") · bỏ hàng "Lần trước … Thang › Lịch sử của em ›", Thang vào ⓘ cạnh "Đã tới" · dòng vi phạm bỏ "… ghi" và mũi tên · hàng nút theo thứ tự mockup (bắt buộc: Xác nhận xử lý chính · Đề xuất chữ; mới: Đã xem · n viền · Xác nhận xử lý chữ · Đề xuất chữ), ⓘ sát nút · "+ Ghi vi phạm" cao 36 px như mockup · câu tên GVCN gộp vào câu sẵn có (0 câu thêm).
- **Mockup `u10-y-thuc.html` (#874) có một sửa của session này:** thẻ "Mai Hồng Ngọc · ✓ Đã xem 2 vi phạm" bị chính lần sửa vòng 2 của tôi (đổi thứ tự thẻ K2) đặt nhầm vào khung K3 (hồ sơ HV Lê Thảo Nhi — thẻ của em khác, vô nghĩa ở đó) trước khi chủ SP duyệt. Commit UI-3 chuyển thẻ về đúng chỗ ở K2 (danh sách 375), không đổi gì khác — là sửa lỗi lồng thẻ, không đổi thiết kế.
- So 2× (Playwright, `deviceScaleFactor: 2`) thẻ Ý thức mockup K3 ↔ web GVBM / GVCN: trùng bố cục, nhãn, badge, khoảng cách.
