# QUẢN TRỊ V2 — overhaul toàn bộ trang Quản trị hệ thống (chủ SP 11/11)

Trạng thái: **chủ SP 11/11 (qua PTA): "không cần làm lại mockup đâu, làm luôn đi"** — bỏ bước duyệt mockup, code theo đặc tả này với 2 chỉnh: **không Tutor** · **không dựng tab /
khung điều hướng Quản trị mới, giữ vị trí cũ** ("không làm hẳn 1 tab cho quản trị, vẫn ở vị trí cũ"). Mockup tham chiếu nội dung từng mục: `thiet-ke/2026-11-11-quan-tri-v2/quan-tri-v2.html`
(vẽ trước lời chủ SP: cột trái trong mockup BỎ, thay bằng hàng tab cũ — mục 4).
Mã đọc: `main` d8b3490fb. Session QUAN-TRI-V2 (Opus 5.5 · high). Ghép với CAU-HINH-CASE-SOS (`docs/superpowers/specs/2026-11-11-cau-hinh-case-sos-design.md`,
nhánh của session đó). Skill đã dùng: `impeccable` (shape, critique, layout), `ui-ux-pro-max`, `karpathy-guidelines`.

## 1. Lời chủ SP và mô tả đã duyệt

> "overhaul lại TOÀN BỘ giao diện trong quản trị hệ thống để mọi thứ gọn gàng hơn, dễ sử dụng hơn, dễ nhìn hơn. Sử dụng các skills thiết kế cần thiết để thực hiện mockup nhé."
> "Việc quản trị hệ thống tất nhiên là đổi vai của các tài khoản, cập nhật vai trò và quyền hạn. Đồng thời tôi muốn có phần để xử lý tất cả các vấn đề liên quan đến hệ thống:
> lộ trình, các loại lớp, band điểm, luật lệ hạn mặc định, case, phân loại case, nguyên nhân, phương án quy chế,..."

Mô tả PTA chủ SP chấp nhận: Quản trị **hai phần** — (A) **Tài khoản & quyền**: danh sách tài khoản tìm / lọc, đổi vai, chi nhánh **tại dòng**, bảng vai → quyền xem / chỉnh;
(B) **Cấu hình hệ thống**: mỗi mục một trang con **cùng một mẫu** (danh sách → sửa tại chỗ → nhật ký): lộ trình, loại lớp / chương trình, band điểm & bảng quy đổi,
luật hạn mặc định, Case / phân loại Case / nhóm nguyên nhân / phương án quy chế / việc mốc SOS; **đổi chỉ áp cho cái sinh sau**, mục đang dùng **chỉ tạm ẩn**;
**chỉ vai Quản trị sửa, QL xem**.

Phạm vi session này: **làm gọn các tab Quản trị sẵn có + (A) + mọi mục cấu hình trừ Case & SOS**. Case & SOS (nguyên nhân, PA, việc mốc SOS) do CAU-HINH-CASE-SOS làm, lắp vào
một tab nguyên khối (mục 5.6).

## 2. Hiện trạng (bấm thử seed 14/09/2026, vai 1 Quản trị + vai 2 QL; ảnh `thiet-ke/2026-11-11-quan-tri-v2/anh/truoc-*.png`)

Vào: menu tài khoản › "Quản trị hệ thống" (`/quan-tri`, `Header.tsx:450`); QL: "Bảng quy đổi band" (`/quan-tri?tab=band`). Một trang, 6 tab (`AdminPage.tsx:42`).

| Tab (hiện tại) | Nội dung | Thao tác · số bấm |
|---|---|---|
| Tài khoản | "Đăng ký chờ duyệt n" · bảng 32 tài khoản: Họ tên · Email · Vai trò · chi nhánh (chip) · Quyền cấp riêng (ẩn khi không ai có) · Kỹ năng · Sửa · ⋯; lọc tìm / chi nhánh / vai / kỹ năng / nhóm theo; chip "Chưa có vai / email / kỹ năng"; đoạn Đang dùng · Đã xoá | **Đổi vai / chi nhánh: 4 bấm** (Sửa → chọn vai → chip chi nhánh → Lưu) trong panel 720 px chung với Kỹ năng, Quyền cấp riêng (7 nhóm gập), Đặt lại mật khẩu · Sửa thông tin (họ tên, email, ĐT, chức danh): ⋯ → Sửa thông tin → Lưu · Xoá: ⋯ → Xoá → panel xoá cứng / mềm · Khôi phục (Đã xoá) 1 bấm · Duyệt / Không duyệt đăng ký tại dòng · + Tạo tài khoản (panel) |
| Chương trình | Bảng 10 dòng: lớp thường (Pre FOU, FOU, BE, ELE, KET, PET) **lẫn** lộ trình FT (LT1, LT2, RF, KHAC) — Cách chấm · Độ dài · Mốc Test · Lớp đang chạy · Sửa | Sửa → panel (Tên, Môn, Đạt từ %, số tuần, Mốc Test, Còn dùng) → Lưu: 3 bấm · + Chương trình (panel, mã mới) |
| Chi nhánh | 5 chi nhánh: tên, địa chỉ, SĐT | Sửa → panel → Lưu |
| Bảng quy đổi | Lưới 41 số câu × L / R + cột IDP · khối Áp dụng · Lịch sử phiên bản | Sửa → sửa ô → Lưu (409 khi người khác vừa sửa), Hoàn tác, khôi phục phiên bản |
| Quyền & nhật ký | **Một trang dài 5 166 px**: 4 ô đếm (Học viên 146 · Lớp 34 · Lượt Mock 342 · Case 108) · công tắc "Mở sửa lịch Test" · ma trận 37 quyền × 7 vai + cột GVCN (mỗi quyền 1–3 dòng mô tả) · Đơn vị báo cáo · Nhật ký 50 dòng | Đổi quyền vai: Sửa quyền → bấm ô → Lưu → xác nhận "ảnh hưởng n tài khoản" = 4 bấm (sau khi cuộn tìm đúng quyền) · Bật / Tắt mở sửa lịch: 1 bấm |
| Đã xoá | Thùng rác 30 ngày (HV, Case, PA, vi phạm, tệp) | Khôi phục tại dòng 1 bấm |

