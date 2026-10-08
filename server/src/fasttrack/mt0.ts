/**
 * MT0 MÁY CHỦ (PR-MT0, đặc tả T5, T5b) — luật thuần ở `shared/domain/mt0.ts`; file này tạo / mở lại / huỷ / nối / đọc MT0 theo lô.
 * MT0 = `assessment_attempts` `kind = 'mt0'`, `attempt_no = 0`, gắn khoá lớp thường đang chạy (`route IS NULL`). Không bao giờ xoá dòng
 * hay điểm: huỷ = `status = 'cancelled'`, mở lại được. Mọi hàm ghi chạy TRONG `tx` của thao tác gây ra nó; số câu SQL không tăng theo số em.
 */
import { chenNhieuDong, db, theoLo } from '../db.ts';
import {
  ASSESSED_SKILLS, coMt0, skillShort, hanChamMt0, kyNangSosMt0, trangThaiMt0, tuanLich,
  type AssessedSkill, type Huong, type ProgrammeCode, type TrangThaiMt0,
} from '../../../shared/domain/index.ts';
import { nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { ensurePeriods } from '../platform/week.ts';
import { classProgressMany } from '../classes/schedule.ts';
import { assessedBands } from './scoring.ts';


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

  if (huy.length) huyLuotChuaDiem(actorUserId, huy, 'Bỏ hướng Lên FT');
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

/** Huỷ các lượt (MT0, Mock — chưa điểm, nơi gọi đã lọc) với lý do; ghi lịch sử. Trong `tx`. Không xoá gì. */
export function huyLuotChuaDiem(actorUserId: number, ids: readonly number[], lyDo: string): void {
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
  huyLuotChuaDiem(actorUserId, co.flatMap((x) => {
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
    /* PR-LCa (LCa-3): MT0 chưa điểm mang Target của lộ trình FT vừa mở (KCK: `datKck` xoá sau). */
    conn.prepare(`UPDATE assessment_attempts SET target_at_attempt = (SELECT cy.target_score FROM learning_cycles cy WHERE cy.id = assessment_attempts.cycle_id)
                   WHERE id IN (${lo.map(() => '?').join(',')})
                     AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = assessment_attempts.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))`)
      .run(...lo.map((x) => x.mt0Id));
  }, 250);
  chenNhieuDong(
    'INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, ref_table, ref_id, dedup_key, created_by, created_at)',
    noi.map((x) => [x.sid, x.ftCycleId, 'mock_scheduled', x.ngay, 'MT0 · mốc đầu vào', 'assessment_attempts', x.mt0Id, `mt0:${x.mt0Id}:noi`, actorUserId, now]),
    ' ON CONFLICT DO NOTHING',
  );
}

/** Lượt của lộ trình FT khi em về lớp thường (PR-CL B4) — MỘT kế hoạch cho xem trước (`xemChuyenLop.veThuong`) và thi hành (`veLopThuong`). */
export type KeHoachVeThuong = {
  /** MT0 sẽ xử lý: có điểm → về khoá thường trước ("MT0 · không dùng"); chưa điểm → huỷ. null: không có MT0, hoặc có điểm mà em vào thẳng FT (để nguyên). */
  mt0: { id: number; coDiem: boolean; kyNang: string[] } | null;
  khoaTruocId: number | null;
  mockHuy: { id: number; ten: string }[];
  /** "MT0 L", "MT3 L"… — điểm đã có, giữ nguyên. */
  giuDiem: string[];
};

const THU_TU_KY = ['listening', 'reading', 'writing1', 'writing2', 'writing', 'speaking'];

/**
 * MỘT câu cho một lộ trình FT: lượt chưa huỷ + kỹ năng đã có điểm + khoá lớp thường ngay trước (`seq` nhỏ hơn, `route IS NULL`). Mock "chưa có điểm"
 * = `planned` và không kỹ năng nào có điểm; lượt có điểm (kể cả một phần) giữ nguyên.
 */
export function keHoachVeThuong(ft: { id: number; student_id: number; seq: number }): KeHoachVeThuong {
  const rows = db().prepare(
    `SELECT a.id, a.kind, a.attempt_no, a.status,
            (SELECT group_concat(s.skill) FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL)) AS ky,
            (SELECT k.id FROM learning_cycles k WHERE k.student_id = ? AND k.route IS NULL AND k.seq < ? ORDER BY k.seq DESC LIMIT 1) AS khoa_truoc
       FROM assessment_attempts a WHERE a.cycle_id = ? AND a.status != 'cancelled' ORDER BY a.attempt_no, a.id`,
  ).all(ft.student_id, ft.seq, ft.id) as any[];
  const khoaTruocId = (rows[0]?.khoa_truoc ?? null) as number | null;
  const kyCua = (r: any) => String(r.ky ?? '').split(',').filter(Boolean).sort((a, b) => THU_TU_KY.indexOf(a) - THU_TU_KY.indexOf(b));
  const tenCua = (r: any) => (r.kind === 'mt0' ? 'MT0' : `MT${r.attempt_no}`);
  const coDiem = (r: any) => !!r.ky;
  const m = rows.find((r) => r.kind === 'mt0');
  const mt0 = m && (!coDiem(m) || khoaTruocId) ? { id: m.id as number, coDiem: coDiem(m), kyNang: kyCua(m).map(skillShort) } : null;
  return {
    mt0, khoaTruocId,
    mockHuy: rows.filter((r) => r.kind !== 'mt0' && r.status === 'planned' && !coDiem(r)).map((r) => ({ id: r.id as number, ten: tenCua(r) })),
    giuDiem: rows.flatMap((r) => kyCua(r).map((k) => `${tenCua(r)} ${skillShort(k)}`)),
  };
}

/**
 * FT → LỚP THƯỜNG khi thi hành (PR-CL B4, đặc tả 08/10 §1) — HAI bước trong tx của `apDungMotDong`, quanh bản chụp lộ trình FT (R-C1: bản chụp = trạng thái
 * lúc đóng). Bước 1 (`huyKhiVeThuong`, TRƯỚC bản chụp): MT0 chưa điểm + Mock chưa điểm → huỷ "Học lại lớp thường". Bước 2 (`doiMt0KhiVeThuong`, SAU
 * bản chụp — bản chụp FT còn đầu vào + dòng MT0 có điểm): MT0 có điểm → về khoá thường trước (khoá đã đóng → "MT0 · không dùng"); lộ trình FT bỏ đầu vào MT0.
 * Không xoá dòng hay điểm nào. Không giới hạn thời gian (D3). Cả hai bước ≤ 4 câu ghi, không tham số đặt tên.
 */
export function huyKhiVeThuong(actorUserId: number, k: KeHoachVeThuong): void {
  huyLuotChuaDiem(actorUserId, [...(k.mt0 && !k.mt0.coDiem ? [k.mt0.id] : []), ...k.mockHuy.map((x) => x.id)], 'Học lại lớp thường');
}
export function doiMt0KhiVeThuong(ftCycleId: number, k: KeHoachVeThuong): void {
  if (!k.mt0) return;
  const conn = db();
  if (k.mt0.coDiem) conn.prepare('UPDATE assessment_attempts SET cycle_id = ?, updated_at = ? WHERE id = ?').run(k.khoaTruocId, nowIso(), k.mt0.id);
  conn.prepare('UPDATE learning_cycles SET baseline_attempt_id = NULL, baseline_source = NULL WHERE id = ? AND baseline_attempt_id = ?').run(ftCycleId, k.mt0.id);
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


/* PR-LCb: việc Quản lý "Chốt lên FT" đã gộp vào "Chốt lộ trình" — `lopChoChotLoTrinh` (classes/lenhChuyen.ts). */
