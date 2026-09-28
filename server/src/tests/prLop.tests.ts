/** PHÉP KIỂM PR-LOP — tạo lớp, tên lớp, RF, Pre FOU, phân công. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLopTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P } = t;
  const intakeMod: any = await import('../classes/intake.ts');
  const clsMod: any = await import('../classes/classes.ts');
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LOP · Tạo lớp, tên lớp, RF, Pre FOU, phân công');

  check('LOP (1) · ghepMaLop / kiemSoLop / locSoLop (T1, L1, PF5)', () => {
    assert(d.ghepMaLop('MB', 'FT', 'LT1', '101') === 'MB FT 101', d.ghepMaLop('MB', 'FT', 'LT1', '101'));
    assert(d.ghepMaLop('MB', 'FT', 'RF', '12') === 'MB FT RF 12', 'RF');
    assert(d.ghepMaLop('MB', 'PREFOU', null, '03') === 'MB Pre FOU 03', 'Pre FOU');
    assert(d.ghepMaLop('CP', 'FOU', null, '101a') === 'CP FOU 101A', 'chữ cái cuối viết hoa');
    assert(d.kiemSoLop('101A') === null && d.kiemSoLop('7') === null, 'số hợp lệ');
    for (const sai of ['', '12345', 'FT 1', '10AB', '1-2']) assert(d.kiemSoLop(sai) !== null, `nhận nhầm "${sai}"`);
    assert(d.locSoLop('ft12a') === '12A' && d.locSoLop('123456') === '1234', d.locSoLop('ft12a'));
  });
  check('LOP (1) · chuanHoaMaLop: ft101 · MB-FT 101 · mb ft 101 cùng một khoá (T2, K2-07)', () => {
    const k = d.chuanHoaMaLop('MB FT 101');
    assert(['MB-FT 101', 'mb ft 101', 'MBFT101'].every((s) => d.chuanHoaMaLop(s) === k) && k.includes(d.chuanHoaMaLop('ft101')), k);
  });
  check('LOP (1) · soSanhLop: 9 < 12 < 101 < 101A; FT < FT RF < Pre FOU < FOU < BE < ELE (K2-08)', () => {
    const ds = ['MB FT 101', 'MB BE 03', 'MB FT 12', 'MB Pre FOU 03', 'MB FT RF 12', 'MB FT 101A', 'MB FT 9', 'MB ELE 05', 'MB FOU 12']
      .map((code) => ({ code, branchId: 1 })).sort(d.soSanhLop).map((x) => x.code).join(' | ');
    assert(ds === 'MB FT 9 | MB FT 12 | MB FT 101 | MB FT 101A | MB FT RF 12 | MB Pre FOU 03 | MB FOU 12 | MB BE 03 | MB ELE 05', ds);
    assert(d.soSanhLop({ code: 'CP FT 1', branchId: 2 }, { code: 'MB ELE 9', branchId: 1 }) > 0, 'chi nhánh đứng trước');
  });
  check('LOP (1) · tenMoiChoLopCu: đổi đúng mẫu, không đoán lớp lạ (T2, K5-68)', () => {
    const doi = (code: string, cn: string, pc: string | null, r: string | null) =>
      JSON.stringify(d.tenMoiChoLopCu({ code, branchCode: cn, programmeCode: pc, route: r }));
    assert(doi('CP-FT 139', 'CP', 'FT', 'LT1') === '{"moi":"CP FT 139"}', 'CP-FT 139');
    assert(doi('UB-FOUND 07', 'UB', 'FOU', null) === '{"moi":"UB FOU 07"}', 'FOUND → FOU');
    assert(doi('MB FT 101', 'MB', 'FT', 'LT1') === '{"moi":"MB FT 101"}', 'đã đúng mẫu → giữ');
    assert(doi('MB-FT THU 01', 'MB', 'FT', 'LT1') === '{"loi":"khong-theo-mau"}', 'lớp thử');
    assert(doi('MB-BE 08', 'MB', 'FT', 'LT1') === '{"loi":"lech-chuong-trinh"}', 'tên nói BE, cột nói FT');
    assert(doi('XX-FT 1', 'MB', 'FT', 'LT1') === '{"loi":"khong-tien-to"}', 'sai tiền tố');
  });

  check('LOP (2) · oPhanCong: FT 6 ô · BE L R W S · FOU L R G+V P · Pre FOU chỉ GVCN (MH6, T55, T56)', () => {
    const nhan = (c: string, k: readonly string[]) => d.oPhanCong(c, k).map((o) => o.nhan).join(' ');
    assert(nhan('FT', d.ENTRY_SKILLS) === 'GVCN L R W1 W2 S', nhan('FT', d.ENTRY_SKILLS));
    assert(nhan('BE', d.REGULAR_SKILLS) === 'GVCN L R W S', nhan('BE', d.REGULAR_SKILLS));
    assert(nhan('FOU', d.REGULAR_SKILLS) === 'GVCN L R G+V P', nhan('FOU', d.REGULAR_SKILLS));
    assert(nhan('PREFOU', ['tong_hop']) === 'GVCN', nhan('PREFOU', ['tong_hop']));
    assert(d.PROGRAMME_TEMPLATES.PREFOU.weeks === 5 && d.PROGRAMME_TEMPLATES.PREFOU.checkpoints.length === 1, 'PREFOU 5 tuần, chỉ Cuối khoá');
    assert(d.programmeOf('PREFOU') === 'PREFOU' && d.NORMAL_LADDER.PREFOU === 'FOU' && (d.ROUTES as readonly string[]).includes('RF'), 'hằng số');
  });
  check('LOP (2) · kiemPhanCong: một ô một người, GVCN dạy ≥ 1 kỹ năng; Pre FOU chỉ GVCN, GVCN dạy luôn (L3, L4, T56, M-09)', () => {
    const s = (userId: number, skill: string | null) => ({ userId, skill, isCore: skill === null });
    const loi = (c: string, k: readonly string[], x: any[]) => d.kiemPhanCong(c, k, x).map((l) => `${l.khoa}:${l.lyDo}`).join(' | ');
    assert(loi('FT', d.ENTRY_SKILLS, [s(1, null), s(2, null), s(1, 'listening')]).startsWith('gvcn:Chỉ chọn một GVCN'), 'hai GVCN');
    assert(/^gvcn:GVCN phải dạy ít nhất một kỹ năng/.test(loi('FT', d.ENTRY_SKILLS, [s(1, null), s(2, 'listening')])), 'GVCN không dạy');
    assert(/^listening:Mỗi môn một người/.test(loi('BE', d.REGULAR_SKILLS, [s(2, 'listening'), s(3, 'listening')])), 'hai người một môn');
    assert(/^writing1:Lớp không có môn này/.test(loi('BE', d.REGULAR_SKILLS, [s(2, 'writing1')])), 'môn lạ');
    assert(loi('PREFOU', ['tong_hop'], [s(1, null)]) === '' && loi('PREFOU', ['tong_hop'], [s(1, null), s(1, 'tong_hop')]) === '', 'Pre FOU: GVCN đủ');
    assert(/^gvcn:Lớp Pre FOU chỉ có GVCN/.test(loi('PREFOU', ['tong_hop'], [s(1, null), s(2, 'tong_hop')])), 'Pre FOU: người thứ hai');
    const mr = d.moRongPhanCong('PREFOU', ['tong_hop'], [s(1, null)]).map((x: any) => `${x.userId}:${x.skill}`).join(' ');
    assert(mr === '1:null 1:tong_hop', `Pre FOU: GVCN tự nhận ô Tổng hợp → ${mr}`);
    assert(d.moRongPhanCong('PREFOU', ['tong_hop'], []).length === 0 && d.moRongPhanCong('BE', d.REGULAR_SKILLS, [s(1, null)]).length === 1, 'không GVCN / lớp khác: giữ nguyên');
    assert(loi('FT', d.ENTRY_SKILLS, []) === '' && loi('FT', d.ENTRY_SKILLS, [s(2, 'reading')]) === '', 'thiếu phân công vẫn tạo được (L4)');
  });
  const mig: any = await import('../migrate/prLop.ts');
  check('LOP (3) · migrate: cột số tuần, RF, PREFOU, đổi tên bỏ qua va chạm, chạy lại không đổi (T2, T78, K5-68)', () => {
    /* DB test dựng từ schema.sql đã có chỉ mục chuẩn hoá — gỡ đi để giả một DB cũ còn hai lớp va chạm; lần migrate thứ 3 tạo lại. */
    conn.exec('DROP INDEX IF EXISTS ux_classes_ma_chuan');
    const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id;
    const them = (code: string, pc: string, r: string | null) => Number(conn.prepare(
      `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, status, created_at)
       VALUES (?,?,?,?,?,?, 'active', ?)`).run(code, mb, pc, pc, r, pc === 'FT' ? 1 : 0, '2026-09-28').lastInsertRowid);
    const a = them('MB-FT 7771', 'FT', 'LT1'); const b = them('MB-BE 7772', 'BE', null);
    const c1 = them('MB-FT 7773', 'FT', 'LT1'); const c2 = them('mb ft 7773x', 'FT', 'LT1');   // khác mẫu nhưng không va
    const v1 = them('MB-FT 7774', 'FT', 'LT1'); const v2 = them('MB FT 7774', 'FT', 'LT1');    // va chạm khi so chuẩn hoá
    const kh = mig.keHoachDoiTenLop(conn);
    assert(kh.doi.some((x: any) => x.id === a && x.moi === 'MB FT 7771') && kh.doi.some((x: any) => x.id === b), JSON.stringify(kh.doi.slice(0, 3)));
    assert([v1, v2].every((id) => kh.vaCham.some((x: any) => x.id === id)) && !kh.doi.some((x: any) => x.id === v1), 'va chạm phải bỏ qua');
    const applied: string[] = []; mig.migratePrLop(conn, applied);
    const ma = (id: number) => (conn.prepare('SELECT code, so_tuan FROM classes WHERE id = ?').get(id) as any);
    assert(ma(a).code === 'MB FT 7771' && ma(b).code === 'MB BE 7772' && ma(b).so_tuan === 10 && ma(v1).code === 'MB-FT 7774', JSON.stringify([ma(a), ma(b), ma(v1)]));
    assert(!!conn.prepare("SELECT 1 FROM routes WHERE code = 'RF'").get() && (conn.prepare(
      "SELECT weeks FROM programmes WHERE code = 'PREFOU'").get() as any)?.weeks === 5, 'RF / PREFOU');
    assert((conn.prepare("SELECT skill FROM programme_skills WHERE programme_code = 'PREFOU'").get() as any)?.skill === 'tong_hop', 'ô tong_hop');
    const lan2: string[] = []; mig.migratePrLop(conn, lan2);
    assert(!lan2.some((x) => /Đổi tên|Thêm/.test(x)), `chạy lại vẫn đổi: ${lan2.join(' · ')}`);
    conn.prepare(`DELETE FROM classes WHERE id IN (${[a, b, c1, c2, v1, v2].map(() => '?').join(',')})`).run(a, b, c1, c2, v1, v2);
    const lan3: string[] = []; mig.migratePrLop(conn, lan3);
    assert(!!conn.prepare("SELECT name FROM sqlite_master WHERE name = 'ux_classes_ma_chuan'").get(), `hết va chạm phải tạo chỉ mục: ${lan3.join(' · ')}`);
  });

  const sch: any = await import('../classes/schedule.ts');
  const sys: any = await import('../platform/sysconfig.ts');
  check('LOP (4) · sửa số tuần ở Quản trị: lớp tạo sau theo số mới, lớp cũ giữ số lúc tạo (PF1, K1-46, K2-24)', () => {
    const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id;
    const tao = (so: string) => (intakeMod.createClass(P.admin, { code: `MB BE ${so}`, branchId: mb, kind: 'BE', startDate: '2026-09-28' }) as any).id;
    const cu = tao('8801');
    sys.saveProgramme(P.admin, { code: 'BE', name: 'Beginner', weeks: 12, finalWeek: 12, progressWeek: 6 });
    const moi = tao('8802');
    const pr = sch.classProgressMany([cu, moi]);
    assert(pr.get(cu).totalWeeks === 10 && pr.get(cu).finalWeek === 10, `lớp cũ: ${pr.get(cu).totalWeeks}/${pr.get(cu).finalWeek}`);
    assert(pr.get(moi).totalWeeks === 12 && pr.get(moi).finalWeek === 12 && pr.get(moi).progressWeek === 6, 'lớp mới');
    assert(!/PREFOU|ielts/i.test(String(pr.get(moi).label)) && /^BE · /.test(String(pr.get(moi).label)), String(pr.get(moi).label));
    sys.saveProgramme(P.admin, { code: 'BE', name: 'Beginner', weeks: 10, finalWeek: 10, progressWeek: 5 });
  });

  check('LOP (5) · taoLopVaPhanCong: sai luật → KHÔNG có lớp; đúng → lớp + phân công cùng lúc (YC-1, L4)', () => {
    const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id;
    const gv = (conn.prepare(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'teacher' AND (ur.branch_id IS NULL OR ur.branch_id = ?) ORDER BY u.id LIMIT 2`).all(mb) as any[]).map((x) => x.id);
    const dem = () => (conn.prepare("SELECT COUNT(*) n FROM classes WHERE code LIKE 'MB FT RF 88%'").get() as any).n;
    const truoc = dem();
    assertThrows(() => intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'FT', loTrinh: 'RF', so: '881',
      slots: [{ userId: gv[0], skill: null, isCore: true }, { userId: gv[1], skill: 'listening', isCore: false }] }), /GVCN phải dạy/, 'GVCN không dạy');
    assertThrows(() => intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'FT', loTrinh: 'RF', so: '882',
      slots: [{ userId: gv[0], skill: null, isCore: true }, { userId: gv[1], skill: null, isCore: true }] }), /một GVCN/, 'hai GVCN');
    assert(dem() === truoc, 'lớp tàng hình còn sót');
    const r = intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'FT', loTrinh: 'RF', so: '883',
      slots: [{ userId: gv[0], skill: null, isCore: true }, { userId: gv[0], skill: 'reading', isCore: false }] });
    assert(r.code === 'MB FT RF 883' && (conn.prepare("SELECT COUNT(*) n FROM teacher_assignments WHERE class_id = ? AND status = 'active'").get(r.id) as any).n === 2, JSON.stringify(r));
    assertThrows(() => intakeMod.createClass(P.admin, { code: 'mb-ft rf 883', branchId: mb, kind: 'FT' }), /Đã có lớp/, 'trùng không phân biệt hoa/thường, dấu -');
    assertThrows(() => intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'PREFOU', so: '03', startPeriodId: 1 }), /chưa mở/, 'PF6');
    assertThrows(() => intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'BE', so: '12A3' }), /Chỉ gõ số/, 'số sai mẫu');
    conn.prepare('DELETE FROM teacher_assignments WHERE class_id = ?').run(r.id); conn.prepare('DELETE FROM class_skills WHERE class_id = ?').run(r.id);
    conn.prepare('DELETE FROM classes WHERE id = ?').run(r.id);
  });

  check('LOP (6) · phạm vi mặc định: QL/Quản trị → Chi nhánh kể cả khi có dạy; GV thuần → Lớp tôi dạy (T6)', () => {
    assert(d.phamViMacDinh(['toi', 'chi-nhanh'], true) === 'chi-nhanh' && d.phamViMacDinh(['chi-nhanh', 'tat-ca'], true) === 'chi-nhanh', 'QL/QT');
    assert(d.phamViMacDinh(['toi', 'chi-nhanh'], false) === 'toi', 'GV có quyền chi nhánh nhưng không phải QL');
  });
  check('LOP (6) · tìm lớp theo tên cũ có "-" và gõ liền; danh sách xếp số tự nhiên (K2-07, K2-08)', () => {
    for (const q of ['MB-FT 101', 'mb ft 101', 'ft101']) {
      const r = clsMod.listClassSummaries(P.admin, { q }).rows.map((x: any) => x.code);
      assert(r.includes('MB FT 101'), `${q} → ${r.join(',')}`);
    }
    const ma = clsMod.listClassSummaries(P.admin, {}).rows.filter((x: any) => x.branchCode === 'MB').map((x: any) => x.code);
    assert(ma.join('|') === [...ma].map((code: string) => ({ code })).sort(d.soSanhLop).map((x: any) => x.code).join('|'), ma.join(' · '));
  });
}
