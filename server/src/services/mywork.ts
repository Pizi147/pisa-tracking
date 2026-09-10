import { db } from '../db.ts';
import {
  ENTRY_SKILL_LABEL, PERMISSIONS, REGULAR_SKILL_LABEL, SOS_LABEL, URGENCY_LABEL, caseHeadline,
  type EntrySkill,
} from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { diffDays, formatDateVi } from '../util.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { listAttempts } from './attempts.ts';

/**
 * VIỆC CỦA CHÍNH NGƯỜI ĐANG XEM.
 *
 * Màn chính cũ là một bảng số theo tuần, và giáo viên với quản lý mở ra thấy Y HỆT NHAU —
 * cùng bốn ô số, cùng một danh sách. Tệ hơn, danh sách đó liệt kê cả những việc người xem
 * KHÔNG CÓ QUYỀN LÀM: giáo viên được bảo "cập nhật ngày MT thực tế", trong khi quyền đó
 * thuộc về Admin chi nhánh.
 *
 * Ở đây đảo lại: mỗi dòng là MỘT HỌC VIÊN, một câu lý do, và một nút mà chính người đang
 * xem bấm được. Việc nào người xem không làm được thì không xuất hiện — không phải ẩn nút
 * đi mà là không đưa vào danh sách ngay từ đầu.
 *
 * Ba quy tắc:
 *   1. Chỉ đưa vào việc mà người xem THỰC SỰ làm được, kiểm bằng đúng quyền đó.
 *   2. Nhóm theo LOẠI VIỆC, nhưng việc quá hạn hoặc tới hạn hôm nay TÁCH RA lên đầu —
 *      gấp thì phải thấy trước, không để lẫn giữa nhóm.
 *   3. Mỗi dòng chỉ một hành động. Không có dòng nào bắt người đọc tự đoán phải làm gì.
 */

export type WorkUrgency = 'overdue' | 'today' | 'normal';

export type WorkItem = {
  key: string;
  group: WorkGroupKey;
  urgency: WorkUrgency;
  studentId: number | null;
  studentName: string;
  classId: number | null;
  classCode: string | null;
  attemptId: number | null;
  attemptNo: number | null;
  caseId: number | null;
  /** Nhãn MỨC ĐỘ của học viên — chỉ có ở việc liên quan tới một vấn đề đang mở. */
  level: { tone: 'ok' | 'info' | 'warn' | 'danger'; text: string } | null;
  reason: string;
  actionLabel: string;
  href: string;
};

export type WorkGroupKey = 'score' | 'support' | 'review' | 'schedule' | 'week';

/**
 * Mỗi nhóm có MỘT DÒNG nói rõ nhóm đó nghĩa là gì.
 *
 * Nhãn cộc lốc kiểu "Ghi kết quả" bắt người đọc tự đoán chuyện gì đã xảy ra và mình phải
 * làm gì. Một dòng giải thích ở đầu nhóm rẻ hơn nhiều so với việc mỗi người tự hiểu một kiểu.
 */
const GROUP_META: Record<WorkGroupKey, { label: string; hint: string }> = {
  score: {
    label: 'Nhập điểm',
    hint: 'Em đã làm bài rồi nhưng kỹ năng này chưa có điểm.',
  },
  review: {
    label: 'Đến hẹn xem lại',
    hint: 'Trước đó đã hỗ trợ em và hẹn một ngày xem lại. Ngày đó đã tới — ghi lại em có tiến bộ không.',
  },
  support: {
    label: 'Chưa ai bắt tay vào',
    hint: 'Em đang có vấn đề mở mà chưa ai chọn hướng xử lý, cũng chưa ai ghi việc nào.',
  },
  schedule: {
    label: 'Chưa có ngày cụ thể',
    hint: 'Tuần đã chốt nhưng chưa biết em thi ngày nào.',
  },
  week: {
    label: 'Chưa có tuần kế hoạch',
    hint: 'Bài MT chưa được xếp vào tuần nào.',
  },
};

/** Ngưỡng bỏ quên do owner chốt: mức nặng thì sốt ruột hơn. */
export const NUDGE_DAYS = { urgent: 3, normal: 7 };

function sosTone(level: number | null): 'ok' | 'info' | 'warn' | 'danger' {
  if (level === null) return 'info';
  return level === 0 ? 'ok' : level === 1 ? 'info' : level === 2 ? 'warn' : 'danger';
}

function urgencyOf(date: string | null, today: string): WorkUrgency {
  if (!date) return 'normal';
  if (date < today) return 'overdue';
  if (date === today) return 'today';
  return 'normal';
}

