// Chụp ảnh cặp mockup | web cho tab Lịch thi (LICH-THI-UI). Chạy từ gốc repo: node <đường tới tệp này> [lọc khung]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = process.cwd();
const { chromium } = await import(pathToFileURL(path.join(REPO, 'node_modules/playwright/index.mjs')).href);
const BASE = process.env.KHUNG_BASE ?? 'http://localhost:5173';
const RA = path.join(REPO, 'docs/anh/pr-lich-thi-ui');
const MOCKUP = pathToFileURL(path.join(REPO, 'thiet-ke/v16/lich-thi.html')).href;
const LOC = process.argv[2] ?? '';
fs.mkdirSync(RA, { recursive: true });
const trinh = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch({ channel: 'chrome' })).catch(() => chromium.launch());

const hangEm = (pw, ten) => pw.locator('tr.lt-h, ul.lt-the > li').filter({ hasText: ten }).first();
const dung = (pw, ms = 700) => pw.waitForTimeout(ms);
const chuaCo = (pw) => pw.waitForSelector('tr.lt-h, ul.lt-the > li, .lt-rong, [role=alert]', { timeout: 15000 });

/** Mỗi khung: tên ảnh · khung mockup · bề rộng · vai · đường web · các bước trước khi chụp. */
const KHUNG = [
  { k: 'a1', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async () => {} },
  { k: 'b1', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => { await hangEm(pw, 'Chu Nhật Minh').getByRole('button', { name: 'Dời tháng' }).click(); await dung(pw); } },
  { k: 'b2', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => {
    await hangEm(pw, 'Bùi Thảo Vy').getByRole('button', { name: 'Dời tháng' }).click(); await dung(pw, 400);
    await pw.locator('.lt-hop').getByRole('button', { name: 'Dời tháng' }).click(); await dung(pw, 1200); } },
  { k: 'b3', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => { await hangEm(pw, 'Hà Phương Linh').getByRole('button', { name: 'Đặt tháng' }).click(); await dung(pw); } },
  { k: 'c1', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => { await hangEm(pw, 'Chu Nhật Minh').getByRole('button', { name: 'Chốt ngày' }).click(); await dung(pw); } },
  { k: 'd1', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => { await hangEm(pw, 'Đặng Thu Hà').getByRole('button', { name: 'Sửa ngày' }).click(); await dung(pw); } },
  { k: 'e1', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => { await hangEm(pw, 'Đoàn Minh Khang').getByRole('button', { name: 'Ghi kết quả' }).click(); await dung(pw, 1200); }, vh: 900 },
  { k: 'f1', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => { await hangEm(pw, 'Bùi Thảo Vy').getByRole('button', { name: /^Chi tiết/ }).click(); await dung(pw); } },
  { k: 'g2', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi&thang=2027-03,2027-04', buoc: async (pw) => { await pw.getByRole('button', { name: /^Cần làm/ }).click(); await dung(pw, 500); } },
  { k: 'g3', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', truoc: async (ctx) => { await ctx.route('**/api/hoc-vien-lop/lich-thi?*', (r) => r.abort()); }, buoc: async (pw) => { await dung(pw, 4000); } },
  { k: 'g4', w: 1440, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => {
    await pw.route('**/api/hoc-vien-lop/lich-thi/*', (r) => (r.request().method() === 'PUT' ? r.abort() : r.continue()));
    await hangEm(pw, 'Chu Nhật Minh').getByRole('button', { name: 'Chốt ngày' }).click(); await dung(pw, 400);
    await pw.locator('.lt-hop input[aria-label="Ngày thi"]').fill('26/09/2026'); await pw.locator('.lt-hop input[aria-label="Ghi chú"]').click();
    await pw.locator('.lt-hop').getByRole('button', { name: 'Chốt ngày' }).click(); await dung(pw, 1500); } },
  { k: 'g5', w: 1440, vai: 7, duong: 'hoc-vien?view=lich-thi', buoc: async () => {} },
  { k: 'm1', w: 375, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async () => {} },
  { k: 'm2', w: 375, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => { await hangEm(pw, 'Chu Nhật Minh').getByRole('button', { name: 'Chốt ngày' }).click(); await dung(pw); } },
  { k: 'm3', w: 375, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => { await hangEm(pw, 'Đoàn Minh Khang').getByRole('button', { name: 'Ghi kết quả' }).click(); await dung(pw, 1200); }, vh: 812 },
  { k: 'm4', w: 375, vai: 2, duong: 'hoc-vien?view=lich-thi', buoc: async (pw) => { await hangEm(pw, 'Bùi Thảo Vy').getByRole('button', { name: /^Chi tiết/ }).click(); await dung(pw); } },
];

for (const f of KHUNG.filter((x) => !LOC || LOC.split(',').includes(x.k))) {
  const sang = f.w < 768;
  // Trái: khung mockup
  const pm = await (await trinh.newContext({ viewport: { width: Math.max(f.w, 1440) + 160, height: 900 }, deviceScaleFactor: 1 })).newPage();
  await pm.goto(`${MOCKUP}`, { waitUntil: 'networkidle' });
  await pm.emulateMedia({ colorScheme: sang ? 'light' : 'dark' });
  await pm.evaluate((s) => { document.documentElement.dataset.theme = s ? 'light' : 'dark'; }, sang);
  await pm.evaluate(() => document.fonts.ready);
  const khungMk = f.k.startsWith('m') ? `[data-k="${f.k}"]` : `[data-k="${f.k}"]`;
  const anhMk = await pm.locator(khungMk).first().screenshot();
  const hMk = (await pm.locator(khungMk).first().boundingBox()).height;
  // Phải: web
  const ctx = await trinh.newContext({ viewport: { width: f.w, height: f.vh ?? (f.w < 768 ? 812 : 900) }, deviceScaleFactor: 1 });
  await ctx.addInitScript((s) => { try { localStorage.setItem('pisa-giao-dien', s ? 'light' : 'dark'); localStorage.setItem('pisa-ngon-ngu', 'vi'); } catch {} }, sang);
  const r = await ctx.request.post(`${BASE}/api/demo/session`, { data: { userId: f.vai } });
  if (!r.ok()) { console.error(`đăng nhập ${f.vai}: ${r.status()}`); continue; }
  if (f.truoc) await f.truoc(ctx);
  const pw = await ctx.newPage();
  await pw.goto(`${BASE}/${f.duong}`, { waitUntil: 'networkidle' });
  if (f.k !== 'g3') await chuaCo(pw).catch(() => {});
  await dung(pw, 600);
  await f.buoc(pw);
  await pw.mouse.move(0, 0);
  const cao = Math.min(Math.round(hMk) + (f.k === "e1" || f.k === "m3" ? 0 : 260), 1800);
  if (!f.vh) await pw.setViewportSize({ width: f.w, height: Math.max(cao, f.w > 768 ? 1000 : 600) });
  await dung(pw, 300);
  const anhWeb = await pw.screenshot({ fullPage: false });
  const pg = await (await trinh.newContext({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 1 })).newPage();
  const url = (b) => `data:image/png;base64,${b.toString('base64')}`;
  await pg.setContent(`<body style="margin:0;background:#fff;font:600 14px system-ui;color:#111"><div style="display:flex;gap:24px;align-items:flex-start;padding:12px;width:max-content">
    <figure style="margin:0"><figcaption style="padding:0 0 8px">Mockup · lt-${f.k}</figcaption><img src="${url(anhMk)}"></figure>
    <figure style="margin:0"><figcaption style="padding:0 0 8px">Web · ${f.duong} · vai ${f.vai} · ${f.w} ${sang ? 'sáng' : 'tối'}</figcaption><img src="${url(anhWeb)}"></figure></div></body>`);
  await pg.waitForFunction(() => [...document.images].every((i) => i.complete));
  await pg.locator('body > div').screenshot({ path: path.join(RA, `cap-lt-${f.k}-${f.w}.png`) });
  fs.writeFileSync(path.join(RA, `web-lt-${f.k}-${f.w}.png`), anhWeb);
  console.log('xong', f.k);
  await ctx.close(); await pm.context().close(); await pg.context().close();
}
await trinh.close();
