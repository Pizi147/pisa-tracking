# Sổ nghĩa vụ: kế hoạch triển khai

> **Cho agent thực thi:** SKILL BẮT BUỘC: dùng superpowers:subagent-driven-development (khuyên dùng) hoặc superpowers:executing-plans để làm từng task. Các bước dùng checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** một bộ đếm việc / bài chấm duy nhất, chính xác. Mỗi người có ba số Đúng hạn · Làm muộn · Chưa làm, mọi nơi đọc cùng một nguồn.

**Kiến trúc:**
- Bảng `nghia_vu`, mỗi bài / việc một dòng, do hàm `ghiSo(khoa)` duy trì.
- `ghiSo` tính lại một dòng từ dữ liệu gốc bằng hàm luật hiện có, rồi upsert.
- Mọi đường ghi gọi `ghiSo`. Lịch đêm đối chiếu để bắt chỗ quên gọi.
- Phân tích GV, hồ sơ GV và Tổng quan chỉ đọc sổ.

**Công nghệ:** TypeScript, libsql / Turso (SQLite), React. Phép kiểm `server/src/tests/*.tests.ts`, đăng ký trong `run.ts`.

**Đặc tả:** `docs/superpowers/specs/2026-11-09-so-nghia-vu-design.md`. Đọc trước. Luật ở mục 1, máy chạy ở mục 2.

## Ràng buộc chung
- Mốc bắt đầu tính: hằng `MOC_TINH_TRE = '2026-10-19'` (thứ Hai W4 OCT 2026). Hạn gốc < mốc và đã xong → Đúng hạn. Chưa xong → Chưa làm.
- Hạn của bài = `mocTreNhapDiem(han, tuanThi)` (`server/src/platform/week.ts`). Quá hạn = `quaHanNhapDiem`. Không viết luật thứ hai.
- "Xong" của bài = `assessment_scores.nhap_dau_ngay`. "Xong" của việc = cột ngày xong liệt kê ở đầu `server/src/phanTich/viecDaXong.ts`.
- Người chịu trách nhiệm theo spec mục 1.2. S chéo chưa ai nhận: `nguoi = NULL`, `s_cheo = 1`, nhân cho GV có kỹ năng S **lúc đọc**.
- Sổ không có giao diện riêng. Giao diện chỉ đổi số và panel 3 tab.
- Dòng đọc Turso: mỗi đường mới / đổi có trần ở `server/src/tests/tocDoDuong.ts`. Mô tả PR ghi số đo trước → sau.
- `server/src/db.ts`: không gọi `prepare` của libsql bằng đường vòng (CLAUDE.md, mục Bộ nhớ).
- Bản chính có cột ACTION / KEY viết hoa. Migrate phải thử trên bản chép `D:\Github\pisa-mig\mig.sqlite` (chép ra thư mục tạm, chỉ đọc).
- Skill: `karpathy-guidelines`, `ponytail` full (riêng PR-2 có giao diện: `/ponytail lite` + `impeccable` harden / adapt), `superpowers:test-driven-development`. `/code-review high` trước mỗi PR, `/ponytail-review`.
- Không dùng Fable. Model: Opus 5.5 high, phương án B Sonnet 5.5 high.

## Điểm cần rà kỹ (không task nào tự kiểm được → thêm phép kiểm vào task sở hữu)
1. **Đổi phân công giữa kỳ:** bài của tuần trước khi đổi vẫn tính cho người cũ, từ ngày hiệu lực tính cho người mới → Task 3, ca `NV-PC`.
2. **Em chuyển lớp giữa kỳ:** bài trước khi chuyển tính cho GV lớp cũ (lớp lúc thi) → Task 2, ca `NV-CHUYEN`.
3. **Xoá điểm đã nhập** (nhập nhầm rồi xoá): dòng trở về Chưa làm / Chưa tới hạn, không kẹt Đúng hạn → Task 3, ca `NV-XOA`.
4. **Đặt lại hạn nhiều lần:** `han_goc` giữ lần đầu, `han` theo lần cuối → Task 2, ca `NV-HAN2`.
5. **GV mất kỹ năng S sau hạn:** bài S chéo chưa ai nhận vẫn tính cho người có S **tại ngày hạn** → Task 5, ca `NV-SCHEO-NGAY`.

