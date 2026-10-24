# UI-HV-LOP-TVV — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (L1 + L5 + Đ1 của `docs/superpowers/specs/2026-10-24-cham-lai-v5.md`)

Khung: **bảng V5 của #548** (`thiet-ke/v5/dieu-chinh-cuoi.html` khu d, truy vết `docs/anh/ui-hv-lop/khop-khac.md`) — TVV / CX không có mockup riêng;
PR này đưa hai vai vào CÙNG `TrangTheoLop` (QL / GV / Admin) + phần của vai (phạm vi, chip, cột Phụ huynh, ⋯ theo vai). Không đổi máy chủ, không đổi quyền.

Ảnh cặp mockup khu d | web (`scripts/anh-cap.mjs`, DB demo cục bộ `npm run seed` — không commit; vai 23 TVV Nguyễn Thu Hương · 24 CX Vũ Thanh Tâm):
- `tvv-1440-toi` · `tvv-1440-sang` · `tvv-375` — TVV "HV của tôi" · Tất cả (4 em; Đinh Ngọc Quyên có nhãn "Có KQ · chờ bước tiếp").
- `cx-1440-toi` · `cx-1440-sang` · `cx-375` — CX mọi chi nhánh · Tất cả (140 em, phân trang 10).

**Đ1 — 375:** chiều cao `main` TVV **1 268 px** (trước 9 040), CX **2 190 px** (trước 8 712); không cuộn ngang (scrollWidth 375).
**1440:** bảng vừa khung (1 398 / 1 398 px, ⋯ không khuất) — TVV hẹp bớt Học viên / Lộ trình / MT / Ý thức để có chỗ cột Phụ huynh; CX không có cột Việc nên Phụ huynh là cột giãn.
1280 cuộn ngang như bảng QL (#548, 1 342 px) — không đổi.

**Bấm thử (Playwright, 1440):** link Tổng quan TVV `phamVi=cua-toi&view=cho-buoc-tiep` → chip bật, 1 HV, Xuất · 1 HV; `thi=1` → 1; `view=da-thi` / `thieu_tt` → chip bật, 0. CX `view=da-thi` → 1, `view=cho-buoc-tiep` → 2,
`view=can-chu-y` → 72, `cn=2` → 8, `view=sos` → Đang SOS 57. ⋯ TVV / CX: Sửa thông tin · Tạm dừng / Thôi học · Kết quả thi thật · Mở hồ sơ. QL: tab Tất cả 100 = dải 100 HV = Xuất · 100 HV (L5).

**Rà:** `impeccable detect` 0 phát hiện; web-design-guidelines: nút / link có nhãn, SĐT `<a href="tel:">`, số `tabular-nums`, lọc trên URL, chữ dài `truncate`, vùng bấm 375 ≥ 44 px.

## Truy vết khung → thành phần

| # | Khung V5 (#548) / luật | Thành phần web (sau PR) | Kết quả |
|---|---|---|---|
| 1 | Tiêu đề · Xuất · + Thêm học viên · ⋯ (+ Lớp mới) | `TrangTheoLop` đầu trang (chung mọi vai) | KHỚP |
| 2 | Tab Tất cả · Đang SOS · Lịch thi (không "Cần làm") | `HangTab` | KHỚP — "Cần làm" TVV bỏ (việc ở Công việc TVV #540) |
| 3 | Dải lọc: tìm · phạm vi · chi nhánh · chương trình · lớp | `locChung`; phạm vi theo vai: TVV **HV của tôi** (mặc định) · Chi nhánh; CX **Tất cả** (mặc định) · Chi nhánh | KHỚP |
| 4 | Chip "Thi tháng này" · "Có việc quá hạn" · "Đã thi · chờ kết quả" · Bộ lọc thêm | như QL; CX không có "Có việc quá hạn" (CX không có Công việc) | KHỚP |
| 5 | (vai) chip Cần chú ý · Tạm dừng · Sắp thi · Thiếu thông tin · Chờ chọn bước tiếp | `CHIP_VAI_TRANG`, tập = `chipHocVien` (`/hoc-vien-lop/theo-vai`, cùng số ô Tổng quan); hai chip cuối chỉ hiện khi có em | KHỚP (giữ V4) |
| 6 | Bảng: Học viên · Lộ trình · MT gần nhất · Xu hướng · Hỗ trợ · Ý thức · Lịch thi · Việc · ⋯ | `BangHvGon` (CX bỏ cột Việc) | KHỚP |
| 7 | (vai) cột **Phụ huynh** (tên + SĐT bấm gọi) | `OPhuHuynh` (dùng lại) | KHỚP (L1) |
| 8 | (vai) nhãn "Đã thi · chờ KQ · hạn" / "Có KQ · chờ bước tiếp" bấm mở panel một em | `OLich` dưới chip Lịch thi → `PanelMotEm` | KHỚP (giữ V4) |
| 9 | (vai) em Tạm dừng / chưa xếp lớp vẫn có dòng | dòng thêm từ `theo-vai` (cuối danh sách; chữ "· Tạm dừng" ở dòng phụ) | KHỚP (giữ V4) |
| 10 | 375: thẻ em gọn + dòng Phụ huynh | `TheHvGon` | KHỚP (Đ1) |
| 11 | L5: tab · dải "n HV · m lớp" · phân trang · "Xuất Excel · n HV" cùng một tập | em đã kết thúc học (mờ ở lớp cuối) tính ở cả bốn, mọi vai | KHỚP |
| — | BỎ | bảng V4 nhóm theo lớp (`HocVienTheoVai`), góc Cần làm TVV + `BangCanLam`, cột "Cần chú ý" (lý do), cột "Kết quả gần nhất" kiểu "3/4 môn đạt" | BỎ (L1) |

## Thao tác TRƯỚC → SAU (luật 8b)

| Thao tác V4 (TVV / CX) | Sau PR | Ghi chú |
|---|---|---|
| ⋯ Sửa thông tin · Tạm dừng / Thôi học · Quay lại học · Kết quả thi thật · Mở hồ sơ | **GIỮ** — ⋯ cuối dòng `mucDongTheoVai`, quyền theo chính em (máy chủ `student.edit_info` / `edit_more`) | |
| Nhãn sau thi bấm → panel một em (Nhập KQ / Chọn bước tiếp / Gia hạn) | **GIỮ** ở ô Lịch thi | |
| Góc Cần làm TVV: Chọn bước tiếp · Kết quả thi thật · Thiếu email · Thiếu thông tin | Công việc TVV (Sau thi · Bổ sung hồ sơ, #540); ở trang này còn chip **Chờ chọn bước tiếp** · **Thiếu thông tin** + ⋯ Sửa thông tin / Kết quả thi thật | chủ SP bỏ "Cần làm" (22/10) |
| Chip Cần chú ý · Tạm dừng · Sắp thi · Đã thi · chờ KQ · Thiếu thông tin · Chờ chọn bước tiếp | **GIỮ** (cùng tập `chipHocVien`) | |
| Đang SOS (bảng + panel một em) | **GIỮ** — bảng SOS V5 (`BangSosGon`), bấm "n Case · m PA" mở panel | cột SOS riêng của vai (Phụ huynh, TVV) không còn — xem ở tab Tất cả |
| Lịch thi | **GIỮ** (`GocLichThi`, cùng phạm vi) | |
| Xuất Excel · n HV | **GIỮ** (+ chọn cột, phạm vi rộng) | |
| + Lớp mới · + Học viên | **GIỮ** (+ Lớp mới vào ⋯ đầu trang như QL) | |
| Tìm · Phạm vi · Chi nhánh | **GIỮ** | |
| Phân trang (theo lớp) | **GIỮ** (theo em, như V5) | |
| Nhóm lớp mở / gập, đầu nhóm "tuần n/m · n em của tôi" | Ô "Lớp" → dải lớp (mã · chương trình · GVCN · badge của vai) | như QL (#548 XM-1) |
| — (mới) | Thi tháng này · Có việc quá hạn (TVV) · Bộ lọc thêm · Xếp: Cần chú ý trước · Chương trình | nâng cấp theo bảng V5 |

## [XM] — hỏi PTA Plan
1. **CX mở ở "Tất cả"** (V4 mở sẵn chip Cần chú ý để không vẽ 1 000+ dòng): bảng V5 phân trang nên không còn lý do đó; link `view=can-chu-y` vẫn mở đúng chip. Giữ hay mở sẵn Cần chú ý?
2. **Em Tạm dừng / chưa xếp lớp** (ngoài danh sách lớp V5) chỉ có tên · lớp · dự kiến thi · Phụ huynh · ⋯ (không MT gần nhất / Hỗ trợ — máy chủ V5 chỉ đọc em đang học). Đủ chưa?
3. TVV / CX không có "Lưu trữ" ở ⋯ đầu trang (V4 không có; giữ quyền như cũ).
