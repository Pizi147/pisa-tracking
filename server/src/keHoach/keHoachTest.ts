/**
 * DỮ LIỆU VÀ THAO TÁC CỦA TAB "KẾ HOẠCH TEST" (spec §3.5 "Kế hoạch Test"; PR-UX2 xếp từng kỹ năng L · R · W · S).
 *
 * CHỈ GỌI LẠI các hàm nghiệp vụ có sẵn — `createAttempt` (tạo đợt FT), `planRegularTests` (tạo bài lớp thường),
 * `setSkillWeek` (đổi tuần MỘT kỹ năng), `setSkillSkip` (bỏ/đưa lại kỹ năng), `checkWeekVsNeighbours` (T15, chặn trùng tuần)
 * — KHÔNG dựng đường ghi lịch thứ hai. Bảng `attempt_skills` vốn đã theo từng kỹ năng nên không đổi bảng. Luật thuần
 * (gộp chip, nhãn tuần khoá, tóm tắt hàng loạt…) nằm ở `shared/domain/keHoachTest.ts`; file này chỉ lo đọc/ghi database.
 *
 * Quyền: MỌI hàm ở đây gọi `require_(PLAN_WEEK, { classId })` TRƯỚC khi đọc gì của lớp/em (QL chi nhánh khác → 403).
 */
import { db, tx } from '../db.ts';
import {
  CHU_KY_NANG, KY_NANG_KE_HOACH, PERMISSIONS, kiemSoMtMoi, laVaoMuon, soMtKeTiep, soSanhLop, tieuDeKeHoach, tomTatLopFT, trangThaiKyNang,
  tuanKhoa as tuanKhoaCua,
  type BaiXemTruoc, type DongHangLoat, type KyNangKH, type OKyNang,
} from '../../../shared/domain/index.ts';
import { badRequest, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { entrySkillsOf } from '../fasttrack/scoring.ts';
import { createAttempt, loadBundle, setSkillSkip } from '../fasttrack/attempts.ts';
import { currentCycle, luotSoCuaLoTrinh, nextAttemptNo } from '../fasttrack/cycles.ts';
import { checkWeekVsNeighbours, loadSkillRows, setSkillWeek } from '../fasttrack/skillSchedule.ts';
import { writeAudit } from '../platform/audit.ts';
import { classProgress, classProgressMany } from '../classes/schedule.ts';
import { planRegularTests, programmeOfClass } from '../normal/regular.ts';

const KIND_NHAN: Record<'progress' | 'final', 'Giữa khoá' | 'Cuối khoá'> = { progress: 'Giữa khoá', final: 'Cuối khoá' };
const CAU_XAC_NHAN = 'Xác nhận lại nếu vẫn muốn xếp vào tuần này.';
const PLAN_MSG = 'Chỉ Quản lý xếp được lịch Test.';

const phOf = (n: number) => Array.from({ length: n }, () => '?').join(',');
const thuTuKn = (k: string) => (KY_NANG_KE_HOACH as readonly string[]).indexOf(k);

function chonKyNang(skill: string): KyNangKH {
  if (!(KY_NANG_KE_HOACH as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
  return skill as KyNangKH;
}

// ---------------------------------------------------------------- danh sách lớp

export function danhSachLop(p: Principal, i: { branchId?: number | null } = {}) {
  const conn = db();
  const params: unknown[] = [];
  let where = "c.status = 'active'";
  if (i.branchId) { where += ' AND c.branch_id = ?'; params.push(i.branchId); }

  const rows = conn
    .prepare(
      `SELECT c.id, c.code, c.branch_id, pg.scoring_mode AS mode, br.name AS chi_nhanh,
              (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') AS so_hv
         FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code
         LEFT JOIN branches br ON br.id = c.branch_id
        WHERE ${where}
        ORDER BY c.code`,
    )
    .all(...params) as any[];
  rows.sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }));
  const inScope = rows.filter((r) => can(p, PERMISSIONS.PLAN_WEEK, { classId: r.id }));

  const ftClassIds = inScope.filter((r) => r.mode !== 'ratio').map((r) => r.id as number);
  const thuongIds = inScope.filter((r) => r.mode === 'ratio').map((r) => r.id as number);

  /* Lớp FT: HV đang học + lượt Mock của họ — hai câu cho MỌI lớp, gom trong JS (Q12). */
  const hvCuaLop = new Map<number, number[]>();
  const luotCuaLop = new Map<number, Array<{ hv: number; no: number; status: string }>>();
  const chuaCoLichTiep = new Map<number, number>();
  if (ftClassIds.length) {
    for (const r of conn
      .prepare(
        `SELECT e.class_id AS class_id, s.id AS student_id,
                CASE WHEN cy.id IS NOT NULL AND NOT EXISTS (
                  SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status = 'planned') THEN 1 ELSE 0 END AS chua_co_lich
           FROM students s
           JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
           LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
          WHERE e.class_id IN (${phOf(ftClassIds.length)}) AND s.status = 'active' AND s.archived_at IS NULL`,
      )
      .all(...ftClassIds) as any[]) {
      if (!hvCuaLop.has(r.class_id)) hvCuaLop.set(r.class_id, []);
      hvCuaLop.get(r.class_id)!.push(r.student_id);
      if (r.chua_co_lich) chuaCoLichTiep.set(r.class_id, (chuaCoLichTiep.get(r.class_id) ?? 0) + 1);
    }
    for (const r of conn
      .prepare(
        `SELECT a.class_id, a.student_id, a.attempt_no, a.status
           FROM assessment_attempts a
           JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
           JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
           JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
          WHERE a.class_id IN (${phOf(ftClassIds.length)}) AND a.status != 'cancelled'`,
      )
      .all(...ftClassIds) as any[]) {
      if (!luotCuaLop.has(r.class_id)) luotCuaLop.set(r.class_id, []);
      luotCuaLop.get(r.class_id)!.push({ hv: r.student_id, no: r.attempt_no, status: r.status });
    }
  }
  const tomTatFT = (classId: number): string => {
    const luot = luotCuaLop.get(classId) ?? [];
    const hv = hvCuaLop.get(classId) ?? [];
    const dangThi = luot.filter((l) => l.status === 'planned').map((l) => l.no);
    const a = dangThi.length ? Math.min(...dangThi) : null;
    const b = a !== null ? a + 1 : (luot.length ? Math.max(...luot.map((l) => l.no)) : 0) + 1;
    const coB = new Set(luot.filter((l) => l.no === b).map((l) => l.hv));
    const soEm = hv.filter((id) => !coB.has(id)).length;
    return tomTatLopFT({ dangThi: a, chuaXep: { dot: b, soEm } });
  };

  /* Lớp thường: tiến độ (một lượt gom) + số em chưa có bài (một câu). */
  const progressAll = classProgressMany(thuongIds);
  const hvChuaCoLich = new Map<number, number>();
  if (thuongIds.length) {
    for (const r of conn
      .prepare(
        `SELECT e.class_id AS class_id, COUNT(*) AS n
           FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
          WHERE e.class_id IN (${phOf(thuongIds.length)}) AND s.status = 'active' AND s.archived_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM assessment_attempts a
               WHERE a.student_id = s.id AND a.class_id = e.class_id AND a.kind IN ('progress', 'final') AND a.status != 'cancelled')
          GROUP BY e.class_id`,
      )
      .all(...thuongIds) as any[]) hvChuaCoLich.set(r.class_id, r.n);
  }
  /** Lớp thường: `đang W8/8` (chương trình đi riêng ở `chuongTrinh`, hiện cạnh chi nhánh). */
  const tomTatThuong = (classId: number): string => {
    const pr = progressAll.get(classId);
    if (!pr?.currentWeek || !pr.totalWeeks) return 'chưa có ngày khai giảng';
    if (pr.currentWeek < 1) return 'chưa khai giảng';
    if (pr.currentWeek > pr.totalWeeks) return 'đã hết khoá';
    return `đang ${tuanKhoaCua(pr.currentWeek, pr.totalWeeks)}`;
  };

  const coFT = inScope.some((r) => r.mode !== 'ratio');
  const coThuong = inScope.some((r) => r.mode === 'ratio');
  return {
    tieuDe: tieuDeKeHoach(coFT, coThuong),
    lop: inScope.map((r) => {
      const loai = (r.mode === 'ratio' ? 'thuong' : 'ft') as 'ft' | 'thuong';
      return {
        id: r.id as number, code: r.code as string, loai, chiNhanh: (r.chi_nhanh ?? '') as string,
        chuongTrinh: loai === 'thuong' ? (progressAll.get(r.id)?.programmeCode ?? null) : null,
        soHv: r.so_hv as number,
        chuaCoLichTiep: chuaCoLichTiep.get(r.id) ?? 0,
        hvChuaCoLich: hvChuaCoLich.get(r.id) ?? 0,
        tomTat: loai === 'ft' ? tomTatFT(r.id) : tomTatThuong(r.id),
      };
    }),
  };
}

