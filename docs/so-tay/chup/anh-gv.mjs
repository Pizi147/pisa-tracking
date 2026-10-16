// Ảnh sổ Giáo viên (VI) + Giáo viên nước ngoài (EN, `en: true`). Tài khoản demo 7 = Trần Ngọc Hà (GVCN MB FT 101, dạy L R).
// Chọn phần tử theo vai trò / aria-label / data-hd / tên học viên (không đổi theo tiếng); chữ nút viết tiếng Việt, ảnh EN dịch qua `c()`.
/** Mở lớp MB FT 101 trong khối Test chấm tuần này — app nhớ trạng thái mở, nên chỉ bấm khi đang đóng. */
const moLopFt101 = async (p) => {
  const k = p.locator('[data-hd="lich-test-tuan"]');
  if (!(await k.getByRole('button', { name: /^(Thu gọn|Collapse)( lớp| class)? MB FT 101$/ }).count())) await k.getByRole('button', { name: /^(Mở|Expand)( lớp| class)? MB FT 101$/ }).first().click();
};
const HD = (h) => (p) => p.locator(`[data-hd="${h}"]`);
const DONG = (p, ten) => p.locator('[data-hd="cv-dong"]', { hasText: ten });
const NUT = (p, c, vi) => p.getByRole('button', { name: c(vi), exact: true });
const DLG = (p) => p.locator('[role="dialog"]').last();

