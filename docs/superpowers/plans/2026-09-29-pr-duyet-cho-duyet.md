# PR-DUYET · Hộp Chờ duyệt (một hộp, có phân loại) — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Mọi thứ "ai đó xin QL quyết" thành **một bản ghi** trong bảng `yeu_cau_duyet` và hiện ở **một hộp**: Công việc › **Chờ duyệt**
(tab đầu với QL/Quản trị, chip `Tất cả · Học thuật · Ý thức · Lịch thi · Thông tin HV · Báo lên`), người xin xem ở **Yêu cầu của tôi**.
Chuyển hai luồng đang có vào hộp (**Đề xuất PA** T43, **Dời lịch MT lần 2** do vắng); thêm ba loại mới: **Xin ý kiến** (T64 — không dừng
PA), **Đề xuất sửa thông tin HV** (T44 — rút quyền GVCN sửa target/lộ trình/lớp), **Báo lên** "Case chờ nguyên nhân quá hạn" (có Nhắc GV,
tự đóng). Có hạn duyệt, quá hạn, tự đóng khi đối tượng không còn, 4 loại thông báo trỏ đúng thẻ, lịch sử quyết định. Dựng **giao kèo
loại thẻ** để PR-SOS (Không cần theo dõi), PR-YT4 (Ý thức), PR-LT2 (kế hoạch bổ trợ, Quyết định Cuối khoá, Mini Test), PR-MT (hạn T42)
chỉ thêm **một phần tử** vào mảng loại.
**Architecture:** Luật thuần `shared/domain/yeuCauDuyet.ts` (loại, phân loại, trạng thái, chip, sắp xếp, nhãn hạn, đường thẻ). Máy chủ
`server/src/duyet/yeuCau.ts` (tạo · chốt · danh sách · duyệt/từ chối/trả lời · quét) + `server/src/duyet/loaiYeuCau.ts` (**mảng** định
nghĩa loại — mỗi PR sau thêm phần tử). Bảng nguồn cũ (`case_interventions.approval_state`, `skill_move_requests.status`) vẫn là sự thật
của luồng cũ; hàm nguồn gọi `chotYeuCau` trong cùng giao dịch. Migrate riêng `server/src/migrate/prDuyet.ts` (T78) + lệnh chạy thử chỉ đọc.
Web: `TheYeuCau` + `HopChoDuyet` (đặc tả §7.6) ở `web/src/modules/duyet/`.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); phép kiểm `server/src/tests/*`
(harness `check()` của `run.ts`), chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §3.1 Q27-3 · §3.1c Q-D · §3.2 T41–T44, T54, T64, T66, T69,
T75 (phần `decide`/`decide_move`), T76, T77, T78 · §4.8 YC-15b · §5.5 · §7.3, §7.5, §7.6 · §8 dòng PR-DUYET + đoạn Migrate · §10 ·
rà `thiet-ke/ra-27-09/`: K1-01, K1-15, K1-16, K1-27, K1-29…K1-33, K1-39, K1-41, K1-44, K1-52, K1-53, K1-55, K1-56, K1-57, K2-06, K2-29,
K3-11, K3-18, K3-20, K3-35, K3-40, K3-47, K4-04, K5-04, K5-05, K5-12, K5-13, K5-14, K5-17, K5-24, K5-27, K5-28, K5-32, K5-33, K5-52,
K5-58, K5-59, K5-63, K5-67 + K1 §4(c)(e)(f), K5 §3–§6 (D15, D17) · mockup **M8** `thiet-ke/mockup/19-nang-cap-27-09.html` (dòng 578–625) ·
kế hoạch PR-NEN "Chuyển cho PR khác" (Vận hành tên ngoài Q12, lý do từ chối dùng `OKhac`, loại hạn `duyet`).

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-DUYET** · đợt 2 · làn **A** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-duyet-cho-duyet` · `.claude/worktrees/pr-duyet-cho-duyet` (từ `origin/main`) |
| Cổng thử | API **4157** · Vite **5357** (không dùng 4000/5173; B 4167/5367 · C 4177/5377 · D 4187/5387 chạy song song) |
| Model | **Opus 5.5 · High** · phương án B: **Fable 5.1 · High** (đọc mục "Hướng dẫn riêng cho model thực thi") |
| Người rà | **Opus 5.5**, session riêng (T52) — session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Có** — `server/src/migrate/prDuyet.ts`: bảng `yeu_cau_duyet` + 3 chỉ mục; cột `tasks.assignee_name`, `notifications.duong`; quyền `request.approve`, `cycle.edit` (qua `migratePermissions` có sẵn); chép yêu cầu đang chờ của hai luồng cũ thành thẻ `cho`. Lệnh chạy thử `chay-thu:duyet` |
| Skill thiết kế | **`/ponytail lite` đầu phiên** (PR có giao diện). impeccable: `clarify` + `harden` ở Task 8; `clarify` ở Task 9; `adapt` (375 px) rồi **`audit`** + `polish` ở Task 12 trước khi mở PR. Không `init`/`document`/`hooks on`. Bám mockup M8 + `thiet-ke/HE_GIAO_DIEN.md` + `TU_DIEN_VA_CHU.md` |
| Phụ thuộc | N1, NEN, LOP đã merge (#108/#110, #113, #112). Chạy song song PR-MT (B), PR-NHAP (C), PR-MON (D) — bảng file chồng dưới. Merge: **DUYET trước SOS, YT4, LT2a**; với MT/NHAP/MON không bắt buộc thứ tự |
| Không làm | luật riêng của SOS (Không cần theo dõi), YT4 (thang, WL 3…), LT2 (bổ trợ, Cuối khoá, Mini Test), MT (hạn T42, tuần đích mặc định) — chỉ **giao kèo**; đổi tên nhóm việc T75 (PR-VAI); dải chờ duyệt ở hồ sơ HV (K3-47, PR-VAI); badge lớp (K2-06, PR-HVL); bỏ Danh sách Case (K1-27, PR-Pb2) |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task; **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không chạy nền,
  không chạy chồng) → xanh, số phép kiểm ≥ mốc B của Task 0 → commit `PR-DUYET (n): …`.
- Treo quá 10 phút → quét `node … tests/run.js` còn sống (`Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`), tắt
  hết rồi chạy lại **một** lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px **một lần** ở Task 12 (Playwright kênh Chrome; đăng nhập demo
  `POST /api/demo/session {userId}`: Quản trị **id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN **Trần Ngọc Hà id 7** · GVBM **Phạm Thu
  Trang id 9**). Ảnh trước (main) / sau lưu `thiet-ke/anh/pr-duyet/`. Chạy song song: `PORT=4157` cho API, Vite tạm cổng 5357 trỏ proxy
  về 4157 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy, không chạy `migrate`/`chay-thu:duyet` trên bản chính. Ghi dữ liệu thử chỉ trên **DB demo trong worktree**.
  Gặp mã lệch hẳn kế hoạch → dừng, ghi Nhật ký, báo planning.
- Trước khi báo xong: tắt 4157/5357, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.
- **🛑 Cửa dừng:** (1) migrate + `chay-thu:duyet` trên **bản chính** chỉ **chủ sản phẩm** chạy ở buổi deploy, theo `TRIEN_KHAI.md`
  (mục "Lệnh cho buổi deploy"). (2) Task 6 bước "rút quyền GVCN" chỉ làm khi **Câu 1** đã có trả lời (planning ghi vào Nhật ký trước
  khi giao); chưa có → làm theo khuyến nghị (A) và ghi Nhật ký.

### File chồng với 3 PR đợt 2 và cách gỡ

| File | PR khác sửa | PR-DUYET sửa | Gỡ khi rebase |
|---|---|---|---|
| `server/src/fasttrack/absence.ts` | **MT**: `requestAbsenceMove` :239-256 (`tooLate`, `decideBy` — T42/K4-04), `decideAbsenceMove` :386-398 (tuần đích mặc định) | :84-121 (`pendingIndex` → `nho`), `insertRequest` :296-322 (+ `taoYeuCau`), `decideAbsenceMove` :374-383 + :404-411 (lý do từ chối, `chotYeuCau`), `sweepExpiredMoves` :436-441, `notifyPlanners` :555-581 | khác khối → giữ cả hai. `decideBy` MT tính gì thì `insertRequest` chép nguyên vào `han_duyet` — không phải sửa lại |
| `server/src/worklist/mywork.ts` | **MT**: nhóm `score` bỏ MT lịch sử (~:380-460) · **MON**: nhãn môn `tenMon` | xoá khối 2 + 2a-bis :462-585, `cause` :841-842, `order` :979-983, `summary` :1060-1067, `WorkGroupKey`/`GROUP_META` | khối xoá của DUYET không chạm `score` → giữ cả hai |
| `web/src/modules/congViec/HoTroHocVienTab.tsx`, `CongViecPage.tsx` | **MON**: công tắc khung FT / Lớp thường ở hàng lọc | bỏ ô "Loại việc" + nút Duyệt + `TraLoiDeXuatPanel`, thêm công tắc `Của tôi · Của GV (nhắc)`, chip 4 nhóm; `CongViecPage` thêm 2 tab | cùng hàng lọc → giữ **cả hai** điều khiển, công tắc khung của MON đứng đầu hàng |
| `shared/domain/tongQuan.ts` | **MON** (`NHOM_CUA_LOAI` nếu thêm loại) | `NHOM_CUA_LOAI` bỏ `decide`, `decide_move`; `CAN_XU_LY` bỏ 2 dòng | giữ cả hai |
| `shared/domain/people.ts`, `server/src/seed/data.ts` | **MT** (quyền GVCN nhập MT lịch sử — K1-53) | `REQUEST_APPROVE`, `CYCLE_EDIT` + nhãn + cấp vai | chỉ thêm dòng → giữ cả hai |
| `server/src/fasttrack/cycles.ts`, `web/src/modules/students/StudentManagePanel.tsx`, `StudentPlanPanel.tsx` | **NHAP**: khoá `examDate`/`startWeek` trong `updateCycle` (trước vòng `map` :148), `ThongTinPanel`, ô thi dự kiến · **MT**: `updateCycle` :200-218 (luật M6) | chỉ dòng kiểm quyền `createCycle` :91, `updateCycle` :129, `reviseTarget` :380 và cờ `canEditCycle` ở panel Lộ trình | NHAP **không** thêm ô target/lộ trình cho GVCN; ô ngày thi giữ quyền `student.edit` (Q7) |
| `server/src/migrate.ts`, `server/src/schema.sql`, `server/src/tests/run.ts`, `tocDoDuong.ts`, `shared/domain/index.ts`, `package.json`, `server/src/seed/seed.ts`, `CODE_MAP.md`, `plan.md`, `thiet-ke/HE_GIAO_DIEN.md`, `TU_DIEN_VA_CHU.md` | cả 4 PR | **một** import + **một** dòng gọi cuối danh sách; bảng mới **cuối** `schema.sql`; khối phép kiểm cuối `run.ts` | chỉ thêm dòng → giữ cả hai, thứ tự theo thứ tự merge |

## Global Constraints

- **Một nơi:** yêu cầu duyệt chỉ ở hộp + "Yêu cầu của tôi"; **không** còn dòng Việc cho nó (`decide`, `decide_move` bỏ), không còn nút
  Duyệt ở dòng việc (K1-32), không còn dòng Cần xử lý trùng thẻ (K1-01). Thông báo chỉ **trỏ** thẻ.
- **Tinh tế:** thẻ theo M8, dấu nhỏ nét mảnh (📎 → biểu tượng SVG 12 px nét 1.5), cột thẳng: nhãn phân loại cùng bề rộng (`w-24`), nút
  cùng hàng căn phải; hạn duyệt là **tầng 1** (14 px đậm, đỏ khi quá hạn); dòng lý do tối đa 2 dòng (`line-clamp-2`); số `tabular-nums`.
- **Chữ:** `TU_DIEN_VA_CHU.md` + `THUAT_NGU_DA_CHOT.md`. Chữ mới: `Chờ duyệt`, `Yêu cầu của tôi`, `Việc học viên`, `Của tôi`, `Của GV
  (nhắc)`, `Báo lên`, `Xin ý kiến`, `Đề xuất sửa`, `tự duyệt`, `Tự đóng`, `còn n ngày`, `Duyệt n yêu cầu`, `Nếu duyệt: …`. Ngày `dd/mm`,
  không ISO, không mã (`de_xuat_pa`, `yeu_cau_duyet`) trên màn hình hay trong câu lỗi.
- **Thành phần có sẵn (PR-NEN):** `KhungPanel`, `NutChon`, `BoLocDoan`, `NhanTrangThai`, `OKhac`, `ONgay`, `ChonNguoi`, `useLoiForm`,
  `<Han loai="duyet">`, `ToastHoanTac` — không tự dựng thứ tương tự (phép kiểm khối 5, 6, 8, 9 của NEN sẽ đỏ).
- **SQL:** chỉ `?` (db.ts cấm tham số đặt tên); mọi câu ghi trong `tx()` (BEGIN IMMEDIATE sẵn, lồng = savepoint); `IN (…)` dựng bằng
  `?` lặp, UNION ≤ 20 vế. Ngày nghiệp vụ `demoToday()` / `useNgayNghiepVu().homNay`.
- **Quyền:** hộp đòi `request.approve` (QL, Quản trị) **và** phạm vi đối tượng (`can(p, REQUEST_APPROVE, { classId, studentId })`);
  GVCN không bao giờ duyệt (T69). QL tự gửi → tự duyệt được, thẻ ghi `tự duyệt`, nhật ký + báo Quản trị (Q-D).
- **Luật thuần có phép kiểm:** `server/src/tests/prDuyet.tests.ts` (`runPrDuyetTests(t)`, đăng ký **cuối** `run.ts`). Phép kiểm cũ so
  nhóm `decide`/`decide_move`/`comment` → đổi kỳ vọng sang thẻ (cùng điều kiện), không xoá; số phép kiểm không giảm.
- **Tốc độ:** mọi đường API mới vào `server/src/tests/tocDoDuong.ts` với trần `max(sau+10, ⌈sau×1.3⌉)` đo ngay sau khi thêm.

## Task 0 · Nhánh, mốc, chép kế hoạch

- [ ] `git fetch origin` → `git worktree add .claude/worktrees/pr-duyet-cho-duyet -b pr-duyet-cho-duyet origin/main`. Gõ `/ponytail lite`.
- [ ] Kế hoạch chưa có trên `main` → `git checkout origin/<nhánh kế hoạch đợt 2> -- docs/superpowers/plans/2026-09-29-pr-duyet-cho-duyet.md`.
- [ ] `npm ci` (nếu cần) → `npm run check` → ghi **mốc B** vào Nhật ký. Ghi MT/NHAP/MON đã merge chưa (`git log origin/main --oneline -8`).
- [ ] Đối chiếu dòng mã kế hoạch dẫn (grep `group: 'decide'`, `pendingIndex`, `function insertRequest`, `nextStep === 'ask_manager'`,
  `function notifyManagers`, `'pa-cho-duyet', nhan`, `TraLoiDeXuatPanel`) — lệch > 20 dòng thì ghi bảng "dòng thật" vào Nhật ký, không dừng.
- [ ] Commit `PR-DUYET (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần `shared/domain/yeuCauDuyet.ts` + hai quyền mới (T41, T54, T66, T69, K1-56, K5-24, K5-32, K5-33)

**Files:** tạo `shared/domain/yeuCauDuyet.ts` (+ export ở `index.ts`); `shared/domain/people.ts` (PERMISSIONS :37-126, PERMISSION_LABEL
:127-152); `server/src/seed/data.ts` `ROLE_PERMISSIONS` :45-81; `shared/domain/display.ts` `deadlineView` :339-370; tạo
`server/src/tests/prDuyet.tests.ts` + đăng ký cuối `run.ts` (sau `runThanhPhanChungTests`).

**Interfaces:**
```ts
export const PHAN_LOAI = ['hoc-thuat', 'y-thuc', 'lich-thi', 'thong-tin-hv', 'bao-len'] as const;
export const PHAN_LOAI_LABEL = { 'hoc-thuat': 'Học thuật', 'y-thuc': 'Ý thức', 'lich-thi': 'Lịch thi', 'thong-tin-hv': 'Thông tin HV', 'bao-len': 'Báo lên' };
/** Mỗi PR thêm khoá của mình VÀO CUỐI mảng này (SOS: 'khong_theo_doi'; YT4: 'y_thuc'; LT2: 'ke_hoach_bo_tro', 'quyet_dinh_cuoi_khoa', 'bao_len_mini_test'). */
export const LOAI_YEU_CAU = ['de_xuat_pa', 'xin_y_kien', 'lich_thi', 'sua_thong_tin', 'bao_len_nguyen_nhan'] as const;
export type LoaiYeuCau = (typeof LOAI_YEU_CAU)[number];
export const TRANG_THAI_YC = ['cho', 'duyet', 'tu_choi', 'tu_dong'] as const;   // + 'da_tra_loi' cho Xin ý kiến
export type KieuNut = 'duyet-tu-choi' | 'tra-loi' | 'nhac';          // Báo lên = 'nhac' (K1-57), Xin ý kiến = 'tra-loi' (T64)
export const LOAI_YC_META: Record<LoaiYeuCau, { phanLoai: PhanLoai; nhan: string; kieuNut: KieuNut; hanNgay: number | null; hangLoat: boolean }>;
//   de_xuat_pa: hoc-thuat · 'Đề xuất PA' · duyet-tu-choi · 5 · true   | xin_y_kien: hoc-thuat · 'Xin ý kiến' · tra-loi · 5 · false
//   lich_thi: lich-thi · 'Dời lịch thi lần 2' · duyet-tu-choi · null (hạn = decide_by) · true
//   sua_thong_tin: thong-tin-hv · 'Đề xuất sửa' · duyet-tu-choi · 5 · false | bao_len_nguyen_nhan: bao-len · 'Case chờ nguyên nhân quá hạn' · nhac · null · false
export function hanDuyetMacDinh(loai: LoaiYeuCau, ngayXin: string): string | null;   // hanTheoNgay(ngayXin, n) — tính cả ngày gửi (M-16)
export function demChip(ds: { phanLoai: PhanLoai }[]): Record<'tat-ca' | PhanLoai, number>;
export function sapThe<T extends { hanDuyet: string | null; taoLuc: string }>(ds: T[], homNay: string): T[];  // quá hạn → hạn gần → không hạn; cùng hạn: cũ trước
export function laTuDuyet(nguoiXin: number | null, nguoiDuyet: number): boolean;
export function duongThe(id: number, vai: 'duyet' | 'nguoi-xin'): string;  // '/cong-viec/cho-duyet?the=12' | '/cong-viec/yeu-cau?the=12'
export function nhanTrangThaiYc(t: TrangThaiYc, tuDuyet: boolean): { t: TrangThai; chu: string };  // → 6 nhãn §7.3 + 'tự duyệt'
```
- [ ] **Phép kiểm trước** (`prDuyet.tests.ts` khối 1): `LOAI_YC_META` phủ đủ mọi khoá, mỗi phân loại ∈ `PHAN_LOAI`; `hanDuyetMacDinh
  ('de_xuat_pa','2026-09-28') === '2026-10-02'`; `lich_thi`/`bao_len_*` → `null`; `sapThe` với 4 thẻ (quá hạn 2 ngày, hôm nay, còn 3 ngày,
  không hạn) ra đúng thứ tự; `demChip` đếm `tat-ca` = tổng; `laTuDuyet(2,2)` true, `(null,2)` false; `duongThe(5,'nguoi-xin')`.
- [ ] `people.ts`: `REQUEST_APPROVE: 'request.approve'` ("Duyệt yêu cầu trong hộp Chờ duyệt"), `CYCLE_EDIT: 'cycle.edit'` ("Sửa target,
  lộ trình, chuyển lớp học viên"). `seed/data.ts`: cấp cả hai cho `system_admin` và `manager`, **không** cho `teacher`. `migratePermissions`
  (`migrate.ts:1281`) tự thêm vào DB đang chạy — không viết lại. Phép kiểm: `can(P.coreTeacher, 'request.approve')` false;
  `can(P.mbManager, 'request.approve', { classId: mbClass })` true; `can(P.cpManager, …mbClass)` false.
- [ ] `display.ts`: `deadlineView` với `kind === 'duyet'` khi chưa quá hạn thêm `còn n ngày` (n = số ngày tới hạn, **tính cả hôm nay**:
  hạn hôm nay → `còn 1 ngày` · `hôm nay`); M8 `Còn 2 ngày · hạn 30/09`. Phép kiểm 3 mốc (còn 3 · hôm nay · quá hạn 1).
- [ ] `npm run check` → commit `PR-DUYET (1): luật thuần hộp Chờ duyệt + quyền request.approve, cycle.edit`.

## Task 2 · Migrate `prDuyet.ts` + `schema.sql` + `chay-thu:duyet` (T78, K5 §5 hàng DUYET, K5-67, NEN Q12, K1-33)

**Files:** tạo `server/src/migrate/prDuyet.ts`, `server/src/migrate/chayThuDuyet.ts`; `server/src/migrate.ts` (một import + một dòng
**sau** `migratePrLop(conn, applied);` :452); `server/src/schema.sql` (bảng mới cuối file; cột mới trong khối `tasks` :1337 và
`notifications`); `package.json` script `chay-thu:duyet` (như `chay-thu:lop`).

```sql
CREATE TABLE IF NOT EXISTS yeu_cau_duyet (
  id INTEGER PRIMARY KEY,
  loai TEXT NOT NULL, phan_loai TEXT NOT NULL,
  doi_tuong_loai TEXT NOT NULL, doi_tuong_id INTEGER NOT NULL,   -- 'intervention' | 'skill_move' | 'cycle' | 'student' | 'sos_case' | …
  hoc_vien_id INTEGER REFERENCES students(id), lop_id INTEGER REFERENCES classes(id), chi_nhanh_id INTEGER REFERENCES branches(id),
  nguoi_xin INTEGER REFERENCES users(id),                         -- NULL = hệ thống (Báo lên)
  ly_do TEXT, bang_chung TEXT, du_lieu TEXT,                     -- bang_chung/du_lieu: JSON
  han_duyet TEXT, trang_thai TEXT NOT NULL DEFAULT 'cho',
  nguoi_duyet INTEGER REFERENCES users(id), ly_do_tu_choi TEXT, tra_loi TEXT, ly_do_dong TEXT,
  tu_duyet INTEGER NOT NULL DEFAULT 0, tao_luc TEXT NOT NULL, xu_ly_luc TEXT
);
CREATE INDEX IF NOT EXISTS ix_ycd_trang_thai ON yeu_cau_duyet (trang_thai, phan_loai);
CREATE INDEX IF NOT EXISTS ix_ycd_doi_tuong ON yeu_cau_duyet (doi_tuong_loai, doi_tuong_id);
-- MỘT thẻ đang chờ cho mỗi (loại, đối tượng): chặn trùng khi migrate chạy lại và khi quét Báo lên (INSERT … ON CONFLICT DO NOTHING).
CREATE UNIQUE INDEX IF NOT EXISTS ux_ycd_dang_cho ON yeu_cau_duyet (loai, doi_tuong_loai, doi_tuong_id) WHERE trang_thai = 'cho';
```
- [ ] `migratePrDuyet(conn, applied)` trong `tx()`: tạo bảng/chỉ mục (IF NOT EXISTS); `addCol('tasks','assignee_name','TEXT')`,
  `addCol('notifications','duong','TEXT')`; rồi `napYeuCauTuNguonCu(conn, today)` (xuất ra để seed gọi lại):
  - PA `approval_state='pending' AND status != 'cancelled'` của Case `status != 'done'` → `de_xuat_pa`, `doi_tuong_loai='intervention'`,
    `nguoi_xin = recorded_by`, `ly_do = description`, `han_duyet = approval_due`. PA dừng vì "Xin hỗ trợ QL" kiểu cũ (có `case_followups.
    next_step='ask_manager'`) **cũng** thành `de_xuat_pa`, `ly_do` mở đầu `Xin ý kiến (trước khi có hộp Chờ duyệt): ` + ghi chú lần ghi
    kết quả đó (Q3).
  - `skill_move_requests.status='pending'` → `lich_thi`, `doi_tuong_loai='skill_move'`, `nguoi_xin = requested_by`, `ly_do = reason`,
    `han_duyet = decide_by`.
  - `hoc_vien_id/lop_id/chi_nhanh_id` lấy như `mywork.ts:468-487` / `:542-553`. `INSERT … ON CONFLICT DO NOTHING` → chạy lại không nhân đôi.
- [ ] `applied.push('Hộp Chờ duyệt: tạo n thẻ (Đề xuất PA a · Dời lịch b)')` chỉ khi n > 0.
- [ ] `chayThuDuyet.ts` (chỉ đọc, dừng nếu file DB cục bộ chưa có — như `chayThuN1.ts`): in (1) số thẻ sẽ tạo theo loại + 5 dòng mẫu
  `#id · HV · lớp · hạn dd/mm`; (2) số **thẻ chết bị bỏ** (PA `pending` mà đã huỷ/Case đóng; đề nghị dời `pending` mà `decide_by` đã qua —
  sẽ bị `sweepExpiredMoves` huỷ ở lần đọc đầu); (3) số GVCN hiện đang sửa được target/lộ trình (sẽ mất quyền, Câu 1).
- [ ] Phép kiểm khối 2: migrate hai lần trên DB demo → số dòng không đổi lần hai; PA pending demo đều có thẻ; PA huỷ không có thẻ.
- [ ] `npm run check` → commit `PR-DUYET (2): migrate bảng yeu_cau_duyet + chạy thử`.

## Task 3 · Lõi máy chủ + giao kèo loại thẻ (T41, §5.5, Q-D, K5-13, K5-17, K5-32)

**Files:** tạo `server/src/duyet/yeuCau.ts`, `server/src/duyet/loaiYeuCau.ts`; `server/src/routes/index.ts` (khối mới cạnh
`/interventions/:id/respond` :1560); `server/src/platform/thongBao.ts` :12-28; `shared/domain/duongHoSo.ts` `duongThongBao` :85-116;
`server/src/tests/tocDoDuong.ts`.

**Giao kèo loại thẻ** (đầu `loaiYeuCau.ts` — **đây là thứ PR-SOS/YT4/LT2/MT đọc**):
```ts
export type YeuCauRow = { id: number; loai: LoaiYeuCau; doi_tuong_loai: string; doi_tuong_id: number; hoc_vien_id: number | null;
  lop_id: number | null; chi_nhanh_id: number | null; nguoi_xin: number | null; ly_do: string | null; du_lieu: string | null;
  han_duyet: string | null; trang_thai: TrangThaiYc; tao_luc: string };
export type DinhNghiaLoai = {
  loai: LoaiYeuCau;
  /** Áp quyết định vào bảng nguồn — chạy TRONG tx của hộp. Hàm nguồn tự gọi `chotYeuCau`; không gọi cũng được, hộp chốt sau. */
  khiDuyet?: (p: Principal, yc: YeuCauRow, vao: { ghiChu: string | null; duLieu?: unknown }) => void;
  khiTuChoi?: (p: Principal, yc: YeuCauRow, lyDo: string) => void;
  khiTraLoi?: (p: Principal, yc: YeuCauRow, traLoi: string) => void;
  /** Điều kiện SQL "đối tượng không còn ý nghĩa" trên bí danh `y` (một biểu thức, chỉ `?` nếu có tham số) + lý do hiện trên thẻ. */
  chet?: { sql: string; lyDo: string };
  /** Báo lên: tạo thẻ mới (ON CONFLICT DO NOTHING) + trả số thẻ tạo. Gọi trong `quetYeuCau`. */
  quet?: (conn: any, homNay: string) => number;
  /** Chữ riêng của thẻ: dòng tiêu đề sau "Loại ·", các dòng phụ, câu "Nếu duyệt: …", đường "Mở". Chỉ đọc, không SQL lặp (nạp trước). */
  moTa: (yc: YeuCauRow, ngu: NguCanhThe) => { tieuDe: string; dong: string[]; neuDuyet?: string; mo?: string };
};
/** MỖI PR THÊM MỘT PHẦN TỬ VÀO CUỐI MẢNG — không sửa phần tử của PR khác. */
export const DINH_NGHIA_LOAI: DinhNghiaLoai[] = [ /* Task 4: de_xuat_pa, lich_thi · Task 5: xin_y_kien · Task 6: sua_thong_tin · Task 7: bao_len_nguyen_nhan */ ];
```
**API lõi** (`yeuCau.ts`):
```ts
export function taoYeuCau(conn: any, v: { loai: LoaiYeuCau; doiTuongLoai: string; doiTuongId: number; hocVienId?: number | null;
  lopId?: number | null; chiNhanhId?: number | null; nguoiXin: number | null; lyDo?: string | null; bangChung?: unknown; duLieu?: unknown;
  hanDuyet?: string | null }): number | null;           // null = đã có thẻ đang chờ (unique) → không tạo; gửi thông báo duyet_moi
export function chotYeuCau(conn: any, doiTuong: { loai?: LoaiYeuCau; doiTuongLoai: string; doiTuongId: number },
  trangThai: 'duyet' | 'tu_choi' | 'tu_dong' | 'da_tra_loi', v: { nguoiDuyet?: number | null; lyDo?: string | null; traLoi?: string | null }): number;
  // UPDATE … WHERE trang_thai = 'cho' → idempotent; gửi duyet_ket_qua cho người xin (trừ tu_dong của Báo lên)
export function hopChoDuyet(p: Principal, f: { phanLoai?: PhanLoai; xem?: 'cho' | 'da-xu-ly'; studentId?: number; branchId?: number });
export function yeuCauCuaToi(p: Principal);            // nguoi_xin = p.userId, 60 ngày gần nhất + mọi thẻ đang chờ
export function demYeuCau(p: Principal): { cho: number; quaHan: number; baoLen: number; cuaToiCho: number; cuaToiTuChoi: number };
export function duyetYeuCau(p: Principal, id: number, v: { ghiChu?: string | null; duLieu?: unknown });
export function tuChoiYeuCau(p: Principal, id: number, lyDo: string);      // lyDo ≥ 3 ký tự (T13) — bắt buộc (§5.5)
export function traLoiYeuCau(p: Principal, id: number, traLoi: string);   // Xin ý kiến: ≥ 3 ký tự
export function duyetNhieu(p: Principal, ids: number[]): { ok: number[]; loi: { id: number; loi: string }[] };  // cùng loại, hangLoat
export function quetYeuCau(homNay: string): void;
```
- [ ] **Phép kiểm trước** khối 3 (dùng một loại giả đăng ký tạm trong phép kiểm, gỡ sau): tạo thẻ → hộp QL MB thấy, QL CP không thấy,
  GVCN gọi `hopChoDuyet` → 403; `duyetYeuCau` hai lần → lần hai 400 "đã xử lý"; `tuChoiYeuCau` thiếu lý do → 400; QL tự gửi rồi tự duyệt →
  `tu_duyet = 1` + một thông báo cho Quản trị; `quetYeuCau` với `chet` đúng → thẻ `tu_dong` + `ly_do_dong`; thẻ quá hạn → đúng **một**
  thông báo `duyet_qua_han` cho QL và Quản trị sau hai lần quét (dedup).
- [ ] `duyetYeuCau`: đọc thẻ → `cho`? → `require_(p, REQUEST_APPROVE, { classId: lop_id, studentId: hoc_vien_id, branchId: chi_nhanh_id })`
  → `tx(() => { def.khiDuyet?.(…); chotYeuCau(…, 'duyet', { nguoiDuyet: p.userId, lyDo: ghiChu }); tu_duyet; writeAudit('request.approve');
  addJourney nếu có học viên })`. Loại có `kieuNut !== 'duyet-tu-choi'` → 400. Tương tự `tuChoiYeuCau` (`request.decline`), `traLoiYeuCau`
  (`request.answer`). Mã nhật ký mới có nhãn tiếng Việt trong `nhatKy.ts` (K1-53; phép kiểm N1 khối 11 quét).
- [ ] `quetYeuCau(homNay)` — **một** hàm, gọi ở `myWork`, `hopChoDuyet`, `demYeuCau`, `tongQuanQuanLy` (K5-17); nhớ theo request bằng
  `nho('quet-yeu-cau', …)` để một request chỉ quét một lần: (a) mỗi loại có `chet`: `UPDATE yeu_cau_duyet SET trang_thai='tu_dong',
  ly_do_dong=?, xu_ly_luc=? WHERE loai=? AND trang_thai='cho' AND (<chet.sql>)`; (b) mỗi loại có `quet`: gọi; (c) thẻ `cho`,
  `kieuNut='duyet-tu-choi'|'tra-loi'`, `han_duyet < homNay` → `notify` kind `duyet_qua_han`, `dedupKey = qua_han_duyet:{id}` tới QL chi
  nhánh + `system_admin`. Mọi ghi trong một `tx`. Không có gì để làm thì không mở giao dịch (đọc trước bằng một câu `SELECT … LIMIT 1`).
- [ ] Thông báo (K5-13, K1 §4f): `entity_type='yeu_cau_duyet'`, 4 kind `duyet_moi` (QL chi nhánh + `system_admin`, trừ người xin),
  `duyet_ket_qua` (người xin: `Yêu cầu {loại} — {HV}: QL đã duyệt` / `…từ chối: {lý do}` / `…đã trả lời`), `duyet_qua_han`, `bao_len`.
  `thongBaoCua` thêm `LEFT JOIN yeu_cau_duyet y ON n.entity_type='yeu_cau_duyet' AND y.id=n.entity_id` → `student_id` qua `y.hoc_vien_id`.
  `duongThongBao`: `case 'yeu_cau_duyet': return duongThe(n.entity_id, n.kind === 'duyet_ket_qua' ? 'nguoi-xin' : 'duyet')`. Giữ nguyên
  `sos_case`/`skill_move_requests` để thông báo cũ vẫn mở được (K5-14).
- [ ] Routes: `GET /yeu-cau?hop=cho-duyet|cua-toi&phanLoai=&xem=&studentId=&branchId=`, `GET /yeu-cau/dem`, `POST /yeu-cau/:id/duyet`,
  `/tu-choi`, `/tra-loi`, `POST /yeu-cau/duyet-nhieu`. Phép kiểm: mọi đường trả chữ tiếng Việt, không mã.
- [ ] `tocDoDuong.ts`: `/yeu-cau?hop=cho-duyet` (QL, QT; GVCN → 403), `/yeu-cau?hop=cua-toi` (GVCN, GVBM), `/yeu-cau/dem` (mọi vai) → đo,
  ghi trần. `/my-work` tăng câu vì `quetYeuCau` → chỉnh trần **chỉ** khi đo vượt, ghi số cũ → mới vào Nhật ký.
- [ ] `npm run check` → commit `PR-DUYET (3): lõi hộp Chờ duyệt, giao kèo loại thẻ, thông báo, quét`.

## Task 4 · Chuyển hai luồng cũ vào hộp: Đề xuất PA (T43) · Dời lịch lần 2 (K4-04 phần thẻ, K5-04, K5-14, K5-27, K5-28, K5-58, K1-39)

**Files:** `server/src/cases/cases.ts` (`notifyManagers` :700-732, lời gọi :591-593 và :918, `approvalDue` :857, `respondToPlan` :948-1066);
`server/src/fasttrack/absence.ts` (:84-121, :296-322, :357-418, :421-446, :555-581); `server/src/worklist/mywork.ts` (:108-112, :155-159,
:177-180, :462-585, :979-983, :1060-1067); `shared/domain/tongQuan.ts` `NHOM_CUA_LOAI` :32-37; `web/src/modules/worklist/WorkList.tsx` :28
(bỏ trường `duyet`); `server/src/duyet/loaiYeuCau.ts`.

- [ ] **Phép kiểm trước** khối 4: GV ghi PA `needsApproval` → một thẻ `de_xuat_pa` hạn = `approval_due` (5 ngày), `myWork(QL)` **không**
  còn nhóm `decide`; QL `duyetYeuCau` → PA `started`, `action_due` Thứ Hai, thẻ `duyet`, GV nhận `duyet_ket_qua`; gọi thẳng
  `respondToPlan` (đường cũ) cũng chốt thẻ; `respondToPlan({decision:'comment'})` → 400 (K3-20: bỏ Góp ý — sửa kỳ vọng `run.ts:2989`);
  huỷ PA đang chờ (đường `closeCasesBySystem`) → lần quét sau thẻ `tu_dong` "Case đã đóng". Dời lần 2: `requestAbsenceMove` lần 2 → thẻ
  `lich_thi` hạn = `decide_by`; `decideAbsenceMove(approve:false)` không lý do → 400; `sweepExpiredMoves` quá hạn → thẻ `tu_dong`
  "Hết hạn duyệt — phần thi bị huỷ" trong **cùng** giao dịch; `myWork(QL)` không còn `decide_move`.
- [ ] `recordIntervention`: `needsApproval` → `taoYeuCau(conn, { loai:'de_xuat_pa', doiTuongLoai:'intervention', doiTuongId:id, …,
  hanDuyet: approvalDue })` trong cùng `tx`. `notifyManagers`: **bỏ** kind `plan` và `report` (K1-39 — xoá lời gọi :591-593, nhánh
  `needsApproval ? … : 'plan'` chỉ còn tạo thẻ); kind `approval` thay bằng thông báo `duyet_moi` của `taoYeuCau` → xoá hẳn `notifyManagers`
  nếu không còn chỗ gọi.
- [ ] `respondToPlan`: bỏ nhánh `comment` (:949, :995, :998-1001 — báo lỗi "Không còn Góp ý: Duyệt hoặc Từ chối có lý do"); sau
  UPDATE gọi `chotYeuCau(conn, { doiTuongLoai:'intervention', doiTuongId }, approved ? 'duyet' : 'tu_choi', { nguoiDuyet, lyDo: note })`;
  thông báo cũ `plan-reply` bỏ (đã có `duyet_ket_qua`).
- [ ] Định nghĩa `de_xuat_pa`: `khiDuyet` → `respondToPlan(p, id, { decision:'approved', note: ghiChu })`; `khiTuChoi` →
  `…'declined', note: lyDo`; `chet.sql` = `NOT EXISTS (SELECT 1 FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
  WHERE iv.id = y.doi_tuong_id AND iv.status != 'cancelled' AND sc.status != 'done' AND iv.approval_state = 'pending')` (K5-58: một câu
  cho mọi đường huỷ — Q2); `moTa`: `Đề xuất PA · {kỹ năng} · {HV} · {lớp} · {MTn}` / `{người} đề xuất {dd/mm}: "{mô tả}"` /
  `Nếu duyệt: PA bắt đầu hôm nay, ghi kết quả hằng tuần hạn hết T2`.
- [ ] `absence.ts`: `pendingIndex` (biến tiến trình) → `nho('de-nghi-doi', …)` theo request (K5-28), bỏ `invalidatePending`/`writing`
  chỉ giữ phần xoá nhớ trong request nếu `nho` có hàm xoá, không thì đọc thẳng (đề nghị đang chờ luôn ít). `insertRequest` gọi
  `taoYeuCau` (`lich_thi`, `doi_tuong_loai:'skill_move'`, `hanDuyet: decideBy`). `decideAbsenceMove`: từ chối bắt buộc `note` ≥ 3 ký tự;
  cả hai nhánh gọi `chotYeuCau`. `sweepExpiredMoves`: sau `expired` gọi `chotYeuCau(…,'tu_dong',{ lyDo:'Hết hạn duyệt — phần thi bị huỷ' })`.
  `notifyPlanners` cho đề nghị dời (kind `schedule_move`) **bỏ** — đã có `duyet_moi`; giữ cho các lời gọi khác (vắng muộn, :687).
- [ ] Định nghĩa `lich_thi`: `khiDuyet` → `decideAbsenceMove(p, id, { approve:true, note, periodId: duLieu?.periodId ?? null })`;
  `khiTuChoi` → `…approve:false, note: lyDo`; `moTa`: `Dời {kỹ năng} MTn lần {n} · {HV} · {lớp}` / `{người}: {lý do} · đề nghị {tuần đích}` /
  `Hết {dd/mm} không duyệt thì yêu cầu tự huỷ` (M8). **Không** tự tính hạn — hạn là `decide_by` do `absence.ts` (PR-MT đổi luật ở đó).
- [ ] `mywork.ts`: xoá khối 2 và 2a-bis (:462-585) — **giữ** hai lời gọi `sweepExpiredMoves(); settleNoShows();` (đưa lên đầu khối 2b);
  xoá `decide`, `decide_move` khỏi `WorkGroupKey`, `GROUP_META`, `order`; `summary.approval` = `demYeuCau(p).cho` (K5-04). `NHOM_CUA_LOAI`
  bỏ hai khoá. Sửa kỳ vọng: `run.ts:3019-3022`, `congViec.tests.ts:254,265,475`, `tongQuan.tests.ts:78-79`, `suaLoiNong.tests.ts:105`
  (cùng điều kiện, đọc thẻ thay nhóm việc).
- [ ] `npm run check` → commit `PR-DUYET (4): Đề xuất PA và Dời lịch lần 2 vào hộp, bỏ nhóm việc decide/decide_move`.

## Task 5 · Xin ý kiến (T64, K3-11, K1-31)

**Files:** `server/src/cases/cases.ts` `updateResult` nhánh `ask_manager` :2981-2992; `shared/domain/cases.ts` :824, :832, :909, :916,
:928, :932 (chữ); `web/src/modules/cases/CapNhatTuan.tsx` :42, :110, :224-232; `web/src/modules/cases/CasePanel.tsx` (khối PA :240-270);
`server/src/cases/cases.ts` `caseDetail` (thêm `xinYKien` cho PA); `loaiYeuCau.ts`.

- [ ] **Phép kiểm trước** khối 5: ghi kết quả tuần với `decision:'ask_manager'` → PA **vẫn** `started`, `action_due` sang Thứ Hai kế tiếp
  như "Giữ nguyên", `followup_due` **không đổi** (T22 — không mất mốc); một thẻ `xin_y_kien` hạn 5 ngày, `ly_do` = câu "Cần Quản lý giúp gì";
  `traLoiYeuCau` thiếu chữ → 400; có chữ → thẻ `da_tra_loi`, GV nhận `duyet_ket_qua` có câu trả lời; `duyetYeuCau` thẻ này → 400.
- [ ] Máy chủ: nhánh `ask_manager` = lưu như `keep` (cùng mã với nhánh Giữ nguyên, không chép) + `taoYeuCau({ loai:'xin_y_kien',
  doiTuongLoai:'intervention', …, lyDo: decisionNote, duLieu:{ followupId } })`. Bỏ UPDATE `status='planned', approval_state='pending',
  action_due=NULL, followup_due=NULL`.
- [ ] Định nghĩa `xin_y_kien`: `kieuNut:'tra-loi'`; `khiTraLoi` ghi `tra_loi` + `addJourney` "Quản lý trả lời: …"; nút phụ **"+ Thêm PA
  cho em"** trên thẻ mở `ThemPaPanel` sẵn có của Ngăn Case (web, không đường máy chủ mới); `chet` = PA huỷ hoặc Case đóng; `moTa`:
  `Xin ý kiến · PA {tên PA} · {HV}` / `{người} ({dd/mm}): "{câu hỏi}"` / `Kết quả tuần: {kết quả}`.
- [ ] Chữ: nút `Xin hỗ trợ QL` giữ; mô tả :832/:916 → `Lưu kết quả tuần như Giữ nguyên và gửi câu hỏi cho Quản lý. PA vẫn chạy.`;
  `CapNhatTuan.tsx:230` → `Gửi Quản lý · trả lời trong 5 ngày ở Chờ duyệt`; :42 `Đã gửi Quản lý — PA vẫn chạy`.
- [ ] Ngăn Case: dưới PA có thẻ `xin_y_kien` đang chờ → dòng tím `Đã xin QL hỗ trợ dd/mm · chờ trả lời · hạn dd/mm`; đã trả lời → dòng
  `Quản lý ({tên}) trả lời dd/mm: …` (dùng chỗ hiện `approvalNote` :245-249). `caseDetail` nạp thẻ của mọi PA trong **một** câu.
- [ ] `npm run check` → commit `PR-DUYET (5): Xin ý kiến QL không dừng PA, thành thẻ Chờ duyệt`.

## Task 6 · Đề xuất sửa thông tin HV (T44, K3-40, K5-33, M-18) — 🛑 Câu 1

**Files:** `server/src/fasttrack/cycles.ts` `createCycle` :87-91, `updateCycle` :126-175 (kiểm quyền :129), `reviseTarget` :375-380; `server/src/students/
students.ts` `transferStudent` :159-185; `server/src/classes/loTrinhTiep.ts` :216-222; `shared/domain/quanLyHocVien.ts` :5-58;
`web/src/modules/students/StudentDetailPage.tsx` :238; `StudentPlanPanel.tsx`; tạo `web/src/modules/duyet/DeXuatSuaPanel.tsx`; `loaiYeuCau.ts`.

- [ ] **Phép kiểm trước** khối 6: GVCN `reviseTarget` → 403 "Đề xuất sửa để Quản lý duyệt"; GVCN `updateCycle({route})` → 403,
  `updateCycle({note})`/`({examMonth})` vẫn được (Q7); GVCN `transferStudent` → 403 (nếu Câu 1 = A); QL cả ba được. GV của lớp (GVBM
  cũng được) gửi `sua_thong_tin` `{truong:'target', cu:6.5, moi:7.0}` → thẻ; QL duyệt → `cycle_target_revisions` có dòng, lý do = lý do
  đề xuất, `actor` = QL; `truong:'lop'` duyệt → **không** tự chuyển lớp, thẻ `duyet` ghi "Đã xử lý".
- [ ] Quyền: `updateCycle` — patch có `targetScore`/`route` đòi `CYCLE_EDIT`; trường khác giữ `STUDENT_EDIT`. `reviseTarget` đòi
  `CYCLE_EDIT`; `createCycle` đòi `CYCLE_EDIT` khi em **đã có** lộ trình (mở lộ trình mới = đổi lộ trình), lộ trình đầu tiên lúc thêm HV
  giữ `STUDENT_EDIT` (PR-NHAP). `transferStudent` hai `require_` đổi `STUDENT_EDIT` → `CYCLE_EDIT` (Câu 1). `loTrinhTiep.ts:216`: tách
  `coTheChuyenLop = can(CYCLE_EDIT, …)`; `ghiLoTrinhTiep` giữ `STUDENT_EDIT` (việc `next_step` của GVCN). Câu báo lỗi mới:
  `Target, lộ trình và lớp do Quản lý sửa. Bấm "Đề xuất sửa" để gửi Quản lý duyệt.`
- [ ] Máy chủ: `POST /students/:id/de-xuat-sua { truong: 'target'|'lo-trinh'|'lop'|'lich-mt'|'khac', moi, lyDo }` — người gọi có
  `STUDENT_VIEW` ở lớp đang học của em (GV của lớp); `lyDo` ≥ 15 ký tự; `target` 0–9 bước 0.5; `lo-trinh` ∈ lộ trình còn dùng; mỗi
  (em, trường) một thẻ đang chờ (unique theo `doi_tuong_loai='student'`, `doi_tuong_id=em`, `du_lieu.truong` → dùng `doi_tuong_loai =
  'student:'||truong`). Định nghĩa `sua_thong_tin`: `khiDuyet` — `target` → `reviseTarget(p, chu kỳ đang chạy, { newTarget, reason })`;
  `lo-trinh` → `updateCycle(p, …, { route })`; `lop`/`lich-mt`/`khac` → không áp, chỉ chốt với `ghiChu` bắt buộc ("Đã chuyển sang lớp …")
  (Q6); `chet` = em đã thôi học/lưu trữ hoặc giá trị hiện tại đã bằng `moi`; `moTa`: `Đề xuất sửa {trường} {cũ} → {mới} · {HV}` / `{người}:
  "{lý do}"`.
- [ ] Web: `mucQuanLyHocVien` thêm mục `de-xuat-sua` ("Đề xuất sửa thông tin…") cho **mọi GV của lớp** khi **không** có `canEditCycle`
  (máy chủ trả thêm `viewer.canEditCycle`); GVBM nay có ⋮ (một mục). `StudentPlanPanel`: không `canEditCycle` → ô target/lộ trình chỉ
  đọc, cạnh mỗi ô liên kết `Đề xuất sửa`. `DeXuatSuaPanel` = `KhungPanel` hẹp: Trường (`NutChon` 5 lựa chọn) · Giá trị mới (target:
  ô số; lộ trình: `NutChon`; còn lại: ô chữ) · Lý do (`useLoiForm`, ≥ 15) · chân `Gửi Quản lý` → toast "Đã gửi — xem ở Công việc ›
  Yêu cầu của tôi".
- [ ] `npm run check` → commit `PR-DUYET (6): Đề xuất sửa thông tin HV, quyền cycle.edit`.

## Task 7 · Báo lên + Nhắc + tự đóng (K1-57, K5-05, K5-12, K5-59, K1-33, T77)

**Files:** `loaiYeuCau.ts`; `server/src/worklist/mywork.ts` `cause` :841-842; `server/src/worklist/nhacViec.ts` :57-62;
`shared/domain/duongHoSo.ts` (`nhac_viec`); `server/src/cases/sosState.ts` (`awaitingCauseCaseIds` :88 — chỉ dùng).

- [ ] **Phép kiểm trước** khối 7: Case chờ nguyên nhân quá hạn (dữ liệu demo có sẵn hoặc dời `verify_due` về quá khứ) → sau `quetYeuCau`
  **một** thẻ `bao_len_nguyen_nhan`, quét lần hai không thêm; GVBM chọn nguyên nhân → lần quét sau thẻ `tu_dong` "Việc gốc đã xong";
  `myWork(QL)` chế độ `Của tôi` **không** còn dòng `cause` của GV khác; chế độ `nguoi=tat-ca` vẫn có (kèm tên). Nhắc từ thẻ → một thông báo
  `nhac_viec` cho GVBM, cột `duong` = `href` của dòng; bấm lần hai cùng ngày → trả `daNhacLuc` cũ.
- [ ] Định nghĩa `bao_len_nguyen_nhan`: `kieuNut:'nhac'`, `hanDuyet` = hạn gốc của GV (chỉ để hiện "Quá hạn n ngày", **không** sinh
  `duyet_qua_han` — Q13); `quet`: Case SOS đang mở ∩ `awaitingCauseCaseIds` ∩ `verify_due < homNay` → `taoYeuCau` (`doi_tuong_loai:
  'sos_case'`, `nguoiXin: null`, `duLieu:{ viecKey:'cause:{id}', ownerId }`) + `notify bao_len` cho QL chi nhánh; `chet` = Case đóng
  **hoặc** đã có nguyên nhân chính (`case_issues.role='primary'`); `moTa`: `Case chờ nguyên nhân quá hạn · {kỹ năng} · {HV} · GVBM {tên}` /
  `Không cần duyệt — để QL biết và nhắc.` PR-SOS đổi `verify_due` → `han_xac_nhan` trong **phần tử này** (ghi ở "Chuyển cho PR khác").
- [ ] Nút Nhắc trên thẻ: `POST /my-work/nhac { key: duLieu.viecKey, ownerId }` (đường sẵn có). `nhacViec.ts`: `notify` thêm `duong =
  row.href` (cần `notify` nhận `duong?` — sửa `platform/audit.ts:48-59`: cột mới, mặc định NULL); `duongThongBao` `nhac_viec` →
  `n.duong ?? '/cong-viec'`. Thẻ Chờ duyệt thường **không** có Nhắc (K5-12).
- [ ] `mywork.ts:841`: bỏ `asManager` khi `nguoi` là "của tôi"; giữ nhánh "xem người khác" (`xemNguoiKhac`) để QL vẫn thấy dòng GV trễ ở
  chế độ `Của GV (nhắc)`.
- [ ] `closeCasesBySystem` (K5-59) **không sửa** — thẻ của Case/PA vừa đóng tự đóng ở lần quét kế tiếp nhờ `chet` (Q2); phép kiểm: em chuyển
  FT → lớp thường có một thẻ `de_xuat_pa` đang chờ → sau `hopChoDuyet` thẻ `tu_dong` "Case đã đóng" (D15).
- [ ] `npm run check` → commit `PR-DUYET (7): Báo lên Case chờ nguyên nhân quá hạn, Nhắc trỏ đúng dòng, thẻ tự đóng`.

## Task 8 · Web: `TheYeuCau`, `HopChoDuyet`, tab Công việc (T41, M8, K1-16, K1-29, K1-30, K1-32) — impeccable `clarify` + `harden`

**Files:** tạo `web/src/modules/duyet/TheYeuCau.tsx`, `HopChoDuyet.tsx`, `YeuCauCuaToi.tsx`; `web/src/modules/congViec/CongViecPage.tsx`;
`HoTroHocVienTab.tsx` (:79-100 `nutPhu`, :126-134 ô "Loại việc", :155-162 `TraLoiDeXuatPanel`); `shared/domain/dieuHuong.ts` :9, :98-117;
`server/src/platform/nav.ts` :11-27 (cờ `workApprove` = `can(REQUEST_APPROVE, { anyScope:true })`, `workRequests` = `attempt`).

- [ ] `dieuHuong.ts`: `TabCongViec` thêm `'cho-duyet' | 'yeu-cau'`; thứ tự `['cho-duyet','ho-tro','yeu-cau','van-hanh','bao-cao']`; nhãn
  `Chờ duyệt` · **`Việc học viên`** (đổi từ "Hỗ trợ học viên", K1-29) · `Yêu cầu của tôi` · …; đường `/cong-viec/cho-duyet`,
  `/cong-viec/yeu-cau`; `ho-tro` giữ `/cong-viec` (link cũ, `mo-viec`, thông báo cũ không gãy). `cho-duyet` hiện khi `workApprove`;
  `yeu-cau` khi `workRequests && !workApprove`. `KHU_VUC` mục Công việc: `to` = `/cong-viec/cho-duyet` với người có `workApprove`
  (hàm `khuVucHienThi` nhận nav → trả `to` theo cờ). Phép kiểm `khung.tests.ts`: QL tab đầu = `cho-duyet`; GV = `ho-tro`, `yeu-cau`.
- [ ] `TheYeuCau({ yc, onXong, gon? })` — khuôn M8, **một** thành phần dùng ở hộp, Yêu cầu của tôi, Ngăn Case (Task 9), hồ sơ HV (PR-VAI):
  hàng 1 `[nhãn phân loại w-24] {tieuDe}`; hàng 2–3 dòng phụ (lý do `line-clamp-2`, "Xem thêm" mở hết); bằng chứng (nếu có); `Nếu duyệt: …`
  (chữ phụ); chân: trái `<Han loai="duyet">` (tầng 1) hoặc `NhanTrangThai` khi đã xử lý (+ `tự duyệt`), phải nút theo `kieuNut`:
  `Duyệt` (chính) · `Từ chối…` · `Mở` | `Trả lời…` · `+ Thêm PA` · `Mở` | `Nhắc {GV}` · `Mở`. `Từ chối…`/`Trả lời…` mở ô chữ **ngay trong
  thẻ** (không panel), bắt buộc ≥ 3 ký tự, `useLoiForm`; lý do từ chối là chữ tự do (không danh sách → không `OKhac`, ghi mô tả PR). Lịch
  thi `Duyệt` mở chọn tuần (`ONgay kieu="tuan"`, mặc định tuần đề nghị) trong thẻ. Sau thao tác: `ToastHoanTac` **không** (quyết định
  không hoàn tác) → toast `ok` + thẻ rời danh sách chờ.
- [ ] `HopChoDuyet`: hàng lọc `BoLocDoan` chip phân loại có số (đủ 6, số 0 mờ — Q12) · `BoLocDoan` `Đang chờ · Đã xử lý (30 ngày)` ·
  `BranchFilter`; danh sách `sapThe`; chọn nhiều (ô chọn nhỏ đầu thẻ, chỉ loại `hangLoat`, chỉ khi đang lọc đúng một loại) → thanh dưới
  `Duyệt n yêu cầu`; `?the={id}` → cuộn tới thẻ, viền nhấn 2 giây. Rỗng: `Không có yêu cầu nào đang chờ`.
- [ ] `YeuCauCuaToi` (GV): danh sách thẻ của mình, `NhanTrangThai` `Chờ duyệt · Xong (Đã duyệt) · Đã huỷ (Bị từ chối — lý do)`,
  không nút duyệt; `?the=`.
- [ ] `HoTroHocVienTab`: bỏ `nutPhu` Duyệt + `TraLoiDeXuatPanel` + `duyetDong` (K1-32); ô `Người phụ trách` của QL → `BoLocDoan`
  `Của tôi · Của GV (nhắc)` (`nguoi=toi|tat-ca`), chọn một GV cụ thể giữ `ChonPhuTrach` bên cạnh (K1-29); ô `Loại việc` → `BoLocDoan` 4 nhóm
  `NHOM_VIEC` có số (K1-30), tham số `nhom=` (giữ đọc `loai=` cũ để link cũ không gãy).
- [ ] `/impeccable clarify` trên chữ thẻ/nút/lỗi của `TheYeuCau`, `HopChoDuyet`; `/impeccable harden` (bấm đúp, lỗi mạng giữa chừng,
  thẻ đã bị người khác xử lý → 400 "đã xử lý" → làm mới danh sách, rỗng, đang tải). Sửa theo báo cáo trong phạm vi PR.
- [ ] `npm run check` → commit `PR-DUYET (8): hộp Chờ duyệt, Yêu cầu của tôi, tab Công việc`.

## Task 9 · Web: thẻ trong Ngăn Case, bỏ panel Trả lời đề xuất (K3-20, K3-35 phần C6) — impeccable `clarify`

**Files:** `web/src/modules/cases/ThaoTacCase.tsx` :247-295 (xoá `TraLoiDeXuatPanel`); `web/src/modules/students/NganCase.tsx` :11, :25,
:71-85, :141; `web/src/modules/cases/CasePanel.tsx` :66, :262-267; `server/src/cases/cases.ts` `caseDetail` (trả `yeuCau` của từng PA).

- [ ] `caseDetail`: mỗi PA có `yeuCau: { id, loai, trangThai, hanDuyet, … } | null` (thẻ `cho` mới nhất, một câu cho cả Case).
- [ ] `CasePanel`: PA chờ duyệt + người xem có `canApprove` → nhúng `<TheYeuCau gon>` ngay dưới PA (thay nút "Trả lời đề xuất"); người
  xem khác → giữ câu `Đang chờ Quản lý trả lời · hạn dd/mm`. Bỏ `'tra-loi'` khỏi `NganCase` (`viec=tra-loi` cũ trên URL → mở Ngăn Case
  thường, không lỗi).
- [ ] `/impeccable clarify` chữ quanh PA chờ duyệt / Xin ý kiến.
- [ ] `npm run check` → commit `PR-DUYET (9): thẻ Chờ duyệt trong Ngăn Case, bỏ panel Trả lời đề xuất`.

## Task 10 · Tổng quan, badge, Quản trị, Vận hành tên ngoài (K1-01, K1-16, K1-41, K1-44, K1-52, K1-53, K5-63, NEN Q12)

**Files:** `shared/domain/tongQuan.ts` `CAN_XU_LY` :80-91; `server/src/worklist/tongQuan.ts` :20-53; `web/src/modules/worklist/
KhoiCanXuLy.tsx`, `ViecCuaToi.tsx`; `web/src/App.tsx` :33-58, :127; `web/src/modules/platform/AccountsAdmin.tsx` :70;
`server/src/platform/accounts.ts` `register` :126; `server/src/worklist/mgmttasks.ts` :360-378 (+ sửa/đọc việc); `web/src/modules/worklist/
MgmtTasksPage.tsx` (ô Người phụ trách); `web/src/modules/platform/AdminPage.tsx` :102-120.

- [ ] Tổng quan QL: `CAN_XU_LY` bỏ `pa-cho-duyet` và `case-xac-dinh-nguyen-nhan-qua-han` (chỉ số giữ cho Phân tích/branch-pulse);
  `hv-can-xu-ly` **giữ** tới PR-YT4 (Q9). `tongQuanQuanLy` trả thêm `choDuyet = demYeuCau(p)`; đầu khối Cần xử lý một dải mảnh
  `Chờ duyệt 5 · 2 quá hạn · Báo lên 1  [Mở hộp duyệt]` (số là tầng 1; ẩn khi cả ba = 0). Sửa kỳ vọng `tongQuan.tests.ts` (dòng bị bỏ).
- [ ] Tổng quan GV (K1-16): dưới "Việc cần làm" một dòng `2 yêu cầu đang chờ QL · 1 bị từ chối →` (ẩn khi 0) → `/cong-viec/yeu-cau`.
- [ ] Badge (K1-44, Q10): mục Công việc (thanh trên + thanh dưới điện thoại) có số nhỏ = `cho` của QL (nền đỏ khi `quaHan > 0`, không thì
  trung tính); đọc `/yeu-cau/dem` một lần khi đổi trang (`useApi` có sẵn, không hỏi lặp theo giờ). GV không có badge ở PR này.
- [ ] Quản trị › Tài khoản: tiêu đề `Đăng ký chờ duyệt`; rỗng → một dòng xám (K1-52). `register` → `notify` mọi `system_admin` kind
  `dang_ky`, `entity_type='user'` → `duongThongBao` `/quan-tri?tab=tai-khoan` (K1-41). Ghi §5.5 một dòng "Duyệt tài khoản ở ngoài hộp —
  việc của Quản trị" (K5-63, Task 11).
- [ ] Quyền & nhật ký (K1-53): bảng quyền ở Quản trị hiện 2 quyền mới (đọc `PERMISSION_LABEL` — kiểm có hiện); `nhatKy.ts` nhãn
  `request.approve/decline/answer`, `request.create`.
- [ ] Vận hành tên ngoài (PR-NEN Q12, YC-10): `tasks.assignee_name`; tạo/sửa việc nhận `assigneeName` khi không có `assigneeUserId`
  (≥ 2 ký tự, **không** nhận thông báo, không sinh dòng `mgmt` cho ai); `kiemNguoi` chỉ chạy khi có id; ô Người phụ trách dùng `ChonNguoi`
  **bật** dòng "Dùng tên ngoài hệ thống"; bảng hiện tên ngoài kèm nhãn nhỏ `ngoài hệ thống`. Người theo dõi giữ chỉ tài khoản (NEN Q13).
- [ ] `npm run check` → commit `PR-DUYET (10): Tổng quan, badge Công việc, Quản trị, Vận hành tên ngoài`.

## Task 11 · Dữ liệu demo (D17 phần DUYET, D15) + tài liệu

**Files:** tạo `server/src/seed/duyetSeed.ts`, gọi cuối `seed/seed.ts` (sau `buildSosV3Demo` và `closeCasesBySystem`); `CODE_MAP.md`;
`thiet-ke/HE_GIAO_DIEN.md` (§4 loại hạn `duyet` "còn n ngày"; thành phần `TheYeuCau`); `thiet-ke/TU_DIEN_VA_CHU.md` (mục PR-DUYET);
đặc tả §5.5 (ghi chú cuối bảng loại); `plan.md`; `docs/TRIEN_KHAI.md` (mục đợt 2: `chay-thu:duyet`).

- [ ] Seed: gọi `napYeuCauTuNguonCu` (Task 2) để PA/đề nghị dời seed dựng bằng SQL cũng có thẻ; thêm qua **hàm dịch vụ** (không SQL tay):
  (a) GVBM đề xuất PA Tutor cho em MB FT 101, `approval_due` quá hạn 1 ngày → thẻ đỏ; (b) Xin ý kiến của GVBM Trang; (c) GVCN Hà đề xuất sửa
  target 6.5 → 7.0 (M8); (d) QL Vy tự ghi một PA cần duyệt → thẻ "tự duyệt được"; (e) một thẻ đề xuất PA đã **tự đóng** (Case đóng hệ
  thống — D15); (f) Báo lên Case chờ nguyên nhân quá hạn (có sẵn trong seed SOS v3 — kiểm, thêm nếu thiếu); (g) một thẻ đã duyệt + một thẻ
  bị từ chối có lý do (Yêu cầu của tôi của Hà). Dời lịch lần 2 để PR-MT (D5) — nếu seed đã có đề nghị `pending` thì nó tự có thẻ.
  Chip Ý thức = 0 tới PR-YT4.
- [ ] Phép kiểm khối 11: sau seed, hộp QL MB có ≥ 1 thẻ mỗi phân loại Học thuật · Thông tin HV · Báo lên, ≥ 1 quá hạn, ≥ 1 `tu_dong`.
- [ ] Tài liệu: CODE_MAP thêm `server/src/duyet/`, `web/src/modules/duyet/`, bảng `yeu_cau_duyet`; TU_DIEN chữ mới (Global Constraints);
  đặc tả §5.5 ghi: Xin ý kiến 5 ngày (T64 thắng K1-31), duyệt tài khoản ngoài hộp (K5-63), "quá hạn duyệt" là trạng thái thẻ + thông báo,
  không phải thẻ Báo lên riêng (Q13).
- [ ] `npm run check` → commit `PR-DUYET (11): demo hộp Chờ duyệt + tài liệu`.

## Task 12 · impeccable `adapt` + `audit` + `polish`, bấm thử (một lần), mở PR

- [ ] Chạy máy thử **API 4157 · Vite 5357** trong worktree; seed mới. `/impeccable adapt` cho `HopChoDuyet` + `TheYeuCau` ở 375 px (thẻ
  một cột, nút ≥ 44 px, hàng chip cuộn ngang trong khung chứ không cuộn trang). Rồi `/impeccable audit` (a11y, tương phản, focus, trạng
  thái) trên hộp, Yêu cầu của tôi, Ngăn Case có thẻ, panel Đề xuất sửa, dải Tổng quan → sửa; `/impeccable polish` một lượt.
- [ ] Bấm thử theo **KIỂM** (dưới), ảnh trước (main) / sau 1440 + 375 px → `thiet-ke/anh/pr-duyet/` (`01-hop-cho-duyet`, `02-the-lich-thi`,
  `03-tu-choi`, `04-yeu-cau-cua-toi`, `05-ngan-case-the`, `06-xin-y-kien`, `07-de-xuat-sua`, `08-tong-quan-dai`, `09-badge`, `10-van-hanh-ten-ngoai`).
- [ ] `chay-thu:duyet` trên bản sao DB demo (scratchpad) → ghi số in ra vào Nhật ký; mã băm DB gốc không đổi.
- [ ] `/ponytail-review` → liệt kê chú thích `ponytail:` vào mô tả PR. `npm run check` → push → `gh pr create` tiêu đề
  `PR-DUYET: hộp Chờ duyệt — Đề xuất PA, Dời lịch, Xin ý kiến, Đề xuất sửa, Báo lên`; thân: bảng mã YC/T/K → ảnh → đạt/không; "tầng 1 của màn
  này là: hạn duyệt" (hộp), "số chờ duyệt" (dải Tổng quan); mục "Chuyển cho PR khác"; kết quả audit; lệnh deploy. **Không tự merge.**
- [ ] Tắt 4157/5357, quét `tests/run.js` treo và tắt, dọn file Playwright/Vite tạm.

## KIỂM — kịch bản bấm thử (Task 12, một lần)

| Vai | Làm | Phải thấy |
|---|---|---|
| QL (id 2) | bấm Công việc | vào thẳng **Chờ duyệt**; chip đủ 6 có số; thẻ quá hạn đứng đầu, hạn đỏ `quá hạn 1 ngày`; badge Công việc có số |
| QL | thẻ Đề xuất PA › Từ chối… để trống › Gửi | dưới ô `Cần ít nhất 3 ký tự`; gõ lý do → thẻ rời "Đang chờ"; "Đã xử lý" có thẻ `Đã huỷ · lý do` |
| QL | thẻ Đề xuất PA khác › Duyệt | toast; mở Ngăn Case: PA `Đang làm`, `Ghi kết quả tuần … · hạn hết T2` |
| QL | thẻ Xin ý kiến › Trả lời… | không có nút Duyệt; trả lời xong GV nhận thông báo, bấm chuông mở **Yêu cầu của tôi** đúng thẻ |
| QL | thẻ Đề xuất sửa target › Duyệt | hồ sơ HV target 7.0, Hành trình có "Đổi mục tiêu 6.5 → 7.0" với lý do của GVCN |
| QL | thẻ Báo lên › Nhắc Trần … | `✓ Đã nhắc hh:mm`; đăng nhập GVBM → chuông mở đúng Ngăn Case (không phải `/cong-viec` chung) |
| QL | thẻ tự ghi PA › Duyệt | thẻ ghi `tự duyệt`; Quản trị (id 1) có thông báo |
| QL | chip Học thuật › chọn 2 thẻ Đề xuất PA › `Duyệt 2 yêu cầu` | cả hai `Xong`; một thẻ lỗi thì báo riêng thẻ đó, thẻ kia vẫn xong |
| QL | Tổng quan | dải `Chờ duyệt n · k quá hạn · Báo lên m`; **không** còn dòng "PA chờ Quản lý duyệt", "Case quá hạn xác định nguyên nhân" |
| QL | Công việc › Việc học viên | công tắc `Của tôi · Của GV (nhắc)`; chip 4 nhóm; không còn ô "Loại việc", không nút Duyệt trên dòng |
| QL | Vận hành › + Việc mới › Người phụ trách gõ `Tổ chuyên môn` | dòng `Dùng tên ngoài hệ thống` chọn được; bảng hiện tên + `ngoài hệ thống` |
| GVCN (id 7) | Công việc | tab `Việc học viên · Yêu cầu của tôi`, không có tab Chờ duyệt; Yêu cầu của tôi có thẻ Chờ / Đã duyệt / Bị từ chối + lý do |
| GVCN | hồ sơ HV › ⋮ | có `Đề xuất sửa thông tin…`; ⋮ › Lộ trình: target chỉ đọc + `Đề xuất sửa`; gửi thiếu lý do → báo dưới ô |
| GVCN | Tổng quan | dòng `n yêu cầu đang chờ QL · m bị từ chối →` |
| GVBM (id 9) | Ngăn Case › Ghi kết quả › Xin hỗ trợ QL | PA vẫn `Đang làm`; dưới PA dòng tím `Đã xin QL hỗ trợ dd/mm · chờ trả lời · hạn dd/mm` |
| GVBM | hồ sơ HV › ⋮ | có ⋮ với một mục `Đề xuất sửa thông tin…` |
| Quản trị (id 1) | Quản trị › Tài khoản | tiêu đề `Đăng ký chờ duyệt`; Quyền & nhật ký có 2 quyền mới, nhật ký thẻ có nhãn tiếng Việt |
| 375 px | hộp, thẻ, Yêu cầu của tôi, panel Đề xuất sửa | thẻ một cột, nút ≥ 44 px, không cuộn ngang trang; badge ở thanh dưới |
| Bàn phím | hộp: Tab qua chip → thẻ → Từ chối… → Esc | Esc đóng ô lý do, focus về nút; Enter ở ô lý do = Gửi |

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Cách cắm |
|---|---|---|
| Thẻ **Không cần theo dõi** (YC-12.4, T23): Học thuật, 5 ngày, từ chối → Case về chờ nguyên nhân hạn mới 3 ngày; không bao giờ tự duyệt | PR-SOS | thêm `'khong_theo_doi'` cuối `LOAI_YEU_CAU` + phần tử `DINH_NGHIA_LOAI`; `taoYeuCau` trong luồng "Không cần theo dõi" |
| Báo lên Case chờ nguyên nhân: đọc `sos_cases.han_xac_nhan` thay `verify_due`; loại Case đang chờ "không theo dõi" | PR-SOS | sửa `quet`/`chet` của phần tử `bao_len_nguyen_nhan` |
| Loại **Ý thức** (Meeting CX/GĐCN · WL 3 · Đình chỉ · Khác; bằng chứng bắt buộc; `request.approve`, không `discipline.manage`) + Báo lên vi phạm quá hạn / vi phạm Mới > 5 ngày; gỡ `hv-can-xu-ly` khỏi `CAN_XU_LY`; thông báo K1-40 | PR-YT4 | phần tử mới, `bang_chung` JSON id tệp |
| **Kế hoạch bổ trợ** (3 ngày) · **Quyết định Cuối khoá** (hạn K2-29/T54: sớm hơn trong hai mốc) · Báo lên **Mini Test trượt** (nút "Ghi quyết định") | PR-LT2a · PR-LT2b | phần tử mới; `hanDuyet` truyền khi tạo |
| Hạn thẻ Lịch thi = **hết CN tuần gửi** (T42, K4-04), tuần đích mặc định, dòng "Duyệt = S thi W2 OCT"; demo D5 | PR-MT | MT xuất `hanDuyetDoiLan2`, `tuanDichMacDinh`, `moTaDoiLan2(req)` (kế hoạch MT Task 8); **PR merge sau** nối chúng vào phần tử `lich_thi` (`moTa`, tuần mặc định ô chọn tuần) — hạn tự đúng vì thẻ chép `decide_by` |
| Modal "Đề nghị dời" ở trang một lượt (`MockDetailPage.tsx:1097-1135`) → nhúng `TheYeuCau` | PR-XLMT | thao tác MT theo trạng thái (T38) |
| Badge lớp "n chờ duyệt" (K2-06) | PR-HVL | đếm `yeu_cau_duyet` theo `lop_id` |
| Dải "n yêu cầu chờ bạn duyệt" ở hồ sơ HV (K3-47); badge "việc quá hạn" cho GV (K1-44); đổi tên nhóm việc T75 / K1 §4(c) | PR-VAI | `GET /yeu-cau?hop=cho-duyet&studentId=` + `TheYeuCau` đã sẵn |
| "Đã xong" → liên kết phụ ở Thêm PA (K3-18 phần còn lại); dòng tím Xin ý kiến theo `HangPA` mới | PR-SOS | — |
| Bỏ góc nhìn Danh sách Case (K1-27) | PR-Pb2 | — |
| Thêm HV: GVCN vẫn đặt target/lộ trình lúc **tạo**; panel Thông tin HV không thêm ô target/lộ trình cho GVCN | PR-NHAP | quyền `cycle.edit` chỉ chặn **sửa** |

## Lệnh cho buổi deploy (đợt 2 — 🛑 chỉ chủ sản phẩm chạy, theo `TRIEN_KHAI.md`)

1. Sao lưu DB chính. 2. `npm run chay-thu:duyet` trên **bản sao** DB chính → đọc số thẻ sẽ tạo, số thẻ chết, số GVCN mất quyền sửa target.
3. `npm run migrate` trên **DB THỬ** → bấm thử hộp trên bản nháp. 4. Migrate DB chính → `--prod`. 5. Báo GV: "Xin hỗ trợ QL" không còn dừng
PA; GVCN sửa target/lộ trình/lớp qua "Đề xuất sửa".

## Bảng Q — tự quyết (chỉ chỗ có thể lệch ý chủ sản phẩm; người rà gạch dòng không đồng ý)

| Q | Quyết | Lý do |
|---|---|---|
| Q1 | Bảng `yeu_cau_duyet` là **hộp thư**; bảng nguồn cũ vẫn là sự thật của luồng cũ; hàm nguồn gọi `chotYeuCau` (idempotent) cùng giao dịch | không viết lại hai luồng đang chạy trên bản chính; đường cũ (modal ở trang một lượt) vẫn đồng bộ thẻ |
| Q2 | Thẻ "chết" đóng bằng **quét khi đọc** (một câu UPDATE mỗi loại), không gọi hàm ở từng đường huỷ (K5-58, K5-59 đề xuất gọi ở từng đường) | một chỗ, không sót đường nào (kể cả đường của PR sau); trễ tối đa tới lần mở hộp kế tiếp |
| Q3 | PA đang **dừng** vì "Xin hỗ trợ QL" kiểu cũ → thẻ **Đề xuất PA** (Duyệt = PA chạy lại từ hôm nay, Từ chối = PA huỷ) | giữ đúng nghĩa lúc GV gửi; không đoán lại PA |
| Q4 | Bỏ **Góp ý** ở mọi nơi (K3-20); máy chủ trả lỗi rõ | Từ chối có lý do đã đủ; thẻ chỉ Duyệt/Từ chối (M8) |
| Q5 | Xin ý kiến hạn **5 ngày** (T64), không 3 (K1-31) | đặc tả §3.2 viết sau báo cáo rà |
| Q6 | Đề xuất sửa: **target, lộ trình** áp tự động khi Duyệt; **lớp, lịch MT, khác**: QL tự làm ở màn gốc rồi bấm Duyệt (ghi chú bắt buộc "đã làm gì") | chuyển lớp/xếp lịch cần chọn chi tiết (lớp đích, bàn giao Case, tuần) — tự áp là đoán |
| Q7 | **Thi dự kiến** giữ GVCN sửa thẳng (K3-40 muốn chuyển sang Đề xuất sửa) | T44 và M-18 chỉ kể target/lộ trình/lớp; PR-NHAP cho GVCN nhập ngày thi khi thêm HV |
| Q8 | Không thêm chỉ số `yeu-cau-cho-duyet` vào sổ metrics (K5-52); dải Tổng quan đọc `/yeu-cau/dem`, bấm mở hộp | hộp chính là danh sách của con số; thêm chỉ số = hai nơi tính |
| Q9 | `hv-can-xu-ly` giữ ở Cần xử lý tới PR-YT4 (K1-01 muốn bỏ ngay) | định nghĩa đúng (K1-26) thuộc YT4; bỏ sớm = QL mất tín hiệu vi phạm trong đợt 2 |
| Q10 | Badge Công việc chỉ cho QL; GV "việc quá hạn" → PR-VAI | đếm việc GV cần dựng `myWork` ở mọi trang (nặng trên Turso) |
| Q11 | Modal Đề nghị dời ở trang một lượt **giữ** (đi qua cùng hàm, đồng bộ thẻ); từ chối bắt buộc lý do ở máy chủ | file của MT/XLMT; tránh chồng làn B |
| Q12 | Chip hiện đủ 6 kể cả số 0 (Ý thức = 0 tới đợt 3) | chỗ đứng cố định, người dùng không phải tìm lại chip |
| Q13 | "Quá hạn duyệt" là **trạng thái thẻ** (đỏ) + thông báo QL và Quản trị một lần; không tạo thẻ Báo lên riêng | §5.5 kể nó trong Báo lên nhưng thẻ đã nằm sẵn trong hộp — hai thẻ cho một việc |
| Q14 | QL tự gửi → tự duyệt được, thẻ ghi `tự duyệt`, nhật ký + thông báo Quản trị (Q-D) — áp cho mọi loại **trừ** loại khai `khongTuDuyet` (PR-SOS dùng cho Không cần theo dõi, T23) | Q-D; T23 "không bao giờ tự duyệt" là của QL quá hạn, ghi rõ để PR-SOS quyết |
| Q15 | Quyết định trong hộp **không có Hoàn tác** | Duyệt đã chạy PA/dời lịch/đổi target — hoàn tác là một luồng khác |
| Q16 | Vận hành tên ngoài hệ thống làm ở PR này (PR-NEN Câu 1 mặc định B) | có migrate sẵn, chạm Công việc |

## Mâu thuẫn nguồn ↔ mã thật

- **M1** §5.5/T43 "Đề xuất PA hạn theo luật cũ", K5-27 "Chủ nhật tuần kế tiếp" ↔ mã: PR-N1 đã đổi 5 ngày (`HAN_DUYET_NGAY`,
  `shared/domain/cases.ts:658`, `cases.ts:857`) → thẻ đọc `approval_due`, không đổi luật.
- **M2** T42 "hạn = hết CN tuần gửi" ↔ mã `decideByOf` = ngày trước tuần đích (`absence.ts:154`) và đường "-" chốt muộn đặt hạn = hôm nay
  (:239-256) → PR-MT sửa (K4-04); PR-DUYET chỉ chép `decide_by`.
- **M3** K5-13 đường `/cong-viec?tab=cho-duyet&the=` ↔ trang Công việc dùng **đoạn đường** (`/cong-viec/van-hanh`) → `/cong-viec/cho-duyet?the=`.
- **M4** T44 rút quyền chuyển lớp của GVCN ↔ chủ sản phẩm 23/09 Q3 "GVCN chuyển được sang mọi chi nhánh" (`students.ts:173-177`) → **Câu 1**.
- **M5** K3-40 đưa "thi dự kiến" vào Đề xuất sửa ↔ `cycles.ts:141-145` ghi "mục 7.5: GVCN sửa thi dự kiến" + T44 không kể → Q7.
- **M6** §5.5 "Báo lên: yêu cầu quá hạn duyệt" ↔ T23 "thẻ đỏ + báo QL và Quản trị" → Q13.
- **M7** K1-31 Xin ý kiến 3 ngày ↔ T64 5 ngày → Q5.
- **M8** `MockDetailPage.tsx:1128` "Từ chối và huỷ phần thi" không đòi lý do ↔ §5.5 "Từ chối bắt buộc lý do" → máy chủ bắt lý do (Q11).
- **M9** §7.6 nói `TheYeuCau` + `HopChoDuyet`; K3-47 cần thẻ ở hồ sơ HV → `TheYeuCau` dựng dùng lại được, dải ở hồ sơ để PR-VAI.

## Câu cần chủ sản phẩm quyết

1. **GVCN còn tự chuyển lớp được không?** Đặc tả T44 (27/09) rút quyền sửa **target, lộ trình và chuyển lớp** của GVCN — GVCN bấm "Đề xuất
   sửa", QL duyệt. Nhưng ngày 23/09 anh/chị đã chốt "GVCN chuyển lớp được sang mọi chi nhánh". (A) **Rút cả ba** theo T44 — đổi target/lộ
   trình làm đổi kỳ vọng và SOS, chuyển lớp kéo theo bàn giao Case, nên để QL giữ cửa · (B) Rút target + lộ trình, **GVCN vẫn tự chuyển lớp**.
   **Khuyến nghị (A)** — kế hoạch làm theo (A) nếu chưa có trả lời.

## Hướng dẫn riêng cho model thực thi (đặc biệt khi chạy phương án B — Fable 5.1)

- Chỗ dễ sai nhất: **hai đường chốt một thẻ** (hộp gọi `khiDuyet` → hàm nguồn → `chotYeuCau`; hộp lại gọi `chotYeuCau`). `chotYeuCau` luôn
  `WHERE trang_thai = 'cho'` và trả số dòng — lần hai trả 0, **không** ném lỗi, **không** gửi thông báo lần hai.
- `taoYeuCau` dùng `INSERT … ON CONFLICT DO NOTHING` dựa trên chỉ mục một phần `ux_ycd_dang_cho`; kiểm `changes` để biết có gửi `duyet_moi`
  không. Không `SELECT` rồi `INSERT` (hai request cùng lúc sẽ tạo đôi).
- `quetYeuCau` chạy trên **đường đọc**: không mở `tx` khi không có gì để ghi; nhớ theo request (`nho`) để `myWork` + Tổng quan trong cùng
  request không quét hai lần. Không thêm tiến trình nền/cron.
- Không đổi luật hạn ở `absence.ts` (của PR-MT) và không đổi định nghĩa "chờ nguyên nhân" (của PR-SOS) — chỉ **đọc**.
- Quyền: mọi route hộp gọi `require_(p, REQUEST_APPROVE, { classId, studentId, branchId })` của **thẻ**, không `anyScope`.
- 🛑 Dừng hỏi planning nếu: chỉ mục một phần không tạo được trên Turso (libsql) — **không** tự đổi sang kiểm bằng mã; hoặc số phép kiểm cũ
  phải **xoá** (không sửa được kỳ vọng) > 3.

## Nhật ký

- Mốc B (Task 0): **1444** phép kiểm + 20 tốc độ (check 4 phút 50 giây).
- MT / NHAP / MON đã merge lúc bắt đầu? **Chưa** (origin/main = fb51181, #115 kế hoạch).
- Câu 1 (chủ sản phẩm): **B** (chốt 29/09) — GVCN vẫn tự chuyển lớp; chỉ rút target + lộ trình.
- Dòng thật lệch kế hoạch: Task 0 grep 7 mốc — đều khớp (lệch ≤ 1 dòng).
- Trần tốc độ đổi (cũ → mới): Task 3 — `/my-work` +1 câu (quét), `/tong-quan/quan-ly` 62 → 63: vẫn dưới trần cũ, không đổi. Trần mới: `/yeu-cau?hop=cho-duyet` 10 → 20, `/yeu-cau/dem` 10–11 → 20–21, GVCN 403 7 → 17. Task 4 (hộp có thẻ thật, đo lại): `/yeu-cau?hop=cho-duyet` 18 → trần 28, `da-xu-ly` 11 → 21, `cua-toi` 11–15 → 21–25, `/yeu-cau/dem` 11–15 → 21–25. `/my-work` giảm 2–3 câu (bỏ hai khối việc duyệt), `/tong-quan/quan-ly` 63 → 68 (dưới trần cũ), `/classes` +1.
- `chay-thu:duyet` trên bản sao DB demo:
- Task 1: nhãn `cycle.edit` = "Sửa target, lộ trình học viên" (bỏ "chuyển lớp" — Câu 1 = B). `sapThe(ds)` bỏ tham số `homNay`: hạn là ngày ISO, so chuỗi đã xếp quá hạn lên đầu.
- Task 2: bảng mới vào bao đóng xoá học viên (PR-XOA: 30 bảng, 53 cạnh, thông báo `yeu_cau_duyet`) và cột trỏ tài khoản (`nguoi_xin`, `nguoi_duyet` = dấu vết, 70 cột). Phép kiểm PR-Ra so schema bỏ qua `tasks.assignee_name` (thêm ở bước migrate sau).
- Task 4: sổ đề nghị dời đang chờ (`absence.ts`) nhớ theo request (`nho`) — `listClassSummaries`, `classOverview` tự mở `trongBoNho` (như `listCases`) để phép kiểm N+1 gọi ngoài request vẫn nạp sổ một lần. `lich_thi` có thêm `chet` (đề nghị không còn `pending` — ví dụ modal cũ ở trang lượt thi đã trả lời). Seed gọi `napYeuCauTuNguonCu` ngay ở Task 4 (không đợi Task 11) để hộp demo có thẻ. Bỏ luôn trường `duyet` + nút Duyệt ở dòng việc web (K1-32) vì kiểu dữ liệu đã bỏ ở máy chủ. Phép kiểm "dời lần 2" đặt ở `run.ts` (cạnh helper `absentSkill`).
- Task 5: máy chủ bắt câu hỏi "Cần Quản lý giúp gì" ≥ 8 ký tự (web đã bắt; hai phép kiểm cũ thêm `decisionNote`). Phép kiểm PR-S2 "PA chờ duyệt không điều chỉnh được" dựng PA chờ kiểu cũ bằng SQL (Xin hỗ trợ QL không còn dừng PA). `caseDetail` trả `yeuCau` (thẻ chờ, DTO đủ để nhúng `TheYeuCau`) + `xinYKien` cho từng PA qua `theCuaDoiTuong` (một câu cho cả Case). Nút "+ Thêm PA cho em" trên thẻ Xin ý kiến làm ở Task 8 (web).
- Task 6 (Câu 1 = B): `transferStudent` và `loTrinhTiep.ts` KHÔNG đổi — GVCN vẫn tự chuyển lớp. Câu lỗi: `Target và lộ trình do Quản lý sửa. Bấm "Đề xuất sửa" để gửi Quản lý duyệt.` `updateCycle` chỉ đòi `cycle.edit` khi target/lộ trình THẬT SỰ đổi (panel gửi cả ô không sửa). Panel Lộ trình không có ô lộ trình (chỉ target) → liên kết "Đề xuất sửa" cạnh target. Đường gửi ở `server/src/duyet/deXuatSua.ts`; mục ⋮ chỉ hiện khi em đang học. Duyệt trường lớp/lịch MT/khác bắt ghi chú ≥ 3 ký tự (Q6).
- Task 7: Báo lên lọc ứng viên bằng một câu (Case mở, hạn tín hiệu đã qua, chưa có thẻ) rồi mới dùng `awaitingCauseCaseIds` (định nghĩa "chờ nguyên nhân" của PR-SOS, chỉ đọc). Thẻ Báo lên mang `duLieu.daNhacLuc` (đã nhắc hôm nay) để nút Nhắc hiện "✓ Đã nhắc". Phép kiểm PR-T S04 đổi kỳ vọng phía QL sang `nguoi=tat-ca` (cùng điều kiện) + thêm vế "Của tôi không còn dòng".
- Task 3: thêm chỉ mục `ix_notifications_dedup` (quét quá hạn tra "đã báo chưa" theo `dedup_key`). Giao kèo thêm `nap?` (nạp phần riêng của loại một câu cho cả lô — `moTa` không SQL). Ghi chú khi Duyệt lưu ở `tra_loi`. Hành trình học viên do hàm nguồn của từng loại ghi (không ghi thêm ở lõi — tránh hai dòng). QL tự duyệt → thông báo kind `duyet_tu_duyet` cho Quản trị (đường về hộp).

## Chủ sản phẩm chốt 29/09 (thay các chỗ lệch trong kế hoạch)

- **Câu 1 = B:** GVCN **vẫn tự chuyển lớp** (kể cả sang chi nhánh khác — chốt 24/09, PR-LT). Chỉ rút quyền GVCN tự sửa **target** và **lộ trình** (đi thẻ "Đề xuất sửa thông tin HV" trong Chờ duyệt). Cửa 🛑 ở Task 6: theo B, không rút chuyển lớp.
