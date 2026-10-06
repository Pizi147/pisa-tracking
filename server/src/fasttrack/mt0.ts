/**
 * MT0 MÁY CHỦ (PR-MT0, đặc tả T5, T5b) — luật thuần ở `shared/domain/mt0.ts`; file này tạo / mở lại / huỷ / nối / đọc MT0 theo lô.
 * MT0 = `assessment_attempts` `kind = 'mt0'`, `attempt_no = 0`, gắn khoá lớp thường đang chạy (`route IS NULL`). Không bao giờ xoá dòng
 * hay điểm: huỷ = `status = 'cancelled'`, mở lại được. Mọi hàm ghi chạy TRONG `tx` của thao tác gây ra nó; số câu SQL không tăng theo số em.
 */
import { chenNhieuDong, db, theoLo } from '../db.ts';
import {
  ASSESSED_SKILLS, MT0_CHUONG_TRINH, PERMISSIONS, addDaysIso, coMt0, hanChamMt0, hanChotLenFt, kyNangSosMt0, trangThaiMt0, tuanLich,
  type AssessedSkill, type Huong, type ProgrammeCode, type TrangThaiMt0,
} from '../../../shared/domain/index.ts';
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { ensurePeriods } from '../platform/week.ts';
import { classProgressMany } from '../classes/schedule.ts';
import { assessedBands } from './scoring.ts';
import { can, type Principal } from '../permissions.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { nho } from '../platform/nguCanhRequest.ts';


export type DongMt0 = { studentId: number; classId: number; ma: ProgrammeCode | null; huong: Huong; mucTieu: number | null };

/**
 * ĐỒNG BỘ MT0 sau khi ghi hướng Lộ trình tiếp theo (một em hoặc cả lớp) — gọi TRONG `tx`.
 * Lên FT (FOU/BE/ELE): chưa có → tạo ở tuần Cuối khoá của lớp; đã huỷ → mở lại; chưa điểm → cập nhật Target.
 * Hướng khác: MT0 chưa điểm → huỷ ("Bỏ hướng Lên FT"); có điểm → giữ (trạng thái suy ra "không dùng").
 */
