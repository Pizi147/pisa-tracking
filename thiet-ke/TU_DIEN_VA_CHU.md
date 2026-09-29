# Từ điển khái niệm và bộ chữ tiếng Việt

Hai việc trong một file, vì chúng là một vấn đề: **cùng một thứ phải gọi bằng cùng một chữ ở
mọi màn.** Cụ thể hóa rule book mục 2 và design plan mục 19.

---

## 1. Mười hai khái niệm không được nhập làm một

Rule book mục 2. Vi phạm bảng này là lỗi nghiệp vụ, không phải lỗi biên tập.

| Khái niệm | Chữ dùng trên web | Tuyệt đối không viết |
|---|---|---|
| Kết quả cảnh báo từ điểm một đợt Test | `SOS 1/2/3` | "mức gấp", "mức ưu tiên" |
| Dữ liệu điểm cho thấy cần tìm nguyên nhân | `Tín hiệu cần xác minh` | "case", "vấn đề đã xác định" |
| Vấn đề cụ thể của một em, đúng kỹ năng, có phân loại | `Case học thuật` | "SOS", "tín hiệu" |
| ~~Một đợt xử lý BTVN/chuyên cần/tham gia~~ | ~~`Case Ý thức`~~ | **HẾT HIỆU LỰC 21/09/2026** — xem mục 6 |
| Một hoạt động hỗ trợ có người làm và kết quả riêng | `Phương án` (PA) — hỗ trợ học thuật; ở màn trộn: `PA học thuật` | "task", "việc được giao" |
| Kết thúc một hoạt động | `Kết thúc phương án` | "hoàn thành case" |
| Kết luận cả vấn đề | `Hoàn thành case` | "đóng phương án" |
| Đã có đủ điểm các môn bắt buộc của đợt | `Đã đủ điểm` | "đạt", "hoàn tất" |
| Overall đủ dữ liệu và đạt kỳ vọng | `Đạt kỳ vọng` | "đạt cả đợt" khi còn thiếu môn |
| GV báo học viên không làm bài | `Không có bài` (trước CN) → `Không dự thi` (sau chốt) | "vắng" khi chưa chốt, "0 điểm" |
| Lùi ngày xử lý/chấm bài | `Hẹn xử lý` | "dời lịch thi" |
| Đổi tuần thi | `Đổi lịch` | "hẹn xử lý" |

Ba đơn vị đếm **không bao giờ cộng vào nhau**: số SOS hiện tại · số case đang mở · số phương án.

---

## 2. Nhãn thay thế — bảng đối chiếu

Áp dụng ở **mọi biến thể trong code**: nhãn, tiêu đề, modal, trạng thái rỗng, lỗi, toast,
tooltip, aria-label. Không đổi một chỗ rồi coi là xong.

### Màn hồ sơ Test

| Hiện tại | Thay bằng |
|---|---|
| Kế hoạch MT *(khối chứa cả kết quả)* | `Thông tin đợt Mock Test` |
| Tuần hoàn tất | `Tuần dự kiến hoàn tất` |
| Target lúc đánh giá | `Mục tiêu tại thời điểm đánh giá` |
| Chưa xác nhận đã thi | `Chờ nhập điểm` — **và bỏ hẳn vai trò cổng chặn chấm** |
| Bỏ khỏi phạm vi | `Kỹ năng không kiểm tra trong đợt này` |
| Hủy lượt MT *(nút đỏ đầu trang)* | Chuyển vào menu ngoại lệ theo quyền, ghi rõ hủy phần nào |

### Khối case và phương án

| Hiện tại | Thay bằng |
|---|---|
| Chưa có gì diễn ra | `Chưa có phương án hỗ trợ` *(màn trộn — bảng case của Quản lý: `Chưa có PA học thuật`)* |
| Ghi lại phương án đầu tiên để lần sau còn biết đã thử gì cho em | `Thêm phương án hỗ trợ và người phụ trách` |
| Chưa có phương án hỗ trợ nào — chưa ai bắt tay vào việc | `Chưa có phương án hỗ trợ` *(màn trộn — bảng case của Quản lý: `Chưa có PA học thuật`)* |
| Chưa làm gì cho em thì chưa có gì để kết luận | `Cần cập nhật kết quả phương án trước khi hoàn thành case` |
| Đã làm gì *(form nhập bù)* | `Phương án đã áp dụng` |
| Người làm | `Người thực hiện` |
| + thêm dòng | `+ Thêm phương án` |
| Lịch sử và kết thúc phương án | *(bỏ nút, mở tại dòng)* |
| Mở trang riêng | *(bỏ nút, GIỮ route `/hoc-thuat/case/:id`)* |

### Danh sách lớp, học viên, nhập liệu

| Hiện tại | Thay bằng |
|---|---|
| Lớp là gốc… *(dòng hướng dẫn dưới tiêu đề)* | *(bỏ)* |
| badge chỉ xuất hiện… *(chân trang)* | *(bỏ — số bấm được thì hình thức phải cho thấy)* |
| Em nào vào muộn thì ghi đè… | `Có thể chọn tuần bắt đầu riêng cho từng học viên.` |
| Cả lô này vào một lớp… | *(bỏ nếu lớp đích đã rõ trên header)* |
| Bỏ qua 1 dòng lỗi | *(bỏ nút — thay bằng `Xem {n} dòng cần sửa`)* |
| Thêm 0 học viên | Nút `Thêm học viên`, trạng thái disabled |
| Ngày/tháng thi IELTS dự kiến (PR-NHAP) | `Thi dự kiến` — gõ `dd/mm/yyyy` (biết ngày) hoặc `mm/yyyy` (biết tháng) |
| Cột cuối lưới Thêm học viên (PR-NHAP) | `Tình trạng`: `✓ Sẵn sàng` · `{n} lỗi · {m} lưu ý` (bấm mở dòng chi tiết); chân panel `{a} dòng sẵn sàng · {b} dòng cần sửa` |
| Cột FT / Lớp / Lộ trình dán vào lớp không nhận | lưu ý `Bỏ qua — …` (không chặn dòng), ví dụ `Bỏ qua — lộ trình theo lớp (LT1)` |
| Em FT vào muộn (PR-NHAP) | cột `Đã thi tới MT` (0–8) · lưu ý `Học từ {tuần} — {n} MT sẽ là MT lịch sử (MT1, MT2)` · kết quả `{n} MT lịch sử chưa có điểm ({k} em)` + `Nhập điểm MT lịch sử` · Thông tin HV đổi tuần: `MT2, MT3 sẽ dời sang W2 OCT, W2 NOV` |
| Việc của tôi / Cả phạm vi quản lý | Dropdown `Người phụ trách`: Tôi · Tất cả trong phạm vi · Chọn giáo viên |
| Hai mốc kiểm tra đếm từ đây *(lớp FT)* | FT: `Lịch Mock Test được xếp riêng cho từng học viên` · Normal: `Các mốc kiểm tra được tính từ tuần khai giảng` |
| Tiến độ lớp *(menu)* | `Lộ trình` |

