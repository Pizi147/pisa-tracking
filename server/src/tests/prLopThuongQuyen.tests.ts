/**
 * LOP-THUONG-QUYEN (chủ SP 08/11: "MT0 Speaking thì vẫn là chấm chéo, vẫn phải hiện các lớp khác"):
 *  · ô S của lượt MT0 (lớp thường) = chấm chéo như S Mock FT — không GV mặc định (`laChamCheo`);
 *  · GV có kỹ năng S (không phân công) thấy MT0 S các lớp thường cùng chi nhánh ở hàng đợi Chấm Speaking + Công việc, nhập được ô S;
 *  · KHÔNG mở: L/R/W của MT0, S Progress / Final lớp thường, chi nhánh khác.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLopThuongQuyenTests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, TODAY, classId } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const perm: any = await import('../permissions.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const regular: any = await import('../normal/regular.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLOP-THUONG-QUYEN · MT0 Speaking chấm chéo: GV kỹ năng S thấy + chấm MT0 S các lớp thường cùng chi nhánh');
  (await import('../fasttrack/conOCho.ts')).capNhatConOChoTatCa();

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const LOP = classId('MB FOU 12');
  const tao = (branch: string, tag: string) => accounts.createAccount(P.admin, {
    email: `ltq.${tag}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ltq', fullName: `Thử LTQ ${tag}`, roles: [{ role: 'teacher', branches: [branch] }], skills: ['speaking'],
  }).userId as number;
  const idS = tao('MB', 's');
  const khacCn = one(`SELECT code FROM branches WHERE id != (SELECT branch_id FROM classes WHERE id = ?) ORDER BY id LIMIT 1`, LOP).code as string;
  const idKhac = tao(khacCn, 'khac');
  const gvS = () => perm.loadPrincipal(idS);

  /** Em mới ở lớp thường + MT0 (tuần này) + Final (tuần này) — đủ ô S để so. */
  const emMt0 = () => {
    const now = new Date().toISOString();
    const tag = `LTQ-${Math.random().toString(36).slice(2, 7)}`;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, one('SELECT branch_id b FROM classes WHERE id = ?', LOP).b, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, LOP, '2026-01-01', now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', '2026-01-01', 'active', ?)`)
      .run(sid, now).lastInsertRowid);
    const tuan = week.ensurePeriod(d.mondayOfDate(TODAY)).id;
    const luot = (kind: string, no: number) => {
      const aid = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,?,?,?,?, 'planned', ?)`)
        .run(cy, sid, no, kind, LOP, tuan, now).lastInsertRowid);
      skillSch.ensureSkillRows(aid);
      return aid;
    };
    const mt0 = luot('mt0', 0), fin = luot('final', 2);
    return { sid, mt0, fin };
  };

  check('LTQ-1 · quyền: GV kỹ năng S có lớp thường cùng chi nhánh — chỉ ô S của lượt MT0; Final / L R W / chi nhánh khác không', () => {
    const p = gvS();
    assert(!p.assignments.length && perm.lopMt0ChoGvSpeaking(p, TODAY).includes(LOP), 'lớp thường MB phải trong phạm vi MT0');
    assert(!perm.lopFtChoGvSpeaking(p, TODAY).includes(LOP), 'lopFtChoGvSpeaking giữ chỉ lớp FT');
    assert(perm.coTheXemLuotCham(p, { classId: LOP, kind: 'mt0' }), 'xem lưới MT0');
    assert(!perm.coTheXemLuotCham(p, { classId: LOP }) && !perm.coTheXemLuotCham(p, { classId: LOP, kind: 'final' }), 'không mở lượt khác của lớp thường');
    const mt0 = { lich_su: 0, kind: 'mt0' };
    assert(perm.editableSkills(p, LOP, ['speaking', 'listening', 'writing1'], mt0).join() === 'speaking', 'MT0: chỉ ô S');
    assert(!perm.editableSkills(p, LOP, ['speaking'], { lich_su: 0, kind: 'final' }).length && !perm.editableSkills(p, LOP, ['speaking']).length, 'Final / không rõ lượt: đóng');
    assert(perm.scoreEditPath(p, LOP, 'speaking', mt0) === 'assigned' && perm.scoreEditPath(p, LOP, 'speaking') === null, 'đường ghi');
    const k = perm.loadPrincipal(idKhac);
    assert(!perm.lopMt0ChoGvSpeaking(k, TODAY).includes(LOP) && !perm.coTheXemLuotCham(k, { classId: LOP, kind: 'mt0' }), 'chi nhánh khác không mở');
  });

  check('LTQ-2 · MT0 S vào hàng đợi Chấm Speaking + việc Công việc của GV S; Final S không; ô S MT0 không là việc của ai', () => thu(() => {
    const e = emMt0();
    const q = svc.baiChamSpeaking(gvS(), TODAY);
    const dong = q.rows.find((r: any) => r.attemptId === e.mt0);
    assert(dong && dong.cho && dong.cell.skill === 'speaking' && dong.cell.canEdit, `MT0 S phải có trong hàng đợi, chấm được: ${JSON.stringify(dong?.cell ?? null)}`);
    assert(!q.rows.some((r: any) => r.attemptId === e.fin), 'Final không vào hàng đợi S chéo');
    const viec = ((mywork.myWork(gvS()).dong ?? []) as any[]).find((x) => x.key === d.KHOA_CHAM_SPEAKING);
    assert(viec && viec.soBai === q.soBai, `việc Chấm Speaking = hàng đợi (${viec?.soBai} / ${q.soBai})`);
    assert(d.laChamCheo('mt0', 'speaking') && !d.laChamCheo('final', 'speaking'), 'cờ chấm chéo');
  }));

  check('LTQ-3 · GV S lưu ô S MT0 được; L MT0 và S Final lớp thường bị chặn; GV chi nhánh khác bị chặn', () => thu(() => {
    const e = emMt0();
    svc.saveScore(gvS(), e.mt0, 'speaking', { band: 6 }, TODAY);
    assert(one(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, e.mt0)?.band === 6, 'ô S MT0 phải lưu');
    assertThrows(() => svc.saveScore(gvS(), e.mt0, 'listening', { band: 6 }, TODAY), /./, 'GV S nhập L MT0');
    assertThrows(() => regular.saveRegularScore(gvS(), e.fin, 'speaking', { score: 10, total: 20 }), /./, 'GV S nhập S Final lớp thường');
    assertThrows(() => svc.saveScore(perm.loadPrincipal(idKhac), e.mt0, 'speaking', { band: 5 }, TODAY), /./, 'GV S chi nhánh khác');
  }));
}
