# HAN-BO-DAU — hạn không biểu tượng (luật V22) ở mọi nơi, sửa tận gốc

Nguồn luật: chủ SP 14/11 (V22) "badge công việc / số quá hạn hay chưa đến hạn chỉ để màu thôi, không còn icon nữa" · chủ SP 22/11 (luật hạn)
"trắng bình thường, vàng sắp đến, đỏ quá hạn, thế thôi". Quy ước đã chốt toàn web (PR-2a cột Việc, PR-3 ma trận, `trongBang`): quá hạn = chữ đỏ +
NỀN ĐỎ NHẠT (dấu ngoài màu chữ, cho người mù màu đỏ / vàng); sắp đến = vàng; còn xa = chữ phụ.

## Sửa ở gốc (một chỗ, mọi nơi dùng theo)

| Thành phần | Trước | Sau |
|---|---|---|
| `DauQuaHan` (`web/src/ui/Nhan.tsx`) | ⚠ (`IconCanhBao`) + sr-only "quá hạn" | chỉ sr-only "quá hạn" |
| `LOP_MUC_HAN.qua` | chữ đỏ đậm | chữ đỏ đậm + `bg-late-bg` bo nhẹ (`-mx-1 px-1 py-px`: không đẩy chữ ngang, không đội cao dòng) |
| `<Han>` kiểu mặc định (`web/src/ui/Han.tsx`) | ⚠ + "hạn dd/mm/yyyy" đỏ | "hạn dd/mm/yyyy" đỏ trên nền đỏ nhạt |
| `<Han trongBang>` | nền riêng `-mx-1.5 px-1.5 py-0.5` | dùng chung `LOP_MUC_HAN.qua` (đệm 4 px thay 6 px; cùng một dáng) |
| cờ `khongDau` (#2009) | thẻ 375 Lịch Test | BỎ: không ⚠ là mặc định |

Đi theo tự động (cùng `DauQuaHan` / `LOP_MUC_HAN`): `DongHan` (khối Hạn của panel việc · Phối hợp SOS), `CuoiKhoaLop` (hạn chốt), `BangPhoiHop` (hạn Phối hợp),
`TongQuanVai` (ngày ở Chờ duyệt · Tổng quan), `PanelLopAdmin`, `ChipHan` chưa quá hạn trong `Nhan.tsx` (quá hạn vẫn là badge đỏ).

## Soát ⚠ tự vẽ ngoài `<Han>`

Grep `⚠` / `IconCanhBao` / `::before ⚠` trên web + shared/domain: KHÔNG còn chỗ nào cạnh chữ hạn. Các ⚠ còn lại là lỗi / chặn / xác nhận (chưa lưu được,
chưa đổi được, "Chuyển ngay khi chốt", "Gấp", Case lặp lại qua các lớp) — GIỮ theo luật. Phép kiểm `thanhPhanChung` (V22) đổi: bỏ ngoại lệ `DauQuaHan`,
thêm khẳng định `DauQuaHan` chỉ sr-only, `LOP_MUC_HAN.qua` có nền đỏ nhạt, `Han` không còn `khongDau`.

Ghi chú: chú thích phép kiểm cũ ghi "Luật hạn NHẸ HƠN (chủ SP 22/11, thay V22): quá hạn có thêm dấu ⚠" — plan.md không có lời chủ SP nào như vậy
(lời 22/11 chỉ nói màu); PTA Plan 23/11 yêu cầu bỏ.

## Khác mockup

| Mockup | Web | Kết quả |
|---|---|---|
| v23 #l2 (Lịch Test 375): "hạn 21/11/2026" chữ đỏ, không nền | chữ đỏ + nền đỏ nhạt | KHÁC — có lý do: đồng bộ quy ước quá hạn toàn web (PTA 23/11), dấu không chỉ bằng màu |

## Ảnh trước → sau (`truoc-*` / `sau-*`, 1440 tối + 375 sáng)

| Màn | Ảnh | Thấy gì |
|---|---|---|
| Lịch Test (QL, mở Quá hạn chấm) | `*-lich-test-*` | 375: "⚠ hạn 26/08/2026" (trước #2009) → "hạn 26/08/2026" đỏ trên nền nhạt; 1440: ô Hạn chấm như cũ (đệm 4 px) |
| Tổng quan Head | `*-tong-quan-head-*` | ngày Chờ duyệt quá hạn ("gần nhất 13/09/2026", cột ngày) thêm nền đỏ nhạt — khớp ma trận "Lớp cần chú ý" |
| Công việc GV · tab Ý thức & Phối hợp | `*-cong-viec-gv-*`, `*-cong-viec-y-thuc-*` | không đổi (đã dùng chip "quá hạn n ngày" từ PR-2a) — kiểm không hồi quy |
| Panel việc (Meeting Phối hợp SOS, khối Hạn) | `*-panel-viec-1440-toi` | hạn còn trong hạn → không đổi; quá hạn sẽ đi theo `DongHan` (cùng `LOP_MUC_HAN`) |
| Hồ sơ HV · Ý thức | `*-ho-so-hv-*` | bộ demo không có hạn Phối hợp quá hạn (đã dò 60 em) → không đổi |

Không chụp được panel việc 375 bằng script (nút mở panel bị che ở 375) — đường vẽ hạn giống 1440 (`DongHan`).

## Thao tác TRƯỚC → SAU

Không đổi thao tác nào (chỉ đổi dáng chữ hạn). Không thêm request.
