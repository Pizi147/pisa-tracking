# BADGE-QUA-HAN · quá hạn = MỘT badge đỏ · khớp / khác

Nguồn: lời chủ SP 15/11 ("Hầu hết các chỗ quá hạn đồng nhất lại … để thành badge đỏ đi") · `plan.md` dòng "Chủ SP 15/11: Hầu hết các chỗ quá hạn…" · `DESIGN.md` V22 (đỏ quá hạn · vàng gần hạn · thường chưa tới; không ⚠ / ●).
Không đổi luật hạn, không đổi dữ liệu, không thêm request (Turso 0 — chỉ đổi lớp CSS / thành phần vẽ).

## 0. Thành phần chung

`web/src/ui/Nhan.tsx` · **`BadgeHan`** (mới, mẫu = chip hạn dòng việc Công việc `ChipHan vien`): viên 22 px, bo tròn, chữ 12 / 600, không viền.
- `muc="qua"` — nền `late-bg`, chữ `late` (đỏ cam).
- `muc="gan"` — nền `soon-bg`, chữ `soon`, viền trong vàng (như chip "hạn 16/09" ở Công việc).
- Chưa tới hạn — chữ thường (`text-dim`); riêng `ChipHan vien` (cột hạn thẳng hàng ở Công việc / chuông / Chờ duyệt) giữ viên xám như cũ.

Đi qua `BadgeHan`: `QuaHan` · `ChipHan` (mọi chế độ) · `NhanTrangThai t="qua-han"` · `Han` (hôm nay / gần hạn) · và các chỗ trước tự dựng (bảng 1).
Bỏ trùng: lớp `CHU_HAN`, nhánh chữ đỏ của `ChipHan` thường / `chuThuong`, `BV` ở `DongHan`, `CHIP_TRON bg-late-bg` ở `PanelChuaLam`.
Phép kiểm: `server/src/tests/thanhPhanChung.tests.ts` › "BADGE-QUA-HAN" — cấm dòng có "quá hạn {n} ngày" / "Quá hạn · {n} ngày" / `nhanQuaHan(` đi cùng `text-late` / `bg-late-bg` / `text-bad` / `CHIP_TRON` mà không qua `BadgeHan` (bắt đúng 3 chỗ cũ trên main: PanelChuaLam, DongHan, SoLieu).

## 1. Kiểm kê — hạn ĐÃ QUA (trước → sau)

