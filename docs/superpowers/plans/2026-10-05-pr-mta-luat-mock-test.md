# PR-MTa · Luật Test / Mock Test ở máy chủ (T1, T2, T3, T4, T7, T10, T11) — Kế hoạch (05/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa luật Test/MT mới 05/10 vào **máy chủ + `shared/domain`** để mọi cổng ghi (đặc tả mục 3) cùng một luật: MT cũ theo tuần (T1), dời vượt huỷ kết quả có khôi phục (T2), "-" lần 2 huỷ kỹ năng + Xin dời (T3), Quản lý xếp MT chưa thi vào tuần đã qua (T4), lý do chỉ bắt buộc khi mất kết quả / từ chối (T7), nhận band trực tiếp (T10 máy chủ), chuông GVCN khi người khác dời Test lớp thường (T11), chữ "MT lịch sử" → "MT cũ".

**Architecture:** Luật thuần ở `shared/domain/lichMt.ts` (MT cũ, kiểm tuần, vượt + hệ quả), `shared/domain/thaoTacMt.ts` (lý do theo thao tác, trạng thái `huy-vang`), `shared/domain/chamDiem.ts` (đọc ô L/R, kiểm band). Máy chủ: mọi đường dời lịch đã đi qua `setSkillWeek` / `kiemVuot` (`server/src/fasttrack/skillSchedule.ts`) — sửa ở đó, không vá từng cổng. Điểm bị huỷ do dời vượt **chuyển nguyên dòng sang bảng lưu `ket_qua_huy`** (không xoá: JSON đủ cột + lịch kỹ năng cũ), nên 20 file đang đọc `assessment_scores` (SOS, báo cáo, Phân tích, Xuất Excel, Điểm theo lớp) tự loại điểm đó mà không sửa; khôi phục = chép ngược. Vắng 2 lần = `sit_status='cancelled'` + cờ mới `attempt_skills.huy_vang = 1` (mọi luật "phần thi đã huỷ" giữ nguyên, thêm nhãn và thao tác Xin dời / Không mock lại). Migrate riêng `server/src/migrate/prMta.ts`, chạy lặp được.

**Tech Stack:** TypeScript (`tsc`, import có đuôi `.ts`), Express + SQLite/Turso, React (chỉ sửa tối thiểu cho khỏi gãy); phép kiểm `server/src/tests/prMta.tests.ts` gọi cuối `run.ts`; `npm run check`.

**Spec:** `docs/superpowers/specs/2026-10-05-test-mock-test-design.md` (nguồn chính, ghi đè cột "Thay") · `plan.md` mục 2c (T1–T14) · `thiet-ke/PISA-Rulebook-2026-09-19.md` §20 + khối PR-MT/PR-XLMT (luật đang chạy K2-33, K4-15, K4-28, T34, RB-5) · mockup `thiet-ke/mockup-test-mt-2026-10-05.html` phần 0 (10 cổng), phần 3 (ô "S huỷ", "cũ"), phần 4 (popup dời vượt).

**Phụ thuộc / thứ tự:** chạy **sau khi PR-DL, PR-K26, PR-SL đã merge** (đặc tả mục 4). Nhánh `pr-mta-luat-mock-test` từ `origin/main` mới nhất. Song song được với PR-NV, PR-CHU. PR-MTb và PR-MT0 dựa vào khối **Interfaces chung** dưới đây.

## Chủ sản phẩm chốt 05/10 (sau khi soạn) — ĐÈ lên phần dưới nếu khác
- **T20–T23 (06/10):** xem Task 13 — **T22 đè T7** cho xoá trắng một ô (lý do tuỳ chọn).
- **T19 (06/10) — khung nhập điểm:** xem Task 12. Không ai nhập điểm trước tuần thi; hạn lớp thường = thứ Tư tuần sau như FT; quá hạn vẫn nhập, tính trễ.
- **MT cũ** = MT được **xếp vào tuần đã qua** (cờ `lich_su` tính lúc xếp/dời, như kế hoạch). MT thường đã qua ≥ 2 tuần vẫn là MT thường (quá hạn vẫn quá hạn).
- **T4 áp cả Test lớp thường**: Quản lý / Quản trị xếp / dời về tuần đã qua được, không chặn. GVCN / GV vẫn từ tuần này. (Sửa tự quyết "chỉ áp Mock".)
- **T7 áp MỌI chỗ, kể cả ngoài Test**: bỏ tối thiểu ký tự ở Đề xuất sửa (15), thẻ Chờ duyệt (3), chuyển lớp (3)… Chỗ bắt buộc chỉ cần không trống; chỗ không bắt buộc để tuỳ chọn. Thêm task rà `server/src/duyet/*`, `classes/lenhChuyen.ts`, `transition.ts` và web tương ứng.
- **Xếp hàng loạt dời vượt**: KHÔNG chặn nữa — trả danh sách hệ quả (như một em) để web hiện **một popup gộp** (PR-MTb Q2); lưu khi có xác nhận + lý do.
- Q1 (Huỷ điểm tay): **giữ như 29/09** (xoá có lý do, nhật ký). Nghiệm thu "không xoá điểm" chỉ áp cho đường TỰ ĐỘNG.
- Q2: khôi phục MT2 khi MT1 vẫn sau tuần MT2 → **chặn**, câu ngắn chỉ cách dời MT1 về trước.
- Q3: từ chối "Xin dời" = **không mock lại**; Quản lý có thêm nút "Không mock lại".
- Chữ trên màn ngắn, không câu giải thích dưới nút/ô.

> **Chú ý (05/10 tối):** PR-LT3 (Lịch Test ba khối, plan.md T15–T18) sửa lại `server/src/cham/canCham.ts` (`noTuanTruoc`, `lichTest`) và `web/src/modules/test/lichTest/*`; Task nào chạm các file này phải đối chiếu mã đã merge của LT3 (MT0 merge sau LT3). Khối "Nợ tuần trước" đổi tên thành "Test quá hạn chấm" và chỉ gồm bài quá hạn thật.

## Global Constraints
- Mọi luật ở máy chủ + `shared/domain`; web chỉ sửa tối thiểu để không gãy (Task 10, Task 1 bước web). Không đổi bố cục, phông, màu. Giao diện thật thuộc PR-MTb.
- Ponytail **full** (PR máy chủ). Hai task có chạm web (1, 10): gõ `/ponytail lite` trước khi sửa `web/`, rồi `/ponytail full` lại.
- Không bao giờ bớt: kiểm quyền trước khi đọc/ghi; kiểm dữ liệu nhập (band 0–9 bậc 0.5, lý do bắt buộc đúng 4 trường hợp T7); **không mất điểm** — điểm bị vượt phải nằm trong `ket_qua_huy` TRƯỚC khi rời `assessment_scores`, trong cùng `tx`.
- T7 lý do **bắt buộc chỉ** khi: huỷ điểm (gồm xoá trắng một ô đã có điểm), huỷ lượt, huỷ kết quả do dời vượt, Quản lý từ chối đề nghị. Còn lại tuỳ chọn. **Không còn tối thiểu ký tự** cho lý do Test/MT (bỏ `LY_DO_TOI_THIEU = 5`, bỏ `≥ 3` ở `absence.ts:396`): bắt buộc = khác rỗng sau `trim()`.
- T1: "MT cũ" khi Chủ nhật tuần thi muộn nhất **trước thứ Hai của tuần trước** (cách tuần hiện tại ≥ 2 tuần). Cờ `assessment_attempts.lich_su` vẫn là nơi lưu, tính **lúc xếp / dời** (không suy lại khi đọc). Tên cột, tên hàm giữ `lich_su` / `lichSu` (chỉ chữ trên màn đổi).
- Chữ trên màn: "MT cũ" (nhãn chip: "cũ"). Thời gian dùng mã tuần `W2 OCT`. Chữ ngắn, không câu giải thích (plan.md 1.1).
- Turso: không tham số đặt tên; `UNION` ≤ 20 vế; ≤ 900 tham số (dùng `theoLo`); đọc theo lô, không N+1 — `ketQuaHuyCua(ids)` một câu cho mọi lượt.
- Hàm mới ở `shared/domain/*` re-export qua `shared/domain/index.ts` (các file đã `export *` thì không cần thêm). File mới → `CODE_MAP.md` cùng commit.
- Phép kiểm cũ chỉ được sửa khi nó khẳng định đúng luật bị thay (cột "Thay" của đặc tả): sửa assertion, thêm chú thích `// PR-MTa Tn thay <mã cũ>`; không xoá phép kiểm nào mà không có assertion mới thay.
- Xung đột ở `run.ts`, `schema.sql`, `routes/index.ts`, `migrate.ts`, `CODE_MAP.md`, `plan.md` mục 11: giữ cả hai (chỉ thêm dòng).

## Review Focus
1. **Khôi phục đè điểm mới:** MT2 bị vượt (điểm vào `ket_qua_huy`), sau đó MT2 được xếp lại và nhập điểm mới → Quản lý bấm Khôi phục phải **bị chặn**, không ghi đè. (Task 6, phép kiểm R1.)
2. **Lỗi giữa giao dịch:** dời MT1 vượt MT2 (có điểm) và MT3 (không điểm) — ném lỗi ở bước thứ hai (MT3) thì MT2 vẫn còn nguyên điểm trong `assessment_scores`, `ket_qua_huy` không có dòng mồ côi. (Task 5, phép kiểm V7.)
3. **Writing hai ô:** MT bị vượt có W1 có điểm, W2 trống, S có nhận xét + GV chấm → đếm "huỷ 2 điểm" (theo kỹ năng: W, S), khôi phục trả lại đủ W1, nhận xét, GV chấm, `nhap_dau_ngay`. (Task 5 V3, Task 6 R2.)
4. **"-" lần 2 khi đang có đề nghị dời chờ / ở MT cũ / ở lớp thường:** lớp thường và MT cũ không vào T3; kỹ năng đã có đề nghị chờ không bị huỷ chồng. (Task 7, phép kiểm H5.)
5. **Band nhập bậy:** `6.25`, `9.5`, `-1`, `"b"`, gửi cả `rawScore` lẫn `band`, gửi `band` cùng `criteria` có giá trị → 400; `6.0` / `b6` hợp lệ. (Task 8, phép kiểm B2.)

---

## Interfaces chung (PR-MTb, PR-MT0 dựa vào — giữ đúng tên)

