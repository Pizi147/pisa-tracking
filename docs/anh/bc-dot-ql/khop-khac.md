# BC-DOT-QL — QL / Admin quyết đợt Báo cáo PH (chủ SP 06/11)

Lời chủ SP (nguyên văn): "về báo cáo tháng/ đợt: áp dụng cho tất cả các loại lớp một luật như sau: QL/ Admin có thể ra quyết định là đợt đo/ tháng đó có cần báo cáo hay không, hay ngược lại, cần báo cáo vào lúc nào bất chợt nhé".

Thêm nút theo mẫu sẵn có (hộp panel như "Lớp nghỉ 1 tuần", ô chọn nhiều lớp `ChonLop` như Kế hoạch Test, Hoàn tác toast) — không cần mockup (plan.md 1.3b). Ảnh trước | sau: `truoc-*.jpg` · `sau-*.jpg` (tab Báo cáo PH, 1440 tối + 375 sáng) · `sau-hop-bo-1440-toi.jpg` · `sau-hop-them-1440-toi.jpg` · `sau-da-bo-1440-toi.jpg` · `sau-da-them-1440-toi.jpg` (chụp từ bản chạy thật, QL Monbay, ngày demo 14/09).

## Thao tác TRƯỚC → SAU

| Chỗ | Trước | Sau |
|---|---|---|
| Tab Báo cáo PH · đầu tab (QL / Quản trị / Admin) | chọn đợt · "n/N em đủ" · Xuất lớp | + nút **Không báo cáo đợt này** (đợt thêm: **Xoá đợt**) · + nút **+ Đợt báo cáo** |
| GV · TVV | như trên (không nút) | không đổi — máy chủ trả `quyetDot = false`, 403 nếu gọi thẳng |
| Không báo cáo đợt này | không có | hộp nhỏ: nói rõ hệ quả (ẩn khỏi tab, việc Admin, Excel; bài đã viết giữ) · "Áp cho lớp" + thêm lớp cùng chi nhánh · **Bỏ đợt này** → toast Hoàn tác |
| Đợt đã bỏ | — | ô chọn đợt có nhóm **Không báo cáo** (chỉ QL / Admin thấy); chọn → thẻ "Tháng 11 · Không báo cáo" + **Khôi phục** → hộp (áp nhiều lớp được) → toast Hoàn tác (= bỏ lại) |
| + Đợt báo cáo | không có | hộp: tên (tuỳ chọn, mặc định "Đợt W2 NOV") · mở từ (hôm nay hoặc **hẹn trước**) · hạn (mặc định +6 ngày) · Áp cho lớp (nhiều lớp cùng chi nhánh) · **Thêm đợt** → mở ngay đợt mới, toast Hoàn tác |
| Đợt thêm đang dùng | — | **Sửa đợt** (tên · mở · hạn, nhiều lớp, Hoàn tác trả giá trị cũ) · **Xoá đợt** (hộp, nhiều lớp, toast Hoàn tác) |
| Đợt hẹn trước (mở ở tương lai) | — | chưa hiện cho GV; QL / Admin thấy ở nhóm **Sắp mở** của ô chọn đợt → thẻ "Sắp mở từ dd/mm" + Sửa đợt · Xoá đợt; tới ngày mở tự hiện như đợt thường |
| Đợt đã xoá | — | không mất: nhóm **Đã xoá** của ô chọn đợt (30 đợt gần nhất) → thẻ "Đã xoá" + **Khôi phục** (bất cứ lúc nào, không cần toast; bài đã viết còn nguyên) |
| GV viết đợt thêm | — | như đợt thường; điểm tự điền = lượt gần nhất có điểm, tuần thi ≤ hạn (FT: Mock; lớp thường: Progress / Final của lớp) |
| Chip trên tab · việc Admin "Xuất báo cáo PH" · "thiếu n em" · Excel chi nhánh theo tháng | chỉ đợt tính từ lịch lớp | đợt đã bỏ biến mất khỏi cả bốn; đợt thêm vào như đợt thường (Excel: theo tháng của hạn) |
| Nhật ký | Viết / Xuất báo cáo PH | + Bỏ / Khôi phục / Thêm / Xoá / Khôi phục (đợt đã xoá) đợt báo cáo PH, mỗi lớp một dòng |

