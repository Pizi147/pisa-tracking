# PR KHUNG-LOI — khung không vỡ (07 mục 4, GĐ1)

> Opus 5.5 · nhánh `claude/khung-loi-994378` · cổng PORT=4417 WEB_PORT=5617 · loại: **giao diện không đổi bố cục** (PTA tự merge).
> Phụ thuộc **CONG-CU** (phép kiểm "bấm trong lịch không đóng hộp cha" + `do-bang` gắn `do-khung`). PHA 2 chỉ bắt đầu khi PTA nhắn
> "BẮT ĐẦU KHUNG-LOI" → `git fetch origin && git merge origin/main` trước. Song song: SL1 (sửa kiểu trong hộp thời gian — KHÔNG đụng),
> CV-LOI (có thể chạm `loaiYeuCau.ts`) → `git merge origin/main` trước khi mở PR.
> Nguồn: 07 dòng KHUNG-LOI · đánh giá 20/10 mục 10.0 I.2 + 10.1 (thứ tự menu), 12.7 · a1 A1-05/07/09 · b B-02/05/08/09 · a4 TST-05 ·
> v3b V3B-09 · v4c V4C-03 · 04 dòng "Thanh trên" / "Thanh dưới 375" / "Đầu trang một hàng" (phần tiêu đề).
> Đầu phiên: `/ponytail lite`; impeccable `harden`, `adapt` trong phạm vi PR; cuối: `/impeccable audit` + `/web-design-guidelines` → `/ponytail-review`.

## Giả định (ghi vào "Cần chủ SP xác nhận" nếu PTA không sửa)
- G1 — Thanh trên co theo **chỗ thật** (đo, không mốc px cố định): mục không vừa dồn từ cuối vào "Thêm ▾" (Tutor trước, rồi Phân tích…).
  Lý do: chủ SP dùng 1 280–1 366 px zoom 125 % (= ~1 024–1 093 px CSS) — mốc cố định sẽ sai ở máy thật (a1 A1-05, đánh giá 6.5).
- G2 — Dưới 1 440 px ô tìm thu thành nút kính lúp (như điện thoại) — 04 "Thanh trên". Chuông có số thay chữ "Thông báo", logo bấm:
  **không** làm ở PR này (M0).
- G3 — Thanh dưới < 768 px: > 5 mục → 4 mục đầu + "Thêm" (mở lên). QL/QT: Tổng quan · Học viên · Test · Công việc · Thêm (Phân tích, Tutor).
  Head tutor (1 mục) → ẩn thanh dưới (04 "Thanh dưới 375").
- G4 — Menu Tài khoản (B-09, câu Q3 chưa ai trả lời): **giữ đủ nội dung**, chỉ giới hạn cao (≤ màn − thanh trên) + cuộn trong menu,
  "Đăng xuất" dính đáy menu. Chuyển phạm vi / kỹ năng sang Hồ sơ cá nhân = việc của M0.
- G5 — Tiêu đề = tên menu ở MỌI vai: QL/QT/Admin/CX/TVV → "Tổng quan"; Admin ở Công việc → "Công việc" (không "Chấm điểm").
  Khối "Học viên của tôi" (TVV) / "Số liệu" (CX) giữ tên làm tiêu đề khối (h2), không làm h1.
- G6 — A1-09 chỉ sửa chữ "Nếu duyệt" của thẻ Đề xuất PA: ghi **ngày** hạn kết quả đầu (cùng hàm hạn kỳ PA `week.ts`), bỏ "T3".
  Hàng gọn 4 cột (bố cục mới) = M1, không làm ở đây.
- G7 — Menu ⋯ hồ sơ HV (V4C-03): sửa **hành vi phím** của `ui/Menu.tsx` cho cả 3 nơi gọi (mở → focus mục đầu, ↑/↓/Home/End, Esc/Tab
  → focus về nút). Gộp hẳn vào `MenuDong` (đổi dáng nút) = GĐ3, ghi trong PR.
