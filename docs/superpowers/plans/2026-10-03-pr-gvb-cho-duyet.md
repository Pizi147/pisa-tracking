# PR-GVb · Chờ duyệt — Kế hoạch (03/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Duyệt nhiều được ở tab "Tất cả" (+ "Chọn hết n", "Nhắc tất cả (n)", báo thành công một phần) — D01/Q-B; dòng tóm tắt Chờ duyệt thành hàng chip đếm (J5); tách "Để QL biết" khỏi Chờ duyệt, badge chỉ đếm thẻ QL phải quyết (J5b); "n bài chờ chấm" ở danh sách lớp màu tím `wait` như Lịch Test (U01); chip "Bị từ chối" kiểu **Cần làm** ở mọi nơi.

**Architecture:** Luật thuần ở `shared/domain/yeuCauDuyet.ts` (chọn hàng loạt, trần 50, tách nhóm, đếm, tóm tắt kết quả) và `shared/domain/trangThai.ts` (bảng tone trạng thái chuyển từ web sang shared, không import React). Máy chủ `server/src/duyet/yeuCau.ts`: `demHop`/`hopChoDuyet`/`demYeuCau` dùng **một** hàm phân nhóm; `duyetNhieu` trả mã lỗi từng thẻ; endpoint mới `POST /yeu-cau/nhac-nhieu` gọi lại `nhacViec` (đã chống nhắc lặp trong ngày). Web: `HopChoDuyet.tsx`, `TheYeuCau.tsx`, `KhoiCanXuLy.tsx`, `App.tsx`, `CasePanel.tsx`, `ui/Nhan.tsx`.

**Tech Stack:** React + react-router + Tailwind (web/), Express + SQLite/Turso (server/), phép kiểm `server/src/tests/*.tests.ts` qua `npm test` (`run.ts`), `npm run check` = build + test + typecheck.

**Spec:** `docs/superpowers/plans/2026-10-03-lo-trinh-tong-hop-viec-chua-lam.md` (mục "Quyết định 03/10", "Áp cho mọi PR", prompt PR-GVb) · `docs/superpowers/plans/2026-10-02-ux-sau-critique.md` (J5, J5b, Q-B, Q-D) · `thiet-ke/HE_GIAO_DIEN.md`. Không có spec riêng.

## Global Constraints
- CLAUDE.md: tinh chỉnh, không làm lại — giữ Be Vietnam Pro, bảng màu, bố cục. Thời gian trên màn: mã tuần; ngày chỉ cho hạn cụ thể.
- Luật S3: không nút "Huỷ" trần; thanh chọn hàng loạt dùng "Bỏ chọn"; form chưa sửa → "Đóng", đã sửa → "Huỷ thay đổi".
- **Không bao giờ nới quyền:** máy chủ kiểm quyền **từng thẻ** (`quyetDinh` → `require_(p, P_DUYET, ctxThe(yc))`, `nhacViec` → `can(ATTEMPT_VIEW, {classId, studentId})`). Giao diện ẩn nút chỉ là tiện; chốt chặn ở máy chủ.
- Trần 50 thẻ mỗi lần (duyệt và nhắc) — cùng hằng số `TRAN_HANG_LOAT` ở shared, máy chủ và web cùng đọc.
- Hàng loạt chỉ **cùng một loại** (`loai`) và loại có `hangLoat: true`.
- Không nhắc lặp trong ngày: dùng lại `nhacViec` (`dedupKey = nhac:<key>:<ngày>`), không viết luật dedup thứ hai.
- Hàm mới ở `shared/domain/*` re-export qua `shared/domain/index.ts`; shared **không** import React/web.
- File phép kiểm mới `server/src/tests/prGvb.tests.ts`: import + gọi ở **cuối** `server/src/tests/run.ts` (sau PR-PH), kiểu `YThucTestKit`.
- Ưu tiên phép kiểm hành vi trên DB test (hàm thuần, gọi service với `P.mbManager`/`P.coreTeacher`, HTTP qua `goi`/`taoTaiKhoan`/`dangNhap` khi cần route). Quét mã nguồn chỉ khi không kiểm được hành vi (ghi rõ lý do ở phép đó).
- Đổi tên/xoá file → sửa `CODE_MAP.md` cùng commit; thêm hàm mới → thêm vào dòng "Hộp Chờ duyệt" của `CODE_MAP.md` (~dòng 458).
- Mô tả PR: báo từng ID (D01, J5, J5b, U01, Bị từ chối) — đã tái hiện / file sửa / phép kiểm / ảnh / giới hạn còn lại; liệt kê chú thích `ponytail:`.
- Bấm thử trình duyệt 375 và 1440, sáng/tối, **3 vai**: Quản trị toàn hệ thống, Quản lý chi nhánh (Monbay), GV.

## Skill bắt buộc
| Lúc | Skill / lệnh |
|---|---|
| Đầu phiên | `/ponytail lite` (PR có giao diện). `anthropic-skills:subagent-driven-development` để thực hiện kế hoạch task-by-task. |
| Mỗi task | `anthropic-skills:test-driven-development`: phép kiểm đỏ → sửa → xanh. |
| Trước GVb-4/GVb-5 (J5, J5b) | `/impeccable critique` màn Chờ duyệt (hộp + dải Tổng quan QL), chỉ ghi vấn đề trong phạm vi PR. |
| Khi sửa giao diện (GVb-3..GVb-7) | `/impeccable layout` + `/impeccable clarify`, chỉ trong phạm vi PR. |
| Gặp điểm cần chủ sản phẩm quyết (trái mục Giả định) | `anthropic-skills:brainstorming` → ghi câu hỏi vào mô tả PR, **không** tự đổi luật. |
| Trước khi báo xong mỗi task / cả PR | `anthropic-skills:verification-before-completion` (chạy `npm run check`, đọc kết quả). |
| Trước mở PR | `/impeccable audit` (hộp Chờ duyệt, Tổng quan QL, Tổng quan GV, danh sách lớp) · `/ponytail-review` · liệt kê chú thích `ponytail:` · `anthropic-skills:requesting-code-review` · `anthropic-skills:finishing-a-development-branch` (mở PR, **không** tự merge). |

Không chạy: `impeccable init|document|hooks on`, `npx impeccable install|update`; không cài plugin mới.

