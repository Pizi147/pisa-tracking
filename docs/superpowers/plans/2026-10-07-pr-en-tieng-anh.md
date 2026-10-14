# PR-EN · Bản tiếng Anh cho giáo viên nước ngoài — Kế hoạch (bản 2, sau HK2)

> **Đối chiếu lại mã `main` 90fc7bcd (07/10) — sau PR-HK2 #235 và fix Turso #236.** Bản 1 viết trên f904d06d (trước HK2); file:dòng dưới đây đã đọc lại.
> **Chạy sau HK2 (đã merge), trước PR-SOTAY; deploy một lần sau cùng** (plan.md mục 3, 07/10). Bốn đợt EN-a → EN-b → EN-c → EN-d, **mỗi đợt một PR, nối tiếp** (đợt sau từ `main` đã có đợt trước).
> **Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì DỪNG** (kể cả subagent, CLAUDE.md 06/10).
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (mỗi Task một subagent cùng model). Bước `- [ ]`.

**Nguồn:** `plan.md` mục 1, 3 (06/10, 07/10), 4 "PR-EN", 9.0; kế hoạch HK2 `2026-10-07-pr-hk2-badge-chu.md`; thuật ngữ `thiet-ke/THUAT_NGU_EN_2026-10-07.md` (đã sửa 07/10 theo mã sau HK2);
mockup `thiet-ke/mockup-en-2026-10-07.html` (**planning tự duyệt 07/10**, đã sửa menu điện thoại theo mã HK2; chủ sản phẩm xem ảnh trước khi merge).

**Goal:** giáo viên nước ngoài dùng được toàn bộ phần việc của GV bằng tiếng Anh: Đăng nhập, thanh trên, Tổng quan GV, Lịch Test, Điểm theo lớp / nhập điểm,
hồ sơ lớp + hồ sơ HV (xem), Case – PA (tạo, ghi kết quả), Ghi vi phạm, Công việc của tôi, chuông, câu lỗi máy chủ trên các đường đó.
Màn QL / Quản trị (Kế hoạch Test, Chờ duyệt, Phân tích, Quản trị, panel quản lý HV / lớp) **giữ tiếng Việt**. Giao diện giữ nguyên — chỉ đổi chữ + thêm nút ngôn ngữ.

## Chốt của chủ sản phẩm (07/10 — không đổi)

- **"VI | EN" chữ nhỏ cạnh nút Sáng/Tối.** Máy tính: ngay sau ◐ (`Header.tsx:265` `{!dienThoai && <CongTacGiaoDien />}`), trước nút tên. Điện thoại: HK2 Q2 = A đã đưa Sáng/Tối vào menu Tài khoản
  (`Header.tsx:313` `{dienThoai && <CongTacGiaoDien kieu="menu" />}`, đầu khối lối phụ, sau Phạm vi / GVCN / Kỹ năng) → hàng **"Language VI | EN" ngay trên hàng "Display Dark | Light"**, cùng khối. Không thêm nút lên thanh 23C.
- **Màn đăng nhập: hai nút to "Tiếng Việt | English" ngay trên khung đăng nhập** (`WelcomePage.tsx` giữa hàng logo `:132-142` và hàng tab `:151`). Mỗi nút ghi bằng chính tiếng của nó.
- **Chỉ phần GV dùng.** **Không thư viện i18n**: từ điển `vi` / `en` + `t()`. **Máy chủ trả mã + chữ Việt, web dịch theo mã**; câu chưa có mã hiện chữ Việt, không vỡ.
- **Thuật ngữ:** Lớp thường = **Normal class** (công tắc: **Normal**), GVCN = **Core teacher** (chủ sản phẩm 07/10). "Progress Test / Final Test" (HK2 đã đổi cả bản Việt, `shared/domain/normal.ts:59-64`).
- **Nhớ ngôn ngữ theo tài khoản (máy chủ, migrate riêng `server/src/migrate/prEn.ts`) + `localStorage` trước khi đăng nhập.**
- **Phép kiểm:** đủ khoá hai tiếng; quét Playwright không còn chữ Việt ở EN; đo chữ cắt `scripts/do-khung.mjs` ở 375 + 1440, sáng + tối, 0 lỗi. Câu EN dài thì rút, **không thu cỡ chữ**.
- Luật chung: chữ ngắn (nhãn 1–3 từ); thao tác đơn giản nhất; ô ngày = ô gõ + lịch (`ONgay`); thời gian ưu tiên mã tuần `W2 OCT`.

## Chữ mới của HK2 mà EN phải dịch đúng (đọc mã 90fc7bcd)

| Chữ Việt sau HK2 · file:dòng | EN | Ghi chú |
|---|---|---|
| "Progress Test" / "Final Test" — một nguồn `ATTEMPT_KIND_LABEL` / `ATTEMPT_KIND_SHORT` / `ATTEMPT_KIND_NGAN` `shared/domain/normal.ts:59-67` | giữ nguyên | Không còn "Giữa khoá / Cuối khoá" trên màn (chỉ trong chú thích). Còn "Kết luận khoá" (`TabTongKetLop.tsx:127`) → "Course outcome" |
| Hai họ chip `CHIP_TRON` / `CHIP_VUONG` `ui/Nhan.tsx:17-18` (11,5 px, cao 20 px, `whitespace-nowrap`) — 14 file dùng | — | Chip **nowrap**: chữ EN trong chip phải ngắn ≤ chữ Việt (đo (c) của do-khung bắt chip cắt / tràn) |
| Thanh 23C điện thoại `App.tsx:143-146` (cao 52 px, chữ "PISA"), `Header.tsx:179-201, 268-272` (nút 44×44 không viền, số đè góc chuông) | "PISA" giữ | `aria-label` "Tìm học viên, lớp" (`:182`), "Thông báo, n chưa đọc" (`:196`), "Tài khoản {tên}" (`:269`) dịch |
| Sáng/Tối trong menu Tài khoản: "Giao diện · Tối \| Sáng" `ui/CongTacGiaoDien.tsx:24-36` | "Display · Dark \| Light" | `NutNgonNgu` kiểu `menu` dùng **cùng khung** (min-h 44, nút min-w 64) |
| Menu Tài khoản `Header.tsx:276-334`: "Phạm vi được cấp", "Toàn hệ thống", "GVCN" + chip `GVCN {mã}`, "Kỹ năng được phân công", "Hồ sơ cá nhân", "Hồ sơ giáo viên", "Đăng xuất" | Access · All branches · Core teacher + chip `{mã}` · Assigned skills · My profile · Teacher profile · Sign out | Mockup mục 2 đã vẽ đúng thứ tự này |
| Tên web "PISA Tracking" `index.html:7`, `App.tsx:150`, `WelcomePage.tsx:137`; "Bản demo nội bộ" `App.tsx:151` | giữ "PISA Tracking" · "Internal demo" | `<title>` giữ |
| Vắng (Q4 = B): **một thông báo, không nút** `cham/thongBaoVang.ts:12` "Đã ghi vắng {môn} · {tên} · dời {tuần}"; gỡ vắng `cham/LuoiThuong.tsx:242-244`, `fasttrack/ScoreEntry.tsx:140` "Đã gỡ vắng … · về / giữ {tuần}"; nút "Vắng" `ScoreEntry.tsx:215-217` | "Absent R · Name · moved to W4 SEP" · "Absence removed R · Name · back to / kept W…" · "Absent" | Ghép chữ → khoá có biến (`thongBaoVang.ts` là một chỗ chung — sửa ở đó) |
| J1 `gapText` `cases/SkillBoard.tsx:650-653` "-1.5" / "+0.5" / "đạt kỳ vọng"; `title` "dưới / trên kỳ vọng n" `:615` | số giữ · "met expected" · "below / above expected by n" | |
| J3 `worklist/tongQuan.ts:115` "quá hạn n ngày" / "quá hạn a–b ngày" (máy chủ) | "n days overdue" · "a–b days overdue" · số ít "1 day overdue" | Máy chủ gửi `khoa` + `{a,b}` |
| J7 bỏ "Bạn" ở dòng việc của mình (`mywork.ts` — không còn `'Bạn'`) | không có "You" | Mockup mục 3 đã đúng |
| J9 ô trống "Nhập" `ScoreEntry.tsx:509`; "Xác nhận PA Tutor" (`sosV4.ts:87` bỏ đuôi) | "Enter" · "Confirm tutor PA" | |
| "Thiếu điểm" (`phanTich` — QL, giữ Việt) · "Mất kết nối…" + "Đang thử…" `App.tsx:138-139`; "Bỏ qua tới nội dung" `:132` | "Connection lost — …" · "Retrying…" · "Skip to content" | |

