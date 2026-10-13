import { db, theoLo } from '../db.ts';
import {
  CASE_CATEGORY_LABEL, INTERVENTION_KIND_LABEL, PERMISSIONS, caseCategoriesFor, caseTitle, chiaChuong, goiYCuoiKhoa, lapLaiQuaLop,
  ASSESSED_SKILLS, tenCaseSos, tenMon, tenMonNgan, tuanHocTai, type CaseCategory, type CaseChuongVao, type LopChuong, type TonePaChuong,
  mondayOfDate, hienTargetKck, nhanMt0, type AssessedSkill, type DiemMoc, type DotRef, nhanBaiThuong } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { require_, type Principal } from '../permissions.ts';
import { allProgrammes } from '../normal/regular.ts';
import { typedResult } from './profile.ts';
import { khoangTamDung } from './tamDung.ts';
import { addDays } from '../util.ts';
import { CO_THE_KHONG_THEO_DOI, awaitingCauseCaseIds } from '../cases/sosState.ts';
import { loTrinhTinhTuan } from '../fasttrack/cycles.ts';
import { mt0TheoHocVien } from '../fasttrack/mt0.ts';

/**
 * MÁY CHỦ CỦA TAB HÀNH TRÌNH (PR-Qb, spec §3.8; PR-VAI-b Task 9, mockup 26 bản 2 + bản 1) — trả dữ liệu THÔ; mọi nhãn, màu, tầng tính ở
 * `shared/domain/hanhTrinh.ts` bên nhận.
 *
 *   chuong   em đã đi qua những lớp nào (một ghi danh một chương) — `chiaChuong`; thay `/lich-su-lop` và khối "Mốc học tập"
 *   lop · tamDung · tuanHoc   hàng Lớp, dải Tạm dừng, hàng Tuần học / Tuần học của trục tuần (giai đoạn đang xem)
 *   giaiDoan · ghim · hop     trục tuần như cũ, vẫn theo `?giai-doan=`
 *
 * NGÂN SÁCH TRUY VẤN (Q20): số câu CỐ ĐỊNH, không theo số lớp / số Case — lộ trình (kèm tuần bắt đầu), lượt (JOIN lớp: chương trình
 * lấy từ JOIN, không `programmeOfClass` từng lớp), điểm, lịch kỹ năng, Case, PA, lần ghi kết quả, ghi danh + lớp, GVCN, quyết định chuyển lớp,
 * khoảng Tạm dừng, bảng chương trình (`allProgrammes` MỘT lần — `programmeByCode` chỉ nhớ trong request GET, gọi ngoài request thì mỗi
 * Case / lượt lại đọc bảng). Lượt cũ chưa có dòng lịch kỹ năng: kỹ năng bỏ qua lấy theo lô từ `attempt_skill_skips` (cùng luật `skipsOf`).
 * Danh sách `IN` đi qua `theoLo`.
 */

type GiaiDoanLoai = 'thuong' | 'ft';

/** Hạng mục Case ↔ hộp kỹ năng đang xem: writing1/2 ghép vào "writing" khi hộp là lớp thường, ngược lại bỏ. */
function anhXaHangMuc(category: string | null, boHop: readonly CaseCategory[]): CaseCategory | null {
  if (!category) return null;
  if ((boHop as readonly string[]).includes(category)) return category as CaseCategory;
  if ((category === 'writing1' || category === 'writing2') && boHop.includes('writing')) return 'writing';
  return null;
}

const soTuanGiua = (tu: string, den: string) => Math.max(1, Math.round((Date.parse(den) - Date.parse(tu)) / (7 * 86_400_000)) + 1);

