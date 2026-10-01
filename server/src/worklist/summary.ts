import { db } from '../db.ts';
import {
  CASE_CATEGORY_LABEL, CASE_CATEGORY_SHORT,
  PERMISSIONS, SOS_LABEL, soSanhLop,
} from '../../../shared/domain/index.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { listCases } from '../cases/cases.ts';
import { NOT_UNCONFIRMED_PRESET } from '../cases/sosState.ts';
import { standingFor } from '../students/standing.ts';

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
  group: 'sos' | 'skill' | 'total';
  hint?: string;
};

/**
 * BỘ CỘT ĐẶT SẴN — mục 10.6.
 *
 * Bộ "Tất cả" là bộ cột ĐẦY ĐỦ owner liệt kê; ba bộ còn lại là những lát cắt hẹp hơn của
 * chính nó, không phải ba bảng khác nhau. Chọn bộ cột thay cho mười lăm ô tick bật/tắt từng
 * cột: ô tick là thứ dễ làm mà gần như không ai dùng, và đúng chỗ hệ thống bắt đầu rối.
 */
/** Sáu cột môn của bảng tổng hợp: năm ô của Fast Track cộng thêm W của Normal. */
const SUMMARY_SKILLS = ['listening', 'reading', 'writing1', 'writing2', 'writing', 'speaking'] as const;

/**
 * BỐN BỘ CỘT (mục 4.3).
 *
 * Bộ MẶC ĐỊNH nay đúng bằng bộ cột owner chốt cho chế độ "Vấn đề":
 *
 *   Chi nhánh/Lớp · HV có case · Case mở · Thiếu phương án · Cần cập nhật · Quá hạn
 *
 * Bộ "Cần chú ý" cũ đã BỎ: nó trộn ba loại số khác đơn vị (học viên, case, phương án) vào
 * một bảng không có tên chung, và không ai đọc ra được nó đang nói về cái gì.
 */
export const SUMMARY_PRESETS = [
  {
    key: 'default', label: 'Vấn đề',
    columns: ['caseStudents', 'openCases', 'noPlan', 'overdueReview', 'overdueContact'],
  },
  {
    key: 'sos', label: 'Mức SOS',
    columns: ['students', 'sos3', 'sos2', 'sos1', 'caseStudents', 'openCases'],
  },
  {
    key: 'skills', label: 'Theo kỹ năng',
    columns: ['openCases', ...SUMMARY_SKILLS.map((s) => `skill_${s}`)],
  },
  { key: 'all', label: 'Tất cả', columns: [] as string[] },
] as const;

/**
 * Thứ tự cột của bộ "Tất cả", đúng như owner liệt kê ở mục 10.6:
 *
 *   Chi nhánh/Lớp · Case · SOS 3 · SOS 2 · SOS 1 · L · R · W1 · W2 · W · S ·
 *   Đang xử lý · Thiếu phương án · Quá hạn cập nhật · Chờ duyệt
 *
 * Sáu cột môn chứ không năm: W của lớp Normal đứng riêng, không gộp vào W2 của Fast Track.
 * Ô trống ở W với một lớp Fast Track là ĐÚNG — lớp đó không có môn ấy.
 *
 * Sĩ số và "GV báo" giữ lại nhưng đứng ngoài bốn bộ cột chính: sĩ số là thông tin nền để
 * đọc các cột khác, còn "GV báo" chỉ cần khi đi tìm case không sinh từ điểm.
 */
