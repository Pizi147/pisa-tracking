# PR-TK · Tổng kết lộ trình — điểm 4 kỹ năng khi kết thúc — Kế hoạch (06/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Chưa code.** Chờ chủ sản phẩm duyệt mockup `thiet-ke/mockup-tong-ket-lo-trinh-2026-10-06.html` và trả lời 4 câu ở mục **Cần chủ sản phẩm quyết**.
> Session code ghi câu trả lời vào khối "Chủ sản phẩm chốt" ngay dưới đây trước khi làm Task TK-0.

**Chủ sản phẩm chốt:** _(chưa có)_

**Goal:** Khi một lộ trình đóng (bằng **bất kỳ** đường nào), web ghi **bản chụp** kết quả: mỗi lượt × mỗi kỹ năng/môn, kèm Target, kỳ vọng, đạt/không, mức SOS, chương trình, lớp, GV, band đầu vào, kết luận. Sửa Target, lộ trình (LT1/LT2/RF), band đầu vào, môn của chương trình về sau **không làm lệch số cũ**. Xem lại dễ: hồ sơ HV › Hành trình có khối **"Các lộ trình"** (luôn hiện); lộ trình đã đóng mở **ngăn "Tổng kết lộ trình"**; Lưu trữ có nút **"Tổng kết"**; lớp đã kết thúc có tab **"Tổng kết"** cả lớp. Bảng bản chụp là nguồn dữ liệu cho PR-NC.

