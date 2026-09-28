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

| Token | Giá trị hiện có | Dùng ở đâu |
|---|---|---|
| Nền trang | `ink-950` | `body` |
| Bề mặt nội dung | `ink-900` | Card, panel, bảng |
| Bề mặt nổi | `ink-850` | Popover, dropdown, hàng đang hover |
| Đang chọn | `ink-800` + viền `teal-600` | Tab đang mở, hàng đang chọn |
| Viền | `ink-700` | Đường kẻ bảng, viền card |

Chỉ ba mức nền nội dung. Thấy một sắc xanh thứ tư trong màn nào là lỗi cần gỡ, không phải
phong cách riêng của màn đó (design plan 18.1).

### Màu ý nghĩa — chỉ bốn, và chỉ cho điểm số

| Ý nghĩa | Tone | Quy tắc |
|---|---|---|
| Dưới kỳ vọng | `danger` (đỏ) | Điểm tăng nhưng vẫn dưới kỳ vọng **vẫn đỏ** |
| Bằng kỳ vọng | `info` (xanh dương) | |
| Vượt kỳ vọng | `success` (xanh lá) | Không dùng xanh lá cho bất kỳ nghĩa nào khác trên ô điểm |
| Chưa đủ dữ liệu | `muted` (xám) | Khác điểm 0. Khác ô trống |

Trạng thái quy trình (Chờ nhập điểm, Chờ QL duyệt…) dùng **tone trung tính + nhãn chữ**,
không mượn bốn màu điểm. Rule book mục 3.5.

**Thang màu mức SOS — chủ sản phẩm chốt 26/09/2026, giữ nguyên bảng màu đang chạy để đồng bộ:**
SOS 1 **vàng** (`--sos1`) · SOS 2 **cam** (`--sos2`) · SOS 3 **đỏ** (`--sos3`), token ở `web/src/index.css :root`.
Mọi màn phải dùng đúng thang này. Không màn nào được để SOS rơi về xanh dương, vì xanh dương là "bằng kỳ vọng".
**SOS tạm thời** (đợt chưa đủ điểm) mang **đúng màu của mức SOS đó**, thêm **viền đứt** và luôn có chữ
**"tạm thời"**. Ví dụ: `SOS 1 tạm thời` viền đứt vàng, `SOS 2 tạm thời` viền đứt cam. Không dùng một màu chung
cho mọi SOS tạm thời. Hàng "đỏ" ở bảng `<KetQuaDot>` mục 5 đọc theo luật này.

### Chữ và khoảng cách

| Vai trò | Desktop | Ghi chú |
|---|---|---|
| Nội dung chính, số trong bảng | 14–16px | Không dùng cỡ này cho chú thích |
| Phụ, ghi chú | 12–13px | **Cấm** dùng cho kết quả, hạn, người phụ trách |
| Giữa hai khu vực lớn | 20–24px | |
| Trong một khối | 12–16px | |

Số canh phải, tên và nội dung canh trái. Ngày viết `14/09` trong cùng năm, `14/09/2026` khi
bảng có giao năm. Mã tuần luôn kèm khoảng ngày: `W3 SEP 2026 · 14–20/09`.

---

## 3. Bộ component — đang có và cần thêm

### Đang có, dùng lại (`web/src/ui/ui.tsx`)

`Card` · `Level` · `Task` · `Info` · `Status` · `Alert` · `Outcome` · `Empty` · `ErrorState` ·
`Forbidden` · `Skeleton` · `KpiTile` · `Field` · `SectionNote` · `DataCell` · `Th` ·
`BandCell` · `ExamPlanText`. Thêm ở `web/src/ui/`: `Drawer` · `Filters` (chứa week picker) ·
`PeoplePicker` · `SaveState` · `Toast`.

### Cần thêm — năm component, mỗi cái đóng một lỗi đã có thật

