# PISA Progress — Kế hoạch duy nhất

Cập nhật: **04/10/2026 tối** (session planning, sau khi merge đợt 2: PHH #191, SO #190, DH #192).
File này **thay** cho: `plan.md` cũ (mục 0–24), `PROMPT_SESSION_CODE.md`, `PROMPT_BAN_GIAO_PLANNING.md`,
`docs/superpowers/plans/2026-10-03-lo-trinh-tong-hop-viec-chua-lam.md`. Bản cũ còn trong git: `git show 575e898d:plan.md`.

## 0. Dùng file này thế nào
- **Một nguồn duy nhất** cho: đã làm gì, còn gì, thứ tự, model, skill, prompt. Session planning sửa file này; session code
  chỉ thêm **một dòng** vào mục 11 (Nhật ký) khi xong PR.
- Kế hoạch chi tiết (từng Task, từng bước) chỉ giữ cho **PR chưa làm**. PR merge xong → session planning xoá file chi tiết
  của nó (git còn giữ). Hiện còn 8 file:

| File chi tiết | Dùng cho |
|---|---|
| `docs/superpowers/plans/2026-10-04-pr-dl-diem-theo-lop.md` | PR-DL (DL-0→7) |
| `docs/superpowers/plans/2026-10-05-pr-nv-nhac-viec-chi-nhanh.md` | PR-NV (đợt 4) |
| `docs/superpowers/plans/2026-10-05-pr-chu-ra-soat-chu.md` | PR-CHU (đợt 4) |
| `docs/superpowers/plans/2026-10-05-pr-mta-luat-mock-test.md` | PR-MTa (đợt 4) |
| `docs/superpowers/plans/2026-10-05-pr-mtb-giao-dien-mock-test.md` | PR-MTb (đợt 5) |
| `docs/superpowers/plans/2026-10-05-pr-mt0.md` | PR-MT0 (đợt 5) |
| `docs/superpowers/plans/2026-10-06-pr-tk-tong-ket-lo-trinh.md` | PR-TK (mockup `thiet-ke/mockup-tong-ket-lo-trinh-2026-10-06.html`, bản 2 đã duyệt 06/10; chạy sau LUI-b #213) |
| `docs/superpowers/plans/2026-10-03-pr-phien-lich-mt-dieu-huong-sua-lop.md` | PR-SL (mục B Q-0310-3, "PR-SL", SL-1→2). Phần PH, LM, DH đã xong |
| `docs/superpowers/plans/2026-10-02-ux-sau-critique.md` | PR-HK2 (H1, H2, K2, K4–K7, J1–J4, J7, J9), PR-SL (I1–I4, I6) |

- **Khi các nguồn mâu thuẫn:** theo `CLAUDE.md` (quyết định chủ sản phẩm + kế hoạch đã duyệt → Rulebook + mockup → skill).
  Luật sản phẩm: `thiet-ke/PISA-Rulebook-2026-09-19.md` (mục 20 ưu tiên nhất). Đặc tả chính: `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md`.
- Hỏi "còn gì chưa làm": đối chiếu với **mã thật** (grep), không tin ô tick (nhiều kế hoạch cũ đã merge mà ô vẫn trống).

## 1. Luật làm việc (mọi session)

### 1.1. Chủ sản phẩm
- **Không biết code.** Báo bằng tiếng Việt cơ bản, nói theo "cái thấy trên màn" trước, tên file sau.
- Muốn: dễ hiểu · dễ dùng · gọn; giao diện tinh tế (cột hàng thẳng, không dồn chữ, màu rõ). Hỏi **gộp một lần** (≤ 4 câu,
  mỗi câu có phương án + khuyến nghị); đủ tự tin thì tự quyết và liệt kê "tôi đã tự quyết". Mockup ghi rõ **nằm ở đâu**.
- **Chữ trên web ngắn** (05/10): nhãn 1–3 từ, không thêm câu giải thích dưới nút/ô; dùng English hoặc nửa Anh nửa Việt khi tự nhiên hơn. **Mockup = đúng chữ sẽ hiện trên web**, không thêm ghi chú vào trong màn. Prompt có giao diện phải ghi rõ luật này.
- **PR có giao diện/UX: phải có mockup cho chủ sản phẩm xem và duyệt TRƯỚC khi code** (06/10): file HTML trong `thiet-ke/`, đủ rõ — mọi trạng thái (mở/thu, rỗng, quá hạn/badge, nhiều lớp), 375 và 1440, sáng và tối, đúng chữ thật. PR nào chưa có mockup đã duyệt thì session code **dừng, soạn mockup, báo chủ sản phẩm**, không tự chế giao diện.
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
| Đợt 3 (05/10) | #194 | **U12** bảng kết quả lớp thường ở hồ sơ HV theo mẫu Mock Test (NhanDot dùng chung, "Chờ n môn", Giữa khoá 1/2) |
| Đợt 2 (04/10) | #190–#192 | **PHH** Báo PH lưu bản chụp nội dung (migrate `prPhh`) · **SO** D2 một nguồn PA đại diện, cấm cấp riêng `plan.week` cho GV, xoá `completeIntervention`, tín hiệu em đã kết thúc, dọn khoá gửi, gỡ mã chuyển dữ liệu cũ (−1 700 dòng) · **DH** Sắp tới có kỳ vọng / Thi thật, cột Dự kiến thi, Trước/Sau hồ sơ HV và lớp, đầu trang Học viên & Lớp gọn, popover Thiếu n, D1, J8, J10, panel không lệch xuống (`!mt-0`) |
| Đợt 0–1 sau deploy (04/10) | #182–#188 | **QU** quyền + tạo lớp hàng loạt + GVCN phân công + GV đóng Case · **GVa** F01/D13 khoá gửi, F03, F04 · **LM** lịch MT linh hoạt (LM-1→7, gồm I5 và I4 phần MT) · **GVb** Chờ duyệt (D01/Q-B, J5, J5b, U01, Bị từ chối) · **BC** Báo cáo đơn vị + Tài khoản (L2, L3, D8, D9, J10 phần Quản trị) · **NT** Target + Dự kiến thi lớp thường, dán không tiêu đề |

Còn treo của các PR đã xong (đã đưa vào mục 4 hoặc 8): PR-PH bước bấm thử + ảnh dải "Mất kết nối" → HK2. PR-GVb G5: Công việc ›
"Của GV" chưa có "Nhắc tất cả" → hoãn. PR-DH: ba việc chủ sản phẩm chốt 04/10 tối + link "MT3" 15 px trên điện thoại → HK2.
PR-PHH: chưa chạy migrate trên bản sao DB bản chính → bước tập dượt trước lần deploy sau (mục 5). PR-SO: `migrateLegacyDisciplineCases`,
`tenMoiChoLopCu` chỉ còn phép kiểm dùng → hoãn (mục 8).

## 2b. Đối chiếu báo cáo rà #172–#176 (`pisa-review-pr172-176-claude.md`, kiểm lại trên mã main 05/10)
| ID | Nội dung | Trạng thái |
|---|---|---|
| F01 | Chống gửi trùng 10 giây làm mất việc hợp lệ | ✅ PR-GVa #183: khoá gửi mỗi lần mở form (`idempotency_key`) cho `/mgmt-tasks`, `/tasks`, PA, lần xem lại; có phép gửi đồng thời |
| F02 | Báo PH đã làm đổi theo điểm hiện tại | ✅ PR-PHH #191: bản chụp lúc xác nhận; dòng cũ ghi rõ "nội dung hiện tại". Không cần quy tắc phiên bản (việc xong không mở lại được) |
| F03 | Form Giao việc giữ chi nhánh cũ | ✅ PR-GVa-4 #183 |
| F04 | Tải kỳ lỗi vẫn giao việc GV thiếu kỳ | ✅ PR-GVa-3/4 #183 (máy chủ tự xác định kỳ hoặc 400; web khoá gửi) |
| U01 | "Chờ chấm" vàng ở danh sách lớp | ✅ PR-GVb #187 (`TONE_BADGE_TRANG_THAI['cho-cham']`) |
| D01 | Q-B ghi xong mà chưa có | ✅ PR-GVb #187 (duyệt nhiều ở Tất cả, Chọn hết, Nhắc tất cả) |
| §6.1 | H1/H2, K2, K5, K6, K7 · UX-I · UX-J · H6 · K4 · "Bị từ chối" | HK1 ✅ · H6 ✅ (PR-DH kiểm) · "Bị từ chối" ✅ GVb · UX-I → **SL** · UX-J còn lại, H1/H2, K2, K4–K7 → **HK2** |
| §6.2 | Badge chuyển lớp · `pa-can-cap-nhat` · tuần học · lỗi dưới ô a11y · tháng `2026-09` | ✅ D1 (DH) · ✅ D2 (SO) · tuần học → **HK2** (chốt 05/10, mục 4) · D11 → **SL** · ✅ D8 (BC) |
| §6.2 cuối | Panel Chuyển lớp đè demo bar · "Khác" · lưu trữ rỗng · hồ sơ cá nhân | ✅ demo bar (DH-13 `!mt-0`) · ba mục còn lại → **HK2** (bấm thử, có thật mới sửa) |
| §8 | Cách làm: phép kiểm đỏ trước, bấm thử 375/1440 sáng/tối 3 vai, báo từng ID | Đã thành luật ở mục 1.2 |

## 2c. Rà soát Test / Mock Test 05/10 (`PISA-tracking-test-mocktest-review-final.md` + 2 ảnh) — ĐANG BRAINSTORM, chưa code
Chủ sản phẩm 05/10 đã chốt (mockup `thiet-ke/mockup-test-mt-2026-10-05.html` chờ duyệt → đặc tả → kế hoạch PR):

**Thứ tự (chủ sản phẩm 05/10: chỉ chạy sau khi DL, K26, SL merge xong):** Đợt 4 = **PR-NV** (T8 Nhắc việc + 502, T9 chi nhánh mặc định;
~~"Nợ tuần trước" thu gọn~~ → bỏ khỏi PR-NV, thay bằng T15–T18 / PR-LT3) · **PR-CHU** (file `.md` chữ tiếng Việt chối tai — ✅ 05/10: `thiet-ke/CHU_CAN_SUA_2026-10.md` + 4 file con, 602 mục; session sau dùng để sửa chữ, chạy lại `node scripts/quet-chu.mjs` kiểm còn sót) · **PR-MTa** luật máy chủ (T1–T4, T7, T10, T11) — song song.
Đợt 5 = **PR-MTb** giao diện (T13, mockup phần 1–4) · **PR-MT0** (T5, mockup phần 5; merge sau MTb, dùng ô MT mới). Đợt 6 = **PR-HK2**.

| # | Chủ đề | Chốt |
|---|---|---|
| T1 | "MT lịch sử" → **"MT cũ"** | Theo **tuần**: tuần thi cách tuần hiện tại ≥ 2 tuần là MT cũ; tuần trước là MT thường (có hạn, có Case). MT cũ giữ cách xử lý cũ (không hạn chấm, Case chỉ trong 4 tuần). **Bỏ** điều kiện "trước ngày em vào web" |
| T2 | Dời MT1 muộn hơn MT2/MT3 (override) | **Cho lưu** sau popup cảnh báo; MT bị vượt về "chưa xếp", **điểm của MT bị vượt đánh dấu huỷ, không xoá** (không tính SOS/báo cáo, xem lại được, QL khôi phục được); Case sinh từ điểm đó tự đóng. Thay Q-0310-2 (03/10) |
| T3 | Dấu "-" lần 2 (Mock Test) | Kỹ năng thành **"đã huỷ (vắng 2 lần)"**, không còn lịch, báo GVCN; GVCN có nút **"Xin dời"** (thẻ chờ QL như hiện nay). Không tự tạo thẻ |
| T4 | Xếp/dời MT chưa thi về tuần đã qua | **Cho phép, chỉ QL / Quản trị** (dòng nhắc vàng, không chặn); tuần đủ cũ thì thành MT cũ. GVCN/GV vẫn từ tuần này. Thay K2-33 cho QL |
| T5 | MT0 | Lượt Mock thật số 0 (em FOU/BE/ELE lên thẳng FT), lịch = tuần Final Test, **hạn chấm hết Chủ nhật tuần sau**; điểm MT0 = mốc đầu vào trên Hành trình; kỹ năng thấp hơn Target chung ≥ 2.0 → chữ SOS chỉ để nhìn (không Case/PA). **Chỉ "Lên FT" phải quyết trước khi hết tuần 7 (FOU) / tuần 9 (BE/ELE)**; hướng khác quyết sau % Cuối khoá (K26). **Hai mốc (chủ sản phẩm duyệt 05/10):** (1) trước khi hết tuần 7/9 Quản lý ghi "Dự kiến lên FT" → web tự xếp MT0 cùng tuần Final, việc của QL có hạn tuần 7/9, quá hạn đỏ không chặn; (2) chốt thật ở Chuyển tiếp lớp: giữ Lên FT → MT0 thành mốc đầu vào lộ trình FT mới; đổi Học lại / Lên BE → MT0 lưu ở Hành trình "MT0 · không dùng", không tạo lộ trình FT |
| T5b | MT0 — luật thêm (05/10, mockup bản 2) | "Dự kiến lên FT" = hướng **Lên FT** ở Lộ trình tiếp theo (PR-K26), ghi trước hết tuần 7/9 → web xếp MT0 cùng tuần Final. MT0 ở tuần Final của lớp cũ, muộn nhất **tuần 2 của FT**, **luôn đứng đầu, trước MT1**. **Không có trong panel Xếp lịch MT** (05/10); chỉ dời ở hồ sơ HV / hồ sơ Mock. Hiện ở: Lộ trình tiếp theo (một em / cả lớp), việc QL ở Tổng quan / Công việc, Kế hoạch Test lớp thường (cạnh Final), Lịch Test / Nhập điểm tuần Final, Chuyển tiếp lớp, bảng Mock Test + Hành trình sau khi lên FT. Đụng K26 thì sửa đè K26 |
| T13b | Panel Xếp lịch MT (mockup bản 2) | Nút **"MT mới"** (không thêm chữ) = đợt nhỏ nhất của em chưa có lịch, chưa có thì tạo đợt mới; chọn số cụ thể = đúng đợt đó. Không có MT0. Kỹ năng **mặc định tick đủ 4**. Bảng học viên cuộn ngang, cột chọn + tên đứng yên. Ô "đang chọn" nền sáng chữ tối + ✓, khác hẳn "đang thi" (nền xanh nhạt + chấm) và "đã có lịch" (chỉ viền) |
| T14 | Mọi cổng sửa lịch (10 cổng, mockup phần 0) | Luật mới ở **máy chủ** nên áp cho mọi cổng: Kế hoạch Test (lưới FT, Xếp lịch MT, hàng loạt, thi lại, lớp thường), **Hồ sơ HV › Lộ trình** (dùng chung `HopKyNang`), Hồ sơ Mock (dời cả đợt, hạn, huỷ / mở lại, xếp lại vắng, từng kỹ năng), gõ "-" ở Lịch Test / Nhập điểm / bảng lớp thường, Chờ duyệt (đề nghị dời), tự động (Thêm HV, tạo / lên lớp, lộ trình mới, cron chốt vắng), Điểm theo lớp (chữ), màn chỉ hiển thị (Học viên & Lớp, Hành trình, Tổng quan, Công việc, Phân tích, Xuất Excel MT). Kế hoạch PR-MTa/MTb phải có phép kiểm cho từng cổng ghi |
| T6 | Hạn chấm Mock Test | **Giữ** thứ Tư tuần kế (đã đúng ý) |
| T7 | Lý do bắt buộc | **Chỉ** khi huỷ/mất kết quả (huỷ điểm, huỷ lượt, huỷ kết quả MT do dời vượt) + **từ chối** một đề nghị. Còn lại (sửa điểm, dời lịch, dời hạn, bỏ kỹ năng, báo vắng, thi lại): ô lý do **tuỳ chọn**, lưu ngay; nhật ký vẫn ghi ai/lúc nào/cũ → mới |
| T8 | "Để QL biết" | Đổi tên **"Nhắc việc"**, bỏ số nổi đầu trang; số Chờ duyệt chỉ đếm việc cần duyệt. **Sửa 502 "Nhắc tất cả"** (gốc: `nhacViec` dựng lại cả `myWork` của người được nhắc cho MỖI thẻ — gom theo người, bỏ qua thẻ đã nhắc hôm nay trước khi dựng) |
| T9 | Chi nhánh mặc định (Học viên & Lớp, gốc `hocVienLop.ts:74` lấy chi nhánh id nhỏ nhất = MB) | Lần chọn trước (nhớ trên máy) → chi nhánh có vai Quản lý → chi nhánh có nhiều lớp mình dạy/chủ nhiệm nhất → chi nhánh đầu. Áp cho mọi màn có ô chi nhánh |
| T10 | Nhập band | L/R: số có dấu chấm (6.5) hoặc "b6" = band, số nguyên = raw như cũ. W/S: thêm ô "Band" cạnh 4 tiêu chí (điền band thì bỏ trống tiêu chí được). Mặc định như cũ |
| T11 | Dời Test lớp thường | Tự do như hiện nay; người khác GVCN dời → **một thông báo chuông cho GVCN**. Không thẻ, không Case |
| T12 | Đã có, không làm lại | Đợt không đủ 4 kỹ năng ("Bỏ kỹ năng", PR-XLMT) · dời MT có điểm điểm đi theo (PR-LM, nay mở cho MT cũ) · chặn xếp MT mới khi MT trước chưa lịch · tuần chung + lịch riêng ở panel Xếp lịch MT · tick = mock. Speaking không có "⋯": **cố ý** (thao tác đã nằm trên dòng) → làm nhất quán trong mockup |
| T13 | Chưa có, làm theo đề xuất | Chọn tất cả / Bỏ chọn tất cả · lựa chọn **MT MỚI** đứng đầu ô Đợt · ô MT0…MTn nói rõ trạng thái · popup "+ Xếp" có tuần chung cho các kỹ năng đã tick · ~~"Nợ tuần trước" thu gọn mặc định~~ (thay bởi T15, PR-LT3) · file `.md` liệt kê chữ tiếng Việt chối tai (chuẩn chung: được dùng English / nửa Anh nửa Việt khi tự nhiên hơn) |
| T15 | **Lịch Test chia 3 khối** (05/10, thay "Nợ tuần trước" + khối hạn trong dòng lớp) | Trên xuống: **(1) "Test quá hạn chấm"** — bài chưa chấm, đã **qua hạn** (`quaHanNhapDiem`) **và đã sang tuần thứ hai sau tuần thi** (tuần thi ≤ tuần hiện tại − 2); **thu gọn mặc định**. **(2) "Test chấm tuần này"** — bài học viên **thi tuần trước** (tuần thi = tuần hiện tại − 1), còn chưa chấm; **ở lại khối này hết tuần (Chủ nhật), kể cả khi đã quá hạn** (FT quá hạn từ thứ Năm) — quá hạn chỉ thêm **badge "Quá hạn"** (đỏ nhạt, cạnh hạn chấm), không đỏ cả dòng; sang Thứ Hai tuần sau mới chuyển khối 1; **mở sẵn**, hiện như Lịch Test hàng tuần (cột Lớp · Đợt · Kỹ năng · Tiến độ · Hạn chấm), **không** có vùng đỏ của khối nợ. **(3) "Lịch Test tuần này"** — như hiện nay (ai thi môn gì tuần đang xem), **thu gọn mặc định**; xem tuần khác thì tiêu đề theo mã tuần (vd "Lịch Test W1 OCT"). Một bài chỉ nằm đúng **một** khối. Hai lịch tách hẳn: **lịch thi của học viên** (khối 3) khác **lịch chấm của GV** (khối 1, 2). Thay "Nợ tuần trước thu gọn" (T13/PR-NV NV-6): nợ = quá hạn thật, bài thi tuần trước **không** vào khối 1 trong cùng tuần, dù đã quá hạn. Ngoại lệ: hạn riêng được dời xa hơn thì bài ở lại khối 2 với badge hạn tới khi hết hạn |
| T16 | Lùi / tiến tuần | Khối 1 **không đổi theo tuần đang xem** (luôn tính theo hôm nay, vẫn theo bộ lọc phạm vi / chi nhánh / lớp) và **luôn đi cùng** màn. Khối 2 **chỉ hiện khi đang xem tuần hiện tại**; xem tuần khác thì ẩn. Khối 3 theo tuần đang xem. Lùi tuần chỉ để xem lại: **không sửa được điều gì làm đổi khối 1** ngoài thao tác nhập điểm thường (không có đường nào xoá nợ bằng cách đổi tuần xem). Tổng bài chưa chấm của 3 khối = badge "n bài chờ chấm" (giữ G-10) |
| T17 | Khối 1 — cột và mục con | Phần dòng lớp (Lớp · Đợt · Kỹ năng · Còn · Hạn · GV chấm · nhãn · Thu) **chỉ dùng cho khối 1** để mở ra lớp / học viên đang quá hạn. **GV chấm: kéo rộng, chỉ ghi tên GV còn chưa chấm** (GV đã nhập xong không hiện), không cắt chữ. Lưới học viên là **mục con** của dòng lớp, thể hiện nhẹ: thụt vào + một vạch dọc mảnh bên trái nối với dòng lớp, nền nhạt hơn, **không** khung bo + viền thứ hai, header cột chữ nhỏ; "Mở lưới đầy đủ" đưa lên dòng lớp. Chi tiết do `impeccable layout` quyết trong PR, giữ bảng màu / phông đã khoá |
| T18 | **Speaking Mock chấm chéo** (chủ sản phẩm 05/10) | Speaking Mock **không có GV mặc định**; cột GV chấm ghi "Chấm chéo" tới khi có người nhập. **Quá hạn**: chỉ **báo** cho **GVBM Speaking của lớp** và **GVCN lớp đó** (dòng ở khối 1 + chuông), nhưng **không tính nợ / quá hạn** vào chỉ số của hai người này (không số đỏ, không "đúng hạn" của Phân tích GV, không "Chờ bạn chấm"). Khi **GV chấm chéo nhập điểm** (người ghi ở "GV chấm Speaking", T39) thì mới tính: nhập sau mốc trễ (`mocTreNhapDiem`) = **trễ của chính người đó**. GV chấm là tên người ngoài (không tài khoản) → không tính trễ cho ai. Thay dòng "ô S vẫn là việc / nợ điểm của GV được phân công S lớp đó" (PR-HSM) |
| T19 | **Khung nhập điểm** (chủ sản phẩm 06/10) | Mock Test **và** Test lớp thường: **không ai** (kể cả QL, Quản trị) nhập điểm khi **chưa tới tuần thi** của kỹ năng/môn đó (muốn nhập sớm thì dời lịch thi về tuần này trước). Hạn chấm **cả hai = thứ Tư tuần sau tuần thi** (lớp thường đổi từ Chủ nhật tuần thi). Qua hạn **vẫn nhập được, tính trễ** như hiện nay (khối "Test quá hạn chấm", Phân tích GV). MT cũ (tuần đã qua) không bị chặn. Vào **PR-MTa Task 12** |
| T20 | **Dời lịch đã có điểm, về tuần cũ** (06/10) | QL / Quản trị dời kỹ năng / bài **đã có điểm** (FT và lớp thường) sang tuần khác, **kể cả tuần cũ hơn** — điểm đi theo; hiện chỉ dời được kỹ năng chưa chấm. Giữ luật T2 khi dời vượt lượt sau. Vào **PR-MTa** |
| T21 | **Khôi phục phần thi đã huỷ** (06/10) | QL khôi phục vào **tuần này hoặc tuần đã qua** (nay chỉ tuần chưa tới — kẹt điểm bài đã thi thật, nhất là sau T19). Vào **PR-MTa** |
| T22 | **Xoá điểm = xoá trắng ô rồi Lưu** (06/10, sửa T7) | Người được nhập ô đó (GV chấm trong khung T19, GVCN, QL) xoá trắng ô đã có điểm rồi bấm Lưu là xoá — **không bắt buộc lý do** (ô lý do tuỳ chọn, nhật ký vẫn ghi cũ → mới). Áp cho bài đang cần chấm, bài trong tuần test **và MT cũ**. **MT cũ: QL + GVCN lớp đó** sửa / xoá ô đã có điểm (nay GVCN chỉ ghi ô trống). Lý do vẫn bắt buộc khi huỷ lượt, huỷ kết quả do dời vượt, từ chối. Vào **PR-MTa** |
| T23 | **"-" ở MT cũ = Không dự thi** (06/10) | Cho gõ "-" ở MT cũ: chỉ ghi em không dự thi kỹ năng đó — không tính lần vắng, không tự dời, không Case, không báo QL; ô không còn đếm "còn trống". Vào **PR-MTa** |

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
| 05/10 | Sửa thông tin cả lớp: **web tự chia lô 8 em** mỗi lần lưu (một nút Lưu; lô lỗi thì "Đã lưu n em · m em chưa lưu"), máy chủ có trần mỗi request · nút "Sửa thông tin" giữ ở hàng Cách xem + mục ⋮ · PR-SL **phải có mockup** duyệt dù bắt đầu trước luật mockup | SL |
| 06/10 | Chờ duyệt **luôn mở "Tất cả" chi nhánh** (số dòng = badge); link trỏ một thẻ/lớp không áp chi nhánh mặc định | NV ✅ |
| 06/10 | Điểm theo lớp: bỏ chú giải màu, câu "Lưu từng ô…", nút "Xong" của mockup (luật chữ ngắn); tab giữa Lịch Test và Kế hoạch Test | DL ✅ |
| 06/10 | **Không dùng Fable** ở mọi session, kể cả subagent | mọi PR |

## 4. Việc chưa làm (đợt 3 còn DL, SL; đợt 4–6 ở mục 2c + kế hoạch 2026-10-05-*)

Đợt 2 (PHH, SO, DH) và U12 đã xong, xem mục 2.

### PR-BV · Bỏ vắng + xoá điểm hàng loạt có khôi phục (M–L) — chủ sản phẩm 06/10, **kế hoạch + mockup chưa soạn**
Nguồn: `docs/superpowers/specs/2026-10-06-ra-soat-duong-lui.md` (rà 06/10, 11 phép thử API). Chạy **sau MTa** (cùng `attempts.ts`, `regular.ts`, `absence.ts`), có mockup duyệt trước.
- **Bỏ vắng / Em có thi:** bài đã chốt vắng hoặc gõ "-" nhầm → trả **lịch cũ + số lần vắng**, rồi nhập điểm được. Ai: **QL / Quản trị mọi lúc; GV chấm bài đó trong khung nhập T19** (tuần thi → thứ Tư tuần sau). Lý do tuỳ chọn, nhật ký đủ. Máy chủ đã có hàm sửa trạng thái thi nhưng chưa có đường gọi.
- **Xoá điểm hàng loạt** (nhiều em, cả đợt một em, cả cột kỹ năng cả lớp): **xoá mềm, khôi phục được**; màn xem trước số điểm + Case bị ảnh hưởng. Chỉ QL / Quản trị. Điểm xoá tay từng ô cũng khôi phục được.
- Sửa lỗi: bài lớp thường xoá điểm xong vẫn "đã xong" (`regular.ts:759`).

### PR-LUI · Đường lui (L, có thể tách a/b) — chủ sản phẩm 06/10, **kế hoạch + mockup chưa soạn**
Nguồn như PR-BV. Chỉ mở cho QL / Quản trị, không nới quyền GV. Chạy sau đợt 5, trước HK2.
- **a · Case + Chờ duyệt + Ý thức:** mở lại Case đã hoàn thành (sửa luôn chữ sai ở `ThaoTacCase.tsx:218` đang nói "Case này mở lại" mà máy chủ tạo Case mới) · huỷ quyết định duyệt / từ chối bấm nhầm trong ngày + từ chối hàng loạt · vi phạm Ý thức xoá mềm + khôi phục (nay xoá hẳn cả tệp) · ghi vi phạm cho nhiều em một lần.
- **b · Học viên & lớp:** "Học lại" cho em đã kết thúc học · mở lại lớp đã kết thúc · lưu trữ / kết thúc học / huỷ quyết định chuyển lớp cho nhiều em một lần.

### PR-TK · Tổng kết lộ trình — điểm 4 kỹ năng khi kết thúc (M) — chủ sản phẩm 06/10, **làm trong đợt này**, kế hoạch + mockup **đã soạn 06/10, chờ duyệt** (`2026-10-06-pr-tk-tong-ket-lo-trinh.md`; Q1–Q4 chốt 06/10 — Q4: kết quả **thi thật** L R W S do GVCN nhập, Đích → Kết quả → Hướng tiếp, việc nhắc "Cập nhật kết quả thi thật"; Kết thúc học FT chờ kết quả thi thật chưa lưu trữ (TK-L) — **đã duyệt 06/10, chạy sau LUI-b #213**; khảo sát thêm đường đóng thứ 5: `PATCH /cycles/:id` `cycles.ts:312-314`)
Khảo sát 06/10 (mã main): điểm **không mất** khi lộ trình kết thúc (không có xoá dây chuyền; chỉ "Xoá học viên" của Quản trị xoá thật). Nhưng **khó xem lại**:
hồ sơ HV mặc định lộ trình đang chạy (dải chọn lộ trình ẩn, `StudentDetailPage.tsx:87, 239`); Lưu trữ chỉ là danh sách; Kết luận khoá chỉ xét lớp đang học + một lớp vừa rời
(`profile.ts:782-797`); Phân tích lớp và Điểm theo lớp chỉ lấy lớp / lộ trình đang chạy (`phanTichLop.ts:57-58`, `diemTheoLuot.ts:146`).
Kỳ vọng, chương trình, band đầu vào, đạt/trượt, mức SOS **không lưu bản chụp** — sửa route / band đầu vào về sau làm lệch số cũ.
- **Bản chụp lúc đóng lộ trình** (mọi đường đóng: lộ trình mới, chuyển / lên lớp, kết thúc học; `cycles.ts:162`, `luatLoTrinh.ts:256, 471`, `students.ts:300`): mỗi lượt × 4 kỹ năng (L, R, W, S + OVR / % lớp thường), Target lúc thi, kỳ vọng, đạt / không, mức SOS, chương trình, lớp, GV, band đầu vào, kết luận khoá. Chỉ thêm, chạy lặp được; điền ngược cho lộ trình đã đóng (migrate). "Học lại" (PR-LUI-b) mở lại lộ trình thì bản chụp cũ giữ, đóng lần sau ghi bản mới.
- **Xem lại:** hồ sơ HV có mục "Các lộ trình" hiện rõ (không ẩn), mở một lộ trình cũ = bảng tổng kết 4 kỹ năng theo lượt; mở từ **Lưu trữ** (HV và lớp đã kết thúc) xem được; lớp đã kết thúc: bảng tổng kết cả lớp.
- Chồng: PR-LUI-b (`students.ts`, `luuTru.ts`, Học lại), PR-MT0 (Chuyển tiếp lớp). Chạy sau LUI-b, song song MTb được. Bảng bản chụp là nguồn cho PR-NC.

### PR-NC · Thống kê để nghiên cứu (L) — chủ sản phẩm 06/10, **SAU đợt deploy lớn**, chưa làm gì
Dựa trên bản chụp PR-TK. Ý tưởng (brainstorm planning, chờ chủ sản phẩm chọn khi tới lượt): tỉ lệ HV không đạt theo kỹ năng / lượt / chương trình / lớp / GV / chi nhánh / khoá;
HV không đạt mấy lần liên tiếp, kỹ năng hay trượt nhất; từ band đầu vào → kết quả cuối khoá (nhóm band); hiệu quả Case / PA (trượt → đạt sau PA); Target đặt vs thực đạt;
tỉ lệ vắng, trễ chấm; xuất Excel bộ số liệu thô (một dòng một lượt × kỹ năng) để nghiên cứu ngoài web. Tái dùng `evaluateAttempt`, `evaluateRegular`, `daiCuoiKhoa`, `xuatExcel` MT.
Màn dự kiến: Phân tích › "Tổng kết khoá" (lọc khoảng thời gian, chương trình, chi nhánh) + nút Xuất. Cần 2–3 tháng dữ liệu bản chụp mới có ý nghĩa.

### PR-LT3 · Lịch Test ba khối + Speaking chấm chéo (L) — luật T15–T18 (mục 2c), **kế hoạch chi tiết chưa soạn**
Chủ sản phẩm 05/10 (sau khi thấy MT4 "W1 OCT" hiện ở cả Nợ lẫn Lịch tuần này — luật hạn **đúng**, cách hiện gây rối).
Phạm vi: `server/src/cham/canCham.ts` (`noTuanTruoc`, `lichTest`, đường tính "chờ bạn chấm"), `web/src/modules/test/lichTest/*` (`KhoiNo.tsx`, `DaiSo.tsx`, `LichTestTab.tsx`),
cách tính nợ / trễ của Speaking (`pendingOwners`, Phân tích GV, Việc cần làm). Không đổi luật hạn (thứ Tư tuần kế / CN tuần thi).
Việc: (1) tách 3 khối theo T15 (khối 2 giữ bài hết tuần, quá hạn chỉ thêm badge), một bài đúng một khối; (2) khối 1 độc lập tuần xem (T16); (3) giao diện khối 1 (T17); (4) Speaking Mock theo T18;
(5) dải số 4 ô: mặc định Đã chấm tuần này · Còn phải chấm (khối 2+3) · Quá hạn chấm (khối 1) · bỏ ô trùng — **chủ sản phẩm xác nhận**;
(6) cập nhật phép kiểm G-10 (tổng 3 khối = badge), `prUxG` G4. Chạy đợt 5, **sau NV, MTa**, song song MTb/MT0 nhưng **chồng `canCham.ts` với MT0** (xem kế hoạch MT0) — merge LT3 trước MT0 hoặc MT0 merge `origin/main` vào.
Việc đầu tiên: giao agent soạn kế hoạch theo mẫu A mục 10 (Opus 5.5) **và mockup HTML** `thiet-ke/mockup-lich-test-ba-khoi-<ngày>.html`; chủ sản phẩm duyệt cả hai trước khi code (luật mockup mục 1.1).

### PR-SL · Sửa cả lớp + panel/form (L) — kế hoạch có sẵn (SL-1, SL-2), cần thêm task
- SL-1 máy chủ xem trước + lưu một giao dịch · SL-2 panel "Sửa thông tin cả lớp" (không dán Excel).
- **Thêm:** **một mẫu Excel chung** (mục 3) · **I1** "Đóng"/"Huỷ thay đổi" ở `KhungPanel`/`Drawer` · **I2** form Tạo Case
  (không chọn sẵn mức độ, placeholder "Chọn nhóm", W1/W2, bộ chọn tuần) · **I3** panel Thêm HV (chữ cắt, phông, nút dưới ô dán,
  lời nhắc 2 dòng) · **I4** Drawer → KhungPanel phần còn lại (GvCham, ScoreEntry, NhanXet, DeleteViolationConfirm,
  StudentDetailPage; kiểm `MockDetailPage` đã xong ở LM chưa) · **I6** panel Ghi vi phạm · **D11** lỗi dưới ô nối
  `aria-describedby` (`ui/ui.tsx` Field, `ui/KhungPanel.tsx` Truong).

### PR-DL · Điểm theo lớp (L) — kế hoạch có sẵn (DL-0→7), mockup đã duyệt
- Nhập điểm cả lớp theo từng lượt (FT: MT1, MT2, … kể cả lịch sử; lớp thường: hai bảng Giữa khoá / Cuối khoá, nhận diện theo `kind` —
  DL-0 04/10 chủ sản phẩm chốt, không có "bài thêm"). `DauTrangLop.tsx`: chỉ thêm một mục menu ⋮.

### PR-K26 — ✅ xong 05/10 (#196, #197).

### PR-TEN · Đổi tên bài lớp thường (S, sau đợt 3, trước HK2)
- Chủ sản phẩm 04/10 (lúc làm PR-DL): "Giữa khoá" → **Progress Test**, "Cuối khoá" → **Final Test**, **cả nhãn dài** ("Bài kiểm tra
  giữa/cuối khoá") — thay ở mọi nơi (web, thông báo, báo cáo, sổ tay; ~940 chỗ / ~130 file). Làm sau khi U12, DL, K26, SL merge để tránh xung đột.

### PR-HK2 · Badge & chữ, chụp lại sổ tay (L, cuối cùng) — kế hoạch có sẵn một phần
- `2026-10-02-ux-sau-critique.md`: **H1/H2** ba họ chip · **K1** còn lại (nếu DH chưa làm hết) · **K2** Phân tích › Tổng hợp ·
  **K5** demo bar điện thoại · **K6** chữ nội dung 12 px · **K7** một kiểu icon ⋯ · **J1–J4, J7, J9** chữ.
- **Thêm:** **K4 + "Vắng" thống nhất** lưới cả lớp ↔ màn từng kỹ năng, có Hoàn tác (quyết định 04/10) · **D7** thanh trên điện
  thoại theo mockup 23C · bấm thử: chữ "Khác" mơ hồ, trạng thái rỗng trang lưu trữ, khoảng trống hồ sơ cá nhân (có thật mới sửa) ·
  dải "Mất kết nối" của PR-PH (nút "Đang thử…", `role=status`, ảnh) · toast Hoàn tác sau khi ghi vi phạm (Y_THUC §7.2) nếu
  dựng chung toast · **chụp lại toàn bộ ảnh sổ tay** `docs/so-tay/`.
- **Thêm từ PR-DH (chủ sản phẩm chốt 04/10 tối):**
  - Hồ sơ lớp, menu "+n" (`DauTrangLop.tsx` `bamBadge`): "Thiếu GV …" → mở panel Phân công GV bộ môn (chỉ người có quyền; không có quyền thì
    mục là chữ thường); "Thiếu n thông tin" → danh sách em thiếu thông tin của lớp (cùng đích với chip "Thiếu thông tin" ở Học viên & Lớp);
    nhãn chặng ("Giữa khoá", "Thi"…) là chữ, không nằm trong menu bấm.
  - Học viên & Lớp: ô tìm của trang ghi gợi ý "Lọc trong danh sách này…"; ô tìm trên thanh đầu giữ nguyên (thanh đã khoá).
  - Điện thoại: nút "+ Lớp mới" ở Học viên & Lớp vào menu ⋯; máy tính giữ nguyên.
  - Link "MT3" ở bảng Mock Test hồ sơ HV trên điện thoại: vùng bấm ≥ 40 px.
- **Thêm từ PR-U12 (chủ sản phẩm chốt 05/10):** bài lớp thường chấm dở mà đã có môn trượt → dòng "Không đạt: …" **tô màu cảnh báo**
  (khớp bảng Mock Test giữ màu SOS cho số tạm) · bài đã xong có môn huỷ phần không còn chữ "(đã chấm)" · kiểm nhãn "dời W1/W2" ở bảng Mock
  Test sau khi đổi `skillShort` → `tenMonNgan` (`StudentDetailPage.tsx` `NhanDot`).
- **Tên web "PISA Tracking"** (chủ sản phẩm 05/10, PISA viết hoa hết): thay "Pisa Tracking" ở `index.html` `<title>`, `App.tsx:144`,
  `WelcomePage.tsx:137`, `server/src/index.ts:21`, phép kiểm `hocVienLop.tests.ts:71-73` + `suaLoiNong.tests.ts:281`, README/DEMO/TRIEN_KHAI,
  sổ tay `docs/so-tay/` (cùng lúc chụp lại ảnh). Không đổi tên gói npm, tên site Netlify, tên DB.
- **Thêm từ rà PR-DL #206 (06/10):** tên học viên bị cắt khi có chip "Đã hoàn tất" (lưới chấm cũ + Điểm theo lớp) · `hoanTat.ts:42` tính theo giờ thật thay vì ngày nghiệp vụ (kiểm, có thật mới sửa).
- **Thêm từ rà PR-SL #203 (05/10, Minor):** panel có form còn ghi cứng "Đóng" (chưa theo luật I1 `chan.daSua`): `ChuyenLopPanel.tsx:150`,
  `ClassProgressPanel.tsx:97`, `CatalogAdmin.tsx:177,248` · `KhungPanel.tsx` `nganPanel`: panel cha + con mở cùng một lần vẽ thì thứ tự Esc ngược
  (chưa gặp; có thật mới sửa) · hộp bốn tiêu chí: Esc khi đã gõ đóng luôn, không hỏi (có từ `Modal` cũ).
- **Tuần học khi không có lộ trình đang chạy** (báo cáo rà #172–#176 §6.2, chủ sản phẩm chốt 05/10: **cả ba không ghi tuần học**): em đang học
  FT mà không có lộ trình `active` → Hành trình (`students/hanhTrinh.ts:310`, `loTrinhTinhTuan` rơi về lộ trình gần nhất) **không** ghi "tuần
  học n" cho chương đang học, khớp đầu hồ sơ (`profile.ts` `dangChay` null) và panel Chuyển lớp (`transition.ts` SQL `cy.status = 'active'`).
  Phép kiểm đỏ trước: dựng em ghi danh active + lộ trình `completed` → ba chỗ cùng không có tuần học. Chương đã rời giữ cách tính cũ.

## 5. Đợt chạy, thứ tự merge, deploy

Chủ sản phẩm 04/10: **3 đợt**; deploy một lần (bản `main` lúc đó), rồi **chỉ deploy lần nữa khi xong hết** mọi PR dưới đây.

| Đợt | Chạy cùng lúc (mỗi PR một session) | Thứ tự merge | Vì sao không đụng nhau |
|---|---|---|---|
| ~~2~~ | ~~PHH · DH · SO~~ | ✅ xong 04/10 (#191, #190, #192) | — |
| ~~3~~ | ~~U12~~ ✅ #194 · ~~K26~~ ✅ #196 · ~~DL~~ ✅ #206 · ~~SL~~ ✅ #203 | ✅ xong 06/10 | U12: một bảng hồ sơ HV · DL: module điểm mới + một mục ⋮ · K26: `LoTrinhTiepPanel`, `lenLop.ts` · SL: panel/form chung. Chồng nhẹ: `DauTrangLop` (SL, DL, K26 thêm mục ⋮), `StudentDetailPage` (SL I4 ↔ U12). SL merge cuối: kiểm lại chân panel của DL, K26 theo luật I1 |
| **4** (đang chạy) | ~~CHU~~ ✅ #202 · ~~NV~~ ✅ #205 · **MTa** | MTa | NV: Chờ duyệt (`nhacNhieu`), ô chi nhánh, Lịch Test · CHU: chỉ thêm file `.md` + script · MTa: luật máy chủ Mock/Test. Chồng nhẹ: `duyet/yeuCau.ts` (NV thân `nhacNhieu`, MTa phần lý do), `mywork.ts` |
| **5** | **MTb** · **MT0** · **LT3** | MTb → LT3 → MT0 | MTb: giao diện Mock Test · LT3: Lịch Test ba khối (`canCham.ts`, `lichTest/*`) · MT0: lượt MT0 + Chuyển tiếp lớp; MT0 dùng component ô MT của MTb và chồng `canCham.ts` với LT3 |
| **6** | **HK2** (một mình) | — | Đụng ~15+ file khắp web, chụp lại sổ tay một lần |

**Deploy lần sau (sau HK2)** — làm một lần cho cả 8 PR, theo `TRIEN_KHAI.md` mục 8 và 11.1:
1. Sao lưu bản chính (`npm run sao-luu`).
2. Tập dượt trên **bản sao DB bản chính** (DB tạm): `npm run migrate` hai lần (lần hai không đổi gì) — có migrate PHH và bản đã gỡ mã cũ của SO.
3. Bấm thử 375/1440 sáng/tối, ba vai: báo PH đã làm giữ nội dung; Học viên & Lớp cột mới, Trước/Sau; sửa cả lớp; Điểm theo lớp
   (FT + lớp thường, bài đã qua); bảng kết quả lớp thường; Lộ trình tiếp theo theo dải %; badge/chữ toàn web.
4. Báo GV trước (đổi giao diện rộng), rồi deploy.

DB THỬ (`pisatracking-demo`): không cần giữ tương thích; muốn dùng lại thì seed lại sau lần deploy sau.

## 6. Model, effort, skill cho từng PR
Chọn model ở ô chọn model **trước khi dán prompt**. Subagent cùng model với session (không Haiku, **không Fable** — chủ sản phẩm 06/10). Người rà: Opus 5.5, session khác.

| PR | Khuyến nghị | Phương án B | Vì sao | Ponytail | Impeccable | Superpowers riêng |
|---|---|---|---|---|---|---|
| **PHH** | Opus 5.5 · High | Sonnet 5.5 · High | Có migrate, dữ liệu báo phụ huynh không được sai | lite (giao diện nhỏ) | `clarify` · `audit` | — (kế hoạch có sẵn) |
| **DH** | Opus 5.5 · High | Sonnet 5.5 · High | Giao diện rộng, nhiều cột; model nhỏ từng lọt lỗi hình | lite | `critique` (chỉ đầu trang, DH-5) · `layout` · `clarify` (J6, J8, J10) · `adapt` (375) · `audit` | writing-plans (thêm task cuối kế hoạch) |
| **SO** | Opus 5.5 · XHigh | Opus 5.5 · High | Gỡ mã migrate + gom hàm số liệu dùng chung: sai là lệch số hoặc hỏng nâng cấp DB | full | — | `/security-review` cuối PR |
| **U12** | Sonnet 5.5 · High | Opus 5.5 · Medium | Một bảng, theo mẫu đã có | lite | `layout` · `clarify` · `audit` | — |
| **DL** | Opus 5.5 · High | Sonnet 5.5 · High | Tính năng mới, refactor `classScoreSheet`/`regularSheet` không được đổi kết quả cũ | lite | `layout` · `clarify` · `adapt` (375) · `audit` | brainstorming nếu DL-0 lệch G2 |
| **K26** | Opus 5.5 · High | Sonnet 5.5 · High | Luật dải % + migrate đổi dữ liệu hướng + đường ghi cả lớp một giao dịch | lite | `layout` · `clarify` · `harden` · `adapt` · `audit` | — (kế hoạch có sẵn) |
| **SL** | Opus 5.5 · High | Sonnet 5.5 · High | Ghi nhiều bảng một giao dịch + đổi khung panel dùng chung | lite | `layout` · `harden` (lỗi dưới ô, D11) · `clarify` (I2, I3, I6) · `audit` | writing-plans (thêm task) |
| **HK2** | Opus 5.5 · High | Sonnet 5.5 · High | ~15+ file, giữ nhất quán ba họ chip; chụp ảnh sổ tay giao subagent | lite | `polish` · `clarify` (J) · `adapt` (K4, K5, D7) · `audit` toàn web | writing-plans (kế hoạch bổ sung) · dispatching-parallel-agents (chụp ảnh) |
| Rà PR | Opus 5.5 · High (SO, SL: XHigh) | — | Người rà khác người code | — | — | requesting-code-review (phía rà), receiving-code-review (phía code khi nhận tin sửa) |
| Session planning | Opus 5.5 · XHigh | Opus 5.5 · High | Viết kế hoạch + rà cần suy luận dài | — | `critique` khi cần | brainstorming · writing-plans · dispatching-parallel-agents |

## 7. Chủ sản phẩm đã trả lời 04/10
1. Gộp đợt: **đồng ý** (3 đợt). 2. U12: **làm, giống bảng Mock Test**. 3. Deploy: **một lần ngay, lần sau khi xong hết** (mục 5).
4. A12: **giữ tên** "Điều chỉnh cách dạy" (đóng). K2-26: **làm** → PR-K26 (ba câu đã trả lời 04/10 tối, mục 4).
5. (04/10 tối) J6: **giữ "Target"** (đã chốt từ `THUAT_NGU_2026-10-01.md`). PR-DH: "+n" hồ sơ lớp dẫn đúng chỗ · ô tìm trang ghi "Lọc trong danh sách này…" · "+ Lớp mới" vào ⋯ trên điện thoại → PR-HK2.
6. (05/10) U12: dòng "Không đạt" chấm dở **tô màu cảnh báo** → HK2 · tên web **"PISA Tracking"** → HK2 · tuần học khi không có lộ trình
   đang chạy: **cả ba chỗ không ghi** → HK2.

## 8. Hoãn có chủ ý · Đã chốt không làm
- **Hoãn (dọn mã, không gấp):** gỡ `migrateLegacyDisciplineCases` / `hasLegacyDisciplineModel` và `tenMoiChoLopCu` (PR-SO ghi: chỉ còn
  phép kiểm hoặc bước sao lưu DB cũ dùng).
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
Đầu phiên: nói rõ mình đang chạy model nào; khác model ghi trên prompt này thì DỪNG và báo chủ sản phẩm trước khi làm.
Nhánh mới từ origin/main mới nhất. Skill: superpowers:subagent-driven-development (mỗi Task một subagent cùng model),
superpowers:test-driven-development (đỏ trên DB test trước), superpowers:systematic-debugging khi lỗi lạ,
superpowers:brainstorming nếu cần chủ sản phẩm quyết (dừng, hỏi), superpowers:verification-before-completion,
superpowers:requesting-code-review, superpowers:finishing-a-development-branch (mở PR vào main, KHÔNG merge).
npm run check xanh (một lần một lúc) → bấm thử 375/1440 sáng/tối, ≥ 3 vai, ảnh thật → /impeccable audit (nếu có giao diện)
→ /ponytail-review. Xong: [x] kế hoạch chi tiết, một dòng mục 11 plan.md, CODE_MAP.md nếu thêm/xoá file. Mô tả PR: từng ID
(tái hiện/bác bỏ, file, phép kiểm, ảnh), chú thích ponytail:, ảnh sổ tay lệch. Cổng PORT/WEB_PORT riêng, không 4000/5173.
```

### 9.1. Đợt 2 — ✅ xong 04/10 (PHH #191, SO #190, DH #192)

### 9.2. Đợt 3 — chạy ngay (DH đã merge)

**PR-U12** — ✅ xong 05/10 (#194).

**PR-DL** — Opus 5.5 · High (B: Sonnet 5.5 · High)
```
/ponytail lite
Làm PR-DL theo docs/superpowers/plans/2026-10-04-pr-dl-diem-theo-lop.md (DL-0 → DL-7). Nhánh pr-dl-diem-theo-lop.
Mockup đã duyệt: thiet-ke/mockup-diem-theo-lop-2026-10-04.html. DL-0 sai Giả định G2 thì dừng, hỏi chủ sản phẩm (brainstorming).
Không thêm đường ghi điểm mới; không tự tạo lịch; sửa ô có điểm đi đường override có lý do; kiểm quyền trước khi đọc dữ liệu.
Impeccable: DL-5, DL-6 /impeccable layout, /impeccable clarify, /impeccable adapt (375); cuối /impeccable audit.
DauTrangLop: chỉ thêm một mục menu ⋮. Merge đầu tiên còn lại của đợt 3 (U12 đã xong), trước K26 và SL.
```

**PR-K26** — Opus 5.5 · High (B: Sonnet 5.5 · High)
```
/ponytail lite
Làm PR-K26 theo docs/superpowers/plans/2026-10-04-pr-k26-lo-trinh-tiep-theo-dai.md (K26-1 → K26-5, prompt chung plan.md mục 9.0).
Nhánh pr-k26-lo-trinh-tiep-theo. Có migrate prK26 (đổi dữ liệu chua_ro/xep_sau → chua_quyet, chạy lặp được).
Impeccable: K26-3 /impeccable layout + clarify; K26-4 /impeccable layout + harden + adapt; cuối /impeccable audit.
Merge sau DL, trước SL (merge origin/main vào nhánh, giữ mọi migrate, chạy lại check).
```

**PR-SL** — Opus 5.5 · High (B: Sonnet 5.5 · High)
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

### 9.3. Đợt 4 — sau khi DL, SL merge (ba session song song)

**PR-CHU** — Sonnet 5.5 · High (B: Opus 5.5 · Medium)
```
Làm PR-CHU theo docs/superpowers/plans/2026-10-05-pr-chu-ra-soat-chu.md (CHU-0 → CHU-5, prompt chung plan.md mục 9.0).
Nhánh pr-chu-ra-soat-chu. Chỉ tạo thiet-ke/CHU_CAN_SUA_2026-10.md + scripts/quet-chu.mjs; không sửa chữ trong mã.
Làm theo superpowers:executing-plans (các Task nối tiếp). Merge đầu tiên trong đợt 4.
```

**PR-NV** — Opus 5.5 · High (B: Sonnet 5.5 · High)
```
/ponytail lite
Làm PR-NV theo docs/superpowers/plans/2026-10-05-pr-nv-nhac-viec-chi-nhanh.md (NV-1 → NV-7, prompt chung plan.md mục 9.0; đọc mục
"Chủ sản phẩm chốt 05/10" ở đầu file trước). Nhánh pr-nv-nhac-viec-chi-nhanh.
NV-1 đo số câu SQL ở bước đỏ trước khi sửa; không nới quyền. Impeccable: /impeccable clarify (tên Nhắc việc), cuối /impeccable audit.
Chữ trên màn ngắn, không câu giải thích dưới nút/ô. Merge sau CHU, trước MTa.
```

**PR-MTa** — Opus 5.5 · XHigh (B: Opus 5.5 · High)
```
Làm PR-MTa theo docs/superpowers/plans/2026-10-05-pr-mta-luat-mock-test.md (Task 0 → 11, prompt chung plan.md mục 9.0; đọc mục
"Chủ sản phẩm chốt 05/10" ở đầu file trước — đè lên phần dưới). Đặc tả: docs/superpowers/specs/2026-10-05-test-mock-test-design.md.
Nhánh pr-mta-luat-mock-test. Chủ yếu máy chủ: ponytail full (Task 10 web tối thiểu: /ponytail lite cho task đó).
Task 0 bắt buộc trước: khảo sát lại sau khi DL, SL merge, ghi danh sách chỗ lệch vào kế hoạch. Có migrate prMta.ts (chạy lặp được).
Không đường TỰ ĐỘNG nào xoá điểm. Mỗi cổng ghi ở Task 11 có phép kiểm. Cuối PR /security-review trên diff. Merge cuối đợt 4.
```

### 9.4. Đợt 5 — sau khi MTa merge

**PR-MTb** — Opus 5.5 · High (B: Sonnet 5.5 · High)
```
/ponytail lite
Làm PR-MTb theo docs/superpowers/plans/2026-10-05-pr-mtb-giao-dien-mock-test.md (Task 0 → 10, prompt chung plan.md mục 9.0; đọc mục
"Chủ sản phẩm chốt 05/10" ở đầu file trước). Mockup đã duyệt: thiet-ke/mockup-test-mt-2026-10-05.html (bản 4) — chữ trên màn ĐÚNG mockup,
ngắn, không thêm câu giải thích. Nhánh pr-mtb-giao-dien-mock-test. Task 0: đối chiếu tên hàm với PR-MTa đã merge.
Impeccable theo từng task (layout, clarify, harden, adapt), cuối /impeccable audit. Bấm thử 375/1440 sáng/tối, Quản trị, QL, GVCN, GVBM.
Merge trước MT0.
```

**PR-MT0** — Opus 5.5 · High (B: Sonnet 5.5 · High)
```
/ponytail lite
Làm PR-MT0 theo docs/superpowers/plans/2026-10-05-pr-mt0.md (MT0-0 → MT0-9, prompt chung plan.md mục 9.0; đọc mục
"Chủ sản phẩm chốt 05/10" ở đầu file trước). Mockup phần 5: thiet-ke/mockup-test-mt-2026-10-05.html. Nhánh pr-mt0.
MT0-0 (phép kiểm "MT0 không làm sai đếm") viết đỏ trước mọi thứ. Có thể chạy song song với MTb, nhưng merge SAU MTb
(merge origin/main vào nhánh, dùng component ô MT của MTb, chạy lại check). Impeccable layout/clarify, cuối /impeccable audit.
```

**PR-LT3** — Opus 5.5 · XHigh (B: Opus 5.5 · High) — **chỉ chạy sau khi kế hoạch chi tiết được soạn và duyệt**
```
Bước 1 (session planning): giao agent (mẫu A, mục 10) soạn thiet-ke/mockup-lich-test-ba-khoi-<ngày>.html (chủ sản phẩm duyệt) và docs/superpowers/plans/2026-10-0x-pr-lt3-lich-test-ba-khoi.md từ plan.md mục 2c (T15–T18)
và mục 4 (PR-LT3), spec docs/superpowers/specs/2026-10-05-test-mock-test-design.md, Rulebook khối "PR-LT3". Đối chiếu canCham.ts, lichTest/*.
Bước 2 (session code): /ponytail lite · làm theo kế hoạch đó (prompt chung mục 9.0; đọc "Chủ sản phẩm chốt" ở đầu file). Impeccable: layout (khối 1, mục con),
clarify (nhãn ba khối), harden (khối rỗng, nhiều lớp), adapt 375, cuối audit. Phép kiểm đỏ trước: một bài đúng một khối; lùi tuần không đổi khối 1;
Speaking quá hạn không tính nợ GVBM/GVCN, tính trễ khi GV chấm chéo nhập muộn. Merge sau NV, MTa; trước MT0.
```

### 9.5. Đợt 6 — sau khi mọi PR trên merge

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
| 05/10/2026 | PR-DL · `pr-dl-diem-theo-lop` · Opus 5.5 | DL-0→7: bảng Điểm theo lớp (hồ sơ lớp ⋮ "Điểm MT cả lớp" + tab Test "Điểm theo lớp"), đọc theo lượt MT / Giữa–Cuối khoá, không đường ghi mới, không tự tạo lịch; lượt mặc định = lượt đang nhập. Thêm 3 đường đo tốc độ. |
| 05/10/2026 | PR-NV (Opus 5.5) · `pr-nv-nhac-viec-chi-nhanh` | "Để QL biết" → Nhắc việc; Nhắc tất cả 50 thẻ ~93 000 → 121 câu SQL (gom theo người, `myWork` chỉ nhóm cần, dừng trước 10 s), hết 404 Mini Test/Cuối khoá; dải Chờ duyệt tím/xám/đỏ cam; chi nhánh mặc định theo vai QL / lớp dạy, nhớ lần chọn. NV-6 bỏ (→ LT3). |
| 05/10/2026 | PR-SL (Opus 5.5) · `pr-sl-sua-ca-lop` | Panel Sửa thông tin học viên cả lớp (một giao dịch, Target cần lý do, GVCN không đổi Target); một mẫu Excel chung; I1 Đóng/Huỷ thay đổi, I2 Tạo Case, I3 Thêm HV, I4 KhungPanel (vẽ qua portal, Esc theo ngăn xếp), I6, D11. Check 2553 + 34 xanh. |
| 05/10/2026 | PR-CHU (Sonnet 5.5) · `pr-chu-ra-soat-chu` | **602 chữ chối** theo màn trong `thiet-ke/CHU_CAN_SUA_2026-10*.md` (file chính + 4 file con, đọc từng ứng viên trong 1 057; bấm thử 4 vai + 375, 436 trạng thái); script `scripts/quet-chu.mjs`. Không đổi mã, không chạy `npm run check`. |
| 05/10/2026 | PR-K26 (Opus 5.5) · `pr-k26-lo-trinh-tiep-theo` | "Chưa rõ" + "Xếp sau" → "Chưa quyết" (migrate `prK26`); hướng Hệ thống gợi ý đứng đầu, em 50–59% "Lưu đề xuất"; Ghi lộ trình tiếp theo cả lớp (ghi theo lô, một giao dịch); Chuyển tiếp lớp điền sẵn/hiện đề xuất GVCN. "Web gợi ý" → "Hệ thống gợi ý" (luật từ điển). |
| 04/10/2026 | PR-U12 (Opus 5.5) · `pr-u12-ket-qua-lop-thuong` | Bảng kết quả lớp thường ở hồ sơ HV theo mẫu Mock: `NhanDot` dùng chung, tên bài là link (bỏ "Bảng điểm đợt ›"), `Chờ n môn` nói một lần; đánh số Giữa khoá theo `attemptNo` (bảng xếp mới trước). Màu khi trượt tạm thời → chủ sản phẩm quyết. |
| 04/10/2026 | PR-DH · `claude/keen-mccarthy-ahp0us` (nhánh gốc `pr-dh-bang-dieu-huong`) · Sonnet 5.5 | DH-1→13: Sắp tới có kỳ vọng / Thi thật, cột Dự kiến thi (cả lớp thường), Target + Dự kiến thi ở bảng điểm lớp thường, Trước/Sau hồ sơ HV + lớp, hàng chip gọn, popover Thiếu n, D1, J8, J10; sửa lệch 16 px của mọi panel. H6 đã có từ B4; J6 giữ "Target" chờ chủ sản phẩm. |
| 04/10/2026 | PR-SO (Opus 5.5) · `claude/pr-so-so-lieu-don-ma-1ffklg` | D2 PA đại diện nhóm Bổ trợ một hàm; cấm cấp riêng plan.week cho GV; xoá completeIntervention; tín hiệu em kết thúc; dọn khoá gửi; DEP-gỡ ~1700 dòng migrate cũ + chay-thu. D3, D5 bác bỏ |
| 04/10/2026 | PR-PHH · `pr-phh-bao-ph-ban-chup` | F02: Báo PH đã xong luôn hiện 4 nội dung lúc xác nhận (cột `noi_dung_luc_bao`, migrate chỉ thêm); dòng cũ ghi rõ "chưa lưu". `npm run check` xanh (2496 + 33). |
| 05/10/2026 | Planning (Opus 5.5) · `ke-hoach-ra-172-176` | Rà PR #194 (U12) merge được; đối chiếu báo cáo rà #172–#176 (mục 2b); chốt tên "PISA Tracking", màu "Không đạt", tuần học → HK2 |
| 04/10/2026 | Planning (Opus 5.5) · `ke-hoach-sau-dot-2` | Rà sau merge PHH/SO/DH: check xanh sau khi sửa dọn thư mục tạm SO-4b (EPERM trên Windows); bấm thử DH 1440/375 đạt. Kế hoạch K26; chốt J6 Target, ba việc DH → HK2 |
| 04/10/2026 | Planning (Opus 5.5) · `ke-hoach-thong-nhat-04-10` | Gộp mọi kế hoạch vào plan.md này; xoá kế hoạch/kiểm kê/rà soát của PR đã merge. Chủ sản phẩm trả lời mục 7; kế hoạch PHH, SO, U12; thêm PR-K26; còn 8 PR, 3 đợt |
