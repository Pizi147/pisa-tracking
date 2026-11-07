# CHU-GIAI — chú giải vào ⓘ · trả lại lưu ý cần thiết (chủ SP 07/11)

## (a) Chú giải ký hiệu → ⓘ (dùng `NutLuat` sẵn có)
| Nơi | Trước | Sau |
|---|---|---|
| `students/HanhTrinh.tsx` — thẻ Hành trình | dòng chú giải chân thẻ (375: nút "Ký hiệu" mở chữ) | ⓘ "Ký hiệu" cạnh tiêu đề, chỉ khi xem trục (Danh sách 375 không cần). Thẻ bỏ `overflow-hidden` (hộp ⓘ bị cắt ở 375), bo góc dưới chuyển cho vùng cuộn |
| `students/HanhTrinhKyNang.tsx` + `BieuDoD.tsx` — Hành trình · kỹ năng | dòng chú giải dưới biểu đồ | gộp vào ⓘ "Cách đọc hành trình" sẵn có (chỉ khi xem Biểu đồ, chỉ mục có trên chart) |
| `cham/LuoiFT.tsx` — lưới FT | dòng "- vắng · Không học · — chưa có điểm" ở hàng công cụ | ⓘ "Ký hiệu" cùng chỗ (chỉ khi lưới có ô Không học) |
| `giaoVien/HoSoGiaoVienPage.tsx` — Theo kỹ năng | "▼ Fail ▲ Pass ★ Exceed" cạnh tiêu đề bảng | ⓘ "Ký hiệu" cùng chỗ |

## (b) Rà bảng BỎ của #1186
Luật: TRẢ = báo hậu quả thao tác, bước kế / ai trả lời + hạn, ràng buộc chọn, điều dễ làm sai, đổi hạn. GIỮ BỎ = giải thích chung, lặp nhãn / số trên màn, hướng dẫn hiển nhiên.