| # | Màn | Thành phần | Dáng trước | Sau |
|---|---|---|---|---|
| 1 | Công việc — dòng việc, Lớp của tôi, Chờ bạn duyệt; chuông; Tổng quan Chờ duyệt; Lịch Test (HangLop, KhoiNo); hồ sơ HV / lớp — dải Việc cần làm (`DauHoSo`); Báo cáo PH; Chấm Speaking; hồ sơ GV | `ChipHan vien` | viên đỏ (mẫu chuẩn) | giữ — giờ vẽ qua `BadgeHan` |
| 2 | Mọi đầu panel việc (Nhập điểm, Case, PA, Xét lại, Duyệt, Ý thức, Bước tiếp, Phối hợp…) · Ngăn Case · Panel một em · bảng số liệu `SoLieu` · panel GV trễ chấm | `ChipHan` (thường) | chữ đỏ đậm trần "quá hạn n ngày" | **badge đỏ** |
| 3 | Dải sự kiện panel (Hạn ghi KQ — Hỗ trợ HV; hạn SOS — `CaseSosControls`) | `ChipHan chuThuong` | chữ đỏ "16/09 · quá hạn n ngày" | **badge đỏ** cùng chữ |
| 4 | Bảng Cần hỗ trợ (hồ sơ lớp) · cột Việc tiếp theo (`ViecTiep`) · Bàn giao (đầu panel + từng em) · mọi `Han` | `QuaHan` | chữ đỏ trần | **badge đỏ** (`mo` = việc người khác: vẫn chữ mờ) |
| 5 | Hồ sơ lớp — bảng HV, dưới tên em "Ý thức · quá hạn n ngày" (`CanhBaoYThuc`) · Case ở hồ sơ HV / lượt (`CotCaseHv`, `CaseLuotKn`) · Chờ duyệt / Thẻ yêu cầu · Việc vận hành (`MgmtTasksPage`) | `NhanTrangThai t="qua-han"` | chữ đỏ (chip bỏ khung, OV-15a) | **badge đỏ** |
| 6 | Hồ sơ HV — Hành trình, cột trạng thái Case | `TrangThaiCase` | chữ `text-bad` tự dựng | **badge đỏ** (qua `NhanTrangThai`) |
| 7 | Phân tích — panel "Chưa làm" | `PanelChuaLam` | chip tự dựng `CHIP_TRON bg-late-bg` | **badge đỏ** |
| 8 | Panel việc — dòng Hạn (`DongHan`, Báo cáo PH TVV, Xếp MT hàng loạt) | `DongHan` | chip viền `rounded-md border-late-line` | **badge đỏ**; ≤ 3 ngày badge vàng; xa = chữ thường (bỏ viên xám viền) |
| 9 | Bảng số liệu — câu tình trạng dòng (`HanDong`) | `SoLieu` | chữ đỏ | **badge đỏ**; gần hạn badge vàng |
| 10 | Lượt Test thường — ô trạng thái, dòng hạn khi quá hạn & việc của người xem | `LuotThuongPage` | chữ đỏ | **badge đỏ** (việc người khác: chữ mờ như cũ) |
| 11 | Trang Mock Test — nút "Nhập điểm L" còn lại, phần quá hạn | `MockDetailPage` | chữ đỏ trong nút | **badge đỏ** trong nút |
| 12 | Panel một em — "Việc tiếp: … · quá hạn" | `PanelMotEm` | chữ đỏ | **badge đỏ** |
| 13 | Ô Sau thi (`NhanSauThi`) — "hạn 12/09 · quá hạn" | `HopGiaHan` | chữ đỏ | **badge đỏ** |
| 14 | Ý thức — bảng Phối hợp, hạn dưới tên em (`HanEm`) | `BangPhoiHop` | chữ đỏ | **badge đỏ**; ≤ 3 ngày badge vàng |
| 15 | Ý thức — nhãn vi phạm "Quá hạn n ngày" (`NhanViPham qua_han`) | XM-1 | badge góc 4 px có viền | **`BadgeHan`** (các trạng thái khác giữ dáng cũ) |
| 16 | Ý thức — ô "Bước đang làm" / việc của em (`BadgeViec qua`, bấm được) | XM-1 | badge góc 6 px có viền, cao 24 | **dáng `lopBadgeHan('qua')`** (vẫn là nút khi bấm được; chữ dài xuống dòng) |
| 17 | Viên trạng thái Case quá hạn (`NhanVienCase qua-han`) | XM-1 | viên cao 24, viền trong | **`BadgeHan`** |
| 18 | Hồ sơ HV — cột hạn Case (`CotCaseHv`) | quét lại | chữ đỏ đậm `text-bad` | **badge đỏ**; gần hạn giữ chữ trắng đậm (luật OV12e-1b có phép kiểm) |
| 19 | Kế hoạch Test — ô kỹ năng "Quá hạn chấm" (`ChipKyNang`) | quét lại | chữ đỏ `text-bad` | **badge đỏ** (viền ô đỏ giữ) |
| 20 | Bảng lượt việc — "Chưa làm · quá n ngày" (`BangLuotPanel`) | quét lại | chữ đỏ `text-bad` | **badge đỏ** (việc còn mở) |

## 2. GIỮ chữ đỏ (không badge) — SỐ ĐẾM tổng (mục 4 của việc)

| Màn | Chỗ | Lý do |
|---|---|---|
| Công việc / Tổng quan | đầu trang "8 quá hạn", đầu nhóm "3 quá hạn" (`DanhSachViec`, `HoTroHocVienTab`, `ChipSoQuaHan`, `HopChoDuyet`, `MockTestAdmin`) | số đếm |
| Hồ sơ HV / lớp | "1 quá hạn" đầu dải Việc cần làm (`DauHoSo`, `ThanhViecLop`) | số đếm |
| Phân tích | ô số "· 3 quá hạn" (`TongHopTestSos`) | ô số bảng |
| Lịch Test | đầu nhóm "Quá hạn chấm" (`NhomDau`) | đầu nhóm |
| Bảng hồ sơ lớp / điểm lớp thường | tiêu đề cột kỹ năng tô đỏ (`BangHoSoLop`, `BangDiemLopThuong`) | tiêu đề bảng, không phải nhãn hạn |
| Badge menu / tab / nút đếm (`App`, `BadgeTabSo`, `HangTab`, `ChipBadgeLop`, `HvCuaToi`, `LopCuaToi`, hồ sơ GV) | đã là badge đếm đỏ (V22) | không đổi |

