// CONG-CU BADGE-QUA-HAN: chụp trang + phóng to nhãn hạn đầu tiên ("quá hạn" / "hạn hôm nay"…) — dùng cho ảnh trước │ sau.
// Chạy: KHUNG_BASE=http://localhost:5270 node scripts/chup-badge-han.mjs <thư mục ra> <tiền tố truoc|sau> <tên> <đường> <vai> [BAM]
// 1440 tối + 375 sáng. BAM="css:bộ chọn" hoặc tên nút: bấm trước khi chụp (mở panel).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [ra, tienTo, ten, duong, vai, bam = ''] = process.argv.slice(2);
const BASE = process.env.KHUNG_BASE ?? 'http://localhost:5173';
const trinh = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch());
fs.mkdirSync(ra, { recursive: true });
for (const rong of [1440, 375]) {
  const sang = rong < 768;
  const ctx = await trinh.newContext({ viewport: { width: rong, height: rong < 768 ? 812 : 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => { try { localStorage.setItem('pisa-giao-dien', s ? 'light' : 'dark'); localStorage.setItem('pisa-ngon-ngu', 'vi'); } catch {} }, sang);
  await ctx.request.post(`${BASE}/api/demo/session`, { data: { userId: Number(vai) } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/${duong.replace(/^\//, '')}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  for (const b of bam.split('|').filter(Boolean)) {
    if (b.startsWith('css:')) await p.locator(b.slice(4)).first().click();
    else await p.getByRole('button', { name: new RegExp(`^${b}`) }).filter({ visible: true }).first().click();
    await p.waitForTimeout(1200);
  }
  const phong = await p.evaluate(() => document.fonts.check('600 14px "Be Vietnam Pro"'));
  /* Nhãn hạn nhỏ nhất có chữ "quá hạn n ngày" / "Quá hạn · n ngày" / "hôm nay" (đang hiện) — vùng phóng to quanh nó. */
  const vung = await p.evaluate(() => {
    const tim = (re) => [...document.querySelectorAll('main span, main b, main div, aside span, [role=dialog] span')]
      .filter((e) => re.test(e.textContent.trim()) && e.textContent.trim().length < 40 && e.getBoundingClientRect().width > 0)
      .sort((a, b) => a.textContent.length - b.textContent.length)[0];
    /* Ưu tiên nhãn hạn ("quá hạn 5 ngày"), không phải số đếm ("3 quá hạn"). */
    const e = tim(/quá hạn( ·)? ?\d+ ngày/i) ?? tim(/^hạn hôm nay|^hôm nay$/i);
    if (!e) return null;
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    return { x: Math.max(0, r.x - 260), y: Math.max(0, r.y - 40), width: Math.min(innerWidth - Math.max(0, r.x - 260), r.width + 520), height: r.height + 80 };
  });
  const dau = path.join(ra, `${ten}-${rong}-${tienTo}`);
  await p.mouse.move(0, 0);
  await p.screenshot({ path: `${dau}.png`, scale: 'css' });
  if (vung) {
    await p.screenshot({ path: `${dau}-zoom.png`, clip: vung, scale: 'device' });
  }
  console.log(`${dau}: phông ${phong ? 'ok' : 'THIẾU'} · nhãn ${vung ? 'có' : 'KHÔNG'}`);
  await ctx.close();
}
await trinh.close();
