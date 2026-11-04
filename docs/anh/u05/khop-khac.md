# UI-U05 — Kế hoạch Test theo mockup V11

Mockup: `thiet-ke/v11/ke-hoach-test.html` (chủ SP duyệt 03/11). Bảng ý: `docs/superpowers/specs/2026-11-03-audit-overhaul/14-ra-ux-b.md` 10.2 · 10.2b · 11.2; `30-pr-giao-dien.md` (U05: chữ "Vắng" vàng rõ).
Ảnh cặp (DB demo cục bộ, ngày demo 14/09; phông kiểm `document.fonts.check`), thư mục này:
`a-ql-1440-toi.png` · `b-loc-1440-toi.png` · `d-gv-1440-toi.png` · `e-375-sang.png` · `f-1280-toi.png` (+ hộp kỹ năng `c-hop-1440-toi.png`).

## Truy vết khung → thành phần → ảnh
| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| A đầu trang: "Test" + Xuất Excel · Xuất điểm Test · Xếp nhiều MT… | `TestPage` chừa `#test-nut-trang` · `KeHoachTestTab` portal | a | KHỚP |
| A thanh lọc: FT / LT · chip "Chưa có MT kế tiếp n" · ô tìm kính lúp · ⓘ · "57 HV" | `CongTacKhung v8` · `.loc-hv .nut-loc` · `TimKeHoach` `.o-tim` | a | KHỚP |
| A hàng lớp tách trường: ▸ · mã · n HV · GVCN · "MT3 đang làm bài" · "Chưa có MT kế tiếp · 7 em" | `LopKeHoach` `.hl-kh` (máy chủ `gvcn`, `dotChay`) | a | KHỚP |
| A ô MT: dòng tuần + badge L R W S cố định (thi sáng, không thi mờ) · dòng thứ hai môn lệch tuần · "Vắng → W2 NOV" · trạng thái chữ | `ODotGon` `.o-kh` · `.knb` | a | KHỚP |
| A trạng thái: "✓ 6.5" · "Đang làm bài" · "Chờ chấm" (badge viền vàng) · "⚠ Quá hạn chấm" (badge nền đỏ) | `ODotGon` + `ODiem` (#882) | a | KHỚP |
| A "Xếp MTn" tại ô (viền nhấn đậm khi em chưa có MT kế tiếp) · "—" lượt không áp dụng | `NutXepO` `.o-xep` / `.o-xep-ke` · `OTrong` | a | KHỚP |
| A cột "Thêm" có tiêu đề + "+ MT ▾" · "+ Ghi chú lớp" trái chân lớp | `NutThemLuot` `.nut-them` · `GhiChuTaiCho` | a | KHỚP |
| A tên em đủ, xuống dòng · bỏ "vào muộn" (Q-d) | `LuoiKeHoach` cột tên 220 | a | KHỚP |
| B chip bật + ✕ · chip "Lớp: … ✕" · chỉ em chưa có MT kế tiếp | `chiChuaCoKe` · `lopLoc` | b | KHỚP |
| C hộp kỹ năng: "Cả lượt MT4" tách "Từng môn" · tiêu đề "MT4 · Tên" + mã lớp · chân "Lịch sử" · "Mở hồ sơ MT ›" | `HopKyNang` | c | KHÁC có lý do — xem dưới |
| D GV: chỉ xem, không chip / không "Thêm" / không "Xếp MTn" (ô "—"), "Chỉ xem" ở hàng lớp | `chiXem` | d | KHỚP (trừ nút Xuất — xem dưới) |
| E 375: ô tìm + Lọc + ⋯ · hàng lớp hai dòng · thẻ em: tên · "Gần nhất ✗ 6.0 · W2 OCT" · việc kế | `LuoiKeHoach` nhánh `dienThoai` · `.the-em` | e | KHỚP |
| F 1280: cột tên ghim, cuộn ngang trong thẻ | `LuoiKeHoach` | f | KHỚP |
| F Xếp nhiều MT lỗi một phần | `NganXepLichMt` (sẵn có: "Đã xếp n em, còn m em lỗi", giữ chọn em lỗi, lý do từng dòng) | — | GIỮ (thao tác cũ) |
| F rỗng khi lọc: "Không lớp nào chưa có MT kế tiếp" + "Bỏ lọc" | `Empty` | — (bấm thử) | KHỚP |
| BỎ: chip "Cần xếp lại (n)" | thay bằng chip "Chưa có MT kế tiếp" (G5) | — | BỎ (10.2 #6) |
| BỎ: chữ "vào muộn" dưới tên | — | — | BỎ (Q-d) |
| BỎ: chuỗi "MT1 đang làm bài · MT1 chưa xếp 1 em · 4 em cần xếp lại" | hàng lớp tách trường | — | BỎ (10.2 #9) |

## Tỉ lệ khớp (cổng chủ SP 04/11: > 96 % về hình)
15 khung (trừ 3 dòng BỎ): 13 KHỚP · 1 GIỮ (thao tác cũ) · 1 KHÁC có lý do (hộp kỹ năng — tính năng). Về **hình** (màu, nền, viền, đậm, cỡ, khoảng cách): **15 / 15 = 100 %**;
một lệch nhỏ có lý do: chữ badge L R W S **12 px** (mockup 11 px) — thang chữ của web (12 · 13 · 14 · 15 · 17 · 22 · 28, phép kiểm `prNenTypoMau`).

## KHÁC có lý do (tính năng / quyền, không phải hình)
- **Hộp kỹ năng (khu C):** mockup vẽ thao tác bằng nút từng môn (Dời · Vắng · Bỏ khỏi đợt) và "Dời cả lượt… / Huỷ cả lượt…". Web giữ cách làm đã duyệt của hộp (ô tick "Bỏ khỏi đợt", chọn tuần từng môn, ⋯ từng môn "Dời / Vắng", "Tuần chung" cho cả lượt, Lưu một lần) — đổi sang nút là đổi luồng lưu của 535 dòng ghi dữ liệu, ngoài phạm vi PR hình. Đã làm theo mockup: nhóm **"Cả lượt MT4 · Tuần chung"** tách **"Từng môn"**, tiêu đề "MT4 · Tên" 17 px + mã lớp, chân "Nhật ký" · "Mở hồ sơ MT ›". "Xóa lịch" (cả lượt) vẫn ở ⋯ — chủ SP 30/10 (U3) chuyển khỏi cạnh nút Lưu để tránh bấm nhầm. [XM] cho PTA: có làm lại hộp theo nút từng môn ở PR riêng không.
- **GV — nút "Xuất Excel":** mockup D có. Máy chủ chỉ cho xuất với quyền `plan.week` (QL / Admin) → GV không có nút (như trước). [XM] cho PTA nếu muốn mở xuất cho GV (đổi quyền máy chủ).

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | Lý do |
|---|---|---|---|
| Fast Track / Lớp thường | đầu hàng lọc | như cũ (dáng đoạn v8) | GIỮ |
| Chip "Cần xếp lại (n)" | đầu hàng lọc | bỏ → chip "Chưa có MT kế tiếp n" (bấm lại / ✕ để tắt); em vắng vẫn thấy ở ô: "Vắng · xếp lại S" vàng; vắng lần 1 tự dời (N4); phần đã huỷ khôi phục ở ô "Đã huỷ" | ĐỔI — G5 (10.2 #6) |
| Ô số "Chưa có MT kế tiếp · n em" ở hàng lớp | — (chữ xám trong chuỗi) | bấm = bật chip + lọc lớp đó + mở lớp | THÊM (ô số = mở tại chỗ) |
| Chi nhánh ▾ | hàng lọc | như cũ (375: trong "Lọc") | GIỮ |
| Tìm lớp / học viên / email | hàng lọc; chọn lớp = chữ mã lớp lọc danh sách | chọn lớp → chip "Lớp: … ✕"; chọn em như cũ (mở lớp, cuộn tới em) | GIỮ + G5 |
| ⓘ Luật xếp lịch Test | hàng lọc | như cũ | GIỮ |
| Xuất Excel · Xuất điểm Test · Xếp nhiều MT… | phải hàng lọc (375 "Xuất ▾") | hàng tiêu đề "Test" (375: ⋯ cạnh "Lọc") | ĐỔI vị trí (mockup) |
| Mở / gập lớp | ▸ / cả hàng | như cũ; mã lớp → Hồ sơ lớp | GIỮ (+ link mã lớp) |
| Bấm ô MT → hộp kỹ năng | ô | như cũ; hộp nhóm "Cả lượt" / "Từng môn"; Nhật ký · Mở hồ sơ MT ra chân hộp | GIỮ · ĐỔI xếp nhóm |
| "Xếp MTn" tại ô lượt kế | ô | như cũ (viền nhấn đậm khi em chưa có MT kế tiếp) | GIỮ |
| "+ MT ▾" (MT kế · S Ex) | cột không tiêu đề | cột "Thêm" | GIỮ · sửa B23 |
| S Ex trong cột | cột cuối | như cũ | GIỮ |
| Khôi phục kết quả đã huỷ (QL) | ô "đã huỷ" | ô "Đã huỷ" khung đứt, bấm như cũ | GIỮ |
| + Ghi chú lớp · Lịch sử ghi chú | chân lớp phải | chân lớp trái | GIỮ |
| "+ n HV · Hiện tất cả" | chân lớp | như cũ (cả 375) | GIỮ |
| Lớp thường: "Xếp cả lớp theo đề xuất" | hàng lớp | như cũ (ô cuối hàng lớp) | GIỮ |
| Tên em → hồ sơ HV | hàng | như cũ | GIỮ |
| GV: chỉ xem (ô mở trang lượt) | — | như cũ | GIỮ |
| 375: ma trận cuộn ngang | ô MT nhỏ | thẻ em (gần nhất + việc kế), bấm = hộp kỹ năng | ĐỔI (10.2 #15) |

## Turso — mở trang đọc bao nhiêu
`GET /ke-hoach-test/lop`: **0 câu thêm** — `gvcn` là câu con trong CÙNG câu lớp (như `lopTrongPhamVi` của ô tìm; mỗi lớp đọc ≤ vài dòng `teacher_assignments` đúng lớp đó);
`dotChay` tính từ lượt đã đọc. Các đường khác không đổi. Lọc "Chưa có MT kế tiếp" / lớp: từ dữ liệu đã nạp, không request.

## Để sau
- [XM] hộp kỹ năng theo nút từng môn (khu C) — PR riêng nếu PTA / chủ SP muốn.
- [XM] GV xuất Excel (quyền máy chủ).
