# PR-CHENMT · Chèn MT về trước → đánh số lại theo thời gian — kế hoạch

> Chủ sản phẩm chốt 07/10 (phương án A). Soạn từ `origin/main` 09223024. Sau deploy 10/2026.
> Mockup: `thiet-ke/mockup-chen-mt-2026-10-07.html` (**chờ duyệt** — chưa duyệt thì session code dừng ở Task 4).

## Goal
Hộp một đợt Mock Test (vd "Chu Minh Hiếu · MT4", Tuần chung W4 AUG): Quản lý / Quản trị xếp MT về tuần TRƯỚC các MT trước
nó (MT2 W3 SEP, MT3 W3 OCT) → hiện bị chặn ở `checkWeekVsNeighbours` (`server/src/fasttrack/skillSchedule.ts:549-554`,
câu "Phần thi của lượt sau không được xếp trước phần cuối của lượt trước."). Sau PR: QL/QT được lưu sau một popup xác nhận,
máy đánh số lại MT theo thời gian (bài W4 AUG → MT2, MT2 → MT3, MT3 → MT4). Điểm giữ nguyên, đi theo bài (`attempt_id`).
GVCN / GV: chặn như cũ.

## Architecture
- Điểm, kỹ năng, lịch, đề nghị dời, Case đều khoá theo `attempt_id`; chỉ `assessment_attempts.attempt_no` (và bản sao
  `case_milestones.attempt_no`) mang số. Đánh số lại = đổi cột số trong MỘT giao dịch, không chuyển dữ liệu.
- `UNIQUE (cycle_id, attempt_no)` (`server/src/schema.sql:519`): đổi số hai bước trong cùng `tx` — bước 1
  `attempt_no = -attempt_no` (số âm không trùng số dương), bước 2 gán số mới. SQLite kiểm UNIQUE theo từng câu nên không
  được đổi thẳng 4→2 khi 2 còn đó. Không cần migrate.
- Một hàm mới `danhSoLaiMt(conn, cycleId, actor)` trong `skillSchedule.ts`; đường lưu đợt (`luuDot`,
  `keHoachTest.ts:531`) gọi nó trong `tx` sau khi ghi tuần. Không thêm bảng, không thêm cột.

