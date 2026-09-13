import { db } from '../db.ts';
import {
  BEHAVIOUR_TOPICS, BEHAVIOUR_TOPIC_LABEL, ENTRY_SKILLS, ENTRY_SKILL_SHORT,
  PERMISSIONS, SOS_LABEL,
} from '../../../shared/domain.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { listCases } from './cases.ts';

/**
 * BẢNG TỔNG HỢP CHO QUẢN LÝ — một hàng cho mỗi chi nhánh, hoặc mỗi lớp khi đã chọn chi nhánh.
 *
 * Ba nguyên tắc, vì bảng này rất dễ thành một bức tường số không ai đọc:
 *
 *   1. MỖI Ô LÀ MỘT CÂU HỎI CÓ THẬT. Không thêm cột chỉ vì tính được.
 *   2. CỘT NÀO CŨNG BẤM ĐƯỢC và mở đúng tập bản ghi tạo nên con số đó. Một con số không mở
 *      ra được là một con số không ai kiểm chứng được.
 *   3. DẠNG `tổng / chưa xử lý`: hai con số cạnh nhau nói được điều mà mỗi con số riêng lẻ
 *      không nói nổi — 12/0 và 12/11 là hai chi nhánh hoàn toàn khác nhau.
 *
 * Dùng CHUNG `listCases` với màn danh sách bên dưới, nên số trên bảng và số dòng khi bấm vào
 * luôn khớp. Đếm lại bằng SQL riêng là cách chắc chắn nhất để hai chỗ lệch nhau.
 */

export type SummaryColumn = {
  key: string;
  label: string;
  /** Nhóm cột, để bật/tắt theo cụm và để gộp tiêu đề. */
  group: 'sos' | 'skill' | 'behaviour' | 'total';
  hint?: string;
};

/** Bộ cột đặt sẵn. Owner chốt vòng 3: chưa làm bật/tắt từng cột, làm bộ trước. */
export const SUMMARY_PRESETS = [
  {
    key: 'default', label: 'Mặc định',
    columns: ['students', 'sos3', 'sos2', 'sos1', 'openCases', 'behaviour'],
  },
  {
    key: 'skills', label: 'Theo kỹ năng',
    columns: ['students', ...ENTRY_SKILLS.map((s) => `skill_${s}`), 'openCases'],
  },
  {
    key: 'attention', label: 'Cần chú ý',
    columns: ['students', 'sos3', 'noPlan', 'overdueReview', 'pendingApproval', 'overdueContact'],
  },
  { key: 'all', label: 'Tất cả', columns: [] as string[] },
] as const;

export function summaryColumns(): SummaryColumn[] {
  return [
    { key: 'students', label: 'Sĩ số', group: 'total' },
    { key: 'sos3', label: SOS_LABEL[3], group: 'sos', hint: 'Học viên đang có mức SOS 3' },
    { key: 'sos2', label: SOS_LABEL[2], group: 'sos' },
    { key: 'sos1', label: SOS_LABEL[1], group: 'sos' },
    ...ENTRY_SKILLS.map((s) => ({
      key: `skill_${s}`,
      label: ENTRY_SKILL_SHORT[s],
      group: 'skill' as const,
      hint: `Vấn đề Học thuật ở ${ENTRY_SKILL_SHORT[s]} — tổng / chưa có phương án`,
    })),
    {
      key: 'behaviour', label: 'Ý thức', group: 'behaviour',
      hint: BEHAVIOUR_TOPICS.map((t) => BEHAVIOUR_TOPIC_LABEL[t]).join(' · '),
    },
    { key: 'reported', label: 'GV báo', group: 'total', hint: 'Vấn đề giáo viên tự ghi nhận, không sinh từ điểm' },
    { key: 'openCases', label: 'Vấn đề đang mở', group: 'total', hint: 'Tổng / chưa có phương án hỗ trợ' },
    { key: 'noPlan', label: 'Chưa có phương án', group: 'total' },
    { key: 'overdueReview', label: 'Quá hạn cập nhật', group: 'total' },
    { key: 'pendingApproval', label: 'Chờ duyệt', group: 'total' },
    { key: 'overdueContact', label: 'Chưa trao đổi', group: 'total', hint: 'Quá hạn hai việc trao đổi bắt buộc' },
  ];
}

