// SUA-CHAM-LAI: chụp các panel (CHỈ ĐỌC) — node chup-panel.mjs <outDir>. BASE=http://localhost:5471
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:5471';
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const VAI = { gvcn: 7, gvs: 17, ql: 2 };
const CA = [
  // Đ9: panel Chấm Speaking (GV S) — nhóm "Speaking chấm chéo" ở Chấm Test
  { ten: 'panel-cham-speaking-gvs', vai: 'gvs', url: '/test/cham', bam: (p) => p.locator('details:has(summary:has-text("Speaking chấm chéo")) li button').first() },
  // Đ2 + Đ3: panel Nhập điểm ở Chấm Test (GVCN) và Công việc
  { ten: 'panel-nhap-diem-cham-test-gvcn', vai: 'gvcn', url: '/test/cham', bam: (p) => p.locator('section[aria-label="Bài cần chấm"] li button').first() },
  { ten: 'panel-nhap-diem-cong-viec-gvcn', vai: 'gvcn', url: '/cong-viec', bam: (p) => p.getByRole('button', { name: 'Nhập điểm', exact: true }).first() },
];
const browser = await chromium.launch();
const ketQua = [];
for (const c of CA) {
  for (const [w, theme] of [[1440, 'dark'], [375, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, ...(w < 768 ? { isMobile: true, hasTouch: true } : {}) });
    await ctx.addInitScript(([t]) => { try { localStorage.setItem('pisa-giao-dien', t); localStorage.setItem('pisa-ngon-ngu', 'vi'); sessionStorage.setItem('pisa-ngon-ngu-vua-chon', '1'); } catch {} }, [theme]);
    await ctx.route('**/api/**', (r) => (['GET', 'HEAD'].includes(r.request().method()) || r.request().url().includes('/api/demo/session') ? r.continue() : r.abort()));
    await ctx.request.post(`${BASE}/api/demo/session`, { data: { userId: VAI[c.vai] } });
    const page = await ctx.newPage();
    await page.goto(BASE + c.url, { waitUntil: 'networkidle' });
    try { await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 20000 }); } catch {}
    try { await c.bam(page).click({ timeout: 8000 }); } catch (e) { ketQua.push({ ten: c.ten, w, loi: String(e).slice(0, 120) }); await ctx.close(); continue; }
    await page.waitForTimeout(1500);
    try { await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 20000 }); } catch {}
    const m = await page.evaluate(() => ({
      dan: [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Dán từ Excel'),
      caLop: [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Cả lớp'),
      moLuoi: [...document.querySelectorAll('a')].map((a) => a.textContent.trim()).filter((s) => s.startsWith('Mở lưới')),
      daCoDiem: [...document.querySelectorAll('li')].map((l) => l.textContent.trim()).filter((s) => s.startsWith('Đã có điểm ·')),
      h: document.documentElement.scrollHeight,
    }));
    await page.setViewportSize({ width: w, height: Math.min(Math.max(900, m.h), 5000) });
    await page.waitForTimeout(300);
    const file = `${c.ten}-${w}.png`;
    await page.screenshot({ path: path.join(OUT, file) });
    ketQua.push({ ten: c.ten, w, file, ...m });
    console.log(c.ten, w, JSON.stringify(m));
    await ctx.close();
  }
}
// Đ4: tooltip lý do "Chưa đủ dữ liệu" ở hồ sơ lớp (không chụp được tooltip — ghi ra chữ)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.request.post(`${BASE}/api/demo/session`, { data: { userId: VAI.gvcn } });
  const page = await ctx.newPage();
  for (const lop of [3, 4, 5, 6]) {
    await page.goto(`${BASE}/hoc-vien/lop/${lop}`, { waitUntil: 'networkidle' });
    try { await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 20000 }); } catch {}
    const ly = await page.evaluate(() => [...document.querySelectorAll('span[title]')].filter((s) => s.textContent.includes('Chưa đủ dữ liệu')).map((s) => s.title));
    const chuaLich = await page.evaluate(() => document.querySelectorAll('span[title="Chưa có lịch"]').length);
    ketQua.push({ ten: `ho-so-lop-${lop}`, lyDoChuaDu: ly, oChuaLich: chuaLich });
    console.log('lop', lop, JSON.stringify(ly), chuaLich);
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'ket-qua-panel.json'), JSON.stringify(ketQua, null, 1));