export function dongBoMt0(actorUserId: number, dongs: readonly DongMt0[]): void {
  if (!dongs.length) return;
  const conn = db();
  const now = nowIso();
  const sids = dongs.map((d) => d.studentId);
  /* Khoá lớp thường đang chạy + MT0 của khoá đó (kể cả đã huỷ) + có điểm chưa — MỘT câu mỗi lô. */
  const khoa = new Map<number, { cycleId: number; target: number | null; mt0: { id: number; status: string; coDiem: boolean; classId: number | null } | null }>();
  theoLo(sids, (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT cy.id AS cycle_id, cy.student_id, cy.target_score, a.id AS mt0_id, a.status, a.class_id,
              EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)) AS co_diem
         FROM learning_cycles cy LEFT JOIN assessment_attempts a ON a.cycle_id = cy.id AND a.kind = 'mt0'
        WHERE cy.status = 'active' AND cy.route IS NULL AND cy.student_id IN (${ph})`,
    ).all(...lo) as any[]) {
      khoa.set(r.student_id, {
        cycleId: r.cycle_id, target: r.target_score ?? null,
        mt0: r.mt0_id ? { id: r.mt0_id, status: r.status, coDiem: !!r.co_diem, classId: r.class_id ?? null } : null,
      });
    }
  });

  const tao: (DongMt0 & { cycleId: number; target: number | null })[] = [];
  const moLai: number[] = [];
  /** MT0 mở lại mà em đã sang lớp khác (chuyển giữ khoá — MT0 bị huỷ "Chuyển lớp") → theo lớp mới, tuần Final lớp mới. */
  const doiLop: { id: number; classId: number }[] = [];
  const huy: number[] = [];
  const doiTarget = new Map<number | null, number[]>();
  for (const d of dongs) {
    const k = khoa.get(d.studentId);
    if (!k) continue;   // dữ liệu cũ chưa có khoá lớp thường đang chạy — bỏ qua, không lỗi
    const target = d.mucTieu ?? k.target;
    if (coMt0(d.ma, d.huong)) {
      if (!k.mt0) { tao.push({ ...d, cycleId: k.cycleId, target }); continue; }
      if (k.mt0.status === 'cancelled') {
        moLai.push(k.mt0.id);
        if (!k.mt0.coDiem && k.mt0.classId !== d.classId) doiLop.push({ id: k.mt0.id, classId: d.classId });
      }
      if (!k.mt0.coDiem) doiTarget.set(target, [...(doiTarget.get(target) ?? []), k.mt0.id]);
    } else if (k.mt0 && k.mt0.status !== 'cancelled' && !k.mt0.coDiem) {
      huy.push(k.mt0.id);
    }
  }

  if (huy.length) huyMt0(actorUserId, huy, 'Bỏ hướng Lên FT');
  if (moLai.length) {
    theoLo(moLai, (lo, ph) => {
      conn.prepare(`UPDATE assessment_attempts SET status = 'planned', cancel_reason = NULL, cancelled_at = NULL, updated_at = ? WHERE id IN (${ph})`).run(now, ...lo);
    });
    chenNhieuDong('INSERT INTO attempt_schedule_history (attempt_id, action, reason, actor_user_id, created_at)',
      moLai.map((id) => [id, 'reopened', 'Chọn lại Lên FT', actorUserId, now]));
  }
  for (const [target, ids] of doiTarget) {
    theoLo(ids, (lo, ph) => {
      conn.prepare(`UPDATE assessment_attempts SET target_at_attempt = ? WHERE id IN (${ph})`).run(target, ...lo);
    });
  }
  if (!tao.length && !doiLop.length) return;

  /* Tuần Cuối khoá của lớp — một lần cho mọi lớp trong lô (thường chỉ một lớp). Lớp chưa có tuần Cuối khoá → MT0 chưa xếp. */
  const cacLop = [...new Set([...tao.map((d) => d.classId), ...doiLop.map((x) => x.classId)])];
  const tienDo = classProgressMany(cacLop);
  const tuanCua = (classId: number) => tienDo.get(classId)?.finalWeekStart ?? null;
  const ky = ensurePeriods([...new Set(cacLop.map(tuanCua).filter((x): x is string => !!x))]);
  const kyCua = (classId: number) => { const t = tuanCua(classId); return t ? ky.get(t) ?? null : null; };
  /* Một UPDATE mỗi lớp đích (thường một lớp), không theo số em. */
  for (const lop of new Set(doiLop.map((x) => x.classId))) {
    const ids = doiLop.filter((x) => x.classId === lop).map((x) => x.id);
    const pid = kyCua(lop)?.id ?? null;
    theoLo(ids, (lo, ph) => {
      conn.prepare(`UPDATE assessment_attempts SET class_id = ?, planned_period_id = ?, plan_source = 'auto', updated_at = ? WHERE id IN (${ph})`).run(lop, pid, now, ...lo);
      conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'auto', updated_at = ? WHERE attempt_id IN (${ph})`).run(pid, now, ...lo);
    });
  }
  if (!tao.length) return;
  chenNhieuDong(
    `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, plan_source, status, target_at_attempt, created_by, created_at)`,
    tao.map((d) => [d.cycleId, d.studentId, 0, 'mt0', d.classId, kyCua(d.classId)?.id ?? null, 'auto', 'planned', d.target, actorUserId, now]),
  );
  /* INSERT nhiều dòng không trả id → đọc lại MỘT câu theo khoá (UNIQUE cycle_id, attempt_no). */
  const moi: { id: number; cycle_id: number; student_id: number; planned_period_id: number | null }[] = [];
  theoLo(tao.map((d) => d.cycleId), (lo, ph) => {
    moi.push(...conn.prepare(`SELECT id, cycle_id, student_id, planned_period_id FROM assessment_attempts WHERE kind = 'mt0' AND cycle_id IN (${ph})`).all(...lo) as any[]);
  });
  chenNhieuDong(
    'INSERT INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source, sit_status, created_at)',
    moi.flatMap((a) => ASSESSED_SKILLS.map((k) => [a.id, k, 1, a.planned_period_id, 'auto', 'scheduled', now])),
  );
  chenNhieuDong('INSERT INTO attempt_schedule_history (attempt_id, action, actor_user_id, created_at)',
    moi.map((a) => [a.id, 'created', actorUserId, now]));
  const tuanTheoKy = new Map([...ky.values()].map((p) => [p.id, p.weekStart]));
  chenNhieuDong(
    'INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, ref_table, ref_id, dedup_key, created_by, created_at)',
    moi.map((a) => {
      const tuan = a.planned_period_id ? tuanTheoKy.get(a.planned_period_id) ?? null : null;
      return [a.student_id, a.cycle_id, 'mock_scheduled', tuan ?? demoToday(), tuan ? `MT0 · ${tuanLich(tuan)}` : 'MT0',
        'assessment_attempts', a.id, `mt0:${a.id}:tao`, actorUserId, now];
    }),
  );
}

