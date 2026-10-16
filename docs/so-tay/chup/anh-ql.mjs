// Ảnh sổ Quản lý (VI). Tài khoản demo 2 = Nguyễn Khánh Vy (QL Monbay). CHỈ ĐỌC: mở panel, gõ / dán thử, KHÔNG bấm Lưu.
const HD = (h) => (p) => p.locator(`[data-hd="${h}"]`);
const NUT = (p, c, vi, exact = true) => p.getByRole('button', { name: c(vi), exact });
const PANEL = (p) => p.locator('[role="dialog"]:visible').last();

/** Bảng mẫu dán vào Thêm học viên (cùng nội dung bảng mẫu trong sổ): dòng 2 trùng hồ sơ có sẵn, dòng 3 ngày không có thật, dòng 4 band sai bước. */
export const MAU_DAN_FT = [
  ['Họ và tên', 'Ngày sinh', 'Email', 'Overall', 'L', 'R', 'W', 'S', 'Target', 'Dự kiến thi', 'Đã thi tới MT', 'Tuần bắt đầu'],
  ['Hoàng Minh Tú', '05/03/2010', 'tu.hoang@gmail.com', '5.5', '6', '5.5', '5', '5.5', '6.5', '06/2027', '', ''],
  ['Nguyễn Minh An', '11/04/2008', '', '', '', '', '', '', '6.5 KCK', '', '', ''],
  ['Đặng Thu Phương', '31/02/2010', 'phuong.dang@gmail', '5', '', '', '', '', '6,5', '15/05/2027', '', ''],
  ['Lê Gia Bảo', '20/11/2009', '', '5.3', '', '', '', '', '', '', '2', ''],
].map((d) => d.join('\t')).join('\n');

const moThemHv = async (p, c) => {
  await NUT(p, c, '+ Học viên').click();
  await PANEL(p).locator('select').first().selectOption({ label: 'MB FT 101 · Fast Track' }).catch(async () => {
    const o = await PANEL(p).locator('select').first().locator('option', { hasText: 'MB FT 101' }).first().getAttribute('value');
    await PANEL(p).locator('select').first().selectOption(o);
  });
};

/** Lớp thường, dán KHÔNG dòng tiêu đề: web đọc theo mẫu Excel chung (thứ tự cột FT), bỏ cột band. */
export const MAU_DAN_THUONG = [
  ['Phan Bảo Châu', '12/08/2012', 'chau.phan@gmail.com', '', '', '', '', '', '', '', '', ''],
  ['Trịnh Khánh Duy', '3/1/2012', '', '', '', '', '', '', '6.0', '12/2027', '', ''],
  ['Mai Anh Thư', '2012-07-15', '', '', '', '', '', '', '', '', '', '01/09/2026'],
].map((d) => d.join('\t')).join('\n');

