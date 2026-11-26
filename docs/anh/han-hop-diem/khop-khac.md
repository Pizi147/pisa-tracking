# HAN-HOP-DIEM — bấm ngày hạn để sửa · hộp chấm điểm thêm ⋯ + Lưu · đóng (chủ SP 26/11)

Ảnh cặp TRƯỚC (main) | SAU (PR), cùng ô, cùng dữ liệu demo (14/09/2026), vai Quản lý Monbay:

| Màn | 1440 tối | 1280 tối | 375 sáng |
|---|---|---|---|
| Hộp chấm điểm (Lịch Test tuần, ô L của lưới MB FT 101) | `1440-hop-cham-diem-truoc-sau.png` | `1280-hop-cham-diem-truoc-sau.png` | `375-hop-cham-diem-truoc-sau.png` |
| Hạn trong panel việc (Công việc › Việc được giao) | `1440-han-panel-viec-truoc-sau.png` | `1280-han-panel-viec-truoc-sau.png` | `375-han-panel-viec-truoc-sau.png` |

Hộp chấm ở **Công việc** (panel Nhập điểm lớp) và **Lịch Test tuần** dùng CHUNG một lưới `LuoiFT` / `HopNhapDiem` — ảnh Lịch Test đại diện cả hai.
Ảnh chụp bằng khung trình duyệt nhỏ (ảnh 800 px) nên chữ nhỏ; bố cục đúng 1440 / 1280 / 375.

## Việc 1 — bỏ "Sửa hạn" / "Gia hạn", bấm ngày hạn

Ngày hạn (tô màu như cũ) thành nút khi người xem CÓ quyền sửa (cờ máy chủ cũ: `coTheSuaHan`, `coTheGiaHan`, `lamDuoc`…); gạch chân chấm mảnh + `aria-label` "Sửa hạn {ngày}". Không quyền → ngày trơn.
Mở ô sửa tại chỗ đúng như cũ (`ONgay`: ô gõ được + nút lịch; Lưu hạn · Huỷ sửa · Về mặc định; toast "Đã lưu hạn"; 409 giữ ngày đang gõ + Tải lại). Một component dùng chung: `web/src/ui/HanBam.tsx`.

| Chỗ | TRƯỚC | SAU |
|---|---|---|
| Panel việc: khối Phụ trách · Hạn · Theo dõi (GV-2: việc Vận hành, Báo PH TVV, Tình hình học tập…) — `DongHan` + `KhoiGiaoViec` | nút "Sửa hạn" (375: "Sửa") / "Đặt hạn" cạnh ngày | **bấm ngày** mở ô sửa; việc không hạn: bấm "Chưa có hạn" (tên đọc "Đặt hạn") |
| Hạn Báo PH ở Ý thức — `OBaoPh` (dòng "hạn dd/mm/yyyy · đã chỉnh") | link "Sửa hạn" sau dòng | **bấm "hạn dd/mm/yyyy"** (mở đúng hộp ghi Báo PH như cũ) |
| "Xem đủ" Báo PH — `BaoPhDu` | nút "Sửa hạn" | **bấm thẻ "hạn dd/mm/yyyy"** |
| Phối hợp SOS / Meeting CX: dòng việc (panel Công việc + hồ sơ lớp / HV) — `BangPhoiHop` | mục "Sửa hạn…" trong ⋯ (rồi lại bấm "Sửa hạn" một lần nữa) | **bấm ngày hạn trên dòng** → mở thẳng ô sửa (bỏ một bước); ⋯ còn "Bỏ việc…" |
| Phối hợp SOS ở hồ sơ HV — `PhoiHopSosSection` (cột hạn) | link "Sửa hạn" | bấm ngày (cùng `DongHan`) |
| Gia hạn sau thi — panel Chọn bước tiếp / Nhập kết quả thi thật (`PanelSauThi`) | link "Gia hạn" ở tiêu đề bước 2 | **bấm "hạn dd/mm"** của bước 2 → hộp `HopGiaHan` (giữ nguyên: Hạn mới · Lý do tuỳ chọn · Bỏ gia hạn) |
| Gia hạn sau thi — `PanelBuocTiep` | link "Gia hạn" | dòng kết quả thêm "· hạn dd/mm" bấm được (chỉ người có quyền thấy) |
| Gia hạn sau thi — `PanelMotEm` (panel một em), đầu hồ sơ HV (`StudentDetailPage`) | nút / link "Gia hạn" | **bấm hạn trong nhãn "Đã thi · chờ kết quả · hạn …"** (`NhanSauThi onHan`) |

