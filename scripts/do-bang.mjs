// CONG-CU — ĐO BẢNG trên trang thật (từ `v2b-do-bang.mjs` + `v3a-cat.mjs` của đợt đánh giá 20/10). Mỗi <table> thấy được:
// g1 lệch tiêu đề ↔ ô > 2 px (cột ≥ 3 ô; so theo kiểu căn THẬT của ô: mép trái / mép phải / tâm) · g2 lệch đường cơ sở trong hàng > 2 px
// g3 cao hàng ∉ {44, 64} ± 1 · g4 đè nhau: hai phần tử bấm được giao nhau > 2 px (kể cả nút opacity 0 chờ rê chuột — vẫn bấm được)
// g5 cỡ chữ ngoài thang 12 · 13 · 14 · 15 · 17 · 22 · 28.
// Chạy trong `do-khung` ở MỌI kịch bản: 1440 tối, 1280 tối, 375 sáng. Lỗi đã biết nằm ở `scripts/mien-do.json` (mỗi dòng ghi PR sẽ gỡ).
// Chạy riêng phần bảng: npm run dev (PORT/WEB_PORT riêng) rồi `KHUNG_BASE=http://localhost:5611 node scripts/do-bang.mjs [lọc]`
// (= do-khung với KHUNG_CHI=bang). MIEN=0 tắt danh sách miễn (xem lỗi thật).
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MIEN = JSON.parse(fs.readFileSync(fileURLToPath(new URL('./mien-do.json', import.meta.url)), 'utf8'));
const daDung = new Set();

/** Lỗi `dong` của công cụ `congCu` có trong danh sách miễn? (MIEN=0: không miễn gì.) */
export function mien(congCu, dong) {
  if (process.env.MIEN === '0') return null;
  const m = MIEN.find((x) => x.cong_cu === congCu && new RegExp(x.khop).test(dong));
  if (m) daDung.add(m);
  return m ?? null;
}
/** Dòng miễn của `congCu` không khớp lỗi nào trong lần chạy này (lỗi đã sửa → gỡ dòng). */
export const mienThua = (congCu) => process.env.MIEN === '0' ? [] : MIEN.filter((x) => x.cong_cu === congCu && !daDung.has(x));

