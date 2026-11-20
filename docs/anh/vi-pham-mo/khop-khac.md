# VI-PHAM-MO — vi phạm bấm xem mô tả + dịch (chủ SP 21/11; PTA Plan chốt [XM] 21/11)

Không mockup mới: dùng lại dòng vi phạm, `ChuDich` (nút Dịch) và kiểu "bấm TÊN mở tại chỗ" đã có (plan.md 1.3b). Ảnh `truoc/` | `sau/`, 1440 + 375 tối, tài khoản demo.
Dịch chạy giả lập (`DICH_GIA=1`): bản dịch hiện "[VI] …". Dữ liệu mẫu (tên / mô tả tiếng Anh để có nút Dịch) nằm ở DB demo cục bộ, không trong PR.

## Ảnh
| Màn | Trước | Sau |
|---|---|---|
| Panel Báo PH (TVV Phan Mai, Trịnh Ngọc Ánh) | `truoc/bao-ph-1440.jpg`, `truoc/bao-ph-375.jpg` | `sau/bao-ph-{1440,375}-{dong,mo,da-dich}.jpg` |
| Xác nhận xử lý — dòng có ô tick (Head Nguyễn Khánh Vy, Lê Quang Huy) | `truoc/chon-1440.jpg`, `truoc/chon-375.jpg` | `sau/chon-1440-{dong,mo,da-dich}.jpg`, `sau/chon-375-{mo,da-dich,dong-ten-da-dich}.jpg` |
| Tab Ý thức lớp MB FT 101 — chi tiết vi phạm mở từ dòng (Head Khánh Vy, Lê Quang Huy · "Late to class") | `truoc/lop-1440.jpg` | `sau/lop-1440-{mo,da-dich}.jpg` (đã dịch: tên ở dòng cha + mô tả; Sửa / Xoá còn nguyên) |

Đóng: mỗi dòng thêm mũi tên ▾ cuối tên. Mở: ngay dưới dòng có "Mô tả" (hoặc "Không có mô tả thêm") + MỘT nút **Dịch**. Đã dịch: chữ TÊN ở dòng đổi sang bản dịch, mô tả đổi sang bản dịch, nút thành "Xem bản gốc" (`chon-375-dong-ten-da-dich` = đã dịch rồi thu lại — tên vẫn là bản dịch).
Ảnh 1440 chụp ở khung pane 800 px rộng.

## Bảng thao tác TRƯỚC → SAU
| Ai · việc | Trước | Sau |
|---|---|---|
| TVV đọc vi phạm trong panel Báo PH | Chỉ tên (không có mô tả ở panel) | Bấm TÊN → mô tả mở ngay dưới dòng, bấm lại thu. Enter / Space; `aria-expanded` (+ `aria-controls` khi mở). 0 request thêm |
| Dịch tên + mô tả vi phạm | Không có | MỘT nút **Dịch** trong phần mở dịch cả tên (thay chữ tên ở dòng) lẫn mô tả (`useDichGop` dùng chung bộ nhớ / băm / `/dich` của `ChuDich`) |
| Dịch Ghi chú GVCN (panel Báo PH) | Không có nút | Nút Dịch (`discipline_measures.note`, chỉ khi ghi chú là của lần xử lý) |
| Xác nhận xử lý / Sửa vi phạm — dòng có ô tick | Cả dòng là nhãn của ô tick; không xem được mô tả | Ô tick CHỈ chọn (vùng chạm 40 px); bấm TÊN mở mô tả + Dịch — cùng kiểu mở. Dòng phụ "nhóm · người ghi" và nhãn "Cần xử lý" giữ nguyên |
| Khối "Yêu cầu xử lý" (`XacNhanXuLyPanel`) | Tên + mô tả luôn hiện | Cùng dòng chung, mở sẵn (`moSan`) + Dịch |
| Danh sách vi phạm chỉ đọc của lần xử lý (`XemXuLyPanel`) | `ngày · nhóm · tên` một dòng | Dòng chung; nhóm vi phạm vào phần mở ("Nhóm"), thêm mô tả + Dịch |
| Chi tiết vi phạm mở từ dòng (`ChiTietViPham`: tab Ý thức lớp, hồ sơ HV, "Xem vi phạm mới") | Mô tả chữ thường, không dịch | MỘT nút Dịch ở phần mở dịch cả mô tả lẫn TÊN: chữ tên ở dòng cha (`TenDich` trong `BangLan` / `PanelXemViPham`, cả hộp rê) đọc cùng bộ nhớ nên đổi theo nút. Sửa / Xoá / Bằng chứng / Lần xử lý giữ nguyên |

Không mất thao tác nào. Quyền / luật không đổi; máy chủ kiểm quyền dịch như xem hồ sơ em (STUDENT_VIEW).

## Dòng rỗng
Dòng vi phạm không bao giờ bị ẩn: tên rỗng → nhãn nhóm (Báo PH, máy chủ) / "Vi phạm" (nơi khác). Mô tả rỗng → "Không có mô tả thêm". Nút Dịch bỏ qua chữ rỗng (`useDichGop` không gọi máy chủ) nên không hiện "Không có chữ để dịch" (DICH-4d).

## Rà (21/11)
- `/ponytail-review`: bỏ `MoTaViPham` (một nơi gọi) — đã gộp vào `ChiTietViPham`. Giữ: `useDichGop` lặp một phần logic `ChuDich`; gộp (`ChuDich` = `useDichGop` một mục) cần đổi phép kiểm tĩnh DICH-13 → để PR sau. net −12 dòng (đã áp dụng).
- web-design-guidelines (Vercel): nút thật cho mọi hành động; `aria-expanded` + `aria-controls` chỉ khi mở; `aria-live="polite"` ở nút Dịch; mũi tên `aria-hidden`; ô tick có nhãn `aria-label` và vùng chạm 40 px (375: dòng ≥ 44 px); không `outline-none`; chữ có `break-words` / `min-w-0`; rỗng xử lý êm. ✓ pass.
- impeccable `audit` (a11y / hiệu năng / theme / responsive) + `detect` trên `DongViPham.tsx`, `ChiTietViPham.tsx`, `ChuDich.tsx`: 0 phát hiện; màu dùng token (`--accent`, slate); 375 xếp dọc, không cuộn ngang. Điểm yếu đã sửa: khối mô tả bị ép vào cột tên ở 375 (nay chiếm cả chiều rộng), ô tick lệch dòng ở 375 (`max-sm:pt-6`).

## Đo đọc
0 câu thêm cho `GET /y-thuc/bao-ph/:id`. Bấm Dịch: một `POST /dich` mỗi chữ chưa có bản dịch (bộ nhớ dịch dùng lại).

## Cách dịch tên ở dòng cha
`useDichGop` giữ "đang xem bản dịch" ở một kho dùng chung theo khoá chữ (`xemChung` trong `ChuDich.tsx`); `TenDich` (dòng cha) đọc kho đó. Gấp phần mở lại thì tên vẫn là bản dịch; mở lại thì nút hiện "Xem bản gốc" (khớp). Chữ rỗng / không dịch được không vào kho, không gọi máy chủ.

## Còn lại
`useDichGop` lặp một phần logic `ChuDich`; gộp (`ChuDich` = `useDichGop` một mục) cần đổi phép kiểm tĩnh DICH-13 — PR sau.
