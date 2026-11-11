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
/*
 * KHOI-DONG-LANH (13/11): gói hàm `api` như Netlify (esbuild, cjs, libsql ngoài) — từ điển Anh (`shared/i18n/en*`, ~1 MB) KHÔNG được lọt vào gói
 * (máy chủ luôn chữ Việt; xuất MT tiếng Anh dịch ở web). Lọt lại → khởi động lạnh chậm thêm ~20 %. In kích thước để so lần sau.
 */
const goi = await build({
  entryPoints: ['netlify/functions/api.ts'], bundle: true, platform: 'node', target: 'node22', format: 'cjs', write: false, outfile: 'api.js',
  external: ['libsql', '@libsql/*'], metafile: true, logLevel: 'silent',
});
/* `outputs[…].inputs` + bytesInOutput > 0 = phần THỰC SỰ vào gói (`metafile.inputs` gồm cả tệp esbuild đọc rồi tree-shake bỏ). */
const vaoGoi = Object.entries(Object.values(goi.metafile.outputs)[0].inputs).filter(([, v]) => v.bytesInOutput > 0).map(([f]) => f);
const enLot = vaoGoi.filter((f) => /^shared\/i18n\/en(\.ts|\/)/.test(f));
if (enLot.length) loi.push(`gói hàm api chứa từ điển Anh (${enLot.length} tệp, vd ${enLot[0]}) — máy chủ không được nạp shared/i18n/en (gọi napTuDienEn ở đâu?)`);
console.log(`gói hàm api: ${(goi.outputFiles[0].contents.length / 1e6).toFixed(2)} MB, ${vaoGoi.length} tệp nguồn`);
for (const l of loi) console.error(`✗ esbuild ${l}`);
console.log(`esbuild: ${warnings.length} cảnh báo, ${daMien} đã biết (mien-do.json)${loi.length ? `, ${loi.length} LỖI` : ''}`);
process.exit(loi.length ? 1 : 0);
