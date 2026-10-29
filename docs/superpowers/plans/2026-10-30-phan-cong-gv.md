# Phân công GV — Kế hoạch triển khai (4 PR)

> **Cho người thực hiện:** BẮT BUỘC dùng `superpowers:executing-plans` (plan.md 1.2: làm từng Task ngay trong session, KHÔNG `superpowers:subagent-driven-development`) — mỗi Task theo `superpowers:test-driven-development`. Bước dùng ô tích (`- [ ]`) để theo dõi. Mọi session: `karpathy-guidelines` + `ponytail` (PR có web: `/ponytail lite` đầu phiên).

**Goal:** Góc "Phân công GV" ở Học viên & Lớp (xem + đổi phân công cả chi nhánh, hai bảng tổng hợp) và việc bàn giao GV cũ → GV mới khi đổi người, có hiệu lực, chuyển Case / PA, GV cũ chỉ xem có hạn, Hoàn tác.

**Architecture:** Mọi lần đổi phân công (góc mới + hồ sơ lớp › Sửa thông tin + `PUT /classes/:id/teachers` cũ) đi qua MỘT lõi máy chủ `luuPhanCong` (nhiều lớp, một giao dịch): tính ô đổi bằng hàm thuần `doiTheoO`, ghi bảng `doi_phan_cong` (dòng `da_ap` khi hiệu lực hôm nay, `cho` khi từ tuần sau — quét tới hạn như `lenh_chuyen_lop`), áp bằng `ghiPhanCong` sẵn có + chuyển Case / PA (`chuyenViecKhiDoi`), chụp `ghi_dao` để Hoàn tác. Việc bàn giao là ba bảng mới (không đụng `ban_giao_mon`), dùng chung khung panel mẫu F với bàn giao chuyển lớp. Web tải góc MỘT lần theo chi nhánh; số tổng hợp, dòng phụ ô chọn, dải tô đều từ `demPhanCong` (một nguồn).

**Tech Stack:** TypeScript · Node + libsql/Turso (`server/src`) · React + Vite + Tailwind (`web/src`) · luật thuần `shared/domain` · phép kiểm `server/src/tests/*.tests.ts` (đăng ký cuối `run.ts` bằng `bocTep`).

**Spec:** `docs/superpowers/specs/2026-10-30-phan-cong-gv-design.md` (đọc HẾT, cả mục 2b và ghi chú duyệt đầu tệp) · mockup duyệt `thiet-ke/v9/phan-cong-gv.html` + `thiet-ke/v9/phan-cong-gv-ghi-chu.md`.

## Global Constraints

- Thấy góc: **QL, Quản trị, CX**. Sửa: **QL** (+ **Quản trị**). CX chỉ xem. **GV / TVV không thấy góc này** (máy chủ 403, không chỉ ẩn nút).
- Ba luật giữ nguyên: "mỗi môn một người · đúng một GVCN và GVCN dạy ít nhất một môn · chỉ GV chi nhánh lớp" (`kiemPhanCong` + `kiemTruocPhanCong`). Không phân công khác chi nhánh. "Lộ tên GV chi nhánh khác" = cấm.
- Đếm theo kỹ năng: "một GV dạy 2 kỹ năng của một lớp = **2** (W1 và W2 tính riêng — khớp sheet: Ms. Hà Hoàng FT = 7)"; Pre FOU tính 1 ở Giảng dạy và 1 ở GVCN; GV có vai giảng dạy ở chi nhánh mà 0 lớp vẫn hiện (0).
- Tổng hợp "đếm người dạy HÔM NAY" (ô chờ đổi tính từ tuần hiệu lực); có dòng nháp → số "cũ → mới" ở MỌI chỗ có số (tổng hợp, danh sách chọn, dải tô).
- Hiệu lực: "Ngay hôm nay" hoặc "Từ tuần [W? MON] ▾" — mặc định Ngay hôm nay, hộp nhớ lựa chọn trong phiên. Trước hiệu lực A dạy như cũ.
- Việc đang mở của A ở lớp + môn đó (Case, PA `performer_user_id`) **chuyển sang B** từ hiệu lực, ghi lịch sử, báo B. "Điểm / bài A đã chấm **giữ tên A**".
- GV cũ chỉ xem lớp cũ "tối thiểu 1 tuần và tới khi hoàn thành bàn giao" (lâu hơn của hai mốc; 1 tuần = hiệu lực + 7 ngày); hết mốc → mất quyền xem.
- Việc bàn giao: hạn **5 ngày từ khi tạo việc**; mỗi em một góp ý **bắt buộc = không để trống (không độ dài tối thiểu)** mỗi kỹ năng được bàn giao, GVCN là một cột; cùng GV cũ + cùng lớp → MỘT việc; nhận xét chung cả lớp tuỳ chọn; lưu khi rời ô.
- "Bỏ người (A → Chưa có)" và Chưa có → B: **không** tạo việc bàn giao. GV cũ đã nghỉ → việc giao GVCN lớp; GVCN là người nghỉ → QL chi nhánh; ô tích vẫn mặc định có.
- Bàn giao chuyển lớp: dùng chung khung / thành phần / cách lưu / chữ nút, **không đổi luật bắt buộc** (nhận xét chung ≥ 15 ký tự giữ).
- Không cột "Số buổi"; **không thêm Xuất Excel đợt này**; không xếp lịch dạy.
- Bảng lớp **dùng tối đa bề rộng** (giãn hết khung, cột ô GV chia đều phần còn lại); **cột GVCN nổi bật hơn** (nền `surface-2` cả cột + vạch trái nhấn, tiêu đề đậm hơn — token sẵn có, không màu mới). 1440: tổng hợp xuống dưới bảng lớp, hai bảng cạnh nhau.
- Turso: góc tải MỘT lần theo chi nhánh, không tải lại cả bảng sau mỗi ô (`invalidateGop`); đường API mới có trần ở `server/src/tests/tocDoDuong.ts`; `UNION` ≤ 20 vế, ≤ 900 tham số, không tham số đặt tên.
- Migrate chỉ thêm, chạy lặp được, đăng ký `buoc(...)` cuối `server/src/migrate.ts`, cùng câu cuối `server/src/schema.sql`.
- Không khoá cứng: mọi lưu có Hoàn tác (toast `HOAN_TAC_MS`), Huỷ lịch đổi Hoàn tác được; không mất chữ đang gõ; không báo xong khi chưa lưu.
- Hình ảnh (màu, nền, viền, độ đậm, cỡ chữ, khoảng cách) theo mockup SÁT; tính năng theo luật + giữ mọi thao tác cũ (bảng TRƯỚC → SAU trong `khop-khac.md` của PR). Chữ web ngắn = đúng chữ mockup. Thời gian: mã tuần `W1 NOV`, ngày chỉ cho hạn. Chữ mới có bản Anh ở `shared/i18n/en/phanCongGv.ts` (gộp ở `shared/i18n/en.ts`).
- Kiểm theo `KIEM-NHANH`: `npm run typecheck` · `node scripts/kiem-esbuild.mjs` · `npm run build:server && PISA_CHI_TEP=<tệp,…> node dist-server/server/src/tests/run.js`; PR có web chạy thêm `PISA_CHI_TEP=prNenTypoMau,prSang,prS4f,prEn,prBang0,suaLoiNong`. Không chạy `npm run check` đầy đủ (PTA chạy khi merge). Không Fable.

## Review Focus

1. **Ô của GV đã nghỉ ở dòng KHÔNG ai sửa** → không chặn gì (bảng đọc được, GV đó vẫn có dòng ở Giảng dạy); chỉ dòng đang sửa mới phải đổi ô đó trước khi Lưu. Phép kiểm: A2 `RF1`, C4 `RF1-web`.
2. **Đổi tiếp CÙNG ô trước hiệu lực** (A → B chờ W1 NOV, rồi QL chọn C) → còn một lịch đổi A → C; việc bàn giao của A đổi người nhận sang C; đổi về A → huỷ việc. Phép kiểm: A2 `RF2`, B1 `RF2-bg`.
3. **Hoàn tác khi đã có thay đổi sau** (Case vừa chuyển sang B bị đổi chủ lần nữa, hoặc A đã viết góp ý) → 409 nói rõ, không đảo nửa chừng. Phép kiểm: A4 `RF3`.
4. **Lịch đổi tới hạn mà bức tranh lúc đó sai luật** (một lần đổi ngay khác làm GVCN hết môn) → không áp gì, ô vẫn "Chờ đổi" kèm lỗi, người tạo nhận một thông báo, quét lại trong ngày không ghi DB. Phép kiểm: A4 `RF4`.
5. **Lưu nhiều lớp mà một lớp 409 / sai luật** → không lớp nào được ghi, lỗi chỉ đúng lớp (`details.classId`, `details.khoa`), web giữ mọi dòng nháp. Phép kiểm: A2 `RF5`, C5 `RF5-web`.

---

## Thứ tự PR, phụ thuộc

| PR | Nội dung | Phụ thuộc | Loại | Rà sâu |
|---|---|---|---|---|
| **PR-A** `pc-gv-may-chu` | máy chủ: lõi lưu nhiều lớp + hiệu lực + chuyển Case/PA + quét tới hạn + Hoàn tác + GV cũ chỉ xem + đường đọc góc + migrate | — | chỉ máy chủ | `/security-review` + `/code-review high` |
| **PR-B** `ban-giao-gv` | việc bàn giao đổi GV (dữ liệu, Công việc, phiếu, đọc, dải hồ sơ lớp) + đồng bộ khung bàn giao chuyển lớp | PR-A merged | làm lại màn (panel) | `/security-review` + `/code-review high` |
| **PR-C** `goc-phan-cong-gv` | web: góc Phân công GV + hộp Lưu dùng chung | PR-A merged | màn mới (mockup v9) | đọc diff + ảnh cặp |
| **PR-D** `ho-so-lop-luu-pc` | hồ sơ lớp › Thông tin lớp › Phân công dùng cùng hộp + hiện "Chờ đổi" ở hồ sơ lớp | PR-C merged | sửa nhỏ | đọc diff + ảnh |

Merge: A → (B, C song song — khác màn) → D (D và B cùng chạm hồ sơ lớp: không chạy song song). PR-A lưu cờ `tao_ban_giao` ngay từ đầu; việc bàn giao chỉ sinh khi PR-B vào — deploy A + B cùng đợt.

## Tự quyết của người viết kế hoạch (đặc tả mục 6 — PTA duyệt cùng kế hoạch)

- Phiếu bàn giao đổi GV: **ba bảng mới** `ban_giao_gv` · `ban_giao_gv_mon` · `ban_giao_gv_em` — không mở rộng `ban_giao_mon` (khoá theo `lenh_id` một em, khác hẳn).
- Lịch đổi: bảng `doi_phan_cong` mỗi ô một dòng + quét tới hạn (cron thứ Hai + `quetLenhDenHan` khi đọc) — mẫu `lenh_chuyen_lop`; KHÔNG ghi `teacher_assignments` tương lai (mọi câu `status='active'` sẽ thấy hai người một ô).
- Gộp việc: việc **đang mở** cùng (lớp, GV cũ, hiệu lực) → thêm cột; không theo "cùng ngày".
- 768–1023 px: dùng thẻ lớp như 375 (lưới 2 cột từ 640 px); ≥ 1024 px: bảng (tên dài cắt "…" + `title`).
- Hạn việc = `hanTheoNgay(ngàyTạo, 5)` (hàm chung các việc "5 ngày", tính cả ngày tạo → tạo 30/10 hạn 03/11; mockup vẽ 04/11 — [XM] ghi trong PR-B).
- Dòng "Luôn chuyển sang B" chỉ đếm **Case · PA** (đúng các dòng bị ghi lại); bỏ "n việc" của mockup (việc Ý thức, ô điểm tự theo phân công; đếm phải dựng Công việc của GV cũ — nặng Turso) — [XM].
- Ô của người không còn là ứng viên: `nghi` (tài khoản xoá / hết mọi vai) → "⚠ đã nghỉ"; `ngoai-cn` (còn vai ở chi nhánh khác) → "⚠ ngoài chi nhánh". Cả hai chặn Lưu dòng đang sửa.
- Đọc phiếu đã xác nhận: như bàn giao chuyển lớp — ai có `student.view` lớp đó; trước xác nhận: người viết + QL.

