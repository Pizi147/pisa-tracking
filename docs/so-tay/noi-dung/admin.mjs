// Sổ Admin chi nhánh (VI) — lo Mock Test. Theo màn / Luật / Thuật ngữ lấy từ shared/huongDan/admin.ts.
import { xepLich, luoiDiem } from './phu-luc.mjs';
import { bangQuyen } from './quyen.mjs';

export const ADMIN = {
  ma: 'admin', lang: 'vi', vai: 'admin', tenPdf: 'PTA - ADMIN MANUAL',
  ten: 'Sổ tay Admin chi nhánh', doiTuong: 'Admin chi nhánh',
  phu: 'Cho Admin chi nhánh: lịch Mock Test, theo dõi chấm điểm, nhập bù / sửa điểm, sửa thông tin học viên.',
  nho: [
    'Mỗi sáng: <kbd>Tổng quan</kbd> › <b>Mock Test</b> — bốn số, bấm là ra đúng chỗ.',
    'Xếp / dời lịch ở <kbd>Kế hoạch Test</kbd>; <b>dời hạn chấm</b>, huỷ / khôi phục lượt là việc của Quản lý.',
    'Sửa điểm: bấm ô, sửa, ghi lý do (tuỳ chọn) — nhật ký ghi tên bạn.',
  ],
  gioiThieu: '<p class="luat"><b>Thời gian trên màn</b>Tuần ghi bằng mã tuần: <b>W2 OCT</b> = tuần thứ 2 của tháng 10. Hạn chấm Mock Test: hết <b>Thứ Tư</b> tuần sau tuần thi.</p>',
  khung: { id: 'gv-khung', cap: 'Thanh trên cùng (giống giáo viên; Admin có Test đủ ba tab, Công việc chỉ nhóm Chấm điểm)' },
  viec: [
    {
      ten: '1. Tổng quan › Mock Test mỗi sáng', ai: 'Admin chi nhánh', han: 'Mỗi ngày', o: '<kbd>Tổng quan</kbd> › <b>Mock Test</b>',
      anh: { id: 'ad-tong-quan', chu: ['Bốn ô: Lượt MT tuần này · Bài chưa nhập điểm · Đề nghị dời chờ · MT chưa xếp lịch.'] },
      buoc: ['Đọc bốn ô; bấm một ô mở Kế hoạch Test / Lịch Test đúng chỗ.', 'Khối <b>GV chấm quá hạn</b>: ai còn nợ điểm.', '<b>Lịch sắp tới</b>: <kbd>Xem toàn bộ lịch ›</kbd> mở Kế hoạch Test.'],
      xong: 'Số giảm khi GV nhập đủ / lịch đã xếp.', sua: 'Chỉ xem.', chan: '—', loi: [],
    },
    {
      ten: '2. Xếp / dời lịch MT', ai: 'Admin chi nhánh, Quản lý', han: 'Mỗi tuần', o: '<kbd>Test</kbd> › <kbd>Kế hoạch Test</kbd>',
      anh: { id: 'ad-ke-hoach', chu: ['Hàng lọc: Fast Track / Lớp thường, Cần xếp lại, tìm lớp, <kbd>Xếp nhiều MT…</kbd>.'] },
      anhThem: [{ id: 'ad-xep-nhieu-mt', cap: 'Xếp lịch Mock Test nhiều lớp' }],
      buoc: ['Nhiều lớp: <kbd>Xếp nhiều MT…</kbd> — Đợt → Tuần và kỹ năng → Học viên (phụ lục D).', 'Một kỹ năng: bấm chip kỹ năng ở dòng lớp, chọn tuần, <kbd>Lưu</kbd>.', '<kbd>⋯</kbd>: <b>Xếp lịch</b> · <b>Dời lịch thi</b> · <b>Sửa điểm</b> · <b>Trả lời đề nghị dời</b>; mục ghi "Chỉ Quản lý" thì nhờ Quản lý.'],
      xong: '"Đã xếp n em"; lịch hiện ở Kế hoạch Test, GV có việc nhập điểm theo tuần thi.',
      sua: 'Xếp lại hoặc dời từng bài — không có hoàn tác cả lô.',
      chan: '<b>Dời hạn chấm</b>, đổi tuần cả đợt, huỷ / khôi phục lượt: chỉ Quản lý.',
      loi: [['Bài bị "Chặn" ở xem trước', 'Đổi tuần khác; bài có cảnh báo cần tick <kbd>Vẫn xếp n bài có cảnh báo</kbd>.']],
    },
    {
      ten: '3. Theo dõi chấm điểm', ai: 'Admin chi nhánh', han: 'Sau mỗi tuần thi (hạn chấm Thứ Tư)', o: '<kbd>Test</kbd> › <kbd>Lịch Test / Chấm Test</kbd>; <kbd>Công việc</kbd>',
      anh: { id: 'ad-lich-test', cap: '' },
      anhThem: [{ id: 'ad-cong-viec', cap: 'Công việc: chỉ nhóm Chấm điểm', chu: ['<kbd>Lọc thêm</kbd> › Của một GV.'] }],
      buoc: ['<kbd>Lịch Test / Chấm Test</kbd>: <b>Test quá hạn chấm</b> · <b>Test chấm tuần này</b> (hạn Thứ Tư).', '<kbd>Công việc</kbd>: chỉ nhóm Chấm điểm của chi nhánh; <kbd>Lọc thêm</kbd> › Của một GV.', 'Nhắc GV trực tiếp; việc tự hết khi GV nhập đủ điểm (có nhận xét).'],
      xong: 'Khối quá hạn trống; số "Bài chưa nhập điểm" về 0.', sua: '—', chan: '—', loi: [],
    },
    {
      ten: '4. Nhập bù / sửa điểm', ai: 'Admin chi nhánh, Quản lý', han: 'Khi GV vắng · nhập nhầm', o: 'Lưới điểm (bấm dòng lớp ở Lịch Test, hoặc <kbd>Điểm theo lớp</kbd>)',
      anh: { id: 'ad-o-diem', cap: 'Sửa một ô đã có điểm' },
      buoc: ['Mở lưới điểm: bấm dòng lớp ở Lịch Test (hoặc <kbd>Điểm theo lớp</kbd>).', 'Bấm ô, nhập bù hoặc sửa — kể cả ô ngoài phân công, kể cả sau khi đợt hoàn tất.', 'Ghi <b>Lý do sửa (tuỳ chọn)</b>; lớp đã kết thúc thì bắt buộc. Xoá trắng ô = xoá điểm.', 'Gõ "-" khi em không làm bài; xoá "-" là hết vắng.'],
      xong: 'Ô hiện điểm mới; Lịch sử của lượt ghi người sửa và lý do.',
      sua: 'Sửa lại ô đó; huỷ điểm / khôi phục kết quả: nhờ Quản lý.',
      chan: 'Lưới không nhận dán nhiều ô từ Excel (phụ lục J).',
      loi: [['Gõ 6,5 ở ô L / R', 'Dùng dấu chấm: 6.5.']],
    },
    {
      ten: '5. Sửa thông tin học viên', ai: 'Admin chi nhánh', han: 'Khi có thay đổi', o: 'Hồ sơ em › <kbd>Sửa thông tin</kbd>',
      anh: { id: 'ad-sua-tt', cap: '' },
      buoc: ['Hồ sơ em › <kbd>Sửa thông tin</kbd>: họ tên, ngày sinh (dd/mm/yyyy), liên hệ.', 'Target, lộ trình: chỉ xem — Quản lý / TVV sửa.', 'Xem lại: <kbd>Lịch sử sửa</kbd>.'],
      xong: 'Thông báo "Đã lưu"; Lịch sử sửa có dòng mới.', sua: 'Mở lại Sửa thông tin.', chan: 'Không đổi Target, Tuần bắt đầu, lộ trình.', loi: [],
    },
  ],
  anhMan: {},
  bangHan: {
    cot: ['Việc', 'Hạn', 'Ai'],
    hang: [
      ['GV nhập điểm MT (bài của tuần thi)', 'Hết Thứ Tư tuần sau tuần thi', 'GV kỹ năng'],
      ['MT0', 'Hết Thứ Tư tuần sau', 'GV kỹ năng'],
      ['Speaking chấm chéo', 'Không tính quá hạn', 'GV Speaking'],
      ['Đề nghị dời lịch (vắng)', 'Quản lý trả lời; lần 2: hết Chủ nhật tuần gửi', 'Quản lý'],
    ],
  },
  quyen: bangQuyen([0, 2, 5]),
  hoi: [
    ['GV nghỉ, ai nhập bù điểm?', 'Admin chi nhánh (hoặc Quản lý): bấm ô trong lưới, nhập, ghi lý do.'],
    ['Tôi dời hạn chấm được không?', 'Không — chỉ Quản lý. Bạn dời lịch thi được.'],
    ['Dán điểm từ Excel được không?', 'Không. Gõ từng ô.'],
    ['Em vắng thì sao?', 'Gõ "-": trong tuần thi là vắng (lớp thường: môn tự dời sang tuần sau); nhập bù / MT cũ là Không dự thi. Xoá "-" là hết vắng.'],
  ],
  phuLuc: [xepLich('Admin chi nhánh, Quản lý'), luoiDiem(true)],
};
