import { db, tx } from '../db.ts';
import {
  ATTEMPT_KIND_SHORT, ENTRY_SKILLS, PERMISSIONS, awaitingScore, chuanHoaMaLop, soSanhLop, kiemPhanCong, moRongPhanCong, nhanKetThucVi, nhanTiepTheo,
  oPhanCong, pendingSkillsOf, skillShort, trongHaiTuanCuoi, viecTiepTheoCua,
  type AssessedSkill, type SlotPhanCong, type AttemptKind, type PendingCell, type ProgrammeCode, type WorkScope,
  coMocTiepTheo, mocKeTiep,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import {
  can, classScopeSql, defaultWorkScope, editableSkills, isCoreTeacherOf, mySkills, require_, scopeFor,
  type Principal,
} from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { loadBundle, pendingInputOf, regularSkillViews, resultOf, skillCells } from '../fasttrack/attempts.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';
import { dotHoanTatMany, type HoanTatInfo } from '../fasttrack/hoanTat.ts';
import { standingFor, standingLine } from '../students/standing.ts';
import { allProgrammes, evaluateRegular, programmeOfClass } from '../normal/regular.ts';
import { classProgressMany, missingForClasses, missingForStudent } from './schedule.ts';
import { canhBaoTheoHocVien, caseMoTheoHocVien } from './dongHocVien.ts';
import { demChuaLoTrinh, tiepTheoTheoHocVien } from './loTrinhTiep.ts';
import { classWarning } from '../yThuc/canhBao.ts';
import { listCases } from '../cases/cases.ts';

/**
 * Màn Học viên lấy LỚP làm gốc.
 *
 * Chỉ ba badge, và chỉ những badge trả lời được câu "có gì cần làm?". Sĩ số là thông tin
 * nền nên để dạng chữ, không làm badge. Mỗi badge mở đúng tập bản ghi cấu thành số đó
 * trong cùng phạm vi, nên số đếm ở đây phải dùng chính logic của danh sách lượt.
 */
export type ClassSummary = {
  id: number; code: string; kind: string; route: string | null;
  branchId: number; branchCode: string; branchName: string;
  startDate: string | null;
  studentCount: number;
  /** Số LƯỢT có kỹ năng tới hạn mà người đang xem được phép nhập điểm. */
  needScores: number;
  /** `needScores` đang đếm CỦA AI: `mine` (phần mình phải chấm) hay `managed` (cả lớp trong phạm vi). Badge phải nói đúng điều này. */
  workScope: WorkScope;
  /** Số CASE SOS chưa xử lý xong — đếm case, không phải học viên. */
  openCases: number;
  programmeCode: string | null;
  programmeName: string | null;
  scoringMode: string | null;
  mySkills: string[];
  myCoreClass: boolean;
  /*
   * TIẾN ĐỘ VÀ CHUYỆN CẦN BÁO CỦA LỚP — mục 7.6, và yêu cầu owner bổ sung 13/09/2026.
   *
   * `progressLabel` là MỘT DÒNG đọc được ngay ("BE · tuần 5/10 · Progress Test tuần này").
   * Dựng ở máy chủ vì nhiều màn cùng cần đúng câu đó; để mỗi màn tự ghép thì sẽ có màn ghép
   * thiếu và hai màn nói khác nhau về cùng một lớp.
   */
  progressLabel: string | null;
  phase: string;
  phaseLabel: string;
  currentWeek: number | null;
  totalWeeks: number | null;
  /** Lớp đã hết chương trình và còn học viên đang học → phải xếp lớp tiếp cho từng em. */
  needsPlacement: boolean;
  placementOptions: { code: string; name: string }[];
  /** Gom mọi thứ lớp còn thiếu vào MỘT badge, kèm danh sách kỹ năng thiếu giáo viên. */
  missing: { key: string; label: string; who: string }[];
  missingSkills: string[];
  /** Số em THẬT SỰ cần xếp lớp tiếp ngay — badge "Hết khoá" (PR-LT, Q9). */
  canXepLop: number;
  /** Số em lớp thường chưa ghi Lộ trình tiếp theo, chỉ đếm ở hai tuần cuối khoá (PR-LT, Q5). */
  soChuaLoTrinhTiep: number;
  nhacLoTrinh: boolean;
};

/**
 * Phần tiến độ + thiếu thông tin của MỘT LOẠT lớp, gói sẵn cho danh sách lớp.
 *
 * Gộp thành hai hàm hàng loạt chứ không gọi trong vòng lặp: bản đầu biến một trang mười lớp
 * thành tám mươi câu truy vấn, và bài kiểm N+1 bắt đúng chỗ đó. Ở quy mô demo không ai thấy
 * chậm — ở quy mô thật thì thấy ngay.
 *
 * CẢ danh sách lớp lẫn trang chi tiết lớp đều dùng đúng bộ này, nên hai màn không thể nói
 * khác nhau về cùng một lớp.
 */
function progressMapOf(classIds: number[], programmes: ReturnType<typeof allProgrammes>) {
  const prs = classProgressMany(classIds, programmes);
  const ms = missingForClasses(classIds, programmes);
  const chua = demChuaLoTrinh(classIds);
  const out = new Map<number, {
    progressLabel: string | null; phase: string; phaseLabel: string;
    currentWeek: number | null; totalWeeks: number | null;
    needsPlacement: boolean; placementOptions: { code: string; name: string }[];
    missing: { key: string; label: string; who: string }[]; missingSkills: string[];
    canXepLop: number; soChuaLoTrinhTiep: number; nhacLoTrinh: boolean;
  }>();
  for (const id of classIds) {
    const pr = prs.get(id);
    const m = ms.get(id);
    /* Lộ trình tiếp theo chỉ áp dụng lớp thường, và chỉ nhắc ở hai tuần cuối khoá (Q5). */
    const nhacLoTrinh = !!pr && pr.programmeCode !== 'FT'
      && trongHaiTuanCuoi(pr.currentWeek, pr.totalWeeks, pr.phase);
    out.set(id, {
      progressLabel: pr?.label ?? null,
      phase: (pr?.phase ?? 'unknown') as string,
      phaseLabel: pr?.phaseLabel ?? '',
      currentWeek: pr?.currentWeek ?? null,
      totalWeeks: pr?.totalWeeks ?? null,
      needsPlacement: pr?.needsPlacement ?? false,
      placementOptions: (pr?.placementOptions ?? []) as { code: string; name: string }[],
      missing: m?.items ?? [],
      missingSkills: m?.missingSkills ?? [],
      canXepLop: pr?.canXepLop ?? 0,
      soChuaLoTrinhTiep: nhacLoTrinh ? (chua.get(id) ?? 0) : 0,
      nhacLoTrinh,
    });
  }
  return out;
}

/** Một truy vấn cho mỗi loại dữ liệu, không hỏi lại theo từng lớp. */
export function listClassSummaries(p: Principal, f: { branchId?: number; q?: string; scope?: WorkScope } = {}) {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { rows: [] as ClassSummary[], scopeEmpty: true };
  const workScope: WorkScope = f.scope ?? defaultWorkScope(p);
  const conn = db();
  const cs = classScopeSql(scope);
  const where: string[] = [cs.sql, "c.status = 'active'"];
  const params: unknown[] = [...cs.params];
  if (f.branchId) { where.push('c.branch_id = ?'); params.push(f.branchId); }

  const classes = conn
    .prepare(
      `SELECT c.id, c.code, c.kind, c.programme_code, c.route, c.branch_id, c.start_date,
              b.code AS branch_code, b.name AS branch_name,
              pg.name AS programme_name, pg.scoring_mode,
              (SELECT COUNT(*) FROM enrollments e JOIN students s ON s.id = e.student_id
                WHERE e.class_id = c.id AND e.status = 'active' AND s.archived_at IS NULL) AS student_count
         FROM classes c
         JOIN branches b ON b.id = c.branch_id
         LEFT JOIN programmes pg ON pg.code = c.programme_code
        WHERE ${where.join(' AND ')} ORDER BY b.id, c.code`,
    )
    .all(...params) as any[];
  if (!classes.length) return { rows: [], scopeEmpty: false };
  classes.sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }));

  const ids = classes.map((c) => c.id);
  const ph = ids.map(() => '?').join(',');
  const attempts = conn
    .prepare(
      `SELECT a.id, a.class_id, a.status, a.planned_period_id,
              a.deadline_override, a.target_at_attempt, a.attempt_no, a.lich_su,
              rp.week_start AS period_start, rp.week_end AS period_end
         FROM assessment_attempts a
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.class_id IN (${ph}) AND a.status != 'cancelled'`,
    )
    .all(...ids) as any[];
  const bundle = loadBundle(attempts.map((a) => a.id));
  const today = demoToday();

  const needScores = new Map<number, number>();
  const openCases = new Map<number, number>();
  /*
   * Lớp FT và lớp thường có bộ kỹ năng khác nhau, nên phải hỏi quyền theo đúng bộ của lớp
   * đó — hỏi bằng bộ kỹ năng IELTS cho một lớp Foundation thì luôn ra rỗng.
   */
  const editableByClass = new Map<number, string[]>();
  const mineByClass = new Map<number, string[]>();
  const skillsByClass = new Map<number, string[]>();
  const ratioClasses = new Set<number>();
  const programmes = allProgrammes();          // ba câu lệnh cho cả bảng, không phải ba câu mỗi lớp
  for (const c of classes) {
    const prog = c.programme_code ? programmes.get(c.programme_code) ?? null : null;
    const skills = prog?.skills ?? [...ENTRY_SKILLS];
    if (prog?.scoringMode === 'ratio') ratioClasses.add(c.id);
    skillsByClass.set(c.id, skills);
    editableByClass.set(c.id, editableSkills(p, c.id, skills));
    mineByClass.set(c.id, mySkills(p, c.id, skills));
  }

  const bump = (m: Map<number, number>, k: number, by = 1) => m.set(k, (m.get(k) ?? 0) + by);
  for (const a of attempts) {
    const c = bundle.cases.get(a.id);
    if (c && c.sos_level > 0 && c.status !== 'done') bump(openCases, a.class_id);

    if (ratioClasses.has(a.class_id)) {
      /*
       * Lớp thường: "cần nhập điểm" là kỹ năng còn thiếu điểm mà đã tới ngày làm, trong
       * ĐÚNG PHẠM VI đang xem. Thiếu điểm KHÁC trượt, nên chỉ đếm là việc phải làm chứ
       * không kết luận. `editableOrAll` là bộ kỹ năng CỦA CHƯƠNG TRÌNH, không phải riêng
       * kỹ năng sửa được — phạm vi quản lý phải đếm cả môn người xem không sửa được.
       */
      const rows = bundle.scores.get(a.id) ?? [];
      const editableOrAll = skillsByClass.get(a.class_id) ?? [];
      const mineSkills = mineByClass.get(a.class_id) ?? [];
      /* Hỏi theo TỪNG MÔN: bốn môn của một bài có thể ở ba tuần khác nhau (mục 10.1). */
      const views = regularSkillViews(a, bundle.skillRows.get(a.id), rows, today);
      const cells: PendingCell[] = editableOrAll.map((k) => {
        const row = rows.find((r) => r.skill === k);
        const v = views.get(k);
        return {
          skill: k,
          required: !!v,
          scored: row?.raw_score !== null && row?.raw_score !== undefined,
          progress: v?.progress ?? 'upcoming',
          mine: mineSkills.includes(k),
        };
      });
      /*
       * ĐẾM Ô, KHÔNG ĐẾM ĐỢT. Chấm xong ba trong bốn môn mà số không giảm thì người dùng
       * tưởng mình chưa làm gì. Và dùng ĐÚNG hàm mà danh sách đích dùng, để hai số không
       * thể lệch.
       */
      const pending = pendingSkillsOf(cells, workScope);
      if (pending.length) bump(needScores, a.class_id, pending.length);
      continue;
    }

    /* Không truyền `hoanTat` (R11) có chủ ý: chỉ đếm ô chưa có điểm theo band/noShow/mine, không đọc canEdit/khoa — đỡ 3 câu SQL. */
    const cells = skillCells(p, a, bundle.scores.get(a.id) ?? [], bundle.skips.get(a.id) ?? [], today, bundle.skillRows.get(a.id));
    const pending = pendingSkillsOf(pendingInputOf(cells), workScope);
    if (pending.length) bump(needScores, a.class_id, pending.length);
  }

  const progressByClass = progressMapOf(classes.map((c) => c.id), programmes);

  let rows: ClassSummary[] = classes.map((c) => ({
    id: c.id, code: c.code, kind: c.kind, route: c.route,
    programmeCode: c.programme_code ?? null,
    programmeName: c.programme_name ?? null,
    /** Lớp Normal chấm theo điểm đạt/tổng điểm; lớp Fast Track chấm theo band IELTS. */
    scoringMode: c.scoring_mode ?? null,
    branchId: c.branch_id, branchCode: c.branch_code, branchName: c.branch_name,
    startDate: c.start_date,
    studentCount: c.student_count,
    needScores: needScores.get(c.id) ?? 0,
    workScope,
    openCases: openCases.get(c.id) ?? 0,
    /*
     * Kỹ năng người ĐANG XEM dạy ở chính lớp này.
     *
     * Một giáo viên dạy nhiều lớp và ở mỗi lớp có thể ôm bộ kỹ năng khác nhau — nhìn danh
     * sách lớp mà không biết mình phụ trách gì ở đâu thì phải mở từng lớp ra dò.
     */
    /*
     * Chỉ có nghĩa khi đây là PHÂN CÔNG của một giáo viên. Admin chi nhánh sửa được mọi kỹ
     * năng nhờ quyền nhập bù, không phải vì được giao dạy — hiện cả bộ kỹ năng ra cho họ chỉ
     * là một dãy chữ vô nghĩa. Bằng đúng bộ kỹ năng của lớp nghĩa là "sửa được tất", không
     * phải "dạy tất".
     */
    mySkills: (editableByClass.get(c.id) ?? []).length === (skillsByClass.get(c.id) ?? []).length
      ? []
      : editableByClass.get(c.id) ?? [],
    myCoreClass: isCoreTeacherOf(p, c.id),
    ...progressByClass.get(c.id)!,
  }));

  // Tìm theo tên học viên phải trả về đúng LỚP chứa em đó, không phải danh sách rỗng.
  if (f.q?.trim()) {
    const q = f.q.trim();
    const matched = new Set(
      (conn
        .prepare(
          `SELECT DISTINCT e.class_id FROM enrollments e JOIN students s ON s.id = e.student_id
            WHERE e.status = 'active'
              AND (s.full_name LIKE ? OR s.normalized_name LIKE ? OR s.student_code LIKE ?)`,
        )
        .all(`%${q}%`, `%${q.toLowerCase()}%`, `%${q.toUpperCase()}%`) as any[]).map((r) => r.class_id),
    );
    const qMa = chuanHoaMaLop(q);
    rows = rows.filter((r) => (!!qMa && chuanHoaMaLop(r.code).includes(qMa)) || matched.has(r.id));
  }
  return { rows, scopeEmpty: false };
}

