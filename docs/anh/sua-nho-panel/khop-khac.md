# Sửa nhỏ panel (05/11) — "Lịch sử · n" sau Duyệt · hộp Chờ đổi có tiến độ bàn giao

Nguồn: plan.md mục 4 "05/11 PTA rà backlog cũ" (c) — [XM] DUYET-QL + [XM] PR-C Góc Phân công GV. Đổi chữ / thêm dòng theo mẫu sẵn có, không cần mockup.

## 1 · "Lịch sử · n" sau Duyệt / Từ chối / Trả lời (panel duyệt, Công việc QL)
- Trước: n là số lúc mở panel; quyết xong panel kết quả vẫn hiện số cũ, mở ra thấy nhiều dòng hơn số.
- Sau: `POST /yeu-cau/:id/duyet | tu-choi | tra-loi` trả kèm `soLichSu` (một câu COUNT, cùng điều kiện `DK_NHAT_KY` với số trên thẻ và `/lich-su`).
  Panel kết quả dùng số này — **không thêm request ở web**; danh sách đang gập thì không gọi gì, đang mở thì tải lại đúng `/lich-su?loai=yeu-cau&id=` khi n đổi.
- Duyệt nhiều (`duyet-nhieu`), seed: không đổi (không đếm).

## 2 · Hộp Chờ đổi (Góc Phân công GV) — "Việc bàn giao của A: a/b em đã viết · hạn"
- Chữ + vị trí theo `thiet-ke/v9/phan-cong-gv.html` khu 5 (`.ket-bg` trên câu "Huỷ lịch đổi = …"); dùng lại `.pc-ket-bg` + `.pc-han`.
- Dữ liệu: câu lịch chờ sẵn có của `GET /hoc-vien-lop/phan-cong` thêm cột con `bg` (việc bàn giao đang mở của dòng chờ qua `ban_giao_gv_mon.doi_id`).
  Không có lịch chờ có việc → **0 câu thêm**; có → `viecBanGiaoGv(…, ids)` (3 câu, chỉ các việc đó — không đọc cả chi nhánh). Trần `tocDoDuong` giữ nguyên.
- a/b = số em đã viết ĐỦ mọi cột của việc / số em đang học (cùng hàm với dòng việc ở Công việc).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Panel duyệt: Duyệt / Từ chối… / Trả lời… / Hoàn tác / Yêu cầu tiếp › | có | giữ |
| Lịch sử · n (mở / gập tại chỗ) | có, n cũ sau quyết | giữ, n đúng |
| Hộp Chờ đổi: Đổi mốc… · Huỷ lịch đổi · Esc / bấm ngoài | có | giữ |
| Hộp Chờ đổi: dòng tiến độ bàn giao | không | thêm (chỉ đọc) |

Ảnh trước | sau: `lich-su-*`, `cho-doi-*` (1440 tối · 375 sáng).