### Badge đếm — phải nói đang đếm của ai

| Ngữ cảnh | Chữ |
|---|---|
| Phần GV cần tự làm | `Bạn cần chấm: {n} bài` |
| Toàn lớp | `Lớp còn {n} bài chưa nhập điểm` |
| Thiếu mục tiêu khi nhập HV | `Thiếu mục tiêu: {n} học viên` |

Không vừa ghi toàn lớp vừa dẫn tới việc riêng (RB 17.4, design plan 22.7).

---

## 3. Mẫu câu trạng thái

| Tình huống | Câu |
|---|---|
| Ô điểm gợi ý | `Nhập - nếu học viên không làm bài` |
| Sau khi lưu dấu '-' | `Không có bài · Có thể sửa đến hết Chủ nhật {ngày}` |
| Sau khi chốt cuối tuần | `Không dự thi · Tuần {mã tuần}` |
| Chưa đến lịch | `Chưa đến lịch kiểm tra` |
| Đến lịch, chưa có điểm | `Chờ nhập điểm` |
| Đang chờ QL | `Chờ quản lý duyệt` |
| Ô chọn người, chưa gõ gì (PR-NEN) | vào ô là có danh sách ngay — **không** còn câu `Nhập ít nhất 3 ký tự …` |
| Tìm người không ra kết quả | `Không tìm thấy giáo viên khớp «{chữ đã gõ}»` (ô chọn nhân viên: `người`) |
| Tooltip tuần hoàn tất | `Tuần dự kiến hoàn tất là tuần kiểm tra muộn nhất của các kỹ năng trong đợt.` |
| Báo cáo đơn vị chưa nộp | `Chưa báo cáo` — **không phải** `Ổn` |
| Nháp báo cáo | `Nháp · chưa nộp` |

---

## 4. Nguyên tắc viết

- Ngắn, có đối tượng, có động từ: `Cập nhật kết quả`, `Chọn tuần thi`, `Chờ quản lý duyệt`.
- Không đại từ mơ hồ: "em này", "lượt đó", "máy", "đường này", "chốt chung".
- Không giải thích mô hình dữ liệu trên màn đọc. Đưa vào tooltip `Cách tính` hoặc hộp `Cách đọc`.
- Không viết hoa cả dòng dài. Không dùng dấu gạch không giải thích trong trường cần trạng thái.
- **Không viết lại ghi chú thật do giáo viên nhập.** Biên tập chỉ chạm chuỗi của hệ thống.
- **Không mở đầu câu nhắc bằng "Hãy"** (chốt 22/09/2026, D3 — đảo K3-6): "Hãy chọn học viên." → "Chọn học viên."; "… Hãy bấm Tải lại." → "… Bấm Tải lại."; giữa câu "— hãy xác nhận …" → "— xác nhận …". Áp cho chữ giao diện và mọi câu báo từ máy chủ.
- Câu có số liệu động phải lấy dữ liệu hiện hành; mô tả tại thời điểm phát sinh phải có nhãn
  lịch sử (`lúc mở: 2/4 kỹ năng`).

---

## 5. Cách áp dụng

1. Gom chuỗi hệ thống về `shared/domain/*` theo đúng tám module, hoặc một `web/src/ui/chu.ts`
   nếu chỉ là nhãn trình bày. Không hard-code tiếng Việt rải rác trong JSX.
2. Trước khi đổi một chuỗi, `grep` toàn repo tìm **mọi biến thể** — kể cả trong test, seed và
   thông báo máy chủ.
3. Nghiệm thu bằng cách mở từng màn ở ba vai, không bằng một lần tìm–thay.

---

## 6.0. Ý thức v4 — từ vựng chốt 29/09/2026 (PR-YT4) — THẮNG mục 6 khi mâu thuẫn

Nguồn: đặc tả `docs/superpowers/specs/2026-09-27-nang-cap-sau-deploy-design.md` §5.4–§5.8. Mục 6 dưới đây là từ vựng v3 (lịch sử):
"Phương án (PA)", "Đang chuẩn bị", "Thư cảnh cáo", "Đánh dấu không chính xác", cảnh báo "⚠ quá 5 ngày" **không còn** trên web.

| Khái niệm | Chữ dùng trên web | Tuyệt đối không viết |
|---|---|---|
| Nút ghi một vi phạm (menu dòng, tab lớp, tab HV) | `+ Ghi vi phạm` · tiêu đề panel `Ghi vi phạm` | "Ghi nhận vi phạm" |
| GVCN đã xem, không cần xử lý | `Ghi nhận` (nút) · `Đã ghi nhận · vẫn tính` (nhãn) | "bỏ qua", "đã đọc" |
| GVCN xử lý một nhóm vi phạm theo thang | `Xác nhận xử lý · {bậc}` · một dòng thời gian gọi là `lần xử lý` | "biện pháp", "phương án", "PA" |
| Thang xử lý | `Report 1 → Report 2 → WL 1 → Report 4 + Meeting CX/GĐCN → WL 2 → WL 3` · dòng thang `Thang (LT1)` / `Thang (lớp thường)` | "Thư cảnh cáo", "Warning" |
| Loại cần QL duyệt | `Đề xuất QL duyệt` → `Gửi QL duyệt · trả lời trong 5 ngày` · sau duyệt `Đã thực hiện` | "xin phép", "trình" |
| Em bị xử lý trước khi dùng web | `Khai bậc` (một lần) · QL `Sửa bậc đã khai` | "nhập lịch sử" |
| Sáu nhãn của một vi phạm | `Mới` · `Đã ghi nhận` · `Cần xử lý` · `Quá hạn {n} ngày` · `Chờ QL duyệt` (hoặc `Đã duyệt · chờ thực hiện`) · `Đã xử lý · {bậc}` | "Chưa xử lý", "Đang chuẩn bị" |
| 3 vi phạm / 2 tuần | `{n} vi phạm trong tuần này + tuần trước → bắt buộc xử lý · hạn {dd/mm}` | "cảnh báo", "⚠ quá 5 ngày" |
| Loại hạn ở Việc của tôi | `xu-ly-vi-pham` → `Xử lý vi phạm · hạn {dd/mm}` | — |
| Thẻ quá hạn ở hộp QL | `Báo lên` · `Ý thức quá hạn` | — |
| Huy hiệu ở Học viên cần hỗ trợ | `Ý thức · Quá hạn` (cam) · `Ý thức · Cần xử lý` (vàng) | — |

