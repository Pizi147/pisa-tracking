# Truy vết — `test.html` (Chấm Test · Lịch tuần · Kế hoạch Test)

> V5-B2, dựa trên nền V5-A (`v5-nen.css`, `du-lieu-demo.md`). **ĐỀ XUẤT THIẾT KẾ** — chờ chủ SP duyệt. Dữ liệu demo, hôm nay T2 14/09/2026 · W3 SEP.
> Rà mã: [`../../docs/superpowers/specs/2026-10-22-overhaul-v5/b2-ra-soat.md`](../../docs/superpowers/specs/2026-10-22-overhaul-v5/b2-ra-soat.md) mục 1.
> Mở khung bằng thanh "Khung demo" đầu trang hoặc tham số `?vai=…&tab=…&nhom=…&khung=…&tuan=…&theme=dark`.
> Nhãn: **[CHỐT]** brief C.. / T.. · **[ĐX]** đề xuất V5-B2 · **[XM]** cần xác minh.

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Khung (ảnh `anh/`) | Thành phần / cách thể hiện |
|---|---|---|
| C14 thứ tự Quá hạn → Hạn tuần này → Bài thi Speaking tuần này (mở) → Hạn tuần sau (gập) | `test-cham-1440-sang`, `-toi`, `test-cham-ha-1280` | Danh sách trái 440 px, 4 nhóm cố định; nhóm trống vẫn hiện tên + "Không có …" (một dòng, không khối to); nhóm Speaking là `<details open>`, Hạn tuần sau `<details>` gập, ghi "n nhóm · m bài" ở tiêu đề |
| C14 "Speaking theo tuần thi, không theo tuần hạn"; một bài một bản ghi | `test-cham-1440-sang` | MB FT 101 MT3 S (hạn 23/09) nằm ở nhóm Speaking, **không** lặp ở Hạn tuần sau; dòng ghi "Tuần thi W3 SEP" |
| C12 / T03 GV có S, không dạy S | `test-t03-huong-1440` | Cô Đỗ Thu Hương: "Của tôi: 0 nhóm · 0 bài", "Có thể chấm: 36 bài Speaking"; mỗi dòng có badge "Chấm chéo · không tính nợ" |
| T02 GV chỉ dạy một kỹ năng | `test-t14-khoa-1440` | Thầy Khoa: MB FT 101 MT3 **W1** 22 bài (ghi "W2 · Cao Khánh Linh — không tính vào bài của bạn"), MB FT 102 MT2 **W** 14 bài (ghi "L, R của cô Linh, S của cô Trang không tính") |
| T14 hạn tuần sau gập, không đỏ | `test-t14-khoa-1440`, `test-lich-1440-sang` | Khoa: 2 nhóm ở Hạn tuần sau, gập, badge xám "Hạn 23/09"; khu chấm không tự mở nhóm gập. Lịch: ô tiến độ xám + "chưa tới hạn" |
| Khu chấm tại chỗ, chỉ cột GV xử lý được + bối cảnh | `test-cham-*`, `test-cham-375` | Bảng HV · KV · điểm lượt trước (bối cảnh) · ô nhập lượt này · trạng thái; hàng đang sửa mở dưới hàng: nhận xét + nguyên nhân (chỉ khi dưới KV) |
| "Lưu" ở lại · "Lưu và tiếp" chuyển sau khi lưu xong (brief 5.3) | `test-dang-luu-1440`, `test-da-luu-1440`, `test-loi-luu-1440` | Chân khu chấm dính đáy: ● Chưa lưu / ⟳ Đang lưu (nút khoá) / ✓ Đã lưu 10:42 + "Em tiếp: … ›" / ⚠ Chưa lưu được — giữ chữ + "Thử lại" (T15) |
| Thiếu nhận xét bắt buộc ≠ xong (brief 8.1) | `test-thieu-nhan-xet-1440` | Ô có điểm + badge "⚠ Thiếu nhận xét · Có điểm nhưng chưa tính xong"; nút Lưu khoá; đếm tiến độ không cộng bài này |
| T05 chuỗi "-" theo #503 | `test-cham-1440-sang` (cô Trang, MB FT 101 S) | Nguyễn Minh An "Vắng lần 1 · dời W4 SEP" (badge lịch); Trần Thu Hà "Đã huỷ · vắng 2 lần" + dòng chuỗi "W2 SEP – → dời → W3 SEP – · QL đề nghị dời lại, chờ duyệt" |
| MT cũ "-" = huỷ ngay + Hoàn tác 10 s (quyết định 22/10) | `test-mt-cu-hoan-tac-1440` | Toast đáy "Đã huỷ S · MT2 … (MT cũ) · QL nhận chuông để biết" + "Hoàn tác · 10 s" |
| Lớp thường tự lưu khi rời ô | `test-lop-thuong-tu-luu-1440` | Cùng khu chấm; ô /25 có ✓ / ⟳ / ⚠ ngay cạnh ô; chân ghi "✓ Đã lưu 4 ô · 10:42"; không "Lưu và tiếp" (không có nhận xét bắt buộc) |
| C13 Lịch tuần một tuần + chuyển tuần | `test-lich-1440-sang`, `-toi`, `test-lich-tuan-cu-1440`, `test-lich-tuan-rong-1440` | Thanh "‹ W2 SEP · W3 SEP tuần này · W4 SEP ›" + "Về tuần này"; dòng = lớp × lượt; ô kỹ năng "L 1/22 Hà" |
| C13 QL / Admin thấy tình trạng chấm trong lịch; quá hạn còn thiếu mới đỏ | `test-lich-qt-qua-han-1280`, `test-lich-tuan-cu-1440` | Dải "⚠ Quá hạn còn thiếu: BC FT 205 · MT2 · S 0/11 · hạn 09/09 · Xem W1 SEP ›"; ô kỹ năng đỏ + ⚠ chỉ khi quá hạn và thiếu; đủ = ✓ xanh |
| C13 vẫn chấm ngay trên lịch theo quyền | `test-lich-gv-1440`, `test-lich-1440-sang` | GV: "Nhập điểm L, R" (phần mình viền nhấn); QL: "Nhập điểm" (có quyền override — `permissions.ts:612-619`) / "Nhắc chấm" ở dòng quá hạn |
| Chỉ xem | `test-lich-chi-xem-1440` | CX: dải "Chỉ xem · CX không có quyền nhập điểm", không nút |
| C20 / T04 mặc định 3 MT, không gợi ý MT4, QL thêm tay | `test-ke-hoach-t04-1440`, `test-ke-hoach-375` | CP FT 110: "Xong 3 MT · 10/10 HV"; cột MT4 chỉ hiện vì Hồ Thanh Tùng có MT4 "W1 OCT · QL thêm tay"; nút "+ Thêm lượt MT" (chủ động) |
| Tải / lỗi / rỗng | `test-tai-1440`, `test-loi-tai-1440`, `test-rong-1440` | Khung xương; `bao-loi` + Tải lại ("Điểm đã lưu không mất"); "Không còn bài nào cần chấm" |
| 375 | `test-cham-ds-375`, `test-cham-375`, `test-lich-375` | Danh sách → bấm nhóm → khu chấm toàn màn + "‹ Quay lại"; thẻ thay bảng; chân lưu dính đáy (T21) |

