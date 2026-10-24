/**
 * PHÉP KIỂM P3 UI-CHUNG (chủ SP 24/10 — đặc tả `2026-10-24-cai-tien-da-chot-design.md` R6.2, R6.3a, R6.4a, R6.4b). Đọc nguồn khi không kiểm được hành vi.
 *   UIC-1  "Mới dùng PISA TRACKING?" (bỏ "Mới dùng PISA?") + khoá EN
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (p: string) => fs.readFileSync(path.join(REPO, p), 'utf8').replace(/\r\n/g, '\n');

export async function runPrUiChungTests(t: any) {
  const { check, assert } = t;
  console.log('\nP3 UI-CHUNG');
  check('UIC-1 · dải Tổng quan ghi "Mới dùng PISA TRACKING?", khoá EN "New to PISA TRACKING?"', () => {
    const dai = doc('web/src/modules/huongDan/DaiMoiDung.tsx');
    assert(!dai.includes("'Mới dùng PISA?'"), 'còn chữ cũ');
    assert(dai.includes("t('Mới dùng PISA TRACKING?')"), 'thiếu chữ mới');
    const en = doc('shared/i18n/en/hd.ts');
    assert(en.includes("'Mới dùng PISA TRACKING?': 'New to PISA TRACKING?'"), 'thiếu khoá EN');
    assert(!en.includes("'Mới dùng PISA?'"), 'khoá EN cũ còn');
  });
}
