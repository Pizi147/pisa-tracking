import { db, tx } from '../db.ts';
import {
  CHUONG_TRINH_KHONG_CHIA_MON, CLASS_PHASE_LABEL, CO_DIEM_SQL, PERMISSIONS, kiemSoMtMoi, laLichSu, lichMtMacDinh, tuanHocCuaMt, tuanLich,
  PROGRAMME_TEMPLATES, kyHieuLop, nextStepsAfter, programmeOf, studyWeekOf,
  type ClassPhase, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { require_, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { ensurePeriod, mondayOf, periodById, weekInfo } from '../platform/week.ts';
import { ensureSkillRows, logSchedule, recomputeCompletionWeek } from '../fasttrack/skillSchedule.ts';
import { allProgrammes, type ProgrammeInfo } from '../normal/regular.ts';

/**
 * TUẦN BẮT ĐẦU HỌC → LỊCH MT MẶC ĐỊNH, VÀ TIẾN ĐỘ LỚP.
 *
 * Hai câu hỏi của mục 7.6, và cả hai đều quy về một phép đếm tuần:
 *
 *   Lớp FT     em vào học tuần nào → MT1 tuần thứ 6, MT2 tuần 12, MT3 tuần 16 của em
 *   Lớp Normal lớp khai giảng tuần nào → lớp đang ở tuần thứ mấy trên mấy tuần
 *
 * NGUYÊN TẮC LỚN NHẤT CỦA FILE NÀY: hệ thống chỉ ĐỀ XUẤT, không bao giờ ghi đè cái người
 * đã xếp. Owner nói rõ: "Đây là lịch mặc định; Quản lý chủ động xếp lại khi cần, và hệ
 * thống không được ghi đè cái Quản lý đã xếp." Cột `plan_source` là chỗ giữ lời hứa đó.
 */

// ==================================================================== lớp FT

export type SuggestedMock = {
  attemptNo: number;
  studyWeek: number;
  periodId: number;
  weekStart: string;
  code: string;
  /** Đã có lượt này trong hệ thống chưa, và ai xếp nó. */
  existingAttemptId: number | null;
  existingPeriodId: number | null;
  existingSource: 'auto' | 'manual' | null;
  /** Lượt đã làm xong thì KHÔNG được xếp lại — đó là lịch sử, không phải kế hoạch. */
  locked: boolean;
};

/**
 * LỊCH MT ĐỀ XUẤT cho một lộ trình FT, tính từ tuần bắt đầu học — theo LỘ TRÌNH (`lichMtMacDinh`: LT 6/12/16, RF 4/8).
 *
 * Chỉ đề xuất lịch mặc định (T33: không tự tạo MT4+); `daThiToiMt` (PR-NHAP, K2-33) kéo dài tới số đó. Lớp thường (không route)
 * và lộ trình chưa khai tuần bắt đầu học → mảng RỖNG — không đoán, vì đoán sai thì cả khoá lệch và không ai biết con số ấy từ đâu ra.
 */
export function suggestedMockWeeks(cycleId: number, daThiToiMt?: number): SuggestedMock[] {
  const conn = db();
  const cy = conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!cy?.start_period_id || !cy.route) return [];
  const start = periodById(cy.start_period_id);
  if (!start) return [];

  const existing = conn
    .prepare('SELECT * FROM assessment_attempts WHERE cycle_id = ? AND status != ?')
    .all(cycleId, 'cancelled') as any[];

  const out: SuggestedMock[] = [];
  const soLuot = Math.max(lichMtMacDinh(cy.route).length, daThiToiMt ?? 0);
  for (let no = 1; no <= soLuot; no += 1) {
    const week = tuanHocCuaMt(cy.route, no);
    /* Tuần học thứ 1 là chính tuần bắt đầu, nên lượt ở tuần thứ N cách đó N−1 tuần. */
    const monday = addDays(start.weekStart, 7 * (week - 1));
    const period = ensurePeriod(monday);
    const had = existing.find((a) => a.attempt_no === no) ?? null;
    out.push({
      attemptNo: no,
      studyWeek: week,
      periodId: period.id,
      weekStart: monday,
      code: period.code,
      existingAttemptId: had?.id ?? null,
      existingPeriodId: had?.planned_period_id ?? null,
      existingSource: (had?.plan_source ?? null) as any,
      locked: !!had && had.status === 'done',
    });
  }
  return out;
}

export type LuotMacDinh = { attemptId: number; attemptNo: number; weekStart: string; lichSu: boolean };
export type KetQuaLichMacDinh = { created: LuotMacDinh[]; moved: { attemptNo: number; weekStart: string }[]; kept: number };

/**
 * NGÀY TẠO của lượt theo lịch nghiệp vụ. `created_at` là giờ máy thật; ở demo đồng hồ nghiệp vụ có thể lùi hơn giờ thật, nên lấy
 * ngày sớm hơn trong hai — bản chính `created_at` luôn ≤ hôm nay nên kết quả đúng bằng `created_at`.
 */
export function ngayTaoLuot(createdAt: string): string {
  const d = createdAt.slice(0, 10); const h = demoToday();
  return d < h ? d : h;
}

/**
 * LÕI LỊCH MT MẶC ĐỊNH (M1, M5, T33–T35, K2-33) — một chỗ cho "Áp lịch" của Quản lý, đổi tuần bắt đầu học và `taoMtMacDinh`.
 * KHÔNG kiểm quyền: nơi gọi đã kiểm (hoặc là luật hệ thống, Q6).
 *
 *   tạo   số còn thiếu (không có dòng nào, kể cả dòng đã huỷ — số huỷ để người tạo lại); giữ đánh số liền mạch (`kiemSoMtMoi`).
 *         `lich_su` = tuần thi đã kết thúc trước `ngayTao` (mặc định hôm nay; T34 — lưu lúc tạo).
 *   dời   (trừ khi `chiTao`) chỉ lượt `planned` + `plan_source='auto'` CHƯA có điểm nào, và chỉ kỹ năng 'auto' + 'scheduled';
 *         rồi tính lại `lich_su` theo ngày tạo của chính lượt. Lượt người đã chốt / đã có điểm / đã xong đứng yên — đó là toàn bộ
 *         ý nghĩa của hàm này: đổi tuần bắt đầu học thì lịch đề xuất chạy theo, còn cái người đã chốt thì đứng yên.
 */
export function apLichMacDinh(cycleId: number, actorUserId: number | null, o: {
  ngayTao?: string; daThiToiMt?: number; chiTao?: boolean;
} = {}): KetQuaLichMacDinh {
  const conn = db();
  const kq: KetQuaLichMacDinh = { created: [], moved: [], kept: 0 };
  const goiY = suggestedMockWeeks(cycleId, o.daThiToiMt);
  if (!goiY.length) return kq;
  const cy = conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  const ngayTao = (o.ngayTao ?? demoToday()).slice(0, 10);
  const classId = (conn
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status='active' ORDER BY id DESC LIMIT 1`)
    .get(cy.student_id) as any)?.class_id ?? null;

  return tx(() => {
    const ds = conn.prepare(
      `SELECT a.id, a.attempt_no, a.status, a.plan_source, a.planned_period_id, a.created_at, ${CO_DIEM_SQL('a')} AS coDiem
         FROM assessment_attempts a WHERE a.cycle_id = ?`).all(cycleId) as any[];
    for (const s of goiY) {
      const had = ds.find((x) => x.attempt_no === s.attemptNo);
      if (!had) {
        if (kiemSoMtMoi(ds.map((x) => ({ attempt_no: x.attempt_no, status: x.status, coDiem: !!x.coDiem })), s.attemptNo)) {
          kq.kept += 1; continue;
        }
        const lichSu = laLichSu(addDays(s.weekStart, 6), ngayTao);
        const id = Number(conn
          .prepare(
            `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id,
                                              planned_period_id, plan_source, status,
                                              target_at_attempt, created_by, created_at, lich_su)
             VALUES (?,?,?, 'mock', ?,?, 'auto', 'planned', ?,?,?,?)`,
          )
          .run(cycleId, cy.student_id, s.attemptNo, classId, s.periodId,
               cy.target_score ?? null, actorUserId, nowIso(), lichSu ? 1 : 0).lastInsertRowid);
        ensureSkillRows(id);
        logSchedule(id, { action: 'created', field: 'planned_period', newValue: s.code, reason: 'Lịch MT mặc định', actor: actorUserId });
        ds.push({ id, attempt_no: s.attemptNo, status: 'planned', plan_source: 'auto', planned_period_id: s.periodId, coDiem: 0 });
        kq.created.push({ attemptId: id, attemptNo: s.attemptNo, weekStart: s.weekStart, lichSu });
        continue;
      }
      if (o.chiTao || had.status !== 'planned' || had.plan_source !== 'auto' || had.coDiem || had.planned_period_id === s.periodId) {
        kq.kept += 1; continue;
      }
      conn
        .prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'auto', updated_at = ? WHERE id = ?`)
        .run(s.periodId, nowIso(), had.id);
      /*
       * Lịch GỢI Ý chỉ được đụng vào những kỹ năng chưa ai chốt riêng ('auto'). Kỹ năng
       * nào một người đã xếp tay thì đứng yên — đúng lời hứa "hệ thống không ghi đè cái
       * Quản lý đã xếp" (mục 10.4).
       */
      conn
        .prepare(`UPDATE attempt_skills SET planned_period_id = ?, updated_at = ?
                   WHERE attempt_id = ? AND plan_source = 'auto' AND sit_status = 'scheduled'`)
        .run(s.periodId, nowIso(), had.id);
      recomputeCompletionWeek(had.id, actorUserId);
      /* Dời theo tuần bắt đầu → tính lại `lich_su` so với ngày tạo CỦA CHÍNH LƯỢT (chỗ duy nhất được tính lại, M-13). */
      const tuanKt = (conn.prepare(
        `SELECT MAX(p.week_end) AS kt FROM attempt_skills ask JOIN report_periods p ON p.id = ask.planned_period_id
          WHERE ask.attempt_id = ? AND ask.required = 1 AND ask.sit_status != 'cancelled'`).get(had.id) as any)?.kt ?? null;
      conn.prepare('UPDATE assessment_attempts SET lich_su = ? WHERE id = ?')
        .run(tuanKt && laLichSu(tuanKt, ngayTaoLuot(had.created_at)) ? 1 : 0, had.id);
      kq.moved.push({ attemptNo: s.attemptNo, weekStart: s.weekStart });
    }
    if (kq.created.length) {
      /* Một dòng hành trình cho cả lộ trình, không một dòng mỗi lượt. */
      addJourney({
        studentId: cy.student_id, cycleId, eventType: 'mock_scheduled', eventDate: ngayTao,
        title: `Lịch MT mặc định · ${kq.created.map((x) => `MT${x.attemptNo} ${tuanLich(x.weekStart, ngayTao)}`).join(' · ')}`,
        detail: kq.created.some((x) => x.lichSu) ? 'MT có tuần thi đã qua là MT lịch sử — nhập bù, không có hạn' : null,
        refTable: 'learning_cycles', refId: cycleId, createdBy: actorUserId,
      });
    }
    if (kq.created.length || kq.moved.length) {
      writeAudit({ actorUserId, action: 'schedule.autoplan', entityType: 'learning_cycle', entityId: cycleId,
        after: { created: kq.created.length, moved: kq.moved.length, kept: kq.kept } });
    }
    return kq;
  });
}

