# PR-EN · Bản tiếng Anh cho giáo viên nước ngoài — Kế hoạch

> **Chạy SAU khi PR-HK2 merge** (HK2 chạy sau KHUNG #230). HK2 đã đổi nhiều chữ Việt mà EN dịch — Task 0 đọc lại chữ trên `main` mới nhất, không dịch chữ cũ.
> **Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp; Fable hoặc model khác thì DỪNG** (kể cả subagent, CLAUDE.md 06/10).
> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (mỗi Task một subagent cùng model). Bước `- [ ]`.

**Nguồn:** `plan.md` mục 3 (06/10, 07/10) và mục 4 "PR-EN"; kế hoạch HK2 `2026-10-07-pr-hk2-badge-chu.md` (nhánh `ke-hoach-hk2`, PR #231);
thuật ngữ `thiet-ke/THUAT_NGU_EN_2026-10-07.md`; mockup `thiet-ke/mockup-en-2026-10-07.html` (**planning tự duyệt 07/10**, chủ sản phẩm xem ảnh trước khi merge).
Đọc mã `origin/main` f904d06d (07/10), chạy app cục bộ chụp màn GV hiện tại.

**Goal:** giáo viên nước ngoài dùng được toàn bộ phần việc của GV bằng tiếng Anh: Đăng nhập, thanh trên, Tổng quan GV, Lịch Test, Điểm theo lớp / nhập điểm,
hồ sơ lớp + hồ sơ HV (xem), Case – PA (tạo, ghi kết quả), Ghi vi phạm, Công việc của tôi, chuông, câu lỗi máy chủ trên các đường đó.
Màn QL / Quản trị (Kế hoạch Test, Chờ duyệt, Phân tích, Quản trị, panel quản lý HV / lớp) **giữ tiếng Việt**. Giao diện giữ nguyên — chỉ đổi chữ + thêm nút ngôn ngữ.

## Chốt của chủ sản phẩm (07/10 — không đổi)

- Nút **"VI | EN"** chữ nhỏ cạnh nút Sáng/Tối (máy tính). Điện thoại: HK2 đã đưa Sáng/Tối vào menu Tài khoản → hàng **"Language VI | EN"** đầu menu, ngay trên hàng giao diện (mockup mục 2).
- Màn đăng nhập: **hai nút to "Tiếng Việt | English" ngay trên khung đăng nhập** (mockup mục 1). Mỗi nút ghi bằng chính tiếng của nó.
- **Nhớ theo tài khoản (máy chủ) + trên máy trước khi đăng nhập.**
- **Không thêm thư viện i18n**: từ điển `vi` / `en` + `t()` dùng chung. **Máy chủ trả mã + chữ Việt, web dịch theo mã**; câu chưa có mã hiện chữ Việt, không vỡ.
- Chữ GV tự gõ giữ nguyên; `W2 OCT`, Mock Test, Band, OVR giữ. Thuật ngữ theo bảng EN (planning tự chọn, chủ sản phẩm xem trước merge).
- **Chống chữ cắt BẮT BUỘC**: `scripts/do-khung.mjs` (PR-KHUNG) chạy chế độ EN, 375 + 1440, sáng + tối, 0 lỗi. Câu EN dài thì rút, **không thu cỡ chữ**.
- Luật chung: thao tác đơn giản nhất; chữ ngắn; ô ngày = ô gõ + lịch (`ONgay`).
- "Giữa khoá / Cuối khoá" → **"Progress Test / Final Test"** đã đổi ở **cả bản Việt trong PR-HK2** (chủ sản phẩm 07/10) — EN dùng đúng hai tên này.

---

## Architecture

**1. Từ điển — `shared/i18n/`** (dùng chung web + máy chủ, không thư viện):
- `vi.ts`: `export const VI = { 'nav.tongQuan': 'Tổng quan', … } as const` — chia khoá theo vùng (`chung.*`, `nav.*`, `dn.*`, `viec.*`, `test.*`, `diem.*`, `hv.*`, `lop.*`, `case.*`, `pa.*`, `yt.*`, `tb.*`, `loi.*`).
- `en.ts`: `export const EN: { [K in keyof typeof VI]: string | ((b: Bien) => string) } = { … }` → **tsc báo lỗi nếu thiếu khoá** (phép kiểm "đủ hai tiếng" có sẵn khi build).
  Giá trị hàm chỉ dùng cho số ít / số nhiều (`n => n === 1 ? '1 day overdue' : \`${n} days overdue\``).
- `index.ts`: `t(khoa, bien?)` thay `{ten}` trong chuỗi; `ngonNgu()`; `NGON_NGU_KHOA = 'pisa-ngon-ngu'`.
  Ngôn ngữ đọc **một lần lúc nạp mô-đun** từ `globalThis.localStorage` (bọc try/catch; máy chủ không có → `'vi'`). Máy chủ luôn sinh chữ Việt.
- Hằng nhãn trong `shared/domain` (vd `TAB_TEST_LABEL`, `NHAN_TRANG_THAI`, nhãn kết quả PA, nhóm vi phạm) đổi giá trị sang `t('…')` — **giữ tên hằng / hàm** (≈ mọi chỗ gọi không đổi).
  Hàm ghép chữ (`hoSoHocVien.ts`, `hanhTrinh.ts`, `display.ts`, `lichMt.ts`, `hocVienLop.ts`, `cuoiKhoa.ts`…) ghép bằng `t('khoa', { biến })`, không cộng chuỗi.

**2. Đổi ngôn ngữ = lưu + tải lại trang.** Hằng nhãn tính lúc nạp mô-đun nên tải lại là cách đơn giản và đúng nhất (không cần context React, không sót nhãn).
- `index.html`: script nội dòng (cạnh script giao diện sẵn có) đặt `<html lang>` theo `localStorage` trước khi vẽ.
- Bấm VI | EN: nếu có panel đang sửa dở (`KhungPanel` `daSua`) → hỏi như nút Đóng; rồi `PATCH /me/profile { ngonNgu }` (đã đăng nhập) + `localStorage` + `location.reload()`.
- Sau đăng nhập / tải phiên: `session.ngonNgu` có giá trị và khác máy → ghi máy + tải lại **một lần**; `null` → gửi lựa chọn của máy lên tài khoản (một PATCH).

**3. Lưu ở máy chủ:** migration `server/src/migrate/prEn.ts` (mẫu `prTk.ts`, chạy lặp được): `users.ngon_ngu TEXT` (NULL = chưa chọn; chỉ nhận `vi` / `en`),
`notifications.ma TEXT`, `notifications.bien TEXT` (JSON). `GET /session` trả `ngonNgu`; `PATCH /me/profile` nhận `ngonNgu` (khác `vi`/`en` → 400). `schema.sql` cùng cột.

**4. Mã lỗi:** `shared/i18n/loi.ts`: `export const LOI = { 'pa.khongPhuTrach': { vi: 'Chỉ người phụ trách PA được ghi kết quả.', en: 'You can only record results for PAs you own.' }, … }`.
- `server/src/util.ts`: `HttpError` thêm `ma?`, `bien?`; hàm mới `loi(status, ma, bien?)` lấy câu Việt từ `LOI[ma].vi` (một nguồn chữ, không chép đôi).
  `badRequest/forbidden/notFound/conflict` cũ **giữ nguyên** (câu chưa mã hoá vẫn chạy).
- `app.ts` `traLoiLoi`: trả `{ error, ma, bien, details }`; câu chung (500 "Có lỗi · mã…", 409, 400 JSON hỏng, 413, 404 endpoint) có mã.
- Web `lib/api.ts`: `ApiError` giữ `ma`, `bien`; lỗi mất mạng có mã `chung.matKetNoi`. Một hàm `chuLoi(e)`: EN + có `LOI[ma]` → câu EN; còn lại `e.message` (chữ Việt).
  Thay mọi chỗ in `e.message` / `err.message` ra màn trong phạm vi bằng `chuLoi(e)` (215 chỗ `.message` toàn web — chỉ sửa chỗ thuộc phạm vi + `Toast`/`loiForm` dùng chung).
- **Chỉ mã hoá câu GV gặp được bằng thao tác thật** (quyền, khung giờ chấm, trạng thái, trùng, giới hạn). Câu kiểm kiểu dữ liệu (chỉ gặp khi gửi tay — `kiemKieuO`, `chuTuDo` kiểu sai) giữ Việt.

**5. Chữ máy chủ sinh ra cho màn GV** (dòng việc, nhóm việc, Tổng quan, thông báo): giữ trường chữ Việt như nay **và thêm `ma` + `bien`** (vd `{ tieuDe: 'Nhập điểm Listening, Reading', ma: 'viec.nhapDiem', bien: { kyNang: ['listening','reading'] } }`).
Web `dich(row)` → EN + có mã thì `t(ma, bien)`, không thì chữ Việt. Biến là **dữ liệu thô** (mã kỹ năng, số, tuần, tên) — web tự dịch phần nhãn (kỹ năng, Progress/Final Test…).
Thông báo: `notify({ …, ma, bien })` lưu hai cột mới; thông báo cũ (trước PR) không có mã → giữ Việt, bọc `lang="vi"`.

**6. Không dịch (để Việt):** màn QL / Quản trị; nhật ký / lịch sử đã lưu sẵn chữ trong DB (`student_events.title`, nhật ký thao tác) — hiện trong khối `lang="vi"`;
thanh demo (`DemoBar`, chỉ bản demo); file Excel xuất (QL đọc); sổ tay (PR-SOTAY). Ghi danh sách này vào mô tả PR.

**7. Ngày và số:** `dd/mm` và `W3 SEP` giữ; thứ `T2…CN` → `Mon…Sun` qua `t()` (`shared/domain/hienThiNgay.ts`, `ui/ngayNghiepVu.ts`). Ô ngày `ONgay` giữ dạng gõ `dd/mm/yyyy`; nhãn nút lịch dịch.

**Tech Stack:** React + Tailwind, `shared/` dùng chung; phép kiểm quét nguồn + DB test trong `server/src/tests/prEn.tests.ts` (gọi cuối `run.ts`, mẫu `prHk2.tests.ts`); `scripts/do-khung.mjs` (KHUNG) thêm cờ EN.

---

## Global Constraints

- **Giao diện giữ** (phông Be Vietnam Pro, bảng màu, bố cục, cỡ chữ). Chỉ đổi chữ + thêm nút VI | EN. Không thêm màn, không thêm thư viện.
- **Chữ EN ngắn bằng hoặc hơn chữ Việt** ở nút / nhãn / đầu cột / chip; dài thì rút theo bảng thuật ngữ, **không thu cỡ chữ, không `truncate` mới**.
- **Chữ người dùng gõ, tên người, mã lớp, lý do QL ghi** giữ nguyên.
- **Bản Việt không đổi một chữ** (trừ chỗ ghép chữ phải tách thành khoá — chữ hiện ra giữ nguyên; phép kiểm VI so ảnh trước/sau).
- Phân quyền, kiểm dữ liệu, xử lý lỗi **không đổi** — chỉ thêm mã vào câu.
- Không đụng Turso / Netlify / DB bản chính. Deploy **một lần sau cùng** (plan.md 07/10), không deploy trong PR này.
- `npm run check` **một lần**, foreground, không chạy song song phiên khác (~1,3 GB RAM).

## Phạm vi — file:dòng (mã `origin/main` f904d06d; Task 0 đối chiếu lại sau HK2)

Số = số chuỗi / chữ JSX có tiếng Việt trong file (đếm bằng AST TypeScript, 07/10). `tpl` = chuỗi ghép `${}` (phải đổi thành khoá có biến). `mix` = chữ JSX xen `{biến}`.

| Đợt | Màn | File chính | Chuỗi |
|---|---|---|---|
| **EN-a** | Hạ tầng, đăng nhập, thanh trên, khung chung, lỗi chung | `web/src/App.tsx:107-198` (nav, mất kết nối `:131-137`, bỏ qua tới nội dung `:123`), `lib/api.ts:56,66`, `lib/format.ts`, `lib/session.tsx`, `modules/platform/WelcomePage.tsx` (79), `Header.tsx` (27; menu Tài khoản, chuông, ô tìm), `ui/*` 37 file (ui.tsx, KhungPanel, ONgay, LichNho, ChonNgay, Toast, SaveState, MenuDong, PeoplePicker, BangChung, TepCho, Filters, SoLieu…), `ui/CongTacGiaoDien.tsx`; `shared/domain/{trangThai,hienThiNgay,loiForm,oNgay,chonNgay,dieuHuong,khac,people}.ts`; máy chủ `util.ts`, `app.ts:44,128-150`, `routes/index.ts:110-112, 2252-2253`, `auth.ts`, `platform/accounts.ts` (`myProfile`/`updateProfile`), `platform/audit.ts:48-61` (`notify`), `schema.sql`, `migrate/prEn.ts` | web 334 + shared 118 ≈ **450** |
| **EN-b** | Tổng quan GV, Công việc của tôi, Yêu cầu của tôi, chuông, Lịch Test, Điểm theo lớp, nhập điểm, hồ sơ Mock (xem) | `worklist/{OverviewPage,ViecCuaToi,WorkList,NhomViec,LopToiDay}.tsx`, `congViec/{CongViecPage,HoTroHocVienTab,ChonPhuTrach}.tsx`, `duyet/{YeuCauCuaToi,TheYeuCau}.tsx`, `test/{TestPage,LichTestTab,TabDiemLop}.tsx`, `test/lichTest/*`, `cham/*` (8 file), `fasttrack/{ScoreEntry (125, tpl 38),MockDetailPage (136),NhanXet,ODiemLon,DongThoiGianLuot}.tsx`; shared `{worklist,congViec,chamDiem,fasttrack,lopThuong,oMt,lichMt,tongQuan,diemTheoLuot,normal,sapToi,yeuCauDuyet,thaoTacMt,mt0,nhanXet}.ts`; máy chủ `worklist/mywork.ts` (190 chuỗi, 53 ghép — nhóm việc `:137-242`, `tieuDe` `:422-959`), `worklist/tongQuan.ts`, `worklist/nhacViec.ts:169`, ~40 chỗ `notify(` (danh sách: `grep -rn "notify(" server/src`) | web 717 + shared 309 + máy chủ 223 ≈ **1 250** |
| **EN-c** | Học viên & Lớp (danh sách), hồ sơ lớp, hồ sơ HV (xem: Học thuật, Hành trình, Tổng kết, các lộ trình) | `students/{StudentsPage,StudentDetailPage,DauHoSo,HanhTrinh,NganCase,NganTongKet,CacLoTrinh,KetLuanKhoa,HangLichMt,ChuongLop,ClassRoster,BangHocVienLop,MissingBadge,KetQuaThiThatPanel}.tsx`, `classes/{ClassOverviewPage,DauTrangLop,TabHocVienLop,BangDiemLopThuong,BangCanHoTro,ClassIssueBoard,CanhBaoYThuc,PhanTichLopTab,TabTongKetLop,DaiChuyenLop}.tsx`; shared `{display (tpl 27),hoSoHocVien (tpl 41),hanhTrinh (tpl 24),hocVienLop (tpl 22),students,cuoiKhoa,tongKetLoTrinh,duongHoSo,bangChung}.ts`; máy chủ `students/{viecHocVien,profile,standing}.ts` | ≈ **1 100** |
| **EN-d** | Case – PA (tạo, ghi kết quả, ngăn Case), Ghi vi phạm, Ý thức & Phối hợp (phần GV) | `cases/*` 12 file (QuickReport 97, CapNhatTuan 80, SkillBoard 76 tpl 18, ThaoTacCase 70, CasePanel 68, NopKeHoachPanel…), `yThuc/{RecordViolationPanel,NhanViPham,StudentYThucSection,ClassYThucCard,ChiTietViPham,DaThucHienPanel,DeleteViolationConfirm,ThangYThuc,PhoiHopSosSection,XemXuLyPanel,CaseSosControls}.tsx`, `yThuc/kieu.ts`; shared `{cases (151),sosV4,sos,yThuc,yThucGon,nguoiThucHien}.ts`; máy chủ `cases/signals.ts` | ≈ **1 050** |
| mọi đợt | Câu lỗi máy chủ trên đường GV | `cases/cases.ts` (117 chỗ ném lỗi), `fasttrack/absence.ts` (45), `fasttrack/attempts.ts` (43), `fasttrack/skillSchedule.ts` (34), `cases/sosAuto.ts` (34), `normal/regular.ts` (28), `yThuc/violations.ts` (20), `duyet/yeuCau.ts` (20), `yThuc/phoiHop.ts` (18), `platform/attachments.ts` (16), `normal/cuoiKhoa.ts` (16), `cases/boTro.ts` (11), `routes/index.ts` (46), `loTrinh/thiThat.ts`, `cham/diemTheoLuot.ts`, `cases/nguoiThucHien.ts`, `auth.ts` | ≈ 480 chỗ; mã hoá **~150–200 câu** GV gặp được |

**Tổng ước:** ≈ **3 850 chỗ chữ** trên đường GV (≈ 2 200 khoá sau khi gộp chữ lặp) + ~150–200 mã lỗi. Màn QL / Quản trị (≈ 1 600 chỗ) giữ Việt.
Panel QL bị loại khỏi phạm vi (giữ Việt): `StudentManagePanel`, `IntakePanel`, `ChuyenLopPanel`, `SuaCaLopPanel`, `XoaHocVienPanel`, `LuuTruPage`, `TransitionPanel`, `ClassCreatePanel`,
`TeacherAssignPanel`, `BanGiaoPanel`, `XoaKetThucLopPanel`, `LoTrinhTiepCaLopPanel`, `SuaThongTinLopPanel`, `ClassProgressPanel`, `XacNhanXuLyPanel`, `KhaiBacPanel`, `HopThaoTacMt`, `NganXuatMt`, `test/keHoach/*`, `phanTich/*`, `duyet/HopChoDuyet`, `worklist/{MgmtTasksPage,MeetingPage,BranchPulse,KhoiCanXuLy,MetricTiles,Highlights}`, `platform/{AdminPage,AccountsAdmin,CatalogAdmin,…}`.
**Task 0 kiểm vai:** nếu nút mở panel nào ở trên hiện cho vai GVCN / GVBM (7, 9) thì panel đó vào phạm vi (ghi vào PR).

**Chỗ ghép chữ khó dịch (phải tách thành khoá có biến, không cộng chuỗi):**
- `server/src/worklist/mywork.ts:422, 545, 578, 594, 612, 619, 693, 765, 815, 850, 868, 898` — tiêu đề việc ghép kỹ năng / tên / Progress-Final Test / %; `duoiKyNang()` ghép đuôi.
- `shared/domain/hoSoHocVien.ts:76-225` (41 chỗ), `display.ts:99-202`, `hanhTrinh.ts:177-400`, `lichMt.ts:65-195`, `hocVienLop.ts:147-237`, `cuoiKhoa.ts:76-130`, `yThuc.ts:252-267` (`Quá hạn ${q} ngày`, `Đã xử lý · ${loại}`).
- `web/src/modules/fasttrack/ScoreEntry.tsx:139-539` (38), `MockDetailPage.tsx:186-687` (22), `cases/SkillBoard.tsx:310-634` (18), `cham/LuoiThuong.tsx:94-531` (15), `cases/CasePanel.tsx:179-402` (12).
- JSX xen biến (`<>{n} quá hạn</>`): 239 chỗ trong EN-b…d — dùng `t('…', { n })`, câu EN có thể đổi trật tự.
- Số ít / nhiều: "1 day / 2 days", "1 student / 10 students", "1 class". Tiếng Việt không có — chỉ EN dùng hàm.
- Tên ô trong câu lỗi chung (`kiemKieuO(…, ten)`) — giữ Việt (chỉ gặp khi gửi tay).

## Tôi đã tự quyết (chủ sản phẩm đổi được — kèm rủi ro)

| # | Quyết | Vì sao | Rủi ro · cách chặn |
|---|---|---|---|
| E1 | Đổi ngôn ngữ **tải lại trang** | Hằng nhãn tính lúc nạp; không cần context React, không sót nhãn | Mất chữ đang gõ dở → hỏi trước nếu panel `daSua`; ô lưới tự lưu từng ô nên không mất |
| E2 | Từ điển **trong `shared/`**, EN gõ kiểu `Record<keyof VI>` | tsc chặn thiếu khoá; máy chủ dùng chung câu lỗi Việt | File lớn → chia theo vùng (một file mỗi đợt), gộp ở `index.ts` |
| E3 | Máy chủ **gửi mã + biến + chữ Việt**, không tự dịch | Đúng chốt; máy chủ không cần biết ngôn ngữ; cache `useApi` không đổi | Hai nơi phải khớp biến → phép kiểm DB: mọi `ma` máy chủ gửi có khoá EN, biến đủ |
| E4 | Thông báo cũ / nhật ký đã lưu **giữ Việt** (`lang="vi"`) | Không dịch ngược dữ liệu cũ | GV thấy vài dòng Việt ở chuông tuần đầu — tự hết khi thông báo mới thay |
| E5 | `dd/mm` giữ, thứ đổi `Mon` | GV sống ở VN quen dd/mm; `mm/dd` dễ đọc nhầm | Không |
| E6 | Điện thoại: VI \| EN **trong menu Tài khoản**, hàng đầu | Thanh 23C chỉ 3 nút (HK2 Q2) — thêm nút thì chật | GV phải mở menu (một lần, sau đó nhớ theo tài khoản); màn đăng nhập có nút to |
| E7 | QL bật EN thì màn QL vẫn Việt, phần dùng chung (thanh trên, ui chung) Anh | Đúng phạm vi chốt | Lẫn hai tiếng ở màn QL — chấp nhận; ghi vào PR |
| E8 | Hồ sơ cá nhân (`ProfilePage`, 31 chuỗi): **thêm vào EN-a** | GV mở từ menu Tài khoản; nhỏ | Nếu chủ sản phẩm muốn đúng danh sách chốt thì bỏ ra (Q1) |

**Q1 (hỏi khi duyệt PR, mặc định = có):** Hồ sơ cá nhân (đổi mật khẩu, tên) có dịch không? Mặc định dịch (E8).

---

## Phép kiểm (đỏ trước, xanh sau)

- **E-KHOA** (tsc + chạy): mọi khoá `VI` có ở `EN`, không rỗng; cùng tập `{biến}` ở hai tiếng (hàm EN: gọi thử với biến mẫu không ném lỗi, không còn `{`);
  EN ≠ VI trừ danh sách giữ nguyên (mã, tên chương trình, Mock Test, Band, OVR, SOS n, Report n, WL n) ghi trong phép kiểm.
- **E-LOI** (DB test): `loi(403,'pa.khongPhuTrach')` → JSON `{ error: <vi>, ma }`; mọi `ma` dùng trong `server/src` có trong `LOI` (quét nguồn); 500 trả `ma: 'chung.coLoi'` + `bien.ma`.
- **E-NN** (DB test): `PATCH /me/profile { ngonNgu:'en' }` lưu, `GET /session` trả `'en'`; `'fr'` → 400; người khác không đổi được của người khác (route chỉ sửa chính mình).
- **E-TB** (DB test): `notify({ma,bien})` lưu hai cột; `GET /notifications` trả `ma`, `bien`; dòng cũ `ma = null`.
- **E-VIEC** (DB test, EN-b): mọi dòng `/my-work` và Tổng quan GV có `ma` thuộc `VI`; `t(ma, bien)` ra chuỗi không còn `{`.
- **E-NGUON** (quét nguồn, mỗi đợt mở rộng danh sách file): file trong phạm vi đợt **không còn chữ Việt** ngoài `t()` / `LOI` / chú thích (dùng `typescript` AST như phép đếm 07/10:
  StringLiteral, Template, JsxText có dấu tiếng Việt → lỗi; cho phép: chuỗi so sánh dữ liệu ghi rõ trong danh sách của phép kiểm).
- **E-QUET** (Playwright, chạy tay): `KHUNG_NGON_NGU=en node scripts/do-khung.mjs` — thêm loại lỗi **(e) chữ Việt còn sót**: nút chữ có dấu tiếng Việt trên màn GV,
  bỏ qua khối `[lang=vi]` và chữ dữ liệu (tên HV / GV, mã lớp, tên Case / PA, mô tả, lý do — script đọc danh sách từ DB demo `PISA_DB` bằng `@libsql/client` sẵn có). Chỉ chạy (e) ở kịch bản vai 7, 9.
- **E-KHUNG**: cùng lệnh trên → (a)–(d) **0 lỗi** ở 375 + 1440, sáng + tối, chế độ EN (thêm kịch bản: đăng nhập, menu Tài khoản 375, chuông, panel Ghi kết quả PA, Tạo Case, Ghi vi phạm, nhập điểm 375).
  Chế độ VI vẫn 0 lỗi như mốc (không làm hỏng bản Việt).
- **E-NHO** (Playwright, chạy tay, thêm kịch bản `ngon-ngu` vào do-khung): chưa đăng nhập bấm English → tải lại vẫn EN; đăng nhập vai chưa chọn → tài khoản lưu `en`;
  máy khác (context mới, localStorage trống) đăng nhập cùng vai → tự chuyển EN; bấm VI ở thanh trên → tài khoản `vi`.

---

### Task 0: Nền (mọi đợt)

- [ ] Chỉ bắt đầu khi **PR-HK2 đã merge** (`gh pr list --state merged --search HK2`). Chưa merge thì DỪNG.
- [ ] Nhánh `pr-en-a-ha-tang` (rồi `pr-en-b-…`, `pr-en-c-…`, `pr-en-d-…`) từ `origin/main` mới nhất; worktree `.claude/worktrees/<nhánh>`; `PORT=4560 WEB_PORT=5560`.
- [ ] Chạy lại phép đếm chuỗi (AST, như mục "Phạm vi") trên `main` sau HK2; cập nhật bảng phạm vi vào mô tả PR. Đọc chữ Việt mới của HK2 (Progress Test / Final Test, `-1.5`, "quá hạn n ngày", "Nhập", "Thiếu điểm", "PISA Tracking", bỏ "Bạn", bỏ "Hoàn tác" vắng).
- [ ] Bảng thuật ngữ `thiet-ke/THUAT_NGU_EN_2026-10-07.md` là nguồn chữ EN; chữ chưa có trong bảng → chọn theo luật đầu bảng, thêm dòng vào bảng (cùng PR).
- [ ] Mốc: `node scripts/do-khung.mjs` (VI) → lưu kết quả "trước".

### Task 1 (EN-a): Từ điển, `t()`, lưu ngôn ngữ

- [ ] **Đỏ:** `prEn.tests.ts` E-KHOA (với vài khoá mẫu), E-NN. Chạy `npm run build:server && node dist-server/server/src/tests/run.js` → đỏ. Commit `test(en): từ điển hai tiếng, lưu ngôn ngữ (đỏ)`.
- [ ] `shared/i18n/{vi,en,index}.ts` (Architecture 1); `migrate/prEn.ts` + `schema.sql`; `GET /session` `ngonNgu`; `PATCH /me/profile` nhận `ngonNgu` (kiểm `vi`/`en`).
- [ ] `index.html` đặt `<html lang>`; `lib/session.tsx` đồng bộ máy ↔ tài khoản (Architecture 2), tải lại tối đa một lần.
- [ ] Xanh E-KHOA, E-NN. Commit `feat(en): từ điển vi/en, t(), nhớ ngôn ngữ theo tài khoản + máy`.

### Task 2 (EN-a): Nút ngôn ngữ — đăng nhập + thanh trên

`/impeccable clarify` + `/impeccable adapt` phạm vi hai chỗ này. Đúng mockup mục 1–2.
- [ ] **Đỏ** (quét nguồn): `WelcomePage.tsx` có nhóm hai nút `aria-pressed` "Tiếng Việt" / "English" (mỗi nút `lang` đúng tiếng) **trên** khung đăng nhập, cao ≥ 56 px;
  `Header.tsx` ≥ 640 px có `NutNgonNgu` ngay sau `CongTacGiaoDien`; < 640 px nằm đầu menu Tài khoản (cùng hàng giao diện của HK2).
- [ ] Một component `ui/NutNgonNgu.tsx` (hai nút `aria-pressed`, cỡ `btn-sm`, chữ 11,5 px; biến thể `to` cho màn đăng nhập). Không thêm nút lên thanh 23C.
- [ ] Xanh. Ảnh 1440/375 sáng/tối so mockup mục 1–2. Commit `feat(en): nút VI | EN ở đăng nhập và thanh trên`.

### Task 3 (EN-a): Mã lỗi + khung chung

- [ ] **Đỏ:** E-LOI; E-NGUON cho `App.tsx`, `lib/*`, `WelcomePage`, `Header`, `ProfilePage` (E8), `ui/*`, shared nhóm EN-a.
- [ ] `util.ts` `HttpError.ma/bien`, `loi()`; `app.ts` câu chung có mã; `shared/i18n/loi.ts`; `lib/api.ts` `ApiError.ma/bien` + `chuLoi(e)`; `Toast`, `loiForm` dùng `chuLoi`.
- [ ] Dịch EN-a theo bảng thuật ngữ. `/impeccable harden`: câu lỗi chưa mã vẫn hiện Việt (thử bằng một route chưa mã hoá).
- [ ] Xanh. `KHUNG_NGON_NGU=en node scripts/do-khung.mjs` cho kịch bản đăng nhập + thanh trên → 0 lỗi. Commit `feat(en): mã lỗi máy chủ, khung chung tiếng Anh`.
- [ ] Thêm cờ `KHUNG_NGON_NGU` + loại (e) + kịch bản `ngon-ngu` vào `scripts/do-khung.mjs` (E-QUET, E-NHO). Commit `test(en): do-khung chế độ EN`.
- [ ] **Mở PR EN-a** (không merge). Mô tả: model thật, phép kiểm, ảnh, chú thích `ponytail:`.

### Task 4 (EN-b): Tổng quan GV, Công việc, chuông, Test, nhập điểm

- [ ] **Đỏ:** E-VIEC, E-TB; E-NGUON mở rộng danh sách file EN-b.
- [ ] Máy chủ: `mywork.ts` mọi `tieuDe` / `actionLabel` / nhóm (`GROUP_META :137-242`) thêm `ma` + `bien`; `tongQuan.ts`; ~40 `notify(` thêm `ma` + `bien`. Chữ Việt giữ nguyên từng chữ.
- [ ] Web: màn EN-b dùng `t()` / `dich(row)`; mã lỗi các route nhập điểm / vắng / dời lịch / chấm (`absence.ts`, `attempts.ts`, `regular.ts`, `skillSchedule.ts`, `diemTheoLuot.ts`) — chỉ câu GV gặp được.
- [ ] `/impeccable clarify` (chữ EN ngắn), `/impeccable adapt` (375: lưới nhập điểm, thẻ việc, KPI Lịch Test). Đúng mockup mục 3–5, 8.
- [ ] Xanh. do-khung EN 0 lỗi (a–e) cho kịch bản `tong-quan-gv`, `cv-gv`, `gvbm`, `gvbm-test`, `test-lichTest`, `test-diem-lop`, `nhap-diem`, `bang-diem-thuong`, `mock`, chuông. Commit theo màn. **Mở PR EN-b.**

### Task 5 (EN-c): Học viên & Lớp, hồ sơ lớp, hồ sơ HV

- [ ] **Đỏ:** E-NGUON file EN-c; DB test: `students/profile.ts`, `viecHocVien.ts`, `standing.ts` chữ trả về có `ma`.
- [ ] Shared `hoSoHocVien.ts`, `hanhTrinh.ts`, `display.ts`, `hocVienLop.ts`, `cuoiKhoa.ts`, `tongKetLoTrinh.ts` → `t()` có biến (giữ tên hàm). Hành trình: sự kiện đã lưu chữ trong DB → `lang="vi"`.
- [ ] `/impeccable clarify` + `/impeccable adapt` (375 hồ sơ HV, hàng tab "Academic · Conduct & SOS · Journey" không cắt).
- [ ] Xanh. do-khung EN 0 lỗi kịch bản `hvl-gvcn`, `lop-ft*`, `hv-*` vai 7. **Mở PR EN-c.**

### Task 6 (EN-d): Case – PA, Ghi vi phạm, Ý thức (phần GV)

- [ ] **Đỏ:** E-NGUON file EN-d; E-LOI mở rộng: mã lỗi `cases.ts`, `boTro.ts`, `nguoiThucHien.ts`, `violations.ts`, `phoiHop.ts`, `attachments.ts` (câu GV gặp được).
- [ ] Shared `cases.ts` (nhãn kết quả / quyết định / loại PA / nguồn Case / sự kiện Case), `sosV4.ts`, `sos.ts`, `yThuc.ts`, `yThucGon.ts` → `t()`.
- [ ] Panel Ghi kết quả PA, Tạo Case, Ghi vi phạm đúng mockup mục 6–7: bốn nút kết quả / năm nút nhóm **không cắt ở 375** (đo d).
- [ ] `/impeccable clarify` + `/impeccable adapt` + `/impeccable harden` (lỗi quyền PA, khung ghi vi phạm).
- [ ] Xanh. do-khung EN 0 lỗi kịch bản `panel-pa`, `panel-tao-case`, `panel-vi-pham`, `hv-y-thuc`, `lop-ft-y-thuc`. **Mở PR EN-d.**

### Task 7: Nghiệm thu (cuối EN-d)

- [ ] `KHUNG_NGON_NGU=en KHUNG_CHUP=1 node scripts/do-khung.mjs` → **0 lỗi (a)–(e)**, 375 + 1440, sáng + tối; ảnh vào `thiet-ke/anh/en/` (chủ sản phẩm xem trước merge).
- [ ] `node scripts/do-khung.mjs` (VI) → không thêm lỗi so mốc Task 0. Ảnh VI trước/sau ba màn GV giống nhau (bản Việt không đổi chữ).
- [ ] E-NHO bấm thử đủ bốn bước.
- [ ] `/impeccable audit` các màn GV ở EN; `/ponytail-review`. `npm run check` **một lần**, foreground.
- [ ] `CODE_MAP.md` (thêm `shared/i18n/`), `thiet-ke/HE_GIAO_DIEN.md` §chữ (một dòng: chữ EN theo `THUAT_NGU_EN_2026-10-07.md`), một dòng mục 11 `plan.md`.
- [ ] Mỗi PR đợt: mô tả có model thật, phạm vi file, phép kiểm, ảnh, chú thích `ponytail:`, danh sách giữ Việt (Architecture 6). **Không merge.**

---

## Nghiệm thu

1. Màn đăng nhập có hai nút to "Tiếng Việt | English" ngay trên khung; bấm English → cả màn đổi, tải lại vẫn English.
2. Thanh trên máy tính có "VI | EN" chữ nhỏ cạnh ◐; điện thoại có hàng "Language VI | EN" đầu menu Tài khoản. Chọn một lần → mọi máy của tài khoản đó theo.
3. Vai GVCN (7) và GVBM (9) ở EN: Home, Tasks, chuông, Test schedule, Scores by class, Enter scores, hồ sơ lớp, hồ sơ HV, Case – PA, Log incident **không còn chữ Việt** ngoài dữ liệu người gõ / tên / mã / thông báo cũ (E-QUET 0 lỗi).
4. Lỗi máy chủ GV gặp được hiện tiếng Anh; câu chưa có mã hiện tiếng Việt, không vỡ màn.
5. do-khung EN 0 lỗi tràn / cắt ở 375 + 1440, sáng + tối; bản VI không thêm lỗi, không đổi chữ.
6. Màn QL / Quản trị giữ tiếng Việt.
7. `prEn.tests.ts` xanh trong `npm run check`.

## File chồng với PR khác

| PR | File chung | Cách tránh |
|---|---|---|
| **PR-HK2** (#231 kế hoạch, code sắp chạy) | gần như mọi file EN: `App.tsx`, `Header.tsx` (D7 23C, Sáng/Tối vào menu Tài khoản — EN thêm hàng Language cạnh đó), `DemoBar.tsx`, `ui/ui.tsx` (chip, `NutChon`), `ui/Nhan.tsx`, `HangTab.tsx`, `ViecTiep.tsx`, `WorkList.tsx`, `KhoiCanXuLy.tsx`, `OverviewPage.tsx`, `ScoreEntry.tsx` (K4 vắng, "Nhập"), `cham/{LuoiFT,LuoiThuong,MotKyNang,GvCham,ChamDiemPage}.tsx`, `test/TabDiemLop.tsx`, `cases/{SkillBoard,CapNhatTuan}.tsx`, `StudentDetailPage.tsx`, `DauTrangLop.tsx`, `server/src/worklist/{mywork,tongQuan}.ts`, `shared/domain/{sosV4,lopThuong,chamDiem,phanTich}.ts`, `index.html`; **đổi tên Giữa/Cuối khoá → Progress/Final Test** (~940 chỗ / ~130 file, gộp vào HK2 07/10) | EN chạy **sau** HK2 merge; Task 0 đếm lại và đọc chữ mới; không sửa lại chữ Việt HK2 đã chốt |
| **PR-KHUNG #230** | `scripts/do-khung.mjs` (EN thêm cờ, loại (e), kịch bản) | KHUNG merge trước HK2 → trước EN; EN chỉ thêm, không đổi luật đo (a)–(d) |
| **PR-SOTAY** (sau EN) | ảnh màn EN cho sổ tay GVNN | SOTAY chụp từ `main` sau EN; EN không làm sổ tay |
| PR-NC (sau deploy) | `phanTich/*` | Ngoài phạm vi EN |

## Prompt — session code (dán nguyên khối, SAU khi PR-HK2 merge; mỗi đợt một phiên)

**PR-EN-a / b / c / d** — Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp, ghi model thật vào mô tả PR; Fable hoặc model khác thì DỪNG
```
/ponytail lite
Làm PR-EN đợt <a|b|c|d> theo docs/superpowers/plans/2026-10-07-pr-en-tieng-anh.md (Task 0 + Task của đợt) + prompt chung plan.md mục 9.0.
Đầu phiên nói model đang chạy. Không Fable kể cả subagent.
Chỉ bắt đầu khi PR-HK2 đã merge (và đợt trước của EN đã merge). Nhánh pr-en-<đợt>-… từ origin/main mới nhất,
worktree .claude/worktrees/<nhánh>, PORT=4560 WEB_PORT=5560.
Mockup đã duyệt (planning tự duyệt 07/10): thiet-ke/mockup-en-2026-10-07.html. Chữ EN theo thiet-ke/THUAT_NGU_EN_2026-10-07.md.
Giao diện giữ — chỉ đổi chữ + nút VI | EN. Chữ EN ngắn; dài thì rút, KHÔNG thu cỡ chữ. Chữ người dùng gõ, tên, mã giữ.
Bản Việt không đổi chữ. Không thêm thư viện i18n. Máy chủ gửi mã + biến + chữ Việt; web dịch; chưa mã thì hiện Việt.
Ô ngày = ô gõ + nút lịch (ONgay). Màn QL / Quản trị giữ tiếng Việt.
Đỏ trước: server/src/tests/prEn.tests.ts (E-KHOA, E-LOI, E-NN, E-TB, E-VIEC, E-NGUON theo đợt).
Impeccable: /impeccable clarify, /impeccable adapt, /impeccable harden trong phạm vi đợt; cuối EN-d /impeccable audit.
Đo: KHUNG_NGON_NGU=en node scripts/do-khung.mjs → 0 lỗi (a)–(e) ở 375 + 1440, sáng + tối; bản VI không thêm lỗi.
/ponytail-review. npm run check MỘT lần, foreground. Mở PR vào main, KHÔNG merge.
Mô tả PR: model thật, phạm vi file, phép kiểm, ảnh EN, chú thích ponytail:, danh sách giữ Việt.
```

## Cái bỏ qua (và khi nào thêm)

- **Dịch màn QL / Quản trị, file Excel, nhật ký đã lưu:** không — thêm khi có QL nước ngoài.
- **Đổi ngôn ngữ không tải lại trang:** không (E1) — thêm khi phải giữ trạng thái màn qua lần đổi.
- **Mã hoá mọi câu lỗi (~1 000 chỗ):** không — chỉ câu GV gặp được; câu khác hiện Việt (đúng chốt "không vỡ").
- **Định dạng ngày theo vùng (mm/dd):** không (E5).
- **Phép kiểm Playwright trong `npm run check`:** không (RAM) — do-khung chạy tay như KHUNG.
