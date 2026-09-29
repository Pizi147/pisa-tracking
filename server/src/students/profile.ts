import { db } from '../db.ts';
import {
  ASSESSED_SKILLS, BASELINE_SOURCE_LABEL, CYCLE_OUTCOME_LABEL, ENTRY_SKILLS,
  ASSESSED_SKILL_LABEL, INTERVENTION_KIND_LABEL, JOURNEY_GROUP, PERMISSIONS,
  caseHeadline, issueLabel, caseCategoryLabel, categoryOf, mocKeTiep, quaHan, studyWeekOf,
  type AssessedSkill, type EntrySkill, type InterventionKind,
} from '../../../shared/domain/index.ts';
import { outcomeGroup } from '../cases/effectiveness.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, diffDays, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { entryBandsOf, routeCuaLuot, scoresOf, skipsOf } from '../fasttrack/attempts.ts';
import { assessedBands, evaluateAttempt } from '../fasttrack/scoring.ts';
import { evaluateRegular, isRatioCycle, programmeByCode, programmeCodeOfCycle, programmeOfClass } from '../normal/regular.ts';
import { cycleById, cyclesOf, currentCycle, examPlanOf, targetRevisions } from '../fasttrack/cycles.ts';
import { parseMetrics, skillSupportBoard } from '../cases/cases.ts';
import { standingFor, standingLine } from './standing.ts';
import { luotSinhViecRow } from '../worklist/danhGia.ts';
import { missingForStudent, suggestedMockWeeks } from '../classes/schedule.ts';
import { lopHocCua } from '../classes/loTrinhTiep.ts';
import { listSignals } from '../cases/signals.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { activeClassOf, canManageDiscipline } from '../yThuc/access.ts';

/**
 * HỒ SƠ HỌC VIÊN — phần trả lời câu hỏi "em này đang thế nào" trong khoảng ba mươi giây.
 *
 * Mọi con số ở đây đều SUY RA từ dữ liệu đã có, không có ô nào để gõ tay. Người dùng không
 * bao giờ phải tự nhập "mức tiến bộ" hay "mức rủi ro" — nhập tay thì hai tháng sau không
 * ai biết con số đó dựa trên cái gì.
 *
 * Ba nguyên tắc xuyên suốt:
 *   1. THIẾU CĂN CỨ THÌ GHI "CHƯA RÕ", không dựng số thay thế.
 *   2. MỌI SO SÁNH PHẢI CÙNG THANG VÀ CÙNG LỘ TRÌNH. Điểm lộ trình trước không nói gì
 *      về mục tiêu lộ trình sau.
 *   3. KHÔNG DỰNG NHÃN TỔNG HỢP kiểu "đang ổn / có nguy cơ" khi chưa có quy tắc được
 *      chốt. Chỉ nói hai điều tách bạch: SO VỚI CHECKPOINT và CẦN CHÚ Ý.
 */

type SkillPoint = {
  kind: 'baseline' | 'official' | 'checkin';
  label: string;
  /** Mã tuần của lượt MT, ví dụ "W2 SEP 2026". Điểm đầu vào thì không có tuần. */
  week: string | null;
  band: number | null;
  detail: string | null;
};

function cycleLabel(c: any): string {
  if (c.route) return c.route;
  const prog = programmeByCode(c.programme_code)
    ?? (isRatioCycle(c) ? programmeByCode(programmeCodeOfCycle(c.id)) : null);
  return prog ? prog.name : `Lộ trình ${c.seq}`;
}


/**
 * Kết luận một lượt đánh giá bằng ĐÚNG bộ máy của loại lớp đó.
 *
 * Lớp Normal chấm theo tỷ lệ điểm đạt/tổng điểm, không có band và không có mục tiêu IELTS. Đưa
 * lượt của lớp thường qua bộ máy FT thì mọi kỹ năng đều "chưa có band" và hồ sơ hiện ra
 * một bảng trống — sai mà trông như thiếu dữ liệu.
 */
/** `pre`: danh sách gọi cho NHIỀU lượt nạp sẵn điểm / phạm vi / chương trình bằng vài câu (không hỏi lại theo từng lượt). */
export function typedResult(attempt: any, pre?: { scores: any[]; skips: AssessedSkill[]; prog: ReturnType<typeof programmeOfClass> }) {
  const prog = pre ? pre.prog : attempt.class_id ? programmeOfClass(attempt.class_id) : null;
  if (prog?.scoringMode === 'ratio') {
    const rows = pre?.scores ?? db().prepare('SELECT skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id = ?')
      .all(attempt.id) as any[];
    const r = evaluateRegular(prog.skills, rows);
    return { mode: 'ratio' as const, ratio: r, ft: null };
  }
  const r = evaluateAttempt(attempt.target_at_attempt, attempt.attempt_no,
    entryBandsOf(pre?.scores ?? scoresOf(attempt.id)), pre?.skips ?? skipsOf(attempt.id), routeCuaLuot(attempt));
  return { mode: 'ielts' as const, ratio: null, ft: r };
}

/**
 * ĐIỂM HIỆN TẠI theo TỪNG KỸ NĂNG.
 *
 * Cố tình KHÔNG ghép bốn kỹ năng mới nhất từ bốn lượt khác nhau thành một Overall: bốn
 * con số của bốn buổi khác nhau cộng lại không phải là một bài thi. Overall chỉ có khi
 * một lượt duy nhất có đủ bốn kỹ năng.
 */
function currentBands(attempts: any[]) {
  const per: Partial<Record<AssessedSkill, { band: number; attemptNo: number; week: string | null }>> = {};
  for (const a of attempts) {
    if (a.status === 'cancelled') continue;
    const bands = assessedBands(entryBandsOf(scoresOf(a.id)));
    for (const s of ASSESSED_SKILLS) {
      if (per[s]) continue;                              // đã có lượt mới hơn
      const b = bands[s];
      if (b === null || b === undefined) continue;
      per[s] = { band: b, attemptNo: a.attempt_no, week: a.period_code ?? null };
    }
  }
  return per;
}

/**
 * VỊ TRÍ SO VỚI CHECKPOINT — dựa trên kỳ vọng ĐÃ CHỐT của chính lượt đó, không nội suy
 * theo tuần. "Tuần này lẽ ra phải được 6.0" là một con số bịa; kỳ vọng chỉ tồn tại ở
 * đúng các mốc MT.
 */
