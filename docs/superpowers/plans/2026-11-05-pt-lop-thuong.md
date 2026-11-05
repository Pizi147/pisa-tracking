# PT-LOP-THUONG (PR-2) — Kế hoạch Task

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Bước dùng ô `- [ ]`. Mở PR khi PR-1 PT-PANEL-FT đã merge (dùng `BangLuotPanel`, `kieuBang`, `dongLuotDiemCua`).

**Goal:** Test + SOS · Lớp thường bỏ ba nhóm cột Checkpoint, Mini Test, Xử lý; "Bài kiểm tra" = Progress + Final + Thiếu điểm; mọi ô lớp thường (Test + SOS, Phân tích GV "Đạt Test") mở panel bảng bài lớp thường có điểm theo môn.

**Architecture:** `shared/domain/phanTich.ts` tách danh sách cột MÀN (`cotSoLieu('thuong')` gọn) và cột EXCEL / máy chủ (`cotExcel(ct)` = danh sách cũ, Excel giữ như cũ). Máy chủ tính `o` theo `cotExcel` (Excel đủ cột), panel ô lớp thường trả `kieu: 'bai-thuong'`. Web `BangLuotPanel` thêm nhánh vẽ `bai-thuong`.

**Spec:** đặc tả 2B · mockup v13 B / Bm / A3 · ghi chú mục 2b (P-LT) · PTA XM-2 (Bài không đếm Checkpoint).

## Global Constraints
- Global Constraints + Review Focus của kế hoạch chung; Excel lớp thường giữ cột cũ (Checkpoint, Mini Test, Xử lý).
- Ô "✗ 15/25" (G12): ✓ / ✗ trước số, mẫu số mờ (dáng `ODiem kieu="ti-le"`); ngưỡng "đạt từ 70 %" ở dòng phụ đầu panel; cột Tổng chỉ cho Final Test.
- Bỏ thẻ chỉ số "Chưa chốt PA" ở khung lớp thường (mockup Bm); FT giữ.

## Review Focus
1. Lớp có Checkpoint (PET / KET): bài Checkpoint không vào Bài kiểm tra, không vào Thiếu điểm trên màn; Excel vẫn có nhóm Checkpoint.
2. Bài thiếu môn / môn vắng: ô môn "—", không ✗.
3. Chương trình FOU (L R G+V P) vs BE / ELE (L R W S): cột môn theo chương trình của dòng; panel nhiều chương trình → hợp các môn, ô không có môn "—".
4. URL cũ `cot=cp-dat` / `mini-dat` / `choDuyet` (ct=thuong) → 400 rõ ràng, không lỗi 500.
5. `n === rows.length` với mọi ô lớp thường còn trên màn.

### Task 1: `shared` + máy chủ
**Files:** `shared/domain/phanTich.ts` (182-233, `cotSoLieu`, `cotTongHopFor`, `bangXuatTongHop`), `server/src/phanTich/tongHop.ts` (`tinh`, `tongHop`, `oTongHop`), test `server/src/tests/prPtPanel.tests.ts`.
**Produces:** `cotExcel(ct): CotTongHop[]` (danh sách cũ); `cotSoLieu('thuong')` không còn `cp-*`, `mini-*`, nhóm `xu-ly`; dòng panel `{ id, baiThuong: { attemptId; studentId; ten; classId; lop; bai: 'progress'|'final'; tuan; mon: Record<string, { dung: number; tong: number; dat: boolean } | null>; tong?: number; datTong?: boolean } }`, `kieu: 'bai-thuong'`, `nguong: number`.
- [ ] Phép kiểm đỏ: `cotSoLieu('thuong')` không còn `cp-*`, `mini-*`, nhóm `xu-ly` · ô `luot` (thuong) = gk + ck + chuaDu (không Checkpoint) · mọi ô lớp thường `n === rows.length` và dòng có `baiThuong` · `bangXuatTongHop` lớp thường còn cột Checkpoint.
- [ ] `tinh`: lượt `kind = 'checkpoint'` không vào `luot` / `chuaDu` (vẫn vào `cp-*` cho Excel). `tongHop` tính `o` theo `cotExcel`. `oTongHop` tra cột theo `cotExcel` (Excel / URL cũ vẫn mở), lớp thường → `ganBaiThuong`.
- [ ] Xanh, trần `tocDoDuong.ts` (`tong-hop/o?ct=thuong…&cot=gk-1`). Commit.

### Task 2: Phân tích GV · Đạt Test (lớp thường) → P-LT
**Files:** `server/src/phanTich/giaoVien.ts` (`oChiSoCua` nhánh `ket-qua`, khung thường).
- [ ] Phép kiểm: `ket-qua` khung thường → `kieu: 'bai-thuong'`, `n === rows.length`, môn GV phụ trách `monCua`.
- [ ] Làm (dùng chung `ganBaiThuong`). Commit.

### Task 3: Web
**Files:** `web/src/modules/phanTich/TongHopTestSos.tsx` (cột màn từ `cotSoLieu`, bỏ thẻ Chưa chốt PA khi `thuong`, Excel dùng `cotExcel`), `web/src/ui/BangLuotPanel.tsx` (nhánh `bai-thuong`: Học viên · Lớp · Bài (+ tuần) · môn "✗ 15/25" · Tổng), EN.
- [ ] tsc + bấm thử B, Bm, A3. Ảnh trước | sau `docs/anh/pt-lop-thuong/`, khop-khac.md. `npm run check`. PR, nhắn PTA Plan.
