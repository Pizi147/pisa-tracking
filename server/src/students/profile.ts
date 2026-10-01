import { db } from '../db.ts';
import {
  ASSESSED_SKILLS, BASELINE_SOURCE_LABEL, CYCLE_OUTCOME_LABEL, ENTRY_SKILLS,
  ASSESSED_SKILL_LABEL, INTERVENTION_KIND_LABEL, JOURNEY_GROUP, PERMISSIONS,
  caseHeadline, duongCase, issueLabel, caseCategoryLabel, categoryOf, fmtExamMonth, cauTomTat, ketQuaTestGanNhat, oHocThuat, oSapToi, oYThuc,
  MEASURE_KIND_LABEL, THANG, nhanLoaiXuLy, programmeOf, tenBacKe, tenMonNgan, mocKeTiep, quaHan, studyWeekOf, tenMon, tuanHocTai, tuanLich,
  type AssessedSkill, type EntrySkill, type InterventionKind,
} from '../../../shared/domain/index.ts';
import { outcomeGroup } from '../cases/effectiveness.ts';
import { demoToday } from '../demoConfig.ts';
import { addDays, diffDays, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { entryBandsOf, routeCuaLuot, scoresOf, skipsOf } from '../fasttrack/attempts.ts';
import { assessedBands, evaluateAttempt, expectationFor } from '../fasttrack/scoring.ts';
import { evaluateRegular, isRatioClass, isRatioCycle, programmeByCode, programmeCodeOfCycle, programmeOfClass } from '../normal/regular.ts';
import { cycleById, cyclesOf, currentCycle, examPlanOf, targetRevisions } from '../fasttrack/cycles.ts';
import { parseMetrics, skillSupportBoard } from '../cases/cases.ts';
import { standingFor, standingLine } from './standing.ts';
import { luotSinhViecRow } from '../worklist/danhGia.ts';
import { missingForStudent, suggestedMockWeeks } from '../classes/schedule.ts';
import { lopHocCua } from '../classes/loTrinhTiep.ts';
import { daiHocVien } from '../classes/daiChuyenLop.ts';
import { cuoiKhoaTheoHocVien, miniTestCuaHocVien, type EmCuoiKhoa } from '../normal/cuoiKhoa.ts';
import { quyenBoTro } from '../cases/boTro.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { activeClassOf, canManageDiscipline } from '../yThuc/access.ts';
import { khoangTamDung } from './tamDung.ts';
import { viecCuaHocVien } from './viecHocVien.ts';
import { trangThaiYThuc } from '../yThuc/trangThai.ts';

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
    const r = evaluateRegular(prog.skills, rows, prog.code);
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
  /** Mã chương trình của lộ trình (MH2: FOU G+V/P). */
  ct: string | null = null,
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
      label: ratio ? tenMon(ct, skill) : ASSESSED_SKILL_LABEL[skill as AssessedSkill] ?? caseCategoryLabel(skill),
      points,
      officialCount: official.length,
      /* Hai điểm chính thức trở lên mới nói được là lên hay xuống. */
      enough: official.length >= 2,
    };
  });
  /* Thứ tự cố định L·R·W·S để mắt quen chỗ, không đổi theo dữ liệu em nào nhiều điểm hơn. */
  const order = ['listening', 'reading', 'writing', 'speaking', 'tong_hop'];
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
 * CÂU TÓM TẮT + BỐN Ô (PR-VAI-b Task 3, T72, K3-03) — mọi số từ CÙNG `board`, `viec`, `trangThaiYThuc`, `attempts`, `nextCheckpoint` đã nạp,
 * không câu SQL nào thêm. Mỗi ô một nguồn (Q7): Kết quả = `ketQuaTestGanNhat` · Học thuật = hàng Case mở của bảng kỹ năng ·
 * Ý thức = `trangThaiYThuc` · Sắp tới = mốc kế tiếp.
 */
