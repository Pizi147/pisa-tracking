/**
 * PHÉP KIỂM NEN-TYPO-MAU — thang chữ 12·13·14·15·17·22·28, 3 token kết quả, hệ trạng thái HTT (04 mục 2, 5, 12, 19).
 * Không mở database: đọc nguồn (`index.css`, `tailwind.config.js`, `web/src`) và đo màu (tương phản WCAG, ΔE mù màu).
 * Kế hoạch: docs/superpowers/plans/2026-10-21-pr-nen-typo-mau.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import type { RGB } from '../../../shared/domain/index.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, '')).replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const taiFile = (dir: string, out: string[] = []): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) taiFile(p, out); else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
};

/** Thang chữ (04 mục 2.2). */
export const THANG_CHU = [12, 13, 14, 15, 17, 22, 28];

export async function runPrNenTypoMauTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nNEN-TYPO-MAU · thang chữ, màu kết quả, trạng thái');

  const cssTho = fs.readFileSync(path.join(REPO, 'web/src/index.css'), 'utf8');
  const css = boChuThich(cssTho);
  const cfg = (await import(pathToFileURL(path.join(REPO, 'tailwind.config.js')).href)).default;
  const nguon = taiFile(path.join(REPO, 'web/src')).map((p) => ({ f: path.relative(REPO, p).replace(/\\/g, '/'), text: boChuThich(fs.readFileSync(p, 'utf8')) }));
  const dong = (cb: (f: string, s: string) => string | null) => {
    const hong: string[] = [];
    for (const { f, text } of nguon) text.split('\n').forEach((s, i) => { const x = cb(f, s); if (x) hong.push(`${f}:${i + 1} ${x}`); });
    return hong;
  };
  const tom = (h: string[]) => h.slice(0, 10).join(' · ') + (h.length > 10 ? ` … (${h.length})` : '');
  const ngoai = (n: number) => !THANG_CHU.includes(n);

  // ------------------------------------------------------------------ chữ
  check('NEN · K-CHU-1: mọi cỡ chữ viết tay (text-[Npx], fontSize, font-size) thuộc thang 12·13·14·15·17·22·28', () => {
    const hong = dong((_f, s) => {
      for (const m of s.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) if (ngoai(Number(m[1]))) return m[0];
      for (const m of s.matchAll(/fontSize:\s*['"]?(\d+(?:\.\d+)?)/g)) if (ngoai(Number(m[1]))) return m[0];
      return /text-\[\d+(?:\.\d+)?r?em\]/.exec(s)?.[0] ?? null;
    });
    /* 16 px chỉ cho ô nhập ở điện thoại (Safari không tự phóng to — OV-14b). */
    for (const m of css.matchAll(/([^{}]+)\{[^}]*?font-size:\s*(\d+(?:\.\d+)?)px/g)) {
      const n = Number(m[2]);
      if (n === 16 ? !/input|select|textarea|\.field/.test(m[1]) : ngoai(n)) hong.push(`index.css ${m[1].trim().slice(-40)} ${n}px`);
    }
    assert(hong.length === 0, tom(hong));
  });

  check('NEN · K-CHU-2: Tailwind chỉ có cỡ trong thang (fontSize thay, không extend); không dùng lớp cỡ ngoài cấu hình', () => {
    const co = cfg.theme.fontSize as Record<string, [string, unknown]> | undefined;
    assert(co && !cfg.theme.extend.fontSize, 'tailwind.config.js phải đặt theme.fontSize (thay thang mặc định)');
    for (const [k, v] of Object.entries(co!)) assert(THANG_CHU.includes(parseFloat(v[0])), `text-${k} = ${v[0]} ngoài thang`);
    const hong = dong((_f, s) => {
      for (const m of s.matchAll(/(?<![\w-])text-(xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g)) if (!(m[1] in co!)) return m[0];
      return null;
    });
    assert(hong.length === 0, tom(hong));
  });

  check('NEN · K-CHU-3: không IN HOA chữ tiếng Việt (chỉ ô nhập mã được uppercase)', () => {
    const MIEN = ['web/src/modules/platform/CatalogAdmin.tsx'];   // ô nhập mã (chữ Latin, ≤ 6 ký tự)
    const hong = dong((f, s) => (MIEN.includes(f) ? null : /(?<![\w:-])uppercase(?![\w-])/.exec(s)?.[0] ?? null));
    if (/text-transform:\s*uppercase/.test(css)) hong.push('index.css text-transform: uppercase');
    assert(hong.length === 0, tom(hong));
  });

  check('NEN · K-CHU-4: chữ một dòng có cắt (truncate) không dùng line-height thấp (xén dấu Việt)', () => {
    const hong = dong((_f, s) => (s.match(/["'`][^"'`]*\btruncate\b[^"'`]*["'`]/g) ?? [])
      .find((x) => /\bleading-(?:none|tight|snug|\[(?:0?\.\d+|1(?:\.[0-4]\d*)?)\])/.test(x)) ?? null);
    assert(hong.length === 0, tom(hong));
  });

  check('NEN · K-CHU-5: lớp nền theo thang — body 15, ô bảng 15, đầu cột 13, nhãn 13, nút nhỏ 13, hàng nhóm 15, hàng con 13', () => {
    const co = (boChon: string) => {
      const m = new RegExp(`(?:^|[\\s}])${boChon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css);
      return m ? Number(/font-size:\s*(\d+)px/.exec(m[1])?.[1] ?? NaN) : NaN;
    };
    const can: Array<[string, number]> = [['body', 15], ['.td', 15], ['.th', 13], ['.label', 13], ['.btn-sm', 13], ['.hang-lon > td', 15], ['.khoi-nhom-dau', 15], ['.hang-con > td', 13]];
    const hong = can.filter(([b, n]) => co(b) !== n).map(([b, n]) => `${b} = ${co(b)} (cần ${n})`);
    assert(hong.length === 0, hong.join(' · '));
  });

  // ------------------------------------------------------------------ màu kết quả
  const { toi, sang } = d.docMauHaiCheDo(cssTho);
  const goc = d.docKhoiCss(cssTho, ':root');
  const khoiSang = d.docKhoiCss(cssTho, ':root[data-theme="light"]');
  /** Token phủ dạng `rgb(var(--phu-rgb) / .08)` hoặc `rgba(r, g, b, a)` của một chế độ (sáng ghi đè tối) → [màu, độ phủ]. */
  const phu = (ten: string, cheDo: 'toi' | 'sang'): [RGB, number] | null => {
    const tim = (khoi: string) => new RegExp(`--${ten}\\s*:\\s*([^;]+);`).exec(khoi)?.[1].trim();
    const v = (cheDo === 'sang' ? tim(khoiSang) : undefined) ?? tim(goc);
    const mau = cheDo === 'sang' ? sang : toi;
    const a = v ? /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(v) : null;
    if (a) return [[+a[1], +a[2], +a[3]], +a[4]];
    const b = v ? /rgb\(var\(--([a-z0-9-]+)\)\s*\/\s*([\d.]+)\)/.exec(v) : null;
    if (b) return mau[b[1]] ? [mau[b[1]], +b[2]] : null;
    return mau[ten] ? [mau[ten], 1] : null;   // NEN-V5: token đặc (#hex) = phủ 100 %
  };

  for (const [ten, cheDo, mau] of [['tối', 'toi', toi], ['sáng', 'sang', sang]] as const) {
    check(`NEN · K-MAU-1 (${ten}): kq-vượt / bằng / dưới + chữ chính ≥ 4,5 : 1 trên 9 nền thật`, () => {
      const hong: string[] = [];
      for (const k of ['kq-vuot-rgb', 'kq-bang-rgb', 'kq-duoi-rgb']) if (!mau[k]) hong.push(`thiếu --${k}`);
      const re = phu('phu-re', cheDo), mem = phu('accent-soft', cheDo);
      if (!re) hong.push('thiếu --phu-re');
      if (!mem) hong.push('thiếu --accent-soft');
      assert(hong.length === 0, hong.join(' · '));
      const nen: Record<string, RGB | undefined> = {
        trang: mau.bg, the: mau.surface, 'the-2': mau['surface-2'], 'nut-re': mau['nut-hover'], 'hang-nhom': mau['hang-lon-bg'],
        'hang-con': mau['hang-con-bg'], 'da-thi': mau['da-thi-bg-rgb'], 'noi-bat': d.tronMau(mem![0], mau.surface, mem![1]),
        'hang-re': d.tronMau(re![0], mau.surface, re![1]),
      };
      for (const chu of ['kq-vuot-rgb', 'kq-bang-rgb', 'kq-duoi-rgb', 'text']) for (const [tenNen, n] of Object.entries(nen)) {
        if (!n) { hong.push(`thiếu nền ${tenNen}`); continue; }
        const r = d.tuongPhan(mau[chu], n);
        if (r < 4.5) hong.push(`${chu} trên ${tenNen} = ${r}`);
      }
      assert(hong.length === 0, hong.join(' · '));
    });

    check(`NEN · K-MAU-2 (${ten}): vượt ↔ dưới còn khác khi mù màu đỏ–lục (deutan ΔE ≥ 10); ba token khác nhau`, () => {
      const [v, b, u] = ['kq-vuot-rgb', 'kq-bang-rgb', 'kq-duoi-rgb'].map((k) => mau[k]);
      assert(v && b && u, 'thiếu token kq');
      const e = d.deltaE(d.moPhongMuMau(v, 'deutan'), d.moPhongMuMau(u, 'deutan'));
      assert(e >= 10, `deutan ΔE(vượt, dưới) = ${e}`);
      assert(d.deltaE(v, b) >= 10 && d.deltaE(b, u) >= 10, `ΔE thường: vượt–bằng ${d.deltaE(v, b)} · bằng–dưới ${d.deltaE(b, u)}`);
    });
  }

  check('NEN · K-MAU-3: ký hiệu / số điểm chỉ tô bằng token kq (không ok / bad / doing / rose / emerald)', () => {
    const bt = nguon.find((x) => x.f === 'web/src/ui/BieuTuong.tsx')!.text;
    const than = (ten: string) => { const i = bt.indexOf(`export function ${ten}`); return i < 0 ? '' : bt.slice(i, bt.indexOf('\nexport ', i + 1)); };
    const hong: string[] = [];
    for (const ten of ['lopKq', 'DauKetQua', 'MuiTenKyVong']) {
      const s = than(ten);
      if (!s) hong.push(`thiếu ${ten}`);
      else if (/text-(?:ok|bad|doing|rose|emerald|sky)\b/.test(s)) hong.push(`${ten} còn màu ngoài kq`);
    }
    if (!['vuot', 'bang', 'duoi'].every((k) => than('lopKq').includes(`text-kq-${k}`))) hong.push('lopKq phải trả text-kq-*');
    const lon = nguon.find((x) => x.f === 'web/src/modules/fasttrack/ODiemLon.tsx')!.text;
    if (/text-(?:ok|bad|doing|rose|emerald)\b/.test(lon)) hong.push('ODiemLon còn màu ngoài kq');
    if (!/lopKq\(/.test(lon)) hong.push('ODiemLon chưa tô số bằng lopKq');
    assert(hong.length === 0, hong.join(' · '));
  });

  // ------------------------------------------------------------------ trạng thái HTT
  check('NEN · K-HTT-1: rê chuột chỉ qua .bam / .do-hang (không hover:bg-white tự viết)', () => {
    const hong = dong((_f, s) => /hover:bg-white\/[\d[]/.exec(s)?.[0] ?? null);
    for (const lop of ['.bam', '.do-hang', '.dang-mo']) if (!new RegExp(`\\${lop}[\\s:,{>]`).test(css)) hong.push(`index.css thiếu ${lop}`);
    if (!/--phu-re\s*:/.test(goc) || !/--phu-do\s*:/.test(goc)) hong.push('thiếu --phu-re / --phu-do');
    assert(hong.length === 0, tom(hong));
  });

  check('NEN · K-HTT-2: đang chọn = nền nhấn nhạt + vạch trái 3 px (không viền khung 2 px)', () => {
    const khoi = [...css.matchAll(/([^{}]*(?:\.dang-mo|\.row-active)[^{}]*)\{([^}]*)\}/g)].map((m) => m[2]).join('\n');
    assert(/var\(--accent-soft\)/.test(khoi), 'đang chọn phải có nền --accent-soft');
    assert(/inset 3px 0 0 var\(--accent-strong\)/.test(khoi), 'đang chọn phải có vạch trái 3 px --accent-strong');
    assert(!/inset 0 0 0 2px|inset 0 2px 0/.test(khoi), 'còn viền khung 2 px (trùng vòng focus)');
  });

  check('NEN · K-HTT-3: "Đã lưu" một cách báo — xám, không xanh lá (trùng ✓ vượt kỳ vọng)', () => {
    const hong = dong((_f, s) => (/Đã lưu/.test(s) && /text-(?:ok|emerald|dat)\b/.test(s) ? 'Đã lưu màu xanh' : null));
    assert(hong.length === 0, tom(hong));
  });
}
