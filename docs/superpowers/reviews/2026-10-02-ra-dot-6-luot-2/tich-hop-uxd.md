# Rà đợt 6 lượt 2 — Tích hợp (main @ df0d57cf) + rà GỌN #156 PR-UXD

Người rà: Opus 5.5 · 02/10/2026 · worktree `scratchpad\ra6` (không sửa mã, không commit; file Vite tạm đã xoá, `git status` sạch).

## Tóm tắt

| Mức | Số |
|---|---|
| P0 | 0 |
| P1 | 0 |
| P2 | 4 |

Kết quả kiểm: **2280 phép kiểm chính đạt · 32 phép kiểm tốc độ đạt · typecheck web + server 0 lỗi** (chạy thẳng, không qua npm, sau hai lần `npm run check` sập segfault — chi tiết ở Bước 1).

---

## Bước 1 · Phép kiểm

- `npm run check` lần 1 (log `%TEMP%\check-ra-luot2-lan1-segfault.log`): **sập 0xC0000005** (mã thoát -1073741819) sau 280 s, giữa bộ chính, không có ✗ nào trước chỗ sập.
- Lần 2 (log `%TEMP%\check-ra-luot2-lan2-segfault.log`): **sập 0xC0000005** lần nữa sau 433 s, ở chỗ khác (đoạn Pb2-a). Hai lần sập ở hai chỗ khác nhau → sập Node, không phải phép kiểm hỏng.
- Theo quy trình đã chốt (memory "npm check segfault", kế hoạch UXD dòng 54): chạy thẳng không qua npm, một lần:
  - `tsc -p tsconfig.build.json` → 0
  - `node dist-server/server/src/tests/run.js` → 0 · **"TẤT CẢ 2280 KIỂM TRA ĐỀU ĐẠT"** (log `%TEMP%\check-ra-luot2-thang.log`)
  - `node dist-server/server/src/tests/tocDo.run.js` → 0 · **"TỐC ĐỘ: 32 KIỂM TRA ĐỀU ĐẠT"** (log `%TEMP%\check-ra-luot2-tocdo.log`)
  - `tsc -p tsconfig.web.json --noEmit` → 0 · `tsc -p tsconfig.build.json --noEmit` → 0 (log `%TEMP%\check-ra-luot2-tsc.log`)
- Mốc so sánh: UXD ghi 2246 (Dọn-a + UXD) · 32 tốc độ; sau UXF-b lên 2280 — không giảm.
- **Lưu ý quy trình:** lúc 00:43:57 có **một phiên khác** chạy `npm run check` (cây tiến trình bash → `npm run check` → `npm test` → `node dist-server/server/src/tests/run.js`, PID 26000/13740/10948/22500), không phải ở worktree `ra6` (`dist-server` của `ra6` không bị build lại). Trái luật "chỉ người rà Tích hợp chạy check". Tôi **không tắt** tiến trình đó (không phải của tôi) — planning nên kiểm phiên nào đang chạy.

## Bước 2 · Quét chéo trên main

| Mục | Kết quả |
|---|---|
| Đúng một định nghĩa | `tuanLich` (`shared/domain/hienThiNgay.ts:22`), `docTuanLich` (`:37`), `tuanHocFt` (`:81`), `HV_DANG_HOC_SQL` (`server/src/students/tamDung.ts:11`), `khoangTamDung` (`tamDung.ts:19`), `baiId` (`shared/domain/cases.ts:61`) — mỗi tên **một** định nghĩa, không có bản chép ở web/server |
| Web gọi route đã xoá | Đối chiếu tự động 169 đường `api.*` / `useApi` / `cachedGet` trong `web/src` với 222 route của `server/src/routes/index.ts` (script `ra-luot2\chkroutes.mjs`): **mọi đường đều có route**. 24 route Dọn-a xoá (`/overview`, `/summary`, `/branch-pulse`, `/prefs`, `/weekly-rollup*`, `/move-requests*`, `/attempts/no-plan`, `/attempts/bulk-plan`, `…/sit`, `/score-sheet`, `/suggested-weeks`, `/interventions/:id/respond|complete`, `/cases/:id/issues|owner`, `/ref/issue-taxonomy`, `/tasks/:id/history`, `/mgmt-tasks/mine`) — web không gọi cái nào. Chỉ còn `invalidate('/overview')` (xem P2-4) |
| Route mới có trần SQL | Lượt 2 không thêm route mới (Dọn-a chỉ thêm `requireAuth` cho `/ref/routes`, sửa thân `/cycles/:id/suggested-mocks`). Đường đo mới `/ref/nguoi?nhom=giao_vien&studentId={hv}` có trần 4 vai (`tocDoDuong.ts:457-460`). Trần của 5 route đã xoá cũng đã gỡ khỏi `TRAN` |
| Chữ cấm | Không còn `n/16` cho FT (chỉ một chú thích `DauHoSo.tsx:26` ghi "không bao giờ n/16"); không có "ca tối", "đổi ca", `'ca-hai'`. "cả hai" chỉ còn trong chú thích và câu văn thường ("cả hai đều điền", "khi có cả hai task") — không phải lựa chọn chương trình "Cả hai" |

