/**
 * PHÉP KIỂM LO-TRINH-THEO-HV (chủ SP 11/11: "Lộ trình là theo HV, KHÔNG PHẢI THEO LỚP… luật liên quan đến MT các thứ thì vẫn là theo lộ trình của học
 * viên") — đổi LT1 / LT2 / RF ở Sửa thông tin: quyền bốn vai, lượt có điểm đứng yên (lịch + kỳ vọng), lượt tự xếp chưa điểm theo lộ trình mới (không về tuần
 * đã qua), thừa huỷ / thiếu tạo, Hoàn tác, Duyệt + Huỷ quyết định đề xuất, ca chặn. Mỗi ca ghi trong giao dịch rồi cuộn lại.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrLoTrinhHvTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t as any;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const lt: any = await import('../fasttrack/doiLoTrinh.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const deXuat: any = await import('../duyet/deXuatSua.ts');
  const yeuCau: any = await import('../duyet/yeuCau.ts');
  const profile: any = await import('../students/profile.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho, soCauSql, soDongSql } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const qlhv: any = await import('../../../shared/domain/quanLyHocVien.ts');
  console.log('\nLO-TRINH-THEO-HV · đổi lộ trình của em · lượt có điểm đứng yên · lịch MT theo lộ trình mới · Hoàn tác');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); skillSchedule.clearScoringModeCache(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); skillSchedule.clearScoringModeCache(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e.status ?? 500; } };
  const loiCua = (fn: () => unknown): string => { try { fn(); return ''; } catch (e: any) { return String(e.message); } };
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const T2 = week.mondayOf(TODAY) as string;
  const W = (n: number) => addDays(T2, 7 * n);
  let so = 0;
  const lopMoi = (route: string, start: string) => intake.createClass(P.admin, {
    code: `MB LTHV ${++so}`, branchId: MB, kind: 'FT', route, isFastTrack: true, startDate: start, startPeriodId: week.ensurePeriod(start).id,
  }).id as number;
  /** Em vào lớp qua Thêm học viên (lịch MT mặc định tự tạo theo lộ trình lớp). Tuần bắt đầu = `W(-n)` → em đang ở tuần học n + 1. */
  const them = (lop: number, start: string) => {
    const r = intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: `LTHV Em ${++so}`, target: 6.5, startWeek: start, email: emailThu(), dob: '2010-01-01' }] });
    assert(r.added === 1, JSON.stringify(r.failed));
    const sid = r.studentIds[0] as number;
    return { sid, cy: one(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid).id as number };
  };
  const luot = (cy: number) => all(
    `SELECT a.*, (SELECT week_start FROM report_periods WHERE id = a.planned_period_id) AS tuan FROM assessment_attempts a
      WHERE a.cycle_id = ? AND a.kind = 'mock' ORDER BY a.attempt_no, a.id`, cy);
  const mt = (cy: number, no: number) => luot(cy).find((a) => a.attempt_no === no && a.status !== 'cancelled') ?? luot(cy).find((a) => a.attempt_no === no);
  const diem = (attemptId: number) => {
    for (const k of ['listening', 'reading', 'writing1', 'writing2', 'speaking']) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?,?,?,?)').run(attemptId, k, 6, TODAY);
    }
    xoaNho();
  };
  const ky = (attemptId: number) => attempts.kyVongCuaLuot(one('SELECT * FROM assessment_attempts WHERE id = ?', attemptId));
  const route = (cy: number) => one('SELECT route FROM learning_cycles WHERE id = ?', cy).route as string;
  const nguoiVai = (vai: string, cn: string | null) => {
    const r = one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id LEFT JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = ? AND ur.status = 'active' AND ${cn ? 'b.code = ?' : 'ur.branch_id IS NULL'} ORDER BY ur.user_id LIMIT 1`, ...(cn ? [vai, cn] : [vai]));
    assert(r, `seed thiếu ${vai} ${cn ?? ''}`);
    return loadPrincipal(r.id);
  };

  check('LTHV-1 · LT1 → RF (QL): MT1 có điểm giữ tuần + kỳ vọng LT (5.5); MT2 tự xếp dời tuần 8 RF; MT3 thừa huỷ; Hành trình + nhật ký; Hoàn tác trả y như trước', () => thu(() => {
    const e = them(lopMoi('LT1', W(-7)), W(-7));   // tuần học 8: LT 6/12/16 = W(-2) · W(4) · W(8); RF 4/8 = W(-4) · W(0)
    const m1 = mt(e.cy, 1).id;
    diem(m1);
    assert(ky(m1) === 5.5, `tiền đề kỳ vọng MT1 LT1: ${ky(m1)}`);
    const truoc = JSON.stringify(luot(e.cy).map((a) => [a.attempt_no, a.status, a.tuan, a.route_at_attempt]));
    const r = lt.doiLoTrinh(P.mbManager, e.cy, { route: 'RF' });
    assert(route(e.cy) === 'RF', 'route');
    assert(mt(e.cy, 1).tuan === W(-2) && mt(e.cy, 1).route_at_attempt === 'LT1' && ky(m1) === 5.5, `MT1 đứng yên: ${JSON.stringify(mt(e.cy, 1))} · ${ky(m1)}`);
    assert(mt(e.cy, 2).tuan === W(0) && ky(mt(e.cy, 2).id) === 6.5, `MT2 theo RF: ${mt(e.cy, 2).tuan} · ${ky(mt(e.cy, 2).id)}`);
    assert(mt(e.cy, 3).status === 'cancelled' && /^Đổi lộ trình LT1 → RF/.test(mt(e.cy, 3).cancel_reason), JSON.stringify(mt(e.cy, 3)));
    assert(JSON.stringify(r.huy) === '["MT3"]' && r.doi.length === 1 && r.giu === 1 && /MT2/.test(r.cau) && /huỷ MT3/.test(r.cau), JSON.stringify(r));
    assert(one(`SELECT 1 x FROM journey_events WHERE cycle_id = ? AND title = 'Đổi lộ trình LT1 → RF'`, e.cy), 'Hành trình');
    assert(one(`SELECT 1 x FROM audit_logs WHERE entity_type = 'learning_cycle' AND entity_id = ? AND action = 'cycle.update' AND after_json LIKE '%RF%'`, e.cy), 'nhật ký');
    lt.hoanTacDoiLoTrinh(P.mbManager, e.cy, r.dao);
    assert(route(e.cy) === 'LT1', 'Hoàn tác: route');
    assert(JSON.stringify(luot(e.cy).map((a) => [a.attempt_no, a.status, a.tuan, a.route_at_attempt])) === truoc, `Hoàn tác: lượt ${truoc} → ${JSON.stringify(luot(e.cy).map((a) => [a.attempt_no, a.status, a.tuan, a.route_at_attempt]))}`);
    assert(!one(`SELECT 1 x FROM journey_events WHERE cycle_id = ? AND title = 'Đổi lộ trình LT1 → RF'`, e.cy), 'Hoàn tác: Hành trình');
    assert(ma(() => lt.hoanTacDoiLoTrinh(P.mbManager, e.cy, r.dao)) === 409, 'Hoàn tác hai lần → 409');
  }));

  check('LTHV-2 · đổi qua lại LT1 → RF → LT1: MT3 đã huỷ do đổi lộ trình mở lại (không tạo trùng); kỳ vọng lượt chưa điểm theo lộ trình hiện tại', () => thu(() => {
    const e = them(lopMoi('LT1', W(-7)), W(-7));
    lt.doiLoTrinh(P.mbManager, e.cy, { route: 'RF' });
    const r = lt.doiLoTrinh(P.mbManager, e.cy, { route: 'LT1' });
    const ds = luot(e.cy).filter((a) => a.status !== 'cancelled');
    assert(ds.map((a) => a.attempt_no).join() === '1,2,3' && luot(e.cy).length === 3, `lượt: ${JSON.stringify(luot(e.cy).map((a) => [a.attempt_no, a.status]))}`);
    assert(mt(e.cy, 3).tuan === W(8) && mt(e.cy, 2).tuan === W(4) && ky(mt(e.cy, 2).id) === 6, `MT2/MT3 theo LT: ${mt(e.cy, 2).tuan} ${mt(e.cy, 3).tuan} ${ky(mt(e.cy, 2).id)}`);
    assert(!r.tao.length && !r.huy.length, JSON.stringify(r));
  }));

  check('LTHV-3 · không về tuần đã qua: lượt đang ở tuần đã qua (có thể đã thi, chưa nhập) và lượt mà tuần RF đã qua đứng yên', () => thu(() => {
    const e = them(lopMoi('LT1', W(-10)), W(-10));   // LT: W(-5) · W(1) · W(5); RF: W(-7) · W(-3)
    const t1 = mt(e.cy, 1).tuan, t2 = mt(e.cy, 2).tuan;
    const r = lt.doiLoTrinh(P.mbManager, e.cy, { route: 'RF' });
    assert(mt(e.cy, 1).tuan === t1 && mt(e.cy, 2).tuan === t2 && !r.doi.length, `đứng yên: ${JSON.stringify(r)} · ${mt(e.cy, 1).tuan} ${mt(e.cy, 2).tuan}`);
    assert(mt(e.cy, 3).status === 'cancelled', 'MT3 thừa vẫn huỷ');
  }));

  check('LTHV-3b · lượt thừa ở tuần đã qua (có thể đã thi, chưa nhập) không huỷ; lượt huỷ do đổi lộ trình ở tuần đã qua không mở lại', () => thu(() => {
    const e = them(lopMoi('LT1', W(-17)), W(-17));   // tuần học 18: MT3 tuần 16 = W(-2) đã qua
    const r = lt.doiLoTrinh(P.mbManager, e.cy, { route: 'RF' });
    assert(mt(e.cy, 3).status !== 'cancelled' && !r.huy.length, `MT3 tuần đã qua giữ: ${JSON.stringify(r)}`);
    const e2 = them(lopMoi('LT1', W(-7)), W(-7));
    lt.doiLoTrinh(P.mbManager, e2.cy, { route: 'RF' });   // MT3 W(8) huỷ
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?`).run(week.ensurePeriod(W(-1)).id, mt(e2.cy, 3).id);   // giả: tuần đó đã qua
    lt.doiLoTrinh(P.mbManager, e2.cy, { route: 'LT1' });
    assert(mt(e2.cy, 3).status === 'cancelled', 'không mở lại lượt tuần đã qua');
  }));

  check('LTHV-3c · GV gửi đề xuất lộ trình cùng luật Duyệt: "Khác" / lớp thường → 400 ngay lúc gửi', () => thu(() => {
    const lop = t.classId('MB FT 101');
    const e = them(lop, W(-7));
    const gvbm = loadPrincipal(one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND skill IS NOT NULL AND status = 'active'
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1) LIMIT 1`, lop, lop).id);
    assert(/Lộ trình mới/.test(loiCua(() => deXuat.guiDeXuatSua(gvbm, e.sid, { truong: 'lo-trinh', moi: 'KHAC', lyDo: 'Thử' }))), 'Khác');
    conn.prepare(`UPDATE learning_cycles SET route = NULL WHERE id = ?`).run(e.cy);
    assert(/Chuyển lớp/.test(loiCua(() => deXuat.guiDeXuatSua(gvbm, e.sid, { truong: 'lo-trinh', moi: 'LT2', lyDo: 'Thử' }))), 'lớp thường');
  }));

  check('LTHV-4 · RF → LT2 (em RF trong lớp RF): MT1–MT2 dời theo lịch LT, MT3 tạo; lượt QL xếp tay đứng yên', () => thu(() => {
    const e = them(lopMoi('RF', W(-2)), W(-2));   // RF 4/8 = W(1) · W(5); LT 6/12/16 = W(3) · W(9) · W(13)
    conn.prepare(`UPDATE assessment_attempts SET plan_source = 'manual' WHERE id = ?`).run(mt(e.cy, 2).id);
    const r = lt.doiLoTrinh(P.mbManager, e.cy, { route: 'LT2' });
    assert(mt(e.cy, 1).tuan === W(3) && mt(e.cy, 2).tuan === W(5) && mt(e.cy, 3).tuan === W(13) && mt(e.cy, 3).status === 'planned',
      `${JSON.stringify(luot(e.cy).map((a) => [a.attempt_no, a.status, a.tuan]))}`);
    assert(r.tao.length === 1 && /^MT3/.test(r.tao[0]), JSON.stringify(r));
    assert(ky(mt(e.cy, 1).id) === 5.5, `MT1 LT: kỳ vọng Target − 1: ${ky(mt(e.cy, 1).id)}`);
  }));

  check('LTHV-5 · quyền: QL, Quản trị, GVCN lớp đang học, TVV, Admin chi nhánh ([XM 2]) đổi được; GV bộ môn, CX, QL / Admin chi nhánh khác 403; Admin không đổi Môn học', () => thu(() => {
    const lop = t.classId('MB FT 101');
    const e = them(lop, W(-7));
    const gvbm = loadPrincipal(one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND skill IS NOT NULL AND status = 'active'
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1) LIMIT 1`, lop, lop).id);
    const khac = one(`SELECT b.code FROM branches b WHERE b.code != 'MB' AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'manager' AND ur.branch_id = b.id AND ur.status = 'active') LIMIT 1`).code;
    const adminKhac = one(`SELECT b.code FROM branches b WHERE b.code != 'MB' AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE r.key = 'office_admin' AND ur.branch_id = b.id AND ur.status = 'active') LIMIT 1`).code;
    for (const [ai, ng] of [['GV bộ môn', gvbm], ['CX', nguoiVai('cx', null)], [`QL ${khac}`, nguoiVai('manager', khac)], [`Admin ${adminKhac}`, nguoiVai('office_admin', adminKhac)]] as const) {
      assert(ma(() => lt.doiLoTrinh(ng, e.cy, { route: 'LT2' })) === 403, `${ai} phải 403`);
      const hs = (() => { try { return profile.studentProfile(ng, e.sid); } catch { return null; } })();   // QL chi nhánh khác: không xem được hồ sơ
      assert(!hs?.cycle?.coTheDoiLoTrinh, `${ai}: hồ sơ không có ô chọn`);
    }
    const adminMb = nguoiVai('office_admin', 'MB');
    assert(profile.studentProfile(adminMb, e.sid).cycle.coTheDoiMon === false, 'Admin: không đổi Môn học (chỉ lộ trình)');
    const ds = [['QL', P.mbManager], ['Quản trị', P.admin], ['GVCN', P.coreTeacher], ['TVV', nguoiVai('consultant', 'MB')], ['Admin', adminMb]] as const;
    ds.forEach(([ai, ng], i) => {
      assert(profile.studentProfile(ng, e.sid).cycle.coTheDoiLoTrinh === true, `${ai}: hồ sơ có ô chọn`);
      lt.doiLoTrinh(ng, e.cy, { route: i % 2 ? 'LT1' : 'LT2' });
      xoaNho();
    });
    assert(route(e.cy) === 'LT2', route(e.cy));
    const lt2 = one(`SELECT id FROM ghi_dao WHERE loai = 'lo_trinh.doi' AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1`, e.cy).id;
    lt.hoanTacDoiLoTrinh(adminMb, e.cy, lt2);
    assert(route(e.cy) === 'LT1', `Admin Hoàn tác: ${route(e.cy)}`);
  }));

  check('LTHV-6 · chặn: lớp thường, "Khác", trùng, mã lạ, lộ trình đã đóng → 400 nói rõ; em tạm dừng vẫn đổi được', () => thu(() => {
    const e = them(lopMoi('LT1', W(-7)), W(-7));
    assert(/trùng/.test(loiCua(() => lt.doiLoTrinh(P.admin, e.cy, { route: 'LT1' }))), 'trùng');
    assert(/Lộ trình mới/.test(loiCua(() => lt.doiLoTrinh(P.admin, e.cy, { route: 'KHAC' }))), 'Khác');
    assert(ma(() => lt.doiLoTrinh(P.admin, e.cy, { route: 'LT9' })) === 400, 'mã lạ');
    const thuong = one(`SELECT id FROM learning_cycles WHERE route IS NULL AND status = 'active' LIMIT 1`).id;
    assert(/Chuyển lớp/.test(loiCua(() => lt.doiLoTrinh(P.admin, thuong, { route: 'LT1' }))), 'lớp thường');
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(e.sid);
    lt.doiLoTrinh(P.admin, e.cy, { route: 'LT2' });
    assert(route(e.cy) === 'LT2', 'tạm dừng đổi được');
    conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id = ?`).run(e.cy);
    assert(/đã kết thúc/.test(loiCua(() => lt.doiLoTrinh(P.admin, e.cy, { route: 'RF' }))), 'đã đóng');
  }));

  check('LTHV-7 · GV bộ môn đề xuất lộ trình → QL Duyệt = cùng lõi (MT3 huỷ, MT1 có điểm giữ); Huỷ quyết định trả lộ trình + lịch y như trước', () => thu(() => {
    const lop = t.classId('MB FT 101');
    const e = them(lop, W(-7));
    diem(mt(e.cy, 1).id);
    const gvbm = loadPrincipal(one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND skill IS NOT NULL AND status = 'active'
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1) LIMIT 1`, lop, lop).id);
    const truoc = JSON.stringify(luot(e.cy).map((a) => [a.attempt_no, a.status, a.tuan, a.route_at_attempt]));
    const { id } = deXuat.guiDeXuatSua(gvbm, e.sid, { truong: 'lo-trinh', moi: 'RF', lyDo: 'Gia đình đổi kế hoạch' });
    yeuCau.duyetYeuCau(P.mbManager, id);
    assert(route(e.cy) === 'RF' && mt(e.cy, 3).status === 'cancelled' && mt(e.cy, 1).route_at_attempt === 'LT1', JSON.stringify(luot(e.cy).map((a) => [a.attempt_no, a.status, a.route_at_attempt])));
    assert(all(`SELECT 1 FROM audit_logs WHERE entity_type = 'learning_cycle' AND entity_id = ? AND action = 'cycle.update' AND after_json LIKE '%RF%'`, e.cy).length === 1, 'một dòng nhật ký lộ trình');
    yeuCau.huyQuyetDinh(P.mbManager, id);
    assert(route(e.cy) === 'LT1' && JSON.stringify(luot(e.cy).map((a) => [a.attempt_no, a.status, a.tuan, a.route_at_attempt])) === truoc, 'Huỷ quyết định trả y như trước');
  }));

  check('LTHV-8 · kỳ vọng lượt có điểm theo lộ trình lúc thi ở hồ sơ (RF → LT1: MT1 thi lúc RF giữ kỳ vọng = Target)', () => thu(() => {
    const e = them(lopMoi('RF', W(-5)), W(-5));   // RF MT1 tuần 4 = W(-2)
    const m1 = mt(e.cy, 1).id;
    diem(m1);
    lt.doiLoTrinh(P.mbManager, e.cy, { route: 'LT1' });
    assert(ky(m1) === 6.5, `MT1 thi lúc RF: kỳ vọng = Target: ${ky(m1)}`);
    const hs = profile.studentProfile(P.mbManager, e.sid);
    /* Mọi chỗ hồ sơ nêu kỳ vọng của MT1 phải là kỳ vọng lúc thi RF = Target 6.5, không phải LT1 (5.5). */
    const kyMt1: number[] = [];
    const noi: string[] = [];
    const duyet = (x: any, d = '') => { if (!x || typeof x !== 'object') return; if (x.attemptNo === 1 && typeof x.expectation === 'number') { kyMt1.push(x.expectation); noi.push(d); } Object.entries(x).forEach(([k, v]) => duyet(v, `${d}.${k}`)); };
    duyet(hs);
    assert(hs.cycle.route === 'LT1' && kyMt1.length > 0 && kyMt1.every((k) => k === 6.5), `hồ sơ MT1: ${JSON.stringify(kyMt1)} ${noi.join(" ")} · ${hs.cycle.route}`);
  }));

  check(`LTHV-9 · trần câu SQL: đổi lộ trình ≤ ${TRAN_GHI_LO.doiLoTrinh} · Hoàn tác ≤ ${TRAN_GHI_LO.hoanTacDoiLoTrinh}; lộ trình FT trong danh mục`, () => thu(() => {
    const e = them(lopMoi('LT1', W(-7)), W(-7));
    diem(mt(e.cy, 1).id);
    xoaNho(); let s0 = soCauSql(); let d0 = soDongSql(); const r = lt.doiLoTrinh(P.mbManager, e.cy, { route: 'RF' });
    const n = soCauSql() - s0, dong = soDongSql() - d0;
    xoaNho(); s0 = soCauSql(); d0 = soDongSql(); lt.hoanTacDoiLoTrinh(P.mbManager, e.cy, r.dao);
    const h = soCauSql() - s0, dongH = soDongSql() - d0;
    console.log(`    (đo: đổi ${n} câu ${dong} dòng · Hoàn tác ${h} câu ${dongH} dòng)`);
    assert(n <= TRAN_GHI_LO.doiLoTrinh && h <= TRAN_GHI_LO.hoanTacDoiLoTrinh, `${n} / ${h}`);
  }));

  check('LTHV-10 · Thêm học viên (#9): cột Lộ trình từng em — trống = lộ trình lớp; LT2 / rf nhận (chữ thường được); mã lạ / "Khác" lưu ý rồi theo lớp; lịch MT theo lộ trình em', () => thu(() => {
    const lop = lopMoi('LT1', W(-7));
    const dong = [['', 'LT1'], ['rf', 'RF'], ['LT2', 'LT2'], ['LT9', 'LT1'], ['KHAC', 'LT1']] as const;
    const rows = dong.map(([r]) => ({ fullName: `LTHV Em ${++so}`, target: 6.5, startWeek: W(-7), email: emailThu(), dob: '2010-01-01', route: r }));
    const pv = intake.previewIntake(P.mbManager, { classId: lop, rows });
    dong.forEach(([, ky], i) => assert(pv.rows[i].route === ky, `xem trước dòng ${i + 1}: ${pv.rows[i].route}`));
    for (const i of [0, 1, 2]) assert(!pv.rows[i].issues.some((x: any) => x.field === 'route'), JSON.stringify(pv.rows[i].issues));
    for (const i of [3, 4]) {
      const v = pv.rows[i].issues.filter((x: any) => x.field === 'route');
      assert(v.length === 1 && v[0].muc === 'luu_y' && /LT1/.test(v[0].message), `dòng ${i + 1}: ${JSON.stringify(v)}`);
    }
    const r = intake.commitIntake(P.mbManager, { classId: lop, rows });
    assert(r.added === 5, JSON.stringify(r.failed));
    const cy = r.studentIds.map((sid: number) => one(`SELECT id, route FROM learning_cycles WHERE student_id = ?`, sid));
    dong.forEach(([, ky], i) => assert(cy[i].route === ky, `ghi dòng ${i + 1}: ${cy[i].route}`));
    /* Lịch MT theo lộ trình em: RF 2 MT (tuần 4 · 8), LT1 3 MT (6 · 12 · 16). */
    assert(luot(cy[1].id).length === 2 && luot(cy[0].id).length === 3, `${luot(cy[1].id).length} / ${luot(cy[0].id).length}`);
    assert(mt(cy[1].id, 1).tuan === W(-4) && mt(cy[0].id, 1).tuan === W(-2), `${mt(cy[1].id, 1).tuan} · ${mt(cy[0].id, 1).tuan}`);
    assert(one(`SELECT 1 x FROM journey_events WHERE student_id = ? AND title = 'Bắt đầu lộ trình RF'`, r.studentIds[1]), 'Hành trình theo lộ trình em');
  }));

  check('LTHV-11 · Học viên & Lớp (#9): ô Lộ trình ghi mã lộ trình khi khác lộ trình lớp (0 câu thêm) — cùng lộ trình lớp thì không', () => thu(() => {
    const lop = lopMoi('LT1', W(-7));
    const r = intake.commitIntake(P.mbManager, { classId: lop, rows: ['', 'RF'].map((route) => ({ fullName: `LTHV Em ${++so}`, target: 6.5, startWeek: W(-7), email: emailThu(), dob: '2010-01-01', route })) });
    const hv = hvl.danhSachHocVienLop(P.mbManager, { phamVi: 'chi-nhanh', q: 'MB LTHV' }).hocVien;
    const cua = (sid: number) => hv.find((h: any) => h.id === sid)?.hang?.loTrinh;
    assert(cua(r.studentIds[0]) && cua(r.studentIds[0]).khacLop === undefined, JSON.stringify(cua(r.studentIds[0])));
    assert(cua(r.studentIds[1])?.khacLop === 'RF', JSON.stringify(cua(r.studentIds[1])));
  }));

  check('LTHV-12 · ⋯ hồ sơ (#9): mục "Lịch MT" (không còn "Lộ trình" — G4-03); "Bước tiếp…" chỉ khi đã chọn bước tiếp + đổi được (G4-10)', () => {
    const muc = (buocTiep: boolean): any[] => qlhv.mucQuanLyHocVien({ canEdit: true, cycle: { ratio: false }, status: 'active', lopHoc: null, buocTiep });
    assert(muc(false).find((m: any) => m.key === 'lo-trinh')?.nhan === 'Lịch MT', JSON.stringify(muc(false)));
    assert(!muc(false).some((m: any) => m.key === 'buoc-tiep') && muc(true).find((m: any) => m.key === 'buoc-tiep')?.nhan === 'Bước tiếp…', JSON.stringify(muc(true)));
  });
}
