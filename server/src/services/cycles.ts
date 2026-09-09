import { db, tx } from '../db.ts';
import {
  BASELINE_SOURCES, CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL, PERMISSIONS, type Route,
} from '../../../shared/domain.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from './audit.ts';

/**
 * Lộ trình học của một học viên.
 *
 * Học tiếp hoặc học lại TRONG cùng lộ trình: số MT tăng tiếp, target giữ nguyên, nên từ
 * MT3 trở đi kỳ vọng luôn bằng target. Chỉ khi sang lộ trình mới (LT1 → LT2) mới đánh số
 * lại từ MT1, vì lúc đó học viên đã có target mới.
 */
export function cyclesOf(studentId: number) {
  return db()
    .prepare('SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq')
    .all(studentId) as any[];
}

export function currentCycle(studentId: number) {
  return (db()
    .prepare(`SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY (status = 'active') DESC, seq DESC LIMIT 1`)
    .get(studentId) as any) ?? null;
}

export function cycleById(id: number) {
  return (db().prepare('SELECT * FROM learning_cycles WHERE id = ?').get(id) as any) ?? null;
}

/** Số MT tiếp theo TRONG lộ trình. Học lại cùng lộ trình thì số này tăng tiếp. */
export function nextAttemptNo(cycleId: number): number {
  const row = db()
    .prepare('SELECT MAX(attempt_no) AS n FROM assessment_attempts WHERE cycle_id = ?')
    .get(cycleId) as any;
  return (row?.n ?? 0) + 1;
}

export function createCycle(p: Principal, input: {
  studentId: number; route?: Route | null; targetScore?: number | null;
  examDate?: string | null; startedAt?: string; note?: string | null;
}) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: input.studentId },
    'Bạn không có quyền mở lộ trình mới cho học viên này.');
  const conn = db();
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  if (input.examDate && !isIsoDate(input.examDate)) throw badRequest('Ngày thi IELTS không hợp lệ.');
  const startedAt = input.startedAt ?? nowIso().slice(0, 10);
  if (!isIsoDate(startedAt)) throw badRequest('Ngày bắt đầu không hợp lệ.');

  return tx(() => {
    const seq = ((conn.prepare('SELECT MAX(seq) AS n FROM learning_cycles WHERE student_id = ?')
      .get(input.studentId) as any)?.n ?? 0) + 1;
    // Lộ trình cũ khép lại, nhưng KHÔNG xoá dữ liệu nào của nó.
    conn.prepare(`UPDATE learning_cycles SET status='completed', ended_at=? WHERE student_id=? AND status='active'`)
      .run(startedAt, input.studentId);
    const info = conn
      .prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, target_score, exam_date, started_at, status, note, created_at)
         VALUES (?,?,?,?,?,?, 'active', ?, ?)`,
      )
      .run(input.studentId, seq, input.route ?? null, input.targetScore ?? null,
           input.examDate ?? null, startedAt, input.note ?? null, nowIso());
    const id = Number(info.lastInsertRowid);
    addJourney({
      studentId: input.studentId, eventType: 'cycle_start', eventDate: startedAt,
      title: `Bắt đầu lộ trình ${input.route ?? `#${seq}`}`,
      detail: input.targetScore ? `Target ${input.targetScore}` : null,
      refTable: 'learning_cycles', refId: id, createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'cycle.create', entityType: 'learning_cycle', entityId: id,
      entityLabel: `${student.student_code} · ${input.route ?? seq}`, after: input });
    return conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(id);
  });
}

export function updateCycle(p: Principal, cycleId: number, patch: any) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: c.student_id });
  const map: Record<string, string> = {
    targetScore: 'target_score', examDate: 'exam_date', route: 'route', note: 'note', status: 'status',
  };
  const sets: string[] = []; const params: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k]) continue;
    if (k === 'examDate' && v && !isIsoDate(String(v))) throw badRequest('Ngày thi IELTS không hợp lệ.');
    sets.push(`${map[k]} = ?`); params.push(v);
  }
  if (!sets.length) return c;
  params.push(cycleId);
  db().prepare(`UPDATE learning_cycles SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  const after = cycleById(cycleId);
  // Đổi ngày thi IELTS là sự kiện đáng ghi vào hành trình học.
  if (patch.examDate !== undefined && patch.examDate !== c.exam_date) {
    addJourney({
      studentId: c.student_id, eventType: 'exam_date_changed', eventDate: String(patch.examDate ?? nowIso().slice(0, 10)),
      title: 'Đổi ngày thi IELTS chính thức',
      detail: `${c.exam_date ?? 'chưa có'} → ${patch.examDate ?? 'chưa có'}`,
      refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId,
    });
  }
  writeAudit({ actorUserId: p.userId, action: 'cycle.update', entityType: 'learning_cycle', entityId: cycleId,
    before: c, after });
  return after;
}

