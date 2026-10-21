# Truy vết — `phan-tich.html` (V5-B3 · Báo cáo HV + Phân tích GV)

V5-B3 · 22/10/2026 · dựa trên nền V5-A (`v5-nen.css`, `du-lieu-demo.md` mục 5, 8, 8b; `05-tu-dien-chi-so.md`).
Trạng thái: **ĐỀ XUẤT THIẾT KẾ**. Dữ liệu demo. Ảnh: `anh/phan-tich-*.png`.
URL mockup: `?tab=gv`, `?cot=day`, `?pv=qt`, `?tt=tai|loi|rong`, `?mo=datmt|datmt-qt|thithat|case|…`, `&trang=2`, `?theme=dark`.

## Yêu cầu → khung → thành phần

| Yêu cầu | Loại | Khung (ảnh) | Thành phần |
|---|---|---|---|
| C22 · 14.1 — Báo cáo HV tách khỏi GV; kết quả + hỗ trợ; chấm đúng hạn là thông tin phụ | CHỐT | `phan-tich-bao-cao-1440-sang` | tab "Báo cáo HV": 4 số (Đạt MT · Case có PA · Đạt Target thi thật · Thi tuần này) → Kết quả theo lớp · Tiến bộ theo kỹ năng · Case / PA; chấm đúng hạn = 1 dòng phụ |
| C07 · 14.2 — Phân tích GV MỘT bảng hai nhóm cột Hành chính / Học thuật; bộ cột gọn / đầy đủ | CHỐT | `phan-tich-gv-gon-1440`, `-gv-day-du-1440`, `-gv-1280`, `-gv-375` | `.bang-gv`: hàng đầu nhóm (vạch xanh = Hành chính, vạch hồng = Học thuật); "Bộ cột Gọn / Đầy đủ" ở hàng lọc (không trong tiêu đề bảng); cột tên dính trái khi cuộn ngang |
| 14.2 — mỗi tỷ lệ có mẫu số (dòng phụ) | CHỐT | mọi ô | `%` + `n/N` dòng phụ; < 5 "mẫu nhỏ" (không %); mẫu 0 "– Chưa có dữ liệu" |
| T11 — 75 % = 15/20, panel giải thích đúng 20 | CHỐT | `phan-tich-panel-75-1440`, `-panel-75-375` | tiêu đề khớp số; cách tính; 15 · 5 · 2 ngoài mẫu; bảng 20 HV (chưa đạt lên đầu); "Ngoài mẫu (2)" gập |
| T17 — phân trang không đổi tổng | CHỐT | `phan-tich-panel-75-trang-2-1440` | "Dòng 11–20 / 20 · tổng giữ nguyên khi đổi trang" |
| T19 — mẫu 0 không hiện 0 % | CHỐT | `phan-tich-panel-chua-co-du-lieu-1440`, ô Đạt Target MB | "– Chưa có dữ liệu" viền đứt (khác ✗ chưa đạt) |
| T20 — tổng nhiều chi nhánh có trọng số | CHỐT | `phan-tich-qt-1440`, `-panel-tong-he-thong-1440` | QT: bảng theo chi nhánh + dòng Toàn hệ thống 23/38 = 61 % ("không phải TB 57 %") |
| T06–T08 · brief 15 quy tắc Overall | CHỐT | panel 75 % (Trần Thu Hà, Lê Quang Huy, Tô Ngọc Hân); chú thích bảng GV | — |
| C22 · 14.3 — panel chỉ đọc, không Thêm PA / Tạo Case / Ghi KQ / Duyệt / Làm thay | CHỐT | mọi panel | chân panel chỉ "Xuất CSV" + câu nhắc; tên ↗ tra hồ sơ |
| 14.3 — phạm vi: chi nhánh, chương trình, kỳ, kỹ năng; "trong kỳ" ≠ "hiện tại" | CHỐT | nhãn số, dòng phạm vi panel | "· trong kỳ" / "· hiện tại" / "· W3 SEP" cạnh tên số |
| C08 — không xếp hạng, không KPI, không màu ngưỡng | CHỐT | bảng GV | xếp theo tên; câu ở hàng lọc |
| C23 — badge SOS cùng hệ, có chú giải | CHỐT | Kết quả theo lớp | `bd-sos m1/m2` + chú giải độ dày viền |
| Tải / lỗi / rỗng · 1440 / 1280 / 375 / tối | CHỐT | `-dang-tai-1440`, `-loi-1440`, `-rong-1440`, `-bao-cao-1280`, `-375`, `-bao-cao-1440-toi`, `-gv-1440-toi` | — |

## BỎ

- Bảng Phân tích GV chia khung FT / thường với nhiều cột kỹ năng ở mặc định (kỹ năng chi tiết sang Hồ sơ GV).
- Màu ngưỡng đỏ < 50 / vàng 50–69 / xanh ≥ 70 ở ô kết quả (`shared/domain/phanTichGv.ts` `mauKetQuaGv`).
- Chữ "không có" cho mẫu 0 → "Chưa có dữ liệu".
- Khối "Cần làm" / việc tại dòng khi panel số mở từ Báo cáo (OV-12e) — C22.
- Chỉ số "HV FT xong MT3 chưa có MT kế" ở Báo cáo (`baoCao.ts:137`) — C20 (đã ghi ở `06`).

## GIỮ

- Hợp đồng số liệu: ô số và panel cùng một tập ID (`metricSet`, `tinh()`, các hàm `tap*` Phân tích GV).
- Hàng lọc chung giữ khi đổi tab (Chương trình · Khoảng · Lớp); kỳ mặc định theo tab như mã hiện tại.
- Các tab Test + SOS · Kết quả thi · Hiệu quả PA · Ý thức: không vẽ lại ở B3 (giữ bố cục, chỉ đổi token màu V5).

## Giả định

- Số theo lớp / kỹ năng của Báo cáo (SOS 1 · 3, tiến bộ L R W1 W2 S, PA 4/5 · 3/4, 127/132 bài) và 4 GV ngoài 8b (Linh, Hương, Vinh, Duyên) là [V5].
- 20 tên HV trong panel 75 %: 5 từ `du-lieu-demo.md` mục 5 + 15 tên [V5].

## CẦN XÁC MINH

- Không có câu mới ngoài `b3-ra-soat.md` mục 6 (mốc phản hồi; gán thi thật cho GV).