## 6. Ý thức — từ vựng mới, chốt 21/09/2026

Mô hình Case Ý thức bị bỏ. Nguồn: `NGUON-Rule-Y-thuc-2026-09-21.md`; đặc tả:
`Y_THUC_VI_PHAM_VA_BIEN_PHAP.md`. **Vi phạm bảng này là lỗi nghiệp vụ, không phải lỗi biên tập.**

| Khái niệm | Chữ dùng trên web | Tuyệt đối không viết |
|---|---|---|
| Một sự việc học viên vi phạm, do một GV ghi | `Vi phạm` | "case Ý thức", "đợt", "báo cáo Ý thức", "violation" |
| Việc GVCN làm để xử lý một nhóm vi phạm | `Phương án` (PA) trong tab Ý thức & Phối hợp · ở màn trộn: `PA xử lý` (nhãn ngắn) hoặc `Phương án xử lý …` (tên chỉ số, tiêu đề khối — PR-HV dùng dạng đủ) · `phương án xử lý` trong câu báo từ máy chủ | "biện pháp", "BP", "phương án kỷ luật" |
| Phương án đã tạo, chưa làm xong, còn sửa được | `Đang chuẩn bị` | "nháp", "chờ duyệt", "đang xử lý" |
| Phương án đã làm xong, đã có bằng chứng | `Đã thực hiện` | "hoàn thành", "đóng", "done" |
| Vi phạm chưa gắn vào phương án nào | `Chưa xử lý` | "mới", "đang mở" |
| Vi phạm đang nằm trong một phương án Đang chuẩn bị | `Đang chuẩn bị xử lý` | "đang xử lý" |
| Vi phạm nằm trong ít nhất một phương án Đã thực hiện | `Đã xử lý` | "đã đóng", "đã giải quyết" |
| Vi phạm bị xác định là ghi sai | `Không còn hiệu lực` | "đã xóa", "hủy", "sai" |
| Thao tác đánh dấu ghi sai | `Đánh dấu không chính xác` | "xóa vi phạm", "hủy ghi nhận" |
| Nhắc GVCN có vi phạm để lâu | `Cần xử lý` | "quá hạn", "vi phạm trễ hạn" |

**Bốn đơn vị đếm không bao giờ cộng vào nhau:** số vi phạm · số học viên có vi phạm ·
số phương án xử lý · số lần một loại phương án xử lý.

### 6.1. Năm nhóm vi phạm — đúng năm chữ này

`Chuyên cần` · `BTVN` · `Thái độ / hành vi` · `Kỷ luật lớp học` · `Khác`

Bỏ `Tham gia trên lớp` (Y04). Dữ liệu cũ đổi sang `Thái độ / hành vi`.

### 6.2. Chín phương án xử lý — đúng chín chữ này, xếp nhẹ đến nặng

1. `GV trao đổi ngắn với HS`
2. `GV meeting với HS`
3. `Report cho gia đình`
4. `Thư cảnh cáo lần 1`
5. `CX / GĐCN meeting với HS / PH`
6. `Thư cảnh cáo lần 2`
7. `Đình chỉ học`
8. `Thư cảnh cáo lần 3`
9. `Khác` → ô **Tên phương án** ngay dưới (ô `OKhac`), ≥ 3 ký tự (PR-NEN, T13)

Thứ tự này là thứ tự **BÀY RA**, không phải quy trình bắt buộc. Trên màn có chữ `nhẹ ─ nặng`
ở hai đầu danh sách để người đọc biết mức tương đối.

### 6.3. Mẫu câu trạng thái của Ý thức

| Tình huống | Câu |
|---|---|
| Cảnh báo quá 5 ngày | `⚠ {n} vi phạm chưa được xử lý — vi phạm cũ nhất: {k} ngày trước` |
| Cảnh báo ở đầu tab lớp | `⚠ {n} học viên có vi phạm chưa xử lý quá 5 ngày` |
| Tuổi một vi phạm chưa xử lý | `⚠{k}n` đặt cuối dòng, không cần chữ "ngày" |
| Tuổi một phương án đang chuẩn bị | `tạo {ngày} · {k} ngày` |
| Thư cảnh cáo bị khoá | `chưa gửi Thư cảnh cáo lần {k-1}` — ghi ngay tại dòng bị khoá |
| Thiếu tệp khi xác nhận | `Cần đính kèm tệp hoặc liên kết thư cảnh cáo` |
| Chọn vi phạm của hai em | `Đã chọn {a} của {tên A} và {b} của {tên B} — một phương án xử lý chỉ xử lý một học viên` |
| Cảnh báo trùng trong form | `Ngày {d} em này đã có {n} vi phạm nhóm {nhóm} do {GV} ghi.` |
| Chưa đủ ký tự tìm người | `Nhập ít nhất 3 ký tự để tìm giáo viên` |
| Vi phạm hết hiệu lực trong lịch sử | `{người} đánh dấu {ngày}: "{lý do}"` — dòng phụ dưới vi phạm bị gạch ngang |
| Phương án có vi phạm bị hủy sau đó | `{k} trong {n} vi phạm của phương án này sau đó được xác định là không chính xác.` |
| Lưu vi phạm xong | `Đã ghi vi phạm cho {tên}` + nút `Hoàn tác ({n})` đếm lùi 5 giây (PR-N1) |
| Xác nhận phương án xong | `Đã lưu. {tên}: {n} vi phạm chuyển sang Đã xử lý.` |
| Trạng thái rỗng, khu vi phạm chưa xử lý | `Không còn vi phạm nào chưa xử lý.` |
| Trạng thái rỗng, khu phương án đang chuẩn bị | `Chưa có phương án nào đang chuẩn bị.` |
| Trạng thái rỗng, lịch sử | `Lớp này chưa có phương án xử lý nào.` |
| Trạng thái rỗng, mốc thời gian Ý thức của hồ sơ học viên | `Chưa có gì trong khoảng này` *(PR-K, chờ chủ sản phẩm duyệt)* |
| Trạng thái rỗng, danh sách Phối hợp SOS | `Không có lượt Phối hợp SOS nào` *(PR-K, chờ chủ sản phẩm duyệt)* |
| Xác định nguyên nhân xong | `Đã chọn nguyên nhân` *(PR-K, chờ chủ sản phẩm duyệt)* |
| Đóng case "Không cần theo dõi" xong | `Case đã đóng — Không cần theo dõi` *(PR-K, chờ chủ sản phẩm duyệt)* |
| Thay phương án xong | `Đã thay phương án` *(PR-K, chờ chủ sản phẩm duyệt)* |
| Nút ẩn/hiện lượt Phối hợp SOS đã xong (sub-tab lớp) | `Chỉ hiện lượt chưa xong` / `Hiện cả lượt đã xong` *(PR-K, chờ chủ sản phẩm duyệt)* |
| Xoá một vi phạm chưa nằm trong phương án nào | `Vi phạm này chưa nằm trong phương án nào.` *(PR-K, chờ chủ sản phẩm duyệt)* |
| Xoá vi phạm xong | `Đã xoá vi phạm` *(PR-K, chờ chủ sản phẩm duyệt)* |
| Ghi chú hai nút Lưu ở panel Tạo phương án | `Người phụ trách mặc định là giáo viên chủ nhiệm của lớp em đang học. "Lưu — Đang chuẩn bị" dùng cho việc cần vài ngày (Report, Thư cảnh cáo); "Xác nhận đã làm luôn" dùng cho việc vừa làm tại chỗ.` *(PR-K, chờ chủ sản phẩm duyệt)* |
| Chủ đề case không có danh mục nguyên nhân để chọn | `Chủ đề này chưa có danh mục nguyên nhân để chọn.` *(PR-K2, chờ chủ sản phẩm duyệt)* |

