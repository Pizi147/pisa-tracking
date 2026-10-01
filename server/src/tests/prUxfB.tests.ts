/** PHÉP KIỂM PR-UXF-b — mã tuần toàn web + việc sót (kế hoạch 2026-10-01-pr-uxf-b-ma-tuan, nhãn [UXF-b]). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (rel: string) => fs.readFileSync(path.join(REPO, rel), 'utf8');

export async function runPrUxfBTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-UXF-b · Mã tuần toàn web + việc sót');

  // ------------------------------------------------------------------ Task 1 · ô chọn tuần, bộ chọn tuần
  check('UXF-b (1) · docTuanLich: đi-về với tuanLich cho mọi Thứ Hai 2026-01-05 → 2027-12-27 (hôm nay 14/09/2026 và 11/01/2027); mã sai → null', () => {
    for (const h of ['2026-09-14', '2027-01-11']) {
      for (let t2 = '2026-01-05'; t2 <= '2027-12-27'; t2 = new Date(Date.parse(`${t2}T00:00:00Z`) + 7 * 86_400_000).toISOString().slice(0, 10)) {
        const ma = d.tuanLich(t2, h);
        assert(d.docTuanLich(ma, h) === t2, `${h}: ${ma} → ${d.docTuanLich(ma, h)} (cần ${t2})`);
      }
    }
    assert(d.docTuanLich('W9 SEP', '2026-09-14') === null, 'W9 SEP');
    assert(d.docTuanLich('W5 SEP', '2026-09-14') === null, 'tháng 9/2026 chỉ có 4 tuần');
    assert(d.docTuanLich('W4 ABC', '2026-09-14') === null, 'W4 ABC');
    assert(d.docTuanLich('abc', '2026-09-14') === null && d.docTuanLich('', '2026-09-14') === null, 'rỗng / lạ');
    assert(d.docTuanLich(' w4 sep ', '2026-09-14') === '2026-09-21', 'chữ thường + khoảng trắng');
  });

  check('UXF-b (1) · ô tuần: ô hiện mã tuần, dòng phụ là khoảng ngày; gõ "W4 SEP" và gõ một ngày trong tuần đều nhận; lỗi nói mã tuần', () => {
    const H = '2026-09-14';
    assert(d.hienONgay('2026-08-24', 'tuan', H) === 'W4 AUG', d.hienONgay('2026-08-24', 'tuan', H));
    assert(d.phuONgay('2026-08-24', 'tuan', H) === '24/08 – 30/08', d.phuONgay('2026-08-24', 'tuan', H));
    assert(d.hienONgay('2026-09-28', 'ngay', H) === '28/09/2026' && d.hienONgay('2026-10', 'thang', H) === '10/2026', 'kiểu khác giữ nguyên');
    assert(d.docONgay('W4 SEP', 'tuan', H).iso === '2026-09-21', 'W4 SEP');
    assert(d.docONgay('23/09', 'tuan', H).iso === '2026-09-21', 'gõ ngày vẫn nhận');
    assert(d.docONgay('W4 SEP', 'tuan', H, { moc: 'cuoi' }).iso === '2026-09-27', 'moc=cuoi vẫn ra Chủ nhật');
    const sai = d.docONgay('abc', 'tuan', H);
    assert(sai.iso === null && /W4 SEP/.test(sai.loi), String(sai.loi));
    const truoc = d.docONgay('W1 SEP', 'tuan', H, { toiThieu: '2026-09-14' });
    assert(truoc.loi === 'Không được trước W3 SEP', String(truoc.loi));
    assert(d.docONgay('W4 SEP', 'tuan', H, { toiDa: '2026-09-14' }).loi === 'Không được sau W3 SEP', 'toiDa');
    const c = d.chotONgay('W4 SEP', '2026-09-14', 'tuan', H);
    assert(c.phat === '2026-09-21' && c.text === 'W4 SEP', JSON.stringify(c));
    assert(d.chotONgay('W3 SEP', '2026-09-14', 'tuan', H).phat === null, 'chữ chưa sửa không báo lại');
  });

  check('UXF-b (1) · quét chữ: bộ chọn tuần không còn bộ định dạng ngày tự viết; ba hàm định dạng thừa đã xoá; ONgay truyền homNay', () => {
    const fl = doc('web/src/ui/Filters.tsx');
    assert(!/\brangeOf\b/.test(fl) && !/const dm = /.test(fl), 'Filters.tsx còn dm/rangeOf');
    assert(!/\bdm\(/.test(doc('web/src/modules/test/keHoach/TuanNho.tsx')) && !/const dm = /.test(doc('web/src/modules/test/keHoach/TuanNho.tsx')), 'TuanNho còn dm');
    assert(!/weekCodeShortOf/.test(doc('shared/domain/week.ts')), 'weekCodeShortOf');
    const u = doc('server/src/util.ts');
    assert(!/function weekLabel|formatDateVi/.test(u), 'weekLabel/formatDateVi');
    assert(/hienONgay\(value, kieu, homNay\)/.test(doc('web/src/ui/ONgay.tsx')), 'ONgay truyền homNay');
    assert(/W4 SEP hoặc dd\/mm/.test(doc('web/src/ui/ONgay.tsx')), 'placeholder ô tuần');
  });
}
