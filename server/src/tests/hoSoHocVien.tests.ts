/**
 * PHÉP KIỂM PR-HV — hồ sơ học viên 3 tab + Ý thức & Phối hợp theo prototype v3 (spec 2026-09-22).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
// dist-server/server/src/tests → gốc repo. Kiểm lại bằng assert số file ở dưới; sai thì chỉnh số '..'.

/**
 * File đóng băng vì PR-Z2b chạy song song — Task 9 XOÁ danh sách này (để mảng rỗng).
 * `server/src/ops/` cũng đóng băng (Global Constraints 🧊) dù plan gốc không liệt kê ở đây — `ops/initBanChinh.ts` có
 * hai chỗ "hãy" (🆕 22/09), làm ở Task 9 cùng ba file kia.
 */
const CHO_Z2B = ['server/src/yThuc/measures.ts', 'server/src/migrate.ts', 'server/src/seed/', 'server/src/ops/'];
/** Dòng được phép giữ chữ cũ (không phải chữ người dùng thấy). Mỗi mục: [đường dẫn, chuỗi con của dòng]. */
const CHO_PHEP: Array<[string, string]> = [];

function boChuThich(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')          // /* … */ và {/* … */}
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');     // // … (không cắt 'http://')
}
const CHU_CU: Array<[string, RegExp]> = [
  ['biện pháp', /[Bb]iện pháp|BIỆN PHÁP/],
  ['BP', /(^|[^A-Za-z0-9_])BP([^A-Za-z0-9_]|$)/],
  ['Hãy', /(^|[^\p{L}])[Hh]ãy\s/u],
];

export async function runHoSoHocVienTests(t: YThucTestKit) {
  const { check, assert } = t;
  console.log('\nPR-HV · Hồ sơ học viên 3 tab + Ý thức & Phối hợp v3');

  check('PR-HV · D1/D3 Chữ người dùng thấy không còn "biện pháp", "BP", "Hãy" (chú thích được giữ)', () => {
    const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === 'tests' || e.name === 'node_modules' ? [] : walk(p);
      return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
    });
    const files = ['web/src', 'shared', 'server/src'].flatMap((d) => walk(path.join(ROOT, d)))
      .map((f) => path.relative(ROOT, f).replace(/\\/g, '/'))
      .filter((f) => !CHO_Z2B.some((z) => f.startsWith(z)));
    assert(files.length > 80, `Quét quá ít file (${files.length}) — sai ROOT?`);
    const hits: string[] = [];
    for (const f of files) {
      const lines = boChuThich(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n');
      lines.forEach((line, i) => {
        if (CHO_PHEP.some(([pf, s]) => pf === f && line.includes(s))) return;
        for (const [ten, re] of CHU_CU) if (re.test(line)) hits.push(`${f}:${i + 1} "${ten}": ${line.trim().slice(0, 90)}`);
      });
    }
    assert(hits.length === 0, `Còn ${hits.length} chỗ:\n    ${hits.join('\n    ')}`);
  });
}