## Bước 3 · Bấm thử (API 4117 · Vite 5317 · Playwright kênh Chrome · DB demo seed lại, ngày demo 14/09/2026)

Ảnh: `scratchpad\ra-luot2\anh\` (≈ 60 ảnh). Kết quả máy đọc: `ra-luot2\bam-thu.json`. **0 lỗi console, 0 phản hồi 4xx/5xx** trong cả lượt (45 bước + 6 bước bổ sung).

### 375 px · GVCN FT (7) và GVBM (9) · sáng + tối — `document.documentElement.scrollWidth` = **375 ở mọi màn**

| Màn | Kết quả |
|---|---|
| Tổng quan | 375 · "Hôm nay" 3 việc + Xem hết (31) · Lớp tôi dạy thẻ |
| Thanh dưới | 4 mục cao **56 px**, rộng 94 px, biểu tượng SVG 20 px, mục đang mở có `aria-current="page"` + vạch trên; số đỏ góc biểu tượng "Công việc" (9 / 7), có chữ sr-only "9 việc quá hạn" |
| Thanh trên | nút kính lúp 44×44 · chuông 72×44 · ◐ 44×44 · vòng chữ cái 51×44 ("H" = Trần Ngọc Hà, "T" = Phạm Thu Trang; `aria-label="Tài khoản …"`); không còn ô tìm bị ép |
| Ô tìm | bấm kính lúp → khung neo ngay dưới đáy `<header>` (đáy 126 → khung 129, hai mép 8/367, có DemoBar), focus vào ô; gõ "ft101" ra kết quả; Esc đóng và trả focus về nút kính lúp |
| Thông báo | bảng neo đáy header (129), hai mép 8/367, cao 568, cuộn trong |
| Công việc | 375 |
| Hồ sơ HV FT (HV 1) · Học thuật | 375 · hàng tab 3 tab vừa 343 px (scrollWidth = clientWidth = 343) · **3 thẻ Mock Test** (`article#dot-*`), không còn bảng `min-w-[640px]`: `MT3 dời S · W3 SEP · Chưa có điểm`, dòng Điểm L R W S · Overall · Kỳ vọng · Lớp cuối |
| Hồ sơ HV BE 04 (HV 82) · Học thuật | 375 · thẻ `Cuối khoá · W1 SEP · 55% Không đạt` + chip điểm từng phần + Lớp + "Hồ sơ đợt ›" |
| Hồ sơ HV · Hành trình, Ý thức | 375 (cả hai HV) |
| `?dot=5` | thẻ MT tô nền accent-soft, cuộn vào tầm nhìn (top 511 / vh 812) — `HangTab.scrollIntoView` không giành cuộn |
| Lưới chấm `/nhap-diem/3` | 375 (GVCN, GVBM) |
| Lịch Test | 375 · tuần (WeekPicker) + công tắc khung + nút "Lọc" (`IconGap`, không ký tự ▾). GVBM: khối Lọc = Chi nhánh · Lớp tôi dạy/Tất cả · Xuất Excel; chọn "Tất cả" → nhãn **"Lọc · 1"**. GVCN 7: khối Lọc chỉ có Xuất Excel |

### 1440 px · QL (2) tối, GVCN (7) sáng

