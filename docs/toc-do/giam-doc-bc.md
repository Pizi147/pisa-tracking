# GIAM-DOC-BC — giảm dòng đọc sau deploy 07/11 (log bản chính)

Đo trên **bản chép bản chính 07/11 đã migrate** (`D:\pisa-mig\mig.sqlite`, chép ra tạm, chỉ đọc), mọi tài khoản đã duyệt (85),
gọi HTTP thật (`createApp`, phiên từng người, `BAN_CHINH=1`), đếm câu · dòng trả như log `[cham]` (`soCauSql` / `soDongSql`). JSON so từng byte (chuẩn hoá giờ).

## a — `CON_O_SQL` bỏ lượt MT lịch sử chấm band

Gốc câu top `/my-work` (`WITH ids(id) AS (VALUES …)` 4 017 dòng): Công việc đọc lượt "còn ô chờ" (`o_cho_tu <= hôm nay`) rồi nạp lịch kỹ năng + điểm của chúng.
Bản chính có ~650 lượt **MT lịch sử** (`lich_su = 1`, nhập bù) ở chương trình band: cờ vẫn ghi ô trống, nhưng `viewSkill` cho ô của chúng `progress = 'lich_su'`
→ không bao giờ là ô chờ chấm / nợ / việc (QL Monbay: 564 / 1 003 lượt đọc là lượt lịch sử, 0 việc). Thêm vào `CON_O_SQL`: `lich_su = 0` hoặc chương trình tỷ lệ
(`regularSkillViews` không xét `lich_su` — giữ). Vế "Chốt tuần MT" bỏ lượt lịch sử (`myWork` đã bỏ qua). Không đổi cờ, không migrate.

| đường (×1, TB theo vai, bản chép thật) | dòng trước → sau |
|---|---|
| `/my-work` GV (46) | 2 395 → 1 552 |
| `/my-work` QL (2) · QL+GV (7) | 6 578 → 4 737 · 4 648 → 3 213 |
| `/my-work` Admin+GV · văn phòng (8) · TVV (12) | 10 721 → 7 158 · 5 357 → 2 857 · 2 067 → 1 056 |
| `/my-work?nguoi=tat-ca` QL · QL+GV · văn phòng | 7 502 → 5 689 · 5 225 → 3 807 · 5 426 → 2 920 |
| `/classes` QL · văn phòng · GV | 4 098 → 2 162 · 5 296 → 2 703 · 457 → 228 |
| `/cham/lich-test` QL · văn phòng · GV | 4 023 → 2 213 · 5 261 → 2 854 · 1 482 → 653 |
| `/hoc-vien-lop` văn phòng · CX · TVV · GV | 15 245 → 13 217 · 13 459 → 11 578 · 4 362 → 3 510 · 1 529 → 1 312 |
| **tổng 7 đường × 85 tài khoản** | **1 744 308 → 1 354 336 (−22 %)**; `/my-work` riêng 280 861 → 176 486 (−37 %) |

Số câu không đổi, trừ `/hoc-vien-lop` +1–2 câu ở vài vai (lượt lịch sử không còn được nạp sẵn → nạp lô một lượt sau; dòng vẫn giảm).
`/tong-quan/v5`, `/phan-tich/giao-vien`, `/cham/lich-test/qua-han`: không đổi. JSON 680 / 680 lần gọi giống hệt; bộ demo (`tocDo.run`): 758 / 758 đường câu · dòng · JSON
không đổi (demo không có lượt lịch sử band còn cờ) → trần `tocDoDuong.ts` giữ; khoá bằng phép kiểm `GIAM-DOC-BC` (prTd7b, đỏ với mã cũ) + EXPLAIN `CON_O_SQL` vẫn đi `idx_attempt_o_cho`.

Ước / ngày (dòng trả; Turso tính cả dòng duyệt nên giảm thật lớn hơn): `/my-work` −1 290 dòng / lần × ~1 000 lần ≈ **−1,3 triệu**; `/classes`, Lịch Test, `/hoc-vien-lop`,
"Tất cả" −700 đến −2 000 / lần × vài trăm lần ≈ **−0,5–0,8 triệu** → **≈ −1,8–2,1 triệu dòng / ngày**.

## [XM] chưa làm

1. `phanCongDangHoatDong` (TL-VIEC) đọc cả bảng phân công (527 dòng) mỗi request Công việc — đánh đổi có chủ ý (một câu thay năm). Nhớ theo tiến trình (`nhoThamChieu`)
   cần trigger phiên bản trên `teacher_assignments` + `users` (tên) = migrate trigger, ngoài phạm vi "chỉ mục". Ước ~0,3 triệu / ngày.
