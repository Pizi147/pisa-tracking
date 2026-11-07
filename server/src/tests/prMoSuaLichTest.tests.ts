/**
 * PHÉP KIỂM MO-SUA-LICH-TEST (chủ SP 06/11): công tắc "Mở sửa lịch Test" — chỉ Quản trị bật / tắt (403 vai khác).
 *  TẮT: N15 / N23 như cũ (QL T6 → CN khoá, GVCN không sửa lịch FT).
 *  BẬT: GVCN lớp mình chủ nhiệm + Admin + QL (đúng chi nhánh) sửa lịch Test kể cả T6 → CN (bỏ N15); GVCN lớp khác, GV bộ môn, QL chi nhánh khác vẫn 403.
 */
export async function runPrMoSuaLichTestTests(t: any) {
  const { check, assert } = t;
  console.log('\nMO-SUA-LICH-TEST — công tắc Quản trị mở sửa lịch Test');
  if (!t.conn) return;

  const { conn, P, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const ss: any = await import('../fasttrack/skillSchedule.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const sEx: any = await import('../cham/sExpert.ts');
  const perm: any = await import('../permissions.ts');
  const msl: any = await import('../platform/moSuaLichTest.ts');
  const { setConfig, getConfig } = await import('../demoConfig.ts');
  const nc: any = await import('../platform/nguCanhRequest.ts');
  const { xoaNho } = nc;
  const { boLichTuTao } = await import('./luotThu.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const T6 = '2026-09-18';
  const W = { nay: '2026-09-14', sau: '2026-09-21', c3: '2026-10-05' };
  const pid = (w: string) => week.ensurePeriod(w).id as number;
  const datNgay = (n: string) => { setConfig('demo_date', n); xoaNho(); };
  const thu = <T>(fn: (doiNgay: () => void) => T): T => {
    const cu = getConfig('demo_date');
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(() => datNgay(T6)); }
    finally { conn.exec('ROLLBACK'); datNgay(cu); }
  };
  const loi = (fn: () => unknown): string | null => { try { fn(); return null; } catch (e: any) { return e?.message ?? String(e); } };
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const L = (await import('../../../shared/domain/index.ts') as any).LOI_KHOA_CUOI_TUAN;
  const HOI = 'Đang khoá đổi lịch MT cuối tuần (T6 – CN) — vẫn đổi lịch?';   // RKC: QL vượt N15 kèm xác nhận
  const MB_FT = classId('MB FT 101');
  const nguoi = (vai: string, cn: string) => {
    const id = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = ? AND b.code = ? ORDER BY ur.user_id LIMIT 1`, vai, cn)?.id;
    assert(id, `seed thiếu ${vai} ${cn}`);
    return perm.loadPrincipal(id);
  };
  const QL = P.mbManager;
  /** GVCN của một lớp KHÁC (không có phân công nào ở MB FT 101 — seed nhân bản GV giữa các lớp nên không dùng `normalCoreTeacher`). */
  const gvcnLopKhac = () => {
    const id = get(`SELECT user_id AS id FROM teacher_assignments WHERE is_core = 1 AND status = 'active' AND class_id != ?
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ?) LIMIT 1`, MB_FT, MB_FT)?.id;
    assert(id, 'seed thiếu GVCN lớp khác');
    return perm.loadPrincipal(id);
  };
  let seq = 0;
  const em = () => {
    const ten = `MOSUA HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: MB_FT, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `mosua-${seq}` });
    const sid = get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", sid).id as number;
    boLichTuTao(conn, cy);
    const luot = (no: number, w: string) => svc.createAttempt(P.admin, { studentId: sid, cycleId: cy, attemptNo: no, periodId: pid(w) }).id as number;
    return { sid, cy, luot };
  };

  check('MSL-1 · chỉ Quản trị bật / tắt: QL, Admin, GVCN, GV bộ môn → 403; Quản trị bật → có người + giờ; nhật ký; tắt lại', () => thu(() => {
    const ad = nguoi('office_admin', 'MB');
    assert(!msl.dangMoSuaLichTest(), 'mặc định TẮT');
    for (const [ten, p] of [['QL', QL], ['Admin', ad], ['GVCN', P.coreTeacher], ['GV bộ môn', P.subjectTeacher]] as const) {
      assert(ma(() => msl.datMoSua(p, true)) === 403, `${ten} bật phải 403`);
      assert(ma(() => msl.xemMoSua(p)) === 403, `${ten} xem công tắc phải 403`);
    }
    assert(!msl.dangMoSuaLichTest(), 'bị chặn thì vẫn tắt');
    assert(ma(() => msl.datMoSua(P.admin, 'yes')) === 400, 'giá trị không phải boolean → 400');
    const r = msl.datMoSua(P.admin, true);
    assert(r.bat && r.nguoi && r.luc && msl.dangMoSuaLichTest() && msl.xemMoSua(P.admin).nguoi === r.nguoi, `bật: ${JSON.stringify(r)}`);
    assert(get("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'mo_sua_lich_test.bat'").n === 1, 'nhật ký bật');
    msl.datMoSua(P.admin, true);
    assert(get("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'mo_sua_lich_test.bat'").n === 1, 'bật lại không ghi trùng');
    msl.datMoSua(P.admin, false);
    assert(!msl.dangMoSuaLichTest() && get("SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'mo_sua_lich_test.tat'").n === 1, 'tắt + nhật ký');
  }));

  check('MSL-2 · TẮT, T6: RKC: QL được hỏi (vượt N15 kèm xác nhận); GVCN FT không dời được lịch FT (N23); hàm quyền = như cũ', () => thu((doiNgay) => {
    const a = em(); const m1 = a.luot(1, W.nay);
    doiNgay();
    assert(loi(() => ss.setSkillWeek(QL, m1, 'listening', pid(W.c3), {})) === HOI, 'RKC: QL phải được hỏi');
    assert(ma(() => ss.setSkillWeek(P.coreTeacher, m1, 'listening', pid(W.c3), {})) === 403, 'GVCN FT 403');
    assert(!msl.choSuaLichTest(P.coreTeacher, { classId: MB_FT }) && msl.choSuaLichTest(QL, { classId: MB_FT }), 'choSuaLichTest như PLAN_WEEK');
    assert(kh.luoiFT(P.coreTeacher, MB_FT, T6).chiXem === true, 'GVCN chỉ xem');
  }));

  check('MSL-3 · BẬT, T6: QL, Admin, GVCN lớp mình dời MT tuần này (bỏ N15); lưới không còn chỉ xem', () => thu((doiNgay) => {
    const ad = nguoi('office_admin', 'MB');
    const a = em(); const b = em(); const c = em();
    const m1 = a.luot(1, W.nay); const n1 = b.luot(1, W.nay); const k1 = c.luot(1, W.nay);
    msl.datMoSua(P.admin, true);
    doiNgay();
    for (const [ten, p, id] of [['QL', QL, m1], ['Admin', ad, n1], ['GVCN', P.coreTeacher, k1]] as const) {
      const e = loi(() => ss.setSkillWeek(p, id, 'listening', pid(W.c3), {}));
      assert(e === null, `${ten}: ${e}`);
    }
    assert(kh.luoiFT(P.coreTeacher, MB_FT, T6).chiXem === false, 'GVCN lớp mình: không chỉ xem');
    assert(kh.luoiFT(P.subjectTeacher, MB_FT, T6).chiXem === true, 'GV bộ môn: vẫn chỉ xem');
  }));

  check('MSL-4 · BẬT: GVCN lớp khác, GV bộ môn, QL chi nhánh khác → 403 (kể cả không phải T6)', () => thu((doiNgay) => {
    const a = em(); const m1 = a.luot(1, W.nay);
    msl.datMoSua(P.admin, true);
    doiNgay();
    for (const [ten, p] of [['GVCN lớp khác', gvcnLopKhac()], ['GV bộ môn', P.subjectTeacher], ['QL CP', P.cpManager]] as const) {
      const m = (f: () => unknown) => { try { f(); return 'ok'; } catch (e: any) { return `${e?.status}:${e?.message}`; } };
      const r = [m(() => ss.setSkillWeek(p, m1, 'listening', pid(W.c3), {})), m(() => ss.boTuanLuot(p, m1, {})),
        m(() => svc.createAttempt(p, { studentId: a.sid, cycleId: a.cy, attemptNo: 2, periodId: pid(W.c3) })), m(() => sEx.themSEx(p, { studentId: a.sid, tuan: W.c3 }))];
      assert(r.every((x) => x.startsWith('403:')), `${ten}: ${JSON.stringify(r)}`);
    }
    assert(!msl.choSuaLichTest(gvcnLopKhac(), { classId: MB_FT }), 'hàm quyền: GVCN lớp khác');
    assert(!msl.boKhoaCuoiTuan(P.subjectTeacher, { classId: MB_FT }) && !msl.boKhoaCuoiTuan(P.cpManager, { classId: MB_FT }), 'không miễn khoá N15');
  }));

  check('MSL-5 · BẬT, T6: GVCN xếp MT mới, huỷ lịch, S Ex, huỷ + khôi phục lượt trên lớp mình; tắt lại thì GVCN 403', () => thu((doiNgay) => {
    const ad = nguoi('office_admin', 'MB');
    const a = em(); const m1 = a.luot(1, W.nay);
    const b = em(); const huy = b.luot(1, W.nay);
    const k = em(); const k1 = k.luot(1, W.nay);
    msl.datMoSua(P.admin, true);
    doiNgay();
    const G = P.coreTeacher;
    const chamTruoc = sEx.chamDuoc(G, a.sid);   // quyền CHẤM S Ex theo luật cũ — công tắc không đổi nó
    assert(loi(() => svc.createAttempt(G, { studentId: a.sid, cycleId: a.cy, attemptNo: 2, periodId: pid(W.c3) })) === null, 'xếp MT2');
    const sx = sEx.themSEx(G, { studentId: a.sid, tuan: W.nay }).id;
    assert(loi(() => sEx.suaSEx(G, sx, { tuan: W.c3 })) === null, 'dời S Ex');
    assert(sEx.chamDuoc(G, a.sid) === chamTruoc, 'công tắc không cấp thêm quyền chấm S Ex');
    assert(loi(() => sEx.xoaSEx(G, sx)) === null, 'xoá S Ex');
    assert(loi(() => ss.boTuanLuot(G, m1, {})) === null, 'huỷ lịch');
    assert(loi(() => svc.huyLuot(G, huy, {})) === null, 'huỷ lượt');
    assert(loi(() => svc.reopenAttempt(ad, huy)) === null, 'Admin khôi phục lượt (công tắc BẬT)');
    assert(ma(() => svc.huyLuot(P.subjectTeacher, huy, {})) === 403, 'GV bộ môn huỷ lượt 403');
    msl.datMoSua(P.admin, false);
    assert(ma(() => ss.setSkillWeek(G, m1, 'reading', pid(W.c3), {})) === 403, 'tắt lại: GVCN 403');
    assert(loi(() => ss.setSkillWeek(QL, k1, 'reading', pid(W.sau), {})) === HOI, 'tắt lại: RKC: QL được hỏi T6');
  }));

  check('MSL-7 · Đọc Turso: request GHI hỏi công tắc 200 lần = tối đa 1 câu SQL (nhớ MỘT request, kể cả không phải GET); bật / tắt trong request thì lần hỏi sau thấy bản mới', () => thu(() => {
    const { chayTrongRequest, soCauSql } = nc;
    const dem = (method: string, fn: () => void) => { const t0 = soCauSql(); chayTrongRequest(method, fn); return soCauSql() - t0; };
    for (const method of ['POST', 'GET']) {
      const n = dem(method, () => { for (let i = 0; i < 200; i++) msl.boKhoaCuoiTuan(QL, { classId: MB_FT, studentId: 1 }); });
      assert(n <= 1, `${method}: 200 lần hỏi tốn ${n} câu (tối đa 1)`);
    }
    let thay: boolean[] = [];
    chayTrongRequest('PUT', () => { thay.push(msl.dangMoSuaLichTest()); msl.datMoSua(P.admin, true); thay.push(msl.dangMoSuaLichTest()); });
    assert(thay[0] === false && thay[1] === true, `trong cùng request: ${thay}`);
    let moi = false;
    chayTrongRequest('POST', () => { moi = msl.dangMoSuaLichTest(); });
    assert(moi, 'request mới thấy bản BẬT');
  }));

  check('MSL-6 · Dữ liệu công tắc hỏng / không phải boolean thật → coi như TẮT (về N15, N23)', () => thu(() => {
    assert(!msl.choSuaLichTest(gvcnLopKhac(), { classId: MB_FT }), 'tắt');
    setConfig(msl.KHOA_MO_SUA_LICH_TEST, '{hỏng'); xoaNho();
    assert(!msl.dangMoSuaLichTest(), 'JSON hỏng → tắt');
    setConfig(msl.KHOA_MO_SUA_LICH_TEST, JSON.stringify({ bat: 'true' })); xoaNho();
    assert(!msl.dangMoSuaLichTest(), '"true" chuỗi → tắt');
  }));
}