export const ANH_GV = [
  {
    id: 'gv-khung', en: true, user: 7, url: '/', vung: (p) => p.locator('header').first(), le: 6, cao: 120,
    marks: [
      { n: 1, loc: (p) => p.locator('nav[aria-label]').first() },
      { n: 2, loc: HD('tim-hv') },
      { n: 3, loc: HD('nut-hd') },
      { n: 4, loc: (p) => p.locator('button[aria-label^="' + 'Thông báo'.replace(/./, (x) => x) + '"], button[aria-label^="Notifications"]').first() },
      { n: 5, loc: (p) => p.locator('[role="group"]').filter({ hasText: 'VI' }).first() },
      { n: 6, loc: (p) => p.locator('header button').last() },
    ],
  },
  {
    id: 'gv-tong-quan', en: true, user: 7, url: '/', cao: 900,
    marks: [
      { n: 1, loc: HD('tq-viec-cua-toi') },
      { n: 2, loc: (p) => DONG(p, 'Lý Minh Châu').or(p.locator('li', { hasText: 'Lý Minh Châu' })).first().getByRole('button').last() },
      { n: 3, loc: (p, c) => p.getByText(c('Yêu cầu của tôi'), { exact: true }).first().locator('..') },
    ],
  },
  {
    id: 'gv-tong-quan-375', en: true, user: 7, url: '/', w: 375, cao: 812,
    marks: [{ n: 1, loc: HD('tq-hom-nay') }, { n: 2, loc: (p) => p.locator('nav').last() }],
  },
  {
    id: 'gv-cong-viec', en: true, user: 7, url: '/cong-viec', w: 1100, cao: 600,
    buoc: async (p, c) => { await NUT(p, c, 'Lọc thêm').click(); },
    marks: [
      { n: 1, loc: (p, c) => p.getByRole('group', { name: c('Hạn') }) },
      { n: 2, loc: HD('cv-loc-them') },
      { n: 3, loc: (p, c) => p.getByRole('group', { name: c('Nhóm việc') }) },
      { n: 4, loc: (p) => p.locator('[data-hd="cv-dong"]').first() },
    ],
  },
  {
    id: 'gv-cong-viec-panel', en: true, user: 7, url: '/cong-viec', cao: 760,
    buoc: async (p) => { await p.locator('[data-hd="cv-dong"] button').first().click(); },
    marks: [
      { n: 1, loc: (p) => p.locator('[data-hd="cv-dong"]').first() },
      { n: 2, loc: (p) => p.locator('aside, [role="complementary"], section').filter({ has: p.locator('table') }).last().locator('h2, h3').first() },
      { n: 3, loc: (p, c) => p.getByRole('button', { name: c('Nhập') }).first() },
    ],
  },
  {
    id: 'gv-lich-test', en: true, user: 7, url: '/test', w: 1200, cao: 720,
    buoc: async (p, c) => { await p.getByRole('button', { name: /Mở Test quá hạn chấm|Expand Overdue marking/ }).click(); },
    marks: [
      { n: 1, loc: (p, c) => p.getByRole('group', { name: c('Tiến độ chấm điểm') }) },
      { n: 2, loc: (p, c) => p.getByRole('button', { name: /Thu gọn Test quá hạn chấm|Collapse Overdue marking/ }).locator('..') },
      { n: 3, loc: HD('lich-test-tuan') },
      { n: 4, loc: (p, c) => p.getByRole('button', { name: c('Nhập điểm'), exact: true }).first() },
    ],
  },
  {
    id: 'gv-luoi-ft', en: true, user: 7, url: '/test', toiDa: 1800,
    buoc: async (p) => {
      await moLopFt101(p);
      await p.locator('[data-hd="lich-test-tuan"] table').last().scrollIntoViewIfNeeded();
    },
    vung: (p) => p.locator('[data-hd="lich-test-tuan"]'),
    marks: [
      { n: 1, loc: (p) => p.locator('[data-hd="lich-test-tuan"] th').filter({ hasText: /^L/ }).last() },
      { n: 2, loc: (p) => p.locator('button[aria-label*="Lý Minh Châu"]').first() },
      { n: 3, loc: (p) => p.locator('button[aria-label*="Speaking · Lý Minh Châu"]').first() },
      { n: 4, loc: (p) => p.locator('[data-hd="lich-test-tuan"] tr', { hasText: 'Lý Minh Châu' }).locator('td').last() },
    ],
  },
  {
    id: 'gv-o-diem', en: true, user: 7, url: '/test', toiDa: 1800,
    buoc: async (p) => {
      await moLopFt101(p);
      await p.locator('button[aria-label*="Listening · Lương Bảo Anh"]:visible').first().click();
    },
    vung: (p) => p.locator('[role="dialog"]:visible').last(), le: 40,
    marks: [
      { n: 1, loc: (p) => p.locator('[role="dialog"]:visible input').first() },
      { n: 2, loc: (p) => p.locator('[role="dialog"]:visible textarea').first() },
      { n: 3, loc: (p, c) => p.getByRole('button', { name: c('Lưu · em tiếp ›') }), phai: true },
    ],
  },
  {
    id: 'gv-diem-lop', en: true, user: 7, url: '/test/diem-lop', cao: 900,
    marks: [
      { n: 1, loc: (p) => p.locator('select, [role="combobox"]').first() },
      { n: 2, loc: (p, c) => p.getByRole('button', { name: c('Chỉ ô còn trống') }).or(p.getByText(c('Chỉ ô còn trống'))).first() },
    ],
  },
  {
    id: 'gv-nhap-375', en: true, user: 9, url: '/cong-viec', w: 375, cao: 812,
    buoc: async (p) => { await p.locator('[data-hd="cv-dong"] button').first().click(); },
    marks: [],
  },
  {
    id: 'gv-hoc-vien', en: true, user: 7, url: '/hoc-vien', cao: 820,
    marks: [
      { n: 1, loc: HD('hvl-goc') },
      { n: 2, loc: (p) => p.locator('tbody tr').first() },
    ],
  },
  {
    id: 'gv-ho-so-lop', en: true, user: 7, url: '/hoc-vien/lop/3', cao: 760,
    marks: [
      { n: 1, loc: (p, c) => p.getByRole('tablist', { name: c('Hồ sơ lớp') }) },
      { n: 2, loc: (p, c) => p.getByRole('group', { name: c('Cách xem') }) },
      { n: 3, loc: (p, c) => p.getByRole('button', { name: c('Thao tác khác') }).nth(1) },
      { n: 4, loc: (p, c) => p.getByRole('link', { name: c('Nhập điểm'), exact: true }) },
    ],
  },
  {
    id: 'gv-gop-y', en: true, user: 7, url: '/hoc-vien/lop/3', w: 1100, cao: 560,
    buoc: async (p, c) => { await p.getByRole('group', { name: c('Cách xem') }).getByRole('button', { name: c('Góp ý hàng tuần') }).click(); },
    marks: [
      { n: 1, loc: (p, c) => p.getByRole('group', { name: c('Cách xem') }).getByRole('button', { name: new RegExp(c('Góp ý hàng tuần')) }) },
      { n: 2, loc: (p) => p.locator('span[role="group"]').filter({ hasText: /W\d [A-Z]{3}/ }).first() },
      { n: 3, loc: (p) => p.locator('tbody tr').first().locator('td').nth(1) },
    ],
  },
  {
    id: 'gv-ho-so-hv', en: true, user: 7, url: '/hoc-vien/1', cao: 1000,
    marks: [
      { n: 1, loc: (p) => p.locator('h1').first() },
      { n: 2, loc: (p) => p.getByRole('button', { name: '⋯' }).first() },
      { n: 3, loc: (p) => p.locator('section[aria-label]').first() },
      { n: 4, loc: (p, c) => p.getByRole('tablist', { name: c('Nội dung hồ sơ học viên') }) },
      { n: 5, loc: (p, c) => p.getByRole('button', { name: /^(Mở|Expand) Reading$/ }).locator('xpath=ancestor::tr[1]') },
    ],
  },
  {
    id: 'gv-case', en: true, user: 7, url: '/hoc-vien/1', toiDa: 1800,
    buoc: async (p, c) => { await p.getByRole('button', { name: /^(Mở|Expand) Reading$/ }).click(); },
    vung: (p) => p.getByRole('button', { name: /^(Thu gọn|Collapse) Reading$/ }).locator('xpath=ancestor::tbody[1]'),
    marks: [],
  },
  {
    id: 'gv-xac-nhan-pa', en: true, user: 7, url: '/cong-viec', giuKhung: true, vung: (p) => p.locator('main section.card[aria-label]').last(), le: 20,
    buoc: async (p) => { await DONG(p, 'Vũ Ngọc Lan').locator('button').first().click(); },
    marks: [
      { n: 1, loc: (p) => p.locator('textarea:visible').first() },
      { n: 2, loc: (p, c) => p.getByRole('button', { name: c('Xác nhận PA'), exact: true }).last() },
      { n: 3, loc: (p, c) => p.getByRole('button', { name: c('Đề xuất PA khác…') }).first(), phai: true },
    ],
  },
  {
    id: 'gv-ket-qua-pa', en: true, user: 7, url: '/cong-viec', toiDa: 2400, vung: (p) => DONG(p, 'Lý Minh Châu').locator('..'), le: 24,
    buoc: async (p) => { await DONG(p, 'Lý Minh Châu').locator('button').first().click(); },
    marks: [
      { n: 1, loc: (p) => DONG(p, 'Lý Minh Châu') },
      { n: 2, loc: (p, c) => p.getByText(c('Tiến triển (2 tuần)')).first() },
      { n: 3, loc: (p) => p.locator('button:visible').filter({ hasText: /^(Lưu|Save)$/ }).first(), phai: true },
    ],
  },
  {
    id: 'gv-vi-pham', panel: true, en: false, user: 7, url: '/hoc-vien/lop/3',
    buoc: async (p, c) => {
      await p.locator('tbody tr', { hasText: 'Nguyễn Minh An' }).getByRole('button', { name: c('Thao tác khác') }).click();
      await p.getByRole('menuitem', { name: new RegExp(c('Ghi vi phạm')) }).or(p.getByRole('button', { name: new RegExp(c('Ghi vi phạm')) })).first().click();
    },
    marks: [],
  },
  {
    id: 'gv-y-thuc', en: false, user: 7, url: '/hoc-vien/1', cao: 1000,
    buoc: async (p, c) => { await p.getByRole('tab', { name: c('Ý thức & Phối hợp') }).click(); },
    marks: [{ n: 1, loc: (p, c) => p.getByRole('tab', { name: c('Ý thức & Phối hợp') }) }],
  },
  {
    id: 'gv-yeu-cau', en: true, user: 7, url: '/cong-viec/yeu-cau', cao: 760,
    marks: [],
  },
  {
    id: 'gv-thong-bao', en: true, user: 7, url: '/',
    buoc: async (p) => { await p.locator('header button[aria-label]').filter({ hasText: /\d/ }).last().click(); },
    vung: DLG, marks: [],
  },
  {
    id: 'gv-huong-dan', en: true, user: 7, url: '/huong-dan', cao: 900, marks: [],
  },
];
