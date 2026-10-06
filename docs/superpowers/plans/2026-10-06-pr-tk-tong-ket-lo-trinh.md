# PR-TK · Tổng kết lộ trình — điểm 4 kỹ năng khi kết thúc — Kế hoạch (06/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Đã duyệt 06/10** (mockup + kế hoạch bản 2, `c16daa90`). **Chỉ chạy sau khi PR-LUI-b (#213) merge.**

**Chủ sản phẩm chốt (06/10):**
- **Q1 = A** — điểm nhập / sửa sau khi lộ trình đã đóng **cập nhật bản chụp**; Target, kỳ vọng, chương trình lúc đóng giữ nguyên (TK-5).
- **Q2 = A** — bảng cả lớp FT đã kết thúc lấy **MT cuối có đủ 4 kỹ năng**.
- **Q3 = A** — "Các lộ trình" ở **đầu tab Hành trình**; bỏ nút "Lộ trình ▾" ẩn ở đầu hồ sơ.
- **Q4 (thay khuyến nghị cũ)** — **không** tự kết luận theo MT cuối. Hết FT là kết thúc hẳn vì em đã đi **thi thật**; GVCN cập nhật kết quả thi thật. Bản tổng kết FT có con số cụ thể theo ba ô:
  **Đích** (Target lúc đó + tháng thi dự kiến) → **Kết quả** (điểm thi thật L, R, W, S, OVR + ngày thi, GVCN nhập; máy so với Target → Đạt / Chưa đạt) → **Hướng tiếp** (Học lại — thường do chưa đạt · Lên LT2 · Kết thúc; không phải lúc nào cũng lưu trữ ngay).
  Chưa có kết quả: **"Chờ kết quả thi thật"** + việc nhắc GVCN **"Cập nhật kết quả thi thật"** (TK-K).
  Lớp thường: **% Cuối khoá (dải) → hướng đã chốt** như hiện nay (K26).
- "Học lại" (PR-LUI-b) mở lại lộ trình thì **bản chụp cũ giữ nguyên**.
- **Lưu trữ khi Kết thúc học = A**: lộ trình FT còn "Chờ kết quả thi thật" thì "Kết thúc học" **chưa** lưu trữ; có kết quả (đủ 4 kỹ năng) hoặc "Không thi" thì em **tự vào Lưu trữ**. Làm ở PR-TK, Task TK-L (gồm "kết thúc học nhiều em" của LUI-b và Hoàn tác).

**Goal:** Khi một lộ trình đóng (bằng **bất kỳ** đường nào), web ghi **bản chụp** kết quả: mỗi lượt × mỗi kỹ năng/môn, kèm Target, kỳ vọng, đạt/không, mức SOS, chương trình, lớp, GV, band đầu vào; và ba ô tổng kết **Đích → Kết quả → Hướng tiếp** (FT: kết quả **thi thật** do GVCN nhập; lớp thường: % Cuối khoá). Sửa Target, lộ trình (LT1/LT2/RF), band đầu vào, môn của chương trình về sau **không làm lệch số cũ**. Xem lại dễ: hồ sơ HV › Hành trình có khối **"Các lộ trình"** (luôn hiện); lộ trình đã đóng mở **ngăn "Tổng kết lộ trình"**; Lưu trữ có nút **"Tổng kết"**; lớp đã kết thúc có tab **"Tổng kết"** cả lớp. Bảng bản chụp là nguồn dữ liệu cho PR-NC.

**Architecture:**
- Hai bảng mới (chỉ thêm): `ban_chup_lo_trinh` (một dòng mỗi lần đóng một lộ trình) và `ban_chup_luot` (một dòng mỗi lượt × kỹ năng — đúng dạng "một dòng một lượt × kỹ năng" PR-NC cần xuất Excel).
- **Một** hàm ghi `ghiBanChup(conn, cycleIds, { lyDo, ngay, nguon })` ở `server/src/loTrinh/banChup.ts`, gọi **trong cùng giao dịch** ngay sau mọi câu `UPDATE learning_cycles SET status` (5 chỗ, mục Khảo sát). Hàm tính bằng chính các hàm đang dùng ở hồ sơ (`resultOf`/`typedResult`, `evaluateRegular`, `cuoiKhoaTheoHocVien`) — không viết luật thứ hai.
- Phép kiểm **bất biến** cuối `run.ts`: mọi lộ trình `status <> 'active'` đều có ≥ 1 bản chụp → đường đóng mới sau này quên gọi là đỏ ngay.
- Migrate `server/src/migrate/prTk.ts`: tạo bảng + **điền ngược** cho lộ trình đã đóng chưa có bản chụp (`nguon = 'dien_nguoc'`), chạy lặp không đổi gì.
- **Kết quả thi thật** (TK-K): thêm cột vào `learning_cycles`, mở rộng `PUT /cycles/:id/outcome` (nay chỉ nhận Overall + kết luận chọn tay) thành L, R, W, S, ngày thi, "Không thi"; OVR và Đạt / Chưa đạt do máy tính. Ngăn "Kết luận lộ trình" (`StudentManagePanel.tsx:182`) đổi thành ngăn "Kết quả thi thật". Việc nhắc GVCN "Cập nhật kết quả thi thật" trong Công việc. Lưu xong → làm mới bản chụp.
- Đường đọc mới: `GET /students/:id/lo-trinh` (khối Các lộ trình), `GET /lo-trinh/:cycleId/tong-ket` (ngăn), `GET /classes/:id/tong-ket` (tab lớp). Web: `CacLoTrinh.tsx`, `NganTongKet.tsx`, `TabTongKetLop.tsx`.

**Tech Stack:** React + Tailwind (web/), Express + SQLite/Turso (server/), phép kiểm `server/src/tests/prTk.tests.ts` gọi ở cuối `run.ts`; `npm run check` = build + test + typecheck.

**Phụ thuộc / thứ tự (plan.md mục 4):** chạy **sau PR-LUI-b** (Học lại / mở lại lớp), song song MTb được. Xem mục **Chồng với PR khác**.

---

## Khảo sát mã (origin/main 06/10, `9f07ed0e`)

