# GIAM-DOC-0711 — giảm dòng đọc Turso (đêm 07/11)

Cách đo như `ra-doc-0611.md` / `giam-doc-0611.md`: `tocDo.run` (`PISA_IN_JSON` + `PISA_IN_DO` + `PISA_DO_IT`) rồi `scripts/do-it.py` trên DB ×3.
Thêm: chạy lại đúng câu đã ghi trên **bản chép bản chính 29/10** (`D:\pisa-mig\mig.sqlite`, chép ra tạm, chỉ đọc) để lấy tỷ lệ bớt theo phân bố thật.

## Mốc 07/11 (main 5e347763b, ×1 câu · dòng trả)

| (vai × đường) | câu | dòng | ghi chú |
|---|---|---|---|
| GV `/tong-quan/lop-toi-day/hai-khoi` | 51 | 1 839–2 101 | ~400 lần / ngày; câu nặng đều đi chỉ mục (lượt, điểm, Case lớp mình) — dòng = em × lượt |
| QL `/hoc-vien-lop` | 51 | 2 659 | như RA-DOC-0611 [XM-3] |
| CX · QT `/tong-quan/hoc-vien` | 17–18 | 2 135 | đã giảm ở GIAM-DOC-0611b (61 → 16) — không còn > 30 câu |
| GV `/my-work` | 36–37 | 814–830 | không SCAN `sos_cases` (RA-DOC-0611b) |
| hồ sơ GV `/giao-vien/{gv}/chi-so` | 82–132 | 1 961–2 536 | **DEM-QUA-HAN #1114**: dựng Công việc "Tất cả" của QL chi nhánh (`viecQuaHanMo`) → +30–40 câu, SCAN `sos_cases` |
| QL Phân tích GV · panel Việc đúng hạn | 57–82 | 1 196–2 716 | như trên |
| QL `/my-work?nguoi=tat-ca` | 48 | 1 219 | `napCaseMo` đọc MỌI Case mở cả hệ thống (Turso 06/11: 1,25 triệu dòng / 359 lần) |

Đường mới đợt 06/11 đã rà: CV-TAB #1130 (`/my-work` thẻ chi nhánh: bảng chi nhánh nhớ theo tiến trình, 0 câu) · TAT-CHECKPOINT #1109 (đường ghi, một câu / bài) ·
RESET-HAN-CASE #1127 (thêm cột vào câu sẵn có + một `getConfig` nhớ) — không thêm đọc đáng kể. Câu lặp y hệt trong một request: chỉ còn câu một dòng
(`SELECT name FROM branches WHERE id = ?`, mốc Case từng em) — không đáng sửa.

## Sửa

| PR | Việc | Trước → sau | Ước / ngày |
|---|---|---|---|
| a | `napCaseMo` tập cha theo chi nhánh: người xem có quyền theo chi nhánh (QL / QT một chi nhánh, "QL chi nhánh" của Phân tích GV / hồ sơ GV) hoặc Công việc lọc chi nhánh — điều kiện trong SQL không phụ thuộc dòng ghi danh; `lamThayCua` dùng lại dòng đã nạp | bản chính: câu Case mở 118 900 → 25 500–79 200 bước VM (TB theo số QL ≈ 42 000, −64 %); demo ×3: −9 đến −11 k bước / đường, câu không đổi | ~0,8–1 triệu |

JSON 755 / 755 đường giống hệt. Phép kiểm `GIAM-DOC-0711a` (`tocDo.run`): `myWork` mọi tài khoản × (không lọc, từng chi nhánh) × (Của tôi, Tất cả, Tất cả tách Của tôi)
+ Phân tích GV từng chi nhánh × khung + hồ sơ GV mọi GV — 620 lần so giống hệt đọc cả hệ thống; QL chi nhánh khác "Tất cả" 733 → 567 dòng (khoá giảm).

## [XM] cho PTA — chưa làm, cần đổi thiết kế

1. **Tổng quan GV hai-khoi** (~400 lần / ngày × ~2 000 dòng trả ×1 ≈ 0,8 triệu dòng SQLite / ngày, Turso cao hơn vì tính cả dòng chỉ mục): mọi câu đi chỉ mục, không câu thừa.
   Bớt thêm phải đổi cái hiện: vd khối "Lớp tôi chủ nhiệm" / Kết quả theo lớp chỉ tải khi mở, hoặc bỏ một trong hai kiểu lịch kỹ năng ('valid' + 'due' — `loadSkillRows`).
   Ước bớt 30–50 % đường ≈ 0,3–0,5 triệu / ngày. Cần chủ SP.
2. **`viecQuaHanMo` (DEM-QUA-HAN)** vẫn dựng gần đủ Công việc chi nhánh (~40 câu) cho mỗi lần mở hồ sơ GV / panel Việc đúng hạn dù chỉ cần việc quá hạn của MỘT GV.
   Bớt nữa = Công việc dựng riêng theo người giữ việc (đổi lớn `mywork.ts`, rủi ro lệch số với Công việc). Ít người mở → để sau, xem Turso sau deploy.
   GV dạy nhiều chi nhánh: hồ sơ GV đọc Case mở mỗi chi nhánh một lần (QT `/giao-vien/9/chi-so` +2 câu, dòng trả vẫn giảm 2 319 → 2 243).
3. `/hoc-vien-lop` QL 51 câu · 2 659 dòng — như RA-DOC-0611 [XM-3], không đổi.

Không index mới → **không có migrate.**
