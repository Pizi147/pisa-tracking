# UI-LT-GON — Test · Lịch Test tuần gọn (M1–M10 + chủ SP 05/11 "quá hạn một hàng một lớp")

PTA Plan 05/11 sau khi merge #941: màn **Test · Lịch Test tuần**. Vòng 1 (#944) chủ SP KHÔNG duyệt — nguyên văn: "Phần quá hạn chấm sao phải phức tạp thế? …
đừng bị fixated vào cái việc phải phân ra là MT mấy MT mấy, HV cùng một lớp thì một hàng rồi bấm vào hiện lên thôi … nếu muốn thì cho thêm text dưới tên học
sinh là MT mấy là được. Và thanh lớp quá nhiều thông tin, dày đặc quá gọn bớt đi làm ơn". Vòng 2 (cùng PR):
1. Khối "Quá hạn chấm" **một hàng một lớp**; bấm hàng → lưới em của lớp (chỉ bài quá hạn), "MT1 · W4 JUL" là chữ phụ dưới tên em.
2. Thanh lớp chỉ **mã lớp · x/y bài · một viên**.
3. Màn Test nên **giữ ghi chú vắng / dời** trong lưới em. Giữ mọi thao tác. Không đổi máy chủ.

Dữ liệu demo 14/09/2026 (W3 SEP). QL Nguyễn Khánh Vy (vai 2), GV cô Trần Ngọc Hà (vai 7). Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh.
"Trước" = main (trước PR này).

## Ảnh trước | sau (toàn trang)

| Màn | Ảnh |
|---|---|
| QL · 1440 tối · mở Quá hạn chấm, **MB FT 101 mở lưới** (sau) | `truoc-sau-ql-qh-mo-1440-toi.png` |
| QL · 1440 tối · mở Quá hạn chấm + MB FT 102 (Test tuần này) | `truoc-sau-ql-qh-1440-toi.png` |
| QL · 1440 tối mặc định | `truoc-sau-ql-1440-toi.png` |
| GV · 1440 tối | `truoc-sau-gv-1440-toi.png` · mở Quá hạn + MB FT 101: `sau-gv-qh-mo-1440-toi.png` |
| GV · 375 sáng / QL · 375 sáng | `truoc-sau-gv-375-sang.png` · `truoc-sau-ql-375-sang.png` |

## Đo trước → sau (màn đầu 1440 × 900 / 375 × 812; cách đo như `de-xuat.md` mục 3)

| Màn | Từ màn đầu (cả trang) | Đậm màn đầu | Nút / ô (cả trang) | Cao trang |
|---|---|---|---|---|
| QL 1440 · Quá hạn mở | 340 (655) → **289 (444)** | 61 % → **54 %** | 70 → 67 | 1 883 → **1 624** |
| QL 1440 mặc định | 239 (361) → **227 (303)** | 52 % → 51 % | 56 → 56 | 1 257 → 1 257 |
| GV 1440 | 249 (348) → **237 (302)** | 53 % → 52 % | 42 → 42 | 1 158 → 1 158 |
| GV 375 | 88 (297) → 89 (303) | 52 % → 52 % | 40 → 40 | 2 018 → 2 018 |
| QL 375 | 91 (302) → 91 (304) | 50 % → 50 % | 54 → 54 | 2 143 → 2 143 |

- Khối Quá hạn chấm (QL): **7 dòng** (lớp · đợt · kỹ năng · còn · hạn chữ dài · GV · "Chờ chấm" · nút) → **4 hàng** (một hàng một lớp: mã · số bài · viên quá hạn · người chưa chấm · nút).
  MB FT 101: 4 dòng (MT1 W1 JUL 10 · MT1 W4 JUL 5 · MT2 W2 AUG 2 · MT1 W1 SEP 19) → 1 hàng "36 bài · ⚠ quá hạn 68 ngày"; mở ra MỘT lưới 9 hàng / 8 em
  (Lương Bảo Anh có hai lượt quá hạn → hai hàng, chữ dưới tên phân biệt).
- Thanh lớp Test tuần này: bỏ dãy kỹ năng, "vắng · chờ Quản lý duyệt dời", "hạn 23/09" → `title`; "Progress Test" / "Final Test" chỉ khi một lớp có hai hàng (MB FOU 12).
- 375: dải lớp vốn đã gọn (mã · x/y · viên) — số gần như không đổi.

## Chỗ ngợp → cách sửa