| Việc | Chỗ trong mã | Ghi chú |
|---|---|---|
| Đóng 1 · Mở lộ trình mới | `fasttrack/cycles.ts:162` `createCycle` (tx 158) ← `POST /students/:id/cycles` | `status='completed'` mọi lộ trình active của em |
| Đóng 2 · Chuyển lớp (luật `dong-mo`) | `classes/luatLoTrinh.ts:256` `apDungMotDong` (tx 241) ← `transferStudent` (`students/students.ts:231`), `thiHanhGiuaKhoa` (`classes/lenhChuyen.ts:466`, cron thứ Hai + quét khi đọc `GET /students/:id`) | luật khác (giữ lộ trình) không đóng |
| Đóng 3 · Lên lớp / Học lại / Lên FT cả lớp | `luatLoTrinh.ts:471` `apDungCaLop` (không tx riêng; trong tx `applyTransition` `classes/transition.ts:221/231`, gọi ở 323) ← `lenhChuyen.ts:446` | đóng **hàng loạt**; trần ghi `chuyenCaLopSangFT: 224` (`tests/tocDoDuong.ts` `TRAN_GHI_LO`) |
| Đóng 4 · Kết thúc học | `students/students.ts:300` `setStudentStatus('finished')` (tx 285) ← `POST /students/:id/status`, `transition.ts:326` (dừng học) | `status='abandoned'` |
| Đóng 5 · Sửa tay trạng thái | `cycles.ts:312-314` `updateCycle` (tx 309) ← `PATCH /cycles/:id` | **không có trong plan.md**; đặt `ended_at = COALESCE(ended_at, hôm nay)` |
| Không đóng | Bảo lưu `luatLoTrinh.ts:571`, Lưu trữ / bỏ lưu trữ `students.ts:325/339`, kết thúc lớp `xoaKetThucLop.ts:106`, `dongLopNeuHet` `luatLoTrinh.ts:163` | lớp kết thúc chỉ khi không còn em active → lộ trình đã đóng trước đó |
| Xoá thật | `students/xoaHocVien.ts:127` (`CAU_XOA_HOC_VIEN`, phép kiểm X2 `tests/xoaDuLieu.tests.ts:326` bắt mọi FK phải có câu xoá) | bảng mới có FK → thêm câu xoá |
| Kỳ vọng | **không lưu**: `expectationFor(target, attemptNo, route)` (`fasttrack/scoring.ts:110`, `shared/domain/fasttrack.ts:15`) | đọc `route` **hiện tại** của lộ trình |
| Target lúc thi | `assessment_attempts.target_at_attempt` — **không cố định**: `cycles.ts:131-133` ghi lại cho lượt chưa điểm, `lenhChuyen.ts:416` đặt NULL | |
| Đánh giá FT | `evaluateAttempt` (`scoring.ts:159`), `resultOf` (`attempts.ts:186`), `typedResult` (`students/profile.ts:72`) | SOS = số kỹ năng dưới kỳ vọng |
| Đánh giá lớp thường | `evaluateRegular` (`normal/regular.ts:182`), `regularResultOf` (`regular.ts:247`), `daiCuoiKhoa` (`shared/domain/cuoiKhoa.ts:24`) | đọc `programme_skills` **hiện tại** |
| Kết luận khoá | `cuoiKhoaTheoHocVien(classId, sids, {daRoi})` (`normal/cuoiKhoa.ts:112`), hướng ở `lo_trinh_tiep_theo` | hồ sơ chỉ xét lớp đang học + 1 lớp vừa rời (`profile.ts:784-800`) |
| Kết luận FT / thi thật | `learning_cycles.outcome` (`reached`/`not_reached`/`unknown`) + `outcome_score` (một số Overall) + `outcome_note`, ghi tay qua `setOutcome` (`cycles.ts:428`, `PUT /cycles/:id/outcome` `routes/index.ts:1269`, quyền `STUDENT_EDIT` = GVCN lớp mình + QL). Web: ⋮ "Kết luận lộ trình" (`quanLyHocVien.ts:54`, chỉ FT) → `KetLuanLoTrinhPanel` (`StudentManagePanel.tsx:182-215`): chọn kết luận + ô "Điểm IELTS thật (Overall)" | **chưa có** L/R/W/S thi thật, ngày thi; kết luận chọn tay, không so Target; đã chặn lấy MT làm kết quả thi thật (`cycles.ts:446-457`) |
| Dự kiến thi | `learning_cycles.exam_month` / `exam_period_id` / `exam_date`; nhãn `examPlanOf` (`cycles.ts:87-113`: `SEP 2026` · mã tuần · ngày) | "Thi thật · …" ở ô Sắp tới (`shared/domain/sapToi.ts:15`, PR-DH) chỉ là **lịch dự kiến** |
| Không phải thi thật | `ghiKetLuanFt` (`normal/cuoiKhoa.ts:505`) = **kỳ vọng đầu ra** BE/ELE → FT (`lo_trinh_tiep_theo.ky_vong_*`) | không dùng cho TK-K |
| OVR IELTS | `roundToHalf` (`fasttrack/scoring.ts:22`), cách tính ở `scoring.ts:220-223` | dùng lại cho OVR thi thật |
| Lên LT2 | mở lộ trình mới `route='LT2'` (`createCycle`, `cycles.ts:140`) | hướng tiếp "Lên LT2" = đóng vì lộ trình mới có route LT2 |
| Kết thúc học tự lưu trữ | `setStudentStatus('finished')` đặt `archived_at = date` (`students.ts:~282`); hồ sơ lưu trữ **chỉ xem** (`StudentDetailPage.tsx:183`) | xem câu cần quyết |
| Mẫu việc trong Công việc | `metrics.ts:703` (`hv-len-ft-chua-ky-vong`), `mywork.ts` | TK-K theo mẫu này |
| GV | không lưu theo lượt; `teacher_assignments` (`effective_from/to`), `assessment_scores.entered_by` | |
| Xem lộ trình cũ | `GET /students/:id?cycleId=` (`profile.ts:523-556`) xem **sống** được; nút "Lộ trình ▾" ẩn (`StudentDetailPage.tsx:88, 214, 239`) | giữ đường này cho "Mở hồ sơ" |
| Lưu trữ | `GET /hoc-vien-lop/luu-tru` → `danhSachLuuTru` (`classes/luuTru.ts:21`), web `LuuTruPage.tsx` | chỉ danh sách |
| Ghi điểm | FT `attempts.ts:1660/1669`, lớp thường `regular.ts:545/553`, vắng `absence.ts`, `attempts.ts:1542-1571` | dùng cho TK-5 |
| Trần truy vấn | `GET /students/{hv}` ≤ 90 cứng (`tocDo.run.ts:607-614`) | khối mới **không** nạp trong payload hồ sơ |

## Global Constraints
- CLAUDE.md: tinh chỉnh, không làm lại; Be Vietnam Pro (chữ số Inter), bảng màu, bố cục giữ. **Chữ trên màn = đúng mockup**, nhãn 1–3 từ, không câu giải thích dưới nút/ô. Thời gian = **mã tuần** (`W2 MAY – W3 SEP`); ngày chỉ ở Lưu trữ như hiện nay.
- **Chỉ thêm**: không xoá/sửa cột cũ; không đổi kết quả của đường đọc cũ (phép kiểm cũ xanh, không sửa).
- **Mọi đường đóng đều ghi bản chụp, cùng giao dịch** với câu đóng: lỗi khi ghi bản chụp → cả giao dịch đóng lùi lại (không có lộ trình đóng mà thiếu bản chụp). Phép kiểm bất biến ở TK-3.
- Bản chụp tính bằng hàm có sẵn (`resultOf`/`typedResult`, `evaluateRegular`, `cuoiKhoaTheoHocVien`, `expectationFor`); không chép luật.
- Ngữ cảnh lấy **lúc đóng** rồi đóng băng: Target lúc thi, kỳ vọng, route, chương trình + danh sách môn, lớp, GV, band đầu vào. Về sau chỉ **điểm** được làm mới (TK-5, nếu chủ sản phẩm chọn Q1-A).
- Turso: không tham số đặt tên; ≤ 900 tham số (chia lô); `UNION` ≤ 20 vế; ghi hàng loạt bằng lô `INSERT … VALUES (?,…),(?,…)`.
- Quyền: đọc bản chụp HV = đúng quyền `STUDENT_VIEW` như `studentProfile` (`profile.ts:513`), kiểm **trước** truy vấn; lớp = đúng quyền của `GET /classes/:id/overview` (`routes/index.ts:1074`). Sai id → 404; lộ trình còn active → 404 "Lộ trình chưa kết thúc".
- Đường đọc mới có dòng trong `DUONG_DO` + trần `TRAN` (`tests/tocDoDuong.ts`); đường đóng hàng loạt đo lại `TRAN_GHI_LO` (lý do ghi trong mô tả PR).
- Hàm `shared/domain/*` mới re-export qua `shared/domain/index.ts`. File mới → `CODE_MAP.md` cùng commit.
- Nhánh `pr-tk-tong-ket-lo-trinh`, worktree `.claude/worktrees/pr-tk-tong-ket-lo-trinh`. Mở PR vào `main`, không merge.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `/ponytail lite` · `superpowers:subagent-driven-development` |
| Mỗi task | `superpowers:test-driven-development` (đỏ trên DB test trước) · `superpowers:verification-before-completion` |
| Lỗi lạ (Turso, giao dịch lồng) | `superpowers:systematic-debugging` |
| TK-8, TK-9 | `/impeccable layout` (khối Các lộ trình, ngăn, tab lớp) · `/impeccable clarify` (nhãn đúng mockup) · `/impeccable harden` (rỗng, một lượt, lượt huỷ, lỗi tải) · `/impeccable adapt` (375) |
| Cuối PR | `/impeccable audit` · `/ponytail-review` · `superpowers:requesting-code-review` · `superpowers:finishing-a-development-branch` (mở PR, không merge) |

