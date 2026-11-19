# 01 — Đề bài: Tutor để làm gì, ai được gì (19/11/2026)

Session PTA Tutor (Fable 5.2 · high).

> **CẬP NHẬT 19/11 chiều — chủ SP đã trả lời (nguyên văn `plan.md` mục 4):** KHÔNG theo cách B dưới đây. Chọn gần cách A, làm gọn: không phân công người dạy · không tính vắng (số buổi "a / b") · một dòng gộp cho cả kỳ · 3 nút Có / Không tuỳ chọn · lưu nháp trong kỳ + khối "PA đang chạy" · ô Tutor gồm GV. Mục đích chủ SP nêu: Tutor để **làm rõ kết quả và đánh giá được tutor, không sinh thêm việc**.
> Bản đang có hiệu lực: `02-luat.md` + `03-workflow.md` (bản 2). Mục 3, 4 dưới đây (bảng vai, ba cách) giữ làm lịch sử cân nhắc; mục 2 (đầu ra, số liệu) vẫn đúng.

Trạng thái bản 1: **ĐỀ XUẤT — chờ chủ SP trả lời `04-cau-hoi.md`**. Chưa có gì ở đây là đã duyệt, trừ dòng ghi "đã chốt".
Lời chủ SP 19/11: "design lại UI/UX, luật, workflow của tutor và các vai trò liên quan" (plan.md mục 4).

## 1. Một câu

**Em nào cần tutor thì có người dạy, có buổi, mỗi buổi có nhận xét — và ai cần biết đều thấy ở đúng chỗ mình đang làm việc.**
Đánh giá người dạy, đếm buổi, danh sách tutor là phần phụ: lấy từ dữ liệu buổi đã ghi, không bắt ai nhập thêm.

## 2. Đầu ra (luật cứng 08/10 — nghĩ đầu ra trước)

| # | Đầu ra | Của ai | Hôm nay (bản chép bản chính 12/11) |
|---|---|---|---|
| Đ1 | Em có PA Tutor thì **có người dạy** | em | 294 PA đang chạy: 229 ghi "người dạy" là GV — nhưng đó là GV bộ môn máy điền sẵn, không nói ai dạy thật; 4 gõ tên; **61 trống** |
| Đ2 | Em **có buổi** đúng nhịp (không bị quên) | em | 294 PA đang chạy, mới **73** PA có lần ghi kết quả; 122 lần ghi, trong đó 46 lần ghi "0 buổi"; tổng **59 buổi** |
| Đ3 | Mỗi buổi có **nhận xét về em** để GV phụ trách đọc | GV phụ trách kỹ năng | có ở 59 buổi (dài TB đủ dùng) — nhưng do GV phụ trách tự gõ lại, không phải người dạy ghi |
| Đ4 | Thấy **tiến bộ** sau tutor (điểm MT kế, Tiến triển) | em · GV · Head | có sẵn (Ghi kết quả PA 2 tuần / lần, Hiệu quả PA) — giữ |
| Đ5 | Biết **người dạy nào có vấn đề** | Head tutor | danh sách tutor **0 dòng**, 0 tài khoản Head tutor, 26 tên gõ tay, đánh giá sao dùng **1 / 59** buổi |
| Đ6 | Biết **mỗi người dạy bao nhiêu buổi** (Rulebook §20.6: buổi tutor "có lương") | Admin · Head | chưa có (chủ SP 19/10 chưa chọn) — hỏi lại, câu 10 |

Việc KHÔNG phải đầu ra → không thêm bước / trạng thái / chặn: phòng học, giờ bắt đầu – kết thúc, giáo án buổi, duyệt lịch, duyệt phân công, điểm danh có lý do, chấm công.

## 3. Ai cần biết gì (vừa đủ, đúng vai)

