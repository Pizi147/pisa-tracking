# PR-CT · Chuyển lớp do Quản lý quyết + Bàn giao — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Dự án này chạy theo khối **Quy trình nhanh** bên dưới: tự code từng Task, không rà từng Task bằng subagent.

**Goal:** Mọi lần chuyển lớp (lớp thường kết thúc khoá · FT gộp/tách lớp, đổi lộ trình · chuyển một em giữa khoá) thành **lệnh chuyển lớp**
do **Quản lý** ra: em nào, lớp đích nào, **tuần bắt đầu** (từ tuần sau trở đi). Tới **Thứ Hai tuần bắt đầu** web tự thi hành bằng luật lộ
trình **đang có** (không đổi luật). GVCN **không** tự chuyển nữa, chỉ **Đề xuất chuyển lớp…** (thẻ Chờ duyệt). Có lệnh → **bàn giao**: GVBM
ghi một câu mỗi em cho môn mình (hạn 2 ngày), GVCN lớp cũ viết nhận xét chung và **Xác nhận bàn giao** (hạn 3 ngày, tính cả ngày ra lệnh);
quá hạn → **Báo lên** QL, lệnh **vẫn chạy đúng tuần**. Lớp thường tới hết tuần kết thúc mà còn em chưa có lệnh → **Báo lên**.
Bỏ thẻ "Quyết định Cuối khoá" (Q30-3): QL quyết ngay trong panel; em thiếu điểm Cuối khoá **không bị khoá dòng** (Q30-4).

**Architecture:** Luật thuần ở `shared/domain/chuyenLop.ts` (hướng, tuần chọn được, hạn bàn giao, chữ tóm tắt, kiểm dòng). Máy chủ một cửa
`server/src/classes/lenhChuyen.ts`: **ra / sửa / huỷ lệnh**, **thi hành đến hạn** (chạy lặp an toàn: cron sáng Thứ Hai cùng `chot-vang` + quét
khi đọc qua `nho()`), **bàn giao** (phiếu tự điền, dòng môn GVBM, xác nhận). Thi hành **gọi lại** `applyTransition` (cuối khoá, theo lô) và
`apDungMotDong` (giữa khoá) — **không đổi chữ ký** `apDungCaLop` / `apDungMotDong` (PR-LT2b móc `sauChuyenCuoiKhoa` vào hai hàm này). Hai
bảng mới `lenh_chuyen_lop` (có luôn cột phiếu bàn giao) + `ban_giao_mon`. Ba loại thẻ mới cắm vào giao kèo `loaiYeuCau.ts`. Không quyền mới:
ra lệnh = `class.edit` ở **lớp nguồn** (chỉ QL, QT có — `seed/data.ts:44-62`). Web: viết lại `TransitionPanel.tsx` (màn B, C, I),
`ChuyenLopPanel.tsx` (màn D), panel mới `BanGiaoPanel.tsx` (F, G, đọc bàn giao), dải A/E/H, việc H.
**Tech Stack:** TypeScript · React 18.3 + Vite 5 · Tailwind 3.4 · Express · better-sqlite3/libsql (Turso); phép kiểm `server/src/tests/*`
(harness `check()` của `run.ts`), chạy `npm run check`.
**Spec:** `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md`
- **§3.1f Q30-1…Q30-6 + "Planning tự quyết (theo Q30-1…4)"** — nguồn chính, đọc từng dòng.
- §3.2 **T5** (Tạo lớp một lệnh — "+ Mở lớp mới" dùng panel Tạo lớp), **T44** (rút quyền GVCN, "Đề xuất sửa"), **T54** (phần thẻ bỏ), **T66**
  (`<Han>`, tính cả ngày đầu), **T71** (màn Chuyển tiếp — nay là panel Chuyển lớp). §5.8 **M-04** (Case chờ QL duyệt đi theo em), **M-08** (vi phạm:
  hạn đặt lại từ ngày chuyển), **M-20** (LT ↔ RF = lộ trình mới). §5.5 (hộp Chờ duyệt, giao kèo `loaiYeuCau.ts`), §6.3–6.4, §7.3 (mã tuần), §7.5.
- Mockup **`thiet-ke/mockup/20-chuyen-lop-ban-giao.html`** màn A–I — **bám sát bố cục, chữ, lối vào ("Nằm ở")**. Học viên **không** học ca cố
  định: không thêm khái niệm ca. Tuần hiện mã `W2 OCT` (`tuanLich`); ngày chỉ cho hạn cụ thể (`hạn hết 02/10`) và nhật ký.
- Kế hoạch cùng đợt: `2026-09-30-pr-lt2b-cuoi-khoa.md` (+ mục "chốt 30/09" cuối file), `2026-09-30-pr-lt2a-giua-khoa.md`, `2026-09-30-pr-gv-ho-so-giao-vien.md`.

## Bảng điều hành

| Mục | Chốt |
|---|---|
| Mã PR · đợt · làn | **PR-CT** · đợt 5 · làn **D** · một PR, không draft, **không tự merge** |
| Nhánh · worktree | `pr-ct-chuyen-lop-ban-giao` · `.claude/worktrees/pr-ct-chuyen-lop-ban-giao` (từ `origin/main` @ 36be838e trở đi) |
| Cổng thử | API **4157** · Vite **5357** (song song: LT2a 4167/5367 · PR-GV 4177/5377 · LT2b 4187/5387; không dùng 4000/5173) |
| Model | **Opus 5.5 · XHigh** · phương án B: **Fable 5.1 · High** (đổi quyền + dữ liệu + thi hành theo lịch; chạy B thì đọc kỹ "Hướng dẫn riêng") |
| Người rà | **Opus 5.5**, rà **một lượt cuối đợt 5** — session code không tự rà |
| Subagent | chỉ khi buộc phải dùng: **cùng model, KHÔNG Haiku**. Commit ghi `Co-Authored-By` đúng **model thật** đang chạy |
| Migrate | **Có, chỉ cấu trúc, chạy lặp được** — `server/src/migrate/prCt.ts`, **một dòng gọi CUỐI** `migrate.ts` (sau mọi dòng của LT2a/LT2b đã merge): bảng `lenh_chuyen_lop`, `ban_giao_mon` + chỉ mục. Database **reset** trước deploy → **không** chuyển dữ liệu cũ, **không** lệnh chạy thử, không quyền mới |
| Skill | **`/ponytail lite` đầu phiên** (PR có giao diện; Task 1–7 vẫn viết theo thang ponytail). impeccable: **`layout`** ở Task 8 (panel cả lớp) và Task 10 (master–detail bàn giao) · **`clarify`** ở Task 8, 9, 11 (chữ nút/nhãn/dải) · **`adapt`** ở Task 11 (375 px) · **`audit`** + **`polish`** (sáng **và** tối) ở Task 13. Không `init`/`document`/`hooks on`. Trước PR: `/ponytail-review` |
| Phụ thuộc | 🛑 **PR-LT2b** cho cột **"Web gợi ý"** + chip "Quản lý cân nhắc" (`goiYCuoiKhoa`, `students[].cuoiKhoa`) và cột `lo_trinh_tiep_theo.quyet_*` — làm mọi phần khác trước; trước khi LT2b merge cột hiện **% Cuối khoá** từ `tyLeTong` có sẵn và "—" ở gợi ý. PR-DUYET, PR-YT4, PR-SOS, PR-MON, PR-KCK, PR-S4F đã merge |
| Không làm | Luật lộ trình (`luatDoiLop`, Case đi theo, MT tự tạo vào FT, LT ↔ RF) — **giữ nguyên** · luật Cuối khoá, PA bổ trợ, Mini Test, hộp Kết luận khoá, câu T49 nhập (→ **LT2b**) · KPI / số liệu theo GV (→ **PR-GV**) · khái niệm ca học · đổi Tạm dừng / Kết thúc học ở ⋮ hồ sơ HV (xem Câu 2) · chuyển dữ liệu cũ |

### Quy trình nhanh (bắt buộc)

- Tự code từng Task, **không** rà từng Task bằng subagent. Sau **mỗi** Task: `npm run check` **một lần, ở foreground** (không nền, không chồng)
  → xanh, số phép kiểm ≥ mốc B → commit `PR-CT (n): …`. Sập segfault → chạy lại **một** lần. Treo > 10 phút → quét `node … tests/run.js` còn
  sống (`Get-CimInstance Win32_Process | ? CommandLine -match 'tests.run.js'`), tắt hết, chạy lại một lần.
- Không chụp ảnh từng Task. Bấm thử theo vai + 375 px + **sáng và tối** **một lần** ở Task 13 (Playwright kênh Chrome; đăng nhập demo
  `POST /api/demo/session {userId}`: Quản trị **id 1** · QL **Nguyễn Khánh Vy id 2** · GVCN lớp thường = `coreTeacherOf('MB FOU 12')` · GVBM = GV
  phân công đúng môn · GVCN lớp mới = `coreTeacherOf(lớp đích)` — tra `tests/tocDo.run.ts:114`). Ảnh ở `thiet-ke/anh/pr-ct/`. Chạy song song:
  `PORT=4157` cho API, Vite tạm cổng 5357 proxy về 4157 (memory "máy chủ dev trong worktree").
- Không chạm Turso, không deploy, không `migrate` trên bản chính; dữ liệu thử chỉ ở DB demo trong worktree. Mã lệch hẳn kế hoạch → dừng, ghi
  Nhật ký, báo planning. Trước khi báo xong: tắt 4157/5357, quét `tests/run.js` treo, dọn file Playwright/Vite tạm.
- **Cổng gộp** (🛑 khi LT2a, LT2b, PR-GV merge; và ở Task 13): `git fetch origin && git merge origin/main` → gỡ theo bảng file chồng → `npm run check` → Nhật ký.

### File chồng và cách gỡ

