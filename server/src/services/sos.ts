import { db, tx } from '../db.ts';
import { PERMISSIONS, SOS_LABEL, type SosLevel } from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit } from './audit.ts';
import type { AttemptResult } from './scoring.ts';

/**
 * Hành động phối hợp theo Lần MT × mức SOS, lấy nguyên từ 'Quy trinh SOS' của trung tâm.
 *
 * Đây là CHECKLIST cần phối hợp, không phải thứ hệ thống tự làm: SOS không tự cấp buổi học,
 * không tự lùi lịch thi, không tự đóng case và không tự xác nhận Head.
 */
export type SosStep = {
  key: 'talk_student' | 'talk_parent' | 'academic' | 'ops' | 'meeting';
  label: string;
  detail: string;
  required: boolean;
};

export function stepsFor(attemptNo: number, level: SosLevel): SosStep[] {
  if (level === 0) return [];
  const steps: SosStep[] = [];

  // Ai trao đổi với học sinh: SOS 2 từ MT2 trở đi là GVBM, còn lại GVCN + GVBM.
  const byGvbmOnly = level === 2 && attemptNo >= 2;
  steps.push({
    key: 'talk_student', label: 'Trao đổi với học sinh',
    detail: byGvbmOnly ? 'GVBM trao đổi ngắn với HS' : 'GVCN + GVBM trao đổi ngắn với HS',
    required: true,
  });

  // Bảng DOCX bỏ sót bước này ở MT2 SOS3, nhưng sheet 'Quy trinh SOS' đang vận hành thì có.
  steps.push({
    key: 'talk_parent', label: 'Trao đổi với phụ huynh',
    detail: 'CS trao đổi ngắn với PH (thực hiện ngoài hệ thống, ghi lại người và ngày)',
    required: true,
  });

  let academic: string;
  if (attemptNo === 1) academic = level === 3 ? 'Học tutor cho đến lần mock 2' : 'Xếp tự học trong 1 tháng tiếp theo';
  else if (attemptNo === 2)
    academic = level === 3
      ? 'Học tutor cho đến lần mock 3 (ưu tiên) HOẶC đề xuất lùi lịch thi kèm phương án — chọn một'
      : 'Xếp tự học trong 1 tháng tiếp theo';
  else if (attemptNo === 5) academic = 'Bổ sung hành động chuyên môn (nguồn chưa quy định hình thức/thời lượng)';
  else academic = level === 3 ? 'Học tutor cho đến lúc thi (ưu tiên lịch này)' : 'Học tutor cho đến lúc thi';
  steps.push({ key: 'academic', label: 'Hỗ trợ học thuật', detail: academic, required: true });

  if (attemptNo >= 3 && level >= 2) {
    steps.push({
      key: 'ops', label: 'Chính sách vận hành',
      detail: 'P. Vận hành đưa chính sách hỗ trợ (buổi bổ trợ với tutor / GV fulltime) — quyết định theo từng case',
      required: false,
    });
  }

  let meeting: string | null = null;
  if (attemptNo === 1 && level === 3) meeting = 'GVCN meeting HS';
  else if (attemptNo >= 2 && level === 3) meeting = 'CX / GĐCN meeting HS';
  else if (attemptNo >= 2 && level === 2) meeting = 'GVCN meeting HS';
  if (meeting) {
    steps.push({ key: 'meeting', label: 'Meeting bổ sung', detail: `${meeting}: động viên, tìm hiểu nguyên nhân`, required: true });
  }
  return steps;
}

const CASE_FIELDS = [
  'coordinator_user_id', 'talk_student_person', 'talk_student_date', 'talk_parent_person', 'talk_parent_date',
  'academic_support', 'academic_person', 'academic_start_date', 'ops_policy', 'ops_date',
  'meeting_kind', 'meeting_date', 'status', 'note',
] as const;
type CaseField = (typeof CASE_FIELDS)[number];

/**
 * Tạo hoặc cập nhật case khi kết quả đã chốt.
 * Sửa điểm làm đổi mức SOS thì cập nhật mức, GIỮ NGUYÊN hành động và lịch sử đã ghi.
 */
export function upsertCaseForResult(p: Principal, attempt: any, result: AttemptResult) {
  // Chỉ mở/cập nhật case khi đã đủ căn cứ kết luận: đủ điểm mọi kỹ năng BẮT BUỘC và biết target.
  if (!result.evaluable || result.sosLevel === null) return null;
  const conn = db();
  const existing = conn.prepare('SELECT * FROM sos_cases WHERE attempt_id = ?').get(attempt.id) as any;

  if (result.sosLevel === 0) {
    if (existing) {
      conn.prepare('UPDATE sos_cases SET sos_level = 0, updated_at = ? WHERE id = ?').run(nowIso(), existing.id);
      recordChange(existing.id, 'sos_level', String(existing.sos_level), '0', p.userId);
    }
    return existing ?? null;
  }

  if (!existing) {
    const info = conn
      .prepare(`INSERT INTO sos_cases (attempt_id, sos_level, status, created_at) VALUES (?,?, 'open', ?)`)
      .run(attempt.id, result.sosLevel, nowIso());
    const id = Number(info.lastInsertRowid);
    addJourney({
      studentId: attempt.student_id, eventType: 'mock_result', eventDate: demoToday(),
      title: `MT${attempt.attempt_no}: ${SOS_LABEL[result.sosLevel]}`,
      detail: [
        result.overall !== null ? `Overall ${result.overall}` : null,
        `kỳ vọng ${result.expectation ?? '—'}`,
        result.scopeNote,
      ].filter(Boolean).join(' · '),
      refTable: 'assessment_attempts', refId: attempt.id, createdBy: p.userId,
    });
    notifyTeachers(attempt, result.sosLevel);
    writeAudit({ actorUserId: p.userId, action: 'sos.open', entityType: 'sos_case', entityId: id,
      entityLabel: `MT${attempt.attempt_no} SOS ${result.sosLevel}`, after: { level: result.sosLevel } });
    return conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(id);
  }

  if (existing.sos_level !== result.sosLevel) {
    conn.prepare('UPDATE sos_cases SET sos_level = ?, updated_at = ? WHERE id = ?')
      .run(result.sosLevel, nowIso(), existing.id);
    recordChange(existing.id, 'sos_level', String(existing.sos_level), String(result.sosLevel), p.userId);
  }
  return conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(existing.id);
}