## Giả định (chủ sản phẩm duyệt khi đọc PR — đổi được, không chặn làm)
- **G1.** "Mục có nút Duyệt" (J5b) = thẻ QL phải quyết: `kieuNut` `duyet-tu-choi` **và** `tra-loi` (Xin ý kiến có nút Trả lời — vẫn là việc QL phải làm). "Để QL biết" = `kieuNut === 'nhac'` (hiện trùng đúng phân loại `bao-len`: 5 loại `bao_len_*`).
- **G2.** "Để QL biết" là **tab thứ ba** của ô Trạng thái: `Chờ duyệt · Để QL biết · Đã xử lý (30 ngày)` (`?xem=de-biet`). Chip phân loại ở tab Chờ duyệt bỏ "Báo QL" (luôn 0 sau khi tách).
- **G3.** Badge Công việc, chip "Tất cả" và số "chờ" ở dải Tổng quan QL = **chỉ thẻ phải quyết**. "Để QL biết" có số riêng (`deBiet`) hiện ở dải Tổng quan như một chip, **không** cộng vào badge. `quaHan` chỉ đếm thẻ phải quyết; thẻ Báo QL quá hạn hiện ở tab Để QL biết.
- **G4.** "Chọn hết n" = chọn mọi thẻ **cùng loại** với thẻ đã chọn đầu tiên đang hiện trong danh sách, tối đa 50 (n hiện số thực sẽ chọn). Chưa chọn thẻ nào thì không có nút (không đoán loại).
- **G5.** "Nhắc tất cả (n)" ở tab Để QL biết: n = thẻ có người nhận (`duLieu.ownerId`) **và** khoá việc (`duLieu.viecKey`) **và** chưa nhắc hôm nay. Thẻ không có `viecKey` (một số `bao_len_ban_giao`/`bao_len_chua_lenh` nhắc qua luồng khác) không vào n. Công việc › "Của GV" (Q-B) **không** làm trong PR này — ghi "giới hạn còn lại" (ở `congViec/HoTroHocVienTab.tsx`, thuộc vùng PR-GVa).
- **G6.** "Bị từ chối" kiểu Cần làm ở **cả** góc người xin lẫn hộp duyệt (Đã xử lý) và CasePanel — đúng chữ quyết định "mọi nơi".
- **G7.** Tóm tắt thành công một phần: lý do gom theo mã HTTP: 403 → "không có quyền", 400 "đã được xử lý" → "đã có người xử lý", 404 → "không còn", còn lại → "lỗi khác".

---

### Task GVb-1: Luật thuần — nhóm thẻ, đếm, chọn hàng loạt, tóm tắt kết quả (shared)

**Skill:** test-driven-development · verification-before-completion.

**Files:**
- Modify: `shared/domain/yeuCauDuyet.ts` (sau `demHop`, ~dòng 80; `DemYeuCau` ~dòng 160)
- Create: `server/src/tests/prGvb.tests.ts`
- Modify: `server/src/tests/run.ts` (cuối, sau PR-PH)

**Interfaces (Produces):**
```ts
export const TRAN_HANG_LOAT = 50;
export type NhomHop = 'can-quyet' | 'de-biet';
export function nhomCuaLoai(loai: string): NhomHop;            // kieuNut 'nhac' → 'de-biet'
export const PHAN_LOAI_CAN_QUYET: readonly PhanLoai[];          // PHAN_LOAI trừ phân loại chỉ chứa thẻ 'nhac'
export function demHop(ds: readonly { loai: string; phanLoai: PhanLoai; hanDuyet: string | null }[], homNay: string):
  { chip: Record<KhoaChip, number>; tong: number; quaHan: number; deBiet: number; deBietQuaHan: number; baoLen: number };
export function chonMot<T extends { id: number; loai: string; hangLoat: boolean }>(ds: readonly T[], chon: ReadonlySet<number>, id: number, v: boolean): Set<number>;
export function chonHet<T extends { id: number; loai: string; hangLoat: boolean; trangThai: string }>(ds: readonly T[], loai: string): Set<number>;
export function tomTatHangLoat(viec: 'duyet' | 'nhac', ok: number, loi: readonly { ma: number; loi: string }[]): string;
// DemYeuCau thêm: deBiet: number; deBietQuaHan: number
```

- [ ] **Step 1: Viết phép kiểm đỏ** — `server/src/tests/prGvb.tests.ts`:

```ts
/** PHÉP KIỂM PR-GVb — Chờ duyệt: duyệt nhiều ở Tất cả, Để QL biết, chip đếm, tone chờ chấm, Bị từ chối. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrGvbTests(t: YThucTestKit) {
  const { check, checkAsync, assert, P } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-GVb · Chờ duyệt');

  check('GVb (1) · nhomCuaLoai: mọi loại kieuNut "nhac" → de-biet, còn lại can-quyet; PHAN_LOAI_CAN_QUYET bỏ bao-len', () => {
    for (const k of d.LOAI_YEU_CAU) {
      const m = d.LOAI_YC_META[k];
      assert(d.nhomCuaLoai(k) === (m.kieuNut === 'nhac' ? 'de-biet' : 'can-quyet'), k);
    }
    assert(!d.PHAN_LOAI_CAN_QUYET.includes('bao-len') && d.PHAN_LOAI_CAN_QUYET.includes('hoc-thuat'), String(d.PHAN_LOAI_CAN_QUYET));
  });

  check('GVb (1) · demHop: tong/chip "Tất cả" chỉ thẻ phải quyết; deBiet đếm riêng; quaHan không lẫn Báo QL', () => {
    const h = '2026-10-03';
    const r = d.demHop([
      { loai: 'de_xuat_pa', phanLoai: 'hoc-thuat', hanDuyet: '2026-10-01' },
      { loai: 'xin_y_kien', phanLoai: 'hoc-thuat', hanDuyet: null },
      { loai: 'bao_len_mini_test', phanLoai: 'bao-len', hanDuyet: '2026-09-30' },
      { loai: 'bao_len_y_thuc', phanLoai: 'bao-len', hanDuyet: null },
    ], h);
    assert(r.tong === 2 && r.chip['tat-ca'] === 2 && r.deBiet === 2 && r.quaHan === 1 && r.deBietQuaHan === 1, JSON.stringify(r));
  });

  check('GVb (1) · chonMot: khác loại → bắt đầu lại từ thẻ mới; loại không hangLoat → không chọn; trần 50', () => {
    const ds = [
      ...Array.from({ length: 60 }, (_, i) => ({ id: i + 1, loai: 'de_xuat_pa', hangLoat: true, trangThai: 'cho' })),
      { id: 100, loai: 'lich_thi', hangLoat: true, trangThai: 'cho' },
      { id: 200, loai: 'xin_y_kien', hangLoat: false, trangThai: 'cho' },
    ];
    let s = d.chonMot(ds, new Set(), 1, true);
    s = d.chonMot(ds, s, 2, true);
    assert([...s].join() === '1,2', [...s].join());
    s = d.chonMot(ds, s, 100, true);
    assert([...s].join() === '100', 'đổi loại phải bắt đầu lại: ' + [...s].join());
    assert(d.chonMot(ds, s, 200, true).size === 1 && d.chonMot(ds, s, 200, true).has(100), 'loại không hàng loạt lọt vào');
    const het = d.chonHet(ds, 'de_xuat_pa');
    assert(het.size === d.TRAN_HANG_LOAT && !het.has(100), `chonHet ${het.size}`);
    let day = het;
    day = d.chonMot(ds, day, 55, true);
    assert(day.size === d.TRAN_HANG_LOAT && !day.has(55), 'vượt trần 50');
    assert(d.chonHet(ds, 'xin_y_kien').size === 0, 'chonHet loại không hàng loạt');
  });

  check('GVb (1) · tomTatHangLoat: "Đã duyệt 7/9 — 2 không có quyền"; gom theo mã; toàn bộ xong không có vế sau', () => {
    const q = (n: number, ma: number, loi = 'x') => Array.from({ length: n }, () => ({ ma, loi }));
    assert(d.tomTatHangLoat('duyet', 7, q(2, 403)) === 'Đã duyệt 7/9 — 2 không có quyền', d.tomTatHangLoat('duyet', 7, q(2, 403)));
    assert(d.tomTatHangLoat('duyet', 5, []) === 'Đã duyệt 5/5', d.tomTatHangLoat('duyet', 5, []));
    const s = d.tomTatHangLoat('nhac', 3, [...q(1, 403), ...q(2, 400, 'Yêu cầu này đã được xử lý.'), ...q(1, 404)]);
    assert(s === 'Đã nhắc 3/7 — 1 không có quyền, 2 đã có người xử lý, 1 không còn', s);
  });
}
```