---

### Task TK-0: Đối chiếu mã đã merge + chép câu trả lời
**Files:** đọc `luatLoTrinh.ts`, `students.ts`, `cycles.ts`, `transition.ts`, `lenhChuyen.ts`, `luuTru.ts` trên `origin/main` mới nhất.
- [ ] Ghi câu trả lời câu còn lại (lưu trữ khi Kết thúc học) vào khối "Chủ sản phẩm chốt" ở đầu file.
- [ ] `git grep -n "UPDATE learning_cycles"` + tìm `updateCycle` `status`: đối chiếu với bảng Khảo sát (PR-LUI-b có thể đã thêm đường **mở lại** — `status='active'` — và đường đóng mới). Mỗi đường đóng phát sinh → thêm vào TK-3.
- [ ] PR-MT0 đã merge? Nếu có: xác định chỗ chuyển `cycle_id` của MT0 ở Chuyển tiếp lớp; `ghiBanChup` phải gọi **sau** bước đó (MT0 "dùng" thuộc lộ trình FT mới, không vào bản chụp lớp thường; MT0 "không dùng" ở lại và vào bản chụp với `trang_thai = 'khong_dung'`).
- [ ] Commit: `docs(tk): ghi câu chốt, đối chiếu đường đóng lộ trình`.

### Task TK-1: Luật thuần
Skill: test-driven-development
**Files:** tạo `shared/domain/tongKetLoTrinh.ts`; sửa `shared/domain/index.ts`; tạo `server/src/tests/prTk.tests.ts`; sửa cuối `server/src/tests/run.ts`.

**Interfaces:**
```ts
export const LY_DO_DONG = ['lo_trinh_moi', 'chuyen_lop', 'len_lop', 'hoc_lai', 'sang_ft', 'ket_thuc', 'sua_tay', 'khong_ro'] as const;
export type LyDoDong = (typeof LY_DO_DONG)[number];
export const LY_DO_DONG_NHAN: Record<LyDoDong, string>;   // 'Lộ trình mới' | 'Chuyển lớp' | 'Lên lớp' | 'Học lại' | 'Lên FT' | 'Kết thúc học' | 'Sửa tay' | '—'
export const HUONG_TIEP = ['hoc_lai', 'len_lt2', 'ket_thuc', 'len_ft', 'len_lop', 'chuyen_lop', 'lo_trinh_moi', 'khong_ro'] as const;
export const HUONG_TIEP_NHAN: Record<HuongTiep, string>;  // 'Học lại' | 'Lên LT2' | 'Kết thúc' | 'Lên FT' | 'Lên lớp' | 'Chuyển lớp' | 'Lộ trình mới' | '—'
export function huongTiep(lyDo: LyDoDong, routeMoi: string | null): HuongTiep;   // lo_trinh_moi + routeMoi 'LT2' → len_lt2; ket_thuc → ket_thuc; …
// Q4 (chủ sản phẩm): kết quả thi thật — OVR = roundToHalf(trung bình 4 kỹ năng) (chuyển roundToHalf sang shared nếu cần, giữ re-export cũ);
// đủ 4 + OVR ≥ target → reached, < → not_reached; thiếu kỹ năng / không thi / chưa nhập → unknown ("Chờ kết quả thi thật" / "Không thi")
export function ketQuaThiThat(o: { l: number | null; r: number | null; w: number | null; s: number | null; khongThi: boolean }, target: number | null):
  { ovr: number | null; ketLuan: 'reached' | 'not_reached' | 'unknown'; nhan: 'Đạt Target' | 'Chưa đạt Target' | 'Chờ kết quả thi thật' | 'Không thi' | 'Chờ đủ 4 kỹ năng' };
// TK-K: mốc hiện việc nhắc + hạn (xem TK-K)
export function mocNhacThiThat(o: { thangThi: string | null; tuanThi: string | null; ngayThi: string | null; ngayDong: string | null }): { tu: string; han: string } | null;
// Q2: lượt đại diện cho bảng cả lớp FT — MT cuối có OVR (không huỷ); không có → MT cuối bất kỳ
export function luotDaiDien<T extends { attemptNo: number; huy: boolean; overall: number | null }>(luot: T[]): T | null;
export function khoangTuan(batDau: string | null, ketThuc: string | null, homNay: string): string;  // 'W2 MAY – W3 SEP' | 'W1 JUN – nay'
```
- [ ] Kiểm đỏ: nhãn đủ 8 khoá (`LY_DO_DONG_NHAN` khớp `END_KIND_LABEL` ở `shared/domain/lenLop.ts:110` cho chữ trùng: "Lên lớp", "Học lại", "Lên FT", "Chuyển lớp", "Kết thúc học"); `huongTiep` mọi nhánh (LT1 → LT2 = `len_lt2`, RF → LT1 = `lo_trinh_moi`); `ketQuaThiThat`: (7.0, 6.5, 6.0, 6.5) target 6.5 → OVR 6.5 reached; target 7.0 → not_reached; thiếu S → unknown "Chờ đủ 4 kỹ năng"; khongThi → unknown "Không thi"; điểm ngoài 0–9 hoặc không chia hết 0.5 → ném lỗi; `mocNhacThiThat` các nhánh ở TK-K; `luotDaiDien([])===null`; `khoangTuan` dùng hàm mã tuần sẵn có (`tuanLich`/`maTuan`, ghi tên thật vào commit).
- [ ] Viết → xanh. Commit: `feat(tk): luật thuần tổng kết lộ trình`.

### Task TK-2: Bảng bản chụp + hàm ghi
Skill: test-driven-development
**Files:** sửa `server/src/schema.sql` (cuối file); tạo `server/src/migrate/prTk.ts` (phần tạo bảng); sửa `server/src/migrate.ts` (import + gọi **cuối** khối, sau `migratePrK26`); tạo `server/src/loTrinh/banChup.ts`; thêm kiểm.

