# Chờ bạn duyệt — mở tại dòng (mockup v24 H1 · H2) · khớp / khác

Mockup: `thiet-ke/v24/cong-viec-gon.html` H1 (1440 tối) · H2 (375 sáng), chủ SP duyệt 24/11. Ảnh cặp toàn trang mockup | web (tài khoản demo Head, không tên thật):
`1-dong` · `2-mo-mot-dong` · `3-dang-tu-choi` · `4-da-chon-nhieu` · `5-toast-hoan-tac` · `6-rong`, mỗi cái ở `-1440` (tối) · `-1280` (tối) · `-375` (sáng). Mockup chỉ vẽ H1 (1440) và H2 (375): ảnh 1280 và các trạng thái khác đặt cạnh cùng khung H1 / H2. Dữ liệu demo khác dữ liệu mockup (ít thẻ PA hơn, nhóm khác) nên số dòng / chữ khác — so cấu trúc, cột, cỡ chữ.
`document.fonts.check('14px "Be Vietnam Pro"')` = true trước khi chụp.

## 1. Bảng truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Quyết |
|---|---|---|---|
| Nhóm theo loại, đầu nhóm "Đề xuất PA · 3 yêu cầu · 2 quá hạn" | `DsDuyet` (`.dyc-nhom` / `.dyc-dau`) | 1, 2 | GIỮ |
| Một dòng: ô chọn · em + lớp · việc · nhãn · người gửi · hạn · mũi tên · Từ chối · Duyệt | `DongYc` (`.dyc-dong`, subgrid 8 cột) | 1 | GIỮ |
| Không hình tròn đầu dòng | bỏ ô chữ cái `chuDau` + khối em | 1 | BỎ (theo chủ SP) |
| Bấm dòng → chi tiết mở dưới dòng (Điểm · Đề xuất · Sau khi duyệt · Hồ sơ ›) | `TheYeuCau dong` (`.dyc-ct`, `.dyc-kv`) | 2 | GIỮ |
| Từ chối → "Lý do từ chối *" + Huỷ · Gửi từ chối ngay dưới | `TheYeuCau dong` (`.dyc-tc`) | 3 | GIỮ |
| Thanh "Đã chọn n · Bỏ chọn · Duyệt n yêu cầu" | `HopChoDuyet` (`.dyc-lo`, dính đầu danh sách) | 4 | GIỮ |
| Toast "✓ Đã duyệt · … · Hoàn tác" | `toast.hoanTac` (toast chung của web) | 5 | GIỮ (vị trí: [XM1]) |
| 375: hai tầng + hai nút ngang cả dòng ≥ 44 px | `.dyc-*` trong `@container (max-width:699px)` | `-375` | GIỮ |
| Không có khung panel phải / ô "Chọn một yêu cầu…" | `HoTroHocVienTab`: tab duyệt một cột | 1 | BỎ |
| (mockup không vẽ) hàng lọc chip · Lớp ▾ · Đã xử lý · Báo Head | giữ nguyên `HopChoDuyet` | 1 | GIỮ |