```ts
// shared/domain/lichMt.ts
/** T1: Chủ nhật tuần thi muộn nhất < thứ Hai của tuần trước (tức tuần thi cách tuần hiện tại ≥ 2 tuần). */
export function laMtCu(tuanKetThucMuonNhat: string, homNay: string): boolean;
/** T1/T4 — thay `kiemTuanDaQua`. `quanLy` = người xếp có PLAN_WEEK. Không chặn theo ngày em vào web. */
export function kiemTuanXep(o: { ketThuc: string[]; homNay: string; quanLy: boolean }):
  { cau: string | null; quaTuan: boolean; mtCu: boolean };
//   quaTuan = có kỹ năng ở tuần đã kết thúc (web vẽ một dòng vàng); mtCu = laMtCu(max(ketThuc), homNay)
//   !quanLy && quaTuan → cau = 'Chọn tuần từ tuần này trở đi.'; còn lại cau = null
export type LuotLanCan = { attemptId: number; attemptNo: number; kind: string; tuanDau: string | null; coDiem: boolean; daThi: boolean; huy: boolean };
/** T2 — không còn `chan`: lượt bị vượt có điểm vẫn dời được (hệ quả huỷ kết quả). */
export function luotBiVuot(ds: readonly LuotLanCan[], o: { attemptNo: number; tuanCuoiMoi: string }): { biVuot: LuotLanCan[] };
/** Một lượt sẽ bị vượt — dùng cho popup (mockup phần 4). soDiem = số KỸ NĂNG có điểm (W1/W2 tính một). */
export type LuotSeHuyLich = { attemptId: number; nhan: string; tuan: string; soDiem: number; soCase: number };
export function dongHeQuaVuot(x: LuotSeHuyLich): string;   // 'MT2: huỷ 4 điểm, đóng 1 Case' · 'MT2: huỷ 1 điểm' · 'MT3: bỏ lịch'
export function canLyDoVuot(ds: readonly LuotSeHuyLich[]): boolean;   // some(soDiem > 0) — popup chỉ khi true
/** Trạng thái "kết quả đã huỷ" của một lượt (T2). */
export type KetQuaHuy = { id: number; attemptId: number; luc: string; lyDo: string; nguoi: string | null; soDiem: number; vuotBoi: string | null };

// shared/domain/thaoTacMt.ts
export type ThaoTac = /* cũ */ | 'xin-doi' | 'khong-mock-lai';
export type TrangThaiTT = /* cũ */ | 'huy-vang';
export function trangThaiTT(o: { /* cũ */; huyVang?: boolean }): TrangThaiTT;   // 'huy-vang' xét ngay trước 'da-huy'
//   thaoTacKyNang('huy-vang', q) = { chinh: q.quanLy ? 'khoi-phuc' : q.gvcn ? 'xin-doi' : null, menu: q.quanLy ? ['khong-mock-lai'] : [] }
export type ThaoTacLyDo = ThaoTac | 'huy-luot' | 'huy-ket-qua' | 'tu-choi' | 'thi-lai' | 'huy-lich';
export const LY_DO_BAT_BUOC: readonly ThaoTacLyDo[];   // ['huy-diem', 'huy-luot', 'huy-ket-qua', 'tu-choi']
export function canLyDo(t: ThaoTacLyDo): boolean;      // CHỮ KÝ MỚI — bỏ tham số tuanDaBatDau
export function kiemLyDoThaoTac(t: ThaoTacLyDo, s: string | null | undefined): string | null;   // 'Huỷ điểm: cần ghi lý do.'
export const CHU_LY_DO: Record<ThaoTacLyDo, string>;   // = CHU_THAO_TAC + 'Huỷ lượt' · 'Huỷ kết quả' · 'Từ chối' · 'Thi lại' · 'Huỷ lịch'
// BỎ: LY_DO_TOI_THIEU, kiemLyDo (chamDiem.ts)

// shared/domain/chamDiem.ts (T10)
export type ONhapLR = { raw: number } | { band: number };
export function docONhapLR(s: string): ONhapLR | { loi: string } | null;   // '' → null · '30' → raw · '6.5' '6.0' 'b6' 'B6.5' → band
export function kiemBand(v: unknown): string | null;   // null = hợp lệ: số hữu hạn 0..9, bậc 0.5

// SkillScheduleView (server/src/fasttrack/skillSchedule.ts) thêm: huyVang: boolean · OKyNang (shared/domain/keHoachTest.ts) thêm: huyVang?: boolean
// MoveOutcome.result (absence.ts) thêm: 'huy-vang'
// server/src/fasttrack/skillSchedule.ts
export function kiemVuot(attemptId: number, tuanCuoiMoi: string): { biVuot: LuotSeHuyLich[]; chan: string | null };   // chan chỉ còn "đang có đề nghị dời chờ duyệt"
export function tinhLaiMtCu(attemptId: number, homNay: string): void;   // thay tinhLaiLichSu
// setSkillWeek opts thêm: khongBaoGvcn?: boolean   (giữ huyLichVuot = người dùng đã xác nhận popup)
// server/src/fasttrack/ketQuaHuy.ts (MỚI)
export function huyKetQuaLuot(p: Principal, attemptId: number, o: { lyDo: string; vuotBoi: number }): { soDiem: number; soCase: number };   // gọi trong tx
export function khoiPhucKetQua(p: Principal, attemptId: number, o: { lyDo?: string | null }): { ok: true; soDiem: number };
export function ketQuaHuyCua(attemptIds: readonly number[]): Map<number, KetQuaHuy>;   // bản chưa khôi phục mới nhất mỗi lượt
// server/src/fasttrack/absence.ts
export function xinDoi(p: Principal, attemptId: number, skill: string, o?: { lyDo?: string | null; idempotencyKey?: string | null; today?: string }): MoveOutcome;
export function khongMockLai(p: Principal, attemptId: number, skill: string, lyDo?: string | null): { ok: true };
```
Đường mới: `POST /attempts/:id/skills/:skill/xin-doi` · `POST /attempts/:id/skills/:skill/khong-mock-lai` · `POST /attempts/:id/khoi-phuc-ket-qua`. Trường mới ở dữ liệu đọc: `HangLichMt.luot.ketQuaHuy: KetQuaHuy | null` (`lichMtLoTrinh`), `attemptDetail(...).ketQuaHuy`, mỗi kỹ năng `huyVang`. `PUT /attempts/:id/scores/:skill` nhận thêm `band`.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `superpowers:subagent-driven-development`; ponytail `full` |
| Mỗi task | `superpowers:test-driven-development` (kiểm đỏ trên DB test trước) · `superpowers:verification-before-completion` (`npm run check`, một lần một lúc) |
| Lỗi lạ | `superpowers:systematic-debugging` |
| Task 1 bước web, Task 10 | `/ponytail lite` khi sửa `web/`; `/impeccable audit` chỉ cho `HopXacNhanHuyLich.tsx` trước khi mở PR |
| Cuối PR | `/ponytail-review` · `superpowers:requesting-code-review` · `superpowers:finishing-a-development-branch` (mở PR, không merge) |

---