---

## PR-1: sổ chạy song song (chưa đổi giao diện)

### Task 1: Bảng `nghia_vu` + migrate
**Tệp:**
- Sửa: `server/src/schema.sql` (thêm bảng + chỉ mục).
- Tạo: `server/src/migrate/prNghiaVu.ts` (tạo bảng nếu chưa có), đăng ký trong `server/src/migrate.ts`.
- Kiểm: `server/src/tests/soNghiaVu.tests.ts` (đăng ký trong `run.ts` như `runSuaRa1228Tests`).

**Giao diện:** Tạo ra bảng
`nghia_vu(id INTEGER PK, loai TEXT CHECK(loai IN ('bai','viec')), kieu TEXT, khoa TEXT UNIQUE, chi_nhanh INT, lop INT, hoc_vien INT, nguoi INT, s_cheo INT DEFAULT 0, han_goc TEXT, han TEXT, xong_luc TEXT, nguoi_lam INT, khong_tinh TEXT, cap_nhat TEXT)`.
Chỉ mục: `(chi_nhanh, han)`, `(nguoi, han)`.

- [ ] Viết ca `NV-BANG`: sau migrate có bảng, có hai chỉ mục, `khoa` duy nhất (chèn trùng → lỗi).
- [ ] Chạy `npm run build:server && PISA_CHI_TEP=soNghiaVu node dist-server/server/src/tests/run.js` → FAIL.
- [ ] Viết bảng + migrate (chạy lặp không lỗi, khoá `demo_config` như các migrate khác).
- [ ] Chạy lại → PASS. Commit `nghia-vu: bảng + migrate`.

### Task 2: `tinhNghiaVu` (tính một dòng từ gốc) cho BÀI
**Tệp:** Tạo `server/src/phanTich/soNghiaVu.ts`. Kiểm: `soNghiaVu.tests.ts`.

**Giao diện:**
- Dùng: `skillCells`, `regularSkillViews`, `boMonTheoLuot` (giống `napBai` trong `giaoVien.ts`), `mocTreNhapDiem`, `kyNangPhuTrach`, phân công lúc hạn (lấy logic `nguoiLuc` ra thành hàm dùng chung, không chép), `laChamCheo`.
- Tạo ra:
  - `type DongNv = { loai: 'bai'|'viec'; kieu: string; khoa: string; chiNhanh: number; lop: number|null; hocVien: number|null; nguoi: number|null; sCheo: boolean; han: string; xongLuc: string|null; nguoiLam: number|null; khongTinh: string|null }`
  - `khoaBai(attemptId: number, skill: string): string` → `bai:<id>:<skill>`
  - `tinhBai(attemptId: number): DongNv[]` trả mọi ô bắt buộc của lượt.

