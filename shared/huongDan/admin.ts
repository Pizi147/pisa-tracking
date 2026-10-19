/**
 * HD-b — Hướng dẫn ADMIN (Admin chi nhánh, lo Mock Test): Tổng quan "Mock Test", Test đủ ba tab, Công việc chỉ nhóm Chấm điểm. Không huỷ /
 * khôi phục lượt, không đổi Target / lộ trình, Case / Ý thức chỉ xem (seed/data.ts `office_admin`). Màn Test trùng GV lấy mục của GV.
 */
import { HD_GV } from './gv.ts';
import { MAN_HO_SO_TVV } from './tvv.ts';
import { luatGv } from './ql.ts';
import type { HuongDan, MucHd } from './kieu.ts';

const manGv = (id: string) => HD_GV.man.find((m) => m.id === id)!;
const mucGv = (man: string, id: string): MucHd => manGv(man).muc.find((m) => m.id === id)!;

export const HD_ADMIN: HuongDan = {
  viec: [
    {
      id: 'ad-sang', ten: 'Mở Tổng quan › Mock Test mỗi sáng', khi: 'mỗi ngày',
      buoc: ['Bốn ô: <b>Lượt MT tuần này</b> · <b>Ô điểm chưa nhập</b> · <b>Đề nghị dời chờ</b> · <b>MT chưa xếp lịch</b>; bấm ô mở đúng chỗ.',
        'Khối <b>GV chấm quá hạn</b>: ai còn nợ điểm.', '<b>Lịch sắp tới</b>: <b>Xem toàn bộ lịch ›</b> mở Kế hoạch Test.'],
      chi: { hd: 'tq-mock-test', duong: '/', chu: 'Bốn số Mock Test của chi nhánh — bấm để mở.' },
    },
    {
      id: 'ad-xep-lich', ten: 'Xếp / dời lịch MT', khi: 'mỗi tuần',
      buoc: ['<b>Test › Kế hoạch Test</b>: <b>Xếp nhiều MT…</b> cho nhiều lớp.',
        'Một kỹ năng: bấm chip kỹ năng ở dòng lớp; <b>⋯</b> có <b>Xếp lịch</b>, <b>Dời lịch thi</b>, <b>Trả lời đề nghị dời</b>.',
        '<b>Dời hạn chấm</b>, đổi tuần cả đợt: chỉ Quản lý.'],
      chi: { hd: 'kht-loc', duong: '/test/ke-hoach', chu: 'Lọc lớp và xếp nhiều MT ở hàng này.' },
    },
    {
      id: 'ad-cham', ten: 'Theo dõi chấm điểm', khi: 'sau mỗi tuần thi',
      buoc: ['<b>Test › Lịch Test / Chấm Test</b>: <b>Test quá hạn chấm</b> · <b>Test chấm tuần này</b> (hạn <b>Thứ Tư</b>).',
        '<b>Công việc</b>: chỉ nhóm Chấm điểm của chi nhánh; ô <b>▾</b> chọn một GV.', 'GV quá hạn tự nhận thông báo; việc tự hết khi GV nhập đủ điểm.'],
      chi: { hd: 'cv-loc-them', duong: '/cong-viec', chu: 'Lọc việc chấm theo một GV ở đây.' },
    },
    {
      id: 'ad-sua-diem', ten: 'Nhập bù / sửa điểm', khi: 'khi GV vắng · nhập nhầm',
      buoc: ['Mở lưới điểm (bấm dòng lớp ở Lịch Test, hoặc <b>Điểm theo lớp</b>).',
        'Nhập bù hoặc sửa ô ngoài phân công; ghi <b>Lý do sửa</b> (tuỳ chọn).', 'Nhật ký ghi lại người sửa.'],
      chi: { hd: 'nav-test', chu: 'Bấm <b>Test</b>, rồi bấm dòng lớp để mở lưới điểm.' },
    },
    {
      id: 'ad-sua-tt', ten: 'Sửa thông tin học viên', khi: 'khi có thay đổi',
      buoc: ['Hồ sơ em › <b>Sửa thông tin</b>: họ tên, ngày sinh, liên hệ.', 'Target, lộ trình: chỉ xem — Quản lý / TVV sửa.'],
    },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Tổng quan', duong: ['/'],
      muc: [
        { id: 'ad-tq-o', ten: 'Số liệu Mock Test', buoc: ['<b>Lượt MT tuần này</b> · <b>Ô điểm chưa nhập</b> · <b>Đề nghị dời chờ</b> · <b>MT chưa xếp lịch</b>.', 'Bấm ô mở Kế hoạch Test / Lịch Test đúng chỗ.'],
          chi: { hd: 'tq-mock-test', duong: '/', chu: 'Bốn số Mock Test của chi nhánh.' } },
        { id: 'ad-tq-gv', ten: 'GV chấm quá hạn', buoc: ['Giáo viên còn bài quá hạn chấm; chỉ xem.'] },
      ],
    },
    {
      id: 'phan-tich', ten: 'Phân tích', duong: ['/phan-tich'],
      muc: [{ id: 'ad-pt', ten: 'Góc phân tích', buoc: ['<b>Tổng hợp Test + SOS</b> · <b>Tổng hợp vấn đề HV</b> · <b>Hiệu quả PA</b> · <b>Ý thức</b> · <b>Giáo viên</b>.', 'Bấm số xem danh sách.'],
        chi: { hd: 'pt-goc', duong: '/phan-tich', chu: 'Chọn góc phân tích ở hàng này.' } }],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: ['/hoc-vien'],
      muc: [mucGv('hoc-vien', 'hv-tim'),
        { id: 'ad-hvl-goc', ten: 'Góc nhìn', buoc: ['<b>Tất cả</b> · <b>Cần làm</b>; phạm vi chi nhánh của bạn.', 'Bấm dòng em mở panel một em.'],
          chi: { hd: 'hvl-goc', duong: '/hoc-vien', chu: 'Góc nhìn ở hàng này.' } }],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      muc: [{ id: 'ad-lop-xem', ten: 'Xem lớp', buoc: ['Tab <b>Học viên</b>: Cách xem <b>Tổng hợp</b>, <b>Thông tin lớp</b>.', 'Cuối trang: <b>Điểm Mock Test của lớp</b>.'] }],
    },
    {
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      muc: [{ id: 'ad-hv', ten: 'Hồ sơ em', buoc: ['<b>Sửa thông tin</b> (Target chỉ xem) · <b>Lịch sử sửa</b>.', 'Ba tab <b>Học thuật</b> · <b>Ý thức & Phối hợp</b> · <b>Hành trình</b>: chỉ xem.'] }],
    },
    /* Khối "Test chấm tuần này" chỉ có khi tuần có Test — chi nhánh nhỏ thường trống, nên mục này không "Chỉ cho tôi". */
    { ...manGv('lich-test'), muc: manGv('lich-test').muc.map(({ chi: _, ...m }) => m) },
    manGv('diem-lop'),
    {
      id: 'ke-hoach', ten: 'Kế hoạch Test', duong: ['/test/ke-hoach'],
      muc: [
        { id: 'ad-kh-xep', ten: 'Xếp lịch nhiều lớp', buoc: ['<b>Xếp nhiều MT…</b> (FT) · <b>Xếp lịch Test…</b> (lớp thường).', 'Chip <b>Cần xếp lại</b>: em vắng cần xếp lại.'],
          chi: { hd: 'kht-loc', duong: '/test/ke-hoach', chu: 'Lọc lớp và xếp nhiều MT ở hàng này.' } },
        { id: 'ad-kh-ky-nang', ten: 'Một kỹ năng', buoc: ['Bấm chip kỹ năng: chọn tuần, <b>Lưu</b>.', '<b>⋯</b>: <b>Xếp lịch</b> · <b>Dời lịch thi</b> · <b>Sửa điểm</b> · <b>Trả lời đề nghị dời</b>; mục ghi "Chỉ Quản lý" thì nhờ QL.'] },
      ],
    },
    manGv('nhap-diem'),
    {
      id: 'cong-viec', ten: 'Công việc', duong: ['/cong-viec'],
      muc: [{ id: 'ad-cv', ten: 'Việc chấm điểm', buoc: ['Chỉ nhóm Chấm điểm của chi nhánh: bài GV chưa nhập.', 'Chip <b>⚠ quá hạn</b>; ô <b>▾</b> chọn một GV.'],
        chi: { hd: 'cv-loc-them', duong: '/cong-viec', chu: 'Lọc theo một GV ở đây.' } }],
    },
    ...MAN_HO_SO_TVV.filter((m) => m.id === 'ho-so-ca-nhan' || m.id === 'huong-dan'),
  ],
  luat: [
    ...luatGv('han-cham', 'dau-gach'),
    { id: 'ad-luat-quyen', ten: 'Admin làm / không làm', buoc: ['Làm: xếp / dời lịch thi, nhập bù / sửa điểm, sửa thông tin HV.', 'Chỉ Quản lý: dời hạn chấm, huỷ / khôi phục lượt, Target, lộ trình.', 'Case, Ý thức, Phối hợp: chỉ xem.'] },
  ],
  tu: HD_GV.tu.filter((x) => ['MT (bài thi thử)', 'Lớp thường (không phải FT)', 'Kỳ vọng', 'SOS 1 · 2 · 3', 'GVCN · GVBM', 'Speaking chấm chéo', 'KCK', 'Mã tuần', 'QL (Quản lý)'].includes(x.ten)),
};