| Nơi | Câu | Làm | Lý do |
|---|---|---|---|
| `cases/CapNhatTuan.tsx` (Cần QL giúp) | Gửi Quản lý · trả lời trong 5 ngày · xem ở Yêu cầu của tôi | TRẢ | ai trả lời + hạn + xem ở đâu |
| `cases/CapNhatTuan.tsx` (đổi PA) | PA hiện tại chạy tới khi Quản lý duyệt | TRẢ | hậu quả: PA cũ chưa dừng |
| `cases/CapNhatTuan.tsx` | PA chưa có Số buổi — thêm ở thẻ PA… | GIỮ BỎ | tuỳ chọn, không đổi đầu ra |
| `yThuc/CaseSosControls.tsx` (đổi PA gốc) | Nếu gửi: {goc} chờ, chưa chạy · Case "Chờ duyệt đổi PA" | TRẢ | hậu quả của Gửi |
| `yThuc/CaseSosControls.tsx` (Không theo dõi) | Gửi Quản lý duyệt · trả lời trong 5 ngày · xem ở Yêu cầu của tôi | TRẢ | ai trả lời + hạn |
| `cases/ThaoTacCase.tsx` (Thêm PA khi có PA quy chế) | PA theo quy chế vẫn chạy — PA này là hỗ trợ thêm. | TRẢ | dễ hiểu nhầm là thay PA quy chế |
| `cases/ChiTietKyNang.tsx` | Chỉ điền phần bạn thật sự đánh giá… không ghi đè điểm Test… không đổi SOS | TRẢ, viết ngắn: "Để trống phần không đánh giá · không đổi điểm Test, mức SOS" | điều dễ làm sai / hậu quả |
| `classes/BanGiaoGvPanel.tsx` | Quản lý điền thay — góp ý ghi là điền thay. | TRẢ | hậu quả: ghi danh "điền thay" |
| `classes/BanGiaoPanel.tsx` | Môn còn trống sẽ ghi “GVBM chưa bàn giao”. | TRẢ | hậu quả của Xác nhận |
| `classes/ClassIssueBoard.tsx` | Một Case chỉ đếm một lần… | GIỮ BỎ | giải thích chung |
| `classes/ClassProgressPanel.tsx` (FT) | Tuần khai giảng là tuần bắt đầu mặc định… Đổi tuần khai giảng không dời lịch MT của em đã có. | TRẢ phần cuối: "Đổi tuần khai giảng không dời lịch MT của em đã có." | hậu quả của Lưu; phần đầu lặp gợi ý ô |
| `classes/LuoiTaoLop.tsx` | Tối đa {n} lớp một lần. Tạo tất cả hoặc không… | TRẢ | ràng buộc + hậu quả một dòng lỗi |
| `duyet/TheYeuCau.tsx` | Mặc định là tuần GV đề nghị. Tuần đã bắt đầu thì không chọn được. | TRẢ | ràng buộc chọn |
| `fasttrack/LuotThuongPage.tsx` | Điểm trước khi huỷ xem ở Lịch sử. | GIỮ BỎ | lặp link Lịch sử cạnh đó |
| `platform/AccountsAdmin.tsx` | …Giáo viên tự đăng ký… sẽ hiện ở đây · Một người mang được nhiều vai… | GIỮ BỎ | giải thích chung |
| `platform/AdminPage.tsx` | Tutor part-time là đơn vị báo cáo riêng… | GIỮ BỎ | giải thích chung (Tutor hoãn) |
| `platform/BangQuyDoiAdmin.tsx` | Dán một cột từ Excel… — = IDP không công bố | GIỮ BỎ | hướng dẫn cách dùng |
| `platform/MoSuaLichTest.tsx` | Mở: GVCN (lớp mình), Admin, Quản lý sửa được lịch Test kể cả Thứ Sáu – CN. | TRẢ | hậu quả của Bật (ai sửa được) |
| `platform/ProfilePage.tsx` | Vai trò và chi nhánh do Quản trị cấp… | GIỮ BỎ | giải thích chung |
| `students/ChuongLop.tsx` | Hệ thống tự viết dòng này khi… | GIỮ BỎ | giải thích chung |
| `students/ChuyenLopPanel.tsx` (ô luồng) | Có Test đi kèm (Lên FT có MT0 tuần Final). Bỏ chọn: chuyển ngay, không Test đi kèm. | TRẢ | hậu quả của chọn / bỏ chọn |
| `students/ChuyenLopPanel.tsx` (khác chi nhánh) | Quản lý chi nhánh và GVCN lớp mới sẽ nhận thông báo “Sắp nhận”. | TRẢ | ai cần biết |
| `students/ChuyenLopPanel.tsx` (đề xuất) | Gửi thành thẻ trong Chờ duyệt của Quản lý (… hạn 5 ngày)… | TRẢ, viết ngắn: "Gửi Quản lý duyệt · trả lời trong 5 ngày · xem ở Yêu cầu của tôi" | ai trả lời + hạn (cùng chữ với Case) |
| `students/DauHoSo.tsx` | Quay lại học thì hạn tính lại từ ngày quay lại | TRẢ | thay đổi hạn |
| `students/IntakePanel.tsx` | Chọn lớp, dán từ Excel hoặc gõ vào lưới | GIỮ BỎ | hướng dẫn hiển nhiên |
| `students/QuayLaiHoc.tsx` | Gợi ý: lớp đang chạy cùng chương trình… | GIỮ BỎ | giải thích chung |
| `students/StudentDetailPage.tsx` | Lộ trình RF — kỳ vọng mọi MT bằng Target. | GIỮ BỎ | cột Kỳ vọng đã hiện số |
| `students/StudentPlanPanel.tsx` | Hệ thống chỉ đề xuất ba lượt đầu… | GIỮ BỎ | giải thích chung |
| `test/keHoach/NganXuatDiem.tsx` | “Chỉ điểm” bỏ 2 cột nhận xét. | GIỮ BỎ | Xem trước cột đã hiện |
| `worklist/MgmtTasksPage.tsx` | Nhìn thấy công việc nhưng KHÔNG sửa được. (×2) | GIỮ BỎ | giải thích nhãn |
| `worklist/MgmtTasksPage.tsx` | Mặc định là hạn của việc cha trừ một ngày… | GIỮ BỎ | giá trị đã điền sẵn trong ô |
| `worklist/MgmtTasksPage.tsx` (Giao GV) | Việc này hiện trong hồ sơ của n em… em chưa có Case thì hệ thống mở Case mới… | TRẢ, viết ngắn: "Hiện ở hồ sơ {n} em lớp {lop} · em chưa có Case kỹ năng này được mở Case mới" | hậu quả lớn: mở Case hàng loạt |
| `worklist/SignalList.tsx` | Những việc này tự hết khi… | GIỮ BỎ | giải thích chung |

Tổng: TRẢ 17 câu (4 viết ngắn lại), GIỮ BỎ 16. Chuỗi en khôi phục / thêm tương ứng; phép kiểm prSos, prHvl về lại như trước #1186.

## Ảnh
`truoc-*` | `sau-*`: Hành trình 1440 tối, Hành trình · kỹ năng 1440 tối, Tạo nhiều lớp 1440 tối, thẻ duyệt "Tuần Test mới" 1440 tối, Hành trình + Hành trình · kỹ năng 375 sáng.
Lưới FT và hồ sơ GV: seed không có ô "Không học" / thi thật theo kỹ năng → chưa chụp; đổi cùng mẫu ⓘ.
