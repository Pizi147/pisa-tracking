# PISA Progress — Kế hoạch duy nhất

Cập nhật: **04/10/2026** (session planning, sau khi merge đợt 0–1, #182–#188).
File này **thay** cho: `plan.md` cũ (mục 0–24), `PROMPT_SESSION_CODE.md`, `PROMPT_BAN_GIAO_PLANNING.md`,
`docs/superpowers/plans/2026-10-03-lo-trinh-tong-hop-viec-chua-lam.md`. Bản cũ còn trong git: `git show 575e898d:plan.md`.

## 0. Dùng file này thế nào
- **Một nguồn duy nhất** cho: đã làm gì, còn gì, thứ tự, model, skill, prompt. Session planning sửa file này; session code
  chỉ thêm **một dòng** vào mục 11 (Nhật ký) khi xong PR.
- Kế hoạch chi tiết (từng Task, từng bước) chỉ giữ cho **PR chưa làm**. PR merge xong → session planning xoá file chi tiết
  của nó (git còn giữ). Hiện còn 7 file:

| File chi tiết | Dùng cho |
|---|---|
| `docs/superpowers/plans/2026-10-04-pr-phh-bao-ph-ban-chup.md` | PR-PHH (PHH-1→3) |
| `docs/superpowers/plans/2026-10-04-pr-so-so-lieu-don-ma.md` | PR-SO (SO-1→5) |
| `docs/superpowers/plans/2026-10-04-pr-u12-ket-qua-lop-thuong.md` | PR-U12 (U12-1→3) |
| `docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md` | PR-DH (DH-1→5), PR-SL (SL-1→2), mục A/B (quyết định 03/10) |
| `docs/superpowers/plans/2026-10-03-pr-l1-popover-bao-cao-loc-gv.md` | PR-DH: mục L1 (popover "Thiếu n"). L2, L3 đã xong ở PR-BC |
| `docs/superpowers/plans/2026-10-04-pr-dl-diem-theo-lop.md` | PR-DL (DL-0→7) |
| `docs/superpowers/plans/2026-10-02-ux-sau-critique.md` | PR-HK2 (H1, H2, K1 còn lại, K2, K4–K7, J1–J4, J7, J9), PR-SL (I1–I4, I6), PR-DH (H6, J6, J8, J10) |

- **Khi các nguồn mâu thuẫn:** theo `CLAUDE.md` (quyết định chủ sản phẩm + kế hoạch đã duyệt → Rulebook + mockup → skill).
  Luật sản phẩm: `thiet-ke/PISA-Rulebook-2026-09-19.md` (mục 20 ưu tiên nhất). Đặc tả chính: `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md`.
- Hỏi "còn gì chưa làm": đối chiếu với **mã thật** (grep), không tin ô tick (nhiều kế hoạch cũ đã merge mà ô vẫn trống).

## 1. Luật làm việc (mọi session)

### 1.1. Chủ sản phẩm
- **Không biết code.** Báo bằng tiếng Việt cơ bản, nói theo "cái thấy trên màn" trước, tên file sau.
- Muốn: dễ hiểu · dễ dùng · gọn; giao diện tinh tế (cột hàng thẳng, không dồn chữ, màu rõ). Hỏi **gộp một lần** (≤ 4 câu,
  mỗi câu có phương án + khuyến nghị); đủ tự tin thì tự quyết và liệt kê "tôi đã tự quyết". Mockup ghi rõ **nằm ở đâu**.
- **Không tự merge, không deploy, không gửi gì ra ngoài** khi chưa được bảo. Chủ sản phẩm chỉ merge khi planning nói "merge được".

### 1.2. Quy trình một PR
1. Nhánh mới **từ `origin/main` mới nhất**, một PR một session. PR có migrate dùng file riêng `server/src/migrate/<tênPR>.ts`.
2. Chưa có kế hoạch chi tiết → `superpowers:writing-plans` viết `docs/superpowers/plans/<ngày>-pr-<mã>-<tên>.md`; điểm cần
   chủ sản phẩm quyết → `superpowers:brainstorming` hỏi trước, không tự chọn.
3. Làm từng Task bằng `superpowers:subagent-driven-development`; mỗi Task `superpowers:test-driven-development`
   (phép kiểm **đỏ trên DB test trước**, sửa theo nguyên nhân; không khớp chuỗi nguồn cho xanh khi kiểm được hành vi);
   gặp lỗi lạ → `superpowers:systematic-debugging`.
4. `npm run check` xanh (**một lần một lúc, foreground**). Bấm thử bằng ẢNH THẬT: **375 và 1440, sáng và tối, ≥ 3 vai**
   (toàn hệ thống, quản lý chi nhánh, GV; thêm GVCN khi PR chạm lớp).
5. PR có giao diện: `/impeccable audit`. Mọi PR: `/ponytail-review`, `superpowers:verification-before-completion`,
   `superpowers:requesting-code-review`, `superpowers:finishing-a-development-branch` (mở PR, **không merge**).
6. Mô tả PR báo **từng ID**: tái hiện / bác bỏ (lý do), file sửa, phép kiểm bảo vệ, ảnh, giới hạn còn lại; liệt kê mọi chú
   thích `ponytail:`; ảnh sổ tay `docs/so-tay/` bị lệch.
7. Merge sau người khác → `git merge origin/main` vào nhánh, chạy lại `npm run check` trước khi báo xong.
   Xung đột ở `run.ts`, `schema.sql`, `routes/index.ts`, `CODE_MAP.md`, mục 11 file này: **giữ cả hai** (chỉ thêm dòng).
8. Xong: `[x]` trong kế hoạch chi tiết, một dòng mục 11, cập nhật `CODE_MAP.md` nếu thêm/xoá file.

### 1.3. Rà PR
- Người rà **luôn Opus 5.5** ở session/agent **khác** người code; kiểm model thật qua dòng `Co-Authored-By`.
- Rà trong worktree tách rời, `npm run check` một lần, bấm thử bằng ảnh thật, không chạm DB bản chính. Mẫu ở mục 10.
- Rà xong: planning soạn **tin nhắn sửa** (file:dòng) để chủ sản phẩm dán vào session code; sửa xong rà lại phần đã sửa.
  Việc nhỏ còn lại → ghi vào mục 4 file này (không để mất).

### 1.4. Kỹ thuật dễ vấp
| Chuyện | Làm thế nào |
|---|---|
| Biên dịch | `tsc`. **Không** dùng `tsx`/`esbuild` làm trình chạy TS. Import phải có đuôi `.ts`/`.tsx` |
| Sửa máy chủ | `npm run build:server` (`npm run dev` không tự dựng lại máy chủ) |
| Kiểm | `npm run check` = build + test + typecheck. Phép kiểm mới: file `server/src/tests/pr<Mã>.tests.ts`, gọi ở **cuối** `run.ts` |
| `shared/domain/*` | Hàm mới re-export qua `shared/domain/index.ts` |
| Ngày demo | **14/09/2026** cố định: `demoToday()` (máy chủ), `session.demoDate` (web). Tuần T2→CN, thuộc tháng chứa thứ Năm |
| Thời gian trên màn | Mã tuần `W2 OCT`; ngày chỉ cho hạn cụ thể, ngày thi, ngày sinh, nhật ký |
| Chép DB SQLite | Chép cả `.sqlite`, `.sqlite-wal`, `.sqlite-shm` |
| Turso | Không tham số đặt tên; `UNION` ≤ 20 vế; ≤ 900 tham số; `BEGIN IMMEDIATE`; đường API mới có trần ở `tocDoDuong.ts` |
| Cổng | Không dùng 4000/5173 khi chạy song song: đặt `PORT` (API) và `WEB_PORT` (web), mỗi session một cặp riêng |
| Đăng nhập demo | `POST /api/demo/session {userId}` (admin=1, QL=2, GVCN=7, GVBM=9, GVBM Writing=10) hoặc tab "Vào nhanh" |
| DB bản chính | Không bao giờ `netlify deploy --prod`, `--context production`, hay chạm DB `pisatracking` — đó là bước tay của chủ sản phẩm (`TRIEN_KHAI.md`) |
| Dọn | Xong việc tắt mọi tiến trình, xoá file Vite tạm, gỡ worktree |

### 1.5. Bẫy đã gặp — đừng lặp lại
1. File chưa commit bị GitHub Desktop cất vào stash khi đổi nhánh → planning **commit + push ngay**.
2. PR tài liệu có thể đã merge trước khi đẩy thêm commit → `gh pr view <n> --json state` trước khi đẩy; MERGED thì mở PR mới.
3. PR xếp chồng merge vào nhánh khác chứ không vào main → luôn mở PR thẳng vào `main`.
4. Session code hay chạy model nhỏ hơn kế hoạch → kiểm `Co-Authored-By`; PR giao diện model nhỏ từng lọt lỗi hình → rà bằng ảnh.
5. Lỗi chỉ lộ trên Turso (tham số đặt tên, UNION > 20 vế, SQLITE_BUSY) → rà kỹ PR chạm SQL mới.
6. Nhiều agent song song → chạm giới hạn lượt dùng; agent ghi báo cáo dần, dùng SendMessage chạy tiếp agent bị ngắt.
7. `npm run check` chạy chồng làm treo hàng giờ → mỗi session một lần một lúc, quét tiến trình trước khi kết thúc.
8. Chủ sản phẩm có thể merge trước khi rà → nhắc "chờ planning nói merge được"; lỡ merge thì rà sau merge.
9. Tên skill đúng là `superpowers:<tên>` (một số kế hoạch cũ ghi nhầm `anthropic-skills:`).

## 2. Đã làm (đã merge vào `main`, kiểm bằng `gh pr list` 04/10)

| Giai đoạn | PR (số GitHub) | Nội dung chính |
|---|---|---|
| Demo đầu tiên (08–17/09) | #1–#17 | Bản demo chạy trên máy |
| Sau PR18 (18–20/09) | #18–#30 | PR1 số khớp danh sách, PR-A Case Ý thức, PR2 bộ chọn tuần + Kế hoạch Test, PR-C form Case, PR-D khung Case, PR-E…I (nền giao diện, hợp đồng số liệu, dấu "-", hồ sơ Test, biên tập chữ) |
| Lộ trình 8 PR + v3 (21–22/09) | #31–#66 | PR-N bằng chứng, PR-J Ý thức vi phạm/biện pháp, PR-T máy chủ v3, PR-K/K2/K3 giao diện Ý thức, PR-Z2a/b/b2 hạ tầng Netlify + Turso, PR-HV hồ sơ HV, PR-S1, PR-O 4 khu vực, PR-AN an toàn, PR-S2 |
| Trước deploy lần 1 (22–24/09) | #67–#103 | PR-Pa, Qa, Qb, Rc1, Rc2, Form, Pb, TD tốc độ, YT2/YT2b, Ra, LT, UX0–UX5 overhaul, Z2c (deploy bản chính), XOA |
| Nâng cấp 6 đợt (26/09–01/10) | #104–#162 | Đợt 1 N1·LOP·NEN · đợt 2 DUYET·MT·NHAP·MON·KCK · đợt 3 XLMT·SOS·YT4 · đợt 4 HSM·XUAT·HVL·SANG · đợt 5 GV·LT2a·LT2b·CT · đợt 6 Pb2·VAI-a/b·UXF-a/b·UXD·S6F·Dọn-a·S3 + sửa sau rà S3f…S6f |
| Deploy + UX 02/10 (01–03/10) | #160–#180 | Reset tại chỗ, PR-DEPLOY, sổ tay GV/QL, S3 nốt, tốc độ tách trang, Dọn-b, UX-G (G1–G5), HK1 (K3, K1 điện thoại, H3–H5), Ý thức thang mới, **PR-PH** (hết báo đăng xuất giả). **Bản chính đã deploy 03/10** |
| Đợt 0–1 sau deploy (04/10) | #182–#188 | **QU** quyền + tạo lớp hàng loạt + GVCN phân công + GV đóng Case · **GVa** F01/D13 khoá gửi, F03, F04 · **LM** lịch MT linh hoạt (LM-1→7, gồm I5 và I4 phần MT) · **GVb** Chờ duyệt (D01/Q-B, J5, J5b, U01, Bị từ chối) · **BC** Báo cáo đơn vị + Tài khoản (L2, L3, D8, D9, J10 phần Quản trị) · **NT** Target + Dự kiến thi lớp thường, dán không tiêu đề |

Còn treo của các PR đã xong (đã đưa vào mục 4): PR-PH bước bấm thử + ảnh dải "Mất kết nối" → HK2. PR-GVb G5: Công việc ›
"Của GV" chưa có "Nhắc tất cả" → hoãn (mục 8).

## 3. Quyết định còn hiệu lực cho việc chưa làm
| Ngày | Quyết định | Vào PR |
|---|---|---|
| 03/10 | F02: lưu **bản chụp nội dung lúc xác nhận** báo PH từ nay; việc cũ ghi "Chưa lưu nội dung lúc báo — dưới đây là nội dung hiện tại", không điền ngược | PHH |
| 03/10 | DB bản chính cũ **đã xoá** → gỡ mã chuyển dữ liệu cũ (D3 đồng ý: một hàm chọn lộ trình) | SO |
| 03/10 | Q-0310-3: panel sửa cả lớp gồm Họ tên, Ngày sinh, Email, Tuần bắt đầu, Dự kiến thi, Target, Điểm đầu vào | SL |
| 03/10 | Q-0310-4: "Học viên tiếp theo" đi theo danh sách vừa mở; mở bằng link thì theo lớp, A→Z | DH |
| 03/10 | D7 thanh trên điện thoại theo mockup 23C | HK2 |
| 04/10 | Lớp thường có Target + Dự kiến thi: **cột ở bảng hồ sơ lớp thường làm ở PR-DH**; PR-SL, PR-DH (cột Dự kiến thi) áp cả lớp thường | DH, SL |
| 04/10 | **Một mẫu Excel chung:** dán không tiêu đề ở lớp thường đọc đúng thứ tự cột Fast Track (`cotLuoiNhap(false)`); cột lớp thường không dùng tự bỏ qua kèm lưu ý; có tiêu đề thì khớp theo tên; sửa câu "Đã đọc theo thứ tự cột…" (`shared/domain/nhapHocVien.ts` `docDongDan`, phép kiểm `prNt.tests.ts`) | SL |
| 04/10 | **Cấm cấp riêng `plan.week` cho người chỉ có vai GV** (`shared/domain/nhomQuyen.ts` `duocCapRieng` + `server/src/platform/accounts.ts`), có phép kiểm | SO |
| 04/10 | Dọn khoá `bulkclass:*` trong `demo_config` cũ hơn 7 ngày | SO |
| 04/10 | "Vắng" (`-`) thống nhất giữa lưới cả lớp và màn từng kỹ năng, có **Hoàn tác** (gộp K4) | HK2 |
| 04/10 | C02: **giữ chặn** — GVCN không dạy môn đó không ghi bù Case môn đó | (không làm) |
| 04/10 | Điểm theo lớp: mockup `thiet-ke/mockup-diem-theo-lop-2026-10-04.html` đã duyệt | DL |
| 04/10 | Deploy **sau mỗi đợt** | mục 5 |

## 4. Việc chưa làm — 8 PR

### PR-PHH · Báo PH lưu bản chụp (M, có migrate) — kế hoạch `2026-10-04-pr-phh-bao-ph-ban-chup.md`
- **F02.** Lưu 4 nội dung lúc xác nhận việc `bao_ph_tvv` (cột `noi_dung_luc_bao`, migrate `prPhh`); dòng cũ hiện "Chưa lưu nội
  dung lúc báo — dưới đây là nội dung hiện tại", không điền ngược. Mã thật: việc đã xong **không mở lại được** → không cần quy tắc phiên bản.

### PR-DH · Học viên & Lớp + hồ sơ (L) — kế hoạch có sẵn, cần thêm task
- DH-1 "Sắp tới" có kỳ vọng / "Thi thật" · DH-2 cột "Dự kiến thi" (**cả lớp thường**) · DH-3 hồ sơ HV Trước/Sau · DH-4 hồ sơ lớp
  Quay lại + Lớp trước/sau · DH-5 hàng chip đầu trang (= K1 phần desktop: gộp "Tất cả" + dropdown "Loại lớp").
- **Thêm (viết task cuối kế hoạch):** cột **Target + Dự kiến thi ở bảng hồ sơ lớp thường** (quyết định 04/10) · **L1** popover
  "Thiếu n" (file L1) · **H6** chip "+1" dòng lớp bấm mở được · **D1** badge "n HV chưa có lệnh chuyển lớp" khớp số dòng có cờ ·
  **J6** "TARGET" → "Mục tiêu" (kiểm `thiet-ke/THUAT_NGU_DA_CHOT.md` trước) · **J8** chữ bị cắt ("Ghi kết q…", "L, R, W1, W…") ·
  **J10** hồ sơ HV bỏ "chưa có dữ liệu" lặp · bấm thử panel Chuyển lớp có đè demo bar không (có thật mới sửa).
- Kế hoạch viết trước khi LM, NT merge → **kiểm lại số dòng** trước khi làm.

### PR-SO · Số liệu & dọn mã (M, chỉ máy chủ) — kế hoạch `2026-10-04-pr-so-so-lieu-don-ma.md`
- **D2** một hàm chọn PA đại diện nhóm Bổ trợ (Tổng quan ↔ Công việc khớp) · **cấm cấp riêng `plan.week` cho người chỉ có vai GV** ·
  **D5** cờ nút ở hồ sơ HV khớp quyền route · **D4** xoá `completeIntervention` · **D3** (nhỏ) · tín hiệu của em đã kết thúc không
  "sống lại" · dọn khoá `bulkclass:*`/`intake:*` cũ · **DEP-gỡ** mã chuyển dữ liệu cũ, `chay-thu:*`, `kiem-lop-mo-coi`.
- Đã kiểm 04/10 và **bỏ** (đã làm ở PR khác): giới hạn thử đăng nhập/đăng ký, lỗi không lộ SQL, `/api/health`, đếm bằng chứng theo lô,
  `canRecordViolation`, `confirmMeasure`, `recentByStudent`.

### PR-SL · Sửa cả lớp + panel/form (L) — kế hoạch có sẵn (SL-1, SL-2), cần thêm task
- SL-1 máy chủ xem trước + lưu một giao dịch · SL-2 panel "Sửa thông tin cả lớp" (không dán Excel).
- **Thêm:** **một mẫu Excel chung** (mục 3) · **I1** "Đóng"/"Huỷ thay đổi" ở `KhungPanel`/`Drawer` · **I2** form Tạo Case
  (không chọn sẵn mức độ, placeholder "Chọn nhóm", W1/W2, bộ chọn tuần) · **I3** panel Thêm HV (chữ cắt, phông, nút dưới ô dán,
  lời nhắc 2 dòng) · **I4** Drawer → KhungPanel phần còn lại (GvCham, ScoreEntry, NhanXet, DeleteViolationConfirm,
  StudentDetailPage; kiểm `MockDetailPage` đã xong ở LM chưa) · **I6** panel Ghi vi phạm · **D11** lỗi dưới ô nối
  `aria-describedby` (`ui/ui.tsx` Field, `ui/KhungPanel.tsx` Truong).

### PR-DL · Điểm theo lớp (L) — kế hoạch có sẵn (DL-0→7), mockup đã duyệt
- Nhập điểm cả lớp theo từng lượt (FT: MT1, MT2, … kể cả lịch sử; lớp thường: bài theo lịch riêng của lớp). DL-0 sai giả
  định G2 thì dừng hỏi. `DauTrangLop.tsx`: chỉ thêm một mục menu ⋮.

### PR-U12 · Kết quả kiểm tra lớp thường ở hồ sơ HV (S) — kế hoạch `2026-10-04-pr-u12-ket-qua-lop-thuong.md`
- Chủ sản phẩm 04/10: **làm, giống bảng Mock Test** (K4-33): ô kết quả nói một lần ("Chờ n môn" khi chấm dở), bấm tên bài là mở,
  bỏ link "Bảng điểm đợt ›", nhãn lịch sử / đã huỷ / huỷ phần / dời; nhiều bài cùng loại thì đánh số.

### PR-K26 · Lộ trình tiếp theo theo dải % Cuối khoá (M) — **cần brainstorming + mockup trước** (session planning)
- Chủ sản phẩm 04/10: **làm K2-26** (`thiet-ke/ra-27-09/K2.md` dòng K2-26; Rulebook §20.6 dải < 50 · 50–59 · 60–69 · ≥ 70).
- Đã có (PR-LT2b): đầu panel `LoTrinhTiepPanel.tsx` hiện `Cuối khoá 58% · không đạt …` + câu gợi ý.
- Còn: (2) hướng gợi ý đứng đầu, các hướng khác thu vào "Hướng khác ▾" · (3) em 50–59%: nút chính **"Gửi QL quyết"** (thẻ Chờ duyệt
  "Quyết định Cuối khoá", lý do bắt buộc) · (4) gộp "Chưa rõ"/"Xếp sau" thành một hướng "Chưa quyết · xem lại …" (đụng dữ liệu
  `Huong` ở `shared/domain/lenLop.ts`) · (5) "Ghi hướng cho cả lớp" từ đầu hồ sơ lớp (GVCN).
- Planning hỏi chủ sản phẩm: phần (3) có còn cần sau PR-CT (Quản lý đã quyết chuyển lớp)? (4) đổi dữ liệu hay chỉ đổi nhãn? (5) làm luôn hay hoãn?
  → mockup → kế hoạch `2026-10-0x-pr-k26-…md` → session code.

### PR-HK2 · Badge & chữ, chụp lại sổ tay (L, cuối cùng) — kế hoạch có sẵn một phần
- `2026-10-02-ux-sau-critique.md`: **H1/H2** ba họ chip · **K1** còn lại (nếu DH chưa làm hết) · **K2** Phân tích › Tổng hợp ·
  **K5** demo bar điện thoại · **K6** chữ nội dung 12 px · **K7** một kiểu icon ⋯ · **J1–J4, J7, J9** chữ.
- **Thêm:** **K4 + "Vắng" thống nhất** lưới cả lớp ↔ màn từng kỹ năng, có Hoàn tác (quyết định 04/10) · **D7** thanh trên điện
  thoại theo mockup 23C · bấm thử: chữ "Khác" mơ hồ, trạng thái rỗng trang lưu trữ, khoảng trống hồ sơ cá nhân (có thật mới sửa) ·
  dải "Mất kết nối" của PR-PH (nút "Đang thử…", `role=status`, ảnh) · toast Hoàn tác sau khi ghi vi phạm (Y_THUC §7.2) nếu
  dựng chung toast · **chụp lại toàn bộ ảnh sổ tay** `docs/so-tay/`.

## 5. Đợt chạy, thứ tự merge, deploy

Chủ sản phẩm 04/10: **đồng ý gộp còn 3 đợt**; **deploy một lần ngay** (bản `main` hiện tại, gồm đợt 0–1), rồi **chỉ deploy lần
nữa khi xong hết** mọi PR dưới đây (không deploy theo từng đợt).

| Đợt | Chạy cùng lúc (mỗi PR một session) | Thứ tự merge | Vì sao không đụng nhau |
|---|---|---|---|
| **2** (ngay) | **PHH** · **DH** · **SO** | PHH → SO → DH | PHH: `phoiHop.ts` + migrate · SO: máy chủ số liệu, `migrate.ts` (gỡ mã cũ, giữ migrate PHH) · DH: `StudentsPage`, `BangHocVienLop`, `standing.ts`, hồ sơ. Chồng nhẹ: SO ↔ DH ở `profile.ts`, SO ↔ PHH ở `run.ts`/`migrate.ts` |
| **3** | **U12** · **DL** · **SL** · **K26** (chờ DH merge; K26 chờ thêm kế hoạch) | U12 → DL → K26 → SL | U12: một bảng hồ sơ HV · DL: module điểm mới + một mục ⋮ · K26: `LoTrinhTiepPanel`, `lenLop.ts` · SL: panel/form chung. Chồng nhẹ: `DauTrangLop` (SL, DL, K26 thêm mục ⋮), `StudentDetailPage` (SL I4 ↔ U12). SL merge cuối: kiểm lại chân panel của DL, K26 theo luật I1 |
| **4** | **HK2** (một mình) | — | Đụng ~15+ file khắp web, chụp lại sổ tay một lần |

**Deploy lần sau (sau HK2)** — làm một lần cho cả 8 PR, theo `TRIEN_KHAI.md` mục 8 và 11.1:
1. Sao lưu bản chính (`npm run sao-luu`).
2. Tập dượt trên **bản sao DB bản chính** (DB tạm): `npm run migrate` hai lần (lần hai không đổi gì) — có migrate PHH và bản đã gỡ mã cũ của SO.
3. Bấm thử 375/1440 sáng/tối, ba vai: báo PH đã làm giữ nội dung; Học viên & Lớp cột mới, Trước/Sau; sửa cả lớp; Điểm theo lớp
   (FT + lớp thường, bài đã qua); bảng kết quả lớp thường; Lộ trình tiếp theo theo dải %; badge/chữ toàn web.
4. Báo GV trước (đổi giao diện rộng), rồi deploy.

DB THỬ (`pisatracking-demo`): không cần giữ tương thích; muốn dùng lại thì seed lại sau lần deploy sau.

## 6. Model, effort, skill cho từng PR
Chọn model ở ô chọn model **trước khi dán prompt**. Subagent cùng model với session (không Haiku). Người rà: Opus 5.5, session khác.

| PR | Khuyến nghị | Phương án B | Vì sao | Ponytail | Impeccable | Superpowers riêng |
|---|---|---|---|---|---|---|
| **PHH** | Opus 5.5 · High | Sonnet 5.5 · High | Có migrate, dữ liệu báo phụ huynh không được sai | lite (giao diện nhỏ) | `clarify` · `audit` | — (kế hoạch có sẵn) |
| **DH** | Opus 5.5 · High | Sonnet 5.5 · High | Giao diện rộng, nhiều cột; model nhỏ từng lọt lỗi hình | lite | `critique` (chỉ đầu trang, DH-5) · `layout` · `clarify` (J6, J8, J10) · `adapt` (375) · `audit` | writing-plans (thêm task cuối kế hoạch) |
| **SO** | Opus 5.5 · XHigh | Fable 5.1 · High | Gỡ mã migrate + gom hàm số liệu dùng chung: sai là lệch số hoặc hỏng nâng cấp DB | full | — | `/security-review` cuối PR |
| **U12** | Sonnet 5.5 · High | Opus 5.5 · Medium | Một bảng, theo mẫu đã có | lite | `layout` · `clarify` · `audit` | — |
| **DL** | Opus 5.5 · High | Fable 5.1 · High | Tính năng mới, refactor `classScoreSheet`/`regularSheet` không được đổi kết quả cũ | lite | `layout` · `clarify` · `adapt` (375) · `audit` | brainstorming nếu DL-0 lệch G2 |
| **K26** | Opus 5.5 · High | Fable 5.1 · High | Luật dải % + thẻ Chờ duyệt mới + có thể đổi dữ liệu hướng | lite | `layout` · `clarify` · `harden` · `audit` | (planning: brainstorming + mockup + writing-plans trước) |
| **SL** | Opus 5.5 · High | Fable 5.1 · High | Ghi nhiều bảng một giao dịch + đổi khung panel dùng chung | lite | `layout` · `harden` (lỗi dưới ô, D11) · `clarify` (I2, I3, I6) · `audit` | writing-plans (thêm task) |
| **HK2** | Opus 5.5 · High | Sonnet 5.5 · High | ~15+ file, giữ nhất quán ba họ chip; chụp ảnh sổ tay giao subagent | lite | `polish` · `clarify` (J) · `adapt` (K4, K5, D7) · `audit` toàn web | writing-plans (kế hoạch bổ sung) · dispatching-parallel-agents (chụp ảnh) |
| Rà PR | Opus 5.5 · High (SO, SL: XHigh) | — | Người rà khác người code | — | — | requesting-code-review (phía rà), receiving-code-review (phía code khi nhận tin sửa) |
| Session planning | Opus 5.5 · XHigh | Opus 5.5 · High | Viết kế hoạch + rà cần suy luận dài | — | `critique` khi cần | brainstorming · writing-plans · dispatching-parallel-agents |

## 7. Chủ sản phẩm đã trả lời 04/10
1. Gộp đợt: **đồng ý** (3 đợt). 2. U12: **làm, giống bảng Mock Test**. 3. Deploy: **một lần ngay, lần sau khi xong hết** (mục 5).
4. A12: **giữ tên** "Điều chỉnh cách dạy" (đóng). K2-26: **làm** → PR-K26 (còn 3 câu ở mục 4, hỏi khi soạn mockup).

## 8. Hoãn có chủ ý · Đã chốt không làm
- **Hoãn:** UX-D7 bảng quản trị → thẻ trên điện thoại · Thêm HV dạng thẻ điện thoại · xu hướng Phân tích, xu hướng Phân tích GV
  (chờ 2–3 tháng dữ liệu) · KPI tháng GV · D15 hiệu quả PA theo SOS lúc sinh · taxonomy vấn đề · Công việc › "Của GV" "Nhắc tất cả"
  (GVb G5) · kho ý tưởng Rulebook §20.
- **Đã chốt 04/10:** A12 giữ tên "Điều chỉnh cách dạy".
- **Không làm:** GV-C1 chấm đúng hạn lịch sử · góc Phân tích › Giáo viên cũ · mockup 26 bản 3–4 · Q12 em tạm dừng · ba ý tưởng
  §20.1 · B7 (giữ mã) · C02 (giữ chặn) · `/api/health` hỏi DB và các mục "không cần làm" của bản chính (Blobs, thứ tự Tutor,
  `demo_config` mốc nâng cấp, `sao-luu` không giao dịch).

## 9. Prompt

### 9.0. Phần chung — mọi prompt session code đều ngầm gồm
```
Đọc trước: CLAUDE.md, plan.md (mục 1 Luật làm việc, mục 3 Quyết định, mục 4 dòng của PR này).
Nhánh mới từ origin/main mới nhất. Skill: superpowers:subagent-driven-development (mỗi Task một subagent cùng model),
superpowers:test-driven-development (đỏ trên DB test trước), superpowers:systematic-debugging khi lỗi lạ,
superpowers:brainstorming nếu cần chủ sản phẩm quyết (dừng, hỏi), superpowers:verification-before-completion,
superpowers:requesting-code-review, superpowers:finishing-a-development-branch (mở PR vào main, KHÔNG merge).
npm run check xanh (một lần một lúc) → bấm thử 375/1440 sáng/tối, ≥ 3 vai, ảnh thật → /impeccable audit (nếu có giao diện)
→ /ponytail-review. Xong: [x] kế hoạch chi tiết, một dòng mục 11 plan.md, CODE_MAP.md nếu thêm/xoá file. Mô tả PR: từng ID
(tái hiện/bác bỏ, file, phép kiểm, ảnh), chú thích ponytail:, ảnh sổ tay lệch. Cổng PORT/WEB_PORT riêng, không 4000/5173.
```

### 9.1. Đợt 2 — chạy ngay (sau khi deploy bản hiện tại), ba session song song

**PR-PHH** — Opus 5.5 · High (B: Sonnet 5.5 · High)
```
/ponytail lite
Làm PR-PHH theo docs/superpowers/plans/2026-10-04-pr-phh-bao-ph-ban-chup.md (PHH-1 → PHH-3, prompt chung plan.md mục 9.0).
Nhánh pr-phh-bao-ph-ban-chup. Kiểm lại số dòng trong mã thật trước mỗi Task (kế hoạch viết 04/10 trên main 575e898d).
Impeccable: PHH-2 /impeccable clarify, cuối /impeccable audit khối Phối hợp. Merge trước SO và DH.
```

**PR-DH** — Opus 5.5 · High (B: Sonnet 5.5 · High)
```
/ponytail lite
Làm PR-DH theo docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md (mục A, B, "PR-DH", DH-1 → DH-5)
và plan.md mục 4 "PR-DH". Nhánh pr-dh-bang-dieu-huong.
Kế hoạch viết trước khi PR-LM, PR-NT merge: kiểm lại số dòng/tên hàm trong mã thật trước mỗi Task.
Trước khi làm, dùng superpowers:writing-plans viết thêm task vào cuối kế hoạch cho: cột Target + Dự kiến thi ở bảng hồ sơ
lớp thường; L1 popover "Thiếu n" (docs/superpowers/plans/2026-10-03-pr-l1-popover-bao-cao-loc-gv.md mục L1); H6 chip "+1"
bấm mở được; D1 badge chuyển lớp khớp số dòng có cờ; J6 (kiểm thiet-ke/THUAT_NGU_DA_CHOT.md trước khi đổi "Target"); J8 chữ
bị cắt; J10 hồ sơ HV; bấm thử panel Chuyển lớp có đè demo bar không (có thật mới sửa).
Impeccable: DH-5 /impeccable critique CHỈ vùng đầu trang Học viên & Lớp rồi /impeccable layout; DH-2, DH-4 /impeccable layout;
J6/J8/J10 /impeccable clarify; 375 px /impeccable adapt; cuối /impeccable audit.
Bấm thử Trước/Sau với bộ lọc "Cần làm" và với link mở thẳng. Merge sau PHH và SO.
```

**PR-SO** — Opus 5.5 · XHigh (B: Fable 5.1 · High)
```
Làm PR-SO theo docs/superpowers/plans/2026-10-04-pr-so-so-lieu-don-ma.md (SO-1 → SO-5, prompt chung plan.md mục 9.0).
Nhánh pr-so-so-lieu-don-ma. Không giao diện (trừ khoá một ô tích ở SO-2): ponytail full.
SO-4 có cổng 🛑: kê danh sách mã định gỡ vào mô tả PR TRƯỚC khi xoá; không chắc thì giữ.
Cuối PR /security-review trên diff. Merge sau PHH (merge origin/main vào nhánh, giữ migratePrPhh, chạy lại check), trước DH.
```

### 9.2. Đợt 3 — sau khi DH merge

**PR-U12** — Sonnet 5.5 · High (B: Opus 5.5 · Medium)
```
/ponytail lite
Làm PR-U12 theo docs/superpowers/plans/2026-10-04-pr-u12-ket-qua-lop-thuong.md (U12-1 → U12-3, prompt chung plan.md mục 9.0).
Nhánh pr-u12-ket-qua-lop-thuong. Impeccable: U12-1 /impeccable layout, U12-2 /impeccable clarify, cuối /impeccable audit.
Merge đầu tiên trong đợt 3.
```

**PR-DL** — Opus 5.5 · High (B: Fable 5.1 · High)
```
/ponytail lite
Làm PR-DL theo docs/superpowers/plans/2026-10-04-pr-dl-diem-theo-lop.md (DL-0 → DL-7). Nhánh pr-dl-diem-theo-lop.
Mockup đã duyệt: thiet-ke/mockup-diem-theo-lop-2026-10-04.html. DL-0 sai Giả định G2 thì dừng, hỏi chủ sản phẩm (brainstorming).
Không thêm đường ghi điểm mới; không tự tạo lịch; sửa ô có điểm đi đường override có lý do; kiểm quyền trước khi đọc dữ liệu.
Impeccable: DL-5, DL-6 /impeccable layout, /impeccable clarify, /impeccable adapt (375); cuối /impeccable audit.
DauTrangLop: chỉ thêm một mục menu ⋮. Merge sau U12, trước K26 và SL.
```

**PR-K26** — Opus 5.5 · High (B: Fable 5.1 · High). *Prompt đầy đủ viết sau khi session planning brainstorm + mockup với chủ sản phẩm.*
```
/ponytail lite
Làm PR-K26 theo docs/superpowers/plans/2026-10-0x-pr-k26-lo-trinh-tiep-theo-dai.md (planning viết) và plan.md mục 4 "PR-K26".
Nhánh pr-k26-lo-trinh-tiep-theo. Impeccable: /impeccable layout, /impeccable clarify, /impeccable harden, cuối /impeccable audit.
Merge sau DL, trước SL.
```

**PR-SL** — Opus 5.5 · High (B: Fable 5.1 · High)
```
/ponytail lite
Làm PR-SL theo docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md (mục B Q-0310-3, "PR-SL", SL-1 → SL-2)
và plan.md mục 4 "PR-SL". Nhánh pr-sl-sua-ca-lop.
Trước khi làm, dùng superpowers:writing-plans viết thêm task cuối kế hoạch cho: một mẫu Excel chung (plan.md mục 3, 04/10;
phép kiểm: cùng một dòng Excel FT dán vào lớp FT và lớp thường đều ra đúng Họ tên / Ngày sinh / Email / Target / Dự kiến thi /
Tuần bắt đầu); I1, I2, I3, I4 phần còn lại, I6 (docs/superpowers/plans/2026-10-02-ux-sau-critique.md mục UX-I); D11 aria-describedby.
SL-1: gọi lại updateStudent / updateCycle / setBaseline / reviseTarget, không viết lại luật; một giao dịch; phép kiểm cookie QL và GVCN.
Impeccable: /impeccable layout + /impeccable harden (SL-2, D11, I1), /impeccable clarify (I2, I3, I6), cuối /impeccable audit.
Merge cuối đợt 3: merge main vào nhánh, kiểm lại chân panel của PR-DL và PR-K26 theo luật I1.
```

### 9.3. Đợt 4 — sau khi mọi PR trên merge

**PR-HK2** — Opus 5.5 · High (B: Sonnet 5.5 · High)
```
/ponytail lite
Làm PR-HK2 theo prompt "PR-HK2 — sau deploy" trong docs/superpowers/plans/2026-10-02-ux-sau-critique.md và plan.md mục 4 "PR-HK2".
Nhánh pr-hk2-badge-chu. Trước khi làm, dùng superpowers:writing-plans viết kế hoạch bổ sung cho các mục "Thêm" ở plan.md
(K4 + "Vắng" thống nhất có Hoàn tác, D7 mockup 23C, J1–J4, J7, J9, ba mục bấm thử, dải "Mất kết nối", toast Hoàn tác vi phạm).
Impeccable: /impeccable polish (H1, H2, K6, K7), /impeccable clarify (J), /impeccable adapt (K4, K5, D7), cuối /impeccable audit toàn web.
Chụp lại toàn bộ ảnh docs/so-tay/ trong PR này (superpowers:dispatching-parallel-agents, mỗi agent một nhóm trang, cùng model).
```

## 10. Mẫu giao việc cho agent (session planning dùng)

### A. Agent soạn kế hoạch (Opus 5.5, chạy nền, mỗi PR một agent)
```
Repo D:\Github\Pisa-tracking. git fetch origin; đọc origin/main mới nhất. KHÔNG sửa mã, KHÔNG commit, KHÔNG đổi nhánh thư mục chính.
Chỉ viết ĐÚNG MỘT file docs/superpowers/plans/<ngày>-pr-<mã>-<tên>.md (planning sẽ commit). Đọc CLAUDE.md, plan.md mục 1, 3, 4.
ĐỌC MÃ THẬT (file:dòng), không tin ô tick. Mẫu cấu trúc: 2026-10-04-pr-dl-diem-theo-lop.md (Goal, Architecture, Global
Constraints, Skill bắt buộc, Task có bước đỏ/xanh, Nghiệm thu, Prompt, Giả định). ≤ 600 dòng.
BÁO LẠI (≤ 40 dòng): đường dẫn, số Task, bảng tự quyết, mâu thuẫn nguồn ↔ mã, ≤ 2 câu cần chủ sản phẩm quyết (có khuyến nghị),
migrate?, file chồng với PR cùng đợt. Ghi báo cáo DẦN (phòng bị ngắt).
```

### B. Agent rà PR (luôn Opus 5.5)
```
Bạn là NGƯỜI RÀ ĐỘC LẬP. KHÔNG sửa mã nhánh, KHÔNG push, KHÔNG comment GitHub, KHÔNG merge. Chặn Critical/Important; Minor ghi ngắn.
1. Worktree tách rời trong scratchpad: git fetch origin; git worktree add --detach "<scratchpad>\<tên>" origin/<nhánh>.
   Nhánh chưa chứa origin/main mới nhất → git merge origin/main trong worktree. npm ci; npm run check MỘT lần.
2. Diff git diff origin/main...HEAD đối chiếu kế hoạch PR + plan.md mục 3–4. Tìm: sai luật nghiệp vụ, lộ dữ liệu ngoài quyền
   (gửi API thẳng bằng vai khác), số không khớp danh sách khi bấm, N+1 (đường mới phải có trần ở tocDoDuong.ts), SQL hỏng trên
   Turso, migrate không chạy lặp được, mất tính năng cũ.
3. Bấm thử theo vai (QL, GVCN, GVBM) + 375/1440 bằng ẢNH THẬT: npm run seed → API PORT=<API> node dist-server/server/src/index.js
   (nền) → Vite WEB_PORT=<web> (proxy /api → 127.0.0.1:<API>). Playwright npm i --no-save playwright, chromium.launch({ channel:
   'chrome' }); đăng nhập POST /api/demo/session {userId}. Git Bash: MSYS_NO_PATHCONV=1. Không chạm Turso/netlify.
4. Model thật: git log --format=%B origin/main..origin/<nhánh> | grep Co-Authored.
5. Dọn: tắt tiến trình, gỡ worktree (Windows tên dài: cmd /c "rmdir /s /q \\?\<đường dẫn>"; git worktree prune).
BÁO LẠI (≤ 70 dòng): MERGE ĐƯỢC / MERGE ĐƯỢC SAU KHI SỬA <…> / CHƯA MERGE; số phép kiểm; Critical/Important (file:dòng + tình
huống + cách sửa); Minor ≤ 8 dòng; việc kế hoạch giao mà chưa làm.
```

### C. Prompt mở session planning mới (khi session này quá dài)
```
Bạn là SESSION PLANNING của PISA Progress (Opus 5.5 · XHigh). Bạn KHÔNG code sản phẩm: brainstorm (có mockup), viết/sửa kế
hoạch, rà PR do session code làm, soạn prompt, giữ plan.md. Đọc: CLAUDE.md, plan.md (toàn bộ), rồi git log --oneline -12 và
gh pr list --state all --limit 12. Tóm tắt cho chủ sản phẩm ≤ 10 dòng: đang ở đợt nào, PR nào chờ rà, việc tiếp theo (kèm
model/effort), họ cần làm gì. Rồi chờ yêu cầu.
```

## 11. Nhật ký (một dòng mỗi PR, mới nhất trên cùng, ≤ 2 dòng chữ)
Nhật ký chi tiết tới 04/10 ở `git show 575e898d:plan.md` (mục 14) và mô tả từng PR trên GitHub.

| Ngày | PR / nhánh · model | Kết quả |
|---|---|---|
| 04/10/2026 | PR-PHH · `pr-phh-bao-ph-ban-chup` | F02: Báo PH đã xong luôn hiện 4 nội dung lúc xác nhận (cột `noi_dung_luc_bao`, migrate chỉ thêm); dòng cũ ghi rõ "chưa lưu". `npm run check` xanh (2496 + 33). |
| 04/10/2026 | Planning (Opus 5.5) · `ke-hoach-thong-nhat-04-10` | Gộp mọi kế hoạch vào plan.md này; xoá kế hoạch/kiểm kê/rà soát của PR đã merge. Chủ sản phẩm trả lời mục 7; kế hoạch PHH, SO, U12; thêm PR-K26; còn 8 PR, 3 đợt |