| # | Trước | Luật | Sau | Thành phần |
|---|---|---|---|---|
| T1 | Quá hạn chấm tách theo đợt / MT / tuần — một lớp 4 dòng | chủ SP 05/11 | MỘT hàng MỘT lớp: `gopNoTheoLop` (shared) gộp số bài, hạn cũ nhất, người chưa chấm, lượt; rê chuột hàng = đợt · kỹ năng đã gộp | `shared/domain/khungLichTest.ts`, `LichTestTab`, `KhoiNo` |
| T2 | Cột Đợt, Kỹ năng ("L, R, W1, W2, / S" xuống dòng), Còn tách, hạn chữ "hạn 08/07 ⚠ quá hạn 68 ngày", "● Chờ chấm" mọi dòng, "**GV chấm chéo**" đậm | M2, M3, M10, M1 | mã lớp · "36 bài" · viên "⚠ quá hạn 68 ngày" (như Công việc) · người chưa chấm chữ nhỏ mờ · nút. Không hàng tiêu đề cột | `KhoiNo` |
| T3 | "Nhập điểm" mở lưới MỘT đợt | chủ SP | Bấm cả hàng (hoặc nút) → lưới dưới hàng gồm MỌI bài quá hạn của lớp (`LuoiNhung` không lọc tuần + `chiAttempt`); lớp thường có hai bài quá hạn → hai lưới, tên bài nhỏ ở trên | `KhoiNo`, `LuoiNhung` |
| T4 | Lượt của em là cột "MT" riêng | chủ SP | "MT1 · W4 JUL" chữ phụ dưới tên em (`DongThi` có sẵn), không cột MT (`luotDuoiTen` → `anCotMt`) | `LuoiNhung`, `LuoiChamLop`, `LuoiFT` |
| T5 | Kết quả "Chờ L, R, W, S" lặp ô trống | M3 | "–" mờ, môn còn thiếu ở `title`; thẻ 375 không vẽ (đọc màn vẫn đọc) | `LuoiFT` |
| T6 | Thanh lớp: dãy kỹ năng (môn của bạn gạch dưới) · "vắng · chờ Quản lý duyệt dời" · "hạn 23/09" · x/y · viên | chủ SP, M4 | mã lớp · x/y bài · MỘT viên (ô chưa lưu > ⚠ quá hạn của người xem > Đang chấm / Chờ bạn chấm…); phần còn lại ở `title` hàng; tên bài chỉ khi lớp có hai hàng | `HangLop`, `HangNhom` (`title`) |
| T7 | Số đã chấm "**8**/27" 700 | M1 | chữ sáng 500 — đậm chỉ mã lớp | `HangLop` |
| T8 | (PTA rà 375, vòng 2) mã lớp bị cắt "MB Pre F…", "MB FOU …"; hai hàng "MB FOU 12" không phân biệt; viên "Chờ bạn chấm" tràn mép | M2 | 375: mã lớp đọc đủ (xuống dòng nếu chật, không cắt); lớp có hai hàng → tên bài chữ nhỏ mờ dưới mã; cột phải xếp chồng "x/y bài" trên · viên dưới | `HangLop` (nhánh `hep`) |
| GIỮ | Chọn tuần ‹ › · Tuần này · Tất cả / FT / Lớp thường · Xuất Excel · Lịch thi thật › · dải số · nhóm Quá hạn / Test tuần này · lưới chấm (ô điểm, "n câu", "vắng W2 SEP", "Vắng", "W4 SEP" dời, "Đã huỷ · vắng 2 lần", S Ex, GV chấm S ▾, Xem dạng bảng 375) · MT cũ chưa nhập › | — | không đổi | — |

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Quá hạn: Nhập điểm / Xem / Thu | mỗi đợt một nút, lưới một đợt | mỗi lớp một nút (hoặc bấm cả hàng), lưới mọi bài quá hạn của lớp |
| Quá hạn: mã lớp → hồ sơ lớp | có | có |
| Lưới: gõ điểm, "-", hộp nhập (W / S, nhận xét), Lưu · bài tiếp; còn ô chưa lưu → hỏi khi đóng | có | có (lớp thường hai lưới: cộng ô chưa lưu của cả hai) |
| Xem đợt / kỹ năng của dòng quá hạn | cột Đợt, Kỹ năng | rê chuột hàng; trong lưới: chữ dưới tên + cột kỹ năng |
| Biết phần nào của mình ở khối Quá hạn | viên "Chờ bạn chấm" / "Chờ GV khác" | nút "Nhập điểm" (nút chính — có phần của bạn) / "Xem" (môn người khác) — như trước nút đã phân biệt |
| Thanh lớp: mở lưới · mã lớp → hồ sơ · Lớp tiếp › | có | có |
| Xem kỹ năng / hạn / chờ duyệt dời của hàng lớp | chữ trên dải | rê chuột hàng; lưới vẫn ghi từng em |

## Dòng đọc Turso (dev, `PISA_DEM_SQL=1`, dữ liệu demo)

| Đường | Trước | Sau |
|---|---|---|
| `/cham/lich-test?…` (mở trang) | 16 câu · 488 dòng | không đổi |
| `/cham/lich-test/qua-han?…` | 7 · 298 | không đổi |
| Mở lưới một hàng Quá hạn | `/classes/:id/cham?periodId=` mỗi đợt một lần (MB FT 101 cần 4 lần để xem hết) | `/classes/3/cham` một lần: **11 câu · 868 dòng** — chỉ khi bấm mở (không gọi lúc tải trang), dưới ngưỡng ~2 000 dòng |
| Mở hàng lớp Test tuần này | `/classes/3/cham?periodId=42` 12 · 65 | không đổi |

Gộp hàng lớp chỉ tính trên `data.no` đã nạp — không thêm câu khi tải trang.

## Mã chạm

`shared/domain/khungLichTest.ts` (`gopNoTheoLop`) · `web/src/modules/test/LichTestTab.tsx` · `lichTest/KhoiNo.tsx` · `lichTest/HangLop.tsx` · `lichTest/LuoiNhung.tsx` · `lichTest/kieu.ts` ·
`web/src/modules/cham/LuoiChamLop.tsx` · `LuoiFT.tsx` · `web/src/ui/HangNhom.tsx` (`title`) · `shared/i18n/en/b.ts` · phép kiểm `prUxG` G2a (khối Quá hạn không còn nhãn trạng thái).
