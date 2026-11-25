# PR sua-ui (25/11) — khớp / khác

Nguồn: `ra-toan-web-2511.md` mục "PR 4 — sua-ui" (18 điểm). Ảnh cặp CẢ MÀN trước (origin/main) | sau, ở `cap/<mã>-<bề rộng>.png` (1440 tối, 1280 tối, 375 sáng); ảnh đơn ở `truoc/`, `sau/`.
Chỉ sửa hiển thị; không đụng logic của PR 1–3. Mockup không đổi bố cục (đổi chữ / dáng / CSS theo mẫu sẵn có).

## 1. Truy vết điểm → thành phần → ảnh

| # | Điểm | Thành phần sửa | Ảnh | Trạng thái |
|---|---|---|---|---|
| 1 | Hạn chỉ tô màu chữ (NH4) | `yThuc/khoiYThuc.tsx` `CanLamEm` (bỏ badge "Quá hạn n ngày" / "Phải xử lý" / "còn n ngày", dùng `ChipHan`); `yThuc/ClassYThucCard.tsx` (viên "Yêu cầu xử lý · hạn"); `students/DanhSachHvLop.tsx` (hộp Ý thức) + `.vh-qua` bỏ nền; `classes/CanhBaoYThuc.tsx` ("Ý thức · ngày") | `d01-yt-lop` | XONG |
| 2 | Quản trị › Tài khoản 375 | `platform/SuaTaiDong.tsx` (không xuống dòng lẻ ✎, bỏ margin âm ở 375), `AccountsAdmin.tsx` (⋯ cao 44 bằng "Sửa") | `d02-qt-tai-khoan` | XONG |
| 3 | Vùng bấm ≥ 44 ở 375 | `ui/ui.tsx` `BoLocDoan`, `phanTich/dungChung.tsx` `DOAN`, `HoTroHocVienTab.tsx` (công tắc Việc / Lớp của tôi), `.doan`, `ui/Filters.tsx`, `BangHoSoLop.tsx` (ô L R W S), `.cvA-ten` + `.ten-ho-so` (vùng chạm `::after`), `.o-so` 44 × 44 | `d03-*` | XONG (còn ô tick chọn 16 × 16 ở Yêu cầu của tôi — ghi dưới) |
| 4 | Ô Final lặp kết quả 375 | `cham/MotKyNang.tsx` (bỏ dòng phụ dưới tên khi ô điểm đã có "Chưa đạt · %") | (cần dữ liệu Final của lớp thường — kiểm bằng mã, không có ảnh) | XONG nửa: phần 375. Phần "1440 ghi `→ Head cân nhắc`" **chưa đổi**: [XM] xem mục 3 |
| 5 | Panel việc 720 | `ui/KhungPanel.tsx` `lg:w-[720px]` (trước 740 ở 1440) | `d05-panel-viec` | XONG 1440. Phần 375 "panel không phủ màn, bắt đầu dưới ‹ Công việc" **chưa làm**: [XM] mục 3 |
| 6 | Dấu ngăn "-" / "·" | `congViec/DanhSachViec.tsx` (`W1 SEP · L R`, `dauGv`) | `d03-cong-viec-*` | XONG |
| 7 | Chữ xuống dòng lạ | `test/lichTest/HangLop.tsx` ("Monbay" cạnh mã lớp, không dòng 3); `platform/CatalogAdmin.tsx` (Mốc Test không xuống dòng) | `d14-lich-test-gvbm`, `d10-qt-chuong-trinh` | XONG hai ý; "W3 AUG - MT2 · Listening, / Reading" và panel Nhập điểm lớp "MT1 › / vắng…" **chưa tái hiện được** (mục 3) |
| 8 | Cột không cân / cột trống | `worklist/TongQuanVai.tsx` (CX: bỏ cột Còn treo + Hạn khi trống, SOS sát phải) | `d08-tong-quan-cx` | XONG ý CX. "Hồ sơ HV bảng Mock Test", "`/mock-test/7` cột Nhận xét + Case", "Dự kiến 01/2027 sát ⋯" **chưa làm**: mục 3 |
| 9 | Số trơn ở cột Việc "Lớp của tôi" | `congViec/LopCuaToi.tsx` (số đỏ trơn, bỏ badge) | `d03-cong-viec-gvcn` (1440) | XONG |
| 10 | Bảng Quản trị | `CatalogAdmin.tsx` (colgroup chia hết bề ngang, Còn dùng sát mép phải), `ChiNhanhAdmin.tsx` + `ui/OSuaTaiCho.tsx` (ô sửa lấp đầy cột) | `d10-qt-chuong-trinh`, `d10-qt-chi-nhanh` | XONG hai bảng Quản trị. Phân tích › Ý thức / SOS / Thi thật: **chưa làm** (mục 3) |
| 11 | Trang lượt Test lặp thao tác | `fasttrack/MockDetailPage.tsx` bỏ dải "Còn lại" (nút nằm sẵn ở từng dòng kỹ năng) | `d11-mock-test` | XONG. Câu "GVCN xác minh em không tới buổi Speaking" là ghi chú trong dữ liệu seed, không phải chữ tĩnh của giao diện |
| 12 | Chữ cắt "…" ô chọn lớp | `index.css` `.oc .da` xuống dòng | (ô chọn lớp ở bộ lọc) | XONG, chưa có ảnh riêng |
| 13 | Tab cuộn ngang 375 | `ui/HangTab.tsx` đã có mờ mép (kiểm computed style: `mask-image` có) | — | KHÔNG ĐỔI: không tái hiện được cắt giữa chữ không mờ |
| 14 | Lặp "Tất cả" Lịch Test GV | `test/LichTestTab.tsx` nhóm thứ hai: "Lớp tôi dạy · Mọi lớp" | `d14-lich-test-gvbm` | XONG |
| 15 | Chú thích tĩnh | `shared/domain/quanLyHocVien.ts` bỏ hai dòng phụ ⋯ ("em vào Lưu trữ · …", "Head duyệt rồi quyết định"); test `prVaiB.tests.ts` sửa theo | — | XONG hai dòng ⋯. Chân Công việc "Báo cáo PH · mở … · n lớp" **giữ** (chủ SP yêu cầu 24/11, có số bấm mở): [XM] |
| 16 | Chữ 11 px TVV | `index.css` `.tvv` 12 px | `d03-hv-lop` | XONG |
| 17 | Cảnh báo key trùng `/huong-dan` | `shared/huongDan/index.ts` `THU_TAB_HD` bỏ trùng `van-hanh` | — (console sạch, kiểm bằng Playwright) | XONG |
| 18 | Chữ "Hoàn thành Case" | `cases/ThaoTacCase.tsx` + bản EN: "Head hoặc người đóng mở lại được" | — | XONG |
| 19 | Lịch Test tuần: ô đã chấm của môn thi tuần KHÁC tuần đang xem ghi tuần thi dưới ô | `cham/LuoiThuong.tsx` (dòng 12 px nhạt, dùng `s.weekStart` có sẵn trong lượt — không request mới, không đổi máy chủ). Ô chưa chấm của môn thi tuần khác đã có mã tuần trong ô từ trước ("sẽ làm sau"); ô thi đúng tuần đang xem không thêm gì | `d19-lich-test-tuan-sau` (xem W4 SEP: Nguyễn Thảo Vy L / R / G+V / P ghi "W3 SEP" = đã làm trước; các em còn lại ô "W3 SEP" / "W4 SEP" / "W1 OCT" là ô chưa chấm như cũ) | XONG cho lớp thường (lưới đúng / tổng). Lượt FT không có lưới điểm từng kỹ năng ở Lịch Test nên không có ô để ghi |

