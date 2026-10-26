/**
 * PHÉP KIỂM R1-PHAN-CAP-TEST (kế hoạch docs/superpowers/plans/2026-10-26-r1-phan-cap-test.md) — kiểm tĩnh mã web:
 * (DAN) bỏ "Dán từ Excel" + "?" CHỈ ở lưới mở tại chỗ của Lịch Test (chủ SP 26/10) — panel Nhập điểm (Công việc) và Điểm theo lớp vẫn có;
 * (TOKEN) 4 token màu cấp có ở cả chế độ tối (:root) và sáng.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runR1PhanCapTestTests({ check, assert }: { check: (ten: string, fn: () => void) => void; assert: (c: unknown, m: string) => void }) {
  check('R1-PHAN-CAP-TEST · DAN: LuoiNhung tắt Dán theo coLinkRieng; chỉ hai lưới Lịch Test (HangLop, KhoiNo) bật coLinkRieng', () => {
    assert(/<LuoiChamLop[\s\S]{0,600}?anDan=\{coLinkRieng\}/.test(doc('web/src/modules/test/lichTest/LuoiNhung.tsx')), 'LuoiNhung phải truyền anDan={coLinkRieng}');
    for (const f of ['web/src/modules/test/lichTest/HangLop.tsx', 'web/src/modules/test/lichTest/KhoiNo.tsx']) {
      assert(/<LuoiNhung[\s\S]{0,600}?coLinkRieng/.test(doc(f)), `${f}: lưới Lịch Test phải có coLinkRieng`);
    }
    const panel = doc('web/src/modules/congViec/PanelViec.tsx');
    assert(!/\banDan\b|\bcoLinkRieng\b/.test(panel), 'PanelViec (panel Nhập điểm) giữ Dán từ Excel — không anDan / coLinkRieng');
    assert(!/\banDan\b/.test(doc('web/src/modules/cham/DiemTheoLop.tsx')), 'Điểm theo lớp giữ Dán từ Excel — không anDan');
    assert(/const coDan = !anDan &&/.test(doc('web/src/modules/cham/LuoiChamLop.tsx')), 'LuoiChamLop: anDan tắt nút Dán + ?');
  });
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