- G8 — TST-05: chú giải vẫn ở ⓘ "Luật xếp lịch Test", nhưng **sinh từ bảng màu thật** (chip mẫu + chữ). Dải chip mẫu dưới hàng lọc
  (đổi bố cục) = M5.

## Task 1 — Thứ tự menu đã chốt 20/10 (I.2)
- `shared/domain/dieuHuong.ts:46-55` `KHU_VUC`: Tổng quan → Học viên & Lớp → Test → **Công việc → Phân tích** → Tutor (đổi chỗ 2 dòng).
- Đỏ trước: `server/src/tests/prOv15e.tests.ts:84`, `khung.tests.ts:54` đổi chuỗi mong đợi → đỏ → đổi `KHU_VUC` → xanh.
- Hướng dẫn: rà `shared/huongDan/*.ts` câu nói thứ tự menu / "thanh trên"; `data-hd="nav-*"` giữ nguyên (gv.ts:12, admin.ts:38 trỏ
  Công việc / Test — luôn ở thanh chính). Nếu mục có `data-hd` rơi vào "Thêm", "Chỉ cho tôi" phải trỏ nút "Thêm"
  (kiểm `prHd.tests.ts` HD-NAV / HD-CHI xanh).
- Sửa chú thích lỗi thời `web/src/App.tsx:66` ("BỐN KHU VỰC") nếu chạm.

## Task 2 — Thanh trên không cắt + thanh dưới ≤ 5 (A1-05)
- Hàm thuần mới trong `shared/domain/dieuHuong.ts`: `chiaMucThanh(muc, rongMuc: number[], rongCo, rongThem) → { hien, them }`
  (giữ thứ tự; dồn từ cuối; mục đang mở nằm trong `them` → nút Thêm sáng) và `chiaThanhDuoi(muc, toiDa = 5)`
  (≤ 5 giữ nguyên; > 5 → 4 đầu + phần còn lại vào Thêm). Phép kiểm `server/src/tests/prKhungLoi.tests.ts` (gọi cuối `run.ts`):
  6 mục / đủ chỗ → 0 vào Thêm; thiếu 1 mục → Tutor vào Thêm; thiếu 2 → Phân tích + Tutor; QL 6 mục thanh dưới → 4 + Thêm;
  Admin 5 → 5, không Thêm; GV 3 → 3; Head tutor 1 → thanh dưới ẩn (`chiaThanhDuoi` trả rỗng khi ≤ 1).
- `web/src/App.tsx:206-208`: bỏ `overflow-x-auto` của `<nav>`; `useLayoutEffect` + `ResizeObserver` trên khung nav: đo rộng từng
  `NavItem` (một lần, lưu `ref`), gọi `chiaMucThanh`, vẽ `hien` + nút "Thêm ▾" (số Công việc / Tutor bên trong mục, tổng badge trên nút).
  Thêm = `MenuDong` (portal, phím đúng sẵn) — thêm prop mặt nút (`mat` + lớp nút) thay cho ô ⋯; mục chọn → `navigate(to)`.
- `App.tsx:270-275` thanh dưới: `chiaThanhDuoi`; "Thêm" là `NutDay` thứ 5 mở `MenuDong` lên (MenuDong đã tự mở lên khi thiếu chỗ, z-[60]
  trên thanh z-30). Nhãn thanh dưới 11,5 → 12 px (B-07 chỉ phần thanh dưới, 04 "chữ 12").
- `Header.tsx:194-205`: ô tìm thu thành nút kính lúp khi `< 1440` (hook media `(max-width: 1439px)` như `useDienThoai`); ở máy tính hộp
  tìm thả dưới nút, rộng `min(26rem, 100vw − 2rem)` (không neo hai mép như điện thoại). `data-hd="tim-hv"` nằm trên nút. Câu Hướng dẫn
  `gv.ts:52` "ô Tìm… trên thanh trên" → "ô / nút Tìm" nếu cần.
