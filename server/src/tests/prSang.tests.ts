/**
 * PHÉP KIỂM PR-SANG — giao diện sáng/tối (T15), phông (T16), cỡ chữ tối thiểu (E4), màu chỉ qua token (YC-7).
 * Không mở database: đọc nguồn (`index.css`, `tailwind.config.js`, `web/src`) và tính tương phản WCAG.
 * Kế hoạch: docs/superpowers/plans/2026-09-29-pr-sang-sang-toi-font.md (S1–S9).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

function taiFile(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) taiFile(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Dòng nguồn có nghĩa: bỏ dòng chú thích thuần (`*`, `//`, `{/*`, `/*`). */
function dongNguon(text: string): Array<[number, string]> {
  return text.split('\n').map((s, i) => [i + 1, s] as [number, string]).filter(([, s]) => !/^\s*(\*|\/\/|\{\/\*|\/\*)/.test(s));
}

export async function runPrSangTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-SANG · Giao diện sáng/tối, phông, cỡ chữ');

  const css = fs.readFileSync(path.join(REPO, 'web/src/index.css'), 'utf8');
  const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
  const cfgTho = fs.readFileSync(path.join(REPO, 'tailwind.config.js'), 'utf8');
  const cfg = (await import(pathToFileURL(path.join(REPO, 'tailwind.config.js')).href)).default;
  const { toi, sang } = d.docMauHaiCheDo(css);
  const nguon = taiFile(path.join(REPO, 'web/src')).map((p) => ({ f: path.relative(REPO, p).replace(/\\/g, '/'), text: fs.readFileSync(p, 'utf8') }));

  const NEN = ['bg', 'surface', 'surface-2', 'hang-lon-bg', 'hang-con-bg'];
  const NGHIA = ['ok', 'done', 'bad', 'late', 'soon', 'doing', 'wait', 'muted'];

  for (const [ten, mau] of [['tối', toi], ['sáng', sang]] as const) {
    check(`SANG · S1 (${ten}): chữ ≥ 4.5:1 trên nền trang và nền riêng`, () => {
      const hong: string[] = [];
      const cap = (chu: string, nen: string) => {
        const a = mau[chu], b = mau[nen];
        if (!a || !b) { hong.push(`thiếu token ${!a ? chu : nen}`); return; }
        const r = d.tuongPhan(a, b);
        if (r < 4.5) hong.push(`${chu} trên ${nen} = ${r}`);
      };
      const chu = [...NGHIA.map((n) => `${n}-rgb`), 'text-dim-rgb', 'text-faint-rgb', 'chu-1-rgb', 'chu-2-rgb', 'chu-3-rgb'];
      for (const c of chu) for (const n of NEN) cap(c, n);
      for (const n of NGHIA) cap(`${n}-rgb`, `${n}-bg-rgb`);
      for (const n of [...NEN, 'surface']) { cap('text', n); cap('accent', n); }
      cap('accent-ink-rgb', 'accent');
      cap('chon-dau-rgb', 'chon-bg-rgb');
      assert(hong.length === 0, hong.join(' · '));
    });
  }

  check('SANG · S2: viền ô nhập / ô sửa ở chế độ sáng ≥ 3:1 (WCAG 1.4.11)', () => {
    const hong: string[] = [];
    for (const v of ['o-nhap-vien', 'o-sua-vien']) for (const n of ['surface', 'surface-2']) {
      if (!sang[v] || !sang[n]) { hong.push(`thiếu token ${!sang[v] ? v : n}`); continue; }
      const r = d.tuongPhan(sang[v], sang[n]);
      if (r < 3) hong.push(`${v} trên ${n} = ${r}`);
    }
    assert(hong.length === 0, hong.join(' · '));
  });

  const goc = d.docKhoiCss(css, ':root');
  const khoiSang = d.docKhoiCss(css, ':root[data-theme="light"]');

  check('SANG · S3: mọi màu gốc của :root có ở khối sáng; SOS 1/2/3 sáng khác nhau và vẫn là bí danh', () => {
    assert(khoiSang.length > 0, 'thiếu khối :root[data-theme="light"]');
    const thieu: string[] = [];
    for (const m of goc.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      const [, ten, giaTri] = m;
      if (ten === 'font-sans' || /^(var\(|rgb\(var\()/.test(giaTri.trim())) continue;
      if (!new RegExp(`--${ten}\\s*:`).test(khoiSang)) thieu.push(ten);
    }
    assert(thieu.length === 0, `khối sáng thiếu: ${thieu.join(', ')}`);
    const cung = (a: string, b: string) => sang[a] && sang[b] && sang[a].join() === sang[b].join();
    for (const [x, y] of [['sos1', 'soon'], ['sos2', 'late'], ['sos3', 'bad'], ['dat', 'ok']] as const) {
      for (const hau of ['-rgb', '-bg-rgb', '-line-rgb']) assert(cung(x + hau, y + hau), `sáng: --${x}${hau} phải bằng --${y}${hau}`);
      assert(!new RegExp(`--${x}-rgb\\s*:`).test(khoiSang), `khối sáng không chép lại bí danh --${x}-rgb`);
    }
    assert(!cung('sos1-rgb', 'sos2-rgb') && !cung('sos2-rgb', 'sos3-rgb'), 'sáng: SOS 1/2/3 phải khác màu nhau');
  });

  check('SANG · S4: index.css chỉ khai báo màu trong hai khối token (không hex, rgb/rgba số ở chỗ khác)', () => {
    const conLai = css.replace(goc, '').replace(khoiSang, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const hong = [...conLai.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g)].map((m) => m[0]);
    assert(hong.length === 0, `màu cứng ngoài khối token: ${[...new Set(hong)].join(' · ')}`);
  });

  const HEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8}|[0-9a-fA-F]{3})\b/g;
  check('SANG · S5: web/src không hex, rgb(/rgba( số, var(--x, #…)', () => {
    const hong: string[] = [];
    for (const { f, text } of nguon) for (const [n, s] of dongNguon(text)) {
      for (const m of s.matchAll(HEX)) if (/[a-fA-F]/.test(m[0]) || m[0].length > 4) hong.push(`${f}:${n} ${m[0]}`);
      if (/rgba?\(\s*\d/.test(s)) hong.push(`${f}:${n} rgb(số)`);
    }
    assert(hong.length === 0, hong.slice(0, 12).join(' · ') + (hong.length > 12 ? ` … (${hong.length})` : ''));
  });

  check('SANG · S6: mọi cấp màu Tailwind dùng trong web/src trỏ về biến (black chỉ bg-black/60)', () => {
    const hong = new Set<string>();
    const colors = cfg.theme.extend.colors as Record<string, any>;
    const trongBien = (bang: string, so: string | null) => {
      const g = so === null ? colors[bang] : colors[bang]?.[so];
      return typeof g === 'string' && g.includes('var(--');
    };
    const BANG = 'slate|ink|teal|gray|zinc|neutral|stone|rose|amber|sky|emerald|red|orange|yellow|green|blue|indigo|violet|purple|cyan|lime|pink|fuchsia';
    const re = new RegExp(`\\b(?:text|bg|border|ring|divide|outline|fill|stroke|placeholder|decoration|accent|caret|from|to|via|shadow)-(${BANG}|white|black)(?:-(\\d{2,3}))?(/[\\d.\\[\\]]+)?`, 'g');
    for (const { f, text } of nguon) for (const [, s] of dongNguon(text)) {
      for (const m of s.matchAll(re)) {
        const [tat, bang, so, alpha] = m;
        if (bang === 'black') { if (!/^bg-black/.test(tat) || alpha !== '/60') hong.add(`${f}: ${tat}`); continue; }
        if (bang === 'white') { if (!trongBien('white', null)) hong.add(`white chưa ánh xạ (${f})`); continue; }
        if (!so || !trongBien(bang, so)) hong.add(`${bang}-${so ?? ''} chưa ánh xạ (${f})`);
      }
      for (const m of s.matchAll(/theme\(colors\.(\w+)\.(\d+)\)/g)) if (!trongBien(m[1], m[2])) hong.add(`theme(colors.${m[1]}.${m[2]}) chưa ánh xạ (${f})`);
    }
    assert(hong.size === 0, [...hong].slice(0, 10).join(' · ') + (hong.size > 10 ? ` … (${hong.size})` : ''));
  });

  check('SANG · S7: phông Be Vietnam Pro tự phục vụ + chữ số thẳng cột (Inter), ghim phiên bản', () => {
    const body = /body\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
    assert(/font-family:\s*var\(--font-sans\)/.test(body), 'body phải dùng var(--font-sans)');
    assert(/--font-sans:\s*'Be Vietnam Pro'/.test(goc), "--font-sans phải bắt đầu bằng 'Be Vietnam Pro'");
    assert(cfg.theme.extend.fontFamily.sans[0] === 'var(--font-sans)', 'fontFamily.sans[0] phải là var(--font-sans)');
    const main = fs.readFileSync(path.join(REPO, 'web/src/main.tsx'), 'utf8');
    for (const w of [400, 500, 600, 700, 800]) assert(main.includes(`@fontsource/be-vietnam-pro/${w}.css`), `main.tsx thiếu import độ đậm ${w}`);
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
    const ban = pkg.dependencies?.['@fontsource/be-vietnam-pro'];
    assert(typeof ban === 'string' && /^\d/.test(ban), `@fontsource/be-vietnam-pro phải nằm ở dependencies và ghim đúng phiên bản (không ^/~), đang "${ban}"`);
    // Be Vietnam Pro không có số cùng độ rộng → chữ số 0–9 lấy từ Inter (khai lại họ 'Be Vietnam Pro', unicode-range chữ số), đủ 5 độ đậm.
    for (const w of [400, 500, 600, 700, 800]) {
      assert(new RegExp(`font-weight: ${w};[^}]*unicode-range: U\\+0030-0039;[^}]*inter-latin-${w}-normal\\.woff2`).test(css), `index.css thiếu mặt chữ số Inter độ đậm ${w}`);
    }
    const inter = pkg.dependencies?.['@fontsource/inter'];
    assert(typeof inter === 'string' && /^\d/.test(inter), `@fontsource/inter phải ghim đúng phiên bản (chỉ cho chữ số), đang "${inter}"`);
    assert(!/Inter/.test(cfgTho.replace(/\/\/.*$/gm, '')), 'tailwind.config.js không khai Inter');
  });

  check('SANG · S8: không chữ < 11 px; Nhan 11,5 px; slate-600/700 chỉ bọc dấu trang trí (E4)', () => {
    const hong: string[] = [];
    for (const { f, text } of nguon) {
      for (const [n, s] of dongNguon(text)) if (/text-\[(?:9(?:\.5)?|10|10\.5)px\]/.test(s)) hong.push(`${f}:${n} chữ nhỏ`);
      for (const m of text.matchAll(/className="[^"]*text-slate-[67]00[^"]*">\s*([^<]*?)\s*</g)) {
        const nd = m[1];
        if (nd === '' || /^[—–\-/→·|•,.]+$/.test(nd) || nd.startsWith('{')) continue;
        hong.push(`${f}: slate-600/700 bọc chữ "${nd.slice(0, 30)}"`);
      }
    }
    assert(/text-\[11\.5px\]/.test(nguon.find((x) => x.f === 'web/src/ui/Nhan.tsx')?.text ?? ''), 'ui/Nhan.tsx phải có text-[11.5px]');
    assert(hong.length === 0, hong.slice(0, 10).join(' · ') + (hong.length > 10 ? ` … (${hong.length})` : ''));
  });

  check('SANG · S9: công tắc — docCheDo, script nội dòng chống nháy, nút ◐ nằm giữa Thông báo và tài khoản', () => {
    assert(d.docCheDo('light') === 'light', "'light' → sáng");
    for (const v of [null, undefined, 'x', 'dark', '']) assert(d.docCheDo(v) === 'dark', `${String(v)} → tối`);
    assert(html.includes(d.CHE_DO_KHOA) && html.includes('document.documentElement.dataset.theme'), 'index.html thiếu script nội dòng đặt data-theme');
    const dauApp = html.indexOf('src="/web/src/main.tsx"');
    assert(html.indexOf(d.CHE_DO_KHOA) < dauApp, 'script chế độ phải chạy TRƯỚC script ứng dụng');
    const header = fs.readFileSync(path.join(REPO, 'web/src/modules/platform/Header.tsx'), 'utf8');
    const [a, b, c] = [header.indexOf('aria-label="Thông báo"'), header.indexOf('<CongTacGiaoDien'), header.indexOf('ref={nutTaiKhoan}')];
    assert(a >= 0 && b > a && c > b, 'Header.tsx: <CongTacGiaoDien /> phải nằm giữa nút Thông báo và nút tài khoản');
  });
}