function boOVaCau(i: {
  s: any; selected: any; attempts: any[]; board: { rows: any[]; chuongTrinh: string | null };
  viec: { cuaBan: any[]; nguoiKhac: any[] }; yThucEm: any; dai: any; thongTin: any; nextRow: any;
  cuoiKhoaDang: boolean; khoaHienTai: { tuanKetThuc: string | null } | null; today: string; huong: string | null;
}) {
  const { s, selected, attempts, board, viec, yThucEm: em, dai, today } = i;
  const ct = board.chuongTrinh;
  const kck = !!selected?.khong_cam_ket;
  const kq = ketQuaTestGanNhat(attempts, today);
  const a = kq ? attempts.find((x) => x.id === kq.attemptId) : null;
  const ratio = a?.mode === 'ratio';
  const dauDot = (x: any) => (x.mode === 'ratio' ? (x.kind === 'final' ? 'Cuối khoá' : 'Giữa khoá') : `MT${x.attemptNo}`);
  const tenKn = new Map(board.rows.map((r) => [r.category as string, r.label as string]));
  const vi = em?.viPham ? [...em.viPham.values()] as any[] : [];
  const quaHanYt = Math.max(0, ...vi.map((t) => t.quaHanNgay ?? 0)) || null;
  const deXuatCho = em?.deXuat?.status === 'cho_duyet' ? nhanLoaiXuLy(em.deXuat.kind, em.deXuat.customName) : null;
  const keTiep = em?.keTiep ? MEASURE_KIND_LABEL[em.keTiep.kind as keyof typeof MEASURE_KIND_LABEL] ?? null : null;

  const tomTat = cauTomTat({
    dacBiet: s.status === 'finished' ? { loai: 'ket-thuc' }
      : s.status === 'inactive' ? { loai: 'tam-dung', tu: i.thongTin.tamDung?.tu ?? today }
      : dai?.loai === 'sap' && dai.lopDich ? { loai: 'sap-chuyen', lop: dai.lopDich.code, tuan: dai.tuan }
      : kck ? { loai: 'kck' } : null,
    ketQua: a && kq ? {
      dau: dauDot(a), ratio, sos: kq.sos, dat: kq.dat, overall: a.overall ?? null, kck,
      soDat: ratio ? (a.skills ?? []).filter((x: any) => x.outcome === 'pass').length : 0, soMon: a.required,
      monTruot: ratio ? (a.skills ?? []).filter((x: any) => x.outcome === 'fail').map((x: any) => tenMonNgan(ct, x.skill)) : [],
      phanTram: kq.phanTram,
    } : null,
    hoTro: board.rows.filter((r) => r.cases.some((c: any) => c.status !== 'done')).map((r) => r.label as string),
    viec: [...viec.cuaBan, ...viec.nguoiKhac].map((v) => ({ loai: v.loai, chu: v.chu, quaHanNgay: v.quaHanNgay, kyNangTen: v.kyNang ? tenKn.get(v.kyNang) ?? null : null })),
    yThuc: em && !em.tamDung ? { nhom: em.nhom ?? null, keTiep, han: em.han ?? null, quaHanNgay: quaHanYt, deXuat: deXuatCho } : null,
    homNay: today,
  });

  const nextA = i.nextRow ? attempts.find((x) => x.id === i.nextRow.id) : null;
  const daCuoiKhoa = i.cuoiKhoaDang && !nextA && attempts.some((x) => x.kind === 'final' && x.status !== 'cancelled' && x.scored > 0);
  const pc = programmeOf(ct);
  const o = {
    /** Ô Kết quả: lượt + kỹ năng dưới kỳ vọng (mỗi mã một liên kết, G5) · KCK · hướng Cuối khoá. */
    ketQua: {
      kq, kck, ratio, overall: (a?.overall ?? null) as number | null,
      /* G5: mỗi mã liên kết tới lượt sinh ra điểm của CHÍNH kỹ năng đó (`bandAttemptId`), không phải lượt của ô. */
      duoi: board.rows.filter((r) => r.missed === true).map((r) => ({ ngan: (r.short ?? r.label) as string, kn: r.category as string, attemptId: (r.bandAttemptId ?? null) as number | null })),
      huong: ratio && a?.kind === 'final' ? i.huong : null,
    },
    hocThuat: oHocThuat(board.rows, s.status === 'inactive' ? i.thongTin.tamDung?.tu ?? null : null),
    yThuc: oYThuc(em ? {
      bacTen: em.bac > 0 ? MEASURE_KIND_LABEL[THANG[em.bac - 1] as keyof typeof MEASURE_KIND_LABEL] ?? null : null,
      nhom: em.nhom ?? null, soBatBuoc: em.soBatBuoc ?? 0, keTiep, han: em.han ?? null, quaHanNgay: quaHanYt, deXuat: deXuatCho,
      soMo: vi.filter((t) => t.t !== 'da_xu_ly').length, tamDung: !!em.tamDung || s.status === 'inactive',
    } : null),
    sapToi: {
      ...oSapToi({
        ketLuan: s.status === 'finished' ? (selected?.outcome ? CYCLE_OUTCOME_LABEL[selected.outcome as keyof typeof CYCLE_OUTCOME_LABEL] ?? 'Kết thúc học' : 'Kết thúc học') : null,
        sauCuoiKhoa: daCuoiKhoa ? { tuanKetThuc: i.khoaHienTai?.tuanKetThuc ?? null } : null,
        next: nextA ? {
          dau: dauDot(nextA), attemptNo: nextA.attemptNo, tuan: nextA.weekStart ?? null, soPhan: nextA.required, final: nextA.kind === 'final',
          kyVong: nextA.mode === 'ratio' || kck ? null : expectationFor(selected?.target_score ?? null, nextA.attemptNo, selected?.route ?? null),
        } : null,
        ratio: !!nextA ? nextA.mode === 'ratio' : i.cuoiKhoaDang, kck, bacKe: pc && pc !== 'FT' ? tenBacKe(pc) : null, homNay: today,
        tamDung: s.status === 'inactive',
      }),
      attemptId: nextA?.id ?? null,
    },
  };
  return { tomTat, o };
}

