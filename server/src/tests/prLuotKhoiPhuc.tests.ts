/**
 * PHÉP KIỂM LUOT-KHOI-PHUC — khôi phục lượt Test lớp thường đã huỷ (luật "không khoá cứng"), cùng đường `reopenAttempt` (POST /attempts/:id/reopen) với FT:
 *   quyền = ATTEMPT_CANCEL như FT (GV → 403) · khôi phục ghi lịch sử 'reopened' + audit 'attempt.khoi_phuc', lượt về chưa huỷ, câu "Điểm trước khi huỷ xem ở Lịch sử."
 *   · chặn rõ lý do + bước tiếp (400, không ghi gì): em không còn học lớp · đã có bài cùng loại khác · lớp đã kết thúc · khôi phục hai lần.
 *   `GET /regular/attempts/:id` trả `khoiPhuc.chan` = đúng câu chặn của máy chủ (một hàm). Mỗi ca cuộn lại (`thu`).
 */
export async function runPrLuotKhoiPhucTests(t: any) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const regular: any = await import('../normal/regular.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLUOT-KHOI-PHUC · khôi phục lượt Test lớp thường đã huỷ');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const loi = (fn: () => unknown): { status: number | string; msg: string } => {
    try { fn(); return { status: 'không ném', msg: '' }; } catch (e: any) { return { status: e?.status ?? '?', msg: String(e?.message ?? e) }; }
  };
  const LOP = classId('MB FOU 12');
  /** Một Progress Test của em còn học lớp, huỷ bằng đúng hàm huỷ (QL). */
  const luotHuy = () => {
    const l = get(`SELECT a.id, a.student_id, a.cycle_id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.archived_at IS NULL
       JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
      WHERE a.class_id = ? AND a.kind = 'progress' AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`, LOP);
    assert(l, 'demo phải có Progress Test ở MB FOU 12');
    attempts.huyLuot(P.mbManager, l.id, { lyDo: 'Thử huỷ LKP' });
    xoaNho();
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', l.id).status === 'cancelled', 'huỷ phải thành cancelled');
    return l;
  };
  const soLichSu = (id: number) => get('SELECT COUNT(*) n FROM attempt_schedule_history WHERE attempt_id = ?', id).n;

  check('LKP-1 · QL khôi phục lượt thường đã huỷ: hết huỷ, lịch sử "reopened" (Khôi phục Progress Test), audit attempt.khoi_phuc, câu "Điểm trước khi huỷ xem ở Lịch sử."', () => thu(() => {
    const l = luotHuy();
    const truoc = regular.regularAttemptDetail(P.mbManager, l.id);
    assert(truoc.huy && truoc.khoiPhuc && truoc.khoiPhuc.chan === null, `trước: huy ${JSON.stringify(truoc.huy)}, khoiPhuc ${JSON.stringify(truoc.khoiPhuc)}`);
    const r = attempts.reopenAttempt(P.mbManager, l.id);
    xoaNho();
    assert(r.ok && r.cau.includes('Điểm trước khi huỷ xem ở Lịch sử.'), `kết quả: ${JSON.stringify(r)}`);
    const sau = regular.regularAttemptDetail(P.mbManager, l.id);
    assert(sau.dong.status !== 'cancelled' && sau.huy === null && sau.khoiPhuc === null, `sau: ${sau.dong.status} ${JSON.stringify(sau.huy)}`);
    assert(sau.history[0].action === 'reopened' && sau.history[0].reason === 'Khôi phục Progress Test' && sau.history[0].actorName === P.mbManager.fullName,
      `lịch sử: ${JSON.stringify(sau.history[0])}`);
    const au = get(`SELECT * FROM audit_logs WHERE action = 'attempt.khoi_phuc' AND entity_id = ? ORDER BY id DESC LIMIT 1`, l.id);
    assert(au && au.actor_user_id === P.mbManager.userId, `audit: ${JSON.stringify(au)}`);
    /* Ô mở lại cho người nhập (lượt không còn khoá) — QL nhập được ít nhất một môn. */
    assert(sau.dong.skillSchedule.some((s: any) => s.canEdit), 'khôi phục xong phải nhập lại được');
  }));

  check('LKP-2 · quyền như FT (ATTEMPT_CANCEL): GV môn → 403, QL chi nhánh khác → 403; lượt vẫn huỷ, không thêm lịch sử', () => thu(() => {
    const l = luotHuy();
    const n = soLichSu(l.id);
    for (const p of [P.normalSubjectTeacher, P.cpManager]) {
      const e = loi(() => attempts.reopenAttempt(p, l.id));
      assert(e.status === 403, `${p.fullName}: ${e.status} ${e.msg}`);
    }
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', l.id).status === 'cancelled' && soLichSu(l.id) === n, 'bị chặn thì không đổi gì');
  }));

  check('LKP-3 · em không còn học lớp → 400 nói lý do + lớp nay + bước tiếp; khoiPhuc.chan cùng câu; không đổi gì', () => thu(() => {
    const l = luotHuy();
    const moi = get(`SELECT id, code FROM classes WHERE id != ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) AND status != 'finished' ORDER BY id LIMIT 1`, LOP, LOP);
    conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ? WHERE student_id = ? AND class_id = ? AND status = 'active'`).run(TODAY, l.student_id, LOP);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(l.student_id, moi.id, TODAY, TODAY);
    xoaNho();
    const n = soLichSu(l.id);
    const e = loi(() => attempts.reopenAttempt(P.mbManager, l.id));
    assert(e.status === 400 && e.msg.includes('không còn học') && e.msg.includes(`nay ${moi.code}`) && e.msg.includes('lớp đang học'), `câu chặn: ${e.status} ${e.msg}`);
    assert(regular.regularAttemptDetail(P.mbManager, l.id).khoiPhuc.chan === e.msg, 'hộp và máy chủ cùng một câu');
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', l.id).status === 'cancelled' && soLichSu(l.id) === n, 'bị chặn thì không đổi gì');
  }));

  check('LKP-4 · em đã có Progress Test khác chưa huỷ (cùng lộ trình) → 400 "đã có … đang dùng"', () => thu(() => {
    const l = luotHuy();
    conn.prepare(`INSERT INTO assessment_attempts (student_id, cycle_id, class_id, kind, attempt_no, status, created_at, updated_at)
      VALUES (?, ?, ?, 'progress', 99, 'planned', ?, ?)`).run(l.student_id, l.cycle_id, LOP, TODAY, TODAY);
    const e = loi(() => attempts.reopenAttempt(P.mbManager, l.id));
    assert(e.status === 400 && e.msg.includes('đã có Progress Test khác'), `câu chặn: ${e.status} ${e.msg}`);
  }));

  check('LKP-5 · lớp đã kết thúc → 400 "đã kết thúc"; khôi phục hai lần → lần sau 400 (không ghi lịch sử thứ hai)', () => thu(() => {
    const l = luotHuy();
    attempts.reopenAttempt(P.mbManager, l.id);
    xoaNho();
    const n = soLichSu(l.id);
    const e2 = loi(() => attempts.reopenAttempt(P.mbManager, l.id));
    assert(e2.status === 400 && soLichSu(l.id) === n, `lần hai: ${e2.status} ${e2.msg}`);
    attempts.huyLuot(P.mbManager, l.id, { lyDo: 'Huỷ lại' });
    conn.prepare(`UPDATE classes SET status = 'finished' WHERE id = ?`).run(LOP);
    xoaNho();
    const e = loi(() => attempts.reopenAttempt(P.mbManager, l.id));
    assert(e.status === 400 && e.msg.includes('đã kết thúc'), `lớp kết thúc: ${e.status} ${e.msg}`);
  }));

  check('LKP-6 · em đã lưu trữ / kết thúc học → 400 "bỏ lưu trữ trước"; khoiPhuc.chan cùng câu; em Tạm dừng (chưa lưu trữ) vẫn khôi phục được', () => {
    for (const [sua, chan] of [[`status = 'finished'`, true], [`archived_at = '${TODAY}'`, true], [`status = 'inactive'`, false]] as const) thu(() => {
      const l = luotHuy();
      conn.prepare(`UPDATE students SET ${sua} WHERE id = ?`).run(l.student_id);
      xoaNho();
      const e = loi(() => attempts.reopenAttempt(P.mbManager, l.id));
      if (chan) {
        assert(e.status === 400 && e.msg.includes('Em đã lưu trữ / kết thúc học') && e.msg.includes('bỏ lưu trữ trước'), `${sua}: ${e.status} ${e.msg}`);
        assert(regular.regularAttemptDetail(P.mbManager, l.id).khoiPhuc.chan === e.msg, `${sua}: hộp và máy chủ cùng một câu`);
      } else assert(e.status === 'không ném', `${sua}: Tạm dừng phải khôi phục được — ${e.status} ${e.msg}`);
    });
  });
}