| File | PR khác sửa | PR-CT sửa | Gỡ |
|---|---|---|---|
| `server/src/classes/luatLoTrinh.ts` | **LT2b**: một lời gọi `sauChuyenCuoiKhoa` trong `apDungCaLop` (sau bước 6) và `apDungMotDong` · **LT2a**: một dòng `taoBaiThuongMacDinh…` sau INSERT lộ trình lớp thường (3 chỗ) | **chỉ** `coTheChuyenLop` + `lopDichChoChuyen` + `xemChuyenLop` đổi `STUDENT_EDIT` → `CLASS_EDIT`. **Không** sửa thân `apDungMotDong`/`apDungCaLop`/`apDungBaoLuuCaLop` | khác khối → giữ cả hai. Chữ ký giữ nguyên → cổng (e) của LT2b không kích |
| `server/src/classes/transition.ts` | **LT2b**: `transitionPlan` thêm `students[].cuoiKhoa`; `kiemDongCuoiKhoa` trong `applyTransition` (Q30-4: bỏ phần khoá) | `transitionPlan` thêm `lenh`, `cheDo`, `tuanChon`, `tuanCuoiKhoa`/`tuanKetThuc`, `canEdit` theo lớp nguồn; `applyTransition` thêm tham số thứ ba `o?: { daDuyet?: true }` (chỉ bỏ `require_`) | giữ cả hai trường; LT2b merge trước → PR-CT đọc `students[].cuoiKhoa` cho cột gợi ý (🛑 Task 8) |
| `server/src/students/students.ts` `transferStudent` | — | quyền `STUDENT_EDIT` → `CLASS_EDIT` ở lớp nguồn (hàm giữ cho phép kiểm/seed) | — |
| `shared/domain/yeuCauDuyet.ts` :17, meta :37-49 · `server/src/duyet/loaiYeuCau.ts` | **LT2a**: `ke_hoach_bo_tro` · **LT2b**: `bao_len_mini_test`, `bao_len_cuoi_khoa` (không còn `quyet_dinh_cuoi_khoa` — Q30-3) | 3 khoá **cuối mảng** `de_xuat_chuyen_lop`, `bao_len_ban_giao`, `bao_len_chua_lenh` + 3 phần tử cuối `DINH_NGHIA_LOAI` | mảng một dòng → giữ mọi khoá, thứ tự theo merge |
| `server/src/duyet/deXuatSua.ts`, `web/src/modules/duyet/DeXuatSuaPanel.tsx` | — | bỏ trường `'lop'` (thay bằng loại riêng) | — |
| `server/src/worklist/mywork.ts` (`WorkGroupKey` :115, `GROUP_META`, khối 2c :548-583, 2d :585-624, `order` :1016) · `shared/domain/tongQuan.ts` `NHOM_CUA_LOAI` :36 | **LT2a**: bỏ `verify`, thêm `ke_hoach_bo_tro`, `phoi_hop` · **LT2b**: `mini_test`, chữ `next_step` có % | thêm khoá `ban_giao`; khối 2c đếm em **chưa có lệnh** + bắt đầu từ tuần Cuối khoá; 2d bỏ em đã có lệnh; khối mới 2e bàn giao | union khoá → giữ cả hai; 2c/2d: LT2b chỉ đổi chữ `reason` → giữ điều kiện PR-CT + chữ LT2b |
| `shared/domain/hocVienLop.ts` `mucMenuDongHocVien` :256-279 · `web/src/modules/classes/thaoTacDongHocVien.tsx` | **LT2a/LT2b**: mục `'mini-test'`, việc kế hoạch | `'chuyen-lop'` theo cờ QL; thêm `'de-xuat-chuyen-lop'` (GVCN) | giữ mọi mục |
| `shared/domain/quanLyHocVien.ts` :32-51 · `web/src/modules/students/StudentDetailPage.tsx` (⋮ :234-240, dải đầu trang) | **LT2a**: bỏ khối Xác minh :743 · **LT2b**: bảng Kết quả kiểm tra, hộp Kết luận khoá, Mini Test | mục ⋮ + **một** dải E ngay dưới dòng thông tin đầu trang | khác khối → giữ cả hai |
| `web/src/modules/classes/DauTrangLop.tsx` · `ClassOverviewPage.tsx` | **PR-GV**: tên GV thành link (`DauTrangLop.tsx:149,184`) | dải A/H dưới tên lớp; ⋮ "Chuyển nhiều em…" (FT); mở `BanGiaoPanel` qua `?viec=ban-giao` | khác dòng → giữ cả hai |
| `server/src/ops/chotVangDinhKy.ts`, `netlify/functions/chot-vang.ts` | — | thêm lời gọi `thiHanhLenhDenHan(ngay)` + trường `daChuyen` trong kết quả | — |
| `migrate.ts`, `schema.sql`, `tests/run.ts`, `tests/tocDoDuong.ts`, `seed/seed.ts`, `shared/domain/index.ts`, `nhatKy.ts`, `routes/index.ts`, `DEMO.md`, `CODE_MAP.md`, `TRIEN_KHAI.md` 11.3 | cả ba PR | **một** import + **một** dòng gọi **cuối** migrate; bảng mới **cuối** `schema.sql`; khối phép kiểm **cuối** `run.ts`; chỉ thêm dòng | giữ cả hai, thứ tự theo merge |

## Bảng Q — planning tự quyết (chủ sản phẩm gạch dòng nào không đồng ý)

| Mã | Quyết định | Vì sao |
|---|---|---|
| Q1 | Quyền ra/sửa/huỷ lệnh = `class.edit` ở **lớp nguồn** (QL chi nhánh lớp nguồn, QT). Không thêm quyền mới | `class.edit` hôm nay chỉ QL/QT có; không cần migrate quyền |
| Q2 | Một bảng `lenh_chuyen_lop` giữ luôn **phiếu bàn giao** (hạn, nhận xét chung, bản chụp tự điền, xác nhận); bảng `ban_giao_mon` cho dòng GVBM | một lệnh = một phiếu, không cần bảng thứ ba |
| Q3 | Hướng lưu: `len_lop · hoc_lai · fast_track · chuyen_lop · bao_luu · dung_hoc`. "Chuyển lớp FT" và "Đổi lộ trình" (màn I) đều lưu `chuyen_lop`: lộ trình theo lớp đích (M-20) — "Đổi lộ trình" chỉ lọc lớp đích khác lộ trình. Bỏ "Xếp sau"/"Chưa rõ" khỏi panel QL: **chưa quyết = chưa có lệnh** | Q30-4 chỉ có 4 loại lệnh |
| Q4 | `boi_canh`: panel cả lớp **lớp thường** = `cuoi-khoa` (thi hành qua `applyTransition` theo lô); panel một em, panel FT = `giua-khoa` (thi hành từng em qua `apDungMotDong`) | dùng lại đúng hai đường luật đang có |
| Q5 | Tuần bắt đầu = **Thứ Hai**, `> Thứ Hai tuần này` (không bao giờ tuần hiện tại). Hiệu lực chuyển = chính Thứ Hai đó, kể cả khi quét khi đọc chạy muộn | "không chuyển giữa tuần"; hành trình, hạn M-08 tính đúng tuần |
| Q6 | Sửa / huỷ lệnh: chỉ khi `trang_thai = 'cho'` **và** hôm nay `<` tuần bắt đầu. Sửa giữ hạn bàn giao cũ (tính từ ngày ra lệnh) và dòng GVBM đã ghi | bàn giao nói về em, không về lớp đích |
| Q7 | Em có lệnh `cho` thì **không** có lệnh thứ hai (chỉ mục duy nhất một phần); ra lệnh lại cho em đó = **sửa** lệnh cũ ("Gửi phần đã quyết trước, quyết nốt sau") | không chuyển đôi |
| Q8 | Thi hành: lúc chạy mà em **không còn** ghi danh `active` ở lớp nguồn (đã Tạm dừng, Kết thúc học…) → lệnh `huy`, lý do "Em không còn học lớp nguồn lúc thi hành" + báo QL ra lệnh. Luật từ chối dòng (lớp đích đã kết thúc…) → lệnh giữ `cho`, ghi `loi`, dải E/panel B hiện "Chưa chuyển được: {lỗi}" cho QL, lần quét sau thử lại | không mất lệnh, không chặn các em khác |
| Q9 | Người nhận Case khi chuyển = **người nhận gợi ý** (`nguoiNhanGoiY` — GV đúng môn → GVCN lớp đích); panel chỉ hiện, không chọn từng Case | mockup D, F chỉ đọc "người nhận gợi ý" |
| Q10 | "Lưu ý bàn giao" bắt buộc cũ (RB-3, panel một em) **thay** bằng phiếu bàn giao: nhận xét chung ≥ 15 ký tự bắt buộc khi Xác nhận | §3.1f thắng rulebook |
| Q11 | Hạn: GVBM `hanTheoNgay(ngayRaLenh, 2)`, GVCN `hanTheoNgay(ngayRaLenh, 3)`. Ngày ra lệnh của lệnh được **duyệt từ đề xuất** = ngày QL duyệt | T66, mockup C (30/09 → 01/10 · 02/10) |
| Q12 | Báo lên bàn giao: **một thẻ mỗi lớp nguồn** khi còn lệnh chưa xác nhận đã qua hạn GVCN (chủ thẻ = GVCN lớp nguồn, nút Nhắc). GVBM quá 2 ngày **không** Báo lên — GVCN thấy "chờ môn P" + Nhắc + Điền thay | một việc/lớp; mockup "GVCN quá hạn 3 ngày thì QL nhận Báo lên" |
| Q13 | "Tuần kết thúc" lớp thường = tuần học cuối (`startWeekStart + 7×(totalWeeks−1)`), khác tuần Cuối khoá. Dải A + việc QL **từ tuần Cuối khoá**; dải **đỏ** khi đã vào tuần kết thúc; **Báo lên** khi **hết** tuần kết thúc (`phase = 'finished'`) còn em chưa có lệnh (Q30-4 "hết tuần kết thúc" thắng chữ "tới" ở mockup A) | spec thắng mockup |
| Q14 | Đề xuất chuyển lớp: **chỉ GVCN** lớp đang học (`student.edit` ở lớp em — `teacherAllows` siết về GVCN). Thẻ `de_xuat_chuyen_lop`, Thông tin HV, 5 ngày. **Duyệt** = mở panel D điền sẵn (QL sửa lớp, tuần, target) → gửi = `POST /yeu-cau/:id/duyet` với `duLieu` → `khiDuyet` ra lệnh. Bỏ trường `'lop'` khỏi Đề xuất sửa | một luồng duyệt (hộp), một panel |
| Q15 | GV lớp đích **đọc** được phiếu (chỉ đọc) khi phiếu **đã xác nhận** hoặc lệnh đã chuyển; trước đó chỉ thấy dải "Sắp nhận n em" | mockup E, H |
| Q16 | Bảo lưu có phiếu bàn giao; Dừng học **không** có phiếu, không việc. Lệnh bảo lưu thi hành = `apDungBaoLuuCaLop` (+ `ngay_xem_lai`) | §3.1f |
| Q17 | Sau chuyển: dải "Đã chuyển" 14 ngày; khi xác nhận bàn giao ghi **một** sự kiện Hành trình `ref_table='lenh_chuyen_lop'` → bấm mở phiếu (không sửa INSERT hành trình của `apDungCaLop`) | không chạm khối LT2b |
| Q18 | Khác chi nhánh: QL chi nhánh **lớp nguồn** quyết; lúc ra lệnh báo "Sắp nhận" cho GVCN lớp đích + QL chi nhánh đích (thông báo trỏ hồ sơ lớp đích) | §3.1f |
| Q19 | Nhóm việc: khoá mới `ban_giao` thuộc nhóm hiển thị **Vận hành** có sẵn (`tongQuan.ts:36`) — mockup gọi "Lớp & vận hành" nhưng web không có nhóm tên đó | không thêm nhóm |
| Q20 | Câu T49 (kỳ vọng đầu ra BE/ELE lên FT) trong panel = **một dòng chỉ đọc** + link "Mở hồ sơ" (hộp Kết luận khoá của LT2b); không làm ô nhập thứ hai | một chỗ nhập |
| Q21 | Lớp FT bị rút hết em **không** tự kết thúc (QL dùng "Kết thúc lớp" ⋮ đã có); lớp thường giữ `dongLopNeuHet` như cũ | không đổi luật lớp |
| Q22 | Thi hành mỗi lượt tối đa **40 nhóm** (lớp nguồn × tuần × bối cảnh); phần còn lại lượt quét sau làm (`ponytail:` trần + đường nâng) | lời gọi Netlify có hạn giờ (`chanGiaoDichNeuSapHetGio`) |

## Global Constraints

- **Một nơi thi hành:** mọi chuyển lớp thật chỉ đi qua `thiHanhLenhDenHan`. Đường web cũ `POST /classes/:id/transition`, `POST /students/:id/transfer`
  **đổi nghĩa** thành *ra lệnh* (không chuyển ngay). `applyTransition`/`transferStudent` giữ làm hàm nội bộ (thi hành, phép kiểm, seed).
- **Luật lộ trình giữ nguyên:** không sửa `luatDoiLop`, `apDungMotDong`, `apDungCaLop`, `apDungBaoLuuCaLop`, `closeCasesOnProgrammeSwitch`,
  `chuyenCaseSangLoTrinh`, `banGiaoPaQuyChe`, `taoMtMacDinh*`. M-04, M-08, M-20 phải còn xanh sau thi hành (phép kiểm Task 4).
