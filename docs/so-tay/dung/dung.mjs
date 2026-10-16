// Dựng 10 sổ tay PDF (PR-SOTAY-2): nội dung `noi-dung/*.mjs` + Hướng dẫn trên web (`shared/huongDan`, cùng chữ với app) + ảnh `anh/{vi,en}`
// → HTML (`_dung/`) → PDF (Edge headless qua Playwright) ở `ban-2026-10/`, rồi KIỂM: thiếu ảnh, MINI ≤ 4 trang, chữ nút có trên app, chữ lỗi thời.
// Chạy từ thư mục gốc repo:  node docs/so-tay/dung/dung.mjs [mã sổ…]   (mã: gv-mini gv-full gvnn-mini … ; trống = cả 10). Thoát mã 1 khi kiểm đỏ.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { HUONG_DAN } from '../../../shared/huongDan/index.ts';
import { dichSang } from '../../../shared/i18n/index.ts';
import { SO } from '../noi-dung/so.mjs';

const GOC = path.resolve('docs/so-tay');
const RA_PDF = path.join(GOC, 'ban-2026-10');
const RA_HTML = path.join(GOC, '_dung');
const NGAY = '16/10/2026';
const css = fs.readFileSync(path.join(GOC, 'dung', 'so-tay.css'), 'utf8');
const loi = [];

// ---------------------------------------------------------------- dựng HTML

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
/** Chữ của Hướng dẫn trên web theo tiếng; `<b>` của app thành `<kbd>`-không-kiểm (đậm). */
const hd = (lang, s) => (s ? dichSang(lang, s) : '');

function anh(lang, a, thieu) {
  if (!a) return '';
  const { id, cap = '', chu = [], nho = false } = typeof a === 'string' ? { id: a } : a;
  const tep = path.join(GOC, 'anh', lang, `${id}.png`);
  if (!fs.existsSync(tep) || fs.statSync(tep).size < 8000) { thieu.push(`${lang}/${id}`); return `<div class="thieu-anh">[${id}]</div>`; }
  const bm = fs.readFileSync(tep);
  const r = bm.readUInt32BE(16), c = bm.readUInt32BE(20);
  const kieu = r < 1000 ? ' dien-thoai' : c / r > 0.9 ? ' cao' : '';
  return `<figure class="anh${kieu}${nho ? ' nho' : ''}"><img src="../anh/${lang}/${id}.png" alt="${esc(cap)}">${
    cap ? `<figcaption>${cap}</figcaption>` : ''}${chu.length ? `<ol class="chu-thich">${chu.map((x, i) => `<li><span class="so">${i + 1}</span><span>${x}</span></li>`).join('')}</ol>` : ''}</figure>`;
}

const T = {
  vi: { ai: 'Ai làm', han: 'Hạn', o: 'Làm ở đâu', buoc: 'Các bước', xong: 'Xong thì thấy gì', sua: 'Làm sai thì sửa thế nào', chan: 'Bị chặn khi nào', loi: 'Lỗi hay gặp', cach: 'Cách sửa', viec: '5 việc hằng tuần', man: 'Theo màn', luat: 'Luật và hạn', tu: 'Thuật ngữ', hoi: 'Câu hỏi thường gặp', quyen: 'Ai làm được gì', han2: 'Bảng hạn', phuLuc: 'Phụ lục · Nhập từ Excel và làm cả lô', nho: 'Nhớ ba điều', muc: 'Trong sổ này', khi: 'Khi nào', ban: 'bản', khung: 'Thanh trên cùng', mini: 'Bản rút gọn: 5 việc hằng tuần. Đủ mọi màn, mọi luật: xem bản FULL hoặc nút ? trên web.' },
  en: { ai: 'Who', han: 'Deadline', o: 'Where', buoc: 'Steps', xong: 'When it is done', sua: 'Fix a mistake', chan: 'When it is blocked', loi: 'Common mistakes', cach: 'Fix', viec: '5 weekly tasks', man: 'Screen by screen', luat: 'Rules and deadlines', tu: 'Glossary', hoi: 'FAQ', quyen: 'Who can do what', han2: 'Deadline table', phuLuc: 'Appendix · Many at once', nho: 'Remember three things', muc: 'In this manual', khi: 'When', ban: 'edition', khung: 'Top bar', mini: 'Short version: your 5 weekly tasks. Every screen and rule: see the FULL manual or the ? button in the app.' },
};

