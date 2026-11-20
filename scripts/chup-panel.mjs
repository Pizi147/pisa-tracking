// GV-2 (PTA rà #1930): chụp TOÀN panel việc (thân panel tự cuộn — ảnh cặp thường chỉ thấy phần đầu). Mở hết chiều cao panel rồi chụp riêng panel.
// Chạy: KHUNG_BASE=http://localhost:<WEB_PORT> node scripts/chup-panel.mjs <đường web> <vai> <bề rộng> <ra.png>   (Git Bash: đường không có "/" đầu)
// 375 → sáng, còn lại tối (GIAO_DIEN=sang|toi để đổi). Playwright: `npm i --no-save playwright` hoặc PW=<đường tới playwright>.
import { pathToFileURL } from 'node:url';

const [duong, vai, rongChu, ra] = process.argv.slice(2);
if (!duong || !Number(vai) || !Number(rongChu) || !ra) { console.error('Dùng: node scripts/chup-panel.mjs <đường web> <vai> <bề rộng> <ra.png>'); process.exit(2); }
const rong = Number(rongChu);
const { chromium } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright');
const BASE = process.env.KHUNG_BASE ?? `http://localhost:${process.env.WEB_PORT ?? 5173}`;
const sang = process.env.GIAO_DIEN ? process.env.GIAO_DIEN === 'sang' : rong < 768;
const trinh = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch());
const ctx = await trinh.newContext({ viewport: { width: rong, height: 900 }, colorScheme: sang ? 'light' : 'dark' });
const p = await ctx.newPage();
await p.goto(BASE);
await p.evaluate((id) => fetch('/api/demo/session', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: id }) }), Number(vai));
await p.goto(`${BASE}/${duong.replace(/^\//, '')}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.evaluate(() => document.fonts.ready);
const panel = p.locator('section[tabindex]').last();
await panel.evaluate((el) => {
  for (let x = el; x && x !== document.body; x = x.parentElement) { x.style.maxHeight = 'none'; x.style.height = 'auto'; x.style.position = x === el ? x.style.position : 'static'; }
  el.querySelectorAll('*').forEach((c) => { const s = getComputedStyle(c); if (s.overflowY === 'auto' || s.overflowY === 'scroll') { c.style.overflow = 'visible'; c.style.maxHeight = 'none'; } });
});
await p.setViewportSize({ width: rong, height: Math.ceil((await panel.boundingBox()).height) + 300 });
await p.waitForTimeout(300);
await panel.screenshot({ path: ra });
console.log(`Toàn panel: ${ra}`);
await trinh.close();
