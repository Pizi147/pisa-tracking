# Chữ cần sửa trên web PISA Tracking — 10/2026

Dành cho: người/AI đề xuất chữ mới. Đọc mục 0–4 trước. Chỉ điền cột "Đề xuất" (cột cuối). Giữ nguyên {n}, {tên}, {tuần}.

## Mục lục các file con

Mục 5 và 6 nằm ở bốn file con (mỗi file chép lại mục 1 dạng rút gọn):

| File | Màn | Số mục |
|---|---|---|
| [CHU_CAN_SUA_2026-10-a-tong-quan-cong-viec.md](CHU_CAN_SUA_2026-10-a-tong-quan-cong-viec.md) | Tổng quan · Phân tích · Công việc · Chờ duyệt | 133 |
| [CHU_CAN_SUA_2026-10-b-hoc-vien-lop.md](CHU_CAN_SUA_2026-10-b-hoc-vien-lop.md) | Học viên & Lớp · Hồ sơ lớp · Hồ sơ HV · Ngăn Case · Ý thức · Chuyển lớp · Hồ sơ giáo viên | 175 |
| [CHU_CAN_SUA_2026-10-c-test.md](CHU_CAN_SUA_2026-10-c-test.md) | Lịch Test · Nhập điểm · Kế hoạch Test · Hồ sơ Mock Test | 70 |
| [CHU_CAN_SUA_2026-10-d-chung-may-chu.md](CHU_CAN_SUA_2026-10-d-chung-may-chu.md) | Quản trị · thanh trên, chuông, đăng nhập · câu báo lỗi · thông báo chuông · nhật ký | 224 |

**Tổng 602 mục.**

## 0. Chuẩn chung

1. Tiếng Việt tự nhiên, như người dùng thật nói.
2. Ngắn: nhãn, nút, tab, chip **1–3 từ**; tiêu đề cột **≤ 5 từ**.
3. Không dịch máy (không "được … bởi", "của bạn", "thực hiện", "tiến hành").
4. **Được giữ tiếng Anh hoặc nửa Anh nửa Việt** khi tự nhiên và đúng nghĩa hơn: `Target`, `Mock Test`, `Case`, `Band`, `OVR`.
5. **Không có câu giải thích dưới nút/ô.** Nếu câu đó cần, đề xuất bỏ hoặc rút thành tooltip.

Thời gian trên màn dùng mã tuần `W2 OCT`; ngày chỉ cho hạn cụ thể, ngày thi, ngày sinh, nhật ký. Mã tuần **không** phải chữ hệ thống lọt.

## 1. Thuật ngữ đã chốt — không đề xuất ngược

Cột **Không dùng**: các chữ cần bỏ, ngăn cách bằng ` · `. Dòng ghi `(luật theo chỗ)` là luật chọn theo chỗ rộng/chật, không có chữ cấm.
Nguồn: `01/10` = `thiet-ke/THUAT_NGU_2026-10-01.md` (mã A-, B-… là mã dòng trong file đó) · `TD§n` = `thiet-ke/TU_DIEN_VA_CHU.md` mục n · `T1`, `T8`… = `plan.md` mục 2c (chủ sản phẩm 05/10). Khi hai nguồn mâu thuẫn: 05/10 thắng 01/10, 01/10 thắng `TD` (và thắng `THUAT_NGU_DA_CHOT.md` 22/09, bản cũ đã thay).

### 1.1. Luật cốt lõi

| Khái niệm | Chữ dùng | Không dùng | Nguồn |
|---|---|---|---|
| Band mục tiêu thi thật của em | `Target` | Mục tiêu band · Mục tiêu · Band mục tiêu · Band target mới · Mục tiêu tại thời điểm đánh giá | 01/10 B-026, J6 |
| Lượt MT có tuần thi cách tuần hiện tại ≥ 2 tuần | `MT cũ` | MT lịch sử · MT bù | T1 (thắng TD§13 đang ghi ngược) |
| Ghi chú không cần duyệt, báo QL biết | `Nhắc việc` | Để QL biết | T8 |
| Vấn đề học tập cụ thể của em | `Case` (luôn viết hoa) | case · case học vụ | 01/10 B-003, B-004 |
| Hoạt động hỗ trợ có người làm | `PA` (chỗ rộng: `Phương án`) | task · việc được giao · Đề ra PA | 01/10, TD§1 |
| Quản lý | `QL` (chỗ rộng: `Quản lý`); cùng một chỗ ở hai màn viết giống nhau | (luật theo chỗ) | 01/10 |
| Nút thoát hộp | `Đóng` | Thôi | 01/10 D-004 |
| Hành động huỷ thật | `Huỷ …` (dấu trên **y**) | Hủy | 01/10 |
| Báo lên Quản lý | `Báo QL` (`Cảnh báo` chỉ giữ cho nhãn xếp lịch ở Kế hoạch Test) | Báo lên | 01/10 G-047 |
| Lịch các bài kiểm tra | `Lịch Test` | Lịch kiểm tra | 01/10 A-041 |
| Quyết định cho em chuyển lớp | `Xác nhận chuyển lớp` · chỗ dễ lẫn: `Chờ QL xác nhận chuyển lớp` · bàn giao: `GVCN xác nhận bàn giao` | Lệnh chuyển lớp · lệnh chuyển · Ra lệnh chuyển · Huỷ lệnh · Giữ lệnh · Lưu lệnh · Sửa lệnh | 01/10 B-056, D-070, D-071 |
| Một dòng thời gian xử lý vi phạm Ý thức | `lần xử lý` | phương án xử lý · biện pháp · PA (ở Ý thức) | 01/10, TD§6.0 |
| GV báo em không làm bài | gõ `-` → `Không có bài` (trước Chủ nhật) · sau chốt `Không dự thi` | 0 điểm · Ghi vắng thi · Ghi nhận vắng · Bỏ ghi nhận vắng | TD§1, 01/10 D-034 |
| Lùi ngày chấm bài | `Dời hạn chấm` (cả đợt: `Dời hạn chấm cả đợt`) | Hẹn xử lý · Sửa hẹn xử lý · dời lịch thi | TD§1, TD§15 |
| Đổi tuần thi | `Dời lịch thi` (cả đợt: `Dời lịch thi cả đợt`) | Đổi lịch · Đổi lịch cả đợt · Lùi lịch thi · Đổi tuần thi kỹ năng | TD§1, TD§15, 01/10 D-030 |
| Cảnh báo từ điểm một đợt MT | `SOS 1` · `SOS 2` · `SOS 3` | mức gấp · mức ưu tiên | TD§1, 01/10 B-001 |
| Điểm cho thấy cần tìm nguyên nhân | `Tín hiệu cần xác minh` | vấn đề đã xác định | TD§1, 01/10 B-067 |
| Vấn đề cụ thể có phân loại, đúng kỹ năng | `Case học thuật` | SOS · tín hiệu | TD§1 |
| Kết thúc một PA / kết luận cả vấn đề | `Kết thúc PA` / `Hoàn thành Case` | hoàn thành case · đóng phương án | TD§1, 01/10 D-053 |
| Có đủ điểm các môn bắt buộc của đợt | `Đã đủ điểm` | đạt · hoàn tất | TD§1 |
| Overall đủ dữ liệu và đạt kỳ vọng | `Đạt kỳ vọng` | đạt cả đợt | TD§1 |
| Mở đầu câu nhắc | không mở bằng "Hãy" (chữ giao diện và câu báo từ máy chủ): `Chọn học viên.` | Hãy · Vui lòng | TD§4 |
| Tên các tiếng Anh giữ nguyên | `Mock Test`/`MT` · `Fast Track`/`FT` · `OVR` (đầy đủ `Overall`) · `Band` · `KCK` · `RF` · `Listening` · `Reading` · `Writing` · `Speaking` | (luật theo chỗ) | 01/10 B-015, B-022, B-029, B-034, B-070 |
| Mã tuần | `W2 OCT` (JAN … DEC) | (luật theo chỗ) | 01/10 B-043, CLAUDE.md |