- `do-khung`: thêm cỡ **1 100 × 800** vào vòng đo chung (`scripts/do-khung.mjs:235`) + phép đo **f "thanh trên cắt"**: `nav` chính
  `scrollWidth > clientWidth + 1` hoặc mục nào có `getBoundingClientRect().right > nav.right` → lỗi; **g "thanh dưới > 5 nút"** ở < 768.
  Đỏ trước trên main ở 1 280 / 1 100 (đã biết: 587 / 570 / 475 px).

## Task 3 — Hook "bấm ra ngoài" dùng chung + vá `BoChonThoiGian` (12.7, V3B-09)
- Mới `web/src/ui/useBamNgoai.ts` (~20 dòng):
  `useBamNgoai(mo, onNgoai, ...trong: RefObject<Element|null>[]) → { onMouseDownCapture }`.
  Cú bấm là "trong" khi (a) đích nằm trong một `ref` truyền vào (DOM), HOẶC (b) sự kiện React đi qua phần tử gắn `onMouseDownCapture`
  — React đẩy sự kiện qua **cây React**, nên bấm trong portal con (`LichNho`, `MenuDong`, hộp chọn người) vẫn là "trong".
  So bằng **chính đối tượng sự kiện** (`ref = e.nativeEvent`; bộ nghe `document` so `e === ref`) — không cờ tồn đọng.
  Bộ nghe `mousedown` trên `document` chỉ gắn khi `mo`; `onNgoai` qua `ref` (không gắn lại mỗi lần vẽ). Esc giữ nguyên từng nơi.
- Thay 15 bản (12.7): `ChipSos.tsx:30` · `MenuDong.tsx:81` · `Menu.tsx:37` · `LichNho.tsx:88` · `ScoreEntry.tsx:390` (giữ điều kiện
  `dangLuu`) · `PeoplePicker.tsx:53` · `NutLuat.tsx:21` · `ChonPhuTrach.tsx:60` · `BoChonThoiGian.tsx:30` · `HopNhapDiem.tsx:558`
  (giữ `daGo`) · `MissingBadge.tsx:56` · `TimLop.tsx:21` · `TimKeHoach.tsx:40` · `HopKyNang.tsx:328` · `Header.tsx:71`.
  Nút mở nằm ngoài khung (ChipSos, MissingBadge, HopKyNang `anchor`, MenuDong `nut`) → truyền `ref` nút. `HopKyNang` đang bỏ qua mọi
  `[role=dialog],[role=menu]`: kiểm hộp / menu nó mở có là con React của nó không — có → (b) đủ; không → giữ ngoại lệ đó riêng tại chỗ
  (ghi chú `ponytail:`).
- `BoChonThoiGian.tsx:25-33` (gốc lỗi): dùng hook, gắn `onMouseDownCapture` lên `hop` → bấm ‹ › / ngày trong `LichNho` (portal,
  `LichNho.tsx:208`) không đóng hộp. KHÔNG đổi kiểu / bố cục trong hộp (SL1).
- Đỏ trước: phép kiểm CONG-CU "bấm trong lịch không đóng hộp cha" — **gỡ dòng miễn `BoChonThoiGian`** → đỏ → vá → xanh.
  Thêm vào `do-khung` kịch bản bấm thật (1440 + 375): Phân tích, Tutor, panel một tutor, Bộ lọc thêm (Học viên & Lớp) — mở hộp thời gian
  → kiểu theo tuần → mở lịch → bấm ‹ rồi › → bấm một tuần → hộp còn mở và ô tuần đổi đúng tuần đã bấm.
- Hồi quy: bấm ngoài vẫn đóng ở cả 15 chỗ (kịch bản `do-khung` sẵn có mở các hộp này + bấm `body`); Esc như cũ.

## Task 4 — Menu ⋯ hồ sơ HV giữ focus (V4C-03)
- `web/src/ui/Menu.tsx`: mở → focus `[role=menuitem]` đầu; ↑/↓/Home/End qua `buocDanhSach` (`@shared/domain`) như `MenuDong.tsx:110-122`;
  Esc / Tab → đóng + focus về nút (pha bắt + chặn lan, không đóng panel chứa nó). Dáng giữ nguyên (3 nơi: `StudentDetailPage`,
  `MockDetailPage`, `ThanhTruocSau`).