## Architecture

**1. Từ điển — `shared/i18n/`** (dùng chung web + máy chủ, không thư viện):
- `vi.ts`: `export const VI = { 'nav.tongQuan': 'Tổng quan', … } as const`, chia khoá theo vùng (`chung.*`, `nav.*`, `dn.*`, `tk.*` menu tài khoản, `viec.*`, `test.*`, `diem.*`, `hv.*`, `lop.*`, `case.*`, `pa.*`, `yt.*`, `tb.*`, `loi.*`).
  Mỗi đợt **thêm một file vùng** (`vi/a.ts`, `vi/b.ts`…) gộp ở `vi.ts` để bốn PR nối tiếp không xung đột một file.
- `en.ts`: `export const EN: { [K in keyof typeof VI]: string | ((b: Bien) => string) }` → **tsc báo lỗi nếu thiếu khoá**. Hàm chỉ cho số ít / nhiều.
- `index.ts`: `t(khoa, bien?)` thay `{ten}`; `ngonNgu()`; `NGON_NGU_KHOA = 'pisa-ngon-ngu'` (cạnh `CHE_DO_KHOA = 'pisa-giao-dien'` `shared/domain/mauNghia.ts:77`).
  Ngôn ngữ đọc **một lần lúc nạp mô-đun** từ `globalThis.localStorage` (try/catch; máy chủ không có → `'vi'`). Máy chủ luôn sinh chữ Việt.
- Hằng nhãn `shared/domain` (`ATTEMPT_KIND_LABEL`, `TAB_TONG_QUAN_LABEL`, `TONE_TRANG_THAI`/nhãn trạng thái, nhãn kết quả PA, nhóm vi phạm…) đổi **giá trị** sang `t('…')`, **giữ tên hằng / hàm**.
  Hàm ghép chữ (`hoSoHocVien.ts`, `hanhTrinh.ts`, `display.ts`, `lichMt.ts`, `hocVienLop.ts`, `cuoiKhoa.ts`, `thongBaoVang.ts`…) ghép bằng `t('khoa', { biến })`, không cộng chuỗi.

**2. Đổi ngôn ngữ = lưu + tải lại trang** (hằng tính lúc nạp mô-đun → tải lại là đúng và đơn giản nhất).
- `index.html:9` (cạnh script giao diện): đặt `<html lang>` theo `localStorage` trước khi vẽ.
- Bấm VI | EN: panel đang sửa dở (`KhungPanel` `daSua`) → hỏi như nút Đóng; rồi `PATCH /me/profile { ngonNgu }` (đã đăng nhập) + `localStorage` + `location.reload()`.
- `lib/session.tsx:61,84` sau khi tải phiên (`GET /demo/session`): `session.ngonNgu` có và khác máy → ghi máy + tải lại **một lần** (cờ `sessionStorage` chặn vòng lặp); `null` → gửi lựa chọn của máy lên tài khoản.

**3. Lưu ở máy chủ:** `server/src/migrate/prEn.ts` (mẫu `prLuiA2.ts`: `coCot` + `ALTER TABLE … ADD COLUMN`, chạy lặp được), gọi sau `migratePrTk` ở `server/src/migrate.ts:277`:
`users.ngon_ngu TEXT` (NULL = chưa chọn), `notifications.khoa TEXT`, `notifications.bien TEXT` (JSON). Cùng cột cuối `schema.sql`.
Phiên: **`GET /demo/session`** (`routes/index.ts:133-…`, không phải `/session`) trả `ngonNgu`. `PATCH /me/profile` (`routes/index.ts:2253` → `accounts.ts:387 updateProfile`) nhận `ngonNgu` (khác `'vi'`/`'en'` → 400).

**4. Mã lỗi:** `shared/i18n/loi.ts`: `export const LOI = { 'pa.khongPhuTrach': { vi: '…', en: '…' }, … }`.
- **Tên trường là `khoa`, KHÔNG phải `ma`**: 500 đã dùng `details.ma` cho mã ngẫu nhiên (`app.ts:150-155`) — trùng tên sẽ lẫn.
- `util.ts:3-8`: `HttpError` thêm `khoa?`, `bien?`; hàm mới `loi(status, khoa, bien?)` lấy câu Việt từ `LOI[khoa].vi`. `badRequest/forbidden/notFound/conflict` cũ **giữ**.
- `app.ts:130-156 traLoiLoi`: trả `{ error, khoa, bien, details }`; câu chung có khoá: 400 JSON hỏng `:137`, 413 `:141`, 409 `:147`, 500 `:153` (biến `{ma}`), 404 endpoint.
- Web `lib/api.ts:3-5, 57, 66`: `ApiError` giữ `khoa`, `bien`; mất mạng → `chung.matKetNoi`. Hàm `chuLoi(e)`: EN + có `LOI[khoa]` → câu EN; còn lại `e.message`.
  Thay chỗ in `e.message` ra màn **trong phạm vi đợt** + `Toast` / `loiForm` dùng chung.
- **Chỉ mã hoá câu GV gặp bằng thao tác thật** (quyền, khung giờ chấm, trạng thái, trùng, giới hạn). Câu kiểm kiểu (`kiemKieuO`, `chuTuDo`) giữ Việt.

