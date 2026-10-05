# PR-K26 · Lộ trình tiếp theo theo dải % Cuối khoá — Kế hoạch (04/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GVCN ghi Lộ trình tiếp theo nhanh và đúng luật dải % Cuối khoá: hướng gợi ý đứng đầu, em 50–59% ghi là **đề xuất** (Quản lý quyết), một hướng "Chưa quyết" thay hai hướng trùng nghĩa, và ghi được cho cả lớp trên một bảng.

**Architecture:** Luật thuần ở `shared/domain/lenLop.ts` (danh sách hướng, nhãn, thứ tự theo gợi ý) dùng chung cho panel một em và bảng cả lớp. Máy chủ: gộp `chua_ro` + `xep_sau` thành một giá trị `chua_quyet` (migrate `prK26`, đổi dữ liệu có sẵn), và một đường ghi cả lớp gọi lại đúng luật kiểm của `ghiLoTrinhTiep` trong **một** giao dịch. Không có thẻ Chờ duyệt mới: Quản lý quyết khi ra lệnh chuyển lớp (PR-CT), như hôm nay.

**Tech Stack:** Express + SQLite/Turso, React + Tailwind, phép kiểm `server/src/tests/*.tests.ts`.

**Spec:** `plan.md` mục 4 "PR-K26" + chủ sản phẩm trả lời 04/10 tối (ba câu dưới); `thiet-ke/ra-27-09/K2.md` dòng K2-26; Rulebook §20.6 (dải < 50 · 50–59 · 60–69 · ≥ 70; 50–59 "Quản lý cân nhắc").

## Chủ sản phẩm chốt 04/10 tối
1. Em 50–59%: **GVCN ghi đề xuất, Quản lý quyết lúc chuyển lớp** — không thẻ Chờ duyệt. Panel ghi "Hướng bạn đề xuất (Quản lý quyết)", hai hướng gợi ý đứng đầu (Lên {bậc kế} + bổ trợ · Học lại {bậc}), nút "Lưu đề xuất".
2. "Chưa rõ" (bước Lộ trình tiếp theo) và "Xếp sau" (bước Chuyển tiếp lớp): **gộp hẳn thành một hướng** — đổi cả dữ liệu.
3. **Làm luôn** "Ghi lộ trình tiếp theo cả lớp" (menu ⋮ hồ sơ lớp).

## Global Constraints
- Nhãn hướng gộp: `Chưa quyết`; dòng nghĩa: `Chưa quyết định, hẹn ngày xem lại`. Ở bảng ngắn: `Chưa quyết · xem lại {dd/mm}` khi có ngày, không có ngày thì `Chưa quyết`.
- Ngày xem lại: **bắt buộc** ở bước Chuyển tiếp lớp (như "Xếp sau" cũ); **tuỳ chọn** ở Lộ trình tiếp theo (như "Chưa rõ" cũ).
- Gợi ý không lưu (Rulebook §20.6); chỉ đổi thứ tự hiện và nhãn nút. Em chưa đủ điểm Cuối khoá → không có gợi ý, danh sách hướng như cũ.
- Máy chủ vẫn nhận `chua_ro`/`xep_sau` từ form cũ đang mở → đổi thành `chua_quyet` (mẫu `accounts.ts:177`), không báo lỗi.
- Migrate riêng `server/src/migrate/prK26.ts`, chạy lặp được, gọi cuối dãy migrate trong `migrate.ts`. Không đổi `schema.sql` (cột `huong` là TEXT), chỉ sửa chú thích giá trị.
- Ghi cả lớp: một giao dịch, tất cả hoặc không; ≤ 60 em/lần; quyền như ghi một em (`STUDENT_EDIT` theo lớp); đường mới có trần ở `tocDoDuong.ts`.
- `/ponytail lite`. Phép kiểm `server/src/tests/prK26.tests.ts`, gọi cuối `run.ts`. Hàm mới ở `shared/domain/*` re-export qua `index.ts`.

