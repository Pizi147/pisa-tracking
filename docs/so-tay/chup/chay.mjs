// node docs/so-tay/chup/chay.mjs [vi|en] [tiền tố id…]   — chụp lại ảnh (chạy từ thư mục gốc repo; app cục bộ đang chạy)
import { moTrinhDuyet, chayMotAnh } from './lib.mjs';
import { ANH } from './anh.mjs';

const args = process.argv.slice(2);
const langs = args.filter((a) => a === 'vi' || a === 'en');
const loc = args.filter((a) => a !== 'vi' && a !== 'en');
const b = await moTrinhDuyet();
let loi = 0;
for (const lang of langs.length ? langs : ['vi', 'en']) {
  const cache = {};
  for (const fig of ANH.filter((a) => (lang === 'vi' || a.en) && (!loc.length || loc.some((t) => a.id.startsWith(t))))) {
    try {
      const r = await chayMotAnh(b, fig, lang, cache);
      console.log(r.thieu.length ? `⚠ ${lang}/${fig.id}: thiếu số ${r.thieu.join(',')}` : `✓ ${lang}/${fig.id}`);
      if (r.thieu.length) loi += 1;
    } catch (e) {
      loi += 1;
      console.log(`✗ ${lang}/${fig.id}: ${String(e.message || e).split('\n')[0]}`);
    }
  }
  for (const k of Object.keys(cache)) await cache[k].ctx.close();
}
await b.close();
process.exit(loi ? 1 : 0);