**5. Chữ máy chủ sinh ra cho màn GV** (dòng việc, nhóm việc, Tổng quan, thông báo): giữ chữ Việt **và thêm `khoa` + `bien`** (biến là dữ liệu thô: mã kỹ năng, số, tuần, tên).
Web `dich(row)` → EN + có khoá thì `t(khoa, bien)`, không thì chữ Việt. `notify()` (`platform/audit.ts:48-60`, 35 chỗ gọi) nhận `khoa`, `bien` → hai cột mới; thông báo cũ không có khoá → Việt, bọc `lang="vi"`.

**6. Không dịch (để Việt):** màn QL / Quản trị; nhật ký / lịch sử đã lưu chữ trong DB (`student_events.title`…) — khối `lang="vi"`; `DemoBar`; Excel xuất; sổ tay (PR-SOTAY). Ghi danh sách vào mô tả PR.

**7. Ngày và số:** `dd/mm`, `W3 SEP` giữ; thứ `T2…CN` → `Mon…Sun` qua `t()` (`shared/domain/hienThiNgay.ts`, `ui/ngayNghiepVu.ts`). `ONgay` giữ dạng gõ `dd/mm/yyyy`; nhãn nút lịch dịch.

**Tech Stack:** React + Tailwind, `shared/`; phép kiểm `server/src/tests/prEn.tests.ts` (gọi cuối `run.ts`, mẫu `prHk2.tests.ts`); `scripts/do-khung.mjs` thêm cờ EN; `scripts/quet-chu.mjs` (đếm / quét chữ).

---

## Global Constraints

- **Giao diện giữ** (Be Vietnam Pro, bảng màu, bố cục, cỡ chữ, hai họ chip HK2). Chỉ đổi chữ + nút VI | EN. Không thêm màn, không thêm thư viện.
- **Chữ EN ngắn bằng hoặc hơn chữ Việt** ở nút / nhãn / đầu cột / chip; dài thì rút theo bảng thuật ngữ, **không thu cỡ chữ, không thêm `truncate`**.
- Chữ người dùng gõ, tên người, mã lớp, lý do QL ghi **giữ nguyên**. **Bản Việt không đổi một chữ** (so ảnh VI trước/sau).
- Phân quyền, kiểm dữ liệu, xử lý lỗi **không đổi** — chỉ thêm khoá vào câu.
- Turso: không tham số đặt tên, ≤ 900 tham số, `UNION` ≤ 20 vế. **Đường ghi mới (PATCH ngôn ngữ) ≤ 200 câu SQL** (thực tế 1–2 câu) — có trần ở `server/src/tests/tocDoDuong.ts` nếu thêm route.
- Không đụng Turso / Netlify / DB bản chính. Không deploy.
- `npm run check` (~1,3 GB): **song song tối đa 3 lần trên máy** (CLAUDE.md 07/10); OOM / exit 127 thì chạy lại từng bước.
- Cổng riêng, không 4000/5173: EN-a `PORT=4561 WEB_PORT=5561`, EN-b `4562/5562`, EN-c `4563/5563`, EN-d `4564/5564`. **Không dùng `preview_start`** — chạy API + Vite bằng lệnh nền, chụp bằng Playwright.

## Phạm vi — số chữ thật (Task 0, đếm 07/10 trên `main` 90fc7bcd)

Đếm bằng `node scripts/quet-chu.mjs` (AST TypeScript: chuỗi, template, chữ JSX, thuộc tính hiện ra; bỏ chú thích, SQL, `tests/`, `seed/`, `migrate/`, `DemoBar`).
"Khác nhau" = số chữ sau gộp lặp (≈ số khoá). "Có biến" = template / chữ có `{…}` (phải thành khoá có biến).

| Nhóm màn | Chuỗi web + shared | Khác nhau | Có biến | Máy chủ (chữ hiện) | File nhiều chữ nhất |
|---|---:|---:|---:|---:|---|
| **A** Đăng nhập · thanh trên · menu Tài khoản · khung chung (`App`, `lib/*`, `ui/*`, `Header`, `WelcomePage`, `ProfilePage`) | 504 | 411 | 60 | — | WelcomePage 86, `people.ts` 51, ProfilePage 32, BangChung 31, Header 30, PeoplePicker 26, `oNgay.ts` 25 |
| **B** Tổng quan GV · Công việc của tôi · Yêu cầu của tôi · chuông | 272 | 233 | 53 | 203 (`mywork.ts` 181, `tongQuan.ts` 21) + `notify` 70 | TheYeuCau 51, `yeuCauDuyet.ts` 37, `tongQuan.ts` 33, LopToiDay 28, ViecCuaToi 28 |
| **C** Lịch Test · Điểm theo lớp · nhập điểm · hồ sơ Mock (xem) | 758 | 595 | 222 | — | MockDetailPage 132, ScoreEntry 132, LuoiFT 41, LuoiThuong 36, `thaoTacMt.ts` 35, DongThoiGianLuot 32, KhoiNo 30 |
| **D** Học viên & Lớp · hồ sơ lớp · hồ sơ HV (xem) | 1 050 | 753 | 294 | 62 (`viecHocVien` 38, `standing` 12, `profile` 7, `hanhTrinh` 5) | `hoSoHocVien.ts` 86, `display.ts` 69, `hocVienLop.ts` 66, StudentDetailPage 62, `hanhTrinh.ts` 55, HanhTrinh 53 |
| **E** Case – PA | 673 | 486 | 108 | 13 (`cases/signals.ts`) | `cases.ts` 149, QuickReport 97, SkillBoard 84, CapNhatTuan 81, ThaoTacCase 71, CasePanel 67 |
| **F** Ghi vi phạm · Ý thức (phần GV) | 369 | 286 | 79 | — | CaseSosControls 55, RecordViolationPanel 54, ClassYThucCard 50, StudentYThucSection 48, `yThuc.ts` 41 |
| **Cộng màn GV** | **3 626** | ≈ 2 750 | 816 | **348** | |
| **G** Câu lỗi máy chủ trên đường GV | — | 417 | — | 504 chỗ | `cases.ts` 121, `routes/index.ts` 44, `absence.ts` 42, `attempts.ts` 40, `accounts.ts` 38, `sosAuto.ts` 34, `skillSchedule.ts` 32, `regular.ts` 29, `duyet/yeuCau.ts` 25, `phoiHop.ts` 18, `violations.ts` 17, `cuoiKhoa.ts` 16, `attachments.ts` 16, `boTro.ts` 10, `thiThat.ts` 7 |

Ngoài phạm vi (QL / Quản trị, giữ Việt): **2 855** chuỗi web + shared. Toàn repo: 8 775 (web 4 760, shared 1 721, server 2 294).
**Mã hoá lỗi:** chỉ câu GV gặp được — ước **~150–200 / 417** câu khác nhau.