**Bảng:**
```sql
CREATE TABLE IF NOT EXISTS ban_chup_lo_trinh (
  id INTEGER PRIMARY KEY, cycle_id INTEGER NOT NULL REFERENCES learning_cycles(id), student_id INTEGER NOT NULL REFERENCES students(id),
  lan INTEGER NOT NULL,                       -- 1, 2… (lần đóng thứ mấy; Học lại rồi đóng lại = lan 2)
  ly_do TEXT NOT NULL, dong_ngay TEXT NOT NULL, nguon TEXT NOT NULL,   -- nguon: 'luc_dong' | 'dien_nguoc'
  programme_code TEXT, programme_name TEXT, scoring_mode TEXT, route TEXT, mon_json TEXT,  -- môn của chương trình lúc đóng
  class_id INTEGER, class_code TEXT, branch_id INTEGER, gvcn_user_id INTEGER, gvcn_ten TEXT,   -- lớp cuối của lộ trình; không FK (lớp có thể bị xoá)
  bat_dau_ngay TEXT, target REAL, khong_cam_ket INTEGER,
  dau_vao REAL, dau_vao_nguon TEXT, dau_vao_l REAL, dau_vao_r REAL, dau_vao_w REAL, dau_vao_s REAL,
  thi_du_kien_thang TEXT, thi_du_kien_tuan INTEGER, thi_du_kien_ngay TEXT, thi_du_kien_nhan TEXT,   -- ĐÍCH: Target (cột target) + dự kiến thi lúc đóng
  thi_that_ngay TEXT, thi_that_l REAL, thi_that_r REAL, thi_that_w REAL, thi_that_s REAL, thi_that_ovr REAL,  -- KẾT QUẢ thi thật (FT)
  thi_that_khong_thi INTEGER NOT NULL DEFAULT 0, thi_that_nhap_boi INTEGER, thi_that_nhap_luc TEXT,
  ket_luan TEXT,                              -- reached | not_reached | unknown (máy so thi_that_ovr với target; chưa có / không thi = unknown)
  huong_tiep TEXT,                            -- hoc_lai | len_lt2 | ket_thuc | len_ft | len_lop | chuyen_lop | lo_trinh_moi | khong_ro
  ky_vong_dat INTEGER, ty_le_cuoi_khoa REAL, dai_cuoi_khoa TEXT,                       -- lớp thường
  so_luot INTEGER NOT NULL, lam_moi_luc TEXT, created_at TEXT NOT NULL,
  UNIQUE (cycle_id, lan));
CREATE TABLE IF NOT EXISTS ban_chup_luot (
  id INTEGER PRIMARY KEY, ban_chup_id INTEGER NOT NULL REFERENCES ban_chup_lo_trinh(id) ON DELETE CASCADE,
  attempt_id INTEGER, attempt_no INTEGER, kind TEXT, trang_thai TEXT,    -- done | planned | cancelled | khong_dung (MT0)
  huy_ly_do TEXT, lich_su INTEGER, class_id INTEGER, class_code TEXT, tuan_bat_dau TEXT,
  target_luc_thi REAL, ky_vong REAL, overall REAL, ty_le_tong REAL, sos INTEGER, ket_qua TEXT,   -- cấp lượt (lặp ở mỗi dòng kỹ năng)
  ky_nang TEXT NOT NULL, bat_buoc INTEGER, bo_qua INTEGER, diem REAL, diem_tho REAL, diem_tong REAL, dat INTEGER,
  vang INTEGER, han_cham TEXT, nhap_luc TEXT, nguoi_nhap_id INTEGER, gv_id INTEGER, gv_ten TEXT, case_id INTEGER,
  UNIQUE (ban_chup_id, attempt_id, ky_nang));
CREATE INDEX IF NOT EXISTS idx_bcl_student ON ban_chup_lo_trinh(student_id);
CREATE INDEX IF NOT EXISTS idx_bcl_class ON ban_chup_lo_trinh(class_id);
CREATE INDEX IF NOT EXISTS idx_bcluot_class ON ban_chup_luot(class_id);
```
- Kỹ năng FT: `listening`, `reading`, `writing` (band gộp W1+W2, kèm dòng `writing1`, `writing2` thô), `speaking`; lớp thường: môn của chương trình lúc đóng. Lượt huỷ vẫn có dòng (`trang_thai='cancelled'`, điểm NULL). Lượt chưa có lịch / chưa thi: có dòng, `diem` NULL.
- `gv_id` = phân công môn đó của lớp lúc thi (`teacher_assignments` hiệu lực ở tuần thi); `case_id` = Case SOS sinh từ lượt × kỹ năng (nếu có).

**Interfaces:**
```ts
export type BanChupVao = { lyDo: LyDoDong; ngay: string; nguon?: 'luc_dong' | 'dien_nguoc' };
export function ghiBanChup(conn: any, cycleIds: number[], o: BanChupVao): number[];   // trả id bản chụp mới; chạy trong tx của người gọi
```
- `conn` truyền vào (migrate dùng `conn` riêng). Đọc theo lô `cycleIds` (chia ≤ 400 id/lô): một truy vấn lộ trình, một truy vấn lượt, một truy vấn điểm, một truy vấn phân công, một truy vấn Case — không N+1 theo em. Gọi `resultOf`/`evaluateRegular`/`expectationFor` từng lượt **trong bộ nhớ**; nếu hàm sẵn có tự truy vấn DB thì tách phần thuần ra (không đổi kết quả cũ) hoặc ghi `ponytail:` + đo trần ở TK-3.
- `lan` = `MAX(lan)+1` theo `cycle_id`. Đích, kết quả thi thật lấy từ `learning_cycles` lúc đóng (TK-K); `ket_luan` = `ketQuaThiThat(...)` (TK-1). `huong_tiep` = `huongTiep(lyDo, routeLoTrinhMoi, endKind)`; lớp thường lấy hướng đã chốt (`lo_trinh_tiep_theo.huong` / `end_kind`).
- Dữ liệu cũ chỉ có `outcome_score` (Overall) không L/R/W/S: chép vào `thi_that_ovr`, bốn kỹ năng NULL.
- [ ] Kiểm đỏ (DB test, helper `taoLop`/`ghiCuoiKhoa` kiểu `prK26.tests.ts:49-79`):
  1. Lộ trình FT 3 MT (MT2 huỷ phần S, MT3 huỷ cả lượt) → `ghiBanChup` → `ban_chup_luot` có 3 lượt × 4 kỹ năng (+W1/W2), MT3 `cancelled`, SOS/kỳ vọng/OVR **bằng đúng** `attempts[]` của `studentProfile(…, cycleId)` cùng lúc.
  2. Lộ trình lớp thường FOU (Giữa khoá + Cuối khoá) → môn L, R, G+V (`writing`), P (`speaking`); `ty_le_tong`, `dai_cuoi_khoa`, `huong` khớp `cuoiKhoaTheoHocVien`.
  3. **Đóng băng**: sau khi ghi, đổi `learning_cycles.route` RF→LT1, `target_score`, `baseline_score`, xoá một dòng `programme_skills`, đổi `target_at_attempt` → đọc lại bản chụp: không đổi.
  4. Lộ trình không có lượt nào → bản chụp `so_luot=0`, không dòng `ban_chup_luot`.
  5. Gọi hai lần → `lan` 1 và 2.
- [ ] Viết → xanh. Commit: `feat(tk): bảng bản chụp lộ trình và hàm ghi`.

### Task TK-3: Gắn vào mọi đường đóng + phép kiểm bất biến
Skill: test-driven-development
**Files:** sửa `fasttrack/cycles.ts` (162, 312-314), `classes/luatLoTrinh.ts` (256, 471), `students/students.ts` (300); thêm kiểm; `tests/tocDoDuong.ts` (`TRAN_GHI_LO`).
- [ ] Kiểm đỏ — mỗi đường một phép, đi qua **API/hàm dịch vụ thật** (không gọi `ghiBanChup` trực tiếp): `POST /students/:id/cycles` → `lo_trinh_moi`; `transferStudent` luật `dong-mo` → `chuyen_lop` (luật giữ lộ trình → **không** có bản chụp); `applyTransition` lên lớp / học lại / sang FT (≥ 3 em cùng lô) → `len_lop` / `hoc_lai` / `sang_ft`; `POST /students/:id/status finished` và dừng học ở Chuyển tiếp → `ket_thuc`; `PATCH /cycles/:id {status:'completed'}` → `sua_tay`.
- [ ] Kiểm đỏ — **bất biến**, đặt ở **cuối cùng** `run.ts` (sau mọi phép kiểm khác): `SELECT COUNT(*) FROM learning_cycles c WHERE c.status <> 'active' AND NOT EXISTS (SELECT 1 FROM ban_chup_lo_trinh b WHERE b.cycle_id = c.id)` = 0.
- [ ] Kiểm đỏ — **cùng giao dịch**: làm `ghiBanChup` ném lỗi (tiêm qua biến môi trường test hoặc tham số ẩn chỉ dùng trong test — ghi `ponytail:` nếu cần) → `createCycle` lỗi, lộ trình cũ vẫn `active`.
- [ ] Gọi `ghiBanChup` ngay sau từng câu `UPDATE learning_cycles SET status…`; `apDungCaLop` gọi **một lần** cho cả lô (lấy id các lộ trình active **trước** câu UPDATE). Lý do đóng của `apDungCaLop` lấy từ hướng của từng em (một lô có thể trộn lên lớp / học lại / sang FT → nhóm theo lý do).
- [ ] Đo lại `chuyenCaLopSangFT` (và trần ghi khác bị đổi): cập nhật `TRAN_GHI_LO` theo công thức ở đầu `tocDoDuong.ts`, ghi số đo trước/sau vào mô tả PR.
- [ ] Seed (`runSeed`) có lộ trình đã đóng: bất biến đỏ ngay ở seed → seed đi qua đường đóng thật, hoặc gọi điền ngược của TK-4 cuối seed (chọn cách ít sửa seed hơn, ghi vào commit).
- [ ] Commit: `feat(tk): mọi đường đóng lộ trình ghi bản chụp`.