/** Huỷ các MT0 (chưa điểm — nơi gọi đã lọc) với lý do; ghi lịch sử. Trong `tx`. Không xoá gì. */
export function huyMt0(actorUserId: number, ids: readonly number[], lyDo: string): void {
  if (!ids.length) return;
  const now = nowIso();
  theoLo(ids, (lo, ph) => {
    db().prepare(`UPDATE assessment_attempts SET status = 'cancelled', cancel_reason = ?, cancelled_at = ?, updated_at = ? WHERE id IN (${ph})`)
      .run(lyDo, now, now, ...lo);
  });
  chenNhieuDong('INSERT INTO attempt_schedule_history (attempt_id, action, reason, actor_user_id, created_at)',
    ids.map((id) => [id, 'cancelled', lyDo, actorUserId, now]));
}

/**
 * CHỐT Ở CHUYỂN LỚP / CHUYỂN TIẾP LỚP (T5b) — gọi TRONG `tx`, SAU khi mở lộ trình mới. `cuCycleId` = khoá lớp thường vừa đóng (hoặc giữ).
 * `ftCycleId` có: MT0 chưa huỷ của khoá cũ chuyển `cycle_id` sang lộ trình FT (giữ `class_id` = lớp thường — GV lớp cũ vẫn nhập điểm);
 * lộ trình FT chưa có điểm đầu vào → đầu vào = MT0 (`baseline_source = 'mt0'`). `ftCycleId` null: MT0 chưa điểm → huỷ `lyDo`; có điểm →
 * ở lại khoá cũ ("MT0 · không dùng"). Theo lô: số câu không tăng theo số em.
 */