Danh sách file mỗi nhóm = danh sách trong từng đợt dưới đây (giống bản 1, đã kiểm còn đủ file sau HK2; thêm `cham/thongBaoVang.ts` mới của HK2).
**Task 0 kiểm vai:** nút mở panel nào trong danh sách QL (`StudentPlanPanel`, `LoTrinhTiepPanel`, `HopThaoTacMt`, `TransitionPanel`, `ChuyenLopPanel`…) **hiện cho vai 7 / 9** thì panel đó vào phạm vi đợt chứa màn đó (ghi vào PR).
Tổng quan GV chỉ là `ViecCuaToi` + `YeuCauCuaToi` + `LopToiDay` (`OverviewPage.tsx:61-65`); `KhoiCanXuLy`, `MetricTiles`, `BranchPulse`, `Highlights` là của QL — giữ Việt.

## Bốn đợt (theo số chữ thật — khác ví dụ ban đầu)

Ví dụ ban đầu xếp Lịch Test + nhập điểm cùng hồ sơ (≈ 1 870 chuỗi một đợt — quá một ngày). Chia lại cho mỗi đợt ≈ 500–1 300 chuỗi:

| Đợt | Phạm vi | Chuỗi | Lỗi máy chủ mã hoá | Ước lượng |
|---|---|---:|---|---|
| **EN-a** Nền | Từ điển + `t()`, migrate, lưu theo tài khoản, nút VI \| EN (đăng nhập + thanh trên + menu Tài khoản), mã lỗi hạ tầng, phép kiểm khoá, cờ EN cho do-khung; dịch nhóm **A** (gồm **Header / chuông phần khung** — vì nút ngôn ngữ nằm ở đó) | 504 | câu chung `app.ts`, `auth.ts`, `accounts.ts` (đăng nhập, hồ sơ cá nhân) | ~1 ngày |
| **EN-b** Việc + Test | Nhóm **B** (Tổng quan GV, Công việc, Yêu cầu của tôi, nội dung chuông + `notify`) và **C** (Lịch Test, Điểm theo lớp, nhập điểm, hồ sơ Mock) | 1 030 + máy chủ 273 | `absence`, `attempts`, `skillSchedule`, `regular`, `cuoiKhoa`, `diemTheoLuot`, `canCham`, `duyet/yeuCau` | ~1 ngày |
| **EN-c** Hồ sơ | Nhóm **D** (Học viên & Lớp, hồ sơ lớp, hồ sơ HV: Học thuật, Hành trình, Tổng kết, Các lộ trình) | 1 050 + máy chủ 62 | `loTrinh/thiThat`, câu GV ở `routes/index.ts` phần học viên | ~1 ngày |
| **EN-d** Case + Ý thức | Nhóm **E** + **F** (Case – PA, Ghi vi phạm, Ý thức phần GV) + **quét toàn bộ** + nghiệm thu cuối | 1 042 + máy chủ 13 | `cases`, `boTro`, `nguoiThucHien`, `sosAuto`, `violations`, `phoiHop`, `attachments` | ~1 ngày |

## Tôi đã tự quyết (chủ sản phẩm đổi được — kèm rủi ro)

| # | Quyết | Vì sao | Rủi ro · cách chặn |
|---|---|---|---|
| E1 | Đổi ngôn ngữ **tải lại trang** | Hằng nhãn tính lúc nạp; không cần context React, không sót nhãn | Mất chữ gõ dở → hỏi trước nếu panel `daSua`; ô lưới tự lưu từng ô |
| E2 | Từ điển **trong `shared/`**, một file vùng mỗi đợt | tsc chặn thiếu khoá; bốn PR nối tiếp không đè nhau | — |
| E3 | Máy chủ **gửi `khoa` + `bien` + chữ Việt**; trường tên `khoa` (không `ma`) | Đúng chốt; `details.ma` 500 đã có nghĩa khác (`app.ts:150-155`) | Hai nơi khớp biến → E-VIEC / E-LOI kiểm mọi khoá có EN, biến đủ |
| E4 | Thông báo cũ / nhật ký đã lưu **giữ Việt** (`lang="vi"`) | Không dịch ngược dữ liệu cũ | Vài dòng Việt ở chuông tuần đầu |
| E5 | `dd/mm` giữ, thứ đổi `Mon` | GV sống ở VN quen dd/mm | — |
| E6 | Điện thoại: hàng Language **ngay trên hàng Display** trong menu Tài khoản (không phải "đầu menu" như bản 1) | Đúng chốt "cạnh Sáng/Tối"; mã HK2 đặt Display ở đầu khối lối phụ (`Header.tsx:313`) | GV phải mở menu một lần; màn đăng nhập có nút to |
| E7 | QL bật EN thì màn QL vẫn Việt, khung chung Anh | Đúng phạm vi | Lẫn hai tiếng ở màn QL — ghi vào PR |
| E8 | Hồ sơ cá nhân (`ProfilePage`, 32 chuỗi) **dịch ở EN-a** | GV mở từ menu Tài khoản | Muốn bỏ thì nói (mặc định dịch) |
| E9 | Menu Tài khoản: chip `GVCN MB FOU 12` → EN chỉ `MB FOU 12` dưới đầu mục "Core teacher" | Đầu mục đã nói vai; chip nowrap, chữ ngắn | Bản Việt giữ nguyên chip cũ |
| E10 | **Không thêm tài khoản GVNN demo**; nghiệm thu dùng vai 7 (GVCN) và 9 (GVBM) bật EN | Seed không có GVNN (`server/src/seed/data.ts`); thêm tài khoản = đổi seed, ảnh sổ tay | Xem Q1 |

## Phép kiểm (đỏ trước, xanh sau)

- **E-KHOA** (tsc + chạy): mọi khoá `VI` có ở `EN`, không rỗng; cùng tập `{biến}` (hàm EN gọi thử với biến mẫu không ném, không còn `{`); EN ≠ VI trừ danh sách giữ nguyên (mã, tên chương trình, Mock Test, Band, OVR, SOS n, Report n, WL n, PISA Tracking, Progress Test, Final Test).
- **E-LOI** (DB test): `loi(403,'pa.khongPhuTrach')` → JSON `{ error: <vi>, khoa }`; mọi `khoa` dùng trong `server/src` có trong `LOI` (quét nguồn); 500 trả `khoa: 'chung.coLoi'`, `bien.ma` = `details.ma`.
- **E-NN** (DB test): `PATCH /me/profile { ngonNgu:'en' }` lưu; `GET /demo/session` trả `'en'`; `'fr'` → 400; chỉ sửa chính mình; migrate chạy hai lần không lỗi.
- **E-TB** (DB test, EN-b): `notify({khoa,bien})` lưu hai cột; `GET /notifications` trả `khoa`, `bien`; dòng cũ `khoa = null`.
- **E-VIEC** (DB test, EN-b): mọi dòng `/my-work` và Tổng quan GV có `khoa` thuộc `VI`; `t(khoa, bien)` không còn `{`.
- **E-NGUON** (quét nguồn, mỗi đợt thêm file): dùng lại hàm AST của `scripts/quet-chu.mjs` (tách `quetFile()` ra để `prEn.tests.ts` gọi) — file trong phạm vi đợt **không còn chữ Việt** ngoài `t()` / `LOI` / chú thích / danh sách cho phép (chuỗi so sánh dữ liệu).
- **E-QUET** (Playwright, chạy tay): `KHUNG_NGON_NGU=en node scripts/do-khung.mjs` — loại lỗi mới **(e) chữ Việt còn sót** trên màn GV, bỏ qua `[lang=vi]` và chữ dữ liệu (tên HV / GV, mã lớp, tên Case / PA, mô tả, lý do — đọc từ DB demo bằng `@libsql/client`). Chỉ chạy (e) ở kịch bản vai 7, 9.
- **E-KHUNG**: cùng lệnh → (a)–(d) **0 lỗi** ở 375 + 1440, sáng + tối, EN; VI vẫn như mốc.
- **E-NHO** (kịch bản `ngon-ngu` của do-khung): chưa đăng nhập bấm English → tải lại vẫn EN; đăng nhập vai chưa chọn → tài khoản lưu `en`; context mới (localStorage trống) đăng nhập cùng vai → tự EN; bấm VI ở thanh trên → tài khoản `vi`.

