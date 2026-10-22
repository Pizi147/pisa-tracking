// CONG-CU — ẢNH CẶP mockup | web, toàn trang (cổng PR đổi bố cục, 07 mục 2): một PNG, trái = khung mockup, phải = trang web thật cùng bề rộng.
// Chạy: npm run dev (PORT/WEB_PORT riêng) rồi
//   KHUNG_BASE=http://localhost:5611 node scripts/anh-cap.mjs <tệp mockup> <khung> <đường web> <vai> <bề rộng> [ra.png]
//   vd: node scripts/anh-cap.mjs thiet-ke/mockup-ov14-6-sua-19-10-2026-10-19.html "#m3 .w1440" /hoc-vien/lop/3 2 1440 docs/anh/pr-x/cap-1440.png
// <khung>: bộ chọn CSS của khung trong mockup (mỗi tệp mockup đặt tên khác: `#m3 .w1440`, `.khung >> nth=2`…); `-` = cả trang mockup.
// <đường web>: viết `hoc-vien/lop/3` (không `/` đầu) khi chạy trong Git Bash — Git Bash đổi `/…` thành đường Windows.
// <vai>: userId demo (1 Quản trị · 2 QL · 7 GVCN · 9 GVBM · 23 TVV · 24 CX). Giao diện: 375 → sáng, còn lại tối; GIAO_DIEN=sang|toi để đổi.
// Web chụp hết chiều cao <main id="noi-dung"> (trang chỉ cuộn trong main): khung nhìn kéo dài tới khi không còn phần cuộn.
// Mặc định ra `docs/anh/cap/<tên mockup>-<bề rộng>.png`. Playwright: `npm i --no-save playwright` hoặc PW=<đường tới playwright>.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [tep, khung, duong, vai, rongChu, ra = `docs/anh/cap/${path.basename((tep ?? '').split('?')[0], '.html')}-${rongChu}.png`] = process.argv.slice(2);
const rong = Number(rongChu);
if (!tep || !khung || !duong || !Number(vai) || !rong) {
  console.error('Dùng: node scripts/anh-cap.mjs <tệp mockup> <khung|-> <đường web> <vai> <bề rộng> [ra.png]');
  process.exit(2);
}
// UI-LICH-TUAN: `tệp.html?khu=a` — tham số gửi kèm khi mở mockup (mockup V5 có `?khu=` chỉ hiện một khu, `?theme=`).
const [tepFile, tepQuery = ''] = tep.split('?');
if (!fs.existsSync(tepFile)) { console.error(`Không thấy tệp mockup: ${tepFile}`); process.exit(2); }
const { chromium } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright');
const BASE = process.env.KHUNG_BASE ?? `http://localhost:${process.env.WEB_PORT ?? 5173}`;
const sang = process.env.GIAO_DIEN ? process.env.GIAO_DIEN === 'sang' : rong < 768;
const trinh = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch({ channel: 'chrome' })).catch(() => chromium.launch());

// Trái: khung mockup (khung nhìn rộng hơn khung 1440 để khung không bị co).
const pm = await (await trinh.newContext({ viewport: { width: khung === '-' ? rong : Math.max(rong, 1440) + 160, height: 900 }, deviceScaleFactor: 1 })).newPage();
await pm.goto(pathToFileURL(path.resolve(tepFile)).href + (tepQuery ? `?${tepQuery}` : ''), { waitUntil: 'networkidle' });
// NEN-V5: mockup V5 sáng mặc định, tối qua `data-theme="dark"` — chụp cùng chế độ với web.
await pm.evaluate((s) => { if (!s && /\/v5\//.test(location.pathname)) document.documentElement.dataset.theme = 'dark'; }, sang);
await pm.evaluate(() => document.fonts.ready);
const anhMockup = khung === '-' ? await pm.screenshot({ fullPage: true }) : await pm.locator(khung).first().screenshot();

// Phải: trang web, đăng nhập vai, hết chiều cao main.
const ctx = await trinh.newContext({ viewport: { width: rong, height: rong < 768 ? 812 : 900 }, deviceScaleFactor: 1 });
await ctx.addInitScript((s) => { try { localStorage.setItem('pisa-giao-dien', s ? 'light' : 'dark'); localStorage.setItem('pisa-ngon-ngu', 'vi'); } catch {} }, sang);
const r = await ctx.request.post(`${BASE}/api/demo/session`, { data: { userId: Number(vai) } });
if (!r.ok()) { console.error(`Đăng nhập vai ${vai}: ${r.status()}`); process.exit(1); }
const pw = await ctx.newPage();
await pw.goto(`${BASE}/${duong.replace(/^\//, '')}`, { waitUntil: 'networkidle' });
await pw.waitForTimeout(600);
for (let i = 0; i < 5; i++) {   // kéo dài khung nhìn tới khi main hết cuộn (bảng nạp thêm khi cao lên)
  const thua = await pw.evaluate(() => { const m = document.getElementById('noi-dung') ?? document.scrollingElement; return m.scrollHeight - m.clientHeight; });
  if (thua <= 1) break;
  await pw.setViewportSize({ width: rong, height: pw.viewportSize().height + thua });
  await pw.waitForTimeout(400);
}
const anhWeb = await pw.screenshot({ fullPage: true });

// Ghép: trang trắng hai cột, nhãn trên mỗi ảnh.
const pg = await (await trinh.newContext({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 1 })).newPage();
const url = (b) => `data:image/png;base64,${b.toString('base64')}`;
const nhan = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
await pg.setContent(`<body style="margin:0;background:#fff;font:600 14px system-ui;color:#111">
  <div style="display:flex;gap:24px;align-items:flex-start;padding:12px;width:max-content">
    <figure style="margin:0"><figcaption style="padding:0 0 8px">Mockup · ${nhan(path.basename(tep))} › ${nhan(khung)}</figcaption><img src="${url(anhMockup)}"></figure>
    <figure style="margin:0"><figcaption style="padding:0 0 8px">Web · ${nhan(duong)} · vai ${nhan(vai)} · ${rong} ${sang ? 'sáng' : 'tối'}</figcaption><img src="${url(anhWeb)}"></figure>
  </div></body>`);
await pg.waitForFunction(() => [...document.images].every((i) => i.complete));
fs.mkdirSync(path.dirname(ra), { recursive: true });
await pg.locator('body > div').screenshot({ path: ra });
await trinh.close();
console.log(`Ảnh cặp: ${ra}`);