Ba đơn vị đếm **không bao giờ cộng vào nhau**: số SOS hiện tại · số Case đang mở · số PA (TD§1).

### 1.2. Tên trang, khu vực, tab

| Khái niệm | Chữ dùng | Không dùng | Nguồn |
|---|---|---|---|
| Tab Công việc hỗ trợ em | `Hỗ trợ học viên` | Việc học viên | 01/10 A-012 |
| Điểm các bài kiểm tra của em | `Kết quả Test` | Kết quả kiểm tra | 01/10 A-023 |
| Tab Quản trị | `Quyền & nhật ký` | Quyền và nhật ký | 01/10 A-033 |
| Trang xem lớp, HV đã cất | `Lưu trữ` | Khu Lưu trữ | 01/10 A-034 |
| Trang chi tiết một lượt MT | `Hồ sơ Mock Test` | Thông tin đợt Mock Test · Hồ sơ đợt | 01/10 A-037, A-038 |
| Khối số đầu trang Lịch Test | `Tiến độ chấm điểm` | Tổng quan chấm điểm | 01/10 A-040 |
| Các lần sửa lịch, sửa điểm | `Lịch sử` | Lịch sử thay đổi · Lịch sử cập nhật · Lịch sử chỉnh sửa | 01/10 A-043 |
| Việc của mình đến hạn hôm nay | `Việc hôm nay` | (khối “Việc của tôi · hôm nay” đổi thành “Việc hôm nay”) | 01/10 A-045 |
| Xuất Excel | `Xuất kết quả Test` | Xuất kết quả Mock Test | 01/10 A-053 |
| Tên trang tính trong Excel Phân tích | `Tổng hợp` · `HV cần chú ý` · `Lớp nhiều vi phạm` · `Xử lý theo loại` (có dấu tiếng Việt) | Tong hop · HV can chu y · Lop nhieu vi pham · Xu ly theo loai | 01/10 A-054 |
| Nhập điểm một lớp | `Nhập điểm` | Nhập điểm Test · Chấm · → Nhập · Nhập điểm cả lớp | 01/10 D-022, D-024 |
| Tên khung công việc | `Ý thức & Phối hợp` · `Vận hành` | Lớp & vận hành · Ý thức (một mình, ở tab tương ứng) | 01/10 F-023, F-024 |

### 1.3. Khái niệm nghiệp vụ

| Khái niệm | Chữ dùng | Không dùng | Nguồn |
|---|---|---|---|
| Case chưa xong khi em chuyển lớp | `Case bàn giao` | Case mang từ lớp trước sang · Case đi theo em sang | 01/10 B-005 |
| Case chưa xong | `Case đang mở` | Case mở · Đang mở | 01/10 C-056, E-005 |
| Kỹ năng không có Case nào | `Không có Case mở` | Không có Case · Không có case | 01/10 C-057 |
| Nhóm lỗi gốc của Case | `Nhóm nguyên nhân` · chưa chọn: `Chưa chọn nhóm nguyên nhân` | Phân loại vấn đề · Phân loại nguyên nhân · Loại lỗi · Chưa phân loại | 01/10 B-064, C-063 |
| Lỗi chính / lỗi phụ của Case | `Vấn đề chính` / `Yếu tố đi kèm` | Lỗi chính · Chỉ lỗi chính · lỗi phụ · Lỗi chính + phụ | 01/10 B-065, B-066 |
| Hướng đi / lớp chuyển đến | `Lớp chuyển đến` | Lớp đích · Lớp mới · Lớp muốn chuyển tới · Lớp dự kiến | 01/10 B-057 |
| Xếp cả lớp sang lớp sau | `Chuyển tiếp lớp` | Chuyển lớp cả lớp · Chuyển nhiều em | 01/10 B-058, D-069 |
| Đóng lớp đã học xong | `Kết thúc lớp` | Kết thúc khoá | 01/10 B-061 |
| Bài kiểm tra | `Bài kiểm tra` | Bài đánh giá | 01/10 B-021 |
| Lớp theo chương trình | `Lớp thường` | Normal · lớp Normal | 01/10 B-030 |
| Thứ tự tuần của khoá | `Tuần học` · `Tuần khai giảng` | Tuần học FT · Tuần khoá · tuần học thứ · Khai giảng (một mình) | 01/10 B-042, B-044 |
| Lúc em dự định thi IELTS thật | `Dự kiến thi` | Thi dự kiến · Thi thật dự kiến · Tháng dự kiến thi · Tuần dự kiến thi · Tháng thi dự kiến | 01/10 B-047, E-039 |
| Điểm khi mới vào | `Điểm đầu vào` | Đầu vào: | 01/10 B-048 |
| Em nghỉ một thời gian | `Tạm dừng học` | Tạm ngưng | 01/10 B-049 |
| Từ lớp thường sang Fast Track | `Lên FT` | Sang Fast Track · Lên Fast Track | 01/10 B-054 |
| Hạn nhập điểm | `Hạn chấm` | Hạn nhập | 01/10 B-075, E-034 |
| Lượt FT em đi theo | `Lộ trình` (chỗ chật `LT1`, `LT2`) | (luật theo chỗ) | 01/10 B-032, B-033 |

### 1.4. Trạng thái và nhãn (chip)

