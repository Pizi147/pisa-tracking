# R1-BO-DAN-EXCEL — Bỏ hết "Dán từ Excel" của điểm — Implementation Plan

> **For agentic workers:** chạy NGAY TRONG SESSION bằng superpowers:executing-plans (plan.md 1.2). Steps dùng `- [ ]`.
> Skill: `karpathy-guidelines`, `/ponytail lite` (chạm giao diện); cuối `audit` phần lưới; trước PR `/ponytail-review`. Loại PR: **bỏ tính năng, không đổi bố cục** → ảnh trước / sau 3 chỗ (1440 tối + 375 sáng), PTA rà + tự merge khi đạt.
> **Quyết định chủ SP 26/10 đêm** (nhắc lại vòng 3 mục 12.3): bỏ HẾT "Dán từ Excel" + nút "?" của điểm ở MỌI nơi.

**Goal:** không còn đường dán điểm từ Excel trên web. Nhập điểm chỉ qua ô điểm / hộp nhập điểm ("Lưu · bài tiếp ›").

**Ba chỗ đang có (kiểm 27/10 trên `main`):**
1. Lưới mở tại chỗ của **Lịch Test** (`LuoiNhung` → `LuoiChamLop`).
2. **Panel Nhập điểm** mở từ **Công việc** (`PanelNhapDiem` trong `web/src/modules/congViec/PanelViec.tsx` → `LuoiChamLop`; SUA-CHAM-LAI Đ2 thêm lại).
3. **Điểm theo lớp** (`web/src/modules/cham/DiemTheoLop.tsx` → `LuoiChamLop`).
Cả ba đi qua một khối `coDan` / `khoiDan` trong `web/src/modules/cham/LuoiChamLop.tsx` (~:111–198) → xoá một chỗ là hết.

**Impact note:** đầu ra không đổi (điểm vẫn nhập được ở từng ô); bớt một đường nhập lô dễ sai. Không đổi dữ liệu, quyền. Sửa sai: revert PR.

## Global Constraints
- **Không đụng** "Dán từ Excel" ở Tutor (`web/src/modules/tutor/TaiDanhSach.tsx` — nhập danh sách, không phải điểm; Tutor hoãn).
- **Giữ API máy chủ** `/attempts/scores/lo`, `/regular/scores/lo` (không đổi máy chủ trong PR này) — grep nơi gọi; ghi PR "API còn, web không gọi" + một dòng `ponytail:` / ghi chú để dọn sau nếu thật sự chỉ Dán Excel dùng.
- Không đụng tệp của R1-PHAN-CAP-TEST ngoài `LuoiChamLop.tsx` (PR này merge TRƯỚC; PHAN-CAP-TEST gộp main sau).

## Task 1: Gỡ giao diện + mã chỉ phục vụ Dán Excel
**Files:** `web/src/modules/cham/LuoiChamLop.tsx`, `web/src/modules/cham/DanExcel.tsx` (xoá), `shared/domain/danExcel.ts` (+ export `shared/domain/index.ts`) nếu không còn nơi dùng, `shared/i18n/en/ov15b.ts` (khoá chỉ của Dán Excel), `web/src/modules/congViec/PanelViec.tsx:196` (chú thích), `CODE_MAP.md`.
- [ ] `grep -rn "DanExcel\|danExcel\|boDanFt\|boDanThuong\|Dán từ Excel\|dan-excel" web/src shared server` → lập danh sách.
- [ ] Xoá khối `coDan` / `khoiDan` / nút "?" / state `dan` trong `LuoiChamLop`; hàng công cụ còn lại giữ nguyên (link "Mở lưới đầy đủ ›", "Cả lớp", GV chấm S…). Hàng công cụ rỗng thì không vẽ.
- [ ] Xoá `DanExcel.tsx`; xoá `danExcel.ts` + export nếu không còn ai import; khoá EN thừa (phép kiểm EN chỉ được giảm — xanh).
- [ ] localStorage nháp `pisa.dan-excel.*` không còn đọc — không cần dọn (trình duyệt tự giữ, vô hại).
- [ ] Typecheck xanh.

## Task 2: Phép kiểm
**Files:** `server/src/tests/prBang0.tests.ts`, `prDiemTieuChi.tests.ts`, `tocDo.run.ts`, `tocDoDuong.ts` (đang dùng mã Dán Excel).
- [ ] Bỏ ca CHỈ kiểm Dán Excel phía web / hàm `danExcel`; ca kiểm API `/scores/lo` máy chủ giữ nếu API còn.
- [ ] Thêm một kiểm tĩnh: `web/src` không còn chuỗi "Dán từ Excel" ngoài `modules/tutor/`.
- [ ] Hướng dẫn GV / QL (`shared/huongDan*` / tài liệu HD): bỏ mọi câu Dán Excel điểm (HD-CHI xanh).

## Task 3: Kiểm + PR
- [ ] Ảnh trước / sau 3 chỗ (Lịch Test mở lớp, panel Nhập điểm từ Công việc, Điểm theo lớp) 1440 tối + 375 sáng.
- [ ] `npm run check` một lần → `/ponytail-review` → PR "R1-BO-DAN-EXCEL" (bảng thao tác TRƯỚC → SAU: dòng "Dán từ Excel ×3: bỏ — chủ SP 26/10"), nhắn PTA Plan.

---

## Prompt giao session (dán nguyên khối)
```
Bạn là session code PR R1-BO-DAN-EXCEL của PISA Tracking (Opus 5.5, effort medium; không Fable). Đọc: CLAUDE.md, plan.md mục 1 + 9.0,
rồi làm docs/superpowers/plans/2026-10-27-r1-bo-dan-excel.md bằng superpowers:executing-plans. Gõ /ponytail lite đầu phiên.
Chủ SP 26/10: bỏ HẾT "Dán từ Excel" + "?" của điểm ở mọi nơi (Lịch Test, panel Nhập điểm Công việc, Điểm theo lớp); không đụng Tutor; giữ API máy chủ.
Nhánh mới từ origin/main mới nhất (worktree trong .claude/worktrees/). Cổng riêng (không 4000/5173). npm run check MỘT lần cuối, giữ chỗ trước:
mkdir C:/Users/Admin/AppData/Local/Temp/pisa-slot/check-N (N = 1..3, cái nào tạo được), xong rmdir. Mở PR vào main, KHÔNG merge.
Xong nhắn "PTA Plan" bằng SendMessage.
```