/**
 * Lộ trình đang chạy TẠI MỘT NGÀY, dùng cho các bản ghi ghi bù.
 *
 * Một quan sát của ngày 20/07 thuộc về lộ trình đang chạy hôm 20/07, không thuộc lộ trình
 * mở hôm nay. Không có lộ trình nào phủ ngày đó thì để trống — gán bừa vào lộ trình hiện
 * tại là làm sai lịch sử một cách khó phát hiện.
 */
export function cycleForDate(studentId: number, date: string) {
  return (db()
    .prepare(
      `SELECT * FROM learning_cycles
        WHERE student_id = ? AND started_at <= ? AND (ended_at IS NULL OR ended_at >= ?)
        ORDER BY (status = 'active') DESC, seq DESC LIMIT 1`,
    )
    .get(studentId, date, date) as any) ?? null;
}

/**
 * ĐIỂM XUẤT PHÁT của lộ trình, kèm NGUỒN.
 *
 * "Em vào học ở mức nào" là câu hỏi khác hẳn "bài Mock đầu tiên được mấy điểm". Không có
 * căn cứ thì để trống và hồ sơ ghi "chưa rõ" — hệ thống KHÔNG tự lấy MT1 làm điểm đầu vào,
 * vì như thế mọi học viên đều "tiến bộ 0 điểm ở MT1" một cách vô nghĩa.
 */
export function setBaseline(p: Principal, cycleId: number, input: {
  source: string | null; attemptId?: number | null; score?: number | null; note?: string | null;
}) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: c.student_id },
    'Bạn không có quyền sửa điểm xuất phát của lộ trình này.');
  const conn = db();

  if (input.source === null) {
    conn.prepare(
      `UPDATE learning_cycles SET baseline_attempt_id=NULL, baseline_score=NULL,
              baseline_source=NULL, baseline_note=NULL WHERE id=?`).run(cycleId);
    writeAudit({ actorUserId: p.userId, action: 'cycle.baseline.clear', entityType: 'learning_cycle',
      entityId: cycleId, before: c });
    return cycleById(cycleId);
  }

  if (!(BASELINE_SOURCES as readonly string[]).includes(input.source ?? '')) {
    throw badRequest('Hãy chọn nguồn của điểm xuất phát.');
  }
  let score = input.score ?? null;
  let attemptId = input.attemptId ?? null;

  if (attemptId) {
    // Bài dùng làm căn cứ phải là bài CỦA CHÍNH học viên này, nếu không thì con số đang
    // nói về một người khác.
    const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
    if (!a || a.student_id !== c.student_id) throw badRequest('Bài đánh giá không thuộc học viên này.');
  } else {
    if (score === null || score === undefined || score === ('' as any)) {
      throw badRequest('Hãy nhập điểm xuất phát hoặc chọn một bài đánh giá làm căn cứ.');
    }
    score = Number(score);
    if (!Number.isFinite(score) || score < 0 || score > 9) throw badRequest('Điểm xuất phát phải nằm trong khoảng 0–9.');
  }

  conn.prepare(
    `UPDATE learning_cycles SET baseline_attempt_id=?, baseline_score=?, baseline_source=?, baseline_note=? WHERE id=?`)
    .run(attemptId, attemptId ? null : score, input.source, input.note ?? null, cycleId);
  writeAudit({ actorUserId: p.userId, action: 'cycle.baseline.set', entityType: 'learning_cycle',
    entityId: cycleId, before: c, after: input });
  return cycleById(cycleId);
}

/**
 * KẾT QUẢ CUỐI LỘ TRÌNH. Khác hẳn việc đóng lộ trình về mặt hành chính.
 *
 * Đóng lộ trình chỉ nói "không học theo lộ trình này nữa". Có đạt mục tiêu hay không là
 * một kết luận riêng, phải có bằng chứng, và "chưa có căn cứ" là một câu trả lời hợp lệ.
 */
