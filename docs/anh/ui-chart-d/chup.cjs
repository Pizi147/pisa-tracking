// Ảnh cặp mockup | web của UI-CHART-D. Cần app chạy cục bộ: PORT=4417 WEB_PORT=5417 npm run dev, bộ demo + chỉnh DB như khop-khac.md. Chạy từ thư mục bất kỳ: node docs/anh/ui-chart-d/chup.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
fs.mkdirSync(OUT, { recursive: true });
const MOCK = 'file://' + path.resolve(__dirname, '../../../thiet-ke/v7/ho-so-hv.html');
const WEB = 'http://localhost:5417';
const CAP = [
  // ten, theme, w, mock {sel, truoc}, web {sid, user, kn, bang}
  ['dang-hoc-1440-toi', 'dark', 1440, { sel: '#p .web' }, { sid: 2, user: 7, kn: 'S' }],
  ['dang-hoc-bang-1440-toi', 'dark', 1440, { sel: '#p .web', truoc: '#p [data-act="xem"][data-v="bang"]' }, { sid: 2, user: 7, kn: 'S', bang: 1 }],
  ['da-thi-1440-toi', 'dark', 1440, { sel: '.web[data-ve="dathi"]' }, { sid: 21, user: 13, kn: 'W2' }],
  ['da-thi-overall-1440-toi', 'dark', 1440, { sel: '.web[data-ve="dathi-ov"]' }, { sid: 21, user: 13, kn: 'Overall' }],
  ['da-thi-cho-kq-1440-toi', 'dark', 1440, { sel: '.web[data-ve="dathi"]', truoc: '[data-nac="cho"]' }, { sid: 36, user: 16, kn: 'S' }],
  ['p8-khong-hoc-1440-toi', 'dark', 1440, { sel: '#p .web', truoc: '#p .od button:nth-child(4)' }, { sid: 23, user: 13, kn: 'W1' }],
  ['dang-hoc-375-sang', 'light', 375, { sel: '#n375 .khung.hep:nth-child(1) .web' }, { sid: 2, user: 7, kn: 'S' }],
  ['da-thi-375-sang', 'light', 375, { sel: '#n375 .khung.hep:nth-child(2) .web' }, { sid: 21, user: 13, kn: 'W2' }],
];
(async () => {
  const b = await chromium.launch();
  for (const [ten, theme, w, m, web] of CAP) {
    const hep = w < 768;
    // mockup
    const mc = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme, deviceScaleFactor: 1 });
    const mp = await mc.newPage(); await mp.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    await mp.goto(MOCK); await mp.waitForTimeout(400);
    if (m.truoc) { await mp.locator(m.truoc).first().click(); await mp.waitForTimeout(300); }
    await mp.locator(m.sel).first().screenshot({ path: path.join(require('os').tmpdir(), `${ten}.mock.png`) });
    await mc.close();
    // web
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, deviceScaleFactor: 1, ...(hep ? { isMobile: true, hasTouch: true } : {}) });
    await ctx.addInitScript((th) => { try { localStorage.setItem('pisa-giao-dien', th); } catch {} }, theme);
    await ctx.request.post(`${WEB}/api/demo/session`, { data: { userId: web.user } });
    const p = await ctx.newPage();
    await p.goto(`${WEB}/hoc-vien/${web.sid}`); await p.waitForTimeout(2500);
    await p.locator('[aria-label="Chọn kỹ năng xem hành trình"] button').filter({ hasText: new RegExp('^' + web.kn) }).first().click(); await p.waitForTimeout(900);
    if (web.bang) { await p.getByRole('button', { name: 'Bảng', exact: true }).click(); await p.waitForTimeout(400); }
    await p.evaluate(() => { const t = document.querySelector('button[aria-label="Đổi tài khoản demo"]')?.closest('div[lang="vi"]'); if (t) t.style.display = 'none'; });
    const h = await p.evaluate(() => { const mm = document.querySelector('main'); return Math.ceil(Math.max(document.documentElement.scrollHeight, mm ? mm.getBoundingClientRect().top + mm.scrollHeight : 0)); });
    await p.setViewportSize({ width: w, height: Math.min(h, 5000) }); await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(require('os').tmpdir(), `${ten}.web.png`) });
    await ctx.close();
    // ghép
    const c = await b.newContext({ viewport: { width: 400, height: 400 }, colorScheme: theme });
    const cp = await c.newPage();
    const a = fs.readFileSync(path.join(require('os').tmpdir(), `${ten}.mock.png`)).toString('base64'), bb = fs.readFileSync(path.join(require('os').tmpdir(), `${ten}.web.png`)).toString('base64');
    await cp.setContent(`<body style="margin:0;background:${theme === 'dark' ? '#050a16' : '#f3f5f9'};font:600 14px system-ui;color:${theme === 'dark' ? '#e7edf7' : '#141a2b'}"><div style="display:flex;gap:24px;padding:16px;align-items:flex-start;width:max-content">
      <div><p style="margin:0 0 8px">Mockup thiet-ke/v7/ho-so-hv.html</p><img src="data:image/png;base64,${a}" style="display:block;${hep ? '' : 'width:1400px'}"></div>
      <div><p style="margin:0 0 8px">Web (nhánh UI-CHART-D)</p><img src="data:image/png;base64,${bb}" style="display:block"></div></div></body>`);
    await cp.waitForTimeout(300);
    const box = await cp.locator('body > div').boundingBox();
    await cp.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) });
    await cp.screenshot({ path: `${OUT}/${ten}.png`, fullPage: true });
    await c.close();
    console.log('✓', ten);
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