| Khái niệm | Chữ dùng | Không dùng | Nguồn |
|---|---|---|---|
| Đã qua hạn n ngày | `Quá hạn · {n} ngày` · `Quá hạn` (viết hoa) | quá hạn {n} ngày · ⚠ Quá hạn · Trễ {n} ngày · quá hạn | 01/10 C-001, C-002 |
| Hạn cuối là hôm nay | `Hạn hôm nay` | hạn hôm nay | 01/10 C-003 |
| Việc không đặt hạn | `Chưa có hạn` (giữ `Không tính hạn` cho MT cũ) | chưa có hạn · không có hạn · Không có hạn | 01/10 C-004 |
| Việc chưa ai bắt đầu | `Cần làm` | Việc cần làm | 01/10 C-005 |
| Đã làm xong | `Xong` | Đã xong · Đã hoàn thành · Đã hoàn tất · Hoàn tất | 01/10 C-009, C-038, C-071 |
| Điểm đủ hoặc trên kỳ vọng | `Đạt kỳ vọng` | đạt kỳ vọng | 01/10 C-011 |
| Điểm thấp hơn kỳ vọng | `Dưới kỳ vọng` | Chưa đạt kỳ vọng | 01/10 C-012 |
| Chưa có điểm nào | `Chưa có điểm` | chưa có điểm | 01/10 C-020 |
| Chưa tới tuần thi | `Chưa đến lịch` | Chưa tới hạn | 01/10 C-023 |
| Đã có tuần thi | `Đã lên lịch` | Đã xếp | 01/10 C-030 |
| Tuần thi đã đổi | `Đã dời` | Đã dời sang {tuần} | 01/10 C-031 |
| PA hết hạn, chưa có kết quả | `Chờ ghi kết quả` | Đã kết thúc, chưa ghi kết quả | 01/10 C-039 |
| PA chưa có người phụ trách | `Chưa có người thực hiện` | Chưa có người làm · Chưa có người phụ trách | 01/10 C-042 |
| Kết quả PA | `Không tiến bộ` · `Kém hơn` | Không đổi · Giữ nguyên · Giảm | 01/10 C-045, C-046 |
| Web tự đóng Case | `Hệ thống đóng` | Hệ thống tự đóng | 01/10 C-060 |
| Kết quả duyệt | `Đã duyệt` · `Bị từ chối` | Không duyệt · Quản lý từ chối · QL từ chối | 01/10 C-064, C-067 |
| Yêu cầu chưa ai quyết | `Chờ duyệt` | Đang chờ | 01/10 C-065 |
| Đã gửi lời nhắc | `Đã nhắc` | Có nhắc · ✓ Đã nhắc | 01/10 C-068 |
| Việc quản lý đang làm | `Đang xử lý` | Tiếp tục xử lý | 01/10 C-070 |
| Tình trạng lưu | `Đang lưu…` · `Đã lưu` · `Không lưu được` | Lưu lỗi · Chưa lưu được · Lưu thất bại | 01/10 C-080 |

### 1.5. Nút và hành động

| Khái niệm | Chữ dùng | Không dùng | Nguồn |
|---|---|---|---|
| Ghi thay đổi | `Lưu` | Lưu lại | 01/10 D-001 |
| Menu các việc khác | `Thao tác khác` | Thêm thao tác · Thao tác với lớp | 01/10 D-014 |
| Mở lịch chọn tuần | `Chọn tuần` | Chọn tuần… · Chọn tuần khác · Tuần khác… | 01/10 D-018 |
| Chuông, đọc hết | `Đánh dấu đã đọc` | Đọc hết | 01/10 D-021 |
| Bỏ điểm đã nhập | `Huỷ điểm` | xoá điểm · Xoá điểm | 01/10 D-027 |
| Bỏ kỹ năng khỏi lượt | `Bỏ kỹ năng khỏi đợt` · ngược lại `Đưa lại vào đợt` | Bỏ khỏi đợt · Kỹ năng không kiểm tra trong đợt này | 01/10 D-032, TD§15 |
| Em vắng buổi thi | `Báo vắng` | Ghi nhận vắng · Ghi vắng thi · Ghi vắng thi môn | 01/10 D-034 |
| Đặt tuần thi mới cho bài vắng | `Xếp lại bài vắng` | Xử lý việc vắng · Xử lý vắng | 01/10 D-035 |
| QL quyết đề nghị dời | `Trả lời đề nghị dời` | Duyệt dời · Trả lời đề nghị | 01/10 D-036 |
| Huỷ cả một lượt MT | `Huỷ cả lượt MT{n}` · `Huỷ phần còn lại` | Huỷ lượt MT · Huỷ lượt Test · Huỷ lượt | 01/10 D-037, TD§13 |
| Lập PA | `Thêm PA` | Đề ra PA | 01/10 D-046 |
| Ghi PA tiến bộ ra sao | `Ghi kết quả` | Ghi kết quả PA · Lưu kết quả | 01/10 D-047 |
| Theo dõi PA thêm | `Theo dõi thêm` | Tiếp tục theo dõi | 01/10 D-052 |
| Gửi lên Quản lý quyết | `Gửi Quản lý duyệt` (Ý thức giữ `Gửi QL duyệt · trả lời trong 5 ngày`, TD§6.0) | Gửi duyệt · Gửi Quản lý | 01/10 D-057 |
| Giao một việc | `+ Giao việc` | + Công việc | 01/10 D-079, D-080 |
| Ghi một vi phạm | `+ Ghi vi phạm` · panel `Ghi vi phạm` | Ghi nhận vi phạm | TD§6.0 |
| GVCN đã xem vi phạm, không cần xử lý | `Ghi nhận` (nút) · `Đã ghi nhận · vẫn tính` (nhãn) | bỏ qua · đã đọc | TD§6.0 |
| Xử lý nhóm vi phạm | `Xác nhận xử lý · {bậc}` | biện pháp · phương án | TD§6.0 |
| Chip lọc Kế hoạch Test | `Cần xếp lại (n)` | Cần xử lý | TD§15 |
| Nút đầu Kế hoạch Test | `Xếp lịch MT…` (Fast Track) · `Xếp lịch Test…` (Lớp thường) | Xếp lịch hàng loạt… | TD§15 |

### 1.6. Số liệu, tiêu đề cột, người

