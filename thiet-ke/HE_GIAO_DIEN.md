# Hệ giao diện dùng chung

Cụ thể hóa `PISA-Design-Plan-after-PR28.md` mục 18.1 thành thứ code được. Nền hiện tại:
`web/src/ui/ui.tsx`, `web/src/ui/Filters.tsx`, `tailwind.config.js` (bảng màu `ink` + `teal`).
**Không dựng hệ thứ hai** — bổ sung vào bộ đang có.

---

## 1. Nguyên tắc không được vi phạm

1. **Màu không bao giờ là tín hiệu duy nhất.** Mọi trạng thái có nhãn chữ. Kiểm bằng cách
   chụp màn hình rồi chuyển sang xám: còn đọc được thì đạt.
2. **Không hiển thị ngày trần cho một nghĩa vụ thời gian.** Mọi hạn đi qua `<Han loai=…>`
   (mục 4). Rule book mục 9.2: hạn thực hiện PA, cập nhật PA, nhập điểm và duyệt lịch **không
   dùng chung một trường**, nên cũng không dùng chung một cách hiển thị.
3. **Không hiện phần trăm mà không có n/N.** Rule book mục 11. Đi qua `<TyLe>` (mục 6).
4. **Không hiện badge "đạt" khi chưa đủ điểm.** Rule book mục 3.1, lỗi MT-P01. Đi qua
   `<KetQuaDot>` (mục 5).
5. **Một vùng một nút chính.** Các thao tác còn lại là nút phụ hoặc nằm trong menu. Thao tác
   phá hủy (Hủy lượt MT) không bao giờ là nút chính.
6. **Bốn trạng thái dữ liệu cho mọi khối đọc dữ liệu**: đang tải · rỗng · lỗi · không có quyền
   (mục 8). Thiếu một trạng thái là thiếu, không phải "chưa gặp".

---

## 2. Token

### Màu nền và bề mặt

Màu thật khai báo **một chỗ, hai khối** ở `web/src/index.css`: `:root` = **Tối** (mặc định) và `:root[data-theme="light"]` = **Sáng**
(PR-SANG, T15). Nút ◐ ở thanh đầu (`ui/CongTacGiaoDien.tsx`) đổi giữa hai khối, nhớ theo máy (`localStorage` khoá `pisa-giao-dien`).
**Luật:** màu chỉ đi qua token — component không viết hex / `rgb(…)` số / cấp màu Tailwind chưa ánh xạ; `tailwind.config.js` ánh xạ tên Tailwind cũ
(`slate-100…700`, `white`, `ink-800/950`, `teal-*`, `rose/amber/sky/emerald-*`) về biến, nên tên là tên **cũ**, giá trị **theo chế độ**. Phép kiểm
`prSang.tests.ts` S1–S6 chặn (tương phản ≥ 4.5:1 hai chế độ, viền ô nhập sáng ≥ 3:1, đủ cặp token, không màu cứng, mọi cấp màu dùng đều ánh xạ).
Bảng `ink` trong `tailwind.config.js` chỉ còn `ink-800` ("Đang chọn") và `ink-950` (chữ trên chip `doing` đặc).

| Token | Tối | Sáng | Dùng ở đâu |
|---|---|---|---|
| Nền trang | `--bg` `#0c1220` | `#f5f7fa` | `body` |
| Bề mặt nội dung | `--surface` `#141d2f` | `#ffffff` | Card (lớp `.card`), panel `KhungPanel`, bảng |
| Bề mặt nổi | `--surface-2` `#1a2437` | `#eef1f5` | Popover, menu ⋯, lịch `LichNho`, nút thường (`.btn`), đầu cột bảng |
| Đang chọn | `chon-*`: nền `#13212d`, viền `#0d9488`, ✓ `#5eead4` | nền `#e0f2ef`, viền + ✓ `#0f766e` | Nút đang chọn `NutChon`, bộ lọc `BoLocDoan`, ngày/tuần đang chọn trên lịch — cùng nghĩa (nền + viền + ✓) ở hai chế độ |
| Viền | `--line`, `--line-strong` (`rgba(160,178,214,…)`) | `rgba(15,23,42,…)`; viền ô nhập `--o-nhap-vien` `#7c8799` (≥ 3:1) | Đường kẻ bảng, viền card, ô nhập |
| Chữ | `--text` `#dde5f2`; `slate-100/200/300` = `chu-1/2/3` | `#0f172a`; `chu-1/2/3` đậm dần | Chữ chính, chữ phụ |
| Chữ phụ | `slate-400` = `--text-dim`, `slate-500` = `--text-faint` | `71 85 105`, `91 102 120` | Chú thích; luôn ≥ 4.5:1 |
| Dấu trang trí | `slate-600/700` = `chu-mo*` | nhạt | **Chỉ** dấu (`—`, `/`, `›`, `→`); chữ thật dùng `slate-500` trở lên (phép kiểm S8) |

