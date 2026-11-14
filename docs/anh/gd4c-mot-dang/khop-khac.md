# GD-4c — Một thanh tab · một menu thả · một dải chỉ số · một kiểu lịch sử · chip hạn dạng viên

Plan `09-plan-giao-dien-dot-2.md` GD-4 ý (e); `thiet-ke/v21/bang-mau-ghi-chu.md` mục 3 (R5.9: dáng chọn, dáng bỏ, tệp); mẫu ⓪ `v21.css` + `dong-bo-ghi-chu.md` (dòng 21–23, 32, 34, 42); ⑤ khu H (H1–H4) + B1 (chip hạn, [XM-B] của 4a). Badge tab theo lời 33 / 35. Luật lời 40. KHÔNG làm lại bố cục màn (GD-6…17 làm sau).

Ảnh cặp (trái mockup · phải web; seed 14/09; 1440 tối, 375 sáng; phông OK):

| Ảnh | Mockup | Web |
|---|---|---|
| `cap-1440-tab.png` · `cap-375-tab.png` | ⑤ H1 | Công việc (vai 9: tab Chấm Speaking mờ "⚠ 22"; vai 7 ở 375) |
| `cap-1440-menu.png` | ⑤ H2 | hồ sơ HV › ⋯ (MenuDong: nhóm, mục nguy hiểm, dòng phụ) |
| `cap-1440-dai-lop.png` | ⑤ H3 | hồ sơ lớp MB FT 101 (dải "Lượt mới nhất · Đạt MT · SOS") |
| `cap-1440-dai-tvv.png` | ⑤ H3 | Tổng quan TVV (dải 5 ô "Chỉ số của tôi") |
| `cap-1440-lich-su.png` | ⑤ H4 | Công việc › Báo PH (TVV) — "Lịch sử · 1" |
| `cap-1440-chip-han.png` | ⑤ B1 | Công việc › Case — chip hạn dạng viên |
| `zoom-x-ba-cham.png` | ⑤ F2, D1 · ③ | góc ✕ / ⋯ phóng to |
| `zoom-v22-truoc-sau.png` | — | V22: chip hạn, chip "Việc cần làm", cột Test, badge Chấm Speaking — TRƯỚC (có ⚠) │ SAU (chỉ màu) |
| `zoom-v22-cham-truoc-sau.png` | — | V22: đầu hồ sơ lớp "21 bài chờ chấm ›" / "6 việc quá hạn của lớp ›" — TRƯỚC (có ●) │ SAU (chỉ màu) |

