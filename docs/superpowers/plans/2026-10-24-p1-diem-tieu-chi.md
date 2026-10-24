# P1 DIEM-TIEU-CHI — Điểm tiêu chí Writing / Speaking chỉ số nguyên — Implementation Plan

> **For agentic workers:** dự án chạy plan NGAY TRONG SESSION bằng superpowers:executing-plans (plan.md 1.2 — không subagent-driven). Mỗi Task: superpowers:test-driven-development. Steps dùng `- [ ]`.

**Goal:** tiêu chí W1 / W2 / S chỉ nhận số nguyên 0–9 ở mọi đường nhập; band kỹ năng và Overall vẫn x.5 như cũ; dữ liệu cũ không sửa.

**Architecture:** một hàm kiểm thuần ở `shared/domain/chamDiem.ts` dùng chung cho hộp nhập (web), Dán Excel (`danExcel.ts`) và `saveScore` (máy chủ). Thêm lệnh chỉ đọc đếm ô cũ có tiêu chí lẻ.

**Tech Stack:** TypeScript, Express, libsql; phép kiểm `server/src/tests/*.tests.ts` (check / assert) gọi cuối `run.ts`.

**Spec:** `docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md` mục 3.6 (R4.4).

## Global Constraints
- Chỉ tiêu chí (`assessment_scores.c1..c4` của writing1 / writing2 / speaking). Band nhập thẳng (MT cũ / MT0, `duocNhapBandThang`) giữ bậc 0.5 (`kiemBand`).
- Công thức không đổi: `bandFromCriteria` (TB 4 tiêu chí làm tròn 0.5), Writing = (W1 + 2×W2)/3, Overall TB 4 band.
- Không sửa dữ liệu cũ, không sửa seed (seed có tiêu chí x.5 = mẫu "dữ liệu cũ đọc được").
- Câu lỗi một chỗ: `LOI_TIEU_CHI_NGUYEN = t('Tiêu chí là số nguyên 0–9 (ví dụ 6 7 6 7).')` + khoá EN trong `shared/i18n/en/` (tệp mới `p1DiemTieuChi.ts`, đăng ký ở `en.ts`).
- Không chạm tệp của PR đang mở #566 / SUA-CHAM-LAI ngoài những tệp liệt kê dưới; KHÔNG commit tệp DB.

## Review Focus
1. Ô cũ có tiêu chí lẻ (6.5): mở hộp, KHÔNG sửa gì, bấm Lưu → không được báo lỗi oan (chỉ báo khi người dùng gõ / gửi tiêu chí lẻ).
2. Gõ "6,5" (dấu phẩy) → báo lỗi số nguyên, không ngầm đổi thành 6.5 hay 7.
3. Dán Excel một dòng có 1 tiêu chí lẻ → chỉ ô đó lỗi, các ô khác của dòng vẫn xem trước được (luật lô lỗi một phần hiện có).
4. "-" (vắng) và ô trống vẫn như cũ.
5. Band tổng x.5 vẫn hợp lệ: tiêu chí 6 7 6 7 → band 6.5.

---

### Task 1: Hàm kiểm dùng chung + web + Dán Excel
**Files:** Modify `shared/domain/chamDiem.ts` (cạnh `criteriaPatchFrom` ~:230), `shared/domain/danExcel.ts:~205-212`, `web/src/modules/fasttrack/HopNhapDiem.tsx` (ô tiêu chí ~:412: `inputMode="numeric"`), Create `shared/i18n/en/p1DiemTieuChi.ts`, Modify `shared/i18n/en.ts`. Test: Create `server/src/tests/prDiemTieuChi.tests.ts`, Modify `server/src/tests/run.ts` (cuối).
**Interfaces — Produces:** `export function kiemTieuChi(v: number | null): string | null` (null = hợp lệ; trả `LOI_TIEU_CHI_NGUYEN` khi không phải số nguyên 0–9); `export const LOI_TIEU_CHI_NGUYEN`.
- [ ] Step 1: phép kiểm `DTC-1 · kiemTieuChi`: `kiemTieuChi(6) === null`, `kiemTieuChi(0) === null`, `kiemTieuChi(9) === null`, `kiemTieuChi(null) === null`; `6.5`, `-1`, `10`, `NaN` → `LOI_TIEU_CHI_NGUYEN`.
- [ ] Step 2: `DTC-2 · criteriaPatchFrom(['6','6.5','6','6'], {})` → `loi === LOI_TIEU_CHI_NGUYEN`, `patch === null`; `['6','7','6','7']` → `preview === 6.5`, `loi === null`; `['6,5','6','6','6']` → `loi` khác null.
- [ ] Step 3: `DTC-3 · xetODan` 4 tiêu chí `"6 6.5 6 6"` → `loai 'loi'` với `LOI_TIEU_CHI_NGUYEN`; `"6 7 6 7"` → band 6.5. (Tìm chữ ký `xetODan` trong `danExcel.ts`.)
- [ ] Step 4: chạy `npm run build:server && node dist-server/server/src/tests/run.js 2>&1 | grep DTC` → FAIL.
- [ ] Step 5: cài `kiemTieuChi`; `criteriaPatchFrom` gọi nó cho từng ô có số; `xetODan` dùng nó thay `kiemBand` cho nhánh 4 tiêu chí, câu lỗi = `LOI_TIEU_CHI_NGUYEN`; ô web `inputMode="numeric"`.
- [ ] Step 6: chạy lại → PASS. Commit "P1: tiêu chí W / S số nguyên — hàm kiểm chung, hộp nhập, Dán Excel".