/**
 * Danh sách học viên của một lớp — chỉ nạp khi người dùng mở rộng lớp đó.
 * Mỗi em kèm tiến trình MT gọn để không phải mở chi tiết mới biết đang ở đâu.
 */
export function classRoster(p: Principal, classId: number, q?: string) {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const cls = conn.prepare('SELECT status FROM classes WHERE id = ?').get(classId) as any;
  const finished = cls?.status === 'finished';
  const params: unknown[] = [classId];
  /*
   * LỚP ĐÃ KẾT THÚC (Q22): bảng học viên đọc MỌI em từng học (mọi trạng thái enrollment), dòng
   * MỚI NHẤT mỗi em — chứ không chỉ em còn `active` (lớp finished thì không còn ai active).
   */
  let sql = `SELECT s.*, e.status AS enrollment_status, e.end_kind AS enrollment_end_kind,
                    cy.id AS cycle_id, cy.seq AS cycle_seq, cy.route, cy.target_score,
                    cy.baseline_attempt_id, cy.baseline_score,
                    cy.start_period_id, cy.exam_month, cy.exam_period_id, sp.week_start AS start_week,
                    ep.code AS exam_week_code, ep.week_start AS exam_week_start
               FROM enrollments e
               JOIN students s ON s.id = e.student_id
               LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
               LEFT JOIN report_periods sp ON sp.id = cy.start_period_id
               LEFT JOIN report_periods ep ON ep.id = cy.exam_period_id
              WHERE e.class_id = ?`;
  sql += finished
    ? ` AND e.id IN (SELECT MAX(id) FROM enrollments WHERE class_id = ? GROUP BY student_id)`
    : ` AND e.status = 'active'`;
  if (finished) params.push(classId);
  if (q?.trim()) {
    sql += ' AND (s.full_name LIKE ? OR s.normalized_name LIKE ? OR s.student_code LIKE ?)';
    params.push(`%${q.trim()}%`, `%${q.trim().toLowerCase()}%`, `%${q.trim().toUpperCase()}%`);
  }
  sql += ' ORDER BY s.archived_at IS NOT NULL, s.full_name';
  const students = conn.prepare(sql).all(...params) as any[];
  if (!students.length) return [];

  const sids = students.map((s) => s.id);
  const ph = sids.map(() => '?').join(',');
  const attempts = conn
    .prepare(
      `SELECT a.*, cy.seq AS cycle_seq, cy.route, pr.code AS period_code, pr.week_start
         FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id
         LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.student_id IN (${ph})
        ORDER BY cy.seq, a.attempt_no`,
    )
    .all(...sids) as any[];
  const bundle = loadBundle(attempts.map((a) => a.id));
  const today = demoToday();
  const byStudent = new Map<number, any[]>();
  for (const a of attempts) {
    if (!byStudent.has(a.student_id)) byStudent.set(a.student_id, []);
    byStudent.get(a.student_id)!.push(a);
  }

  // Lớp thường chấm khác lớp FT, nên đọc chương trình một lần rồi dùng lại cho mọi dòng.
  const prog = programmeOfClass(classId);
  const isRatio = prog?.scoringMode === 'ratio';
  /* Chỉ lớp FT mới bị nhắc tháng thi và Target — lớp Normal chưa thi IELTS. */
  const isFt = prog?.code === 'FT';
  const myRegularSkills = isRatio ? editableSkills(p, classId, prog!.skills) : [];
  /*
   * R11 (Z2c-c, A3): `myPending` của lớp FT đọc canEdit — đợt đã hoàn tất thì chỉ Quản lý còn sửa được. Một câu hỏi cho cả
   * lớp; lớp thường không dùng (nhánh của nó đọc `editableSkills`, và đợt đủ điểm thì không còn ô trống nào).
   */
  const hoanTatOf = isRatio ? new Map<number, HoanTatInfo>() : dotHoanTatMany(attempts.map((a) => a.id), today);

  /*
   * CASE ĐANG MỞ của cả lớp, lấy MỘT LẦN. Hỏi từng em một thì một lớp ba mươi em sinh ba
   * mươi câu truy vấn — đúng kiểu chậm mà không màn nào báo lỗi.
   */
  const openCaseCount = new Map<number, number>();
  const handoverCount = new Map<number, number>();
  const openRows = conn
    .prepare(
      `SELECT sc.student_id, sc.sos_level, sc.cycle_id, a.attempt_no FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE sc.student_id IN (${ph}) AND sc.status != 'done'`,
    )
    .all(...sids) as any[];
  const activeCycle = new Map<number, number | null>(students.map((s) => [s.id, s.cycle_id ?? null]));
  /*
   * CASE CỦA LỘ TRÌNH TRƯỚC LÀ VIỆC BÀN GIAO, KHÔNG PHẢI MỨC SOS CỦA LỚP NÀY.
   *
   * Một em học xong Foundation rồi lên Beginner mà còn case dở thì case đó vẫn phải nhìn
   * thấy được — bỏ đi là bỏ rơi em. Nhưng gọi em là "SOS 3" ở lớp Beginner vì một bài
   * Foundation chấm trên thang khác thì lại sai: mức SOS là kết luận của MỘT lượt đánh giá
   * trong MỘT chương trình.
   *
   * Nên tách đôi: mức SOS tính theo lộ trình đang chạy; case cũ còn mở đếm riêng thành việc
   * cần bàn giao, có nhãn riêng ở cột Trạng thái.
   */
  for (const r of openRows) {
    const cur = activeCycle.get(r.student_id) ?? null;
    const carried = cur !== null && r.cycle_id !== null && r.cycle_id !== cur;
    openCaseCount.set(r.student_id, (openCaseCount.get(r.student_id) ?? 0) + 1);
    if (carried) handoverCount.set(r.student_id, (handoverCount.get(r.student_id) ?? 0) + 1);
  }
  /*
   * TÌNH TRẠNG HỌC THUẬT lấy từ KẾT QUẢ BÀI GẦN NHẤT, không suy từ case còn mở.
   *
   * Trước đây bảng này đọc mức SOS đã đóng băng trong case: em thi MT3 đạt hết mà case
   * Reading của MT2 chưa đóng thì vẫn bị gọi là SOS 1. Nay một chỗ tính duy nhất —
   * `standingFor` — dùng chung cho bảng lớp, danh sách học viên và bảng tổng hợp.
   */
  const standing = standingFor(sids);

  /* PR-Qa: nhãn cảnh báo Ý thức 5 ngày (YT-8) và Case đang mở cho "Việc tiếp theo" — mỗi thứ MỘT lần cho cả lớp. */
  const canhBao = canhBaoTheoHocVien(p, classId);
  const caseMo = caseMoTheoHocVien(p, classId);
  /* PR-LT: Lộ trình tiếp theo của cả lớp — một câu, cột Khoá dùng ngay, không hỏi lại theo từng em. */
  const tiepTheoLop = tiepTheoTheoHocVien([classId]);
  const maChuongTrinhHienTai = (prog?.code ?? null) as ProgrammeCode | null;

  return students.map((s) => {
    /*
     * CHỈ CÁC BÀI CỦA LỘ TRÌNH ĐANG CHẠY.
     *
     * Bảng lớp trả lời câu "lớp này đang thế nào". Một em chuyển từ lớp Foundation sang lớp
     * Beginner thì bài Giữa khoá và Cuối khoá của Foundation KHÔNG phải bài của lớp này —
     * để nguyên thì lớp Beginner mới học tuần 7/10 đã hiện "Cuối khoá SOS3" của một chương
     * trình khác, chấm trên một thang khác.
     *
     * Lịch sử cũ không mất: hồ sơ học viên có bộ chọn lộ trình, và "Toàn bộ hành trình" vẫn
     * mở ra được mọi lớp em từng học.
     */
    const list = (byStudent.get(s.id) ?? []).filter((a) => !s.cycle_id || a.cycle_id === s.cycle_id);
    const timeline = list.map((a) => {
      const scores = bundle.scores.get(a.id) ?? [];
      const c = bundle.cases.get(a.id);

      if (isRatio) {
        /*
         * Bài kiểm tra lớp thường: không có band, không có Overall, không có kỳ vọng theo
         * target. Chỉ có đạt/trượt theo tỷ lệ điểm đạt/tổng điểm, và số môn trượt ra mức SOS.
         */
        const r = evaluateRegular(prog!.skills, scores);
        /* Lịch và hạn của TỪNG môn — bốn môn của một bài có thể trải hai ba tuần. */
        const regViews = regularSkillViews(a, bundle.skillRows.get(a.id), scores, today);
        return {
          id: a.id, attemptNo: a.attempt_no, cycleSeq: a.cycle_seq, route: null,
          kind: a.kind, kindLabel: ATTEMPT_KIND_SHORT[a.kind as AttemptKind] ?? a.kind,
          periodCode: a.period_code, weekStart: (a.week_start ?? null) as string | null, lichSu: false,
          status: a.status,
          scoredRequired: r.scored, requiredCount: r.required,
          // Lớp thường KHÔNG có Overall IELTS — để trống thay vì dựng một con số giả.
          overall: null,
          expectation: null, writing: null,
          passedCount: r.complete ? r.required - (r.failedCount ?? 0) : null,
          failedCount: r.failedCount,
          sosLevel: r.sosLevel, evaluable: r.complete,
          /*
           * ĐIỂM TỪNG MÔN của lớp Normal, dạng ĐIỂM ĐẠT / TỔNG ĐIỂM (mục 5.1).
           *
           * Không quy về band và không quy về phần trăm: lớp Normal chấm theo điểm đạt trên
           * tổng điểm, và đổi sang một thang khác là đổi luôn ý nghĩa của con số người dạy
           * đã gõ vào.
           */
          ratios: Object.fromEntries(r.skills.map((x: any) => [
            x.skill, { score: x.score, total: x.total, outcome: x.outcome },
          ])),
          bands: null,
          caseStatus: c?.status ?? null,
          myPending: myRegularSkills.filter((k) => {
            const row = scores.find((x) => x.skill === k);
            const scored = row?.raw_score !== null && row?.raw_score !== undefined;
            const v = regViews.get(k);
            return !scored && !!v && awaitingScore(v.progress);
          }),
          overdueSkills: myRegularSkills.filter((k) => {
            const row = scores.find((x) => x.skill === k);
            const scored = row?.raw_score !== null && row?.raw_score !== undefined;
            return !scored && !!regViews.get(k)?.overdue;
          }).length,
          /* PR-N1 A6: hạn nhập điểm SỚM NHẤT của các môn người xem còn nợ — "Nhập điểm R · MT2 ⚠ quá hạn n ngày". */
          hanNhap: myRegularSkills.filter((k) => {
            const row = scores.find((x) => x.skill === k);
            const scored = row?.raw_score !== null && row?.raw_score !== undefined;
            const v = regViews.get(k);
            return !scored && !!v && awaitingScore(v.progress);
          }).map((k) => regViews.get(k)?.deadline ?? null).filter(Boolean).sort()[0] ?? null,
          /* Tuần thi của TỪNG môn (thứ Hai) — ô chưa có điểm ở bảng lớp thường ghi tuần này (đặc tả §3.7, 10b A). */
          tuanMon: Object.fromEntries(prog!.skills.map((k) => [k, regViews.get(k)?.weekStart ?? null])),
        };
      }

      const skips = bundle.skips.get(a.id) ?? [];
      const result = resultOf(a, scores, skips);
      const cells = skillCells(p, a, scores, skips, today, bundle.skillRows.get(a.id),
        hoanTatOf.get(a.id) ?? { hoanTat: false, chuNhatCuoi: null });
      return {
        id: a.id, attemptNo: a.attempt_no, cycleSeq: a.cycle_seq, route: a.route,
        periodCode: a.period_code, weekStart: (a.week_start ?? null) as string | null, lichSu: !!a.lich_su,
        status: a.status,
        kind: a.kind, kindLabel: `MT${a.attempt_no}`,
        scoredRequired: result.scoredRequired, requiredCount: result.required.length,
        overall: result.overall,
        /* PR-N1 K2-10: kỳ vọng của ĐÚNG mốc này (không phải target) + Writing tổng (SOS xét cột này, §5.7). */
        expectation: result.expectation, writing: result.bands?.writing ?? null,
        /*
         * BAND CỦA TỪNG Ô NHẬP, để bảng lớp vẽ được sáu cột điểm.
         *
         * KHÔNG dùng `result.bands`: bộ đó gộp W1 và W2 thành một band "writing" duy nhất
         * (đúng cho việc tính SOS), nên hai cột W1 và W2 của bảng lớp sẽ trống trơn. Ở đây
         * cần đúng con số người dạy đã gõ vào từng ô.
         */
        bands: Object.fromEntries(scores.map((x: any) => [x.skill, x.band ?? null])),
        ratios: null,
        passedCount: null, failedCount: result.failedCount,
        sosLevel: result.sosLevel, evaluable: result.evaluable,
        caseStatus: c?.status ?? null,
        myPending: cells.filter((x) => x.canEdit && x.band === null && x.progress === 'due')
          .map((x) => x.skill),
        overdueSkills: cells.filter((x) => x.overdue).length,
        /* PR-N1 A6: hạn nhập điểm SỚM NHẤT của các ô người xem còn nợ (đến lịch hoặc đã trễ). */
        hanNhap: cells.filter((x) => x.canEdit && x.band === null && (x.progress === 'due' || x.overdue))
          .map((x) => x.deadline).filter(Boolean).sort()[0] ?? null,
      };
    });
    const done = timeline.filter((t) => t.evaluable);
    const mocFt = isRatio ? null : (() => {
      const m = mocKeTiep(timeline.map((t) => ({ id: t.id, status: t.status, lich_su: t.lichSu ? 1 : 0, weekStart: t.weekStart, attempt_no: t.attemptNo })), today);
      return m ? timeline.find((t) => t.id === m.id) ?? null : null;
    })();
    /*
     * SÁU CỘT ĐIỂM của bảng lớp (mục 8.4): OVR · L · R · S · W1 · W2.
     *
     * Mỗi ô mang ĐIỂM LƯỢT GẦN NHẤT và điểm của lượt TRƯỚC ĐÓ, để vẽ mũi tên lên/xuống.
     * Tính ở máy chủ chứ không ở trình duyệt: cùng một phép so sánh mà mỗi màn tự làm lấy
     * thì sớm muộn cũng có hai màn cho ra hai kết quả khác nhau.
     *
     * Lớp Normal không có band nên sáu ô này để trống — không dựng một con số giả.
     */
    const lastTwo = done.slice(-2);
    const cell = (now: number | null, prev: number | null) => ({
      now, prev,
      dir: now === null || prev === null ? 0 : now > prev ? 1 : now < prev ? -1 : 0,
    });
    const bandAt = (t: any, skill: string) => (t ? (t.bands?.[skill] ?? null) : null);
    const cur = lastTwo.length ? lastTwo[lastTwo.length - 1] : null;
    const before = lastTwo.length > 1 ? lastTwo[0] : null;
    const scores = isRatio ? null : {
      overall: cell(cur?.overall ?? null, before?.overall ?? null),
      listening: cell(bandAt(cur, 'listening'), bandAt(before, 'listening')),
      reading: cell(bandAt(cur, 'reading'), bandAt(before, 'reading')),
      speaking: cell(bandAt(cur, 'speaking'), bandAt(before, 'speaking')),
      writing1: cell(bandAt(cur, 'writing1'), bandAt(before, 'writing1')),
      writing2: cell(bandAt(cur, 'writing2'), bandAt(before, 'writing2')),
    };

    /*
     * LỊCH SỬ ĐIỂM 2–3 MỐC (mục 5.4) — MỚI NHẤT LÊN ĐẦU.
     *
     * Lấy những mốc ĐÃ CÓ ÍT NHẤT MỘT Ô ĐIỂM, không chỉ mốc đã chấm xong: một MT mới nhập
     * hai kỹ năng vẫn là thông tin thật, và giấu nó đi thì bảng nói em chưa có gì trong khi
     * giáo viên vừa gõ điểm hôm qua.
     *
     * KHÔNG lấy điểm mốc cũ lấp vào ô trống của mốc mới. Ô trống ở đây nghĩa là CHƯA NHẬP,
     * và đó chính là thông tin cần thấy.
     */
    const history = timeline
      .filter((t) => t.scoredRequired > 0)
      .slice(-3)
      .reverse()
      .map((t) => ({
        id: t.id, label: t.kindLabel, kind: t.kind, periodCode: t.periodCode,
        sosLevel: t.sosLevel, evaluable: t.evaluable,
        scoredRequired: t.scoredRequired, requiredCount: t.requiredCount,
        overall: t.overall,
        expectation: t.expectation, writing: t.writing,
        bands: (t as any).bands ?? null,
        ratios: (t as any).ratios ?? null,
      }));

    return {
      id: s.id, studentCode: s.student_code, fullName: s.full_name, status: s.status,
      /*
       * CÁCH CHẤM CỦA LỚP đi kèm từng dòng, để bảng biết bày bộ cột nào (mục 5.1 · 5.2).
       * Lặp lại ở mỗi dòng là thừa một chút, nhưng nó giữ cho mọi màn đang đọc danh sách
       * này chạy y như cũ — đổi hình dạng trả về thì phải sửa cả những chỗ không liên quan.
       */
      scoring: isRatio ? 'ratio' : 'band',
      skills: prog?.skills ?? null,
      scores,
      history,
      /*
       * BA THÔNG TIN TÁCH RỜI, KHÔNG CÁI NÀO SUY RA TỪ CÁI KIA (mục 2.1):
       *   · `standing` — kết quả bài gần nhất, nói mức SOS của CHÍNH bài đó
       *   · `openCases` — số case đang theo dõi, chỉ là một con số đếm
       *   · `handoverCases` — trong đó bao nhiêu cái mang từ lộ trình trước sang
       */
      standing: standing.get(s.id) ?? null,
      standingLine: standing.has(s.id) ? standingLine(standing.get(s.id)!) : null,
      /** Giữ tên cũ cho các màn đang đọc, nhưng nay lấy từ KẾT QUẢ BÀI chứ không từ case. */
      sosLevel: standing.get(s.id)?.sosLevel ?? null,
      provisional: !!standing.get(s.id)?.provisional,
      openCases: openCaseCount.get(s.id) ?? 0,
      /** Case còn mở từ lớp/chương trình TRƯỚC — việc phải bàn giao, không phải mức SOS ở đây. */
      handoverCases: handoverCount.get(s.id) ?? 0,
      /** DỰ KIẾN THI ở đúng mức chắc chắn đang có: tuần, hoặc tháng, hoặc chưa biết. */
      examPlan: examPlanOf(s),
      archived: !!s.archived_at,
      /** "Kết thúc vì" (Q18/Q22) — chỉ có nghĩa ở bảng lớp ĐÃ KẾT THÚC, nơi dòng không còn `active`. */
      ketThucVi: finished ? nhanKetThucVi(s.enrollment_end_kind ?? null, s.enrollment_status) : null,
      cycle: s.cycle_id
        ? {
          id: s.cycle_id, seq: s.cycle_seq, route: s.route,
          target: s.target_score,
          examMonth: s.exam_month ?? null, examPeriodId: s.exam_period_id ?? null,
          startPeriodId: s.start_period_id ?? null, startWeek: s.start_week ?? null,
        }
        : null,
      /*
       * BADGE "THIẾU THÔNG TIN" — gom mọi thứ còn thiếu vào MỘT nhãn (mục 7.5).
       *
       * Bốn nhãn nhỏ trên một dòng học viên thì dòng nào cũng đầy nhãn và người đọc thôi
       * nhìn chúng. Một nhãn, bấm vào thấy danh sách, là đủ.
       */
      missing: missingForStudent({
        cycle: s.cycle_id
          ? {
            start_period_id: s.start_period_id, exam_month: s.exam_month, target_score: s.target_score,
            baseline: s.baseline_attempt_id !== null || s.baseline_score !== null,
          }
          : null,
        student: { dob: s.dob },
        isFastTrack: !!isFt,
        /*
         * THIẾU MỐC ĐÁNH GIÁ TIẾP THEO cản trở việc lên kế hoạch, nên nó thuộc badge này —
         * nhưng chỉ khi em CÒN ĐANG HỌC. Em đã kết thúc thì không cần mốc tiếp nào nữa.
         */
        hasNextMilestone: s.status === 'active'
          ? (isRatio ? timeline.some((t) => t.status === 'planned') : coMocTiepTheo({
            coMoc: !!mocFt, route: s.route ?? null, coNgayThi: !!(s.exam_month || s.exam_period_id),
            mtCuoi: Math.max(0, ...timeline.filter((t) => t.status !== 'cancelled').map((t) => t.attemptNo)),
          }))
          : undefined,
      }),
      latest: done.length ? done[done.length - 1] : null,
      /* FT: mốc kế tiếp = lượt planned, không lịch sử, từ tuần này — sớm nhất (K2-05), không phải lượt planned đầu danh sách. */
      next: isRatio ? timeline.find((t) => t.status === 'planned') ?? null : mocFt,
      timeline,
      myPending: [...new Set(timeline.flatMap((t) => t.myPending))],
      canhBaoYThuc: canhBao.get(s.id) ?? null,
      /* Cột "Việc tiếp theo" (Q13): nhập điểm của CHÍNH người xem ở đợt đang chờ + việc của từng Case chưa xong. */
      viecTiepTheo: viecTiepTheoCua({
        nhapDiem: (() => {
          const cho = [...new Set(timeline.flatMap((t) => t.myPending))];
          if (!cho.length) return null;
          const dot = timeline.find((t) => t.myPending.length > 0) ?? null;
          return {
            kyNang: cho, dot: dot?.kindLabel ?? null, quaHan: timeline.some((t) => t.overdueSkills > 0),
            han: timeline.map((t) => t.hanNhap).filter(Boolean).sort()[0] ?? null,
          };
        })(),
        cases: caseMo.get(s.id) ?? [],
        homNay: today,
      }),
      /* Cột Khoá "tiếp theo: …" (PR-LT, Q1/Q4) — chỉ có nghĩa cho lớp thường còn đang học. */
      tiepTheo: isRatio ? nhanTiepTheo(tiepTheoLop.get(s.id) ?? null, maChuongTrinhHienTai) : null,
      chuaLoTrinh: isRatio && (!tiepTheoLop.has(s.id) || tiepTheoLop.get(s.id)!.huong === 'chua_ro'),
    };
  });
}

