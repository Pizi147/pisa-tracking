# R1-PHAN-CAP-TEST — Phân cấp Lịch Test (nhóm → lớp → HV) — Implementation Plan

> **For agentic workers:** chạy NGAY TRONG SESSION bằng superpowers:executing-plans (plan.md 1.2). Steps dùng `- [ ]`.
> **CHỈ GIAO KHI:** (1) chủ SP đã duyệt mockup M2 (`thiet-ke/v7/lich-test-phan-cap.html`) và chọn A hoặc B; (2) R1-LUU-TIEP đã merge (chung `LuoiFT.tsx`).
> Kế hoạch dưới viết cho **A** (khuyến nghị). Chủ SP chọn B → PTA viết lại Task 2–3 trước khi giao.
> Skill: `karpathy-guidelines`, `/ponytail lite`; impeccable `layout` + `polish` trong phạm vi (PR làm lại phân cấp có mockup duyệt, plan.md 1.3b), `adapt` (375), cuối `audit` + `web-design-guidelines`; trước PR `/ponytail-review`.
> **Loại PR:** đổi bố cục → cổng plan.md 1.6 Q-3…Q-6 (bảng truy vết, ảnh cặp toàn trang, ≥ 90 % KHỚP, `do-khung` + `do-bang`, chủ SP duyệt ảnh trước merge, không merge qua đêm).

**Goal:** người xem Lịch Test tuần, nhiều lớp mở, nhìn là biết đang ở nhóm nào, lớp nào, HV nào — không thêm màu, không mất thao tác.

**Architecture:**
- Đổi CSS token + cấu trúc nhỏ ở các thành phần Lịch Test sẵn có.
- Không đổi dữ liệu, API, quyền.
- Hàng lớp đang mở dính dưới thanh trên khi cuộn trong vùng lớp đó (thử trước; không được thì dòng nhãn lớp lặp ở đầu lưới).

**Spec:** `docs/superpowers/specs/2026-10-26-deploy-ux-design.md` mục 4.2; mockup M2 khu A (sau duyệt); prompt chủ SP mục 4.

**Impact note:**
- Đầu ra: phân biệt cấp ngay.
- Giữ: Nhập điểm, Dán Excel, Xuất, Lịch sử, mở dưới hàng, nháp ô, quay lại đúng tuần / lớp / dòng.
- Sửa sai: chỉ CSS + cấu trúc nhỏ, lùi được.
- Test: ảnh cặp + `do-khung` / `do-bang` + tương phản cấp liền kề + phép đo "dính không che".

## Global Constraints
- **Phạm vi:** Lịch Test tuần (`/test/lich`) + nhóm danh sách trái của Chấm Test (`/test/cham`). Kế hoạch Test **giữ nguyên** (đã là hộp từng lớp).
- **Cấp và cách thể hiện** (bảng truy vết = các dòng này + dòng BỎ / GIỮ):
  1. **Dải nhóm** `NhomDau`: nền `--surface-2` giữ; khoảng trên 12 px + viền trên `--line-strong`; số đếm 13 / 500 có đơn vị ("3 lớp · 14 bài").
  2. **Hàng lớp đóng** `HangLop` (`tr.hang-lon`): nền = nền thẻ, **viền dưới `--line`**, tên 15 / 700. Bỏ `--hang-lon-dong-bg` + vạch trái khi đóng.
  3. **Hàng lớp mở:** `--accent-soft` + vạch trái 3 px `--accent-strong` (giữ). **Dính** `top: var(--thanh-tren-h)` bằng `.hang-lon-dinh` (`index.css:423-428`, có sẵn).
  4. **Vùng lưới mở** (`HangCon` → `LuoiNhung`):
     - Bỏ nền `--hang-con-bg` bọc ngoài.
     - Thụt 12 px, có vạch trái 3 px `--accent-strong` nối từ hàng lớp.
     - Hàng công cụ (Dán Excel · ? · GV chấm S) giữ, nằm trong vùng thụt.
  5. **Đầu cột lưới:** token mới `--dau-cot-luoi` (sáng / tối) khác `--surface-2`, 13 / 600, viền dưới `--line-strong`.
  6. **Hàng HV:** cao 44 / 64 giữ. **Cột tên dính dùng nền hàng** (`background: inherit` hoặc token hàng) — hết sọc `--surface`.
  7. **Dòng S Ex** (`DongSExHv`): thụt 24 px, chữ 13, nền `--hang-con-bg`, nhãn "S Ex" đứng trước tên mờ.
- Tối đa **2 token mới** (`--dau-cot-luoi`, `--dong-sex-bg` nếu cần); sáng + tối; ghi `DESIGN.md`.
- **Tương phản cấp liền kề** (nền nhóm ↔ hàng lớp ↔ đầu cột ↔ hàng HV): ΔL ≥ 3 (OKLCH) hoặc có viền — đo bằng `thiet-ke/v5/kiem-tuong-phan.py`.
- Không đổi luật `do-bang` g3 (44 / 64). Không điều khiển trong `th`. Màu kết quả chỉ ở con số (G12).

