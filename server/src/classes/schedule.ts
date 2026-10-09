import { THAM_SO_TOI_DA, chenNhieuDong, db, theoLo, tx } from '../db.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import {
  CHUONG_TRINH_KHONG_CHIA_MON, boMonLich, CLASS_PHASE_LABEL, CO_DIEM_SQL, MOC_KE_TIEP_SQL, PERMISSIONS, kiemSoMtMoi, laMtCu, lichMtMacDinh, tuanHocCuaMt, tuanLich,
  PROGRAMME_TEMPLATES, kyHieuLop, nextStepsAfter, programmeOf, studyWeekOf,
  type ClassPhase, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { ensurePeriods, mondayOf, periodById, weekInfo } from '../platform/week.ts';
import { recomputeCompletionWeek, tinhLaiMtCu } from '../fasttrack/skillSchedule.ts';
import { allProgrammes, programmeByCode, type ProgrammeInfo } from '../normal/regular.ts';

/**
 * TUẦN BẮT ĐẦU HỌC → LỊCH MT MẶC ĐỊNH, VÀ TIẾN ĐỘ LỚP.
 *
 * Hai câu hỏi của mục 7.6, và cả hai đều quy về một phép đếm tuần:
 *
 *   Lớp FT     em vào học tuần nào → MT1 tuần thứ 6, MT2 tuần 12, MT3 tuần 16 của em
 *   Lớp thường lớp khai giảng tuần nào → lớp đang ở tuần thứ mấy trên mấy tuần
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
  return goiYLo([{ cycleId, daThiToiMt }]).get(cycleId)?.goiY ?? [];
}

/** Yêu cầu lịch MT cho một lộ trình trong lô. */
export type YeuCauLichMt = { cycleId: number; daThiToiMt?: number };

/**
 * `suggestedMockWeeks` cho NHIỀU lộ trình (PR-TOC) — số câu SQL không phụ thuộc số lộ trình. Lộ trình không đề xuất được (không route,
 * chưa có tuần bắt đầu) không có trong Map. Kèm dòng `learning_cycles` để `apLichMacDinhLo` khỏi đọc lại.
 */