## 2. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Xem chi tiết | Bấm chữ dòng → panel phải | Bấm dòng → mở ngay dưới (nhiều dòng mở cùng lúc được) |
| Duyệt rõ ràng | Duyệt ở dòng (cột 118 px) | Giữ — nút Duyệt cuối dòng, 1 bấm; Hoàn tác qua toast (10 s) thay dải "✓ … Hoàn tác" giữ chỗ; Hoàn tác muộn hơn vẫn ở Đã xử lý › Huỷ quyết định |
| Duyệt cần bước (Dời lịch: chọn tuần; ghi chú; Chuyển lớp) | Nút "Duyệt…" → panel | Bấm Duyệt → dòng mở ra đúng ô / panel Chuyển lớp (giữ nguyên `ChuyenLopPanel`) |
| Từ chối | "Từ chối…" → panel có ô | Bấm Từ chối → ô lý do dưới dòng; Esc đóng; Enter gửi; nút dòng khoá khi ô mở; dòng không gập khi đang gõ (không mất chữ) |
| Trả lời (Xin ý kiến) | "Trả lời…" → panel; "+ Thêm PA" ở chân | Nút "Trả lời" → ô trả lời dưới dòng; "+ Thêm PA" trong phần mở |
| Báo Head (thẻ nhắc, không nút) | dòng không nút | Giữ: dòng không nút, mở xem chi tiết + "Mở ›" |
| Link tên em → hồ sơ | Tên em là link ở đầu khối em | Cả dòng là một nút (không lồng link, như dòng việc v24); link hồ sơ trong phần mở ("Hồ sơ Case ›" / "Mở ›") — thêm một bấm |
| "Mở ›" ở dòng | Có | Chuyển vào phần mở (mockup bỏ "Mở ›" khỏi dòng) |
| Chọn hết cùng loại | Nút "Chọn hết n" | Ô tick đầu thanh chọn (chọn / bỏ hết, trạng thái lưng chừng) |
| Từ chối nhiều (lô, lý do chung) | Có | Giữ trong thanh chọn |
| ⓘ "Duyệt nhiều" ở đầu nhóm + dòng "n yêu cầu · m quá hạn" đầu hộp | Có | BỎ ⓘ (ô tick tự nói); "m quá hạn" chuyển lên đầu từng nhóm (mockup) |
| Mở từ chuông `?the=` | Mở panel | Mở sẵn đúng dòng + cuộn + viền nhấn 2 s; thẻ không còn → thẻ báo + "Xem ở Đã xử lý" |
| Lọc · Lớp ▾ · Đã xử lý 30 ngày · Báo Head · Xem thêm · chi nhánh khác | Có | Giữ |

### Từng loại thẻ

