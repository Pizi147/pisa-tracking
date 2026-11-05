# Phân tích: panel có điểm · Test lớp thường gọn · tab Thi thật · mở hết lớp · thống nhất màu — Kế hoạch PR

> **For agentic workers:** REQUIRED SUB-SKILL: mỗi session code dùng superpowers:subagent-driven-development hoặc superpowers:executing-plans cho PR của mình. Ở đầu phiên, session viết **kế hoạch Task chi tiết** cho đúng PR (skill superpowers:writing-plans), lưu ở `docs/superpowers/plans/2026-11-05-<mã-pr>.md`, dựa vào khung PR dưới đây. Bước dùng ô (`- [ ]`).

**Goal:** Mọi ô số của Phân tích (và panel HV tiến bộ ở Tổng quan) mở ra panel có điểm đúng bài. Test lớp thường gọn. Tab "Thi thật" thống kê Exceed / Đạt / Fail tổng, từng kỹ năng, theo GV (luật mới thay C10). Nút "Mở tất cả lớp" ở Kế hoạch Test + Lịch Test tuần. Màu kết quả thống nhất toàn web.

**Architecture:** Một panel bảng dùng chung (mở rộng `BangLuotPanel`). Máy chủ trả dòng lượt kèm điểm cho mọi ô, tính bằng chính hàm sinh ra số (G-10).
Thống kê thi thật là một hàm dùng chung ở `shared` + một đường máy chủ. Phân tích GV và hồ sơ GV gọi cùng hàm.

**Tech Stack:** React + TypeScript (`web/`), Node + libsql (`server/`), `shared/domain`, i18n VI / EN; phép kiểm `server/src/tests/*.tests.ts` qua `npm run check`.

**Spec:** `docs/superpowers/specs/2026-11-05-phan-tich-thi-that/de-xuat.md` (mục 2A–2F) · mockup `thiet-ke/v13/phan-tich-thi-that.html` + ghi chú `thiet-ke/v13/phan-tich-thi-that-ghi-chu.md` (bảng kiểm kê ô số mục 2, thao tác trước → sau mục 3, Turso mục 4). Chủ SP duyệt mockup 05/11.

## Global Constraints

- **Chủ SP 05/11 (duyệt mockup):** "có những cái tính năng đã có vẫn phải giữ … mockup có vẻ như không làm đúng như hiện trạng web hiện tại ở phần background".
  - Phần mockup VẼ (panel, bảng thống kê Thi thật, bảng Test lớp thường, nút Mở tất cả): theo mockup sát.
  - Phần NỀN mockup không vẽ đúng (đầu trang, hàng lọc, tab khác, nút ⋯, Xuất Excel, phân trang…): giữ đúng web hiện tại.
  - Bảng thao tác trước → sau trong `khop-khac.md`; mất thao tác phải có lý do đã chốt ở đặc tả 2F.
- **Màu kết quả (chủ SP 05/11):** đỏ = không đạt · xanh dương = vừa đạt · xanh lá = exceed (vượt). Token: `--bad` · `--doing` · `--ok` (`web/src/index.css:59-63`), như `ODiem`.
  - Chỉ có Đạt / Chưa đạt (không biết vượt) → Đạt xanh dương.
  - Số tỉ lệ trung tính, trừ cột nhóm Exceed / Đạt / Fail (theo màu nhóm).
