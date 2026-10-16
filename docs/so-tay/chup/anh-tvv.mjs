// Ảnh sổ TVV & CX (23 = Nguyễn Thu Hương, TVV; 24 = Vũ Thanh Tâm, CX) và sổ Admin (22 = Đào Minh Ngọc, Admin chi nhánh).
// Bộ demo cục bộ: TVV / Admin đặt về chi nhánh Monbay, gán TVV cho em MB FT 101 / 102 / BE 03, em 2 có kết quả thi thật, em 3 đã thi (README).
/** Mở lớp MB FT 101 trong khối Test chấm tuần này — app nhớ trạng thái mở, nên chỉ bấm khi đang đóng. */
const moLopFt101 = async (p) => {
  const k = p.locator('[data-hd="lich-test-tuan"]');
  if (!(await k.getByRole('button', { name: /^(Thu gọn|Collapse)( lớp| class)? MB FT 101$/ }).count())) await k.getByRole('button', { name: /^(Mở|Expand)( lớp| class)? MB FT 101$/ }).first().click();
};
const HD = (h) => (p) => p.locator(`[data-hd="${h}"]`);
const NUT = (p, c, vi) => p.getByRole('button', { name: c(vi), exact: true });

export const ANH_TVV = [
  {
    id: 'tvv-tong-quan', user: 23, url: '/', cao: 420,
    marks: [
      { n: 1, loc: (p) => p.locator('[data-hd="tq-hv-so"] a').first() },
      { n: 2, loc: (p) => p.locator('[data-hd="tq-hv-so"] a').nth(4) },
      { n: 3, loc: (p) => p.locator('[data-hd="tq-hv-so"] a').nth(5) },
    ],
  },
  {
    id: 'tvv-can-lam', user: 23, url: '/hoc-vien', cao: 700,
    buoc: async (p) => { await p.getByRole('button', { name: /Cần làm|To do/ }).first().click(); },
    marks: [
      { n: 1, loc: (p) => p.locator('select[aria-label="Phạm vi"]') },
      { n: 2, loc: HD('hvl-goc') },
    ],
  },
  {
    id: 'tvv-ho-so-hv', user: 23, url: '/hoc-vien/2', cao: 520,
    marks: [
      { n: 1, loc: (p, c) => NUT(p, c, 'Gia hạn') },
      { n: 2, loc: (p, c) => NUT(p, c, 'Sửa thông tin').locator('..') },
      { n: 3, loc: (p, c) => NUT(p, c, 'Chọn bước tiếp ›'), phai: true },
    ],
  },
  { id: 'tvv-buoc-tiep', panel: true, user: 23, url: '/hoc-vien/2', buoc: async (p, c) => { await NUT(p, c, 'Chọn bước tiếp ›').click(); }, marks: [] },
  { id: 'tvv-thi-that', panel: true, user: 23, url: '/hoc-vien/3', buoc: async (p, c) => { await NUT(p, c, 'Kết quả thi thật').click(); }, marks: [] },
  { id: 'tvv-gia-han', panel: true, user: 23, url: '/hoc-vien/2', buoc: async (p, c) => { await NUT(p, c, 'Gia hạn').click(); }, marks: [] },
  { id: 'tvv-tam-dung', panel: true, user: 23, url: '/hoc-vien/2', buoc: async (p, c) => { await NUT(p, c, 'Tạm dừng / Thôi học').click(); }, marks: [] },
  { id: 'tvv-sua-tt', panel: true, user: 23, url: '/hoc-vien/2', buoc: async (p, c) => { await NUT(p, c, 'Sửa thông tin').click(); }, marks: [] },
  { id: 'tvv-lich-su', panel: true, user: 23, url: '/hoc-vien/1', buoc: async (p, c) => { await NUT(p, c, 'Lịch sử sửa').click(); }, marks: [] },
  { id: 'tvv-sua-ca-lop', panel: true, user: 23, url: '/hoc-vien/lop/3', buoc: async (p, c) => { await NUT(p, c, 'Sửa thông tin').click(); }, marks: [] },
  {
    id: 'tvv-phoi-hop', user: 23, url: '/hoc-vien/50', cao: 1000,
    buoc: async (p, c) => { await p.getByRole('tab', { name: c('Ý thức & Phối hợp') }).click(); },
    marks: [{ n: 1, loc: (p, c) => p.getByRole('tab', { name: c('Ý thức & Phối hợp') }) }],
  },
  { id: 'tvv-tong-quan-375', user: 23, url: '/', w: 375, cao: 812, marks: [] },
  {
    id: 'cx-tong-quan', user: 24, url: '/', cao: 900,
    marks: [
      { n: 1, loc: (p) => p.locator('label', { hasText: /Chi nhánh|Branch/ }).first() , phai: true },
      { n: 2, loc: HD('tq-hv-so') },
    ],
  },
  {
    id: 'cx-hoc-vien', user: 24, url: '/hoc-vien', cao: 700,
    marks: [{ n: 1, loc: HD('hvl-goc') }, { n: 2, loc: (p) => p.locator('select').first() }],
  },
  { id: 'cx-ho-so-hv', user: 24, url: '/hoc-vien/2', cao: 520, marks: [] },
];

export const ANH_ADMIN = [
  {
    id: 'ad-tong-quan', user: 22, url: '/', cao: 760,
    marks: [{ n: 1, loc: HD('tq-mock-test') }],
  },
  {
    id: 'ad-ke-hoach', user: 22, url: '/test/ke-hoach', cao: 760,
    buoc: async (p, c) => { await p.getByRole('button', { name: c('Mở lớp MB FT 101') }).click(); },
    marks: [{ n: 1, loc: HD('kht-loc') }],
  },
  { id: 'ad-xep-nhieu-mt', panel: true, user: 22, url: '/test/ke-hoach', buoc: async (p, c) => { await NUT(p, c, 'Xếp nhiều MT…').click(); }, marks: [] },
  {
    id: 'ad-lich-test', user: 22, url: '/test', cao: 900,
    buoc: async (p, c) => { await p.getByRole('button', { name: c('Mở Test quá hạn chấm') }).click().catch(() => {}); },
    marks: [],
  },
  {
    id: 'ad-cong-viec', user: 22, url: '/cong-viec', cao: 760,
    buoc: async (p, c) => { await NUT(p, c, 'Lọc thêm').click(); },
    marks: [{ n: 1, loc: HD('cv-loc-them') }],
  },
  {
    id: 'ad-o-diem', user: 22, url: '/test', toiDa: 1800,
    buoc: async (p) => {
      await moLopFt101(p);
      await p.locator('button[aria-label*="Listening · Lý Minh Châu"]:visible').first().click();
    },
    vung: (p) => p.locator('[role="dialog"]:visible').last(), le: 40, marks: [],
  },
  { id: 'ad-sua-tt', panel: true, user: 22, url: '/hoc-vien/1', buoc: async (p, c) => { await NUT(p, c, 'Sửa thông tin').click().catch(() => {}); }, marks: [] },
];