export function summaryColumns(): SummaryColumn[] {
  return [
    { key: 'students', label: 'Sĩ số', group: 'total', hint: 'Học viên đang học, không tính em đã kết thúc' },
    { key: 'caseStudents', label: 'HV có case', group: 'total',
      hint: 'Đếm HỌC VIÊN đang có ít nhất một case mở — một em ba case vẫn chỉ tính một lần' },
    { key: 'openCases', label: 'Case mở', group: 'total',
      hint: 'Đếm từng CASE đang mở — đơn vị khác cột bên trái. Số sau gạch chéo là phần chưa có phương án' },
    { key: 'sos3', label: SOS_LABEL[3], group: 'sos', hint: 'Học viên đang ở mức SOS 3 — đếm người, mỗi em một cột' },
    { key: 'sos2', label: SOS_LABEL[2], group: 'sos', hint: 'Học viên đang ở mức SOS 2' },
    { key: 'sos1', label: SOS_LABEL[1], group: 'sos' , hint: 'Học viên đang ở mức SOS 1' },
    ...SUMMARY_SKILLS.map((s) => ({
      key: `skill_${s}`,
      label: CASE_CATEGORY_SHORT[s],
      group: 'skill' as const,
      hint: s === 'writing'
        ? 'Case môn Writing của lớp Normal — KHÔNG gộp chung với Writing Task 2 của Fast Track'
        : s === 'writing1' || s === 'writing2'
        ? `Case ${CASE_CATEGORY_LABEL[s]} — chỉ lớp Fast Track mới có hai bài Writing riêng`
        : `Case Học thuật ở ${CASE_CATEGORY_LABEL[s]} — tổng / chưa có phương án`,
    })),
    { key: 'chuaXuLy', label: 'Chưa xử lý', group: 'total', hint: 'Case từ SOS chưa xác nhận đủ nguyên nhân và PA do người xác nhận' },
    { key: 'working', label: 'Đang xử lý', group: 'total', hint: 'Case đã có phương án và đang theo dõi' },
    { key: 'noPlan', label: 'Thiếu PA học thuật', group: 'total', hint: 'Case chưa ai ghi sẽ làm gì cho em' },
    { key: 'overdueReview', label: 'Cần cập nhật', group: 'total',
      hint: 'Đã qua hẹn xem lại mà chưa cập nhật tình hình hoặc kết quả' },
    { key: 'pendingApproval', label: 'Chờ duyệt', group: 'total',
      hint: 'Phương án giáo viên đề xuất, đang chờ Quản lý trả lời' },
    { key: 'reported', label: 'GV báo', group: 'total', hint: 'Case giáo viên tự ghi nhận, không sinh từ điểm' },
    {
      key: 'overdueContact', label: 'Quá hạn', group: 'total',
      hint: 'Học viên có phương án đã lên kế hoạch mà quá hạn làm (3/5/7 ngày theo mức SOS)',
    },
  ];
}

/**
 * W CỦA NORMAL LÀ MỘT CỘT RIÊNG, KHÔNG GỘP VÀO W2 CỦA FAST TRACK — owner chốt ở vòng 5.
 *
 * Vòng 4 từng gộp để bảng bớt một cột. Nhưng W2 là bài luận IELTS chấm theo bốn tiêu chí
 * band, còn W là bài viết của lớp Normal chấm theo điểm đạt/tổng điểm — cộng chúng vào một
 * ô thì con số ấy không trả lời được câu hỏi nào.
 *
 * Còn lại đúng MỘT phép gộp, và nó chỉ để đọc DỮ LIỆU CŨ: Foundation trước đây gọi môn nói
 * là Pronunciation. Môn đó đã bỏ ở vòng 5, nên đây chỉ là đường đọc lại lịch sử.
 */
