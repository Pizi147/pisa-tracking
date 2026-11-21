/**
 * Hướng dẫn Chuyên viên Xếp lịch (BPXL) — BPXL-1, N57 (chủ SP 20/11). Xếp / dời lịch MT ở Kế hoạch Test + lịch lớp thường; chỉ xem Lịch Test tuần, Học viên & Lớp,
 * Lịch thi thật; Xoá / Khôi phục lượt MT khi chưa có điểm (N63); không điểm, thông tin HV, Case, Ý thức, Phân tích (seed/data.ts `scheduler`, `permissions.ts`). Trang đầu = Kế hoạch Test (`nav.ts`
 * `trangDauTest`). Việc: Xếp lịch họp (N58) + việc được giao. Mẫu: `cx.ts`, `admin.ts`; mục chung của màn GV lấy qua `mucGv`.
 */
import { mucGv } from './tvv.ts';
import type { HuongDan } from './kieu.ts';

const CV = '/cong-viec';
const HV = '/hoc-vien';
const TEST = '/test/lich';
const KH = '/test/ke-hoach';
const KHONG = [{ ten: 'Nhập, sửa điểm', cua: 'việc của GV' }, { ten: 'Chuyển lớp, xoá MT đã có điểm', cua: 'việc của Head' }] as const;

