/**
 * PHÉP KIỂM R1-NO-CU (đặc tả 27/10 mục 4.5, D17) — đổi người phụ trách Case: QL / Quản trị (của lớp) + GVCN lớp hiện tại của em đổi được;
 * chỉ chọn GV dạy đúng kỹ năng của Case ở lớp đó + GVCN (máy chủ kiểm); lịch sử + nhật ký + thông báo; hai người đổi cùng lúc → người sau 409.
 * Mỗi ca ghi trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runR1NoCuTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const owner: any = await import('../cases/owner.ts');
  const cases: any = await import('../cases/cases.ts');
  const perm: any = await import('../permissions.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nR1-NO-CU · đổi người phụ trách Case (QL + GVCN, ứng viên theo kỹ năng, lịch sử, 409)');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const chuCua = (id: number) => one('SELECT owner_user_id o FROM sos_cases WHERE id = ?', id).o as number | null;
  /** Mã HTTP của lỗi ném ra (0 = không lỗi). */
  const maLoi = (fn: () => unknown) => { try { fn(); return 0; } catch (e: any) { return e?.status ?? -1; } };

  const LOP = classId('MB FOU 12');
  const gvcn = () => one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`, LOP).user_id as number;
  /** Case học thuật đang mở của em đang học ở MB FOU 12, môn có GV dạy (khác GVCN) — người phụ trách đặt về GVCN để có người khác mà đổi. */
  const caseCuaLop = () => {
    const c = all(`SELECT sc.* FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        JOIN enrollments e ON e.student_id = COALESCE(sc.student_id, a.student_id) AND e.status = 'active'
        JOIN students s ON s.id = e.student_id AND s.archived_at IS NULL
       WHERE e.class_id = ? AND sc.status != 'done' AND sc.tam = 0 AND sc.category IS NOT NULL ORDER BY sc.id`, LOP)
      .find((r) => dm.CASE_CATEGORY_SKILL[r.category] && one(`SELECT 1 FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' AND user_id != ?`,
        LOP, dm.CASE_CATEGORY_SKILL[r.category], gvcn()));
    assert(c, 'demo phải có Case học thuật mở ở MB FOU 12 có GV môn khác GVCN');
    conn.prepare('UPDATE sos_cases SET owner_user_id = ? WHERE id = ?').run(gvcn(), c.id);
    const gvMon = one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' AND user_id != ? ORDER BY id`,
      LOP, dm.CASE_CATEGORY_SKILL[c.category], gvcn()).user_id as number;
    return { id: c.id as number, gvMon, studentId: (c.student_id ?? one('SELECT student_id FROM assessment_attempts WHERE id = ?', c.attempt_id).student_id) as number };
  };
  const nguoiTheoVai = (vai: string) => one(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN branches b ON b.id = ur.branch_id
      WHERE r.key = ? AND b.code = 'MB' ORDER BY ur.user_id`, vai).id as number;
  /** GV môn của MB FOU 12 không phải GVCN, không QL. */
  const gvMonThuan = () => perm.loadPrincipal(one(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND is_core = 0
      AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1) ORDER BY id`, LOP, LOP).user_id);

  check('CHU-1 QL đổi → 200: lịch sử cũ → mới (người đổi = QL), nhật ký case.owner_change, thông báo case_giao cho người mới', () => thu(() => {
    const c = caseCuaLop();
    conn.prepare(`DELETE FROM notifications WHERE dedup_key = ?`).run(`case_giao:${c.id}`);
    const r = owner.doiChuCase(P.mbManager, c.id, { ownerId: c.gvMon, ownerCu: gvcn() });
    assert(r.ownerUserId === c.gvMon && chuCua(c.id) === c.gvMon, `chủ mới: ${JSON.stringify(r)}`);
    const ls = all(`SELECT * FROM sos_case_history WHERE case_id = ? AND field = 'owner_user_id' ORDER BY id DESC`, c.id)[0];
    assert(ls && ls.old_value === String(gvcn()) && ls.new_value === String(c.gvMon) && ls.actor_user_id === P.mbManager.userId, `lịch sử: ${JSON.stringify(ls)}`);
    const au = one(`SELECT * FROM audit_logs WHERE action = 'case.owner_change' AND entity_id = ? ORDER BY id DESC`, c.id);
    assert(au && au.actor_user_id === P.mbManager.userId && JSON.parse(au.after_json).ownerUserId === c.gvMon, `nhật ký: ${JSON.stringify(au)}`);
    assert(one(`SELECT 1 x FROM notifications WHERE user_id = ? AND kind = 'case_giao' AND dedup_key = ?`, c.gvMon, `case_giao:${c.id}`), 'người mới nhận thông báo giao Case');
    const d = cases.caseDetail(P.mbManager, c.id);
    assert(d.doiChu?.duoc === true && d.doiChu.ungVien.some((u: any) => u.id === c.gvMon) && d.doiChu.ungVien.some((u: any) => u.id === gvcn()),
      `chi tiết Case: ${JSON.stringify(d.doiChu)}`);
  }));

  check('CHU-2 GVCN lớp em đổi → 200 · GV môn 403 · TVV 403 · GVCN lớp khác 403 (chi tiết: doiChu.duoc khớp)', () => thu(() => {
    const c = caseCuaLop();
    const pGvcn = perm.loadPrincipal(gvcn());
    const gvMon = gvMonThuan();
    const tvv = perm.loadPrincipal(nguoiTheoVai('consultant'));
    const lopKhac = perm.loadPrincipal(one(`SELECT user_id FROM teacher_assignments WHERE class_id != ? AND is_core = 1 AND status = 'active'
        AND user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active') ORDER BY id`, LOP, LOP).user_id);
    for (const [ten, p] of [['GV môn', gvMon], ['TVV', tvv], ['GVCN lớp khác', lopKhac]] as const) {
      assert(maLoi(() => owner.doiChuCase(p, c.id, { ownerId: c.gvMon, ownerCu: gvcn() })) === 403, `${ten} phải 403`);
      assert(!owner.duocDoiChuCase(p, c.id), `${ten}: duocDoiChuCase = false`);
    }
    assert(chuCua(c.id) === gvcn(), 'bị chặn thì không ghi');
    assert(owner.duocDoiChuCase(pGvcn, c.id), 'GVCN: duocDoiChuCase = true');
    assert(owner.doiChuCase(pGvcn, c.id, { ownerId: c.gvMon, ownerCu: gvcn() }).ownerUserId === c.gvMon, 'GVCN đổi được');
  }));

  check('CHU-2b GVCN cũ: em đã chuyển khỏi lớp → quyền theo lớp HIỆN TẠI, GVCN lớp cũ 403', () => thu(() => {
    const c = caseCuaLop();
    const pGvcn = perm.loadPrincipal(gvcn());
    const lopMoi = one(`SELECT id FROM classes WHERE id != ? AND status = 'active' AND id NOT IN (SELECT class_id FROM teacher_assignments WHERE user_id = ? AND status = 'active') ORDER BY id`, LOP, pGvcn.userId).id;
    conn.prepare(`UPDATE enrollments SET class_id = ? WHERE student_id = ? AND status = 'active'`).run(lopMoi, c.studentId);
    xoaNho();
    assert(maLoi(() => owner.doiChuCase(pGvcn, c.id, { ownerId: c.gvMon, ownerCu: gvcn() })) === 403, 'GVCN lớp cũ phải 403');
  }));

  check('CHU-3 ngoài danh sách ứng viên → 400 · trùng người hiện tại → 400 · Case đã đóng → 400', () => thu(() => {
    const c = caseCuaLop();
    const ngoai = one(`SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active') ORDER BY id`, LOP).id;
    assert(maLoi(() => owner.doiChuCase(P.mbManager, c.id, { ownerId: ngoai, ownerCu: gvcn() })) === 400, 'người ngoài danh sách → 400');
    assert(maLoi(() => owner.doiChuCase(P.mbManager, c.id, { ownerId: gvcn(), ownerCu: gvcn() })) === 400, 'trùng người hiện tại → 400');
    assert(maLoi(() => owner.doiChuCase(P.mbManager, c.id, { ownerId: 'x', ownerCu: gvcn() })) === 400, 'ownerId không phải số → 400');
    conn.prepare(`UPDATE sos_cases SET status = 'done' WHERE id = ?`).run(c.id);
    assert(maLoi(() => owner.doiChuCase(P.mbManager, c.id, { ownerId: c.gvMon, ownerCu: gvcn() })) === 400, 'Case đã đóng → 400');
    assert(cases.caseDetail(P.mbManager, c.id).doiChu.duoc === false, 'Case đóng: doiChu.duoc = false');
    assert(chuCua(c.id) === gvcn(), 'không ghi');
  }));

  check('CHU-4 ownerCu lệch giá trị hiện tại (người khác vừa đổi) → 409, không ghi', () => thu(() => {
    const c = caseCuaLop();
    const truoc = all(`SELECT id FROM sos_case_history WHERE case_id = ?`, c.id).length;
    assert(maLoi(() => owner.doiChuCase(P.mbManager, c.id, { ownerId: c.gvMon, ownerCu: c.gvMon })) === 409, 'ownerCu lệch → 409');
    assert(maLoi(() => owner.doiChuCase(P.mbManager, c.id, { ownerId: c.gvMon })) === 400, 'thiếu ownerCu → 400');
    assert(chuCua(c.id) === gvcn() && all(`SELECT id FROM sos_case_history WHERE case_id = ?`, c.id).length === truoc, 'không ghi gì');
  }));

  check('CHU-5 Case môn gộp (L+S): ứng viên = GV L + GV S + GV L+S + GVCN, không trùng người', () => thu(() => {
    const c = caseCuaLop();
    conn.prepare(`UPDATE sos_cases SET category = 'listening_speaking', topic = 'listening_speaking' WHERE id = ?`).run(c.id);
    const gv = all(`SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active') ORDER BY id LIMIT 3`, LOP).map((r) => r.id);
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE class_id = ? AND status = 'active' AND skill IN ('listening', 'speaking') AND is_core = 0`).run(LOP);
    const them = conn.prepare(`INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, ?, 0, 'active', '2026-09-01', '2026-09-01')`);
    them.run(LOP, gv[0], 'listening'); them.run(LOP, gv[1], 'speaking'); them.run(LOP, gv[2], 'listening_speaking');
    them.run(LOP, gvcn(), 'speaking');
    xoaNho();
    const ids = owner.ungVienChuCase(c.id).map((u: any) => u.id);
    assert(new Set(ids).size === ids.length, `không trùng: ${ids}`);
    for (const id of [gv[0], gv[1], gv[2], gvcn()]) assert(ids.includes(id), `thiếu ứng viên ${id}: ${ids}`);
    const reading = all(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND skill = 'reading' AND user_id != ?`, LOP, gvcn());
    assert(reading.every((r) => !ids.includes(r.user_id)), 'GV môn khác không là ứng viên');
  }));

  check('CHU-6 em không có lớp: chỉ case.approve qua quyền; ứng viên rỗng → doiChu.duoc = false; GVCN cũ 403', () => thu(() => {
    const c = caseCuaLop();
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE student_id = ? AND status = 'active'`).run(c.studentId);
    xoaNho();
    assert(owner.ungVienChuCase(c.id).length === 0, 'không lớp → không ứng viên');
    assert(cases.caseDetail(P.mbManager, c.id).doiChu.duoc === false, 'QL: doiChu.duoc = false');
    assert(maLoi(() => owner.doiChuCase(perm.loadPrincipal(gvcn()), c.id, { ownerId: c.gvMon, ownerCu: gvcn() })) === 403, 'GVCN cũ → 403');
    assert(maLoi(() => owner.doiChuCase(P.mbManager, c.id, { ownerId: c.gvMon, ownerCu: gvcn() })) === 400, 'QL (case.approve) → 400 ngoài ứng viên');
  }));
}
