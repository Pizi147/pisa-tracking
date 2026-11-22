# v23 ⑨ Công việc Head + ⑩ Tổng quan Head › khối Giáo viên — ghi chú

Mockup: [`cong-viec-head.html`](cong-viec-head.html) · [`tong-quan-head-gv.html`](tong-quan-head-gv.html) · ảnh `anh/cong-viec-head-*.png`, `anh/tong-quan-head-gv-*.png`.
Đặc tả: `docs/superpowers/specs/2026-11-22-nhe-hon-design.md` mục 3 "Head" (#1985) · chủ SP 22/11 vòng 2 ý 7 · N64 (làm thay trực tiếp) · luật hạn (dd/mm/yyyy, vàng ≤ 2 ngày, đỏ quá hạn).

## Truy vết

| Ý / mục | Khung | Thành phần web |
|---|---|---|
| Giữ Của tôi / Của GV / Tất cả | H1–H4 | `ChonPhuTrach.tsx` (đoạn chọn; "Chọn giáo viên…" → "Lọc thêm") |
| "Của tôi" mặc định: việc Head + việc GV của chính mình, theo loại | H2 | `/my-work` (Của tôi) — Chờ bạn duyệt · Xếp lịch MT còn thiếu (N57) · Chấm điểm · Cuối khoá; Lớp của tôi bên phải |
| "Của GV · 12 quá hạn": theo loại, đầu mục nổi, chỉ quá hạn + sắp đến | H1, H3a | `/my-work?nguoi=tat-ca` lọc tại máy: hạn ≤ hôm nay + 2 ngày; số trên nút = số quá hạn |
| Dòng "lớp / em · thiếu gì · hạn", tên GV nhỏ cuối dòng | H1 | `DanhSachViec.tsx` cột `ai` khi người xem ≠ người phụ trách |
| Bấm là làm thay luôn, dải "Bạn đang làm thay …" (N64) | H1, H3b | `PanelViec` + dải `LamThay` dưới đầu panel; bỏ nút "Làm thay" |
| Lọc một GV qua "Lọc thêm" | H3a (chip), H4a (hộp) | hộp lọc: Giáo viên · Loại việc |
| Khối Giáo viên Tổng quan: tên · số quá hạn · loại · lâu nhất; nhiều lên đầu; bấm → Công việc "Của GV" lọc GV + loại | Q1, Q2a | khối mới ở Tổng quan Head (`TongQuanPage`), link `/cong-viec?xem=gv&gv={id}&loai={muc}` |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Của tôi / Của GV / Tất cả | giữ |
| "Chọn giáo viên…" trong ô chọn | thành "Lọc thêm" (GV + loại), chip lọc bỏ được |
| Nút "Làm thay" trên panel việc của GV | **bỏ** — mở là làm được (N64), dải nhắc + lịch sử ghi tên |
| "Của GV" hiện mọi việc | chỉ quá hạn + sắp đến; việc còn xa xem ở "Tất cả" |
| + Giao việc · + Task | giữ |
| Tổng quan: (chưa có khối GV quá hạn) | thêm khối Giáo viên (thông tin, bấm số = đổi trang có lọc) |

## Nguồn dữ liệu + Turso

- Công việc "Của GV" = cùng `/my-work?nguoi=tat-ca` đang có (đo audit 21/11: **50–51 câu · ~1 200 dòng**), lọc quá hạn / sắp đến tại máy → +0 câu.
- **Cảnh báo cho PR code (khối Giáo viên ở Tổng quan):** nếu Tổng quan Head gọi thêm `/my-work?nguoi=tat-ca` mỗi lần mở trang thì **+~50 câu · ~1 200 dòng / lần** (đường đã sát trần 30 câu). Ước Head 5 người × ~10 lần mở / ngày ≈ +60 K dòng / ngày (≈ +1,8 M / tháng) — nhỏ so với mốc 450 M nhưng đường vượt trần câu. Đề xuất nhẹ hơn: máy chủ trả kèm vào đường Tổng quan đang gọi một mảng đếm `{gv, soQuaHan, theoLoai, quaHanLauNhat}` tính từ **cùng hàm** `myWork(..., 'tat-ca')` (không câu theo từng GV); hoặc chỉ tải khi khối cuộn vào tầm nhìn. PTA / chủ SP chọn.
- Số khớp: số GV ở Tổng quan = số dòng quá hạn của GV đó ở Công việc "Của GV" (cùng `demDongViec`).

## [XM]

- [XM-11] "Sắp đến" lấy mốc ≤ 2 ngày (luật hạn đề xuất PTA) — cùng mốc tô vàng.
- [XM-12] Khối Giáo viên đặt cạnh "Chờ bạn duyệt" (hai cột) ở Tổng quan; các khối khác giữ (vẽ mờ, không đổi).
- [XM-13] GV 0 quá hạn vẫn liệt kê mờ ở cuối (tối đa vài dòng + "n GV không có việc quá hạn") để Head thấy đủ người; bỏ được nếu chủ SP muốn chỉ GV có quá hạn.

Critique (tự chấm): Công việc Head **35 / 40** · khối Giáo viên **35 / 40** — không P0 / P1.