// ---------------------------------------------------------------- đọc một kỹ năng của một đợt

type CheDo = 'ft' | 'thuong';

/** Một kỹ năng đã có ĐỦ điểm chưa: FT cần mọi ô nhập có band (Writing = W1 + W2); lớp thường có `raw_score`. */
function xongKyNang(cheDo: CheDo, skill: string, scores: any[]): boolean {
  if (cheDo === 'thuong') return scores.some((s) => s.skill === skill && s.raw_score !== null && s.raw_score !== undefined);
  return entrySkillsOf(skill as any).every((k) => scores.some((r) => r.skill === k && r.band !== null && r.band !== undefined));
}

/** Lý do dòng chỉ đọc: `đã huỷ phần thi` › `đã có điểm` (có điểm ở BẤT KỲ ô nhập nào, như `setSkillWeek`) › `đã thi`. */
function khoaCua(cheDo: CheDo, row: any, scores: any[]): OKyNang['khoa'] {
  if (row.sit_status === 'cancelled') return 'đã huỷ phần thi';
  const ten = cheDo === 'thuong' ? [row.skill] : entrySkillsOf(row.skill);
  const coDiem = scores.some((s) => (ten as string[]).includes(s.skill)
    && ((s.band !== null && s.band !== undefined) || (s.raw_score !== null && s.raw_score !== undefined)));
  if (coDiem) return 'đã có điểm';
  if (row.sit_status === 'sat') return 'đã thi';
  return null;
}