| Khái niệm | Chữ dùng | Không dùng | Nguồn |
|---|---|---|---|
| Số em đang có SOS | `Học viên có SOS` | Học viên có SOS hiện tại · đang ở mức SOS | 01/10 E-001 |
| Case chưa có PA | `Case chưa có PA` | Case thiếu PA học thuật · Thiếu PA học thuật | 01/10 E-008 |
| Phần trăm em đủ dữ liệu | `Tỷ lệ đủ dữ liệu` | Độ phủ đánh giá · Đủ dữ liệu đánh giá | 01/10 E-013 |
| Bài quá hạn mà chưa có điểm | `Bài quá hạn chưa nhập điểm` | Bài chưa nhập điểm quá hạn · Bài quá hạn nhập | 01/10 E-014 |
| Số bài GV phải chấm | `Cần chấm: {n} bài` | Bạn cần chấm: {n} bài | 01/10 E-017 |
| Bài kiểm tra sắp tới | `Test sắp tới` | Test kế tiếp · Mốc kế tiếp đã xếp lịch | 01/10 E-019 |
| Em hết khoá chưa được xếp lớp | `HV chờ xác nhận chuyển lớp` | Học viên chưa có lệnh chuyển lớp | 01/10 E-021 |
| Người chịu trách nhiệm việc | `Người phụ trách` (PA: `Người thực hiện`) | Người giữ việc · Người làm | 01/10 E-024, F-007 |
| Tình trạng hiện tại | `Trạng thái` | Tình trạng | 01/10 E-026 |
| Dòng cộng cuối bảng | `Tổng` | Cộng | 01/10 E-042 |
| Số lượt theo kết quả | `Kết quả Test` | Kết quả Test (đếm lượt) | 01/10 E-043 |
| Phần trăm bài chấm đúng hạn | `Chấm đúng hạn` | Chấm điểm đúng hạn | 01/10 E-052 |
| Kỹ năng GV dạy được | `Kỹ năng phụ trách được` | Phụ trách được · Tự khai dạy được | 01/10 E-057 |
| Học viên | `HV` (đầy đủ `Học viên`) | Học sinh · HS | 01/10 F-013 → F-015 |
| Giáo viên · chủ nhiệm · bộ môn | `GV` · `GVCN` · `GVBM` (đầy đủ: Giáo viên · Giáo viên chủ nhiệm · Giáo viên bộ môn) | (luật theo chỗ) | 01/10 F-001, F-005, F-006 |
| Tư vấn viên | `TVV` (đầy đủ `Tư vấn viên`) | Người tư vấn | 01/10 F-010 |
| Cha mẹ học viên | `PH` (đầy đủ `Phụ huynh`) | (luật theo chỗ) | 01/10 F-016 |
| Người kèm học ngoài giờ | `Tutor` (viết hoa) | tutor · trợ giảng | 01/10 F-012 |
| Chính người đang dùng | `Tôi` | Bạn · của bạn | 01/10 F-017 |
| Phần mềm tự làm | `Hệ thống` | Web gợi ý · Web tự điền · Máy tự dời | 01/10 F-018 |
| Quyền theo chức vụ | `Vai trò` | Vai · Chức danh | 01/10 F-019 |
| Việc quản lý giao | `Việc được giao` | Công việc được giao | 01/10 F-033 |
| Việc nhỏ trong việc lớn | `Việc con` | Công việc con | 01/10 F-041 |
| Nhóm yêu cầu Chờ duyệt | `Loại yêu cầu` | Phân loại | 01/10 F-042 |
| Thiếu thông tin để đánh giá | `Thiếu dữ liệu đánh giá` | Thiếu dữ liệu cần cho đánh giá | 01/10 F-032 |
| Việc về học viên và gia đình | `Học viên / Phụ huynh` | Học sinh / Phụ huynh | 01/10 F-035 |
| Hạng mục cuối báo cáo | `Vấn đề khác` | Các vấn đề khác | 01/10 F-039 |
| Tin chuông: chuyển lớp bị huỷ | `Đã huỷ chuyển lớp · {tên}` | Lệnh chuyển lớp bị huỷ · Huỷ lệnh chuyển lớp | 01/10 F-067 |
| Tin chuông: bài vắng cần xếp lại | `Xếp lại lịch thi — {tên · lớp}` | Xử lý lịch thi | 01/10 F-068 |
| Tab con trong Vi phạm & xử lý | `Theo xử lý` · `Theo vi phạm` | (tab con trùng tên tab cha) | 01/10 G-004 |
| Việc phối hợp sau SOS | `Phối hợp SOS` | (luật theo chỗ) | 01/10 G-005 |
| Vi phạm GVCN chưa mở | `Vi phạm chưa xem` | vi phạm chưa ai xem · vi phạm mới chưa xem | 01/10 G-025 |
| Lần xử lý đã xong mới nhất | `Lần xử lý gần nhất` | Xử lý gần nhất · Lần xử lý đã xong gần nhất | 01/10 G-058 |
| Loại việc Phối hợp | `Trao đổi ngắn với HV` · `GVCN meeting với HV` · `CX / GĐCN meeting với HV` · `CX / GĐCN meeting với HV / PH` | với HS · meeting HS · meeting với HS | 01/10 G-059…G-063 |
| Trạng thái việc Phối hợp | `Cần xử lý` · `Xong` · `Đã bỏ` | Đã xong | 01/10 G-064 |

### 1.7. Tên môn lớp thường (không đổi)

| Khái niệm | Chữ dùng | Không dùng | Nguồn |
|---|---|---|---|
| Ô W của lớp FOU | ngắn `G+V` · đầy đủ `Grammar + Vocabulary` | (luật theo chỗ) | TD§14 |
| Ô S của lớp FOU | ngắn `P` · đầy đủ `Pronunciation` | (luật theo chỗ) | TD§14 |
| Ô duy nhất của lớp Pre FOU | `Tổng hợp` | (luật theo chỗ) | TD§14 |

## 2. Đã giao PR khác — đừng đề xuất lại

Chữ dưới đây sẽ do PR khác đổi (hoặc chưa có trên `main` lúc quét). Không liệt kê lại ở mục 5–6; nếu gặp thì bỏ qua.

| Chữ / việc | PR đang đổi | Nguồn |
|---|---|---|
| `Để QL biết` → `Nhắc việc` (bỏ số nổi đầu trang; số Chờ duyệt chỉ đếm việc cần duyệt) | PR-NV | plan.md 2c T8 |
| `MT lịch sử` → `MT cũ` ở mọi chỗ (nhãn nhỏ, `Nhập MT lịch sử`, `Nhập điểm MT lịch sử`, `Nhập bù, không có hạn`, `MT lịch sử chưa nhập · {n} em`) | PR-MTa / PR-MTb | T1 |
| Chữ "lý do bắt buộc": ô lý do, `{Thao tác}: cần ghi lý do.`, `lý do cần ít nhất 5 ký tự` (chỉ bắt buộc khi huỷ / từ chối) | PR-MTa / PR-MTb | T7 |
| Chữ ở các cổng sửa lịch Mock Test (dời, huỷ, vắng lần 2 → `đã huỷ (vắng 2 lần)`, nút `Xin dời`, popup cảnh báo dời MT1 sau MT2) | PR-MTa / PR-MTb | T2, T3, T4, T14 |
| Ô `MT mới`, chọn tất cả / bỏ chọn tất cả ở panel Xếp lịch MT; MT0 (mọi chữ có "MT0", "Dự kiến lên FT") | PR-MTb · PR-MT0 | T5, T5b, T13, T13b |
| Lịch Test ba khối: `Nợ tuần trước`, `Nợ từ tuần`, khối hạn trong dòng lớp, `Test quá hạn chấm`, `Test chấm tuần này`, `GV chấm: Chấm chéo` | PR-LT3 | T15–T18 |
| Tên web `Pisa Tracking` → `PISA Tracking` (`index.html`, thanh trên, màn đăng nhập, câu chào) | PR-HK2 | plan.md PR-HK2 |
| Chữ J1 (hai nghĩa "Thiếu"), J2 (mã học viên `000048` / `PISA-000048`), J3 (`Cột Cần xử lý` trộn "quá hạn từ W1 SEP" / "quá hạn 7 ngày"), J4 (lời giải thích cho người làm app ở Tổng quan QL), J7 (chữ "Bạn" lặp ở Tổng quan GV), J9 (`Xác nhận PA Tutor · đến lúc thi`, nút `– sửa`, `GV chấm: Tôi ⌄`), "Khác" đứng một mình, dải "Mất kết nối" | PR-HK2 | `docs/superpowers/plans/2026-10-02-ux-sau-critique.md` |
| Màn **Điểm theo lớp** (chưa có trên `main` lúc quét, chưa liệt kê) | PR-DL | plan.md PR-DL |
| Panel / form **sửa cả lớp** (Họ tên, Ngày sinh, Email, Tuần bắt đầu, Dự kiến thi, Target, Điểm đầu vào) và câu "Đã đọc theo thứ tự cột…" (chưa có trên `main` lúc quét) | PR-SL | plan.md 3 (03/10, 04/10), PR-SL |

