# PR-MTGON + PR-LTGON — Chống kẹt Test trước deploy · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`). TDD: viết phép kiểm ĐỎ trước.

**Goal:** Gỡ mọi chỗ làm Quản lý (QL) bị kẹt khi dời / huỷ / xếp lại Mock Test và Test lớp thường, theo luật đơn giản chủ sản phẩm chốt 08/10, để deploy sớm.

**Architecture:** Chỉ nới / sửa luật trên nền có sẵn (không thêm trạng thái, không thêm bảng, không đánh số lại MT). Máy chủ: `server/src/fasttrack/{skillSchedule,attempts,absence}.ts`, `server/src/keHoach/keHoachTest.ts`, `shared/domain/{thaoTacMt,lichMt,keHoachTest}.ts`, `server/src/classes/schedule.ts`, `server/src/normal/regular.ts`. Web: đổi chữ/ẩn hiện mục menu có sẵn — không màn mới.

**Tech Stack:** TypeScript, Express, libsql (Turso), React. Kiểm: `server/src/tests/*.tests.ts` gọi từ `run.ts`; `npm run check`.

**Spec:** quyết định chủ sản phẩm 08/10 (chép nguyên ở dưới) + phân tích `thiet-ke/mockup-mt-quy-trinh-2026-10-08.html` mục 1–3. Khi phân tích (đề xuất 5 thao tác, đánh số lại…) khác quyết định dưới đây → **theo quyết định dưới đây**.

## Luật chủ sản phẩm chốt 08/10 (bắt buộc, chép nguyên ý)
1. **Dời lịch (QL):** tuần mới hợp lệ (không trùng tuần một MT khác, không vượt qua MT sau) → **giữ điểm, chỉ dời**. Không hợp lệ → báo lý do, **không làm gì** (bỏ T2: không tự huỷ kết quả / bỏ lịch lượt sau). Không đánh số lại.
2. **Xoá điểm** (QL hoặc GV): là xoá; nhập lại được. Giữ như hiện nay.
3. **QL huỷ một kỹ năng lúc nào cũng được** (kể cả MT cũ, kể cả đã tới tuần thi), ở menu ⋯ của kỹ năng mọi nơi có ô kỹ năng. Kỹ năng bỏ khỏi lượt; "Đưa lại vào đợt" để thi lại.
4. **QL huỷ hẳn một lượt MT bất kỳ lúc nào** (không chỉ MT cuối). Lượt về trống; xếp lại thì vẫn là MT đó (dùng lại số).
5. **Xếp đè thoải mái:** xếp hàng loạt / hộp ghi đè lịch cũ, kể cả MT cũ và kỹ năng đã huỷ, trong luật 1.
6. **Lớp thường a:** QL đổi tuần Progress/Final của lớp → bài chưa có điểm của các em **dời theo luôn** (không hỏi).
7. **Lớp thường b:** GV gõ "-" mà tuần dời tới trùng tuần Final → **hoà vào luôn** (lưu, kỹ năng đó thi cùng tuần Final), không chặn.
8. Nguyên tắc: nghĩ tới đầu ra (em có lịch, có điểm). Không ảnh hưởng đầu ra thì không thêm bước, không thêm câu hỏi.