function checkpointView(attempts: any[]) {
  for (const a of attempts) {
    if (a.status === 'cancelled') continue;
    const t = typedResult(a);
    if (t.mode === 'ratio') {
      const r = t.ratio!;
      if (r.failedCount === null) continue;
      return {
        attemptNo: a.attempt_no, kind: a.kind, mode: 'ratio' as const,
        week: a.period_code ?? null,
        coverage: `${r.scored}/${r.required}`,
        provisional: r.provisional,
        status: r.failedCount === 0 ? 'met' : 'below',
        expectation: null,
        skills: r.skills.map((s) => ({
          skill: s.skill, label: s.label, band: null, ratio: s.ratio,
          score: s.score, total: s.total,
          verdict: s.outcome === 'missing' ? null : s.outcome === 'pass',
        })),
      };
    }
    const r = t.ft!;
    if (r.sosLevel === null) {
      // Đủ điểm mà thiếu mục tiêu là một tình trạng RIÊNG, phải nói ra chứ không im lặng.
      if (r.complete && r.expectation === null) {
        return {
          attemptNo: a.attempt_no, kind: a.kind, mode: 'ielts' as const,
          week: a.period_code ?? null,
          coverage: `${r.scoredRequired}/${r.required.length}`,
          provisional: false, status: 'no_target' as const, expectation: null,
          skills: ASSESSED_SKILLS.map((s) => ({
            skill: s, label: ASSESSED_SKILL_LABEL[s], band: r.bands[s], ratio: null,
            score: null, total: null, verdict: null,
          })),
        };
      }
      continue;
    }
    const required = r.verdicts.filter((v) => v.required && v.band !== null);
    const allAbove = required.length > 0 && required.every((v) => v.band !== null && r.expectation !== null && v.band > r.expectation);
    return {
      attemptNo: a.attempt_no, kind: a.kind, mode: 'ielts' as const,
      week: a.period_code ?? null,
      coverage: `${r.scoredRequired}/${r.required.length}`,
      provisional: r.provisional,
      status: r.failedCount === 0 ? (allAbove ? 'above' : 'met') : 'below',
      expectation: r.expectation,
      skills: ASSESSED_SKILLS.map((s) => {
        const v = r.verdicts.find((x) => x.skill === s)!;
        return {
          skill: s, label: ASSESSED_SKILL_LABEL[s], band: v.band, ratio: null,
          score: null, total: null, verdict: v.passed,
        };
      }),
    };
  }
  return null;
}

/**
 * GOM SỰ KIỆN THÀNH CHƯƠNG.
 *
 * Hành trình đọc theo dòng thời gian phẳng thì mỗi lần ghi nhận là một dòng, và một vấn
 * đề được theo dõi ba tháng biến thành mười lăm dòng rời rạc. Gom lại: mọi việc quanh
 * MỘT vấn đề nằm chung một chương, mọi ghi nhận trong MỘT tuần nằm chung một chương.
 */
function episodesOf(rows: any[]) {
  const conn = db();
  const caseOfIntervention = new Map<number, number>();
  const caseOfFollowup = new Map<number, number>();
  const ivIds = rows.filter((r) => r.ref_table === 'case_interventions').map((r) => r.ref_id);
  const fuIds = rows.filter((r) => r.ref_table === 'case_followups').map((r) => r.ref_id);
  if (ivIds.length) {
    for (const r of conn.prepare(`SELECT id, case_id FROM case_interventions WHERE id IN (${ivIds.map(() => '?').join(',')})`)
      .all(...ivIds) as any[]) caseOfIntervention.set(r.id, r.case_id);
  }
  if (fuIds.length) {
    for (const r of conn.prepare(`SELECT id, case_id FROM case_followups WHERE id IN (${fuIds.map(() => '?').join(',')})`)
      .all(...fuIds) as any[]) caseOfFollowup.set(r.id, r.case_id);
  }

  const keyOf = (e: any): { key: string; kind: string; link: string | null } => {
    if (e.ref_table === 'sos_cases' && e.ref_id) {
      return { key: `case:${e.ref_id}`, kind: 'case', link: `/hoc-thuat/case/${e.ref_id}` };
    }
    if (e.ref_table === 'case_interventions' && caseOfIntervention.has(e.ref_id)) {
      const id = caseOfIntervention.get(e.ref_id)!;
      return { key: `case:${id}`, kind: 'case', link: `/hoc-thuat/case/${id}` };
    }
    if (e.ref_table === 'case_followups' && caseOfFollowup.has(e.ref_id)) {
      const id = caseOfFollowup.get(e.ref_id)!;
      return { key: `case:${id}`, kind: 'case', link: `/hoc-thuat/case/${id}` };
    }
    if (e.ref_table === 'assessment_attempts' && e.ref_id) {
      return { key: `attempt:${e.ref_id}`, kind: 'assessment', link: `/mock/${e.ref_id}` };
    }
    if (e.ref_table === 'learning_cycles' || e.ref_table === 'cycle_target_revisions') {
      return { key: `cycle:${e.event_type}:${e.ref_id ?? e.id}`, kind: 'cycle', link: null };
    }
    return { key: `event:${e.id}`, kind: JOURNEY_GROUP[e.event_type] ?? 'other', link: null };
  };

  const byKey = new Map<string, any>();
  for (const e of rows) {
    const { key, kind, link } = keyOf(e);
    const item = {
      id: e.id, eventType: e.event_type, eventDate: e.event_date, title: e.title,
      detail: e.detail, actorName: e.actor_name ?? null,
      group: JOURNEY_GROUP[e.event_type] ?? 'other',
    };
    const ex = byKey.get(key);
    if (ex) {
      ex.events.push(item);
      if (e.event_date < ex.from) ex.from = e.event_date;
      if (e.event_date > ex.to) ex.to = e.event_date;
    } else {
      byKey.set(key, {
        key, kind, link, title: e.title, from: e.event_date, to: e.event_date, events: [item],
      });
    }
  }
  const list = [...byKey.values()];
  for (const ep of list) {
    ep.events.sort((a: any, b: any) => (a.eventDate < b.eventDate ? -1 : a.eventDate > b.eventDate ? 1 : a.id - b.id));
    // Tiêu đề chương lấy từ sự kiện MỞ ĐẦU, vì đó là lý do chương này tồn tại.
    ep.title = ep.events[0].title;
    ep.count = ep.events.length;
  }
  list.sort((a, b) => (a.to < b.to ? 1 : a.to > b.to ? -1 : 0));
  return list;
}

/**
 * BIỂU ĐỒ TIẾN BỘ GỌN (mục 7.12.A).
 *
 * Một chuỗi điểm cho MỖI kỹ năng, để giao diện chỉ việc vẽ. Bốn quy tắc đã chốt, và ba
 * trong bốn là quy tắc về những thứ KHÔNG được làm:
 *
 * 1. MỘT THANG ĐIỂM MỘT LOẠT. Lớp Fast Track vẽ band 0–9 cùng đường kỳ vọng của từng mốc;
 *    lớp Normal vẽ ĐIỂM GỐC dạng 13/30, tỷ lệ chỉ để đọc cho dễ. Hai bài khác đề khác thang
 *    không phải là hai điểm so được thẳng với nhau, nên không quy hết về phần trăm rồi vẽ
 *    một đường mượt.
 * 2. ĐIỂM CHÍNH THỨC VÀ ĐIỂM CÔ TỰ CHẤM LÀ HAI LOẠI. Chúng nằm cùng một biểu đồ nhưng
 *    KHÔNG nối chung một đường, và mang ký hiệu khác nhau.
 * 3. DƯỚI HAI ĐIỂM THÌ KHÔNG CÓ XU HƯỚNG. Một điểm duy nhất là một điểm, không phải một
 *    đường đi lên hay đi xuống. Trường hợp đó trả về `enough: false` để màn hình nói thẳng
 *    "chưa đủ dữ liệu".
 * 4. LỘ TRÌNH NÀO VẼ LỘ TRÌNH ẤY. Đổi chương trình là đổi thang điểm; hai giai đoạn tách
 *    nhau bằng chính bộ chọn lộ trình ở đầu trang, không trộn vào một biểu đồ.
 */
