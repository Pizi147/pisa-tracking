# v22 · ③ Việc Vận hành · ghi chú cho người duyệt

Mockup: `thiet-ke/v22/van-hanh.html` (+ `v22.css`; dùng lại `../v21/v21.css`, `bang-mau.css`, `trang-dau-tvv.css`).
Thiết kế: `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` mục C (+ B, D) (ĐỀ XUẤT). Ảnh: `anh/van-hanh/{khung}-{toi|sang}.png`.
Màn thật: `web/src/modules/worklist/MgmtTasksPage.tsx` (đã đọc: hàng số, lọc Nhóm / Trạng thái / Người phụ trách, cột Việc · Người phụ trách · Hạn · Trạng thái · Việc con, panel Cập nhật tiến độ, Sửa công việc, Lịch sử hạn, chế độ "Giao GV theo lớp + kỹ năng").

## 1. Trạng thái đã vẽ

| Khung | Trạng thái |
|---|---|
| V1 | 1440 · Head · bảng chia 6 nhóm (3 mở, 3 gập) + "Không phân loại" cuối · bấm thử hàng nhóm |
| V2 | panel tạo việc: nhóm, loại, người phụ trách, hạn, 3 người theo dõi, 2 việc con (người + hạn), lặp hằng tuần T2, 1 tệp · V2b ô Nhóm mở · V2c hằng tháng · V2d thiếu tên |
| V3 | panel xem / sửa việc lặp (khối ba dòng, trạng thái + Cập nhật tiến độ, Lặp lại + Dừng lặp, việc con, tệp, Lịch sử) · V3b sau Dừng lặp · V3c đóng việc cha còn việc con (đang có) |
| V4 | hộp Nhóm công việc: ▲ ▼, Đổi tên (một dòng đang sửa), Ẩn / Hiện · V4b + Nhóm mới |
| V5 | 1440 · GVCN · tab Vận hành có mục "Việc được giao" chia theo nhóm + panel cập nhật tiến độ |
| V6a / b / c | 375 · Việc được giao · panel cập nhật · bảng Head thành thẻ |

## 2. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Hàng số Quá hạn · Chờ người khác · Cần quyết định · Vừa hoàn thành (7 ngày) | có | GIỮ (dải số chuẩn) |
| + Giao việc · lọc chi nhánh / Nhóm / Trạng thái / Người phụ trách | có | GIỮ |
| Bảng một danh sách | có | chia theo nhóm, hàng nhóm gập / mở |
| 4 nhóm cố định | có | nhóm tự đặt (4 nhóm cũ thành nhóm khởi đầu) + "Không phân loại"; nút **Nhóm…**. **N63 ⑧ (21/11):** 4 nhóm khởi đầu chỉ **Quản trị** sửa / sắp / ẩn, Head không |
| Người theo dõi | MỘT | nhiều (chip) |
| Việc con | một cấp | GIỮ một cấp; mỗi việc con thêm người + hạn |
| Lặp lại · Dừng lặp | — | MỚI |
| Tệp đính kèm | — | MỚI (cơ chế tệp sẵn có) |
| Cập nhật tiến độ (5 trạng thái, lý do Tạm ngưng / Dừng hẳn, Cần ai hỗ trợ, Ngày xem lại) | có | GIỮ |
| Sửa hạn (lý do bắt buộc, lịch sử) | chỉ Head | người phụ trách cũng sửa, lý do tuỳ chọn, có lịch sử |
| Sửa công việc · đóng việc cha bị chặn khi còn việc con | có | GIỮ (⋯ / hộp hỏi một lần) |
| Giao GV theo lớp + kỹ năng (sinh Case) | có | GIỮ (đoạn đầu panel tạo) |
| Người được giao thấy việc | không | Công việc › Vận hành › "Việc được giao" + tin chuông |

## 3. Chỗ tự quyết

- Hàng nhóm là `<tr>` trong thân bảng (cả hàng là nút), không nằm trong `thead` (G9). "Không phân loại" luôn cuối, vạch xám.
- Sắp thứ tự nhóm bằng nút ▲ ▼ (dùng được bằng phím) thay vì kéo thả.
- "Ẩn" nhóm thay vì xoá (không mất dữ liệu): nhóm ẩn không còn trong ô chọn khi tạo việc, việc cũ giữ nhóm, "Hiện" lại được.
- Lặp lại: chip Không · Hằng tuần · Hằng tháng; hằng tuần chọn MỘT hoặc nhiều thứ (T2…CN); hằng tháng gõ ngày. Hạn bản mới = ngày tạo + khoảng hạn của bản gốc (ghi ở dòng quy chế).
- Dừng lặp: bản đang mở giữ nguyên, Hoàn tác 10 giây.
- Bảng Head ghi thêm "+n theo dõi" dưới tên người phụ trách; dòng phụ việc có "↻ hằng tuần · thứ Hai" + số tệp.
- Phía người được giao: mục "Việc được giao" trong tab Vận hành, vạch con = nhóm; việc con giao cho tôi hiện như một dòng với thẻ "việc con của {tên}".
- Trạng thái trong panel cập nhật là chip (danh sách ngắn cố định ≤ 7 — N45 cho phép).
- 375 Head: "Nhóm…" vào nút ⋯ đầu trang.

## 4. [XM] — đã xử lý

- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — BPXL: "Việc được giao" là TAB riêng (như ảnh giao-viec G8a: Xếp lịch họp · Việc được giao · Đang theo dõi); vai khác: mục trong tab Vận hành như V5.
- **ĐÃ CHỐT (chủ SP duyệt mockup v22, theo đề xuất PTA)** — Head (và người phụ trách) sửa hạn việc Vận hành: lý do TUỲ CHỌN, vẫn ghi lịch sử.

## 5. Dòng đọc

Bảng Head: cùng đường đang có + cột nhóm / theo dõi / lặp / số tệp (join theo việc đã đọc). "Việc được giao" ở `/my-work`: +1 câu có chỉ mục (thiết kế). Hộp Nhóm: một câu đọc danh sách nhóm chi nhánh.
