import { db, tx } from '../db.ts';
import { PERMISSIONS, type Route } from '../../../shared/domain.ts';
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