Giữ nguyên: lý do khi gia hạn sau thi (hộp nhỏ `HopGiaHan` mở khi bấm ngày — đường cũ cho phép lý do tuỳ chọn); mọi quyền do máy chủ kiểm.
Không đổi: `DanhSachViec` (dòng danh sách chỉ mở panel; hạn sửa ở panel), cài hạn mặc định của Quản trị (`HanMacDinhAdmin` — bảng cấu hình, không phải việc), dòng nhật ký "Sửa hạn" (lịch sử, không phải nút), "Dời hạn chấm" của hộp kỹ năng Mock (việc khác — dời hạn chấm một kỹ năng, đã có ở ⋯).
**Còn cần chủ SP xem:** ở panel Chọn bước tiếp (`PanelSauThi`) ngày hạn đứng cạnh tiêu đề "Bước tiếp" rất nhỏ — gạch chấm là gợi ý duy nhất.

## Việc 2 — hộp chấm điểm (FT: Công việc · Lịch Test tuần · 375)

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Vắng (ghi "-", sang bài tiếp, Hoàn tác 10 s) | nút "Vắng" ở chân hộp | **⋯ ở đầu hộp › Vắng** (cùng hàm, cùng điều kiện — chỉ khi ô chưa gõ gì, người nhập được ô) |
| Dời lịch kỹ năng | không có trong hộp (phải sang hồ sơ Mock / Kế hoạch Test) | **⋯ › Dời lịch** → mở hộp `HopThaoTacMt` (đúng hộp hồ sơ Mock; hộp chấm đóng lại) — chỉ khi `thaoTacKyNang` cho (Head / GVCN lớp tuần đã qua…) |
| Huỷ điểm | không có trong hộp | **⋯ › Huỷ điểm** → một dòng hỏi ở chân "Huỷ điểm Listening · Minh Anh? · Giữ · Huỷ điểm" → `guiHuyDiem` (toast + Hoàn tác 10 s như lưới lớp thường) — BPXL (`diem` = false) không thấy |
| Khôi phục điểm · Bỏ vắng ("Không dự thi" / vắng đã chốt) | ⋯ ở chân hộp | gộp vào **⋯ đầu hộp** |
| Lưu · đóng | ⋯ ở chân (hoặc nút chữ đơn) bên TRÁI | nút ngay **bên phải "Lưu · bài tiếp ›"**, cùng cỡ (chỉ khi có bài kế; không bài kế: "Lưu" ở lại như cũ) |
| Lưu · bài tiếp › (Enter) | chân hộp | giữ nguyên, vẫn là nút chính |
| ✕ · Esc · hỏi "Bỏ chữ đang gõ?" | đầu hộp | giữ nguyên (⋯ đứng ngay trước ✕) |
| Ô đang Vắng (dòng "Vắng lần n") | ⋯ (Bỏ vắng) ở chân · Lưu điểm · đóng | ⋯ đầu hộp (Bỏ vắng · Dời lịch · Huỷ điểm) · chân chỉ còn "Lưu điểm · đóng" |

Máy chủ: `classScoreSheet` trả thêm `quyen: { canPlan, laGvcn, diem }` (cùng 3 hàm hồ sơ Mock dùng; không thêm câu SQL / request); nguồn lưới khác không gửi → mục Dời lịch ẩn. Mọi đường lưu vẫn tự kiểm quyền.

**Quyết định cần chủ SP duyệt (ghi theo lời 26/11):** "Vắng" bỏ khỏi chân hộp, nằm trong ⋯ — GV ghi vắng nhanh mất 1 bấm so với nút cũ. Nếu muốn giữ nút "Vắng" ở chân thì thêm lại một dòng (⋯ vẫn có).

## Chuỗi `ponytail:` / chuỗi dịch
Không có chú thích `ponytail:` mới. Chuỗi mới: "Sửa hạn {ngay}", "Huỷ điểm {skillLabel} · {tenHv}?" (có bản Anh ở `shared/i18n/en/hanHopDiem.ts`).