function lateText(date: string, today: string): string {
  const n = diffDays(today, date);
  return n <= 0 ? 'hạn hôm nay' : n === 1 ? 'quá hạn 1 ngày' : `quá hạn ${n} ngày`;
}

export function myWork(p: Principal, f: { branchId?: number | null } = {}) {
  const today = demoToday();
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { summary: { total: 0, overdue: 0, today: 0 }, groups: [], scopeEmpty: true };

  const conn = db();
  const items: WorkItem[] = [];
  const attempts = listAttempts(p, { branchId: f.branchId ?? undefined }).rows
    .filter((a: any) => a.status !== 'cancelled');

  // ---------------------------------------------------------------- 1. nhập điểm
  /*
   * `myPendingSkills` đã là những ô mà CHÍNH người này được phân công và chưa nhập.
   * Không dùng "lượt còn thiếu điểm" chung — đó là số của quản lý, không phải việc của ai.
   */
  for (const a of attempts as any[]) {
    const mine: any[] = a.myPendingDetail ?? [];
    if (!mine.length) continue;
    const worst = mine.reduce((w: any, c: any) => {
      if (!c.deadline) return w;
      if (!w?.deadline || c.deadline < w.deadline) return c;
      return w;
    }, null as any);
    // Lớp thường có kỹ năng riêng (Prep-Writing, Pronunciation) không nằm trong bộ IELTS.
    const names = mine
      .map((c: any) => ENTRY_SKILL_LABEL[c.skill as EntrySkill]
        ?? REGULAR_SKILL_LABEL[c.skill as keyof typeof REGULAR_SKILL_LABEL]
        ?? c.skill)
      .join(', ');
    const u = urgencyOf(worst?.deadline ?? null, today);
    items.push({
      key: `score:${a.id}`,
      group: 'score', urgency: u,
      studentId: a.studentId, studentName: a.studentName,
      classId: a.classId ?? null, classCode: a.classCode ?? null,
      attemptId: a.id, attemptNo: a.attemptNo, caseId: null, level: null,
      reason: u === 'overdue' ? `${names} — ${lateText(worst.deadline, today)}`
        : u === 'today' ? `${names} — hạn hôm nay`
        : worst?.deadline ? `${names} — hạn ${formatDateVi(worst.deadline)}` : names,
      actionLabel: `Nhập điểm ${names}`,
      href: `/mock-test/${a.id}`,
    });
  }

  // ---------------------------------------------------------------- 2 & 3. vấn đề đang mở
  const caseRows = conn
    .prepare(
      `SELECT sc.*,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no,
              (SELECT COUNT(*) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.status != 'cancelled') AS iv_count,
              (SELECT MIN(iv.followup_due) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.followup_due IS NOT NULL AND iv.status != 'completed'
                  AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = iv.id)) AS next_due
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
         LEFT JOIN users u ON u.id = sc.reported_by
        WHERE sc.status != 'done' AND COALESCE(sc.sos_level, 1) > 0
        GROUP BY sc.id`,
    )
    .all() as any[];

  for (const c of caseRows) {
    if (f.branchId && c.eff_branch_id !== f.branchId) continue;
    // Quyền GHI NHẬN xử lý, không phải quyền xem — việc chỉ hiện với người làm được.
    if (!can(p, PERMISSIONS.SOS_EDIT, { classId: c.eff_class_id, studentId: c.eff_student_id })) continue;

    const level = c.sos_level !== null
      ? { tone: sosTone(c.sos_level), text: SOS_LABEL[c.sos_level as 0 | 1 | 2 | 3] }
      : c.urgency && c.urgency !== 'normal'
        ? { tone: (c.urgency === 'urgent' ? 'danger' : 'warn') as 'danger' | 'warn',
            text: URGENCY_LABEL[c.urgency as keyof typeof URGENCY_LABEL] }
        : null;
    const base = {
      studentId: c.eff_student_id, studentName: c.full_name ?? 'Học viên',
      classId: c.eff_class_id ?? null, classCode: c.class_code ?? null,
      attemptId: c.attempt_id ?? null, attemptNo: c.attempt_no ?? null,
      caseId: c.id as number, level,
    };

    // Hẹn xem lại đã tới ngày — việc rõ ràng nhất, tách thành nhóm riêng.
    if (c.next_due && c.next_due <= today) {
      items.push({
        key: `review:${c.id}`, group: 'review', urgency: urgencyOf(c.next_due, today), ...base,
        reason: c.next_due < today
          ? `Hẹn xem lại ${formatDateVi(c.next_due)} — ${lateText(c.next_due, today)}`
          : 'Bạn hẹn xem lại hôm nay',
        actionLabel: 'Ghi kết quả xem lại', href: `/hoc-thuat/case/${c.id}`,
      });
      continue;
    }

    /*
     * CHƯA LÀM: chưa có hướng xử lý và cũng chưa ghi việc nào. Quá ngưỡng bỏ quên thì đẩy
     * lên nhóm gấp — không ép ai phải làm, nhưng cũng không để một em rơi mất.
     */
    const untouched = !c.disposition && c.iv_count === 0;
    if (!untouched) continue;
    const detected = c.detected_at ?? (c.created_at ?? '').slice(0, 10);
    const days = detected ? diffDays(today, detected) : 0;
    const hot = (c.sos_level ?? 0) >= 3 || c.urgency === 'urgent';
    const limit = hot ? NUDGE_DAYS.urgent : NUDGE_DAYS.normal;
    items.push({
      key: `support:${c.id}`, group: 'support',
      urgency: days >= limit ? 'overdue' : 'normal', ...base,
      reason: days >= limit
        ? `${caseHeadline({ summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no })} — chưa làm ${days} ngày`
        : caseHeadline({ summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no }),
      actionLabel: 'Chọn hướng xử lý',
      href: base.studentId ? `/hoc-vien/${base.studentId}` : `/hoc-thuat/case/${c.id}`,
    });
  }

  // ---------------------------------------------------------------- 4 & 5. lịch
  for (const a of attempts as any[]) {
    if (!a.needsDate) continue;
    // Chỉ nhắc khi ĐÃ TỚI TUẦN — nhắc trước hàng tháng thì danh sách lúc nào cũng dài.
    if (!a.period?.weekStart || a.period.weekStart > today) continue;
    if (!can(p, PERMISSIONS.SCHEDULE_DATE, { classId: a.classId })) continue;
    items.push({
      key: `date:${a.id}`, group: 'schedule',
      urgency: a.period.weekEnd && a.period.weekEnd < today ? 'overdue' : 'normal',
      studentId: a.studentId, studentName: a.studentName,
      classId: a.classId ?? null, classCode: a.classCode ?? null,
      attemptId: a.id, attemptNo: a.attemptNo, caseId: null, level: null,
      reason: `MT${a.attemptNo} đã có tuần ${a.period.code} nhưng chưa có ngày`,
      actionLabel: 'Chọn ngày', href: `/mock-test/${a.id}`,
    });
  }

  for (const a of attempts as any[]) {
    if (a.period || a.status !== 'planned') continue;
    if (!can(p, PERMISSIONS.PLAN_WEEK, { classId: a.classId })) continue;
    items.push({
      key: `week:${a.id}`, group: 'week', urgency: 'normal',
      studentId: a.studentId, studentName: a.studentName,
      classId: a.classId ?? null, classCode: a.classCode ?? null,
      attemptId: a.id, attemptNo: a.attemptNo, caseId: null, level: null,
      reason: `MT${a.attemptNo} chưa có tuần kế hoạch`,
      actionLabel: 'Chốt tuần kế hoạch', href: `/mock-test/${a.id}`,
    });
  }

  /*
   * XẾP NHÓM.
   *
   * Bản trước gom hết việc gấp vào một nhóm "Cần làm ngay" — nhưng "quá hạn nhập điểm" và
   * "chưa ai bắt tay vào" là hai chuyện khác hẳn nhau, gộp lại thì nhìn vào không biết cái
   * nào là cái nào. Nay GIỮ ĐÚNG LOẠI VIỆC, chỉ xếp việc gấp lên đầu TRONG nhóm của nó, và
   * xếp nhóm nào có việc gấp lên trước.
   */
  const order: WorkGroupKey[] = ['score', 'review', 'support', 'schedule', 'week'];
  const weight = (u: WorkUrgency) => (u === 'overdue' ? 0 : u === 'today' ? 1 : 2);

  const groups = order
    .map((g) => {
      const list = items.filter((i) => i.group === g)
        .sort((a, b) => weight(a.urgency) - weight(b.urgency));
      return {
        key: g,
        label: GROUP_META[g].label,
        hint: GROUP_META[g].hint,
        items: list,
        overdue: list.filter((i) => i.urgency === 'overdue').length,
        today: list.filter((i) => i.urgency === 'today').length,
      };
    })
    .filter((g) => g.items.length > 0)
    .sort((a, b) => (b.overdue > 0 ? 1 : 0) - (a.overdue > 0 ? 1 : 0));

  return {
    summary: {
      total: items.length,
      overdue: items.filter((i) => i.urgency === 'overdue').length,
      today: items.filter((i) => i.urgency === 'today').length,
    },
    groups,
    scopeEmpty: false,
  };
}
