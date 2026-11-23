// Hộp Tuần dạy sập trang 24/11: HopNeo đo cao bằng `scrollHeight` — số này tính cả MŨI (`mui`) nhô ra ngoài hộp, mà mũi đổi chỗ theo vị trí hộp
// → đặt vị trí ↔ đo cao lặp vô tận ("Maximum update depth exceeded", ErrorBoundary). Chưa bị kẹp `maxHeight` phải đo bằng `offsetHeight`.
import fs from 'node:fs';
const f = 'web/src/ui/HopNeo.tsx';
const s = fs.readFileSync(f, 'utf8');
const loi = [];
if (/const cao = hop\.current\?\.scrollHeight/.test(s)) loi.push('cao hộp đo thẳng bằng scrollHeight (gồm mũi) — vòng lặp vị trí ↔ cao');
if (!/offsetHeight/.test(s)) loi.push('thiếu đo offsetHeight khi hộp chưa bị kẹp maxHeight');
if (loi.length) { console.error(`kiem-hop-neo: ${f}\n - ${loi.join('\n - ')}`); process.exit(1); }
console.log('kiem-hop-neo: ok');
