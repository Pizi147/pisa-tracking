# v23 ⑪ Tổng quan theo vai — ghi chú

Mockup: [`tong-quan.html`](tong-quan.html) (sinh 4 vai từ cùng khung) · ảnh `anh/tong-quan-T*-*.png`.
Đặc tả: `docs/superpowers/specs/2026-11-22-nhe-hon-design.md` mục 3 "Tổng quan" (#1986) — "Hôm nay có gì bất thường?" + bộ ô theo vai. Áp Head / QL · Admin · CX · Quản trị; GV / TVV vào thẳng Công việc, BPXL vào Kế hoạch Test (giữ).

## Bố cục chung (mọi vai)

1. Đầu: "Tổng quan · chi nhánh · W4 NOV"; ô chọn chi nhánh chỉ khi nhiều chi nhánh (CX, Quản trị — giữ "Toàn hệ thống / Theo chi nhánh").
2. **Cần xử lý** 3–4 ô: tên · số to (đỏ khi là quá hạn / SOS) · một dòng phụ (hạn dd/mm/yyyy tô màu); ô 0 = viền đứt xám "✓ không có", không bấm; bấm ô → Công việc / HV & Lớp đã lọc.
3. **Khối chính theo vai.**
4. **Tình hình** một hàng 4 số (Đạt MT · SOS 1 · 2 · 3 · Thi tháng này · Đạt Target thi thật) + kỳ + nút nhỏ Fast Track / Lớp thường; bấm số → panel giải thích số (V11, giữ). Head / QT: **Lớp cần chú ý** mỗi lớp một dòng, chỉ lớp có vấn đề.

## Truy vết

| Vai | Cần xử lý | Khối chính | Khung |
|---|---|---|---|
| Head / QL | GV quá hạn · Chờ duyệt · Em SOS cần chú ý | Giáo viên (= ⑩) + Chờ duyệt gọn · Lớp cần chú ý | T1, T1b |
| Admin | Điểm chưa đủ · Báo cáo PH chưa đủ · Lịch thi chưa chốt · Hồ sơ thiếu (ô 0) | Lớp còn thiếu 5 lớp + "Xem hết ›" → Công việc Admin | T2, T2b |
| CX | Em SOS 2–3 · Meeting chờ kết quả · Chưa chốt bước tiếp (ô 0) | Em cần chú ý: tên · lớp · SOS · việc còn treo (ai giữ) · hạn | T3, T3b |
| Quản trị | như Head + Việc hệ thống (tài khoản chờ / lỗi nhập, chỉ khi có) | Giáo viên (kèm chi nhánh) + Chờ duyệt · Lớp cần chú ý | T4, T4b |

Thành phần web: `web/src/modules/worklist/TongQuanV5.tsx` (khung trang, chọn kỳ / chi nhánh, `ChonChuongTrinh`), `PanelGvTre.tsx` (khối Giáo viên), `Highlights.tsx` / `SignalList.tsx` (số → panel giải thích).

## Thao tác TRƯỚC → SAU (so `TongQuanV5.tsx`)

| Trước | Sau |
|---|---|
| Dải số theo nhóm Học thuật / Hành chính / Việc (% đúng hạn, Chưa làm, Bài quá hạn…) — bấm số mở panel giải thích | **Cần xử lý** (bấm → Công việc lọc) + **Tình hình** 4 số (bấm → panel giải thích, giữ V11). Chỉ số "% đúng hạn" / "Chưa làm" / "Báo PH đúng hạn" → chuyển về **Phân tích** (báo cáo thuần, G8) — [XM-15] |
| Chọn kỳ | giữ, ở đầu khối Tình hình (chip kỳ) |
| Chọn chi nhánh / Toàn hệ thống / Theo chi nhánh | giữ cho người nhiều chi nhánh |
| Fast Track / Lớp thường (`ChonChuongTrinh`) | giữ, nút nhỏ cạnh "Tình hình" |
| Bảng "GV cần chú ý" + panel bài trễ (`PanelGvTre`) | khối Giáo viên (⑩): số quá hạn bấm → Công việc "Của GV" lọc; panel bài trễ vẫn mở được từ Phân tích GV |
| Chờ duyệt (+ n yêu cầu) | giữ, khối gọn 2–3 dòng + "Công việc ›" |
| Lớp cần chú ý (thẻ to) | mỗi lớp một dòng, chỉ lớp có vấn đề |
| "Học viên & Lớp ›" · "Phân tích GV" | giữ ("Học viên & Lớp ›" ở Lớp cần chú ý; Phân tích GV qua menu Phân tích) |
| "Chỉ số của tôi" (Head kiêm GV) | chuyển vào Công việc "Của tôi" (số việc) — [XM-16] |

## Nguồn số + Turso

- Mọi số cùng hàm với Công việc / Phân tích: ô "Cần xử lý" về việc của chính người xem = `demDongViec` trên `/my-work` đã nạp; ô "GV quá hạn" (Head / QT) = dữ liệu GV đang có trong `tong-quan/v5`; Tình hình = các chỉ số đang có trong `tong-quan/v5`.
- **Đường `tong-quan/v5` hiện ~35 câu, tới ~3 170 dòng (CX).** Mục tiêu: **không thêm câu**. Bỏ ô "% đúng hạn / Chưa làm / Báo PH đúng hạn" khỏi Tổng quan giảm câu; số "Cần xử lý" lấy từ cùng tập việc `/my-work` mà app đã gọi cho badge Công việc (`App.tsx`) — dùng lại dữ liệu đã nạp, không gọi lần hai.
- Khối Giáo viên (Head / QT): **+0 câu** — dùng lại dữ liệu GV đang có trong `tong-quan/v5`, tách loại trong câu đang có; không tách được thì bỏ cột "Loại" (PTA chốt 22/11, xem [`tong-quan-head-gv-ghi-chu.md`](tong-quan-head-gv-ghi-chu.md)).

## [XM]

- [XM-15] Bỏ các ô "% đúng hạn / Chưa làm / Báo PH đúng hạn" khỏi Tổng quan (đã có ở Phân tích) để trang trả lời "hôm nay có gì bất thường?". Chủ SP xác nhận.
- [XM-16] "Chỉ số của tôi" của Head kiêm GV không còn ở Tổng quan — thấy ở Công việc "Của tôi".
- [XM-17] Admin không có "Lớp cần chú ý" (khối Lớp còn thiếu thay); CX không có khối Giáo viên.

Critique (tự chấm): **35 / 40**, không P0 / P1. P2: Tình hình ở 375 xuống hai hàng — vẫn một khối.