| Component | Đóng lỗi nào | Mục |
|---|---|---|
| `<Han>` | F11 — "quá hạn" không nói rõ hạn gì | 4 |
| `<KetQuaDot>` | MT-P01 — Overall trống nhưng badge Đạt | 5 |
| `<TyLe>` | Rule book 11 — % không có mẫu số | 6 |
| `<SoLieu>` | F01/F10 — hai màn cùng tên số, khác tập | `HOP_DONG_SO_LIEU.md` |
| `<NgayNghiepVu>` | MT-P10 — ngày demo 14/09, thao tác 19/09 | 7 |

Không thêm component thứ sáu trong đợt này. Component mới chỉ vào bộ dùng chung khi có **ít
nhất hai màn** gọi nó.

---

## 4. `<Han>` — mọi hạn đều có loại

```tsx
<Han loai="xac-minh-sos" han="2026-09-17" />
<Han loai="nhap-diem" han="2026-09-23" hen="2026-09-30" />
```

`loai` là **bắt buộc**, không có giá trị mặc định. Sáu loại, đúng sáu đồng hồ khác nhau trong
rule book:

| `loai` | Nhãn hiển thị | Luật | Nguồn |
|---|---|---|---|
| `xac-minh-sos` | `Xác minh nguyên nhân · hạn {ngày}` | 3 ngày tính cả ngày đầu | RB 3.4 |
| `lap-pa` | `Cần có phương án · hạn {ngày}` | 5 ngày Cần chú ý / 3 ngày Gấp | RB 4.2 |
| `cap-nhat-pa` | `Ghi kết quả tuần W4 SEP · hạn hết T2 28/09` | Hằng tuần, hết **Thứ Hai** tuần sau | §5.6 R-PA1 (PR-N1) |
| `thuc-hien-y-thuc` | `Thực hiện xong · hạn {ngày}` | 3 ngày Gấp / 5 ngày Cần chú ý | RB 6.2 |
| `hoan-thanh-y-thuc` | `Kết luận đợt · hạn {ngày}` | 7 ngày tính cả ngày mở | RB 6.2 |
| `nhap-diem` | `Hạn nhập điểm {ngày}` | FT: hết thứ Tư tuần kế tuần thi | RB 9.2 |

Thêm một giá trị **không phải hạn**: `du-kien-ket-thuc` → `Dự kiến kết thúc {ngày}`, luôn tone
trung tính, **không bao giờ đỏ**, không bao giờ ghi "quá hạn". Đây là chỗ F11 sai: dự kiến kết
thúc của PA bị trình bày như hạn phải làm.

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

## 9. Bộ chọn tuần — sửa bố cục, không viết lại

Lỗi hiện tại (design plan 22.3): nút `Trước` một hàng, trường tuần một hàng, `Sau`/`Tuần này`
hàng dưới. Đây là lỗi của component + khung chứa, không phải lỗi của một màn.

```
[ ‹ ]  [ W3 SEP 2026 · 14–20/09  ▾ ]  [ › ]  [ Tuần này ]
```

- Một hàng `flex`, `gap: 8px`, cao 40–44px. Nút mũi tên `flex: none`; trường tuần `flex: 1`
  với **`min-width: 0`** — thiếu dòng này là nguyên nhân wrap.
- Panel hẹp (~600px): `Trước / trường / Sau` vẫn cùng hàng; chỉ `Tuần này` xuống hàng, có chủ ý.
- Bấm trường tuần mở **một popover lịch**: gõ ngày hoặc chọn tuần, đổi tháng/năm. Không dropdown
  hàng chục tuần.
- Trường tuần luôn ghi tuần **đang chọn thật**. Không để trống rồi chú thích bên dưới.
- Popover render qua portal, kiểm z-index trong `Drawer` và modal — hiện đang bị cắt.
- Quét mọi nơi dùng: `CaseBoardPage` · `MeetingPage` · `TransitionPanel` · `ClassCreatePanel` ·
  `ClassProgressPanel` · `StudentPlanPanel` · `ScoreSheetPage` · `MockPlanPanel` · `Filters`.

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