function goiYLo(yc: readonly YeuCauLichMt[]): Map<number, { cy: any; goiY: SuggestedMock[] }> {
  const out = new Map<number, { cy: any; goiY: SuggestedMock[] }>();
  if (!yc.length) return out;
  const conn = db();
  const cyOf = new Map<number, any>();
  theoLo([...new Set(yc.map((y) => y.cycleId))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT * FROM learning_cycles WHERE id IN (${ph})`).all(...lo) as any[]) cyOf.set(r.id, r);
  });
  const co = yc.filter((y) => cyOf.get(y.cycleId)?.start_period_id && cyOf.get(y.cycleId)?.route);
  if (!co.length) return out;
  const startOf = new Map<number, string>();
  theoLo([...new Set(co.map((y) => cyOf.get(y.cycleId).start_period_id as number))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, week_start FROM report_periods WHERE id IN (${ph})`).all(...lo) as any[]) {
      startOf.set(r.id, weekInfo(r.week_start).weekStart);
    }
  });

  /* Tuần học thứ 1 là chính tuần bắt đầu, nên lượt ở tuần thứ N cách đó N−1 tuần. */
  const lich = co.filter((y) => startOf.has(cyOf.get(y.cycleId).start_period_id)).map((y) => {
    const cy = cyOf.get(y.cycleId);
    const start = startOf.get(cy.start_period_id)!;
    const soLuot = Math.max(lichMtMacDinh(cy.route).length, y.daThiToiMt ?? 0);
    return { cy, luot: Array.from({ length: soLuot }, (_, i) => {
      const week = tuanHocCuaMt(cy.route, i + 1);
      return { no: i + 1, week, monday: addDays(start, 7 * (week - 1)) };
    }) };
  });
  const periods = ensurePeriods(lich.flatMap((l) => l.luot.map((x) => x.monday)));
  const existing = new Map<number, any[]>();
  theoLo(lich.map((l) => l.cy.id as number), (lo, ph) => {
    for (const a of conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id IN (${ph}) AND status != 'cancelled'`).all(...lo) as any[]) {
      if (!existing.has(a.cycle_id)) existing.set(a.cycle_id, []);
      existing.get(a.cycle_id)!.push(a);
    }
  });
  for (const { cy, luot } of lich) {
    out.set(cy.id, { cy, goiY: luot.map(({ no, week, monday }) => {
      const period = periods.get(monday)!;
      const had = existing.get(cy.id)?.find((a) => a.attempt_no === no) ?? null;
      return {
        attemptNo: no,
        studyWeek: week,
        periodId: period.id,
        weekStart: monday,
        code: period.code,
        existingAttemptId: had?.id ?? null,
        existingPeriodId: had?.planned_period_id ?? null,
        existingSource: (had?.plan_source ?? null) as any,
        locked: !!had && had.status === 'done',
      };
    }) });
  }
  return out;
}

export type LuotMacDinh = { attemptId: number; attemptNo: number; weekStart: string; lichSu: boolean };
export type KetQuaLichMacDinh = { created: LuotMacDinh[]; moved: { attemptNo: number; weekStart: string }[]; kept: number };

/** Ngày tạo lượt theo lịch nghiệp vụ — chuyển sang `skillSchedule.ts` (PR-LM, dùng chung với `tinhLaiLichSu`). */
export { ngayTaoLuot } from '../fasttrack/skillSchedule.ts';

/**
 * LÕI LỊCH MT MẶC ĐỊNH (M1, M5, T33–T35, K2-33) — một chỗ cho "Áp lịch" của Quản lý, đổi tuần bắt đầu học và `taoMtMacDinh`.
 * KHÔNG kiểm quyền: nơi gọi đã kiểm (hoặc là luật hệ thống, Q6).
 *
 *   tạo   số còn thiếu (không có dòng nào, kể cả dòng đã huỷ — số huỷ để người tạo lại); giữ đánh số liền mạch (`kiemSoMtMoi`).
 *         `lich_su` = MT cũ: tuần thi cách tuần của `ngayTao` ≥ 2 tuần (mặc định hôm nay; T1 PR-MTa — lưu lúc tạo).
 *   dời   (trừ khi `chiTao`) chỉ lượt `planned` + `plan_source='auto'` CHƯA có điểm nào, và chỉ kỹ năng 'auto' + 'scheduled';
 *         rồi tính lại `lich_su` theo ngày tạo của chính lượt. Lượt người đã chốt / đã có điểm / đã xong đứng yên — đó là toàn bộ
 *         ý nghĩa của hàm này: đổi tuần bắt đầu học thì lịch đề xuất chạy theo, còn cái người đã chốt thì đứng yên.
 */
export function apLichMacDinh(cycleId: number, actorUserId: number | null, o: {
  ngayTao?: string; daThiToiMt?: number; chiTao?: boolean;
} = {}): KetQuaLichMacDinh {
  return apLichMacDinhLo([{ cycleId, daThiToiMt: o.daThiToiMt }], actorUserId, o).get(cycleId) ?? { created: [], moved: [], kept: 0 };
}

/**
 * `apLichMacDinh` cho NHIỀU lộ trình (PR-TOC) — Thêm học viên, chuyển cả lớp. Cùng luật; phần TẠO ghi theo lô (một câu cho mọi lượt,
 * một câu cho mọi dòng kỹ năng, nhật ký lịch, hành trình, audit), nên số câu SQL không phụ thuộc số em. Phần DỜI (chỉ khi không
 * `chiTao` — Áp lịch / đổi tuần bắt đầu của MỘT lộ trình) vẫn đi từng lượt. Kết quả theo `cycleId`; lộ trình không đề xuất được
 * không có trong Map.
 *
 * Tạo sau dời không đổi kết quả: `kiemSoMtMoi` chỉ đọc số lượt, trạng thái và có điểm — thứ phần dời không chạm.
 */
export function apLichMacDinhLo(yc: readonly YeuCauLichMt[], actorUserId: number | null, o: {
  ngayTao?: string; chiTao?: boolean;
} = {}): Map<number, KetQuaLichMacDinh> {
  const conn = db();
  const kqs = new Map<number, KetQuaLichMacDinh>();
  const goi = goiYLo(yc);
  if (!goi.size) return kqs;
  const ngayTao = (o.ngayTao ?? demoToday()).slice(0, 10);
  const cycleIds = [...goi.keys()];
  const lopOf = new Map<number, number>();
  theoLo([...new Set([...goi.values()].map((g) => g.cy.student_id as number))], (lo, ph) => {
    const rows = conn.prepare(
      `SELECT student_id, class_id FROM enrollments WHERE student_id IN (${ph}) AND status='active' ORDER BY id DESC`).all(...lo) as any[];
    for (const r of rows) if (!lopOf.has(r.student_id)) lopOf.set(r.student_id, r.class_id);
  });

  return tx(() => {
    const dsOf = new Map<number, any[]>(cycleIds.map((id) => [id, []]));
    const daCo = new Set<number>();
    theoLo(cycleIds, (lo, ph) => {
      for (const a of conn.prepare(
        `SELECT a.id, a.cycle_id, a.attempt_no, a.status, a.plan_source, a.planned_period_id, a.created_at, ${CO_DIEM_SQL('a')} AS coDiem
           FROM assessment_attempts a WHERE a.cycle_id IN (${ph})`).all(...lo) as any[]) {
        dsOf.get(a.cycle_id)!.push(a); daCo.add(a.id);
      }
    });
    const moi: { cy: any; s: SuggestedMock; lichSu: boolean; kq: KetQuaLichMacDinh }[] = [];
    for (const [cycleId, { cy, goiY }] of goi) {
      const kq: KetQuaLichMacDinh = { created: [], moved: [], kept: 0 };
      kqs.set(cycleId, kq);
      const ds = dsOf.get(cycleId)!;
      for (const s of goiY) {
        const had = ds.find((x) => x.attempt_no === s.attemptNo);
        if (!had) {
          if (kiemSoMtMoi(ds.map((x) => ({ attempt_no: x.attempt_no, status: x.status, coDiem: !!x.coDiem })), s.attemptNo)) {
            kq.kept += 1; continue;
          }
          moi.push({ cy, s, lichSu: laMtCu(addDays(s.weekStart, 6), ngayTao), kq });
          ds.push({ id: 0, attempt_no: s.attemptNo, status: 'planned', plan_source: 'auto', planned_period_id: s.periodId, coDiem: 0 });
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
        /* Dời theo tuần bắt đầu → tính lại cờ MT cũ so với NGÀY XẾP (T1, PR-MTa). */
        tinhLaiMtCu(had.id, ngayTao);
        kq.moved.push({ attemptNo: s.attemptNo, weekStart: s.weekStart });
      }
    }

    if (moi.length) {
      const now = nowIso();
      chenNhieuDong(
        `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, plan_source, status,
                                          target_at_attempt, created_by, created_at, lich_su)`,
        moi.map(({ cy, s, lichSu }) => [cy.id, cy.student_id, s.attemptNo, 'mock', lopOf.get(cy.student_id) ?? null, s.periodId,
          'auto', 'planned', cy.target_score ?? null, actorUserId, now, lichSu ? 1 : 0]));
      /* INSERT nhiều dòng không trả id → đọc lại: lượt mới là lượt của các lộ trình này chưa có trước đó (cùng giao dịch). */
      const idOf = new Map<string, number>();
      theoLo([...new Set(moi.map((m) => m.cy.id as number))], (lo, ph) => {
        for (const a of conn.prepare(`SELECT id, cycle_id, attempt_no FROM assessment_attempts WHERE cycle_id IN (${ph})`).all(...lo) as any[]) {
          if (!daCo.has(a.id)) idOf.set(`${a.cycle_id}:${a.attempt_no}`, a.id);
        }
      });
      const ids = moi.map((m) => {
        const attemptId = idOf.get(`${m.cy.id}:${m.s.attemptNo}`)!;
        m.kq.created.push({ attemptId, attemptNo: m.s.attemptNo, weekStart: m.s.weekStart, lichSu: m.lichSu });
        return attemptId;
      });
      /*
       * = `ensureSkillRows` của lượt mới: bộ môn theo chương trình lớp của lượt (`boMonLich` — FT 4 kỹ năng, lớp thường theo môn,
       * PR-MON), tuần theo lượt; kỹ năng "không mock" của mô hình cũ → không bắt buộc. Một câu cho mỗi chương trình (thường 1).
       */
      const ctOf = new Map<number, string | null>();
      theoLo([...new Set([...lopOf.values()])], (lo, ph) => {
        for (const c of conn.prepare(`SELECT id, programme_code FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) ctOf.set(c.id, c.programme_code);
      });
      /* Mỗi chương trình tính bộ môn MỘT lần — `programmeByCode` đọc bảng mỗi lần gọi ngoài request GET. */
      const theoCt = new Map<string | null, { bo: readonly string[]; ids: number[] }>();
      moi.forEach((m, i) => {
        const lop = lopOf.get(m.cy.student_id);
        const ct = lop == null ? null : ctOf.get(lop) ?? null;
        if (!theoCt.has(ct)) theoCt.set(ct, { bo: boMonLich(ct, programmeByCode(ct)?.skills), ids: [] });
        theoCt.get(ct)!.ids.push(ids[i]);
      });
      for (const { bo, ids: dsId } of theoCt.values()) {
        const mon = bo.map((_, i) => `SELECT ? AS skill, ${i} AS thu`).join(' UNION ALL ');
        theoLo(dsId, (lo, ph) => {
          conn.prepare(
            `INSERT INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source, sit_status, created_at)
             SELECT a.id, k.skill,
                    CASE WHEN EXISTS (SELECT 1 FROM attempt_skill_skips x WHERE x.attempt_id = a.id AND x.skill = k.skill) THEN 0 ELSE 1 END,
                    a.planned_period_id, 'auto', 'scheduled', ?
               FROM assessment_attempts a CROSS JOIN (${mon}) k
              WHERE a.id IN (${ph}) ORDER BY a.id, k.thu`).run(now, ...bo, ...lo);   // thứ tự `?` trong câu: now, tên môn, lô
        }, THAM_SO_TOI_DA - bo.length - 1);   // tham số cố định: tên môn + `now`
      }
      chenNhieuDong(
        'INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)',
        moi.map((m, i) => [ids[i], 'created', 'planned_period', null, m.s.code, 'Lịch MT mặc định', actorUserId, now]));
    }

    /* Một dòng hành trình cho cả lộ trình, không một dòng mỗi lượt. */
    chenNhieuDong(
      'INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, detail, ref_table, ref_id, created_by, created_at)',
      [...kqs].filter(([, kq]) => kq.created.length).map(([cycleId, kq]) => [goi.get(cycleId)!.cy.student_id, cycleId, 'mock_scheduled', ngayTao,
        `Lịch MT mặc định · ${kq.created.map((x) => `MT${x.attemptNo} ${tuanLich(x.weekStart, ngayTao)}`).join(' · ')}`,
        kq.created.some((x) => x.lichSu) ? 'MT có tuần thi cách ≥ 2 tuần là MT cũ — nhập bù, không tính hạn' : null,
        'learning_cycles', cycleId, actorUserId, nowIso()]));
    chenNhieuDong(
      'INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, entity_label, before_json, after_json, created_at)',
      [...kqs].filter(([, kq]) => kq.created.length || kq.moved.length).map(([cycleId, kq]) => [actorUserId, 'schedule.autoplan',
        'learning_cycle', cycleId, null, null, JSON.stringify({ created: kq.created.length, moved: kq.moved.length, kept: kq.kept }), nowIso()]));
    return kqs;
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

