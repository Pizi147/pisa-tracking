# R1-LUU-TIEP — khớp / khác (sửa nhỏ theo mẫu sẵn có, không mockup)

Nguồn: thiết kế `docs/superpowers/specs/2026-10-26-deploy-ux-design.md` mục 4.1 (luật 1–9). Ảnh: `truoc-*` / `sau-*` cùng thư mục (GV 7, seed nguyên).

## 7 điểm vào — TRƯỚC → SAU

| Điểm vào | Nút TRƯỚC | Lưu | Tiếp | Hết | Lỗi |
|---|---|---|---|---|---|
| Lịch Test (lưới FT, `LuoiFT`) | Lưu · Lưu · em tiếp › | đóng hộp → **ở lại**, "✓ Đã lưu · Bài tiếp ›" | em kế cùng cột → **bài còn thiếu kế** (vòng lên, L → R) | đóng hộp, lớp tự thu, lớp kế tự mở → **"Đã xong phần của bạn · MB FT 101 · W3 SEP: đã lưu n bài" + Lớp tiếp: {mã} ›** | ở lại, giữ chữ (giữ) + focus ô |
| Hồ sơ lớp / Điểm theo lớp (`LuoiChamLop`) | như trên | như trên | như trên | đóng → **trạng thái hết + Đóng** | như trên |
| Công việc · Chấm Test (`PanelNhapDiem*`) | như trên | như trên | như trên | đóng → **Lớp tiếp (việc gộp) / Việc tiếp ›**; chân panel thêm **Việc tiếp ›** (nổi bật khi đủ phần) | như trên |
| Màn một kỹ năng 375 (`MotKyNangFt`) | như trên | như trên | em kế cùng chip → **bài còn thiếu kế, đổi chip khi đổi kỹ năng** | đóng → **trạng thái hết** | như trên |
| Speaking chéo (`PanelChamSpeaking`) | như trên | như trên | em chưa chấm kế (không vòng) → **vòng lên** | đóng → **trạng thái hết + Việc tiếp ›** | như trên |
| Hồ sơ MT `/mock-test/:id` (`DaiODiemLon`) | **chỉ Lưu** ([BÁO] chủ SP) | đóng → ở lại | không có → **bài còn thiếu của lượt → Lưu · em tiếp ›** (danh sách lượt của lưới, mở đúng kỹ năng) | không có → **hết + ‹ Về {nguồn}** | như trên |
| Lộ trình ở hồ sơ HV (`HangLichMt`) | **chỉ Lưu** | đóng → ở lại | không có → **bài còn thiếu của lượt** | không có → **hết + Đóng** | như trên |

Khác: Chấm Test / thanh việc lớp "Việc tiếp" dùng ảnh chụp danh sách (`viecKeTiep`) — trước đây việc vừa xong rời `/my-work` thì `findIndex + 1` về việc đầu [KIỂM].
Nhãn: "Lưu và tiếp" → **Lưu · việc tiếp ›** (Ghi nhanh, Báo PH) · hộp một trường đóng sau lưu → **Lưu · đóng** (Sửa điểm có lý do, S Ex, Nhận xét lớp thường).
Lớp thường gõ trực tiếp: Enter xuống hàng **bỏ qua ô đã có điểm** (trước: dừng ở ô chỉ đọc); ↑ / ↓ giữ.

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Lưu ô điểm | đóng hộp | ở lại (✓ Đã lưu · Bài tiếp ›); X / Esc / bấm ngoài đóng |
| Lưu · em tiếp › | có | đổi chữ **Lưu · bài tiếp ›** (trang một em hết bài: **Lưu · em tiếp ›**) |
| Vắng | ghi "-" rồi sang em kế, Hoàn tác | giữ (sang bài còn thiếu kế) |
| Bỏ vắng · Khôi phục điểm · Lý do sửa · Lịch sử · Người chấm S · Nhóm nguyên nhân · Ctrl+Enter | có | giữ |
| Dán từ Excel · Cả lớp · ⋯ · Mở lưới đầy đủ | có | giữ (không đụng) |
| Lịch Test tự mở lớp đầu còn bài | lớp xong tự thu, lớp kế tự mở | lớp đang chấm giữ mở; sang lớp kế bằng **Lớp tiếp: {mã} ›** (PR26 3.2 (5): không tự nhảy lớp) |

**Số thao tác — "chấm 5 bài L + 3 bài R lớp MB FT 101" (GV 7, Lịch Test):** trước 2 bấm (ô L đầu, ô R đầu) + 8 × (gõ số + Enter); sau **1 bấm** + 8 × (gõ số + Enter) — hết L tự sang R.
**Hồ sơ MT từ lưới, sửa ô đã đạt rồi sang em kế:** trước 3 bấm / em (‹ Về lưới · tên em kế · ô); sau **1 bấm** (Lưu · em tiếp ›, ô đã mở sẵn).

Kiểm: `node scripts/do-khung.mjs cham-lien-mach` (DB vừa seed) — (a)–(g) đạt 1440 tối + 375 sáng.