/**
 * ÁP LỊCH ĐỀ XUẤT của Quản lý — kiểm quyền xếp tuần rồi gọi lõi. Trả về số lượt đã tạo và số lượt đã dời, để giao diện nói đúng
 * việc vừa xảy ra thay vì một câu "đã lưu" chung chung.
 */
export function applySuggestedMockWeeks(p: Principal, cycleId: number): { created: number; moved: number; kept: number } {
  const cy = db().prepare('SELECT * FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!cy) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.PLAN_WEEK, { studentId: cy.student_id },
    'Bạn không có quyền xếp tuần MT cho học viên này.');
  if (!suggestedMockWeeks(cycleId).length) {
    throw badRequest('Chưa khai tuần bắt đầu học nên chưa đề xuất được lịch MT.');
  }
  const r = apLichMacDinh(cycleId, p.userId);
  return { created: r.created.length, moved: r.moved.length, kept: r.kept };
}

// ==================================================================== lớp Normal

export type ClassProgress = {
  programmeCode: ProgrammeCode | null;
  programmeName: string | null;
  /** Tổng số tuần của chương trình. NULL với lớp FT — FT không có số tuần cố định. */
  totalWeeks: number | null;
  /** Lớp đang ở tuần học thứ mấy. NULL khi chưa khai tuần bắt đầu. */
  currentWeek: number | null;
  startPeriodId: number | null;
  startWeekStart: string | null;
  progressWeek: number | null;
  finalWeek: number | null;
  /** Người đã xếp lại mốc, khác mốc mặc định của chương trình. */
  progressOverridden: boolean;
  finalOverridden: boolean;
  /** Tuần lịch của hai mốc, để hiện "Progress Test tuần này". */
  progressWeekStart: string | null;
  finalWeekStart: string | null;
  /** 'progress' | 'final' khi CHÍNH TUẦN NÀY là tuần kiểm tra. */
  checkpointThisWeek: 'progress' | 'final' | null;
  /** Chặng của lớp — thứ quyết định lớp có nổi lên màn hình hay không. */
  phase: ClassPhase;
  phaseLabel: string;
  /** Còn mấy tuần nữa hết chương trình. Âm nghĩa là đã quá. */
  weeksLeft: number | null;
  /**
   * LỚP ĐÃ HẾT CHƯƠNG TRÌNH → mọi học viên còn đang học PHẢI được xếp lớp tiếp theo.
   * Hai đường: lên bậc Normal kế tiếp, hoặc lên FT.
   */
  needsPlacement: boolean;
  placementOptions: { code: ProgrammeCode; name: string }[];
  /** Số học viên còn đang học ở lớp này — chính là số em cần xếp lớp khi lớp đã xong. */
  activeStudents: number;
  /**
   * Số em THẬT SỰ cần xếp lớp tiếp ngay (PR-LT, Q9) — `activeStudents` trừ em đã ghi
   * `huong='xep_sau'` với `ngay_xem_lai` còn ở tương lai. Badge/việc đỏ Hết khoá dùng số này.
   */
  canXepLop: number;
  /** Một dòng đọc được ngay, ví dụ "BE · tuần 5/10 · Progress Test tuần này". */
  label: string | null;
};