**Đang chọn của ô MT** (`ui/OMt.tsx`, mockup Mock Test 05/10 phần 3): màu **đảo** — nền `var(--text)`, chữ `var(--bg)`, viền 2px cùng nền, `✓` sau chữ. Tối: nền sáng chữ tối (đúng mockup); sáng: nền tối chữ sáng. Vẫn khác hẳn "Đang thi" (nền `doing`) ở cả hai chế độ, nên **không** dùng `chon-*` cho ô MT.

Màu nghĩa (`ok, bad, late, soon, doing, done, wait, muted` — chữ · nền · viền) có giá trị riêng cho từng chế độ, **cùng nghĩa, cùng tông**, chỉ đậm/nhạt khác;
SOS 1 vàng · SOS 2 cam · SOS 3 đỏ · Đạt xanh lá giữ nguyên ở chế độ sáng. Đổi chế độ **tức thì**, không hiệu ứng chuyển màu.

Hàng đang rê chuột dùng lớp phủ mờ (`bg-white/5` = `--phu-rgb`: trắng ở tối, mực ở sáng), không phải một mức nền riêng. Chỉ ba mức nền nội dung.
Thấy một sắc xanh thứ tư trong màn nào là lỗi cần gỡ, không phải phong cách riêng của màn đó (design plan 18.1).

### Màu ý nghĩa — chỉ bốn, và chỉ cho điểm số

| Ý nghĩa | Tone | Quy tắc |
|---|---|---|
| Dưới kỳ vọng | `danger` (đỏ) | Điểm tăng nhưng vẫn dưới kỳ vọng **vẫn đỏ** |
| Bằng kỳ vọng | `info` (xanh dương) | |
| Vượt kỳ vọng | `success` (xanh lá) | Không dùng xanh lá cho bất kỳ nghĩa nào khác trên ô điểm |
| Chưa đủ dữ liệu | `muted` (xám) | Khác điểm 0. Khác ô trống |

**Một trạng thái, một màu (UX-G G2):** bảng `TONE_TRANG_THAI` ở `web/src/ui/Nhan.tsx` — chờ chấm, chờ duyệt cùng tông `wait` (tím); xanh dương chỉ là "đang chạy"; mức độ "Bình thường" trung tính.

Trạng thái quy trình (Chờ nhập điểm, Chờ QL duyệt…) dùng **tone trung tính + nhãn chữ**,
không mượn bốn màu điểm. Rule book mục 3.5.

**Thang màu mức SOS — chủ sản phẩm chốt 26/09/2026, giữ nguyên bảng màu đang chạy để đồng bộ:**
SOS 1 **vàng** (`--sos1`) · SOS 2 **cam** (`--sos2`) · SOS 3 **đỏ** (`--sos3`), token ở `web/src/index.css :root`.
Mọi màn phải dùng đúng thang này. Không màn nào được để SOS rơi về xanh dương, vì xanh dương là "bằng kỳ vọng".
**SOS tạm thời** (đợt chưa đủ điểm) mang **đúng màu của mức SOS đó**, thêm **viền đứt** và luôn có chữ
**"tạm thời"**. Ví dụ: `SOS 1 tạm thời` viền đứt vàng, `SOS 2 tạm thời` viền đứt cam. Không dùng một màu chung
cho mọi SOS tạm thời. Hàng "đỏ" ở bảng `<KetQuaDot>` mục 5 đọc theo luật này.

### Chữ và khoảng cách

**Phông: Be Vietnam Pro** (PR-SANG, T16), tự phục vụ bằng gói `@fontsource/be-vietnam-pro` (bó vào bản build, cùng tên miền, không gọi Google), năm độ đậm
400–800, khai ở `--font-sans`. **Chữ số 0–9 lấy từ Inter** (`@fontsource/inter`, khai lại họ `'Be Vietnam Pro'` với `unicode-range` chỉ gồm chữ số) vì Be Vietnam Pro
không có số cùng độ rộng: `tabular-nums` vẫn là cách canh số thẳng cột.

| Vai trò | Desktop | Ghi chú |
|---|---|---|
| Nội dung chính, số trong bảng | 14–16px | Không dùng cỡ này cho chú thích |
| Kết quả, hạn, trạng thái, người phụ trách, số đếm việc | **≥ 12px** (`text-xs`) | Sàn cứng; kèm `slate-400` trở lên |
| Phụ, ghi chú, mã, chú giải, ký hiệu nhỏ | 11px (`text-[11px]`) — không chữ nào nhỏ hơn (phép kiểm S8) | **Cấm** dùng cho kết quả, hạn, người phụ trách |
| Badge `Nhan`, số đếm trên menu / chuông | 11,5px | |
| Giữa hai khu vực lớn | 20–24px | |
| Trong một khối | 12–16px | |

Số canh phải, tên và nội dung canh trái. Ngày viết `14/09` trong cùng năm, `14/09/2026` khi
bảng có giao năm. Mã tuần luôn kèm khoảng ngày: `W3 SEP 2026 · 14–20/09`.

---

## 3. Bộ component — đang có và cần thêm

### Đang có, dùng lại (`web/src/ui/ui.tsx`)

