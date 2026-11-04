# XOA-CASE-PA (N37, chủ SP 05/11 · brief gọn PTA 05/11)

Sửa nhỏ (mục ⋯ / link theo mẫu sẵn có). Nút xoá chỉ ở chỗ Case / PA được mở; nơi khác chỉ có đường tới Case. Ảnh TRƯỚC (main) | SAU, DB demo cục bộ, 14/09,
1440 tối + 375 sáng; vai QL (2), GVCN + GV Reading (7), GV Listening (17).

## Rà mọi nơi có Case / PA / Kết quả PA

| Nơi | Trước | Sau |
|---|---|---|
| Panel Case `NganCase` (mọi nơi mở Case đều qua đây) | Xoá Case ở chân "Sửa Case" (QL, Case báo tay, chặn khi PA có KQ); ⋯ PA "Xoá PA" (QL) | **⋯ "Xoá Case" đầu panel** (một chỗ); ⋯ "Xoá PA" theo quyền mới |
| Hồ sơ HV · cột Case & PA, Hành trình, thanh việc | Mở Case có sẵn | Giữ |
| Hồ sơ HV · Chương theo lớp | Case + chip PA, không đường tới Case | Tên Case bấm được → mở Case tại chỗ |
| Panel một em, hồ sơ lớp, trang lượt Test, Công việc · panel việc | Mở Case có sẵn | Giữ |
| Công việc · việc người khác (`TomTatTheoDoi`) | PA + Gần nhất, không đường tới Case | "Mở Case ›" |
| Công việc · Xác nhận PA lô, Chọn phụ trách | Panel làm lô | Giữ |
| Chờ duyệt | "Mở ›" | Giữ + thẻ xin xoá (xem dưới) |
| Tổng quan · Chờ bạn duyệt | Thẻ gọn, không "Mở ›" | "Mở ›" chân panel duyệt |
| Phân tích · Kết quả Test (`PanelCaseLuot`) | Case + PA + KQ chỉ đọc, không đường tới Case | "Mở Case ›" |
| Phân tích · Hiệu quả PA, số liệu Tổng quan | Mở Case có sẵn | Giữ |
| Hồ sơ GV, chuông | Link Case | Giữ |
| Quản trị › Đã xoá | Khôi phục: chỉ QL | Người xoá thẳng được cũng khôi phục (để GV Hoàn tác) |

## Luật máy chủ (`cachXoaCase` / `cachXoaPa` — một hàm cho máy chủ, cờ nút, Khôi phục)
- QL / Quản trị: xoá ngay. Người sửa được Case (GV môn, người tạo, GVCN lớp em) / ghi được KQ PA: xoá ngay.
- Case hệ thống (trạng thái SOS…) hoặc PA theo quy chế, người không phải QL → MỘT loại thẻ "Xin xoá" (`xin_xoa`, đối tượng Case hoặc PA; PTA đồng ý 05/11), bấm là gửi, hạn mặc định của hộp; QL Duyệt = xoá qua đúng đường xoá Case/SOS sẵn có (`CAU_XOA_CASE`), Huỷ quyết định = Khôi phục; người gửi Rút được.
- Bỏ chặn: "Case còn PA có kết quả", "Case đã hoàn thành", "Case từ Test". Xoá Case: Case + PA + KQ vào Thùng rác **một mục**, Hoàn tác / Khôi phục trả đủ.

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Xoá Case: mở Sửa → chân panel (QL) | ⋯ đầu panel Case (một chỗ, mọi vai có quyền); chân Sửa Case không còn nút xoá |
| Case có PA có KQ: không xoá được, "xoá các PA trước" | Xoá một lần; hỏi một câu "Xoá Case và n PA" |
| Xoá Case không PA / Xoá PA: hộp hỏi | Không hỏi — xoá + toast Hoàn tác, Thùng rác 30 ngày |
| PA quy chế / Case từ Test: không ai xoá được | QL xoá ngay; GV bấm → "Đã gửi QL duyệt"; mục mờ "Đang chờ QL duyệt xoá" |
| Sau xoá Case ở hồ sơ HV hiện thêm "Chưa tải lại được" (cột Case tải lại Case đã xoá → 404) | Không còn (`useApi`: 404 tải lại nền không báo Thử lại) |

Không bỏ thao tác nào (Xoá Case chuyển lên ⋯ cùng panel).

## Tự quyết (chép mục 4 plan)
1. "Người có quyền" = người sửa được Case + người ghi được KQ PA. 2. "Trạng thái SOS" = Case hệ thống (mọi nguồn trừ báo tay / nhập bù); Case báo tay còn PA quy chế cũng xin.
3. Bỏ chặn Case đã hoàn thành. 4. KQ PA lẻ: không thêm xoá (N37 chỉ nêu Case / PA).

## [XM]
- Lý do xin xoá: không hỏi (bấm là gửi — brief điểm 3 không thêm hộp); QL thấy người xin + Case / PA ở thẻ.
- Case SOS đã xoá có thể sinh lại khi điểm lượt đó được nhập / sửa lại.

## Kiểm
- `prXoaCasePa` (4 phép): xoá Case 2 PA + 3 KQ → Khôi phục y hệt · quyền từng vai · PA quy chế: thẻ / Rút / Từ chối / Duyệt / Huỷ quyết định · Case SOS.
- Sửa theo luật mới (Q-7): `prLuiA2` LUIa2-14/16, `prThungRac` TR-5/13, `prPa` PA18, `pr6cPanelAp` 6c-2 ③ (Xoá PA không còn hộp hỏi).
- Bấm thử Playwright Edge; Turso: không thêm câu đọc khi mở trang.

## Ảnh
`truoc-case-ql` → `sau-case-ql-menu` · `truoc-sua-case-ql` → `sau-hoi-xoa-case` → `sau-da-xoa-case` · `sau-xoa-pa-hoan-tac` (Xoá PA một bấm) · `truoc-case-sos-ql` →
`sau-gv-cho-duyet-pa` · `sau-ql-cho-duyet` (thẻ "Xin xoá") · `truoc-panel-case-luot` → `sau-panel-case-luot` (+ `-375`) · `sau-chuong-lop-mo-case` · `sau-tong-quan-duyet` · `sau-gv-case-375`.