Không mất thao tác nào: viết, sửa điểm, đặt sẵn, Xuất lớp / Xuất em, Excel chi nhánh giữ nguyên.

## Dữ liệu · đọc Turso
- Bảng mới `bao_cao_ph_dot` (class_id, ma, loai 'bo' | 'them', ten, mo, han, nguoi, luc, xoa_luc) — CHỈ THÊM bảng + chỉ mục, migrate chạy lặp được. Đợt bỏ = một dòng `bo` (xoá dòng = khôi phục); đợt thêm mã `them:<id>`, xoá = xoá mềm (`xoa_luc`), bài đã viết ở `bao_cao_ph` không bị đụng.
- `dsDotLop` (shared) gộp: đợt tính + đợt thêm (đã tới ngày mở) − đợt bỏ. Đọc **một câu theo lớp / lô** (`docTuyChinhDot`): tab, chip, panel, lưu, xuất lớp +1 câu; việc Admin và Excel chi nhánh +1 câu cho cả lô lớp (không theo từng lớp). Lớp chưa có quyết định nào: 0 dòng đọc.
- Dời tuần thi (SUA-LICH-LOP): mã đợt bỏ đi theo tuần thi mới (như bài đã viết).

## Hình ảnh
- Nút dùng `btn btn-sm` cùng cỡ nút "Xuất lớp"; ô 44 px trên điện thoại. Không đổi màu, cỡ chữ, bảng.
- Hộp dùng `KhungPanel rong="hep"` + `Khoi` + `Truong` như "Lớp nghỉ 1 tuần".

## Rút lại được MỌI việc (chủ SP 06/11: "luôn nghĩ tới mọi trường hợp… xóa, khôi phục, rút lại, TẤT CẢ")
| Việc | Rút lại bằng |
|---|---|
| Không báo cáo đợt | Hoàn tác (toast) · Khôi phục (thẻ đợt, nhóm "Không báo cáo", bất cứ lúc nào) · nhiều lớp |
| Khôi phục đợt bỏ | Hoàn tác = bỏ lại |
| Thêm đợt | Hoàn tác = xoá · Sửa đợt · Xoá đợt |
| Sửa đợt | Hoàn tác trả đúng tên / mở / hạn cũ |
| Xoá đợt | Hoàn tác · Khôi phục (nhóm "Đã xoá") · bài đã viết không bao giờ bị xoá |
| Đợt hẹn trước | Sửa ngày mở (về hôm nay → hiện ngay) · Xoá · Khôi phục |
- Nhật ký mỗi lớp: Bỏ / Khôi phục / Thêm / Sửa / Xoá / Khôi phục (đợt đã xoá). Nhiều lớp = mỗi lớp một dòng; việc trên đợt thêm ở nhiều lớp khớp theo cùng tên / mở / hạn.
- Áp nhiều lớp cho "Không báo cáo": đợt tháng FT trùng mã giữa các lớp FT; đợt Progress / Final lớp thường chỉ trùng khi cùng tuần thi — lớp không có đợt đó được bỏ qua và toast ghi "n lớp không có đợt này".
- TVV: không bỏ / thêm / sửa đợt (như yêu cầu "trừ TVV"); vẫn xuất Excel như cũ.
- Ảnh các trạng thái **Sửa đợt / Đã xoá / Sắp mở** chưa chụp (khung trình duyệt của phiên bị ẩn lúc kiểm); đã bấm thử thật trên bản chạy (Sửa → tên mới ở ô chọn + chip tab; Xoá → nhóm "Đã xoá"; Khôi phục không qua toast) và có phép kiểm BC-16.

## Ghi chú ảnh
- Ảnh **trước** = cùng trang, cùng dữ liệu, ẩn hai nút mới bằng DOM (bản chính chưa có nút nên giao diện trước PR y hệt). Ảnh **sau** chụp từ bản chạy thật sau `migrate`.
- Ảnh 375 chỉ chụp sáng (đợt thêm "Đợt W3 SEP" đang xem nên nút đầu là **Xoá đợt**); hộp bỏ / thêm đợt chụp ở 1440 tối.
