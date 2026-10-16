import { db, tx } from '../db.ts';
import {
  ENTRY_SKILLS, JOURNEY_GROUP, chuTargetKck, NO_HANDOVER_NOTE, PERMISSIONS, STUDENT_STATUSES, luatDoiLop, NGAY_SINH_TOI_THIEU, docEmail, docNgayNhap,
  type LoaiLop, type ProgrammeCode,
  CHI_SUA_THONG_TIN, LIEN_HE_TOI_DA, NHAN_LIEN_HE, docSoDienThoai, CAU_LUU_TRU,
} from '../../../shared/domain/index.ts';
import { luotSinhViecRow } from '../worklist/danhGia.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, chuTuDo, conflict, forbidden, isIsoDate, kiemKieuO, normalizeName, notFound, nowIso, padCode } from '../util.ts';
import { can, classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { CASE_THAT, NOT_UNCONFIRMED_PRESET } from '../cases/sosState.ts';
import { closeCasesBySystem, moLaiCaseHeThongDong, type ChupCaseDong } from '../cases/systemClose.ts';
import { datLaiHanCase } from '../cases/sosAuto.ts';
import { chotHanXuLy } from '../yThuc/trangThai.ts';
import { entryBandsOf, kckCuaLuot, scoresOf, skipsOf } from '../fasttrack/attempts.ts';
import { evaluateAttempt, roundToHalf } from '../fasttrack/scoring.ts';
import { currentCycle, cyclesOf, docDuKienThi, docTarget, examPlanOf } from '../fasttrack/cycles.ts';
import { isRatioCycle } from '../normal/regular.ts';
import {
  apDungMotDong, danhSachLopDich, doiTg, dongLopNeuHet, lopDichHopLe, lopHienTaiCua, moLoTrinhMoi, thongBaoChuyenVao,
} from '../classes/luatLoTrinh.ts';
import { moLaiLop } from '../classes/xoaKetThucLop.ts';
import { ghiBanChup } from '../loTrinh/banChup.ts';

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
          WHERE a.student_id = ? AND a.status = 'planned' AND a.lich_su = 0 ORDER BY pr.week_start IS NULL, pr.week_start, a.attempt_no LIMIT 1`,
      )
      .get(s.id) as any;   /* PR-MT: MT lịch sử (tuần thi đã qua) không phải "MT sắp tới" */
    const openCase = conn
      .prepare(
        `SELECT sc.id, sc.sos_level, sc.status FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id
          WHERE a.student_id = ? AND sc.sos_level > 0 AND sc.status != 'done' AND ${CASE_THAT('sc')} ORDER BY sc.id DESC LIMIT 1`,
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
      `SELECT a.*, cy.seq AS cycle_seq, cy.route, cy.khong_cam_ket, pr.week_end AS period_end FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.student_id = ? AND a.status != 'cancelled' AND a.kind != 'mt0'   /* PR-MT0: MT0 không là "kết quả gần nhất" */
        ORDER BY cy.seq DESC, a.attempt_no DESC`,
    )
    .all(studentId) as any[];
  const homNay = demoToday();
  for (const a of attempts) {
    if (!luotSinhViecRow(a, homNay)) continue;   // M-14: MT lịch sử ngoài 4 tuần không phải "kết quả gần nhất"
    const r = evaluateAttempt(a.target_at_attempt, a.attempt_no, entryBandsOf(scoresOf(a.id)), skipsOf(a.id), a.route, [], kckCuaLuot(a));   // OV-11e (Q8)
    if (r.evaluable) {
      return {
        attemptId: a.id, attemptNo: a.attempt_no, route: a.route, cycleSeq: a.cycle_seq,
        overall: r.overall, sosLevel: r.sosLevel, kckDuoi: r.kckDuoi, expectation: r.expectation, scopeNote: r.scopeNote,
      };
    }
  }
  return null;
}

/**
 * NHỮNG THỨ CÒN DỞ khi một em sắp chuyển lớp — để màn hình bày sẵn, người chuyển không phải
 * chép tay (mục 6.4).
 *
 * Trước vòng này, chuyển lớp xong là Case còn mở rơi vào khoảng trống: giáo viên cũ không
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
  /** Ghi chú bàn giao — BẮT BUỘC khi em còn Case chưa xong. */
  note?: string | null;
  /** Chọn rõ "Không có lưu ý" (RB-3) — chỉ nhận khi em không còn Case dở. */
  noNote?: boolean;
  /** Người tiếp nhận CŨ — áp dụng cho MỌI Case còn mở (giữ tương thích phép kiểm cũ). `nguoiNhan` thắng nếu có (Q14). */
  receiverUserId?: number | null;
  /** caseId → userId người nhận (Q14, panel Chuyển lớp gợi ý theo Case). */
  nguoiNhan?: Record<number, number> | null;
  /** Lên FT (thật): bắt buộc (Q7). */
  mucTieu?: number | null;
  thangThi?: string | null;
}) {
  /*
   * Q3 (chủ sản phẩm 23/09): quyền kiểm Ở LỚP NGUỒN — GVCN của lớp đó (hoặc QL phạm vi lớp đó).
   * KHÔNG đòi quyền ở lớp chuyển đến: GVCN chuyển được sang MỌI chi nhánh đang hoạt động.
   *
   * Em CHƯA TỪNG ghi danh (xếp lớp lần đầu, không phải "chuyển lớp") thì không có lớp nguồn để
   * kiểm theo Q3 — giữ đúng luật cũ: quyền theo phạm vi của em (branch_id) VÀ quyền ở lớp chuyển đến.
   */
  const enr = lopHienTaiCua(studentId);
  if (enr) {
    /* PR-CT (Q30-1): thi hành chuyển lớp là việc của lệnh do Quản lý ra; hàm này chỉ còn nội bộ (thi hành, phép kiểm, seed). */
    require_(p, PERMISSIONS.CLASS_EDIT, { classId: enr.class_id }, 'Bạn không có quyền chuyển lớp học viên này.');
  } else {
    /* OV-11d (rà bảo mật): em Tạm dừng GIỮ lớp (`paused`) — không phải "xếp lớp lần đầu"; GVCN lớp đó nay có `student.edit` với em nên phải đòi quyền
       ra lệnh ở lớp nguồn như em đang học (Quản lý), không để GVCN gọi thẳng API chuyển em đi. */
    const lopGiu = (db().prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'paused' ORDER BY id DESC LIMIT 1`).get(studentId) as any)?.class_id;
    if (lopGiu) require_(p, PERMISSIONS.CLASS_EDIT, { classId: lopGiu }, 'Bạn không có quyền chuyển lớp học viên này.');
    require_(p, PERMISSIONS.STUDENT_EDIT, { studentId }, 'Bạn không có quyền chuyển lớp học viên này.');
    require_(p, PERMISSIONS.STUDENT_EDIT, { classId: toClassId }, 'Lớp chuyển đến nằm ngoài phạm vi bạn được cấp quyền.');
  }
  /* OV-11d (Q4): hồ sơ Lưu trữ khoá — xếp / chuyển lớp phải Bỏ lưu trữ (hoặc Học lại) trước. */
  if ((db().prepare('SELECT archived_at FROM students WHERE id = ?').get(studentId) as any)?.archived_at) throw badRequest(CAU_LUU_TRU);
  const toClass = lopDichHopLe(toClassId, enr?.class_id ?? -1);
  if (!toClass) throw badRequest('Lớp chuyển đến không hợp lệ.');
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
      `Em còn ${brief.cases.length} Case chưa xong. Ghi thông tin bàn giao để người nhận lớp `
      + 'biết em đang vướng gì và đang làm dở đến đâu.',
    );
  }
  if (!typed && !handover?.noNote) throw badRequest(`Ghi lưu ý bàn giao, hoặc chọn "${NO_HANDOVER_NOTE}".`);
  const handoverNote = typed || NO_HANDOVER_NOTE;

  /* Q7: chuyển THẬT sang Fast Track (không phải chỉ ghi dự định) bắt buộc Target. Không áp dụng khi xếp lớp lần đầu. */
  if (enr) {
    const luatXem = luatDoiLop(
      { ma: (enr.programme_code ?? null) as ProgrammeCode | null, ft: !!enr.is_fast_track, lt: enr.route },
      { ma: (toClass.programme_code ?? null) as ProgrammeCode | null, ft: !!toClass.is_fast_track, lt: toClass.route },
      'giua-khoa',
    );
    if (luatXem.canMucTieu && (handover?.mucTieu === null || handover?.mucTieu === undefined)) {
      throw badRequest('Lên FT cần Target.');
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
  /* OV-8b: TVV / CX Tạm dừng / Quay lại học / Thôi học (`student.edit_more`) — cùng luật. */
  if (!can(p, PERMISSIONS.STUDENT_EDIT_MORE, { studentId })) require_(p, PERMISSIONS.STUDENT_EDIT, { studentId });
  if (!(STUDENT_STATUSES as readonly string[]).includes(status)) throw badRequest('Trạng thái không hợp lệ.');
  if (!isIsoDate(date)) throw badRequest('Ngày không hợp lệ.');
  /* PR-S3F #11: ngày hiệu lực không ở tương lai — và ngày Quay lại không trước ngày Tạm dừng, để hạn Case (`datLaiHanCase`) không tính từ ngày quá khứ tuỳ ý. */
  if (date > demoToday()) throw badRequest('Ngày hiệu lực không được sau hôm nay.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (s.status === status) return s;
  if (s.archived_at) throw badRequest(CAU_LUU_TRU);   // OV-11d (Q4): em Lưu trữ về đang học chỉ qua Học lại / Bỏ lưu trữ
  if (status === 'active' && s.status === 'inactive') {
    const tamDung = (conn.prepare(`SELECT MAX(event_date) d FROM journey_events WHERE student_id = ? AND event_type = 'pause'`).get(studentId) as any)?.d as string | null;
    if (tamDung && date < tamDung) throw badRequest(`Ngày quay lại không được trước ngày tạm dừng (${tamDung.split('-').reverse().join('/')}).`);
  }
  /* PR-S6F-b: ngày Tạm dừng không trước lần Quay lại gần nhất — `khoangTamDung` ghép cặp theo ngày, ghi lùi thì mất khoảng đang dừng. */
  if (status === 'inactive') {
    const quayLai = (conn.prepare(`SELECT MAX(event_date) d FROM journey_events WHERE student_id = ? AND event_type = 'resume'`).get(studentId) as any)?.d as string | null;
    if (quayLai && date < quayLai) throw badRequest(`Ngày tạm dừng không được trước lần quay lại học gần nhất (${quayLai.slice(8, 10)}/${quayLai.slice(5, 7)}).`);
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
  let archivedAt: string | null = status === 'finished' ? date : null;
  return tx(() => {
    /* PR-TK (TK-L) → OV-8a: Kết thúc học đóng lộ trình FT thì CHƯA lưu trữ — chờ kết quả thi thật rồi Quản lý chọn Bước tiếp (Kết thúc = Lưu trữ, `buocTiep.ts`). */
    if (archivedAt && conn.prepare(`SELECT 1 FROM learning_cycles WHERE student_id = ? AND status = 'active' AND route IS NOT NULL`).get(studentId)) archivedAt = null;
    /* PR-LUI-b: nhớ ĐÚNG những ghi danh / lộ trình lần Kết thúc học này đóng (+ Case / tín hiệu, bên dưới) — Học lại và Hoàn tác chỉ đụng chúng, không đụng cái đã đóng từ trước. */
    const dongBoiLanNay = status === 'finished' ? {
      ghiDanhDong: (conn.prepare(`SELECT id, status AS truoc FROM enrollments WHERE student_id = ? AND status IN ('active','paused')`).all(studentId) as any[]).map((r) => ({ id: r.id as number, truoc: r.truoc as string })),
      loTrinhDong: (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).all(studentId) as any[]).map((r) => r.id as number),
    } : null;
    /* OV-11d (HV-21): nhớ ghi danh lần Tạm dừng này dừng — Hoàn tác trả đúng chúng về `active`. */
    const ghiDanhDung = status === 'inactive'
      ? (conn.prepare(`SELECT id FROM enrollments WHERE student_id = ? AND status = 'active'`).all(studentId) as any[]).map((r) => r.id as number) : null;
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
    let dongCase: ChupCaseDong[] = []; let rutTinHieu: number[] = [];
    if (status === 'finished') {
      const cs = closeCasesBySystem({ actorUserId: p.userId, studentId, reason: 'course_ended', on: date });
      dongCase = cs.chup; rutTinHieu = cs.withdrawnSignalIds;
      conn.prepare(`UPDATE learning_cycles SET status = 'abandoned', ended_at = ? WHERE student_id = ? AND status = 'active'`)
        .run(date, studentId);
      /* PR-TK: cùng giao dịch; mọi đường Kết thúc học (một em, nhiều em, dừng học ở Chuyển tiếp) đều đi qua đây. */
      ghiBanChup(conn, dongBoiLanNay!.loTrinhDong, { lyDo: 'ket_thuc', ngay: date });
    }
    const journeyId = addJourney({
      studentId, eventType: status === 'inactive' ? 'pause' : status === 'active' ? 'resume' : 'finish',
      eventDate: date,
      title: status === 'inactive' ? 'Tạm dừng học' : status === 'active' ? 'Quay lại học' : 'Kết thúc học',
      detail: reason ?? null, createdBy: p.userId,
    });
    /* PR-Pb2-b (Q14, T65): Quay lại học → hạn xử lý vi phạm chưa phản hồi chốt lại từ ngày quay lại (sau `addJourney` — mốc đọc sự kiện resume). */
    if (status === 'active' && s.status === 'inactive') chotHanXuLy([studentId], { ghiDe: true });
    writeAudit({ actorUserId: p.userId, action: 'student.status', entityType: 'student', entityId: studentId,
      entityLabel: s.student_code, before: { status: s.status }, after: { status, date, reason, archivedAt, ...dongBoiLanNay, dongCase, rutTinHieu, ...(ghiDanhDung ? { ghiDanhDung, journeyId } : {}) } });
    if (curEnr && status !== 'active') dongLopNeuHet([curEnr.class_id], date);
    return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}

/** Nhật ký lần Kết thúc học GẦN NHẤT của em (`student.status` → finished): đúng id ghi danh / lộ trình / Case đã đóng. Em kết thúc từ trước PR-LUI-b thì không có → `null`. */
type NhatKyKetThuc = {
  ghiDanhDong: { id: number; truoc: string }[]; loTrinhDong: number[]; dongCase: ChupCaseDong[]; rutTinHieu: number[]; truocStatus: string;
};
function nhatKyKetThucGanNhat(studentId: number): NhatKyKetThuc | null {
  const r = db().prepare(`SELECT before_json, after_json FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action = 'student.status' ORDER BY id DESC LIMIT 1`).get(studentId) as any;
  try {
    const a = JSON.parse(r?.after_json ?? 'null');
    if (a?.status !== 'finished' || !Array.isArray(a.ghiDanhDong)) return null;
    return {
      ghiDanhDong: a.ghiDanhDong.map((x: any) => (typeof x === 'number' ? { id: x, truoc: 'active' } : x)), loTrinhDong: a.loTrinhDong ?? [],
      dongCase: a.dongCase ?? [], rutTinHieu: a.rutTinHieu ?? [], truocStatus: JSON.parse(r.before_json ?? '{}')?.status ?? 'active',
    };
  } catch { return null; }
}
/** Hành động `student.status` / `student.rejoin` mới nhất của em — Hoàn tác chỉ cho việc ĐANG là việc cuối. */
function viecTrangThaiCuoi(studentId: number): { action: string; before: any; after: any } | null {
  const r = db().prepare(`SELECT action, before_json, after_json FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action IN ('student.status', 'student.rejoin', 'student.rejoin_undo', 'student.finish_undo', 'student.pause_undo', 'student.transfer') ORDER BY id DESC LIMIT 1`).get(studentId) as any;
  if (!r) return null;
  try { return { action: r.action, before: JSON.parse(r.before_json ?? 'null'), after: JSON.parse(r.after_json ?? 'null') }; } catch { return null; }
}
function targetCu(studentId: number, c?: any): string {
  const cy = c ?? db().prepare('SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1').get(studentId) as any;
  return chuTargetKck(cy?.target_score ?? null, !!cy?.khong_cam_ket);   // OV-9: "6.5 KCK" · "KCK" · "6.5" · ""
}
const tenLoTrinh = (c: { route?: string | null; programme_code?: string | null } | null | undefined): string | null => (c ? c.route ?? c.programme_code ?? null : null);

/**
 * HỌC LẠI (PR-LUI-b, chủ sản phẩm 06/10) — đường lui của "Kết thúc học", CHỈ Quản lý / Quản trị (`cycle.edit` của học viên; PR-OV2a: Admin có `plan.week` nhưng không học lại được). CHỌN ĐÍCH:
 *  (a) VỀ LỚP CŨ (`lopMoiId` trống): làm ngược đúng những gì `setStudentStatus(…, 'finished')` đã làm — về ghi danh `completed` mà CHÍNH lần đó đóng, lộ trình bị đóng LÚC ĐÓ
 *      (`abandoned`) chạy tiếp, ra khỏi Lưu trữ. Lộ trình đã đóng bằng Kết luận (`completed`) thì không có gì chạy tiếp → mở lộ trình MỚI ở lớp cũ. Lớp cũ đã kết thúc: `moLaiLop` = true
 *      thì mở lại lớp CÙNG giao dịch, không thì 400.
 *  (b) SANG LỚP MỚI (`lopMoiId`): lớp đang hoạt động ≠ lớp cũ; ghi danh mới, lộ trình MỚI theo luật lộ trình (`moLoTrinhMoi`), lộ trình cũ ở nguyên `abandoned` (giữ ở
 *      Hành trình), ghi danh cũ ở nguyên `completed`. Sang Fast Track từ lớp thường bắt buộc Target (như `transferStudent`). Không đòi quyền ở lớp mới (Q3, 23/09).
 * Case đã đóng "Học viên kết thúc khoá" GIỮ đóng. Ghi `resume` ("Học lại") để hạn Ý thức / Case tính lại từ ngày học lại như Quay lại học. Nhật ký `student.rejoin` ghi đủ id để `hoanTacHocLai` gỡ đúng.
 */
export function hocLai(p: Principal, studentId: number, o: {
  date?: string; lyDo?: unknown; moLaiLop?: boolean; lopMoiId?: number | null; mucTieu?: number | string | null; thangThi?: string | null;
} = {}) {
  require_(p, PERMISSIONS.CYCLE_EDIT, { studentId }, 'Chỉ Quản lý mới cho học viên học lại được.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (s.status !== 'finished') throw badRequest('Chỉ cho học lại được học viên đã kết thúc học.');
  const date = o.date ?? demoToday();
  if (!isIsoDate(date)) throw badRequest('Ngày không hợp lệ.');
  if (date > demoToday()) throw badRequest('Ngày hiệu lực không được sau hôm nay.');
  if (s.finished_at && date < s.finished_at) throw badRequest(`Ngày học lại không được trước ngày kết thúc học (${String(s.finished_at).split('-').reverse().join('/')}).`);
  const lyDo = chuTuDo(o.lyDo, 'Lý do', 2000);
  /*
   * Ghi danh bị `setStudentStatus(…, 'finished')` đóng: nhật ký lần Kết thúc học ghi đúng id. Em kết thúc từ trước PR-LUI-b (không có id) thì dùng quy tắc cũ: mọi dòng `completed` chưa có
   * `ended_at` (kết thúc học không đặt `ended_at`; chuyển lớp thì có), không có nữa thì dòng `completed` mới nhất. `enr` = dòng mới nhất (lớp "cũ" để hiện, và để so lớp mới).
   */
  const dongCompleted = conn.prepare(
    `SELECT e.id, e.class_id, e.ended_at, e.end_kind, c.code, c.status AS class_status, c.finished_at AS class_finished_at, c.programme_code, c.is_fast_track, c.route, c.branch_id,
            b.name AS branch_name
       FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id WHERE e.student_id = ? AND e.status = 'completed' ORDER BY e.id DESC`,
  ).all(studentId) as any[];
  const nhatKy = nhatKyKetThucGanNhat(studentId);
  const khoiPhuc = nhatKy
    ? dongCompleted.filter((e) => nhatKy.ghiDanhDong.some((x) => x.id === e.id))
    : dongCompleted.some((e) => e.ended_at == null) ? dongCompleted.filter((e) => e.ended_at == null) : dongCompleted.slice(0, 1);
  const enr = khoiPhuc[0];
  if (!enr) throw badRequest('Học viên chưa có lớp nào để học lại — dùng Chuyển lớp để xếp lớp.');
  const lopDong = [...new Map(khoiPhuc.filter((e) => e.class_status === 'finished').map((e) => [e.class_id, e])).values()];
  const lopDaDong = lopDong.length > 0;

  /* (b) sang lớp mới */
  const lopMoi = o.lopMoiId ? lopDichHopLe(Number(o.lopMoiId), enr.class_id) : null;
  if (o.lopMoiId && !lopMoi) throw badRequest('Lớp chuyển đến không hợp lệ.');
  const tuLop: LoaiLop = { ma: (enr.programme_code ?? null) as ProgrammeCode | null, ft: !!enr.is_fast_track, lt: enr.route };
  const denLop: LoaiLop | null = lopMoi ? { ma: (lopMoi.programme_code ?? null) as ProgrammeCode | null, ft: !!lopMoi.is_fast_track, lt: lopMoi.route } : null;
  const tg = o.mucTieu === undefined || o.mucTieu === null || o.mucTieu === '' ? null : docTarget(o.mucTieu);
  if (denLop?.ft && !tuLop.ft && !tg) throw badRequest('Lên FT cần Target.');
  /* Dự kiến thi của lộ trình MỚI: cùng cách kiểm với ô Dự kiến thi ở hồ sơ (`docDuKienThi`, cận năm, độ dài). */
  const thangThi = lopMoi && o.thangThi ? docDuKienThi({}, o.thangThi) : null;
  if (!lopMoi && lopDaDong && !o.moLaiLop) throw badRequest(`Lớp ${lopDong[0].code} đã kết thúc — mở lại lớp để học viên học lại.`);

  return tx(() => {
    conn.prepare(`UPDATE students SET status = 'active', finished_at = NULL, archived_at = NULL WHERE id = ?`).run(studentId);
    const cuCycle = conn.prepare(
      `SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'abandoned' AND ended_at IS ? ORDER BY seq DESC LIMIT 1`,
    ).get(studentId, s.finished_at ?? null) as any;
    const moi: { ghiDanhId: number | null; loTrinhId: number | null } = { ghiDanhId: null, loTrinhId: null };
    const lopMoLai: { id: number; finishedAt: string | null }[] = [];
    let ghiDanhKhoiPhuc: { id: number; truoc: string | null }[] = [];
    let loTrinhKhoiPhuc: number[] = [];
    let cycleId: number | null = cuCycle?.id ?? null;
    let tgDoi = doiTg(null, null);   // OV-13o: lộ trình mới ở lớp mới đổi Target / KCK → Lịch sử sửa có dòng
    if (lopMoi && denLop) {
      /* ghi danh cũ + lộ trình cũ ở nguyên; ghi danh mới + lộ trình mới */
      const ins = conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
        .run(studentId, lopMoi.id, date, nowIso());
      moi.ghiDanhId = Number(ins.lastInsertRowid);
      conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(lopMoi.branch_id, studentId);
      moi.loTrinhId = cycleId = moLoTrinhMoi(p, { sid: studentId, ngay: date, toClass: lopMoi, tuLop, denLop, cuCycle, target: tg?.target ?? null, kck: !!tg?.kck, thangThi }).moiId;
      tgDoi = doiTg(cuCycle, conn.prepare('SELECT target_score, khong_cam_ket FROM learning_cycles WHERE id = ?').get(moi.loTrinhId) as any);
      thongBaoChuyenVao({
        sid: studentId, tenHocVien: s.full_name, enrollmentMoiId: moi.ghiDanhId, actorUserId: p.userId,
        tuMa: enr.code, tuChiNhanh: enr.branch_name, doiChiNhanh: enr.branch_id !== lopMoi.branch_id, lyDo, denLop: { id: lopMoi.id, code: lopMoi.code, branchId: lopMoi.branch_id },
      });
    } else {
      for (const l of lopDong) lopMoLai.push({ id: l.class_id, finishedAt: moLaiLop(p, l.class_id, { lyDo: `Học lại: ${s.full_name}` }).finishedAt });
      ghiDanhKhoiPhuc = khoiPhuc.map((e) => ({ id: e.id as number, truoc: (e.end_kind ?? null) as string | null }));
      conn.prepare(`UPDATE enrollments SET status = 'active', end_kind = NULL WHERE id IN (${khoiPhuc.map(() => '?').join(',')})`).run(...khoiPhuc.map((e) => e.id));
      /* Mọi lộ trình bị đóng LÚC Kết thúc học chạy tiếp — dữ liệu cũ có thể có hơn một lộ trình đang chạy. */
      const dongLanNay = (nhatKy
        ? nhatKy.loTrinhDong.length ? conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'abandoned' AND id IN (${nhatKy.loTrinhDong.map(() => '?').join(',')})`).all(studentId, ...nhatKy.loTrinhDong) : []
        : conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'abandoned' AND ended_at IS ?`).all(studentId, s.finished_at ?? null)) as any[];
      loTrinhKhoiPhuc = dongLanNay.map((r) => r.id as number);
      for (const id of loTrinhKhoiPhuc) conn.prepare(`UPDATE learning_cycles SET status = 'active', ended_at = NULL WHERE id = ?`).run(id);
      /* Lộ trình đã đóng bằng Kết luận (`completed`) thì không có gì chạy tiếp → mở lộ trình MỚI ở lớp cũ (như vào lớp lần đầu), giữ Target / Dự kiến thi theo luật PR-NT. */
      if (!conn.prepare(`SELECT 1 FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(studentId)) {
        const lopCu = conn.prepare('SELECT * FROM classes WHERE id = ?').get(enr.class_id) as any;
        const gan = conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1').get(studentId) as any;
        /* OV-13m: Target gửi kèm (Bước tiếp "Target · Sửa") → lộ trình mới mang Target đó; không gửi → giữ Target cũ như trước. */
        moi.loTrinhId = cycleId = moLoTrinhMoi(p, { sid: studentId, ngay: date, toClass: lopCu, tuLop, denLop: tuLop, cuCycle: gan ?? null, target: tg?.target ?? null, kck: !!tg?.kck }).moiId;
      }
    }
    datLaiHanCase(studentId, date);
    addJourney({
      studentId, cycleId, eventType: 'resume', eventDate: date, title: 'Học lại',
      detail: [lyDo, lopMoi ? `sang lớp ${lopMoi.code}` : null].filter(Boolean).join(' — ') || null, createdBy: p.userId,
    });
    chotHanXuLy([studentId], { ghiDe: true });   // sau `addJourney`: mốc đọc sự kiện `resume`
    writeAudit({
      actorUserId: p.userId, action: 'student.rejoin', entityType: 'student', entityId: studentId, entityLabel: s.student_code,
      before: { status: 'finished', finishedAt: s.finished_at, archivedAt: s.archived_at, branchId: s.branch_id, ...tgDoi.truoc },
      after: { ...tgDoi.sau, status: 'active', date, lyDo, classId: lopMoi?.id ?? enr.class_id, lopMoi: !!lopMoi, moLaiLop: !lopMoi && lopDaDong, soGhiDanh: khoiPhuc.length, ghiDanhKhoiPhuc, loTrinhKhoiPhuc, lopMoLai, moi },
    });
    return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}

/**
 * HOÀN TÁC HỌC LẠI (PR-LUI-b, sau rà #213) — đưa học viên về ĐÚNG trạng thái ngay sau lần Kết thúc học (ngày kết thúc, ngày lưu trữ cũ), chỉ khi Học lại vẫn là việc trạng thái CUỐI của em.
 * Về lớp cũ: ghi danh / lộ trình mở lại đóng lại như cũ; lớp được mở cùng lúc đóng lại (nếu không còn ai đang học). Sang lớp mới / lộ trình mới: gỡ ghi danh, lộ trình, lịch mặc định và
 * chuông chuyển vào — CHỈ khi lộ trình mới chưa có điểm / dữ liệu nào (409, báo rõ, nếu đã có).
 */
export function hoanTacHocLai(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.CYCLE_EDIT, { studentId }, 'Chỉ Quản lý mới hoàn tác được việc Học lại.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  const cuoi = viecTrangThaiCuoi(studentId);
  if (s.status !== 'active' || cuoi?.action !== 'student.rejoin') throw conflict('Không còn hoàn tác được — học viên đã đổi trạng thái hoặc chuyển lớp sau lần Học lại.');
  const { before: b, after: a } = cuoi;
  const moi: { ghiDanhId: number | null; loTrinhId: number | null } = a.moi ?? { ghiDanhId: null, loTrinhId: null };
  return tx(() => {
    if (moi.loTrinhId) {
      /* Chỉ gỡ khi lộ trình mới còn "trắng": mọi lượt còn `planned`, không bảng nào khác tham chiếu lượt / lộ trình (trừ Hành trình, lịch từng kỹ năng). */
      const luot = (conn.prepare('SELECT id, status FROM assessment_attempts WHERE cycle_id = ?').all(moi.loTrinhId) as any[]);
      const co = (n: string) => conflict(`Lộ trình mới đã có ${n} — không hoàn tác được.`);
      if (luot.some((l) => l.status !== 'planned')) throw co('điểm / bài đã làm');
      const refs = (bang: string, cot: string, ids: number[]) => (ids.length
        ? (conn.prepare(`SELECT COUNT(*) n FROM ${bang} WHERE ${cot} IN (${ids.map(() => '?').join(',')})`).get(...ids) as any).n : 0) as number;
      const canhLuot = conn.prepare(`SELECT m.name AS bang, f."from" AS cot FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) f WHERE m.type = 'table' AND f."table" = 'assessment_attempts' AND m.name != 'attempt_skills'`).all() as any[];
      /* Lịch MT mặc định (`taoMtMacDinh` ghi `attempt_schedule_history` action 'created') do máy tự tạo — không tính là dữ liệu của người dùng; gỡ cùng lượt. */
      const idLuot = luot.map((l) => l.id as number);
      for (const c of canhLuot) {
        const n = c.bang === 'attempt_schedule_history' && idLuot.length
          ? (conn.prepare(`SELECT COUNT(*) n FROM attempt_schedule_history WHERE attempt_id IN (${idLuot.map(() => '?').join(',')}) AND action != 'created'`).get(...idLuot) as any).n as number
          : refs(c.bang, c.cot, idLuot);
        if (n > 0) throw co('dữ liệu theo bài');
      }
      if (idLuot.length) conn.prepare(`DELETE FROM attempt_schedule_history WHERE attempt_id IN (${idLuot.map(() => '?').join(',')})`).run(...idLuot);
      const canhCycle = conn.prepare(`SELECT m.name AS bang, f."from" AS cot FROM sqlite_master m JOIN pragma_foreign_key_list(m.name) f WHERE m.type = 'table' AND f."table" = 'learning_cycles' AND m.name NOT IN ('assessment_attempts', 'journey_events')`).all() as any[];
      for (const c of canhCycle) if (refs(c.bang, c.cot, [moi.loTrinhId]) > 0) throw co('dữ liệu theo lộ trình');
      for (const l of luot) conn.prepare('DELETE FROM attempt_skills WHERE attempt_id = ?').run(l.id);
      conn.prepare('DELETE FROM assessment_attempts WHERE cycle_id = ?').run(moi.loTrinhId);
      conn.prepare('UPDATE journey_events SET cycle_id = NULL WHERE cycle_id = ?').run(moi.loTrinhId);
      conn.prepare('DELETE FROM learning_cycles WHERE id = ?').run(moi.loTrinhId);
    }
    if (moi.ghiDanhId) {
      conn.prepare(`DELETE FROM notifications WHERE dedup_key = ?`).run(`transfer:${moi.ghiDanhId}`);
      conn.prepare('DELETE FROM enrollments WHERE id = ?').run(moi.ghiDanhId);
    }
    for (const e of (a.ghiDanhKhoiPhuc ?? []) as { id: number; truoc: string | null }[]) {
      conn.prepare(`UPDATE enrollments SET status = 'completed', end_kind = ? WHERE id = ?`).run(e.truoc, e.id);
    }
    /* PR-TK: đóng lại lộ trình đã mở lại → bản chụp MỚI (`lan` kế tiếp); bản cũ giữ nguyên. */
    const dongLai: number[] = [];
    for (const id of (a.loTrinhKhoiPhuc ?? []) as number[]) {
      if (conn.prepare(`UPDATE learning_cycles SET status = 'abandoned', ended_at = ? WHERE id = ? AND status = 'active'`).run(b.finishedAt, id).changes) dongLai.push(id);
    }
    if (moi.loTrinhId && !moi.ghiDanhId) {
      for (const r of conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).all(studentId) as any[]) dongLai.push(r.id as number);
      conn.prepare(`UPDATE learning_cycles SET status = 'abandoned', ended_at = ? WHERE student_id = ? AND status = 'active'`).run(b.finishedAt, studentId);
    }
    ghiBanChup(conn, dongLai, { lyDo: 'ket_thuc', ngay: b.finishedAt ?? demoToday() });
    conn.prepare('UPDATE students SET status = ?, finished_at = ?, archived_at = ?, branch_id = ? WHERE id = ?').run('finished', b.finishedAt, b.archivedAt, b.branchId ?? s.branch_id, studentId);
    for (const l of (a.lopMoLai ?? []) as { id: number; finishedAt: string | null }[]) {
      const conHoc = conn.prepare(`SELECT 1 FROM enrollments WHERE class_id = ? AND status = 'active'`).get(l.id);
      if (conHoc) continue;   // còn em đang học (kể cả em khác cũng vừa Học lại vào lớp) → lớp ở lại hoạt động
      const dong = conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ? AND status = 'active'`).run(l.finishedAt, l.id).changes;
      if (dong) {
        writeAudit({ actorUserId: p.userId, action: 'class.finished', entityType: 'class', entityId: l.id, entityLabel: (conn.prepare('SELECT code FROM classes WHERE id = ?').get(l.id) as any)?.code,
          before: { status: 'active' }, after: { status: 'finished', on: l.finishedAt, lyDo: `Hoàn tác Học lại: ${s.full_name}` } });
      }
    }
    addJourney({ studentId, eventType: 'finish', eventDate: demoToday(), title: 'Hoàn tác Học lại', detail: null, createdBy: p.userId });
    writeAudit({ actorUserId: p.userId, action: 'student.rejoin_undo', entityType: 'student', entityId: studentId, entityLabel: s.student_code, before: a, after: { status: 'finished', finishedAt: b.finishedAt, archivedAt: b.archivedAt } });
    return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}

/**
 * HOÀN TÁC KẾT THÚC HỌC (PR-LUI-b, chủ sản phẩm 06/10) — mở lại ĐÚNG ghi danh / lộ trình / Case / PA / tín hiệu mà CHÍNH lần Kết thúc học gần nhất đóng (nhật ký ghi id + trạng thái cũ);
 * cái đóng từ trước giữ đóng. Chỉ khi Kết thúc học vẫn là việc trạng thái CUỐI. Lớp tự đóng vì lần đó thì mở lại. Khác `hocLai`: Case đóng được mở lại.
 */
export function hoanTacKetThuc(p: Principal, studentId: number) {
  /* OV-8b: TVV / CX Thôi học được thì Hoàn tác được. */
  if (!can(p, PERMISSIONS.STUDENT_EDIT_MORE, { studentId })) require_(p, PERMISSIONS.CYCLE_EDIT, { studentId }, 'Chỉ Quản lý mới hoàn tác được việc Kết thúc học.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  const cuoi = viecTrangThaiCuoi(studentId);
  const nk = nhatKyKetThucGanNhat(studentId);
  /* OV-11d: Học lại rồi Hoàn tác Học lại (`rejoin_undo`) trả đúng trạng thái ngay sau Kết thúc học — vẫn hoàn tác được (Bước tiếp đổi lựa chọn). */
  if (s.status !== 'finished' || (cuoi?.action !== 'student.status' && cuoi?.action !== 'student.rejoin_undo') || !nk) throw conflict('Không còn hoàn tác được — học viên đã đổi trạng thái hoặc chuyển lớp sau lần Kết thúc học.');
  return tx(() => {
    const date = demoToday();
    conn.prepare('UPDATE students SET status = ?, finished_at = NULL, archived_at = NULL WHERE id = ?').run(nk.truocStatus === 'inactive' ? 'inactive' : 'active', studentId);
    for (const e of nk.ghiDanhDong) {
      conn.prepare('UPDATE enrollments SET status = ?, end_kind = ? WHERE id = ?').run(e.truoc, e.truoc === 'paused' ? 'bao_luu' : null, e.id);
      const l = conn.prepare(`SELECT c.id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.id = ? AND c.status = 'finished'`).get(e.id) as any;
      if (l) moLaiLop(p, l.id, { lyDo: `Hoàn tác Kết thúc học: ${s.full_name}`, heQua: true });
    }
    for (const id of nk.loTrinhDong) conn.prepare(`UPDATE learning_cycles SET status = 'active', ended_at = NULL WHERE id = ? AND student_id = ? AND status = 'abandoned'`).run(id, studentId);
    const cs = moLaiCaseHeThongDong({ actorUserId: p.userId, studentId, reason: 'course_ended', chup: nk.dongCase, tinHieu: nk.rutTinHieu });
    if (cs.moLai.length) datLaiHanCase(studentId, date);
    addJourney({ studentId, eventType: 'resume', eventDate: date, title: 'Hoàn tác Kết thúc học', detail: null, createdBy: p.userId });
    writeAudit({ actorUserId: p.userId, action: 'student.finish_undo', entityType: 'student', entityId: studentId, entityLabel: s.student_code,
      before: { status: 'finished', finishedAt: s.finished_at, archivedAt: s.archived_at }, after: { status: nk.truocStatus, caseMoLai: cs.moLai, caseBoQua: cs.boQua } });
    return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}

/**
 * HOÀN TÁC TẠM DỪNG (OV-11d, HV-21) — bấm nhầm Tạm dừng: trả NGUYÊN TRẠNG (em đang học, đúng ghi danh lần đó dừng, bỏ mốc "Tạm dừng học" của lần đó),
 * KHÔNG tính lại hạn Case / Ý thức (khác Quay lại học — hạn chưa từng dừng). Chỉ khi Tạm dừng vẫn là việc trạng thái CUỐI. Ai Tạm dừng được thì Hoàn tác được.
 * Lớp tự đóng vì lần dừng đó (em là người cuối) thì mở lại.
 */
export function hoanTacTamDung(p: Principal, studentId: number) {
  if (!can(p, PERMISSIONS.STUDENT_EDIT_MORE, { studentId })) require_(p, PERMISSIONS.STUDENT_EDIT, { studentId });
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  const cuoi = viecTrangThaiCuoi(studentId);
  if (s.status !== 'inactive' || cuoi?.action !== 'student.status' || cuoi.after?.status !== 'inactive' || cuoi.before?.status !== 'active' || !Array.isArray(cuoi.after?.ghiDanhDung)) {
    throw conflict('Không còn hoàn tác được — học viên đã đổi trạng thái sau lần Tạm dừng.');
  }
  const { ghiDanhDung, journeyId } = cuoi.after as { ghiDanhDung: number[]; journeyId?: number };
  return tx(() => {
    conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(studentId);
    for (const id of ghiDanhDung) {
      conn.prepare(`UPDATE enrollments SET status = 'active', end_kind = NULL WHERE id = ? AND student_id = ? AND status = 'paused'`).run(id, studentId);
      const l = conn.prepare(`SELECT c.id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.id = ? AND c.status = 'finished'`).get(id) as any;
      if (l) moLaiLop(p, l.id, { lyDo: `Hoàn tác Tạm dừng: ${s.full_name}`, heQua: true });
    }
    if (journeyId) conn.prepare(`DELETE FROM journey_events WHERE id = ? AND student_id = ? AND event_type = 'pause'`).run(journeyId, studentId);
    writeAudit({ actorUserId: p.userId, action: 'student.pause_undo', entityType: 'student', entityId: studentId, entityLabel: s.student_code,
      before: { status: 'inactive', ...cuoi.after }, after: { status: 'active' } });
    return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}

/**
 * BƯỚC TIẾP SAU THI THẬT (OV-12a, chủ SP 14/10): Quản lý (`cycle.edit`) HOẶC TVV của chi nhánh em (`student.edit_more` của vai TVV — CX không).
 * Một hàm cho `loTrinh/buocTiep.ts` (chọn / bỏ / việc / nút) và danh sách lớp của panel Học lại mở từ Bước tiếp.
 */
export function coQuyenBuocTiep(p: Principal, studentId: number): boolean {
  return can(p, PERMISSIONS.CYCLE_EDIT, { studentId })
    || can({ ...p, grants: p.grants.filter((g) => g.roleKey === 'consultant') }, PERMISSIONS.STUDENT_EDIT_MORE, { studentId });
}

/** GET /students/:id/hoc-lai/lop-dich — lớp cũ + lộ trình sẽ chạy tiếp (hay mở mới) + lớp ĐANG hoạt động để chọn "Sang lớp mới" (panel Học lại). Quản lý / Quản trị của học viên;
 * OV-12a: TVV của chi nhánh cũng đọc được (chỉ đọc — panel Học lại mở từ Bước tiếp sau thi; Học lại thẳng `/hoc-lai` vẫn chỉ Quản lý). */
export function lopChoHocLai(p: Principal, studentId: number) {
  if (!coQuyenBuocTiep(p, studentId)) throw forbidden('Chỉ Quản lý mới cho học viên học lại được.');
  const conn = db();
  /* OV-11d (HV-6): em còn ghi danh (Bước tiếp sau lộ trình đã đóng) — lớp cũ = lớp đang giữ; máy chủ Kết thúc học rồi Học lại cùng giao dịch, lộ trình MỚI. */
  const conHoc = (conn.prepare('SELECT status FROM students WHERE id = ?').get(studentId) as any)?.status !== 'finished';
  const nk = conHoc ? null : nhatKyKetThucGanNhat(studentId);
  const dong = conn.prepare(
    `SELECT e.id, e.class_id, e.ended_at, c.code, c.status AS class_status, c.programme_code, c.route, c.is_fast_track FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ? AND e.status IN (${conHoc ? "'active', 'paused'" : "'completed'"}) ORDER BY e.id DESC`,
  ).all(studentId) as any[];
  const khoi = conHoc ? dong.slice(0, 1) : nk ? dong.filter((e) => nk.ghiDanhDong.some((x) => x.id === e.id)) : dong.some((e) => e.ended_at == null) ? dong.filter((e) => e.ended_at == null) : dong.slice(0, 1);
  const enr = khoi[0] ?? null;
  const dongBoi = conHoc ? [] : (nk && nk.loTrinhDong.length
    ? conn.prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'abandoned' AND id IN (${nk.loTrinhDong.map(() => '?').join(',')}) ORDER BY seq DESC`).all(studentId, ...nk.loTrinhDong)
    : nk ? [] : conn.prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'abandoned' ORDER BY seq DESC LIMIT 1`).all(studentId)) as any[];
  /* OV-12a: TVV (không `cycle.edit`) chỉ thấy lớp chi nhánh của vai TVV — cùng phạm vi `chonBuocTiep` cho Học tiếp. */
  const ds = danhSachLopDich(enr?.class_id ?? -1, true);
  const cnTvv = can(p, PERMISSIONS.CYCLE_EDIT, { studentId }) ? null
    : new Set(p.grants.filter((g) => g.roleKey === 'consultant').map((g) => g.branchId));
  const dsLop = cnTvv ? { ...ds, lop: ds.lop.filter((l) => cnTvv.has(null) || cnTvv.has(l.chiNhanhId)) } : ds;
  return {
    conHoc,
    lopCu: enr ? { id: enr.class_id as number, code: enr.code as string, daKetThuc: enr.class_status === 'finished', ft: !!enr.is_fast_track } : null,
    /** `chayTiep`: lộ trình bị Kết thúc học đóng chạy tiếp; không có (đã đóng bằng Kết luận) thì Học lại về lớp cũ mở lộ trình MỚI — tên là của lộ trình đó. */
    /* `target`: Target của lộ trình gần nhất ("6.5 KCK" / 'KCK' = có dấu KCK, '' = chưa có) — Học lại FT → FT máy chủ GIỮ Target này, web điền sẵn chứ không bắt nhập lại. */
    loTrinh: { chayTiep: dongBoi.length > 0, ten: tenLoTrinh(dongBoi[0]) ?? tenLoTrinh(enr), target: targetCu(studentId, dongBoi[0]) },
    ...dsLop,
  };
}

/**
 * LƯU TRỮ HỌC VIÊN — QUẢN LÝ BẤM (RB-9, quyết định 4.17 ngày 22/09/2026), và từ PR-XOA (24/09) em thôi học TỰ vào Lưu trữ ngay lúc
 * `setStudentStatus(…, 'finished')`. Nút này còn dùng khi QL đã "Bỏ lưu trữ" rồi muốn lưu trữ lại.
 *
 * Không có tác vụ ngầm "sau N ngày tự lưu trữ" (hàm `archiveDueStudents` cũ đã gỡ — nó chưa từng được gọi ở đâu ngoài phép kiểm).
 * Lưu trữ chỉ ẩn khỏi danh sách mặc định: không đổi trạng thái, không xoá dữ liệu, không đóng việc còn dở. Chỉ em đã kết thúc học.
 */
export function archiveStudent(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.CYCLE_EDIT, { studentId }, 'Chỉ Quản lý mới lưu trữ được học viên.');
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
  require_(p, PERMISSIONS.CYCLE_EDIT, { studentId }, 'Chỉ Quản lý mới bỏ lưu trữ được học viên.');
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  if (!s.archived_at) return s;
  conn.prepare('UPDATE students SET archived_at = NULL WHERE id = ?').run(studentId);
  writeAudit({ actorUserId: p.userId, action: 'student.unarchive', entityType: 'student', entityId: studentId,
    entityLabel: s.student_code, before: { archivedAt: s.archived_at }, after: { archivedAt: null } });
  return conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
}

/**
 * Kiểm ở biên (PR-NHAP): họ tên không rỗng, ngày sinh có thật và không sau hôm nay (trống → NULL, OV-11d), email trống → NULL, có gõ thì đúng dạng (T8, PR-OV2c). Trả bản đã chuẩn
 * hoá; sai → 400. Chung cho `updateStudent` và Sửa cả lớp (PR-SL, kiểm trước khi ghi).
 */
export function chuanHoaSuaHoSo(patch: any) {
  patch = { ...patch };
  kiemKieuO(patch, ['fullName', 'dob', 'email', 'consultantName', 'note', 'phone', 'parentName', 'parentRelation', 'parentPhone'], ['consultantUserId'],
    (k) => ({ fullName: 'Họ tên', dob: 'Ngày sinh', email: 'Email', consultantName: 'Tư vấn viên', note: 'Ghi chú', consultantUserId: 'TVV', ...NHAN_LIEN_HE } as Record<string, string>)[k] ?? k);
  if (patch.fullName !== undefined) {
    patch.fullName = String(patch.fullName ?? '').trim();
    if (!patch.fullName) throw badRequest('Họ tên không được trống.');
  }
  if (patch.dob !== undefined) {
    const d = docNgayNhap(patch.dob, demoToday(), { toiThieu: NGAY_SINH_TOI_THIEU, toiDa: demoToday() });
    if (d.loi) throw badRequest('Ngày sinh: ' + d.loi);
    patch.dob = d.iso ?? null;   // OV-11d (Q3 chủ SP 14/10): không bắt buộc — trống = NULL (em thiếu nằm ở "Thiếu thông tin" để TVV cập nhật)
  }
  if (patch.email !== undefined) {
    const e = docEmail(patch.email);
    if (e.loi) throw badRequest('Email: ' + e.loi);
    patch.email = e.email;
  }
  /* OV-10b: liên hệ không bắt buộc — trống = xoá; câu lỗi không lặp lại số đã gõ (dữ liệu cá nhân). */
  for (const k of ['phone', 'parentPhone'] as const) {
    if (patch[k] === undefined) continue;
    const d = docSoDienThoai(patch[k]);
    if (d.loi) throw badRequest(`${NHAN_LIEN_HE[k]}: ${d.loi}.`);
    patch[k] = d.sdt;
  }
  for (const k of ['parentName', 'parentRelation'] as const) if (patch[k] !== undefined) patch[k] = chuTuDo(patch[k], NHAN_LIEN_HE[k], LIEN_HE_TOI_DA[k]);
  if (patch.consultantUserId !== undefined && patch.consultantUserId !== null) {
    const id = Number(patch.consultantUserId);
    if (!Number.isInteger(id) || !laTvvHoatDong(id)) throw badRequest('TVV: chọn một tài khoản Tư vấn viên đang hoạt động.');
    patch.consultantUserId = id;
  }
  return patch;
}

/** PR-OV2b: tài khoản vai TVV còn hoạt động (đã duyệt, chưa xoá, vai chưa gỡ). */
const TVV_SQL = `SELECT u.id, u.full_name, ur.branch_id, b.name AS cn FROM users u
  JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active' JOIN roles r ON r.id = ur.role_id AND r.key = 'consultant'
  LEFT JOIN branches b ON b.id = ur.branch_id
  WHERE u.status = 'active' AND u.approval_state = 'approved'`;
const laTvvHoatDong = (id: number) => !!db().prepare(`${TVV_SQL} AND u.id = ?`).get(id);

/** Chi nhánh của em: lớp đang học / tạm dừng mới nhất, không có thì `students.branch_id`. */
function chiNhanhCuaEm(studentId: number): number | null {
  const conn = db();
  return (conn.prepare(`SELECT c.branch_id b FROM enrollments e JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = ? AND e.status IN ('active','paused') ORDER BY e.id DESC LIMIT 1`).get(studentId) as any)?.b
    ?? (conn.prepare('SELECT branch_id b FROM students WHERE id = ?').get(studentId) as any)?.b ?? null;
}

/** OV-8b (chủ SP 13/10): TVV chia theo chi nhánh — gán TVV khác chi nhánh của em → 400. Không biết chi nhánh (`cn` null) thì không chặn. */
export function kiemTvvCungChiNhanh(id: number, cn: number | null) {
  if (cn != null && !db().prepare(`${TVV_SQL} AND u.id = ? AND ur.branch_id = ?`).get(id, cn)) {
    throw badRequest('TVV: chọn Tư vấn viên cùng chi nhánh của học viên.');
  }
}

/**
 * Ô chọn TVV (PR-OV2b; OV-8b chủ SP 13/10): CHỈ TVV đang hoạt động cùng chi nhánh của em (hoặc `branchId`), A→Z. Không biết chi nhánh → mọi TVV.
 * Dòng phụ "TVV · {chi nhánh}" (CX toàn hệ thống không phải TVV — không lọt).
 */
export function dsTvv(studentId: number | null, branchId?: number | null): { id: number; ten: string; phu: string }[] {
  const cn = branchId ?? (studentId == null ? null : chiNhanhCuaEm(studentId));
  const nguoi = new Map<number, { id: number; ten: string; cns: string[]; cung: boolean }>();
  for (const r of db().prepare(TVV_SQL).all() as any[]) {
    const x = nguoi.get(r.id) ?? { id: r.id, ten: r.full_name, cns: [] as string[], cung: false };
    if (r.cn && !x.cns.includes(r.cn)) x.cns.push(r.cn);
    if (cn != null && r.branch_id === cn) x.cung = true;
    nguoi.set(r.id, x);
  }
  return [...nguoi.values()].filter((x) => cn == null || x.cung).sort((a, b) => a.ten.localeCompare(b.ten, 'vi'))
    .map((x) => ({ id: x.id, ten: x.ten, phu: ['TVV', ...(x.cns.length ? x.cns : ['toàn hệ thống'])].join(' · ') }));
}

/**
 * ĐIỂM ĐẦU VÀO ở Sửa thông tin (PR-OV2b): đủ 4 kỹ năng → Overall tự tính (TB, làm tròn 0.5 như IELTS); thiếu kỹ năng → phải có Overall
 * (kỹ năng có gõ thì vẫn lưu); `null` → xoá. Ghi vào `learning_cycles.baseline_*` của lộ trình hiện tại (cùng chỗ dòng "Đầu vào" FT đọc).
 */
function docDauVao(v: any): { overall: number; bands: (number | null)[] } | null {
  if (v === null) return null;
  if (typeof v !== 'object' || Array.isArray(v)) throw badRequest('Điểm đầu vào không hợp lệ.');
  const band = (x: unknown, ten: string): number | null => {
    if (x === undefined || x === null || x === '') return null;
    const n = Number(x);
    if (!Number.isFinite(n) || n < 0 || n > 9 || n * 2 !== Math.round(n * 2)) throw badRequest(`Điểm đầu vào ${ten}: band 0–9, bước 0.5.`);
    return n;
  };
  const bands = [band(v.listening, 'L'), band(v.reading, 'R'), band(v.writing, 'W'), band(v.speaking, 'S')];
  const du = bands.every((b) => b !== null);
  const overall = du ? roundToHalf((bands as number[]).reduce((a, b) => a + b, 0) / 4) : band(v.overall, 'Overall');
  if (overall === null) throw badRequest('Điểm đầu vào: nhập đủ L R W S hoặc nhập Overall.');
  return { overall, bands };
}

/** PR-OV2a: trường `student.edit_info` (Admin, TVV, CX) sửa được ở hồ sơ — gửi trường khác thì 403. OV-8b: `student.edit_more` (TVV, CX) thêm ghi chú. OV-10b: liên hệ. */
const TRUONG_THONG_TIN = new Set(['fullName', 'dob', 'email', 'consultantName', 'consultantUserId', 'dauVao', 'phone', 'parentName', 'parentRelation', 'parentPhone']);

/**
 * OV-11d (HV-3, Q4): lộ trình của em đã Lưu trữ → 400 `CAU_LUU_TRU` (đường `/cycles/:id…`). Chỉ báo cho người xem được em — người ngoài phạm vi
 * đi tiếp tới kiểm quyền của hàm sửa (403), không biết em đã lưu trữ. Bỏ lưu trữ, Học lại không qua đây.
 */
export function chanLuuTru(p: Principal, cycleId: number) {
  const r = db().prepare('SELECT s.id, s.archived_at FROM learning_cycles c JOIN students s ON s.id = c.student_id WHERE c.id = ?').get(cycleId) as any;
  if (r?.archived_at && can(p, PERMISSIONS.STUDENT_VIEW, { studentId: r.id })) throw badRequest(CAU_LUU_TRU);
}

/** Như `chanLuuTru` nhưng theo học viên (`POST /students/:id/cycles`). */
export function chanLuuTruHv(p: Principal, studentId: number) {
  const r = db().prepare('SELECT archived_at FROM students WHERE id = ?').get(studentId) as any;
  if (r?.archived_at && can(p, PERMISSIONS.STUDENT_VIEW, { studentId })) throw badRequest(CAU_LUU_TRU);
}

export function updateStudent(p: Principal, studentId: number, patch: any) {
  if (!can(p, PERMISSIONS.STUDENT_EDIT, { studentId })) {
    require_(p, PERMISSIONS.STUDENT_EDIT_INFO, { studentId });
    const ghiChu = can(p, PERMISSIONS.STUDENT_EDIT_MORE, { studentId });
    if (Object.keys(patch ?? {}).some((k) => !TRUONG_THONG_TIN.has(k) && !(k === 'note' && ghiChu))) throw forbidden(CHI_SUA_THONG_TIN);
  }
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound();
  if (s.archived_at) throw badRequest(CAU_LUU_TRU);
  // Target và ngày thi IELTS nằm ở LỘ TRÌNH, sửa qua updateCycle chứ không qua hồ sơ.
  const map: Record<string, string> = {
    fullName: 'full_name', note: 'note', dob: 'dob', consultantName: 'consultant_name', email: 'email', consultantUserId: 'consultant_user_id',
    phone: 'phone', parentName: 'parent_name', parentRelation: 'parent_relation', parentPhone: 'parent_phone',
  };
  const { dauVao: dauVaoGui, ...hoSo } = patch ?? {};
  patch = chuanHoaSuaHoSo(hoSo);
  /* OV-8b: TVV phải cùng chi nhánh của em; TVV cũ (khác chi nhánh, gán trước luật này) gửi lại nguyên thì không chặn. */
  if (patch.consultantUserId != null && patch.consultantUserId !== s.consultant_user_id) kiemTvvCungChiNhanh(patch.consultantUserId, chiNhanhCuaEm(studentId));
  if (dauVaoGui !== undefined) {
    const dv = docDauVao(dauVaoGui);
    const c = currentCycle(studentId);
    if (!c) throw badRequest('Em chưa có lộ trình — chưa ghi được điểm đầu vào.');
    if (isRatioCycle(c)) throw badRequest('Lớp thường không có điểm đầu vào.');
    tx(() => {
      conn.prepare(`UPDATE learning_cycles SET baseline_attempt_id = NULL, baseline_score = ?, baseline_source = ?, baseline_note = NULL,
          baseline_listening = ?, baseline_reading = ?, baseline_writing = ?, baseline_speaking = ? WHERE id = ?`)
        .run(dv?.overall ?? null, dv ? 'manual' : null, ...(dv?.bands ?? [null, null, null, null]), c.id);
      writeAudit({ actorUserId: p.userId, action: dv ? 'cycle.baseline.set' : 'cycle.baseline.clear', entityType: 'learning_cycle', entityId: c.id,
        before: c, after: conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(c.id) });   // OV-13j: cùng dạng dòng — Lịch sử sửa so từng cột
    });
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
  const sau = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  /* OV-13j: chỉ ghi trường thực sự đổi; gửi lại nguyên giá trị cũ thì không có dòng nhật ký. */
  const doi = Object.keys(sau).filter((k) => k !== 'normalized_name' && sau[k] !== s[k]);
  if (doi.length) {
    writeAudit({ actorUserId: p.userId, action: 'student.update', entityType: 'student', entityId: studentId, entityLabel: s.student_code,
      before: Object.fromEntries(doi.map((k) => [k, s[k]])), after: Object.fromEntries(doi.map((k) => [k, sau[k]])) });
  }
  return sau;
}
