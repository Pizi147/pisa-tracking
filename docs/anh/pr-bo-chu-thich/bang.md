# BO-CHU-THICH — bảng nơi → BỎ / CHUYỂN / GIỮ (chủ SP 07/11)

Luật: bỏ mọi đoạn chú thích / lưu ý / "Cách tính" / ghi chú tĩnh. Giữ ⓘ, lỗi, lý do chặn tại nút, trạng thái lưu, câu ô rỗng, nhãn ô bắt buộc, xác nhận hậu quả lớn, dữ liệu thật.

## CHUYỂN vào ⓘ
| Nơi | Đoạn chữ | Làm |
|---|---|---|
| `ui/BangLuotPanel.tsx` (mọi panel số: Phân tích GV, Tổng quan, Thi thật, Ý thức, Hiệu quả PA…) | khối "Cách tính" cuối panel | ⓘ "Cách tính" cuối dòng tiêu đề (như `NganDanhSach`) |
| `platform/AdminPage.tsx` Quyền theo vai trò | khối ghi chú 5 đoạn dưới bảng quyền | ⓘ cạnh tiêu đề thẻ (giải thích duy nhất của bảng) |

## BỎ
| Nơi | Đoạn chữ |
|---|---|
| `cases/CapNhatTuan.tsx` | "Gửi Quản lý · trả lời trong 5 ngày · xem ở Yêu cầu của tôi" · "PA hiện tại chạy tới khi Quản lý duyệt" · "PA chưa có Số buổi — thêm ở thẻ PA…" |
| `yThuc/CaseSosControls.tsx` | "Gửi Quản lý duyệt · trả lời trong 5 ngày · xem ở Yêu cầu của tôi" · "Nếu gửi: {goc} chờ, chưa chạy · Case …" |
| `cases/ThaoTacCase.tsx` | "PA theo quy chế vẫn chạy — PA này là hỗ trợ thêm." |
| `cases/ChiTietKyNang.tsx` | ghi chú "Chỉ điền phần bạn thật sự đánh giá…" |
| `classes/BanGiaoGvPanel.tsx` | "Quản lý điền thay — góp ý ghi là điền thay." |
| `classes/BanGiaoPanel.tsx` | chân: "Môn còn trống sẽ ghi “GVBM chưa bàn giao”." |
| `classes/ClassIssueBoard.tsx` | "Một Case chỉ đếm một lần. Mọi số bấm được…" |
| `classes/ClassProgressPanel.tsx` | ghi chú "Tuần khai giảng là tuần bắt đầu mặc định…" (FT) |
| `classes/LuoiTaoLop.tsx` | "Tối đa {n} lớp một lần. Tạo tất cả hoặc không…" (lỗi vẫn báo khi gặp) |
| `duyet/TheYeuCau.tsx` | "Mặc định là tuần GV đề nghị. Tuần đã bắt đầu thì không chọn được." |
| `fasttrack/LuotThuongPage.tsx` | "Điểm trước khi huỷ xem ở Lịch sử." (giữ link Lịch sử) |
| `platform/AccountsAdmin.tsx` | "…Giáo viên tự đăng ký ở màn đăng nhập sẽ hiện ở đây." (giữ câu ô rỗng) · ghi chú "Một người mang được nhiều vai…" |
| `platform/AdminPage.tsx` | "Tutor part-time là đơn vị báo cáo riêng…" |
| `platform/BangQuyDoiAdmin.tsx` | "Dán một cột từ Excel vào một ô → điền xuống…" |
| `platform/MoSuaLichTest.tsx` | "Mở: GVCN (lớp mình), Admin, Quản lý sửa được…" |
| `platform/ProfilePage.tsx` | "Vai trò và chi nhánh do Quản trị hệ thống cấp…" |
| `students/ChuongLop.tsx` | "Hệ thống tự viết dòng này khi…" |
| `students/ChuyenLopPanel.tsx` | dòng phụ "Có Test đi kèm… Bỏ chọn: chuyển ngay…" · "QL chi nhánh và GVCN lớp mới sẽ nhận thông báo…" · "Gửi thành thẻ trong Chờ duyệt của Quản lý…" |
| `students/DauHoSo.tsx` | "Quay lại học thì hạn tính lại từ ngày quay lại" |
| `students/IntakePanel.tsx` | dòng ngữ cảnh "Chọn lớp, dán từ Excel hoặc gõ vào lưới" |
| `students/QuayLaiHoc.tsx` | "Gợi ý: lớp đang chạy cùng chương trình, cùng chi nhánh" |
| `students/StudentDetailPage.tsx` | "Lộ trình RF — kỳ vọng mọi MT bằng Target." (cột Kỳ vọng đã hiện số) |
| `students/StudentPlanPanel.tsx` | "Hệ thống chỉ đề xuất ba lượt đầu…" |
| `test/keHoach/NganXuatDiem.tsx` | "“Chỉ điểm” bỏ 2 cột nhận xét." |
| `worklist/MgmtTasksPage.tsx` | gợi ý ô "Nhìn thấy công việc nhưng KHÔNG sửa được." (×2) · "Mặc định là hạn của việc cha trừ một ngày…" · ghi chú "Việc này hiện trong hồ sơ của…" |
| `worklist/SignalList.tsx` | ghi chú "Những việc này tự hết khi…" |

