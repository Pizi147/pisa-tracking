# PR-UX2 · Kế hoạch Test (L/R/W/S riêng, tìm lớp, lớp thường như FT) — Kế hoạch

> **For agentic workers:** KHÔNG dùng `superpowers:subagent-driven-development` — làm theo khối **Quy trình nhanh** bên dưới.

**Goal:** Tab **Test › Kế hoạch Test** (chỉ Quản lý) làm lại theo mockup 14 phương án B: mỗi đợt xếp **riêng 4 kỹ năng
L · R · W · S** (W = chấm cả W1 và W2, một lịch W đặt cả hai), ô cùng tuần gộp chip `L R W S · W3 SEP`, khác tuần tách dòng,
đợt xong gọn `Xong ✓`; hàng điều khiển có **Chi nhánh + ô tìm lớp có gợi ý**; **lớp thường làm y như FT** (lưới HV × Giữa
khoá | Cuối khoá, cạnh tuần ghi tuần trong khoá `W5/10`, bỏ "Dời một môn"); panel **Xếp lịch hàng loạt** ~720px dùng khuôn
`KhungPanel` của UX0, lưu một phần giữ hàng lỗi và **sửa lỗi R9b tick lại cả lớp** (`NganXepHangLoat.tsx:49`).

**Architecture:** Luật thuần thêm vào `shared/domain/keHoachTest.ts` (gộp chip, nhãn tuần khoá, tóm tắt xem trước, em giữ
lại sau lưu). Máy chủ `server/src/keHoach/keHoachTest.ts` bỏ khái niệm nhóm `rlw`/`s`, nhận tuần **theo từng kỹ năng** và
vẫn **chỉ gọi lại** `createAttempt` / `setSkillWeek` / `setSkillSkip` / `planRegularTests` / `checkWeekVsNeighbours` — bảng
`attempt_skills` đã theo kỹ năng, **không đổi bảng**. Lớp thường có đường dữ liệu mới theo HV × kỹ năng (`luoiThuong`), dùng
chung thao tác với FT. Web: một lưới dùng chung `LuoiKeHoach` cho cả hai loại lớp, hộp chip `HopKyNang`, panel hàng loạt viết
lại trên `KhungPanel`.

**Tech Stack:** TypeScript · React 18 + Vite · Express · libsql/better-sqlite3 · Tailwind; phép kiểm `server/src/tests/*`
harness `check()`, chạy `npm run check`.

**Spec:** `docs/superpowers/specs/2026-09-23-overhaul-giao-dien-design.md` §1 (N-1…N-4), **§2 phần "Kế hoạch Test"** (thay
đặc tả 22/09 §3.5: RLW/S, lớp thường theo lớp, "Dời một môn") · mockup `thiet-ke/mockup/14-ke-hoach-test.html` (phần 1, **2
phương án B**, 3, 4, 5) · `15-panel-hv-lop.html` (khuôn panel) · `17-hang-va-badge.html` (hàng lớn/nhỏ A, badge) · luật chung
`2026-09-22-ux-toan-web-truoc-deploy-design.md` §1 G-1…G-12, §2 · `thiet-ke/THUAT_NGU_DA_CHOT.md`. Nguồn thắng khi lệch:
đặc tả 23/09 > mockup 14 > đặc tả 22/09 > THUAT_NGU.