Vấn đề thấy được (đối chiếu lời chủ SP "gọn, dễ dùng, dễ nhìn"):
1. **Hai việc khác hẳn nhau trộn trong 6 tab ngang** — người, quyền, cấu hình, vận hành (công tắc, thùng rác) cùng một hàng; thêm Case & SOS + Hạn + Band thì 9–10 tab, không còn chỗ ở 375.
2. **"Quyền & nhật ký" là bãi chứa**: 4 ô đếm không ai dùng ở đây, công tắc nghiệp vụ, ma trận 8 cột rộng, nhật ký mọi thứ — cuộn 5 màn mới hết.
3. **Ma trận quyền khó đọc**: 8 cột "có / —" giống nhau, câu mô tả dưới mỗi quyền; muốn biết "Admin được làm gì" phải dò một cột dọc 37 dòng.
4. **Chương trình lẫn lộ trình FT** trong một bảng; giá trị hệ thống khác (hạn, ngưỡng %, kỳ vọng band) **không có chỗ nào xem / sửa** — nằm cứng trong mã.
5. **Đổi vai phải mở panel lớn** (cùng 7 nhóm quyền cấp riêng, mật khẩu) — việc hay làm nhất lại nặng nhất.
6. **Không nhất quán mẫu sửa**: Chương trình / Chi nhánh mở panel, Bảng quy đổi sửa tại chỗ + có phiên bản + Hoàn tác, Quyền có chế độ "Sửa quyền" riêng; nhật ký chỉ ở một tab.
7. QL chỉ thấy Bảng quy đổi + Đã xoá — không xem được lộ trình, hạn, ngưỡng mà mình phải làm theo.

## 3. Giá trị "hệ thống": đã có bảng DB hay đang viết cứng (agent recon, đã kiểm lại các dòng chính)

| Nhóm | Mục | Hiện ở | Có bảng + đường sửa? |
|---|---|---|---|
| Lộ trình FT | LT1 · LT2 · RF · Khác: tên, ghi chú, thứ tự, còn dùng, **lịch MT** (`[6,12,16]`, RF `[4,8]`) | `routes` (+ `lich_mt` JSON), chụp sang `classes.lich_mt` khi tạo lớp | **Có** — `PUT /admin/routes`; không thêm mã mới (`KHONG_THEM_MA`, K1-48) |
| Loại lớp | Pre FOU 5 t · FOU 8 t · BE / ELE 10 t · KET / PET liên tục (checkpoint 6 t) · FT; môn, cách chấm, Đạt từ %, mốc Progress / Final | `programmes`, `programme_skills`, `programme_checkpoints`; chụp `classes.nguong_dat`, `moc_lap` | **Có** — `PUT /admin/programmes` (+ mã mới) |
| Band | Bảng quy đổi số câu → band L / R (41 ô, phiên bản) | `bang_quy_doi` (append-only) | **Có** — `GET/PUT /admin/bang-quy-doi` |
| Band | **Kỳ vọng MT FT**: MT1 = Target − 1.0 · MT2 = − 0.5 · MT3+ = Target · RF = Target | `shared/domain/fasttrack.ts:14` `expectationDelta` | **Không** — viết cứng |
| Band | **Ngưỡng lớp thường**: Học lại < 50 % · 50–59 % · Lên từ 60 % · Mini Test đạt 70 % | `shared/domain/cuoiKhoa.ts:22–25` | **Không** |
| Band | Thang Cambridge KET 100–150 / PET 120–170, mốc grade + CEFR | `shared/domain/kyThi.ts:21` | Không — **giữ trong mã** (thang của Cambridge, không phải luật trung tâm) |
| Hạn | 14 hạn mặc định (mục 5.5) | hằng số `HAN_*`, `soNgayHanXacNhan`, `defaultScoreDeadline`, `mocLoTrinh`, `hanXetLai`… | **Không** — viết cứng; vài việc có cột ghi đè từng dòng (`han_chon`, `han_them_pa`, `han_sau_thi`) |
| Case & SOS | nhóm nguyên nhân, nhóm PA, PA quy chế, việc phối hợp mốc SOS | `cases.ts`, `sos.ts` | Không — CAU-HINH-CASE-SOS thêm |
| Chi nhánh | tên, địa chỉ, SĐT | `branches` | **Có** — `PUT /admin/chi-nhanh/:id`; không thêm / xoá (thêm qua lệnh `them-chi-nhanh`) |
| Đơn vị báo cáo | 5 chi nhánh + "Tutor part-time" | `reporting_units` | Có bảng, **không** đường sửa — chỉ xem (giữ) |
| Quyền | 7 vai × 37 quyền, quyền cấp riêng | `role_permissions`, `user_permissions` | **Có** — `PUT /admin/role-permissions`, `/admin/accounts/:id/permissions` |
| Vận hành | công tắc "Mở sửa lịch Test" | `demo_config.mo_sua_lich_test` | **Có** — `PUT /admin/mo-sua-lich-test` |
| Không đưa lên | phiên 30 ngày, thùng rác 30 ngày, giới hạn đăng nhập, trần dịch (biến môi trường), giới hạn chữ N35, thang vi phạm, mức SOS theo số kỹ năng trượt | rải trong mã | Giữ trong mã — bảo mật / quy chế, chủ SP không nhắc; sửa = PR |

## 4. Điều hướng — GIỮ chỗ cũ, thêm tab (chủ SP 11/11)

Vẫn vào từ menu tài khoản › "Quản trị hệ thống" (`/quan-tri`); thanh trên không thêm mục. Trang giữ **hàng tab ngang `HangTab`** + `?tab=` trên URL (OV-11b) — không cột trái,
không trang mục lục. Đổi: thêm 2 tab, đổi tên 1 tab, dọn nội dung "Quyền & nhật ký".

