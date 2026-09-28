import { db, tx } from '../db.ts';
import {
  BASELINE_SOURCES, CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL, CYCLE_STATUSES, PERMISSIONS, type ExamPlan, type Route,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { periodById } from '../platform/week.ts';
import { applySuggestedMockWeeks } from '../classes/schedule.ts';

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

/**
 * DỰ KIẾN THI của một lộ trình, ở đúng mức chắc chắn mà người ta thực sự biết.
 *
 * Ba mức, và giao diện hiển thị đúng ba mức đó chứ không quy về một:
 *   `week`  đã chốt tuần   → "W2 FEB 2027"  — có đếm ngược theo tuần
 *   `month` mới biết tháng → "FEB 2027"     — KHÔNG đếm ngược
 *   `none`  chưa biết gì   → "Chưa xác định"
 *
 * Chỉ đếm ngược khi đã có tuần. Biết mỗi tháng mà vẫn hiện "còn 134 ngày" là bịa ra một
 * độ chính xác không có thật, và người đọc sẽ tin con số đó.
 *
 * NHÃN CỦA MỨC `month` CHỈ CÒN TÊN THÁNG (mục 5.2). Cụm "· chưa xác định tuần" đã bỏ: nó
 * dài hơn chính thông tin nó bổ nghĩa, lặp ở mọi chỗ hiện kế hoạch thi, và nói một điều đã
 * nằm sẵn trong `confidence` — chỗ nào cần phân biệt thì đọc `confidence`, đừng nhồi vào
 * chuỗi hiển thị.
 */
const MONTH_CODE = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function examPlanOf(cycle: {
  exam_period_id?: number | null; exam_month?: string | null;
  /* Truy vấn nào JOIN sẵn bảng tuần thì truyền hai cột này vào, khỏi hỏi lại từng dòng. */
  exam_week_code?: string | null; exam_week_start?: string | null;
} | null | undefined): ExamPlan {
  const none: ExamPlan = { confidence: 'none', periodId: null, weekStart: null, month: null, label: 'Chưa xác định' };
  if (!cycle) return none;
  if (cycle.exam_period_id) {
    const w = cycle.exam_week_code && cycle.exam_week_start
      ? { code: cycle.exam_week_code, weekStart: cycle.exam_week_start }
      : periodById(cycle.exam_period_id);
    if (w) {
      return { confidence: 'week', periodId: cycle.exam_period_id, weekStart: w.weekStart,
               month: w.weekStart.slice(0, 7), label: w.code };
    }
  }
  if (cycle.exam_month) {
    const mm = Number(cycle.exam_month.slice(5, 7));
    const name = MONTH_CODE[mm - 1] ?? cycle.exam_month.slice(5, 7);
    return { confidence: 'month', periodId: null, weekStart: null, month: cycle.exam_month,
             label: `${name} ${cycle.exam_month.slice(0, 4)}` };
  }
  return none;
}

/** PR-DUYET (T44, Câu 1 = B): GVCN không tự sửa target/lộ trình — gửi Đề xuất sửa. Chuyển lớp vẫn là của GVCN. */
export const CHI_QL_SUA = 'Target và lộ trình do Quản lý sửa. Bấm "Đề xuất sửa" để gửi Quản lý duyệt.';

export function createCycle(p: Principal, input: {
  studentId: number; route?: Route | null; targetScore?: number | null;
  examPeriodId?: number | null; startedAt?: string; note?: string | null;
}) {
  const conn = db();
  /* PR-DUYET (T44): mở lộ trình MỚI cho em đã có lộ trình = đổi lộ trình → Quản lý (`cycle.edit`). Lộ trình đầu tiên lúc thêm HV giữ `student.edit`. */
  const daCo = !!conn.prepare('SELECT 1 FROM learning_cycles WHERE student_id = ? LIMIT 1').get(input.studentId);
  if (daCo) require_(p, PERMISSIONS.CYCLE_EDIT, { studentId: input.studentId }, CHI_QL_SUA);
  else require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: input.studentId }, 'Bạn không có quyền mở lộ trình mới cho học viên này.');
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  if (input.examPeriodId && !periodById(Number(input.examPeriodId))) throw badRequest('Tuần dự kiến thi không hợp lệ.');
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
        `INSERT INTO learning_cycles (student_id, seq, route, target_score, exam_period_id, started_at, status, note, created_at)
         VALUES (?,?,?,?,?,?, 'active', ?, ?)`,
      )
      .run(input.studentId, seq, input.route ?? null, input.targetScore ?? null,
           input.examPeriodId ?? null, startedAt, input.note ?? null, nowIso());
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
  /* PR-DUYET (T44): đổi target / lộ trình cần `cycle.edit` — chỉ khi giá trị THẬT SỰ đổi (panel gửi cả ô không sửa). Thi dự kiến giữ `student.edit` (Q7). */
  const doiTarget = patch.targetScore !== undefined && Number(patch.targetScore ?? NaN) !== Number(c.target_score ?? NaN)
    && !(patch.targetScore == null && c.target_score == null);
  const doiLoTrinh = patch.route !== undefined && (patch.route ?? null) !== (c.route ?? null);
  if (doiTarget || doiLoTrinh) require_(p, PERMISSIONS.CYCLE_EDIT, { studentId: c.student_id }, CHI_QL_SUA);
  if (patch.status !== undefined && !(CYCLE_STATUSES as readonly string[]).includes(String(patch.status))) {
    throw badRequest('Trạng thái lộ trình không hợp lệ.');
  }
  /*
   * S16 CHỈ khi nơi gọi nói rõ "em thôi học" (`dongCaseKhiKetThuc: true`). Luồng "Lên lớp thường tiếp" (PR-LT) hoàn tất khoá cũ mà
   * KHÔNG truyền cờ — Case đi theo em sang khoá mới (§3.9). Không cờ = không đóng gì. Cờ đọc riêng, không phải cột: `map` bỏ qua
   * khoá lạ nên nó không lọt vào câu UPDATE.
   */
  const closeOnEnd = patch.dongCaseKhiKetThuc === true
    && c.status === 'active' && patch.status !== undefined && patch.status !== 'active';
  const map: Record<string, string> = {
    targetScore: 'target_score', route: 'route', note: 'note', status: 'status',
    /*
     * Hai trường của vòng 4. Quyền sửa: Admin CN · Quản lý · GVCN của lớp (mục 7.5) —
     * `student.edit` đã bao đúng ba vai đó, nên không thêm quyền mới.
     */
    startPeriodId: 'start_period_id', examMonth: 'exam_month', examPeriodId: 'exam_period_id',
  };
  const sets: string[] = []; const params: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k]) continue;
    if (k === 'examPeriodId' && v && !periodById(Number(v))) throw badRequest('Tuần dự kiến thi không hợp lệ.');
    /*
     * Tháng thi dạng 'YYYY-MM'. Nhận CẢ một ngày đầy đủ rồi cắt lấy tháng — ô chọn tháng
     * của trình duyệt trả về đúng dạng này, nhưng người dán tay hay dán cả ngày.
     */
    if (k === 'examMonth' && v) {
      const raw = String(v).slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(raw)) throw badRequest('Tháng dự kiến thi phải có dạng MM/YYYY.');
      const mm = Number(raw.slice(5, 7));
      if (mm < 1 || mm > 12) throw badRequest('Tháng dự kiến thi không hợp lệ.');
      sets.push('exam_month = ?'); params.push(raw);
      continue;
    }
    if (k === 'startPeriodId' && v && !periodById(Number(v))) {
      throw badRequest('Tuần bắt đầu học không hợp lệ.');
    }
    sets.push(`${map[k]} = ?`); params.push(v);
  }
  if (!sets.length) return c;
  params.push(cycleId);
  tx(() => {
    db().prepare(`UPDATE learning_cycles SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    if (patch.status !== undefined && patch.status !== 'active' && c.status === 'active') {
      db().prepare('UPDATE learning_cycles SET ended_at = COALESCE(ended_at, ?) WHERE id = ?').run(demoToday(), cycleId);
    }
    if (closeOnEnd) {
      closeCasesBySystem({ actorUserId: p.userId, studentId: c.student_id, reason: 'course_ended', on: demoToday(), cycleIds: [cycleId] });
    }
  });
  const after = cycleById(cycleId);
  // Đổi tuần dự kiến thi là sự kiện đáng ghi vào hành trình học.
  if (patch.examPeriodId !== undefined && patch.examPeriodId !== c.exam_period_id) {
    const before = c.exam_period_id ? periodById(c.exam_period_id)?.code ?? null : null;
    const now = patch.examPeriodId ? periodById(Number(patch.examPeriodId)) : null;
    addJourney({
      studentId: c.student_id, eventType: 'exam_plan_changed',
      eventDate: now?.weekStart ?? nowIso().slice(0, 10),
      title: 'Đổi tuần dự kiến thi IELTS',
      detail: `${before ?? 'chưa có'} → ${now?.code ?? 'chưa có'}`,
      refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId,
    });
  }
  /*
   * ĐỔI TUẦN BẮT ĐẦU HỌC LÀ ĐỔI CẢ LỊCH MT — nhưng chỉ những lượt hệ thống từng tự xếp.
   *
   * Đây là chỗ giữ lời hứa của mục 7.6: "hệ thống không được ghi đè cái Quản lý đã xếp".
   * Lượt nào `plan_source = 'manual'` hoặc đã làm xong thì đứng yên; phần còn lại chạy theo
   * mốc mới. Người dùng khai đúng tuần vào học một lần, lịch tự đúng theo.
   */
  if (patch.startPeriodId !== undefined && patch.startPeriodId !== c.start_period_id && after?.start_period_id) {
    try {
      const r = applySuggestedMockWeeks(p, cycleId);
      if (r.created || r.moved) {
        addJourney({
          studentId: c.student_id, eventType: 'cycle_start',
          eventDate: nowIso().slice(0, 10),
          title: 'Đổi tuần bắt đầu học',
          detail: `Lịch MT đề xuất cập nhật theo: thêm ${r.created}, dời ${r.moved}, giữ nguyên ${r.kept} lượt đã chốt tay`,
          refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId,
        });
      }
    } catch {
      /*
       * Không có quyền xếp tuần MT (ví dụ GVCN sửa tuần bắt đầu) thì KHÔNG chặn việc sửa
       * thông tin — chỉ là lịch MT chưa được đề xuất lại, và Quản lý áp sau. Ném lỗi ở đây
       * sẽ biến một ô thông tin đơn giản thành một thao tác cần quyền cao hơn.
       */
    }
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
    throw badRequest('Chọn nguồn của điểm xuất phát.');
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
      throw badRequest('Nhập điểm xuất phát hoặc chọn một bài đánh giá làm căn cứ.');
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
  outcome: string | null;
  /** Mã cũ. Từ vòng 7 KHÔNG nhận nữa — xem ghi chú ở dưới (mục 5.1). */
  attemptId?: number | null;
  score?: number | null; note?: string | null;
  /** S16: em THÔI HỌC sau khi kết luận lộ trình → hệ thống tự đóng Case còn mở của lộ trình này. Học tiếp thì không truyền. */
  dongCaseKhiKetThuc?: boolean;
}) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: c.student_id },
    'Bạn không có quyền kết luận lộ trình này.');
  if (input.outcome !== null && !(CYCLE_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw badRequest('Kết luận không hợp lệ.');
  }
  const conn = db();
  /*
   * MỘT LƯỢT MT KHÔNG PHẢI MỘT KỲ THI THẬT (mục 5.1).
   *
   * Đường cũ cho chọn "một bài đã có" rồi lấy điểm bài đó làm kết quả cuối lộ trình. Nghe
   * thì tiện, nhưng nó ghi vào hồ sơ một câu không đúng: em chưa thi IELTS mà hồ sơ nói em
   * được 6.5. Mock Test chấm nội bộ, không có phòng thi và không có chứng chỉ; kết quả thật
   * là con số em báo về từ BC hay IDP.
   */
  if (input.attemptId) {
    throw badRequest(
      'Không lấy một lượt Mock Test làm kết quả thi thật. Nhập điểm IELTS em báo về, '
      + 'hoặc để trống nếu em chưa thi.',
    );
  }
  let score = input.score ?? null;
  if (score !== null && score !== undefined && score !== ('' as any)) {
    score = Number(score);
    if (!Number.isFinite(score) || score < 0 || score > 9) throw badRequest('Điểm phải nằm trong khoảng 0–9.');
  } else score = null;

  conn.prepare(`UPDATE learning_cycles SET outcome=?, outcome_attempt_id=NULL, outcome_score=?, outcome_note=? WHERE id=?`)
    .run(input.outcome, score, input.note ?? null, cycleId);
  if (input.outcome) {
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'cycle_outcome',
      eventDate: c.ended_at ?? nowIso().slice(0, 10),
      title: `Kết luận lộ trình: ${CYCLE_OUTCOME_LABEL[input.outcome as keyof typeof CYCLE_OUTCOME_LABEL]}`,
      detail: input.note ?? null, refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId,
      dedupKey: `cycle-outcome:${cycleId}:${input.outcome}`,
    });
  }
  /* S16: "Kết luận lộ trình" mà em THÔI HỌC (nơi gọi truyền cờ) → Case còn mở của lộ trình này hệ thống tự đóng. Học tiếp thì không cờ. */
  if (input.dongCaseKhiKetThuc === true) {
    closeCasesBySystem({ actorUserId: p.userId, studentId: c.student_id, reason: 'course_ended', on: demoToday(), cycleIds: [cycleId] });
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
  require_(p, PERMISSIONS.CYCLE_EDIT, { studentId: c.student_id }, CHI_QL_SUA);
  const target = input.newTarget === null || input.newTarget === ('' as any) ? null : Number(input.newTarget);
  if (target !== null && (!Number.isFinite(target) || target < 0 || target > 9)) {
    throw badRequest('Mục tiêu phải nằm trong khoảng 0–9.');
  }
  if (target === c.target_score) return { cycle: c, revision: null };
  const effectiveFrom = input.effectiveFrom ?? nowIso().slice(0, 10);
  if (!isIsoDate(effectiveFrom)) throw badRequest('Ngày hiệu lực không hợp lệ.');
  const reason = (input.reason ?? '').trim();
  if (!reason) throw badRequest('Ghi lý do đổi mục tiêu.');

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