## 2. BỎ / GIỮ so với mã hiện tại và V4

| | Thứ | Lý do |
|---|---|---|
| BỎ | Ba khối "Test quá hạn chấm · Test chấm tuần này · Lịch Test tuần này" + dải 3 số (`LichTestTab.tsx:380-381`, `DaiSo.tsx`) | Thay bằng 4 nhóm theo hạn (C14) ở Chấm Test và một lịch tuần (C13) |
| BỎ | Công tắc FT / Lớp thường ở chỗ chấm | Nhóm đã ghi lớp; lịch giữ chip lọc Fast Track · Lớp thường |
| BỎ | Tab "Tình trạng chấm" của V4 | C13 — gộp vào Lịch tuần theo quyền |
| BỎ | Dòng "MT4 chưa xếp k em" (`keHoachTest.ts:225-231`), việc nhắc `hv-ft-xong-mt-cuoi-chua-mt-ke` (`tongQuan.ts:118`), cột "Chưa lịch Test" sau MT3 | C20 — xong 3 MT = "Xong 3 MT" |
| GIỮ | "+ xếp" / "Tạo MT4" khi QL chủ động chọn HV (`chuSeXep`) | C20 "QL chủ động thêm" — đổi chỗ thành nút "+ Thêm lượt MT", không nổi như việc thiếu |
| GIỮ | Luật "-" #503 (`vang.ts:19-24`), Hoàn tác 10 s, chuông QL | Quyết định 22/10 |
| GIỮ | Hộp nhập Mock "Lưu · em tiếp", hỏi khi đóng còn chữ (`HopNhapDiem.tsx`) | Đổi chỗ: thành khu chấm cạnh danh sách, cùng hành vi |
| GIỮ | Tự lưu khi rời ô cho lớp thường (`ScoreEntry.tsx:846`) | Thêm trạng thái tại ô + chân (brief 5.3 "tự lưu phải có trạng thái") |
| GIỮ | WeekPicker | Thay bằng ‹ › + "Về tuần này" (một tuần đang xem) |

