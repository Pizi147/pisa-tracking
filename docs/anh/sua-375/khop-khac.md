# SUA-375 — ba lỗi màn 375 (PTA Plan 28/10), sửa nhỏ, không đổi bố cục

| # | Chỗ | TRƯỚC | SAU | Nơi sửa |
|---|---|---|---|---|
| ① | HV & Lớp 375 · cột Việc (hàng lớp + hàng em) | nút việc xếp chồng sát nhau (0 px); tên việc dài bị cắt "Nhập điểm Listeni…" (`do-khung hvl`: 66 lỗi "chữ cắt" có sẵn) | nút cách nhau 6 px; tên việc xuống dòng trong nút, cao tối thiểu 36 px; ≥ 640 px giữ một dòng "…" như cũ | `DanhSachHvLop.tsx` (`OViec`) |
| ② | Chữ vắng dưới ô điểm "vắng W2 SEP" (lưới chấm thẻ 375, hồ sơ lớp) | ô hẹp xuống dòng giữa mã tuần: "vắng W2 / SEP" | mã tuần dính một khối (NBSP trong `chuDoiVang` — sửa một chỗ cho mọi ô điểm): "vắng / W2 SEP"; hồ sơ lớp mượn đệm ô → một dòng (1440 và 375) | `shared/domain/lichMt.ts`, `BangHoSoLop.tsx`; 3 tệp kiểm so chuỗi |
| ③ | Lịch Test 375 · thẻ số (GV có phân công) | "15 bài của GV khác" xuống 2 dòng (ô còn 93 px, chữ cần 100 px) | điện thoại: "15 GV khác" một dòng (nhãn ô đã nói "bài"); ≥ 640 px giữ chữ đủ | `DaiSo.tsx`, i18n EN `{n} GV khác` |

Ảnh TRƯỚC | SAU: `1-hv-lop-375.png` · `2-luoi-cham-vang-375.png` · `2b-ho-so-lop-vang-1440.png` · `3-lich-test-so-375.png`.

`do-khung`: hvl (66 → 0 lỗi), lop-ft, gvbm-test, gv-hop-diem, sos, panel-mot-em, hop-ky-nang, cham-test, gv-diem-lop — xanh.
`scripts/mien-do.json`: không có dòng nào cho ba lỗi này → không gỡ dòng nào.
Còn đỏ, có sẵn, ngoài phạm vi: hv-hoc-thuat 375 (việc đầu hồ sơ cắt chữ), hv-thuong 375 ("Progress Test › W3 AUG"), nhap-diem (bảng g1–g3).

## Thao tác TRƯỚC → SAU
Không đổi: nút việc vẫn mở đúng việc, "Xem thêm", chip hạn, ô số Lịch Test vẫn bấm mở danh sách. Chỉ đổi khoảng cách, xuống dòng và chữ gọn ở điện thoại.
