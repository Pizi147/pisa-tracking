# PR-LUI-b · Đường lui Học viên & Lớp — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Model: Opus 5.5 hoặc Sonnet 5.5 — không Fable** (CLAUDE.md, 06/10).

**Goal:** Cho Quản lý / Quản trị đường lui cho ba việc đang "không lùi được": (1) **Học lại** cho em đã kết thúc học; (2) **Mở lại lớp** đã kết thúc; (3) **Kết thúc học · Lưu trữ · Huỷ quyết định chuyển lớp** cho nhiều em một lần — mỗi việc có nhật ký, lùi lại được, và có màn xem trước trước khi làm hàng loạt.

**Architecture:** Không viết luật mới cho trạng thái em — mọi đường đi qua hàm đã có (`setStudentStatus`, `archiveStudent`, `unarchiveStudent`, `huyLenh`). Thêm đúng hai hàm đảo: `hocLai` (đảo `setStudentStatus(…,'finished')`) và `moLaiLop` (đảo `ketThucLop`). Làm nhiều em = vòng lặp qua hàm sẵn có, MỖI EM MỘT GIAO DỊCH, web gửi từng lô 8 em (cùng mẫu Sửa cả lớp, PR-SL) nên lỗi giữa chừng giữ nguyên phần đã lưu và nói rõ em nào chưa lưu. Nút **Hoàn tác** (toast 5 giây, `HOAN_TAC_MS`) gọi việc ngược lại cho đúng các em đã làm được.

**Tech Stack:** TypeScript (`tsc`, import có đuôi `.ts`/`.tsx`), Express + SQLite/Turso (`db()`, `tx()`, `theoLo()`), React + Tailwind (`KhungPanel`, `useApi`, `useToast`), phép kiểm `server/src/tests/prLuiB.tests.ts` gọi ở cuối `run.ts`.

**Spec:** `docs/superpowers/specs/2026-10-06-ra-soat-duong-lui.md` (B1 dòng Học viên / Lớp / Chuyển lớp; C đề xuất 9, 10) + `plan.md` mục 4 "PR-LUI" phần **b** (chủ sản phẩm 06/10). Mockup: `thiet-ke/mockup-duong-lui-hoc-vien-lop-2026-10-06.html` (**phải được duyệt trước khi code**).

## Global Constraints

- **Chỉ QL / Quản trị.** Quyền kiểm ở MÁY CHỦ, không chỉ ẩn nút: em → `PLAN_WEEK {studentId}` (cùng `archiveStudent`); lớp → `CLASS_EDIT {classId}` (cùng `raLenh`/`huyLenh`); lệnh chuyển → `CLASS_EDIT {classId: lop_nguon_id}`. GVCN / GVBM không thấy mục nào mới, API trả 403. **Không nới quyền GV**: `setStudentStatus` (Tạm dừng / Quay lại / Kết thúc học từng em của GVCN) giữ nguyên.
- **Chữ trên web ngắn** (05/10): nhãn 1–3 từ, không câu giải thích dưới nút/ô; mockup = đúng chữ sẽ hiện. Thời gian trên màn: mã tuần `W2 OCT`; ngày chỉ cho ngày hiệu lực, ngày kết thúc, nhật ký.
- **Mỗi thao tác có nhật ký** (`writeAudit`, một dòng cho từng em / lớp / lệnh) và, với em, một dòng Hành trình (`addJourney`).
- **Làm nhiều em:** ≤ `TOI_DA_HANG_LOAT_EM = 200` em xem trước; một request ghi ≤ `LO_HANG_LOAT_EM = 8` em; mỗi em một giao dịch; lỗi một em không cuộn lại em khác; kiểm dữ liệu nhập, phân quyền, lỗi chống mất dữ liệu **không bao giờ bớt**.
- **Không đụng** (PR-MTa chạy song song): `fasttrack/attempts.ts`, `fasttrack/skillSchedule.ts`, `normal/regular.ts`, `keHoach/keHoachTest.ts`, `duyet/*`. Cần sửa một trong các file này → DỪNG hỏi planning.
- Turso: không tham số đặt tên; `IN (…)` qua `theoLo`; ≤ 900 tham số; `BEGIN IMMEDIATE` đã nằm trong `tx()`.
- Tên skill: `superpowers:<tên>`; giao diện: `impeccable` (`layout`, `clarify`, `harden`, `adapt` 375, cuối `audit`); `/ponytail lite` đầu phiên; cuối `/ponytail-review`.
- Cổng: `PORT=4390`, `WEB_PORT=5390`. Máy yếu RAM: `npm run check` một lần một lúc, OOM thì chạy từng bước (`npm run build:server`, rồi chạy riêng phép kiểm).

---

## Câu cần chủ sản phẩm quyết (gộp 4 câu — mockup vẽ theo **khuyến nghị**)

1. **"Học lại" đưa em về đâu?** — *Khuyến nghị A:* hoàn tác đúng "Kết thúc học": em về **lớp cũ**, lộ trình bị đóng lúc kết thúc **chạy tiếp**, ra khỏi Lưu trữ; lớp cũ đã kết thúc thì **mở lại lớp cùng lúc**; Case đã đóng "Học viên kết thúc khoá" **giữ đóng** (Case mới chỉ sinh theo luật SOS thường). *B:* cho chọn lớp khác + mở lộ trình mới (phải làm thêm nhánh "xếp lớp lại" — to hơn nhiều; em muốn sang lớp khác thì dùng Chuyển lớp sau khi Học lại).
2. **Quản lý có được "Kết thúc lớp" không?** Hiện chỉ Quản trị (24/09). Nếu Quản lý được **Mở lại** mà không **Kết thúc lại** được thì mở nhầm là kẹt. *Khuyến nghị B:* Quản lý cũng Kết thúc lớp (chỉ lớp **không còn em đang học** — máy chủ đã chặn sẵn); **Xoá lớp vẫn chỉ Quản trị**. *A:* Quản lý chỉ Mở lại, Kết thúc lớp vẫn chỉ Quản trị (QL mở nhầm phải nhờ Quản trị). *C:* cả Mở lại cũng chỉ Quản trị.
3. **Chỗ vào làm nhiều em.** *Khuyến nghị A:* một panel **"Nhiều em…"** ở ⋮ hồ sơ lớp (Kết thúc học · Lưu trữ) + ô chọn ở **Lưu trữ › Học viên đã lưu trữ** (Bỏ lưu trữ · Học lại) + nút **Huỷ quyết định** trong ô "Chọn nhiều em" sẵn có của panel Chuyển tiếp lớp. *B:* ô chọn thẳng trên bảng Học viên & Lớp (đụng bảng, thẻ điện thoại, hàng "Cả lớp" — lớn hơn, dễ vỡ bố cục đã duyệt).
4. **Tên nút cho em đã kết thúc.** *Khuyến nghị A:* **"Học lại"** (đúng lời chủ sản phẩm; menu ⋮ hồ sơ em đã kết thúc). Chú ý: "Học lại" còn là một **hướng** ở Chuyển tiếp lớp (lên lớp mới học lại khoá) — khác ngữ cảnh, không đụng nhau trên màn. *B:* "Mở lại học".

**Tôi đã tự quyết (nói rõ để duyệt cùng mockup):**
- Lý do **tuỳ chọn** cho Học lại, Mở lại lớp, Lưu trữ / Bỏ lưu trữ (đảo ngược việc đã làm, nhật ký vẫn ghi ai/lúc nào). **Bắt buộc** như cũ: Kết thúc học (1 ký tự trở lên, `TrangThaiPanel`), Huỷ quyết định (≥ 3 ký tự, `huyLenh`).
- Kết thúc học nhiều em: **một lý do chung** + một ngày hiệu lực chung.
- Hoàn tác: toast 5 giây (cả nhiều em). Máy chủ chỉ cho **Khôi phục quyết định** trong 24 giờ, lệnh do **người** huỷ (không phải máy), em còn ở lớp nguồn, tuần bắt đầu còn ở tương lai, em chưa có quyết định khác.
- Không gửi chuông cho việc Học lại (GVCN thấy em trở lại bảng lớp). Huỷ nhiều quyết định → **một chuông** mỗi người nhận, không một chuông mỗi em.
- GVCN / GVBM: không có mục nào mới (nếu có quyền sửa hồ sơ thì vẫn ⋮ như cũ).

---

## Chữ trên màn (một nguồn — mockup dùng đúng các chữ này)

| Chỗ | Chữ |
|---|---|
| Menu ⋮ hồ sơ em đã kết thúc | `Học lại` (dòng phụ: `về lớp cũ · lộ trình chạy tiếp`) |
| Panel Học lại | tiêu đề `Học lại` · khối `Học lại` · ô `Có hiệu lực từ` (mặc định hôm nay) · ô `Lý do` (tuỳ chọn) · nút `Học lại` · dòng việc sẽ làm: `Về lớp MB FT 101` · `Lộ trình LT1 chạy tiếp` · `Ra khỏi Lưu trữ` · `Mở lại lớp MB FT 101` (chỉ khi lớp đã kết thúc) |
| Toast | `Đã cho Nguyễn Minh Anh học lại` + `Hoàn tác (5)` |
| ⋮ hồ sơ lớp đã kết thúc | `Mở lại lớp` |
| Panel Mở lại lớp | tiêu đề `Mở lại lớp` · `Lớp` · `Chi nhánh` · `Kết thúc` (ngày) · ô `Lý do` (tuỳ chọn) · nút `Mở lại lớp` · toast `Đã mở lại lớp MB FOU 12` |
| Lưu trữ › Lớp đã kết thúc | nút `Mở lại` ở cuối dòng (chỉ QL/QT) |
| ⋮ hồ sơ lớp | `Nhiều em…` |
| Panel Nhiều em, bước 1 | tiêu đề `Nhiều em` · chọn việc `Kết thúc học` / `Lưu trữ` · `Chọn cả lớp` · nút `Tiếp tục · 12 em` |
| Panel Nhiều em, bước 2 | tiêu đề `Kết thúc học · 12 em` · số `Case đóng 4` · `PA huỷ 2` · `Quyết định chuyển lớp huỷ 1` · mục `Bỏ qua 2 em` (mỗi em một lý do ngắn) · ô `Lý do` (bắt buộc với Kết thúc học) · `Có hiệu lực từ` · nút `Kết thúc học 12 em` · nút trái `‹ Sửa` |
| Đang lưu / dở | nút `Đang lưu 8/12…` · dòng chân `Đã lưu 8 em · 4 em chưa lưu` · nút `Thử lại 4 em` · lỗi từng em dưới tên |
| Lưu trữ › Học viên | cột chọn · thanh `3 em đã chọn` + `Bỏ lưu trữ` + `Học lại` + `Bỏ chọn` · nút `Học lại` cuối mỗi dòng |
| Panel Chuyển tiếp (đã có) | thêm nút `Huỷ quyết định` trong ô "n em đang chọn"; khối `Huỷ quyết định 5 em` · `Lên FT 2 · Học lại 3` · `Bỏ qua 2 em chưa có quyết định` · ô `Lý do` · nút `Huỷ quyết định 5 em` |

---

## Cấu trúc file

| File | Việc |
|---|---|
| `shared/domain/hangLoatEm.ts` (**mới**) | hằng + kiểu: `VIEC_HANG_LOAT`, `NHAN_VIEC_HANG_LOAT`, `VIEC_NGUOC`, `LO_HANG_LOAT_EM`, `TOI_DA_HANG_LOAT_EM`, `DongXemTruoc`, `XemTruocHangLoat`, `KetQuaHangLoat` |
| `shared/domain/index.ts` | `export * from './hangLoatEm.ts'` |
| `shared/domain/quanLyHocVien.ts:5-91` | thêm việc `hoc-lai` vào menu ⋮ hồ sơ em |
| `server/src/students/students.ts:316` (sau `setStudentStatus`) | `hocLai()` |
| `server/src/classes/xoaKetThucLop.ts:105-124` | `moLaiLop()`; (Q2-B) `ketThucLop` + `xemXoaKetThuc` đổi cổng sang `CLASS_EDIT` |
| `server/src/classes/loTrinhTiep.ts:286-336` | `lopHocCua().quyen.hocLai` |
| `server/src/classes/classes.ts:790-808` | `viewer.coTheMoLaiLop`, (Q2-B) `viewer.coTheKetThucLop` |
| `server/src/classes/luuTru.ts:11-20,78-88` | cờ `coTheMoLai` mỗi lớp, `coTheHocLai` mỗi em |
| `server/src/students/hangLoat.ts` (**mới**) | `xemTruoc()`, `chay()` — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại nhiều em |
| `server/src/classes/lenhChuyen.ts:230-256` | tách `huyMotLenh`; thêm `huyNhieuLenh()`, `khoiPhucLenh()` |
| `server/src/routes/index.ts` (gần `:1344`, `:1149`, `:1840`) | 5 route mới |
| `web/src/modules/students/hangLoatEm.ts` (**mới**) | `chayHangLoat()` (chia lô, gom kết quả) + `hoanTacHangLoat()` |
| `web/src/modules/students/HangLoatEmPanel.tsx` (**mới**) | panel `Nhiều em` (bước 1 chọn, bước 2 xem trước + xác nhận, lỗi giữa chừng) |
| `web/src/modules/students/StudentManagePanel.tsx:53-70` | `HocLaiPanel` |
| `web/src/modules/classes/XoaKetThucLopPanel.tsx` | `MoLaiLopPanel` |
| `web/src/modules/classes/DauTrangLop.tsx:54,100,131-133` | mục `Nhiều em…`, `Mở lại lớp`, (Q2-B) cổng `Kết thúc lớp` |
| `web/src/modules/classes/ClassOverviewPage.tsx:136-137` | vẽ panel mới |
| `web/src/modules/students/LuuTruPage.tsx:29-148` | `Mở lại` ở tab Lớp; ô chọn + thanh việc + `Học lại` ở tab Học viên |
| `web/src/modules/classes/TransitionPanel.tsx:~210-260` | `Huỷ quyết định` nhiều em + Hoàn tác |
| `server/src/tests/prLuiB.tests.ts` (**mới**) + `server/src/tests/run.ts` (cuối) | phép kiểm |
| `CODE_MAP.md`, `plan.md` mục 11 | cập nhật |

**Đã đọc mã thật (file:dòng) và điều rút ra:**
- `students.ts:245-316` — Kết thúc học đặt `status='finished'`, `finished_at=ngày`, `archived_at=ngày`; ghi danh `active|paused → completed` (**không** đặt `ended_at`, `end_kind` = `ket_thuc`/`dung_hoc`); lộ trình `active → abandoned` với `ended_at = ngày` (đây là **nơi duy nhất** đặt `abandoned`, grep `'abandoned'` toàn repo); đóng Case `course_ended` (huỷ PA `planned|started`, thu hồi tín hiệu — `systemClose.ts:52-100`); Hành trình `finish`. Đường duy nhất tới `finished`: `setStudentStatus` (`transition.ts:326` gọi nó cho hướng "Dừng học hẳn"). → đảo được một cách xác định: ghi danh `completed` mới nhất, lộ trình `abandoned` mới nhất có `ended_at = finished_at`.
- `students.ts:339-349` — `unarchiveStudent` chỉ xoá `archived_at`, **em vẫn `finished`** → "Bỏ lưu trữ" **không** là đường học lại (khớp báo cáo B1).
- `xoaKetThucLop.ts:105-124` — `ketThucLop` chỉ `UPDATE classes SET status='finished', finished_at`; chặn khi `soDangHoc > 0`; cổng `ADMIN_CONFIG`. `luatLoTrinh.ts:163-185` `dongLopNeuHet` cũng tự kết thúc lớp thường hết khoá khi không còn ghi danh `active` — chạy sau mỗi lần đổi trạng thái / chuyển lớp của em.
- `lenhChuyen.ts:230-256` — `huyLenh` chỉ một lệnh `cho`, lý do ≥ 3, một chuông mỗi người nhận mỗi lệnh; `ux_lenh_cho_hv` (`schema.sql:1853`) = mỗi em tối đa một lệnh `cho`. `TransitionPanel.tsx:210-240` đã có cột chọn + ô "Chọn nhiều em" + `huyLenh` từng em (`:150-160`).
- `LuuTruPage.tsx:62-77` — mẫu `toast.hoanTac` cho Bỏ lưu trữ. `SuaCaLopPanel.tsx:120-150` + `shared/domain/nhapHocVien.ts:88-90` (`chiaLo`, `LO_LUU_SUA_CA_LOP = 8`) — mẫu gửi theo lô, "Đã lưu n em · m em chưa lưu".
- `classes.ts:790-806` — lớp đã kết thúc ⇒ **mọi cờ `viewer` = false kể cả Quản trị**, trừ `coTheXoaKetThuc` / `coTheXemDiem` nằm ngoài nhánh `finished`. → `coTheMoLaiLop` phải đặt ngoài nhánh đó.

---

### Task 0: Mockup + duyệt (BƯỚC 1 — đã làm trong lượt này)

**Files:** Create `thiet-ke/mockup-duong-lui-hoc-vien-lop-2026-10-06.html`

