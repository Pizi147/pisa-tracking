# GD-16 — Lưu trữ (mockup v21 ⑩) · khớp / khác

Plan `12-plan-giao-dien-dot-3.md` dòng GD-16 · mockup `thiet-ke/v21/luu-tru.html` L1–L6 (lời 37: chia chi nhánh, học viên theo lớp cuối, lớp số to lên đầu).
Seed 14/09, tài khoản Quản trị 1 (mọi chi nhánh; tên bịa của bộ demo). Phông Be Vietnam Pro đã nạp.

## Ảnh

| Ảnh | Khung | Nội dung |
|---|---|---|
| `cap-l1-1440-toi.png` | L1 | tab Lớp đã kết thúc: dải chi nhánh · dải Fast Track / Lớp thường trong bảng · Tổng kết · Mở lại |
| `cap-l2-1440-toi.png` | L2 | tab Học viên đã lưu trữ: dải chi nhánh (Monbay, Uông Bí) → dải lớp cuối (mã lớp là link · n em) · bảng cùng dáng lớp |
| `cap-l3-1440-toi.png` | L3 | Chọn nhiều học viên bật |
| `cap-l4-1440-toi.png` | L4 | tab Đã xoá (seed không có học viên đã xoá → câu rỗng; số tab 0 không vẽ — [XM-L4]) |
| `cap-l6-375-sang.png` | L6 | 375 sáng: bảng → thẻ, dải chi nhánh ngoài thẻ, dải lớp trong thẻ |

## 1. Truy vết

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | L1 đầu trang: ‹ Học viên & Lớp · "Lưu trữ" · ô chi nhánh · ô tìm bên phải · 3 tab badge mờ | `LuuTruPage` một hàng; `BranchFilter` chung (tự ẩn khi một chi nhánh); `HangTab` ba tab | l1 | KHỚP |
| 2 | L1 chia chi nhánh "tên · n lớp", bỏ cột Chi nhánh; trong chi nhánh dải Fast Track · Lớp thường; số to lên đầu | `theoChiNhanh` (dải theo id chi nhánh, trong dải GIỮ thứ tự máy chủ `soSanhLopLuuTru`) + hàng dải `hang-nhom-lop` | l1 | KHỚP |
| 3 | L1 nút Tổng kết · Mở lại, chỗ nút cố định để cột thẳng | `nutLop` (ô giữ chỗ khi không có Mở lại) | l1 | KHỚP |
| 4 | L2 thẻ từng em → bảng cùng dáng lớp; dải chi nhánh → dải lớp cuối (link · n em); "Chưa học lớp nào" cuối chi nhánh; trong lớp theo tên | `hangHv` nhóm theo `lopCuoiId` (máy chủ thêm `lopCuoiId`, `branchId`; em chưa học lớp nào lấy chi nhánh hồ sơ) | l2 | KHỚP |
| 5 | L2 cột Học viên · Trạng thái (chữ + chấm) · Lộ trình · Từ ngày · nút; Tổng kết mờ + "chưa có khoá học" cho em chưa học lớp nào | `COT_HV`, `ttHv` (`Nhan`), `nutHv` | l2 | KHỚP (bỏ mã HV — KHÁC theo luật) |
| 6 | L2 "n học viên" + "Chọn nhiều học viên" ở đầu danh sách; Quay lại học nút chính cho em Tạm dừng | đầu danh sách | l2 | KHỚP |
| 7 | L3 chọn nhiều qua mọi chi nhánh, thanh dính đáy, dòng kết quả trên thanh | `useChonNhieu` + `ThanhChonNhieu` (giữ) — ô tick trong cột Học viên mọi bảng | l3 | KHỚP |
| 8 | L4 "Đã xoá" là tab thứ ba có số; đầu "n em khôi phục được · ⓘ" (câu 30 ngày vào ⓘ); dải chi nhánh; cột Học viên · Lớp lúc xoá · Người xoá · Lúc xoá · Giữ đến · Khôi phục; đã khôi phục / xoá hẳn chữ mờ + câu thay nút | `DaXoaAdmin loai="hoc_vien"` (`/thung-rac?loai=`), số tab `/thung-rac/dem`, `NutLuat`; máy chủ thêm chi nhánh + lớp (cùng câu) | l4 | KHỚP |
| 9 | L5 rỗng / tìm không khớp / đang tải / lỗi; QL một chi nhánh không ô Xem | `Empty`, `Skeleton`, `ErrorState`, `BranchFilter` tự ẩn | — | KHỚP |
| 10 | L6 375: một cột, bảng → thẻ, nút cao 44, dải lớp trong thẻ | `theRieng` (thẻ), `max-sm:min-h-[44px]` | l6 | KHỚP |

**KHỚP 10 / 10 = 100 %.**

## 2. KHÁC / [XM]
- **KHÁC theo luật đã chốt:** mã học viên dưới tên (mockup L2, L4) KHÔNG in — OV-13f (Q8) "không màn nào in mã học viên" (phép kiểm `prHk2` C24).
- **KHÁC:** ô "Xem [Mọi chi nhánh]" → ô chi nhánh chung D3 (`OChiNhanh`, nhãn "Chi nhánh" trong ô) — một mẫu mọi trang.
- **[XM-L4]** mockup "Tab Đã xoá rỗng vẫn hiện, số 0"; `HangTab` chung không vẽ badge 0 (lời 40) — giữ theo thành phần chung, hỏi PTA.
- Câu ⓘ dùng câu sẵn "Giữ 30 ngày, sau đó xoá hẳn." (mockup thêm "Khôi phục trả em về đúng lớp, hồ sơ, điểm như trước khi xoá.").

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Tìm · chọn chi nhánh · đổi tab | có | giữ |
| Lớp: Tổng kết · Mở lại (panel, Hoàn tác) | có | giữ |
| Học viên: Tổng kết · Sửa thông tin · Quay lại học (Hoàn tác) · Chọn nhiều + Quay lại học · n em · Xử lý tiếp / Thử lại | có | giữ |
| Đã xoá: Khôi phục | khối dưới tab Học viên | tab thứ ba (+ số), cùng nút |
| Mở hồ sơ lớp từ lớp cuối của em | không | mã lớp ở dải là link |

Không thao tác nào bị mất.

## 4. Lời 40 · Đo ✕ / ⋯
Dải chi nhánh / dải nhóm rỗng không vẽ; Đã xoá rỗng → một câu. Màn không có ✕ / ⋯ (✕ chỉ ở dòng kết quả chọn nhiều — giữ `ThanhChonNhieu` cũ).

## 5. Hướng dẫn "?"
`admin.ts`, `gv.ts`, `ql.ts` mục Lưu trữ: "Ba tab … · Đã xoá; chia theo chi nhánh, học viên theo lớp cuối" (GV: theo lớp cuối); khoá dịch `shared/i18n/en/gd16LuuTru.ts`.

## 6. Turso
+1 câu khi mở trang: `GET /thung-rac/dem?loai=hoc_vien` (một SELECT `thung_rac` 31 ngày, chỉ loại học viên — vài dòng). Danh sách Đã xoá (`/thung-rac?loai=hoc_vien`) chỉ khi bấm tab. `/hoc-vien-lop/luu-tru`: không thêm câu (chi nhánh của em và mã lớp cuối lấy trong câu cũ). Hai đường mới có trong `tocDoDuong.ts`.