---

## PR-A · Máy chủ phân công có hiệu lực

**Tệp:** tạo `shared/domain/phanCongGv.ts` · `server/src/classes/phanCongGv.ts` · `server/src/migrate/prPhanCongGv.ts` · `server/src/tests/prPhanCongGv.tests.ts`; sửa `shared/domain/index.ts` · `server/src/classes/classes.ts` (`kiemTruocPhanCong`, `setClassTeachers`, `phienBanPhanCong`) · `server/src/cases/owner.ts` · `server/src/permissions.ts` · `server/src/classes/lenhChuyen.ts` (`quetLenhDenHan`) · `server/src/ops/chotVangDinhKy.ts` · `server/src/routes/index.ts` · `server/src/migrate.ts` · `server/src/schema.sql` · `server/src/tests/run.ts` · `server/src/tests/tocDoDuong.ts` · `CODE_MAP.md` (Lớp học).

Mỗi phép kiểm có ghi bọc `conn.exec('BEGIN IMMEDIATE'); try { … } finally { conn.exec('ROLLBACK') }` (mẫu `run.ts:5567`). Đăng ký cuối `run.ts`:
`const { runPrPhanCongGvTests } = bocTep('prPhanCongGv', await import('./prPhanCongGv.tests.ts')); await runPrPhanCongGvTests({ check, assert, conn, P, TODAY, addDays } as any);`
Chạy: `npm run build:server && PISA_CHI_TEP=prPhanCongGv node dist-server/server/src/tests/run.js`.

### Task A1: Luật thuần phân công đổi người

**Files:** Create `shared/domain/phanCongGv.ts`; Modify `shared/domain/index.ts`; Test `server/src/tests/prPhanCongGv.tests.ts` (tạo, đăng ký `run.ts`).

**Interfaces — Produces:**
```ts
export type DoiO = { khoa: string /* 'gvcn' | kỹ năng */; nguoiCu: number | null; nguoiMoi: number | null };
export function doiTheoO(ct: string | null, kyNangLop: readonly string[], cu: readonly SlotPhanCong[], moi: readonly SlotPhanCong[]): DoiO[];
export function apDoi(cu: readonly SlotPhanCong[], doi: readonly DoiO[]): SlotPhanCong[];   // chưa moRongPhanCong
export const laCapBanGiao = (d: DoiO) => d.nguoiCu !== null && d.nguoiMoi !== null && d.nguoiCu !== d.nguoiMoi;
export function caseThuocO(ct: string | null, khoa: string, conDay: ReadonlySet<string>, caseSkill: string | null): boolean;
export type DemGv = { ft: number; th: number; cnFt: number; cnTh: number };
export function demPhanCong(lop: readonly { ft: boolean; slots: readonly SlotPhanCong[] }[]): Map<number, DemGv>;
export const HAN_BAN_GIAO_GV_NGAY = 5; export const XEM_TAM_NGAY = 7;
export const hanBanGiaoGv = (ngayTao: string) => hanTheoNgay(ngayTao, HAN_BAN_GIAO_GV_NGAY);
export const xemDen = (hieuLuc: string) => addDaysIso(hieuLuc, XEM_TAM_NGAY);
export function nguoiVietBanGiao(o: { cuNghi: boolean; nguoiCu: number; gvcn: number | null; gvcnNghi: boolean }): { loai: 'gv-cu' | 'gvcn' | 'ql'; id: number | null };
export type HieuLucVao = { loai: 'hom-nay' } | { loai: 'tuan'; tuanId: number };
export type DoiChoPc = { id: number; khoa: string; nguoiCu: number | null; nguoiMoi: number | null; hieuLuc: string; loi: string | null };
export type LopPc = { id: number; code: string; ct: string | null; ft: boolean; route: string | null; soHv: number; tuan: { n: number; tong: number } | null;
  kyNang: string[]; slots: SlotPhanCong[]; phienBan: string; cho: DoiChoPc[] };
export type GvPc = { id: number; ten: string; kyNang: string[]; nghi: 'nghi' | 'ngoai-cn' | null };
export type TrangPhanCongGv = { chiNhanh: { id: number; code: string } | null; canChonChiNhanh: boolean; sua: boolean; homNay: string; lop: LopPc[]; gv: GvPc[] };
export type CapXemTruoc = DoiO & { nhan: string; soCase: number; soPa: number; nguoiViet: { loai: 'gv-cu' | 'gvcn' | 'ql'; id: number | null } };
export type XemTruocLuu = { lop: { classId: number; code: string; soEm: number; cap: CapXemTruoc[] }[] };
```
Luật: `doiTheoO` so từng ô (`gvcn` = dòng `isCore`; ô môn = `skill`), bỏ ô suy ra (`tong_hop` của Pre FOU — đi theo GVCN) và dòng môn gộp cũ không thuộc `kyNangLop` (`MON_GOP`, `ghiPhanCong` tự giữ); dữ liệu cũ nhiều người một ô → mỗi người cũ một dòng. `caseThuocO`: ô môn → `caseSkill ∈ kyNangPhuTrach(ct, khoa)`; ô `gvcn` → `caseSkill === null || !conDay.has(caseSkill)` (`conDay` = kỹ năng GV cũ CÒN dạy ở lớp sau đổi). `demPhanCong`: mỗi dòng không `isCore` = 1 vào `ft`/`th` theo lớp; mỗi dòng `isCore` = 1 vào `cnFt`/`cnTh`.

- [ ] **Step 1: Viết phép kiểm đỏ** (thuần, không DB)
  - `A1 · demPhanCong dữ liệu mockup v9`: dựng 16 lớp của mảng `LOP` (`thiet-ke/v9/phan-cong-gv.html:454-471`) thành `{ ft, slots }` (FT 5 môn; FOU/BE `listening·reading·writing·speaking`; Pre FOU `gvcn` + `tong_hop`) → `assert` tổng `ft=47, th=18, cnFt=10, cnTh=6`; `get(ha).ft === 7`; `get(chau) === undefined`.
  - `A1 · doiTheoO FT đổi L`: A dạy L + GVCN, đổi L sang B → `[{ khoa:'listening', nguoiCu:A, nguoiMoi:B }]`.
  - `A1 · doiTheoO Pre FOU đổi GVCN`: → đúng một dòng `khoa:'gvcn'` (không dòng `tong_hop`).
  - `A1 · doiTheoO bỏ người`: L A → không ai → `{ nguoiCu:A, nguoiMoi:null }`, `laCapBanGiao` = false; Chưa có → B: `laCapBanGiao` = false.
  - `A1 · doiTheoO giữ môn gộp cũ`: lớp PET có dòng `listening_speaking` cũ → không sinh dòng đổi cho nó.
  - `A1 · caseThuocO`: FT ô `listening` → Case L true, Case R false; ô `gvcn` với `conDay={listening}` → Case R true, Case L false, Case không kỹ năng true; FT ô `writing1` → Case W1 true.
  - `A1 · mốc`: `xemDen('2026-10-30') === '2026-11-06'`, `xemDen('2026-11-02') === '2026-11-09'`, `hanBanGiaoGv('2026-10-30') === '2026-11-03'`.
  - `A1 · nguoiVietBanGiao`: A không nghỉ → `gv-cu`; A nghỉ, GVCN P → `{gvcn, P}`; A nghỉ và là GVCN → `{ql, null}`.
- [ ] **Step 2:** Chạy `PISA_CHI_TEP=prPhanCongGv …` → ĐỎ (chưa có hàm).
- [ ] **Step 3:** Viết `shared/domain/phanCongGv.ts` (dùng `moRongPhanCong`, `kyNangPhuTrach`, `MON_GOP`, `CHUONG_TRINH_KHONG_CHIA_MON`, `hanTheoNgay`, `addDaysIso` sẵn có); re-export ở `shared/domain/index.ts`.
- [ ] **Step 4:** Chạy lại → XANH; `npm run typecheck`.
- [ ] **Step 5:** `git commit -m "PR-A Phân công GV: luật thuần đổi người (doiTheoO, demPhanCong, mốc xem / hạn)"`

### Task A2: Bảng `doi_phan_cong` + lõi `luuPhanCong` nhiều lớp

**Files:** Create `server/src/migrate/prPhanCongGv.ts`, `server/src/classes/phanCongGv.ts`; Modify `server/src/migrate.ts`, `server/src/schema.sql`, `server/src/classes/classes.ts`, `server/src/routes/index.ts`; Test `prPhanCongGv.tests.ts`.

**Interfaces — Consumes:** A1. **Produces:**
```ts
// migrate/prPhanCongGv.ts
export const DOI_PHAN_CONG_SQL: string; export function migratePrPhanCongGv(conn: any, applied: string[]): void;
// classes/phanCongGv.ts
export type LuuLopVao = { classId: number; slots: TeacherSlot[]; phienBan?: string; banGiao?: Record<string, boolean> };
export type KetQuaLuu = { lo: number | null; lop: { classId: number; cho: boolean; soO: number }[] };
export function luuPhanCong(p: Principal, body: { lop: LuuLopVao[]; hieuLuc?: HieuLucVao }): KetQuaLuu;
/** nội bộ, A3/A4 gọi: áp các dòng đổi của MỘT lớp trong tx (bức tranh hiện tại → apDoi → moRongPhanCong → kiem → ghiPhanCong → chuyenViecKhiDoi). Ném lỗi luật. */
export function apDoiLop(p: Principal, classId: number, rows: { id: number; khoa: string; nguoi_cu: number | null; nguoi_moi: number | null }[], ngay: string): void;
// classes.ts
export const phienBanPhanCong: (active: { id: number }[], cho?: { id: number }[]) => string;   // thêm id dòng 'cho'
export function kiemTruocPhanCong(classId, branchId, ct, kyNang, slots, duocXep?: Map<number, 'nghi' | 'ngoai-cn' | null>): void;
```
Bảng (một dòng một ô đổi):
```sql
CREATE TABLE doi_phan_cong (
  id INTEGER PRIMARY KEY AUTOINCREMENT, lo INTEGER, class_id INTEGER NOT NULL REFERENCES classes(id),
  khoa TEXT NOT NULL, nguoi_cu INTEGER REFERENCES users(id), nguoi_moi INTEGER REFERENCES users(id),
  hieu_luc TEXT NOT NULL, trang_thai TEXT NOT NULL,            -- cho | da_ap | huy
  tao_ban_giao INTEGER NOT NULL DEFAULT 0, xem_den TEXT,
  tao_boi INTEGER NOT NULL REFERENCES users(id), tao_luc TEXT NOT NULL,
  ap_luc TEXT, huy_luc TEXT, huy_boi INTEGER, ly_do_huy TEXT, loi TEXT, thu_ngay TEXT);
CREATE INDEX ix_doi_pc_lop ON doi_phan_cong (class_id, trang_thai);
CREATE INDEX ix_doi_pc_cu ON doi_phan_cong (nguoi_cu, trang_thai);
CREATE INDEX ix_doi_pc_cho ON doi_phan_cong (trang_thai, hieu_luc);
```
Luật `luuPhanCong`: quyền mỗi lớp = `setClassTeachers` (QL `class.assign` đổi mọi ô; GVCN `class.assign_subject` chỉ ô bộ môn, chạm GVCN → 403; GVCN đổi → báo QL như nay). Hiệu lực: `hom-nay` → `demoToday()`; `tuan` → `periodById(tuanId).week_start`, phải > thứ Hai tuần này, không thì 400 "Chọn tuần sau tuần này hoặc Ngay hôm nay.". Kiểm TẤT CẢ lớp trước (phiên bản → `conflict(msg, { classId })`; luật → `badRequest('{lớp} · {ô}: {lý do}', { classId, khoa })`; ứng viên đọc MỘT lần mỗi chi nhánh), rồi MỘT `tx`: kiểm lại phiên bản; ô có dòng `cho` cùng (lớp, khoa) → dòng cũ `huy` (`ly_do_huy='thay bằng lần đổi sau'`); chèn dòng (`lo` = id dòng đầu); hôm nay → `apDoiLop` + `trang_thai='da_ap'`, `ap_luc`, `xem_den = xemDen(ngày)`; tuần sau → `cho`. Ô người không còn là ứng viên còn trong bức tranh gửi lên → 400 `"{ô}: {tên} đã nghỉ — chọn người thay hoặc Bỏ trống"` (`nghi`) / câu cũ "Người này không có vai trò giảng dạy ở chi nhánh của lớp." (`ngoai-cn`, giữ cho phép kiểm cũ). `setClassTeachers` gọi `luuPhanCong(p, { lop:[{ classId, slots, phienBan }] })` rồi trả `classTeachers` như cũ. Route: `POST /phan-cong/luu` (`maybeSimulateSaveFailure`).

