# PR sua-ui (25/11) — khớp / khác

Nguồn: `ra-toan-web-2511.md` mục "PR 4 — sua-ui" (18 điểm). Ảnh cặp CẢ MÀN trước (origin/main) | sau, ở `cap/<mã>-<bề rộng>.png` (1440 tối, 1280 tối, 375 sáng); ảnh đơn ở `truoc/`, `sau/`.
Chỉ sửa hiển thị; không đụng logic của PR 1–3. Mockup không đổi bố cục (đổi chữ / dáng / CSS theo mẫu sẵn có).

## 1. Truy vết điểm → thành phần → ảnh

| # | Điểm | Thành phần sửa | Ảnh | Trạng thái |
|---|---|---|---|---|
| 1 | Hạn chỉ tô màu chữ (NH4) | `yThuc/khoiYThuc.tsx` `CanLamEm` (bỏ badge "Quá hạn n ngày" / "Phải xử lý" / "còn n ngày", dùng `ChipHan`); `yThuc/ClassYThucCard.tsx` (viên "Yêu cầu xử lý · hạn"); `students/DanhSachHvLop.tsx` (hộp Ý thức) + `.vh-qua` bỏ nền; `classes/CanhBaoYThuc.tsx` ("Ý thức · ngày") | `d01-yt-lop` | XONG |
| 2 | Quản trị › Tài khoản 375 | `platform/SuaTaiDong.tsx` (không xuống dòng lẻ ✎, bỏ margin âm ở 375), `AccountsAdmin.tsx` (⋯ cao 44 bằng "Sửa") | `d02-qt-tai-khoan` | XONG |
| 3 | Vùng bấm ≥ 44 ở 375 | `ui/ui.tsx` `BoLocDoan`, `phanTich/dungChung.tsx` `DOAN`, `HoTroHocVienTab.tsx` (công tắc Việc / Lớp của tôi), `.doan`, `ui/Filters.tsx`, `BangHoSoLop.tsx` (ô L R W S), `.cvA-ten` + `.ten-ho-so` (vùng chạm `::after`), `.o-so` 44 × 44 | `d03-*` | XONG. Ô tick 16 × 16: đã có vùng chạm 44 × 44 bằng `label::after` (phép đo chỉ đo ô input nên báo nhầm) — không đổi |
| 4 | Ô Final lặp kết quả 375 | `cham/MotKyNang.tsx` (bỏ dòng phụ dưới tên khi ô điểm đã có "Chưa đạt · %"). 1440 **giữ** "→ Head cân nhắc" (plan.md / DESIGN.md không có tên riêng cho Final dưới ngưỡng — PTA: giữ chữ hiện có) | (cần dữ liệu Final lớp thường — kiểm bằng mã) | XONG |
| 5 | Panel việc 720 + 375 toàn màn | `ui/KhungPanel.tsx`: 1440 `lg:w-[720px]`; 375 `max-sm:fixed inset-0` (phủ toàn màn, top 0, bỏ dải "‹ Công việc" nằm dưới) | `d05-panel-viec` | XONG |
| 6 | Dấu ngăn | PTA chốt: GIỮ mẫu chủ SP 25/11 — một dấu " - " sau tuần, phần sau "·" ("W1 SEP - L R W2 · GV"). Đã trả lại, không đổi so với main | `d03-cong-viec-*` | KHÔNG ĐỔI |
| 7 | Chữ xuống dòng lạ | `test/lichTest/HangLop.tsx` ("Monbay" cạnh mã lớp); `platform/CatalogAdmin.tsx` (Mốc Test một dòng) | `d14-lich-test-gvbm`, `d10-qt-chuong-trinh` | XONG hai ý; "W3 AUG - MT2 · Listening, / Reading" và panel Nhập điểm lớp "MT1 › / vắng…" không tái hiện được trên dữ liệu demo |
| 8 | Cột không cân / cột trống | CX `worklist/TongQuanVai.tsx` (bỏ Còn treo + Hạn khi trống); `/mock-test`: cột Nhận xét + Case ẩn khi mọi dòng "–" (`fasttrack/MockDetailPage.tsx` + `index.css` `.mt-luoi`, `:has`); hồ sơ HV bảng Mock Test: cột Kết quả căn phải (`StudentDetailPage.tsx`) | `d08-tong-quan-cx`, `d11-mock-test`, `d08-ho-so-hv-mock-test` | XONG. "Dự kiến 01/2027 sát ⋯" không tái hiện được |
| 9 | Số trơn ở cột Việc "Lớp của tôi" | `congViec/LopCuaToi.tsx` (số đỏ trơn, bỏ badge) | `d03-cong-viec-gvcn` (1440) | XONG |
| 10 | Bảng Quản trị | `CatalogAdmin.tsx` (colgroup chia hết bề ngang, Còn dùng sát mép phải), `ChiNhanhAdmin.tsx` + `ui/OSuaTaiCho.tsx` (ô sửa lấp đầy cột) | `d10-qt-chuong-trinh`, `d10-qt-chi-nhanh` | XONG hai bảng Quản trị. Phân tích › Ý thức / SOS: đã soi ảnh 1440 — cột thẳng, số căn giữa, bảng đủ bề ngang; không tìm thấy chỗ "lệch 1 cột" để sửa (ghi lại) |
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

## 3. Ghi lại

- #13 không tái hiện được (`HangTab` có mờ mép, kiểm computed `mask-image`).
- #15 giữ chân Công việc "Báo cáo PH · mở…" (chủ SP 24/11).
- Phân tích: không có chỗ lệch cột tái hiện được ở 1440.