function oKyNangCua(cheDo: CheDo, row: any, scores: any[], daDoi: boolean, doiTu: string | null): OKyNang {
  const batBuoc = row.required === 1;
  return {
    trangThai: trangThaiKyNang({ batBuoc, tuan: row.week_start ?? null, xong: xongKyNang(cheDo, row.skill, scores), daDoi }),
    tuan: row.week_start ?? null, periodId: row.planned_period_id ?? null, doiTu: daDoi ? doiTu : null, batBuoc,
    khoa: khoaCua(cheDo, row, scores),
  };
}

// ---------------------------------------------------------------- lưới Fast Track

export type DotFT = { attemptId: number | null; trangThaiDot: string | null; kn: Partial<Record<KyNangKH, OKyNang>>; lichSu?: boolean };

export function luoiFT(p: Principal, classId: number, _today: string = demoToday()) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId }, PLAN_MSG);
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
            WHERE a.class_id = ? AND a.student_id IN (${phOf(studentIds.length)})
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
          WHERE h.attempt_id IN (${phOf(attemptIds.length)}) AND h.action = 'skill_week_moved_absence'
          ORDER BY h.id`,
      )
      .all(...attemptIds) as any[]) dichuyenGanNhat.set(`${r.attempt_id}:${r.field}`, r.old_value ?? null);
  }

  /* Lượt huỷ chỉ để tính "MT kế tiếp" (số huỷ còn điểm giữ số — T36); lưới không vẽ lượt huỷ. */
  const tatCaCua = new Map<number, any[]>();
  for (const a of attempts) tatCaCua.set(a.student_id, [...(tatCaCua.get(a.student_id) ?? []), a]);
  const attemptsByStudent = new Map<number, any[]>();
  for (const a of attempts.filter((x) => x.status !== 'cancelled')) {
    if (!attemptsByStudent.has(a.student_id)) attemptsByStudent.set(a.student_id, []);
    attemptsByStudent.get(a.student_id)!.push(a);
  }

  const soDot = new Set<number>();
  for (const a of attempts) if (a.status !== 'cancelled') soDot.add(a.attempt_no);
  const cot = [1, 2, 3, 4, 5].concat([...soDot].filter((n) => n > 5)).sort((x, y) => x - y);

  const knCua = (a: any): Partial<Record<KyNangKH, OKyNang>> => {
    const scores = bundle.scores.get(a.id) ?? [];
    const kn: Partial<Record<KyNangKH, OKyNang>> = {};
    for (const r of (skillRows.get(a.id) ?? []) as any[]) {
      if (!(KY_NANG_KE_HOACH as readonly string[]).includes(r.skill)) continue;
      const daDoi = (r.absence_move_count ?? 0) > 0;
      kn[r.skill as KyNangKH] = oKyNangCua('ft', r, scores, daDoi, daDoi ? dichuyenGanNhat.get(`${a.id}:${r.skill}`) ?? null : null);
    }
    return kn;
  };

  const hang = students.map((s) => {
    const dot: Record<number, DotFT> = {};
    const mine = attemptsByStudent.get(s.id) ?? [];
    for (const n of cot) {
      const a = mine.find((x) => x.attempt_no === n);
      if (!a) { dot[n] = { attemptId: null, trangThaiDot: null, kn: {} }; continue; }
      const kn = knCua(a);
      const batBuoc = Object.values(kn).filter((o) => o && o.trangThai !== 'khong-yeu-cau');
      const xongCa = batBuoc.length > 0 && batBuoc.every((o) => o!.trangThai === 'xong');
      dot[n] = { attemptId: a.id, trangThaiDot: a.status === 'done' || xongCa ? 'xong' : a.status, kn, lichSu: !!a.lich_su };
    }
    return {
      studentId: s.id as number, ten: s.full_name as string, ma: s.student_code as string,
      vaoMuon: laVaoMuon(s.started_at ?? null, cls.start_date ?? null), dot,
      /* K4-08: chỉ ô MT kế tiếp có "+ xếp" (Q11). ponytail: chỉ đếm lượt ở lớp này — em giữ khoá từ lớp khác có thể lệch, lưới đầy đủ là PR-XLMT. */
      soKeTiep: soMtKeTiep((tatCaCua.get(s.id) ?? []).map((a) => ({
        attempt_no: a.attempt_no, status: a.status,
        coDiem: (bundle.scores.get(a.id) ?? []).some((x: any) => (x.band ?? null) !== null || (x.raw_score ?? null) !== null),
      }))),
    };
  });

  return { classId, classCode: cls.code as string, cot, hang };
}

// ---------------------------------------------------------------- kiểm + lưu một đợt, từng kỹ năng

type YeuCauKyNang = { skill: KyNangKH; periodId: number };

/** Kiểm từng kỹ năng của một đợt đã có — KHÔNG ghi. `duaLai` = kỹ năng đang bị bỏ mà lần lưu này đưa lại (bỏ qua "không thi"). */
function kiemDotNoi(a: any, kyNang: YeuCauKyNang[], duaLai: Set<KyNangKH> = new Set()): { bai: BaiXemTruoc[] } {
  const conn = db();
  const cheDo: CheDo = a.kind === 'mock' ? 'ft' : 'thuong';
  const rows = (loadSkillRows([a.id]).get(a.id) ?? []) as any[];
  const scores = loadBundle([a.id]).scores.get(a.id) ?? [];
  const periods = new Map<number, any>();
  for (const id of new Set(kyNang.map((k) => k.periodId))) {
    const pr = conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(id) as any;
    if (!pr) throw notFound('Không tìm thấy tuần');
    periods.set(id, pr);
  }
  const checks = new Map<string, { blockers: string[]; warnings: string[] }>();
  const bai: BaiXemTruoc[] = [];
  for (const k of kyNang) {
    const row = rows.find((r) => r.skill === k.skill);
    const tu = row?.week_start ?? null;
    const pr = periods.get(k.periodId);
    if (!row || (!row.required && !duaLai.has(k.skill))) {
      bai.push({ skill: k.skill, tu, den: tu, ghiChu: 'giu', cau: 'Đợt này không thi kỹ năng này.' });
      continue;
    }
    const khoa = khoaCua(cheDo, row, scores);
    if (khoa) { bai.push({ skill: k.skill, tu, den: tu, ghiChu: 'giu', cau: khoa }); continue; }
    if (row.planned_period_id === k.periodId) { bai.push({ skill: k.skill, tu, den: tu, ghiChu: 'giu', cau: null }); continue; }
    let c = checks.get(pr.week_start);
    if (!c) {
      c = checkWeekVsNeighbours({ cycleId: a.cycle_id, attemptNo: a.attempt_no, excludeAttemptId: a.id, newWeekStart: pr.week_start });
      checks.set(pr.week_start, c);
    }
    if (c.blockers.length) bai.push({ skill: k.skill, tu, den: pr.week_start, ghiChu: 'chan', cau: c.blockers.join(' ') });
    else if (c.warnings.length) bai.push({ skill: k.skill, tu, den: pr.week_start, ghiChu: 'canh-bao', cau: c.warnings.join(' ') });
    else bai.push({ skill: k.skill, tu, den: pr.week_start, ghiChu: 'doi', cau: null });
  }
  return { bai };
}

function docDot(attemptId: number) {
  const a = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy đợt kiểm tra');
  return a;
}

export function kiemDot(p: Principal, i: { attemptId: number; kyNang: YeuCauKyNang[] }): { bai: BaiXemTruoc[] } {
  const a = docDot(i.attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }, PLAN_MSG);
  for (const k of i.kyNang) chonKyNang(k.skill);
  return kiemDotNoi(a, i.kyNang);
}

/** Lưu MỘT ĐỢT (hộp chip bấm Lưu một lần): kiểm hết rồi mới ghi, một `tx` — chặn một kỹ năng thì cả lần lưu không đổi gì. */
export function luuDot(p: Principal, i: {
  attemptId: number; kyNang: Array<{ skill: KyNangKH; periodId?: number | null; bo?: boolean }>;
  lyDoBo?: string | null; force?: boolean; reason?: string | null;
}): { ok: true; doi: KyNangKH[] } {
  const a = docDot(i.attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }, PLAN_MSG);
  for (const k of i.kyNang) chonKyNang(k.skill);

  const duaLai = new Set(i.kyNang.filter((k) => k.bo === false).map((k) => k.skill));
  const datTuan = i.kyNang.filter((k) => k.periodId && !k.bo) as YeuCauKyNang[];
  const kiem = kiemDotNoi(a, datTuan, duaLai);
  const chan = kiem.bai.filter((b) => b.ghiChu === 'chan');
  if (chan.length) throw badRequest(chan.map((b) => `${CHU_KY_NANG[b.skill]}: ${b.cau}`).join(' '));
  const cb = kiem.bai.filter((b) => b.ghiChu === 'canh-bao');
  if (cb.length && !i.force) throw badRequest(`${[...new Set(cb.map((b) => b.cau))].join(' ')} ${CAU_XAC_NHAN}`);

  const rows = (loadSkillRows([i.attemptId]).get(i.attemptId) ?? []) as any[];
  return tx(() => {
    for (const k of i.kyNang) {            // bo=true: đang bắt buộc → bỏ; bo=false: đang bỏ → đưa lại
      const r = rows.find((x) => x.skill === k.skill);
      if (k.bo !== undefined && r && !!r.required === k.bo) setSkillSkip(p, i.attemptId, k.skill, k.bo, i.lyDoBo ?? undefined);
    }
    const doi = kiem.bai.filter((b) => b.ghiChu === 'doi' || b.ghiChu === 'canh-bao');
    for (const b of doi) {
      setSkillWeek(p, i.attemptId, b.skill, datTuan.find((k) => k.skill === b.skill)!.periodId, { reason: i.reason ?? null, force: true });
    }
    return { ok: true as const, doi: doi.map((b) => b.skill) };
  });
}

// ---------------------------------------------------------------- xếp mới

function docTuan(ids: number[]): Map<number, any> {
  const out = new Map<number, any>();
  const uniq = [...new Set(ids)];
  if (!uniq.length) return out;
  for (const r of db().prepare(`SELECT * FROM report_periods WHERE id IN (${phOf(uniq.length)})`).all(...uniq) as any[]) out.set(r.id, r);
  for (const id of uniq) if (!out.has(id)) throw notFound('Không tìm thấy tuần');
  return out;
}

/** Bốn tuần cho một đợt CHƯA CÓ: thiếu kỹ năng không `bo` → lỗi. Trả tuần theo từng kỹ năng. */
function tuanDayDu(tuan: Partial<Record<KyNangKH, number>>, bo: KyNangKH[] = []): Record<KyNangKH, number | null> {
  const out = {} as Record<KyNangKH, number | null>;
  for (const k of KY_NANG_KE_HOACH) {
    if (bo.includes(k)) { out[k] = null; continue; }
    const id = tuan[k];
    if (!id) throw badRequest('Cần chọn tuần cho cả 4 kỹ năng.');
    out[k] = id;
  }
  return out;
}

/** T15 cho một đợt chưa tạo: mỗi tuần khác nhau qua `checkWeekVsNeighbours`. */
function kiemTuanMoi(cycleId: number | null, attemptNo: number, weeks: string[]): { blockers: string[]; warnings: string[]; theoTuan: Map<string, { blockers: string[]; warnings: string[] }> } {
  const blockers = new Set<string>();
  const warnings = new Set<string>();
  const theoTuan = new Map<string, { blockers: string[]; warnings: string[] }>();
  for (const w of new Set(weeks)) {
    const c = cycleId === null ? { blockers: [], warnings: [] }
      : checkWeekVsNeighbours({ cycleId, attemptNo, excludeAttemptId: null, newWeekStart: w });
    theoTuan.set(w, c);
    c.blockers.forEach((b) => blockers.add(b));
    c.warnings.forEach((x) => warnings.add(x));
  }
  return { blockers: [...blockers], warnings: [...warnings], theoTuan };
}

/** Lớp đang học của em (để kiểm quyền khi chưa có đợt nào). */
function lopDangHocCua(studentId: number): number | null {
  const r = db()
    .prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`)
    .get(studentId) as any;
  return r?.class_id ?? null;
}

