import { db, tx } from '../db.ts';
import {
  PERMISSIONS, PROGRAMME_TEMPLATES, nextStepsAfter, programmeOf, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { badRequest, isIsoDate, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { ensurePeriod } from '../platform/week.ts';
import { classProgress } from './schedule.ts';
import { createClass } from './intake.ts';
import { transferStudent } from '../students/students.ts';

/**
 * CHUYỂN TIẾP KHI MỘT LỚP HỌC HẾT CHƯƠNG TRÌNH — mục 6.1.
 *
 * Luồng mặc định: FOU → BE, và BE/ELE → Fast Track.
 *
 * BA NGUYÊN TẮC, VÀ CẢ BA ĐỀU LÀ QUYẾT ĐỊNH CÓ CHỦ Ý:
 *
 * 1. KHÔNG ĐỔI LOẠI NGAY TRÊN LỚP CŨ. Mở một LỚP MỚI rồi chuyển học viên sang. Đổi loại
 *    trên chính bản ghi lớp cũ thì mất luôn dấu vết giai đoạn trước — ba tháng sau không
 *    ai trả lời được "hồi đó em học Foundation ở lớp nào, kết quả ra sao".
 *
 * 2. HỆ THỐNG KHÔNG TỰ CHUYỂN AI. Đủ số tuần chỉ là điều kiện để HỎI, không phải để làm.
 *    Hệ thống bày sẵn kế hoạch — lớp đích, danh sách em, ngày chuyển — rồi người phụ trách
 *    xem lại và bấm xác nhận. Chưa xác nhận thì lớp vẫn hiện "Cần xếp lớp tiếp".
 *
 * 3. NGOẠI LỆ LÀ CHUYỆN BÌNH THƯỜNG. Em học tốt hơn hẳn mặt bằng lớp có thể đi thẳng sang
 *    một lớp Fast Track đang có; em đuối có thể học lại. Nên mỗi dòng học viên chọn được
 *    lớp đích RIÊNG, và bỏ chọn được hẳn.
 */

export type TransitionTarget = {
  id: number; code: string; programmeCode: string | null; programmeName: string | null;
  startWeek: string | null; studentCount: number;
};

/**
 * KẾ HOẠCH CHUYỂN TIẾP DỰ KIẾN của một lớp. Chỉ đọc, không ghi gì.
 *
 * Trả về đủ ba thứ người phụ trách cần để quyết: chương trình kế tiếp theo luồng mặc định,
 * những lớp đích ĐANG CÓ để chọn thay vì mở lớp mới, và danh sách em còn đang học.
 */
export function transitionPlan(p: Principal, classId: number) {
  const conn = db();
  const cls = conn
    .prepare('SELECT c.*, b.code AS branch_code, b.name AS branch_name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');

  const progress = classProgress(classId);
  const from = programmeOf(cls.programme_code ?? cls.kind);
  const steps = from ? nextStepsAfter(from) : [];
  /* Luồng mặc định lấy bước ĐẦU TIÊN; các bước còn lại vẫn chọn được, chỉ không mặc định. */
  const defaultProgramme = steps[0] ?? null;

  const students = conn
    .prepare(
      `SELECT s.id, s.student_code, s.full_name, s.status,
              cy.id AS cycle_id, cy.target_score
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND e.status = 'active'
          AND s.status = 'active' AND s.archived_at IS NULL
        ORDER BY s.full_name`,
    )
    .all(classId) as any[];

  /*
   * LỚP ĐÍCH GỢI Ý: lớp CÙNG CHI NHÁNH, đúng chương trình kế tiếp, còn đang chạy và chưa
   * học quá nửa chương trình. Nhét sáu em vào một lớp đã học đến tuần 9/10 là vô nghĩa.
   */
  const candidates = (conn
    .prepare(
      `SELECT c.id, c.code, c.programme_code, c.start_period_id,
              (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status='active') AS n
         FROM classes c
        WHERE c.branch_id = ? AND c.status = 'active' AND c.id != ?
          AND c.programme_code IN (${steps.map(() => '?').join(',') || "''"})
        ORDER BY c.code`,
    )
    .all(cls.branch_id, classId, ...steps) as any[])
    .filter((c) => {
      const pr = classProgress(c.id);
      return pr.totalWeeks === null || pr.currentWeek === null || pr.currentWeek <= Math.ceil(pr.totalWeeks / 2);
    })
    .map((c) => ({
      id: c.id, code: c.code,
      programmeCode: c.programme_code,
      programmeName: c.programme_code ? PROGRAMME_TEMPLATES[c.programme_code as ProgrammeCode]?.name ?? null : null,
      startWeek: null as string | null,
      studentCount: c.n,
    }));

  /* Mã lớp gợi ý cho lớp mới: cùng chi nhánh, mã chương trình kế tiếp, số kế tiếp còn trống. */
  const suggestedCode = defaultProgramme ? suggestClassCode(cls.branch_code, defaultProgramme) : null;

  return {
    from: {
      id: cls.id, code: cls.code, branchId: cls.branch_id, branchCode: cls.branch_code,
      branchName: cls.branch_name,
      programmeCode: cls.programme_code, programmeName: progress.programmeName,
      phase: progress.phase, phaseLabel: progress.phaseLabel,
      totalWeeks: progress.totalWeeks, currentWeek: progress.currentWeek,
    },
    /** Chương trình kế tiếp theo luồng mặc định, và mọi lựa chọn hợp lệ khác. */
    defaultProgramme,
    options: steps.map((c) => ({ code: c, name: PROGRAMME_TEMPLATES[c].name })),
    suggestedCode,
    candidates,
    students: students.map((s) => ({
      id: s.id, studentCode: s.student_code, fullName: s.full_name,
      cycleId: s.cycle_id ?? null, target: s.target_score ?? null,
    })),
    /** Lớp này đã từng chuyển tiếp sang đâu chưa — để không mở hai lớp kế tiếp cho một lớp. */
    alreadyLinked: (conn
      .prepare('SELECT id, code FROM classes WHERE previous_class_id = ? ORDER BY id')
      .all(classId) as any[]).map((c) => ({ id: c.id, code: c.code })),
    canEdit: can(p, PERMISSIONS.STUDENT_EDIT, { classId }),
    today: demoToday(),
  };
}

/** Mã lớp gợi ý: `MB-BE 01`, tăng dần cho tới khi không trùng. */
function suggestClassCode(branchCode: string, programme: ProgrammeCode): string {
  const conn = db();
  for (let n = 1; n <= 99; n += 1) {
    const code = `${branchCode}-${programme} ${String(n).padStart(2, '0')}`;
    if (!conn.prepare('SELECT id FROM classes WHERE code = ?').get(code)) return code;
  }
  return `${branchCode}-${programme}`;
}

export type TransitionInput = {
  /** Lớp đang kết thúc. */
  fromClassId: number;
  /** Mở lớp mới: khai mã, chương trình và tuần khai giảng. Bỏ trống nếu chuyển vào lớp có sẵn. */
  newClass?: { code: string; programme: string; startWeekStart?: string | null } | null;
  /** Mỗi em một lớp đích. Em không có trong danh sách này thì KHÔNG chuyển. */
  moves: { studentId: number; toClassId?: number | null; toNewClass?: boolean }[];
  effectiveDate: string;
  note?: string | null;
};

/**
 * XÁC NHẬN CHUYỂN TIẾP. Mở lớp mới (nếu có) rồi chuyển từng em sang lớp đích của em.
 *
 * Một dòng lỗi KHÔNG làm hỏng cả lô: em nào chuyển được thì chuyển, em nào vướng thì báo
 * riêng dòng đó. Chuyển hai mươi em mà một em vướng rồi huỷ cả hai mươi là bắt làm lại từ
 * đầu một việc đã gần xong.
 */
export function applyTransition(p: Principal, input: TransitionInput) {
  const conn = db();
  const from = conn.prepare('SELECT * FROM classes WHERE id = ?').get(input.fromClassId) as any;
  if (!from) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: input.fromClassId },
    'Bạn không có quyền chuyển học viên của lớp này.');
  if (!isIsoDate(input.effectiveDate)) throw badRequest('Ngày chuyển không hợp lệ.');
  const moves = (input.moves ?? []).filter((m) => m.studentId);
  if (!moves.length) throw badRequest('Chưa chọn học viên nào để chuyển.');

  return tx(() => {
    let created: any = null;
    if (input.newClass) {
      const prog = programmeOf(input.newClass.programme);
      if (!prog) throw badRequest('Chương trình của lớp mới không hợp lệ.');
      created = createClass(p, {
        code: input.newClass.code,
        branchId: from.branch_id,
        kind: prog,
        isFastTrack: prog === 'FT',
        startDate: input.effectiveDate,
        startPeriodId: input.newClass.startWeekStart
          ? ensurePeriod(input.newClass.startWeekStart).id
          : ensurePeriod(input.effectiveDate).id,
        skills: [...PROGRAMME_TEMPLATES[prog].skills],
        previousClassId: from.id,
        note: `Học tiếp từ lớp ${from.code}`,
      });
    }

    const done: { studentId: number; toClassId: number }[] = [];
    const failed: { studentId: number; message: string }[] = [];
    for (const m of moves) {
      const target = m.toNewClass ? created?.id ?? null : m.toClassId ?? null;
      if (!target) {
        failed.push({ studentId: m.studentId, message: 'Chưa chọn lớp đích cho học viên này.' });
        continue;
      }
      try {
        transferStudent(p, m.studentId, target, input.effectiveDate,
          input.note ?? `Học tiếp sau lớp ${from.code}`);
        done.push({ studentId: m.studentId, toClassId: target });
      } catch (e: any) {
        failed.push({ studentId: m.studentId, message: e?.message ?? 'Không chuyển được' });
      }
    }

    writeAudit({
      actorUserId: p.userId, action: 'class.transition', entityType: 'class', entityId: from.id,
      entityLabel: from.code,
      after: { newClass: created?.code ?? null, moved: done.length, failed: failed.length },
    });
    return { newClass: created ? { id: created.id, code: created.code } : null, done, failed };
  });
}