const LEGACY_SKILL_ROLLUP: Record<string, string> = {
  pronunciation: 'speaking',
  prep_writing: 'writing',
};


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
  const groups = new Map<string, {
    key: string; label: string; branchId: number | null; classId: number | null; isFt: boolean;
  }>();
  const branches = conn.prepare('SELECT id, code, name FROM branches ORDER BY id').all() as any[];
  const classes = conn
    .prepare(`SELECT id, code, branch_id, is_fast_track FROM classes WHERE status = 'active'`)
    .all() as any[];
  classes.sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }));   // PR-UXF-a U1
  if (byBranch) {
    for (const b of branches) {
      if (!cases.some((c) => c.branchId === b.id) && scope.branchIds && !scope.branchIds.includes(b.id)) continue;
      groups.set(`b${b.id}`, { key: `b${b.id}`, label: b.name, branchId: b.id, classId: null, isFt: false });
    }
  } else {
    for (const c of classes.filter((x) => x.branch_id === f.branchId)) {
      groups.set(`c${c.id}`, {
        key: `c${c.id}`, label: c.code, branchId: c.branch_id, classId: c.id, isFt: !!c.is_fast_track,
      });
    }
  }

  const studentCounts = new Map<string, number>();
  /*
   * HỌC VIÊN ĐANG HỌC của từng nhóm, kèm mã nhóm để tính tình trạng học thuật ngay bên dưới.
   * Sĩ số chỉ đếm ghi danh ĐANG HOẠT ĐỘNG — em đã kết thúc hoặc đã chuyển đi không tính.
   */
  const studentsOf = new Map<string, number[]>();
  for (const r of conn
    .prepare(
      `SELECT e.student_id, cl.id AS class_id, cl.branch_id
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
         JOIN classes cl ON cl.id = e.class_id
        WHERE e.status = 'active' AND s.status = 'active' AND s.archived_at IS NULL`,
    )
    .all() as any[]) {
    const k = byBranch ? `b${r.branch_id}` : `c${r.class_id}`;
    studentCounts.set(k, (studentCounts.get(k) ?? 0) + 1);
    if (!studentsOf.has(k)) studentsOf.set(k, []);
    studentsOf.get(k)!.push(r.student_id);
  }

  /*
   * MỨC SOS LẤY TỪ KẾT QUẢ BÀI GẦN NHẤT (mục 2.1), không suy từ case còn mở.
   *
   * Tính một lần cho toàn bộ học viên đang hiện trên bảng, rồi mỗi hàng chỉ việc đếm. Đây
   * cũng chính là phép tính mà bảng lớp và hồ sơ học viên dùng, nên ba màn không thể nói ba
   * con số khác nhau về cùng một em.
   */
  const allStudentIds = [...new Set([...studentsOf.values()].flat())];
  const standing = standingFor(allStudentIds);

  /*
   * PHƯƠNG ÁN QUÁ HẠN LÀM — đếm theo HỌC VIÊN, không theo phương án.
   *
   * Cột này trước là "Chưa trao đổi", đọc từ bảng Liên hệ riêng đã bỏ. Nay nó rộng hơn và
   * đúng hơn: mọi phương án đã lên kế hoạch mà quá hạn làm, kể cả hai việc trao đổi.
   *
   * Đếm theo học viên vì đây là bảng trả lời "chi nhánh nào đang tắc": ba phương án quá hạn
   * của cùng một em là MỘT em bị bỏ quên, không phải ba.
   *
   * So với ngày DEMO chứ không phải `date('now')` — bản trước so với giờ thật của máy, nên
   * trên dữ liệu demo con số này luôn sai.
   */
  const overdueContacts = new Map<string, number>();
  for (const r of conn
    .prepare(
      `SELECT cl.id AS class_id, cl.branch_id, COUNT(DISTINCT s.id) AS n
         FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
         JOIN students s ON s.id = sc.student_id
         LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
         LEFT JOIN classes cl ON cl.id = e.class_id
        WHERE iv.status IN ('planned', 'started')
          AND iv.action_due IS NOT NULL AND iv.action_due < ?
          AND sc.status != 'done'
          AND COALESCE(iv.approval_state, '') != 'pending'
          AND ${NOT_UNCONFIRMED_PRESET('iv')}
          AND s.archived_at IS NULL
        GROUP BY cl.id`,
    )
    .all(demoToday()) as any[]) {
    const k = byBranch ? `b${r.branch_id}` : `c${r.class_id}`;
    if (groups.has(k)) overdueContacts.set(k, (overdueContacts.get(k) ?? 0) + r.n);
  }

  const pendingApprovals = new Map<string, number>();
  for (const r of conn
    .prepare(
      `SELECT sc.id AS case_id, COUNT(*) n FROM case_interventions iv
         JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE iv.approval_state = 'pending' AND iv.status != 'cancelled' AND sc.status != 'done' GROUP BY sc.id`,
    )
    .all() as any[]) {
    const c = cases.find((x) => x.id === r.case_id);
    if (!c) continue;
    const k = byBranch ? `b${c.homeBranchId ?? c.branchId}` : `c${c.homeClassId ?? c.classId}`;
    if (groups.has(k)) pendingApprovals.set(k, (pendingApprovals.get(k) ?? 0) + r.n);
  }

  const buildRow = (g: {
    key: string; label: string; branchId: number | null; classId: number | null; isFt: boolean;
  }) => {
    /*
     * GOM THEO LỚP EM ĐANG HỌC, không phải lớp lúc đánh giá.
     *
     * Hàng này đặt cột "sĩ số" cạnh ba cột SOS, mà sĩ số đếm theo ghi danh đang hoạt động.
     * Trộn hai mốc thời gian vào một hàng thì một lớp vừa chuyển bốn em đi sẽ có sĩ số 2 mà
     * SOS cộng lại bằng 5 — đúng kiểu mâu thuẫn số đếm owner nêu ở mục 8.1. `listCases` lọc
     * theo cùng ô này, nên bấm vào con số ra đúng danh sách tạo nên nó.
     */
    const mine = cases.filter((c) => (byBranch
      ? (c.homeBranchId ?? c.branchId) === g.branchId
      : (c.homeClassId ?? c.classId) === g.classId));
    const open = mine.filter((c) => c.state !== 'done');
    const q = (extra: string) => `/?tab=tinh-hinh${g.branchId ? `&cn=${g.branchId}` : ''}${extra}`;

    /*
     * MỖI HỌC VIÊN ĐỨNG ĐÚNG MỘT CỘT SOS — cột của BÀI ĐÁNH GIÁ GẦN NHẤT của em.
     *
     * Em chưa thi lượt nào, hoặc thi rồi mà chưa nhập ô điểm nào, thì KHÔNG vào cột nào cả:
     * "chưa biết" không phải là "đạt", và cũng không phải là một mức SOS.
     *
     * Ba cột SOS cộng lại vì thế luôn ≤ sĩ số, và chúng loại trừ nhau thật.
     */
    const mineStudents = studentsOf.get(g.key) ?? [];
    const sosStudents = (lv: number) =>
      mineStudents.filter((id) => standing.get(id)?.sosLevel === lv).length;
    const skillCell = (s: string): Cell => {
      const list = open.filter((c) => (LEGACY_SKILL_ROLLUP[c.topic ?? ''] ?? c.topic) === s);
      return { value: list.length, of: list.filter((c) => c.state === 'no_plan').length, href: q(`&ky-nang=${s}`) };
    };
    const cells: Record<string, Cell> = {
      students: { value: studentCounts.get(g.key) ?? 0 },
      sos3: { value: sosStudents(3), href: q('&hang-doi=review') },
      sos2: { value: sosStudents(2) },
      sos1: { value: sosStudents(1) },
      reported: { value: open.filter((c) => c.originKind === 'teacher_report').length },
      openCases: {
        value: open.length,
        of: open.filter((c) => c.state === 'no_plan').length,
        href: q(''),
      },
      /*
       * HỌC VIÊN CÓ CASE — đơn vị khác hẳn cột "Case mở" ngay bên cạnh, và cố ý khác (mục 2.2).
       * Một em ba case là MỘT học viên và BA case; hai con số này không bao giờ được trộn.
       */
      caseStudents: {
        value: new Set(open.map((c) => c.studentId).filter((x) => x !== null)).size,
        href: q(''),
      },
      chuaXuLy: { value: open.filter((c) => c.state === 'chua_xu_ly').length, href: q('&tinh-hinh=chua_xu_ly') },
      working: { value: open.filter((c) => c.state === 'working').length, href: q('&tinh-hinh=working') },
      noPlan: { value: open.filter((c) => c.state === 'no_plan').length, href: q('&tinh-hinh=no_plan') },
      overdueReview: { value: open.filter((c) => c.dueOverdue).length, href: q('&hang-doi=due') },
      pendingApproval: { value: pendingApprovals.get(g.key) ?? 0 },
      overdueContact: { value: overdueContacts.get(g.key) ?? 0 },
    };
    for (const s of SUMMARY_SKILLS) cells[`skill_${s}`] = skillCell(s);
    return {
      key: g.key, label: g.label, branchId: g.branchId, classId: g.classId,
      /* Normal và FT vận hành khác nhau, nên bảng lớp gom theo hai nhóm này (mục 10.6). */
      group: g.isFt ? 'ft' : 'normal', cells,
    };
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