Thêm cuối `run.ts` (trước dòng `console.log(`\n${'='.repeat(60)}`)`):
```ts
// ==================================================================== PR-GVb (Chờ duyệt: duyệt nhiều ở Tất cả, Để QL biết, U01)
const { runPrGvbTests } = await import('./prGvb.tests.ts');
await runPrGvbTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```

- [ ] **Step 2: Chạy, thấy đỏ** — `npm test 2>&1 | grep -A3 "GVb"`. Mong đợi: lỗi `nhomCuaLoai is not a function`.

- [ ] **Step 3: Sửa** — trong `shared/domain/yeuCauDuyet.ts`:

```ts
/** PR-GVb (D01/Q-B): trần một lần duyệt / nhắc hàng loạt — máy chủ (`duyetNhieu`, `nhacNhieu`) và web cùng đọc. */
export const TRAN_HANG_LOAT = 50;

/** PR-GVb (J5b, Q-D 02/10): thẻ QL phải quyết (Duyệt/Từ chối, Trả lời) · thẻ chỉ để QL biết và nhắc (Báo QL). */
export type NhomHop = 'can-quyet' | 'de-biet';
export function nhomCuaLoai(loai: string): NhomHop {
  return (LOAI_YC_META as Record<string, LoaiYcMeta>)[loai]?.kieuNut === 'nhac' ? 'de-biet' : 'can-quyet';
}
/** Phân loại có ít nhất một loại thẻ phải quyết — chip của tab Chờ duyệt. */
export const PHAN_LOAI_CAN_QUYET: readonly PhanLoai[] = PHAN_LOAI.filter((k) =>
  LOAI_YEU_CAU.some((l) => LOAI_YC_META[l].phanLoai === k && LOAI_YC_META[l].kieuNut !== 'nhac'));
```

Thay `demHop` (giữ tên — mọi chỗ đếm đã gọi nó):
```ts
/**
 * MỘT HÀM ĐẾM cho mọi con số của hộp (chip, badge Công việc, dải Tổng quan). PR-GVb (J5b): `tong` = thẻ PHẢI QUYẾT (= chip "Tất cả" của tab
 * Chờ duyệt = số dòng có nút Duyệt/Trả lời) · `deBiet` = thẻ Để QL biết, KHÔNG cộng vào badge · `baoLen` giữ cho tương thích (= deBiet).
 */
export function demHop(ds: readonly { loai: string; phanLoai: PhanLoai; hanDuyet: string | null }[], homNay: string) {
  const quyet = ds.filter((x) => nhomCuaLoai(x.loai) === 'can-quyet');
  const biet = ds.filter((x) => nhomCuaLoai(x.loai) === 'de-biet');
  const qua = (x: { hanDuyet: string | null }) => !!x.hanDuyet && x.hanDuyet < homNay;
  const chip = demChip(quyet);
  return { chip, tong: quyet.length, quaHan: quyet.filter(qua).length, deBiet: biet.length, deBietQuaHan: biet.filter(qua).length, baoLen: biet.length };
}

type ChonDuoc = { id: number; loai: string; hangLoat: boolean };
/** Bấm ô chọn một thẻ: chỉ loại `hangLoat`; khác loại với thẻ đang chọn → bắt đầu lại; không quá `TRAN_HANG_LOAT`. */
export function chonMot<T extends ChonDuoc>(ds: readonly T[], chon: ReadonlySet<number>, id: number, v: boolean): Set<number> {
  const the = ds.find((x) => x.id === id);
  if (!the || !the.hangLoat) return new Set(chon);
  const loaiDang = ds.find((x) => chon.has(x.id))?.loai ?? null;
  const next = new Set(loaiDang && loaiDang !== the.loai ? [] : chon);
  if (!v) { next.delete(id); return next; }
  if (next.size >= TRAN_HANG_LOAT) return next;
  next.add(id);
  return next;
}
/** "Chọn hết n": mọi thẻ đang chờ CÙNG loại (theo thứ tự danh sách), tối đa `TRAN_HANG_LOAT`. */
export function chonHet<T extends ChonDuoc & { trangThai: string }>(ds: readonly T[], loai: string): Set<number> {
  return new Set(ds.filter((x) => x.loai === loai && x.hangLoat && x.trangThai === 'cho').slice(0, TRAN_HANG_LOAT).map((x) => x.id));
}

/** Kết quả hàng loạt một câu: "Đã duyệt 7/9 — 2 không có quyền". Lý do gom theo mã (G7). */
export function tomTatHangLoat(viec: 'duyet' | 'nhac', ok: number, loi: readonly { ma: number; loi: string }[]): string {
  const dau = `Đã ${viec === 'duyet' ? 'duyệt' : 'nhắc'} ${ok}/${ok + loi.length}`;
  if (!loi.length) return dau;
  const nhom: [string, number][] = [
    ['không có quyền', loi.filter((l) => l.ma === 403).length],
    ['đã có người xử lý', loi.filter((l) => l.ma === 400 && /đã được xử lý/.test(l.loi)).length],
    ['không còn', loi.filter((l) => l.ma === 404).length],
  ];
  const khac = loi.length - nhom.reduce((s, [, n]) => s + n, 0);
  if (khac) nhom.push(['lỗi khác', khac]);
  return `${dau} — ${nhom.filter(([, n]) => n > 0).map(([c, n]) => `${n} ${c}`).join(', ')}`;
}
```

`DemYeuCau` thêm `deBiet: number; deBietQuaHan: number;` (chú thích: "không cộng vào `cho`"). Re-export đã có qua `export * from './yeuCauDuyet.ts'` ở `shared/domain/index.ts` — kiểm lại, thiếu thì thêm.

- [ ] **Step 4: Chạy lại** — `npm test`. GVb (1) xanh. Phép cũ sẽ đỏ ở chỗ gọi `demHop` thiếu `loai` → sửa ở GVb-2 (cùng commit nếu typecheck vỡ).
- [ ] **Step 5: Commit** — `git commit -am "PR-GVb: luật thuần nhóm thẻ, đếm, chọn hàng loạt, tóm tắt kết quả"`

### Task GVb-2: Máy chủ — một nguồn đếm cho badge, chip và danh sách; tab Để QL biết; duyetNhieu trả mã từng thẻ

**Skill:** test-driven-development · verification-before-completion.