function viecHtml(so, v, full, thieu) {
  const t = T[so.lang];
  const meta = [[t.ai, v.ai], [t.han, v.han], [t.o, v.o]].filter(([, x]) => x)
    .map(([k, x]) => `<div><span class="nhan">${k}</span> ${x}</div>`).join('');
  const bang = (ds) => `<table class="loi-hay"><tr><th>${t.loi}</th><th>${t.cach}</th></tr>${ds.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`;
  const them = full ? [[t.xong, v.xong], [t.sua, v.sua], [t.chan, v.chan]].filter(([, x]) => x)
    .map(([k, x]) => `<div class="khoi-nho"><span class="ten-khoi">${k}</span> ${x}</div>`).join('') : '';
  return `<section class="viec${full ? '' : ' gon'}"><h2>${v.ten}</h2><div class="meta">${meta}</div>
    <div class="than">${anh(so.lang, v.anh, thieu)}<div class="chu"><ol class="buoc">${v.buoc.map((b) => `<li>${b}</li>`).join('')}</ol>${them}${v.loi?.length ? bang(v.loi) : ''}</div></div>
    ${full && v.anhThem ? v.anhThem.map((a) => anh(so.lang, a, thieu)).join('') : ''}</section>`;
}

function theoMan(so, thieu) {
  const { lang } = so;
  const h = HUONG_DAN[so.vai];
  return h.man.map((m) => {
    const anhs = (so.anhMan?.[m.id] ?? []).map((a) => anh(lang, a, thieu)).join('');
    const muc = m.muc.map((x) => `<div class="muc"><h3>${hd(lang, x.ten)}</h3><ul>${x.buoc.map((b) => `<li>${hd(lang, b)}</li>`).join('')}</ul></div>`).join('');
    return `<section class="man"><h2>${hd(lang, m.ten)}</h2>${so.themMan?.[m.id] ?? ''}${anhs}${muc}</section>`;
  }).join('');
}

function luatHd(so) {
  const { lang } = so;
  return HUONG_DAN[so.vai].luat.map((x) => `<div class="muc luat-muc"><h3>${hd(lang, x.ten)}</h3><ul>${x.buoc.map((b) => `<li>${hd(lang, b)}</li>`).join('')}</ul></div>`).join('');
}

const tuHd = (so) => `<table class="tu"><tr><th>${T[so.lang].tu}</th><th></th></tr>${
  [...HUONG_DAN[so.vai].tu, ...(so.tuThem ?? [])].map((x) => `<tr><td><b>${hd(so.lang, x.ten)}</b></td><td>${hd(so.lang, x.nghia)}</td></tr>`).join('')}</table>`;

