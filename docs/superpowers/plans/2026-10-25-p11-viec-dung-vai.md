# P11 VIEC-DUNG-VAI — Cột Việc đúng vai — Implementation Plan

> **For agentic workers:** chạy NGAY TRONG SESSION bằng superpowers:executing-plans (plan.md 1.2). Mỗi Task: superpowers:test-driven-development. Skill: `karpathy-guidelines`, `/ponytail lite`, impeccable `clarify` · `adapt` · `harden` (trong phạm vi), cuối `audit` + `web-design-guidelines`. Steps dùng `- [ ]`.

**Goal:** cột / ô Việc theo em đúng vai — GV chỉ thấy việc CỦA MÌNH (`mine`); QL / Admin thấy việc của mọi người nhưng gộp theo môn (mỗi môn một dòng = việc gấp nhất + "+n"; một dòng "Khác" cho việc không gắn môn), mặc định 3 dòng, "Xem thêm (n)" mở tại chỗ hết các dòng. TVV / CX giữ như cũ.

**Architecture:** một hàm gộp thuần `gopViecTheoMon` ở `shared/domain/congViec.ts` (giữ thứ tự gấp có sẵn của đầu vào: quá hạn → hạn sớm); môn của một việc đọc từ trường đã có của `/my-work` (`phu`, nhóm việc) — KHÔNG đổi JSON `/my-work` (băm TD4-a giữ). Máy chủ chỉ sửa nhánh GV của `viecTheoEmCuaLop` (bỏ nạp việc của các GV khác). Web: `StudentsPage.tsx` lọc `mine` cho GV khi dựng `viec`; `OViec` (`DanhSachHvLop.tsx`) vẽ theo vai.

**Tech Stack:** TypeScript, React, Express, libsql; phép kiểm `server/src/tests/prViecDungVai.tests.ts` gọi cuối `run.ts`.

**Spec:** `docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md` dòng R6.1 + "Đã tự quyết" (cột Việc QL: 3 dòng mặc định, "Xem thêm" mở hết ≤ 5 dòng môn + 1 dòng không gắn môn).

## Hiện trạng đã kiểm (25/10)
- Cột Việc chỉ còn ở **Học viên & Lớp** (`BangHvGon` / thẻ 375 `TheHvGon`, cả khi lọc một lớp). Hồ sơ lớp đã bỏ cột Việc (`BangHoSoLop.tsx:69`); thanh "Việc cần làm" đầu hồ sơ lớp (`ThanhViecLop`, `?chi=toi` → `cuaToi`) và đầu hồ sơ HV (`DauHoSo.tsx` `ThanhViec` → `cuaBan`) đã chỉ việc của người xem.
- GV gọi `/my-work` (không `nguoi`) — có cả dòng `mine: false` (vd Nhập điểm "Chưa phân công giáo viên", dòng không người giữ) → hiện ở cột Việc của GV.
- `viecTheoEmCuaLop` nhánh GV: việc của mình + `/my-work` của TỪNG GV đang dạy lớp (`theoEm`). Web không còn đọc `theoEm` (chỉ phép kiểm `prSvLop`, `prUiHoSoLop`).
- Badge "n việc quá hạn" đầu hồ sơ lớp (`DauTrangLop.tsx:99-103`) đếm `/my-work` của GV gồm cả dòng không `mine`; bấm → HV & Lớp `view=qua-han` — phải cùng số với cột Việc sau khi lọc.