function progressOf(
  attempts: any[],
  ratio: boolean,
  caseIds: number[],
) {
  const conn = db();

  /* ---------------------------------------------- điểm chính thức, cũ → mới */
  const asc = [...attempts].reverse();
  type Point = {
    kind: 'official' | 'teacher';
    at: string | null; label: string;
    value: number | null; total: number | null; expectation: number | null;
  };
  const bySkill = new Map<string, Point[]>();
  const push = (skill: string, pt: Point) => {
    const cur = bySkill.get(skill) ?? [];
    cur.push(pt);
    bySkill.set(skill, cur);
  };

  for (const a of asc) {
    const label = ratio
      ? (a.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá')
      : `MT${a.attemptNo}`;
    if (ratio) {
      for (const sk of a.skills ?? []) {
        if (sk.score === null) continue;
        push(sk.skill, {
          kind: 'official', at: a.weekStart ?? null, label,
          value: sk.score, total: sk.total ?? null, expectation: null,
        });
      }
    } else {
      for (const sk of ASSESSED_SKILLS) {
        const band = a.bands?.[sk] ?? null;
        if (band === null) continue;
        push(sk, {
          kind: 'official', at: a.weekStart ?? null, label,
          value: band, total: null, expectation: a.expectation ?? null,
        });
      }
    }
  }

  /* ------------------------------------ điểm cô tự chấm, lấy từ các lần cập nhật case */
  if (caseIds.length) {
    const rows = conn
      .prepare(
        `SELECT observed_on, metrics FROM case_followups
          WHERE metrics IS NOT NULL AND case_id IN (${caseIds.map(() => '?').join(',')})
          ORDER BY observed_on`,
      )
      .all(...caseIds) as any[];
    for (const r of rows) {
      for (const m of parseMetrics(r.metrics) ?? []) {
        /* Writing1/Writing2 của lớp Fast Track cùng thuộc đường Writing khi vẽ. */
        const skill = m.skill === 'writing1' || m.skill === 'writing2' ? 'writing' : m.skill;
        push(skill, {
          kind: 'teacher', at: r.observed_on, label: 'Cô đánh giá',
          value: m.score, total: m.total ?? null, expectation: null,
        });
      }
    }
  }

  const skills = [...bySkill.entries()].map(([skill, points]) => {
    points.sort((x, y) => ((x.at ?? '') < (y.at ?? '') ? -1 : (x.at ?? '') > (y.at ?? '') ? 1 : 0));
    const official = points.filter((pt) => pt.kind === 'official');
    return {
      skill,
      label: ASSESSED_SKILL_LABEL[skill as AssessedSkill] ?? caseCategoryLabel(skill),
      points,
      officialCount: official.length,
      /* Hai điểm chính thức trở lên mới nói được là lên hay xuống. */
      enough: official.length >= 2,
    };
  });
  /* Thứ tự cố định L·R·W·S để mắt quen chỗ, không đổi theo dữ liệu em nào nhiều điểm hơn. */
  const order = ['listening', 'reading', 'writing', 'speaking'];
  skills.sort((x, y) => order.indexOf(x.skill) - order.indexOf(y.skill));

  /*
   * KHOẢNG THỰC HIỆN PHƯƠNG ÁN, vẽ ở DẢI DƯỚI cùng trục thời gian với đường điểm (mục 4.4).
   *
   * Đây là thứ biến một biểu đồ điểm thành một biểu đồ ĐỌC ĐƯỢC: nhìn thấy em tụt ở MT2 rồi
   * có một khoảng tutor chạy suốt tháng 9 là một câu chuyện; nhìn thấy mỗi hai cái chấm thì
   * không.
   *
   * Nhưng đúng là KHÔNG kết luận hộ. Phần mềm chỉ bày ra hai thứ nằm cạnh nhau trên trục
   * thời gian; nó không viết "nhờ tutor nên tăng một band", vì thứ tự thời gian không phải
   * là quan hệ nhân quả và không ai đo được cái phản chứng.
   *
   * Nhóm THEO CASE để nhiều phương án không đổ thành một rừng vạch — một case là một dải.
   */
  const bands = new Map<string, any[]>();
  if (caseIds.length) {
    const rows = conn
      .prepare(
        `SELECT iv.id, iv.case_id, iv.kind, iv.description, iv.status, iv.approval_state,
                iv.started_date, iv.cycle_started_on, iv.completed_date, iv.followup_due,
                sc.category, sc.topic, sc.status AS case_status,
                (SELECT fu.outcome FROM case_followups fu
                  WHERE fu.intervention_id = iv.id AND fu.outcome IS NOT NULL
                  ORDER BY fu.observed_on DESC, fu.id DESC LIMIT 1) AS final_outcome
           FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
          WHERE iv.case_id IN (${caseIds.map(() => '?').join(',')})
            AND iv.status != 'cancelled'
          ORDER BY iv.id`,
      )
      .all(...caseIds) as any[];
    for (const r of rows) {
      const cat = r.category ?? categoryOf(r.topic);
      if (!cat) continue;
      /* W1 và W2 của Fast Track cùng thuộc đường Writing khi vẽ, như điểm cô tự chấm. */
      const skill = cat === 'writing1' || cat === 'writing2' ? 'writing' : cat;
      const from = r.started_date ?? r.cycle_started_on ?? null;
      /* Chưa bắt đầu thì chưa có khoảng nào để vẽ — không lấy ngày lập kế hoạch làm ngày làm. */
      if (!from) continue;
      const list = bands.get(skill) ?? [];
      const running = r.status !== 'completed';
      list.push({
        id: r.id, caseId: r.case_id, kind: r.kind,
        kindLabel: INTERVENTION_KIND_LABEL[r.kind as InterventionKind] ?? r.kind,
        description: r.description ?? null,
        from,
        /* Chưa xong thì dải kéo tới ngày dự kiến kết thúc, và giao diện vẽ nó mở đuôi. */
        to: r.completed_date ?? null,
        expectedTo: r.followup_due ?? null,
        running,
        /* Đang chờ Quản lý trả lời thì chu kỳ thực hiện CHƯA bắt đầu — vẽ khác hẳn. */
        pending: r.approval_state === 'pending',
        /*
         * KẾT QUẢ CUỐI của phương án, theo đúng cách đếm của mục 15.3 — để dải màu nói được
         * "đã xong và ăn thua" khác "đã xong mà không ăn thua". Phương án còn chạy thì chưa
         * có kết quả cuối, dù các chu kỳ giữa chừng đã ghi gì đi nữa.
         */
        outcome: running ? null : (r.final_outcome ?? null),
        result: running ? 'running' : outcomeGroup(r.final_outcome),
      });
      bands.set(skill, list);
    }
  }

  /*
   * CÁC LẦN ĐÁNH GIÁ HỖ TRỢ — mốc nhỏ trên chính dải phương án (mục 4.4). Đây là những lần
   * một người thật nhìn lại và ghi kết quả, nên nó là tin tức; `updated_at` của bản ghi thì
   * không.
   */
  const marks = new Map<string, any[]>();
  if (caseIds.length) {
    const rows = conn
      .prepare(
        `SELECT fu.observed_on, fu.outcome, fu.case_id, fu.intervention_id,
                sc.category, sc.topic
           FROM case_followups fu JOIN sos_cases sc ON sc.id = fu.case_id
          WHERE fu.case_id IN (${caseIds.map(() => '?').join(',')}) AND fu.outcome IS NOT NULL
          ORDER BY fu.observed_on`,
      )
      .all(...caseIds) as any[];
    for (const r of rows) {
      const cat = r.category ?? categoryOf(r.topic);
      if (!cat) continue;
      const skill = cat === 'writing1' || cat === 'writing2' ? 'writing' : cat;
      const list = marks.get(skill) ?? [];
      list.push({
        on: r.observed_on, outcome: r.outcome, caseId: r.case_id,
        /* Chấm phải rơi đúng thanh của phương án sinh ra nó, không rơi bừa lên thanh cùng case. */
        interventionId: r.intervention_id ?? null,
      });
      marks.set(skill, list);
    }
  }

  for (const sk of skills) {
    (sk as any).plans = bands.get(sk.skill) ?? [];
    (sk as any).reviews = marks.get(sk.skill) ?? [];
  }

  return { mode: ratio ? ('ratio' as const) : ('ielts' as const), skills };
}

/**
 * CÂU TỔNG HỢP ĐẦU HỒ SƠ (mục 4.1), dựng từ đúng bảng kỹ năng mà người đọc sẽ thấy ngay
 * bên dưới. Trả về ba mảnh rời để giao diện tô màu từng mảnh, chứ không phải một chuỗi dài
 * đã ghép sẵn — ghép sẵn thì mọi thứ cùng một màu và cái gấp nhất chìm vào giữa câu.
 */
function headlineOf(p: Principal, studentId: number, cycleId: number | null) {
  const rows = (skillSupportBoard(p, studentId, cycleId) as any).rows as any[];
  const today = demoToday();

  /* Kỹ năng đang DƯỚI KỲ VỌNG ở bài gần nhất — nói tên môn, không gộp thành một mức. */
  const below = rows.filter((r) => r.missed === true).map((r) => r.short ?? r.label);
  /* Kỹ năng còn TÍN HIỆU chưa ai xác minh — việc chặn đầu chuỗi, nên tách riêng. */
  const signals = rows.filter((r) => r.signal).map((r) => r.short ?? r.label);
  /* Vấn đề ĐANG xử lý, đếm theo case chứ không theo kỹ năng: một kỹ năng có thể hai case. */
  const open = rows.reduce((n, r) => n + r.cases.filter((c: any) => c.status !== 'done').length, 0);

  /*
   * VIỆC TIẾP THEO QUAN TRỌNG NHẤT — MỘT việc, chọn theo hạn sớm nhất và mức chặn nhiều
   * nhất. Bày ba việc ở đầu hồ sơ thì không việc nào được làm trước.
   */
  /* Câu BẮT ĐẦU BẰNG ĐỘNG TỪ (PR-HV Q7): ô "Việc cần làm tiếp" đọc như một việc, không như một nhận xét. "PA" ở đây
     đúng D1 — đầu hồ sơ học viên là ngữ cảnh học thuật. */
  type Next = { text: string; due: string | null; rank: number; category: string; loai?: 'cap-nhat-pa' };
  const cands: Next[] = [];
  /* DỰ PHÒNG (PR-HV, sửa sau rà soát 22/09): việc cập nhật hằng tuần CHƯA quá hạn CHỈ dùng khi không có việc nào khác —
     nếu đưa vào `cands`, ứng viên có hạn sẽ thắng ứng viên không hạn ở `cands.sort` và chen trước "Xác minh SOS"/"Đề ra PA". */
  const duPhong: Next[] = [];
  /* Mục 3 (chủ sản phẩm 22/09): TÊN ĐẦY ĐỦ kỹ năng ("Writing Task 2"), không viết tắt "W2". */
  const sk = (r: any) => r.label;
  /* Mục 1 (chủ sản phẩm 22/09): case từ SOS CHỜ XÁC ĐỊNH NGUYÊN NHÂN là việc chặn đầu chuỗi — xếp TRƯỚC mọi ứng viên khác
     (hạn = hạn xác định nguyên nhân). PA theo quy chế tự chạy từ lúc tạo (PR-N1, S4-1) — không còn việc "xác nhận PA". */
  const xacDinh: Next[] = [];
  for (const r of rows) {
    for (const c of r.cases) {
      if (c.status === 'done') continue;
      if (c.sos?.awaitingCause) xacDinh.push({ text: `Xác định nguyên nhân ${sk(r)}`, due: c.sos.dueOn ?? null, rank: 0, category: r.category });
    }
    if (r.signal) cands.push({ text: `Xác minh SOS ${sk(r)}`, due: r.signal.verifyDue ?? null, rank: 0, category: r.category });
    if (r.state === 'no_plan') cands.push({ text: `Đề ra PA ${sk(r)}`, due: null, rank: 1, category: r.category });
    if (r.overdueActionDue) cands.push({ text: `Ghi kết quả PA ${sk(r)}`, due: r.overdueActionDue, rank: 1, category: r.category, loai: 'cap-nhat-pa' });
    /* Hạn tuần CHƯA quá hạn — chỉ dùng khi không còn việc khác. Dự kiến kết thúc KHÔNG bao giờ là việc (T53 Q1, K3-02). */
    else if (r.nextActionDue) duPhong.push({ text: `Ghi kết quả PA ${sk(r)}`, due: r.nextActionDue, rank: 3, category: r.category, loai: 'cap-nhat-pa' });
    if (r.pendingApproval) cands.push({ text: `Chờ Quản lý duyệt PA ${sk(r)}`, due: null, rank: 2, category: r.category });
  }
  cands.sort((a, b) => {
    /* Quá hạn trước, rồi hạn sớm hơn, rồi bậc chặn. */
    const lateA = a.due && a.due < today ? 0 : 1;
    const lateB = b.due && b.due < today ? 0 : 1;
    if (lateA !== lateB) return lateA - lateB;
    if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
    if (!!a.due !== !!b.due) return a.due ? -1 : 1;
    return a.rank - b.rank;
  });

  duPhong.sort((a, b) => (a.due! < b.due! ? -1 : 1));
  xacDinh.sort((a, b) => (a.due ?? '9999') < (b.due ?? '9999') ? -1 : 1);
  const chon = xacDinh[0] ?? cands[0] ?? duPhong[0] ?? null;
  return {
    below, signals, openCases: open,
    next: chon ? { text: chon.text, due: chon.due, overdue: quaHan(chon.due, today), category: chon.category, loai: chon.loai } : null,
  };
}

export function studentProfile(p: Principal, studentId: number, wantCycleId?: number | null, attemptId?: number | null) {
  const conn = db();
  const s = conn.prepare('SELECT * FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');

  const allCycles = cyclesOf(studentId);
  /*
   * R7 (PR-Qb): mở đúng đợt — `?dot=` chỉ ĐỔI lộ trình khi chưa ai chỉ định `cycleId` tường minh.
   * Đợt của học viên KHÁC bị bỏ qua thay vì lộ dữ liệu của em đó (không throw — về lộ trình đang chạy như bình thường).
   */
  const wantCycleFromAttempt = !wantCycleId && attemptId
    ? (conn.prepare('SELECT cycle_id FROM assessment_attempts WHERE id = ? AND student_id = ?').get(attemptId, studentId) as any)?.cycle_id ?? null
    : null;
  const selected = (wantCycleId ? cycleById(wantCycleId) : null)
    ?? (wantCycleFromAttempt ? cycleById(wantCycleFromAttempt) : null)
    ?? currentCycle(studentId)
    ?? allCycles[allCycles.length - 1]
    ?? null;
  if (selected && selected.student_id !== studentId) throw notFound('Lộ trình không thuộc học viên này');

  // NGÂN SÁCH TRUY VẤN (sửa sau rà #75, vấn đề 5): widen JOIN có sẵn để lấy tuần bắt đầu của lớp
  // — tránh gọi riêng `classProgressMany`/`isRatioClass` (bốn câu SQL cho một lớp) ở khối "khoa" dưới.
  const enrollments = conn
    .prepare(
      `SELECT e.*, c.code AS class_code, c.kind AS class_kind, b.name AS branch_name,
              rp.week_start AS class_start_week
         FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
         LEFT JOIN report_periods rp ON rp.id = c.start_period_id
        WHERE e.student_id = ? ORDER BY e.started_at DESC, e.id DESC`,
    )
    .all(studentId) as any[];
  const current = enrollments.find((e) => e.status === 'active') ?? null;

  // --------------------------------------------------------- lượt đánh giá của lộ trình
  const attemptRows = selected
    ? conn
      .prepare(
        `SELECT a.*, c.code AS class_code, pr.code AS period_code, pr.week_start, pr.week_end AS period_end, (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route
           FROM assessment_attempts a
           LEFT JOIN classes c ON c.id = a.class_id
           LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE a.cycle_id = ? ORDER BY a.attempt_no DESC`,
      )
      .all(selected.id) as any[]
    : [];

  const caseByAttempt = new Map<number, any>();
  if (attemptRows.length) {
    const ids = attemptRows.map((a) => a.id);
    for (const r of conn
      .prepare(`SELECT id, attempt_id, sos_level, status, urgency FROM sos_cases WHERE attempt_id IN (${ids.map(() => '?').join(',')})`)
      .all(...ids) as any[]) caseByAttempt.set(r.attempt_id, r);
  }

  const homNayHs = demoToday();
  const attempts = attemptRows.map((a) => {
    const t = typedResult(a);
    const c = caseByAttempt.get(a.id) ?? null;
    const base = {
      id: a.id, attemptNo: a.attempt_no, kind: a.kind, status: a.status, lichSu: !!a.lich_su,
      /* M-14: false = MT lịch sử ngoài 4 tuần — không làm "Kết quả Test gần nhất" (ketQuaTestGanNhat). */
      sinhViec: luotSinhViecRow(a, homNayHs),
      classCode: a.class_code, periodCode: a.period_code, weekStart: a.week_start ?? null,
      mode: t.mode,
      caseId: c?.id ?? null, caseStatus: c?.status ?? null,
    };
    if (t.mode === 'ratio') {
      const r = t.ratio!;
      return {
        ...base, expectation: null, bands: null, overall: null,
        skills: r.skills, scored: r.scored, required: r.required,
        complete: r.complete, provisional: r.provisional,
        sosLevel: r.sosLevel, scopeNote: null,
      };
    }
    const r = t.ft!;
    return {
      ...base, expectation: r.expectation, bands: r.bands, overall: r.overall, skills: null,
      scored: r.scoredRequired, required: r.required.length,
      complete: r.complete, provisional: r.provisional,
      sosLevel: r.sosLevel, scopeNote: r.scopeNote,
    };
  });

  // --------------------------------------------------------- điểm xuất phát
  let baseline: any = null;
  if (selected) {
    if (selected.baseline_attempt_id) {
      const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(selected.baseline_attempt_id) as any;
      const t = a ? typedResult(a) : null;
      baseline = {
        source: selected.baseline_source,
        sourceLabel: BASELINE_SOURCE_LABEL[selected.baseline_source as keyof typeof BASELINE_SOURCE_LABEL]
          ?? selected.baseline_source,
        score: t?.ft?.overall ?? null,
        bands: t?.ft?.bands ?? null,
        attemptId: a?.id ?? null, attemptNo: a?.attempt_no ?? null,
        note: selected.baseline_note,
      };
    } else if (selected.baseline_score !== null && selected.baseline_score !== undefined) {
      baseline = {
        source: selected.baseline_source,
        sourceLabel: BASELINE_SOURCE_LABEL[selected.baseline_source as keyof typeof BASELINE_SOURCE_LABEL]
          ?? selected.baseline_source,
        score: selected.baseline_score, bands: null, attemptId: null, attemptNo: null,
        note: selected.baseline_note,
      };
    }
  }

  const per = currentBands(attemptRows);
  const target = selected?.target_score ?? null;

  const today = demoToday();
  const examPlan = examPlanOf(selected);

  // Mốc tiếp theo. FT (K2-31): lượt planned, không lịch sử, từ tuần này, sớm nhất — cùng `mocKeTiep` với danh sách lớp.
  // Lớp thường giữ luật cũ: lượt planned số nhỏ nhất.
  const nextRow = selected?.route
    ? mocKeTiep(attemptRows.map((a) => ({ ...a, weekStart: a.week_start ?? null })), today)
    : attemptRows.filter((a) => a.status === 'planned').sort((a, b) => a.attempt_no - b.attempt_no)[0] ?? null;

  // --------------------------------------------------------- đường đi từng kỹ năng
  /*
   * "Ghi nhận của giáo viên" ĐÃ BỎ HẲN Ở VÒNG 4. Đường đi từng kỹ năng nay chỉ dựng từ
   * ĐIỂM ĐẦU VÀO và ĐIỂM CÁC LƯỢT MT — một nguồn số liệu duy nhất, không còn hai đường
   * chấm điểm song song để các bảng đá nhau.
   */
  const trajectory = (isRatioCycle(selected ?? {}) ? [] : ASSESSED_SKILLS).map((skill) => {
    const points: SkillPoint[] = [];
    if (baseline?.bands?.[skill] !== null && baseline?.bands?.[skill] !== undefined) {
      points.push({ kind: 'baseline', label: 'Đầu vào', week: null, band: baseline.bands[skill], detail: baseline.sourceLabel });
    }
    for (const a of [...attemptRows].sort((x, y) => x.attempt_no - y.attempt_no)) {
      if (a.status === 'cancelled') continue;
      const b = assessedBands(entryBandsOf(scoresOf(a.id)))[skill];
      if (b === null || b === undefined) continue;
      points.push({
        kind: 'official', label: `MT${a.attempt_no}`,
        week: a.period_code ?? null, band: b, detail: null,
      });
    }
    return {
      skill, label: ASSESSED_SKILL_LABEL[skill], points,
      target,
      gapToTarget: target !== null && per[skill] ? Math.round((target - per[skill]!.band) * 10) / 10 : null,
      gain: baseline?.bands?.[skill] !== null && baseline?.bands?.[skill] !== undefined && per[skill]
        ? Math.round((per[skill]!.band - baseline.bands[skill]) * 10) / 10 : null,
      current: per[skill] ?? null,
    };
  });

  // --------------------------------------------------------- vấn đề đang theo dõi
  const caseRows = conn
    .prepare(
      `SELECT sc.*, cy.seq AS cycle_seq, cy.route, u.full_name AS reporter_name,
              (SELECT COUNT(*) FROM case_interventions ci WHERE ci.case_id = sc.id AND ci.status != 'cancelled') AS iv_count,
              (SELECT MIN(followup_due) FROM case_interventions ci
                WHERE ci.case_id = sc.id AND ci.status != 'cancelled' AND ci.followup_due IS NOT NULL
                  AND NOT (ci.preset = 1 AND ci.confirmed_at IS NULL)
                  AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = ci.id)) AS next_due,
              (SELECT ci.description FROM case_interventions ci WHERE ci.case_id = sc.id
                ORDER BY COALESCE(ci.completed_date, ci.started_date, ci.created_at) DESC LIMIT 1) AS last_iv,
              (SELECT ip.taxonomy_code FROM case_issues ip
                WHERE ip.case_id = sc.id AND ip.role = 'primary' LIMIT 1) AS primary_code,
              a.attempt_no AS attempt_no, a.kind AS attempt_kind
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN learning_cycles cy ON cy.id = sc.cycle_id
         LEFT JOIN users u ON u.id = sc.reported_by
        WHERE sc.student_id = ? ORDER BY (sc.status != 'done') DESC, sc.detected_at DESC, sc.id DESC`,
    )
    .all(studentId) as any[];

  const cases = caseRows.map((c) => ({
    id: c.id, status: c.status, sosLevel: c.sos_level, urgency: c.urgency,
    originKind: c.origin_kind, detectedAt: c.detected_at, summary: c.summary,
    headline: caseHeadline({
      summary: c.summary, originKind: c.origin_kind, sosLevel: c.sos_level, attemptNo: c.attempt_no,
      attemptKind: c.attempt_kind ?? null,
    }),
    attemptId: c.attempt_id, attemptNo: c.attempt_no,
    reporterName: c.reporter_name, disposition: c.disposition,
    cycleId: c.cycle_id, cycleSeq: c.cycle_seq, route: c.route,
    // Vấn đề của lộ trình TRƯỚC vẫn hiện, nhưng dán nhãn rõ — không dời sang lộ trình mới
    // cho tiện hiển thị, vì như thế là viết lại lịch sử.
    carriedOver: !!(selected && c.cycle_id && c.cycle_id !== selected.id),
    primaryCode: c.primary_code, primaryLabel: c.primary_code ? issueLabel(c.primary_code) : null,
    interventionCount: c.iv_count, lastIntervention: c.last_iv,
    nextDue: c.next_due, dueOverdue: !!(c.next_due && c.next_due < today && c.status !== 'done'),
  }));
  const openCases = cases.filter((c) => c.status !== 'done');

  /*
   * HÀNH TRÌNH TOÀN HỌC VIÊN (mục 4.5) — KHÔNG lọc theo lộ trình đang xem.
   *
   * Phần này trả lời một câu hỏi khác hẳn phần trên: em đã đi qua những đâu. Lọc nó theo
   * lộ trình đang chọn thì "toàn hành trình" chỉ còn một chặng, và lịch sử lớp/lộ trình cũ
   * — kể cả case đã bàn giao — biến mất đúng lúc người ta cần tra lại.
   */
  const journeyRows = conn
    .prepare(
      `SELECT j.*, u.full_name AS actor_name, lc.seq AS cycle_seq, lc.programme_code
         FROM journey_events j
         LEFT JOIN users u ON u.id = j.created_by
         LEFT JOIN learning_cycles lc ON lc.id = j.cycle_id
        WHERE j.student_id = ?
        ORDER BY j.event_date DESC, j.id DESC`,
    )
    .all(studentId) as any[];

  /*
   * MỐC XUYÊN CHƯƠNG TRÌNH — cái duy nhất thuộc về phần này (mục 4.5).
   *
   * Mọi cập nhật phương án đã nằm ngay trong hàng kỹ năng ở khối trên, kèm biểu đồ và case.
   * Kể lại chúng lần nữa ở đây là biến một mục "em đã đi qua những đâu" thành một cuộn giấy
   * mười lăm dòng cho một vấn đề, và cả hai chỗ cùng dài ra mà không chỗ nào rõ hơn.
   */
  /* Q8 (PR-Qb): Hành trình KHÔNG có Ý thức — bỏ 'warning'/'wl' khỏi cả mốc chính lẫn toàn bộ sự kiện. */
  const JOURNEY_MILESTONES = new Set([
    'enrollment', 'transfer', 'pause', 'resume', 'finish',
    'cycle_start', 'repeat', 'exam_date_changed', 'exam_result',
    'case_handover', 'cycle_outcome',
  ]);
  const Y_THUC_EVENTS = new Set(['warning', 'wl']);
  const journeyRowsKhongYThuc = journeyRows.filter((r) => !Y_THUC_EVENTS.has(r.event_type));
  const milestoneRows = journeyRowsKhongYThuc.filter((r) => JOURNEY_MILESTONES.has(r.event_type)
    || r.ref_table === 'learning_cycles' || r.ref_table === 'cycle_target_revisions');

  const standingNow = standingFor([studentId]).get(studentId) ?? null;

  /*
   * TÍN HIỆU CÒN CHỜ XÁC MINH — phải thấy được ngay ở hồ sơ (mục 6.2).
   *
   * Đây là những chỗ hệ thống đã thấy con số bất thường mà chưa ai kết luận gì. Chúng KHÔNG
   * được trộn vào danh sách case: một tín hiệu chưa ai xem không phải một vấn đề đã xác định,
   * và đếm chung là nói quá số việc đang có. Nên nó đi ra ở một khoá riêng.
   */
  const signals = listSignals(p, { studentId, status: 'pending' }).rows;

  // Đọc MỘT LẦN, dùng lại cho cả `programme` lẫn khối `khoa` dưới — tránh gọi lại `programmeOfClass`
  // (và qua đó `isRatioClass`) hai lần cho cùng một lớp (sửa sau rà #75, vấn đề 5).
  const progHienTai = current ? programmeOfClass(current.class_id) : null;

  return {
    id: s.id, studentCode: s.student_code, fullName: s.full_name, dob: s.dob,
    status: s.status, finishedAt: s.finished_at, archivedAt: s.archived_at,
    consultantName: s.consultant_name, note: s.note,
    pendingSignals: signals,
    currentClass: current
      ? {
        id: current.class_id, code: current.class_code, kind: current.class_kind,
        branchName: current.branch_name,
        /* Chương trình của LỚP, và GVCN — hai thứ đầu hồ sơ phải nói ngay (mục 6.2 A). */
        programme: progHienTai?.name ?? null,
        coreTeacher: (conn
          .prepare(
            `SELECT u.full_name FROM teacher_assignments t JOIN users u ON u.id = t.user_id
              WHERE t.class_id = ? AND t.is_core = 1 AND t.status = 'active' LIMIT 1`,
          )
          .get(current.class_id) as any)?.full_name ?? null,
        /*
         * KHOÁ ĐANG HỌC (Q18, PR-Qb) — chỉ lớp thường có, FT không có "tuần học của khoá" cố định.
         * Cùng cách tính `tuanKetThuc` với `hocVienLop.ts` (PR-Qa): tuần bắt đầu + (tổng tuần − 1) × 7 ngày.
         * Tính thẳng từ `progHienTai` + `class_start_week` (đã lấy sẵn ở JOIN của `enrollments` phía
         * trên) — KHÔNG gọi `isRatioClass`/`classProgressMany` riêng (bốn câu SQL thừa cho một lớp).
         */
        khoa: progHienTai?.scoringMode === 'ratio'
          ? {
            ma: progHienTai.code,
            tuanHienTai: studyWeekOf(current.class_start_week, mondayOf(demoToday())),
            tongTuan: progHienTai.weeks,
            tuanKetThuc: current.class_start_week && progHienTai.weeks
              ? addDays(current.class_start_week, (progHienTai.weeks - 1) * 7) : null,
          }
          : null,
      }
      : null,
    /*
     * DẢI HÀNH TRÌNH NGẮN (mục 6.2 A): các chương trình em đã đi qua, theo đúng thứ tự.
     *
     * Cố ý là một DẢI CHỮ, không phải một timeline lớn: nó chỉ để nhận biết "em này đã qua
     * FOU rồi BE, giờ đang FT", chứ không phải chỗ đọc lịch sử. Lịch sử đầy đủ nằm ở tab
     * Hành trình học tập phía dưới.
     */
    journeyStrip: allCycles.map((c) => ({
      id: c.id,
      label: programmeByCode(c.programme_code)?.name
        ?? (c.route ? `Fast Track ${c.route}` : cycleLabel(c)),
      current: c.status === 'active',
      startedAt: c.started_at, endedAt: c.ended_at,
      outcome: c.outcome ?? null,
    })),
    enrollments: enrollments.map((e) => ({
      id: e.id, classId: e.class_id, classCode: e.class_code, branchName: e.branch_name,
      status: e.status, startedAt: e.started_at, endedAt: e.ended_at, endReason: e.end_reason,
    })),
    cycles: allCycles.map((c) => ({
      id: c.id, seq: c.seq, route: c.route, label: cycleLabel(c), target: c.target_score,
      examPlan: examPlanOf(c), startedAt: c.started_at, endedAt: c.ended_at, status: c.status,
      outcome: c.outcome, ratio: isRatioCycle(c),
    })),
    cycle: selected
      ? {
        id: selected.id, studentId, seq: selected.seq, route: selected.route, label: cycleLabel(selected),
        programmeCode: selected.programme_code, ratio: isRatioCycle(selected),
        target, examPlan, startedAt: selected.started_at, endedAt: selected.ended_at,
        status: selected.status,
        /*
         * ĐẾM NGƯỢC CHỈ KHI ĐÃ CÓ TUẦN THI. Biết mỗi tháng mà vẫn hiện "còn 134 ngày" là
         * bịa ra một độ chính xác không có thật, và người đọc sẽ tin con số đó.
         */
        daysToExam: examPlan.weekStart ? diffDays(examPlan.weekStart, today) : null,
        /*
         * TUẦN BẮT ĐẦU HỌC và DỰ KIẾN THI — hai trường của vòng 4 (mục 7.5).
         * Tuần bắt đầu là mốc gốc sinh ra lịch MT mặc định; dự kiến thi chỉ có với lớp FT.
         */
        startPeriodId: selected.start_period_id ?? null,
        startWeek: selected.start_period_id
          ? (conn.prepare('SELECT week_start, code FROM report_periods WHERE id = ?')
              .get(selected.start_period_id) as any) ?? null
          : null,
        examMonth: selected.exam_month ?? null,
        examPeriodId: selected.exam_period_id ?? null,
        /*
         * LỚP NORMAL KHÔNG CÓ KẾ HOẠCH THI IELTS; cái tương đương là TUẦN KẾT THÚC CHƯƠNG
         * TRÌNH (mục 5.3).
         *
         * SUY RA từ tuần bắt đầu cộng độ dài chương trình, KHÔNG lưu thành một cột thứ hai:
         * hai nguồn cho cùng một ngày thì sớm muộn chúng lệch nhau, và lúc đó không ai biết
         * cột nào đúng. Foundation 8 tuần bắt đầu tuần 27/07 thì kết thúc tuần thứ 8.
         */
        programmeName: programmeByCode(
          selected.programme_code ?? programmeCodeOfCycle(selected.id),
        )?.name ?? null,
        endWeek: (() => {
          const tpl = programmeByCode(selected.programme_code ?? programmeCodeOfCycle(selected.id));
          if (!isRatioCycle(selected) || !tpl?.weeks || !selected.start_period_id) return null;
          const start = conn
            .prepare('SELECT week_start FROM report_periods WHERE id = ?')
            .get(selected.start_period_id) as any;
          if (!start?.week_start) return null;
          const d = new Date(`${start.week_start}T00:00:00Z`);
          d.setUTCDate(d.getUTCDate() + (tpl.weeks - 1) * 7);
          return ensurePeriod(d.toISOString().slice(0, 10));
        })(),
        /* Lịch MT hệ thống đề xuất, và những lượt người đã chốt tay thì ghi rõ là giữ nguyên. */
        suggestedMocks: isRatioCycle(selected) ? [] : suggestedMockWeeks(selected.id),
        baseline,
        outcome: selected.outcome
          ? {
            outcome: selected.outcome,
            label: CYCLE_OUTCOME_LABEL[selected.outcome as keyof typeof CYCLE_OUTCOME_LABEL],
            score: selected.outcome_score, attemptId: selected.outcome_attempt_id, note: selected.outcome_note,
          }
          : null,
        targetRevisions: targetRevisions(selected.id).map((r) => ({
          id: r.id, oldTarget: r.old_target, newTarget: r.new_target,
          effectiveFrom: r.effective_from, reason: r.reason, actorName: r.actor_name,
        })),
      }
      : null,
    current: {
      perSkill: per,
      /*
       * Overall chỉ lấy từ MỘT lượt có đủ bốn kỹ năng. Không ghép bốn kỹ năng mới nhất
       * của bốn lượt khác nhau — bốn buổi khác nhau cộng lại không thành một bài thi.
       */
      overall: attempts.find((a) => a.mode === 'ielts' && a.overall !== null)?.overall ?? null,
      overallFrom: attempts.find((a) => a.mode === 'ielts' && a.overall !== null)?.attemptNo ?? null,
    },
    checkpoint: checkpointView(attemptRows),
    nextCheckpoint: nextRow
      ? {
        id: nextRow.id, attemptNo: nextRow.attempt_no, kind: nextRow.kind,
        periodCode: nextRow.period_code, weekStart: nextRow.week_start,
      }
      : null,
    /*
     * BADGE "THIẾU THÔNG TIN" (mục 7.5) — gom mọi thứ còn thiếu vào MỘT nhãn, hiện ngay
     * trên thẻ tên để đúng vai có trách nhiệm nhìn thấy mà không phải đi tìm.
     */
    missing: missingForStudent({
      cycle: selected
        ? {
          start_period_id: selected.start_period_id,
          exam_month: selected.exam_month,
          target_score: selected.target_score,
          baseline: selected.baseline_attempt_id !== null || selected.baseline_score !== null,
        }
        : null,
      student: { dob: s.dob },
      isFastTrack: !isRatioCycle(selected ?? {}),
    }),
    /*
     * TÌNH TRẠNG HỌC THUẬT HIỆN TẠI — lấy từ KẾT QUẢ BÀI GẦN NHẤT (mục 2.1).
     *
     * Đây là thứ thay cho `concerns.maxSos` cũ. `maxSos` đọc mức SOS đã đóng băng trong case
     * còn mở, nên một em thi MT3 đạt hết mà case MT2 chưa đóng vẫn bị gọi là SOS 1 ngay trên
     * thẻ tên. Nay mức SOS chỉ nói về BÀI, còn case là một con số đếm riêng.
     */
    standing: standingNow,
    /** Câu tóm tắt một dòng, dựng ở máy chủ để mọi màn nói y hệt nhau. */
    standingLine: standingNow ? standingLine(standingNow) : null,
    /**
     * CÂU TỔNG HỢP CỦA ĐẦU HỒ SƠ (mục 4.1) — dựng từ CHÍNH bảng kỹ năng bên dưới.
     *
     * Ba mệnh đề, đúng thứ tự người đọc cần: kỹ năng nào đang dưới kỳ vọng hoặc còn tín
     * hiệu chờ xác minh · vấn đề nào đang xử lý · việc tiếp theo quan trọng nhất là gì.
     *
     * NÓI RÕ TỪNG KỸ NĂNG, không gộp thành một mức chung. Một em Listening đã đạt mà W2 và
     * Speaking còn dưới kỳ vọng thì câu "SOS 2" ở đầu trang vừa đúng vừa vô dụng: nó không
     * nói được môn nào đang ổn, môn nào chưa. Và nó tuyệt đối không được làm case Listening
     * đang chờ kết luận trông như vẫn chưa đạt.
     *
     * Dựng từ cùng một nguồn với bảng bên dưới là điều kiện để hai chỗ không bao giờ nói
     * ngược nhau — tính lại lần thứ hai ở đây là tự tạo ra một nguồn sự thật thứ hai.
     */
    headline: headlineOf(p, studentId, selected?.id ?? null),
    concerns: {
      openCases: openCases.length,
      carriedOver: openCases.filter((c) => c.carriedOver).length,
      activeInterventions: openCases.reduce((n, c) => n + (c.interventionCount ?? 0), 0),
      dueOverdue: openCases.filter((c) => c.dueOverdue).length,
    },
    trajectory,
    attempts,
    progress: progressOf(attempts, isRatioCycle(selected ?? {}), cases.map((c: any) => c.id)),
    cases,
    /* Mặc định chỉ mốc xuyên chương trình; giao diện mở được toàn bộ khi cần tra lại. */
    episodes: episodesOf(milestoneRows),
    allEpisodes: episodesOf(journeyRowsKhongYThuc),
    viewer: (() => {
      /*
       * K2-6e (Q16) — MỘT NGUỒN "lớp đang học": `activeClassOf` (bảng `enrollments`, xếp theo `id DESC`), không phải
       * `current` ở trên (xếp theo `started_at DESC`) — hai cách xếp lệch NHAU THẬT khi em chuyển lớp cùng ngày. `current`
       * vẫn giữ nguyên cho phần hiển thị (ngày bắt đầu, mã lớp…) — chỉ hai quyền dưới đây đổi nguồn.
       */
      const lopDangHoc = activeClassOf(studentId);
      return {
        canEdit: can(p, PERMISSIONS.STUDENT_EDIT, { studentId }),
        /* PR-DUYET (T44): target / lộ trình — Quản lý. GV của lớp không có quyền này thì gửi "Đề xuất sửa". */
        canEditCycle: can(p, PERMISSIONS.CYCLE_EDIT, { studentId }),
        coTheDeXuatSua: !can(p, PERMISSIONS.CYCLE_EDIT, { studentId }) && can(p, PERMISSIONS.STUDENT_VIEW, { classId: lopDangHoc, studentId }),
        canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { studentId }),
        canReport: can(p, PERMISSIONS.SOS_REPORT, { classId: lopDangHoc, studentId }),
        /* RB-6 (PR-S1): quyền hoàn thành Case tính theo MÔN của từng Case — xem `canClose` trên từng thẻ Case, không có cờ chung ở đây. */
        /* Ý thức & Phối hợp (PR-K): ghi vi phạm — mọi GV dạy lớp em đang học (V01, C02 không áp cho Ý thức); xử lý — GVCN của lớp + Quản lý. */
        canRecordViolation: can(p, PERMISSIONS.VIOLATION_RECORD, { classId: lopDangHoc, studentId }),
        canManageDiscipline: canManageDiscipline(p, studentId),
        /* PR-XOA: ⋮ › Xoá học viên — CHỈ Quản trị hệ thống (máy chủ kiểm lại ở `xoaHocVien`). */
        coTheXoa: can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }),
      };
    })(),
    lopHoc: lopHocCua(p, studentId, current),
  };
}

export { ENTRY_SKILLS };