**Files:**
- Modify: `server/src/duyet/yeuCau.ts` — `hopChoDuyet` (~319–347), `demYeuCau` (~361–386), `duyetNhieu` (~445–467)
- Modify: `server/src/routes/index.ts:1560-1568` (`GET /yeu-cau` nhận `xem=de-biet`)
- Modify: `server/src/tests/prDuyet.tests.ts:366-367, 411-414` (đổi kỳ vọng `baoLen`/`cho` theo G3 — ghi chú `PR-GVb (J5b)`)
- Test: `server/src/tests/prGvb.tests.ts`

**Interfaces:**
- Consumes: `demHop`, `nhomCuaLoai`, `TRAN_HANG_LOAT` (GVb-1).
- Produces: `hopChoDuyet(p, { xem: 'cho' | 'de-biet' | 'da-xu-ly', … })` → `{ the, dem, demBiet: number, homNay, lopDangLoc }`; `demYeuCau` → thêm `deBiet`, `deBietQuaHan`; `duyetNhieu` → `loi: { id, loi, ma }[]`.

- [ ] **Step 1: Phép kiểm đỏ** (thêm vào `runPrGvbTests`):

```ts
  const yc = await import('../duyet/yeuCau.ts');
  const maLoi = (f: () => unknown) => { try { f(); return 0; } catch (e: any) { return e?.status ?? -1; } };

  check('GVb (2) · J5b: badge (demYeuCau.cho) = số thẻ tab Chờ duyệt = số thẻ có nút Duyệt/Trả lời; Để QL biết tách riêng', () => {
    for (const p of [P.mbManager, P.admin]) {
      const dem = yc.demYeuCau(p);
      const cho = yc.hopChoDuyet(p, { xem: 'cho' });
      const biet = yc.hopChoDuyet(p, { xem: 'de-biet' });
      const coNut = cho.the.filter((x) => x.kieuNut === 'duyet-tu-choi' || x.kieuNut === 'tra-loi').length;
      assert(dem.cho === cho.the.length && cho.the.length === coNut && cho.dem['tat-ca'] === dem.cho,
        `badge ${dem.cho} · hộp ${cho.the.length} · có nút ${coNut} · chip ${cho.dem['tat-ca']}`);
      assert(biet.the.every((x) => x.kieuNut === 'nhac') && biet.the.length === dem.deBiet && cho.demBiet === dem.deBiet,
        `de-biet ${biet.the.length} vs ${dem.deBiet}`);
      assert(!cho.the.some((x) => x.kieuNut === 'nhac'), 'thẻ Báo QL còn lọt vào Chờ duyệt');
    }
  });

  await checkAsync('GVb (2) · tongQuanQuanLy.choDuyet === demYeuCau (một nguồn)', async () => {
    const { tongQuanQuanLy } = await import('../worklist/tongQuan.ts');
    const tq = (await tongQuanQuanLy(P.mbManager, {})) as any;
    const dem = yc.demYeuCau(P.mbManager);
    assert(tq.choDuyet.cho === dem.cho && tq.choDuyet.deBiet === dem.deBiet && tq.choDuyet.quaHan === dem.quaHan, JSON.stringify(tq.choDuyet));
  });

  check('GVb (2) · duyetNhieu: >50 → 400; thẻ ngoài phạm vi → lỗi riêng mã 403, thẻ trong phạm vi vẫn duyệt', () => {
    assert(maLoi(() => yc.duyetNhieu(P.mbManager, Array.from({ length: d.TRAN_HANG_LOAT + 1 }, (_, i) => i + 1))) === 400, 'trần 50');
    // Hai thẻ de_xuat_pa: một của chi nhánh Monbay, một của chi nhánh khác (tạo bằng taoYeuCau trên conn, như prDuyet.tests.ts:120-135)
    const { trong, ngoai } = taoHaiThePa();   // helper đặt trong file: chép mẫu tạo thẻ ở prDuyet.tests.ts ~120
    const r = yc.duyetNhieu(P.mbManager, [trong, ngoai]);
    assert(r.ok.includes(trong) && r.loi.some((l) => l.id === ngoai && l.ma === 403), JSON.stringify(r));
    assert(d.tomTatHangLoat('duyet', r.ok.length, r.loi) === 'Đã duyệt 1/2 — 1 không có quyền', d.tomTatHangLoat('duyet', r.ok.length, r.loi));
  });
```
(`taoHaiThePa`: chép đúng cách tạo thẻ PA ở `prDuyet.tests.ts` ~dòng 120–133, đổi `chi_nhanh_id`/`hoc_vien_id` của thẻ thứ hai sang học viên chi nhánh khác Monbay. Nếu tên `tongQuanQuanLy`/chữ ký khác, tra `server/src/worklist/tongQuan.ts:159` và gọi đúng hàm trả `choDuyet`.)

- [ ] **Step 2: Chạy, thấy đỏ** — `xem: 'de-biet'` chưa có; `demBiet`/`deBiet` undefined; `ma` không có.

- [ ] **Step 3: Sửa** `server/src/duyet/yeuCau.ts`:
  - `hopChoDuyet`: kiểu `xem?: 'cho' | 'de-biet' | 'da-xu-ly'`. `de-biet` đọc cùng câu SQL của `cho` (`trang_thai = 'cho'`). Sau lọc chi nhánh/lớp: `const d = demHop(rows.map((r) => ({ loai: r.loai, phanLoai: metaCua(r.loai).phanLoai, hanDuyet: r.han_duyet })), homNay);` rồi `if (xem !== 'da-xu-ly') rows = rows.filter((r) => nhomCuaLoai(r.loai) === (xem === 'de-biet' ? 'de-biet' : 'can-quyet'));`. Trả `dem: d.chip, demBiet: d.deBiet`. Đã xử lý không lọc nhóm (lịch sử đủ).
  - `demYeuCau`: truyền `loai` vào `demHop`; `kq.deBiet = d.deBiet; kq.deBietQuaHan = d.deBietQuaHan;` khởi tạo `deBiet: 0, deBietQuaHan: 0`.
  - `duyetNhieu`: thay `ids.length > 50` bằng `ids.length > TRAN_HANG_LOAT` (chữ: `` `Chọn từ 1 đến ${TRAN_HANG_LOAT} yêu cầu để duyệt.` ``); mỗi `loi.push` thêm `ma` (`'Mã không hợp lệ'` → 400, không tìm thấy → 404, catch → `e?.status ?? 500`). Kiểm quyền từng thẻ **giữ nguyên** qua `duyetYeuCau` → `quyetDinh`.
  - `routes/index.ts:1563`: `xem: xem === 'da-xu-ly' || xem === 'de-biet' ? xem : 'cho'`.
  - Sửa kỳ vọng cũ ở `prDuyet.tests.ts:367, 414`: `baoLen` nay = `deBiet` (không nằm trong `cho`), `hop.dem['bao-len']` = 0 → đổi so sánh thành `dem.deBiet === yc.hopChoDuyet(P.mbManager, { xem: 'de-biet' }).the.length`. Ghi chú `// PR-GVb (J5b): Báo QL tách khỏi tổng`.