**Lưu ý do-khung ở chế độ EN** (đọc `scripts/do-khung.mjs`):
- Kịch bản bấm nút theo **chữ Việt** (`:46` "Ghi kết quả", "Tiến bộ một phần"; `:48` `+ Case`; `:49` "Ghi vi phạm"; `:60` toolbar "Việc cho học viên đã chọn"…) → thêm cặp regex hai tiếng (`/Ghi kết quả|Record result/`), không đổi luật đo.
- Ngôn ngữ nhớ **theo tài khoản** → sau `POST /api/demo/session` (`:162-166`) gọi `PATCH /api/me/profile { ngonNgu }` theo chế độ chạy, và `addInitScript` đặt `pisa-ngon-ngu` cạnh `pisa-giao-dien` (`:155`) — chạy VI sau EN không bị kẹt EN.

---

### Task 0 (mọi đợt): Chuẩn bị

- [ ] Đợt trước đã merge (`gh pr list --state merged --search "PR-EN"`); EN-a: HK2 #235 đã merge ✅. Chưa thì DỪNG.
- [ ] Nhánh `pr-en-<a|b|c|d>-…` từ `origin/main` mới nhất; worktree `.claude/worktrees/<nhánh>`; cổng của đợt (Global Constraints).
- [ ] `node scripts/quet-chu.mjs > <scratchpad>/chu.jsonl` → đếm lại nhóm của đợt; số khác bảng > 10 % thì ghi vào PR.
- [ ] Bảng thuật ngữ là nguồn chữ EN; chữ chưa có → chọn theo luật đầu bảng, thêm dòng vào bảng (cùng PR).
- [ ] Mốc: `node scripts/do-khung.mjs` (VI) → lưu kết quả "trước".

### Đợt EN-a — Nền (PR 1)

**File:** `shared/i18n/{vi,en,index,loi}.ts` + `vi/a.ts`, `en/a.ts` (mới); `shared/domain/{trangThai,hienThiNgay,loiForm,oNgay,chonNgay,dieuHuong,khac,people,taiKhoan}.ts`;
`web/src/{App.tsx,lib/api.ts,lib/format.ts,lib/session.tsx}`, `web/src/ui/*` (25 file có chữ, gồm `CongTacGiaoDien`, `KhungPanel`, `ONgay`, `LichNho`, `Toast`, `PeoplePicker`, `BangChung`, `TepCho`, `Filters`, `SoLieu`, `ui.tsx`), `ui/NutNgonNgu.tsx` (mới),
`modules/platform/{WelcomePage,Header,ProfilePage}.tsx`, `index.html`; máy chủ `util.ts`, `app.ts`, `auth.ts`, `platform/accounts.ts`, `routes/index.ts` (session, `/me/profile`), `schema.sql`, `migrate.ts`, `migrate/prEn.ts` (mới);
`server/src/tests/{prEn.tests.ts (mới),run.ts}`; `scripts/do-khung.mjs`, `scripts/quet-chu.mjs` (tách `quetFile`).

**Task a1 — Từ điển, `t()`, lưu ngôn ngữ**
- [ ] **Đỏ:** `prEn.tests.ts` E-KHOA (vài khoá mẫu), E-NN. `npm run build:server && node dist-server/server/src/tests/run.js` → đỏ. Commit `test(en): từ điển hai tiếng, lưu ngôn ngữ (đỏ)`.
- [ ] `shared/i18n/*` (Architecture 1); `migrate/prEn.ts` + `schema.sql`; `GET /demo/session` trả `ngonNgu`; `updateProfile` nhận `ngonNgu`.
- [ ] `index.html` `<html lang>`; `lib/session.tsx` đồng bộ máy ↔ tài khoản (Architecture 2), tải lại tối đa một lần.
- [ ] Xanh E-KHOA, E-NN. Commit `feat(en): từ điển vi/en, t(), nhớ ngôn ngữ theo tài khoản + máy`.

**Task a2 — Nút ngôn ngữ** (`/impeccable clarify` + `/impeccable adapt`, đúng mockup mục 1–2)
- [ ] **Đỏ** (quét nguồn): `WelcomePage.tsx` có nhóm hai nút `aria-pressed` "Tiếng Việt" (`lang="vi"`) / "English" **trước** hàng tab (`:151`), cao ≥ 56 px;
  `Header.tsx`: máy tính `NutNgonNgu` ngay sau `<CongTacGiaoDien />` (`:265`); điện thoại `NutNgonNgu kieu="menu"` ngay **trước** `<CongTacGiaoDien kieu="menu" />` (`:313`). Thanh 23C không thêm nút.
- [ ] `ui/NutNgonNgu.tsx`: một component, ba kiểu — `nut` (hai nút `btn-sm`, cao bằng ◐, chữ 11,5 px), `menu` (cùng khung hàng của `CongTacGiaoDien kieu="menu"`: min-h 44, nút min-w 64), `to` (đăng nhập).
- [ ] Xanh. Ảnh 1440 / 375 sáng / tối so mockup mục 1–2. Commit `feat(en): nút VI | EN ở đăng nhập, thanh trên, menu Tài khoản`.

**Task a3 — Mã lỗi + khung chung**
- [ ] **Đỏ:** E-LOI; E-NGUON cho file nhóm A.
- [ ] `util.ts` `HttpError.khoa/bien`, `loi()`; `app.ts` câu chung có khoá; `lib/api.ts` `ApiError.khoa/bien` + `chuLoi(e)`; `Toast`, `loiForm` dùng `chuLoi`. Mã hoá lỗi đăng nhập / hồ sơ cá nhân GV gặp (`auth.ts`, `accounts.ts`).
- [ ] Dịch nhóm A theo bảng thuật ngữ (menu Tài khoản đúng mục "Chữ mới của HK2"). `/impeccable harden`: route chưa mã hoá vẫn hiện Việt, không vỡ.
- [ ] Thêm cờ `KHUNG_NGON_NGU`, loại (e), kịch bản `ngon-ngu`, `dang-nhap`, `menu-tk` (375) vào `scripts/do-khung.mjs` (E-QUET, E-NHO; lưu ý ở mục Phép kiểm). Commit `test(en): do-khung chế độ EN`.
- [ ] Xanh. do-khung EN kịch bản `dang-nhap`, `menu-tk`, `ho-so-ca-nhan`, `ngon-ngu` → 0 lỗi. Commit `feat(en): mã lỗi máy chủ, khung chung tiếng Anh`.

