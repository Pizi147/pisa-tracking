# PR OV-1a · MT0 nhập đúng bảng, "Nhập điểm" mở Điểm theo lớp, lệnh kiểm chỉ đọc — Implementation Plan

> **For agentic workers:** làm theo `superpowers:executing-plans` NGAY TRONG SESSION (plan.md 1.2 — KHÔNG subagent). Mỗi Task:
> `superpowers:test-driven-development` (đỏ trước). Lỗi lạ: `superpowers:systematic-debugging`. Steps dùng checkbox `- [ ]`.

**Goal:** Hết lỗi Video 1 (mở “Nhập điểm” lớp thường ra MT0 nhưng bảng kiểu Final, và bảng đó ghi được điểm MT0 sai kiểu); “Nhập điểm” ở
hồ sơ lớp mở thẳng Test › Điểm theo lớp đúng lớp (có lượt MT0 cho lớp thường); đổi tên tab; Phân tích mở sẵn tuần trước; thêm hai lệnh
CHỈ ĐỌC để chủ SP soi dữ liệu bản chính (MT0 nhập sai, trạng thái từng ô một lớp — cho OV-1b / mục 5.2).

**Architecture:** Sửa gốc ở máy chủ: đường ghi tỷ lệ từ chối lượt `kind='mt0'`, bảng tỷ lệ (`regularSheet`) không trả hàng MT0 nữa — web
không thể chọn nhầm. Điểm theo lớp thêm mã lượt `thuong:mt0` dùng lại `chamSheet(kind:'mt0')` (bảng band sẵn có). Hai lệnh ops theo mẫu
`server/src/ops/kiemDuLieuMt.ts` (hàm thuần nhận `conn` + khối chạy lệnh).

**Tech Stack:** TypeScript (tsc), Express, libsql/Turso, React + Vite. Phép kiểm `server/src/tests/*.tests.ts` gọi ở cuối `run.ts`.

**Spec:** `docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md` (mục 1 dòng 3.2, 3.3, 5.1, 7.2; mục 5 dòng OV-1a; mục 6 ý 3).

## Global Constraints
- Không dùng Fable. Không deploy, không chạm Turso / Netlify / DB bản chính (hai lệnh ops chỉ ĐỌC; chủ SP tự chạy).
- Mọi câu SQL: tham số vị trí `?` (không tham số đặt tên), `IN (...)` qua `theoLo` (≤ 900 tham số), không UNION > 20 vế.
- Hai lệnh ops: chỉ `prepare(...).all()` / `.get()`; KHÔNG `run`, `exec` ghi; in dòng đầu `CHỈ ĐỌC`.
- Chữ trên web ngắn; tên tab đúng chữ: **`Lịch Test / Chấm Test`**. Thời gian trên màn = mã tuần `W2 OCT`.
- `prepare()` của libsql: đi qua `db.ts` như hiện nay (CLAUDE.md “Bộ nhớ khi chạy kiểm”).
- PR có sửa giao diện nhỏ → `/ponytail lite`; `npm run check` MỘT lần cuối; bấm thử MỘT lần.

## Review Focus
1. Hàng MT0 biến khỏi bảng tỷ lệ → mọi nơi đang đọc `regularSheet` cho MT0 (nếu có) phải chuyển sang `chamSheet(kind:'mt0')` — grep trước khi sửa.
2. Huỷ bài / huỷ lượt MT0 (`xoaDiemLuot`, PR-VN5) không được đi vào nhánh bị chặn mới — giữ đường band cho MT0.
3. Lượt `thuong:mt0` đếm ô trống theo ô band (Writing = W1 + W2), không theo `writing` một ô.
4. Lớp thường không có MT0 → danh sách lượt không có `thuong:mt0`, không lỗi; mã `thuong:abc` → 400.
5. `kiem-o-lop` với mã lớp không tồn tại → báo rõ, thoát mã khác 0, không đụng DB.

---