Phép kiểm (mỗi ca một `check`):
- [ ] `NV-BAI-THUONG`: ô MT có phân công L → `nguoi` = GV L tại ngày hạn, `han` = mốc trễ.
- [ ] `NV-BAI-CHUA-PC`: không có phân công tại hạn → `nguoi = null`, `khongTinh = null` (vẫn đếm, nhãn Chưa phân công).
- [ ] `NV-BAI-SCHEO`: S Mock chưa nhập → `sCheo = true`, `nguoi = null`. Đã nhập kèm `examiner_user_id` → `nguoi` = người đó. Người ngoài (không tài khoản) → `khongTinh = 'nguoi-ngoai'`.
- [ ] `NV-BAI-MT0S`: S của MT0 lớp thường → `sCheo = true` (luật #1258; nếu #1258 chưa merge thì ca này `skip` có ghi lý do).
- [ ] `NV-BAI-KHONG-TINH`: vắng, "-", huỷ, chờ duyệt dời, em Lưu trữ trước hạn → `khongTinh` có mã. Em nghỉ **sau** hạn → vẫn tính.
- [ ] `NV-CHUYEN`: em chuyển lớp giữa kỳ → `lop` = lớp lúc thi.
- [ ] Chạy → FAIL. Viết `tinhBai`. Chạy → PASS. Commit.

### Task 3: `ghiSo` + upsert + gắn vào đường ghi BÀI
**Tệp:**
- Sửa `soNghiaVu.ts`.
- Gọi `ghiSo` ở: `server/src/fasttrack/attempts.ts` (`saveScore`, xoá điểm, xếp / dời / huỷ lịch, vắng), `server/src/normal/regular.ts` (`saveRegularScore`, lịch lớp thường), `server/src/classes/phanCongGv.ts` (đổi phân công), đổi trạng thái em / chuyển lớp (`server/src/students/*`, `server/src/classes/lenhChuyen.ts`).

**Giao diện:**
- `ghiSo(khoa: string): void`: tính lại, rồi upsert theo `khoa`.
  - Lần đầu: `han_goc = han`. Lần sau: giữ `han_goc` cũ.
  - Gốc không còn (lượt xoá) → `khong_tinh = 'da-xoa'`, không DELETE.
- `ghiSoLuot(attemptId: number): void`
- `ghiSoTheoLop(lop: number, tuNgay: string): void`: dùng khi đổi phân công / trạng thái em. Một câu chọn lượt, ghi theo lô.

- [ ] `NV-NHAP`: nhập điểm trước mốc → dòng `xong_luc` = ngày nhập, trạng thái Đúng hạn. Nhập sau mốc → Làm muộn.
- [ ] `NV-XOA`: xoá điểm → `xong_luc = null`.
- [ ] `NV-PC`: đổi phân công L từ tuần X → ô hạn < X giữ người cũ, ô hạn ≥ X sang người mới.
- [ ] `NV-HAN2`: dời lịch hai lần → `han_goc` = lần đầu, `han` = lần cuối.
- [ ] Mỗi đường ghi nêu trên có một ca: gọi API / hàm → dòng sổ đổi đúng.
- [ ] FAIL → viết → PASS. Commit.

### Task 4: `tinhViec` + `ghiSo` cho VIỆC
**Tệp:**
- Sửa `soNghiaVu.ts`. Tách các câu SQL ngày xong trong `viecDaXong.ts` thành hàm dùng chung theo khoá, không chép.
- Gọi `ghiSo` ở đường ghi: Case (`server/src/cases/cases.ts`: mô tả, xác nhận, PA, Kết quả PA, xoá Case / PA), Mini Test, Báo PH, bước tiếp (`server/src/loTrinh/buocTiep.ts`), bàn giao, xử lý vi phạm (`server/src/yThuc/*`), Phối hợp SOS, đặt lại hạn (`viec_han_lan`).

**Giao diện:**
- `khoaViec(kieu: string, id: number, phu?: string): string`, ví dụ `viec:xac_nhan_pa:<caseId>`, `viec:ket_qua_pa:<paId>:<ky>`.
- `tinhViec(khoa: string): DongNv | null`

Người giữ việc: dùng đúng hàm gán người của Công việc (`myWork` / `gvLop` trong `viecDaXong.ts`), không viết lại.

- [ ] Mỗi loại việc trong spec mục 1.1 một ca `NV-VIEC-<loai>`: tạo việc → dòng có hạn + người. Làm xong đúng hạn → Đúng hạn. Làm muộn → Làm muộn. Quá hạn chưa làm → Chưa làm.
- [ ] `NV-VIEC-RESET`: đặt lại hạn (dòng `viec_han_lan`) → `han_goc` = hạn cũ, `han` = hạn mới.
- [ ] `NV-VIEC-THIEU-NGAY`: việc xong không có ngày xong, hạn sau mốc → `khongTinh = 'thieu-ngay-xong'`. Hạn trước mốc → coi là Đúng hạn.
- [ ] FAIL → viết → PASS. Commit.

### Task 5: Hàm đếm (đọc sổ)
**Tệp:** Tạo `server/src/phanTich/demNghiaVu.ts`. Kiểm: `soNghiaVu.tests.ts`.

**Giao diện:**
- `type So3 = { dung: number; muon: number; chua: number }`
- `trangThai(d: { han: string; hanGoc: string; xongLuc: string|null }, homNay: string): 'dung'|'muon'|'chua'|'chua-toi'`. Áp `MOC_TINH_TRE` ở đây, chỉ ở đây.
- `demTheoNguoi(q: { chiNhanh: number|null; tu: string; den: string; loai: 'bai'|'viec'; homNay: string }): Map<number, So3>`.
  - `chiNhanh = null` → mọi chi nhánh, một người một dòng.
  - S chéo chưa ai nhận: cộng vào **mọi GV có kỹ năng S tại ngày hạn** ở chi nhánh của dòng (`user_skills` + vai GV).
- `dongCuaNguoi(q: { nguoi: number; chiNhanh: number|null; tu: string; den: string; loai: 'bai'|'viec'; homNay: string }): DongNvXem[]` (cho panel).
- `chuaPhanCong(chiNhanh: number, tu: string, den: string): DongNvXem[]`

- [ ] `NV-DEM`: 3 dòng (đúng, muộn, chưa) → So3 `{1,1,1}`. Dòng `chua-toi` / `khong_tinh` không đếm.
- [ ] `NV-MOC`: hạn gốc 2026-10-12 xong muộn → `dung`. Hạn gốc 2026-10-19 xong muộn → `muon`. Hạn gốc trước mốc, chưa xong → `chua`.
- [ ] `NV-SCHEO-CA-NHOM`: S chéo chưa ai, 3 GV có S → mỗi người `chua + 1`.
- [ ] `NV-SCHEO-NGAY`: GV bỏ kỹ năng S sau hạn → vẫn bị tính.
- [ ] `NV-TONG`: GV hai chi nhánh → `chiNhanh = null` ra một dòng = tổng hai chi nhánh.
- [ ] Trần đọc ở `tocDoDuong.ts`: `demTheoNguoi` một chi nhánh ≤ 2 câu.
- [ ] FAIL → viết → PASS. Commit.

### Task 6: Nạp cũ + đối chiếu đêm + bảng chênh lệch
**Tệp:**
- Tạo `server/src/migrate/prNghiaVuNap.ts`: dựng sổ từ đầu khoá hiện hành, theo lô, chạy lặp không nhân đôi.
- Tạo `server/src/ops/doiChieuSo.ts`: `doiChieuSo(homNay)` tính lại hạn trong 8 tuần gần nhất + mọi dòng Chưa làm. Dòng lệch → sửa + ghi bảng `nghia_vu_lech(khoa, truoc, sau, luc)`.
- Tạo `netlify/functions/doi-chieu-so.ts` (mẫu `chot-vang.ts`) + lịch trong `netlify.toml`: `schedule = "20 19 * * *"` (02:20 giờ Việt Nam).
- Tạo `server/src/ops/soSanhSo.ts`: lệnh `npm run so-sanh-so` in bảng từng người. Cột: cách cũ (`tapChamDiem` / `viecQuaHanMo` + `viecDaXong`) | sổ | chênh + lý do (theo `khong_tinh`, "chưa phân công", "S chéo cả nhóm", "mốc W4 OCT", "rơi kỳ").
- [ ] `NV-NAP`: seed → nạp → sổ = gọi `ghiSo` từng khoá (so toàn bộ).
- [ ] `NV-DOI-CHIEU`: sửa tay một dòng sổ sai → `doiChieuSo` sửa lại + có một dòng `nghia_vu_lech`.
- [ ] Chạy nạp + so sánh trên bản chép `mig.sqlite`. Ghi bảng chênh lệch (không tên thật: mã GV) vào `docs/superpowers/specs/2026-11-09-pt-dem-viec/chenh-lech.md`.
- [ ] Đo đọc Turso đối chiếu đêm (dòng / đêm). Ghi vào PR.
- [ ] Check đầy đủ (ô check-1 / check-2). Mở PR-1, nhắn PTA Plan kèm bảng chênh lệch. **Chủ SP duyệt bảng trước khi làm PR-2.**

## PR-2: giao diện đọc sổ (sau khi chủ SP duyệt bảng chênh lệch)

> **Cập nhật 10/11 (PTA, sau PR-1 #1270 — chủ SP "Duyệt" bảng chênh lệch 10/11).** PR-1 đã có: bảng, `ghiSo` cho BÀI ở mọi đường ghi, việc qua lượt Công việc + đối chiếu đêm, chuyển lớp (GV cũ / mới, hạn tính lại), S chéo theo kỹ năng tại ngày hạn (`user_skill_lich_su`), `sChung` tách riêng. PR-2 thêm (quyết định PTA 10/11, đã báo PT-DEM-VIEC):
> 1. **Task 7a — gắn `ghiSo` vào mọi đường ghi VIỆC** (Case / PA / Kết quả PA, Mini Test, Báo PH, bước tiếp, bàn giao, xử lý vi phạm, phối hợp) — số hằng ngày không trễ một đêm; đối chiếu đêm giữ làm lưới. Phép kiểm mỗi đường.
> 2. **Khoá việc = đơn vị làm việc thật như Công việc**, cùng khoá lúc mở và lúc xong: Bàn giao theo lệnh (lớp / môn / GV), Phối hợp SOS theo lớp, Xác nhận PA theo Case; việc theo em (Mô tả Case, Kết quả PA, Báo PH…) giữ theo em. Chạy lại `so-sanh-so`, ghi chênh vào PR.
> 3. **Hiển thị S chéo chung tách riêng** (chủ SP hỏi "làm kiểu gì?", PTA đề xuất, duyệt qua ảnh PR-2): 3 số riêng (Đúng hạn · Làm muộn · Chưa làm) KHÔNG cộng S chéo chưa ai nhận; dưới số Chưa làm của GV có S hiện dòng phụ nhỏ "+ n S chéo chung" (mọi GV S cùng chi nhánh cùng số); panel tab Chưa làm chia hai nhóm "Bài của bạn" / "S chéo chung · chưa ai nhận" (bấm mở thẳng lưới chấm). Tỉ lệ = 3 số riêng.
> 4. Nhãn "Chưa phân công" (QL thấy, đếm riêng theo chi nhánh) · cờ "phân công nhập sau" ở dòng panel · "hạn gốc …" khi khác hạn.
> 5. Ảnh cặp trước | sau 1440 + 375 (bảng Phân tích GV chi nhánh + Toàn bộ, panel 3 tab, hồ sơ GV, Tổng quan) → chủ SP duyệt trước merge.



### Task 7: Phân tích GV + hồ sơ GV + Tổng quan đọc sổ
**Tệp:**
- `server/src/phanTich/giaoVien.ts`: cột Chấm Test đúng hạn / Việc đúng hạn → `demTheoNguoi`. Ô / panel → `dongCuaNguoi`. "Toàn bộ chi nhánh" → `chiNhanh = null`.
- `chiSoHoSoGv`, `oChiSoHoSoGv` → cùng hàm.
- Tổng quan (chỗ nào dùng các tập cũ) → cùng hàm.
- Web: `web/src/modules/phanTich/PhanTichGiaoVien.tsx`, panel số (thành phần chung sau #1254) thêm 3 tab: Chưa làm · Làm muộn · Đúng hạn. Dòng "Chưa phân công" cho QL. "hạn gốc …" khi khác hạn.
- [ ] `NV-CUNG-SO`: cùng GV, cùng kỳ → bảng = panel = hồ sơ GV = Tổng quan.
- [ ] `NV-PANEL`: panel trả đủ 3 nhóm, "Chưa làm" đứng đầu, có `hanGoc` khi khác.
- [ ] Trần đọc mới ở `tocDoDuong.ts` (Phân tích GV một chi nhánh ≤ 2 câu cho phần đếm). Đo trước → sau.
- [ ] Ảnh trước | sau (seed) bảng + panel, 1440 + 375. Mở PR-2, nhắn PTA Plan. **Chủ SP duyệt ảnh.**

## PR-3: bỏ cách đếm cũ

### Task 8: Dọn
- [ ] Xoá phần đếm của `tapChamDiem`, `viecQuaHanMo`, `viecDaXong` (giữ hàm ngày xong dùng chung của Task 4).
- [ ] Phép kiểm cũ của các hàm này: chuyển sang `soNghiaVu.tests.ts` hoặc xoá kèm lý do trong PR.
- [ ] `npm run so-sanh-so` và lệnh tạm của Task 6: xoá nếu không còn cần.
- [ ] Check đầy đủ. Mở PR-3, nhắn PTA Plan.
