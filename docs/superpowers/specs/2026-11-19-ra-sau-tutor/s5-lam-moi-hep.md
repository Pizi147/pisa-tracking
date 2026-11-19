# S5 LAM-MOI-HEP — pha 1: đo + kế hoạch làm mới hẹp (20/11)

Nguồn: báo cáo rà sau Tutor `bao-cao.md` mục 4 đề xuất 8. Pha 1 KHÔNG sửa mã ứng dụng. Session code S5 (Opus 5.5 · high).

## 0. Tóm tắt

- Cơ chế: `invalidate(tiền tố)` (`web/src/lib/api.ts:46`) xoá bản nhớ + đánh thức MỌI hook `useApi` đang gắn có đường bắt đầu bằng tiền tố → hook tải lại.
  `invalidateGop` gộp 1,5 s (điểm). Badge `/my-work` ở App (`App.tsx:279`) KHÔNG tải ngay: chỉ đánh dấu cũ → tải lại sau ≤ 60 s hoặc khi đổi trang.
  Khối "Việc cần làm" ở hồ sơ lớp (`ThanhViecLop`) cũng `chiNghe` → nhận bản của badge.
- 212 chỗ gọi trong `web/src` (bảng a ở mục 4). Tiền tố hay gặp: `/my-work` ~112 chỗ · `/classes` ~96 · `/students` ~95 · `/tong-quan` 66 · `/hoc-vien-lop` 50 · `/cases` 48.
- Đo trên seed (mục 2): thao tác nhỏ ở **hồ sơ lớp** tải lại cả lớp — sửa mô tả Case = 5 request · 93 câu · **3 252 dòng** (seed; bản chính ≈ 1 300 dòng);
  ghi vi phạm (tab Ý thức mở) = 6 request · 99 câu · **3 589 dòng**. Ở **hồ sơ HV** mọi thao tác kéo 4–5 request (127–165 câu) vì `/students` trúng cả 4 khối của em.
  Ở **Công việc** mỗi thao tác Case tải lại `/my-work` (40–62 câu · 606 dòng seed; bản chính TB ≈ 2 300 dòng sau TD-VIEC-2).
- Đề xuất 7 chỗ (mục 3). Lợi chính là **hết giật sau lưu** (bớt 60–95 % request / dòng mỗi lần lưu ở hồ sơ lớp, hồ sơ HV). Dòng Turso / ngày: ước **−40…−90 nghìn**
  (≈ 1–3 % của ~3,2 triệu) — nhỏ vì ghi Case / Ý thức còn ít; chỗ 7 (tải trùng khi mở trang) có thể lớn hơn, cần chẩn đoán trước.

## 1. Cách đo (tái lập)

- Seed mới (`PISA_DB=<tạm> node dist-server/server/src/seed/run.js`, mã main `4a95e2efa`), API cổng 4150 + Vite 5250, `PISA_DEM_SQL=1` (log `[sql] <đường> n câu, n dòng` mỗi request).
  Mở web ở `s5.localhost:5250` (tách cookie với dev server các session khác ở `localhost` — dùng chung cookie thì bị đăng xuất giữa chừng).
- GV demo id 7 (GVCN MB FT 101, lớp 3, 33 HV). Hồ sơ HV `/hoc-vien/3` (Case 5 mở sẵn); hồ sơ lớp `/hoc-vien/lop/3` (tab Học viên, + tab Ý thức, + panel Case 5);
  Công việc `/cong-viec` (nhóm Case, panel việc "Mô tả Case" Case 43, + nhóm Ý thức).
- Mốc: trang gọi `GET /api/s5-mark-<tên>` trước / sau thao tác (404 nhưng vẫn có dòng log) → đếm GET giữa hai mốc, chờ 3,5 s (gộp: 4 s).
- Thao tác 1, 2, 3 bấm thật trên giao diện (hồ sơ HV; 1 ở hồ sơ lớp; 2 ở Công việc). Phần còn lại gọi đúng bộ `invalidate` của mã thao tác qua module Vite chung
  (`await import('/web/src/lib/api.ts')` — cùng bản thể với web; kiểm: bộ của thao tác 1 gọi tay ra đúng 4 request như bấm thật). Phần `reload()` / `onChanged` riêng của
  thành phần không chạy được bằng cách này → ghi riêng ở cột "thêm khi bấm thật" (đo bằng bấm thật ở thao tác 1).