### Task 1: Máy chủ chặn ghi tỷ lệ vào MT0, bảng tỷ lệ bỏ hàng MT0 (gốc lỗi 3.3)
**Files:** Modify `server/src/normal/regular.ts` (`saveRegularScore` ~465, `regularSheet` ~878) · Test: Create `server/src/tests/prOv1a.tests.ts`, Modify `server/src/tests/run.ts` (gọi `runPrOv1aTests` ở cuối, trước dòng tổng kết)
**Interfaces:** Produces `runPrOv1aTests(t: YThucTestKit)` (mẫu `prVn5.tests.ts`, mỗi ca trong `BEGIN IMMEDIATE … ROLLBACK` + `xoaNho()`).
- [ ] **Step 1: Viết phép kiểm đỏ.** Dựng MT0 như `prMt0.tests.ts` (QL ghi hướng Lên FT cho một em BE/FOU qua `loTrinhTiep`), đặt ngày nghiệp vụ
  sau tuần MT0. Ca:
  - `OV1a-1`: `saveRegularScore(QL, mt0Id, 'listening', { score: 6, total: 9 })` ném lỗi 400, chữ chứa `MT0`; `assessment_scores` của lượt không đổi.
    Cùng lỗi cho `{ noShow: true }`.
  - `OV1a-2`: `regularSheet(QL, lopId)` và `regularSheet(QL, lopId, 'mt0')` không có hàng `kind === 'mt0'`; `chamSheet(QL, lopId, { kind: 'mt0' })`
    vẫn `mode === 'ielts_band'` và `ft.rows.length ≥ 1`.
  - `OV1a-2b`: huỷ MT0 bằng đường hiện có (grep nơi huỷ / xoá điểm MT0: `huyLuot`, `xoaDiemLuot`, `keHoachVeThuong`) vẫn chạy (không dính chặn mới).
- [ ] **Step 2:** `npm run build:server && node dist-server/server/src/tests/run.js` → OV1a-1, OV1a-2 ĐỎ.
- [ ] **Step 3: Sửa.** `saveRegularScore`: ngay sau kiểm `cancelled`, `if (a.kind === 'mt0') throw badRequest('MT0 chấm band — nhập ở Test › Điểm theo lớp › MT0.')`
  (trước nhánh `noShow`). `regularSheet`: điều kiện luôn có `AND a.kind != 'mt0'`. Grep `regularSheet(` / `/regular/classes/` trên web để chắc không
  màn nào cần hàng MT0 từ đây (Review Focus 1).
- [ ] **Step 4:** chạy lại → xanh. **Step 5:** commit `OV-1a T1: MT0 không ghi qua bảng tỷ lệ, bảng tỷ lệ bỏ MT0`.

### Task 2: Điểm theo lớp có lượt MT0 cho lớp thường + `?luot=`
**Files:** Modify `shared/domain/diemTheoLuot.ts` (`MaLuot`, `docMaLuot`, `nhanMaLuot`), `server/src/cham/diemTheoLuot.ts` (`tomTatLop`),
`web/src/modules/test/TabDiemLop.tsx` (đọc `luot` trên URL → `DiemTheoLop luotBanDau`) · Test: `prOv1a.tests.ts`
**Interfaces:** Produces `MaLuot = { loai: 'mt'; so: number } | { loai: 'thuong'; kind: 'progress' | 'final' | 'mt0' }`;
`docMaLuot('thuong:mt0') → { loai: 'thuong', kind: 'mt0' }`; `nhanMaLuot` → `'MT0'`; thứ tự lượt lớp thường: Progress 1 · Final 2 · MT0 3.
URL: `/test/diem-lop?lop={classId}&luot={ma}` (ma như `thuong:mt0`, `mt:2`; sai / không có → lượt mặc định như nay).
- [ ] **Step 1: Đỏ.** `OV1a-3`: `docMaLuot('thuong:mt0')` đúng, `docMaLuot('thuong:abc') === null`; `danhSachLuot(QL, lopId).luot` có `ma === 'thuong:mt0'`,
  `nhan === 'MT0'`, đứng sau Final; lớp thường KHÔNG có MT0 → không có mã đó. `bangTheoLuot(QL, lopId, 'thuong:mt0')` → `mode === 'ielts_band'`,
  `ft.rows.length ≥ 1`. `OV1a-4`: MT0 chưa điểm, 4 kỹ năng bắt buộc → `oTrong === 5` (L, R, W1, W2, S).
