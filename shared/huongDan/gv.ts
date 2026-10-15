/**
 * HD-a — Hướng dẫn GIÁO VIÊN (GVCN + GVBM). 5 việc hằng tuần theo chủ SP 15/10; nội dung mô tả theo mockup OV-13 đã duyệt (đích cuối của
 * 13b / 13c / 13d). PR đổi màn nào thì sửa mục của màn đó ở đây (plan.md 9.0); `data-hd` trỏ tới phải có thật trong web/src (phép kiểm HD-CHI).
 */
import type { HuongDan } from './kieu.ts';

export const HD_GV: HuongDan = {
  viec: [
    {
      id: 'cong-viec', ten: 'Mở Công việc mỗi sáng', khi: 'mỗi ngày',
      buoc: ['Bấm <b>Công việc</b>. Quá hạn ở đầu, có ⚠.', 'Bấm dòng để làm ngay tại chỗ; dòng gộp nhiều em mở một panel.', 'Xong: dòng ghi "✓ Đã lưu", việc kế tự mở.'],
      chi: { hd: 'nav-cong-viec', chu: 'Bấm <b>Công việc</b> — mọi việc của bạn ở đây.' },
    },
    {
      id: 'nhap-diem', ten: 'Nhập điểm MT + Speaking chấm chéo', khi: 'sau mỗi tuần thi',
      buoc: ['Mở <b>Test › Lịch Test / Chấm Test</b>: khối "Test chấm tuần này", hạn hết <b>Thứ Tư</b>.', 'Bấm lớp, gõ điểm; mọi ô MT có điểm cần <b>nhận xét</b>, ô dưới kỳ vọng thêm <b>nhóm nguyên nhân</b>.',
        'Em vắng: gõ <b>-</b>.', 'Speaking chấm chéo: <b>Công việc › Chấm điểm</b> — có số bài chờ, không tính quá hạn.'],
      chi: { hd: 'lich-test-tuan', duong: '/test/lich', chu: 'Bài tuần trước cần chấm nằm ở khối này.' },
    },
    {
      id: 'xac-nhan-pa', ten: 'Xác nhận PA / Case', khi: 'trong 5 ngày',
      buoc: ['Em dưới kỳ vọng ở MT → Case + PA theo quy chế; GVBM đúng kỹ năng <b>Xác nhận PA</b> (QL làm thay được).', 'Dòng "Xác nhận PA · n em" gom theo lớp, tuần thi, mức SOS: xác nhận cùng lúc, sửa riêng từng em được.',
        'Muốn cách khác: <b>Đề xuất PA khác…</b>, QL duyệt.', 'Progress Test lớp thường: <b>Xác nhận Case</b> (nhóm + mô tả + PA Bổ trợ).'],
      chi: { hd: 'cv-dong', duong: '/cong-viec', chu: 'Mỗi việc một dòng, quá hạn ở đầu — bấm dòng để làm.' },
    },
    {
      id: 'ket-qua-pa', ten: 'Ghi kết quả PA', khi: '2 tuần · hết Thứ Ba',
      buoc: ['PA đang chạy: ghi mỗi kỳ <b>2 tuần</b>, hạn <b>Thứ Ba</b> sau kỳ.', 'Ngay trên dòng: chọn <b>Tiến triển (2 tuần)</b>, ghi <b>Nhận xét</b>, bấm <b>Lưu</b>.',
        'Cần đổi cách dạy: <b>Điều chỉnh</b>; tới mốc: <b>Ghi kết quả cuối</b>.'],
      chi: { hd: 'cv-loc-them', duong: '/cong-viec', chu: '<b>Lọc thêm › Nhóm việc › Case học thuật</b> để chỉ xem việc Case, PA.' },
    },
    {
      id: 'vi-pham-gop-y', ten: 'Ghi vi phạm + Góp ý hàng tuần', khi: 'khi có · mỗi tuần',
      buoc: ['Vi phạm: ở dòng em bấm <b>⋯ › + Ghi vi phạm</b>; hạn xử lý <b>5 ngày</b>.', 'Góp ý: mở hồ sơ lớp › tab <b>Học viên</b> › Cách xem <b>Góp ý hàng tuần</b>.', 'Mỗi ô = một em × một kỹ năng; bạn ghi ở kỹ năng mình dạy.'],
      chi: { hd: 'tq-lop-toi-day', duong: '/', chu: 'Bấm tên lớp → tab <b>Học viên</b> › Cách xem <b>Góp ý hàng tuần</b>.' },
    },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      muc: [
        { id: 'tq-viec', ten: 'Hôm nay', buoc: ['Việc tới hết tuần, quá hạn ở đầu.', 'Bấm một việc để làm ngay; điện thoại: <b>Xem hết</b> mở Công việc.'],
          chi: { hd: ['tq-viec-cua-toi', 'tq-hom-nay'], chu: 'Việc tới hết tuần — bấm để làm.' } },
        { id: 'tq-lop', ten: 'Lớp tôi dạy', buoc: ['Các lớp bạn đang dạy và số bài chờ chấm.', 'Bấm tên lớp mở hồ sơ lớp.'],
          chi: { hd: 'tq-lop-toi-day', chu: 'Bấm tên lớp để mở hồ sơ lớp.' } },
        { id: 'tq-yeu-cau', ten: 'Yêu cầu của tôi', buoc: ['Đề nghị bạn đã gửi QL (dời lịch, đổi PA…) và trạng thái.'] },
      ],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: ['/hoc-vien'],
      muc: [
        { id: 'hv-tim', ten: 'Tìm em hoặc lớp', buoc: ['Gõ ít nhất 2 chữ ở ô <b>Tìm học viên, lớp…</b> trên thanh trên.', 'Gõ "ft101" ra lớp MB FT 101.'],
          chi: { hd: 'tim-hv', chu: 'Gõ tên em hoặc mã lớp.' } },
        { id: 'hv-goc', ten: 'Ba góc nhìn', buoc: ['<b>Tất cả</b> · <b>Đang SOS</b> theo tuần thi · <b>Cần làm</b>.', 'Bấm dòng em mở panel một em, không rời trang.'] },
      ],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      muc: [
        { id: 'lop-hoc-vien', ten: 'Học viên của lớp', buoc: ['Bảng em của lớp; <b>⋯</b> ở dòng em: + Ghi vi phạm, + Case, Nhập điểm.', 'Cuối trang: <b>Điểm Mock Test của lớp</b> (lớp thường: <b>Điểm Test của lớp</b>).'] },
        { id: 'lop-gop-y', ten: 'Góp ý hàng tuần', buoc: ['Tab <b>Học viên</b> › Cách xem <b>Góp ý hàng tuần</b>: hàng = em, cột = kỹ năng, chọn tuần ‹ ›.', 'Bạn ghi / sửa ô ở kỹ năng mình dạy.'] },
      ],
    },
    {
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      muc: [
        { id: 'hv-hoc-thuat', ten: 'Học thuật', buoc: ['Bảng kỹ năng: ô điểm bốn màu, Case và PA của em.', 'Bấm Case mở ngăn Case ngay trên trang.'] },
        { id: 'hv-y-thuc', ten: 'Ý thức & Phối hợp', buoc: ['Vi phạm, lần xử lý và Phối hợp SOS của em.'] },
        { id: 'hv-hanh-trinh', ten: 'Hành trình', buoc: ['Mọi lượt Test của em trên một lưới.'] },
      ],
    },
    {
      id: 'lich-test', ten: 'Lịch Test', duong: ['/test', '/test/lich'],
      muc: [
        { id: 'lt-ba-khoi', ten: 'Ba khối của Lịch Test', buoc: ['<b>Test quá hạn chấm</b> · <b>Test chấm tuần này</b> (hạn Thứ Tư) · <b>Lịch Test</b> tuần đang xem.', 'Bấm dòng lớp, lưới nhập điểm mở ngay dưới.'],
          chi: { hd: 'lich-test-tuan', chu: 'Bài tuần trước cần chấm nằm ở khối này.' } },
      ],
    },
    {
      id: 'diem-lop', ten: 'Điểm theo lớp', duong: ['/test/diem-lop'],
      muc: [{ id: 'dl-luot', ten: 'Bảng điểm một lượt', buoc: ['Chọn lớp, chọn lượt (MT1, MT2…).', '<b>Chỉ ô còn trống</b> để nhập nốt.'] }],
    },
    {
      id: 'nhap-diem', ten: 'Nhập điểm', duong: ['/nhap-diem', '/bang-diem-thuong', '/mock-test'],
      muc: [{ id: 'nd-go', ten: 'Gõ điểm', buoc: ['Gõ điểm, Enter sang ô dưới; mỗi ô tự lưu.', 'Em vắng: gõ <b>-</b>.', 'Ô MT có điểm: ghi <b>nhận xét</b>; dưới kỳ vọng thêm <b>nhóm nguyên nhân</b>.'] }],
    },
    {
      id: 'cong-viec', ten: 'Công việc', duong: ['/cong-viec'],
      muc: [
        { id: 'cv-tai-cho', ten: 'Làm việc ngay trên dòng', buoc: ['Bấm dòng → ô cần điền mở ngay bên.', '<b>Lưu</b>; dòng gập "✓ Đã lưu", việc kế tự mở.'],
          chi: { hd: 'cv-dong', chu: 'Bấm một dòng để làm việc đó.' } },
        { id: 'cv-gop', ten: 'Dòng gộp nhiều em', buoc: ['Dòng "n em" mở danh sách em; làm từng em hoặc cùng lúc.'] },
        { id: 'cv-qua-han', ten: 'Vì sao việc quá hạn', buoc: ['Qua hạn mà chưa Lưu: chip <b>Quá hạn</b> cam + ⚠, nằm đầu danh sách.', 'Lưu xong là hết quá hạn ở mọi nơi.'] },
        { id: 'cv-loc', ten: 'Lọc việc', buoc: ['Chip <b>Quá hạn · Hôm nay · Tuần này · Tất cả</b>; <b>Lọc thêm</b> theo nhóm việc, chương trình.'],
          chi: { hd: 'cv-loc-them', chu: 'Lọc theo nhóm việc ở đây.' } },
      ],
    },
    {
      id: 'cham-diem', ten: 'Chấm điểm', duong: ['/cong-viec/cham-diem'],
      muc: [{ id: 'cd-cheo', ten: 'Speaking chấm chéo', buoc: ['Bài Speaking của lớp khác cùng chi nhánh: bài tuần trước + bài còn tồn, gom theo tuần thi → lớp.', 'Có số bài chờ, không tính quá hạn.'] }],
    },
    {
      id: 'yeu-cau', ten: 'Yêu cầu của tôi', duong: ['/cong-viec/yeu-cau'],
      muc: [{ id: 'yc-trang-thai', ten: 'Theo dõi đề nghị', buoc: ['Đề nghị bạn gửi QL: Chờ duyệt · Đã duyệt · Bị từ chối (kèm lý do).'] }],
    },
    {
      id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'],
      muc: [{ id: 'hs-sua', ten: 'Sửa hồ sơ', buoc: ['Đổi họ tên, điện thoại, mật khẩu.', 'Ngôn ngữ: nút <b>VI | EN</b> ở thanh trên (điện thoại: menu Tài khoản), nhớ theo tài khoản.'] }],
    },
    {
      id: 'ho-so-gv', ten: 'Hồ sơ giáo viên', duong: ['/giao-vien'],
      muc: [{ id: 'hsgv-so', ten: 'Số của bạn', buoc: ['Lớp đang dạy, học viên, Case đang phụ trách, việc quá hạn.', 'Bấm một số để xem danh sách.'] }],
    },
    {
      id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
      muc: [{ id: 'hd-dung', ten: 'Dùng Hướng dẫn', buoc: ['Nút <b>?</b> ở mọi màn mở đúng mục của màn đó.', '<b>Chỉ cho tôi</b> khoanh nút cần bấm; Esc để tắt.', '<b>In</b> để có bản giấy.'],
        chi: { hd: 'nut-hd', chu: 'Nút <b>?</b> có ở mọi màn.' } }],
    },
  ],
  luat: [
    { id: 'han-cham', ten: 'Hạn chấm Mock Test', buoc: ['Bài của tuần thi: chấm xong trước hết <b>Thứ Tư</b> tuần kế.', 'MT0: hết <b>Thứ Tư</b> tuần sau.', 'Speaking chấm chéo không tính quá hạn.'] },
    { id: 'han-xac-nhan', ten: 'Hạn Xác nhận PA', buoc: ['<b>5 ngày</b> từ ngày chốt lượt, tính cả ngày đầu.', 'SOS 3 / Gấp: <b>3 ngày</b>.', 'Progress Test lớp thường: Xác nhận Case trong 5 ngày.'] },
    { id: 'han-ket-qua', ten: 'Hạn Ghi kết quả PA', buoc: ['Kỳ <b>2 tuần</b>; hạn <b>Thứ Ba</b> sau kỳ.', 'Kỹ năng đạt ở MT sau → <b>Ghi kết quả cuối</b>, rồi Hoàn thành Case.', 'Chưa có ngày thi → mốc là MT cuối lộ trình.'],
      chi: { hd: 'cv-dong', duong: '/cong-viec', chu: 'Mỗi việc có chip hạn ở cuối dòng.' } },
    { id: 'han-vi-pham', ten: 'Hạn Xử lý vi phạm', buoc: ['<b>5 ngày</b> từ ngày ghi nhận, tính cả ngày đầu.', 'Bậc cần QL thì QL duyệt.'] },
    { id: 'han-ql', ten: 'QL trả lời đề xuất', buoc: ['QL trả lời Đề xuất PA / Xin hỗ trợ trong <b>5 ngày</b>, tính cả ngày gửi.'] },
    { id: 'dau-gach', ten: 'Dấu "-" (vắng)', buoc: ['Trong tuần thi: "-" = vắng, chốt ngay.', 'Nhập bù / MT cũ: "-" = Không dự thi.', 'Gỡ vắng: xoá "-".'] },
    { id: 'sos-case', ten: 'SOS và Case', buoc: ['Số kỹ năng dưới kỳ vọng ở MT: 1 → SOS 1, 2 → SOS 2, 3–4 → SOS 3.', 'Có nhận xét → Case "Chờ xác nhận PA".', 'Overall đạt mà chưa xác nhận PA → Case tự xoá.'] },
    { id: 'nhan-xet', ten: 'Nhận xét MT', buoc: ['Mọi ô MT có điểm cần nhận xét từ <b>10</b> ký tự (trừ MT0, MT cũ / nhập bù).', 'Ô dưới kỳ vọng thêm <b>nhóm nguyên nhân</b>.', 'Nhận xét + nhóm là nguyên nhân của Case.'] },
    { id: 'gop-y', ten: 'Góp ý hàng tuần', buoc: ['Mỗi ô = một em × một kỹ năng × một tuần; tối đa <b>500</b> ký tự.', 'Chỉ ghi ở kỹ năng mình dạy.'] },
  ],
  tu: [
    { ten: 'MT (bài thi thử)', nghia: 'Mock Test 4 kỹ năng L R W S của lớp Fast Track; MT0 là mốc đầu vào.' },
    { ten: 'Lớp thường (không phải FT)', nghia: 'Pre FOU, FOU, BE, ELE — làm Progress Test và Final Test, đếm theo môn.' },
    { ten: 'Kỳ vọng', nghia: 'Band em cần đạt ở mỗi MT theo lộ trình.' },
    { ten: 'SOS 1 · 2 · 3', nghia: 'Theo số kỹ năng dưới kỳ vọng: 1, 2, hoặc 3–4.' },
    { ten: 'Case (hồ sơ vấn đề)', nghia: 'Hồ sơ một vấn đề học thuật của em: nguyên nhân, PA, kết quả.' },
    { ten: 'PA (phương án)', nghia: 'Cách hỗ trợ em: Xếp tự học, Bổ trợ, Tutor…' },
    { ten: 'PA quy chế', nghia: 'PA mặc định theo mức SOS, chạy tới mốc quy chế.' },
    { ten: 'PA Bổ trợ', nghia: 'PA của lớp thường sau Progress Test, chạy đến Cuối khoá.' },
    { ten: 'Tutor (học kèm)', nghia: 'PA học kèm; ghi kết quả từng buổi.' },
    { ten: 'GVCN · GVBM', nghia: 'Giáo viên chủ nhiệm lớp · giáo viên dạy một kỹ năng.' },
    { ten: 'Speaking chấm chéo', nghia: 'GV cùng chi nhánh chấm Speaking của lớp khác.' },
    { ten: 'Mã tuần', nghia: '<b>W2 OCT</b> = tuần thứ 2 của tháng 10; tuần thuộc tháng chứa Thứ Năm.' },
    { ten: 'QL (Quản lý)', nghia: 'Quản lý chi nhánh — duyệt Case, PA, đề xuất, lịch Test.' },
  ],
};