## 3. [XM] — PTA Plan đã chốt (15/11)

| # | Chỗ | Chốt |
|---|---|---|
| XM-1 | `NhanViPham qua_han`, `BadgeViec qua`, `NhanVienCase qua-han` | **ĐỔI** sang `BadgeHan` — chỉ trạng thái quá hạn (bảng 1 dòng 15–17) |
| XM-2 | `BangLuotPanel` "Trễ n ngày" / "Làm muộn n ngày" (lịch sử) | giữ chữ |
| XM-3 | `ChipHan chuThuong` | gần hạn giữ chữ thường (mockup); đã quá hạn = badge đỏ (đã làm) |
| XM-4 | `ChipHan vien` hạn chưa tới | giữ viên xám |
| XM-5 (mới) | Lưới nhập điểm lớp thường — dòng phụ ô "… · quá hạn" (`LuoiThuong`, chữ `text-rose-300`) | dòng phụ một hàng cao 16 px, `truncate` trong ô lưới: badge 22 px làm cao ô / cắt chữ → giữ chữ, hỏi PTA |

Quét lại sau khi gộp main 15/11 (lưới kết quả PA #1738, chuông #1739, Case GD-21 #1748 nếu đã merge): các nhãn hạn ở đó đi qua `ChipHan` → đã là badge; không còn dáng quá hạn tự dựng nào khác ngoài các dòng GIỮ ở mục 2 và XM-2 / XM-5.

## 4. Thao tác trước → sau

Không thêm / bỏ thao tác nào: chỉ đổi dáng nhãn hạn. Badge không bấm được (chữ trong nút Mock Test vẫn thuộc nút). Chữ "quá hạn n ngày" vẫn hiện đủ (không chỉ màu), tooltip `title` giữ.

## 5. Ảnh trước │ sau

Tài khoản demo tên giả: GVCN Trần Ngọc Hà (7) · QL (2) · GV bộ môn (9). Ngày demo 14/09/2026. Phông Be Vietnam Pro đã nạp (`document.fonts.check` = true) mọi ảnh. 1440 tối + 375 sáng; `-zoom` = ×2 quanh nhãn hạn đầu tiên. Công cụ: `scripts/chup-badge-han.mjs`.

| Màn | Ảnh | Đổi |
|---|---|---|
| Công việc — panel Nhập điểm (đầu panel) | `cvpanel-1440-{truoc,sau}[-zoom].png` · 375: panel mở toàn màn (`cvpanel-375-*`) | chữ đỏ → badge đỏ |
| Hồ sơ lớp MB FT 101 — "Ý thức · quá hạn 1 ngày" | `lop-{1440,375}-{truoc,sau}[-zoom].png` | chữ đỏ → badge đỏ |
| Công việc (dòng việc, Lớp của tôi) | `cv-*` | không đổi (mẫu chuẩn) |
| Hồ sơ HV Hà Gia Bình — Việc cần làm | `hv-*` | không đổi |
| Tổng quan QL — Chờ duyệt | `tq-*` | không đổi |
| Lịch Test GV — Quá hạn chấm | `test-*` | không đổi |
| Hồ sơ lớp MB FT 101 — tab Ý thức, ô Bước đang làm "Quá hạn 1 ngày" (XM-1) | `lopyt-{1440,375}-{truoc,sau}[-zoom].png` | badge góc vuông có viền → viên tròn |

Không có dữ liệu demo hiện ra ở trang đầu cho: viên Case quá hạn, cột hạn Case hồ sơ HV, nhãn vi phạm quá hạn, ô Kế hoạch Test quá hạn chấm, Phân tích "Chưa làm", Bàn giao, Lượt Test thường quá hạn, Phối hợp Ý thức, Hành trình Case quá hạn — đã đổi trong mã cùng `BadgeHan`, phép kiểm + `tsc` giữ.