### 6.4. Mức case học thuật — đổi chữ

| Hiện tại | Thay bằng |
|---|---|
| `Cần chú ý` *(mức thấp của case, hạn 5 ngày)* | `Bình thường` |
| `Gấp` *(hạn 3 ngày)* | giữ nguyên |

Lý do: nguồn 21/09 gọi là "Case Bình thường"; và `Cần chú ý` không cho thấy nó là mức **thấp
hơn** `Gấp`. Câu "bỏ Bình thường" ở rule book mục 4.2 hết hiệu lực.


---

## 7. Bản v3 — tối 21/09/2026

| Hiện tại / cũ | Thay bằng |
|---|---|
| Tab `Ý thức` | `Ý thức & Phối hợp` · sub-tab `Vi phạm & xử lý` · `Phối hợp SOS` |
| `Không còn hiệu lực` · `Đánh dấu không chính xác` | **Bỏ.** Chỉ còn `Sửa` · `Xoá` |
| Toggle chế độ xem | `Theo học sinh` · `Theo thời gian` |
| Xác nhận xoá | `Xoá vi phạm này? Nó sẽ bị gỡ khỏi {n} phương án.` |
| Case từ SOS chờ | `Chờ xác nhận nguyên nhân · hạn {ngày}` *(SOS v4 — PR-SOS 29/09)* |
| Phương án điền sẵn | `PA theo quy chế` + khoá · `Chờ xác nhận` → nút `Xác nhận PA` *(SOS v4)* |
| Đóng case từ SOS | `Không cần theo dõi…` → `Gửi Quản lý duyệt` · lý do: `Học sinh có lý do đặc biệt` · `Tình huống đơn lẻ` · `Khác` *(SOS v4: không còn đóng ngay)* |
| Sáu việc phối hợp | `Trao đổi ngắn với HS` · `Trao đổi với gia đình` · `GVCN meeting với HS` · `CX / GĐCN meeting với HS` · `CX / GĐCN meeting với HS / PH` · `Khác` |
| Trạng thái việc phối hợp | `Cần xử lý` · `Đã xong` · `Đã bỏ · {lý do}` |
| Lý do bỏ việc | `Không cần trong trường hợp này` · `Đã xử lý theo cách khác` · `Trùng với phương án xử lý khác` · `Khác` · *(hệ thống)* `Không còn phù hợp do sửa điểm` |
| Tiến độ một lượt | `{a}/{b} hoàn thành` |
| Mức case `Cần chú ý` | `Bình thường` |

**Không** dùng `Report cho gia đình` cho Phối hợp SOS — chữ đó chỉ thuộc phương án xử lý vi phạm.

**SOS v4 (PR-SOS, 29/09/2026)** — thay các dòng Case/PA ở trên khi lệch:

| Chỗ | Chữ |
|---|---|
| Hai lối cho Case chờ nguyên nhân | `Xác nhận nguyên nhân` (nút chính) · `Không cần theo dõi…` (nút phụ) |
| Form xác nhận | tiêu đề `Xác nhận Case` · nút `Xác nhận Case` → chuyển thẳng `Xác nhận PA theo quy chế` · nút `Xác nhận PA` |
| Trạng thái Case (một nhãn) | `Chờ xác nhận nguyên nhân` · `Chờ xác nhận PA` · `Chờ Quản lý duyệt · không theo dõi` · `Đang làm` · `Xong` · `Đã huỷ · không cần theo dõi` · `Hệ thống đóng · {lý do}` |
| PA theo quy chế | `PA theo quy chế — không thay, không kết thúc sớm` · `Kết thúc theo quy chế: đến MT2` · `chưa có lịch` / `chưa có ngày thi` |
| Lần ghi cuối | `Ghi kết quả cuối` · `Tuần này chạm mốc quy chế (…) — lưu là PA kết thúc.` |
| Hoàn thành bị chặn | `Hoàn thành được sau khi PA theo quy chế kết thúc ({mốc})` |
| Gợi ý Mô tả PA | `Nêu hướng dẫn và trọng tâm cụ thể; ai sẽ thực hiện / hỗ trợ / tutor` |
| Gợi ý Tiến triển | `Đã cải thiện ở phần nào, như thế nào, kết quả cụ thể; ai đã thực hiện / hỗ trợ / tutor` |
| Tên Case SOS | chip `MT1` + `{kỹ năng} không đạt` (sửa được) + chip `SOS 3` · chỗ chỉ có chữ: `[MT1] Reading không đạt [SOS 3]` |
| Viết đủ | `Quản lý` — không viết tắt `QL` ở khu Case |

Bỏ: `Gợi ý tự động · chờ xác nhận`, `Chờ GVBM xác định nguyên nhân`, `Xác minh SOS` (ở Case FT), `Dự kiến kết thúc` (PA).

---

## 8. PR-HV — 22/09/2026

Hồ sơ học viên 3 tab + Ý thức & Phối hợp theo prototype v3 (spec `docs/superpowers/specs/2026-09-22-ho-so-hoc-vien-overhaul-design.md`).
Chữ mới của PR này — chờ chủ sản phẩm duyệt cùng PR. Luật D1 (`Phương án`/`PA`; màn trộn `PA xử lý` · `PA học thuật`;
câu báo máy chủ `phương án xử lý`) và D3 (bỏ "Hãy") đã ghi ở §1, §4, §6.