/**
 * LỚP ĐANG Ở TUẦN THỨ MẤY — mục 7.6.
 *
 * Lớp FT không có số tuần cố định nên chỉ trả về mã chương trình; mọi con số tuần để trống
 * thay vì bịa ra một mẫu số. Với lớp FT, thứ tương đương là lịch MT của TỪNG EM, nằm ở
 * `suggestedMockWeeks`.
 */
export function classProgress(classId: number): ClassProgress {
  const conn = db();
  const c = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!c) throw notFound('Không tìm thấy lớp');
  const start = c.start_period_id ? periodById(c.start_period_id) : null;
  const row = conn.prepare(CLASS_ACTIVE_COUNT_SQL).get(demoToday(), classId) as any;
  return computeProgress(c, start, row.n, row.can_xep_lop ?? 0, allProgrammes());
}

/**
 * Đếm em `active` của một lớp, và trong đó bao nhiêu em CÒN CẦN xếp lớp tiếp ngay (Q9): trừ
 * em đã ghi `huong='xep_sau'` mà `ngay_xem_lai` còn ở tương lai — một câu, không N+1.
 */
const CLASS_ACTIVE_COUNT_SQL = `
  SELECT COUNT(*) n,
         SUM(CASE WHEN EXISTS (
           SELECT 1 FROM lo_trinh_tiep_theo lt
            WHERE lt.student_id = e.student_id AND lt.class_id = e.class_id
              AND lt.huong = 'xep_sau' AND lt.ngay_xem_lai > ?
         ) THEN 0 ELSE 1 END) can_xep_lop
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
   WHERE e.class_id = ? AND e.status = 'active'
     AND s.status = 'active' AND s.archived_at IS NULL`;

