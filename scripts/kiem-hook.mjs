// LOI-TEST-THUONG (chủ SP 06/11) — hook React gọi SAU một lệnh `return` sớm của cùng component / hook = lỗi (chạy trong `npm run check`).
// Lần render trả sớm gọi ít hook hơn lần trước → React ném "Rendered fewer hooks than expected" → màn "Trang gặp lỗi khi hiển thị".
// Gốc lỗi bản chính 29/10: `KhoiNo` gọi `useManHinh` sau `if (!ds.length) return …` — Lịch Test FT có bài quá hạn, bấm "Lớp thường"
// (không bài quá hạn) là vỡ. Không có ESLint (react-hooks/rules-of-hooks) trong repo nên kiểm bằng TypeScript đã cài, chỉ luật này.
// Cách đọc: mỗi hàm tên Hoa (component) hoặc `useX` (hook); duyệt lệnh cấp đầu theo thứ tự; gặp lệnh có `return` (của chính hàm, không
// tính hàm lồng) thì mọi lời gọi `useX(` ở các lệnh sau (không tính hàm lồng) là lỗi.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const GOC = 'web/src';
const laHook = (ten) => /^use[A-Z0-9]/.test(ten);
const laTenKiem = (ten) => !!ten && (/^[A-Z]/.test(ten) || laHook(ten));
const laHam = (n) => ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n);

function tenHam(n) {
  if (n.name && ts.isIdentifier(n.name)) return n.name.text;
  let p = n.parent;
  /* `const X = memo(() => …)` / `forwardRef(…)` — lấy tên biến bọc ngoài. */
  while (p && ts.isCallExpression(p)) p = p.parent;
  if (p && ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return p.name.text;
  return null;
}

/** Duyệt `n` nhưng không vào hàm lồng. */
function moi(n, f) {
  ts.forEachChild(n, (c) => { if (!laHam(c)) { f(c); moi(c, f); } });
}
const coReturn = (st) => { if (ts.isReturnStatement(st)) return true; let co = false; moi(st, (c) => { if (ts.isReturnStatement(c)) co = true; }); return co; };
function hookTrong(st) {
  const ds = [];
  const xet = (c) => {
    if (ts.isCallExpression(c)) {
      const e = c.expression;
      const ten = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : null;
      if (ten && laHook(ten)) ds.push(c);
    }
  };
  xet(st); moi(st, xet);
  return ds;
}

function kiemTep(tep, nguon) {
  const sf = ts.createSourceFile(tep, nguon, ts.ScriptTarget.Latest, true, tep.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const loi = [];
  const duyet = (n) => {
    if (laHam(n) && n.body && ts.isBlock(n.body) && laTenKiem(tenHam(n))) {
      let traSom = null;
      for (const st of n.body.statements) {
        if (traSom) {
          for (const c of hookTrong(st)) {
            const { line } = sf.getLineAndCharacterOfPosition(c.getStart(sf));
            const d = sf.getLineAndCharacterOfPosition(traSom.getStart(sf)).line + 1;
            loi.push(`${tep}:${line + 1} ${tenHam(n)}: ${c.expression.getText(sf)}() sau return sớm ở dòng ${d}`);
          }
        }
        if (!traSom && coReturn(st)) traSom = st;
      }
    }
    ts.forEachChild(n, duyet);
  };
  duyet(sf);
  return loi;
}

const tepCua = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  return e.isDirectory() ? tepCua(p) : /\.tsx?$/.test(e.name) ? [p.split(path.sep).join('/')] : [];
});

/* Tự kiểm: mẫu lỗi bản chính 29/10 phải đỏ, bản đã sửa phải xanh. */
const mau = (sau) => `export function KhoiNo({ no }) {\n  const ds = useMemo(() => no, [no]);\n${sau ? '' : '  const gon = useManHinh("q");\n'}  if (!ds.length) return null;\n${sau ? '  const gon = useManHinh("q");\n' : ''}  const f = () => { if (gon) return 1; return useKhac(); };\n  return gon;\n}`;
if (kiemTep('mau.tsx', mau(true)).length !== 1 || kiemTep('mau.tsx', mau(false)).length !== 0) {
  console.error('✗ kiem-hook: tự kiểm hỏng (mẫu KhoiNo 29/10)'); process.exit(1);
}
const loi = tepCua(GOC).flatMap((t) => kiemTep(t, fs.readFileSync(t, 'utf8')));
for (const l of loi) console.error(`✗ hook ${l}`);
console.log(`kiem-hook: ${loi.length ? `${loi.length} LỖI` : 'không hook nào sau return sớm'}`);
process.exit(loi.length ? 1 : 0);