export function setOutcome(p: Principal, cycleId: number, input: {
  outcome: string | null; attemptId?: number | null; score?: number | null; note?: string | null;
}) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: c.student_id },
    'Bạn không có quyền kết luận lộ trình này.');
  if (input.outcome !== null && !(CYCLE_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw badRequest('Kết luận không hợp lệ.');
  }
  const conn = db();
  if (input.attemptId) {
    const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(input.attemptId) as any;
    if (!a || a.student_id !== c.student_id) throw badRequest('Bài đánh giá không thuộc học viên này.');
  }
  let score = input.score ?? null;
  if (score !== null && score !== undefined && score !== ('' as any)) {
    score = Number(score);
    if (!Number.isFinite(score) || score < 0 || score > 9) throw badRequest('Điểm phải nằm trong khoảng 0–9.');
  } else score = null;

  conn.prepare(`UPDATE learning_cycles SET outcome=?, outcome_attempt_id=?, outcome_score=?, outcome_note=? WHERE id=?`)
    .run(input.outcome, input.attemptId ?? null, score, input.note ?? null, cycleId);
  if (input.outcome) {
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'cycle_outcome',
      eventDate: c.ended_at ?? nowIso().slice(0, 10),
      title: `Kết luận lộ trình: ${CYCLE_OUTCOME_LABEL[input.outcome as keyof typeof CYCLE_OUTCOME_LABEL]}`,
      detail: input.note ?? null, refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId,
      dedupKey: `cycle-outcome:${cycleId}:${input.outcome}`,
    });
  }
  writeAudit({ actorUserId: p.userId, action: 'cycle.outcome', entityType: 'learning_cycle',
    entityId: cycleId, before: c, after: input });
  return cycleById(cycleId);
}

export function targetRevisions(cycleId: number) {
  return db()
    .prepare(
      `SELECT r.*, u.full_name AS actor_name FROM cycle_target_revisions r
         LEFT JOIN users u ON u.id = r.actor_user_id
        WHERE r.cycle_id = ? ORDER BY r.effective_from DESC, r.id DESC`,
    )
    .all(cycleId) as any[];
}

/**
 * ĐỔI MỤC TIÊU. Không chấm lại quá khứ.
 *
 * Mỗi lượt đánh giá đã chốt giữ nguyên `target_at_attempt` của nó, nên kỳ vọng của MT2
 * hôm trước vẫn tính trên mục tiêu hồi đó. Đổi mục tiêu chỉ có hiệu lực từ ngày ghi trở
 * đi, và mỗi lần đổi phải có LÝ DO — nếu không, vài tháng sau không ai còn biết vì sao
 * mục tiêu của em này lại khác trong hồ sơ.
 */
export function reviseTarget(p: Principal, cycleId: number, input: {
  newTarget: number | null; effectiveFrom?: string; reason?: string | null;
}) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: c.student_id },
    'Bạn không có quyền đổi mục tiêu của lộ trình này.');
  const target = input.newTarget === null || input.newTarget === ('' as any) ? null : Number(input.newTarget);
  if (target !== null && (!Number.isFinite(target) || target < 0 || target > 9)) {
    throw badRequest('Mục tiêu phải nằm trong khoảng 0–9.');
  }
  if (target === c.target_score) return { cycle: c, revision: null };
  const effectiveFrom = input.effectiveFrom ?? nowIso().slice(0, 10);
  if (!isIsoDate(effectiveFrom)) throw badRequest('Ngày hiệu lực không hợp lệ.');
  const reason = (input.reason ?? '').trim();
  if (!reason) throw badRequest('Hãy ghi lý do đổi mục tiêu.');

  return tx(() => {
    const conn = db();
    const info = conn
      .prepare(
        `INSERT INTO cycle_target_revisions (cycle_id, old_target, new_target, effective_from, reason, actor_user_id, created_at)
         VALUES (?,?,?,?,?,?,?)`,
      )
      .run(cycleId, c.target_score, target, effectiveFrom, reason, p.userId, nowIso());
    conn.prepare('UPDATE learning_cycles SET target_score = ? WHERE id = ?').run(target, cycleId);
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'target_change', eventDate: effectiveFrom,
      title: `Đổi mục tiêu ${c.target_score ?? 'chưa có'} → ${target ?? 'chưa có'}`,
      detail: reason, refTable: 'cycle_target_revisions', refId: Number(info.lastInsertRowid),
      createdBy: p.userId, dedupKey: `target-rev:${Number(info.lastInsertRowid)}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'cycle.target.revise', entityType: 'learning_cycle',
      entityId: cycleId, before: { target: c.target_score }, after: { target, effectiveFrom, reason } });
    return { cycle: cycleById(cycleId), revision: conn.prepare('SELECT * FROM cycle_target_revisions WHERE id = ?')
      .get(Number(info.lastInsertRowid)) };
  });
}