export const HD_BPXL: HuongDan = {
  viec: [],
  lam: [
    {
      id: 'xep-lich', ten: 'Xếp, dời lịch MT', nhom: 'lich',
      loiChinh: { man: 'ke-hoach', chu: 'Test › Kế hoạch Test', duong: KH },
      buoc: ['Mở <b>Test › Kế hoạch Test</b>: <b>Xếp nhiều MT…</b> (FT) · <b>Xếp lịch Test…</b> (lớp thường).',
        'Một kỹ năng: bấm ô MT, chọn tuần ở <b>Dời</b>, rồi <b>Lưu</b>.', 'Thứ Sáu tới Chủ nhật máy hỏi trước khi đổi: bấm <b>Vẫn đổi lịch</b>.'],
      tuKhac: ['dời lịch', 'xếp lịch', 'lịch mt', 'mock test', 'schedule', 'reschedule'],
    },
    {
      id: 'xoa-mt', ten: 'Xoá, khôi phục lượt MT chưa có điểm', nhom: 'lich',
      loiChinh: { man: 'ke-hoach', chu: 'Test › Kế hoạch Test › hộp MT', duong: KH },
      buoc: ['Mở hộp MT của lớp, bấm <b>Xoá</b> ở lượt hoặc từng môn chưa có điểm.', 'Nhầm: <b>Khôi phục</b>. Đã có điểm thì không xoá được.'],
      tuKhac: ['xoá mt', 'khôi phục', 'huỷ lượt', 'delete', 'restore'],
    },
    {
      id: 'xep-lich-hop', ten: 'Xếp lịch họp Meeting CX/GĐCN', nhom: 'lich', tab: 'bao-ph',
      loiChinh: { man: 'cong-viec', chu: 'Công việc › Báo PH', duong: CV },
      khiCo: 'GVCN xác nhận Meeting CX/GĐCN của em sau lượt Mock có SOS.',
      buoc: ['Mở <b>Công việc › Báo PH</b>, bấm <b>Hoàn thành</b> ở dòng <b>Xếp lịch họp</b>.', 'Ghi ngày giờ họp nếu muốn; Kết quả meeting do CX, Báo PH do TVV.'],
      xong: 'Phần Xếp lịch họp Hoàn thành; Kết quả meeting (CX) và Báo PH (TVV) không chờ.',
      sai: 'Bấm <b>Hoàn tác</b> hoặc sửa rồi lưu lại.',
      tuKhac: ['họp', 'meeting', 'xếp lịch họp', 'cx', 'gđcn'],
    },
    {
      id: 'sua-lich-lop', ten: 'Sửa lịch lớp thường', nhom: 'hv',
      loiChinh: { man: 'ho-so-lop', chu: 'Hồ sơ lớp › ⋯ › Thông tin lớp' },
      buoc: ['Mở hồ sơ lớp thường, bấm <b>⋯ › Thông tin lớp</b>.', 'Đổi tuần khai giảng, tuần Progress, tuần Final; lớp Fast Track nhờ Head.'],
      tuKhac: ['lịch lớp', 'tuần final', 'tuần progress', 'khai giảng', 'class schedule'],
    },
    {
      id: 'xem-lich-test', ten: 'Xem Test tuần này', nhom: 'lich',
      loiChinh: { man: 'lich-test', chu: 'Test › Lịch Test tuần', duong: TEST },
      buoc: ['Chọn tuần ở <b>‹ W3 SEP ›</b> hoặc <b>Tuần này</b>.', 'Bấm dòng lớp xem lưới điểm (chỉ xem).'],
      tuKhac: ['lịch test', 'tuần này', 'schedule'],
    },
    {
      id: 'xem-hv', ten: 'Xem học viên, lớp, lịch thi', nhom: 'hv',
      loiChinh: { man: 'hoc-vien', chu: 'Học viên & Lớp', duong: HV },
      buoc: ['Mở <b>Học viên & Lớp</b>: ô <b>Xem</b> theo chi nhánh của bạn; tab <b>Lịch thi</b> xem lịch thi thật.', 'Bấm tên em hoặc lớp mở hồ sơ (chỉ xem).'],
      tuKhac: ['học viên', 'lớp', 'lịch thi', 'thi thật', 'student'],
    },
  ],
  tuan: [
    { nhip: 'Hằng ngày', viec: ['xep-lich', 'xem-lich-test'] },
    { nhip: 'Khi có', viec: ['xep-lich-hop', 'xoa-mt', 'sua-lich-lop', 'xem-hv'] },
  ],
  vaiKhac: [
    { ten: 'Nhập, sửa điểm', cua: 'việc của GV', tuKhac: ['điểm', 'score'] },
    { ten: 'Chuyển lớp, xoá MT đã có điểm, sửa thông tin HV', cua: 'việc của Head', tuKhac: ['huỷ', 'chuyển lớp', 'sửa thông tin'] },
    { ten: 'Case, Ý thức', cua: 'việc của GV', tuKhac: ['case', 'ý thức', 'vi phạm'] },
  ],
  man: [
    {
      id: 'tong-quan', ten: 'Trang đầu', duong: ['/'],
      dangO: { cau: 'Trang đầu mở thẳng Kế hoạch Test.', sau: { chu: 'Kế hoạch Test', duong: KH } },
      muc: [{ id: 'xl-tq', ten: 'Trang đầu', buoc: ['Đăng nhập: trang đầu mở thẳng <b>Kế hoạch Test</b>.'] }],
    },
    {
      id: 'ke-hoach', ten: 'Kế hoạch Test', duong: [KH],
      dangO: { cau: 'Trang đầu của bạn: xếp, dời lịch MT, Progress, Final các lớp.', sau: { chu: 'Lịch Test tuần', duong: TEST } },
      khongLam: [...KHONG],
      muc: [],
    },
    {
      id: 'lich-test', ten: 'Lịch Test tuần', duong: ['/test', TEST],
      dangO: { cau: 'Test của một tuần trong phạm vi của bạn (chỉ xem).', truoc: { chu: 'Kế hoạch Test', duong: KH } },
      khongLam: [KHONG[0]],
      muc: [],
    },
    {
      id: 'diem-lop', ten: 'Điểm theo lớp (link cũ)', duong: ['/test/diem-lop'],
      dangO: { cau: 'Link cũ: mở Lịch Test tuần của một lớp (chỉ xem).', truoc: { chu: 'Lịch Test tuần', duong: TEST } },
      muc: [{ id: 'xl-dl', ten: 'Xem điểm một lớp', buoc: ['Chọn lượt và môn để xem; điểm do GV nhập.'] }],
    },
    {
      id: 'nhap-diem', ten: 'Hồ sơ lượt Test', duong: ['/nhap-diem', '/bang-diem-thuong', '/mock-test', '/luot-test'],
      dangO: { cau: 'Điểm một lượt Test (chỉ xem).', truoc: { chu: 'Lịch Test tuần', duong: TEST } },
      muc: [{ id: 'xl-nd', ten: 'Xem lượt Test', buoc: ['Xem điểm, lịch từng kỹ năng; dời lịch ở Kế hoạch Test.'] }],
    },
    {
      id: 'hoc-vien', ten: 'Học viên & Lớp', duong: [HV],
      dangO: { cau: 'Học viên, lớp và lịch thi trong phạm vi của bạn (chỉ xem).', sau: { chu: 'Kế hoạch Test', duong: KH } },
      khongLam: [KHONG[1]],
      muc: [],
    },
    {
      id: 'ho-so-lop', ten: 'Hồ sơ lớp', duong: ['/hoc-vien/lop'],
      dangO: { cau: 'Một lớp: học viên, lịch, điểm (chỉ xem; lớp thường sửa được lịch).', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      muc: [],
    },
    {
      id: 'ho-so-hv', ten: 'Hồ sơ học viên', duong: ['/hoc-vien/'],
      dangO: { cau: 'Một em: học thuật, lộ trình, lịch thi (chỉ xem).', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      muc: [{ id: 'xl-hv', ten: 'Xem hồ sơ em', buoc: ['Các tab chỉ xem (không có Ý thức, Case); dời lịch MT của em ở Kế hoạch Test.'] }],
    },
    {
      id: 'luu-tru', ten: 'Lưu trữ', duong: ['/hoc-vien/luu-tru'],
      dangO: { cau: 'Lớp đã kết thúc, học viên đã lưu trữ (chỉ xem).', truoc: { chu: 'Học viên & Lớp', duong: HV } },
      muc: [{ id: 'xl-luu-tru', ten: 'Xem Lưu trữ', buoc: ['Bấm tên em hoặc lớp mở hồ sơ.'] }],
    },
    {
      id: 'cong-viec', ten: 'Công việc', duong: [CV],
      dangO: { cau: 'Xếp lịch họp và việc được giao cho bạn.', truoc: { chu: 'Kế hoạch Test', duong: KH } },
      muc: [{ id: 'xl-cv', ten: 'Danh sách việc', buoc: ['Khi GVCN xác nhận Meeting CX/GĐCN: <b>Báo PH</b> › <b>Xếp lịch họp</b>, bấm <b>Hoàn thành</b> (ghi ngày giờ họp nếu muốn).', 'Lịch MT xếp ở Kế hoạch Test, không qua danh sách này.'] }],
    },
    {
      id: 'ho-so-ca-nhan', ten: 'Hồ sơ cá nhân', duong: ['/ho-so-ca-nhan'],
      dangO: { cau: 'Thông tin và mật khẩu của bạn.', truoc: { chu: 'Kế hoạch Test', duong: KH } },
      muc: [mucGv('ho-so-ca-nhan', 'hs-sua')],
    },
    {
      id: 'huong-dan', ten: 'Hướng dẫn', duong: ['/huong-dan'],
      dangO: { cau: 'Mọi việc của bạn trên một trang, in được.' },
      muc: [mucGv('huong-dan', 'hd-dung')],
    },
  ],
  luat: [
    { id: 'xl-luat-quyen', ten: 'BPXL làm / không làm', buoc: ['Làm: xếp / dời lịch MT, + MT, S Ex; sửa tuần khai giảng, Progress, Final lớp thường.', 'Chỉ xem: Lịch Test tuần, Học viên & Lớp, Lịch thi thật.', 'Xoá / Khôi phục lượt MT và kỹ năng: được khi chưa có điểm; đã có điểm thì không.', 'Không: điểm, thông tin HV, Case, Ý thức, Phân tích.'] },
  ],
  tu: [],
};
