// SAU-THI-GON (chủ SP 21/11): "Không thi" tại chỗ — Công việc (dòng + panel), Lịch thi, hồ sơ HV; panel hồ sơ ba lựa chọn một hàng. TVV 31, em Phan Hải Anh (cycle 41, đã thi 05/09, chưa KQ).
// Ghi DB ở cảnh "sau bấm Không thi" (chỉ 1440) — seed lại trước mỗi lượt. node chup-khong-thi.mjs <base> <thư mục ra> <playwright index.mjs>
const [base, out, pw] = process.argv.slice(2);
const { chromium } = await import(`file:///${pw}`);
const fs = await import('node:fs');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const log = [];
const cho = (page) => page.waitForLoadState('networkidle').then(() => page.waitForTimeout(600));
const anh = async (page, ten) => { await cho(page); await page.screenshot({ path: `${out}/${ten}.png` }); };
for (const [rong, toi] of [[1440, true], [375, false]]) {
  const hau = `${rong}-${toi ? 'toi' : 'sang'}`;
  const ctx = await browser.newContext({ viewport: { width: rong, height: rong > 500 ? 900 : 812 }, colorScheme: toi ? 'dark' : 'light' });
  await ctx.addInitScript((c) => { try { localStorage.setItem('pisa-giao-dien', c); } catch { /* */ } }, toi ? 'dark' : 'light');
  const page = await ctx.newPage();
  const api = [];
  page.on('request', (r) => { if (r.url().includes('/api/') && r.method() === 'GET') api.push(r.url().replace(base, '')); });
  await page.request.post(`${base}/api/demo/session`, { data: { userId: 31 } });
  /* Công việc: dòng "Cập nhật KQ thi thật". */
  api.length = 0;
  await page.goto(`${base}/cong-viec`); await anh(page, `${hau}-11-cv-dong-kq`);
  log.push(`${hau} mở Công việc: ${api.length} GET`);
  /* Lịch thi. */
  api.length = 0;
  await page.goto(`${base}/hoc-vien?view=lich-thi`); await anh(page, `${hau}-12-lich-thi`);
  log.push(`${hau} mở Lịch thi: ${api.length} GET`);
  /* Hồ sơ HV: thanh Việc cần làm. */
  api.length = 0;
  await page.goto(`${base}/hoc-vien/35`); await anh(page, `${hau}-13-ho-so-viec`);
  log.push(`${hau} mở hồ sơ: ${api.length} GET`);
  /* Panel hồ sơ có KQ (Quyên của TVV 23): ba lựa chọn Bước tiếp. */
  await page.request.post(`${base}/api/demo/session`, { data: { userId: 23 } });
  await page.goto(`${base}/hoc-vien/21?viec=thi-that`); await anh(page, `${hau}-14-ho-so-buoc-tiep`);
  await page.request.post(`${base}/api/demo/session`, { data: { userId: 31 } });
  if (rong === 1440) {
    /* Panel Công việc bước 1 → bấm Không thi. */
    await page.goto(`${base}/cong-viec`); await cho(page);
    await page.locator('[data-hd="cv-dong"]', { hasText: 'Phan Hải Anh' }).first().locator('xpath=.').click({ position: { x: 40, y: 20 } });
    await anh(page, `${hau}-15-panel-buoc-1`);
    const kt = page.getByRole('button', { name: 'Không thi', exact: true }).last();
    if (await kt.isVisible().catch(() => false)) { await kt.click(); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${hau}-16-sau-khong-thi.png` }); await anh(page, `${hau}-16b-sau-khong-thi`); }
    else log.push('không thấy nút Không thi ở panel');
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/log-khong-thi.txt`, log.join('\n'));
console.log(log.join('\n'));