/**
 * TIẾN ĐỘ CỦA NHIỀU LỚP TRONG BA CÂU LỆNH — không phải ba câu MỖI LỚP.
 *
 * Danh sách lớp gọi hàm này cho cả trang. Bản đầu gọi `classProgress` trong vòng lặp và
 * biến một trang mười lớp thành tám mươi câu truy vấn; bài kiểm N+1 của vòng trước bắt
 * đúng chỗ đó. Ở quy mô demo thì không ai thấy chậm — ở quy mô thật thì thấy ngay.
 */
export function classProgressMany(classIds: number[], programmes?: Map<string, ProgrammeInfo>): Map<number, ClassProgress> {
  const out = new Map<number, ClassProgress>();
  if (!classIds.length) return out;
  const conn = db();
  const ph = classIds.map(() => '?').join(',');

  const classes = conn.prepare(`SELECT * FROM classes WHERE id IN (${ph})`).all(...classIds) as any[];
  const periodIds = [...new Set(classes.map((c) => c.start_period_id).filter(Boolean))];
  const periods = new Map<number, any>();
  if (periodIds.length) {
    for (const r of conn
      .prepare(`SELECT * FROM report_periods WHERE id IN (${periodIds.map(() => '?').join(',')})`)
      .all(...periodIds) as any[]) {
      periods.set(r.id, { id: r.id, ...weekInfo(r.week_start) });
    }
  }
  const counts = new Map<number, number>();
  const canXepByClass = new Map<number, number>();
  for (const r of conn
    .prepare(
      `SELECT e.class_id, COUNT(*) n,
              SUM(CASE WHEN EXISTS (
                SELECT 1 FROM lo_trinh_tiep_theo lt
                 WHERE lt.student_id = e.student_id AND lt.class_id = e.class_id
                   AND lt.huong = 'xep_sau' AND lt.ngay_xem_lai > ?
              ) THEN 0 ELSE 1 END) can_xep_lop
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${ph}) AND e.status = 'active'
          AND s.status = 'active' AND s.archived_at IS NULL
        GROUP BY e.class_id`,
    )
    .all(demoToday(), ...classIds) as any[]) {
    counts.set(r.class_id, r.n);
    canXepByClass.set(r.class_id, r.can_xep_lop ?? 0);
  }

  const progs = programmes ?? allProgrammes();
  for (const c of classes) {
    out.set(c.id, computeProgress(c, c.start_period_id ? periods.get(c.start_period_id) ?? null : null,
      counts.get(c.id) ?? 0, canXepByClass.get(c.id) ?? 0, progs));
  }
  return out;
}

