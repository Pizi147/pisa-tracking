import { db, tx } from '../db.ts';
import { ASSESSED_SKILLS, PERMISSIONS, type AssessedSkill } from '../../../shared/domain.ts';
import { badRequest, isIsoDate, nowIso } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { createAttempt, setSchedule, setSkillSkip } from './attempts.ts';

/**
 * Thao tác HÀNG LOẠT cho lịch MT.
 *
 * Một Admin chi nhánh phải cập nhật ngày cho hai mươi học viên trong cùng một buổi. Bắt họ
 * mở từng hồ sơ là bắt làm hai mươi lần một việc. Ở đây gom lại: chọn nhiều em, một ngày,
 * một lần bấm.
 *
 * Từng dòng vẫn qua ĐÚNG hàm nghiệp vụ của thao tác lẻ (`createAttempt`, `setSchedule`),
 * nên mọi kiểm tra quyền, ràng buộc tuần và ghi lịch sử đều giữ nguyên — hàng loạt không
 * phải là một đường vòng lỏng hơn.
 */

export type BulkResult<T = unknown> = {
  done: number;
  failed: { id: number; label?: string; message: string }[];
  items: T[];
};

/** Chạy từng phần tử, một dòng lỗi không làm hỏng cả lô. */
function runEach<I, T>(
  ids: I[],
  labelOf: (id: I) => string | undefined,
  keyOf: (id: I) => number,
  fn: (id: I) => T,
): BulkResult<T> {
  const failed: BulkResult['failed'] = [];
  const items: T[] = [];
  for (const id of ids) {
    try { items.push(fn(id)); } catch (e: any) {
      failed.push({ id: keyOf(id), label: labelOf(id), message: e?.message ?? 'Không lưu được' });
    }
  }
  return { done: items.length, failed, items };
}

function normalizeSkills(input: readonly string[] | undefined): AssessedSkill[] | null {
  if (!input) return null;
  const set = new Set(input.map((s) => String(s).trim().toLowerCase()));
  const picked = ASSESSED_SKILLS.filter((s) => set.has(s));
  if (picked.length === 0) {
    throw badRequest('Phải yêu cầu ít nhất một kỹ năng. Một lượt MT không có kỹ năng nào thì không đánh giá được gì.');
  }
  return picked;
}

/**
 * Lên kế hoạch MT cho NHIỀU học viên cùng lúc.
 *
 * `requiredSkills` là các kỹ năng lượt này YÊU CẦU. Bỏ tick một kỹ năng nghĩa là ngay từ đầu
 * lượt này không yêu cầu kỹ năng đó — KHÁC hẳn với "có yêu cầu nhưng chưa có điểm".
 * Lượt được coi là xong khi đủ điểm các kỹ năng ĐƯỢC YÊU CẦU, không chờ kỹ năng không yêu cầu.
 */
export function bulkPlan(p: Principal, input: {
  studentIds: number[];
  periodId: number;
  attemptNo?: number | null;
  requiredSkills?: string[];
  note?: string | null;
}): BulkResult {
  const conn = db();
  const ids = [...new Set((input.studentIds ?? []).map(Number).filter(Boolean))];
  if (!ids.length) throw badRequest('Chưa chọn học viên nào.');
  const required = normalizeSkills(input.requiredSkills);
  const notRequired = required ? ASSESSED_SKILLS.filter((s) => !required.includes(s)) : [];

  const names = new Map<number, string>(
    (conn.prepare(`SELECT id, full_name FROM students WHERE id IN (${ids.map(() => '?').join(',')})`)
      .all(...ids) as any[]).map((s) => [s.id, s.full_name]),
  );

  return tx(() => runEach(ids, (id) => names.get(id), (id) => id, (studentId) => {
    const created = createAttempt(p, {
      studentId, periodId: input.periodId,
      attemptNo: input.attemptNo ?? undefined,
      note: input.note ?? null,
    }) as any;
    for (const skill of notRequired) {
      setSkillSkip(p, created.id, skill, true, 'Lượt này không yêu cầu kỹ năng đó ngay từ khi lên kế hoạch');
    }
    return created;
  }));
}

/**
 * Cập nhật NGÀY MT thực tế cho nhiều lượt cùng lúc.
 *
 * Chỉ ngày, không giờ. Lượt nào có tuần kế hoạch không chứa ngày đó thì báo lỗi riêng dòng
 * ấy — không âm thầm bỏ qua, cũng không huỷ cả lô.
 */
export function bulkSetDate(p: Principal, input: {
  attemptIds: number[];
  lrwAt?: string | null;
  speakingAt?: string | null;
  reason?: string | null;
}): BulkResult {
  const conn = db();
  const ids = [...new Set((input.attemptIds ?? []).map(Number).filter(Boolean))];
  if (!ids.length) throw badRequest('Chưa chọn lượt MT nào.');
  const touchLrw = input.lrwAt !== undefined;
  const touchSpeaking = input.speakingAt !== undefined;
  if (!touchLrw && !touchSpeaking) throw badRequest('Chưa chọn ngày để cập nhật.');
  for (const [v, label] of [[input.lrwAt, 'Ngày L/R/W'], [input.speakingAt, 'Ngày Speaking']] as const) {
    if (v !== undefined && v !== null && v !== '' && !isIsoDate(String(v).slice(0, 10))) {
      throw badRequest(`${label} không hợp lệ.`);
    }
  }

  const labels = new Map<number, string>(
    (conn.prepare(
      `SELECT a.id, s.full_name, a.attempt_no FROM assessment_attempts a
         JOIN students s ON s.id = a.student_id
        WHERE a.id IN (${ids.map(() => '?').join(',')})`,
    ).all(...ids) as any[]).map((r) => [r.id, `${r.full_name} · MT${r.attempt_no}`]),
  );

  return tx(() => runEach(ids, (id) => labels.get(id), (id) => id, (attemptId) => setSchedule(p, attemptId, {
    ...(touchLrw ? { lrwAt: input.lrwAt } : {}),
    ...(touchSpeaking ? { speakingAt: input.speakingAt } : {}),
    reason: input.reason ?? undefined,
  })));
}

