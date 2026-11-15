# GD-18 · CHU-DONG-BO — chữ / ký hiệu đồng bộ toàn web · khớp / khác

Nguồn: `12-plan-giao-dien-dot-3.md` dòng GD-18 · `thiet-ke/v21/bang-mau.html` + `dong-bo-ghi-chu.md` (⑤ bản sau ⓪, H4 / H5) · plan.md BÀN GIAO 15/11 (MuiTenMo chevron, "Tạm dừng / Kết thúc học") · luật V22.
Chỉ chữ / ký hiệu — KHÔNG đổi bố cục, KHÔNG đổi luật. Tài khoản demo tên giả: GV Trần Ngọc Hà (7) · TVV Nguyễn Thu Hương (23). Phông Be Vietnam Pro đã nạp.

| Ảnh | Cho loại sửa |
|---|---|
| `cap-chevron-gv-1440-toi.png` · `cap-chevron-gv-375-sang.png` (TRƯỚC │ SAU) | mũi mở lớp gập: tam giác ▸ → chevron "›" / "⌄" |
| `zoom-chevron-gv-1440-toi.png` (×2) | mũi ⌄ lúc mở — tâm lệch 0 px |
| `cap-vipham-gv-1440-toi.png` | "+ Ghi vi phạm" → "+ Vi phạm / Nhắc nhở" (hồ sơ lớp › Ý thức) |
| `cap-sauthi-tvv-1440-toi.png` | chân panel Sau thi: "Đóng · Chốt bước tiếp · **Chốt bước tiếp · việc tiếp ›**"; hộp "Tạm dừng / Kết thúc học" |

## 1. Bảng chữ TRƯỚC → SAU

| # | Loại (⑤) | Nơi | TRƯỚC | SAU | Cách sửa |
|---|---|---|---|---|---|
| 1 | Mũi mở `MuiTenMo` (plan.md BÀN GIAO) | lớp gập HV & Lớp · Kế hoạch Test · Lịch Test (mọi chỗ dùng `MuiTenMo`) | tam giác đặc ▸ ▾ (SVG 8 px) | chevron nét: "›" gập, "⌄" mở (xoay 90°) | `MuiChev` mới ở `ui/HangNhom.tsx`, `MuiTenMo` dùng lại |
| 2 | Mũi mở tự gõ ký tự | Bàn giao GV "Nhận xét chung cả lớp" · "Đã từng dạy lớp này" · "Lịch riêng" (Xếp nhiều MT) · Phân tích GV ▸ tách chi nhánh | chữ ▸ ▾ | `MuiChev` | thay ký tự |
| 3 | "Xoá" một chính tả (⑤ G2) | Lịch MT em (hộp xác nhận, toast, ⋯) · Hướng dẫn · khoá EN | "Xóa" / "xóa" | "Xoá" / "xoá" | thay toàn `web/src` · `shared` · `server/src` (cả khoá EN) |
| 4 | "Tạm dừng / Kết thúc học" (dòng 35) | menu ⋯ hồ sơ HV · panel Bước tiếp / Sau thi · Cuối khoá · Xét lại · Hướng dẫn · `quanLyHocVien` · `tongKetLoTrinh` (`NHAN_HUONG_SAU_THI`) | "Tạm dừng/ Kết thúc học" | "Tạm dừng / Kết thúc học" | thay toàn; giữ khoá EN cũ (`EN_GD18`) cho chuỗi đã lưu trong nhật ký / Hành trình |
| 5 | "+ Ghi vi phạm" (dòng 36) | hồ sơ lớp › Ý thức (nút) · menu ⋯ dòng em (`MUC_MENU_DONG_NHAN`) · Hướng dẫn | "+ Ghi vi phạm" · "+ Ghi vi phạm" trong menu | nút "+ Vi phạm / Nhắc nhở"; mục menu "Vi phạm / Nhắc nhở" (nằm dưới nhóm "+ Task") | thay hằng + EN |
| 6 | Tên bậc VIẾT HOA (⑤ H5) | ô gợi ý "Ví dụ: Report 2 …" | "Report 1 / Report 2" | "REPORT 1 / REPORT 2" | thay chữ; phần còn lại đã qua `bacNgan` / `bacDu` từ GD-4d |
| 7 | Chân panel việc "Lưu · việc tiếp ›" (lời 36, dòng 40c) | Sau thi (Chốt bước tiếp) · Chốt ngày thi · Trả lời tình hình học tập (GVCN) | nút chính chỉ "Chốt …" / "Lưu · gửi TVV", "Việc tiếp ›" riêng (không lưu) | còn việc kế: "Đóng" · nút việc · **"{việc} · việc tiếp ›"** (chính, `luuRoiTiep` — sang việc kế chỉ SAU khi lưu thành công); mở lẻ: nút việc là chính | `chot` / `luu` / `gui` trả `boolean` |
| 8 | "Lịch sử · n" một tên | Việc quản lý — khối cập nhật | "Lịch sử" (không số) | "Lịch sử · n" | thêm số |
| 9 | Nút-chip / badge không đơn vị | chip "Việc cần làm" (HV & Lớp, hồ sơ lớp, Công việc) | đã "{loại} · {số}" (GD-4b / GD-13a) | không đổi — đã đủ | quét `chipViecLop` / `chipViecEm` / `NutChipViec`: đơn vị chỉ nằm ở `title` / `aria-label` |
| 10 | Thang cấp bậc không chữ | ③ hồ sơ HV · tab Ý thức lớp · panel Xác nhận xử lý | đã thang vạch (GD-4d) | không đổi | quét `dongThang`: mọi nơi vẽ thang đều qua `ThangVach` |
| 11 | V22: hạn chỉ bằng màu, không ⚠ / ● đi kèm hạn | toàn web | — | không còn chỗ sót | quét ⚠ và ●: chỉ còn ⚠ cho lỗi lưu / tải / chặn / xác nhận (không phải hạn) và "● Chưa lưu / Đang gõ" (trạng thái lưu) |