| Mục | Chốt |
|---|---|
| Mã PR · nhánh | **PR-UX2** · `pr-ux2-ke-hoach-test` · worktree `.claude/worktrees/pr-ux2-ke-hoach-test` · một PR, không draft, **không tự merge** |
| Cổng thử | **API 4407 · Vite 5607** (không 4000/5173, không cổng PR khác) |
| Model | **Opus 5.5 · High** · phương án B **Sonnet 5 · High** |
| Người rà | **Fable 5.1** (code bằng Fable thì **Opus 5.5**) |
| Migrate | **KHÔNG.** Không đổi `server/src/schema.sql`, `server/src/migrate.ts` |
| Phụ thuộc | **Bắt đầu sau khi UX0 và Z2c-c merge** (UX0: `HangNhom`, `KhungPanel`, `Nhan`, token màu; Z2c-c: `WeekPicker`, `keHoachTest.tests.ts`). Rc2 (#76) đã merge. Chạy **song song UX1** (khác file) |
| File KHÔNG được chạm | **Z2c-c:** `web/src/ui/Filters.tsx`, `ScoreEntry.tsx`, `web/src/modules/cham/*`, `server/src/worklist/scoreDebt.ts`, `server/src/classes/classes.ts`, `server/src/fasttrack/attempts.ts`, `server/src/db.ts`, `server/src/app.ts`, `MockDetailPage.tsx` · **UX0:** `web/src/ui/{HangNhom,KhungPanel,Nhan,ui}.tsx`, file token CSS, `shared/domain/display.ts`, `server/src/worklist/mywork.ts`, `WorkList.tsx` (chỉ dùng) · **UX1:** `web/src/modules/test/{LichTestTab,CanChamTab,TestPage}.tsx`, `shared/domain/dieuHuong.ts`, `server/src/cham/*` · **UX3:** `web/src/modules/{cases,classes,students,yThuc}/*` · **R11:** `server/src/fasttrack/hoanTat.ts` |

### Chồng file

| File | PR khác | Cách xử lý |
|---|---|---|
| `server/src/routes/index.ts` | mọi PR | Chỉ sửa **khối `/ke-hoach-test/*`** (`:505-552`). Gỡ xung đột giữ cả hai |
| `server/src/tests/tocDoDuong.ts` | mọi PR | Chỉ các dòng `Kế hoạch Test` (`:135-141`) và khoá `TRAN` `/ke-hoach-test/*` (`:361-369`) |
| `server/src/tests/keHoachTest.tests.ts` | Z2c-c (thêm 2 phép sau R11(d), merge trước) | Làm trên main có Z2c-c; không sửa phép R11/Z2c-c |
| `server/src/fasttrack/skillSchedule.ts` | — | Chỉ `checkWeekVsNeighbours` (`:448-503`) |
| `server/src/normal/regular.ts` | — | Chỉ chữ ký + vòng HV của `planRegularTests` (`:232`) |
| `CODE_MAP.md`, `plan.md` | mọi PR | Chỉ thêm dòng |

## Quy trình nhanh (bắt buộc)

- **Không** rà từng Task bằng subagent. Tự code từng Task, `npm run check` sau **mỗi** Task (xanh, **số phép kiểm không
  giảm**), rồi commit. **Chỉ một lần chạy `npm run check` một lúc** — chạy chồng làm `run.js` treo; trước khi chạy lại, quét
  và tắt `node … run.js` cũ. Subagent (nếu buộc dùng): cùng model, **KHÔNG Haiku**.
- Không chụp ảnh từng Task. Bấm thử theo vai (**QL=2, GVCN=7, GVBM=9**) + 375px **một lần** ở Task 9 bằng **ảnh thật**
  (Playwright kênh Chrome), lưu `thiet-ke/anh/pr-ux2/`.
- Task 0 tạo worktree + nhánh từ `origin/main` mới nhất và chép kế hoạch này vào nhánh. Cuối PR: push, mở PR, báo planning.
  Không tự rà code cuối PR (planning rà bằng model khác).
- Commit ghi **đúng** dòng `Co-Authored-By` của **model thật** đang chạy.
- Tắt mọi tiến trình node/vite (API 4407, Vite 5607, `run.js`) trước khi kết thúc.
- Không chạy lệnh nào vào Turso, không deploy. Gặp mã lệch **hình dạng** so với kế hoạch (không chỉ lệch dòng) → dừng, hỏi planning.

## Global Constraints

- **N-1 Màu:** chỉ dùng token UX0 (`--ok --bad --late --soon --doing --done --wait --muted` + token hàng lớn/con, ô sửa
  được/chỉ đọc). Bỏ mọi màu cứng hiện có (`#15362a`, `#73d9a5`, `#3a3219`, `#e5c66a`… ở `LuoiFT.tsx:265,288`,
  `:221-222`). Chip: xong → `--done`, đã xếp → `--doing`, đã dời → `--soon`, chưa xếp → viền đứt `--muted`, chặn → `--bad`.
- **N-2 Hàng lớn/nhỏ:** mỗi lớp là một `HangNhom` (phương án A: nền sáng hơn, vạch trái 3px xanh trung tính, chữ đậm); lưới HV
  bên trong là phần con.
- **N-3 Badge:** một `Nhan` = một trạng thái ngắn ≤ 3 từ + số (`Mới`, `Đổi`, `Cảnh báo`, `Chặn`, `Xong ✓`). Lý do đầy đủ vào
  tooltip/dòng ghi chú, không nhồi vào badge. ⚠ không dùng ở đây (không có quá hạn).
- **N-4 Khuôn panel:** panel hàng loạt = `KhungPanel` rộng **720px** (form dạng bảng), 375px toàn màn; đầu một dòng
  `Xếp lịch hàng loạt · {lớp}`; thân chia khối có tiêu đề nhỏ; chân dính (Đóng trái, `Lưu lịch…` phải); chỉ thân cuộn;
  không chồng panel (G-8); lỗi chỉ hiện sau khi bấm Lưu.
- **G-1** ✓ nhỏ, cùng màu chữ, tooltip "Đã thi". **G-2** lưới `table-layout: fixed` + `colgroup`, ô chip cao cố định 2 dòng.
  **G-3** ≤ 1 dòng phụ ≤ 60 ký tự. **G-4** ⚠ chỉ quá hạn — "đã dời", "cảnh báo" dùng màu + chữ. **G-5** luật vào ⓘ
  (`NutLuat`), không `SectionNote`. **G-6** tuần lịch qua `tuanLich()` → `W3 SEP`; tuần khoá qua `tuanKhoa()` → `W5/10`; không
  ISO, không "tuần 5". **G-7** L R W S có tooltip tên đầy đủ; W có ⓘ "W = chấm cả W1 và W2". **G-8** hộp chip mở thì panel
  không mở chồng và ngược lại. **G-11** 375px: lưới cuộn ngang **trong thẻ**, cột tên dính, trang không cuộn ngang.
  **G-12** không thêm lối vào mới ngoài §4 (xem Q11).
- **Chữ:** lớp thường ghi **Giữa khoá · Cuối khoá**, không "MT", không "Normal", không "Progress/Final". Không mở đầu câu
  bằng "Hãy". Chữ cấm của khối quét `run.ts` (`PRH_OLD_STRINGS`, ~`:8825`) — đặc biệt **không viết "Bỏ khỏi phạm vi"**: ô
  bỏ kỹ năng ghi `Bỏ khỏi đợt`. Chữ mới lấy đúng mockup 14: `Xếp lịch hàng loạt…`, `Xếp lịch hàng loạt · {lớp}`, `+ xếp`,
  `Xong`, `dời`, `Chọn cả`, `Chọn cả 4 kỹ năng`, `Áp một tuần cho mọi kỹ năng đã chọn`, `Áp`, `Vẫn xếp {n} bài có cảnh báo`,
  `Lưu lịch cho {a} em · {b} bài`, `Xếp cả lớp theo đề xuất`, `đề xuất`, `sau khoá`, `Tìm lớp…`, bước `Đợt · Học viên · Kỹ
  năng · Xem trước`. Chữ cũ bỏ: `RLW`, `cùng tuần RLW`, `Dời một môn`, `Tạo lịch theo đề xuất`, `Đổi lịch · {lớp} · …`.
- **Tốc độ Turso:** đường API mới/đổi vào `tocDoDuong.ts` có trần; không truy vấn theo từng dòng (mọi lưới: một câu HV, một câu
  lượt, `loadSkillRows(ids)`, `loadBundle(ids)`, một câu lịch sử).
- **Quyền:** mọi hàm Kế hoạch Test `require_(p, PLAN_WEEK, { classId }, 'Chỉ Quản lý xếp được lịch Test.')` **trước** khi đọc
  gì của lớp (QL chi nhánh khác → 403). Không nới quyền nào.

## Bảng Q — session planning tự quyết (người rà kiểm lại)

| # | Câu hỏi | Quyết định | Lý do |
|---|---|---|---|
| Q1 | Hàng loạt lưu theo **bài** (mockup "13 lưu được · 3 bị chặn" — S của em bị chặn L R W vẫn lưu) hay theo **em** | **Theo em:** mỗi em một `tx`; em có bài bị chặn thì **cả em không lưu**, ở lại hàng lỗi. Xem trước vẫn đếm theo bài | Em chưa có đợt không thể tạo đợt chỉ có S; em đã có đợt mà lưu nửa đợt thì lịch hợp nhất lệch, khó hiểu. Một luật cho cả hai |
| Q2 | Em **chưa có** đợt mà chỉ tick 2–3 kỹ năng | Dòng `loi`: `Em chưa có {MT4/Giữa khoá} — cần chọn tuần cho cả 4 kỹ năng.` | Đợt mới luôn tạo đủ 4 dòng lịch (`ensureSkillRows`) |
| Q3 | "Ô tích bỏ kỹ năng khỏi đợt" (hộp chip) | **FT:** gọi `setSkillSkip` có sẵn (`attempts.ts:1092`, quyền `attempt.skip_skill`, **bắt buộc lý do** → ô `Lý do bỏ` hiện khi bỏ tick). **Lớp thường:** không có ô tích (`setSkillScope` chặn lớp thường — luôn đủ 4 môn) | Không dựng đường bỏ kỹ năng thứ hai; §2 luật chữ lớp thường đủ L R W S |
| Q4 | Gộp chip | Cùng **tuần + trạng thái + tuần dời** thì gộp; thứ tự L R W S; kỹ năng `khong-yeu-cau` không vẽ (tooltip ô "Đợt này không thi {kỹ năng}"). Ô tối đa 2 dòng; nhóm thứ 3 trở đi → dòng 2 thêm `+{n}` (tooltip liệt kê) | Mockup (2) B |
| Q5 | `Xong ✓` khi nào, ghi tuần nào | Mọi kỹ năng bắt buộc `xong` → một chip `Xong {tuần muộn nhất} ✓` | Mockup "Xong W3 AUG ✓" |
| Q6 | "tuần 5/10" (đặc tả) hay "W5/10" (mockup) | **`W5/10`** qua `tuanKhoa()`; tuần sau hết khoá → `sau khoá`; trước khai giảng → không nhãn | G-6 cấm "tuần 5"; mockup 14 (4) vẽ `W5/10` |
| Q7 | Nguồn khai giảng / tổng tuần cho nhãn | `classProgress`/`classProgressMany` (`startWeekStart`, `totalWeeks`, `progressWeek`, `finalWeek`) | Cùng nguồn `planRegularTests` (Q13 Rc2): FOU 8 tuần W4/W8, BE/ELE 10 tuần W5/W10 |
| Q8 | Ô tìm lớp | Lọc **phía web** trên `/ke-hoach-test/lop` (đã theo chi nhánh + quyền); không route mới. Khớp không phân biệt hoa thường, bỏ khoảng trắng và `-` (gõ `ft101` ra `MB-FT 101`); gợi ý tối đa 8 dòng `{mã} · {chi nhánh} · {n} HV`; ✕ xoá | Danh sách lớp một chi nhánh vài chục dòng — không cần máy chủ |
| Q9 | Lớp nào mở sẵn; panel hàng loạt xếp cho lớp nào | Mở sẵn: `?classId=` nếu có; không thì lớp đầu tiên có việc (FT `chuaCoLichTiep > 0`, thường `hvChuaCoLich > 0`), còn lại thu gọn. Panel xếp cho **lớp mở gần nhất** (`lopChon`); chưa mở lớp nào → nút tắt, tooltip `Mở một lớp trước` | Mockup: một lớp mở, lớp khác `▸` |
| Q10 | Tiêu đề h2 "Kế hoạch Test / Mock Test" (Q10 Rc2) | **Bỏ khỏi màn** (mockup 14 không có). Giữ `tieuDeKeHoach` + trường `tieuDe` (phép kiểm cũ còn dùng) | Tab đã nói tên |
| Q11 | Lối vào "Hồ sơ lớp › Lịch kiểm tra" (mockup ghi lối vào khác) | **Không làm ở UX2**: §4 chưa có dòng (G-12), file `classes/*` thuộc UX3. Tab nhận sẵn `?classId=&loai=` → chuyển planning/UX3 | Tránh chồng file |
| Q12 | Tóm tắt dòng lớp FT | `MT{a} đang thi` = MT nhỏ nhất còn lượt `planned` của HV đang học; `MT{b} chưa xếp {k} em` = b = a+1 (không có a → MT lớn nhất đã xong + 1), k = số HV đang học chưa có lượt b; k = 0 thì bỏ vế sau | Mockup "MT3 đang thi · MT4 chưa xếp 4 em" |
| Q13 | Ô lớp thường chưa có đợt | Chip mờ `đề xuất W4 OCT` + nhãn `W4/8`; bấm mở `HopKyNang` chế độ xếp mới (4 tuần mặc định = tuần đề xuất) | Mockup (4) |
| Q14 | "Đã dời" | FT: `attempt_skills.absence_move_count > 0` (như Q5 Rc2). Lớp thường: `assessment_scores.no_show_period_id` không null (dấu `-` Rc1) | Nguồn thật của hai loại |
| Q15 | "Chip xanh lá = môn đã chấm đủ cả lớp" (chú giải mockup 4) | Lưới theo HV → xanh lá = **môn của em đó** đã có điểm (`raw_score`) | Lưới giờ là HV × đợt, không còn ô cả lớp |
| Q16 | Tên bước panel | `Đợt · Học viên · Kỹ năng · Xem trước` (4 bước, "Lưu" thành chân panel) | Mockup 14 (3) thắng THUAT_NGU g10-075 |
| Q17 | Câu chặn "trùng tuần với MT3 (S)" | `checkWeekVsNeighbours` ghi thêm kỹ năng của đợt lân cận ở tuần đó: `Trùng tuần W1 OCT với MT3 (S). …` — một câu SQL không `GROUP BY`, gom trong JS | Mockup (3) cột Ghi chú |
| Q18 | Tuần mặc định panel | FT: L R W = tuần neo của `WeekPicker` (tuần hiện tại), S = tuần sau (giữ Q7 Rc2). Lớp thường: cả 4 = tuần đề xuất của đợt | Mockup (3) W1/W2 OCT; (4) đề xuất |
| Q19 | Hộp chip là panel hay hộp nhỏ | **Hộp nhỏ neo cạnh chip** (portal, `position: fixed`, kẹp trong màn); 375px → tấm dưới đáy rộng hết màn | Mockup (1) "hộp nhỏ ngay cạnh"; N-4 cho phép hộp nhỏ chọn nhanh |
| Q20 | Đường cũ `/nhom/kiem`, `/nhom`, `/thuong`, `/thuong/doi-lich` | **Xoá** (chỉ web Kế hoạch Test gọi — đã grep) cùng `kiemTuanNhom`, `datTuanNhom`, `bangThuong`, `doiLichThuong`, `NHOM_KY_NANG`, `tomTatXemTruoc` | Không để hai đường ghi lịch |

## Bản đồ file

| File | Tạo/Sửa | Task |
|---|---|---|
| `shared/domain/keHoachTest.ts` | Sửa: thêm luật thuần; xoá `NHOM_KY_NANG`, `tomTatXemTruoc` ở Task 7 | 1, 7 |
| `server/src/fasttrack/skillSchedule.ts` | Sửa `checkWeekVsNeighbours` (Q17) | 2 |
| `server/src/normal/regular.ts` | `planRegularTests` thêm `opts` | 2 |
| `server/src/keHoach/keHoachTest.ts` | Viết lại phần lưới/thao tác | 3, 4, 5 |
| `server/src/routes/index.ts` | Khối `/ke-hoach-test/*` | 3, 4, 5 |
| `server/src/tests/keHoachTest.tests.ts` | Sửa phép Rc2 Task4–6 theo API mới + phép mới | 1–5 |
| `server/src/tests/tocDoDuong.ts` | Đường + trần | 5 |
| `web/src/modules/test/KeHoachTestTab.tsx` | Viết lại | 6, 7 |
| `web/src/modules/test/keHoach/NganXepHangLoat.tsx` | Viết lại trên `KhungPanel` | 6 |
| `web/src/modules/test/keHoach/{TimLop,LopKeHoach,LuoiKeHoach,ChipKyNang,HopKyNang}.tsx` | Tạo | 7 |
| `web/src/modules/test/keHoach/{LuoiFT,BangThuong,HopDoiLichThuong,HopSuaTuan}.tsx` | **Xoá** | 7 |
| `CODE_MAP.md`, `plan.md` | Thêm dòng | 8 |

### Task 0: Chuẩn bị

- [ ] **1.** `git fetch origin`; kiểm `git log origin/main --oneline | grep -iE "ux0|z2c-c"` thấy **cả hai merge** — chưa thì
  dừng, báo planning. Tạo worktree `.claude/worktrees/pr-ux2-ke-hoach-test` nhánh `pr-ux2-ke-hoach-test` từ `origin/main`.
  `npm ci` nếu thiếu `node_modules`. Không checkout nhánh khác trong thư mục chính.
- [ ] **2.** Chép kế hoạch này vào nhánh, commit `PR-UX2 (0): ke hoach`.
- [ ] **3.** Không có biến Turso (`node -e "console.log(Object.keys(process.env).filter(k=>/TURSO|LIBSQL/.test(k)).length?'CO':'sạch')"`).
  `npm test 2>&1 | tail -3` → ghi số **B** vào Nhật ký.
- [ ] **4. Đối chiếu con trỏ** (ghi Nhật ký dòng thật): (a) UX0 — tên/props thật của `HangNhom`/`HangCon`
  (`web/src/ui/HangNhom.tsx`), `KhungPanel` (`web/src/ui/KhungPanel.tsx`: tiêu đề, rộng 720, chân trái/phải, `onClose`),
  `Nhan` (`web/src/ui/Nhan.tsx`: loại màu), tên token CSS. Kế hoạch này dùng tên dự kiến; lệch tên thì dùng tên thật, lệch
  **hình dạng** thì hỏi planning. (b) Z2c-c — chữ ký `WeekPicker` sau khi sửa (`onPeriod` phát `periodId`), vị trí 2 phép Z2c-c
  trong `keHoachTest.tests.ts`. (c) `keHoachTest.ts` `:27-619`, routes `:505-552`, `skillSchedule.ts:448-503`,
  `attempts.ts` `createAttempt`/`setSkillSkip`, `regular.ts:232` còn đúng hình dạng mô tả ở đây.

### Task 1: Luật thuần — chip, nhãn tuần khoá, tóm tắt xem trước

**Files:** `shared/domain/keHoachTest.ts` (thêm, **chưa xoá gì**), `server/src/tests/keHoachTest.tests.ts`.

**Produces** (tên chốt, dùng ở mọi Task sau):
```ts
export const KY_NANG_KE_HOACH = ['listening', 'reading', 'writing', 'speaking'] as const;
export type KyNangKH = (typeof KY_NANG_KE_HOACH)[number];
export const CHU_KY_NANG: Record<KyNangKH, 'L' | 'R' | 'W' | 'S'>;          // tooltip đầy đủ dùng skillLabel ở web
export type OKyNang = { trangThai: TrangThaiO; tuan: string | null; doiTu: string | null;
  batBuoc: boolean; khoa: string | null };  // khoa: 'đã có điểm' | 'đã thi' | 'đã huỷ phần thi' | null — dòng chỉ đọc
export type ChipKH = { kyNang: KyNangKH[]; tuan: string | null; trangThai: TrangThaiO; doiTu: string | null };
export function trangThaiKyNang(k: { batBuoc: boolean; tuan: string | null; xong: boolean; daDoi: boolean }): TrangThaiO;
export function gomChip(kn: Partial<Record<KyNangKH, OKyNang>>): { xong: boolean; tuanXong: string | null;
  chip: ChipKH[]; them: number };
export function nhanTuanKhoa(tuan: string | null, khaiGiang: string | null, tongTuan: number | null): string | null;
export type BaiXemTruoc = { skill: KyNangKH; tu: string | null; den: string | null;
  ghiChu: 'moi' | 'doi' | 'giu' | 'canh-bao' | 'chan'; cau: string | null };
export type DongHangLoat = { studentId: number; ten: string; hanhDong: 'tao' | 'doi' | 'giu' | 'loi';
  bai: BaiXemTruoc[]; loi: string | null };
export function tomTatHangLoat(dong: DongHangLoat[]): { tongBai: number; luuDuoc: number; coCanhBao: number;
  biChan: number; soEmLuu: number; soBaiLuu: number };
export function emGiuLaiSauLuu(dong: DongHangLoat[]): number[];
export function gomBaiXemTruoc(bai: BaiXemTruoc[]): Array<Omit<BaiXemTruoc, 'skill'> & { kyNang: KyNangKH[] }>;
export function tomTatLopFT(i: { dangThi: number | null; chuaXep: { dot: number; soEm: number } | null }): string;
```
- `trangThaiKyNang(k)` = `trangThaiNhom([k])` (dùng lại, không viết luật thứ hai).
- `gomChip`: bỏ kỹ năng `khong-yeu-cau`; không còn gì → `{ xong: false, chip: [], them: 0 }`; mọi kỹ năng còn lại `xong` →
  `{ xong: true, tuanXong: max(tuan), chip: [], them: 0 }`; còn lại gom theo khoá `${tuan}|${trangThai}|${doiTu}` giữ thứ tự
  xuất hiện L→R→W→S; `them = max(0, chip.length - 2)`.
- `nhanTuanKhoa`: thiếu một trong ba → `null`; `n = studyWeekOf(khaiGiang, tuan)` (`shared/domain/fasttrack.ts:109`);
  `n < 1` → `null`; `n > tongTuan` → `'sau khoá'`; còn lại `tuanKhoa(n, tongTuan)` → `'W5/10'`.
- `tomTatHangLoat`: `tongBai` = số bài của mọi dòng trừ `giu`; `biChan` = bài `chan`; `luuDuoc` = bài `moi|doi|canh-bao` của
  dòng **không** `loi` (Q1); `coCanhBao` = bài `canh-bao` trong số đó; `soEmLuu` = dòng `tao|doi`; `soBaiLuu` = `luuDuoc`.
- `emGiuLaiSauLuu` = `studentId` của các dòng `loi` (R9b: sau khi lưu, chỉ các em này còn tick). `gomBaiXemTruoc` gộp bài
  cùng `tu`+`den`+`ghiChu` thành một dòng xem trước (`L R W — → W1 OCT`), thứ tự L→S.
- `tomTatLopFT` → `'MT3 đang thi · MT4 chưa xếp 4 em'`, bỏ vế trống (Q12).

- [ ] **Phép (4):** `UX2 · gomChip — cùng tuần gộp, khác tuần tách, xong gọn, bỏ khong-yeu-cau, them` (4 kỹ năng cùng
  tuần → 1 chip `['listening','reading','writing','speaking']`; L R W tuần A + S tuần B → 2 chip; 4 tuần khác nhau →
  `them === 2`; cả 4 xong → `xong && tuanXong === tuần muộn nhất`; S `khong-yeu-cau` + L R W xong → `xong`).
  `UX2 · nhanTuanKhoa — FOU W4/8, W8/8; ELE W5/10, W10/10; sau khoá; trước khai giảng null`.
  `UX2 · tomTatHangLoat — em có bài chặn không tính vào lưu được (Q1)`. `UX2 · emGiuLaiSauLuu chỉ trả em lỗi`.
- [ ] `npm run check` → **B+4**. Commit `PR-UX2 (1): luat thuan chip 4 ky nang, nhan tuan khoa, tom tat hang loat`.

### Task 2: T15 ghi kỹ năng đợt lân cận · `planRegularTests` theo em

**Files:** `server/src/fasttrack/skillSchedule.ts` (`checkWeekVsNeighbours` `:448-503`), `server/src/normal/regular.ts`
(`planRegularTests` `:232`), `keHoachTest.tests.ts`.

- [ ] **Q17.** Đổi câu đọc thành **không gom**: `SELECT a.id, a.attempt_no, a.kind, ask.skill, pr.week_start FROM …` (cùng
  JOIN/WHERE hiện có, bỏ `GROUP BY`), gom trong JS thành `{ first_week, last_week, knDau: skill[], knCuoi: skill[] }` mỗi đợt.
  Luật **giữ nguyên** (trùng → chặn cả hai chiều, cách 7 ngày → cảnh báo, lấn → chặn). Chỉ câu **trùng** thêm kỹ năng:
  ```ts
  `Trùng tuần ${tuanLich(o.last_week)} với ${labelDot(o.attempt_no, o.kind)} (${o.knCuoi.map(chuKyNang).join(' ')}). `
  + 'Hai đợt không thi cùng một tuần.'
  ```
  (`chuKyNang` = `CHU_KY_NANG`). Câu "vượt qua đợt kế tiếp" giữ nguyên chữ (phép Rc1 C08 kiểm đúng chữ).
- [ ] **`planRegularTests(p, classId, opts: { studentIds?: number[]; kinds?: Array<'progress' | 'final'> } = {})`**: lọc câu
  HV (`:255-261`) bằng `studentIds` khi có (thêm `AND s.id IN (…)`), vòng `prog.checkpoints` bỏ `kind` ngoài `kinds`. Route
  `/regular/classes/:classId/plan` (`routes/index.ts:1216`) giữ nguyên (gọi không `opts`).
- [ ] **Phép (2):** `UX2 · T15 từng kỹ năng: trùng tuần S của đợt trước thì chặn, câu nêu "(S)"; L của đợt trước ở tuần
  khác không liên quan` (dựng MT3 L R W tuần A, S tuần A+7; `checkWeekVsNeighbours` MT4 tuần A+7 → blocker khớp
  `/Trùng tuần .* \(S\)/`; tuần A+14 → chỉ warning). `UX2 · planRegularTests opts.studentIds chỉ tạo bài cho em được chọn`
  (lớp thường dựng mới như Task6(a) cũ: gọi với 1 em, `kinds:['final']` → đúng 1 lượt `final` của em đó, em khác 0).
- [ ] `npm run check` → **B+6**. Commit `PR-UX2 (2): T15 neu ky nang dot lan can, planRegularTests theo em`.

### Task 3: Máy chủ FT — lưới và thao tác theo từng kỹ năng

**Files:** `server/src/keHoach/keHoachTest.ts`, `routes/index.ts` (khối `:505-552`), `keHoachTest.tests.ts`.

**Consumes:** `loadSkillRows`, `setSkillWeek`, `checkSkillWeekMove`, `checkWeekVsNeighbours` (skillSchedule), `createAttempt`,
`setSkillSkip`, `loadBundle` (attempts — chỉ import), `currentCycle`, `entrySkillsOf`.

- [ ] **Hàm đọc chung** `oKyNangCua(row, scores, daDoi, doiTu): OKyNang` — `xong = xongKyNang(row.skill, scores)` (`:80-83`,
  Writing cần **cả** `writing1` và `writing2` có band); `khoa` = `'đã huỷ phần thi'` (`sit_status='cancelled'`) › `'đã có
  điểm'` (FT: có band ở bất kỳ ô nhập nào của kỹ năng; lớp thường: `raw_score`) › `'đã thi'` (`sit_status='sat'`) › `null`.
- [ ] **`luoiFT(p, classId)`** (`:100-194`): giữ các câu đọc hiện có; `dot[n]` thành
  `{ attemptId, trangThaiDot, kn: Record<KyNangKH, OKyNang> }` (bỏ `rlw`/`s`, bỏ `ONhom`, `oNhom`, `CAC_NHOM`,
  `trangThaiVaTuanCuaNhom`). Lượt chưa có → `attemptId: null, kn: {}`. `doiTu` lấy từ `dichuyenGanNhat` (`:131-140`) theo
  đúng kỹ năng.
- [ ] **`kiemDot(p, { attemptId, kyNang: Array<{ skill: KyNangKH; periodId: number }> })`** → `{ bai: BaiXemTruoc[] }`,
  **không ghi**. `require_(PLAN_WEEK, { classId: a.class_id })` đầu hàm. Skill ngoài `KY_NANG_KE_HOACH` (vd `writing1`) →
  `badRequest('Kỹ năng không hợp lệ.')`. Mỗi kỹ năng: không bắt buộc hoặc `khoa` → `giu` (`cau` = lý do); đúng tuần cũ →
  `giu`; còn lại `checkSkillWeekMove` → blocker `chan`, warning `canh-bao`, không gì `doi`.
- [ ] **`luuDot(p, { attemptId, kyNang: Array<{ skill; periodId?: number | null; bo?: boolean }>, lyDoBo?, force?, reason? })`**
  — một `tx` cho cả đợt (hộp chip Lưu một lần):
  ```ts
  const datTuan = i.kyNang.filter((k) => k.periodId && !k.bo) as Array<{ skill: KyNangKH; periodId: number }>;
  const kiem = kiemDot(p, { attemptId: i.attemptId, kyNang: datTuan });
  const chan = kiem.bai.filter((b) => b.ghiChu === 'chan');
  if (chan.length) throw badRequest(chan.map((b) => `${CHU_KY_NANG[b.skill]}: ${b.cau}`).join(' '));
  const cb = kiem.bai.filter((b) => b.ghiChu === 'canh-bao');
  if (cb.length && !i.force) throw badRequest(`${cb.map((b) => b.cau).join(' ')} Xác nhận lại nếu vẫn muốn xếp vào tuần này.`);
  const rows = loadSkillRows([i.attemptId]).get(i.attemptId) ?? [];
  return tx(() => {
    for (const k of i.kyNang) {            // bo=true: đang bắt buộc → bỏ; bo=false: đang bỏ → đưa lại
      const r = rows.find((x) => x.skill === k.skill);
      if (k.bo !== undefined && r && !!r.required === k.bo) setSkillSkip(p, i.attemptId, k.skill, k.bo, i.lyDoBo ?? undefined);
    }
    const doi = kiem.bai.filter((b) => b.ghiChu === 'doi' || b.ghiChu === 'canh-bao');
    for (const b of doi) setSkillWeek(p, i.attemptId, b.skill, datTuan.find((k) => k.skill === b.skill)!.periodId, { reason: i.reason ?? null, force: true });
    return { ok: true, doi: doi.map((b) => b.skill) };
  });
  ```
  (`setSkillSkip` tự đòi lý do và tự chặn lớp thường — Q3.) Chạy được cho **cả lượt lớp thường** (Task 4 dùng lại).
- [ ] **`xepMoi(p, { studentId, attemptNo, tuan: Record<KyNangKH, number>, bo?: KyNangKH[], lyDoBo?, force? })`** (FT,
  thay `:252-288`): thiếu tuần của kỹ năng không `bo` → `badRequest('Cần chọn tuần cho cả 4 kỹ năng.')`. `checkWeekVsNeighbours`
  cho **mỗi tuần khác nhau** (đợt chưa có) → blocker ném, warning không `force` ném "Xác nhận lại"; rồi trong `tx`:
  `createAttempt(p, { studentId, cycleId, attemptNo, periodId: tuần sớm nhất })`, `plan_source='manual'` (như `:282`),
  `setSkillWeek(… force: true)` cho kỹ năng khác tuần đó, `setSkillSkip` cho `bo`.
- [ ] **Routes** (thay khối cũ, mọi route `requireAuth`, route ghi `maybeSimulateSaveFailure()`): `GET /ke-hoach-test/ft/:classId`
  (giữ), `POST /ke-hoach-test/dot/kiem`, `POST /ke-hoach-test/dot`, `POST /ke-hoach-test/xep-moi` (body `tuan` là object
  `{ listening: periodId, … }`, kiểm từng giá trị bằng `toInt`). **Xoá** `/nhom/kiem`, `/nhom`, `kiemTuanNhom`, `datTuanNhom`.
- [ ] **Sửa phép cũ theo API mới** (giữ số phép): Task4(a) → mỗi ô đủ `kn` 4 kỹ năng khi có lượt; Task4(b) → `luuDot` đổi L,
  R, **không** đổi W (đã có điểm → `giu`), **không** đổi S; Task4(c) → `kiemDot` trùng tuần MT3 → `chan`, `luuDot` ném, không
  đổi gì; Task4(d) → `xepMoi` với `tuan` L R W = A, S = A+7.
- [ ] **Phép mới (4):**
  - `UX2 · xếp tách 4 kỹ năng: luuDot đặt L, R, W, S bốn tuần khác nhau → bốn dòng attempt_skills bốn tuần; luoiFT gom 4 chip, them = 2`.
  - `UX2 · W đặt W1+W2: một lịch W; kiemDot từ chối "writing1"; W xong chỉ khi cả W1 và W2 có band` (xoá band W2 → `kn.writing.trangThai !== 'xong'`).
  - `UX2 · T15 từng kỹ năng trong luuDot: S trùng tuần đầu đợt sau → cả lần lưu bị chặn, L không đổi (một tx)`.
  - `UX2 · Bỏ khỏi đợt: luuDot bo S có lý do → required=0; thiếu lý do → ném; lượt lớp thường bo → ném`.
- [ ] `npm run check` → **B+10**. Commit `PR-UX2 (3): may chu FT xep tung ky nang L R W S`.

### Task 4: Máy chủ lớp thường — lưới theo HV × kỹ năng, danh sách lớp có tóm tắt

**Files:** `keHoach/keHoachTest.ts`, `routes/index.ts`, `keHoachTest.tests.ts`.

- [ ] **`luoiThuong(p, classId)`** (thay `bangThuong` `:442-541`) → `{ classId, classCode, chuongTrinh, khaiGiang: string |
  null, tongTuan: number | null, tuanHienTai: string | null, hvChuaCoLich: number, cot: Array<{ kind: 'progress' | 'final';
  nhan: 'Giữa khoá' | 'Cuối khoá'; deXuat: string | null; nhanDeXuat: string | null }>, hang: Array<{ studentId; ten; ma;
  dot: Record<'progress' | 'final', { attemptId: number | null; kn: Partial<Record<KyNangKH, OKyNang>> }> }> }`.
  `require_(PLAN_WEEK)`; lớp không phải `ratio` → `badRequest('Lớp này là Fast Track.')`. Câu đọc: HV đang học (một câu),
  lượt `kind IN ('progress','final')` (một câu, như `:474-482`), `loadSkillRows`, `loadBundle`, `classProgress(classId)`.
  `daDoi`/`doiTu` theo Q14 (`no_show_period_id` → `week_start` qua câu `report_periods` gom một lần). `deXuat` =
  `progressWeekStart`/`finalWeekStart`; `nhanDeXuat = tuanKhoa(progressWeek|finalWeek, totalWeeks)`; `tuanHienTai =
  tuanKhoa(currentWeek, totalWeeks)`. **Không** tính nhãn từng chip ở máy chủ — web gọi `nhanTuanKhoa(tuan, khaiGiang, tongTuan)`.
- [ ] **`xepMoiThuong(p, { classId, studentId, kind, tuan: Record<KyNangKH, number>, force? })`**: `require_(PLAN_WEEK)`; em
  phải đang học lớp (`enrollments` active) → không thì `badRequest`. Trong `tx`: `planRegularTests(p, classId, { studentIds:
  [studentId], kinds: [kind] })` (Task 2), đọc lượt vừa tạo, rồi `luuDot(p, { attemptId, kyNang: 4 dòng, force })`. `luuDot`
  ném → cả `tx` cuộn lại (không để lượt mồ côi).
- [ ] **`danhSachLop`** (`:27-71`) thêm cho mỗi lớp: `chiNhanh` (JOIN `branches` trong câu có sẵn), `tomTat: string` —
  FT: `tomTatLopFT` (Q12) tính từ **một câu** lượt mock `status != 'cancelled'` của HV đang học mọi lớp FT trong phạm vi
  (`class_id, student_id, attempt_no, status`), gom trong JS; lớp thường: `{chương trình} · đang {tuanKhoa}` từ
  `classProgressMany(ids thường)`; thêm `hvChuaCoLich` (câu gom `:460-471` chuyển sang đây) cho lớp thường.
- [ ] **Routes:** `GET /ke-hoach-test/thuong/:classId`; `POST /ke-hoach-test/xep-moi` nhận thêm `{ classId, kind }` → gọi
  `xepMoiThuong` khi có `kind`. **Xoá** `GET /ke-hoach-test/thuong`, `POST /ke-hoach-test/thuong/doi-lich`, `bangThuong`,
  `doiLichThuong`, `DongDoiLichThuong`, `KIND_NHAN` (thay bằng nhãn trong `luoiThuong`).
- [ ] **Sửa phép cũ:** Task6(a) → `luoiThuong` MB-FOU 12 có 2 cột Giữa/Cuối, mỗi HV × 4 kỹ năng; lớp mới chưa có bài →
  `cot[].deXuat` bằng tuần `planRegularTests` tạo ra. Task6(b) R14 → `reportRegularNoShow` một em môn L → `kn.listening` của
  **em đó** `da-doi` với tuần mới, em khác không đổi. Task6(c)(d) → `luuDot` W của **một em** lớp thường; em đã có điểm W →
  `giu`; `setSkillWeek` vẫn từ chối môn đã có `raw_score`. Rà planning(1) → dùng `danhSachLop` + `luoiThuong`.
- [ ] **Phép mới (3):**
  - `UX2 · lớp thường theo HV: luuDot một em đổi S, em khác cùng lớp giữ nguyên; xepMoiThuong tạo đúng 1 lượt cho 1 em`.
  - `UX2 · nhãn tuần n/N: luoiThuong MB-FOU 12 nhanDeXuat W4/8 · W8/8; BC-ELE 01 W5/10 · W10/10; nhanTuanKhoa(tuần sau khoá) = "sau khoá"`.
  - `UX2 · danhSachLop: lớp FT có tomTat dạng "MT{n} đang thi…", có chiNhanh; lớp thường tomTat có "đang W"`.
- [ ] `npm run check` → **B+13**. Commit `PR-UX2 (4): may chu lop thuong theo hoc vien, nhan tuan khoa, tom tat lop`.

### Task 5: Máy chủ — Xếp lịch hàng loạt theo kỹ năng (FT + lớp thường) · quyền · tốc độ

**Files:** `keHoach/keHoachTest.ts` (`:292-436`), `routes/index.ts`, `keHoachTest.tests.ts`, `tocDoDuong.ts`.

- [ ] **`xepHangLoat(p, { classId, attemptNo?, kind?, studentIds, tuan: Partial<Record<KyNangKH, number>>, force?, xemTruoc? })`**
  → `{ dong: DongHangLoat[]; daLuu: number }` (kiểu ở shared, Task 1). Đúng một trong `attemptNo` (FT) / `kind` (lớp
  thường), sai loại lớp → `badRequest`. Giữ lọc HV đúng lớp (`:389-398`, không lộ tên ngoài lớp). Mỗi em (`xetMotEm`):
  - chưa có đợt → cần đủ 4 kỹ năng trong `tuan` (Q2, thiếu → `loi`); mỗi tuần khác nhau qua `checkWeekVsNeighbours` (lớp
    thường: `cycleId` = lộ trình `route IS NULL` đang chạy nếu có, `attemptNo` = MAX+1 như `planRegularTests` tính; chưa có lộ
    trình → không có đợt lân cận, không chặn) → bài `moi` / `canh-bao` / `chan`; `hanhDong = 'tao'` hoặc `'loi'`.
  - có đợt → `kiemDot` với các kỹ năng trong `tuan` → bài; có `chan` → `loi` (câu = các câu chặn); toàn `giu` → `giu`; còn lại `doi`.
  - `xemTruoc` → không ghi. Lưu: mỗi em một `tx` (`xepMoi` / `xepMoiThuong` / `luuDot`), `canh-bao` mà không `force` → dòng
    `loi` "Xác nhận lại…"; lỗi (kể cả AN-5 hết giờ) rơi vào `loi` của dòng đó, em khác vẫn lưu (R9b). Giữ `writeAudit`
    `ke_hoach.hang_loat` (`:429-433`), `entityLabel` = `MT{n}` hoặc `Giữa khoá`/`Cuối khoá`.
- [ ] Route `POST /ke-hoach-test/hang-loat` body mới (`tuan` object, `attemptNo` hoặc `kind`). Xoá `xetMotEmHangLoat`,
  `luuMotEmHangLoat` cũ.
- [ ] **Sửa phép cũ:** Task5(a)(c) → `tao`/`doi`/`giu` theo `tuan` 4 kỹ năng; Task5(b) → em bị chặn ở lại `loi`, em khác lưu,
  lưu lại tuần khác thì được; Rà planning(2) → body mới.
- [ ] **Phép mới (2):**
  - `UX2 · hàng loạt lớp thường: kind=final, 2 em, S khác tuần L R W → mỗi em đúng 4 tuần; em có bài chặn không lưu gì (Q1)`.
  - `UX2 · quyền: QL chi nhánh khác (P.cpManager) gọi luoiFT, luoiThuong, kiemDot, luuDot, xepMoi, xepHangLoat lớp MB →
    HttpError status 403; danhSachLop(cpManager, { branchId: MB }) trả lop rỗng; GVBM (P.lrTeacher) luoiThuong → 403`
    (bắt lỗi rồi `assert(e.status === 403)`, không chỉ khớp chữ).
- [ ] **Tốc độ:** `tocDoDuong.ts` — thay dòng `/ke-hoach-test/thuong?branchId={cn}` (`:141`) bằng
  `{ trang: 'Kế hoạch Test', vai: ['QL','QT','GVCN','GVBM','GVCN_THUONG'], url: '/ke-hoach-test/thuong/{lopThuong}',
  maChuDich: { GVCN: 403, GVBM: 403, GVCN_THUONG: 403 } }`. Chạy `npm test` một lần, đọc số câu SQL đo được cho
  `/ke-hoach-test/lop`, `/ke-hoach-test/ft/3`, `/ke-hoach-test/thuong/5`; đặt trần = `max(đo+10, ⌈đo×1.3⌉)` cho khoá mới, xoá
  khoá `…/thuong?branchId=1` (`:368-369`); khoá cũ `/lop`, `/ft/3` chỉ nâng nếu vượt, ghi số đo trước/sau vào Nhật ký.
- [ ] `npm run check` → **B+15**, không "Vượt trần". Commit `PR-UX2 (5): xep lich hang loat theo ky nang, quyen chi nhanh, toc do`.

### Task 6: Web — panel Xếp lịch hàng loạt trên `KhungPanel` (sửa R9b)

**Files:** viết lại `web/src/modules/test/keHoach/NganXepHangLoat.tsx`; `KeHoachTestTab.tsx` (chỉ đổi props truyền vào).

**Props:** `NganXepHangLoat({ loai: 'ft' | 'thuong'; classId: number; classCode: string; onClose; onDone })` — **tự tải**
lưới bằng `useApi` (`/ke-hoach-test/ft/:id` hoặc `/thuong/:id`), không nhận `luoi` từ cha (tách khỏi `LuoiFT` cũ để Task
này dịch được riêng).

- [ ] **Vỏ:** `KhungPanel` rộng 720, tiêu đề `Xếp lịch hàng loạt · {classCode}`; chân trái `Đóng`, phải
  `Lưu lịch cho {soEmLuu} em · {soBaiLuu} bài` (tắt khi 0 hoặc đang lưu); trên chân một dòng `Còn thiếu: …` chỉ sau khi bấm Lưu.
- [ ] **Khối 1 Đợt:** FT chip `MT{n}` (MT còn em chưa xong — như `dotConTheXep` `:17-23`, đổi sang đọc `kn`), đợt đã xong cả
  lớp hiện `MT1 ✓` mờ không bấm; lớp thường `Giữa khoá` · `Cuối khoá`.
- [ ] **Khối 2 Học viên:** tiêu đề `Học viên · {a}/{b} đã chọn` + nút `Chọn cả`; mỗi em một dòng: ô tích · tên · tình trạng
  hiện có (em chưa có đợt: `{MT4|Giữa khoá} chưa xếp`; có: chip gọn qua `gomChip` dạng chữ `L R W S · W4 OCT`); em xong đợt
  đó mờ, không tích được.
- [ ] **Khối 3 Kỹ năng:** ô `Chọn cả 4 kỹ năng`; 4 dòng `ô tích · L Listening · WeekPicker scope="planning"` (W có `NutLuat`
  "W = chấm cả W1 và W2"); lớp thường thêm nhãn mờ `nhanTuanKhoa(tuần, khaiGiang, tongTuan)` cạnh bộ chọn; hàng
  `Áp một tuần cho mọi kỹ năng đã chọn ‹tuần› Áp`. Mặc định theo Q18.
- [ ] **Khối 4 Xem trước:** gọi `POST /hang-loat` `xemTruoc: true` mỗi khi khối 1–3 đổi (trễ 300 ms, bỏ kết quả lượt cũ bằng
  số thứ tự như `:73-88`). Dòng tóm tắt `tomTatHangLoat`: `{tongBai} bài · {luuDuoc} lưu được ({coCanhBao} có cảnh báo) ·
  {biChan} bị chặn`. Bảng 4 cột `Học viên · Kỹ năng · Tuần cũ → mới · Ghi chú` (`colgroup` 180/90/160/*): mỗi em qua
  `gomBaiXemTruoc` (`L R W — → W1 OCT`), ghi chú = `Nhan` (`Mới` `--muted`, `Đổi` `--doing`,
  `Cảnh báo` `--soon`, `Chặn` `--bad`) + câu ngắn (tooltip câu đầy đủ). Có `canh-bao` → ô tích `Vẫn xếp {n} bài có cảnh báo`
  (→ `force`). Có `chan` → một dòng `Bài bị chặn không lưu — sửa tuần ở bước 3 hoặc bỏ tích em đó.`
- [ ] **R9b — sửa lỗi gốc.** Hiện `useEffect(() => setTicked(new Set(emChuaXong…)), [emChuaXong])` (`:49`) chạy lại mỗi khi
  lưới tải lại — mà `invalidate('/ke-hoach-test')` sau khi lưu làm lưới tải lại, nên danh sách "chỉ em lỗi" (`:108`) bị ghi
  đè thành cả lớp. Sửa: tick mặc định **chỉ đặt khi đổi đợt**, không phụ thuộc dữ liệu lưới:
  ```tsx
  const [giuLoi, setGiuLoi] = useState<number[] | null>(null);
  const dotKey = loai === 'ft' ? `mt${attemptNo}` : kind;
  const daDatTick = useRef<string | null>(null);
  useEffect(() => {
    if (!luoi || daDatTick.current === dotKey) return;      // chỉ lần đầu của mỗi đợt
    daDatTick.current = dotKey; setGiuLoi(null);
    setTicked(new Set(emChuaXong.map((h) => h.studentId)));
  }, [dotKey, luoi]);
  // sau khi lưu:
  const conLai = emGiuLaiSauLuu(r.dong);
  if (!conLai.length) { onClose(); return; }
  setGiuLoi(conLai); setTicked(new Set(conLai)); setDong(r.dong);
  ```
  Khi `giuLoi` khác null, khối 2 **chỉ liệt kê** các em đó (mỗi em thêm dòng lỗi một dòng, tooltip đầy đủ); đổi đợt thì bỏ `giuLoi`.
- [ ] 375px: panel toàn màn, 4 khối xếp dọc, bảng xem trước cuộn ngang trong khối, chân dính đáy, nút ≥ 44px.
- [ ] `KeHoachTestTab.tsx:114-118`: truyền `loai="ft" classId classCode` (bỏ `luoi`). `npm run check` xanh, số phép giữ **B+15**.
  Commit `PR-UX2 (6): panel xep lich hang loat 4 ky nang, sua R9b tick lai ca lop`.

### Task 7: Web — hàng điều khiển, tìm lớp, lưới chung FT/lớp thường, hộp chip

**Files:** viết lại `KeHoachTestTab.tsx`; tạo `keHoach/TimLop.tsx`, `LopKeHoach.tsx`, `LuoiKeHoach.tsx`, `ChipKyNang.tsx`,
`HopKyNang.tsx`; **xoá** `LuoiFT.tsx`, `BangThuong.tsx`, `HopDoiLichThuong.tsx`, `HopSuaTuan.tsx`; xoá `NHOM_KY_NANG`,
`tomTatXemTruoc`, `DongXemTruoc`, `ganTuan` khỏi `shared/domain/keHoachTest.ts`. Phép cũ `PR-Rc2 · tomTatXemTruoc`
(`keHoachTest.tests.ts:635`) đổi thành `UX2 · gomBaiXemTruoc — cùng tu/den/ghiChu gộp, khác ghiChu tách` (số phép giữ).

- [ ] **`KeHoachTestTab`** (mockup 14 (1)): một hàng `BranchFilter` (`Filters.tsx:346`, **chỉ dùng**, tự ẩn khi một chi nhánh;
  ghi `?branchId=`) · `TimLop` · `HangTab cap="con"` `Fast Track · Lớp thường` (chỉ hiện tab có lớp; `?loai=`) · `NutLuat`
  (chú giải 4 chip + "W = chấm cả W1 và W2" + "Hai đợt trùng tuần thì máy chặn; cách đúng một tuần thì hỏi lại") · nút
  `Xếp lịch hàng loạt…` (Q9). Bỏ h2 (Q10), bỏ `<select>` lớp (`:89-94`). Dưới là danh sách `LopKeHoach` theo `loai` và chữ
  tìm. Không lớp nào khớp → `Empty` `Không có lớp nào khớp "{chữ}"`. 375px: `BranchFilter` vào `<details>` `Lọc ▾`, hàng xuống dòng.
- [ ] **`TimLop({ lop, value, onChange, onChon })`**: ô `⌕ Tìm lớp…` + ✕; gõ → danh sách gợi ý dưới ô (Q8, ↑↓ Enter chọn, Esc
  đóng, `role="listbox"`); chọn → chữ = mã lớp, mở lớp đó, `?classId=`.
- [ ] **`LopKeHoach({ lop, loai, mo, onToggle })`**: `HangNhom` — `▾/▸ {mã}` · dòng phụ `{chiNhanh} · {soHv} HV` · phải
  `tomTat` (FT) hoặc `đang W8/8` (thường); lớp thường có `hvChuaCoLich > 0` → nút nhỏ `Xếp cả lớp theo đề xuất` (gọi
  `/regular/classes/:id/plan`, toast `Đã tạo {n} bài`, `invalidate('/ke-hoach-test')`). Mở → `useApi` lưới của lớp đó →
  `LuoiKeHoach`.
- [ ] **`LuoiKeHoach({ loai, data })`** dùng chung: bảng `table-layout: fixed`, cột tên 180px dính trái (`sticky-col`), cột đợt
  176px (FT `MT1…MT5[+]`, thường `Giữa khoá` / `Cuối khoá` với dòng phụ tiêu đề `đề xuất {nhanDeXuat}`), bọc
  `overflow-x-auto` trong thẻ; 375px tự cuộn tới cột đợt đang tới (MT nhỏ nhất chưa xong) khi mở. Ô = `ChipKyNang`.
- [ ] **`ChipKyNang({ o: Partial<Record<KyNangKH, OKyNang>>, attemptId, loai, khaiGiang?, tongTuan?, deXuat?, onMo })`**: ô
  cao cố định 2 dòng (`h-[44px]`). `gomChip` → `xong` → một chip `Xong {tuanLich} ✓` (`--done`, bấm mở `/mock-test/{id}`
  với FT); còn lại tối đa 2 chip, mỗi chip `{L R W} {tuanLich}` (đã dời: `{S} · dời {tuanLich}` màu `--soon`), dòng 2 thêm
  `+{them}`; lớp thường thêm nhãn mờ `nhanTuanKhoa(...)` bên phải chip. Chưa có đợt → nút viền đứt `+ xếp` (FT) / chip mờ
  `đề xuất {tuanLich(deXuat)}` (thường, Q13). Tooltip chip: tên đầy đủ từng kỹ năng + tuần (G-7). Bấm chip → `onMo(kyNang
  đầu của chip)`.
- [ ] **`HopKyNang`** (mockup 14 (1) hộp phải; Q19): tiêu đề `{tên} · {MT3 | Giữa khoá}`; 4 dòng `ô tích · L Listening ·
  WeekPicker` (dòng `khoa` chỉ đọc, ghi lý do mờ; FT bỏ tích → dòng `Lý do bỏ` bắt buộc, nhãn `Bỏ khỏi đợt`; lớp thường
  không có ô tích — Q3); mỗi lần đổi tuần gọi `POST /dot/kiem` → **một dòng** trạng thái: có `chan` → chữ `--bad`
  `Chặn: {câu}`, nút Lưu tắt; `canh-bao` → chữ `--soon` + nút đổi thành `Vẫn xếp vào tuần này`; không gì → `{S}: {cũ} →
  {mới} · không trùng đợt khác.` Lưu → `POST /dot` (hoặc `/xep-moi` khi chưa có đợt: FT `{ studentId, attemptNo, tuan }`,
  thường `{ classId, studentId, kind, tuan }`), toast `Đã lưu lịch.`, `invalidate('/ke-hoach-test')`, `'/attempts'`,
  `'/cham'`. Hộp mở thì nút `Xếp lịch hàng loạt…` tắt (G-8).
- [ ] `grep -rn "LuoiFT\|BangThuong\|HopDoiLichThuong\|HopSuaTuan\|NHOM_KY_NANG\|tomTatXemTruoc\|RLW" web/src server/src shared`
  → chỉ còn `cham/LuoiFT.tsx` (file khác, không chạm). `npm run check` xanh, **≥ B+15**. Commit
  `PR-UX2 (7): tim lop, luoi chung FT va lop thuong, hop chip 4 ky nang`.

### Task 8: Tài liệu

- [ ] `CODE_MAP.md`: dòng Kế hoạch Test ghi file mới (`TimLop`, `LopKeHoach`, `LuoiKeHoach`, `ChipKyNang`, `HopKyNang`,
  `NganXepHangLoat`), bỏ 4 file đã xoá; "Kế hoạch Test xếp theo từng kỹ năng, chỉ gọi lại `createAttempt` / `setSkillWeek` /
  `setSkillSkip` / `planRegularTests`".
- [ ] `plan.md`: một dòng nhật ký ngày làm + tick "Kế hoạch Test L/R/W/S riêng, lớp thường theo HV, R9b". Không sửa
  THUAT_NGU (planning cập nhật các chữ bỏ/mới ở Global Constraints).
- [ ] Commit `PR-UX2 (8): CODE_MAP, plan.md`.

### Task 9: Nghiệm thu — kiểm đủ, bấm thử một lần bằng ảnh thật, PR

- [ ] **1.** `npm run check` → xanh, **≥ B+15** (lệch do gộp phép → ghi Nhật ký), không "Vượt trần".
- [ ] **2.** `git diff origin/main...HEAD --stat -- server/src/schema.sql server/src/migrate.ts` → rỗng. `git diff
  origin/main...HEAD --stat` không có file nào ở cột "File KHÔNG được chạm".
- [ ] **3. Chạy thử** (theo bộ nhớ "Máy chủ dev trong worktree"; **không** `preview_start`): DB tạm
  `$(node -e "console.log(require('os').tmpdir())")/pr-ux2-kiem.sqlite`, `PISA_DB=… npm run seed`; `vite.kiem.config.ts` tạm
  (port 5607, proxy `/api` → `http://127.0.0.1:4407`, **không commit**); `npm run build:server && PISA_DB=… PORT=4407 npm run
  dev:api` + `npx vite --config vite.kiem.config.ts`. **Playwright kênh Chrome**, chụp `page.screenshot` ra file.
- [ ] **4. Bấm thử theo vai** (ghi từng ý vào Nhật ký; ảnh `thiet-ke/anh/pr-ux2/{01..}-*.png`, 1440 và 375):
  - **QL (2), 1440:** Test › Kế hoạch Test → hàng Chi nhánh · ô tìm · tab · ⓘ · nút. Gõ `ft10` → gợi ý đúng lớp, chọn → lớp
    mở. Lưới MB-FT 101: ô cùng tuần 1 chip `L R W S · W…`, khác tuần 2 dòng, đợt xong `Xong … ✓`, ô cao bằng nhau. Bấm chip
    S → hộp 4 dòng; chọn tuần trùng đợt kế → `Chặn: …(L R W)…`, Lưu tắt; cách một tuần → `Vẫn xếp vào tuần này`; lưu hợp lệ →
    chỉ S đổi. Bỏ tích S có lý do → S biến khỏi ô. `+ xếp` một em MT kế → 4 tuần.
  - **Hàng loạt:** 4 khối; xem trước đúng số bài/cảnh báo/chặn; cố ý làm một em bị chặn → Lưu → panel **giữ đúng em đó**, các
    em khác đã lưu, **không tick lại cả lớp** (R9b); sửa tuần → lưu lại được → panel đóng.
  - **Lớp thường:** MB-FOU 12 tiêu đề cột `đề xuất W4/8`, `W8/8`; chip có nhãn `W…/8`; tuần sau khoá ghi `sau khoá`; bấm chip W
    một em → chỉ em đó đổi. BC-ELE 01 `W5/10`, `W10/10`. Lớp có em chưa có bài → `Xếp cả lớp theo đề xuất` tạo bài.
  - **GVCN (7), GVBM (9):** không thấy tab Kế hoạch Test; gõ thẳng `/test/ke-hoach` → về tab mặc định.
  - **375px (QL):** hàng điều khiển xuống dòng, `Lọc ▾`; lưới cuộn ngang trong thẻ, cột tên dính, tự tới MT đang tới;
    trang không cuộn ngang (`document.documentElement.scrollWidth === innerWidth`); panel toàn màn, chân dính đáy, nút ≥ 44px;
    hộp chip thành tấm dưới đáy.
  - Không thấy ISO, "Normal", "tuần 5", "RLW", ⚠, màu cứng lạc hệ.
  Xong: tắt API 4407, Vite 5607, `run.js`; xoá `vite.kiem.config.ts` + DB tạm; `git add thiet-ke/anh/pr-ux2/`.
- [ ] **5. Rebase + PR.** `git fetch origin && git rebase origin/main` (xung đột `routes/index.ts`, `tocDoDuong.ts`,
  `keHoachTest.tests.ts` → giữ cả hai), `npm run check` lại. `git push -u origin pr-ux2-ke-hoach-test`; `gh pr create` tiêu đề
  `PR-UX2 · Kế hoạch Test L/R/W/S riêng, tìm lớp, lớp thường như FT`; thân: tóm tắt theo Task, bảng Q1–Q20, số phép B → B+n,
  **"Không có migrate"**, ảnh, "Chuyển cho PR khác", dòng cuối `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
  **Không tự merge.** Báo planning (tiếng Việt đơn giản): Quản lý xếp lịch Test từng kỹ năng Nghe, Đọc, Viết, Nói riêng;
  kỹ năng cùng tuần thì gộp một ô cho gọn; tìm lớp bằng ô gõ; lớp thường xếp từng em y như Fast Track, có ghi tuần mấy của
  khoá; xếp nhiều em một lần có xem trước, em nào lỗi thì giữ lại để sửa (không tick lại cả lớp nữa).

## Chuyển cho PR khác

- **Planning / UX3:** thêm dòng §4 "Kế hoạch Test — Hồ sơ lớp › Lịch kiểm tra (mở sẵn lớp)" rồi mới gắn nút ở
  `classes/ClassProgressPanel.tsx` → `/test/ke-hoach?loai=…&classId=…` (Q11).
- **Planning:** THUAT_NGU — bỏ g10-072 (`RLW · S`), g10-073, g10-075, g10-077; thêm chữ mới ở Global Constraints.
- **Z2c:** đo `/ke-hoach-test/thuong/:id` và `POST /hang-loat` (20 em × 4 kỹ năng) trên Turso.

## Mâu thuẫn nguồn ↔ mã

| # | Mâu thuẫn | Xử lý |
|---|---|---|
| 1 | Đặc tả "tuần 5/10" ↔ G-6 cấm "tuần 5", mockup vẽ `W5/10` | Q6 |
| 2 | Mockup đếm lưu theo bài (S của em bị chặn vẫn lưu) ↔ đợt mới không tạo được nửa đợt, `tx` theo em ở `xepHangLoat:418-426` | Q1 |
| 3 | Mockup hộp chip "ô tích bỏ kỹ năng" chung ↔ `setSkillScope` chặn lớp thường, đòi lý do (`skillSchedule.ts:656-672`) | Q3 |
| 4 | Chú giải mockup (4) "xanh lá = chấm đủ cả lớp" ↔ lưới mới theo HV | Q15 |
| 5 | Đặc tả "Hàng: Chi nhánh + …" ↔ `KeHoachTestTab` chỉ đọc `branchId` từ URL, không có bộ chọn | Task 7 dùng `BranchFilter` |
| 6 | `NganXepHangLoat.tsx:49` đặt lại tick theo `emChuaXong` mỗi lần lưới tải lại ↔ R9b "chỉ giữ em lỗi" (`:108`) | Task 6 sửa gốc |
| 7 | `checkWeekVsNeighbours` gom MIN/MAX nên không biết kỹ năng ↔ mockup "trùng tuần với MT3 (S)" | Q17 |
| 8 | THUAT_NGU g10-072/073/075/077 (RLW, cùng tuần RLW) ↔ đặc tả 23/09 bỏ RLW/S | Đặc tả thắng; planning cập nhật |
| 9 | Chữ cấm `Bỏ khỏi phạm vi` (`run.ts` `PRH_OLD_STRINGS`) ↔ việc "bỏ kỹ năng khỏi đợt" | Ghi `Bỏ khỏi đợt` |

## Nhật ký thực thi

| Ngày | Task | Ghi chú |
|---|---|---|
| 23/09 | 0 | Worktree từ origin/main `d0462b0` (UX0 #89 + Z2c-c #87 đã merge). Model thật: **Sonnet 5** (phương án B của kế hoạch), không subagent. Không có biến Turso. Mốc **B = 1186** (`run.js`) + 20 (`tocDo`). Con trỏ: `KhungPanel` (`web/src/ui/KhungPanel.tsx`) nhận `rong='rong'` = 720px, có `Khoi`/`Truong`, chân `chan={huy,phu,chinh,conThieu}`, `onDong`; `HangNhom` là `<tr>` (`mo,onMo,nhan,tieuDe,soCotDau`) + `HangCon`; `Nhan tone=ok/done/bad/soon/doing/wait/muted`. Mã khớp kế hoạch (`keHoachTest.ts:27-619`, routes `:505-552`, `skillSchedule.ts:448-503`, `regular.ts:232`). |
| 23/09 | 1 | Luật thuần thêm vào `shared/domain/keHoachTest.ts` (chưa xoá gì). `tomTatHangLoat`: bài `giu` không tính là bài. Bộ kiểm 1186 → **1190** (B+4). |
| 23/09 | 2 | `checkWeekVsNeighbours` đọc theo từng kỹ năng, câu trùng tuần nêu `(L R W)`/`(S)`; `planRegularTests(p, classId, { studentIds, kinds })`. 1190 → **1192** (B+6). Phép `UX2 · T15` dựng MT80 ở 2027 để khỏi đụng lịch seed. |
| 23/09 | 3–5 | **Gộp ba Task máy chủ một commit** (`a29dbbb`): `xepHangLoat` (Task 5) dựa trên `kiemDot/luuDot` (Task 3) và `luoiThuong` (Task 4), tách ra thì commit giữa chừng không dựng được. `luuDot` nhận thêm `bo: false` (đưa kỹ năng đã bỏ trở lại) — `kiemDotNoi` có tham số `duaLai` để không coi dòng "không thi" là `giu`. `xepMoiThuong` kiểm "em đã có bài" **trước** T15 (không thì em đã có bài báo "Trùng tuần" thay vì "đã có bài"). Phép kiểm dùng HV không có lộ trình lớp thường và có ghi danh mới nhất ở MB-FT 101 (`hvFT`), vì các phép Task 2/Task 6 tạo lộ trình `route IS NULL` làm `currentCycle` của em đổi. 1192 → **1201** (B+15). **Tốc độ** (`tocDo.run.js`, đo lại): `/ke-hoach-test/lop` QL **17** · QT 16 (trần cũ 21); `/ft/3` QL **19** · QT 18 (trần cũ 29); `/thuong/5` QL **25** · QT 24 → trần mới 35/34, xoá khoá `/thuong?branchId=1` (trần cũ 34). Không khoá nào bị nâng. |
| 23/09 | 6–7 | **Gộp hai Task web một commit** (`5d99f85`): panel hàng loạt và lưới/hộp chip dùng chung `kieu.ts` và bộ chọn tuần. Phép `PR-Rc2 · tomTatXemTruoc` đổi thành `UX2 · gomBaiXemTruoc` (số phép giữ 1201). |
| 24/09 | 9 | Bấm thử bằng Playwright kênh Chrome, DB tạm + API 4407 + Vite 5607, ảnh ở `thiet-ke/anh/pr-ux2/` (1440 + 375). **QL (2):** hàng điều khiển (tìm lớp · tab · ⓘ · nút); gõ `ft10` → gợi ý MB-FT 101/102; lưới MB-FT 101 ô cùng tuần 1 chip, khác tuần 2 dòng, `Xong … ✓`, ô cao bằng nhau; bấm chip → hộp: Lưu mờ ban đầu (Bổ sung sau rà #87 ✓), lùi 4 tuần → `Chặn: Trùng tuần W3 AUG với MT2 (L R W S)` Lưu tắt, lùi 3 → `Chỉ cách MT2 đúng một tuần` + nút `Vẫn xếp vào tuần này`, hợp lệ → `L: W3 SEP → W2 SEP · không trùng đợt khác`, lưu → chỉ L đổi; bỏ tích S không lý do → Lưu tắt, có lý do → S biến khỏi ô; `+ xếp` một em → 4 tuần mặc định (L R W tuần này, S tuần sau). **Hàng loạt:** MT4 cho 8 em → 3 em lưu, panel **giữ đúng 5 em lỗi** (R9b ✓, không tick lại cả lớp). **Lớp thường:** MB-FOU 12 `đề xuất W4/8`/`W8/8`, chip có `W…/8`, `sau khoá`; đổi S của Bùi Khánh Linh chỉ em đó đổi, hộp không có ô tích. **GVCN (7), GVBM (9):** không có tab, `/test/ke-hoach` → `/test/can-cham`. **375px:** `scrollWidth === innerWidth` (375), lưới cuộn ngang trong thẻ, cột tên dính, hộp là tấm dưới đáy, panel toàn màn, nút Lưu cao 44px dính đáy. Không thấy ISO, "Normal", "tuần 5", "RLW", ⚠. Chưa bấm: BC-ELE 01 (chi nhánh khác QL Monbay; kiểm bằng phép `UX2 · nhãn tuần n/N`) và nút `Xếp cả lớp theo đề xuất` (không lớp nào có em chưa có bài trong seed; `planRegularTests` có phép). |

### Lệch so với kế hoạch (sửa theo mã/đặc tả, không đổi hình dạng)

- `OKyNang` thêm `periodId` (tuần hiện có) — để hộp sửa khởi tạo bằng tuần hiện có (Bổ sung sau rà #87).
- `danhSachLop` thêm `chuongTrinh`; `tomTat` lớp thường chỉ còn `đang W8/8` (mockup: chương trình đứng cạnh chi nhánh: `Monbay · FOU · 4 HV`).
- Hộp kỹ năng dùng **bộ chọn tuần gọn** `TuanNho` (`‹ W3 SEP ›`, bấm giữa mở `WeekPicker` đầy đủ) thay vì bốn `WeekPicker` nguyên bản — `WeekPicker` cao 44px và `Tuần này` xuống dòng, hộp 4 dòng cao ~500px. Panel hàng loạt cũng dùng `TuanNho`.
- Đợt chưa có → hộp xem trước qua `/hang-loat` `xemTruoc` một em (không có route kiểm riêng cho đợt chưa tạo).
- Cột đợt lớp thường rộng 208px (kế hoạch 176px) để đủ chỗ nhãn `W8/8`; hộp rộng 372px.
- Xem trước hàng loạt: ô `Vẫn xếp {n} bài có cảnh báo` tick sẵn (như mockup); bỏ tick thì em có cảnh báo tính vào số "không lưu".
- Đổi loại lớp (Fast Track ↔ Lớp thường) xoá chữ tìm lớp.

## Bổ sung sau rà #87 (planning 23/09)

- `HopSuaTuan` chế độ **Sửa lịch**: khởi tạo bộ chọn tuần bằng **tuần hiện có của ô** (sau #87 WeekPicker tự phát tuần này khi `periodId` null → nút Lưu mở ngay, bấm nhầm là dời sang tuần này). Phép kiểm/bấm thử: mở ô "L · W4 SEP" → bộ chọn hiện W4 SEP, Lưu mờ tới khi đổi tuần.