## 3. Mã lý do

Máy gắn cờ, người đọc quyết: mỗi mục trong file này đã được đọc tay, mã là lý do chính.

| Mã | Nghĩa | Ví dụ |
|---|---|---|
| L1 | Dài: nhãn > 3 từ; tiêu đề cột > 5 từ; câu > 15 từ; lỗi/toast > 20 từ | |
| L2 | Giọng nhắc: "Hãy", "Vui lòng", "Xin", "Lưu ý:", "Chú ý:", "Bạn có chắc" | |
| L3 | Câu giải thích dưới nút / ô nhập | |
| L4 | Hán Việt, giọng công văn: thực hiện, tiến hành, khởi tạo, thao tác, dữ liệu, đối tượng, hợp lệ, tồn tại, xác thực, truy cập, tương ứng, hiện hành, nhằm, tại thời điểm, liên quan, đính kèm, phạm vi, ghi nhận. "Hệ thống" làm chủ ngữ (`Hệ thống đóng`) đã chốt, không tính | |
| L5 | Dịch máy: bị động "được/đã được", "của bạn", "bởi", "trong trường hợp", "với tư cách", "thành công" cuối câu, "Không thể …" | |
| L6 | Hai chữ cho một khái niệm (xem mục 4) | |
| L7 | Chữ hệ thống lọt: snake_case, camelCase, `undefined`, `null`, `NaN`, `[object`, mã enum tiếng Anh, mã HTTP / tên bảng trong câu lỗi | |
| L8 | Trái thuật ngữ đã chốt (cột "Không dùng" của mục 1) | |
| L9 | Trùng nghĩa, thừa trong một câu: từ lặp, "đang … hiện tại", hai câu cùng ý nối bằng " — " | |
| L10 | Mơ hồ, đại từ trôi: "em này", "lượt đó", "máy", "đường này", "chốt chung", "Khác" đứng một mình | |

## 4. Cụm khái niệm nhiều tên

(Chỉ cụm có ≥ 2 biến thể đang hiện trên màn; số "trên màn" = số dòng chữ khác nhau thấy khi bấm thử, số "trong mã" = số chuỗi quét được.)

