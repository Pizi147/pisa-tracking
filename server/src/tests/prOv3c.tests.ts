/**
 * PHÉP KIỂM PR-OV3c — Kết quả đầu ra lớp trước ở hồ sơ lớp FT (đặc tả OV 3.1, 4, 6.4): 4 tuần từ ngày vào lớp FT theo đợt, mỗi chương trình
 * nguồn một bảng, chỉ giá trị QL đã chốt, đọc theo ghi danh (cả em chuyển bằng `applyTransition` không lệnh), quyền (Admin 403), số đợt ở đầu trang
 * (`dai.kqdrDot`), và ngăn Tổng kết ở Hành trình có Kết quả đầu ra.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv3cTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const kv: any = await import('../normal/kyVong.ts');
  const classes: any = await import('../classes/classes.ts');
  const tongKet: any = await import('../loTrinh/tongKet.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV3c · Kết quả đầu ra lớp trước ở hồ sơ lớp FT');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown) => { try { fn(); return null; } catch (e: any) { return e?.status as number ?? -1; } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const lopMa = (ma: string) => get('SELECT id FROM classes WHERE code = ?', ma).id as number;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const FT101 = lopMa('MB FT 101'), BE04 = lopMa('MB BE 04'), BE03 = lopMa('MB BE 03'), ELE02 = lopMa('MB ELE 02');
  const tao = (role: string, n: number) => accounts.createAccount(P.admin, {
    email: `ov3c.${role}.${n}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov3c', fullName: `Thử OV3c ${role}`, roles: [{ role, branches: ['MB'] }],
  }).userId as number;
  const ADMIN = loadPrincipal(tao('office_admin', 1)), TVV = loadPrincipal(tao('consultant', 1));
  const gvKhac = get(`SELECT ta.user_id id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id JOIN branches b ON b.id = c.branch_id
      WHERE b.code = 'BC' AND ta.status = 'active' AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ?) ORDER BY ta.user_id LIMIT 1`, FT101).id;

  let seq = 0;
  const lopFt = () => {
    seq += 1;
    const bat = d.mondayOfDate(t.addDays(TODAY, -35));
    return intake.createClass(P.admin, { code: `MB-OV3C${seq}`, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: bat, startPeriodId: week.ensurePeriod(bat).id }).id as number;
  };
  /** Em học lớp `nguon` (đã chuyển đi) rồi vào lớp FT `ft` ngày `vao`. */
  const vaoFt = (nguon: number, ft: number, vao: string) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-OV3C${seq}`, `Hoc vien OV3c ${seq}`, `hoc vien ov3c ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, ended_at, created_at) VALUES (?,?, 'transferred', '2026-06-01', ?, ?)`).run(sid, nguon, vao, now);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, ft, vao, now);
    return sid;
  };
  const emCua = (r: any) => (r.bang as any[]).flatMap((b) => b.dot.flatMap((x: any) => x.em));

  check('OV3c-1 · 4 tuần: vào FT hôm nay − 27 ngày hiện, − 28 ngày ẩn; lớp không đợt nào → dai.kqdrDot 0 + danh sách rỗng', () => thu(() => {
    const ft = lopFt();
    assert(classes.classOverview(P.mbManager, ft).dai.kqdrDot === 0, 'lớp chưa có đợt phải 0');
    assert(kv.kqdrLopFt(P.mbManager, ft).bang.length === 0, 'danh sách phải rỗng');
    const hien = vaoFt(BE04, ft, t.addDays(TODAY, -27));
    const an = vaoFt(BE04, ft, t.addDays(TODAY, -28));
    const ids = emCua(kv.kqdrLopFt(P.mbManager, ft)).map((e: any) => e.id);
    assert(ids.includes(hien) && !ids.includes(an), JSON.stringify(ids));
    xoaNho();
    assert(classes.classOverview(P.mbManager, ft).dai.kqdrDot === 1, 'một đợt');
  }));

  check('OV3c-2 · hai chương trình → hai bảng (BE trước ELE); hai đợt cùng chương trình (hai lớp cũ) → một bảng, hai nhóm, đúng "hiện tới hết"; em từ FT khác không hiện', () => thu(() => {
    const ft = lopFt();
    const v1 = t.addDays(TODAY, -21), v2 = t.addDays(TODAY, -7);
    vaoFt(BE04, ft, v1); vaoFt(BE03, ft, v2); vaoFt(ELE02, ft, v2);
    const tuFt = vaoFt(FT101, ft, v2);
    const r = kv.kqdrLopFt(P.mbManager, ft);
    assert(r.bang.map((b: any) => b.ct).join(',') === 'BE,ELE', r.bang.map((b: any) => b.ct).join(','));
    const be = r.bang[0];
    assert(be.lop.map((l: any) => l.code).sort().join(',') === 'MB BE 03,MB BE 04', JSON.stringify(be.lop));
    assert(be.dot.map((x: any) => `${x.vao}>${x.hienToi}`).join('|') === `${v1}>${t.addDays(v1, 27)}|${v2}>${t.addDays(v2, 27)}`, JSON.stringify(be.dot));
    assert(!emCua(r).some((e: any) => e.id === tuFt), 'em từ lớp FT khác không thuộc bảng');
    assert(classes.classOverview(P.mbManager, ft).dai.kqdrDot === 2, 'hai đợt');
  }));

  check('OV3c-3 · GVCN đề xuất, QL chưa chốt → "Chưa chốt", payload không có đề xuất; QL chốt Không đạt · Trung tâm → link Case (em chuyển bằng applyTransition)', () => thu(() => {
    const ft = lopFt();
    const sid = vaoFt(BE04, ft, t.addDays(TODAY, -7));
    conn.prepare(`INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, kq_de_xuat_dat, kq_de_xuat_nguyen_nhan, kq_de_xuat_mon, kq_de_xuat_ghi_chu, created_at, updated_at)
      VALUES (?,?, 'chua_quyet', 0, 'hoc_sinh', '["speaking"]', 'DE-XUAT-BI-MAT', ?, ?)`).run(sid, BE04, TODAY, TODAY);
    /* MT0 ở lớp nguồn: L dưới ngưỡng BE → `monTruot`, Overall + Đạt theo `goiYKyVong`. */
    const cyc = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, 'LT1', 'FT', ?, 'active', ?)`)
      .run(sid, TODAY, TODAY).lastInsertRowid);
    const mt0 = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, created_at) VALUES (?,?, 0, 'mt0', ?, 'done', ?)`)
      .run(cyc, sid, BE04, TODAY).lastInsertRowid);
    for (const [k, b] of [['listening', 3.5], ['reading', 5], ['writing1', 4.5], ['writing2', 4.5], ['speaking', 4.5]]) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?,?,?,?)').run(mt0, k, b, TODAY);
    }
    const r = kv.kqdrLopFt(P.mbManager, ft);
    const em = emCua(r).find((e: any) => e.id === sid);
    assert(em && em.kqdr === null, JSON.stringify(em));
    assert(em.mt0?.listening === 3.5 && em.mt0.monTruot.includes('listening') && em.mt0.overall === 4.5, JSON.stringify(em.mt0));
    assert(!JSON.stringify(r).includes('DE-XUAT-BI-MAT') && !JSON.stringify(r).includes('hoc_sinh'), 'không lộ đề xuất GVCN');
    /* Bộ demo: Chu Nhật Minh BE 04 → FT 101 bằng `applyTransition` (không lệnh), QL chốt Không đạt · Trung tâm · R → Case. */
    const minh = emCua(kv.kqdrLopFt(P.mbManager, FT101)).find((e: any) => e.ten === 'Chu Nhật Minh');
    assert(minh?.kqdr?.dat === false && minh.kqdr.nguyenNhan === 'trung_tam' && minh.kqdr.mon.join() === 'reading', JSON.stringify(minh));
    assert(minh.case.length >= 1 && minh.case[0].id > 0, `phải có link Case: ${JSON.stringify(minh.case)}`);
    assert(minh.lopCu.code === 'MB BE 04', JSON.stringify(minh.lopCu));
  }));

  check('OV3c-4 · quyền: QL, GVCN, GVBM lớp FT, TVV đọc được; Admin 403 (+ kqdrDot 0); GV lớp khác 403', () => {
    for (const [ten, p] of [['QL', P.mbManager], ['GVCN', P.coreTeacher], ['GVBM', P.subjectTeacher], ['TVV', TVV]] as const) {
      assert(maLoi(() => kv.kqdrLopFt(p, FT101)) === null, `${ten} phải đọc được`);
      xoaNho();
    }
    assert(maLoi(() => kv.kqdrLopFt(ADMIN, FT101)) === 403, 'Admin 403');
    xoaNho();
    assert(classes.classOverview(ADMIN, FT101).dai.kqdrDot === 0, 'Admin không thấy cách xem');
    xoaNho();
    assert(classes.classOverview(P.mbManager, FT101).dai.kqdrDot >= 1, 'QL thấy đợt của FT 101');
    xoaNho();
    assert(maLoi(() => kv.kqdrLopFt(loadPrincipal(gvKhac), FT101)) === 403, 'GV lớp khác 403');
    xoaNho();
  });

  check('OV3c-5 · Hành trình: lộ trình lớp thường đã đóng có Kết quả đầu ra đã chốt → ngăn Tổng kết có kyVongDat', () => {
    const c = get(`SELECT lc.id FROM learning_cycles lc JOIN students s ON s.id = lc.student_id
      WHERE s.full_name = 'Chu Nhật Minh' AND lc.route IS NULL AND lc.status != 'active' ORDER BY lc.id DESC LIMIT 1`);
    assert(!!c, 'thiếu lộ trình BE 04 đã đóng của Chu Nhật Minh');
    const tk = tongKet.tongKetLoTrinh(P.mbManager, c.id);
    assert(tk.ketQua.loai === 'thuong' && tk.ketQua.kyVongDat === false && tk.ketQua.kqdr?.nguyenNhan === 'trung_tam', JSON.stringify(tk.ketQua));
    xoaNho();
  });
}