export function xepMoi(p: Principal, i: {
  studentId: number; attemptNo?: number; tuan: Partial<Record<KyNangKH, number>>; bo?: KyNangKH[];
  lyDoBo?: string | null; force?: boolean;
}) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: lopDangHocCua(i.studentId), studentId: i.studentId }, PLAN_MSG);
  const bo = (i.bo ?? []).map(chonKyNang);
  const tuan = tuanDayDu(i.tuan, bo);
  /* CÙNG CÁCH CHỌN LỘ TRÌNH VỚI `createAttempt` (ưu tiên `active`, không có thì lộ trình gần nhất). */
  const cycle = currentCycle(i.studentId);
  if (!cycle) throw badRequest('Học viên chưa có lộ trình đang chạy.');
  const attemptNo = i.attemptNo ?? nextAttemptNo(cycle.id);   // T36: cùng luật đánh số với `createAttempt` (chốt ở đó)
  const dungTuan = KY_NANG_KE_HOACH.filter((k) => tuan[k] !== null);
  if (!dungTuan.length) throw badRequest('Cần ít nhất một kỹ năng thi trong đợt.');
  const periods = docTuan(dungTuan.map((k) => tuan[k]!));

  return tx(() => {
    const kiem = kiemTuanMoi(cycle.id, attemptNo, dungTuan.map((k) => periods.get(tuan[k]!).week_start));
    if (kiem.blockers.length) throw badRequest(kiem.blockers.join(' '));
    if (kiem.warnings.length && !i.force) throw badRequest(`${kiem.warnings.join(' ')} ${CAU_XAC_NHAN}`);

    const som = dungTuan.map((k) => periods.get(tuan[k]!)).sort((x, y) => x.week_start.localeCompare(y.week_start))[0];
    const created = createAttempt(p, { studentId: i.studentId, cycleId: cycle.id, attemptNo, periodId: som.id }) as any;
    conn.prepare(`UPDATE assessment_attempts SET plan_source = 'manual' WHERE id = ?`).run(created.id);
    for (const k of dungTuan) {
      if (tuan[k] !== som.id) setSkillWeek(p, created.id, k, tuan[k]!, { force: true });
    }
    for (const k of bo) setSkillSkip(p, created.id, k, true, i.lyDoBo ?? undefined);
    return created;
  });
}