## 2. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Xem hạn việc Ý thức của em | badge "Quá hạn 1 ngày" / "Phải xử lý" + dòng "hạn … · còn 2 ngày" | chỉ ngày dd/mm/yyyy tô đỏ / vàng; hết nút nào mất: không (nút Xác nhận xử lý giữ) |
| Bấm "n em" / tên em ở dòng việc (375) | vùng bấm cao 19 | vùng chạm 44 (hình không đổi) |
| ⋯ ở thẻ tài khoản (375) | ⋯ 28 × 28, vùng chạm 44 ẩn | ⋯ hiện 44 × 44 |
| Nút "Còn lại: Nhập điểm L / R …" ở đầu trang lượt Test (1440) | có, lặp nút từng dòng | bỏ dải; thao tác tương ứng vẫn ở từng dòng kỹ năng (Nhập điểm, ⋯) — không mất thao tác |
| Dòng phụ ⋯ hồ sơ HV | 2 mục có dòng chú thích | không dòng chú thích; mục bấm giữ nguyên |
| Lọc "Lớp tôi dạy / Tất cả" Lịch Test | nhãn "Tất cả" trùng | "Lớp tôi dạy / Mọi lớp" |
| Panel việc 1440 | 740 | 720 |
| Lịch Test tuần, ô đã chấm tuần khác | không ghi tuần | dòng nhỏ ghi mã tuần thi; không mất thao tác |

## 3. [XM] cần PTA Plan quyết (không tự làm)

- **#4 (1440):** "52% → Head cân nhắc" (đề xuất cho Head) và "Chưa đạt · 52%" (kết quả) là hai khái niệm khác nhau hay một? Cần chốt tên chung rồi mới đổi chuỗi dùng chung `cuoiKhoa.ts` (có tệp Excel dùng chữ này).
- **#5 (375):** panel việc phủ toàn màn bỏ dải "‹ Công việc" = đổi bố cục màn → cần mockup / duyệt.
- **#7, #8, #10 phần còn lại** (panel Nhập điểm lớp wrap, bảng Mock Test hồ sơ HV, cột Nhận xét + Case `/mock-test/7` toàn "–" — phải ẩn cột khi trống = đổi lưới, Phân tích › Ý thức / SOS / Thi thật lệch cột): chưa tái hiện / cần đổi lưới; chưa làm.
- **#15:** chân Công việc GVBM "Báo cáo PH · mở …" do chủ SP yêu cầu 24/11 (BAO-PH-SAP-MO) — giữ, chờ PTA xác nhận có bỏ không.
- **#6:** chủ SP 25/11 từng chốt "W3 AUG - Progress · R" (một dấu "-" sau tuần); PTA rà 25/11 yêu cầu "·" — đã làm theo bản rà. Chuỗi server `mywork.ts` ("W3 AUG - MT2 · …" ở tiêu đề việc Case) giữ nguyên.
- **#3:** ô tick chọn 16 × 16 (Yêu cầu của tôi) chưa nới 44.