- **SQL:** chỉ `?` (db.ts cấm tham số đặt tên). Mọi câu ghi trong `tx()` (BEGIN IMMEDIATE; lồng = savepoint). `IN (…)` qua `theoLo`, ≤ 900 tham
  số; UNION ≤ 20 vế; ghi nhiều dòng bằng `chenNhieuDong` / `UPDATE … WHERE id IN (…)`. Ngày nghiệp vụ `demoToday()` / `useNgayNghiepVu().homNay`.
- **Quyền — phép kiểm PHỦ ĐỊNH cho mọi đường mới/đổi** (mỗi dòng ít nhất một phép 403):

  | Việc | Được | 403 |
  |---|---|---|
  | Xem panel cả lớp / một em (ghi) | QL, QT phạm vi lớp nguồn | GVCN, GVBM, QL chi nhánh khác |
  | Ra / sửa / huỷ lệnh | như trên | GVCN, GVBM, QL chi nhánh **đích** (khác nguồn) |
  | Đề xuất chuyển lớp | GVCN lớp em đang học | GVBM, GVCN lớp khác |
  | Duyệt đề xuất | `request.approve` (QL chi nhánh lớp nguồn, QT; QL tự gửi → tự duyệt, Q-D) | GVCN |
  | Ghi dòng môn | GVBM có phân công đúng môn (`kyNangGoiY(ct, mon)`) ở lớp nguồn · GVCN lớp nguồn (điền thay) | GVBM môn khác, GV lớp đích, QL (chỉ đọc) |
  | Xác nhận bàn giao / Nhắc GVBM | GVCN lớp nguồn | GVBM, GV lớp đích, QL |
  | Đọc phiếu | GV lớp nguồn, QL/QT phạm vi, GV lớp đích (Q15) | GV không dạy lớp nguồn/đích |
  Kiểm quyền theo **phân công ở lớp nguồn của lệnh**, không theo ghi danh hiện tại — sau khi em đã chuyển, GVCN cũ vẫn xác nhận được.
- **Chữ (clarify):** `Chuyển lớp cả lớp…` · `Chuyển nhiều em…` · `Chuyển lớp…` · `Đề xuất chuyển lớp…` · `Tiếp tục · n em` · `Gửi lệnh chuyển n em` ·
  `Ra lệnh chuyển` · `Huỷ lệnh` · `Bàn giao` · `Bàn giao môn {X}` · `Xác nhận bàn giao` · `Điền thay` · `Nhắc` · `Đọc bàn giao` · `Sắp chuyển` ·
  `Đã chuyển` · `Sắp nhận n em` · `Quản lý cân nhắc` · `Chưa chọn` · `GVBM chưa bàn giao` · `mới vào`. Tuần: `tuanLich` (`W2 OCT`); hạn: `<Han>`
  ("hạn hết 02/10"). Không mã thô (`cho`, `da_chuyen`, `cuoi-khoa`), không ISO trên màn.
- **Tinh tế (§7.5):** tầng 1 panel B = cột "Quản lý quyết định" + đếm cuối panel; phiếu F = danh sách em + trạng thái; dải = một dòng + tối đa
  một nút chính. Không card lồng card, cột thẳng, `tabular-nums`. Màu qua biến token (`KhungPanel`, `NhanTrangThai`, `ONgay`, `ChonNguoi`,
  `useLoiForm`, `<Han>`, `TheYeuCau`, `ToastHoanTac`) — không tự dựng thứ tương tự.
- **Phép kiểm:** `server/src/tests/prCt.tests.ts` (`runPrCtTests(t)`, đăng ký **cuối** `run.ts`). Phép kiểm cũ "GVCN chuyển lớp thành công"
  (`lenLop.tests.ts:599`, `prDuyet.tests.ts:439` nếu `who` là GVCN…) **sửa kỳ vọng thành 403**, không xoá; **tổng số phép kiểm không giảm**.
- **Tốc độ:** đường mới vào `tests/tocDoDuong.ts`, trần = `max(sau+10, ⌈sau×1.3⌉)` đo ngay sau khi thêm. Panel cả lớp và phiếu bàn giao: **số câu
  không tăng theo số em** (phép kiểm 8 em vs 30 em cùng số câu). Đường cũ tăng câu → Nhật ký; **không nâng trần cũ quá 30 %**.

## Hướng dẫn riêng cho model thực thi (bắt buộc đọc nếu chạy phương án B — Fable)

1. **Thi hành chạy lặp an toàn** — đúng khuôn này (đọc lệnh **trong** tx sau BEGIN IMMEDIATE; đánh dấu trước khi chuyển; mỗi nhóm một tx):
   ```ts
   /** Cron Thứ Hai (cùng chot-vang) + quét khi đọc (nho). Chạy 2 lần liền → lần 2 không làm gì. */
   export function thiHanhLenhDenHan(homNay = demoToday()): { daChuyen: number; huy: number; loi: number } {
     const kq = { daChuyen: 0, huy: 0, loi: 0 };
     const conn = db();
     /* Một câu rẻ NGOÀI tx: đường đọc không xin khoá ghi khi không có gì đến hạn. */
     const nhom = conn.prepare(
       `SELECT DISTINCT lop_nguon_id, tuan_bat_dau, boi_canh FROM lenh_chuyen_lop
         WHERE trang_thai = 'cho' AND tuan_bat_dau <= ? ORDER BY tuan_bat_dau, lop_nguon_id LIMIT ?`,
     ).all(homNay, NHOM_TOI_DA) as any[];   // ponytail: 40 nhóm/lượt (Q22), lượt quét sau làm tiếp
     for (const g of nhom) {
       try {
         tx(() => {
           /* ĐỌC LẠI trong tx: lượt song song đã làm xong thì ở đây ra 0 dòng. */
           const ds = conn.prepare(
             `SELECT l.*, e.id AS enr_id FROM lenh_chuyen_lop l
                LEFT JOIN enrollments e ON e.student_id = l.student_id AND e.class_id = l.lop_nguon_id AND e.status = 'active'
               WHERE l.trang_thai = 'cho' AND l.lop_nguon_id = ? AND l.tuan_bat_dau = ? AND l.boi_canh = ?`,
           ).all(g.lop_nguon_id, g.tuan_bat_dau, g.boi_canh) as any[];
           if (!ds.length) return;
           const mat = ds.filter((l) => !l.enr_id), con = ds.filter((l) => l.enr_id);
           if (mat.length) kq.huy += huyHeThong(mat, 'Em không còn học lớp nguồn lúc thi hành');   // Q8, một UPDATE … IN (…)
           if (!con.length) return;
           danhDau(con.map((l) => l.id), 'da_chuyen', nowIso());   // UPDATE … WHERE id IN (…) AND trang_thai = 'cho'
           const p = loadPrincipal(con[0].nguoi_ra_lenh);          // người ra lệnh = tác giả nhật ký
           const loiDong = g.boi_canh === 'cuoi-khoa'
             ? thiHanhCuoiKhoa(p, g, con)   // applyTransition(p, {fromClassId, effectiveDate: g.tuan_bat_dau, dongs}, { daDuyet: true }).failed
             : thiHanhGiuaKhoa(p, g, con);  // từng em: apDungMotDong(… nguoiNhan: nguoiNhanGoiY …) | apDungBaoLuuCaLop | setStudentStatus('finished')
           if (loiDong.length) traVeCho(loiDong);   // Q8: lệnh lỗi luật về 'cho' + cột loi — không chặn em khác
           kq.daChuyen += con.length - loiDong.length;
         });
       } catch (e) {
         kq.loi += 1;
         ghiLoiNhom(g, e);   // UPDATE loi ngoài tx đã cuộn lại; console.error('[chuyen-lop]', …)
       }
     }
     return kq;
   }
   ```
   - `thiHanhGiuaKhoa`: mỗi em (hiếm — ngoại lệ per-em được phép như S17) gọi `apDungMotDong` với `ngay = tuan_bat_dau`, `lyDo`, `mucTieu`/`thangThi`,
     `nguoiNhan` = `nguoiNhanGoiY(caseMo, lop_dich_id)` (bỏ giá trị null), `boiCanh 'giua-khoa'`; rồi `dongLopNeuHet([lop_nguon_id], ngay)` **một lần** cuối nhóm.
     KCK (**cả hai nhánh**, vì `apDungMotDong`/`apDungCaLop` chỉ nhận target số): lớp đích FT và `khong_cam_ket = 1` → sau khi mở lộ trình gọi đường sửa
     target đang có (`reviseTarget(p, cycleId, { newTarget: 'KCK' })`, Q29-1) trong cùng tx, không tự chế cột. Phép kiểm: em vào FT với KCK không có kỳ vọng MT.
   - Quét khi đọc: `nho(\`thi-hanh-lenh:${homNay}\`, () => thiHanhLenhDenHan(homNay))` ở **5 đường**: `/my-work`, `/tong-quan/quan-ly`, hồ sơ HV
     (`/students/:id`), hồ sơ lớp (`/classes/:id` tổng quan), `/classes/:id/transition`. Mỗi đường +1 câu khi không có gì đến hạn.
   - Cron: `chotVangDinhKy` gọi thêm `thiHanhLenhDenHan(ngay)` **sau** `settleNoShows`, bọc `try` riêng (lỗi chuyển lớp không làm hỏng chốt vắng);
     `KetQuaChotVang` thêm `daChuyen`. **Không** đổi `LICH_CHOT_VANG` (phép kiểm so `netlify.toml`). `TRIEN_KHAI.md` 11.3 thêm một câu.
2. **Quyền** — dùng đúng các hàm này, không rải `can()` mới khắp nơi:
   ```ts
   export const coTheRaLenh = (p: Principal, lopNguonId: number) => can(p, PERMISSIONS.CLASS_EDIT, { classId: lopNguonId });
   /** Phân công ĐANG hiệu lực ở lớp nguồn — không dùng student.edit (QL cũng có). */
   function phanCongO(conn: any, userId: number, classId: number): { gvcn: boolean; kyNang: Set<string> }   // một câu
   export function quyenBanGiao(p: Principal, l: { lop_nguon_id: number; lop_dich_id: number | null; ct: string | null }, mon?: string) {
     const pc = phanCongO(db(), p.userId, l.lop_nguon_id);
     const ghiMon = !!mon && (pc.gvcn || kyNangGoiY(l.ct, mon).some((k) => pc.kyNang.has(k)));   // Pre FOU tong_hop → [] → chỉ GVCN
     return { ghiMon, xacNhan: pc.gvcn, doc: pc.gvcn || pc.kyNang.size > 0 || can(p, PERMISSIONS.STUDENT_VIEW, { classId: l.lop_nguon_id })
       || (!!l.lop_dich_id && laGvLop(p.userId, l.lop_dich_id)) };   // lớp đích: thêm điều kiện đã xác nhận/đã chuyển (Q15)
   }
   ```
3. **Không đổi chữ ký** `apDungCaLop` / `apDungMotDong` (LT2b móc vào). `applyTransition` chỉ thêm tham số thứ ba tuỳ chọn.
4. **Chỉ mục chống chuyển đôi:** `CREATE UNIQUE INDEX ux_lenh_cho_hv ON lenh_chuyen_lop(student_id) WHERE trang_thai = 'cho'` — ra lệnh lần hai cho em
   đó = `UPDATE` lệnh đang chờ, không `INSERT`.
5. 🛑 Dừng hỏi planning nếu: (a) phải sửa thân `apDungMotDong`/`apDungCaLop`; (b) trần `/my-work`, `/yeu-cau?hop=cho-duyet`, `/classes/:id/transition`
   tăng > 30 %; (c) LT2b merge mà `goiYCuoiKhoa`/`students[].cuoiKhoa` khác tên kế hoạch LT2b; (d) phải sửa `permissions.ts`.

