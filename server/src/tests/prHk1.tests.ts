/**
 * PHÉP KIỂM PR-HK1 — đợt trước deploy (kế hoạch 2026-10-02-ux-sau-critique: H3, H4, H5).
 * K1/K3 là CSS: kiểm bằng ảnh và đo Playwright ở 375 px, không quét nguồn.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const doc = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

export function runPrHk1Tests({ check, assert }: Pick<YThucTestKit, 'check' | 'assert'>) {
  console.log('\nPR-HK1 · H3–H5');
  check('H3 · KetQuaDot không vẽ "·" ở đầu badge (· Chưa có điểm · 0/4 kỹ năng)', () => {
    assert(!/'·'/.test(doc('web/src/ui/KetQuaDot.tsx')), "KetQuaDot còn dấu '·' làm biểu tượng");
  });
  check('H4 · nhãn phân loại ở thẻ Chờ duyệt là chip không viền (không giống nút)', () => {
    const s = doc('web/src/modules/duyet/TheYeuCau.tsx');
    const nhan = s.split('\n').find((l) => /w-24 shrink-0/.test(l)) ?? '';
    assert(nhan && !/\bborder\b/.test(nhan) && /bg-muted-bg/.test(nhan), `nhãn phân loại: ${nhan.trim()}`);
    assert(!/borderColor: 'var\(--line-strong\)' \}\}>\{yc\.nhanPhanLoai\}/.test(s), 'nhãn phân loại còn viền var(--line-strong)');
  });
  check('H5 · (V8-PT, mockup v8 chủ SP duyệt 29/10) Phân tích Test + SOS không còn chú giải màu riêng — đầu cột ghi chữ Đạt / SOS n, giải thích ở ⓘ Cách tính đầu thẻ', () => {
    const s = doc('web/src/modules/phanTich/TongHopTestSos.tsx');
    assert(!s.includes('aria-label="Chú giải màu kết quả"'), 'còn khối chú giải màu');
    assert(/cachTinh=\{/.test(s), 'thiếu ⓘ Cách tính ở đầu thẻ');
  });
}