## Review Focus
1. Em đã ghi `xep_sau` có `ngay_xem_lai` tương lai → sau migrate vẫn không đỏ ở badge Hết khoá (`schedule.ts:356-363`, `:417`).
2. Em đã ghi `chua_ro` không ngày → sau migrate vẫn được nhắc trong hai tuần cuối (`loTrinhTiep.ts:195`).
3. Ghi cả lớp có một dòng sai (lớp dự kiến khác chi nhánh) → không lưu dòng nào, báo đúng em/dòng.
4. Em 50–59% đã có bản ghi `hoc_lai` từ trước → panel mở đúng lựa chọn đó (nằm trong hai hướng đầu), không bị giấu trong "Hướng khác".
5. Bảng Chuyển tiếp lớp (PR-CT) đọc bản ghi `chua_quyet` → điền sẵn đúng hướng "Chưa quyết" + ngày.

---

### Task K26-1: Luật hướng (thuần)

**Files:**
- Modify: `shared/domain/lenLop.ts:10-60` (`Huong`, `HUONG_TIEP`, `HUONG_CHUYEN_TIEP`, `nhan`, nhãn cột Khoá :57)
- Test: `server/src/tests/prK26.tests.ts`

**Interfaces:**
- Produces: `Huong` = `'len_lop' | 'fast_track' | 'hoc_lai' | 'bao_luu' | 'dung_hoc' | 'chua_quyet'`; `HUONG_TIEP`, `HUONG_CHUYEN_TIEP` cùng chứa `chua_quyet` (bỏ `chua_ro`, `xep_sau`).
- Produces: `chuanHoaHuong(x: string): Huong | null` — `chua_ro`/`xep_sau` → `chua_quyet`; giá trị hợp lệ giữ; còn lại null.
- Produces: `xepHuongTheoGoiY(cacHuong: readonly Huong[], goiY: { huong: 'hoc_lai' | 'len' | null; canQuanLy: boolean } | null): { dau: Huong[]; khac: Huong[] }` — `len` → `dau = ['len_lop']`; `hoc_lai` → `['hoc_lai']`; `canQuanLy` → `['len_lop', 'hoc_lai']`; null → `dau = []`, `khac = cacHuong`. Hướng không có trong `cacHuong` (ELE không có `len_lop`) bị bỏ khỏi `dau`.

- [x] **Step 1: Phép kiểm đỏ** `K26-1`: `chuanHoaHuong('xep_sau') === 'chua_quyet'`, `('chua_ro')` → `'chua_quyet'`, `('abc')` → null; `nhanHuong('chua_quyet', …) === 'Chưa quyết'`; `xepHuongTheoGoiY(HUONG_TIEP, { huong: null, canQuanLy: true }).dau` = `['len_lop','hoc_lai']`, `khac` không chứa hai hướng đó; với `huongTiepKhaDung('ELE')` không có `len_lop` trong `dau`.
- [x] **Step 2: Đỏ** → **Step 3: Sửa** `lenLop.ts` (cập nhật mọi `switch`/đếm `khongChuyen.xep_sau` → `chua_quyet`, chữ tóm tắt `"{n} em chưa quyết"`). Chạy `npm run typecheck` để thấy mọi chỗ còn dùng hai giá trị cũ; sửa từng chỗ (`transition.ts:218-330`, `schedule.ts:329-417`, `cuoiKhoa.ts:551`, `loTrinhTiep.ts:195`, `LoTrinhTiepPanel.tsx:47`, bảng Chuyển tiếp).
- [x] **Step 4:** `npm run check` → commit `"PR-K26 (1): một hướng Chưa quyết thay Chưa rõ/Xếp sau, thứ tự hướng theo gợi ý Cuối khoá"`.

### Task K26-2: Migrate + máy chủ nhận giá trị cũ

**Files:**
- Create: `server/src/migrate/prK26.ts`; Modify: `server/src/migrate.ts` (gọi cuối dãy), `server/src/classes/loTrinhTiep.ts:86-100` (`ghiLoTrinhTiep`), `server/src/classes/transition.ts` (nhận hướng bước 2), `server/src/schema.sql:406` (chú thích)
- Test: `server/src/tests/prK26.tests.ts`

**Interfaces:**
- Produces: `migratePrK26(conn: any, applied: string[]): void` — `UPDATE lo_trinh_tiep_theo SET huong = 'chua_quyet' WHERE huong IN ('chua_ro','xep_sau')`; ghi `applied` chỉ khi `changes > 0`.