`Card` · `Level` · `Task` · `Info` · `Status` · `Alert` · `Outcome` · `Empty` · `ErrorState` ·
`Forbidden` · `Skeleton` · `KpiTile` · `Field` · `SectionNote` · `DataCell` · `Th` ·
`BandCell` · `ExamPlanText`. Thêm ở `web/src/ui/`: `KhungPanel` (khung panel duy nhất) · `Modal` và
`ConfirmDialog` (trong file `Drawer.tsx`) · `Filters` (chứa `WeekPicker`) · `PeoplePicker` (`ChonNguoi`) ·
`ChonNgay` (`ChonNgayGan` · `ChonTuan` · `ChonThang` — nay chỉ là lớp bọc `ONgay`) · `MenuDong` · `HangTab` ·
`SaveState` · `Toast`.

`Drawer` (panel cũ) **không dùng cho chỗ mới**: PR-NEN đã chuyển mọi panel sang `KhungPanel` (UX-E E1). Hàm `Drawer` còn
tạm trong `Drawer.tsx` (đánh dấu bỏ) chỉ vì `TransitionPanel` và `ClassCreatePanel` đang chờ PR-LOP; PR-LOP merge xong thì
xoá.

### Thêm ở PR-NEN — đặc tả 27/09 §7.6

Đặc tả 27/09 §7.6 thay luật cũ "không thêm component thứ sáu trong đợt này". Luật "component mới chỉ vào bộ dùng chung khi
có ít nhất hai màn gọi nó" vẫn giữ.

| Thành phần | File | Dùng cho |
|---|---|---|
| `ONgay` | `web/src/ui/ONgay.tsx` | Mọi ô ngày · tuần · tháng · ngày-hoặc-tháng: gõ `dd/mm/yyyy` hoặc bấm biểu tượng lịch (mục 9) |
| `LichNho` | `web/src/ui/LichNho.tsx` | Lịch tự vẽ, lõi chung của `ONgay` và `WeekPicker`: lưới tháng, chọn cả tuần, hàng "Gần đây" |
| `OKhac` | `web/src/ui/OKhac.tsx` | Chọn "Khác" → ô chữ nhỏ ngay dưới (nhãn mặc định `Ghi rõ`, mỗi chỗ có thể đặt nhãn riêng), bắt buộc ≥ 3 ký tự (mục 10) |
| `NutChon` | `web/src/ui/ui.tsx` | Lựa chọn trong form (chọn một trong vài nút): đang chọn = nền `ink-800` + viền `teal-600` + ✓, khác hẳn nút chính (Lưu). Dấu ✓ luôn giữ chỗ nên chữ không nhảy khi chọn |
| `BoLocDoan` | `web/src/ui/ui.tsx` | Một kiểu cho mọi bộ lọc dạng nút liền nhau (có số đếm bên cạnh). Tab của trang vẫn là `HangTab` gạch chân |
| `NhanTrangThai` | `web/src/ui/ui.tsx` | Sáu nhãn trạng thái chung: `Cần làm` · `Đang làm` · `Chờ duyệt` · `Quá hạn` (kèm số ngày) · `Xong` · `Đã huỷ`. Đang áp ở Phối hợp SOS, bảng Case, Học viên & Lớp (góc SOS); Vận hành giữ `Status` |
| `useGiuFocus` | `web/src/ui/giuFocus.ts` | Giữ focus trong panel, Modal, lịch: Tab đi vòng bên trong, đóng thì trả focus (mục 10) |

`ChonNguoi` đổi cách dùng: vào ô là có danh sách ngay (chưa gõ: 20 người, giáo viên cùng lớp đứng đầu), không còn bắt gõ 3
ký tự. Chỗ nhận người ngoài hệ thống luôn có dòng cuối `Dùng tên ngoài hệ thống: «tên»` (tên ≥ 2 ký tự). Người theo dõi
việc Vận hành và người phụ trách xử lý Ý thức **chỉ nhận tài khoản**, vì họ phải đăng nhập mới thấy và nhận việc (Q13).
Việc Vận hành chưa nhận tên ngoài hệ thống: cần thêm cột trong cơ sở dữ liệu, nên chuyển sang PR-DUYET (Q12).

### Thêm ở PR-DUYET — thẻ yêu cầu

| Thành phần | File | Dùng cho |
|---|---|---|
| `TheYeuCau` | `web/src/modules/duyet/TheYeuCau.tsx` | MỘT khuôn thẻ (M8) cho hộp Chờ duyệt, Yêu cầu của tôi, Ngăn Case (`gon`), hồ sơ HV (PR-VAI): nhãn phân loại cùng bề rộng (`w-24`) · việc · học viên · lớp; lý do tối đa 2 dòng (`line-clamp-2`, "Xem thêm"); `Nếu duyệt: …` chữ phụ; cột phải: hạn duyệt là **tầng 1** (14 px đậm, đỏ khi quá hạn) rồi nút theo kiểu thẻ (`Duyệt` · `Từ chối…` · `Mở` / `Trả lời…` · `+ Thêm PA` / `Nhắc {GV}`). Từ chối / Trả lời / ghi chú / chọn tuần mở ô NGAY TRONG THẺ (≥ 3 ký tự, Esc đóng + trả focus, Enter gửi). Không Hoàn tác (Q15) |