## Global Constraints
- KHÔNG dùng Fable. Không deploy, không chạm Turso/Netlify/DB bản chính.
- Turso: không tham số đặt tên; ≤ 900 tham số mỗi câu; ≤ 200 câu SQL mỗi lần ghi; UNION đặt AS mọi cột.
- `server/src/db.ts` (bộ nhớ câu lệnh, #277): KHÔNG đụng.
- Mọi thao tác nhiều bước ghi trong một `tx()`; mọi thay đổi lịch/điểm có `writeAudit` / nhật ký như đường cũ.
- Quyền: các nới lỏng dưới đây chỉ cho QL / Quản trị (quyền hiện có `ATTEMPT_CANCEL` / quyền xếp lịch của QL). GV giữ nguyên luật cũ.
- Không migrate trừ khi bắt buộc; nếu có: file riêng, chạy lặp được, nối sau `prCt2`.
- Giao diện: chỉ đổi chữ/ẩn hiện mục có sẵn, theo bảng "Chữ trên màn" dưới. `/ponytail lite`, `impeccable audit` nếu có skill; không có thì ghi trong PR.

## Chữ trên màn (mockup chữ — chủ SP duyệt cùng kế hoạch)
| Chỗ | Trước | Sau |
|---|---|---|
| ⋯ kỹ năng (QL) | "Huỷ phần còn lại" / không có huỷ khi MT cũ | **"Huỷ kỹ năng"** (mọi trạng thái chưa có điểm; có điểm thì hỏi "Xoá điểm và huỷ kỹ năng?") |
| ⋯ kỹ năng đã huỷ / không yêu cầu | "Khôi phục và đặt tuần" (ẩn với MT cũ) | **"Đưa lại vào đợt"** (luôn hiện) |
| ⋯ lượt / Hồ sơ MT (QL) | "Huỷ cả lượt" chỉ MT cuối | **"Huỷ MT{n}"** mọi lượt; hộp xác nhận 1 câu: "Huỷ MT{n}? Lịch và điểm của lượt này sẽ bỏ. Xếp lại thì vẫn là MT{n}." [Không huỷ] [Huỷ MT{n}] |
| Hồ sơ MT khi mọi kỹ năng đã huỷ | "Dời lịch thi cả đợt" (luôn lỗi) | ẩn nút đó; hiện "Đưa lại cả 4 kỹ năng" + "Huỷ MT{n}" |
| Dời vượt MT sau | chip vàng / popup "huỷ kết quả" | câu đỏ: "MT{n+1} thi {tuần}. Chọn tuần trước {tuần}, hoặc dời MT{n+1} trước." |

---

### Task 1: Dời lịch — bỏ T2, chỉ chặn khi không hợp lệ

**Files:** Modify `server/src/fasttrack/skillSchedule.ts` (`kiemVuot` ~617, `boLichLuotBiVuot` ~723, các cổng gọi chúng), `server/src/keHoach/keHoachTest.ts` (`luuDot`, hàng loạt ~948-1029), web `web/src/modules/test/keHoach/HopXacNhanHuyLich*` (bỏ đường gọi). Test: tạo `server/src/tests/prMtGon.tests.ts`, gọi cuối `run.ts`.
- [ ] Đỏ: MTG-1a — MT3 có điểm, dời MT3 sang tuần hợp lệ (trước MT4, không trùng) → 200, điểm còn nguyên, tuần đổi. MTG-1b — dời MT3 vượt qua MT4 (MT4 có hoặc không có điểm) → 400 với câu "MT4 thi … Chọn tuần trước …", **không** có dòng `ket_qua_huy` mới, MT4 giữ lịch + điểm. MTG-1c — trùng tuần MT khác → 400 như cũ.
- [ ] Sửa: mọi cổng dời (hộp `/dot`, `/attempts/:id/week`, `/attempts/:id/skills/:skill/week`, `/hang-loat`, Khôi phục) gọi cùng một kiểm "hợp lệ" (`checkWeekVsNeighbours` trùng + vượt) → vượt là **blocker**, không còn nhánh `kiemVuot → boLichLuotBiVuot/huyKetQuaLuot`. "Dời cả đợt" dời cả kỹ năng có điểm (giống hộp một đợt), giữ điểm.
- [ ] Bỏ chip vàng / popup xác nhận huỷ kết quả ở web (cờ `xacNhanHuyLich`). Giữ `ket_qua_huy` + "Khôi phục kết quả" cho dữ liệu cũ đã có.
- [ ] Sửa phép kiểm cũ đang kiểm T2 (grep `huy_vuot`, `ket_qua_huy`, `xacNhanHuyLich` trong `server/src/tests`) theo luật mới — ghi tên phép kiểm đã đổi vào mô tả PR.
- [ ] `npm run build:server && node dist-server/server/src/tests/run.js` xanh phần liên quan; commit.

### Task 2: Huỷ kỹ năng lúc nào cũng được (QL) + Đưa lại

**Files:** `server/src/fasttrack/skillSchedule.ts` (`setSkillScope` ~1016, chặn tuần thi ~1037), `server/src/fasttrack/attempts.ts` (`huyLuot` `phan-con-lai` ~1339), `server/src/fasttrack/absence.ts` (`restoreCancelledSkill` ~639), `shared/domain/thaoTacMt.ts` (~29-83), web menu ⋯ (`HopThaoTacMt.tsx`, `HopKyNang.tsx`, `MockDetailPage.tsx`).
- [ ] Đỏ: MTG-2a — QL huỷ kỹ năng S của MT đang trong tuần thi → `required=0`, lượt tính kết quả trên L R W. MTG-2b — MT cũ, huỷ kỹ năng → được. MTG-2c — kỹ năng có điểm, `xoaDiem:true` → điểm xoá (nhật ký giữ) + bỏ khỏi lượt; thiếu cờ → 409 "Kỹ năng đã có điểm — xác nhận xoá điểm". MTG-2d — kỹ năng đang `cancelled` (dữ liệu cũ, kể cả MT cũ) → "Đưa lại vào đợt" được (về chưa xếp hoặc đặt tuần hợp lệ). MTG-2e — GV gọi huỷ kỹ năng → 403.
- [ ] Sửa: "Huỷ kỹ năng" (QL) = `setSkillScope(required=0)`; bỏ chặn tuần thi / MT cũ cho QL. Kỹ năng có điểm: xoá điểm qua đường `huyDiem` trong cùng tx khi có cờ. "Huỷ phần còn lại" ở web đổi thành "Huỷ kỹ năng" từng kỹ năng (không còn tạo `sit_status='cancelled'` thủ công). Trạng thái `cancelled` chỉ còn do hệ thống (vắng 2 lần, từ chối dời).
- [ ] `thaoTacMt.ts`: xét "đã huỷ / không yêu cầu" **trước** "MT cũ" → luôn có "Đưa lại vào đợt". "Đưa lại" với tuần không hợp lệ thì về "Chưa xếp" (không chặn).
- [ ] Web: chữ theo bảng "Chữ trên màn"; commit.

### Task 3: Huỷ MT bất kỳ lượt + xếp lại dùng lại số, sạch

**Files:** `shared/domain/lichMt.ts` (~96-99 điều kiện MT cuối), `server/src/fasttrack/attempts.ts` (`huyLuot` `ca-luot`, `reopenAttempt` ~1388, `hoiSinhLuot` ~1173), `server/src/fasttrack/ketQuaHuy.ts`, web `MockDetailPage.tsx` (~186-198, 327), `shared/domain/keHoachTest.ts` (~252-268 "đã xong").
- [ ] Đỏ: MTG-3a — QL huỷ MT2 khi có MT3 → lượt MT2 `cancelled`, điểm MT2 xoá (nhật ký giữ), MT3 giữ nguyên. MTG-3b — xếp lại MT2 (hàng loạt hoặc hộp) → hồi sinh đúng dòng MT2, **không** mang điểm / `ket_qua_huy` cũ, tuần phải hợp lệ theo luật 1. MTG-3c — "Mở lại lượt" vào tuần vượt MT sau → mở lại ở trạng thái "Chưa xếp" (bỏ tuần), không nằm sai thứ tự. MTG-3d — lượt mọi kỹ năng `cancelled`: hàng loạt chọn được (không báo "đã xong"), "Đưa lại cả 4 kỹ năng" một lần trong một tx.
- [ ] Sửa: bỏ điều kiện "chỉ MT cuối / chưa có điểm / chưa thi" cho QL (giữ GV không được). Hồi sinh: xoá `ket_qua_huy` chưa khôi phục của lượt (ghi audit) trước khi dùng lại. Web: hộp xác nhận 1 câu; Hồ sơ MT khi mọi kỹ năng đã huỷ ẩn "Dời lịch thi cả đợt".
- [ ] Commit.

### Task 4: Xếp đè (hàng loạt + hộp) kể cả MT cũ, kỹ năng đã huỷ

**Files:** `shared/domain/keHoachTest.ts` (~252-268, `dotMtMoi` ~274), `server/src/keHoach/keHoachTest.ts` (hàng loạt ~948-1029, `xepMoi` ~677, chỗ "giữ" kỹ năng đã huỷ ~487), `server/src/fasttrack/skillSchedule.ts` (`setSkillWeek` chặn kỹ năng đã huỷ).
- [ ] Đỏ: MTG-4a — hàng loạt chọn MT1 là MT cũ → ghi đè tuần các kỹ năng chưa điểm; kỹ năng có điểm giữ điểm, dời theo luật 1. MTG-4b — hàng loạt/hộp với kỹ năng `cancelled` → kỹ năng được đưa lại + đặt tuần (đè). MTG-4c — `setSkillWeek` gọi thẳng trên kỹ năng `cancelled` mà không qua đường "đưa lại" → 400 rõ (không đổi tuần lặng lẽ).
- [ ] Sửa + commit.

### Task 5: Lớp thường — đổi mốc dời bài theo; "-" trùng Final thì hoà vào

**Files:** `server/src/classes/schedule.ts` (`setClassProgress` ~572-612), `server/src/normal/regular.ts` (~670-685), dùng lại hàm dời bài lớp thường có sẵn (`hang-loat` theo `kind` / `setSkillWeek` lớp thường), `shared/domain/mt0.ts` nếu MT0 đọc mốc lớp (`mt0.ts:83-86`).
- [ ] Đỏ: LTG-a — lớp có 3 em, Final W2 DEC (1 em đã có điểm Final). QL đổi Final → W3 DEC → 2 em chưa điểm dời bài Final (mọi kỹ năng chưa điểm) sang W3 DEC trong cùng tx; em có điểm giữ nguyên; MT0 chưa thi đi theo bài Final như hiện có. Tương tự Progress. Số câu SQL ≤ 200 cho lớp 40 em (dùng `theoLo`).
- [ ] Đỏ: LTG-b — GV gõ "-" kỹ năng Progress, tuần sau trùng tuần Final → lưu được, kỹ năng chuyển sang tuần Final (cùng tuần), không 400. Trùng/vượt chỗ khác vẫn theo luật cũ.
- [ ] Sửa: sau `UPDATE classes` trong `setClassProgress`, nếu đổi `progress_week_override` / `final_week_override` → dời bài loại tương ứng của các em đang học lớp (chưa điểm) sang tuần mốc mới, cùng tx, `writeAudit`. `regular.ts`: khi blocker duy nhất là trùng/vượt bài Final cùng lộ trình → đặt tuần = tuần Final thay vì throw.
- [ ] Commit.

### Task 6: Kiểm toàn bộ + PR
- [ ] `npm run check` MỘT lần — xanh (ghi số).
- [ ] Mô tả PR: luật 1–8, phép kiểm cũ đã đổi (Task 1), chú thích `ponytail:`, giới hạn. Mở PR vào main, KHÔNG merge.

## Self-review
Luật 1 → Task 1 · 2 → giữ (không task) · 3 → Task 2 · 4 → Task 3 · 5 → Task 4 · 6, 7 → Task 5 · 8 → toàn bộ (không thêm hỏi/bước). Task 1–4 cùng nhóm file MT → **một session** (PR-MTGON). Task 5 file khác → **session song song** (PR-LTGON) được.
