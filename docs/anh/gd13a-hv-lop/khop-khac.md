# GD-13a · Học viên & Lớp — Tất cả + Đang SOS · khớp / khác mockup ⑥

Nguồn: `12-plan-giao-dien-dot-3.md` dòng GD-13a · mockup `thiet-ke/v21/hoc-vien-lop.html` (K1, K2, K2b, K3, K7, K8a) + `hoc-vien-lop-ghi-chu.md` · luật V22, lời 35 / 36 / 40.
Ảnh TRƯỚC (web cũ, seed): `thiet-ke/v21/anh/hoc-vien-lop/truoc/k1…k8a-*.png`. Ảnh cặp mockup │ web (sau): `cap-*.png` trong thư mục này. Tài khoản demo tên giả: GV Trần Ngọc Hà (7) · QL Nguyễn Khánh Vy (2) · Quản trị (1).

## 1. Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần (nguồn chuẩn) | Web sau PR | Ảnh | Kết quả |
|---|---|---|---|---|---|
| 1 | K1, K2, K3 | Đầu trang: tên · Xem · FT / LT · **Lưu trữ n ›** · Xuất Excel · + Thêm học viên · ⋯ | "Lưu trữ n ›" link ra ngoài ⋯ (số = lớp + HV), chỉ GV / QL / Quản trị / Admin ([XM-2], không đổi quyền) | cap-k1, cap-k2 | KHỚP |
| 2 | K8a | 375: "Lưu trữ ›" + ⋯ trên đầu trang; Xuất / + Thêm trong ⋯ | ⋯ chuyển từ hàng lọc lên đầu trang cạnh Lưu trữ | cap-k8a-gv, cap-k8a-ql | KHỚP |
| 3 | mọi | Thanh tab chuẩn, số mờ | `HangTab` sẵn có (GD-4) | cap-k1 | KHỚP |
| 4 | K2, K2b | Ô **Xem** = ô chọn có tìm, nhãn "Xem" · giá trị · ▾, nhóm Chi nhánh · Khác | `ChonNguoi nhan="Xem"` (thay `<select>`), giữ URL `phamVi` / `cn` | cap-k2-qt, cap-k2b-qt | KHỚP |
| 5 | K1–K3 | Hàng lọc MỘT thứ tự: Tìm · Mọi lớp · Mọi TVV · vạch · lọc riêng tab · phải | Tất cả và Đang SOS cùng thứ tự; Tìm 260, ô 176 như mockup | cap-k1, cap-k3 | KHỚP |
| 6 | K1, K2 | **Mọi lớp** có cả ở Tất cả ("Lớp của tôi" trước, ✕ bỏ) | `ChonLop` (GD-5) thay chip "lớp ✕" | cap-k2-ql | KHỚP |
| 7 | K1, K3, K2b | **Mọi TVV** ở Tất cả + Đang SOS ("Tôi" trước, "Chưa có TVV" cuối, phụ = số em) | `ChonLoc` (GD-5), URL `tvv` | cap-k1, cap-k3 | KHỚP |
| 8 | K1, K3 | Chip `.nut-chon`: chữ dim 500, số 600; bật viền nhấn; số 0 viền ĐỨT không bấm | `.loc-hvl .nut-loc` (Tất cả + SOS); SOS dùng chung `chipLoc` | cap-k1, cap-k3 | KHỚP |
| 9 | K1, K2 | **Mở tất cả** / **Bỏ lọc** / **Xoá lọc thêm** là nút nhỏ (R6.4) | `btn btn-sm nut-nho` (30 px, 375: 44) | cap-k1, cap-k2 | KHỚP |
| 10 | K2 | Dòng "Đang lọc … — n HV ở m lớp" + Bỏ lọc | giữ, thêm tên TVV đang lọc | cap-k2-ql | KHỚP |
| 11 | K1 | Một tên cột **Việc cần làm**: nút-chip "{loại} · {số}" mỗi loại, chỉ việc của người xem, không việc = ô trống | `OViecCan` = `chipViecEm` + `NutChipViec` (chip chuẩn GD-4b, dùng chung Công việc / hồ sơ lớp) | cap-k1 | KHỚP |
| 12 | K3 | Đang SOS cột cuối "Việc cần làm" (thay "Việc tiếp") | cùng `OViecCan` | cap-k3 | KHỚP |
| 13 | K1 | Bấm chip = panel việc tại trang, "Việc tiếp" đi hết loại | `PanelViec` + `onTiep` theo `ds` của chip; Case → panel một em (như cũ) | web-k1-panel-viec | KHỚP |
| 14 | K1, K8a | Đầu lớp: SOS + **chip "Việc cần làm" của lớp** (việc CỦA TÔI ở lớp, loại + số, bấm làm tại trang); số không phải việc của tôi = thẻ đếm | `chipViecLop` + `NutChipViec` (cùng hồ sơ lớp GD-6) từ `/my-work` đã nạp; Nhập điểm → panel nhập điểm lớp tại trang, loại khác → panel việc ("Việc tiếp" theo loại); có chip Nhập điểm thì ẩn badge "Chờ chấm" trùng số; QL giữ `ChipBadgeLop` "Chờ chấm · n ›" | cap-k1, cap-k8a-gv, web-k1-nhap-diem-lop | KHỚP (PTA rà #1685 ý 1, 3) |
| 15 | K1 | Dải 5 môn: MT · Hỗ trợ · **Ý thức** · "Việc cần làm · n" | thêm khối Ý thức (bậc viết đủ / "Chưa có vi phạm"); đổi tên khối việc | cap-k1 | KHỚP |
| 16 | K1 | ⋯ em: nhóm **"+ Task"** (Case · Vi phạm / Nhắc nhở) rồi vạch, Nhập điểm · Xác nhận xử lý · Sửa thông tin · Đề xuất chuyển lớp | `useThaoTacDongHocVien.mucCua`: tiêu đề nhóm + tên như nút "+ Task" (cũng áp ở ⋯ dòng hồ sơ lớp — cùng thành phần) | web-k1-menu | KHỚP (xem KHÁC 2) |
| 17 | K1 | Ô Lịch thi là chữ ("Chưa có lịch" dim · "Dự kiến 01/2027") | `.bang-hv` bỏ viên viền cho chưa có / dự kiến; lịch đã chốt / đã thi giữ chip | cap-k1 | KHỚP |
| 18 | K7 | Rỗng một dòng + nút đi tiếp | bỏ câu `hint` ("Bỏ bớt từ khoá…", "Học viên có TVV là bạn…", "Tài khoản này chưa có…"); giữ nút | cap-k7 | KHỚP |
| 19 | K8a | 375: lớp thẻ gập, em thẻ, chip 44 | `TheHvGon` sẵn có + chip `NutChipViec` (44 ở 375) | cap-k8a-gv | KHỚP |
| 20 | K8a | 375: ô lớp / TVV vào nút "Lọc", mỗi ô nửa hàng | `max-sm:w-[calc(50%-4px)]` | — | KHỚP |
| 21 | — | BỎ: chip "lớp ✕" (thay bằng ô Mọi lớp) · mục ⋯ "Lưu trữ" (thay link) · ô "+n việc" (thay chip) · ô "Việc tiếp" SOS (thay chip của tôi; tình trạng Case vẫn ở cột Case · PA) | — | — | BỎ có lý do |

**KHỚP 20 / 20 dòng có thành phần (100 %)**; dòng 21 là danh sách BỎ.

## 2. KHÁC (có lý do)

1. **Đầu lớp — QL**: mockup vẽ thẻ đếm "4 bài chờ chấm" không bấm; web giữ `ChipBadgeLop` "Chờ chấm · n ›" (GD-6) bấm sang Lịch Test — lối vào sẵn có, không bớt thao tác.
8. **Ô hẹp không "…"** (PTA rà #1685 ý 2 + rà lại): Lộ trình em chưa có Target ghi "Target —" (không kèm KCK); ô Lộ trình xuống dòng thay vì cắt ("LT1 · MT 1/3", "Preliminary English Test"); ô Ý thức chỉ chip bậc ("REPORT 5"), mốc "+ MEETING …" ở hộp mở; cột Ý thức 100 → 116 px (chip REPORT cần ~113), Lịch thi 150 → 134 (ô nay là chữ), tổng cột cố định giữ 956. Đo trên web (Quản trị, mọi lớp FT + Lớp thường): 0 ô tràn. Ảnh `zoom-k1-y-thuc-gv-1440-toi.png`.
2. **⋯ em — "Tình hình học tập"**: mockup có mục thứ ba trong "+ Task"; ⋯ dòng chưa có hộp Tình hình cho một em (hộp neo ở nút "+ Task" đầu trang / hồ sơ). Không thêm thao tác mới trong PR này — đã có ở "+ Task" trang đầu, hồ sơ lớp, hồ sơ HV. → backlog.
3. **Ô Xem**: mockup ghi phụ "22 lớp · 214 HV" từng chi nhánh — web không có số theo chi nhánh trong dữ liệu đã nạp; thêm sẽ cần câu đọc mới (Turso) → không vẽ.
4. **V22**: mockup vẽ "⚠ Nhập điểm 21", "⚠ Case 2" — web chỉ màu đỏ (luật V22, không ⚠).
5. **Ô Mọi lớp đã chọn** hiện tên + dòng phụ (chuẩn GD-5 ⑤ A3); ở bề rộng 176 dòng phụ bị cắt "…".
6. Dải dưới hàng: không có ô Overall và "↑↓ so MT2" như mockup — dải hiện có (U04), ngoài phạm vi R6.x.
7. ⋯ đầu trang của GV ở 1440: menu không còn mục nào (Lưu trữ ra ngoài; GV không tạo lớp) nên nút ẩn — mockup vẽ ⋯ rỗng.

## 3. Thao tác TRƯỚC → SAU

| # | Thao tác TRƯỚC | SAU | Mất? |
|---|---|---|---|
| 1 | ⋯ đầu trang › Lưu trữ (GV / QL / Quản trị / Admin) | link "Lưu trữ n ›" đầu trang (cả 375) | không |
| 2 | Ô Xem `<select>` | ô chọn có tìm, cùng URL | không |
| 3 | Chip "MB FT 105 ✕" (link cũ `classId`) bỏ lọc lớp | ô Mọi lớp: chọn lớp / ✕ bỏ — nay chọn được cả ở Tất cả | không (thêm) |
| 4 | — | Lọc TVV ở Tất cả + Đang SOS (URL `tvv`) | thêm |
| 5 | Chip Thi tháng này · Có việc quá hạn · Đã thi · chờ KQ · chip vai · Bộ lọc thêm | giữ, dáng ⑥ | không |
| 6 | Link "Mở tất cả" ↔ "Thu gọn tất cả" · "Bỏ lọc" · "Xoá lọc thêm" | nút nhỏ, cùng việc | không |
| 7 | Ô "Việc của tôi": bấm việc gấp nhất → panel / trang | chip mỗi loại → việc gấp nhất của loại đó (panel, "Việc tiếp" đi hết loại) | không |
| 8 | "+n việc" → mở dải dưới hàng | mọi việc thấy ngay thành chip; dải vẫn mở bằng ô MT, liệt kê từng việc | không |
| 9 | Đang SOS: ô "Việc tiếp" (việc tiếp của Case, chỉ xem) | chip việc của tôi (bấm làm); tình trạng Case (Quá hạn / Chưa có PA / Đang làm) vẫn ở cột Case · PA, bấm "n Case · m PA" mở panel một em | không |
| 10 | Đang SOS: chip Tất cả · SOS 3/2/1 · PA quá hạn | giữ (số 0 không bấm, như Tất cả) | không |
| 11 | ⋯ em: + Case · + Ghi vi phạm · Xác nhận xử lý · Nhập điểm · Sửa thông tin · Chuyển / Đề xuất chuyển lớp · Cuối khoá | giữ đủ; Case · Vi phạm / Nhắc nhở dưới tiêu đề "+ Task" | không |
| 12 | 375: ⋯ trang ở hàng lọc (Tất cả) | ⋯ trên đầu trang (mọi tab) | không |
| 13 | Rỗng: Xem cả chi nhánh · Tìm ở Mọi chi nhánh · Tìm ở FT / LT · Bỏ tìm · Bỏ lọc | giữ, bỏ câu giải thích | không |

**Mất thao tác: không.**

## 4. Đo

- **✕ / ⋯ (tâm ký tự so tâm nút)**: ⋯ trang 36 × 36 · ⋯ dòng / lớp 32 × 32 (8 chỗ) · ⋯ 375 44 × 44 (36 chỗ): lệch ngang 0, dọc 0,75 px; ✕ ô Mọi lớp 28 × 28: 0 / 0 → **≤ 1 px**.
- **Turso**: không thêm request, không sửa máy chủ. Mở trang (GV / Quản trị / tab SOS) trước và sau cùng: `/hoc-vien-lop?…&kem=sos` · `/my-work` · `/ref/branches` (+ `/yeu-cau/dem` của vai duyệt). Lọc TVV dùng `tvv` đã có trong `hocVien` và `DongSos`; chip việc dùng `/my-work` đã nạp.
- **impeccable detect** (5 tệp): 0 lỗi, 1 ghi chú cỡ 14 px có sẵn (OYThuc). **web-design-guidelines**: đạt (nút biểu tượng có nhãn, vạch `aria-hidden`, placeholder "…", lọc trên URL, rỗng có lối đi tiếp).