| Tab (`?tab=`) | Nội dung sau | Ai thấy |
|---|---|---|
| Tài khoản (mặc định) | như nay + đổi vai / kỹ năng tại dòng (5.1) | Quản trị |
| Quyền & nhật ký (`config`) | công tắc **Mở sửa lịch Test** (một dòng) · **Quyền theo vai** (5.2) · **Nhật ký chung** có lọc (5.8) | Quản trị |
| Chương trình (`catalog`) | hai nhóm: Loại lớp thường · Fast Track · lộ trình (5.3) | Quản trị sửa · **QL xem** |
| **Band & ngưỡng** (`band`, đổi tên từ "Bảng quy đổi") | kỳ vọng FT · ngưỡng lớp thường · bảng quy đổi (5.5) | Quản trị sửa · QL xem |
| **Hạn mặc định** (`han`, MỚI) | 14 hạn (5.4) | Quản trị sửa · QL xem |
| **Case & SOS** (`case-sos`, MỚI — CAU-HINH-CASE-SOS) | nguyên nhân · PA · mốc SOS | Quản trị sửa · QL xem |
| Chi nhánh (`chi-nhanh`) | sửa tại dòng + dòng "Đơn vị báo cáo" (5.7) | Quản trị sửa · **QL xem** |
| Đã xoá (`da-xoa`) | như nay | như nay |

- 8 tab ở 1440 vừa một hàng; 375: `HangTab` một hàng vuốt, mép mờ (PR-KHUNG G6 sẵn có) — không đổi.
- Tiêu đề trang giữ "Quản trị hệ thống" (QL: "Cấu hình hệ thống" thay "Bảng quy đổi band"; menu tài khoản QL đổi nhãn tương ứng, vẫn trỏ `?tab=band`).
- Tab cấu hình dùng mẫu 5.0; tiêu đề trong tab là đầu khối 17 / 700 (tiêu đề trang 22 / 700 đã có ở trên).
- `data-hd="qt-tab"` giữ; `shared/huongDan/qt.ts` sửa chữ "Ba tab…" → liệt kê tab mới; thêm bước Hạn mặc định, Band & ngưỡng.
- **Bỏ** 4 ô đếm (Học viên / Lớp / Lượt Mock / Case) ở Quyền & nhật ký — số này đã ở Tổng quan; không có thao tác. "Đơn vị báo cáo" chuyển sang tab Chi nhánh.
- Link "Nhật ký ›" / "Xem tất cả ›" ở các tab = `?tab=config&muc=<tab>` (Nhật ký chung lọc sẵn mục, cuộn tới khối Nhật ký).

## 5. Mẫu chung trang con + từng mục

### 5.0. Mẫu chung (thống nhất với CAU-HINH-CASE-SOS mục 7 — ghi chú chung `quan-tri-v2-mau-chung.md`)

```
┌ hàng tab ┐┌ đầu khối: Tên mục 17/700 · đếm · "Áp cho … sinh sau ⓘ" · [đoạn chọn] ··········· [+ Thêm …] ┐┌ Nhật ký 320 ┐
│          ││ bảng đơn giản — nhóm bằng dải V21 (surface-2, vạch trái 3 px, 15/700, chip đếm)             ││ 8 lần đổi    │
│          ││ dòng: tên (bấm = sửa tại dòng) · giá trị · đang dùng · [Ẩn] / [Hiện lại]                     ││ ai · lúc     │
│          ││ dòng sửa: ô nhập + Lưu · Thôi (Enter / Esc)   — nhiều trường → khung phải trong cột phải     ││ trước → sau  │
└──────────┘└ toast "✓ Đã lưu · Hoàn tác" 10 s ─────────────────────────────────────────────────────────┘└ Xem tất cả ›┘
```

- **Một cách báo "sửa được"** ở mọi mục: giá trị sửa được là **ô có viền** (bấm = mở tại chỗ, ✎ hiện khi rê / focus); chỉ đọc = chữ thường; dòng nhiều trường có thêm nút **"Sửa"** cuối dòng (mở khung phải), dòng không tự bấm được.
- **Sửa tại dòng** khi ≤ 3 trường (tên, một số, một ô chọn); **khung phải** (thay chỗ cột Nhật ký, cùng 400 px, không panel nổi) khi nhiều trường (lịch MT, chương trình mới, tài khoản mới).
- **Một thao tác một lần lưu**, máy chủ kiểm, lỗi tại ô (`aria-describedby`), giữ chữ. Không có chế độ "Sửa" riêng cho cả bảng (bỏ "Sửa quyền", "Sửa" bảng quy đổi giữ vì sửa 41 ô một lượt).
- **Toast sau lưu nêu cái giữ bản cũ** khi có: "✓ Đã lưu · Meeting CX / GĐCN 5 → 7 ngày · 3 việc đang chờ giữ 5 ngày" (một câu `COUNT` lúc lưu, chỉ ở mục Hạn / Band — hiếm).
- **ⓘ** = thành phần sẵn có của web (`NutLuat` / ⓘ bấm mở, chạy trên cảm ứng); mockup dùng `title` cho gọn.
- **Hoàn tác 10 s** sau mọi lần lưu (đảo về bản trước, thành một bản mới) + **Khôi phục về đây** ở từng dòng nhật ký. Không thao tác nào không đảo được.
- **Mục đang dùng không xoá — chỉ Ẩn** (mờ tại chỗ + chip "đã ẩn" + "Hiện lại"); mục chưa từng dùng có Xoá (vẫn Hoàn tác được).
- **Chỉ áp cho cái sinh sau**: dòng đầu mục "Áp cho lớp mở sau ⓘ" / "Áp cho việc sinh sau ⓘ"; ⓘ nói rõ cái đang chạy giữ bản cũ.
- **QL**: cùng màn, không nút sửa / thêm / ẩn, dòng `bao-chi-xem` "Chỉ xem · Quản trị hệ thống sửa"; nhật ký vẫn xem được (không có Khôi phục).
- **Rỗng / lỗi / đang tải**: rỗng = một câu + nút thêm (QT); lỗi tải = `ErrorState` + Thử lại; đang tải = khung xương đúng số cột; lưu lỗi = dòng giữ chữ + "Không lưu được · Thử lại";
  xung đột (người khác vừa lưu) = 409 → "Vừa có người sửa mục này · Tải lại" (chữ đang gõ giữ trong ô).