| Màn | Kết quả |
|---|---|
| Tổng quan QL | không có thanh dưới (0 mục hiện), không có nút kính lúp, ô tìm đầy đủ, tên "Nguyễn Khánh Vy" đầy đủ |
| Phân tích › Giáo viên | ô Khoảng ghi mã tuần: **"W4 AUG" – "W3 SEP"**, dòng tóm tắt "trong W4 AUG – W3 SEP" |
| Gõ mã tuần | Phân tích GV: gõ "W4 SEP" vào "Từ tuần" + Enter → `tu=2026-09-21`, ô hiện "W4 SEP" (Đến tuần tự kéo theo W4 SEP vì đang nhỏ hơn). Lịch Test: mở WeekPicker, gõ "W4 SEP" + Enter → trường tuần "W4 SEP 21/09 – 27/09", `periodId=43`. **Đạt** |
| Vận hành | **0 nút "+ Giao việc"** — có "+ Công việc"; nút "+ Giao việc" còn ở Báo cáo đơn vị. Đây là Task 12 kế hoạch Dọn ("một cửa Giao việc", Câu 1 = A) thuộc **PR-Dọn-b lượt 3**, chưa tới hạn → ghi ở "Chuyển cho PR khác", không tính lỗi |
| Chuyển lớp (hồ sơ lớp BE 04 → "Chuyển lớp cả lớp…") | panel mở, tuần bắt đầu ghi mã tuần (W4 SEP, W1 OCT…), 1440 không tràn |
| Báo cáo đơn vị | mở được, 1440 không tràn |
| GVCN 1440 sáng | hồ sơ HV FT vẽ **bảng** (3 `tr#dot-*`, 0 thẻ); Lịch Test giữ hàng lọc một hàng cũ, không có nút "Lọc"; thanh trên như cũ → **không thấy hồi quy máy tính** |

Máy chủ dev đã tắt (4117, 5317 không còn nghe), file `vite.ra-luot2.config.ts` đã xoá.

---

## Phát hiện

### [P2] Điện thoại: ô tìm và bảng thông báo / menu tài khoản mở chồng lên nhau
- Chỗ: `web/src/modules/platform/Header.tsx:202` (onClick chuông), `:274` (onClick tài khoản)
- Lỗi: bấm chuông hoặc tài khoản không đóng ô tìm điện thoại (`moTimDt`); nút kính lúp thì có đóng menu (`setOpenMenu(null)`), chiều ngược lại thì không.
- Tình huống: 375 px, bấm kính lúp → bấm chuông → cả `input` tìm lẫn `[role=dialog] Thông báo` cùng có trong DOM, hai khung `absolute top-full z-40` chồng nhau (ảnh `anh\tim-va-chuong-chong-gv7-375-sang.png`); đóng thông báo thì ô tìm cũ hiện lại. Hai nút cùng `aria-expanded="true"`.
- Sửa: thêm `setMoTimDt(false)` vào onClick chuông và nút tài khoản (một dòng mỗi chỗ).
- Nguồn luật: kế hoạch UXD Q5/Q6 (ô tìm và bảng thông báo cùng một chỗ neo → phải loại trừ nhau).

### [P2] Ô tuần gõ được "W4 SEP" nhưng bàn phím điện thoại chỉ có số (UXF-b × UXD)
- Chỗ: `web/src/ui/ONgay.tsx:68` và `web/src/ui/LichNho.tsx:217` (`inputMode="numeric"`)
- Lỗi: UXF-b cho ô kiểu `tuan` hiện và nhận mã tuần (placeholder "W4 SEP hoặc dd/mm", "W4 SEP hoặc 28/09") nhưng giữ `inputMode="numeric"` → trên điện thoại bàn phím số không có chữ W, S, E, P.
- Tình huống: GV mở Lịch Test trên điện thoại → bấm trường tuần → ô "Gõ tuần hoặc ngày" → không gõ được "W4 SEP" như chữ gợi ý; ô "Từ tuần" của Phân tích đang ghi "W4 AUG", sửa trên điện thoại cũng chỉ gõ được số. Vẫn chọn được bằng lịch.
- Sửa: `inputMode={kieu === 'tuan' ? 'text' : 'numeric'}` ở `ONgay`; ô gõ của `LichNho` (luôn là tuần) bỏ `inputMode="numeric"` (có thể thêm `autoCapitalize="characters"`).
- Nguồn luật: UXF-b B5 (mã tuần là chữ chính, gõ lại được) + UXD Q31-3 (màn GV hằng ngày dùng được trên điện thoại).

