// CONG-CU — cảnh báo esbuild = lỗi (chạy trong `npm run check`). esbuild đọc mọi tệp .ts/.tsx của web, máy chủ, shared (không gộp, không ghi)
// và báo các mã chết tsc bỏ qua: `case` trùng (no-duplicate-case), so sánh với -0, `typeof` sai chữ… Lỗi đã biết: `scripts/mien-do.json`
// (cong_cu "esbuild", khop = regex trên "tệp:dòng mã chữ-dòng"); dòng miễn không còn khớp cũng đỏ — PR sửa lỗi gỡ dòng đó.
import { build } from 'esbuild';
import { mien, mienThua } from './do-bang.mjs';

const { warnings } = await build({
  entryPoints: ['web/src/**/*.ts', 'web/src/**/*.tsx', 'server/src/**/*.ts', 'shared/**/*.ts'],
  write: false, outdir: 'dist-esbuild', logLevel: 'silent',
});
const loi = [];
let daMien = 0;
for (const w of warnings) {
  const dong = `${w.location?.file}:${w.location?.line} ${w.id} ${w.location?.lineText.trim() ?? ''}`;
  const m = mien('esbuild', dong);
  if (m) daMien++;
  else loi.push(`${dong}\n    ${w.text}`);
}
for (const m of mienThua('esbuild')) loi.push(`dòng miễn thừa (${m.pr}): ${m.khop} — đã hết cảnh báo, gỡ khỏi scripts/mien-do.json`);
for (const l of loi) console.error(`✗ esbuild ${l}`);
console.log(`esbuild: ${warnings.length} cảnh báo, ${daMien} đã biết (mien-do.json)${loi.length ? `, ${loi.length} LỖI` : ''}`);
process.exit(loi.length ? 1 : 0);