- [ ] **Step 4: Chạy lại** — `npm test`: GVb (2) xanh, PR-DUYET, PR-Dọn-a (`duyetNhieu` 403 GV) vẫn xanh.
- [ ] **Step 5: Commit** — `git commit -am "PR-GVb: một nguồn đếm Chờ duyệt (chỉ thẻ phải quyết), tab Để QL biết, duyetNhieu trả mã từng thẻ"`

### Task GVb-3: Máy chủ — "Nhắc tất cả" (`POST /yeu-cau/nhac-nhieu`)

**Skill:** test-driven-development · verification-before-completion.

**Files:**
- Modify: `server/src/duyet/yeuCau.ts` (thêm `nhacNhieu` sau `duyetNhieu`)
- Modify: `server/src/routes/index.ts` (sau `/yeu-cau/duyet-nhieu`, ~1574)
- Test: `server/src/tests/prGvb.tests.ts`

**Interfaces:**
- Consumes: `nhacViec(p, { key, ownerId })` (`server/src/worklist/nhacViec.ts:19`) — tự kiểm quyền dòng và chống nhắc lặp trong ngày.
- Produces: `nhacNhieu(p, ids: unknown): { ok: { id: number; daNhacLuc: string; moi: boolean }[]; loi: { id: number; loi: string; ma: number }[] }`. `moi = false` khi hôm nay đã nhắc (không gửi thêm).

- [ ] **Step 1: Phép kiểm đỏ**:

```ts
  check('GVb (3) · nhacNhieu: GV → 403; >50 → 400; chỉ thẻ "nhac"; nhắc lần hai trong ngày không tạo thông báo mới', () => {
    assert(maLoi(() => yc.nhacNhieu(P.coreTeacher, [1])) === 403, 'GV');
    assert(maLoi(() => yc.nhacNhieu(P.mbManager, Array.from({ length: d.TRAN_HANG_LOAT + 1 }, (_, i) => i + 1))) === 400, 'trần');
    const biet = yc.hopChoDuyet(P.mbManager, { xem: 'de-biet' }).the
      .filter((x) => typeof x.duLieu?.ownerId === 'number' && typeof x.duLieu?.viecKey === 'string');
    assert(biet.length >= 1, 'seed cần ít nhất một thẻ Báo QL có người nhận');
    const quyet = yc.hopChoDuyet(P.mbManager, { xem: 'cho' }).the[0];
    const demTb = () => (t.conn.prepare(`SELECT COUNT(*) AS n FROM notifications WHERE kind = 'nhac_viec'`).get() as any).n as number;
    const truoc = demTb();
    const r1 = yc.nhacNhieu(P.mbManager, [...biet.map((x) => x.id), ...(quyet ? [quyet.id] : [])]);
    const sau1 = demTb();
    assert(r1.ok.length + r1.loi.length === biet.length + (quyet ? 1 : 0), JSON.stringify(r1));
    if (quyet) assert(r1.loi.some((l) => l.id === quyet.id && l.ma === 400), 'thẻ phải quyết không được nhắc hàng loạt');
    const r2 = yc.nhacNhieu(P.mbManager, biet.map((x) => x.id));
    assert(demTb() === sau1 && r2.ok.every((x) => !x.moi), `nhắc lặp trong ngày: ${truoc}→${sau1}→${demTb()}`);
  });
```

- [ ] **Step 2: Chạy, thấy đỏ** — `nhacNhieu is not a function`.
- [ ] **Step 3: Sửa**:

```ts
/** PR-GVb (Q-B): "Nhắc tất cả (n)" — từng thẻ gọi `nhacViec` (kiểm phạm vi TỪNG dòng + một thông báo / việc / ngày). Thẻ lỗi báo riêng. */
export function nhacNhieu(p: Principal, ids: unknown) {
  require_(p, P_DUYET, { anyScope: true }, 'Chỉ Quản lý và Quản trị hệ thống nhắc được giáo viên.');
  if (!Array.isArray(ids) || !ids.length || ids.length > TRAN_HANG_LOAT) throw badRequest(`Chọn từ 1 đến ${TRAN_HANG_LOAT} thẻ để nhắc.`);
  const ok: { id: number; daNhacLuc: string; moi: boolean }[] = [];
  const loi: { id: number; loi: string; ma: number }[] = [];
  const homNay = demoToday();
  for (const x of new Set(ids)) {
    if (!(Number.isInteger(x) && (x as number) > 0)) { loi.push({ id: x as number, loi: 'Mã yêu cầu không hợp lệ.', ma: 400 }); continue; }
    const id = x as number;
    try {
      const yc = docThe(id);
      require_(p, P_DUYET, ctxThe(yc), 'Thẻ này nằm ngoài phạm vi bạn quản lý.');
      if (yc.trang_thai !== 'cho') throw badRequest('Yêu cầu này đã được xử lý.');
      if (metaCua(yc.loai).kieuNut !== 'nhac') throw badRequest('Thẻ này cần Duyệt/Trả lời, không phải Nhắc.');
      const du = yc.du_lieu ? JSON.parse(yc.du_lieu) : {};
      if (typeof du.ownerId !== 'number' || typeof du.viecKey !== 'string') throw badRequest(nhanKhongNguoiNhac(yc.loai));
      const daCo = db().prepare(`SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = ?`).get(du.ownerId, `nhac:${du.viecKey}:${homNay}`);
      const r = nhacViec(p, { key: du.viecKey, ownerId: du.ownerId });
      ok.push({ id, daNhacLuc: r.daNhacLuc, moi: !daCo });
    } catch (e: any) { loi.push({ id, loi: e?.message ?? 'Không nhắc được.', ma: e?.status ?? 500 }); }
  }
  return { ok, loi };
}
```
(Tên cột JSON thực tế: kiểm `YeuCauRow` — nếu là `du_lieu` đã parse thì bỏ `JSON.parse`. Tên trường `status` của `HttpError`: tra `server/src/util.ts`.)
Route: `api.post('/yeu-cau/nhac-nhieu', requireAuth, wrap((req) => { maybeSimulateSaveFailure(); return yeuCauSvc.nhacNhieu(principalOf(req), (req.body ?? {}).ids); }));` — đặt **trước** `/yeu-cau/:id/...`.
- [ ] **Step 4: Chạy lại** — xanh. Thêm `nhacNhieu`, `POST /yeu-cau/nhac-nhieu` vào `CODE_MAP.md:458`.
- [ ] **Step 5: Commit** — `git commit -am "PR-GVb: Nhắc tất cả — nhacNhieu dùng lại nhacViec, kiểm quyền từng thẻ, không nhắc lặp trong ngày"`

### Task GVb-4: Web hộp Chờ duyệt — duyệt nhiều ở "Tất cả", "Chọn hết n", báo thành công một phần (D01/Q-B)

**Skill:** test-driven-development · `/impeccable critique` (trước, cả màn) · `/impeccable layout` + `clarify` · verification-before-completion.

**Files:**
- Modify: `web/src/modules/duyet/HopChoDuyet.tsx:30-34` (chú thích), `:66-70` (`loaiChon`, `choHangLoat`), `:74-91` (`duyetNhieu`), `:128-138` (ô chọn), `:140-152` (thanh chọn)

