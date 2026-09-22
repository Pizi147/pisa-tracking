/**
 * PHÉP KIỂM PR-O — khung 4 khu vực + hàm chung ngày/tuần G-6 (spec 2026-09-22-ux-toan-web-truoc-deploy-design §1, §3.1).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runKhungTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-O · Khung 4 khu vực');

  check('PR-O · G-6 ngày: dd/mm cùng năm, dd/mm/yyyy khác năm, không bao giờ ISO', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.ngay('2026-09-22', '2026-09-22'), '22/09', 'Cùng năm');
    eq(d.ngay('2026-09-22T10:00:00Z', '2026-01-01'), '22/09', 'Có giờ vẫn chỉ lấy ngày');
    eq(d.ngay('2027-01-04', '2026-09-22'), '04/01/2027', 'Khác năm phải có năm');
    eq(d.ngay('2026-09-22'), '22/09/2026', 'Không biết hôm nay thì ghi đủ năm');
    eq(d.ngay(null, '2026-09-22'), '—', 'Trống');
    eq(d.ngay('abc', '2026-09-22'), '—', 'Chuỗi lạ');
    for (const s of ['2026-09-22', '2027-01-04', '2026-12-31T23:00:00Z']) {
      assert(!/\d{4}-\d{2}/.test(d.ngay(s, '2026-09-22')), `Lộ ISO: ${d.ngay(s, '2026-09-22')}`);
    }
  });

  check('PR-O · G-6 tuần lịch: "W3 SEP" (tháng chứa thứ Năm), năm chỉ khi khác năm hiện tại', () => {
    const eq = (got: string, want: string, m: string) => assert(got === want, `${m}: "${got}" ≠ "${want}"`);
    eq(d.tuanLich('2026-09-16', '2026-09-22'), 'W3 SEP', 'Thứ Tư 16/09/2026');
    eq(d.tuanLich('2026-09-14', '2026-09-22'), 'W3 SEP', 'Thứ Hai cùng tuần');
    eq(d.tuanLich('2026-09-28', '2026-09-22'), 'W1 OCT', '28/09 thuộc tháng 10 (thứ Năm 01/10)');
    eq(d.tuanLich('2027-01-01', '2026-09-22'), 'W5 DEC', '01/01/2027 vẫn thuộc W5 DEC 2026 — cùng năm với hôm nay');
    eq(d.tuanLich('2027-01-06', '2026-09-22'), 'W1 JAN 2027', 'Sang năm mới phải ghi năm');
    eq(d.tuanLich('2026-09-16'), 'W3 SEP', 'Không truyền hôm nay thì không ghi năm');
    eq(d.tuanLich(undefined, '2026-09-22'), '—', 'Trống');
    assert(!/Tuần|T\d/.test(d.tuanLich('2026-09-16', '2026-09-22')), 'Không dùng "Tuần 36" hay "T5"');
  });

  check('PR-O · G-6 tuần học trong khoá: "W8/8"', () => {
    assert(d.tuanKhoa(8, 8) === 'W8/8', d.tuanKhoa(8, 8));
    assert(d.tuanKhoa(3, 10) === 'W3/10', d.tuanKhoa(3, 10));
    assert(d.tuanKhoa(0, 8) === '—' && d.tuanKhoa(3, 0) === '—' && d.tuanKhoa(2.5, 8) === '—', 'Số không hợp lệ phải ra "—"');
  });
}