function recordChange(caseId: number, field: string, oldValue: string | null, newValue: string | null, actor: number | null) {
  db()
    .prepare(
      `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
       VALUES (?,?,?,?,?,?)`,
    )
    .run(caseId, field, oldValue, newValue, actor, nowIso());
}

/** Thông báo trong ứng dụng cho GVCN + GVBM của lớp. Không gửi email/Zalo ở bản demo. */
function notifyTeachers(attempt: any, level: SosLevel) {
  if (!attempt.class_id) return;
  const teachers = db()
    .prepare(`SELECT DISTINCT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active'`)
    .all(attempt.class_id) as any[];
  const student = db().prepare('SELECT full_name, student_code FROM students WHERE id = ?').get(attempt.student_id) as any;
  for (const t of teachers) {
    notify({
      userId: t.user_id, kind: 'sos', title: `${SOS_LABEL[level]} — ${student.full_name}`,
      body: `MT${attempt.attempt_no} · ${student.student_code}`,
      entityType: 'assessment_attempt', entityId: attempt.id, dedupKey: `sos:${attempt.id}:${level}`,
    });
  }
}

export function updateCase(p: Principal, caseId: number, patch: Partial<Record<CaseField, any>>) {
  const conn = db();
  const c = conn
    .prepare(
      `SELECT sc.*, a.class_id, a.student_id, a.attempt_no FROM sos_cases sc
         JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE sc.id = ?`,
    )
    .get(caseId) as any;
  if (!c) throw notFound('Không tìm thấy case');
  require_(p, PERMISSIONS.SOS_EDIT, { classId: c.class_id, studentId: c.student_id },
    'Bạn không có quyền ghi nhận xử lý cho case này.');

  const sets: string[] = [];
  const params: unknown[] = [];
  const changes: [string, any, any][] = [];

  for (const field of CASE_FIELDS) {
    if (!(field in patch)) continue;
    let value = (patch as any)[field];
    if (field.endsWith('_date') && value) {
      if (!isIsoDate(value)) throw badRequest('Ngày không hợp lệ.');
    }
    if (value === '') value = null;
    if (c[field] === value) continue;
    sets.push(`${field} = ?`);
    params.push(value);
    changes.push([field, c[field], value]);
  }
  if (!sets.length) return c;

  return tx(() => {
    sets.push('updated_at = ?');
    params.push(nowIso(), caseId);
    conn.prepare(`UPDATE sos_cases SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    for (const [f, o, n] of changes) recordChange(caseId, f, o === null ? null : String(o), n === null ? null : String(n), p.userId);
    writeAudit({ actorUserId: p.userId, action: 'sos.update', entityType: 'sos_case', entityId: caseId,
      entityLabel: `MT${c.attempt_no}`, before: Object.fromEntries(changes.map(([f, o]) => [f, o])),
      after: Object.fromEntries(changes.map(([f, , n]) => [f, n])) });
    return conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId);
  });
}

/** Head xác nhận là thao tác riêng, không suy ra từ trạng thái case. */
export function confirmCase(p: Principal, caseId: number, confirmed: boolean) {
  const conn = db();
  const c = conn
    .prepare(`SELECT sc.*, a.class_id FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE sc.id = ?`)
    .get(caseId) as any;
  if (!c) throw notFound();
  require_(p, PERMISSIONS.SOS_CONFIRM, { classId: c.class_id }, 'Bạn không có quyền xác nhận case.');
  conn.prepare('UPDATE sos_cases SET head_confirmed_by = ?, head_confirmed_at = ?, updated_at = ? WHERE id = ?')
    .run(confirmed ? p.userId : null, confirmed ? demoToday() : null, nowIso(), caseId);
  recordChange(caseId, 'head_confirmed', c.head_confirmed_at ?? null, confirmed ? demoToday() : null, p.userId);
  return conn.prepare('SELECT * FROM sos_cases WHERE id = ?').get(caseId);
}

/**
 * Tiến độ checklist. Có tên người mà chưa có ngày thì CHƯA tính là đã làm;
 * ngày ở tương lai tính là "đã xếp" chứ chưa phải "đã bắt đầu".
 */
export function caseProgress(c: any, attemptNo: number, level: SosLevel, today = demoToday()) {
  const steps = stepsFor(attemptNo, level);
  return steps.map((s) => {
    let person: string | null = null;
    let date: string | null = null;
    let value: string | null = null;
    switch (s.key) {
      case 'talk_student': person = c?.talk_student_person; date = c?.talk_student_date; break;
      case 'talk_parent': person = c?.talk_parent_person; date = c?.talk_parent_date; break;
      case 'academic': person = c?.academic_person; date = c?.academic_start_date; value = c?.academic_support; break;
      case 'ops': date = c?.ops_date; value = c?.ops_policy; break;
      case 'meeting': date = c?.meeting_date; value = c?.meeting_kind; break;
    }
    const scheduled = !!date;
    const started = !!date && date <= today;
    return {
      ...s, person: person ?? null, date: date ?? null, value: value ?? null,
      state: started ? 'done' : scheduled ? 'scheduled' : person || value ? 'named_only' : 'empty',
    };
  });
}
