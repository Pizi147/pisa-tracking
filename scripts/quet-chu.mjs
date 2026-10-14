/**
 * Quét chữ tiếng Việt hiển thị trên web (web/src, shared/domain, server/src) bằng AST → JSONL ra stdout.
 * Dùng cho PR-CHU (thiet-ke/CHU_CAN_SUA_2026-10.md) và để session sửa chữ chạy lại xem còn sót chữ nào không.
 * Không nằm trong `npm run check`. Chạy: node scripts/quet-chu.mjs > chu-tho.jsonl   (tóm tắt ra stderr)
 * Mỗi dòng: { id, file, line, loai, vo, text, nhom, lop?, truoc?, trong? }   (lop: className · truoc: thẻ anh em liền trước · trong: thẻ cha)
 *   loai: jsx-text | attr:<tên> | string | template      vo: nơi chuỗi nằm (toast.push, notify.title, notFound, th, label:…)
 *   text: NFC, gộp khoảng trắng, ${x} → {x}              nhom: web | shared | server
 */
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THU_MUC = [['web', 'web/src'], ['shared', 'shared/domain'], ['server', 'server/src']];
// Chạy dòng lệnh / kiểm thử / trang dev / thanh DemoBar: không có ở bản chính.
const BO = [/^server\/src\/(tests|seed|migrate|ops)\//, /^server\/src\/migrate\.ts$/, /^web\/src\/modules\/dev\//, /DemoBar\.tsx$/, /\.d\.ts$/];
const RE_DAU = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const RE_SQL = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|JOIN)\b/;
const RE_MA = /^[a-z0-9_.:/?&=-]+$/;
const KHOA_BO = new Set(['kind', 'dedupKey', 'className', 'key', 'to', 'href']);
const ATTR_BO = new Set(['className', 'key', 'to', 'href', 'id', 'htmlFor', 'name', 'type', 'target', 'rel', 'src', 'role', 'style', 'd', 'viewBox', 'fill', 'stroke', 'xmlns']);
const ATTR_HIEN = new Set(['placeholder', 'title', 'aria-label', 'aria-description', 'alt', 'label', 'nhan', 'ten', 'tieuDe', 'text']);
const RE_VO_HIEN = /^(toast|useToast|confirm|window\.confirm|alert|notify|notFound|forbidden|conflict|badRequest|HttpError|Error)/;
const RE_LOP = /text-xs|text-\[1[0-3]px\]|text-muted/;
const THUC_THE = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&middot;': '·', '&hellip;': '…', '&mdash;': '—' };

const chuanHoa = (s) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
const ngan = (e) => { const t = e.getText().replace(/\s+/g, ' '); return /^[\w$.?!]+$/.test(t) && t.length <= 28 ? t : '…'; };
const coJsx = (n) => { let r = false; (function d(x) { if (r) return; if (ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x) || ts.isJsxFragment(x)) { r = true; return; } ts.forEachChild(x, d); })(n); return r; };
const mo = (n) => (ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : null);
const tenThe = (n) => (mo(n) ? mo(n).tagName.getText() : ts.isJsxFragment(n) ? 'Fragment' : '?');
const lopThe = (n) => {
  const a = mo(n)?.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText() === 'className');
  const t = a?.initializer && (ts.isStringLiteral(a.initializer) ? a.initializer.text : a.initializer.getText());
  return t ? chuanHoa(t).slice(0, 120) : '';
};
const voThe = (n) => { const l = lopThe(n); const m = l.match(RE_LOP); return tenThe(n) + (m ? '.' + m[0] : ''); };

/** Đi lên tổ tiên tìm "vỏ" của chuỗi. Trả null nếu phải bỏ (import, kiểu, console). */
function ngucCanh(node) {
  for (let n = node, p = n.parent; p; n = p, p = p.parent) {
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isTypeNode(p)) return null;
    if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
      if (p.arguments?.includes(n)) {
        const v = p.expression.getText();
        if (/^(t|dich|loi)$/.test(v) && p.arguments[0] === n) return null;   // PR-EN: khoá từ điển (chữ Việt có bản Anh)
        return v.startsWith('console.') ? null : { vo: v.slice(0, 40) };
      }
    } else if (ts.isPropertyAssignment(p) && p.initializer === n) {
      const k = p.name.getText().replace(/^['"]|['"]$/g, '');
      if (KHOA_BO.has(k)) return null;
      const g = p.parent.parent;
      const cuoi = ts.isCallExpression(g) && g.arguments.includes(p.parent) ? g.expression.getText().split('.').pop() : '';
      return { vo: /^notify/.test(cuoi) ? 'notify.' + k : k + ':' };
    } else if (ts.isJsxAttribute(p)) {
      const ten = p.name.getText();
      return ATTR_BO.has(ten) || ten.startsWith('on') ? null : { loai: 'attr:' + ten, vo: p.parent.parent.tagName.getText() };
    } else if (ts.isJsxExpression(p) && (ts.isJsxElement(p.parent) || ts.isJsxFragment(p.parent))) return { vo: voThe(p.parent) };
    else if (ts.isVariableDeclaration(p) && p.initializer === n) return { vo: p.name.getText().slice(0, 40) };
    else if ((ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) && p.name) return { vo: p.name.getText() + '()' };
    else if (ts.isCaseClause(p)) return { vo: 'case' };
  }
  return { vo: 'module' };
}

