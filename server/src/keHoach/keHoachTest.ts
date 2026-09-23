/**
 * DỮ LIỆU VÀ THAO TÁC CỦA TAB "KẾ HOẠCH TEST" (spec §3.5 "Kế hoạch Test").
 *
 * CHỈ GỌI LẠI các hàm nghiệp vụ có sẵn — `createAttempt` (tạo đợt FT), `setSkillWeek` (đổi tuần một kỹ năng),
 * `checkWeekVsNeighbours` (T15, chặn trùng tuần) — KHÔNG dựng đường ghi lịch thứ hai. Luật thuần (trạng thái ô,
 * đợt hoàn tất, tuần đa số…) nằm ở `shared/domain/keHoachTest.ts`; file này chỉ lo đọc/ghi database.
 */
import { db, tx } from '../db.ts';
import {
  NHOM_KY_NANG, PERMISSIONS, laVaoMuon, tieuDeKeHoach, trangThaiNhom, tuanDaSo,
  type TrangThaiO,
} from '../../../shared/domain/index.ts';
import { badRequest, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { entrySkillsOf } from '../fasttrack/scoring.ts';
import { createAttempt, loadBundle } from '../fasttrack/attempts.ts';
import { currentCycle } from '../fasttrack/cycles.ts';
import { checkWeekVsNeighbours, loadSkillRows, setSkillWeek } from '../fasttrack/skillSchedule.ts';

// ---------------------------------------------------------------- danh sách lớp

export function danhSachLop(p: Principal, i: { branchId?: number | null } = {}) {
  const conn = db();
  const params: unknown[] = [];
  let where = '1=1';
  if (i.branchId) { where += ' AND c.branch_id = ?'; params.push(i.branchId); }

  const rows = conn
    .prepare(
      `SELECT c.id, c.code, pg.scoring_mode AS mode,
              (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') AS so_hv
         FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code
        WHERE ${where}
        ORDER BY c.code`,
    )
    .all(...params) as any[];
  const inScope = rows.filter((r) => can(p, PERMISSIONS.PLAN_WEEK, { classId: r.id }));

  /* chuaCoLichTiep chỉ có ý nghĩa với Fast Track (như `noPlanQueue`) — một câu SQL gom theo lớp, không hỏi lẻ. */
  const ftClassIds = inScope.filter((r) => r.mode !== 'ratio').map((r) => r.id as number);
  const chuaCoLichTiep = new Map<number, number>();
  if (ftClassIds.length) {
    for (const r of conn
      .prepare(
        `SELECT e.class_id AS class_id, COUNT(*) AS n
           FROM students s
           JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
           JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
          WHERE e.class_id IN (${ftClassIds.map(() => '?').join(',')})
            AND s.status = 'active' AND s.archived_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status = 'planned')
          GROUP BY e.class_id`,
      )
      .all(...ftClassIds) as any[]) chuaCoLichTiep.set(r.class_id, r.n);
  }

  const coFT = inScope.some((r) => r.mode !== 'ratio');
  const coThuong = inScope.some((r) => r.mode === 'ratio');
  return {
    tieuDe: tieuDeKeHoach(coFT, coThuong),
    lop: inScope.map((r) => ({
      id: r.id as number, code: r.code as string, loai: (r.mode === 'ratio' ? 'thuong' : 'ft') as 'ft' | 'thuong',
      soHv: r.so_hv as number, chuaCoLichTiep: chuaCoLichTiep.get(r.id) ?? 0,
    })),
  };
}

// ---------------------------------------------------------------- lưới Fast Track

export type ONhom = { trangThai: TrangThaiO; tuan: string | null; them: number; doiTu: string | null; giuNguyen: string[] };

const CAC_NHOM = ['rlw', 's'] as const;

/** Một kỹ năng của lưới đã có ĐỦ điểm chưa — mọi ô nhập (Writing cần cả W1, W2) đã có band. */
function xongKyNang(assessed: string, scoreRows: Array<{ skill: string; band: number | null }>): boolean {
  const entryKeys = entrySkillsOf(assessed as any);
  return entryKeys.every((k) => scoreRows.some((r) => r.skill === k && r.band !== null));
}

export function luoiFT(p: Principal, classId: number, today: string = demoToday()) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId }, 'Chỉ Quản lý xếp được lịch Test.');
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');

  const students = conn
    .prepare(
      `SELECT s.id, s.full_name, s.student_code, s.status, e.started_at
         FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL
        ORDER BY s.full_name`,
    )
    .all(classId) as any[];
  const studentIds = students.map((s) => s.id);

  const attempts = studentIds.length
    ? (conn
        .prepare(
          `SELECT a.* FROM assessment_attempts a
             JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
            WHERE a.class_id = ? AND a.status != 'cancelled' AND a.student_id IN (${studentIds.map(() => '?').join(',')})
            ORDER BY a.attempt_no`,
        )
        .all(classId, ...studentIds) as any[])
    : [];

  const attemptIds = attempts.map((a) => a.id);
  const skillRows = loadSkillRows(attemptIds);
  const bundle = loadBundle(attemptIds);
  /* Lần dời gần nhất vì vắng của từng kỹ năng — một câu cho cả lớp (Q5). */
  const dichuyenGanNhat = new Map<string, string | null>();
  if (attemptIds.length) {
    for (const r of conn
      .prepare(
        `SELECT h.attempt_id, h.field, h.old_value FROM attempt_schedule_history h
          WHERE h.attempt_id IN (${attemptIds.map(() => '?').join(',')}) AND h.action = 'skill_week_moved_absence'
          ORDER BY h.id`,
      )
      .all(...attemptIds) as any[]) dichuyenGanNhat.set(`${r.attempt_id}:${r.field}`, r.old_value ?? null);
  }

  const attemptsByStudent = new Map<number, any[]>();
  for (const a of attempts) {
    if (!attemptsByStudent.has(a.student_id)) attemptsByStudent.set(a.student_id, []);
    attemptsByStudent.get(a.student_id)!.push(a);
  }

  const soDot = new Set<number>();
  for (const a of attempts) soDot.add(a.attempt_no);
  const cot = [1, 2, 3, 4, 5].concat([...soDot].filter((n) => n > 5)).sort((x, y) => x - y);

  const oNhom = (a: any, nhom: 'rlw' | 's'): ONhom => {
    const skills = NHOM_KY_NANG[nhom] as readonly string[];
    const rows = (skillRows.get(a.id) ?? []).filter((r: any) => skills.includes(r.skill));
    const scores = bundle.scores.get(a.id) ?? [];
    const kn = rows.map((r: any) => ({
      skill: r.skill, batBuoc: r.required === 1, tuan: r.week_start ?? null,
      xong: xongKyNang(r.skill, scores), daDoi: (r.absence_move_count ?? 0) > 0,
    }));
    const trangThai = trangThaiNhom(kn.map(({ skill, ...rest }) => rest));
    const { tuan, khac } = tuanDaSo(kn.map((k) => k.tuan));
    const giuNguyen = kn.filter((k) => k.xong).map((k) => k.skill);
    const doi = kn.find((k) => k.daDoi);
    const doiTu = doi ? dichuyenGanNhat.get(`${a.id}:${doi.skill}`) ?? null : null;
    return {
      trangThai, tuan, them: khac.reduce((n, x) => n + x.n, 0),
      doiTu, giuNguyen,
    };
  };

  const hang = students.map((s) => {
    const dot: Record<number, { attemptId: number | null; trangThaiDot: string | null; rlw: ONhom; s: ONhom }> = {};
    const mine = attemptsByStudent.get(s.id) ?? [];
    for (const n of cot) {
      const a = mine.find((x) => x.attempt_no === n);
      if (!a) {
        dot[n] = { attemptId: null, trangThaiDot: null, rlw: { trangThai: 'chua-xep', tuan: null, them: 0, doiTu: null, giuNguyen: [] },
          s: { trangThai: 'chua-xep', tuan: null, them: 0, doiTu: null, giuNguyen: [] } };
        continue;
      }
      const rlw = oNhom(a, 'rlw');
      const sOut = oNhom(a, 's');
      const trangThaiDot = a.status === 'done' || (rlw.trangThai === 'xong' && sOut.trangThai === 'xong') ? 'xong'
        : a.status;
      dot[n] = { attemptId: a.id, trangThaiDot, rlw, s: sOut };
    }
    return {
      studentId: s.id, ten: s.full_name, ma: s.student_code,
      vaoMuon: laVaoMuon(s.started_at ?? null, cls.start_date ?? null), dot,
    };
  });

  return { classId, classCode: cls.code, cot, hang };
}

