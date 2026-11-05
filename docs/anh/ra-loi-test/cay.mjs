// Rà theo cây: chuỗi bộ chọn [mở lớp] → [ô điểm / chip] → [nút trong hộp] → [nút trong hộp con]; mỗi đường đi tải lại trang rồi phát lại.
// Chỉ đi sâu khi bước vừa bấm mở ra hộp / menu mới. Trước khi bấm trong hộp: điền mọi ô nhập bằng một giá trị.
// node cay.mjs <base> <vai=id,...> <rong,...> <kịch bản,...>
import { chromium } from 'playwright';
import fs from 'node:fs';
const [base, vaiArg, rongArg, kbArg] = process.argv.slice(2);
const VAI = Object.fromEntries(vaiArg.split(',').map((s) => s.split('=')));
const RONG = rongArg.split(',').map(Number);
const OUT = process.env.OUT ?? 'cay.jsonl';
const HOP = ':is([role=dialog],[role=menu],[role=listbox]):visible';
const NUT_HOP = `button:visible, [role=menuitem]:visible, [role=option]:visible, a[href]:visible`;
const KB = {
  'lich-o': { trang: '/test/lich', buoc: [['#noi-dung td[data-kn] button', 6], [null, 14], [null, 6], [null, 4]] },
  'lich-mo-lop': { trang: '/test/lich?loai=tat-ca', buoc: [['#noi-dung button:is([aria-label^="Mở lớp"],:has-text("Mở tất cả"))', 4], ['#noi-dung td[data-kn] button', 4], [null, 12], [null, 5]] },
  'lich-thuong': { trang: '/test/lich?loai=thuong', buoc: [['#noi-dung button:is([aria-label^="Mở lớp"],:has-text("Mở tất cả"))', 3], ['#noi-dung td button', 6], [null, 12], [null, 5]] },
  'lich-nut': { trang: '/test/lich', buoc: [['#noi-dung button:not(td button)', 30], [null, 12], [null, 5]] },
  'kh-lop': { trang: '/test/ke-hoach', buoc: [['#noi-dung button[aria-label^="Mở lớp"]', 3], ['#noi-dung table button', 10], [null, 12], [null, 6]] },
  'kh-nut': { trang: '/test/ke-hoach', buoc: [['#noi-dung button:not(table button)', 30], [null, 12], [null, 6]] },
  'lich-375': { trang: '/test/lich?loai=tat-ca', buoc: [['#noi-dung button:is([aria-label^="Mở lớp"],:has-text("Mở tất cả"))', 4], ['#noi-dung :is(input:not([type=checkbox]), button[aria-label*="Nhập"], button[aria-label^="Vắng"], button[aria-label^="Nhận xét"], button[aria-label*="⋯"], button[aria-label^="Thêm thao tác"])', 12], [null, 12], [null, 5]] },
  'cham': { trang: '/test/cham', buoc: [['#noi-dung button', 20], [null, 12], [null, 6]] },
};
const GIA_TRI = ['7', '-', 'abc', '6.5', ''];
const browser = await chromium.launch({ channel: 'msedge' });
const ghi = (o) => { fs.appendFileSync(OUT, JSON.stringify(o) + '\n'); if (o.loi?.length) console.log('LỖI', JSON.stringify(o).slice(0, 900)); };
function gan(page) {
  page.__loi = [];
  page.on('pageerror', (e) => page.__loi.push('pageerror: ' + String(e.message).slice(0, 300)));
  page.on('console', (m) => { const s = m.text(); if (m.type() === 'error' && !/Failed to load resource|net::ERR|^Warning:/.test(s)) page.__loi.push('console: ' + s.slice(0, 400)); });
  page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 500) page.__loi.push(`api ${r.status()} ${r.request().method()} ${r.url().replace(base, '')}`); });
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
}
async function kiem(page) {
  const bien = await page.locator('[role=alert]:has-text("Trang gặp lỗi")').count().catch(() => 0);
  const l = [...page.__loi]; if (bien) l.push('ERROR-BOUNDARY'); page.__loi.length = 0; return l;
}
const dsBuoc = (page, sel) => sel ? page.locator(sel) : page.locator(HOP).last().locator(NUT_HOP);
async function soHop(page) { return page.locator(HOP).count(); }
async function tenCua(loc) { return ((await loc.getAttribute('aria-label').catch(() => null)) || (await loc.textContent().catch(() => '')) || '').trim().replace(/\s+/g, ' ').slice(0, 40); }
async function dien(page, v) {
  const o = page.locator(HOP).last().locator('input:visible:not([type=checkbox]):not([type=radio]):not([type=file]), textarea:visible');
  const n = Math.min(await o.count().catch(() => 0), 6);
  for (let i = 0; i < n; i++) await o.nth(i).fill(v, { timeout: 800 }).catch(() => {});
}
/** Phát lại đường đi; trả tên các bước hoặc null nếu không phát lại được. */
async function phat(page, kb, duong) {
  await page.goto(kb.trang, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300); await kiem(page);
  const ten = [];
  for (let l = 0; l < duong.length; l++) {
    const [sel] = kb.buoc[l];
    if (!sel) await dien(page, GIA_TRI[(duong[l] + l) % GIA_TRI.length]);
    const loc = dsBuoc(page, sel).nth(duong[l]);
    ten.push(await tenCua(loc));
    try {
      const la = await loc.evaluate((e) => e.tagName === 'INPUT' || e.tagName === 'TEXTAREA').catch(() => false);
      if (la) { await loc.fill(GIA_TRI[(duong[l] + 1) % GIA_TRI.length], { timeout: 2000 }); await page.keyboard.press('Enter'); }
      else await loc.click({ timeout: 2000 });
    } catch { return { ten, hong: true }; }
    await page.waitForTimeout(500);
    const loi = await kiem(page);
    if (loi.length) return { ten, loi };
  }
  return { ten };
}
async function di(page, kb, duong, ctx) {
  const l = duong.length;
  if (l >= kb.buoc.length) return;
  const [sel, tran] = kb.buoc[l];
  const r0 = await phat(page, kb, duong); if (r0.hong || r0.loi) return;
  const hopTruoc = await soHop(page);
  if (!sel && !hopTruoc) return;
  const tong = await dsBuoc(page, sel).count().catch(() => 0);
  const chon = tong <= tran ? [...Array(tong).keys()] : [...new Set([...Array(tran).keys()].map((k) => Math.floor((k * tong) / tran)))];
  for (const i of chon) {
    const r = await phat(page, kb, [...duong, i]);
    if (r.loi) { ghi({ ...ctx, duong: r.ten, loi: r.loi }); continue; }
    if (r.hong) continue;
    /* Đi sâu khi bước tiếp là bộ chọn trang (không cần hộp) hoặc vừa có hộp mới / hộp vẫn mở. */
    const sau = kb.buoc[l + 1]; if (!sau) continue;
    if (sau[0] || (await soHop(page)) > 0) await di(page, kb, [...duong, i], ctx);
  }
}
for (const [vai, id] of Object.entries(VAI)) for (const rong of RONG) {
  const ctx = await browser.newContext({ viewport: { width: rong, height: rong < 800 ? 812 : 900 }, baseURL: base });
  const r = await ctx.request.post('/api/demo/session', { data: { userId: Number(id) } });
  if (!r.ok()) { ghi({ vai, rong, loi: ['login ' + r.status()] }); await ctx.close(); continue; }
  const page = await ctx.newPage(); gan(page);
  await page.route('**/api/demo/config', (x) => x.abort());
  for (const k of kbArg.split(',')) { const t0 = Date.now(); await di(page, KB[k], [], { vai, rong, kb: k }); ghi({ vai, rong, kb: k, xong: Math.round((Date.now() - t0) / 1000) }); }
  await ctx.close();
}
await browser.close();
