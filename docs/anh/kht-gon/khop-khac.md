# KHT-GON — Kế hoạch Test bản gọn: ảnh cặp, khớp / khác, thao tác TRƯỚC → SAU

Mockup đã duyệt: `thiet-ke/v7/ke-hoach-test.html` (#659, chủ SP "Duyệt #659" 28/10). Seed demo 14/09/2026, lớp MB FT 101 (id 3), MB FOU 14 (id 28).
Vai: QL = Nguyễn Khánh Vy (id 2), GV chỉ xem = Phạm Thu Trang (id 9). 1440 tối, 375 sáng. Nối sau PR A (QUYEN-LICH-MT: GV xem Kế hoạch Test, GVCN đổi tuần MT đã qua).

## Ảnh

| Màn | Vai | Mockup \| web |
|---|---|---|
| Lưới FT | QL 1440 tối | `cap-ql-1440-toi.png` (khung 1) |
| Lưới FT | QL 375 sáng | `cap-ql-375-sang.png` (khung 375 trái) |
| Lưới FT chỉ xem | GV 1440 tối | `cap-gv-1440-toi.png` (khung 2) |
| Lưới lớp thường | QL 1440 tối | `cap-thuong-1440-toi.png` (khung 3) |

Dữ liệu mockup là dữ liệu giả (Cầu Giấy, MT1–MT7); web là seed demo (lớp mới tới MT3) — số cột, tên, tuần khác là do dữ liệu, không phải bố cục.

## Truy vết khung → thành phần

| Khung mockup | Thành phần web | Khớp |
|---|---|---|
| Ô MT: tuần (cột 56 px, 14 / 600, không năm) + kết quả `✓ 6.0` 13 / 600 hoặc một chữ 12 / 600 cùng một x | `ODotGon` (`ChipKyNang.tsx`), nội dung `oGon` (`shared/domain/oMt.ts`) | KHỚP |
| Đã xếp, chưa tới tuần: chỉ tuần mờ, bỏ "đã xếp" | `oGon` `tt = null` → tuần `font-medium text-dim` | KHỚP |
| Ô MT chia DÒNG THEO TUẦN THI (chủ SP chốt 28/10): tuần đậm 58 px + ô môn có khung `L✓` (có điểm) · `L` (chưa điểm) · `S trễ chấm` (nhiều môn trễ: ô đỏ + "trễ chấm" một lần) + trạng thái dòng (đã xếp / tuần này / chờ chấm); điểm tổng sau các môn; môn tuần khác → dòng riêng; "· không thi W S"; MT tương lai một tuần → chỉ tuần + "đã xếp" | `oGon.dong` · `ODotGon` | KHỚP |
| Vắng chữ thường dòng cuối: `vắng L R W S · W2 OCT`; đủ điểm → không ghi (lời chủ SP ban đầu) | `oGon.vang` | KHỚP |
| Khung ô MT rõ: viền `--line-strong` + nền `--bg` tối hơn thẻ; ô trễ chấm nền + viền đỏ nhạt (chủ SP 28/10 "khung MT rõ hẳn, màu tối xuống") | `ODotGon` | KHỚP |
| Vạch trái: tuần này xanh · trễ chấm đỏ + nền đỏ nhạt · xếp lại vàng; không khung ô | `VACH` (`--doing/--bad/--soon`) | KHỚP |
| Chỉ MT kế tiếp "Xếp MTn" viền đứt; MT sau "–"; tóm tắt lớp "MTn chưa xếp k em" đếm đúng các ô đó (PTA 28/10, một số liệu một hàm) | `NutXepO` / `OTrong` · máy chủ `oXepMt` + `soCotMt` (lưới và `tomTatLopFT` cùng gọi) | KHỚP (cột MT kế tiếp chỉ vẽ khi lớp có cột đó — như trước; vượt số cột thì "+ MT ▾") |
| Đã huỷ: "đã huỷ" | `OHuy` | KHÁC nhỏ: mockup gạch tuần cũ — lượt huỷ không gửi tuần về lưới, nên chỉ chữ "đã huỷ" |
| S Ex một dòng khung đứt hồng | nút S Ex một dòng | KHỚP |
| Thẻ lớp nền `surface`, hàng lớn, chip "Chỉ xem" | `LopKeHoach` | KHỚP |
| Cột: tên 190 (375: 120, tên hai dòng) · MT 252 · lớp thường 250 (mockup sửa theo: 150 làm "W2 SEP W4/8 chờ chấm" tràn cột) · S Ex 136; tiêu đề cột trái; dòng 1 chặn tràn (chữ trạng thái cắt gọn + tooltip) | `LuoiKeHoach` · `ODotGon` | KHỚP |
| Lớp thường: tuần + `W4/8` + chữ; chưa có bài "Xếp W2 NOV" (đề xuất ở tooltip); tiêu đề "đề xuất W4/8" dòng 2 | `ODotGon khoa` · `NutXepO` | KHỚP |
| ⓘ chú giải 6 dòng | `ChuGiaiGon` (mẫu dựng bằng chính ô) | KHỚP |
| 375: Xuất ▾ | `Menu` "Xuất" (sm:hidden) | KHỚP; ⓘ nằm cùng hàng ô tìm thay vì cạnh công tắc (hàng công cụ sẵn có tự xuống dòng) |
| Hộp một đợt, ngăn Xếp nhiều MT, Xuất | giữ `HopKyNang`, `NganXepLichMt`, `NganXuat*` | GIỮ (mockup ghi "giữ HopKyNang hiện có") |
| "+ 2 HV · Hiện tất cả 9" và "+ Ghi chú lớp" một hàng | chân lớp một hàng | KHỚP |
| (không vẽ) Lớp dài thu gọn: 10 em đầu | 10 em đầu + MỌI em cần chú ý (cần xếp lại, trễ chấm, MT kế tiếp chưa xếp) | THÊM (critique P1, nguyên tắc "không em nào bị bỏ sót") |

[XM] cho chủ SP chọn (không tự đổi, ngoài phạm vi màn):
- Nút "Xếp nhiều MT…" ở chế độ tối: mockup tô kín xanh nhạt; web GIỮ nút chính tối = nền thẫm + viền (D4, chủ SP 27/10, áp toàn web — một nút một dáng; PTA chốt giữ 28/10).
- Công tắc "✓ Fast Track · n lớp" (thành phần chung `CongTacKhung`) khác mockup "Fast Track  4"; ở 375 công tắc chiếm một hàng, "Lọc ▾" xuống hàng sau.
- Hộp một đợt (`HopKyNang`, mockup ghi "giữ"): chip trạng thái dòng kỹ năng là viên nền nhạt, nút "Xóa" cùng hàng Đóng / Lưu — critique đề nghị dời Xóa vào ⋯; để PR riêng nếu chủ SP muốn.

BỎ: dòng "L R W S" ở mọi ô · năm `2026` · chữ "Overall" (ở tooltip + câu đọc) · chữ "đã xếp" · khung viền mọi ô · chip "MTn · chưa xếp" ở mọi MT sau MT kế tiếp · dòng vắng lặp từng môn (`L vắng W2 OCT · R vắng W2 OCT · …`).
"↗" (chủ SP 28/10 bỏ toàn web): "Mở MTn mới ↗" trong hộp Khôi phục → "Mở MTn mới ›".
GIỮ: mọi thao tác (bảng dưới), chú giải luật, ghi chú lịch / ghi chú lớp sửa tại chỗ, tooltip đầy đủ, câu đọc màn.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | Bước |
|---|---|---|---|
| Xếp / đổi tuần một đợt (QL) | bấm ô → hộp một đợt | như cũ | 1 = 1 |
| Xếp MT kế tiếp (QL) | bấm chip "MTn · chưa xếp" | bấm "Xếp MTn" | 1 = 1 |
| Xếp MT vượt số cột · S Ex | "+ MT" cuối hàng | như cũ | = |
| Khôi phục MT đã huỷ (QL) | bấm ô "Đã huỷ" | bấm ô "đã huỷ" | = |
| Lớp thường chưa có bài | bấm ô "đề xuất W4/8" | bấm "Xếp W2 NOV" (đề xuất ở tooltip) | = |
| Xếp nhiều MT / Xếp lịch Test · Xếp cả lớp theo đề xuất | nút | như cũ | = |
| Xuất Excel · Xuất điểm Test | hai nút | 1440 hai nút; 375 "Xuất ▾" | 1 → 2 ở 375 (gọn hàng) |
| Tìm lớp / học viên · lọc chi nhánh · Cần xếp lại · FT / Lớp thường · lọc tuần từ Tổng quan | hàng công cụ | như cũ | = |
| Ghi chú lịch / ghi chú lớp | sửa tại chỗ | như cũ | = |
| GV chỉ xem (PR A) | — | ô mở trang lượt MT; không nút xếp / xuất / + MT | mới |
| Biết kỹ năng nào chưa có điểm | đọc dòng "L R W ✓ · S" | nhìn ô đặc / viền đứt | = · nhanh hơn |
