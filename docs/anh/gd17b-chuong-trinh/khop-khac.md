# GD-17b — Quản trị › Chương trình sửa tại ô (mockup v21 ⑩ K2)

Plan `12-plan-giao-dien-dot-3.md` dòng GD-17 (mỗi tab có đổi một PR nhỏ): PR này chỉ tab **Chương trình**. Phần chung (nhật ký, panel QL, dải chỉ xem) ở #1673 (17a).
Mockup `thiet-ke/v21/quan-tri.html` K2 + `quan-tri-ghi-chu.md` ([XM-3], [XM-4]). Seed 14/09, Quản trị (1). Phông Be Vietnam Pro đã nạp.

## Ảnh

| Ảnh | Khung | Nội dung |
|---|---|---|
| `cap-k2-1440-toi.png` | K2 | bảng: ô có viền Tên · Môn · Đạt từ · Độ dài · Mốc Test, cột Còn dùng (công tắc); hộp Mốc Test FOU mở dưới ô với câu hậu quả |
| `web-k2-375-sang.png` | — | 375 sáng: thẻ mỗi chương trình, cùng ô + công tắc (mockup không vẽ K2 ở 375) |

## 1. Truy vết

| # | Khung | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Bỏ panel Sửa 720: mỗi giá trị là ô có viền, bấm là sửa tại ô (mẫu OSuaTaiCho của Chi nhánh) — Tên · Môn · Đạt từ · Độ dài · Mốc Test | `OCt` → `SuaTaiDong vien` (hộp neo; điện thoại panel toàn màn), một trường `TruongCt`; lưu gửi đủ dòng (`yeuCauLuu`) | KHỚP |
| 2 | Thêm cột Môn (‹ đưa lên, × bỏ, + Môn) và Đạt từ; Cách chấm thành chữ mờ dưới tên | cột Môn / Đạt từ; `+ Môn` là ô chọn thường A6 | KHỚP |
| 3 | Ô khoá (Môn FT / Pre FOU, Độ dài FT / liên tục, Đạt từ FT) = chữ mờ không viền | `khoa(...)` (title lý do khoá Môn) | KHỚP |
| 4 | Hộp mốc nói hậu quả ngay trên nút Lưu: "Áp cho lớp mở sau · n lớp đang chạy giữ lịch cũ" | `SuaTaiDong phu` (Mốc Test, Độ dài) | KHỚP |
| 5 | Đổi Môn khi có lớp đang học → máy chủ hỏi như nay (hộp xác nhận chung) | `api.put` đi qua hộp xác nhận chung (không đổi) | KHỚP |
| 6 | "Còn dùng" (ô tick trong panel) → công tắc cùng dáng Quyền, tại dòng + Hoàn tác | `CongTacConDung` (`role="switch"`, toast Hoàn tác = gửi lại trạng thái cũ) | KHỚP |
| 7 | "+ Chương trình" GIỮ panel ([XM-3]) | `ThemChuongTrinh` (KhungPanel, đủ trường) | KHỚP |
| 8 | Nhật ký cột phải | `NhatKyMuc` (dáng mới ở 17a) | KHỚP |

**KHỚP 8 / 8 = 100 %.**

Bấm thử (DB seed cục bộ): Đạt từ BE 70 → 65 · Lưu → máy chủ 65 → Hoàn tác → 70. Công tắc Còn dùng FT · KHAC: tắt → bật → Hoàn tác → tắt.

## 2. GIỮ / ghi chú
- Luật kiểm lỗi dưới ô + lỗi máy chủ `details.o` giữ nguyên (gom vào `useFormCt`, dùng chung panel và ô).
- Hộp Mốc Test lặp chữ "Mốc Test" (đầu hộp + nhãn trường) — giữ nhãn trường để trình đọc màn đọc đúng ô.
- Chương trình Quản trị tạo chưa có lớp (KET seed): Độ dài là ô (đổi Số tuần ↔ Liên tục như lúc tạo — OV-11b), mockup vẽ chữ mờ cho chương trình gốc.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Sửa Tên / Môn (thứ tự, bỏ, thêm) / Đạt từ / Độ dài / Mốc Test | nút Sửa → panel 720 | bấm thẳng ô → hộp neo dưới ô |
| Còn dùng / Ngừng dùng | ô tick trong panel | công tắc tại dòng + Hoàn tác |
| + Chương trình | panel | panel (giữ) |
| Xác nhận khi đổi Môn có lớp đang học | hộp xác nhận | giữ |
| QL xem | bảng chỉ đọc | bảng chỉ đọc (chữ thường, không ô / công tắc) |

Không thao tác nào bị mất; chỉ đổi đường tới (bấm thẳng ô thay nút Sửa).

## 4. Hướng dẫn "?"
`qt.ts` (Chương trình): "bấm thẳng ô … để sửa tại chỗ; công tắc Còn dùng (có Hoàn tác) · + Chương trình: tạo mới trong panel"; khoá dịch `shared/i18n/en/gd17bChuongTrinh.ts`.

## 5. Turso — 0
Cột Môn, Đạt từ, Còn dùng có sẵn trong `/admin/programmes`, `/admin/routes`. Lưu một ô = một PUT như panel cũ.

## Sửa sau rà (PTA 14/11)
- Ảnh chụp lại bằng tài khoản Quản trị demo tên giả; nhánh gộp một commit, không còn ảnh cũ trong lịch sử.
- Hộp Mốc Test không đè cột Nhật ký: `HopNeo` giữ hộp trong thẻ chứa ô (gặp mép phải thẻ thì dịch vào trong; thẻ hẹp hơn hộp thì theo màn). Đo: hộp 516–1076, thẻ bảng 20–1084 (dòng đầu và dòng cuối). Áp cho mọi nơi dùng `HopNeo`.
- Cột Nhật ký trong ảnh hiện chữ người đọc ("Đạt từ: 65 % → 70 %", "Còn dùng: Có") — phần này nằm ở #1673 (hàm dựng chung), ảnh chụp có ghép bản sửa đó; merge #1673 trước.