/** Phần TÍNH THUẦN TUÝ — không chạm database, nên gọi hàng loạt được. */
function computeProgress(
  c: any,
  start: { weekStart: string } | null,
  activeStudents: number,
  canXepLop: number,
  programmes: Map<string, ProgrammeInfo>,
): ClassProgress {
  const code = (c.programme_code ?? programmeOf(c.kind)) as ProgrammeCode | null;
  const prog = code ? programmes.get(code) ?? null : null;
  const thisMonday = mondayOf(demoToday());
  const currentWeek = start ? studyWeekOf(start.weekStart, thisMonday) : null;

  /* MỘT NGUỒN (PF1): lớp đã chụp số tuần lúc tạo thì giữ số đó; lớp chưa chụp đọc bảng `programmes`. */
  const chup = c.so_tuan !== null && c.so_tuan !== undefined;
  const totalWeeks: number | null = chup ? c.so_tuan : prog?.weeks ?? null;
  const defProgress = chup ? c.tuan_giua_khoa ?? null : prog?.checkpoints.find((k) => k.kind === 'progress')?.studyWeek ?? null;
  const defFinal = chup ? c.tuan_cuoi_khoa ?? c.so_tuan : prog?.checkpoints.find((k) => k.kind === 'final')?.studyWeek ?? null;
  const progressWeek = c.progress_week_override ?? defProgress;
  const finalWeek = c.final_week_override ?? defFinal;

  const weekStartOf = (n: number | null) =>
    (start && n ? addDays(start.weekStart, 7 * (n - 1)) : null);
  const progressWeekStart = weekStartOf(progressWeek);
  const finalWeekStart = weekStartOf(finalWeek);

  const checkpointThisWeek = finalWeekStart === thisMonday ? 'final'
    : progressWeekStart === thisMonday ? 'progress'
    : null;

  /*
   * CHẶNG CỦA LỚP — owner yêu cầu 13/09/2026: lớp Normal phải TỰ BÁO khi đang trong tuần
   * Progress Test, tuần Final Test, và khi đã hết chương trình.
   *
   * Vì sao báo TRƯỚC MỘT TUẦN chứ không chỉ báo trong tuần: đề kiểm tra và lịch phòng phải
   * chuẩn bị trước. Biết vào đúng sáng thứ Hai của tuần thi thì đã muộn.
   *
   * Thứ tự kiểm đi từ MUỘN NHẤT về SỚM NHẤT: một lớp đã hết chương trình thì không còn là
   * "tuần sau Final Test" nữa, dù phép tính tuần vẫn khớp cả hai.
   */
  const nextMonday = addDays(thisMonday, 7);
  const weeksLeft = currentWeek !== null && totalWeeks !== null ? totalWeeks - currentWeek : null;

  let phase: ClassPhase;
  if (code === 'FT') phase = 'running';
  else if (!start || currentWeek === null) phase = 'unknown';
  else if (currentWeek < 1) phase = 'not_started';
  else if (totalWeeks !== null && currentWeek > totalWeeks) phase = 'finished';
  else if (finalWeekStart === thisMonday) phase = 'final_week';
  else if (finalWeekStart === nextMonday) phase = 'final_soon';
  else if (progressWeekStart === thisMonday) phase = 'progress_week';
  else if (progressWeekStart === nextMonday) phase = 'progress_soon';
  else phase = 'running';

  const needsPlacement = phase === 'finished' && canXepLop > 0;
  const placementOptions = needsPlacement
    ? nextStepsAfter(code).map((c) => ({ code: c, name: programmes.get(c)?.name ?? PROGRAMME_TEMPLATES[c].name }))
    : [];

  /*
   * MỘT DÒNG ĐỌC ĐƯỢC NGAY. Dựng ở máy chủ vì nhiều màn hình cùng cần đúng câu này; để
   * mỗi màn tự ghép thì sẽ có màn ghép thiếu, và hai màn nói khác nhau về cùng một lớp.
   */
  let label: string | null = null;
  if (totalWeeks) {
    const parts: string[] = [kyHieuLop(code, c.route) ?? prog?.name ?? ''];   // ký hiệu, không lộ mã PREFOU (K2-24)
    if (phase === 'finished') {
      parts.push(`đã học xong ${totalWeeks} tuần`);
      if (canXepLop > 0) parts.push(`${canXepLop} học viên cần xếp lớp tiếp`);
    } else {
      parts.push(currentWeek !== null ? `tuần ${currentWeek}/${totalWeeks}` : 'chưa khai tuần bắt đầu');
      if (phase !== 'running' && phase !== 'not_started' && phase !== 'unknown') {
        parts.push(CLASS_PHASE_LABEL[phase]);
      }
    }
    label = parts.join(' · ');
  } else if (code === 'FT') {
    label = c.route ? `Fast Track · ${c.route}` : 'Fast Track';
  }

  return {
    programmeCode: code, programmeName: prog?.name ?? null,
    totalWeeks,
    currentWeek,
    startPeriodId: c.start_period_id ?? null,
    startWeekStart: start?.weekStart ?? null,
    progressWeek, finalWeek,
    progressOverridden: c.progress_week_override !== null && c.progress_week_override !== undefined,
    finalOverridden: c.final_week_override !== null && c.final_week_override !== undefined,
    progressWeekStart, finalWeekStart,
    checkpointThisWeek,
    phase, phaseLabel: CLASS_PHASE_LABEL[phase],
    weeksLeft, needsPlacement, placementOptions, activeStudents, canXepLop,
    label,
  };
}

