# TEN-HV-DU — luật N55 (chủ SP 19/11): tên học viên không bao giờ bị cắt "…", hạn chế xuống dòng

Chủ SP thêm 19/11 (giữa lượt): "đồng bộ, để hết mấy chữ test xuống dòng dưới đi" → mọi chữ bài test ("Progress Test ›", "Final Test ›", "MTn ›")
LUÔN ở dòng phụ dưới tên, ở mọi hàng — dòng tên chỉ có tên.

Ảnh: tài khoản demo Head Nguyễn Khánh Vy (vai 2), giao diện tối, phông Be Vietnam Pro đã tải (`document.fonts.check` = true).
Tên dài 4–5 chữ là **tên giả** đổi tạm trong CSDL demo cục bộ để thấy lỗi (không đổi seed).

## PR1 — lưới Nhập điểm lớp thường + lưới FT

| Nơi | Trước | Sau | Ảnh cặp |
|---|---|---|---|
| Lưới lớp thường 1440 (`LuoiThuong.tsx`, Test › Lịch Test tuần / Điểm theo lớp / panel việc) | tên `truncate`, cùng dòng "Progress Test ›" → "Bùi Ngọc Kh…", "Tôn Nữ Hoàn…" | dòng tên chỉ có tên (`ten-hv`, không cắt); "Progress Test ›" đầu dòng phụ (cùng dòng tuần thi + dấu lưu); cột tên 230 → 250 để tên 5 chữ ("Nguyễn Hoàng Phương Thảo Vy") vẫn một dòng | `cap-luoi-thuong-1440.png` |
| Thẻ 375 lớp thường (`MotKyNang.tsx` `DongHv`) | tên + "Final Test ›" chung dòng; tên dài đẩy link xuống dòng riêng 44 px | tên dòng 1, "Final Test ›" đầu dòng phụ, chung dòng "Chưa đạt · 60%" (canh baseline) | `cap-luoi-thuong-375.png` |
| Hàng em chưa có lịch (`MotKyNang.tsx` `hangMo`) | `truncate` | `ten-hv` | — |
| Lưới FT 1440 (`LuoiFT.tsx`) | tên `truncate` cùng dòng "MTn ›" | tên dòng 1, "MTn ›" đầu dòng phụ (cùng "vắng W2 SEP → W3 SEP", tuần thi, dấu lưu) | `cap-luoi-ft-1440.png` |
| Thẻ 375 FT (`LuoiFT.tsx` thẻ) | tên `truncate` (span lồng) | tên + Kết quả dòng 1; "MTn › · kỳ vọng" dòng dưới | `cap-luoi-ft-375.png` |
| Hàng S Expert riêng (`LuoiFT.tsx` `DongSExHv`) | tên `truncate` | `ten-hv`, chip xuống dòng khi thiếu chỗ | — |
| Hồ sơ lớp (`BangHoSoLop.tsx` `TenEm`) | `sm:truncate` (1440 cắt, 375 xuống dòng) | `ten-hv` cả hai cỡ | — |
| Tìm kiếm đầu trang (`Header.tsx`) | kết quả HV `truncate` | `ten-hv` | — |

Thao tác TRƯỚC → SAU: không mất thao tác nào. Tên vẫn mở hồ sơ HV, "{bài} ›" vẫn mở hồ sơ lượt, Enter / mũi tên trong lưới giữ nguyên.
Bỏ `title` trên tên (tên đã hiện đủ, tooltip thừa).

Vùng chạm 375: tên và "{bài} ›" mỗi cái 40 px (trước 44), tên canh đáy, link canh đỉnh — hai dòng sát nhau như một khối (WCAG 2.5.8 ≥ 24 px).

## Chung
- Lớp `.ten-hv` (cuối `web/src/index.css`, NGOÀI `@layer`): `white-space: normal; overflow: visible; text-overflow: clip; overflow-wrap: break-word` —
  thắng `truncate` và luật cắt chung của ô bảng `.bang td[data-kieu="ten"]`.
- Phép kiểm `scripts/kiem-ten-hv.mjs` (trong `npm run check`): đỏ khi `ten-hv` đi cùng lớp cắt, khi dòng in `studentName` / `fullName` / `full_name` /
  `tenHv` / `hoTen` có lớp cắt, hoặc khi mất luật `.ten-hv` ngoài @layer. Bỏ qua có chủ ý: chú thích `ten-hv-ok` (vd tên tài khoản đăng nhập ở `Header`).
- Không đổi dữ liệu / máy chủ, không thêm request.

## Đo
- 1440: không còn phần tử tên có `text-overflow: ellipsis` bị tràn (đo bằng script chụp), không tràn ngang trang. Lưới lớp thường 1440 vốn cuộn ngang
  trong khung 45 px (bảng 1434 > khung 1389); cột tên +20 → 65 px, cột Kết quả vẫn thấy đủ chip.
- 375: không tràn ngang (`scrollWidth` = 375).

## PR2 — phần còn lại (xếp chồng trên PR1)

