# Hồ sơ học viên + Ý thức & Phối hợp theo prototype v3 — Thiết kế (PR-HV)

**Ngày:** 22/09/2026 · **Người duyệt:** chủ sản phẩm (3 câu chốt trong chat 22/09, cả ba theo khuyến nghị) ·
**Viết bởi:** session planning.

**Nguồn hình:** `thiet-ke/tham-khao/ho-so-hoc-vien-v3.html` (hồ sơ học viên) và `thiet-ke/tham-khao/ho-so-lop-v3.html`
(hồ sơ lớp). Hai file này là **prototype v3 của chủ sản phẩm** — chúng **thắng** `SOS_VA_PHOI_HOP_V3.md` §7.1 và §7.3 và
`Y_THUC_VI_PHAM_VA_BIEN_PHAP.md` §7 ở mọi chỗ khác nhau về **cách thể hiện**. Luật nghiệp vụ (ai được làm gì, hạn, số
liệu) **không đổi**.

## 1. Vì sao

Chủ sản phẩm xem bản demo sau PR-K/K2/K3 (22/09): hồ sơ học viên "nhiều vấn đề, cách thể hiện hơi xấu và khó kiểm
soát". Session planning mở màn thật và thấy:

| Chỗ | Hiện tại (đã chụp 22/09) | Prototype v3 |
|---|---|---|
| Bố cục | Đầu trang → 4 ô số → bảng kỹ năng (case học thuật) → 3 tab **dồn xuống cuối trang** | Tab ngay dưới đầu trang |
| Dòng thời gian Ý thức | Chữ trơn, tiền tố `[VP]`/`[BP]`, dồn một dòng dài | Lưới 4 cột: ngày · nhãn màu · tiêu đề + dòng phụ · nút |
| Phối hợp SOS (hồ sơ HV) | Danh sách phẳng | Mỗi lượt một thẻ: `MT2 · SOS2` · `2/3 việc hoàn thành` · nhãn; bấm mở |
| Thẻ case học thuật khi mở | Nhiều khối lồng nhau, nút và cảnh báo rải rác, mỗi phương án một dòng dài | Kiểu thẻ như SOS: đầu thẻ 3 cột, bấm mở, nút gom cuối |

## 2. Quyết định đã chốt (chủ sản phẩm, 22/09)

| # | Quyết định |
|---|---|
| D1 | **"Biện pháp (xử lý)" đổi thành "Phương án (PA)"** ở mọi chữ người dùng thấy. Trong tab Ý thức & Phối hợp và tab Học thuật chỉ ghi `Phương án`/`PA` (ngữ cảnh đã rõ). Ở **màn trộn cả hai loại** (Việc cần làm, Phân tích/Thực trạng của Quản lý, thông báo, câu báo từ máy chủ có thể hiện ở bất kỳ đâu): `PA xử lý` (Ý thức) và `PA học thuật`. |
| D2 | **Hồ sơ học viên 3 tab**, không có tab Tổng quan: `Học thuật` (mặc định) · `Ý thức & Phối hợp` · `Hành trình`. Đầu trang + 4 ô số luôn hiện phía trên hàng tab. |
| D3 | **Bỏ "Hãy" ở đầu câu nhắc**: "Hãy chọn học viên." → "Chọn học viên." Áp cho mọi chữ trên giao diện và mọi câu báo từ máy chủ. (Đảo việc K3-6 của PR-K3 — quyết định mới thắng.) |
| D4 | **Lên bản chính (Z2c) đợi PR này merge**, để giáo viên thấy giao diện mới từ ngày đầu. PR này chạy **song song với PR-Z2b**. |
| D5 | PR này **nhận Q7 và Q8 của PR-Q** (4 ô số mới; khối phương án 3 phần). PR-Q giữ phần còn lại (danh sách Học viên & Lớp, hồ sơ lớp 4 tab, Q9 Hành trình). |

## 3. Session planning tự quyết (đủ tự tin, liệt kê để chủ sản phẩm biết)