**Interfaces:** Consumes `chonMot`, `chonHet`, `tomTatHangLoat`, `TRAN_HANG_LOAT`, `LOAI_YC_META`.

- [ ] **Step 1: Phép kiểm** — luật đã có phép ở GVb-1 (chonMot/chonHet/tomTat). Phần nối giao diện kiểm bằng bấm thử (Step 4); không viết phép quét nguồn.
- [ ] **Step 2: Sửa** `HopChoDuyet.tsx`:
  - Dòng 70: `const choHangLoat = xem === 'cho';` (bỏ `&& phan !== 'tat-ca'`).
  - Dòng 131–135 (ô chọn): `onChange: (v) => setChon((s) => chonMot(ds, s, y.id, v))`; bỏ biến `loaiChon` khỏi chỗ chọn (giữ để hiện tên loại).
  - Thanh chọn (dòng 140+), trái → phải: `Đã chọn {chon.size} · {LOAI_YC_META[loaiChon].nhan}` · nút `Chọn hết {nHet}` khi `nHet > chon.size` (với `nHet = chonHet(ds, loaiChon).size`) · `Bỏ chọn` · `Duyệt {chon.size} yêu cầu` (primary). Khi `chonHet` bị cắt ở 50: chữ phụ `Tối đa ${TRAN_HANG_LOAT} một lần`.
  - Trong tab Tất cả, đầu danh sách một dòng gợi ý 12 px khi có ≥2 thẻ cùng loại hàng loạt và chưa chọn gì: "Đánh dấu ô ở thẻ để duyệt nhiều cùng loại." (clarify: một câu, không giải thích cách app chạy).
  - `duyetNhieu`: kiểu trả `loi: { id; loi; ma }[]`; toast một câu `tomTatHangLoat('duyet', r.ok.length, r.loi)` (tone `ok` khi không lỗi, `warn`/`error` khi có lỗi); vẫn giữ toast riêng từng thẻ lỗi nhưng gộp tối đa 3 dòng + "…và k thẻ khác".
  - Chú thích đầu hàm (dòng 30–34): "Duyệt hàng loạt: mọi tab (cả Tất cả), chỉ cùng MỘT loại `hangLoat`, tối đa 50 — PR-GVb D01/Q-B".
- [ ] **Step 3: `npm run check`** xanh.
- [ ] **Step 4: Bấm thử** — QL Monbay: tab Tất cả, chọn 2 thẻ Đề xuất PA → thanh hiện "Chọn hết n"; chọn sang thẻ Dời lịch → bỏ chọn cũ; Duyệt → toast "Đã duyệt 2/2". Quản trị: tạo 1 thẻ ngoài phạm vi QL bằng cách đổi chi nhánh lọc trong lúc thẻ đã chọn (hoặc gọi API với id ngoài phạm vi qua devtools) → "Đã duyệt 1/2 — 1 không có quyền". GV: không thấy hộp (403 như cũ).
- [ ] **Step 5: Commit** — `git commit -am "PR-GVb: duyệt nhiều ở tab Tất cả, Chọn hết n, báo thành công một phần (D01/Q-B)"`

### Task GVb-5: Web — tab "Để QL biết" + "Nhắc tất cả (n)" (J5b, Q-B)

**Skill:** test-driven-development · `/impeccable layout` + `clarify` · verification-before-completion.

**Files:**
- Modify: `web/src/modules/duyet/HopChoDuyet.tsx:37` (`xem`), `:50-56` (qs), `:97-101` (hai ô lọc), `:122-126` (trạng thái rỗng)
- Modify: `web/src/modules/duyet/TheYeuCau.tsx:112-121` (nút Nhắc nhận `daNhac` từ ngoài khi nhắc hàng loạt)
- Modify: `web/src/App.tsx:96-103` (chữ `sr` badge: "thẻ cần duyệt")

- [ ] **Step 1: Phép kiểm** — số badge = số dòng có nút đã kiểm ở GVb (2). Giao diện: bấm thử.
- [ ] **Step 2: Sửa**:
  - `xem`: `params.get('xem')` ∈ `'cho' | 'de-biet' | 'da-xu-ly'`; ô Trạng thái: `[{ key: 'cho', nhan: 'Chờ duyệt', so: dem?.['tat-ca'] }, { key: 'de-biet', nhan: 'Để QL biết', so: data?.demBiet }, { key: 'da-xu-ly', nhan: 'Đã xử lý (30 ngày)' }]`.
  - Ô phân loại chỉ hiện ở `cho`, dùng `PHAN_LOAI_CAN_QUYET`; ở `de-biet` ẩn ô phân loại (một phân loại duy nhất). Link cũ `?phan=bao-len` → chuyển sang `?xem=de-biet` (một `useEffect` đổi URL, `replace: true`) để link ở thông báo/Tổng quan cũ không gãy.
  - Ở `de-biet`, trên danh sách: dòng 12 px "Không cần duyệt — để bạn biết và nhắc giáo viên." + nút `Nhắc tất cả ({n})` với `n` theo G5 (thẻ có `ownerId`, `viecKey`, chưa có `duLieu.daNhacLuc` hôm nay), ẩn khi n = 0; n > 50 → nút ghi "Nhắc 50 thẻ đầu" (thứ tự máy chủ: quá hạn trước).
  - Bấm → `api.post('/yeu-cau/nhac-nhieu', { ids })` → toast `tomTatHangLoat('nhac', r.ok.length, r.loi)`; thẻ trong `r.ok` hiện "Đã nhắc HH:mm" (truyền `daNhacLuc` xuống `TheYeuCau` qua prop `daNhacNgoai?: string`). Lỗi mạng: như `duyetNhieu` (làm mới danh sách).
  - Trạng thái rỗng `de-biet`: "Không có việc nào cần QL biết".
  - `App.tsx` `sr`: `${dem.cho} thẻ cần duyệt` (số đã chỉ còn thẻ phải quyết từ GVb-2).
- [ ] **Step 3: `npm run check`** xanh.
- [ ] **Step 4: Bấm thử** 3 vai: QL thấy badge = số thẻ tab Chờ duyệt (đếm bằng mắt, so số); tab Để QL biết không có nút Duyệt; Nhắc tất cả → toast; sau đó nút ẩn (n = 0 vì đã nhắc hôm nay). GV vào chuông thấy thông báo nhắc. Quản trị toàn hệ thống: số đúng mọi chi nhánh.
- [ ] **Step 5: Commit** — `git commit -am "PR-GVb: tab Để QL biết tách khỏi Chờ duyệt, Nhắc tất cả (J5b, Q-B)"`

### Task GVb-6: Dải Chờ duyệt ở Tổng quan QL — hàng chip đếm (J5)

**Skill:** `/impeccable critique` (đã chạy ở GVb-4) · `/impeccable layout` + `clarify` · test-driven-development · verification-before-completion.

