// N55 (chủ SP 19/11) — tên học viên KHÔNG BAO GIỜ bị cắt "…" (1440 lẫn 375); hết chỗ thì xuống dòng. Chạy trong `npm run check`.
// Phần tử hiện tên HV mang lớp `ten-hv` (index.css, ngoài @layer: thắng `truncate` và luật cắt của ô bảng). Quét web/src:
//   1. Phần tử có `ten-hv` mà className còn lớp cắt (`truncate`, `text-ellipsis`, `line-clamp-*`, `whitespace-nowrap`) — mâu thuẫn, bỏ lớp cắt.
//   2. Dòng in thẳng trường tên HV (`{….studentName}`, `fullName`, `full_name`, `tenHv`, `hoTen`) kèm lớp cắt trên CÙNG dòng mà không có `ten-hv`.
//   3. index.css còn luật `.ten-hv` (white-space: normal) ngoài @layer.
// Cố ý bỏ qua một dòng (không phải tên HV, vd tên GV / tài khoản): thêm `ten-hv-ok` (chú thích) cuối dòng, kèm lý do.
import fs from 'node:fs';
import path from 'node:path';

const CAT = /(?<![\w-])(?:(?:max-|min-)?(?:sm|md|lg|xl):)?(truncate|text-ellipsis|line-clamp-\d+|whitespace-nowrap)(?![\w-])/;
const TRUONG_TEN = /\{[^{}]*\b(studentName|fullName|full_name|tenHv|hoTen)\s*\}/;

function duyet(d, ra = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) duyet(p, ra); else if (e.name.endsWith('.tsx')) ra.push(p);
  }
  return ra;
}

/** className của mọi thẻ có chữ `ten-hv` trong thuộc tính className (chuỗi "…", '…' hoặc `…`, có thể nhiều dòng). */
export function lopCoTenHv(nguon) {
  const ra = [];
  for (const m of nguon.matchAll(/className=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)) {
    const lop = m[1] ?? m[2] ?? m[3];
    if (/(?<![\w-])ten-hv(?![\w-])/.test(lop)) ra.push({ lop, dong: nguon.slice(0, m.index).split('\n').length });
  }
  return ra;
}

export function kiemTep(f, nguon) {
  const loi = [];
  for (const { lop, dong } of lopCoTenHv(nguon)) {
    const m = lop.match(CAT);
    if (m) loi.push(`${f}:${dong}  "ten-hv" đi cùng "${m[0]}" — bỏ lớp cắt`);
  }
  nguon.split('\n').forEach((d, i) => {
    if (d.includes('ten-hv')) return;
    if (TRUONG_TEN.test(d) && CAT.test(d) && /className/.test(d)) loi.push(`${f}:${i + 1}  tên HV có lớp cắt "${d.match(CAT)[0]}" — dùng lớp "ten-hv", không cắt`);
  });
  return loi;
}

/* Tự kiểm (chạy mỗi lần): hai mẫu sai phải bị bắt, mẫu đúng không báo. */
const mauSai = ['<Link className="ten-hv truncate" to="/">{r.ten}</Link>', '<span className="min-w-0 truncate font-semibold">{row.studentName}</span>',
  '<b className={`ten-hv ${a} max-sm:line-clamp-2`}>{x}</b>'];
const mauDung = ['<Link className="ten-hv ten-ho-so" to="/">{row.studentName}</Link>', '<span className="truncate">{lop.code}</span>'];
for (const m of mauSai) if (!kiemTep('mau', m).length) { console.error(`kiem-ten-hv: tự kiểm hỏng — không bắt được: ${m}`); process.exit(1); }
for (const m of mauDung) if (kiemTep('mau', m).length) { console.error(`kiem-ten-hv: tự kiểm hỏng — báo nhầm: ${m}`); process.exit(1); }

const loi = duyet('web/src').flatMap((f) =>
  kiemTep(f, fs.readFileSync(f, 'utf8').split('\n').map((d) => (d.includes('ten-hv-ok') ? '' : d)).join('\n')));
const css = fs.readFileSync('web/src/index.css', 'utf8');
const sauLop = css.slice(css.lastIndexOf('\n}') + 2);   // phần sau khối @layer cuối
if (!/\.ten-hv\s*\{[^}]*white-space:\s*normal/.test(sauLop)) loi.push('web/src/index.css  thiếu luật `.ten-hv { white-space: normal … }` ngoài @layer (cuối tệp)');
if (loi.length) { console.error(`kiem-ten-hv: ${loi.length} chỗ tên học viên có thể bị cắt "…" (luật N55):\n` + loi.join('\n')); process.exit(1); }
console.log('kiem-ten-hv: ok');