| # | Tự quyết | Lý do |
|---|---|---|
| A1 | Chỉ đổi **chữ hiển thị**. Tên trong mã (`measure`, `MEASURE_KIND`, bảng `discipline_measures`, mã chỉ số `bien-phap-*`) **giữ nguyên** | Đổi tên trong mã/database là rủi ro lớn không đem lại gì cho người dùng |
| A2 | Nút đầu tab: `+ Ghi nhận vi phạm` (chữ của prototype) ở cả hồ sơ HV và hồ sơ lớp | Theo prototype; cập nhật `TU_DIEN_VA_CHU.md` |
| A3 | Ô tóm tắt Ý thức dạng **ô số nhỏ** (Vi phạm · theo từng nhóm có số > 0 · PA đang chuẩn bị) như prototype, thay câu một dòng của §7.3 | Prototype v3 thắng; ô nhỏ, không phải thẻ số lớn |
| A4 | Giữ **ô tick** trên dòng vi phạm (chỉ người có quyền xử lý) + nút `Tạo phương án từ {n} vi phạm` | Prototype không vẽ nhưng luồng tạo PA từ nhiều vi phạm cần nó; không có nó là mất tính năng |
| A5 | Tab con Phối hợp SOS có số việc chưa xong trên nhãn (`Phối hợp SOS 1`) như prototype. Tab chính `Ý thức & Phối hợp` hiện dấu `⚠` khi có cảnh báo 5 ngày | Nhìn là biết bên nào có việc, không thêm ô số |
| A6 | Tab nhớ qua địa chỉ: `?tab=hoc-thuat|y-thuc|hanh-trinh` (mặc định `hoc-thuat`) — để Việc cần làm / hồ sơ lớp mở thẳng đúng tab | Link sâu; không nhớ bằng localStorage (ít trạng thái ẩn) |
| A7 | Hồ sơ lớp: chỉ chỉnh **tab Ý thức & Phối hợp** cho khớp prototype lớp (dòng học viên lưới 4 cột; mở ra hai thẻ `Vi phạm gần đây | Xử lý`; Phối hợp SOS dạng thẻ). **Không** đổi hồ sơ lớp thành 4 tab (vẫn là PR-Q) | Chung thành phần với hồ sơ HV; phạm vi có giới hạn |
| A8 | File máy chủ mà PR-Z2b đang sửa (`server/src/yThuc/measures.ts`, `server/src/migrate.ts`, `server/src/seed/*`) chỉ được đổi chữ **sau khi Z2b đã merge** (gộp `main` trước) | Tránh xung đột với PR chạm dữ liệu thật |
| A9 | Chữ tiếng Anh trong prototype (`Violation`, `Academic support`) → tiếng Việt (`Vi phạm`, `Hỗ trợ học thuật`) | Prototype là hình, không phải bộ chữ |

## 4. Thiết kế

### 4.1. Hồ sơ học viên — khung trang

```
← Quay lại
┌ Đầu trang ─────────────────────────────────────────────── [+ Case] [⋮] ┐
│ Hồ sơ học viên · PISA-000003                                            │
│ Lê Quang Huy   MB-FT 101 · Fast Track · GVCN Trần Ngọc Hà · mục tiêu 6.5│
└─────────────────────────────────────────────────────────────────────────┘
[Kết quả Test gần nhất] [Kỹ năng cần hỗ trợ] [Case đang mở] [Việc cần làm tiếp]   ← Q7, luôn hiện
(Xác minh vấn đề SOS — khối PendingSignals giữ nguyên chỗ, chỉ khi có)
[ Học thuật ] [ Ý thức & Phối hợp ⚠ ] [ Hành trình ]                            ← hàng tab
┌ nội dung tab ───────────────────────────────────────────────────────────┐
```

