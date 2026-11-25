// Hộp Tuần dạy sập trang 24/11: HopNeo đo cao bằng `scrollHeight` — số này tính cả MŨI (`mui`) nhô ra ngoài hộp, mà mũi đổi chỗ theo vị trí hộp
// → đặt vị trí ↔ đo cao lặp vô tận ("Maximum update depth exceeded", ErrorBoundary). Chưa bị kẹp `maxHeight` phải đo bằng `offsetHeight`.
import fs from 'node:fs';
const f = 'web/src/ui/HopNeo.tsx';
const s = fs.readFileSync(f, 'utf8');
const loi = [];
if (/const cao = hop\.current\?\.scrollHeight/.test(s)) loi.push('cao hộp đo thẳng bằng scrollHeight (gồm mũi) — vòng lặp vị trí ↔ cao');
if (!/offsetHeight/.test(s)) loi.push('thiếu đo offsetHeight khi hộp chưa bị kẹp maxHeight');
// Chủ SP 25/11 (panel Nhập điểm ở Công việc): hộp nhập điểm cuộn `<main>` của danh sách bên trái — ô nằm trong panel `position: fixed` nên không
// dời, `dat()` (gọi lại theo sự kiện cuộn) cuộn tiếp mãi → danh sách cuộn không ngừng. Tìm khung cuộn phải dừng ở phần tử fixed.
const f2 = 'web/src/modules/fasttrack/HopNhapDiemHop.tsx';
const s2 = fs.readFileSync(f2, 'utf8');
const khung = s2.match(/export function khungCuonCuaO[\s\S]*?\r?\n}\r?\n/)?.[0] ?? '';
if (!/position === 'fixed'\) return null/.test(khung)) loi.push(`${f2}: khungCuonCuaO không dừng ở phần tử position: fixed — hộp cuộn danh sách ngoài panel`);
if (!/const m = khungCuonCuaO\(anchor\)/.test(s2)) loi.push(`${f2}: dat() không tìm khung cuộn qua khungCuonCuaO`);
if (loi.length) { console.error(`kiem-hop-neo: ${f}\n - ${loi.join('\n - ')}`); process.exit(1); }
console.log('kiem-hop-neo: ok');
