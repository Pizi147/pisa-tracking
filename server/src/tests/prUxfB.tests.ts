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

  // ------------------------------------------------------------------ Task 2 · hồ sơ lớp, dải chuyển lớp, thẻ Lịch thi, lịch MT
  const yc: any = await import('../duyet/yeuCau.ts');
  check('UXF-b (2) · U5: thẻ Lịch thi (Chờ duyệt) nói "đề nghị W…" / "thi tuần W…", năm hiện tại không có "2026"', () => {
    const the = yc.hopChoDuyet(t.P.mbManager).the.filter((x: any) => x.loai === 'lich_thi' && /đề nghị W/.test(x.dong[0] ?? ''));
    assert(the.length > 0, 'seed không có thẻ Lịch thi chờ có tuần đề nghị');
    for (const x of the) {
      assert(/đề nghị W\d [A-Z]{3}(?! \d)/.test(x.dong[0]), x.dong[0]);
      assert(!x.neuDuyet || /thi tuần W\d [A-Z]{3}\.$/.test(x.neuDuyet), String(x.neuDuyet));
    }
  });
  check('UXF-b (2) · quét chữ: hồ sơ lớp, dải Sắp chuyển, lịch MT, panel Tạm dừng nói mã tuần', () => {
    assert(!/ngày \{ngay\(dai\.ngayRaLenh/.test(doc('web/src/modules/classes/DaiChuyenLop.tsx')), 'R5-1: dải Sắp chuyển còn "ngày dd/mm"');
    assert(!/ngay\(data\.startWeekStart/.test(doc('web/src/modules/classes/ClassProgressPanel.tsx')), 'Khai giảng còn ngày');
    const dt = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(!/ngay\(data\.finishedAt/.test(dt) && /tuanLich\(data\.finishedAt/.test(dt), 'Lớp đã kết thúc');
    const ta = doc('web/src/modules/classes/TeacherAssignPanel.tsx');
    assert(!/ngay\(h\.from/.test(ta) && /tuanLich\(h\.from/.test(ta), 'Đã từng dạy');
    const kh = doc('web/src/modules/students/StudentPlanPanel.tsx');
    assert(!/fmtDate\(r\.weekStart\)/.test(kh) && !/\{r\.code\}/.test(kh), 'lịch MT còn .code / dd/mm/yyyy');
    assert(!/kết thúc \{cycle\.endWeek\.code\}/.test(doc('web/src/modules/students/StudentManagePanel.tsx')), 'panel Tạm dừng in mã tuần có năm');
  });
}