### Task 0: Khảo sát sau khi DL/K26/SL merge
**Kết quả khảo sát 06/10 (main `5b6410a9`, sau DL #206, SL #203, CHU #202, NV #205, BN #207) — chỗ lệch so với kế hoạch:**
1. Số dòng khớp kế hoạch: `thaoTacMt.ts:55,61`, `chamDiem.ts:124-131`, `skillSchedule.ts:609,621,745,768,880,965` (`kiemVuot` 564, `boTuanLuot` 616, `tinhLaiLichSu` 660, `setSkillWeek` 714), `attempts.ts:1057,1087,1201,1630` (`setPlanningWeek` 1120, `heQuaHuyLuot` 1220, `refreshOutcome` 1374), `absence.ts:178,396,849`, `keHoachTest.ts:440,456,544,575,656-657,924,1021-1022`, `classes/schedule.ts:184,205,267`, `intake.ts:315,317`.
2. Lệch: `regular.ts` kiểm lý do sửa điểm ở **:535** (không phải 527-532), báo vắng **:609** (không phải 604). `attempts.ts:1244` `huyLuot` tự kiểm `!lyDo` (không qua `kiemLyDoThaoTac`).
3. **Mới (PR-SL):** `classes/suaCaLop.ts:192` + `web/.../SuaCaLopPanel.tsx:105` dùng `LY_DO_TOI_THIEU` (lý do đổi Target ≥ 5) → theo chốt T7 "mọi chỗ": bắt buộc, chỉ cần không trống.
4. Chỗ lý do ngoài Test (chốt T7 05/10 — bỏ tối thiểu, bắt buộc = không trống): `duyet/deXuatSua.ts:19,41` (15), `duyet/yeuCau.ts:26,425,437` (3), `classes/lenhChuyen.ts:234` (3), `:545` (15 = `NHAN_XET_TOI_THIEU`), `routes/index.ts:1746` (3), `shared/domain/chuyenLop.ts:34,80` (`LY_DO_LENH_TOI_THIEU` 3), `cases/cases.ts:2859,2886` (lý do 8), `normal/cuoiKhoa.ts:473` (sửa Mini Test 8), `worklist/mgmttasks.ts:680` (dời hạn 2); web: `DeXuatSuaPanel.tsx:18,38`, `TheYeuCau.tsx:22,105,132`, `TransitionPanel.tsx:486`, `ChuyenLopPanel.tsx:93,97,131,173`, `CapNhatTuan.tsx:116,119`, `MgmtTasksPage.tsx:544`. Không đổi (không phải "lý do"): mô tả / kết luận / nhận xét bàn giao / kế hoạch Case, "Cần Quản lý giúp gì".
5. Chữ "MT lịch sử" còn ở chỗ kế hoạch chưa liệt kê: `shared/domain/hanhTrinh.ts:393` (`MT2 lịch sử`), `shared/domain/xuatMt.ts:215` (Excel "lịch sử"), `worklist/mywork.ts:207` (hint), `:927-928`, `web/.../cham/DiemTheoLop.tsx:173,210`, `test/LichTestTab.tsx:324-325` (không còn ở :332), `ui/Nhan.tsx:46`.
6. NV: bảng `NHOM_CUA_TIEN_TO` ở `worklist/nhacViec.ts:31` — MTa không thêm khoá dòng `myWork` mới (chuông `huy_vang`, `doi_lich_thuong` không phải việc) → không cần thêm. `duyet/yeuCau.ts` (NV sửa `nhacNhieu` :477) chỉ đổi `DO_DAI_LY_DO`. `LichTestTab.tsx` (NV thêm `useChiNhanhMacDinh` :58) chỉ đổi chữ :324-325.
7. Chốt 05/10 đè kế hoạch: T4 áp cả Test lớp thường (bỏ G4, C5 đổi: QL dời về tuần đã qua được, GVCN/GV vẫn chặn); xếp hàng loạt dời vượt KHÔNG chặn (bỏ G10, V10 đổi: dòng kèm `seHuyLich`, lưu khi có `xacNhanHuyLich` + lý do).
8. Lớp thường không có cờ "MT cũ": Test lớp thường QL dời về tuần đã qua vẫn là bài thường (có hạn) — "MT cũ" chỉ cho Mock (T1 nói "MT").

**Files:** chỉ đọc.
- [x] `git fetch && git merge origin/main` (nhánh mới từ main đã có DL, K26, SL). Chạy `npm run check` một lần → ghi số phép kiểm đạt làm mốc.
- [x] Chạy lại các grep dưới (Task 1, 2, 3) trên main mới — số dòng có thể lệch so với kế hoạch (ghi số dòng thật vào commit đầu). PR-SL đã thêm `cauMtSeDoi` vào `lichMt.ts` sau `CO_DIEM_SQL`; PR-DL đã thêm `ChonLuotFT` vào `attempts.ts:~1728` và chữ "MT lịch sử" trong `web/src/modules/cham/DiemTheoLop.tsx` — Task 3 đổi luôn.
- [x] Không commit gì ở task này.

### Task 1: T7 — lý do theo thao tác (bỏ tối thiểu ký tự)
Skill: test-driven-development

**Files:**
- Modify: `shared/domain/thaoTacMt.ts:54-65` (`canLyDo`, `kiemLyDoThaoTac`, thêm `ThaoTacLyDo`, `LY_DO_BAT_BUOC`, `CHU_LY_DO`), `shared/domain/chamDiem.ts:123-131` (xoá `LY_DO_TOI_THIEU`, `kiemLyDo`)
- Modify (máy chủ — MỌI chỗ gọi, rà bằng `grep -rn "LY_DO_TOI_THIEU\|kiemLyDo\|kiemLyDoThaoTac\|canLyDo" server/src shared`):
  | Chỗ | Thao tác | Sau T7 |
  |---|---|---|
  | `skillSchedule.ts:609` `lyDoHuyVuot` | lý do ghi cho lượt bị vượt | `lyDo?.trim() \|\| câu mặc định` (bỏ so 5 ký tự) |
  | `skillSchedule.ts:621` `boTuanLuot` | Huỷ lịch | `'huy-lich'` tuỳ chọn; `lyDo` trống → `'Huỷ lịch'` ghi nhật ký |
  | `skillSchedule.ts:745` MT cũ đổi tuần | dời lịch | bỏ kiểm |
  | `skillSchedule.ts:766-770` K4-15 | dời lịch tuần đã bắt đầu | bỏ kiểm |
  | `skillSchedule.ts:880` `setSkillScope` | bỏ kỹ năng | bỏ kiểm |
  | `skillSchedule.ts:965`, `attempts.ts:1201` | dời hạn chấm | bỏ kiểm |
  | `attempts.ts:1245` `huyLuot` | huỷ lượt | `kiemLyDoThaoTac('huy-luot', …)` (vẫn bắt buộc) |
  | `attempts.ts:1624-1633` `saveScore` RB-5 | sửa điểm | đổi giá trị → tuỳ chọn; ô có điểm thành **trống hết** (raw, 4 tiêu chí, band đều null) → `kiemLyDoThaoTac('huy-diem', patch.lyDo)` |
  | `regular.ts:527-532` `saveRegularScore` | sửa điểm lớp thường | như trên: đổi → tuỳ chọn; xoá điểm (`score` null khi đã có) → bắt buộc |
  | `regular.ts:604` | báo vắng lớp thường | bỏ kiểm |
  | `absence.ts:849` `baoVang` | báo vắng | bỏ kiểm; `lyDo` trống → `'Báo vắng'` |
  | `absence.ts:396` `decideAbsenceMove` | từ chối | `kiemLyDoThaoTac('tu-choi', note)` (khác rỗng, bỏ ≥ 3) |
  | `keHoachTest.ts:544`, `:1021-1024` | thi lại | tuỳ chọn; `lyDo` ghi = `Thi lại: …` hoặc `'Thi lại'` |
  | `keHoachTest.ts:575` `huyDiem` | huỷ điểm | `kiemLyDoThaoTac('huy-diem', …)` (bắt buộc) |
  | `keHoachTest.ts:420-479` `canLyDo` trong `kiemDotNoi`, `DongHangLoat.canLyDo` | — | luôn `false` (giữ trường để web không gãy; PR-MTb bỏ) |
  Không đụng (ngoài phạm vi Test, ghi vào mô tả PR): `duyet/deXuatSua.ts:19` (15 ký tự), `duyet/yeuCau.ts:26` (`DO_DAI_LY_DO = 3` cho mọi thẻ Chờ duyệt), `classes/lenhChuyen.ts:234`, `routes/index.ts:1709`.
- Modify (web, `/ponytail lite`, chỉ để typecheck xanh, không đổi bố cục): `web/src/modules/fasttrack/HopThaoTacMt.tsx:11,72,79,193`, `MockDetailPage.tsx:29,162,622-623,682-683,709,744`, `web/src/modules/students/HangLichMt.tsx:14,142,159`, `web/src/modules/test/keHoach/HopKyNang.tsx:8,141-147,246-250`, `NganXepLichMt.tsx:12,161-164,319-321`, `web/src/modules/fasttrack/ScoreEntry.tsx:14,660-663,786` — thay `LY_DO_TOI_THIEU`/`kiemLyDo` bằng `canLyDo(t)` + `kiemLyDoThaoTac(t, s)`; ô lý do của thao tác tuỳ chọn hiện nhãn "(tuỳ chọn)" như mẫu `Truong tuyChon` sẵn có, bỏ bộ đếm `x/5`.
- Create: `server/src/tests/prMta.tests.ts`; Modify: cuối `server/src/tests/run.ts` (trước khối in tổng kết): `const { runPrMtaTests } = await import('./prMta.tests.ts'); await runPrMtaTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });`

**Interfaces:** Produces `ThaoTacLyDo`, `LY_DO_BAT_BUOC`, `canLyDo(t)`, `kiemLyDoThaoTac(t, s)`, `CHU_LY_DO` (khối Interfaces chung).

- [x] **Bước 1 — kiểm đỏ (thuần):**
```ts
check('MTa T7 (L1) · chỉ 4 thao tác bắt buộc lý do, không tối thiểu ký tự', () => {
  for (const t of ['huy-diem', 'huy-luot', 'huy-ket-qua', 'tu-choi'] as const) {
    assert(d.canLyDo(t) && d.kiemLyDoThaoTac(t, '  ') === `${d.CHU_LY_DO[t]}: cần ghi lý do.`, t);
    assert(d.kiemLyDoThaoTac(t, 'x') === null, `${t}: 1 ký tự phải hợp lệ`);
  }
  for (const t of ['doi-lich', 'doi-han', 'bo-ky-nang', 'bao-vang', 'thi-lai', 'sua-diem', 'huy-lich', 'xin-doi', 'khong-mock-lai'] as const)
    assert(!d.canLyDo(t) && d.kiemLyDoThaoTac(t, '') === null, t);
  assert(!('LY_DO_TOI_THIEU' in d) && !('kiemLyDo' in d), 'còn hằng/hàm cũ');
});
```
- [x] **Bước 2 — kiểm đỏ (DB, mỗi cổng một phép):** em mới MB FT 101 (mẫu `emMoi` của `prLm.tests.ts:115`), Quản lý `P.mbManager`:
  - L2 dời một kỹ năng mà tuần thi đã bắt đầu, `reason` trống → lưu được, `attempt_schedule_history.reason IS NULL`.
  - L3 `setSkillDeadline` / `setDeadlineOverride` có ngày, không lý do → lưu; `setSkillSkip` không lý do → lưu; `baoVang(..., '')` → lưu, nhật ký `Báo vắng`.
  - L4 `saveScore` đổi band 6 → 7 không `lyDo` → lưu; xoá trắng ô đó không `lyDo` → 400 `/Huỷ điểm: cần ghi lý do/`; có `lyDo:'x'` → lưu.
  - L5 `saveRegularScore` (lớp thường mẫu `prU12.tests.ts`) đổi 7/10 → 8/10 không lý do → lưu; xoá → 400.
  - L6 `huyDiem` lý do `'  '` → 400; `'x'` → huỷ. `huyLuot` lý do trống → 400.
  - L7 `decideAbsenceMove(..., { approve:false, note:'x' })` → được (trước đây cần ≥ 3).
  - L8 `thiLai` không lý do → lưu, nhật ký điểm có `lyDo` bắt đầu `Thi lại`. `xepHangLoat` dời bài tuần đã bắt đầu không `lyDo` → `daLuu` tăng.
- [x] **Bước 3:** `npm run check` → đỏ đúng các phép trên. Sửa shared → máy chủ → web theo bảng. Phép kiểm cũ khẳng định "≥ 5 ký tự" / "cần ghi lý do" cho thao tác nay tuỳ chọn (`grep -rn "ít nhất 5\|ít nhất 3\|cần ghi lý do" server/src/tests`, gồm `prXlmt`, `prLm (2.8), (2.10)`, `prHsm`) → sửa theo Global Constraints.
- [x] **Bước 4:** `npm run check` xanh.
- [x] **Bước 5:** commit `feat(mta): T7 lý do chỉ bắt buộc khi mất kết quả hoặc từ chối, bỏ tối thiểu ký tự`.

### Task 2: T1 MT cũ theo tuần + T4 Quản lý xếp MT chưa thi vào tuần đã qua
Skill: test-driven-development

**Files:**
- Modify: `shared/domain/lichMt.ts:33-36` (giữ `laLichSu` = "tuần đã kết thúc trước ngày" cho chỗ không phân loại), thêm `laMtCu`; thay `kiemTuanDaQua` (`:69-83`) bằng `kiemTuanXep` (xoá hàm cũ).
- Modify (mọi chỗ PHÂN LOẠI lượt — đổi sang `laMtCu(maxKetThuc, homNay)`):
  | Chỗ | Sau |
  |---|---|
  | `attempts.ts:1057` `createAttempt`, `:1087` `hoiSinhLuot` | `laMtCu(period.week_end, demoToday())` |
  | `skillSchedule.ts:659-670` `tinhLaiLichSu` | đổi thành `tinhLaiMtCu(attemptId, homNay)`: `lich_su = laMtCu(MAX(week_end) kỹ năng bắt buộc chưa huỷ, homNay)` — so với **ngày dời**, không với `created_at` |
  | `skillSchedule.ts:742-771` `setSkillWeek` | bỏ nhánh `kiemTuanDaQua`/"em vào web"; tuần đích đã qua: `attempt.kind==='mock' && can(p, PLAN_WEEK)` → cho; còn lại (lớp thường, GV) → giữ câu chặn cũ `'Không dời vào tuần đã qua — chọn tuần từ tuần này trở đi.'`. Sau khi ghi: lượt mock → **luôn** `tinhLaiMtCu(attemptId, homNay)` (không chỉ khi đang `lich_su`) |
  | `classes/schedule.ts:184` (lượt mặc định mới), `:205` (lượt auto dời theo tuần bắt đầu) | `laMtCu(addDays(s.weekStart, 6), ngayTao)` · `tinhLaiMtCu(had.id, ngayTao)` |
  | `classes/intake.ts:315` (báo trước "n MT sẽ là MT cũ") | `laMtCu` |
  | `keHoachTest.ts:440, 456` `kiemDotNoi` | `kiemTuanXep({ ketThuc:[pr.week_end], homNay, quanLy: can(p, PLAN_WEEK) })` — truyền `quanLy` qua `pre`; bỏ `vaoWeb` |
  | `keHoachTest.ts:656-658` `xepMoi` | `kiemTuanXep` (QL), bỏ `vaoWeb`; sau tạo + đặt tuần từng kỹ năng: `tinhLaiMtCu(created.id, demoToday())` (lượt trộn tuần qua/tới phân loại theo tuần muộn nhất) |
  | `keHoachTest.ts:896, 924, 941, 998-1010` `xetMotEmFT`/`xepHangLoat` | bỏ `ngayVaoWeb`; thi lại vào tuần đã qua giữ chặn (thi lại = thi thật, cần tuần tới) |
  Giữ `laLichSu` ở `mtDaThiChuaQua` (`lichMt.ts:86-89`) — đó là "tuần đã qua", không phân loại.
- Test: `prMta.tests.ts`

**Interfaces:** Produces `laMtCu`, `kiemTuanXep`, `tinhLaiMtCu` (khối chung). Consumes Task 1 (không còn lý do khi dời).

- [x] **Bước 1 — kiểm đỏ (thuần):** `homNay = '2026-09-16'` (thứ Tư, tuần 14/09):
```ts
check('MTa T1 (C1) · laMtCu: tuần trước là MT thường, cách ≥ 2 tuần là MT cũ', () => {
  assert(!d.laMtCu('2026-09-13', '2026-09-16'), 'tuần trước (kết thúc 13/09) phải là MT thường');
  assert(d.laMtCu('2026-09-06', '2026-09-16'), 'kết thúc 06/09 phải là MT cũ');
  assert(!d.laMtCu('2026-09-20', '2026-09-16'), 'tuần này');
});
check('MTa T4 (C2) · kiemTuanXep: QL được tuần đã qua, GV không; không còn điều kiện ngày vào web', () => {
  const qua = d.kiemTuanXep({ ketThuc: ['2026-09-06'], homNay: '2026-09-16', quanLy: true });
  assert(qua.cau === null && qua.quaTuan && qua.mtCu, JSON.stringify(qua));
  const tron = d.kiemTuanXep({ ketThuc: ['2026-09-13', '2026-09-27'], homNay: '2026-09-16', quanLy: true });
  assert(tron.cau === null && tron.quaTuan && !tron.mtCu, JSON.stringify(tron));
  assert(d.kiemTuanXep({ ketThuc: ['2026-09-13'], homNay: '2026-09-16', quanLy: false }).cau === 'Chọn tuần từ tuần này trở đi.', 'GV');
  assert(!('kiemTuanDaQua' in d), 'còn hàm cũ');
});
```
- [x] **Bước 2 — kiểm đỏ (DB, theo cổng):**
  - C3 Xếp lịch MT (`keHoach.xepMoi`, QL): em vào web hôm nay, MT mới ở `tuan(-1)` → `lich_su = 0` (có hạn chấm: `viewSkill` có `deadline`); ở `tuan(-3)` → `lich_su = 1`, không cần `created_at` của em lùi.
  - C4 hộp kỹ năng (`luuDot`) và Dời cả đợt (`setPlanningWeek`): MT2 chưa thi ở `tuan(4)` → QL dời sang `tuan(-3)` → lưu, `lich_su = 1`; dời lại sang `tuan(2)` → `lich_su = 0`.
  - C5 `setSkillWeek` lớp thường về tuần đã qua (QL lẫn GVCN) → vẫn 400 câu cũ.
  - C6 `xepHangLoat` FT, `tuan(-1)` cho em chưa có MT → dòng `hanhDong:'tao'`, `lichSu:false`; `tuan(-3)` → `lichSu:true`.
  - C7 Thêm HV / Áp lịch gợi ý (`intake.commitIntake`, `startWeek` = 7 tuần trước): MT1 tuần học 6 = tuần trước → `lich_su = 0`; lùi 13 tuần → MT1, MT2 `lich_su = 1` (`apLichMacDinhLo`).
  - C8 MT cũ đã có điểm dời sang tuần đã qua khác (D3 cũ) **không lý do**, em vào web từ trước tuần đó → lưu (bỏ câu "Em đã có trên web từ trước tuần này").
- [x] **Bước 3:** đỏ → sửa → xanh. Phép kiểm cũ khẳng định K2-33/T34/"ngày vào web" (`grep -rn "Không dời vào tuần đã qua\|Em đã có trên web\|Tuần đã qua chỉ dùng\|kiemTuanDaQua\|laLichSu" server/src/tests` — `prLm (2.8) (2.9)`, `prXlmt`, `prMt`) → sửa theo Global Constraints (MT đang chạy QL dời về tuần qua nay **được**).
- [x] **Bước 4:** commit `feat(mta): T1 MT cũ theo tuần (≥ 2 tuần), T4 Quản lý xếp MT chưa thi vào tuần đã qua`.

### Task 3: Chữ "MT lịch sử" → "MT cũ" mọi nơi
Skill: test-driven-development

**Files:** chuỗi hiện trên màn / thông báo / câu lỗi / Excel (KHÔNG đổi chú thích, tên biến, cột DB, chữ "Lịch sử" nghĩa nhật ký thay đổi). Danh sách đã thấy trên main 05/10:
`server/src/classes/intake.ts:317` · `classes/schedule.ts:267` · `fasttrack/absence.ts:220,389,848` · `fasttrack/attempts.ts:1431` · `fasttrack/skillSchedule.ts:745` (đã bỏ ở Task 1) · `worklist/mywork.ts:919-920` · `migrate/prMt.ts:11` (giữ — chữ lịch sử của bước migrate cũ) · `shared/domain/keHoachTest.ts:244,275` · `shared/domain/lichMt.ts:77,80` (bỏ cùng `kiemTuanDaQua`) · `shared/domain/nhatKy.ts:41` ('Nhập điểm MT cũ') · `web/src/modules/fasttrack/MockDetailPage.tsx:689` (bỏ vế "phải trước ngày em vào web") · `web/src/ui/Nhan.tsx:41-48` (chip "cũ", `title` "MT cũ — nhập bù, không tính hạn") · `web/src/modules/students/ClassRoster.tsx:320` · `IntakePanel.tsx:39,157,258` · `StudentPlanPanel.tsx:191` · `test/keHoach/HopKyNang.tsx:254` · `NganXepLichMt.tsx:377` (" · cũ") · `test/LichTestTab.tsx:332` · `platform/WelcomePage.tsx:328-329` · `web/src/modules/cham/DiemTheoLop.tsx` (PR-DL). Rà lại bằng
`grep -rnE "lịch sử" server/src shared web/src --include=*.ts --include=*.tsx | grep -v "/tests/" | grep -vE "^\S+:\s*(\*|//|/\*)"` và đọc từng dòng.
- [x] **Bước 1 — kiểm đỏ:** `MTa (C9)` — đọc nguồn bằng `fs` (mẫu `prLm.tests.ts:6-8`) cho 6 file web trên + gọi hàm thật: `d.chuSeXep({ hanhDong:'tao', lichSu:true, … }, null)` (`shared/domain/keHoachTest.ts:~268`) chứa `· MT cũ`; `d.nhanHanhDongNhatKy('score.lich_su') === 'Nhập điểm MT cũ'`; câu lỗi `saveScore` noShow ở MT cũ khớp `/MT cũ không nhận dấu "-"/`. Không chuỗi nào còn `/MT lịch sử/` trong `web/src` (trừ chú thích).
- [x] **Bước 2:** sửa; phép kiểm cũ khớp chữ "MT lịch sử" (`grep -rln "MT lịch sử" server/src/tests` — 53 chỗ) → đổi chữ trong assertion, không đổi ý.
- [x] **Bước 3:** commit `chore(mta): chữ "MT lịch sử" → "MT cũ" trên màn, thông báo, câu lỗi`.

### Task 4: Migrate `prMta` (cấu trúc, chạy lặp được)
Skill: test-driven-development

**Files:** Create `server/src/migrate/prMta.ts`; Modify `server/src/migrate.ts` (gọi `migratePrMta(conn, applied)` cuối danh sách, sau `migratePrPhh` / `migratePrK26`), `server/src/schema.sql` (thêm CUỐI file cùng định nghĩa), `CODE_MAP.md`.
```sql
ALTER TABLE attempt_skills ADD COLUMN huy_vang INTEGER NOT NULL DEFAULT 0;   -- T3: 1 = phần thi huỷ vì vắng lần 2 (sit_status = 'cancelled')
CREATE TABLE ket_qua_huy (                       -- T2: điểm của MT bị dời vượt — CHUYỂN sang đây, không xoá
  id INTEGER PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id),
  vuot_boi_attempt_id INTEGER REFERENCES assessment_attempts(id),
  diem_json TEXT NOT NULL,                       -- mảng NGUYÊN dòng assessment_scores (mọi cột, kể cả comment, examiner_*, nhap_dau_ngay)
  lich_json TEXT NOT NULL,                       -- [{ skill, planned_period_id, sit_status, plan_source }] kỹ năng bắt buộc trước khi bỏ lịch
  so_diem INTEGER NOT NULL,                      -- số KỸ NĂNG có điểm (W1/W2 tính một)
  ly_do TEXT NOT NULL,
  huy_boi INTEGER REFERENCES users(id), huy_luc TEXT NOT NULL,
  khoi_phuc_boi INTEGER REFERENCES users(id), khoi_phuc_luc TEXT, ly_do_khoi_phuc TEXT
);
CREATE INDEX idx_ket_qua_huy_attempt ON ket_qua_huy(attempt_id);
```
Mẫu kiểm có cột / có bảng: `migrate/prPhh.ts:6` (`pragma_table_info`), `migrate/prCt.ts:5` (`sqlite_master`). **Không điền ngược**: cờ `lich_su` cũ giữ nguyên (không ai bị tính nợ ngược); đề nghị dời lần 2 đang chờ giữ nguyên (QL vẫn duyệt / từ chối như cũ). Thêm `'ket_qua_huy'` vào `SYSTEM_CLOSE_REASONS` + nhãn `'Kết quả MT đã huỷ'` (`shared/domain/cases.ts:564-572`; cột TEXT, không CHECK).
- [x] Kiểm đỏ `MTa (M1)`: gọi `migratePrMta` hai lần trên DB test → lần hai không thêm dòng `applied`; `pragma_table_info('attempt_skills')` có `huy_vang`; `sqlite_master` có `ket_qua_huy`.
- [x] Xanh → commit `feat(mta): migrate prMta — cờ huy_vang, bảng ket_qua_huy`.

### Task 5: T2 — dời vượt: lượt bị vượt có điểm → huỷ kết quả (lưu, không xoá), Case tự đóng
Skill: test-driven-development

**Files:**
- Modify `shared/domain/lichMt.ts:130-148` (`luotBiVuot` bỏ `chan`; thêm `LuotSeHuyLich`, `dongHeQuaVuot`, `canLyDoVuot`, `KetQuaHuy`); `cauSeHuyLich` giữ (dòng vàng khi không điểm).
- Modify `server/src/fasttrack/skillSchedule.ts`: xoá `type LuotSeHuyLich` (`:556`, dùng bản shared); `kiemVuot` (`:564-590`) trả thêm `soDiem` (một câu `GROUP BY attempt_id` trên `assessment_scores`, `writing1/writing2 → writing`) và `soCase` (`caseSinhRieng(id).length`); `chan` chỉ còn đề nghị dời chờ. `setSkillWeek` (`:773-777`, `:805-809`): có lượt bị vượt `soDiem > 0` → thiếu `huyLichVuot` → 409 `canXacNhanHuyLich` (giữ `details.seHuyLich`, nay kèm `soDiem/soCase`); thiếu lý do → `kiemLyDoThaoTac('huy-ket-qua', opts.reason)` 400. **Không điểm → không 409**, bỏ lịch luôn. Trong `tx`: **mọi** lượt bị vượt → `huyKetQuaLuot` TRƯỚC `boTuanLuot` (lượt không điểm: chỉ trả `sat` → `scheduled`, G7). `boTuanLuot` (`:616-648`) giữ chặn có điểm / đã thi khi gọi thẳng (nút Huỷ lịch).
- Modify `server/src/fasttrack/attempts.ts`: `setPlanningWeek` (`:1141-1144`) cùng luật; tách `export function caseSinhRieng(attemptId: number): number[]` khỏi `heQuaHuyLuot` (`:1226-1231`, giữ nguyên câu SQL); `export` cho `refreshOutcome` (`:1374`, chỉ thêm từ khoá).
- Modify `server/src/keHoach/keHoachTest.ts`: `kiemDotNoi` (`:463-479`) không còn chặn lượt bị vượt có điểm; `luuDot` (`:518`, `:523`) cùng luật `setSkillWeek`. `xepHangLoat`: **giữ chặn** vượt (dòng đỏ qua `checkWeekVsNeighbours`) — không huỷ kết quả hàng loạt.
- Create `server/src/fasttrack/ketQuaHuy.ts`; `CODE_MAP.md`.

**Interfaces:** `huyKetQuaLuot(p, attemptId, { lyDo, vuotBoi }): { soDiem; soCase }` — gọi TRONG `tx` của nơi gọi: (1) đọc mọi dòng `assessment_scores` của lượt có `band` hoặc `raw_score` khác NULL; không có → chỉ làm bước (4), trả `{0,0}`; (2) `INSERT ket_qua_huy` (nguyên dòng + lịch kỹ năng bắt buộc); (3) `DELETE FROM assessment_scores WHERE id IN (các dòng vừa lưu)` — dòng chỉ có dấu "-" / nhận xét không điểm giữ nguyên; (4) kỹ năng `sit_status='sat'` → `'scheduled'`; (5) `writeAudit` `score.huy_vuot` mỗi ô (`before` = dòng, `after` = `{ lyDo, vuotBoi }`); (6) `closeCasesBySystem({ reason: 'ket_qua_huy', caseIds: caseSinhRieng(attemptId), … })` + Phối hợp `pending` của lượt → `removed`, `remove_reason_code = 'system_ket_qua_huy'` (mẫu `attempts.ts:1265-1267`); (7) `refreshOutcome(p, attemptId)` (lượt về `planned`, tín hiệu rút qua nhánh `cleared` của `reconcileCorrectedScores`). Lý do ghi: `lyDoHuyVuot(...)`.

- [x] **Bước 1 — kiểm đỏ (thuần):**
```ts
check('MTa T2 (V1) · luotBiVuot không chặn lượt có điểm; dòng hệ quả theo mockup phần 4', () => {
  const r = d.luotBiVuot([L(2, '2026-07-13', { coDiem: true }), L(3, '2026-08-10')], { attemptNo: 1, tuanCuoiMoi: '2026-08-17' });
  assert(!('chan' in r) && r.biVuot.map((x) => x.attemptNo).join() === '2,3', JSON.stringify(r));
  const x2 = { attemptId: 2, nhan: 'MT2', tuan: '2026-07-13', soDiem: 4, soCase: 1 };
  const x3 = { attemptId: 3, nhan: 'MT3', tuan: '2026-08-10', soDiem: 0, soCase: 0 };
  assert(d.dongHeQuaVuot(x2) === 'MT2: huỷ 4 điểm, đóng 1 Case', d.dongHeQuaVuot(x2));
  assert(d.dongHeQuaVuot({ ...x2, soCase: 0 }) === 'MT2: huỷ 4 điểm', 'không Case');
  assert(d.dongHeQuaVuot(x3) === 'MT3: bỏ lịch', d.dongHeQuaVuot(x3));
  assert(d.canLyDoVuot([x2, x3]) && !d.canLyDoVuot([x3]), 'canLyDoVuot');
});
```
(`L` = helper của `prLm.tests.ts:14`.)
- [x] **Bước 2 — kiểm đỏ (DB, theo cổng):** `emMoi()` (MT1 T+1, MT2 T+4, MT3 T+8) và `diem()` như `prLm.tests.ts:115-132`.
  - V2 `kiemDot` (hộp kỹ năng Kế hoạch Test + panel Lộ trình): MT2 có L, R → `seHuyLich[0]` = `{ nhan: 'MT2', soDiem: 2, soCase: 0 }`, không `bai` nào `chan`.
  - V3 `luuDot` dời MT1 sang T+9: thiếu xác nhận → 409 (`details.seHuyLich`: MT2 `soDiem 2`, MT3 `soDiem 0`); xác nhận, `reason` trống → 400 `/Huỷ kết quả: cần ghi lý do/`, DB không đổi; xác nhận + `reason: 'x'` → MT1 ở T+9; MT2: không còn dòng điểm trong `assessment_scores`, `ket_qua_huy` đúng 1 dòng (`so_diem` 2, `diem_json` giữ `band`, `comment`, `examiner_name`, `nhap_dau_ngay`), kỹ năng bắt buộc `planned_period_id NULL`, `status = 'planned'`; MT3 bỏ lịch, không dòng `ket_qua_huy`; nhật ký `score.huy_vuot` 2 dòng. Biến thể: W1 có điểm, W2 trống, S chỉ nhận xét → `soDiem = 1`; dòng S (không điểm) giữ nguyên tại chỗ.
  - V4 không điểm: `luuDot` / `setSkillWeek` / `setPlanningWeek` dời MT1 vượt MT2 chưa điểm, KHÔNG `xacNhanHuyLich` → lưu, MT2 bỏ lịch (thay `prLm (2.2) (2.6) (2.6b)`).
  - V5 Case: MT2 có điểm dưới kỳ vọng → Case SOS sinh (mẫu dựng ở `prSos.tests.ts`) → sau dời vượt có lý do: Case `status = 'done'`, `system_close_reason = 'ket_qua_huy'`, PA `planned` → `cancelled`; Case có mốc từ lượt khác **không** đóng.
  - V6 loại khỏi số liệu (cổng chỉ hiển thị): sau V3 → `duLieuXuatMt(QL, …)` không có điểm MT2 của em; `standingFor([sid])` không lấy MT2; `classScoreSheet(QL, LOP, { theo: 'luot', attemptNo: 2 })` ô của em trống.
  - V7 lỗi giữa chừng: `assertThrows(() => tx(() => { huyKetQuaLuot(QL, m2, { lyDo: 'x', vuotBoi: m1 }); throw new Error('giả lỗi'); }), /giả lỗi/, …)` → điểm MT2 còn nguyên, `ket_qua_huy` không thêm dòng (Review Focus 2).
  - V8 `setPlanningWeek` và `setSkillWeek` (hồ sơ Mock: Dời cả đợt / một kỹ năng) cùng ba nhánh 409 / 400 / lưu như V3.
  - V9 MT2 đang có đề nghị dời chờ → vẫn 400 `/đang có đề nghị dời chờ duyệt/`.
  - V10 `xepHangLoat` FT dời MT1 vượt MT2 có điểm → dòng `hanhDong: 'loi'`, `ket_qua_huy` không thêm.
- [x] **Bước 3:** đỏ → sửa → xanh. Thay `prLm (1)` (chặn có điểm) và `(2.5)` theo V1 / V3.
- [x] **Bước 4:** commit `feat(mta): T2 dời vượt huỷ kết quả MT sau (lưu ket_qua_huy, đóng Case), không hỏi khi chưa có điểm`.

### Task 6: T2 — Quản lý khôi phục kết quả + trạng thái "đã huỷ" cho màn đọc
Skill: test-driven-development

**Files:** `server/src/fasttrack/ketQuaHuy.ts` (thêm `khoiPhucKetQua`, `ketQuaHuyCua`); `server/src/routes/index.ts` (cạnh `/attempts/:id/bo-tuan` `:618-622`: `POST /attempts/:id/khoi-phuc-ket-qua` `{ lyDo? }`, có `maybeSimulateSaveFailure()`); `server/src/keHoach/keHoachTest.ts:341-393` (`LuotLichMt.ketQuaHuy: KetQuaHuy | null`, gọi `ketQuaHuyCua(ids)` một lần); `server/src/fasttrack/attempts.ts:864` `attemptDetail` (`ketQuaHuy`), `:817-862` `scoreHistoryOf` (thêm `score.huy_vuot` → `kind: 'override'`, `after: 'Huỷ do dời vượt'`; `score.khoi_phuc` → `kind: 'override'`, `before: 'Đã huỷ'`; `lyDo` từ `after.lyDo`) — không thêm `kind` mới để web khỏi đổi.

**Interfaces:**
- `khoiPhucKetQua(p, attemptId, { lyDo? })`: `require_(PLAN_WEEK)`; dòng `ket_qua_huy` mới nhất `khoi_phuc_luc IS NULL` (không có → 400 `'MT2 không có kết quả đã huỷ.'`); lượt `cancelled` → 400; **bất kỳ ô nào trong `diem_json` nay đã có điểm** → 400 `'MT2 đã có điểm mới — không khôi phục được.'`; mỗi kỹ năng có tuần trong `lich_json`: `checkSkillWeekMove` có blocker → 400 `${blocker} Dời lượt trước về trước rồi khôi phục.`; kỹ năng nay `cancelled` → 400. Ghi trong `tx`: tuần + `sit_status` cũ (`plan_source = 'manual'`); điểm (dòng còn tồn tại vì có "-" / nhận xét → `UPDATE` đủ cột; không có → `INSERT` mọi cột trừ `id`); đánh dấu `khoi_phuc_*`; audit `score.khoi_phuc` mỗi ô; `recomputeCompletionWeek`, `tinhLaiMtCu`, `refreshOutcome` (Case SOS mới có thể sinh lại; Case đã đóng không mở lại). Lý do tuỳ chọn.
- `ketQuaHuyCua(attemptIds)`: một câu theo lô (`theoLo`), JOIN `users` lấy `nguoi`, JOIN lượt vượt lấy `vuotBoi = nhanDot(kind, attempt_no)`.
- [x] **Bước 1 — kiểm đỏ (DB):**
  - R1 sau V3, dời MT1 về T+1: `khoiPhucKetQua(QL, m2)` → L, R đúng giá trị cũ, tuần T+4, `sit_status` cũ, `khoi_phuc_luc` có; lần hai → 400. Biến thể (Review Focus 1): MT2 được xếp lại + nhập L mới trước → 400 "đã có điểm mới", điểm mới nguyên.
  - R2 Writing: W1 điểm + nhận xét + `nhap_dau_ngay` → khôi phục trả đủ (Review Focus 3).
  - R3 MT1 vẫn ở T+9 → khôi phục MT2 → 400 có câu chỉ đường, DB không đổi.
  - R4 GVCN (`P.coreTeacher`) → 403.
  - R5 `lichMtLoTrinh(cycleId)` → lượt MT2 có `ketQuaHuy = { soDiem: 2, lyDo: 'x', vuotBoi: 'MT1', … }` khi chưa khôi phục, `null` sau; `attemptDetail` cùng trường; `scoreHistoryOf(m2)` có dòng "Huỷ do dời vượt" kèm lý do.
  - R6 tốc độ: đường đọc lịch MT của hồ sơ HV / hồ sơ Mock đã có trong `tocDoDuong.ts` vẫn dưới trần ở `tocDo.run.ts` (thêm 0 câu theo số lượt).
- [x] **Bước 2:** đỏ → sửa → xanh → commit `feat(mta): T2 Quản lý khôi phục kết quả MT bị vượt, trạng thái ketQuaHuy cho màn đọc`.

### Task 7: T3 — "-" lần 2 ở Mock: kỹ năng huỷ (vắng 2 lần), chuông GVCN, Xin dời, Không mock lại
Skill: test-driven-development

**Files:**
- Modify `server/src/fasttrack/absence.ts`:
  - `xuLyVangMotKyNang` (`:250-311`): `moveNo >= 2` → **không** `insertRequest` nữa; gọi `huyVangNoi(conn, actor, attempt, row, today)`: `UPDATE attempt_skills SET sit_status='cancelled', huy_vang=1, absent_from_no_show=0` · `logSchedule('skill_cancelled_absence', reason 'Vắng lần {n}')` · `recomputeCompletionWeek` · audit `attempt.huy_vang` · chuông mỗi GVCN (`teacher_assignments is_core = 1, status = 'active'`): `kind 'huy_vang'`, tiêu đề `Huỷ {môn ngắn} · MT{n} · {em} (vắng 2 lần)`, `entityType 'assessment_attempt'`, `dedupKey huy_vang:{attemptId}:{skill}:{moveNo}`. Trả `MoveOutcome.result = 'huy-vang'` (thêm vào union `:178`). Lần 1 chuyển Quản lý (`tooLate` / chặn T15) giữ nguyên.
  - Mới `xinDoi(p, attemptId, skill, o)`: `canRequest` (GVCN / QL; GVBM 403); lượt `cancelled` / `lich_su` → 400; kỹ năng phải `sit_status='cancelled' AND huy_vang=1` (khác → 400 `'Chỉ xin dời kỹ năng đã huỷ vì vắng 2 lần.'`); đã có đề nghị chờ → 400; `insertRequest(moveNo = absence_move_count + 1, from = planned_period_id, to = tuanDichMacDinh(...) ?? tuần thứ Hai kế tiếp, reason = o.lyDo, decideBy = hanDuyetDoiLan2(today), idem)` → thẻ Lịch thi như hiện nay. Trả `result 'pending'`.
  - `applyMove` (`:351-358`): thêm `huy_vang = 0` vào `UPDATE` (duyệt Xin dời đưa kỹ năng về `scheduled`).
  - `decideAbsenceMove` từ chối (`:403-412`): kỹ năng `huy_vang = 1` → `khongMockLaiNoi(...)` thay `cancelPart`; còn lại như cũ.
  - `sweepExpiredMoves` (`:466-482`): đề nghị hết hạn của kỹ năng `huy_vang = 1` → chỉ `expired` + đóng thẻ, không `cancelPart` (không báo QL lần hai).
  - Mới `khongMockLai(p, attemptId, skill, lyDo?)`: `canDecide` (QL); chỉ Mock; kỹ năng phải `sit_status = 'cancelled'` (huỷ vắng hoặc huỷ phần thi cũ) → `rutDeNghiDoi(attemptId, skill)` → `setSkillSkip(p, attemptId, skill, true, lyDo?.trim() || 'Không mock lại', { khongMockLai: true })`.
- Modify `server/src/fasttrack/skillSchedule.ts`: `SkillRow.huy_vang`, `skillScheduleOf` mặc định `huy_vang: 0`, `SkillScheduleView.huyVang = !!row.huy_vang`; `setSkillScope` opts thêm `khongMockLai?: boolean` — bỏ qua chặn "đã tới tuần thi" (`:871`) như `khiTao`; chặn "đã có điểm" giữ.
- Modify `shared/domain/thaoTacMt.ts`: `ThaoTac` + `'xin-doi' | 'khong-mock-lai'` (`CHU_THAO_TAC`: `'Xin dời'`, `'Không mock lại'`); `TrangThaiTT` + `'huy-vang'`; `trangThaiTT` nhận `huyVang?: boolean` (tuỳ chọn → web cũ khỏi đổi), xét ngay trước `'da-huy'`; `thaoTacKyNang('huy-vang', q)` như khối chung.
- Modify `server/src/keHoach/keHoachTest.ts:206-231` `oKyNangCua` → `OKyNang.huyVang?: boolean` (kiểu ở `shared/domain/keHoachTest.ts`) cho ô MT của PR-MTb ("S huỷ").
- Modify `shared/domain/duongHoSo.ts:167`: `n.kind === 'huy_vang'` cũng về `duongDotTest` (Để biết — không thêm vào `LOAI_CAN_LAM`).
- Modify `server/src/routes/index.ts` (cạnh `/absence-move` `:666-676`): `POST /attempts/:id/skills/:skill/xin-doi` `{ reason?, idempotencyKey? }`, `POST /attempts/:id/skills/:skill/khong-mock-lai` `{ lyDo? }` — cả hai `maybeSimulateSaveFailure()`.

**Interfaces:** Produces `xinDoi`, `khongMockLai`, `SkillScheduleView.huyVang`, `TrangThaiTT 'huy-vang'`, `OKyNang.huyVang` (khối chung). Consumes Task 4 (cột `huy_vang`), Task 1 (lý do).

- [x] **Bước 1 — kiểm đỏ (thuần):**
```ts
check('MTa T3 (H1) · trạng thái huy-vang và thao tác theo vai', () => {
  const tt = d.trangThaiTT({ batBuoc: true, tuanBatDau: '2026-09-07', coDiem: false, sit: 'cancelled', choDuyet: false, lichSu: false, homNay: '2026-09-16', huyVang: true });
  assert(tt === 'huy-vang', tt);
  const q = { nhapDiem: false, quanLy: false, gvcn: true, laFt: true, dotHoanTat: false };
  assert(JSON.stringify(d.thaoTacKyNang('huy-vang', q)) === JSON.stringify({ chinh: 'xin-doi', menu: [] }), 'GVCN');
  assert(JSON.stringify(d.thaoTacKyNang('huy-vang', { ...q, quanLy: true })) === JSON.stringify({ chinh: 'khoi-phuc', menu: ['khong-mock-lai'] }), 'QL');
  assert(d.thaoTacKyNang('huy-vang', { ...q, gvcn: false }).chinh === null, 'GVBM');
  assert(d.trangThaiTT({ batBuoc: true, tuanBatDau: '2026-09-07', coDiem: false, sit: 'cancelled', choDuyet: false, lichSu: false, homNay: '2026-09-16' }) === 'da-huy', 'không cờ → da-huy');
});
```
- [x] **Bước 2 — kiểm đỏ (DB, theo cổng):** em mới, kỹ năng S đã dời do vắng lần 1 (`absence_move_count = 1`, tuần thi đã qua).
  - H2 gõ "-" (Lịch Test / Nhập điểm → `saveScore(..., { noShow: true })`) rồi `settleNoShows(today)` (cũng là đường cron `server/src/ops/chotVangDinhKy.ts`): S `sit_status='cancelled'`, `huy_vang=1`; **không** dòng `skill_move_requests` mới, **không** thẻ `yeu_cau_duyet` mới; GVCN có 1 chuông `kind='huy_vang'`; chạy `settleNoShows` lần hai → không đổi gì.
  - H3 `baoVang(GVCN, m, 'speaking', '')` lần 2 → như H2.
  - H4 `xinDoi`: GVBM → 403; GVCN → 1 đề nghị `pending` + 1 thẻ `lich_thi`; gọi lại → 400; trên kỹ năng `scheduled` → 400. QL duyệt thẻ (`duyetYeuCau` của `server/src/duyet/yeuCau.ts`) → S `scheduled`, `huy_vang = 0`, tuần mới, `absence_move_count = 2`. Vắng lần 3 → `huy_vang = 1` lại.
  - H5 QL từ chối thẻ (`tuChoiYeuCau`, lý do `'abc'`) → S `required = 0`, `scope_reason` có lý do; lượt `status='done'` khi L, R, W đủ điểm. Biên (Review Focus 4): lớp thường "-" lần 2 vẫn dời tuần sau như cũ; MT cũ `noShow` → 400; kỹ năng đang có đề nghị chờ (lần 1 chuyển QL) → "-" không huỷ chồng.
  - H6 `khongMockLai(QL, m, 'speaking')` không lý do → bỏ kỹ năng, đề nghị chờ bị rút; GVCN → 403; kỹ năng chưa huỷ → 400.
  - H7 `sweepExpiredMoves()` sau hạn thẻ Xin dời → đề nghị `expired`, S vẫn `huy_vang = 1`, không thêm chuông `schedule_move` cho QL.
- [x] **Bước 3:** đỏ → sửa → xanh. Phép kiểm cũ dựng thẻ "dời lần 2" bằng "-" lần 2 (`grep -rn "lần 2\|move_no\|moveNo" server/src/tests` — `prMt`, `prXlmt` K4-28, `prDuyet`, `prGvb`) → dựng lại qua `xinDoi`; phép khẳng định "lần 2 thành đề nghị" → đổi theo T3.
- [x] **Bước 4:** commit `feat(mta): T3 vắng lần 2 huỷ kỹ năng, chuông GVCN, Xin dời, Không mock lại`.

### Task 8: T10 (máy chủ) — nhận band trực tiếp
Skill: test-driven-development

**Files:** `shared/domain/chamDiem.ts` (`docONhapLR`, `kiemBand`); `server/src/fasttrack/attempts.ts:1303-1324` (`ScorePatch.band?: number | null`), `:1593-1614` (tính điểm), `:1640` (`hasValue` gồm `band !== null`), `:801` `scoreSummaryText` (dòng chỉ có band → `band 6.5`); `server/src/routes/index.ts:739-748` (truyền `band: b.band`). Lớp thường không đổi (`saveRegularScore` không nhận `band`).

**Interfaces:** luật `saveScore` khi `patch.band !== undefined`: `kiemBand` (null = xoá); L/R: gửi cả `rawScore` khác `undefined` lẫn `band` → 400 `'Nhập số câu hoặc band, không cả hai.'`; có band → `raw = null`, `band = patch.band`. W1/W2/S: `criteria` có giá trị khác null cùng `band` khác null → 400 `'Nhập band hoặc 4 tiêu chí, không cả hai.'`; có band → `crit = [null,null,null,null]`. Overall, W = `writingBand(w1, w2)`, SOS, kỳ vọng **không đổi** (đều đọc `band`). Mặc định (không gửi `band`) như cũ.
- [x] **Bước 1 — kiểm đỏ (thuần):**
```ts
check('MTa T10 (B1) · docONhapLR + kiemBand', () => {
  const eq = (s: string, v: unknown) => assert(JSON.stringify(d.docONhapLR(s)) === JSON.stringify(v), `${s} → ${JSON.stringify(d.docONhapLR(s))}`);
  eq('', null); eq('30', { raw: 30 }); eq('6.5', { band: 6.5 }); eq('6.0', { band: 6 }); eq('b6', { band: 6 }); eq('B6.5', { band: 6.5 });
  for (const s of ['6.25', 'b', '9.5', '-1', 'abc']) assert('loi' in (d.docONhapLR(s) as any), s);
  assert(d.kiemBand(0) === null && d.kiemBand(9) === null && d.kiemBand(6.5) === null, 'hợp lệ');
  for (const v of [6.25, -0.5, 9.5, '6', NaN, null]) assert(d.kiemBand(v) !== null, String(v));
});
```
- [x] **Bước 2 — kiểm đỏ (DB):** B2 `saveScore(GVBM đúng kỹ năng, m, 'listening', { band: 6.5 })` → `band 6.5`, `raw_score NULL`; `writing1 { band: 6 }`, `writing2 { band: 7 }`, `speaking { band: 6 }`, `reading { rawScore: 30 }` → `resultOf` đủ, overall = cách tính cũ trên các band đó; Review Focus 5 (mỗi dạng sai → 400, DB không đổi); sửa band 6.5 → 7 không lý do → lưu; xoá band (`band: null`) không lý do → 400 (T7 huỷ điểm). Qua route `PUT /attempts/:id/scores/listening` (helper HTTP sẵn có) `band` đi đến `saveScore`.
- [x] **Bước 3:** commit `feat(mta): T10 máy chủ nhận band trực tiếp cho L/R/W1/W2/S`.

### Task 9: T11 — người khác GVCN dời Test lớp thường → một chuông cho GVCN
Skill: test-driven-development

**Files:** `server/src/fasttrack/skillSchedule.ts` `setSkillWeek` (opts `khongBaoGvcn?: boolean`; sau khi ghi: lớp `ratio` && `!khiTao` && `!ghiBuDau` && `!khongBaoGvcn` → `baoGvcnDoiLichThuong`); `server/src/keHoach/keHoachTest.ts` `luuDot` (truyền `khongBaoGvcn`), `xepHangLoat` (`:1016-1048`: lớp thường gọi `luuDot(..., khongBaoGvcn: true)`; xong vòng, có ≥ 1 em **dời** (không tính `tao`) → một chuông mỗi GVCN cho cả lớp).
**Interfaces (nội bộ):** `baoGvcnDoiLichThuong(p, a: { id; class_id; student_id; kind }, tuanMoi: string)`: GVCN = `teacher_assignments` `is_core = 1`, `status = 'active'`; bỏ qua nếu `p.userId` là GVCN; `notify({ kind: 'doi_lich_thuong', title: '{Giữa khoá|Cuối khoá} · {em} · dời sang {W2 OCT}', body: '{người dời} đổi lịch.', entityType: 'assessment_attempt', entityId, dedupKey: 'doi-thuong:{attemptId}:{homNay}' })` — nhiều môn cùng ngày = một chuông (upsert theo `dedup_key`, `audit.ts:54-60`). Bản cả lớp: `dedupKey 'doi-thuong-lop:{classId}:{homNay}'`, tiêu đề `'{Giữa khoá} · {n} em · đổi lịch'`. `shared/domain/duongHoSo.ts:167`: `'doi_lich_thuong'` → `duongDotTest`; Để biết.
- [x] **Bước 1 — kiểm đỏ (DB, lớp thường mẫu `prU12.tests.ts`):** N1 QL `setSkillWeek` một môn → GVCN có đúng 1 chuông `doi_lich_thuong`; `luuDot` 2 môn cùng em → vẫn 1; GVBM đúng môn dời → GVCN 1 chuông; GVCN tự dời → 0; "-" lớp thường (`reportRegularNoShow`) → 0 chuông `doi_lich_thuong`; FT dời → 0; `xepHangLoat` lớp thường 3 em → 1 chuông cả lớp, 0 chuông từng em; `nhomThongBao({ kind: 'doi_lich_thuong' }) === 'de-biet'`; không thẻ, không Case mới.
- [x] **Bước 2:** commit `feat(mta): T11 chuông GVCN khi người khác dời Test lớp thường`.

### Task 10: Web tối thiểu — hộp xác nhận dời vượt có lý do (không gãy luồng đang chạy)
Skill: `/ponytail lite` · `/impeccable audit` (chỉ file này)

**Files:** `web/src/modules/test/keHoach/HopXacNhanHuyLich.tsx` (bỏ `type LuotSeHuyLich` cục bộ `:6`, dùng bản shared); ba nơi gọi `HopThaoTacMt.tsx:87-142`, `MockDetailPage.tsx:618-659`, `HopKyNang.tsx:58-192`.
- Hộp chỉ mở khi `canLyDoVuot(ds)` (không điểm → lưu thẳng, máy chủ không còn 409). Thân: mỗi lượt một dòng `dongHeQuaVuot(x)`; ô **Lý do** bắt buộc (nút xác nhận mờ khi trống); nút `Đóng` / `Dời và huỷ` (chữ mockup phần 4). `onXacNhan(lyDo: string)` → nơi gọi gửi `xacNhanHuyLich: true` + `reason: lyDo`. Không đổi bố cục khác — popup đúng mockup (tiêu đề "Dời MT1 sang W2 NOV?") là việc PR-MTb.
- [x] Kiểm `MTa (W1)` (đọc nguồn như `prLm.tests.ts:89-93`): `HopXacNhanHuyLich.tsx` dùng `dongHeQuaVuot` và `canLyDoVuot`, không còn `type LuotSeHuyLich =`; ba nơi gọi điều kiện mở hộp bằng `canLyDoVuot`. `npm run check` (typecheck web) xanh.
- [x] Bấm thử 1440 sáng + 375 tối, vai QL: dời MT1 vượt MT2 có điểm ở hộp kỹ năng → hộp có dòng "MT2: huỷ … điểm", nhập lý do, lưu được; vượt MT2 chưa điểm → lưu không hỏi. Ảnh vào mô tả PR.
- [x] Commit `fix(mta): hộp xác nhận dời vượt có lý do khi huỷ kết quả`.

### Task 11: Đủ phép kiểm cho mọi cổng ghi (T14) + tài liệu
Skill: verification-before-completion

Bảng cổng (đặc tả mục 3 / mockup phần 0) → phép kiểm. Ô trống phải có phép kiểm thêm ở task này.
| # | Cổng | Hàm máy chủ | Phép kiểm |
|---|---|---|---|
| 1 | Kế hoạch Test › lưới FT / hộp kỹ năng | `kiemDot`, `luuDot`, `huyDiem`, `setSkillSkip` | C4, V2, V3, L3, L6 |
| 2 | Xếp lịch MT · Xếp hàng loạt · Thi lại | `xepMoi`, `xepHangLoat`, `thiLai` | C3, C6, V10, L8 |
| 3 | Kế hoạch Test lớp thường | `setSkillWeek` (ratio), `luuDot`, `xepHangLoat` (kind) | C5, N1 |
| 4 | Hồ sơ HV › Lộ trình (Áp lịch gợi ý, Huỷ lịch, nhập điểm tại chỗ) | `applySuggestedMockWeeks` → `apLichMacDinhLo`, `boTuanLuot`, `saveScore` | C7, **G1** `boTuanLuot` không lý do → lưu, nhật ký `'Huỷ lịch'`; L4, B2 |
| 5 | Hồ sơ Mock (dời cả đợt, hạn, huỷ / mở lại lượt, xếp lại vắng, từng kỹ năng) | `setPlanningWeek`, `setDeadlineOverride`, `setSkillDeadline`, `huyLuot`, `reopenAttempt`, `setSkillWeek` (absent), `restoreCancelledSkill`, `baoVang`, `khoiPhucKetQua`, `xinDoi`, `khongMockLai` | V8, L3, L6, H3–H6, R1–R4, **G2** QL xếp lại bài vắng (`setSkillWeek` kỹ năng `absent`) không lý do → lưu; `restoreCancelledSkill` trên kỹ năng `huy_vang` → `huy_vang = 0`; `reopenAttempt` không đổi |
| 6 | Gõ "-" ở Lịch Test / Nhập điểm / bảng lớp thường | `saveScore(noShow)`, `settleNoShows`, `saveRegularScore(noShow)` | H2, H5 (lớp thường), N1 |
| 7 | Chờ duyệt (đề nghị dời) | `duyetYeuCau` / `tuChoiYeuCau` → `decideAbsenceMove` | H4, H5, L7 |
| 8 | Tự động: Thêm HV, tạo / lên lớp, lộ trình mới, cron chốt vắng | `commitIntake`, `taoMtMacDinh` / `taoMtMacDinhLo` (`fasttrack/mtMacDinh.ts`, gọi từ mở lộ trình `fasttrack/cycles.ts` và `apLichMacDinhLo`), `ops/chotVangDinhKy.ts` | C7, H2, **G3** mở lộ trình FT mới với tuần bắt đầu cũ → MT ở tuần trước `lich_su = 0`, cách ≥ 2 tuần `= 1` |
| 9 | Điểm theo lớp (PR-DL) | `classScoreSheet` theo lượt | V6, C9 (chữ) |
| 10 | Chỉ hiển thị: Học viên & Lớp, Hành trình, Tổng quan, Công việc, Phân tích, Xuất Excel MT | `students.ts`, `standingFor`, `myWork`, `duLieuXuatMt` | V6, **G4** sau V3: việc "nhập điểm" / quá hạn của MT2 không còn trong `myWork(GVBM)`; việc "Nhập điểm MT cũ" mang chữ mới |
- [x] Viết G1–G4 (đỏ trước nếu được), chạy cả bộ.
- [x] `thiet-ke/PISA-Rulebook-2026-09-19.md` §20: thêm dòng 20.1 cho T1 (thay T34, K2-33(1)), T2 (thay Q-0310-2), T3 (thay K4-28 lần 2), T4 (thay K2-33 cho QL), T7 (thay K4-15, RB-5), T10, T11; sửa 20.2 dòng "Cửa sổ MT lịch sử" → "MT cũ", 20.4 lần 2, 20.9 dòng "Nhập MT lịch sử" và "Sửa điểm đã nhập (lý do ≥ 5 ký tự)" → "(lý do tuỳ chọn)", 20.5 câu từ chối lý do. Ghi `CODE-OK · PR-MTa`.
- [x] `CODE_MAP.md` (`fasttrack/ketQuaHuy.ts`, `migrate/prMta.ts`, `tests/prMta.tests.ts`), `plan.md` mục 11 một dòng, `[x]` các task.
- [x] `npm run check` xanh (một lần, foreground) → `/ponytail-review` → `requesting-code-review` → `finishing-a-development-branch` (mở PR vào `main`, không merge).
- [x] Commit `docs(mta): Rulebook §20, CODE_MAP, plan.md`.

### Task 12: T19 — khung nhập điểm (chủ sản phẩm 06/10)
**Files:** `server/src/platform/week.ts` `skillScoreDeadline` (lớp thường `ratio`: thứ Tư tuần sau = `addDays(monday, 9)` như FT); `server/src/fasttrack/attempts.ts` `saveScore`; `server/src/normal/regular.ts` `saveRegularScore`; mọi đường ghi điểm khác nếu có (grep `saveScore\|saveRegularScore\|assessment_scores` ở routes). Không đổi `mocTreNhapDiem`.
- [ ] **Bước 1 — kiểm đỏ (DB):** F1 GVBM nhập L của MT có tuần thi = tuần sau → 400 câu `Chưa tới tuần thi {W…} — chưa nhập điểm được.`, không ghi gì; F2 cùng việc với QL và Quản trị → 400; F3 tuần thi = tuần này → 200; F4 qua thứ Tư tuần sau → 200 và bài vẫn tính trễ (quá hạn) như cũ; F5 lớp thường y hệt F1–F4; F6 `skillScoreDeadline('ratio', T2)` = thứ Tư tuần sau; F7 MT cũ (tuần đã qua) nhập được; F8 kỹ năng chưa có tuần (chưa xếp) → 400 như chưa tới tuần; F9 sửa điểm / ghi "-" không đổi luật cũ của chúng.
- [ ] **Bước 2:** sửa ở **một hàm dùng chung** cả hai đường ghi (không lặp kiểm ở từng nơi gọi); kiểm theo tuần thi của **kỹ năng/môn** (`attempt_skills.planned_period_id`), ngày nghiệp vụ `demoToday()`.
- [ ] **Bước 3:** web: ô của kỹ năng chưa tới tuần thi hiện khoá (không cho gõ), không thêm câu giải thích; phép kiểm cũ khẳng định hạn lớp thường = Chủ nhật (grep `addDays(monday, 6)`, `Chủ nhật tuần thi` trong tests, `prS6f`, `prLt`) → sửa theo T19; số quá hạn lớp thường ở Lịch Test / Tổng quan / Phân tích GV đổi theo hạn mới (ghi trong mô tả PR).
- [ ] **Bước 4:** commit `feat(mta): T19 khung nhập điểm — không nhập trước tuần thi, hạn lớp thường thứ Tư tuần sau`.

### Task 13: T20–T23 (chủ sản phẩm 06/10) — xem plan.md mục 2c
- **T20** `setSkillWeek` / `luuDot` (FT + lớp thường): QL / Quản trị dời kỹ năng **đã có điểm** sang tuần khác, kể cả tuần cũ hơn, điểm đi theo (`attempt_skills.planned_period_id`; điểm không đổi; `lich_su` tính lại). Giữ T2 khi vượt lượt sau. Kiểm đỏ: FT và lớp thường, kỹ năng có điểm dời về tuần trước → 200, điểm còn; GV → 403/400 như cũ.
- **T21** khôi phục phần thi đã huỷ: QL chọn tuần này / tuần đã qua được (bỏ câu "Tuần … đã bắt đầu. Chọn một tuần chưa tới." cho QL), rồi nhập điểm ngay.
- **T22** xoá trắng ô đã có điểm rồi Lưu = xoá, **lý do tuỳ chọn** (sửa T7 / Task 1: bỏ `kiemLyDoThaoTac('huy-diem')` cho xoá trắng một ô ở `saveScore` và `saveRegularScore`); áp mọi người được nhập ô đó. MT cũ: `scoreEditPath` cho **GVCN lớp đó** sửa / xoá ô đã có điểm (nay chỉ ô trống). Lý do vẫn bắt buộc: huỷ lượt, huỷ kết quả dời vượt, từ chối.
- **T23** "-" ở MT cũ = Không dự thi: bỏ chặn `attempts.ts:1431`; ở MT cũ dấu "-" không tính lần vắng, không dời, không Case/thẻ, không chuông; ô không đếm "còn trống".
- Commit `feat(mta): T20–T23 dời có điểm về tuần cũ, khôi phục phần huỷ, xoá trắng ô, "-" MT cũ`.

## Nghiệm thu
1. QL xếp MT2 chưa thi vào tuần trước → MT thường (có hạn chấm, có "Nợ tuần trước"); vào 3 tuần trước → nhãn "cũ", không hạn. GVCN/GV không chọn được tuần đã qua. Em vào web hôm nay vẫn xếp được MT cũ.
2. Dời MT1 muộn hơn MT2 chưa điểm → lưu ngay, MT2 "Chưa có lịch". MT2 có điểm → hộp nêu "MT2: huỷ n điểm[, đóng m Case]", bắt lý do; lưu → điểm MT2 biến khỏi bảng điểm, SOS, Phân tích, Xuất Excel; còn trong nhật ký; Case sinh riêng từ MT2 đóng ("Kết quả MT đã huỷ"). QL bấm Khôi phục (sau khi dời MT1 về trước) → điểm và tuần cũ trở lại.
3. "-" lần 2 ở S (gõ hoặc Báo vắng hoặc cron thứ Hai) → S "huỷ (vắng 2 lần)", GVCN có chuông, Chờ duyệt không có thẻ mới. GVCN bấm Xin dời → thẻ "Dời lịch" như hiện nay. QL từ chối → S bỏ khỏi đợt, đợt hoàn thành được.
4. Lý do: chỉ huỷ điểm, huỷ lượt, huỷ kết quả dời vượt, từ chối là bắt buộc; mọi chỗ khác lưu được khi để trống; không còn "ít nhất 5 ký tự" ở Test/MT.
5. `PUT /attempts/:id/scores/listening { band: 6.5 }` lưu band; W1/W2/S band không cần tiêu chí; overall như cũ.
6. QL / GVBM dời Giữa khoá của một em lớp thường → GVCN đúng một chuông; GVCN tự dời → không chuông.
7. Không chữ "MT lịch sử" nào trên màn. `npm run check` xanh; bấm thử Task 10 (375/1440, sáng/tối, QL); GVCN và GVBM thử Xin dời (403 với GVBM).

## Prompt cho session code (dán nguyên khối)
```
Repo pisa-tracking. Chỉ bắt đầu khi PR-DL, PR-K26, PR-SL đã merge vào main.
Nhánh pr-mta-luat-mock-test từ origin/main mới nhất (worktree .claude/worktrees/pr-mta-luat-mock-test).
Model: Opus 5.5 · XHigh (thay thế: Opus 5.5 · High).
Đọc CLAUDE.md, đặc tả docs/superpowers/specs/2026-10-05-test-mock-test-design.md, rồi làm đúng kế hoạch
docs/superpowers/plans/2026-10-05-pr-mta-luat-mock-test.md, Task 0 → 11, theo thứ tự.
Ponytail full (PR máy chủ); riêng lúc sửa web/ ở Task 1 và Task 10: /ponytail lite rồi trở lại full.
Dùng superpowers:subagent-driven-development; mỗi task test-driven-development (phép kiểm đỏ trên DB test trước,
file server/src/tests/prMta.tests.ts gọi ở cuối run.ts), verification-before-completion (npm run check, một lần một lúc).
Giữ ĐÚNG tên hàm/kiểu ở khối "Interfaces chung" — PR-MTb và PR-MT0 dựa vào.
Không mất điểm: điểm MT bị vượt vào ket_qua_huy TRƯỚC khi rời assessment_scores, cùng tx. Không điền ngược dữ liệu cũ.
Phép kiểm cũ chỉ sửa khi nó khẳng định luật bị thay (ghi // PR-MTa Tn thay ...).
Câu hỏi Q1–Q3 cuối kế hoạch: nếu chủ sản phẩm chưa trả lời, làm theo khuyến nghị và ghi trong mô tả PR.
Cuối: /impeccable audit (HopXacNhanHuyLich), /ponytail-review, requesting-code-review, finishing-a-development-branch
(mở PR vào main, KHÔNG merge). Mô tả PR: từng ID T1/T2/T3/T4/T7/T10/T11 (file sửa, phép kiểm), chú thích ponytail:,
các chỗ lý do KHÔNG đổi (deXuatSua 15, yeuCau 3, chuyển lớp 3), ảnh Task 10.
```

## Giả định / Tự quyết (planning, 05/10)
| # | Tự quyết | Vì sao |
|---|---|---|
| G1 | "MT cũ" vẫn là **cờ lưu** `lich_su`, tính lúc xếp / dời / tạo lại so với **hôm đó** (không suy lại khi đọc) | Suy khi đọc thì mọi MT thường thành MT cũ sau 2 tuần → mất nợ chấm, quá hạn |
| G2 | Không điền ngược cờ `lich_su` của lượt có sẵn | Giữ như PR-MT: không ai bỗng có nợ / Case ngược |
| G3 | Lượt trộn tuần qua / tới: QL xếp được; phân loại theo tuần **muộn nhất** | T1 định nghĩa theo tuần muộn nhất; bỏ chặn "trộn" cũ của K2-33 |
| G4 | T4 chỉ cho Mock. Lớp thường vẫn chặn tuần đã qua với mọi người. FT: GV/GVCN vốn không dời được MT (chỉ `PLAN_WEEK`) | T4 nói "MT" |
| G5 | Cửa sổ 4 tuần sinh Case của MT cũ (`luotSinhViec`) giữ đo từ `created_at` | Đặc tả "giữ `luotSinhViec`" |
| G6 | Điểm bị vượt **chuyển sang bảng `ket_qua_huy`** (JSON nguyên dòng) thay vì thêm cột "đã huỷ" vào `assessment_scores` | `UNIQUE(attempt_id, skill)` cản điểm thi lại; 20 file đọc điểm tự loại, không phải vá từng nơi; khôi phục được |
| G7 | Lượt bị vượt "đã thi chưa chấm" (`sat`, chưa điểm) không tính là có điểm: về `scheduled` + bỏ lịch, không popup | Không có kết quả để mất |
| G8 | Case đóng khi huỷ kết quả = đúng tập "Case sinh riêng từ lượt" của Huỷ cả lượt (`caseSinhRieng`, T67); Case đã có kết quả PA giữ | Một luật cho hai đường huỷ |
| G9 | Khôi phục: chặn nếu ô đã có điểm mới hoặc sai thứ tự đợt; Case đã đóng không mở lại (SOS mới tự sinh nếu còn trượt) | Không đè dữ liệu mới, không phá T15 — xem Q2 |
| G10 | Xếp hàng loạt **giữ chặn** dời vượt (dòng đỏ); huỷ kết quả chỉ ở hộp một đợt / hồ sơ Mock | Huỷ kết quả cần popup + lý do từng em |
| G11 | Vắng 2 lần = `sit_status='cancelled'` + `huy_vang=1`, giữ tuần cũ (`planned_period_id`) để tra lại | Mọi luật "phần thi đã huỷ" (không nợ, không quá hạn, Khôi phục và đặt tuần) dùng lại nguyên |
| G12 | Từ chối thẻ Xin dời = "không mock lại" (kỹ năng bỏ khỏi đợt); thêm nút QL "Không mock lại" trực tiếp; thẻ Xin dời hết hạn → kỹ năng giữ "huỷ vắng 2 lần" | Đặc tả: QL chốt không mock lại = như bỏ kỹ năng — xem Q3 |
| G13 | Chuông `huy_vang` và `doi_lich_thuong` là **Để biết** | GVCN không bắt buộc làm gì |
| G14 | Ô xoá trắng một điểm đã có = "huỷ điểm" → lý do bắt buộc; Thi lại tuỳ chọn (T7 liệt kê thi lại là tuỳ chọn) | T7 |
| G15 | Không đổi lý do ngoài Test/MT: Đề xuất sửa 15 ký tự, thẻ Chờ duyệt chung 3 ký tự (`yeuCau.ts:26` — nên từ chối thẻ "Dời lịch" ở hộp Chờ duyệt vẫn cần 3 ký tự), chuyển lớp 3 ký tự | Ngoài phạm vi đặc tả Test/MT; nêu trong mô tả PR |
| G16 | T11: một chuông mỗi em mỗi ngày (nhiều môn gộp), một chuông cả lớp khi xếp hàng loạt; "-" lớp thường không tính là "dời" (đã có chuông từ lần 2) | "Một chuông", không ồn |
| G17 | `kiemDotNoi` / `DongHangLoat.canLyDo` giữ trường, luôn `false` | Web cũ không gãy; PR-MTb bỏ |

## Mâu thuẫn đặc tả ↔ mã (đã đối chiếu mã main 05/10)
1. Nghiệm thu §5 "không đường nào xoá điểm" ↔ `huyDiem` (`keHoachTest.ts:574-587`), `thiLai` (`:540-568`) và xoá tay qua `saveScore` hiện **xoá ô** (giá trị cũ chỉ còn trong nhật ký) — đúng chốt 29/09 (thi lại câu 1 = A). → Q1.
2. T2 "chưa có điểm → không popup" ↔ PR-LM đang trả 409 xác nhận cho **mọi** lượt bị vượt (`skillSchedule.ts:777`, `keHoachTest.ts:518`, `attempts.ts:1144`) và chặn khi có điểm (`lichMt.ts:139-147`). Kế hoạch đổi cả hai.
3. T3 "GVCN có Xin dời như hiện nay" ↔ hiện GVCN chỉ xin dời được bài **đang vắng** (`requestAbsenceMove` đòi `sit_status='absent'`, `absence.ts:225`); bài đã huỷ chỉ QL khôi phục. Cần đường mới `xinDoi`.
4. T1 "bỏ điều kiện ngày vào web" ↔ điều kiện nằm ở 5 chỗ (`lichMt.ts:79`, `skillSchedule.ts:748`, `keHoachTest.ts:440, 656, 924`), không chỉ một hàm.
5. T7 ↔ Rulebook §20.4/§20.5 "từ chối ≥ 3 ký tự" đọc ở **hai** lớp: `absence.ts:396` (sửa) và `yeuCau.ts:425` (giữ, G15).
6. T4 "GVCN/GV vẫn chỉ từ tuần này" — ở FT GV/GVCN vốn không dời MT được (`canMoveSkillSchedule` = `PLAN_WEEK` hoặc `SCHEDULE_MOVE` chỉ lớp thường).

## Câu hỏi cho chủ sản phẩm (session code làm theo khuyến nghị nếu chưa có trả lời)
- **Q1 — Huỷ điểm và Thi lại có thành "đánh dấu huỷ, khôi phục được" như T2 không?** Hiện hai nút này xoá điểm khỏi ô (giá trị cũ chỉ xem được ở Lịch sử thay đổi). (A) Giữ như hiện nay, chỉ T2 dùng đánh dấu. (B) Huỷ điểm cũng vào `ket_qua_huy`, có nút Khôi phục (+1 task; Thi lại vẫn xoá vì là bài mới). **Khuyến nghị A** (chốt 29/09 còn hiệu lực, PR-MTa gọn); B làm ở PR sau nếu cần.
- **Q2 — Khôi phục kết quả MT2 khi MT1 (lượt đã vượt) vẫn đứng sau tuần cũ của MT2?** (A) Chặn, câu "Dời MT1 về trước rồi khôi phục". (B) Khôi phục điểm nhưng MT2 để "Chưa có lịch". **Khuyến nghị A** (giữ thứ tự đợt T15, điểm luôn đi cùng tuần thi thật).
- **Q3 — Quản lý từ chối thẻ "Xin dời" của kỹ năng huỷ vắng 2 lần = "không mock lại" (bỏ kỹ năng, đợt hoàn thành được)?** (A) Đúng, cộng nút "Không mock lại" trực tiếp cho QL. (B) Từ chối chỉ giữ "huỷ", "không mock lại" là nút riêng. **Khuyến nghị A** (ít bước, hết việc treo).

## Migrate
Có: `server/src/migrate/prMta.ts` — cột `attempt_skills.huy_vang`, bảng `ket_qua_huy` (+ chỉ mục). Chỉ cấu trúc, không điền ngược, chạy lặp được; thêm cùng định nghĩa cuối `schema.sql`. Trước deploy: tập dượt trên bản sao DB bản chính (plan.md mục 5).

## File chồng với PR khác
| PR | File chung | Cách gộp |
|---|---|---|
| PR-DL (chưa push, worktree `pr-dl-diem-theo-lop`) | `fasttrack/attempts.ts` (DL: `classScoreSheet` ~1728; MTa: `createAttempt` 1057/1087, `setPlanningWeek`, `heQuaHuyLuot`, `saveScore`) · `web/.../cham/DiemTheoLop.tsx` (chữ "MT lịch sử") · `run.ts` | Khác vùng; MTa chạy sau DL, đổi chữ trong `DiemTheoLop.tsx` ở Task 3 |
| PR-K26 (`origin/pr-k26-lo-trinh-tiep-theo`) | `classes/schedule.ts` (K26: SQL `huong` ~326-420; MTa: 184, 205, 267) · `routes/index.ts`, `migrate.ts`, `schema.sql`, `run.ts`, `tocDoDuong.ts` | Khác vùng; xung đột "chỉ thêm dòng" → giữ cả hai |
| PR-SL (`origin/pr-sl-sua-ca-lop`) | `shared/domain/lichMt.ts` (SL thêm `cauMtSeDoi` sau `CO_DIEM_SQL`; MTa sửa `laLichSu`/`kiemTuanDaQua`/`luotBiVuot`) · `HopThaoTacMt.tsx`, `MockDetailPage.tsx` (SL: dòng `chan.daSua`; MTa: dòng lý do) · `prLm.tests.ts` (SL: dòng 92; MTa: 14-240) · `classes/intake.ts` (SL vs MTa 315) · `students/students.ts` | Khác dòng; MTa rebase sau SL, giữ `cauMtSeDoi` |
| PR-MTb (sau) | `HopKyNang.tsx`, `NganXepLichMt.tsx`, `HopThaoTacMt.tsx`, `MockDetailPage.tsx`, `HopXacNhanHuyLich.tsx`, `HangLichMt.tsx`, `ScoreEntry.tsx`, `Nhan.tsx` | MTb dựng trên bản MTa, dùng khối Interfaces; MTa chỉ sửa tối thiểu |
| PR-MT0 (sau MTb) | `shared/domain/lichMt.ts` (MT0 luôn đầu, hạn CN), `skillSchedule.ts` (`kiemVuot`, `tinhLaiMtCu`), `absence.ts` (MT0 có vào luồng vắng?), `keHoachTest.ts` (`lichMtLoTrinh`) | MT0 dựa `laMtCu`, `luotBiVuot`, `LuotSeHuyLich`, `KetQuaHuy` |
| PR-NV (song song) | `worklist/mywork.ts` (MTa: chữ dòng 919-920), `shared/domain/duongHoSo.ts` (MTa thêm kind chuông) | Vài dòng; ai sau rebase |