`Status kind="doing"` (Đang thực hiện) đổi sang màu trung tính — xanh dương chỉ dành cho ô điểm (Q14).

### Năm component của PR-E — mỗi cái đóng một lỗi đã có thật

| Component | Đóng lỗi nào | Mục |
|---|---|---|
| `<Han>` | F11 — "quá hạn" không nói rõ hạn gì | 4 |
| `<KetQuaDot>` | MT-P01 — Overall trống nhưng badge Đạt | 5 |
| `<TyLe>` | Rule book 11 — % không có mẫu số | 6 |
| `<SoLieu>` | F01/F10 — hai màn cùng tên số, khác tập | `HOP_DONG_SO_LIEU.md` |
| `<NgayNghiepVu>` | MT-P10 — ngày demo 14/09, thao tác 19/09 | 7 |

~~Không thêm component thứ sáu trong đợt này.~~ (đợt PR-E; đã thay bởi đặc tả 27/09 §7.6 — xem bảng PR-NEN ở trên.)
Component mới chỉ vào bộ dùng chung khi có **ít nhất hai màn** gọi nó.

---

## 4. `<Han>` — mọi hạn đều có loại

```tsx
<Han loai="xac-minh-sos" han="2026-09-17" />
<Han loai="nhap-diem" han="2026-09-23" hen="2026-09-30" />
```

`loai` là **bắt buộc**, không có giá trị mặc định. Bảng có tám loại: sáu đồng hồ đã gắn, hai loại PR-NEN
thêm sẵn tên (Q16) để các PR sau gắn luật. PR-YT4 (K5-24) bỏ `thuc-hien-y-thuc`, `hoan-thanh-y-thuc` và gắn luật cho `xu-ly-vi-pham`. Ngoài bảng còn `viec-van-hanh` (hạn việc Vận hành, PR-Ra) và `du-kien-ket-thuc` (không phải hạn, tả ngay dưới bảng). Danh sách trong mã:
`DEADLINE_KINDS` ở `shared/domain/display.ts`.

| `loai` | Nhãn hiển thị | Luật | Nguồn |
|---|---|---|---|
| `xac-minh-sos` | `Xác nhận nguyên nhân / Xác nhận PA · hạn {ngày}` | 3 ngày tính cả ngày đầu (`sos_cases.han_xac_nhan`) | RB 3.4 · PR-SOS |
| `lap-pa` | `Cần có phương án · hạn {ngày}` | 5 ngày Cần chú ý / 3 ngày Gấp | RB 4.2 |
| `cap-nhat-pa` | `Ghi kết quả tuần W4 SEP · hạn hết T2 28/09` | Hằng tuần, hết **Thứ Hai** tuần sau | §5.6 R-PA1 (PR-N1) |
| `nhap-diem` | `Hạn nhập điểm {ngày}` | FT: hết thứ Tư tuần kế tuần thi | RB 9.2 |
| `duyet` | `Duyệt · hạn {ngày} · còn {n} ngày` (chưa quá hạn; hạn hôm nay = `còn 1 ngày`) | thẻ hộp Chờ duyệt: tầng 1 `Quá hạn n ngày` / `Hạn hôm nay` / `Còn n ngày`, dòng phụ `hạn {ngày}` | K1-56, T66 · PR-DUYET (M8) |
| `xu-ly-vi-pham` | `Xử lý vi phạm · hạn {ngày}` | 5 ngày tính cả ngày ghi lên web (`HAN_Y_THUC_NGAY`): vi phạm bắt buộc chưa xử lý · vi phạm Mới chưa Ghi nhận · đề xuất đã duyệt chưa "Đã thực hiện" (từ ngày duyệt). Chuyển lớp → hạn đặt lại từ ngày vào lớp (M-08); Tạm dừng → không hạn | K1-56 · PR-YT4 (T26, V4-5, M-08) |
| `ke-hoach-bo-tro` | `Nộp kế hoạch bổ trợ · hạn {ngày}` | 3 ngày tính cả ngày đầu (`han_ke_hoach`, như `hanXacNhan`); nộp lại sau khi Quản lý từ chối = hôm nay + 2 | K1-56 · PR-LT2a |
| `mini-test` | `Mini Test · hạn {ngày}` | chưa gắn — PR sau | T66 (PR-NEN Q16) |

PR-SOS (Q28-4): **bỏ** `du-kien-ket-thuc` khỏi giao diện — PA thường không còn ngày dự kiến kết thúc; PA theo quy chế nói **mốc** bằng chữ (`đến MT2 · W2 OCT`), không qua `<Han>`. Khoá còn trong `DEADLINE_KINDS` để phép kiểm F11 cũ vẫn chạy, không nơi nào dùng.

Quy tắc hiển thị:

- Quá hạn: `… · quá hạn {n} ngày`, n tính từ **hạn gốc**, không tính từ hạn đã dời.
- Có hẹn xử lý mới: hiện cả hai, cách nhau dấu `·` — `Hạn nhập điểm 23/09 · Hẹn xử lý 30/09`.
  Không ghi đè hạn gốc (RB 9.1).