- Số "bản chính" = TB từ log 24 h (`netlify-api-24h.txt`, mã 12/11): roster 375 dòng · diem-theo-luot 395 · overview 407 · xet-lai 7 · `/students/:id` 151 · `/cases/:id` 49 ·
  phoi-hop-sos 243 · `/classes/:id/y-thuc` 136 · `/my-work` 4 285 (trước TD-VIEC-2; sau #1827 ≈ 2 339).

## 2. Bảng b — request tải lại sau 8 thao tác (seed)

Bộ tiền tố theo mã:

| # | Thao tác | Mã | Tiền tố |
|---|---|---|---|
| 1 | Sửa mô tả Case (tự lưu) | `CasePanel.tsx:241` `nhan` + `onChanged` | /my-work /students |
| 2 | Đổi nhóm nguyên nhân | như 1 | /my-work /students |
| 3 | Thêm PA | `ThaoTacCase.tsx:81` + `CasePanel` `lamMoi` (reload Case + `onChanged`) | /cases /students /tong-quan /my-work |
| 4 | Ghi kết quả PA | `CapNhatTuan.tsx:346` + `lamMoi` | /cases /my-work /students /tong-quan /followups /yeu-cau |
| 5 | Lưu nháp kết quả PA | `CapNhatTuan.tsx:500-501` | /my-work (chỉ khi PA sắp tới hạn) /cases |
| 6 | Ghi vi phạm | `RecordViolationPanel.tsx:134` → `lamMoiYThuc` (`kieu.ts:24`) | /violations /measures /classes /students /y-thuc |
| 7 | Xác nhận xử lý vi phạm | `XacNhanXuLyPanel.tsx:29` → `DUONG_LAM_MOI_Y_THUC` (`kieu.ts:141`) | /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| 8 | Nhập một điểm Test (gộp 1,5 s) | FT `ScoreEntry.tsx:177` · thường `LuoiThuong.tsx:175` | /attempts /tong-quan /classes /students /my-work (+ /regular) |

Kết quả (request · câu · dòng; "—" = không request nào):

| # | Hồ sơ HV (`/hoc-vien/3`, Case mở) | Hồ sơ lớp — tab Học viên | Hồ sơ lớp — panel Case mở (bấm thật) | Hồ sơ lớp — tab Ý thức | Công việc (panel việc mở) |
|---|---|---|---|---|---|
| 1 | 4 · 127 · 313 (`/students/3`, `/skill-board`, `/bai-tren-lop`, `/y-thuc`) | — | **5 · 93 · 3 252** (roster 1 519 · diem-theo-luot 831 · overview 747 · cases?classId 153 · xet-lai 2) | — | không đổi việc: —; việc xong: 1 · 42 · 606 (`/my-work`) |
| 2 | 4 · 131 · 307 (bấm thật) | — | như 1 | — | 1 · 42 · 606 (bấm thật) |
| 3 | 5 · 165 · 370 (+ `/cases/5` 38 · 57) | 1 · 4 · 153 | 2 · 42 · 211 + `onChanged` như 1 → **≈ 7 · 135 · 3 463** | — | 2 · 75 · 644 (`/cases/43` + `/my-work`) |
| 4 | 5 · 165 · 370 | 1 · 4 · 153 | ≈ 7 · 135 · 3 463 | — | 2 · 88 · 698 |
| 5 | 1 · 38 · 57 (`/cases/5`) | 1 · 4 · 153 | 2 · 42 · 211 | — | 2 · 75 · 644 |
| 6 | 5 · 130 · 315 (+ `xet-lai`) | 4 · 89 · 3 099 (roster · diem-theo-luot · overview · xet-lai) | — | **6 · 99 · 3 589** (+ y-thuc 334 · phoi-hop-sos 210)¹ | — (không có `/my-work` — xem [NGHI] 2) |
| 7 | 5 · 130 · 315 | 4 · 73 · 3 045 | — | 6 · 99 · 3 589 | 1 · 53 · 660 |
| 8 | 5 · 130 · 315 | 4 · 73 · 3 045 | — | — | 1 · 40 · 606 |

¹ Lần đo này có thêm `/my-work` 42 · 607 — là badge App đến hẹn 60 s của thao tác trước, không do thao tác 6; đã trừ.

Thêm sau mọi thao tác có `/my-work`: badge App tải `/my-work` một lần ≤ 60 s sau (≈ 40 câu · 606 dòng seed) — đã gộp, không nhân theo số lần lưu. Không tính vào bảng.

Đọc bảng:
- **Hồ sơ lớp nặng nhất**: panel Case mở từ bảng HV gọi `onChanged` = `BangHoSoLop.xong` (`BangHoSoLop.tsx:145`) → `ClassOverviewPage.xong` (`ClassOverviewPage.tsx:182`:
  `invalidate('/classes')` + `/hoc-vien-lop` + `reload()`) → cả lớp tải lại sau MỖI lần tự lưu mô tả / nguyên nhân. Thao tác Ý thức / điểm trúng `/classes` → cũng cả lớp.
- **Hồ sơ HV**: `/students` trúng 4 khối của em; mô tả / nguyên nhân / vi phạm không đổi `skill-board`, `bai-tren-lop`.
- **Công việc**: chỉ `/my-work` + Case đang mở — đúng phạm vi, nhưng `/my-work` đắt (bản chính ~2 300 dòng) và tải lại cả khi lưu không đổi việc nào (sửa mô tả lần 2, 3…).

Phát hiện phụ khi đo (lúc MỞ trang, không phải sau lưu):

| Trang | Tải trùng | Thừa mỗi lần mở (seed) |
|---|---|---|
| Công việc | `/my-work` 2 lần (cả lúc đăng nhập và lúc vào lại trang) | 40 câu · 606 dòng (bản chính ~2 300) |
| Hồ sơ lớp | `ho-so?phan=overview,roster,diemTheoLuot` rồi lại `roster` + `diem-theo-luot` lẻ | 35 câu · 2 350 dòng |
| Hồ sơ lớp → tab Ý thức | `roster` tải lại (bản nhớ chỉ giữ 10 s) | 24 câu · 1 519 dòng |
| Panel Case | `/cases/:id` 2 lần, `/attachments` 2 lần | 43 câu · 61 dòng |

## 3. Bảng c — đề xuất thu hẹp (xếp theo lợi ích)

Nguyên tắc: thao tác chỉ đổi chữ trong Case / PA → cập nhật bằng dữ liệu máy chủ trả về (`setData`, đã có), không gọi lại khối khác;
thao tác đổi SỐ ĐẾM / trạng thái (mở / đóng Case, việc xong, vi phạm mới) → giữ làm mới, nhưng đúng em / đúng lớp. Cần một hàm nhỏ "làm mới đúng đường"
(khớp `đường` hoặc `đường?…`, không khớp `/students/30` khi sửa `/students/3`) — `invalidate('/students/3')` hiện trúng cả em 30, 31….

| # | Chỗ | Hiện tại | Đề xuất | Bớt mỗi lần lưu (seed → ước bản chính) | Rủi ro "số cũ" + cách kiểm |
|---|---|---|---|---|---|
| **1** | Hồ sơ lớp: Case sửa tại chỗ (mô tả, nguyên nhân, tên, kỹ năng, phụ trách) — `CasePanel.nhan` → `onChanged` → `BangHoSoLop.xong` → `ClassOverviewPage.xong` | cả lớp: roster + diem-theo-luot + overview + xet-lai + cases | `nhan` báo "chỉ đổi chữ" → nơi gọi chỉ làm mới `/cases?classId=:id` (cột Case); `xong` đầy đủ giữ cho mở / đóng / xoá Case, thêm / kết thúc PA | 5 · 93 · 3 252 → 1 · 4 · 153 (**−95 % dòng**; bản chính ≈ −78 câu · −1 180 dòng) | roster chỉ đếm Case mở + SOS (từ điểm) + cảnh báo Ý thức (`classes.ts` `classRoster`) — chữ Case không đổi các số đó. Kiểm: sửa mô tả + nguyên nhân + phụ trách → so roster / overview / "n Case đang mở" với bản tải lại cứng (JSON trùng). Đổi phụ trách: "Việc cần làm" lớp (từ `/my-work`, badge ≤ 60 s) — như hiện nay |
| **2** | Ý thức: `lamMoiYThuc` + `DUONG_LAM_MOI_Y_THUC` (15 nơi gọi) | `/classes` + `/students` → cả lớp (cả diem-theo-luot, xet-lai) + 4 khối của em | hàm nhận `{ classId?, studentId? }`: `/classes/:id/y-thuc`, `/classes/:id/roster` (cảnh báo Ý thức trên dòng HV), `/classes/:id/overview` (đếm tab), `/classes/:id/phoi-hop-sos` chỉ khi việc SOS; `/students/:id` + `/students/:id/y-thuc`; giữ `/violations` `/y-thuc` `/my-work` `/yeu-cau` `/tong-quan` `/metrics`. Lô nhiều lớp / không rõ lớp → giữ như cũ | lớp tab Ý thức: 6 · 99 · 3 589 → 3 · 74 · 2 546 (−diem-theo-luot −xet-lai −phoi-hop-sos; bản chính ≈ −30 câu · −650 dòng); HV: 5 · 130 · 315 → 2 · 91 · 210 | diem-theo-luot / xet-lai không đọc Ý thức (đọc lượt + điểm) — kiểm bằng `grep` câu SQL của hai đường + JSON trùng sau ghi vi phạm. Kiểm UI: ghi vi phạm → chip "Ý thức · cần xử lý" ở dòng HV, số tab Ý thức, khối việc em đều đổi |
| **3** | Case / PA ở hồ sơ HV: `/students` trong `CasePanel` (nhan, lamMoi, xoá PA, kết thúc PA), `ThaoTacCase`, `CapNhatTuan`, `XacNhanPaLo`, `LuoiKetQuaPa`, `DoiNguoiPhuTrach` | `/students` → `/students/:id` + skill-board + bai-tren-lop + y-thuc (mọi em đã xem cũng bị xoá bản nhớ) | Case sửa chữ: chỉ `/students/:sid` (khối "Việc cần làm" + dòng Case); PA thay đổi: + `/students/:sid/skill-board`; bỏ bai-tren-lop, y-thuc | sửa chữ 4 · 127 · 313 → 1 · 75 · 192; PA 5 · 165 · 370 → 3 · 140 · 341 (bản chính ≈ −25…−50 câu / lần) | skill-board đọc Case + PA (thẻ kỹ năng "Có Case · có PA") → giữ cho PA, bỏ cho chữ Case. Kiểm: thêm PA ở hồ sơ HV → thẻ kỹ năng đổi "có PA"; sửa mô tả → JSON skill-board trước / sau trùng |
| **4** | Công việc + mọi nơi: sửa chữ Case làm `/my-work` tải lại sau mỗi lần tự lưu | `nhan` luôn `invalidate('/my-work')` | chỉ khi lần lưu có thể đổi việc: Case trước đó thiếu mô tả / nguyên nhân (việc "Mô tả Case" còn), hoặc đổi phụ trách; sửa lần sau → không | 1 · 42 · 606 → — (bản chính ≈ −45 câu · −2 300 dòng mỗi lần sửa thêm) | việc đã xong phải mất ngay: điều kiện dựa trên dữ liệu Case đang có (`data` trước khi lưu). Kiểm: Case chưa mô tả → gõ → việc biến mất khỏi Công việc + badge; gõ thêm → không có GET `/my-work` |
| **5** | Lưu nháp kết quả PA — `CapNhatTuan.luuNhap` | `invalidate('/cases')` → tải lại Case đang mở (+ danh sách Case lớp) | đặt `nhapKetQua` của PA vào `data` Case tại chỗ (máy chủ đã trả `r.nhap`; sự kiện `baoNhapPa` có sẵn) thay vì tải lại | 1 · 38 · 57 (HV) / 2 · 42 · 211 (lớp) → — | `/cases/:id` trả `nhapKetQua` mỗi PA (`cases.ts:2491`) — phải ghi đè đúng PA; kiểm: lưu nháp → đóng / mở thẻ PA thấy nháp; mở Case ở tab khác thấy nháp |
| **6** | Hồ sơ lớp: điểm / ghi KQ PA / thêm PA gọi `invalidate('/classes')` trong khi đang ở MỘT lớp | trúng xet-lai (và tab Ý thức, phoi-hop-sos nếu đang mở) | đổi `/classes` → `/classes/:id` của lớp vừa ghi ở `ScoreEntry`, `LuoiThuong`, `huyDiem`; Case / PA không cần `/classes` (đi qua chỗ 1) | điểm: bớt phoi-hop-sos + y-thuc khi tab Ý thức mở (≈ 26 câu · 544 dòng seed); lợi chính ở trang có nhiều lớp (Test) — chưa đo | điểm đổi roster / diem-theo-luot / overview → GIỮ cả lớp đó. Kiểm: nhập điểm → % Đạt MT, chờ chấm, ô điểm dòng HV đổi |
| **7** | Tải trùng lúc MỞ trang (phát hiện phụ, mục 2) | `/my-work` ×2 ở Công việc; roster + diem-theo-luot ×2 ở hồ sơ lớp; `/cases/:id` ×2 | chẩn đoán trước (nghi: phản hồi bị bỏ do `theHe` đổi giữa chừng — lần vô hiệu / `xaGop` ngay lúc gắn — hoặc khoá đường lẻ ≠ khoá trong lời gọi gộp), rồi sửa đúng gốc | Công việc ≈ −2 300 dòng / lần mở (bản chính); hồ sơ lớp ≈ −35 câu · −770 dòng / lần mở | [XM] ngoài đề xuất 8 (không phải "sau lưu") nhưng cùng cơ chế làm mới; lợi / ngày có thể lớn hơn cả 1–6 (`/my-work` 422 lần / ngày). Kiểm: đếm request lúc mở mỗi trang = 1 lần mỗi đường |

Ước dòng / ngày (bản chính, [ƯỚC]): log 12/11 có ~30 lần ghi Ý thức, ~200 lần lưu điểm (đã gộp), ~50 thao tác PA, sửa Case tại chỗ rất ít (Case / PA mới chạy từ cuối 11).
Chỗ 1 + 3 + 4 phụ thuộc số lần sửa Case — nếu ~100 lần / ngày: ≈ −30…−60 K; chỗ 2: ≈ −20 K; chỗ 5–6: < −10 K. Tổng ≈ **−40…−90 K dòng / ngày** (1–3 %),
cộng chỗ 7 nếu xác nhận: tới ≈ −0,3…−0,5 triệu / ngày (mỗi lần mở Công việc bớt một `/my-work`). Lợi chắc chắn: số request sau mỗi lần lưu ở hồ sơ lớp 5–7 → 1–4, hồ sơ HV 4–5 → 1–3.

**Nên làm (pha 2): 1, 2, 3, 4, 5** (+ 7 nếu PTA đồng ý mở rộng phạm vi). **Để sau: 6** (lợi nhỏ khi ở một lớp; cần đo trang Test trước).
Giữ làm mới rộng: mở / đóng / xoá / mở lại Case, Chuyển lớp, Tạm dừng / Kết thúc, khôi phục từ thùng rác, kết quả thi thật — đổi số đếm nhiều nơi, ít gặp.

## [NGHI] / [XM]

1. [XM] Chỗ 7 ngoài phạm vi "sau lưu" — PTA Tutor quyết có gộp vào S5 pha 2 không.
2. [NGHI] Ghi vi phạm (`lamMoiYThuc`) không vô hiệu `/my-work`: nếu vi phạm tạo việc "Xác nhận xử lý" cho người đang xem, Công việc / badge chỉ thấy sau quét nền
   + ≤ 5 phút. Chưa tái hiện; kiểm ở pha 2 (chỗ 2 sẽ thêm `/my-work` nếu đúng).
3. [NGHI] "Việc cần làm" ở hồ sơ lớp (`ThanhViecLop`, `chiNghe`) không tải lại ngay khi lưu Case tại lớp — chờ badge ≤ 60 s. Đã như vậy trước S5; chỗ 1 không làm tệ hơn.
4. Seed nhỏ hơn bản chính ở `/my-work` nhưng lớn hơn ở roster (lớp seed 33 HV) — số "bản chính" trong bảng c lấy TB log, không phải seed.

## 4. Bảng a — mọi chỗ gọi `invalidate` / `invalidateGop` / `quenBanXem` trong `web/src` (212, không tính phép kiểm)

Cột "sau thao tác" = lời gọi ghi gần nhất phía trên (≤ 25 dòng; "—" = trong hàm dùng chung, xem mã). Request thực sự bị gọi lại khi đang mở từng màn — theo tiền tố:

| Tiền tố | Hồ sơ HV | Hồ sơ lớp (tab Học viên / + Ý thức / + panel Case) | Công việc |
|---|---|---|---|
| `/students` | `/students/:id`, `/skill-board`, `/bai-tren-lop`, `/y-thuc` | — | — |
| `/classes` | `/classes/:lop/xet-lai?studentId` | roster, diem-theo-luot, overview, xet-lai (+ y-thuc, phoi-hop-sos) | — |
| `/cases` | `/cases/:id` | `/cases?classId` (+ `/cases/:id`) | `/cases/:id` |
| `/my-work` | — (badge ≤ 60 s) | — (badge ≤ 60 s, `ThanhViecLop` nhận theo) | `/my-work` ngay |
| `/tong-quan` `/yeu-cau` `/violations` `/y-thuc` `/metrics` `/followups` `/attempts` `/regular` | — | — | — |

(`/hoc-vien-lop` chỉ trúng trang HV & Lớp / Tổng quan — không đo ở 3 màn này.)

| tệp:dòng (web/src/) | sau thao tác (lời gọi ghi gần nhất) | tiền tố |
|---|---|---|
| `lib/thungRac.ts:20` | `POST /thung-rac/${thungRacId}/khoi-phuc` | /students /hoc-vien-lop /classes /tong-quan /my-work /cases /lenh-chuyen /thung-rac |
| `modules/cases/CapNhatTuan.tsx:346` | — | /cases /my-work /students /tong-quan /followups /yeu-cau |
| `modules/cases/CapNhatTuan.tsx:500` | — | /my-work |
| `modules/cases/CapNhatTuan.tsx:501` | — | /cases |
| `modules/cases/CasePanel.tsx:241` | — | /my-work /students |
| `modules/cases/CasePanel.tsx:457` | — | /my-work |
| `modules/cases/CasePanel.tsx:603` | `POST /cases/${data.id}/mo-lai` | /cases /my-work /students |
| `modules/cases/CasePanel.tsx:629` | — | /cases? /cases /students /my-work /tong-quan /yeu-cau |
| `modules/cases/CasePanel.tsx:678` | `POST /yeu-cau/${id}/rut` | /cases /yeu-cau /my-work |
| `modules/cases/CasePanel.tsx:689` | `POST /yeu-cau/${id}/rut` | /cases /students /my-work /yeu-cau /tong-quan |
| `modules/cases/CasePanel.tsx:813` | — | /students /my-work /yeu-cau /tong-quan |
| `modules/cases/CasePanel.tsx:1041` | — | /cases /students /my-work /yeu-cau /tong-quan |
| `modules/cases/CasePanel.tsx:1142` | `POST /yeu-cau/${d.yeuCauId}/rut` | /cases /my-work /yeu-cau |
| `modules/cases/CasePanel.tsx:1182` | `POST /interventions/${iv.id}/de-xuat-doi-pa` | /cases /my-work /yeu-cau |
| `modules/cases/CasePanel.tsx:1241` | `PATCH /followups/${f.id}` | /cases /students |
| `modules/cases/DoiNguoiPhuTrach.tsx:27` | `POST /cases/${caseId}/nguoi-phu-trach` | /cases /my-work /students |
| `modules/cases/NeedsEvaluation.tsx:22` | — | /needs-evaluation |
| `modules/cases/QuickReport.tsx:260` | — | /cases /students /tong-quan |
| `modules/cases/ThaoTacCase.tsx:81` | — | /cases /students /tong-quan /my-work |
| `modules/cases/ThaoTacCase.tsx:86` | `POST /interventions/${paId}/hoan-tac-them` | /cases /students /tong-quan /my-work |
| `modules/cases/ThaoTacCase.tsx:208` | `POST /cases/${caseId}/outcome` | /cases /my-work /students |
| `modules/cham/huyDiem.ts:20` | `POST /attempts/${o.attemptId}/skills/${o.skill}/huy-diem` | /regular /classes /attempts /students /my-work /ke-hoach-test |
| `modules/cham/LuoiThuong.tsx:175` | — | /regular /classes /attempts /students /tong-quan /my-work |
| `modules/cham/LuoiThuong.tsx:276` | — | /regular /classes |
| `modules/classes/BangHoSoLop.tsx:145` | — | /cases?classId=${classId} |
| `modules/classes/BanGiaoGvPanel.tsx:82` | `PUT /ban-giao-gv/${dto.id}/gop-y` | /my-work |
| `modules/classes/BanGiaoGvPanel.tsx:93` | `PUT /ban-giao-gv/${dto.id}/gop-y` | /my-work |
| `modules/classes/BanGiaoGvPanel.tsx:119` | `POST /ban-giao-gv/${dto.id}/xac-nhan` | /my-work /classes |
| `modules/classes/BanGiaoPanel.tsx:66` | — | /lenh-chuyen |
| `modules/classes/BanGiaoPanel.tsx:68` | — | /lenh-chuyen |
| `modules/classes/BanGiaoPanel.tsx:152` | `POST /lenh-chuyen/${em.lenhId}/xac-nhan` | /lenh-chuyen /classes /my-work /students /yeu-cau |
| `modules/classes/BanGiaoPanel.tsx:169` | `PUT /lenh-chuyen/${em.lenhId}/ban-giao` | /lenh-chuyen /students |
| `modules/classes/BanGiaoPanel.tsx:179` | `PUT /lenh-chuyen/${dienThay.lenhId}/ban-giao-mon` | /lenh-chuyen /my-work |
| `modules/classes/BanGiaoPanel.tsx:399` | `PUT /lenh-chuyen/${e.lenhId}/ban-giao-mon` | gộp /my-work gộp /classes |
| `modules/classes/BanGiaoPanel.tsx:443` | — | gộp /my-work gộp /classes |
| `modules/classes/BanGiaoPanel.tsx:460` | `PUT /lenh-chuyen/${e.lenhId}/ban-giao-mon` | /lenh-chuyen /my-work /classes |
| `modules/classes/BangKqdrLopFt.tsx:232` | `PUT /students/${em.id}/ket-luan-ft` | /classes /students /cases /my-work |
| `modules/classes/ClassCreatePanel.tsx:127` | — | /classes /ref/classes /hoc-vien-lop /my-work |
| `modules/classes/ClassOverviewPage.tsx:182` | — | /classes /hoc-vien-lop |
| `modules/classes/ClassOverviewPage.tsx:219` | — | /classes |
| `modules/classes/ClassProgressPanel.tsx:97` | `PATCH /classes/${classId}/progress` | /classes |
| `modules/classes/CuoiKhoaLop.tsx:217` | — | /classes /my-work /hoc-vien-lop |
| `modules/classes/CuoiKhoaLop.tsx:300` | `PUT /classes/${classId}/ky-vong` | /cases |
| `modules/classes/DauTrangLop.tsx:121` | `POST /classes/${data.id}/mo-lai` | /classes /hoc-vien-lop |
| `modules/classes/DauTrangLop.tsx:143` | `POST /classes/${data.id}/mo-lai` | `/classes/:id/viec` (duongViecLop) |
| `modules/classes/HopDotBaoCaoPh.tsx:17` | — | /classes /my-work /hoc-vien-lop |
| `modules/classes/LuoiTaoLop.tsx:224` | — | /classes /ref/classes /hoc-vien-lop /my-work |
| `modules/classes/PanelXetLai.tsx:48` | — | /classes /students /my-work /hoc-vien-lop /lenh-chuyen /cases |
| `modules/classes/PanelXetLai.tsx:430` | `PUT /classes/${classId}/xet-lai/${e.studentId}/nhan-xet` | `/classes/:id/xet-lai` (409) |
| `modules/classes/TabBaoCaoPh.tsx:358` | — | quên `/classes/:id/bao-cao-ph` |
| `modules/classes/TabBaoCaoPh.tsx:369` | — | quên `/classes/:id/bao-cao-ph` |
| `modules/classes/TabBaoCaoPh.tsx:527` | — | quên /classes/${lopId}/bao-cao-ph |
| `modules/classes/TeacherAssignPanel.tsx:151` | `POST /phan-cong/hoan-tac` | gộp /classes gộp /my-work gộp /hoc-vien-lop/phan-cong |
| `modules/classes/TeacherAssignPanel.tsx:155` | `POST /phan-cong/hoan-tac` | gộp /classes gộp /my-work gộp /hoc-vien-lop/phan-cong |
| `modules/classes/ThanhViecLop.tsx:56` | — | /my-work |
| `modules/classes/thaoTacDongHocVien.tsx:90` | — | /hoc-vien-lop /students/${id} |
| `modules/classes/thaoTacDongHocVien.tsx:147` | — | /my-work |
| `modules/classes/ThongTinLopPanel.tsx:144` | `PATCH /classes/${lop.id}/thong-tin` | /classes /ref/classes /hoc-vien-lop |
| `modules/classes/ThongTinLopPanel.tsx:150` | `PATCH /classes/${lop.id}/thong-tin` | /classes /ref/classes /hoc-vien-lop |
| `modules/classes/XoaKetThucLopPanel.tsx:31` | — | /classes /hoc-vien-lop /tong-quan /thung-rac |
| `modules/classes/XoaKetThucLopPanel.tsx:89` | — | /classes /hoc-vien-lop /tong-quan /students |
| `modules/classes/XoaKetThucLopPanel.tsx:98` | `POST /classes/${classId}/mo-lai` | /classes /hoc-vien-lop /students |
| `modules/classes/XoaKetThucLopPanel.tsx:139` | — | /classes /hoc-vien-lop /tong-quan |
| `modules/congViec/HoTroHocVienTab.tsx:391` | `POST /my-work/bo-qua` | /my-work |
| `modules/congViec/HoTroHocVienTab.tsx:753` | — | /my-work |
| `modules/congViec/LuoiKetQuaPa.tsx:151` | — | /my-work /cases /students /tong-quan /followups |
| `modules/congViec/LuoiKetQuaPa.tsx:202` | — | /my-work /cases |
| `modules/congViec/NutTask.tsx:81` | — | /my-work |
| `modules/congViec/NutTask.tsx:100` | — | /my-work |
| `modules/congViec/PanelBaoPhTvv.tsx:49` | `POST /y-thuc/bao-ph/${id}/khoi-phuc` | /my-work /tong-quan /students /y-thuc /classes |
| `modules/congViec/PanelBaoPhTvv.tsx:106` | `POST /y-thuc/bao-ph/ghi` | KHOA_BAO_PH: /my-work /tong-quan /students /y-thuc /classes |
| `modules/congViec/PanelBaoPhTvv.tsx:145` | `POST /y-thuc/bao-ph/${v.id}/han` | KHOA_BAO_PH: /my-work /tong-quan /students /y-thuc /classes |
| `modules/congViec/PanelBaoPhTvv.tsx:234` | `POST /y-thuc/bao-ph/${id}/bo` | KHOA_BAO_PH: /my-work /tong-quan /students /y-thuc /classes |
| `modules/congViec/PanelSauThi.tsx:93` | `PUT /cycles/${cycleId}/outcome` | LAM_MOI: /students /classes /hoc-vien-lop /lo-trinh /my-work /cycles /tong-quan |
| `modules/congViec/PanelSauThi.tsx:118` | `POST /cycles/${cycleId}/buoc-tiep` | LAM_MOI: /students /classes /hoc-vien-lop /lo-trinh /my-work /cycles /tong-quan |
| `modules/congViec/PanelSauThi.tsx:125` | `DEL /cycles/${cycleId}/buoc-tiep` | LAM_MOI: /students /classes /hoc-vien-lop /lo-trinh /my-work /cycles /tong-quan |
| `modules/congViec/PanelSauThi.tsx:154` | — | LAM_MOI: /students /classes /hoc-vien-lop /lo-trinh /my-work /cycles /tong-quan |
| `modules/congViec/PanelSauThi.tsx:262` | `PUT /hoc-vien-lop/lich-thi/${cycleId}` | LAM_MOI: /students /classes /hoc-vien-lop /lo-trinh /my-work /cycles /tong-quan |
| `modules/congViec/PanelViec.tsx:129` | — | /my-work |
| `modules/congViec/PanelViec.tsx:416` | `PUT /classes/${it.classId}/teachers` | /classes /cases |
| `modules/congViec/XacNhanPaLo.tsx:114` | — | /cases /students /tong-quan /my-work |
| `modules/congViec/XacNhanPaLo.tsx:127` | — | /cases /students /tong-quan /my-work |
| `modules/duyet/DeXuatSuaPanel.tsx:66` | `POST /students/${studentId}/de-xuat-sua` | /yeu-cau |
| `modules/duyet/HopChoDuyet.tsx:141` | — | /yeu-cau/dem |
| `modules/duyet/HopChoDuyet.tsx:142` | — | /yeu-cau /my-work /cases /tong-quan |
| `modules/duyet/HopChoDuyet.tsx:200` | — | /yeu-cau /my-work /cases /tong-quan |
| `modules/duyet/HopChoDuyet.tsx:220` | — | /yeu-cau /my-work /cases /tong-quan |
| `modules/duyet/TheYeuCau.tsx:143` | — | /yeu-cau /my-work /cases /tong-quan |
| `modules/duyet/TheYeuCau.tsx:203` | `POST /yeu-cau/${yc.id}/huy-quyet-dinh` | /yeu-cau /my-work /cases /tong-quan |
| `modules/fasttrack/HopThaoTacMt.tsx:151` | `PUT /attempts/${attemptId}/scores/${o}` | /attempts /classes /ke-hoach-test /my-work /regular |
| `modules/fasttrack/HopThaoTacMt.tsx:162` | `PUT /attempts/${attemptId}/scores/${o}` | /attempts /tong-quan /classes /ke-hoach-test /my-work /cycles |
| `modules/fasttrack/LuotThuongPage.tsx:131` | `POST /attempts/${r.attemptId}/reopen` | /regular /classes /attempts /students /my-work |
| `modules/fasttrack/MockDetailPage.tsx:227` | `PUT /attempts/${d.id}/scores/speaking/phu-trach` | /my-work /cases /students |
| `modules/fasttrack/MockDetailPage.tsx:250` | `POST /attempts/${d.id}/dua-lai-ca-luot` | /attempts /tong-quan /ke-hoach-test /cycles |
| `modules/fasttrack/MockDetailPage.tsx:840` | `POST /attempts/${d.id}/skills/${skill}/skip` | /attempts /ke-hoach-test /cham /cycles |
| `modules/fasttrack/MockDetailPage.tsx:1097` | `POST /attempts/${detail.id}/deadline` | /attempts /tong-quan |
| `modules/fasttrack/MockDetailPage.tsx:1142` | — | /attempts /tong-quan /classes /my-work /yeu-cau |
| `modules/fasttrack/ScoreEntry.tsx:177` | — | /attempts /tong-quan /classes /students /my-work |
| `modules/platform/AccountsAdmin.tsx:125` | — | /demo/accounts |
| `modules/platform/AdminPage.tsx:85` | — | /admin/nhat-ky |
| `modules/platform/BangQuyDoiAdmin.tsx:73` | — | /ref/bang-quy-doi /admin/nhat-ky |
| `modules/platform/CatalogAdmin.tsx:93` | — | /ref/routes /ref/programmes |
| `modules/platform/CatalogAdmin.tsx:94` | — | /admin/nhat-ky |
| `modules/platform/CauHinhCaseSos.tsx:53` | — | quên `/admin/cau-hinh-case-sos` |
| `modules/platform/ChiNhanhAdmin.tsx:50` | `PUT /admin/chi-nhanh/${b.id}` | /ref/branches /admin/nhat-ky |
| `modules/platform/DaXoaAdmin.tsx:48` | `POST /thung-rac/${m.id}/khoi-phuc` | /thung-rac /cases /students /hoc-vien-lop /lenh-chuyen /my-work /tong-quan /yeu-cau /violations /measures /classes /y-thuc /attachments |
| `modules/platform/HanMacDinhAdmin.tsx:64` | — | /admin/nhat-ky |
| `modules/platform/KyVongNguongAdmin.tsx:38` | — | /admin/nhat-ky |
| `modules/platform/XoaTaiKhoanPanel.tsx:32` | `POST /admin/accounts/${userId}/xoa` | /admin/accounts /demo/accounts |
| `modules/students/CacLoTrinh.tsx:37` | `DEL /cycles/${d.id}/buoc-tiep` | /students /lo-trinh /my-work /hoc-vien-lop |
| `modules/students/ChuyenLopPanel.tsx:94` | — | /students /attempts /tong-quan /cases /classes /hoc-vien-lop /my-work /yeu-cau /lenh-chuyen |
| `modules/students/ChuyenLopPanel.tsx:280` | `POST /yeu-cau/${daChuyen.theDuyet}/huy-quyet-dinh` | /yeu-cau |
| `modules/students/CotCaseHv.tsx:117` | — | /my-work |
| `modules/students/GocLichThi.tsx:171` | — | /hoc-vien-lop? /hoc-vien-lop/theo-vai /hoc-vien-lop/em /students |
| `modules/students/GocPhanCongGv.tsx:137` | — | /hoc-vien-lop/phan-cong |
| `modules/students/GocPhanCongGv.tsx:166` | `POST /phan-cong/hoan-tac` | /hoc-vien-lop/phan-cong gộp /my-work gộp /classes |
| `modules/students/GocPhanCongGv.tsx:174` | `POST /phan-cong/hoan-tac` | /hoc-vien-lop/phan-cong gộp /my-work gộp /classes gộp /hoc-vien-lop/phan-cong gộp /my-work gộp /classes |
| `modules/students/GocPhanCongGv.tsx:403` | — | /hoc-vien-lop/phan-cong |
| `modules/students/GocPhanCongGv.tsx:404` | — | gộp /my-work gộp /classes |
| `modules/students/GocPhanCongGv.tsx:407` | `POST /phan-cong/hoan-tac` | /hoc-vien-lop/phan-cong |
| `modules/students/HangLichMt.tsx:174` | `POST /attempts/${attemptId}/bo-tuan` | /attempts /cycles /ke-hoach-test /students /classes |
| `modules/students/HopGiaHan.tsx:36` | `PUT /cycles/${x.cycleId}/han-sau-thi` | /my-work /students /hoc-vien-lop /tong-quan /cycles /lo-trinh |
| `modules/students/HopTamDungKetThuc.tsx:15` | — | /students /classes /hoc-vien-lop /cases /my-work /tong-quan /hoc-vien-lop/luu-tru |
| `modules/students/KetLuanKhoa.tsx:50` | `PUT /students/${studentId}/ket-luan-ft` | /students |
| `modules/students/KetLuanKhoa.tsx:114` | `PUT /students/${studentId}/ket-luan-ft` | /students /cases /my-work |
| `modules/students/KetLuanKhoa.tsx:196` | `PUT /mini-test/${mt.id}` | /students /cases /yeu-cau /my-work |
| `modules/students/KetQuaThiThatPanel.tsx:107` | — | /students /lo-trinh /classes /hoc-vien-lop /work /my-work /cycles |
| `modules/students/LuuTruPage.tsx:124` | — | /students /hoc-vien-lop /classes /my-work |
| `modules/students/LuuTruPage.tsx:134` | `POST /students/${id}/hoan-tac-quay-lai` | /students /hoc-vien-lop /classes |
| `modules/students/NganCase.tsx:162` | — | /my-work /students |
| `modules/students/NganCase.tsx:207` | — | /cases/${data.id} |
| `modules/students/PanelBuocTiep.tsx:37` | — | /students /classes /hoc-vien-lop /cases /lo-trinh /my-work /cycles /tong-quan |
| `modules/students/PanelMotEm.tsx:84` | — | /hoc-vien-lop |
| `modules/students/QuayLaiHoc.tsx:21` | — | /students /classes /hoc-vien-lop /cases /my-work /tong-quan /cycles |
| `modules/students/StudentDetailPage.tsx:248` | — | /my-work /students/${data.id}/y-thuc |
| `modules/students/StudentManagePanel.tsx:192` | `POST /students/${studentId}/hoc-lai` | /students /classes /hoc-vien-lop /cases |
| `modules/students/StudentManagePanel.tsx:195` | `POST /students/${studentId}/hoc-lai` | /students /classes /hoc-vien-lop /cases |
| `modules/students/StudentManagePanel.tsx:400` | `POST /students/${student.id}/de-xuat-sua` | /yeu-cau |
| `modules/students/StudentManagePanel.tsx:413` | `POST /cycles/${cycle.id}/mon-dang-ky` | /students /cycles /attempts /classes /hoc-vien-lop /tong-quan |
| `modules/students/StudentManagePanel.tsx:418` | `PATCH /students/${student.id}` | /students /hoc-vien-lop |
| `modules/students/StudentManagePanel.tsx:426` | `POST /cycles/${cycle.id}/lo-trinh/hoan-tac` | /students /cycles /attempts /classes /hoc-vien-lop |
| `modules/students/StudentManagePanel.tsx:432` | `POST /cycles/${cycle.id}/lo-trinh/hoan-tac` | /students /cycles /attempts /classes /hoc-vien-lop |
| `modules/students/StudentPlanPanel.tsx:45` | — | /attempts /classes /students |
| `modules/students/StudentsPage.tsx:224` | — | /my-work /hoc-vien-lop |
| `modules/students/StudentsPage.tsx:691` | — | /classes /hoc-vien-lop |
| `modules/students/StudentsPage.tsx:695` | — | /classes /hoc-vien-lop /students |
| `modules/students/TienDoTrenLop.tsx:70` | — | `/students/:id/bai-tren-lop` |
| `modules/students/XemTruocHangLoatPanel.tsx:76` | — | /students /classes /hoc-vien-lop /cases /lenh-chuyen /my-work |
| `modules/students/XemTruocHangLoatPanel.tsx:98` | — | /students /classes /hoc-vien-lop /cases /lenh-chuyen /my-work |
| `modules/test/keHoach/GhiChuLichThi.tsx:13` | — | /ke-hoach-test |
| `modules/test/keHoach/HopKhoiPhucKetQua.tsx:30` | `POST /attempts/${attemptId}/khoi-phuc-ket-qua` | /attempts /tong-quan /classes /students /ke-hoach-test /cycles /my-work |
| `modules/test/keHoach/HopKhoiPhucKetQua.tsx:90` | — | /attempts /tong-quan /classes /students /ke-hoach-test /cycles /my-work |
| `modules/test/keHoach/HopKyNang.tsx:235` | `POST /ke-hoach-test/dot` | /ke-hoach-test /attempts /cham |
| `modules/test/keHoach/HopKyNang.tsx:282` | `POST /attempts/${attemptId}/bo-tuan` | /ke-hoach-test /attempts /cham /cycles |
| `modules/test/keHoach/HopKyNang.tsx:285` | `POST /ke-hoach-test/dot` | /ke-hoach-test /attempts /cham /cycles |
| `modules/test/keHoach/HopSEx.tsx:37` | — | /ke-hoach-test /cham /lich-su |
| `modules/test/keHoach/LopKeHoach.tsx:33` | — | /ke-hoach-test /attempts /cham |
| `modules/test/keHoach/NganXepHangLoat.tsx:174` | — | /ke-hoach-test /attempts /cham |
| `modules/test/keHoach/NganXepLichMt.tsx:220` | — | /ke-hoach-test /attempts /cham |
| `modules/test/keHoach/XepTheoHocVien.tsx:266` | `POST /ke-hoach-test/dot` | /ke-hoach-test /attempts /cham /cycles |
| `modules/test/keHoach/xoaMt.ts:12` | — | /ke-hoach-test /attempts /cham /cycles /tong-quan /my-work |
| `modules/tutor/HopTutor.tsx:45` | — | /tutors |
| `modules/tutor/HopTutor.tsx:59` | `DEL /tutors/${tutor.id}` | /tutors |
| `modules/tutor/HopTutor.tsx:150` | — | /tutors |
| `modules/tutor/HopTutor.tsx:152` | `POST /tutors/gop/hoan-tac` | /tutors |
| `modules/tutor/PanelTutor.tsx:84` | `PATCH /tutors/nhan-xet/${dangSua}` | /tutors |
| `modules/tutor/PanelTutor.tsx:97` | `DEL /tutors/nhan-xet/${n.id}` | /tutors |
| `modules/tutor/TaiDanhSach.tsx:40` | — | /tutors |
| `modules/worklist/MeetingPage.tsx:345` | `PUT /meeting/units/${unit.unitId}/reports/${cell.key}` | /meeting /tong-quan /signals |
| `modules/worklist/MeetingPage.tsx:384` | `DEL /meeting/reports/${cell.reportId}/tasks/${lt.id}` | /meeting |
| `modules/worklist/MeetingPage.tsx:395` | `DEL /meeting/reports/${cell.reportId}/tasks/${lt.id}` | /meeting |
| `modules/worklist/MgmtTasksPage.tsx:467` | `POST /mgmt-tasks/${task.id}/update` | /mgmt-tasks |
| `modules/worklist/MgmtTasksPage.tsx:563` | `PATCH /mgmt-tasks/${task.id}` | /mgmt-tasks |
| `modules/worklist/MgmtTasksPage.tsx:710` | `POST /tasks` | /tasks /cases /students /my-work |
| `modules/worklist/MgmtTasksPage.tsx:723` | `POST /mgmt-tasks` | /mgmt-tasks |
| `modules/worklist/TongQuanV5.tsx:449` | — | /yeu-cau/dem /tong-quan |
| `modules/worklist/TongQuanV5.tsx:545` | — | /yeu-cau/dem /tong-quan |
| `modules/yThuc/BangPhoiHop.tsx:100` | — | /classes /students /my-work |
| `modules/yThuc/BangPhoiHop.tsx:208` | — | /classes /students /my-work |
| `modules/yThuc/BangPhoiHop.tsx:443` | `POST /phoi-hop-sos/${id}/remove` | /classes /students /my-work |
| `modules/yThuc/CaseSosControls.tsx:52` | — | /cases /students /tong-quan /my-work /yeu-cau |
| `modules/yThuc/ClassYThucCard.tsx:159` | — | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/ClassYThucCard.tsx:170` | `POST /students/${x.studentId}/y-thuc/bo-ghi-nhan` | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/ClassYThucCard.tsx:180` | `POST /students/${studentId}/y-thuc/${bo ?` | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/ClassYThucCard.tsx:357` | — | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/ClassYThucCard.tsx:360` | `POST /tinh-hinh/${x.id}/tra-loi/hoan-tac` | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/ClassYThucCard.tsx:605` | — | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/DaThucHienPanel.tsx:64` | `POST /y-thuc/xu-ly/${measureId}/da-thuc-hien` | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/DeleteViolationConfirm.tsx:13` | — | /violations /measures /classes /students /y-thuc |
| `modules/yThuc/KhaiBacLoPanel.tsx:22` | — | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/KhaiBacPanel.tsx:73` | `POST /students/${studentId}/y-thuc/khai-bac` | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/kieu.ts:24` | — | /violations /measures /classes /students /y-thuc |
| `modules/yThuc/LoYThucPanel.tsx:22` | — | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/PanelXemViPham.tsx:44` | — | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/PhoiHopSosSection.tsx:221` | `POST /phoi-hop-sos/${a.id}/mo-lai` | /classes /students |
| `modules/yThuc/PhoiHopSosSection.tsx:235` | `POST /phoi-hop-sos/${a.id}/han` | /classes /students /my-work |
| `modules/yThuc/PhoiHopSosSection.tsx:311` | `POST /phoi-hop-sos/${actionId}/confirm` | /classes /students |
| `modules/yThuc/PhoiHopSosSection.tsx:370` | `POST /phoi-hop-sos/${actionId}/remove` | /classes /students |
| `modules/yThuc/PhoiHopSosSection.tsx:373` | `POST /phoi-hop-sos/${actionId}/mo-lai` | /classes /students |
| `modules/yThuc/PhoiHopSosSection.tsx:416` | `POST /attempts/${attemptId}/phoi-hop-sos` | /classes /students |
| `modules/yThuc/StudentYThucSection.tsx:100` | — | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/TinhHinh.tsx:26` | — | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/XacNhanXuLyPanel.tsx:29` | — | DUONG_LAM_MOI_Y_THUC: /violations /classes /students /y-thuc /my-work /yeu-cau /tong-quan /metrics |
| `modules/yThuc/XemXuLyPanel.tsx:85` | `PUT /yeu-cau/${the!.id}` | /yeu-cau |
| `modules/yThuc/XemXuLyPanel.tsx:120` | `POST /discipline-measures/${d.id}/thu-hoi` | /yeu-cau |
| `modules/yThuc/XemXuLyPanel.tsx:131` | `POST /yeu-cau/${th.id}/rut` | /yeu-cau |
| `ui/BangChung.tsx:79` | — | /attachments |
| `ui/BangChung.tsx:157` | `POST /attachments/link` | /attachments |
| `ui/BangChung.tsx:168` | `POST /attachments/link` | /attachments |
| `ui/SoLieu.tsx:329` | — | /metrics /tong-quan /my-work /cases |
| `ui/SoLieu.tsx:345` | `POST /interventions/${v.paId}/hoan-tac-xac-nhan` | /metrics /tong-quan /my-work /cases |
| `ui/SoLieu.tsx:358` | `POST /interventions/${v.paId}/hoan-tac-xac-nhan` | /metrics /tong-quan /my-work /cases |