// ---------------------------------------------------------------- lớp thường: lưới theo học viên × kỹ năng

export type DotThuong = { attemptId: number | null; kn: Partial<Record<KyNangKH, OKyNang>> };

function docLopThuong(classId: number) {
  const cls = db().prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const prog = programmeOfClass(classId);
  if (!prog || prog.scoringMode !== 'ratio') throw badRequest('Lớp này là Fast Track.');
  return { cls, prog };
}

export function luoiThuong(p: Principal, classId: number) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId }, PLAN_MSG);
  const { cls } = docLopThuong(classId);
  const progress = classProgress(classId);

  const students = conn
    .prepare(
      `SELECT s.id, s.full_name, s.student_code
         FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL
        ORDER BY s.full_name`,
    )
    .all(classId) as any[];
  const attempts = conn
    .prepare(
      `SELECT a.* FROM assessment_attempts a
         JOIN enrollments e ON e.student_id = a.student_id AND e.status = 'active' AND e.class_id = a.class_id
         JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL
        WHERE a.class_id = ? AND a.kind IN ('progress', 'final') AND a.status != 'cancelled'
        ORDER BY a.attempt_no DESC`,
    )
    .all(classId) as any[];
  const attemptIds = attempts.map((a) => a.id);
  const skillRows = loadSkillRows(attemptIds);
  const bundle = loadBundle(attemptIds);

  /* Tuần gốc của các dấu "-" đã dời (Q14) — một câu cho cả lớp. */
  const tuanDau = new Map<number, string>();
  const idsDau = [...new Set([...bundle.scores.values()].flat().map((s: any) => s.no_show_period_id).filter(Boolean))] as number[];
  if (idsDau.length) {
    for (const r of conn.prepare(`SELECT id, week_start FROM report_periods WHERE id IN (${phOf(idsDau.length)})`).all(...idsDau) as any[]) {
      tuanDau.set(r.id, r.week_start);
    }
  }

  const dotCua = (a: any): DotThuong => {
    const scores = bundle.scores.get(a.id) ?? [];
    const kn: Partial<Record<KyNangKH, OKyNang>> = {};
    for (const r of (skillRows.get(a.id) ?? []) as any[]) {
      if (!(KY_NANG_KE_HOACH as readonly string[]).includes(r.skill)) continue;
      const sc = scores.find((s: any) => s.skill === r.skill);
      const daDoi = !!sc?.no_show_period_id && sc.no_show_period_id !== r.planned_period_id;
      kn[r.skill as KyNangKH] = oKyNangCua('thuong', r, scores, daDoi, daDoi ? tuanDau.get(sc.no_show_period_id as number) ?? null : null);
    }
    return { attemptId: a.id, kn };
  };

  const theoEm = new Map<string, any>();
  for (const a of attempts) { const key = `${a.student_id}:${a.kind}`; if (!theoEm.has(key)) theoEm.set(key, a); }
  const hang = students.map((s) => {
    const dot = {} as Record<'progress' | 'final', DotThuong>;
    for (const kind of ['progress', 'final'] as const) {
      const a = theoEm.get(`${s.id}:${kind}`);
      dot[kind] = a ? dotCua(a) : { attemptId: null, kn: {} };
    }
    return { studentId: s.id as number, ten: s.full_name as string, ma: s.student_code as string, dot };
  });

  const nhanKhoa = (n: number | null) => (n && progress.totalWeeks ? tuanKhoaCua(n, progress.totalWeeks) : null);
  const hvChuaCoLich = students.filter((s) => !theoEm.has(`${s.id}:progress`) && !theoEm.has(`${s.id}:final`)).length;
  const cw = progress.currentWeek;
  return {
    classId, classCode: cls.code as string, chuongTrinh: progress.programmeCode as string | null,
    khaiGiang: progress.startWeekStart, tongTuan: progress.totalWeeks,
    tuanHienTai: cw && progress.totalWeeks ? (cw > progress.totalWeeks ? 'sau khoá' : cw >= 1 ? tuanKhoaCua(cw, progress.totalWeeks) : null) : null,
    hvChuaCoLich,
    cot: [
      { kind: 'progress' as const, nhan: KIND_NHAN.progress, deXuat: progress.progressWeekStart, nhanDeXuat: nhanKhoa(progress.progressWeek) },
      { kind: 'final' as const, nhan: KIND_NHAN.final, deXuat: progress.finalWeekStart, nhanDeXuat: nhanKhoa(progress.finalWeek) },
    ],
    hang,
  };
}