- [x] **Step 1: Phép kiểm đỏ** `K26-2a`: chèn hai bản ghi `chua_ro` (không ngày) và `xep_sau` (ngày xem lại tương lai) → `migratePrK26` → cả hai `chua_quyet`, ngày giữ; chạy lần hai `applied` rỗng. `K26-2b`: em `chua_quyet` + ngày tương lai không vào đếm đỏ Hết khoá (cùng hàm ở `schedule.ts:356`); em `chua_quyet` không ngày ở hai tuần cuối → `lopHocCua(...).nhacLoTrinh === true`. `K26-2c`: `ghiLoTrinhTiep(..., { huong: 'xep_sau' })` → lưu `chua_quyet`, không lỗi.
- [x] **Step 2: Đỏ** → **Step 3: Sửa** (`chuanHoaHuong` ở mọi đầu vào hướng; bước 2 vẫn bắt buộc ngày xem lại khi `chua_quyet`).
- [x] **Step 4:** `npm run check` → commit `"PR-K26 (2): migrate gộp hướng, máy chủ nhận giá trị cũ từ form đang mở"`.

### Task K26-3: Panel một em — gợi ý đứng đầu, em 50–59% là đề xuất

**Files:**
- Modify: `web/src/modules/students/LoTrinhTiepPanel.tsx:12-24` (kiểu `cuoiKhoa.goiY` thêm `canQuanLy`), `:94-160` (khối Hướng đi, nút chân panel)
- Modify (nếu thiếu `canQuanLy`): đường `GET /students/:id/lo-trinh-tiep` (`layLoTrinhTiep`, `loTrinhTiep.ts:45`)
- Test: `server/src/tests/prK26.tests.ts`

**Interfaces:**
- Consumes: `xepHuongTheoGoiY` (K26-1).

Skill: `/impeccable layout` (khối Hướng đi), `/impeccable clarify` (chữ "Quản lý quyết", nhãn nút).

- [x] **Step 1: Phép kiểm đỏ** `K26-3`: máy chủ — em demo Cuối khoá 50–59% → `layLoTrinhTiep(...).cuoiKhoa.goiY.canQuanLy === true`; quét nguồn panel — gọi `xepHuongTheoGoiY`, có chữ `Hướng bạn đề xuất (Quản lý quyết)`, `Lưu đề xuất`, `Hướng khác`.
- [x] **Step 2: Đỏ** → **Step 3: Sửa:** các hướng `dau` hiện trên, đánh dấu "Web gợi ý theo Cuối khoá"; `khac` thu trong `<details>` "Hướng khác ▾" — **mở sẵn** khi hướng đã lưu nằm trong `khac`. `canQuanLy` → tiêu đề khối `Hướng bạn đề xuất (Quản lý quyết)`, nút chính `Lưu đề xuất`; còn lại giữ `Lưu`. Chân panel theo luật S3 ("Đóng" / "Huỷ thay đổi").
- [x] **Step 4:** `npm run check`; ảnh 1440/375 sáng/tối ba em demo: ≥ 70%, 50–59%, < 50% (và một em chưa đủ điểm). Vai GVCN, QL.
- [x] **Step 5:** commit `"PR-K26 (3): panel Lộ trình tiếp theo xếp hướng theo gợi ý, em 50–59% là đề xuất cho Quản lý"`.

### Task K26-4: Ghi lộ trình tiếp theo cả lớp

**Files:**
- Modify: `server/src/classes/loTrinhTiep.ts` (tách lõi), `server/src/routes/index.ts` (cạnh `:1757-1765`), `server/src/tests/tocDoDuong.ts`
- Create: `web/src/modules/classes/LoTrinhTiepCaLopPanel.tsx`; Modify: `web/src/modules/classes/DauTrangLop.tsx` (một mục `MenuDong`)
- Test: `server/src/tests/prK26.tests.ts`