- [x] Soạn mockup đủ trạng thái, 375 và 1440, sáng và tối, đúng chữ thật (bảng "Chữ trên màn").
- [ ] Chủ sản phẩm duyệt mockup + trả lời 4 câu. **Chưa duyệt thì không code (CLAUDE.md).**

---

### Task 1: Hằng chung + menu ⋮ hồ sơ em

**Files:**
- Create: `shared/domain/hangLoatEm.ts`
- Modify: `shared/domain/index.ts` (thêm một dòng `export * from './hangLoatEm.ts';` sau dòng `export * from './quanLyHocVien.ts'` hoặc cuối nhóm `export * from`)
- Modify: `shared/domain/quanLyHocVien.ts:5-6, 8-22, 24-27, 47-60, 75-80, 82-91`
- Test: `server/src/tests/prLuiB.tests.ts` (tạo ở bước 1)

**Interfaces:**
- Produces: `VIEC_HANG_LOAT`, `ViecHangLoat`, `NHAN_VIEC_HANG_LOAT`, `VIEC_NGUOC`, `LO_HANG_LOAT_EM`, `TOI_DA_HANG_LOAT_EM`, `KHOI_PHUC_LENH_GIO`, `DongXemTruoc`, `XemTruocHangLoat`, `KetQuaHangLoat`; `ViecQuanLy` thêm `'hoc-lai'`; `LopHocQuyen.hocLai?: boolean`.

- [ ] **Step 1: Tạo `prLuiB.tests.ts` với phép kiểm miền (đỏ)**

```ts
/** PHÉP KIỂM PR-LUI-b — đường lui Học viên & Lớp: Học lại · Mở lại lớp · làm nhiều em · huỷ nhiều quyết định chuyển lớp. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLuiBTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, addDays, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const svc: any = await import('../students/students.ts');
  console.log('\nPR-LUI-b · Đường lui Học viên & Lớp');

  check('LUIb-1 · menu ⋮: "Học lại" hiện đúng khi có quyền hocLai và em đã kết thúc; GVCN không có', () => {
    const quyen = (o: Record<string, boolean>) => ({ lopHoc: { quyen: { ghiLoTrinhTiep: false, chuyenLop: false, tamDung: false, quayLai: false, ketThuc: false, luuTru: false, boLuuTru: false, ...o } } });
    const keys = (o: Record<string, boolean>, status: string) => d.mucQuanLyHocVien({ canEdit: false, cycle: null, status, ...quyen(o) }).map((m: any) => m.key);
    assert(keys({ hocLai: true, boLuuTru: true }, 'finished').join() === 'hoc-lai,bo-luu-tru', keys({ hocLai: true, boLuuTru: true }, 'finished').join());
    assert(!keys({}, 'finished').includes('hoc-lai'), 'không quyền thì không có Học lại');
    const m = d.mucQuanLyHocVien({ canEdit: false, cycle: null, status: 'finished', ...quyen({ hocLai: true }) })[0];
    assert(m.nhan === 'Học lại' && m.nhom === 'lop' && m.phu === 'về lớp cũ · lộ trình chạy tiếp', JSON.stringify(m));
  });

  check('LUIb-2 · hằng làm nhiều em: việc ngược đối xứng, nhãn đủ, lô 8, trần xem trước 200', () => {
    for (const v of d.VIEC_HANG_LOAT) {
      assert(d.VIEC_NGUOC[d.VIEC_NGUOC[v]] === v, `${v} ngược hai lần phải về ${v}`);
      assert(typeof d.NHAN_VIEC_HANG_LOAT[v] === 'string' && d.NHAN_VIEC_HANG_LOAT[v].length > 0, `thiếu nhãn ${v}`);
    }
    assert(d.NHAN_VIEC_HANG_LOAT['ket-thuc'] === 'Kết thúc học' && d.NHAN_VIEC_HANG_LOAT['hoc-lai'] === 'Học lại', 'nhãn');
    assert(d.LO_HANG_LOAT_EM === 8 && d.TOI_DA_HANG_LOAT_EM === 200 && d.KHOI_PHUC_LENH_GIO === 24, 'hằng');
  });
}
```

- [ ] **Step 2: Gọi ở cuối `run.ts` rồi chạy, thấy đỏ**

Thêm vào `server/src/tests/run.ts` ngay TRƯỚC khối `console.log(\`\n${'='.repeat(60)}\`)` (sau khối PR-DL, `run.ts` cuối file):

```ts
// ==================================================================== PR-LUI-b (đường lui Học viên & Lớp)
const { runPrLuiBTests } = await import('./prLuiB.tests.ts');
await runPrLuiBTests({ check, checkAsync, assert, assertThrows, conn, TODAY, P, addDays, classId, seedMax: SEED_MAX });
```

Run: `npm run build:server` rồi chạy phép kiểm như các PR trước (xem `package.json` script `test` / `check`).
Expected: FAIL — `d.VIEC_HANG_LOAT` undefined / `hoc-lai` không có.

- [ ] **Step 3: `shared/domain/hangLoatEm.ts`**

```ts
/**
 * LÀM NHIỀU EM MỘT LẦN (PR-LUI-b, chủ sản phẩm 06/10) — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại. Chỉ Quản lý / Quản trị.
 * MỘT nguồn cho máy chủ (`students/hangLoat.ts`) và web (`HangLoatEmPanel.tsx`): tên việc, nhãn, việc ngược của nút Hoàn tác, trần.
 */
export const VIEC_HANG_LOAT = ['ket-thuc', 'luu-tru', 'bo-luu-tru', 'hoc-lai'] as const;
export type ViecHangLoat = (typeof VIEC_HANG_LOAT)[number];

export const NHAN_VIEC_HANG_LOAT: Record<ViecHangLoat, string> = {
  'ket-thuc': 'Kết thúc học', 'luu-tru': 'Lưu trữ', 'bo-luu-tru': 'Bỏ lưu trữ', 'hoc-lai': 'Học lại',
};

/** Nút Hoàn tác gọi đúng việc ngược này với những em đã làm được. */
export const VIEC_NGUOC: Record<ViecHangLoat, ViecHangLoat> = {
  'ket-thuc': 'hoc-lai', 'hoc-lai': 'ket-thuc', 'luu-tru': 'bo-luu-tru', 'bo-luu-tru': 'luu-tru',
};

/** Một request GHI tối đa số em này (10 s của Netlify; cùng mẫu `LO_LUU_SUA_CA_LOP`). Web chia lô bằng `chiaLo`. */
export const LO_HANG_LOAT_EM = 8;
/** Xem trước một lần tối đa số em này. */
export const TOI_DA_HANG_LOAT_EM = 200;
/** Máy chủ chỉ cho Khôi phục quyết định chuyển lớp đã huỷ trong số giờ này. */
export const KHOI_PHUC_LENH_GIO = 24;

export type DongXemTruoc = {
  studentId: number; ten: string; ma: string; lop: string | null;
  trangThai: 'dang-hoc' | 'tam-dung' | 'da-ket-thuc' | 'luu-tru';
  /** Có chữ = em này KHÔNG được làm (bỏ qua / ngoài quyền / thiếu điều kiện); `null` = làm được. */
  lyDoBo: string | null;
};
export type XemTruocHangLoat = {
  viec: ViecHangLoat; rows: DongXemTruoc[];
  tong: { duoc: number; boQua: number; caseDong: number; paHuy: number; lenhHuy: number; lopMoLai: string[] };
};
export type KetQuaHangLoat = { ok: number[]; failed: { studentId: number; message: string }[] };
```

- [ ] **Step 4: `index.ts` + `quanLyHocVien.ts`**

`shared/domain/index.ts` — thêm `export * from './hangLoatEm.ts';` cạnh `export * from './quanLyHocVien.ts';` (tìm dòng này bằng `grep -n quanLyHocVien shared/domain/index.ts`).

`shared/domain/quanLyHocVien.ts`:
- dòng 5-6: thêm `'hoc-lai'` vào `ViecQuanLy` (sau `'ket-thuc'`).
- `NHAN_VIEC_QUAN_LY`: thêm `'hoc-lai': 'Học lại',`.
- `LopHocQuyen`: thêm `hocLai?: boolean;` (tuỳ chọn để mọi chỗ dựng sẵn không vỡ kiểu).
- trong `mucQuanLyHocVien`, sau dòng `if (quyen?.luuTru) ds.push('luu-tru');` thêm: `if (quyen?.hocLai) ds.push('hoc-lai');` — đặt **trước** `boLuuTru`: sửa thành
  ```ts
  if (quyen?.luuTru) ds.push('luu-tru');
  if (quyen?.hocLai) ds.push('hoc-lai');
  if (quyen?.boLuuTru) ds.push('bo-luu-tru');
  ```
- `NHOM_VIEC`: thêm `'hoc-lai': 'lop',`.
- `PHU_VIEC`: thêm `'hoc-lai': 'về lớp cũ · lộ trình chạy tiếp',`.

- [ ] **Step 5: Chạy lại — xanh**

Run: `npm run build:server` + phép kiểm. Expected: LUIb-1, LUIb-2 PASS; `npm run typecheck` không lỗi (kiểm `web` còn `Record<ViecQuanLy, …>` ở chỗ khác: `grep -rn "Record<ViecQuanLy" web shared server` — chỗ nào bắt buộc đủ khoá thì thêm `'hoc-lai'`).

- [ ] **Step 6: Commit**

```bash
git add shared/domain/hangLoatEm.ts shared/domain/index.ts shared/domain/quanLyHocVien.ts server/src/tests/prLuiB.tests.ts server/src/tests/run.ts
git commit -m "PR-LUI-b: hằng làm nhiều em + mục Học lại ở menu hồ sơ em"
```

---

### Task 2: Máy chủ — `hocLai`, `moLaiLop`, cờ quyền

**Files:**
- Modify: `server/src/students/students.ts` (sau `setStudentStatus`, hết dòng 316; thêm import)
- Modify: `server/src/classes/xoaKetThucLop.ts:11-18, 105-124` (thêm `moLaiLop`)
- Modify: `server/src/classes/loTrinhTiep.ts:286-336` (`quyen.hocLai`)
- Modify: `server/src/classes/classes.ts:790-806` (`coTheMoLaiLop`)
- Modify: `server/src/routes/index.ts` (route mới)
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `setStudentStatus(p, studentId, status, date, reason?, endKind?)`, `require_`, `PERMISSIONS.PLAN_WEEK/CLASS_EDIT`, `datLaiHanCase`, `chotHanXuLy`, `addJourney`, `writeAudit`.
- Produces: `hocLai(p, studentId, o?: { date?: string; lyDo?: string; moLaiLop?: boolean }): student row`; `moLaiLop(p, classId, o?: { lyDo?: unknown }): { ok: true; ma: string }`; `lopHocCua(...).quyen.hocLai: boolean`; `classOverview().viewer.coTheMoLaiLop: boolean`.

- [ ] **Step 1: Viết phép kiểm đỏ**

Thêm vào `runPrLuiBTests` (sau LUIb-2):

```ts
  const emDangHoc = (lop: string): number => (conn.prepare(
    `SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 1`).get(classId(lop)) as any).id;
  const anh = (sid: number) => JSON.stringify({
    s: conn.prepare('SELECT status, finished_at, archived_at FROM students WHERE id = ?').get(sid),
    e: conn.prepare('SELECT id, status, end_kind, class_id, ended_at FROM enrollments WHERE student_id = ? ORDER BY id').all(sid),
    c: conn.prepare('SELECT id, status, ended_at FROM learning_cycles WHERE student_id = ? ORDER BY id').all(sid),
  });
  const maLoi = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e.status ?? 500; } };

  check('LUIb-3 · hocLai đảo ĐÚNG Kết thúc học: học viên, ghi danh, lộ trình về nguyên trạng; có Hành trình + nhật ký', () => {
    const sid = emDangHoc('MB FT 101');
    const truoc = anh(sid);
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    assert(anh(sid) !== truoc, 'Kết thúc học phải đổi dữ liệu');
    svc.hocLai(P.mbManager, sid, { lyDo: 'Bấm nhầm' });
    assert(anh(sid) === truoc, `không về nguyên trạng:\n${truoc}\n${anh(sid)}`);
    const hanhTrinh = conn.prepare(`SELECT event_type, title, detail, created_by FROM journey_events WHERE student_id = ? ORDER BY id DESC LIMIT 1`).get(sid) as any;
    assert(hanhTrinh.event_type === 'resume' && hanhTrinh.title === 'Học lại' && hanhTrinh.detail === 'Bấm nhầm' && hanhTrinh.created_by === P.mbManager.userId, JSON.stringify(hanhTrinh));
    const nk = conn.prepare(`SELECT action, before_json, after_json FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action = 'student.rejoin'`).get(sid) as any;
    assert(nk && JSON.parse(nk.before_json).status === 'finished' && JSON.parse(nk.after_json).status === 'active', JSON.stringify(nk));
  });

  check('LUIb-4 · hocLai: chỉ QL / QT; GVCN 403, QL chi nhánh khác 403; em đang học 400; ngày trước ngày kết thúc 400', () => {
    const sid = emDangHoc('MB FT 101');
    assert(maLoi(() => svc.hocLai(P.mbManager, sid)) === 400, 'em đang học → 400');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    try {
      assert(maLoi(() => svc.hocLai(P.coreTeacher, sid)) === 403, 'GVCN 403');
      assert(maLoi(() => svc.hocLai(P.cpManager, sid)) === 403, 'QL chi nhánh khác 403');
      assert(maLoi(() => svc.hocLai(P.mbManager, sid, { date: addDays(TODAY, -3) })) === 400, 'ngày trước ngày kết thúc');
      assert(maLoi(() => svc.hocLai(P.mbManager, sid, { date: addDays(TODAY, 3) })) === 400, 'ngày tương lai');
      svc.hocLai(P.admin, sid);   // Quản trị làm được
      assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'active', 'QT học lại được');
    } finally {
      if ((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'finished') svc.hocLai(P.mbManager, sid);
    }
  });

  check('LUIb-5 · Case đã đóng "Học viên kết thúc khoá" GIỮ đóng; Hạn xử lý chốt lại từ ngày học lại', () => {
    const sid = (conn.prepare(`SELECT s.id FROM students s JOIN sos_cases c ON c.student_id = s.id AND c.status != 'done'
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' WHERE s.status = 'active' AND e.class_id = ? ORDER BY s.id LIMIT 1`).get(classId('MB FT 101')) as any)?.id as number | undefined;
    assert(sid, 'cần một em có Case mở ở MB FT 101');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    const dong = (conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND system_close_reason = 'course_ended'`).get(sid) as any).n;
    assert(dong > 0, 'Kết thúc học phải đóng Case');
    svc.hocLai(P.mbManager, sid);
    assert((conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND system_close_reason = 'course_ended' AND status = 'done'`).get(sid) as any).n === dong, 'Case đã đóng phải giữ đóng');
  });

  await checkAsync('LUIb-6 · moLaiLop: lớp kết thúc → đang hoạt động, ghi nhật ký; QL đúng chi nhánh / QT được; GVCN, QL khác chi nhánh 403; lớp chưa kết thúc 400', async () => {
    const xk: any = await import('../classes/xoaKetThucLop.ts');
    const lop = classId('MB FOU 12');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    try {
      assert(maLoi(() => xk.moLaiLop(P.normalCoreTeacher, lop)) === 403, 'GVCN 403');
      assert(maLoi(() => xk.moLaiLop(P.cpManager, lop)) === 403, 'QL chi nhánh khác 403');
      xk.moLaiLop(P.mbManager, lop, { lyDo: 'Mở nhầm lớp' });
      const c = conn.prepare('SELECT status, finished_at FROM classes WHERE id = ?').get(lop) as any;
      assert(c.status === 'active' && c.finished_at === null, JSON.stringify(c));
      const nk = conn.prepare(`SELECT before_json, after_json FROM audit_logs WHERE entity_type = 'class' AND entity_id = ? AND action = 'class.reopened' ORDER BY id DESC LIMIT 1`).get(lop) as any;
      assert(nk && JSON.parse(nk.before_json).status === 'finished' && JSON.parse(nk.after_json).lyDo === 'Mở nhầm lớp', JSON.stringify(nk));
      assert(maLoi(() => xk.moLaiLop(P.mbManager, lop)) === 400, 'lớp đang hoạt động → 400');
    } finally { conn.prepare(`UPDATE classes SET status = 'active', finished_at = NULL WHERE id = ?`).run(lop); }
  });

  check('LUIb-7 · hocLai khi lớp cũ đã kết thúc: không moLaiLop → 400; có moLaiLop → lớp mở lại cùng lúc, một giao dịch', () => {
    const sid = emDangHoc('MB FOU 12');
    const lop = classId('MB FOU 12');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    try {
      assert(maLoi(() => svc.hocLai(P.mbManager, sid)) === 400, 'lớp đã kết thúc, không chọn mở lại → 400');
      assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'finished', '400 không được đổi gì');
      assert(maLoi(() => svc.hocLai(P.mbManager, sid, { moLaiLop: true })) === null, 'có moLaiLop phải xong');
      assert((conn.prepare('SELECT status FROM classes WHERE id = ?').get(lop) as any).status === 'active', 'lớp phải mở lại');
      assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'active', 'em phải đang học');
    } finally { conn.prepare(`UPDATE classes SET status = 'active', finished_at = NULL WHERE id = ?`).run(lop); }
  });