/** Xếp MỚI một bài Giữa/Cuối khoá cho MỘT em: tạo bằng `planRegularTests` rồi đặt tuần từng kỹ năng — hỏng thì cuộn lại cả. */
export function xepMoiThuong(p: Principal, i: {
  classId: number; studentId: number; kind: 'progress' | 'final'; tuan: Partial<Record<KyNangKH, number>>; force?: boolean;
}) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: i.classId }, PLAN_MSG);
  docLopThuong(i.classId);
  if (i.kind !== 'progress' && i.kind !== 'final') throw badRequest('Cần chọn Giữa khoá hoặc Cuối khoá.');
  const dangHoc = conn
    .prepare(`SELECT 1 FROM enrollments WHERE class_id = ? AND student_id = ? AND status = 'active'`)
    .get(i.classId, i.studentId);
  if (!dangHoc) throw badRequest('Học viên không thuộc lớp này.');
  const tuan = tuanDayDu(i.tuan) as Record<KyNangKH, number>;
  const periods = docTuan(KY_NANG_KE_HOACH.map((k) => tuan[k]));

  return tx(() => {
    const cycle = cycleThuong(i.studentId);
    if (cycle && conn.prepare('SELECT 1 FROM assessment_attempts WHERE cycle_id = ? AND kind = ?').get(cycle.id, i.kind)) {
      throw badRequest('Học viên đã có bài này rồi. Đổi tuần thay vì xếp mới.');
    }
    if (cycle) {
      const nextNo = ((conn.prepare('SELECT MAX(attempt_no) m FROM assessment_attempts WHERE cycle_id = ?').get(cycle.id) as any)?.m ?? 0) + 1;
      const kiem = kiemTuanMoi(cycle.id, nextNo, KY_NANG_KE_HOACH.map((k) => periods.get(tuan[k]).week_start));
      if (kiem.blockers.length) throw badRequest(kiem.blockers.join(' '));
      if (kiem.warnings.length && !i.force) throw badRequest(`${kiem.warnings.join(' ')} ${CAU_XAC_NHAN}`);
    }
    const ket = planRegularTests(p, i.classId, { studentIds: [i.studentId], kinds: [i.kind] });
    if (!ket.created) throw badRequest('Học viên đã có bài này rồi. Đổi tuần thay vì xếp mới.');
    const moi = conn
      .prepare(
        `SELECT a.id FROM assessment_attempts a WHERE a.student_id = ? AND a.class_id = ? AND a.kind = ?
          ORDER BY a.id DESC LIMIT 1`,
      )
      .get(i.studentId, i.classId, i.kind) as any;
    luuDot(p, { attemptId: moi.id, kyNang: KY_NANG_KE_HOACH.map((k) => ({ skill: k, periodId: tuan[k] })), force: true });
    return { id: moi.id as number };
  });
}

