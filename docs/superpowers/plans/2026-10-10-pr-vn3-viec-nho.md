# PR-VN3 · Việc nhỏ dồn lại (sau KV, GOP, CT2, HOP1) — kế hoạch 10/10/2026

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Một session, Task 1 → 6 theo thứ tự, mỗi task một commit.

**Goal:** Dọn 5 lỗi nhỏ đã ghi ở plan.md ("SAU PR-KV", "SAU PR-GOP", "SAU PR-CT2", "SAU PR-HOP1") mà không thêm bước cho người dùng.

**Architecture:** Sửa tại chỗ trong hàm sẵn có, không thêm route và màn mới (trừ một ô Lý do đã có sẵn kiểu ở nơi khác).

**Spec:** plan.md các mục trên + quyết định chủ SP 10/10:
- **Sửa PA = "đã đụng"**: QL đã Sửa PA thì đổi quyết định Cuối khoá KHÔNG huỷ bộ bổ trợ đó; ghi nhật ký / lịch sử **một dòng ngắn**.
- Không làm PR-MTKET, PR-CHENMT (đã thay bằng luật đơn giản 08/10).

## Global Constraints
- CLAUDE.md: luật cứng 08/10 (không thêm bước/câu hỏi/chặn); KHÔNG gỡ bộ nhớ `prepare` ở `server/src/db.ts`.
- Turso: không tham số đặt tên; ≤ 900 tham số; ≤ 200 câu mỗi lần ghi; UNION có `AS`.
- Đường đọc đổi số câu → cập nhật `TRAN` ở `server/src/tests/tocDoDuong.ts`. Phép kiểm mới: `server/src/tests/prVn3.tests.ts`, gọi cuối `run.ts`.
- Giao diện chỉ ở Task 5 (thêm lại một ô đã có mẫu) → `/ponytail lite` cho task đó, không cần mockup mới.

## Review Focus
1. Bộ bổ trợ QL đã Sửa PA rồi QL đổi quyết định: phải còn nguyên PA, Case, Mini Test.
2. Case chưa có PA của lớp FT chưa phân công GVBM: "Nhắc" không 404, đến đúng người.
3. Em FT → FT (PR-CL): chủ Case kỳ vọng theo lớp ĐANG học.
4. `/my-work`: web vẫn đủ dữ liệu sau khi bỏ `items`/`groups` khỏi route.
5. Lý do dời lịch ở Hồ sơ MT: trống vẫn lưu được (tuỳ chọn).

---

### Task 1: Sửa PA tính là "đã đụng" (CT2)
**Files:** `server/src/normal/cuoiKhoa.ts` (~438–530, điều kiện "chưa ai đụng"), `server/src/cases/cases.ts:3425` (`suaPa`), `server/src/cases/planRevisions.ts`.
- [ ] Test `VN3-1a`: sinh bộ bổ trợ Final → QL `suaPa` (đổi người dạy) → đổi quyết định sang FT → PA, Case, `mini_test` còn nguyên.
- [ ] Test `VN3-1b`: không Sửa PA → đổi quyết định vẫn huỷ như cũ.
- [ ] Test `VN3-1c`: sau 1a, lịch sử Case / nhật ký lớp có đúng MỘT dòng ngắn: `Giữ bổ trợ: PA đã được sửa` (không ghi thêm gì khác).
- [ ] Sửa: "đã đụng" thêm điều kiện "PA có bản sửa nguồn `sua_pa` trong `planRevisions`" (đọc theo lô, một câu `IN`). Commit.

### Task 2: Case chưa có PA → "Nhắc" không 404 (KV)
**Files:** nơi gán người làm cho việc `no_plan` (`server/src/cases/cases.ts` quanh `isNoPlanCase`) và route Nhắc.
- [ ] Test `VN3-2`: lớp FT chưa phân công GVBM kỹ năng, Case Học viên chủ = GVCN dự phòng → việc "Thêm PA" hiện cho đúng người có quyền thêm PA; Quản trị bấm Nhắc → 200, thông báo tới người đó.
- [ ] Sửa: người làm `no_plan` = người có quyền thêm PA theo cùng hàm quyền với nút "Thêm PA" (không viết luật mới). Commit.

### Task 3: Chủ Case kỳ vọng theo lớp đang học (KV)
**Files:** chỗ Lưu kỳ vọng đọc `lenh.lop_dich_id` (grep `lop_dich_id` trong `server/src/classes/` + `suggestCaseOwner`).
- [ ] Test `VN3-3`: em chuyển FT A → FT B, Lưu kỳ vọng → chủ Case gợi ý theo lớp B. Dùng `lopHienTaiCua`.
- [ ] Nếu #290 (PR-NO-CT2-KV) đã sửa và test xanh sẵn → bỏ task, ghi "đã có ở #290". Commit.

### Task 4: `/my-work` nhẹ lại (GOP)
**Files:** route `/my-work` (`server/src/routes/index.ts`), web đọc `dong` + `summary`.
- [ ] Test `VN3-4`: JSON `/my-work` không còn `items`, `groups`; `dong`, `summary` trùng byte trước/sau (`scripts/chup-api.mjs`). Nhắc, hồ sơ GV vẫn gọi `myWork().items` trong máy chủ — giữ hàm.
- [ ] Hồ sơ GV › Việc đang có: đếm theo `dong` như badge Công việc (hết lệch). Commit.

### Task 5: Hồ sơ MT — dời lịch có lại ô Lý do (HOP1)
**Files:** `web/src/modules/test/keHoach/HopKyNang.tsx` (đang gửi `reason: null` tới `/ke-hoach-test/dot`).
- [ ] Thêm ô `Lý do` tuỳ chọn (mẫu `Truong nhan="Lý do" tuyChon`, placeholder "Ví dụ: trùng lịch phòng thi") ở chân hộp; gửi `reason` (trim, trống → null). Không chặn lưu.
- [ ] Test `VN3-5`: `luuDot` với `reason` → nhật ký lượt ghi lý do; `reason: null` → lưu được. Commit.

### Task 6: Kiểm và mở PR
- [ ] `npm run check` một lần; bấm thử QL (2), GVCN (7): Sửa PA rồi đổi quyết định, Nhắc Case chưa PA, dời lịch Hồ sơ MT có lý do.
- [ ] `/ponytail-review`; PR vào main, KHÔNG merge; mô tả liệt kê task bỏ (nếu có) và chú thích `ponytail:`.

## Prompt session code
```
Model: Opus 5.5 · High (B: Sonnet 5.5 · High). Fable hoặc model khác thì dừng. /ponytail full (Task 5 dùng /ponytail lite).
Repo Pizi147/pisa-tracking. Đọc CLAUDE.md, plan.md mục 1.4 + 1.5 + các mục "SAU PR-KV", "SAU PR-GOP", "SAU PR-CT2", "SAU PR-HOP1",
rồi làm ĐÚNG docs/superpowers/plans/2026-10-10-pr-vn3-viec-nho.md, Task 1 → 6. Nhánh pr-vn3 từ origin/main.
Không deploy, không chạm Turso/DB bản chính. Nếu pr-td3 đang mở: không sửa server/src/fasttrack/attempts.ts, server/src/cham/canCham.ts.
Xong: PR vào main, không merge. Báo ≤ 12 dòng: số PR, task nào xong / bỏ và lý do.
```
