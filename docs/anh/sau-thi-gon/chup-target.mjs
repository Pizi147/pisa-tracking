// SAU-THI-GON (chủ SP 21/11): ô Target của Học tiếp / Lộ trình mới là MỘT ô điểm. Chỉ đọc (không lưu).
// node docs/anh/sau-thi-gon/chup-target.mjs <base> <thư mục ra> <playwright index.mjs>
const [base, out, pw] = process.argv.slice(2);
const { chromium } = await import(`file:///${pw}`);
const browser = await chromium.launch({ channel: 'msedge' });
for (const [rong, toi] of [[1440, true], [375, false]]) {
  const hau = `${rong}-${toi ? 'toi' : 'sang'}`;
  const ctx = await browser.newContext({ viewport: { width: rong, height: rong > 500 ? 900 : 812 }, colorScheme: toi ? 'dark' : 'light' });
  await ctx.addInitScript((c) => { try { localStorage.setItem('pisa-giao-dien', c); } catch { /* */ } }, toi ? 'dark' : 'light');
  const page = await ctx.newPage();
  await page.request.post(`${base}/api/demo/session`, { data: { userId: 23 } });
  await page.goto(`${base}/cong-viec`); await page.waitForLoadState('networkidle');
  await page.getByText('Sau thi', { exact: true }).first().click(); await page.waitForLoadState('networkidle');
  await page.locator('[data-hd="cv-dong"]', { hasText: 'Đinh Ngọc Quyên' }).first().click(); await page.waitForLoadState('networkidle');
  await page.getByText('Học tiếp', { exact: true }).first().click();
  const o = page.getByLabel('Target').first();
  await o.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${hau}-9-hoc-tiep-target.png` });
  await page.getByText('Lộ trình mới', { exact: true }).first().click(); await page.waitForLoadState('networkidle');
  await page.getByLabel('Target').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${hau}-10-lo-trinh-moi-target.png` });
  await ctx.close();
}
await browser.close();
console.log('ok');