```


- [ ] **Step 2: Chạy — đỏ** (`svc.hocLai is not a function`, `xk.moLaiLop is not a function`).

- [ ] **Step 3: `moLaiLop` trong `xoaKetThucLop.ts`**

Thêm import `chuTuDo` vào dòng `import { badRequest, notFound } from '../util.ts';` → `import { badRequest, chuTuDo, notFound } from '../util.ts';`. Sau hàm `ketThucLop` (hết dòng 124) thêm:

```ts
const CHI_QL_LOP = 'Chỉ Quản lý của lớp này hoặc Quản trị hệ thống mới mở lại được lớp.';

/**
 * MỞ LẠI LỚP ĐÃ KẾT THÚC (PR-LUI-b, chủ sản phẩm 06/10) — ngược của `ketThucLop`. Quản lý của lớp (`class.edit`) hoặc Quản trị. Học viên đã
 * kết thúc học KHÔNG tự quay lại (mỗi em Học lại riêng). Gọi được từ giao dịch khác (`hocLai` mở lớp cùng lúc — `tx` lồng = savepoint).
 * ponytail: lớp thường đã hết khoá mà mở lại khi chưa có em đang học thì `dongLopNeuHet` (luatLoTrinh.ts) có thể kết thúc lại ở lần đổi
 * trạng thái / chuyển lớp kế tiếp của một em trong lớp; Học lại một em vào lớp (ghi danh `active`) thì lớp ở lại.
 */
export function moLaiLop(p: Principal, classId: number, o: { lyDo?: unknown } = {}) {
  require_(p, PERMISSIONS.CLASS_EDIT, { classId }, CHI_QL_LOP);
  const c = docLop(classId);
  if (c.status !== 'finished') throw badRequest('Lớp chưa kết thúc.');
  const lyDo = chuTuDo(o.lyDo, 'Lý do', 2000);
  const conn = db();
  tx(() => {
    conn.prepare(`UPDATE classes SET status = 'active', finished_at = NULL WHERE id = ? AND status = 'finished'`).run(classId);
    writeAudit({
      actorUserId: p.userId, action: 'class.reopened', entityType: 'class', entityId: classId, entityLabel: c.code,
      before: { status: 'finished', finishedAt: c.finished_at }, after: { status: 'active', lyDo },
    });
  });
  return { ok: true, ma: c.code };
}
```

Cập nhật chú thích đầu file: thêm dòng `Mở lại lớp (PR-LUI-b): Quản lý của lớp hoặc Quản trị — xem moLaiLop.`

- [ ] **Step 4: `hocLai` trong `students.ts`**

Thêm import: `import { moLaiLop } from '../classes/xoaKetThucLop.ts';` và đổi dòng util thành `import { badRequest, chuTuDo, isIsoDate, kiemKieuO, normalizeName, notFound, nowIso, padCode } from '../util.ts';`. Sau `setStudentStatus` (sau dòng 316) thêm:

```ts
/**
 * HỌC LẠI (PR-LUI-b, chủ sản phẩm 06/10) — đường lui của "Kết thúc học", CHỈ Quản lý / Quản trị (`plan.week` của em). Làm ngược đúng những
 * gì `setStudentStatus(…, 'finished')` đã làm: em về ghi danh `completed` mới nhất, lộ trình bị đóng LÚC ĐÓ (`abandoned`, `ended_at` = ngày
 * kết thúc — chỗ duy nhất đặt `abandoned`) chạy tiếp, ra khỏi Lưu trữ. Case đã đóng "Học viên kết thúc khoá" GIỮ đóng (không sống lại).
 * Lớp cũ đã kết thúc: `moLaiLop` = true thì mở lại lớp CÙNG giao dịch, không thì 400. Ghi `resume` ("Học lại") để hạn Ý thức / Case tính lại từ
 * ngày học lại như Quay lại học. Lùi lại bằng chính Kết thúc học.
 */
export function hocLai(p: Principal, studentId: number, o: { date?: string; lyDo?: unknown; moLaiLop?: boolean } = {}) {
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, 'Chỉ Quản lý mới cho học viên học lại được.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (s.status !== 'finished') throw badRequest('Chỉ cho học lại được em đã kết thúc học.');
  const date = o.date ?? demoToday();
  if (!isIsoDate(date)) throw badRequest('Ngày không hợp lệ.');
  if (date > demoToday()) throw badRequest('Ngày hiệu lực không được sau hôm nay.');
  if (s.finished_at && date < s.finished_at) throw badRequest(`Ngày học lại không được trước ngày kết thúc học (${String(s.finished_at).split('-').reverse().join('/')}).`);
  const lyDo = chuTuDo(o.lyDo, 'Lý do', 2000);
  const enr = conn.prepare(
    `SELECT e.id, e.class_id, c.code, c.status AS class_status FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ? AND e.status = 'completed' ORDER BY e.id DESC LIMIT 1`,
  ).get(studentId) as any;
  if (!enr) throw badRequest('Em chưa có lớp nào để học lại — dùng Chuyển lớp để xếp lớp.');
  const lopDaDong = enr.class_status === 'finished';
  if (lopDaDong && !o.moLaiLop) throw badRequest(`Lớp ${enr.code} đã kết thúc — mở lại lớp để em học lại.`);

  return tx(() => {
    if (lopDaDong) moLaiLop(p, enr.class_id, { lyDo: `Học lại: ${s.full_name}` });
    conn.prepare(`UPDATE students SET status = 'active', finished_at = NULL, archived_at = NULL WHERE id = ?`).run(studentId);
    conn.prepare(`UPDATE enrollments SET status = 'active', end_kind = NULL WHERE id = ?`).run(enr.id);
    const dangChay = conn.prepare(`SELECT 1 FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(studentId);
    const cu = dangChay ? null : conn.prepare(
      `SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'abandoned' AND ended_at IS ? ORDER BY seq DESC LIMIT 1`,
    ).get(studentId, s.finished_at ?? null) as any;
    if (cu) conn.prepare(`UPDATE learning_cycles SET status = 'active', ended_at = NULL WHERE id = ?`).run(cu.id);
    datLaiHanCase(studentId, date);
    addJourney({ studentId, cycleId: cu?.id ?? null, eventType: 'resume', eventDate: date, title: 'Học lại', detail: lyDo, createdBy: p.userId });
    chotHanXuLy([studentId], { ghiDe: true });   // sau `addJourney`: mốc đọc sự kiện `resume`
    writeAudit({
      actorUserId: p.userId, action: 'student.rejoin', entityType: 'student', entityId: studentId, entityLabel: s.student_code,
      before: { status: 'finished', finishedAt: s.finished_at, archivedAt: s.archived_at },
      after: { status: 'active', date, lyDo, classId: enr.class_id, moLaiLop: lopDaDong },
    });
    return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}
```

- [ ] **Step 5: Cờ quyền**

`loTrinhTiep.ts:286-336` — thêm `hocLai: boolean` vào kiểu `quyen` (dòng 286 `ketThuc: boolean; luuTru: boolean; boLuuTru: boolean;` → thêm `hocLai: boolean;`); nhánh `chiXem` (đã lưu trữ): `hocLai: can(p, PERMISSIONS.PLAN_WEEK, { studentId }),`; nhánh thường: `hocLai: can(p, PERMISSIONS.PLAN_WEEK, { studentId }) && s?.status === 'finished',`; trong nhánh `chiXem` thêm cả `hocLai` bên cạnh `boLuuTru` (đã lưu trữ ⇒ chắc chắn `finished`).

`classes.ts` — trong object `viewer`, **ngoài** nhánh `finished` (cạnh `coTheXoaKetThuc`, dòng ~806): 
```ts
      /** PR-LUI-b: ⋮ "Mở lại lớp" — lớp ĐÃ kết thúc + Quản lý của lớp / Quản trị (nằm ngoài nhánh `finished`: mọi cờ khác của lớp đã đóng đều false). */
      coTheMoLaiLop: finished && can(p, PERMISSIONS.CLASS_EDIT, { classId }),
```
Cập nhật kiểu `HoSoLop['viewer']` ở `web/src/modules/classes/DauTrangLop.tsx:49` (thêm `coTheMoLaiLop?: boolean;`).

- [ ] **Step 6: Route**

`server/src/routes/index.ts` — ngay sau route `/students/:id/unarchive` (`:1853-1856`):

```ts
/** PR-LUI-b: Học lại — đường lui của Kết thúc học. Chỉ Quản lý / Quản trị (máy chủ kiểm `plan.week` của em). */
api.post('/students/:id/hoc-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return studentSvc.hocLai(principalOf(req), pInt(req, 'id'), {
    date: req.body?.date ?? undefined, lyDo: req.body?.lyDo, moLaiLop: req.body?.moLaiLop === true,
  });
}));
```
và sau route `/classes/:id/ket-thuc` (`:1149-1152`):
```ts
/** PR-LUI-b: ⋮ Hồ sơ lớp › Mở lại lớp — Quản lý của lớp hoặc Quản trị. */
api.post('/classes/:id/mo-lai', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return xoaKetThucLopSvc.moLaiLop(principalOf(req), pInt(req, 'id'), { lyDo: req.body?.lyDo });
}));
```

- [ ] **Step 7: Chạy — xanh**

Run: `npm run build:server` + phép kiểm. Expected: LUIb-3…7 PASS. Nếu LUIb-3 lệch (ví dụ `learning_cycles` của em seed không phải `active` trước đó) → đọc `anh()` hai bên, đừng sửa phép kiểm cho khớp: tìm em seed khác (`emDangHoc` lấy em đầu tiên có ghi danh `active`; nếu em đó chưa có lộ trình thì so sánh vẫn đúng).

- [ ] **Step 8: Commit**

```bash
git add server/src/students/students.ts server/src/classes/xoaKetThucLop.ts server/src/classes/loTrinhTiep.ts server/src/classes/classes.ts server/src/routes/index.ts server/src/tests/prLuiB.tests.ts web/src/modules/classes/DauTrangLop.tsx
git commit -m "PR-LUI-b: máy chủ Học lại + Mở lại lớp (đảo Kết thúc học / Kết thúc lớp), cờ quyền"
```

---

### Task 3: Máy chủ — làm nhiều em (xem trước + chạy theo lô)

**Files:**
- Create: `server/src/students/hangLoat.ts`
- Modify: `server/src/routes/index.ts` (hai route)
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `setStudentStatus`, `archiveStudent`, `unarchiveStudent`, `hocLai` (`students.ts`); `VIEC_HANG_LOAT`, `LO_HANG_LOAT_EM`, `TOI_DA_HANG_LOAT_EM`, kiểu `XemTruocHangLoat`, `KetQuaHangLoat`, `DongXemTruoc`.
- Produces: `xemTruoc(p, { viec, studentIds }): XemTruocHangLoat`; `chay(p, { viec, studentIds, lyDo?, date?, moLaiLop? }): KetQuaHangLoat`. Route `POST /hang-loat-hoc-vien/xem-truoc`, `POST /hang-loat-hoc-vien`.

- [ ] **Step 1: Phép kiểm đỏ**

```ts
  await checkAsync('LUIb-8 · làm nhiều em: xem trước đếm đúng Case / PA / lệnh và bỏ qua em không làm được; chạy Kết thúc học rồi Hoàn tác (Học lại) về nguyên trạng', async () => {
    const hl: any = await import('../students/hangLoat.ts');
    const ids = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 3`).all(classId('MB FT 101')) as any[]).map((r) => r.id as number);
    assert(ids.length === 3, 'cần 3 em đang học');
    svc.setStudentStatus(P.mbManager, ids[2], 'finished', TODAY, 'Nghỉ học');   // em này "đã kết thúc rồi"
    const truoc = ids.map(anh).join('|');
    try {
      const xt = hl.xemTruoc(P.mbManager, { viec: 'ket-thuc', studentIds: ids });
      assert(xt.rows.length === 3 && xt.tong.duoc === 2 && xt.tong.boQua === 1, JSON.stringify(xt.tong));
      assert(xt.rows.find((r: any) => r.studentId === ids[2]).lyDoBo === 'Đã kết thúc học', 'em đã kết thúc phải bị bỏ qua có lý do');
      const caseMo = (conn.prepare(
        `SELECT COUNT(*) n FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE COALESCE(sc.student_id, a.student_id) IN (?, ?) AND sc.status != 'done'`).get(ids[0], ids[1]) as any).n;
      assert(xt.tong.caseDong === caseMo, `Case đóng ${xt.tong.caseDong} ≠ ${caseMo}`);
      const kq = hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: ids.slice(0, 2), lyDo: 'Cuối khoá' });
      assert(kq.ok.length === 2 && kq.failed.length === 0, JSON.stringify(kq));
      assert(ids.slice(0, 2).every((id) => (conn.prepare('SELECT status FROM students WHERE id = ?').get(id) as any).status === 'finished'), 'cả hai phải kết thúc');
      const nguoc = hl.chay(P.mbManager, { viec: 'hoc-lai', studentIds: kq.ok, moLaiLop: true });
      assert(nguoc.ok.length === 2, JSON.stringify(nguoc));
      assert(ids.slice(0, 2).map(anh).join('|') === truoc.split('|').slice(0, 2).join('|'), 'Hoàn tác phải về nguyên trạng');
    } finally { if ((conn.prepare('SELECT status FROM students WHERE id = ?').get(ids[2]) as any).status === 'finished') svc.hocLai(P.mbManager, ids[2]); }
  });

  await checkAsync('LUIb-9 · làm nhiều em: lỗi MỘT em không cuộn lại em khác; ngoài quyền / thiếu điều kiện ghi "message"; GVCN 403 cả lô; > 8 em một lần ghi 400; > 200 em xem trước 400', async () => {
    const hl: any = await import('../students/hangLoat.ts');
    const trongMb = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 2`).all(classId('MB FT 101')) as any[]).map((r) => r.id as number);
    const ngoai = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id WHERE b.code != 'MB' AND s.status = 'active' ORDER BY s.id LIMIT 1`).get() as any).id as number;
    const lop = [trongMb[0], ngoai, trongMb[1]];
    try {
      const kq = hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: lop, lyDo: 'Cuối khoá' });
      assert(kq.ok.join() === [trongMb[0], trongMb[1]].join() && kq.failed.length === 1 && kq.failed[0].studentId === ngoai && kq.failed[0].message === 'Ngoài phạm vi của bạn.', JSON.stringify(kq));
      assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(ngoai) as any).status === 'active', 'em ngoài quyền không được đổi');
      assert(maLoi(() => hl.chay(P.coreTeacher, { viec: 'ket-thuc', studentIds: trongMb, lyDo: 'x' })) === 403, 'GVCN 403 cả lô');
      assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: Array.from({ length: 9 }, (_, i) => i + 1), lyDo: 'x' })) === 400, '9 em một lần ghi');
      assert(maLoi(() => hl.xemTruoc(P.mbManager, { viec: 'ket-thuc', studentIds: Array.from({ length: 201 }, (_, i) => i + 1) })) === 400, '201 em xem trước');
      assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [] })) === 400 && maLoi(() => hl.chay(P.mbManager, { viec: 'xoa', studentIds: [1] })) === 400, 'rỗng / việc lạ');
      assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [trongMb[0]] })) === 400, 'Kết thúc học không lý do → 400');
    } finally { for (const id of trongMb) if ((conn.prepare('SELECT status FROM students WHERE id = ?').get(id) as any).status === 'finished') svc.hocLai(P.mbManager, id); }
  });

  await checkAsync('LUIb-10 · Lưu trữ / Bỏ lưu trữ nhiều em: chỉ em đã kết thúc; Bỏ lưu trữ không làm em học lại', async () => {
    const hl: any = await import('../students/hangLoat.ts');
    const sid = emDangHoc('MB FT 101');
    try {
      assert(hl.xemTruoc(P.mbManager, { viec: 'luu-tru', studentIds: [sid] }).rows[0].lyDoBo === 'Chưa kết thúc học', 'em đang học không lưu trữ được');
      hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [sid], lyDo: 'Cuối khoá' });
      assert(hl.chay(P.mbManager, { viec: 'bo-luu-tru', studentIds: [sid] }).ok.length === 1, 'bỏ lưu trữ');
      const s = conn.prepare('SELECT status, archived_at FROM students WHERE id = ?').get(sid) as any;
      assert(s.status === 'finished' && s.archived_at === null, `bỏ lưu trữ không phải học lại: ${JSON.stringify(s)}`);
      assert(hl.chay(P.mbManager, { viec: 'luu-tru', studentIds: [sid] }).ok.length === 1, 'lưu trữ lại');
      assert((conn.prepare('SELECT archived_at FROM students WHERE id = ?').get(sid) as any).archived_at !== null, 'đã lưu trữ');
    } finally { if ((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'finished') svc.hocLai(P.mbManager, sid); }
  });