- [ ] **Step 2:** chạy → đỏ.
- [ ] **Step 3: Sửa.** `tomTatLop`: nhận `a.kind === 'mt0'` ở lớp KHÔNG FT (bỏ em đã lưu trữ như Progress/Final) → `m = { loai: 'thuong', kind: 'mt0' }`,
  `thuTu 3`; khi đếm ô nhập dùng ô band (`entrySkillsOf`) cho lượt MT0 (như FT). `bangTheoLuot` không cần đổi nhánh (đã gọi `chamSheet({ kind })`) —
  kiểm lại điều kiện họ lớp `(m.loai === 'mt') !== (mode === 'ielts_band')` vẫn đúng. Web `TabDiemLop`: `luotBanDau={sp.get('luot') ?? undefined}`.
- [ ] **Step 4:** xanh. **Step 5:** commit `OV-1a T2: Điểm theo lớp có lượt MT0 lớp thường, ?luot=`.

### Task 3: Nút “Nhập điểm” ở hồ sơ lớp mở Test › Điểm theo lớp (mục 3.2)
**Files:** Modify `web/src/modules/classes/DauTrangLop.tsx` (`nhapDiem`)
**Interfaces:** Consumes URL Task 2. `nhapDiem = /test/diem-lop?lop=${data.id}` cho **cả lớp thường và FT** (bỏ `/bang-diem-thuong/:id`,
`/nhap-diem/:id?periodId=` ở nút này; hai đường cũ GIỮ cho link khác như Lịch Test “Mở lưới đầy đủ”).
- [ ] **Step 1:** sửa một dòng; nút chính (`chinh.loai === 'nhap-diem'`, thẻ `Link`) và nút phụ dùng cùng `nhapDiem`.
- [ ] **Step 2:** typecheck (`npm run typecheck`). Kiểm bằng bấm thử ở Task 6. **Step 3:** commit `OV-1a T3: Nhập điểm → Điểm theo lớp`.

### Task 4: Tên tab “Lịch Test / Chấm Test”, bỏ chữ “thi” đầu khung, Phân tích mở sẵn tuần trước (5.1, 7.2)
**Files:** Modify `shared/domain/dieuHuong.ts:71` (`TAB_TEST_LABEL.lich`), `web/src/modules/test/LichTestTab.tsx:241` (`phuK2`),
`server/src/phanTich/tongHop.ts` (`chaCua` nhánh `theo === 'tuan'` + kiểu dòng trả về), `web/src/modules/phanTich/TongHopTestSos.tsx` (effect `daMoSan`) · Test: `prOv1a.tests.ts`
**Interfaces:** Produces trên mỗi hàng lớn khi `theo === 'tuan'`: `tuanNay: boolean` (tuần chứa hôm nay nghiệp vụ). Web mở sẵn:
`data.theo === 'tuan' ? data.hang.find((h) => h.con?.length && !h.tuanNay) ?? data.hang[0] : data.hang[0]`.
- [ ] **Step 1: Đỏ.** `OV1a-5`: `TAB_TEST_LABEL.lich === 'Lịch Test / Chấm Test'`; kết quả tổng hợp theo tuần có đúng một hàng `tuanNay === true`
  khi tuần này có lượt, mọi hàng khác `false` (gọi hàm dịch vụ của `/phan-tich/tong-hop`, ngày demo cố định).