- **375**: bảng → danh sách hai dòng (tên · giá trị), chạm dòng → hộp sửa toàn màn (Lưu cố định dưới); nhật ký thành khối cuối trang "Lần đổi gần nhất" 3 dòng + "Xem tất cả ›".
- **Cột Nhật ký chỉ ở các tab cấu hình** (Chương trình, Band & ngưỡng, Hạn mặc định, Case & SOS, Chi nhánh — bảng nhỏ, cần thấy lần đổi). Tài khoản và Quyền theo vai dùng hết bề ngang (bảng rộng, việc hằng ngày); lịch sử của hai mục này = link "Nhật ký ›" ở đầu mục, mở Nhật ký chung lọc sẵn mục đó.

### 5.1. Tài khoản (A)

- Giữ nguyên: đăng ký chờ duyệt ở đầu (rỗng = một dòng), tìm / lọc / nhóm theo (URL), chip "Chưa có vai / email / kỹ năng", Đang dùng · Đã xoá, + Tạo tài khoản, Sửa (panel cũ: vai, kỹ năng,
  quyền cấp riêng, mật khẩu), ⋯ Sửa thông tin · Xoá, Khôi phục, Duyệt lại.
- **MỚI — đổi vai / chi nhánh tại dòng**: ô "Vai trò · chi nhánh" là nút (viền mờ khi rê, ✎ khi focus). Bấm → **popover neo ô** (360 px): mỗi lần cấp một hàng `[Vai ▾] [Chi nhánh ▾ / Toàn hệ thống] ✕`,
  "+ Thêm vai", **Lưu** · Thôi. Lưu → `PUT /admin/accounts/:id/roles` (sẵn có) → chip đổi ngay, toast "✓ Đã đổi vai Bùi Hải Yến · Hoàn tác". Cùng luật máy chủ cũ (không tự gỡ / gỡ Quản trị cuối,
  vai thiếu chi nhánh → lỗi tại hàng). 4 bấm như trước nhưng **không rời bảng, không panel 720 px**. Esc / bấm ngoài = Thôi (đã đổi thì hỏi một lần "Bỏ thay đổi?").
- **MỚI — kỹ năng tại dòng**: bấm chip kỹ năng → popover 5 nút bật / tắt L R W1 W2 S + Lưu (đường `PUT …/skills` sẵn có). Cột Kỹ năng giữ "Chấm S".
- Cột "Quyền cấp riêng" giữ luật J10 (ẩn khi không ai có).
- 375: thẻ như B14 hiện tại; chạm dòng vai → hộp toàn màn cùng nội dung popover.

### 5.2. Quyền theo vai (A)

- **Trái (280 px): danh sách 7 vai** — tên · "n tài khoản" (link "Xem ›" → Tài khoản lọc theo vai) · số quyền; dòng GVCN cuối, chip "tự có theo chủ nhiệm" (chỉ đọc).
- **Phải: quyền của vai đang chọn**, nhóm theo `NHOM_QUYEN` (dải V21, gập được), mỗi quyền một hàng: tên 15 / 500 · ⓘ (mô tả + phạm vi — **bỏ 1–3 dòng chữ dưới tên**, theo bộ nhớ
  `bo-chu-thich`) · **công tắc Có / Không** (chữ cạnh công tắc, không chỉ màu). Ô khoá: công tắc mờ + 🔒 + lý do một dòng ngay tại hàng (giữ `lyDoCamVai`, SCH-01, chống tự khoá).
- **Bỏ chế độ "Sửa quyền"**: Quản trị bấm thẳng công tắc → đổi tạm (viền nhấn + chữ "đổi"); dải dính dưới "2 thay đổi · ảnh hưởng 4 tài khoản · Huỷ · Lưu" → hộp xác nhận liệt kê
  (giữ UX-C7 / Q23 — đây là thay đổi hậu quả lớn nên vẫn xác nhận) → lưu, toast + nhật ký. Hoàn tác 10 s = gửi lại các ô ngược.
- **"So sánh mọi vai"** (nút đầu mục) = ma trận cũ (chỉ đọc, cuộn ngang trong khung, cột đầu dính) — giữ cho ai quen.
- 375: chọn vai bằng ô chọn đầu trang; danh sách quyền như trên.

### 5.3. Chương trình & lộ trình (B) — hai nhóm trong một mục (thay bảng lẫn lộn hôm nay)

**Nhóm "Fast Track · lộ trình"** — bảng 4 dòng: Mã · Tên · **Lịch MT** (`MT 6 · 12 · 16` — tuần học) · Độ dài · Lớp đang chạy · Trạng thái. Bấm dòng → khung phải: Tên, Ghi chú, danh sách MT (ô tuần, + MT, ✕; 1–8 MT,
  tuần 1–104 tăng dần — `kiemLichMt` sẵn có), Còn dùng / Tạm ẩn. Lưu → `PUT /admin/routes` (sẵn có). "Áp cho lớp mở sau · 7 lớp đang chạy giữ lịch cũ".
- Không có "+ Thêm lộ trình" (mã cố định K1-48, nhiều chỗ mã dựa vào LT1 / LT2 / RF) — ⓘ ở đầu mục: "Lộ trình mới dùng 'Khác' (Bước tiếp sau thi)".

**Nhóm "Lớp thường"** (Pre FOU, FOU, BE, ELE, KET, PET). Cột: Mã · Tên · Môn (chip) · Cách chấm · Độ dài · Mốc Test · **Đạt từ** · Lớp đang chạy.
- **Đạt từ** sửa tại dòng (ô số + %); Tên sửa tại dòng; mục khác (môn, mốc, độ dài) → khung phải như panel cũ. "+ Chương trình" → khung phải (mã mới, như nay). Tạm ẩn = "Còn dùng" cũ.
- Luật giữ: môn / cách chấm của mã có sẵn khoá (như nay); áp cho lớp mở sau (bản chụp `classes.nguong_dat`, `moc_lap`).

