import { db } from '../db.ts';
import {
  ENTRY_SKILL_LABEL, INTERVENTION_KIND_LABEL, PERMISSIONS, REGULAR_SKILL_LABEL, SOS_LABEL,
  URGENCY_LABEL, caseHeadline,
  type EntrySkill, type InterventionKind,
} from '../../../shared/domain.ts';
import { demoToday } from '../demoConfig.ts';
import { diffDays, formatDateVi } from '../util.ts';
import { can, scopeFor, teachesClass, type Principal } from '../permissions.ts';
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
  /**
   * Chữ trên nhãn quá hạn. "Quá hạn" trơ trọi thì phải đọc tiếp mới biết quá hạn CÁI GÌ —
   * mỗi loại việc nói thẳng ra: quá hạn nhập điểm, quá hạn hỗ trợ, quá hạn duyệt.
   */
  overdueLabel: string | null;
  href: string;
};

export type WorkGroupKey = 'score' | 'approval' | 'review' | 'support' | 'schedule' | 'week';

/**
 * Mỗi nhóm có MỘT DÒNG nói rõ nhóm đó nghĩa là gì.
 *
 * Nhãn cộc lốc kiểu "Ghi kết quả" bắt người đọc tự đoán chuyện gì đã xảy ra và mình phải
 * làm gì. Một dòng giải thích ở đầu nhóm rẻ hơn nhiều so với việc mỗi người tự hiểu một kiểu.
 */
const GROUP_META: Record<WorkGroupKey, { label: string; hint: string; overdue: string }> = {
  score: {
    label: 'Nhập điểm Test',
    hint: 'Em đã làm bài rồi nhưng kỹ năng này chưa có điểm.',
    overdue: 'Quá hạn nhập điểm',
  },
  approval: {
    label: 'Chờ duyệt phương án',
    hint: 'Giáo viên đề xuất một phương án và đang chờ bạn quyết: duyệt, không duyệt (ghi rõ lý do), hoặc góp ý thêm.',
    overdue: 'Quá hạn duyệt',
  },
  review: {
    label: 'Kết quả sau hỗ trợ',
    hint: 'Bạn đã hỗ trợ em và hẹn một ngày xem lại. Ngày đó đã tới — ghi lại sau khi hỗ trợ em có tiến bộ không.',
    overdue: 'Quá hạn cập nhật kết quả',
  },
  support: {
    label: 'Phương án hỗ trợ',
    hint: 'Em đang có vấn đề mở mà chưa ai chọn hướng xử lý, cũng chưa ai ghi việc nào.',
    overdue: 'Quá hạn hỗ trợ',
  },
  schedule: {
    label: 'Cập nhật ngày MT',
    hint: 'Tuần đã chốt nhưng chưa biết em thi ngày nào.',
    overdue: 'Quá hạn cập nhật ngày MT',
  },
  week: {
    label: 'Chưa có tuần kế hoạch',
    hint: 'Bài MT chưa được xếp vào tuần nào.',
    overdue: 'Quá hạn chốt tuần',
  },
};

/** Nhãn hiện trên dòng việc: quá hạn thì nói rõ quá hạn gì, tới hạn hôm nay thì nói vậy. */
function badge(g: WorkGroupKey, u: WorkUrgency): string | null {
  return u === 'overdue' ? GROUP_META[g].overdue : u === 'today' ? 'Hạn hôm nay' : null;
}

/** Ngưỡng bỏ quên do owner chốt: mức nặng thì sốt ruột hơn. */
export const NUDGE_DAYS = { urgent: 3, normal: 7 };

function sosTone(level: number | null): 'ok' | 'info' | 'warn' | 'danger' {
  if (level === null) return 'info';
  return level === 0 ? 'ok' : level === 1 ? 'info' : level === 2 ? 'warn' : 'danger';
}

/**
 * Nhãn MỨC ĐỘ của em, lấy từ case: SOS 1/2/3 nếu vấn đề sinh ra từ một bài đánh giá,
 * còn giáo viên tự báo thì chưa có bài nên chỉ có mức độ gấp.
 */