**Nghiệm thu EN-a:** ảnh 375 + 1440, sáng + tối: màn đăng nhập (hai nút), thanh trên máy tính (VI | EN cạnh ◐), menu Tài khoản điện thoại (Language trên Display), Hồ sơ cá nhân —
vai GVCN (7) + GVBM (9) ở EN; QL (2) ở EN thấy khung Anh, màn QL Việt. E-NHO đủ bốn bước. Bản VI không đổi chữ.

### Đợt EN-b — Việc + Test (PR 2)

**File:** web `worklist/{OverviewPage,ViecCuaToi,WorkList,NhomViec,LopToiDay,SignalList}.tsx`, `congViec/{CongViecPage,HoTroHocVienTab,ChonPhuTrach}.tsx`, `duyet/{YeuCauCuaToi,TheYeuCau}.tsx`, `ui/ViecTiep.tsx`,
`test/{TestPage,LichTestTab,TabDiemLop}.tsx`, `test/lichTest/{DaiSo,HangLop,KhoiNo,LuoiNhung}.tsx`, `cham/{ChamDiemPage,DiemTheoLop,GvCham,LuoiChamLop,LuoiFT,LuoiThuong,MotKyNang,NganLichSuBai}.tsx`, `cham/thongBaoVang.ts`,
`fasttrack/{ScoreEntry,MockDetailPage,NhanXet,ODiemLon,DongThoiGianLuot}.tsx`, phần nội dung chuông ở `Header.tsx`;
shared `{worklist,congViec,tongQuan,sapToi,yeuCauDuyet,chamDiem,fasttrack,lopThuong,oMt,lichMt,diemTheoLuot,normal,thaoTacMt,mt0,nhanXet}.ts`;
máy chủ `worklist/{mywork (GROUP_META :136, tieuDe 24 chỗ, nhóm :1252-1253),tongQuan (:115),nhacViec}.ts`, `platform/audit.ts` `notify` + 35 chỗ gọi, lỗi `fasttrack/{absence,attempts,skillSchedule}.ts`, `normal/{regular,cuoiKhoa}.ts`, `cham/{diemTheoLuot,canCham}.ts`, `duyet/yeuCau.ts`.

**Task b1 — Máy chủ gửi khoá** — ✅ 14/10 làm KHÁC (session EN-b): máy chủ KHÔNG đổi; web dịch chữ máy chủ theo MẪU (`dichChu`, khoá có `{biến}` của từ điển, tách đoạn " · ") → không cột `notifications.khoa/bien`, không migrate, thông báo đã lưu cũng dịch. Phép kiểm E-MAU, E-VIEC, E-TB đo kết quả thật.
- [x] **Đỏ:** E-VIEC, E-TB; E-NGUON thêm file EN-b.
- [x] `mywork.ts` mọi `tieuDe` / `actionLabel` / nhóm thêm `khoa` + `bien`; `tongQuan.ts:115` "quá hạn a–b ngày" → `{a,b}`; `notify()` nhận `khoa`, `bien` (35 chỗ gọi). Chữ Việt giữ nguyên từng chữ.
- [x] Mã hoá lỗi GV gặp ở các route nhập điểm / vắng / dời lịch / chấm / yêu cầu (bản Anh theo chính câu Việt / mẫu).

**Task b2 — Web**
- [x] Màn B + C dùng `t()` / `dich(row)`; `thongBaoVang.ts` một khoá có biến cho mọi đường ghi vắng; gỡ vắng (`LuoiThuong.tsx:242-244`, `ScoreEntry.tsx:140`) cùng khoá.
- [x] `/impeccable clarify` (chữ EN ngắn), `/impeccable adapt` (375: lưới nhập điểm, thẻ việc, KPI Lịch Test, chip nowrap). Đúng mockup mục 3–5, 8.
- [x] Xanh. do-khung EN 0 lỗi (a)–(e): `tong-quan-gv`, `cv-gv`, `gvbm`, `gvbm-test`, `test-lichTest`, `test-diem-lop`, `nhap-diem`, `bang-diem-thuong`, `mock`, chuông. Commit theo màn.

**Nghiệm thu EN-b:** ảnh 375 + 1440, sáng + tối: Home GV, My tasks, chuông mở, Test schedule, Scores by class, Enter scores (máy tính + điện thoại, thông báo Absent) — vai 7, 9 ở EN; vai 2 VI không đổi.

### Đợt EN-c — Hồ sơ (PR 3)

**File:** web `students/{StudentsPage,StudentDetailPage,DauHoSo,HanhTrinh,NganCase,NganTongKet,CacLoTrinh,KetLuanKhoa,HangLichMt,ChuongLop,ClassRoster,BangHocVienLop,MissingBadge,KetQuaThiThatPanel}.tsx`,
`classes/{ClassOverviewPage,DauTrangLop,TabHocVienLop,BangDiemLopThuong,BangCanHoTro,ClassIssueBoard,CanhBaoYThuc,PhanTichLopTab,TabTongKetLop,DaiChuyenLop}.tsx`;
shared `{display,hoSoHocVien,hanhTrinh,hocVienLop,students,cuoiKhoa,tongKetLoTrinh,duongHoSo,bangChung}.ts`; máy chủ `students/{viecHocVien,profile,standing,hanhTrinh}.ts`, lỗi `loTrinh/thiThat.ts` + câu GV gặp ở `routes/index.ts` phần học viên.

**Task c1**
- [ ] **Đỏ:** E-NGUON file EN-c; DB test: chữ trả về của `viecHocVien.ts`, `standing.ts`, `profile.ts` có `khoa`.
- [ ] Shared hàm ghép chữ → `t()` có biến (giữ tên hàm). Hành trình: sự kiện đã lưu chữ trong DB → `lang="vi"`. "Kết luận khoá" → "Course outcome".
- [ ] `/impeccable clarify` + `/impeccable adapt` (375 hồ sơ HV: hàng tab "Academic · Conduct & SOS · Journey" không cắt; chip "Missing n" nowrap).
- [ ] Xanh. do-khung EN 0 lỗi: `hvl-gvcn`, `lop-ft`, `lop-ft-phan-tich`, `hv-hoc-thuat`, `hv-hanh-trinh` (vai 7).

**Nghiệm thu EN-c:** ảnh 375 + 1440, sáng + tối: Students & Classes, hồ sơ lớp FT + lớp thường (vai 7), hồ sơ HV ba tab, Tổng kết — vai 7, 9 ở EN.

### Đợt EN-d — Case + Ý thức + quét toàn bộ (PR 4)