- [ ] **Step 1: Phép kiểm đỏ**
  - `A2 · migrate chạy hai lần không lỗi, bảng + 3 chỉ mục có`.
  - `A2 · Ngay hôm nay: QL đổi L MB FT 101 → dòng da_ap, teacher_assignments người cũ ended effective_to=TODAY, người mới active effective_from=TODAY, xem_den=TODAY+7`.
  - `A2 · Từ tuần: dòng cho, teacher_assignments KHÔNG đổi; tuần này → 400`.
  - `A2 · RF2 supersede`: đổi L A→B từ tuần +14, rồi lưu A→C cùng tuần → dòng B `huy`, còn đúng một dòng `cho` A→C.
  - `A2 · RF5 hai lớp, lớp 2 sai phiên bản → 409 details.classId = lớp 2; lớp 1 không có dòng đổi, phân công lớp 1 giữ nguyên`.
  - `A2 · RF1 GV nghỉ`: kết thúc mọi vai của GV giữ W2 lớp X; lưu lớp Y (không chứa người đó) → đạt; lưu lớp X đổi ô khác mà giữ W2 → 400 có "đã nghỉ"; đổi cả W2 → đạt.
  - `A2 · quyền`: CX, TVV, GVBM → 403; GVCN đổi ô bộ môn lớp mình → đạt, đổi ô GVCN → 403; `PUT /classes/:id/teachers` cũ vẫn trả bức tranh như trước (phép kiểm cũ của `setClassTeachers` xanh).
- [ ] **Step 2:** Chạy → ĐỎ.
- [ ] **Step 3:** Viết migrate (mẫu `prGhiDao.ts`), đăng ký `buoc(() => migratePrPhanCongGv(conn, applied))` cuối `migrate.ts`, chép SQL cuối `schema.sql`; `luuPhanCong` + `apDoiLop` (A3 nối `chuyenViecKhiDoi` vào `apDoiLop`); `kiemTruocPhanCong` nhận `duocXep` (không truyền = đọc như cũ — `intake.ts` không đổi); route.
- [ ] **Step 4:** Chạy `PISA_CHI_TEP=prPhanCongGv,prQu,prSuaNoRa,prCvLoi,prKetPet,prDonA` (mọi tệp kiểm gọi `setClassTeachers` / `/teachers`) → XANH.
- [ ] **Step 5:** `git commit -m "PR-A Phân công GV: bảng doi_phan_cong + luuPhanCong nhiều lớp, hiệu lực, thay lịch đổi cùng ô"`

### Task A3: Chuyển Case / PA sang người mới

**Files:** Modify `server/src/cases/owner.ts`, `server/src/classes/phanCongGv.ts` (`apDoiLop`); Test `prPhanCongGv.tests.ts`.

**Interfaces — Produces:**
```ts
export function chonViecChuyen(classId: number, ct: string | null, doi: readonly DoiO[], conDay: (userId: number) => ReadonlySet<string>):
  Map<string /* khoa */, { caseIds: number[]; paIds: number[] }>;   // KHÔNG ghi — dùng chung cho xem trước (A6) và áp
export function chuyenViecKhiDoi(o: { classId: number; ct: string | null; doi: readonly DoiO[]; conDay: (userId: number) => ReadonlySet<string>;
  actorId: number | null; luc: string; code: string }): Map<string, { soCase: number; soPa: number }>;
```
Luật: Case mở (`status != 'done'`, `tam = 0`) của em đang học lớp (`COALESCE(a.class_id, cur.class_id)` như `ganChuCaseThieu`), `owner_user_id = nguoiCu`, `caseThuocO(...)` → `owner_user_id = nguoiMoi` + `sos_case_history` (`owner_user_id`). PA `status IN ('planned','started')`, `performer_user_id = nguoiCu`, Case thuộc lớp và ô → `performer_user_id = nguoiMoi, performer_name = NULL` + `sos_case_history` (`pa_performer`, mẫu `banGiaoPaQuyChe` ở `sosAuto.ts:396`). Chỉ cặp `laCapBanGiao`. Một thông báo mỗi (B, lớp): `kind 'phan_cong_moi'`, tiêu đề `Bạn nhận {lớp} · {môn}` (+ ` · n Case · n PA` khi có), `dedupKey 'phan_cong_moi:{doiId}'`, `duong '/hoc-vien/lop/{id}'`. Một `writeAudit('class.assign')` có `{ via, doi, chuyen }`. Điểm đã nhập không đụng.

- [ ] **Step 1: Phép kiểm đỏ**
  - `A3 · đổi L ngay: Case L mở của A ở lớp → B, có dòng sos_case_history; Case R của A giữ A; PA L A thực hiện → B`.
  - `A3 · đổi GVCN, A còn dạy L: Case R (A giữ vì lớp thiếu GV R) → B; Case L giữ A`.
  - `A3 · điểm A đã nhập giữ entered_by / người chấm A` (so trước / sau một ô `assessment_scores`).
  - `A3 · B nhận một thông báo phan_cong_moi; lưu lại cùng ô không báo lần hai`.
  - `A3 · bỏ người (A → Chưa có): không chuyển Case (ganChuCaseThieu giữ luật cũ)`.
- [ ] **Step 2:** Chạy → ĐỎ.
- [ ] **Step 3:** Viết `chonViecChuyen` (2 câu đọc cho cả lớp, không theo em) + `chuyenViecKhiDoi`; `apDoiLop` gọi sau `ghiPhanCong`.
- [ ] **Step 4:** Chạy → XANH.
- [ ] **Step 5:** `git commit -m "PR-A Phân công GV: chuyển Case / PA của GV cũ sang GV mới, lịch sử + thông báo"`

### Task A4: Áp lịch đổi tới hạn · Đổi mốc · Huỷ lịch đổi · Hoàn tác

**Files:** Modify `server/src/classes/phanCongGv.ts`, `server/src/classes/lenhChuyen.ts` (`quetLenhDenHan`), `server/src/ops/chotVangDinhKy.ts`, `server/src/routes/index.ts`; Test `prPhanCongGv.tests.ts`.

**Interfaces — Produces:**
```ts
export function apDoiDenHan(homNay?: string): { daAp: number; loi: number };   // cron + quét khi đọc; một câu rẻ ngoài tx, ≤ 40 nhóm (lớp, hiệu lực)
export function quetDoiDenHan(homNay?: string): void;                          // nho(`ap-doi-pc:${homNay}`) — gọi trong quetLenhDenHan
export function doiMocCho(p: Principal, ids: number[], hieuLuc: HieuLucVao): { lo: number | null };   // hom-nay → áp ngay
export function huyCho(p: Principal, ids: number[]): { dao: number };          // id ghi_dao để toast Hoàn tác
export function hoanTacLuu(p: Principal, o: { lo?: number; dao?: number }): void;
```
Luật: nhóm (lớp, hiệu lực) `cho` tới hạn → mỗi nhóm một `tx`, đọc lại TRONG tx, tác giả = `loadPrincipal(tao_boi)`; lỗi luật → giữ `cho`, `loi` = câu lỗi, `thu_ngay` = hôm nay (không thử lại trong ngày), một `notify` người tạo `kind 'phan_cong_loi'` (dedup theo nhóm + ngày). Hoàn tác: `luuPhanCong` / `doiMocCho` (áp ngay) / `huyCho` chụp `GhiDao` (`server/src/platform/ghiDao.ts`) TRƯỚC khi ghi — `teacher_assignments` của lớp (sửa + thêm), `sos_cases` ĐÚNG các id chuyển + id thiếu chủ được gán, `case_interventions` đúng id chuyển, thêm `sos_case_history`, `notifications`, `doi_phan_cong`; `luuGhiDao(conn, { loai: 'phan_cong.luu', bang: 'doi_phan_cong', id: lo, … })`; `KetQuaLuu.lo` là khoá Hoàn tác. Hoàn tác = `daoLai` (đủ "còn đúng sau", không thì 409) + quyền như lưu trên MỌI lớp của lô. Routes: `POST /phan-cong/hoan-tac`, `POST /phan-cong/cho/doi-moc`, `POST /phan-cong/cho/huy`. `chotVangDinhKy`: thêm `try { apDoiDenHan(ngay) } catch …` như các việc khác.

- [ ] **Step 1: Phép kiểm đỏ**
  - `A4 · tới hạn`: lịch L A→B từ tuần +14, rồi `UPDATE doi_phan_cong SET hieu_luc = TODAY` (giả tới hạn) → `apDoiDenHan` áp: `da_ap`, `effective_from = hieu_luc`, Case L chuyển.
  - `A4 · chạy apDoiDenHan hai lần → lần hai daAp = 0, không thêm teacher_assignments`.
  - `A4 · RF4`: GVCN G dạy L + R; lịch L G→B (hợp lệ lúc lưu: G còn R); đổi NGAY R G→C (hợp lệ: G còn L); giả tới hạn → `apDoiDenHan`: `loi` có "GVCN phải dạy", `trang_thai='cho'`, `thu_ngay=TODAY`, phân công không đổi, người tạo đúng 1 thông báo; quét lần 2 cùng ngày: `COUNT(*)` `notifications` + dòng `doi_phan_cong` không đổi.
  - `A4 · Hoàn tác lưu ngay: phân công, owner Case, performer PA, thông báo về như trước; ghi_dao dao_luc có`.
  - `A4 · RF3`: lưu ngay → `doiChuCase` đổi chủ Case vừa chuyển → `hoanTacLuu` 409, phân công KHÔNG đổi (đếm `teacher_assignments` active trước = sau).
  - `A4 · huyCho: dòng huy; Hoàn tác huỷ → dòng cho lại`; `doiMocCho hom-nay → áp ngay`.
  - `A4 · CX / GVBM gọi hoan-tac, cho/huy → 403`.
- [ ] **Step 2:** Chạy → ĐỎ.
- [ ] **Step 3:** Viết các hàm + routes + nối `quetLenhDenHan` / `chotVangDinhKy`.
- [ ] **Step 4:** Chạy `PISA_CHI_TEP=prPhanCongGv,prQrl2cPa,prQrl2cDuyet,prCt` → XANH (`ghi_dao` cũ + thi hành lệnh chuyển lớp giữ nguyên).
- [ ] **Step 5:** `git commit -m "PR-A Phân công GV: áp lịch đổi tới hạn, Đổi mốc / Huỷ lịch đổi, Hoàn tác lô (ghi_dao)"`

### Task A5: GV cũ chỉ xem lớp cũ có hạn

**Files:** Modify `server/src/permissions.ts`; Test `prPhanCongGv.tests.ts`.

