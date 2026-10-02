// Chụp ảnh màn hình có khoanh số cho sổ tay. Chạy: `npm i --no-save playwright` rồi `node docs/so-tay/chup/chay.mjs [nhóm]`.
// Cần bản demo đang chạy ở http://localhost:5417 (xem README trong thư mục này). CHỈ ĐỌC: không bao giờ bấm Lưu/Xác nhận/Gửi.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const BASE = process.env.SO_TAY_BASE || 'http://localhost:5417';
export const THU_MUC = path.resolve('docs/so-tay');
export const OUT = path.join(THU_MUC, 'anh');

export async function moTrinhDuyet() {
  return chromium.launch({ channel: 'chrome' });
}

/** Một cửa sổ đã đăng nhập bằng tài khoản demo `userId` (không cần mật khẩu). */
export async function cuaSo(browser, userId, { w = 1440, h = 900, scheme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: scheme, locale: 'vi-VN' });
  // Sổ in: luôn giao diện SÁNG (khoá lưu của nút ◐ là 'pisa-giao-dien').
  await ctx.addInitScript(() => { try { localStorage.setItem('pisa-giao-dien', 'light'); } catch { /* bỏ qua */ } });
  if (userId != null) {
    const r = await ctx.request.post(`${BASE}/api/demo/session`, { data: { userId } });
    if (!r.ok()) throw new Error(`Đăng nhập demo ${userId} lỗi ${r.status()}`);
  }
  const page = await ctx.newPage();
  return { ctx, page, w, h };
}

/** Ẩn thanh vàng "Bản demo nội bộ" và dòng chữ demo dưới logo (không có ở bản chính). */
export async function anDemo(page) {
  await page.evaluate(() => {
    for (const b of document.querySelectorAll('button')) {
      if (b.textContent.trim() === 'Đổi tài khoản demo') b.parentElement.style.display = 'none';
    }
    for (const el of document.querySelectorAll('span,div,p')) {
      if (el.children.length === 0 && /Bản demo nội bộ/.test(el.textContent)) el.style.visibility = 'hidden';
    }
  });
}

async function nowKhung(page, w, toiDa = 3200) {
  const h = await page.evaluate(() => {
    const m = document.querySelector('main');
    return Math.max(900, Math.ceil((m ? m.scrollHeight : document.body.scrollHeight) + 140));
  });
  await page.setViewportSize({ width: w, height: Math.min(h, toiDa) });
  await page.waitForTimeout(250);
}

/**
 * Vẽ khung đỏ + số tròn rồi chụp.
 * marks: [{ n, loc: (page) => Locator, pad?: number }]; vung: (page) => Locator — chỉ chụp vùng này (mặc định: từ đầu trang tới dưới dấu thấp nhất).
 * Trả về { file, thieu: [n…] } (thieu = số không tìm được phần tử).
 */
export async function khoanhVaChup(page, w, id, marks, { vung, le = 24, nowChieuCao = true, panel = false, cao = 0 } = {}) {
  await anDemo(page);
  if (nowChieuCao && !panel) await nowKhung(page, w);
  const rects = [];
  const thieu = [];
  for (const m of marks) {
    let box = null;
    try {
      const loc = m.loc(page).first();
      await loc.waitFor({ state: 'visible', timeout: 4000 });
      box = await loc.boundingBox();
    } catch { /* thiếu */ }
    if (!box) { thieu.push(m.n); continue; }
    const p = m.pad ?? 4;
    rects.push({ n: m.n, x: box.x - p, y: box.y - p, w: box.width + 2 * p, h: box.height + 2 * p });
  }
  await page.evaluate((rs) => {
    const box = document.createElement('div');
    box.id = '__khoanh';
    box.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    for (const r of rs) {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;border:2.5px solid #e11d48;border-radius:6px;box-shadow:0 0 0 1px rgba(255,255,255,.85)`;
      const n = document.createElement('div');
      n.textContent = String(r.n);
      n.style.cssText = 'position:absolute;left:-13px;top:-13px;width:26px;height:26px;border-radius:50%;background:#e11d48;color:#fff;font:700 14px/26px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff';
      d.appendChild(n);
      box.appendChild(d);
    }
    document.body.appendChild(box);
  }, rects);
  const vp = page.viewportSize();
  let clip;
  if (vung) {
    const b = await vung(page).first().boundingBox();
    if (b) {
      const x0 = Math.max(0, Math.min(b.x, ...rects.map((r) => r.x)) - le);
      const y0 = Math.max(0, Math.min(b.y, ...rects.map((r) => r.y)) - le);
      const x1 = Math.min(vp.width, Math.max(b.x + b.width, ...rects.map((r) => r.x + r.w)) + le);
      const y1 = Math.min(vp.height, Math.max(b.y + b.height, ...rects.map((r) => r.y + r.h)) + le);
      clip = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    }
  }
  if (!clip) {
    const maxY = Math.max(...rects.map((r) => r.y + r.h), 200);
    clip = { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, maxY + 60) };
  }
  if (cao && clip.height > cao) clip.height = cao;
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${id}.png`);
  await page.screenshot({ path: file, clip });
  await page.evaluate(() => document.getElementById('__khoanh')?.remove());
  return { file, thieu };
}

export async function chayMotAnh(browser, fig, cache) {
  const key = `${fig.user}|${fig.w || 1440}`;
  if (!cache[key]) cache[key] = await cuaSo(browser, fig.user, { w: fig.w || 1440 });
  const { page, w } = cache[key];
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(BASE + fig.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  if (fig.buoc) await fig.buoc(page);
  await page.waitForTimeout(300);
  const kq = await khoanhVaChup(page, w, fig.id, fig.marks, { vung: fig.vung, le: fig.le, panel: fig.panel, cao: fig.cao });
  return kq;
}