/** Trang tổng quan một lớp: thông tin lớp, phân công, và những việc cần chú ý. */
export function classOverview(p: Principal, classId: number) {
  const conn = db();
  const cls = conn
    .prepare(
      `SELECT c.*, b.code AS branch_code, b.name AS branch_name FROM classes c
         JOIN branches b ON b.id = c.branch_id WHERE c.id = ?`,
    )
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const finished = cls.status === 'finished';

  /*
   * LỚP ĐÃ KẾT THÚC (Q22, chủ sản phẩm 23/09) — `listClassSummaries` chỉ lọc `status='active'`
   * nên trả rỗng cho lớp này; dựng tóm tắt tối thiểu từ `classProgressMany` (tiến độ thô,
   * không việc cần làm — lớp đã đóng thì không còn gì cần xếp/nhập nữa).
   */
  const summary = finished
    ? (() => {
      const pr = classProgressMany([classId]).get(classId) ?? null;
      const studentCount = (conn.prepare('SELECT COUNT(DISTINCT student_id) n FROM enrollments WHERE class_id = ?').get(classId) as any).n as number;
      return {
        studentCount, needScores: 0, workScope: defaultWorkScope(p) as WorkScope,
        phase: pr?.phase ?? 'finished', currentWeek: pr?.currentWeek ?? null, totalWeeks: pr?.totalWeeks ?? null,
        needsPlacement: false, missing: [] as { key: string; label: string; who: string }[], missingSkills: [] as string[],
        canXepLop: 0, soChuaLoTrinhTiep: 0,
      };
    })()
    : listClassSummaries(p, {}).rows.find((r) => r.id === classId) ?? null;
  const assignments = conn
    .prepare(
      `SELECT ta.skill, ta.is_core, u.id AS user_id, u.full_name FROM teacher_assignments ta
         JOIN users u ON u.id = ta.user_id WHERE ta.class_id = ? AND ta.status = 'active' ORDER BY ta.is_core DESC, ta.id`,
    )
    .all(classId) as any[];
  const skills = (conn.prepare('SELECT skill, sessions_per_week FROM class_skills WHERE class_id = ?').all(classId) as any[]);

  // Bộ kỹ năng của lớp lấy theo CHƯƠNG TRÌNH của lớp đó, không mặc định là bộ IELTS.
  const prog = programmeOfClass(classId);
  const classSkills = prog?.skills ?? [...ENTRY_SKILLS];

  return {
    id: cls.id, code: cls.code, kind: cls.kind, route: cls.route,
    isFastTrack: cls.is_fast_track === 1, startDate: cls.start_date, note: cls.note,
    branchId: cls.branch_id, branchCode: cls.branch_code, branchName: cls.branch_name,
    programme: prog ? { code: prog.code, name: prog.name, weeks: prog.weeks, scoringMode: prog.scoringMode } : null,
    status: cls.status as string, finishedAt: cls.finished_at ?? null,
    summary,
    skills: skills.map((s) => ({ skill: s.skill, sessionsPerWeek: s.sessions_per_week })),
    coreTeachers: assignments.filter((a) => a.is_core === 1).map((a) => ({ id: a.user_id, name: a.full_name })),
    skillTeachers: assignments.filter((a) => a.skill).map((a) => ({ skill: a.skill, id: a.user_id, name: a.full_name })),
    /**
     * "n Case đang mở" ở đầu hồ sơ lớp — cùng tập với cột Case của tab Học viên (Q5).
     *
     * PR-Qa (17, sửa theo rà soát planning): gọi thẳng `listCases(p, { classId })` — ĐÚNG tập mà
     * `BangCanHoTro.tsx` (chế độ "Cần hỗ trợ") gọi qua `GET /cases?classId=`, nên số này TỰ ĐỘNG khớp,
     * không cần một hàm quét toàn hệ thống rồi lọc lại (hàm dựng riêng cũ đã bỏ — chậm trên Turso vì
     * `listCases(p, {})` không lọc phạm vi gì, quét MỌI Case rồi gọi `can()` từng dòng).
     *
     * PR-Qa (17, fix round 2 — review Opus): `listCases(p, { classId })` lọc theo
     * `COALESCE(cur.class_id, a.class_id)`, và `cur` chỉ join enrollment `status = 'active'` — với một em đã
     * TẠM DỪNG (`paused`) mà vẫn còn Case, `cur.class_id` là NULL nên bộ lọc rơi về LỚP LÚC ĐÁNH GIÁ
     * (`a.class_id`), Case đó vẫn có thể khớp `classId` đang xem. Nhưng "Cần hỗ trợ" (`BangCanHoTro.tsx`) chỉ
     * hiện học viên có trong ROSTER (đang active, không lưu trữ) nên KHÔNG hiện em đã tạm dừng — lọc thêm
     * theo đúng tập học viên ĐANG HỌC của `classId` để badge khớp lại với danh sách mở ra.
     */
    soCaseMo: (() => {
      const activeIds = new Set(
        conn.prepare(
          `SELECT e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
            WHERE e.class_id = ? AND e.status = 'active' AND s.archived_at IS NULL`,
        ).all(classId).map((r: any) => r.student_id as number),
      );
      return listCases(p, { classId }).rows
        .filter((c) => c.status !== 'done' && c.studentId !== null && activeIds.has(c.studentId)).length;
    })(),
    /** Số học viên có vi phạm chưa xử lý quá 5 ngày — dấu ⚠ trên tab Ý thức & Phối hợp (Q15). */
    canhBaoYThuc: can(p, PERMISSIONS.STUDENT_VIEW, { classId }) ? classWarning(p, classId).activeCount : 0,
    /*
     * LỚP ĐÃ KẾT THÚC → CHẾ ĐỘ CHỈ XEM (Q22): mọi cờ thao tác `false`, không nút nào hiện,
     * không nhánh nào ở web đoán riêng — kể cả với Quản trị hệ thống (QT). Lớp đã đóng thì
     * không còn gì để sửa/nhập/gán nữa.
     */
    viewer: { ...(finished ? {
      canPlanWeek: false, canAddStudents: false, canAssign: false, canEditProgress: false,
      editableSkills: [] as string[], isCoreTeacher: false,
      canReportCase: false, canRecordViolation: false, canEnterScores: false, coTheChuyenTiep: false,
    } : {
      canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId }),
      canAddStudents: can(p, PERMISSIONS.STUDENT_EDIT, { classId }),
      canAssign: can(p, PERMISSIONS.CLASS_ASSIGN, { classId }),
      /** Sửa tuần khai giảng và hai mốc kiểm tra — Admin CN và Quản lý CN (mục 7.6). */
      canEditProgress: can(p, PERMISSIONS.CLASS_EDIT, { classId }),
      editableSkills: editableSkills(p, classId, classSkills),
      isCoreTeacher: isCoreTeacherOf(p, classId),
      /** Nút đầu trang và menu ⋯ dòng học viên chỉ hiện khi làm được (Q9) — máy chủ vẫn chặn lại. */
      canReportCase: can(p, PERMISSIONS.SOS_REPORT, { classId }),
      canRecordViolation: can(p, PERMISSIONS.VIOLATION_RECORD, { classId }),
      canEnterScores: editableSkills(p, classId, classSkills).length > 0,
      /** Cùng luật với `canEditProgress` (Q2) — tên riêng để nút Chuyển tiếp lớp/badge/việc đỏ dùng chung một cờ. */
      coTheChuyenTiep: can(p, PERMISSIONS.CLASS_EDIT, { classId }),
    }),
      /** ⋮ Xoá lớp / Kết thúc lớp — CHỈ Quản trị hệ thống (PR-UX3); máy chủ kiểm lại ở từng đường. */
      coTheXoaKetThuc: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
    },
  };
}