**Interfaces — Produces:**
```ts
// Principal
xemTam?: { classId: number; tu: string; den: string; doiId: number }[];
export function xemTamCo(p: Principal, ctx: Ctx): boolean;   // ctx.classId hoặc lớp của ctx.studentId ∈ xemTam, tu ≤ (ctx.date ?? demoToday()) ≤ den
```
Luật: `COT_PRINCIPAL` thêm `u_xem_tam` = `json_group_array(json_array(d.class_id, d.hieu_luc, d.xem_den, d.id)) FROM doi_phan_cong d WHERE d.nguoi_cu = u.id AND d.trang_thai = 'da_ap'` (cùng câu phiên, không thêm lượt; PR-B kéo `den` tới khi xong bàn giao). `teacherAllows`: CHỈ `ATTEMPT_VIEW` và `STUDENT_VIEW` thêm `|| xemTamCo(p, ctx)`; `scopeFor` grant `teacher` + hai quyền đó thêm `classId` của `xemTam` còn hạn. Mọi quyền sửa (`SCORE_EDIT`, `SOS_REPORT`, `SOS_EDIT`, `VIOLATION_RECORD`, `CASE_CLOSE`, `DISCIPLINE_MANAGE`…) KHÔNG đổi.

- [ ] **Step 1: Phép kiểm đỏ**
  - `A5 · sau đổi L ngay: A (không còn ô nào ở lớp) can ATTEMPT_VIEW + STUDENT_VIEW {classId} = true; SCORE_EDIT {classId, skill:'listening'}, SOS_REPORT, VIOLATION_RECORD = false`.
  - `A5 · ctx.date = TODAY+8 → ATTEMPT_VIEW false; scopeFor(ATTEMPT_VIEW, TODAY).classIds có lớp, (TODAY+8) không`.
  - `A5 · classOverview(A, lớp) đọc được, viewer không có quyền nhập điểm / + Case`.
  - `A5 · GV khác chi nhánh / TVV không được thêm quyền gì` (so `scopeFor` trước / sau lần đổi).
- [ ] **Step 2:** Chạy → ĐỎ.
- [ ] **Step 3:** Sửa `COT_PRINCIPAL`, `principalTuDong`, `teacherAllows`, `scopeFor`.
- [ ] **Step 4:** Chạy `PISA_CHI_TEP=prPhanCongGv,anToan` → XANH.
- [ ] **Step 5:** `git commit -m "PR-A Phân công GV: GV cũ chỉ xem lớp cũ tới hiệu lực + 7 ngày"`

### Task A6: Đường đọc góc + xem trước hộp Lưu + trần tốc độ

**Files:** Modify `server/src/classes/phanCongGv.ts`, `server/src/routes/index.ts`, `server/src/tests/tocDoDuong.ts`; Test `prPhanCongGv.tests.ts`.

**Interfaces — Produces:**
```ts
export function quyenPhanCongGv(p: Principal, branchId: number): { xem: boolean; sua: boolean };   // sua = can(CLASS_ASSIGN,{branchId}); xem = sua || grant 'cx' phủ chi nhánh
export function trangPhanCongGv(p: Principal, branchId: number | null): TrangPhanCongGv;           // GET /hoc-vien-lop/phan-cong?branchId=
export function xemTruocLuu(p: Principal, body: { lop: { classId: number; slots: TeacherSlot[] }[] }): XemTruocLuu;   // POST /phan-cong/xem-truoc
```
Luật: không `xem` → 403 "Phân công GV dành cho Quản lý." (GV, TVV, Admin MT). `branchId` null mà người xem nhiều chi nhánh → `{ canChonChiNhanh: true, chiNhanh: null, lop: [] }`; một chi nhánh → dùng luôn. Gọi `quetDoiDenHan()` trước khi đọc. Số câu CỐ ĐỊNH theo chi nhánh: lớp `active` của chi nhánh · `teacher_assignments` active của các lớp đó · dòng `cho` · đếm HV đang học (`HV_DANG_HOC_SQL`) · `classProgressMany(ids)` (tuần n/N lớp thường) · `teacherCandidatesBranch(branchId)` · người giữ ô không còn là ứng viên (một câu: `nghi` khi `users.status='deleted'` hoặc không còn vai `active`; còn lại `ngoai-cn`). `gv` = ứng viên ∪ người giữ ô (không ai ngoài hai tập đó — không lộ GV chi nhánh khác). `xemTruocLuu`: cùng quyền `luuPhanCong`; mỗi cặp `laCapBanGiao`: `soCase/soPa` từ `chonViecChuyen` (cùng hàm áp), `nguoiViet` từ `nguoiVietBanGiao` (GVCN của bức tranh hiện tại), `soEm`.

- [ ] **Step 1: Phép kiểm đỏ**
  - `A6 · QL MB: trang có mọi lớp active của MB, slots đúng teacher_assignments, gv chỉ ứng viên MB + người giữ ô`.
  - `A6 · CX đọc được (sua=false); GVCN, GVBM, TVV, Admin MT → 403`.
  - `A6 · demPhanCong(trang.lop) khớp đếm SQL trực tiếp số dòng không core / core theo is_fast_track` (một nguồn).
  - `A6 · xemTruocLuu đổi L có 1 Case L của A → cap[0].soCase = 1; chonViecChuyen trả cùng caseIds mà chuyenViecKhiDoi ghi`.
  - `A6 · số câu SQL GET không tăng theo số lớp` (đo `demDong`/đếm câu với 1 và mọi lớp chi nhánh: chênh 0).
- [ ] **Step 2:** Chạy → ĐỎ.
- [ ] **Step 3:** Viết hai hàm + routes; `tocDoDuong.ts` thêm `{ trang: 'Học viên & Lớp · Phân công GV', vai: ['QL','QT','CX','GVCN','GVBM','TVV'], url: '/hoc-vien-lop/phan-cong?branchId={cn}', maChuDich: { GVCN: 403, GVBM: 403, TVV: 403 } }` + `TRAN` / `TRAN_DONG` = max(đo + 10, ⌈đo × 1,3⌉) câu, max(đo + 50, ⌈đo × 1,3⌉) dòng; `TRAN_GHI_LO.luuPhanCong3Lop` (đo trong phép kiểm A2: lưu 3 lớp một ô).
- [ ] **Step 4:** Chạy `PISA_CHI_TEP=prPhanCongGv` + `node dist-server/server/src/tests/tocDo.run.js` (một lần) → XANH; `npm run typecheck`, `node scripts/kiem-esbuild.mjs`.
- [ ] **Step 5:** `CODE_MAP.md` (Lớp học: dòng "Phân công GV cả chi nhánh, lịch đổi, Hoàn tác"); `git commit -m "PR-A Phân công GV: GET góc theo chi nhánh, xem trước hộp Lưu, trần tốc độ"`

---

## PR-B · Việc bàn giao đổi GV + đồng bộ khung bàn giao

**Tệp:** tạo `server/src/migrate/prBanGiaoGv.ts` · `server/src/classes/banGiaoGv.ts` · `shared/domain/banGiaoGv.ts` · `web/src/modules/classes/banGiaoChung.tsx` · `web/src/modules/classes/BanGiaoGvPanel.tsx` · `server/src/tests/prBanGiaoGv.tests.ts`; sửa `phanCongGv.ts` (gọi hook), `permissions.ts` (`u_xem_tam`), `banGiao.ts` (xuất `tuDienTheoLo`, `luuNhapNhanXet`), `daiChuyenLop.ts` + `shared/domain/chuyenLop.ts` (`DaiLop`), `worklist/mywork.ts`, `routes/index.ts`, `web/src/modules/classes/{BanGiaoPanel,DaiChuyenLop,ClassOverviewPage}.tsx`, `web/src/modules/congViec/PanelViec.tsx`, `migrate.ts`, `schema.sql`, `run.ts`, `tocDoDuong.ts`, `CODE_MAP.md` (Chuyển lớp + Bàn giao). Lệnh impeccable: `layout` + `polish` (trong phạm vi panel) · `clarify` · `harden` · `adapt` · cuối `audit` + `web-design-guidelines`.

### Task B1: Bảng bàn giao + sinh / gộp / đổi người nhận / huỷ từ lần lưu

**Files:** Create `prBanGiaoGv.ts` (migrate), `banGiaoGv.ts`; Modify `phanCongGv.ts`, `permissions.ts`, `migrate.ts`, `schema.sql`; Test `prBanGiaoGv.tests.ts`.

**Interfaces — Consumes:** A2 `luuPhanCong` / `apDoiLop` / `huyCho`, A1 `nguoiVietBanGiao`, `hanBanGiaoGv`. **Produces:**
```sql
CREATE TABLE ban_giao_gv (id INTEGER PRIMARY KEY AUTOINCREMENT, class_id INTEGER NOT NULL, nguoi_cu INTEGER NOT NULL, nguoi_lam INTEGER,   -- NULL = QL chi nhánh
  hieu_luc TEXT NOT NULL, han TEXT NOT NULL, trang_thai TEXT NOT NULL,   -- mo | xong | huy
  nhan_xet_chung TEXT, tu_dien TEXT, tao_luc TEXT NOT NULL, tao_boi INTEGER NOT NULL, xong_luc TEXT, xong_boi INTEGER, xong_thay INTEGER NOT NULL DEFAULT 0);
CREATE TABLE ban_giao_gv_mon (id INTEGER PRIMARY KEY AUTOINCREMENT, ban_giao_id INTEGER NOT NULL, mon TEXT NOT NULL, nguoi_moi INTEGER NOT NULL,
  doi_id INTEGER NOT NULL, trang_thai TEXT NOT NULL);                     -- mo | huy
CREATE TABLE ban_giao_gv_em (id INTEGER PRIMARY KEY AUTOINCREMENT, ban_giao_id INTEGER NOT NULL, student_id INTEGER NOT NULL, mon TEXT NOT NULL,
  noi_dung TEXT NOT NULL, nguoi_ghi INTEGER NOT NULL, dien_thay INTEGER NOT NULL DEFAULT 0, ghi_luc TEXT NOT NULL, UNIQUE (ban_giao_id, student_id, mon));
-- chỉ mục: ban_giao_gv(class_id, trang_thai), ban_giao_gv(nguoi_cu, trang_thai), ban_giao_gv_mon(doi_id)
```
```ts
export function dongBoViecBanGiao(p: Principal, o: { classId: number; ct: string | null; slotsTruoc: SlotPhanCong[];
  doi: { id: number; khoa: string; nguoiCu: number | null; nguoiMoi: number | null; hieuLuc: string; taoBanGiao: boolean }[] }, g: GhiDao): number;   // số việc mới
export function huyViecTheoDoi(doiIds: number[], g: GhiDao): void;
```
Luật (gọi trong `tx` của `luuPhanCong`, sau khi chèn dòng `doi_phan_cong`, được `GhiDao` chụp): ① cặp có cột `mo` mà `nguoi_moi = nguoiCu` của cặp (A → B rồi B → C) → cột đổi `nguoi_moi = C`; nếu `nguoiMoi` = `nguoi_cu` của việc (về lại A) → cột `huy`, việc hết cột `mo` → việc `huy` (dòng `ban_giao_gv_em` giữ làm lịch sử). ② cặp `laCapBanGiao && taoBanGiao` → việc `mo` cùng (lớp, `nguoi_cu`, `hieu_luc`) có sẵn thì thêm cột, không có thì tạo: `nguoi_lam` theo `nguoiVietBanGiao` (GVCN của `slotsTruoc`; `ql` → NULL), `han = hanBanGiaoGv(demoToday())`. ③ `huyCho` → `huyViecTheoDoi`. `luuPhanCong` trả thêm `viec: number`. `COT_PRINCIPAL.u_xem_tam`: `den` = `xem_den`, hoặc '9999-12-31' khi còn `ban_giao_gv` `mo` có cột trỏ `doi_id` đó (lâu hơn của hai mốc).

- [ ] **Step 1: Phép kiểm đỏ**
  - `B1 · migrate hai lần không lỗi`.
  - `B1 · đổi L và GVCN cùng A → B một lần lưu → MỘT việc, hai cột (listening, gvcn), han = TODAY+4, nguoi_lam = A`.
  - `B1 · bỏ tích ô GVCN → việc một cột; bỏ hết → không việc; A → Chưa có → không việc`.
  - `B1 · RF2-bg`: A→B (ngay, có việc) rồi B→C → cột `nguoi_moi = C`; rồi C→A → cột `huy`, việc `huy`, góp ý đã viết còn.
  - `B1 · A đã nghỉ (hết vai) → nguoi_lam = GVCN lớp; A là GVCN và nghỉ → nguoi_lam NULL`.
  - `B1 · Huỷ lịch đổi (huyCho) → việc huy; Hoàn tác → việc mo lại`.
  - `B1 · GV cũ còn việc mo → xemTamCo ngày TODAY+30 = true; xác nhận xong + quá xem_den → false`.