### Task TK-4: Điền ngược (migrate)
Skill: test-driven-development
**Files:** `server/src/migrate/prTk.ts` (thêm phần điền ngược); thêm kiểm.
- [ ] `migratePrTk(conn, applied)`: tạo bảng nếu chưa có; rồi lộ trình `status <> 'active'` **chưa có** bản chụp → `ghiBanChup(conn, ids, { lyDo, ngay: ended_at ?? started_at, nguon: 'dien_nguoc' })` theo lô 200. `lyDo` suy từ dữ liệu: `abandoned` → `ket_thuc`; `completed` + enrollment kết thúc cùng ngày có `end_kind` → theo `end_kind` (`len_lop`/`hoc_lai`/`sang_ft`/`chuyen_lop`); có lộ trình sau bắt đầu cùng ngày, không enrollment → `lo_trinh_moi`; còn lại `khong_ro`. `applied.push('PR-TK: điền ngược n bản chụp')` chỉ khi n > 0.
- [ ] Kiểm đỏ: DB có 3 lộ trình đã đóng không bản chụp → migrate → 3 bản chụp `dien_nguoc`; chạy lần hai → `applied` không thêm gì, số dòng không đổi; lộ trình đã có bản chụp không bị ghi thêm.
- [ ] Ghi chú vào mô tả PR: điền ngược dùng Target/route/chương trình **hiện tại** (không có lịch sử) — số có thể khác lúc đóng thật; cột `nguon` giữ dấu cho PR-NC.
- [ ] Commit: `feat(tk): migrate điền ngược bản chụp lộ trình đã đóng`.

### Task TK-5: Điểm sửa sau khi đóng (theo Q1)
Skill: test-driven-development
**Q1-A (khuyến nghị):** **Files:** `fasttrack/attempts.ts` (lưu điểm ~1660, vắng ~1542-1571), `normal/regular.ts` (~545, ~686), `fasttrack/absence.ts` (~822-869), đường xoá điểm của PR-MTa nếu đã merge.
- [ ] `lamMoiDiemBanChup(conn, attemptIds)` ở `banChup.ts`: lượt thuộc lộ trình **không active** → cập nhật `diem/dat/overall/sos/ket_qua/ty_le_tong` của bản chụp **mới nhất** theo ngữ cảnh đã đóng băng (`target_luc_thi`, `ky_vong`, `route`, `mon_json` trong bản chụp); đặt `lam_moi_luc`. **Không** đổi Target/kỳ vọng/chương trình/lớp/GV. Lớp thường: tính lại `ty_le_cuoi_khoa`, `dai_cuoi_khoa`.
- [ ] Gọi trong cùng tx của từng đường ghi điểm ở trên (một chỗ chung nếu các đường đã đi qua một hàm — tìm trước khi rải).
- [ ] Kiểm đỏ: em Kết thúc học, MT5 thiếu S → nhập bù S qua `PUT /attempts/:id/scores/speaking` → bản chụp có S, OVR, SOS mới; kỳ vọng giữ; đổi route sau đó rồi nhập sửa thêm → kỳ vọng vẫn giữ. Bất biến phụ cuối `run.ts`: mọi lượt của lộ trình đã đóng có `diem` trong bản chụp mới nhất = điểm sống.
- **Q1-B:** bỏ task này; bảng tổng kết hiện số lúc đóng (ghi vào Giả định).
- [ ] Commit: `feat(tk): điểm nhập/sửa sau khi đóng cập nhật bản chụp`.

### Task TK-K: Kết quả thi thật (GVCN nhập) + việc nhắc
Skill: test-driven-development · `/impeccable clarify` · `/impeccable harden`
**Files:** `server/src/schema.sql` + `server/src/migrate/prTk.ts` (thêm cột), `fasttrack/cycles.ts` (`setOutcome` ~428), `routes/index.ts:1269`, `loTrinh/banChup.ts` (`lamMoiKetQuaThi`), `server/src/worklist/mywork.ts` + `metrics.ts` (việc mới), `shared/domain/quanLyHocVien.ts` (nhãn mục ⋮), `web/src/modules/students/StudentManagePanel.tsx` (`KetLuanLoTrinhPanel` → `KetQuaThiThatPanel`), `NganTongKet.tsx` (nút "Nhập kết quả").

**Cột mới `learning_cycles`** (chỉ thêm, `ALTER TABLE … ADD COLUMN` có kiểm `pragma_table_info`): `thi_that_ngay TEXT`, `thi_that_l REAL`, `thi_that_r REAL`, `thi_that_w REAL`, `thi_that_s REAL`, `thi_that_khong_thi INTEGER NOT NULL DEFAULT 0`, `thi_that_nhap_boi INTEGER`, `thi_that_nhap_luc TEXT`. OVR giữ ở `outcome_score`; `outcome` do máy ghi theo `ketQuaThiThat`; ghi chú ở `outcome_note`.

**Đường ghi:** `PUT /cycles/:id/outcome` nhận `{ ngayThi, l, r, w, s, khongThi, ghiChu }`.
- Kiểm nhập (không bao giờ bớt): lộ trình phải là FT (`programme_code='FT'` hoặc route ≠ NULL) → khác 400; điểm 0–9 bước 0.5; `ngayThi` ISO, ≤ hôm nay, ≥ `started_at` của lộ trình; `khongThi=true` thì bỏ qua điểm; cho lưu thiếu kỹ năng (đang gõ dở) → `outcome='unknown'`.
- Body cũ `{ outcome, score, note }`: phép kiểm cũ (`luatMayChu.tests.ts`, `phanTich.tests.ts`, `tocDo.run.ts`) còn gọi thì giữ nhánh cũ nguyên hành vi; web không gửi nữa.
- **Quyền:** như `setOutcome` (`STUDENT_EDIT`) **và thêm**: GVCN của **lớp cuối** của lộ trình (`teacher_assignments` `is_core=1` của lớp đó, kể cả lớp đã kết thúc) và QL chi nhánh ghi được **dù em đã kết thúc / lưu trữ** — ngoại lệ duy nhất trên hồ sơ chỉ xem. Người khác 403 trước mọi ghi.
- Nhật ký: ai / lúc nào / cũ → mới (`addJourney` như hiện nay + `thi_that_nhap_boi/luc`).
- Lộ trình đã đóng → `lamMoiKetQuaThi(conn, cycleId)` cập nhật `thi_that_*`, `ket_luan` của **bản chụp mới nhất**, cùng tx; so với **Target trong bản chụp** (Target lúc đóng), không phải Target hiện tại.

**Việc nhắc "Cập nhật kết quả thi thật"** (đề xuất, chủ sản phẩm duyệt cùng mockup):
- **Ai:** GVCN lớp cuối của lộ trình; lớp không có GVCN → QL chi nhánh. QL thấy việc của GV như các việc khác.
- **Khi nào hiện:** lộ trình FT chưa có kết quả và không "Không thi"; mốc = **thứ Hai đầu tiên sau** tháng thi dự kiến (`exam_month`) / sau tuần thi (`exam_period_id`) / sau ngày thi (`exam_date`); không có dự kiến thi → thứ Hai sau ngày lộ trình đóng. Lộ trình còn chạy mà đã qua mốc cũng hiện.
- **Hạn:** mốc + **4 tuần**; quá hạn đỏ, **không chặn**, không tự huỷ. Hết việc khi lưu đủ 4 kỹ năng hoặc "Không thi".
- **Chữ:** "Cập nhật kết quả thi thật" · "{tên} · {lớp} · thi {SEP 2026}" · "hạn {W1 NOV}". Bấm → mở ngăn "Kết quả thi thật" trên hồ sơ HV (`?viec=thi-that`).
- Không thêm thông báo chuông (ponytail: thêm nếu GVCN bỏ sót nhiều).