export type { AssessedSkill };

// ==================================================================== phân công giáo viên

/**
 * PHÂN CÔNG GIÁO VIÊN VÀO LỚP.
 *
 * Ai đổi được: Quản lý và Admin chi nhánh (owner chốt — Admin chi nhánh tạo được lớp nên
 * cũng phải xếp được người dạy), trong đúng chi nhánh của lớp. Giáo viên thì không.
 *
 * BỎ PHÂN CÔNG KHÔNG PHẢI LÀ XOÁ. Điểm đã nhập ghi tên người nhập, và báo cáo cũ đọc lại
 * phải thấy đúng ai dạy lúc đó. Nên bỏ phân công chỉ đóng dòng lại bằng `effective_to` và
 * `status`, dòng cũ ở nguyên chỗ.
 *
 * Hai loại phân công tách hẳn nhau:
 *   - GVCN   (`is_core = 1`, `skill` để trống): chăm cả lớp, đóng được case của lớp.
 *   - GVBM   (`skill` có giá trị): CHỈ nhập được điểm đúng kỹ năng đó.
 * Một người có thể có cả hai dòng ở cùng một lớp — chủ nhiệm và dạy Listening chẳng hạn.
 */
export type TeacherSlot = { userId: number; skill: string | null; isCore: boolean };