- [ ] **Step 2:** `PISA_CHI_TEP=prBanGiaoGv` → ĐỎ.
- [ ] **Step 3:** Migrate (`migratePrBanGiaoGv`, `buoc`), `dongBoViecBanGiao`, `huyViecTheoDoi`, nối vào `luuPhanCong` / `huyCho`, sửa `u_xem_tam`.
- [ ] **Step 4:** `PISA_CHI_TEP=prBanGiaoGv,prPhanCongGv` → XANH.
- [ ] **Step 5:** `git commit -m "PR-B Bàn giao đổi GV: bảng + sinh / gộp / đổi người nhận / huỷ theo lần lưu phân công"`

### Task B2: Phiếu: đọc, góp ý, nhận xét chung, xác nhận, Điền thay

**Files:** Modify `banGiaoGv.ts`, `banGiao.ts` (xuất `tuDienTheoLo`), `routes/index.ts`; Create `shared/domain/banGiaoGv.ts`; Test `prBanGiaoGv.tests.ts`.

**Interfaces — Produces:**
```ts
// shared/domain/banGiaoGv.ts
export type PhieuBanGiaoGvDto = { id: number; lop: { id: number; code: string; ct: string | null }; nguoiCu: { id: number; ten: string };
  cot: { mon: string; nhan: string; ten: string; nguoiMoi: { id: number; ten: string } }[]; han: string; hieuLuc: string; trangThai: 'mo' | 'xong' | 'huy';
  nhanXetChung: string | null; xacNhan: { boi: string; luc: string; thay: boolean } | null;
  em: { studentId: number; ten: string; tuDien: TuDien | null; gopY: Record<string, { noiDung: string; nguoiGhi: string; ghiLuc: string; dienThay: boolean } | null> }[];
  nguoiXem: { viet: boolean; xacNhan: boolean; thay: boolean } };
export function trangThaiEmBg(cot: readonly string[], gopY: Record<string, unknown | null>): { khoa: 'du' | 'thieu' | 'chua'; nhan: string };   // "Đủ" · "Thiếu {cột}" · "Chưa có"
// server/src/classes/banGiaoGv.ts
export function phieuBanGiaoGv(p: Principal, id: number): PhieuBanGiaoGvDto;               // GET /ban-giao-gv/:id
export function ghiGopYGv(p: Principal, id: number, b: { studentId: number; mon: string; noiDung: string }): void;   // PUT /ban-giao-gv/:id/gop-y
export function ghiNhanXetChungGv(p: Principal, id: number, chu: string): void;            // PUT /ban-giao-gv/:id/nhan-xet (tuỳ chọn, rỗng = xoá)
export function xacNhanBanGiaoGv(p: Principal, id: number): void;                          // POST /ban-giao-gv/:id/xac-nhan
```
Luật: em = em đang học lớp lúc đọc (`HV_DANG_HOC_SQL`), tự điền = `tuDienTheoLo` (đọc theo lô, số câu không tăng theo em); đã xác nhận → đọc bản chụp `tu_dien`. Viết: `nguoi_lam` (hoặc QL `can(CASE_APPROVE,{classId})` khi `nguoi_lam` NULL hoặc quá `han` → `dien_thay = 1`). Góp ý: `chuTuDo`, trim ≠ '' (rỗng → 400 "Viết góp ý cho em này."), ≤ 1000 ký tự; UPSERT; `writeAudit('ban_giao_gv.gop_y')`. Xác nhận: mọi em × mọi cột `mo` có góp ý, không thì 400 "Còn {n} em thiếu góp ý."; chụp `tu_dien`, `trang_thai='xong'`; mỗi `nguoi_moi` một `notify` `kind 'ban_giao_gv'` `duong '/hoc-vien/lop/{id}?viec=ban-giao-gv&id={id}'`. Đọc: trước xác nhận người viết + QL; sau: `can(STUDENT_VIEW, {classId})`; còn lại 403. Sửa sau xác nhận: người viết / QL vẫn ghi góp ý được (có lịch sử — N3).

- [ ] **Step 1: Phép kiểm đỏ**
  - `B2 · A ghi góp ý L em 1 → đọc lại có; rỗng → 400; GVBM khác → 403; B (người mới) trước xác nhận → 403 đọc`.
  - `B2 · xác nhận khi thiếu 1 em → 400 "Còn 1 em thiếu góp ý."; đủ → xong, B nhận đúng 1 thông báo, B đọc được, tu_dien chụp`.
  - `B2 · QL điền thay khi quá hạn → dien_thay = 1; khi chưa quá hạn và nguoi_lam có → 403`.
  - `B2 · phieuBanGiaoGv số câu không tăng theo số em` (lớp 1 em vs lớp ≥ 10 em: chênh 0).
  - `B2 · trangThaiEmBg(['listening','gvcn'], { listening: x, gvcn: null })` → `{ khoa:'thieu', nhan:'Thiếu GVCN' }`.
- [ ] **Step 2:** → ĐỎ. **Step 3:** viết hàm + routes. **Step 4:** `PISA_CHI_TEP=prBanGiaoGv,prCt,prOv7a` → XANH (bàn giao chuyển lớp không đổi).
- [ ] **Step 5:** `git commit -m "PR-B Bàn giao đổi GV: phiếu, góp ý mỗi em mỗi cột, xác nhận, Điền thay, quyền đọc"`

### Task B3: Việc ở Công việc + dải hồ sơ lớp

**Files:** Modify `banGiaoGv.ts`, `worklist/mywork.ts`, `daiChuyenLop.ts`, `shared/domain/chuyenLop.ts`, `tocDoDuong.ts`; Test `prBanGiaoGv.tests.ts`.

**Interfaces — Produces:**
```ts
export function viecBanGiaoGv(userId: number | null, branchId?: number | null): { id: number; userId: number | null; lopId: number; code: string;
  monNgan: string[]; nguoiMoi: string; du: number; tong: number; han: string; emIds: number[] }[];   // ≤ 3 câu cho mọi việc
// DaiLop thêm:
banGiaoGv: { id: number; monNgan: string[]; nguoiMoi: string; nguoiCu: string; du: number; tong: number; han: string; vai: 'viet' | 'doc' }[];
xemTam: { monNgan: string[]; nguoiMoi: { id: number; ten: string }; tu: string; den: string; banGiao: { id: number; du: number; tong: number } | null } | null;
```
Luật: `mywork` thêm vòng như mục 2e (`ban_giao`, `mywork.ts:752`): `group 'ban_giao'`, `key 'ban_giao_gv:{id}'`, `tieuDe 'Bàn giao {lớp} · {L, GVCN}'`, `contextLabel 'cho {GV mới} · {du}/{tong} em'`, `due = han`, `actionLabel 'Bàn giao'`, `href '/hoc-vien/lop/{id}?viec=ban-giao-gv&id={id}'`, `ownerId = nguoi_lam` (NULL → QL chi nhánh qua `can(CASE_APPROVE)` như `tatCa`). `daiLop`: thêm vế `UNION ALL` (vẫn ≤ 20, không thêm lượt) đọc việc `mo` của lớp và việc `xong` ≤ 14 ngày (`vai 'doc'` khi người xem là `nguoi_moi` hoặc QL) + `xemTam` khi `xemTamCo` và người xem không còn ô nào ở lớp.

- [ ] **Step 1: Phép kiểm đỏ**
  - `B3 · myWork(A) có đúng 1 dòng ban_giao_gv:{id}, due = han, quá hạn → urgency overdue (không chặn)`.
  - `B3 · nguoi_lam NULL → myWork(QL chi nhánh, nguoi=tat-ca) có dòng; GV khác không`.
  - `B3 · classOverview(A).dai.xemTam có monNgan ['L'], den = xem_den; GV đang dạy lớp: xemTam null`.
  - `B3 · tocDo: '/my-work' và '/classes/{lopFT}/overview' vẫn dưới trần cũ` (chạy `tocDo.run.js`; vượt → nâng trần có lý do trong PR).
- [ ] **Step 2:** → ĐỎ. **Step 3:** viết. **Step 4:** → XANH.
- [ ] **Step 5:** `git commit -m "PR-B Bàn giao đổi GV: việc ở Công việc, dải hồ sơ lớp (đọc · GV cũ chỉ xem)"`

### Task B4: Khung bàn giao dùng chung + đồng bộ bàn giao chuyển lớp

**Files:** Create `web/src/modules/classes/banGiaoChung.tsx`; Modify `BanGiaoPanel.tsx`, `server/src/classes/banGiao.ts`, `routes/index.ts`; Test `prBanGiaoGv.tests.ts` (máy chủ) + `prNenTypoMau,prSang,prEn,prBang0,suaLoiNong`.

**Interfaces — Produces:**
```tsx
export function DsEmBanGiao<T extends { id: number; ten: string }>(p: { ds: T[]; chon: number; onChon: (id: number) => void;
  trangThai: (e: T) => { khoa: 'du' | 'thieu' | 'chua' | 'muted'; nhan: string }; phu: (e: T) => ReactNode; nhan: string }): JSX.Element;   // listbox ↑/↓, "Học viên · n em"
export function TuDienEm(p: { tuDien: TuDien | null; daChup: boolean }): JSX.Element;           // "Tự điền · chỉ đọc" / "· chụp lúc xác nhận"
export function OGopY(p: { nhan: string; ky: string; batBuoc: boolean; giaTri: string; docThoi?: boolean; aiGhi?: string;
  onLuu: (chu: string) => Promise<void> }): JSX.Element;   // "● Đang gõ · lưu khi rời ô" → "✓ Đã lưu"; lỗi giữ chữ
```
```ts
export function luuNhapNhanXet(p: Principal, lenhId: number, chu: string): void;   // PUT /lenh-chuyen/:id/nhan-xet-nhap — chỉ khi xac_nhan_luc NULL; KHÔNG kiểm ≥ 15
```
Luật: `BanGiaoPanel` (F) dùng ba thành phần; nhận xét chung GVCN lưu nháp khi rời ô (`luuNhapNhanXet`), Xác nhận vẫn kiểm `NHAN_XET_TOI_THIEU` như cũ; chữ nút đồng bộ ("Xác nhận bàn giao", "Đóng", "Tự lưu khi rời ô"). Bảng TRƯỚC → SAU ở `khop-khac.md` của PR (mọi thao tác G / F / Đọc giữ).

- [ ] **Step 1:** Phép kiểm đỏ `B4 · luuNhapNhanXet ghi nhan_xet_chung, xac_nhan_luc vẫn NULL; phiếu đã xác nhận → 400; xacNhanBanGiao vẫn 400 khi < 15 ký tự`.
- [ ] **Step 2:** → ĐỎ. **Step 3:** máy chủ + tách thành phần (không đổi DOM ngoài phần tách — ảnh cặp trước / sau panel chuyển lớp). **Step 4:** `PISA_CHI_TEP=prBanGiaoGv,prCt,prOv7a,prNenTypoMau,prSang,prEn,prBang0,suaLoiNong` + typecheck + esbuild → XANH.
- [ ] **Step 5:** `git commit -m "PR-B Bàn giao: khung chung (danh sách em, tự điền, ô góp ý lưu khi rời ô) cho cả chuyển lớp"`

### Task B5: Panel bàn giao đổi GV + lối vào + nghiệm thu

