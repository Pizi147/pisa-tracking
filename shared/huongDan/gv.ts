/**
 * HD-a — Hướng dẫn GIÁO VIÊN (GVCN + GVBM). 5 việc hằng tuần theo chủ SP 15/10; nội dung mô tả theo mockup OV-13 đã duyệt (đích cuối của
 * 13b / 13c / 13d). PR đổi màn nào thì sửa mục của màn đó ở đây (plan.md 9.0); `data-hd` trỏ tới phải có thật trong web/src (phép kiểm HD-CHI).
 */
import type { HuongDan } from './kieu.ts';

export const HD_GV: HuongDan = {
  viec: [
    {
      id: 'cong-viec', ten: 'Mở Công việc mỗi sáng', khi: 'mỗi ngày',
      buoc: ['Đăng nhập là vào <b>Công việc</b>: một danh sách theo nhóm, quá hạn ở đầu, có ⚠.', 'Việc đầu tự mở bên phải; dòng gộp nhiều em mở một panel.', 'Lưu xong việc tự sang việc kế; <b>‹ việc vừa xong</b> mở lại. Hết việc: <b>Xong hết hôm nay ✓</b>.'],
      chi: { hd: 'nav-cong-viec', chu: 'Bấm <b>Công việc</b> — mọi việc của bạn ở đây.' },
    },
    {
      id: 'nhap-diem', ten: 'Nhập điểm MT + Speaking chấm chéo', khi: 'sau mỗi tuần thi',
      buoc: ['Mở <b>Test › Lịch Test / Chấm Test</b>: khối "Test chấm tuần này", hạn hết <b>Thứ Tư</b>.', 'Bấm lớp, gõ điểm; mọi ô MT có điểm cần <b>nhận xét</b>, ô dưới kỳ vọng thêm <b>nhóm nguyên nhân</b>.',
        'Em vắng: gõ <b>-</b>.', 'Chấm Speaking: <b>Công việc</b>, dòng "Chấm Speaking · n bài" đầu nhóm <b>Chấm điểm</b> — không tính quá hạn.'],
      chi: { hd: 'lich-test-tuan', duong: '/test/lich', chu: 'Bài tuần trước cần chấm nằm ở khối này.' },
    },
    {
      id: 'xac-nhan-pa', ten: 'Xác nhận PA / Case', khi: 'trong 5 ngày',
      buoc: ['Em dưới kỳ vọng ở MT: lượt chưa chốt → Case tạm "Chờ chốt SOS"; lượt chốt → Case + PA theo quy chế, GVBM đúng kỹ năng <b>Xác nhận PA</b> (QL làm thay được).', 'Một em: panel <b>Xác nhận PA</b> — ghi nội dung, <b>Bắt đầu</b>, bấm <b>Xác nhận PA</b>.',
        'Nhiều em cùng lớp, tuần thi, mức SOS: <b>Xác nhận PA cùng lúc</b> — em tick sẵn, <b>Nội dung / hướng dẫn</b> + <b>Bắt đầu</b> + <b>Người dạy</b> ghi một lần, <b>Sửa riêng</b> từng em.',
        'Muốn cách khác: <b>Đề xuất PA khác…</b> → <b>Gửi Quản lý duyệt</b>; Case "Chờ duyệt đổi PA".'],
      chi: { hd: 'cv-dong', duong: '/cong-viec', chu: 'Mỗi việc một dòng, quá hạn ở đầu — bấm dòng để làm.' },
    },
    {
      id: 'ket-qua-pa', ten: 'Ghi kết quả PA', khi: '2 tuần · hết Thứ Ba',
      buoc: ['PA đang chạy: ghi mỗi kỳ <b>2 tuần</b>, hạn <b>Thứ Ba</b> sau kỳ.', 'PA không đếm buổi: ghi ngay trên dòng — <b>Tiến triển (2 tuần)</b>, <b>Nhận xét</b>, <b>Lưu</b> (PA giữ nguyên, <b>Hoàn tác</b> 10 giây).',
        'Tutor, PA có số buổi, lần ghi cuối, Bổ trợ miễn phí: luôn mở panel. Tutor: mỗi buổi chọn tutor (chưa có: <b>Tutor khác</b>), <b>Nhận xét buổi</b>, 3 ô <b>Có · Không</b> (<b>Cả 3 Có</b>); <b>Đánh giá tutor</b> tuỳ chọn.',
        'Cần đổi: <b>Điều chỉnh…</b> (PA quy chế) hoặc <b>Điều chỉnh / Kết thúc…</b>; tới mốc: việc "Kết quả cuối · tên PA", nút <b>Kết quả cuối</b>.'],
      chi: { hd: 'cv-dong', duong: '/cong-viec', chu: 'Việc Case, PA nằm ở nhóm <b>Case học thuật</b>.' },
    },
    {
      id: 'vi-pham-gop-y', ten: 'Ghi vi phạm + Góp ý hàng tuần', khi: 'khi có · mỗi tuần',
      buoc: ['Vi phạm: ở dòng em bấm <b>⋯ › + Ghi vi phạm</b>; hạn xử lý <b>5 ngày</b>.', 'Góp ý: mở hồ sơ lớp › tab <b>Học viên</b> › Cách xem <b>Góp ý hàng tuần</b>.', 'Mỗi ô = một em × một kỹ năng; bạn ghi ở kỹ năng mình dạy.'],
      chi: { hd: 'tq-lop-toi-day', duong: '/cong-viec', chu: 'Bấm tên lớp → tab <b>Học viên</b> › Cách xem <b>Góp ý hàng tuần</b>.' },
    },
  ],
  man: [
    {
      /* OV-15d: GV không còn Tổng quan — trang đầu ("/") mở thẳng Công việc. */
      id: 'tong-quan', ten: 'Trang đầu', duong: ['/'],
      muc: [
        { id: 'tq-viec', ten: 'Vào thẳng Công việc', buoc: ['Trang đầu của GV là <b>Công việc</b>: việc của bạn theo nhóm, quá hạn ở đầu.'],
          chi: { hd: 'nav-cong-viec', chu: 'Bấm <b>Công việc</b> — mọi việc của bạn ở đây.' } },
      ],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: ['/hoc-vien'],
      muc: [
        { id: 'hv-tim', ten: 'Tìm em hoặc lớp', buoc: ['Gõ ít nhất 2 chữ ở ô <b>Tìm học viên, lớp…</b> trên thanh trên.', 'Gõ "ft101" ra lớp MB FT 101.'],
          chi: { hd: 'tim-hv', chu: 'Gõ tên, email em hoặc mã lớp.' } },
        { id: 'hv-goc', ten: 'Ba góc nhìn', buoc: ['<b>Tất cả</b> (lọc <b>Đã thi · chờ kết quả</b>) · <b>Đang SOS</b> (mặc định <b>Toàn bộ</b> 8 tuần, chọn được tuần thi) · <b>Cần làm</b>.', 'Bấm dòng em mở panel một em, không rời trang.'] },
        { id: 'hv-lich-thi', ten: 'Lịch thi và xuất Excel', buoc: ['Góc <b>Lịch thi</b>: chọn tháng ở <b>Dự kiến thi</b> → bấm <b>Kết luận</b> ngay trên hàng (<b>Giữ tháng</b> · <b>Chốt ngày</b> · <b>Chuyển tháng</b> · <b>Cần xác nhận</b>); lưu ngay vào lịch thi của em, không bước duyệt.', '<b>Xuất Excel · n HV</b>: xuất đúng danh sách đang lọc; chọn mẫu <b>Danh sách cơ bản</b> · <b>Theo dõi SOS</b> · <b>Kết quả thi</b> hoặc <b>Chọn cột</b>.', 'Danh sách dài: 10 dòng một trang, chọn 20 / 50 ở đầu và cuối bảng.'],
          chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Bấm <b>Lịch thi</b> ở hàng này.' } },
      ],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      muc: [
        { id: 'lop-hoc-vien', ten: 'Học viên của lớp', buoc: ['Bảng em của lớp; <b>⋯</b> ở dòng em: + Ghi vi phạm, + Case, Nhập điểm.', 'Cuối trang: <b>Điểm Mock Test của lớp</b> (lớp thường: <b>Điểm Test của lớp</b>).'] },
        { id: 'lop-gop-y', ten: 'Góp ý hàng tuần', buoc: ['Tab <b>Học viên</b> › Cách xem <b>Góp ý hàng tuần</b>: hàng = em, cột = kỹ năng, chọn tuần ‹ ›.', 'Bạn ghi / sửa ô ở kỹ năng mình dạy.'] },
        { id: 'lop-lich-su', ten: 'Xem lịch sử thay đổi', buoc: ['Hồ sơ lớp › <b>⋯ › Lịch sử thay đổi</b>: thông tin lớp, tiến độ, phân công. Góp ý hàng tuần, hồ sơ MT: nút <b>Lịch sử thay đổi</b>.', 'Mỗi lần lưu một mục: ai · lúc · nguồn · lý do · trước → sau. Lô / Excel: một mục, bấm <b>Xem</b> mở từng em.'] },
      ],
    },
    {
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      muc: [
        { id: 'hv-hoc-thuat', ten: 'Học thuật', buoc: ['Bảng kỹ năng: ô điểm bốn màu, Case và PA của em.', 'Bấm Case mở ngăn Case ngay trên trang.', 'PA chưa tới kỳ: <b>Cập nhật trước hạn</b> trong ngăn Case.'] },
        { id: 'hv-y-thuc', ten: 'Ý thức & Phối hợp', buoc: ['Vi phạm, lần xử lý và Phối hợp SOS của em.'] },
        { id: 'hv-hanh-trinh', ten: 'Hành trình', buoc: ['Mọi lượt Test của em trên một lưới.'] },
      ],
    },
    {
      id: 'lich-test', ten: 'Lịch Test', duong: ['/test', '/test/lich'],
      muc: [
        { id: 'lt-ba-khoi', ten: 'Ba khối của Lịch Test', buoc: ['<b>Test quá hạn chấm</b> · <b>Test chấm tuần này</b> (hạn Thứ Tư) · <b>Lịch Test</b> tuần đang xem.', 'Bấm dòng lớp, lưới nhập điểm mở ngay dưới.'],
          chi: { hd: 'lich-test-tuan', duong: '/test/lich', chu: 'Bài tuần trước cần chấm nằm ở khối này.' } },
      ],
    },
    {
      id: 'diem-lop', ten: 'Nhập điểm một lớp', duong: ['/test/diem-lop'],
      muc: [
        { id: 'dl-luot', ten: 'Mở panel Nhập điểm', buoc: ['Học viên & Lớp: <b>⋯</b> ở hàng lớp › <b>Nhập điểm</b>; hoặc nút <b>Nhập điểm</b> ở hồ sơ lớp.',
          'Trong panel: chọn lượt (MT1, MT2…) và môn (<b>Tất cả · L · R · W1 · W2 · S</b>); <b>Chỉ ô còn trống</b> để nhập nốt.'] },
        { id: 'dl-dan', ten: 'Dán từ Excel', buoc: ['Bấm <b>Dán từ Excel</b> (nút <b>?</b>: 6 bước + Sao chép mẫu): mỗi em một dòng, <b>Tên | điểm | nhận xét</b> từng kỹ năng.',
          'Kiểm bảng xem trước: ô mới, ghi đè, lỗi; trùng tên thì chọn em; dưới kỳ vọng chọn nhóm nguyên nhân.',
          'W1, W2, S: bốn tiêu chí cách nhau dấu cách. <b>Lưu n dòng</b>: dòng chưa đủ còn là nháp; <b>Hoàn tác</b> trả lại như trước.'] },
      ],
    },
    {
      id: 'nhap-diem', ten: 'Nhập điểm', duong: ['/nhap-diem', '/bang-diem-thuong', '/mock-test'],
      muc: [{ id: 'nd-go', ten: 'Gõ điểm', buoc: ['Gõ điểm, Enter sang ô dưới; mỗi ô tự lưu.', 'Em vắng: gõ <b>-</b>.', 'Ô MT có điểm: ghi <b>nhận xét</b>; dưới kỳ vọng thêm <b>nhóm nguyên nhân</b>.'] }],
    },
    {
      id: 'cong-viec', ten: 'Công việc', duong: ['/cong-viec'],
      muc: [
        { id: 'cv-tai-cho', ten: 'Làm việc ngay trên dòng', buoc: ['Bấm dòng → ô cần điền mở ngay bên.', 'Lưu trên dòng: "✓ Đã lưu · … · Hoàn tác" rồi tự sang việc kế; panel: <b>Việc tiếp ›</b>.'],
          chi: { hd: 'cv-dong', duong: '/cong-viec', chu: 'Bấm một dòng để làm việc đó.' } },
        { id: 'cd-cheo', ten: 'Speaking chấm chéo', buoc: ['Dòng "Chấm Speaking · n bài" đầu nhóm <b>Chấm điểm</b>: bài Speaking Mock mọi lớp FT chi nhánh bạn, từ Thứ Hai tuần thi.', 'Bấm dòng: tìm em (tên, email), lọc lớp, bấm ô S để chấm; <b>Enter</b> sang em kế.', 'Có số bài chờ, không tính quá hạn.'] },
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
      muc: [{ id: 'hsgv-so', ten: 'Số của bạn', buoc: ['Lớp đang dạy, học viên, Case đang phụ trách, việc quá hạn; bấm số mở Công việc.', 'Khối <b>Kết quả gần nhất của lớp đang dạy</b>.', 'Khối <b>Yêu cầu đã gửi</b>.'] }],
    },
    {
      id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
      muc: [{ id: 'hd-dung', ten: 'Dùng Hướng dẫn', buoc: ['Menu Tài khoản › <b>Hướng dẫn</b> ở mọi màn mở đúng mục của màn đó.', '<b>Chỉ cho tôi</b> khoanh nút cần bấm; Esc để tắt.', '<b>In</b> để có bản giấy.'],
        chi: { hd: 'tai-khoan', chu: 'Bấm tên bạn › <b>Hướng dẫn</b>.' } }],
    },
  ],
  luat: [
    { id: 'han-cham', ten: 'Hạn chấm Mock Test', buoc: ['Bài của tuần thi: chấm xong trước hết <b>Thứ Tư</b> tuần kế.', 'MT0: hết <b>Thứ Tư</b> tuần sau.', 'Speaking chấm chéo không tính quá hạn.'] },
    { id: 'han-xac-nhan', ten: 'Hạn Xác nhận PA', buoc: ['<b>5 ngày</b> từ ngày chốt lượt, tính cả ngày đầu.', 'SOS 3 / Gấp: <b>3 ngày</b>.', 'Progress Test lớp thường: Xác nhận Case trong 5 ngày.'] },
    { id: 'han-ket-qua', ten: 'Hạn Ghi kết quả PA', buoc: ['Kỳ <b>2 tuần</b>; hạn <b>Thứ Ba</b> sau kỳ.', 'Kỹ năng đạt ở MT sau → <b>Ghi kết quả cuối</b>, rồi Hoàn thành Case.', 'Chưa có ngày thi → mốc là MT cuối lộ trình.'],
      chi: { hd: 'cv-dong', duong: '/cong-viec', chu: 'Mỗi việc có chip hạn ở cuối dòng.' } },
    { id: 'han-vi-pham', ten: 'Hạn Xử lý vi phạm', buoc: ['<b>5 ngày</b> từ ngày ghi nhận, tính cả ngày đầu.', 'Bậc cần QL thì QL duyệt.'] },
    { id: 'han-ql', ten: 'QL trả lời đề xuất', buoc: ['QL trả lời Đề xuất PA / Xin hỗ trợ trong <b>5 ngày</b>, tính cả ngày gửi.'] },
    { id: 'dau-gach', ten: 'Dấu "-" (vắng)', buoc: ['Trong tuần thi: "-" = vắng, chốt ngay.', 'Nhập bù / MT cũ: "-" = Không dự thi.', 'Gỡ vắng: xoá "-", lúc nào cũng được.'] },
    { id: 'sos-case', ten: 'SOS và Case', buoc: ['Số kỹ năng dưới kỳ vọng ở MT: 1 → SOS 1, 2 → SOS 2, 3–4 → SOS 3.', 'Lượt chưa chốt: Case tạm "Chờ chốt SOS" — chưa hạn, chưa việc.', 'Lượt chốt → "Chờ xác nhận PA"; Overall đạt mà chưa xác nhận PA → Case tự xoá.',
      'Bấm <b>chip SOS</b> ở mọi màn: hộp "Vì sao SOS n" — kỹ năng dưới kỳ vọng, điểm từng kỹ năng, lối mở hồ sơ MT.'] },
    { id: 'ket-thuc-pa', ten: 'Kết thúc PA sớm', buoc: ['PA quy chế: GVCN / QL vào <b>⋯ › Kết thúc PA</b>.', 'Lý do bắt buộc, từ <b>10</b> ký tự; nhật ký PA ghi lại.'] },
    { id: 'ban-giao', ten: 'Bàn giao khi em chuyển lớp', buoc: ['Hạn bàn giao = muộn hơn của (ngày quyết định chuyển lớp + 7 ngày) và mốc cũ.'] },
    { id: 'sua-diem', ten: 'Sửa điểm sau hoàn tất', buoc: ['Ô còn trống: nhập được cả sau hoàn tất.', 'Sửa hoặc xoá một điểm đã có: nhờ QL sửa.', 'Gỡ "-" lúc nào cũng được.'] },
    { id: 'nhan-xet', ten: 'Nhận xét MT', buoc: ['Mọi ô MT có điểm cần nhận xét từ <b>10</b> ký tự (trừ MT0, MT cũ / nhập bù).', 'Ô dưới kỳ vọng thêm <b>nhóm nguyên nhân</b>.', 'Nhận xét + nhóm là nguyên nhân của Case.'] },
    { id: 'gop-y', ten: 'Góp ý hàng tuần', buoc: ['Mỗi ô = một em × một kỹ năng × một tuần; tối đa <b>500</b> ký tự.', 'Chỉ ghi ở kỹ năng mình dạy.'] },
  ],
  tu: [
    { ten: 'MT (bài thi thử)', nghia: 'Mock Test 4 kỹ năng L R W S của lớp Fast Track; MT0 là mốc đầu vào.' },
    { ten: 'Lớp thường (không phải FT)', nghia: 'Pre FOU, FOU, BE, ELE — làm Progress Test và Final Test, đếm theo môn.' },
    { ten: 'Kỳ vọng', nghia: 'Band em cần đạt ở mỗi MT theo lộ trình.' },
    { ten: 'SOS 1 · 2 · 3', nghia: 'Theo số kỹ năng dưới kỳ vọng: 1, 2, hoặc 3–4. Chip chỉ có viền vàng / cam / đỏ, dày dần; SOS tạm viền đứt.' },
    { ten: '✓ / ✗ cạnh điểm', nghia: '✓ xanh lá vượt kỳ vọng · ✓ xanh dương bằng · ✗ đỏ dưới. Hộp nhập điểm: ▲ / ▼ so kỳ vọng.' },
    { ten: 'Case (hồ sơ vấn đề)', nghia: 'Hồ sơ một vấn đề học thuật của em: nguyên nhân, PA, kết quả.' },
    { ten: 'Case tạm / SOS tạm', nghia: 'Lượt MT chưa chốt: SOS và Case chỉ tạm ("Chờ chốt SOS") — chưa hạn, chưa việc, chưa vào số đếm; chốt lượt mới thành thật.' },
    { ten: 'KCK', nghia: 'Không cam kết Target: không kỳ vọng MT, không SOS tự động; vẫn có lịch MT, nhập điểm, Case tay, Ý thức.' },
    { ten: 'PA (phương án)', nghia: 'Cách hỗ trợ em: Xếp tự học, Bổ trợ, Tutor…' },
    { ten: 'PA quy chế', nghia: 'PA mặc định theo mức SOS, chạy tới mốc quy chế.' },
    { ten: 'PA Bổ trợ', nghia: 'PA của lớp thường sau Progress Test, chạy đến Cuối khoá.' },
    { ten: 'Tutor (học kèm)', nghia: 'PA học kèm; ghi kết quả từng buổi.' },
    { ten: 'GVCN · GVBM', nghia: 'Giáo viên chủ nhiệm lớp · giáo viên dạy một kỹ năng.' },
    { ten: 'Speaking chấm chéo', nghia: 'GV có kỹ năng Speaking chấm S Mock mọi lớp FT chi nhánh mình.' },
    { ten: 'Mã tuần', nghia: '<b>W2 OCT</b> = tuần thứ 2 của tháng 10; tuần thuộc tháng chứa Thứ Năm.' },
    { ten: 'QL (Quản lý)', nghia: 'Quản lý chi nhánh — duyệt Case, PA, đề xuất, lịch Test.' },
  ],
};
