# Critique LẠI sau 6 PR sửa hình ảnh — 29/10 (nhánh ra-ui-tong-tam, web :5310, chỉ đọc)

Cách chấm: giống báo cáo `../a/ket-qua.md` + `../b/ket-qua.md` (Nielsen 10 × 0–4, cùng độ khắt khe), mockup dùng lại ảnh cũ.
Ảnh: thư mục này — `<màn>-w.png` (web mới, toàn trang), 1440 lát `-w1…`, 375 lát 3 cột `-p1…` (mockup | web TRƯỚC | web SAU).
Công cụ: `chup.mjs` (chụp + đo chữ cắt / tràn → `do.txt`), `diff.mjs` (so điểm ảnh web cũ ↔ mới → `diff.txt`), `do.mjs`, `panel.mjs` (mở panel việc / Tạo Case).
Điểm ảnh y hệt trước (diff 0 px): Tổng quan QL/GV/TVV (1440 + 375), Kế hoạch Test, Hồ sơ lượt, Quản trị Tài khoản 1440, Bảng quy đổi, Kết quả Test 375 → giữ điểm cũ.

## Bảng điểm

| Màn | Vai | TRƯỚC | SAU | Lỗi đã hết | Lỗi còn / mới |
|---|---|---|---|---|---|
| Tổng quan | QL | 28 | 28 | — | còn: thẻ 375 nhãn–số lệch (P2, `Bang.tsx`), nút đoạn rời [XM], SOS chip rời (P3) |
| Tổng quan | GV | 27 | 27 | — | còn: cột Lớp cắt chữ 9 chỗ (P2, `LopToiDay.tsx:148,197`), SOS 3 dòng (P2) |
| Tổng quan | TVV | 29 | 29 | — | **mục 7 KHÔNG ăn**: TVV dùng lưới riêng `TongQuanV5.tsx:445` (`lg:grid-cols-3`), sửa chỉ ở `DaiChiSo:63` → 375 thẻ 3 vẫn mồ côi (P2) |
| Công việc | GV | 30 | 32 | 3 hạn chữ thường · 12 cột phải cao 480 | còn: 375 nút đoạn rời [XM] |
| Công việc | QL | 26 | 27 | 3 · 12 | còn: 10 [BỐ CỤC] · 11 hai "✓ Tất cả" · thẻ duyệt "Quá hạn · 1 ngày / Còn 2 ngày" viết hoa, chữ trơn — nay lệch rõ với viên "quá hạn 68 ngày" cùng trang (P3) |
| Công việc | TVV | 29 | 30 | 3 · 12 | còn: hạn xa chữ trơn 2 dòng "hạn 18/09 / còn 4 ngày" (`DanhSachViec.tsx:398-404`, P2) · "Gia hạn" nút viền (P3) · "hạn 21/09 · hạn bước tiếp" lặp chữ "hạn" (P3) |
| HV & Lớp | GVCN | 27 | 27 | 32 tên GVCN chữ thường | còn: 15 mọi lớp gập · 16 nút việc lặp tên + cắt (3 chỗ) · ⋯ hàng lớp 375 rơi dòng riêng (P2) · mũi tên mở nhóm "›" (luật: › = đổi trang) trong khi Ý thức đã ▸ (P3) |
| Hồ sơ HV | GVCN | 31 | 32 | 19 tiêu đề Case 15 · 20 dải việc 2 dòng | còn: 21, 23, 24 · mới (P3): thẻ việc 1 bị kéo cao theo thẻ 2 → tên việc trên, hạn dưới cách ~30 px · cả 6 tầng tiêu đề trong cột Case đều 15/700 (phẳng — gắn [XM] 22) |
| Ý thức HV | GVCN | 31 | 32 | 25 ▸ đặc · 27 nhóm 15 | còn: 26 "Xác nhận cấp bậc vi phạm" chữ mờ không ra link (P3) |
| Hồ sơ lớp | GVCN | 25 | 25 | 32 tên GVCN | còn: 28, 29 (P1 375) · 30, 31 [BỐ CỤC] · 33 · 375 thẻ việc cắt "…Hà Gia Bình", "…Lý Minh …" |
| Lịch Test tuần | QL | 28 | 28 | tên HV 375 chữ thường | còn: ô trống viền đứt (chờ M2) · "vắng W2 SEP" lặp · chip kỹ năng 2 kiểu |
| Kế hoạch Test | QL | 31 | 31 | — | còn: như cũ (ảnh y hệt) |
| Chấm Test | GVCN | 28 | 29 | tab "5 việc" khớp danh sách · tên HV chữ thường | còn: khu phải 3 tầng [BỐ CỤC nhẹ] · chân không trạng thái lưu (P2) |
| Chấm Test | GVBM | 27 | 29 | chip "chấm chéo · không tính nợ" lặp · tab | còn: 375 "MB FOU 12 · / Pronunciation", "làm bài W3 / AUG" gãy (P2) · ô "/ tổng" như ô nhập (P3) |
| Hồ sơ lượt | QL | 29 | 29 | — | còn: như cũ (ảnh y hệt) |
| PT › Báo cáo HV | QL | 28 | 30 | kỳ lặp 4 ô · công tắc 38 thẳng hàng · ô 0 Tiến bộ không bấm | **mới (P3)**: ô "Thi trong kỳ" thành "HV có ngày thi trong kỳ / trong kỳ" — chữ "trong kỳ" 3 lần trong một ô (`BaoCao.tsx:57,72`); "trong kỳ" vẫn là dòng 3 riêng, mockup nối sau tên · còn: 375 ô thứ 5 mồ côi (lưới riêng `BaoCao.tsx:67`, cùng gốc mục 7) |
| PT › Phân tích GV | QL | 30 | 30 | công tắc 38 | còn: đơn vị "lượt Test / bài Test" lặp · 2 kiểu gạch chân · nền hồng HỌC THUẬT |
| PT › Test + SOS | QL | 26 | 27 | "Xếp theo" 38 thẳng hàng | còn: dải đầu thẻ trống ~70 px (`TongHopTestSos.tsx:226`, P2) · gần mọi số gạch chân |
| PT › Kết quả Test | QL | 27 | 27 | tên HV chữ thường | còn: "MT · tuần", "Việc tiếp" xanh + cắt "…" (2 chỗ) · phân trang lặp · tên tab [XM] |
| PT › Hiệu quả PA | QL | 27 | 27 | công tắc 38 | còn: tiêu đề cột trên dòng gập · chân ba số 0 |
| PT › Ý thức | QL | 28 | 29 | tên HV chữ thường | còn: 3 kiểu nhãn trạng thái · "Lần xử lý gần nhất" "—" + dòng phụ lệch · 375 "…chưa xử / lý" mồ côi chữ |
| QT › Tài khoản | QT | 27 | 28 | 375 "Tài khoản (32)" một dòng | còn: kỹ năng ghi đủ tên · 3 chip "0" luôn hiện · 375 dòng cao không đều |
| QT › Bảng quy đổi | QT | 32 | 32 | — | còn: như cũ (ảnh y hệt) |

