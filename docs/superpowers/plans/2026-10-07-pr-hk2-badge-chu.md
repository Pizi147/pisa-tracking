# PR-HK2 · Badge & chữ (chạy cuối) — Kế hoạch bổ sung

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (mỗi Task một subagent cùng model). Bước `- [ ]`.
> **Model: Opus 5.5 · High (B: Sonnet 5.5 · High) — không Fable, kể cả subagent** (CLAUDE.md 06/10).

**Nguồn:** `plan.md` mục 3, mục 4 "PR-HK2" (đủ các dòng "Thêm từ …": DH, U12, SL #203, DL #206, KHUNG; tên "PISA Tracking"; tuần học);
`docs/superpowers/plans/2026-10-02-ux-sau-critique.md` (H1, H2, K1, K2, K4–K7, J1–J4, J7–J9); mockup `thiet-ke/mockup/23-tong-quan-theo-vai.html` màn C (D7).
**Đã chuyển đi, KHÔNG làm ở đây:** chụp lại ảnh sổ tay (→ PR-SOTAY) · toast Hoàn tác sau ghi vi phạm (bỏ, LUI-a1 đã có Sửa / Xoá — kiểm 07/10: `RecordViolationPanel.tsx:19`, không còn `hoanTac` trong `yThuc/`).
**Mockup:** `thiet-ke/mockup-hk2-2026-10-07.html` (mục 1–8) — **phải được duyệt trước khi code**.

**Goal:** dọn badge về ba họ đã chốt, chữ nội dung ≥ 12 px, đầu cột dính ở bảng dài, thanh trên điện thoại theo 23C, sửa các chữ còn sai/lặp — tinh chỉnh, không làm lại.

**Architecture:** hai chuỗi lớp chip dùng chung trong `ui/Nhan.tsx` (`CHIP_TRON`, `CHIP_VUONG`); mọi component chip cũ (`Level`, `Status`, `Alert`, `Outcome`, `Info`, `Task`, `MissingBadge`, `NhanViPham`, số đếm `HangTab`/`HangNhom`/`App`) lấy lớp từ đó — **giữ tên và API component** (≈ 100 chỗ gọi không đổi). Đầu cột dính: một lớp `.bang-dinh` trong `index.css`, gắn vào từng bảng đã đo vừa khung. Phần còn lại là sửa chữ / sửa nhỏ tại chỗ. Một việc máy chủ (tuần học) theo TDD.

**Tech Stack:** React + Tailwind, `web/src/index.css`, phép kiểm quét nguồn `server/src/tests/prHk2.tests.ts` (mẫu `prUxG.tests.ts`, `doc()` bỏ chú thích) + phép kiểm DB test cho tuần học; đo bằng `scripts/do-khung.mjs` của PR-KHUNG (dùng lại, không viết script mới).

---

## Global Constraints

- **Tinh chỉnh, không làm lại.** Phông Be Vietnam Pro, bảng màu, bố cục, mã tuần `W2 OCT` giữ nguyên. Không thêm màn, không thêm thư viện.
- **Chữ trên màn ngắn** (chủ sản phẩm 05/10): nhãn 1–3 từ, không câu giải thích dưới nút/ô. Mockup = đúng chữ sẽ hiện.
- **Đơn giản nhất, thao tác tự nhiên** (06/10): không thêm nút/kho/màn xem trước khi có cách trực tiếp.
- **Ô ngày = ô gõ + nút lịch** (`ONgay`) nếu chạm ô ngày nào (06/10). HK2 không thêm ô ngày mới.
- **Sửa ở gốc chung**, không vá từng trang; component chip giữ tên/API.
- **Máy tính giữ mật độ.** Chữ 12 px chỉ cho chữ mang nội dung; tiêu đề cột và badge giữ 11–11,5 px (Q-K 02/10).
- **Điện thoại:** vùng bấm ≥ 44 px (K3) giữ nguyên; không tràn ngang; lớp `max-sm:` của KHUNG G5 giữ nguyên khi gom chip.
- **Không đụng phần PR khác đang mở:** PR-LUI-a2 #229 (Case, Chờ duyệt, `CapNhatTuan.tsx`, `ThaoTacCase.tsx`), PR-KHUNG (`NutChon`, `BoLocDoan`, `HangTab` mép mờ, `ViecTiep`, `WorkList` dòng tên). HK2 chạy **sau** hai PR này merge (Task 0).

---

## Hiện trạng từng mục (đọc mã `origin/main` c5318486, 07/10)

✅ xong · ◐ còn một phần · ✗ còn nguyên · ↺ đổi cách làm (tự quyết, xem cột cuối)

| ID | Nội dung | Hiện trạng · file:dòng | Làm gì |
|---|---|---|---|
| **H1** | Ba họ chip | ✗ **9 kiểu**: `Nhan` `ui/Nhan.tsx:30` (tròn, 11,5/18, bold) · `Level` `ui/ui.tsx:116` (tròn, 11 px) · `NhanTrangThai` `ui.tsx:527` (vuông viền, 11,5, `py-0.5` ≈ 21 px) · `Status`/`Alert`/`Outcome` `ui.tsx:196/216/250` (vuông, 11 px) · `Info` `:163`, `Task` `:149` (11 px) · `KetQuaDot` `ui/KetQuaDot.tsx:64` (12 px) · `NhanLoai` `cases/SkillBoard.tsx:371` (11/15) · `MenuDong "+n"` `ui/MenuDong.tsx:89` (h-7, 11 px) | Task 1 |
| **H2** | Chip làm riêng | ◐ `KhoiNo` ✅ (dùng `Nhan`), `TongHopTestSos:152` ↺ (giờ là ô màu, không phải chip). Còn: `LichTestTab.tsx:315`, `HoSoGiaoVienPage.tsx:168,175`, `ChuongLop.tsx:143,164`, `HieuQuaPa.tsx:119,129`, `MeetingPage.tsx:373`, `HangNhom.tsx:72,82`, `HangTab.tsx:33`, `App.tsx:49`, `NhanViPham.tsx:42`, `ClassRoster.tsx:293`, `MissingBadge.tsx:79` (amber cứng) | Task 1 |
| H1 chip "Thiếu n" / "+n" | (từ KHUNG) | `MissingBadge.tsx:79` vuông 11,5 medium, màu `amber-*` cứng; "+n" `StudentsPage.tsx:357`, `DauTrangLop.tsx:198` = `MenuDong` h-7 (28 px, khác mọi chip) | Task 1 |
| **K1** | Bộ lọc Học viên & Lớp | ✅ hết hai hàng "Tất cả", đã có "Loại lớp" (`CongTacKhung.tsx:41-49`). ✗ ô tìm vẫn "🔍 Tìm tên, mã học viên hoặc mã lớp…" (`StudentsPage.tsx:191`); ✗ "+ Lớp mới" / "+ Học viên" vẫn ngoài trên điện thoại (`:174-176`) | Task 5 |
| **K2** | Phân tích › Tổng hợp | ✗ 19 cột FT / 18 cột lớp thường (`shared/domain/phanTich.ts:181-261`), bảng 1476 > 1398 px ở 1440 (đo KHUNG #15); "16 (1 quá hạn)" `TongHopTestSos.tsx:150-151`; "Cột hiện ▾", "⤓ Xuất bảng này", "Xuất kết quả từng lượt" ngoài (`:212-229`); ~16 nút điều khiển | Task 4 |
| **K4** + "Vắng" | Vắng thống nhất, có Hoàn tác | ◐ Ô nhập giống nhau ở lưới và màn từng kỹ năng (dùng chung ô). Lệch ở **thông báo**: nút "Vắng" điện thoại (`ScoreEntry.tsx:208-217, 434, 519, 1152-1160`) → toast **có Hoàn tác** "Đã ghi vắng R · Tên" (`useToastVang :272-277`); gõ "-" lớp thường → "Đã dời R sang tuần sau." **không Hoàn tác** (`cham/LuoiThuong.tsx:239`); gõ "-" FT → **không toast**. Gỡ "-" (PR-BV) → "Đã gỡ vắng … · về W…" | Task 7 (Q4) |
| **K5** | Demo bar điện thoại | ✗ `platform/DemoBar.tsx:55-64`, không gập; 375 thành 2 hàng ≈ 95–100 px | Task 5 |
| **K6** | Chữ nội dung 12 px | ✗ `text-[11px]` 353 chỗ (≈ 297 là chữ nội dung), `text-[11.5px]` 60. Lớp chung: `.th` 11 px (`index.css:218`, giữ), `.hang-con > td` 11,5 (`:249`), `Field` gợi ý `ui.tsx:338-339`, `SectionNote :354`, `KpiTile :301-306`. Top file: ScoreEntry, TransitionPanel, ui.tsx, HanhTrinh, MockDetailPage | Task 2 |
| **K7** | Một kiểu ⋯ | ◐ `MenuDong` mặc định ⋯ (15 chỗ). Lệch: `DauTrangLop.tsx:174` `bieuTuong="⋮"`, `StudentDetailPage.tsx:214` `<Menu label="⋮">` (component khác, `ui/Menu.tsx:24`) | Task 1 |
| **D7** | Thanh trên điện thoại = 23C | ✗ `App.tsx:139-152` ô "P" 28 px; `Header.tsx:182-272` nút có viền, biểu tượng 14/18 px, số chuông đứng cạnh, thừa nút Sáng/Tối (`:264`). 23C: chữ **PISA**, nút 44×44 không viền, biểu tượng 20, số đè góc chuông, không nút Sáng/Tối | Task 5 (Q2) |
| **Đầu cột dính** | (từ KHUNG #16) | ✗ chỉ Học viên & Lớp dính (`StudentsPage.tsx:272-277`). Bảng khác bọc `.table-scroll` (`index.css:172`, `overflow-x:auto` ⇒ cũng là khung cuộn dọc) hoặc `card overflow-hidden` ⇒ `.th` sticky bám khung bọc, không bám `<main>` | Task 3 |
| **J1** | "thiếu 2" | ✗ `cases/SkillBoard.tsx:650-653` `gapText` → "thiếu 1.5" / "vượt 0.5" (dùng ở `:615`, `TheKyNang.tsx:42,73`); trùng chữ với "Thiếu 2 thông tin" | Task 6 |
| **J2** | Mã HV hai dạng | ✗ `000048` (`maHocVienNgan` `shared/domain/hocVienLop.ts:26-29`: ClassRoster, BangHocVienLop, BangDiemLopThuong, BangCanHoTro) vs `PISA-000048` (hồ sơ `StudentDetailPage.tsx:198`, lưới chấm `LuoiFT.tsx:181,265`, `LuoiThuong.tsx:434`, `MotKyNang.tsx:179,201,310`, `DiemTheoLop.tsx:130`, `LuuTruPage.tsx:154`, `TransitionPanel.tsx:414`, ô tìm `Header.tsx:154`) | Task 6 (Q3) |
| **J3** | "quá hạn từ W1 SEP" vs "quá hạn 7 ngày" | ✗ `server/src/worklist/tongQuan.ts:115, 136` → `KhoiCanXuLy.tsx:50` | Task 6 |
| **J4** | Lời giải thích cho người làm app | ✗ `KhoiCanXuLy.tsx:61` "Gộp hai khung · …", `OverviewPage.tsx:94` "Chỉ phần số đổi theo khung · …" | Task 6 |
| **J7** | "Bạn" lặp | ✗ `server/src/worklist/mywork.ts:1221` gán `owner='Bạn'` → in mỗi dòng `WorkList.tsx:53,64` (Tổng quan GV, Công việc của tôi) | Task 6 |
| **J8** còn lại | Tên cắt | ◐ tên em đã có `title`. Còn: `test/TabDiemLop.tsx:55` tên lớp `truncate` **không title**; `cham/ChamDiemPage.tsx:84` "{lớp} · {đợt}" `truncate` **không title**. (DL #206) tên em cắt khi có chip "Đã hoàn tất" (`LuoiFT.tsx:258-260`, `LuoiThuong.tsx:424-428`, `MotKyNang.tsx:116-132`; chip `Info` nowrap) | Task 6 |
| **J9** | Ba chữ khó hiểu | ✗ "Xác nhận PA Tutor · đến lúc thi" (`shared/domain/sosV4.ts:108` + mô tả `sos.ts:74`) · "– sửa" khi ô trống (`ScoreEntry.tsx:516-517`) · "GV chấm: Tôi ▾" ở đầu cột S lưới máy tính (`cham/GvCham.tsx:65,81,87`; màn từng kỹ năng có `chiTen` nên đúng) | Task 6 |
| DH "+n" | Menu "+n" hồ sơ lớp | ✗ `DauTrangLop.tsx:94-100` `bamBadge` chỉ có `qua-han`, `cham`, `xep-lop`, `cho-duyet`; `thieu-gv`, `thieu-tt` bấm không làm gì; nhãn chặng (`chang`) vẫn vào menu | Task 8 |
| DH ô tìm | "Lọc trong danh sách này…" | ✗ (xem K1) | Task 5 |
| DH "+ Lớp mới" | vào ⋯ trên điện thoại | ✗ (xem K1) | Task 5 |
| DH "MT3" | vùng bấm ≥ 40 px | ✅ `ui/TheDong.tsx:34` `[&_a.link]:py-3.5` ≈ 48 px | — |
| U12 "Không đạt" | tô màu cảnh báo khi chấm dở | ✗ `StudentDetailPage.tsx:645-646` `Level muted` "Chờ n môn" + dòng phụ `text-slate-400` | Task 6 |
| U12 "(đã chấm)" | bỏ khi bài xong có môn huỷ | ✗ `shared/domain/lopThuong.ts:63`, `chamDiem.ts:82` → `StudentDetailPage.tsx:652` | Task 6 |
| U12 "dời" | nhãn sau `tenMonNgan` | ✅ `StudentDetailPage.tsx:404-415` ra "dời L W…" — đúng | — |
| SL "Đóng" | chân panel ghi cứng | ✗ `ChuyenLopPanel.tsx:150`, `ClassProgressPanel.tsx:97`, `CatalogAdmin.tsx:177, 248` | Task 9 |
| SL Esc | hộp bốn tiêu chí | ✗ `ScoreEntry.tsx:617-620` có `daSua` cho chữ nút, nhưng Esc (`KhungPanel.tsx:64-65`) đóng luôn không hỏi | Task 9 |
| SL `nganPanel` | thứ tự Esc panel cha/con | chưa gặp (`KhungPanel.tsx:12, 62-68`) — **có thật mới sửa** | Task 9 (bấm thử) |
| DL `hoanTat.ts` | giờ thật? | ✅ `server/src/fasttrack/hoanTat.ts:32-40` dùng `nhap_dau_ngay` (ngày nghiệp vụ), `today` truyền vào — không sửa | — |
| Tuần học | không lộ trình active → không ghi | ✗ Hành trình còn ghi (`server/src/students/hanhTrinh.ts:320-327` → `loTrinhTinhTuan` `fasttrack/cycles.ts:44-50` rơi về lộ trình gần nhất). ✅ `profile.ts:786` và `transition.ts:67` đã không ghi | Task 10 |
| Tên web | "PISA Tracking" | ✗ `index.html:7`, `App.tsx:144`, `WelcomePage.tsx:137`, `server/src/index.ts:21`, phép kiểm `hocVienLop.tests.ts:71,73` (khẳng định chữ cũ), chú thích `suaLoiNong.tests.ts:282`, `README.md:1`, `DEMO.md:1`, `TRIEN_KHAI.md:1`. Sổ tay `docs/so-tay/*` → **PR-SOTAY** | Task 10 |
| "Mất kết nối" | `role=status`, "Đang thử…" | ✗ `App.tsx:131-137` `role="alert"`, nút "Thử lại" gọi `reload()` không khoá, không chữ đang thử | Task 9 |
| Bấm thử "Khác" | chữ mơ hồ | `AdminPage.tsx:160` nhóm quyền "Khác" (quyền chưa có mô tả) · `duyet/DeXuatSuaPanel.tsx:16` ô "Khác" · `MeetingPage.tsx:44` Tutor "Khác" (dưới cột Tutor — rõ) · danh mục lý do (có ô Ghi rõ — rõ) | Task 6 |
| Bấm thử Lưu trữ rỗng | | `LuuTruPage.tsx:119, 142` cùng câu "Chưa có …" cả khi ô tìm (`:98`) không khớp | Task 6 |
| Bấm thử Hồ sơ cá nhân | khoảng trống | `ProfilePage.tsx:101` `max-w-3xl` một cột ba thẻ — form hẹp một cột là đúng; **không sửa** trừ khi ảnh thật thấy lỗi | Task 11 (ảnh) |
| Toast Hoàn tác vi phạm | | ✅ đã bỏ (LUI-a1) | — |

## Tôi đã tự quyết (chủ sản phẩm đổi được — mỗi mục kèm rủi ro)

| # | Quyết | Vì sao | Rủi ro · cách chặn |
|---|---|---|---|
| T1 | **Họ tròn** (`CHIP_TRON`): trạng thái học viên / lớp + **số đếm** (menu, tab, nhóm). `Level` gộp vào đây. **Họ vuông** (`CHIP_VUONG`): trạng thái việc + `Status`/`Alert`/`Outcome`/`Info`/`Task`/`NhanViPham`/"Thiếu n"/`ClassRoster` xám. **KetQuaDot giữ nguyên** (12 px, như chốt 26/09). | Đúng Q-H 02/10; "Thiếu n" = việc cần bổ sung (H1 đã ghi MissingBadge vào họ vuông) | Cùng 11,5 px / cao 20 px → chip vuông cũ 21 px thấp đi 1 px, chip 11 px to lên 0,5 px: dòng bảng có thể nhích. Chặn: ảnh trước/sau 1440 các bảng dày (HVL, Công việc, Hồ sơ lớp) |
| T2 | Cao chip = **20 px** cho cả hai họ (`leading-[18px]` + viền 1 px; họ tròn viền trong suốt) | Một chiều cao dòng như H1 | Không |
| T3 | **"+n"** (HVL, hồ sơ lớp) = nút họ tròn, tông xám (`Nhan tone="muted"` có `onClick`) thay cho `MenuDong` h-7 | Nó mở thêm các badge lớp (họ tròn) | Menu vẫn là `MenuDong` (chỉ đổi mặt nút) |
| T4 | **Nút lọc dạng viên thuốc** (HVL `StudentsPage.tsx:218`, `LichTestTab:315`, `HieuQuaPa:119,129`, `NganXuatMt:177`, `NganXepLichMt:368`) là **nút**, không phải badge: một lớp `.nut-loc` trong `index.css` (dáng HVL đã duyệt, `aria-pressed`) | Không tạo họ chip thứ tư; năm chỗ chép tay → một lớp | Đổi cao 26–28 px → theo HVL (`h-8`, điện thoại 44) |
| T5 | **K7: ⋯ ngang ở mọi nơi.** `DauTrangLop` bỏ `bieuTuong="⋮"`; `StudentDetailPage` `<Menu label="⋮">` → `MenuDong` | 15 chỗ ⋯ / 2 chỗ ⋮ | `Menu` cũ có thể có hành vi riêng (bàn phím) — kiểm Tab / Esc / mũi tên trước khi thay; khác thì chỉ đổi ký tự |
| T6 | **J1:** "thiếu 1.5" → **"-1.5"**, "vượt 0.5" → **"+0.5"**, "đạt kỳ vọng" giữ | Giống cột Kết quả gần nhất ở Học viên & Lớp ("5.0 -1.5"); hết trùng chữ "Thiếu" | Số âm không màu thì dễ đọc nhầm — giữ màu `scoreToneText` + `title="dưới kỳ vọng 1.5"` |
| T7 | **J3:** một cách ghi **"⚠ quá hạn n ngày"** (component `QuaHan` sẵn có) | ⚠ + số ngày là luật B-3; "quá hạn từ W1 SEP" là mốc, không phải độ trễ | Việc theo tuần không có ngày hạn: tính từ Chủ nhật tuần đó (như `tongQuan.ts:136` đang cộng 7 ngày) |
| T8 | **J4:** bỏ hai câu giải thích (không chuyển vào ⓘ) | Luật chữ ngắn 05/10 | Không |
| T9 | **J7:** dòng việc **của chính người xem** không ghi người phụ trách; việc của người khác vẫn ghi tên. Cột "Người giữ việc" ở Tổng quan QL **giữ "Bạn"** (cột riêng, đúng nghĩa) | Ở danh sách việc của tôi, mọi dòng "Bạn" = thông tin thừa | Danh sách trộn việc người khác (QL xem Công việc) vẫn có tên → không mất thông tin |
| T10 | **J9:** "Xác nhận PA Tutor · đến lúc thi" → **"Xác nhận PA Tutor"** (bỏ phần mô tả, còn trong `title`) · ô trống "– sửa" → **"Nhập"**; ô có điểm giữ "6.5 sửa" · đầu cột S lưới máy tính ghi **tên thật** như màn từng kỹ năng ("GV chấm: Lê Thu Hà ▾") | Ba chữ đều đọc khó | Tên dài: `truncate` + `title` trong đầu cột |
| T11 | **J8 / DL:** tên lớp ở Điểm theo lớp, tiêu đề Nhập điểm thêm `title`; lưới chấm: chip "Đã hoàn tất" **xuống dòng dưới tên** (tên không cắt) | Không mất chữ | Dòng cao thêm 1 dòng chỉ ở em đã hoàn tất |
| T12 | **"Khác":** nhóm quyền "Khác" → **"Chưa xếp nhóm"**; Đề xuất sửa › ô "Khác" → **"Thông tin khác"**; Tutor "Khác" và danh mục lý do giữ | Hai chỗ đầu đọc không ra nghĩa | Không |
| T13 | **Lưu trữ rỗng:** khi ô tìm có chữ → "Không có lớp khớp "…"" / "Không có học viên khớp "…""; ô tìm trống giữ câu cũ | Hai tình huống khác nhau | Không |
| T14 | **K5 demo bar điện thoại một dòng:** `Demo` · `14/09/2026` · nút `Công cụ` · nút `Tài khoản` (chữ ngắn chỉ ở < 640 px; máy tính giữ nguyên) | ≈ 52 px thay ≈ 100 px; không cần nút gập | Chỉ bản demo; bản chính không có thanh này |
| T15 | **Đầu cột dính:** chỉ ở **≥ 768 px** và chỉ bảng **vừa khung** ở 1440 (không cần cuộn ngang). Bảng vẫn phải cuộn ngang (lưới nhiều cột) giữ như nay, ghi vào PR | Trình duyệt không cho vừa cuộn ngang trong khung vừa dính theo trang; làm cuộn dọc trong khung = cuộn lồng (KHUNG cấm) | Bảng bỏ `overflow-x:auto` ở md+ mà lại tràn → đo bằng `do-khung.mjs` từng bảng trước khi gắn lớp |
| T16 | **Mất kết nối:** `role="status"`; bấm "Thử lại" → nút khoá, chữ "Đang thử…", xong thì trở lại | Theo PR-PH | Không |
| T17 | **Hồ sơ cá nhân:** không sửa (form một cột hẹp là đúng) trừ khi ảnh thật lộ lỗi | "Có thật mới sửa" | Không |

## Câu cần chủ sản phẩm quyết (4 câu — mỗi câu có khuyến nghị)

1. **Phân tích › Tổng hợp (máy tính 1440)** — bảng 19 cột rộng hơn màn. **A (khuyến nghị):** đầu cột xuống 2 dòng, "Chờ Quản lý duyệt" → "Chờ duyệt", ô "16 (1 quá hạn)" → "16 ⚠1", gom "Cột hiện", "Xuất bảng này", "Xuất kết quả từng lượt" vào nút ⋯ → vừa 1440, đủ cột. **B:** mặc định ẩn nhóm "Xử lý" (6 cột), bật lại ở ⋯ › Cột hiện. Rủi ro A: đầu cột cao gấp đôi. Rủi ro B: QL không thấy số Case nếu không bật. *(mockup mục 4)*
2. **Điện thoại › thanh trên (mọi trang)** — mockup 23C không có nút Sáng/Tối. **A (khuyến nghị):** chuyển Sáng/Tối vào menu Tài khoản (bấm vòng tròn chữ cái) → thanh còn 3 nút như 23C. **B:** giữ nút Sáng/Tối trên thanh (4 nút). Rủi ro A: người quen bấm trên thanh phải tìm trong menu (một lần). *(mockup mục 5)*
3. **Mọi bảng › mã học viên** — nay hai dạng `000048` và `PISA-000048`. **A (khuyến nghị):** trên màn luôn `000048`; ô tìm nhận cả hai; file Excel xuất giữ mã đầy đủ `PISA-000048`. **B:** luôn `PISA-000048`. Rủi ro A: ai chép mã từ màn sang hệ thống khác phải thêm "PISA-" — file xuất vẫn đủ. *(mockup mục 7)*
4. **Nhập điểm › "Vắng"** — nút "Vắng" (điện thoại) báo có **Hoàn tác**, gõ "-" (máy tính) thì không (FT không báo gì). **A (khuyến nghị):** cả hai cùng một thông báo "Đã ghi vắng R · Tên" (lớp thường thêm "· dời W3 OCT") có **Hoàn tác**; Hoàn tác = xoá "-" (đúng đường gỡ vắng của PR-BV, không thêm luật). **B:** bỏ Hoàn tác ở nút điện thoại; muốn gỡ thì xoá "-" như máy tính. Rủi ro A: gõ "-" cho nhiều em liền → nhiều thông báo (mỗi ô một thông báo thay nhau, như nút điện thoại hôm nay). Rủi ro B: bấm nhầm "Vắng" trên điện thoại phải tìm lại ô để xoá. *(mockup mục 6)*

---

## Cấu trúc file

| File | Đổi | Task |
|---|---|---|
| `web/src/ui/Nhan.tsx` | `CHIP_TRON`, `CHIP_VUONG` (export), `Nhan` dùng `CHIP_TRON` | 1 |
| `web/src/ui/ui.tsx` | `Level`, `Task`, `Info`, `Status`, `Alert`, `Outcome`, `NhanTrangThai` lấy lớp từ hai hằng; `Field` gợi ý / `SectionNote` / `KpiTile` chữ 12 px | 1, 2 |
| `web/src/modules/students/MissingBadge.tsx` | `CHIP_VUONG` + tông `soon` (bỏ `amber-*`) | 1 |
| `ClassRoster.tsx:293`, `NhanViPham.tsx:42`, `HangTab.tsx:33`, `HangNhom.tsx:72,82`, `App.tsx:49`, `HoSoGiaoVienPage.tsx:168,175`, `ChuongLop.tsx:143,164`, `MeetingPage.tsx:373`, `SkillBoard.tsx:371` | dùng hằng chip | 1 |
| `StudentsPage.tsx:218, 357`, `DauTrangLop.tsx:174, 198`, `StudentDetailPage.tsx:214`, `LichTestTab.tsx:315`, `HieuQuaPa.tsx:119,129`, `NganXuatMt.tsx:177`, `NganXepLichMt.tsx:368` | `.nut-loc`, "+n" họ tròn, ⋯ | 1 |
| `web/src/index.css` | `.nut-loc`, `.bang-dinh`, `.hang-con > td` 12 px | 1, 2, 3 |
| ~10 file top K6 (ScoreEntry, TransitionPanel, HanhTrinh, MockDetailPage, BangCanHoTro, PhanTichGiaoVien, MeetingPage, CasePanel, MgmtTasksPage, StudentDetailPage) | chữ nội dung 11 → 12 px | 2 |
| bảng ở mục "Đầu cột dính" (Task 3) | gắn `.bang-dinh`, `card` → `overflow-clip` | 3 |
| `phanTich/TongHopTestSos.tsx`, `shared/domain/phanTich.ts` (chỉ nhãn "Chờ duyệt") | K2 | 4 |
| `App.tsx:139-152`, `platform/Header.tsx`, `platform/DemoBar.tsx`, `StudentsPage.tsx:174-191` | D7, K5, K1/DH | 5 |
| `SkillBoard.tsx:650`, `server/src/worklist/tongQuan.ts:115,136`, `KhoiCanXuLy.tsx:61`, `OverviewPage.tsx:94`, `server/src/worklist/mywork.ts:1221` + `WorkList.tsx`, `shared/domain/sosV4.ts:108`, `ScoreEntry.tsx:516`, `cham/GvCham.tsx`, `LuoiFT.tsx`, `LuoiThuong.tsx`, `MotKyNang.tsx`, `TabDiemLop.tsx:55`, `ChamDiemPage.tsx:84`, `StudentDetailPage.tsx:198,645-652`, `shared/domain/lopThuong.ts:63`, `chamDiem.ts:82`, `AdminPage.tsx:160`, `DeXuatSuaPanel.tsx:16`, `LuuTruPage.tsx:119,142`, mọi chỗ in `studentCode` (J2) | J, U12, bấm thử | 6 |
| `ScoreEntry.tsx:272-277`, `cham/LuoiThuong.tsx:239`, `cham/LuoiFT.tsx` | K4 thông báo | 7 |
| `DauTrangLop.tsx:94-100, 198` | "+n" dẫn đúng chỗ | 8 |
| `ChuyenLopPanel.tsx:150`, `ClassProgressPanel.tsx:97`, `CatalogAdmin.tsx:177,248`, `ScoreEntry.tsx:617-620`, `App.tsx:131-137` | SL, Mất kết nối | 9 |
| `server/src/students/hanhTrinh.ts:320-327` · `index.html`, `App.tsx:144`, `WelcomePage.tsx:137`, `server/src/index.ts:21`, `hocVienLop.tests.ts:71,73`, `README.md`, `DEMO.md`, `TRIEN_KHAI.md` | tuần học, tên web | 10 |
| `server/src/tests/prHk2.tests.ts` (mới) + `run.ts` (một dòng cuối) | phép kiểm | 1–10 |
| `thiet-ke/HE_GIAO_DIEN.md` §2 bảng chữ, §3 | ghi hai họ chip, `.nut-loc`, `.bang-dinh`, 12 px nội dung | 11 |

---

### Task 0: Duyệt + nền

- [ ] Chủ sản phẩm duyệt `thiet-ke/mockup-hk2-2026-10-07.html` mục 1–8 và trả lời Q1–Q4. Chưa duyệt thì **dừng**.
- [ ] Chỉ bắt đầu khi **PR-KHUNG** và **PR-LUI-a2 #229** đã merge (`gh pr list --state merged`). PR-TEN (đổi "Giữa khoá" → "Progress Test") nếu đã merge thì mọi chữ "Giữa khoá / Cuối khoá" trong mockup đọc theo tên mới.
- [ ] Nhánh `pr-hk2-badge-chu` từ `origin/main` mới nhất, worktree `.claude/worktrees/pr-hk2-badge-chu`, `PORT=4540 WEB_PORT=5540`.
- [ ] Đối chiếu lại bảng "Hiện trạng" bằng grep (dòng có thể dịch sau KHUNG / LUI-a2); mục nào đã xong thì ghi vào mô tả PR, bỏ qua.
- [ ] Chạy `node scripts/do-khung.mjs` (của KHUNG) trên main mới → lưu kết quả làm mốc "trước".

### Task 1: H1/H2 — hai họ chip + "Thiếu n", "+n", ⋯, nút lọc

**Files:** xem Cấu trúc file (Task 1). `/impeccable polish` phạm vi chip.

- [ ] **Đỏ** — `prHk2.tests.ts` (quét nguồn, gọi `runPrHk2Tests` cuối `run.ts`):
  - C1: `ui/Nhan.tsx` export `CHIP_TRON` và `CHIP_VUONG`; cả hai có `text-[11.5px]` và `leading-[18px]` và `border`.
  - C2: thân `Level`, `Task`, `Info`, `Status`, `Alert`, `Outcome`, `NhanTrangThai` (`ui.tsx`), `MissingBadge`, `NhanViPham` dùng `CHIP_TRON` hoặc `CHIP_VUONG`, không còn `text-[11px]` trong thân.
  - C3: quét `web/src/**/*.tsx`: không dòng nào có `rounded-full` cùng `text-[11` / `text-xs` / `px-1.5` / `px-2` (dáng chip) **ngoài** `ui/Nhan.tsx` và danh sách cho phép (chấm tròn, avatar, công tắc, `KhungPanel.tsx:120` vòng số bước, `cham/MotKyNang.tsx:73` nút điểm 44 px) — ghi danh sách ngay trong phép kiểm.
  - C4: `MissingBadge.tsx` không còn `amber-`; thêm file này vào danh sách cấm màu của `nenGiaoDien.tests.ts:55`.
  - C5: không còn `"⋮"` trong `web/src/**/*.tsx`; `StudentDetailPage.tsx` không còn `<Menu label=`.
  - C6: các chỗ nút lọc viên thuốc (5 file T4) dùng `nut-loc`; `index.css` có `.nut-loc`.
- [ ] Chạy `npm run build:server && node dist-server/server/src/tests/run.js` → C1–C6 **đỏ**. Commit `test(hk2): chip hai họ, ⋯, nút lọc (đỏ)`.
- [ ] `Nhan.tsx`: `export const CHIP_TRON = 'inline-flex items-center whitespace-nowrap rounded-full border border-transparent px-[7px] text-[11.5px] font-bold leading-[18px]'`; `export const CHIP_VUONG = 'inline-flex items-center whitespace-nowrap rounded-md border px-1.5 text-[11.5px] font-semibold leading-[18px] tabular-nums'`. `Nhan` dùng `CHIP_TRON` (viền đứt `dut` giữ).
- [ ] `ui.tsx`: `Level` → `CHIP_TRON` + tông như nay; `Task`, `Info`, `Status`, `Alert`, `Outcome`, `NhanTrangThai` → `CHIP_VUONG` + tông như nay (giữ vạch 3 px của `Task`, `pending` của `Info`). `NhanLoai` (`SkillBoard.tsx:371`) → `CHIP_VUONG`.
- [ ] `MissingBadge.tsx:79` → `CHIP_VUONG` + `border-soon-line bg-soon-bg text-soon`; `ClassRoster.tsx:293` → `CHIP_VUONG`; `NhanViPham.tsx:42` → `NhanTrangThai` hoặc `CHIP_VUONG`.
- [ ] Số đếm `HangTab.tsx:33`, `HangNhom.tsx:72,82`, `App.tsx:49`, `HoSoGiaoVienPage.tsx:168,175`, `ChuongLop.tsx:143,164`, `MeetingPage.tsx:373` → `CHIP_TRON` + tông sẵn có.
- [ ] "+n": `StudentsPage.tsx:357`, `DauTrangLop.tsx:198` → `MenuDong` nhận prop mặt nút `kieu="chip"` (một dòng: lớp nút = `CHIP_TRON` + `bg-muted-bg text-muted`, `min-h-[28px]`, điện thoại nới vùng bấm như `Nhan`). Không thêm component.
- [ ] ⋯: `DauTrangLop.tsx:174` bỏ `bieuTuong="⋮"`; `StudentDetailPage.tsx:214` `<Menu label="⋮">` → `MenuDong` (kiểm bàn phím trước — T5).
- [ ] `.nut-loc` trong `index.css` (`@layer components`): lấy đúng lớp đang ở `StudentsPage.tsx:218`; năm chỗ dùng lớp này.
- [ ] Xanh C1–C6. Ảnh 1440 + 375, sáng + tối: Học viên & Lớp, Hồ sơ lớp, Công việc, Tổng quan QL/GV, Lịch Test, Phân tích › Hiệu quả PA, Hồ sơ GV — so mockup mục 1–2. Commit `feat(hk2): H1/H2 hai họ chip một cỡ, "+n" họ tròn, ⋯ một kiểu`.

### Task 2: K6 — chữ nội dung 12 px

- [ ] **Đỏ** — C7: `Field` (gợi ý/lỗi), `SectionNote`, `KpiTile` (ví dụ, dòng phụ) trong `ui.tsx` không còn `text-[11px]`; `index.css` `.hang-con > td` không còn `11.5px`. C8 (chặn tăng lại): tổng số `text-[11px]` trong `web/src` **≤ 200** (nay 353; ghi số thật sau khi sửa vào phép kiểm — chỉ được giảm).
- [ ] Sửa lớp chung trước (`ui.tsx`, `index.css`), rồi theo file top K6: đổi `text-[11px]` → `text-xs` **chỉ** ở meta dòng, nhãn ô, mô tả, gợi ý; **giữ** 11 px ở: tiêu đề cột (`.th`, `<Th>`), mã (`000048`), chú giải, ký hiệu nhỏ (HE_GIAO_DIEN §2). Sửa theo từng file, không thay hàng loạt.
- [ ] `/impeccable polish` các màn đã sửa; ảnh 1440 không cao thêm quá 1 dòng mỗi hàng. Xanh C7–C8. Commit `feat(hk2): K6 chữ nội dung 12 px`.

### Task 3: Đầu cột dính ở bảng dài (≥ 768 px)

- [ ] **Đỏ** — C9: `index.css` có `.bang-dinh` (ở `md:`: khối bọc `overflow: visible`, `thead th` `position: sticky; top: calc(-1 * 1.25rem)` = `md:p-5` của `<main>` như KHUNG G1). C10: mỗi bảng trong danh sách dưới có `bang-dinh` và khung `card` của nó không còn `overflow-hidden` (dùng `overflow-clip` — giữ bo góc mà không thành khung cuộn).
- [ ] Danh sách (đo từng bảng bằng `do-khung.mjs` ở 1440 — **vừa khung mới gắn**; không vừa thì ghi vào PR, giữ cuộn ngang): Tổng quan `KhoiCanXuLy.tsx:74`, `LopToiDay.tsx:88`, `BranchPulse.tsx:83` · Hồ sơ lớp `ClassRoster.tsx:174`, `BangDiemLopThuong.tsx:122`, `ClassIssueBoard.tsx:38,68`, `TabTongKetLop.tsx:88` · Kế hoạch Test `LuoiKeHoach.tsx:69` · Lịch Test `HangLop.tsx:105`, `KhoiNo.tsx:99` · Nhập điểm / Điểm theo lớp `LuoiFT.tsx:129`, `LuoiThuong.tsx:319` · Quản trị `AdminPage.tsx:237`, `AccountsAdmin.tsx:160`, `CatalogAdmin.tsx:61,97` · Công việc `MgmtTasksPage.tsx:204`, `MeetingPage.tsx:229` · Phân tích › Tổng hợp (sau Task 4).
- [ ] `/impeccable adapt`: dưới 768 px giữ nguyên (cuộn ngang trong khung như nay). Kiểm: lăn trang dài → đầu cột sát mép trên, không hở chữ; panel, menu ⋯, lịch `LichNho` vẫn đúng chỗ.
- [ ] Xanh C9–C10; `do-khung.mjs` không thêm lỗi cuộn lồng / html cuộn. Commit `feat(hk2): đầu cột dính ở bảng dài (máy tính)`.

### Task 4: K2 — Phân tích › Tổng hợp (theo Q1)

- [ ] **Đỏ** — C11: `TongHopTestSos.tsx` không còn chữ `quá hạn)`; có `⚠`. C12: "Cột hiện" và hai nút xuất nằm trong một `MenuDong` (không còn `Cột hiện ▾` ngoài). C13 (Q1 = A): đầu cột bảng này `whitespace-normal`; `phanTich.ts` cột `choDuyet` nhãn "Chờ duyệt" (Excel giữ `goiY` đầy đủ).
- [ ] Sửa theo Q1. Ô "16 ⚠1": ⚠ màu `text-late`, `title="1 quá hạn"`. Menu ⋯: các ô tick "Cột hiện" + "Xuất bảng này" + "Xuất kết quả từng lượt" (giữ điều kiện `session?.nav?.xuatMt`).
- [ ] Đo: bảng FT ≤ 1398 px ở 1440 (Q1 = A) → gắn `.bang-dinh`. `/impeccable layout`. Xanh C11–C13. Commit `feat(hk2): K2 Tổng hợp vừa 1440, "16 ⚠1", gom nút vào ⋯`.

### Task 5: Điện thoại — thanh trên 23C (D7), demo bar (K5), Học viên & Lớp (K1/DH)

- [ ] **Đỏ** — C14: `App.tsx` thanh trên có chữ `PISA` hiện ở `< 640 px` (khối chữ "PISA Tracking" ẩn ở sm-); `Header.tsx` nút Tìm / Thông báo / Tài khoản < 640 px không viền (`max-sm:border-0 max-sm:bg-transparent`), biểu tượng 20; số chưa đọc `max-sm:absolute` đè góc. C15 (Q2 = A): `CongTacGiaoDien` < 640 px nằm trong menu Tài khoản, không trên thanh. C16: `DemoBar.tsx` có chữ ngắn `Công cụ` / `Tài khoản` ở `sm:hidden`. C17: `StudentsPage.tsx` ô tìm placeholder `Lọc trong danh sách này…`; "+ Lớp mới" / "+ Học viên" có `max-sm:hidden` và cùng mục trong `MenuDong "Thao tác trang"` (chỉ < 640 px).
- [ ] Code theo mockup mục 5; máy tính (≥ 640 px) **giữ nguyên** thanh trên và demo bar. `/impeccable adapt` 375: tổng chiều cao demo bar + thanh trên ≤ 108 px (nay ≈ 155); mọi nút ≥ 44 px.
- [ ] Xanh C14–C17. Commit `feat(hk2): D7 thanh trên điện thoại theo 23C, demo bar một dòng, + Lớp mới vào ⋯`.

### Task 6: Chữ — J1, J2, J3, J4, J7, J8, J9, U12, "Khác", Lưu trữ rỗng

`/impeccable clarify` phạm vi các chữ dưới. Chữ đúng như mockup mục 7.

- [ ] **Đỏ** — C18: `gapText` trả `-1.5` / `+0.5` / `đạt kỳ vọng` (kiểm hàm `shared` nếu chuyển sang `shared`, không thì quét nguồn). C19: `KhoiCanXuLy.tsx` không còn `Gộp hai khung`; `OverviewPage.tsx` không còn `Chỉ phần số đổi`. C20 (DB test): `tongQuan` không còn chuỗi `quá hạn từ`; mọi dòng quá hạn ghi `quá hạn n ngày`. C21 (DB test): `myWork` của người xem → việc của chính họ `owner` = null (web không in "Bạn"). C22: `sosV4.ts` nhãn "Xác nhận PA Tutor" không chứa `·`. C23: `ScoreEntry.tsx` ô trống ghi `Nhập`, không còn `'–'` trước `sửa`. C24 (Q3 = A): không còn `{h.studentCode}` / `studentCode}` in thẳng ra màn ở các file J2 — đi qua `maHocVienNgan`. C25: `lopThuong.ts`, `chamDiem.ts` không còn `(đã chấm)`. C26: `AdminPage.tsx` không còn `ten: 'Khác'`; `DeXuatSuaPanel.tsx` nhãn `Thông tin khác`.
- [ ] Sửa:
  - J1 `SkillBoard.tsx:650` (T6), giữ màu + `title`.
  - J2 theo Q3; ô tìm `Header.tsx` nhận `000048` và `PISA-000048` (kiểm máy chủ tìm theo `LIKE` đã nhận cả hai — chưa thì thêm một dòng chuẩn hoá ở máy chủ, phép kiểm DB).
  - J3 `tongQuan.ts:115,136` (T7). J4 bỏ hai câu. J7 `mywork.ts:1221` (T9).
  - J8 `TabDiemLop.tsx:55`, `ChamDiemPage.tsx:84` thêm `title`; lưới chấm: tên `break-words`, chip "Đã hoàn tất" xuống dòng dưới tên (T11).
  - J9 (T10): `sosV4.ts:108`; `ScoreEntry.tsx:516-517`; `GvCham.tsx` đầu cột S lưới máy tính truyền `chiTen` như `MotKyNang.tsx:167`.
  - U12: `StudentDetailPage.tsx:645-646` chấm dở có môn trượt → dòng "Không đạt: …" màu `text-soon` (cùng màu số tạm SOS 1 ở bảng Mock Test); `lopThuong.ts:63`, `chamDiem.ts:82` bỏ " (đã chấm)".
  - "Khác" (T12), Lưu trữ rỗng (T13).
- [ ] Xanh C18–C26. Ảnh: Tổng quan QL/GV, hồ sơ HV (Học thuật, Mock, lớp thường), Nhập điểm, Điểm theo lớp, Lưu trữ, Quản trị › Quyền. Commit `fix(hk2): chữ J1–J9, U12, "Khác", Lưu trữ rỗng`.

### Task 7: K4 — "Vắng" thống nhất (theo Q4)

- [ ] **Đỏ** — C27 (Q4 = A): `LuoiThuong.tsx` và `LuoiFT.tsx` đường gõ "-" (bật vắng) gọi cùng hàm thông báo với nút "Vắng" (`useToastVang` — chuyển ra chỗ dùng chung, ví dụ `cham/thongBaoVang.ts`), có Hoàn tác; không còn chuỗi `Đã dời ${` riêng. (Q4 = B: `ScoreEntry.tsx` không còn `toast.hoanTac` cho vắng.)
- [ ] Code: Hoàn tác = gửi `noShow: false` (đúng đường gỡ vắng PR-BV `LuoiThuong.tsx:233-241`); chữ "Đã ghi vắng R · Tên" + lớp thường " · dời W3 OCT" (tuần lấy từ `r.tuanMoi`). Khoá toast theo ô (giữ `key: vang:<id>`).
- [ ] Bấm thử: máy tính gõ "-" → thông báo → Hoàn tác → ô trống, lịch về tuần cũ; điện thoại nút Vắng → như cũ. Lớp thường + FT. Xanh C27. Commit `fix(hk2): K4 vắng một thông báo ở mọi màn nhập điểm`.

### Task 8: DH — "+n" hồ sơ lớp dẫn đúng chỗ

- [ ] **Đỏ** — C28: `DauTrangLop.tsx` `bamBadge` có nhánh `thieu-gv` (→ `onViec('phan-cong')` khi `viewer.canAssign || canAssignSubject`, không thì `null`) và `thieu-tt` (→ `/hoc-vien?view=thieu_tt&classId=…`); mục `chang` không vào `muc` của `MenuDong` (hiện thành chữ). Mục không bấm được (không quyền) hiện là chữ thường, không phải nút.
- [ ] Code (một hàm, hai nhánh + lọc `chang`). Bấm thử QL / GVCN / GVBM. Xanh C28. Commit `fix(hk2): "+n" hồ sơ lớp mở đúng chỗ`.

### Task 9: Panel (SL) + Mất kết nối

- [ ] **Đỏ** — C29: `ChuyenLopPanel.tsx`, `ClassProgressPanel.tsx`, `CatalogAdmin.tsx` không còn `nhan: 'Đóng'` (để `KhungPanel` tự chọn theo `chan.daSua`). C30: hộp bốn tiêu chí (`ScoreEntry.tsx`) truyền `daSua` để Esc / bấm nền hỏi trước khi bỏ (dùng cơ chế sẵn của `KhungPanel` như các panel form khác). C31: `App.tsx` dải mất kết nối `role="status"`, nút có `disabled` khi đang thử và chữ `Đang thử…`.
- [ ] Code. `nganPanel`: bấm thử panel cha + con (Hồ sơ lớp › Chuyển lớp, Tạo Case từ hồ sơ HV) — Esc đóng con trước? Đúng thì thôi; sai thì sửa thứ tự đẩy (`KhungPanel.tsx:62-68`) + phép kiểm.
- [ ] Xanh C29–C31. Commit `fix(hk2): chân panel theo daSua, Esc hộp tiêu chí, dải mất kết nối`.

### Task 10: Máy chủ — tuần học khi không có lộ trình đang chạy · tên "PISA Tracking"

- [ ] **Đỏ trên DB test** — C32: dựng em ghi danh FT `active` + lộ trình `completed` (không có `active`) → `hanhTrinh` chương đang học **không** có "tuần học n"; `profile` `dangChay` null; `transition` không tuần học — ba chỗ cùng không ghi. Chương đã rời giữ cách tính cũ. Chạy → đỏ ở `hanhTrinh`.
- [ ] Sửa `hanhTrinh.ts:320-327`: chương đang học chỉ tính tuần khi có lộ trình `active` (không gọi `loTrinhTinhTuan` rơi về lộ trình gần nhất cho chương đang học). Xanh C32.
- [ ] Tên web: `index.html:7`, `App.tsx:144`, `WelcomePage.tsx:137`, `server/src/index.ts:21`, `README.md:1`, `DEMO.md:1`, `TRIEN_KHAI.md:1` → "PISA Tracking"; sửa phép kiểm `hocVienLop.tests.ts:71,73` sang chữ mới (đỏ trước khi đổi `index.html`), chú thích `suaLoiNong.tests.ts:282`. **Không** đổi tên gói npm, site Netlify, DB, sổ tay (PR-SOTAY).
- [ ] Commit `fix(hk2): Hành trình không ghi tuần học khi không có lộ trình đang chạy; tên PISA Tracking`.

### Task 11: Kiểm cuối, ảnh, audit, PR

- [ ] `node scripts/do-khung.mjs` → không thêm lỗi so với mốc Task 0.
- [ ] Ảnh nghiệm thu `thiet-ke/anh/hk2/`: mỗi màn ở mockup mục 1–7 × 1440/375 × sáng/tối, ≥ 3 vai (Quản trị 1, QL 2, GVCN 7, GVBM 9). Hồ sơ cá nhân 1440 (T17).
- [ ] `thiet-ke/HE_GIAO_DIEN.md`: §2 bảng chữ (12 px chữ nội dung; badge 11,5 px cao 20 px) · §3 thêm `CHIP_TRON` / `CHIP_VUONG`, `.nut-loc`, `.bang-dinh`.
- [ ] `/impeccable audit` toàn web, `/ponytail-review`. `npm run check` **một lần**, foreground.
- [ ] `[x]` các mục H1, H2, K1, K2, K4–K7, J1–J4, J7–J9 trong `2026-10-02-ux-sau-critique.md`; một dòng mục 11 `plan.md`; `CODE_MAP.md` nếu thêm file.
- [ ] Mở PR vào `main`, **không merge**. Mô tả: model thật; từng ID (bảng Hiện trạng) — làm / đã xong trước / bác bỏ; phép kiểm C1–C32; ảnh; chú thích `ponytail:`; ảnh sổ tay `docs/so-tay/` bị lệch (để PR-SOTAY).

---

## Nghiệm thu

1. Toàn web chỉ còn **hai họ badge** cộng `KetQuaDot`: tròn (trạng thái HV/lớp, số đếm) và vuông viền (trạng thái việc, "Thiếu n"), cùng 11,5 px, cao 20 px — ảnh mockup mục 1–2 khớp web thật 1440/375 sáng/tối.
2. Chỉ một kiểu nút menu ⋯; "+n" là chip tròn bấm được; "+n" ở hồ sơ lớp mở đúng chỗ (Phân công GV / danh sách thiếu thông tin), nhãn chặng là chữ.
3. Chữ nội dung (meta dòng, nhãn ô, gợi ý) 12 px; tiêu đề cột và badge giữ 11–11,5 px; 1440 không cao thêm quá 1 dòng mỗi hàng.
4. Máy tính: lăn bảng dài ở Tổng quan, Hồ sơ lớp, Test, Nhập điểm, Quản trị, Công việc → đầu cột dính sát mép trên; bảng phải cuộn ngang được liệt kê trong PR.
5. Phân tích › Tổng hợp vừa 1440 (theo Q1), "16 ⚠1", nút gom vào ⋯.
6. Điện thoại: thanh trên = 23C (PISA · tìm · chuông · tài khoản); demo bar một dòng; Học viên & Lớp "+ Lớp mới" trong ⋯, ô tìm "Lọc trong danh sách này…".
7. Chữ ở mockup mục 7 hiện đúng trên web; "Vắng" một thông báo ở mọi màn (theo Q4).
8. Hành trình không ghi tuần học khi em không có lộ trình đang chạy; tên "PISA Tracking" ở tab trình duyệt, thanh trên, màn chào.
9. `prHk2.tests.ts` C1–C32 xanh trong `npm run check`; `do-khung.mjs` không thêm lỗi.

## File chồng với PR khác

| PR | File chung | Cách tránh |
|---|---|---|
| **PR-KHUNG** (đang code) | `ui/ui.tsx` (`NutChon`, `BoLocDoan`), `HangTab.tsx` (mép mờ `max-sm:`), `StudentsPage.tsx:273` (`md:-top-5`), `index.css:245`, `WorkList.tsx:60,63`, `ViecTiep.tsx`, `AdminPage.tsx:95` | HK2 chạy **sau** KHUNG merge; giữ mọi lớp `max-sm:` / `-top-5` của KHUNG; `.bang-dinh` dùng cùng giá trị top với KHUNG G1 |
| **PR-LUI-a2 #229** (mở) | `DauTrangLop.tsx` (mục ⋮/⋯ Case?), `CapNhatTuan.tsx`, `ThaoTacCase.tsx`, Chờ duyệt | HK2 chạy sau merge; Task 0 grep lại `DauTrangLop.tsx` |
| **PR-TEN** (chưa chạy) | ~130 file chữ "Giữa khoá / Cuối khoá" (gồm `phanTich.ts`, `lopThuong.ts`) | Nếu TEN chạy sau HK2: TEN đổi chữ trên mã đã gom; nếu trước: HK2 đọc tên mới. Không chồng logic |
| **PR-EN** (sau HK2) | mọi chữ GV | HK2 chốt chữ Việt trước; EN dịch trên chữ đã gọn |
| **PR-SOTAY** (sau EN) | `docs/so-tay/*` | HK2 không chụp ảnh sổ tay, chỉ liệt kê ảnh lệch |

## Prompt bước 2 — session code (dán nguyên khối, SAU khi mockup duyệt + KHUNG, LUI-a2 merge)

**PR-HK2** — Opus 5.5 · High (B: Sonnet 5.5 · High) — cả hai chạy tiếp, ghi model thật vào mô tả PR; Fable hoặc model khác thì DỪNG
```
/ponytail lite
Làm PR-HK2 theo docs/superpowers/plans/2026-10-07-pr-hk2-badge-chu.md (Task 0 → 11) + prompt chung plan.md mục 9.0.
Đầu phiên nói model đang chạy. Không Fable kể cả subagent.
Chỉ bắt đầu khi PR-KHUNG và PR-LUI-a2 #229 đã merge. Nhánh pr-hk2-badge-chu từ origin/main mới nhất,
worktree .claude/worktrees/pr-hk2-badge-chu, PORT=4540 WEB_PORT=5540.
Mockup đã duyệt: thiet-ke/mockup-hk2-2026-10-07.html mục 1–8; đọc câu trả lời Q1–Q4 trong kế hoạch.
Tinh chỉnh, KHÔNG làm lại: phông, màu, bố cục giữ. Chữ trên màn ngắn, đúng chữ mockup, không câu giải thích dưới nút/ô.
Ô ngày (nếu chạm) = ô gõ + nút lịch (ONgay). Không chụp lại sổ tay (PR-SOTAY). Không toast Hoàn tác vi phạm.
Task 0: grep lại bảng "Hiện trạng" — mục đã xong thì ghi vào PR, không làm lại.
Đỏ trước: prHk2.tests.ts C1–C32 (Task 10 đỏ trên DB test). Sửa ở gốc chung (CHIP_TRON / CHIP_VUONG, .nut-loc, .bang-dinh), component chip giữ tên/API.
Impeccable: /impeccable polish (Task 1, 2), /impeccable layout (Task 4), /impeccable adapt (Task 3, 5, 7), /impeccable clarify (Task 6), cuối /impeccable audit toàn web.
Đo: node scripts/do-khung.mjs trước (mốc) và sau (không thêm lỗi). Ảnh 1440/375 sáng/tối ≥ 3 vai vào thiet-ke/anh/hk2/.
/ponytail-review. npm run check MỘT lần, foreground. Mở PR vào main, KHÔNG merge.
Mô tả PR: model thật, từng ID (làm / đã xong trước / bác bỏ), C1–C32, ảnh, chú thích ponytail:, ảnh sổ tay lệch.
```

## Cái bỏ qua (và khi nào thêm)

- **Đổi tên component chip / gộp thành một component:** không — hai hằng lớp đủ; ≈ 100 chỗ gọi giữ nguyên. Gộp khi có lý do khác ngoài hình.
- **Đầu cột dính cho bảng phải cuộn ngang:** không (T15) — thêm khi chủ sản phẩm chấp nhận khung bảng cao cố định có cuộn riêng.
- **K6 sửa hết 297 chỗ 11 px:** không làm một lượt — lớp chung + 10 file top; phép kiểm C8 chặn tăng lại, lượt sau hạ trần dần.
- **Phép kiểm Playwright trong `npm run check`:** không (máy yếu RAM) — dùng `do-khung.mjs` chạy tay như KHUNG.