export const ANH_QL = [
  {
    id: 'ql-tong-quan', user: 2, url: '/', cao: 800,
    marks: [
      { n: 1, loc: (p) => p.getByRole('link', { name: /Mở hộp duyệt/ }).locator('..') },
      { n: 2, loc: HD('tq-can-xu-ly') },
      { n: 3, loc: (p, c) => p.getByRole('button', { name: c('Xem'), exact: true }).first(), phai: true },
    ],
  },
  {
    id: 'ql-so-lieu', user: 2, url: '/', toiDa: 3000,
    buoc: async (p, c) => { await p.getByText(c('Số liệu'), { exact: true }).first().scrollIntoViewIfNeeded(); },
    vung: (p, c) => p.getByText(c('Số liệu'), { exact: true }).first().locator('xpath=ancestor::section[1]'), marks: [],
  },
  {
    id: 'ql-cho-duyet', user: 2, url: '/cong-viec/cho-duyet', cao: 900,
    buoc: async (p) => { await p.locator('article input[type="checkbox"]').first().check(); },
    marks: [
      { n: 1, loc: (p, c) => p.getByRole('group', { name: c('Trạng thái') }) },
      { n: 2, loc: (p, c) => p.getByRole('group', { name: c('Loại yêu cầu') }) },
      { n: 3, loc: (p) => p.locator('article').first().getByRole('button').filter({ hasText: /Duyệt|Từ chối/ }).first().locator('..') },
      { n: 4, loc: (p) => p.locator('article input[type="checkbox"]').first() },
    ],
  },
  {
    id: 'ql-y-thuc', user: 2, url: '/cong-viec/cho-duyet', cao: 640,
    buoc: async (p, c) => { await p.getByRole('group', { name: c('Loại yêu cầu') }).getByRole('button', { name: /^Ý thức/ }).click(); },
    marks: [
      { n: 1, loc: (p, c) => p.getByRole('group', { name: c('Loại yêu cầu') }).getByRole('button', { name: /Ý thức/ }) },
      { n: 2, loc: (p) => p.locator('article').first() },
    ],
  },
  {
    id: 'ql-duyet-nhieu', user: 2, url: '/cong-viec/cho-duyet', toiDa: 1800,
    buoc: async (p) => { for (const x of await p.locator('article input[type="checkbox"]').all()) await x.check().catch(() => {}); },
    vung: (p) => p.locator('div.sticky, div[class*="sticky"]').filter({ hasText: /Duyệt \d/ }).last(), le: 24,
    marks: [{ n: 1, loc: (p) => p.getByRole('button', { name: /^Duyệt \d+ yêu cầu/ }), phai: true }],
  },
  {
    id: 'ql-ke-hoach', user: 2, url: '/test/ke-hoach', cao: 900,
    buoc: async (p, c) => { await p.getByRole('button', { name: c('Mở lớp MB FT 101') }).click(); },
    marks: [
      { n: 1, loc: (p, c) => p.getByRole('group', { name: c('Khung lớp') }) },
      { n: 2, loc: (p) => p.getByRole('button', { name: /^Cần xếp lại/ }) },
      { n: 3, loc: (p, c) => NUT(p, c, 'Xếp nhiều MT…'), phai: true },
    ],
  },
  {
    id: 'ql-xep-nhieu-mt', panel: true, user: 2, url: '/test/ke-hoach',
    buoc: async (p, c) => { await NUT(p, c, 'Xếp nhiều MT…').click(); },
    marks: [],
  },
  {
    id: 'ql-xep-lich-thuong', panel: true, user: 2, url: '/test/ke-hoach',
    buoc: async (p, c) => { await p.getByRole('button', { name: /^Lớp thường/ }).first().click(); await NUT(p, c, 'Xếp lịch Test…').click(); },
    marks: [],
  },
  {
    id: 'ql-hoc-vien', user: 2, url: '/hoc-vien', cao: 760,
    marks: [
      { n: 1, loc: (p, c) => NUT(p, c, '+ Lớp mới') },
      { n: 2, loc: (p, c) => NUT(p, c, '+ Học viên'), phai: true },
      { n: 3, loc: HD('hvl-goc') },
      { n: 4, loc: (p, c) => p.getByRole('button', { name: c('Thao tác trang') }), phai: true },
    ],
  },
  {
    id: 'ql-them-hv', user: 2, url: '/hoc-vien',
    buoc: async (p, c) => {
      await moThemHv(p, c);
      await PANEL(p).locator('textarea').first().fill(MAU_DAN_FT);
      await NUT(p, c, 'Đọc nội dung đã dán').click();
      await p.waitForTimeout(1500);
      await PANEL(p).getByRole('button', { name: /lỗi/ }).first().click().catch(() => {});
    },
    marks: [
      { n: 1, loc: (p) => PANEL(p).locator('select').first() },
      { n: 2, loc: (p) => PANEL(p).locator('textarea').first() },
      { n: 3, loc: (p) => PANEL(p).getByRole('status').first() },
      { n: 4, loc: (p) => PANEL(p).locator('[aria-invalid="true"]').first() },
      { n: 5, loc: (p) => PANEL(p).getByRole('button', { name: /lỗi/ }).first(), phai: true },
      { n: 6, loc: (p) => PANEL(p).getByRole('button', { name: /^Thêm \d+ học viên|^Thêm học viên$/ }), phai: true },
    ],
  },
  {
    id: 'ql-them-hv-trung', user: 2, url: '/hoc-vien', cao: 900,
    buoc: async (p, c) => {
      await moThemHv(p, c);
      await PANEL(p).locator('textarea').first().fill(MAU_DAN_FT);
      await NUT(p, c, 'Đọc nội dung đã dán').click();
      await p.waitForTimeout(1500);
      await PANEL(p).locator('tbody tr', { hasText: '' }).nth(1).getByRole('button', { name: /lưu ý/ }).click();
    },
    panel: true,
    marks: [{ n: 1, loc: (p) => PANEL(p).locator('td[colspan]').first() }],
  },
  {
    id: 'ql-them-hv-thuong', user: 2, url: '/hoc-vien', panel: true,
    buoc: async (p, c) => {
      await NUT(p, c, '+ Học viên').click();
      const s = PANEL(p).locator('select').first();
      await s.selectOption(await s.locator('option', { hasText: 'MB BE 03' }).first().getAttribute('value'));
      await PANEL(p).locator('textarea').first().fill(MAU_DAN_THUONG);
      await NUT(p, c, 'Đọc nội dung đã dán').click();
      await p.waitForTimeout(1500);
    },
    marks: [
      { n: 1, loc: (p) => PANEL(p).getByRole('status').first() },
      { n: 2, loc: (p) => PANEL(p).getByRole('button', { name: /Dòng đầu là tiêu đề/ }), phai: true },
    ],
  },
  {
    id: 'ql-tao-lop', panel: true, user: 2, url: '/hoc-vien',
    buoc: async (p, c) => { await NUT(p, c, '+ Lớp mới').click(); await PANEL(p).getByRole('button', { name: c('Nhiều lớp') }).click().catch(() => {}); },
    marks: [],
  },
  {
    id: 'ql-ho-so-lop', user: 2, url: '/hoc-vien/lop/3',
    buoc: async (p, c) => { await p.getByRole('button', { name: c('Thao tác khác') }).first().click(); },
    marks: [],
  },
  {
    id: 'ql-sua-ca-lop', panel: true, user: 2, url: '/hoc-vien/lop/3',
    buoc: async (p, c) => { await NUT(p, c, 'Sửa thông tin').click(); },
    marks: [],
  },
  {
    id: 'ql-chon-nhieu', panel: true, user: 2, url: '/hoc-vien/lop/3', toiDa: 1600,
    buoc: async (p, c) => {
      await NUT(p, c, 'Chọn nhiều học viên').click();
      const o = p.locator('tbody input[type="checkbox"]');
      await o.nth(0).check(); await o.nth(1).check();
      await NUT(p, c, 'Kết thúc học').click();
    },
    marks: [],
  },
  {
    id: 'ql-chuyen-lop', panel: true, user: 2, url: '/hoc-vien/1',
    buoc: async (p, c) => {
      await p.getByRole('button', { name: '⋯' }).first().click();
      await p.getByRole('menuitem', { name: c('Chuyển lớp…') }).click();
    },
    marks: [],
  },
  {
    id: 'ql-lo-trinh-tiep', user: 2, url: '/hoc-vien/lop/7', cao: 900,
    buoc: async (p, c) => { await p.getByRole('group', { name: c('Cách xem') }).getByRole('button', { name: new RegExp(c('Lộ trình tiếp theo')) }).click(); },
    marks: [],
  },
  { id: 'ql-luu-tru', user: 2, url: '/hoc-vien/luu-tru', cao: 760, marks: [] },
  {
    id: 'ql-phan-tich', user: 2, url: '/phan-tich', cao: 900,
    marks: [{ n: 1, loc: HD('pt-goc') }],
  },
  {
    id: 'ql-van-hanh', user: 2, url: '/cong-viec/van-hanh', cao: 760,
    marks: [{ n: 1, loc: HD('vh-so') }],
  },
  { id: 'ql-bao-cao', user: 2, url: '/cong-viec/bao-cao', cao: 760, marks: [] },
  {
    id: 'ql-cong-viec-gv', user: 2, url: '/cong-viec', cao: 760,
    buoc: async (p, c) => { await p.getByRole('tab', { name: c('Hỗ trợ học viên') }).click(); await NUT(p, c, 'Lọc thêm').click(); },
    marks: [{ n: 1, loc: HD('cv-loc-them') }],
  },
  { id: 'ql-tong-quan-375', user: 2, url: '/', w: 375, cao: 812, marks: [] },
];