**Files:**
- Modify: `shared/domain/yeuCauDuyet.ts` (thay `dongPhuChoDuyet` ~dòng 168 bằng `chipChoDuyet`)
- Modify: `web/src/modules/worklist/KhoiCanXuLy.tsx:107-140` (`DaiChoDuyet`)
- Test: `server/src/tests/prGvb.tests.ts`

**Interfaces (Produces):**
```ts
export type ChipDem = { key: string; nhan: string; so: number; den: string; quaHan?: boolean };
/** Hàng chip dải Chờ duyệt: từng phân loại phải quyết (>0) · "Quá hạn" · "Để QL biết". `den` = query mở hộp đã lọc. */
export function chipChoDuyet(d: DemYeuCau): ChipDem[];
```

- [ ] **Step 1: Phép kiểm đỏ**:

```ts
  check('GVb (6) · J5: chipChoDuyet — phân loại 0 bỏ; Để QL biết là chip riêng mở ?xem=de-biet; không còn câu "gồm … (…)"', () => {
    const dem = { cho: 4, quaHan: 1, baoLen: 3, deBiet: 3, deBietQuaHan: 1, cuaToiCho: 0, cuaToiTuChoi: 0,
      chip: { 'tat-ca': 4, 'hoc-thuat': 3, 'y-thuc': 0, 'lich-thi': 1, 'thong-tin-hv': 0, 'bao-len': 0 } } as any;
    const c = d.chipChoDuyet(dem);
    assert(c.map((x) => `${x.nhan} ${x.so}`).join(' | ') === 'Học thuật 3 | Lịch thi 1 | Quá hạn 1 | Để QL biết 3', c.map((x) => `${x.nhan} ${x.so}`).join(' | '));
    assert(c.find((x) => x.key === 'de-biet')!.den === '?xem=de-biet' && c.find((x) => x.key === 'qua-han')!.den === '?qua-han=1', JSON.stringify(c));
    assert(!('dongPhuChoDuyet' in d), 'hàm câu tóm tắt cũ còn sót');
  });
```
- [ ] **Step 2: Đỏ** → **Step 3: Sửa**: viết `chipChoDuyet` (thứ tự `PHAN_LOAI_CAN_QUYET`, rồi `qua-han` nếu `quaHan > 0` với `quaHan: true`, rồi `de-biet` nếu `deBiet > 0`); xoá `dongPhuChoDuyet` và trường `baoLenTheoLoai` nếu không còn ai đọc (grep). `DaiChoDuyet`: giữ `Nhan wait "Chờ duyệt"` + số lớn `{d.cho} chờ duyệt`; thay ba link + dòng phụ bằng một hàng `Nhan` có `onClick` (dùng `navigate`), mỗi chip `${nhan} ${so}` tabular-nums; chip quá hạn tone `bad`, chip Để QL biết tone `muted`, phân loại tone `wait`. Ẩn dải khi `cho === 0 && deBiet === 0`. Điện thoại: hàng chip `flex-wrap`, vùng bấm ≥ 40 px (Nhan đã có).
- [ ] **Step 4: Chạy lại + bấm thử** 1440/375 sáng/tối: bấm từng chip mở hộp đúng lọc.
- [ ] **Step 5: Commit** — `git commit -am "PR-GVb: dải Chờ duyệt thành hàng chip đếm (J5)"`

### Task GVb-7: "n bài chờ chấm" tím `wait` như Lịch Test (U01)

**Skill:** test-driven-development · verification-before-completion.

**Files:**
- Create/Modify: `shared/domain/trangThai.ts` — thêm `TONE_TRANG_THAI` + `toneBadgeTuTrangThai` (không React)
- Modify: `web/src/ui/Nhan.tsx:23` — `export { TONE_TRANG_THAI } from '@shared/domain/index.ts'` thay định nghĩa tại chỗ (KhoiNo.tsx:35–36 không đổi import)
- Modify: `shared/domain/hocVienLop.ts:234` — `tone: 'warn'` → `tone: TONE_BADGE_TRANG_THAI['cho-cham']`
- Modify: `server/src/tests/hocVienLop.tests.ts` (~137–147) nếu có assert tone `warn` cho `cham`

**Interfaces (Produces):**
```ts
/** Một trạng thái → một tone ở MỌI chỗ (UX-G G2). Bản cho `Nhan` (web) và bản cho luật badge lớp (`badgeLop`, tone 'danger'|'warn'|'info'|'wait'|'muted'). */
export const TONE_TRANG_THAI = { 'cho-cham': 'wait', 'cho-duyet': 'wait' } as const;
export const TONE_BADGE_TRANG_THAI = { 'cho-cham': 'wait', 'cho-duyet': 'wait' } as const;
```

- [ ] **Step 1: Phép kiểm đỏ**:

```ts
  check('GVb (7) · U01: badge lớp "n bài chờ chấm" cùng tone với "Chờ chấm" ở Lịch Test (tím wait)', () => {
    const b = d.badgeLop({ vai: 'gv', needsPlacement: false, canXepLop: 0, missingSkills: [], soBaiChoCham: 3, needScoresTitle: null, phase: 'running', missingCount: 0 } as any);
    const cham = [...b.hien, ...b.an].find((x) => x.key === 'cham')!;
    assert(cham && cham.tone === d.TONE_BADGE_TRANG_THAI['cho-cham'], `tone ${cham?.tone}`);
    // Lịch Test (KhoiNo) dùng TONE_TRANG_THAI['cho-cham'] → toneNhanTuBadge('wait') phải ra cùng ToneNhan
    assert(d.TONE_TRANG_THAI['cho-cham'] === 'wait' && d.TONE_BADGE_TRANG_THAI['cho-cham'] === 'wait', 'bảng tone lệch');
  });
```
- [ ] **Step 2: Đỏ** (`tone 'warn'`). **Step 3: Sửa** như Files. Kiểm `toneNhanTuBadge('wait')` (`Nhan.tsx:56–59`) đã trả `TONE_TRANG_THAI['cho-duyet']` = `wait` → danh sách lớp hiện tím. Sửa assert cũ ở `hocVienLop.tests.ts`/`nenGiaoDien.tests.ts` nếu so `warn` cho `cham` (ghi `// PR-GVb U01`).
- [ ] **Step 4: Chạy lại**; bấm thử Học viên & Lớp (GV, QL): badge chờ chấm tím, đặt cạnh Lịch Test cùng màu.
- [ ] **Step 5: Commit** — `git commit -am "PR-GVb: chờ chấm ở danh sách lớp dùng tone wait như Lịch Test (U01)"`

### Task GVb-8: Chip "Bị từ chối" = kiểu Cần làm ở mọi nơi

**Skill:** test-driven-development · verification-before-completion.

**Files:**
- Modify: `shared/domain/yeuCauDuyet.ts:117-124` (`nhanTrangThaiYc`: `tu_choi` → `{ t: 'can-lam', chu: 'Bị từ chối' }`)
- Modify: `server/src/tests/prDuyet.tests.ts:34` (`'da-huy'` → `'can-lam'`, ghi `// PR-GVb: chủ sản phẩm 03/10`)
- Modify: `web/src/modules/cases/CasePanel.tsx:250` (`<Nhan tone="muted">` → `<NhanTrangThai t="can-lam" chu="Bị từ chối" />`)
- Đã đúng, không sửa: `web/src/modules/worklist/ViecCuaToi.tsx:152` (Tổng quan GV). Hộp duyệt + Yêu cầu của tôi đi qua `TheYeuCau.tsx:125` → `nhanTrangThaiYc`.