### Task 2: Máy chủ `saveScore` + lô
**Files:** Modify `server/src/fasttrack/attempts.ts:~2282-2286` (thay điều kiện `Number.isInteger(v * 2)` bằng `kiemTieuChi`). Test: thêm vào `prDiemTieuChi.tests.ts`.
**Interfaces — Consumes:** `kiemTieuChi`, `LOI_TIEU_CHI_NGUYEN` (Task 1).
- [ ] Step 1: `DTC-4 · PUT /attempts/:id/scores/writing1 {criteria:[6,6.5,6,6]}` (GV được phân công, lượt MT thường của seed) → 400, câu = `LOI_TIEU_CHI_NGUYEN`, ô không đổi; `{criteria:[6,7,6,7]}` → 200, band 6.5. Gọi qua hàm `saveScore` hoặc app HTTP như `prHd.tests.ts` (mẫu `createApp().listen(0)`).
- [ ] Step 2: `DTC-5 · POST /attempts/scores/lo` một dòng có W1 lẻ → dòng đó báo lỗi, dòng khác lưu (đúng luật lô hiện có `luuDiemLo`).
- [ ] Step 3: `DTC-6 · ô cũ`: đặt thẳng SQL c1..c4 = 6, 6.5, 6, 6 cho một ô; gửi patch KHÔNG có `criteria` (vd chỉ `comment`) → 200, c1..c4 giữ nguyên.
- [ ] Step 4: FAIL → sửa → PASS. Commit "P1: saveScore nhận tiêu chí số nguyên".

### Task 3: Lệnh chỉ đọc đếm tiêu chí lẻ cũ
**Files:** Create `server/src/ops/kiemTieuChiLe.ts` (mẫu `server/src/ops/kiemTruocSvNxCase.ts`: mở DB theo `PISA_DB` / biến Turso như các lệnh `kiem-truoc-*`), Modify `package.json` scripts: `"kiem-tieu-chi-le": "npm run build:server && node dist-server/server/src/ops/kiemTieuChiLe.js"`. Modify `DEPLOY_2026-10.md` (một dòng: chạy chỉ đọc trước deploy, gửi số cho PTA Plan).
**Interfaces — Produces:** `export function demTieuChiLe(conn): { kyNang: string; soO: number; soLuot: number }[]` (chỉ SELECT).
- [ ] Step 1: `DTC-7 · demTieuChiLe(conn)` trên DB test (seed có x.5) → mảng không rỗng, mọi phần tử `soO > 0`; chạy hai lần không đổi DB (`SELECT COUNT(*) FROM assessment_scores` trước = sau).
- [ ] Step 2: FAIL → cài → PASS. In bảng: kỹ năng · số ô · số lượt · 5 ví dụ (mã HV, MT, tiêu chí). Commit.

### Task 4: Hướng dẫn + kiểm cuối
- [ ] `grep -rn "0.5\|bậc 0" shared/huongDan` — câu nào nói tiêu chí bậc 0.5 thì sửa thành số nguyên (+ EN).
- [ ] `npm run check` xanh; `/ponytail-review`; mô tả PR: bảng Review Focus 1–5 (đã thử / cách thử), dòng 10.3 "Điểm tiêu chí 6.5, điểm tổng 6.5". Mở PR, KHÔNG merge; nhắn session "PTA Plan".
