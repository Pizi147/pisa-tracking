/**
 * PHÉP KIỂM RKC-1b (chủ SP 07/11 "KHÔNG BAO GIỜ CHẶN CỨNG"; PTA: luật đã chốt GIỮ cho GV, QL / Admin vượt kèm xác nhận): lịch Test — khoá cuối tuần N15
 * QL vượt sau một câu hỏi; không trần số MT (N14); nhập điểm khi chưa tới tuần → người dời được lịch hỏi "Dời về tuần này" (GV: câu chỉ đường).
 */
export async function runRkcLichTests(t: any) {
  const { check, assert } = t;
  const dm: any = await import('../../../shared/domain/index.ts');

  check('RKC-L0 · N14: không trần số MT — tạo được MT9; số cột lưới theo MT lớn nhất', () => {
    const ds = Array.from({ length: 8 }, (_, i) => ({ attempt_no: i + 1, status: 'planned', coDiem: false }));
    assert(dm.kiemSoMtMoi(ds, 9) === null, `MT9: ${dm.kiemSoMtMoi(ds, 9)}`);
    assert(dm.soCotMt(3, [10]) === 10, `soCot: ${dm.soCotMt(3, [10])}`);
  });
  if (!t.conn) return;
  const { conn, P, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const perm: any = await import('../permissions.ts');
  const { setConfig, getConfig } = await import('../demoConfig.ts');
  const { xoaNho, voiXacNhan } = await import('../platform/nguCanhRequest.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const datNgay = (n: string) => { setConfig('demo_date', n); xoaNho(); };
  const thu = <T>(ngay: string, fn: () => T): T => {
    const cu = getConfig('demo_date');
    conn.exec('BEGIN IMMEDIATE');
    try { datNgay(ngay); return fn(); } finally { conn.exec('ROLLBACK'); datNgay(cu); }
  };
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const hoi = (e: any) => e?.status === 409 && e.details?.canXacNhan === true;
  const MB_FT = classId('MB FT 101');
  const QL = P.mbManager;
  const gvL = perm.loadPrincipal(get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'listening' AND status = 'active' ORDER BY id LIMIT 1`, MB_FT).user_id);
  /* T2 14/09 · T3 15/09 · T6 18/09/2026 (khoá N15); tuần sau W4 SEP 21/09. */
  const NAY = '2026-09-14', T3 = '2026-09-15', T6 = '2026-09-18', SAU = '2026-09-21';
  let seq = 0;
  const luot = (w: string) => {
    const ten = `RKCL HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `rkcl-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const id = svc.createAttempt(P.admin, { studentId: sid, cycleId: cy, attemptNo: 1, periodId: week.ensurePeriod(w).id }).id as number;
    ss.ensureSkillRows(id);
    xoaNho();
    return id;
  };
  const tuanL = (id: number) => get(`SELECT rp.week_start w FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = 'listening'`, id)?.w;

  check('RKC-L1 · N15: T6 QL dời lịch MT tuần này → 409 hỏi (không đổi gì); xác nhận → dời được', () => thu(T6, () => {
    const id = luot(NAY);
    const e = loiCua(() => ss.setSkillWeek(QL, id, 'listening', week.ensurePeriod(SAU).id, { force: true }));
    assert(hoi(e) && String(tuanL(id)).startsWith(NAY), `chưa xác nhận: ${e?.status} ${e?.message} · ${tuanL(id)}`);
    voiXacNhan(() => ss.setSkillWeek(QL, id, 'listening', week.ensurePeriod(SAU).id, { force: true }));
    assert(String(tuanL(id)).startsWith(SAU), `phải dời: ${tuanL(id)}`);
  }));

  check('RKC-L2 · chưa tới tuần thi: QL nhập điểm → 409 "Dời về tuần này"; xác nhận → kỹ năng về tuần này + điểm lưu; GV → câu chỉ đường', () => thu(T3, () => {
    const id = luot(SAU);
    const eGv = loiCua(() => svc.saveScore(gvL, id, 'listening', { rawScore: 30 }, T3));
    assert(eGv?.status === 400 && /nhờ Quản lý dời về tuần này/.test(eGv.message), `GV: ${eGv?.status} ${eGv?.message}`);
    const e = loiCua(() => svc.saveScore(QL, id, 'listening', { rawScore: 30 }, T3));
    assert(hoi(e) && /dời về tuần này/.test(e.message), `QL chưa xác nhận: ${e?.status} ${e?.message}`);
    voiXacNhan(() => svc.saveScore(QL, id, 'listening', { rawScore: 30 }, T3));
    assert(String(tuanL(id)).startsWith(NAY), `phải về tuần này: ${tuanL(id)}`);
    assert(get(`SELECT raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = 'listening'`, id)?.raw_score === 30, 'điểm phải lưu');
  }));
}