| Chỗ | Chữ |
|---|---|
| Ba tab của hồ sơ học viên (D2) | `Học thuật` (mặc định) · `Ý thức & Phối hợp` · `Hành trình` — địa chỉ `?tab=hoc-thuat\|y-thuc\|hanh-trinh` |
| Bốn ô số đầu hồ sơ (Q7) | `Kết quả Test gần nhất` · `Kỹ năng cần hỗ trợ` · `Case đang mở` · `Việc cần làm tiếp` |
| Ô Test gần nhất, lớp Fast Track / Normal | `MT{n} · {tuần}` / `Giữa khoá · {tuần}` · `Cuối khoá · {tuần}`; không có lượt: `chưa có điểm nào`; ngoài 1–4 phần: `{có}/{cần} phần có điểm` |
| Ô Case đang mở, dòng phụ | `{n} PA đang theo dõi` · `không có case nào đang mở` |
| Ô Việc cần làm tiếp | câu bắt đầu bằng động từ: `Xác minh SOS {kỹ năng}` · `Đề ra PA cho {kỹ năng}` · `Làm PA {kỹ năng}` · `Chờ Quản lý duyệt PA {kỹ năng}` · `Cập nhật PA {kỹ năng}`; dòng phụ `hạn {ngày}` / `quá hạn {ngày}` / `chưa đặt hạn` / `không có việc nào đang chờ`; không có: `Không có` |
| Đầu tab Ý thức & Phối hợp | `Ý thức & Phối hợp` · `Lịch sử của riêng học viên này.` · nút `+ Ghi nhận vi phạm` (A2, cả hồ sơ lớp) · tiêu đề panel `Ghi nhận vi phạm` (nút gửi giữ `Ghi vi phạm`) |
| Tab con | `Vi phạm & xử lý` · `Phối hợp SOS {n}` (n = số lượt chưa hoàn thành) |
| Ô số nhỏ (A3) | `Vi phạm` · tên nhóm (`BTVN`, `Chuyên cần`, …) · `PA đang chuẩn bị` · `Thư cảnh cáo` = `lần {k}` |
| Bộ lọc thời gian | `Tất cả thời gian` · `7 ngày` · `30 ngày` |
| Nhãn dòng thời gian | `Vi phạm` · `Phương án` |
| Dòng phụ vi phạm quá 5 ngày | `⚠ đã {k} ngày` |
| Dòng phụ phương án | `{trạng thái} · gồm {n} vi phạm` |
| Nút theo dòng | vi phạm `Sửa` (xoá nằm trong form sửa: `Xoá vi phạm`) · phương án đang chuẩn bị `Mở` · phương án đã thực hiện `Xem` |
| Tạo phương án từ vi phạm đã tick (A4) | `Tạo phương án từ {n} vi phạm` |
| Hộp chỉ đọc một phương án (nút Xem) | `Trạng thái` · `Ngày thực hiện` · `Người thực hiện` · `Người tham gia` · `Lý do / nội dung` · `{n} vi phạm được xử lý bằng phương án này` · `Tệp hoặc liên kết` · `Xác nhận bởi {người} · {ngày}` · nút `Đóng` |
| Thẻ Phối hợp SOS, hồ sơ học viên | cột 1 `MT{n} · SOS {mức}` + kỹ năng · cột 2 `{a}/{b} việc hoàn thành` + `Hỗ trợ học thuật xem ở tab Học thuật` (link đổi tab) · cột 3 `Đang xử lý` / `Hoàn thành` |
| Thẻ Phối hợp SOS, hồ sơ lớp | cột 1 tên học viên + `MT{n} · SOS {mức} · {kỹ năng}` · cột 2 như trên + `Học thuật theo dõi ở bảng kỹ năng` |
| Việc trong thẻ Phối hợp | `Đã xong` · `Đã bỏ` · `Cần xử lý` · nút `Xác nhận` · `Bỏ ▾` · `+ Thêm việc` |
| Đầu thẻ case học thuật (Q8) | cột 1 `{kỹ năng} · {tên case}` + `{phân loại} · mở {ngày}` (`Chưa phân loại vấn đề`) · cột 2 `{k}/{n} PA có kết quả` / `Chưa có phương án` + việc gần nhất có hạn (`PA tiếp: hạn {ngày}` · `PA gợi ý chờ xác nhận` · `Chờ Quản lý trả lời` · `Cập nhật PA: hạn {ngày}`, thêm ` · quá hạn`) · cột 3 `SOS {mức}` + `Đang xử lý` / `Đã hoàn thành` / `Không cần theo dõi · {lý do}` |
| Thân thẻ case | `Mô tả: {mô tả}` · tiêu đề ba phần `Phương án` · `Kết quả gần nhất` · `Việc tiếp theo` · `▸ {n} PA đã xong` · `▸ Bằng chứng ({n})` |
| Khối một phương án (Q8) | phần 2: `Chưa có kết quả`; phần 3: `Gợi ý tự động · chờ xác nhận` · `Chờ Quản lý trả lời` + `hạn {ngày}` · nút `Ghi kết quả` · `Đã kết thúc · {ngày}` |
| Chân thẻ case | `+ Thêm phương án` · `Hoàn thành case` · `Không cần theo dõi` · cạnh nút mờ: `Chưa hoàn thành: {lý do} · {lý do}` |
| Hồ sơ lớp — dòng học viên (A7) | `{tên}` + `{mã HV} · {trạng thái}` · `{n} vi phạm` + `{n} {nhóm} · …` · `⚠ cũ nhất {k} ngày` / `Không có cảnh báo` + `{n} PA đang chuẩn bị` · nút `Mở` / `Đóng` |
| Hồ sơ lớp — hai thẻ khi mở | `Vi phạm gần đây` (rỗng: `Không có vi phạm chưa xử lý ở nhóm này.`) · `Xử lý`: `Đang chuẩn bị · {n} vi phạm` + nút `Mở phương án` / `Xem`; `Chưa có phương án đang chuẩn bị` + nút `Tạo phương án`; `Gần đây: …`; link `Hồ sơ học viên →` (mở thẳng tab Ý thức) |
| Màn trộn — phía học thuật (Task 8) | `Thiếu PA học thuật` · `PA học thuật cần cập nhật` · `PA học thuật chờ duyệt` · `PA học thuật có kết quả xác định` · `Case thiếu PA học thuật` · `Chưa có PA học thuật` · `Đề xuất PA học thuật` · `Duyệt PA học thuật` · `Làm PA học thuật đã hẹn` · `Loại PA học thuật` · `{n} PA học thuật` · quyền `Duyệt phương án học thuật` |
| Màn trộn — phía Ý thức | `Phương án xử lý đã thực hiện theo loại` · tên chỉ số `Phương án xử lý đã thực hiện` · `Phương án xử lý đang chuẩn bị` · `Phương án xử lý theo loại` · đơn vị `phương án xử lý` |
| Thông báo chuông từ SOS | `Xác định nguyên nhân và xác nhận PA học thuật. Hạn {ngày}.` |
| Hồ sơ không có lộ trình | tab Học thuật: `Học viên chưa có lộ trình nào` (giữ); tab Ý thức và Hành trình vẫn mở được (J8); bốn ô số vẫn hiện |
| Ô Việc cần làm tiếp — hai việc thêm (chủ sản phẩm 22/09) | `Xác định nguyên nhân {kỹ năng}` (đứng trước mọi việc khác, hạn = hạn xác định nguyên nhân) · `Xác nhận PA gợi ý {kỹ năng}`; mọi câu dùng **tên đầy đủ** kỹ năng (`Làm PA Writing Task 2`), ô Kỹ năng cần hỗ trợ cũng vậy |
| Ô Kết quả Test gần nhất | dấu ⚠ chỉ khi đợt còn thiếu điểm; đủ điểm mà có SOS: màu đỏ + ● (không ⚠ đi với "Đã đủ điểm") |
| Bảng Học viên của lớp — dòng dưới tên (chủ sản phẩm 22/09; PR-N1 A2) | một nhãn nhỏ: `SOS {n} tạm thời` (màu của mức, viền đứt) · `SOS {n}` (màu của mức) · `Đạt kỳ vọng` (xám; `· tạm thời` khi mới có một phần điểm) · `Chưa có kết quả` (xám) · `Đã kết thúc` (xám) |
| Bảng Học viên của lớp — thiếu thông tin | `⚠ {n}` (rê chuột/bấm thấy danh sách); các màn khác giữ `Thiếu {n} thông tin` |
| Bảng Học viên của lớp — cột Theo dõi, dòng phụ | `{n} case` · `{n} case bàn giao` (bỏ "quá hạn nhập điểm" — màu đỏ của nhãn việc đã nói; bỏ nhãn "Cần bàn giao" riêng) |
| Nhãn dòng thời gian Ý thức | `Vi phạm` = nhãn trơn xanh dương, không biểu tượng ▶ (quá 5 ngày: `⚠ Vi phạm` đỏ) |