**File:** web `cases/{CapNhatTuan,CaseBoardPage,CasePanel,ChiTietKyNang,DongXinYKien,MenuXoaPa,NeedsEvaluation,NopKeHoachPanel,QuickReport,SkillBoard,ThaoTacCase,TheKyNang}.tsx`,
`yThuc/{RecordViolationPanel,NhanViPham,StudentYThucSection,ClassYThucCard,ChiTietViPham,DaThucHienPanel,DeleteViolationConfirm,ThangYThuc,PhoiHopSosSection,XemXuLyPanel,CaseSosControls}.tsx`, `yThuc/kieu.ts`;
shared `{cases,sosV4,sos,nguoiThucHien,yThuc,yThucGon}.ts`; máy chủ `cases/signals.ts`, lỗi `cases/{cases,boTro,nguoiThucHien,sosAuto}.ts`, `yThuc/{violations,phoiHop}.ts`, `platform/attachments.ts`.

**Task d1**
- [ ] **Đỏ:** E-NGUON file EN-d; E-LOI mở rộng (khoá lỗi của các file trên — câu GV gặp được).
- [ ] Shared nhãn kết quả / quyết định / loại PA / nguồn Case / sự kiện Case, `gapText` (`SkillBoard.tsx:650-653`), nhóm vi phạm → `t()`.
- [ ] Panel Ghi kết quả PA, Tạo Case, Ghi vi phạm đúng mockup mục 6–7: bốn nút kết quả / năm nút nhóm **không cắt ở 375** (đo (d)).
- [ ] `/impeccable clarify` + `/impeccable adapt` + `/impeccable harden` (lỗi quyền PA, khung ghi vi phạm).
- [ ] Xanh. do-khung EN 0 lỗi: `panel-pa`, `panel-tao-case`, `panel-vi-pham`, `hv-y-thuc`, `lop-ft-y-thuc`.

**Task d2 — Nghiệm thu cuối (toàn bộ EN)**
- [ ] `KHUNG_NGON_NGU=en KHUNG_CHUP=1 node scripts/do-khung.mjs` → **0 lỗi (a)–(e)**, 375 + 1440, sáng + tối; ảnh vào `thiet-ke/anh/en/`.
- [ ] `node scripts/do-khung.mjs` (VI) → không thêm lỗi so mốc. Ảnh VI trước/sau ba màn GV giống nhau.
- [ ] `node scripts/quet-chu.mjs` → không còn chuỗi Việt trong file phạm vi A–F ngoài `vi/*.ts`, `loi.ts`, danh sách cho phép.
- [ ] E-NHO bấm đủ bốn bước. `/impeccable audit` các màn GV ở EN.
- [ ] `CODE_MAP.md` (thêm `shared/i18n/`), `thiet-ke/HE_GIAO_DIEN.md` §chữ (một dòng), một dòng mục 11 `plan.md`.

**Nghiệm thu EN-d:** ảnh 375 + 1440, sáng + tối: Case – PA (ngăn Case, Ghi kết quả PA, Tạo Case), Log incident, tab Conduct & SOS — vai 7, 9 ở EN; cả bộ ảnh EN của bốn đợt cho chủ sản phẩm xem.

---

## Nghiệm thu chung

1. Màn đăng nhập có hai nút to "Tiếng Việt | English" ngay trên khung; bấm English → cả màn đổi, tải lại vẫn English.
2. Máy tính: "VI | EN" chữ nhỏ ngay sau ◐; điện thoại: hàng "Language VI | EN" ngay trên "Display" trong menu Tài khoản. Chọn một lần → mọi máy của tài khoản đó theo.
3. Vai 7 và 9 ở EN: Home, My tasks, chuông, Test schedule, Scores by class, Enter scores, hồ sơ lớp, hồ sơ HV, Case – PA, Log incident **không còn chữ Việt** ngoài dữ liệu người gõ / tên / mã / thông báo cũ.
4. Lỗi máy chủ GV gặp được hiện tiếng Anh; câu chưa có khoá hiện tiếng Việt, không vỡ màn.
5. do-khung EN 0 lỗi ở 375 + 1440, sáng + tối; bản VI không thêm lỗi, không đổi chữ. 6. Màn QL / Quản trị giữ tiếng Việt. 7. `prEn.tests.ts` xanh trong `npm run check`.

## File chồng với PR khác

| PR | File chung | Cách tránh |
|---|---|---|
| Bốn đợt EN với nhau | `shared/i18n/{vi,en,loi}.ts`, `prEn.tests.ts`, `do-khung.mjs` | Mỗi đợt một file vùng `vi/<đợt>.ts`; đợt sau từ `main` đã merge đợt trước; xung đột ở `index`/`run.ts` giữ cả hai |
| PR-SOTAY (sau EN) | ảnh màn EN | SOTAY chụp từ `main` sau EN-d |
| PR-NC (sau deploy) | `phanTich/*` | Ngoài phạm vi EN |

## Prompt — session code (dán nguyên khối; mỗi đợt một phiên, đợt sau chỉ chạy khi đợt trước đã merge)

**PR-EN-a · Nền**
```
Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp, ghi model thật vào mô tả PR; Fable hoặc model khác thì dừng (kể cả subagent).
/ponytail lite
Làm PR-EN đợt a (Task 0 + Task a1–a3) theo docs/superpowers/plans/2026-10-07-pr-en-tieng-anh.md + prompt chung plan.md mục 9.0. Đầu phiên nói model đang chạy.
Nhánh pr-en-a-nen từ origin/main mới nhất; worktree .claude/worktrees/pr-en-a-nen. PORT=4561 WEB_PORT=5561 (không 4000/5173). Không dùng preview_start: API + Vite chạy nền, chụp bằng Playwright.
Mockup đã duyệt: thiet-ke/mockup-en-2026-10-07.html mục 1–2 (planning tự duyệt). Chữ EN theo thiet-ke/THUAT_NGU_EN_2026-10-07.md (Normal class, Core teacher).
Luật: chỉ đổi chữ + nút VI | EN; chữ ngắn; câu EN dài thì rút gọn, KHÔNG thu cỡ chữ, không thêm truncate. Bản Việt không đổi chữ. Không thư viện i18n.
Máy chủ gửi khoa + bien + chữ Việt (trường tên khoa, KHÔNG ma — 500 đã dùng details.ma); web dịch; chưa có khoá thì hiện Việt.
Migrate file riêng server/src/migrate/prEn.ts (chạy lặp được). Turso: không tham số đặt tên, ≤ 900 tham số; đường ghi mới ≤ 200 câu SQL.
Phép kiểm đỏ trước: server/src/tests/prEn.tests.ts (E-KHOA, E-NN, E-LOI, E-NGUON nhóm A).
Impeccable: /impeccable clarify (chữ EN), /impeccable adapt (375), /impeccable harden (lỗi chưa mã); cuối /impeccable audit.
Đo: KHUNG_NGON_NGU=en node scripts/do-khung.mjs → 0 lỗi ở 375 + 1440, sáng + tối; bản VI không thêm lỗi.
Nghiệm thu: ảnh 375/1440 sáng/tối, vai GVCN 7 + GVBM 9 ở EN (không có tài khoản GVNN demo), QL 2 kiểm màn QL giữ Việt.
/ponytail-review. npm run check (song song tối đa 3 lần trên máy). Mở PR vào main, KHÔNG merge. Mô tả PR: model thật, file, phép kiểm, ảnh, chú thích ponytail:, danh sách giữ Việt.
```