/**
 * NHỮNG LỚP ĐANG CÓ CHUYỆN CẦN BÁO — dùng cho màn việc và cho thanh lớp.
 *
 * Chỉ trả về lớp ở chặng ĐÁNG NÓI: sắp thi, đang thi, hoặc đã hết chương trình. Lớp đang
 * học bình thường không xuất hiện — một danh sách liệt kê cả những lớp không cần làm gì là
 * một danh sách không ai đọc.
 */
export function classAlerts(classIds: number[]): Map<number, ClassProgress> {
  const out = new Map<number, ClassProgress>();
  for (const [id, pr] of classProgressMany(classIds)) {
    if (pr.phase === 'progress_soon' || pr.phase === 'progress_week'
      || pr.phase === 'final_soon' || pr.phase === 'final_week'
      || (pr.phase === 'finished' && pr.activeStudents > 0)
      || pr.phase === 'unknown') {
      out.set(id, pr);
    }
  }
  return out;
}

/**
 * Đổi tuần bắt đầu và mốc kiểm tra của lớp. Quyền: Admin CN và Quản lý CN (mục 7.6).
 *
 * Đặt mốc về TRỐNG là quay lại mốc mặc định của chương trình — không phải xoá mốc. Cần có
 * đường quay lại, nếu không thì một lần gõ nhầm là lớp đó vĩnh viễn lệch chuẩn.
 */