## Kiểm kê mã thật (mọi chỗ phụ thuộc `attempt_no`)
| Chỗ | file:dòng | Lưu chữ hay tính? | Việc |
|---|---|---|---|
| Khoá UNIQUE | `schema.sql:519` | — | hai bước âm/dương (trên) |
| Chặn lân cận | `skillSchedule.ts:498-582` (`soSanh` FT = `o.attempt_no - input.attemptNo`, :545-546) | tính | QL/QT: biến chặn "lượt sau trước lượt trước" thành **đề nghị đánh số lại** khi bài dời nằm GỌN giữa hai lượt (không chồng tuần); chồng tuần / trùng tuần vẫn chặn |
| Dời vượt T2 | `skillSchedule.ts:607+` `kiemVuot`, `luotBiVuot` | tính | khác chiều (lượt TRƯỚC vượt lượt SAU → huỷ kết quả). Không đổi. Chèn về trước không qua `kiemVuot` vì không có lượt nào bị vượt về sau |
| Hộp đợt | `keHoachTest.ts:457-528` `kiemDotNoi` (gọi `checkWeekVsNeighbours` :508) | tính | thêm `ghiChu: 'danh-so-lai'` + `danhSoLai: [{attemptId, tu, den}]` trả cho web |
| Lưu đợt | `keHoachTest.ts:531-…` `luuDot` | — | thêm `xacNhanDanhSoLai?: boolean`; thiếu → 409 kèm danh sách; có → ghi tuần rồi `danhSoLaiMt` trong cùng `tx` |
| Đổi tuần cũ | `attempts.ts:1226` (đổi tuần nhiều kỹ năng) | — | giữ chặn (đường cũ, không phải hộp đợt) |
| Kỳ vọng band | `scoring.ts:108` `expectationFor(target, attemptNo)` | tính | **số MT đổi → kỳ vọng đổi** cho lần chấm SAU; xem Câu 1 |
| SOS các bước | `sos.ts:37` `stepsFor(attemptNo)`; `sosAuto.ts:65` `presetFor` | tính lúc tạo Case | Case đã tạo giữ nguyên bước; Case tạo sau dùng số mới |
| Tên Case | `cases.ts:78-93` đọc `case_milestones.attempt_no` | **lưu số** | UPDATE `case_milestones.attempt_no` theo `attempt_id` trong cùng `tx` (tên Case tự ra "MT3") |
| Nhãn Case khác | `cases.ts:601-602`, `:743` đọc `a.attempt_no` | tính | tự đúng |
| Mốc theo dõi | `sos.ts:107` `followUntilAfter` (FT theo `attempt_no`) | tính lúc ghi → `follow_until` lưu ngày | sau đánh số lại tính lại `follow_until` các Case mở của chu kỳ (`regular.ts:844` là mẫu) |
| PA đến MT kế | `sosAuto.ts:264-291` `tuan_mt_ke` (`nx.attempt_no > src.attempt_no`) | tính | tự đúng sau đổi số (thứ tự số = thứ tự thời gian) |
| Thông báo / nhật ký đã ghi "MT2" | `sos.ts:494,506,585`, `absence.ts:173,329,335,458,851`, `attempts.ts:1138-1360`, `chamCheo.ts:67`, `cycles.ts:350` | **lưu chữ** | GIỮ NGUYÊN (lịch sử). Thêm MỘT dòng `attempt_schedule_history` action `renumbered` cho mỗi bài đổi số + một dòng audit |
| Bản chụp PR-TK | `loTrinh/banChup.ts:85,225` (`ban_chup_luot.attempt_no`, `schema.sql:1921`) | lưu lúc đóng | chỉ lộ trình đã đóng; không xếp lịch được lộ trình đóng → không chạm. Phép kiểm khẳng định |
| Xuất Excel / Điểm theo lớp | `phanTich/xuatMt.ts:109,156,197`; `classes/phanTichLop.ts:124` | tính | tự đúng; phép kiểm đọc cột MT2 = bài W4 AUG |
| Hành trình, hồ sơ, Lịch Test | `students/hanhTrinh.ts:67,184`, `classes/classes.ts:503`, `cham/canCham.ts:104` | tính | tự đúng |
| `move_no` +100 (PR-BV) | `absence.ts:1006-1007`, `loaiYeuCau.ts:181` | theo `attempt_id` | không chạm; thẻ "Dời … MT2 lần 2" đã ghi chữ → lịch sử |
| MT0 | `kind = 'mt0'`, `mt0.ts:106` | — | KHÔNG đánh số lại; chỉ `kind='mock'`. Bài chèn thành MT1 vẫn qua `kiemTuanMt0` (MT1 sau MT0) |
| MT cũ (T1) | `skillSchedule.ts:779` `tinhLaiMtCu` → `lich_su` | lưu cờ theo tuần | không phụ thuộc số; vẫn gọi sau ghi tuần như cũ |
| Lượt huỷ | `status='cancelled'` | — | xem Global Constraints |
| Kỹ năng tách tuần | `skillSchedule.ts:530-540` first/last week | — | thứ tự theo **tuần sớm nhất** (bỏ kỹ năng huỷ / không bắt buộc) |
| `prMt` migrate | `migrate/prMt.ts:15-42` | một lần | không chạy lại |

## Global Constraints
- Chỉ Quản lý / Quản trị (cùng điều kiện `PLAN_WEEK` + vai QL/QT như T4 PR-MTa "xếp tuần đã qua"). GVCN/GV gọi thẳng API với
  `xacNhanDanhSoLai` → vẫn 400 câu chặn cũ (phân quyền ở máy chủ, không chỉ ẩn nút).
