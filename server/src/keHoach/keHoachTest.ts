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
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { db, theoLo, tx } from '../db.ts';
import {
  CO_DIEM_SQL, KY_NANG_KE_HOACH, MT_TOI_DA, O_KE_HOACH, PERMISSIONS, boMonLich, kiemLyDoThaoTac, kiemSoMtMoi, kiemTuanDaQua, laLichSu, lichMtMacDinh, viecXepMt, laVaoMuon, soMtKeTiep, soSanhLop, tenMon, tenMonNgan, tieuDeKeHoach, tomTatLopFT, trangThaiKyNang,
  tuanKhoa as tuanKhoaCua,
  type BaiXemTruoc, type DongHangLoat, type KyNangKH, type LuotSo, type LuotXep, type OKyNang,
} from '../../../shared/domain/index.ts';
import { badRequest, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { entrySkillsOf, expectationFor } from '../fasttrack/scoring.ts';
import { createAttempt, loadBundle, saveScore, scoresOf, setSkillSkip } from '../fasttrack/attempts.ts';
import { currentCycle, nextAttemptNo } from '../fasttrack/cycles.ts';
import {
  boTuanLuot, canXacNhanHuyLich, checkWeekVsNeighbours, kiemVuot, loadSkillRows, lyDoHuyVuot, setSitStatus, setSkillWeek, tuanCuoiSauKhiDoi,
  type LuotSeHuyLich,
} from '../fasttrack/skillSchedule.ts';
import { pendingMovesFor } from '../fasttrack/absence.ts';
import { mondayOf } from '../platform/week.ts';
import { writeAudit } from '../platform/audit.ts';
import { classProgress, classProgressMany, suggestedMockWeeks, type SuggestedMock } from '../classes/schedule.ts';
import { planRegularTests, programmeByCode, programmeOfClass } from '../normal/regular.ts';

const KIND_NHAN: Record<'progress' | 'final', 'Giữa khoá' | 'Cuối khoá'> = { progress: 'Giữa khoá', final: 'Cuối khoá' };
const CAU_XAC_NHAN = 'Xác nhận lại nếu vẫn muốn xếp vào tuần này.';
const PLAN_MSG = 'Chỉ Quản lý xếp được lịch Test.';

/** Bộ môn xếp lịch của lớp thường (bảng `programme_skills`, Pre FOU `tong_hop`) — K4-16. */
const boMonThuong = (prog: { code: string; skills: readonly string[] } | null): KyNangKH[] =>
  boMonLich(prog?.code ?? null, prog?.skills).filter((k): k is KyNangKH => (O_KE_HOACH as readonly string[]).includes(k));
const cauThieuMon = (bo: readonly KyNangKH[]) => (bo.length === 1 ? 'Cần chọn tuần cho 1 môn.' : `Cần chọn tuần cho cả ${bo.length} môn.`);

const phOf = (n: number) => Array.from({ length: n }, () => '?').join(',');
const thuTuKn = (k: string) => (O_KE_HOACH as readonly string[]).indexOf(k);

/* Nhận cả ô `tong_hop` (Pre FOU); môn có thuộc ĐÚNG lượt không thì `setSkillWeek` kiểm bằng `boMonCuaLuot`. */
function chonKyNang(skill: string): KyNangKH {
  if (!(O_KE_HOACH as readonly string[]).includes(skill)) throw badRequest('Kỹ năng không hợp lệ.');
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
          WHERE e.class_id IN (${phOf(ftClassIds.length)}) AND ${HV_DANG_HOC_SQL('s')}`,
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
           JOIN students s ON s.id = a.student_id AND ${HV_DANG_HOC_SQL('s')}
          WHERE a.class_id IN (${phOf(ftClassIds.length)}) AND a.status != 'cancelled'`,
      )
      .all(...ftClassIds) as any[]) {
      if (!luotCuaLop.has(r.class_id)) luotCuaLop.set(r.class_id, []);
      luotCuaLop.get(r.class_id)!.push({ hv: r.student_id, no: r.attempt_no, status: r.status });
    }
  }
  /* K4-11, Q7 (PR-XLMT): em cần Quản lý xếp lại — kỹ năng vắng CHƯA có đề nghị chờ + phần thi đã huỷ, lượt còn chạy, không lịch sử. */
  const canXepLai = new Map<number, number>();
  if (ftClassIds.length) {
    for (const r of conn
      .prepare(
        `SELECT a.class_id, COUNT(DISTINCT a.student_id) AS n FROM attempt_skills k
           JOIN assessment_attempts a ON a.id = k.attempt_id AND a.status = 'planned' AND a.lich_su = 0 AND a.kind = 'mock'
           JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
          WHERE a.class_id IN (${phOf(ftClassIds.length)}) AND k.required = 1 AND k.sit_status IN ('absent', 'cancelled')
            AND NOT EXISTS (SELECT 1 FROM skill_move_requests r WHERE r.attempt_id = a.id AND r.skill = k.skill AND r.status = 'pending')
          GROUP BY a.class_id`,
      )
      .all(...ftClassIds) as any[]) canXepLai.set(r.class_id, r.n);
  }
  const tomTatFT = (classId: number): string => {
    const luot = luotCuaLop.get(classId) ?? [];
    const hv = hvCuaLop.get(classId) ?? [];
    const dangThi = luot.filter((l) => l.status === 'planned').map((l) => l.no);
    const a = dangThi.length ? Math.min(...dangThi) : null;
    const b = a !== null ? a + 1 : (luot.length ? Math.max(...luot.map((l) => l.no)) : 0) + 1;
    const coB = new Set(luot.filter((l) => l.no === b).map((l) => l.hv));
    const soEm = hv.filter((id) => !coB.has(id)).length;
    return tomTatLopFT({ dangThi: a, chuaXep: { dot: b, soEm }, canXepLai: canXepLai.get(classId) ?? 0 });
  };

  /* Lớp thường: tiến độ (một lượt gom) + số em chưa có bài (một câu). */
  const progressAll = classProgressMany(thuongIds);
  const hvChuaCoLich = new Map<number, number>();
  if (thuongIds.length) {
    for (const r of conn
      .prepare(
        `SELECT e.class_id AS class_id, COUNT(*) AS n
           FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
          WHERE e.class_id IN (${phOf(thuongIds.length)}) AND ${HV_DANG_HOC_SQL('s')}
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
        canXepLai: canXepLai.get(r.id) ?? 0,
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

/**
 * `them` (PR-XLMT, K4-11 — chỉ lưới FT truyền): chờ duyệt dời, lượt lịch sử, ngày nghiệp vụ → chip vắng · chờ duyệt · trễ · đã huỷ.
 * Trễ = tuần thi đã hết (Chủ nhật < hôm nay), chưa đủ điểm, không vắng/huỷ, lượt không lịch sử.
 */
function oKyNangCua(cheDo: CheDo, row: any, scores: any[], daDoi: boolean, doiTu: string | null,
  them?: { choDuyet: boolean; lichSu: boolean; homNay: string }): OKyNang {
  const batBuoc = row.required === 1;
  const xong = xongKyNang(cheDo, row.skill, scores);
  const choDuyet = !!them?.choDuyet;
  const co = them ? {
    choDuyet,
    vang: row.sit_status === 'absent' && !choDuyet,
    huy: row.sit_status === 'cancelled',
    tre: !xong && !them.lichSu && !!row.week_end && row.sit_status !== 'absent' && row.sit_status !== 'cancelled'
      && String(row.week_end).slice(0, 10) < them.homNay,
  } : {};
  return {
    trangThai: trangThaiKyNang({ batBuoc, tuan: row.week_start ?? null, xong, daDoi, ...co }),
    tuan: row.week_start ?? null, periodId: row.planned_period_id ?? null, doiTu: daDoi ? doiTu : null, batBuoc,
    khoa: khoaCua(cheDo, row, scores),
    sit: row.sit_status ?? null, tuanKetThuc: row.week_end ?? null, choDuyet,
  };
}

// ---------------------------------------------------------------- lưới Fast Track

/** `do` (PR-XLMT): có kỹ năng xong và còn kỹ năng phải thi · `huyPhan`: có phần thi đã huỷ. */
export type DotFT = {
  attemptId: number | null; trangThaiDot: string | null; kn: Partial<Record<KyNangKH, OKyNang>>; lichSu?: boolean;
  do?: boolean; huyPhan?: boolean;
};

export function luoiFT(p: Principal, classId: number, today: string = demoToday()) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId }, PLAN_MSG);
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');

  const students = conn
    .prepare(
      `SELECT s.id, s.full_name, s.student_code, s.status, e.started_at
         FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND ${HV_DANG_HOC_SQL('s')}
        ORDER BY s.full_name`,
    )
    .all(classId) as any[];
  const studentIds = students.map((s) => s.id);

  /* Q12 (PR-XLMT): lượt theo LỘ TRÌNH ĐANG CHẠY của em, không theo lớp — em chuyển lớp FT giữ lộ trình vẫn thấy MT cũ. */
  const attempts = studentIds.length
    ? (conn
        .prepare(
          `SELECT a.* FROM assessment_attempts a
             JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
            WHERE a.kind = 'mock' AND a.student_id IN (${phOf(studentIds.length)})
            ORDER BY a.attempt_no`,
        )
        .all(...studentIds) as any[])
    : [];

  const attemptIds = attempts.map((a) => a.id);
  const skillRows = loadSkillRows(attemptIds);
  const bundle = loadBundle(attemptIds);
  const choDuyet = pendingMovesFor(attemptIds);
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

  const knCua = (a: any): Partial<Record<KyNangKH, OKyNang>> => {
    const scores = bundle.scores.get(a.id) ?? [];
    const kn: Partial<Record<KyNangKH, OKyNang>> = {};
    for (const r of (skillRows.get(a.id) ?? []) as any[]) {
      if (!(KY_NANG_KE_HOACH as readonly string[]).includes(r.skill)) continue;
      const daDoi = (r.absence_move_count ?? 0) > 0;
      kn[r.skill as KyNangKH] = oKyNangCua('ft', r, scores, daDoi, daDoi ? dichuyenGanNhat.get(`${a.id}:${r.skill}`) ?? null : null,
        { choDuyet: choDuyet.has(`${a.id}:${r.skill}`), lichSu: !!a.lich_su, homNay: today });
    }
    return kn;
  };

  const soKeTiepCua = new Map<number, number>(students.map((s) => [s.id as number, soMtKeTiep((tatCaCua.get(s.id) ?? []).map((a) => ({
    attempt_no: a.attempt_no, status: a.status,
    coDiem: (bundle.scores.get(a.id) ?? []).some((x: any) => (x.band ?? null) !== null || (x.raw_score ?? null) !== null),
  })))]));
  /* T37: cột 1 … min(MT8, max(số lớn nhất còn hiệu lực, MT kế tiếp lớn nhất, lịch mặc định của lộ trình lớp)). */
  const soCot = Math.min(MT_TOI_DA, Math.max(
    lichMtMacDinh(cls.route ?? null).length,
    ...attempts.filter((a) => a.status !== 'cancelled').map((a) => a.attempt_no as number),
    ...soKeTiepCua.values(),
  ));
  const cot = Array.from({ length: soCot }, (_, i) => i + 1);

  const hang = students.map((s) => {
    const dot: Record<number, DotFT> = {};
    const mine = attemptsByStudent.get(s.id) ?? [];
    for (const n of cot) {
      const a = mine.find((x) => x.attempt_no === n);
      if (!a) { dot[n] = { attemptId: null, trangThaiDot: null, kn: {} }; continue; }
      const kn = knCua(a);
      const batBuoc = Object.values(kn).filter((o) => o && o.trangThai !== 'khong-yeu-cau') as OKyNang[];
      const xongCa = batBuoc.length > 0 && batBuoc.every((o) => o.trangThai === 'xong');
      dot[n] = {
        attemptId: a.id, trangThaiDot: a.status === 'done' || xongCa ? 'xong' : a.status, kn, lichSu: !!a.lich_su,
        do: batBuoc.some((o) => o.trangThai === 'xong') && batBuoc.some((o) => o.trangThai !== 'xong' && o.trangThai !== 'da-huy'),
        huyPhan: batBuoc.some((o) => o.sit === 'cancelled'),
      };
    }
    return {
      studentId: s.id as number, ten: s.full_name as string, ma: s.student_code as string,
      vaoMuon: laVaoMuon(s.started_at ?? null, cls.start_date ?? null), dot,
      /* K4-08: chỉ ô MT kế tiếp có "+ xếp" (Q11) — tính trên cả lộ trình của em (Q12). */
      soKeTiep: soKeTiepCua.get(s.id)!,
    };
  });

  return { classId, classCode: cls.code as string, cot, hang };
}

// ---------------------------------------------------------------- PR-LM: bảng lịch MT ở panel Lộ trình

/** Trạng thái một lượt ở bảng lịch MT của panel Lộ trình — quyết định nút chính của hàng (Xếp lịch / Dời lịch / Nhập điểm). */
export type TrangThaiLuotMt = 'chua-xep' | 'da-xep' | 'co-diem' | 'lich-su' | 'huy';
export type LuotLichMt = {
  attemptId: number; trangThai: TrangThaiLuotMt; lichSu: boolean;
  kyNang: Array<{ skill: KyNangKH; periodId: number | null; weekStart: string | null; coDiem: boolean; daThi: boolean; batBuoc: boolean }>;
  /** D5: kỳ vọng CỦA LƯỢT (Target − 1.0 ở MT1, − 0.5 ở MT2, − 0 từ MT3; RF = Target). */
  kyVong: number | null;
  /** Ô từng kỹ năng đúng như lưới Kế hoạch Test — hộp xếp lịch (`HopKyNang`) dùng thẳng. */
  kn: Partial<Record<KyNangKH, OKyNang>>;
};
/** Một hàng: đề xuất của lịch mặc định (nếu lượt nằm trong lịch mặc định) + lượt thật (nếu đã có). */
export type HangLichMt = Omit<SuggestedMock, 'studyWeek' | 'periodId' | 'weekStart' | 'code'> & {
  studyWeek: number | null; periodId: number | null; weekStart: string | null; code: string | null;
  luot: LuotLichMt | null;
};

/**
 * BẢNG LỊCH MT của một lộ trình FT (panel Lộ trình, PR-LM mục 2/3): lịch mặc định đề xuất (`suggestedMockWeeks`, giữ nguyên cho
 * "Áp lịch") GHÉP với mọi lượt MT còn hiệu lực — kể cả MT4+ xếp tay. Mỗi lượt kèm trạng thái, tuần từng kỹ năng, kỳ vọng, ô Kế
 * hoạch Test. `soKeTiep` = số MT cho nút "+ Thêm MT" (đánh số liền mạch, T36). Chỉ đọc.
 */
export function lichMtLoTrinh(cycleId: number, today: string = demoToday()): {
  hang: HangLichMt[]; soKeTiep: number; classId: number | null; studentId: number;
} {
  const conn = db();
  const cy = conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(cycleId) as any;
  if (!cy) throw notFound('Không tìm thấy lộ trình');
  const goiY = suggestedMockWeeks(cycleId);
  const tatCa = conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock' ORDER BY attempt_no`).all(cycleId) as any[];
  const con = tatCa.filter((a) => a.status !== 'cancelled');
  const ids = con.map((a) => a.id as number);
  const rows = loadSkillRows(ids);
  const bundle = loadBundle(ids);
  const choDuyet = pendingMovesFor(ids);

  const luotCua = (a: any): LuotLichMt => {
    const scores = bundle.scores.get(a.id) ?? [];
    const ds = ((rows.get(a.id) ?? []) as any[]).filter((r) => (KY_NANG_KE_HOACH as readonly string[]).includes(r.skill));
    const kn: Partial<Record<KyNangKH, OKyNang>> = {};
    const kyNang = ds.map((r) => {
      const daDoi = (r.absence_move_count ?? 0) > 0;
      const o = oKyNangCua('ft', r, scores, daDoi, null, { choDuyet: choDuyet.has(`${a.id}:${r.skill}`), lichSu: !!a.lich_su, homNay: today });
      kn[r.skill as KyNangKH] = o;
      return { skill: r.skill as KyNangKH, periodId: r.planned_period_id ?? null, weekStart: r.week_start ?? null,
        coDiem: o.khoa === 'đã có điểm', daThi: r.sit_status === 'sat', batBuoc: !!r.required };
    });
    const coDiem = scores.some((x: any) => (x.band ?? null) !== null || (x.raw_score ?? null) !== null);
    const batBuoc = kyNang.filter((k) => k.batBuoc);
    const trangThai: TrangThaiLuotMt = a.status === 'cancelled' ? 'huy' : coDiem ? 'co-diem' : a.lich_su ? 'lich-su'
      : batBuoc.length && batBuoc.every((k) => !k.weekStart) || (!ds.length && !a.planned_period_id) ? 'chua-xep' : 'da-xep';
    return {
      attemptId: a.id, trangThai, lichSu: !!a.lich_su, kyNang, kn,
      kyVong: expectationFor(a.target_at_attempt ?? null, a.attempt_no, cy.route ?? null),
    };
  };

  const so = [...new Set([...goiY.map((g) => g.attemptNo), ...con.map((a) => a.attempt_no as number)])].sort((x, y) => x - y);
  const hang: HangLichMt[] = so.map((n) => {
    const g = goiY.find((x) => x.attemptNo === n);
    const a = con.find((x) => x.attempt_no === n) ?? null;
    return {
      attemptNo: n, studyWeek: g?.studyWeek ?? null, periodId: g?.periodId ?? null, weekStart: g?.weekStart ?? null, code: g?.code ?? null,
      existingAttemptId: a?.id ?? null, existingPeriodId: a?.planned_period_id ?? null, existingSource: (a?.plan_source ?? null) as any,
      locked: g?.locked ?? (!!a && a.status === 'done'),
      luot: a ? luotCua(a) : null,
    };
  });
  const soKeTiep = soMtKeTiep(tatCa.map((a) => ({
    attempt_no: a.attempt_no, status: a.status,
    coDiem: (conn.prepare(`SELECT ${CO_DIEM_SQL('a')} AS c FROM assessment_attempts a WHERE a.id = ?`).get(a.id) as any).c === 1,
  })));
  const lop = conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC`).get(cy.student_id) as any;
  return { hang, soKeTiep, classId: lop?.class_id ?? null, studentId: cy.student_id };
}

// ---------------------------------------------------------------- kiểm + lưu một đợt, từng kỹ năng

type YeuCauKyNang = { skill: KyNangKH; periodId: number };

/**
 * Kiểm từng kỹ năng của một đợt đã có — KHÔNG ghi. `duaLai` = kỹ năng đang bị bỏ mà lần lưu này đưa lại (bỏ qua "không thi").
 * `pre` (PR-XLMT): dữ liệu đã đọc theo lô (hàng loạt nhiều em) — không đọc lại. `canLyDo` = có bài dời mà tuần thi cũ đã bắt đầu (K4-15).
 * Tuần đích đã qua → chặn (K2-33: tuần đã qua chỉ để TẠO MT lịch sử, không dời lượt có sẵn vào đó).
 * `pre.choHuyLich` (PR-LM, chỉ hộp một đợt): lượt sau bị vượt thành `seHuyLich` (lưu cần xác nhận) thay vì chặn; MT lịch sử (D3) đổi
 * tuần được kể cả kỹ năng đã có điểm, tuần đích đã qua theo luật tạo MT lịch sử, luôn cần lý do. Xếp hàng loạt giữ luật chặn cũ.
 */
function kiemDotNoi(a: any, kyNang: YeuCauKyNang[], duaLai: Set<KyNangKH> = new Set(),
  pre: { rows?: any[]; scores?: any[]; periods?: Map<number, any>; homNay?: string; choHuyLich?: boolean } = {},
): { bai: BaiXemTruoc[]; canLyDo: boolean; seHuyLich: LuotSeHuyLich[] } {
  const conn = db();
  const cheDo: CheDo = a.kind === 'mock' ? 'ft' : 'thuong';
  const homNay = pre.homNay ?? demoToday();
  const lichSu = !!pre.choHuyLich && !!a.lich_su;
  const rows = pre.rows ?? (loadSkillRows([a.id]).get(a.id) ?? []) as any[];
  const scores = pre.scores ?? loadBundle([a.id]).scores.get(a.id) ?? [];
  const periods = new Map<number, any>();
  for (const id of new Set(kyNang.map((k) => k.periodId))) {
    const pr = pre.periods?.get(id) ?? conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(id) as any;
    if (!pr) throw notFound('Không tìm thấy tuần');
    periods.set(id, pr);
  }
  const vaoWeb = lichSu ? String((conn.prepare('SELECT created_at FROM students WHERE id = ?').get(a.student_id) as any)?.created_at ?? '') : '';
  const bai: BaiXemTruoc[] = [];
  /* Vòng 1: bài giữ nguyên / bị khoá / tuần đã qua. Bài còn lại là bài DỜI — kiểm vượt và lượt lân cận ở vòng 2 (cần đủ bộ tuần mới). */
  const doi: Array<{ i: number; k: YeuCauKyNang; row: any; pr: any }> = [];
  let canLyDo = false;
  for (const k of kyNang) {
    const row = rows.find((r) => r.skill === k.skill);
    const tu = row?.week_start ?? null;
    const pr = periods.get(k.periodId);
    if (!row || (!row.required && !duaLai.has(k.skill))) {
      bai.push({ skill: k.skill, tu, den: tu, ghiChu: 'giu', cau: 'Đợt này không thi kỹ năng này.' });
      continue;
    }
    const khoa = khoaCua(cheDo, row, scores);
    if (khoa && !(lichSu && khoa !== 'đã huỷ phần thi')) { bai.push({ skill: k.skill, tu, den: tu, ghiChu: 'giu', cau: khoa }); continue; }
    if (row.planned_period_id === k.periodId) { bai.push({ skill: k.skill, tu, den: tu, ghiChu: 'giu', cau: null }); continue; }
    const qua = kiemTuanDaQua({ ketThuc: [pr.week_end], ngayVaoWeb: vaoWeb, homNay, taoMoi: lichSu }).cau;
    if (qua) { bai.push({ skill: k.skill, tu, den: pr.week_start, ghiChu: 'chan', cau: qua }); continue; }
    if (lichSu || (row.week_start && String(row.week_start).slice(0, 10) <= mondayOf(homNay) && row.sit_status !== 'absent')) canLyDo = true;
    doi.push({ i: bai.length, k, row, pr });
    bai.push({ skill: k.skill, tu, den: pr.week_start, ghiChu: 'doi', cau: null });
  }

  const vuot = pre.choHuyLich && doi.length
    ? kiemVuot(a.id, tuanCuoiSauKhiDoi(rows, new Map(doi.map((d) => [d.k.skill, d.pr.week_start])))!)
    : { biVuot: [], chan: null };
  const boQua = vuot.biVuot.map((x) => x.attemptId);
  const checks = new Map<string, { blockers: string[]; warnings: string[] }>();
  for (const d of doi) {
    const b = bai[d.i];
    if (vuot.chan) { b.ghiChu = 'chan'; b.cau = vuot.chan; continue; }
    let c = checks.get(d.pr.week_start);
    if (!c) {
      c = checkWeekVsNeighbours({ cycleId: a.cycle_id, attemptNo: a.attempt_no, excludeAttemptId: a.id, newWeekStart: d.pr.week_start, boQua });
      checks.set(d.pr.week_start, c);
    }
    if (c.blockers.length) { b.ghiChu = 'chan'; b.cau = c.blockers.join(' '); }
    else if (c.warnings.length) { b.ghiChu = 'canh-bao'; b.cau = c.warnings.join(' '); }
  }
  return { bai, canLyDo, seHuyLich: vuot.chan ? [] : vuot.biVuot };
}

function docDot(attemptId: number) {
  const a = db().prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
  if (!a) throw notFound('Không tìm thấy đợt kiểm tra');
  return a;
}

export function kiemDot(p: Principal, i: { attemptId: number; kyNang: YeuCauKyNang[] }) {
  const a = docDot(i.attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }, PLAN_MSG);
  for (const k of i.kyNang) chonKyNang(k.skill);
  return kiemDotNoi(a, i.kyNang, new Set(), { choHuyLich: true });
}

/** Lưu MỘT ĐỢT (hộp chip bấm Lưu một lần): kiểm hết rồi mới ghi, một `tx` — chặn một kỹ năng thì cả lần lưu không đổi gì. */
export function luuDot(p: Principal, i: {
  attemptId: number; kyNang: Array<{ skill: KyNangKH; periodId?: number | null; bo?: boolean }>;
  lyDoBo?: string | null; force?: boolean; reason?: string | null;
  /** Lượt vừa tạo trong cùng lần xếp (`xepMoiThuong`) — đặt tuần, không phải dời (K4-15). */
  khiTao?: boolean;
  /** PR-LM (Q-0310-1): người dùng đã xác nhận huỷ lịch các lượt bị vượt (`seHuyLich` của kiểm trước). Thiếu → 409. */
  xacNhanHuyLich?: boolean;
}): { ok: true; doi: KyNangKH[]; daHuyLich: LuotSeHuyLich[] } {
  const a = docDot(i.attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }, PLAN_MSG);
  for (const k of i.kyNang) chonKyNang(k.skill);

  const duaLai = new Set(i.kyNang.filter((k) => k.bo === false).map((k) => k.skill));
  const datTuan = i.kyNang.filter((k) => k.periodId && !k.bo) as YeuCauKyNang[];
  const kiem = kiemDotNoi(a, datTuan, duaLai, { choHuyLich: !i.khiTao });
  const chan = kiem.bai.filter((b) => b.ghiChu === 'chan');
  if (chan.length) {
    const ct = (db().prepare('SELECT programme_code FROM classes WHERE id = ?').get(a.class_id) as any)?.programme_code ?? null;
    throw badRequest(chan.map((b) => `${tenMonNgan(ct, b.skill)}: ${b.cau}`).join(' '));
  }
  const cb = kiem.bai.filter((b) => b.ghiChu === 'canh-bao');
  if (cb.length && !i.force) throw badRequest(`${[...new Set(cb.map((b) => b.cau))].join(' ')} ${CAU_XAC_NHAN}`);
  if (kiem.seHuyLich.length && !i.xacNhanHuyLich) throw canXacNhanHuyLich(kiem.seHuyLich);

  const rows = (loadSkillRows([i.attemptId]).get(i.attemptId) ?? []) as any[];
  const tuanCuoi = kiem.bai.filter((b) => b.ghiChu === 'doi' || b.ghiChu === 'canh-bao').map((b) => b.den!).sort().pop() ?? '';
  return tx(() => {
    for (const l of kiem.seHuyLich) boTuanLuot(p, l.attemptId, { lyDo: lyDoHuyVuot(a, tuanCuoi, i.reason), doVuotBoi: a.id });
    for (const k of i.kyNang) {            // bo=true: đang bắt buộc → bỏ; bo=false: đang bỏ → đưa lại
      const r = rows.find((x) => x.skill === k.skill);
      if (k.bo !== undefined && r && !!r.required === k.bo) setSkillSkip(p, i.attemptId, k.skill, k.bo, i.lyDoBo ?? undefined);
    }
    const doi = kiem.bai.filter((b) => b.ghiChu === 'doi' || b.ghiChu === 'canh-bao');
    for (const b of doi) {
      setSkillWeek(p, i.attemptId, b.skill, datTuan.find((k) => k.skill === b.skill)!.periodId, { reason: i.reason ?? null, force: true, khiTao: i.khiTao });
    }
    return { ok: true as const, doi: doi.map((b) => b.skill), daHuyLich: kiem.seHuyLich };
  });
}

/**
 * THI LẠI (T37 "ép vào đợt trùng", §5.5, Q13 — chủ sản phẩm chốt 29/09 câu 1 = A): Quản lý cho em thi lại kỹ năng ĐÃ CÓ ĐIỂM ở
 * chính đợt đó — xoá ô (RB-5 ghi lý do, lịch sử điểm giữ giá trị cũ) → "chờ thi" → tuần mới. Mọi ô của kỹ năng (W1 + W2). Một `tx`.
 */
export function thiLai(p: Principal, i: { attemptId: number; skills: string[]; periodId: number; lyDo: string; force?: boolean }) {
  const a = docDot(i.attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }, PLAN_MSG);
  if (a.kind !== 'mock' || a.lich_su || a.status === 'cancelled') throw badRequest('Chỉ thi lại được ở lượt Mock đang chạy.');
  const loi = kiemLyDoThaoTac('Thi lại', i.lyDo);
  if (loi) throw badRequest(loi);
  if (!i.skills?.length) throw badRequest('Chưa chọn kỹ năng thi lại.');
  const lyDo = `Thi lại: ${i.lyDo.trim()}`;
  /* Rà #126: thi lại chỉ cho kỹ năng ĐÃ CÓ ĐIỂM — vắng / đã huỷ đi luồng Xếp lại bài vắng / Khôi phục, không qua đây. */
  const diem = scoresOf(i.attemptId);
  for (const k of i.skills.map(chonKyNang)) {
    if (!entrySkillsOf(k as any).some((e) => diem.some((x) => x.skill === e && (x.band != null || x.raw_score != null)))) {
      throw badRequest(`${tenMon(null, k)} chưa có điểm — không thi lại. Em vắng thì dùng "Xếp lại bài vắng"; phần thi đã huỷ thì "Khôi phục và đặt tuần".`);
    }
  }
  return tx(() => {
    for (const k of i.skills.map(chonKyNang)) {
      for (const e of entrySkillsOf(k as any)) {
        const s = scoresOf(i.attemptId).find((x) => x.skill === e);
        if (s && (s.band != null || s.raw_score != null)) {
          saveScore(p, i.attemptId, e, { rawScore: null, criteria: [null, null, null, null], lyDo });
        }
      }
      setSitStatus(p, i.attemptId, k, 'scheduled', lyDo);
      setSkillWeek(p, i.attemptId, k, i.periodId, { reason: lyDo, force: !!i.force });
    }
    return { ok: true as const };
  });
}

/**
 * HUỶ ĐIỂM (T38) một kỹ năng FT — mọi ô được chọn (Writing: W1 và/hoặc W2) trong MỘT `tx`: lỗi ở ô sau thì ô trước cuộn lại,
 * không còn nửa điểm (rà #126). Mỗi ô đi qua `saveScore` (quyền, R11, RB-5 ghi lý do vào Lịch sử).
 */
export function huyDiem(p: Principal, i: { attemptId: number; skill: string; o?: string[]; lyDo: string }) {
  const loi = kiemLyDoThaoTac('Huỷ điểm', i.lyDo);
  if (loi) throw badRequest(loi);
  const tatCa = entrySkillsOf(chonKyNang(i.skill) as any) as string[];
  const o = i.o?.length ? i.o : tatCa;
  if (o.some((e) => !tatCa.includes(e))) throw badRequest('Ô không thuộc kỹ năng này.');
  const diem = scoresOf(i.attemptId);
  const coDiem = o.filter((e) => diem.some((x) => x.skill === e && (x.band != null || x.raw_score != null)));
  if (!coDiem.length) throw badRequest(`${tenMon(null, i.skill)} chưa có điểm để huỷ.`);
  return tx(() => {
    for (const e of coDiem) saveScore(p, i.attemptId, e, { rawScore: null, criteria: [null, null, null, null], lyDo: i.lyDo.trim() });
    return { ok: true as const, huy: coDiem };
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
function tuanDayDu(
  tuan: Partial<Record<KyNangKH, number>>, bo: KyNangKH[] = [],
  /** Bộ phải đủ: FT 4 kỹ năng; lớp thường = bộ môn chương trình (K4-16 — Pre FOU 1 môn). */
  ds: readonly KyNangKH[] = KY_NANG_KE_HOACH, cauThieu = 'Cần chọn tuần cho cả 4 kỹ năng.',
): Record<KyNangKH, number | null> {
  const out = {} as Record<KyNangKH, number | null>;
  for (const k of ds) {
    if (bo.includes(k)) { out[k] = null; continue; }
    const id = tuan[k];
    if (!id) throw badRequest(cauThieu);
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
  /* T34 × K2-33 (PR-XLMT, Q8): tuần đã qua chỉ để TẠO MT lịch sử — mọi kỹ năng đã qua VÀ em vào web sau các tuần đó; trộn qua/tới bị chặn.
   * Qua kiểm này thì tuần sớm nhất và muộn nhất cùng phía hôm nay → `createAttempt` đặt `lich_su` theo tuần sớm nhất vẫn đúng. */
  const vaoWeb = String((conn.prepare('SELECT created_at FROM students WHERE id = ?').get(i.studentId) as any)?.created_at ?? '');
  const qua = kiemTuanDaQua({ ketThuc: dungTuan.map((k) => periods.get(tuan[k]!).week_end), ngayVaoWeb: vaoWeb, homNay: demoToday(), taoMoi: true });
  if (qua.cau) throw badRequest(qua.cau);

  return tx(() => {
    const kiem = kiemTuanMoi(cycle.id, attemptNo, dungTuan.map((k) => periods.get(tuan[k]!).week_start));
    if (kiem.blockers.length) throw badRequest(kiem.blockers.join(' '));
    if (kiem.warnings.length && !i.force) throw badRequest(`${kiem.warnings.join(' ')} ${CAU_XAC_NHAN}`);

    const som = dungTuan.map((k) => periods.get(tuan[k]!)).sort((x, y) => x.week_start.localeCompare(y.week_start))[0];
    const created = createAttempt(p, { studentId: i.studentId, cycleId: cycle.id, attemptNo, periodId: som.id }) as any;
    conn.prepare(`UPDATE assessment_attempts SET plan_source = 'manual' WHERE id = ?`).run(created.id);
    for (const k of dungTuan) {
      if (tuan[k] !== som.id) setSkillWeek(p, created.id, k, tuan[k]!, { force: true, khiTao: true });
    }
    for (const k of bo) setSkillSkip(p, created.id, k, true, i.lyDoBo ?? undefined, { khiTao: true });
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
  const { cls, prog } = docLopThuong(classId);
  const progress = classProgress(classId);
  const bo = boMonThuong(prog);
  /* K4-16, PF6: cột theo MỐC của chương trình — Pre FOU chỉ Cuối khoá. */
  const kinds = prog.checkpoints.map((c) => c.kind).filter((k): k is 'progress' | 'final' => k === 'progress' || k === 'final');

  const students = conn
    .prepare(
      `SELECT s.id, s.full_name, s.student_code
         FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND ${HV_DANG_HOC_SQL('s')}
        ORDER BY s.full_name`,
    )
    .all(classId) as any[];
  const attempts = conn
    .prepare(
      `SELECT a.* FROM assessment_attempts a
         JOIN enrollments e ON e.student_id = a.student_id AND e.status = 'active' AND e.class_id = a.class_id
         JOIN students s ON s.id = a.student_id AND ${HV_DANG_HOC_SQL('s')}
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
      if (!(bo as readonly string[]).includes(r.skill)) continue;
      const sc = scores.find((s: any) => s.skill === r.skill);
      const daDoi = !!sc?.no_show_period_id && sc.no_show_period_id !== r.planned_period_id;
      kn[r.skill as KyNangKH] = oKyNangCua('thuong', r, scores, daDoi, daDoi ? tuanDau.get(sc.no_show_period_id as number) ?? null : null);
    }
    return { attemptId: a.id, kn };
  };

  const theoEm = new Map<string, any>();
  for (const a of attempts) { const key = `${a.student_id}:${a.kind}`; if (!theoEm.has(key)) theoEm.set(key, a); }
  const hang = students.map((s) => {
    const dot = {} as Partial<Record<'progress' | 'final', DotThuong>>;
    for (const kind of kinds) {
      const a = theoEm.get(`${s.id}:${kind}`);
      dot[kind] = a ? dotCua(a) : { attemptId: null, kn: {} };
    }
    return { studentId: s.id as number, ten: s.full_name as string, ma: s.student_code as string, dot };
  });

  const nhanKhoa = (n: number | null) => (n && progress.totalWeeks ? tuanKhoaCua(n, progress.totalWeeks) : null);
  const hvChuaCoLich = students.filter((s) => kinds.every((k) => !theoEm.has(`${s.id}:${k}`))).length;
  const cw = progress.currentWeek;
  return {
    classId, classCode: cls.code as string, chuongTrinh: progress.programmeCode as string | null,
    khaiGiang: progress.startWeekStart, tongTuan: progress.totalWeeks,
    tuanHienTai: cw && progress.totalWeeks ? (cw > progress.totalWeeks ? 'sau khoá' : cw >= 1 ? tuanKhoaCua(cw, progress.totalWeeks) : null) : null,
    hvChuaCoLich,
    cot: kinds.map((kind) => (kind === 'progress'
      ? { kind, nhan: KIND_NHAN.progress, deXuat: progress.progressWeekStart, nhanDeXuat: nhanKhoa(progress.progressWeek) }
      : { kind, nhan: KIND_NHAN.final, deXuat: progress.finalWeekStart, nhanDeXuat: nhanKhoa(progress.finalWeek) })),
    /** Bộ môn của chương trình (Pre FOU `tong_hop`) — hộp kỹ năng lặp đúng bộ này. */
    boMon: bo,
    hang,
  };
}