| Cụm | Đã chốt chưa | Biến thể · số chỗ | Ví dụ `file:dòng` | Đề xuất |
|---|---|---|---|---|
| Lượt / đợt (một lần thi gồm nhiều kỹ năng) | Chốt chung: chưa chốt | lượt: 162 chỗ trong mã, có trên màn<br>đợt: 121 chỗ trong mã, có trên màn | lượt: `server/src/classes/xoaKetThucLop.ts:22` · `server/src/duyet/loaiYeuCau.ts:252` · `server/src/fasttrack/absence.ts:66`<br>đợt: `server/src/classes/intake.ts:629` · `server/src/classes/thongTinLop.ts:42` · `server/src/fasttrack/absence.ts:203` | |
| Test / bài kiểm tra / lịch kiểm tra | Chốt: `Test`, `Lịch Test`, `Bài kiểm tra` (bỏ "Lịch kiểm tra", "Bài đánh giá") | Test: 153 chỗ trong mã, có trên màn<br>Bài kiểm tra: 17 chỗ trong mã, có trên màn<br>Bài đánh giá: 2 chỗ trong mã, chưa thấy trên màn<br>Lịch kiểm tra: 0 chỗ trong mã, chưa thấy trên màn | Test: `server/src/cases/cases.ts:2901` · `server/src/cases/sos.ts:511` · `server/src/cases/sos.ts:523`<br>Bài kiểm tra: `server/src/fasttrack/cycles.ts:390` · `server/src/normal/regular.ts:707` · `server/src/worklist/mywork.ts:342`<br>Bài đánh giá: `server/src/fasttrack/cycles.ts:393` · `web/src/modules/cases/QuickReport.tsx:338` | |
| Case / case | Chốt: `Case` viết hoa | Case: 341 chỗ trong mã, có trên màn<br>case (thường): 2 chỗ trong mã, có trên màn | Case: `server/src/cases/boTro.ts:143` · `server/src/cases/cases.ts:157` · `server/src/cases/cases.ts:164`<br>case (thường): `server/src/cases/cases.ts:551` · `web/src/modules/phanTich/TongHopVanDeHv.tsx:110` | |
| Hạn chấm / hạn nhập | Chốt: `Hạn chấm` | Hạn chấm: 22 chỗ trong mã, có trên màn<br>Hạn nhập: 5 chỗ trong mã, có trên màn | Hạn chấm: `server/src/fasttrack/attempts.ts:1201` · `server/src/fasttrack/skillSchedule.ts:963` · `server/src/fasttrack/skillSchedule.ts:965`<br>Hạn nhập: `server/src/giaoVien/hoSo.ts:289` · `server/src/worklist/mywork.ts:876` · `shared/domain/metrics.ts:77` | |
| Nhập điểm / chấm / ghi điểm | Chốt: `Nhập điểm` | Nhập điểm: 63 chỗ trong mã, có trên màn<br>Chấm: 114 chỗ trong mã, có trên màn<br>Ghi điểm: 4 chỗ trong mã, có trên màn | Nhập điểm: `server/src/fasttrack/attempts.ts:1429` · `server/src/fasttrack/attempts.ts:1481` · `server/src/fasttrack/attempts.ts:1486`<br>Chấm: `server/src/fasttrack/attempts.ts:1201` · `server/src/fasttrack/attempts.ts:1328` · `server/src/fasttrack/attempts.ts:1332`<br>Ghi điểm: `shared/domain/nhatKy.ts:25` · `web/src/modules/students/StudentDetailPage.tsx:346` · `web/src/modules/students/StudentPlanPanel.tsx:256` | |
| Kỹ năng / môn | Chưa chốt (lớp thường gọi "Môn") | Kỹ năng: 222 chỗ trong mã, có trên màn<br>Môn: 173 chỗ trong mã, có trên màn | Kỹ năng: `server/src/cases/boTro.ts:124` · `server/src/cases/cases.ts:187` · `server/src/cases/cases.ts:483`<br>Môn: `server/src/cases/boTro.ts:148` · `server/src/cases/cases.ts:157` · `server/src/cases/cases.ts:1272` | |
| Học viên / HV / em / Học sinh | Chốt: `HV` ngắn, `Học viên` đầy đủ; bỏ "Học sinh", "HS" | Học viên: 365 chỗ trong mã, có trên màn<br>HV: 46 chỗ trong mã, có trên màn<br>em: 217 chỗ trong mã, có trên màn<br>Học sinh / HS: 0 chỗ trong mã, chưa thấy trên màn | Học viên: `server/src/cases/cases.ts:302` · `server/src/cases/cases.ts:424` · `server/src/cases/cases.ts:437`<br>HV: `server/src/cases/sos.ts:45` · `server/src/cases/sos.ts:75` · `server/src/cases/sos.ts:76`<br>em: `server/src/cases/boTro.ts:124` · `server/src/cases/cases.ts:454` · `server/src/cases/cases.ts:776` | |
| Mock Test / MT / Mock | Giữ tiếng Anh: `Mock Test`, `MT` | Mock Test: 36 chỗ trong mã, có trên màn<br>MT: 174 chỗ trong mã, có trên màn<br>mock (thường): 3 chỗ trong mã, có trên màn | Mock Test: `server/src/cases/sos.ts:511` · `server/src/cases/sos.ts:523` · `server/src/fasttrack/attempts.ts:868`<br>MT: `server/src/cases/sos.ts:546` · `server/src/cases/sosAuto.ts:153` · `server/src/classes/intake.ts:292`<br>mock (thường): `server/src/cases/sos.ts:57` · `server/src/cases/sos.ts:60` · `shared/domain/people.ts:150` | |
| Quá hạn | Chốt: `Quá hạn` · `Quá hạn · {n} ngày` | Quá hạn: 29 chỗ trong mã, có trên màn<br>quá hạn (thường): 105 chỗ trong mã, có trên màn<br>Trễ / trễ: 10 chỗ trong mã, có trên màn | Quá hạn: `server/src/duyet/yeuCau.ts:247` · `server/src/worklist/mywork.ts:212` · `server/src/worklist/mywork.ts:224`<br>quá hạn (thường): `server/src/classes/banGiao.ts:266` · `server/src/duyet/loaiYeuCau.ts:44` · `server/src/duyet/loaiYeuCau.ts:298`<br>Trễ / trễ: `web/src/modules/cases/CasePanel.tsx:392` · `web/src/modules/phanTich/PhanTichGiaoVien.tsx:25` · `web/src/modules/phanTich/PhanTichGiaoVien.tsx:26` | |
| Xong / hoàn thành / hoàn tất | Chốt: `Xong` | Xong: 9 chỗ trong mã, có trên màn<br>Đã xong: 1 chỗ trong mã, có trên màn<br>Hoàn thành: 44 chỗ trong mã, có trên màn<br>Hoàn tất: 15 chỗ trong mã, có trên màn | Xong: `shared/domain/phanTich.ts:234` · `web/src/modules/cases/QuickReport.tsx:486` · `web/src/modules/cham/GvCham.tsx:85`<br>Đã xong: `web/src/modules/cases/QuickReport.tsx:326`<br>Hoàn thành: `server/src/cases/cases.ts:157` · `server/src/cases/cases.ts:173` · `server/src/cases/cases.ts:176`<br>Hoàn tất: `server/src/fasttrack/attempts.ts:1454` · `server/src/fasttrack/skillSchedule.ts:864` · `server/src/normal/regular.ts:496` | |
| Chờ duyệt | Chốt: `Chờ duyệt` | Chờ duyệt: 24 chỗ trong mã, có trên màn<br>Chờ QL duyệt: 7 chỗ trong mã, có trên màn<br>Chờ Quản lý duyệt: 13 chỗ trong mã, có trên màn<br>Đang chờ: 2 chỗ trong mã, chưa thấy trên màn | Chờ duyệt: `server/src/cases/cases.ts:758` · `server/src/duyet/yeuCau.ts:110` · `server/src/duyet/yeuCau.ts:326`<br>Chờ QL duyệt: `shared/domain/chuyenLop.ts:26` · `shared/domain/metrics.ts:161` · `shared/domain/yThuc.ts:137`<br>Chờ Quản lý duyệt: `server/src/students/viecHocVien.ts:75` · `server/src/worklist/metrics.ts:203` · `shared/domain/hocVienLop.ts:395`<br>Đang chờ: `shared/domain/metrics.ts:168` · `web/src/modules/cases/CasePanel.tsx:295` | |
| Đã lên lịch / đã xếp | Chốt: `Đã lên lịch` | Đã lên lịch: 3 chỗ trong mã, có trên màn<br>Đã xếp: 2 chỗ trong mã, chưa thấy trên màn<br>Xếp lịch: 12 chỗ trong mã, có trên màn | Đã lên lịch: `shared/domain/fasttrack.ts:132` · `web/src/modules/fasttrack/HopThaoTacMt.tsx:94` · `web/src/modules/students/StudentPlanPanel.tsx:90`<br>Đã xếp: `web/src/modules/test/keHoach/NganXepHangLoat.tsx:172` · `web/src/modules/test/keHoach/NganXepLichMt.tsx:196`<br>Xếp lịch: `server/src/worklist/mywork.ts:955` · `server/src/worklist/mywork.ts:956` · `shared/domain/nhatKy.ts:30` | |
| Từ chối / không duyệt | Chốt: `Bị từ chối` | Bị từ chối: 16 chỗ trong mã, có trên màn<br>Từ chối: 48 chỗ trong mã, có trên màn<br>Không duyệt: 2 chỗ trong mã, chưa thấy trên màn | Bị từ chối: `server/src/cases/boTro.ts:265` · `server/src/cases/cases.ts:758` · `server/src/cases/cases.ts:986`<br>Từ chối: `server/src/cases/boTro.ts:265` · `server/src/cases/cases.ts:758` · `server/src/cases/cases.ts:948`<br>Không duyệt: `server/src/duyet/yeuCau.ts:467` · `web/src/modules/platform/AccountsAdmin.tsx:310` | |
| Tạm dừng / tạm ngưng | Chốt: `Tạm dừng học` (em) | Tạm dừng: 25 chỗ trong mã, có trên màn<br>Tạm ngưng: 5 chỗ trong mã, có trên màn | Tạm dừng: `server/src/classes/luatLoTrinh.ts:593` · `server/src/students/students.ts:306` · `shared/domain/hanhTrinh.ts:607`<br>Tạm ngưng: `server/src/worklist/mgmttasks.ts:553` · `server/src/worklist/mgmttasks.ts:559` · `shared/domain/worklist.ts:64` | |
| Phạm vi (xem được) | Chưa chốt | phạm vi: 111 chỗ trong mã, có trên màn<br>Tất cả / toàn hệ thống: 19 chỗ trong mã, có trên màn | phạm vi: `server/src/cases/cases.ts:437` · `server/src/cases/cases.ts:1084` · `server/src/cases/cases.ts:1377`<br>Tất cả / toàn hệ thống: `server/src/platform/accounts.ts:320` · `server/src/platform/accounts.ts:343` · `server/src/platform/accounts.ts:492` | |
| Bạn / Tôi | Chốt 01/10 (F-017): `Tôi` ở nhãn. Câu báo lỗi dạng "Bạn không có quyền …": chưa chốt — khoảng 90 câu như vậy ở máy chủ, đã KHÔNG liệt kê riêng ở mục 6, xử lý một lần theo cụm này | Bạn / bạn: 192 chỗ trong mã, có trên màn<br>Tôi / tôi: 30 chỗ trong mã, có trên màn | Bạn / bạn: `server/src/cases/cases.ts:261` · `server/src/cases/cases.ts:437` · `server/src/cases/cases.ts:672`<br>Tôi / tôi: `shared/domain/dieuHuong.ts:108` · `shared/domain/duongHoSo.ts:142` · `shared/domain/hocVienLop.ts:84` | |
| Hệ thống / Web / Máy | Chốt: `Hệ thống` | Hệ thống: 133 chỗ trong mã, có trên màn<br>Web / web: 15 chỗ trong mã, có trên màn<br>Máy: 9 chỗ trong mã, có trên màn | Hệ thống: `server/src/app.ts:149` · `server/src/cases/sos.ts:52` · `server/src/cases/systemClose.ts:96`<br>Web / web: `server/src/classes/intake.ts:149` · `server/src/worklist/mywork.ts:168` · `server/src/worklist/mywork.ts:1053`<br>Máy: `server/src/classes/thongTinLop.ts:77` · `server/src/db.ts:183` · `server/src/fasttrack/absence.ts:741` | |
| Dữ liệu / số liệu / điểm | Chưa chốt | dữ liệu: 59 chỗ trong mã, có trên màn<br>số liệu: 7 chỗ trong mã, có trên màn | dữ liệu: `server/src/app.ts:133` · `server/src/app.ts:137` · `server/src/app.ts:143`<br>số liệu: `shared/domain/display.ts:98` · `shared/domain/display.ts:172` · `web/src/modules/phanTich/HieuQuaPa.tsx:193` | |
| Thành công / tiến bộ (kết quả PA) | Chốt: `Tiến bộ`, `Không tiến bộ`, `Kém hơn` | Thành công: 10 chỗ trong mã, chưa thấy trên màn<br>Tiến bộ: 19 chỗ trong mã, có trên màn<br>Không đổi / Giữ nguyên: 17 chỗ trong mã, có trên màn | Thành công: `server/src/cases/cases.ts:161` · `server/src/cases/cases.ts:1119` · `server/src/classes/phanTichLop.ts:162`<br>Tiến bộ: `server/src/normal/cuoiKhoa.ts:423` · `shared/domain/cases.ts:291` · `shared/domain/cases.ts:292`<br>Không đổi / Giữ nguyên: `server/src/cases/cases.ts:2865` · `server/src/cases/planRevisions.ts:54` · `shared/domain/cases.ts:907` | |
| Mong đợi / kỳ vọng | Chốt: `kỳ vọng` | kỳ vọng: 107 chỗ trong mã, có trên màn<br>mong đợi: 2 chỗ trong mã, có trên màn | kỳ vọng: `server/src/cases/signals.ts:287` · `server/src/cases/sos.ts:464` · `server/src/classes/intake.ts:280`<br>mong đợi: `web/src/modules/cham/LuoiFT.tsx:143` · `web/src/modules/students/StudentDetailPage.tsx:516` | |

