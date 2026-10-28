# VIEW-CASE-LUOT — chip lượt của Case thành link ↗ trang lượt

Không có mockup riêng (thêm link theo mẫu sẵn có — CLAUDE.md "Đổi chữ, thêm nút/ô theo mẫu sẵn có: không cần mockup"). Ảnh cặp TRƯỚC (main) | SAU, DB demo cục bộ,
ngày demo 14/09, vai GVCN Trần Ngọc Hà (7):
`cap-ngan-case-thuong-1440-toi.png` (Ngăn Case lớp thường, Dương Ngọc Ánh · Case Reading) · `cap-ngan-case-thuong-375-sang.png` ·
`cap-ngan-case-ft-1440-toi.png` (Ngăn Case FT, Phạm Bảo Ngọc · Case Listening MT3) · `cap-khoi-case-ho-so-hv-1440-toi.png` (hồ sơ HV, cột Case & phương án).

## Làm gì
- Máy chủ: `caseDetail` + thẻ bảng kỹ năng (`caseCardOf`) trả `luot` = lượt Case đang gắn (`sos_cases.attempt_id`): id · loại · lớp · nhãn ("MT3" / "Progress Test" / "Checkpoint 2").
- `TenCase` nhận `luot` + `kn` (chủ đề Case): chip lượt là **link ↗** tới trang lượt qua `duongDotTest` (FT `/mock-test/:id`, lớp thường `/luot-test/:id`, `?kn=` mở đúng môn).
  Case lớp thường trước chỉ có chữ "[Progress Test] R không đạt [SOS 3]" → nay chip "Progress Test ↗" + "R không đạt [SOS 3]" (bỏ tiền tố trùng).
- Chỉ truyền `luot` ở nơi tên Case KHÔNG nằm trong nút: thân Case (`ThanCase` — Ngăn Case, panel Case, cột Case & PA hồ sơ HV) và khối Case (`KhoiCase`). Danh sách khác
  (tên Case là nút mở Case) giữ chip thường — không lồng link trong nút.
- Đang đứng ở chính trang lượt đó (khối Case của trang lượt) → chip thường, không link về chính nó.
- 375: vùng bấm 44 px bằng `after` (như ⋯ `MenuDong`), chip giữ cỡ trong dòng tên. `aria-label` "Mở lượt {x}", "↗" `aria-hidden`.

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Từ Case muốn xem lượt sinh ra Case: đóng Ngăn Case → tìm lượt ở bảng Test / Hành trình | Bấm chip "MT3 ↗" / "Progress Test ↗" ở đầu khối Case → trang lượt, dòng môn của Case mở sẵn |
| Back trình duyệt | Về đúng hồ sơ em, Ngăn Case vẫn mở (`?case=`) — đã thử |
| Mọi nút làm việc của Case (Xác nhận, Thêm PA, Kết quả, Sửa…) | Giữ nguyên — link ↗ tách khỏi nút làm việc |

Không bỏ thao tác nào.

## Kiểm
- Phép kiểm `VIEW-CASE-LUOT` (trong `prHslLt.tests.ts`): `luot` của Case thường / FT ở `caseDetail` và thẻ bảng kỹ năng; `TenCase` dựng đường bằng `duongDotTest`; hai nơi truyền `luot`.
- Thử tay: bấm chip ở Ngăn Case → `/luot-test/30?kn=reading` (dòng Reading mở) → Back → `/hoc-vien/11?case=14` (Ngăn Case mở); trang lượt không còn link về chính nó.