/** Lộ trình lớp thường đang chạy của em (`route IS NULL`) — cùng cách `planRegularTests` chọn. */
function cycleThuong(studentId: number) {
  return (db()
    .prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active' AND route IS NULL ORDER BY seq DESC LIMIT 1`)
    .get(studentId) as any) ?? null;
}

// ---------------------------------------------------------------- xếp lịch hàng loạt (R9, R9b) — theo từng kỹ năng

type LoaiDot = { loai: 'ft'; attemptNo: number } | { loai: 'thuong'; kind: 'progress' | 'final' };

/** Phân loại MỘT em cho xem trước — KHÔNG ghi gì. Trả kèm `attemptId` (nếu đã có đợt) để lưu. */
function xetMotEm(i: {
  studentId: number; ten: string; dot: LoaiDot; tuan: Partial<Record<KyNangKH, number>>; periods: Map<number, any>;
}): { dong: DongHangLoat; attemptId: number | null } {
  const conn = db();
  const nhanDot = i.dot.loai === 'ft' ? `MT${i.dot.attemptNo}` : KIND_NHAN[i.dot.kind];
  const co = KY_NANG_KE_HOACH.filter((k) => i.tuan[k]);
  const loi = (cau: string, bai: BaiXemTruoc[] = []) => ({
    dong: { studentId: i.studentId, ten: i.ten, hanhDong: 'loi' as const, bai, loi: cau }, attemptId: null as number | null,
  });

  const cycle = i.dot.loai === 'ft' ? currentCycle(i.studentId) : cycleThuong(i.studentId);
  if (i.dot.loai === 'ft' && !cycle) return loi('Học viên chưa có lộ trình đang chạy.');

  const existing = cycle
    ? (i.dot.loai === 'ft'
      ? conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND attempt_no = ? AND status != 'cancelled'`).get(cycle.id, i.dot.attemptNo)
      : conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND kind = ?`).get(cycle.id, i.dot.kind)) as any
    : null;

  if (!existing) {
    /* Em chưa có đợt: đợt mới luôn tạo đủ 4 dòng lịch (Q2) nên cần đủ 4 kỹ năng. */
    if (co.length < KY_NANG_KE_HOACH.length) return loi(`Em chưa có ${nhanDot} — cần chọn tuần cho cả 4 kỹ năng.`);
    /* K4-08: xem trước báo chặn ĐÚNG câu mà `createAttempt` sẽ ném — không để "tạo" rồi lưu mới hỏng. */
    if (i.dot.loai === 'ft' && cycle) {
      const loiSo = kiemSoMtMoi(luotSoCuaLoTrinh(cycle.id), i.dot.attemptNo);
      if (loiSo) return loi(`Chặn: ${loiSo}`);
    }
    const attemptNo = i.dot.loai === 'ft' ? i.dot.attemptNo
      : (cycle ? ((conn.prepare('SELECT MAX(attempt_no) m FROM assessment_attempts WHERE cycle_id = ?').get(cycle.id) as any)?.m ?? 0) + 1 : 1);
    const kiem = kiemTuanMoi(cycle?.id ?? null, attemptNo, co.map((k) => i.periods.get(i.tuan[k]!).week_start));
    const bai: BaiXemTruoc[] = co.map((k) => {
      const w = i.periods.get(i.tuan[k]!).week_start as string;
      const c = kiem.theoTuan.get(w)!;
      return c.blockers.length ? { skill: k, tu: null, den: w, ghiChu: 'chan', cau: c.blockers.join(' ') }
        : c.warnings.length ? { skill: k, tu: null, den: w, ghiChu: 'canh-bao', cau: c.warnings.join(' ') }
          : { skill: k, tu: null, den: w, ghiChu: 'moi', cau: null };
    });
    if (kiem.blockers.length) return loi(kiem.blockers.join(' '), bai);
    return { dong: { studentId: i.studentId, ten: i.ten, hanhDong: 'tao', bai, loi: null }, attemptId: null };
  }

  if (existing.status === 'cancelled') return loi(`${nhanDot} của em đã huỷ.`);
  const { bai } = kiemDotNoi(existing, co.map((k) => ({ skill: k, periodId: i.tuan[k]! })));
  const chan = bai.filter((b) => b.ghiChu === 'chan');
  if (chan.length) return { dong: { studentId: i.studentId, ten: i.ten, hanhDong: 'loi', bai, loi: [...new Set(chan.map((b) => b.cau))].join(' ') }, attemptId: existing.id };
  const doi = bai.some((b) => b.ghiChu !== 'giu');
  return { dong: { studentId: i.studentId, ten: i.ten, hanhDong: doi ? 'doi' : 'giu', bai, loi: null }, attemptId: existing.id };
}