| Vai | Cần biết | Cần làm | Không cần |
|---|---|---|---|
| **GV dạy tutor** (GV có tài khoản được giao dạy tutor — có thể không dạy lớp của em, có thể khác chi nhánh) | em nào mình dạy · kỹ năng · em yếu gì (mô tả Case, điểm kỹ năng, nhận xét buổi trước) | ghi buổi ngay sau khi dạy (em có mặt / vắng + nhận xét) | cả hồ sơ em, Case kỹ năng khác |
| **Tutor ngoài** (part-time, không đăng nhập) | — | — (người khác ghi hộ) | tài khoản |
| **GV bộ môn** (phụ trách Case kỹ năng đó) | em đã học mấy buổi, ai dạy, nhận xét từng buổi | chốt Tiến triển 2 tuần / lần (như nay); ghi buổi khi chính mình dạy hoặc ghi hộ tutor ngoài | gõ lại từng buổi người khác đã ghi |
| **GVCN** | em lớp mình có đang tutor, buổi gần nhất, có vắng không | — | việc mới |
| **Head tutor** (là GV là chính — N43) | toàn hệ thống: em chưa có người dạy · em lâu không có buổi · người dạy bị báo vấn đề | giao người dạy · quản danh sách tutor · ghi nhận xét về người dạy | hồ sơ học thuật ngoài phần tutor |
| **Head** (chi nhánh) | như Head tutor, trong chi nhánh mình | giao người dạy, ghi buổi hộ (làm là làm, không nút "làm thay") | — |
| **TVV** | em mình tư vấn có tutor, mấy buổi, nhận xét gần nhất (để nói với PH) | — | việc mới |
| **CX** | xem mọi thứ trong phạm vi (N52) | — (không việc, không hạn) | sửa học thuật |
| **Admin** (văn phòng) | số buổi theo người dạy × tháng (nếu chủ SP chọn câu 10) | xuất file | — |
| **Quản trị** | mọi thứ | như Head + Head tutor, toàn hệ thống; cấp vai | — |

## 4. Ba cách làm đã cân nhắc

| | A. Vá bản 20/10 | **B. Buổi là trung tâm (khuyến nghị)** | C. Lịch tutor đầy đủ |
|---|---|---|---|
| Ý chính | Giữ: GV phụ trách gõ từng buổi trong Ghi kết quả PA 2 tuần / lần; trang Tutor chỉ là danh bạ + chất lượng tutor của Head tutor | **Buổi tutor là một bản ghi riêng**: ngày · người dạy · kỹ năng · 1..n em; người dạy ghi ngay; Ghi kết quả PA tự đếm buổi; trang Tutor theo dõi em → buổi → người dạy | Thời khoá biểu tutor: ca, phòng, trùng lịch, điểm danh, lương |
| Người dạy tự ghi | không | **có** (GV có tài khoản) | có |
| Nhiều em một buổi | gõ lại ở từng PA của từng em | **một lần ghi cho cả nhóm** | có |
| Đổi lịch · GV nghỉ · em vắng | không biểu diễn được | sửa ngày / đổi người dạy / tick Vắng trên chính buổi | có, nhiều màn |
| Em bị quên | chỉ lộ khi GV ghi "0 buổi" | **danh sách "chưa có người dạy" / "lâu chưa có buổi"** tính từ buổi | có |
| Nhập liệu thêm | như nay (đang không ai nhập đủ) | **ít hơn nay** (bỏ gõ lại, bỏ 3 ô bắt buộc) | nhiều hơn |
| Dòng đọc Turso | thấp | thấp – vừa (đọc theo chi nhánh, 2 bảng nhỏ) | cao |
| Hợp luật "đơn giản, đầu ra trước" | có, nhưng không giải được Đ1, Đ2 | **có** | không |

Chọn **B**: A đã chạy 4 tuần trên bản chính và số liệu cho thấy không ai dùng được (mục 2); C thêm nhiều bước không đổi đầu ra.

## 5. Không làm (non-goals)

- Không tài khoản cho tutor ngoài. Không phòng, ca, giờ, trùng lịch. Không duyệt phân công, không duyệt buổi.
- Không đổi luật SOS → PA quy chế (bảng MT × SOS), hạn Xác nhận Case, nhịp Ghi kết quả PA 2 tuần, Hiệu quả PA, N46 / N51.
- Không thêm việc có hạn cho TVV, CX, GVCN.
- Không tab cấu hình Tutor trong Quản trị (chủ SP 12/11: "chưa làm tab tutor").

## 6. Thế nào là hỏng dù chạy được (anti-goals)

- GV phải ghi cùng một buổi ở hai nơi. · Em có PA Tutor mà không ai thấy em chưa có buổi. · Số buổi ở hồ sơ HV khác số ở trang Tutor (phải một nguồn, một hàm).
- Head tutor mở trang ra trống. · GV dạy tutor không xem được em mình dạy yếu gì. · Thêm chặn cứng ("chưa đủ buổi không được kết thúc PA").