**Web:** ⋮ "Kết luận lộ trình" đổi tên **"Kết quả thi thật"**; ngăn: dòng "Target · Dự kiến thi", ô "Không thi", Ngày thi, L R W S, OVR (tự tính, chỉ đọc), nhãn kết quả; khi "Không thi": ô Ghi chú. Lưu / Huỷ. **Chữ đúng mockup màn "GVCN nhập thi thật".** Ngăn Tổng kết: ô Kết quả "Chờ kết quả thi thật" + nút "Nhập kết quả" (chỉ người có quyền ghi).
- [ ] Kiểm đỏ: GVCN lớp FT nhập 4 kỹ năng → `outcome='reached'`, `outcome_score=6.5`; thiếu S → `unknown`; điểm 9.5 / 6.3 / ngày mai → 400; GVBM → 403; GVCN lớp cuối nhập cho em **đã Kết thúc học + lưu trữ** → được; GVCN lớp khác → 403; lộ trình lớp thường → 400; nhập sau khi đóng → bản chụp mới nhất có điểm thi thật, so Target lúc đóng (đổi `target_score` trước khi nhập vẫn so Target cũ).
- [ ] Kiểm đỏ việc nhắc: `exam_month='2026-09'` → hiện từ thứ Hai 05/10, hạn thứ Hai 02/11, ngày 01/10 chưa hiện; có kết quả → mất; "Không thi" → mất; không dự kiến thi → theo ngày đóng; `myWork(GVCN lớp cuối)` có việc, `myWork(GVBM)` không.
- [ ] `tocDoDuong.ts`: `myWork` GVCN không vượt trần cũ (một truy vấn cho cả việc mới).
- [ ] Commit: `feat(tk): kết quả thi thật L R W S, việc nhắc GVCN`.

