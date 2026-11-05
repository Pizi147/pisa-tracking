# PT-PANEL-FT (PR-1) — Kế hoạch Task

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (session PT-PANEL tự làm từng Task). Bước dùng ô `- [ ]`.

**Goal:** Mọi ô số FT của Phân tích (Test + SOS, Báo cáo HV, Phân tích GV) và panel "HV tiến bộ" ở Tổng quan / Lớp tôi dạy mở ra panel BẢNG có điểm đúng lượt (P-FT) hoặc Trước → Sau (P-TG).

**Architecture:** Một hàm máy chủ `dongLuotDiemCua(p, attemptIds)` (tongHop.ts) dựng `DongLuotDiem` cho mọi lượt; mỗi đường ô số gắn nó vào dòng (`row.luotDiem` / `row.tangGiam`) và trả `bangLuot: true, kieu`. Web: `DanhSachNguon` → `BangLuotPanel` (thêm OVR, Kỳ vọng, tô cột `knNhan`, hộp c1–c4 / số câu tại chỗ, kiểu `tang-giam`, tab Chưa đạt / Đạt khi dòng có `ketQua`).

**Tech Stack:** React + TS, Node + libsql, `shared/domain`, i18n VI / EN.

**Spec:** khung PR-1 ở `docs/superpowers/plans/2026-11-05-phan-tich-thi-that.md` · đặc tả `docs/superpowers/specs/2026-11-05-phan-tich-thi-that/de-xuat.md` 2A · mockup `thiet-ke/v13/phan-tich-thi-that.html` A1 / A1m / A2 · kiểm kê ô `thiet-ke/v13/phan-tich-thi-that-ghi-chu.md` mục 2.

## Global Constraints

- Global Constraints + Review Focus của kế hoạch chung áp nguyên.
- Màu: ✓ vượt `--ok` · ✓ bằng `--doing` · ✗ `--bad` (đã có trong `ODiem` / `lopKq`). Số chênh (+0.5) trung tính.
- Panel chỉ đọc, không panel lồng panel; hộp chi tiết là popover trong panel (Esc / bấm ra ngoài đóng, `preventDefault` để Esc không đóng panel).
- Không đổi số trên ô; `n === rows.length` mọi ô.
- Ngoài phạm vi (PR khác): hàng "Thi" của Kết quả MT, "Thi trong kỳ", ô thi thật GV (PR-4); PA / vi phạm / Việc đúng hạn (PR-3); lớp thường (PR-2).

## Review Focus

1. Em có 2 lượt trong khoảng, ô đếm HV → dòng là lượt làm em vào ô (Task 1 kiểm `attemptId`).
2. Kỹ năng thiếu / vắng → `kn.x === null` → "—", không bấm (Task 1 + Task 4).
3. Lượt có điểm nhưng `mockTrongKhoang` bỏ (chỉ raw) → vẫn một dòng (tên + nulls), không lệch `n` (Task 1 vòng mọi cột).
4. Mục Tiến bộ không có kỳ vọng (Target trống) → `kyVong: null`, Sau không ✓ / ✗.
5. Hộp chi tiết ở 375: không tràn khung (giới hạn trái / phải như `TheTieuChi`).

---

### Task 1: Máy chủ — `dongLuotDiemCua` + ô Test + SOS (FT)

**Files:** Modify `server/src/phanTich/tongHop.ts` · Test `server/src/tests/prPtPanel.tests.ts` (mới, gọi ở `run.ts`).

**Interfaces — Produces:**
- `type ODiemLuot = { v: number; kq: 'vuot'|'bang'|'duoi'|null; tc?: (number|null)[] | null; raw?: [number, number] | null } | null`
- `type DongLuotDiem = { attemptId; studentId; ten; classId; lop; mt; tuan; kn: Record<'l'|'r'|'w1'|'w2'|'s', ODiemLuot>; ovr: ODiemLuot; kyVong: number|null }`
- `dongLuotDiemCua(p: Principal, attemptIds: number[]): Map<number, DongLuotDiem>` — mọi id có dòng (thiếu `DongMock` → tên từ `students`, kn null).
- `oTongHop` FT: cột `dot-test` → dòng lượt; cột `kn:*`, `hvCoCase` → dòng em, `luotDiem` = lượt gần nhất (tuần, rồi id) làm em vào ô; `kieu: 'luot'`, `knNhan` = 'L'|'R'|'W1'|'W2'|'S' với cột `kn:*`. Cột Case giữ panel cũ.

