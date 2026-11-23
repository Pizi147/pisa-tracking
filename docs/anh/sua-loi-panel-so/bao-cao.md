# Sửa lỗi panel số — 5 nghi lỗi từ đợt rà #2059

Kiểm trên dev server (bản chép demo, vai Quản trị, 14/09/2026), trước khi sửa.

| # | Nghi lỗi | Tái hiện? | Gốc | Việc đã làm |
|---|---|---|---|---|
| 1 | SOS › Theo tuần: chữ ngày hàng "tuần này" đè ô số | Có — chữ phải 265 px > mép cột 216 px | `tenDong` (`TongHopTestSos.tsx`): dòng phụ `whitespace-nowrap` rộng hơn cột | `max-w-full truncate align-bottom`: một dòng, cắt "…", đủ chữ ở `title`. Sau: 204 ≤ 216. Ảnh `loi1-*` |
| 2 | Ý thức 375: nút số vùng bấm 44 × 26 | Có — cả 27 nút đều có `::after` 44 × 44, nhưng 9 cặp xếp dọc cách nhau 26 px nên vùng bấm chồng nhau, mỗi nút còn ~26 px cao | Hàng bảng cao 26 px ở 375 | **Không sửa** — muốn 44 phải tăng khoảng cách hàng (đổi bố cục) → [XM] |
| 3 | Panel Tiến bộ ghi "MT2 → MT1" | Có (HV có MT2 xếp tuần 17/08, MT1 xếp tuần 31/08) | Dữ liệu seed: số MT ngược với tuần xếp lịch; `giaoVien.ts` chọn "lượt trước" theo tuần → đúng thời gian | **Không sửa** (đổi sang theo số MT sẽ đổi tập Tiến bộ ở mọi nơi) → [XM] |
| 4 | Lăn chuột trên nền mờ → trang sau cuộn | **Không** — nền mờ nằm trong portal, `body` đã `overflow:hidden`; `main` không phải tổ tiên nên không bị kéo cuộn (đo `main.scrollTop` = 0 sau 5 nấc) | — | Không đổi `KhungPanel.tsx` |
| 5 | Tổng quan: ô ↔ panel lệch | `tq-05` (52 bài ↔ 15 việc): **không lỗi** — đầu panel đã ghi "52 bài", tổng "thiếu n bài" của 15 việc = 52. `tq-06`: **có** — ô Meeting đếm VIỆC (4) nhưng ghi "4 em" (4 việc = 4 + 6 + 8 + 3 em) | `DON_VI.meeting` (`TongQuanVai.tsx`) | Đơn vị Meeting thành "{n} việc" (nhãn ô, đầu panel). Ảnh `loi5-*` |

## [XM] cho chủ SP
- Lỗi 2: chấp nhận hàng 44 px ở 375 cho bảng Ý thức, hay giữ bảng gọn (vùng bấm thực ~26 px)?
- Lỗi 3: dòng "MT2 → MT1" xuất hiện khi lịch seed xếp MT1 sau MT2. Ở dữ liệu thật luật chặn xếp MT mới khi MT trước chưa có lịch, nên khó gặp. Muốn đổi cách chọn "lượt trước" thì là đổi luật Tiến bộ.