type Cell = { value: number; of?: number; href?: string };

/**
 * @param f.branchId Có thì hàng là LỚP của chi nhánh đó; không có thì hàng là CHI NHÁNH.
 */
export function branchSummary(p: Principal, f: { branchId?: number | null } = {}) {
  const conn = db();
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) {
    return {
      rows: [] as ReturnType<typeof buildRow>[],
      total: { label: 'Cả trung tâm', cells: {} as Record<string, Cell> },
      columns: summaryColumns(), presets: SUMMARY_PRESETS,
      level: 'branch' as const, scopeEmpty: true,
    };
  }

  const cases = listCases(p, { branchId: f.branchId ?? undefined }).rows;
  const byBranch = f.branchId == null;

  /* Nhóm theo chi nhánh hoặc theo lớp, tuỳ đang đứng ở tầng nào. */
  const groups = new Map<string, { key: string; label: string; branchId: number | null; classId: number | null }>();
  const branches = conn.prepare('SELECT id, code, name FROM branches ORDER BY id').all() as any[];
  const classes = conn
    .prepare(`SELECT id, code, branch_id FROM classes WHERE status = 'active' ORDER BY branch_id, code`)
    .all() as any[];
  if (byBranch) {
    for (const b of branches) {
      if (!cases.some((c) => c.branchId === b.id) && scope.branchIds && !scope.branchIds.includes(b.id)) continue;
      groups.set(`b${b.id}`, { key: `b${b.id}`, label: b.name, branchId: b.id, classId: null });
    }
  } else {
    for (const c of classes.filter((x) => x.branch_id === f.branchId)) {
      groups.set(`c${c.id}`, { key: `c${c.id}`, label: c.code, branchId: c.branch_id, classId: c.id });
    }
  }

  const studentCounts = new Map<string, number>();
  for (const r of conn
    .prepare(
      `SELECT cl.id AS class_id, cl.branch_id, COUNT(*) AS n
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
         JOIN classes cl ON cl.id = e.class_id
        WHERE e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL
        GROUP BY cl.id`,
    )
    .all() as any[]) {
    const k = byBranch ? `b${r.branch_id}` : `c${r.class_id}`;
    studentCounts.set(k, (studentCounts.get(k) ?? 0) + r.n);
  }

  /* Hai việc trao đổi quá hạn — đếm theo LƯỢT, không theo vấn đề. */
  const overdueContacts = new Map<string, number>();
  for (const r of conn
    .prepare(
      `SELECT cl.id AS class_id, cl.branch_id, COUNT(DISTINCT c.attempt_id) AS n
         FROM student_contacts c
         JOIN students s ON s.id = c.student_id
         LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         LEFT JOIN classes cl ON cl.id = e.class_id
        WHERE c.done_on IS NULL AND c.due_date IS NOT NULL AND c.due_date < date('now')
        GROUP BY cl.id`,
    )
    .all() as any[]) {
    const k = byBranch ? `b${r.branch_id}` : `c${r.class_id}`;
    if (groups.has(k)) overdueContacts.set(k, (overdueContacts.get(k) ?? 0) + r.n);
  }

  const pendingApprovals = new Map<string, number>();
  for (const r of conn
    .prepare(
      `SELECT sc.id AS case_id, COUNT(*) n FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE iv.approval_state = 'pending' GROUP BY sc.id`,
    )
    .all() as any[]) {
    const c = cases.find((x) => x.id === r.case_id);
    if (!c) continue;
    const k = byBranch ? `b${c.branchId}` : `c${c.classId}`;
    if (groups.has(k)) pendingApprovals.set(k, (pendingApprovals.get(k) ?? 0) + r.n);
  }

  const buildRow = (g: { key: string; label: string; branchId: number | null; classId: number | null }) => {
    const mine = cases.filter((c) => (byBranch ? c.branchId === g.branchId : c.classId === g.classId));
    const open = mine.filter((c) => c.state !== 'done');
    const q = (extra: string) => `/?tab=tinh-hinh${g.branchId ? `&cn=${g.branchId}` : ''}${extra}`;

    /*
     * MỖI HỌC VIÊN CHỈ ĐỨNG Ở ĐÚNG MỘT CỘT SOS — cột của LƯỢT MT GẦN NHẤT.
     *
     * Lỗi owner báo 12/09: sĩ số 8 mà ba cột SOS cộng lại thành 11. Bản cũ đếm học viên
     * duy nhất cho từng mức riêng lẻ, nên một em SOS 1 ở MT1 rồi SOS 3 ở MT2 có mặt ở
     * CẢ HAI cột — cộng lại vượt cả sĩ số và không ai tin con số nữa.
     *
     * SOS là TÌNH TRẠNG HIỆN TẠI của một em, không phải một cái sổ cộng dồn: mức của em
     * là mức ở lượt MT mới nhất em đã làm. Mức cũ vẫn tra lại được trong từng case, chỉ
     * không đếm vào bảng tổng hợp nữa.
     *
     * Case do giáo viên tự báo không có `sosLevel` nên không tham gia phép đếm này —
     * chúng đã có cột "GV báo" riêng.
     */
    const currentSos = new Map<number, number>();
    const latestAttempt = new Map<number, number>();
    for (const c of open) {
      if (c.studentId == null || !c.sosLevel) continue;
      const at = c.attemptNo ?? 0;
      const seen = latestAttempt.get(c.studentId);
      if (seen === undefined || at > seen) {
        latestAttempt.set(c.studentId, at);
        currentSos.set(c.studentId, c.sosLevel);
      } else if (at === seen) {
        // Cùng một lượt thì mọi case mang cùng mức; lấy mức cao nhất cho chắc.
        currentSos.set(c.studentId, Math.max(currentSos.get(c.studentId) ?? 0, c.sosLevel));
      }
    }
    const sosStudents = (lv: number) => {
      let n = 0;
      for (const level of currentSos.values()) if (level === lv) n += 1;
      return n;
    };
    const skillCell = (s: string): Cell => {
      const list = open.filter((c) => c.topic === s);
      return { value: list.length, of: list.filter((c) => c.state === 'no_plan').length, href: q(`&ky-nang=${s}`) };
    };
    const cells: Record<string, Cell> = {
      students: { value: studentCounts.get(g.key) ?? 0 },
      sos3: { value: sosStudents(3), href: q('&hang-doi=review') },
      sos2: { value: sosStudents(2) },
      sos1: { value: sosStudents(1) },
      behaviour: {
        value: open.filter((c) => c.track === 'behaviour').length,
        of: open.filter((c) => c.track === 'behaviour' && c.state === 'no_plan').length,
        href: q('&nhom=behaviour'),
      },
      reported: { value: open.filter((c) => c.originKind === 'teacher_report').length },
      openCases: {
        value: open.length,
        of: open.filter((c) => c.state === 'no_plan').length,
        href: q(''),
      },
      noPlan: { value: open.filter((c) => c.state === 'no_plan').length, href: q('&tinh-hinh=no_plan') },
      overdueReview: { value: open.filter((c) => c.dueOverdue).length, href: q('&hang-doi=due') },
      pendingApproval: { value: pendingApprovals.get(g.key) ?? 0 },
      overdueContact: { value: overdueContacts.get(g.key) ?? 0 },
    };
    for (const s of ENTRY_SKILLS) cells[`skill_${s}`] = skillCell(s);
    return { key: g.key, label: g.label, branchId: g.branchId, classId: g.classId, cells };
  };
  const rows = [...groups.values()].map(buildRow);

  /* Hàng TỔNG cộng lại từ chính các hàng trên, không đếm lại — hai đường tính sẽ lệch nhau. */
  const totalCells: Record<string, Cell> = {};
  for (const col of summaryColumns()) {
    const v = rows.reduce((a, r) => a + (r.cells[col.key]?.value ?? 0), 0);
    const of = rows.reduce((a, r) => a + (r.cells[col.key]?.of ?? 0), 0);
    totalCells[col.key] = { value: v, ...(rows.some((r) => r.cells[col.key]?.of !== undefined) ? { of } : {}) };
  }

  return {
    rows: rows.filter((r) => (r.cells.students?.value ?? 0) > 0 || (r.cells.openCases?.value ?? 0) > 0),
    total: { label: byBranch ? 'Cả trung tâm' : 'Cả chi nhánh', cells: totalCells },
    columns: summaryColumns(),
    presets: SUMMARY_PRESETS,
    level: (byBranch ? 'branch' : 'class') as 'branch' | 'class',
    scopeEmpty: false,
  };
}