---

## Task 0 · Chuẩn bị

- [ ] Worktree `.claude/worktrees/pr-ct-chuyen-lop-ban-giao` từ `origin/main`; gõ `/ponytail lite`. `npm ci` (nếu cần) → `npm run check` → ghi **mốc B**
  (số phép kiểm) vào Nhật ký. Ghi LT2a / LT2b / PR-GV đã merge chưa (`git log origin/main --oneline -12`).
- [ ] Đọc: đặc tả §3.1f; mockup 20 (mở bằng trình duyệt, xem cả sáng/tối); `transition.ts`, `luatLoTrinh.ts`, `loTrinhTiep.ts`, `students.ts:135-235`,
  `duyet/loaiYeuCau.ts`, `duyet/yeuCau.ts:60-110, 200-250`, `worklist/mywork.ts:548-624`, `ops/chotVangDinhKy.ts`, `TransitionPanel.tsx`, `ChuyenLopPanel.tsx`,
  `DauTrangLop.tsx`, `StudentManagePanel.tsx`, `TheYeuCau.tsx:80-210`.
- [ ] Commit `PR-CT (0): kế hoạch + mốc {B} phép kiểm`.

## Task 1 · Luật thuần `shared/domain/chuyenLop.ts`

**Files:** tạo `shared/domain/chuyenLop.ts` + export ở `shared/domain/index.ts` · tạo `server/src/tests/prCt.tests.ts` + đăng ký cuối `run.ts`.

```ts
export const HUONG_LENH = ['len_lop', 'hoc_lai', 'fast_track', 'chuyen_lop', 'bao_luu', 'dung_hoc'] as const;
export type HuongLenh = (typeof HUONG_LENH)[number];
export type TrangThaiLenh = 'cho' | 'da_chuyen' | 'huy';
export const LY_DO_TOI_THIEU = 3;  export const NHAN_XET_TOI_THIEU = 15;
/** Thứ Hai hợp lệ để bắt đầu: > Thứ Hai tuần này. Trả n tuần kế tiếp cho ô chọn (mặc định 6) — nhãn qua tuanLich. */
export function tuanChonDuoc(homNay: string, n = 6): string[];
export function tuanHopLe(tuan: string, homNay: string): boolean;          // là Thứ Hai và > mondayOf(homNay)
export function hanBanGiao(ngayRaLenh: string): { gvbm: string; gvcn: string };   // hanTheoNgay(…, 2) / (…, 3)
export function coPhieu(h: HuongLenh): boolean;                            // mọi hướng trừ dung_hoc (Q16)
export function canLopDich(h: HuongLenh): boolean;                         // trừ bao_luu, dung_hoc
/** Kiểm MỘT dòng trước khi ghi — câu lỗi tiếng Việt hoặc null. Lên FT (lớp nguồn thường → đích FT): Target (số 0–9 bước .5 hoặc KCK) bắt buộc. */
export function kiemDongLenh(d: { huong: HuongLenh | null; lopDichId: number | null; lopDichFt: boolean; nguonFt: boolean;
  tuan: string | null; homNay: string; lyDo: string | null; khacGoiY: boolean; mucTieu: number | 'KCK' | null; ngayXemLai: string | null }): string | null;
/** Câu tóm tắt màn C — một câu mỗi nhóm (hướng × lớp đích × tuần), liệt kê tên em; "Chưa gửi: …" cho em chưa quyết. */
export function tomTatLenh(ds: readonly DongTomTat[], homNay: string): string[];
/** Trạng thái phiếu một em: 'chua-lam' | 'mon' (n/m) | 'da-xac-nhan' — cho danh sách trái màn F. */
export function trangThaiPhieu(x: { soMonDaGhi: number; soMon: number; daXacNhan: boolean }): { khoa: string; nhan: string };
```
- [ ] Luật `kiemDongLenh`: thiếu hướng → "Chọn hướng cho em"; cần lớp đích mà thiếu → "Chọn lớp đích"; tuần không hợp lệ → "Tuần bắt đầu phải từ tuần
  sau trở đi"; `khacGoiY` hoặc hướng `chuyen_lop`/`bao_luu`/`dung_hoc` mà lý do < 3 ký tự → "Ghi lý do ngắn"; lên FT thiếu target → "Ghi Target (hoặc
  KCK)"; bảo lưu thiếu `ngayXemLai` → "Chọn tuần xem lại". **Không** có nhánh "thiếu điểm Cuối khoá" (Q30-4).
- [ ] **Phép kiểm trước** (khối 1, ≥ 14 phép): `tuanChonDuoc` từ Thứ Hai / Chủ nhật / Thứ Tư (không bao giờ ra tuần hiện tại) · `tuanHopLe` ngày không phải
  Thứ Hai → false · `hanBanGiao('2026-09-30')` = `{ gvbm: '2026-10-01', gvcn: '2026-10-02' }` · `kiemDongLenh` mỗi nhánh + dòng thiếu điểm Cuối khoá vẫn
  null · `tomTatLenh` ra đúng 5 câu mockup C (4 lên BE · 1 lên FT · 1 học lại · 1 bảo lưu · "Chưa gửi") · `trangThaiPhieu` 3 nhánh.
- [ ] `npm run check` → commit `PR-CT (1): luật thuần lệnh chuyển lớp — tuần, hạn bàn giao, kiểm dòng, tóm tắt`.

## Task 2 · Migrate `prCt.ts` + `schema.sql`

**Files:** tạo `server/src/migrate/prCt.ts` · `server/src/migrate.ts` (một import + `migratePrCt(conn, applied);` **cuối** danh sách) · `schema.sql`
(**cuối file**) · bao đóng xoá HV (PR-XOA) + danh sách cột trỏ tài khoản · `shared/domain/nhatKy.ts`.

- [ ] `migratePrCt` (`CREATE … IF NOT EXISTS`; `applied.push` chỉ khi có bảng mới; **không** UPDATE dữ liệu):
  ```sql
  CREATE TABLE IF NOT EXISTS lenh_chuyen_lop (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    lop_nguon_id INTEGER NOT NULL REFERENCES classes(id),
    lop_dich_id INTEGER REFERENCES classes(id),             -- NULL: bao_luu, dung_hoc
    huong TEXT NOT NULL,                                    -- HUONG_LENH
    boi_canh TEXT NOT NULL,                                 -- 'cuoi-khoa' | 'giua-khoa' (Q4)
    tuan_bat_dau TEXT NOT NULL,                             -- Thứ Hai ISO (Q5)
    muc_tieu REAL, khong_cam_ket INTEGER NOT NULL DEFAULT 0, ngay_thi TEXT, ngay_xem_lai TEXT,
    ly_do TEXT, khac_goi_y INTEGER NOT NULL DEFAULT 0,
    nguoi_ra_lenh INTEGER NOT NULL REFERENCES users(id), ngay_ra_lenh TEXT NOT NULL,
    tu_yeu_cau_id INTEGER REFERENCES yeu_cau_duyet(id),     -- lệnh sinh từ Đề xuất chuyển lớp
    trang_thai TEXT NOT NULL DEFAULT 'cho',                 -- cho | da_chuyen | huy
    thi_hanh_luc TEXT, loi TEXT,
    huy_boi INTEGER REFERENCES users(id), huy_luc TEXT, ly_do_huy TEXT,
    han_gvbm TEXT, han_gvcn TEXT,                           -- NULL khi dung_hoc (không phiếu)
    nhan_xet_chung TEXT, tu_dien TEXT,                      -- tu_dien: JSON chụp phần tự điền lúc xác nhận
    xac_nhan_boi INTEGER REFERENCES users(id), xac_nhan_luc TEXT,
    tao_luc TEXT NOT NULL, sua_luc TEXT);
  CREATE UNIQUE INDEX IF NOT EXISTS ux_lenh_cho_hv ON lenh_chuyen_lop(student_id) WHERE trang_thai = 'cho';
  CREATE INDEX IF NOT EXISTS ix_lenh_den_han ON lenh_chuyen_lop(trang_thai, tuan_bat_dau);
  CREATE INDEX IF NOT EXISTS ix_lenh_nguon ON lenh_chuyen_lop(lop_nguon_id, trang_thai);
  CREATE INDEX IF NOT EXISTS ix_lenh_dich ON lenh_chuyen_lop(lop_dich_id, trang_thai);
  CREATE TABLE IF NOT EXISTS ban_giao_mon (
    id INTEGER PRIMARY KEY,
    lenh_id INTEGER NOT NULL REFERENCES lenh_chuyen_lop(id),
    mon TEXT NOT NULL,                                      -- ô môn của lớp nguồn (boMonLich)
    noi_dung TEXT NOT NULL,
    nguoi_ghi INTEGER NOT NULL REFERENCES users(id), dien_thay INTEGER NOT NULL DEFAULT 0, ghi_luc TEXT NOT NULL,
    UNIQUE (lenh_id, mon));
  ```
- [ ] Nhãn nhật ký: `lenh_chuyen.tao`, `lenh_chuyen.sua`, `lenh_chuyen.huy`, `lenh_chuyen.thi_hanh`, `ban_giao.ghi_mon`, `ban_giao.xac_nhan`
  (phép kiểm "mã nhật ký nào cũng có nhãn" xanh). Bao đóng xoá HV có hai bảng; cột trỏ tài khoản có `nguoi_ra_lenh`, `huy_boi`, `xac_nhan_boi`, `nguoi_ghi`.
- [ ] Phép kiểm (khối 2): migrate hai lần → lần hai `applied` rỗng · DB mới (`schema.sql`) và DB migrate cùng cột · chỉ mục chặn lệnh `cho` thứ hai
  của cùng em · `UNIQUE (lenh_id, mon)`.
- [ ] `npm run check` → commit `PR-CT (2): migrate cấu trúc — bảng lệnh chuyển lớp và dòng bàn giao môn`.

## Task 3 · Ra / sửa / huỷ lệnh + đổi quyền (Q30-1)

**Files:** tạo `server/src/classes/lenhChuyen.ts` · `classes/transition.ts` · `classes/luatLoTrinh.ts` (`coTheChuyenLop`, `lopDichChoChuyen`,
`xemChuyenLop`: `STUDENT_EDIT` → `CLASS_EDIT`) · `students/students.ts` (`transferStudent` → `CLASS_EDIT`) · `classes/loTrinhTiep.ts` (`lopHocCua`
`quyen.chuyenLop` = `coTheRaLenh`; thêm `quyen.deXuatChuyenLop` = GVCN) · `routes/index.ts`.

```ts
export type DongLenhVao = { studentId: number; huong: HuongLenh; toClassId?: number | null; tuan?: string | null;
  mucTieu?: number | 'KCK' | null; ngayThi?: string | null; lyDo?: string | null; khacGoiY?: boolean; ngayXemLai?: string | null };
/** Panel cả lớp (B/I) và panel một em (D) đều gọi — một tx, dòng lỗi vào `failed`, dòng đúng INSERT/UPDATE theo lô. */
export function raLenh(p: Principal, v: { lopNguonId: number; boiCanh: 'cuoi-khoa' | 'giua-khoa'; tuanChung: string | null;
  dongs: DongLenhVao[]; tuYeuCauId?: number | null }): { ok: number[]; failed: { studentId: number; message: string }[] };
export function suaLenh(p: Principal, id: number, v: Partial<DongLenhVao>): void;
export function huyLenh(p: Principal, id: number, lyDo: string): void;
```
- [ ] `raLenh`: `require_(coTheRaLenh)` ở lớp nguồn · tập em hợp lệ = ghi danh `active` ở lớp nguồn (như `applyTransition` :212-225) · lớp đích đọc **theo
  lô** (`status='active'`, khác nguồn) · mỗi dòng `kiemDongLenh` · em đã có lệnh `cho` → UPDATE (Q7), chưa có → `chenNhieuDong` · `ngay_ra_lenh = demoToday()`,
  `han_*` = `hanBanGiao` (trừ `dung_hoc`) · `boi_canh` do route quyết (Q4) · nhật ký `lenh_chuyen.tao` **một dòng cho cả lô** · thông báo **Sắp nhận**
  (Q18): GVCN lớp đích + QL chi nhánh đích nếu khác chi nhánh, **một** thông báo mỗi lớp đích (`dedupKey sap_nhan:{lopDich}:{ngay}`), trỏ `/hoc-vien/lop/{id}`.
  Lệnh sinh từ đề xuất: `tu_yeu_cau_id`.
