# PISA Progress — Kế hoạch duy nhất

Cập nhật: **14/10/2026 chiều** (planning: **OV-11a…i đã merge hết** #371–#379; OV-12a luật trước deploy đang làm; đặc tả + mockup **OV-12** chờ duyệt).
File này **thay** cho: `plan.md` cũ (mục 0–24), `PROMPT_SESSION_CODE.md`, `PROMPT_BAN_GIAO_PLANNING.md`,
`docs/superpowers/plans/2026-10-03-lo-trinh-tong-hop-viec-chua-lam.md`. Bản cũ còn trong git: `git show 575e898d:plan.md`.

## 0. Dùng file này thế nào
- **Một nguồn duy nhất** cho: đã làm gì, còn gì, thứ tự, model, skill, prompt. Session planning sửa file này; session code
  chỉ thêm **một dòng** vào mục 11 (Nhật ký) khi xong PR.
- Kế hoạch chi tiết (từng Task, từng bước) chỉ giữ cho **PR chưa làm**. PR merge xong → session planning xoá file chi tiết
  của nó (git còn giữ). Hiện còn:

| File chi tiết | Dùng cho |
|---|---|
| `docs/superpowers/specs/2026-10-14-ov12-sos-workflow-design.md` | **OV-12** (prompt overhaul chủ SP 14/10): nhận xét MT = nguyên nhân SOS, hồ sơ MT Case, Góp ý hàng tuần, panel số liệu, Học viên & Lớp ba góc nhìn, hạn 2 tuần, quyền — hiện trạng, quyết định, 7 PR, kiểm chứng |
| `thiet-ke/mockup-ov12-{1..4}-*-2026-10-14.html` | Mockup **OV-12** — **chờ chủ SP duyệt** (trừ OV-12a đã chốt) |
| `docs/superpowers/plans/2026-10-14-ov11-phoi-hop.md` | Luật phối hợp tự động session code ↔ planning (dùng lại cho OV-12) |
| `docs/superpowers/specs/2026-10-14-ra-soat-cuoi-truoc-en-design.md` | Rà soát cuối trước PR-EN (OV-11, **xong**) — giữ mục 5 "Đề xuất chưa làm"; phụ lục và 9 kế hoạch OV-11 đã xoá (git còn: `git show 0e3adf32:docs/superpowers/`) |
| `docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md` | **Đặc tả Overhaul (OV)** — duyệt 11/10; nguồn chi tiết cho 12 PR OV-1a … OV-6b |
| `thiet-ke/mockup-vai-tvv-admin-cx-2026-10-13.html` | Mockup **hiển thị theo vai** TVV / Admin / CX — **đã duyệt 13/10** (OV-10a/b/c) |
| `docs/superpowers/plans/2026-10-07-pr-en-tieng-anh.md` | PR-EN (sau toàn bộ OV — đếm lại chữ trước khi chạy) |
| `docs/superpowers/plans/2026-10-07-pr-sotay-so-tay-moi.md` | PR-SOTAY (cuối cùng) |

Kế hoạch các PR OV khác: planning viết **ngay trước khi giao** (theo đặc tả), không viết trước cả loạt. Kế hoạch của PR đã merge xoá 11/10 và 12/10 (OV-1a, OV-1b, OV-2b, OV-3b, OV-6a — git còn giữ).

- **Khi các nguồn mâu thuẫn:** theo `CLAUDE.md` (quyết định chủ sản phẩm + kế hoạch đã duyệt → Rulebook + mockup → skill).
  Luật sản phẩm: `thiet-ke/PISA-Rulebook-2026-09-19.md` (mục 20 ưu tiên nhất). Đặc tả đợt hiện tại: `docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md` (OV); nền cũ: `2026-09-27-nang-cap-sau-deploy-design.md`.
- Hỏi "còn gì chưa làm": đối chiếu với **mã thật** (grep), không tin ô tick (nhiều kế hoạch cũ đã merge mà ô vẫn trống).

## 1. Luật làm việc (mọi session)

### 1.1. Chủ sản phẩm
- **Không biết code.** Báo bằng tiếng Việt cơ bản, nói theo "cái thấy trên màn" trước, tên file sau.
- Muốn: dễ hiểu · dễ dùng · gọn; giao diện tinh tế (cột hàng thẳng, không dồn chữ, màu rõ). Hỏi **gộp một lần** (≤ 4 câu,
  mỗi câu có phương án + khuyến nghị); đủ tự tin thì tự quyết và liệt kê "tôi đã tự quyết". Mockup ghi rõ **nằm ở đâu**.
- **Chữ trên web ngắn** (05/10): nhãn 1–3 từ, không thêm câu giải thích dưới nút/ô; dùng English hoặc nửa Anh nửa Việt khi tự nhiên hơn. **Mockup = đúng chữ sẽ hiện trên web**, không thêm ghi chú vào trong màn. Prompt có giao diện phải ghi rõ luật này.
- **PR có giao diện/UX: phải có mockup cho chủ sản phẩm xem và duyệt TRƯỚC khi code** (06/10): file HTML trong `thiet-ke/`, đủ rõ — các trạng thái khác nhau thật, 375 và 1440, chế độ tối (1.3b), đúng chữ thật. PR nào chưa có mockup đã duyệt thì session code **dừng, soạn mockup, báo chủ sản phẩm**, không tự chế giao diện.
- **Không tự merge, không deploy, không gửi gì ra ngoài** khi chưa được bảo. Chủ sản phẩm chỉ merge khi planning nói "merge được".

### 1.2. Quy trình một PR
1. Nhánh mới **từ `origin/main` mới nhất**, một PR một session. PR có migrate dùng file riêng `server/src/migrate/<tênPR>.ts`.
2. Chưa có kế hoạch chi tiết → `superpowers:writing-plans` viết `docs/superpowers/plans/<ngày>-pr-<mã>-<tên>.md`; điểm cần
   chủ sản phẩm quyết → `superpowers:brainstorming` hỏi trước, không tự chọn.
3. Làm từng Task **ngay trong session** (`superpowers:executing-plans`, KHÔNG `subagent-driven-development` — tốn gấp nhiều lần); mỗi Task `superpowers:test-driven-development`
   (phép kiểm **đỏ trên DB test trước**, sửa theo nguyên nhân; không khớp chuỗi nguồn cho xanh khi kiểm được hành vi);
   gặp lỗi lạ → `superpowers:systematic-debugging`.
4. `npm run check` xanh **một lần** cuối PR (một lần một lúc, foreground); giữa các Task chỉ chạy phép kiểm của Task đó.
   **Bấm thử chỉ ở session code, MỘT lần, chỉ màn PR chạm**, đính ảnh vào PR: 1440 tối + 375 sáng (đủ 4 tổ hợp chỉ khi PR đổi
   bố cục/màu), vai = những vai PR chạm (thường QL + một GV). PR chỉ máy chủ: không ảnh — phép kiểm + số đo là đủ.
5. PR có giao diện: `/impeccable audit` (một lần, cuối). Mọi PR: `/ponytail-review`, rồi mở PR (**không merge**). Không chạy
   thêm `requesting-code-review` / `verification-before-completion` / `finishing-a-development-branch` (planning đã rà).
6. Mô tả PR **≤ 30 dòng**: làm gì (theo Task), phép kiểm, ảnh, giới hạn còn lại, chú thích `ponytail:`, ảnh sổ tay bị lệch.
7. Merge sau người khác → `git merge origin/main`; chạy lại `npm run check` **chỉ khi có xung đột mã** (xung đột chỉ plan/CODE_MAP thì không).
   Xung đột ở `run.ts`, `schema.sql`, `routes/index.ts`, `CODE_MAP.md`, mục 11 file này: **giữ cả hai** (chỉ thêm dòng).
8. Xong: `[x]` trong kế hoạch chi tiết, một dòng mục 11, cập nhật `CODE_MAP.md` nếu thêm/xoá file.

### 1.3. Rà PR
- Người rà là session planning (Opus 5.5); kiểm model thật qua dòng `Co-Authored-By`.
- **Mặc định planning tự đọc diff + xem ảnh trong PR** — không agent, không `npm run check`, không bấm thử, khi session code báo
  check xanh và GitHub báo mergeable clean.
- **Rà sâu** (agent mẫu 10B: worktree, `npm run check`, gọi API bằng vai khác, bấm thử) CHỈ khi PR: đổi quyền · có thể mất dữ
  liệu / migrate · sửa luồng chính (xếp lịch, nhập điểm, huỷ, chuyển lớp) · ảnh thiếu hoặc đáng ngờ · logic máy chủ lớn.
- PR có giao diện: planning chạy thêm `impeccable` **`audit`** (skill trong repo từ #329, 12/10) trên phần màn PR chạm, ghi lỗi vào tin nhắn sửa.
- Rà xong: planning soạn **tin nhắn sửa** (file:dòng) để chủ sản phẩm dán vào session code; sửa xong rà lại phần đã sửa.
  Việc nhỏ còn lại → ghi vào mục 4 file này (không để mất).

### 1.3b. Tiết kiệm token (chủ SP 10/10) — giao diện PISA căn bản, dồn sức vào đúng chỗ
- **Tập trung:** đúng luật nghiệp vụ (Rulebook) · quyền · không mất dữ liệu · tốc độ / Turso · luồng gọn ít bước. Giao diện:
  chỉ `clarify` (chữ), `harden` (lỗi, rỗng, chữ dài), `adapt` (375), `audit` cuối; KHÔNG `polish`, `animate`, `colorize`,
  `bolder`, `delight`, `overdrive`. Chuẩn giao diện = `DESIGN.md`; không bàn lại phông/màu.
- **Mockup** chỉ cho màn / luồng MỚI hoặc đổi bố cục. Đổi chữ, thêm một nút / một ô theo mẫu sẵn có, dời vị trí nhỏ: mô tả bằng
  chữ trong kế hoạch, không mockup. Mockup: 1440 + 375, chế độ tối, chỉ những trạng thái khác nhau thật.
- **Kế hoạch PR ≤ 200 dòng** (chữ ký + phép kiểm, không chép thân hàm). Việc nhỏ (< 3 file): không cần file kế hoạch, prompt đủ.
- **Agent:** planning tự viết kế hoạch PR nhỏ/vừa (không agent soạn); rà theo 1.3 (agent chỉ khi rà sâu).
- **Báo cáo** session code ≤ 15 dòng; planning trả lời chủ SP ngắn, không chép lại diff.

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
10. Merge nhầm rồi revert (#271, 08/10) → merge lại nhánh cũ KHÔNG đưa code vào. Phải tạo nhánh mới từ main, `git revert <commit revert>`, mở PR mới (đã làm #272).

## 2. Đã làm (đã merge vào `main`, kiểm bằng danh sách PR GitHub 12/10)

| Giai đoạn | PR (số GitHub) | Nội dung chính |
|---|---|---|
| Overhaul OV (11–12/10, chưa deploy) | #315 OV-6a · #316 OV-1a · #320 OV-3a · #322 OV-2a · #323 OV-1b · #325 OV-3b · #326 OV-2b | Lịch sắp tới gọn · MT0 đúng bảng + Nhập điểm → Điểm theo lớp · hồ sơ lớp + Thông tin lớp · vai Admin/TVV/CX + góc nhìn · "-" = Vắng chốt ngay, Không dự thi, Bỏ vắng · Lộ trình nháp/chốt + KQĐR + bàn giao · hồ sơ HV Sửa thông tin, Tạm dừng / Thôi học. Chi tiết: mục 11 |
| Demo đầu tiên (08–17/09) | #1–#17 | Bản demo chạy trên máy |
| Sau PR18 (18–20/09) | #18–#30 | PR1 số khớp danh sách, PR-A Case Ý thức, PR2 bộ chọn tuần + Kế hoạch Test, PR-C form Case, PR-D khung Case, PR-E…I (nền giao diện, hợp đồng số liệu, dấu "-", hồ sơ Test, biên tập chữ) |
| Lộ trình 8 PR + v3 (21–22/09) | #31–#66 | PR-N bằng chứng, PR-J Ý thức vi phạm/biện pháp, PR-T máy chủ v3, PR-K/K2/K3 giao diện Ý thức, PR-Z2a/b/b2 hạ tầng Netlify + Turso, PR-HV hồ sơ HV, PR-S1, PR-O 4 khu vực, PR-AN an toàn, PR-S2 |
| Trước deploy lần 1 (22–24/09) | #67–#103 | PR-Pa, Qa, Qb, Rc1, Rc2, Form, Pb, TD tốc độ, YT2/YT2b, Ra, LT, UX0–UX5 overhaul, Z2c (deploy bản chính), XOA |
| Nâng cấp 6 đợt (26/09–01/10) | #104–#162 | Đợt 1 N1·LOP·NEN · đợt 2 DUYET·MT·NHAP·MON·KCK · đợt 3 XLMT·SOS·YT4 · đợt 4 HSM·XUAT·HVL·SANG · đợt 5 GV·LT2a·LT2b·CT · đợt 6 Pb2·VAI-a/b·UXF-a/b·UXD·S6F·Dọn-a·S3 + sửa sau rà S3f…S6f |
| Deploy + UX 02/10 (01–03/10) | #160–#180 | Reset tại chỗ, PR-DEPLOY, sổ tay GV/QL, S3 nốt, tốc độ tách trang, Dọn-b, UX-G (G1–G5), HK1 (K3, K1 điện thoại, H3–H5), Ý thức thang mới, **PR-PH** (hết báo đăng xuất giả). **Bản chính đã deploy 03/10** |
| Đợt 3 (05/10) | #194 | **U12** bảng kết quả lớp thường ở hồ sơ HV theo mẫu Mock Test (NhanDot dùng chung, "Chờ n môn", Giữa khoá 1/2) |
| Đợt 2 (04/10) | #190–#192 | **PHH** Báo PH lưu bản chụp nội dung (migrate `prPhh`) · **SO** D2 một nguồn PA đại diện, cấm cấp riêng `plan.week` cho GV, xoá `completeIntervention`, tín hiệu em đã kết thúc, dọn khoá gửi, gỡ mã chuyển dữ liệu cũ (−1 700 dòng) · **DH** Sắp tới có kỳ vọng / Thi thật, cột Dự kiến thi, Trước/Sau hồ sơ HV và lớp, đầu trang Học viên & Lớp gọn, popover Thiếu n, D1, J8, J10, panel không lệch xuống (`!mt-0`) |
| Đợt 3–6 (05–07/10) | #193–#247 | **K26** lộ trình theo dải % · **SL** sửa cả lớp · **CHU** · **NV** Nhắc việc · **DL** Điểm theo lớp · **BN/BN2** RAM phép kiểm · **MTa** luật Test máy chủ · **MTb** giao diện Mock Test · **LT3** Lịch Test ba khối · **TK** Tổng kết lộ trình · **LUI-a1/a2/b** đường lui · **BV** xoá "-" · **MT0** · **KHUNG** · **HK2** badge & chữ · Quản trị sửa tài khoản · ô chọn người gõ được · **OMT** ô MT gọn · sửa Turso (#236) |
| Sau deploy 07/10 (07–09/10) | #249–#285 | **TD2** tốc độ chuyển trang · **HAN** hạn xác nhận 5/3 ngày · Nhắc tất cả, lọc Chờ duyệt (#263) · **LCa/LCb** lộ trình tiếp theo một panel · **PA** một mẫu PA · **CL** chuyển lớp · **CT2** chế tài Final · **KV** Kỳ vọng đầu ra · sửa `tx()` Turso (#277) · **GOP** gộp việc · **MTGON** / **LTGON** chống kẹt · FIX-DTL2/3. **Bản chính đang chạy = #285** |
| Sau deploy 09/10 (chưa deploy) | #286–#312 | Điểm theo lớp lọc · **MTUI** · **KIEM-DU-LIEU-MT** · **QL-TEST** chỉ QL lo lịch · **NO-CT2-KV** · **XTHV** · **NO-NHO** · **HOP1** · **TEN** · PRODUCT/DESIGN.md · **TD3** · **VN3** · **VN4** · **VN5** · **DON** · **CACHE** · **VN6** · **KV-thiếu** (luật A). PR-CHENMT (#248) đóng, không làm |
| Đợt 0–1 sau deploy (04/10) | #182–#188 | **QU** quyền + tạo lớp hàng loạt + GVCN phân công + GV đóng Case · **GVa** F01/D13 khoá gửi, F03, F04 · **LM** lịch MT linh hoạt (LM-1→7, gồm I5 và I4 phần MT) · **GVb** Chờ duyệt (D01/Q-B, J5, J5b, U01, Bị từ chối) · **BC** Báo cáo đơn vị + Tài khoản (L2, L3, D8, D9, J10 phần Quản trị) · **NT** Target + Dự kiến thi lớp thường, dán không tiêu đề |

Còn treo của các PR cũ: PH, GVb G5 ("Nhắc tất cả" #263), DH → ✅ HK2 #235; PHH migrate đã chạy ở deploy 07/10; SO (`migrateLegacyDisciplineCases`, `tenMoiChoLopCu`) → hoãn (mục 8).

## 2b. Đối chiếu báo cáo rà #172–#176 — ✅ xong hết (UX-I → SL #203, UX-J/H/K → HK2 #235). Bảng chi tiết: `git show 0ac4c41b:plan.md`.

## 2c. Luật Test / Mock Test T1–T23 (05–06/10) — ✅ đã vào mã (MTa #212, MTb #219, LT3 #218, MT0 #226, BV #228, MTGON #282); giữ làm tra cứu
**Bị thay:** T2 (dời vượt huỷ kết quả) → MTGON 08/10 "dời hợp lệ giữ điểm, vượt/trùng thì báo"; T3 + T23 phần dấu "-" → OV 11/10 (mục 3): trong tuần thi "-" = vắng chốt ngay, nhập bù / MT cũ = Không dự thi; T18 giữ.

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

## 3. Quyết định còn hiệu lực cho việc chưa làm (dòng của PR đã merge bỏ 11/10 — xem `git show 0ac4c41b:plan.md`)
| Ngày | Quyết định | Vào PR |
|---|---|---|
| 04/10 | C02: **giữ chặn** — GVCN không dạy môn đó không ghi bù Case môn đó | (không làm) |
| 06/10 | **Ô nhập ngày ở mọi nơi = ô gõ + nút lịch** (`ONgay`), không làm hàng nút Hôm nay / Hôm qua / 2 ngày trước; nhãn tuỳ chọn giữ chữ chuẩn "(không bắt buộc)" | mọi PR (LUI-b giữ ô ngày) |
| 07/10 | PR-EN: nút **"VI \| EN"** chữ nhỏ cạnh nút Sáng/Tối; màn đăng nhập **hai nút to "Tiếng Việt \| English" ngay trên khung**; **bảng thuật ngữ EN planning tự chọn** (tiếng Anh tự nhiên của trung tâm IELTS), chủ sản phẩm xem trước khi merge; **lần này planning được tự duyệt mockup EN** (chỉ đổi chữ + nút đổi ngôn ngữ, giữ giao diện) **và dàn ý sổ tay**, chủ sản phẩm xem ảnh trước khi merge | EN, SOTAY |
| 10/10 | **Kỳ vọng đầu ra (luật A):** Overall MT0 cần **≥ 3/4 kỹ năng có band**; W có band chỉ khi đủ W1 + W2; < 3 → "Chờ MT0"; kỹ năng thiếu = "chưa thi", không vào kỹ năng trượt; Đạt/Không đạt vẫn do QL chọn | KV #312 |
| 06/10 | **Không dùng Fable** ở mọi session, kể cả subagent | mọi PR |
| 11/10 | **Overhaul (OV)** — vai: **TVV** xem cả CN, mặc định "HV của tôi"; sửa họ tên, ngày sinh, email, TVV, dự kiến thi, điểm đầu vào (không Target); không Test, không Công việc · **CX** = như TVV ở mọi CN, xem Phân tích trừ phần GV · **Admin (MT)** dựng lại: xếp/dời lịch MT + MT cũ + lịch PT/Final/MT0 lớp thường, xem + sửa điểm, Kế hoạch Test, Công việc Chấm điểm + Nhắc, sửa thông tin HV như TVV; **không** huỷ/khôi phục | OV |
| 11/10 | Đổi góc nhìn (QL, Quản trị nhiều vai) = **làm việc đúng quyền vai đang chọn**, chỉ vai đang nắm · Ô TVV = ô chọn người như chọn GV, chữ TVV cũ hiện mờ để chọn lại (không tự gán) · ~~Email + ngày sinh bắt buộc khi thêm/sửa~~ (thay bởi dòng 14/10 Q3) | OV |
| 11/10 | Lộ trình mới (QL nháp → chốt, bỏ GVCN đề xuất lộ trình; nhắc từ Final−2, chốt trước hết tuần Final−2; bàn giao trước hết tuần Final, **≥ 2 ngày sau chốt**) **chỉ lớp thường**; FT giữ Chuyển tiếp lớp, **bàn giao FT 5 ngày** · Sửa lộ trình đã chốt tới ngày chuyển, đổi hướng/lớp đích → GV bàn giao lại · **Kết quả đầu ra** (GVCN đề xuất, QL chốt) cho em Lên FT từ FOU/BE/ELE theo MT0; **FOU đạt khi Overall > 3.5** | OV |
| 11/10 | **SOS MT**: có điểm đầu tiên chỉ "SOS tạm thời" (không Case, không hạn); **chốt** khi đủ điểm hoặc kỹ năng thiếu đã dời tuần / huỷ / Không dự thi → Case + hạn 3 ngày; lúc chốt Overall đạt kỳ vọng → không SOS; sau đó kỹ năng dời có điểm và thành đạt → xoá SOS. Chỉ MT, không lớp thường | OV |
| 11/10 | **Huỷ cả lượt MT** giữ điểm ẩn; **Khôi phục** = nguyên trạng (chỉ QL; đã xếp lượt cùng số mới → chặn kèm câu rõ) · **Dấu "-" trong tuần thi = Vắng, chốt ngay** (lần 1 dời tuần sau, lần 2 huỷ phần thi); **nhập bù sau tuần thi / MT cũ = Không dự thi** (không dời); đường lui: "Bỏ vắng" trong hộp hoặc nhập điểm thẳng · Lịch Test: dòng lớp tách "phần của bạn" / "GV khác", nhãn và số đếm cùng một cách tính | OV |
| 11/10 | Lộ trình tự cấu hình: **Quản trị** tạo/sửa, áp cho **lớp mở sau** · **PET/KET**: môn L+S, R+W; checkpoint mỗi 6 tuần; liên tục; chấm số câu đúng/tổng như lớp thường | OV |
| 11/10 (mockup bản 1) | **Công việc**: panel Xác nhận nguyên nhân gom theo lớp + kỹ năng + lượt, mở rộng chứa đủ **PA** (Loại theo quy chế · Nội dung · Số buổi · Người · Ngày bắt đầu), "xác nhận cùng lúc" mặc định bật; điện thoại mở màn đầy đủ · **Hộp nhập điểm** MT: dưới tên em ghi "MT · tuần"; **W1, W2 hai hộp riêng**, nhận xét riêng, lưu một task vẫn được; "Bỏ vắng" = GV đúng kỹ năng + GVCN + QL khi tuần mới chưa có điểm; lớp thường giữ ô gõ thẳng + nút Nhận xét · **Huỷ lượt MT**: giữ PA đang chạy, **trừ PA có kết quả gần nhất "Chưa đủ dữ liệu"** (đóng cùng lượt) | OV |
| 11/10 (mockup bản 1) | **Bảng Lộ trình tiếp theo** chia theo hướng: Chưa chọn · Lên FT · Lên {lớp kế} · **Học lại** (gồm học lại cùng trình độ và xuống lộ trình dưới) · Tạm dừng · Dừng học; **mọi bảng có ô chọn lộ trình cạnh điểm**, đổi lộ trình → em sang bảng tương ứng · không làm nút "Lộ trình" hai tab · QL chốt KQĐR → hệ quả chạy ngay; đổi lộ trình đã chốt → chuông "Cần làm" bàn giao lại · **Điểm đầu vào** hiện thành dòng mốc "Đầu vào" ở chỗ MT0 trong **bảng Điểm hồ sơ lớp FT** (chỉ để nhìn) · Hồ sơ HV: làm cả (a) lộ trình một em mở hộp Lộ trình của bảng lớp, (b) Target gộp vào Sửa thông tin (GVCN → Đề xuất sửa) · Admin xem Case/PA/Ý thức/Phân tích; TVV/CX đọc nhận xét GV · **PET/KET chưa đạt: chỉ chip SOS nhỏ**, không tự tạo Case/PA (bàn sau); không Target, không lộ trình tiếp theo; tên `{CN} PET {số}` | OV |
| 11/10 (duyệt đặc tả) | **Deploy MỘT lần sau khi xong toàn bộ OV** (không deploy sớm sau OV-1a); lệnh chỉ đọc chạy từ máy chủ SP trên bản chính không cần deploy · 3 mục [tự quyết] của đặc tả được đồng ý (CX trừ phần GV; MT0 tạo lúc chốt; xoá SOS: Case chưa ai làm đóng, đã làm giữ + ghi "Overall đã đạt") | OV |
| 12/10 | SOS MT chốt: hạn xác nhận **giữ `soNgayHanXacNhan`** (5 ngày, SOS 3 = 3 ngày) **tính từ ngày chốt** · **Không làm** ô "Dự kiến quay lại" ở tab Tạm dừng (mockup M2 §6) | OV-1c / — |
| 13/10 | **Sửa sau khi lưu**: việc đã lưu / xác nhận / gửi phải mở lại sửa và lưu lại được ở hầu hết các chỗ (ai lưu được thì sửa được + QL; không thêm bước duyệt; nhật ký trước → sau). Giữ khoá: báo cáo đơn vị hết cửa sổ, lệnh chuyển lớp đã thi hành, Case hệ thống đóng, nhật ký, chuông đã gửi | OV-7a, OV-7b |
| 13/10 | **Bước tiếp sau thi thật**: có kết quả thi → **QL** chọn Kết thúc (Lưu trữ) · Học tiếp lộ trình mới (LT1 → LT2…) · Học lại; không tự Lưu trữ khi nhập kết quả; việc QL nhắc | OV-8a |
| 13/10 | **TVV** (thay dòng 11/10): sửa mọi thông tin HV **kể cả Target** (có lý do, như QL) · Tạm dừng / Quay lại học / Thôi học · nhập kết quả thi thật · ô TVV chỉ TVV cùng chi nhánh; học thuật (điểm, Case/PA, Ý thức, lộ trình, KQĐR) vẫn của GV / QL. CX như TVV | OV-8b |
| 13/10 | **KCK nhẹ**: KCK là dấu riêng, Target giữ; em KCK dưới kỳ vọng → không SOS, chip xám, Case nhẹ cho GV (không PA quy chế, không hạn, không Phối hợp / báo QL) | OV-9 |
| 13/10 | **Hiển thị theo vai** (mockup duyệt): TVV / CX / Admin thấy cột, khối, Tổng quan theo việc của vai; nút / link chỉ hiện khi máy chủ cho làm. QL, GVCN, GVBM không đổi | OV-10a/b/c |
| 13/10 | **Liên hệ**: SĐT em + phụ huynh (tên, quan hệ, SĐT); **mọi vai xem**, **không bắt nhập**, chỉ nhập ở hồ sơ HV + Sửa cả lớp (hồ sơ lớp), thường TVV nhập; GV không thấy ô nhập; không tính "Thiếu thông tin" | OV-10b |
| 14/10 | **Chủ SP chốt (sáng 14/10):** Q1 lớp thường "-": tuần thi **≥ 2 tuần trước → bỏ** (Không dự thi), **trong 2 tuần** → dời sang tuần sau của tuần hiện tại · Q3 "Thiếu thông tin" tính **ngày sinh + email**; **không bắt buộc** khi thêm / sửa; TVV phải cập nhật, **không hạn** · Q8 KCK tích **lúc nào cũng được**, **chỉ QL / Quản trị / TVV**, luật nhẹ từ sau khi tích · Q13 dời lịch môn **chỉ QL**; GV gõ "-" máy vẫn tự dời · OV-1e: giữ **mọi** ô có lịch thi lại, không theo ngày (OV-11e) | OV-11a, d, e, g |
| 14/10 | **Planning tự quyết, chủ SP "ok"** — chi tiết: đặc tả rà soát mục 3. Q2 "Báo vắng" sau tuần thi = Không dự thi (một luật với "-") · Q4 lớp đã kết thúc: **chỉ QL** sửa điểm; hồ sơ Lưu trữ **khoá** · Q5 "xong MT" = đủ điểm bắt buộc · Q6 "Của GV" gồm mọi việc của GV (cả Bàn giao) · Q7 bỏ thẻ "Lớp hết khoá · chưa có quyết định chuyển lớp" ở lớp thường · Q9 chuông lọc theo góc nhìn · Q10 hạn Thêm PA giữ, một hàm · Q11 em Kết thúc học chưa Lưu trữ hiện mờ ở lớp cuối · Q12 Lưu trữ bỏ ô tích, có Hoàn tác | OV-11a…i |
| 14/10 (chiều) | **OV-12 — chủ SP chốt:** hạn kết quả PA **2 tuần**, hết **Thứ Ba**, kỳ theo tuần từ tuần bắt đầu PA (17/09 → 29/09, 13/10…), hạn cố định (ghi sớm / muộn / ghi bù không dời lịch), PA đang chạy tính lại (không sớm hơn hạn cũ) · QL xoá lớp **trống**, xoá **nhiều** HV, lưu trữ (điều kiện giữ) · TVV nhập thi thật + chọn **Bước tiếp sau thi cả 3 hướng** (không phải PA học thuật) · MT **bắt buộc nhận xét** L/R/W1/W2/S trong hộp chấm + **nhóm nguyên nhân khi dưới kỳ vọng** = nguyên nhân Case SOS → **bỏ xác nhận nguyên nhân** (giữ xác nhận PA) · Case MT cũ chờ nguyên nhân → việc "Ghi nhận xét" · Tổng hợp Xử lý: HV - Case · Chờ duyệt (rộng) · Đang xử lý · "Đang SOS" theo **tuần thi** · hồ sơ MT có bảng Case (thay Rulebook 17.5). Planning tự quyết P1–P14: đặc tả OV-12 mục 2 | OV-12 |

## 4. Việc chưa làm (kiểm với danh sách PR GitHub 11/10 — mọi PR tới #312 đã merge)

### OVERHAUL 11/10 (OV) — đặc tả DUYỆT 11/10, bắt đầu OV-1a · ưu tiên trên mọi việc khác
- **Đặc tả (nguồn chi tiết duy nhất):** `docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md` — đối chiếu hiện trạng, ma trận vai,
  quy trình (lộ trình → bàn giao → KQĐR, SOS MT, dấu "-", huỷ/khôi phục), giao diện, **12 PR OV-1a … OV-6b** + phụ thuộc, tiêu chí nghiệm thu.
- Mockup bản 2 (góp ý 11/10 đã áp): `thiet-ke/mockup-overhaul-{1,2,3}-*-2026-10-11.html`.
- Quyết định: mục 3 (các dòng 11/10). Thứ tự, model, prompt: mục 5, 6, 9.
- **Tình trạng 13/10 (đêm): ĐÃ MERGE HẾT OV** (tới OV-10b #363); đã chạy 3 lệnh chỉ đọc trên bản chính (kết quả: `git show 1b06b42:docs/superpowers/plans/2026-10-14-ban-giao-planning.md`).
- **14/10: OV-1e #366 đã merge**; `kiem-truoc-ov1b` bản chính 14/10: 31 ô đổi, 18 ô giữ lịch thi lại W3 OCT — điều kiện theo ngày sẽ sai khi deploy muộn → OV-11e sửa; **chạy lại `kiem-truoc-ov1b` sau khi OV-11e merge, ngay trước deploy**. **Rà soát cuối toàn web xong** → 9 PR **OV-11a…i** (mục 5, 9.3).
  **14/10 chiều: OV-11a…i ĐÃ MERGE HẾT** (#371–#379). Chủ SP 14/10: thêm **OV-12a** (hạn kết quả PA 2 tuần + quyền QL xoá / TVV bước tiếp — luật phải vào trước deploy, migrate `prOv12a`).
  Việc tiếp: OV-12a merge → chủ SP chạy lại `kiem-truoc-ov1b` (+ câu SELECT OV-11d nay in trong cùng lệnh) → **deploy MỘT lần** (13 migrate) → OV-12b…g (theo mockup duyệt) → PR-EN → PR-SOTAY → deploy lần 2.
  **Sau deploy:** chủ SP đổi mã Turso (mã bản chính lộ trong chat 13/10): tạo mã mới ở Turso → cập nhật `TURSO_AUTH_TOKEN` trên Netlify → thu hồi mã cũ.
  OV-4 và OV-6b của đặc tả **tách đôi** (mỗi nửa một vùng mã, rà riêng). Thứ tự + song song: mục 5; prompt: mục 9.3.
- **Chủ SP trả lời 12/10:** (1) hạn khi SOS MT chốt = luật hiện có (5 ngày, SOS 3 = 3 ngày), tính từ ngày chốt; (2) **không làm** ô "Dự kiến quay lại" (mục 3).

### Sau deploy (chờ số liệu bản chính)
- **PR-TD4** (M): chỉ khi log `[cham]` 1–2 ngày sau deploy còn đường > 1,5 s — `/hoc-vien-lop` (`standingFor` nạp từ lượt mới nhất mỗi em, còn 78 % dòng), đường top khác theo log.
- **Dọn bộ bổ trợ trùng**: chỉ khi `npm run dem-bo-tro-trung` (chỉ đọc) trên bản chính báo có em > 1 bộ PA bổ trợ cùng bài.

### OV-12 (prompt overhaul chủ SP 14/10) — đặc tả `docs/superpowers/specs/2026-10-14-ov12-sos-workflow-design.md`
- **Đã merge 14/10:** OV-12a #381 · OV-12b #383 · OV-12h #386 · OV-12g #388 · EN-a #385 · sửa build #387. Mockup v3 (`thiet-ke/mockup-ov12-panel-v3-2026-10-14.html`): chủ SP trả lời 3 câu cuối 14/10 tối (đặc tả mục 7.12).
- **Đang chạy (cloud, mỗi PR một session; báo cáo trong mô tả PR):** OV-12c (Case MT từ nhận xét · Progress "Xác nhận Case" 5 ngày giữ PA Bổ trợ · xoá Case khi đạt chưa xác nhận PA · migrate `prOv12c` ĐỔI DỮ LIỆU) · EN-b (tiếng Anh Công việc / Test / nhập điểm / ghi kết quả PA).
- **Việc tiếp (planning viết prompt, chờ chủ SP cho giao):** OV-12d (Tổng hợp nhóm Xử lý 3 cột HV - Case · Chờ duyệt · Đang xử lý + hồ sơ MT khối Case & PA, sửa Rulebook 17.5) · OV-12e (hệ panel v3 toàn web: Công việc, Tổng quan, panel số liệu, hồ sơ, Ý thức; chip hạn ≤ 3 ngày vàng ở `deadlineView`) · OV-12f (Học viên & Lớp ba góc nhìn Tất cả · Đang SOS · Cần làm + panel một em; CX "Cần chú ý") · EN-c (hồ sơ HV / lớp) · EN-d (Case, Ý thức) → PR-SOTAY.
- **Việc nhỏ còn lại từ rà OV-12 (không chặn, gom vào PR chạm vùng đó):**
  - Nhãn nhật ký PA "ghi thêm" mang kỳ sau (`shared/domain/paDongBo.ts:180`).
  - Ghi muộn T2/T3 sau kỳ kế: phải ghi lại hôm sau (đúng ví dụ chủ SP — giữ, chỉ ghi để biết).
  - QL xoá em đã chuyển chi nhánh: xoá luôn lịch sử cũ (luật xoá có sẵn).
  - Form kết quả PA còn chữ "Người dạy tuần này" (chữ "tuần") → OV-12e / EN-b.
  - Bàn giao bỏ cả Nhắc GVCN→GVBM (chủ SP chưa phản đối).
  - Góp ý hàng tuần: em đã chuyển đi không hiện hàng ở lớp cũ; rời trang trong app không hỏi.
  - Nhóm nguyên nhân đòi cả em KCK và W1 dưới kỳ vọng khi Writing tổng đạt — planning chọn giữ theo từng task.

### Sau OV
- **PR-EN** bản tiếng Anh (kế hoạch `2026-10-07-pr-en-tieng-anh.md` — đếm lại chuỗi vì OV / OV-12 đổi nhiều màn; chạy **sau OV-12**) → **PR-SOTAY** (cuối cùng) → deploy lần nữa.
- **PR-NC** thống kê nghiên cứu: xem lại tháng 12 (cần 2–3 tháng dữ liệu).

### Ghi chú không chặn còn mở (kiểm lại khi PR đụng tới; đã bỏ mục DON #308, VN3 #302, NO-CT2-KV #290 đã xử lý)
- Hồ sơ MT: lượt không có `classId` → "Dời lịch thi cả đợt" không mở gì (hiếm) — HOP1.
- `suggestCaseOwner` chạy theo (lớp FT, kỹ năng): lô 500 em nhiều lớp có thể > 200 câu — KV; **OV-3b chạm KQĐR thì đo lại**.
- Case Học viên (KQĐR "Không đạt · Học viên") mang kỹ năng đầu tiên — KV, chủ SP xem khi rà OV-3b.
- CT2: `huyNhieuLenh` / khôi phục nhiều lệnh ~25 câu/em — thêm phép đo 8 em, vượt thì gom lô (**OV-3b** chạm lệnh chuyển); giới hạn tự ghi (đổi lớp đích / tuần mà giữ quyết định không sinh lại bộ; Pre FOU Người dạy trống; sinh từ ô điểm cuối thì người xác nhận = người nhập).
- **MT0 lớp thường đã nhập band vẫn là việc "Nhập điểm MT0"** (lỗi có sẵn, OV-3c phát hiện): `listAttempts` (`server/src/fasttrack/attempts.ts` ~655) đi nhánh lớp thường cho `kind = 'mt0'` → đòi `raw_score`; lệch Nợ điểm (`scoringModeOf` đã coi mt0 là band). Sửa: bỏ mt0 khỏi nhánh `regularSkills` — **OV-1c / OV-4b** (vùng `fasttrack/*`).
- **Bộ demo không thêm được lượt MT nào** (OV-3c đo 12/10): `tocDo.run.ts` PR-TD Task5(2) — demo có 299 lượt, ×3 = 897 sát lô 900 tham số (`theoLo`); thêm ≥ 2 lượt (vd một em chuyển vào FT, tự sinh lịch MT) → QT `/tong-quan/chi-nhanh`, `/my-work` thêm 6–8 câu (một lô nữa) → đỏ. Vì vậy OV-3c không seed đợt FOU / nhiều đợt (MB FT 104) — planning chọn: nới phép đo theo số lô, hoặc chấp nhận +1 lô. Kèm: thêm seed làm dời id → chụp lại băm DL-2 (`prDl.tests.ts`).
- Sổ tay lỗi thời ("Nộp kế hoạch bổ trợ", "Đánh dấu kỳ vọng đầu ra") → PR-SOTAY.
- **Còn lại sau rà OV-11 (14/10, không chặn):**
  - Công việc: MT0 lớp thường chỉ số Nợ điểm đếm W1 + W2, Công việc đếm Writing 1 bài (`listAttempts` nhánh ratio) · panel Nhập điểm mở "Cả lớp" có hai thanh chip · em cuối của dòng gộp xong rơi xuống cuối · "Nhắc tất cả" khi lọc hạn nhắc từng việc con (nhiều chuông hơn) · dòng gộp "1 em" mất "2 việc" · tiêu đề PanelViec vẫn đổi theo việc khi chip giữ L · `nhomMiniTestCho` / `boKetQuaChoMiniTest` IN không chia lô.
  - Vắng: lưới tuần gốc không có hàng em khi mọi kỹ năng đã dời · Khôi phục phần thi xoá dấu "-" (vết chỉ còn nhật ký) · Kết quả lớp thường có môn Không dự thi vẫn "chưa đủ môn".
  - Tổng quan: Kế hoạch Test chưa có lọc theo em ("xong MT3" mở panel danh sách) · Đánh dấu đã đọc ở Góc nhìn khác gọi từng thông báo (lô 20).
  - Quản trị: "Chưa có kỹ năng" chỉ xét vai GV (QL dạy mà không vai GV không có ô — chủ SP xác nhận nếu cần).
  - KCK: lượt huỷ trước deploy rồi khôi phục chưa có dấu `kck_at_attempt` (đọc cờ hiện tại tới lần tính lại) · migrate `prOv11e` ~4–5 câu / lượt — **đo thời gian khi tập dượt bản sao chính**.
  - Phân tích: chương trình QT tự tạo ngoài PET / KET chưa có bảng kỹ năng riêng; Xuất "theo đợt" lớp thường chỉ Progress / Final.
  - Giao diện: `web/src/lib/api.ts` nhận 403 theo câu chữ (`ponytail:`) · app không đọc `prefers-color-scheme` (bấm thử 375 sáng phải bật nút).
  - Kiểm: `npm run check` chạy ≥ 2 lần cùng lúc từng sập libsql (0xC0000005 / segfault) — chạy lại thì xanh.

## 5. Đợt chạy, thứ tự merge, deploy (chủ SP 11/10)

Chạy **từng PR một** theo phụ thuộc (đặc tả mục 5). Song song chỉ khi hai PR không chung file (planning ghi rõ trong prompt).

**OV-11 ✅ (14/10):** a #372 · b #374 · c #371 · d #378 · e #375 · f #373 · g #379 · h #376 · i #377 — 3 luồng session tự phối hợp, planning rà + tự merge.

**OV-12 (14/10, đặc tả `2026-10-14-ov12-sos-workflow-design.md` mục 5):**
| PR | Việc | Sau | Song song | Rà |
|---|---|---|---|---|
| ✅ | OV-12a #381 · OV-12b #383 · OV-12h #386 · OV-12g #388 · EN-a #385 | — | — | — |
| **OV-12c** (đang chạy) | Case MT từ nhận xét · Progress "Xác nhận Case" · xoá Case khi đạt · migrate `prOv12c` | OV-12b, OV-12h | EN-b | sâu + tập dượt migrate (đếm dòng đổi) |
| **EN-b** (đang chạy) | Tiếng Anh Công việc / Test / nhập điểm / kết quả PA | EN-a, OV-12b, OV-12h | OV-12c | mặc định |
| **OV-12d** | Tổng hợp nhóm Xử lý 3 cột + hồ sơ MT khối Case & PA (sửa Rulebook 17.5) | OV-12c | OV-12e, f | mặc định |
| **OV-12e** | Panel số liệu mở rộng dòng toàn web | OV-12c | OV-12d, f | sâu |
| **OV-12f** | Học viên & Lớp ba góc nhìn + SOS theo tuần | OV-12c | OV-12d, e | sâu |
| **EN-c**, **EN-d** | Tiếng Anh hồ sơ HV / lớp · Case, Ý thức | EN-b + PR OV-12 chạm cùng màn | — | mặc định |

**Deploy (14–15/10) — ĐÃ XONG:** lần 1 (đêm 14/10) = main tới #384 (13 migrate): migrate thẳng Turso đứt 6/6 (một giao dịch 10–20 phút) → sao lưu, migrate file cục bộ (`PISA_DB`), `khoi-phuc` sang database MỚI **`pisatracking-261014`** (token mới thay mã lộ 13/10), đổi biến Netlify. Lần 2 (15/10 03:02) = main tới EN-d #396 + OV-12d #393: migrate thẳng `pisatracking-261014` ~20 phút, xong (`prOv12c`: 4 Case MT có nguyên nhân, 29 Case MT → việc "Ghi nhận xét", 25 thẻ Báo lên đóng, 11 Case Progress nhãn SOS; `prOv1b` 2 ô "-" → Không dự thi).
  **Sau deploy:** thu hồi token database cũ `pisatracking`; giữ `pisatracking` ~1 tuần làm đường lùi rồi xoá cùng `pisatracking-demo-thu-mig`; theo dõi log `/my-work` (5–7,5 s) → PR-TD4. **#397** (migrate mỗi bước một giao dịch ngắn) đã merge: deploy sau = sao lưu → `npm run migrate` thẳng → deploy. **Chưa deploy:** OV-12e #395, #397 (không migrate mới).

| Bước | PR | Chạy sau | Song song được với |
|---|---|---|---|
| ✅ | OV-1a #316 · OV-6a #315 · OV-3a #320 · OV-2a #322 · OV-1b #323 · OV-3b #325 · OV-2b #326 · OV-4a #332 · OV-4b #333 · OV-6b1 #331 | — | — |
| Đợt 3 | **OV-4a** huỷ / khôi phục lượt · **OV-4b** hộp nhập điểm · **OV-6b1** cấu hình chương trình | OV-1b / OV-1b / — | cả ba cùng lúc (ranh giới trong kế hoạch) |
| slot trống đầu tiên | **OV-3c** KQ lớp trước ở FT | OV-3b | mọi PR OV (không chung vùng chính) |
| sau OV-4a | **OV-1c** SOS MT tạm → chốt → xoá | OV-4a (chung `attempts.ts`, đóng / mở Case) | OV-6b2, OV-3c |
| sau OV-6b1 | **OV-6b2** chương trình mới + PET/KET | OV-6b1 | OV-1c, OV-3c |
| sau OV-4b | **OV-5** Công việc tại chỗ + Quay lại (planning viết khi OV-4b merge) | OV-4b (dùng hộp nhập điểm) | ghi trong kế hoạch OV-5 |

Tối đa **3 session cùng lúc**; PR nào merge xong thì mở PR kế tiếp trong chuỗi của nó (hoặc OV-3c). PR sau gộp main vào nhánh trước khi mở PR.

**Deploy MỘT lần sau khi xong toàn bộ OV** (chủ SP 11/10), theo `DEPLOY_2026-10.md` (sao lưu → tập dượt migrate trên bản sao DB → xem thử → migrate + deploy chính).
Trước deploy planning liệt kê migrate mới (từ #286 tới hết OV) + câu đếm chỉ đọc cho từng migrate. Sau deploy: mục 4 "Sau deploy".
Bản chính hiện chạy **#285**; các lệnh chỉ đọc (`kiem-du-lieu-mt`, `dem-bo-tro-trung`, `kiem-o-lop`) chạy từ máy chủ SP với biến Turso, không cần deploy.
**Trước deploy cuối OV** chủ SP chạy (chỉ đọc, bản chính): `kiem-truoc-ov1b`, `kiem-truoc-ov3b`, `kiem-truoc-ov1c` (khi OV-1c merge) — Windows: nạp `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`, `npm run build:server`, rồi `node dist-server/server/src/ops/<tên>.js`; planning nhắc khi tới lúc.
**Migrate mới từ bản chính (#285) tới hết OV** (chạy theo thứ tự trong `migrate.ts`, tập dượt trên bản sao — `DEPLOY_2026-10.md` mục C):
`prOv6b1`, `prOv6b2` (chỉ thêm cột + bản chụp lịch lớp + chèn PET/KET) · `prOv2` (vai mới, chỉ thêm) · `prOv3b` (bảng nháp lộ trình, chỉ thêm + chép Hướng GVCN) ·
`prOv1b` (**đổi dữ liệu**: dấu "-" cũ — xem `kiem-truoc-ov1b`) · `prOv4` (chỉ thêm cột `ket_qua_huy`) · `prOv1c` (**đổi dữ liệu**: Case SOS MT cũ — xem `kiem-truoc-ov1c`) ·
`prOv8a` (chỉ thêm 4 cột `buoc_tiep*` vào `learning_cycles`) · `prOv8b` (thêm quyền `student.edit_more` cho TVV / CX) · `prOv9` (chỉ thêm cột `sos_cases.kck`) ·
`prOv10b` (chỉ thêm 4 cột liên hệ vào `students`). **Đủ 11 migrate** (đối chiếu `git diff --name-status #285..main -- server/src/migrate/`).
**Thêm từ OV-11:** `prOv11e` (thêm cột KCK theo lượt + điền lượt đã chốt) → **12 migrate**; `prOv1b` sửa thêm ở OV-1e (#366) và OV-11e (ô giữ lịch thi lại bền khi chạy lại).
**Thêm OV-12a:** `prOv12a` (hạn kết quả PA đang chạy tính lại theo luật 2 tuần, không sớm hơn hạn cũ) → **13 migrate**.
OV-11d: câu SELECT "lộ trình FT đã đóng mà em còn ghi danh" (`SQL_DONG_CON_GHI_DANH`) **in trong `kiem-truoc-ov1b`** — chủ SP chạy một lệnh là đủ.
OV-3b đổi Lộ trình đề xuất GVCN → nháp: xem `kiem-truoc-ov3b`. Ba lệnh chỉ đọc chạy được NGAY.

## 6. Model, effort, skill cho từng PR (OV)
Chọn model ở ô chọn model **trước khi dán prompt**. **Không Fable**; không Haiku. Người rà: session planning (Opus 5.5).

| PR | Khuyến nghị | Phương án B | Ponytail | Impeccable | Ghi chú |
|---|---|---|---|---|---|
| OV-1a | Opus 5.5 · High | Sonnet 5.5 · High | lite (có sửa web nhỏ) | `audit` | Lỗi dữ liệu MT0, ghi điểm |
| OV-1b, OV-1c | Opus 5.5 · XHigh | Opus 5.5 · High | full | `clarify` (OV-1b dòng lớp) · `audit` | Luồng chính, Case tự tạo — rà sâu |
| OV-4a | Opus 5.5 · XHigh | Opus 5.5 · High | lite | `clarify` · `harden` · `adapt` · `audit` | Điểm, huỷ, migrate — rà sâu |
| OV-2a | Opus 5.5 · XHigh | Opus 5.5 · High | full | `clarify` · `adapt` · `audit` | Quyền — rà sâu + `/security-review` |
| OV-2b, OV-3a, OV-3c, OV-6a | Opus 5.5 · High | Sonnet 5.5 · High | lite | `layout` · `clarify` · `harden` · `adapt` · `audit` | Giao diện theo mockup |
| OV-3b, OV-4b, OV-5, OV-6b1, OV-6b2 | Opus 5.5 · XHigh | Opus 5.5 · High | lite | `layout` · `clarify` · `harden` · `adapt` · `audit` | Lớn, migrate / luồng chính — rà sâu |
| Session planning | Opus 5.5 · XHigh | Opus 5.5 · High | — | `critique` khi cần | brainstorming · writing-plans |

## 7. Chủ sản phẩm đã trả lời 04/10 — ✅ đã làm hết (HK2, DH, K26, U12). Chi tiết: `git show 0ac4c41b:plan.md`.

## 8. Hoãn có chủ ý · Đã chốt không làm
- **Hoãn (dọn mã, không gấp):** gỡ `migrateLegacyDisciplineCases` / `hasLegacyDisciplineModel` và `tenMoiChoLopCu` (PR-SO ghi: chỉ còn
  phép kiểm hoặc bước sao lưu DB cũ dùng).
- **Hoãn:** UX-D7 bảng quản trị → thẻ trên điện thoại · Thêm HV dạng thẻ điện thoại · xu hướng Phân tích, xu hướng Phân tích GV
  (chờ 2–3 tháng dữ liệu) · KPI tháng GV · D15 hiệu quả PA theo SOS lúc sinh · taxonomy vấn đề (Công việc › "Của GV" "Nhắc tất cả" ✅ #263) · kho ý tưởng Rulebook §20.
- **Đã chốt 04/10:** A12 giữ tên "Điều chỉnh cách dạy".
- **Không làm:** GV-C1 chấm đúng hạn lịch sử · góc Phân tích › Giáo viên cũ · mockup 26 bản 3–4 · Q12 em tạm dừng · ba ý tưởng
  §20.1 · B7 (giữ mã) · C02 (giữ chặn) · `/api/health` hỏi DB và các mục "không cần làm" của bản chính (Blobs, thứ tự Tutor,
  `demo_config` mốc nâng cấp, `sao-luu` không giao dịch).

## 9. Prompt

### 9.0. Phần chung — mọi prompt session code đều ngầm gồm
```
Đọc trước: CLAUDE.md, plan.md (mục 1 Luật làm việc, mục 3 Quyết định, mục 4 dòng của PR này); PR OV: thêm đặc tả docs/superpowers/specs/2026-10-11-overhaul-ux-workflow-design.md (mục của PR) + mockup.
Đầu phiên: nói rõ mình đang chạy model nào. Model ghi trên prompt (khuyến nghị) HOẶC phương án B đều được chạy tiếp — ghi model thật vào mô tả PR. Chỉ DỪNG báo chủ sản phẩm khi là model khác cả hai (vd Haiku) hoặc Fable (cấm, 06/10).
Nhánh mới từ origin/main mới nhất. Làm theo plan.md mục 1.2 + 1.3b: Task ngay trong session (executing-plans, KHÔNG subagent),
test-driven-development (đỏ trước), systematic-debugging khi lỗi lạ, brainstorming chỉ khi cần chủ SP quyết (dừng, hỏi).
npm run check MỘT lần cuối → bấm thử MỘT lần chỉ màn PR chạm (1440 tối + 375 sáng, vai PR chạm), ảnh đính PR; PR chỉ máy chủ
không cần ảnh → /impeccable audit (nếu có giao diện) → /ponytail-review → mở PR vào main, KHÔNG merge. Mô tả PR ≤ 30 dòng.
Xong: [x] kế hoạch, một dòng mục 11, CODE_MAP.md nếu thêm/xoá file. Cổng PORT/WEB_PORT riêng, không 4000/5173.
```

### 9.1. Đợt 1 — OV-1a (#316) + OV-6a (#315, đã merge 11/10)

### 9.2. Đợt 2 — ✅ xong 12/10: OV-2a #322, OV-3a #320, OV-1b #323, OV-3b #325, OV-2b #326 (kế hoạch đã xoá, git còn giữ: `git show dbeb130:docs/superpowers/plans/`).
- Trước deploy cuối OV: chủ SP chạy `kiem-truoc-ov1b`, `kiem-truoc-ov3b` (chỉ đọc) — mục 5.

### 9.3. Đợt 3 trở đi (12/10) — prompt nằm cuối từng file kế hoạch (dán nguyên khối)
| PR | Prompt | Model (B) | Cổng | Khi nào |
|---|---|---|---|---|
| OV-4a #332 · OV-4b #333 · OV-6b1 #331 | ✅ merge 12/10 | | | |
| OV-1c #335 · OV-3c #337 · OV-6b2 #336 | ✅ merge 12–13/10 | | | |
| OV-5a #343 · OV-5b #342 · OV-7a #344 · OV-7b #347 · OV-8a #348 | ✅ merge 13/10 | | | |
| OV-8b #352 · OV-10a #355 · OV-9 #356 · OV-1d #357 · OV-2c #360 · OV-10c #361 · OV-4c #362 · OV-10b #363 | ✅ merge 13/10 — **hết OV** | | | |
| **OV-1e** #366 | — | Opus 5.5 | — | ✅ merge 14/10 (giữ lịch thi lại không theo ngày → OV-11e) |
| OV-11a #372 · b #374 · c #371 · d #378 · e #375 · f #373 · g #379 · h #376 · i #377 | ✅ merge 14/10 (kế hoạch đã xoá: `git show 0e3adf32:docs/superpowers/plans/`) | Opus 5.5 | | |
| OV-12a #381 · OV-12b #383 · OV-12h #386 · OV-12g #388 · EN-a #385 | ✅ merge 14/10 (prompt trong chat planning) | Opus 5.5 | | |
| **OV-12c** · **EN-b** | prompt trong chat planning 14/10 | Opus 5.5 · XHigh | | đang chạy (cloud) |
| **OV-12d · e · f** · **EN-c · d** | planning viết prompt theo đặc tả mục 7 + mockup v3, mỗi PR một session cloud | Opus 5.5 · XHigh (High) | 4343…4346 / 5516…5519 | sau OV-12c |

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
| 15/10/2026 | OV-13b (Opus 5.5) · `claude/ov13b-ghi-ket-qua-pa-wa2t95` | Ghi kết quả gọn trên dòng (Công việc / Case / panel một em), Case gọn, Xác nhận PA luôn mở form (Bắt đầu), Đề xuất PA khác qua thẻ "Đề xuất PA" (gửi / rút / duyệt / từ chối, Hoàn tác), "✓ Đã lưu · Việc tiếp ›", một hàm đếm quá hạn, panel tại chỗ + số liệu lên URL. |
| 15/10/2026 | OV-13h (Opus 5.5) · `claude/ov-13h-go-chan-cung-r2bjsj` | Gỡ chặn cứng (chủ SP 15/10): GV nhập ô trống sau hoàn tất / lớp kết thúc; gỡ "-" mọi lúc; ai hoàn thành được Case mở lại được; bàn giao sửa sau ngày chuyển; báo cáo tuần quá hạn = "nộp muộn" (bỏ QT mở lại); góp ý lớp kết thúc; thi thật em Lưu trữ, đề xuất sửa em Tạm dừng. Rulebook §20.1b. Kiểm HTTP `prOv13h` |
| 15/10/2026 | OV-13a (Opus 5.5) · `claude/ov13a-case-pa-rules-rp7zpx` | Case tạm khi lượt chưa chốt (Q2, cột `sos_cases.tam`, không vào số đếm nào); PA quy chế hết kẹt A (đạt → Kết quả cuối) · B (mốc MT cuối ≥ xác nhận + 4 tuần) · C (GVCN/QL Kết thúc PA, lý do ≥ 10); Case MT bỏ ô Mô tả; migrate `prOv13a` + `kiem-truoc-ov13a`, prOv1c không chạy nữa (chỉ khoá) |
| 15/10/2026 | OV-13j (Opus 5.5) · `claude/student-edit-history-pw3rj2` | Lịch sử sửa thông tin HV: hồ sơ ⋮ › Lịch sử sửa (panel, lọc 4 nhóm, Xem thêm); `GET /students/:id/lich-su-sua`; thêm audit theo trường cho nhập HV, chuyển lớp / tạm dừng cả lớp, nguồn "Sửa cả lớp"; `student.update` chỉ ghi trường đổi. |
| 15/10/2026 | OV-13c (Opus 5.5) · `claude/ov13c-gom-cong-viec-tuan-lusfml` | Công việc: Case SOS FT (Xác nhận PA, Ghi nhận xét) gộp lớp + tuần thi + mức SOS; Xác nhận PA cùng lúc (lô, mỗi PA một giao dịch, người dạy chung không đè, ngày bắt đầu); Nhập điểm gộp theo tuần thi (lưới Lịch Test nhiều lớp); 3 lỗi nhỏ mục 4 (em cuối rơi xuống cuối, "1 em · 2 việc", tiêu đề panel). |
| 15/10/2026 | OV-13e · `claude/ov13e-account-role-selection-l1z2cp` | Đăng ký chọn vai GV · QL · TVV · CX · Admin (cột `users.requested_role`, migrate chỉ thêm; system_admin / vai lạ → 400; chưa duyệt không có vai); hộp duyệt điền sẵn vai đề nghị. |
| 15/10/2026 | HOTFIX-2 (Opus 5.5) · `claude/hotfix-2-sua-nhan-xet-6eybs4` | Lệnh chỉ nhận xét / nhóm nguyên nhân MT: GV đúng kỹ năng (cả GV S chấm chéo), GVCN, QL sửa mọi lúc (sau hoàn tất, lớp đã kết thúc); Case chờ ghi nhận xét → Chờ xác nhận PA; Rulebook 15/10 |
| 15/10/2026 | HOTFIX (Opus 5.5) · `claude/hotfix-deploy-15-10-tnph4w` | L1 GV ghi nhận xét bài đợt hoàn tất (route gửi khoá `undefined`); L2 Case MT hiện nhóm + nhận xét, Sửa Case MT không đòi Mô tả; L3 Case huỷ mờ + xếp cuối; L4 ErrorBoundary (chưa tái hiện); L5 hỏi trước khi đóng panel đang sửa; L9 chữ; Công việc dòng xong ẩn hạn |
| 15/10/2026 | TD4 (Opus 5.5) · `claude/td4-my-work` | Công việc nhanh hơn, cùng kết quả (JSON trùng ảnh chụp mọi vai): `listAttempts` chỉ lượt còn ô chấm + chưa xếp tuần, "Tất cả" đọc một lần; bỏ N+1 cách chấm theo lớp; nạp phạm vi một câu/lô 900; ×3 dòng −60…73 %, câu 66–78 → 63–71; không migrate (`tocDo` TD4-a/b) |
| 14/10/2026 | OV-12e (Opus 5.5) · `claude/ov12e-panel-v3-web-qr1i07` | Hệ panel v3 toàn web: đầu 2 dòng + chip hạn 3 mức (`deadlineView.ganHan`, ≤ 3 ngày vàng), MỘT khối Cần làm, Bối cảnh ≤ 3 dòng, chân trạng thái lưu — Ghi kết quả PA (Tiến triển (2 tuần), Nhận xét / Nhận xét buổi, bỏ Ghi chú, Quyết định 3 nút, Thay PA / Xin hỗ trợ QL trong Điều chỉnh), Thêm PA, Xác nhận xử lý (⋯ cạnh tên em), meeting CX; panel số liệu mở rộng dòng (Xác nhận PA trong dòng, việc dài thay nội dung, dòng Case xong hết hạn) (`prOv12e.tests`) |
| 14/10/2026 | OV-12d (Opus 5.5) · `claude/ov12d-tong-hop-ho-so-q1eykk` | Tổng hợp nhóm Xử lý 3 cột HV - Case · Chờ duyệt · Đang xử lý (`cotXuLy` + `xuLyCuaDong`; xong / huỷ chỉ trong tổng, ⚠ quá hạn ở Chờ duyệt, một ⓘ nhóm) — ô Tổng quan "Case chờ duyệt" / quá hạn + chuông cùng hàm; hồ sơ MT khối "Case & phương án" (Case của lượt + Case lặp, `DongCase`, Ngăn Case tại chỗ; chấm chéo / Admin không có); Rulebook 17.5 + 20.10 sửa 14/10; sửa theo rà #393: panel một em (OV-12f) bỏ `nhomXuLyCase`, dùng cùng `xuLyCaseMany` — chủ SP chọn A: Bổ trợ chưa chạy / PA xong chưa Hoàn thành = Chờ duyệt (`prOv12d.tests`) |
| 14/10/2026 | EN-d (Opus 5.5) · `claude/pr-en-d-case-y-thuc-7oxyl2` | Tiếng Anh Case – PA (ngăn Case, Tạo Case, Thêm/Sửa/Xoá PA, Xác nhận Case / PA, Ghi nhận xét, Hoàn thành), Ghi vi phạm, Ý thức GV; 226 câu lỗi máy chủ (`en/d.ts`, `prEn.tests` E-NGUON/E-LOI đợt d) — chạy song song EN-b; gộp thử EN-b: do-khung (v) 0 |
| 14/10/2026 | EN-b (Opus 5.5) · `claude/pr-en-b-teacher-scoring-tmaqkl` | Tiếng Anh nhóm B + C: Tổng quan GV, Công việc (+ panel, Yêu cầu của tôi), chuông, Lịch Test, Điểm theo lớp, nhập điểm FT + lớp thường, hộp chấm MT (Nhận xét + Nhóm nguyên nhân), hồ sơ Mock, Ghi kết quả PA; chữ máy chủ (dòng việc, thông báo, lỗi) dịch ở web theo MẪU của từ điển (`dichChu`) — không cột khoá, không migrate (`prEn.tests` EN-MAU / EN-VIEC / EN-TB; do-khung kịch bản `gv-*`) |
| 14/10/2026 | EN-c (Opus 5.5) · `pr-en-c-ho-so` | Tiếng Anh nhóm D: Học viên & Lớp, hồ sơ lớp (cả Góp ý hàng tuần), hồ sơ HV (đầu hồ sơ, Học thuật, Hành trình, Tổng kết, Các lộ trình) + `en/c.ts`; máy chủ gửi `khoa`+`bien` (`kem`, lồng được) cho việc của em / câu tóm tắt / bốn ô / gợi ý Final; `dich()` dịch theo mẫu chữ máy chủ ghép sẵn; panel QL giữ Việt (`prEn.tests` E-HOSO, E-NGUON nhóm D) |
| 14/10/2026 | OV-12f (Opus 5.5) · `claude/ov12f-hoc-vien-lop-ba-goc-fbhqqe` | Học viên & Lớp ba góc nhìn Tất cả · Đang SOS · Cần làm (CX: Cần chú ý; Admin hai góc), lọc phụ Quá hạn · Chờ duyệt · Thiếu thông tin trong Cần làm; Đang SOS theo tuần thi (`/hoc-vien-lop?goc=sos&tuan=`, cùng `phanLoaiCacLuot` với Tổng hợp, có lớp thường); Cần làm = việc Công việc; Panel một em (`/hoc-vien-lop/em/:id`, Ngăn Case thay nội dung, về panel em); Ghi kết quả: Tiến triển (2 tuần) · Nhận xét / Nhận xét buổi · 3 nút Quyết định (`prOv12f.tests`) |
| 14/10/2026 | OV-12c (Opus 5.5) · `claude/ov12c-case-sos-workflow-e5qdeo` | Case SOS MT lấy nguyên nhân từ nhận xét + nhóm của ô (liên kết sống), thẳng Chờ xác nhận PA (bấm thẳng, Sửa PA / Không cần theo dõi tại chỗ), bỏ việc / chuông / thẻ / số "chờ nguyên nhân" + panel gom; em đạt lại → xoá hẳn Case chưa có PA xác nhận; Progress: nhãn SOS theo số môn trượt, MỘT bước Xác nhận Case (nhóm + mô tả + PA Bổ trợ) hạn 5 ngày; Case MT cũ ô trống → việc Ghi nhận xét; migrate `prOv12c` (`prOv12c.tests`) |
| 15/10/2026 | Planning (Opus 5.5) · `claude/plan-1510-deploy` | Rà + merge OV-12c #389, OV-12f #391, EN-b #392, OV-12d #393, EN-c #394, OV-12e #395, EN-d #396, #397 (check trên bản gộp main mỗi PR; tự gộp xung đột thêm dòng / import); deploy lần 1 + 2 (đường sao lưu → migrate cục bộ → khôi phục database mới; lần 2 migrate thẳng) |
| 14/10/2026 | Planning (Opus 5.5) · `claude/ov12-tai-lieu-1410` | Chủ SP chốt 3 câu mockup v3 (Tiến triển (2 tuần) + Nhận xét, bỏ Ghi chú · Thay PA / Xin hỗ trợ gộp vào Điều chỉnh · chip hạn ≤ 3 ngày vàng); plan mục 4/5/9.3 theo trạng thái 14/10 tối + việc nhỏ còn lại từ rà OV-12 |
| 14/10/2026 | OV-12g (Opus 5.5) · `claude/ov12g-weekly-feedback-l7srnh` | Góp ý hàng tuần: hồ sơ lớp › Học viên › cách xem "Góp ý hàng tuần" (`?che-do=gop-y&tuan=`), hàng = em, cột = kỹ năng lớp, ‹ › tuần, lưu khi rời ô, ▸ 4 tuần; quyền máy chủ GV dạy kỹ năng / GVCN / QL·QT ghi, TVV·CX·Admin đọc; bảng `gop_y_tuan` (migrate `prOv12g`), xoá HV xoá dòng. |
| 14/10/2026 | EN-a (Opus 5.5) · `claude/en-a-i18n-foundation-5z7qvt` | Nền tiếng Anh: `shared/i18n` (`t('chữ Việt')`, khoá = chữ Việt, tsc ép bản Anh), nút VI \| EN (đăng nhập · thanh trên · menu Tài khoản), nhớ theo tài khoản (`users.ngon_ngu`, migrate `prEn`) + máy, câu lỗi có khoá (`loi()`); dịch nhóm A: khung, đăng nhập, Hồ sơ cá nhân, `ui/*`, `lib/*`, shared điều hướng / vai / trạng thái / ô ngày (`prEn.tests`; do-khung `KHUNG_NGON_NGU=en`) |
| 14/10/2026 | OV-12b (Opus 5.5) · `claude/luong-l-sos-ov12-eqx1fb` | Nhận xét MT bắt buộc (luật chủ SP 14/10): ô MT (không MT0 / MT cũ) có điểm phải có nhận xét ≥ 10 ký tự, band ô (W1/W2 từng task) dưới kỳ vọng → chip Nhóm nguyên nhân (thứ tự, 1 = chính); thiếu → 400 ở `PUT /attempts/:id/scores/:skill`, hộp chấm tắt Lưu + lý do, hồ sơ MT không lưu dưới 10 ký tự; ô cũ thiếu ghi "thiếu nhận xét"; Excel cột Nhận xét L/R/W1/W2/S + Nhóm; migrate `prOv12b` (cột `nhom_nguyen_nhan`) (`prOv12b.tests`) |
| 14/10/2026 | OV-12h (Opus 5.5) · `claude/ov-12h-code-review-3jh46w` | Luật nhỏ trước GV nước ngoài: bỏ hẳn Nhắc của QL / QT / Admin (4 route 404, nút + "Nhắc tất cả" + "đã nhắc" ở Công việc, Chờ duyệt — tab đổi tên "Báo QL", Bàn giao, Tổng quan); kết quả PA chỉ chép giữa các môn của CÙNG em (chủ SP chọn giữ một việc mỗi em); PA Tutor ghi n buổi = n dòng [tên tutor · nhận xét] bắt buộc (bảng `case_followup_buoi`, migrate `prOv12h`); meeting CX hạn 5 ngày + ⚠ ở Công việc / hồ sơ / Tổng quan QL, ghi chú ≥ 10 ký tự, xác nhận tại chỗ (`prOv12h.tests`) |
| 14/10/2026 | OV-12a (Opus 5.5) · `claude/ov12a-luat` | Luật trước deploy: hạn ghi Kết quả PA hai tuần một lần, hết Thứ Ba, theo lịch kỳ từ ngày bắt đầu PA (`hanKyGhiKetQua`, `hanKe`; chữ "Kết quả W3–W4 SEP" / "kỳ …" / "ghi bù n kỳ"; migrate `prOv12a` không sớm hơn hạn cũ, seed theo lịch mới); QL xoá lớp trống + xoá HV (hồ sơ + Chọn nhiều › Xoá ở hồ sơ lớp, gõ XOÁ, mỗi request một em); TVV chi nhánh chọn / đổi / bỏ Bước tiếp sau thi (quyền tạm trong lần gọi, lớp đích cùng chi nhánh), việc ở thanh việc hồ sơ HV (`prOv12a.tests`) |
| 14/10/2026 | Planning (Opus 5.5) · `claude/ov12-ke-hoach` | Rà + tự merge 9 PR OV-11 (rà sâu a–e + b/d bảo mật; `npm run check` trên bản gộp main mỗi PR); prompt OV-12a (hạn 2 tuần + quyền); rà mã 3.1–3.5 → đặc tả OV-12 + 4 mockup (chờ duyệt); xoá 9 kế hoạch OV-11 + phụ lục rà soát |
| 14/10/2026 | OV-11g (Opus 5.5) · `claude/ov11g-hoc-vien-lop-eu7r50` | Học viên & Lớp · hồ sơ lớp: "Thiếu thông tin" tính ngày sinh + email (Q3, không bắt buộc khi nhập), em Kết thúc học chưa Lưu trữ mờ ở lớp cuối (⋯ Lưu trữ · Học lại), lớp đã kết thúc chỉ QL sửa điểm (máy chủ chặn GV), "Final Test a/b" một mẫu số, chip đếm theo lớp đang lọc, Admin bỏ badge việc, mọi "Nhập điểm" → Điểm theo lớp, dải Lộ trình `<Han>` + "Chốt lộ trình", hộp Lộ trình điền sẵn tuần, "chưa chốt lộ trình" một tên, Kết thúc lớp có nút đi tiếp, seed lớp 1, 2 `finished` (`prOv11g.tests`) |
| 14/10/2026 | OV-11d (Opus 5.5) · `claude/ov11d-ho-so-hv-case-wtzryy` | Hồ sơ HV · Case: GVCN giữ quyền với em Tạm dừng (ghi danh `paused`), Tạm dừng có Hoàn tác + nút Quay lại học ở dải; Bước tiếp Học lại / Học tiếp với em còn ghi danh = Kết thúc học + Học lại một giao dịch (`kiem-truoc-ov1b` đếm em lộ trình đã đóng còn ghi danh); hồ sơ Lưu trữ khoá (400), Lưu trữ một bấm + Hoàn tác; Tổng kết đổi nội dung cùng khung; Đề xuất sửa chỉ GV lớp đang học, Target chờ duyệt ở Sửa thông tin; KCK chỉ QL / QT / TVV; KQĐR chỉ em Lên FT; ngày sinh / email không bắt buộc; hạn bàn giao, Sắp tới, Học thuật, Hành trình một nguồn (`prOv11d.tests`) |
| 14/10/2026 | OV-11i (Opus 5.5) · `claude/ov11i-giao-dien-chung` | Giao diện chung: placeholder theo token (sáng 2.5 → 5.8:1), tiêu đề tab theo màn ("Tên em / mã lớp / tên trang · PISA Tracking", `tieuDeTab`), `.btn` / `.field` 44 px ở < 640, ô chọn Chờ duyệt vùng 44, `Card` không h2 rỗng, chữ phụ hàng đang chọn lên dim, "—" ô điểm FT faint, chip "cũ" dim, ⋯ lưới lớp thường chỉ ẩn khi rê được, giảm chuyển động tắt shimmer / pulse, lỗi 403 không "Thử lại" mà có nút về, TVV / CX mở thẳng `/nhap-diem` → Tổng quan (`prOv11i.tests`) |
| 14/10/2026 | OV-11e (Opus 5.5) · `claude/ov11e-lich-test` | Lịch Test của người có phân công đếm phần của mình (dải số, badge khối, khối 1 ô "{kn} của bạn · GV khác", "n bài của GV khác" nhạt; W1 / W2 tách người); "MT cũ chưa nhập" mỗi lượt một link → Điểm theo lớp `?luot=mt:n&trong=1`; Điểm theo lớp "trống" chỉ ô đã tới tuần, hàng chưa tới tuần ghi mã tuần, hoà tuần → lượt nhiều ô trống, "‹ Hồ sơ lớp {mã}"; Khôi phục lượt trả yêu cầu duyệt về "cho"; KCK chụp theo lượt lúc chốt (migrate `prOv11e`); OV-1e giữ lịch thi lại không theo ngày; TE-12 phần còn, bỏ cắt chữ, `aria-label` Tìm lớp (`prOv11e.tests`) |
| 14/10/2026 | OV-11h (Opus 5.5) · `claude/ov11h-phan-tich` | Phân tích · PET / KET: Checkpoint vào Phân tích lớp (cột Checkpoint n), hồ sơ GV, Phân tích GV (cột L+S · R+W khi có), Xuất từng lượt, Tổng hợp nhóm "Checkpoint"; hồ sơ HV PET bảng 2 môn; Vấn đề HV bỏ Case huỷ lượt + "Case chưa phân nhóm nguyên nhân"; đơn vị "lượt MT" / "bài" / "Case"; ô Lớp có "Đã kết thúc"; `?theo=lop` mở hàng đầu; câu hồ sơ GV theo vai (`prOv11h.tests`) |
| 14/10/2026 | OV-11b (Opus 5.5) · `claude/ov11b-quan-tri` | Quản trị · tài khoản: không tự gỡ / gỡ QT cuối, "Không duyệt" có Duyệt lại, vai thiếu CN → 400, sửa không đổi vai không "đặt lại vai", nhật ký 4 nhãn + môn PET "R+W", quyền cấp riêng có tên, chương trình 0 lớp sửa như lúc tạo, tab Quản trị lên URL, việc nhỏ QT-10 |
| 14/10/2026 | OV-11f (Opus 5.5) · `claude/ov11f-tong-quan` | Tổng quan · chuông: Cần xử lý chỉ QL / QT (TVV / CX / Admin 403), "PA chưa có Kết quả" mở Công việc `loai=` đúng loại, "lớp cần Chốt lộ trình" mở Lộ trình tiếp theo, "xong MT" = đủ điểm, SOS FT theo lộ trình FT đang chạy, Dưới kỳ vọng bỏ KCK, chuông Cần làm chỉ việc còn mở + lọc theo Góc nhìn, panel cùng tên ô, ⓘ Cách tính (`prOv11f.tests`) |
| 14/10/2026 | OV-11a (Opus 5.5) · `claude/ov11a-vang-thi-bu` | Vắng · thi bù: bài thi bù không khoá "hoàn tất", ô tuần thi bù là ô thường (Vắng = lần 2), ⋯ "Vắng" sau tuần thi = Không dự thi, lớp thường "-" theo Q1, chip Công việc không tự nhảy, 375 = 1440; ô đã chốt ghi chữ, nút + thông báo nói đúng hậu quả, xác nhận bỏ chữ ngay chân hộp (`prOv11a.tests`) |
| 14/10/2026 | OV-11c (Opus 5.5) · `claude/ov11c-cong-viec` | Một cách đếm: xô Nhập điểm tách theo hạn (lọc Quá hạn = 58 = Tổng quan), "m học viên" đếm em riêng (`emIds`), "Của GV" = "Của một GV" (Bàn giao, Kết quả PA, việc GVCN), "Của tôi" chỉ việc mình giữ, bổ trợ miễn phí một dòng; việc xong mờ + gạch giữ chỗ (Thêm PA, Ý thức, thứ tự khi mở panel); Chờ duyệt: bỏ thẻ "Lớp hết khoá" lớp thường, Nhắc nhận dòng gộp + hỏi lại, Tạm dừng không đóng đề xuất (`prOv11c.tests`) |
| 14/10/2026 | Planning (Opus 5.5) · `claude/ra-soat-cuoi-truoc-en` | Rà OV-1e #366 sâu (check xanh; rủi ro deploy 2 → OV-11e); rà soát cuối toàn web: 7 khu × 9 vai (Playwright, DB riêng) + impeccable audit 14/20 + critique 26–27/40; 7 lỗi chặn; đặc tả + phụ lục + 9 kế hoạch OV-11a…i (3 đợt); quyết định Q1–Q15 |
| 13/10/2026 | OV-1e (Opus 5.5) · `claude/ecstatic-tesla-km0vxm` | Migrate `prOv1b`: "-" nhập bù đã chốt mà bài đang chờ thi lại ở tuần ≥ tuần hiện tại (chưa huỷ / chưa chờ QL) → không đổi gì, báo cáo in "giữ lịch thi lại W3 OCT"; một hàm `giuLichThiLai` cho migrate + `kiem-truoc-ov1b` (`prOv1b.tests` OV1e) |
| 13/10/2026 | OV-4c (Sonnet 5.5) · `claude/sleepy-dijkstra-vys22n` | W1 / W2 / S: ô Band chỉ đọc, hiện ngay khi gõ 4 tiêu chí (thiếu → "—"; band cũ nhập thẳng vẫn hiện, gõ tiêu chí thì thay); nhập Band thẳng chỉ MT cũ + MT0; `saveScore` 400 band thẳng ở lượt thường (`band: null` xoá vẫn nhận; L/R không đổi) (`prOv4c.tests`; T10 cũ ở prMta / prMtb đổi đúng ý) |
| 13/10/2026 | OV-10b (Opus 5.5) · `claude/awesome-fermi-w8cfmt` | Liên hệ SĐT em + phụ huynh (migrate `prOv10b`, kiểm máy chủ, nhật ký; mọi vai đọc, GV không thấy ô nhập; không tính Thiếu thông tin); Học viên & Lớp TVV / CX mỗi em một dòng nhóm theo lớp (`/hoc-vien-lop/theo-vai`, chip = `chipHocVien`, CX mặc định Cần chú ý), Admin Lượt MT · Ô chưa nhập; hồ sơ HV Đang xử lý + nút vai; hồ sơ lớp Phụ huynh · Thông tin lớp (đọc) (`prOv10b.tests`) |
| 13/10/2026 | OV-1d (Opus 5.5) · `claude/pr-ov1d-luoi-cham-joijqa` | Lưới chấm FT: ô đã dời vì vắng ở lưới tuần gốc là nút "Vắng → W3 OCT" mở hộp Bỏ vắng (không quyền: "Đã dời sang …"); em đã Kết thúc học / Lưu trữ hàng mờ, Kết quả "Đã kết thúc học" / "Lưu trữ", ô không là việc; chỉ Lưu trữ chỉ đọc + `saveScore` 400 (Kết thúc học nhập bù được — PR-TK; Tạm dừng như đang học; chủ SP 13/10) (`prOv1d.tests`) |
| 13/10/2026 | OV-2c (Sonnet 5.5) · `claude/funny-cori-n7ebb3` | Email học viên không bắt buộc ở Thêm HV (lưới + dán Excel), Sửa thông tin, Sửa cả lớp; gõ thì vẫn kiểm dạng, xoá trống = NULL; ngày sinh giữ bắt buộc; "Thiếu thông tin" chỉ đếm ngày sinh (`prOv2c.tests`; phép kiểm OV2b-3/4/5 + NHAP đổi đúng ý) |
| 13/10/2026 | OV-10c (Opus 5.5) · `claude/elegant-lovelace-0sh1fe` | Tổng quan theo vai: Admin "Mock Test" (4 ô mở Test / Công việc, số cùng hàm màn đó; GV chấm quá hạn + Nhắc), TVV "Học viên của tôi" / CX "Số liệu" ô đếm bấm được (`chipHocVien` — OV-10b dùng cho chip), CX bỏ "Theo giáo viên"; bộ đo tốc độ có vai ADMIN / TVV / CX (`prOv10c.tests`) |
| 13/10/2026 | OV-10a (Sonnet 5.5) · `claude/stoic-cori-kmj3bl` | Nút / link đúng quyền TVV · CX · Admin: ẩn "+ Case cho {kỹ năng}", Nhập điểm lượt MT, Chọn nhiều HV, Huỷ kỹ năng / Đưa lại / Dời hạn chấm, ô tích kỹ năng, link Test / Công việc, góc Ý thức, "Đề xuất sửa" khi không có quyền; tên GV là link cho Admin; tab Admin "Chấm điểm"; không nới quyền máy chủ (`prOv10a.tests`) |
| 13/10/2026 | OV-9 (Opus 5.5) · `claude/gallant-mayer-dkd8it` | KCK nhẹ: KCK là dấu riêng, Target giữ (ô tích KCK; lưới / dán Excel "6.5 KCK"); em KCK có kỳ vọng, dưới kỳ vọng → chip "Dưới kỳ vọng · KCK" + Case nhẹ `sos_cases.kck` (không PA quy chế / Bổ trợ, không hạn, không Phối hợp / Báo PH / chuông; Overall đạt tự đóng; bỏ KCK → lượt sau SOS thường); lệnh chuyển / LTT / bản chụp mang Target + KCK; migrate `prOv9` (chỉ thêm cột) |
| 13/10/2026 | OV-8b (Opus 5.5) · `claude/happy-fermat-7tqtgh` | Quyền TVV / CX: quyền hẹp `student.edit_more` (migrate `prOv8b`, một lần) — Target sửa thẳng có lý do, Ghi chú, Tạm dừng / Quay lại / Thôi học + Hoàn tác, kết quả thi thật; ô TVV chỉ cùng chi nhánh (máy chủ 400); học thuật gọi thẳng → 403 (`prOv8b.tests`) |
| 13/10/2026 | OV-8a (Opus 5.5) · `claude/pr-ov8a-buoc-tiep-sau-thi-rdlok4` | Bước tiếp sau thi: có kết quả thi thật không tự Lưu trữ nữa → việc QL "Chọn bước tiếp sau thi" (+7 ngày); mục Bước tiếp ở ngăn Tổng kết: Kết thúc (Lưu trữ) · Học tiếp lộ trình mới · Học lại (panel Học lại), gợi ý theo Target, đổi = hoàn tác cái cũ, mốc Hành trình; migrate `prOv8a` |
| 13/10/2026 | OV-7b (Opus 5.5) · `claude/affectionate-edison-avs75c` | Sửa sau khi lưu 2/2: sửa lần ghi Kết quả PA gần nhất (người ghi + QL; giữ lựa chọn = sửa chữ, đổi = đảo hệ quả cũ + ghi lại, một giao dịch; nhóm bổ trợ, Mini Test, PA thay, thẻ Xin hỗ trợ); Sửa Xem lại tại chỗ; GV đã hoàn thành Case Mở lại được; "Sửa xác nhận" |
| 13/10/2026 | OV-5a (Opus 5.5) · `claude/clever-hypatia-2tslwm` | Công việc tại chỗ: danh sách trái · panel phải (`viec=` trên URL, điện thoại màn đầy đủ "‹ Công việc"), lọc hai tầng + dòng phạm vi + Xoá lọc; panel dùng lại Ngăn Case / Bàn giao / Ý thức / Vận hành / Nhập điểm (`MotKyNang`); Xác nhận nguyên nhân gom lớp + kỹ năng + lượt, xác nhận nhóm + PA quy chế MỘT giao dịch (≤ 6 em/lô, ~30 câu/em); dòng xong mờ + gạch; "Kết quả đầu ra · lớp" |
| 13/10/2026 | OV-7a (Opus 5.5) · `claude/optimistic-euler-oideqr` | Sửa sau khi lưu 1/2: bàn giao đã xác nhận sửa tới ngày chuyển lớp (sau đó chỉ QL); Ý thức sửa ngày/người/mô tả, Chưa thực hiện, Bỏ ghi nhận, GVCN sửa khai bậc; Phối hợp lưu lại / Đưa lại Cần xử lý / Khôi phục; Mini Test người ghi sửa (đảo Case + Báo QL); người gửi Sửa / Rút thẻ còn chờ; QL sửa trả lời Xin ý kiến |
| 13/10/2026 | OV-5b (Opus 5.5) · `claude/modest-franklin-dj5v0d` | Quay lại toàn hệ thống: "‹ {tên nguồn}" + menu Các bước ở hồ sơ HV / lớp / MT / GV / Nhập điểm / Case riêng, về đúng URL + cuộn; chồng ≤ 5 theo tab, mở link thẳng / tải lại → trang cha; Tổng quan (tab tuần, Theo lớp), Phân tích (hàng mở), Điểm theo lớp (lượt) lên URL |
| 12/10/2026 | OV-6b2 (Opus 5.5) · `claude/wonderful-edison-mmer3n` | "+ Chương trình" (mã mới, môn L·R·W·S·L+S·R+W, số tuần hoặc liên tục + Checkpoint mỗi n tuần); PET, KET có sẵn (migrate `prOv6b2`); lớp `{CN} {MÃ} {số}`; Checkpoint sinh từng lượt; chưa đạt chỉ chip SOS; một cổng `laLienTuc` (không LTT / KQĐR / Cuối khoá / MT0 / Target) |
| 12/10/2026 | OV-1c (Opus 5.5) · `claude/dazzling-albattani-24iilg` | SOS MT tạm thời → chốt → xoá: cờ `chot` (`kyNangXongThieu`: dời / huỷ / Không dự thi), chưa chốt không Case; Overall ≥ kỳ vọng = không SOS; xoá SOS đóng "Overall đạt" / giữ + mốc; mọi màn đọc `chot`; migrate `prOv1c` + `kiem-truoc-ov1c`; seed demo chốt; ô điểm lưới theo mockup (vắng tím 2 dòng · trống viền đứt · huỷ viền chấm) + chip "SOS tạm · a/4" |
| 12/10/2026 | OV-3c (Opus 5.5) · `claude/festive-wright-jzy4xv` | Hồ sơ lớp FT › Học viên › "Kết quả đầu ra" (`?che-do=ket-qua`, số đợt ở nút): mỗi chương trình nguồn một bảng, nhóm theo đợt, hiện 4 tuần, chỉ QL đã chốt, Admin 403; Hành trình có dòng Kết quả đầu ra; không seed mới (demo MB FT 101 — xem mục 4) |
| 12/10/2026 | OV-6b1 (Opus 5.5) · `claude/pensive-knuth-qt9uk0` | Quản trị › Chương trình: bảng + panel sửa (Tên, Đạt từ, số tuần, mốc / tuần MT LT1 LT2 RF), áp lớp mở sau; bản chụp `classes.lich_mt` + `nguong_dat`; tuần MT FT + ngưỡng đạt đọc bản chụp lớp; migrate `prOv6b1` điền mọi lớp cũ |
| 12/10 | OV-4b `claude/peaceful-galileo-kc1jh5` · Opus 5.5 | Hộp nhập điểm MT chung (`HopNhapDiem`: L/R/W1/W2/S/MT0, Lưu · em tiếp, ô Vắng + Bỏ vắng, lỗi giữ chữ) thay CriteriaModal / InlineScoreEditor / ô gõ L/R; nhận xét 4 kỹ năng + lớp thường (nút Nhận xét). |
| 12/10/2026 | OV-4a (Opus 5.5) · `claude/peaceful-clarke-xsn9zr` | Huỷ cả lượt MT cất điểm + lịch + danh sách đóng vào `ket_qua_huy` (`huy_luot`, migrate `prOv4`), đóng Case sinh riêng / PA "Chưa đủ dữ liệu" / Phối hợp; Khôi phục lượt (`/reopen`) về nguyên trạng, chặn khi đã xếp MT mới, kèm bản dời vượt treo (ca MT4 Ngọc); ô "MT2 · Đã huỷ" ở Kế hoạch Test / Lộ trình; Admin không nút |
| 12/10/2026 | Planning (Opus 5.5) · `claude/wonderful-shannon-f4exvc` | Kế hoạch + prompt OV-4a, OV-4b, OV-6b1, OV-3c, OV-1c, OV-6b2 (OV-4, OV-6b tách đôi); đợt 3 = OV-4a + OV-4b + OV-6b1; xoá 5 kế hoạch đã merge; 2 câu hỏi chủ SP (hạn SOS chốt, Dự kiến quay lại) |
| 12/10/2026 | OV-2b (Opus 5.5) · `claude/upbeat-albattani-jaqvpm` | Hồ sơ HV: ⋯ Sửa thông tin · Chuyển lớp · Tạm dừng / Thôi học (một panel 2 tab) · Lưu trữ; Sửa thông tin có TVV chọn người ("Ghi cũ"), email + ngày sinh bắt buộc (thêm / sửa, cả lớp chỉ dòng có sửa), Target QL thẳng / GVCN đề xuất, điểm đầu vào L R W S; ⋯ dòng Sửa thông tin; Sửa cả lớp cột TVV |
| 12/10/2026 | OV-3b (Opus 5.5) · `claude/zen-cray-fa7291` | Lộ trình tiếp theo: nháp chỉ QL (`lo_trinh_nhap`) → chốt = ra lệnh; GVCN thôi ghi Hướng; hạn nhắc / chốt Final − 2, bàn giao hết tuần Final ≥ 2 ngày, FT 5 ngày; đổi hướng/lớp đích → phiếu cần làm lại + chuông; KQĐR có FOU + GVCN đề xuất; cách xem bảng theo hướng thay PanelCuoiKhoa / PanelKyVong / LoTrinhTiepPanel |
| 12/10/2026 | OV-1b (Opus 5.5) · `claude/tender-ramanujan-ffmcx1` | "-" trong tuần = Vắng chốt ngay (lần 1 dời, lần 2 huỷ), nhập bù / MT cũ = Không dự thi; Bỏ vắng; dòng lớp "phần của bạn" + một hàm đếm (`dauTruCuaO`); lượt huỷ hết phần thi; migrate `prOv1b` + `kiem-truoc-ov1b` (chỉ đọc) |
| 11/10/2026 | OV-2a (Opus 5.5) · `claude/pr-ov2a-vai-quyen-oqmdnt` | Vai Admin / TVV / CX + 5 quyền (`student.edit_info`, `test.view`, `work.view`, `analysis.view`, `analysis.view_teacher`), migrate `prOv2`; Test/Công việc chặn theo đường; Admin chỉ Chấm điểm + Nhắc; góc nhìn lưu ở phiên + dải; Tổng quan TVV, "HV của tôi" |
| 11/10/2026 | OV-3a (Opus 5.5) · `claude/pr-ov3a-ho-so-lop-vvqizj` | Hồ sơ lớp: nút cố định Nhập điểm · + Case · ⋯ nhóm (`menuHoSoLop`); panel Thông tin lớp 3 phần lưu riêng; bảng điểm cuối trang mở sẵn; Tổng hợp lớp thường bỏ Dự kiến thi, cột Lộ trình tiếp theo = lệnh Cuối khoá đã chốt; FT dòng Đầu vào |
| 11/10/2026 | OV-1a (Opus 5.5) · `pr-ov1a-mt0-nhap-diem` | MT0 lớp thường: máy chủ chặn ghi đúng/tổng, bảng tỷ lệ bỏ MT0; Điểm theo lớp có lượt MT0 (`?lop=&luot=`), Nhập điểm hồ sơ lớp mở đó; tab Lịch Test / Chấm Test; Phân tích mở tuần trước; `kiem-o-lop` + nhóm 6 `kiem-du-lieu-mt` (chỉ đọc) |
| 11/10/2026 | Planning (Opus 5.5) · `claude/epic-lovelace-jq3mig` | Overhaul: 5 đợt hỏi + 3 mockup (2 bản) + đặc tả OV (12 PR) duyệt; tái hiện lỗi MT0 3.3 (bảng tỷ lệ nhận điểm MT0); rà soát + dọn plan.md (xoá 24 kế hoạch đã merge); kế hoạch OV-1a |
| 09–10/10/2026 | #286–#302 (không ghi dòng riêng) | Điểm theo lớp lọc CN/khung (#286) · MTUI (#287) · KIEM-DU-LIEU-MT (#288) · QL-TEST (#289) · NO-CT2-KV (#290) · XTHV (#291) · NO-NHO (#292) · HOP1 (#293) · TEN (#298) · TD3 (#301) · VN3 (#302) — xem mô tả PR trên GitHub |
| 10/10/2026 | PR-KV-thiếu · `pr-kv-thieu-ky-nang` · Opus 5.5 | Kỳ vọng đầu ra khi MT0 thiếu kỹ năng (luật A): Overall = TB kỹ năng có band, cần ≥ 3/4 (W đủ W1 + W2), < 3 → Chờ MT0; kỹ năng thiếu "chưa thi", không vào `monTruot`; W MT0 lớp thường lưu `writing1`/`writing2` (không lỗi khoá); `prKv.tests.ts` KV13 |
| 10/10/2026 | PR-VN6 · `pr-vn6` · Opus 5.5 | F03 MT0 lớp thường hoàn tất theo band (`hoanTat.ts` qua `scoringModeOf`) · F02 `taoBoTroFinal` coi PA còn nhóm `mt:{bài}` là đã có bộ + `ops/demBoTroTrung.ts` (chỉ đọc, `npm run dem-bo-tro-trung`) · F05 nhắc nhóm + con cùng lô một chuông; `prVn6.tests.ts`, VN6-2 ở `prCt2.tests.ts` |
| 10/10 | PR-CACHE `pr-cache` · Opus 5.5 | F01+F04: `theHe` đếm lần xoá theo tiền tố; phản hồi bắt đầu trước lần xoá không vào bản vừa xem / `cachedGet`. 5 phép kiểm hành vi `prCache.tests.ts` |
| 10/10/2026 | PR-DON · `pr-don` · Opus 5.5 | 8 ghi chú cũ: nhắc 1 lần/ngày (khoá việc + `gop:` chung) · dòng phụ gộp từ `phu` · kỳ vọng 403 trước 404 · trần `/classes/:id/ky-vong` · `docFtTheoLo` chia lô · Final huỷ → huỷ bộ chưa đụng · CT2 tự đóng Mini Test khi sang FT · HOP1-d kiểm hành vi; `prDon.tests.ts`, DON-6/7 ở `prCt2.tests.ts` |
| 10/10/2026 | PR-VN5 · `pr-vn5` · Opus 5.5 | Huỷ bài lớp thường nhận môn chương trình (`xoaDiemLuot` nhánh `saveRegularScore`, MT0 vẫn band), nặng nhất 99 câu; `ban_chup_luot.trang_thai` = cancelled ngay sau huỷ; `prVn5.tests.ts` VN5-1…2 |
| 10/10/2026 | PR-VN4 · `pr-vn4` · Opus 5.5 | Huỷ cả lượt xoá điểm theo lô (`xoaDiemLuot`, nhật ký từng ô, `refreshOutcome` một lần): lượt nặng nhất 99 câu (trần `huyCaLuot` 120); 500 `vi-pham-theo-nhom` = dữ liệu phép kiểm `xoaDuLieu` nhóm `late` → `attendance`; `prVn4.tests.ts` VN4-1…3 |
| 08/10/2026 | PR-GOP · `claude/lucid-babbage-68b9xo` · Opus 5.5 | Công việc / Việc của tôi / badge: một dòng = một lớp × một loại việc × một người (`gopViecTheoLop`, `myWork().dong`), mở "n em ▾" thấy từng em; hạn sớm nhất, em quá hạn → dòng đỏ; giữ từng dòng Case SOS FT; summary/badge đếm dòng; Nhắc dòng gộp = một chuông; phép kiểm `prGop.tests.ts` GOP-1…4, ảnh `thiet-ke/anh/pr-gop/` |
| 08/10/2026 | PR-KV · `pr-kv-ky-vong` · Opus 5.5 | Panel "Kỳ vọng đầu ra · lớp" (`PanelKyVong`, `GET/PUT /classes/:id/ky-vong`): Đạt = Overall MT0 ≥ 4.0 BE / 4.5 ELE, điền sẵn, Lưu một lần (một tx, theo lô); Trung tâm → Case + Tutor 10 buổi (GV cũ), Học viên → lý do bắt buộc, Case không PA; một việc QL mỗi lớp (bỏ việc mỗi em); phép kiểm `prKv.tests.ts` KV1–KV8, ảnh `thiet-ke/anh/pr-kv/` |
| 08/10/2026 | PR-CT2 · `pr-ct2-che-tai` · Opus 5.5 | Bổ trợ Final sinh ngay khi Final đủ điểm + QL đã quyết lên (`dongBoCheTaiFinal`; FOU/BE 50–59 = 2 buổi/kỹ năng, BE/ELE→FT không, Người dạy GV cũ; đổi quyết định chưa ai đụng → huỷ); bỏ nộp / duyệt kế hoạch bổ trợ (PA chạy sau Xác nhận Case); MT0 hạn thứ Tư; Người dạy tuần này không bắt buộc; migrate `prCt2` (A/B/C); phép kiểm `prCt2.tests.ts` CT2-0–CT2-10 |
| 08/10/2026 | PR-CL · `pr-cl-chuyen-lop` · Opus 5.5 | Chuyển lớp một ô gõ tên lớp + khối "Khi chuyển" máy chủ, Target chỉ khi thiếu, `/transfer` Cuối khoá đúng luật; FT → Thường (MT0 không dùng/huỷ, huỷ Mock chưa điểm, giữ điểm + Target); việc QL "Xét lại lộ trình" → Chuyển lớp nhiều em; TransitionPanel chỉ FT; `prCl.tests.ts`, ảnh `thiet-ke/anh/pr-cl/` |
| 08/10/2026 | PR-PA · `pr-pa-dong-bo` · Opus 5.5 | Một mẫu PA (Loại · Nội dung · Số buổi · Người dạy · Ngày bắt đầu, không Người theo dõi) cho Thêm / Sửa (mới) / Thay / Xác nhận PA + mọi PA máy tạo (`chenPa`); Kết quả có Số buổi + Người dạy tuần này, đếm "Đã dạy a/b"; việc Kết quả về GVBM môn lớp hiện tại (hết mồ côi, VN2-1d 0 lỗi); panel Case mới; "Ghi kết quả" → "Kết quả"; migrate `prPa`; phép kiểm `prPa.tests.ts` PA0–PA19 |
| 08/10/2026 | PR-LCb · `pr-lcb-lo-trinh-tiep` · Opus 5.5 | Lớp thường một panel "Lộ trình tiếp theo" (GVCN đề xuất, QL Soạn › Xác nhận = ra lệnh, `huong_gvcn` giữ đề xuất, Target chỉ chữ); việc QL một dòng "Chốt lộ trình · {lớp}" hạn CN trước tuần Final thay "Chốt lên FT" + "Chuyển tiếp lớp"; "Xét lại lộ trình" dời PR-CL; phép kiểm `prLcb.tests.ts`, ảnh `thiet-ke/anh/pr-lcb/` |
| 08/10/2026 | PR-LCa · `pr-lca-luong-chuyen` · Opus 5.5 | Máy chủ: quyết định Cuối khoá ghi ngược Lộ trình tiếp theo + MT0 ngay (Hành trình "QL quyết"), Target Lên FT tự lấy LTT → khoá → hỏi, GVCN/QL không đổi Hướng/Target em đã quyết ở LTT (409), thi hành giữ ghi chú/lớp dự kiến, `dienSan` + cờ panel gộp, "Chốt lên FT" chỉ trước tuần Final, migrate `prLc`; phép kiểm `prLc.tests.ts` LC-a…p |
| 08/10/2026 | `pr-han-xac-nhan` · Opus 5.5 | Hạn xác nhận nguyên nhân / PA = 5 ngày, Gấp hoặc SOS 3 = 3 ngày qua một hàm `soNgayHanXacNhan`; Case đang mở giữ hạn cũ (không migrate); phép kiểm `prHan.tests.ts` |
| 08/10/2026 | `pr-viec-nho-2` · Opus 5.5 | Mockup 08/10 phần 1, 2, 4: "Nhắc tất cả (n)" ở Công việc › Của GV (`POST /my-work/nhac-nhieu`, lõi PR-NV, ≤ 50, hỏi lại); Chờ duyệt: Trạng thái đứng đầu, Loại mờ ở Nhắc việc; "GV chấm S" thành hàng có viền ở điện thoại + có ở Điểm theo lớp (nhớ lớp × MT); phép kiểm `prViecNho2.tests.ts` |
| 08/10/2026 | `pr-viec-nho-1008` · Opus 5.5 | 6 việc nhỏ: chip lưới FT đọc trạng thái; UNION Ý thức đủ AS + DTL1 quét cột trần; 409 email dưới ô Sửa thông tin; chip `+n` 44px ở điện thoại; Chốt lên FT tách "n em chờ duyệt đề xuất"; lỗi kho tệp ≠ mất kết nối Turso; phép kiểm `prViecNho.tests.ts` |
| 07/10/2026 | `fix-kq-gan-nhat-thuong` · Opus 5.5 | Lớp thường: "Kết quả gần nhất" theo loại (`moiNhatTruoc` = `soThuTuLuot` đảo, MT0 giữ cuối) ở danh sách lớp, SOS/Công việc, hồ sơ HV, tên Case; FT không đổi (chụp 391 mục giống hệt); phép kiểm `fixKqGanNhat.tests.ts` |
| 07/10/2026 | `fix-dtl-omt` · Opus 5.5 | Hồ sơ Mock từ Điểm theo lớp 500 trên Turso (câu UNION `scoreHistoryOf` thiếu AS); ô MT "chờ" của MT cũ tím (C2), chip lưới FT không cắt chữ; phép kiểm `fixDtlOmt.tests.ts` |
| 07/10/2026 | `o-chon-ten` · Opus 5.5 | Ô chọn người gõ được: Phân công GV (Tạo lớp, Tạo nhiều lớp, Sửa phân công) + ô Học viên của Tạo Case → `ChonNguoi` kiểu `ds`; phép kiểm `prOChon.tests.ts` |
| 07/10/2026 | qt-sua-tai-khoan (Opus 5.5) | Quản trị › Tài khoản › ⋯ › Sửa thông tin: họ tên, email đăng nhập, ĐT, chức danh, email khác; PATCH chỉ QT, trùng email 409, nhật ký cũ → mới, đổi email không đăng xuất |
| 07/10/2026 | Planning (Opus 5.5) · `ke-hoach-deploy-07-10` | #236 sửa lỗi Turso (connection closed, thử lại ở kiểm phiên) đã merge — rà sau merge bằng agent Opus; soạn `DEPLOY_2026-10.md`; deploy lần 1 ngay, EN + SOTAY lần 2 |
| 07/10/2026 | fix-turso-ket-noi-dong (Opus 5.5) · PR #236 | `laLoiMatKetNoiTurso` nhận connection closed / Hrana(Http / fetch failed / ECONNRESET; GET thử lại, lỗi ở kiểm phiên thử lại mọi method, ghi trong đường API không thử lại |
| 07/10/2026 | PR-HK2 (Sonnet 5.5, phương án B) · `pr-hk2-badge-chu` · PR #235 | Hai họ chip một cỡ (`CHIP_TRON` / `CHIP_VUONG`, 11,5 px cao 20 px; "+n" chip tròn dẫn đúng chỗ), ⋯ một kiểu, `.nut-loc`, chữ nội dung 12 px, đầu cột dính ≥ 1280 px (`.bang-dinh`), Tổng hợp vừa 1440 (bỏ Tạm thời, "HV - Case", ô badge), thanh trên điện thoại 23C + demo bar một dòng, "Vắng" một thông báo không Hoàn tác, chữ J1–J9, Progress Test / Final Test, tên PISA Tracking, Hành trình không ghi tuần học khi không có lộ trình chạy. Phép kiểm `prHk2` C1–C41; ảnh `thiet-ke/anh/hk2/`. |
| 07/10/2026 | PR-KHUNG (Opus 5.5) · `pr-khung-cuon-chu-cat` | G1–G7 ở gốc chung: chỉ `<main>` cuộn (Học viên & Lớp đầu cột + hàng lớp dính), `NutChon` xuống dòng (✓ chỉ nút đang chọn), việc / Case / PA không cắt chữ ở 375, lọc + tab điện thoại một hàng vuốt mép mờ, bỏ cuộn lồng (nhật ký quản trị, `.table-scroll`), `KhungPanel` "* = bắt buộc" không đè nhãn. Phép kiểm `prKhung` K1–K9 + `scripts/do-khung.mjs`. |
| 07/10/2026 | PR-LUI-a2 (Opus 5.5) · `pr-lui-a2-case-duyet` | Case + Chờ duyệt: Người phụ trách khi ghi kết quả PA (cột mới, migrate `prLuiA2`), gộp `Vấn đề còn tồn / Ghi chú`, nút kết quả 2 cột; Tạo Case có bằng chứng; Mở lại Case (QL/QT); Sửa Case · Xoá Case báo tay · Xoá PA; Từ chối nhiều; Huỷ quyết định Đề xuất PA trong ngày; nhật ký hạn theo dõi. Phép kiểm `LUIa2-1…16`. |
| 07/10/2026 | PR-BV (Opus 5.5) · `pr-bv-bo-vang-xoa-diem` | Xoá "-" = hết vắng: Mock đã chốt trả như trước khi gõ (giữ quyết định của người), lớp thường trừ lần vắng / giữ lịch khi tuần mới có điểm, khung gỡ GV · GVCN đến thứ Tư; nhập lại điểm sau khi xoá mở lại đúng Case; Lịch sử ô lớp thường; bài lớp thường xoá điểm về chưa xong. Phép kiểm `prBv`. |
| 07/10/2026 | PR-MT0 (Opus 5.5) · `pr-mt0` | MT0 (T5, T5b): Lên FT (FOU/BE/ELE) tự có MT0 tuần Final, chấm band, hạn CN tuần sau, SOS chỉ hiển thị; dời muộn nhất tuần 2 FT, trước MT1, theo Final; Chuyển tiếp nối MT0 làm đầu vào FT / `MT0 · không dùng`; việc QL `Chốt lên FT · lớp` tự xong. Phép kiểm `prMt0` MT0-0…MT0-8. |
| 06/10/2026 | PR-TK (Sonnet 5.5, phương án B) · `pr-tk-tong-ket-lo-trinh` | Tổng kết lộ trình: bản chụp lúc đóng mọi đường (migrate `prTk` điền ngược), kết quả thi thật L R W S (GVCN nhập, máy so Target lúc đóng) + việc nhắc, Kết thúc học FT chờ kết quả chưa lưu trữ, khối Các lộ trình · ngăn Tổng kết · tab Tổng kết lớp · nút Tổng kết ở Lưu trữ. Phép kiểm `prTk` TK-1…TK-L. |
| 06/10/2026 | PR-LT3 (Opus 5.5) · `pr-lt3-lich-test-ba-khoi` | Lịch Test ba khối (quá hạn theo hôm nay · chấm tuần này · lịch tuần xem), một bài một khối; Speaking Mock chấm chéo: không nợ/trễ GVBM S, GVCN, trễ theo GV chấm, chuông thứ Hai |
| 06/10/2026 | PR-LUI-a1 (Sonnet 5.5, phương án B) · `pr-lui-a1-y-thuc` | Ý thức: Ghi vi phạm một lần cho nhiều học viên / nhiều vi phạm (ô `Vi phạm` 3–60 + `Mô tả`, bằng chứng trong form, lô 8, lưu dở), `TepCho` + `/attachments/chep` (một tệp nhiều bản ghi), Sửa vi phạm / Xoá lần xử lý (bậc tính lại). Phép kiểm `LUIa1-1…15`. Bỏ toast Hoàn tác vi phạm (PR-HK2). |
| 06/10/2026 | PR-LUI-b (Sonnet 5.5, phương án B) · `pr-lui-b-hoc-vien-lop` | Đường lui Học viên & Lớp: Học lại (về lớp cũ / sang lớp mới), Mở lại lớp, Quản lý kết thúc lớp, **Chọn nhiều học viên** (kết thúc học, lưu trữ, huỷ chuyển lớp; Lưu trữ: bỏ lưu trữ, học lại) có xem trước, lô 8, Hoàn tác. Phép kiểm `prLuiB` LUIb-1…27 (đã gồm sửa sau rà #213). |
| 06/10/2026 | PR-MTb (Sonnet 5.5, phương án B) · `pr-mtb-giao-dien-mock-test` | Giao diện Mock Test theo mockup bản 4: Ô MT dùng chung (`OMt`, nhãn "cũ") · panel Xếp lịch Mock Test ("MT mới", tick kỹ năng, "Sẽ xếp" 3 màu) · hộp một đợt (Tuần chung, ⋯ luôn hiện, Nhật ký) · popup dời vượt 4 cổng · lý do tuỳ chọn · nhập band · Xin dời / Không mock lại / Khôi phục kết quả · lưới FT dùng Ô MT. |
| 06/10/2026 | PR-MTa (Opus 5.5) · `pr-mta-luat-mock-test` | T1 MT cũ (≥ 2 tuần, lúc xếp/dời) · T4 QL xếp tuần đã qua (cả lớp thường) · T2 dời vượt huỷ kết quả → `ket_qua_huy`, khôi phục · T3 vắng lần 2 huỷ, Xin dời, Không mock lại · T7 lý do chỉ 4 trường hợp, bỏ tối thiểu ký tự mọi nơi · T10 band máy chủ · T11 chuông GVCN. Migrate `prMta`. |
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