export function hanhTrinhHocVien(p: Principal, studentId: number, giaiDoanMuon: GiaiDoanLoai | null) {
  const conn = db();
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  const homNay = demoToday();

  // -------------------------------------------------------------- (1) lộ trình (kèm tuần bắt đầu) + giai đoạn
  const cycles = conn.prepare(
    `SELECT cy.*, rp.week_start AS start_week FROM learning_cycles cy LEFT JOIN report_periods rp ON rp.id = cy.start_period_id
      WHERE cy.student_id = ? ORDER BY cy.seq`,
  ).all(studentId) as any[];
  const moiCycleIds = cycles.map((c) => c.id);

  // -------------------------------------------------------------- (2) lượt đánh giá của MỌI lộ trình (một câu; chương trình lớp từ JOIN)
  const attemptRows: any[] = [];
  theoLo(moiCycleIds, (lo, ph) => {
    attemptRows.push(...conn.prepare(
      `SELECT a.*, c.code AS class_code, c.programme_code AS class_programme, pr.week_start AS week_start,
              (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route
         FROM assessment_attempts a
         LEFT JOIN classes c ON c.id = a.class_id
         LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
        WHERE a.cycle_id IN (${ph}) AND a.status != 'cancelled'`,
    ).all(...lo) as any[]);
  });
  attemptRows.sort((x, y) => x.cycle_id - y.cycle_id || x.attempt_no - y.attempt_no);
  /* PR-S6F-b: chương trình của lộ trình thiếu `programme_code` lấy từ lượt đã nạp (cùng luật `programmeCodeOfCycle`, không hỏi lại mỗi lộ trình). */
  const maCtCuaCycle = new Map<number, string>();
  for (const a of attemptRows) if (a.kind !== 'mt0' && a.class_programme && !maCtCuaCycle.has(a.cycle_id)) maCtCuaCycle.set(a.cycle_id, a.class_programme);   // PR-MT0: MT0 mang lớp thường cũ

  const progs = allProgrammes();
  const progOf = (code: string | null | undefined) => (code ? progs.get(code) ?? null : null);
  const ratioOf = new Map<number, boolean>();
  /* Cùng luật `isRatioCycle`, tra bảng chương trình đã nạp. */
  for (const c of cycles) ratioOf.set(c.id, !c.route && progOf(c.programme_code ?? maCtCuaCycle.get(c.id))?.scoringMode === 'ratio');
  const thuongCycles = cycles.filter((c) => ratioOf.get(c.id));
  const ftCycles = cycles.filter((c) => !ratioOf.get(c.id));
  const dungGiaiDoan = (list: any[]): { tu: string; den: string | null } | null => {
    if (!list.length) return null;
    const sorted = [...list].sort((a, b) => a.started_at.localeCompare(b.started_at));
    return { tu: sorted[0].started_at, den: sorted[sorted.length - 1].ended_at ?? null };
  };
  const cacGiaiDoan: { loai: GiaiDoanLoai; tu: string; den: string | null }[] = [];
  const khoangThuong = dungGiaiDoan(thuongCycles);
  if (khoangThuong) cacGiaiDoan.push({ loai: 'thuong', ...khoangThuong });
  const khoangFt = dungGiaiDoan(ftCycles);
  if (khoangFt) cacGiaiDoan.push({ loai: 'ft', ...khoangFt });
  const current = [...cycles].sort((a, b) => (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) || b.seq - a.seq)[0] ?? null;
  const giaiDoan: GiaiDoanLoai | null = giaiDoanMuon ?? (current ? (ratioOf.get(current.id) ? 'thuong' : 'ft') : null);
  const chonCycles = (giaiDoan === 'thuong' ? thuongCycles : giaiDoan === 'ft' ? ftCycles : []).slice()
    .sort((a, b) => a.started_at.localeCompare(b.started_at));
  const ratio = giaiDoan === 'thuong';
  const cuoi = chonCycles[chonCycles.length - 1];
  /* MH2, PF6: tên môn + bộ hộp theo chương trình của khoá mới nhất trong giai đoạn (FOU G+V/P, Pre FOU một hộp Tổng hợp). */
  const ct: string | null = ratio && cuoi ? cuoi.programme_code ?? maCtCuaCycle.get(cuoi.id) ?? null : null;
  const cycleIds = chonCycles.map((c) => c.id);

  const attemptIds = attemptRows.map((a) => a.id);

  // -------------------------------------------------------------- (3) điểm + phạm vi kỹ năng các lượt (bulk)
  const scoresByAttempt = new Map<number, any[]>();
  const skipsByAttempt = new Map<number, AssessedSkill[]>();
  const coDongKyNang = new Set<number>();
  const kyNangByAttempt = new Map<number, any[]>();   // OV-1c: xét chốt
  theoLo(attemptIds, (lo, ph) => {
    for (const r of conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id IN (${ph})`).all(...lo) as any[]) {
      scoresByAttempt.set(r.attempt_id, [...(scoresByAttempt.get(r.attempt_id) ?? []), r]);
    }
    for (const r of conn.prepare(`SELECT attempt_id, skill, required, sit_status, absence_move_count FROM attempt_skills WHERE attempt_id IN (${ph})`).all(...lo) as any[]) {
      coDongKyNang.add(r.attempt_id);
      kyNangByAttempt.set(r.attempt_id, [...(kyNangByAttempt.get(r.attempt_id) ?? []), r]);
      if (!r.required) skipsByAttempt.set(r.attempt_id, [...(skipsByAttempt.get(r.attempt_id) ?? []), r.skill]);
    }
  });
  /* Lượt cũ chưa có dòng `attempt_skills` → bảng cũ `attempt_skill_skips` (như `skipsOf`), một câu theo lô thay vì một câu mỗi lượt. */
  theoLo(attemptIds.filter((id) => !coDongKyNang.has(id)), (lo, ph) => {
    for (const r of conn.prepare(`SELECT attempt_id, skill FROM attempt_skill_skips WHERE attempt_id IN (${ph})`).all(...lo) as any[]) {
      if ((ASSESSED_SKILLS as readonly string[]).includes(r.skill)) skipsByAttempt.set(r.attempt_id, [...(skipsByAttempt.get(r.attempt_id) ?? []), r.skill]);
    }
  });
  const typed = new Map<number, ReturnType<typeof typedResult>>();
  for (const a of attemptRows) {
    typed.set(a.id, typedResult(a, { scores: scoresByAttempt.get(a.id) ?? [], skips: skipsByAttempt.get(a.id) ?? [], prog: a.class_id ? progOf(a.class_programme) : null },
      kyNangByAttempt.get(a.id) ?? []));
  }

  // -------------------------------------------------------------- (4) Case · (5) PA · (6) lần ghi kết quả — của MỌI lộ trình
  const caseRows = conn
    .prepare(
      `SELECT sc.*, a.attempt_no AS attempt_no, a.kind AS attempt_kind, ${CO_THE_KHONG_THEO_DOI('sc')} AS co_the_ktd,
              (SELECT cy.programme_code FROM learning_cycles cy WHERE cy.id = sc.cycle_id) AS cycle_programme,
              (SELECT cy.route FROM learning_cycles cy WHERE cy.id = sc.cycle_id) AS cycle_route
         FROM sos_cases sc
         LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE sc.student_id = ?`,
    )
    .all(studentId) as any[];
  const allCaseIds = caseRows.map((c) => c.id as number);
  const ivRows: any[] = [];
  theoLo(allCaseIds, (lo, ph) => {
    ivRows.push(...conn.prepare(`SELECT iv.*, u.full_name AS performer_user_name FROM case_interventions iv LEFT JOIN users u ON u.id = iv.performer_user_id
        WHERE iv.case_id IN (${ph}) AND iv.status != 'cancelled'`).all(...lo) as any[]);
  });
  ivRows.sort((x, y) => x.id - y.id);
  const ivByCase = new Map<number, any[]>();
  for (const iv of ivRows) ivByCase.set(iv.case_id, [...(ivByCase.get(iv.case_id) ?? []), iv]);
  const noiTiepTuOf = new Map<number, number>();
  for (const iv of ivRows) if (iv.superseded_by != null) noiTiepTuOf.set(iv.superseded_by, iv.id);
  const lastOutcomeOf = new Map<number, string>();
  const fuRows: any[] = [];
  theoLo(allCaseIds, (lo, ph) => {
    fuRows.push(...conn.prepare(`SELECT id, intervention_id, outcome, observed_on FROM case_followups WHERE outcome IS NOT NULL AND case_id IN (${ph})`).all(...lo) as any[]);
  });
  fuRows.sort((x, y) => String(x.observed_on).localeCompare(String(y.observed_on)) || x.id - y.id);
  for (const r of fuRows) if (r.intervention_id != null) lastOutcomeOf.set(r.intervention_id, r.outcome);

  // -------------------------------------------------------------- (7) ghi danh + lớp · (8) GVCN · (9) quyết định chuyển lớp · (10) Tạm dừng
  const enr = conn.prepare(
    `SELECT e.*, c.code AS class_code, c.programme_code AS class_programme, c.is_fast_track, c.so_tuan, rp.week_start AS class_start
       FROM enrollments e JOIN classes c ON c.id = e.class_id LEFT JOIN report_periods rp ON rp.id = c.start_period_id
      WHERE e.student_id = ? ORDER BY e.started_at, e.id`,
  ).all(studentId) as any[];
  const lopIds = [...new Set(enr.map((e) => e.class_id as number))];
  const gvcnRows: any[] = [];
  theoLo(lopIds, (lo, ph) => {
    gvcnRows.push(...conn.prepare(
      `SELECT ta.id, ta.class_id, ta.effective_from, ta.effective_to, ta.status, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.is_core = 1 AND ta.class_id IN (${ph})`,
    ).all(...lo) as any[]);
  });
  gvcnRows.sort((x, y) => (x.status === 'active' ? 0 : 1) - (y.status === 'active' ? 0 : 1) || y.id - x.id);
  const lenhRows = conn.prepare(
    `SELECT id, lop_nguon_id, xac_nhan_luc FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'da_chuyen' ORDER BY id`,
  ).all(studentId) as any[];
  /* PR-S6F-b: Tạm dừng và Quay lại CÙNG tuần không trừ tuần nào (`tuanHocFt`) → không có khoảng để vẽ trên trục / chương. */
  const dung = (khoangTamDung([studentId])[studentId] ?? []).map(({ tu, den }) => ({ tu, den }))
    .filter((k) => k.den === null || mondayOfDate(k.tu) !== mondayOfDate(k.den));

  // -------------------------------------------------------------- ghim (đợt Test) — mọi lộ trình; trục chỉ lấy giai đoạn đang xem
  /* Chương nhận cả lượt chưa xếp tuần (như lịch sử lớp cũ); trục tuần chỉ vẽ lượt có tuần. */
  /* PR-MT0: nhãn ghim MT0 theo trạng thái suy ra — `MT0` (dùng / chờ) hoặc `MT0 · không dùng`. */
  const mt0 = attemptRows.some((a) => a.kind === 'mt0') ? mt0TheoHocVien([studentId]).get(studentId) ?? null : null;
  const ghimMoi = attemptRows
    .map((a) => {
      const t = typed.get(a.id)!;
      const chung = { attemptId: a.id, classId: (a.class_id as number | null) ?? null, cycleId: a.cycle_id as number, tuan: (a.week_start ?? null) as string | null, attemptNo: a.attempt_no, kind: a.kind,
        maLop: (a.class_code as string | null) ?? null };
      if (t.mode === 'ratio') {
        const r = t.ratio!;
        return {
          ...chung, cheDo: 'ratio' as const, nhanNgan: nhanBaiThuong(a.kind),
          overall: null, sosLevel: r.sosLevel, soDat: r.skills.filter((s) => s.outcome === 'pass').length, soYeuCau: r.required, soCoDiem: r.scored,
          kyVong: null as number | null,
          kyNangChuaDat: r.skills.filter((s) => s.outcome === 'fail').map((s) => s.skill as string),
          khongChiaMon: r.skills.length === 1 && r.skills[0].skill === 'tong_hop', tyLe: r.tyLeTong,
          /* PR-LT2b: hướng gợi ý Cuối khoá (chỉ Cuối khoá đủ điểm) — cùng luật `goiYCuoiKhoa`. */
          goiY: a.kind === 'final' && a.class_programme
            ? goiYCuoiKhoa({ ct: a.class_programme, tyLe: r.tyLeTong, monTruot: r.skills.filter((s) => s.outcome === 'fail').map((s) => s.skill as string), nguong: r.passThreshold }) : null,
        };
      }
      const r = t.ft!;
      if (a.kind === 'mt0') {
        return {
          ...chung, cheDo: 'ielts' as const, nhanNgan: nhanMt0(mt0 && mt0.attemptId === a.id ? mt0.trangThai : a.route ? 'dung' : 'khong_dung'), lichSu: !!a.lich_su,
          overall: r.overall, sosLevel: null, soDat: null, soYeuCau: r.required.length, soCoDiem: r.scoredRequired, kyVong: null,
          kyNangChuaDat: [] as string[],
        };
      }
      return {
        ...chung, cheDo: 'ielts' as const, nhanNgan: `MT${a.attempt_no}`, lichSu: !!a.lich_su,
        overall: r.overall, sosLevel: r.sosLevel, soDat: null, soYeuCau: r.required.length, soCoDiem: r.scoredRequired, kyVong: r.expectation, chot: r.chot,
        kyNangChuaDat: r.verdicts.filter((v) => v.passed === false).map((v) => v.skill as string),
      };
    });
  const ghim = ghimMoi.filter((g): g is typeof g & { tuan: string } => !!g.tuan && cycleIds.includes(g.cycleId));

  // -------------------------------------------------------------- tên Case (một luật cho trục và chương)
  const choNguyenNhan = new Set(awaitingCauseCaseIds(caseRows.filter((c) => c.status !== 'done').map((c) => c.id as number)));
  const tenCaseCua = (c: any): string => {
    const ctCase: string | null = c.cycle_programme ?? null;
    const ratioCase = !c.cycle_route && !!ctCase && progOf(ctCase)?.scoringMode === 'ratio';
    /* PR-SOS T21: Case SOS Fast Track = `[MT1] {phần giữa} [SOS 3]` như `caseTitleOf` (không gọi nó — mỗi Case một truy vấn). Lớp thường
       không mượn "… dưới kỳ vọng" của Fast Track. */
    if (c.origin_kind === 'mock' && (c.attempt_kind ?? 'mock') === 'mock') {
      return tenCaseSos({ mt: c.attempt_no ?? null, giua: (c.title ?? '').trim() || `${tenMon(ctCase, c.category ?? c.topic ?? '')} không đạt`, sos: c.sos_level ?? null, kck: c.kck });
    }
    return (c.title ?? '').trim() || (ratioCase
      ? `${tenMon(ctCase, c.category ?? c.topic ?? '')} chưa đạt`
      : caseTitle({ category: c.category ?? c.topic, latestAttemptNo: c.attempt_no, latestAttemptKind: c.attempt_kind }));
  };

  // -------------------------------------------------------------- hop (hộp kỹ năng của trục) — giai đoạn đang xem
  const casesInGiaiDoan = caseRows.filter((c) => {
    if (c.cycle_id != null) return cycleIds.includes(c.cycle_id);
    if (!c.detected_at) return false;
    const kh = giaiDoan === 'thuong' ? khoangThuong : khoangFt;
    if (!kh) return false;
    return c.detected_at >= kh.tu && (!kh.den || c.detected_at <= kh.den);
  });
  const attemptGiaiDoan = attemptRows.filter((a) => cycleIds.includes(a.cycle_id));
  const boHop = giaiDoan ? caseCategoriesFor(ratio ? 'ratio' : 'ielts_band', ct) : [];
  const hop = boHop.map((kyNang) => {
    const diem: DiemMoc[] = [];
    let conCho = false;
    let dotCho: DotRef | null = null;
    /* Lượt `planned` ĐẦU TIÊN chưa có điểm kỹ năng này — mốc "?" gọi tên đợt đó. */
    const choDiem = (a: any, cheDo: DotRef['cheDo']) => {
      if (a.status !== 'planned') return;
      if (!conCho) dotCho = { cheDo, attemptNo: a.attempt_no, kind: a.kind, maLop: a.class_code ?? null };
      conCho = true;
    };
    for (const a of attemptGiaiDoan) {
      if (ratio && a.kind === 'mt0') continue;   // PR-MT0: band MT0 không thuộc hàng môn tỷ lệ; MT0 chưa điểm không là mốc "?"
      const t = typed.get(a.id)!;
      if (t.mode === 'ratio') {
        const s = t.ratio!.skills.find((x) => x.skill === kyNang);
        if (!s) continue;
        if (s.score === null) { choDiem(a, 'ratio'); continue; }
        diem.push({ gt: s.score, tong: s.total, chuaDat: s.outcome === 'fail', nguong: t.ratio!.passThreshold, attemptNo: a.attempt_no, kind: a.kind, maLop: a.class_code ?? null, kyVong: null, attemptId: a.id, classId: a.class_id ?? null });
      } else {
        const band = scoresByAttempt.get(a.id)?.find((x) => x.skill === kyNang)?.band ?? null;
        if (band === null) { choDiem(a, 'ielts'); continue; }
        const exp = t.ft!.expectation;
        diem.push({ gt: band, tong: null, chuaDat: exp !== null && band < exp, attemptNo: a.attempt_no, kind: a.kind, maLop: a.class_code ?? null, kyVong: exp, attemptId: a.id, classId: a.class_id ?? null });
      }
    }
    const casesOfSkill = casesInGiaiDoan.filter((c) => anhXaHangMuc(c.category ?? c.topic, boHop) === kyNang);
    const openCases = casesOfSkill.filter((c) => c.status !== 'done');
    const doneCases = casesOfSkill.filter((c) => c.status === 'done');
    const moiNhat = [...doneCases].sort((x, y) => String(y.closed_at ?? '').localeCompare(String(x.closed_at ?? '')))[0];
    const vanDe = casesOfSkill.map((c) => {
      const ivs = ivByCase.get(c.id) ?? [];
      /* PR-SOS: PA quy chế "Chờ xác nhận" chưa có ngày bắt đầu (mốc tính lúc xác nhận) — chưa vẽ khối trên trục tuần. */
      const pa = ivs.filter((iv) => iv.started_date ?? iv.planned_date).map((iv) => ({
        id: iv.id, ten: caseInterventionLabel(iv.kind), tu: iv.started_date ?? iv.planned_date, den: iv.completed_date ?? null,
        status: iv.status, lastOutcome: lastOutcomeOf.get(iv.id) ?? null,
        followupOverdue: iv.status !== 'completed' && !!iv.action_due && iv.action_due < homNay,
        soNgayQuaHan: iv.status !== 'completed' && iv.action_due && iv.action_due < homNay
          ? Math.max(1, Math.round((Date.parse(homNay) - Date.parse(iv.action_due)) / 86_400_000)) : null,
        supersededBy: iv.superseded_by ?? null, noiTiepTu: noiTiepTuOf.get(iv.id) ?? null,
        /* PR-VAI-b (Q18, R5-2): PA chưa chạy vì chờ Quản lý duyệt PA — vẽ khối "chờ", không phải "Chưa có PA" (PR-CT2: bỏ chờ duyệt kế hoạch bổ trợ). */
        cho: (iv.approval_state ?? '') === 'pending' ? 'duyet' as const : null,
      }));
      return {
        caseId: c.id, ten: tenCaseCua(c), sos: ratio ? null : c.sos_level ?? null, attemptNo: c.attempt_no ?? null,
        mo: c.detected_at, dong: c.status === 'done' ? (c.closed_at ?? c.outcome_at ?? null) : null,
        soPa: ivs.length, pa,
        /* Cột tên hàng PA: "2 phương án · {người}" (mockup 26 bản 1) — người ghi PA mới nhất. */
        nguoi: (ivs.at(-1)?.performer_user_name ?? ivs.at(-1)?.performer_name ?? null) as string | null,
        /* Q18: Case chờ nguyên nhân — khối chờ (viền đứt tím) với chữ đúng. PR-CT2: PA Bổ trợ chạy ngay khi có nguyên nhân. */
        cho: c.status !== 'done' && choNguyenNhan.has(c.id) ? 'nguyen-nhan' as const : null,
      };
    });
    return {
      kyNang, nhan: ratio ? tenMon(ct, kyNang) : CASE_CATEGORY_LABEL[kyNang], nhanNgan: tenMonNgan(ratio ? ct : null, kyNang), cheDo: ratio ? ('ratio' as const) : ('ielts' as const),
      diem, conCho, dotCho: dotCho as DotRef | null,
      caseMo: openCases.map((c) => ({ mo: c.detected_at, soPa: (ivByCase.get(c.id) ?? []).length, choNguyenNhan: choNguyenNhan.has(c.id), choDuyet: !!c.co_the_ktd })),
      coTungCase: casesOfSkill.length > 0, diemCuoiChuaDat: diem.length ? diem[diem.length - 1].chuaDat : null,
      xongGanNhat: !openCases.length && doneCases.length
        ? doneCases.reduce((mx: string | null, c) => { const d = c.closed_at ?? c.outcome_at ?? c.detected_at; return d && (!mx || d > mx) ? d : mx; }, null as string | null)
        : null,
      huyGanNhat: !openCases.length && !!moiNhat && !!(moiNhat.dismiss_reason_code || moiNhat.system_close_reason),
      vanDe,
    };
  });

  // -------------------------------------------------------------- chương theo lớp (mockup 26 bản 2)
  const gvcnCua = (e: any): string | null => {
    const den = e.ended_at ?? homNay;
    return gvcnRows.find((g) => g.class_id === e.class_id && g.effective_from <= den && (!g.effective_to || g.effective_to >= e.started_at))?.full_name
      ?? gvcnRows.find((g) => g.class_id === e.class_id)?.full_name ?? null;
  };
  const lop: LopChuong[] = enr.map((e) => {
    const ft = !!e.is_fast_track;
    /*
     * PR-S6F-b (D17): ghi danh `paused` chưa có ngày rời = em đang Tạm dừng (setStudentStatus đổi mọi ghi danh active/paused theo trạng thái em;
     * thôi học thì thành `completed`) — chương đó vẫn là chương ĐANG HỌC, không chân "Tạm dừng học (bảo lưu)". Tuần học qua `tuanHocTai` (= đầu hồ sơ).
     */
    const dangDung = e.status === 'paused' && !e.ended_at;
    const dangHoc = e.status === 'active' || dangDung;
    const cy = ft ? loTrinhTinhTuan(ftCycles, { dangHoc, ngayVao: e.started_at }) : null;   // PR-Dọn Q11: chương đang học → lộ trình đang chạy (nhãn, mục tiêu)
    /* PR-HK2: đang học mà không có lộ trình `active` → KHÔNG ghi tuần học (không rơi về lộ trình gần nhất) — khớp profile / transition. */
    const cyTuan = dangHoc && cy?.status !== 'active' ? null : cy;
    const batDau = cyTuan ? cyTuan.start_week ?? cyTuan.started_at : null;
    const hienTai = cyTuan && batDau && dangHoc ? tuanHocTai(batDau, homNay, dung) : null;
    const tuanHoc = cyTuan && batDau ? {
      tu: dangHoc ? hienTai?.tuan ?? null : tuanHocTai(batDau, e.started_at, dung)?.tuan ?? 1,
      /* Rời lớp trong tuần dừng → tuần học cuối TRƯỚC tuần dừng (không null). */
      den: dangHoc ? null : e.ended_at ? tuanHocTai(batDau, addDays(e.ended_at, -1), dung)?.tuan ?? null : null,
      dangDung: hienTai?.dangDung ?? false,
    } : null;
    const lenh = lenhRows.filter((l) => l.lop_nguon_id === e.class_id).at(-1);
    const target = cy && (cy.khong_cam_ket || cy.target_score != null)   // OV-9: "6.5 · KCK"
      ? hienTargetKck(cy.target_score != null ? Number(cy.target_score).toFixed(1) : null, !!cy.khong_cam_ket) : null;
    return {
      enrollmentId: e.id, classId: e.class_id, code: e.class_code, ngan: String(e.class_code).split(' ').slice(1).join(' ') || e.class_code,
      nhan: ft ? ['FT', cy?.route, dangHoc ? 'đang học' : target ? `Target ${target}` : null].filter(Boolean).join(' · ') : `${e.class_programme ?? '—'} · lớp thường`,
      ct: e.class_programme ?? null, ft, tu: e.started_at, den: e.ended_at ?? null, dangHoc,
      soTuan: ft ? null : soTuanGiua(e.started_at, e.ended_at ?? homNay), tuanHoc,
      gvcn: gvcnCua(e), endKind: e.end_kind ?? null, status: e.status, endReason: e.end_reason ?? null,
      lenh: lenh ? { id: lenh.id, xacNhan: !!lenh.xac_nhan_luc } : null,
    };
  });
  const toneCua = (iv: any): TonePaChuong => {
    if ((iv.approval_state ?? '') === 'pending' || (iv.kind === 'bo_tro' && iv.status === 'planned') || (iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned')) return 'wait';
    if (iv.status !== 'completed') return 'run';
    const o = lastOutcomeOf.get(iv.id);
    return o === 'improved' ? 'ok' : o === 'partial' ? 'part' : o === 'unchanged' || o === 'worse' ? 'bad' : 'done';
  };
  const casesChuong: CaseChuongVao[] = caseRows.filter((c) => c.detected_at).map((c) => ({
    caseId: c.id, ten: tenCaseCua(c), kyNang: tenMon(c.cycle_programme ?? null, c.category ?? c.topic ?? ''),
    sos: c.cycle_route ? c.sos_level ?? null : null, mo: c.detected_at, dong: c.status === 'done' ? (c.closed_at ?? c.outcome_at ?? null) : null,
    pa: (ivByCase.get(c.id) ?? []).map((iv) => ({ id: iv.id, ten: (iv.description ?? '').trim() || caseInterventionLabel(iv.kind), tu: iv.started_date ?? iv.planned_date ?? null, tone: toneCua(iv) })),
  }));
  /* Chương chỉ kể đợt ĐÃ có điểm (kết quả), không kể lượt còn chờ. */
  const chuong = chiaChuong({ lop, ghim: ghimMoi.filter((g) => g.soCoDiem > 0), cases: casesChuong, tamDung: dung, homNay });

  // -------------------------------------------------------------- hàng Lớp · Tuần học / Tuần học của trục (giai đoạn đang xem)
  const chuongGd = chuong.filter((c) => (giaiDoan === 'ft' ? c.ft : !c.ft));
  const lopTruc = chuongGd.map((c, k) => ({ code: c.code, ngan: c.ngan, gvcn: c.gvcn, tu: c.tu, den: c.den, chuyen: k > 0 }));
  const tuanHoc = giaiDoan === 'ft'
    ? { loai: 'ft' as const, ds: ftCycles.map((c) => ({ batDau: c.start_week ?? c.started_at, tu: c.started_at, den: c.ended_at ?? null })) }
    : giaiDoan === 'thuong'
      ? { loai: 'khoa' as const, ds: enr.filter((e) => !e.is_fast_track).map((e) => ({ batDau: e.class_start ?? e.started_at, tong: e.so_tuan ?? null, tu: e.started_at, den: e.ended_at ?? null })) }
      : null;

  return {
    giaiDoan, cacGiaiDoan, homNay, ghim, hop, chuongTrinh: ct,
    chuong, lapLai: lapLaiQuaLop(chuong), lop: lopTruc, tamDung: dung, tuanHoc,
  };
}

function caseInterventionLabel(kind: string): string {
  return (INTERVENTION_KIND_LABEL as Record<string, string>)[kind] ?? kind;
}
