# TEN-CHI-SO — bảng truy vết (27/10, trên main 9655b29d)

Một chỉ số một tên (L3 + Đ5, `plan.md` mục 4 dòng "CHAM-LAI #564 đã merge"). Cột "Đơn vị" xác định trước khi đổi.

| Tên cũ | Tệp:dòng | Màn | Đơn vị | Tên mới |
|---|---|---|---|---|
| Đạt kỳ vọng (khi lớp có nhiều MT) | `classes/DauTrangLop.tsx:250` | Hồ sơ lớp · số đầu trang | HV | **Đạt MT** (FT) · **Đạt Test** (thường); cùng MT giữ "Đạt MT2" |
| Đạt MT · kỹ năng tôi dạy (+ panel "Kết quả", mẫu "lượt") | `worklist/TongQuanV5.tsx:413` | Tổng quan GV · ô số | lượt Test (GV) | **Đạt kỳ vọng Test** · panel cùng tên · mẫu "lượt Test" |
| Đạt Test (cột, gợi ý "Lớp FT: …") | `worklist/LopToiDay.tsx:148` | Tổng quan GV › Kỹ năng tôi dạy | lượt Test (GV) | **Đạt kỳ vọng Test**; gợi ý chỉ còn "Lớp thường: Đạt Test (≥ ngưỡng đạt của lớp)" |
| Kết quả / Kết quả {môn} (tiêu đề panel) | `server/phanTich/giaoVien.ts:651` | Phân tích GV › panel ô | lượt Test (GV) | **Đạt kỳ vọng Test** / **Đạt kỳ vọng Test {môn}** = tên cột; đơn vị "lượt Test" (như hồ sơ GV) |
| Pass Target (tiêu đề cột) | `giaoVien/HoSoGiaoVienPage.tsx:431`, `phanTich/PhanTichGiaoVien.tsx:43` | Hồ sơ GV › bảng lớp · Phân tích GV | lần thi (GV) | **Kết quả thi thật**; ô giá trị % Pass Target (gợi ý cột) |
| Đạt kỳ vọng (câu giải thích kỳ) | `giaoVien/HoSoGiaoVienPage.tsx:111` | Hồ sơ GV | lượt Test | **Đạt kỳ vọng Test** |
| Thi đợt này | `phanTich/BaoCao.tsx:71`, `worklist/TongQuanV5.tsx:305`, `server/phanTich/baoCao.ts:347` | Phân tích › Báo cáo HV | HV | **Thi trong kỳ** (số = HV có ngày thi trong kỳ đang chọn) |
| Cần chú ý (khối 3 dòng thi) + dòng phụ lặp "HV của tôi · lọc …" | `worklist/TongQuanV5.tsx:448` | Tổng quan TVV | HV | **Thi thật**; bỏ dòng phụ lặp. Chip "Cần chú ý" (HV & Lớp) giữ — đúng nội dung (SOS · Case · Ý thức · chờ bước tiếp) |
| nhóm / Chọn một nhóm… / {n} nhóm · {bai} bài | `test/ChamTestTab.tsx:121,154,160` | Test › Chấm Test | việc | **việc** (cùng mục của Công việc — cùng nguồn `/my-work`) |
| ô điểm / ô (lọc, rỗng, phân trang, aria) | `phanTich/PhanTichGiaoVien.tsx:163–192` | Phân tích GV › Điểm đúng hạn | bài | **bài** |
| Hướng dẫn | `shared/huongDan/gv.ts:16,46,48,123`, `tvv.ts:45` | Hướng dẫn GV, TVV | — | theo tên mới (+ khoá EN) |

**Giữ (ngoại lệ có lý do):**
- "Đạt kỳ vọng" ở `SkillBoard`, `ClassRoster`, `BangHocVienLop`, `KetQuaDot`, `domain/display|hanhTrinh|normal` — nhãn TRẠNG THÁI của một kết quả (lượt / em), không phải tên chỉ số.
- Cột "Đạt Target" bảng Kết quả MT, nhãn "Đạt Target / Chưa đạt Target" của một lần thi (`10` mục 5).
- "Đạt Test" mức GV lớp thường (hồ sơ GV, Phân tích GV): từ điển chỉ chốt tên mức GV cho FT.
- "Chú giải ô điểm" (`LuoiFT`) — ô trên lưới, không phải đơn vị đếm.
- 4 tệp Lịch Test (`LichTestTab`, `HangLop`, `NhomDau`, `LuoiNhung`) — session tiếng Anh đang làm (PTA 27/10).