| Loại | Dòng | Phần mở / ghi chú |
|---|---|---|
| Đề xuất PA · Giữ PA GV | Từ chối · Duyệt; nhãn = đợt (chip) | Điểm (+ chip SOS giải thích) · Đề xuất · Sau khi duyệt (+ ⓘ quy chế) · Mở ›. Hàng loạt được |
| Dời lịch Test lần 2 | Duyệt có bước | Duyệt → ô "Tuần Test mới" dưới dòng (Trả lời đề nghị dời); Từ chối → ô lý do. Hàng loạt được |
| Xin ý kiến | "Trả lời" | Câu hỏi · "+ Thêm PA" · ô "Câu trả lời cho giáo viên" |
| Xử lý Ý thức · Thu hồi | Từ chối · Duyệt (cùng nhóm "Ý thức", chuẩn bị chỗ cho `sua_khai_bac` của #2058: nhóm theo `phanLoai`) | `KhoiDuyetYThuc` (vi phạm, bằng chứng — tải khi mở) · "Hạn tự chốt" = đếm ngược 5 vạch (`DemNguocYThuc`, chuyển từ dòng xuống phần mở) · thu hồi: ô "Nhờ TVV báo lại PH" |
| Đề xuất chuyển lớp | Duyệt → mở `ChuyenLopPanel` điền sẵn (như cũ) | Sửa / Rút của người gửi giữ |
| Đề xuất sửa · Không cần theo dõi · Xin xoá | Từ chối · Duyệt | Người gửi: Sửa… / Rút trong phần mở |
| Báo Head (Case quá hạn, Bàn giao quá hạn…) | Không nút | Chi tiết + "Mở ›" |
| Thẻ đã xử lý (tab Đã xử lý) | Trạng thái + ngày thay nút | Kết quả · Huỷ quyết định (trong ngày) · Sửa trả lời… · Lịch sử |
| Mọi loại | 409 "đã được xử lý" → toast trung tính + tải lại; lỗi mạng giữ chữ đang gõ | Lịch sử · n tải khi mở |

## 3. Số đo cột (Playwright, demo Head, 7 dòng, sau "Xem thêm")

| Màn | Cột (chọn · người · việc · nhãn · gửi · hạn · mũi tên · nút) | Kết quả |
|---|---|---|
| 1440 | 18 · 287,3 · 347,5 · 178,1 · 178,1 · 81 · 16 · 176 px | lệch trái từng cột ≤ 0,2 px (hạn căn phải), cao dòng đều 56 px, nút cách mép dòng **16 px** ở cả 7 dòng |
| 1280 | 18 · 287,3 · 347,5 · 153,5 · 124,2 · 81 · 16 · 176 px | như trên |

Cột "nút" 176 px = rộng hơn hai nút vì có dòng chỉ một nút "Trả lời"; dồn phải nên mép phải vẫn 16 px.
KHỚP hình ảnh ước tính ≥ 90 % (cột, cỡ / đậm chữ, cao dòng, vị trí nút, màu hạn).

## 3b. Vòng sửa theo rà của PTA Plan (đêm 24/11)

- Phần mở của MỌI loại thẻ là một lưới nhãn · giá trị (cột nhãn 120 px, giá trị tới 72 ký tự, nên đoạn dài gãy dòng cùng một chỗ ở mọi thẻ): Điểm · Đề xuất / Câu hỏi · n vi phạm · n bằng chứng · Sau khi duyệt · Hạn tự chốt · link hồ sơ cuối lưới. ⓘ quy chế đứng cạnh nhãn nó giải thích.
- `KhoiDuyetYThuc` có chế độ `luoi`: ngày vi phạm dd/mm/yyyy một dòng, chip kỹ năng sau ngày, người ghi / mô tả dòng dưới; tên tệp bằng chứng là link ngay tại giá trị (ảnh xem trước giữ).
- 375: tên em một dòng, chip SOS xuống tầng hai, mã lớp ở tầng hai ("MB FT 101 · Speaking"), tên việc dài xuống dòng trong khung (không cắt).
- Ảnh thêm: `8-xin-y-kien-tra-loi` · `9-doi-lich-chon-tuan` (1440 + 375); `2-mo-mot-dong` là thẻ Đề xuất PA. Thẻ Sửa cấp bậc (`sua_khai_bac`, #2058 đã gộp main): `10-sua-cap-bac` — cùng lưới, "Hạn tự chốt" đếm ngược như thẻ Ý thức.

## 4. Khác mockup — lý do ([XM] cho PTA Plan)

- **[XM1]** Toast Hoàn tác dùng toast chung của web (góc phải dưới, đếm lùi 10 s, có ✕), mockup vẽ giữa đáy. Sửa vị trí toast là đổi toàn app — không làm trong PR này.
- **[XM2]** Nhãn "Tutor / Bổ trợ" của mockup: thẻ không mang loại PA (`TheYeuCauDto` chỉ có `phu` = đợt, vd MT1). Web hiện một chip đợt; muốn thêm loại PA cần thêm trường ở máy chủ.
- **[XM3]** Thanh chọn có thêm "· tên loại" và nút "Từ chối n…" (từ chối lô vẫn là tính năng cũ); mockup chỉ Bỏ chọn · Duyệt n.
- **[XM4]** Thanh chọn chỉ hiện khi đã chọn ≥ 1 (mockup vẽ trạng thái có chọn).
- **[XM5]** Nhãn nút dòng là "Từ chối / Duyệt" trơn như mockup; thẻ có bước thêm (Dời lịch, ghi chú, Chuyển lớp) mở dòng ra thay vì "Duyệt…".
- **[XM6]** `data-hd="cd-dong"` chuyển sang `.dyc-dong` (trỏ Hướng dẫn "Chỉ cho tôi"). Bài kiểm nguồn cũ `prUiConLai`, `prDuyetQl`, `prS3Chu` sửa theo khuôn mới ("Huỷ" ở ô lý do theo mockup được phép).
- Prop `khuPanel` của `HopChoDuyet` không còn dùng (giữ trong kiểu để `HoTroHocVienTab` khỏi đổi nhiều); `PanelDuyet` vẫn dùng ở tab lớp Ý thức (`ClassYThucCard`).
- Thấy sẵn, không do PR này: cột ngày của `KhoiDuyetYThuc` (44 px) hẹp hơn "08/09/2026" nên chip kỹ năng đè lên ngày.

## 5. Ghi chú `ponytail:`

Không thêm chú thích `ponytail:` mới.