- Không panel lồng panel; panel chỉ đọc; link chữ thường gạch chân khi rê (G6 `so-bam`, #956); số 0 không bấm; số trên ô = số dòng panel (G7 / G-10).
- Thi thật chỉ IELTS; KET / PET không làm. Em KCK không vào % Exceed / Đạt / Fail. "Không thi" đếm riêng.
- **Turso:** panel chỉ tải khi bấm. Tab Thi thật ≤ ~5 câu. Theo GV đọc `teacher_assignments` / `enrollments` theo `class_id` / `student_id` của tập, không đọc cả chi nhánh. Mỗi đường mới / đổi có trần ở `server/src/tests/tocDoDuong.ts`. Vượt ~30 câu / ~2 000 dòng → báo PTA.
- EN cho mọi chữ mới; mật độ M1–M10; hạn chế chữ thừa.
- Một PR: ảnh trước | sau 1440 tối + 375 sáng ở `docs/anh/<mã-pr>/`; `npm run check` đầy đủ trước khi mở PR; mô tả ≤ 30 dòng; nhắn PTA Plan.
- Skill: karpathy-guidelines; `/ponytail lite` (PR có giao diện); impeccable `clarify`, `layout`, `harden`, `audit` + `web-design-guidelines` trước khi mở PR.

## Review Focus

1. **Em có nhiều lượt trong khoảng:** ô đếm HV ("Dưới kỳ vọng · L", "HV cần chú ý", "Thi trong kỳ") phải hiện ĐÚNG lượt làm em vào ô, không phải lượt hiện tại. Có phép kiểm ở PR-1.
2. **Ô điểm thiếu / vắng / huỷ / bỏ môn:** hiện "—" (không ✗); hộp chi tiết chỉ mở khi có `tieuChi` hoặc `raw_score / raw_total`. Có phép kiểm ở PR-1.
3. **Thi thật, dữ liệu lệch:**
   - Lộ trình không có phân công kỹ năng (tổng tuần = 0) → không chia cho 0; em đó không vào Theo GV, có ghi ở ⓘ.
   - Phân công thiếu `effective_to` → tính tới ngày thi.
   - Em thi lại một kỹ năng → chỉ kỹ năng thi lần này vào Từng kỹ năng / Theo GV.

   Có phép kiểm ở PR-4.
4. **Quyền:** TVV / GV gọi đường Theo GV → 403 (không chỉ ẩn web). Mục ⋯ "Xuất kết quả từng lượt" hiện cho đúng các vai từng thấy Excel Mock cũ. Có phép kiểm ở PR-4.
5. **Số = dòng:** với MỌI ô của 6 tab (kể cả hàng Tổng, hàng con lớp), `n` panel = số trên ô. Có phép kiểm vòng qua các cột ở PR-1 / PR-2 / PR-3.

---

## Thứ tự, session, model

| PR | Mã | Phụ thuộc | Session | Model · effort |
|---|---|---|---|---|
| 1 | PT-PANEL-FT | — | PT-PANEL | Opus 5.5 · high |
| 2 | PT-LOP-THUONG | PR-1 merge (dùng panel chung, cùng `tongHop.ts`) | PT-PANEL (tiếp) | Opus 5.5 · medium (B Sonnet · high) |
| 3 | PT-VP-PA | PR-1 merge | PT-PANEL (tiếp) | Sonnet 5.5 · high |
| 4 | THI-THAT | phần máy chủ làm ngay; phần web gộp main sau PR-1 | THI-THAT | Opus 5.5 · high |
| 5 | MO-TAT-CA (+ ô Việc của tôi → Công việc) | — | MAU-MO | Sonnet 5.5 · medium |
| 6 | MAU-THONG-NHAT | sau PR-5; tránh tệp `phanTich/` đang sửa (ghi lỗi màu ở đó cho PTA chuyển PR-1..4) | MAU-MO (tiếp) | Opus 5.5 · medium |

Ba session chạy song song. Không hai session sửa cùng tệp cùng lúc: PT-PANEL giữ `web/src/ui/BangLuotPanel.tsx`, `OSo.tsx`, `server/src/phanTich/tongHop.ts`, `baoCao.ts`; THI-THAT giữ `ketQuaThi.ts`, `KetQuaThi.tsx`, phần thi thật của `giaoVien.ts`; MAU-MO không sửa `phanTich/`.

---

### PR-1: PT-PANEL-FT — panel bảng có điểm (FT) + Tăng / Giữ / Giảm

**Files:**
- Modify: `web/src/ui/BangLuotPanel.tsx`
  - thêm cột OVR + Kỳ vọng;
  - cột kỹ năng đang xét tô nền (`knNhan`);
  - ô điểm bấm → hộp chi tiết tại chỗ dùng `dongTieuChi` (`shared/domain/skills.ts:53`) cho W / S, "a/b câu" cho L / R;
  - kiểu dòng `tang-giu-giam`.
- Modify: `web/src/ui/OSo.tsx` (`DanhSachNguon`: mọi nguồn trả `bangLuot` → `BangLuotPanel`).
- Modify: `server/src/phanTich/tongHop.ts` — `oTongHop`, `ganDiemLuot`: mọi ô FT (cả `donVi` HV → lượt làm em vào ô), trả `ovr`, `kyVong`, `tieuChi`, `raw`.
- Modify: `server/src/phanTich/baoCao.ts` — ô Đạt MT, Kết quả MT, Tiến bộ theo kỹ năng; panel Tăng / Giữ / Giảm.
- Modify: `server/src/phanTich/giaoVien.ts` — CHỈ ô FT: Đạt kỳ vọng Test, Tiến bộ, HV cần chú ý. Phần thi thật thuộc PR-4.
- Modify (chủ SP 05/11, thêm): **Tổng quan · panel "HV tiến bộ"** (`web/src/modules/worklist/TongQuanV5.tsx:467`, nguồn `/giao-vien/:id/chi-so/o?cot=tien-bo…` ở `server/src/phanTich/giaoVien.ts`) và ô "Tiến bộ" của Lớp tôi dạy (`LopToiDay.tsx:192`). Dùng cùng panel bảng kiểu `'tang-giam'`. Giữ hai tab Chưa đạt / Đạt đang có. Hiện Học viên · Lớp · MT · kỹ năng · Trước → Sau · Chênh · Kỳ vọng (✓ / ✗).
- Test: `server/src/tests/prPtPanel.tests.ts` (mới, gọi ở `server/src/tests/run.ts`).

**Interfaces — Produces:**
- `type ODiemLuot = { v: number; kq: 'vuot' | 'bang' | 'duoi' | null; tc?: (number | null)[] | null; raw?: [number, number] | null } | null`
- `type DongLuotDiem = { studentId; ten; classId; lop; mt: number; tuan: string; kn: Record<'l'|'r'|'w1'|'w2'|'s', ODiemLuot>; ovr: ODiemLuot; kyVong: number | null }`
- `type DongTangGiam = { studentId; ten; classId; lop; kn: string; truoc: { mt: number; v: number }; sau: { mt: number; v: number; kq } ; chenh: number; kyVong: number | null }`
- Máy chủ: mọi đường ô số FT của Phân tích trả `{ n, tieuDe, rows, bangLuot: true, kieu: 'luot' | 'tang-giam', knNhan?: string, cachTinh, chiNhanh }`.
- `BangLuotPanel` nhận thêm `kieu` và `knNhan`.

- [ ] Viết phép kiểm đỏ:
  - `PT-PANEL · ô SOS 3 tuần: rows.length === n && mọi dòng có kn + ovr + kyVong`;
  - `PT-PANEL · Dưới kỳ vọng · L: dòng là lượt làm em vào ô (attemptId khớp), không phải lượt hiện tại` (em có 2 lượt trong khoảng);
  - `PT-PANEL · Tăng W1: truoc.v < sau.v, chenh = sau − truoc`;
  - `PT-PANEL · ô thiếu điểm: kn.s === null`;
  - vòng qua mọi cột `cotSoLieu('ft')` × hàng: `n === rows.length`.
- [ ] Chạy `npx tsx server/src/tests/run.ts prPtPanel` → ĐỎ.
- [ ] Làm máy chủ, rồi web theo mockup A1 / A1m / A2. Hộp chi tiết chép dáng U03 (`BangHoSoLop.tsx:147, 359`).
- [ ] Phép kiểm xanh. `npm run check` đầy đủ. Ảnh trước | sau (A1, A1m 375, A2). Kiểm kê ô FT trong `khop-khac.md`.
- [ ] Commit, PR, nhắn PTA Plan.

### PR-2: PT-LOP-THUONG — Test lớp thường gọn + panel bài lớp thường

**Files:**
- Modify: `shared/domain/phanTich.ts:182-233`:
  - bỏ `nhomCon` `'checkpoint' | 'mini'` khỏi cột MÀN;
  - bỏ nhóm `xu-ly` khỏi `cotSoLieu('thuong')`;
  - "Bài kiểm tra" không đếm Checkpoint;
  - Excel giữ cột cũ — tách `cotExcel` nếu cần.
- Modify: `server/src/phanTich/tongHop.ts` (ô lớp thường → `bangLuot` kiểu `'bai-thuong'`, môn theo chương trình).
- Modify: `web/src/modules/phanTich/TongHopTestSos.tsx`, `web/src/ui/BangLuotPanel.tsx` (kiểu `bai-thuong`: cột môn "✗ 15/25", cột Tổng cho Final).
- Bỏ thẻ "Chưa chốt PA" (lớp thường).
- Test: thêm vào `prPtPanel.tests.ts`.

**Interfaces — Consumes:** PR-1 `BangLuotPanel` + `bangLuot`. **Produces:** `kieu: 'bai-thuong'`, dòng `{ …, bai: 'progress' | 'final', mon: Record<string, { dung: number; tong: number; dat: boolean } | null>, tong?: number }`.

- [ ] Phép kiểm đỏ:
  - `cotSoLieu('thuong')` không còn khoá `cp-*`, `mini-*`, nhóm `xu-ly`;
  - ô Bài kiểm tra = Progress + Final + Thiếu điểm (không Checkpoint);
  - mọi ô lớp thường `n === rows.length`;
  - Excel lớp thường còn cột Checkpoint.
- [ ] Làm. Phép kiểm xanh. `npm run check`. Ảnh B / Bm / A3. Commit, PR, nhắn PTA.

### PR-3: PT-VP-PA — panel vi phạm + PA đủ thông tin

**Files:**
- Modify: `server/src/phanTich/yThucPhanTich.ts`, `server/src/phanTich/hieuQuaPa.ts`, phần PA của `baoCao.ts` / `giaoVien.ts` (Việc đúng hạn, PA cải thiện).
- Modify: `web/src/modules/phanTich/YThucPhoiHop.tsx`, `HieuQuaPa.tsx`; panel bảng dùng chung (PR-1) thêm kiểu `'vi-pham' | 'pa'`.
- Giữ panel Case, `PanelChamDiem`, nút **Ghi kết quả** ở panel Hiệu quả PA (XM-4).
- Test: thêm vào `prPtPanel.tests.ts`.

**Interfaces — Produces:**
- `DongViPham = { studentId; ten; classId; lop; ngay; nhom; moTa; nguoiGhi; trangThai }`.
- `DongPa = { studentId; ten; classId; lop; caseId; kyNang; loaiPa; tuanBatDau; ketQua; nguoiPhuTrach; han?; ngayGhi?; dungHan? }`.
- Ô đếm em → một dòng / em. Ô đếm lớp → `{ classId; lop; gvcn; hvViPham; siSo; viPham; chuaXuLy }`.

- [ ] Phép kiểm đỏ:
  - thẻ "Lớp có vi phạm" trả dòng lớp đủ cột;
  - ô PA cải thiện có `ketQua`;
  - không đường nào trả dòng chỉ có tên (lặp mọi ô hai tab).
- [ ] Làm. Xanh. `npm run check`. Ảnh A4. Commit, PR, nhắn PTA.

### PR-4: THI-THAT — tab Thi thật + luật mới thay C10 (một hàm)

**Files:**
- Create: `shared/domain/thiThatThongKe.ts` — hàm thuần, không SQL.
- Modify: `server/src/phanTich/ketQuaThi.ts`
  - đường thống kê `/phan-tich/thi-that` (Tổng, Từng kỹ năng, Theo GV) + panel P-TT / P-GV;
  - bỏ phần Mock của tab;
  - Theo GV chặn vai không có `analysis.view_teacher` và không phải CX.
- Modify: `server/src/phanTich/giaoVien.ts` (`mucThiThat`, `thiThatCuaGv`) + nơi hồ sơ GV gọi (`web/src/modules/giaoVien/HoSoGiaoVienPage.tsx` qua máy chủ) → dùng `thongKeThiThat`, bỏ luật C10.
- Modify: `web/src/modules/phanTich/KetQuaThi.tsx`, `PhanTich.tsx` (tab đổi tên "Thi thật", bỏ ô đoạn Mock), `TongHopTestSos.tsx` (⋯ "Xuất kết quả từng lượt" cho đúng các vai cũ — XM-3).
- Modify: `server/src/tests/tocDoDuong.ts` (trần đường mới).
- Test: `server/src/tests/prThiThatTk.tests.ts` (mới).

**Interfaces — Produces:**
```ts
type MucThi = 'exceed' | 'dat' | 'fail';
mucThi(diem: number, target: number): MucThi;            // > · = · <
type KqThi = { studentId; cycleId; classIdCuoi; ngay; l; r; w; s; ovr; target: number | null; kck: boolean; khongThi: boolean; thiLai: ('l'|'r'|'w'|'s')[] | null };
type DoanDay = { userId: number; kn: 'l'|'r'|'w1'|'w2'|'s'; tuan: number };    // tuần GV dạy kỹ năng cho MỘT em trong lộ trình tới ngày thi
thongKeThiThat(kq: KqThi[], day: Map<number /*cycleId*/, DoanDay[]>): {
  tong: { thi: number; exceed: number; dat: number; fail: number; khongThi: number; kck: number };
  kyNang: Record<'l'|'r'|'w'|'s', { hv: number; exceed: number; dat: number; fail: number; tb: number | null }>;
  gv: { userId: number; kn: string; hv: number; tuan: number; tb: number | null; exceed: number; dat: number; fail: number /* % theo trọng số */ }[];
}
```
- Trọng số = tuần GV dạy ÷ tổng tuần em học kỹ năng đó. W thi thật chia đều W1 / W2.
- Kỹ năng thi lại (`thiLai`) chỉ tính kỹ năng thi lần này. Kỹ năng so `target` overall.

- [ ] Phép kiểm đỏ (`prThiThatTk`):
  - `mucThi(6.5, 6.0) === 'exceed'`, `mucThi(6.0, 6.0) === 'dat'`, `mucThi(5.5, 6.0) === 'fail'`;
  - em KCK không vào %, "Không thi" đếm riêng;
  - GV A dạy 8/12 tuần → trọng số 0.67 (cách 0.01);
  - tổng tuần 0 → không lỗi, em không vào `gv`;
  - `effective_to` NULL → tính tới ngày thi;
  - thi lại W → `kyNang.l.hv` không tăng;
  - Phân tích GV và hồ sơ GV ra cùng số với `thongKeThiThat` cho cùng GV;
  - TVV gọi Theo GV → 403;
  - mục Excel MT hiện cho các vai cũ;
  - `n === rows.length` cho mọi ô.
- [ ] Phần máy chủ + `shared` làm ngay. Phần web gộp main SAU khi PR-1 merge, dùng `BangLuotPanel` kiểu `'thi-that'` (+ cột "Tuần dạy" cho P-GV).
- [ ] **SQL chỉ đọc** trong mô tả PR: số Pass Target theo GV trước (C10) → sau, trên bản sao 29/10. Ghi kết quả. Đếm phân công thiếu `effective_to`.
- [ ] Xanh. `npm run check`. Ảnh C1–C7 (1440 tối, 375 sáng). Commit, PR, nhắn PTA (PTA báo chủ SP số GV đổi trước merge).

### PR-5: MO-TAT-CA — nút mở hết lớp

**Files:**
- Modify: Kế hoạch Test, Lịch Test tuần (`web/src/modules/fasttrack/` — tìm trang theo route `/test`).
- Dùng mẫu nút "Mở / Thu gọn tất cả" của HV & Lớp (U04).
- Chỉ QL + Quản trị (cùng quyền máy chủ đang dùng để phân vai trang). Mặc định gập. Không thêm request.

- **Thêm (chủ SP 05/11):** Tổng quan GV — bấm ô "Việc của tôi" (`web/src/modules/worklist/TongQuanV5.tsx:462`, `ChiSo`) sang `/cong-viec` (góc Của tôi). Cả ô là link (luật "›" = đổi trang). Số quá hạn trong ô cũng dẫn tới đó. Không còn mở panel.
- [ ] Phép kiểm:
  - nút Mở tất cả chỉ có ở vai QL / QT; bấm mở mọi lớp, chữ đổi "Thu gọn tất cả";
  - ô Việc của tôi của GV là link `/cong-viec`.
- [ ] Ảnh D1 / D2 / D3 + Tổng quan GV trước | sau. `npm run check`. PR, nhắn PTA.

### PR-6: MAU-THONG-NHAT — màu kết quả toàn web

**Files:**
- Kiểm kê trước: grep `text-ok|text-dat|--ok|text-doing|text-bad|text-late` + chip / nhãn kết quả (Đạt, Chưa đạt, Pass, vượt, Đạt Target, ✓ / ✗) ở `web/src/` + `shared/`.
- Lập bảng ở `docs/anh/mau-thong-nhat/kiem-ke.md`: nơi · ý nghĩa · màu hiện tại · màu đúng.
- **Hồ sơ GV trước** (chủ SP nêu): `web/src/modules/giaoVien/HoSoGiaoVienPage.tsx` và thành phần con.
- Sửa ngoài `web/src/modules/phanTich/`. Lỗi màu trong `phanTich/` → nhắn PTA để chuyển PR-1..4.
- Test: phép kiểm nguồn trong `server/src/tests/prMauKq.tests.ts`:
  - không còn nhãn "Đạt" / "Pass" dùng `text-ok` khi không phân biệt vượt;
  - "vượt / exceed" dùng `--ok`;
  - "chưa đạt / fail" dùng `--bad`.
- [ ] Kiểm kê → sửa → phép kiểm xanh → ảnh trước | sau từng màn đổi → `npm run check` → PR, nhắn PTA.

---

## Self-review (PTA)

- **Phủ đặc tả:**
  - 2A → PR-1 / PR-2 / PR-3.
  - 2B → PR-2.
  - 2C, 2F → PR-4.
  - 2D → PR-5.
  - 2E: vi phạm / PA → PR-3; quyền Theo GV, W1 / W2, KCK → PR-4.
  - Màu (chủ SP 05/11) → PR-6, cộng luật màu trong Global Constraints cho PR-1..4.
  - Giữ tính năng nền → Global Constraints + bảng thao tác mỗi PR.
- **Tên kiểu thống nhất:**
  - `BangLuotPanel` có các `kieu`: `'luot' | 'tang-giam' | 'bai-thuong' | 'vi-pham' | 'pa' | 'thi-that'`.
  - `thongKeThiThat` / `mucThi` dùng ở PR-4 và PR-6. PR-6 đọc `mucThi` cho màu nếu cần.
