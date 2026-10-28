# RA-UI — rà soát hình ảnh toàn web, đêm 29/10

> Session **RA-UI** (Opus 5.5). Điều phối: **PTA Plan**. Song song: **RA-LUONG** sửa logic — RA-UI chỉ sửa hình ảnh / chữ / CSS; trùng tệp thì nhắn PTA Plan.
> **Trạng thái: lượt 1 xong (danh mục màn theo mã, chưa chạy máy chủ, chưa sửa mã) — chờ PTA Plan nhắn "BẮT ĐẦU".**

## 0. Luật áp cho đợt này (đọc trước khi sửa)
- **Hình ảnh theo mockup đã duyệt SÁT** (màu, nền, viền, độ đậm, cỡ chữ, khoảng cách, cân đối, phân cấp); **tính năng theo luật + plan, giữ mọi thao tác cũ** (CLAUDE.md, chủ SP 28/10; PTA nhắc lại 29/10). Mỗi PR có bảng thao tác TRƯỚC → SAU, không mất thao tác.
- Luật giao diện: `DESIGN.md` "Luật V5" (V1–V21) → "Luật 21/10" (G1–G14). Hay vấp: V6 ít chữ (ⓘ thay câu) · V7 nhãn xám / giá trị đậm · V16 h1 22/700 · V18 Công việc ba tầng · V21 chữ đầu mục · G6 ô số / "›" / không ↗ · G9 không điều khiển trong `<th>` · G13 thang 12·13·14·15·17·22·28 · G14 đang chọn.
- Không ↗ (chủ SP 28/10); dòng phụ lặp thông tin hàng trên = xoá (chủ SP 27/10); chữ UI ngắn, không câu giải thích (`feedback-ngan-gon`).
- Cổng critique: mục tiêu ≥ 35/40; chạm 30 thì tối đa 2 vòng nữa; xong chỉ cần không P0 / P1.
- Đổi **bố cục** (sắp lại khối, đổi luồng) KHÔNG code đêm nay → mockup HTML trong `thiet-ke/` + đề xuất, chủ SP duyệt.
- Kiểm nhanh (`pisa-slot/KIEM-NHANH.txt`): typecheck · `scripts/kiem-esbuild.mjs` · phép kiểm riêng + **bắt buộc** `prNenTypoMau`, `prSang`, `prS4f`, `prEn`, `prBang0`, `suaLoiNong`. Không check đầy đủ.

## 1. Danh mục màn (chi tiết theo mã ở 3 phụ lục)
| Phụ lục | Vùng | Số dòng |
|---|---|---:|
| [A](ra-ui-a-khung-tong-quan-cong-viec.md) | Khung app (thanh trên / dưới, tìm, chuông, menu TK, Góc nhìn, DemoBar, mất kết nối) · Tổng quan 7 vai · Công việc 5 tab + mọi panel việc · Hồ sơ cá nhân · Hướng dẫn · Quản trị · `/dev/thanh-phan` | 149 |
| [B](ra-ui-b-hoc-vien-lop.md) | Học viên & Lớp (3 tab, ⋯ hàng lớp / hàng em theo vai) · Lưu trữ · Hồ sơ lớp (4 tab + Cuối khoá + Bàn giao + Xét lại) · Hồ sơ HV (3 tab + mọi panel ⋯) · Case (NganCase) · Hồ sơ GV | ~150 |
| [C](ra-ui-c-test-phan-tich.md) | Test (Chấm Test · Lịch Test tuần · Kế hoạch Test + hộp / popover / panel xếp lịch, xuất) · hồ sơ lượt MT / lớp thường · Phân tích 6 tab + panel số · thành phần chung `web/src/ui` | 129 + 16 |

Bảng kê panel 27/10 (`docs/superpowers/specs/2026-10-27-panel-inventory.md`, 415 điểm mở) là nguồn chi tiết luồng mở panel; danh mục này thêm **trang / tab / rỗng / lỗi / điểm rủi ro hình ảnh** để chụp.