- [ ] `suaLenh`/`huyLenh`: `trang_thai='cho'` **và** `demoToday() < tuan_bat_dau` (Q6), ngược lại 400 "Lệnh đã tới tuần bắt đầu — không sửa được";
  `UPDATE … WHERE id = ? AND trang_thai = 'cho'` (0 dòng → 409 "Lệnh vừa được thi hành"). Huỷ: lý do ≥ 3 ký tự, báo GVCN lớp nguồn + lớp đích.
- [ ] Routes: `POST /classes/:id/transition` → `raLenh(… boiCanh: lớp thường ? 'cuoi-khoa' : 'giua-khoa')` · `POST /students/:id/transfer` → `raLenh`
  một dòng, `giua-khoa` · `PATCH /lenh-chuyen/:id` · `POST /lenh-chuyen/:id/huy`. Giữ tên đường cũ để web cũ không gãy giữa chừng.
- [ ] `transitionPlan` (chỉ thêm, **một** câu đọc lệnh cho cả lớp): `students[].lenh` (lệnh `cho`/lỗi gần nhất của em ở lớp này), `cheDo: 'thuong' | 'ft'`,
  `tuanChon` (`tuanChonDuoc`), `tuanCuoiKhoa` (= `finalWeekStart`), `tuanKetThuc` (tuần học cuối — Q13; giữ trường cũ `tuanKetThuc` → đổi tên cũ thành
  `tuanCuoiKhoa` và sửa chỗ đọc ở web), `canEdit = coTheRaLenh`. FT: `students[].ketQua` giữ (MT gần nhất), `candidates` = lớp FT còn chạy **mọi lộ trình**.
- [ ] Phép kiểm (khối 3): QL ra lệnh 8 em → 7 dòng (1 "Chưa chọn" không gửi) · dòng thiếu điểm Cuối khoá vẫn ghi · ra lại cho em có lệnh → sửa, không
  dòng thứ hai · tuần hiện tại → failed · **403**: GVCN lớp nguồn, GVBM, QL chi nhánh khác, QL chi nhánh **đích** · `transferStudent`/`applyTransition`
  bởi GVCN → 403 (sửa kỳ vọng `lenLop.tests.ts:599` …) · sửa/huỷ sau tuần bắt đầu → 400 · huỷ hai lần → 409 · thông báo Sắp nhận một cái mỗi lớp đích.
- [ ] `npm run check` → commit `PR-CT (3): ra/sửa/huỷ lệnh chuyển lớp — chỉ Quản lý lớp nguồn; GVCN hết tự chuyển`.

## Task 4 · Thi hành theo tuần (cron Thứ Hai + quét khi đọc)

**Files:** `classes/lenhChuyen.ts` (`thiHanhLenhDenHan` — khuôn ở Hướng dẫn 1) · `classes/transition.ts` (`applyTransition(p, input, o?)`) ·
`ops/chotVangDinhKy.ts` · `netlify/functions/chot-vang.ts` (log `daChuyen`) · 5 đường đọc (Hướng dẫn 1) · `TRIEN_KHAI.md` 11.3 (một câu).

- [ ] Viết đúng khuôn: đọc trong tx, đánh dấu `da_chuyen` trước, `huyHeThong` (Q8), `traVeCho` lệnh lỗi luật + `loi`, mỗi nhóm một tx, `NHOM_TOI_DA = 40`.
  `thiHanhCuoiKhoa` dựng `dongs` cho `applyTransition` (`huong`, `toClassId`, `mucTieu`, `thangThi`, `lyDo`, `ngayXemLai`); `failed` → `traVeCho`.
  Thông báo người ra lệnh khi có `huy`/`loi` (dedup theo lệnh).
- [ ] Phép kiểm (khối 4, **mỗi mục một phép**): chưa tới tuần → không làm gì, **0 tx mở** · tới Thứ Hai → chuyển, `da_chuyen`, ngày ghi danh = Thứ Hai ·
  gọi **hai lần** → lần hai 0 · gọi lúc Thứ Tư (quét khi đọc muộn) → ngày hiệu lực vẫn Thứ Hai · em đã Kết thúc học trước → lệnh `huy` · lớp đích bị kết
  thúc trước Thứ Hai → lệnh `cho` + `loi`, em khác cùng nhóm vẫn chuyển · lớp thường 8 em cuối khoá (lên BE, lên FT có MT1–MT3, học lại, bảo lưu, dừng)
  → đúng luật cũ + `dongLopNeuHet` · FT tách 2 em (giữa khoá, cùng lộ trình) → Case đi theo, người nhận = gợi ý (M-04 thẻ Không cần theo dõi đi theo) ·
  LT → RF → lộ trình mới, MT từ MT1 (M-20) · vi phạm: hạn 5 ngày đặt lại từ Thứ Hai chuyển (M-08) · em thiếu điểm Cuối khoá chuyển được (Q30-4) ·
  `chotVangDinhKy` trả `daChuyen`, lỗi chuyển lớp không làm hỏng `daChot` · nhóm thứ 41 để lượt sau.
- [ ] `tocDoDuong.ts`: đo lại 5 đường có quét (mỗi đường +1 câu) — ghi Nhật ký.
- [ ] `npm run check` → commit `PR-CT (4): thi hành lệnh đúng Thứ Hai tuần bắt đầu — cron + quét khi đọc, chạy lặp an toàn`.

## Task 5 · Bàn giao — phiếu, dòng môn, xác nhận

**Files:** `classes/lenhChuyen.ts` · `routes/index.ts` · `worklist/nhac*` (nếu `nhacViec` chỉ cho QL: thêm nhánh GVCN lớp nguồn cho khoá `ban_giao_mon:`).

```ts
/** Màn F/G: mọi lệnh có phiếu của một lớp nguồn (hoặc một lệnh). ≤ 8 câu cho cả lớp — không hỏi lại theo em. */
export function phieuBanGiao(p: Principal, f: { lopNguonId?: number; lenhId?: number; mon?: string }): PhieuBanGiaoDto;
export function ghiMon(p: Principal, lenhId: number, mon: string, noiDung: string): void;      // UPSERT ON CONFLICT(lenh_id, mon)
export function xacNhanBanGiao(p: Principal, lenhId: number, nhanXetChung: string): void;
```
- [ ] Phần **tự điền (chỉ đọc)** đọc theo lô: kết quả gần nhất (`standingFor(sids)` — FT: MT gần nhất; lớp thường: `% Cuối khoá · từng môn`, sau LT2b đọc
  `cuoiKhoaTheoHocVien`), Case/PA đang mở + người nhận gợi ý (`nguoiNhanGoiY` theo lớp đích — **một** lần mỗi lớp đích), Ý thức (`trangThaiYThuc(sids)`:
  bậc, vi phạm chờ xử lý), việc còn dở (bài chưa làm như `transitionPlan` :74-81). Môn = `boMonLich(ctNguon)`; GVBM môn = phân công `kyNangGoiY(ct, mon)`.
- [ ] `ghiMon`: `quyenBanGiao().ghiMon`, 1–300 ký tự, `dien_thay = !laGvbmMon`; lệnh `huy` → 400. `xacNhanBanGiao`: GVCN lớp nguồn, nhận xét ≥ 15 ký tự
  (`NHAN_XET_TOI_THIEU`), chụp `tu_dien` (JSON phần tự điền + tên GVBM môn chưa ghi = "GVBM chưa bàn giao"), ghi `xac_nhan_*`, **một** sự kiện Hành trình
  `ref_table='lenh_chuyen_lop'` (Q17), báo GVCN lớp đích "Đã có bàn giao · {em}". Xác nhận được cả **sau** khi lệnh đã chuyển (lệnh vẫn chạy đúng tuần).
- [ ] `POST /lenh-chuyen/:id/nhac {mon}` (GVCN lớp nguồn) → thông báo GVBM môn đó, dedup một lần/ngày.
- [ ] Routes: `GET /lenh-chuyen/ban-giao?lop=&mon=` · `GET /lenh-chuyen/:id/ban-giao` · `PUT /lenh-chuyen/:id/ban-giao-mon` · `POST /lenh-chuyen/:id/xac-nhan`.
- [ ] Phép kiểm (khối 5): GVBM P ghi P được, ghi R → 403 · GVCN điền thay → `dien_thay 1` · GV lớp đích đọc trước xác nhận → 403, sau → 200, ghi → 403 ·
  QL đọc 200, ghi 403 · xác nhận nhận xét 14 ký tự → 400 · xác nhận sau khi đã chuyển → 200 · môn chưa ghi hiện "GVBM chưa bàn giao" trong bản chụp ·
  Pre FOU chỉ một môn "Tổng hợp", chỉ GVCN ghi · **số câu `GET …?lop=` 8 em = 30 em**.
- [ ] `npm run check` → commit `PR-CT (5): bàn giao — phiếu tự điền, dòng môn GVBM, GVCN xác nhận`.

## Task 6 · Việc, Báo lên, Đề xuất chuyển lớp

**Files:** `worklist/mywork.ts` · `shared/domain/tongQuan.ts` (`NHOM_CUA_LOAI`: `ban_giao` → `van-hanh`) · `shared/domain/yeuCauDuyet.ts` ·
`duyet/loaiYeuCau.ts` · `duyet/deXuatSua.ts` · `classes/lenhChuyen.ts` (`guiDeXuatChuyenLop`) · `routes/index.ts` (`POST /students/:id/de-xuat-chuyen-lop`).

- [ ] **Việc (khối 2e mới, nhóm `ban_giao`, `<Han>` loại `viec-van-hanh`):** GVCN lớp nguồn — **một** việc mỗi lớp nguồn có lệnh (không `huy`, có phiếu, chưa
  xác nhận): `Bàn giao n em · {lớp}` (n = 1 → `Bàn giao {tên em} → {lớp đích}`), chữ phụ `GVCN · a/n đã xác nhận · chờ môn P`, hạn = `min(han_gvcn)`, key
  `ban_giao:{lop}`, href `/hoc-vien/lop/{lop}?viec=ban-giao`. GVBM — **một** việc mỗi (lớp, môn) còn em chưa ghi: `Bàn giao môn {X} · {lớp}`, `GVBM · a/n em`,
  hạn `min(han_gvbm)`, key `ban_giao_mon:{lop}:{mon}`, href `…?viec=ban-giao&mon={mon}`. Đọc **một câu** lệnh + một câu dòng môn cho mọi lớp của người xem.
- [ ] **Khối 2c (QL):** đếm em **chưa có lệnh `cho`** (không phải `canXepLop`); hiện từ **tuần Cuối khoá** (Q13); chữ `n em chưa có lệnh chuyển`, `Chuyển lớp cả lớp`.
  **Khối 2d (GVCN):** bỏ em đã có lệnh `cho` khỏi `demChuaLoTrinh`.
