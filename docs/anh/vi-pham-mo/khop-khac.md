# VI-PHAM-MO — vi phạm bấm xem mô tả + dịch (chủ SP 21/11)

Không mockup mới: dùng lại dòng vi phạm, `ChuDich` và kiểu "bấm tên mở tại chỗ" đã có (plan.md 1.3b). Ảnh: `truoc/` | `sau/` — 1440 tối + 375 tối,
tài khoản demo TVV Phan Mai, việc "Báo PH · Report 1" của Trịnh Ngọc Ánh (`/cong-viec?nhom=bao-ph&viec=bao-ph:2`). Dịch chạy ở chế độ giả lập (`DICH_GIA=1`, nên bản dịch hiện "[VI] …").
Dữ liệu mẫu: vi phạm thứ hai được gán tên + mô tả tiếng Anh để có nút Dịch (DB demo cục bộ, không nằm trong PR).

| Ảnh | Nội dung |
|---|---|
| `truoc/bao-ph-1440.jpg`, `truoc/bao-ph-375.jpg` | Trước: mỗi vi phạm một dòng (ngày · chip môn · tên), không bấm được, không có mô tả, không dịch |
| `sau/bao-ph-*-dong.jpg` | Sau (đóng): cùng dòng, thêm mũi tên ▾ cuối tên báo bấm được |
| `sau/bao-ph-*-mo.jpg` | Sau (mở một dòng): ngay dưới dòng có "Vi phạm" · "Mô tả" (hoặc "Không có mô tả thêm"), mỗi chữ một nút **Dịch**; 375 xếp dọc nhãn trên giá trị |
| `sau/bao-ph-*-da-dich.jpg` | Sau (đã dịch): tên và mô tả đều thay bằng bản dịch + "Xem bản gốc" |

## Bảng thao tác TRƯỚC → SAU

| Ai · việc | Trước | Sau |
|---|---|---|
| TVV đọc vi phạm trong panel Báo PH | Chỉ thấy tên (mô tả không có ở panel) | Bấm tên vi phạm → mô tả mở ngay dưới dòng; bấm lại thu. Enter / Space; `aria-expanded` + `aria-controls` |
| Muốn đọc mô tả | Mở hồ sơ HV → Ý thức | Tại chỗ, **không request thêm** (mô tả đã nạp cùng panel, 0 câu thêm) |
| Dịch tên + mô tả vi phạm | Không có | Nút **Dịch** ở tên và ở mô tả (`ChuDich`, nguồn `violations.ten` / `violations.mo_ta`) |
| Dịch Ghi chú GVCN | Không có nút ở panel Báo PH | Nút **Dịch** (nguồn `discipline_measures.note`, chỉ khi ghi chú là của lần xử lý) |
| Khối "Yêu cầu xử lý" (`XacNhanXuLyPanel`) | Tên + mô tả luôn hiện | Cùng dòng chung, **mở sẵn** (`moSan`) + nút Dịch |
| Danh sách vi phạm chỉ đọc của lần xử lý (`XemXuLyPanel`) | `ngày · nhóm · tên` một dòng | Dòng chung; **nhóm chuyển vào phần mở** ("Nhóm"), thêm mô tả + Dịch |
| Chi tiết vi phạm mở từ dòng (`ChiTietViPham`: tab Ý thức lớp, hồ sơ HV, "Xem vi phạm mới") | Mô tả chữ thường | Cùng khối "Vi phạm · Mô tả" + Dịch (một kiểu mở) |

Không mất thao tác nào. Quyền / luật không đổi; máy chủ kiểm quyền dịch như xem hồ sơ em (STUDENT_VIEW).

## Giữ nguyên, ghi [XM]
- Dòng có ô tick (chọn vi phạm để xử lý: `dongVp` trong `XacNhanXuLyPanel`, "Sửa vi phạm" trong `XemXuLyPanel`): bấm cả dòng đang là chọn tick → không thêm mở tại chỗ.
  **[XM] hỏi PTA Plan:** có cần xem mô tả + Dịch ở các dòng chọn này không (đề xuất: nút ⓘ nhỏ cuối dòng).
- Tên HV (N55): khối mới không thêm tên HV nào cắt "…".

## Đo đọc
0 câu thêm cho `GET /y-thuc/bao-ph/:id` (thêm `id`, `moTa`, `xuLyId` vào dòng sẵn có; vẫn một câu SQL cho vi phạm). Bấm Dịch: một `POST /dich` mỗi chữ (bộ nhớ dịch dùng lại), như mọi nơi khác.

## Dòng rỗng (PTA Plan 21/11)
Dòng vi phạm KHÔNG bao giờ bị ẩn khỏi danh sách: tên rỗng → panel Báo PH lấy nhãn nhóm vi phạm (máy chủ), nơi khác hiện "Vi phạm". Trong phần mở: mô tả rỗng → "Không có mô tả thêm"; tên rỗng → chỉ bỏ nhãn phụ "Vi phạm" + nút Dịch của tên. Nút Dịch không vẽ cho chữ rỗng nên không bao giờ hiện "Không có chữ để dịch" (phép kiểm DICH-4d).