Trung bình: **nhóm A (10 màn) 28,3 → 28,9** · **nhóm B (13 màn) 28,3 → 28,9** · chung 28,3 → 28,9. Không màn nào tụt điểm.

## Hồi quy / sửa không ăn
1. **P2 — Mục 7 (ô chỉ số lẻ chiếm cả hàng) không có tác dụng ở màn được báo**: Tổng quan TVV dựng lưới riêng `web/src/modules/worklist/TongQuanV5.tsx:445`; Báo cáo HV `phanTich/BaoCao.tsx:67`, `worklist/MockTestAdmin.tsx:43` cũng riêng. Diff ảnh TVV 375 = 0 px. Sửa: ba chỗ dùng `DaiChiSo` (hoặc chép lớp `max-lg:[&>*:last-child:nth-child(odd)]:col-span-2`). Ảnh SAU trong `docs/anh/ra-ui-6/tong-quan-tvv-375-sang.png` không khớp web hiện tại — cần chụp lại.
2. **P3 — "trong kỳ" lặp** trong ô "Thi trong kỳ" (tên + dòng mẫu + dòng kỳ). `BaoCao.tsx:72`: bỏ `ky` cho ô này hoặc đổi `mau` → "HV có ngày thi".
3. **P3 — Báo cáo RA-UI-5 ghi công tắc 15 px; đo thật 14 px** (`ChonChuongTrinh.tsx:9` `text-sm`). Hàng lọc Phân tích còn 3 độ cao: công tắc 38 · "Toàn bộ / Chọn khoảng" 34 · ô tuần 37.
4. **P3 — lệch kiểu mới lộ ra**: hạn viên chữ thường vs thẻ "Chờ bạn duyệt" chữ hoa trơn (CV QL); ▸ ở Ý thức vs "›" mở nhóm ở HV & Lớp, Hiệu quả PA, Test + SOS.
5. Không thấy: chữ cắt mới, tràn ngang 375 (đo `do.txt`: tràn 0 ở mọi màn), lệch hàng do `Card` `flex-wrap` ở 1440 (diff 0 px ngoài chỗ sửa). Ở 375, `flex-wrap` đẩy "Xuất Excel" (PT Ý thức) và "+ Tạo tài khoản" (QT) xuống hàng riêng — gọn hơn trước, không tính lỗi. Panel việc / Tạo Case 1440 + 375 không cắt tiêu đề.

## 5 lỗi hình ảnh nên sửa tiếp (ngoài [XM] / [BỐ CỤC])
1. P2 Tổng quan GV 1440 cột Lớp cắt chữ 9 chỗ + SOS 3 dòng — `LopToiDay.tsx:148,155,197,214`.
2. P2 Ô chỉ số lẻ mồ côi ở TVV + Báo cáo HV 375 (hồi quy 1) — `TongQuanV5.tsx:445`, `BaoCao.tsx:67`.
3. P2 Thẻ bảng 375 nhãn–số lệch lưới (TQ QL/GV) — `Bang.tsx:69-72`, cần thiết kế lại thẻ "Lớp cần chú ý".
4. P2 Hạn xa TVV chữ trơn 2 dòng → viên một dòng — `DanhSachViec.tsx:398-404` (`HanPhu`); kèm thẻ "Chờ bạn duyệt" dùng `ChipHan`.
5. P2 Chấm Test 375 tiêu đề dòng gãy ("MB FOU 12 · / Pronunciation", "W3 / AUG") — `ChamTestTab.tsx:204` dùng mã kỹ năng ngắn, `whitespace-nowrap` cho mã tuần.