- Kiểm (Playwright trong `do-khung`, vai 2, `/hoc-vien/2`): Enter trên ⋯ → `activeElement` là menuitem đầu; ↓ → mục 2; Esc → focus ở nút ⋯,
  không rơi về `body`.

## Task 5 — Vùng bấm số (B-02) + focus không bị che (B-05)
- `web/src/ui/SoLieuO.tsx:28-30` (một chỗ cho mọi màn) + `ui/SoLieu.tsx:313`: bỏ mẹo `max-sm:py-3 -my-3 …`; thêm `relative` +
  `after:` tuyệt đối canh giữa: ≥ 24 × 24 px máy tính, 44 × 44 px < 640 px (mẫu chip của `MenuDong.tsx:106`). Hình chữ không đổi.
- `App.tsx:231` `<main>`: `max-md:scroll-pb-20` (thanh dưới cao 56 + đệm) — focus bằng Tab cuộn lên trên thanh dưới.
- `do-khung`: **h "vùng bấm số < 24"** — mọi nút có `aria-label` "Bấm để xem danh sách": `getComputedStyle(el,'::after')` rộng / cao
  (hoặc hộp nút) ≥ 24 (≥ 44 ở 375); **i "focus bị che"** ở 375: Tab 40 lần trên Học viên & Lớp (vai 10) + Tổng quan (vai 2), mỗi lần
  `elementFromPoint` tâm phần tử focus không thuộc thanh dưới. Đỏ trước trên main (8×12 px; Tab 26–27 bị che).

## Task 6 — Menu Tài khoản 375 (B-09)
- `Header.tsx:299`: khung menu `max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain`; "Đăng xuất" `sticky bottom-0` nền
  `--surface`. Nội dung giữ nguyên (G4).
- `do-khung` kịch bản `menu-tk` (đã có) phải xanh ở 375 sáng + tối (vai 7): `<html>` không cuộn, "Đăng xuất" trong màn.

## Task 7 — Tương phản "—" và "/" (B-08)
- Mọi `<span className="… text-slate-600 …">—</span>` / `/` mang nghĩa ("chưa có", ngăn hai ô điểm) → `text-slate-500` (= `--text-faint`,
  ≥ 7:1 — `tailwind.config.js:28`, `index.css:54`). ~41 chỗ: `MotKyNang`, `BangCanHoTro`, `BangDiemLopThuong`, `BangLoTrinhTiep`,
  `PhanTichLopTab`, `TabTongKetLop`, `ui.tsx:499`, `ViecTiep`, `LuoiThuong` ("/" giữa hai ô), `LuoiFT`… (`grep` đủ khi làm).
  `text-slate-600` cho dấu trang trí thật (vạch, `·` ngăn) giữ.
- Kiểm: `do-khung` thêm **j "dấu nghĩa mờ"**: phần tử lá chữ đúng "—" hoặc "/" có tương phản < 4,5:1 với nền → lỗi (hồ sơ lớp FT,
  Lịch Test lớp thường). Đỏ trước (1,9–2,5:1).

## Task 8 — Chú giải màu Kế hoạch Test sinh từ màu thật (TST-05)
- `shared/domain/oMt.ts`: `NHAN_KIEU_O_MT: Record<KieuOMt, string>` (chữ ngắn: Chưa xếp · Đã xếp · Đang thi · Chờ chấm · Trễ chấm ·
  Có việc (vắng / huỷ / dời) · Đã thi ✓) — một nguồn, re-export `shared/domain/index.ts`.