- Dời hạn có quyền: giữ `han` gốc trong dữ liệu, thêm `hanMoi` + lý do; tooltip hiện lịch sử.
- Không đơn vị "ngày" cho loại `cap-nhat-pa` — nó là mốc Thứ Hai, không phải số ngày còn lại.
- Mọi hạn "*n* ngày" tính **cả ngày đầu** (`hanTheoNgay(ngàyĐầu, n)`, PR-N1): gửi 14/09, hạn 5 ngày → hết 18/09.

### 4a. Báo lỗi form (PR-N1, YC-12.5.2)

- Rời một ô sai → ô viền đỏ + **một câu ngay dưới ô** nói thiếu gì (`Cần ít nhất 15 ký tự (đang có 8)`, `Chưa chọn`,
  `Chưa điền`); ô có số ký tự tối thiểu thì có bộ đếm nhỏ `8/15` bên phải nhãn.
- Chưa bấm Lưu thì chân form **không** nói gì. Bấm Lưu mà còn ô sai → mọi ô sai hiện lý do, chân có **một dòng xám nhỏ**
  `n ô cần sửa ↑` (tên ô ở tooltip); bấm dòng đó → cuộn tới và focus ô lỗi đầu tiên. Không chữ vàng, không liệt kê luật ở chân.
- Câu chặn không gắn với ô nào (ví dụ "Còn 1 PA đang chạy") → chân nói thẳng câu đó, cùng kiểu xám.

### 4b. Toast Hoàn tác (PR-N1, UX-C C1)

- Mọi thao tác hoàn tác được: `toast.hoanTac(...)` — 5 giây, nút `Hoàn tác (5)` đếm lùi; toast trung tính (không xanh).

---

## 5. `<KetQuaDot>` — một câu duy nhất cho tiến độ một đợt Test

Dùng ở: đầu hồ sơ Test, bảng lớp, bảng tuần, hành trình, thẻ HV. **Bốn chỗ này không được tự
viết câu của riêng mình** — đó là cách MT-P02 (header 1/4, nội dung 2/4) sinh ra.

Đầu vào: `{ coDiem: number, yeuCau: number, dat: boolean|null, sos: 0|1|2|3|null }`.

| Điều kiện | Câu hiển thị | Badge |
|---|---|---|
| `coDiem === 0` | `Chưa có điểm · 0/{yeuCau} kỹ năng` | xám |
| `0 < coDiem < yeuCau`, các môn đã chấm đều đạt | `Các kỹ năng đã chấm đều đạt · còn thiếu {yeuCau−coDiem}` | xám |
| `0 < coDiem < yeuCau`, có môn dưới kỳ vọng | `SOS {sos} tạm thời · {coDiem}/{yeuCau} kỹ năng có điểm` | màu của mức SOS đó (vàng/cam/đỏ), viền đứt, chữ **tạm thời** không được bỏ (chốt 26/09) |
| `coDiem === yeuCau`, `sos === 0` | `Đã đủ điểm · Đạt kỳ vọng` | xanh dương/lá theo Overall |
| `coDiem === yeuCau`, `sos > 0` | `Đã đủ điểm · SOS {sos}` | màu của mức SOS đó (vàng/cam/đỏ), viền liền |

Khi `coDiem < yeuCau`, Overall hiển thị đúng chữ **`Chưa đủ điểm`** — không phải ô trống, không
phải `0.0`, và tuyệt đối không kèm badge đạt. Đây là lỗi MT-P01 có bằng chứng ảnh.

Đơn vị đếm: **bốn kỹ năng L/R/W/S**. W1/W2 là hai *bài nhập*, không phải hai kỹ năng. Không
bao giờ ghi `1/5` ở chỗ đang nói kỹ năng (RB 3.2, design plan 20.1).

---

## 6. `<TyLe>` — phần trăm không đứng một mình

```tsx
<TyLe n={12} N={18} nhan="PA có cải thiện" />   →  12/18 PA có cải thiện (67%)
```

- Thứ tự cố định: **n/N trước, phần trăm trong ngoặc sau**.
- `N === 0` → `Chưa có dữ liệu`. Không render `0%`.
- `N < 5` → thêm nhãn phụ `mẫu nhỏ`. Component **không** cho phép prop kiểu "tốt nhất",
  "xếp hạng" (RB 11).
- Mẫu số theo đúng định nghĩa ở `HOP_DONG_SO_LIEU.md`; "Chưa đủ dữ liệu" **không** nằm trong
  N (RB 5, D03 đã duyệt).
- Hai mức `Có tiến bộ` và `Tiến bộ một phần` hiện riêng ở cột, tổng gọi là **Có cải thiện**.

---

## 7. `<NgayNghiepVu>` — phân biệt ngày nghiệp vụ và dấu thời gian thật

Một nguồn duy nhất: `useNgayNghiepVu()`. Khi ngày nghiệp vụ và ngày ghi nhận khác nhau, hiển
thị cả hai: `Ngày nghiệp vụ 14/09 · Ghi nhận 19/09`. Không sửa timestamp thật cho đẹp ảnh, không
giấu một trong hai (design plan 20.4 mục 6).