export function xepHangLoat(p: Principal, i: {
  classId: number; attemptNo?: number; kind?: 'progress' | 'final'; studentIds: number[];
  tuan: Partial<Record<KyNangKH, number>>; force?: boolean; xemTruoc?: boolean;
}): { dong: DongHangLoat[]; daLuu: number } {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: i.classId }, PLAN_MSG);
  if ((i.attemptNo ? 1 : 0) + (i.kind ? 1 : 0) !== 1) throw badRequest('Cần chọn đúng một đợt để xếp.');
  const cls = conn
    .prepare(`SELECT pg.scoring_mode AS mode FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code WHERE c.id = ?`)
    .get(i.classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const laThuong = cls.mode === 'ratio';
  if (i.attemptNo && laThuong) throw badRequest('Lớp này là lớp thường — chọn Giữa khoá hoặc Cuối khoá.');
  if (i.kind && !laThuong) throw badRequest('Lớp này là Fast Track — chọn MT.');
  if (i.kind && i.kind !== 'progress' && i.kind !== 'final') throw badRequest('Cần chọn Giữa khoá hoặc Cuối khoá.');

  const tuan: Partial<Record<KyNangKH, number>> = {};
  for (const k of KY_NANG_KE_HOACH) if (i.tuan?.[k]) tuan[k] = i.tuan[k];
  if (!Object.keys(tuan).length) throw badRequest('Chưa chọn kỹ năng nào.');
  if (!i.studentIds?.length) throw badRequest('Chưa chọn học viên nào.');
  const periods = docTuan(Object.values(tuan) as number[]);

  /* Chỉ nhận HV đang học ĐÚNG lớp này — id ngoài lớp bị bỏ qua âm thầm, không trả tên (tránh lộ tên HV ngoài phạm vi). */
  const inClassIds = new Set(
    (conn
      .prepare(
        `SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'
           AND student_id IN (${phOf(i.studentIds.length)})`,
      )
      .all(i.classId, ...i.studentIds) as any[]).map((r) => r.student_id as number),
  );
  const studentIds = i.studentIds.filter((id) => inClassIds.has(id));
  if (!studentIds.length) throw badRequest('Chưa chọn học viên nào.');
  const names = new Map<number, string>(
    (conn.prepare(`SELECT id, full_name FROM students WHERE id IN (${phOf(studentIds.length)})`)
      .all(...studentIds) as any[]).map((s) => [s.id, s.full_name]),
  );

  const dot: LoaiDot = laThuong ? { loai: 'thuong', kind: i.kind! } : { loai: 'ft', attemptNo: i.attemptNo! };
  const xet = studentIds.map((studentId) => xetMotEm({ studentId, ten: names.get(studentId) ?? '', dot, tuan, periods }));
  if (i.xemTruoc) return { dong: xet.map((x) => x.dong), daLuu: 0 };

  let daLuu = 0;
  const ketQua = xet.map(({ dong, attemptId }) => {
    if (dong.hanhDong === 'giu' || dong.hanhDong === 'loi') return dong;
    const canhBao = [...new Set(dong.bai.filter((b) => b.ghiChu === 'canh-bao').map((b) => b.cau))];
    if (canhBao.length && !i.force) return { ...dong, hanhDong: 'loi' as const, loi: `${canhBao.join(' ')} ${CAU_XAC_NHAN}` };
    try {
      /* Mỗi em một `tx` riêng (bên trong các hàm dưới): lỗi của em này không huỷ các em khác (R9b, Q1). */
      if (dong.hanhDong === 'tao') {
        if (dot.loai === 'ft') xepMoi(p, { studentId: dong.studentId, attemptNo: dot.attemptNo, tuan, force: true });
        else xepMoiThuong(p, { classId: i.classId, studentId: dong.studentId, kind: dot.kind, tuan, force: true });
      } else {
        luuDot(p, {
          attemptId: attemptId!, force: true,
          kyNang: dong.bai.filter((b) => b.ghiChu !== 'giu').map((b) => ({ skill: b.skill, periodId: tuan[b.skill]! })),
        });
      }
      daLuu += 1;
      return dong;
    } catch (e: any) {
      /* AN-5: `chanGiaoDichNeuSapHetGio` (db.ts) có thể từ chối một `tx` khi sắp hết giờ — lỗi đó cũng rơi vào đúng dòng
       * này, không làm hỏng cả lô. Người dùng bấm Lưu lại cho các dòng còn lỗi (R9b). */
      return { ...dong, hanhDong: 'loi' as const, loi: e?.message ?? 'Không lưu được.' };
    }
  });

  writeAudit({
    actorUserId: p.userId, action: 'ke_hoach.hang_loat', entityType: 'class', entityId: i.classId,
    entityLabel: dot.loai === 'ft' ? `MT${dot.attemptNo}` : KIND_NHAN[dot.kind],
    before: null, after: { daLuu, loi: ketQua.filter((d) => d.hanhDong === 'loi').map((d) => ({ studentId: d.studentId, loi: d.loi })) },
  });
  return { dong: ketQua, daLuu };
}