// ==================================================================== lớp thường

export type ClassProgress = {
  programmeCode: ProgrammeCode | null;
  programmeName: string | null;
  /** Tổng số tuần của chương trình. NULL với lớp FT — FT không có số tuần cố định. */
  totalWeeks: number | null;
  /** Lớp đang ở tuần học mấy. NULL khi chưa khai tuần bắt đầu. */
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
   * `huong='chua_quyet'` (PR-K26, trước là `xep_sau`) với `ngay_xem_lai` còn ở tương lai. Badge/việc đỏ Hết khoá dùng số này.
   */
  canXepLop: number;
  /** Một dòng đọc được ngay, ví dụ "BE · tuần 5/10 · Progress Test tuần này". */
  label: string | null;
  /** K2-23: chương trình CÓ mốc Giữa khoá — Pre FOU chỉ Cuối khoá nên ô Giữa khoá ở panel Lịch kiểm tra ẩn. */
  coGiuaKhoa: boolean;
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
 * em đã ghi `huong='chua_quyet'` mà `ngay_xem_lai` còn ở tương lai — một câu, không N+1.
 */
const CLASS_ACTIVE_COUNT_SQL = `
  SELECT COUNT(*) n,
         SUM(CASE WHEN EXISTS (
           SELECT 1 FROM lo_trinh_tiep_theo lt
            WHERE lt.student_id = e.student_id AND lt.class_id = e.class_id
              AND lt.huong = 'chua_quyet' AND lt.ngay_xem_lai > ?
         ) OR EXISTS (
           SELECT 1 FROM lenh_chuyen_lop lc WHERE lc.student_id = e.student_id AND lc.trang_thai = 'cho'   -- PR-CT: em đã có quyết định chuyển lớp không còn "cần xếp lớp"
         ) THEN 0 ELSE 1 END) can_xep_lop
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
   WHERE e.class_id = ? AND e.status = 'active'
     AND ${HV_DANG_HOC_SQL('s')}`;

/**
 * TIẾN ĐỘ CỦA NHIỀU LỚP TRONG BA CÂU LỆNH — không phải ba câu MỖI LỚP.
 *
 * Danh sách lớp gọi hàm này cho cả trang. Bản đầu gọi `classProgress` trong vòng lặp và
 * biến một trang mười lớp thành tám mươi câu truy vấn; bài kiểm N+1 của vòng trước bắt
 * đúng chỗ đó. Ở quy mô demo thì không ai thấy chậm — ở quy mô thật thì thấy ngay.
 */
/** Phần tiến độ lớp mà `mocKetKhoa` cần (ClassProgress hoặc dòng tóm tắt lớp — cùng tên trường). */
export type TienDoMoc = { phase?: string | null; finalWeekStart?: string | null; startWeekStart?: string | null; totalWeeks?: number | null } | null | undefined;

/**
 * PR-S5F-a: lớp thường đã tới Cuối khoá chưa / đã hết khoá chưa — so HÔM NAY với tuần Cuối khoá và tuần kết thúc, KHÔNG theo chặng (Quản lý dời
 * Cuối khoá sớm thì các tuần giữa Cuối khoá và tuần kết thúc là chặng `running`, nhưng vẫn là lúc ra quyết định chuyển lớp). Dải, việc, đề xuất đọc chung.
 */
export function mocKetKhoa(pr: TienDoMoc, homNay: string) {
  const tuanKetThuc = pr?.startWeekStart && pr.totalWeeks ? addDays(pr.startWeekStart, (pr.totalWeeks - 1) * 7) : null;
  const thu2 = mondayOf(homNay);
  const hetKhoa = pr?.phase === 'finished' || (!!tuanKetThuc && thu2 >= tuanKetThuc);
  return { tuanCuoiKhoa: pr?.finalWeekStart ?? null, tuanKetThuc, hetKhoa, tuCuoiKhoa: hetKhoa || (!!pr?.finalWeekStart && thu2 >= pr.finalWeekStart) };
}

export function classProgressMany(classIds: number[]): Map<number, ClassProgress> {
  const out = new Map<number, ClassProgress>();
  if (!classIds.length) return out;
  const conn = db();
  /* PR-LCb (R-B2): theo lô — Turso nhận tối đa ~900 tham số một câu (ứng viên lớp chuyển đến mọi chi nhánh có thể vượt). */
  const classes: any[] = [];
  theoLo(classIds, (lo, ph) => { classes.push(...(conn.prepare(`SELECT * FROM classes WHERE id IN (${ph})`).all(...lo) as any[])); });
  const periodIds = [...new Set(classes.map((c) => c.start_period_id).filter(Boolean))];
  const periods = new Map<number, any>();
  theoLo(periodIds, (lo, ph) => {
    for (const r of conn.prepare(`SELECT * FROM report_periods WHERE id IN (${ph})`).all(...lo) as any[]) {
      periods.set(r.id, { id: r.id, ...weekInfo(r.week_start) });
    }
  });
  const counts = new Map<number, number>();
  const canXepByClass = new Map<number, number>();
  theoLo(classes.map((c) => c.id as number), (lo, ph) => { for (const r of conn
    .prepare(
      `SELECT e.class_id, COUNT(*) n,
              SUM(CASE WHEN EXISTS (
                SELECT 1 FROM lo_trinh_tiep_theo lt
                 WHERE lt.student_id = e.student_id AND lt.class_id = e.class_id
                   AND lt.huong = 'chua_quyet' AND lt.ngay_xem_lai > ?
              ) OR EXISTS (
                SELECT 1 FROM lenh_chuyen_lop lc WHERE lc.student_id = e.student_id AND lc.trang_thai = 'cho'
              ) THEN 0 ELSE 1 END) can_xep_lop
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${ph}) AND e.status = 'active'
          AND ${HV_DANG_HOC_SQL('s')}
        GROUP BY e.class_id`,
    )
    .all(demoToday(), ...lo) as any[]) {
    counts.set(r.class_id, r.n);
    canXepByClass.set(r.class_id, r.can_xep_lop ?? 0);
  } }, THAM_SO_TOI_DA - 1);

  const progs = allProgrammes();   // nhớ trong request (`nho`) — PR-Dọn Q22: bỏ tham số truyền tay
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
   * CHẶNG CỦA LỚP — owner yêu cầu 13/09/2026: lớp thường phải TỰ BÁO khi đang trong tuần
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
    coGiuaKhoa: defProgress !== null || c.progress_week_override !== null && c.progress_week_override !== undefined,
  };
}

