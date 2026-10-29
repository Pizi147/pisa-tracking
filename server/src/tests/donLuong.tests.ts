/**
 * PHÉP KIỂM DON-LUONG (kế hoạch 2026-10-30-don.md · PR DON-LUONG): luồng còn sót ra-luong K6 · K8 · K14 · K23 · K39b · K42a + OV-11 A6 · A8
 * + chủ SP 30/10 câu 1 (dòng "đã vắng · khôi phục" ở hồ sơ lượt).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runDonLuongTests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  console.log('\nDON-LUONG · Luồng còn sót');
  const att: any = await import('../fasttrack/attempts.ts');
  const week: any = await import('../platform/week.ts');
  const mig: any = await import('../migrate/donLuong.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const NOW = new Date().toISOString();
  const cong7 = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) + 7 * 864e5).toISOString().slice(0, 10);

  /* ---------------------------------------------------------------- K6 */
  /** Lượt Mock của lớp FT đang học, đủ 4 kỹ năng ở tuần kế hoạch, chưa có ô điểm nào. */
  const luotFt = () => one(
    `SELECT a.id, a.class_id, a.planned_period_id AS w FROM assessment_attempts a JOIN classes c ON c.id = a.class_id AND c.is_fast_track = 1 AND c.status = 'active'
      WHERE a.kind = 'mock' AND a.status != 'cancelled' AND a.planned_period_id IS NOT NULL
        AND (SELECT COUNT(*) FROM attempt_skills k WHERE k.attempt_id = a.id AND k.required = 1 AND k.planned_period_id = a.planned_period_id) = 4
        AND NOT EXISTS (SELECT 1 FROM assessment_scores sc WHERE sc.attempt_id = a.id)
      ORDER BY a.id LIMIT 1`);
  /** Dời các kỹ năng `mon` sang tuần sau vì vắng (dấu "-" ở tuần gốc, đã chốt); dời đủ 4 → tuần của lượt cũng dời. */
  const doiVang = (a: any, mon: string[]) => {
    const w3 = week.ensurePeriod(cong7(one('SELECT week_start FROM report_periods WHERE id = ?', a.w).week_start)).id as number;
    const o: Record<string, string[]> = { listening: ['listening'], reading: ['reading'], writing: ['writing1', 'writing2'], speaking: ['speaking'] };
    for (const k of mon) {
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled' WHERE attempt_id = ? AND skill = ?`).run(w3, a.id, k);
      for (const s of o[k]) {
        conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, no_show_period_id, no_show_at, no_show_settled_at) VALUES (?,?,?,?,?)`).run(a.id, s, a.w, NOW, NOW);
      }
    }
    if (mon.length === 4) conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ? WHERE id = ?`).run(w3, a.id);
    return w3;
  };
  const hang = (a: any, w: number) => att.classScoreSheet(P.mbManager, a.class_id, w).rows.filter((r: any) => r.attemptId === a.id);

  check('K6 · migrate chỉ mục hai lần không lỗi', () => {
    mig.migrateDonLuong(conn, []); mig.migrateDonLuong(conn, []);
    assert(!!one(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_scores_no_show'`), 'có chỉ mục');
  });
  check('K6 · em dời đủ 4 kỹ năng vì vắng: lưới tuần gốc VẪN có hàng em; tuần mới vẫn có hàng', () => thu(() => {
    const a = luotFt();
    assert(a, 'seed cần một lượt Mock FT đủ 4 kỹ năng chưa có điểm');
    const w3 = doiVang(a, ['listening', 'reading', 'writing', 'speaking']);
    assert(hang(a, a.w).length === 1, `tuần gốc: ${hang(a, a.w).length} hàng`);
    assert(hang(a, w3).length === 1, 'tuần mới giữ hàng');
  }));
  check('K6 · em dời một phần: một hàng (không trùng) ở tuần gốc', () => thu(() => {
    const a = luotFt();
    doiVang(a, ['writing']);
    assert(hang(a, a.w).length === 1, `${hang(a, a.w).length} hàng`);
  }));
  /* ---------------------------------------------------------------- K8 */
  const owner: any = await import('../cases/owner.ts');
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  let seq = 0;
  const gv = () => accounts.createAccount(P.admin, {
    email: `donluong.${++seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-donluong', fullName: `Thử DL ${seq}`, roles: [{ role: 'teacher', branches: ['MB'] }],
  }).userId as number;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const lopMoi = (code: string, ds: [number, string | null][]) => {
    const start = week.mondayOf(t.TODAY);
    const id = intake.createClass(P.admin, { code, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;
    for (const [u, k] of ds) conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,'2026-01-01','active',?)`).run(u, id, k, k === null ? 1 : 0, NOW);
    return id;
  };
  /** Case Listening đang mở có chủ của một em đang học (seed). */
  const caseL = () => one(
    `SELECT sc.id, sc.owner_user_id, e.student_id, e.class_id FROM sos_cases sc JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active'
      JOIN students s ON s.id = sc.student_id AND s.status = 'active' AND s.archived_at IS NULL
      WHERE sc.status != 'done' AND sc.tam = 0 AND sc.category = 'listening' AND sc.owner_user_id IS NOT NULL ORDER BY sc.id LIMIT 1`);
  const chuyen = (sid: number, lop: number) => {
    conn.prepare(`UPDATE enrollments SET class_id = ? WHERE student_id = ? AND status = 'active'`).run(lop, sid);
    owner.ganChuCaseThieu({ studentIds: [sid], actorId: P.mbManager.userId, luc: NOW });
  };
  check('K8 · chuyển em sang lớp không có GV L: Case L của GV cũ → GVCN lớp mới (lịch sử + báo); lớp mới có GV L → về GV đó; chuyển lại lớp cũ → chủ cũ', () => thu(() => {
    const c = caseL();
    assert(c, 'seed cần Case Listening mở có chủ');
    const [gCn, gL] = [gv(), gv()];
    const khongL = lopMoi('MB DL-K8-A', [[gCn, null], [gCn, 'reading']]);
    chuyen(c.student_id, khongL);
    assert(one('SELECT owner_user_id FROM sos_cases WHERE id = ?', c.id).owner_user_id === gCn, 'GVCN lớp mới');
    assert(one(`SELECT COUNT(*) n FROM sos_case_history WHERE case_id = ? AND field = 'owner_user_id' AND new_value = ?`, c.id, String(gCn)).n === 1, 'lịch sử');
    assert(one(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key = ?`, gCn, `case_giao:${c.id}`).n === 1, 'báo người nhận');
    const coL = lopMoi('MB DL-K8-B', [[gCn, null], [gL, 'listening']]);
    chuyen(c.student_id, coL);
    assert(one('SELECT owner_user_id FROM sos_cases WHERE id = ?', c.id).owner_user_id === gL, 'GV L lớp mới');
    chuyen(c.student_id, c.class_id);
    const ve = one('SELECT owner_user_id FROM sos_cases WHERE id = ?', c.id).owner_user_id;
    assert(ve === c.owner_user_id || one(`SELECT 1 FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill = 'listening' AND status = 'active'`, c.class_id, ve), `về lớp cũ: ${ve}`);
  }));
  check('K8 · chủ Case vẫn dạy kỹ năng đó ở lớp mới → giữ nguyên (không lịch sử)', () => thu(() => {
    const c = caseL();
    const lop = lopMoi('MB DL-K8-C', [[gv(), null], [c.owner_user_id, 'listening']]);
    const truoc = one(`SELECT COUNT(*) n FROM sos_case_history WHERE case_id = ?`, c.id).n;
    chuyen(c.student_id, lop);
    assert(one('SELECT owner_user_id FROM sos_cases WHERE id = ?', c.id).owner_user_id === c.owner_user_id, 'giữ chủ');
    assert(one(`SELECT COUNT(*) n FROM sos_case_history WHERE case_id = ?`, c.id).n === truoc, 'không lịch sử');
  }));

  /* ---------------------------------------------------------------- K23 */
  const vp: any = await import('../yThuc/violations.ts');
  check('K23 · ghi vi phạm em Tạm dừng / em đã chuyển khỏi lớp: 400 nói lý do + bước tiếp', () => thu(() => {
    /* Em đang học ở lớp chi nhánh MB (QL MB ghi được — chỉ còn chặn vì không có lớp đang học). */
    const c = one(`SELECT e.student_id, e.class_id FROM enrollments e JOIN classes c ON c.id = e.class_id AND c.branch_id = ? JOIN students s ON s.id = e.student_id
      AND s.status = 'active' AND s.archived_at IS NULL WHERE e.status = 'active' ORDER BY e.id LIMIT 1`, MB);
    const lop = one(`SELECT code FROM classes WHERE id = ?`, c.class_id).code;
    const ghi = () => { try { vp.recordViolation(P.mbManager, { studentId: c.student_id, ten: 'Đi muộn', occurredOn: t.TODAY }); return null; } catch (e: any) { return e; } };
    conn.prepare(`UPDATE enrollments SET status = 'paused' WHERE student_id = ? AND status = 'active'`).run(c.student_id);
    xoaNho();
    const e1 = ghi();
    assert(e1?.status === 400 && e1.message === 'Em đang tạm dừng — Quay lại học trước khi ghi vi phạm.', `${e1?.status} ${e1?.message}`);
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE student_id = ? AND status = 'paused'`).run(c.student_id);
    xoaNho();
    const e2 = ghi();
    assert(e2?.status === 400 && e2.message === `Em đã chuyển khỏi ${lop} — ghi ở lớp em đang học.`, `${e2?.status} ${e2?.message}`);
  }));

  /* ---------------------------------------------------------------- K42a + A6 */
  const tb: any = await import('../platform/thongBao.ts');
  const thongBao = (u: number, kind: string, o: { doc?: boolean; entity?: [string, number] } = {}) => Number(conn.prepare(
    `INSERT INTO notifications (user_id, kind, title, entity_type, entity_id, dedup_key, created_at, read_at) VALUES (?,?,?,?,?,?,?,?)`,
  ).run(u, kind, `Thử ${kind}`, o.entity?.[0] ?? null, o.entity?.[1] ?? null, `dl:${kind}:${Math.random()}`, NOW, o.doc ? NOW : null).lastInsertRowid);
  check('K42a · 60 thông báo mới + 1 "Cần làm" đã đọc cũ → dòng Cần làm vẫn trong chuông (xếp sau); tổng ≤ 70 dòng', () => thu(() => {
    const c = caseL();
    const u = c.owner_user_id as number;
    conn.prepare(`UPDATE case_interventions SET status = 'cancelled' WHERE case_id = ?`).run(c.id);   // Case giao còn việc = chưa có PA
    const cu = thongBao(u, 'case_giao', { doc: true, entity: ['sos_case', c.id] });
    for (let i = 0; i < 60; i++) thongBao(u, 'thu_moi');
    const ds = tb.thongBaoCua(u);
    const dong = ds.find((r: any) => r.id === cu);
    assert(dong && dong.con_viec === 1 && ds.length <= tb.THONG_BAO_TOI_DA + tb.CAN_LAM_DA_DOC_THEM && ds.indexOf(dong) >= tb.THONG_BAO_TOI_DA, `có ${!!dong} · ${ds.length} dòng · vị trí ${ds.indexOf(dong)}`);
  }));
  check('A6 · docNhieu: chỉ đánh dấu dòng của người gọi (id người khác bỏ qua, không lỗi); > 200 id hoặc id sai → 400', () => thu(() => {
    const [u, v] = [gv(), gv()];
    const a = thongBao(u, 'thu_a'), b = thongBao(u, 'thu_b'), khac = thongBao(v, 'thu_khac');
    assert(tb.docNhieu(u, [a, b, khac], t.TODAY) === 2, 'đánh dấu 2 dòng của u');
    assert(one('SELECT read_at FROM notifications WHERE id = ?', khac).read_at === null, 'dòng người khác giữ chưa đọc');
    for (const sai of [Array.from({ length: 201 }, (_, i) => i + 1), [], ['x'], [0]]) {
      let e: any = null; try { tb.docNhieu(u, sai, t.TODAY); } catch (x: any) { e = x; }
      assert(e?.status === 400, `ids ${JSON.stringify(sai).slice(0, 20)} → ${e?.status}`);
    }
  }));

  check('K6 · câu tìm dấu "-" theo tuần đi chỉ mục idx_scores_no_show', () => {
    const plan = all(`EXPLAIN QUERY PLAN SELECT sc.attempt_id FROM assessment_scores sc WHERE sc.no_show_period_id = ?`, 1).map((r) => r.detail).join(' | ');
    assert(/idx_scores_no_show/.test(plan), plan);
  });
}