### 1.1 Vai × màn (tài khoản demo — mật khẩu ở màn đăng nhập; đổi nhanh qua DemoBar › "Đổi tài khoản demo")
| Vai | Tài khoản gợi ý | Trang đầu | Menu thấy | Ghi chú chụp |
|---|---|---|---|---|
| QT | `dovutuanphong95` | Tổng quan toàn hệ thống (Theo chi nhánh) | đủ 5 + Quản trị (4 tab) | `?cn=` để thấy bản một chi nhánh |
| QL | `vy.nguyen` (Monbay) | Tổng quan QL (4 ô, Lớp / GV cần chú ý, Chờ bạn duyệt) | đủ 5 + Bảng quy đổi (chỉ đọc) | nhiều dữ liệu nhất — chụp mọi panel QL |
| GVCN | `ha.tran` (MB FT 101) | Tổng quan GV (Kỹ năng tôi dạy + Lớp tôi chủ nhiệm) | Tổng quan · HV & Lớp · Test (Chấm · Lịch · KHT chỉ xem) · Công việc | |
| GV bộ môn | `trang.pham` (Speaking) · `huong.do` (S chéo) | Tổng quan GV | như GVCN | Chấm Speaking chéo |
| Admin VP | `xuan.pham` (Monbay) | Tổng quan Mock Test | HV & Lớp · Test (Lịch · KHT) · Công việc "Chấm điểm" · Phân tích 5 | |
| TVV | `mai.phan` (Monbay) · `huong.nguyen` (CP) | Tổng quan TVV | HV & Lớp (của tôi) · Công việc · Phân tích 4 | |
| CX | `tam.vu` | Tổng quan CX (chỉ xem) | HV & Lớp · Phân tích 4 | không Test, không Công việc |
(Email = tên + `.pisa@gmail.com`.)

