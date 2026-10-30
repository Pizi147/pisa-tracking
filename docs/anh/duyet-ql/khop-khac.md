# DUYET-QL — khớp / khác mockup `thiet-ke/v10/panel-thong-tin.html` khu C (`#cv`)

Chỉnh của chủ SP / PTA thắng mockup: điểm kỹ năng **✓ / ✗ trước số** (không ▼) — dòng Điểm dùng `DongDiem` chung (PANEL-CHUNG).
Ảnh cặp (trái mockup, phải web; QL vai 2): `cv0-1440.png` (tối) · `cv1-1440.png` (sau Duyệt, tối) · `cv2-375.png` (Lịch sử mở, sáng).
`anh-cap.mjs` kéo khung nhìn dài hết trang nên panel ở ảnh cặp 1440 cũng dài theo — ảnh khung nhìn thật 1440 × 900: `cv0-1440x900.png`, `cv1-1440x900.png` (chân ở đáy panel).
Cách chụp: `KHUNG_BASE=http://localhost:5611 [BAM="Duyệt"|"Lịch sử"] node scripts/anh-cap.mjs thiet-ke/v10/panel-thong-tin.html "#cv figure >> nth=<i>" "cong-viec?the=<id>" 2 <rộng> …`
(`BAM` = mới thêm vào `anh-cap.mjs`: bấm nút theo tên trước khi chụp). Demo: thẻ 15 (Đề xuất PA · Speaking), thẻ 6 (Không cần theo dõi · W, SOS 2).

## Bảng truy vết khung → thành phần → ảnh