- [ ] **Step 2:** đỏ. **Step 3: Sửa.** Đổi nhãn; `phuK2` = ` · {tuần} {chipHan}` (bỏ chữ “bài thi”); thêm `tuanNay` (đã có biến `trongTuanNay`); web chọn hàng như trên.
  Grep chỗ khác hiện “Lịch Test” làm TÊN TAB (sổ tay, chuông, `CODE_MAP.md`) — chỉ đổi chỗ là tên tab.
- [ ] **Step 4:** xanh. **Step 5:** commit `OV-1a T4: tên tab Lịch Test / Chấm Test, Phân tích mở tuần trước`.

### Task 5: Hai lệnh CHỈ ĐỌC — nhóm 6 của `kiem-du-lieu-mt` + `kiem-o-lop`
**Files:** Modify `server/src/ops/kiemDuLieuMt.ts` (nhóm 6), Create `server/src/ops/kiemOLop.ts`, Modify `package.json` (script `kiem-o-lop`),
`CODE_MAP.md` (mục Bản chính: thêm `kiemOLop.ts`) · Test: `prOv1a.tests.ts`
**Interfaces:**
- `DongKiem.nhom: 1 | 2 | 3 | 4 | 5 | 6`; `TIEU_DE_NHOM[6] = '6. MT0 có điểm nhập kiểu đúng/tổng (không band) — nhập nhầm ở bảng lớp thường'`.
  Bắt: lượt `kind='mt0'`, không huỷ, có ô `raw_score IS NOT NULL AND (raw_total IS NOT NULL OR skill = 'writing')`. `vanDe` ghi các ô + giá trị.
  Khối in lệnh lặp nhóm `[1..6]`.
- `kiemOLop(conn: any, maLop: string): DongO[]` với `DongO = { hocVien; ma; luot; trangThaiLuot; lichSu; kyNang; o; tuanLich; sitStatus; batBuoc;
  soLanVang; huyVang; hanRieng; band; diem; tong; dauTru; tuanDauTru; daChot; nhapMuon; tru: string }` — một dòng mỗi ô nhập (W = W1, W2) của mọi lượt
  (gồm MT0, Progress, Final, lượt đã huỷ) của em đang có trong lớp; kèm ≤ 5 dòng mới nhất `attempt_schedule_history` mỗi lượt (`hanhDong · cũ → mới · lúc`).
  Lớp không tồn tại → ném `Error('Không thấy lớp "<mã>"')`. Lệnh: `npm run kiem-o-lop -- "CP FT RF 01"` → in bảng (mẫu `inBang`), dòng đầu
  `[kiem-o-lop] Đích: … — CHỈ ĐỌC`. Script npm: `"kiem-o-lop": "npm run build:server && node dist-server/server/src/ops/kiemOLop.js"`.
- [ ] **Step 1: Đỏ.** `OV1a-6`: chèn (trong tx, rollback) một ô MT0 kiểu tỷ lệ → `kiemDuLieuMt(conn)` có dòng `nhom === 6` của lượt đó; MT0 band thường → không.
  `OV1a-7`: `kiemOLop(conn, <mã một lớp FT demo>)` trả ≥ 1 dòng, mỗi lượt FT có 5 ô (L, R, W1, W2, S); `total_changes()` trước = sau; mã lạ → ném lỗi chữ `Không thấy lớp`.
- [ ] **Step 2:** đỏ. **Step 3:** viết (mọi câu chỉ SELECT, gom theo lô, không hỏi từng ô). **Step 4:** xanh.
- [ ] **Step 5:** chạy thử trên DB demo: `npm run kiem-o-lop -- "MB FT RF 12"`, `npm run kiem-du-lieu-mt` → in được. Commit `OV-1a T5: kiem-o-lop + nhóm 6 MT0`.