**Files:** Create `web/src/modules/classes/BanGiaoGvPanel.tsx`; Modify `PanelViec.tsx` (`key.startsWith('ban_giao_gv:')`), `ClassOverviewPage.tsx` (`viec === 'ban-giao-gv'`), `DaiChuyenLop.tsx` (`DaiDoiGv`: dải "Chỉ xem · …" + nút "Bàn giao · n/N em"; dải Bàn giao đọc), `shared/i18n/en/phanCongGv.ts`.

**Interfaces — Consumes:** B2 routes, B4 thành phần.

Bố cục theo mockup khu 6 + khu 9: `KhungPanel rong="toan"`, `loai="VIỆC · BÀN GIAO"` / `"BÀN GIAO · ĐỌC"`, tiêu đề `Bàn giao {lớp} · {L, GVCN} cho {GV mới}` (đọc: `… từ {GV cũ}`), ngữ cảnh `n em · a/b em đủ góp ý · hạn dd/mm · hiệu lực {W1 NOV | dd/mm}`; trái `DsEmBanGiao` (dòng phụ `L ✓ · GVCN –`), phải `TuDienEm` + một `OGopY` mỗi cột (cạnh nhau ≥ 1024, chồng < 1024, ô 44 px chữ 16 ở 375); "Nhận xét chung cả lớp · tuỳ chọn" gập ▸; chân "Tự lưu khi rời ô · Còn n em thiếu góp ý ↑" (bấm → em thiếu đầu) + Đóng + Xác nhận bàn giao (`aria-disabled` + `title` khi thiếu); "Em tiếp: {tên} ↓". Dải GV cũ: nền `surface-2`, vạch trung tính, chữ `Chỉ xem · {môn} đã giao cho {GV mới} từ {ngày} · còn xem tới khi xong bàn giao, ít nhất tới {dd/mm}`.

- [ ] **Step 1:** Bấm thử (một lần, `npm run dev` cổng riêng): GV cũ mở việc từ Công việc → viết 2 em → Đóng → mở lại còn chữ; Xác nhận tắt khi thiếu; đủ → toast; GV mới nhận chuông, mở hồ sơ lớp đọc; 375 panel toàn màn "‹ Công việc".
- [ ] **Step 2:** Ảnh cặp `node scripts/anh-cap.mjs thiet-ke/v9/phan-cong-gv.html "#k6 figure >> nth=<i>" <đường> <vai> <rộng>` cho khung 12–16, `#k9` khung 22–23; bảng KHỚP / KHÁC (≥ 90 %) + bảng truy vết ở `khop-khac.md`; `KHUNG_BASE=… node scripts/do-khung.mjs ban-giao` + `do-bang.mjs` xanh 1440 / 1280 / 375.
- [ ] **Step 3:** `/impeccable audit` + `/web-design-guidelines` trên tệp PR chạm; `/ponytail-review`.
- [ ] **Step 4:** typecheck + esbuild + `PISA_CHI_TEP=prBanGiaoGv,prNenTypoMau,prSang,prS4f,prEn,prBang0,suaLoiNong` → XANH.
- [ ] **Step 5:** `CODE_MAP.md`; `git commit -m "PR-B Bàn giao đổi GV: panel mẫu F nhiều cột, đọc của GV mới, dải GV cũ chỉ xem"`

---

## PR-C · Góc "Phân công GV" (web)

**Loại:** màn mới (mockup v9 duyệt) — `layout` + `polish` trong phạm vi · `clarify` · `harden` · `adapt` · cuối `audit` + `web-design-guidelines`; `/ponytail lite`. **Tệp:** tạo `web/src/modules/students/GocPhanCongGv.tsx`, `web/src/modules/students/phanCongGv/{BangLopPc,OGv,TongHopPc,TheLopPc,ThanhLuuPc}.tsx`, `web/src/modules/classes/HopLuuPhanCong.tsx`, `server/src/tests/prGocPhanCong.tests.ts`; sửa `StudentsPage.tsx`, `shared/domain/hocVienLop.ts` (`GOC_HOC_VIEN`, `docGoc`), `shared/domain/phanCongGv.ts` (MỌI hàm thuần của góc: `locLopPc`, `oThieuPc`, `nhomLopPc`, `cotLop`, `hangTongHop`, `kiemDongPc` — kiểm ở `prGocPhanCong.tests.ts`, đăng ký cuối `run.ts`), `web/src/index.css` (khối `/* PHAN-CONG-GV */`), `shared/i18n/en/phanCongGv.ts`, `CODE_MAP.md`.

**Bảng truy vết (Q-3) — 23 khung mockup:**

| # | Khung (`thiet-ke/v9/phan-cong-gv.html`) | Thành phần / tệp | Task | Ảnh | Ghi |
|---|---|---|---|---|---|
| 1 | k1 · 1440 QL bình thường | `GocPhanCongGv` · `BangLopPc` · `TongHopPc` | C1–C3 | cap-k1-1440 | BỎ nhãn "Xuất Excel · 16 lớp" → GIỮ nút cũ "Xuất Excel · n HV" (đặc tả 2b: không thêm Xuất) |
| 2 | k1 · 375 thẻ lớp | `TheLopPc` | C6 | cap-k1-375 | |
| 3 | k2 · 1440 tô sáng | `TongHopPc` · dải tô | C3 | cap-k2-1440 | |
| 4 | k2 · 375 dải tô dính | `TheLopPc` · dải tô | C6 | cap-k2-375 | |
| 5 | k3 · 1440 dòng nháp, lỗi GVCN, ô ▾ mở | `OGv` · `BangLopPc` | C4 | cap-k3-1440 | |
| 6 | k3 · 375 Sửa thẻ BE 07 | `TheLopPc` | C6 | cap-k3-375 | |
| 7 | k4 · 1440 GV nghỉ · 409 | `OGv` · dải lỗi dưới hàng | C4 | cap-k4-1440 | |
| 8 | k5 · 1440 hộp Lưu từ tuần | `HopLuuPhanCong` | C5 | cap-k5a-1440 | BỎ "· n việc" trong dòng Luôn chuyển (tự quyết, [XM]) |
| 9 | k5 · 375 hộp tấm dưới | `HopLuuPhanCong` | C6 | cap-k5-375 | |
| 10 | k5 · 1440 sau Lưu: Chờ đổi + toast | `OGv` · hộp Chờ đổi | C5 | cap-k5b-1440 | |
| 11 | k5 · 1440 Lưu cả 3 lớp | `ThanhLuuPc` · `HopLuuPhanCong` | C4–C5 | cap-k5c-1440 | |
| 12–16 | k6 · Công việc · panel 2 cột · panel 1 kỹ năng · 375 · đọc | — | PR-B | — | GIỮ (PR-B) |
| 17 | k7 · 1440 CX | `GocPhanCongGv` chỉ xem | C1–C2 | cap-k7-1440 | KHÁC: tên GV chữ thường, không link (CX không mở hồ sơ GV — `TenGiaoVien`, quyền máy chủ) |
| 18 | k7 · 375 CX | `TheLopPc` chỉ xem | C6 | cap-k7-375 | |
| 19 | k8 · 1440 rỗng chi nhánh | `GocPhanCongGv` rỗng | C1 | cap-k8-1440 | |
| 20 | k8 · 375 tìm không ra | `GocPhanCongGv` rỗng tìm | C6 | cap-k8-375 | |
| 21 | k9 · 1440 hồ sơ lớp + hộp | — | PR-D | — | GIỮ (PR-D) |
| 22–23 | k9 · GV cũ chỉ xem 1440 / 375 | — | PR-B | — | GIỮ (PR-B) |

GIỮ (không vẽ): tab "Cần làm" đã bỏ trên web; `+ Thêm học viên`, `⋯` trang; đang tải / lỗi tải như mọi góc; Quản trị toàn hệ thống → "Chọn chi nhánh để xem phân công" + ô chi nhánh.

### Task C1: Tab góc, tải một lần theo chi nhánh, thanh công cụ, chỉ xem, rỗng

**Files:** Modify `shared/domain/hocVienLop.ts`, `StudentsPage.tsx`; Create `GocPhanCongGv.tsx`; Test `prGocPhanCong.tests.ts`.

**Interfaces — Consumes:** A6 `GET /hoc-vien-lop/phan-cong`, `TrangPhanCongGv`. **Produces:** `GOC_HOC_VIEN` thêm `'phan-cong'`; `docGoc('phan-cong')` → `{ goc: 'phan-cong', loc: null }`; `export function GocPhanCongGv(p: { branchId: number | null; khung: 'tat-ca' | 'ft' | 'thuong'; q: string; onQ: (q: string) => void }): JSX.Element`; `export function locLopPc(lop: LopPc[], gv: GvPc[], o: { q: string; khung: string; thieu: boolean; ghim: ReadonlySet<number> }): LopPc[]`; `export function oThieuPc(lop: LopPc[], gv: GvPc[]): number` (ô Chưa có + ô người `nghi`/`ngoai-cn`).

Luật: tab "Phân công GV" (không số) chỉ khi `laVaiQuanLy(session.roles) || vai === 'cx'`; URL `view=phan-cong`; một `useApi` cho `/hoc-vien-lop/phan-cong?branchId=` (chi nhánh của bộ lọc trang). Thanh: ô tìm "Tìm lớp, GV" · nút `Thiếu GV · n ô` (`aria-pressed`) · phải "`n` lớp · `n` GV (n đã nghỉ)" + ⓘ (`NutLuat`). CX: dải "Chỉ xem — đổi phân công là việc của Quản lý chi nhánh." (`.bao-chi-xem`). Rỗng: "Chi nhánh chưa có lớp nào" + `+ Lớp mới` (chỉ `coTheTaoLop`); tìm không ra: "Không có lớp hay GV khớp "{q}"" + `Xoá tìm · n lớp`.

- [ ] **Step 1:** Phép kiểm đỏ thuần: `C1 · docGoc('phan-cong')`; `C1 · locLopPc tìm "Hà Hoàng" giữ đúng 7 lớp mockup có cô; tìm mã lớp; khung 'thuong' bỏ FT; dòng ghim (nháp) luôn còn`; `C1 · oThieuPc dữ liệu mockup = số mockup tính (`oThieu`)`.
- [ ] **Step 2:** → ĐỎ. **Step 3:** viết. **Step 4:** `PISA_CHI_TEP=prGocPhanCong` + typecheck → XANH.
- [ ] **Step 5:** `git commit -m "PR-C Góc Phân công GV: tab, tải theo chi nhánh, tìm, Thiếu GV, chỉ xem, rỗng"`

### Task C2: Bảng lớp 1440 — nhóm, cột, ô

**Files:** Create `phanCongGv/BangLopPc.tsx`, `phanCongGv/OGv.tsx`; Modify `web/src/index.css`, `shared/domain/phanCongGv.ts`.

**Interfaces — Produces:** `export function nhomLopPc(lop: LopPc[]): { ft: LopPc[]; thuong: { ct: string; ten: string; lop: LopPc[] }[] }` (thứ tự FOU · BE · ELE · PET · KET · PREFOU, còn lại theo mã; trong nhóm `soSanhLop`); `export function cotLop(l: LopPc): (OPhanCong | null)[]` (= `oPhanCong(ct, kyNang)` bỏ GVCN, đệm `null` tới 5 ô; GVCN luôn cột cuối; Pre FOU = `[]` → hàng "Không chia môn — GVCN dạy luôn"); `OGv` props `{ lop, khoa, nguoi: GvPc | null, trangThai: 'binh-thuong' | 'trong' | 'nghi' | 'doi' | 'loi' | 'cho-doi' | 'khac-doi', to: boolean, phu?: string, loi?: string, chiXem: boolean, onMo }`.