- **Q7 — 4 ô số** (thay `HeaderStats`): `Kết quả Test gần nhất` (dùng `<KetQuaDot>`; lớp Normal hiện số môn đủ/thiếu,
  không bịa Overall) · `Kỹ năng cần hỗ trợ` (số kỹ năng dưới kỳ vọng + tên) · `Case đang mở` (số + "{n} PA đang theo
  dõi") · `Việc cần làm tiếp` (động từ + hạn, ví dụ `Cập nhật PA Listening · hạn 30/08`). Ô bấm được là việc của PR-R —
  PR này **không** làm ô bấm được.
- Nút `Lộ trình` trong đầu trang giữ nguyên.

### 4.2. Tab `Học thuật` (mặc định)

Thứ tự: bảng kỹ năng (giữ cách tổ chức "case mở ngay dưới kỹ năng của nó" — design plan §8 giữ) → bảng Mock Test /
Kết quả kiểm tra (chuyển từ tab cũ, nội dung giữ nguyên).

**Thẻ case học thuật mới** (thay `CaseCardView` trong `SkillBoard.tsx`), theo kiểu thẻ SOS của prototype:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Listening · mất điểm ở Section 3 │ 1/2 PA có kết quả          │ [SOS 1]      │  ← đầu thẻ 3 cột, bấm mở/đóng
│ Tư duy & kỹ năng làm bài · mở 12/07│ PA tiếp: hạn 30/08 · quá hạn│ [Đang xử lý] │
├─────────────────────────────────────────────────────────────────────────┤
│ (khối "Chờ GVBM xác định nguyên nhân · hạn …" — nếu case từ SOS chưa xác định) │
│ Mô tả: Em theo kịp Section 1–2 nhưng mất mạch khi có ba người nói.           │
│ ┌ Phương án ───────────────┬ Kết quả gần nhất ─────┬ Việc tiếp theo ──────┐ │  ← Q8, mỗi PA một khối 3 phần
│ │ ▶ Thêm một buổi tutor    │ Chưa có kết quả       │ Ghi kết quả · hạn 30/08│ │
│ │ Trần Ngọc Hà · từ 26/08  │                       │ [Ghi kết quả]         │ │
│ └──────────────────────────┴───────────────────────┴──────────────────────┘ │
│ ▸ 1 PA đã xong (bấm để xem)                                                 │  ← PA đã xong thu gọn; PA đang chạy không bao giờ ẩn
│ ▸ Bằng chứng (0)                                                            │  ← BangChung thu gọn, mở khi bấm
│ MT1 · 06/07   MT2 · 17/08                                                   │
│ [+ Thêm phương án]  [Hoàn thành case]  [Không cần theo dõi]   Chưa hoàn thành: 1 PA chưa có kết quả cuối │
└─────────────────────────────────────────────────────────────────────────┘
```

- Đầu thẻ: cột 1 `{kỹ năng} · {tên}` + dòng phụ phân loại/ngày mở; cột 2 tiến độ PA (`{k}/{n} PA có kết quả`) + việc
  gần nhất có hạn; cột 3 nhãn (SOS mức / `Đang xử lý` / `Đã hoàn thành` / `Không cần theo dõi · {lý do}` — K2-4).
- Mở mặc định: case chưa xong; đóng mặc định: case đã xong.
- Khối PA 3 phần (Q8): trên 375px xếp dọc ba phần. `Gợi ý tự động · chờ xác nhận` + nút Xác nhận/Sửa/Thay (PR-K)
  nằm trong phần "Việc tiếp theo". Lịch sử PA mở tại chỗ như hiện nay.
- Mọi nút hành động của case gom ở **chân thẻ**; lý do chưa hoàn thành được nói cạnh nút mờ.

### 4.3. Tab `Ý thức & Phối hợp` (hồ sơ học viên)

Theo `ho-so-hoc-vien-v3.html`:

```
Ý thức & Phối hợp                                         [+ Ghi nhận vi phạm]
Lịch sử của riêng học viên này.
[ Vi phạm & xử lý ]  [ Phối hợp SOS 1 ]
(banner cảnh báo 5 ngày — nếu có)
[Vi phạm 5] [BTVN 3] [Chuyên cần 2] [PA đang chuẩn bị 1]           ← ô số nhỏ (A3); nhóm có 0 thì không hiện
[Tất cả][BTVN][Chuyên cần][Thái độ][Kỷ luật][Khác]      [Tất cả thời gian][7 ngày][30 ngày]
┌ dòng thời gian (mới nhất trước) ────────────────────────────────────────┐
│ ☐ 18/09 │ [Vi phạm]   │ Thiếu bài Reading · BTVN · GV An           │ [Sửa] │
│   18/09 │ [Phương án] │ Report cho gia đình · Đang chuẩn bị · gồm 3 vi phạm │ [Mở]  │
│ ☐ 15/09 │ [Vi phạm]   │ Không nộp Writing homework · BTVN · ⚠ đã 6 ngày │ [Sửa] │
│   12/09 │ [Phương án] │ GV meeting với HS · Đã thực hiện             │ [Xem] │
└──────────────────────────────────────────────────────────────────────────┘
[Tạo phương án từ {n} vi phạm]                      ← chỉ hiện khi đã tick (A4)
```

- Nhãn màu: `Vi phạm` (xanh; đỏ nếu quá 5 ngày chưa xử lý), `Phương án` (vàng = đang chuẩn bị, xanh lá = đã thực
  hiện). Dùng `Status`/`Level` có sẵn trong `ui.tsx` — không chép CSS của prototype.
- Nút theo dòng: vi phạm `Sửa` (mở form sửa; xoá nằm trong form sửa, giữ hộp xác nhận một dòng) · PA đang chuẩn bị
  `Mở` (mở `ConfirmMeasurePanel`) · PA đã thực hiện `Xem` (mở chi tiết chỉ đọc — đây là việc K2-6 "nút [Mở]/[Xem]" đã
  hoãn, làm luôn).
- **Tab con Phối hợp SOS**: mỗi lượt SOS một thẻ, đầu thẻ 3 cột `MT2 · SOS2` + kỹ năng · `2/3 việc hoàn thành` + dòng
  phụ `Hỗ trợ học thuật xem ở tab Học thuật` (link đổi tab) · nhãn `Đang xử lý`/`Hoàn thành`. Bấm mở danh sách việc:
  tên việc + ngày · `Đã xong` hoặc nút `Xác nhận` (quyền như hiện có). Thẻ chưa xong mở sẵn, thẻ xong đóng.

### 4.4. Tab `Hành trình`

`JourneyTimeline` + danh sách mốc hiện có, chuyển nguyên vào tab. Không thêm tính năng (Q9 vẫn ở PR-Q).

### 4.5. Hồ sơ lớp — tab Ý thức & Phối hợp (theo `ho-so-lop-v3.html`)

- Dòng học viên (Theo học sinh): lưới 4 cột `tên + FT · đang học` · `{n} vi phạm` + chia nhóm · `⚠ cũ nhất {k} ngày`
  (hoặc `Không có cảnh báo`) + `{n} PA đang chuẩn bị` · nút `Mở`. Mở ra hai thẻ: `Vi phạm gần đây` (mỗi dòng ngày ·
  tiêu đề + dòng phụ · nhãn nhóm) và `Xử lý` (PA đang chuẩn bị + `Mở phương án`, hoặc `Chưa có phương án đang chuẩn
  bị` + `Tạo phương án`; `Gần đây: …`; `Hồ sơ học viên`). Giữ nguyên logic lọc/hợp của K2/K3.
- Theo thời gian: một danh sách lưới `ngày · tên HS · tiêu đề + dòng phụ · nhãn nhóm`.
- Phối hợp SOS: thẻ như hồ sơ HV nhưng cột 1 là tên học viên + `MT · SOS`, dòng phụ `Học thuật theo dõi ở bảng kỹ năng`.

### 4.6. Thành phần dùng chung (mới, `web/src/modules/yThuc/` hoặc `web/src/ui/`)

| Thành phần | Dùng ở | Việc |
|---|---|---|
| `DongThoiGian` + `DongThoiGianMuc` | hồ sơ HV (Ý thức), hồ sơ lớp (Theo thời gian) | Lưới ngày · nhãn · nội dung · nút; tự xếp dọc < 750px |
| `TheSos` | hồ sơ HV, hồ sơ lớp (Phối hợp SOS) | Thẻ lượt SOS mở/đóng |
| `TheCase` + `KhoiPhuongAn` | tab Học thuật (SkillBoard) | Thẻ case 3 cột + khối PA 3 phần |
| `OSoNho` | tóm tắt Ý thức | Ô số nhỏ (nhãn + số) |

## 5. Chữ (D1, D3)

- **D1 — bảng đổi chính** (đầy đủ ở kế hoạch): `Biện pháp` → `Phương án` · `biện pháp` → `phương án` · `BP` → `PA` ·
  `Tạo biện pháp từ {n} vi phạm đã chọn` → `Tạo phương án từ {n} vi phạm` · `{n} BP đang chuẩn bị` → `{n} PA đang chuẩn
  bị` · `Mở Biện pháp` → `Mở phương án`. Màn trộn: `PA xử lý` / `PA học thuật`. Câu báo từ máy chủ: `phương án xử lý`
  (vì có thể hiện ở bất kỳ đâu). Tên chỉ số (`shared/domain/metrics.ts`): `Phương án xử lý đã thực hiện` v.v.; mã chỉ số
  giữ nguyên.
- **D3**: bỏ `Hãy ` ở đầu câu (viết hoa chữ sau), và `Hãy` giữa câu (`… Hãy bấm Tải lại.` → `… Bấm Tải lại.`).
- `TU_DIEN_VA_CHU.md`: thay luật dòng ~135 (cấm gọi biện pháp là phương án) bằng luật D1; thêm luật D3 vào phần giọng văn.

## 6. Không làm (để đúng phạm vi)

Ô số bấm được (PR-R) · Q9 Hành trình (PR-Q) · hồ sơ lớp 4 tab (PR-Q) · đổi tên trong mã/database · luật nghiệp vụ mới ·
các việc K2-6 còn lại ngoài nút `[Mở]/[Xem]` (toast Hoàn tác, nút Ghi vi phạm ở ClassRoster, …).

## 7. Nghiệm thu

Bấm thử trên demo (seed mới) ba vai GVCN · GVBM · Quản lý, khổ desktop và 375px, chụp ảnh trước/sau lưu
`thiet-ke/anh/pr-hv/`: hồ sơ Lê Quang Huy ba tab; một case có 2 PA song song, ghi chú dài, tên GV dài; case từ SOS chờ
xác định nguyên nhân; tạo PA từ 2 vi phạm rồi xác nhận; Phối hợp SOS mở/xác nhận một việc; hồ sơ lớp MB-FT 101 hai cách
xem + Phối hợp SOS. `grep` không còn "Biện pháp"/"biện pháp"/"BP" ở chữ người dùng thấy, không còn chuỗi bắt đầu
bằng "Hãy ". Số phép kiểm không giảm.
