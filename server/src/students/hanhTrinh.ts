import { db } from '../db.ts';
import {
  CASE_CATEGORY_LABEL, INTERVENTION_KIND_LABEL, PERMISSIONS, caseCategoriesFor, caseTitle, type CaseCategory,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { require_, type Principal } from '../permissions.ts';
import { cyclesOf } from '../fasttrack/cycles.ts';
import { isRatioCycle, programmeByCode, programmeCodeOfCycle } from '../normal/regular.ts';
import { typedResult } from './profile.ts';
import { addDays } from '../util.ts';

/**
 * MÁY CHỦ CỦA TAB HÀNH TRÌNH (PR-Qb, spec §3.8, plan Task 2) — trả dữ liệu THÔ theo giai đoạn; mọi
 * nhãn, màu, tầng đều tính ở `shared/domain/hanhTrinh.ts` bên nhận (web gọi lại đúng các hàm đó).
 *
 * NGÂN SÁCH TRUY VẤN: 6 câu cố định (không phụ thuộc số Case) — `cyclesOf`, lượt đánh giá (JOIN
 * tuần + lớp), điểm các lượt (một câu IN), case, phương án, lần xem lại có kết quả — CỘNG mỗi lượt
 * một lần gọi `typedResult` (đã tự query điểm/kỳ vọng của riêng lượt đó, chấp nhận theo đúng kế
 * hoạch) và mỗi LỘ TRÌNH lớp thường một câu tra tuần bắt đầu để tính tuần kết thúc chương trình
 * (số lộ trình luôn nhỏ, không phụ thuộc số Case).
 */

type GiaiDoanLoai = 'thuong' | 'ft';

const nhanLoTrinh = (c: any): string => {
  if (c.route) return c.route;
  const prog = programmeByCode(c.programme_code) ?? programmeByCode(programmeCodeOfCycle(c.id));
  return prog ? prog.name : `Lộ trình ${c.seq}`;
};

/** Hạng mục case ↔ hộp kỹ năng đang xem: writing1/2 ghép vào "writing" khi hộp là lớp thường, ngược lại bỏ. */
function anhXaHangMuc(category: string | null, boHop: readonly CaseCategory[]): CaseCategory | null {
  if (!category) return null;
  if ((boHop as readonly string[]).includes(category)) return category as CaseCategory;
  if ((category === 'writing1' || category === 'writing2') && boHop.includes('writing')) return 'writing';
  return null;
}

function tuanCuoiChuongTrinh(conn: any, cycle: any): string | null {
  if (!cycle.start_period_id) return null;
  const tpl = programmeByCode(cycle.programme_code ?? programmeCodeOfCycle(cycle.id));
  if (!tpl?.weeks) return null;
  const start = conn.prepare('SELECT week_start FROM report_periods WHERE id = ?').get(cycle.start_period_id) as any;
  if (!start?.week_start) return null;
  return addDays(start.week_start, (tpl.weeks - 1) * 7);
}

export function hanhTrinhHocVien(p: Principal, studentId: number, giaiDoanMuon: GiaiDoanLoai | null) {
  const conn = db();
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  const homNay = demoToday();

  // -------------------------------------------------------------- (1) lộ trình + giai đoạn
  const cycles = cyclesOf(studentId);
  const ratioOf = new Map<number, boolean>();
  for (const c of cycles) ratioOf.set(c.id, isRatioCycle(c));

  const thuongCycles = cycles.filter((c) => ratioOf.get(c.id));
  const ftCycles = cycles.filter((c) => !ratioOf.get(c.id));
  const dungGiaiDoan = (list: any[]): { tu: string; den: string | null } | null => {
    if (!list.length) return null;
    const sorted = [...list].sort((a, b) => a.started_at.localeCompare(b.started_at));
    const cuoi = sorted[sorted.length - 1];
    return { tu: sorted[0].started_at, den: cuoi.ended_at ?? null };
  };
  const cacGiaiDoan: { loai: GiaiDoanLoai; tu: string; den: string | null }[] = [];
  const khoangThuong = dungGiaiDoan(thuongCycles);
  if (khoangThuong) cacGiaiDoan.push({ loai: 'thuong', ...khoangThuong });
  const khoangFt = dungGiaiDoan(ftCycles);
  if (khoangFt) cacGiaiDoan.push({ loai: 'ft', ...khoangFt });

  if (!cycles.length) {
    return { giaiDoan: null, cacGiaiDoan: [], homNay, doan: [], ghim: [], hop: [] };
  }

  const current = [...cycles].sort((a, b) => {
    const activeA = a.status === 'active' ? 0 : 1;
    const activeB = b.status === 'active' ? 0 : 1;
    return activeA !== activeB ? activeA - activeB : b.seq - a.seq;
  })[0];
  const giaiDoan: GiaiDoanLoai = giaiDoanMuon ?? (ratioOf.get(current.id) ? 'thuong' : 'ft');
  const chonCycles = (giaiDoan === 'thuong' ? thuongCycles : ftCycles).slice()
    .sort((a, b) => a.started_at.localeCompare(b.started_at));
  const ratio = giaiDoan === 'thuong';

  if (!chonCycles.length) {
    return { giaiDoan, cacGiaiDoan, homNay, doan: [], ghim: [], hop: [] };
  }
  const cycleIds = chonCycles.map((c) => c.id);

  // -------------------------------------------------------------- (2) lượt đánh giá
  const attemptRows = conn
    .prepare(
      `SELECT a.*, c.code AS class_code, pr.week_start AS week_start
         FROM assessment_attempts a
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.cycle_id IN (${cycleIds.map(() => '?').join(',')}) AND a.status != 'cancelled'
        ORDER BY a.cycle_id, a.attempt_no`,
    )
    .all(...cycleIds) as any[];
  const attemptIds = attemptRows.map((a) => a.id);

  // -------------------------------------------------------------- (3) điểm các lượt (bulk, entry-level cho FT)
  const scoresByAttempt = new Map<number, { skill: string; band: number | null }[]>();
  if (attemptIds.length) {
    for (const r of conn
      .prepare(`SELECT attempt_id, skill, band FROM assessment_scores WHERE attempt_id IN (${attemptIds.map(() => '?').join(',')})`)
      .all(...attemptIds) as any[]) {
      const list = scoresByAttempt.get(r.attempt_id) ?? [];
      list.push({ skill: r.skill, band: r.band });
      scoresByAttempt.set(r.attempt_id, list);
    }
  }

  const typed = new Map<number, ReturnType<typeof typedResult>>();
  for (const a of attemptRows) typed.set(a.id, typedResult(a));

  // -------------------------------------------------------------- (4) case
  const caseRows = conn
    .prepare(
      `SELECT sc.*, a.attempt_no AS attempt_no, a.kind AS attempt_kind
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE sc.student_id = ?`,
    )
    .all(studentId) as any[];
  const casesInGiaiDoan = caseRows.filter((c) => {
    if (c.cycle_id != null) return cycleIds.includes(c.cycle_id);
    if (!c.detected_at) return false;
    const kh = giaiDoan === 'thuong' ? khoangThuong : khoangFt;
    if (!kh) return false;
    if (c.detected_at < kh.tu) return false;
    if (kh.den && c.detected_at > kh.den) return false;
    return true;
  });
  const caseIds = casesInGiaiDoan.map((c) => c.id);

  // -------------------------------------------------------------- (5) phương án
  const ivRows = caseIds.length
    ? conn
      .prepare(`SELECT * FROM case_interventions WHERE case_id IN (${caseIds.map(() => '?').join(',')}) AND status != 'cancelled'`)
      .all(...caseIds) as any[]
    : [];
  const ivByCase = new Map<number, any[]>();
  for (const iv of ivRows) {
    const list = ivByCase.get(iv.case_id) ?? [];
    list.push(iv);
    ivByCase.set(iv.case_id, list);
  }
  const noiTiepTuOf = new Map<number, number>();
  for (const iv of ivRows) if (iv.superseded_by != null) noiTiepTuOf.set(iv.superseded_by, iv.id);

  // -------------------------------------------------------------- (6) lần xem lại có kết quả (mới nhất mỗi PA)
  const lastOutcomeOf = new Map<number, string>();
  if (caseIds.length) {
    const rows = conn
      .prepare(
        `SELECT intervention_id, outcome, observed_on, id FROM case_followups
          WHERE outcome IS NOT NULL AND case_id IN (${caseIds.map(() => '?').join(',')})
          ORDER BY observed_on, id`,
      )
      .all(...caseIds) as any[];
    for (const r of rows) if (r.intervention_id != null) lastOutcomeOf.set(r.intervention_id, r.outcome);
  }

  // -------------------------------------------------------------- doan (khoá / lộ trình)
  const doan: { loai: 'khoa' | 'lo-trinh'; nhan: string; tu: string; den: string }[] = [];
  if (ratio) {
    for (const c of chonCycles) {
      const attemptsOfCycle = attemptRows.filter((a) => a.cycle_id === c.id);
      const maLop = attemptsOfCycle[attemptsOfCycle.length - 1]?.class_code
        ?? programmeByCode(c.programme_code ?? programmeCodeOfCycle(c.id))?.name ?? '—';
      const den = c.ended_at ?? tuanCuoiChuongTrinh(conn, c) ?? homNay;
      // +1: đếm TRỌN tuần chứa `tu` VÀ tuần chứa `den` — hiệu hai mốc chỉ ra số tuần ĐÃ TRÔI QUA
      // giữa hai tuần đó, thiếu tuần đầu (sửa sau rà #75, vấn đề 7: khoá W8/8 hiện sai "7 tuần").
      const soTuan = Math.max(1, Math.round((Date.parse(den) - Date.parse(c.started_at)) / (7 * 86_400_000)) + 1);
      doan.push({ loai: 'khoa', nhan: `${maLop} · ${soTuan} tuần`, tu: c.started_at, den });
    }
  } else if (chonCycles.length >= 2) {
    for (const c of chonCycles) doan.push({ loai: 'lo-trinh', nhan: nhanLoTrinh(c), tu: c.started_at, den: c.ended_at ?? homNay });
  }

  // -------------------------------------------------------------- ghim (đợt Test trên trục)
  const ghim = attemptRows
    .filter((a) => a.week_start)
    .map((a) => {
      const t = typed.get(a.id)!;
      if (t.mode === 'ratio') {
        const r = t.ratio!;
        const soDat = r.skills.filter((s) => s.outcome === 'pass').length;
        return {
          attemptId: a.id, tuan: a.week_start,
          cheDo: 'ratio' as const, attemptNo: a.attempt_no, kind: a.kind,
          overall: null, sosLevel: r.sosLevel, soDat, soYeuCau: r.required, soCoDiem: r.scored,
        };
      }
      const r = t.ft!;
      return {
        attemptId: a.id, tuan: a.week_start,
        cheDo: 'ielts' as const, attemptNo: a.attempt_no, kind: a.kind,
        overall: r.overall, sosLevel: r.sosLevel, soDat: null, soYeuCau: r.required.length, soCoDiem: r.scoredRequired,
      };
    });

  // -------------------------------------------------------------- hop (hộp kỹ năng)
  const boHop = caseCategoriesFor(ratio ? 'ratio' : 'ielts_band');
  const hop = boHop.map((kyNang) => {
    const diem: { gt: number; tong?: number | null; chuaDat: boolean }[] = [];
    let conCho = false;
    for (const a of attemptRows) {
      const t = typed.get(a.id)!;
      if (t.mode === 'ratio') {
        const s = t.ratio!.skills.find((x) => x.skill === kyNang);
        if (!s) continue;
        if (s.score === null) { if (a.status === 'planned') conCho = true; continue; }
        diem.push({ gt: s.score, tong: s.total, chuaDat: s.outcome === 'fail' });
      } else {
        const band = scoresByAttempt.get(a.id)?.find((x) => x.skill === kyNang)?.band ?? null;
        if (band === null) { if (a.status === 'planned') conCho = true; continue; }
        const exp = t.ft!.expectation;
        diem.push({ gt: band, tong: null, chuaDat: exp !== null && band < exp });
      }
    }
    const diemCuoiChuaDat = diem.length ? diem[diem.length - 1].chuaDat : null;

    const casesOfSkill = casesInGiaiDoan.filter((c) => anhXaHangMuc(c.category ?? c.topic, boHop) === kyNang);
    const openCases = casesOfSkill.filter((c) => c.status !== 'done');
    const doneCases = casesOfSkill.filter((c) => c.status === 'done');
    const caseMo = openCases.map((c) => ({ mo: c.detected_at, soPa: (ivByCase.get(c.id) ?? []).length }));
    const coTungCase = casesOfSkill.length > 0;
    const xongGanNhat = !openCases.length && doneCases.length
      ? doneCases.reduce((mx: string | null, c) => {
        const d = c.closed_at ?? c.outcome_at ?? c.detected_at;
        return d && (!mx || d > mx) ? d : mx;
      }, null as string | null)
      : null;

    const vanDe = casesOfSkill.map((c) => {
      const pa = (ivByCase.get(c.id) ?? []).map((iv) => ({
        id: iv.id,
        ten: caseInterventionLabel(iv.kind),
        tu: iv.started_date ?? iv.planned_date,
        den: iv.completed_date ?? null,
        status: iv.status,
        lastOutcome: lastOutcomeOf.get(iv.id) ?? null,
        followupOverdue: iv.status !== 'completed' && !!iv.action_due && iv.action_due < homNay,
        supersededBy: iv.superseded_by ?? null,
        noiTiepTu: noiTiepTuOf.get(iv.id) ?? null,
      }));
      return {
        caseId: c.id,
        // Tên người tạo đặt thắng tên suy ra (như caseTitleOf, server/src/cases/cases.ts:58); lớp
        // thường không mượn "… dưới kỳ vọng" của Fast Track — chấm theo môn đạt/chưa đạt, không có kỳ vọng band.
        ten: (c.title ?? '').trim() || (ratio
          ? `${CASE_CATEGORY_LABEL[(c.category ?? c.topic) as CaseCategory] ?? (c.category ?? c.topic ?? '')} chưa đạt`
          : caseTitle({ category: c.category ?? c.topic, latestAttemptNo: c.attempt_no, latestAttemptKind: c.attempt_kind })),
        mo: c.detected_at, dong: c.status === 'done' ? (c.closed_at ?? c.outcome_at ?? null) : null,
        soPa: pa.length, pa,
      };
    });

    return {
      kyNang, nhan: CASE_CATEGORY_LABEL[kyNang], cheDo: ratio ? ('ratio' as const) : ('ielts' as const),
      diem, conCho, caseMo, coTungCase, diemCuoiChuaDat, xongGanNhat, vanDe,
    };
  });

  return { giaiDoan, cacGiaiDoan, homNay, doan, ghim, hop };
}

function caseInterventionLabel(kind: string): string {
  return (INTERVENTION_KIND_LABEL as Record<string, string>)[kind] ?? kind;
}
