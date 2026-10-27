/**
 * PHÉP KIỂM HSL-MAY-CHU (M4 PR 1, kế hoạch 2026-10-27-m4-code.md) — dữ liệu cho trang hồ sơ một lượt Test:
 *   (1) `GET /attempts/:id` (FT) trả `sEx` = lượt S Ex của em trong các tuần của lượt (chỉ đọc) + `lopHienTai` khi em đã rời lớp của lượt;
 *   (2) `GET /regular/attempts/:id` = đúng MỘT dòng của `regularSheet` (cùng hàm) + lịch sử lịch / điểm + người nhập từng môn + quyền;
 *       ngoài lớp → 403, lượt FT / không có → 404; lượt đã huỷ vẫn mở, không ô nào sửa được;
 *   (3) lượt lớp thường mới ghi dòng 'created' ở lịch sử lịch (như FT). Mỗi ca cuộn lại (`thu`).
 */
export async function runPrHslMayChuTests(t: any) {
  const { check, assert, conn, P, classId, TODAY, addDays } = t;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const regular: any = await import('../normal/regular.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { mondayOf } = await import('../platform/week.ts');
  console.log('\nHSL-MAY-CHU · hồ sơ một lượt Test: S Ex + lớp hiện tại (FT) · GET /regular/attempts/:id · lịch sử tạo lượt thường');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const LOP_FT = classId('MB FT 101');
  const LOP = classId('MB FOU 12');
  const luotFt = () => get(`SELECT a.id, a.student_id FROM assessment_attempts a JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.planned_period_id IS NOT NULL ORDER BY a.id LIMIT 1`, LOP_FT);
  /* Em còn học lớp (phép kiểm chạy trước có thể đã chuyển em khỏi lớp mà không cuộn lại). */
  const luotThuong = (coDiem = false) => get(`SELECT a.id, a.student_id, a.kind FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.archived_at IS NULL
     JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.class_id = ? AND a.kind = 'progress' AND a.status != 'cancelled'
       ${coDiem ? 'AND EXISTS (SELECT 1 FROM assessment_scores x WHERE x.attempt_id = a.id AND x.raw_score IS NOT NULL)' : ''} ORDER BY a.id LIMIT 1`, LOP);
  const themSEx = (sid: number, tuan: string, diem: number, cham: number) => Number(conn.prepare(
    `INSERT INTO s_expert (student_id, tuan, diem, nhan_xet, cham_boi, cham_luc, them_boi, them_luc) VALUES (?,?,?,?,?,?,?,?)`,
  ).run(sid, tuan, diem, 'Fluency tốt', cham, TODAY, P.mbManager.userId, TODAY).lastInsertRowid);

  check('HSLM-1 · FT: sEx = lượt S Ex của em trong tuần của lượt (điểm, GV, tuần); tuần khác / đã xoá không hiện; em không có → []', () => thu(() => {
    const l = luotFt();
    assert(l, 'demo phải có lượt Mock đang học ở MB FT 101');
    conn.prepare('DELETE FROM s_expert WHERE student_id = ?').run(l.student_id);
    const truoc = attempts.attemptDetail(P.mbManager, l.id);
    assert(Array.isArray(truoc.sEx) && truoc.sEx.length === 0, `chưa có S Ex → [], được ${JSON.stringify(truoc.sEx)}`);
    const tuan = mondayOf(truoc.skillSchedule.find((r: any) => r.weekStart).weekStart);
    const id = themSEx(l.student_id, tuan, 6.5, P.sTeacher.userId);
    themSEx(l.student_id, addDays(tuan, 70), 7, P.sTeacher.userId);
    const xoa = themSEx(l.student_id, tuan, 5, P.sTeacher.userId);
    conn.prepare('UPDATE s_expert SET xoa_luc = ? WHERE id = ?').run(TODAY, xoa);
    const d = attempts.attemptDetail(P.mbManager, l.id);
    assert(d.sEx.length === 1 && d.sEx[0].id === id, `chỉ lượt cùng tuần, còn: ${JSON.stringify(d.sEx)}`);
    const ten = get('SELECT full_name n FROM users WHERE id = ?', P.sTeacher.userId).n;
    assert(d.sEx[0].diem === 6.5 && d.sEx[0].nguoiCham === ten && d.sEx[0].tuan === tuan && d.sEx[0].loai === 's-ex', `dòng S Ex: ${JSON.stringify(d.sEx[0])}`);
    /* Chỉ đọc, ngoài Overall: kết quả lượt không đổi. */
    assert(JSON.stringify(d.result) === JSON.stringify(truoc.result), 'S Ex không được đổi kết quả lượt');
  }));

  check('HSLM-2 · FT: lopHienTai null khi em còn ở lớp của lượt; đã chuyển lớp → { id, code } lớp mới (classCode vẫn là lớp lúc Test)', () => thu(() => {
    const l = luotFt();
    assert(attempts.attemptDetail(P.mbManager, l.id).lopHienTai === null, 'cùng lớp → null');
    const moi = get(`SELECT id, code FROM classes WHERE id != ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) AND status != 'finished' ORDER BY id LIMIT 1`, LOP_FT, LOP_FT);
    conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ? WHERE student_id = ? AND class_id = ? AND status = 'active'`).run(TODAY, l.student_id, LOP_FT);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(l.student_id, moi.id, TODAY, TODAY);
    const d = attempts.attemptDetail(P.mbManager, l.id);
    assert(d.lopHienTai && d.lopHienTai.id === moi.id && d.lopHienTai.code === moi.code, `lopHienTai: ${JSON.stringify(d.lopHienTai)}`);
    assert(d.classId === LOP_FT, 'lớp của lượt giữ nguyên = lớp lúc Test');
  }));

  check('HSLM-3 · /regular/attempts/:id: `dong` = đúng dòng của regularSheet (QL và GVBM — cùng quyền canEdit); kèm lớp, chương trình, ngưỡng', () => {
    const l = luotThuong();
    assert(l, 'demo phải có Progress Test ở MB FOU 12');
    for (const p of [P.mbManager, P.normalSubjectTeacher, P.normalCoreTeacher]) {
      const d = regular.regularAttemptDetail(p, l.id);
      const dongBang = regular.regularSheet(p, LOP, 'progress').rows.find((r: any) => r.attemptId === l.id);
      assert(JSON.stringify(d.dong) === JSON.stringify(dongBang), `dòng khác bảng lớp (${p.fullName}):\n${JSON.stringify(d.dong)?.slice(0, 400)}\n${JSON.stringify(dongBang)?.slice(0, 400)}`);
      assert(d.class.id === LOP && d.passThreshold === regular.nguongDatLop(LOP) && d.skillLabels && d.programme.code, `đầu trang: ${JSON.stringify(d.class)}`);
    }
  });

  check('HSLM-4 · /regular/attempts/:id: người nhập từng môn (`nguoiNhap`), lịch sử lịch (`history`) + điểm (`scoreHistory`) của lượt', () => thu(() => {
    const l = luotThuong(true);
    assert(l, 'demo phải có Progress Test đã có điểm ở MB FOU 12');
    const o = get('SELECT skill FROM assessment_scores WHERE attempt_id = ? AND raw_score IS NOT NULL ORDER BY id LIMIT 1', l.id);
    conn.prepare('UPDATE assessment_scores SET entered_by = ? WHERE attempt_id = ? AND skill = ?').run(P.normalSubjectTeacher.userId, l.id, o.skill);
    conn.prepare(`INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(l.id, 'skill_week_moved', o.skill, 'W2 SEP', 'W3 SEP', 'Thử', P.mbManager.userId, TODAY);
    const d = regular.regularAttemptDetail(P.mbManager, l.id);
    const mon = d.dong.skillSchedule.find((x: any) => x.skill === o.skill);
    assert(mon.nguoiNhap === P.normalSubjectTeacher.fullName, `người nhập ${o.skill}: ${mon.nguoiNhap}`);
    const trong = d.dong.skillSchedule.find((x: any) => !get('SELECT 1 c FROM assessment_scores WHERE attempt_id = ? AND skill = ? AND raw_score IS NOT NULL', l.id, x.skill));
    if (trong) assert(trong.nguoiNhap === null, `môn chưa điểm → nguoiNhap null, được ${trong.nguoiNhap}`);
    const soLich = get('SELECT COUNT(*) n FROM attempt_schedule_history WHERE attempt_id = ?', l.id).n;
    assert(d.history.length === soLich && d.history[0].action === 'skill_week_moved' && d.history[0].actorName === P.mbManager.fullName,
      `history: ${JSON.stringify(d.history.slice(0, 2))} (bảng có ${soLich})`);
    assert(JSON.stringify(d.scoreHistory) === JSON.stringify(attempts.scoreHistoryOf(l.id)), 'scoreHistory = scoreHistoryOf của lượt');
  }));

  check('HSLM-5 · /regular/attempts/:id: QL chi nhánh khác → 403; lượt FT / MT0 / id không có → 404', () => {
    const l = luotThuong();
    assert(maLoi(() => regular.regularAttemptDetail(P.cpManager, l.id)) === 403, 'QL CP xem lượt MB → 403');
    assert(maLoi(() => regular.regularAttemptDetail(P.mbManager, luotFt().id)) === 404, 'lượt FT → 404');
    const mt0 = get(`SELECT id FROM assessment_attempts WHERE kind = 'mt0' ORDER BY id LIMIT 1`);
    if (mt0) assert(maLoi(() => regular.regularAttemptDetail(P.mbManager, mt0.id)) === 404, 'MT0 → 404');
    assert(maLoi(() => regular.regularAttemptDetail(P.mbManager, 99_999_999)) === 404, 'id không có → 404');
  });

  check('HSLM-6 · /regular/attempts/:id: lượt đã huỷ vẫn mở (status cancelled, `huy`), không ô nào nhập / nhận xét / đổi lịch / gỡ dấu được', () => thu(() => {
    const l = luotThuong(true);
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(l.id);
    conn.prepare(`INSERT INTO attempt_schedule_history (attempt_id, action, reason, actor_user_id, created_at) VALUES (?, 'cancelled', 'Thử huỷ', ?, ?)`)
      .run(l.id, P.mbManager.userId, TODAY);
    const d = regular.regularAttemptDetail(P.mbManager, l.id);
    assert(d.dong.status === 'cancelled', `status: ${d.dong.status}`);
    assert(d.huy && d.huy.lyDo === 'Thử huỷ' && d.huy.ai === P.mbManager.fullName, `huy: ${JSON.stringify(d.huy)}`);
    const mo = d.dong.skillSchedule.filter((x: any) => x.canEdit || x.nhanXetDuoc || x.doiLich || x.goDau);
    assert(mo.length === 0, `lượt huỷ còn ô mở: ${JSON.stringify(mo.map((x: any) => x.skill))}`);
  }));

  check('HSLM-7 · /regular/attempts/:id: lopHienTai như FT (null cùng lớp; đã chuyển lớp → lớp mới, `class` vẫn là lớp lúc Test)', () => thu(() => {
    const l = luotThuong();
    assert(regular.regularAttemptDetail(P.mbManager, l.id).lopHienTai === null, 'cùng lớp → null');
    const moi = get(`SELECT id, code FROM classes WHERE id != ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) AND status != 'finished' ORDER BY id LIMIT 1`, LOP, LOP);
    conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ? WHERE student_id = ? AND class_id = ? AND status = 'active'`).run(TODAY, l.student_id, LOP);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(l.student_id, moi.id, TODAY, TODAY);
    const d = regular.regularAttemptDetail(P.mbManager, l.id);
    assert(d.lopHienTai?.id === moi.id && d.lopHienTai.code === moi.code && d.class.id === LOP, `lopHienTai: ${JSON.stringify(d.lopHienTai)}`);
  }));

  check('HSLM-8 · lượt lớp thường mới (QL xếp — planRegularTests; em vào lớp — taoBaiThuongMacDinh) ghi dòng lịch sử "created" như FT', () => thu(() => {
    const br = get('SELECT branch_id b FROM classes WHERE id = ?', LOP).b;
    const taoEm = (ma: string) => {
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(ma, `Học viên ${ma}`, `hoc vien ${ma.toLowerCase()}`, br, TODAY).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, LOP, TODAY, TODAY);
      return sid;
    };
    const tao = (sid: number) => get(`SELECT h.action, h.new_value, h.actor_user_id FROM attempt_schedule_history h JOIN assessment_attempts a ON a.id = h.attempt_id
       WHERE a.student_id = ? AND h.action = 'created'`, sid);
    const s1 = taoEm('PISA-HSL-1');
    regular.planRegularTests(P.mbManager, LOP, { studentIds: [s1], kinds: ['final'] });
    const h1 = tao(s1);
    assert(h1 && h1.new_value && h1.actor_user_id === P.mbManager.userId, `planRegularTests: ${JSON.stringify(h1)}`);
    const s2 = taoEm('PISA-HSL-2');
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, status, started_at, created_at) VALUES (?, 1, 'active', ?, ?)`).run(s2, TODAY, TODAY).lastInsertRowid);
    const ids = regular.taoBaiThuongMacDinh([cy], null, addDays(TODAY, -400));
    if (ids.length) assert(tao(s2)?.new_value, `taoBaiThuongMacDinh tạo ${ids.length} lượt mà không có dòng created`);
    else console.log('    (HSL-8: lớp không còn mốc chưa qua — bỏ nhánh taoBaiThuongMacDinh)');
  }));
}
