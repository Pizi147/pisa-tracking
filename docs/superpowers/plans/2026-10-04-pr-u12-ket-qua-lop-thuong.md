# PR-U12 · Bảng "Kết quả kiểm tra" lớp thường ở hồ sơ HV theo mẫu Mock Test — Kế hoạch (04/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bảng kết quả lớp thường ở hồ sơ học viên đọc giống bảng Mock Test đã sửa (K4-33): kết quả nói một lần, bấm tên bài là mở, có nhãn lịch sử / đã huỷ / huỷ phần / dời.

**Architecture:** Chỉ web, một component `RatioAttempts` (`web/src/modules/students/StudentDetailPage.tsx:540-617`) + `KetQuaThuongO` (:620-633). Dùng lại cách `IeltsAttempts` (:415-534) đang làm: `nhanMt` (chip lịch sử + nhãn nhỏ), ô đầu là `Link` tới `attemptHref(a)`, cả hàng vẫn bấm được. Dữ liệu đã có sẵn trong `data.attempts` (`profile.ts:597-605`: `lichSu`, `status`, `huyPhan`, `doiKyNang`) — không đổi máy chủ.

**Tech Stack:** React + Tailwind.

**Spec:** chủ sản phẩm 04/10 (câu U12: "Có, giống bảng Mock Test"); `thiet-ke/ra-27-09/K4.md` dòng K4-33; `plan.md` mục 4 "PR-U12".

## Global Constraints
- Tinh chỉnh, không làm lại: giữ cột Bài · Lớp · Tuần · Điểm từng phần · Kết quả; giữ chip điểm từng phần.
- Thời gian = mã tuần (`tuanLich`), như hiện tại.
- Lớp thường **không** có chữ SOS (Rulebook §20.6).
- Không chép mã từ `IeltsAttempts`: tách phần nhãn dùng chung thành một hàm trong cùng file, cả hai bảng gọi.
- `/ponytail lite`. Phép kiểm quét nguồn ở `server/src/tests/prU12.tests.ts`, gọi cuối `run.ts`.

## Review Focus
1. Bài đang chấm dở (1/4 môn) → một dòng kết quả `Chờ 3 môn`, không kèm "mới 1/4 môn" hay "(đã chấm)".
2. Khoá có hai bài Giữa khoá → hai hàng phân biệt được (`Giữa khoá 1`, `Giữa khoá 2`).
3. Bài đã huỷ cả lượt → nhãn `đã huỷ`, hàng vẫn mở được.
4. Pre FOU (không chia môn) → kết quả là `%` như hiện nay.
5. Điện thoại 375 → thẻ có cùng nhãn, không link "Bảng điểm đợt ›" riêng, không cuộn ngang.

---

### Task U12-1: Nhãn dùng chung + ô Bài là liên kết

**Files:**
- Modify: `web/src/modules/students/StudentDetailPage.tsx:415-446` (tách `nhanCua`/`nhanMt` ra ngoài `IeltsAttempts`), `:540-617` (`RatioAttempts`)
- Test: `server/src/tests/prU12.tests.ts`

**Interfaces:**
- Produces: `function NhanDot({ a }: { a: { lichSu?: boolean; status?: string; huyPhan?: boolean; doiKyNang?: string[] } })` (cùng file) — chip lịch sử + tối đa hai nhãn nhỏ + "+n", đúng hành vi `nhanMt` hiện tại.
- Produces: `tenBaiThuong(rows: { id: number; kind: string }[], a: { id: number; kind: string }): string` — `Giữa khoá` / `Cuối khoá`; khi bảng có ≥ 2 hàng cùng `kind`, thêm số thứ tự theo thứ tự hàng (`Giữa khoá 1`, `Giữa khoá 2`).

Skill: `/impeccable layout` cho bảng và thẻ.

- [x] **Step 1: Phép kiểm đỏ (quét nguồn)** `U12-1`: trong thân `RatioAttempts` không còn chữ `Bảng điểm đợt ›`; có `<Link to={attemptHref(a)}` ở ô Bài; `IeltsAttempts` và `RatioAttempts` cùng gọi `NhanDot`.
- [x] **Step 2: Đỏ** → **Step 3: Sửa:** ô Bài = `Link` (`onClick` chặn lan ra hàng) chữ `tenBaiThuong(...)` + `<NhanDot a={a} />`; bỏ link "Bảng điểm đợt ›" ở bảng và dòng "Bảng điểm" ở thẻ điện thoại; đầu thẻ điện thoại dùng cùng `Link` + `NhanDot`. Cột "Lớp" dùng `Th` có `hint` như bảng Mock ("Lớp em học VÀO LÚC làm bài này…").
- [x] **Step 4:** `npm run check` → commit `"PR-U12 (1): bảng kết quả lớp thường có nhãn lịch sử/huỷ/dời, bấm tên bài để mở"`.

### Task U12-2: Kết quả nói một lần

**Files:**
- Modify: `web/src/modules/students/StudentDetailPage.tsx:570-571, 606-609` (dòng "mới x/y môn"), `:620-633` (`KetQuaThuongO`)
- Test: `server/src/tests/prU12.tests.ts`

Skill: `/impeccable clarify` cho chữ ô kết quả.

- [x] **Step 1: Phép kiểm đỏ (quét nguồn)** `U12-2`: `RatioAttempts` không còn `mới {a.scored}/{a.required} môn`; `KetQuaThuongO` có nhánh `a.scored < a.required` trả `Chờ {a.required - a.scored} môn`.
- [x] **Step 2: Đỏ** → **Step 3: Sửa** `KetQuaThuongO`: chưa đủ môn (`a.scored < a.required`, không phải Pre FOU) → dòng chính `Chờ {n} môn` tone `muted` (giống `KetQuaDot` "Chờ n kỹ năng"), dòng phụ `Không đạt: …` chỉ khi đã có môn trượt; đủ môn → giữ `nhanKetQuaThuong` như nay. Không sửa `nhanKetQuaThuong` (dùng chung với Báo PH).
- [x] **Step 4:** `npm run check`; `npm run seed && npm run dev`; ảnh 1440/375 sáng/tối hồ sơ một em lớp thường có: bài đủ điểm, bài chấm dở, bài lịch sử, bài đã huỷ (dùng em demo có sẵn; thiếu loại nào thì ghi trong mô tả PR). Vai QL, GVCN, GVBM.
- [x] **Step 5:** commit `"PR-U12 (2): ô kết quả lớp thường nói tiến độ một lần"`.

### Task U12-3: Hoàn tất
- [x] `/impeccable audit` (hồ sơ HV lớp thường) · `/ponytail-review` · một dòng `plan.md` mục 11 · ảnh sổ tay bị lệch (nếu có).
- [x] `superpowers:requesting-code-review` → `superpowers:finishing-a-development-branch` (mở PR, không merge). Merge **đầu tiên** trong đợt 3.

## Nghiệm thu
1. Mở hồ sơ em lớp thường: mỗi bài một ô kết quả nói một lần; bấm tên bài hoặc cả hàng → bảng điểm đợt.
2. Bài lịch sử / đã huỷ / huỷ phần / dời có nhãn như bảng Mock Test.
3. Điện thoại: thẻ có cùng nhãn, không link riêng, không cuộn ngang.

## Tự quyết
- T1: Số thứ tự bài chỉ thêm khi có ≥ 2 bài cùng loại trong bảng (đa số khoá chỉ có một Giữa khoá).
- T2: Cột "Điểm từng phần" giữ chip (không đổi sang số căn phải) — mỗi môn là cặp `đúng/tổng`.
