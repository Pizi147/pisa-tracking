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
  check('H5 · chú giải màu ở Phân tích là chú giải (ô màu + chữ), không phải chip có viền như nút', () => {
    const s = doc('web/src/modules/phanTich/TongHopTestSos.tsx');
    const khoi = s.split('aria-label="Chú giải màu kết quả"')[1]?.split('</span>}')[0] ?? '';
    assert(khoi, 'không thấy khối chú giải');
    assert(!/<button|onClick|aria-pressed/.test(khoi), 'chú giải có hành vi bấm — nếu là bộ lọc thì cần aria-pressed');
    assert(!/rounded-md border px-1\.5/.test(khoi), 'chú giải còn kiểu chip viền như nút');
  });
}