### 5.4. Hạn mặc định (B — MỚI)

Bảng 14 hạn, nhóm theo nơi việc phát sinh. Cột: **Việc** · **Hạn** (giá trị sửa được — ô có viền, như "ô số = mở tại chỗ"; hàng có hai giá trị sửa cả hai trong một dòng: Xác nhận Case "5 ngày · gấp 3 ngày", Bàn giao đổi GV "5 ngày · xem thêm 7") · **Tính từ** (mốc, chỉ đọc) · **Ai làm** (chỉ đọc) · ⓘ (luật gốc). Giá trị ngày đầu = đúng mã hiện tại:

| Nhóm | Việc | Hạn hiện tại | Tính từ | Nguồn mã |
|---|---|---|---|---|
| Test & điểm | Chấm Mock / Test lớp thường | **T4 tuần sau** tuần thi | tuần thi | `defaultScoreDeadline`, `hanChamMt0` (T19) |
| Case & PA | Xác nhận Case / thêm PA | **5 ngày** (SOS 3 hoặc gấp: **3 ngày**) | ngày phát hiện | `soNgayHanXacNhan` |
| | Xác minh tín hiệu | **3 ngày** | ngày ghi tín hiệu | `SIGNAL_VERIFY_DAYS` |
| | QL duyệt đề xuất PA | **5 ngày** | ngày đề xuất | `HAN_DUYET_NGAY` |
| | Ghi kết quả PA | **2 tuần / lần**, hết **thứ Ba** | lần ghi trước | `hanKyGhiKetQua` |
| | Dự kiến kết thúc PA | **CN tuần kế tiếp** ("1 tháng" = + 31 ngày tới CN) | ngày tạo PA | `planEndDefault`, `sosPlanEndDate` |
| Ý thức & phối hợp | Xử lý vi phạm (sau duyệt) | **5 ngày** | ngày QL duyệt | `HAN_Y_THUC_NGAY` |
| | Báo PH sau xử lý vi phạm (TVV) | **5 ngày lịch** (ngày lưu = ngày 1) | ngày GVCN lưu | `HAN_BAO_PH_NGAY` = 4 (N1, N2) |
| | Meeting CX / GĐCN | **5 ngày** | ngày sinh việc | `HAN_MEETING_CX_NGAY` (N34) |
| Lộ trình & lớp | Chốt lộ trình lớp thường | **T5 tuần trước** tuần Final (nhắc từ T2) | tuần Final | `mocLoTrinh` (N20) |
| | Bàn giao chuyển lớp | **7 ngày** (tính cả ngày ra lệnh) | ngày ra lệnh | `HAN_BAN_GIAO_NGAY` |
| | Bàn giao đổi GV | **5 ngày**; GV cũ xem thêm **7 ngày** | ngày đổi | `HAN_BAN_GIAO_GV_NGAY`, `XEM_TAM_NGAY` (N29) |
| | Bước tiếp sau thi thật (TVV) | **7 ngày** | ngày có KQ thi | `NGAY_HAN_SAU_THI` (N6) |
| | Xét lại lộ trình | **CN tuần 2** lớp mới (Mini Test: CN tuần sau ngày ghi) | tuần bắt đầu lớp mới | `hanXetLai` (N21) |

- **Hai kiểu giá trị**: "n ngày" (ô số 1–60) · "thứ + tuần lệch" (ô chọn T2…CN + ô chọn "tuần này / tuần sau / tuần trước"). Sửa tại dòng, Enter lưu.
- **Chỉ áp cho việc sinh sau** — không thêm cột chụp: mỗi hàm hạn tra **phiên bản có hiệu lực lúc việc sinh** (`tao_luc` / ngày ra lệnh / ngày phát hiện ≥ `tao_luc` của phiên bản).
  Việc đang chạy giữ hạn cũ; ghi đè từng việc (`han_chon`, `han_them_pa`, `han_sau_thi`) vẫn thắng như nay.
- **Không đổi luật khoá cuối tuần N15, thùng rác 30 ngày, phiên 30 ngày** (mục 3 "Không đưa lên").
- Dòng phụ của hàng chỉ khi giá trị ≠ bản gốc: "gốc: 5 ngày" mờ + "Về gốc".

### 5.5. Band & ngưỡng (B)

Ba khối trong một mục:
1. **Kỳ vọng band FT** (MỚI): bảng MT1 · MT2 · MT3+ · RF × "Target − x" (x = 1.0 · 0.5 · 0 · 0; bước 0.5, 0–3). Sửa tại ô. Áp cho **lượt MT tạo sau** (lượt mang bản chụp như CAU-HINH-CASE-SOS — mục 6.2).
2. **Ngưỡng lớp thường** (MỚI): Học lại dưới **50 %** · Cân nhắc **50–59 %** · Lên từ **60 %** · Mini Test đạt từ **70 %**; "Đạt từ" từng chương trình ở Chương trình & lộ trình (link). Kiểm: 0 < học lại < lên ≤ 100.
   Áp cho **Final chấm sau** (theo phiên bản lúc lưu điểm Final). Case & SOS đọc nhãn mốc ("Final {a}–{b} %") từ đây — **PTA chốt 11/11** (XM-1).
3. **Bảng quy đổi số câu → band**: thành phần `BangQuyDoiAdmin` hiện có, gọn lại khung (bỏ khối "Áp dụng" chữ dài → ⓘ; "Lịch sử phiên bản" chuyển vào cột Nhật ký chung). Sửa 41 ô một lượt giữ "Sửa".
- Thang Cambridge KET / PET: một dòng chỉ đọc "KET 100–150 · PET 120–170 (thang Cambridge)" ⓘ.