Hình: theo CSS mockup `.nhom-1` (44 px, `surface-2`, vạch `--hang-lon-vach`, 15/700) · `.nhom-2` (36 px, 14/600) · `.pc` (`table-layout: fixed; width: 100%`; cột Lớp cố định ~200 px, 5 cột ô + GVCN chia đều phần còn lại, cột Lưu 120 px) · ô `.o-gv` 38 px 14/500, ▾ mask, rê / focus viền `line-strong`, trạng thái màu dùng token `rgb(var(--soon-bg-rgb))`, `--doing-*`, `--bad-*`, `--accent-soft`, tô `surface-2` + vạch 3 px `--hong` + chấm. **Cột GVCN nổi bật:** `th` + `td` GVCN nền `surface-2` cả cột, `box-shadow: inset 3px 0 0 var(--accent)`, tiêu đề 13/700 `--text`. Tên lớp = link hồ sơ lớp (15/600) + dòng phụ `LT1 · 16 HV` / `tuần 3/8 · 15 HV`. CX: ô là chữ (`TenGiaoVien`), "– Chưa có" vàng, "⚠ đã nghỉ"; không cột Lưu. `th` không chứa điều khiển (G9). Tên dài: `truncate` + `title`.

- [ ] **Step 1:** Phép kiểm đỏ thuần `C2 · nhomLopPc dữ liệu mockup → FT 10, nhóm FOU 2 · BE 2 · PREFOU 2 đúng thứ tự`; `C2 · cotLop FT = 5 ô, BE = 4 ô + null, PREFOU = []`.
- [ ] **Step 2:** → ĐỎ. **Step 3:** viết + CSS. **Step 4:** `PISA_CHI_TEP=prGocPhanCong,prNenTypoMau,prSang,prBang0` → XANH.
- [ ] **Step 5:** `git commit -m "PR-C Góc Phân công GV: bảng lớp full width, nhóm theo chương trình, cột GVCN nổi bật"`

### Task C3: Hai bảng tổng hợp + tô sáng + số "cũ → mới"

**Files:** Create `phanCongGv/TongHopPc.tsx`; Modify `GocPhanCongGv.tsx`; Test `prGocPhanCong.tests.ts`.

**Interfaces — Consumes:** A1 `demPhanCong`. **Produces:** `export function hangTongHop(dem: Map<number, DemGv>, gv: GvPc[], loai: 'day' | 'cn', xep: 'tong' | 'ft' | 'th' | 'ten'): { id: number; ten: string; nghi: boolean; a: number; b: number; tong: number }[]` (mọi ứng viên kể cả 0; `cn` bỏ người nghỉ có 0; mặc định Tổng giảm dần, hoà theo tên `vi`).

Luật: `demPhanCong(lop đã lưu)` và `demPhanCong(lop + nháp)` — khác nhau thì ô hiện `cũ → mới` màu nhấn (tổng hợp, dải tô, dòng phụ ô chọn). Bảng "Giảng dạy · số môn đang dạy" / "GVCN · số lớp chủ nhiệm", cột GV · FT · Lớp thường · Tổng, chân Tổng; ô Xếp "Xếp: Tổng ▾" ngoài `th`; 0 xám. Tên GV = nút bật tô (`aria-pressed`); dải "Đang tô {GV} · dạy n môn · GVCN n lớp · ở n lớp" + `Chỉ hiện n lớp` (= điền ô tìm tên GV) + `Hồ sơ GV ›` (`duongHoSoGiaoVien`, chỉ khi người xem mở được) + `✕ Bỏ tô`; bấm tô → cuộn tới ô đầu. 1440: hai bảng cạnh nhau dưới bảng lớp.

- [ ] **Step 1:** Phép kiểm đỏ `C3 · hangTongHop dữ liệu mockup: dòng đầu Giảng dạy là người Tổng lớn nhất, Châu Nguyễn tong 0 có mặt, cn bỏ Liên Vũ (nghỉ, 0)`; `C3 · nháp đổi L 137 Hà → Phong: Hà ft 7 → 6, Phong +1` (qua `demPhanCong` hai lần).
- [ ] **Step 2:** → ĐỎ. **Step 3:** viết. **Step 4:** → XANH.
- [ ] **Step 5:** `git commit -m "PR-C Góc Phân công GV: tổng hợp Giảng dạy / GVCN, tô sáng GV, số cũ → mới khi có nháp"`

### Task C4: Sửa theo dòng, ô chọn, Lưu cả n lớp, 409, rời trang

**Files:** Modify `OGv.tsx`, `BangLopPc.tsx`, `GocPhanCongGv.tsx`; Create `phanCongGv/ThanhLuuPc.tsx`; Test `prGocPhanCong.tests.ts`.

**Interfaces — Produces:** `export function kiemDongPc(l: LopPc, chon: Record<string, number | ''>, gv: GvPc[]): { khoa: string; lyDo: string }[]` (= `kiemPhanCong` trên bức tranh dòng + ô còn người `nghi` → "Đã nghỉ — chọn người thay hoặc Bỏ trống" / `ngoai-cn`); trạng thái nháp `Record<classId, Record<khoa, number | ''>>` trong `GocPhanCongGv`.

Luật: danh sách chọn = `ChonNguoi` sẵn có (`ds` ứng viên, phụ "dạy n · GVCN n" + "dạy được …" như `phuGv`), ô GVCN: người đang dạy lớp lên đầu (nhóm "Đang dạy lớp này" / "GV khác · {CN}"), cuối "Bỏ trống (Chưa có)"; người nghỉ không có trong danh sách. Đổi ô → dòng nháp (vạch nhấn đầu dòng + "Nháp · n ô đổi", ô `doi` + phụ "trước: {tên}"), cuối dòng `Huỷ · Lưu` (Lưu `aria-disabled` + `title` lý do khi `kiemDongPc` có lỗi; lỗi tại ô `aria-describedby`). Ô chờ đổi: chọn = đổi người cùng mốc (hộp C5 mở sẵn tuần của lịch). Từ 2 dòng nháp: `ThanhLuuPc` dính chân bảng "n lớp đang sửa · n ô · Huỷ hết · Lưu cả n lớp…". 409 / 400 có `details.classId` → giữ MỌI nháp; lớp đó: tải lại (`reload` một lần), `gopChonSau409` cho dòng đó, ô người khác vừa đổi `khac-doi` + dải lỗi dưới hàng. Rời trang / đổi tab / đổi chi nhánh còn nháp → `beforeunload` + `window.confirm` MỘT lần "n lớp chưa lưu" (mẫu `CuoiKhoaLop.tsx:113`). Phím: ← ↑ → ↓ giữa ô, Enter / Space mở, Esc đóng (giữ giá trị), Ctrl + Enter = Lưu dòng.

- [ ] **Step 1:** Phép kiểm đỏ `C4 · RF1-web: kiemDongPc dòng không nháp mà có ô nghỉ → [] ở luồng hiển thị (chỉ gọi cho dòng nháp); dòng nháp còn ô nghỉ → lỗi khoa đó`; `C4 · kiemDongPc 137 đổi L sang Phong, GVCN còn Hà → lỗi gvcn "GVCN phải dạy ít nhất một kỹ năng…"`.
- [ ] **Step 2:** → ĐỎ. **Step 3:** viết. **Step 4:** → XANH; bấm thử phím + 409 (hai tab cùng lớp).
- [ ] **Step 5:** `git commit -m "PR-C Góc Phân công GV: sửa theo dòng, ô chọn ChonNguoi, Lưu cả n lớp, 409 giữ nháp"`

### Task C5: Hộp Lưu dùng chung + sau lưu + Chờ đổi

**Files:** Create `web/src/modules/classes/HopLuuPhanCong.tsx`; Modify `GocPhanCongGv.tsx`, `OGv.tsx`.

**Interfaces — Consumes:** A6 `POST /phan-cong/xem-truoc`, A2 `POST /phan-cong/luu`, A4 `hoan-tac`, `cho/doi-moc`, `cho/huy`. **Produces (PR-D dùng):**
```tsx
export function HopLuuPhanCong(p: { lop: { classId: number; code: string; slots: SlotPhanCong[]; phienBan: string }[];
  tuanMacDinh?: number | null; onQuayLai: () => void; onDaLuu: (kq: KetQuaLuu & { viec?: number }) => void; neo?: 'dong' | 'tam-duoi' }): JSX.Element;
export async function luuThang(lop: { classId: number; slots: SlotPhanCong[]; phienBan: string }[]): Promise<KetQuaLuu>;   // không có cặp A → B: lưu hôm nay, không hộp
```
Luật: mở khi có ít nhất một cặp `laCapBanGiao`; gọi `xem-truoc` một lần. Nội dung (đúng chữ mockup khu 5): tiêu đề `Lưu phân công · {lớp}` / `· n lớp` + phụ `n ô đổi · N HV`; "Hiệu lực" radio `Ngay hôm nay {dd/mm}` · `Từ tuần [WeekPicker toiThieu = thứ Hai tuần sau]` + câu hậu quả; "Đổi người": mỗi cặp `{môn} {A} → {B}` + ô tích "Tạo việc bàn giao" (mặc định có) + dòng ngoài vùng bấm `Luôn chuyển sang {B}: n Case · n PA.` (0 thì không dòng) + `{A} đã nghỉ → việc bàn giao do GVCN {X} viết` khi `nguoiViet.loai !== 'gv-cu'`; nhiều lớp: cặp gom theo lớp; dòng tải `→ n việc · n góp ý … · hạn dd/mm` (`hanBanGiaoGv(homNay)`); dòng mắt `{A} vẫn xem lớp này tới khi xong bàn giao, ít nhất tới {xemDen}. Điểm đã chấm giữ tên GV cũ.`; chân `Quay lại sửa` · nút chính nói kết quả (`Lưu · tạo n việc bàn giao` / `Lưu`). Nhớ hiệu lực trong phiên (`sessionStorage`, try/catch). Sau lưu: dòng "✓ Đã lưu" (vạch `ok`) hoặc "Chờ đổi · W1 NOV"; `toast.hoanTac('Đã lưu phân công {lớp} · tạo n việc bàn giao cho {A}', () => api.post('/phan-cong/hoan-tac', { lo }))`; `invalidateGop('/hoc-vien-lop/phan-cong', '/my-work', '/classes')` — KHÔNG tải lại cả bảng (cập nhật `slots` dòng từ bản đã gửi; trang tự khớp lần vô hiệu gộp). Nút "Chờ đổi" cuối dòng → hộp nhỏ `Chờ đổi · {lớp}` (cặp, "Việc bàn giao của {A}: a/b em đã viết · hạn", câu hậu quả) + `Đổi mốc…` (WeekPicker / Ngay hôm nay) · `Huỷ lịch đổi ({môn})` → toast Hoàn tác (`dao`).

- [ ] **Step 1:** Bấm thử `RF5-web`: hai dòng nháp, sửa tay `phienBan` lớp 2 (DevTools) → Lưu cả 2 lớp → lỗi chỉ lớp 2, cả hai dòng còn nháp; Hoàn tác trong 5 s đảo được; Chờ đổi → Huỷ lịch đổi → Hoàn tác.
- [ ] **Step 2:** Bấm thử luồng mockup: 137 (L + GVCN Hà → Phong, Từ tuần) → hộp đúng "1 việc · 2 cột × 12 em"; BE 07 S (Ngay hôm nay) → "✓ Đã lưu" + toast; số tổng hợp đổi ngay.
- [ ] **Step 3:** Viết `HopLuuPhanCong`, `luuThang`, hộp Chờ đổi.
- [ ] **Step 4:** typecheck + esbuild + `PISA_CHI_TEP=prGocPhanCong,prNenTypoMau,prSang,prS4f,prEn,prBang0,suaLoiNong` → XANH.
- [ ] **Step 5:** `git commit -m "PR-C Góc Phân công GV: hộp Lưu (hiệu lực, cặp bàn giao, Luôn chuyển), Hoàn tác, Chờ đổi"`

### Task C6: 375 / dưới 1024 + nghiệm thu

**Files:** Create `phanCongGv/TheLopPc.tsx`; Modify `GocPhanCongGv.tsx`, `TongHopPc.tsx`, `HopLuuPhanCong.tsx` (`neo='tam-duoi'`).