**Architecture:**
- Hai bảng mới (chỉ thêm): `ban_chup_lo_trinh` (một dòng mỗi lần đóng một lộ trình) và `ban_chup_luot` (một dòng mỗi lượt × kỹ năng — đúng dạng "một dòng một lượt × kỹ năng" PR-NC cần xuất Excel).
- **Một** hàm ghi `ghiBanChup(conn, cycleIds, { lyDo, ngay, nguon })` ở `server/src/loTrinh/banChup.ts`, gọi **trong cùng giao dịch** ngay sau mọi câu `UPDATE learning_cycles SET status` (5 chỗ, mục Khảo sát). Hàm tính bằng chính các hàm đang dùng ở hồ sơ (`resultOf`/`typedResult`, `evaluateRegular`, `cuoiKhoaTheoHocVien`) — không viết luật thứ hai.
- Phép kiểm **bất biến** cuối `run.ts`: mọi lộ trình `status <> 'active'` đều có ≥ 1 bản chụp → đường đóng mới sau này quên gọi là đỏ ngay.
- Migrate `server/src/migrate/prTk.ts`: tạo bảng + **điền ngược** cho lộ trình đã đóng chưa có bản chụp (`nguon = 'dien_nguoc'`), chạy lặp không đổi gì.
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
| Kết luận FT | `learning_cycles.outcome` (`reached`/`not_reached`/`unknown`) ghi tay qua `setOutcome` (`cycles.ts:428`), có thể sau khi đóng | nhãn `CYCLE_OUTCOME_LABEL` (`shared/domain/cases.ts:1060`) |
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
- [ ] Ghi "Chủ sản phẩm chốt" (4 câu) vào đầu file này.
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
// Q4: kết luận FT khi chưa ai ghi — MT cuối (attempt_no lớn nhất, không huỷ) có đủ 4 kỹ năng: OVR ≥ Target → reached, < → not_reached; thiếu → unknown
export function ketLuanTuMtCuoi(luot: { attemptNo: number; huy: boolean; overall: number | null }[], target: number | null): 'reached' | 'not_reached' | 'unknown';
// Q2: lượt đại diện cho bảng cả lớp FT — MT cuối có OVR (không huỷ); không có → MT cuối bất kỳ
export function luotDaiDien<T extends { attemptNo: number; huy: boolean; overall: number | null }>(luot: T[]): T | null;
export function khoangTuan(batDau: string | null, ketThuc: string | null, homNay: string): string;  // 'W2 MAY – W3 SEP' | 'W1 JUN – nay'
```
- [ ] Kiểm đỏ: nhãn đủ 8 khoá (`LY_DO_DONG_NHAN` khớp `LY_DO_HUONG` ở `shared/domain/lenLop.ts:111` cho chữ trùng: "Lên lớp", "Học lại", "Lên FT", "Chuyển lớp", "Kết thúc học"); `ketLuanTuMtCuoi` ba nhánh + MT cuối huỷ thì xét MT trước; `luotDaiDien([])===null`; `khoangTuan` dùng hàm mã tuần sẵn có (`tuanLich`/`maTuan`, ghi tên thật vào commit).
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
  ket_luan TEXT, ket_luan_diem REAL, ket_luan_ghi_tay INTEGER NOT NULL DEFAULT 0,   -- FT: reached/not_reached/unknown
  huong TEXT, ky_vong_dat INTEGER, ty_le_cuoi_khoa REAL, dai_cuoi_khoa TEXT,          -- lớp thường
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
- `lan` = `MAX(lan)+1` theo `cycle_id`. `ket_luan`: `outcome` đã ghi tay → dùng, `ket_luan_ghi_tay=1`; chưa → theo Q4.
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
export function tongKetLop(p: Principal, classId: number): { lop: …; dong: { studentId; ten; dauVao; target; soLuot; luotCuoi; kyNang; overall; ketLuan; huong; roiSom: boolean; luotCuoiHuy?: boolean }[] };
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
- [ ] **Ngăn "Tổng kết lộ trình"** (khung panel phải dùng chung, như `StudentPlanPanel`): đầu "Tổng kết lộ trình" + "{tên} · {chương trình}"; lưới 8 ô (Chương trình · Lớp · GVCN · Thời gian · Đầu vào · Target · Số lượt/Số bài · Kết thúc); dòng kết luận; bảng — FT: MT · Lớp · Tuần · L R W S · OVR · Kỳ vọng · Kết quả (nhãn `đã huỷ` / `huỷ phần` như `NhanDot`); lớp thường: Bài · Lớp · Tuần · Điểm từng phần · Kết quả (dùng `tenMonNgan`, `nhanKetQuaThuong`). Rỗng: "Chưa có lượt Test nào". Chân: "Mở hồ sơ" (→ `duongHoSoHocVien(id, { loTrinh })`) · "Đóng". 375: toàn màn, mỗi lượt một thẻ (như `TheDong`).
- [ ] Mở ngăn bằng địa chỉ `?tong-ket=<cycleId>` (link từ Lưu trữ / lớp mở thẳng); đóng thì xoá tham số. Thêm khoá vào `docThamSoHoSo` (`shared/domain`), có kiểm.
- [ ] Trạng thái tải (khung xương), lỗi + "Thử lại".
- [ ] Commit: `feat(tk): khối Các lộ trình và ngăn Tổng kết lộ trình`.

### Task TK-9: Web — Lưu trữ + tab "Tổng kết" của lớp đã kết thúc
Skill: `/impeccable layout` · `/impeccable clarify` · `/impeccable adapt`
**Files:** sửa `web/src/modules/students/LuuTruPage.tsx`, `server/src/classes/luuTru.ts` (thêm `cycleIdCuoi` cho HV), `shared/domain/hocVienLop.ts:554` (`TAB_HO_SO_LOP` thêm `'tong-ket'`, nhãn "Tổng kết"), `ClassOverviewPage.tsx`; tạo `web/src/modules/classes/TabTongKetLop.tsx`.
- [ ] Lưu trữ › Học viên: nút "Tổng kết" (chỉ khi có lộ trình đã đóng) → `/hoc-vien/:id?tab=hanh-trinh&tong-ket=<cycleIdCuoi>`. Lưu trữ › Lớp: nút "Tổng kết" → `/hoc-vien/lop/:id?tab=tong-ket`.
- [ ] Hồ sơ lớp: tab "Tổng kết" **chỉ khi lớp đã kết thúc**, đứng đầu và là mặc định khi `status='finished'`. Dải số (FT: Học viên · Đạt Target · Chưa đạt; thường: Học viên · Lên FT · Lên lớp · Học lại). Bảng FT: Học viên · Đầu vào · Target · MT cuối (· n lượt) · L R W S · OVR · Kết luận · Hướng; thường: Học viên · Giữa khoá · Cuối khoá · Kết luận khoá. Em rời sớm: chữ nhạt, cuối bảng. Bấm hàng → ngăn Tổng kết của em. Rỗng: "Lớp chưa có học viên nào". 375: thẻ.
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
6. Rỗng / một lượt / nhiều lượt / lượt huỷ đúng mockup; 375 không cuộn ngang trang (bảng trong khung cuộn được).
7. Migrate chạy hai lần không đổi gì; xoá học viên không để sót bản chụp.
8. Số truy vấn: `GET /students/{hv}` không đổi; 3 đường mới có trần; trần ghi hàng loạt đo lại có lý do.

## Cần chủ sản phẩm quyết (4 câu)
1. **Điểm nhập / sửa sau khi lộ trình đã đóng** (nhập bù MT cũ, Điểm theo lớp, khôi phục điểm): **A — bản chụp cập nhật điểm, giữ nguyên Target / kỳ vọng / chương trình lúc đóng** (khuyến nghị: điểm sửa là sửa sai, còn cái cần giữ là ngữ cảnh) · B — giữ nguyên bản chụp, điểm mới chỉ thấy ở hồ sơ lộ trình (bỏ TK-5).
2. **Bảng cả lớp FT đã kết thúc lấy lượt nào:** **A — MT cuối có đủ 4 kỹ năng** (khuyến nghị, đúng "kết quả khi kết thúc") · B — MT tốt nhất · C — cả hai (bảng rộng hơn).
3. **Chỗ đặt "Các lộ trình":** **A — đầu tab Hành trình, bỏ nút "Lộ trình ▾" ẩn ở đầu hồ sơ** (khuyến nghị, như mockup) · B — cuối tab Học thuật, giữ nút cũ · C — dải ở đầu hồ sơ, mọi tab đều thấy.
4. **Kết luận FT khi chưa ai ghi "Đạt Target" lúc đóng:** **A — web tự kết luận theo MT cuối đủ 4 kỹ năng (OVR ≥ Target → Đạt, thấp hơn → Chưa đạt, thiếu → Chưa có căn cứ); ai ghi tay thì ghi tay thắng** (khuyến nghị: PR-NC cần cột này đủ) · B — để "Chưa có căn cứ kết luận" tới khi có người ghi.

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
| Thời gian | Mã tuần (`W2 MAY – W3 SEP`), "nay" cho lộ trình đang chạy | Luật 30/09 |

## Chồng với PR khác
| PR | File chung | Cách xử lý |
|---|---|---|
| **PR-LUI-b** (Học lại, mở lại lớp, thao tác nhiều em) — chạy trước | `students/students.ts` (`setStudentStatus`), `classes/luatLoTrinh.ts`, `classes/luuTru.ts`, `LuuTruPage.tsx`, `xoaKetThucLop.ts` | TK-0 đối chiếu. **Mở lại không xoá bản chụp**; đóng lại → bản mới. Đường "kết thúc học nhiều em" của LUI-b phải gọi `ghiBanChup` (bất biến TK-3 bắt). Nếu TK merge trước LUI-b: ghi vào prompt LUI-b |
| **PR-MT0** (MT0, Chuyển tiếp lớp) | `classes/transition.ts`, `lenhChuyen.ts`, `luatLoTrinh.ts` `apDungCaLop` | `ghiBanChup` gọi **sau** khi MT0 đổi `cycle_id`. MT0 "không dùng" vào bản chụp lớp thường với `trang_thai='khong_dung'` (nhãn `MT0 · không dùng` của MT0). PR merge sau thì `git merge origin/main` + chạy lại phép kiểm TK-3 |
| **PR-MTa** (T20–T23 dời / khôi phục / xoá điểm = xoá trắng ô) | `fasttrack/attempts.ts`, `normal/regular.ts`, `absence.ts` | MTa đợt 4 merge trước. TK-5 gắn `lamMoiDiemBanChup` vào cả đường xoá điểm / khôi phục của MTa |
| PR-BV (xoá điểm hàng loạt, Bỏ vắng) | `attempts.ts`, `regular.ts`, `absence.ts` | Merge sau TK thì phải gọi `lamMoiDiemBanChup` (phép kiểm bất biến phụ TK-5 bắt) |
| PR-MTb | `StudentDetailPage.tsx` (ô MT, `NhanDot`) | Khác vùng (tab Học thuật vs Hành trình); merge sau thì rebase |
| PR-NC | — | Đọc `ban_chup_lo_trinh` + `ban_chup_luot`; không đổi bảng |

## Prompt cho session code (dán nguyên khối, sau khi chủ sản phẩm duyệt)
```
/ponytail lite
Làm PR-TK theo docs/superpowers/plans/2026-10-06-pr-tk-tong-ket-lo-trinh.md (TK-0 → TK-10, prompt chung plan.md mục 9.0).
Model Opus 5.5 · High (B: Sonnet 5.5 · High); không dùng Fable, kể cả subagent. Đầu phiên nói model đang chạy.
Nhánh pr-tk-tong-ket-lo-trinh từ origin/main mới nhất (SAU khi PR-LUI-b merge), worktree .claude/worktrees/pr-tk-tong-ket-lo-trinh.
Đọc "Chủ sản phẩm chốt" ở đầu file trước. Mockup đã duyệt: thiet-ke/mockup-tong-ket-lo-trinh-2026-10-06.html — chữ ĐÚNG mockup, ngắn.
Phép kiểm đỏ trước: mỗi đường đóng lộ trình có bản chụp; bất biến "lộ trình đã đóng nào cũng có bản chụp" ở cuối run.ts; đóng băng
Target/route/chương trình; migrate prTk chạy hai lần không đổi gì. Ghi bản chụp CÙNG giao dịch với câu đóng.
Impeccable: layout, clarify, harden, adapt (TK-8, TK-9), cuối /impeccable audit; /ponytail-review. Bấm thử 375/1440 sáng/tối,
Quản trị, QL, GVCN, GVBM. Mô tả PR: số truy vấn trước/sau, chú thích ponytail:, ảnh.
```

## Giả định
- G1: Ngoài 5 đường ở Khảo sát không có câu nào đổi `learning_cycles.status` khỏi `active` (đã `git grep` 06/10). Bất biến TK-3 bắt nếu sai.
- G2: `sos_cases` / Case không bị xoá khi lộ trình đóng (chỉ `xoaHocVien`), nên `case_id` trong bản chụp còn trỏ được.
- G3: Hàm đánh giá đang dùng (`resultOf`, `evaluateRegular`) chạy được với `conn` của giao dịch đang mở (SQLite một kết nối). Nếu chúng tự mở kết nối khác → tách phần thuần, ghi ở commit TK-2.
- G4: Nếu Q1 = B: bảng tổng kết hiện số lúc đóng; bỏ TK-5 và bất biến phụ.