/** Người xếp được vào lớp ở chi nhánh này: grant `teacher|manager` phủ chi nhánh (khớp `/ref/teachers`, Q9). `classId` (tuỳ chọn)
 *  chỉ để đếm `here` — lớp chưa tạo thì null. */
export function teacherCandidatesBranch(branchId: number, classId: number | null = null) {
  return db()
    .prepare(
      `SELECT DISTINCT u.id, u.full_name, u.code, u.title,
              (SELECT COUNT(DISTINCT ta.class_id) FROM teacher_assignments ta
                WHERE ta.user_id = u.id AND ta.status = 'active') AS load_classes,
              (SELECT COUNT(*) FROM teacher_assignments ta
                WHERE ta.user_id = u.id AND ta.class_id = ? AND ta.status = 'active') AS here
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id AND ur.status = 'active'
         JOIN roles r ON r.id = ur.role_id
        WHERE u.status = 'active'
          AND r.key IN ('teacher', 'manager')
          AND (ur.branch_id IS NULL OR ur.branch_id = ?)
        ORDER BY u.full_name`,
    )
    .all(classId, branchId) as any[];
}

export function classTeachers(p: Principal, classId: number) {
  const conn = db();
  const cls = conn
    .prepare(`SELECT c.*, b.code AS branch_code FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?`)
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');

  const prog = programmeOfClass(classId);
  const canAssign = can(p, PERMISSIONS.CLASS_ASSIGN, { classId });

  const active = conn
    .prepare(
      `SELECT ta.id, ta.user_id, ta.skill, ta.is_core, ta.effective_from, u.full_name
         FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id = ? AND ta.status = 'active'
        ORDER BY ta.is_core DESC, ta.skill, u.full_name`,
    )
    .all(classId) as any[];

  /* Lịch sử: ai đã từng dạy lớp này và trong khoảng nào. Đọc báo cáo cũ phải tra được. */
  const past = conn
    .prepare(
      `SELECT ta.skill, ta.is_core, ta.effective_from, ta.effective_to, u.full_name
         FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id = ? AND ta.status != 'active'
        ORDER BY COALESCE(ta.effective_to, ta.effective_from) DESC, ta.id DESC LIMIT 20`,
    )
    .all(classId) as any[];

  return {
    classId, classCode: cls.code, branchCode: cls.branch_code,
    /** Web dựng ô phân công bằng `oPhanCong(programmeCode, skills)` — cùng hàm máy chủ kiểm (Pre FOU: một ô GVCN). */
    programmeCode: prog?.code ?? null,
    /** Kỹ năng của lớp lấy theo CHƯƠNG TRÌNH, không mặc định là bộ IELTS. */
    skills: prog?.skills ?? [...ENTRY_SKILLS],
    core: active.filter((a) => a.is_core === 1)
      .map((a) => ({ userId: a.user_id, name: a.full_name, from: a.effective_from })),
    bySkill: active.filter((a) => a.skill)
      .map((a) => ({ skill: a.skill, userId: a.user_id, name: a.full_name, from: a.effective_from })),
    candidates: teacherCandidatesBranch(cls.branch_id, classId)
      .map((u) => ({ id: u.id, name: u.full_name, code: u.code, title: u.title,
                     classCount: u.load_classes, inThisClass: u.here > 0 })),
    past: past.map((a) => ({
      name: a.full_name, skill: a.skill, isCore: a.is_core === 1,
      from: a.effective_from, to: a.effective_to,
    })),
    viewer: { canAssign },
  };
}

