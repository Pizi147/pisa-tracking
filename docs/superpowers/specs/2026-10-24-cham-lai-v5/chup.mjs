// Chụp mọi màn chính × mọi vai (CHỈ ĐỌC). node chup.mjs <outDir> [vai…]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:5471';
const OUT = process.argv[2];
const CHON = process.argv.slice(3);
const VAI = { ql: 2, qt: 1, gvcn: 7, gvbm: 10, gvs: 17, tvv: 27, cx: 24, admin: 26, ht: 25 };
const TRANG = {
  'tong-quan': '/', 'cong-viec': '/cong-viec', 'hv-lop': '/hoc-vien', 'ho-so-lop': '/hoc-vien/lop/3', 'ho-so-hv': '/hoc-vien/1',
  'test-lich': '/test/lich', 'test-cham': '/test/cham', 'test-ke-hoach': '/test/ke-hoach', 'mock': '/mock-test/6',
  'phan-tich': '/phan-tich', 'ho-so-gv': '/giao-vien/7', 'quan-tri': '/quan-tri', 'ca-nhan': '/ho-so-ca-nhan',
  'huong-dan': '/huong-dan', 'luu-tru': '/hoc-vien/luu-tru',
};
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ketQua = [];
const vais = CHON.length ? CHON : Object.keys(VAI);
await Promise.all(vais.map(async (vai) => {
  for (const [w, theme] of [[1440, 'dark'], [375, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme,
      ...(w < 768 ? { isMobile: true, hasTouch: true } : {}) });
    await ctx.addInitScript(([t]) => { try { localStorage.setItem('pisa-giao-dien', t); localStorage.setItem('pisa-ngon-ngu', 'vi'); sessionStorage.setItem('pisa-ngon-ngu-vua-chon', '1'); } catch {} }, [theme]);
    // Chặn mọi request ghi: chỉ đọc
    await ctx.route('**/api/**', (r) => (['GET', 'HEAD'].includes(r.request().method()) || r.request().url().includes('/api/demo/session') ? r.continue() : r.abort()));
    const res = await ctx.request.post(`${BASE}/api/demo/session`, { data: { userId: VAI[vai] } });
    if (!res.ok()) throw new Error(`login ${vai}`);
    const page = await ctx.newPage();
    const loi = [];
    page.on('console', (m) => m.type() === 'error' && loi.push(m.text().slice(0, 160)));
    const daChup = new Set();
    for (const [ten, url] of Object.entries(TRANG)) {
      loi.length = 0;
      await page.setViewportSize({ width: w, height: 900 });
      try { await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 }); } catch {}
      await page.waitForTimeout(400);
      try { await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 20000 }); } catch {}
      await page.waitForTimeout(500);
      const cuoi = new URL(page.url()).pathname;
      if (cuoi !== url && daChup.has(cuoi)) { ketQua.push({ vai, w, ten, url, cuoi, bo: 'chuyen' }); continue; }
      daChup.add(cuoi);
      const m = await page.evaluate(() => {
        const main = document.querySelector('main');
        const h = Math.ceil(Math.max(document.documentElement.scrollHeight, main ? main.getBoundingClientRect().top + main.scrollHeight : 0));
        const h1 = document.querySelector('main h1') || document.querySelector('h1');
        const cs = h1 ? getComputedStyle(h1) : null;
        let nho = 0;
        for (const el of document.querySelectorAll('main *')) {
          if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
          const s = parseFloat(getComputedStyle(el).fontSize); if (s < 12) nho++;
        }
        const tran = document.documentElement.scrollWidth > window.innerWidth + 1;
        const btn = [...document.querySelectorAll('main button, main a, main [role=button]')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && (r.width < 24 || r.height < 24); }).length;
        return { h, h1: h1?.textContent.trim().slice(0, 60), h1Size: cs?.fontSize, h1W: cs?.fontWeight, nho, tran, btnNho: btn,
          loiTrang: /Trang gặp lỗi|Không tải được/.test(document.body.innerText) };
      });
      await page.setViewportSize({ width: w, height: Math.max(600, Math.min(m.h, 7000)) });
      await page.waitForTimeout(300);
      const file = `${ten}-${vai}-${w}.png`;
      await page.screenshot({ path: path.join(OUT, file) });
      ketQua.push({ vai, w, ten, url, cuoi, file, ...m, loi: [...new Set(loi)].slice(0, 3) });
      console.log(vai, w, ten, cuoi, m.h, m.h1Size);
    }
    await ctx.close();
  }
}));
await browser.close();
fs.writeFileSync(path.join(OUT, 'ket-qua.json'), JSON.stringify(ketQua, null, 1));