## 1. Truy vết

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | ⑤ H1 thanh tab: 14 / 600, gạch dưới 2 px màu nhấn, badge viên đỏ (việc của tôi quá hạn) / vàng (hôm nay) / mờ (chỉ đếm); Chấm Speaking luôn mờ + ⚠; tab con cùng dáng; 375 cuộn ngang ≥ 44 | MỘT `ui/HangTab.tsx` (chuyển tab gốc từ `DanhSachViec` vào; bỏ biến thể `v8`, `soMo`, `cap="con"`, `donVi`; thêm `badge` (`BadgeTabSo`), `ngan`, `phu`); `BadgeMo` dùng chung. Thay ở: Công việc, Học viên & Lớp (`StudentsPage`), hồ sơ lớp (`ClassOverviewPage`), QuickReport, Highlights, Hướng dẫn "?", Ý thức `BangLan`, sổ nghĩa vụ + Chưa đạt · Đạt (`BangLuotPanel`), Kết quả (`SoLieu`) | tab | KHỚP |
| 2 | ⑤ H2 menu thả `.menu-tha`: bo 10, bóng, mục 14 / 500, nhóm 12, `hr`, nguy hiểm đỏ, mục tắt ghi lý do NGAY DƯỚI | MỘT `ui/MenuDong.tsx`; `ui/Menu.tsx` XOÁ (5 nơi: MockDetailPage "Chỉnh lịch", StudentDetailPage ⋯, LuoiKeHoach "+ MT", ClassYThucCard ⋯, ThanhTruocSau "Các bước"); `role="menu"` tự viết → MenuDong (ChonPhuTrach, BangPhoiHop). Thêm vào MenuDong: dòng phụ `goi`, lý do mục tắt hiện dưới mục, `keTruoc` 'dam' / 'do', nút chữ `chu` | menu | KHỚP |
| 3 | ⑤ H3 dải chỉ số: một hàng cao 44, "nhãn + ô số `OSo`", 0 không bấm, xấu ⚠, ⓘ là nút, "›" đổi trang; 375 lưới 2 cột | MỘT `ui/DaiChiSo.tsx` (`DaiChiSo`, `ODai`, `SoDen`, `SoTinh`) dùng lại `OSo` (thêm nguồn `dong` — panel dựng từ dữ liệu đã nạp, 0 request). Thay ở: Tổng quan TVV (5 ô — "Chờ KQ thi thật" → "Chờ KQ", ⓪ 22), đầu hồ sơ lớp (Đạt MT, SOS là ô số, "0 %" không bấm — ⓪ 21), Lịch tuần (`DaiSo`), hồ sơ GV (dải trong kỳ + "Việc đang tồn") | dai-lop, dai-tvv | KHỚP |
| 4 | ⑤ H4 lịch sử: gập "Lịch sử · n" → dòng giờ · người · việc · cũ → mới · Khôi phục; 0 dòng không vẽ (lời 40) | MỘT `ui/LichSuThayDoi.tsx` thêm `LichSuGap` (`details.ls`) · `DsLichSu` (`ul.ls-ds`) · `DongLs`; panel LichSuThayDoi (9 nơi) cùng lưới dòng. Thay ở: DongThoiGianLuot, MockDetailPage (dải kỹ năng, Lịch sử lượt), LuotThuongPage, NganLichSuBai (LuoiThuong, HopKyNang), HopNhapDiem, HopKyNang (ghi chú), Báo PH TVV ("các lần thử"), Hộp duyệt, Meeting, Sau thi. "Nhật ký" ở Test → "Lịch sử" (`CHU_MUC_HOP`, Hướng dẫn) | lich-su | KHỚP |
| 5 | ⑤ B1 chip hạn dạng viên `.han-v` ("quá hạn 5 ngày" đỏ · "hạn hôm nay" vàng viền · "hạn 23/09"; bỏ "còn n ngày" — ⓪ 32) — một dáng cho dòng việc ở mọi nơi; V22: không ⚠, vàng cả khi sắp hạn | `CotHan` (`DanhSachViec`) dùng `ChipHan vien` — cùng chip đã dùng ở đầu panel, Chờ bạn duyệt, Lớp của tôi, Lịch tuần | chip-han | KHỚP |