```

- [ ] **Step 2: Chạy — đỏ** (không tìm thấy `../students/hangLoat.ts`).

- [ ] **Step 3: `server/src/students/hangLoat.ts`**

```ts
import { db, theoLo, tx } from '../db.ts';
import {
  LO_HANG_LOAT_EM, PERMISSIONS, TOI_DA_HANG_LOAT_EM, VIEC_HANG_LOAT,
  type DongXemTruoc, type KetQuaHangLoat, type ViecHangLoat, type XemTruocHangLoat,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { HttpError, badRequest, chuTuDo, forbidden } from '../util.ts';
import { can, napTruocPhamVi, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { chanGiaoDichNeuSapHetGio } from '../platform/hanGio.ts';
import { archiveStudent, hocLai, setStudentStatus, unarchiveStudent } from './students.ts';

/**
 * LÀM NHIỀU EM MỘT LẦN (PR-LUI-b, chủ sản phẩm 06/10) — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại. CHỈ Quản lý / Quản trị (`plan.week` của TỪNG em).
 * Không có luật riêng: mỗi em đi qua đúng hàm một em (`setStudentStatus`, `archiveStudent`, `unarchiveStudent`, `hocLai`). MỖI EM MỘT GIAO DỊCH —
 * lỗi một em (ngoài quyền, sai trạng thái, máy chủ sắp hết giờ) không cuộn lại các em đã xong; kết quả trả `ok` + `failed` để web nói "Đã lưu n em · m em chưa lưu".
 * ponytail: không có "một giao dịch cho cả lô" — cố ý (lỗi giữa chừng phải giữ phần đã lưu); thêm khoá chống gửi trùng nếu cần: các việc đều lặp lại an toàn.
 */
const CHI_QL = 'Chỉ Quản lý mới làm được việc này cho nhiều học viên.';

function docViec(v: unknown): ViecHangLoat {
  if (!(VIEC_HANG_LOAT as readonly unknown[]).includes(v)) throw badRequest('Việc không hợp lệ.');
  return v as ViecHangLoat;
}
function docIds(v: unknown, toiDa: number): number[] {
  if (!Array.isArray(v) || !v.length) throw badRequest('Chưa chọn học viên nào.');
  const ids = [...new Set(v.map(Number))];
  if (ids.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Mã học viên không hợp lệ.');
  if (ids.length > toiDa) throw badRequest(`Tối đa ${toiDa} học viên một lần.`);
  return ids;
}

/** Em này có làm được `viec` không? Chữ = KHÔNG (lý do ngắn hiện ở màn xem trước và ở "chưa lưu"); `null` = làm được. */
function lyDoBo(p: Principal, viec: ViecHangLoat, s: any, lopCuoi: any): string | null {
  if (!can(p, PERMISSIONS.PLAN_WEEK, { studentId: s.id })) return 'Ngoài phạm vi của bạn.';
  switch (viec) {
    case 'ket-thuc': return s.status === 'finished' ? 'Đã kết thúc học' : null;
    case 'luu-tru': return s.status !== 'finished' ? 'Chưa kết thúc học' : s.archived_at ? 'Đã lưu trữ' : null;
    case 'bo-luu-tru': return s.archived_at ? null : 'Chưa lưu trữ';
    case 'hoc-lai': return s.status !== 'finished' ? 'Đang học' : lopCuoi?.status !== 'completed' ? 'Chưa có lớp để học lại' : null;
  }
}

function docEm(ids: number[]) {
  const conn = db();
  const em = new Map<number, any>();
  const lopCuoi = new Map<number, any>();
  theoLo(ids, (lo, ph) => {
    for (const s of conn.prepare(`SELECT id, student_code, full_name, status, archived_at FROM students WHERE id IN (${ph})`).all(...lo) as any[]) em.set(s.id, s);
    /* Ghi danh MỚI NHẤT mỗi em (id lớn nhất đè) — cùng cách `hocLai` chọn dòng `completed` cuối. */
    for (const e of conn.prepare(
      `SELECT e.student_id, e.status, e.class_id, c.code, c.status AS class_status FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.student_id IN (${ph}) ORDER BY e.id`,
    ).all(...lo) as any[]) lopCuoi.set(e.student_id, e);
  });
  return { em, lopCuoi };
}

/** POST /hang-loat-hoc-vien/xem-truoc — KHÔNG ghi gì. Mỗi em một dòng (`lyDoBo`) + số hệ quả của cả lô. */
export function xemTruoc(p: Principal, input: { viec?: unknown; studentIds?: unknown }): XemTruocHangLoat {
  const viec = docViec(input?.viec);
  const ids = docIds(input?.studentIds, TOI_DA_HANG_LOAT_EM);
  napTruocPhamVi(ids);
  const { em, lopCuoi } = docEm(ids);
  const rows: DongXemTruoc[] = ids.map((id) => {
    const s = em.get(id);
    if (!s) return { studentId: id, ten: `#${id}`, ma: '', lop: null, trangThai: 'dang-hoc', lyDoBo: 'Không tìm thấy học viên.' };
    const l = lopCuoi.get(id) ?? null;
    return {
      studentId: id, ten: s.full_name, ma: s.student_code, lop: l?.code ?? null,
      trangThai: s.archived_at ? 'luu-tru' : s.status === 'finished' ? 'da-ket-thuc' : s.status === 'inactive' ? 'tam-dung' : 'dang-hoc',
      lyDoBo: lyDoBo(p, viec, s, l),
    };
  });
  const duoc = rows.filter((r) => !r.lyDoBo);
  const tong = { duoc: duoc.length, boQua: rows.length - duoc.length, caseDong: 0, paHuy: 0, lenhHuy: 0, lopMoLai: [] as string[] };
  if (viec === 'ket-thuc' && duoc.length) {
    const conn = db();
    theoLo(duoc.map((r) => r.studentId), (lo, ph) => {
      /* Cùng cách chọn Case của `closeCasesBySystem` (`systemClose.ts:67-73`): em của Case = `student_id` hoặc em của lượt Test gắn Case. */
      tong.caseDong += (conn.prepare(
        `SELECT COUNT(*) n FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE COALESCE(sc.student_id, a.student_id) IN (${ph}) AND sc.status != 'done'`,
      ).get(...lo) as any).n;
      tong.paHuy += (conn.prepare(
        `SELECT COUNT(*) n FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE COALESCE(sc.student_id, a.student_id) IN (${ph}) AND sc.status != 'done' AND iv.status IN ('planned', 'started')`,
      ).get(...lo) as any).n;
      /* Lệnh còn chờ của em đã rời lớp nguồn sẽ bị máy tự huỷ lúc thi hành (`lenhChuyen.ts` — "Em không còn học lớp nguồn"). */
      tong.lenhHuy += (conn.prepare(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND student_id IN (${ph})`).get(...lo) as any).n;
    });
  }
  if (viec === 'hoc-lai') {
    tong.lopMoLai = [...new Set(duoc.map((r) => lopCuoi.get(r.studentId)).filter((l) => l?.class_status === 'finished').map((l) => l.code as string))];
  }
  return { viec, rows, tong };
}

/** POST /hang-loat-hoc-vien — làm ≤ `LO_HANG_LOAT_EM` em. Trả `ok` (đã làm, kể cả em ở sẵn trạng thái đó) và `failed` (em nào, vì sao chưa). */
export function chay(p: Principal, input: { viec?: unknown; studentIds?: unknown; lyDo?: unknown; date?: unknown; moLaiLop?: unknown }): KetQuaHangLoat {
  const viec = docViec(input?.viec);
  const ids = docIds(input?.studentIds, LO_HANG_LOAT_EM);
  const lyDo = chuTuDo(input.lyDo, 'Lý do', 2000);
  const date = typeof input.date === 'string' && input.date ? input.date : demoToday();
  if (viec === 'ket-thuc' && !lyDo) throw badRequest('Ghi lý do kết thúc học.');
  napTruocPhamVi(ids);
  const { em, lopCuoi } = docEm(ids);
  /* Không em nào trong phạm vi người gọi → 403 cả lô (GVCN gọi thẳng API). */
  if (!ids.some((id) => em.has(id) && can(p, PERMISSIONS.PLAN_WEEK, { studentId: id }))) throw forbidden(CHI_QL);

  const kq: KetQuaHangLoat = { ok: [], failed: [] };
  for (const id of ids) {
    const s = em.get(id);
    const bo = s ? lyDoBo(p, viec, s, lopCuoi.get(id) ?? null) : 'Không tìm thấy học viên.';
    if (bo) { kq.failed.push({ studentId: id, message: bo }); continue; }
    try {
      tx(() => {
        chanGiaoDichNeuSapHetGio();   // sắp hết giờ → 503 "chưa lưu" cho em này (và các em sau)
        if (viec === 'ket-thuc') setStudentStatus(p, id, 'finished', date, lyDo ?? undefined);
        else if (viec === 'luu-tru') archiveStudent(p, id);
        else if (viec === 'bo-luu-tru') unarchiveStudent(p, id);
        else hocLai(p, id, { date: typeof input.date === 'string' && input.date ? input.date : undefined, lyDo, moLaiLop: input.moLaiLop === true });
      });
      kq.ok.push(id);
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      kq.failed.push({ studentId: id, message: e.message });
    }
  }
  if (kq.ok.length) {
    writeAudit({ actorUserId: p.userId, action: 'student.hang_loat', entityType: 'student', entityId: null,
      after: { viec, soEm: kq.ok.length, soLoi: kq.failed.length, studentIds: kq.ok, lyDo, date } });
  }
  return kq;
}
```

- [ ] **Step 4: Route** (cạnh các route học viên, trước `// === Họp tuần` ~dòng 1858)

```ts
/** PR-LUI-b: làm nhiều em một lần — Kết thúc học · Lưu trữ · Bỏ lưu trữ · Học lại. Chỉ Quản lý / Quản trị (kiểm từng em ở máy chủ). */
api.post('/hang-loat-hoc-vien/xem-truoc', requireAuth, wrap((req) => hangLoatSvc.xemTruoc(principalOf(req), req.body ?? {})));
api.post('/hang-loat-hoc-vien', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return hangLoatSvc.chay(principalOf(req), req.body ?? {});
}));
```
và import đầu file cạnh `studentSvc`: `import * as hangLoatSvc from '../students/hangLoat.ts';` (xem cách `studentSvc` được import: `grep -n "studentSvc" server/src/routes/index.ts | head -2`).

- [ ] **Step 5: Chạy — xanh.** Expected: LUIb-8, 9, 10 PASS. Nếu LUIb-9 báo `ngoai` không tìm được (seed không có em ở chi nhánh khác `MB`): đọc `branches.code` thật bằng `SELECT code FROM branches` rồi sửa điều kiện — **không** bỏ phép kiểm ngoài phạm vi.

- [ ] **Step 6: Commit**

```bash
git add server/src/students/hangLoat.ts server/src/routes/index.ts server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: máy chủ làm nhiều em (xem trước + chạy theo lô, mỗi em một giao dịch)"
```

---

### Task 4: Máy chủ — huỷ nhiều quyết định chuyển lớp + Khôi phục

**Files:**
- Modify: `server/src/classes/lenhChuyen.ts:230-256` (tách `huyMotLenh`; thêm `huyNhieuLenh`, `khoiPhucLenh`)
- Modify: `server/src/routes/index.ts` (hai route, cạnh `:1344`)
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `docLenh`, `kiemConSuaDuoc`, `nguoiNhanCuaLop`, `thongBaoSapNhan`, `KHOI_PHUC_LENH_GIO`.
- Produces: `huyNhieuLenh(p, ids: number[], lyDo: unknown): { ok: number[]; failed: { id: number; studentId: number; message: string }[] }`; `khoiPhucLenh(p, ids: number[]): same`. Route `POST /lenh-chuyen/huy-nhieu {ids, lyDo}`, `POST /lenh-chuyen/khoi-phuc {ids}`.

- [ ] **Step 1: Phép kiểm đỏ**

```ts
  await checkAsync('LUIb-11 · huỷ nhiều quyết định chuyển lớp: một chuông mỗi người nhận; em lỗi không cuộn lại em khác; Khôi phục chỉ lệnh do NGƯỜI huỷ, còn tương lai, em chưa có lệnh khác', async () => {
    const lenh: any = await import('../classes/lenhChuyen.ts');
    const nguon = classId('MB FT 101');
    const em = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = s.id AND l.trang_thai = 'cho')
        ORDER BY s.id LIMIT 3`).all(nguon) as any[]).map((r) => r.id as number);
    assert(em.length === 3, 'cần 3 em chưa có quyết định');
    const tuan = d.tuanChonDuoc(TODAY)[0];
    const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'giua-khoa', tuanChung: null, dongs: em.map((studentId) => ({
      studentId, huong: 'bao_luu', tuan, lyDo: 'Đi xa', ngayXemLai: addDays(TODAY, 60) })) });
    assert(r.ok.length === 3 && r.failed.length === 0, JSON.stringify(r));
    const idLenh = (sid: number) => (conn.prepare(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(sid) as any).id as number;
    const ids = em.map(idLenh);
    try {
      assert(maLoi(() => lenh.huyNhieuLenh(P.mbManager, ids, 'ab')) === 400, 'lý do < 3 ký tự');
      assert(maLoi(() => lenh.huyNhieuLenh(P.cpManager, ids, 'Đã đổi ý')) === 403, 'QL chi nhánh khác 403 cả lô');
      conn.prepare(`DELETE FROM notifications WHERE kind = 'huy_lenh'`).run();
      const kq = lenh.huyNhieuLenh(P.mbManager, [...ids, 999999], 'Đã đổi ý');
      assert(kq.ok.length === 3 && kq.failed.length === 1 && kq.failed[0].id === 999999, JSON.stringify(kq));
      assert(ids.every((id) => (conn.prepare('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?').get(id) as any).trang_thai === 'huy'), 'cả ba phải huỷ');
      const chuong = conn.prepare(`SELECT user_id, COUNT(*) n FROM notifications WHERE kind = 'huy_lenh' GROUP BY user_id`).all() as any[];
      assert(chuong.every((c) => c.n === 1), `một chuông mỗi người nhận, không một chuông mỗi em: ${JSON.stringify(chuong)}`);
      /* Khôi phục */
      assert(maLoi(() => lenh.khoiPhucLenh(P.cpManager, ids)) === 403, 'QL chi nhánh khác 403');
      const kp = lenh.khoiPhucLenh(P.mbManager, ids);
      assert(kp.ok.length === 3 && kp.failed.length === 0, JSON.stringify(kp));
      assert(ids.every((id) => { const l = conn.prepare('SELECT trang_thai, huy_boi, huy_luc, ly_do_huy FROM lenh_chuyen_lop WHERE id = ?').get(id) as any; return l.trang_thai === 'cho' && l.huy_boi === null && l.huy_luc === null && l.ly_do_huy === null; }), 'phải về chờ, xoá dấu huỷ');
      /* Huỷ lại, rồi cho em đã có quyết định khác → khôi phục lệnh cũ phải bị chặn; lệnh máy huỷ (huy_boi NULL) không khôi phục */
      lenh.huyNhieuLenh(P.mbManager, ids, 'Đã đổi ý');
      conn.prepare(`UPDATE lenh_chuyen_lop SET huy_boi = NULL WHERE id = ?`).run(ids[0]);
      const ra2 = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'giua-khoa', tuanChung: null, dongs: [{ studentId: em[1], huong: 'bao_luu', tuan, lyDo: 'Mới', ngayXemLai: addDays(TODAY, 60) }] });
      assert(ra2.ok.length === 1, JSON.stringify(ra2));
      const kp2 = lenh.khoiPhucLenh(P.mbManager, ids);
      const lyDoLoi = Object.fromEntries(kp2.failed.map((f: any) => [f.id, f.message]));
      assert(kp2.ok.join() === String(ids[2]) && lyDoLoi[ids[0]] === 'Quyết định do hệ thống huỷ — không khôi phục được.' && lyDoLoi[ids[1]] === 'Em đã có quyết định chuyển lớp khác.', JSON.stringify(kp2));
      /* quá 24 giờ */
      conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy', huy_boi = ?, huy_luc = ? WHERE id = ?`).run(P.mbManager.userId, new Date(Date.now() - 25 * 3600_000).toISOString(), ids[2]);
      assert(lenh.khoiPhucLenh(P.mbManager, [ids[2]]).failed[0].message === 'Đã quá 24 giờ — ra quyết định mới.', 'quá 24 giờ');
    } finally { conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE student_id IN (${em.join(',')}) AND trang_thai = 'cho'`).run(); }
  });
```

- [ ] **Step 2: Chạy — đỏ.**

- [ ] **Step 3: `lenhChuyen.ts`** — thay thân `huyLenh` (dòng 230-256) bằng ba hàm; `huyLenh` giữ chữ ký & hành vi (phép kiểm cũ vẫn xanh):

```ts
/** Huỷ MỘT lệnh còn `cho` trong giao dịch đang mở — không kiểm quyền, không gửi chuông (nơi gọi lo). */
function huyMotLenh(p: Principal, l: any, why: string): void {
  const conn = db();
  const r = conn.prepare(
    `UPDATE lenh_chuyen_lop SET trang_thai = 'huy', huy_boi = ?, huy_luc = ?, ly_do_huy = ?, sua_luc = ? WHERE id = ? AND trang_thai = 'cho'`,
  ).run(p.userId, nowIso(), why, nowIso(), l.id);
  if (!r.changes) throw conflict('Quyết định chuyển lớp vừa được thi hành hoặc đã huỷ.');
  const hv = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(l.student_id) as any;
  writeAudit({ actorUserId: p.userId, action: 'lenh_chuyen.huy', entityType: 'student', entityId: l.student_id, entityLabel: hv?.full_name ?? null, before: { huong: l.huong, tuan: l.tuan_bat_dau }, after: { lyDo: why } });
}

export function huyLenh(p: Principal, id: number, lyDo: string): void {
  const l = docLenh(id);
  require_(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id }, CUNG_LOP_CHI_NHANH);
  const why = String(lyDo ?? '').trim();
  if (why.length < 3) throw badRequest('Ghi lý do huỷ quyết định.');
  kiemConSuaDuoc(l);
  tx(() => {
    const conn = db();
    huyMotLenh(p, l, why);
    const hv = conn.prepare('SELECT full_name FROM students WHERE id = ?').get(l.student_id) as any;
    const ma = new Map((conn.prepare('SELECT id, code FROM classes WHERE id IN (?, ?)').all(l.lop_nguon_id, l.lop_dich_id ?? l.lop_nguon_id) as any[]).map((r) => [r.id as number, r.code as string]));
    const nhan = nguoiNhanCuaLop([l.lop_nguon_id, ...(l.lop_dich_id ? [l.lop_dich_id] : [])]);
    const tatCa = new Set([...(nhan.get(l.lop_nguon_id) ?? []), ...(l.lop_dich_id ? nhan.get(l.lop_dich_id) ?? [] : [])]);
    for (const userId of tatCa) {
      if (userId === p.userId) continue;
      notify({
        userId, kind: 'huy_lenh', title: `Đã huỷ quyết định chuyển lớp · ${hv?.full_name ?? 'học viên'}`,
        body: `${ma.get(l.lop_nguon_id)}${l.lop_dich_id ? ` → ${ma.get(l.lop_dich_id)}` : ''} · ${why}`,
        entityType: 'student', entityId: l.student_id, dedupKey: `huy_lenh:${id}`,
      });
    }
  });
}

export type KetQuaLenhNhieu = { ok: number[]; failed: { id: number; studentId: number; message: string }[] };

/**
 * HUỶ NHIỀU QUYẾT ĐỊNH CHUYỂN LỚP MỘT LẦN (PR-LUI-b) — một lý do chung (≥ 3 ký tự như `huyLenh`), mỗi lệnh một giao dịch, lệnh lỗi vào `failed`.
 * Chuông: MỘT cho mỗi người nhận và mỗi lớp nguồn ("Đã huỷ n quyết định chuyển lớp · MB FT 101"), không một chuông mỗi em. ≤ `LO_HANG_LOAT_EM` lệnh một lần ghi.
 */
export function huyNhieuLenh(p: Principal, ids: unknown, lyDo: unknown): KetQuaLenhNhieu {
  const ds = docDanhSachLenh(ids);
  const why = String(lyDo ?? '').trim();
  if (why.length < 3) throw badRequest('Ghi lý do huỷ quyết định.');
  const kq: KetQuaLenhNhieu = { ok: [], failed: [] };
  const daHuy: any[] = [];
  for (const id of ds) {
    let l: any = null;
    try {
      l = docLenh(id);
      require_(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id }, CUNG_LOP_CHI_NHANH);
      kiemConSuaDuoc(l);
      tx(() => huyMotLenh(p, l, why));
      kq.ok.push(id); daHuy.push(l);
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      kq.failed.push({ id, studentId: l?.student_id ?? 0, message: e.message });
    }
  }
  /* Không lệnh nào trong phạm vi người gọi → 403 cả lô. */
  if (!kq.ok.length && kq.failed.length && kq.failed.every((f) => f.message === CUNG_LOP_CHI_NHANH)) throw forbidden(CUNG_LOP_CHI_NHANH);
  guiChuongHuyNhieu(p, daHuy, why);
  return kq;
}

/** Một chuông / người nhận / lớp nguồn. `dedupKey` theo lệnh đầu của nhóm: gọi lại cùng lô không nhân chuông. */
function guiChuongHuyNhieu(p: Principal, ds: any[], why: string) {
  if (!ds.length) return;
  const conn = db();
  const theoNguon = new Map<number, any[]>();
  for (const l of ds) { if (!theoNguon.has(l.lop_nguon_id)) theoNguon.set(l.lop_nguon_id, []); theoNguon.get(l.lop_nguon_id)!.push(l); }
  const lopIds = [...new Set(ds.flatMap((l) => [l.lop_nguon_id, ...(l.lop_dich_id ? [l.lop_dich_id] : [])]))];
  const nhan = nguoiNhanCuaLop(lopIds);
  const ma = new Map<number, string>();
  theoLo(lopIds, (lo, ph) => { for (const r of conn.prepare(`SELECT id, code FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) ma.set(r.id, r.code); });
  for (const [nguonId, nhom] of theoNguon) {
    const tatCa = new Set([...(nhan.get(nguonId) ?? []), ...nhom.flatMap((l) => (l.lop_dich_id ? [...(nhan.get(l.lop_dich_id) ?? [])] : []))]);
    for (const userId of tatCa) {
      if (userId === p.userId) continue;
      notify({
        userId, kind: 'huy_lenh', title: `Đã huỷ ${nhom.length} quyết định chuyển lớp · ${ma.get(nguonId)}`, body: why,
        entityType: 'class', entityId: nguonId, dedupKey: `huy_lenh_lo:${nhom[0].id}`, duong: `/hoc-vien/lop/${nguonId}`,
      });
    }
  }
}

/**
 * KHÔI PHỤC QUYẾT ĐỊNH CHUYỂN LỚP VỪA HUỶ (nút Hoàn tác của huỷ nhiều quyết định). Chỉ lệnh do NGƯỜI huỷ (`huy_boi` có), trong `KHOI_PHUC_LENH_GIO` giờ,
 * em còn ghi danh `active` ở lớp nguồn, em chưa có lệnh `cho` khác, tuần bắt đầu còn ở tương lai, lớp chuyển đến còn hoạt động. Đưa về `cho`, xoá dấu huỷ.
 */
export function khoiPhucLenh(p: Principal, ids: unknown): KetQuaLenhNhieu {
  const ds = docDanhSachLenh(ids);
  const conn = db();
  const kq: KetQuaLenhNhieu = { ok: [], failed: [] };
  const homNay = demoToday();
  const khoi: any[] = [];
  for (const id of ds) {
    let l: any = null;
    try {
      l = docLenh(id);
      require_(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_nguon_id }, CUNG_LOP_CHI_NHANH);
      if (l.trang_thai === 'cho') throw conflict('Quyết định đã ở trạng thái chờ.');
      if (l.trang_thai !== 'huy') throw conflict('Quyết định đã thi hành — không khôi phục được.');
      if (!l.huy_boi) throw conflict('Quyết định do hệ thống huỷ — không khôi phục được.');
      if (Date.now() - Date.parse(String(l.huy_luc)) > KHOI_PHUC_LENH_GIO * 3600_000) throw conflict(`Đã quá ${KHOI_PHUC_LENH_GIO} giờ — ra quyết định mới.`);
      if (l.tuan_bat_dau <= homNay) throw conflict('Tuần bắt đầu đã tới — ra quyết định mới.');
      tx(() => {
        const o = conn.prepare(`SELECT 1 FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(l.student_id);
        if (o) throw conflict('Em đã có quyết định chuyển lớp khác.');
        const con = conn.prepare(`SELECT 1 FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'`).get(l.student_id, l.lop_nguon_id);
        if (!con) throw conflict('Em không còn học lớp nguồn.');
        if (l.lop_dich_id && !conn.prepare(`SELECT 1 FROM classes WHERE id = ? AND status = 'active'`).get(l.lop_dich_id)) throw conflict('Lớp chuyển đến đã kết thúc.');
        conn.prepare(
          `UPDATE lenh_chuyen_lop SET trang_thai = 'cho', huy_boi = NULL, huy_luc = NULL, ly_do_huy = NULL, thu_ngay = NULL, loi = NULL, sua_luc = ?
            WHERE id = ? AND trang_thai = 'huy'`,
        ).run(nowIso(), id);
        writeAudit({ actorUserId: p.userId, action: 'lenh_chuyen.khoi_phuc', entityType: 'student', entityId: l.student_id, before: { trangThai: 'huy' }, after: { huong: l.huong, tuan: l.tuan_bat_dau } });
      });
      kq.ok.push(id); khoi.push(l);
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      kq.failed.push({ id, studentId: l?.student_id ?? 0, message: e.message });
    }
  }
  if (!kq.ok.length && kq.failed.length && kq.failed.every((f) => f.message === CUNG_LOP_CHI_NHANH)) throw forbidden(CUNG_LOP_CHI_NHANH);
  /* Số "Sắp nhận" của lớp chuyển đến đếm lại từ bảng (`thongBaoSapNhan`) — cập nhật chuông cùng ngày. */
  for (const [nguonId, nhom] of Map.groupBy(khoi, (l: any) => l.lop_nguon_id as number)) {
    const nguon = conn.prepare('SELECT * FROM classes WHERE id = ?').get(nguonId) as any;
    const dich = new Map<number, any>();
    for (const l of nhom) if (l.lop_dich_id) dich.set(l.lop_dich_id, conn.prepare('SELECT id, code, programme_code, is_fast_track, branch_id FROM classes WHERE id = ?').get(l.lop_dich_id));
    thongBaoSapNhan(p, nguon, [...dich.keys()], dich, homNay);
  }
  return kq;
}

function docDanhSachLenh(v: unknown): number[] {
  if (!Array.isArray(v) || !v.length) throw badRequest('Chưa chọn quyết định nào.');
  const ds = [...new Set(v.map(Number))];
  if (ds.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Mã quyết định không hợp lệ.');
  if (ds.length > LO_HANG_LOAT_EM) throw badRequest(`Tối đa ${LO_HANG_LOAT_EM} quyết định một lần.`);
  return ds;
}
```
Import bổ sung ở đầu `lenhChuyen.ts`: `HttpError`, `forbidden` từ `'../util.ts'` (dòng 7 hiện `badRequest, chuTuDo, conflict, notFound, nowIso`); `KHOI_PHUC_LENH_GIO`, `LO_HANG_LOAT_EM` từ `shared/domain/index.ts` (dòng 3-6). `Map.groupBy` cần Node ≥ 21 — nếu `tsc` target không có thì thay bằng vòng `for` + `Map` như `guiChuongHuyNhieu`.

Lưu ý phép kiểm: nhóm `failed` 999999 cho `docLenh` ném `notFound` (HttpError 404) → vào `failed` với `studentId: 0` — khớp `kq.failed[0].id === 999999`.

- [ ] **Step 4: Route** (ngay sau route `/lenh-chuyen/:id/huy`, `:1345-1349`). Hai đường nằm **trước** mọi `/lenh-chuyen/:id…` có cùng số đoạn không xảy ra va chạm (khác số đoạn), nhưng đặt sau route `huy` cho gọn:

```ts
/** PR-LUI-b: huỷ nhiều quyết định chuyển lớp một lần + Khôi phục (Hoàn tác). Chỉ Quản lý của lớp nguồn. */
api.post('/lenh-chuyen/huy-nhieu', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return lenhSvc.huyNhieuLenh(principalOf(req), req.body?.ids, req.body?.lyDo);
}));
api.post('/lenh-chuyen/khoi-phuc', requireAuth, wrap((req) => {
  maybeSimulateSaveFailure();
  return lenhSvc.khoiPhucLenh(principalOf(req), req.body?.ids);
}));
```
Kiểm: không có `api.post('/lenh-chuyen/:id', …)` một đoạn cùng method bắt trước (`grep -n "api.post('/lenh-chuyen" server/src/routes/index.ts`).

- [ ] **Step 5: Chạy — xanh** (LUIb-11 + mọi phép kiểm `lenh_chuyen` cũ trong `prCt.tests.ts`, `prS5fA…`).

- [ ] **Step 6: Commit**

```bash
git add server/src/classes/lenhChuyen.ts server/src/routes/index.ts server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: huỷ nhiều quyết định chuyển lớp + Khôi phục, một chuông mỗi người nhận"
```

---

### Task 5: Máy chủ — cờ ở Lưu trữ + (Q2-B) Quản lý kết thúc lớp

**Files:**
- Modify: `server/src/classes/luuTru.ts:11-20, 53-59, 78-88`
- Modify: `server/src/classes/xoaKetThucLop.ts:18, 69-83, 106-109` **(chỉ khi chủ sản phẩm chọn Q2-B)**
- Modify: `server/src/classes/classes.ts:~806` **(Q2-B)**
- Test: `server/src/tests/prLuiB.tests.ts` + sửa `server/src/tests/panelUx3.tests.ts:445-449` nếu đụng

**Interfaces:**
- Produces: `LopLuuTru.coTheMoLai: boolean` (CLASS_EDIT ở lớp); `HocVienLuuTru.coTheHocLai: boolean` (cùng `coTheBoLuuTru`); (Q2-B) `viewer.coTheKetThucLop: boolean`; `xemXoaKetThuc` mở cho `CLASS_EDIT`, `coTheXoa` vẫn chỉ Quản trị.

- [ ] **Step 1: Phép kiểm đỏ**

```ts
  await checkAsync('LUIb-12 · Lưu trữ: cờ coTheMoLai (lớp, QL đúng chi nhánh / QT) và coTheHocLai (em); GVCN false', async () => {
    const lt: any = await import('../classes/luuTru.ts');
    const lop = classId('MB FOU 12');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    try {
      const dong = (p: any) => lt.danhSachLuuTru(p, {}).lop.find((l: any) => l.id === lop);
      assert(dong(P.mbManager)?.coTheMoLai === true && dong(P.admin)?.coTheMoLai === true, 'QL / QT thấy nút Mở lại');
      assert(dong(P.normalCoreTeacher) === undefined || dong(P.normalCoreTeacher).coTheMoLai === false, 'GVCN không có Mở lại');
    } finally { conn.prepare(`UPDATE classes SET status = 'active', finished_at = NULL WHERE id = ?`).run(lop); }
  });
