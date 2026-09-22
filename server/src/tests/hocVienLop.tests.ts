/**
 * PHÉP KIỂM PR-Qa — Học viên & Lớp + Hồ sơ lớp (đặc tả 2026-09-22-ux-toan-web-truoc-deploy-design §1, §3.6, §3.7, §4, §7 dòng Qa;
 * kiểm kê Q1–Q5, Q10–Q13, K2-6a, YT-8). Tên mỗi phép kiểm bắt đầu bằng "PR-Qa ·".
 *
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database. Lớp và học viên dùng để đếm do CHÍNH file này tạo
 * (mã lớp "MB-FT QA…", "MB-FOU QA…"), nên số đếm không lẫn dữ liệu demo. Ngày demo cố định TODAY = 2026-09-14 (thứ Hai).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runHocVienLopTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, TODAY, P, addDays, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const week: any = await import('../platform/week.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const intake: any = await import('../classes/intake.ts');
  const classes: any = await import('../classes/classes.ts');
  const standingMod: any = await import('../students/standing.ts');
  const violations: any = await import('../yThuc/violations.ts');
  const warn: any = await import('../yThuc/canhBao.ts');
  const casesMod: any = await import('../cases/cases.ts');
  const fsMod = await import('node:fs');
  const pathMod = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  /**
   * Mô-đun chưa có thì phép kiểm ĐỎ với câu nói rõ thiếu gì, không làm sập cả bộ (cùng mẹo với luatMayChu.tests.ts).
   * `then` trả `undefined` để `await load(...)` không tưởng đây là promise.
   */
  const load = async (p: string): Promise<any> => import(p).catch((e) =>
    new Proxy({}, { get: (_x, k) => {
      if (k === 'then') return undefined;
      throw new Error(`Chưa có mô-đun ${p} (${String(k)}) — ${e.message}`);
    } }));
  const hvl: any = await load('../classes/hocVienLop.ts');
  const ptl: any = await load('../classes/phanTichLop.ts');
  const ttl: any = await load('../classes/thongTinLop.ts');
  const REPO = pathMod.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
  const eq = (got: unknown, want: unknown, m: string) =>
    assert(JSON.stringify(got) === JSON.stringify(want), `${m}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
  console.log('\nPR-Qa · Học viên & Lớp + Hồ sơ lớp');

  // ------------------------------------------------------------------ Task 1 · G-6

  check('PR-Qa · G-6 chuỗi có giờ (UTC) đổi sang giờ Việt Nam rồi mới lấy ngày', () => {
    eq(d.ngay('2026-09-22T18:30:00Z', '2026-09-22'), '23/09', '01:30 sáng 23/09 giờ VN');
    eq(d.ngay('2026-09-22T16:59:59Z', '2026-09-22'), '22/09', '23:59:59 giờ VN vẫn là 22/09');
    eq(d.ngay('2026-09-22 20:00:00', '2026-09-22'), '23/09', 'Dạng SQLite (UTC, không ghi múi giờ)');
    eq(d.ngay('2026-09-22T08:00:00+07:00', '2026-09-22'), '22/09', 'Có ghi múi giờ +07:00');
    eq(d.ngay('2026-12-31T17:00:00Z', '2026-09-22'), '01/01/2027', 'Sang năm mới theo giờ VN phải ghi năm');
    eq(d.shortDate('2026-09-22T18:30:00Z', '2026-09-22'), '23/09', 'shortDate (display.ts) cùng luật');
    eq(d.shortDate('2027-01-05', '2026-12-31T18:00:00Z'), '05/01', 'Hôm nay là một mốc giờ: 01/01/2027 giờ VN');
    eq(d.tuanLich('2026-09-27T20:00:00Z', '2026-09-22'), 'W1 OCT', '20:00 UTC Chủ nhật 27/09 = thứ Hai 28/09 giờ VN');
    eq(d.businessDateText('2026-09-14', '2026-09-19T10:20:00Z', '2026-09-19'), 'Ngày nghiệp vụ 14/09 · Ghi nhận 19/09', 'Không đổi');
  });

  check('PR-Qa · G-6 ngày không tồn tại bị từ chối (31/02, 29/02 năm thường, tháng 13, giờ 25)', () => {
    for (const s of ['2026-02-31', '2026-02-29', '2026-13-01', '2026-00-10', '2026-09-31', '2026-09-22T25:00:00Z']) {
      eq(d.ngay(s, '2026-09-22'), '—', `ngay ${s}`);
      eq(d.shortDate(s, '2026-09-22'), '—', `shortDate ${s}`);
      eq(d.tuanLich(s, '2026-09-22'), '—', `tuanLich ${s}`);
    }
    eq(d.ngay('2028-02-29', '2028-01-01'), '29/02', 'Năm nhuận 2028 có 29/02');
    eq(d.ngayTheoGioVN('2026-02-31'), null, 'ngayTheoGioVN từ chối 31/02');
    eq(d.ngayTheoGioVN('2026-09-22'), '2026-09-22', 'ngày trần giữ nguyên');
    assert(/chưa có hạn/.test(d.deadlineView({ kind: 'nhap-diem', due: '2026-02-31', today: '2026-09-14' }).text),
      'Hạn là ngày không tồn tại = chưa có hạn');
  });
}