Bộ chọn tuần, ngày mặc định của form, mốc "hôm nay" của case Ý thức đều đọc từ hàm này.

---

## 8. Bốn trạng thái dữ liệu — bắt buộc cho mọi khối

| Trạng thái | Component | Yêu cầu nội dung |
|---|---|---|
| Đang tải | `Skeleton` | Hình dáng giống bảng thật, không spinner giữa màn |
| Rỗng | `Empty` | **Thiếu cái gì + ai điền được + một nút.** Không viết "Chưa có gì diễn ra" |
| Lỗi | `ErrorState` | Nói việc gì hỏng + nút thử lại. Không hiện mã lỗi kỹ thuật |
| Không quyền | `Forbidden` | Nói phạm vi đang xem, không để ô khóa lớn chiếm diện tích |

Mẫu câu rỗng đã chốt (design plan 20.5): `Chưa có phương án hỗ trợ` · `Thêm phương án hỗ trợ` ·
`Cần cập nhật kết quả phương án trước khi hoàn thành case`. Toàn bộ mẫu câu ở
`TU_DIEN_VA_CHU.md`.

---

## 9. Ô ngày và bộ chọn tuần

### Ô ngày `ONgay` (PR-NEN, T11)

Một ô cho **mọi** ngày, tuần, tháng trên web (trừ thanh ngày của bản demo, Q3). Bốn kiểu: `ngay` · `tuan` · `thang` ·
`ngay-hoac-thang`. Luật thuần ở `shared/domain/oNgay.ts`, có phép kiểm.

- **Gõ hoặc bấm lịch.** Ô hiện `dd/mm/yyyy` (tháng `mm/yyyy`); nút biểu tượng lịch bên phải (hoặc `Alt + ↓`) mở `LichNho`.
  Giá trị gửi máy chủ luôn là dạng máy (`2026-09-28`, tháng `2026-09`) — người dùng không bao giờ thấy dạng này.
- **Cách gõ được nhận:** dấu `/`, `.` hoặc `-`; `d/m` hay `dd/mm` không kèm năm = năm của hôm nay (Q5). Năm 2 chữ số
  **không** nhận, để không đoán sai thế kỷ (Q6): ô ngày và ô tuần báo `Năm cần đủ 4 số, ví dụ 28/09/2026`, ô tháng báo
  `Gõ dạng mm/yyyy`. Ngày không có thật (31/02) báo
  `Ngày không có thật`.
- **Chỉ kiểm khi rời ô hoặc bấm Enter**, không kiểm từng phím.
- **Gõ sai:** ô giữ nguyên chữ đã gõ, hiện câu lỗi ngay dưới ô, và báo về form là **rỗng** — giống ô ngày cũ của trình
  duyệt — nên luật "thiếu ngày thì không Lưu được" của form vẫn chặn.
- **Ngày có sẵn mà chưa đụng tới thì không kiểm lại.** Mở form sửa một bản ghi cũ có ngày nằm ngoài luật hiện tại, chỉ
  Tab qua ô, không bị báo lỗi giả.
- **Xoá hết chữ:** báo rỗng; nơi có mặc định (ví dụ "hôm nay") thì ô hiện lại mặc định.
- **Luật khoảng:** mỗi chỗ giữ đúng luật **đang có** (`không sau hôm nay`, `không trước …`, số tuần lùi/tới, số tháng) —
  không thêm luật mới (Q8). Lỗi: `Không được sau hôm nay` · `Không được trước {ngày}`.
- **Kiểu tuần:** gõ ngày nào cũng nhảy về Thứ Hai của tuần đó; dòng phụ dưới ô: `W4 SEP · 21/09 – 27/09` (Q4). Ô "Đến"
  (`moc="cuoi"`) lưu **Chủ nhật** của tuần, riêng tuần đang diễn ra thì lưu **hôm nay**; ô hiện đúng ngày đã lưu đó, kèm
  cùng dòng phụ tuần.
- **"Hôm nay"** là ngày nghiệp vụ (`useNgayNghiepVu`), không đọc đồng hồ máy.
- `ChonNgayGan` · `ChonTuan` · `ChonThang` giữ tên cũ, nay chỉ là lớp bọc `ONgay` (không còn danh sách thả). Dòng chữ
  "hôm nay · Đổi" (`NgayDoiDuoc`) đã bỏ: các ô đó là ô ngày có sẵn hôm nay (Q2).
- Kiểu `ngay-hoac-thang` đã dựng và có phép kiểm, chưa ô nào dùng; chỗ dùng đầu tiên là PR-NHAP (Q21).

### Lịch `LichNho`

- Vẽ qua portal ra ngoài trang, `position: fixed` — panel, Modal không cắt được. Bám dưới nút mở, hết chỗ thì lật lên trên.
- Lưới tháng Thứ Hai → Chủ nhật. Kiểu tuần chọn **cả hàng**. Kiểu tháng: đầu là năm, thân Th1 … Th12. Ngày ngoài luật mờ,
  gạch ngang, không chọn được.