- `KeHoachTestTab.tsx:185-191`: thay hai đoạn chữ màu bằng dải chip mẫu: FT → `MAU_O_MT` × `NHAN_KIEU_O_MT` (bỏ trùng `cho-cham-cu`);
  lớp thường → từ `MAU_TT` của `ChipKyNang.tsx:82` (export, dùng `duoi`/`nghia`) + "chưa xếp" viền đứt. Câu luật không phải màu giữ.
  Không còn "Xám = đã thi xong", "nửa tròn" (không tồn tại).
- Phép kiểm `prKhungLoi`: mọi `KieuOMt` có nhãn; nhãn `xong` là "Đã thi"; `oMt()` của em đã có điểm đủ kỹ năng ra `xong` (chú giải và
  ô dùng cùng kiểu). LUAT-34 bỏ "Không dự thi" → chú giải lớp thường theo `MAU_TT` tự theo.

## Task 9 — Tiêu đề = tên menu (A1-07) + "Nếu duyệt" ghi ngày (A1-09)
- `OverviewPage.tsx:52,62`: h1 = `KHU_VUC` "Tổng quan" cho mọi vai; khối TVV / CX giữ h2 riêng (G5). `HoTroHocVienTab.tsx:303`
  h1 "Công việc" cả với Admin. `dieuHuong.ts:160` `TAB_TONG_QUAN_LABEL['tong-quan']` → "Tổng quan" (hoặc bỏ nếu hết nơi dùng);
  sửa `khung.tests.ts:92`, `prVaiA.tests.ts:359` (đỏ trước). Rà Hướng dẫn (`shared/huongDan/ql.ts`, `qt`, `admin`, `cx`, `tvv`) chữ
  "Việc hôm nay" / "Mock Test" / "Số liệu" khi nói tên trang.
- `server/src/duyet/loaiYeuCau.ts:186`: `neuDuyet` = "PA bắt đầu hôm nay · ghi kết quả hai tuần một lần · hạn đầu dd/mm" — ngày từ
  `hanKe`/`hanKyGhiKetQua` (`shared/domain/week.ts`, OV-12a) tính từ `ngu.homNay`. Phép kiểm `prKhungLoi`: thẻ Đề xuất PA demo
  14/09 → chữ có ngày đúng hạn kỳ, không chứa "T3".
- Đọc Turso: đường thẻ duyệt không thêm câu SQL (ngày tính tại chỗ) — ghi "trước = sau" trong mô tả PR.

## Hoàn tất
- `npm run check` MỘT lần (giữ chỗ `pisa-slot`, mã KHUNG-LOI) · `do-khung` (giữ chỗ `web-`) xanh ở 1 100 / 1 280 / 1 440 / 375 ×
  sáng / tối + phép kiểm hộp có ô ngày (CONG-CU) xanh.
- Bấm thử MỘT lần: QL (2) + GV (10) — thanh trên 1 440 / 1 280 / 1 100 tối, thanh dưới + menu Tài khoản + Tab focus 375 sáng, Phân tích /
  Tutor / Bộ lọc thêm chọn tuần bằng lịch, ⋯ hồ sơ HV bằng phím, ⓘ Kế hoạch Test. Ảnh trước / sau `docs/anh/pr-khung-loi/`.
- `plan.md` mục 11 một dòng · `CODE_MAP.md` (thêm `useBamNgoai.ts`, `prKhungLoi.tests.ts`) · `git merge origin/main` (CV-LOI) trước PR.
- Mô tả PR ≤ 30 dòng: Task, phép kiểm, ảnh, "Cần chủ SP xác nhận" (G1–G8), chú thích `ponytail:`, đọc Turso trước → sau.

## Rủi ro
- Vùng `after:` 24 px của hai số cạnh nhau trong một ô có thể chồng nhau — số sau thắng; đo bằng `do-khung` h, không thì thu 20 px ở ô đôi.
- `ResizeObserver` đo rộng mục trước khi phông tải xong → đo lại khi `document.fonts.ready`.
- Hook chung: chỗ nào trước đây cố ý coi portal là "ngoài" (không thấy trong 15 bản) → bấm thử từng hộp trong `do-khung` hồi quy.
