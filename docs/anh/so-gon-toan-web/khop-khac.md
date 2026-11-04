# SO-GON-TOAN-WEB — "số bấm được không gạch chân" thành luật toàn web (cuối đợt mật độ 05/11, `de-xuat.md` M1 + M10)

PTA Plan 05/11 (sau khi ⑤ ⑥ ⑧ ⑨ merge): dời kiểu số của Tổng quan (`.tq-v8`, #937) và Hồ sơ lớp / Phân tích / Học viên & Lớp (`.so-gon`, #941 #948 #953)
vào `LOP_OSO`, áp cho toàn web, bỏ hai lớp lẻ, ghi luật vào DESIGN.md G6. Không đổi bố cục, không đổi thao tác, không đổi máy chủ.

## Cách làm
- `LOP_OSO` (`web/src/ui/SoLieu.tsx`, dáng chung của `OSo`, `SoDen`, ô chỉ số) thêm lớp đánh dấu **`so-bam`**. Luật ở `index.css` (ngoài @layer) bắt `.so-bam` thay cho `:is(.tq-v8, .so-gon) .underline`:
  - gạch chân chỉ khi rê / focus-visible; số giữa câu ở dòng phụ `.text-xs` giữ gạch (WCAG 1.4.1); gạch CHẤM gợi ý (KCK) không bị bắt;
  - chữ 500 khi số nằm trong ô bảng (`td`) / dòng phụ `.text-xs`; quá hạn đỏ (`text-bad`, `text-late`) vẫn đậm.
- Ô `.o-so` của Học viên & Lớp ("SOS 1 · **4** HV") thêm `so-bam` → cùng luật, chữ 500. `.o-so` khác (Kế hoạch Test "Chưa có MT kế tiếp · n em" — cụm chữ, không phải số) **giữ gạch** vì không mang `so-bam`.
- Bỏ lớp `.so-gon` ở `ClassOverviewPage`, `PhanTichPage`, `StudentsPage`. `.tq-v8` GIỮ (còn các luật bố cục riêng của Tổng quan: đầu thẻ, chiều cao hàng) — chỉ bỏ khỏi luật số.
- Rà trước khi dời (Playwright, 12 trang thuộc `.tq-v8` / `.so-gon`): luật cũ chỉ bắt phần tử `LOP_OSO` + ô `.o-so` Học viên & Lớp (còn lại là gạch chấm, đã loại) → dời sang `so-bam` không làm sót / thừa ở các màn đã gọn.

## Ảnh trước | sau (toàn trang)

| Màn | Ảnh | Kết quả |
|---|---|---|
| Hồ sơ GV (QL xem cô Hà) · 1440 tối | `truoc-sau-ho-so-gv-ql-1440-toi.png` | **đổi**: gạch chân 27 → 3 (3 số giữa câu dòng phụ: "Việc 0 %", "Tiến bộ 8 %", "69 HV" — giữ), đậm 62 % → 56 % |
| Hồ sơ GV (GV tự xem) · 1440 tối | `truoc-sau-ho-so-gv-tu-xem-1440-toi.png` | đổi như trên |
| Hồ sơ GV · 375 sáng | `truoc-sau-ho-so-gv-375-sang.png` | gạch 27 → 3, đậm 50 % → 43 % |
| Kế hoạch Test · 1440 tối | `truoc-sau-ke-hoach-test-1440-toi.png` | không đổi — cụm chữ `.o-so` giữ gạch (3) |
| Tổng quan QL · Phân tích Test + SOS · Học viên & Lớp · Hồ sơ lớp › Phân tích lớp · 1440 tối | `truoc-sau-tong-quan-ql-1440-toi.png` · `truoc-sau-phan-tich-1440-toi.png` · `truoc-sau-hvl-1440-toi.png` · `truoc-sau-lop-ft-phan-tich-1440-toi.png` | **không đổi** (từ, đậm, gạch, cao trùng khớp từng số) — bằng chứng dời luật không lùi |

Các màn khác dùng `OSo`: Lịch Test (`DaiSo`, `LichTestTab`), `TyLe`, `MockTestAdmin`, `SignalList`, panel mở từ số — số bấm được ở đó cũng hết gạch khi không rê (demo 14/09 các màn này không có số > 0 trên màn đầu nên ảnh không khác).

## Thao tác TRƯỚC → SAU
Không đổi: mọi số vẫn là nút / link, cùng panel, cùng vùng bấm (`VUNG_BAM_SO`); rê / focus vẫn hiện gạch chân + nền nhấn nhạt.

## Turso
Chỉ CSS / lớp — không request mới; trước = sau.