- Chỉ lộ trình FT (`cy.route` có). Khoá lớp thường (Progress/Final) giữ luật theo loại (`soThuTuLuot`), không đánh số.
- Thứ tự mới = tuần sớm nhất của bài (kỹ năng bắt buộc, chưa huỷ); hoà → `attempt_no` cũ. Lượt huỷ: giữ trong dãy theo tuần
  `planned_period_id` của nó (không có tuần → đứng sau cùng theo số cũ) — không để lỗ số, không đổi chữ trong lý do huỷ.
- Bài dời phải nằm GỌN giữa hai lượt (tuần cuối < tuần đầu lượt sau, tuần đầu > tuần cuối lượt trước). Chồng / trùng tuần
  → chặn như cũ. Không có đề nghị dời `pending` trên các bài đổi số (có → chặn: "Có đề nghị dời chờ duyệt").
- Turso: một lần ghi ≤ 200 câu (chu kỳ ≤ ~10 MT → 2 câu × n + milestones 1 câu + nhật ký n), `?` tham số vị trí, không
  `:ten`; `tx` hiện có (BEGIN IMMEDIATE). Không `prepare` libsql đường vòng (CLAUDE.md).
- Không migrate. Không đổi lịch sử chữ đã ghi.

## Skill bắt buộc
ponytail full (Task 1–3) · `/ponytail lite` + impeccable `clarify` (Task 4) · impeccable `audit` trước PR · `/security-review` ·
`/ponytail-review`.

## Task 1 · Hàm `danhSoLaiMt` (máy chủ, S)
1. 🔴 `server/src/tests/prChenMt.tests.ts` CM-1: chu kỳ MT1 W2 AUG, MT2 W3 SEP (có điểm), MT3 W3 OCT, MT4 chưa thi; gọi
   `danhSoLaiMt` sau khi MT4 → W4 AUG ⇒ số theo `attempt_id`: MT4cũ=2, MT2cũ=3, MT3cũ=4; điểm `assessment_scores` không đổi
   dòng; `case_milestones.attempt_no` theo bài; 1 dòng `renumbered` mỗi bài đổi. CM-2: MT0 giữ `attempt_no`. CM-3: lượt huỷ.
2. 🟢 Viết hàm: đọc MỘT câu (id, attempt_no, status, tuần sớm nhất), sắp, UPDATE âm rồi dương, UPDATE milestones bằng
   `CASE attempt_id`, ghi nhật ký. Trả `[{attemptId, tu, den}]`.
3. CM-4: đếm câu SQL ≤ 200 với 10 MT (dùng bộ đếm sẵn ở `tocDoDuong.ts`).

## Task 2 · Hộp đợt: kiểm + lưu (máy chủ, M)
1. 🔴 CM-5 QL: `kiemDot` MT4 → W4 AUG trả `ghiChu:'danh-so-lai'` + danh sách; `luuDot` không cờ → 409 có danh sách; có cờ →
   lưu, số mới. CM-6 GVCN cùng thao tác (kể cả gửi cờ) → 400 câu cũ. CM-7 chồng tuần (L R ở W4 AUG, S ở W4 SEP) → chặn.
   CM-8 có đề nghị dời pending → chặn. CM-9 khoá lớp thường Progress/Final không đổi hành vi (`fixXepBaiThuong` xanh).
2. 🟢 `checkWeekVsNeighbours` thêm tuỳ chọn `choDanhSoLai` (chỉ khi vai QL/QT + FT + nằm gọn): trả `danhSoLai` thay blocker.
   `kiemDotNoi` / `luuDot` truyền tiếp; `luuDot` gọi `danhSoLaiMt` trong `tx` rồi tính lại `follow_until` Case mở.

## Task 3 · Hệ quả đọc (máy chủ, S)
1. 🔴 CM-10 tên Case "MT2 · SOS 2" của bài MT2 cũ đọc lại thành "MT3 · SOS 2"; nhật ký/thông báo cũ vẫn chữ "MT2".
   CM-11 `xuatMt` + Điểm theo lớp: cột MT2 là điểm bài W4 AUG. CM-12 `tuan_mt_ke` / `follow_until` theo thứ tự mới.
   CM-13 lộ trình đã đóng: `ban_chup_luot` không đổi. CM-14 kỳ vọng band theo Câu 1.