const bangHtml = (cot, hang, lop = '') => `<table class="${lop}"><tr>${cot.map((c) => `<th>${c}</th>`).join('')}</tr>${
  hang.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

function dungHtml(so, ban) {
  const t = T[so.lang];
  const thieu = [];
  const full = ban === 'full';
  const tieuDe = `${so.ten} · ${full ? 'FULL' : 'MINI'}`;
  let than = `<header class="dau-mini"><div class="nhan-so">PISA Tracking · ${so.doiTuong}</div><h1>${tieuDe}</h1><p class="phu">${t.mini}</p>
    <div class="nho-ba">${so.nho.map((x, i) => `<div><span class="so-lon">${i + 1}</span>${x}</div>`).join('')}</div>${so.khacNhau ?? ''}</header>`;
  if (full) {
    than = `<section class="bia"><div class="nhan">PISA Tracking</div><h1>${so.ten}</h1><p class="phu">${so.phu}</p>
      <div class="ban">${so.lang === 'en' ? 'Edition' : 'Bản'} ${NGAY} · ${so.lang === 'en' ? 'screenshots from the app (demo data)' : 'ảnh chụp từ app (dữ liệu demo)'}</div></section>
      <section><h1 class="khong-ngat">${t.nho}</h1><div class="nho-ba lon">${so.nho.map((x, i) => `<div><span class="so-lon">${i + 1}</span>${x}</div>`).join('')}</div>
      <h2>${t.muc}</h2><ol class="muc-luc">${[t.khung, t.viec, t.man, t.luat, t.quyen, t.hoi, t.tu, t.phuLuc].map((x) => `<li>${x}</li>`).join('')}</ol>
      ${so.khacNhau ?? ''}${so.gioiThieu ?? ''}</section>
      <section><h1 class="khong-ngat">${t.khung}</h1>${anh(so.lang, so.khung, thieu)}${so.khungChu ?? ''}</section>`;
  }
  than += `${full ? `<h1>${t.viec}</h1>${so.viecMoDau ?? ''}` : ''}${so.viec.map((v) => viecHtml(so, v, full, thieu)).join('')}`;
  if (full) {
    than += `<h1>${t.man}</h1>${theoMan(so, thieu)}
      <h1>${t.luat}</h1><h2>${t.han2}</h2>${bangHtml(so.bangHan.cot, so.bangHan.hang, 'bang-han')}${so.luatThem ?? ''}${luatHd(so)}
      <h1>${t.quyen}</h1>${bangHtml(so.quyen.cot, so.quyen.hang, 'quyen')}${so.quyenGhi ?? ''}
      <h1>${t.hoi}</h1>${so.hoi.map(([q, a]) => `<div class="hoi"><b>${q}</b><p>${a}</p></div>`).join('')}
      <h1>${t.tu}</h1>${tuHd(so)}
      <h1>${t.phuLuc}</h1>${so.phuLuc.map((f) => (typeof f === 'function' ? f(anh, thieu) : f)).join('')}`;
  }
  const html = `<!doctype html><html lang="${so.lang}"><head><meta charset="utf-8"><title>${tieuDe}</title>