/**
 * Nghĩa vụ hàng tuần của Admin chi nhánh: trước khi hết Chủ nhật, những em có MT trong tuần
 * phải được cập nhật ngày thực tế.
 *
 * Trả về đúng hai nhóm — tuần này còn thiếu, và tuần trước đã quá hạn mà vẫn thiếu. Những
 * MT còn cách nhiều tuần KHÔNG xuất hiện ở đây: chưa đến lượt thì chưa phải việc.
 */
export function dateDutyQueue(p: Principal, f: { branchId?: number | null; classId?: number | null } = {}) {
  const conn = db();
  const today = demoToday();
  const where: string[] = [`a.status = 'planned'`, 'a.lrw_scheduled_at IS NULL', 'rp.week_start <= ?'];
  const params: unknown[] = [today];
  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }
  if (f.classId) { where.push('a.class_id = ?'); params.push(f.classId); }

  const rows = conn
    .prepare(
      `SELECT a.id, a.attempt_no, a.speaking_scheduled_at, a.class_id,
              s.id AS student_id, s.full_name, s.student_code,
              c.code AS class_code, c.branch_id, b.name AS branch_name,
              rp.code AS period_code, rp.week_start, rp.week_end
         FROM assessment_attempts a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN branches b ON b.id = c.branch_id
         JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE ${where.join(' AND ')} AND s.archived_at IS NULL
        ORDER BY rp.week_start, c.code, s.full_name`,
    )
    .all(...params) as any[];

  const visible = rows.filter((r) => can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: r.class_id, studentId: r.student_id }));
  return {
    rows: visible.map((r) => ({
      attemptId: r.id, attemptNo: r.attempt_no, studentId: r.student_id,
      studentName: r.full_name, studentCode: r.student_code,
      classId: r.class_id, classCode: r.class_code, branchName: r.branch_name,
      periodCode: r.period_code, weekStart: r.week_start, weekEnd: r.week_end,
      speakingScheduledAt: r.speaking_scheduled_at,
      // Đã qua Chủ nhật của tuần MT mà vẫn chưa có ngày.
      overdue: r.week_end < today,
      canEdit: can(p, PERMISSIONS.SCHEDULE_DATE, { classId: r.class_id, studentId: r.student_id }),
    })),
    overdueCount: visible.filter((r) => r.week_end < today).length,
    thisWeekCount: visible.filter((r) => r.week_end >= today).length,
  };
}

/**
 * Học viên và tình trạng kế hoạch MT.
 *
 * Mặc định chỉ trả về em CHƯA CÓ tuần MT tiếp theo — đó là việc của QUẢN LÝ, không phải
 * Admin chi nhánh, và là con số cần surface.
 *
 * `includePlanned` mở rộng ra cả em đã có lượt đang chờ, để Quản lý lên kế hoạch TRƯỚC cho
 * cả lớp trong một lần thay vì đợi từng lượt xong mới xếp lượt sau.
 */
export function noPlanQueue(
  p: Principal,
  f: { branchId?: number | null; classId?: number | null; includePlanned?: boolean } = {},
) {
  const conn = db();
  const where: string[] = [`s.status = 'active'`, 's.archived_at IS NULL', 'cy.id IS NOT NULL'];
  const params: unknown[] = [];
  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }
  if (f.classId) { where.push('e.class_id = ?'); params.push(f.classId); }

  const rows = conn
    .prepare(
      `SELECT s.id AS student_id, s.full_name, s.student_code, e.class_id,
              c.code AS class_code, c.branch_id, b.name AS branch_name,
              cy.id AS cycle_id, cy.route, cy.target_score,
              (SELECT COUNT(*) FROM assessment_attempts a
                WHERE a.cycle_id = cy.id AND a.status = 'planned') AS pending,
              (SELECT MAX(a.attempt_no) FROM assessment_attempts a
                WHERE a.cycle_id = cy.id AND a.status != 'cancelled') AS last_no
         FROM students s
         JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         JOIN classes c ON c.id = e.class_id
         JOIN branches b ON b.id = c.branch_id
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE ${where.join(' AND ')}
        ORDER BY c.code, s.full_name`,
    )
    .all(...params) as any[];

  const inScope = rows.filter((r) => can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: r.class_id, studentId: r.student_id }));
  const visible = f.includePlanned ? inScope : inScope.filter((r) => r.pending === 0);
  return {
    rows: visible.map((r) => ({
      studentId: r.student_id, studentName: r.full_name, studentCode: r.student_code,
      classId: r.class_id, classCode: r.class_code, branchName: r.branch_name,
      cycleId: r.cycle_id, route: r.route, target: r.target_score,
      nextAttemptNo: (r.last_no ?? 0) + 1,
      /** Đã có lượt đang chờ — vẫn xếp trước được lượt sau, chỉ là không phải việc gấp. */
      hasPending: r.pending > 0,
      canPlan: can(p, PERMISSIONS.PLAN_WEEK, { classId: r.class_id, studentId: r.student_id }),
    })),
    total: visible.length,
    /** Số em thật sự CHƯA có tuần MT — con số cần surface, không đổi theo bộ lọc. */
    noPlanCount: inScope.filter((r) => r.pending === 0).length,
  };
}