- Hàng **"Gần đây"** dưới lưới (Q7), đã lọc theo luật của từng chỗ:
  - Ngày: 5 ngày lùi từ `Hôm nay`; chỗ chỉ nhận từ hôm nay trở đi thì 5 ngày từ hôm nay tới.
  - Tuần: `Tuần này` · `Tuần trước` · `2 tuần trước`; chỗ chỉ nhận từ tuần này trở đi thì `Tuần này` · `Tuần sau` ·
    `2 tuần sau`.
  - Tháng: 3 tháng (`Tháng này` …).
- Bàn phím trong lưới: `←`/`→` một ngày, `↑`/`↓` một tuần, `Home`/`End` đầu/cuối tuần, `PageUp`/`PageDown` một tháng;
  `Enter` hoặc `Space` chọn.

### Bộ chọn tuần `WeekPicker` — sửa bố cục, không viết lại

Lỗi cũ (design plan 22.3): nút `Trước` một hàng, trường tuần một hàng, `Sau`/`Tuần này`
hàng dưới. Đây là lỗi của component + khung chứa, không phải lỗi của một màn.

```
[ ‹ ]  [ W3 SEP 2026 · 14–20/09  ▾ ]  [ › ]  [ Tuần này ]
```

- Một hàng `flex`, `gap: 8px`, cao 40–44px. Nút mũi tên `flex: none`; trường tuần `flex: 1`
  với **`min-width: 0`** — thiếu dòng này là nguyên nhân wrap.
- Panel hẹp (~600px): `Trước / trường / Sau` vẫn cùng hàng; chỉ `Tuần này` xuống hàng, có chủ ý.
- Bấm trường tuần mở **`LichNho`** (cùng lịch với `ONgay`): ô `Gõ ngày` (`dd/mm/yyyy`), lưới chọn cả tuần, đổi tháng,
  hàng "Gần đây". Không dropdown hàng chục tuần.
- Trường tuần luôn ghi tuần **đang chọn thật**. Không để trống rồi chú thích bên dưới.

---

## 10. Mobile và bàn phím

**Một quy tắc đổi bảng thành thẻ**, không mỗi màn một kiểu:

| Bề rộng | Cách hiển thị bảng |
|---|---|
| ≥ 1024px | Bảng đầy đủ |
| 640–1023px | Bảng cuộn ngang **trong vùng bảng**, cột đầu dính. Không để cả trang tràn ngang |
| < 640px | Mỗi bản ghi một thẻ, thứ tự thông tin **giống thứ tự cột** của desktop |

- Header hồ sơ học viên **không sticky** (đã chốt từ lâu, giữ).
- Chỉ thanh thao tác của form/bảng đang sửa mới được cố định.
- Không có thao tác nào chỉ xuất hiện khi hover.
- Bảng nhập điểm: `Tab` sang ô kế, `Enter` xuống dòng, gõ `-` là lệnh **Không có bài**, `Esc`
  hủy ô đang sửa. Mỗi dòng có trạng thái lưu riêng (`SaveState`), không lưu cả bảng một lần rồi
  báo một lỗi chung.
- Trên điện thoại, ô bấm phải cao ít nhất 44px.

### Bàn phím và focus (PR-NEN, UX-E E2 · E3)

- **`Esc` chỉ đóng lớp trên cùng**, từng lớp một: lịch → menu (menu ⋯, danh sách chọn người) → Modal → panel. Đóng lịch
  không đóng panel đang chứa nó.
- Menu và danh sách ở **đầu trang** (tìm học viên, thông báo, tài khoản) chỉ nhận `Esc` khi focus đang ở trong đầu trang —
  menu bỏ ngỏ không giành `Esc` của panel hay hộp thoại mở sau.
- **Panel, Modal, lịch nhận focus ở khung** (không tự nhảy vào ô đầu — tránh bật bàn phím ảo trên điện thoại; trình đọc màn
  hình đọc tên panel, Q18). `Tab`/`Shift + Tab` đi vòng bên trong, không lọt ra trang phía sau.
- **Đóng thì trả focus** về nút đã mở. Panel đổi nội dung tại chỗ (nút mở nằm trong panel cũ đã mất) thì focus về nút mở
  ban đầu. Lịch chọn xong trả focus về nút lịch.
- **Menu ⋯:** mở ra là focus mục đầu; `↑`/`↓`/`Home`/`End` đi vòng; `Enter` chọn; `Tab` hoặc `Esc` đóng và về nút ⋯.
- **Ô tìm học viên ở đầu trang:** `↑`/`↓` chọn dòng (học viên rồi lớp), `Enter` mở. Không có kết quả thì hiện `Không tìm thấy học viên hoặc lớp`
  — chỉ sau khi lượt tìm đã trả về, không hiện lúc đang chờ.
- **`Bỏ qua tới nội dung`:** liên kết đầu tiên của trang, chỉ hiện khi bấm `Tab`; chuyển focus thẳng vào vùng nội dung, bỏ
  qua thanh điều hướng. Không thêm một bước vào lịch sử trình duyệt (nút Quay lại không bị kẹt).

### Ô "Khác" `OKhac` (T13)