- [ ] **Loại thẻ** (3 khoá cuối `LOAI_YEU_CAU`, 3 phần tử cuối `DINH_NGHIA_LOAI`):
  - `de_xuat_chuyen_lop` `{ phanLoai: 'thong-tin-hv', nhan: 'Đề xuất chuyển lớp', kieuNut: 'duyet-tu-choi', hanNgay: 5, hangLoat: false }` — `khiDuyet(p, yc, { duLieu })`
    kiểm `duLieu` (lớp đích, tuần, target nếu sang FT) rồi `raLenh(p, { …, tuYeuCauId: yc.id })`; `chet`: em không còn học / đã có lệnh `cho` từ đường khác;
    `moTa`: `Đề xuất chuyển lớp · {lớp đề xuất hoặc "chưa chọn lớp"} · từ {W2 OCT}` / `{GVCN} (dd/mm): "lý do"`, `neuDuyet: 'Mở panel ra lệnh — sửa được lớp, tuần.'`,
    `duLieu: { moPanelChuyenLop: true, lopDichId, tuan }`.
  - `bao_len_ban_giao` `{ phanLoai: 'bao-len', nhan: 'Bàn giao quá hạn', kieuNut: 'nhac', hanNgay: null }` — `quet`: lớp nguồn có lệnh `han_gvcn < homNay`, chưa xác
    nhận, không `huy` → một thẻ `doi_tuong_loai 'lop:ban-giao'`, `ownerId` = GVCN lớp nguồn, `viecKey ban_giao:{lop}` (Q12); `chet` SQL: không còn lệnh như vậy.
  - `bao_len_chua_lenh` `{ …, nhan: 'Lớp hết khoá còn em chưa có lệnh', kieuNut: 'nhac' }` — `quet`: lớp thường `phase='finished'` (đọc tiến độ theo lô
    `classProgressMany`) còn em `active` không có lệnh `cho` → một thẻ `lop:chua-lenh`, `ownerId null`, `mo` = `/hoc-vien/lop/{id}?viec=chuyen-tiep`; `chet`: hết em như vậy.
  Không có gì để tạo/đóng → **không** mở tx.
- [ ] `guiDeXuatChuyenLop(p, sid, { toClassId?, tuan?, lyDo })`: `require_(STUDENT_EDIT, { classId: lớp em })` (GVCN), lý do ≥ 15 ký tự, `taoYeuCau` trong tx;
  đã có thẻ chờ → 400 "Đã có một đề xuất chuyển lớp của em đang chờ Quản lý". `deXuatSua.ts`: bỏ `'lop'` khỏi `TRUONG_DE_XUAT` (400 "Dùng Đề xuất chuyển lớp").
- [ ] Phép kiểm (khối 6): GVCN 1 việc cho 7 em · GVBM 1 việc/môn · việc biến mất khi xác nhận / ghi đủ · lệnh `huy` → việc và thẻ tự đóng · thẻ Báo lên bàn giao
  sinh đúng ngày thứ 4, một thẻ/lớp, đóng khi xác nhận · Báo lên chưa lệnh sinh khi hết tuần kết thúc, đóng khi đủ lệnh · đề xuất: GVBM → 403, GVCN lớp khác
  → 403 · duyệt với `duLieu` sửa lớp/tuần → lệnh đúng giá trị QL sửa + thẻ `duyet` · QL tự gửi → "tự duyệt" · `quetYeuCau` không có gì → 0 tx.
- [ ] `tocDoDuong.ts`: đo lại `/my-work` (mọi vai), `/yeu-cau?hop=cho-duyet`; thêm `/lenh-chuyen/ban-giao?lop={lopThuong}` (QL, GVCN_THUONG).
- [ ] `npm run check` → commit `PR-CT (6): việc bàn giao gộp theo lớp, Báo lên quá hạn/chưa lệnh, Đề xuất chuyển lớp`.

## Task 7 · Dữ liệu dải cho hồ sơ lớp và hồ sơ HV

**Files:** `classes/lenhChuyen.ts` (`daiLop`, `daiHocVien`) · `classes/classes.ts` (hồ sơ lớp :760-780) · `students/profile.ts` (hồ sơ HV) · `tocDoDuong.ts`.

- [ ] `daiLop(p, classId)` (≤ 3 câu): phía **nguồn** — `{ ketThucKhoa: { tuanCuoiKhoa, tuanKetThuc, soChuaLenh, do: đã vào tuần kết thúc, lopKeGoiY }, banGiao: { daXacNhan, tong,
  hanGvcn }, banGiaoMon: { mon, daGhi, tong, han } | null (người xem là GVBM) }`; phía **đích** — `sapNhan: { n, tuLop[], tuan, daXacNhan }`; mọi vai thấy
  dải, **nút** theo quyền (`coTheRaLenh`, `quyenBanGiao`). Viewer thêm `coTheRaLenh`, `coTheChuyenNhieuEm` (FT).
- [ ] `daiHocVien(p, sid)` (≤ 2 câu): lệnh `cho` (hoặc `da_chuyen` ≤ 14 ngày — Q17): `{ loai: 'sap' | 'da', lopDich, tuan, nguoiRaLenh, ngayRaLenh, banGiao: { mon, tong,
  hanGvcn, daXacNhan, nguoiXacNhan, ngayXacNhan }, loi, nut: 'ban-giao' | 'ban-giao-mon' | 'huy-lenh' | 'doc-ban-giao' | null, mon }` — chỉ mọi GV của em + QL (Q15).
- [ ] Phép kiểm (khối 7): dải lớp nguồn 3 dạng (chưa lệnh · bàn giao 2/7 · GVBM môn P 2/7) · lớp đích "Sắp nhận 4 em" · hồ sơ HV `sap` → `da` → hết sau 14 ngày ·
  GVCN không có nút Huỷ lệnh · QL không có nút Bàn giao.
- [ ] `tocDoDuong.ts`: đo hồ sơ lớp nguồn/đích, hồ sơ HV có lệnh — ghi Nhật ký, ≤ 30 %.
- [ ] `npm run check` → commit `PR-CT (7): dữ liệu dải Chuyển lớp / Bàn giao / Sắp nhận cho hồ sơ lớp và hồ sơ HV`.

## Task 8 · Web — panel Chuyển lớp cả lớp (màn B, C, I) — impeccable **`layout`** + **`clarify`**

**Files:** `web/src/modules/classes/TransitionPanel.tsx` (viết lại theo mockup) · `ClassOverviewPage.tsx` · `DauTrangLop.tsx` (⋮ FT "Chuyển nhiều em…").

- [ ] `KhungPanel rong="toan" longTrong`, tiêu đề `Chuyển lớp · {lớp} · n em`, bước `1 Soạn › 2 Xác nhận`, ô **Tuần bắt đầu chung** (`tuanChon`, nhãn `tuanLich`).
- [ ] **Bước 1 (B):** thanh chọn nhiều `n em đang chọn · [Lên BE | Lên FT | Học lại | Bảo lưu | Dừng học] · lớp đích · Áp cho n em`. Bảng: `Học viên | Cuối khoá | Web gợi ý |
  Quản lý quyết định | Lớp đích | Tuần bắt đầu`. Cột Cuối khoá: `%` đậm + `n/4 môn đạt` hoặc `Không đạt: P` (tên môn `tenMonNgan`); thiếu điểm → `—` + `Chưa có điểm P ·
  cập nhật sau` (**không khoá**). Quyết định: phân đoạn `Lên {bậc kế} · Lên FT · Học lại · Khác ▾` (Khác = Bảo lưu, Dừng học); dòng mở thêm theo hướng: Lên FT → Target
  (nhận KCK) + Thi dự kiến (`ONgay` tháng) + lộ trình theo lớp đích; khác gợi ý → **Lý do** bắt buộc; Bảo lưu → lý do + `Xem lại {tuần}`; chữ phụ sau chuyển
  (`Web tự tạo PA bổ trợ miễn phí P + Mini Test ở lớp mới`, `Web tạo việc "Báo phụ huynh qua TVV" cho Quản lý` — lấy từ `goiY` LT2b, 🛑). Lớp đích: chọn +
  `+ Mở lớp mới` (panel Tạo lớp có sẵn — T5). Tuần: `(chung)` hoặc chọn riêng. Chân panel: đếm theo nhóm (`Lên BE · MB BE 04  4` …, `Chưa quyết n`), câu nhắc
  "Gửi phần đã quyết trước, quyết nốt sau. Tới hết tuần kết thúc ({W1 OCT}) …", nút `Tiếp tục · n em`. Em đã có lệnh → điền sẵn từ `lenh`, dòng có nút
  `Huỷ lệnh`; lệnh `loi` → chữ đỏ `Chưa chuyển được: …`.
- [ ] 🛑 **Cột Web gợi ý + chip "Quản lý cân nhắc":** chờ LT2b merge — đọc `students[].cuoiKhoa.goiY.nhan/nhanNgan/canQl`; 50–59 % hiện chip `Quản lý cân nhắc` và
  dòng phải chọn trước khi gửi (không có mặc định). Trước khi LT2b merge: cột hiện `—`, không gợi ý mặc định, ghi Nhật ký. Chọn khác `huong` gợi ý → `khacGoiY`.
- [ ] **Bước 2 (C):** các câu `tomTatLenh` + câu "Sau khi gửi: GVCN {tên} có việc **Bàn giao n em** · <Han> … GVBM có việc Bàn giao môn, <Han>. GVCN lớp mới được báo."
  Nút `‹ Sửa` / `Gửi lệnh chuyển n em` → `POST /classes/:id/transition`; kết quả `failed` hiện ngay tại dòng (`useLoiForm`), `ToastHoanTac` không dùng (lệnh sửa/huỷ được).
- [ ] **Màn I (FT):** cùng panel `cheDo='ft'`: cột `Kết quả gần nhất` (MT gần nhất · kỳ vọng · `Không đạt: W` / `KCK không tính SOS`), không cột Cuối khoá/gợi ý; quyết định
  `Chuyển lớp FT | Đổi lộ trình | Bảo lưu | Dừng học`; Đổi lộ trình lọc lớp đích khác lộ trình + chữ `LT ↔ RF = mở lộ trình mới, MT đánh lại từ MT1`. Mở từ ⋮ lớp FT
  `Chuyển nhiều em…` (chỉ `coTheRaLenh`). Em không chọn gì = ở lại lớp.
- [ ] Câu T49 (Q20): dòng BE/ELE chọn Lên FT → một dòng chỉ đọc `Kỳ vọng đầu ra: {Đạt · Không đạt · chưa đánh dấu}` + link `Mở hồ sơ` (🛑 LT2b `cuoiKhoa.ketLuanFt`).
- [ ] Điện thoại: bảng → thẻ mỗi em (giữ `DongThe` cũ làm khung). `npm run check` → commit `PR-CT (8): panel Chuyển lớp cả lớp — Soạn/Xác nhận, lớp thường và FT`.

## Task 9 · Web — Chuyển một em + Đề xuất (màn D) + thẻ Chờ duyệt — impeccable **`clarify`**

**Files:** `web/src/modules/students/ChuyenLopPanel.tsx` (viết lại) · `StudentManagePanel.tsx` · `shared/domain/quanLyHocVien.ts` (`de-xuat-chuyen-lop`,
nhãn `Đề xuất chuyển lớp…`) · `shared/domain/hocVienLop.ts` `mucMenuDongHocVien` + `thaoTacDongHocVien.tsx` (cờ `coTheRaLenh`, `coTheDeXuatChuyenLop`) ·
`web/src/modules/duyet/TheYeuCau.tsx` (nhánh `duLieu.moPanelChuyenLop`) · `DeXuatSuaPanel.tsx` (bỏ "Lớp").