/** PR-EN: xuất để phép kiểm E-NGUON (server/src/tests/prEn.tests.ts) quét đúng file của đợt bằng cùng luật. */
export function quetFile(abs, rel, nhom, ra) {
  const src = fs.readFileSync(abs, 'utf8');
  const sf = ts.createSourceFile(abs, src, ts.ScriptTarget.Latest, true, abs.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const dong = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;
  const ghi = (pos, text, loai, vo, them = {}) => {
    text = chuanHoa(text);
    if (!text || RE_SQL.test(text)) return;
    const phan = text.replace(/\{[^}]*\}/g, ''); // chữ nằm ngoài {biến}
    const coDau = RE_DAU.test(phan);
    const hienThi = loai === 'jsx-text' || (loai.startsWith('attr:') && ATTR_HIEN.has(loai.slice(5))) || RE_VO_HIEN.test(vo);
    if (!coDau && !(hienThi && (phan.match(/[A-Za-z]/g) ?? []).length >= 2)) return;
    if (RE_MA.test(phan) && loai !== 'jsx-text' && !/^notify\.(title|body)$/.test(vo)) return;
    ra.push({ file: rel, line: dong(pos), loai, vo, text, nhom, ...them });
  };
  const van = (cha) => {
    let buf = '', dau = -1;
    const chi = () => { if (/\p{L}/u.test(buf.replace(/\{[^}]*\}/g, ''))) ghi(dau, buf, 'jsx-text', voThe(cha), { lop: lopThe(cha) || undefined, truoc: truocThe(cha), trong: ts.isJsxElement(cha.parent) ? tenThe(cha.parent) : undefined }); buf = ''; dau = -1; };
    cha.children.forEach((c) => {
      if (ts.isJsxText(c)) {
        const t = c.getText().replace(/&#?\w+;/g, (m) => THUC_THE[m] ?? m);
        if (dau < 0 && t.trim()) { dau = c.getStart() + c.getText().search(/\S/); }
        buf += t;
      } else if (ts.isJsxExpression(c)) {
        const e = c.expression;
        if (!e) return;
        if (coJsx(e)) return chi();
        if (dau < 0) { dau = e.getStart(); }
        buf += ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) ? e.text : `{${ngan(e)}}`;
      } else chi();
    });
    chi();
  };
  const truocThe = (cha) => { const ds = ts.isJsxElement(cha.parent) || ts.isJsxFragment(cha.parent) ? cha.parent.children : null; if (!ds) return; for (let j = ds.indexOf(cha) - 1; j >= 0; j--) { const c = ds[j]; if (ts.isJsxText(c) && !c.getText().trim()) continue; return ts.isJsxText(c) ? undefined : ts.isJsxExpression(c) ? "{}" : tenThe(c); } };
  (function duyet(n) {
    if (ts.isJsxElement(n) || ts.isJsxFragment(n)) van(n);
    else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const c = ngucCanh(n);
      if (c) ghi(n.getStart(), n.text, c.loai ?? 'string', c.vo);
    } else if (ts.isTemplateExpression(n)) {
      const c = ngucCanh(n);
      if (c) ghi(n.getStart(), n.head.text + n.templateSpans.map((s) => `{${ngan(s.expression)}}` + s.literal.text).join(''), c.loai ?? 'template', c.vo);
    }
    ts.forEachChild(n, duyet);
  })(sf);
}

// Chạy như lệnh (không phải khi được import).
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const ra = [];
  for (const [nhom, thuMuc] of THU_MUC) {
    for (const f of fs.readdirSync(path.join(GOC, thuMuc), { recursive: true }).sort()) {
      const rel = `${thuMuc}/${f}`.replace(/\\/g, '/');
      if (/\.tsx?$/.test(rel) && !BO.some((r) => r.test(rel))) quetFile(path.join(GOC, rel), rel, nhom, ra);
    }
  }
  ra.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
  ra.forEach((r, i) => { r.id = 'c' + String(i + 1).padStart(5, '0'); });

  const dem = (k) => ra.reduce((o, r) => { const g = r[k].replace(/^attr:.*/, 'attr'); o[g] = (o[g] ?? 0) + 1; return o; }, {});
  console.error(`Tổng ${ra.length} bản ghi · nhóm ${JSON.stringify(dem('nhom'))} · loại ${JSON.stringify(dem('loai'))}`);

  // Phép tự kiểm: chạy mỗi lần; lệch thì dừng, không in gì ra stdout.
  assert.ok(ra.some((r) => r.nhom === 'server' && r.vo === 'notify.title'), 'thiếu notify.title ở server');
  assert.ok(ra.some((r) => r.vo.startsWith('toast')), 'thiếu toast');
  assert.ok(ra.some((r) => r.loai === 'attr:placeholder'), 'thiếu placeholder');
  assert.ok(!ra.some((r) => /\/(tests|seed)\//.test(r.file)), 'lọt tests/seed');
  {
    const f = 'web/src/ui/chu.ts';
    const dong = fs.readFileSync(path.join(GOC, f), 'utf8').split('\n').findIndex((l) => l.includes('CHUA_CO_PHUONG_AN =')) + 1;
    assert.ok(dong > 0 && ra.some((r) => r.file === f && r.line === dong && r.text === 'Chưa có PA'), 'thiếu CHUA_CO_PHUONG_AN đúng file:dòng');
  }
  assert.ok(ra.length >= 4000 && ra.length <= 12000, `tổng bản ghi ${ra.length} ngoài 4000–12000 — xem lại bộ bỏ`);
  process.stdout.write(ra.map((r) => JSON.stringify(r)).join('\n') + '\n');
}