## 2. KHÁC (có lý do)

1. **Panel Bước tiếp mở từ hồ sơ HV** (`PanelBuocTiep`) và **Ghi KQ thi thật** (`KetQuaThiThatPanel`): chân hiện "Việc tiếp ›" SAU khi lưu (không gộp "Lưu · việc tiếp ›") — hai panel này có luồng nhiều bước (chọn hướng → hộp Tạm dừng / Lộ trình mới) và lối vào chính là hồ sơ HV, không phải danh sách Công việc; đổi chân ở đó đụng luồng lưu nhiều bước → để lại, ghi **Việc để sau** (GD-18b) nếu chủ SP muốn.
2. **Trả lời tình hình (GVCN)**: bỏ nút "Việc tiếp ›" đứng riêng không lưu — nay "Đóng" rồi mở việc khác nếu muốn bỏ qua; nút gộp sang việc kế sau khi lưu (lời 36 đã chốt nút gộp).
3. **`TheChoDoi` "{n} bài chờ duyệt dời"** (Lịch Test) giữ — thẻ phụ có đơn vị ở màn GD-11a đã duyệt, không phải nút-chip việc.
4. **Chữ nằm trong dữ liệu đã lưu** (nhật ký, Hành trình) vẫn có thể ghi cách viết cũ ("Tạm dừng/ Kết thúc học", "Xóa …"): không đổi dữ liệu cũ; bản Anh của chuỗi cũ giữ qua `EN_GD18`.

## 3. Bảng thao tác TRƯỚC → SAU

| # | Thao tác | TRƯỚC | SAU | Mất? |
|---|---|---|---|---|
| 1 | Chốt bước tiếp / Chốt ngày thi / Trả lời tình hình rồi sang việc kế | hai bấm (lưu, rồi "Việc tiếp ›") hoặc "Việc tiếp ›" không lưu | một bấm "… · việc tiếp ›" (lưu rồi sang) | không — "Lưu" riêng vẫn có ("Đóng · nút việc") |
| 2 | Bỏ qua một việc (không lưu) ở panel Trả lời tình hình | "Việc tiếp ›" | Đóng rồi bấm việc khác | **đổi** — lý do: lời 36 chốt một nút gộp; việc không đi qua luồng này không mất |
| 3 | Mở / gập lớp, hàng nhóm | bấm mũi tam giác | bấm mũi chevron (cùng vùng bấm 16 × 16, 44 ở 375) | không |
| 4 | Menu ⋯ / nút vi phạm | "+ Ghi vi phạm" | "Vi phạm / Nhắc nhở" | không |

## 4. Đo

- **Mũi ⌄ / ›** (tâm nét SVG so tâm nút 16 × 16): 2 / 2 chỗ lệch 0 / 0 px (GV 1440). ⋯ và ✕ không đổi (GD-13a / GD-13b đã đo ≤ 0,75 px).
- **Chữ bị cắt "…"**: không thêm — các chữ đổi (nút "Chốt bước tiếp · việc tiếp ›", "Vi phạm / Nhắc nhở") hiện đủ ở 1440 (ảnh) — hàng nút chân panel 375 xuống dòng như cũ.
- **Turso**: 0 — chỉ chữ / ký hiệu; không đổi đường API, không thêm câu. `tocDoDuong.ts` không đổi.
- impeccable `clarify` / `detect` + `web-design-guidelines`: xem mô tả PR.