/**
 * TÓM TẮT MT CỦA MỘT LỚP FT (PR-HVL, K2-22) — dòng `8 em · 6 em có MT sắp tới · 2 em đã xong MT cuối` ở panel Tuần khai giảng. MỘT câu SQL:
 * "MT sắp tới" cùng luật `MOC_KE_TIEP_SQL` (mốc kế tiếp, không lịch sử, từ tuần này); "đã xong MT cuối" = đã có lượt MT có điểm ở số thứ tự
 * ≥ số MT của lịch mặc định của lộ trình (LT: 3, RF: 2 — `lichMtMacDinh`), tính cả MT lịch sử.
 */
export function tomTatMt(classId: number): { soEm: number; coMocSapToi: number; daXongMtCuoi: number } {
  const r = db().prepare(
    `SELECT COUNT(*) AS n, SUM(co_moc) AS co_moc, SUM(xong) AS xong FROM (
       SELECT s.id,
              MAX(CASE WHEN ${CO_MOC_KE_TIEP_SQL('cy')} THEN 1 ELSE 0 END) AS co_moc,
              MAX(CASE WHEN ${XONG_MT_CUOI_SQL('cy')} THEN 1 ELSE 0 END) AS xong
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}
        GROUP BY s.id)`,
  ).get(mondayOf(demoToday()), classId) as any;
  return { soEm: r?.n ?? 0, coMocSapToi: r?.co_moc ?? 0, daXongMtCuoi: r?.xong ?? 0 };
}

