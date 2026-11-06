/**
 * MT0-THEO-EM (chủ SP 06/11) — MT0 là điểm của em: em có MT0 ở lớp thường cũ rồi sang lớp FT → lớp FT hiện MT0 (Điểm theo lớp `mt:0`, lưới MT0,
 * Kế hoạch Test chỉ xem; hồ sơ lớp, hồ sơ HV, Hành trình đã có). Chấm / hạn / việc / nợ / Phân tích vẫn theo lớp cũ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrMt0EmTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  console.log('\nMT0-THEO-EM · MT0 đi theo em sang lớp FT');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const transition: any = await import('../classes/transition.ts');
  const dtl: any = await import('../cham/diemTheoLuot.ts');
  const classes: any = await import('../classes/classes.ts');
  const phanTichLop: any = await import('../classes/phanTichLop.ts');
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  const profile: any = await import('../students/profile.ts');
  const hanhTrinh: any = await import('../students/hanhTrinh.ts');
  const myWork: any = await import('../worklist/mywork.ts');
  const scoreDebt: any = await import('../worklist/scoreDebt.ts');
  const baoCao: any = await import('../phanTich/baoCao.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const FT101 = t.classId('MB FT 101');
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));

  /* Lớp BE tuần 10 (tuần Final đã tới), 2 em Lên FT: A MT0 đủ 4 kỹ năng, B thiếu S (ô trống, đã tới tuần) → cả hai sang MB FT 101. */
  const lop = intake.createClass(P.admin, { code: 'MB MT0EM-1', branchId: MB, kind: 'BE', isFastTrack: false, startDate: thu2(10), startPeriodId: week.ensurePeriod(thu2(10)).id });
  const now = new Date().toISOString();
  const [A, B] = ['A', 'B'].map((x) => {
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-MT0EM-${x}`, `Học viên MT0EM ${x}`, `hoc vien mt0em ${x.toLowerCase()}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, thu2(10), now);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, 'BE', 6, ?, 'active', ?)`).run(sid, thu2(10), now);
    return sid;
  });
  regular.planRegularTests(P.admin, lop.id);
  for (const sid of [A, B]) loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
  const mt0 = (sid: number) => get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0'`, sid).id as number;
  const [mA, mB] = [mt0(A), mt0(B)];
  const diem = (aid: number, b: Record<string, number>) => {
    for (const [k, v] of Object.entries(b)) conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)').run(aid, k, v, TODAY);
  };
  diem(mA, { listening: 6, reading: 5.5, writing1: 4, writing2: 4, speaking: 5 });
  diem(mB, { listening: 5, reading: 5, writing1: 5, writing2: 5 });
  /* Tuần Final của lớp BE có thể sau hôm nay — kéo về tuần trước để ô S của B là "đã tới tuần, còn trống" (nợ của lớp cũ). */
  const tuanTruoc = week.ensurePeriod(thu2(2)).id;
  conn.prepare(`UPDATE attempt_skills SET planned_period_id = ? WHERE attempt_id IN (?, ?)`).run(tuanTruoc, mA, mB);
  conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ? WHERE id IN (?, ?)`).run(tuanTruoc, mA, mB);
  /* Trước khi sang: số liệu lớp FT (để so "không thêm ô trống / nợ"). */
  const oTrongFt = () => dtl.danhSachLuot(QL, FT101).luot.reduce((n: number, l: any) => n + l.oTrong, 0);
  const oTrongTruoc = oTrongFt();
  transition.applyTransition(QL, { fromClassId: lop.id, effectiveDate: TODAY, dongs: [A, B].map((sid) => ({ studentId: sid, huong: 'fast_track', toClassId: FT101, mucTieu: 6 })) });
  const coId = (x: unknown, id: number) => new RegExp(`"(attemptId|id)":${id}[,}]`).test(JSON.stringify(x));

  check('MT0-EM-1 · Điểm theo lớp lớp FT: lượt `mt:0` đứng đầu (A đủ, B chưa), ô trống không tính; lớp BE cũ vẫn có `thuong:mt0`', () => {
    assert(get('SELECT class_id FROM assessment_attempts WHERE id = ?', mA).class_id === lop.id, 'tiền đề: MT0 giữ lớp BE cũ');
    const ds = dtl.danhSachLuot(QL, FT101);
    const l0 = ds.luot[0];
    assert(l0?.ma === 'mt:0' && l0.nhan === 'MT0' && l0.coLich === 2 && l0.duDiem === 1 && l0.oTrong === 0, `lượt MT0: ${JSON.stringify(ds.luot.slice(0, 2))}`);
    assert(oTrongFt() === oTrongTruoc, `ô trống lớp FT: ${oTrongTruoc} → ${oTrongFt()}`);
    assert(ds.macDinh !== 'mt:0', `lượt mở sẵn không là MT0: ${ds.macDinh}`);
    assert(dtl.danhSachLuot(QL, lop.id).luot.some((l: any) => l.ma === 'thuong:mt0'), 'lớp BE vẫn có MT0');
    assert(dm.docMaLuot('mt:0')?.so === 0 && dm.docMaLuot('cp:0') === null && dm.docMaLuot('mt:00') === null, 'mã lượt');
  });

  check('MT0-EM-2 · bảng `mt:0` lớp FT: hai em, chip SOS MT0, không hàng mờ, không việc / trễ; GV FT không sửa được, QL sửa được (quyền lớp cũ)', () => {
    const b = dtl.bangTheoLuot(QL, FT101, 'mt:0');
    const ids = b.ft.rows.map((r: any) => r.attemptId).sort();
    assert(JSON.stringify(ids) === JSON.stringify([mA, mB].sort()), `hàng: ${JSON.stringify(ids)}`);
    assert(b.chuaCoLich.length === 0, `hàng mờ: ${b.chuaCoLich.length}`);
    const rA = b.ft.rows.find((r: any) => r.attemptId === mA);
    assert(JSON.stringify(rA.mt0Sos) === JSON.stringify([{ skill: 'writing', band: 4 }]), `chip SOS: ${JSON.stringify(rA.mt0Sos)}`);
    const oS = b.ft.rows.find((r: any) => r.attemptId === mB).cells.find((c: any) => c.skill === 'speaking');
    assert(oS && !oS.viec && !oS.overdue && oS.canEdit, `ô S của B (QL): ${JSON.stringify({ viec: oS?.viec, overdue: oS?.overdue, canEdit: oS?.canEdit })}`);
    const gv = dtl.bangTheoLuot(P.coreTeacher, FT101, 'mt:0');
    assert(gv.ft.rows.every((r: any) => r.cells.every((c: any) => !c.canEdit && !c.viec && !c.overdue)), 'GVCN FT: chỉ xem, không việc');
    assert(dtl.bangTheoLuot(QL, FT101, 'mt:1').ft.rows.every((r: any) => !coId(r, mA) && !coId(r, mB)), 'bảng MT1 không lẫn MT0');
  });

  check('MT0-EM-3 · GV lớp FT không có việc / nợ MT0; nợ vẫn ở lớp BE cũ', () => {
    for (const gv of [P.coreTeacher, P.w1Teacher, P.sTeacher, P.lrTeacher]) {
      assert(!coId(myWork.myWork(gv, {}), mB), `Công việc GV ${gv.userId} có MT0`);
      assert(!scoreDebt.scoreDebtCells(gv, TODAY, null).some((c: any) => c.attemptId === mB && c.userId === gv.userId), `Nợ điểm GV ${gv.userId}`);
    }
    assert(!scoreDebt.scoreDebtCells(QL, TODAY, null, [FT101]).some((c: any) => c.attemptId === mB), 'nợ lớp FT không có MT0');
    assert(scoreDebt.scoreDebtCells(QL, TODAY, null, [lop.id]).some((c: any) => c.attemptId === mB), 'nợ MT0 vẫn ở lớp BE');
  });

  check('MT0-EM-4 · Kế hoạch Test lớp FT: ô MT0 chỉ xem (`mt0`), không vào cột / ô MT; hồ sơ lớp, hồ sơ HV, Hành trình có MT0', () => {
    const l = keHoach.luoiFT(QL, FT101);
    const h = l.hang.find((x: any) => x.studentId === A);
    assert(h?.mt0?.attemptId === mA && !!h.mt0.kn.listening && !l.cot.includes(0) && !coId(h.dot, mA), `Kế hoạch Test: ${JSON.stringify(h?.mt0)} · cột ${l.cot}`);
    const r = classes.classRoster(QL, FT101).find((x: any) => x.id === A);
    assert(r.timeline.some((x: any) => x.id === mA && x.kindLabel === 'MT0'), 'hồ sơ lớp: MT0 ở bảng Học viên');
    assert(profile.studentProfile(QL, A).attempts.some((x: any) => x.id === mA), 'hồ sơ HV');
    assert(JSON.stringify(hanhTrinh.hanhTrinhHocVien(QL, A, null)).includes('"nhanNgan":"MT0"'), 'Hành trình');
  });

  check('MT0-EM-5 · Phân tích không đếm trùng: Phân tích lớp FT không cột MT0; Kết quả MT có MT0 của A một lần', () => {
    const pt = phanTichLop.phanTichLop(QL, FT101);
    assert(!pt.cot.some((c: any) => /mt0/i.test(c.key)), `cột: ${pt.cot.map((c: any) => c.key)}`);
    const kq = baoCao.tapKqMt(QL, { branchId: MB, ct: 'ft', tu: thu2(4), den: TODAY });
    const m0 = kq.get('mt0');
    assert(m0?.has(A) && [...kq.values()].filter((m: any) => m.has(A)).length === 1, `Kết quả MT của A: ${JSON.stringify([...kq].map(([k, m]: any) => [k, m.has(A)]))}`);
  });
}
