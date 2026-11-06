# TAI-NHANH-0711 — đo tải web trước / sau (đêm 07/11)

Cách đo như `tai-nhanh-0611.md`: `vite build` → `vite preview` (5714) + API demo cục bộ (4714, `npm run seed`). "JS mở trang" = gói chính + mảnh trang
+ mọi mảnh nó nhập tĩnh (bắc cầu) — đúng bộ tệp Vite tải trước khi vẽ trang; gzip `zlib.gzipSync` mức 9. Gốc = origin/main 5e347763b.

## Hiện trạng khi bắt đầu
- Trang đầu `/` (mọi vai): 222 KB gzip (sau TAI-NHANH-0611). Phân tích 245 KB.
- Trang nóng khác 467–542 KB: Công việc, Kế hoạch Test / Chấm Test, Học viên & Lớp, hồ sơ lớp, hồ sơ HV đều kéo mảnh `PanelViec`
  (92 KB gzip — panel một việc: lưới điểm, Case, Ý thức, Bàn giao, Xét lại…) và qua nó `StudentManagePanel` (56 KB), `NganCase` (37 KB),
  `ChuyenLopPanel`, `ClassCreatePanel`… dù panel chỉ mở khi bấm một việc.
- Request API: không URL nào gọi hai lần trong một lần mở (Công việc QL 6, Kế hoạch Test 5, hồ sơ lớp MB FT 101 13, Phân tích 7).

## PR TAI-NHANH-0711a — panel một việc tải lười

| JS mở trang (gzip) | Trước | Sau |
|---|---|---|
| Công việc | 467,3 KB | **317,1 KB (−150 KB, −32 %)** |
| Test (Kế hoạch / Chấm / Lịch) | 475,8 KB | **338,5 KB (−137 KB, −29 %)** |
| Học viên & Lớp | 485,0 KB | 442,8 KB (−42 KB) |
| Mock Test (chi tiết lượt) | 485,3 KB | 440,0 KB (−45 KB) |
| hồ sơ HV | 520,5 KB | 506,8 KB (−14 KB) |
| hồ sơ lớp | 541,6 KB | 533,5 KB (−8 KB) |
| Tổng quan `/` | 222,0 KB | 224,8 KB (+2,8 KB: rollup chia `TheYeuCau` làm hai mảnh, cùng mã) |
| Phân tích | 245,0 KB | 247,9 KB (+2,9 KB, cùng lý do) |

- Đổi: `lamTaiCho` / `moCaDong` (việc nào làm tại chỗ) tách sang `congViec/lamTaiCho.ts`; `congViec/PanelViecLuoi.tsx` bọc `PanelViec` bằng
  `lazyTai` + `Suspense`; năm nơi mở panel (Công việc, Chấm Test, thanh việc hồ sơ lớp, Học viên & Lớp, panel một em) dùng vỏ này.
  `NAP_SAN` (App.tsx) thêm mảnh `PanelViec` → 1,5 s sau trang đầu đã nạp ngầm, bấm việc mở ngay như cũ.
- Mở bằng link (`/cong-viec?viec=…`, Chấm Test tự chọn việc đầu): panel hiện sau khi mảnh tải (song song với API của trang) — không đổi chữ / thao tác.
- Request API: không đổi (cùng danh sách từng trang) → Turso không đổi.
- Bấm thử bản build 1440 tối: Công việc QL tab Case học thuật → "Phối hợp" mở panel Báo PH; mở thẳng `?viec=baoph:25`; hồ sơ lớp MB FT 101;
  Kế hoạch Test; GV Trần Ngọc Hà Chấm Test tự mở lưới "Nhập điểm · W1 JUL". Không lỗi console.