export function noiMt0VaoFt(
  actorUserId: number, items: readonly { sid: number; cuCycleId: number | null; ftCycleId: number | null; ngay: string }[],
  lyDoHuy = 'Không lên FT',
): void {
  const co = items.filter((x) => x.cuCycleId);
  if (!co.length) return;
  const conn = db();
  const now = nowIso();
  const mt0 = new Map<number, { id: number; coDiem: boolean }>();
  theoLo(co.map((x) => x.cuCycleId!), (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT a.id, a.cycle_id,
              EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)) AS co_diem
         FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.route IS NULL   -- chỉ MT0 còn ở khoá lớp thường
        WHERE a.kind = 'mt0' AND a.status != 'cancelled' AND a.cycle_id IN (${ph})`,
    ).all(...lo) as any[]) mt0.set(r.cycle_id, { id: r.id, coDiem: !!r.co_diem });
  });
  const noi = co.flatMap((x) => {
    const m = mt0.get(x.cuCycleId!);
    return m && x.ftCycleId ? [{ ...x, ftCycleId: x.ftCycleId, mt0Id: m.id }] : [];
  });
  huyMt0(actorUserId, co.flatMap((x) => {
    const m = mt0.get(x.cuCycleId!);
    return m && !x.ftCycleId && !m.coDiem ? [m.id] : [];
  }), lyDoHuy);
  if (!noi.length) return;
  /* Một câu mỗi lô: CASE id → lộ trình mới (3 tham số / em). */
  theoLo(noi, (lo) => {
    conn.prepare(`UPDATE assessment_attempts SET cycle_id = CASE id ${lo.map(() => 'WHEN ? THEN ?').join(' ')} END, updated_at = ?
                   WHERE id IN (${lo.map(() => '?').join(',')})`)
      .run(...lo.flatMap((x) => [x.mt0Id, x.ftCycleId]), now, ...lo.map((x) => x.mt0Id));
    conn.prepare(`UPDATE learning_cycles SET baseline_attempt_id = CASE id ${lo.map(() => 'WHEN ? THEN ?').join(' ')} END, baseline_source = 'mt0'
                   WHERE id IN (${lo.map(() => '?').join(',')}) AND baseline_attempt_id IS NULL AND baseline_score IS NULL`)
      .run(...lo.flatMap((x) => [x.ftCycleId, x.mt0Id]), ...lo.map((x) => x.ftCycleId));
  }, 250);
  chenNhieuDong(
    'INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, ref_table, ref_id, dedup_key, created_by, created_at)',
    noi.map((x) => [x.sid, x.ftCycleId, 'mock_scheduled', x.ngay, 'MT0 · mốc đầu vào', 'assessment_attempts', x.mt0Id, `mt0:${x.mt0Id}:noi`, actorUserId, now]),
    ' ON CONFLICT DO NOTHING',
  );
}

export type Mt0View = {
  attemptId: number; tuan: string | null; maTuan: string | null; han: string | null;
  trangThai: TrangThaiMt0; coDiem: boolean; sos: { skill: AssessedSkill; band: number }[];
};

/** MT0 chưa huỷ (mới nhất) của mỗi em — MỘT câu lượt + MỘT câu điểm mỗi lô. */
export function mt0TheoHocVien(sids: readonly number[]): Map<number, Mt0View> {
  const out = new Map<number, Mt0View>();
  if (!sids.length) return out;
  const conn = db();
  const rows: any[] = [];
  theoLo(sids, (lo, ph) => {
    rows.push(...conn.prepare(
      `SELECT a.id, a.student_id, a.status, a.target_at_attempt, a.deadline_override, cy.route, cy.status AS cy_status, lt.huong,
              (SELECT MIN(pr.week_start) FROM attempt_skills k JOIN report_periods pr ON pr.id = k.planned_period_id
                WHERE k.attempt_id = a.id AND k.required = 1 AND k.sit_status != 'cancelled') AS tuan
         FROM assessment_attempts a
         JOIN learning_cycles cy ON cy.id = a.cycle_id
         LEFT JOIN lo_trinh_tiep_theo lt ON lt.student_id = a.student_id AND lt.class_id = a.class_id
        WHERE a.kind = 'mt0' AND a.status != 'cancelled' AND a.student_id IN (${ph})
        ORDER BY a.id`,
    ).all(...lo) as any[]);
  });
  const diem = new Map<number, Record<string, number | null>>();
  theoLo(rows.map((r) => r.id as number), (lo, ph) => {
    for (const s of conn.prepare(`SELECT attempt_id, skill, band FROM assessment_scores WHERE attempt_id IN (${ph})`).all(...lo) as any[]) {
      const m = diem.get(s.attempt_id) ?? {};
      m[s.skill] = s.band;
      diem.set(s.attempt_id, m);
    }
  });
  for (const r of rows) {
    const e = diem.get(r.id) ?? {};
    const bands = assessedBands(e as any);
    const tuan = r.tuan ? String(r.tuan).slice(0, 10) : null;
    out.set(r.student_id, {
      attemptId: r.id, tuan, maTuan: tuan ? tuanLich(tuan) : null,
      han: r.deadline_override ?? (tuan ? hanChamMt0(tuan) : null),
      trangThai: trangThaiMt0({ status: r.status, trongLoTrinhFt: !!r.route, huongFt: r.huong === 'fast_track', khoaDaDong: r.cy_status !== 'active' }),
      coDiem: Object.values(e).some((b) => b !== null && b !== undefined),
      sos: kyNangSosMt0(bands, r.target_at_attempt ?? null),
    });
  }
  return out;
}


/**
 * VIỆC QUẢN LÝ "Chốt lên FT · {lớp}" (T5b; chủ sản phẩm chốt Q1 05/10: TỰ XONG khi mọi em đang học đã có hướng — khác trống / Chưa quyết;
 * không nút, không cột mới). Lớp thường FOU/BE/ELE đang mở, người xem có `CLASS_EDIT`; hạn = Chủ nhật trước tuần Cuối khoá (`hanChotLenFt`);
 * hiện từ 13 ngày trước hạn tới hết tuần Cuối khoá. Không chặn gì: ghi Lên FT sau hạn vẫn được. Một câu lớp + một câu em cho cả phạm vi.
 */
export function lopChoChotLenFt(p: Principal, branchId: number | null, today: string): { classId: number; code: string; han: string; soEm: number }[] {
  /* Tổng quan gọi hai lần (chỉ số + dòng Cần xử lý) — nhớ trong request. */
  return nho(`chot-len-ft:${p.userId}:${branchId ?? ''}:${today}`, () => tinhLopChoChotLenFt(p, branchId, today));
}

function tinhLopChoChotLenFt(p: Principal, branchId: number | null, today: string): { classId: number; code: string; han: string; soEm: number }[] {
  const conn = db();
  const lop = conn.prepare(
    `SELECT c.id, c.code FROM classes c
      WHERE c.status = 'active' AND c.is_fast_track = 0 AND c.programme_code IN (${MT0_CHUONG_TRINH.map(() => '?').join(',')})${branchId ? ' AND c.branch_id = ?' : ''}`,
  ).all(...MT0_CHUONG_TRINH, ...(branchId ? [branchId] : [])) as any[];
  const tienDo = classProgressMany(lop.map((c) => c.id as number));
  const toi = lop.flatMap((c) => {
    const final = tienDo.get(c.id)?.finalWeekStart;
    if (!final) return [];
    const han = hanChotLenFt(final);
    return today >= addDaysIso(han, -13) && today <= addDaysIso(final, 6) && can(p, PERMISSIONS.CLASS_EDIT, { classId: c.id })
      ? [{ classId: c.id as number, code: c.code as string, han }] : [];
  });
  if (!toi.length) return [];
  const soEm = new Map<number, number>();
  theoLo(toi.map((x) => x.classId), (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT e.class_id, COUNT(*) n FROM enrollments e JOIN students s ON s.id = e.student_id
         LEFT JOIN lo_trinh_tiep_theo lt ON lt.student_id = e.student_id AND lt.class_id = e.class_id
        WHERE e.status = 'active' AND e.class_id IN (${ph}) AND ${HV_DANG_HOC_SQL('s')} AND (lt.huong IS NULL OR lt.huong = 'chua_quyet')
        GROUP BY e.class_id`,
    ).all(...lo) as any[]) soEm.set(r.class_id, r.n);
  });
  return toi.flatMap((x) => (soEm.get(x.classId) ? [{ ...x, soEm: soEm.get(x.classId)! }] : []));
}
