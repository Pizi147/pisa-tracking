# CASE-PA-UI b — mọi nơi còn lại của tuyến Case – PA – Kết quả (ghi chú v16 mục 8)

PR a (#1054, đã merge) làm thành phần chung + panel Case (`NganCase` → `ThanCase`). Nơi nào mở `NganCase` đã theo v16 từ PR a. PR b đưa nốt các nơi
**không** qua panel đó về CÙNG panel. Ảnh cặp `docs/anh/case-pa-ui-b/<khung>__<nơi>-cap.png` — trái khung mockup v16 gần nhất, phải web (DB demo, 14/09; 1440 tối, 375 sáng).

## 1. Rà 11 nơi (ghi chú mục 8)

| Nơi | Trước PR b | Sau PR b | Ảnh |
|---|---|---|---|
| Panel Case — Công việc | v16 (PR a) | giữ | — |
| Hồ sơ HV · khối Case | v16 (PR a) | giữ | — |
| HV & Lớp · thẻ việc / panel một em (`PanelMotEm`) | Kết quả PA: ô **ghi nhanh** riêng trong khối (`GhiNhanh`); việc khác mở `NganCase` | Kết quả PA cũng mở **cùng panel Case** (thẻ PA đích, form Ghi kết quả trong thẻ) | như e1 |
| Hồ sơ lớp (`BangHoSoLop`, `BangDiemLopThuong`) | mở `NganCase` | v16 theo PR a | — |
| Test · lượt (`MockDetailPage`, `LuotThuongPage` → `CaseLuotKn`) | khối Case + PA kiểu cũ (`TheKyNang`: nhãn Case/PA, cây PA, nút việc) + form Thêm PA riêng | **cùng mẫu cột hồ sơ HV** (i1): dòng tóm tắt + cùng thân panel mở tại chỗ; "Còn lại › Thêm PA" mở thẻ "PA mới" | i1__luot |
| Công việc · tóm tắt việc người khác (`TomTatTheoDoi`) | "Mở Case ›" **đổi trang** sang hồ sơ em | "Mở Case ›" mở cùng panel **tại chỗ**, "‹ {việc}" về tóm tắt; Làm thay + dải vàng giữ | k3__tomtat |
| Công việc · việc Kết quả PA (`PanelKetQuaNhanh` + `GhiNhanh`) | panel ghi nhanh riêng (Tiến triển · Nhận xét), "Điều chỉnh / Kết thúc…" mới mở panel lớn | **cùng panel Case**, thẻ PA đích mở sẵn form Ghi kết quả đủ (Tiến triển · Nhận xét · Quyết định · Ngày ghi) — v16 e1 | e1__congviec · m5__congviec |
| Xác nhận PA, Sửa / Thêm PA, Đổi người, ⋯ | PR a | giữ | — |
| Chờ bạn duyệt, Phân tích (`LamDongSoLieu`), chuông | "Mở ›" → `NganCase` (có `paId`) | v16: thẻ đích mở sẵn + viền nhấn (PR a) | — |
| Bảng Case, bảng SOS | → `NganCase` / panel một em | v16 | — |
| Case Ý thức | — | [XM9] PR riêng (không ở đây) | — |

Chữ cũ còn nhắc "⋯" (đã bỏ ở PR a) sửa: form Kết quả ("kết thúc sớm ở ⋯", "thêm ở ⋯ › Sửa PA") và câu chặn máy chủ ("Kết thúc PA ở menu ⋯") → "Kết thúc sớm…" / dòng Số buổi ở thẻ PA (+ EN).

## 2. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | Bấm |
|---|---|---|---|
| Ghi kết quả PA ghi nhanh (Công việc) | mở việc → mức → gõ → Lưu (panel riêng) | mở việc (thẻ PA mở sẵn form) → mức → gõ → Lưu kết quả | 3 → **3**, cùng panel Case |
| Lưu · việc tiếp › (ghi nhanh) | một nút | Lưu kết quả → Việc tiếp › (dải "✓ Đã lưu · Hoàn tác" sang việc kế giữ) | 1 → 2 |
| Điều chỉnh / Kết thúc… từ ghi nhanh | link mở panel lớn (chữ mang theo) | Quyết định ngay trong form (Giữ nguyên / Điều chỉnh / Kết thúc PA) | 2 → **1** |
| Ghi kết quả ở panel một em | ô ghi nhanh trong khối | nút "Ghi kết quả" → cùng panel Case, form trong thẻ | 2 → 2 |
| Thêm PA ở trang lượt | "+ Thêm PA" → form dưới khối (FormPa) | "+ Thêm PA" của mục Phương án → thẻ PA mới (cùng form) | 1 + điền |
| Mở Case từ tóm tắt việc người khác | "Mở Case ›" đổi trang | "Mở Case ›" tại chỗ, ‹ về tóm tắt | 1, không đổi trang |
| Ghi kết quả / Xác nhận PA / Mô tả ở trang lượt | nút việc → panel nổi | ngay trong khung Case mở tại chỗ (hoặc panel nổi như cũ từ chỗ khác của trang) | 1 |

Không mất thao tác nào ngoài dòng "Lưu · việc tiếp ›" (+1 bấm, theo e1, như PR a [XM-a1]).

## 3. Turso

- Công việc · Kết quả PA: trước panel ghi nhanh đã đọc `/cases/:id` (Bối cảnh) → nay `NganCase` đọc đúng một `/cases/:id` — **không đổi**.
- Trang lượt: trước chỉ đọc bảng kỹ năng; nay Case **mở** mới đọc `/cases/:id` (mở sẵn chỉ khi một Case duy nhất người xem làm được) — **+1 lượt đọc Case (~30–60 dòng) mỗi lần mở kỹ năng có Case**, chỉ khi người xem mở. Ước < 0,05 triệu dòng / ngày. Không đường mới.

## 4. Chấm ảnh + [XM]

4 khung chụp (e1__congviec, m5__congviec, i1__luot, k3__tomtat): **KHỚP 4/4** (bố cục, mục, thẻ PA, form trong thẻ, chân). Khác dữ liệu (em, PA) do DB demo.
- [XM-a3] (từ PR a) form Xác nhận PA trong thẻ vẫn kiểu ô nhập cũ — chưa làm ở PR b (đụng nháp + Hoàn tác xác nhận); PTA quyết có cần PR riêng.
- [XM-a2] hộp đổi phụ trách chưa chia nhóm — chưa làm.
- QL mở "Mở Case ›" từ tóm tắt: panel sửa được theo quyền QL (như trước khi sang hồ sơ em) — không có dải "làm thay"; muốn chặn tới khi bấm "Làm thay" thì báo.
