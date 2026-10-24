# Truy vết — `hoc-vien-lop.html` (Học viên & Lớp)

> **Đã vào mã → PR #548 UI-HV-LOP** (TL-V5, 24/10). Mockup đã duyệt (`10` đầu tệp: phần chủ SP không góp ý = duyệt); chỗ web khác khung + lý do: `docs/anh/<pr>/khop-khac.md` của PR đó.

> V5-B2, dựa trên nền V5-A. **ĐỀ XUẤT THIẾT KẾ** — chờ chủ SP duyệt. Dữ liệu demo. Rà mã: `b2-ra-soat.md` mục 3.
> Tham số: `?vai=ha|khoa|vy&goc=tat-ca|can-lam|sos|lich-thi&lt=ngay|du-kien|chua&khung=…&theme=dark`.

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Khung (ảnh `anh/`) | Thành phần |
|---|---|---|
| Brief 12 hàng lớp gọn | `hvl-tat-ca-1440-sang`, `-toi`, `hvl-ql-1280` | ▾ · mã lớp ↗ · n HV · GVCN · 3 ô SOS · (việc cấp lớp bên phải). Bỏ chuỗi metadata dài và badge "+n" |
| SOS có viền + chú giải, không chỉ màu | `hvl-tat-ca-1440-sang` | Ô số mức 1 / 2 / 3: viền 1 px · 2 px · 3 px đôi (`o-sos`), mức 0 viền đứt xám; dòng chú giải ngay trên bảng; `role="img"` + `aria-label` "SOS mức 1: 1 HV, mức 2: 4 HV, mức 3: 0 HV" |
| C18 / T13 W tổng + "W1 · W2" dòng phụ | `hvl-tat-ca-1440-sang`, `hvl-tat-ca-375` | Ô W: số tổng tô kết quả + dòng phụ 12 px `--chu-3` (5,5 : 1) "W1 5.0 · W2 5.5"; 375 giữ dòng phụ |
| Cần làm: nhiều việc một HV, đếm "n HV · m việc" | `hvl-can-lam-1440`, `-375`, `hvl-can-lam-khoa-1440` | Tab "Cần làm 2 HV · 7 việc"; thanh đếm "2 HV · 4 việc của HV · 3 việc cấp lớp" (= badge Công việc 7 của cô Hà); hàng HV cao theo số việc, mỗi việc nút + badge hạn riêng |
| Việc cấp lớp ở hàng lớp | `hvl-can-lam-1440` | "Nhập điểm MT3 · L", "· R" (Hạn 23/09) trên hàng MB FT 101; "Nhập điểm Final · L, R" (Hạn CN 20/09) trên hàng MB FOU 12 — không gán giả cho HV |
| Lịch thi 3 trạng thái rõ | `hvl-lich-thi-1440`, `hvl-lich-thi-chua-1440` | Chip lọc "Ngày đã chốt · 1 · Dự kiến tháng · 13 · Chưa có lịch · 8"; badge nhóm lịch thi (đặc / viền / viền xám) |
| Xuất theo bộ lọc, thấy số HV | `hvl-xuat-1440`, `-375`, `hvl-da-chon-1440` | Nút "Xuất Excel · n HV" đổi theo lọc; ngăn xuất: "Toàn bộ kết quả đang lọc — 22 HV · đủ mọi trang" / "Các HV đã chọn — n HV"; thanh dính đáy "3 HV đã chọn · Xuất 3 HV đã chọn" |
| T17 tổng không đổi khi gập / phân trang | mọi khung | "Trang 1 / 2 · phân trang theo HV (việc của một HV không bị tách)"; tổng ở thanh đếm tính trên cả tập |
| Rỗng / tải / lỗi | `hvl-rong-1440`, `hvl-tai-1440`, `hvl-loi-tai-1440` | "Không có HV khớp …" + Xoá tìm kiếm; khung xương; `bao-loi` |

## 2. BỎ / GIỮ

| | Thứ | Lý do |
|---|---|---|
| BỎ | Chuỗi `chuLop` "chương trình · lộ trình · n HV · GVCN" + 2 badge "+n" (`StudentsPage.tsx:631, 699-713`) | Brief 12 |
| BỎ | Đơn vị lẫn: nút đếm HV, "Quá hạn" đếm việc, "Chờ duyệt" đếm HV (`StudentsPage.tsx:249, 417`) | Brief 7 — một câu "n HV · m việc" |
| BỎ | Phân trang theo việc (`StudentsPage.tsx:272`) | Việc một HV không tách trang |
| GIỮ | Dòng phụ W1 · W2 ở cả mobile (`BangHocVienLop.tsx:56-70, 194-198`) | Đã đúng C18 (V4 từng bỏ — V5 giữ) |
| GIỮ | 5 trạng thái lịch thi `lichThiOv15f.ts:38-71`; "chưa rà" không suy từ ghi chú trống | Brief 12 bác V4 "Chưa kết luận" |
| GIỮ | Ngăn xuất 2 phạm vi, chọn giữ khi đổi trang, đổi lọc thì bỏ chọn có báo (`NganXuatDs.tsx`, `StudentsPage.tsx:288-302`) | Đã đúng brief 12 |
| GIỮ | Chip SOS "SOS n · R, W" ở ô Kết quả | Cùng họ badge kết quả (C23) |

## 3. Giả định · cần xác minh

- **[ĐX]** "Cần làm" thành tab cùng hàng với Tất cả / Đang SOS / Lịch thi (mã đã là "góc" — đổi chữ đếm, không đổi luồng).
- **[ĐX]** Ô SOS hàng lớp đếm HV theo mức của lượt gần nhất đã chốt (MT2); cần thống nhất với chip "n em SOS" ở góc Đang SOS (`BangSos.tsx:141`).
- **[XM]** "Chọn tất cả" hiện chỉ chọn lớp đang mở ở trang này (`StudentsPage.tsx:322-325`) — nhãn ô chọn ở tiêu đề cần nói rõ "cả trang".
- Lớp MB FT 102, MB FT RF 12, MB FOU 12 vẽ gập (số HV theo nền); các lớp chủ nhiệm khác của cô Hà (MB FOU 15, BE 03, ELE 02, Pre FOU 03) không vẽ vì nền chưa có số HV.
