// Chụp ảnh màn hình có khoanh số cho sổ tay (PR-SOTAY-2). Chạy: `npm i --no-save playwright` rồi `node docs/so-tay/chup/chay.mjs [id…]`.
// Cần app chạy cục bộ trên bộ demo (README). CHỈ ĐỌC: không bao giờ bấm Lưu / Xác nhận / Gửi / Duyệt.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { dichSang } from '../../../shared/i18n/index.ts';

export const BASE = process.env.SO_TAY_BASE || 'http://localhost:5417';
export const THU_MUC = path.resolve('docs/so-tay');
export const anhCua = (lang, id) => path.join(THU_MUC, 'anh', lang, `${id}.png`);

/** Chữ trên màn theo tiếng: viết chữ Việt, ảnh EN tự lấy bản Anh của app (cùng từ điển `shared/i18n`). */
export const chu = (lang) => (vi) => (lang === 'en' ? dichSang('en', vi) : vi);

export async function moTrinhDuyet() {
  return chromium.launch({ channel: 'msedge' });
}

/** Cửa sổ đã đăng nhập demo `userId`. FULL: 1440 tối; điện thoại: 375 sáng. */
export async function cuaSo(browser, userId, { w = 1440, h = 900, theme = 'dark', lang = 'vi' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: theme,
    ...(w < 768 ? { isMobile: true, hasTouch: true } : {}) });
  await ctx.addInitScript(([theme, lang]) => {
    try {
      localStorage.setItem('pisa-giao-dien', theme);
      localStorage.setItem('pisa-ngon-ngu', lang);
      sessionStorage.setItem('pisa-ngon-ngu-vua-chon', '1');   // máy thắng tài khoản: không kéo về tiếng cũ
    } catch { /* bỏ qua */ }
  }, [theme, lang]);
  if (userId != null) {
    const r = await ctx.request.post(`${BASE}/api/demo/session`, { data: { userId } });
    if (!r.ok()) throw new Error(`Đăng nhập demo ${userId} lỗi ${r.status()}`);
  }
  return { ctx, page: await ctx.newPage(), w, h };
}

/** Ẩn phần chỉ có ở bản demo (thanh "Dữ liệu demo", chữ "Bản demo nội bộ") và dải "Mới dùng PISA?". */
export async function anDemo(page, lang) {
  const c = chu(lang);
  await page.evaluate(([moiDung, banDemo]) => {
    const thanh = document.querySelector('button[aria-label="Đổi tài khoản demo"]')?.closest('div[lang="vi"]');
    if (thanh) thanh.style.display = 'none';
    for (const el of document.querySelectorAll('div,span,b')) {
      const t = el.textContent.trim();
      if (el.children.length === 0 && t === banDemo) el.style.visibility = 'hidden';
      if (el.tagName === 'B' && t === moiDung) el.closest('.card')?.style.setProperty('display', 'none');
    }
  }, [c('Mới dùng PISA?'), c('Bản demo nội bộ')]);
}

async function nowKhung(page, w, toiDa) {
  const h = await page.evaluate(() => {
    const m = document.querySelector('main');   // app cuộn trong <main>, không cuộn cả trang
    return Math.ceil(Math.max(document.documentElement.scrollHeight, m ? m.getBoundingClientRect().top + m.scrollHeight : 0));
  });
  await page.setViewportSize({ width: w, height: Math.max(600, Math.min(h, toiDa)) });
  await page.waitForTimeout(250);
}

/**
 * Vẽ khung đỏ + số tròn rồi chụp.
 * marks: [{ n, loc: (page, c) => Locator, pad? }]; vung: (page, c) => Locator — chỉ chụp vùng này (mặc định: từ đầu trang tới dưới dấu thấp nhất).
 * Trả về { file, thieu: [n…] }.
 */
