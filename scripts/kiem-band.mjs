// N53 (chủ SP 18/11) — điểm band hiện LUÔN một chữ số thập phân ("7.0", không "7"); một hàm chung `fmtBand` (shared/domain/display.ts).
// Chạy trong `npm run check`. Quét nguồn (web/src, shared, server/src, không tests) tìm cách in band bỏ qua hàm chung:
//   · `.toFixed(1)` — dùng `fmtBand(x)`. Không báo nhầm: dung lượng (MB / KB), thời gian (ms), sao (★), `/ 1e6`.
//   · `String(<band|overall|ovr|kyVong|expectation|target…>)` — in thẳng số band.
// Cố ý bỏ qua một dòng (không phải band): thêm `// band-ok` cuối dòng. KHÔNG áp cho điểm thô (số câu đúng), phần trăm, số đếm.
import fs from 'node:fs';
import path from 'node:path';

const GOC = ['web/src', 'shared', 'server/src'];
const BO_QUA_TEP = /[\\/](tests|node_modules|dist)[\\/]|shared[\\/]domain[\\/]display\.ts$/;
const KHONG_PHAI_BAND = /MB\b|KB\b|\bms\b|★|1e6|band-ok/;
const IN_THANG = /\bString\(\s*(?:[\w$]+(?:[?!]?\.[\w$]+)*\.)?(band|overall|ovr|kyVong|expectation|dauVao|target|targetScore|target_score)\s*\)/;

function duyet(d, ra = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') duyet(p, ra); } else if (/\.(ts|tsx)$/.test(e.name) && !BO_QUA_TEP.test(p)) ra.push(p);
  }
  return ra;
}

const loi = [];
for (const f of GOC.flatMap((g) => duyet(g))) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((dong, i) => {
    if (KHONG_PHAI_BAND.test(dong)) return;
    if (dong.includes('.toFixed(1)')) loi.push(`${f}:${i + 1}  .toFixed(1) — dùng fmtBand()`);
    else if (IN_THANG.test(dong)) loi.push(`${f}:${i + 1}  String(band…) — dùng fmtBand()`);
  });
}
if (loi.length) { console.error(`kiem-band: ${loi.length} chỗ in band không qua fmtBand (luật N53):\n` + loi.join('\n')); process.exit(1); }
console.log('kiem-band: ok');
