// SAU-THI-GON: chụp panel Sau thi (Công việc + hồ sơ HV) 1440 tối · 375 sáng, đủ trạng thái. Ghi DB (Học tiếp → Hoàn tác) — seed lại trước mỗi lượt.
// node docs/anh/sau-thi-gon/chup.mjs <base> <thư mục ra> (Playwright 1.6x, Edge `channel: 'msedge'`)
const [base, out, pw] = process.argv.slice(2);
const { chromium } = await import(pw ? `file:///${pw}` : 'playwright');
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const log = [];

async function trang(rong, toi, tvv) {
  const ctx = await browser.newContext({ viewport: { width: rong, height: rong > 500 ? 900 : 812 }, colorScheme: toi ? 'dark' : 'light', deviceScaleFactor: 1 });
  await ctx.addInitScript((c) => { try { localStorage.setItem('pisa-giao-dien', c); } catch { /* */ } }, toi ? 'dark' : 'light');
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log.push('pageerror ' + e.message));
  page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 400) log.push(`${r.status()} ${r.request().method()} ${r.url().replace(base, '')}`); });
  const r = await page.request.post(`${base}/api/demo/session`, { data: { userId: tvv } });
  if (!r.ok()) throw new Error('login ' + r.status());
  return { ctx, page };
}
const cho = (page) => page.waitForLoadState('networkidle').then(() => page.waitForTimeout(500));
async function anh(page, ten) {
  await cho(page);
  const f = await page.evaluate(() => document.fonts.check('16px "Be Vietnam Pro"'));
  if (!f) log.push(`${ten}: thiếu phông Be Vietnam Pro`);
  await page.screenshot({ path: `${out}/${ten}.png`, fullPage: false });
}
async function moViec(page, ten) {
  await page.goto(`${base}/cong-viec`); await cho(page);
  await page.getByRole('tab', { name: /^Sau thi/ }).first().click().catch(() => page.getByText('Sau thi', { exact: true }).first().click()); await cho(page);
  await page.locator('[data-hd="cv-dong"]', { hasText: ten }).first().click();
}

for (const [rong, toi] of [[1440, true], [375, false]]) {
  const hau = `${rong}-${toi ? 'toi' : 'sang'}`;
  /* Chưa KQ: Phan Hải Anh (cycle 41, TVV 31). */
  const a = await trang(rong, toi, 31);
  await moViec(a.page, 'Phan Hải Anh'); await anh(a.page, `${hau}-2-chua-kq`);
  /* B3-11: gõ đủ 4 điểm + chọn Học tiếp → chân MỘT nút (không lưu). */
  for (const [k, v] of [['L', '6.5'], ['R', '7.0'], ['W', '6.0'], ['S', '6.5']]) await a.page.getByLabel(`Điểm ${k}`).fill(v);
  await a.page.getByText('Học tiếp', { exact: true }).first().click();
  await anh(a.page, `${hau}-8-go-diem-hoc-tiep`);
  /* Hồ sơ HV › KQ thi thật (bản thứ hai trước PR). */
  await a.page.goto(`${base}/hoc-vien/35?viec=thi-that`); await anh(a.page, `${hau}-7-ho-so-kq`);
  await a.ctx.close();
  const { ctx, page } = await trang(rong, toi, 23);
  /* Danh sách: dòng Sau thi (A3-13). */
  await page.goto(`${base}/cong-viec`); await cho(page); await page.getByRole('tab', { name: /^Sau thi/ }).first().click().catch(() => page.getByText('Sau thi', { exact: true }).first().click());
  await anh(page, `${hau}-1-danh-sach`);
  /* Đã KQ: Đinh Ngọc Quyên (cycle 23). */
  await moViec(page, 'Đinh Ngọc Quyên'); await anh(page, `${hau}-3-da-kq`);
  if (rong === 1440) {
    /* Sau Học tiếp → Hoàn tác (chỉ một lượt: ghi DB). */
    await page.getByRole('radio', { name: /Học tiếp/ }).first().check({ force: true }).catch(async () => { await page.getByText('Học tiếp', { exact: true }).first().click(); });
    await page.waitForTimeout(300);
    await anh(page, `${hau}-4-chon-hoc-tiep`);
    await page.locator('footer button.btn-primary, [data-chan] button.btn-primary').last().click().catch(async () => { await page.getByRole('button', { name: /^Học tiếp$/ }).last().click(); });
    await cho(page);
    /* Công việc thay panel bằng "Hết việc …" — "Xem lại việc vừa lưu" mở lại panel (lỗi P1-07 hiện ở đây). */
    const xl = page.getByText(/Xem lại việc vừa lưu/).first();
    if (await xl.isVisible().catch(() => false)) await xl.click();
    await anh(page, `${hau}-5-sau-hoc-tiep`);
    const ht = page.getByRole('button', { name: 'Hoàn tác' }).last();
    if (await ht.isVisible().catch(() => false)) { await ht.click(); await anh(page, `${hau}-6-sau-hoan-tac`); } else log.push('không thấy nút Hoàn tác');
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/log.txt`, log.join('\n'));
console.log(log.join('\n') || 'ok');