Luật: < 1024 px (`matchMedia('(max-width: 1023px)')`) → thẻ lớp (lưới 2 cột từ 640): đầu thẻ mã lớp (link) + phụ + `Sửa`; `dl` gom người theo GV ("L · R · GVCN  Ms. Hà Hoàng", "GVCN · dạy luôn" Pre FOU, "– Chưa có" vàng); `Sửa` → ô từng môn 44 px chữ 16, một thẻ sửa một lúc, `Huỷ · Lưu` chia đôi chân thẻ; hộp Lưu thành tấm dưới có nền che. Tab góc cuộn ngang, tab đang chọn trong khung. Dải tô dính đầu danh sách (`Chỉ hiện n lớp` + `✕ Bỏ tô`). Tổng hợp: 6 / 4 dòng đầu + `Xem đủ n GV`. CX: thẻ không có `Sửa`.

- [ ] **Step 1:** Bấm thử 375 sáng + 1440 tối, vai QL (2), CX (24): mọi khung bảng truy vết; Quản trị (1) toàn hệ thống → "Chọn chi nhánh để xem phân công".
- [ ] **Step 2:** Ảnh cặp cho khung 1–11, 17–20 (`node scripts/anh-cap.mjs thiet-ke/v9/phan-cong-gv.html "#k1 figure >> nth=0" "hoc-vien?view=phan-cong&cn=<MB>" 2 1440 …`), bảng KHỚP / KHÁC ≥ 90 % + bảng TRƯỚC → SAU (từ ghi chú mockup) ở `khop-khac.md`; mọi [XM] chép vào `plan.md` mục 4 "Việc để sau".
- [ ] **Step 3:** `do-khung.mjs phan-cong` + `do-bang.mjs phan-cong` xanh 1440 / 1280 / 375; `/impeccable audit` + `/web-design-guidelines`; `/ponytail-review`.
- [ ] **Step 4:** typecheck + esbuild + `PISA_CHI_TEP=prGocPhanCong,prNenTypoMau,prSang,prS4f,prEn,prBang0,suaLoiNong` → XANH.
- [ ] **Step 5:** `CODE_MAP.md` (Học viên & Lớp: góc Phân công GV); `git commit -m "PR-C Góc Phân công GV: thẻ lớp 375 / dưới 1024, tấm dưới, nghiệm thu ảnh cặp"`

---

## PR-D · Hồ sơ lớp dùng cùng hộp Lưu

**Loại:** sửa nhỏ (thành phần từ PR-C) · `clarify` · `harden` · cuối `audit`; `/ponytail lite`. **Tệp:** sửa `web/src/modules/classes/TeacherAssignPanel.tsx` (`PhanPhanCong.luu`), `web/src/modules/classes/DauTrangLop.tsx` (hàng GV), `server/src/classes/classes.ts` (`classOverview` thêm `phanCongCho`), `server/src/tests/prPhanCongGv.tests.ts` (thêm), `shared/i18n/en/phanCongGv.ts`.

### Task D1: Lưu phân công ở Thông tin lớp đi cùng đường + cùng hộp

**Interfaces — Consumes:** C5 `HopLuuPhanCong`, `luuThang`; A2 `POST /phan-cong/luu`.

Luật: `PhanPhanCong.luu`: tính cặp bằng `doiTheoO(programmeCode, skills, cũ, slots)`; có cặp `laCapBanGiao` → mở `HopLuuPhanCong` (một lớp, neo cạnh panel như khung 21); không có → `luuThang` (hôm nay). GIỮ: lưới ô, "Đã từng dạy lớp này", FOU Tách / Gộp, GVCN chỉ đổi ô bộ môn (máy chủ vẫn 403 ô GVCN), 409 → `gopChonSau409`. Sau lưu: toast + Hoàn tác (`lo`), `invalidate('/classes')`, `invalidateGop('/my-work', '/hoc-vien-lop/phan-cong')`.

- [ ] **Step 1:** Phép kiểm đỏ máy chủ `D1 · GVCN gửi POST /phan-cong/luu đổi ô bộ môn lớp mình qua hộp (có banGiao) → đạt, có việc bàn giao; CX → 403`.
- [ ] **Step 2:** → ĐỎ (nếu đã xanh từ A2/B1: ghi lại, giữ phép kiểm). **Step 3:** sửa `PhanPhanCong`. **Step 4:** bấm thử QL + GVCN; `PISA_CHI_TEP=prPhanCongGv,prNenTypoMau,prSang,prEn,suaLoiNong` + typecheck + esbuild → XANH.
- [ ] **Step 5:** `git commit -m "PR-D Hồ sơ lớp: Lưu phân công dùng cùng hộp hiệu lực + bàn giao, Hoàn tác"`

### Task D2: Hiện "Chờ đổi" ở hồ sơ lớp

**Interfaces — Produces:** `classOverview(...).phanCongCho: DoiChoPc[]` (một câu, dòng `cho` của lớp).

Luật: hàng GV đầu hồ sơ lớp: ô có lịch `"{môn} {A} → {B} từ {W1 NOV}"`; Thông tin lớp › Phân công (xem) cùng chữ; lỗi áp (`loi`) → "⚠ chưa đổi được: {lỗi}" chỉ QL.

- [ ] **Step 1:** Phép kiểm đỏ `D2 · classOverview có phanCongCho đúng dòng cho; số câu overview +0 lượt (vế UNION hoặc câu gộp — đo tocDo không vượt trần)`.
- [ ] **Step 2:** → ĐỎ. **Step 3:** viết. **Step 4:** ảnh cặp khung 21 (`#k9 figure >> nth=0`) + bảng KHỚP / KHÁC; `/impeccable audit`; `/ponytail-review`; kiểm như D1 → XANH.
- [ ] **Step 5:** `CODE_MAP.md`; `git commit -m "PR-D Hồ sơ lớp: hiện lịch Chờ đổi ở hàng GV và Thông tin lớp"`

## PTA duyệt (30/10)
- Hạn việc bàn giao: theo hàm chung (5 ngày tính cả ngày tạo — tạo 30/10 → hạn 03/11); mockup 04/11 là vẽ tay, theo hàm.
- Dòng "Luôn chuyển sang B": chỉ đếm Case · PA (không dựng Công việc của GV cũ).
- CX: tên GV chữ thường (không link) — KHÁC có lý do.
- Task B4 (lưu nháp nhận xét chung bàn giao chuyển lớp khi rời ô): LÀM — chống mất chữ; luật ≥ 15 ký tự khi Xác nhận giữ.
- Các quyết định khác của người soạn (bảng `doi_phan_cong`, ba bảng phiếu mới, gộp theo lớp + GV cũ + hiệu lực, 768–1023 dùng thẻ, Hoàn tác qua `ghi_dao`, GV cũ chỉ mở ATTEMPT_VIEW + STUDENT_VIEW): ĐỒNG Ý.
- **Chủ SP 30/10 (thêm vào PR-B, phần khung bàn giao chung):** bàn giao CHUYỂN LỚP — kỹ năng nào ở lớp mới vẫn do ĐÚNG GV cũ dạy (cùng kỹ năng, cùng người nhận) thì KHÔNG cần bàn giao: dòng môn ghi "Cùng GV · không cần bàn giao", không tính thiếu, không tạo việc cho GV đó. [PTA đoán] GVCN lớp cũ = GVCN lớp mới → nhận xét chung của GVCN không bắt buộc. Phép kiểm cho cả hai.

## Prompt cho chủ SP dán vào session mới (PTA 30/10 — PR-A đã merge #714)

### PR-B `ban-giao-gv` (song song PR-C)
```
Bạn là session code PR-B "BAN-GIAO-GV" của PISA Tracking (Opus 5.5, effort medium; không Fable). Đặt tên session "BAN-GIAO-GV".
Đọc: CLAUDE.md (gồm "Dòng đọc Turso"), plan.md mục 1 (1.2, 1.4, 1.6 N29), docs/pisa-slot/KIEM-NHANH.txt, đặc tả docs/superpowers/specs/2026-10-30-phan-cong-gv-design.md (HẾT),
mockup thiet-ke/v9/phan-cong-gv.html + phan-cong-gv-ghi-chu.md, kế hoạch docs/superpowers/plans/2026-10-30-phan-cong-gv.md (Global Constraints, Review Focus, Tự quyết, PTA duyệt, PR-B Task B1–B5).
Thêm (PTA 30/10): luật chủ SP "kỹ năng ở lớp mới vẫn đúng GV cũ dạy → không cần bàn giao" (mục PTA duyệt) + gom câu `luuPhanCong` theo lô (ghi chú ponytail TRAN_GHI_LO; từ kế hoạch toc-do) nếu chạm cùng tệp.
Làm từng Task bằng superpowers:executing-plans (mỗi Task superpowers:test-driven-development, đỏ trước), karpathy-guidelines + ponytail; PR có web: /ponytail lite đầu phiên.
Nhánh mới từ origin/main mới nhất, worktree .claude/worktrees/ban-giao-gv. Cổng riêng (không 4000/5173). Kiểm theo KIEM-NHANH; KHÔNG npm run check đầy đủ. Có migrate → ghi tên + cách kiểm trong mô tả PR.
Panel bàn giao là làm lại màn: ảnh cặp mockup | web (1440 tối + 375 sáng) + khop-khac.md (bảng truy vết + thao tác TRƯỚC → SAU); chủ SP duyệt ảnh trước merge.
Trước khi mở PR: impeccable audit + web-design-guidelines, /ponytail-review. Mở PR vào main, KHÔNG merge (PTA rà sâu /security-review + /code-review high).
Xong nhắn "PTA Plan" bằng SendMessage (link PR, ảnh, ước dòng đọc mới). Chỉ tắt tiến trình của worktree mình.
```

### PR-C `goc-phan-cong-gv` (song song PR-B)
```
Bạn là session code PR-C "GOC-PHAN-CONG-GV" của PISA Tracking (Opus 5.5, effort medium; không Fable). Đặt tên session "GOC-PHAN-CONG-GV". /ponytail lite đầu phiên.
Đọc: CLAUDE.md (gồm "Dòng đọc Turso", luật giao diện, "Nâng cấp không chép mockup"), DESIGN.md, plan.md mục 1 (1.2, 1.3b, 1.4, 1.6), docs/pisa-slot/KIEM-NHANH.txt,
đặc tả docs/superpowers/specs/2026-10-30-phan-cong-gv-design.md (HẾT), mockup thiet-ke/v9/phan-cong-gv.html + phan-cong-gv-ghi-chu.md (chuẩn HÌNH ẢNH, học sát),
kế hoạch docs/superpowers/plans/2026-10-30-phan-cong-gv.md (Global Constraints, Review Focus, Tự quyết, PTA duyệt, PR-C Task C1–C6).
Lưu ý chồng tệp: SUA-NHO-UI (kế hoạch 2026-10-30-sua-nho.md U4) thêm `NguoiTrongDs.tat` ở PeoplePicker.tsx — nếu đã merge thì dùng, chưa thì không tự thêm.
Làm từng Task bằng superpowers:executing-plans (mỗi Task superpowers:test-driven-development), karpathy-guidelines + ponytail; impeccable: layout, clarify, harden, adapt trong phạm vi; polish được (màn mới).
Nhánh mới từ origin/main mới nhất, worktree .claude/worktrees/goc-phan-cong-gv. Cổng riêng. Kiểm theo KIEM-NHANH (+ PISA_CHI_TEP=prNenTypoMau,prSang,prS4f,prEn,prBang0,suaLoiNong); KHÔNG npm run check đầy đủ.
Màn mới: ảnh cặp toàn trang mockup | web (1440 tối + 375 sáng, + 768) + khop-khac.md (bảng truy vết, ≥ 90 % KHỚP); chủ SP duyệt ảnh trước merge.
Trước khi mở PR: impeccable audit + web-design-guidelines, /ponytail-review. Mở PR vào main, KHÔNG merge. Xong nhắn "PTA Plan" (link PR, ảnh, % KHỚP). Chỉ tắt tiến trình của worktree mình.
```

### PR-D `ho-so-lop-luu-pc` — PTA đưa khi PR-C đã merge (và PR-B đã merge: cùng chạm hồ sơ lớp; LOP-1-LOP cũng sửa DauTrangLop.tsx — không chạy song song).
