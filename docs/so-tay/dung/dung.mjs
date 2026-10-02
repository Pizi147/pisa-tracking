// Ghép sổ tay: nội dung (noi-dung/*.html) + ảnh khoanh số (chup/fig-*.mjs, anh/*.png) → HTML → PDF (Chrome).
// Chạy từ thư mục gốc repo:  node docs/so-tay/dung/dung.mjs giao-vien
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ANH } from '../chup/anh.mjs';

const ten = process.argv[2] || 'giao-vien';
const GOC = path.resolve('docs/so-tay');
const noiDung = fs.readFileSync(path.join(GOC, 'noi-dung', `${ten}.html`), 'utf8');
const css = fs.readFileSync(path.join(GOC, 'dung', 'so-tay.css'), 'utf8');
const TIEU_DE = { 'giao-vien': 'Sổ tay Giáo viên', 'quan-ly': 'Sổ tay Quản lý', 'giao-vien-gon': 'Sổ tay Giáo viên (gọn)', 'quan-ly-gon': 'Sổ tay Quản lý (gọn)' }[ten] || ten;

const dacTa = Object.fromEntries(ANH.map((a) => [a.id, a]));
const thieu = [];

function thayAnh(html) {
  // <fig id="g-04-luoi-ft"></fig>  hoặc  <fig id="…" cap="Tiêu đề riêng"></fig>
  return html.replace(/<fig id="([^"]+)"((?: (?:cap|ct)="[^"]*")*)\s*><\/fig>/g, (_, id, at) => {
    const cap = /cap="([^"]*)"/.exec(at)?.[1];
    const ct = /ct="([^"]*)"/.exec(at)?.[1]?.split(',').map(Number);
    const a = dacTa[id];
    const tep = path.join(GOC, 'anh', `${id}.png`);
    if (!a || !fs.existsSync(tep)) {
      thieu.push(id);
      return `<div class="thieu-anh">[Ảnh ${id} chưa có]</div>`;
    }
    const dong = (a.marks || [])
      .filter((m) => m.ghi && (!ct || ct.includes(m.n)))
      .map((m) => `<li><span class="so">${m.n}</span><span>${m.ghi}</span></li>`)
      .join('');
    const tieuDe = cap || a.tieu_de || '';
    const bm = fs.readFileSync(tep);
    const cr = bm.readUInt32BE(16) / 2, ca = bm.readUInt32BE(20) / 2;
    const dung = cr < 760 || ca / cr > 1.0 ? ' doc' : '';
    return `<figure class="anh${dung}"><img src="../anh/${id}.png" alt="${tieuDe.replace(/"/g, '&quot;')}">${
      tieuDe ? `<figcaption class="tieu-de-anh">${tieuDe}</figcaption>` : ''
    }${dong ? `<ol class="chu-thich">${dong}</ol>` : ''}</figure>`;
  });
}

const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>${TIEU_DE} — Pisa Tracking</title>
${[400, 500, 600, 700].map((w) => `<link rel="stylesheet" href="../../../node_modules/@fontsource/be-vietnam-pro/${w}.css">`).join('\n')}
<style>${css}</style></head><body>
${thayAnh(noiDung)}
</body></html>`;

const ra = path.join(GOC, '_dung');
fs.mkdirSync(ra, { recursive: true });
const tepHtml = path.join(ra, `${ten}.html`);
fs.writeFileSync(tepHtml, html);

const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage();
await p.goto('file:///' + tepHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
const ngay = '02/10/2026';
const tepPdf = path.join(GOC, `SO_TAY_${ten.toUpperCase().replace(/-/g, '_')}_2026-10-02.pdf`);
await p.pdf({
  path: tepPdf,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: '16mm', bottom: '16mm', left: '16mm', right: '16mm' },
  headerTemplate: '<span></span>',
  footerTemplate: `<div style="width:100%;font:9px 'Be Vietnam Pro',Arial,sans-serif;color:#667085;padding:0 16mm;display:flex;justify-content:space-between"><span>Pisa Tracking · ${TIEU_DE} · bản ${ngay}</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`,
});
await b.close();
console.log(`PDF: ${tepPdf}`);
if (thieu.length) console.log(`Thiếu ảnh: ${thieu.join(', ')}`);
