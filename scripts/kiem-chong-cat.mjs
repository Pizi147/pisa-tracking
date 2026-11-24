// KIỂM CHỐNG CẮT (SO-720, chủ SP 24/11): panel số / hộp neo KHÔNG bị cắt bởi mép màn hình (1280 · 1440 · 375, trang đã cuộn) HAY bởi phần tử của web
// (khung overflow của bảng cuộn ngang, đầu bảng dính, thanh tab / bộ lọc dính, chân điều hướng 375, panel khác). Đo: khung nằm TRỌN trong viewport và
// `elementFromPoint` ở 4 góc (lùi 8 px — qua bo góc) trả về chính khung (hoặc con của nó) — không phần tử nào che.
// Chạy (cần web + API demo đang chạy, đã seed):
//   KHUNG_BASE=http://localhost:5471 [PW=<đường tới playwright/index.js>] node scripts/kiem-chong-cat.mjs
// Thoát 0 = đạt cả; 1 = có ca hỏng (in từng ca).
import { pathToFileURL } from 'node:url';

const BASE = process.env.KHUNG_BASE ?? 'http://localhost:5173';
const pw = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright');
const chromium = pw.chromium ?? pw.default.chromium;
const TRANG = process.env.KHUNG_TRANG ?? 'phan-tich?goc=ket-qua-thi&kieu=toan-bo&cn=all';
const VAI = Number(process.env.KHUNG_VAI ?? 1);
const MAN = [{ w: 1440, h: 900, toi: true }, { w: 1280, h: 800, toi: true }, { w: 1280, h: 520, toi: true }, { w: 375, h: 812, toi: false }, { w: 375, h: 560, toi: false }];

const trinh = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch());
let hong = 0, dat = 0;

/** Khung `sel` nằm trọn viewport + 4 góc không bị phần tử ngoài khung che. */
const doKhung = (p, sel) => p.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return { loi: 'không thấy khung' };
  const r = el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
  const out = [];
  if (r.left < -0.5 || r.top < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5) out.push(`ra ngoài màn: ${[r.left, r.top, r.right, r.bottom].map(Math.round)} / ${vw}×${vh}`);
  for (const [n, x, y] of [['trên-trái', r.left + 8, r.top + 8], ['trên-phải', r.right - 8, r.top + 8], ['dưới-trái', r.left + 8, r.bottom - 8], ['dưới-phải', r.right - 8, r.bottom - 8]]) {
    const t = document.elementFromPoint(Math.min(Math.max(x, 0), vw - 1), Math.min(Math.max(y, 0), vh - 1));
    if (!t || !(el === t || el.contains(t))) out.push(`góc ${n} bị che bởi <${t?.tagName?.toLowerCase()} class="${String(t?.className).slice(0, 40)}">`);
  }
  return { loi: out.join(' | '), r: [r.left, r.top, r.right, r.bottom].map(Math.round) };
}, sel);

async function ca(ten, p, sel) {
  const k = await doKhung(p, sel);
  if (k.loi) { hong++; console.log(`✗ ${ten}: ${k.loi}`); } else { dat++; console.log(`✓ ${ten} ${k.r}`); }
}

for (const m of MAN) {
  const ctx = await trinh.newContext({ viewport: { width: m.w, height: m.h }, colorScheme: m.toi ? 'dark' : 'light' });
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate((id) => fetch('/api/demo/session', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: id }) }), VAI);
  await p.goto(`${BASE}/${TRANG}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);

  /* 1 · Panel số 720: ô đầu bảng, ô cuối bảng (sát mép phải), trang đã cuộn xuống. */
  for (const [nhan, cuon] of [['đầu', false], ['cuối', false], ['cuối, trang đã cuộn', true]]) {
    const nut = p.locator('button.so-bam');
    const n = await nut.count();
    if (!n) { hong++; console.log(`✗ [${m.w}] không có nút số`); continue; }
    const b = nhan === 'đầu' ? nut.first() : nut.last();
    if (cuon) await p.evaluate(() => document.querySelector('main')?.scrollTo(0, 99999));
    await b.scrollIntoViewIfNeeded();
    await b.click();
    await p.waitForTimeout(900);
    await ca(`[${m.w}] panel số · ô ${nhan}`, p, '[data-pn="so720"]');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    if (cuon) await p.evaluate(() => document.querySelector('main')?.scrollTo(0, 0));
  }

  /* 2 · Hộp neo Tuần dạy (HopNeo): ô điểm ở bảng Danh sách — ô phải nhất, thấp nhất; bảng cuộn ngang cuộn hết phải; trang cuộn đáy. */
  const diem = p.locator('button.o-diem-thi');
  const nd = await diem.count();
  if (!nd) console.log(`- [${m.w}] không có ô điểm Tuần dạy (bỏ qua hộp neo)`);
  else {
    for (const [nhan, i] of [['đầu', 0], ['cuối', nd - 1]]) {
      await p.evaluate(() => { for (const e of document.querySelectorAll('.table-scroll')) e.scrollLeft = 99999; document.querySelector('main')?.scrollTo(0, 99999); });
      const b = diem.nth(i);
      await b.scrollIntoViewIfNeeded();
      await b.click();
      await p.waitForTimeout(1000);
      await ca(`[${m.w}] hộp neo Tuần dạy · ô ${nhan} (bảng cuộn phải, trang cuộn đáy)`, p, '[role="dialog"][aria-label="Tuần dạy"]');
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    }
  }
  await ctx.close();
}
await trinh.close();
console.log(`\nChống cắt: ${dat} đạt, ${hong} hỏng`);
process.exit(hong ? 1 : 0);
