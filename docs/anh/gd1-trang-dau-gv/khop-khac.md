# GD-1 — Trang đầu GV = Công việc + "Lớp của tôi" + "+ Task" (mockup ① `thiet-ke/v21/trang-dau-gv.html`, chủ SP duyệt 14/11 lời 17, 19, 20)

Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/07-plan-giao-dien-dot-1.md` dòng GD-1. Chỉnh sau duyệt (`04-thiet-ke.md` mục 12, 13) THẮNG hình mockup.
Ảnh cặp (trái mockup · phải web, demo 14/09, GVCN Trần Ngọc Hà — vai 7, `/cong-viec`):
`cap-1440-toi.png` (K1) · `cap-375-viec.png` (K8a, sáng) · `cap-375-lop.png` (K8b, sáng, bấm "Lớp của tôi").
Dữ liệu demo khác dữ liệu mockup (8 lớp mockup ↔ 12 lớp của GV 7) — không tính lệch.

## 1. Truy vết khung → thành phần → ảnh

| # | Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | K1 R1 thanh trên GV: Công việc (badge) · Học viên & Lớp · Test — không Tổng quan | `navOf` `overview` false cho GV · `khuVucHienThi` đưa Công việc lên đầu | cap-1440-toi | KHỚP |
| 2 | K1 `/` của GV → Công việc, link cũ chạy | `OverviewPage` vai `gv` → `<Navigate /cong-viec>` (giữ tham số) | bấm thử | KHỚP |
| 3 | K1 R2 đầu trang "Công việc · n việc · ⚠ m quá hạn" + Mọi hạn + **+ Task** | `HoTroHocVienTab` đầu trang (giữ) + `NutTask noi="dau"` | cap-1440-toi | KHỚP (Lọc thêm GIỮ — KHÁC-2) |
| 4 | K1 R3 hàng tab + badge; tab **Chấm Speaking** | `HangTab` · `nhanTabCv('cham-cheo')` = "Chấm Speaking" (lời 19) | cap-1440-toi (GV 7 không dạy S) | KHỚP |
| 5 | K1 R4 danh sách trái 640 (v12 / v18) | `DanhSachViec` (giữ nguyên) | cap-1440-toi | KHỚP |
| 6 | K1 R4 BỎ nhóm gập "Lớp tôi dạy"; GIỮ "Yêu cầu của tôi" | `NhomGap lop-toi-day` bỏ; `LopToiDay` (V4) xoá | cap-1440-toi | KHỚP |
| 7 | K1 R5 khung phải chưa chọn việc = **Lớp của tôi**: Lớp · Tôi dạy · Test · **Việc cần làm** | `LopCuaToi` (mới, `congViec/LopCuaToi.tsx`) | cap-1440-toi | KHỚP |
| 8 | Mục 13: nút-chip KHÔNG biểu tượng; chữ loại + số (chủ SP 15/11: "Nhập điểm · 6" như "Case · 2", không chữ "bài"); ⚠ + màu khi quá hạn; thứ tự Nhập điểm · Case · Ý thức · Vận hành | `LOAI_CHIP` | cap-1440-toi | KHỚP (mockup còn vẽ biểu tượng — mục 13 thắng) |
| 9 | Mục 13: "Lớp của tôi" KHÔNG có chip Chấm Speaking | `dungLopCuaToi` bỏ `laViecChamCheo` | — | KHỚP |
| 10 | R6 (a)(b) FT có bài: "MT · W1 SEP" + chip hạn; quá hạn đỏ | cột Test = bài gần hạn nhất của tôi (`ChipHan vien`) | cap-1440-toi (MB FT 101) | KHỚP |
| 11 | R6 (c) lớp chưa tới tuần Test: "Final · W3 OCT" mờ, không chip | `testSapToi` (LG-8 #1550) | cap-1440-toi (sau gộp #1550) | KHỚP |
| 12 | R6 (d) chỉ chủ nhiệm: không bao giờ chip Nhập điểm | chip Nhập điểm chỉ từ việc `score` của chính tôi | cap-1440-toi (MB ELE 02) | KHỚP |
| 13 | R6 (f) / R7 lớp không có gì: cuối, chữ mờ | sắp xếp (có việc → hạn sớm; rồi có Test; rồi mã lớp) + `nhat` | cap-1440-toi (MB BE 04, BE 08, FOU 03) | KHỚP |
| 14 | Bấm chip = mở panel tương ứng / sang trang | `onMo` = `mo()` sẵn có (panel tại chỗ, hoặc `href` khi việc không làm tại chỗ) | bấm thử (BE 03 → panel Nhập điểm W2 SEP) | KHỚP |
| 15 | R8 ✕ đóng panel → Lớp của tôi hiện lại | khung phải (giữ `dong`) | bấm thử | KHỚP |
| 16 | K5 R17 "+ Task" → Case · Vi phạm / Nhắc nhở · Tình hình học tập (lời 17) | `NutTask` (`MenuDong`) | bấm thử | KHỚP |
| 17 | K5 R17 ô gõ tên em, gợi ý em lớp của tôi trước, lớp bên cạnh; Tình hình ≤ 8 em "n / 8" | `HopChonEm` (`HopNeo`, `/tim/hoc-vien`) | bấm thử | KHỚP |
| 18 | K5 R18 chọn em → form đang có | `QuickReport` · `RecordViolationPanel` · `HopTinhHinh` (giữ nguyên) | bấm thử (Vi phạm → form Ghi vi phạm) | KHỚP |
| 19 | K6 tab Báo cáo PH → mục 13: nhóm "Báo cáo PH" trong tab **Vận hành** | `MUC_CV` 'bc-ph' (đã có); việc GV từ LG-3 | — (LG-3 chưa có → nhóm rỗng, ẩn) | KHỚP (mã) |
| 20 | K3 R11 đầu tab "Việc chung của nhóm GV Speaking · n bài · ⚠ m quá hạn" | `MUC_CV` nhãn + `DanhSachViec` đếm BÀI (`soBai`, `baiQuaHan` mới) | — (GV 7 không dạy S) | KHỚP (mã) |
| 21 | K7 R21 hết việc tab: khung phải vẫn Lớp của tôi | `LopCuaToi` hiện cả khi tab rỗng | — | KHỚP |
| 22 | K7 R22 GV mới: "Chưa được phân công lớp nào"; không "+ Task" | `chuaPhanCong` · `coTask` | — | KHỚP |
| 23 | K7 R23 đang tải / lỗi (Thử lại) riêng cột phải | `Skeleton` · `ErrorState onRetry` | — | KHỚP |
| 24 | K8a 375: công tắc "Việc · Lớp của tôi"; nút tròn "+ Task" trên thanh tab; thanh dưới 3 mục | công tắc `lg:hidden`, `NutTask noi="noi"` `fixed bottom-[80px]`, `chiaThanhDuoi` | cap-375-viec | KHỚP (dòng việc — KHÁC-1) |
| 25 | K8b 375: mỗi lớp một thẻ, chip cao 44 | `DongLop` `max-sm:` thẻ, chip `max-sm:h-11` | cap-375-lop | KHỚP (dải tên "Lớp của tôi · n lớp" giữ — KHÁC-3) |
| 26 | Mục 4 ghi chú: số liệu Tổng quan GV → Hồ sơ GV | `HaiKhoiGv` ở `HoSoGiaoVienPage` khi `laChinhMinh`; 3 ô số (Case, Đạt KV, Tiến bộ) đã có ở dải chỉ số Hồ sơ GV | — | KHỚP |
| 27 | Hướng dẫn "?" theo đường mới | `shared/huongDan/gv.ts` (bỏ màn Tổng quan, + Lớp của tôi, + Task; hai bảng ở Hồ sơ GV) + bản Anh | — | KHỚP |

**KHỚP 27 / 27 = 100 %** về thành phần; ba chỗ KHÁC dưới đây là phần mockup không vẽ / có lý do, không tính lệch hình.

## 2. KHÁC (có lý do)
- **KHÁC-1** 375 danh sách việc: mockup vẽ dáng v12 (vạch hạn "Quá hạn / Hạn đến…", ô thẻ phụ). Web giữ dáng dòng 375 đang chạy (đã duyệt V18) — GD-1 không đổi danh sách việc (plan: "danh sách trái giữ nguyên").
- **KHÁC-2** "Lọc thêm" (khung, chi nhánh) cạnh Mọi hạn: mockup không vẽ; GIỮ thao tác cũ (CLAUDE.md "giữ mọi tính năng").
- **KHÁC-3** 375 "Lớp của tôi": giữ dải tên "Lớp của tôi · n lớp" như 1440 (một thành phần một dáng); mockup 375 bỏ dải.
- Mockup chip có biểu tượng → web không (lời 20 ý 2, mục 13 thắng).

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Mở web (GV) | Tổng quan GV | Công việc | ĐỔI đường (5.1) |
| Ô "Việc của tôi ›" | Tổng quan GV | bỏ — trang đầu đã là việc | BỎ (thừa) |
| Bảng "Kỹ năng tôi dạy" · "Lớp tôi chủ nhiệm" (bấm số ra danh sách em) | Tổng quan GV | Hồ sơ GV của chính mình (menu tên › Hồ sơ giáo viên) | ĐỔI chỗ |
| Ô Case đang xử lý · Đạt kỳ vọng Test · Tiến bộ | Tổng quan GV | dải chỉ số Hồ sơ GV (đã có, cùng nguồn) | ĐỔI chỗ |
| Mở "Lớp tôi dạy" (gập), đổi FT / Lớp thường, bấm ô số dưới KV / SOS / Case / chờ chấm | cuối Công việc | Lớp của tôi (khung phải, không công tắc — mỗi dòng ghi kỹ năng); ô số → Hồ sơ GV | ĐỔI |
| Bấm mã lớp → hồ sơ lớp | Lớp tôi dạy | Lớp của tôi | GIỮ |
| Nhập điểm theo lớp | dòng việc | dòng việc + chip "Nhập điểm · n" của lớp (n = số bài, tooltip "n bài chờ nhập điểm") | GIỮ + THÊM lối |
| Ghi vi phạm / Báo tình hình / + Case | hồ sơ lớp / HV | "+ Task" ở trang đầu (lối cũ giữ) | THÊM |
| Tab "Speaking chấm chéo" (375: "Speaking") | Công việc | tab "Chấm Speaking" | ĐỔI chữ (lời 19) |
| Mọi thao tác khác của Công việc (tab, lọc, panel, Việc tiếp, Yêu cầu của tôi, Bỏ qua, Gia hạn…) | Công việc | Công việc | GIỮ |

Không thao tác nào bị mất.

## 4. Turso (đo trước → sau)
- Mở trang đầu GV (GVCN demo): **trước** Tổng quan 109 câu / 5 GET (`/demo/session`, `/my-work`, `/tong-quan/lop-toi-day/hai-khoi`, `/yeu-cau/dem`, `/giao-vien/7/o?cot=case-mo`)
  → **sau** Công việc **43 câu / 3 GET** (−60 %) (`TAI_TRANG['GV trang đầu Công việc']`). "Lớp của tôi" dựng từ phiên + `/my-work` đã nạp: 0 GET thêm.
- `/my-work`: thêm trường `baiQuaHan` cho việc Chấm Speaking (số đã có trong vòng lặp) — 0 câu.
- `/tim/hoc-vien?q=` (mới, chỉ khi gõ trong "+ Task", ≥ 2 ký tự, chờ 250 ms): MỘT câu đọc (≤ 40 dòng); đo 3 câu cả request, trần `tocDoDuong.ts` 13. Nhẹ hơn `/students?q=` của ô tìm thanh trên (đọc kết quả / Case từng em).
- Hồ sơ GV của chính mình thêm `/tong-quan/lop-toi-day/hai-khoi` (trước ở Tổng quan) — chỉ khi mở hồ sơ.

## 5. Phụ thuộc / chưa làm
- Cột Test lớp chưa có bài + danh sách lớp còn hiệu lực: `testSapToi` của **LG-8 (#1550, đã merge)**.
- Nhóm "Báo cáo PH" trong tab Vận hành hiện việc của **LG-3** (chưa có) — rỗng thì ẩn.
- Head tutor giữ Tổng quan góc nhìn GV tới **LG-7**.

## 6. ponytail
- `NutTask.tsx`: focus ô gõ bằng `setTimeout` sau khi `HopNeo` focus nút ✕ — đổi `HopNeo` nhận phần tử focus đầu nếu cần dùng lại.
