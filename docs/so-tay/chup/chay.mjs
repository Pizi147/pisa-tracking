// node docs/so-tay/chup/chay.mjs [tiền tố id…]   — chụp lại các ảnh (chạy từ thư mục gốc repo)
import { moTrinhDuyet, chayMotAnh } from './lib.mjs';
import { ANH } from './anh.mjs';

const loc = process.argv.slice(2);
const dsach = ANH.filter((a) => !loc.length || loc.some((t) => a.id.startsWith(t)));
const b = await moTrinhDuyet();
const cache = {};
const kq = {};
for (const fig of dsach) {
  try {
    const r = await chayMotAnh(b, fig, cache);
    kq[fig.id] = { thieu: r.thieu };
    console.log(r.thieu.length ? `⚠ ${fig.id}: thiếu số ${r.thieu.join(',')}` : `✓ ${fig.id}`);
  } catch (e) {
    kq[fig.id] = { loi: String(e.message || e).split('\n')[0] };
    console.log(`✗ ${fig.id}: ${kq[fig.id].loi}`);
  }
}
await b.close();
