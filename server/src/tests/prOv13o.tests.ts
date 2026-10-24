/**
 * PHÉP KIỂM OV-13o — gom việc nhỏ sau rà OV-13 (chủ SP 16/10). Mỗi ca cuộn lại (`thu`).
 *  1 (13i) CX đổi KCK cả lớp: lỗi báo ở XEM TRƯỚC, đúng dòng, cùng câu với lúc lưu (`loiDoiTarget`).
 *  2 (13j) Lịch sử sửa: hai lần sửa cùng người ≤ 5 s → một khối; chuyển lớp mở lộ trình mới đổi Target → dòng Target.
 *  4 (13g → SUA-CHAM-LAI L4) Tổng quan "Kỹ năng tôi dạy" · Bài chờ chấm của GV Speaking KHÔNG tính bài S chấm chéo (T02–T03).
 *  5 (13h) Báo cáo tuần: dòng lịch sử "nháp" ghi sau một lần nộp (dữ liệu trước rà #410) hiện là "sửa".
 *  7 (13k) Hồ sơ MT › Lịch sử: một lần lưu đổi cả nhận xét lẫn nhóm nguyên nhân → hai dòng.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13oTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const perm: any = await import('../permissions.ts');
  const suaCaLop: any = await import('../classes/suaCaLop.ts');
  const students: any = await import('../students/students.ts');
  const lichSu: any = await import('../students/lichSuSua.ts');
  const tongQuan: any = await import('../worklist/tongQuan.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const hoSo: any = await import('../giaoVien/hoSo.ts');
  const meeting: any = await import('../worklist/meeting.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const { CHI_DOI_KCK } = await import('../fasttrack/cycles.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-13o · việc nhỏ sau rà OV-13');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return { status: 'không ném' }; };
  const CX = accounts.createAccount(P.admin, { email: `ov13o.cx${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov13o', fullName: 'Thử OV13o CX',
    roles: [{ role: 'cx', branches: [] }] }).userId as number;
  const ft = t.classId('MB FT 101');

  check('OV13o-1 · CX đổi KCK cả lớp: xem trước báo lỗi ở đúng dòng (cột Target), lưu 400 cùng câu; đổi Target số không lỗi', () => thu(() => {
    const em = get(`SELECT s.id sid, cy.target_score tg, cy.khong_cam_ket kck FROM enrollments e JOIN students s ON s.id = e.student_id
      JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active' WHERE e.class_id = ? AND e.status = 'active' ORDER BY s.id LIMIT 1`, ft);
    const cx = perm.loadPrincipal(CX);
    const kckMoi = d.chuTargetKck(em.tg ?? 6.5, !em.kck);
    const xt = suaCaLop.xemTruocSuaCaLop(cx, ft, { rows: [{ studentId: em.sid, target: kckMoi }] });
    const vd = xt.rows[0].issues.find((i: any) => i.field === 'target');
    assert(vd && vd.muc === 'loi' && vd.message === CHI_DOI_KCK, `xem trước: ${JSON.stringify(xt.rows)}`);
    const e = loi(() => suaCaLop.luuSuaCaLop(cx, ft, { rows: [{ studentId: em.sid, target: kckMoi }], lyDoTarget: 'thử' }));
    assert(e.status === 400 && String(e.message).endsWith(CHI_DOI_KCK), `lưu: ${e.status} ${e.message}`);
    const so = d.chuTargetKck(em.tg === 7 ? 6.5 : 7, !!em.kck);
    assert(suaCaLop.xemTruocSuaCaLop(cx, ft, { rows: [{ studentId: em.sid, target: so }] }).rows[0].issues.length === 0, 'Target số: không lỗi');
  }));

  check('OV13o-2a · Lịch sử sửa: hai lần sửa cùng người cách ≤ 5 giây → MỘT khối có cả hai trường', () => thu(() => {
    const sid = get(`SELECT e.student_id id FROM enrollments e WHERE e.class_id = ? AND e.status = 'active' ORDER BY e.student_id LIMIT 1`, ft).id;
    students.updateStudent(P.admin, sid, { fullName: 'OV13o Lần Một' });
    students.updateStudent(P.admin, sid, { email: 'ov13o.hai@demo.test' });
    const k = lichSu.lichSuSua(P.admin, sid, {}).dong[0];
    const ten = k.truong.map((x: any) => x.ten);
    assert(ten.includes('Họ tên') && ten.includes('Email'), `hai lần sửa phải gộp một khối: ${JSON.stringify(lichSu.lichSuSua(P.admin, sid, {}).dong.slice(0, 2))}`);
  }));

  check('OV13o-2b · Chuyển lớp thường → FT mở lộ trình mới với Target mới → khối Chuyển lớp có dòng Target cũ → mới', () => thu(() => {
    const em = get(`SELECT e.student_id sid, c.branch_id bid, cy.target_score tg FROM enrollments e JOIN classes c ON c.id = e.class_id
      JOIN students s ON s.id = e.student_id AND s.status = 'active'
      JOIN learning_cycles cy ON cy.student_id = e.student_id AND cy.status = 'active'
      WHERE e.status = 'active' AND c.is_fast_track = 0 AND c.status = 'active'
        AND NOT EXISTS (SELECT 1 FROM sos_cases sc WHERE sc.student_id = e.student_id AND sc.status != 'done')
        AND EXISTS (SELECT 1 FROM classes f WHERE f.branch_id = c.branch_id AND f.is_fast_track = 1 AND f.status = 'active')
      ORDER BY e.student_id LIMIT 1`);
    assert(em, 'seed: cần em lớp thường không Case mở, chi nhánh có lớp FT');
    const den = get(`SELECT id FROM classes WHERE branch_id = ? AND is_fast_track = 1 AND status = 'active' ORDER BY id LIMIT 1`, em.bid).id;
    const moi = em.tg === 7.5 ? 7 : 7.5;
    students.transferStudent(P.admin, em.sid, den, TODAY, 'Lên FT', { noNote: true, mucTieu: moi });
    const k = lichSu.lichSuSua(P.admin, em.sid, { loai: 'target' }).dong[0];
    const tg = k?.truong.find((x: any) => x.ten === 'Target');
    assert(tg && tg.moi === moi.toFixed(1) && tg.cu === (em.tg == null ? null : Number(em.tg).toFixed(1)), `khối chuyển lớp: ${JSON.stringify(k)}`);
  }));

  check('OV13o-4 · GV Speaking: "Kỹ năng tôi dạy" · Bài chờ chấm = CHỈ bài của mình, không bài S chấm chéo (SUA-CHAM-LAI L4)', () => {
    const p = perm.loadPrincipal(P.sTeacher.userId);
    const cc = new Map<number, number>();
    for (const r of (attempts.baiChamSpeaking(p, TODAY).rows as any[]).filter((x) => x.cho)) cc.set(r.classId, (cc.get(r.classId) ?? 0) + 1);
    const rows = tongQuan.lopToiDay(p, { ct: 'ft' }).rows as any[];
    assert(rows.some((r) => cc.has(r.classId)), `dữ liệu demo: GV S phải dạy ít nhất một lớp có bài chấm chéo (${[...cc.keys()]})`);
    for (const r of rows) {
      const cua = get('SELECT branch_id b FROM classes WHERE id = ?', r.classId).b;
      const minh = hoSo.noDiemCuaGv(p, p.userId, TODAY, [{ id: r.classId, branchId: cua }]);
      assert(minh.every((x: any) => !x.chamCheo), `${r.code}: noDiemCuaGv còn bài chấm chéo`);
      assert(r.baiCho === minh.length, `${r.code}: Bài chờ chấm ${r.baiCho} ≠ của mình ${minh.length} (chấm chéo ${cc.get(r.classId) ?? 0} không đếm)`);
      const o = tongQuan.oLopToiDay(p, { ct: 'ft', classId: r.classId, cot: 'bai-cho' });
      assert(o.n === r.baiCho, `bấm số ra ${o.n} ≠ ${r.baiCho}`);
    }
  });

  check('OV13o-5 · Báo cáo tuần: dòng lịch sử "nháp" ghi SAU lần nộp hiện là "sua"', () => thu(() => {
    const ky = get(`SELECT id FROM report_periods WHERE week_start < ? ORDER BY week_start DESC LIMIT 1`, d.mondayOfDate(TODAY)).id;
    const u = (meeting.meetingBoard(P.admin, ky) as any).units[0];
    const cat = u.cells[0].key;
    conn.prepare('DELETE FROM unit_report_history WHERE reporting_unit_id = ? AND period_id = ? AND category_key = ?').run(u.unitId, ky, cat);
    const ghi = conn.prepare(`INSERT INTO unit_report_history (reporting_unit_id, period_id, category_key, status, note, actor_user_id, at, kind) VALUES (?,?,?,?,?,?,?,?)`);
    ghi.run(u.unitId, ky, cat, 'ok', null, P.admin.userId, '2026-09-01T01:00:00Z', 'nhap');
    ghi.run(u.unitId, ky, cat, 'ok', null, P.admin.userId, '2026-09-01T02:00:00Z', 'nop');
    ghi.run(u.unitId, ky, cat, 'watch', null, P.admin.userId, '2026-09-01T03:00:00Z', 'nhap');
    const h = (meeting.meetingBoard(P.admin, ky) as any).units.find((x: any) => x.unitId === u.unitId).cells.find((c: any) => c.key === cat).history;
    assert(h.map((x: any) => x.kind).join() === 'sua,nop,nhap', `lịch sử: ${h.map((x: any) => x.kind).join()}`);
  }));

  check('OV13o-7 · Lịch sử MT: một lần lưu đổi cả nhận xét lẫn nhóm nguyên nhân → hai dòng (nhận xét + nhóm)', () => thu(() => {
    const a = get(`SELECT id, created_at FROM assessment_attempts WHERE kind = 'mock' AND status != 'cancelled' ORDER BY id DESC LIMIT 1`);
    const R = d.issuesForTopic('reading').map((i: any) => i.code) as string[];
    conn.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)
      VALUES (?, 'score.nhan_xet', 'assessment_attempt', ?, 'reading', ?, ?, ?)`).run(P.admin.userId, a.id,
      JSON.stringify({ comment: 'Nhận xét cũ đủ dài', nhom: JSON.stringify([R[0]]) }), JSON.stringify({ comment: 'Nhận xét mới đủ dài', nhom: JSON.stringify([R[1]]) }), '2099-01-01T00:00:00Z');
    const ds = (attempts.scoreHistoryOf(a.id) as any[]).filter((x) => x.kind === 'nhan_xet' && x.createdAt === '2099-01-01T00:00:00Z');
    assert(ds.some((x) => x.after === 'Nhận xét mới đủ dài') && ds.some((x) => x.after === d.issueLabel(R[1]) && x.before === d.issueLabel(R[0])), JSON.stringify(ds));
    assert(ds.length === 2 && ds.filter((x) => x.phan === 'nhom').length === 1, `hai dòng, một dòng nhóm (khoá riêng ở web): ${JSON.stringify(ds)}`);
  }));
}