- Chọn "Khác" → ô chữ nhỏ hiện ngay dưới, bắt buộc ≥ 3 ký tự. Nhãn `Ghi rõ *` là **mặc định**; chỗ cần chữ cụ thể hơn đặt
  nhãn riêng: `Tên đề xuất` (PA đề xuất "Khác": Ghi kết quả PA, Thêm PA, PA điền sẵn từ SOS) · `Tên phương án` (xử lý Ý thức
  "Khác": Tạo phương án, panel Phương án xử lý) · `Tên việc` (thêm việc Phối hợp SOS) · `Ghi rõ lý do` (lý do chuyển lớp / kết thúc
  học). Giữ nhãn mặc định `Ghi rõ`: phân loại nguyên nhân (form tạo Case, Xác định nguyên nhân SOS), lý do Không cần theo dõi,
  lý do bỏ việc Phối hợp, nhóm vi phạm. Luật cũ "Khác thì mô tả ≥ 30 ký tự" đã bỏ (Q10). Kiểm ở
  cả web và máy chủ.
- Câu lỗi hiện sau khi rời ô hoặc bấm Lưu: `Ghi rõ "Khác" là gì` · `Cần ít nhất 3 ký tự (đang có {n})`.
- Form có `useLoiForm` (§4a): ô Ghi rõ là một dòng trong luật của form (khoá `ghi-ro`) — viền đỏ + câu dưới ô, tính vào chân
  "n ô cần sửa ↑", bấm → nhảy tới ô. Form chưa có `useLoiForm` (khối SOS trong Case: nguyên nhân, thay PA, Không cần theo dõi; Phối hợp SOS;
  panel Phương án xử lý): nút chính mờ khi Ghi rõ chưa đạt, câu lỗi dưới ô. Ô ngày bắt buộc trong luật form nhận `id`/`onBlur`/`invalid` của `useLoiForm` qua `ONgay`
  (và lớp bọc `ChonNgayGan`/`ChonTuan`).
- Ô **chỉ tự focus khi vừa chọn "Khác"**. Mở form sửa một bản ghi đã là "Khác" thì không nhảy vào ô.
- Vi phạm "Khác" ghi trước luật mới vẫn sửa được ngày, môn mà **không bị bắt thêm Ghi rõ**; chỉ khi đổi nhóm hoặc sửa mô tả
  mới phải có Ghi rõ.
- Chữ Ghi rõ lưu vào cột có sẵn của từng chỗ. Vi phạm và PA đề xuất không có cột riêng nên ghép vào đầu mô tả
  `{ghi rõ} — {mô tả}` (Q9).
- Ba mục "Khác" trong bảng kiểm đặc tả 27/09 §10.2 **không có danh sách để áp**: báo cáo tutor (chỉ là dòng chữ tự do),
  loại việc Vận hành (không có mục Khác), lý do từ chối duyệt (chưa có — PR-DUYET).

---

## 11. Nghiệm thu hệ giao diện

1. Mỗi component mới có một trang demo nội bộ dựng đủ: rỗng · một bản ghi · nhiều bản ghi ·
   tên dài · lỗi tải · không quyền.
2. Chụp desktop + mobile ở vai QL và GV cho mọi màn đã sửa. Lưu ở `thiet-ke/anh/`.
3. Ảnh chuyển sang xám vẫn đọc được mọi trạng thái.
4. `<Han>` không loại → TypeScript báo lỗi biên dịch, không phải cảnh báo lúc chạy.
5. Bộ chọn tuần thử trong panel 600px, modal rộng và mobile: không rớt hàng ngẫu nhiên, popover
   không bị cắt.
6. Không còn màn nào tự viết câu tiến độ đợt Test ngoài `<KetQuaDot>` (grep `/4 kỹ năng`).


---

## 12. Hai khung và tên môn (PR-MON — MH3, MH4)

- **Tên môn theo chương trình chỉ ở chỗ nói về BÀI:** bài test, lưới chấm / bảng điểm, hồ sơ lớp, hồ sơ HV, Kế hoạch Test và Lịch Test
  khung Lớp thường, xuất Excel. **Không** đưa vào bộ lọc; khung Lớp thường **không có bộ lọc môn** và bảng Tổng hợp không có cột môn
  (`cotKyNangFor` rỗng khi khác Fast Track; "Cả hai" không trộn môn hai khung — MH5).
- **Công tắc khung** `CongTacKhung` = `BoLocDoan` (đang chọn ≠ nút chính), đứng **đầu hàng lọc** (Lịch Test: sau ô Tuần; Kế hoạch
  Test và Công việc: ô đầu tiên), áp cho MỌI khối bên dưới (dải số, Nợ, danh sách lớp / việc). Chỉ một khung có dữ liệu → ẩn. Nhớ
  theo máy (localStorage bọc try/catch); tham số đường dẫn thắng (`loai` ở Test, `khung` ở Công việc). Công việc mặc định **Tất cả**,
  việc không gắn lớp hiện ở mọi khung.
- **Pre FOU một môn:** không chip chọn môn, không chip lọc Hành trình; kết quả là `%` tổng, tông đạt / chưa đạt, không nhãn SOS.
