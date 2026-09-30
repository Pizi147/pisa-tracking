import { db, tx } from '../db.ts';
import {
  ENTRY_SKILLS, JOURNEY_GROUP, NO_HANDOVER_NOTE, PERMISSIONS, STUDENT_STATUSES, luatDoiLop, NGAY_SINH_TOI_THIEU, docEmail, docNgayNhap,
  type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { luotSinhViecRow } from '../worklist/danhGia.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, isIsoDate, kiemKieuO, normalizeName, notFound, nowIso, padCode } from '../util.ts';
import { can, classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { NOT_UNCONFIRMED_PRESET } from '../cases/sosState.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
import { datLaiHanCase } from '../cases/sosAuto.ts';
import { entryBandsOf, scoresOf, skipsOf } from '../fasttrack/attempts.ts';
import { evaluateAttempt } from '../fasttrack/scoring.ts';
import { currentCycle, cyclesOf, examPlanOf } from '../fasttrack/cycles.ts';
import { apDungMotDong, dongLopNeuHet, lopDichHopLe, lopHienTaiCua } from '../classes/luatLoTrinh.ts';

import { weekInfo } from '../platform/week.ts';

export function nextStudentCode(): string {
  const conn = db();
  const row = conn.prepare('SELECT next_value FROM student_code_seq WHERE id = 1').get() as any;
  if (!row) {
    conn.prepare('INSERT INTO student_code_seq (id, next_value) VALUES (1, 2)').run();
    return padCode('PISA', 1);
  }
  conn.prepare('UPDATE student_code_seq SET next_value = next_value + 1 WHERE id = 1').run();
  return padCode('PISA', row.next_value);
}

export function listStudents(p: Principal, f: { q?: string; branchId?: number; classId?: number; needAttention?: boolean } = {}) {
  const scope = scopeFor(p, PERMISSIONS.STUDENT_VIEW);
  if (scope.none) return { rows: [], scopeEmpty: true };
  const conn = db();
  const cs = classScopeSql(scope, 'c');
  const where = [
    `EXISTS (SELECT 1 FROM enrollments e JOIN classes c ON c.id = e.class_id
              WHERE e.student_id = s.id AND ${cs.sql})`,
    "s.status != 'archived'",
  ];
  const params: unknown[] = [...cs.params];
  if (f.q) {
    where.push('(s.normalized_name LIKE ? OR s.full_name LIKE ? OR s.student_code LIKE ?)');
    params.push(`%${normalizeName(f.q)}%`, `%${f.q}%`, `%${f.q.toUpperCase()}%`);
  }
  if (f.branchId) {
    where.push(`EXISTS (SELECT 1 FROM enrollments e2 JOIN classes c2 ON c2.id = e2.class_id
                 WHERE e2.student_id = s.id AND c2.branch_id = ? AND e2.status='active')`);
    params.push(f.branchId);
  }
  if (f.classId) {
    where.push(`EXISTS (SELECT 1 FROM enrollments e3 WHERE e3.student_id = s.id AND e3.class_id = ? AND e3.status='active')`);
    params.push(f.classId);
  }

  const rows = conn.prepare(`SELECT s.* FROM students s WHERE ${where.join(' AND ')} ORDER BY s.full_name`).all(...params) as any[];
  const mapped = rows.map((s) => {
    const cur = conn
      .prepare(
        `SELECT c.id, c.code, c.branch_id, b.name AS branch_name FROM enrollments e
           JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
          WHERE e.student_id = ? AND e.status = 'active' ORDER BY e.id DESC LIMIT 1`,
      )
      .get(s.id) as any;
    const cycle = currentCycle(s.id);
    const latest = latestResult(s.id);
    const next = conn
      .prepare(
        `SELECT a.id, a.attempt_no, a.status, pr.code AS period_code, pr.week_start
           FROM assessment_attempts a LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE a.student_id = ? AND a.status = 'planned' AND a.lich_su = 0 ORDER BY pr.week_start, a.attempt_no LIMIT 1`,
      )
      .get(s.id) as any;   /* PR-MT: MT lịch sử (tuần thi đã qua) không phải "MT sắp tới" */
    const openCase = conn
      .prepare(
        `SELECT sc.id, sc.sos_level, sc.status FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE a.student_id = ? AND sc.sos_level > 0 AND sc.status != 'done' ORDER BY sc.id DESC LIMIT 1`,
      )
      .get(s.id) as any;
    return {
      id: s.id, studentCode: s.student_code, fullName: s.full_name, status: s.status,
      cycleId: cycle?.id ?? null, route: cycle?.route ?? null,
      target: cycle?.target_score ?? null, examPlan: examPlanOf(cycle),
      classId: cur?.id ?? null, classCode: cur?.code ?? null, branchName: cur?.branch_name ?? null,
      latest,
      nextMock: next
        ? { id: next.id, attemptNo: next.attempt_no, periodCode: next.period_code,
            weekStart: next.week_start ?? null }
        : null,
      openCase: openCase ?? null,
    };
  });
  return {
    rows: f.needAttention ? mapped.filter((m) => m.openCase) : mapped,
    scopeEmpty: false,
  };
}

/**
 * Kết quả gần nhất đã đủ căn cứ kết luận.
 * Sắp theo lộ trình rồi mới tới số lần, vì số MT được đánh lại từ đầu ở lộ trình mới.
 */
export function latestResult(studentId: number) {
  const attempts = db()
    .prepare(
      `SELECT a.*, cy.seq AS cycle_seq, cy.route, pr.week_end AS period_end FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.student_id = ? AND a.status != 'cancelled'
        ORDER BY cy.seq DESC, a.attempt_no DESC`,
    )
    .all(studentId) as any[];
  const homNay = demoToday();
  for (const a of attempts) {
    if (!luotSinhViecRow(a, homNay)) continue;   // M-14: MT lịch sử ngoài 4 tuần không phải "kết quả gần nhất"
    const r = evaluateAttempt(a.target_at_attempt, a.attempt_no, entryBandsOf(scoresOf(a.id)), skipsOf(a.id), a.route);
    if (r.evaluable) {
      return {
        attemptId: a.id, attemptNo: a.attempt_no, route: a.route, cycleSeq: a.cycle_seq,
        overall: r.overall, sosLevel: r.sosLevel, expectation: r.expectation, scopeNote: r.scopeNote,
      };
    }
  }
  return null;
}

/**
 * NHỮNG THỨ CÒN DỞ khi một em sắp chuyển lớp — để màn hình bày sẵn, người chuyển không phải
 * chép tay (mục 6.4).
 *
 * Trước vòng này, chuyển lớp xong là case còn mở rơi vào khoảng trống: giáo viên cũ không
 * còn dạy em, giáo viên mới không biết em đang dở chuyện gì. Nay chuyển lớp BẮT BUỘC có
 * thông tin bàn giao, và đây là nguồn để viết thông tin đó.
 */
export function handoverBrief(studentId: number) {
  const conn = db();
  const cases = conn
    .prepare(
      `SELECT sc.id, sc.title, sc.category, sc.status,
              u.full_name AS owner_name,
              (SELECT COUNT(*) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.status IN ('planned','started')
                  AND ${NOT_UNCONFIRMED_PRESET('iv')}) AS open_plans,
              (SELECT MIN(iv.action_due) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.status IN ('planned','started')
                  AND ${NOT_UNCONFIRMED_PRESET('iv')}
                  AND iv.action_due IS NOT NULL) AS next_due
         FROM sos_cases sc LEFT JOIN users u ON u.id = sc.owner_user_id
        WHERE sc.student_id = ? AND sc.status != 'done'
        ORDER BY sc.id DESC`,
    )
    .all(studentId) as any[];
  return {
    cases: cases.map((c) => ({
      id: c.id, title: c.title, category: c.category,
      ownerName: c.owner_name ?? null, openPlans: c.open_plans as number,
      nextDue: c.next_due as string | null,
    })),
    openPlans: cases.reduce((n, c) => n + (c.open_plans as number), 0),
  };
}

export function transferStudent(p: Principal, studentId: number, toClassId: number, effectiveDate: string, reason: string, handover?: {
  /** Ghi chú bàn giao — BẮT BUỘC khi em còn case chưa xong. */
  note?: string | null;
  /** Chọn rõ "Không có lưu ý" (RB-3) — chỉ nhận khi em không còn case dở. */
  noNote?: boolean;
  /** Người tiếp nhận CŨ — áp dụng cho MỌI case còn mở (giữ tương thích phép kiểm cũ). `nguoiNhan` thắng nếu có (Q14). */
  receiverUserId?: number | null;
  /** caseId → userId người nhận (Q14, panel Chuyển lớp gợi ý theo Case). */
  nguoiNhan?: Record<number, number> | null;
  /** Sang Fast Track (thật): bắt buộc (Q7). */
  mucTieu?: number | null;
  thangThi?: string | null;
}) {
  /*
   * Q3 (chủ sản phẩm 23/09): quyền kiểm Ở LỚP NGUỒN — GVCN của lớp đó (hoặc QL phạm vi lớp đó).
   * KHÔNG đòi quyền ở lớp đích: GVCN chuyển được sang MỌI chi nhánh đang hoạt động.
   *
   * Em CHƯA TỪNG ghi danh (xếp lớp lần đầu, không phải "chuyển lớp") thì không có lớp nguồn để
   * kiểm theo Q3 — giữ đúng luật cũ: quyền theo phạm vi của em (branch_id) VÀ quyền ở lớp đích.
   */
  const enr = lopHienTaiCua(studentId);
  if (enr) {
    /* PR-CT (Q30-1): thi hành chuyển lớp là việc của lệnh do Quản lý ra; hàm này chỉ còn nội bộ (thi hành, phép kiểm, seed). */
    require_(p, PERMISSIONS.CLASS_EDIT, { classId: enr.class_id }, 'Bạn không có quyền chuyển lớp học viên này.');
  } else {
    require_(p, PERMISSIONS.STUDENT_EDIT, { studentId }, 'Bạn không có quyền chuyển lớp học viên này.');
    require_(p, PERMISSIONS.STUDENT_EDIT, { classId: toClassId }, 'Lớp đích nằm ngoài phạm vi bạn được cấp quyền.');
  }
  const toClass = lopDichHopLe(toClassId, enr?.class_id ?? -1);
  if (!toClass) throw badRequest('Lớp đích không hợp lệ.');
  if (!isIsoDate(effectiveDate)) throw badRequest('Ngày hiệu lực không hợp lệ.');

  const why = String(reason ?? '').trim();
  if (!why) throw badRequest('Chọn lý do chuyển lớp.');
  /*
   * LƯU Ý BÀN GIAO BẮT BUỘC, có lựa chọn "Không có lưu ý" (RB-3). Còn Case dở thì KHÔNG được chọn "Không có lưu ý": người nhận lớp
   * đọc đúng dòng này để biết em đang vướng gì (mục 6.4) — plan PR-S1 Q10.
   */
  const brief = handoverBrief(studentId);
  const typed = (handover?.note ?? '').trim();
  if (brief.cases.length > 0 && !typed) {
    throw badRequest(
      `Em còn ${brief.cases.length} case chưa xong. Ghi thông tin bàn giao để người nhận lớp `
      + 'biết em đang vướng gì và đang làm dở đến đâu.',
    );
  }
  if (!typed && !handover?.noNote) throw badRequest(`Ghi lưu ý bàn giao, hoặc chọn "${NO_HANDOVER_NOTE}".`);
  const handoverNote = typed || NO_HANDOVER_NOTE;

  /* Q7: chuyển THẬT sang Fast Track (không phải chỉ ghi dự định) bắt buộc Mục tiêu band. Không áp dụng khi xếp lớp lần đầu. */
  if (enr) {
    const luatXem = luatDoiLop(
      { ma: (enr.programme_code ?? null) as ProgrammeCode | null, ft: !!enr.is_fast_track, lt: enr.route },
      { ma: (toClass.programme_code ?? null) as ProgrammeCode | null, ft: !!toClass.is_fast_track, lt: toClass.route },
      'giua-khoa',
    );
    if (luatXem.canMucTieu && (handover?.mucTieu === null || handover?.mucTieu === undefined)) {
      throw badRequest('Chuyển sang Fast Track cần Mục tiêu band.');
    }
  }

  let nguoiNhan: Record<number, number> | null = handover?.nguoiNhan ?? null;
  if (!nguoiNhan && handover?.receiverUserId) {
    nguoiNhan = {};
    for (const c of brief.cases) nguoiNhan[c.id] = handover.receiverUserId;
  }

  const r = apDungMotDong(p, {
    sid: studentId, toClassId, ngay: effectiveDate, lyDo: why, luuY: handoverNote,
    mucTieu: handover?.mucTieu ?? null, thangThi: handover?.thangThi ?? null,
    nguoiNhan, boiCanh: 'giua-khoa',
  });
  if (enr) dongLopNeuHet([enr.class_id], effectiveDate);
  return { newClassCode: r.toClassCode, endKind: r.luat?.endKind ?? null };
}

/**
 * Trạng thái học viên chỉ có ba: active đang học · inactive tạm dừng · finished dừng hẳn.
 * Lưu trữ (archive) là cách ẩn khỏi danh sách, KHÔNG phải trạng thái thứ tư, và không đóng gì.
 * Kết thúc học (`finished`) thì Case còn mở được hệ thống tự đóng theo S16.
 */
export function setStudentStatus(
  p: Principal, studentId: number, status: 'active' | 'inactive' | 'finished', date: string, reason?: string,
  /** PR-LT: "Kết thúc vì" của dòng enrollment đóng lại (Q18). Mặc định theo `status` khi không truyền. */
  endKind?: 'bao_luu' | 'dung_hoc' | 'ket_thuc' | null,
) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId });
  if (!(STUDENT_STATUSES as readonly string[]).includes(status)) throw badRequest('Trạng thái không hợp lệ.');
  if (!isIsoDate(date)) throw badRequest('Ngày không hợp lệ.');
  /* PR-S3F #11: ngày hiệu lực không ở tương lai — và ngày Quay lại không trước ngày Tạm dừng, để hạn Case (`datLaiHanCase`) không tính từ ngày quá khứ tuỳ ý. */
  if (date > demoToday()) throw badRequest('Ngày hiệu lực không được sau hôm nay.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (s.status === status) return s;
  if (status === 'active' && s.status === 'inactive') {
    const tamDung = (conn.prepare(`SELECT MAX(event_date) d FROM journey_events WHERE student_id = ? AND event_type = 'pause'`).get(studentId) as any)?.d as string | null;
    if (tamDung && date < tamDung) throw badRequest(`Ngày quay lại không được trước ngày tạm dừng (${tamDung.split('-').reverse().join('/')}).`);
  }

  const curEnr = conn
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status IN ('active','paused') ORDER BY id DESC LIMIT 1`)
    .get(studentId) as any;

  /* Q17: Quay lại học vào lớp mà enrollment tạm dừng đang đứng — lớp đó có thể đã kết thúc từ đó tới nay. */
  if (status === 'active' && s.status === 'inactive' && curEnr) {
    const cls = conn.prepare('SELECT status, code FROM classes WHERE id = ?').get(curEnr.class_id) as any;
    if (cls?.status === 'finished') {
      throw badRequest(`Lớp ${cls.code} đã kết thúc. Dùng Chuyển lớp để xếp em vào lớp đang học.`);
    }
  }

  /* PR-XOA §2: thôi học (finished) tự vào Lưu trữ từ ngày hiệu lực; tạm dừng / quay lại học thì không lưu trữ. */
  const archivedAt = status === 'finished' ? date : null;
  return tx(() => {
    conn.prepare('UPDATE students SET status = ?, finished_at = ?, archived_at = ? WHERE id = ?')
      .run(status, status === 'finished' ? date : null, archivedAt, studentId);
    // Enrollment đi theo nhưng vẫn giữ nguyên lịch sử lớp.
    const enrollmentStatus = status === 'active' ? 'active' : status === 'inactive' ? 'paused' : 'completed';
    const kind = status === 'finished' ? (endKind ?? 'ket_thuc') : status === 'inactive' ? (endKind ?? 'bao_luu') : null;
    conn.prepare(`UPDATE enrollments SET status = ?, end_kind = ? WHERE student_id = ? AND status IN ('active','paused')`)
      .run(enrollmentStatus, kind, studentId);
    /*
     * S16: em KẾT THÚC học → Case còn mở của em hệ thống tự đóng "Học viên kết thúc khoá". Tạm dừng thì không.
     * PR-LT: lộ trình ĐANG CHẠY cũng khép lại — `updateCycle`/`setOutcome` chỉ đóng khi nơi gọi truyền cờ, và
     * setStudentStatus trước đây không đóng gì (Nhật ký PR-LT, mục 6 "Mâu thuẫn nguồn ↔ mã thật").
     */
    /* PR-SOS (K3-41): Quay lại học → hạn Case tính lại từ ngày quay lại. */
    if (status === 'active' && s.status === 'inactive') datLaiHanCase(studentId, date);
    if (status === 'finished') {
      closeCasesBySystem({ actorUserId: p.userId, studentId, reason: 'course_ended', on: date });
      conn.prepare(`UPDATE learning_cycles SET status = 'abandoned', ended_at = ? WHERE student_id = ? AND status = 'active'`)
        .run(date, studentId);
    }
    addJourney({
      studentId, eventType: status === 'inactive' ? 'pause' : status === 'active' ? 'resume' : 'finish',
      eventDate: date,
      title: status === 'inactive' ? 'Tạm dừng học' : status === 'active' ? 'Quay lại học' : 'Kết thúc học',
      detail: reason ?? null, createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'student.status', entityType: 'student', entityId: studentId,
      entityLabel: s.student_code, before: { status: s.status }, after: { status, date, reason, archivedAt } });
    if (curEnr && status !== 'active') dongLopNeuHet([curEnr.class_id], date);
    return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}

/**
 * LƯU TRỮ HỌC VIÊN — QUẢN LÝ BẤM (RB-9, quyết định 4.17 ngày 22/09/2026), và từ PR-XOA (24/09) em thôi học TỰ vào Lưu trữ ngay lúc
 * `setStudentStatus(…, 'finished')`. Nút này còn dùng khi QL đã "Bỏ lưu trữ" rồi muốn lưu trữ lại.
 *
 * Không có tác vụ ngầm "sau N ngày tự lưu trữ" (hàm `archiveDueStudents` cũ đã gỡ — nó chưa từng được gọi ở đâu ngoài phép kiểm).
 * Lưu trữ chỉ ẩn khỏi danh sách mặc định: không đổi trạng thái, không xoá dữ liệu, không đóng việc còn dở. Chỉ em đã kết thúc học.
 */
export function archiveStudent(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, 'Chỉ Quản lý mới lưu trữ được học viên.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (s.status !== 'finished') throw badRequest('Chỉ lưu trữ được học viên đã kết thúc học.');
  if (s.archived_at) return s;
  const on = demoToday();
  conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run(on, studentId);
  writeAudit({ actorUserId: p.userId, action: 'student.archive', entityType: 'student', entityId: studentId,
    entityLabel: s.student_code, before: { archivedAt: null }, after: { archivedAt: on } });
  return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
}

export function unarchiveStudent(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId }, 'Chỉ Quản lý mới bỏ lưu trữ được học viên.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (!s.archived_at) return s;
  conn.prepare('UPDATE students SET archived_at = NULL WHERE id = ?').run(studentId);
  writeAudit({ actorUserId: p.userId, action: 'student.unarchive', entityType: 'student', entityId: studentId,
    entityLabel: s.student_code, before: { archivedAt: s.archived_at }, after: { archivedAt: null } });
  return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
}

export function updateStudent(p: Principal, studentId: number, patch: any) {
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId });
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound();
  // Target và ngày thi IELTS nằm ở LỘ TRÌNH, sửa qua updateCycle chứ không qua hồ sơ.
  const map: Record<string, string> = {
    fullName: 'full_name', note: 'note', dob: 'dob', consultantName: 'consultant_name', email: 'email',
  };
  /* Kiểm ở biên (PR-NHAP): họ tên không rỗng, ngày sinh có thật và không sau hôm nay, email đúng dạng (trống → NULL, T8). */
  patch = { ...patch };
  kiemKieuO(patch, ['fullName', 'dob', 'email', 'consultantName', 'note'], [],
    (k) => ({ fullName: 'Họ tên', dob: 'Ngày sinh', email: 'Email', consultantName: 'Người tư vấn', note: 'Ghi chú' })[k] ?? k);
  if (patch.fullName !== undefined) {
    patch.fullName = String(patch.fullName ?? '').trim();
    if (!patch.fullName) throw badRequest('Họ tên không được trống.');
  }
  if (patch.dob !== undefined) {
    const d = docNgayNhap(patch.dob, demoToday(), { toiThieu: NGAY_SINH_TOI_THIEU, toiDa: demoToday() });
    if (d.loi) throw badRequest('Ngày sinh: ' + d.loi);
    patch.dob = d.iso;
  }
  if (patch.email !== undefined) {
    const e = docEmail(patch.email);
    if (e.loi) throw badRequest('Email: ' + e.loi);
    patch.email = e.email;
  }
  const sets: string[] = []; const params: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k]) continue;
    sets.push(`${map[k]} = ?`); params.push(v);
    if (k === 'fullName') { sets.push('normalized_name = ?'); params.push(normalizeName(String(v))); }
  }
  if (!sets.length) return s;
  params.push(studentId);
  conn.prepare(`UPDATE students SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  writeAudit({ actorUserId: p.userId, action: 'student.update', entityType: 'student', entityId: studentId,
    entityLabel: s.student_code, before: s, after: conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) });
  return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
}