- [ ] **QL (`Chuyển lớp…`):** dòng `Đang học {lớp} · {lộ trình} · tuần học a/b · MT2 xong, MT3 {tuần}` · `Lớp đích` (mọi chi nhánh — `lopDichChoChuyen`; nhãn
  `{lớp} · {lộ trình} · tuần học a/b · n em`) · `Tuần bắt đầu` phân đoạn 3 tuần + `Tuần khác…` · `Lý do (bắt buộc)` · khối **Khi chuyển, web sẽ** (từ `xemChuyenLop.luat`:
  giữ/mở lộ trình, bài chưa làm đi theo hay ở lại, `n Case đang mở đi theo em, người nhận gợi ý: …`; lên FT: Target + Thi dự kiến) · chân `GVCN {lớp} bàn giao, <Han>` +
  `Ra lệnh chuyển`. Em đã có lệnh → panel mở ở chế độ sửa + `Huỷ lệnh`. Mockup ghi "MT3 dời theo lịch MB FT 103": luật hiện chỉ **chuyển lượt chưa làm
  sang lớp mới** khi giữ khoá (Q12 cũ), không dời tuần thi → chữ lấy từ `luat` (`Bài chưa làm đi theo em`), **không** hứa dời lịch.
- [ ] **GVCN (`Đề xuất chuyển lớp…`):** `Lớp muốn chuyển tới (tuỳ chọn)` · `Từ tuần (tuỳ chọn)` · `Lý do (bắt buộc)` · câu "Gửi thành thẻ trong Chờ duyệt của Quản lý
  (loại Thông tin HV, hạn 5 ngày). Quản lý duyệt = ra lệnh chuyển; Quản lý được sửa lớp và tuần trước khi duyệt." · `Gửi đề xuất`.
- [ ] **Thẻ `de_xuat_chuyen_lop`:** nút `Duyệt` → mở `ChuyenLopPanel` chế độ QL điền sẵn (`duLieu.lopDichId`, `tuan`); nút chính panel `Duyệt và ra lệnh` → `POST /yeu-cau/:id/duyet
  { duLieu }`. `Từ chối…` như mọi thẻ. Menu dòng học viên và ⋮ hồ sơ HV: QL thấy `Chuyển lớp…`, GVCN thấy `Đề xuất chuyển lớp…`, GVBM không thấy mục nào.
- [ ] `npm run check` → commit `PR-CT (9): chuyển một em — Quản lý ra lệnh, GVCN đề xuất, duyệt mở đúng panel`.

## Task 10 · Web — Bàn giao (màn F, G, đọc bàn giao) — impeccable **`layout`** (master–detail)

**Files:** tạo `web/src/modules/classes/BanGiaoPanel.tsx` · `ClassOverviewPage.tsx` (`?viec=ban-giao[&mon=]`) · `StudentManagePanel.tsx` (mở thẳng em).

- [ ] **F (GVCN):** `KhungPanel rong="toan"`, tiêu đề `Bàn giao · {lớp}` + chữ phụ `n em · a/n đã xác nhận · <Han>`. Trái (280 px): mỗi em `tên · trạng thái phiếu
  (Đã xác nhận / Môn 3/4 / Chưa làm) · → {lớp đích} · {tuần}` (bảo lưu: `Bảo lưu · xem lại {tuần}`); bàn phím ↑/↓. Phải: tiêu đề em + chip `Chờ môn P`; khối **Web
  tự điền · chỉ đọc** (lưới `kv`: Cuối khoá/Kết quả · Case đang mở · Ý thức · Việc còn dở); khối **Thông tin bàn giao của GVBM · mỗi môn một câu** (`môn | câu — tên,
  ngày ✓` hoặc `Chưa có · {GVBM}, <Han> [Nhắc] [Điền thay]`); **Nhận xét chung của GVCN (bắt buộc)** textarea; chân: "Xác nhận được khi đủ nhận xét chung. Môn chưa
  có thông tin sẽ ghi "GVBM chưa bàn giao"." + `Xác nhận bàn giao`. Dưới 820 px: danh sách trên, chi tiết dưới.
- [ ] **G (GVBM):** `Bàn giao môn {X} ({tên môn đủ})` · `{lớp} · n em · <Han> · mỗi em một câu`; bảng `Học viên | Cuối khoá {X} | Thông tin bàn giao` với ô chữ
  "Viết một câu…", **lưu khi rời ô** (`PUT …/ban-giao-mon`, lỗi hiện tại ô); chân `Lưu từng dòng khi rời ô · a/n đã có` + `Xong`. Mở từ hồ sơ HV → cuộn tới em đó.
- [ ] **Đọc bàn giao** (GV lớp mới, QL, sau xác nhận): cùng panel chế độ chỉ đọc, dùng `tu_dien` đã chụp + dòng môn + nhận xét chung + `Xác nhận bởi {tên} · dd/mm`.
- [ ] `npm run check` → commit `PR-CT (10): panel Bàn giao — GVCN master–detail, GVBM một câu mỗi em, đọc bàn giao`.

## Task 11 · Web — dải A, E, H + Việc + Hành trình — impeccable **`clarify`** + **`adapt`** (375 px)

**Files:** `DauTrangLop.tsx` (dải dưới tên lớp) · `StudentDetailPage.tsx` (dải E ngay dưới dòng thông tin đầu trang) · `WorkList.tsx`/`NhomViec.tsx` (chỉ nếu
cần chữ phụ hai dòng) · Hành trình (mục `ref_table='lenh_chuyen_lop'` → nút `Đọc bàn giao`) · `worklist/Highlights.tsx:100` (link `?viec=chuyen-tiep` cho QL).

- [ ] **A (lớp nguồn):** QL: `Kết thúc khoá · Cuối khoá xong tuần {W4 SEP} · n em chưa có lệnh chuyển · lớp kế tiếp nên bắt đầu {W2 OCT}` + `Chuyển lớp cả lớp…`; GVCN/GVBM:
  `Chờ Quản lý quyết định chuyển lớp · n em` (không nút); sau lệnh: GVCN `Bàn giao · a/n em` (bấm mở F), GVBM `Bàn giao môn P · a/n em` (mở G); đã vào tuần kết thúc còn em
  chưa lệnh → dải màu `bad` (token). Lớp FT: dải chỉ khi có lệnh (bàn giao).
- [ ] **E (hồ sơ HV):** `Sắp chuyển · Sang {lớp} từ {W2 OCT} · lệnh của {QL} ngày dd/mm · Bàn giao: đã có 3/4 môn · <Han>` + nút theo vai (`Bàn giao` · `Bàn giao môn R` ·
  `Huỷ lệnh` · `Đọc bàn giao`); `loi` → `Chưa chuyển được: …` (QL). Sau chuyển 14 ngày: `Đã chuyển · Từ {lớp} tuần {W2 OCT} · bàn giao của {GVCN}, xác nhận dd/mm` + `Đọc bàn giao`.
- [ ] **H (lớp đích):** `Sắp nhận n em từ {lớp} vào lớp từ {W2 OCT} · bàn giao a/n đã xác nhận` + `Xem`; tuần đầu em hiện nhãn nhỏ `mới vào` trong danh sách lớp.
- [ ] **Việc (H):** hai loại việc Task 6 hiện đúng chữ mockup trong nhóm **Vận hành** (Q19); mở đúng panel qua `href`.
- [ ] `adapt` 375 px: dải xuống hai dòng, nút một hàng; bảng panel B/G thành thẻ; F thành danh sách → chi tiết. `npm run check` → commit
  `PR-CT (11): dải Chuyển lớp/Bàn giao/Sắp nhận, việc Bàn giao, Hành trình — 375 px`.

## Task 12 · Dữ liệu demo `server/src/seed/ctSeed.ts` + `DEMO.md`

**Files:** tạo `server/src/seed/ctSeed.ts` (gọi ở `seed.ts` **sau** mọi seed có sẵn và sau seed LT2a/LT2b nếu đã merge) · `DEMO.md` (một mục "Chuyển lớp & Bàn giao").

- [ ] Dựng **qua hàm dịch vụ** (`taoLopVaPhanCong`, `saveRegularScore`, `raLenh`, `ghiMon`, `xacNhanBanGiao`, `guiDeXuatChuyenLop`, `thiHanhLenhDenHan`), chỉnh ngày bằng SQL
  (`ngay_ra_lenh`, `han_*`, `tuan_bat_dau`) khi cần. Ngày demo `2026-09-14`. Sáu kịch bản, mỗi kịch bản ghi tên lớp/em trong `DEMO.md`:
  1. Lớp FOU **đã hết tuần kết thúc, chưa ra lệnh** (6 em: đủ 4 dải + 1 thiếu điểm P) → dải đỏ, việc QL, thẻ **Báo lên** "Lớp hết khoá còn em chưa có lệnh".
  2. Lớp FOU có lệnh **đang chờ bàn giao**: 4 em lên BE, ra lệnh hôm qua, **GVBM 3/4 môn** đã ghi (thiếu P), GVCN chưa xác nhận → việc GVCN + việc GVBM P.
  3. Trong (2): một em **thiếu điểm Cuối khoá** vẫn có lệnh (dòng `Chưa có điểm P · cập nhật sau`).
  4. Lớp FT **tách 2 em** sang lớp FT khác từ tuần sau (một em có Case mở → người nhận gợi ý).
  5. **GVCN đề xuất chuyển một em** → thẻ `Đề xuất chuyển lớp` trong Chờ duyệt QL.
  6. **Bàn giao quá hạn**: lệnh ra 4 ngày trước, chưa xác nhận → thẻ **Báo lên** "Bàn giao quá hạn".
  Thêm một lệnh **đã chuyển** Thứ Hai tuần này, bàn giao đã xác nhận → dải "Đã chuyển" + "Đọc bàn giao" + lớp đích có em "mới vào".
- [ ] Phép kiểm (khối 8): seed chạy hai lần không nhân đôi; đủ 6 kịch bản (đếm lệnh/thẻ/việc). `npm run check` → commit `PR-CT (12): demo chuyển lớp và bàn giao — 6 kịch bản`.

## Task 13 · Bấm thử theo vai, 375, sáng/tối — impeccable **`audit`** + **`polish`**, `/ponytail-review`

- [ ] 🛑 Cổng gộp `origin/main` mới nhất (LT2a, LT2b, PR-GV nếu đã merge) → gỡ theo bảng → nối cột Web gợi ý (Task 8) nếu LT2b đã merge → `npm run check`.
- [ ] Chạy mục **KIỂM** (dưới) theo vai QL, GVCN lớp cũ, GVBM, GVCN lớp mới, Quản trị; mỗi màn A–I ở 1440 và 375, **sáng và tối**; ảnh `thiet-ke/anh/pr-ct/{màn}-{vai}-{1440|375}-{sang|toi}.png`.
- [ ] `audit` (a11y, tương phản ≥ 4.5:1 cả hai chế độ, focus, bàn phím ↑/↓ danh sách F) → `polish` một lượt. `/ponytail-review` → sửa → liệt kê chú thích `ponytail:`.
- [ ] Mô tả PR: mỗi mục Q30-1…Q30-6 phần PR-CT → ảnh → đạt/không; "tầng 1 của màn này là: …" cho B, D, F, G; bảng Q; bảng "Chuyển cho PR khác"; phép kiểm trước/sau; trần tốc độ đổi.
- [ ] Tắt 4157/5357, quét `tests/run.js` treo, dọn file tạm. Commit `PR-CT (13): bấm thử theo vai, ảnh, polish`. Mở PR (không merge).

---

## Câu hỏi cho chủ sản phẩm (đang theo khuyến nghị — đổi thì báo planning)

