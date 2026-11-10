# PR-2 PHOI-HOP-V2 · tab Phối hợp SOS hồ sơ lớp + hồ sơ HV — khớp / khác mockup #1368 (K5–K8)

Ảnh cặp mockup | web: `anh-cap/hs-lop-1440-gvcn.png` (K5) · `anh-cap/hs-lop-1440-gvbm.png` (K6a) · `anh-cap/hs-hv-1440-gvcn.png` (K7a) · web 375: `anh-cap/hs-lop-375-gvcn-web.png` (K6b), `anh-cap/hs-hv-375-tvv-web.png` (K7b).
Seed 14/09/2026 · MB FT 101 · GVCN Trần Ngọc Hà · GVBM Phạm Thu Trang · TVV Phan Mai · em Kiều Thảo Nhi. Một bảng chung (`BangPhoiHopHoSo`) cho hai hồ sơ, cùng ô ①②③ với panel Công việc (PR-1).

## Truy vết

| Khung | Thành phần | |
|---|---|---|
| K5 khối em: tên · SOS · một dòng điểm · x/y xong · + Thêm việc; ① Việc (tên + hạn) · ② Đã làm (nút ở chỗ ngày) · ③ Kết quả · ⋯ | `BangPhoiHopHoSo` + `DongPhoiHop cotViec` | KHỚP |
| K5 ③ kết quả hiện ngay, 2 dòng + Xem đủ; Meeting CX: Chờ TVV · hạn / TVV đã báo + Nội dung | `OKetQua` | KHỚP |
| K5 "Chưa ghi kết quả" cho việc xác nhận trước PR | `OKetQua` | KHỚP |
| K6a GVBM chỉ đọc: "Chờ GVCN", không ⋯, không + Thêm việc | `luot.canAct` (máy chủ) | KHỚP |
| K6b / K7b 375 thẻ khối, ①②③ dọc | lưới 375 | KHỚP |
| K7 hồ sơ HV cột Lượt, Học thuật ›, lượt đã xong gập "Xem việc ▸" | `KhoiLuot` | KHỚP |
| K7b TVV: "Chờ bạn báo PH" + Ghi kết quả tại chỗ | `OKetQua` (`coTheGhi`) | KHỚP |
| K8b rỗng "Không còn việc phối hợp nào" + "Hiện cả lượt đã xong" | `BangPhoiHopHoSo` + nút sẵn có của tab | KHỚP (nút "Hiện cả lượt đã xong" giữ ở thanh trên như cũ) |

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Xác nhận | form dưới dòng (Ngày · Người · Ghi chú tuỳ chọn · Tệp) | tại ô ②: Ngày · Nội dung (bắt buộc; Meeting CX gửi TVV tuỳ chọn) · Tệp · Người thực hiện; Hoàn tác 10 s |
| Sửa việc đã xong | nút Sửa | "Sửa" ở ② |
| Đưa lại Cần xử lý | nút | ⋯ |
| Bỏ việc… / Hoàn tác | ⋯ | ⋯ |
| Khôi phục việc đã bỏ | nút | ⋯ › Khôi phục (dòng đã bỏ hiện mờ, gạch tên, "Đã bỏ · lý do") |
| Sửa hạn Meeting CX (N34) | ô hạn tại dòng | ⋯ › Sửa hạn… (mở ô hạn `DongHan` tại dòng) |
| + Thêm việc | đầu thẻ em | ô khối em / lượt |
| Nội dung Báo PH qua TVV (lớp thường) | details dưới tên | giữ dưới tên việc ở ① |
| Học thuật › (HV) | đầu thẻ | ô lượt |
| Hiện cả lượt đã xong · mọi lượt | thanh trên | giữ |
| Ghi kết quả Meeting CX (TVV) | không có | ③ tại dòng |
| Đọc kết quả (GV, GVBM, TVV) | không hiện | ③ |

Bỏ chữ thừa: "Học thuật theo dõi ở bảng kỹ năng", nhãn "Đang làm" / "Xong", "Còn: …".

## Chủ SP rà ảnh 12/11 (không mockup lại)
| Chỗ | Mockup #1368 | Web | |
|---|---|---|---|
| Dòng phụ dưới tên em / lượt | một chuỗi "MT4 · ✗ 5.0 / 6.5 · trượt L, R, W, S" | CHIA LOẠI (cùng thành phần `DiemMotDong` với panel Công việc): thẻ lượt · "Overall" mờ + số ✗ / ✓ ba màu + "/ kỳ vọng" · "Trượt" mờ + chip L R W S; hồ sơ HV bỏ thẻ lượt (ô đã ghi MT2); xuống dòng giữa các khối, không cắt | KHÁC — chủ SP 12/11 |
Ảnh: `anh-cap/hs-lop-1440-diem-web.png`, `anh-cap/hs-hv-1440-diem-web.png`, `anh-cap/hs-lop-375-gvcn-web.png`, `anh-cap/hs-hv-375-tvv-web.png`.