## 9. PR-N1 — 28/09/2026

| Chỗ | Chữ dùng | Không viết |
|---|---|---|
| Tên ứng dụng (thanh đầu, tab trình duyệt, màn đăng nhập) | `Pisa Tracking` | `PISA Progress` |
| Hạn ghi kết quả PA hằng tuần | `Ghi kết quả tuần W4 SEP · hạn hết T2 28/09`; ngắn: `hạn hết T2 {dd/mm}` | `hạn CN`, `trước CN` |
| Quá hạn (mọi loại việc) | `quá hạn {n} ngày` (luôn có số) | `⚠ {n} ngày`, `· quá hạn` trơn |
| SOS chưa đủ điểm các môn | `SOS {n} tạm thời` (màu của mức, viền đứt); IELTS: `SOS {n} tạm thời · {k}/{m} kỹ năng` | `SOS {n}` trơn khi còn thiếu điểm |
| Tỷ lệ môn đạt (lớp thường) | `{x}/{y} môn đạt` · `{x}/{y} môn đạt · SOS {n}` · chưa đủ: `{x}/{k} môn đạt (đã chấm)` | `Đạt {x}/{y} môn`, `Chưa đạt 4/4 môn` |
| PA theo quy chế SOS (máy gán, chạy ngay) | `🔒 theo quy chế` cạnh tên PA | `Gợi ý tự động · chờ xác nhận` |
| Lỗi dưới ô (form) | `Cần ít nhất {n} ký tự (đang có {k})` · `Chưa chọn` · `Chưa điền` | — |
| Chân form sau khi bấm Lưu | `{n} ô cần sửa ↑` (xám, bấm → ô lỗi đầu tiên) | `Còn thiếu: …` (vàng, liệt kê luật) |
| Toast sau thao tác hoàn tác được | `… · Hoàn tác ({n})` đếm lùi 5 giây | toast 10 giây, nút `Hoàn tác` không đếm |
| Nhật ký thay đổi (Quản trị) | nhãn tiếng Việt (`Huỷ phần còn lại của lượt`), mã máy chỉ ở tooltip | `attempt.cancel_part` |
| ⓘ số liệu — không đếm trùng | `Mỗi học viên chỉ đếm 1 lần` · `Mỗi Case chỉ đếm 1 lần` | `COUNT DISTINCT student_id` |

## 10. PR-LOP — 29/09/2026 · ba chữ về lớp (K1-50)

Ba chữ khác nhau, không dùng lẫn. Panel Tạo lớp hỏi đúng thứ tự: Chi nhánh → **Kiểu lớp** → **Lộ trình** (FT) hoặc
**Chương trình** (Lớp thường) → Số lớp.

| Chữ | Nghĩa · giá trị hiện trên màn | Không viết |
|---|---|---|
| `Kiểu lớp` | `Fast Track` · `Lớp thường` | `Loại lớp`, `Normal`, `FT/Normal` |
| `Lộ trình` | chỉ lớp Fast Track: `LT1` · `LT2` · `RF` (tên dài ở tooltip/Quản trị: `Lộ trình 1` · `Lộ trình 2` · `Refire`) | `Chương trình` cho LT1/LT2/RF |
| `Chương trình` | chỉ Lớp thường: `Pre FOU` · `FOU` · `BE` · `ELE` (tên dài ở Quản trị, ví dụ `Pre Foundation`) | mã máy `PREFOU`, `FOUND`; `Lộ trình` cho FOU/BE/ELE |

| Chỗ | Chữ dùng | Không viết |
|---|---|---|
| Tên lớp (máy ghép, không gõ tay) | `{CN} {FT \| FT RF \| Pre FOU \| FOU \| BE \| ELE} {số}` — `MB FT 101`, `MB FT RF 12`, `CP FOU 03` | `MB-FT 101` (tên cũ chỉ còn trong nhật ký, hành trình — là lịch sử) |
| Xem trước tên ở panel Tạo lớp | `Lớp sẽ là MB FT RF 12` | — |
| Ô Số lớp — dòng phụ | `1–4 chữ số, được thêm một chữ cái cuối (101A)` | — |
| Pre FOU chưa mở (tới PR-MON) | nút mờ, `Mở cùng đợt cập nhật hệ môn học` | — |
| Lỗi luật phân công dưới ô | `Chỉ chọn một GVCN` · `Mỗi môn một người` · `Lớp không có môn này` · `GVCN phải dạy ít nhất một kỹ năng — chọn kỹ năng cho cô/thầy này` · `Lớp Pre FOU chỉ có GVCN — GVCN dạy luôn` | câu dài liệt kê luật ở chân form |

