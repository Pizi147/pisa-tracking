# SUA-HVL-0611 — Phân công GV (nút dòng + hộp Lưu) · danh sách HV & Lớp (bỏ TVV, dải dàn ngang)

Sửa lỗi / khớp mockup đã duyệt, KHÔNG đổi bố cục mới. Chủ SP 06/11 ý (1) và (5) (`plan.md`).
Mockup: `thiet-ke/v9/phan-cong-gv.html` (k3, k5) · `thiet-ke/v11/hoc-vien-lop.html` (khu a). Dữ liệu web: bộ demo, QL Nguyễn Khánh Vy, ngày demo 14/09/2026.

## Gốc lỗi (đã đo)
- **Nút bị cắt:** cột nút dòng 120 px (trong ô còn 112 px) mà "Huỷ sửa" + "Lưu" cần 121 px → `justify-content: flex-end` đẩy tràn TRÁI, đè ô GVCN. Mockup vẽ chữ **"Huỷ"** (ngắn hơn).
- **Hộp Lưu đứng yên, không bấm được:** `NoiNeo` đặt `position: absolute` trong `body` theo `scrollY`, nhưng vùng cuộn của trang là `<main id="noi-dung">` (không phải window) → hộp không theo cuộn, đáy hộp vượt màn mà `body` không cuộn được → không tới được "Hiệu lực", "Đổi người", nút chân.
- **Khối điểm mở rộng hẹp:** mockup v11 `.dai` cũng `flex-wrap` xếp trái (3 khối ~ 920 / 1353 px) — web chép đúng mockup nên nửa phải trống. Chủ SP muốn dàn đều → theo lời chủ SP (lời mới thắng mockup cùng điều).

## Ảnh cặp (mockup | web)
| Chỗ sửa | Tệp |
|---|---|
| Hộp Lưu ở dòng thấp · 1440 tối (hộp trọn trong màn, ✕ + nút chân) | `cap-1-phan-cong-luu-1440-toi.png` |
| Dòng nháp, "Huỷ" + "Lưu" trọn trong cột · 1440 tối / 1280 tối | `cap-2-phan-cong-nut-1440-toi.png` · `cap-2-phan-cong-nut-1280-toi.png` |
| Hộp Lưu tấm dưới · 375 sáng | `cap-3-phan-cong-luu-375-sang.png` |
| Danh sách em, dải dưới hàng · 1440 tối | `cap-4-ds-dai-1440-toi.png` |
| Danh sách em, dải dưới hàng · 375 sáng | `cap-5-ds-dai-375-sang.png` |

Đo trên bản chạy: nút trọn trong cột nút 140 px, không đè ô GVCN (trước: tràn trái 18 px); hộp Lưu `position: fixed`, đáy ≤ `innerHeight − 8` ở cao 900 / 520 / 300 (300: thân cuộn trong 157 px, đầu + chân ghim); dải 3 cột đều `424 / 424 / 424` trên `1353` px (trước: `304 / 78 / 380` xếp trái).

## Truy vết khung → thành phần
| # | Mockup | Web | Kết quả |
|---|---|---|---|
| 1 | k3/k5: nút dòng "Huỷ" + "Lưu" cuối dòng nháp, cột nút 120 | giữ chữ "Huỷ sửa" (phép kiểm `prS3Chu` cấm nút thoát hộp ghi "Huỷ" trần); cột nút 120 → **140 px**, nút sát nhau (gap 4), không xuống dòng / không co | KHÁC có lý do — chữ dài hơn mockup nên cột rộng hơn 20 px |
| 2 | k5 1440: hộp Lưu neo dưới nút Lưu, hiệu lực · đổi người · tải · quyền xem · chân | `NoiNeo` fixed theo nút lúc mở, dịch lên khi tràn đáy | KHỚP — khác mockup chỗ: dòng thấp thì hộp lùi lên che các dòng dưới (mockup vẽ dòng cao, đủ chỗ) |
| 3 | k5: hộp không có ✕ | thêm ✕ ở đầu hộp (Lưu = "Quay lại sửa", giữ nháp; Chờ đổi = đóng) | KHÁC — chủ SP/PTA yêu cầu "Esc / ✕ đóng"; Esc vẫn là đường chính |
| 4 | k5 375: tấm dưới nền che | giữ; thêm ✕ 44 px, đầu + chân ghim, thân cuộn | KHỚP |
| 5 | v11 a: dải dưới hàng 3 khối (MT · Hỗ trợ · Việc của tôi) | `.hvl-dai` lưới `auto-fit minmax(320px, 1fr)`: các khối chia đều hết bề ngang; hẹp thì xuống dòng; 375 một cột | KHÁC có lý do — mockup xếp trái; chủ SP 06/11 "dàn đều ra cả trang" |
| 6 | v11 a: dòng "TVV {tên}" dưới tên em | bỏ (bảng 1440 và thẻ 375); "Tạm dừng" giữ | KHÁC có lý do — chủ SP 06/11 "không cần tên TVV ở dưới" |
| 7 | Mọi phần khác của hai màn (màu, cỡ chữ, khoảng cách, ô điểm, việc) | không đổi | KHỚP |

7 dòng: 3 KHỚP · 4 KHÁC có lý do (chữ nút theo phép kiểm; ✕; dàn đều + bỏ TVV theo lời chủ SP 06/11) — hình ảnh còn lại khớp mockup (màu, cỡ chữ, khoảng cách, phân cấp không đổi).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Huỷ nháp một dòng | nút "Huỷ sửa" đè ô GVCN | nút "Huỷ" trong cột nút, `aria-label` vẫn "Huỷ sửa {lớp}" |
| Lưu một dòng → hộp Lưu | hộp ngoài màn khi dòng thấp, không cuộn / không bấm được | hộp trong màn, thân cuộn bên trong, nút chân luôn thấy |
| Đóng hộp Lưu | Esc / bấm ra ngoài / "Quay lại sửa" | giữ cả ba + ✕ (cùng việc "Quay lại sửa", giữ nháp) |
| Danh sách chọn GV (ô ▾), hộp Chờ đổi | cùng `NoiNeo` (cùng lỗi) | cùng sửa: trong màn, ✕ ở hộp Chờ đổi |
| Bấm ô điểm → dải dưới hàng em | khối xếp trái, nửa phải trống | dàn đều hết bề ngang, nội dung / thao tác y nguyên |
| Xem TVV của em | dòng "TVV {tên}" dưới tên em (bảng, thẻ 375) | bỏ; TVV vẫn ở hồ sơ em, panel một em, tìm kiếm, tab Lịch thi |

Không mất thao tác nào. Không thêm request (Turso). Không đụng tab Lịch thi, dòng việc / "Bổ sung hồ sơ thiếu".
Ghi nhận (có từ trước, không làm xấu thêm đáng kể): ở 1280 tên GV dài trong ô môn cắt "…" (vd "Phạm Thu Tra…", có `title` đủ tên); 1440 đủ tên. Nếu chủ SP muốn đủ tên ở 1280 → PR riêng (thu cột Lớp 200 hoặc cho ô xuống dòng).
Việc để sau [XM]: hộp Lưu 375 — hàng "Từ tuần [W4 SEP]" xuống hai dòng (ô chọn tuần rộng hết dòng) còn mockup một dòng; có từ trước, ngoài ý chủ SP.