${[400, 500, 600, 700].map((w) => `<link rel="stylesheet" href="../../../node_modules/@fontsource/be-vietnam-pro/${w}.css">`).join('\n')}
<style>${[400, 500, 600, 700].map((w) => `@font-face{font-family:'Be Vietnam Pro';font-weight:${w};unicode-range:U+0030-0039;src:url('../../../node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff2') format('woff2')}`).join('')}
${css}</style></head><body class="${full ? 'full' : 'mini'}">${than}</body></html>`;
  return { html, thieu, tieuDe };
}

// ---------------------------------------------------------------- kiểm chữ

/** Mọi chữ trong `<kbd>` (tên nút / nhãn / tab chép từ app) phải có trong mã: VI ở web/src + shared, EN ở shared/i18n/en. "n" / số = biến. */
function khoKiem(lang) {
  const doc = (d) => fs.readdirSync(d, { recursive: true }).filter((f) => /\.(tsx?|mjs)$/.test(f) && !/(^|[\\/])tests[\\/]/.test(f))
    .map((f) => fs.readFileSync(path.join(d, f), 'utf8')).join('\n');
  /* EN: chỉ phần dịch (bỏ khoá chữ Việt `'…':`), để chữ Việt không lọt qua kiểm sổ tiếng Anh. */
  return lang === 'en' ? doc(path.resolve('shared/i18n/en')).replace(/(['"`])(?:\\.|(?!\1).)*\1\s*:/g, ' ')
    : doc(path.resolve('web/src')) + doc(path.resolve('shared'));
}
const KHO = {};
function kiemNut(so, html, ma) {
  KHO[so.lang] ??= khoKiem(so.lang).replace(/\s+/g, ' ');
  const ds = [...html.matchAll(/<kbd>(.*?)<\/kbd>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').trim());
  for (const nhan of new Set(ds)) {
    const mau = nhan.split(/(\b\d+\b|\bn\b|…|\.\.\.)/).map((p, i) => (i % 2 ? (p === '…' || p === '...' ? '(…|\\.\\.\\.)?' : '[^\'"`<]{0,40}?') : p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('');
    if (!new RegExp(mau).test(KHO[so.lang])) loi.push(`${ma}: chữ "${nhan}" không có trên app (${so.lang})`);
  }
}

/** Chữ lỗi thời (kế hoạch cũ Task 6 + chủ SP 16/10). */
const LOI_THOI = [
  /Nợ tuần trước/i, /MT lịch sử/i, /Để QL biết/i, /Case chờ duyệt/i, /hạn 4 tuần/i, /Nộp kế hoạch bổ trợ/i, /Đánh dấu kỳ vọng đầu ra/i,
  /Nhắc tất cả/i, /Remind all/i, /Pending Case/i, /Submit support plan/i,
];
function kiemChu(so, html, ma) {
  html = html.slice(html.indexOf('<body'));
  const chu = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const re of LOI_THOI) if (re.test(chu)) loi.push(`${ma}: còn chữ lỗi thời ${re}`);
  /* Sổ EN: không còn chữ Việt (tên riêng trong ảnh không tính — ảnh là tệp, không phải chữ). */
  if (so.lang === 'en') for (const m of chu.matchAll(/\S*[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]\S*/gi)) loi.push(`${ma}: chữ Việt trong sổ EN: "${chu.slice(Math.max(0, m.index - 30), m.index + 30)}"`);
  /* SOS 2–3 không còn "Trao đổi ngắn với HV" (OV-13n): câu nào có cả hai mà không có "không" là sai. */
  const khoi = html.replace(/<\/(p|li|td|th|h\d|div|b)>/g, '\n').replace(/<[^>]+>/g, ' ');
  for (const cau of khoi.split(/\n|(?<=[.;])\s/)) {
    if (/Trao đổi ngắn với HV/.test(cau) && /SOS 2|SOS 3|SOS 2–3/.test(cau) && !/không|GVCN tự thêm/.test(cau)) loi.push(`${ma}: "Trao đổi ngắn với HV" đi với SOS 2–3: ${cau.slice(0, 90)}`);
  }
}

// ---------------------------------------------------------------- in PDF

const chon = process.argv.slice(2);
fs.mkdirSync(RA_PDF, { recursive: true });
fs.mkdirSync(RA_HTML, { recursive: true });
const b = await chromium.launch({ channel: 'msedge' });
const bao = [];
for (const so of SO) {
  for (const ban of ['mini', 'full']) {
    const ma = `${so.ma}-${ban}`;
    if (chon.length && !chon.includes(ma) && !chon.includes(so.ma)) continue;
    const { html, thieu, tieuDe } = dungHtml(so, ban);
    if (thieu.length) loi.push(`${ma}: thiếu ảnh ${thieu.join(', ')}`);
    kiemNut(so, html, ma);
    kiemChu(so, html, ma);
    const tepHtml = path.join(RA_HTML, `${ma}.html`);
    fs.writeFileSync(tepHtml, html);
    const p = await b.newPage();
    await p.goto('file:///' + tepHtml.split(path.sep).join('/'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const tenPdf = `${so.tenPdf} - ${ban.toUpperCase()}.pdf`;
    const chan = `PISA Tracking · ${tieuDe} · ${T[so.lang].ban} ${NGAY}`;
    const buf = await p.pdf({
      path: path.join(RA_PDF, tenPdf), format: 'A4', printBackground: true, displayHeaderFooter: true,
      margin: { top: '14mm', bottom: '15mm', left: '14mm', right: '14mm' },
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font:8.5px Arial,sans-serif;color:#667085;padding:0 14mm;display:flex;justify-content:space-between"><span>${chan}</span><span><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`,
    });
    await p.close();
    const trang = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    if (ban === 'mini' && (trang < 2 || trang > 4)) loi.push(`${ma}: MINI ${trang} trang (cần 2–4)`);
    bao.push(`${tenPdf} · ${trang} trang`);
  }
}
await b.close();
console.log(bao.join('\n'));
if (loi.length) { console.log(`\nKIỂM ĐỎ (${loi.length}):\n` + loi.join('\n')); process.exit(1); }
console.log('\nKiểm xanh: đủ ảnh, MINI 2–4 trang, chữ nút có trên app, không chữ lỗi thời.');
