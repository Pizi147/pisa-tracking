// Đi ngẫu nhiên: mỗi (vai × bề rộng × trang) chạy W lượt đi, mỗi lượt S bước (bấm / gõ / chọn / Quay lại / tải lại).
// Ghi bước khi gặp lỗi (error boundary, pageerror, console.error không phải Warning, API 5xx). Hạt giống cố định → tái hiện được.
// node di.mjs <base> <vai=id,...> <trang,...> [rong=1440,375] [W=4] [S=20] [hat=1]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [base, vaiArg, trangArg, rongArg = '1440,375', wArg = '4', sArg = '20', hatArg = '1'] = process.argv.slice(2);
const VAI = Object.fromEntries(vaiArg.split(',').map((s) => s.split('=')));
const TRANG = trangArg.split(',');
const RONG = rongArg.split(',').map(Number);
const W = Number(wArg), S = Number(sArg);
let hat = Number(hatArg);
const rnd = () => { hat = (hat * 1103515245 + 12345) % 2147483648; return hat / 2147483648; };
const OUT = process.env.OUT ?? 'di.jsonl';
const GO = ['7', '7.5', '-', 'abc', '', '10', '0', '8,5', '6.25', '9.5', 'v', '  ', '5'];
const browser = await chromium.launch({ channel: 'msedge' });
const ghi = (o) => { fs.appendFileSync(OUT, JSON.stringify(o) + '\n'); if (o.loi?.length) console.log('LỖI', JSON.stringify(o).slice(0, 900)); };

function gan(page) {
  page.__loi = []; page.__canh = new Set();
  page.on('pageerror', (e) => page.__loi.push('pageerror: ' + String(e.message).slice(0, 300)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return; const s = m.text();
    if (/Failed to load resource|net::ERR/.test(s)) return;
    if (/^Warning:/.test(s)) { page.__canh.add(s.slice(0, 160)); return; }
    page.__loi.push('console: ' + s.slice(0, 400));
  });
  page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 500) page.__loi.push(`api ${r.status()} ${r.request().method()} ${r.url().replace(base, '')}`); });
}
async function kiem(page) {
  const bien = await page.locator('[role=alert]:has-text("Trang gặp lỗi")').count().catch(() => 0);
  const l = [...page.__loi]; if (bien) l.push('ERROR-BOUNDARY'); page.__loi.length = 0; return l;
}
/** Ứng viên trong hộp / panel trên cùng nếu có, không thì cả trang (trừ thanh trên + Đăng xuất). Đánh dấu bằng data-di để bấm đúng phần tử. */
async function ungVien(page) {
  return page.evaluate(() => {
    document.querySelectorAll('[data-di]').forEach((e) => e.removeAttribute('data-di'));
    const hop = [...document.querySelectorAll('[role=dialog], [role=menu], [role=listbox]')].filter((e) => e.getBoundingClientRect().width > 0).pop();
    const vung = hop ?? document.querySelector('#noi-dung') ?? document.body;
    const ds = [...vung.querySelectorAll('button, [role=button], [role=tab], [role=menuitem], [role=option], a[href], input, textarea, select, [contenteditable=true], td[tabindex]')]
      .filter((e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0) || e.disabled) return false;
        const ten = (e.getAttribute('aria-label') || e.textContent || '').trim();
        if (/Đăng xuất|Đổi tài khoản|Công cụ demo|Bản demo nội bộ|Demo tools/.test(ten)) return false;
        const h = e.getAttribute('href'); if (h && (/^https?:|^mailto|^tel/.test(h) || h.startsWith('/api'))) return false;
        if (e.type === 'file') return false;
        return true; });
    return ds.map((e, i) => { e.setAttribute('data-di', String(i)); return { i, tag: e.tagName.toLowerCase(), type: e.type ?? '', ten: (e.getAttribute('aria-label') || e.textContent || e.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 40) }; });
  });
}
async function buoc(page) {
  const x = rnd();
  if (x < 0.03) { await page.goBack({ timeout: 4000 }).catch(() => {}); return 'Quay lại'; }
  if (x < 0.05) { await page.reload({ waitUntil: 'networkidle', timeout: 8000 }).catch(() => {}); return 'Tải lại'; }
  if (x < 0.09) { await page.keyboard.press('Escape'); return 'Esc'; }
  const uv = await ungVien(page);
  if (!uv.length) return 'trống';
  const u = uv[Math.floor(rnd() * uv.length)];
  const loc = page.locator(`[data-di="${u.i}"]`);
  try {
    if (u.tag === 'select') { const n = await loc.locator('option').count(); if (n) await loc.selectOption({ index: Math.floor(rnd() * n) }, { timeout: 2000 }); return `chọn ${u.ten}`; }
    if ((u.tag === 'input' && !/checkbox|radio|button|submit/.test(u.type)) || u.tag === 'textarea' || u.tag === 'td') {
      const v = GO[Math.floor(rnd() * GO.length)];
      if (u.tag === 'td') { await loc.click({ timeout: 2000 }); await page.keyboard.type(v); } else await loc.fill(v, { timeout: 2000 });
      const k = rnd(); if (k < 0.35) await page.keyboard.press('Enter'); else if (k < 0.6) await page.keyboard.press('Tab'); else if (k < 0.7) await page.keyboard.press('ArrowDown');
      return `gõ "${v}" vào ${u.tag} ${u.ten}`;
    }
    if (rnd() < 0.1) { await loc.dblclick({ timeout: 2000 }); return `bấm đúp ${u.ten}`; }
    await loc.click({ timeout: 2000 }); return `bấm ${u.tag} ${u.ten}`;
  } catch (e) { return `(hỏng) ${u.tag} ${u.ten}`; }
}

for (const [vai, id] of Object.entries(VAI)) for (const rong of RONG) {
  const ctx = await browser.newContext({ viewport: { width: rong, height: rong < 800 ? 812 : 900 }, baseURL: base });
  const r = await ctx.request.post('/api/demo/session', { data: { userId: Number(id) } });
  if (!r.ok()) { ghi({ vai, rong, loi: ['login ' + r.status()] }); await ctx.close(); continue; }
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const page = await ctx.newPage(); gan(page);
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  await page.route('**/api/demo/config', (r) => r.abort());
  await page.route('**/api/me/ngon-ngu**', (r) => r.abort());
  for (const t of TRANG) for (let w = 0; w < W; w++) {
    const hatDau = hat;
    await page.goto(t, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    const dau = await kiem(page);
    if (dau.length) { ghi({ vai, rong, trang: t, buoc: ['mở'], url: page.url().replace(base, ''), loi: dau }); continue; }
    const da = [];
    for (let s = 0; s < S; s++) {
      const mo = await buoc(page); da.push(mo);
      await page.waitForTimeout(450);
      const l = await kiem(page);
      if (l.length) { ghi({ vai, rong, trang: t, hatDau, buoc: da, url: page.url().replace(base, ''), loi: l }); break; }
      const u = page.url(); if (!u.startsWith(base) || !/\/(test|mock-test|luot-test|nhap-diem|bang-diem-thuong|hoc-vien)/.test(u)) await page.goto(t).catch(() => {});
    }
  }
  ghi({ vai, rong, xong: true, canh: [...page.__canh] });
  await ctx.close();
}
await browser.close();
