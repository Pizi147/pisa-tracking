/**
 * FIX-KQ-GAN-NHAT-THUONG (rà #246, 07/10): lớp thường — "Kết quả gần nhất" theo LOẠI (Progress → Final, `soThuTuLuot`), không theo
 * attempt_no. Em vào lớp muộn: Final tự tạo số 1, Progress xếp tay số 2 — Final có điểm thì mọi màn lấy Final.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runFixKqGanNhatTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays, classId } = t;
  const regularMod: any = await import('../normal/regular.ts');
  const keHoachMod: any = await import('../keHoach/keHoachTest.ts');
  const week: any = await import('../platform/week.ts');
  const profileMod: any = await import('../students/profile.ts');
  const standingMod: any = await import('../students/standing.ts');
  const danhGia: any = await import('../worklist/danhGia.ts');
  const casesMod: any = await import('../cases/cases.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nFIX-KQ-GAN-NHAT-THUONG · kết quả gần nhất lớp thường theo loại, không theo attempt_no');

  const lop = classId('MB FOU 12');
  const now = new Date().toISOString();
  const br = (conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(lop) as any).branch_id;
  const sid = Number(conn.prepare(
    `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`,
  ).run('PISA-KQGN-1', 'Học viên PISA-KQGN-1', 'hoc vien pisa-kqgn-1', br, now).lastInsertRowid);
  conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, TODAY, now);
  /* Vào lớp muộn: chỉ có Final (attempt_no 1); Progress xếp tay sau (attempt_no 2), tuần trước Final. */
  regularMod.planRegularTests(P.admin, lop, { studentIds: [sid], kinds: ['final'] });
  const fin = conn.prepare(`SELECT id, attempt_no FROM assessment_attempts WHERE student_id = ? AND kind = 'final'`).get(sid) as any;
  const kn = ['listening', 'reading', 'writing', 'speaking'];
  const tuan = (n: number) => week.ensurePeriod(addDays(TODAY, n)).id;
  const pro = keHoachMod.xepMoiThuong(P.admin, { classId: lop, studentId: sid, kind: 'progress', tuan: Object.fromEntries(kn.map((k) => [k, tuan(-14)])), force: true });
  keHoachMod.luuDot(P.admin, { attemptId: fin.id, force: true, kyNang: kn.map((skill) => ({ skill, periodId: tuan(-7) })) });
  for (const k of kn) {
    regularMod.saveRegularScore(P.admin, pro.id, k, { score: 10, total: 40 }, addDays(TODAY, -14));
    regularMod.saveRegularScore(P.admin, fin.id, k, { score: 35, total: 40 }, TODAY);
  }
  const proNo = (conn.prepare('SELECT attempt_no FROM assessment_attempts WHERE id = ?').get(pro.id) as any).attempt_no;

  check('KQGN 0 · tái hiện: Final attempt_no 1, Progress attempt_no 2', () => {
    assert(fin.attempt_no === 1 && proNo === 2, `ra Final ${fin.attempt_no}, Progress ${proNo}`);
  });

  check('KQGN 1 · danh sách lớp (standingFor): kết quả gần nhất = Final', () => {
    const s = standingMod.standingFor([sid]).get(sid);
    assert(s?.attemptId === fin.id, `phải Final ${fin.id}, ra ${s?.attemptKind} ${s?.attemptId}`);
  });

  check('KQGN 2 · SOS hiện tại / Công việc (latestAttempts valid): lượt mới nhất = Final', () => {
    const a = danhGia.latestAttempts([sid], 'valid', TODAY).get(sid);
    assert(a?.attemptId === fin.id || a?.id === fin.id, `phải Final ${fin.id}, ra ${a?.kind} ${a?.attemptId ?? a?.id}`);
    const ds = danhGia.attemptsNewestFirst([sid]).get(sid);
    assert(ds?.[0]?.id === fin.id, `attemptsNewestFirst[0] phải Final, ra ${ds?.[0]?.kind}`);
  });

  check('KQGN 3 · hồ sơ HV (ketQuaTestGanNhat): Final', () => {
    const hs: any = profileMod.studentProfile(P.admin, sid);
    const kq = d.ketQuaTestGanNhat(hs.attempts, TODAY);
    assert(kq?.attemptId === fin.id, `phải Final ${fin.id}, ra ${kq?.attemptId} (${kq?.nhan})`);
  });

  check('KQGN 4 · tên Case theo mốc mới nhất: [Final Test] khi Case có mốc Progress (no 2) rồi Final (no 1)', () => {
    const cy = (conn.prepare('SELECT cycle_id FROM assessment_attempts WHERE id = ?').get(fin.id) as any).cycle_id;
    const caseId = Number(conn.prepare(
      `INSERT INTO sos_cases (student_id, cycle_id, attempt_id, topic, category, origin_kind, status, sos_level, detected_at, created_at)
       VALUES (?,?,?, 'listening', 'listening', 'mock', 'open', 1, ?, ?)`,
    ).run(sid, cy, pro.id, TODAY, now).lastInsertRowid);
    const moc = conn.prepare(`INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, occurred_on, created_at) VALUES (?, 'attempt', ?, ?, ?, ?)`);
    moc.run(caseId, pro.id, proNo, addDays(TODAY, -14), now);
    moc.run(caseId, fin.id, fin.attempt_no, TODAY, now);
    const ten = casesMod.caseTitleOf({ id: caseId, category: 'listening', topic: 'listening', origin_kind: 'mock', sos_level: 1, title: null });
    assert(ten.startsWith('[Final Test]'), `tên phải [Final Test]…, ra ${ten}`);
  });
}