### 1.2 Mockup đối chiếu theo màn
| Màn web | Mockup (mới nhất thắng) |
|---|---|
| Bảng mẫu / màu / SOS | `thiet-ke/v5/bang-mau.html` · `v7/bang-mau-moi.html` · `v7/mau-muc.html` |
| Tổng quan theo vai | `v5/tong-quan.html` |
| Công việc | `v7/cong-viec-2.html` (V18, #621) · `v5/cong-viec.html` · `v5/tvv.html` |
| Panel liền mạch (số → việc, Case) | `v7/panel-pilot.html` (M6) |
| Học viên & Lớp | `v5/hoc-vien-lop.html` |
| Hồ sơ lớp | `v5/ho-so-lop.html` · Cuối khoá `v6/cuoi-khoa.html` · Xét lại `v6/xet-lai-lo-trinh.html` · Khai bậc lô `v7/khai-bac-lo.html` (nhánh #672) |
| Hồ sơ HV | `v7/ho-so-hv.html` (M5) · `v7/ho-so-hv-y-thuc.html` (M7) · `v6/trang-thai-hv.html` · `v6/lo-trinh-moi.html` |
| Hồ sơ lượt Test | `v7/ho-so-luot-test.html` (M4) |
| Test | `v5/test.html` · Lịch tuần `v7/lich-test-phan-cap.html` (M2, **chờ duyệt** — plan.md :262) · KHT `v7/ke-hoach-test.html` (#673 đang mở) · khoá cuối tuần `v6/khoa-lich.html` |
| Hồ sơ GV | `v5/ho-so-gv.html` |
| Phân tích | `v5/phan-tich.html` |
| Quản trị · Bảng quy đổi | `v5/con-lai.html` · `v7/bang-quy-doi-band.html` |

## 2. Ứng viên lỗi đã thấy khi đọc mã (CHƯA chụp xác nhận — lượt 2 kiểm bằng ảnh rồi xếp P0–P3)
Xếp theo loại PR dự kiến. "Một chỗ" = sửa ở thành phần / token chung, áp mọi trang.

### (a) cắt / tràn / xô lệch / 375
| # | Ứng viên | Chỗ | Một chỗ? |
|---|---|---|---|
| a1 | **Chân panel 375 xếp dọc** Huỷ · dòng đếm · Lưu nhỏ lệch trái; mockup để Huỷ \| Lưu cùng hàng, Lưu rộng (PTA 29/10) | `ui/KhungPanel.tsx` chân v3 | ✓ khung panel |
| a2 | Nút không đủ 44 px ở 375 | StudentsPage.tsx:670 · LuuTruPage.tsx:99 · ChiTietViPham.tsx:107-114 · PhoiHopSosSection.tsx:213 · thanh CuoiKhoaLop | lẻ |
| a3 | Hàng điều khiển quá dài, xuống dòng xấu (đầu HV & Lớp, thanh Lịch Test, thanh KHT, lọc Công việc, chip chi nhánh Họp đơn vị, chip Chờ duyệt) | phụ lục A3 #63, B1, C1 #11 #50 | lẻ / có thể gom "Lọc ▾" như Lịch Test 375 |
| a4 | Đầu hồ sơ HV vai TVV / CX / Admin: mỗi mục ⋯ thành nút riêng → nhiều nút một hàng ở 375 | StudentDetailPage.tsx:286 | lẻ (giữ đủ thao tác) |
| a5 | h1 hồ sơ HV chứa badge + "Tạm dừng…" + "Gia hạn" → tên dài xuống dòng | StudentDetailPage.tsx:256 | lẻ |
| a6 | ⋯ ô lưới lớp thường hiện khi rê, đè số | LuoiThuong.tsx:445 | lẻ |
| a7 | Chip / chữ cắt trong ô hẹp (ChipKyNang 168 px, "Đã vắng · chờ xếp lại", mã lớp HangLop, dòng phụ "L dời sang W4 SEP") | C1 #22 #29-33 #55 | lẻ |
| a8 | Bảng rộng ở 375 không có dạng thẻ (Vận hành 52rem, Họp đơn vị 46rem, Tài khoản, LopToiDay cũ, Kết quả Test 1180) | A5, C3 | xét `Bang` thẻ 375 |
| a9 | Gợi ý chỉ ở `title` (điện thoại không xem được) | MgmtTasksPage, AccountsAdmin, AdminPage | lẻ → ⓘ |

### (b) phân cấp + màu (token chung)
| # | Ứng viên | Chỗ |
|---|---|---|
| b1 | Hai cỡ h2 đầu panel (v3 17 / một dòng 14) + `Modal` h2 14 — 3 cỡ cho cùng tầng "tiêu đề panel" (V21: 17) | `KhungPanel.tsx:309, :329`; `Drawer.tsx` |
| b2 | Tiêu đề khối lệch thang: `Card` h2 17 nhưng MockTestAdmin.tsx:53, DanhSachViec.tsx:162, hàng mở MockDetail (h2 14) — cần chốt 4 tầng trang 22 → khối 17 → nhóm 15 → dòng 15/500 | ui.tsx:22 + chỗ lẻ |
| b3 | h1 Cuối khoá 17 px (V16 đòi 22) | CuoiKhoaLop.tsx:625 |
| b4 | h1 viết thô `text-[22px]` thay `text-xl` (cùng cỡ — chỉ dọn) | DauTrangLop.tsx:179 · HoTroHocVienTab.tsx:320 · StudentDetailPage.tsx:256 |
| b5 | Tiêu đề lặp tên tab ("Ý thức & Phối hợp" trong tab cùng tên) | ClassYThucCard.tsx:176 · StudentYThucSection.tsx:151 |
| b6 | Hướng dẫn: tiêu đề màn h3 12 px nhảy cấp từ h1 | HuongDanPage.tsx:43 |
| b7 | Đậm quá nhiều trên một dòng (đếm đầu Công việc 4 `<b>`, Chấm Test 3 `<b>`, Quản trị khối giải thích, `DiTiep` số đậm, `<b>` bọc OSo Hiệu quả PA) | A5, C1 #4, C3 #123 |
| b8 | Nút chính ở mọi hàng bảng Quá hạn chấm (nhiều nút chính một màn) | KhoiNo.tsx:136 |
| b9 | So màu / nền / viền / khoảng cách từng màn với mockup (cần ảnh — lượt 2) | mọi màn |

### (c) bớt chữ thừa
| # | Ứng viên | Chỗ |
|---|---|---|
| c1 | Câu giải thích dưới tiêu đề / trong rỗng (≥ 25 chỗ: Quản trị, Họp đơn vị, Giao việc, Ý thức rỗng, BanGiao, NganXuatMt, GvCham, MockDetail dải huỷ, Hiệu quả PA rỗng, KQ thi rỗng…) → bỏ hoặc ⓘ | A5, B3, C1-C3 |
| c2 | Dòng phụ lặp thông tin (Case: "mở {tuần} · {tên} báo · hạn … · phụ trách …"; NganXuatDs nối bộ lọc; Cuối khoá dòng phụ dưới h1) | B5, B1, B3 |
| c3 | Emoji 👁 ở dải theo dõi Công việc | HoTroHocVienTab.tsx:361, :492 |
| c4 | Nút trùng tiêu đề thẻ "Đổi mật khẩu" | ProfilePage.tsx:160 |
| c5 | Dấu chấm cuối trong tiêu đề rỗng ("…lịch thi trong … → … .", "Chưa có phân công lớp nào đang hiệu lực.") | GocLichThi.tsx:163 · HoSoGiaoVienPage |
| c6 | Tab số panel ▼▲★ + "Fail / Pass / Exceed" tiếng Anh trên giao diện tiếng Việt | SoLieu.tsx:423-460 |

### Ngoài phạm vi RA-UI — chuyển đi
| Việc | Chuyển |
|---|---|
| ↗ cuối cùng "Mở {mt} mới ↗" (`HopKhoiPhucKetQua.tsx:100` + EN `r1En.ts:161`) + luật CSS chết `index.css:477-485` | RA-UI làm luôn (chữ / CSS) |
| `<th>` chứa ô chọn tất cả (G9): `NganXepLichMt.tsx:334`, `BangDiemLopThuong.tsx:154` — dời ra hàng công cụ là đổi thao tác nhỏ | RA-UI (giữ thao tác chọn tất cả, đặt ở hàng công cụ) — hỏi PTA nếu thấy là đổi bố cục |
| `window.confirm` gốc ở Lịch Test (`LichTestTab.tsx:184, :307`) → `ConfirmDialog` | RA-UI (hình ảnh hộp) |
| Có thể lỗi trang tab Ý thức khi em không có lộ trình (`StudentDetailPage.tsx:406` `cy.ratio` với `cy = null`) | **RA-LUONG** (logic) — kiểm bằng bấm thử rồi báo |
| Chữ chưa bọc `t()` (KeHoachTestTab, HieuQuaPa, YThucPhoiHop, TongHopTestSos, NganXepLichMt, HopChoDuyet:212) | ghi nợ EN, không làm đêm nay |
| Bảng "Lớp tôi dạy" cũ cuối Công việc GV trùng Tổng quan (G8) · Admin tab "Chấm điểm" mà h1 "Công việc" | đổi bố cục / nhãn → đề xuất cho chủ SP |

## 3. Kế hoạch lượt 2 (khi có "BẮT ĐẦU")
1. Nhánh mới từ `origin/main` mới nhất (sau #672–#674). Một máy chủ dev, seed demo; tắt khi không chụp.
2. Chụp theo phụ lục A → B → C, mỗi vai ở bảng 1.1: 1440 tối + sáng, 375 tối + sáng (thêm 1100 / 1440 biên cho Tổng quan, Công việc). Rỗng / lỗi / đang tải bằng **DemoBar › Kịch bản giao diện**. Ảnh vào `docs/anh/ra-ui/` (đặt tên `vung-man-vai-rong-sang|toi.png`).
3. `audit` + `critique` từng màn (đặt cạnh mockup, zoom từng khối) + `web-design-guidelines` → điền mục 4 (điểm / màn) và mục 5 (lỗi P0–P3 kèm ảnh).
4. PR theo loại, ưu tiên sửa một chỗ áp mọi trang: **RA-UI-1** (a) khung panel chân 375 + 44 px + cắt chữ · **RA-UI-2** (b) thang tiêu đề 4 tầng + panel / Modal / Card + đậm · **RA-UI-3** (c) bớt chữ + ↗ cuối + `window.confirm`. Mỗi PR: ảnh trước | sau (+ mockup) ở `docs/anh/ra-ui-n/`, `khop-khac.md` có bảng thao tác TRƯỚC → SAU, nhắn PTA Plan.

## 4. Điểm critique theo màn
_(lượt 2)_

## 5. Lỗi P0–P3 kèm ảnh
_(lượt 2)_