export async function khoanhVaChup(page, { w, lang, id, marks = [], vung, le = 16, cao = 0, toiDa = 2400, giuKhung = false }) {
  const c = chu(lang);
  await anDemo(page, lang);
  /* Không chụp màn lỗi: trang lỗi / không tải được → báo ✗, không lưu ảnh. */
  const loiTrang = await page.getByText(new RegExp(`${c('Trang gặp lỗi khi hiển thị.')}|${c('Không tải được')}`)).count();
  if (loiTrang) throw new Error('trang lỗi — không chụp');
  if (!giuKhung) await nowKhung(page, w, toiDa);
  const rects = [];
  const thieu = [];
  for (const m of marks) {
    let box = null;
    try {
      const loc = m.loc(page, c).first();
      await loc.waitFor({ state: 'visible', timeout: 4000 });
      box = await loc.boundingBox();
    } catch { /* thiếu */ }
    if (!box) { thieu.push(m.n); continue; }
    const p = m.pad ?? 4;
    rects.push({ n: m.n, x: box.x - p, y: box.y - p, w: box.width + 2 * p, h: box.height + 2 * p, phai: !!m.phai });
  }
  const sx = await page.evaluate(() => [window.scrollX, window.scrollY]);
  await page.evaluate(([rs, sx, sy]) => {
    const box = document.createElement('div');
    box.id = '__khoanh';
    box.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2147483647`;
    for (const r of rs) {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;left:${r.x + sx}px;top:${r.y + sy}px;width:${r.w}px;height:${r.h}px;border:2.5px solid #e11d48;border-radius:6px;box-shadow:0 0 0 1px rgba(255,255,255,.85)`;
      const n = document.createElement('div');
      n.textContent = String(r.n);
      n.style.cssText = (r.phai ? 'position:absolute;right:-13px;top:-13px;' : 'position:absolute;left:-13px;top:-13px;') + 'width:26px;height:26px;border-radius:50%;background:#e11d48;color:#fff;font:700 14px/26px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff';
      d.appendChild(n);
      box.appendChild(d);
    }
    document.body.appendChild(box);
  }, [rects, sx[0], sx[1]]);
  const vp = page.viewportSize();
  let clip;
  if (vung) {
    const b = await vung(page, c).first().boundingBox().catch(() => null);
    if (b) {
      const x0 = Math.max(0, Math.min(b.x, ...rects.map((r) => r.x)) - le);
      const y0 = Math.max(0, Math.min(b.y, ...rects.map((r) => r.y)) - le);
      const x1 = Math.min(vp.width, Math.max(b.x + b.width, ...rects.map((r) => r.x + r.w)) + le);
      const y1 = Math.min(vp.height, Math.max(b.y + b.height, ...rects.map((r) => r.y + r.h)) + le);
      clip = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    } else thieu.push('vung');
  }
  if (!clip) clip = { x: 0, y: 0, width: vp.width, height: rects.length ? Math.min(vp.height, Math.max(...rects.map((r) => r.y + r.h), 300) + 40) : vp.height };
  if (cao && clip.height > cao) clip.height = cao;
  const file = anhCua(lang, id);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, clip });
  await page.evaluate(() => document.getElementById('__khoanh')?.remove());
  return { file, thieu };
}

/** Một ảnh: mở `url` bằng tài khoản `user`, chạy `buoc` (mở panel, gõ thử — KHÔNG lưu), khoanh, chụp. */
export async function chayMotAnh(browser, fig, lang, cache) {
  const w = fig.w || 1440;
  const theme = fig.theme || (w < 768 ? 'light' : 'dark');
  const key = `${fig.user}|${w}|${theme}|${lang}`;
  if (!cache[key]) cache[key] = await cuaSo(browser, fig.user, { w, theme, lang });
  const { page } = cache[key];
  await page.setViewportSize({ width: w, height: fig.h || (w < 768 ? 812 : 900) });
  await page.goto(BASE + fig.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  if (fig.buoc) { await fig.buoc(page, chu(lang)); await page.waitForTimeout(500); }
  /* Panel bên phải (KhungPanel): chỉ chụp khung panel, giữ cỡ cửa sổ (panel cao bằng màn). */
  const vung = fig.vung ?? (fig.panel ? (p) => p.locator('[aria-modal="true"] > div[tabindex="-1"]').last() : undefined);
  return khoanhVaChup(page, { w, lang, id: fig.id, marks: fig.marks, vung, le: fig.le ?? (fig.panel ? 0 : undefined), cao: fig.cao, toiDa: fig.toiDa,
    giuKhung: fig.giuKhung ?? fig.panel });
}