| 6 | **V22** (chủ SP 14/11, DESIGN.md V22, #1642): hạn / quá hạn CHỈ MÀU — đỏ quá hạn · vàng gần tới (hôm nay + ngưỡng `ganHan` sẵn có) · thường chưa tới; bỏ ⚠ và mọi biểu tượng; chữ giữ nghĩa | Tận gốc ở thành phần chung: `ChipHan` (3 dáng), `QuaHan`, `Nhan` tông late, `ChipSoQuaHan`, `BadgeTabSo`, `Alert` / `NhanTrangThai`, `DongHan`, `DaiChiSo`, `BadgeViec`, CSS `::before` ⚠ (số xấu, dải, ô số); rồi toàn web (~55 tệp: chip "Việc cần làm", đầu mục "n quá hạn", cột Test, chip "Quá hạn n ngày" panel vi phạm, chuông, dải việc hồ sơ, `DemNguocYThuc`, ô số bảng, Hướng dẫn "có ⚠" → "tô đỏ"). Chỉ có số + màu → thêm chữ sr-only "quá hạn". ⚠ GIỮ cho lỗi / chặn / xác nhận / dữ liệu sai | zoom-v22-truoc-sau, chip-han, tab | KHỚP |
| 7 | Chủ SP chốt badge tab Chấm Speaking: "Có, đỏ như mọi nơi" | có bài quá hạn → viên ĐỎ (dáng badge đỏ chung), không ⚠; không có → mờ; số = số bài, không cộng badge menu / chuông (lời 33 giữ) | tab, zoom-v22 | KHỚP |

**KHỚP 7 / 7 = 100 %.** Chỗ mockup v21 còn vẽ ⚠ cạnh hạn mà web chỉ dùng màu: **KHÁC theo V22** (chủ SP lời 44, #1644: mockup không sửa) — không tính là lệch: ⑤ B1 (chip hạn, đầu mục), ⑤ C (chip "Việc cần làm"), ⑤ H1 (badge Chấm Speaking), ⑤ H3 (ô số xấu).

## 2. GIỮ / KHÁC / [XM] (hỏi PTA Plan)
- **GIỮ** `cham/DiemTheoLop.tsx` thẻ chọn lượt (hai dòng: tên + dòng phụ, nút trước / sau, phím riêng) — đổi sang HangTab mất dòng phụ, đổi bố cục ([XM-T1]).
- **GIỮ** ([XM-11]) Tổng quan QL / QT / CX và Admin (`ChiSo` số to, `LamDongSoLieu`), `phanTich/*` — ⓪ dòng 42.
- **GIỮ** ([XM-12]) `students/HanhTrinh.tsx`; `platform/NhatKyChung.tsx` là trang "Nhật ký"; cột "Nhật ký" ở Quản trị.
- **[XM-T2] → PTA chốt, đã làm:** Sổ nghĩa vụ, tab "Chưa làm" theo V22: có việc quá hạn → số đỏ; không có → thường.
- **[XM-T3]** Tab con trong panel (BangLuotPanel, SoLieu) bỏ `-mx-4` → vạch tab không chạy hết bề ngang panel (theo `.tabs.trong`); Hướng dẫn 375 cuộn ngang thay ba tab chia đều.
- **[XM-M1]** Menu rộng cố định 220 px (Menu cũ tự giãn) — tên dài ở "Các bước" xuống dòng. MenuDong trả focus về nút khi đóng (Menu cũ không) — "Đổi lịch cả đợt" chưa bấm thử. BangPhoiHop: mở ⋯ không còn đóng form đang mở tại dòng.
- **[XM-D1]** Ô "Việc" ở dải TVV: số không bấm (mockup), nhãn "Việc ›" là link sang Công việc (dải đang ở Tổng quan).
- **[XM-D2] → PTA chốt, đã làm:** tỷ lệ 0 % có mẫu số > 0 VẪN bấm ("Báo PH đúng hạn 0 %", "Đạt MT 0 %" hồ sơ lớp); "0 không bấm" chỉ khi không có gì để mở.
- **[XM-D3]** Hồ sơ GV "Việc đang tồn": máy chủ chưa có nguồn panel theo nhóm việc → ô "n ›" đổi trang sang Công việc (không OSo); dải GV nhiều chữ phụ xuống nhiều hàng ở 1440 — bố cục hồ sơ GV để GD sau. **PTA chốt:** giữ đổi trang tạm thời; GD-15 làm panel.
- **[XM-D4]** Dòng đếm Ý thức (`PhoiHopSosSection` / `BangPhoiHop`) chưa sang `DaiChiSo` — làm cùng GD-6 / GD-7.
- **[XM-L1]** Bỏ biểu tượng loại dòng ở dòng thời gian lượt (H4 không có; chữ việc vẫn nói loại). Chưa đổi: `cases/CasePanel.tsx` dòng lịch sử Case (badge, Xoá kết quả…), `cases/FormPa.tsx` "Nhật ký PA (n)", `students/HangLichThi.tsx` "Lịch sử lịch thi", phần lịch sử ở `yThuc/BangLan.tsx` — **PTA chốt:** Case / Nhật ký PA → GD-6 / GD-7; Lịch thi → GD-13b.
- **[XM-C1]** Chữ "Tạm dừng/ Kết thúc học" (⓪ dòng 35: "Tạm dừng / Kết thúc học", mục ⋯ chữ đỏ) — đổi chữ đụng > 50 chỗ (nhãn, phép kiểm, khoá dịch, Hướng dẫn) → **PTA chốt: GD-18.**
- Chip bậc ở panel Báo PH TVV ("✓ REPORT 1") viết hoa theo 4d (`bacNgan`).

## 2c. V22 — chỗ GIỮ ⚠ và [XM]
- GIỮ ⚠ (không phải hạn): lỗi lưu / máy chủ (CasePanel, TaiCho, LoYThucPanel, TinhHinh, CuoiKhoaLop, GocPhanCongGv, HopTamDungKetThuc…), xung đột bản ghi (CapNhatTuan, CauHinhCaseSos), xác nhận hậu quả (ChuyenLopPanel, XacNhanXuLyPanel, CuoiKhoaLop), dữ liệu thiếu / sai, mất kết nối (App), trang dev độ tương phản.
- **[XM-V1]** "⚠ Gấp" (mức khẩn Case, `BangCanHoTro`) và "⚠ Chưa liên hệ được · lần n" (việc TVV) giữ ⚠ — không phải hạn. **PTA đồng ý.** "Chờ QL duyệt dời lần n · hạn" (MockDetailPage) đã bỏ ⚠ (trạng thái chờ có hạn).
- **[XM-V2]** ⓪ dòng 32 ("còn 1 ngày → hạn 23/09, màu còn hạn") vs V22 ("vàng là gần tới"): theo V22 (mới hơn) — chip viên vàng cả khi sắp hạn theo ngưỡng `ganHan` sẵn có. **PTA đồng ý.**
- Phép kiểm `thanhPhanChung` "V22 · hạn chỉ bằng màu…": quét `web/src/**/*.tsx` + `shared/domain` + CSS, báo lỗi nếu ⚠ / `IconCanhBao` đứng gần khoá hạn (không ngoại lệ). Phép kiểm cũ đòi ⚠ ở hạn đã sửa theo V22 (`hanhTrinh`, `hocVienLop`, `prHvl`, `prOv13b`, `prHk2` C15a / C41…).
- **Bỏ chấm "●" cùng hạn (PTA 14/11, V22 "không biểu tượng nào kèm"):** `Nhan` tông late / soon không còn chấm `::before`; badge lớp ("n bài chờ chấm ›", "n việc quá hạn của lớp ›" ở `DauTrangLop`, `StudentsPage`) `cham={false}`; `DongHan` bỏ chấm; `BadgeViec` ("Ý thức · cần xử lý") quá hạn / chờ không chấm; `.vh-qua::before` tắt; Sau thi "Bước tiếp chưa chốt" bỏ ●. **GIỮ ●:** chấm "có việc mới" trên tab (vd "Ý thức & Phối hợp ●"), "● Chưa lưu" (trạng thái lưu), chấm trạng thái (xong / đang làm / mờ). Phép kiểm `thanhPhanChung` "V22 · không chấm ●…" quét `.tsx` tìm "●" gần chữ hạn / quá hạn / chờ chấm. Ảnh `zoom-v22-cham-truoc-sau`.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Đổi tab (mọi màn) | nhiều dáng (15 px, viên mờ, chữ 12…) | một dáng; ← → Home End; 375 cuộn ngang | ĐỔI dáng |
| Mở ⋯ / menu chữ ("Chỉnh lịch", "+ MT", "Các bước") | hai thành phần (Menu / MenuDong) + menu tự viết không phím | một MenuDong, đủ phím ↑ ↓ Home End Esc; mục tắt có lý do ngay dưới | ĐỔI / THÊM phím |
| Bấm số trong dải chỉ số | ô số to, một số chỗ 0 vẫn bấm | ô số `OSo` trong dải mỏng; 0 không bấm (luật M); cùng panel / cùng đích "›" | ĐỔI dáng |
| Xem lịch sử | "Lịch sử (n)", "▸ Lịch sử", nút "Lịch sử / Ẩn lịch sử", danh sách tự viết | "Lịch sử · n" gập / mở; 0 dòng không vẽ; Khôi phục giữ | ĐỔI dáng |
| Đọc hạn ở dòng việc | chữ "⚠ 68 ngày · 08/07", "⚠ còn 2 ngày · 16/09" | viên đỏ "quá hạn 68 ngày", viên vàng "hạn 16/09" (không ⚠ — V22) | ĐỔI dáng |
| Đọc mức hạn / số quá hạn ở mọi nơi | ⚠ + màu | chỉ màu (đỏ / vàng / thường), chữ giữ nghĩa | ĐỔI (V22) |
| Mọi thao tác khác | có | có | GIỮ |

Không thao tác nào bị mất.

## 4. Lời 40
Badge 0 không vẽ; "Lịch sử · 0" không vẽ; ô dải không có dữ liệu không vẽ, cả dải trống thì không vẽ; chữ phụ "xong trễ n" chỉ khi n > 0.

## 5. Đo ✕ / ⋯ (≤ 1 px)

| Chỗ | 1440 | 375 |
|---|---|---|
| ⋯ đầu hồ sơ HV (MenuDong, so với "+ Case") | 36×36, lệch 0 | 44×44, lệch 0 |
| ✕ panel việc · Case | 36×36, lệch 0 | 44×44, lệch 0 |
| ✕ panel Xem vi phạm | 36×36, lệch 0 | 44×44, lệch 0 |
| ✕ hộp chọn em | 36×36, lệch 0,3 | 44×44, lệch 0,3 |

## 6. Hướng dẫn "?"
Test: "Nhật ký" → "Lịch sử" (`shared/huongDan/admin.ts`, `ql.ts` ×2 + EN `hdV2b.ts`, `mtVang.ts`).

## 7. Turso
0 câu, 0 request thêm (dải dùng dữ liệu đã nạp; `OSo` nguồn `dong` vẽ panel từ dòng đã có; lịch sử vẫn đọc khi mở như cũ, HopKyNang mở lại không đọc lần hai).