---

## 11. PR-NEN — 28/09/2026 (nền giao diện)

Chữ mới của PR nền giao diện (ô ngày, ô "Khác", ô chọn người, nhãn trạng thái, bàn phím) — chờ chủ sản phẩm duyệt cùng PR.
Luật cách dùng ở `HE_GIAO_DIEN.md` §3, §9, §10.

| Chỗ | Chữ |
|---|---|
| Ô ngày — chữ mờ khi ô trống | `dd/mm/yyyy` · ô tháng `mm/yyyy` (không bao giờ hiện dạng máy `2026-09-28`) |
| Ô ngày — nút lịch (trình đọc màn hình đọc) | `Mở lịch` · `Mở lịch tháng`; khung lịch: `Chọn ngày` · `Chọn tuần` · `Chọn tháng` |
| Ô tuần — dòng phụ dưới ô | `W4 SEP · 21/09 – 27/09` |
| Ô ngày — câu lỗi dưới ô | `Gõ dạng dd/mm/yyyy` · `Gõ dạng mm/yyyy` · `Năm cần đủ 4 số, ví dụ 28/09/2026` · `Ngày không có thật` · `Không được sau hôm nay` · `Không được sau {ngày}` · `Không được trước {ngày}` (ô tháng: `… tháng {mm/yyyy}`) |
| Lịch — hàng gợi ý dưới lưới | tiêu đề `Gần đây`; ngày `Hôm nay, 28/09` · `Hôm qua, 27/09` · `Thứ Bảy, 26/09` …; tuần `Tuần này` · `Tuần trước` · `2 tuần trước` (chỗ chỉ nhận từ tuần này: `Tuần này` · `Tuần sau` · `2 tuần sau`); tháng `Tháng này` · `10/2026` … |
| Bộ chọn tuần — ô gõ trong lịch | `Gõ ngày` · chữ mờ `Ví dụ: 28/09/2026` |
| Ô "Khác" | nhãn mặc định `Ghi rõ *` ngay dưới lựa chọn "Khác"; nhãn riêng từng chỗ: `Tên đề xuất` (PA đề xuất) · `Tên phương án` (xử lý Ý thức) · `Tên việc` (việc Phối hợp SOS) · `Ghi rõ lý do` (chuyển lớp / kết thúc học); chữ mờ mặc định `Ví dụ: Đi muộn giờ ăn trưa`; lỗi `Ghi rõ "Khác" là gì` · `Cần ít nhất 3 ký tự (đang có {n})` |
| Ô chọn người — dòng cuối | `Dùng tên ngoài hệ thống: «{tên}»`; chưa gõ tên: `Dùng tên ngoài hệ thống: gõ tên ở ô trên`; tên đã chọn hiện dòng phụ `ngoài hệ thống`; tên quá ngắn: `Gõ tên ngoài hệ thống (ít nhất 2 ký tự).` — thay mọi chữ "người ngoài" (Q23) |
| Sáu nhãn trạng thái chung (`NhanTrangThai`) | `Cần làm` · `Đang làm` · `Chờ duyệt` · `Quá hạn` (biết số ngày: `Quá hạn · {n} ngày`) · `Xong` · `Đã huỷ` |
| Ô tìm học viên, lớp ở đầu trang | không có kết quả: `Không tìm thấy học viên hoặc lớp` |
| Liên kết đầu trang (chỉ hiện khi bấm Tab) | `Bỏ qua tới nội dung` |

## 12. PR-DUYET — 29/09/2026 · hộp Chờ duyệt

Chữ mới của PR này — chờ chủ sản phẩm duyệt cùng PR. Không mã máy (`de_xuat_pa`, `yeu_cau_duyet`) trên màn hình hay trong câu lỗi.

| Chỗ | Chữ |
|---|---|
| Tab Công việc | `Chờ duyệt` (QL, Quản trị — tab đầu) · `Việc học viên` (đổi từ "Hỗ trợ học viên", K1-29) · `Yêu cầu của tôi` (GV) · `Vận hành` · `Báo cáo đơn vị` |
| Chip phân loại (đủ 6, số 0 vẫn hiện) | `Tất cả` · `Học thuật` · `Ý thức` · `Lịch thi` · `Thông tin HV` · `Báo lên`; trạng thái `Đang chờ` · `Đã xử lý (30 ngày)`; `Xếp: quá hạn trước → hạn gần nhất` |
| Tiêu đề thẻ | `Đề xuất PA · {kỹ năng}` · `Xin ý kiến · PA {tên PA}` · `Dời {kỹ năng} {MTn} lần {n}` · `Đề xuất sửa {target/lộ trình/lớp/lịch MT} {cũ} → {mới}` · `Đề xuất sửa: {nội dung}` · `Case chờ nguyên nhân quá hạn · {kỹ năng}` |
| Dòng thẻ | `{người} đề xuất {dd/mm}: "{mô tả}"` · `{người} ({dd/mm}): "{câu hỏi}"` · `Kết quả tuần: {kết quả}` · `Hết {dd/mm} chưa duyệt thì yêu cầu tự huỷ và phần thi bị huỷ.` · `Không cần duyệt — để QL biết và nhắc.` · `Nếu duyệt: …` |
| Hạn (tầng 1) | `Quá hạn {n} ngày` · `Hạn hôm nay` · `Còn {n} ngày`; dòng phụ `hạn {dd/mm}` |
| Nút | `Duyệt` · `Duyệt…` (còn một bước: chọn tuần / ghi chú) · `Từ chối…` · `Trả lời…` · `+ Thêm PA` · `Nhắc {GV}` · `✓ Đã nhắc {giờ}` · `Mở` · `Duyệt {n} yêu cầu` · `Mở hộp duyệt` |
| Ô trong thẻ | `Lý do từ chối (người gửi sẽ đọc)` · `Câu trả lời cho giáo viên` · `Ghi chú việc đã xử lý ở màn gốc` · `Tuần thi mới`; lỗi `Cần ít nhất 3 ký tự` |
| Trạng thái thẻ | `Chờ duyệt` · `Đã duyệt` · `Đã duyệt · tự duyệt` · `Đã trả lời` · `Bị từ chối` · `Tự đóng: {lý do}` |
| Rỗng | `Không có yêu cầu nào đang chờ` · `Chưa có yêu cầu nào được xử lý trong 30 ngày` · `Bạn chưa gửi yêu cầu nào cho Quản lý` |
| Việc học viên (QL) | công tắc `Của tôi` · `Của GV (nhắc)`; `Xem việc của: một GV…`; chip nhóm `Tất cả` · `Chấm điểm` · `Case học thuật` · `Ý thức & Phối hợp` · `Vận hành` |
| Tổng quan | QL: `Hộp Chờ duyệt {n} · {k} quá hạn · gồm {m} Báo lên` (cùng số với chip "Tất cả" và badge) + `Mở hộp duyệt`; GV: `{n} yêu cầu đang chờ QL · {m} bị từ chối →` |
| Xin hỗ trợ QL (Ghi kết quả) | mô tả `Lưu kết quả tuần như Giữ nguyên và gửi câu hỏi cho Quản lý. PA vẫn chạy.` · `Gửi Quản lý · trả lời trong 5 ngày · xem ở Yêu cầu của tôi` (chủ sản phẩm đồng ý 29/09) · đã lưu `Đã gửi Quản lý — PA vẫn chạy`; Ngăn Case `Đã xin QL hỗ trợ {dd/mm} · chờ trả lời · hạn {dd/mm}` · `Quản lý ({tên}) trả lời {dd/mm}: …` |
| Đề xuất sửa | ⋮ `Đề xuất sửa thông tin…`; panel `Đề xuất sửa thông tin` · `Thông tin cần sửa` (`Target` · `Lộ trình` · `Lớp` · `Lịch MT` · `Khác`) · `Lý do` (≥ 15) · `Gửi Quản lý`; toast `Đã gửi — xem ở Công việc › Yêu cầu của tôi`; lỗi `Target và lộ trình do Quản lý sửa. Bấm "Đề xuất sửa" để gửi Quản lý duyệt.` |
| Quản trị | `Đăng ký chờ duyệt`; rỗng `Không có đăng ký nào đang chờ. …` |
| Vận hành | người phụ trách ngoài hệ thống: tên kèm nhãn nhỏ `ngoài hệ thống` |

