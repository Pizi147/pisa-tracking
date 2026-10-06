// PR-KHUNG — đo khung trên trang thật (chạy tay, không vào `npm run check`): 1440/375 × tối/sáng.
// Lỗi: (a) html cuộn (chỉ <main> được cuộn) hoặc trang trượt ngang; (b) cuộn lồng trong trang (ngoài panel);
// (c) chữ truncate / line-clamp bị cắt; (d) chữ nút chọn / nút lọc / tab tràn khỏi viền.
// Chạy: npm run dev (PORT/WEB_PORT riêng) rồi `KHUNG_BASE=http://localhost:5530 node scripts/do-khung.mjs [lọc]`.
// Playwright không nằm trong package.json: `npm i --no-save playwright` hoặc trỏ PW=<đường tới playwright>.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PW ? pathToFileURL(process.env.PW).href : 'playwright');
const BASE = process.env.KHUNG_BASE ?? `http://localhost:${process.env.WEB_PORT ?? 5173}`;
const ANH = process.env.KHUNG_ANH ?? 'thiet-ke/anh/khung';
const LOC = process.argv[2] ?? '';
fs.mkdirSync(ANH, { recursive: true });

/** Chỗ cắt chữ của PR khác: Lịch Test (#12 LT3), hồ sơ Mock (#13), Điểm theo lớp (#14 HK2), lưới chấm (`cham/*` — PR-BV #228),
 *  nội dung panel Ghi kết quả PA (`CapNhatTuan.tsx` — PR-LUI-a2; nút chọn trong panel vẫn đo ở (d)). */
const BO_QUA_CAT = ['lichTest', 'diem-lop', 'mock', 'nhap-diem', 'bang-diem-thuong', 'panel-pa'];

const nut = (ten) => async (p) => { await p.getByRole('button', { name: ten }).first().click(); await p.waitForTimeout(500); };
const KICH_BAN = [
  // [tên, vai, đường, thao tác thêm]
  ['hvl', 2, '/hoc-vien'], ['hvl-gvcn', 7, '/hoc-vien'],
  ['hvl-cuoi', 2, '/hoc-vien', async (p) => { await p.evaluate(() => { const m = document.getElementById('noi-dung'); m.scrollTop = m.scrollHeight; window.scrollTo(0, 1e6); }); await p.waitForTimeout(300); }],
  ['tong-quan', 2, '/'], ['tong-quan-gv', 7, '/'], ['phan-tich', 2, '/phan-tich'],
  ['cv-ho-tro', 2, '/cong-viec'], ['cv-cho-duyet', 2, '/cong-viec/cho-duyet'], ['cv-van-hanh', 2, '/cong-viec/van-hanh'],
  ['cv-bao-cao', 2, '/cong-viec/bao-cao'], ['cv-gv', 7, '/cong-viec'],
  ['lop-ft', 7, '/hoc-vien/lop/3?tab=hoc-vien'], ['lop-ft-phan-tich', 7, '/hoc-vien/lop/3?tab=phan-tich'],
  ['lop-ft-y-thuc', 7, '/hoc-vien/lop/3?tab=y-thuc'], ['lop-thuong', 2, '/hoc-vien/lop/6?tab=hoc-vien'],
  ['lop-thuong-phan-tich', 2, '/hoc-vien/lop/6?tab=phan-tich'],
  ['hv-hoc-thuat', 7, '/hoc-vien/3'], ['hv-y-thuc', 7, '/hoc-vien/3?tab=y-thuc'], ['hv-hanh-trinh', 7, '/hoc-vien/3?tab=hanh-trinh'],
  ['hv-thuong', 2, '/hoc-vien/8'], ['luu-tru', 2, '/hoc-vien/luu-tru'],
  ['test-lichTest', 2, '/test/lich'], ['test-diem-lop', 2, '/test/diem-lop'], ['test-ke-hoach', 2, '/test/ke-hoach'],
  ['nhap-diem', 2, '/nhap-diem/3'], ['bang-diem-thuong', 2, '/bang-diem-thuong/6'], ['mock', 2, '/mock-test/5'],
  ['quan-tri', 1, '/quan-tri'], ['quan-tri-quyen', 1, '/quan-tri', async (p) => { await p.getByRole('tab', { name: /Quyền/ }).click(); await p.waitForTimeout(800); }], ['ho-so-ca-nhan', 7, '/ho-so-ca-nhan'],
  ['gvbm', 9, '/'], ['gvbm-test', 9, '/test/lich'],
  // Panel: chỉ đo nút tràn / chữ cắt — panel tự cuộn trong thân là đúng thiết kế.
  ['panel-pa', 7, '/hoc-thuat/case/5', async (p) => {
    // 375: Ngăn Case tự mở đè trang — bấm "Ghi kết quả" trong ngăn.
    const ngan = p.locator('[role=dialog]');
    await ((await ngan.count()) ? ngan : p).getByRole('button', { name: /Ghi kết quả/ }).first().click(); await p.waitForTimeout(500); await p.getByRole('button', { name: /Tiến bộ một phần/ }).first().click().catch(() => {}); }],
  ['panel-tao-case', 7, '/hoc-vien/3', nut(/^\+ Case$/)],
  ['panel-vi-pham', 7, '/hoc-vien/3?tab=y-thuc', async (p) => { await nut(/Ghi vi phạm/)(p); await p.evaluate(() => { const t = document.querySelector('[role=dialog] .overflow-y-auto'); if (t) t.scrollTop = 120; }); await p.waitForTimeout(200); }],
  ['panel-sua-tt', 2, '/hoc-vien/lop/3?tab=hoc-vien', nut(/^Sửa thông tin$/)],
];