## Review Focus
1. Hàng lớp dính che hộp nhập điểm / popover lịch sử / menu ⋯ → phép đo mới "dính không che" (Task 3).
2. 375: hàng lớp dính + thanh dưới chiếm quá nửa màn → dính tắt dưới 640 px nếu đo > 30 % chiều cao.
3. Mở / thu lớp mất nháp hoặc ô lưu lỗi → bấm thử: gõ ô, thu lớp, mở lại → chữ còn (giữ hành vi sẵn có).
4. 60 HV một lớp ("Hiện tất cả") → đầu cột / hàng lớp vẫn đọc được khi cuộn (seed cờ `SEED_LON`).
5. Chế độ sáng: cấp vẫn tách (đa số lỗi phân cấp ở sáng — mọi nền nằm giữa #eef1fa và #fff).

---

### Task 1: Dữ liệu nghiệm thu
**Files:** `server/src/seed/*` (cờ môi trường `SEED_LON=1`, đọc ở `seed.ts`).
- [ ] Cờ bật → thêm 1 lớp FT 60 HV có Test tuần W3 SEP + 6 lớp tuần W3 SEP (một lớp HV khác lượt MT, một lớp tên dài).
- [ ] Cờ tắt → seed y nguyên: TD4-a, DL-2 không đổi băm.
- [ ] Commit.

### Task 2: Token + thành phần
**Files:** `web/src/index.css` (:84-86, :199-203, :251-257, :331-364, :413-429), `web/src/v5-nen.css`, `web/src/modules/test/lichTest/NhomDau.tsx` (:13-17), `HangLop.tsx` (:125-165), `LuoiNhung.tsx` (:39), `web/src/modules/cham/LuoiFT.tsx` (cột tên dính :356-357, `DongSExHv` :457, :539-567), `web/src/modules/test/ChamTestTab.tsx` (nhóm :159-183).
- [ ] Làm theo 7 cấp Global Constraints, từng cấp một commit nhỏ. Mỗi cấp chụp 1440 tối kiểm nhanh.
- [ ] Thử dính:
  - `.hang-lon-dinh` trên `tr` trong `table.bang-dinh` có `overflow-x:auto` (`index.css:255`).
  - Dính không ăn → dòng nhãn lớp lặp ở đầu vùng lưới (`caption` / dòng đầu), ghi [XM] trong `khop-khac.md`.
- [ ] Chấm Test: nhóm trái dùng dáng dải nhóm (nền + viền), không đổi hành vi.

### Task 3: Đo + ảnh cặp
**Files:** `scripts/do-khung.mjs` (thêm phép đo "dính không che": mở lớp → cuộn 400 px → mở hộp nhập điểm hàng gần đỉnh → `elementFromPoint` tại tâm ô điểm phải là ô / hộp, không phải hàng lớp), `scripts/anh-cap.mjs`.
- [ ] `do-khung` + `do-bang` xanh 1440 / 1280 / 375 (`test-lichTest`, `cham-test-gv`, `gvbm-test`).
- [ ] Đo tương phản cấp liền kề sáng + tối, ghi số vào PR.
- [ ] Ảnh cặp mockup M2-A | web toàn trang, cùng vai (QL + GV 7), cùng seed (`SEED_LON=1`), 1440 tối + 375 sáng + 125 %.
- [ ] Bảng KHỚP / KHÁC theo từng dòng truy vết vào `docs/anh/r1-phan-cap-test/khop-khac.md` + bảng thao tác TRƯỚC → SAU.

### Task 4: Tài liệu + PR
- [ ] `DESIGN.md`: luật phân cấp Lịch Test (V17) + token mới.
- [ ] Hướng dẫn GV / QL nếu chữ / vị trí đổi (HD-CHI xanh).
- [ ] `npm run check` một lần → `/ponytail-review` → PR "R1-PHAN-CAP-TEST", nhắn PTA Plan.
- [ ] PTA rà ảnh cặp → **chủ SP duyệt ảnh trước merge**.

---

## Prompt giao session (chỉ đưa khi M2 đã duyệt + R1-LUU-TIEP đã merge)
```
Bạn là session code PR R1-PHAN-CAP-TEST của PISA Tracking (Opus 5.5, effort high; không Fable). Đọc: CLAUDE.md, plan.md mục 1 + 1.6 + 9.0,
DESIGN.md Luật V5, docs/superpowers/specs/2026-10-26-deploy-ux-design.md (mục 4.2), mockup thiet-ke/v7/lich-test-phan-cap.html (phương án chủ SP
đã chọn), rồi làm docs/superpowers/plans/2026-10-26-r1-phan-cap-test.md bằng superpowers:executing-plans. Gõ /ponytail lite đầu phiên.
Nhánh mới từ origin/main mới nhất. PR đổi bố cục: bảng truy vết, ảnh cặp toàn trang, ≥ 90 % KHỚP, chủ SP duyệt ảnh trước merge.
Cổng riêng (không 4000/5173). npm run check MỘT lần cuối. Mở PR vào main, KHÔNG merge. Xong nhắn "PTA Plan".
```
