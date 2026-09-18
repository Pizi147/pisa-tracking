import { db, tx } from '../db.ts';
import {
  ATTEMPT_KIND_SHORT, BEHAVIOUR_TOPICS, ENTRY_SKILLS, PERMISSIONS, awaitingScore, pendingSkillsOf,
  type AssessedSkill, type AttemptKind, type PendingCell, type WorkScope,
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
import { standingFor, standingLine } from '../students/standing.ts';
import { allProgrammes, evaluateRegular, programmeOfClass } from '../normal/regular.ts';
import { classProgressMany, missingForClasses, missingForStudent } from './schedule.ts';
import { SKILL_SHORT } from '../../../shared/domain/index.ts';

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
function progressMapOf(classIds: number[]) {
  const prs = classProgressMany(classIds);
  const ms = missingForClasses(classIds);
  const out = new Map<number, {
    progressLabel: string | null; phase: string; phaseLabel: string;
    currentWeek: number | null; totalWeeks: number | null;
    needsPlacement: boolean; placementOptions: { code: string; name: string }[];
    missing: { key: string; label: string; who: string }[]; missingSkills: string[];
  }>();
  for (const id of classIds) {
    const pr = prs.get(id);
    const m = ms.get(id);
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

  const ids = classes.map((c) => c.id);
  const ph = ids.map(() => '?').join(',');
  const attempts = conn
    .prepare(
      `SELECT a.id, a.class_id, a.status, a.planned_period_id,
              a.deadline_override, a.target_at_attempt, a.attempt_no,
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

    const cells = skillCells(p, a, bundle.scores.get(a.id) ?? [], bundle.skips.get(a.id) ?? [], today, bundle.skillRows.get(a.id));
    const pending = pendingSkillsOf(pendingInputOf(cells), workScope);
    if (pending.length) bump(needScores, a.class_id, pending.length);
  }

  const progressByClass = progressMapOf(classes.map((c) => c.id));

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
    const lower = q.toLowerCase();
    rows = rows.filter((r) => r.code.toLowerCase().includes(lower) || matched.has(r.id));
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
  const params: unknown[] = [classId];
  let sql = `SELECT s.*, e.status AS enrollment_status,
                    cy.id AS cycle_id, cy.seq AS cycle_seq, cy.route, cy.target_score,
                    cy.baseline_attempt_id, cy.baseline_score,
                    cy.start_period_id, cy.exam_month, cy.exam_period_id, sp.week_start AS start_week,
                    ep.code AS exam_week_code, ep.week_start AS exam_week_start
               FROM enrollments e
               JOIN students s ON s.id = e.student_id
               LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
               LEFT JOIN report_periods sp ON sp.id = cy.start_period_id
               LEFT JOIN report_periods ep ON ep.id = cy.exam_period_id
              WHERE e.class_id = ? AND e.status = 'active'`;
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
          periodCode: a.period_code,
          status: a.status,
          scoredRequired: r.scored, requiredCount: r.required,
          // Lớp thường KHÔNG có Overall IELTS — để trống thay vì dựng một con số giả.
          overall: null,
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
        };
      }

      const skips = bundle.skips.get(a.id) ?? [];
      const result = resultOf(a, scores, skips);
      const cells = skillCells(p, a, scores, skips, today, bundle.skillRows.get(a.id));
      return {
        id: a.id, attemptNo: a.attempt_no, cycleSeq: a.cycle_seq, route: a.route,
        periodCode: a.period_code,
        status: a.status,
        kind: a.kind, kindLabel: `MT${a.attempt_no}`,
        scoredRequired: result.scoredRequired, requiredCount: result.required.length,
        overall: result.overall,
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
      };
    });
    const done = timeline.filter((t) => t.evaluable);
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
          ? timeline.some((t) => t.status === 'planned')
          : undefined,
      }),
      latest: done.length ? done[done.length - 1] : null,
      next: timeline.find((t) => t.status === 'planned') ?? null,
      timeline,
      myPending: [...new Set(timeline.flatMap((t) => t.myPending))],
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

  const summary = listClassSummaries(p, {}).rows.find((r) => r.id === classId) ?? null;
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
    summary,
    skills: skills.map((s) => ({ skill: s.skill, sessionsPerWeek: s.sessions_per_week })),
    coreTeachers: assignments.filter((a) => a.is_core === 1).map((a) => ({ id: a.user_id, name: a.full_name })),
    skillTeachers: assignments.filter((a) => a.skill).map((a) => ({ skill: a.skill, id: a.user_id, name: a.full_name })),
    viewer: {
      canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId }),
      canAddStudents: can(p, PERMISSIONS.STUDENT_EDIT, { classId }),
      canAssign: can(p, PERMISSIONS.CLASS_ASSIGN, { classId }),
      /** Sửa tuần khai giảng và hai mốc kiểm tra — Admin CN và Quản lý CN (mục 7.6). */
      canEditProgress: can(p, PERMISSIONS.CLASS_EDIT, { classId }),
      editableSkills: editableSkills(p, classId, classSkills),
      isCoreTeacher: isCoreTeacherOf(p, classId),
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

/** Giáo viên có thể xếp vào lớp này: có grant vai trò giáo viên phủ chi nhánh của lớp. */
function teacherCandidates(classId: number, branchId: number) {
  return db()
    .prepare(
      `SELECT DISTINCT u.id, u.full_name, u.code, u.title,
              (SELECT COUNT(*) FROM teacher_assignments ta
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
    /** Kỹ năng của lớp lấy theo CHƯƠNG TRÌNH, không mặc định là bộ IELTS. */
    skills: prog?.skills ?? [...ENTRY_SKILLS],
    core: active.filter((a) => a.is_core === 1)
      .map((a) => ({ userId: a.user_id, name: a.full_name, from: a.effective_from })),
    bySkill: active.filter((a) => a.skill)
      .map((a) => ({ skill: a.skill, userId: a.user_id, name: a.full_name, from: a.effective_from })),
    candidates: teacherCandidates(classId, cls.branch_id)
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
 * Ghi lại TOÀN BỘ phân công đang có hiệu lực của lớp.
 *
 * Nhận cả danh sách chứ không nhận từng thao tác thêm/bớt: màn hình đang hiển thị đúng một
 * bức tranh, gửi nguyên bức tranh đó lên thì không có chuyện hai người sửa hai nửa rồi ra
 * một trạng thái không ai định. Dòng nào không đổi thì GIỮ NGUYÊN `effective_from`, không
 * đóng rồi mở lại — làm vậy là bịa ra một lần đổi người không có thật.
 */
export function setClassTeachers(p: Principal, classId: number, input: { slots?: TeacherSlot[] }) {
  const conn = db();
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.CLASS_ASSIGN, { classId },
    'Chỉ Quản lý và Admin chi nhánh mới đổi được phân công giáo viên.');

  const prog = programmeOfClass(classId);
  const classSkills: string[] = prog?.skills ?? [...ENTRY_SKILLS];
  const today = demoToday();

  const wanted = new Map<string, TeacherSlot>();
  for (const s of input.slots ?? []) {
    const userId = Number(s.userId);
    if (!Number.isInteger(userId) || userId <= 0) throw badRequest('Thiếu người được phân công.');
    const isCore = !!s.isCore;
    const skill = isCore ? null : (s.skill ?? null);
    if (!isCore && !skill) throw badRequest('Phân công giáo viên bộ môn phải chọn kỹ năng.');
    if (skill && !classSkills.includes(skill)) {
      throw badRequest(`Lớp này không dạy kỹ năng "${skill}", không phân công vào đó được.`);
    }
    wanted.set(`${userId}|${skill ?? ''}|${isCore ? 1 : 0}`, { userId, skill, isCore });
  }

  // Người được xếp phải thực sự thuộc chi nhánh của lớp — không mượn người chi nhánh khác.
  const eligible = new Set(teacherCandidates(classId, cls.branch_id).map((u) => u.id as number));
  for (const s of wanted.values()) {
    if (!eligible.has(s.userId)) {
      throw badRequest('Người này không có vai trò giảng dạy ở chi nhánh của lớp.');
    }
  }

  /*
   * BA QUY TẮC PHÂN CÔNG — mục 7.7, kiểm ở MÁY CHỦ chứ không chỉ ở giao diện.
   *
   *   1. Mỗi kỹ năng chỉ MỘT giáo viên.
   *   2. Một giáo viên dạy NHIỀU kỹ năng trong cùng lớp thì được.
   *   3. Đúng MỘT giáo viên chủ nhiệm, và người đó phải nằm trong danh sách phân công.
   *
   * Quy tắc 1 là quy tắc dễ vi phạm nhất và hậu quả im lặng nhất: hai người cùng phụ trách
   * Listening thì cả hai đều tưởng người kia nhập điểm, và không ai nhập.
   */
  const perSkill = new Map<string, number[]>();
  for (const s of wanted.values()) {
    if (!s.skill) continue;
    const list = perSkill.get(s.skill) ?? [];
    list.push(s.userId);
    perSkill.set(s.skill, list);
  }
  for (const [skill, users] of perSkill) {
    if (users.length > 1) {
      throw badRequest(
        `Kỹ năng ${SKILL_SHORT[skill] ?? skill} đang được xếp cho ${users.length} giáo viên. `
        + 'Mỗi kỹ năng chỉ một người — nếu hai người cùng phụ trách thì cả hai đều tưởng người kia nhập điểm.',
      );
    }
  }

  /*
   * ĐÚNG MỘT GVCN, VÀ GVCN PHẢI DẠY ÍT NHẤT MỘT KỸ NĂNG Ở LỚP ĐÓ.
   *
   * Owner khẳng định lại 13/09/2026. Đây chính là chữ "trong danh sách được phân công" ở mục
   * 7.7: chủ nhiệm một lớp mà không dạy em nào buổi nào thì không có căn cứ nào để nhận xét
   * và theo dõi các em — vai đó thành một cái tên trên giấy.
   */
  const cores = [...wanted.values()].filter((s) => s.isCore);
  if (cores.length > 1) {
    throw badRequest('Một lớp chỉ có đúng một giáo viên chủ nhiệm.');
  }
  if (cores.length === 1) {
    const teaches = [...wanted.values()].some((s) => s.skill && s.userId === cores[0].userId);
    if (!teaches) {
      throw badRequest(
        'Giáo viên chủ nhiệm phải dạy ít nhất một kỹ năng ở lớp này. '
        + 'Hãy xếp cho người đó một kỹ năng, hoặc chọn người khác làm chủ nhiệm.',
      );
    }
  }

  return tx(() => {
    const active = conn
      .prepare(`SELECT * FROM teacher_assignments WHERE class_id = ? AND status = 'active'`)
      .all(classId) as any[];
    const keyOf = (a: any) => `${a.user_id}|${a.skill ?? ''}|${a.is_core ? 1 : 0}`;

    let added = 0; let ended = 0;
    for (const a of active) {
      if (wanted.has(keyOf(a))) { wanted.delete(keyOf(a)); continue; }
      conn
        .prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ? WHERE id = ?`)
        .run(today, a.id);
      ended += 1;
    }
    for (const s of wanted.values()) {
      conn
        .prepare(
          `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at)
           VALUES (?,?,?,?,?, 'active', ?)`,
        )
        .run(s.userId, classId, s.skill, s.isCore ? 1 : 0, today, nowIso());
      added += 1;
    }

    if (added || ended) {
      writeAudit({
        actorUserId: p.userId, action: 'class.assign', entityType: 'class', entityId: classId,
        entityLabel: cls.code, after: { added, ended },
      });
    }
    return classTeachers(p, classId);
  });
}

/**
 * BẢNG Ý THỨC CỦA MỘT LỚP — mục 13.3.
 *
 * Hàng là học viên; cột là SỐ ĐỢT case của từng nhóm ý thức, cộng hai con số hành động thật:
 * đã report cho gia đình mấy lần, đã gửi thư cảnh cáo mấy lần.
 *
 * BỐN CÁCH ĐẾM SAI mà mục 13.3 gọi đúng tên, và đây là chỗ chặn cả bốn:
 *
 * 1. ĐẾM CASE SAU GỘP, không lấy số báo cáo thành phần làm số case. Ba lần giáo viên báo
 *    trong bốn ngày là MỘT đợt; đếm thành ba là thổi số việc lên gấp ba.
 * 2. ĐẾM LẦN LÀM THẬT, không đếm phương án dự kiến. Một phương án "sẽ gọi phụ huynh" nằm
 *    chờ không phải là một lần gia đình đã được báo.
 * 3. MỘT LẦN LIÊN LẠC ĐẾM MỘT LẦN, kể cả khi nó phục vụ nhiều case. Cô gọi một cuộc nói cả
 *    chuyện đi học muộn lẫn chuyện không làm bài thì đó vẫn là một cuộc gọi.
 * 4. PHẠM VI MẶC ĐỊNH LÀ GIAI ĐOẠN EM HỌC TẠI CHÍNH LỚP NÀY. Chuyển lớp không mang lịch sử
 *    cũ sang giả thành sự việc của lớp mới; ai cần toàn hành trình thì bật, và bảng nói rõ
 *    mình đang đếm phạm vi nào.
 */
export function classBehaviourBoard(p: Principal, classId: number, opts: { allJourney?: boolean } = {}) {
  require_(p, PERMISSIONS.CASE_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');

  const students = conn
    .prepare(
      `SELECT s.id, s.student_code, s.full_name, e.started_at, e.ended_at
         FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id = ? AND e.status = 'active'
        ORDER BY s.full_name`,
    )
    .all(classId) as any[];
  if (!students.length) {
    return { classId, classCode: cls.code, allJourney: !!opts.allJourney, topics: [...BEHAVIOUR_TOPICS], rows: [] };
  }
  const sids = students.map((s) => s.id);
  const ph = sids.map(() => '?').join(',');
  const startOf = new Map<number, string | null>(students.map((s) => [s.id, s.started_at ?? null]));

  /* Sự việc có nằm trong khoảng em học ở lớp này không. Bật "toàn hành trình" thì lấy hết. */
  const inScope = (sid: number, on: string | null) => {
    if (opts.allJourney) return true;
    if (!on) return false;
    const from = startOf.get(sid);
    return !from || on >= from;
  };

  /*
   * ĐỢT case Ý thức/Khác — mỗi dòng `sos_cases` ĐÃ LÀ một đợt sau gộp (mục 7.2): các báo
   * cáo trong cửa sổ bốn ngày nằm ở `case_reports` của chính đợt đó, không sinh case mới.
   */
  const caseRows = conn
    .prepare(
      `SELECT sc.id, sc.student_id, sc.topic, sc.status, sc.detected_at
         FROM sos_cases sc
        WHERE sc.student_id IN (${ph}) AND sc.track = 'behaviour'`,
    )
    .all(...sids) as any[];

  /*
   * LẦN LIÊN LẠC THẬT — chỉ tính phương án ĐÃ XONG, và gom theo (em, loại, NGÀY) để một
   * cuộc gọi phục vụ hai case chỉ đếm một lần.
   */
  const contactRows = conn
    .prepare(
      `SELECT sc.student_id, iv.kind, iv.completed_date AS on_date
         FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE sc.student_id IN (${ph})
          AND iv.status = 'completed' AND iv.completed_date IS NOT NULL
          AND iv.kind IN ('talk_parent', 'warning_letter')`,
    )
    .all(...sids) as any[];

  const rows = students.map((s) => {
    const mine = caseRows.filter((c) => c.student_id === s.id && inScope(s.id, c.detected_at));
    const byTopic = Object.fromEntries(BEHAVIOUR_TOPICS.map((t) => [
      t,
      {
        episodes: mine.filter((c) => (c.topic ?? 'other') === t).length,
        open: mine.filter((c) => (c.topic ?? 'other') === t && c.status !== 'done').length,
      },
    ]));

    const contacts = contactRows.filter((r) => r.student_id === s.id && inScope(s.id, r.on_date));
    /* Gom theo NGÀY: một lần liên lạc phục vụ nhiều case vẫn là một lần. */
    const uniq = (kind: string) =>
      new Set(contacts.filter((r) => r.kind === kind).map((r) => r.on_date)).size;

    return {
      studentId: s.id, studentCode: s.student_code, fullName: s.full_name,
      topics: byTopic,
      totalEpisodes: mine.length,
      openEpisodes: mine.filter((c) => c.status !== 'done').length,
      /* "Report cho gia đình" và "Gửi thư cảnh cáo" — đếm lần ĐÃ LÀM, không đếm dự kiến. */
      reports: uniq('talk_parent'),
      warningLetters: uniq('warning_letter'),
      joinedAt: s.started_at ?? null,
    };
  });

  return {
    classId, classCode: cls.code,
    allJourney: !!opts.allJourney,
    topics: [...BEHAVIOUR_TOPICS],
    rows,
  };
}