- [ ] Phép kiểm đỏ: `PT-PANEL · ô SOS: rows.length === n && mọi dòng có kn + ovr + kyVong` · `Dưới kỳ vọng · L: attemptId = lượt làm em vào ô (em có 2 lượt)` · `ô thiếu điểm S: kn.s === null` · vòng mọi `cotSoLieu('ft')` (trừ đơn vị case) × hàng: `n === rows.length` và mọi dòng có `luotDiem`.
- [ ] `npx tsx server/src/tests/run.ts prPtPanel` → ĐỎ.
- [ ] Làm: `tinh` giữ `luotEm: Map<khoa, Map<studentId, attempt>>` cạnh mỗi `tap`; `ganDiemLuot` → `dongLuotDiemCua` (tc = c1..c4 của W/S, raw = raw_score/raw_total của L/R; ovr kq so `kyVong`).
- [ ] Xanh. Commit.

### Task 2: Máy chủ — Báo cáo HV + Phân tích GV + hồ sơ GV (Tiến bộ)

**Files:** Modify `server/src/phanTich/baoCao.ts`, `server/src/phanTich/giaoVien.ts` (chỉ ô FT), `server/src/tests/tocDoDuong.ts`.

**Interfaces — Produces:** `type DongTangGiam = { attemptId; studentId; ten; classId; lop; kn: string; truoc: { mt; v }; sau: { mt; v; kq }; chenh: number; kyVong: number|null }`; `TapKn.doi` thêm `truocId`, `sauId` (id lượt) để dựng dòng.
- Báo cáo `dat-mt`, `dat-mt-chua-du`, `kq-mt:mt*` → `kieu 'luot'` (giữ `ketQua` cho tab). `tien-bo:<kn>[:tang|giu|giam]` → `kieu 'tang-giam'`, `knNhan`.
- GV `dat-mt` → `'luot'` (dòng = bài; `knCua` = kỹ năng của bài); `tien-bo` → `'tang-giam'`; `hv-chu-y` → `'luot'` lượt Mock có điểm gần nhất.
- Hồ sơ GV `tien-bo`, `tien-bo-lop:<lớp>` → `'tang-giam'` (dòng không gộp — một dòng một bài, `ketQua` dat = tăng).

- [ ] Phép kiểm đỏ: `Tăng W1: truoc.v < sau.v, chenh = sau − truoc` · ô `tien-bo:*:tang|giu|giam` và GV `tien-bo` `n === rows.length`, dòng có `tangGiam` · `dat-mt` có `luotDiem` + `ketQua`.
- [ ] Làm. Trần ở `tocDoDuong.ts` cho `bao-cao/o?o=tien-bo…`, `giao-vien/o?cot=tien-bo|hv-chu-y|dat-mt`, `tong-hop/o?cot=kn:listening`.
- [ ] Xanh. Commit.

### Task 3: Web — `BangLuotPanel` mở rộng

**Files:** Modify `web/src/ui/BangLuotPanel.tsx`, `web/src/ui/OSo.tsx`, `shared/i18n` (EN chữ mới).

- Cột 'luot': Học viên · Lớp · MT · L R W1 W2 S · OVR · Kỳ vọng (mockup A1). Cột `knNhan` / `knCua` nền `--accent-soft`, đầu cột đậm.
- Ô có `tc` (W/S) hoặc `raw` (L/R) → `button aria-expanded` mở hộp dưới ô: `dongTieuChi` "TA 5.5 · CC 5 · … → 5.5" / "17/40 câu".
- 'tang-giam': Học viên · Lớp · (Kỹ năng khi panel nhiều kỹ năng) · Trước "MT1 5.0" · Sau "MT2 ✓ 5.5" · Chênh "+0.5" · Kỳ vọng (A2).
- Tab Chưa đạt · Đạt khi dòng có cả hai `ketQua` (cùng chữ panel cũ).
- Nhãn đầu panel theo nguồn: tong-hop "SỐ · TEST + SOS" · bao-cao "SỐ · BÁO CÁO HV" · giao-vien "SỐ · PHÂN TÍCH GV" · còn lại "BÁO CÁO · CHỈ ĐỌC"; dòng 2 bỏ chi nhánh khi máy chủ không gửi.
- 375: thẻ (A1m): tên + "Kỳ vọng x" phải · lớp + MT · lưới 6 ô điểm.

- [ ] `npm run check` phần web (tsc + phép kiểm nguồn). Bấm thử: Test + SOS ô SOS, Dưới kỳ vọng L; Báo cáo Tiến bộ W1 Tăng; Tổng quan GV Tiến bộ.
- [ ] Commit.

### Task 4: Ảnh, khop-khac, check, PR

- [ ] Ảnh trước | sau 1440 tối + 375 sáng ở `docs/anh/pt-panel-ft/` (A1, A1m, A2, Tổng quan HV tiến bộ).
- [ ] `docs/anh/pt-panel-ft/khop-khac.md`: truy vết khung → thành phần → ảnh; thao tác trước → sau; kiểm kê ô FT.
- [ ] impeccable `audit` + `web-design-guidelines` trên `BangLuotPanel.tsx`; `/ponytail-review`.
- [ ] `npm run check` đầy đủ → xanh. PR, nhắn PTA Plan.
