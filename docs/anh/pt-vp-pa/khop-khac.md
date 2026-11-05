# PR-3 PT-VP-PA — khớp / khác mockup v13 A4 (+ P-PA)

Ảnh cặp (trái trước = main · phải sau = PR): `cap-a4-…` (thẻ Vi phạm, 1440 tối), `cap-a4m-…` (375 sáng), `cap-lop-…` (thẻ Lớp có vi phạm),
`cap-pa-…` (Hiệu quả PA · PA có kết quả), `cap-gv-viec-…` (Phân tích GV · Việc đúng hạn). Dữ liệu demo Monbay, W1 MAR – W3 SEP.

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần | Ảnh | Kết quả |
|---|---|---|---|
| A4 | panel 820 "SỐ · Ý THỨC" · tiêu đề ô · "mới nhất trước · dữ liệu đến" · "n vi phạm · m HV" | cap-a4 | KHỚP (không ghi chi nhánh: đường Ý thức không trả tên chi nhánh — giữ như cũ) |
| A4 | Học viên · Lớp · Ngày · Vi phạm (nhóm đậm + mô tả dòng phụ) · Người ghi · Trạng thái | cap-a4 | KHỚP |
| A4 | Trạng thái là viên nhãn (chữ + màu) | cap-a4 | KHỚP — dùng `NhanViPham` (cùng nhãn cửa trạng thái Ý thức: Mới · Đã ghi nhận · Cần xử lý · Quá hạn n ngày · Chờ QL duyệt · Đã xử lý) thay ba nhãn rút gọn của mockup; một tên một thứ với tab Ý thức |
| A4 | dòng phụ "Report 2" dưới trạng thái | — | KHÁC: chưa có (nhãn trạng thái đã ghi bậc khi Đã xử lý); thêm khi chủ SP cần |
| A4 375 | thẻ: tên + nhãn phải · lớp · ngày · người ghi · nhóm + mô tả | cap-a4m | KHỚP dáng A1m |
| P-VP lớp | Lớp · GVCN · HV có vi phạm / sĩ số · Vi phạm · Chưa xử lý | cap-lop | THÊM theo ghi chú 2a (hôm nay CHỈ TÊN) |
| P-VP em | Học viên · Lớp · Vi phạm · Chưa xử lý · Bậc hiện tại · Lần xử lý gần nhất | — | THÊM (ô HV có vi phạm, HV cần chú ý) |
| P-PA | Học viên · Lớp (+ "từ W3 JUL" tuần bắt đầu) · Case (kỹ năng) · PA (loại + mô tả dòng phụ) · Kết quả · Người phụ trách | cap-pa | THÊM theo ghi chú 2a — tuần bắt đầu ở dòng phụ dưới Lớp để 7 cột vừa 820 |
| P-PA nghĩa vụ | + Đợt · Hạn · Ngày ghi · Đúng hạn / ⚠ Trễ n ngày (bỏ cột Người phụ trách — luôn là GV đang xem) | cap-gv-viec | THÊM (Phân tích GV · Việc đúng hạn, Kết quả PA đúng hạn) |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước (main) | Sau | |
|---|---|---|---|
| Bấm ô Ý thức (Vi phạm, Chưa xử lý, HV có vi phạm, Lớp có vi phạm, HV cần chú ý) | danh sách "Loại · dd/mm" + tên; thẻ Lớp CHỈ mã lớp | bảng đủ cột | ĐỔI nội dung |
| Bấm ô PA (Hiệu quả PA, Báo cáo HV "PA cải thiện", Phân tích GV "Việc đúng hạn", "PA hiệu quả") | danh sách mô tả PA + tên | bảng PA (kết quả, loại, người, hạn) | ĐỔI nội dung |
| Panel "PA chưa có kết quả" — nút Ghi kết quả (XM-4) | có | có (giữ panel làm tại chỗ) | GIỮ |
| Panel Case (Case chưa chọn nhóm, Case có PA), `PanelChamDiem` | có | không đổi | GIỮ |
| Tên em → hồ sơ; mã lớp → hồ sơ lớp | "Hồ sơ" cuối dòng | tên, lớp là link | ĐỔI chỗ, không mất |
| Phân trang 10 / 20 / 50 | có | có | GIỮ |

## Turso

Panel chỉ tải khi bấm. Vi phạm: một câu theo lô (vi phạm + tên + lớp + người ghi); PA: một câu theo lô (+ kết quả cuối, Mini Test); nghĩa vụ: + hai câu theo lô.
Đo: Ý thức ô Vi phạm 10 câu / 510 dòng (QT 769); Lớp có vi phạm 9 câu (trước 12); Hiệu quả PA 10 câu (trước 15); GV Việc đúng hạn 15 câu / 352 dòng. Trần ở `tocDoDuong.ts`.