/**
 * Đọc danh sách ô phân công gửi lên (dữ liệu từ ngoài) thành `SlotPhanCong` sạch. GVCN không mang kỹ năng; GV bộ môn phải có kỹ năng.
 */
export function docSlots(raw: unknown): SlotPhanCong[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw badRequest('Danh sách phân công không hợp lệ.');
  return raw.map((s: any) => {
    const userId = Number(s?.userId);
    if (!Number.isInteger(userId) || userId <= 0) throw badRequest('Thiếu người được phân công.');
    const isCore = !!s.isCore;
    const skill = isCore ? null : (s.skill ? String(s.skill) : null);
    if (!isCore && !skill) throw badRequest('Phân công giáo viên bộ môn phải chọn kỹ năng.');
    return { userId, skill, isCore };
  });
}

/**
 * BA LUẬT PHÂN CÔNG (L3, mục 7.7) kiểm TRƯỚC khi ghi — cùng hàm `kiemPhanCong` web dùng để vẽ lỗi tại ô:
 *   1. Mỗi môn một người — hai người cùng Listening thì cả hai tưởng người kia nhập điểm, và không ai nhập.
 *   2. Một người dạy nhiều môn trong lớp thì được.
 *   3. Đúng một GVCN, và GVCN phải dạy ít nhất một môn (owner 13/09/2026); Pre FOU: GVCN dạy luôn.
 * Rồi: mỗi người phải có vai trò giảng dạy ở chi nhánh của lớp — không mượn người chi nhánh khác.
 * `classId` null = lớp chưa tạo (Tạo lớp). Lỗi nói bằng nhãn ô (GVCN, L, W1…), không lộ mã kỹ năng.
 */
