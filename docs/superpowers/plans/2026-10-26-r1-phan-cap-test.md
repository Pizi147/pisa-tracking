# R1-PHAN-CAP-TEST — Phân cấp Lịch Test (nhóm → lớp → HV) theo A2 — Implementation Plan

> **For agentic workers:** chạy NGAY TRONG SESSION bằng superpowers:executing-plans (plan.md 1.2). Steps dùng `- [ ]`.
> **Đã đủ điều kiện giao (26/10 đêm):** chủ SP duyệt mockup M2 **A2 vòng 2** (`thiet-ke/v7/lich-test-phan-cap.html` khu `#a2`, `#a2-375`) + R1-LUU-TIEP đã merge (#592).
> **Quyết định chủ SP 26/10 đêm:** (1) mỗi cấp **một màu thanh**, không thêm viền / vạch; (2) dòng S Ex: nhãn "S Ex" nằm ở **cột MT**; (3) **bỏ HẾT "Dán từ Excel" + nút "?" của điểm ở MỌI nơi** (chủ SP 26/10 đêm, nhắc lại quyết định vòng 3 mục 12.3): lưới Lịch Test, panel Nhập điểm (Công việc), Điểm theo lớp. Không cần mockup lại.
> Skill: `karpathy-guidelines`, `/ponytail lite`; impeccable `layout` + `polish` trong phạm vi (PR làm lại phân cấp có mockup duyệt, plan.md 1.3b), `adapt` (375), cuối `audit` + `web-design-guidelines`; trước PR `/ponytail-review`.
> **Loại PR:** đổi bố cục → cổng plan.md 1.6 Q-3…Q-6 (bảng truy vết, ảnh cặp toàn trang, ≥ 90 % KHỚP, `do-khung` + `do-bang`, chủ SP duyệt ảnh trước merge, không merge qua đêm).

**Goal:** người xem Lịch Test tuần, nhiều lớp mở, nhìn màu thanh là biết đang ở nhóm nào, lớp nào, HV nào.

**Architecture:**
- 4 token màu cấp mới + cấu trúc nhỏ ở các thành phần Lịch Test sẵn có.
- Không đổi dữ liệu, API, quyền.
- Hàng lớp đang mở dính dưới thanh trên khi cuộn trong vùng lớp đó (thử trước; không được thì dòng nhãn lớp lặp ở đầu lưới, ghi [XM]).

**Spec:** `docs/superpowers/specs/2026-10-26-deploy-ux-design.md` mục 4.2 (dòng "Chủ SP 26/10 đêm"); mockup M2 khu A2; prompt chủ SP mục 4.

**Impact note:**
- Đầu ra: phân biệt cấp ngay bằng màu thanh.
- Giữ: Nhập điểm (hộp, "Lưu · bài tiếp ›"), Xuất Excel, Lịch sử ô, ↗ hồ sơ lớp / HV, mở / thu dưới hàng, nháp ô, "Lớp tiếp", quay lại đúng tuần / lớp / dòng, "GV chấm S", chú giải ô.
- **Bỏ HẾT (chủ SP 26/10):** "Dán từ Excel" + "?" của điểm ở mọi nơi (Lịch Test, panel Nhập điểm Công việc, Điểm theo lớp). Nhập điểm còn: ô điểm / hộp nhập điểm, "Lưu · bài tiếp ›". "Dán từ Excel" ở Tutor (`TaiDanhSach`, nhập danh sách) KHÔNG phải điểm — không đụng (Tutor hoãn).
- Sửa sai: chỉ CSS + cấu trúc nhỏ + một prop, lùi được.
- Test: ảnh cặp + `do-khung` / `do-bang` + tương phản cấp liền kề + phép đo "dính không che".

## Global Constraints
- **Phạm vi:** Lịch Test tuần (`/test/lich`) + nhóm danh sách trái của Chấm Test (`/test/cham`). Kế hoạch Test **giữ nguyên**.
- **Token mới (sáng / tối, ghi `DESIGN.md`):** giá trị khởi điểm lấy từ mockup, chỉnh được nếu đo tương phản không đạt:

  | Token | Sáng | Tối | Dùng cho |
  |---|---|---|---|
  | `--cap-nhom` | `#d3dae8` | `#2a3654` | thanh nhóm |
  | `--cap-lop` | `#d4e1fb` | `#1d3b72` | thanh lớp đang mở |
  | `--cap-lop-dong` | `#edf2fd` | `#172b50` | thanh lớp đóng + đáy khối |
  | `--cap-dau-cot` | `#eceff5` | `#0a1224` | đầu cột lưới |

  Bỏ `--hang-lon-dong-bg`, `--hang-lon-dong-vach`, `--hang-con-bg` khỏi Lịch Test nếu không còn nơi dùng (grep trước khi xoá).
- **Cấp và cách thể hiện** (bảng truy vết = các dòng này + dòng BỎ / GIỮ):
  1. **Thanh nhóm** `NhomDau`: nền `--cap-nhom`, chữ 16 / 700, số 13 / 500 có đơn vị ("5 lớp · 15/39 bài đã chấm"); "Quá hạn chấm" giữ chữ đỏ; khe 10 px nền thẻ giữa hai nhóm. Không viền.
  2. **Thanh lớp đóng** `HangLop` (`tr.hang-lon`): nền `--cap-lop-dong`, tên 15 / 700 thụt 28 px, ngăn giữa hai lớp bằng 1 px màu nền thẻ. Bỏ vạch trái.
  3. **Thanh lớp mở:** nền `--cap-lop`, cao 50, tên 16 / 700. **Dính** `top: var(--thanh-tren-h)` bằng `.hang-lon-dinh` (`index.css`, có sẵn). Bỏ vạch trái 3 px.
  4. **Vùng lưới mở** (`HangCon` → `LuoiNhung` → `LuoiChamLop`):
     - Bỏ nền `--hang-con-bg` bọc ngoài; lưới nằm trên nền thẻ, không thụt khung, không vạch.
     - Hàng công cụ: **bỏ "Dán từ Excel" + "?"** (làm ở PR riêng R1-BO-DAN-EXCEL, merge trước — PR này chỉ gộp main). Giữ: nhãn trái "n học viên · Fast Track / Lớp thường", chú giải ô (vắng · Không học · chưa có điểm), "GV chấm S", "Mở lưới đầy đủ ›" (nếu có).
  5. **Đầu cột lưới:** nền `--cap-dau-cot`, 13 / 600 chữ `--text-dim`, không viền dưới. Cột "Học viên" thụt 44 px.
  6. **Hàng HV:** nền thẻ, cao 44 / 64 giữ, tên thụt 44 px. **Cột tên dính dùng nền hàng** (`background: inherit` / token hàng) — hết sọc.
  7. **Dòng S Ex** (`DongSExHv`): dòng phụ cao 36, chữ 13, nền thẻ; **cột tên trống**, chip "S Ex" ở **cột MT**, điểm ở cột S, Kết quả = "GV · tuần". Lưới không có cột MT (lớp thường) → chip đứng đầu ô tên như cũ.
  8. **Đáy khối lớp mở:** một dải nền `--cap-lop-dong` cao ~32 dưới lưới: nút "▴ Thu lớp {mã}" (= thao tác thu sẵn có của hàng lớp, `aria-expanded` cùng nguồn) + "n/m bài · n HV" (cùng số với hàng lớp). Lớp dài khỏi cuộn ngược để thu.
  9. **375 (thẻ `TheHv`):** cùng màu thanh: nhóm `--cap-nhom`, lớp `--cap-lop` / `--cap-lop-dong`, thẻ em nền thẻ thụt 32 px, dòng S Ex dưới thẻ em, đáy khối "▴ Thu lớp".
- Tối đa **4 token mới** ở trên. Không điều khiển trong `th`. Màu kết quả chỉ ở con số (G12). Trạng thái không chỉ bằng màu: thanh lớp vẫn có ▾ / › và chữ.
- **Tương phản cấp liền kề** (thanh nhóm ↔ thanh lớp ↔ đầu cột ↔ hàng HV ↔ nền thẻ): ΔL ≥ 3 (OKLCH) giữa hai nền liền nhau, sáng + tối — đo bằng `thiet-ke/v5/kiem-tuong-phan.py`; chữ trên mỗi nền ≥ 4.5 : 1.
- Không đổi luật `do-bang` g3 (44 / 64).

## Review Focus
1. Hàng lớp dính che hộp nhập điểm / popover lịch sử / menu ⋯ → phép đo "dính không che" (Task 3).
2. 375: hàng lớp dính + thanh dưới chiếm > 30 % chiều cao → tắt dính dưới 640 px.
3. Mở / thu lớp (cả bằng "▴ Thu lớp") mất nháp hoặc ô lưu lỗi → bấm thử: gõ ô, thu, mở lại → chữ còn (giữ hành vi `chuaLuu` / hỏi khi đóng).
4. 60 HV một lớp → đầu cột / thanh lớp đọc được khi cuộn (seed `SEED_LON=1`).
5. Bỏ hết Dán Excel điểm: `grep -rn "Dán từ Excel" web/src` chỉ còn Tutor `TaiDanhSach`; Lịch Test, panel Nhập điểm, Điểm theo lớp không còn nút; không còn import `DanExcel`.
6. Chế độ sáng: các thanh vẫn tách (đo ΔL).

---

### Task 1: Dữ liệu nghiệm thu
**Files:** `server/src/seed/*` (cờ môi trường `SEED_LON=1`, đọc ở `seed.ts`).
- [ ] Cờ bật → thêm 1 lớp FT 60 HV có Test tuần W3 SEP + 6 lớp tuần W3 SEP (một lớp HV khác lượt MT, một lớp tên dài, một em có S Ex).
- [ ] Cờ tắt → seed y nguyên: TD4-a, DL-2 không đổi băm.
- [ ] Commit.

### Task 2: Token + thành phần
**Files:** `web/src/index.css`, `web/src/v5-nen.css`, `web/src/modules/test/lichTest/NhomDau.tsx`, `HangLop.tsx`, `HangCon` (nơi định nghĩa), `LuoiNhung.tsx`, `web/src/modules/cham/LuoiChamLop.tsx` (prop `anDan`), `web/src/modules/cham/LuoiFT.tsx` (cột tên dính, `DongSExHv`), thẻ 375 (`TheHv`), `web/src/modules/test/ChamTestTab.tsx` (nhóm trái).
- [ ] Đọc mockup khu `#a2` + `#a2-375` (bản vòng 2) trước khi sửa.
- [ ] Làm theo 9 dòng Global Constraints, mỗi cấp một commit nhỏ; mỗi cấp chụp 1440 tối kiểm nhanh.
- [ ] Dán Excel: đã bỏ ở PR riêng **R1-BO-DAN-EXCEL** (`docs/superpowers/plans/2026-10-27-r1-bo-dan-excel.md`, merge trước) — gộp main, không làm lại.
- [ ] Thử dính `.hang-lon-dinh` trên `tr` trong `table.bang-dinh` có `overflow-x:auto`; không ăn → dòng nhãn lớp lặp ở đầu lưới, ghi [XM] trong `khop-khac.md`.
- [ ] Chấm Test: nhóm trái dùng thanh `--cap-nhom`, không đổi hành vi.

### Task 3: Đo + ảnh cặp
**Files:** `scripts/do-khung.mjs` (phép đo "dính không che": mở lớp → cuộn 400 px → mở hộp nhập điểm hàng gần đỉnh → `elementFromPoint` tại tâm ô điểm phải là ô / hộp, không phải hàng lớp), `scripts/anh-cap.mjs`.
- [ ] `do-khung` + `do-bang` xanh 1440 / 1280 / 375 (`test-lichTest`, `cham-test-gv`, `gvbm-test`).
- [ ] Đo tương phản cấp liền kề sáng + tối, ghi số vào PR.
- [ ] Ảnh cặp mockup M2-A2 | web toàn trang, cùng vai (QL + GV 7), cùng seed (`SEED_LON=1`), 1440 tối + 375 sáng + 125 %.
- [ ] `docs/anh/r1-phan-cap-test/khop-khac.md`: bảng KHỚP / KHÁC theo từng dòng truy vết (mockup còn vẽ "Dán từ Excel" → ghi **BỎ theo chủ SP 26/10**, không tính KHÁC) + bảng thao tác TRƯỚC → SAU (dòng "Dán từ Excel (Lịch Test, panel Nhập điểm, Điểm theo lớp): bỏ — chủ SP 26/10, vòng 3 mục 12.3").

### Task 4: Tài liệu + PR
- [ ] `DESIGN.md`: luật phân cấp Lịch Test (V17: mỗi cấp một màu thanh, S Ex ở cột MT) + 4 token mới.
- [ ] Hướng dẫn GV / QL: bỏ câu nói Dán Excel ở Lịch Test (nếu có), chỉ sang panel Nhập điểm (HD-CHI xanh).
- [ ] `npm run check` một lần → `/ponytail-review` → PR "R1-PHAN-CAP-TEST", nhắn PTA Plan.
- [ ] PTA rà ảnh cặp → **chủ SP duyệt ảnh trước merge**.

---

## Prompt giao session (đã đủ điều kiện 26/10 đêm)
```
Bạn là session code PR R1-PHAN-CAP-TEST của PISA Tracking (Opus 5.5, effort high; không Fable). Đọc: CLAUDE.md, plan.md mục 1 + 1.6 + 9.0,
DESIGN.md Luật V5, docs/superpowers/specs/2026-10-26-deploy-ux-design.md (mục 4.2), mockup thiet-ke/v7/lich-test-phan-cap.html khu #a2 + #a2-375
(chủ SP duyệt A2 vòng 2 ngày 26/10: mỗi cấp một màu thanh, S Ex ở cột MT, BỎ HẾT "Dán từ Excel" + "?" của điểm ở mọi nơi), rồi làm
docs/superpowers/plans/2026-10-26-r1-phan-cap-test.md bằng superpowers:executing-plans. Gõ /ponytail lite đầu phiên.
Nhánh mới từ origin/main mới nhất (worktree trong .claude/worktrees/). PR đổi bố cục: bảng truy vết, ảnh cặp toàn trang, ≥ 90 % KHỚP,
chủ SP duyệt ảnh trước merge. Cổng riêng (không 4000/5173). npm run check MỘT lần cuối, giữ chỗ trước: mkdir
C:/Users/Admin/AppData/Local/Temp/pisa-slot/check-N (N = 1..3, cái nào tạo được), xong rmdir. Mở PR vào main, KHÔNG merge.
Xong nhắn "PTA Plan" bằng SendMessage.
```