| Khung | Thành phần web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| `#cv` nth=0 · thân cuộn, chân dính | `PanelDuyet` → `KhungPanel chan` (huy: null · trái "Tiếp: {yêu cầu kế} · {em}" · Từ chối… · **Duyệt**); nút của `TheYeuCau` vào chân qua portal | `cv0-1440`, `cv0-1440x900` | KHỚP (rà #754: ≥ 1024 panel cao hết khung nhìn — `KhungPanel dayCot`, thân cuộn, chân ở ĐÁY như mockup v8; trước đó chân bám ngay dưới Lịch sử). Mở ô Từ chối… / Trả lời… / Duyệt… (tuần, ghi chú): ô trong thân, chân đổi thành Đóng · Gửi … |
| đầu panel: tên (link) · lớp · chip SOS | `dau.dong2` = `Link` hồ sơ · lớp · `ChipSos` (`yc.sos`, giữ "· S") | `cv0-1440`, `cv2-375` | KHỚP |
| bối cảnh `dl` Đề xuất · PA · Điểm · Hạn duyệt | khối `yc.dong` (máy chủ dựng sẵn câu) + hàng **Điểm** = `DongDiem` (`yc.diemHv`) | `cv0-1440`, `cv2-375` | KHỚP hàng Điểm. KHÁC: Đề xuất / PA / Hạn duyệt vẫn là câu `dong` của máy chủ (không có trường tách) — hạn ở chip đầu panel [XM-D1] |
| "Sau khi duyệt" | `neuDuyet` (khối vàng) | `cv0-1440` | GIỮ |
| Ghi chú cho GV (không bắt buộc) | — | — | KHÁC: web chỉ hỏi ghi chú ở loại `canGhiChu` (Duyệt…); Đề xuất PA duyệt một bấm (GIỮ luật cũ) [XM-D2] |
| "Lịch sử · n ▸" gập | `LichSuYeuCau` — ẩn khi 0; mở mới gọi `GET /lich-su?loai=yeu-cau&id=`; dòng "30/10 06:48 **Người** việc" (nhãn nhật ký chung `nhanHanhDongNhatKy`, không lộ mã máy) | `cv2-375` | KHỚP |
| `#cv` nth=1 · vừa Duyệt | panel ở lại: khối "✓ Đã duyệt: … · Hoàn tác" + bối cảnh chỉ đọc; chân "✓ Đã lưu · Tiếp: … · **Yêu cầu tiếp ›**"; đầu panel bỏ chip hạn | `cv1-1440`, `cv1-1440x900` | KHỚP. KHÁC: "✓ Đã lưu" màu xám (luật K-HTT-3, mockup xanh) · số Lịch sử là số lúc mở (chưa cộng dòng vừa duyệt) |
| dòng "Chờ bạn duyệt" vừa Duyệt | `DongDuyet` giữ chỗ (nền ok) "✓ {kết quả}" + Hoàn tác — cả Duyệt tại dòng lẫn ở panel; số "n yêu cầu" giảm 1 | `cv1-1440` | KHỚP. KHÁC: chữ "✓ Đã duyệt: {tên yêu cầu}" (cùng câu toast) thay "✓ Đã duyệt · {em}" — em đã ở đầu khối |
| chip SOS ở dòng Chờ bạn duyệt | `ChipSos` ở đầu khối em của `CayDuyet` (mọi yêu cầu của em chung một khối) | `cv0-1440` | KHỚP nghĩa; vị trí theo khối em (V8-CV), không lặp mỗi dòng |
| thanh "Duyệt n yêu cầu" | như cũ | — | GIỮ (bấm thử: tích 1 → "Duyệt 1 yêu cầu") |
| hộp đầy đủ `/cong-viec/cho-duyet` | cùng `PanelDuyet` → cũng có chân dính (thẻ đang chờ; tab Đã xử lý giữ nút trong thân) | — | GIỮ dữ liệu cũ: không xin `boiCanh` (không chip SOS / Điểm / Lịch sử — ngoài phạm vi mockup, tiết kiệm câu) |

**Chấm theo dòng (rà #754):** 11 dòng — 9 KHỚP / GIỮ, 2 KHÁC (bối cảnh tách trường [XM-D1], ô "Ghi chú cho GV" [XM-D2]) = **82 %, chưa đạt cổng 90 %**.
Hai dòng KHÁC không sửa được trong phạm vi PR mà không tự đổi luồng / máy chủ: XM-D1 cần máy chủ trả trường riêng (Đề xuất · PA · Hạn duyệt); XM-D2 là thêm ô
khi Duyệt Đề xuất PA (máy chủ đã nhận `ghiChu` ở `/duyet`, nhưng thêm ô = đổi luồng Duyệt một bấm → chờ chủ SP). Chủ SP đồng ý XM-D2 → 10 / 11 = 91 %.

## Thao tác TRƯỚC → SAU (dòng "Duyệt Công việc QL")

| Thao tác | Trước | Sau |
|---|---|---|
| Duyệt / Từ chối… / Trả lời… / + Thêm PA trong panel | hàng nút cuối thân (cuộn mới thấy) | chân dính đáy panel (thân cuộn) |
| Gửi từ chối / Gửi trả lời / Duyệt (sau chọn tuần, ghi chú) | nút dưới ô trong thân | chân dính; ô vẫn trong thân, mở là cuộn ra giữa + focus |
| Sửa… / Rút / Huỷ quyết định / Mở › | trong thân | GIỮ trong thân |
| Xem lịch sử yêu cầu | không có | "Lịch sử · n ▸" mở tại chỗ |
| Sau Duyệt ở panel | thẻ kết quả "✓ … · Yêu cầu tiếp › · Hoàn tác · Đóng" | panel giữ khung: khối ✓ + Hoàn tác, chân "✓ Đã lưu · Tiếp …" + Yêu cầu tiếp ›. **Còn yêu cầu kế: chân BỎ nút "Đóng"** (đóng bằng ✕ ở đầu panel / Esc); hết yêu cầu: chân có "Đóng" |
| Đóng ô Từ chối… / Trả lời… ở chân | focus về nút đã mở ô | focus về nút đã mở ô nếu còn trên trang, không thì về nút đầu của chân (rà #754) |
| Sau Duyệt tại dòng | dòng biến mất khi tải lại (Hoàn tác chỉ ở toast) | dòng giữ chỗ + Hoàn tác (toast giữ) |
| Duyệt nhiều · Từ chối n… · lọc · Đã xử lý · Xem thêm | như cũ | GIỮ |

Không mất thao tác nào.

## [XM]
- **XM-D1** bối cảnh tách trường (Đề xuất · PA · Hạn duyệt) như mockup cần máy chủ trả trường riêng — để sau.
- **XM-D2** "Ghi chú cho GV · không bắt buộc" khi Duyệt Đề xuất PA (mockup) — web giữ Duyệt một bấm; thêm ô cần quyết của chủ SP (thêm bước).
