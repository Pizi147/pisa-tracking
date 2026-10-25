/**
 * PHÉP KIỂM PR-TEN — tên BÀI lớp thường là Progress Test / Final Test; "Cuối khoá" chỉ còn khi chỉ THỜI ĐIỂM khoá
 * (danh sách được phép CHO_PHEP bên dưới). Quét nguồn đã bỏ chú thích; tests không quét.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const boChuThich = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const nguonTs = (dir: string): string[] => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (e.name === 'tests' || e.name === 'node_modules' ? [] : nguonTs(`${dir}/${e.name}`)) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []);

/** Chữ THỜI ĐIỂM khoá được giữ "Cuối khoá" (kế hoạch PR-TEN, chủ sản phẩm 10/10). */
/** Tên TRANG Cuối khoá của lớp (P9b — chủ SP duyệt mockup v6 cuoi-khoa): không phải tên bài. */
export const CUOI_KHOA_TRANG = ['Cuối khoá…', 'Cuối khoá ›', 'Cuối khoá · {lop}', "'Cuối khoá'", 'trang Cuối khoá', 'Trang Cuối khoá', 'TRANG CUỐI KHOÁ', 'Cuối khoá lớp', 'Cuối khoá (', 'Cuối khoá:', 'Cuối khoá —', 'CuoiKhoaLop', 'trang con Cuối khoá', 'nhóm Cuối khoá', 'End of course'];
const CHO_PHEP = ['đến Cuối khoá', ...CUOI_KHOA_TRANG];

export async function runPrTenTests(t: YThucTestKit) {
  const { check, assert, TODAY, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-TEN · Progress Test / Final Test là tên bài; "Cuối khoá" chỉ là mốc thời điểm');

  check('TEN-1 · web/src + shared + server/src (chữ hiện ra): không còn "Giữa khoá"; "Cuối khoá" chỉ trong danh sách được phép', () => {
    const sai: string[] = [];
    for (const dir of ['web/src', 'shared', 'server/src']) for (const f of nguonTs(dir)) {
      boChuThich(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n').forEach((dong, i) => {
        const dg = dong.normalize('NFC');
        const giua = /giữa\s+kh[oó]á/i.test(dg) || /kiểm tra (giữa|cuối)\s+kh/i.test(dg);
        const cuoi = /cuối\s+kh[oó]á/i.test(dg) && !CHO_PHEP.some((c) => dg.includes(c));
        if (giua || cuoi) sai.push(`${f}:${i + 1}: ${dg.trim().slice(0, 100)}`);
      });
    }
    assert(sai.length === 0, `${sai.length} chỗ còn chữ cũ:\n${sai.slice(0, 30).join('\n')}`);
  });

  check('TEN-2 · nhãn bài một nguồn: Progress Test / Final Test; mốc PA bổ trợ nói "đến Cuối khoá" (thời điểm, không phải tên bài)', () => {
    assert(d.ATTEMPT_KIND_LABEL.progress === 'Progress Test' && d.ATTEMPT_KIND_LABEL.final === 'Final Test', JSON.stringify(d.ATTEMPT_KIND_LABEL));
    assert(d.mocChuBoTro(null, TODAY) === 'đến Cuối khoá · chưa có lịch', d.mocChuBoTro(null, TODAY));
    assert(/^đến Cuối khoá · W\d /.test(d.mocChuBoTro(addDays(TODAY, 20), TODAY)), 'mã tuần');
    assert(d.mocChuPa({ span: 'den_cuoi_khoa', followupDue: null, mtKe: null, daXacNhan: false }, TODAY) === 'đến Cuối khoá', 'PA chưa chạy');
  });
}