### [P2] Thanh trên điện thoại lệch mockup 23 màn C ở cỡ biểu tượng và kiểu nút
- Chỗ: `web/src/modules/platform/Header.tsx:192-194` (kính lúp 18 px), `:206-207` (chuông 14 px), `:208` (số chưa đọc là chip nằm cạnh), các nút dùng `btn btn-sm` có viền
- Lỗi: mockup 23 C (`.ib .ico` 20×20, nút `.ib` nền trong suốt không viền, `.badge` tuyệt đối ở góc trên phải biểu tượng); bản code: kính lúp 18 px, chuông 14 px, bốn nút có viền, số chưa đọc nằm ngang nên nút chuông rộng 72 px (ảnh `anh\tong-quan-gv7-375-sang.png`).
- Tình huống: 375 px mọi vai — thanh trên trông nặng hơn mockup (4 ô viền), chuông nhỏ hơn kính lúp. Không tràn, vùng bấm đủ 44 px.
- Sửa: trên < 640 px dùng nút trong suốt (`sm:` giữ `btn`), biểu tượng 20 px, số chưa đọc `absolute top-[3px] right-[1px]` như `.badge` mockup. Kế hoạch Q5 không nói rõ kiểu nút → để planning quyết có đưa vào Dọn-b/S3 không.
- Nguồn luật: mockup `thiet-ke/mockup/23-tong-quan-theo-vai.html:240-245, :584-588`; kế hoạch UXD Q5.

### [P2] Còn `invalidate('/overview')` sau khi Dọn-a xoá route `GET /overview`
- Chỗ: `web/src/modules/cases/CapNhatTuan.tsx:163`, `NopKeHoachPanel.tsx:24`, `QuickReport.tsx:184, :224`, `ThaoTacCase.tsx:82`, `cham/LuoiThuong.tsx:204`, `classes/XoaKetThucLopPanel.tsx:34, :80`, `fasttrack/HopThaoTacMt.tsx:128`, `fasttrack/MockDetailPage.tsx:622, :668, :735`
- Lỗi: tiền tố `/overview` không còn khoá cache nào (Tổng quan giờ đọc `/tong-quan/*`, `/my-work`) → lời gọi chết. Lưu ý `invalidate` theo tiền tố nên `/overview` **không** khớp `/classes/:id/overview`.
- Tình huống: vô hại (không làm hỏng dữ liệu), nhưng là mã thừa; nếu ai đó tưởng nó làm mới Tổng quan thì sai — Tổng quan làm mới nhờ `invalidate('/my-work')` / `/tong-quan` ở chỗ khác (chưa kiểm hết từng chỗ có gọi `/tong-quan` hay không).
- Sửa: xoá các `invalidate('/overview')`; nếu chỗ nào cần làm mới Tổng quan thì thay bằng `invalidate('/tong-quan')`.
- Nguồn luật: kế hoạch Dọn (mã thừa) — hợp với PR-Dọn-b lượt 3.

---

## Bước 4 · Rà GỌN #156 PR-UXD (kế hoạch `docs/superpowers/plans/2026-10-01-pr-uxd-dien-thoai.md`)

| Task | Đã làm? | Bằng chứng (mã + bấm thử) |
|---|---|---|
| 1 Thanh dưới biểu tượng (Q3) | **Có** | `App.tsx:66-88` `BIEU_TUONG` chép đúng 4 đường vẽ mockup, `min-h-[56px]`, `text-[11.5px]`, vạch `h-[3px] w-8`, `SoCho` tuyệt đối `top-[5px] left-[calc(50%+5px)]`; đo 56 px × 4 mục |
| 2 Thanh trên (Q5, Q6) | **Có** (kèm P2 chồng khung + P2 lệch mockup) | `Header.tsx` nút kính lúp 44 px, `aria-expanded`, khung `absolute inset-x-2 top-full`, Esc trả focus; chữ cái tài khoản = chữ đầu của TÊN GỌI; chuông `sm:relative` + bảng `absolute top-full`; `<header relative>`; đo neo đúng đáy header khi có DemoBar |
| 3 Toast + viền ô tối (Q7, Q8) | **Có** | `index.css` `body:has([aria-modal="true"]) .vung-toast {top:3.75rem;bottom:auto}` (độ đặc hiệu 0,2,1 thắng `bottom-20`/`md:bottom-4`); `Toast.tsx` dùng `IconDat`, bỏ ✓; `--o-nhap-vien` tối `#64748b`, `--o-sua-vien` tối `#4f79b3`, khối sáng không đổi; phép kiểm `tuongPhan` xanh. Toast khi có panel: chỉ kiểm bằng mã, không bấm thử |
| 4 Hồ sơ HV thẻ + hàng tab (Q9, Q10) | **Có** | `IeltsAttempts`/`RatioAttempts` nhánh `if (dienThoai)` vẽ **một** biến thể `TheDong` (id `dot-{id}`), dùng chung `nhanMt`/`diemKyNang`/`chipMon` với bảng; `HangTab` `px-2.5 sm:px-3` + `scrollIntoView`; đo tab 343 = 343, `?dot=` vẫn cuộn đúng |
| 5 Lịch Test "Lọc" (Q11) | **Có**, lệch có ghi | nút "Lọc · n" + `IconGap`, khối Chi nhánh / phạm vi / NutLuat / Xuất Excel, Esc đóng (nhường `aria-modal`); máy tính giữ hàng lọc cũ. **Dải số giữ 2×2** (không làm "một hàng 4 ô") — Nhật ký ghi lý do "Nợ tuần trước · 3 lớp" xuống dòng, đúng điều kiện Câu 2 đã chốt → chấp nhận |
| 6 Dòng phụ lộ trình (Q12) | **Có** | `StudentsPage.tsx` kiểu `LopTrenTrang.route`, `chuLop` dùng ở thẻ và bảng (cả `title`); lớp thường bỏ lộ trình. Chỉ kiểm bằng mã |
| 7 Sót 375 + R5-6 + V9 | **Có** | sửa tràn `KetLuanKhoa.tsx:55` (chip hướng xuống dòng); bấm thử của tôi: mọi màn GV hằng ngày 375 = 375; V9 ghi trong Nhật ký/thân PR |
| 8 Bấm thử, audit, CODE_MAP | **Có** | ảnh `thiet-ke/anh/pr-uxd/*`, `CODE_MAP.md:147` + `:33` đã sửa chữ "dùng lại cho Mock Test / Kết quả kiểm tra"; `prUxd.tests.ts` đăng ký sau Dọn-a, trước UXF-b (`run.ts:9030`) |