### Task TK-L: Kết thúc học chưa lưu trữ khi FT còn chờ kết quả thi thật
Skill: test-driven-development · **làm sau TK-K**, trên mã đã có PR-LUI-b (#213)
**Files:** `students/students.ts` (`setStudentStatus` ~282: `archivedAt`), đường "kết thúc học nhiều em" + Hoàn tác của LUI-b (TK-0 ghi tên hàm thật), `fasttrack/cycles.ts` (`setOutcome` — tự lưu trữ), `classes/transition.ts:326` (dừng học ở Chuyển tiếp).
- Luật thuần `canChoThiThat(cycle)` ở `shared/domain/tongKetLoTrinh.ts`: lộ trình FT, chưa đủ 4 kỹ năng thi thật, không "Không thi" → true.
- `setStudentStatus('finished')`: vẫn đóng lộ trình, enrollment, Case như cũ; `archived_at` = `date` **chỉ khi** lộ trình FT vừa đóng **không** `canChoThiThat`; ngược lại để NULL (em ở Học viên & Lớp, trạng thái "Kết thúc học", nhãn "Chờ kết quả thi thật").
- `setOutcome` (TK-K): lưu xong mà em `status='finished'`, `archived_at IS NULL`, và lộ trình hết `canChoThiThat` → `archived_at = hôm nay`, cùng tx; nhật ký `student.archive` (lý do "Có kết quả thi thật" / "Không thi").
- Kết thúc học **nhiều em** (LUI-b): áp cùng luật **từng em** trong một tx (dùng chung hàm, không chép).
- **Hoàn tác** Kết thúc học (LUI-b): trả đúng trạng thái trước — em chưa bị lưu trữ thì không "bỏ lưu trữ"; em đã tự vào Lưu trữ sau khi có kết quả thì Hoàn tác vẫn bỏ lưu trữ như LUI-b quy định.
- Lớp thường, FT đã có kết quả, FT "Không thi": giữ như cũ (lưu trữ ngay).
- [ ] Kiểm đỏ: (1) FT chưa có kết quả → Kết thúc học → `archived_at` NULL, lộ trình đóng, có bản chụp; (2) GVCN nhập đủ 4 kỹ năng → `archived_at` = hôm nay, em có ở Lưu trữ; (3) chọn "Không thi" → tự lưu trữ; (4) nhập thiếu S → chưa lưu trữ; (5) FT đã có kết quả trước → Kết thúc học lưu trữ ngay; (6) lớp thường → lưu trữ ngay; (7) kết thúc học nhiều em trộn (1)+(5)+(6) → mỗi em đúng luật, một tx; (8) Hoàn tác ở trường hợp (1) và sau (2) → về đúng trạng thái trước; (9) danh sách Học viên & Lớp mặc định (ẩn em lưu trữ) có em ở (1), không có em ở (2).
- [ ] Commit: `feat(tk): kết thúc học FT chờ kết quả thi thật chưa lưu trữ`.

### Task TK-6: Xoá học viên xoá bản chụp
**Files:** `students/xoaHocVien.ts` (`CAU_XOA_HOC_VIEN`, trước câu xoá `learning_cycles`).
- [ ] Phép kiểm X2 (`xoaDuLieu.tests.ts:326`) đỏ sau TK-2 → thêm `DELETE FROM ban_chup_luot WHERE ban_chup_id IN (SELECT id FROM ban_chup_lo_trinh WHERE student_id = ?)` và `DELETE FROM ban_chup_lo_trinh WHERE student_id = ?` → xanh. Kiểm: xoá em có bản chụp → không còn dòng.
- [ ] Commit: `fix(tk): xoá học viên xoá luôn bản chụp`.

### Task TK-7: Đường đọc
Skill: test-driven-development
**Files:** tạo `server/src/loTrinh/tongKet.ts`; sửa `server/src/routes/index.ts` (cạnh `/students/:id/cycles` và `/classes/:id/overview`); `tests/tocDoDuong.ts`.

**Interfaces:**
```ts
export function cacLoTrinh(p: Principal, studentId: number): { id: number; ten: string; lop: string | null; batDau: string | null;
  ketThuc: string | null; dangHoc: boolean; lyDo: LyDoDong | null; ketQua: { chinh: string; tone: string; phu?: string } | null }[];
export function tongKetLoTrinh(p: Principal, cycleId: number): { hocVien: { id: number; ten: string }; banChup: /* dòng ban_chup_lo_trinh mới nhất */;
  luot: /* gom ban_chup_luot theo lượt: { attemptNo, kind, nhan, lop, tuan, trangThai, huyLyDo, kyNang: {k, diem, dat, tong?}[], overall, kyVong, sos, ketQua } */[] };
export function tongKetLop(p: Principal, classId: number): { lop: …; dong: { studentId; ten; dauVao; target; soLuot; luotCuoi; kyNang; overall;
  thiThatOvr: number | null; ketLuan; huongTiep; roiSom: boolean; luotCuoiHuy?: boolean }[] };  // lớp thường: giuaKhoa, cuoiKhoa, huongTiep
```
- `cacLoTrinh`: lộ trình đang chạy lấy kết quả gần nhất sống (một truy vấn, không gọi `studentProfile`); đã đóng lấy từ bản chụp mới nhất. Sắp mới nhất trước.
- `tongKetLop`: chỉ lớp `status='finished'` (khác → 404 "Lớp chưa kết thúc"); dòng = mỗi em từng có enrollment ở lớp; kết quả = bản chụp mới nhất có `ban_chup_luot.class_id = lớp` (lượt thi ở lớp này); em rời sớm mà lộ trình chưa đóng → `roiSom`, kết quả rỗng; FT dùng `luotDaiDien` (Q2).
- Routes: `GET /students/:id/lo-trinh`, `GET /lo-trinh/:cycleId/tong-ket`, `GET /classes/:id/tong-ket`.
- [ ] Kiểm đỏ: GVBM ngoài phạm vi HV → 403 **trước** truy vấn bản chụp; QL chi nhánh khác → 403; HV đã lưu trữ đọc được (chỉ xem); cycleId active → 404; lớp chưa kết thúc → 404; `tongKetLop` FT lấy đúng lượt đại diện, lượt cuối huỷ → `luotCuoiHuy`; em chuyển lớp giữ lộ trình → `roiSom`, không lộ điểm lớp mới.
- [ ] `DUONG_DO` + `TRAN` cho 3 đường (vai QL, GVCN, GVBM; `{hv}`, `{lopFT}` — thêm placeholder lớp đã kết thúc nếu chưa có). `GET /students/{hv}` không đổi số truy vấn.
- [ ] Commit: `feat(tk): đường đọc tổng kết lộ trình và lớp`.

### Task TK-8: Web — "Các lộ trình" + ngăn Tổng kết
Skill: `/impeccable layout` · `/impeccable clarify` · `/impeccable harden` · `/impeccable adapt`
**Files:** tạo `web/src/modules/students/CacLoTrinh.tsx`, `web/src/modules/students/NganTongKet.tsx`; sửa `StudentDetailPage.tsx` (tab Hành trình ~389; bỏ nút + dải "Lộ trình ▾" 88, 214-216, 239-246 — **chỉ khi Q3 = A**).
- [ ] Khối **"Các lộ trình"** đầu tab Hành trình, trên "Hành trình học tập", luôn hiện (kể cả một lộ trình). Cột: Lộ trình · Lớp · Thời gian · Kết quả · nút. Đang học: nhãn "Đang học", nút "Học thuật ›" (đổi tab). Đã đóng: kết quả + nhãn hướng, nút "Tổng kết". Rỗng: "Chưa có lộ trình nào". 375: mỗi lộ trình một thẻ. **Chữ đúng mockup.**
- [ ] **Ngăn "Tổng kết lộ trình"** (khung panel phải dùng chung, như `StudentPlanPanel`): đầu "Tổng kết lộ trình" + "{tên} · {chương trình}"; **ba ô Đích → Thi thật → Hướng tiếp** (FT: Target + "Thi SEP 2026" → OVR + L R W S + ngày + nhãn Đạt / Chưa đạt Target, hoặc "Chờ kết quả thi thật" + nút "Nhập kết quả" → Hướng tiếp; lớp thường: hai ô "Cuối khoá {%}" + dải → Hướng tiếp); một dòng Lớp · GVCN · Đầu vào · (Target) · Thời gian; tiêu đề nhỏ "Mock Test n" / "Kết quả Test n"; bảng — FT: MT · Lớp · Tuần · L R W S · OVR · Kỳ vọng · Kết quả (nhãn `đã huỷ` / `huỷ phần` như `NhanDot`); lớp thường: Bài · Lớp · Tuần · Điểm từng phần · Kết quả (dùng `tenMonNgan`, `nhanKetQuaThuong`). Rỗng: "Chưa có lượt Test nào". Chân: "Mở hồ sơ" (→ `duongHoSoHocVien(id, { loTrinh })`) · "Đóng". 375: toàn màn, mỗi lượt một thẻ (như `TheDong`).
- [ ] Mở ngăn bằng địa chỉ `?tong-ket=<cycleId>` (link từ Lưu trữ / lớp mở thẳng); đóng thì xoá tham số. Thêm khoá vào `docThamSoHoSo` (`shared/domain`), có kiểm.
- [ ] Trạng thái tải (khung xương), lỗi + "Thử lại".
- Khối "Các lộ trình", FT đã đóng: Kết quả = "Thi thật {OVR}" + "Đạt / Chưa đạt Target" hoặc "Chờ kết quả thi thật"; cạnh đó nhãn hướng tiếp. Tên lộ trình FT kèm route ("Fast Track · LT1").
- [ ] Commit: `feat(tk): khối Các lộ trình và ngăn Tổng kết lộ trình`.

### Task TK-9: Web — Lưu trữ + tab "Tổng kết" của lớp đã kết thúc
Skill: `/impeccable layout` · `/impeccable clarify` · `/impeccable adapt`
**Files:** sửa `web/src/modules/students/LuuTruPage.tsx`, `server/src/classes/luuTru.ts` (thêm `cycleIdCuoi` cho HV), `shared/domain/hocVienLop.ts:554` (`TAB_HO_SO_LOP` thêm `'tong-ket'`, nhãn "Tổng kết"), `ClassOverviewPage.tsx`; tạo `web/src/modules/classes/TabTongKetLop.tsx`.
- [ ] Lưu trữ › Học viên: nút "Tổng kết" (chỉ khi có lộ trình đã đóng) → `/hoc-vien/:id?tab=hanh-trinh&tong-ket=<cycleIdCuoi>`. Lưu trữ › Lớp: nút "Tổng kết" → `/hoc-vien/lop/:id?tab=tong-ket`.
- [ ] Hồ sơ lớp: tab "Tổng kết" **chỉ khi lớp đã kết thúc**, đứng đầu và là mặc định khi `status='finished'`. Dải số (FT: Học viên · Đạt Target · Chưa đạt · Chờ kết quả — theo **thi thật**; thường: Học viên · Lên FT · Lên lớp · Học lại). Bảng FT: Học viên · Đầu vào · Target · nhóm "MT cuối" (MT · n lượt · L R W S · OVR) · nhóm "Thi thật" (OVR · Kết quả) · Hướng tiếp; thường: Học viên · Giữa khoá · Cuối khoá · Kết luận khoá. Em rời sớm: kết quả "—". Em rời sớm: chữ nhạt, cuối bảng. Bấm hàng → ngăn Tổng kết của em. Rỗng: "Lớp chưa có học viên nào". 375: thẻ.
- [ ] Kiểm `shared`: `tabHoSoLop('tong-ket')`; hàm chọn tab mặc định theo `finished`.
- [ ] Commit: `feat(tk): Tổng kết ở Lưu trữ và hồ sơ lớp đã kết thúc`.

### Task TK-10: Rà soát, tài liệu
- [ ] `npm run check` xanh (một lần một lúc). Bấm thử ảnh thật 375/1440 sáng/tối, vai Quản trị, QL, GVCN, GVBM: Các lộ trình (3 lộ trình), ngăn FT + lớp thường, lượt huỷ, Lưu trữ HV/lớp, lớp FT + lớp thường đã kết thúc.
- [ ] Tập dượt migrate trên bản sao DB (`TRIEN_KHAI.md` mục 8): `npm run migrate` hai lần; lần hai không đổi gì; đếm bản chụp = số lộ trình đã đóng.
- [ ] `CODE_MAP.md` (5 file mới), plan.md mục 11. Commit: `chore(tk): CODE_MAP, plan`.

## Nghiệm thu
1. Mở lộ trình mới, chuyển lớp (đóng), lên lớp / học lại / Lên FT cả lớp, Kết thúc học, sửa tay trạng thái: **mỗi** đường có đúng một bản chụp mới; phép kiểm bất biến xanh.
2. Sau khi đóng, đổi Target, route, band đầu vào, môn của chương trình → ngăn Tổng kết không đổi số.
3. Hồ sơ HV › Hành trình: "Các lộ trình" luôn hiện; lộ trình đã đóng → "Tổng kết" mở ngăn; "Mở hồ sơ" đưa về hồ sơ của lộ trình đó (như dải "Lộ trình ▾" cũ).
4. Lưu trữ: HV có "Tổng kết" (lộ trình đóng gần nhất); lớp có "Tổng kết" → tab Tổng kết.
5. Lớp đã kết thúc: tab "Tổng kết" mặc định, đủ em, em rời sớm nhạt ở cuối, lượt huỷ ghi rõ.
5b. FT: ngăn Tổng kết có Đích → Thi thật → Hướng tiếp; chưa có kết quả hiện "Chờ kết quả thi thật"; GVCN lớp cuối nhập L R W S + ngày thi (kể cả em đã lưu trữ) → OVR, Đạt / Chưa đạt tự ra, bản chụp cập nhật; việc "Cập nhật kết quả thi thật" hiện đúng mốc, hạn 4 tuần, mất khi xong.
6. Rỗng / một lượt / nhiều lượt / lượt huỷ đúng mockup; 375 không cuộn ngang trang (bảng trong khung cuộn được).
7. Migrate chạy hai lần không đổi gì; xoá học viên không để sót bản chụp.
8. Số truy vấn: `GET /students/{hv}` không đổi; 3 đường mới có trần; trần ghi hàng loạt đo lại có lý do.

## Cần chủ sản phẩm quyết
Không còn câu nào (đã chốt hết 06/10).

## Tôi đã tự quyết
| Điểm | Quyết | Lý do |
|---|---|---|
| Học lại (PR-LUI-b) mở lại rồi đóng lần nữa | Giữ bản cũ (`lan` 1), ghi bản mới (`lan` 2); màn chỉ hiện bản **mới nhất** | Đúng plan.md; PR-NC lấy bản mới nhất mỗi lộ trình |
| Bản điền ngược | Không đánh dấu trên màn; cột `nguon` trong DB | Chữ ngắn; chỉ người làm thống kê cần biết |
| GV từng kỹ năng | Lưu DB (`gv_id`, `nguoi_nhap_id`), màn chỉ hiện GVCN | PR-NC cần; ngăn không rộng thêm |
| Ai xem | Như hồ sơ HV (`STUDENT_VIEW`) và hồ sơ lớp | Không mở quyền mới |
| Mở ngăn bằng địa chỉ `?tong-ket=` | Có | Lưu trữ, lớp, link chia sẻ mở thẳng |
| Lộ trình đang chạy | Không có ngăn Tổng kết; nút "Học thuật ›" | Chưa đóng thì chưa có bản chụp |
| Em chuyển lớp mà giữ lộ trình | Tab Tổng kết lớp cũ: hàng nhạt "Chuyển lớp", kết quả "—" | Không lấy số sống cho bảng "đã kết thúc" |
| Thời gian | Mã tuần (`W2 MAY – W3 SEP`), "nay" cho lộ trình đang chạy; ngày chỉ cho **ngày thi thật** | Luật 30/09 |
| Việc nhắc thi thật | Mốc = thứ Hai sau tháng / tuần / ngày thi dự kiến (không có → sau ngày đóng); hạn 4 tuần; đỏ không chặn; không chuông | Em báo điểm IELTS về thường trong 2–3 tuần (13 ngày ra kết quả) |
| OVR thi thật | Máy tính từ 4 kỹ năng (`roundToHalf`), không cho gõ tay | Một nguồn, không lệch |
| Kết luận FT | Chỉ máy so OVR thi thật với **Target lúc đóng**; bỏ ô chọn kết luận tay | Q4 chủ sản phẩm |
| Lớp thường | Không có thi thật; Kết quả = % Cuối khoá + dải, Hướng tiếp = hướng đã chốt (K26) | Q4 chủ sản phẩm |

## Chồng với PR khác
| PR | File chung | Cách xử lý |
|---|---|---|
| **PR-LUI-b** (Học lại, mở lại lớp, thao tác nhiều em) — chạy trước | `students/students.ts` (`setStudentStatus`), `classes/luatLoTrinh.ts`, `classes/luuTru.ts`, `LuuTruPage.tsx`, `xoaKetThucLop.ts` | TK-0 đối chiếu. **Mở lại không xoá bản chụp** (chủ sản phẩm 06/10); đóng lại → bản mới. Câu cần quyết (A) đổi luật lưu trữ khi Kết thúc học — làm ở TK-L sau khi LUI-b merge (chủ sản phẩm chốt A). Đường "kết thúc học nhiều em" của LUI-b phải gọi `ghiBanChup` (bất biến TK-3 bắt). Nếu TK merge trước LUI-b: ghi vào prompt LUI-b |
| **PR-MT0** (MT0, Chuyển tiếp lớp) | `classes/transition.ts`, `lenhChuyen.ts`, `luatLoTrinh.ts` `apDungCaLop` | `ghiBanChup` gọi **sau** khi MT0 đổi `cycle_id`. MT0 "không dùng" vào bản chụp lớp thường với `trang_thai='khong_dung'` (nhãn `MT0 · không dùng` của MT0). PR merge sau thì `git merge origin/main` + chạy lại phép kiểm TK-3 |
| **PR-MTa** (T20–T23 dời / khôi phục / xoá điểm = xoá trắng ô) | `fasttrack/attempts.ts`, `normal/regular.ts`, `absence.ts` | MTa đợt 4 merge trước. TK-5 gắn `lamMoiDiemBanChup` vào cả đường xoá điểm / khôi phục của MTa |
| PR-BV (xoá điểm hàng loạt, Bỏ vắng) | `attempts.ts`, `regular.ts`, `absence.ts` | Merge sau TK thì phải gọi `lamMoiDiemBanChup` (phép kiểm bất biến phụ TK-5 bắt) |
| PR-MTb | `StudentDetailPage.tsx` (ô MT, `NhanDot`) | Khác vùng (tab Học thuật vs Hành trình); merge sau thì rebase |
| PR-NC | — | Đọc `ban_chup_lo_trinh` + `ban_chup_luot`; không đổi bảng |

## Prompt cho session code (dán nguyên khối, sau khi chủ sản phẩm duyệt)
```
/ponytail lite
Làm PR-TK theo docs/superpowers/plans/2026-10-06-pr-tk-tong-ket-lo-trinh.md (TK-0 → TK-10, TK-K, TK-L, prompt chung plan.md mục 9.0).
Model Opus 5.5 · High (B: Sonnet 5.5 · High); không dùng Fable, kể cả subagent. Đầu phiên nói model đang chạy.
Nhánh pr-tk-tong-ket-lo-trinh từ origin/main mới nhất (SAU khi PR-LUI-b merge), worktree .claude/worktrees/pr-tk-tong-ket-lo-trinh.
Đọc "Chủ sản phẩm chốt" ở đầu file trước. Mockup đã duyệt: thiet-ke/mockup-tong-ket-lo-trinh-2026-10-06.html — chữ ĐÚNG mockup, ngắn.
Phép kiểm đỏ trước: mỗi đường đóng lộ trình có bản chụp; kết quả thi thật (quyền GVCN lớp cuối, so Target lúc đóng, việc nhắc đúng mốc); bất biến "lộ trình đã đóng nào cũng có bản chụp" ở cuối run.ts; đóng băng
Target/route/chương trình; migrate prTk chạy hai lần không đổi gì. Ghi bản chụp CÙNG giao dịch với câu đóng.
Impeccable: layout, clarify, harden, adapt (TK-8, TK-9), cuối /impeccable audit; /ponytail-review. Bấm thử 375/1440 sáng/tối,
Quản trị, QL, GVCN, GVBM. Mô tả PR: số truy vấn trước/sau, chú thích ponytail:, ảnh.
```

## Giả định
- G1: Ngoài 5 đường ở Khảo sát không có câu nào đổi `learning_cycles.status` khỏi `active` (đã `git grep` 06/10). Bất biến TK-3 bắt nếu sai.
- G2: `sos_cases` / Case không bị xoá khi lộ trình đóng (chỉ `xoaHocVien`), nên `case_id` trong bản chụp còn trỏ được.
- G3: Hàm đánh giá đang dùng (`resultOf`, `evaluateRegular`) chạy được với `conn` của giao dịch đang mở (SQLite một kết nối). Nếu chúng tự mở kết nối khác → tách phần thuần, ghi ở commit TK-2.
- G4: Lộ trình FT nhận diện bằng `programme_code = 'FT'` (route LT1/LT2/RF). TK-0 kiểm lại trên dữ liệu seed.