### 5.6. Case & SOS (B — CAU-HINH-CASE-SOS)

Lắp thành phần `CauHinhCaseSos` của session đó vào tab `?tab=case-sos`. Mockup này chỉ vẽ ô trống có tên + link sang mockup `thiet-ke/2026-11-11-cau-hinh-case-sos/`.

### 5.7. Chi nhánh (B)

Bảng 5 dòng: Mã · Tên · Địa chỉ · SĐT — sửa tại dòng từng ô (ba trường ngắn). Khối chỉ đọc "Đơn vị báo cáo" dưới bảng (chuyển từ Quyền & nhật ký). Không thêm / xoá (lệnh `them-chi-nhanh`).

### 5.8. Trong tab Quyền & nhật ký: Mở sửa lịch Test · Nhật ký chung

- **Mở sửa lịch Test**: thẻ một công tắc "Đang tắt / Đang mở · bật bởi … lúc …" + câu hậu quả (giữ — lưu ý cần thiết) + nhật ký bật / tắt. Logic cũ (`MoSuaLichTest.tsx`) không đổi.
- **Đã xoá**: `DaXoaAdmin` không đổi; đầu mục "Giữ 30 ngày".
- **Nhật ký chung**: toàn bộ lần đổi cấu hình + tài khoản + quyền, lọc **Mục** (đoạn) · **Người** · **Từ tuần → Đến tuần**; 50 dòng / trang (`PhanTrang`). Mỗi dòng: lúc · ai · mục · việc · trước → sau (gọn một dòng,
  "Xem" mở chi tiết tại chỗ). Từ đây "Khôi phục về đây" cho mục có phiên bản.

## 6. Dữ liệu và migrate

### 6.1. Bảng phiên bản dùng chung

```sql
CREATE TABLE cau_hinh_phien_ban (          -- đề xuất tên chung với CAU-HINH-CASE-SOS (bên đó đang gọi cau_hinh_case_sos)
  id INTEGER PRIMARY KEY,
  loai TEXT NOT NULL,                      -- 'han_mac_dinh' | 'ky_vong_ft' | 'nguong_thuong' | (Case & SOS: 'nguyen_nhan' | 'phuong_an' | 'moc_sos')
  du_lieu TEXT NOT NULL,                   -- JSON cả danh sách, bất biến
  thay_doi TEXT,                           -- JSON [{ viec, muc, truoc, sau }]
  khoi_phuc_tu INTEGER,                    -- Hoàn tác / Khôi phục: chép bản này
  nguoi_id INTEGER REFERENCES users(id),
  tao_luc TEXT NOT NULL
);
CREATE INDEX idx_chpb_loai ON cau_hinh_phien_ban(loai, id);
```

- Migrate `prQuanTriV2` (một bước `buoc(...)` trong `migrate.ts`, idempotent): tạo bảng nếu chưa có, ghi **bản 1 = đúng hằng số hiện tại** cho 3 loại của mục này, `tao_luc` = `'2000-01-01T00:00:00Z'`
  (mọi việc cũ tra ra bản 1 ⇒ **ngày đầu không đổi hành vi**). Cùng DDL vào `schema.sql`; thêm bảng vào `BANG_THAM_CHIEU` (`prTlNen.ts`) để nhớ đệm làm mới khi có bản mới.
- Hằng số cũ đổi tên `*_GOC`, giữ làm bản gốc cho migrate + phép kiểm "bản 1 = mã cũ".
- Lộ trình, loại lớp, chi nhánh, bảng quy đổi, quyền: **giữ bảng cũ, không migrate dữ liệu** — chỉ thêm nhật ký (6.3).

### 6.2. Áp cho cái sinh sau

| Loại | Cách | Ghi chú |
|---|---|---|
| `han_mac_dinh` | **con trỏ phiên bản trên dòng việc** khi bảng việc đã lưu hạn / có dòng riêng (`pb_han INTEGER`, NULL = bản 1 — như `pb_loai` / `pb_moc` của CAU-HINH-CASE-SOS); hạn chỉ tính lúc đọc (không có dòng việc lưu, vd hạn chấm từ tuần thi) → bản có hiệu lực tại **thời điểm tạo dòng gốc** (`attempts.created_at`…, cùng đồng hồ `nowNghiepVu` với `tao_luc` của phiên bản), **không** theo ngày nghiệp vụ người dùng gõ (ngày ra lệnh lùi ngày) | danh sách từng hạn → cột / mốc lập ở `writing-plans`; dữ liệu cũ = bản 1 |
| `ky_vong_ft` | `expectationDelta(lanThu, loTrinh, ban)` — `ban` = bản tại `tao_luc` của lượt MT (`attempts.created_at`) | điểm sửa lại vẫn theo bản lúc tạo lượt |
| `nguong_thuong` | bản tại lúc lưu điểm Final đầu tiên của em (`daiCuoiKhoa`) | Xét lại, Kết quả đầu ra dùng cùng bản |
| routes / programmes | bản chụp vào `classes` lúc tạo lớp (đã có) | giữ |

Hàm dùng chung ở `shared/` (web cũng tính hạn) ⇒ nhận `ban` làm tham số, mặc định = bản gốc; máy chủ truyền bản đúng; web nhận bản hiện hành qua `/ref/cau-hinh?pb=…`
(cùng cách CAU-HINH-CASE-SOS mục 3.4 — phiên trả `cauHinhPb`, tải một lần mỗi lần mở app, `immutable`). Chỗ hằng số nằm trong SQL (vd `prOv13l.ts` dùng `HAN_BAN_GIAO_NGAY`)
là migrate cũ — không đổi; câu SQL đang chạy dùng hằng số → đổi thành tham số trong PR code (danh sách đầy đủ lập ở `writing-plans`).

### 6.3. Nhật ký