/**
 * DÒNG THÔNG TIN ĐẦU HỒ SƠ (PR-VAI-b Task 1, mockup 24 A/C/D1) — "em là ai":
 *   FT          MB FT 101 · LT1 · target 6.5 · tuần học thứ 9 · thi dự kiến 06/2027 · GVCN …
 *   lớp thường  MB FOU 15 · FOU · tuần học 7/10 · Cuối khoá W4 OCT · GVCN …
 * FT đếm tuần học bằng `tuanHocTai` (PR-S6F-b D17 — một hàm cho đầu hồ sơ, chương Hành trình, panel Chuyển lớp / Lên lớp): bỏ tuần Tạm dừng; em đang dừng thì số dừng ở tuần trước tuần dừng.
 */
function dongThongTin(i: {
  s: any; current: any; khoa: { ma: string; tuanHienTai: number | null; tongTuan: number | null; tuanKetThuc: string | null } | null;
  gvcn: string | null; dangChay: any; today: string; startWeekSel: { cycleId: number; weekStart: string | null } | null;
  /** Kế hoạch thi đã tính của lộ trình đang xem — dùng lại khi trùng lộ trình đang chạy (không hỏi lại tuần thi). */
  keSel: { cycleId: number; ke: ReturnType<typeof examPlanOf> } | null;
  /** Tuần bài Cuối khoá đã xếp lịch của lớp đang học (cùng nguồn ô Sắp tới) — lớp thường ưu tiên tuần này, chưa có bài thì tuần kết thúc lớp. */
  tuanCuoiKhoa?: string | null;
}) {
  const { s, current, khoa, dangChay, today } = i;
  const dung = khoangTamDung([s.id])[s.id] ?? [];
  const dangDung = s.status === 'inactive' ? dung.find((k) => k.den === null) ?? null : null;
  const boi = dangDung?.boiId
    ? (db().prepare('SELECT full_name FROM users WHERE id = ?').get(dangDung.boiId) as any)?.full_name ?? null
    : null;
  const tamDung = dangDung ? { tu: dangDung.tu, lyDo: dangDung.lyDo, boi } : null;
  if (!current) return { lop: null, lopId: null, loTrinh: null, target: null, tuanHoc: null, thiDuKien: null, gvcn: null, tamDung };

  let tuanHoc: { tuan: number | null; tong: number | null; dangDung: boolean } | null = null;
  let thiDuKien: { nhan: string; gt: string } | null = null;
  if (khoa) {
    if (khoa.tuanHienTai !== null && khoa.tuanHienTai >= 1 && khoa.tongTuan) {
      tuanHoc = { tuan: Math.min(khoa.tuanHienTai, khoa.tongTuan), tong: khoa.tongTuan, dangDung: !!dangDung };
    }
    const tuanCk = i.tuanCuoiKhoa ?? khoa.tuanKetThuc;
    if (tuanCk) thiDuKien = { nhan: 'Cuối khoá', gt: tuanLich(tuanCk, today) };
  } else if (dangChay) {
    const batDau = dangChay.start_period_id
      ? (i.startWeekSel && i.startWeekSel.cycleId === dangChay.id ? i.startWeekSel.weekStart
        : (db().prepare('SELECT week_start FROM report_periods WHERE id = ?').get(dangChay.start_period_id) as any)?.week_start ?? null)
      : dangChay.started_at ?? null;
    /* Đang dừng: tuần học đứng ở tuần ngay trước tuần Tạm dừng (mockup 24 D1 "tuần học thứ 14 · đang dừng"); dừng ngay tuần đầu → "đang dừng". */
    const th = batDau ? tuanHocTai(batDau, today, dung) : null;
    if (th) tuanHoc = { tuan: th.tuan, tong: null, dangDung: th.dangDung };
    const ke = i.keSel && i.keSel.cycleId === dangChay.id ? i.keSel.ke : examPlanOf(dangChay);
    const gt = ke.confidence === 'none' ? null
      : ke.confidence === 'month' ? fmtExamMonth(ke.month)
      : dangChay.exam_date ? ke.label : tuanLich(ke.weekStart, today);
    if (gt) thiDuKien = { nhan: 'thi dự kiến', gt };
  }
  return {
    lop: current.class_code as string, lopId: current.class_id as number,
    /* FT: lộ trình LT1/RF… · lớp thường: mã chương trình. */
    loTrinh: khoa ? khoa.ma : dangChay?.route ?? null,
    target: khoa || !dangChay ? null : dangChay.khong_cam_ket ? 'KCK' as const : (dangChay.target_score as number | null) ?? null,
    tuanHoc, thiDuKien, gvcn: i.gvcn, tamDung,
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
  /* PR-VAI-b (KIỂM 5): Tạm dừng chuyển ghi danh sang `paused` nhưng em GIỮ lớp — đầu hồ sơ (lớp · GVCN · khoá) đọc ghi danh đó, không "Chưa xếp lớp". */
  const lopDangGiu = current ?? (s.status === 'inactive' ? enrollments.find((e) => e.status === 'paused') ?? null : null);

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
  /* PR-HSM (F8, K4-33): nhãn "dời S" / "huỷ phần" ở bảng Mock Test — MỘT câu cả lô trên lịch từng kỹ năng. */
  const kyNangCua = new Map<number, any[]>();
  if (attemptRows.length) {
    const ids = attemptRows.map((a) => a.id);
    for (let i = 0; i < ids.length; i += 900) {
      const lo = ids.slice(i, i + 900);
      for (const r of conn
        .prepare(`SELECT attempt_id, skill, sit_status, absence_move_count FROM attempt_skills WHERE required = 1 AND attempt_id IN (${lo.map(() => '?').join(',')})`)
        .all(...lo) as any[]) kyNangCua.set(r.attempt_id, [...(kyNangCua.get(r.attempt_id) ?? []), r]);
    }
  }

  const homNayHs = demoToday();
  const attempts = attemptRows.map((a) => {
    const t = typedResult(a);
    const c = caseByAttempt.get(a.id) ?? null;
    const base = {
      id: a.id, attemptNo: a.attempt_no, kind: a.kind, status: a.status, lichSu: !!a.lich_su, planSource: a.plan_source ?? null,
      /* M-14: false = MT lịch sử ngoài 4 tuần — không làm "Kết quả Test gần nhất" (ketQuaTestGanNhat). */
      sinhViec: luotSinhViecRow(a, homNayHs),
      classCode: a.class_code, periodCode: a.period_code, weekStart: a.week_start ?? null,
      mode: t.mode,
      caseId: c?.id ?? null, caseStatus: c?.status ?? null,
      /* PR-HSM (K4-33): kỹ năng từng dời do vắng / đang vắng · có phần bị huỷ mà lượt chưa huỷ. */
      doiKyNang: (kyNangCua.get(a.id) ?? []).filter((k) => k.absence_move_count > 0 || k.sit_status === 'absent').map((k) => k.skill as string),
      huyPhan: a.status !== 'cancelled' && (kyNangCua.get(a.id) ?? []).some((k) => k.sit_status === 'cancelled'),
    };
    if (t.mode === 'ratio') {
      const r = t.ratio!;
      return {
        ...base, expectation: null, bands: null, overall: null, evaluable: null,
        skills: r.skills, scored: r.scored, required: r.required,
        complete: r.complete, provisional: r.provisional,
        sosLevel: r.sosLevel, scopeNote: null, tyLeTong: r.tyLeTong,   // PR-LT2a (T58): web dựng chữ kết quả qua nhanKetQuaThuong, không đọc sosLevel
      };
    }
    const r = t.ft!;
    return {
      ...base, expectation: r.expectation, bands: r.bands, overall: r.overall, evaluable: r.evaluable, skills: null,
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

  const standingNow = standingFor([studentId]).get(studentId) ?? null;

  // Đọc MỘT LẦN, dùng lại cho cả `programme` lẫn khối `khoa` dưới — tránh gọi lại `programmeOfClass`
  // (và qua đó `isRatioClass`) hai lần cho cùng một lớp (sửa sau rà #75, vấn đề 5).
  const progHienTai = lopDangGiu ? programmeOfClass(lopDangGiu.class_id) : null;
  const gvcnHienTai = lopDangGiu
    ? (conn.prepare(
      `SELECT u.full_name FROM teacher_assignments t JOIN users u ON u.id = t.user_id
        WHERE t.class_id = ? AND t.is_core = 1 AND t.status = 'active' LIMIT 1`,
    ).get(lopDangGiu.class_id) as any)?.full_name ?? null
    : null;
  const khoaHienTai = progHienTai?.scoringMode === 'ratio' && lopDangGiu
    ? {
      ma: progHienTai.code,
      tuanHienTai: studyWeekOf(lopDangGiu.class_start_week, mondayOf(today)),
      tongTuan: progHienTai.weeks,
      tuanKetThuc: lopDangGiu.class_start_week && progHienTai.weeks ? addDays(lopDangGiu.class_start_week, (progHienTai.weeks - 1) * 7) : null,
    }
    : null;
  const startWeekSel = selected?.start_period_id
    ? (conn.prepare('SELECT week_start, code FROM report_periods WHERE id = ?').get(selected.start_period_id) as any) ?? null
    : null;
  const miniTest = (() => {
    const mt = miniTestCuaHocVien([studentId]).get(studentId);
    if (!mt) return null;
    /* PA còn mở + CHÍNH Case của nó (không lấy MIN hai cột riêng — lệch Case thì form mở sai chỗ, không có ô Mini Test). */
    /* `gv`: người dạy bổ trợ có tài khoản đầu tiên của nhóm — cùng câu với việc Mini Test ở Công việc (`mywork.ts`), trong cùng câu đọc PA. */
    const iv = db().prepare(
      `SELECT case_id, CASE WHEN status IN ('planned', 'started') THEN id END AS pa_id,
              (SELECT x.performer_user_id FROM case_interventions x WHERE x.nhom_bo_tro = ? AND x.performer_user_id IS NOT NULL ORDER BY x.id LIMIT 1) AS gv
         FROM case_interventions WHERE nhom_bo_tro = ?
        ORDER BY status NOT IN ('planned', 'started'), id LIMIT 1`,
    ).get(mt.nhom, mt.nhom) as any;
    const pa = iv?.pa_id ? db().prepare('SELECT * FROM case_interventions WHERE id = ?').get(iv.pa_id) as any : null;
    return { ...mt, caseId: iv?.case_id ?? null, paId: iv?.pa_id ?? null, gv: (iv?.gv ?? null) as number | null, coTheGhi: mt.tyLe === null && !!pa && quyenBoTro(p, pa) };
  })();
  const dai = daiHocVien(p, studentId);
  /*
   * PR-VAI-b (Q5): bảng kỹ năng dựng MỘT lần ở đây, dùng chung cho việc của em (thanh việc), câu tóm tắt và bốn ô — không hai nguồn
   * "việc gấp nhất". Web vẫn gọi `/skill-board` để vẽ bảng (cùng hàm, cùng dữ liệu).
   */
  /* Luôn dựng (kể cả chưa có lộ trình) — `skillSupportBoard` kiểm quyền theo lớp đang học thật (`activeClassOf`, K2-6e): GV chỉ dạy lớp cũ bị chặn cả hồ sơ. */
  const board = skillSupportBoard(p, studentId, selected?.id ?? null) as { rows: any[]; chuongTrinh: string | null };
  const yThucEm = trangThaiYThuc([studentId], today).get(studentId) ?? null;
  const viec = viecCuaHocVien(p, studentId, board, {
    trangThaiEm: s.status, lopId: current?.class_id ?? null, chuongTrinh: board.chuongTrinh, yThuc: yThucEm, miniTest, dai,
  });
  const thongTin = dongThongTin({ keSel: selected ? { cycleId: selected.id, ke: examPlan } : null, startWeekSel: selected ? { cycleId: selected.id, weekStart: startWeekSel?.week_start ?? null } : null, s, current: lopDangGiu, khoa: khoaHienTai, gvcn: gvcnHienTai, dangChay: allCycles.find((c) => c.status === 'active') ?? null, today,
    tuanCuoiKhoa: attemptRows.filter((a) => a.kind === 'final' && a.status !== 'cancelled' && a.week_start && a.class_id === lopDangGiu?.class_id)
      .map((a) => a.week_start as string).sort()[0] ?? null });
  const cuoiKhoaEm = (() => {
    /* MỘT câu: lớp đang học + lớp thường vừa rời (nếu có). PR-S5F-a: vừa chuyển (lên lớp / học lại / sang FT) mà lớp đang học chưa có điểm Cuối khoá
       → vẫn thấy % Cuối khoá của lớp thường vừa rời (hộp Kết luận khoá; kỳ vọng đầu ra BE/ELE — Quản lý đánh dấu được cả sau khi em đã sang FT). */
    const ds = db().prepare(
      `SELECT e.class_id, e.status, c.code, c.programme_code, c.is_fast_track FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = ? AND (e.status = 'active' OR (e.status = 'transferred' AND c.is_fast_track = 0))
        ORDER BY e.status = 'active' DESC, e.ended_at DESC, e.id DESC LIMIT 2`,
    ).all(studentId) as any[];
    const dangHoc = ds.find((r) => r.status === 'active');
    if (!dangHoc) return null;
    const kem = (r: any, x: EmCuoiKhoa | null, daChuyen: boolean) => (x ? { ...x, ct: r.programme_code ?? null, lop: r.code ?? null, daChuyen } : null);
    const dang = !dangHoc.is_fast_track && isRatioClass(dangHoc.class_id) ? cuoiKhoaTheoHocVien(dangHoc.class_id, [studentId]).get(studentId) ?? null : null;
    if (dang && dang.scored > 0) return kem(dangHoc, dang, false);   // bài Cuối khoá của lớp đang học đã có điểm
    const cu = ds.find((r) => r.status === 'transferred');
    const x = cu && isRatioClass(cu.class_id) ? cuoiKhoaTheoHocVien(cu.class_id, [studentId], { daRoi: true }).get(studentId) ?? null : null;
    return x && x.scored > 0 ? kem(cu, x, true) : kem(dangHoc, dang, false);
  })();
  const dau = boOVaCau({
    s, selected, attempts, board, viec, yThucEm, dai, thongTin, nextRow, cuoiKhoaDang: progHienTai?.scoringMode === 'ratio', khoaHienTai, today, huong: cuoiKhoaEm?.goiY?.nhanHuong ?? null,
  });

  return {
    id: s.id, studentCode: s.student_code, fullName: s.full_name, dob: s.dob, email: s.email ?? null,
    status: s.status, finishedAt: s.finished_at, archivedAt: s.archived_at,
    consultantName: s.consultant_name, note: s.note,
    currentClass: current
      ? {
        id: current.class_id, code: current.class_code, kind: current.class_kind,
        branchName: current.branch_name,
        /* Chương trình của LỚP, và GVCN — hai thứ đầu hồ sơ phải nói ngay (mục 6.2 A). */
        programme: progHienTai?.name ?? null,
        coreTeacher: gvcnHienTai,
        /*
         * KHOÁ ĐANG HỌC (Q18, PR-Qb) — chỉ lớp thường có, FT không có "tuần học của khoá" cố định.
         * Cùng cách tính `tuanKetThuc` với `hocVienLop.ts` (PR-Qa): tuần bắt đầu + (tổng tuần − 1) × 7 ngày.
         * Tính thẳng từ `progHienTai` + `class_start_week` (đã lấy sẵn ở JOIN của `enrollments` phía
         * trên) — KHÔNG gọi `isRatioClass`/`classProgressMany` riêng (bốn câu SQL thừa cho một lớp).
         */
        khoa: khoaHienTai,
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
      id: c.id, seq: c.seq, route: c.route, label: cycleLabel(c), target: c.target_score, khongCamKet: !!c.khong_cam_ket,
      examPlan: examPlanOf(c), startedAt: c.started_at, endedAt: c.ended_at, status: c.status,
      outcome: c.outcome, ratio: isRatioCycle(c),
    })),
    cycle: selected
      ? {
        id: selected.id, studentId, seq: selected.seq, route: selected.route, label: cycleLabel(selected),
        programmeCode: selected.programme_code, ratio: isRatioCycle(selected),
        target, khongCamKet: !!selected.khong_cam_ket, examPlan, startedAt: selected.started_at, endedAt: selected.ended_at,
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
        startWeek: startWeekSel,
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
          id: r.id, oldTarget: r.old_target, newTarget: r.new_target, oldKck: !!r.old_khong_cam_ket, newKck: !!r.new_khong_cam_ket,
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
          khong_cam_ket: selected.khong_cam_ket,
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
    concerns: {
      openCases: openCases.length,
      carriedOver: openCases.filter((c) => c.carriedOver).length,
      activeInterventions: openCases.reduce((n, c) => n + (c.interventionCount ?? 0), 0),
      dueOverdue: openCases.filter((c) => c.dueOverdue).length,
    },
    trajectory,
    attempts,
    progress: progressOf(attempts, isRatioCycle(selected ?? {}), cases.map((c: any) => c.id),
      selected ? selected.programme_code ?? programmeCodeOfCycle(selected.id) : null),
    cases,
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
        /* PR-LT2b (T49): đánh dấu kỳ vọng đầu ra + sửa Mini Test — chỉ Quản lý (`request.approve`). */
        coTheKetLuan: can(p, PERMISSIONS.REQUEST_APPROVE, { studentId }),
        /* PR-VAI-b (V1/K3-47): dải "n yêu cầu chờ bạn duyệt" — cùng quyền hộp Chờ duyệt (`P_DUYET` = `request.approve`); web chỉ gọi `/yeu-cau?studentId=` khi có. */
        coTheDuyet: can(p, PERMISSIONS.REQUEST_APPROVE, { studentId }),
      };
    })(),
    /** PR-VAI-b: đầu hồ sơ "hiểu trong 30 giây" (mockup 24) — em là ai · em đang thế nào · bốn ô · việc của bạn. */
    dauHoSo: {
      thongTin, viec, tomTat: dau.tomTat, o: dau.o,
      /** Kỹ năng dưới kỳ vọng ở đợt gần nhất (tên ngắn) — dựng từ CÙNG bảng kỹ năng bên dưới, hai chỗ không nói ngược nhau (mục 4.1). */
      duoi: board.rows.filter((r) => r.missed === true).map((r) => (r.short ?? r.label) as string),
    },
    lopHoc: lopHocCua(p, studentId, current),
    /** PR-CT: dải "Sắp chuyển / Đã chuyển" ngay dưới dòng thông tin đầu trang (mockup 20 — E). */
    dai,
    /** PR-LT2b: % Cuối khoá, hướng gợi ý, kết luận kỳ vọng đầu ra của lớp thường ĐANG học (null với FT / chưa có lớp). */
    /** PR-LT2b (M-05): Mini Test của em (lộ trình mới) + Case/PA để mở form Ghi kết quả cuối. */
    miniTest,
    cuoiKhoa: cuoiKhoaEm,
  };
}

export { ENTRY_SKILLS };
