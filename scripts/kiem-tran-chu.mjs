// KHONG-TRAN-CHU (chủ SP 15/11 "web không bị clipped như này đâu nhé"): quét DOM thật tìm chip / nhãn / nút có chữ TRÀN khỏi khung.
// Chạy: npm run dev (PORT/WEB_PORT riêng) rồi KHUNG_BASE=http://localhost:5173 node scripts/kiem-tran-chu.mjs [đường|vai|tab ...]
// Mặc định quét các màn có cột hẹp (HV & Lớp, hồ sơ lớp / HV mọi tab chính, Công việc, Tổng quan, Test) ở 1440 tối + 375 sáng.
// Lỗi = phần tử chip (button, a, span có viền / nền, cao ≤ 48 px, overflow visible) mà chữ con vượt khung: cao nội dung > cao khung
// (chữ xuống dòng trong khung cao cố định → đè dòng dưới) hoặc rộng nội dung > rộng khung (nowrap tràn ngang). Cắt "…" có chủ ý (truncate) không tính.
// Thoát 1 khi có lỗi; in tệp/màn, chữ, kích thước.
import { chromium } from 'playwright';

const BASE = process.env.KHUNG_BASE ?? 'http://localhost:5173';
const MAN = process.argv.slice(2).length ? process.argv.slice(2) : [
  'hoc-vien|2|', 'hoc-vien|7|', 'hoc-vien/lop/3|7|', 'hoc-vien/lop/3|7|Ý thức', 'hoc-vien/lop/6|7|', 'hoc-vien/lop/6|7|Ý thức',
  'hoc-vien/65|7|', 'hoc-vien/65|7|Ý thức', 'hoc-vien/4|7|Ý thức', 'cong-viec|7|', 'cong-viec|7|Case', 'cong-viec|7|Ý thức', '|2|', 'test|9|', 'test|2|',
];
const trinh = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch());
let loi = 0;
for (const rong of [1440, 375]) {
  for (const m of MAN) {
    const [duong, vai, tab] = m.split('|');
    const ctx = await trinh.newContext({ viewport: { width: rong, height: 900 } });
    await ctx.addInitScript((s) => { try { localStorage.setItem('pisa-giao-dien', s ? 'light' : 'dark'); } catch {} }, rong < 768);
    await ctx.request.post(`${BASE}/api/demo/session`, { data: { userId: Number(vai) } });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/${duong}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    if (tab) { const t = p.getByRole('tab', { name: new RegExp(`^${tab}`) }).filter({ visible: true }); if (await t.count()) { await t.first().click(); await p.waitForTimeout(1200); } }
    /* KEO_DAI=1: ép chữ dài vào chip mở hộp (▾ — chip mốc vi phạm, ô chọn) như dữ liệu thật dài nhất ("REPORT 4 + MEETING CX/GĐCN") rồi đo. */
    if (process.env.KEO_DAI) await p.evaluate(() => { for (const b of document.querySelectorAll('main button[aria-haspopup]')) { if (!b.textContent.includes('▾')) continue; const n = [...b.childNodes].find((x) => x.nodeType === 3 && x.textContent.trim()); if (n) n.textContent = 'ĐÃ TỚI REPORT 4 + MEETING CX/GĐCN'; } });
    const ds = await p.evaluate(() => {
      const out = [];
      for (const e of document.querySelectorAll('main button, main a, main span, [role=dialog] button, [role=dialog] span')) {
        const r = e.getBoundingClientRect();
        if (!r.width || r.height > 48 || r.height < 14) continue;
        const cs = getComputedStyle(e);
        if (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis' || cs.position === 'absolute' || e.closest('.sr-only, [aria-hidden=true]')) continue;
        const coKhung = cs.borderTopWidth !== '0px' && cs.borderTopStyle !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
        if (!coKhung || !/flex|inline/.test(cs.display)) continue;
        /* Khung CHỮ thật (Range trên các nút chữ, bỏ chữ sr-only) — không tính vùng bấm ẩn ::after. */
        const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
        let tren = Infinity, duoi = -Infinity, trai = Infinity, phai = -Infinity;
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (!n.textContent.trim() || n.parentElement.closest('.sr-only') || n.parentElement.getBoundingClientRect().width <= 1) continue;   // sr-only theo cỡ màn (max-sm:sr-only)
          const rg = document.createRange(); rg.selectNodeContents(n);
          for (const q of rg.getClientRects()) { if (!q.width) continue; tren = Math.min(tren, q.top); duoi = Math.max(duoi, q.bottom); trai = Math.min(trai, q.left); phai = Math.max(phai, q.right); }
        }
        if (tren === Infinity) continue;
        const caoTran = tren < r.top - 2 || duoi > r.bottom + 2;
        const rongTran = trai < r.left - 2 || phai > r.right + 2;
        if (caoTran || rongTran) out.push(`${caoTran ? 'cao' : 'rộng'} ${Math.round(r.width)}×${Math.round(r.height)} (chữ ${Math.round(phai - trai)}×${Math.round(duoi - tren)}) "${e.textContent.trim().slice(0, 60)}"`);
      }
      return [...new Set(out)];
    });
    for (const d of ds) { loi++; console.log(`✗ ${rong} /${duong}${tab ? ` #${tab}` : ''} vai ${vai}: ${d}`); }
    await ctx.close();
  }
}
await trinh.close();
console.log(loi ? `${loi} chỗ tràn chữ` : 'Không chỗ nào tràn chữ');
process.exit(loi ? 1 : 0);