**PR-EN-b · Việc + Test**
```
Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp, ghi model thật vào mô tả PR; Fable hoặc model khác thì dừng (kể cả subagent).
/ponytail lite
Làm PR-EN đợt b (Task 0 + Task b1–b2) theo docs/superpowers/plans/2026-10-07-pr-en-tieng-anh.md + plan.md mục 9.0. Chỉ bắt đầu khi PR EN-a đã merge. Đầu phiên nói model.
Nhánh pr-en-b-viec-test từ origin/main mới nhất; worktree .claude/worktrees/pr-en-b-viec-test. PORT=4562 WEB_PORT=5562. Không dùng preview_start.
Phạm vi: Tổng quan GV, Công việc của tôi, Yêu cầu của tôi, chuông (notify), Lịch Test, Điểm theo lớp, nhập điểm, hồ sơ Mock (xem). Mockup mục 3–5, 8.
Luật: chỉ đổi chữ; chữ ngắn; câu EN dài thì rút gọn, KHÔNG thu cỡ chữ; chip HK2 nowrap → chữ chip ≤ chữ Việt. Bản Việt không đổi chữ. Từ điển vùng mới shared/i18n/vi/b.ts, en/b.ts.
Máy chủ thêm khoa + bien cho dòng việc, nhóm việc, Tổng quan, notify (35 chỗ), lỗi GV gặp ở absence/attempts/skillSchedule/regular/cuoiKhoa/diemTheoLuot/canCham/duyet/yeuCau.
Turso: không tham số đặt tên, ≤ 900 tham số; đường ghi mới ≤ 200 câu SQL. Phép kiểm đỏ trước: E-VIEC, E-TB, E-NGUON nhóm B + C.
Impeccable: /impeccable clarify, /impeccable adapt (375 lưới nhập điểm, thẻ việc); cuối /impeccable audit.
Đo: KHUNG_NGON_NGU=en node scripts/do-khung.mjs → 0 lỗi (a)–(e), 375 + 1440, sáng + tối. Ảnh vai 7 + 9 ở EN.
/ponytail-review. npm run check (song song tối đa 3 lần trên máy). Mở PR vào main, KHÔNG merge.
```

**PR-EN-c · Hồ sơ**
```
Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp, ghi model thật vào mô tả PR; Fable hoặc model khác thì dừng (kể cả subagent).
/ponytail lite
Làm PR-EN đợt c (Task 0 + Task c1) theo docs/superpowers/plans/2026-10-07-pr-en-tieng-anh.md + plan.md mục 9.0. Chỉ bắt đầu khi PR EN-b đã merge. Đầu phiên nói model.
Nhánh pr-en-c-ho-so từ origin/main mới nhất; worktree .claude/worktrees/pr-en-c-ho-so. PORT=4563 WEB_PORT=5563. Không dùng preview_start.
Phạm vi: Học viên & Lớp, hồ sơ lớp, hồ sơ HV (Học thuật, Hành trình, Tổng kết, Các lộ trình) — xem; panel QL giữ Việt.
Luật: chỉ đổi chữ; chữ ngắn; câu EN dài thì rút gọn, KHÔNG thu cỡ chữ. Hàm ghép chữ shared → t() có biến, giữ tên hàm. Sự kiện đã lưu trong DB → lang="vi".
Turso: không tham số đặt tên, ≤ 900 tham số; đường ghi mới ≤ 200 câu SQL. Phép kiểm đỏ trước: E-NGUON nhóm D + DB test khoa của viecHocVien/standing/profile.
Impeccable: /impeccable clarify, /impeccable adapt (375 hàng tab hồ sơ HV); cuối /impeccable audit.
Đo: KHUNG_NGON_NGU=en node scripts/do-khung.mjs → 0 lỗi, 375 + 1440, sáng + tối. Ảnh vai 7 + 9 ở EN.
/ponytail-review. npm run check (song song tối đa 3 lần trên máy). Mở PR vào main, KHÔNG merge.
```

**PR-EN-d · Case + Ý thức + quét toàn bộ**
```
Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp, ghi model thật vào mô tả PR; Fable hoặc model khác thì dừng (kể cả subagent).
/ponytail lite
Làm PR-EN đợt d (Task 0 + Task d1–d2) theo docs/superpowers/plans/2026-10-07-pr-en-tieng-anh.md + plan.md mục 9.0. Chỉ bắt đầu khi PR EN-c đã merge. Đầu phiên nói model.
Nhánh pr-en-d-case-y-thuc từ origin/main mới nhất; worktree .claude/worktrees/pr-en-d-case-y-thuc. PORT=4564 WEB_PORT=5564. Không dùng preview_start.
Phạm vi: Case – PA (tạo, ghi kết quả, ngăn Case), Ghi vi phạm, Ý thức phần GV, mã lỗi cases/boTro/nguoiThucHien/sosAuto/violations/phoiHop/attachments; rồi quét toàn bộ EN.
Mockup mục 6–7: bốn nút kết quả PA, năm nút nhóm vi phạm không cắt ở 375.
Luật: chỉ đổi chữ; chữ ngắn; câu EN dài thì rút gọn, KHÔNG thu cỡ chữ. Turso: không tham số đặt tên, ≤ 900 tham số; đường ghi mới ≤ 200 câu SQL.
Phép kiểm đỏ trước: E-NGUON nhóm E + F, E-LOI mở rộng.
Impeccable: /impeccable clarify, /impeccable adapt (375 panel), /impeccable harden (lỗi quyền PA); cuối /impeccable audit toàn bộ màn GV ở EN.
Đo: KHUNG_NGON_NGU=en KHUNG_CHUP=1 node scripts/do-khung.mjs → 0 lỗi (a)–(e), 375 + 1440, sáng + tối, ảnh vào thiet-ke/anh/en/; VI không thêm lỗi; quet-chu.mjs không còn chữ Việt trong phạm vi.
/ponytail-review. npm run check (song song tối đa 3 lần trên máy). Mở PR vào main, KHÔNG merge. Cập nhật CODE_MAP.md, một dòng mục 11 plan.md.
```

## Cái bỏ qua (và khi nào thêm)

- **Dịch màn QL / Quản trị, Excel, nhật ký đã lưu:** không — thêm khi có QL nước ngoài.
- **Đổi ngôn ngữ không tải lại trang:** không (E1) — thêm khi phải giữ trạng thái màn qua lần đổi.
- **Mã hoá mọi câu lỗi (504 chỗ):** chỉ ~150–200 câu GV gặp được; câu khác hiện Việt.
- **Tài khoản GVNN demo:** không (E10) — thêm khi sổ tay cần ảnh tên nước ngoài.
- **Phép kiểm Playwright trong `npm run check`:** không (RAM) — do-khung chạy tay.
