/**
 * FIX-XEP-BAI-THUONG (07/10): lớp thường — Progress Test có attempt_no LỚN hơn Final Test (Final tự tạo khi vào lớp, Progress xếp sau)
 * vẫn phải xếp được trước Final; xếp tuần đã qua (T4) rồi nhập điểm (T19).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runFixXepBaiThuongTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, addDays, classId } = t;
  const regularMod: any = await import('../normal/regular.ts');
  const keHoachMod: any = await import('../keHoach/keHoachTest.ts');
  const week: any = await import('../platform/week.ts');
  const profileMod: any = await import('../students/profile.ts');
  const dongMod: any = await import('../classes/dongHocVien.ts');
  const perm: any = await import('../permissions.ts');
  console.log('\nFIX-XEP-BAI-THUONG · Progress trước Final theo loại, không theo attempt_no');

  const lop = classId('MB FOU 12');
  const now = new Date().toISOString();
  const taoEm = (ma: string) => {
    const br = (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(lop) as any).branch_id;
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
    ).run(ma, `Học viên ${ma}`, `hoc vien ${ma.toLowerCase()}`, br, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, now);
    /* Như em vào lớp khi mốc Progress đã qua: chỉ có Final Test (attempt_no 1), Final ở tuần sau. */
    regularMod.planRegularTests(P.admin, lop, { studentIds: [sid], kinds: ['final'] });
    const fin = conn.prepare(`SELECT id, attempt_no FROM assessment_attempts WHERE student_id = ? AND kind = 'final'`).get(sid) as any;
    const tuanFinal = week.ensurePeriod(addDays(TODAY, 35));
    keHoachMod.luuDot(P.admin, { attemptId: fin.id, force: true, kyNang: ['listening', 'reading', 'writing', 'speaking'].map((skill) => ({ skill, periodId: tuanFinal.id })) });
    return { sid, fin };
  };
  const t4 = (id: number) => ({ listening: id, reading: id, writing: id, speaking: id });
  const tuanQua = week.ensurePeriod(addDays(TODAY, -7));
  const tuanNay = week.ensurePeriod(TODAY);

  check('XBT 1 · xepMoiThuong Progress (attempt_no 2) tuần đã qua, trước Final (attempt_no 1): lưu được, nhập điểm được', () => {
    const { sid, fin } = taoEm('PISA-XBT-1');
    assert(fin.attempt_no === 1, `Final phải attempt_no 1, ra ${fin.attempt_no}`);
    const r = keHoachMod.xepMoiThuong(P.admin, { classId: lop, studentId: sid, kind: 'progress', tuan: t4(tuanQua.id), force: true });
    const no = (conn.prepare('SELECT attempt_no FROM assessment_attempts WHERE id = ?').get(r.id) as any).attempt_no;
    assert(no === 2, `Progress phải attempt_no 2 (tái hiện dữ liệu thật), ra ${no}`);
    regularMod.saveRegularScore(P.admin, r.id, 'listening', { score: 30, total: 40 }, TODAY);
    const s = conn.prepare(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`).get(r.id) as any;
    assert(s?.raw_score === 30, 'Chưa lưu điểm');
  });

  check('XBT 2 · luuDot Progress (attempt_no 2) đang có lịch: dời sang tuần này rồi sang tuần đã qua — không bị chặn bởi Final', () => {
    const { sid } = taoEm('PISA-XBT-2');
    const r = keHoachMod.xepMoiThuong(P.admin, { classId: lop, studentId: sid, kind: 'progress', tuan: t4(week.ensurePeriod(addDays(TODAY, 14)).id), force: true });
    keHoachMod.luuDot(P.admin, { attemptId: r.id, force: true, kyNang: Object.entries(t4(tuanNay.id)).map(([skill, periodId]) => ({ skill, periodId })) });
    keHoachMod.luuDot(P.admin, { attemptId: r.id, force: true, kyNang: Object.entries(t4(tuanQua.id)).map(([skill, periodId]) => ({ skill, periodId })) });
    regularMod.saveRegularScore(P.admin, r.id, 'reading', { score: 20, total: 40 }, TODAY);
  });

  check('XBT 3 · vẫn chặn đúng: Progress không được xếp SAU / CÙNG tuần Final; Final không được xếp trước Progress', () => {
    const { sid, fin } = taoEm('PISA-XBT-3');
    const sauFinal = week.ensurePeriod(addDays(TODAY, 42));
    assertThrows(() => keHoachMod.xepMoiThuong(P.admin, { classId: lop, studentId: sid, kind: 'progress', tuan: t4(sauFinal.id), force: true }),
      /Final Test/, 'Progress sau Final phải bị chặn');
    const r = keHoachMod.xepMoiThuong(P.admin, { classId: lop, studentId: sid, kind: 'progress', tuan: t4(tuanNay.id), force: true });
    assertThrows(() => keHoachMod.luuDot(P.admin, { attemptId: fin.id, force: true, kyNang: [{ skill: 'listening', periodId: tuanQua.id }] }),
      /Progress Test/, 'Final trước Progress phải bị chặn');
    assert(r.id, 'thiếu id');
  });

  check('XBT 4 · hồ sơ HV lớp thường: Mốc tiếp theo = Progress Test (attempt_no 2) còn nợ, không phải Final Test (attempt_no 1)', () => {
    const { sid } = taoEm('PISA-XBT-4');
    keHoachMod.xepMoiThuong(P.admin, { classId: lop, studentId: sid, kind: 'progress', tuan: t4(tuanNay.id), force: true });
    const hs: any = profileMod.studentProfile(P.admin, sid);
    assert(hs.nextCheckpoint?.kind === 'progress', `Mốc tiếp theo phải Progress, ra ${hs.nextCheckpoint?.kind}`);
  });

  check('XBT 5 · nhapDiemTheoEm: đợt còn nợ sớm nhất = Progress Test khi nợ cả Progress (no 2) và Final (no 1)', () => {
    const { sid, fin } = taoEm('PISA-XBT-5');
    const tuan2 = week.ensurePeriod(addDays(TODAY, -14));
    keHoachMod.xepMoiThuong(P.admin, { classId: lop, studentId: sid, kind: 'progress', tuan: t4(tuan2.id), force: true });
    keHoachMod.luuDot(P.admin, { attemptId: fin.id, force: true, kyNang: Object.entries(t4(tuanQua.id)).map(([skill, periodId]) => ({ skill, periodId })) });
    /* Việc nhập điểm là của giáo viên được phân công ở lớp (Quản trị không có hàng đợi riêng). */
    const gv = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND skill = 'listening' LIMIT 1`).get(lop) as any).user_id;
    const x = dongMod.nhapDiemTheoEm(perm.loadPrincipal(gv), [lop], TODAY, () => lop).get(sid);
    assert(x?.dot === 'Progress Test', `đợt phải Progress, ra ${x?.dot}`);
  });
}
