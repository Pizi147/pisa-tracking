/**
 * PHÉP KIỂM PR-HK2 — Badge & chữ (kế hoạch 2026-10-07-pr-hk2-badge-chu). Quét nguồn (bỏ chú thích) như prUxG / prKhung:
 * khoá lớp CSS đúng ở GỐC CHUNG. Đo trên trang thật: `scripts/do-khung.mjs` (chạy tay).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const doc = (rel: string) => boChuThich(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
/** Thân một hàm `export function ten(` tới export kế tiếp. */
const than = (src: string, ten: string) => {
  const i = src.indexOf(`export function ${ten}`);
  if (i < 0) throw new Error(`không thấy ${ten}`);
  const j = src.indexOf('\nexport ', i + 1);
  return src.slice(i, j < 0 ? undefined : j);
};
const tsx = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? tsx(`${dir}/${e.name}`) : e.name.endsWith('.tsx') ? [`${dir}/${e.name}`] : []);

export async function runPrHk2Tests(t: Pick<YThucTestKit, 'check' | 'assert'>) {
  const { check, assert } = t;
  console.log('\nPR-HK2 · Task 1 · hai họ chip, "+n", ⋯, nút lọc');

  check('C1 · Nhan.tsx export CHIP_TRON và CHIP_VUONG: cùng text-[11.5px], leading-[18px], border', () => {
    const s = doc('web/src/ui/Nhan.tsx');
    for (const ten of ['CHIP_TRON', 'CHIP_VUONG']) {
      const m = new RegExp(`export const ${ten} = '([^']*)'`).exec(s);
      assert(m, `${ten} chưa export`);
      for (const lop of ['text-[11.5px]', 'leading-[18px]', 'border']) assert(m![1].split(' ').includes(lop), `${ten} thiếu ${lop}`);
    }
  });

  check('C2 · Level, Task, Info, Status, Alert, Outcome, NhanTrangThai, MissingBadge, NhanViPham, NhanLoai lấy lớp từ CHIP_TRON / CHIP_VUONG (không text-[11px])', () => {
    const ui = doc('web/src/ui/ui.tsx');
    for (const [ten, hang] of [['Level', 'CHIP_TRON'], ['Task', 'CHIP_VUONG'], ['Info', 'CHIP_VUONG'], ['Status', 'CHIP_VUONG'], ['Alert', 'CHIP_VUONG'],
      ['Outcome', 'CHIP_VUONG'], ['NhanTrangThai', 'CHIP_VUONG']] as const) {
      const n = than(ui, ten);
      assert(n.includes(hang), `${ten} chưa dùng ${hang}`);
      assert(!/text-\[11px\]/.test(n), `${ten} còn text-[11px]`);
    }
    for (const [f, ten] of [['web/src/modules/students/MissingBadge.tsx', null], ['web/src/modules/yThuc/NhanViPham.tsx', null], ['web/src/modules/cases/SkillBoard.tsx', 'NhanLoai']] as const) {
      const s = ten ? than(doc(f), ten) : doc(f);
      assert(/CHIP_VUONG/.test(s) && !/text-\[11(\.5)?px\]/.test(s), `${f}: chưa dùng CHIP_VUONG hoặc còn chữ 11 px trong chip`);
    }
  });

  check('C3 · không chip rounded-full tự dựng ngoài ui/Nhan.tsx (trừ vòng số bước KhungPanel, nút điểm 44 px MotKyNang)', () => {
    const CHO_PHEP = ['web/src/ui/Nhan.tsx', 'web/src/ui/KhungPanel.tsx', 'web/src/modules/cham/MotKyNang.tsx'];
    const sai: string[] = [];
    for (const f of tsx('web/src')) {
      if (CHO_PHEP.includes(f)) continue;
      doc(f).split('\n').forEach((dong, i) => {
        if (/rounded-full/.test(dong) && /text-\[11|text-xs|px-1\.5|px-2|px-\[7/.test(dong)) sai.push(`${f}:${i + 1}`);
      });
    }
    assert(sai.length === 0, `chip rounded-full tự dựng: ${sai.join(', ')}`);
  });

  check('C4 · MissingBadge không còn màu amber cứng; nằm trong danh sách cấm màu của nenGiaoDien', () => {
    assert(!/amber-/.test(doc('web/src/modules/students/MissingBadge.tsx')), 'MissingBadge còn amber-');
    assert(doc('server/src/tests/nenGiaoDien.tests.ts').includes("'web/src/modules/students/MissingBadge.tsx'"), 'nenGiaoDien chưa kiểm MissingBadge');
  });

  check('C5 · một kiểu ⋯: không còn "⋮" trong mã web; "+n" dùng MenuDong kieu="chip" (HVL, hồ sơ lớp)', () => {
    const con = tsx('web/src').filter((f) => doc(f).includes('⋮'));
    assert(con.length === 0, `còn ⋮: ${con.join(', ')}`);
    assert(/kieu === 'chip'/.test(doc('web/src/ui/MenuDong.tsx')), 'MenuDong thiếu kieu="chip"');
    for (const f of ['web/src/modules/students/StudentsPage.tsx', 'web/src/modules/classes/DauTrangLop.tsx']) {
      assert(/<MenuDong kieu="chip" bieuTuong=\{`\+/.test(doc(f)), `${f}: "+n" chưa dùng kieu="chip"`);
    }
    assert(!/label="⋮"/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'StudentDetailPage còn label="⋮"');
  });

  check('C6 · nút lọc viên thuốc: năm chỗ dùng `.nut-loc`, index.css có `.nut-loc`', () => {
    assert(/\.nut-loc\s*\{/.test(doc('web/src/index.css')), 'index.css thiếu .nut-loc');
    for (const f of ['web/src/modules/students/StudentsPage.tsx', 'web/src/modules/test/LichTestTab.tsx', 'web/src/modules/phanTich/HieuQuaPa.tsx',
      'web/src/modules/test/NganXuatMt.tsx', 'web/src/modules/test/keHoach/NganXepLichMt.tsx']) {
      assert(/\bnut-loc\b/.test(doc(f)), `${f}: chưa dùng nut-loc`);
    }
  });
}