### Task 6: Kiểm cuối, bấm thử, mở PR
- [ ] `npm run check` MỘT lần (foreground) → xanh, ghi số phép kiểm.
- [ ] Bấm thử MỘT lần (cổng `PORT`/`WEB_PORT` riêng). DB demo không có MT0: QL (userId 2) gọi `PUT /api/students/76/lo-trinh-tiep`
  `{"huong":"fast_track","mucTieu":6.5}` (lớp MB BE 03), `PUT /api/demo/config {"demoDate":"2026-10-23"}` (qua tuần MT0). Ảnh 1440 tối + 375 sáng:
  (a) hồ sơ lớp MB BE 03 › Nhập điểm → Điểm theo lớp đúng lớp, chọn **MT0** ra bảng band (L, R, W1, W2, S); (b) `/bang-diem-thuong/17` không còn “MT0”
  trong ô Bài; (c) Lịch Test tên tab mới, khối “Test chấm tuần này” ghi ` · W… OCT` không chữ “bài thi”; (d) Phân tích › Tổng hợp Test + SOS mở sẵn tuần trước.
  Vai: QL + GV (userId 9). Trả demoDate về `2026-09-14` sau khi chụp.
- [ ] `/impeccable audit` (chỉ các màn trên) → `/ponytail-review` → mở PR vào `main` (KHÔNG merge), mô tả ≤ 30 dòng: Task 1–5, số phép kiểm, ảnh,
  hai lệnh chỉ đọc cho chủ SP (câu lệnh), chú thích `ponytail:`/`shortcut:` nếu có. Một dòng mục 11 `plan.md`.

## Nghiệm thu (đặc tả mục 6)
- Mở “Nhập điểm” lớp thường lần đầu **không bao giờ** ra bảng tỷ lệ cho MT0; máy chủ từ chối ghi đúng/tổng / “-” tỷ lệ vào MT0 (400).
- Điểm theo lớp lớp thường có lượt MT0 (bảng band), ô trống đếm W1 + W2; `?lop=&luot=` mở đúng.
- Tab “Lịch Test / Chấm Test”; khung không còn chữ “bài thi”; Phân tích mở tuần trước.
- `kiem-du-lieu-mt` có nhóm 6; `kiem-o-lop` in trạng thái từng ô; cả hai không ghi DB.

## Prompt (chủ SP dán vào session code mới — Opus 5.5 · High; phương án B Sonnet 5.5 · High)
```
/ponytail lite
Bạn là SESSION CODE của PISA Tracking (repo Pizi147/pisa-tracking). PR: OV-1a.
Đọc trước: CLAUDE.md; plan.md mục 1 (1.2, 1.3b), mục 3 (dòng 11/10), mục 4 khối OVERHAUL; đặc tả
docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md (mục 1 dòng 3.2/3.3/5.1/7.2, mục 6 ý 3);
kế hoạch docs/superpowers/plans/2026-10-11-pr-ov1a-dung-mt0-nhap-diem.md (làm đúng Task 1→6).
Đầu phiên: nói model đang chạy (Opus 5.5 hoặc Sonnet 5.5 được; Fable/Haiku → dừng báo chủ SP).
Nhánh mới từ origin/main mới nhất: pr-ov1a-mt0-nhap-diem. Làm từng Task ngay trong session (executing-plans, KHÔNG subagent),
test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ. Không deploy, không chạm Turso/Netlify.
npm run check MỘT lần cuối; bấm thử MỘT lần theo Task 6 (ảnh đính PR); /impeccable audit (màn đã sửa) → /ponytail-review →
mở PR vào main, KHÔNG merge, mô tả ≤ 30 dòng. Báo lại chủ SP ≤ 15 dòng: link PR, check xanh (số phép kiểm), việc chưa làm.
```

## Giả định (planning tự quyết, đổi được)
- Nút “Nhập điểm” lớp FT cũng mở Điểm theo lớp (mục 3.2 nói “từ hồ sơ lớp”); đường `/nhap-diem/:id` giữ cho link khác.
- MT0 vẫn mở được bằng `/nhap-diem/:id?kind=mt0` (Lịch Test); không xoá đường đó.
- Không sửa dữ liệu MT0 đã nhập sai ở PR này — chờ log `kiem-du-lieu-mt` nhóm 6 của chủ SP rồi planning quyết (migrate đi cùng lần deploy sau OV).