// ---------------------------------------------------------------- kiểm + đặt tuần một nhóm

function skillsOfNhom(nhom: 'rlw' | 's'): readonly string[] {
  return NHOM_KY_NANG[nhom];
}

export function kiemTuanNhom(p: Principal, i: { attemptId: number; nhom: 'rlw' | 's'; periodId: number }) {
  const conn = db();
  const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(i.attemptId) as any;
  if (!a) throw notFound('Không tìm thấy đợt kiểm tra');
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }, 'Chỉ Quản lý xếp được lịch Test.');
  const period = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(i.periodId) as any;
  if (!period) throw notFound('Không tìm thấy tuần');

  const rows = loadSkillRows([i.attemptId]).get(i.attemptId) ?? [];
  const blockers: string[] = [];
  const warnings: string[] = [];
  const seDoi: string[] = [];
  const giuNguyen: Array<{ skill: string; vi: string }> = [];
  const scores = loadBundle([i.attemptId]).scores.get(i.attemptId) ?? [];

  for (const skill of skillsOfNhom(i.nhom)) {
    const row: any = rows.find((r: any) => r.skill === skill);
    if (!row || !row.required) continue;
    if (row.sit_status === 'cancelled') { giuNguyen.push({ skill, vi: 'đã huỷ phần thi' }); continue; }
    if (xongKyNang(skill, scores)) { giuNguyen.push({ skill, vi: 'đã có điểm' }); continue; }
    if (row.sit_status === 'sat') { giuNguyen.push({ skill, vi: 'đã thi' }); continue; }
    if (row.planned_period_id === i.periodId) continue;
    const check = checkWeekVsNeighbours({
      cycleId: a.cycle_id, attemptNo: a.attempt_no, excludeAttemptId: i.attemptId, newWeekStart: period.week_start,
    });
    blockers.push(...check.blockers);
    warnings.push(...check.warnings);
    seDoi.push(skill);
  }
  return { blockers, warnings, seDoi, giuNguyen };
}

