/**
 * PHÉP KIỂM R1-PHAN-CAP-TEST (kế hoạch docs/superpowers/plans/2026-10-26-r1-phan-cap-test.md) — kiểm tĩnh mã web:
 * (TOKEN) 4 token màu cấp có ở cả chế độ tối (:root) và sáng.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runR1PhanCapTestTests({ check, assert }: { check: (ten: string, fn: () => void) => void; assert: (c: unknown, m: string) => void }) {
  /* DAN: Dán từ Excel điểm đã bỏ ở MỌI nơi (R1-BO-DAN-EXCEL #601) — phép kiểm OV15b-2 giữ luật đó. */
  check('R1-PHAN-CAP-TEST · TOKEN: --cap-nhom / --cap-lop / --cap-lop-dong / --cap-dau-cot có ở tối và sáng', () => {
    const css = doc('web/src/index.css');
    const sang = css.slice(css.indexOf(':root[data-theme="light"] {'));
    const toi = css.slice(0, css.indexOf(':root[data-theme="light"] {'));
    for (const k of ['--cap-nhom', '--cap-lop', '--cap-lop-dong', '--cap-dau-cot']) {
      assert(new RegExp(`${k}:\\s*#`).test(toi), `thiếu ${k} ở chế độ tối`);
      assert(new RegExp(`${k}:\\s*#`).test(sang.slice(0, sang.indexOf('}'))), `thiếu ${k} ở chế độ sáng`);
    }
  });
}