## 13. PR-MT — 29/09/2026 · lịch MT, MT lịch sử, huỷ lượt, dời do vắng

| Chỗ | Chữ | Không dùng |
|---|---|---|
| Lượt có tuần thi đã qua trước khi được tạo | `MT lịch sử` · nhãn nhỏ `lịch sử` cạnh "MT2" (viền mảnh, chữ xám, không ⚠) | "MT cũ", "MT bù" |
| Tình trạng / hạn của ô MT lịch sử | `Nhập bù, không có hạn` | "Quá hạn", "Chưa có hạn" |
| Dòng nhắc cuối Lịch Test (GVCN, Quản lý) | `MT lịch sử chưa nhập · {n} em · {lớp} → Nhập` | số đỏ |
| Việc cần làm (nhóm Thiếu dữ liệu) | `Nhập MT lịch sử · {n} em · không tính hạn` · trạng thái `Không tính hạn` |  |
| Hồ sơ Test — huỷ | `Huỷ cả lượt MT{n}` (chỉ MT cuối cùng chưa có điểm, chưa thi kỹ năng nào; "Số MT{n} sẽ dùng lại được") · `Huỷ phần còn lại` ("MT{n} giữ số; kỹ năng đã có điểm giữ nguyên") | "Huỷ lượt" chung chung |
| Lỗi đánh số | `Chưa có MT{k} — xếp MT{k} trước rồi mới xếp MT{n}.` · `Lộ trình này đã có MT{n}. Đổi tuần thay vì tạo mới.` |  |
| Nợ tuần trước — dời do vắng | dòng phụ `dời từ W3 SEP · vắng lần 1` |  |
| Hàng lớp ở Lịch Test | `vắng · chờ Quản lý duyệt dời` | "chờ QL" (không viết tắt trên màn) |
| Thông báo máy tự dời | `Đã tự dời {kỹ năng} của {em} · MT{n} sang {W…} (vắng lần 1).` |  |
| Case đóng vì huỷ lượt | `Lượt đã huỷ` · việc Phối hợp bỏ vì `Lượt Test đã huỷ` |  |
| Mốc Case khi đổi LT ↔ RF | `Sang lộ trình mới` |  |

---

## 14. PR-MON — 29/09/2026 (hệ môn học, hai khung)

Tên môn theo CHƯƠNG TRÌNH (một nguồn `tenMon` / `tenMonNgan`, `shared/domain/normal.ts`). Không dùng trong bộ lọc (MH3).

| Chỗ | Chữ |
|---|---|
| Ô W của lớp FOU | ngắn `G+V` · đầy đủ (tooltip, tiêu đề Case, Excel) `Grammar + Vocabulary` |
| Ô S của lớp FOU | ngắn `P` · đầy đủ `Pronunciation` |
| Ô duy nhất của lớp Pre FOU | `Tổng hợp` (ngắn và đầy đủ như nhau) |
| BE / ELE / Fast Track | giữ `L · R · W · S` · `L · R · W1 · W2 · S` |
| Kết quả Pre FOU (lưới, hàng HV, Hành trình, Tổng quan) | `68%` · ghim `Cuối · 68%` · Tổng quan `Cuối khoá 55%` — không `SOS` |
| Điện thoại, lưới Pre FOU | dòng đầu `Cuối khoá · Tổng hợp` (thay hàng chip môn) |
| Nguyên nhân Case FOU G+V | `Từ vựng` · `Ngữ pháp` · `Khác` |
| Nguyên nhân Case FOU P | `Âm` · `Trọng âm` · `Ngữ điệu` · `Khác` |
| Nguyên nhân Case Pre FOU (Tổng hợp) | `Từ vựng / ngữ pháp` · `Kỹ năng nghe – đọc` · `Kỹ năng nói – viết` · `Tâm lý và độ tập trung` · `Khác` |
| Nhóm lỗi chung mới (Vấn đề HV) | `Phát âm` |
| Công tắc khung (Lịch Test, Kế hoạch Test) | `Fast Track · 3 lớp` · `Lớp thường · 2 lớp` |
| Công tắc khung (Công việc) | `Tất cả` · `Fast Track` · `Lớp thường` (kèm số việc) |
| Kế hoạch Test lớp thường — thiếu tuần | `Cần chọn tuần cho 1 môn.` · `Cần chọn tuần cho cả 4 môn.` |
| Kỹ năng phụ trách được (Hồ sơ cá nhân, Quản trị, Đăng ký) | năm nút `L · R · W1 · W2 · S` (tooltip tên đầy đủ) |
| Gợi ý phân công trong danh sách người | `Nguyễn A · 3 lớp — dạy được W1, W2` |
