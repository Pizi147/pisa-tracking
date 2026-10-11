/** PHÉP KIỂM PR-LOP — tạo lớp, tên lớp, RF, Pre FOU, phân công. Harness do `run.ts` truyền vào. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach } from './panelUx3.tests.ts';

export async function runPrLopTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P } = t;
  const intakeMod: any = await import('../classes/intake.ts');
  const clsMod: any = await import('../classes/classes.ts');
  const ttl: any = await import('../classes/thongTinLop.ts');
  const mywork: any = await import('../worklist/mywork.ts');
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
    assert(d.locSoLop('ft12a3') === '12A' && d.locSoLop('12A3') === '12A' && d.locSoLop('MB FT 101') === '101' && d.locSoLop('abc') === '',
      `gõ sau chữ cái: ${d.locSoLop('ft12a3')}`);
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
    assert(d.PROGRAMME_TEMPLATES.PREFOU.weeks === 5 && d.PROGRAMME_TEMPLATES.PREFOU.checkpoints.length === 1, 'PREFOU 5 tuần, chỉ Final Test');
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
  check('LOP (3) · migrate: cột số tuần, RF, PREFOU, chạy lại không đổi; va chạm tên → chưa tạo chỉ mục, hết va chạm → tạo (T78, K5-68). PR-SO: không còn đổi tên lớp cũ', () => {
    /* DB test dựng từ schema.sql đã có chỉ mục chuẩn hoá — gỡ đi để giả hai lớp va chạm; lần migrate thứ 2 (sau khi xoá) tạo lại. */
    conn.exec('DROP INDEX IF EXISTS ux_classes_ma_chuan');
    const mb = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id;
    const them = (code: string) => Number(conn.prepare(
      `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, status, created_at)
       VALUES (?,?, 'FT', 'FT', 'LT1', 1, 'active', ?)`).run(code, mb, '2026-09-28').lastInsertRowid);
    const v1 = them('MB-FT 7774'); const v2 = them('MB FT 7774');    // va chạm khi so chuẩn hoá
    const applied: string[] = []; mig.migratePrLop(conn, applied);
    assert((conn.prepare('SELECT code FROM classes WHERE id = ?').get(v1) as any).code === 'MB-FT 7774', 'migrate không còn đổi tên lớp');
    assert(!!conn.prepare("SELECT 1 FROM routes WHERE code = 'RF'").get() && (conn.prepare(
      "SELECT weeks FROM programmes WHERE code = 'PREFOU'").get() as any)?.weeks === 5, 'RF / PREFOU');
    assert((conn.prepare("SELECT skill FROM programme_skills WHERE programme_code = 'PREFOU'").get() as any)?.skill === 'tong_hop', 'ô tong_hop');
    assert(!conn.prepare("SELECT name FROM sqlite_master WHERE name = 'ux_classes_ma_chuan'").get(), 'va chạm mà vẫn tạo chỉ mục');
    conn.prepare('DELETE FROM classes WHERE id IN (?, ?)').run(v1, v2);
    const lan2: string[] = []; mig.migratePrLop(conn, lan2);
    assert(!!conn.prepare("SELECT name FROM sqlite_master WHERE name = 'ux_classes_ma_chuan'").get(), `hết va chạm phải tạo chỉ mục: ${lan2.join(' · ')}`);
    assert(!lan2.some((x) => /Thêm/.test(x)), `chạy lại vẫn thêm: ${lan2.join(' · ')}`);
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
    /* PR-MON mở Pre FOU (PF6): tạo được, GVCN tự nhận ô Tổng hợp (moRongPhanCong). */
    const pf = intakeMod.taoLopVaPhanCong(P.admin, { branchId: mb, chuongTrinh: 'PREFOU', so: '93', startPeriodId: 1,
      slots: [{ userId: gv[0], skill: null, isCore: true }] });
    assert((conn.prepare("SELECT 1 FROM teacher_assignments WHERE class_id = ? AND skill = 'tong_hop' AND user_id = ? AND status = 'active'").get(pf.id, gv[0])), 'PF6: GVCN chưa nhận ô tong_hop');
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

  check('LOP (7) · luatDoiLop: FT → FT khác lộ trình = mở lộ trình mới, Case đi theo em (K2-17, M-20)', () => {
    const r = d.luatDoiLop({ ma: 'FT', ft: true, lt: 'LT1' }, { ma: 'FT', ft: true, lt: 'RF' }, 'giua-khoa');
    assert(r.khoa === 'dong-mo' && r.dongCase === null && !r.canMucTieu, JSON.stringify(r));
    assert(d.luatDoiLop({ ma: 'FT', ft: true, lt: 'LT1' }, { ma: 'FT', ft: true, lt: 'LT1' }, 'giua-khoa').khoa === 'giu', 'cùng lộ trình giữ');
    assert(d.luatDoiLop({ ma: 'FT', ft: true }, { ma: 'FT', ft: true }, 'giua-khoa').khoa === 'giu', 'thiếu lt (dữ liệu cũ) giữ như cũ');
  });
  check('LOP (7) · Sửa thông tin lớp: chỉ đổi phần số; đổi lộ trình bị chặn khi lớp có HV (YC-2, K2-18)', () => {
    const lop = conn.prepare(`SELECT c.id FROM classes c WHERE c.code = 'MB FT 101'`).get() as any;
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, lop.id, { loTrinh: 'RF' }), /đã có \d+ học viên/, 'đổi lộ trình khi có HV');
    assertThrows(() => ttl.capNhatThongTinLop(P.admin, lop.id, { so: '1O1' }), /Chỉ gõ số/, 'số sai');
  });

  check('LOP (8) · panel Tạo lớp: một lệnh, ô số, xem trước, một người mỗi ô, không câu sai (YC-1, YC-2, YC-4)', () => {
    const src = docSach('web/src/modules/classes/ClassCreatePanel.tsx');
    assert(!/\/teachers`|api\.put\(/.test(src), 'còn gọi lệnh phân công thứ hai');
    assert(/oPhanCong\(/.test(src) && /kiemPhanCong\(/.test(src) && /ghepMaLop\(/.test(src) && /locSoLop\(/.test(src), 'chưa dùng luật chung');
    assert(!/hai người dạy|TeacherPick|\+ Thêm giáo viên|Normal/.test(src), 'còn chữ/ô cũ');
    assert(/CHO_TAO_PRE_FOU/.test(src) && /navigate\(`\/hoc-vien\/lop\//.test(src), 'PF6 / mở hồ sơ lớp');
    assert(/useLoiForm\(/.test(src) && /dsLoi\(/.test(src) && !/SoOCanSua|Còn thiếu/.test(src), 'báo lỗi form chưa theo PR-N1 (YC-12.5.2)');
  });

  check('LOP (9) · Sửa phân công / Sửa thông tin lớp / Chuyển tiếp dùng luật chung, không ô gõ tên tự do (YC-4, K2-16, K2-18)', () => {
    const lopDir = 'web/src/modules/classes/';
    const tap = docSach(lopDir + 'TeacherAssignPanel.tsx');
    assert(!/\+ Thêm giáo viên|HAI người/.test(tap) && /* PR-Pb2-b: ô theo chương trình qua useTachFou (bọc oPhanCong, FOU gộp L · R · G+V) */ /oPhanCong\(|useTachFou\(/.test(tap) && /kiemPhanCong\(/.test(tap), 'Sửa phân công');
    /* PR-OV3a: "Sửa thông tin lớp" thành phần Lớp của panel Thông tin lớp (`ThongTinLopPanel.tsx`), không ô Ghi chú. */
    const ttlSrc = docSach(lopDir + 'ThongTinLopPanel.tsx');
    assert(!/MB-FT|setCode\(|Ghi chú|note:/.test(ttlSrc) && /locSoLop\(/.test(ttlSrc) && /ghepMaLop\(/.test(ttlSrc), 'Phần Lớp của Thông tin lớp');
    const tp = docSach(lopDir + 'TransitionPanel.tsx');
    assert(!/newCode|suggestedCode|gvcnUserId|newClass:/.test(tp) && /<ClassCreatePanel/.test(tp), 'Chuyển tiếp');
    for (const f of ['TeacherAssignPanel', 'ThongTinLopPanel', 'ClassCreatePanel']) {
      assert(/useLoiForm\(/.test(docSach(`${lopDir}${f}.tsx`)), `${f} chưa báo lỗi theo PR-N1 (useLoiForm)`);
    }
    /* Chuyển tiếp (KhungPanel longTrong) báo lỗi theo từng dòng HV (không phải form ô bắt buộc) — giữ lỗi tại dòng. */
    assert(/\bloi=/.test(tp), 'TransitionPanel chưa báo lỗi tại dòng');
    assert(/'phan-cong'/.test(docSach(lopDir + 'ClassOverviewPage.tsx')), 'hồ sơ lớp chưa nhận ?viec=phan-cong');
    const lop = conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get() as any;
    const ct = clsMod.classTeachers(P.admin, lop.id);
    assert(ct.programmeCode === 'FT', 'classTeachers thiếu programmeCode');
    /* "· n lớp" đếm LỚP, không đếm dòng phân công (GVCN dạy L + R một lớp vẫn là 1 lớp) — khớp /ref/teachers của Tạo lớp. */
    for (const c of ct.candidates) {
      const soLop = (conn.prepare(`SELECT COUNT(DISTINCT class_id) n FROM teacher_assignments WHERE user_id = ? AND status = 'active'`).get(c.id) as any).n;
      assert(c.classCount === soLop, `${c.name}: ${c.classCount} ≠ ${soLop} lớp`);
    }
  });
  check('LOP (9) · việc "Chưa có người phụ trách" của lớp thiếu GV môn → Sửa phân công (K1-05)', () => {
    const hv = conn.prepare(`SELECT e.student_id sid, e.class_id cid FROM enrollments e JOIN classes c ON c.id = e.class_id
      JOIN students s ON s.id = e.student_id WHERE c.code = 'MB FT 101' AND e.status = 'active' AND s.archived_at IS NULL LIMIT 1`).get() as any;
    const caseId = Number(conn.prepare(`INSERT INTO sos_cases (student_id, category, topic, origin_kind, status, owner_user_id, created_at)
      VALUES (?, 'reading', 'reading', 'teacher_report', 'open', NULL, ?)`).run(hv.sid, new Date().toISOString()).lastInsertRowid);
    const dong = () => (mywork.myWork(P.admin).items as any[]).find((i) => i.key === `owner:${caseId}`);
    try {
      assert(dong()?.actionLabel === 'Chọn người phụ trách', 'lớp đủ GV môn → giữ việc cũ');
      conn.prepare(`UPDATE teacher_assignments SET status = 'tam_lop9' WHERE class_id = ? AND skill = 'reading' AND status = 'active'`).run(hv.cid);
      const r = dong();
      assert(r?.actionLabel === 'Sửa phân công' && r.href === `/hoc-vien/lop/${hv.cid}?viec=phan-cong`, JSON.stringify(r));
    } finally {
      conn.prepare(`UPDATE teacher_assignments SET status = 'active' WHERE class_id = ? AND status = 'tam_lop9'`).run(hv.cid);
      conn.prepare('DELETE FROM sos_cases WHERE id = ?').run(caseId);
    }
  });

  check('LOP (10) · Quản trị Lộ trình & chương trình: không thêm mã, Pre FOU không có Progress Test, Final Test mặc định = số tuần (K1-46…K1-50)', () => {
    assertThrows(() => sys.saveRoute(P.admin, { code: 'LT3', name: 'x' }), /không thêm/i, 'thêm được lộ trình');
    assertThrows(() => sys.saveProgramme(P.admin, { code: 'PRE-IELTS', name: 'x' }), /không thêm/i, 'thêm được chương trình');
    assertThrows(() => sys.saveProgramme(P.admin, { code: 'PREFOU', name: 'Pre Foundation', weeks: 5, progressWeek: 2 }),
      /không có bài Progress Test/, 'Pre FOU nhận tuần Progress Test');
    const r = sys.saveProgramme(P.admin, { code: 'PREFOU', name: 'Pre Foundation', weeks: 6 });
    try {
      const pf = sys.listProgrammes(P.admin).find((x: any) => x.code === 'PREFOU');
      assert(pf.weeks === 6 && JSON.stringify(pf.checkpoints) === '[{"kind":"final","studyWeek":6}]', JSON.stringify(pf));
      assert(typeof r.lopGiuSoCu === 'number', JSON.stringify(r));
    } finally {
      sys.saveProgramme(P.admin, { code: 'PREFOU', name: 'Pre Foundation', weeks: 5 });
    }
    const lt = sys.listRoutes(true).find((x: any) => x.code === 'RF');
    assert(lt.kyVong === 'Mọi MT = Target' && lt.lichMt === 'Tuần 4 · 8', JSON.stringify(lt));
    const src = docSach('web/src/modules/platform/CatalogAdmin.tsx');
    assert(!/\+ Thêm|loại lớp|btn-primary' : ''|ALL_SKILLS/i.test(src), 'CatalogAdmin còn chữ/nút cũ');
    assert(/Lộ trình & chương trình/.test(docSach('web/src/modules/platform/AdminPage.tsx')), 'tên tab');
  });
  check('LOP (10) · ô tìm đầu trang có nhóm Lớp; chữ mẫu tên lớp mới trong web + shared/domain (K1-43, T2)', () => {
    const h = docSach('web/src/modules/platform/Header.tsx');
    assert(/'\/ref\/classes'/.test(h) && /chuanHoaMaLop\(/.test(h) && /\/hoc-vien\/lop\//.test(h) && /Tìm học viên, lớp…/.test(h)
      && /Không tìm thấy/.test(h), 'Header chưa tìm lớp');
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
    const sot: string[] = [];
    for (const dir of ['web/src', 'shared/domain']) {
      for (const f of fs.readdirSync(path.join(root, dir), { recursive: true }) as string[]) {
        if (!/\.tsx?$/.test(f)) continue;
        if (/MB-FT|MB-FOU|CP-FT/.test(fs.readFileSync(path.join(root, dir, f), 'utf8'))) sot.push(`${dir}/${f}`);
      }
    }
    assert(sot.length === 0, `còn chữ mẫu tên cũ: ${sot.join(', ')}`);
  });
}
