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