/**
 * HAI ĐIỀU KIỆN CỦA `tomTatMt`, tách thành hằng SQL để chỉ số `hv-ft-xong-mt-cuoi-chua-mt-ke` (PR-VAI-a Q8c) dùng ĐÚNG luật này.
 *   CO_MOC_KE_TIEP  — lộ trình có lượt mốc kế tiếp (`MOC_KE_TIEP_SQL`), MỘT tham số `?` = thứ Hai tuần này.
 *   XONG_MT_CUOI    — đã có lượt MT có điểm ở số thứ tự ≥ số MT của lịch mặc định (LT: 3, RF: 2), tính cả MT lịch sử. Không tham số.
 */
export const CO_MOC_KE_TIEP_SQL = (cy: string) => `EXISTS (SELECT 1 FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
  WHERE a.cycle_id = ${cy}.id AND ${MOC_KE_TIEP_SQL('a', 'rp')})`;
export const XONG_MT_CUOI_SQL = (cy: string) => `EXISTS (SELECT 1 FROM assessment_attempts a2 WHERE a2.cycle_id = ${cy}.id AND a2.kind = 'mock'
  AND a2.attempt_no >= (CASE WHEN ${cy}.route = 'RF' THEN ${lichMtMacDinh('RF').length} ELSE ${lichMtMacDinh('LT1').length} END) AND ${CO_DIEM_SQL('a2')})`;

