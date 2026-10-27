// Ảnh cặp mockup | web của UI-HO-SO-HV-2 (M5 PR ②). App cục bộ: PORT=4521 WEB_PORT=5521 npm run dev, seed + chỉnh DB như khop-khac.md.
// Chạy từ gốc repo: node docs/anh/ui-ho-so-hv-2/chup.cjs  (cần `npm i --no-save playwright`; CHI=375 chỉ chụp ảnh có tên chứa "375").
const { chromium } = require(require('path').resolve('node_modules/playwright'));
const fs = require('fs');
const os = require('os');
const path = require('path');
const OUT = __dirname;
const MOCK = require('url').pathToFileURL(path.resolve(__dirname, '../../../thiet-ke/v7/ho-so-hv.html')).href;
const WEB = 'http://localhost:5521';
const tienDo = (p) => p.locator('section[aria-label="Tiến độ trên lớp"]');
const caseCot = (p) => p.locator('section[aria-label^="Case & phương án"]');
/* ten, theme, w, mock {sel, truoc}, web {sid, user, kn, lam(p), cat(p)} — `cat` = chỉ chụp một khối (ảnh trạng thái). */
const CAP = [
  ['dang-hoc-1440-toi', 'dark', 1440, { sel: '#p .web' }, { sid: 2, user: 9, kn: 'S' }],
  ['da-thi-1440-toi', 'dark', 1440, { sel: '.web[data-ve="dathi"]' }, { sid: 21, user: 23, kn: 'S' }],
  ['da-thi-cho-kq-1440-toi', 'dark', 1440, { sel: '.web[data-ve="dathi"]', truoc: '[data-nac="cho"]' }, { sid: 36, user: 16 }],
  ['p8-khong-hoc-1440-toi', 'dark', 1440, { sel: '#p .web', truoc: '#p .od button:nth-child(4)' }, { sid: 23, user: 13, kn: 'W1' }],
  ['tien-do-diem-1440-toi', 'dark', 1440, { sel: '.web[data-ve="s-diem"]' }, { sid: 2, user: 9, kn: 'S', cat: tienDo,
    lam: async (p) => { const c = tienDo(p); await c.getByRole('button', { name: '+ Ghi tiến độ' }).click(); await c.getByRole('radio', { name: 'Điểm' }).click();
      await c.getByPlaceholder('Ví dụ: Part 3 so sánh').fill('Part 3 so sánh'); await c.locator('input.field').nth(1).fill('6');
      await c.locator('textarea').fill('Đã dùng được câu so sánh, còn ngập ngừng.'); } }],
  ['tien-do-loi-1440-toi', 'dark', 1440, { sel: '.web[data-ve="s-loi"]' }, { sid: 2, user: 9, kn: 'S', cat: tienDo,
    lam: async (p) => { const c = tienDo(p); await c.getByRole('button', { name: '+ Ghi tiến độ' }).click(); await c.getByRole('button', { name: 'Lưu' }).click(); } }],
  ['tien-do-vua-luu-1440-toi', 'dark', 1440, { sel: '.web[data-ve="s-moi"]' }, { sid: 2, user: 9, kn: 'S', cat: tienDo,
    lam: async (p) => { const c = tienDo(p); await c.getByRole('button', { name: '+ Ghi tiến độ' }).click(); await c.getByRole('radio', { name: 'Band' }).click();
      await c.getByPlaceholder('5.5').fill('6'); await c.locator('textarea').fill('Trả lời Part 3 dài hơn, còn ngập ngừng khi đổi ý.');
      await c.getByRole('button', { name: 'Lưu' }).click(); await p.waitForTimeout(1200); } }],
  ['them-pa-1440-toi', 'dark', 1440, { sel: '.web[data-ve="s-pa"]' }, { sid: 2, user: 9, kn: 'S', cat: caseCot,
    lam: async (p) => { await caseCot(p).getByRole('button', { name: '+ Thêm PA' }).first().click(); } }],
  ['ghi-ket-qua-1440-toi', 'dark', 1440, { sel: '.web[data-ve="s-kq"]' }, { sid: 2, user: 9, kn: 'S', cat: caseCot,
    lam: async (p) => { await p.locator('section[aria-label="Việc của tôi"] button').first().click(); } }],
  ['tvv-chi-xem-1440-toi', 'dark', 1440, { sel: '.web[data-ve="s-xem"]' }, { sid: 2, user: 27, kn: 'S', cat: (p) => p.locator('#hanh-trinh-kn + div') }],
  ['dang-hoc-375-sang', 'light', 375, { sel: '#n375 .khung.hep:nth-child(1) .web' }, { sid: 2, user: 9, kn: 'S' }],
  ['da-thi-375-sang', 'light', 375, { sel: '#n375 .khung.hep:nth-child(2) .web' }, { sid: 21, user: 23, kn: 'S' }],
];
(async () => {
  const b = await chromium.launch();
  for (const [ten, theme, w, m, web] of CAP.filter(([ten]) => !process.env.CHI || ten.includes(process.env.CHI))) {
    const hep = w < 768;
    const tmp = (x) => path.join(os.tmpdir(), `hv2-${ten}.${x}.png`);
    const mc = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme, deviceScaleFactor: 1 });
    const mp = await mc.newPage(); await mp.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    await mp.goto(MOCK); await mp.waitForTimeout(400);
    if (m.truoc) { await mp.locator(m.truoc).first().click(); await mp.waitForTimeout(300); }
    await mp.locator(m.sel).first().screenshot({ path: tmp('mock') });
    await mc.close();
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, deviceScaleFactor: 1, ...(hep ? { isMobile: true, hasTouch: true } : {}) });
    await ctx.addInitScript((th) => { try { localStorage.setItem('pisa-giao-dien', th); localStorage.setItem('pisa-ngon-ngu', 'vi'); } catch {} }, theme);
    await ctx.request.post(`${WEB}/api/demo/session`, { data: { userId: web.user } });
    const p = await ctx.newPage();
    await p.goto(`${WEB}/hoc-vien/${web.sid}`); await p.waitForTimeout(2500);
    if (web.kn) { await p.locator('[aria-label="Chọn kỹ năng xem hành trình"] button').filter({ hasText: new RegExp('^' + web.kn) }).first().click(); await p.waitForTimeout(1000); }
    if (web.lam) { await web.lam(p); await p.waitForTimeout(900); }
    await p.evaluate(() => { const t = document.querySelector('button[aria-label="Đổi tài khoản demo"]')?.closest('div[lang="vi"]'); if (t) t.style.display = 'none'; });
    if (web.cat) await web.cat(p).first().screenshot({ path: tmp('web') });
    else {
      const h = await p.evaluate(() => { const mm = document.querySelector('main'); return Math.ceil(Math.max(document.documentElement.scrollHeight, mm ? mm.getBoundingClientRect().top + mm.scrollHeight : 0)); });
      await p.setViewportSize({ width: w, height: Math.min(h, 6000) }); await p.waitForTimeout(500);
      await p.screenshot({ path: tmp('web') });
    }
    await ctx.close();
    const c = await b.newContext({ viewport: { width: 400, height: 400 }, colorScheme: theme });
    const cp = await c.newPage();
    const a = fs.readFileSync(tmp('mock')).toString('base64'), bb = fs.readFileSync(tmp('web')).toString('base64');
    await cp.setContent(`<body style="margin:0;background:${theme === 'dark' ? '#050a16' : '#f3f5f9'};font:600 14px system-ui;color:${theme === 'dark' ? '#e7edf7' : '#141a2b'}"><div style="display:flex;gap:24px;padding:16px;align-items:flex-start;width:max-content">
      <div><p style="margin:0 0 8px">Mockup thiet-ke/v7/ho-so-hv.html</p><img src="data:image/png;base64,${a}" style="display:block;${hep || web.cat ? '' : 'width:1400px'}"></div>
      <div><p style="margin:0 0 8px">Web (nhánh UI-HO-SO-HV-2)</p><img src="data:image/png;base64,${bb}" style="display:block"></div></div></body>`);
    await cp.waitForTimeout(300);
    const box = await cp.locator('body > div').boundingBox();
    await cp.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) });
    await cp.screenshot({ path: `${OUT}/${ten}.png`, fullPage: true });
    await c.close();
    console.log('✓', ten);
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
