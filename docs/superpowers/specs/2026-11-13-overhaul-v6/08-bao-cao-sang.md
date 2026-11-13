# Overhaul V6 — báo cáo sáng 14/11 (PTA Overhaul, phần của tôi; PTA Plan báo riêng phần logic + code giao diện)

## 1. Chờ chủ SP duyệt

| Mockup | PR (mở, chưa merge) | Tệp | PTA đã tự xem ảnh |
|---|---|---|---|
| ② Hồ sơ lớp | #1560 | `thiet-ke/v21/ho-so-lop.html` | khung K1 (1440 tối), trước lần sửa cuối |
| ③ Hồ sơ học viên | #1559 | `thiet-ke/v21/ho-so-hv.html` | khung K1 (1440 tối) |
| ④ Trang đầu TVV | #1557 | `thiet-ke/v21/trang-dau-tvv.html` | khung K1 (1440 tối) |
| ⑤ Bảng mẫu thành phần | #1558 | `thiet-ke/v21/bang-mau.html` | khung A1 (ô chọn có tìm), trước lần sửa chuông |

Các khung khác, bản Sáng, 375 và các lần sửa sau: mới có bảng tự rà của từng session (đều báo Đạt), PTA chưa tự xem. Tệp nằm trên nhánh của từng PR (chưa có ở `main`); mở trong session mockup tương ứng.

## 2. Đã merge trong đêm (phần PTA Overhaul)

- #1562 tài liệu: Rulebook + `plan.md` 1.6 theo luật đang chạy và lời 13–14/11 (N40–N45, mục 22 Rulebook).
- #1568 giảm đọc Turso: ô tìm Ctrl K 360–845 câu → 15 câu; ô lớp Giao việc 15 → 3 câu; Chuyển lớp nhiều em N request → 1; bỏ request thừa ở ô người phụ trách. Check đầy đủ xanh theo session báo. CHƯA deploy.
- Tài liệu overhaul: lời 1–22, thiết kế (`04`), plan logic (`05`), đề bài mockup (`03`, `06`), plan giao diện đợt 1 (`07`).

## 3. Câu hỏi cho chủ SP (gom từ bốn mockup)

**Hồ sơ lớp (②)**
1. "+ Task" là nút chính (nổi), "Nhập điểm" là nút thường — đúng thứ tự ưu tiên chưa?
2. Dòng GV theo kỹ năng thu gọn thành một nút; link hồ sơ từng GV chỉ có khi mở đủ — được không?
3. GV cũ đang bổ trợ xem lớp mới: dải chữ "Chỉ xem · Bạn dạy bổ trợ …" — chữ mới, cần chốt.

**Hồ sơ học viên (③)**
4. "+ Case" vào trong "+ Task" → tạo Case từ 1 bấm thành 2 bấm. Chấp nhận, hay giữ thêm nút "+ Case" riêng ở hồ sơ HV?
5. Thanh "Việc cần làm" ở hồ sơ HV dùng DÒNG việc (có hạn + nút), không dùng nút-chip như ở lớp — vì mỗi em ít việc. Được không?
6. Em đã lưu trữ: nút chính là "Quay lại học". GV không dạy em: không có "+ Task". Đúng ý chưa?

**Trang đầu TVV (④)**
7. TVV có được "Hỏi tình hình học tập" của em KHÔNG do mình phụ trách (cùng chi nhánh) không? Mockup giả định có.
8. "HV của tôi": em không có việc, không có tình trạng thì gập thành "n em khác" — được không?
9. "+ Task" của TVV chỉ có một mục (Hỏi tình hình học tập): vẫn mở menu, hay bấm là vào thẳng?

**Bảng mẫu (⑤)**
10. Ô chọn em của GV không có nhóm "Khác" (GV chỉ chọn được em lớp mình dạy theo quyền); QL thì có — đúng chưa?
11. Chuông giữ dáng 11/11, bấm một loại việc → mở Công việc đúng tab — PTA đã tự chốt, báo để biết.

**Luật còn chưa rõ (PTA không cho sửa tài liệu khi chưa chắc)**
12. MT0 gõ "-": mã không dời, không huỷ; Rulebook ghi áp luật vắng. Theo bên nào?
13. Việc Bước tiếp sau thi: N6 ghi "TVV của em", mã cho mọi TVV cùng chi nhánh làm. Theo bên nào?
14. Xoá học viên / lớp trống: Rulebook "chỉ Quản trị", mã cho QL làm. Theo bên nào?
15. Thẻ "Thu hồi xử lý vi phạm" hết 5 ngày không tự chốt (thẻ xử lý thì tự chốt theo GVCN) — có chủ ý không?

**Trang đầu GV (①, đã duyệt) — hai điều để ngỏ**
16. Nhiều chip đỏ khi nhiều việc quá hạn: giữ, hay chỉ chip Nhập điểm đỏ còn loại khác chỉ mang ⚠?
17. Tab "Chấm Speaking" có badge đỏ riêng (bài quá hạn của nhóm), không cộng vào badge menu — giữ?

## 4. Sau khi chủ SP duyệt mockup

PTA Overhaul viết plan giao diện đợt 2 (hồ sơ lớp · hồ sơ HV · trang đầu TVV · bộ thành phần chung: nâng `ChonNguoi` / `ChonLop` + thay 16 chỗ ô chọn thường, dòng việc, dòng quy chế 83 câu, chuông) rồi giao session. Hai session dự bị (`du-bi-1` Opus, `du-bi-2` Sonnet) đang rảnh.