/**
 * PR-LTGON (luật 6): đổi mốc Progress/Final của lớp → bài chưa có điểm của các em đang học dời theo, không hỏi. Chỉ kỹ năng đang ở ĐÚNG tuần mốc cũ
 * (đã dời tay / dời do vắng thì giữ), của bài chưa có điểm và chưa kỹ năng nào đã thi; bài đó giữ nguyên cả bài. Ghi `attempt_schedule_history` một câu cho cả lớp. Số câu SQL không phụ thuộc số em. Final: MT0 chưa thi đi theo.
 */
function doiBaiTheoMoc(p: Principal, classId: number, kind: 'progress' | 'final', tuCu: string, sangMoi: string) {
  const conn = db();
  const cu = ensurePeriods([tuCu]).get(tuCu)!, moi = ensurePeriods([sangMoi]).get(sangMoi)!;
  const now = nowIso();
  /* Bài của các em ĐANG học lớp, chưa có điểm và chưa kỹ năng nào "đã thi" (đã thi = chờ chấm, coi như có điểm) → cả bài giữ nguyên nếu không thoả. */
  const cua = `SELECT a.id FROM assessment_attempts a JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
                WHERE a.class_id = ? AND a.kind = ? AND a.status != 'cancelled'
                  AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))
                  AND NOT EXISTS (SELECT 1 FROM attempt_skills s2 WHERE s2.attempt_id = a.id AND s2.sit_status = 'sat')`;
  const dangOCu = `EXISTS (SELECT 1 FROM attempt_skills k0 WHERE k0.attempt_id = a.id AND k0.planned_period_id = ? AND k0.sit_status != 'cancelled')`;
  conn.prepare(
    `INSERT INTO attempt_schedule_history (attempt_id, action, field, old_value, new_value, reason, actor_user_id, created_at)
     SELECT a.id, 'week_set', 'planned_period', ?, ?, 'Đổi mốc ' || ? || ' của lớp', ?, ?
       FROM assessment_attempts a WHERE a.id IN (${cua}) AND ${dangOCu}`,
  ).run(cu.code, moi.code, kind === 'final' ? 'Final' : 'Progress', p.userId, now, classId, kind, cu.id);
  const soKn = (conn.prepare(
    `UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'auto', updated_at = ?
      WHERE attempt_id IN (${cua}) AND planned_period_id = ? AND sit_status != 'cancelled'`,
  ).run(moi.id, now, classId, kind, cu.id) as any).changes ?? 0;
  /* Tuần của bài = tuần muộn nhất của kỹ năng bắt buộc (như `recomputeCompletionWeek`) — tính lại cho MỌI bài trong `cua`, kể cả bài có kỹ năng đã dời do vắng. */
  conn.prepare(
    `UPDATE assessment_attempts SET updated_at = ?, planned_period_id = COALESCE((
       SELECT k.planned_period_id FROM attempt_skills k JOIN report_periods pr ON pr.id = k.planned_period_id
        WHERE k.attempt_id = assessment_attempts.id AND k.required = 1 AND k.sit_status != 'cancelled' ORDER BY pr.week_start DESC LIMIT 1), planned_period_id)
      WHERE id IN (${cua})`,
  ).run(now, classId, kind);
  if (kind === 'final') {
    /* MT0 chưa thi, chưa ai dời tay → tuần ĐẦU của Final cùng khoá (như `mt0TheoFinal`). */
    const dich = (cy: string) => `(SELECT k.planned_period_id FROM assessment_attempts f JOIN attempt_skills k ON k.attempt_id = f.id AND k.required = 1 AND k.sit_status != 'cancelled'
                                     JOIN report_periods pr ON pr.id = k.planned_period_id
                                    WHERE f.cycle_id = ${cy} AND f.kind = 'final' AND f.class_id = ? AND f.status != 'cancelled' ORDER BY pr.week_start LIMIT 1)`;
    const mt0 = `SELECT m.id FROM assessment_attempts m
                  WHERE m.kind = 'mt0' AND m.status = 'planned' AND m.cycle_id IN (SELECT cycle_id FROM assessment_attempts WHERE class_id = ? AND kind = 'final' AND status != 'cancelled')
                    AND NOT EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = m.id AND k.plan_source != 'auto')
                    AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = m.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))`;
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = COALESCE(${dich('(SELECT cycle_id FROM assessment_attempts WHERE id = attempt_skills.attempt_id)')}, planned_period_id), updated_at = ? WHERE attempt_id IN (${mt0})`)
      .run(classId, now, classId);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = COALESCE(${dich('assessment_attempts.cycle_id')}, planned_period_id), updated_at = ? WHERE id IN (${mt0})`)
      .run(classId, now, classId);
  }
  writeAudit({ actorUserId: p.userId, action: 'class.progress.doi_bai', entityType: 'class', entityId: classId, entityLabel: kind,
    before: { week: cu.code }, after: { week: moi.code, kyNang: soKn } });
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
  const progress = 'progressWeek' in input ? checkWeek(input.progressWeek, 'Tuần Progress Test') : undefined;
  const final = 'finalWeek' in input ? checkWeek(input.finalWeek, 'Tuần Final Test') : undefined;
  if (progress && c.so_tuan !== null && c.so_tuan !== undefined && (c.tuan_giua_khoa === null || c.tuan_giua_khoa === undefined)) {
    throw badRequest('Chương trình này không có bài Progress Test.');
  }
  if (progress !== undefined && final !== undefined && progress && final && progress >= final) {
    throw badRequest('Progress Test phải ở trước Final Test.');
  }
  if (input.startPeriodId && !periodById(input.startPeriodId)) throw badRequest('Tuần bắt đầu không hợp lệ.');

  const sets: string[] = []; const params: unknown[] = [];
  if ('startPeriodId' in input) { sets.push('start_period_id = ?'); params.push(input.startPeriodId ?? null); }
  if (progress !== undefined) { sets.push('progress_week_override = ?'); params.push(progress); }
  if (final !== undefined) { sets.push('final_week_override = ?'); params.push(final); }
  if (!sets.length) return classProgress(classId);

  params.push(classId);
  const cu = classProgress(classId);
  tx(() => {
    conn.prepare(`UPDATE classes SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    const moi = classProgress(classId);
    if (moi.progressWeekStart && moi.finalWeekStart && moi.progressWeekStart >= moi.finalWeekStart) {
      throw badRequest('Progress Test phải ở trước Final Test.');   // tx cuộn lại, không dời gì
    }
    for (const [kind, tuCu, sangMoi] of [['progress', cu.progressWeekStart, moi.progressWeekStart], ['final', cu.finalWeekStart, moi.finalWeekStart]] as const) {
      if (tuCu && sangMoi && tuCu !== sangMoi) doiBaiTheoMoc(p, classId, kind, tuCu, sangMoi);
    }
  });
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
 * Lớp thường KHÔNG bị nhắc tháng thi: các em đó chưa thi IELTS, nhắc là nhắc sai.
 */
export function missingForStudent(input: {
  cycle: {
    start_period_id?: number | null; exam_month?: string | null; target_score?: number | null;
    /** Q29-1: Target KCK = đã chọn không cam kết — không phải "thiếu target". */
    khong_cam_ket?: number | null;
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
    if ((input.cycle?.target_score === null || input.cycle?.target_score === undefined) && !input.cycle?.khong_cam_ket) out.push(miss('target'));
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
export function missingForClasses(classIds: number[]): Map<number, { items: MissingInfo[]; missingSkills: string[] }> {
  const out = new Map<number, { items: MissingInfo[]; missingSkills: string[] }>();
  if (!classIds.length) return out;
  const conn = db();
  const ph = classIds.map(() => '?').join(',');

  const classes = conn.prepare(`SELECT * FROM classes WHERE id IN (${ph})`).all(...classIds) as any[];
  let programmes: Map<string, ProgrammeInfo> | undefined;   // nạp một lần, chỉ khi có lớp cần
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