export function setClassProgress(p: Principal, classId: number, input: {
  startPeriodId?: number | null; progressWeek?: number | null; finalWeek?: number | null;
}) {
  const conn = db();
  const c = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!c) throw notFound('Không tìm thấy lớp');
  require_(p, PERMISSIONS.CLASS_EDIT, { classId }, 'Bạn không có quyền sửa tiến độ của lớp này.');

  const code = (c.programme_code ?? programmeOf(c.kind)) as ProgrammeCode | null;
  const weeks: number | null = c.so_tuan ?? (code ? allProgrammes().get(code)?.weeks ?? null : null);
  const checkWeek = (v: number | null | undefined, label: string) => {
    if (v === null || v === undefined) return null;
    if (!Number.isInteger(v) || v < 1) throw badRequest(`${label} phải là số tuần từ 1 trở lên.`);
    if (weeks && v > weeks) throw badRequest(`${label} không thể vượt quá ${weeks} tuần của chương trình.`);
    return v;
  };
  const progress = 'progressWeek' in input ? checkWeek(input.progressWeek, 'Tuần Giữa khoá') : undefined;
  const final = 'finalWeek' in input ? checkWeek(input.finalWeek, 'Tuần Cuối khoá') : undefined;
  if (progress && c.so_tuan !== null && c.so_tuan !== undefined && (c.tuan_giua_khoa === null || c.tuan_giua_khoa === undefined)) {
    throw badRequest('Chương trình này không có bài Giữa khoá.');
  }
  if (progress !== undefined && final !== undefined && progress && final && progress >= final) {
    throw badRequest('Giữa khoá phải ở trước Cuối khoá.');
  }
  if (input.startPeriodId && !periodById(input.startPeriodId)) throw badRequest('Tuần bắt đầu không hợp lệ.');

  const sets: string[] = []; const params: unknown[] = [];
  if ('startPeriodId' in input) { sets.push('start_period_id = ?'); params.push(input.startPeriodId ?? null); }
  if (progress !== undefined) { sets.push('progress_week_override = ?'); params.push(progress); }
  if (final !== undefined) { sets.push('final_week_override = ?'); params.push(final); }
  if (!sets.length) return classProgress(classId);

  params.push(classId);
  conn.prepare(`UPDATE classes SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  writeAudit({ actorUserId: p.userId, action: 'class.progress', entityType: 'class', entityId: classId,
    entityLabel: c.code, before: {
      startPeriodId: c.start_period_id, progressWeek: c.progress_week_override, finalWeek: c.final_week_override,
    }, after: input });
  return classProgress(classId);
}

// ==================================================================== thiếu thông tin

export type MissingInfo = {
  /** Mã ngắn để giao diện và bộ lọc dùng chung một từ vựng. */
  key: 'start_week' | 'exam_month' | 'target' | 'dob' | 'class_start_week' | 'teachers' | 'core_teacher'
     | 'next_milestone' | 'baseline';
  label: string;
  /** Ai là người điền được — để badge nói đúng với đúng vai, không đổ việc lung tung. */
  who: string;
};

const MISSING_LABEL: Record<MissingInfo['key'], { label: string; who: string }> = {
  start_week: { label: 'Tuần bắt đầu học', who: 'Admin CN · Quản lý · GVCN' },
  exam_month: { label: 'Tháng/năm dự kiến thi', who: 'Admin CN · Quản lý · GVCN' },
  target: { label: 'Target', who: 'Admin CN · Quản lý' },
  dob: { label: 'Ngày sinh', who: 'Admin CN' },
  class_start_week: { label: 'Tuần bắt đầu của lớp', who: 'Admin CN · Quản lý' },
  teachers: { label: 'Giáo viên các kỹ năng', who: 'Admin CN · Quản lý' },
  core_teacher: { label: 'Giáo viên chủ nhiệm', who: 'Admin CN · Quản lý' },
  next_milestone: { label: 'Mốc đánh giá tiếp theo', who: 'Admin CN · Quản lý' },
  baseline: { label: 'Điểm đầu vào', who: 'Admin CN · Quản lý' },
};

const miss = (key: MissingInfo['key']): MissingInfo => ({ key, ...MISSING_LABEL[key] });

/**
 * BADGE "THIẾU THÔNG TIN" CỦA MỘT HỌC VIÊN — mục 7.5.
 *
 * GOM MỌI THỨ CÒN THIẾU VÀO MỘT BADGE, không phải mỗi thứ một nhãn. Owner nói rõ điều này,
 * và lý do thì nhìn bảng lớp là thấy: bốn nhãn nhỏ trên một dòng học viên thì dòng nào cũng
 * đầy nhãn, và người đọc thôi nhìn chúng.
 *
 * Đây KHÔNG phải việc trong hàng đợi công việc — không có hạn, không ai bị thúc. Nó chỉ cần
 * được nhìn thấy bởi vai có trách nhiệm.
 *
 * Lớp Normal KHÔNG bị nhắc tháng thi: các em đó chưa thi IELTS, nhắc là nhắc sai.
 */
export function missingForStudent(input: {
  cycle: {
    start_period_id?: number | null; exam_month?: string | null; target_score?: number | null;
    baseline?: boolean;
  } | null;
  student: { dob?: string | null } | null;
  isFastTrack: boolean;
  /** Đã có mốc đánh giá nào đang chờ tới chưa. `undefined` = chưa hỏi, thì không nhắc. */
  hasNextMilestone?: boolean;
}): MissingInfo[] {
  const out: MissingInfo[] = [];
  /*
   * CHỈ NHỮNG THIẾU SÓT CẢN TRỞ CHUYÊN MÔN (mục 5.3).
   *
   * Badge này là một CẢNH BÁO HỌC THUẬT, nên nó chỉ được chứa những thứ mà thiếu đi thì
   * không đánh giá, không so kỳ vọng, hoặc không lên kế hoạch tiếp được:
   *
   *   tuần bắt đầu    → không tính được lớp đang ở tuần mấy, không suy được lịch đánh giá
   *   target (FT)     → không có kỳ vọng thì mọi điểm đều không kết luận được
   *   tháng thi (FT)  → không xếp được lịch MT cho cả khoá
   *   mốc tiếp theo   → không biết lần đánh giá sau là khi nào
   *   điểm đầu vào    → không tính được em đã tiến bộ bao nhiêu từ lúc vào học
   *
   * NGÀY SINH ĐÃ BỎ KHỎI ĐÂY. Nó là thông tin hành chính: thiếu thì hồ sơ chưa đầy đủ,
   * nhưng không cản trở việc dạy hay việc đánh giá một buổi nào. Biến mọi ô cá nhân còn
   * trống thành cảnh báo học thuật là cách nhanh nhất để không ai còn tin cảnh báo nào.
   */
  if (!input.cycle?.start_period_id) out.push(miss('start_week'));
  if (input.isFastTrack) {
    if (!input.cycle?.exam_month) out.push(miss('exam_month'));
    if (input.cycle?.target_score === null || input.cycle?.target_score === undefined) out.push(miss('target'));
    if (input.cycle && input.cycle.baseline === false) out.push(miss('baseline'));
  }
  if (input.hasNextMilestone === false) out.push(miss('next_milestone'));
  return out;
}

/**
 * BADGE "THIẾU THÔNG TIN" CỦA MỘT LỚP.
 *
 * Khác học viên ở chỗ lớp còn thiếu được cả NGƯỜI: thiếu giáo viên một kỹ năng, hoặc chưa
 * có GVCN. Nhãn nói rõ thiếu kỹ năng nào — "Thiếu GV R, L" (mục 7.7) — vì "thiếu giáo viên"
 * chung chung thì Admin vẫn phải mở lớp ra xem thiếu ai.
 */
export function missingForClass(classId: number): { items: MissingInfo[]; missingSkills: string[] } {
  return missingForClasses([classId]).get(classId) ?? { items: [], missingSkills: [] };
}

/** Bản hàng loạt — hai câu lệnh cho cả trang, không phải hai câu mỗi lớp. */
export function missingForClasses(
  classIds: number[],
  programmes?: Map<string, ProgrammeInfo>,
): Map<number, { items: MissingInfo[]; missingSkills: string[] }> {
  const out = new Map<number, { items: MissingInfo[]; missingSkills: string[] }>();
  if (!classIds.length) return out;
  const conn = db();
  const ph = classIds.map(() => '?').join(',');

  const classes = conn.prepare(`SELECT * FROM classes WHERE id IN (${ph})`).all(...classIds) as any[];
  const byClass = new Map<number, any[]>();
  for (const a of conn
    .prepare(
      `SELECT class_id, skill, is_core FROM teacher_assignments
        WHERE class_id IN (${ph}) AND status = 'active'`,
    )
    .all(...classIds) as any[]) {
    if (!byClass.has(a.class_id)) byClass.set(a.class_id, []);
    byClass.get(a.class_id)!.push(a);
  }

  for (const c of classes) {
    const code = (c.programme_code ?? programmeOf(c.kind)) as ProgrammeCode | null;
    const prog = code ? (programmes ??= allProgrammes()).get(code) ?? null : null;
    const items: MissingInfo[] = [];
    /* Lớp FT không cần tuần bắt đầu của LỚP — lịch MT đi theo từng em. */
    if ((c.so_tuan ?? prog?.weeks) && !c.start_period_id) items.push(miss('class_start_week'));

    const assigned = byClass.get(c.id) ?? [];
    const have = new Set(assigned.map((a) => a.skill));
    /* Lớp không chia môn (Pre FOU): GVCN dạy luôn — chỉ nhắc thiếu GVCN, không "thiếu GV tong_hop" (K2 §4b). */
    const missingSkills = CHUONG_TRINH_KHONG_CHIA_MON.includes(code ?? '') ? []
      : (prog?.skills ?? []).filter((sk) => !have.has(sk));
    if (missingSkills.length) items.push(miss('teachers'));
    if (!assigned.some((a) => a.is_core)) items.push(miss('core_teacher'));

    out.set(c.id, { items, missingSkills: [...missingSkills] });
  }
  return out;
}