**Interfaces:**
- Produces: lõi `ghiMotEm(p: Principal, studentId: number, input: { huong: string; lopDuKienId?: number | null; mucTieu?: number | null; thangThi?: string | null; ghiChu?: string | null }): void` (toàn bộ kiểm + ghi + nhật ký của `ghiLoTrinhTiep` hiện tại, không đọc lại); `ghiLoTrinhTiep` = `ghiMotEm` rồi `layLoTrinhTiep`.
- Produces: `ghiLoTrinhTiepCaLop(p: Principal, classId: number, items: { studentId: number; huong: string; ghiChu?: string | null }[]): { daLuu: number }` — `items.length` 1…60; mọi `studentId` phải đang học `classId`; gọi `ghiMotEm` từng em trong **một** `tx`; một em lỗi → ném lỗi có tên em, không lưu gì.
- Produces: `GET /classes/:id/lo-trinh-tiep` (mỗi em đang học: id, tên, % Cuối khoá, `goiY`, bản ghi hiện tại) · `PUT /classes/:id/lo-trinh-tiep` body `{ items }`.

Skill: `/impeccable layout` (bảng), `/impeccable harden` (lỗi theo dòng, đang lưu, lớp rỗng), `/impeccable adapt` (375: mỗi em một thẻ).

- [x] **Step 1: Phép kiểm đỏ** `K26-4a` máy chủ: GVCN lớp thường ghi 3 em một lần → 3 bản ghi, 3 dòng hành trình; một em ngoài lớp → 400 và 0 bản ghi mới; GVBM không có quyền → 403; 61 dòng → 400. `K26-4b` đếm câu SQL `GET` cả lớp không tăng theo số em (mẫu các phép tốc độ có sẵn). `K26-4c` quét nguồn: `DauTrangLop.tsx` có mục "Ghi lộ trình tiếp theo cả lớp", chỉ hiện khi `viewer` có quyền ghi.
- [x] **Step 2: Đỏ** → **Step 3: Sửa** máy chủ (tách lõi, đường mới, trần ở `tocDoDuong.ts`) → **Step 4: Web:** `KhungPanel rong="toan"`; mỗi em một dòng: Học viên · Cuối khoá (`chuHopKetLuan` ở `shared/domain/cuoiKhoa.ts:122`) · ô chọn hướng (điền sẵn bản ghi, chưa có thì hướng gợi ý; `canQuanLy` → chip "QL quyết" cạnh ô) · ghi chú ngắn; nút `Lưu {n} em` (n = số dòng đổi so với bản ghi). Lỗi máy chủ chỉ đúng dòng (`aria-describedby`).
- [x] **Step 5:** `npm run check`; ảnh 1440/375 sáng/tối (bảng mới, có lỗi, đang lưu); bấm thử GVCN, QL, GVBM.
- [x] **Step 6:** commit `"PR-K26 (4): ghi lộ trình tiếp theo cả lớp trên một bảng"`.

### Task K26-5: Hoàn tất
- [x] `/impeccable audit` (panel + bảng mới) · `/ponytail-review` · `CODE_MAP.md` (file mới) · Rulebook §20.6/§20.7: thay "Chưa rõ"/"Xếp sau" bằng "Chưa quyết" · `thiet-ke/TU_DIEN_VA_CHU.md` cùng chữ · một dòng `plan.md` mục 11.
- [x] `superpowers:requesting-code-review` → `superpowers:finishing-a-development-branch` (mở PR, không merge). Merge sau DL, trước SL.

## Nghiệm thu
1. Em ≥ 70% / 60–69% / < 50%: hướng gợi ý đứng đầu, các hướng khác thu gọn; em chưa đủ điểm: danh sách như cũ.
2. Em 50–59%: panel ghi "Quản lý quyết", hai hướng đầu, nút "Lưu đề xuất"; Chuyển tiếp lớp của Quản lý điền sẵn đề xuất đó.
3. Không còn chữ "Chưa rõ" / "Xếp sau" trên màn; dữ liệu cũ đã gộp, badge Hết khoá và nhắc hai tuần cuối không đổi số.
4. Ghi cả lớp: lưu một lần, tất cả hoặc không; điện thoại không cuộn ngang.

## Tự quyết (chủ sản phẩm đổi được khi đọc PR)
- T1: Giá trị lưu mới là `chua_quyet` (không dùng lại một trong hai tên cũ) để đọc dữ liệu là hiểu.
- T2: Ngày xem lại bắt buộc ở Chuyển tiếp, tuỳ chọn ở Lộ trình tiếp theo — giữ đúng hành vi hai bước hôm nay.
- T3: Ghi cả lớp tối đa 60 em một lần (lớp đông nhất demo 32).