export function kiemTruocPhanCong(
  classId: number | null, branchId: number, chuongTrinh: string | null, kyNang: string[], slots: SlotPhanCong[],
): void {
  const loi = kiemPhanCong(chuongTrinh, kyNang, slots)[0];
  if (loi) {
    const nhanO = oPhanCong(chuongTrinh, kyNang).find((o) => o.khoa === loi.khoa)?.nhan ?? skillShort(loi.khoa);
    throw badRequest(`${nhanO}: ${loi.lyDo}`);
  }
  const duocXep = new Set(teacherCandidatesBranch(branchId, classId).map((u) => u.id as number));
  if (slots.some((s) => !duocXep.has(s.userId))) throw badRequest('Người này không có vai trò giảng dạy ở chi nhánh của lớp.');
}

/**
 * GHI phân công của lớp — gọi TRONG `tx` (Tạo lớp và Phân công GV dùng chung). Nhận nguyên bức tranh đang hiển thị, không từng
 * thao tác thêm/bớt. Dòng không đổi GIỮ NGUYÊN `effective_from` (đóng rồi mở lại là bịa ra một lần đổi người); dòng bỏ thì kết
 * thúc (`ended` + `effective_to`), không xoá — báo cáo cũ phải tra được ai dạy lúc đó.
 */