/** Chạy trong trang (page.evaluate) — tự đủ, không dùng biến ngoài. Trả mảng dòng lỗi `«bảng» gN …`. */
export function doBang() {
  const THANG = [12, 13, 14, 15, 17, 22, 28];
  const cv = document.createElement('canvas').getContext('2d');
  const descent = (cs) => { cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return cv.measureText('ag').fontBoundingBoxDescent ?? parseFloat(cs.fontSize) * 0.25; };
  const r1 = (v) => Math.round(v * 10) / 10;
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const anDi = (el, dung) => {
    for (let p = el; p && p !== dung.parentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.display === 'none' || cs.visibility === 'hidden' || p.classList.contains('sr-only')) return true;
      if (cs.position === 'absolute' && parseFloat(cs.width) <= 1 && parseFloat(cs.height) <= 1) return true;
    }
    return false;
  };
  /** Mực trong ô: chữ (mỗi dòng một hộp, kèm đường cơ sở) + ô nhập / svg / ảnh. */
  const muc = (cell) => {
    const out = [];
    const w = document.createTreeWalker(cell, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === 3) {
        if (!n.textContent.trim() || anDi(n.parentElement, cell)) continue;
        const cs = getComputedStyle(n.parentElement);
        const rg = document.createRange(); rg.selectNodeContents(n);
        const de = descent(cs);
        for (const q of rg.getClientRects()) if (q.width > 0.5 && q.height > 0.5) out.push({ chu: true, x: q.left, r: q.right, y: q.top, b: q.bottom, bl: q.bottom - de, fs: parseFloat(cs.fontSize) });
      } else if (/^(svg|input|select|img|textarea)$/i.test(n.tagName) && !anDi(n, cell)) {
        const q = n.getBoundingClientRect();
        if (q.width >= 2 && q.height >= 2) out.push({ x: q.left, r: q.right, y: q.top, b: q.bottom });
      }
    }
    return out;
  };
  const bao = (ms) => ms.length ? { x: Math.min(...ms.map((m) => m.x)), r: Math.max(...ms.map((m) => m.r)) } : null;
  const canTheo = (ink, cell) => {
    const cs = getComputedStyle(cell), b = cell.getBoundingClientRect();
    const l = ink.x - (b.left + parseFloat(cs.paddingLeft)), r = (b.right - parseFloat(cs.paddingRight)) - ink.r;
    return Math.abs(l - r) <= 3 ? 'giữa' : l < r ? 'trái' : 'phải';
  };
  const tenBang = (t, i) => {
    if (t.getAttribute('aria-label')) return t.getAttribute('aria-label');
    if (t.caption?.textContent.trim()) return t.caption.textContent.trim();
    for (let p = t.parentElement, k = 0; p && k < 8; p = p.parentElement, k++) {
      const al = p.getAttribute('aria-label');
      if (al) return al;
      const h = p.querySelector(':scope > h2, :scope > h3, :scope > header h2, :scope > header h3, :scope > div > h2, :scope > div > h3');
      if (h?.textContent.trim()) return h.textContent.trim();
    }
    return `bảng ${i + 1}`;
  };
  const bamDuoc = (el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.pointerEvents !== 'none' && !el.disabled;
  };
  const nhanEl = (el) => (el.getAttribute('aria-label') || el.textContent || el.value || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 24);

  const loi = [];
  const bangs = [...document.querySelectorAll('table')].filter((t) => { const r = t.getBoundingClientRect(); return r.width > 80 && r.height > 20 && getComputedStyle(t).visibility !== 'hidden'; });
  let dauTruoc = null;   // bảng tiêu đề tách (Học viên & Lớp): thead không thân → bảng sau mượn tiêu đề
  for (const [i, t] of bangs.entries()) {
    const ten = tenBang(t, i).replace(/\s+/g, ' ').slice(0, 50);
    const ghi = (ma, chu) => loi.push(`«${ten}» ${ma} ${chu}`);
    const thead = t.tHead && t.tHead.getBoundingClientRect().height > 2 ? t.tHead : null;
    const hangThan = [...t.tBodies].flatMap((b) => [...b.rows]).filter((r) => r.getBoundingClientRect().height > 0);
    if (thead && !hangThan.length) { dauTruoc = thead; continue; }
    const hangDau = (thead ?? dauTruoc)?.rows;
    const dau = hangDau?.length ? hangDau[hangDau.length - 1] : null;
    /* Cột theo chỉ số (colSpan): tiêu đề hàng cuối của thead; ghép tiêu đề rowSpan của hàng trên (nhóm 2 tầng). */
    const cot = new Map();
    if (hangDau) for (const hr of hangDau) { let c = 0; for (const th of hr.cells) { if ((th.colSpan || 1) === 1 && (hr === dau || th.rowSpan > 1)) cot.set(c, { th, o: [] }); c += th.colSpan || 1; } }
    const coSo = [], cao = [];
    for (const tr of hangThan) {
      const nhom = /hang-lon|khoi-nhom/.test(tr.className) || [...tr.cells].some((c) => (c.colSpan || 1) > 2) || tr.cells.length < 2;
      if (nhom) continue;
      cao.push(r1(tr.getBoundingClientRect().height));
      const bl = [];
      let c = 0;
      for (const td of tr.cells) {
        const ms = muc(td), ink = bao(ms);
        if (ink && (td.colSpan || 1) === 1 && cot.has(c)) cot.get(c).o.push({ ink, cam: canTheo(ink, td) });
        const chu = ms.find((m) => m.chu);
        if (chu) bl.push(chu.bl);
        c += td.colSpan || 1;
      }
      if (bl.length > 1) coSo.push(Math.max(...bl) - Math.min(...bl));
    }
    // g1
    const lech = [];
    for (const { th, o } of cot.values()) {
      if (o.length < 3) continue;
      const inkTh = bao(muc(th).filter((m) => m.chu));
      if (!inkTh) continue;
      const dem = {}; for (const x of o) dem[x.cam] = (dem[x.cam] ?? 0) + 1;
      const cam = Object.entries(dem).sort((a, b) => b[1] - a[1])[0][0];
      const d = cam === 'trái' ? med(o.map((x) => x.ink.x)) - inkTh.x : cam === 'phải' ? med(o.map((x) => x.ink.r)) - inkTh.r
        : med(o.map((x) => (x.ink.x + x.ink.r) / 2)) - (inkTh.x + inkTh.r) / 2;
      if (Math.abs(d) > 2) lech.push(`${th.textContent.trim().replace(/\s+/g, ' ').slice(0, 14) || '?'} ${r1(d)}`);
    }
    if (lech.length) ghi('g1', `lệch tiêu đề ↔ ô ${lech.length} cột: ${lech.slice(0, 8).join(' · ')}`);
    // g2
    const xau = coSo.filter((d) => d > 2);
    if (xau.length) ghi('g2', `đường cơ sở lệch > 2px ${xau.length}/${coSo.length} hàng (tới ${r1(Math.max(...xau))})`);
    // g3
    const caoSai = [...new Set(cao.filter((h) => Math.abs(h - 44) > 1 && Math.abs(h - 64) > 1))].sort((a, b) => a - b);
    if (caoSai.length) ghi('g3', `cao hàng ∉ {44, 64}: ${caoSai.slice(0, 6).join(' · ')}${caoSai.length > 6 ? ' …' : ''}`);
    // g4
    const bam = [...t.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button]')].filter(bamDuoc);
    const hop = bam.map((el) => el.getBoundingClientRect());
    const de = [];
    for (let a = 0; a < bam.length; a++) for (let b = a + 1; b < bam.length; b++) {
      if (bam[a].contains(bam[b]) || bam[b].contains(bam[a])) continue;
      /* R1-PHAN-CAP-TEST: hàng lớp Lịch Test đang mở DÍNH khi cuộn — nội dung trượt dưới nó là đúng ý; "không che" đo ở kịch bản `dinh-khong-che`. */
      if (bam[a].closest('.lich-lop tr.dang-mo') || bam[b].closest('.lich-lop tr.dang-mo')) continue;
      const w = Math.min(hop[a].right, hop[b].right) - Math.max(hop[a].left, hop[b].left);
      const h = Math.min(hop[a].bottom, hop[b].bottom) - Math.max(hop[a].top, hop[b].top);
      if (w > 2 && h > 2) de.push(`«${nhanEl(bam[a])}» × «${nhanEl(bam[b])}»`);
    }
    if (de.length) ghi('g4', `đè nhau ${de.length} cặp: ${de[0]}`);
    // g5
    const co = new Set();
    for (const cell of t.querySelectorAll('th, td')) for (const m of muc(cell)) if (m.chu && !THANG.includes(m.fs)) co.add(m.fs);
    if (co.size) ghi('g5', `cỡ chữ ngoài thang: ${[...co].sort((a, b) => a - b).join(' · ')}px`);
  }
  return loi;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = spawnSync(process.execPath, [fileURLToPath(new URL('./do-khung.mjs', import.meta.url)), ...process.argv.slice(2)],
    { stdio: 'inherit', env: { ...process.env, KHUNG_CHI: 'bang' } });
  process.exit(r.status ?? 1);
}