**Hồi quy 1440 px:** không thấy. Thanh dưới `md:hidden` (0 mục hiện ở 1440), nút kính lúp và vòng chữ cái chỉ < 640 px (JS `useDienThoai` + `sm:hidden`), tên tài khoản đầy đủ, ô tìm 1440 như cũ, hồ sơ HV vẽ bảng, Lịch Test giữ hàng lọc một hàng. Khoảng 640–767 px: thanh dưới vẫn hiện (md) còn thanh trên đã về dạng máy tính (sm) — giống trước PR, không mới.

**Lệch quy trình UXD (đã tự ghi trong Nhật ký, để planning biết):** check Task 4–8 chạy một lần ở HEAD cuối trên bản chụp ngoài repo, không mỗi Task một lần; dải số 2×2 thay vì một hàng.

## Đã kiểm, không có lỗi
- Một định nghĩa cho `tuanLich`, `docTuanLich`, `HV_DANG_HOC_SQL`, `tuanHocFt`, `khoangTamDung`, `baiId`.
- Web không gọi route nào đã bị Dọn-a xoá (đối chiếu tự động 169 đường).
- Trần SQL: đường đo mới `/ref/nguoi?…studentId` đủ 4 vai; trần của route đã xoá đã gỡ.
- Chữ cấm `n/16` (FT), "ca tối", "đổi ca", "Cả hai"/`ca-hai`: không còn trên màn.
- 375 px sáng + tối: Tổng quan, Công việc, hồ sơ HV (Học thuật, thẻ Mock Test, Kết quả kiểm tra, Ý thức, Hành trình), lưới chấm, Lịch Test + Lọc, thông báo, ô tìm, thanh dưới, thanh trên — `scrollWidth` = 375 mọi màn.
- Mã tuần: Phân tích › Giáo viên ghi "W4 AUG – W3 SEP"; gõ "W4 SEP" chọn đúng tuần ở WeekPicker và ô Từ tuần.
- Chuyển lớp cả lớp (QL 1440): panel mở, tuần ghi mã tuần.
- Console: 0 lỗi; mạng: 0 phản hồi 4xx/5xx.
- `?dot=` trên điện thoại vẫn cuộn tới thẻ đúng và tô nền.

## Chuyển cho PR khác
- **PR-Dọn-b (lượt 3), Task 12:** "một cửa Giao việc" — hiện Vận hành có "+ Công việc", Báo cáo đơn vị có "+ Giao việc" (0 nút "+ Giao việc" ở Vận hành). Xoá luôn `invalidate('/overview')` (P2-4).
- **PR-Dọn-b / S3:** thanh trên điện thoại theo đúng mockup 23 C (P2-3) nếu planning muốn; `inputMode` ô tuần (P2-2) là một dòng, ghép vào PR web nào chạy trước.
- **Planning:** một phiên khác đang chạy `npm run check` lúc 00:43:57 (02/10) ngoài worktree `ra6` — kiểm và tắt nếu không cần.