## 3. Giả định · lệch dữ liệu · cần xác minh

- **[XM] Lệch dữ liệu nền:** `du-lieu-demo.md` ghi BC FT 205 MT2 thi 07/09 "quá hạn", nhưng luật hạn FT của cùng tệp (hết T4 tuần sau) cho hạn 16/09 → chưa quá hạn. Mockup dùng tuần thi **W1 SEP (31/08) → hạn 09/09, quá hạn 5 ngày** để giữ ca quá hạn. V5-C sửa một trong hai ở nền.
- **[XM] Speaking Mock có phải nợ của GV dạy S lớp đó?** Mã: ô S Mock **không** là nợ của ai (`scoreDebt.ts:113-115`); nền đếm "cô Trang 2 việc" (S MT3 FT 101 + S MT2 BC FT 205). Mockup đề xuất: lớp GV dạy S → "Lớp tôi dạy S" (đếm vào "Của tôi"); lớp khác → "Chấm chéo · không tính nợ". Theo đó cô Trang = 3 nhóm · 47 bài (gồm cả FT 102 S nền bỏ sót).
- **[ĐX]** Thiếu nhận xét bắt buộc không tính xong — máy chủ hiện vẫn tính xong với dữ liệu cũ chỉ có band (`scoreDebt.ts:112`); cần đổi hàm nợ ở PR số liệu (V5-C).
- **[ĐX]** "Lưu và tiếp" ở khu chấm Mock = lưu em này rồi sang em kế trong cùng nhóm; Enter = Lưu và tiếp, ↑ ↓ đổi em.
- Thang lớp thường /25 ở mockup là **[B2] giả định** (mã dùng "đúng/tổng" theo bài).
- Chưa vẽ: hộp chọn tuần khi "+ Thêm lượt MT", xem bài đã chấm để sửa (cùng khu chấm, ô đã lưu bấm được).

## 4. Triển khai → PR UI-CHAM-TEST (khu Chấm Test + Kế hoạch Test; Lịch tuần để UI-LICH-TUAN)

Ảnh cặp `docs/anh/ui-cham-test/{cham,ke-hoach}-{1440s,1440,1280,375}.png` (trái mockup, phải web; seed nguyên, GV Hà / QL Vy).

