/**
 * Màn GV TRƯỚC HD-V2 — chỉ để các vai chưa chuyển (QL, QT, TVV, CX, Admin, Head tutor) mượn như cũ, không đổi nội dung của họ trong PR (a).
 * PR (b) (c) chuyển các vai đó sang `lam` rồi xoá tệp này. GV đọc `gv.ts`.
 */
import type { ManHd } from './kieu.ts';

export const MAN_GV_CU: ManHd[] = [
    {
      /* NEN-V5 K10 + SV-TQ-GV #561: GV có Tổng quan — 4 số + hai khối lớp. */
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      muc: [
        { id: 'tq-viec', ten: 'Bốn số của bạn', buoc: ['<b>Việc của tôi</b> · <b>Case đang xử lý</b> · <b>Đạt kỳ vọng Test</b> · <b>Tiến bộ</b>; bấm số mở danh sách.'],
          chi: { hd: 'tq-tom-tat', duong: '/', chu: 'Bấm một số để xem danh sách tạo nên nó.' } },
        { id: 'tq-hai-khoi', ten: 'Kỹ năng tôi dạy · Lớp tôi chủ nhiệm', buoc: ['<b>Kỹ năng tôi dạy</b>: mỗi lớp một dòng — Đạt kỳ vọng Test, Tiến bộ, bài chờ chấm, Test sắp tới.', '<b>Lớp tôi chủ nhiệm</b>: Dưới kỳ vọng, SOS, Case, Thi tháng này; bấm số mở danh sách em.'],
          chi: { hd: 'tq-lop-toi-day', duong: '/', chu: 'Hai khối lớp của bạn ở đây.' } },
      ],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: ['/hoc-vien'],
      muc: [
        { id: 'hv-tim', ten: 'Tìm em, lớp, GV', buoc: ['Bấm <b>/</b> hoặc <b>Ctrl K</b> (hoặc ô tìm trên thanh trên), gõ ít nhất 2 chữ.', 'Kết quả chia <b>Học viên · Lớp · GV</b>, chỉ người bạn được xem; ↑ ↓ Enter để mở. Gõ "ft101" ra lớp MB FT 101.'],
          chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
        { id: 'hv-goc', ten: 'Ba góc nhìn', buoc: ['<b>Tất cả</b> (lọc <b>Đã thi · chờ kết quả</b>) · <b>Đang SOS</b> (SOS hiện tại, mỗi em một dòng) · <b>Cần làm</b>.', 'Bấm dòng em mở panel một em, không rời trang.'] },
        { id: 'hv-lich-thi', ten: 'Lịch thi và xuất Excel', buoc: ['Góc <b>Lịch thi</b>: chọn tháng ở <b>Dự kiến thi</b> → bấm <b>Kết luận</b> ngay trên hàng (<b>Giữ tháng</b> · <b>Chốt ngày</b> · <b>Chuyển tháng</b> · <b>Chưa kết luận</b>); lưu ngay vào lịch thi của em, không bước duyệt (em đã chốt ngày mà bấm <b>Giữ tháng</b>: hàng hỏi lại “Bỏ ngày …?”).', '<b>Xuất Excel · n HV</b>: xuất đúng danh sách đang lọc; chọn mẫu <b>Danh sách cơ bản</b> · <b>Theo dõi SOS</b> · <b>Kết quả Test</b> hoặc <b>Chọn cột</b>.', '<b>Bộ lọc thêm</b> (góc Tất cả): Case / PA · kỹ năng · kết quả · thời gian — trong nhóm là "hoặc", giữa nhóm là "và". Tích ô trước tên em → <b>Xuất các HV đã chọn</b>.', 'Danh sách dài: 10 dòng một trang, chọn 20 / 50 ở đầu và cuối bảng.'],
          chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Bấm <b>Lịch thi</b> ở hàng này.' } },
      ],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      muc: [
        { id: 'lop-hoc-vien', ten: 'Học viên của lớp', buoc: ['Đầu trang: thanh <b>Việc cần làm</b> của lớp — bấm việc làm ngay tại trang.', 'Bảng em: W1 · W2 riêng, bấm điểm W / S xem điểm thành phần; Case + PA mở dưới hàng; <b>⋯</b> ở dòng em: + Ghi vi phạm, + Case, Nhập điểm.', 'Cuối trang: <b>Điểm Mock Test của lớp</b> (lớp thường: <b>Điểm Test của lớp</b>). Lớp thường có thêm tab <b>Đánh giá đầu ra</b>.'] },
        { id: 'lop-lich-su', ten: 'Xem lịch sử', buoc: ['Hồ sơ lớp › <b>⋯ › Lịch sử</b>: thông tin lớp, tiến độ, phân công; <b>⋯ › Lịch sử góp ý tuần</b>: góp ý cũ. Hồ sơ MT: nút <b>Lịch sử</b>.', 'Mỗi lần lưu một mục: ai · lúc · nguồn · lý do · trước → sau. Lô / Excel: một mục, bấm <b>Xem</b> mở từng em.'] },
      ],
    },
    {
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      muc: [
        { id: 'hv-viec', ten: 'Việc cần làm', buoc: ['Thanh <b>Việc cần làm</b> dưới đầu trang: việc của bạn với em, bấm là mở chỗ làm ngay trên trang.'] },
        { id: 'hv-hoc-thuat', ten: 'Học thuật', buoc: ['Ô điểm to <b>Overall · L · R · W1 · W2 · S</b>: bấm một ô đổi kỹ năng cho cả phần dưới.', '<b>Hành trình</b>: điểm từng MT của kỹ năng, kỳ vọng dạng bậc thang mờ; ô thiếu ghi lý do ("vắng W3 SEP"); S Ex hiện cạnh S, không tính.',
          '<b>Tiến độ trên lớp</b>: ghi / sửa / xoá bài trên lớp (không vào MT). <b>Case & PA</b> của kỹ năng đang chọn — bấm Case mở ngăn Case; PA chưa tới kỳ: <b>Cập nhật trước hạn</b>.'] },
        { id: 'hv-doi-chu-case', ten: 'Đổi người phụ trách Case', buoc: ['GVCN lớp em: mở Case → <b>Đổi người…</b> ở dải đầu → chọn GV dạy kỹ năng của Case hoặc GVCN → <b>Lưu · đóng</b>.'] },
        { id: 'hv-y-thuc', ten: 'Ý thức & Phối hợp', buoc: ['Vi phạm, lần xử lý và Phối hợp SOS của em.'] },
        { id: 'hv-hanh-trinh', ten: 'Lộ trình & lớp', buoc: ['Lưới tuần theo lớp: chương đang học, mọi lượt Test, Case / PA theo tuần.'] },
      ],
    },
    {
      id: 'lich-test', ten: 'Lịch Test', duong: ['/test', '/test/lich'],
      muc: [
        { id: 'lt-ba-khoi', ten: 'Lịch Test tuần', buoc: ['Một tuần (<b>‹ W3 SEP ›</b>, <b>Tuần này</b>): <b>Quá hạn chấm</b> (theo hôm nay, không đổi theo tuần) · <b>Test tuần này</b> — mỗi lớp một dòng, hạn dd/mm.', 'Bấm dòng lớp: lưới từng em mở ngay dưới, gõ điểm tại chỗ; S Ex là dòng phụ của em.'],
          chi: { hd: 'lich-test-tuan', duong: '/test/lich', chu: 'Mỗi lớp một dòng — bấm dòng để gõ điểm.' } },
      ],
    },
    {
      id: 'diem-lop', ten: 'Nhập điểm một lớp', duong: ['/test/diem-lop'],
      muc: [
        { id: 'dl-luot', ten: 'Mở panel Nhập điểm', buoc: ['Học viên & Lớp: <b>⋯</b> ở hàng lớp › <b>Nhập điểm</b>; hoặc nút <b>Nhập điểm</b> ở hồ sơ lớp.',
          'Trong panel: chọn lượt (MT1, MT2…) và môn (<b>Tất cả · L · R · W1 · W2 · S</b>); <b>Chỉ ô còn trống</b> để nhập nốt.'] },
      ],
    },
    {
      id: 'nhap-diem', ten: 'Nhập điểm', duong: ['/nhap-diem', '/bang-diem-thuong', '/mock-test', '/luot-test'],
      muc: [{ id: 'nd-go', ten: 'Gõ điểm', buoc: ['Lớp thường: gõ điểm, Enter sang ô còn nhập ở dưới (bỏ qua ô đã có điểm); mỗi ô tự lưu.', 'Ô MT: <b>Lưu</b> ở lại (✓ Đã lưu · <b>Bài tiếp ›</b>); <b>Lưu · bài tiếp ›</b> (Enter) sang bài còn thiếu kế, hết cột thì sang kỹ năng kế. Xong phần của bạn: <b>Lớp tiếp</b> / <b>Việc tiếp</b>; hồ sơ MT mở từ lưới: <b>Lưu · em tiếp ›</b>.', 'Em vắng: gõ <b>-</b>; ô đã dời ghi "vắng W3 SEP".', 'MT mới nhất của em: ô thiếu <b>nhận xét</b> (dưới kỳ vọng: thêm <b>nhóm nguyên nhân</b>) viền vàng — nên ghi, dùng làm mô tả Case; không chặn lưu.'] }],
    },
    {
      id: 'cong-viec', ten: 'Công việc', duong: ['/cong-viec'],
      muc: [
        { id: 'cv-tai-cho', ten: 'Làm việc ngay trên dòng', buoc: ['Bấm dòng → ô cần điền mở ngay bên; Case mở rộng tại chỗ.', 'Lưu trên dòng: "✓ Đã lưu · … · Hoàn tác".'],
          chi: { hd: 'cv-dong', duong: '/cong-viec', chu: 'Bấm một dòng để làm việc đó.' } },
        { id: 'cd-cheo', ten: 'Speaking chấm chéo', buoc: ['Dòng "Chấm Speaking · n bài" đầu nhóm <b>Chấm điểm</b>: bài Speaking Mock mọi lớp FT chi nhánh bạn, từ Thứ Hai tuần Test.', 'Bấm dòng: tìm em (tên, email), lọc lớp, bấm ô S để chấm; <b>Enter</b> sang em chưa chấm kế.', 'Có số bài chờ, không tính quá hạn.'] },
        { id: 'cv-gop', ten: 'Dòng gộp nhiều em', buoc: ['Dòng "n em" mở danh sách em; làm từng em hoặc cùng lúc.'] },
        { id: 'cv-qua-han', ten: 'Vì sao việc quá hạn', buoc: ['Qua hạn mà chưa Lưu: chữ cam + ⚠ ở cột hạn, nằm đầu nhóm.', 'Lưu xong là hết quá hạn ở mọi nơi.', 'Quá hạn chấm, Case chưa chốt PA quá hạn: <b>Thông báo</b> tự gửi, tự hết khi xong.'] },
        { id: 'cv-loc', ten: 'Lọc việc', buoc: ['Chip <b>⚠ quá hạn</b> lọc mọi việc quá hạn; bấm lại để bỏ.', 'Nhóm việc gập / mở ở đầu nhóm.'],
          chi: { hd: 'cv-loc-them', duong: '/cong-viec', chu: 'Lọc việc quá hạn ở đây.' } },
        { id: 'tq-lop', ten: 'Lớp tôi dạy', buoc: ['Cuối Công việc: các lớp bạn dạy và số bài chờ chấm.', 'Bấm tên lớp mở hồ sơ lớp.'],
          chi: { hd: 'tq-lop-toi-day', duong: '/cong-viec', chu: 'Bấm tên lớp để mở hồ sơ lớp.' } },
        { id: 'tq-yeu-cau', ten: 'Yêu cầu bị từ chối', buoc: ['Cuối Công việc: yêu cầu bị từ chối (sửa và gửi lại) và dòng <b>n yêu cầu chờ duyệt ›</b>.'] },
      ],
    },
    {
      id: 'yeu-cau', ten: 'Yêu cầu của tôi', duong: ['/cong-viec/yeu-cau'],
      muc: [{ id: 'yc-trang-thai', ten: 'Theo dõi đề nghị', buoc: ['Đề nghị bạn gửi QL: Chờ duyệt · Đã duyệt · Bị từ chối (kèm lý do).'] }],
    },
    {
      id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'],
      muc: [{ id: 'hs-sua', ten: 'Sửa hồ sơ', buoc: ['Đổi họ tên, điện thoại, mật khẩu.', 'Ngôn ngữ: menu Tài khoản › <b>VI | EN</b>, nhớ theo tài khoản. Giao diện: <b>Theo máy · Sáng · Tối</b> ở cùng menu.'] }],
    },
    {
      id: 'ho-so-gv', ten: 'Hồ sơ giáo viên', duong: ['/giao-vien'],
      muc: [{ id: 'hsgv-so', ten: 'Số của bạn', buoc: ['Khối <b>Lớp đang dạy</b>: lớp · kỹ năng · số HV · GVCN.', 'Chọn <b>Từ tuần → Đến tuần</b> (mặc định 4 tuần): <b>Chỉ số</b> (Việc đúng hạn, bài Test) và bảng <b>Học thuật</b> theo lớp / theo kỹ năng — Đạt kỳ vọng Test, Tiến bộ, Kết quả thi thật; bấm số mở danh sách.', 'Khối <b>Case đang phụ trách</b> và <b>Yêu cầu đã gửi</b>.'] }],
    },
    {
      id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
      muc: [{ id: 'hd-dung', ten: 'Dùng Hướng dẫn', buoc: ['Bấm <b>?</b> trên thanh trên ở mọi màn: mở đúng mục của màn đó.', '<b>Chỉ cho tôi</b> khoanh nút cần bấm; Esc để tắt.', '<b>In</b> để có bản giấy.'],
        chi: { hd: 'nut-hd', chu: 'Bấm <b>?</b> ở mọi màn.' } }],
    },
];