Mọi nơi dưới đây: bỏ lớp cắt (`truncate`, `sm:truncate`, `line-clamp-2`, luật cắt chung của ô bảng / `.lt-ten` / `.oc-muc .t` / `.chv-x`), gắn `ten-hv` →
thiếu chỗ thì xuống dòng, không "…". Bỏ `title` lặp lại tên (tên đã hiện đủ). Không đổi thao tác, quyền, dữ liệu, request.

| Nơi | Trước | Sau |
|---|---|---|
| Đầu panel `KhungPanel` (dòng phụ `ngu` "{em} · {lớp}", ~30 panel: Case, PA, Chuyển lớp, Kết luận khoá, Thi thật, Ý thức, Duyệt…) | `truncate` mọi cỡ, đầu panel cao cứng 52 px | `ten-hv`; đầu panel `min-h-[52px]` (một dòng vẫn 52) |
| Nút lùi panel "‹ {em}" (`KhungPanel`) · nút về hồ sơ "‹ {nguồn}" (`ThanhTruocSau`) | `truncate` | `ten-hv` |
| "Tiếp: {việc} · {em}" — `KhuonViec` `DongTiep`, Case (`NganCase`), Hỗ trợ HV (`HoTroHocVienTab`), Chờ duyệt (`HopChoDuyet` ×2), hộp nhập điểm (`HopNhapDiemHop`) | `truncate` | `ten-hv` |
| Hộp nhập điểm / Nhận xét — dòng phụ "{em} · {lớp} · {tuần}" (`HopNhapDiemHop` `KhungHop`) | `truncate` | `ten-hv` — ảnh `sau2-hop-nhan-xet-375.jpg` (tên 5 chữ xuống dòng đủ) |
| HV & Lớp: Tất cả (`DanhSachHvLop` `TenEm`), Đang SOS | luật cắt ô bảng / `block truncate` | `ten-hv` — `cap2-hv-lop-1440.png`, `cap2-sos-1440.png` |
| Lịch thi (`HangLichThi` `.lt-ten`, bảng + thẻ 375) | `.lt-ten` nowrap + "…" | `ten-hv` thắng `.lt-ten` — `cap2-lich-thi-1440.png`, `cap2-lich-thi-375.png` |
| Lưu trữ (`LuuTruPage`), Đã xoá (`DaXoaAdmin`, mục HV) | luật cắt ô bảng | `ten-hv` — `cap2-luu-tru-1440.png` |
| Hồ sơ lớp: Kết quả đầu ra FT (`BangKqdrLopFt`), Báo cáo PH (`TabBaoCaoPh`) | `truncate` / luật ô bảng | `ten-hv` |
| Hồ sơ GV: Em đang bổ trợ (`HoSoGiaoVienPage`) · Phân tích: Sắp thi / SOS (`SapThiSos`), Kết quả thi 375 (`KetQuaThi`), Ý thức 375 (`YThucPhoiHop`), Chưa làm (`PanelChuaLam` chip em) · Số liệu (`SoLieu`) | `truncate` / luật ô bảng | `ten-hv` (chip em `min-h-5` thay `h-5`) |
| Công việc › HV của tôi (`HvCuaToi`) · Tổng quan › GV chấm trễ (`PanelGvTre`) | `truncate` | `ten-hv` |
| Bàn giao (`banGiaoChung`, `BanGiaoPanel`) | `truncate` | `ten-hv` |
| Lịch Test: Xếp hàng loạt (`NganXepHangLoat` ×3), Xếp lịch MT cột tên (`NganXepLichMt`, trước 1440 cắt / 375 2 dòng rồi cắt), hộp kỹ năng tiêu đề (`HopKyNang` ×2), tìm kế hoạch (`TimKeHoach`, chỉ mục HV) | `truncate` / `line-clamp-2` / `.oc-muc .t` | `ten-hv` |
| Ý thức: Khai bậc lô (`KhaiBacLoPanel`), Ghi vi phạm danh sách em (`RecordViolationPanel`) | `truncate` | `ten-hv` |
| Ô chọn người (`PeoplePicker`): giá trị đã chọn, chip em (nhiều em), mục danh sách | `.oc .da b` / `.chip-em > span` / `.oc-muc .t` "…" | `ten-hv`; `.chip-em` cao `min-height: 28px` (tên dài chip cao thêm, không cắt) |
| Chuông: tin vi phạm, nhóm "n vi phạm mới", việc không mã lớp (`HopChuong`) | `.chv-x` "…" / 2 dòng rồi cắt, `.chv-v1` "…" | `ten-hv` — chữ tin đủ, xuống dòng |
| Tìm kiếm đầu trang (`Header`) — đã ở PR1 | | |

**[XM] để chủ SP quyết (không tự đổi):** Danh sách Công việc (`DanhSachViec` `DongPhu` / `DongGon`) — dòng phụ cao cứng 20–22 px ≥ 640: chip tên em
không có "…" nhưng chip nào tràn khỏi dòng bị ẨN hẳn (thường là chip sau tên; tên đầu dòng chỉ mất khi dài hơn cả cột). Sửa = cho dòng phụ xuống dòng
→ đổi nhịp danh sách việc (bố cục đã khoá). Đề xuất: giữ, vì tên em luôn là chip đầu và cột rộng.