export function datTuanNhom(p: Principal, i: {
  attemptId: number; nhom: 'rlw' | 's'; periodId: number; force?: boolean; reason?: string | null;
}) {
  const kiem = kiemTuanNhom(p, { attemptId: i.attemptId, nhom: i.nhom, periodId: i.periodId });
  if (kiem.blockers.length) throw badRequest(kiem.blockers.join(' '));
  if (kiem.warnings.length && !i.force) throw badRequest(`${kiem.warnings.join(' ')} Xác nhận lại nếu vẫn muốn xếp vào tuần này.`);
  return tx(() => {
    for (const skill of kiem.seDoi) {
      setSkillWeek(p, i.attemptId, skill, i.periodId, { reason: i.reason ?? null, force: true });
    }
    return { ok: true, doiSkills: kiem.seDoi };
  });
}

// ---------------------------------------------------------------- xếp mới

export function xepMoi(p: Principal, i: {
  studentId: number; attemptNo?: number; rlwPeriodId: number; sPeriodId?: number | null; force?: boolean;
}) {
  const conn = db();
  /* CÙNG CÁCH CHỌN LỘ TRÌNH VỚI `createAttempt` (ưu tiên `active`, không có thì lộ trình gần nhất) — khác
   * đường thì kiểm T15 ở đây so với một lộ trình, còn `createAttempt` lại tạo đợt vào lộ trình khác. */
  const cycle = currentCycle(i.studentId);
  if (!cycle) throw badRequest('Học viên chưa có lộ trình đang chạy.');
  const attemptNo = i.attemptNo ?? (
    (conn.prepare('SELECT MAX(attempt_no) AS n FROM assessment_attempts WHERE cycle_id = ? AND status != \'cancelled\'')
      .get(cycle.id) as any).n ?? 0
  ) + 1;
  const rlwPeriod = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(i.rlwPeriodId) as any;
  if (!rlwPeriod) throw notFound('Không tìm thấy tuần RLW');
  const sPeriodId = i.sPeriodId ?? i.rlwPeriodId;
  const sPeriod = sPeriodId === i.rlwPeriodId ? rlwPeriod
    : (conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(sPeriodId) as any);
  if (!sPeriod) throw notFound('Không tìm thấy tuần Speaking');

  return tx(() => {
    for (const newWeekStart of new Set([rlwPeriod.week_start, sPeriod.week_start])) {
      const check = checkWeekVsNeighbours({
        cycleId: cycle.id, attemptNo, excludeAttemptId: null, newWeekStart,
      });
      if (check.blockers.length) throw badRequest(check.blockers.join(' '));
      if (check.warnings.length && !i.force) {
        throw badRequest(`${check.warnings.join(' ')} Xác nhận lại nếu vẫn muốn xếp vào tuần này.`);
      }
    }
    const created = createAttempt(p, { studentId: i.studentId, cycleId: cycle.id, attemptNo, periodId: i.rlwPeriodId }) as any;
    db().prepare(`UPDATE assessment_attempts SET plan_source = 'manual' WHERE id = ?`).run(created.id);
    if (sPeriodId !== i.rlwPeriodId) {
      setSkillWeek(p, created.id, 'speaking', sPeriodId, { force: true });
    }
    return created;
  });
}