function doTrang() {
  const loi = [];
  let dau = null;
  const ghi = (el, l) => { loi.push(l); dau ??= el; };
  const ten = (el) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const an = (el) => el.closest('.sr-only') || getComputedStyle(el).position === 'absolute' && el.clientWidth <= 1;
  const thay = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const se = document.scrollingElement;
  if (se.scrollHeight > se.clientHeight + 1) loi.push(`a html cuộn ${se.scrollHeight}/${se.clientHeight}`);
  if (se.scrollWidth > se.clientWidth + 1) loi.push(`a trang trượt ngang ${se.scrollWidth}/${se.clientWidth}`);
  const panel = document.querySelector('[role=dialog]');
  for (const el of document.querySelectorAll('body *')) {
    if (!thay(el) || an(el)) continue;
    const cs = getComputedStyle(el);
    const trongPanel = !!el.closest('[role=dialog]');
    // (b) cuộn lồng: khối tự cuộn dọc nằm trong trang (không phải <main>, không trong panel / menu nổi).
    if (!panel && el.id !== 'noi-dung' && /auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1
      && !el.closest('[role=menu],[role=listbox],[role=dialog]') && cs.position !== 'fixed')
      ghi(el, `b cuộn lồng ${el.clientHeight}/${el.scrollHeight} «${ten(el).slice(0, 40)}»`);
    // (c) chữ bị cắt. Máy tính: truncate + `title` là mẫu đã duyệt (kế hoạch G4) — không tính.
    const cat = cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none' && cs.webkitLineClamp !== '';
    if (cat && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && ten(el)
      && !(trongPanel && el.closest('header')) && !(innerWidth >= 640 && el.closest('[title]'))
      && !el.parentElement.querySelector(':scope > button[aria-expanded]')) // cắt có nút "Xem thêm"
      ghi(el, `c chữ cắt ${el.clientWidth}x${el.clientHeight}<${el.scrollWidth}x${el.scrollHeight} «${ten(el)}»`);
    // (d) chữ tràn khỏi viền nút chọn / nút lọc / tab.
    if (el.matches('button, [role=tab], [role=radio], a.btn') && ten(el)) {
      const r = el.getBoundingClientRect();
      // Chữ THẤY được: bỏ chữ sr-only và chữ nằm trong khối con tự cắt (khối đó đã đo ở (c)).
      let trai = Infinity, phai = -Infinity;
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.textContent.trim()) continue;
        let a = n.parentElement, boQua = false;
        for (; a && a !== el.parentElement; a = a.parentElement) {
          const ac = getComputedStyle(a);
          if (an(a) || a !== el && ac.overflowX !== 'visible') { boQua = true; break; }
        }
        if (boQua) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const q of rg.getClientRects()) if (q.width) { trai = Math.min(trai, q.left); phai = Math.max(phai, q.right); }
      }
      if (phai > trai && (trai < r.left - 0.5 || phai > r.right + 0.5)) ghi(el, `d nút tràn ${Math.round(phai - trai)}>${Math.round(r.width)} «${ten(el)}»`);
      // Nút bị khung cha cắt (hàng tab / hàng lọc trượt ngang không mép mờ).
      let p = el.parentElement;
      while (p && p !== document.body) {
        const pc = getComputedStyle(p);
        if (pc.overflowX !== 'visible') {
          if (p.querySelector('table')) break; // bảng cuộn ngang trong khung riêng: cố ý (K2 / HK2).
          const pr = p.getBoundingClientRect();
          const mo = pc.maskImage && pc.maskImage !== 'none' || pc.webkitMaskImage && pc.webkitMaskImage !== 'none';
          if (!mo && r.left < pr.right - 1 && r.right > pr.right + 1) ghi(el, `d nút bị cắt ở mép (không mép mờ) «${ten(el)}»`);
          break;
        }
        p = p.parentElement;
      }
    }
  }
  if (dau) { dau.scrollIntoView({ block: 'center', inline: 'nearest' }); dau.style.outline = '2px solid #f43f5e'; }
  return [...new Set(loi)];
}

const trinh = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch({ channel: 'chrome' }));
let tongLoi = 0;
for (const [w, h] of [[1440, 900], [375, 812]]) for (const sang of [false, true]) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript((s) => { try { localStorage.setItem('pisa-giao-dien', s ? 'light' : 'dark'); } catch {} }, sang);
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  let vai = 0;
  for (const [tenKb, v, duong, them] of KICH_BAN) {
    if (LOC && !tenKb.includes(LOC)) continue;
    if (v !== vai) {
      const r = await p.request.post(`${BASE}/api/demo/session`, { data: { userId: v } });
      if (!r.ok()) throw new Error(`đăng nhập vai ${v}: ${r.status()}`);
      vai = v;
    }
    const nhan = `${tenKb}-${w}-${sang ? 'sang' : 'toi'}`;
    try {
      await p.goto(BASE + duong, { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);
      if (them) await them(p);
    } catch (e) { console.log(`?? ${nhan}: không mở được (${e.message.split('\n')[0]})`); continue; }
    let loi = await p.evaluate(doTrang);
    if (BO_QUA_CAT.some((k) => tenKb.includes(k))) loi = loi.filter((l) => !l.startsWith('c '));
    console.log(`${loi.length ? '✗' : '✓'} ${nhan}${loi.map((l) => `\n    ${l}`).join('')}`);
    tongLoi += loi.length;
    // Ảnh lỗi; KHUNG_CHUP=1 chụp mọi lần đo (ảnh nghiệm thu).
    if (loi.length || process.env.KHUNG_CHUP) await p.screenshot({ path: path.join(ANH, `${nhan}.png`) });
  }
  await ctx.close();
}
await trinh.close();
console.log(tongLoi ? `\n${tongLoi} lỗi` : '\nKhông lỗi');
process.exit(tongLoi ? 1 : 0);
