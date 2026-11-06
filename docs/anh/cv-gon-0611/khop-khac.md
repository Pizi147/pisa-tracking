# CV-GON-0611 — dòng việc Công việc gọn · Bổ sung hồ sơ tại chỗ · Phân tích 2 tuần gần nhất

Chủ SP 06/11 tối (ý 2 và ý 4). Không có mockup mới: chỉnh theo mẫu dòng việc sẵn có (plan.md 1.3b). Dữ liệu ảnh: bộ demo, ngày demo 24/09/2026; vai QL Nguyễn Khánh Vy (A, C), TVV Phan Mai (B).

## Ảnh cặp (TRƯỚC = main | SAU = PR)

| Màn | 1440 tối | 375 sáng |
|---|---|---|
| A1 · Việc quản lý (Xét lại lộ trình, Bổ sung hồ sơ) | `cap-a1-viec-quan-ly-1440-toi.png` | `cap-a1-viec-quan-ly-375-sang.png` |
| A2 · Case học thuật (Kết quả PA, Mô tả Case cả lớp) | `cap-a2-case-hoc-thuat-1440-toi.png` | `cap-a2-case-hoc-thuat-375-sang.png` |
| B1 · Bổ sung hồ sơ thiếu (bấm dòng) | `cap-b1-bo-sung-ho-so-1440-toi.png` | `cap-b1-bo-sung-ho-so-375-sang.png` |
| C1 · Phân tích (tab + khoảng mặc định) | `cap-c1-phan-tich-1440-toi.png` | `cap-c1-phan-tich-375-sang.png` |

## Thao tác TRƯỚC → SAU

| # | Thao tác | TRƯỚC | SAU | Ghi chú |
|---|---|---|---|---|
| 1 | Tên dòng việc cả lớp | "Cả lớp MB FT 101 · Mô tả Case" | "MB FT 101 · Mô tả Case" (mã lớp đậm) | Chỉ đổi chữ; bấm / mở như cũ |
| 2 | Thẻ phụ dòng Xét lại lộ trình | tên em ("Hứa …", "Lý Minh Khang 42 %"…) + "n em" + "n HV" | chỉ "n em" | Xét lại lộ trình mở trang lớp như cũ → tên em xem ở panel / trang lớp, không mất thao tác. Máy chủ không đổi (`contextLabel` vẫn gửi) |
| 3 | Thẻ phụ dòng gộp cả lớp (Mô tả Case, Kết quả PA…) | "n em quá hạn" · tuần · "n em" · "n việc" | tuần · "n em" (thẻ "n em quá hạn" chỉ khi quá hạn MỘT PHẦN) | Viên hạn đỏ ở cột hạn đã nói quá hạn; khay "n em ▾" mở danh sách như cũ |
| 4 | Thẻ phụ Chốt lộ trình | "n em chưa chọn" + "n HV" | "n em chưa chọn" | Số em ghi một lần |
| 5 | "›" sau tên việc (mọi nhóm) | luôn hiện nếu mở trang, có khi rơi xuống dòng riêng | ẩn khi dòng đã có nút bên phải (≥ 640 px); ở 375 (nút ẩn, chạm cả dòng) còn "›" dính chữ cuối tên | Dùng chung hàm cho dòng em và dòng cả lớp |
| 6 | Bấm "Bổ sung" ở việc Bổ sung hồ sơ thiếu (Công việc, trang HV & Lớp, hồ sơ lớp) | chuyển sang `/hoc-vien?view=thieu_tt…`, danh sách lớp gập / reset bộ lọc | mở TẠI CHỖ panel Sửa thông tin của em đầu, con trỏ ở ô còn thiếu đầu tiên (Ngày sinh → Email → Tuần bắt đầu → Target) | Dùng lại `SuaThongTinMotEm` (không viết form mới); không thêm request ngoài `/students/:id` của em đang sửa |
| 7 | Nhiều em thiếu hồ sơ | không có | tiêu đề "em 1/n"; "Lưu · em tiếp ›" (lưu rồi sang em kế), "Bỏ qua ›" (sang em kế không lưu); em cuối: "Lưu" rồi đóng | Danh sách em chốt lúc mở panel. Lưu một em → đọc lại `/my-work` (như mọi panel việc) |
| 8 | Xem tập "Thiếu thông tin" trên HV & Lớp | link của việc | chip "Thiếu thông tin" ở HV & Lớp giữ nguyên (không đổi) | Mất đường nào? Không — chỉ nút việc không còn đẩy sang trang |
| 9 | Phân tích mở lần đầu (URL không ghi `kieu`/`tu`/`den`) | 2 tuần HOÀN CHỈNH trước tuần này (24/09: W2 → W3 SEP) | 2 tuần gần nhất: Thứ Hai tuần trước → hết tuần này (24/09: W3 → W4 SEP) | Link có `?tu=&den=` / `kieu` theo link; chọn tay vẫn được; Tổng quan · HV & Lớp · Tutor giữ mặc định cũ (`khoangMacDinh`) |
| 10 | Tab "Thi thật" của Phân tích | tên "Thi thật", đứng thứ 4 | tên "KQ Thi thật", đứng thứ 3 (sau Phân tích GV) | Khoá URL `goc=ket-qua-thi` giữ → link cũ vẫn mở; có EN "Real exam results" |

## Truy vết chữ → nơi sửa

| Việc | Tệp |
|---|---|
| 1–5 | `web/src/modules/congViec/DanhSachViec.tsx` (`DongLop`, `DongViec`, `MuiTenMoTrang`) |
| 6–7 | `web/src/modules/congViec/PanelViec.tsx` (`lamTaiCho` + `PanelBoSungHoSo`), `web/src/modules/students/StudentManagePanel.tsx` (`tiep`) |
| 9 | `shared/domain/khoangThoiGian.ts` (`khoangPhanTichMacDinh`, tham số `md`), `web/src/modules/phanTich/PhanTich.tsx`, `BoChonThoiGian.tsx` |
| 10 | `shared/domain/phanTich.ts`, `shared/i18n/en/b.ts` |

## Đọc Turso / request

Không thêm đường API, không thêm câu SQL. Panel Bổ sung mở một em = một `GET /students/:id` (như mọi "Sửa thông tin"). Phân tích: khoảng mặc định mới dài ngang cũ (2 tuần).

## Phép kiểm cũ đổi

- `prOv15e` OV15e-… thứ tự / tên tab Phân tích (KQ Thi thật thứ 3) + kiểm mới khoảng mặc định Phân tích.
- JSON Công việc (TD4-a) KHÔNG đổi: chữ máy chủ giữ nguyên, mọi thay đổi ở web.
- `donHinh` thêm hai kiểm CV-0611.

## Việc để sau / [XM]

- "2 tuần gần nhất" của Phân tích gồm tuần hiện tại chưa hết (tỷ lệ tuần này có thể chưa đủ dữ liệu). Chủ SP muốn thế (06/11); nếu muốn cắt tới "hôm nay" thật (không tới Chủ nhật) cần đổi kiểu khoảng — chưa làm.
