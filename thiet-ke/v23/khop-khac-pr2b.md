# NHẸ HƠN · PR-2b PANEL-VIEC — khớp / khác mockup v23

Mockup: `khung-panel.html` P1 / P3 (`.pht1`, `.vpd`, `.chu-dai`) + đặc tả `docs/superpowers/specs/2026-11-22-nhe-hon-design.md` mục 6.4 (chủ SP 22/11: khối để trên, không cần thanh cố định riêng, theo dõi đông thì "+n người" bấm mở hết). Panel Meeting và Trả lại không có khung v23, nên so với khung v22 đã duyệt (`v22/giao-viec.html` G8b / G8f, `v22/tra-lai-vi-pham.html` T4a), khối theo v23.
Ảnh cặp (seed, ngày demo 14/09/2026, Playwright Edge, phông Be Vietnam Pro đã nạp): `docs/anh/nh-pr2b/`. Dữ liệu chụp được tạo bằng chính các nút trên web: sửa hạn Báo PH về 12/09 (quá hạn), GVCN xác nhận Meeting CX/GĐCN, TVV trả lại một vi phạm, thêm / bỏ người theo dõi.

## Bảng truy vết khung → thành phần → ảnh
| Khung mockup | Thành phần web | Ảnh | |
|---|---|---|---|
| `.pht1`: Phụ trách · Hạn · Theo dõi ngay dưới đầu panel, một dải nền phụ, nhãn nhỏ 12 / 600 | `KhoiGiaoViec.tsx`: bỏ lưới viền 3 cột × 46 px; một dải `surface-2` bo 10, các cụm (`Cum`) dàn ngang: hàng 1 Phụ trách · Hạn, hàng 2 Theo dõi, hàng 3 Mô tả việc | p1, meeting, tra-lai | KHỚP. Theo lời chủ SP: không làm thanh cố định, đặt trong thân, thoáng hai hàng |
| 375: lưới 64 px · giá trị · nút | `Cum` ở 375: `grid 64px 1fr auto`, mỗi cụm ≥ 44 px | p3, meeting-375, tra-lai-375 | KHỚP |
| Hạn trong khối: "21/11/2026" tô màu, không ghi "quá hạn n ngày" | `DongHan` (`khoi`): ngày dd/mm/yyyy theo `mucHan` / `LOP_MUC_HAN` (PR-1), quá hạn có ⚠; bỏ thẻ "còn / quá n ngày" và thẻ "mặc định" trần; "đã chỉnh" (rê thấy ngày mặc định) | p1 (12/09 đỏ ⚠), tra-lai (16/09 vàng) | KHỚP |
| Đầu panel: "quá hạn 2 ngày · hạn 21/11/2026" | Báo PH / Trả lại / Phối hợp SOS: `ChipHan chuThuong` ở đầu panel ("12/09/2026 · quá hạn 2 ngày"); hạn tạm dừng (chờ GV sửa) thì không ghi | p1, tra-lai, p3 (tạm dừng) | KHỚP. Đây là chỗ DUY NHẤT trong panel ghi "quá hạn n ngày" |
| Đổi / Sửa hạn / ✕ / + bấm thẳng | nút 28 px (375: 44); "+" tròn viền đứt ngay sau tên; 375 nút "Sửa" (tên đọc vẫn "Sửa hạn") | p1, p3 | KHỚP |
| Theo dõi chật → vài tên + "+n người", bấm mở hết | `TRAN_THEO_DOI = 3`: > 3 người hiện 3 + nút "+n người" (`aria-expanded`), mở rồi có "Thu gọn" | p1 (+1 người), kiểm Playwright | KHỚP |
| Meeting: theo dõi chung của cả việc | `DongTheoDoi rieng` lên ĐẦU thân panel (trước bối cảnh / các phần), cùng dáng dải | meeting-1440, meeting-375 | KHỚP (trước đó nằm cuối panel) |
| `.vpd`: bấm vi phạm, mở ngay dưới dòng: Nhóm · Ngày · người ghi · Mô tả · Tệp | `DsViPhamBaoPh` / `DongVp` (`yThuc/TraLai.tsx`, PTA giao PR-2b): Nhóm (`nhom` mới từ máy chủ, cùng câu) · tên đậm · **ngày giờ** · **người ghi** · buổi · Mô tả tách câu, số in đậm · Tệp tải khi mở dòng | p1, p3 | KHỚP. Seed không có mô tả / tệp vi phạm, nên ảnh chỉ thấy Nhóm + Ngày |
| `.chu-dai`: chữ dài in đậm người / số / hạn, tách dòng | mô tả vi phạm: tách câu, đậm số; ngày + người ghi đậm | p1 | KHỚP một phần. Dòng tóm "3 vi phạm · GVCN … REPORT" là `TienTrinh` (`yThuc/BangLan.tsx`, tệp PR-6), không sửa ở đây |
| Lịch sử gập sẵn | `LichSuGap` (đã gập sẵn) | p3 | GIỮ |
| ⋯ · ✕ cùng ô 36, thẳng hàng | đo 1440: ⓘ / ⋯ / ✕ tâm y = 122,5 (lệch 0); 375: 214 (lệch 0); ✕ trong chip theo dõi lệch 0 so với tâm chip | — | KHỚP |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Đổi người phụ trách (hộp nhỏ, Về mặc định, Hoàn tác 10 giây) | nút cuối dòng lưới | nút ngay sau tên | GIỮ |
| Sửa hạn / Đặt hạn / Về mặc định / Huỷ sửa, 409 giữ ngày đang gõ | nút cuối dòng | nút sau ngày; ô sửa trải hết hàng | GIỮ |
| Thêm người theo dõi (hộp chọn nhiều) · ✕ bỏ (Hoàn tác) | ✕ trong chip, "+" vuông cuối dòng | như cũ; "+" tròn ngay sau tên | GIỮ (Playwright: thêm 2, bỏ 1 đều chạy) |
| Xem đủ người theo dõi | luôn hiện hết | > 3 người: "+n người", bấm mở hết / Thu gọn | MỚI (chủ SP 22/11) |
| Mô tả việc: + Thêm / Sửa / Lưu / Huỷ / Ctrl+Enter / đếm 500 | dòng lưới | cụm cả hàng | GIỮ |
| Mở vi phạm · Trả lại · Lịch sử vi phạm · Dịch | có | có | GIỮ |
| Xem tệp của vi phạm | không có trong panel (phải sang hồ sơ HV) | bấm mở dòng thì thấy, tải / mở tệp | MỚI (góp ý chủ SP 22/11 ý 1) |
| Thẻ "mặc định" cạnh hạn | có | bỏ (Phụ trách vẫn ghi "mặc định / {tên} giao"; hạn đã chỉnh ghi "đã chỉnh") | BỎ, không phải thao tác |
| "còn n ngày" / "quá hạn n ngày" trong khối | có | chỉ tô màu ngày; "quá hạn n ngày" lên đầu panel | ĐỔI CHỖ (luật hạn) |

## Turso
- `/giao-viec/*`, `/my-work`, panel Báo PH: +0 câu. `nhom` đọc trong câu sẵn có (`viPhamXuLy` đã SELECT `category`).
- Tệp vi phạm: đường sẵn có `GET /attachments?ownerType=violation&ownerId=` (quyền = quyền xem HV của vi phạm, như mọi đường tệp). Chỉ gọi khi người dùng mở một dòng: đo **7 / 5 / 7 câu · 5 / 3 / 5 dòng** (QL / QT / TVV). Trần mới ở `tocDoDuong.ts`: 13 / 11 / 13 câu · 55 / 53 / 55 dòng.

## [XM] / để sau
- Dòng tóm "3 vi phạm · GVCN … đã xử lý REPORT 2" in đậm (`.chu-dai`) nằm ở `TienTrinh` (`yThuc/BangLan.tsx`, tệp PR-6) → PR-6 hoặc PR sau.
- Panel Meeting / Trả lại không có khung v23 riêng → so với khung v22; phần thân ngoài khối giữ nguyên.