## GIỮ (lý do)
| Nơi | Đoạn chữ | Lý do |
|---|---|---|
| ⓘ sẵn có (`NutLuat`, `DauThe cachTinh`, `NganDanhSach cachTinh`, `Khoi luat`, `Th hint`) | Cách tính / luật | đã là ⓘ |
| `CapNhatTuan` "Kỳ này chạm mốc quy chế — lưu là PA kết thúc." | | hậu quả lớn |
| `CapNhatTuan` "PA theo quy chế — không thay; … Cần thêm hỗ trợ? + Thêm PA" | | lý do chặn tại nút |
| `CasePanel` "Overall đã đạt — xem và Hoàn thành Case" · "Đang chờ Quản lý trả lời · hạn …" | | trạng thái + dữ liệu |
| `QuickReport`, `TeacherAssignPanel`, `XoaKetThucLopPanel`, `LuotThuongPage`/`MockDetailPage` "Chỉ Quản lý khôi phục…", `HoTroHocVienTab` "Chỉ {ai}…", `BanGiaoPanel` "GVCN lớp cũ xác nhận…", `TienDoTrenLop`, `StudentManagePanel`, `LoYThucPanel` | | lý do chặn |
| `XoaHocVienPanel`, `XemTruocHangLoatPanel`, `XoaTaiKhoanPanel`, `HopKyNang` "Đợt về Chưa xếp…", `TheYeuCau` "Rút đề xuất này?…" | | xác nhận hậu quả lớn |
| `TabBaoCaoPh` "Bài đã viết vẫn còn; khôi phục là hiện lại." | | chống mất dữ liệu, đi kèm nút Khôi phục |
| `BangQuyDoiAdmin` / `CatalogAdmin` ngữ cảnh "Áp cho … sau khi lưu · n lớp giữ lịch cũ" | | hậu quả của Lưu (có số) |
| `KhaiBacPanel` "Thang · xác nhận một lần, chỉ QL sửa sau" · "Lần xử lý kế tiếp: …" · `XacNhanXuLyPanel` "bậc kế vẫn là …" | | hậu quả / dữ liệu |
| `DiemTheoLop` "{MT} là MT cũ: nhập bù điểm…" · `MeetingPage` "Đang đọc cả tháng…" | | trạng thái màn |
| Gợi ý ô: "Phải có đuôi .pisa@gmail.com", "Ít nhất 6 ký tự", "2–200 ký tự…", "Để trống là dùng mặc định (tuần …)" | | ràng buộc nhập / giá trị mặc định |
| `MgmtTasksPage` "Lý do:" / "Lý do dừng hẳn:" | | dữ liệu thật |
| `StudentPlanPanel` (lớp thường) "Đây là lớp thường nên không có lịch MT riêng…" | | nội dung duy nhất của panel (ô rỗng) |
| `PhoiHopSosSection` "Hỗ trợ học thuật xem ở tab Học thuật" | | nội dung ô / link |
| Câu ô rỗng ("Không có …", "Chưa có …") | | ô rỗng |
| `WelcomePage`, `DemoBar`, `ProfilePage` (nhánh demo) | | chỉ bản demo local |
| `tutor/*` | | Tutor hoãn |
| Chú giải màu / ký hiệu (HanhTrinh, LuoiFT, bảng) | | cần để đọc bảng — đề xuất: hỏi chủ SP nếu muốn bỏ |
