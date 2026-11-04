# UI-HSHV-GON — Hồ sơ HV gọn theo luật mật độ M1–M10 (`de-xuat.md` mục 1, hạng 6 mục 3)

PTA Plan 05/11 (đêm, chủ SP uỷ quyền PTA rà / merge): màn ⑥ **Hồ sơ HV**. Bệnh (`de-xuat.md`): "6 thẻ kỹ năng đều lặp 'MT1 · kỳ vọng 6.0'. Khối Chờ duyệt 4 dòng"
(khối Chờ duyệt đã gọn ở #939). **Giữ bố cục + mọi thao tác**; dáng đồng bộ v12 / #937 / #939 / #941. Ghi chú vắng / dời đã bỏ ngoài màn Test ở #941.
Không đổi máy chủ, không thêm request. Chủ SP dặn đêm 05/11: "hạn chế text thừa, mọi thứ đẹp, gọn gàng, đơn giản hoá, logic".

Dữ liệu demo 14/09/2026: Trần Thu Hà (id 2, MB FT 101 — có Case, 3 yêu cầu chờ duyệt), Bùi Khánh Linh (id 10, lớp thường MB FOU 12). QL Nguyễn Khánh Vy (vai 2),
GVCN cô Trần Ngọc Hà (vai 7). Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh.

## Ảnh trước | sau (toàn trang)

| Màn | Ảnh |
|---|---|
| QL · Trần Thu Hà · Học thuật · 1440 tối (có khối Chờ bạn duyệt) | `truoc-sau-ql-ha-1440-toi.png` |
| GVCN · Trần Thu Hà · 1440 tối | `truoc-sau-gv-ha-1440-toi.png` |
| QL · Trần Thu Hà · Ý thức & Phối hợp · 1440 tối | `truoc-sau-ql-yt-1440-toi.png` |
| QL · Bùi Khánh Linh (lớp thường) · 1440 tối | `truoc-sau-ql-th-1440-toi.png` |
| GVCN · Trần Thu Hà · 375 sáng | `truoc-sau-gv-ha-375-sang.png` |

## Đo trước → sau (màn đầu 1440 × 900 / 375 × 812; cách đo như `de-xuat.md` mục 3)

| Màn | Từ màn đầu (cả trang) | Đậm màn đầu (số phần tử) | Đậm cả trang | Cao trang |
|---|---|---|---|---|
| QL · Học thuật 1440 | 274 (789) → **259 (756)** | 55 % (62) → **52 % (58)** | 50 % → **45 %** | 2 185 → 2 186 |
| GVCN · 1440 | 217 (231) → **194 (198)** | 63 % (89) → **56 % (77)** | 63 % → **56 %** | 1 015 → **971** |
| QL · Ý thức 1440 | 270 (286) → **255 (271)** | 47 % (47) → **43 % (43)** | 48 % → 44 % | 1 035 → 1 035 |
| QL · lớp thường 1440 | 117 (175) → 117 (175) | 51 % (41) → **46 % (37)** | 54 % → 50 % | 1 194 → 1 194 |
| GVCN · 375 | 96 (164) → **81 (133)** | 57 % (36) → **51 % (32)** | 60 % → 55 % | 1 623 → **1 473** |

## Chỗ ngợp → luật → cách sửa

| # | Trước | Luật | Sau | Thành phần |
|---|---|---|---|---|
| H1 | 6 thẻ kỹ năng: "MT2 · kỳ vọng 5.5" lặp mỗi thẻ (bảng Mock Test đã có cột Kỳ vọng; ✓ / ✗ đã so); 375 cắt "MT2 · kỳ vọn…" | M3, M2 | Dòng phụ chỉ "MT2"; "L · MT2 · kỳ vọng 5.5" ở `title` thẻ | `HanhTrinhKyNang` |
| H2 | Tiến độ trên lớp: 4 dòng "L / R / W / S · Chưa có ghi nhận" | M4, M7 | Chưa kỹ năng nào có ghi nhận → MỘT dòng "Chưa có ghi nhận" ở đầu khung; có ghi nhận thì giữ từng kỹ năng như cũ | `TienDoTrenLop` |
| H3 | Case: chip "phụ trách: **Phạm Thu Trang**" (đậm trong chip) | M10, M1 | Người = chữ mờ + biểu tượng người (`NguoiGiu`, như Công việc), "phụ trách" ở `title` | `CotCaseHv` |
| H4 | Thẻ phụ (`.the-phu`: PH · email · Sinh, chip Case / PA, tuần ghi nhận…) chữ 600 | M1 (v12 S1) | 500 mờ — đậm để cho tên / giá trị | `index.css` `.the-phu` |
| GIỮ | Đầu hồ sơ (tên, Lớp · Lộ trình · Target · Tuần học · Thi thật · GVCN · TVV — nhãn nhỏ / giá trị đậm V7), Trước / Sau, + Case, ⋯, thẻ Overall + 5 kỹ năng (bấm → Hành trình), tab Học thuật · Ý thức & Phối hợp · Lộ trình & lớp, bảng Mock Test + hàng Thi thật, Case & phương án, khối Chờ bạn duyệt (#939) | — | không đổi | — |

**Ghi chú:** `.the-phu` là lớp dùng chung (hồ sơ HV, panel Case) — 500 đúng luật M1 / v12 ở mọi nơi dùng.

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm thẻ kỹ năng → Hành trình kỹ năng · bấm Overall → bảng Mock Test | có | có |
| Xem kỳ vọng của thẻ kỹ năng | dòng phụ thẻ | rê chuột thẻ + cột Kỳ vọng bảng Mock Test |
| + Ghi tiến độ · mở / sửa ghi nhận | có | có |
| Case: mở · ▾ · Sửa · Đổi người… · ⋯ · + Thêm PA · Case đã đóng | có | có |
| Chờ bạn duyệt: Duyệt / Từ chối… / Trả lời… / Xem thêm | có | có |
| Ý thức: Xác nhận xử lý · Đề xuất QL duyệt · Khai / sửa cấp bậc · + Ghi vi phạm | có | có |
| Trước / Sau · ‹ Học viên & Lớp · + Case · ⋯ | có | có |

## Dòng đọc Turso

Không đổi máy chủ, không thêm request — chỉ đổi cách vẽ dữ liệu đã nạp (`/students/:id`, `skill-board`, `/yeu-cau?studentId=`).

## Mã chạm

`web/src/modules/students/HanhTrinhKyNang.tsx` · `TienDoTrenLop.tsx` · `CotCaseHv.tsx` · `web/src/index.css` (`.the-phu`).
