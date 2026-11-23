# BAO-PH-SAP-MO — "Báo cáo PH sắp mở" có lại chỗ ở Công việc GV

Chủ SP 24/11 (plan.md 599 mục 2): #2001 bỏ dải "Sắp tới". "Test tuần tới" đã có ở cột Test kế, còn "Báo cáo PH sắp mở" thì không còn chỗ hiện. Thêm lại MỘT dòng chữ nhỏ dưới "Lớp của tôi". Mockup v23 không vẽ dòng này: đây là thêm chữ + ô số theo mẫu sẵn có (plan.md 1.3b), không đổi bố cục.

## Truy vết khung → thành phần → ảnh

| Khung | Ý | Thành phần | Ảnh | Khớp |
|---|---|---|---|---|
| G1 (1440) · G3 (375, tab "Lớp của tôi") | Bảng Lớp của tôi | `LopCuaToi.tsx` (không đổi) | `gv-1440-toi.png`, `gv-lop-375-sang.png` | KHỚP (như #2001) |
| — (mockup không vẽ) | Dòng "Báo cáo PH · mở 20/09/2026 · [2] lớp" dưới bảng, chỉ khi có đợt sắp mở trong 7 ngày | `SapToi.tsx` `BaoCaoPhSapMo` (thay dải `SapToi` không còn dùng) | `gv-1440-toi.png`, `gv-lop-375-sang.png` | THÊM (chủ SP 24/11) |
| — | Bấm ô số → hộp danh sách cũ: tiêu đề + ✕, mỗi lớp một dòng (mã lớp là link sang tab Báo cáo PH của đợt) | cùng hộp `NoiTren` của dải cũ (1440 nổi neo ô số, 375 nằm tại chỗ), Esc / bấm ngoài để đóng, tiêu điểm vào hộp | `gv-hop-1440-toi.png`, `gv-hop-375-sang.png` | GIỮ (hộp cũ) |
| — | Ngày dd/mm/yyyy | `ngan` (= `shortDate`, luật hạn NH4) | cả bốn ảnh | KHỚP |
| G3 (375) | Thẻ lớp hai hàng: mã lớp + chip + số việc canh phải · Test kế (trước: ~125 px, số việc một mình một dòng) | `LopCuaToi.tsx` `DongLop` / `SoViecLop` (container < 640 px) | `gv-lop-375-sang.png` | SỬA (PTA rà #2017, ~70 px / lớp) |
| — | "2 lớp" một khối trong ô số, không tách | `BaoCaoPhSapMo` | cả bốn ảnh | SỬA (PTA rà #2017) |
| — | "Test tuần tới" | — | — | BỎ (đã ở cột Test kế, PTA) |

**[XM] "›" → ô số:** PTA ghi "… · n lớp ›". Luật V5 (CLAUDE.md): "ô số = mở tại chỗ, chữ › = đổi trang". Ở đây bấm là mở hộp tại chỗ nên dùng ô số (`VUNG_BAM_SO` + `LOP_OSO`, như dải cũ), không dùng "›". Ngày hiện là ngày mở sớm nhất trong các đợt; số = số lớp khác nhau.

## Dữ liệu / tốc độ
`sapToi.baoCaoPh` vẫn nằm trong `/my-work` của GV (`kemTestSapToi`, máy chủ không đổi). **0 request thêm, 0 câu thêm.**

## Thao tác TRƯỚC → SAU

| Trước (#2001) | Sau |
|---|---|
| Không thấy đợt Báo cáo PH sắp mở ở Công việc | Dòng nhỏ dưới Lớp của tôi; bấm số → hộp danh sách → link tab Báo cáo PH của lớp |
| (trước #2001) dải "Sắp tới · Test tuần tới · Báo cáo PH" + ⓘ | Test ở cột Test kế; Báo cáo PH ở dòng này; bỏ ⓘ (luật bỏ chú thích 07/11) |

Không mất thao tác nào.