- [ ] **Step 1: Phép kiểm đỏ**:

```ts
  check('GVb (8) · "Bị từ chối" kiểu Cần làm ở hộp duyệt và Yêu cầu của tôi (cùng nhãn với Tổng quan GV)', () => {
    const n = d.nhanTrangThaiYc('tu_choi');
    assert(n.t === 'can-lam' && n.chu === 'Bị từ chối', JSON.stringify(n));
  });
```
- [ ] **Step 2: Đỏ.** **Step 3: Sửa** 3 file trên; `grep -rn "Bị từ chối" web/src` không còn chỗ dùng tone khác `can-lam`. (Quét nguồn chỉ ở bước tự kiểm này, không thành phép.)
- [ ] **Step 4: Chạy lại; bấm thử** GV (Tổng quan GV, Yêu cầu của tôi), QL (hộp → Đã xử lý), Case có PA bị từ chối: cùng một kiểu chip.
- [ ] **Step 5: Commit** — `git commit -am "PR-GVb: chip Bị từ chối kiểu Cần làm ở mọi nơi"`

### Task GVb-9: Sửa kế hoạch UX 02/10 (Q-B) và đánh dấu xong

**Files:**
- Modify: `docs/superpowers/plans/2026-10-02-ux-sau-critique.md` — mục Q-B (~dòng 147–151) và J5/J5b (~104–108)
- Modify: file này (đánh `[x]`), `plan.md` mục 14 (một dòng), `CODE_MAP.md:458`

- [ ] **Step 1 (làm NGAY đầu PR, commit riêng):** thay đoạn Q-B bằng:
  `- **Q-B:** ĐÃ CHỐT 02/10 — **CHƯA LÀM → làm ở PR-GVb** (docs/superpowers/plans/2026-10-03-pr-gvb-cho-duyet.md). Đoạn ghi "Đã mở ở tab Tất cả…" trước đây sai: main vẫn chỉ duyệt nhiều khi lọc một phân loại (HopChoDuyet.tsx:70). Đặc tả giữ: Tất cả + "Chọn hết n" (cùng loại, ≤50), "Nhắc tất cả (n)", không nhắc lặp trong ngày, báo thành công một phần.`
  Commit: `git commit -am "Kế hoạch UX 02/10: Q-B ghi chưa làm, chuyển PR-GVb"`.
- [ ] **Step 2 (cuối PR):** Q-B → "XONG ở PR-GVb (#…)" + giới hạn G5 (Công việc › Của GV chưa có Nhắc tất cả); J5, J5b → `[x]`; `CODE_MAP.md` dòng Hộp Chờ duyệt thêm `nhomCuaLoai`, `chonMot`, `chonHet`, `tomTatHangLoat`, `chipChoDuyet`, `nhacNhieu`, `TONE_TRANG_THAI` (shared); bỏ `dongPhuChoDuyet`.
- [ ] **Step 3: Commit** — `git commit -am "PR-GVb: cập nhật kế hoạch, CODE_MAP"`

---

**Nghiệm thu PR-GVb:**
- `npm run check` xanh; mọi phép GVb (1)–(8) xanh; PR-DUYET, PR-Dọn-a, UX-G, hocVienLop vẫn xanh (kỳ vọng đổi có ghi chú PR-GVb).
- Hộp Chờ duyệt: duyệt nhiều được ở tab **Tất cả**, chỉ cùng một loại, "Chọn hết n" ≤ 50, kết quả một câu "Đã duyệt 7/9 — 2 không có quyền". Máy chủ kiểm quyền từng thẻ (phép GVb (2)).
- Tab **Để QL biết** riêng, không có nút Duyệt; "Nhắc tất cả (n)"; nhắc lại trong ngày không tạo thông báo mới (phép GVb (3)).
- Badge Công việc = chip "Tất cả" = số dòng có nút Duyệt/Trả lời = số "chờ" ở Tổng quan QL (một hàm `demHop`).
- Dải Tổng quan QL là hàng chip, không còn câu "gồm … (…)".
- "n bài chờ chấm" tím như Lịch Test; "Bị từ chối" kiểu Cần làm ở Tổng quan GV, hộp duyệt, Yêu cầu của tôi, CasePanel.
- Ảnh 1440/375 sáng/tối: hộp (3 tab, thanh chọn), dải Tổng quan QL, danh sách lớp, Tổng quan GV — bấm thử 3 vai (Quản trị toàn hệ thống, QL Monbay, GV).
- `/impeccable audit` không còn lỗi P0/P1 trong phạm vi; `/ponytail-review` đã chạy; mô tả PR liệt kê chú thích `ponytail:`, báo từng ID, ghi giả định G1–G7 và giới hạn G5.

## Prompt cho session code

```
/ponytail lite

Làm PR-GVb trong docs/superpowers/plans/2026-10-03-pr-gvb-cho-duyet.md (Task GVb-1 → GVb-9). Nhánh mới từ main mới nhất: pr-gvb-cho-duyet.
Đọc trước: CLAUDE.md; mục Global Constraints, Skill bắt buộc, Giả định của kế hoạch; docs/superpowers/plans/2026-10-03-lo-trinh-tong-hop-viec-chua-lam.md ("Quyết định 03/10", "Áp cho mọi PR"); thiet-ke/HE_GIAO_DIEN.md.
Skill: anthropic-skills:subagent-driven-development để chạy từng task; anthropic-skills:test-driven-development mỗi task (phép kiểm đỏ trên DB test trước, không quét nguồn khi kiểm được hành vi); anthropic-skills:brainstorming khi gặp điểm trái Giả định → ghi câu hỏi vào mô tả PR, không tự đổi luật; anthropic-skills:verification-before-completion trước khi báo xong mỗi task.
Làm GVb-9 Step 1 (Q-B ghi CHƯA LÀM) đầu tiên.
Impeccable: /impeccable critique màn Chờ duyệt (hộp + dải Tổng quan QL) trước GVb-4; /impeccable layout + /impeccable clarify khi sửa GVb-4..GVb-7, chỉ trong phạm vi PR; /impeccable audit trước khi mở PR. Không chạy init/document/hooks on/install.
Không bao giờ nới quyền: máy chủ kiểm quyền từng thẻ khi duyệt/nhắc hàng loạt. Luật S3. Đổi file → sửa CODE_MAP.md.
npm run check xanh → bấm thử 375/1440 sáng/tối với 3 vai (Quản trị toàn hệ thống, QL Monbay, GV) → ảnh.
Xong: đánh dấu [x], dòng mục 14 plan.md, /ponytail-review, liệt kê chú thích ponytail:, anthropic-skills:requesting-code-review, anthropic-skills:finishing-a-development-branch → mở PR (không merge). Mô tả PR báo từng ID D01/J5/J5b/U01/Bị từ chối + giả định G1–G7.
```