/** Xếp MỚI một bài Giữa/Cuối khoá cho MỘT em: tạo bằng `planRegularTests` rồi đặt tuần từng kỹ năng — hỏng thì cuộn lại cả. */
export function xepMoiThuong(p: Principal, i: {
  classId: number; studentId: number; kind: 'progress' | 'final'; tuan: Partial<Record<KyNangKH, number>>; force?: boolean;
}) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: i.classId }, PLAN_MSG);
  const { prog } = docLopThuong(i.classId);
  if (i.kind !== 'progress' && i.kind !== 'final') throw badRequest('Cần chọn Giữa khoá hoặc Cuối khoá.');
  const bo = boMonThuong(prog);
  const dangHoc = conn
    .prepare(`SELECT 1 FROM enrollments WHERE class_id = ? AND student_id = ? AND status = 'active'`)
    .get(i.classId, i.studentId);
  if (!dangHoc) throw badRequest('Học viên không thuộc lớp này.');
  const tuan = tuanDayDu(i.tuan, [], bo, cauThieuMon(bo)) as Record<KyNangKH, number>;
  const periods = docTuan(bo.map((k) => tuan[k]));

  return tx(() => {
    const cycle = cycleThuong(i.studentId);
    if (cycle && conn.prepare('SELECT 1 FROM assessment_attempts WHERE cycle_id = ? AND kind = ?').get(cycle.id, i.kind)) {
      throw badRequest('Học viên đã có bài này rồi. Đổi tuần thay vì xếp mới.');
    }
    if (cycle) {
      const nextNo = ((conn.prepare('SELECT MAX(attempt_no) m FROM assessment_attempts WHERE cycle_id = ?').get(cycle.id) as any)?.m ?? 0) + 1;
      const kiem = kiemTuanMoi(cycle.id, nextNo, bo.map((k) => periods.get(tuan[k]).week_start));
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
    luuDot(p, { attemptId: moi.id, kyNang: bo.map((k) => ({ skill: k, periodId: tuan[k] })), force: true, khiTao: true });
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

type KindThuong = 'progress' | 'final';

/** Lớp thường: phân loại MỘT em cho xem trước — KHÔNG ghi gì. Trả kèm `attemptId` (nếu đã có bài) để lưu. */
function xetMotEmThuong(i: {
  studentId: number; ten: string; kind: KindThuong; tuan: Partial<Record<KyNangKH, number>>; periods: Map<number, any>;
  /** Bộ phải đủ khi tạo bài mới = bộ môn chương trình. */
  bo: readonly KyNangKH[];
}): { dong: DongHangLoat; attemptId: number | null } {
  const conn = db();
  const nhanDot = KIND_NHAN[i.kind];
  const co = i.bo.filter((k) => i.tuan[k]);
  const loi = (cau: string, bai: BaiXemTruoc[] = []) => ({
    dong: { studentId: i.studentId, ten: i.ten, hanhDong: 'loi' as const, bai, loi: cau }, attemptId: null as number | null,
  });

  const cycle = cycleThuong(i.studentId);
  const existing = cycle
    ? conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND kind = ?`).get(cycle.id, i.kind) as any
    : null;

  if (!existing) {
    /* Em chưa có bài: bài mới luôn tạo đủ dòng lịch (Q2) nên cần đủ bộ môn. */
    if (co.length < i.bo.length) return loi(`Em chưa có ${nhanDot} — ${cauThieuMon(i.bo).replace(/^C/, 'c')}`);
    const attemptNo = cycle ? ((conn.prepare('SELECT MAX(attempt_no) m FROM assessment_attempts WHERE cycle_id = ?').get(cycle.id) as any)?.m ?? 0) + 1 : 1;
    const kiem = kiemTuanMoi(cycle?.id ?? null, attemptNo, co.map((k) => i.periods.get(i.tuan[k]!).week_start));
    const bai = baiMoi(co, i.tuan, i.periods, kiem);
    if (kiem.blockers.length) return loi(kiem.blockers.join(' '), bai);
    return { dong: { studentId: i.studentId, ten: i.ten, hanhDong: 'tao', bai, loi: null }, attemptId: null };
  }

  const { bai } = kiemDotNoi(existing, co.map((k) => ({ skill: k, periodId: i.tuan[k]! })), new Set(), { periods: i.periods });
  const chan = bai.filter((b) => b.ghiChu === 'chan');
  if (chan.length) return { dong: { studentId: i.studentId, ten: i.ten, hanhDong: 'loi', bai, loi: [...new Set(chan.map((b) => b.cau))].join(' ') }, attemptId: existing.id };
  const doi = bai.some((b) => b.ghiChu !== 'giu');
  return { dong: { studentId: i.studentId, ten: i.ten, hanhDong: doi ? 'doi' : 'giu', bai, loi: null }, attemptId: existing.id };
}

/** Bài của một đợt SẮP TẠO: chặn / cảnh báo theo tuần (T15 đã tính sẵn ở `kiem`). */
function baiMoi(co: readonly KyNangKH[], tuan: Partial<Record<KyNangKH, number>>, periods: Map<number, any>,
  kiem: ReturnType<typeof kiemTuanMoi>): BaiXemTruoc[] {
  return co.map((k) => {
    const w = periods.get(tuan[k]!).week_start as string;
    const c = kiem.theoTuan.get(w)!;
    return c.blockers.length ? { skill: k, tu: null, den: w, ghiChu: 'chan', cau: c.blockers.join(' ') }
      : c.warnings.length ? { skill: k, tu: null, den: w, ghiChu: 'canh-bao', cau: c.warnings.join(' ') }
        : { skill: k, tu: null, den: w, ghiChu: 'moi', cau: null };
  });
}

/** Dữ liệu FT của cả danh sách em, đọc MỘT LẦN (không mỗi em một lượt câu): lộ trình hiện tại, lượt, lịch kỹ năng, điểm, đề nghị chờ. */
function docFtTheoLo(studentIds: number[]) {
  const conn = db();
  const cycleCua = new Map<number, any>();
  for (const c of conn
    .prepare(`SELECT * FROM learning_cycles WHERE student_id IN (${phOf(studentIds.length)}) ORDER BY (status = 'active') DESC, seq DESC`)
    .all(...studentIds) as any[]) if (!cycleCua.has(c.student_id)) cycleCua.set(c.student_id, c);   // cùng cách chọn với `currentCycle`
  const cycleIds = [...cycleCua.values()].map((c) => c.id as number);
  const luot = cycleIds.length
    ? conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id IN (${phOf(cycleIds.length)}) ORDER BY attempt_no`).all(...cycleIds) as any[]
    : [];
  const ids = luot.map((a) => a.id as number);
  const rows = loadSkillRows(ids);
  const diem = new Map<number, any[]>();
  if (ids.length) {
    for (const s of conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id IN (${phOf(ids.length)})`).all(...ids) as any[]) {
      diem.set(s.attempt_id, [...(diem.get(s.attempt_id) ?? []), s]);
    }
  }
  return { cycleCua, luot, rows, diem, choDuyet: pendingMovesFor(ids) };
}

const coDiemO = (scores: any[], skill: string) => scores.some((s) => (entrySkillsOf(skill as any) as string[]).includes(s.skill)
  && ((s.band ?? null) !== null || (s.raw_score ?? null) !== null));

/**
 * Khung FT (K4-17 · T37 · M9): máy chọn VIỆC ĐÚNG cho một em qua `viecXepMt` — tạo MT kế tiếp · dời · xếp nốt · thi lại · chặn.
 * KHÔNG ghi gì. `ep` = Quản lý bấm chip riêng cho em; `thiLai` = kỹ năng Quản lý đồng ý cho thi lại (đợt đã đủ).
 */
function xetMotEmFT(i: {
  studentId: number; ten: string; chon: number; ep: boolean; thiLai?: KyNangKH[];
  tuan: Partial<Record<KyNangKH, number>>; periods: Map<number, any>; ngayVaoWeb: string; homNay: string;
  lo: ReturnType<typeof docFtTheoLo>;
}): { dong: DongHangLoat; attemptId: number | null } {
  const dong = (x: Partial<DongHangLoat>): DongHangLoat => ({ studentId: i.studentId, ten: i.ten, hanhDong: 'loi', bai: [], loi: null, ...x });
  const cycle = i.lo.cycleCua.get(i.studentId);
  if (!cycle) return { dong: dong({ loi: 'Học viên chưa có lộ trình đang chạy.' }), attemptId: null };
  const cuaEm = i.lo.luot.filter((a) => a.cycle_id === cycle.id);
  const rowsCua = (a: any) => (i.lo.rows.get(a.id) ?? []) as any[];
  const diemCua = (a: any) => i.lo.diem.get(a.id) ?? [];
  const so: LuotSo[] = cuaEm.map((a) => ({
    attempt_no: a.attempt_no, status: a.status, coDiem: diemCua(a).some((s) => (s.band ?? null) !== null || (s.raw_score ?? null) !== null),
    daThi: rowsCua(a).some((r) => r.sit_status === 'sat'),
  }));
  const ds: LuotXep[] = cuaEm.filter((a) => a.kind === 'mock').map((a) => ({
    no: a.attempt_no, huy: a.status === 'cancelled', lichSu: !!a.lich_su,
    kn: rowsCua(a).filter((r) => (KY_NANG_KE_HOACH as readonly string[]).includes(r.skill)).map((r) => ({
      skill: r.skill as KyNangKH, batBuoc: r.required === 1, coDiem: coDiemO(diemCua(a), r.skill), daThi: r.sit_status === 'sat',
      huyPhan: r.sit_status === 'cancelled', choDuyet: i.lo.choDuyet.has(`${a.id}:${r.skill}`),
    })),
  }));
  const viec = viecXepMt(ds, i.chon, so, i.ep);
  const attemptNo = viec.no;
  if (viec.loai === 'chan') return { dong: dong({ loi: viec.cau, viec: 'chan', attemptNo }), attemptId: null };

  const co = KY_NANG_KE_HOACH.filter((k) => i.tuan[k]);
  if (viec.loai === 'tao') {
    if (co.length < KY_NANG_KE_HOACH.length) return { dong: dong({ loi: `Em chưa có MT${attemptNo} — cần chọn tuần cho cả 4 kỹ năng.`, viec: 'tao', attemptNo }), attemptId: null };
    /* K2-33, Q8: tuần đã qua chỉ để TẠO MT lịch sử — mọi kỹ năng đã qua và em vào web sau các tuần đó. */
    const qua = kiemTuanDaQua({ ketThuc: co.map((k) => i.periods.get(i.tuan[k]!).week_end), ngayVaoWeb: i.ngayVaoWeb, homNay: i.homNay, taoMoi: true });
    if (qua.cau) return { dong: dong({ loi: qua.cau, viec: 'tao', attemptNo }), attemptId: null };
    const kiem = kiemTuanMoi(cycle.id, attemptNo, co.map((k) => i.periods.get(i.tuan[k]!).week_start));
    const bai = baiMoi(co, i.tuan, i.periods, kiem);
    if (kiem.blockers.length) return { dong: dong({ loi: kiem.blockers.join(' '), bai, viec: 'tao', attemptNo }), attemptId: null };
    return { dong: dong({ hanhDong: 'tao', bai, viec: 'tao', attemptNo, lichSu: qua.lichSu }), attemptId: null };
  }

  const a = cuaEm.find((x) => x.attempt_no === attemptNo && x.status !== 'cancelled')!;
  if (viec.loai === 'da-du') {
    const thi = (i.thiLai ?? []).filter((k) => viec.coDiem.includes(k));
    if (!thi.length) return { dong: dong({ hanhDong: 'giu', viec: 'da-du', attemptNo, coDiem: viec.coDiem }), attemptId: a.id };
    const thieu = thi.filter((k) => !i.tuan[k]);
    if (thieu.length) return { dong: dong({ loi: 'Chọn tuần cho kỹ năng thi lại.', viec: 'thi-lai', attemptNo, coDiem: viec.coDiem }), attemptId: a.id };
    const bai: BaiXemTruoc[] = thi.map((k) => {
      const pr = i.periods.get(i.tuan[k]!);
      const tu = rowsCua(a).find((r) => r.skill === k)?.week_start ?? null;
      return laLichSu(pr.week_end, i.homNay)
        ? { skill: k, tu, den: pr.week_start, ghiChu: 'chan', cau: 'Không dời vào tuần đã qua — chọn tuần từ tuần này trở đi.' }
        : { skill: k, tu, den: pr.week_start, ghiChu: 'doi', cau: 'Thi lại — điểm cũ giữ trong Lịch sử.' };
    });
    const chan = bai.filter((b) => b.ghiChu === 'chan');
    if (chan.length) return { dong: dong({ loi: chan[0].cau, bai, viec: 'thi-lai', attemptNo, coDiem: viec.coDiem }), attemptId: a.id };
    return { dong: dong({ hanhDong: 'doi', bai, viec: 'thi-lai', attemptNo, canLyDo: true, coDiem: viec.coDiem }), attemptId: a.id };
  }

  /* `doi` → mọi kỹ năng đã chọn tuần; `xep-not` → CHỈ kỹ năng còn thiếu. */
  const ks = viec.loai === 'xep-not' ? viec.kyNang.filter((k) => i.tuan[k]) : co;
  if (!ks.length) return { dong: dong({ loi: 'Chưa chọn tuần cho kỹ năng còn thiếu.', viec: viec.loai, attemptNo }), attemptId: a.id };
  const kiem = kiemDotNoi(a, ks.map((k) => ({ skill: k, periodId: i.tuan[k]! })), new Set(),
    { rows: rowsCua(a), scores: diemCua(a), periods: i.periods, homNay: i.homNay });
  const chan = kiem.bai.filter((b) => b.ghiChu === 'chan');
  const chung = { bai: kiem.bai, viec: viec.loai, attemptNo, canLyDo: kiem.canLyDo };
  if (chan.length) return { dong: dong({ ...chung, loi: [...new Set(chan.map((b) => b.cau))].join(' ') }), attemptId: a.id };
  return { dong: dong({ ...chung, hanhDong: kiem.bai.some((b) => b.ghiChu !== 'giu') ? 'doi' : 'giu' }), attemptId: a.id };
}

export function xepHangLoat(p: Principal, i: {
  classId: number; attemptNo?: number; kind?: 'progress' | 'final'; studentIds: number[];
  tuan: Partial<Record<KyNangKH, number>>; force?: boolean; xemTruoc?: boolean;
  /** PR-XLMT (khung FT): Quản lý bấm chip đợt riêng cho em (`ep`) · kỹ năng cho thi lại · lý do (dời bài tuần đã bắt đầu, thi lại). */
  dotTheoEm?: Record<string, number>; thiLai?: Record<string, KyNangKH[]>; lyDo?: string | null;
}, today: string = demoToday()): { dong: DongHangLoat[]; daLuu: number } {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: i.classId }, PLAN_MSG);
  if ((i.attemptNo ? 1 : 0) + (i.kind ? 1 : 0) !== 1) throw badRequest('Cần chọn đúng một đợt để xếp.');
  const cls = conn
    .prepare(`SELECT pg.scoring_mode AS mode, c.programme_code AS ct FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code WHERE c.id = ?`)
    .get(i.classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const laThuong = cls.mode === 'ratio';
  if (i.attemptNo && laThuong) throw badRequest('Lớp này là lớp thường — chọn Giữa khoá hoặc Cuối khoá.');
  if (i.kind && !laThuong) throw badRequest('Lớp này là Fast Track — chọn MT.');
  if (i.kind && i.kind !== 'progress' && i.kind !== 'final') throw badRequest('Cần chọn Giữa khoá hoặc Cuối khoá.');
  if (i.attemptNo && (!Number.isInteger(i.attemptNo) || i.attemptNo < 1 || i.attemptNo > MT_TOI_DA)) throw badRequest(`Tối đa MT${MT_TOI_DA} cho một lộ trình.`);

  const tuan: Partial<Record<KyNangKH, number>> = {};
  const bo: readonly KyNangKH[] = laThuong ? boMonThuong(programmeByCode(cls.ct)) : KY_NANG_KE_HOACH;
  for (const k of bo) if (i.tuan?.[k]) tuan[k] = i.tuan[k];
  if (!Object.keys(tuan).length) throw badRequest('Chưa chọn kỹ năng nào.');
  if (!Array.isArray(i.studentIds) || !i.studentIds.length) throw badRequest('Chưa chọn học viên nào.');
  /* PR-Dọn (Q6, quét #14): bỏ trùng rồi mới đặt trần — mảng id trong thân yêu cầu tối đa 500 em; câu `IN` chia lô (Turso ≤ 900 tham số). */
  const idsGui = [...new Set(i.studentIds)];
  if (idsGui.length > 500) throw badRequest('Tối đa 500 học viên một lần xếp.');
  const periods = docTuan(Object.values(tuan) as number[]);

  /* Chỉ nhận HV đang học ĐÚNG lớp này — id ngoài lớp bị bỏ qua âm thầm, không trả tên (tránh lộ tên HV ngoài phạm vi). */
  const inClassIds = new Set<number>();
  theoLo(idsGui, (lo, ph) => {
    for (const r of conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' AND student_id IN (${ph})`)
      .all(i.classId, ...lo) as any[]) inClassIds.add(r.student_id);
  });
  const studentIds = idsGui.filter((id) => inClassIds.has(id));
  if (!studentIds.length) throw badRequest('Chưa chọn học viên nào.');
  const hv = new Map<number, { ten: string; vaoWeb: string }>(
    (conn.prepare(`SELECT id, full_name, created_at FROM students WHERE id IN (${phOf(studentIds.length)})`)
      .all(...studentIds) as any[]).map((s) => [s.id, { ten: s.full_name, vaoWeb: String(s.created_at ?? '') }]),
  );

  const lo = laThuong ? null : docFtTheoLo(studentIds);
  const xet = studentIds.map((studentId) => {
    const ten = hv.get(studentId)?.ten ?? '';
    if (laThuong) return xetMotEmThuong({ studentId, ten, kind: i.kind!, tuan, periods, bo });
    const rieng = Number(i.dotTheoEm?.[studentId]) || 0;
    return xetMotEmFT({
      studentId, ten, chon: rieng || i.attemptNo!, ep: !!rieng, thiLai: (i.thiLai?.[studentId] ?? []).map(chonKyNang),
      tuan, periods, ngayVaoWeb: hv.get(studentId)?.vaoWeb ?? '', homNay: today, lo: lo!,
    });
  });
  if (i.xemTruoc) return { dong: xet.map((x) => x.dong), daLuu: 0 };

  let daLuu = 0;
  const ketQua = xet.map(({ dong, attemptId }) => {
    if (dong.hanhDong === 'giu' || dong.hanhDong === 'loi') return dong;
    const canhBao = [...new Set(dong.bai.filter((b) => b.ghiChu === 'canh-bao').map((b) => b.cau))];
    if (canhBao.length && !i.force) return { ...dong, hanhDong: 'loi' as const, loi: `${canhBao.join(' ')} ${CAU_XAC_NHAN}` };
    /* K4-15: dời bài tuần đã bắt đầu / thi lại mà thiếu lý do → em này không lưu, các em khác vẫn lưu (R9b). */
    if (dong.canLyDo) {
      const loiLyDo = kiemLyDoThaoTac(dong.viec === 'thi-lai' ? 'Thi lại' : 'Dời lịch thi', i.lyDo);
      if (loiLyDo) return { ...dong, hanhDong: 'loi' as const, loi: loiLyDo };
    }
    const doi = dong.bai.filter((b) => b.ghiChu !== 'giu' && b.ghiChu !== 'chan');
    try {
      /* Mỗi em một `tx` riêng (bên trong các hàm dưới): lỗi của em này không huỷ các em khác (R9b, Q1). */
      if (dong.hanhDong === 'tao') {
        if (laThuong) xepMoiThuong(p, { classId: i.classId, studentId: dong.studentId, kind: i.kind!, tuan, force: true });
        else xepMoi(p, { studentId: dong.studentId, attemptNo: dong.attemptNo, tuan, force: true });
      } else if (dong.viec === 'thi-lai') {
        const theoTuan = new Map<number, KyNangKH[]>();
        for (const b of doi) theoTuan.set(tuan[b.skill]!, [...(theoTuan.get(tuan[b.skill]!) ?? []), b.skill]);
        tx(() => { for (const [periodId, skills] of theoTuan) thiLai(p, { attemptId: attemptId!, skills, periodId, lyDo: i.lyDo ?? '', force: true }); });
      } else {
        luuDot(p, {
          attemptId: attemptId!, force: true, reason: i.lyDo?.trim() || null,
          kyNang: doi.map((b) => ({ skill: b.skill, periodId: tuan[b.skill]! })),
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
    entityLabel: laThuong ? KIND_NHAN[i.kind!] : `MT${i.attemptNo}`,
    before: null, after: { daLuu, loi: ketQua.filter((d) => d.hanhDong === 'loi').map((d) => ({ studentId: d.studentId, loi: d.loi })) },
  });
  return { dong: ketQua, daLuu };
}