export function ghiPhanCong(p: Principal, classId: number, slots: SlotPhanCong[], ngay: string): { added: number; ended: number } {
  const conn = db();
  const keyOf = (userId: number, skill: string | null, isCore: boolean | number) => `${userId}|${skill ?? ''}|${isCore ? 1 : 0}`;
  const wanted = new Map(slots.map((s) => [keyOf(s.userId, s.skill, s.isCore), s] as const));
  const active = conn
    .prepare(`SELECT * FROM teacher_assignments WHERE class_id = ? AND status = 'active'`)
    .all(classId) as any[];

  let added = 0; let ended = 0;
  for (const a of active) {
    const k = keyOf(a.user_id, a.skill, a.is_core);
    if (wanted.has(k)) { wanted.delete(k); continue; }
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ? WHERE id = ?`).run(ngay, a.id);
    ended += 1;
  }
  for (const s of wanted.values()) {
    conn
      .prepare(
        `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
         VALUES (?,?,?,?,?, 'active', ?)`,
      )
      .run(s.userId, classId, s.skill, s.isCore ? 1 : 0, ngay, nowIso());
    added += 1;
  }

  if (added || ended) {
    const code = (conn.prepare('SELECT code FROM classes WHERE id = ?').get(classId) as any)?.code ?? null;
    writeAudit({
      actorUserId: p.userId, action: 'class.assign', entityType: 'class', entityId: classId,
      entityLabel: code, after: { added, ended },
    });
  }
  return { added, ended };
}

/** Phân công GV của lớp đã có: kiểm ba luật TRƯỚC (`kiemTruocPhanCong`), rồi ghi trong một giao dịch. */
export function setClassTeachers(p: Principal, classId: number, input: { slots?: TeacherSlot[] }) {
  const conn = db();
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.CLASS_ASSIGN, { classId },
    'Chỉ Quản lý và Admin chi nhánh mới đổi được phân công giáo viên.');

  const prog = programmeOfClass(classId);
  const ct = prog?.code ?? null;
  const classSkills: string[] = prog?.skills ?? [...ENTRY_SKILLS];
  /* Pre FOU: GVCN tự nhận ô môn duy nhất — đổi GVCN thì ô đó đổi theo, dòng cũ kết thúc như mọi ô (T56). */
  const slots = moRongPhanCong(ct, classSkills, docSlots(input.slots));
  kiemTruocPhanCong(classId, cls.branch_id, ct, classSkills, slots);

  return tx(() => {
    ghiPhanCong(p, classId, slots, demoToday());
    return classTeachers(p, classId);
  });
}