## 7. Cách làm

Làm ngày 05/10/2026 trên `origin/main` (commit `587bd66b`, sau PR #201). Chữ ở mục 5–6 là chữ **hiện có trên `main`**, chưa gồm gì PR-NV / PR-MTa / PR-DL / PR-SL sẽ đổi.

### 7.1. Đã chạy gì

1. **Quét máy** — `node scripts/quet-chu.mjs` (có trong repo, không nằm trong `npm run check`; đọc AST bằng `typescript`, bỏ `server/src/{tests,seed,migrate,ops}`, trang `/dev/thanh-phan`, thanh DemoBar). Kết quả: **8 009 bản ghi** · web 4 361 · shared 1 594 · server 2 054 · theo loại: chuỗi 4 103 · mẫu `${…}` 1 134 · chữ trong JSX 1 467 · thuộc tính (`placeholder`, `title`, `aria-label`, `hint`…) 1 305 · **5 512 chuỗi khác nhau**. Script có 6 phép tự kiểm (có `notify.title`, `toast`, `placeholder`; không lọt `tests/` `seed/`; `Chưa có PA` đúng `file:dòng`; tổng 4 000–9 000).
2. **Bộ lọc L1–L10** (script tạm, không commit): **1 057 ứng viên** (L1 565 · L2 19 · L3 7 · L4 286 · L5 26 · L7 8 · L8 191 · L9 94 · L10 13). Đã siết: tooltip (`hint`, `title`, `goiY`) chỉ gắn L1 khi > 25 từ (tooltip dài vừa phải là chỗ đúng để giải thích); L4 bỏ qua "Hệ thống" làm chủ ngữ, "Thao tác khác", "Người thực hiện", "Ghi nhận", "Quản trị hệ thống"; L8 bỏ các cụm quá chung (`đạt`, `quá hạn`, `SOS`, `phương án`, `hôm nay`, `Chấm`…) và xoá chữ đã chốt khỏi câu trước khi so (để "Gửi Quản lý duyệt" không dính "Gửi Quản lý"). `badRequest(` được tính là hàm báo lỗi như `notFound(`, `forbidden(` (kế hoạch không ghi nhưng mã dùng nhiều).
3. **Bấm thử thật** bằng Browser pane trên bản dev `PORT=4340 WEB_PORT=5340` (cổng do session planning giao), DB demo riêng trong worktree. Thu **436 trạng thái màn** (5 340 dòng chữ khác nhau) bằng đoạn JS thu mọi chữ đang hiện + `placeholder`/`title`/`aria-label`, kèm tiêu đề khu vực; có bộ dò tự bấm menu ⋮ ⋯ +, tab, chip và từng mục trong menu (mở hộp, thu, đóng). Không bấm nút xác nhận phá dữ liệu. Đã tắt máy dev, dọn tiến trình cổng 4340/5340/4341.
4. **Ghép** ứng viên với chữ trên màn: **304/1 057** thấy lúc chạy (màn, khu vực, vai lấy từ đó); **753** chỉ có trong mã → "Ai thấy" có dấu `*`, "Đang làm gì" ghi "chưa thấy tận mắt".
5. **Đọc tay từng ứng viên** → giữ **602 mục** (bỏ các báo nhầm: tên đã chốt, nhãn ngắn tự nhiên, tên riêng, chữ chỉ có ở bản demo, chữ đã giao PR khác ở mục 2). Mã lý do ghi theo lý do chính khi đọc, nên số L3 (câu giải thích dưới ô) cao hơn số máy gắn.

### 7.2. Điều đáng biết khi đề xuất chữ mới

- **Câu "Bạn …" ở máy chủ** (khoảng 90 câu như "Bạn không có quyền …", "Bạn chỉ xem được …") **không liệt kê riêng**: "Bạn" trong câu báo lỗi vốn tự nhiên; chốt 01/10 chỉ nói `Tôi` ở nhãn. Cần chủ sản phẩm quyết một lần (xem mục 4, cụm "Bạn / Tôi").
- **"không hợp lệ"** có 81 câu khác nhau, 80 câu đã liệt kê (mục 6 và các màn, mã `L4`): cùng một mẫu, nên đề xuất **một mẫu câu** (ví dụ "{Ô}: nhập sai") rồi áp cho cả nhóm.
- **Hộp "Cách tính" của số liệu** (`shared/domain/metrics.ts` `cauHoi`, `tapDuDieuKien`, `khuTrung`, hiện qua `web/src/ui/SoLieu.tsx`) giọng đặc tả, có mã nội bộ (`T53 Q2`, `F11`, `K1-26`, `sos_level`) — nhóm đáng sửa nhất, nằm ở file `a`.
- **Chữ lọt lúc chạy (L7)**: nhật ký Quản trị hiện `Case {n} · extra_homework` (`QT`); câu báo lỗi lộ tên biến (`baiId`, `hanTheoNgay`, `studentId`, `ownerId`, `SCH-01`) ở mục 6 và mục `QT`.
- Chữ mà **chính phép kiểm khớp** có ghi `(test khớp)`: sửa chữ phải sửa cả `server/src/tests`.
- Một số mục có chữ trong mã nhưng **chưa thấy tận mắt** (câu lỗi 403, trạng thái rỗng hiếm, hộp xác nhận chỉ hiện khi dữ liệu đặc biệt): ghi rõ ở cột "Đang làm gì".

### 7.3. Màn đã đi qua (CHU-3 bước 4)

| Vai | Màn | Kết quả |
|---|---|---|
| GVCN 7 | G1 Tổng quan | ✔ thu nền + bấm 24 nút; chuông thông báo mở (một danh sách, hai nhóm trong đó); menu tài khoản |
| | G2 Học viên & Lớp | ✔ nền; dò 30/42 nút (chip lọc bấm được một phần: trang vẽ lại sau mỗi lần lọc); chưa dựng trạng thái rỗng "lọc không ra" |
| | G3 Lưu trữ | ✔ |
| | G4 Hồ sơ lớp | ✔ lớp 3, 5, 6, 7, 17, 18, 19, 22 (3 tab); menu ⋮, ⋯ dòng, "+ Case", "+ Học viên" ở lớp 3 và 22; menu "+n": ✗ (không có ở dữ liệu demo) |
| | G5 Hồ sơ HV | ✔ HV 48, 50, 10, 42, 76, 84, 85, 104 (3 tab, ⋮, "+ Case"; bảng Mock Test) |
| | G6 Ngăn Case | ◐ view `ke-hoach` (Nộp kế hoạch bổ trợ) và panel "+ Case"; view `ghi-ket-qua` mở nhưng chỉ thu được phần khung; **chưa thu**: `hoan-thanh`, `tra-loi`, `them-pa` đủ trường |
| | G7 + Case | ✔ (tab "Đang gặp vấn đề" / "Đã xong từ trước", "Tạo Case") |
| | G8 Lịch Test | ✔ dải số, "Nợ tuần trước", mở lớp (22/29 nút); đang là bản **trước** PR-LT3 |
| | G9 Nhập điểm | ✔ lưới FT, RF, bảng điểm lớp thường (FOU, Pre FOU, BE); gõ `99`, `abc`, `-`, `25`: **không thấy câu lỗi hay toast trên màn** nên chưa có chữ lỗi nhập điểm từ màn thật (chỉ có từ mã) |
| | G10 Hồ sơ Mock | ✔ lượt 133, 134: menu ⋯ (GVCN: `Báo vắng`, `Huỷ điểm`; QL thêm `Dời hạn chấm`, `Dời lịch thi`), `Sửa điểm`; **chưa thu** `Bỏ kỹ năng`, `Huỷ cả lượt` (không có trong dữ liệu) |
| | G11 Ý thức | ✔ tab Ý thức & Phối hợp (lớp và HV), panel "+ Ghi vi phạm"; toast Hoàn tác **chưa thu** (cần ghi vi phạm thật) |
| | G12 Công việc | ✔ hai tab (Hỗ trợ học viên, Yêu cầu của tôi) |
| | G13 Chuyển lớp / Đề xuất | ✔ "Đề xuất chuyển lớp" (HV 104, lớp 22) |
| | G14 Lộ trình tiếp theo | ✔ một em (HV 104/50) và cả lớp (lớp 22 ⋮ "Ghi lộ trình tiếp theo cả lớp") |
| | G15 Bàn giao | ◐ `?viec=ban-giao` mở nền; phiếu đầy đủ chưa dò từng nút |
| | G16 Kết luận khoá | ✔ menu ⋮ "Kết luận lộ trình" |
| | G17 Thêm học viên | ✔ panel "+ Học viên" (lưới, "Đọc nội dung đã dán", "Thêm học viên" lúc trống) |
| | G18/G19 Hồ sơ GV / cá nhân | ✔ |
| | Điểm theo lớp (PR-DL) | ✗ chưa có trên `main` |
| GVBM 9 | G1, G8, G9 (Speaking), G12 | ✔; `/giao-vien/7` → câu chặn ✔; Kế hoạch Test qua URL → chuyển về Lịch Test ✔ |
| QL 2 (+3) | Q1 Việc hôm nay | ✔ (QL 3 cho Tổng quan nhiều trạng thái quá hạn) |
| | Q2 Phân tích | ✔ 5 góc nhìn × khung Fast Track và Lớp thường |
| | Q4 Tạo lớp | ✔ panel "+ Lớp mới" (Một lớp / Nhiều lớp, Fast Track / Lớp thường, LT1/LT2/RF) |
| | Q5–Q7 | ✔ Học viên & Lớp, hồ sơ lớp ⋮ (Chuyển tiếp lớp…, Sửa thông tin lớp, Xuất Excel, Lịch Test của lớp), HV ⋮ |
| | Q8 Kế hoạch Test | ◐ nền; panel "Xếp lịch MT…" 7/7 nút; hộp kỹ năng neo cạnh chip và popup cảnh báo **chưa mở được** (phải bấm tay đúng ô) |
| | Q9 Chờ duyệt | ✔ nền; mở `Từ chối` và `Duyệt`, đóng không xác nhận |
| | Q10–Q12 Công việc | ✔ Vận hành + "+ Giao việc", Báo cáo đơn vị (nền), Hỗ trợ học viên |
| | Q13 Hồ sơ GV người khác | ✔ |
| | Xuất Excel MT | ◐ mở được panel từ ⋮ lớp; nội dung tệp Excel chỉ lấy chữ từ mã (`shared/domain/xuatMt.ts`) |
| Quản trị 1 | A1 Quản trị | ✔ 3 tab, dò 9 nút mỗi tab |
| | A2 hộp Kết thúc lớp / Xoá HV | ✔ mở hộp, không xác nhận. **Xoá lớp**: không có ở lớp có dữ liệu (chỉ lớp trống) → ✗ |
| | A3 Đăng nhập / đăng xuất | ✔ ba tab (Đăng nhập, Giáo viên đăng ký, Vào nhanh); gửi trống và sai mật khẩu: **không thấy câu lỗi mới** trên màn |
| Điện thoại 375 | G1, G2, G5, G8, G9, Q1 (+ Q8, Q9) | ✔ nền; menu ⋯ và "+n" ở G2; thẻ `TheDong` có trong nền G2/G5 |

### 7.4. Khác với kế hoạch

- Script quét **nằm trong repo** `scripts/quet-chu.mjs` (chủ sản phẩm 05/10, Q1). Bộ lọc, bộ ghép, bộ thu chữ trên màn **không commit** (scratchpad).
- Cổng `4340/5340` thay `4631/5631` (session planning giao vì ba session khác đang chạy).
- File **chia thành 5** (file chính + 4 file con) vì 602 mục > 450.
- Chủ sản phẩm chọn Q2: file chỉ liệt kê chữ chối + mục 4; không có phụ lục mọi nhãn.
