# AU-VIEC-1 — việc sau thi thật (N46) · thanh việc hồ sơ HV (P1-04) · Báo cáo PH quá hạn cho QL (N49)

Ảnh cặp TRƯỚC (main fed22ac) | SAU (nhánh này), demo 14/09, tối, 1440 + 375. Không đổi bố cục: thêm dòng vào thành phần sẵn có
(thanh "Việc cần làm" ③ K1 hồ sơ HV, danh sách Công việc ① tab "Việc quản lý") — cùng dòng, cùng nút, cùng panel với Công việc.

| Ảnh | Vai · đường | Thấy |
|---|---|---|
| `tvv-ho-so-bao-ph-1440.png` · `-375.png` | TVV Phan Mai (27) · hồ sơ Trịnh Ngọc Ánh (117) | TRƯỚC không có thanh việc dù Công việc có "Báo PH · Report 1 · hạn 18/09" (audit B2-07) · SAU thanh "Việc cần làm · 1 việc": Báo PH · REPORT 1 · hạn 18/09 · Ghi báo PH |
| `gvcn-ho-so-phoi-hop-1440.png` · `-375.png` | GVCN Trần Ngọc Hà (7) · hồ sơ Lý Minh Châu (50) | TRƯỚC 1 việc (audit B2-06: Công việc 3) · SAU 3 việc: + Trao đổi với gia đình · Trao đổi ngắn với HV (Phối hợp SOS) |
| `ql-viec-quan-ly-bc-ph-1440.png` · `-375.png` | QL Nguyễn Khánh Vy (2) · Công việc › Việc quản lý | SAU mục "Báo cáo PH": một dòng mỗi lớp × đợt quá hạn > 7 ngày còn thiếu em ("MB FT 101 · Báo cáo PH quá hạn · Tháng 8 · thiếu 31 em · quá hạn 15 ngày · Báo cáo PH ›") |

Ảnh QL: DB demo đặt mốc bật `bc_ph_viec_gv_tu = 2026-08-01` cho thấy dòng (seed đặt mốc = ngày demo nên không đợt nào đủ điều kiện).
Bản chính: mốc = ngày deploy LG-3 (16/11) → chỉ đợt có hạn từ ngày đó mới sinh việc QL, không dồn đợt cũ.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| GV / QL Công việc: việc Case / PA / Phối hợp SOS của em đã có KQ thi thật | còn (vd 5 GV bị đòi Mô tả Case) | ẩn (như em Tạm dừng; dữ liệu giữ) — N46 | ĐỔI theo luật |
| Lộ trình mới sau thi | việc cũ đóng (Case đóng sẵn) | như cũ, không hiện lại | GIỮ |
| Dời lịch thi (chưa có KQ) | việc giữ | việc giữ | GIỮ |
| Hồ sơ HV · Phối hợp SOS | chỉ ở tab Ý thức & Phối hợp | + dòng ở "Việc cần làm", bấm mở panel Phối hợp của Công việc (em này lên đầu, tô nhấn) | THÊM |
| Hồ sơ HV · Báo PH vi phạm / Meeting CX (TVV, QL khi em chưa có TVV, GVCN khi em chưa có TVV sau Meeting) | chỉ ở Công việc / tab Ý thức | + dòng, bấm mở panel Ghi báo PH / Phối hợp tại hồ sơ | THÊM |
| Hồ sơ HV · Bổ sung hồ sơ thiếu (TVV / QL) | chỉ ở Công việc (dòng tổng) | + dòng "Bổ sung hồ sơ · Ngày sinh…", bấm mở Sửa thông tin của em | THÊM |
| QL · Báo cáo PH quá hạn > 7 ngày | không còn số nào nhắc (chỉ chữ đỏ ở tab lớp) | dòng ở Việc quản lý, "Báo cáo PH ›" mở tab Báo cáo PH đúng đợt; hết khi lớp đủ | THÊM — N49 |
| Mọi thao tác cũ ở Công việc / hồ sơ HV | — | giữ nguyên | GIỮ |

## KHÁC (có lý do)
- **KHÁC-1** Panel Phối hợp SOS mở từ hồ sơ là panel CHUNG của Công việc (cả lớp, em đang xem lên đầu, tô nhấn) — không làm panel riêng cho một em (một kiểu mở, một panel).
- **KHÁC-2** Dòng "Báo cáo PH quá hạn" rời sau hạn + 30 ngày (cửa sổ đọc chung với việc Admin "Xuất báo cáo PH") — nới nếu chủ SP muốn nhắc lâu hơn.