- **Câu 1 — GVCN lớp cũ nghỉ / lớp không có GVCN: ai xác nhận bàn giao?** A. **QL được "Điền thay" và "Xác nhận thay" khi đã quá hạn 3 ngày** (ghi "QL xác nhận thay",
  thẻ Báo lên tự đóng) · B. Chỉ GVCN (thẻ Báo lên treo tới khi phân công GVCN mới). **Khuyến nghị A.** Kế hoạch đang viết theo B (đúng chữ §3.1f) — chọn A thì
  thêm một nhánh quyền ở `quyenBanGiao` + một phép kiểm.
- **Câu 2 — "Tạm dừng" / "Kết thúc học" ở ⋮ hồ sơ HV (GVCN đang làm được, hiệu lực ngay):** A. **Giữ như cũ** — không phải chuyển lớp · B. Chuyển thành lệnh do QL ra
  (như Bảo lưu / Dừng học trong panel). **Khuyến nghị A**; kế hoạch theo A.

## Chuyển cho PR khác (ghi vào thân PR)

| Việc | PR nhận | Giao kèo PR-CT để lại |
|---|---|---|
| Nối cột "Web gợi ý" + chip "Quản lý cân nhắc" nếu PR-CT merge **trước** LT2b | **LT2b** (cổng gộp) | `TransitionPanel` đọc `students[].cuoiKhoa?.goiY` — thiếu thì hiện `—` |
| Ghi `lo_trinh_tiep_theo.quyet_boi/quyet_luc` khi thi hành lệnh 50–59 % | **LT2b** | `applyTransition` vẫn upsert `lo_trinh_tiep_theo` như cũ; người ra lệnh ở `lenh_chuyen_lop.nguoi_ra_lenh` |
| Số liệu theo GV có "bàn giao đúng hạn" (nếu chủ sản phẩm muốn) | **PR-GV** | `lenh_chuyen_lop.han_gvcn/xac_nhan_luc`, `ban_giao_mon.ghi_luc` |
| Mã tuần ở mọi màn còn lại (Q30-6) | **PR-UXF** | PR-CT chỉ đổi màn mình chạm |
| Tổng quan theo vai (khối "Sắp chuyển lớp") | **PR-VAI** | `daiLop`, việc `ban_giao` |

## KIỂM — kịch bản bấm thử theo màn A–I

| # | Vai | Màn · Nằm ở | Bấm | Mong đợi |
|---|---|---|---|---|
| 1 | QL | **A** · hồ sơ lớp FOU kịch bản 1, dải dưới tên | xem | dải đỏ, `n em chưa có lệnh chuyển`, nút `Chuyển lớp cả lớp…`; Chờ duyệt có thẻ Báo lên "Lớp hết khoá…" |
| 2 | GVCN lớp đó | A | xem | `Chờ Quản lý quyết định chuyển lớp · n em`, **không** nút; ⋮ lớp không có "Chuyển lớp cả lớp…" |
| 3 | QL | **B** · bấm nút ở A | chọn 4 em → `Lên BE` → lớp đích → `Áp cho 4 em`; một em Lên FT (Target KCK), một em Học lại (tuần riêng), một Bảo lưu | đếm chân panel đúng; chọn khác gợi ý bắt ghi lý do; em thiếu điểm P **không** khoá; 50–59 % có chip `Quản lý cân nhắc` (🛑 LT2b); `Tiếp tục · 7 em` |
| 4 | QL | **C** · `Tiếp tục` | đọc, `Gửi lệnh chuyển 7 em` | 5 câu tóm tắt + "Sau khi gửi…" với hạn 2/3 ngày; tuần chỉ từ tuần sau; dải A đổi thành bàn giao |
| 5 | QL | B | mở lại panel | em đã có lệnh điền sẵn; `Huỷ lệnh` một em → biến mất khỏi việc GVCN |
| 6 | QL | **D** · hồ sơ HV FT ⋮ `Chuyển lớp…` | chọn lớp FT khác, tuần, lý do → `Ra lệnh chuyển` | khối "Khi chuyển, web sẽ" đúng luật (giữ lộ trình / Case đi theo, người nhận gợi ý); dải E hiện |
| 7 | GVCN | D · ⋮ `Đề xuất chuyển lớp…` | gửi (lý do < 15 ký tự báo lỗi tại ô) | thẻ trong Chờ duyệt QL (Thông tin HV, 5 ngày); GVBM không thấy mục |
| 8 | QL | Chờ duyệt · thẻ Đề xuất chuyển lớp | `Duyệt` → panel D điền sẵn → đổi tuần → `Duyệt và ra lệnh` | thẻ Đã duyệt; lệnh theo tuần QL sửa |
| 9 | GVBM P | **H** · Công việc › Việc của tôi (nhóm Vận hành) | `Bàn giao môn P · {lớp}` | mở **G**; gõ một câu, rời ô → lưu; `a/n đã có` tăng; ghi môn R → không có ô |
| 10 | GVCN lớp cũ | **H** · việc `Bàn giao 7 em · {lớp}` | mở **F** | danh sách trái đúng trạng thái; `Nhắc` / `Điền thay` môn P; nhận xét < 15 ký tự không xác nhận; `Xác nhận bàn giao` → Đã xác nhận |
| 11 | GVBM | **E** · hồ sơ HV dải "Sắp chuyển" | `Bàn giao môn R` | mở G cuộn tới em |
| 12 | GVCN lớp mới | **H** · hồ sơ lớp đích | xem dải `Sắp nhận n em …` → `Xem` | đọc được phiếu **đã xác nhận**, không sửa được; phiếu chưa xác nhận không mở |
| 13 | Hệ thống | — | đặt ngày demo Thứ Hai tuần bắt đầu (hoặc gọi `thiHanhLenhDenHan`) | em sang lớp mới, nhãn `mới vào`, dải E "Đã chuyển", Hành trình có "Đọc bàn giao" |
| 14 | QL | Chờ duyệt | xem kịch bản 6 | thẻ Báo lên "Bàn giao quá hạn" · GVCN, nút `Nhắc`; xác nhận xong thẻ tự đóng |
| 15 | QL | **I** · hồ sơ lớp FT ⋮ `Chuyển nhiều em…` | tách 2 em, một em Đổi lộ trình sang RF | cột Kết quả gần nhất; chữ `LT ↔ RF = mở lộ trình mới…`; em không chọn ở lại lớp |
| 16 | GVCN, GVBM | API | `POST /classes/:id/transition`, `/students/:id/transfer`, `PATCH /lenh-chuyen/:id` | **403** |
| 17 | mọi vai | mọi màn trên | 375 px, sáng + tối | không cuộn ngang, chữ không dồn, hạn qua `<Han>`, tuần là mã `W… …` |

## Nhật ký

| Ngày | Task | Ghi chú (mốc B, trần tốc độ, lệch kế hoạch, cổng gộp) |
|---|---|---|
| 30/09 | 0 | **Mốc B: 1821 phép kiểm chính + 25 phép tốc độ**, xanh (main @ 80cb0ffb). LT2a, LT2b, PR-GV **chưa merge** → cột Web gợi ý chờ LT2b. Model thật: Sonnet 5.5 (kế hoạch ghi Opus 5.5 / phương án B Fable 5.1 — session chạy theo lệnh của chủ sản phẩm). |
| 30/09 | 1–2 | Task 1: +13 phép kiểm (1834). Task 2: migrate + schema xong; cập nhật 3 phép kiểm XOA (bao đóng 31→33 bảng, 55→58 cạnh, 74→78 cột tài khoản, trần câu xoá HV 42→44) vì hai bảng mới. |
| 30/09 | 3 | 1848 phép kiểm xanh. Đường web cũ `POST /classes/:id/transition`, `POST /students/:id/transfer` nay RA LỆNH (em chưa từng xếp lớp vẫn đi đường cũ). Sửa kỳ vọng: 10 phép kiểm `lenLop.tests` + `prDuyet R7` (actor GVCN → admin/QL; Q3 và R7 thêm 403 cho GVCN), `tocDoDuong` (`/chuyen-lop/lop-dich`, `/students/:id/chuyen-lop` GVCN → 403). `tocDo` PR-TOC: đường ra lệnh 41 em = 20 câu → trần `raLenhCaLop` 30; phần thi hành cả lớp (trần `chuyenCaLopSangFT` 200) đo lại ở Task 4. `xoaKetThucLop.tinhTrangLop` tính lệnh là "lớp đã có dữ liệu". |
| 30/09 | 4 | 1859 phép kiểm + 26 tốc độ, xanh. `thiHanhLenhDenHan` + `quetLenhDenHan` (nho) cắm vào 5 đường đọc + `chotVangDinhKy` (`daChuyen`, lỗi chuyển lớp không hỏng chốt vắng). Tốc độ: quét thêm **+1 câu** ở `/classes/:id/overview` (55→56, QT 54→55); 4 đường còn lại không vượt trần cũ. Thi hành cả lớp 41 em = **192 câu** ≤ trần `chuyenCaLopSangFT` 200 (cũ 191). KCK: đặt Target tạm 5 rồi `reviseTarget('KCK')` đúng như Hướng dẫn 1 (ghi Hành trình "Đổi mục tiêu 5 → KCK" — xem mục lệch bên dưới nếu chủ SP thấy nhiễu). |
| 30/09 | 5 | 1868 phép kiểm + 26 tốc độ, xanh. Bàn giao nằm ở file riêng `server/src/classes/banGiao.ts` (kế hoạch ghi `lenhChuyen.ts`; tách để hai file dưới ~500 dòng) + `quyenChuyenLop.ts` (`coTheRaLenh`, `phanCongO`). Áp **Câu 1 = A** (planning chốt): QL điền thay / xác nhận thay khi lớp không có GVCN hoặc quá `han_gvcn`; cột mới `lenh_chuyen_lop.xac_nhan_thay` (kế hoạch chưa có, thêm vào bảng vì lệnh đã ở DB reset). **Lệch kế hoạch:** phiếu cả lớp tốn **19 câu** (kế hoạch ghi ≤ 8) vì `standingFor` một mình đã 7 câu — quan trọng là KHÔNG đổi theo số em (3 em = 30 em = 19 câu, có phép kiểm). Phần tự điền lớp thường hiện `standingLine` ("Cuối khoá: 3/4 môn đạt"); % từng môn chờ LT2b (`cuoiKhoaTheoHocVien`). Ghi môn sau khi phiếu đã xác nhận → 400 (giữ bản chụp nhất quán). |

## Planning chốt 30/09 (thắng các chỗ lệch trong kế hoạch)

- **Câu 1 = A (planning chốt):** lớp **không có GVCN**, hoặc bàn giao **quá 3 ngày** → Quản lý (phạm vi lớp nguồn) được điền thay và **xác nhận thay**; phiếu ghi "Quản lý xác nhận thay". Thêm nhánh quyền + phép kiểm (dương và phủ định).
- **Câu 2 = A (planning chốt):** "Tạm dừng" / "Kết thúc học" ở ⋮ hồ sơ HV giữ như cũ (GVCN làm được, hiệu lực ngay) — đó là trạng thái học, không phải chuyển lớp.
- Mockup 20 màn D ghi "MT3 dời theo lịch lớp mới": KHÔNG hứa dời lịch (luật hiện có chỉ chuyển lượt chưa làm sang lớp mới) — câu trên màn: "MT chưa thi chuyển sang lớp mới".
- Báo lên lớp tới tuần kết thúc còn em chưa có lệnh: theo đặc tả Q30-4 (khi **hết** tuần kết thúc); dải đỏ từ **đầu** tuần kết thúc. Nhóm việc dùng "Vận hành" có sẵn.
- Học viên không học ca cố định — không có khái niệm ca. Mã tuần `W2 OCT` trên mọi chữ mới.
- Planning duyệt bảng Q (22 dòng) như agent đề xuất.