- Mọi lần lưu cấu hình / tài khoản / quyền đã ghi `audit_logs` (`writeAudit`) — giữ; thêm `entity_type` cho loại mới (`cau_hinh.han_mac_dinh`…). `thay_doi` của bảng phiên bản cho "trước → sau".
- Cột Nhật ký mỗi mục: `SELECT … FROM audit_logs WHERE entity_type IN (?) ORDER BY id DESC LIMIT 8` — chỉ mục `idx_audit_entity (entity_type, entity_id)` sẵn có lọc đúng loại.
  Trang Nhật ký: thêm chỉ mục `idx_audit_tao (created_at)`? → **không**: lọc theo `entity_type` + `id` đủ; đo trước khi thêm.

## 7. Quyền

| Việc | Quản trị | QL | Vai khác |
|---|---|---|---|
| Tài khoản, Quyền theo vai, Nhật ký chung, Mở sửa lịch Test | xem + sửa (như nay: `ADMIN_CONFIG`) | ẩn / 403 | ẩn / 403 |
| Chương trình & lộ trình, Band & ngưỡng, Hạn, Case & SOS, Chi nhánh | xem + sửa | **xem** (mới: hôm nay chỉ Bảng quy đổi) — `laVaiQuanLy`, đọc qua `GET` | 403 |
| Đã xoá | như nay | như nay | như nay |

- Máy chủ kiểm mọi `PUT` bằng `require_(…ADMIN_CONFIG, { anyScope: true })`; `GET` cấu hình mở cho vai QL. Web ẩn theo `nav.admin` / `nav.cauHinh` (đổi tên `nav.bangQuyDoi` → `nav.cauHinh`, giữ khoá cũ một bản).
- Đây là quyền **hệ thống** (cấu hình) đúng mô tả chủ SP duyệt — không chạm việc nghiệp vụ QL (bộ nhớ `quan-ly-vs-quan-tri`).
- `/security-review` bắt buộc khi code (quyền, đăng nhập).

## 8. Đọc ít dòng (Turso)

| Đường | Câu · dòng mỗi lần | Tần suất |
|---|---|---|
| Mọi trang nghiệp vụ dùng hạn / kỳ vọng / ngưỡng | **0 câu thêm** (nhớ đệm tiến trình `nhoThamChieu('cauHinh:'+loai)`, làm mới theo mốc `tham-chieu`); sau mỗi lần sửa: 1 câu ≤ 30 dòng / tiến trình | mọi request |
| Web tải bản hiện hành | 1 request / lần mở app (`immutable`), 0 câu (đọc từ nhớ đệm) | mỗi phiên |
| `/quan-tri?tab=<tab cấu hình>` | 1 câu bản hiện tại (hoặc bảng cũ) + 1 câu nhật ký 8 dòng + 1 câu đếm "đang dùng" (Chương trình & lộ trình: `COUNT … GROUP BY` trên `classes` ~40 dòng) | vài lần / tuần |
| `/quan-tri` (Tài khoản) | như nay (`/admin/accounts`) — popover đổi vai không thêm câu đọc (dữ liệu đã nạp) | |
| `/quan-tri?tab=config` (Quyền & nhật ký) | như nay (`/admin/permissions/matrix`) — **bỏ** `/admin/overview` (4 `COUNT(*)` trên students / classes / attempts / cases + 50 dòng nhật ký) khỏi trang này ⇒ **bớt** ~600 dòng mỗi lần mở | |
| Nhật ký chung (trong `?tab=config`) | 1 câu 50 dòng (lọc `entity_type`) — thay 50 dòng nhật ký của `/admin/overview` | |

Ước tổng: < 0,05 triệu dòng / tháng cho màn Quản trị; luồng nghiệp vụ **không tăng**. Trần ở `server/src/tests/tocDoDuong.ts`: mỗi `GET /admin/<mục>` ≤ 4 câu, ≤ 500 dòng.

## 9. Bảng thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Duyệt / Không duyệt / Duyệt lại đăng ký | Tài khoản, đầu tab | GIỮ — Tài khoản, đầu tab |
| Tìm / lọc / nhóm tài khoản, chip thiếu, Đang dùng · Đã xoá | Tài khoản | GIỮ |
| Đổi vai / chi nhánh | Sửa → panel 720 → Lưu (4 bấm) | **Tại dòng**: bấm ô vai → popover → Lưu (4 bấm, không panel) · panel Sửa vẫn có |
| Kỹ năng phụ trách | panel Sửa | **Tại dòng** (popover) · panel Sửa vẫn có |
| Quyền cấp riêng, đặt lại mật khẩu | panel Sửa | GIỮ |
| Sửa thông tin, Xoá, Khôi phục tài khoản, + Tạo | ⋯ / nút | GIỮ |
| Đổi quyền theo vai | Quyền & nhật ký › cuộn › Sửa quyền › ô › Lưu › xác nhận | Quyền theo vai › chọn vai › công tắc › Lưu › xác nhận (bỏ bước "Sửa quyền") |
| Xem ma trận mọi vai | luôn hiện | GIỮ — "So sánh mọi vai" |
| Sửa lộ trình FT (tên, lịch MT, còn dùng) | Chương trình › Sửa | Chương trình & lộ trình › nhóm Fast Track › bấm dòng › khung phải |
| Sửa chương trình lớp thường, + chương trình | Chương trình | Chương trình & lộ trình › nhóm Lớp thường (Đạt từ, Tên tại dòng; còn lại khung phải) |
| Sửa chi nhánh | Chi nhánh › Sửa › panel | Chi nhánh › tại dòng |
| Bảng quy đổi: sửa, Hoàn tác, khôi phục phiên bản | Bảng quy đổi | GIỮ — Band & ngưỡng › khối 3; lịch sử ở cột Nhật ký |
| Bật / tắt Mở sửa lịch Test | Quyền & nhật ký | GIỮ — Quyền & nhật ký, dòng đầu |
| Khôi phục thứ đã xoá | Đã xoá | GIỮ — Đã xoá |
| Xem nhật ký | 50 dòng cuối Quyền & nhật ký | Cột Nhật ký từng mục (8) + Nhật ký chung có lọc |
| Xem đơn vị báo cáo | Quyền & nhật ký | Chi nhánh (khối chỉ đọc) |
| 4 ô đếm Học viên / Lớp / Lượt / Case | Quyền & nhật ký | **BỎ** — không thao tác, đã có ở Tổng quan; bớt 4 câu `COUNT(*)` |
| **MỚI** sửa hạn mặc định, kỳ vọng FT, ngưỡng lớp thường | — | Hạn mặc định · Band & ngưỡng |
| **MỚI** QL xem chương trình & lộ trình, hạn, band, Case & SOS, chi nhánh | chỉ Bảng quy đổi | mọi mục Cấu hình, chỉ xem |

