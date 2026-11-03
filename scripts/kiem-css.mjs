// AUDIT-LOI F02 — CSS ra từ PostCSS (Tailwind + autoprefixer, như `vite build`) phải sạch; chạy trong `npm run check`. `kiem-esbuild` chỉ đọc
// TS/TSX nên không thấy lỗi CSS. Đỏ khi: (1) khối không selector (`{ … }` — trình duyệt bỏ cả khối, build báo css-syntax-error);
// (2) Tailwind sinh `.\!x` cho lớp `x` tự viết ở index.css — thường là phủ định JS `!x` trong mã bị đọc thành lớp; thêm `'!x'` vào
// `blocklist` ở tailwind.config.js (nếu thật sự cố ý dùng `!x` thì dùng lớp tiện ích Tailwind thay vì lớp tự viết).
import fs from 'node:fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const TEP = 'web/src/index.css';
const nguon = fs.readFileSync(TEP, 'utf8');
const { css } = await postcss([tailwindcss(), autoprefixer()]).process(nguon, { from: TEP });
const tuViet = new Set([...nguon.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1]));
const loi = [];
postcss.parse(css).walkRules((r) => {
  if (!r.selector.trim()) loi.push(`khối không selector: { ${r.nodes.map(String).join('; ').slice(0, 80)} }`);
});
for (const ten of new Set([...css.matchAll(/\.\\!([a-z][\w-]*)/g)].map((m) => m[1]))) {
  if (tuViet.has(ten)) loi.push(`lớp ".\\!${ten}" sinh từ chữ "!${ten}" trong mã — thêm '!${ten}' vào blocklist (tailwind.config.js)`);
}
for (const l of loi) console.error(`✗ css ${l}`);
console.log(`css: ${loi.length ? `${loi.length} LỖI` : 'sạch'}`);
process.exit(loi.length ? 1 : 0);