## Global Constraints
- **Môn của việc** (`monCuaViec`): nhóm gắn kỹ năng — `score` (môn đầu của `phu` "Listening, Reading" → "Listening"), `ghi_nhan_xet`, `cause`, `no_plan`, `ghi_ket_qua_pa`, `xac_nhan_pa` → nhãn `phu` (nhãn môn / ô chuẩn của lớp: "Reading", "Writing Task 1", "Grammar + Vocabulary"…). Mọi nhóm khác hoặc thiếu `phu` → `null` ("Khác"). ponytail: khoá theo nhãn; thêm trường `mon` vào `/my-work` khi được phép đổi băm TD4-a.
- **Gộp:** đầu vào đã sắp gấp nhất trước; dòng = môn theo thứ tự xuất hiện (việc gấp nhất của môn quyết định chỗ đứng), "Khác" là một dòng như môn. `Σ (1 + them) = số việc vào`. Mặc định 3 dòng; "Xem thêm (n)" (n = số dòng đang ẩn) mở hết tại chỗ, "Thu gọn" đóng.
- GV (không QL / Admin, không TVV / CX): `viec` chỉ từ dòng `mine`. Cùng nguồn cho ô Việc, chip "Có việc quá hạn", sắp "Cần chú ý trước", badge quá hạn đầu hồ sơ lớp. Không viết hàm đếm thứ hai.
- KHÔNG đổi quyền: "Công việc › Của một GV…" và `viecCuaNguoi` giữ nguyên. KHÔNG đổi JSON `/my-work`.
- Bấm việc = `onMoViec` như cũ. 375: cùng luật, mọi nút trong ô Việc ≥ 44 px.
- Không chạm tệp P4 (#575), P6, P12, P9 (`BangLoTrinhTiep.tsx`, `TransitionPanel.tsx`, `TabDauRa.tsx`). KHÔNG commit tệp DB.

## Review Focus
1. GV seed: không dòng nào ở cột Việc / `viec-theo-em` mà `mine = false`; số "Có việc quá hạn" = badge quá hạn đầu hồ sơ lớp.
2. QL: tổng việc trên các dòng + "+n" = số việc thật của em ở `/my-work?nguoi=tat-ca` (không mất việc khi gộp / ẩn).
3. Em ≤ 3 dòng → không có "Xem thêm"; em 1 việc → như cũ (một dòng, không "+n").
4. Lớp thường: môn theo nhãn ô chuẩn của lớp (G+V, Pronunciation…), không gộp nhầm sang môn FT.
5. `theoEm` của GV qua `viec-theo-em` = đúng `mine` của `/my-work` GV đó trong lớp (không còn N+1 theo số GV dạy lớp).

---

### Task 1: Hàm gộp thuần
**Files:** Modify `shared/domain/congViec.ts` (cuối tệp; đã re-export qua `index.ts`). Test: Create `server/src/tests/prViecDungVai.tests.ts`, Modify `server/src/tests/run.ts` (gọi cuối).
**Interfaces — Produces:**
- `export function monCuaViec(it: { group: string; phu?: string | null }): string | null`
- `export type DongViecMon<T> = { mon: string | null; dau: T; them: number }`
- `export function gopViecTheoMon<T>(ds: readonly T[], monCua: (x: T) => string | null): DongViecMon<T>[]`
- `export const SO_DONG_VIEC_MAC_DINH = 3`
- [ ] Step 1: `VDV-1 · gopViecTheoMon`: 7 việc (L×3, R×2, S×1, Khác×1, thứ tự trộn đã sắp gấp) → 4 dòng, dòng đầu = môn của việc đầu, `slice(0, 3)` = 3 dòng, `Σ(1+them) = 7`, `dau` mỗi dòng = việc đầu tiên của môn đó.
- [ ] Step 2: `VDV-2 · monCuaViec`: score "Listening, Reading" → "Listening"; no_plan "Reading" → "Reading"; cause "Grammar + Vocabulary" giữ; yt_xu_ly / chot_len_ft / thiếu `phu` → null.
- [ ] Step 3: FAIL → cài → PASS. Commit "P11: hàm gộp việc theo môn".

### Task 2: Máy chủ — `viec-theo-em` của GV chỉ việc của mình
**Files:** Modify `server/src/classes/viecTheoEm.ts` (nhánh GV: chỉ `myWork(p)` lọc `cuaLop && mine`; bỏ vòng GV khác; `chiCuaToi` còn dùng cho QL). Cập nhật chú thích đầu tệp. Kiểm `prSvLop.tests.ts`, `prUiHoSoLop.tests.ts` còn đúng (sửa phép kiểm nào đòi việc GV khác — ghi lý do trong PR).
- [ ] Step 1: `VDV-3 · GV seed` (GVCN MB FT 101, GVBM): mọi dòng `theoEm` và `cuaToi` có `mine = true`; tập khoá `theoEm` = tập khoá `myWork(gv).items` lọc em đang học lớp + `mine`.
- [ ] Step 2: `VDV-4 · QL MB`: tập khoá `theoEm` = `myWork(ql, {nguoi:'tat-ca', branchId}).items` của em đang học lớp (đủ, cả `mine = false`); số việc khớp.
- [ ] Step 3: FAIL → sửa → PASS. Commit "P11: viec-theo-em — GV chỉ việc của mình".

### Task 3: Web — cột Việc theo vai
**Files:** Modify `web/src/modules/students/StudentsPage.tsx` (khi dựng `viec`: GV lọc `it.mine`; truyền cờ gộp cho QL / Admin), `web/src/modules/students/DanhSachHvLop.tsx` (`OViec`: GV / TVV như cũ; QL / Admin `gopViecTheoMon` → ≤ 3 dòng + "Xem thêm (n)" / "Thu gọn" tại chỗ; mỗi dòng = nút việc gấp nhất · hạn · "+n"; 375 nút `max-sm:min-h-[44px]`), `web/src/modules/classes/DauTrangLop.tsx` (badge quá hạn GV lọc `mine` — cùng nguồn). i18n EN: `shared/i18n/en/p11ViecDungVai.ts` + nạp ở `shared/i18n/en.ts`.
- [ ] Step 1: impeccable `clarify` (chữ "Xem thêm (n)", "+n", "Khác" không cần nhãn riêng), `adapt` (375), `harden` (em 0 việc, 1 việc, đúng 3 dòng, 6 dòng, việc không hạn).
- [ ] Step 2: `npm run typecheck`. Bấm thử trên dev (giữ chỗ `web-n`): GV `/hoc-vien`, QL `/hoc-vien` + lọc một lớp, 1440 tối + 375 sáng.
- [ ] Step 3: Commit "P11: cột Việc đúng vai (GV việc của mình, QL gộp theo môn)".

### Task 4: Ảnh + kiểm cuối
- [ ] Ảnh trước / sau `docs/anh/p11-viec-dung-vai/`: HV & Lớp (lọc một lớp = màn lớp) vai GV và QL, 1440 tối + 375 sáng; `khop-khac.md` có bảng thao tác TRƯỚC → SAU.
- [ ] `audit` + `web-design-guidelines` trên diff giao diện. `npm run check` xanh (giữ chỗ `check-n`). `/ponytail-review`.
- [ ] Mở PR (không nháp), KHÔNG merge; nhắn "PTA Plan" (số PR, check, [XM]).

## [XM] ghi cho PTA Plan
- Hồ sơ lớp không còn cột Việc theo em (đã bỏ ở UI-HO-SO-LOP); P11 sửa máy chủ `viec-theo-em` + thanh đầu trang vốn đã chỉ việc của mình. Ảnh "hồ sơ lớp" = HV & Lớp lọc một lớp.
- `DauHoSo` (hồ sơ HV): "n việc của người khác" (gập) là khung đã duyệt (`ho-so-hv.html`) — GIỮ, không coi là cột Việc theo em.