function levelOf(c: { sos_level: number | null; urgency: string | null }): WorkItem['level'] {
  if (c.sos_level !== null) return { tone: sosTone(c.sos_level), text: SOS_LABEL[c.sos_level as 0 | 1 | 2 | 3] };
  if (c.urgency && c.urgency !== 'normal') {
    return {
      tone: c.urgency === 'urgent' ? 'danger' : 'warn',
      text: URGENCY_LABEL[c.urgency as keyof typeof URGENCY_LABEL],
    };
  }
  return null;
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
      actionLabel: `Nhập điểm ${names}`, overdueLabel: badge('score', u),
      href: `/mock-test/${a.id}`,
    });
  }

  // ------------------------------------------------- 2. phương án đang chờ Quản lý duyệt
  /*
   * Giáo viên là người quyết định phương án của mình có cần Quản lý duyệt hay không.
   * Khi có, Quản lý nợ một câu trả lời trong 3 ngày (case nặng/gấp) hoặc 7 ngày.
   * Góp ý KHÔNG xoá nợ đó — vẫn còn nằm ở đây tới khi duyệt hoặc không duyệt.
   */
  const pendingPlans = conn
    .prepare(
      `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.approval_due,
              sc.sos_level, sc.urgency, sc.summary, sc.origin_kind, sc.attempt_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no,
              pu.full_name AS proposer_name
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
         LEFT JOIN users pu ON pu.id = iv.recorded_by
        WHERE iv.approval_state = 'pending'`,
    )
    .all() as any[];

  for (const iv of pendingPlans) {
    if (f.branchId && iv.eff_branch_id !== f.branchId) continue;
    if (!can(p, PERMISSIONS.CASE_APPROVE, { classId: iv.eff_class_id, studentId: iv.eff_student_id })) continue;
    const u = urgencyOf(iv.approval_due, today);
    const what = (iv.description ?? '').trim() || INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] || 'phương án hỗ trợ';
    items.push({
      key: `approval:${iv.id}`, group: 'approval', urgency: u,
      studentId: iv.eff_student_id, studentName: iv.full_name ?? 'Học viên',
      classId: iv.eff_class_id ?? null, classCode: iv.class_code ?? null,
      attemptId: iv.attempt_id ?? null, attemptNo: iv.attempt_no ?? null,
      caseId: iv.case_id as number, level: levelOf(iv),
      reason: [
        iv.proposer_name ? `${iv.proposer_name} đề xuất: ${what}` : `Đề xuất: ${what}`,
        iv.approval_due
          ? (u === 'overdue' ? lateText(iv.approval_due, today)
            : u === 'today' ? 'hạn trả lời hôm nay'
            : `hạn trả lời ${formatDateVi(iv.approval_due)}`)
          : null,
      ].filter(Boolean).join(' — '),
      actionLabel: 'Duyệt phương án', overdueLabel: badge('approval', u),
      href: iv.eff_student_id ? `/hoc-vien/${iv.eff_student_id}` : `/hoc-thuat/case/${iv.case_id}`,
    });
  }

  // ------------------------------------------------- 3. kết quả sau hỗ trợ (tới hẹn xem lại)
  /*
   * AI THẤY VIỆC NÀY: người thực hiện phương án — họ là người biết em có khá lên không.
   * Quá hạn thì Quản lý cũng thấy, để việc không rơi mất khi người thực hiện quên.
   *
   * Phương án đang chờ duyệt thì CHƯA làm, nên chưa có gì để xem lại — loại ra.
   */
  const dueReviews = conn
    .prepare(
      `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.followup_due,
              COALESCE(iv.performer_user_id, iv.recorded_by) AS owner_id,
              sc.sos_level, sc.urgency, sc.summary, sc.origin_kind, sc.attempt_id,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE iv.followup_due IS NOT NULL AND iv.followup_due <= ?
          AND iv.status != 'cancelled'
          AND COALESCE(iv.approval_state, '') != 'pending'
          AND sc.status != 'done'
          AND NOT EXISTS (SELECT 1 FROM case_followups fu WHERE fu.intervention_id = iv.id)`,
    )
    .all(today) as any[];

  const reviewedCases = new Set<number>();
  for (const iv of dueReviews) {
    if (f.branchId && iv.eff_branch_id !== f.branchId) continue;
    const u = urgencyOf(iv.followup_due, today);
    const mine = iv.owner_id === p.userId;
    const asManager = u === 'overdue'
      && can(p, PERMISSIONS.CASE_APPROVE, { classId: iv.eff_class_id, studentId: iv.eff_student_id });
    if (!mine && !asManager) continue;
    if (!can(p, PERMISSIONS.SOS_EDIT, { classId: iv.eff_class_id, studentId: iv.eff_student_id })) continue;
    reviewedCases.add(iv.case_id);
    items.push({
      key: `review:${iv.id}`, group: 'review', urgency: u,
      studentId: iv.eff_student_id, studentName: iv.full_name ?? 'Học viên',
      classId: iv.eff_class_id ?? null, classCode: iv.class_code ?? null,
      attemptId: iv.attempt_id ?? null, attemptNo: iv.attempt_no ?? null,
      caseId: iv.case_id as number, level: levelOf(iv),
      reason: [
        (iv.description ?? '').trim() || INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] || 'Đã hỗ trợ',
        u === 'overdue' ? `hẹn xem lại ${formatDateVi(iv.followup_due)}, ${lateText(iv.followup_due, today)}`
          : 'hẹn xem lại hôm nay',
        mine ? null : 'người thực hiện chưa cập nhật',
      ].filter(Boolean).join(' — '),
      actionLabel: 'Cập nhật kết quả', overdueLabel: badge('review', u),
      href: iv.eff_student_id ? `/hoc-vien/${iv.eff_student_id}` : `/hoc-thuat/case/${iv.case_id}`,
    });
  }

  // ------------------------------------------------- 4. vấn đề mở mà chưa có phương án nào
  const caseRows = conn
    .prepare(
      `SELECT sc.*,
              COALESCE(sc.student_id, a.student_id) AS eff_student_id,
              COALESCE(a.class_id, cur.class_id) AS eff_class_id,
              COALESCE(ac.branch_id, cc.branch_id) AS eff_branch_id,
              COALESCE(ac.code, cc.code) AS class_code,
              s.full_name, a.attempt_no,
              (SELECT COUNT(*) FROM case_interventions iv
                WHERE iv.case_id = sc.id AND iv.status != 'cancelled') AS iv_count
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN students s ON s.id = COALESCE(sc.student_id, a.student_id)
         LEFT JOIN enrollments cur ON cur.student_id = s.id AND cur.status = 'active'
         LEFT JOIN classes ac ON ac.id = a.class_id
         LEFT JOIN classes cc ON cc.id = cur.class_id
        WHERE sc.status != 'done' AND COALESCE(sc.sos_level, 1) > 0
          AND sc.disposition IS NULL
        GROUP BY sc.id`,
    )
    .all() as any[];

  for (const c of caseRows) {
    if (f.branchId && c.eff_branch_id !== f.branchId) continue;
    if (c.iv_count > 0 || reviewedCases.has(c.id)) continue;
    // Quyền GHI NHẬN xử lý, không phải quyền xem — việc chỉ hiện với người làm được.
    if (!can(p, PERMISSIONS.SOS_EDIT, { classId: c.eff_class_id, studentId: c.eff_student_id })) continue;
    /*
     * ĐỀ XUẤT PHƯƠNG ÁN là việc của người DẠY em, hoặc của Quản lý. Admin chi nhánh ghi hộ
     * được việc CS gọi phụ huynh nên vẫn có `sos.edit`, nhưng giao cho văn phòng năm dòng
     * "đề xuất phương án hỗ trợ" là giao một việc họ không có căn cứ chuyên môn để làm —
     * đúng kiểu danh sách việc mà người nhận chỉ biết bỏ qua.
     */
    const mayDecide = teachesClass(p, c.eff_class_id)
      || can(p, PERMISSIONS.CASE_APPROVE, { classId: c.eff_class_id, studentId: c.eff_student_id });
    if (!mayDecide) continue;

    /*
     * Quá ngưỡng bỏ quên thì gọi thẳng là quá hạn hỗ trợ — không ép ai phải làm ngay,
     * nhưng cũng không để một em nằm im nhiều ngày mà không ai biết.
     */
    const detected = c.detected_at ?? (c.created_at ?? '').slice(0, 10);
    const days = detected ? diffDays(today, detected) : 0;
    const hot = (c.sos_level ?? 0) >= 3 || c.urgency === 'urgent';
    const limit = hot ? NUDGE_DAYS.urgent : NUDGE_DAYS.normal;
    const u: WorkUrgency = days >= limit ? 'overdue' : 'normal';
    const head = caseHeadline({
      summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no,
    });
    items.push({
      key: `support:${c.id}`, group: 'support', urgency: u,
      studentId: c.eff_student_id, studentName: c.full_name ?? 'Học viên',
      classId: c.eff_class_id ?? null, classCode: c.class_code ?? null,
      attemptId: c.attempt_id ?? null, attemptNo: c.attempt_no ?? null,
      caseId: c.id as number, level: levelOf(c),
      reason: u === 'overdue'
        ? `${head} — chưa có phương án hỗ trợ ${days} ngày`
        : `${head} — chưa có phương án hỗ trợ`,
      actionLabel: 'Đề xuất phương án', overdueLabel: badge('support', u),
      href: c.eff_student_id ? `/hoc-vien/${c.eff_student_id}` : `/hoc-thuat/case/${c.id}`,
    });
  }

  // ---------------------------------------------------------------- 4 & 5. lịch
  for (const a of attempts as any[]) {
    if (!a.needsDate) continue;
    // Chỉ nhắc khi ĐÃ TỚI TUẦN — nhắc trước hàng tháng thì danh sách lúc nào cũng dài.
    if (!a.period?.weekStart || a.period.weekStart > today) continue;
    if (!can(p, PERMISSIONS.SCHEDULE_DATE, { classId: a.classId })) continue;
    const u: WorkUrgency = a.period.weekEnd && a.period.weekEnd < today ? 'overdue' : 'normal';
    items.push({
      key: `date:${a.id}`, group: 'schedule', urgency: u,
      studentId: a.studentId, studentName: a.studentName,
      classId: a.classId ?? null, classCode: a.classCode ?? null,
      attemptId: a.id, attemptNo: a.attemptNo, caseId: null, level: null,
      reason: `MT${a.attemptNo} diễn ra vào tuần ${a.period.code} nhưng chưa có ngày cụ thể`
        + (u === 'overdue' ? ' — tuần đã qua' : ''),
      actionLabel: 'Cập nhật ngày MT', overdueLabel: badge('schedule', u),
      href: `/mock-test/${a.id}`,
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
      reason: `MT${a.attemptNo} chưa được xếp vào tuần nào`,
      actionLabel: 'Chốt tuần kế hoạch', overdueLabel: null, href: `/mock-test/${a.id}`,
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
  const order: WorkGroupKey[] = ['score', 'approval', 'review', 'support', 'schedule', 'week'];
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
