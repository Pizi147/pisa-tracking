# PR-2 Thi thật — khớp / khác mockup (C1–C4)

## [XM] Cột "KN dưới Target" ở bảng Theo GV — GIỮ, chờ PTA quyết

PTA rà #1410 đề nghị bỏ cột này vì mockup / đặc tả không có và nghĩ nó trùng Chưa đạt. Nhưng hai cột **khác nghĩa**:

| Cột | Đếm em nào (của GV × kỹ năng) |
|---|---|
| Chưa đạt | OVR thi thật **dưới Target** |
| KN dưới Target | band **kỹ năng GV đó dạy** dưới Target, **kể cả em OVR đã Đạt / Vượt** |

Ví dụ: em OVR 6.5 / Target 6.5 (Đạt) nhưng W 5.5 dưới Target. Cột Chưa đạt không có em này; cột "KN dưới Target" của GV dạy W có em này. Đây là con số duy nhất cho GV biết **kỹ năng mình dạy** còn dưới Target khi em vẫn đạt nhờ kỹ năng khác.

Cột đã có ở bản đang chạy (main, cùng ⓘ "KN dưới Target: điểm kỹ năng dưới Target, kể cả HV OVR đạt"). Theo CLAUDE.md "giữ mọi tính năng đã có; xung đột mockup / tính năng cũ → [XM], không tự bỏ", PR này giữ cột. Bỏ chỉ còn một dòng (bỏ cột ở bảng 1440, mục "KN dưới" ở thẻ 375, sheet Excel ở PR-5).

## Chưa có KQ — đọc qua chỉ mục (PTA rà #1410)

- Đã đổi ở **#1408** (hàm `tapChuaCoKq` dùng chung cho Chi nhánh và Thi thật), PR này hưởng theo khi nối nhánh.
- Câu mới chỉ đọc lộ trình **đang chờ KQ**:
  - đi chỉ mục từng phần `idx_cycle_cho_kq` (FT, chưa Không thi, chưa điểm);
  - lọc ngày thi trước hôm nay ngay trong SQL;
  - chốt bằng chính `trangThaiSauThi`.
- Trên DB dev, chi nhánh Monbay có 51 em FT: câu cũ đọc **51 lộ trình** và tra Hành trình cho em có KQ; câu mới **2 dòng**.
- Phép kiểm: câu mới cho đúng tập như cách cũ (`sauThiTheoEm`).
- Trần `tocDoDuong` của `/phan-tich/thi-that` đã hạ lại theo số đo (xem mô tả PR).
