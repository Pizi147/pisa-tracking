# TAI-NHANH-0611 — đo tải web trước / sau (chủ SP 06/11 khuya)

Cách đo như `tai-nhanh-0211.md`: `vite build` → `vite preview` (cổng 5371) + API demo cục bộ (4371, `npm run seed`); gzip = `zlib.gzipSync` mức 9 trên
`dist/web/assets`. "Trang đầu" = tệp JS tải trước khi request API cuối của trang đầu xong (sau đó `NAP_SAN` nạp ngầm các trang khác, không chặn).
Gốc = origin/main 9f1f32337.

## Hiện trạng khi bắt đầu
- 9 tài khoản (QT, QL, GVCN, GVBM, TVV, CX, Admin, Head tutor) mở trang đầu `/` đều tải CÙNG một bộ mảnh: gói chính + `OverviewPage` và mảnh nó kéo theo.
- JS trang đầu: **276,7 KB gzip** (02/11 sau TAI-NHANH-2: 249 KB) — tăng vì từ #1025 trang đầu kéo theo các panel chỉ mở khi bấm:
  - thẻ Chờ duyệt (`TheYeuCau`) nhập tĩnh `ChuyenLopPanel` (→ `ClassCreatePanel`, `LuoiTaoLop`, `PeoplePicker`) + `DeXuatSuaPanel`;
  - ô số (`OSo`) nhập tĩnh `BangLuotPanel` (panel bảng có điểm);
  - thanh trên nhập tĩnh `PanelHuongDanManNay` → toàn bộ nội dung Hướng dẫn 7 vai (`shared/huongDan/*.ts`, ~120 KB mã) — và hai đường phụ cũng kéo
    `huongDan/index.ts` (có lệnh `t()` cấp mô-đun nên không rung cây được): `ToKhop` (lấy `boDau`), `useDaXemHd` (nằm chung tệp `MucHuongDan`).
- `xlsx` (139 KB gzip) đã nạp lười ở mọi nơi (`await import('xlsx')`). Mảnh tiếng Anh `en-*.js` chỉ khi trang tiếng Anh.
- Request trùng (cùng URL hai lần) ở trang đầu 8 vai: không có.
- Thời gian dựng: trang Học viên & Lớp, Lịch Test, Công việc, Phân tích (QL, bản build, máy cục bộ không giới hạn) — không có long task (> 50 ms).

## PR TAI-NHANH-0611-1 — panel chỉ mở khi bấm → mảnh riêng

| Gói | Trước (gzip) | Sau (gzip) |
|---|---|---|
| `index-*.js` (gói chính) | 198,0 KB | 169,0 KB |
| JS trang đầu (mọi vai, 10–11 tệp) | **276,7 KB** | **221,6 KB (−55 KB, −20 %)** |
| CSS | 32,5 KB | 32,5 KB |

- Đổi: `TheYeuCau` → `lazyTai` cho `ChuyenLopPanel`, `DeXuatSuaPanel`; `OSo` → `lazyTai` cho `BangLuotPanel` (nhãn `loaiBangLuot` tính trong mảnh);
  `Header` → `lazyTai` cho `PanelHuongDanManNay`; `boDau` dời sang `shared/huongDan/kieu.ts` (index re-export); `useDaXemHd` sang `huongDan/daXemHd.ts`.
- Không đổi hình / chữ / thao tác. Panel mở lần đầu: mảnh thường đã có sẵn (NAP_SAN nạp ngầm các trang dùng chung mảnh) → mở ngay; nếu chưa có,
  khung trống tới khi mảnh tải xong (vài chục ms), như `PanelGvTre` đã làm.
- Bấm thử bản build: nút "?" mở Hướng dẫn đúng vai · ô tìm "quang huy" tô chữ khớp · thẻ "Đề xuất chuyển lớp" → Duyệt… mở panel Chuyển lớp ·
  ô số Phân tích → panel "SỐ · BÁO CÁO HV" đúng nhãn. Không lỗi console.
- Request API: không đổi (8 vai đo lại, cùng danh sách).

## PR TAI-NHANH-0611-2 (#1089) — Phân tích một chi nhánh không tải hai lần
Tài khoản một chi nhánh mở `/phan-tich` chưa có `cn`: tab tải "mọi chi nhánh" rồi tải lại sau khi effect gắn `cn`. Nay chờ `cn` (khung xám) rồi mới tải.

| Mở trang (QL Monbay) | Trước | Sau |
|---|---|---|
| Báo cáo HV | 8 request (`/tong-quan/v5?…&kemBaoCao=1` hai lần) | 7 |
| Test + SOS | 11 request (`/phan-tich/tong-hop` hai lần, 2 `/ref/classes` thừa) | 8 |

Turso: bớt một lượt dữ liệu chính mỗi lần mở (Báo cáo HV: một `/tong-quan/v5` ≈ 52 câu, ~2 700 dòng bộ demo).

## Rà thêm, không thấy việc đáng làm
- Request trùng: trang đầu 8 vai, Học viên & Lớp, hồ sơ lớp (13 GET), hồ sơ HV, Lịch Test, Công việc, Phân tích — không URL nào gọi hai lần (ngoài lỗi PR 2).
- Bảng lớn: không long task > 50 ms ở bản build (máy cục bộ không giới hạn); trang lớn nhất (hồ sơ lớp MB FT 101, 33 em) ~1 700 phần tử DOM.
  Ở CPU ×4 ước < 200 ms — dưới ngưỡng dừng, không ảo hoá / memo thêm.
- `/my-work` gọi ở mọi trang của QL / QT / Admin / GV (số "việc của tôi" trên thanh trên) — thuộc máy chủ (GIAM-DOC), không sửa ở đây.

## Đã thử, KHÔNG làm (lợi < ~20 KB gzip trang đầu)
- Nạp lười `WelcomePage` (đăng nhập / đăng ký, kéo `ChonKyNang` của `ProfilePage`): ~28 KB mã ≈ 8 KB gzip; người chưa đăng nhập thêm một request nối tiếp.
- `LichNho` (lịch nhỏ, 15 KB mã) nằm gói chính qua `Filters` / `ONgay` — trang đầu dùng ô chọn tuần, tách ra lợi ~4 KB.
- `@remix-run/router` + `react-dom` (~300 KB mã) là nền, không tách được.