```
Q2-B thêm:
```ts
  await checkAsync('LUIb-13 · (Q2-B) Quản lý kết thúc lớp rỗng được, lớp còn em 400, GVCN 403; Xoá lớp vẫn chỉ Quản trị', async () => {
    const xk: any = await import('../classes/xoaKetThucLop.ts');
    const lop = classId('MB FOU 12');
    assert(maLoi(() => xk.ketThucLop(P.normalCoreTeacher, lop)) === 403, 'GVCN 403');
    assert(maLoi(() => xk.ketThucLop(P.mbManager, lop)) === 400, 'còn em đang học → 400');
    assert(maLoi(() => xk.xoaLop(P.mbManager, lop, { maLop: 'MB FOU 12' })) === 403, 'Xoá lớp vẫn chỉ Quản trị');
    assert(xk.xemXoaKetThuc(P.mbManager, lop).coTheXoa === false, 'QL không thấy Xoá lớp');
  });
```

- [ ] **Step 2: Chạy — đỏ.**

- [ ] **Step 3: `luuTru.ts`** — kiểu `LopLuuTru` thêm `coTheMoLai: boolean;`; `HocVienLuuTru` thêm `coTheHocLai: boolean;`. Trong truy vấn lớp: sau `.map((r) => ({…}))` thêm `coTheMoLai: can(p, PERMISSIONS.CLASS_EDIT, { classId: r.id })` (đọc `classId` từ `r.id`, **ngoài** `.sort` — thêm vào object trả về ở `.map`). Trong `hocVien` map thêm `coTheHocLai: can(p, PERMISSIONS.PLAN_WEEK, { studentId: s.id }),` (cùng điều kiện `coTheBoLuuTru`). Sửa các chỗ dựng giá trị `LopLuuTru`/`HocVienLuuTru` ở web (`LuuTruPage.tsx:12-19`).

- [ ] **Step 4 (chỉ Q2-B): cổng Kết thúc lớp**

`xoaKetThucLop.ts`:
- dòng 18 giữ `CHI_ADMIN` cho `xoaLop`; thêm `const CHI_QL_KET_THUC = 'Chỉ Quản lý của lớp này hoặc Quản trị hệ thống mới kết thúc được lớp.';`
- `xemXoaKetThuc` (dòng 69-83): đổi cổng đầu thành `require_(p, PERMISSIONS.CLASS_EDIT, { classId }, CHI_QL_KET_THUC);`; `coTheXoa: !t.coDuLieu && can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true })` (thêm `can` vào import `'../permissions.ts'`).
- `ketThucLop` (dòng 106-109): `require_(p, PERMISSIONS.CLASS_EDIT, { classId }, CHI_QL_KET_THUC);`.
- `xoaLop` giữ `require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, CHI_ADMIN)` (dòng 87).
- cập nhật chú thích đầu file (dòng 1-10): "Kết thúc lớp: Quản lý của lớp hoặc Quản trị (06/10, Q2-B PR-LUI-b); Xoá lớp: chỉ Quản trị".

`classes.ts` (cạnh `coTheMoLaiLop`): `coTheKetThucLop: !finished && can(p, PERMISSIONS.CLASS_EDIT, { classId }),`; thêm vào kiểu web `DauTrangLop.tsx:49`.

Sửa `panelUx3.tests.ts:445-449` nếu phép kiểm (11) khẳng định QL gọi `xemXoaKetThuc` → 403: đọc phép kiểm, chuyển câu cho đúng luật mới (Xoá lớp vẫn 403 với QL, Kết thúc lớp QL OK) — ghi rõ trong mô tả PR.

- [ ] **Step 5: Chạy — xanh. Step 6: Commit**

```bash
git add server/src/classes/luuTru.ts server/src/classes/xoaKetThucLop.ts server/src/classes/classes.ts server/src/tests/prLuiB.tests.ts server/src/tests/panelUx3.tests.ts web/src/modules/students/LuuTruPage.tsx
git commit -m "PR-LUI-b: cờ Mở lại / Học lại ở Lưu trữ; Quản lý kết thúc lớp rỗng được (Q2-B)"
```

---

### Task 6: Web — Học lại ở hồ sơ em

**Files:**
- Modify: `web/src/modules/students/StudentManagePanel.tsx:53-70` (thêm `case 'hoc-lai'`) + panel mới ở cuối nhóm panel
- Modify: `web/src/modules/students/StudentDetailPage.tsx:222-228` (không đổi nếu `mucQuanLyHocVien` đã trả `hoc-lai` — kiểm `data.lopHoc.quyen.hocLai` có tới web)
- Test: `server/src/tests/prLuiB.tests.ts` (phép kiểm nguồn web như các PR trước dùng `doc(...)`)

**Interfaces:**
- Consumes: `POST /hang-loat-hoc-vien/xem-truoc` (một em → `lop`, `tong.lopMoLai`), `POST /students/:id/hoc-lai`, `POST /students/:id/status` (Hoàn tác = Kết thúc học).
- Produces: `HocLaiPanel` (không export ngoài file).

- [ ] **Step 1: Phép kiểm nguồn đỏ**

Dùng helper `doc()` như `prSl.tests.ts:1-10` (đọc file bằng `fs` + `ROOT`) — thêm đầu `prLuiB.tests.ts` (cạnh dòng `import type { YThucTestKit }`):
```ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
```
rồi thêm phép kiểm:
```ts
  check('LUIb-14 · web Học lại: gọi /hoc-lai, Hoàn tác = Kết thúc học, lý do tuỳ chọn, tự mở lại lớp đã kết thúc', () => {
    const s = doc('web/src/modules/students/StudentManagePanel.tsx');
    assert(s.includes("case 'hoc-lai'") && s.includes('function HocLaiPanel'), 'thiếu panel Học lại');
    assert(s.includes('/hoc-lai`') && s.includes("moLaiLop: true"), 'phải gọi /students/:id/hoc-lai với moLaiLop');
    assert(/toast\.hoanTac\(`Đã cho \$\{studentName\} học lại`/.test(s) && s.includes("status: 'finished'"), 'Hoàn tác phải là Kết thúc học');
    assert(/<Truong nhan="Lý do" tuyChon/.test(s.slice(s.indexOf('function HocLaiPanel'))), 'Lý do phải tuỳ chọn');
  });
```

- [ ] **Step 2: Chạy — đỏ.**

- [ ] **Step 3: `StudentManagePanel.tsx`**

Thêm `case`:
```tsx
    case 'hoc-lai': return <HocLaiPanel {...chung} />;
```
Thêm sau `LuuTruPanel` (hết dòng 180):

```tsx
/**
 * HỌC LẠI (PR-LUI-b, chủ sản phẩm 06/10) — đường lui của Kết thúc học, chỉ Quản lý / Quản trị. Em về lớp cũ, lộ trình chạy tiếp, ra khỏi Lưu trữ;
 * lớp cũ đã kết thúc thì mở lại cùng lúc. Lý do tuỳ chọn. Hoàn tác = Kết thúc học lại (đúng hàm cũ, lý do "Hoàn tác học lại").
 */
function HocLaiPanel({ studentId, studentName, lop, onClose, onDone }: ChungViec) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [ngayHl, setNgayHl] = useState('');
  const [busy, setBusy] = useState(false);
  const [xem, setXem] = useState<XemTruocHangLoat | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const nap = () => {
    setLoi(null);
    api.post<XemTruocHangLoat>('/hang-loat-hoc-vien/xem-truoc', { viec: 'hoc-lai', studentIds: [studentId] })
      .then(setXem).catch((e: any) => setLoi(e.message));
  };
  useEffect(nap, [studentId]);   // eslint-disable-line react-hooks/exhaustive-deps
  const dong = xem?.rows[0] ?? null;
  const chan = dong?.lyDoBo ?? null;
  const moLop = xem?.tong.lopMoLai[0] ?? null;

  const luu = async () => {
    setBusy(true);
    try {
      await api.post(`/students/${studentId}/hoc-lai`, { date: ngayHl || undefined, lyDo: lyDo.trim() || undefined, moLaiLop: true });
      invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/cases');
      toast.hoanTac(`Đã cho ${studentName} học lại`, async () => {
        try {
          await api.post(`/students/${studentId}/status`, { status: 'finished', reason: 'Hoàn tác học lại' });
          invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/cases');
          toast.push('ok', 'Đã hoàn tác');
          onDone();
        } catch (e: any) { toast.push('error', e.message); }
      }, { key: `hoc-lai:${studentId}` });
      onDone();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };

  return (
    <KhungPanel tieuDe={NHAN_VIEC['hoc-lai']} hocVien={studentName} lop={lop} onDong={onClose}
      chan={{
        daSua: !!lyDo.trim() || !!ngayHl,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" onClick={luu} disabled={busy || !dong || !!chan}>Học lại</button>,
      }}>
      {loi ? <ErrorState message={loi} onRetry={nap} />
        : !xem ? <Skeleton rows={3} /> : (
          <Khoi tieuDe="Học lại">
            {chan ? <p className="m-0 text-sm text-late">{chan}</p> : (
              <ul className="m-0 list-none space-y-1 p-0 text-sm text-slate-200">
                <li>Về lớp {dong?.lop}</li>
                <li>Lộ trình chạy tiếp</li>
                <li>Ra khỏi Lưu trữ</li>
                {moLop && <li className="text-soon">Mở lại lớp {moLop}</li>}
              </ul>
            )}
            <Truong nhan="Có hiệu lực từ">
              <ChonNgayGan value={ngayHl} onChange={setNgayHl} soNgay={30} chuaChon="Mặc định: hôm nay" />
            </Truong>
            <Truong nhan="Lý do" tuyChon>
              <input className="field w-full" maxLength={2000} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
            </Truong>
          </Khoi>
        )}
    </KhungPanel>
  );
}
```
Import thêm đầu file: `useEffect` (từ react), `ErrorState, Skeleton` (từ `'../../ui/ui.tsx'`, hiện đã import `NutChon, TargetText`), `type XemTruocHangLoat` (từ `@shared/domain/index.ts`). Dòng "Lộ trình chạy tiếp" nếu em không có lộ trình bị đóng → vẫn hiện (máy chủ không có thông tin; chấp nhận — nếu cần sát hơn, thêm `loTrinhSeChay` vào `xemTruoc` ở Task 3 và ẩn dòng khi `null`: đã ghi trong "Cái bỏ qua" cuối kế hoạch).

- [ ] **Step 4: `StudentDetailPage`** — kiểm `data.lopHoc` (từ `lopHocCua`) đã chứa `quyen.hocLai` (Task 2) và `mucQuanLyHocVien` nhận nó. Không sửa gì thêm nếu `typecheck` xanh. Hồ sơ em đã lưu trữ (chế độ chỉ xem, `chiXem`): menu vẫn vẽ `⋮` vì có mục `hoc-lai`/`bo-luu-tru` — kiểm bằng bấm thử (Task 11).

- [ ] **Step 5: Chạy `npm run check` — xanh. Step 6: Commit**

```bash
git add web/src/modules/students/StudentManagePanel.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web panel Học lại (hồ sơ em đã kết thúc), Hoàn tác = Kết thúc học"
```

---

### Task 7: Web — Mở lại lớp

**Files:**
- Modify: `web/src/modules/classes/XoaKetThucLopPanel.tsx` (thêm `MoLaiLopPanel`)
- Modify: `web/src/modules/classes/DauTrangLop.tsx:49, 54, 100, 131-133`
- Modify: `web/src/modules/classes/ClassOverviewPage.tsx:14, 136-137`
- Modify: `web/src/modules/students/LuuTruPage.tsx:12-19, 106-125`
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `POST /classes/:id/mo-lai`, `viewer.coTheMoLaiLop`, `LopLuuTru.coTheMoLai`.
- Produces: `MoLaiLopPanel({ classId, classCode, chiNhanh?, ketThuc?, onClose, onDone })`; `ViecDauTrang` thêm `'mo-lai-lop' | 'nhieu-em'`.

- [ ] **Step 1: Phép kiểm nguồn đỏ**

```ts
  check('LUIb-15 · web Mở lại lớp: menu ⋮ hồ sơ lớp đã kết thúc + nút Mở lại ở Lưu trữ; Hoàn tác = Kết thúc lớp', () => {
    const p = doc('web/src/modules/classes/XoaKetThucLopPanel.tsx');
    assert(p.includes('export function MoLaiLopPanel') && p.includes('/mo-lai`') && p.includes('/ket-thuc`'), 'panel + Hoàn tác');
    assert(/<Truong nhan="Lý do" tuyChon/.test(p.slice(p.indexOf('MoLaiLopPanel'))), 'Lý do tuỳ chọn');
    const dt = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(dt.includes("nhan: 'Mở lại lớp'") && dt.includes('coTheMoLaiLop'), 'mục ⋮ Mở lại lớp');
    const lt = doc('web/src/modules/students/LuuTruPage.tsx');
    assert(lt.includes('coTheMoLai') && lt.includes('>Mở lại</button>'), 'nút Mở lại ở Lưu trữ');
  });
```

- [ ] **Step 2: Chạy — đỏ. Step 3: `MoLaiLopPanel`** (thêm cuối `XoaKetThucLopPanel.tsx`)

```tsx
/**
 * ⋮ HỒ SƠ LỚP ĐÃ KẾT THÚC › MỞ LẠI LỚP / LƯU TRỮ › MỞ LẠI (PR-LUI-b, 06/10) — Quản lý của lớp hoặc Quản trị. Lý do tuỳ chọn. Hoàn tác = Kết thúc lớp lại
 * (chỉ khi người bấm có quyền kết thúc — nút Hoàn tác không hiện cho người không có, `coTheKetThucLop`).
 */
export function MoLaiLopPanel({ classId, classCode, chiNhanh, ketThuc, coTheKetThucLai, onClose, onDone }: {
  classId: number; classCode: string; chiNhanh?: string | null; ketThuc?: string | null; coTheKetThucLai?: boolean;
  onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const [lyDo, setLyDo] = useState('');
  const [busy, setBusy] = useState(false);
  const moLai = async () => {
    setBusy(true);
    try {
      await api.post(`/classes/${classId}/mo-lai`, { lyDo: lyDo.trim() || undefined });
      invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/tong-quan');
      const loi = `Đã mở lại lớp ${classCode}`;
      if (coTheKetThucLai) {
        toast.hoanTac(loi, async () => {
          try {
            await api.post(`/classes/${classId}/ket-thuc`, {});
            invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/tong-quan');
            toast.push('ok', 'Đã hoàn tác'); onDone();
          } catch (e: any) { toast.push('error', e.message); }
        }, { key: `mo-lai-lop:${classId}` });
      } else toast.push('ok', loi);
      onDone(); onClose();
    } catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  return (
    <KhungPanel tieuDe="Mở lại lớp" lop={classCode} onDong={onClose}
      chan={{ daSua: !!lyDo.trim(), chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy} onClick={moLai}>Mở lại lớp</button> }}>
      <Khoi tieuDe="Mở lại lớp">
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-400">Lớp</dt><dd className="m-0 font-semibold text-slate-100">{classCode}</dd>
          {chiNhanh && (<><dt className="text-slate-400">Chi nhánh</dt><dd className="m-0 text-slate-200">{chiNhanh}</dd></>)}
          {ketThuc && (<><dt className="text-slate-400">Kết thúc</dt><dd className="m-0 text-slate-200">{ketThuc}</dd></>)}
        </dl>
        <Truong nhan="Lý do" tuyChon>
          <input className="field w-full" maxLength={2000} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
        </Truong>
      </Khoi>
    </KhungPanel>
  );
}
```

- [ ] **Step 4: `DauTrangLop.tsx`** — `ViecDauTrang` (dòng 54) thêm `| 'mo-lai-lop' | 'nhieu-em'`; kiểu `viewer` (dòng ~49) thêm `coTheMoLaiLop?: boolean; coTheKetThucLop?: boolean;`; trong `menu` (sau `diem-lop`, trước `Xoá lớp`) thêm:
```tsx
    ...(data.viewer.coTheMoLaiLop ? [{ key: 'mo-lai-lop', nhan: 'Mở lại lớp', onChon: () => onViec('mo-lai-lop') }] : []),
```
(**Q2-B**: dòng 100 `xk` đổi điều kiện nạp thành `data.viewer.coTheXoaKetThuc || data.viewer.coTheKetThucLop`; mục `Xoá lớp` đã chỉ hiện khi `xk.data.coTheXoa` — máy chủ trả `false` với QL ở Task 5; mục `Kết thúc lớp` giữ điều kiện `xk.data.coDuLieu && !xk.data.daKetThuc`.)

`ClassOverviewPage.tsx` — import `MoLaiLopPanel` cùng dòng 14; thêm cạnh dòng 137:
```tsx
      {viec === 'mo-lai-lop' && (
        <MoLaiLopPanel classId={data.id} classCode={data.code} chiNhanh={data.branchName} ketThuc={data.finishedAt ? ngay(data.finishedAt) : null}
          coTheKetThucLai={!!data.viewer.coTheKetThucLop || !!data.viewer.coTheXoaKetThuc} onClose={dong} onDone={xong} />
      )}
```
(kiểm `data.finishedAt` có trong `HoSoLop`; không có thì thêm vào `classOverview` — một trường `finished_at` đã đọc ở `luuTru.ts`; `ngay` từ `@shared/domain/index.ts`.)

- [ ] **Step 5: `LuuTruPage.tsx`** — kiểu `LopLuuTru` thêm `coTheMoLai: boolean`; trạng thái `moLai: LopLuuTru | null`; trong dòng lớp đã kết thúc (hiện là `<Link className="card …">` cả dòng) đổi thành `div` có `Link` ở phần chữ + nút ở cuối để không lồng nút trong link:

```tsx
{data.lop.map((l) => (
  <div key={l.id} className="card flex flex-wrap items-center gap-x-2 gap-y-1 p-3">
    <Link to={`/hoc-vien/lop/${l.id}`} className="link font-semibold">{l.code}</Link>
    <span className="text-xs text-slate-500">…giữ nguyên các chữ cũ…</span>
    <span className="flex-1" />
    <span className="text-[11px] text-slate-500 whitespace-nowrap">Đã kết thúc {l.finishedAt ? ngay(l.finishedAt) : '—'}</span>
    {l.coTheMoLai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setMoLai(l)}>Mở lại</button>}
  </div>
))}
```
và cuối trang: `{moLai && <MoLaiLopPanel classId={moLai.id} classCode={moLai.code} chiNhanh={moLai.chiNhanh} ketThuc={moLai.finishedAt ? ngay(moLai.finishedAt) : null} coTheKetThucLai onClose={() => setMoLai(null)} onDone={reload} />}`. (`coTheKetThucLai` luôn `true` ở đây nếu Q2-B; nếu chủ sản phẩm chọn A/C thì truyền `false` — một chỗ duy nhất, kiểm bằng cờ session `coTheXoaKetThuc` của người dùng: dùng `useSession().session?.…` nếu có, không thì bỏ Hoàn tác ở Lưu trữ.)

- [ ] **Step 6: Chạy `npm run check` — xanh. Step 7: Commit**

```bash
git add web/src/modules/classes/XoaKetThucLopPanel.tsx web/src/modules/classes/DauTrangLop.tsx web/src/modules/classes/ClassOverviewPage.tsx web/src/modules/students/LuuTruPage.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web Mở lại lớp (⋮ hồ sơ lớp + Lưu trữ), Hoàn tác = Kết thúc lớp"
```

---

### Task 8: Web — panel "Nhiều em" (Kết thúc học · Lưu trữ) từ ⋮ hồ sơ lớp

**Files:**
- Create: `web/src/modules/students/hangLoatEm.ts`
- Create: `web/src/modules/students/HangLoatEmPanel.tsx`
- Modify: `web/src/modules/classes/DauTrangLop.tsx` (mục `Nhiều em…`)
- Modify: `web/src/modules/classes/ClassOverviewPage.tsx` (vẽ panel)
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `POST /hang-loat-hoc-vien/xem-truoc`, `POST /hang-loat-hoc-vien`, `chiaLo`, `LO_HANG_LOAT_EM`, `VIEC_NGUOC`, `NHAN_VIEC_HANG_LOAT`, `GET /classes/:id/roster` (`DongRoster`: `id`, `fullName`, `studentCode`, `status`, `archived`).
- Produces: `chayHangLoat(viec, ids, o, onTienDo): Promise<KetQuaHangLoat>`; `hoanTacHangLoat(viec, ids): Promise<void>`; `HangLoatEmPanel({ classId?, maLop?, truoc?, onClose, onDone })`.

- [ ] **Step 1: Phép kiểm nguồn đỏ**

```ts
  check('LUIb-16 · web Nhiều em: chia lô bằng LO_HANG_LOAT_EM, gom ok/failed, dừng khi một lô ném lỗi và ghi "chưa lưu" cho phần còn lại; Hoàn tác gọi việc ngược', () => {
    const h = doc('web/src/modules/students/hangLoatEm.ts');
    assert(h.includes('chiaLo(ids, LO_HANG_LOAT_EM)') && h.includes("'/hang-loat-hoc-vien'") && h.includes('VIEC_NGUOC[viec]'), 'runner');
    assert(/catch \(e: any\) \{[\s\S]*break;/.test(h), 'lỗi giữa chừng phải dừng và ghi phần còn lại là chưa lưu');
    const p = doc('web/src/modules/students/HangLoatEmPanel.tsx');
    for (const chu of ['Nhiều em', 'Chọn cả lớp', 'Bỏ qua', 'Thử lại', 'Đã lưu ', 'chưa lưu', '‹ Sửa', 'Quyết định chuyển lớp huỷ', 'PA huỷ', 'Case đóng']) assert(p.includes(chu), `thiếu chữ "${chu}"`);
    assert(doc('web/src/modules/classes/DauTrangLop.tsx').includes("nhan: 'Nhiều em…'"), 'mục ⋮ Nhiều em…');
  });
```

- [ ] **Step 2: Chạy — đỏ.**

- [ ] **Step 3: `web/src/modules/students/hangLoatEm.ts`**

```ts
import { api } from '../../lib/api.ts';
import { LO_HANG_LOAT_EM, VIEC_NGUOC, chiaLo, type KetQuaHangLoat, type ViecHangLoat } from '@shared/domain/index.ts';

/**
 * GỬI LÀM NHIỀU EM THEO LÔ (PR-LUI-b) — mỗi lô `LO_HANG_LOAT_EM` em một request (10 s của Netlify), gom `ok` / `failed`. Một lô ném lỗi (mất mạng, 503
 * "sắp hết giờ") thì DỪNG: phần còn lại ghi là "chưa lưu" với đúng câu lỗi — phần đã lưu giữ nguyên, người dùng Thử lại đúng các em chưa lưu.
 */
export async function chayHangLoat(
  viec: ViecHangLoat, ids: number[], o: { lyDo?: string; date?: string; moLaiLop?: boolean }, onTienDo?: (xong: number, tong: number) => void,
): Promise<KetQuaHangLoat> {
  const kq: KetQuaHangLoat = { ok: [], failed: [] };
  const lo = chiaLo(ids, LO_HANG_LOAT_EM);
  for (let i = 0; i < lo.length; i++) {
    onTienDo?.(kq.ok.length + kq.failed.length, ids.length);
    try {
      const r = await api.post<KetQuaHangLoat>('/hang-loat-hoc-vien', { viec, studentIds: lo[i], lyDo: o.lyDo || undefined, date: o.date || undefined, moLaiLop: o.moLaiLop === true });
      kq.ok.push(...r.ok); kq.failed.push(...r.failed);
    } catch (e: any) {
      for (const sid of lo.slice(i).flat()) kq.failed.push({ studentId: sid, message: e.message });
      break;
    }
  }
  return kq;
}

/** Hoàn tác = làm việc NGƯỢC cho đúng các em đã làm được (kết thúc ↔ học lại, lưu trữ ↔ bỏ lưu trữ). */
export async function hoanTacHangLoat(viec: ViecHangLoat, ids: number[]): Promise<KetQuaHangLoat> {
  return chayHangLoat(VIEC_NGUOC[viec], ids, { lyDo: VIEC_NGUOC[viec] === 'ket-thuc' ? 'Hoàn tác học lại' : undefined, moLaiLop: true });
}
```

- [ ] **Step 4: `HangLoatEmPanel.tsx`**

```tsx
import { useEffect, useMemo, useState } from 'react';
import { api, invalidate } from '../../lib/api.ts';
import { useApi } from '../../lib/useApi.ts';
import { useToast } from '../../ui/Toast.tsx';
import { Khoi, KhungPanel, Truong } from '../../ui/KhungPanel.tsx';
import { ChonNgayGan } from '../../ui/ChonNgay.tsx';
import { useLoiForm } from '../../ui/loiForm.tsx';
import { Empty, ErrorState, NutChon, Skeleton } from '../../ui/ui.tsx';
import { NHAN_VIEC_HANG_LOAT, dsLoi, type ViecHangLoat, type XemTruocHangLoat } from '@shared/domain/index.ts';
import { chayHangLoat, hoanTacHangLoat } from './hangLoatEm.ts';

type EmLop = { id: number; fullName: string; studentCode: string; status: string; archived: boolean };
const VIEC_TRONG_LOP: ViecHangLoat[] = ['ket-thuc', 'luu-tru'];

/**
 * PANEL "NHIỀU EM" (PR-LUI-b, 06/10) — Kết thúc học · Lưu trữ cho nhiều em của MỘT lớp (⋮ hồ sơ lớp), hoặc xác nhận việc đã chọn sẵn
 * (`truoc`: Lưu trữ › chọn nhiều → Bỏ lưu trữ / Học lại). Hai bước như Chuyển tiếp lớp: 1 Chọn → 2 Xem trước + xác nhận. Gửi từng lô 8 em;
 * lỗi giữa chừng giữ phần đã lưu, nút đổi thành "Thử lại n em". Xong thì toast Hoàn tác (việc ngược cho đúng các em đã làm).
 */
export function HangLoatEmPanel({ classId, maLop, truoc, onClose, onDone }: {
  classId?: number; maLop?: string | null; truoc?: { viec: ViecHangLoat; ids: number[] }; onClose: () => void; onDone: () => void;
}) {
  const toast = useToast();
  const lf = useLoiForm();
  const roster = useApi<EmLop[]>(classId && !truoc ? `/classes/${classId}/roster` : null, [classId]);
  const [viec, setViec] = useState<ViecHangLoat>(truoc?.viec ?? 'ket-thuc');
  const [chon, setChon] = useState<Set<number>>(new Set(truoc?.ids ?? []));
  const [buoc, setBuoc] = useState<1 | 2>(truoc ? 2 : 1);
  const [xem, setXem] = useState<XemTruocHangLoat | null>(null);
  const [loiXem, setLoiXem] = useState<string | null>(null);
  const [lyDo, setLyDo] = useState('');
  const [ngayHl, setNgayHl] = useState('');
  const [busy, setBusy] = useState(false);
  const [tienDo, setTienDo] = useState<{ xong: number; tong: number } | null>(null);
  const [chuaLuu, setChuaLuu] = useState<{ studentId: number; message: string }[]>([]);
  const [daLuu, setDaLuu] = useState<number[]>([]);

  const duoc = (s: EmLop) => (viec === 'ket-thuc' ? s.status !== 'finished' : s.status === 'finished' && !s.archived);
  const ds = useMemo(() => (roster.data ?? []).filter(duoc), [roster.data, viec]);   // eslint-disable-line react-hooks/exhaustive-deps
  const batBuocLyDo = viec === 'ket-thuc';
  const loi = dsLoi(batBuocLyDo ? [{ khoa: 'ly-do', nhan: 'Lý do', toiThieu: 1 }] : [], { 'ly-do': lyDo });
  const ten = (sid: number) => xem?.rows.find((r) => r.studentId === sid)?.ten ?? `#${sid}`;
  const idsLam = (xem?.rows ?? []).filter((r) => !r.lyDoBo).map((r) => r.studentId);
  const dangThu = chuaLuu.length > 0;

  const doiViec = (v: ViecHangLoat) => { setViec(v); setChon(new Set()); };
  const tiepTuc = async () => {
    setBusy(true); setLoiXem(null);
    try { setXem(await api.post<XemTruocHangLoat>('/hang-loat-hoc-vien/xem-truoc', { viec, studentIds: [...chon] })); setBuoc(2); }
    catch (e: any) { toast.push('error', e.message); } finally { setBusy(false); }
  };
  /* Vào thẳng bước 2 (Lưu trữ › chọn nhiều): nạp xem trước một lần. */
  const napTruoc = () => {
    if (!truoc) return;
    setLoiXem(null);
    api.post<XemTruocHangLoat>('/hang-loat-hoc-vien/xem-truoc', { viec: truoc.viec, studentIds: truoc.ids })
      .then(setXem).catch((e: any) => setLoiXem(e.message));
  };
  useEffect(napTruoc, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const chay = async () => {
    lf.bam();
    if (loi.length) return;
    const lam = dangThu ? chuaLuu.map((c) => c.studentId) : idsLam;
    setBusy(true); setChuaLuu([]);
    const kq = await chayHangLoat(viec, lam, { lyDo: lyDo.trim(), date: ngayHl, moLaiLop: viec === 'hoc-lai' }, (xong, tong) => setTienDo({ xong, tong }));
    setBusy(false); setTienDo(null);
    invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/cases'); invalidate('/lenh-chuyen');
    const tatCaOk = [...daLuu, ...kq.ok];
    setDaLuu(tatCaOk);
    if (kq.failed.length) {
      setChuaLuu(kq.failed);
      toast.push('error', `Đã lưu ${tatCaOk.length} em · ${kq.failed.length} em chưa lưu`);
      return;
    }
    toast.hoanTac(`${NHAN_VIEC_HANG_LOAT[viec]} ${tatCaOk.length} em`, async () => {
      const r = await hoanTacHangLoat(viec, tatCaOk);
      invalidate('/students'); invalidate('/classes'); invalidate('/hoc-vien-lop'); invalidate('/cases');
      toast.push(r.failed.length ? 'error' : 'ok', r.failed.length ? `Hoàn tác ${r.ok.length} em · ${r.failed.length} em chưa được` : 'Đã hoàn tác');
      onDone();
    }, { key: `hang-loat:${viec}` });
    onDone(); onClose();
  };

  const tieuDe = buoc === 1 ? 'Nhiều em' : `${NHAN_VIEC_HANG_LOAT[viec]} · ${xem?.rows.length ?? chon.size} em`;
  return (
    <KhungPanel tieuDe={tieuDe} lop={maLop} onDong={busy ? () => {} : onClose}
      chan={buoc === 1 ? {
        daSua: chon.size > 0,
        chinh: <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={!chon.size || busy} onClick={tiepTuc}>Tiếp tục · {chon.size} em</button>,
      } : {
        daSua: !!lyDo.trim() || !!ngayHl,
        huy: truoc ? undefined : { nhan: '‹ Sửa', onClick: () => { setBuoc(1); setXem(null); }, disabled: busy },
        conThieu: lf.conThieu(loi),
        dongTren: dangThu ? <p role="alert" className="m-0 px-4 pt-2 text-xs text-late tabular-nums">Đã lưu {daLuu.length} em · {chuaLuu.length} em chưa lưu</p> : undefined,
        chinh: (
          <button type="button" className="btn btn-primary min-h-[44px] sm:min-h-0" disabled={busy || !xem || (!dangThu && !idsLam.length)} onClick={chay}>
            {busy ? (tienDo ? `Đang lưu ${tienDo.xong}/${tienDo.tong}…` : 'Đang lưu…')
              : dangThu ? `Thử lại ${chuaLuu.length} em` : `${NHAN_VIEC_HANG_LOAT[viec]} ${idsLam.length} em`}
          </button>
        ),
      }}>
      {buoc === 1 && (
        <>
          <Khoi tieuDe="Việc">
            <span role="group" aria-label="Việc" className="flex flex-wrap gap-1.5">
              {VIEC_TRONG_LOP.map((v) => <NutChon key={v} chon={viec === v} onClick={() => doiViec(v)}>{NHAN_VIEC_HANG_LOAT[v]}</NutChon>)}
            </span>
          </Khoi>
          <Khoi tieuDe={`Học viên · ${chon.size} đang chọn`}>
            {roster.error ? <ErrorState message={roster.error.message} hint={roster.error.hint} onRetry={roster.reload} />
              : !roster.data ? <Skeleton rows={5} />
                : !ds.length ? <Empty title="Không có em nào" />
                  : (
                    <ul className="m-0 list-none divide-y p-0" style={{ borderColor: 'var(--line)' }}>
                      <li className="py-1.5">
                        <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-slate-200 sm:min-h-0">
                          <input type="checkbox" checked={chon.size === ds.length} onChange={(e) => setChon(e.target.checked ? new Set(ds.map((s) => s.id)) : new Set())} />
                          Chọn cả lớp
                        </label>
                      </li>
                      {ds.map((s) => (
                        <li key={s.id} className="py-1.5">
                          <label className="flex min-h-[44px] items-center gap-2 text-sm sm:min-h-0">
                            <input type="checkbox" checked={chon.has(s.id)}
                              onChange={(e) => setChon((x) => { const n = new Set(x); if (e.target.checked) n.add(s.id); else n.delete(s.id); return n; })} />
                            <span className="min-w-0 flex-1 truncate text-slate-100">{s.fullName}</span>
                            <span className="shrink-0 text-xs text-slate-500">{s.status === 'inactive' ? 'Tạm dừng' : s.status === 'finished' ? 'Đã kết thúc' : 'Đang học'}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
          </Khoi>
        </>
      )}
      {buoc === 2 && (loiXem ? <ErrorState message={loiXem} onRetry={napTruoc} /> : !xem ? <Skeleton rows={4} /> : (
        <>
          <Khoi tieuDe={NHAN_VIEC_HANG_LOAT[viec]}>
            <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-slate-300">
              <span>{idsLam.length} em</span>
              {viec === 'ket-thuc' && <><span>Case đóng <b className="text-slate-100">{xem.tong.caseDong}</b></span><span>PA huỷ <b className="text-slate-100">{xem.tong.paHuy}</b></span><span>Quyết định chuyển lớp huỷ <b className="text-slate-100">{xem.tong.lenhHuy}</b></span></>}
              {viec === 'hoc-lai' && xem.tong.lopMoLai.length > 0 && <span className="text-soon">Mở lại lớp {xem.tong.lopMoLai.join(', ')}</span>}
            </p>
            {batBuocLyDo && (
              <Truong nhan="Lý do" batBuoc loi={lf.loiCua(loi, 'ly-do')}>
                <input className="field w-full" maxLength={2000} {...lf.o(loi, 'ly-do')} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
              </Truong>
            )}
            {viec === 'ket-thuc' && (
              <Truong nhan="Có hiệu lực từ"><ChonNgayGan value={ngayHl} onChange={setNgayHl} soNgay={30} chuaChon="Mặc định: hôm nay" /></Truong>
            )}
          </Khoi>
          {dangThu && (
            <Khoi tieuDe={`Chưa lưu · ${chuaLuu.length}`}>
              <ul className="m-0 list-none space-y-1 p-0">
                {chuaLuu.map((c) => <li key={c.studentId} className="text-sm text-slate-200">{ten(c.studentId)}<span className="block text-xs text-late">{c.message}</span></li>)}
              </ul>
            </Khoi>
          )}
          {xem.tong.boQua > 0 && (
            <Khoi tieuDe={`Bỏ qua ${xem.tong.boQua} em`}>
              <ul className="m-0 list-none space-y-1 p-0">
                {xem.rows.filter((r) => r.lyDoBo).map((r) => <li key={r.studentId} className="text-sm text-slate-200">{r.ten}<span className="block text-xs text-slate-500">{r.lyDoBo}</span></li>)}
              </ul>
            </Khoi>
          )}
        </>
      ))}
    </KhungPanel>
  );
}
```
Ghi chú: `lf.o`, `lf.loiCua`, `lf.conThieu`, `lf.bam` đúng chữ ký đã dùng ở `TrangThaiPanel` (`StudentManagePanel.tsx:81-137`).

- [ ] **Step 5: Vào từ ⋮ hồ sơ lớp** — `DauTrangLop.tsx`: kiểu `ViecDauTrang` đã có `'nhieu-em'` (Task 7); thêm mục menu ngay sau `sua-hoc-vien`:
```tsx
    ...(data.viewer.canPlanWeek && (s?.studentCount ?? 0) > 0 ? [{ key: 'nhieu-em', nhan: 'Nhiều em…', onChon: () => onViec('nhieu-em') }] : []),
```
(`canPlanWeek` = `PLAN_WEEK` ở lớp: QL/QT; GVCN false.) `ClassOverviewPage.tsx`: `{viec === 'nhieu-em' && <HangLoatEmPanel classId={data.id} maLop={data.code} onClose={dong} onDone={xong} />}` (+ import).

- [ ] **Step 6: Chạy `npm run check` — xanh. Step 7: Commit**

```bash
git add web/src/modules/students/hangLoatEm.ts web/src/modules/students/HangLoatEmPanel.tsx web/src/modules/classes/DauTrangLop.tsx web/src/modules/classes/ClassOverviewPage.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web panel Nhiều em (Kết thúc học, Lưu trữ) — xem trước, lô 8 em, lỗi giữa chừng, Hoàn tác"
```

---

### Task 9: Web — Lưu trữ: chọn nhiều em (Bỏ lưu trữ · Học lại) + `Học lại` từng em

**Files:**
- Modify: `web/src/modules/students/LuuTruPage.tsx:16-19, 126-145`
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `HocVienLuuTru.coTheBoLuuTru / coTheHocLai`, `HangLoatEmPanel` (`truoc`), `POST /students/:id/hoc-lai`.

- [ ] **Step 1: Phép kiểm nguồn đỏ**

```ts
  check('LUIb-17 · web Lưu trữ › Học viên: cột chọn, thanh "n em đã chọn" với Bỏ lưu trữ + Học lại + Bỏ chọn, nút Học lại mỗi dòng', () => {
    const l = doc('web/src/modules/students/LuuTruPage.tsx');
    for (const chu of ['em đã chọn', 'Bỏ lưu trữ', 'Học lại', 'Bỏ chọn', 'HangLoatEmPanel', 'coTheHocLai']) assert(l.includes(chu), `thiếu "${chu}"`);
    assert(l.includes("truoc={{ viec: 'bo-luu-tru'") || l.includes('truoc={{ viec: viecChon'), 'phải đi qua panel xem trước');
  });
```

- [ ] **Step 2: Chạy — đỏ. Step 3: Sửa `LuuTruPage.tsx`**

Kiểu: `HocVienLuuTru` thêm `coTheHocLai: boolean`. State: `const [chon, setChon] = useState<Set<number>>(new Set()); const [lam, setLam] = useState<{ viec: ViecHangLoat; ids: number[] } | null>(null);`. Trong tab `hv`, trên danh sách (khi có ít nhất một dòng làm được):

```tsx
{chon.size > 0 && (
  <div role="group" aria-label="Chọn nhiều em" className="surface-2 sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2">
    <span className="text-xs font-semibold tabular-nums text-slate-200">{chon.size} em đã chọn</span>
    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setLam({ viec: 'bo-luu-tru', ids: [...chon] })}>Bỏ lưu trữ</button>
    <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setLam({ viec: 'hoc-lai', ids: [...chon] })}>Học lại</button>
    <button type="button" className="btn btn-sm btn-ghost min-h-[44px] sm:min-h-0" onClick={() => setChon(new Set())}>Bỏ chọn</button>
  </div>
)}
```
Mỗi dòng em: thêm `<input type="checkbox" aria-label={`Chọn ${s.fullName}`} disabled={!s.coTheBoLuuTru} …>` đầu dòng (ô chọn chỉ cho người có quyền), và cạnh nút `Bỏ lưu trữ` cũ thêm `{s.coTheHocLai && <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" onClick={() => setLam({ viec: 'hoc-lai', ids: [s.id] })}>Học lại</button>}` (đi qua cùng panel xem trước → một đường duy nhất cho một và nhiều em; hồ sơ em dùng `HocLaiPanel` riêng ở Task 6).
Cuối trang: `{lam && <HangLoatEmPanel truoc={lam} onClose={() => setLam(null)} onDone={() => { setChon(new Set()); reload(); }} />}`.
Giữ nút `Bỏ lưu trữ` từng em + toast Hoàn tác như cũ (`boLuuTru`, `:62-77`).

- [ ] **Step 4: `npm run check` xanh. Step 5: Commit**

```bash
git add web/src/modules/students/LuuTruPage.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web Lưu trữ — chọn nhiều em (Bỏ lưu trữ, Học lại) + Học lại từng em"
```

---

### Task 10: Web — Huỷ nhiều quyết định chuyển lớp (panel Chuyển tiếp lớp)

**Files:**
- Modify: `web/src/modules/classes/TransitionPanel.tsx` (state ~`:40-100`, `huyLenh` `:150-160`, ô "Chọn nhiều em" `:211-236`)
- Test: `server/src/tests/prLuiB.tests.ts`

**Interfaces:**
- Consumes: `POST /lenh-chuyen/huy-nhieu`, `POST /lenh-chuyen/khoi-phuc`, `s.lenh.{id,huong,loi}` của từng em (đã có ở `/classes/:id/transition`), `chon: Set<number>`, `HUONG_CUA`/tên hướng (`nhomChan` ở `:162-172`).

- [ ] **Step 1: Phép kiểm nguồn đỏ**

```ts
  check('LUIb-18 · web Chuyển tiếp lớp: nút "Huỷ quyết định" trong ô chọn nhiều, xem trước theo hướng, lý do ≥ 3, Hoàn tác = Khôi phục', () => {
    const t = doc('web/src/modules/classes/TransitionPanel.tsx');
    for (const chu of ['/lenh-chuyen/huy-nhieu', '/lenh-chuyen/khoi-phuc', 'Huỷ quyết định', 'Bỏ qua', 'chưa có quyết định']) assert(t.includes(chu), `thiếu "${chu}"`);
    assert(/length < 3|\.length >= 3/.test(t.slice(t.indexOf('huyNhieu'))), 'lý do ≥ 3 ký tự');
    assert(/chiaLo\(.*LO_HANG_LOAT_EM\)/.test(t), 'gửi theo lô LO_HANG_LOAT_EM');
  });
```

- [ ] **Step 2: Chạy — đỏ. Step 3: Code**

Thêm state cạnh `huy` (đang là `const [huy, setHuy] = useState<{ sid: number; lyDo: string } | null>(null)`):
```tsx
  const [huyNhieu, setHuyNhieu] = useState<{ lyDo: string } | null>(null);
  const [dangHuy, setDangHuy] = useState(false);
```
Tính từ `students` + `chon` (đặt sau `rows`):
```tsx
  /** Em đang chọn CÓ quyết định chờ — đối tượng của "Huỷ quyết định"; em chưa có quyết định thì bỏ qua. */
  const chonCoLenh = students.filter((s) => chon.has(s.id) && s.lenh);
  const boQuaHuy = chon.size - chonCoLenh.length;
  const nhomHuy = (() => {
    const m = new Map<string, number>();
    for (const s of chonCoLenh) { const t = TEN_HUONG[s.lenh.huong as string] ?? 'Chuyển lớp'; m.set(t, (m.get(t) ?? 0) + 1); }
    return [...m.entries()].map(([k, n]) => `${k} ${n}`).join(' · ');
  })();
  const huyNhieuLenh = async () => {
    const ids = chonCoLenh.map((s) => s.lenh.id as number);
    setDangHuy(true);
    const ok: number[] = [];
    const hong: { id: number; message: string }[] = [];
    for (const lo of chiaLo(ids, LO_HANG_LOAT_EM)) {
      try {
        const r = await api.post<{ ok: number[]; failed: { id: number; message: string }[] }>('/lenh-chuyen/huy-nhieu', { ids: lo, lyDo: huyNhieu!.lyDo.trim() });
        ok.push(...r.ok); hong.push(...r.failed);
      } catch (e: any) { for (const id of lo) hong.push({ id, message: e.message }); break; }
    }
    setDangHuy(false);
    invalidate('/classes'); invalidate('/my-work'); invalidate('/lenh-chuyen'); invalidate('/yeu-cau'); invalidate('/hoc-vien-lop');
    reload();
    if (hong.length) toast.push('error', `Đã huỷ ${ok.length} quyết định · ${hong.length} chưa huỷ — ${hong[0].message}`);
    if (!ok.length) return;
    setChon(new Set()); setHuyNhieu(null);
    toast.hoanTac(`Đã huỷ quyết định ${ok.length} em`, async () => {
      for (const lo of chiaLo(ok, LO_HANG_LOAT_EM)) {
        try { await api.post('/lenh-chuyen/khoi-phuc', { ids: lo }); } catch (e: any) { toast.push('error', e.message); break; }
      }
      invalidate('/classes'); invalidate('/my-work'); invalidate('/lenh-chuyen'); invalidate('/yeu-cau'); invalidate('/hoc-vien-lop');
      reload(); toast.push('ok', 'Đã khôi phục quyết định');
    }, { key: 'huy-lenh-nhieu' });
  };
```
(`TEN_HUONG`: bản đồ `huong → chữ` đã có ở `nhomChan` (`:162`: Lên · Lên FT · Học lại · Tạm dừng học (bảo lưu) · Dừng học hẳn · Chuyển lớp FT · Đổi lộ trình) — tách bản đồ khỏi `nhomChan` thành hằng `TEN_HUONG: Record<string, string> = { len_lop: 'Lên', fast_track: 'Lên FT', hoc_lai: 'Học lại', bao_luu: 'Tạm dừng học (bảo lưu)', dung_hoc: 'Dừng học hẳn', chuyen_lop: 'Chuyển lớp FT' }` dùng lại ở cả hai chỗ.)
Import: `chiaLo, LO_HANG_LOAT_EM` từ `@shared/domain/index.ts`.

Trong nhóm "Chọn nhiều em" (`:211-236`), sau nút `Áp cho n em`:
```tsx
<button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={!chonCoLenh.length || dangHuy} onClick={() => setHuyNhieu({ lyDo: '' })}>Huỷ quyết định</button>
```
và ngay dưới nhóm, khi `huyNhieu`:
```tsx
{huyNhieu && (
  <div role="group" aria-label="Huỷ quyết định" className="surface-2 space-y-2 rounded-lg px-3 py-2">
    <p className="m-0 text-sm font-semibold text-slate-100">Huỷ quyết định {chonCoLenh.length} em</p>
    <p className="m-0 text-xs tabular-nums text-slate-400">{nhomHuy}{boQuaHuy > 0 && ` · Bỏ qua ${boQuaHuy} em chưa có quyết định`}</p>
    <input className="field w-full" aria-label="Lý do" placeholder="Lý do" maxLength={2000} value={huyNhieu.lyDo} onChange={(e) => setHuyNhieu({ lyDo: e.target.value })} />
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn-sm min-h-[44px] sm:min-h-0" disabled={dangHuy} onClick={() => setHuyNhieu(null)}>Đóng</button>
      <button type="button" className="btn btn-sm btn-danger min-h-[44px] sm:min-h-0" disabled={dangHuy || huyNhieu.lyDo.trim().length < 3} onClick={huyNhieuLenh}>
        {dangHuy ? 'Đang huỷ…' : `Huỷ quyết định ${chonCoLenh.length} em`}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 4: `npm run check` xanh. Step 5: Commit**

```bash
git add web/src/modules/classes/TransitionPanel.tsx server/src/tests/prLuiB.tests.ts
git commit -m "PR-LUI-b: web huỷ nhiều quyết định chuyển lớp (xem trước theo hướng, lô 8, Hoàn tác = Khôi phục)"
```

---

### Task 11: Kiểm cuối, bấm thử, audit, PR

- [ ] **Step 1:** `git fetch origin && git merge origin/main` (PR-MTa có thể đã merge — xung đột `routes/index.ts`, `run.ts`, `CODE_MAP.md`, `plan.md` mục 11: **giữ cả hai**). Chạy `npm run check` MỘT LẦN, foreground. OOM → `npm run build:server`, rồi từng bước.
- [ ] **Step 2: Bấm thử bằng ẢNH THẬT** (`PORT=4390 WEB_PORT=5390`, `POST /api/demo/session {userId}`: admin=1, QL=2, GVCN=7, GVBM=9) — **375 và 1440, sáng và tối, ≥ 3 vai** (QL, Quản trị, GVCN; thêm GVBM): 
  - Hồ sơ em đã kết thúc: ⋮ có `Học lại` (QL, QT), **không** có ở GVCN/GVBM; panel; lớp cũ đã kết thúc → dòng `Mở lại lớp …`; toast Hoàn tác; em về danh sách lớp.
  - Hồ sơ lớp đã kết thúc: ⋮ `Mở lại lớp`; Lưu trữ › Lớp: nút `Mở lại`.
  - ⋮ hồ sơ lớp › `Nhiều em…`: bước 1 (chọn cả lớp, chọn lẻ), bước 2 (số hệ quả, mục Bỏ qua), đang lưu `n/m`, lỗi giữa chừng (tạm chặn một em bằng cách đổi chi nhánh em đó ở DB test, KHÔNG ở DB thật) → `Đã lưu n em · m em chưa lưu` + `Thử lại`; Hoàn tác.
  - Lưu trữ › Học viên: chọn nhiều → thanh; `Bỏ lưu trữ`, `Học lại`.
  - Chuyển tiếp lớp: chọn nhiều → `Huỷ quyết định`; Hoàn tác (Khôi phục).
  - Điện thoại 375: nút ≥ 44 px, không cuộn ngang, chân panel không đè.
  Ảnh lưu `docs/so-tay/…` chỉ nếu sổ tay lệch (ghi vào mô tả PR, không sửa sổ tay).
- [ ] **Step 3: Impeccable** — theo CLAUDE.md: `layout`, `clarify`, `harden` (hàng loạt, lỗi giữa chừng, em ngoài quyền, mất mạng), `adapt` 375, cuối `audit`. Giữ Be Vietnam Pro, bảng màu, bố cục đã khoá. Skill gợi ý trái mockup đã duyệt → ghi vào báo cáo cho chủ sản phẩm, không tự làm.
- [ ] **Step 4:** `/ponytail-review`; liệt kê chú thích `ponytail:` (hiện có: `moLaiLop` — lớp thường hết khoá rỗng có thể bị tự kết thúc lại; `hangLoat.ts` — mỗi em một giao dịch, không khoá chống gửi trùng). 
- [ ] **Step 5:** `superpowers:verification-before-completion`, `superpowers:requesting-code-review` (người rà **Opus 5.5 khác session**), `superpowers:finishing-a-development-branch`: mở PR **vào `main`**, KHÔNG merge. Mô tả PR báo từng việc: tái hiện (số liệu báo cáo rà 06/10 B1 / C9–C10) · file sửa · phép kiểm bảo vệ (LUIb-1…18) · ảnh · giới hạn còn lại · chú thích `ponytail:` · ảnh sổ tay lệch.
- [ ] **Step 6:** `[x]` các Task ở file này; một dòng mục 11 `plan.md`; `CODE_MAP.md` thêm `students/hangLoat.ts`, `students/HangLoatEmPanel.tsx`, `students/hangLoatEm.ts`, `shared/domain/hangLoatEm.ts`; tắt mọi tiến trình, xoá file Vite tạm, **không** gỡ worktree trước khi PR xong.

---

## Phép kiểm → yêu cầu (soát chéo)

| Yêu cầu (plan.md mục 4, PR-LUI b) | Task | Phép kiểm |
|---|---|---|
| "Học lại" cho em đã kết thúc học | 2, 6, 9 | LUIb-3, 4, 5, 7, 14, 17 |
| Mở lại lớp đã kết thúc | 2, 7 | LUIb-6, 7, 12, 15 |
| Kết thúc học nhiều em một lần | 3, 8 | LUIb-8, 9, 16 |
| Lưu trữ (và Bỏ lưu trữ) nhiều em | 3, 8, 9 | LUIb-10, 16, 17 |
| Huỷ quyết định chuyển lớp nhiều em | 4, 10 | LUIb-11, 18 |
| Chỉ QL / Quản trị, không nới quyền GV | 2, 3, 4, 5 | LUIb-4 (GVCN 403), 6, 9, 11, 12, 13 |
| Có nhật ký | 2, 3, 4 | LUIb-3 (`student.rejoin`), 6 (`class.reopened`), 8–9 (`student.hang_loat`), 11 (`lenh_chuyen.huy/khoi_phuc`) |
| Lùi lại được | 6, 7, 8, 10 | Hoàn tác trong LUIb-8 (về nguyên trạng), 11 (Khôi phục), 14–18 |
| Xem trước trước khi làm hàng loạt | 3, 8, 10 | LUIb-8, 9, 16, 18 |
| Lỗi giữa chừng không mất dữ liệu | 3, 8 | LUIb-9, 16 |

## Cái bỏ qua (và khi nào thêm)

- **Khoá chống gửi trùng** cho làm nhiều em: cả bốn việc lặp lại an toàn (em ở sẵn trạng thái đó → `failed` "Đã …", không ghi); thêm khi có việc không lặp lại được.
- **Chuông cho Học lại / Mở lại lớp:** GVCN thấy em trở lại bảng lớp; thêm khi chủ sản phẩm muốn báo.
- **Dòng "Lộ trình chạy tiếp"** luôn hiện ở panel Học lại dù em không có lộ trình bị đóng: thêm `loTrinhSeChay` vào `xemTruoc` và ẩn dòng khi `null` nếu cần sát.
- **Hoàn tác huỷ quyết định > 5 giây ở web:** máy chủ cho 24 giờ (`khoiPhucLenh`), web chỉ nút 5 giây; thêm màn "Quyết định vừa huỷ" nếu cần.
- **Học lại sang lớp khác / lộ trình mới** (Q1-B), **hoàn tác Chuyển lớp đã thi hành**, **khoá / mở khoá tài khoản**, **khôi phục tài khoản / học viên đã xoá**: ngoài phạm vi 06/10 (phần a và mục 8 `plan.md`).
- **Ô chọn thẳng trên bảng Học viên & Lớp** (Q3-B): chưa làm; panel `Nhiều em` đủ cho phạm vi.