2. 🟢 Sửa chỗ còn đỏ (dự kiến chỉ `follow_until`).

## Task 4 · Web popup (S) — `/ponytail lite`, impeccable `clarify`
Chỉ khi mockup đã duyệt. File: `web/src/modules/test/keHoach/HopKyNang.tsx` (+ `NganXepLichMt.tsx` nếu cùng đường lưu).
1. 🔴 Phép kiểm web (mẫu `prOChon.tests.ts`): bấm Lưu nhận 409 `danhSoLai` → popup "Đánh số lại Mock Test?", danh sách
   `MT4 → MT2 · W4 AUG`…, "Điểm đi theo bài.", nút **Huỷ** / **Lưu và đánh số lại**; Huỷ không gửi gì.
2. 🟢 Dùng hộp xác nhận sẵn có của popup dời vượt (PR-MTb) — không thêm thành phần. Tuần ghi mã tuần, không ngày.
3. Ảnh thật 375/1440 sáng/tối vào `thiet-ke/anh/chen-mt/`; impeccable `audit`.

## Nghiệm thu
- [ ] CM-1…14 xanh; `npm run check` xanh (song song ≤ 3).
- [ ] QL bấm thử ví dụ Chu Minh Hiếu trên seed: hộp đợt, Hành trình, Điểm theo lớp, Case đều ra số mới; nhật ký có 1 dòng
      "Đánh số lại".
- [ ] GVCN bấm và gửi API thẳng: vẫn chặn.
- [ ] Không migrate; mô tả PR liệt kê chú thích `ponytail:`.

## PROMPT session code
```
Model: Opus 5.5 · XHigh (B: Opus 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì dừng.
Repo D:\Github\Pisa-tracking. git fetch origin; git worktree add .claude/worktrees/pr-chen-mt -b pr-chen-mt origin/main.
Đọc CLAUDE.md, plan.md mục 3–4, docs/superpowers/plans/2026-10-07-pr-chen-mt-danh-so-lai.md. ponytail full.
Task 1→3 máy chủ (đỏ trước, xanh sau). Task 4 web: gõ /ponytail lite, impeccable clarify; mockup
thiet-ke/mockup-chen-mt-2026-10-07.html PHẢI đã duyệt, chưa thì dừng báo.
Câu 1 / Câu 2 theo lựa chọn chủ sản phẩm ghi trong plan.md; chưa ghi thì dùng khuyến nghị.
npm run check song song ≤ 3 (OOM / exit 127 chạy lại từng bước). Bấm thử: API + Vite cổng riêng (không 5173/3001),
không preview_start. Trước PR: impeccable audit, /ponytail-review, /security-review (phân quyền cờ xacNhanDanhSoLai).
Commit Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>; PR vào main, KHÔNG merge.
```

## Ước lượng
**M** — ~6–8 giờ session code (Task 1: 1,5 g · Task 2: 2,5 g · Task 3: 1,5 g · Task 4: 1,5 g), + 1 g rà.

## Giả định / câu cần chủ sản phẩm chọn
- **Câu 1 · Kỳ vọng band đổi theo số MT** (`expectationFor`): bài MT2 cũ đã chấm thành MT3 → kỳ vọng mới cao hơn.
  Khuyến nghị: **giữ SOS / Case đã có** (không tính lại); số mới chỉ áp cho lần chấm sau. Phương án khác: tính lại SOS.
- **Câu 2 · Bài đã có điểm có được chèn?** Khuyến nghị: **được** (điểm đi theo bài), vì QL đã xác nhận.
- Lượt huỷ giữ chỗ theo tuần đã xếp; thông báo/nhật ký cũ giữ chữ cũ (tự quyết, đúng yêu cầu "giữ nguyên lịch sử").
