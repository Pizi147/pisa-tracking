/**
 * THỬ GÓI MÁY CHỦ NHƯ NETLIFY GÓI (CommonJS, libsql để ngoài) rồi gọi nó từ MỘT THƯ MỤC KHÁC — bắt các lỗi chỉ lộ
 * ra sau khi gói (import.meta.url rỗng, đường dẫn theo ROOT, tệp thiếu). Không cần mạng, không đụng Turso.
 * Chạy: npm run thu-goi   (dùng database máy dev: data/pisa-demo.sqlite — chạy `npm run seed` trước nếu chưa có)
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const repo = process.cwd();
const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'pisa-goi-'));
const out = path.join(tam, 'api.cjs');
await build({
  entryPoints: [path.join(repo, 'netlify/functions/api.ts')],
  bundle: true, platform: 'node', target: 'node22', format: 'cjs', outfile: out,
  external: ['libsql', '@libsql/*'], logLevel: 'warning',
});
process.env.PISA_DB ??= path.join(repo, 'data', 'pisa-demo.sqlite');
/* Không bao giờ để lệnh thử này chạm Turso, kể cả khi cửa sổ PowerShell đang có sẵn biến của bản chính. */
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
process.chdir(tam);                                  // như /var/task: không có package.json của dự án
const require = createRequire(path.join(repo, 'package.json'));   // libsql vẫn nạp từ node_modules của dự án
const Module = require('node:module');
const goc = Module._resolveFilename;
/* Node 24: `require.resolve` gọi lại chính `_resolveFilename` (lặp vô hạn) — nên gọi hàm GỐC với một module "neo" ở thư mục dự án. */
const neo = new Module(path.join(repo, 'package.json'));
neo.filename = path.join(repo, 'package.json');
neo.paths = Module._nodeModulePaths(repo);
Module._resolveFilename = function (req, parent, ...rest) {
  const laLibsql = req === 'libsql' || req.startsWith('@libsql/');
  return goc.call(this, req, laLibsql ? neo : parent, ...rest);
};
const { handler } = require(out);

const goi = (p, method = 'GET') => handler({
  httpMethod: method, path: p, headers: { host: 'thu.local' }, multiValueHeaders: {},
  queryStringParameters: null, multiValueQueryStringParameters: null, body: null, isBase64Encoded: false,
  requestContext: { identity: { sourceIp: '127.0.0.1' } },
}, {});

let hong = 0;
for (const p of ['/api/health', '/.netlify/functions/api/health', '/api/auth/info']) {
  const r = await goi(p);
  const ok = r.statusCode === 200 && !String(r.body).includes('_metadata');
  if (!ok) hong++;
  console.log(`${ok ? 'ĐẠT' : 'HỎNG'}  ${p}  → ${r.statusCode}  ${String(r.body).slice(0, 120)}`);
}
process.chdir(repo);                                 // Windows không cho xoá thư mục đang đứng
try { fs.rmSync(tam, { recursive: true, force: true }); } catch { /* Windows còn giữ file — bỏ qua dọn dẹp */ }
if (hong) { console.error(`\n${hong} đường HỎNG — máy chủ gói xong không chạy được. Xem Task 5 Step 1b.`); process.exit(1); }
console.log('\nGói máy chủ như Netlify: chạy được.');