| # | Khung (mục 1 / `dieu-chinh-cuoi.html` khu a) | Web | Chấm |
|---|---|---|---|
| 1 | C14 bốn nhóm, thứ tự cố định | `ChamTestTab.tsx` — tên nhóm theo ngày thật (P7): Quá hạn · Hạn đến 20/09 · Speaking chấm chéo · Hạn sau 20/09 | KHỚP |
| 2 | Speaking theo tuần làm bài, một bài một bản ghi | nhóm S chéo gom lớp × MT, dòng "MT1 · làm bài W1 JUL – W3 SEP" | KHỚP |
| 3 | T03 / R2: "Của tôi" chỉ phần phân công, "Có thể chấm n bài Speaking", nhãn "chấm chéo · không tính nợ" | đầu danh sách + `Nhan` (T12) | KHỚP |
| 4 | T02 GV một kỹ năng | dòng = việc của chính GV (kỹ năng ở tiêu đề); BỎ dòng chú "không tính vào bài của bạn" (P1) | KHỚP |
| 5 | T14 Hạn tuần sau gập, không đỏ, không tự mở | `<details>` gập, máy tính tự mở nhóm đầu Quá hạn → Hạn đến → Speaking | KHỚP |
| 6 | Khu chấm tại chỗ | `PanelViec` / `PanelChamSpeaking` trong `KhungTaiCho` (lưới `LuoiNhung`, R4 không làm lại lưới) | KHỚP |
| 7 | Cột "điểm lượt trước" trong khu chấm | lưới hiện có không có cột này (R4) | KHÁC |
| 8 | "Lưu" / "Lưu và tiếp", trạng thái lưu, lỗi lưu giữ chữ | GIỮ hành vi lưới + hộp nhập Mock "Lưu · em tiếp" (tự lưu từng ô, ⚠ Lưu lại) | KHỚP |
| 9 | Thiếu nhận xét ≠ xong | chữ "thiếu nhận xét" ở ô (SV-SO1) | KHỚP |
| 10 | T05 chuỗi "-", "Đã huỷ" kèm lý do | ô lưới `Đã huỷ` + dòng phụ vắng 2 lần / QL từ chối dời / vắng MT cũ (`lyDoHuy`, §21.4 T5) | KHỚP |
| 11 | MT cũ "-" huỷ ngay + Hoàn tác 10 s | GIỮ (LUAT-34) | KHỚP |
| 12 | Lớp thường tự lưu khi rời ô | GIỮ lưới lớp thường | KHỚP |
| 13 | C20 / T04 mặc định 3 MT, không cột MT4 trống | `luoiFT` bỏ `soKeTiep` khỏi số cột; MT4 hiện khi có lượt | KHỚP |
| 14 | Nút "+ Thêm lượt MT" | chủ SP 22/10 (10 mục 6): "+ MT" cuối hàng mỗi HV → MT kế tiếp (hộp xếp đợt sẵn có) · S Ex | KHỚP |
| 15 | Kế hoạch: từng HV × MT1–MT3, ô khung viền ba dòng kỹ năng · tuần `W2 JUL 2026` · trạng thái | `ChipDotFT` thành khung viền (viền theo trạng thái, không chip nền màu), `tuanNamChu` (Excel giữ `W2 JUL/2026`) | KHỚP |
| 16 | Ô xong "✓ Overall 6.0" / "✗ Overall 5.5" | `OverallDot` (Overall + kỳ vọng từ `resultOf`) | KHỚP |
| 17 | Cột S Ex + "+ S Ex" (QL / Admin), ? giải thích | BỎ cột S Ex theo chủ SP 22/10: S Ex là ô lượt cuối hàng HV (theo tuần), thêm qua "+ MT" › S Ex; Xoá + toast Hoàn tác (`/s-expert/:id/khoi-phuc`) | KHÁC (quyết định mới chủ SP) |
| 17b | Lớp dài: một phần + "+ n HV · Hiện tất cả N" | 10 em đầu + "Hiện tất cả" (tìm em / Cần xếp lại thì hiện hết) | KHỚP |
| 17c | Ô S Ex có lượt: khung viền đứt hồng "S Ex · tuần · ngày · QL thêm" | khung viền đứt hồng: "S Ex" · `W4 SEP 2026` · "23/09 · {người} thêm" (có điểm: band) | KHỚP |
| 18 | Tab "Chấm Test · n nhóm" | `HangTab` số nhóm Của tôi | KHỚP |
| 19 | Tải / lỗi / rỗng | `Skeleton` · `ErrorState` Thử lại · "Không còn bài nào cần chấm" | KHỚP |
| 20 | 375: danh sách → bấm nhóm → khu chấm toàn màn + "‹ Quay lại" | "‹ Chấm Test" (cùng mẫu Công việc) | KHỚP |
| BỎ | "Đang thấy 8 / 22 HV · ↑ ↓ đổi em…" dưới khu chấm; khung "KV = Target − 0,5" đầu khu | P1 (chữ giải thích không lên web) | — |

**Tỉ lệ (đếm lại sau chủ SP 22/10): 21 / 23 KHỚP = 91 %.** KHÁC: #7 (cột điểm lượt trước — lưới giữ nguyên, R4) — chờ chủ SP; #17 ("+ MT" thay cột S Ex — quyết định mới của chủ SP, mockup cũ).