## 10. Ca biên

| Tình huống | Xử lý |
|---|---|
| Đổi hạn "Xác nhận Case" 5 → 4 ngày khi đang có 12 Case chờ | 12 Case giữ hạn cũ (sinh trước); Case phát hiện sau tính 4 ngày. Không hỏi (đảo được) |
| Đổi rồi Hoàn tác sau khi đã có việc mới sinh | Việc sinh trong khoảng đó giữ hạn bản mới (đã sinh); Hoàn tác tạo bản mới = bản cũ cho việc sinh sau |
| Sửa ngưỡng "Lên từ" 60 → 55 giữa kỳ Final | Em đã có điểm Final giữ dải cũ; em chấm sau theo dải mới. Xét lại chạy theo bản của em |
| Ngưỡng không hợp lệ (học lại ≥ lên) | lỗi tại ô "Phải nhỏ hơn 'Lên từ' (60 %)", không lưu, giữ chữ |
| Đổi vai làm mất Quản trị cuối / tự gỡ mình | máy chủ chặn như nay; lỗi ngay tại hàng popover, không đóng popover |
| Đổi vai người đang đăng nhập | có hiệu lực ở request kế (như nay) |
| Hai Quản trị sửa cùng mục | 409 "Vừa có người sửa · Tải lại", giữ chữ |
| QL mở đường sửa bằng tay (`PUT`) | 403 máy chủ |
| Mất mạng khi lưu | dòng giữ chữ + "Không lưu được · Thử lại"; không hiện "✓ Đã lưu" |
| 0 đăng ký chờ duyệt | một dòng "Đăng ký chờ duyệt 0" (như nay) |
| Mục Nhật ký rỗng (mục chưa sửa lần nào) | "Chưa đổi lần nào · đang dùng bản gốc" |
| Link cũ `/quan-tri?tab=band` (menu QL) | vẫn mở đúng tab (đổi tên "Band & ngưỡng") |

## 11. Kế hoạch PR (sau duyệt — `superpowers:writing-plans`, mỗi màn một PR)

1. **QTV2-KHUNG** — thêm tab Hạn mặc định / Case & SOS (ô chờ), đổi tên Band & ngưỡng, QL thấy các tab cấu hình (`nav.cauHinh`), bỏ 4 ô đếm + `/admin/overview` ở Quyền & nhật ký. Ảnh trước | sau.
2. **QTV2-NEN** (máy chủ) — bảng `cau_hinh_phien_ban` (hoặc dùng bảng CAU-HINH-CASE-SOS nếu merge trước) + `banTaiLuc` + nhớ đệm + `GET/PUT /admin/cau-hinh/:loai` + nhật ký mục + trần `tocDoDuong`. TDD: bản 1 = hằng số cũ.
3. **QTV2-HAN** — chuyển 14 hàm hạn sang đọc bản; màn Hạn mặc định. Thử migrate trên bản chép `mig.sqlite`: đếm việc đang mở trước / sau = không đổi hạn.
4. **QTV2-BAND** — kỳ vọng FT + ngưỡng lớp thường + gọn Bảng quy đổi. Phép kiểm SOS / dải cuối khoá trên seed không đổi.
5. **QTV2-TK** — Tài khoản: popover vai · kỹ năng tại dòng.
6. **QTV2-QUYEN** — Quyền theo vai: chọn vai + "So sánh mọi vai".
7. **QTV2-CAU-HINH** — Chương trình, Chi nhánh theo mẫu + Nhật ký chung (trong Quyền & nhật ký).
Mỗi PR: `/ponytail lite`, impeccable `layout` + `harden` + `audit`, `web-design-guidelines`, ảnh cặp 1440 tối + 375 sáng, check đầy đủ (ô check-1/2), `/security-review` (PR 2, 5, 6) + `/code-review high` (PR 2, 3, 4).

## 12. [XM] / câu hỏi cho PTA Plan

- ~~[XM-1]~~ **PTA chốt 11/11**: ngưỡng % Final lớp thường (50 / 60 / 70, Mini Test 70) sửa được ở Band & ngưỡng; chỉ áp cho Final chấm sau (giữ giá trị cũ cho lượt đã chấm), có nhật ký; Case & SOS đọc nhãn mốc từ đây.
- **[XM-6] "Cập nhật vai trò"**: thiết kế hiểu là đổi vai của tài khoản + bật / tắt quyền của từng vai sẵn có; **không** thêm / đổi tên / xoá vai (7 vai gắn luật nghiệp vụ trong mã: GVCN, TVV, CX…). Khuyến nghị: giữ; chủ SP muốn tạo vai mới thì làm PR riêng.
- ~~[XM-2]~~ **PTA chốt 11/11**: bảng chung `cau_hinh_phien_ban` (CAU-HINH-CASE-SOS dùng cùng bảng, `loai` = khoá mục); ai merge trước tạo bảng.
- **[XM-3] Thêm lộ trình mới**: không (mã cố định, "Khác" đã phủ). Khuyến nghị: giữ.
- **[XM-4] Hạn "thứ + tuần"** (chấm Mock T4 tuần sau, chốt lộ trình T5 tuần trước Final, xét lại CN tuần 2): cho sửa thứ + tuần lệch; luật T19 / N20 / N21 vẫn là mặc định. Khuyến nghị: có.
- **[XM-5] Bỏ 4 ô đếm** ở Quyền & nhật ký. Khuyến nghị: bỏ.
