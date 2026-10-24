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
  CO_DIEM_SQL, KY_NANG_KE_HOACH, MOCK_FT_DEFAULT_ATTEMPTS, khoaBai, nhanBai, nhanBaiThuong, MT_TOI_DA, kiemTuanMt0, O_KE_HOACH, dotMtMoi, PERMISSIONS, boMonLich, kiemSoMtMoi, kiemTuanXep, laLichSu, viecXepMt, laVaoMuon, luotBiVuot, soMtKeTiep, soSanhLop, tenMon, tenMonNgan, tieuDeKeHoach, tomTatLopFT, trangThaiKyNang,
  tuanKhoa as tuanKhoaCua,
  type BaiXemTruoc, type DongHangLoat, type KetQuaHuy, type KyNangKH, type LuotSo, type LuotXep, type OKyNang, ATTEMPT_KIND_SHORT,
  bangKeHoachXuat, bangThongTinXuat, bangXuatDiem, chuTep, chuanHoaMaLop, gioVn, soTenVi, tuanNam,
  type DongDiem, type HvKeHoach, type KnLich, type NoiDungXuatDiem } from '../../../shared/domain/index.ts';
import { addDays, badRequest, forbidden, normalizeName, notFound, nowIso } from '../util.ts';
import { can, classScopeSql, require_, scopeFor, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { entrySkillsOf, expectationFor } from '../fasttrack/scoring.ts';
import { createAttempt, loadBundle, oXongCua, resultOf, saveScore, scoresOf, setSkillSkip } from '../fasttrack/attempts.ts';
import { currentCycle, nextAttemptNo } from '../fasttrack/cycles.ts';
import {
  baoGvcnDoiLichThuongLop, checkWeekVsNeighbours, kiemVuot, loadSkillRows, setSitStatus, setSkillWeek, tinhLaiMtCu, tuanCuoiSauKhiDoi,
} from '../fasttrack/skillSchedule.ts';
import { mt0TheoHocVien } from '../fasttrack/mt0.ts';
import { pendingMovesFor } from '../fasttrack/absence.ts';
import { ketQuaHuyCua } from '../fasttrack/ketQuaHuy.ts';
import { effectiveSkillDeadline, mondayOf } from '../platform/week.ts';
import { writeAudit } from '../platform/audit.ts';
import { classProgress, classProgressMany, lichMtCua, suggestedMockWeeks, type SuggestedMock } from '../classes/schedule.ts';
import { planRegularTests, programmeByCode, programmeOfClass } from '../normal/regular.ts';
import { sExCuaHv } from '../cham/sExpert.ts';

const KIND_NHAN: Record<'progress' | 'final', string> = { progress: ATTEMPT_KIND_SHORT.progress, final: ATTEMPT_KIND_SHORT.final };
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
  const luotCuaLop = new Map<number, Array<{ hv: number; no: number; status: string; coTuan: boolean }>>();
  const chuaCoLichTiep = new Map<number, number>();
  if (ftClassIds.length) {
    for (const r of conn
      .prepare(
        `SELECT e.class_id AS class_id, s.id AS student_id,
                CASE WHEN cy.id IS NOT NULL AND NOT EXISTS (
                  SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status = 'planned'
                    AND a.planned_period_id IS NOT NULL) THEN 1 ELSE 0 END AS chua_co_lich   -- PR-LM: lượt đã huỷ lịch (tuần NULL) không phải "có lịch"
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
        `SELECT a.class_id, a.student_id, a.attempt_no, a.status, a.planned_period_id
           FROM assessment_attempts a
           JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
           JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
           JOIN students s ON s.id = a.student_id AND ${HV_DANG_HOC_SQL('s')}
          WHERE a.class_id IN (${phOf(ftClassIds.length)}) AND a.status != 'cancelled'`,
      )
      .all(...ftClassIds) as any[]) {
      if (!luotCuaLop.has(r.class_id)) luotCuaLop.set(r.class_id, []);
      luotCuaLop.get(r.class_id)!.push({ hv: r.student_id, no: r.attempt_no, status: r.status, coTuan: r.planned_period_id != null });
    }
  }
  /* K4-11, Q7 (PR-XLMT): em cần Quản lý xếp lại — kỹ năng vắng CHƯA có đề nghị chờ + phần thi đã huỷ, lượt còn chạy, không lịch sử. */
  const canXepLai = new Map([...emCanXepLai(ftClassIds)].map(([lop, em]) => [lop, em.size]));
  const tomTatFT = (classId: number): string => {
    const luot = luotCuaLop.get(classId) ?? [];
    const hv = hvCuaLop.get(classId) ?? [];
    /* PR-LM: lượt `planned` đã huỷ lịch (chưa có tuần) không "đang thi" — em đó tính vào "chưa xếp". */
    const dangThi = luot.filter((l) => l.status === 'planned' && l.coTuan).map((l) => l.no);
    const a = dangThi.length ? Math.min(...dangThi) : null;
    const b = a !== null ? a + 1 : (luot.length ? Math.max(...luot.map((l) => l.no)) : 0) + 1;
    const coB = new Set(luot.filter((l) => l.no === b && (l.status !== 'planned' || l.coTuan)).map((l) => l.hv));
    const soEm = hv.filter((id) => !coB.has(id)).length;
    /* V5 C20 (T04): sau MT3 không tự gợi ý MT kế — "MT{b} chưa xếp k em" chỉ khi QL đã tạo lượt số b cho lớp (có em có lượt b). */
    const goiY = b <= MOCK_FT_DEFAULT_ATTEMPTS || luot.some((l) => l.no === b);
    return tomTatLopFT({ dangThi: a, chuaXep: goiY ? { dot: b, soEm } : null, canXepLai: canXepLai.get(classId) ?? 0 });
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
               WHERE a.student_id = s.id AND a.class_id = e.class_id AND a.kind IN ('progress', 'final', 'checkpoint') AND a.status != 'cancelled')
          GROUP BY e.class_id`,
      )
      .all(...thuongIds) as any[]) hvChuaCoLich.set(r.class_id, r.n);
  }
  /** Lớp thường: `đang W8/8` (chương trình đi riêng ở `chuongTrinh`, hiện cạnh chi nhánh). */
  const tomTatThuong = (classId: number): string => {
    const pr = progressAll.get(classId);
    if (pr?.mocLap && pr.currentWeek) return pr.currentWeek < 1 ? 'chưa khai giảng' : `đang tuần ${pr.currentWeek}`;   // OV-6b2: lớp liên tục
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

/**
 * Một kỹ năng đã có ĐỦ điểm chưa: FT cần mọi ô nhập XONG (Writing = W1 + W2; LUAT-NX-MT: có band, thiếu nhận xét chỉ nhắc — `oXongCua` của lượt `a`, cùng hàm
 * với `skillCells`); lớp thường có `raw_score`. Không dự thi tính là xong.
 */
function xongKyNang(cheDo: CheDo, skill: string, scores: any[], periodId: number | null, a: any): boolean {
  if (cheDo === 'thuong') {
    return scores.some((s) => s.skill === skill && s.raw_score !== null && s.raw_score !== undefined) || khongDuThiCua(cheDo, skill, scores, periodId);
  }
  return entrySkillsOf(skill as any).every(oXongCua(a, scores).xong) || khongDuThiCua(cheDo, skill, scores, periodId);
}

/**
 * PR-MTb sau rà (I2): MT cũ ghi "-" (`assessment_scores.no_show_cu`) ở MỌI ô nhập của kỹ năng, chưa có điểm = không dự thi → xong / không yêu cầu.
 * OV-11a (Q1): lớp thường cùng luật `regularSkillViews` — "-" Không dự thi ở CHÍNH tuần đang xếp của môn (`periodId`), chưa có điểm.
 */
function khongDuThiCua(cheDo: CheDo, skill: string, scores: any[], periodId: number | null): boolean {
  if (cheDo === 'thuong') {
    return scores.some((r) => r.skill === skill && r.no_show_cu === 1 && r.no_show_period_id === periodId && (r.raw_score ?? null) === null);
  }
  return entrySkillsOf(skill as any).every((k) => scores.some((r) => r.skill === k && r.no_show_cu === 1
    && (r.band ?? null) === null && (r.raw_score ?? null) === null));
}

/** Lý do dòng chỉ đọc: `đã huỷ phần thi` › `đã có điểm` (có điểm ở BẤT KỲ ô nhập nào, như `setSkillWeek`) › `đã thi`. */
function khoaCua(cheDo: CheDo, row: any, scores: any[]): OKyNang['khoa'] {
  if (row.sit_status === 'cancelled') return 'đã huỷ';
  const ten = cheDo === 'thuong' ? [row.skill] : entrySkillsOf(row.skill);
  const coDiem = scores.some((s) => (ten as string[]).includes(s.skill)
    && ((s.band !== null && s.band !== undefined) || (s.raw_score !== null && s.raw_score !== undefined)));
  if (coDiem) return 'đã có điểm';
  if (row.sit_status === 'sat') return 'đã làm bài';
  return null;
}

/** Điểm đã có của một kỹ năng để vẽ ở hộp một đợt: FT các band (W1 / W2) một số lẻ; lớp thường `raw/tổng` (thiếu tổng → chỉ raw). */
function diemChu(cheDo: CheDo, row: any, scores: any[]): string | undefined {
  if (cheDo === 'thuong') {
    const s = scores.find((x) => x.skill === row.skill && x.raw_score !== null && x.raw_score !== undefined);
    return s ? `${s.raw_score}${s.raw_total != null ? `/${s.raw_total}` : ''}` : undefined;
  }
  const ds = (entrySkillsOf(row.skill) as string[]).map((k) => scores.find((x) => x.skill === k)?.band).filter((b) => b !== null && b !== undefined);
  return ds.length ? ds.map((b) => Number(b).toFixed(1)).join(' / ') : undefined;
}

/**
 * `them` (PR-XLMT, K4-11 — chỉ lưới FT truyền): chờ duyệt dời, lượt lịch sử, ngày nghiệp vụ → chip vắng · chờ duyệt · trễ · đã huỷ.
 * Trễ = tuần thi đã hết (Chủ nhật < hôm nay), chưa đủ điểm, không vắng/huỷ, lượt không lịch sử.
 * `hanCham` (PR-MTb, T6 — chỉ khi có `them`, tức lưới FT): hạn chấm hiệu lực (`effectiveSkillDeadline`: hạn riêng kỹ năng › hạn cả
 * đợt `attemptOverride` › thứ Tư tuần kế tuần thi); không bắt buộc / MT cũ / đã huỷ phần thi / chưa có tuần → null.
 * OV-11e (TE-12): lớp thường truyền `chiTre` — chỉ thêm chip trễ như FT (không vắng / chờ duyệt / hạn chấm).
 */
function oKyNangCua(cheDo: CheDo, a: any, row: any, scores: any[], daDoi: boolean, doiTu: string | null,
  them?: { choDuyet: boolean; lichSu: boolean; homNay: string; attemptOverride?: string | null; mt0?: boolean; chiTre?: boolean }): OKyNang {
  const batBuoc = row.required === 1;
  const xong = xongKyNang(cheDo, row.skill, scores, row.planned_period_id ?? null, a);
  const choDuyet = !!them?.choDuyet;
  const tre = !!them && !xong && !them.lichSu && !!row.week_end && row.sit_status !== 'absent' && row.sit_status !== 'cancelled'
    && String(row.week_end).slice(0, 10) < them.homNay;
  const co = them?.chiTre ? { tre } : them ? {
    choDuyet,
    vang: row.sit_status === 'absent' && !choDuyet,
    huy: row.sit_status === 'cancelled',
    tre,
  } : {};
  const diem = diemChu(cheDo, row, scores);
  return {
    trangThai: trangThaiKyNang({ batBuoc, tuan: row.week_start ?? null, xong, daDoi, ...co }),
    tuan: row.week_start ?? null, periodId: row.planned_period_id ?? null, doiTu: daDoi ? doiTu : null, batBuoc,
    khoa: khoaCua(cheDo, row, scores),
    sit: row.sit_status ?? null, tuanKetThuc: row.week_end ?? null, choDuyet,
    ...(row.huy_vang ? { huyVang: true } : {}),
    ...(khongDuThiCua(cheDo, row.skill, scores, row.planned_period_id ?? null) ? { khongDuThi: true } : {}),
    ...(diem ? { diem } : {}),
    hanCham: them && !them.chiTre && batBuoc && !them.lichSu && row.sit_status !== 'cancelled'
      ? effectiveSkillDeadline({ mode: 'band', weekStart: row.week_start ?? null, skillOverride: row.deadline_override ?? null, attemptOverride: them.attemptOverride ?? null, mt0: them.mt0 }).date
      : null,
  };
}

// ---------------------------------------------------------------- lưới Fast Track

/** `do` (PR-XLMT): có kỹ năng xong và còn kỹ năng phải thi · `huyPhan`: có phần thi đã huỷ. */
export type DotFT = {
  attemptId: number | null; trangThaiDot: string | null; kn: Partial<Record<KyNangKH, OKyNang>>; lichSu?: boolean;
  do?: boolean; huyPhan?: boolean;
  /** PR-OV4a: số MT này chỉ có lượt ĐÃ HUỶ (id) — ô "MT2 · Đã huỷ", bấm mở hộp Khôi phục. `attemptId` vẫn null (ô chưa có đợt). */
  huy?: number;
  /** UI-CHAM-TEST: đợt xong — Overall + kỳ vọng của lượt (null: lượt không có kỳ vọng). */
  ovr?: number; kyVong?: number | null;
};

export function luoiFT(p: Principal, classId: number, today: string = demoToday()) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId }, PLAN_MSG);
  const cls = conn.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');

  const students = conn
    .prepare(
      `SELECT s.id, s.full_name, s.student_code, s.status, e.started_at,
              (SELECT cy.id FROM learning_cycles cy WHERE cy.student_id = s.id AND cy.status = 'active' ORDER BY cy.id DESC LIMIT 1) AS cycle_id
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
          `SELECT a.*, cy.route AS route, cy.khong_cam_ket AS cy_kck   -- V5 SV-SO1 / UI-CHAM-TEST: kỳ vọng + Overall (\`resultOf\`) không hỏi lộ trình lẻ từng lượt
             FROM assessment_attempts a
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

  /* Lượt huỷ: tính "MT kế tiếp" (số huỷ còn điểm giữ số — T36) và ô "Đã huỷ" khi số đó không có lượt đang chạy (PR-OV4a). */
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
      kn[r.skill as KyNangKH] = oKyNangCua('ft', a, r, scores, daDoi, daDoi ? dichuyenGanNhat.get(`${a.id}:${r.skill}`) ?? null : null,
        { choDuyet: choDuyet.has(`${a.id}:${r.skill}`), lichSu: !!a.lich_su, homNay: today, attemptOverride: a.deadline_override ?? null });
    }
    return kn;
  };

  const soKeTiepCua = new Map<number, number>(students.map((s) => [s.id as number, soMtKeTiep((tatCaCua.get(s.id) ?? []).map((a) => ({
    attempt_no: a.attempt_no, status: a.status,
    coDiem: (bundle.scores.get(a.id) ?? []).some((x: any) => (x.band ?? null) !== null || (x.raw_score ?? null) !== null),
  })))]));
  /* T37 → UI-CHAM-TEST (C20, T04): cột 1 … min(MT8, max(số lớn nhất còn hiệu lực, lịch mặc định của lộ trình lớp)) — MT kế tiếp không mở cột
     (không cột MT4 trống "chưa xếp"); Quản lý thêm MT4+ tay qua "Xếp nhiều MT…", có lượt thì cột hiện. */
  const soCot = Math.min(MT_TOI_DA, Math.max(
    lichMtCua(cls, cls.route).length,
    ...attempts.filter((a) => a.status !== 'cancelled').map((a) => a.attempt_no as number),
  ));
  const cot = Array.from({ length: soCot }, (_, i) => i + 1);

  const hang = students.map((s) => {
    const dot: Record<number, DotFT> = {};
    const mine = attemptsByStudent.get(s.id) ?? [];
    for (const n of cot) {
      const a = mine.find((x) => x.attempt_no === n);
      if (!a) {
        const huy = (tatCaCua.get(s.id) ?? []).find((x) => x.attempt_no === n && x.status === 'cancelled');
        dot[n] = { attemptId: null, trangThaiDot: null, kn: {}, ...(huy ? { huy: huy.id as number } : {}) };
        continue;
      }
      const kn = knCua(a);
      const batBuoc = Object.values(kn).filter((o) => o && o.trangThai !== 'khong-yeu-cau') as OKyNang[];
      const xongCa = batBuoc.length > 0 && batBuoc.every((o) => o.trangThai === 'xong');
      /* UI-CHAM-TEST (dieu-chinh-cuoi khu a): ô xong ghi Overall + kỳ vọng của lượt — cùng `resultOf` mọi màn, điểm đã nạp sẵn. */
      const kq = xongCa ? resultOf(a, bundle.scores.get(a.id) ?? [], bundle.skips.get(a.id) ?? [], skillRows.get(a.id) ?? []) : null;
      dot[n] = {
        attemptId: a.id, trangThaiDot: a.status === 'done' || xongCa ? 'xong' : a.status, kn, lichSu: !!a.lich_su,
        ...(kq && kq.overall !== null ? { ovr: kq.overall, kyVong: kq.expectation ?? null } : {}),
        do: batBuoc.some((o) => o.trangThai === 'xong') && batBuoc.some((o) => o.trangThai !== 'xong' && o.trangThai !== 'da-huy'),
        huyPhan: batBuoc.some((o) => o.sit === 'cancelled'),
      };
    }
    /* LUAT-NX-MT (`10` mục 7.3): giữa các MT không chặn thứ tự — kỹ năng làm bài cùng / sau tuần đầu của MT sau mang `sauMt` (ô ghi "W sau MT3"). */
    const conHieuLuc = (o: OKyNang | undefined): o is OKyNang & { tuan: string } => !!o?.batBuoc && !!o.tuan && o.sit !== 'cancelled';
    const ds = cot.filter((n) => dot[n].attemptId).map((n) => ({
      attemptId: dot[n].attemptId!, attemptNo: n, kind: 'mock', coDiem: false, daThi: false, huy: false,
      tuanDau: Object.values(dot[n].kn).filter(conHieuLuc).map((o) => o.tuan.slice(0, 10)).sort()[0] ?? null,
    }));
    for (const n of cot) {
      for (const o of Object.values(dot[n].kn)) {
        if (!conHieuLuc(o)) continue;
        const m = luotBiVuot(ds, { attemptNo: n, tuanCuoiMoi: o.tuan }).biVuot[0];
        if (m) o.sauMt = m.attemptNo;
      }
    }
    return {
      studentId: s.id as number, ten: s.full_name as string, ma: s.student_code as string,
      /* PR-XTHV: lộ trình đang chạy — tab "Xếp theo học viên" đọc `/cycles/:id/suggested-mocks` (lịch gợi ý, kỳ vọng). */
      cycleId: (s.cycle_id ?? null) as number | null,
      vaoMuon: laVaoMuon(s.started_at ?? null, cls.start_date ?? null), dot,
      /* K4-08: chỉ ô MT kế tiếp có "+ xếp" (Q11) — tính trên cả lộ trình của em (Q12). */
      soKeTiep: soKeTiepCua.get(s.id)!,
    };
  });

  /* OV-15c (C21): ghi chú lịch thi — một câu cho cả lớp. */
  const gc = docGhiChu(classId, students.map((s) => ({ id: s.id as number, cycleId: (s.cycle_id ?? null) as number | null })), true);
  const sEx = sExCuaHv(p, studentIds, today);   // SV-S-EXPERT: lượt S Ex của em, tách khỏi ô MT
  return { classId, classCode: cls.code as string, cot, hang: hang.map((h) => ({ ...h, ghiChu: gc.theoEm.get(h.studentId) ?? {}, sEx: sEx.get(h.studentId) ?? [] })), ghiChuLop: gc.lop };
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
  /** T2 (PR-MTa): kết quả đã huỷ do dời vượt, chưa khôi phục — Quản lý thấy nút Khôi phục (PR-MTb). */
  ketQuaHuy: KetQuaHuy | null;
};
/** Một hàng: đề xuất của lịch mặc định (nếu lượt nằm trong lịch mặc định) + lượt thật (nếu đã có). */
export type HangLichMt = Omit<SuggestedMock, 'studyWeek' | 'periodId' | 'weekStart' | 'code'> & {
  studyWeek: number | null; periodId: number | null; weekStart: string | null; code: string | null;
  luot: LuotLichMt | null;
  /** PR-OV4a: số MT này chỉ có lượt ĐÃ HUỶ — hàng "MT2 · Đã huỷ", Quản lý bấm Khôi phục. */
  huy: { attemptId: number } | null;
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
  /* PR-MT0 (mockup ⑦): MT0 đã nối vào lộ trình FT là hàng đầu (số 0) — khoá với Áp lịch gợi ý / Huỷ lịch hàng loạt; số MT kế tiếp chỉ đếm Mock. */
  const tatCa = conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND kind IN ('mock', 'mt0') ORDER BY attempt_no`).all(cycleId) as any[];
  const con = tatCa.filter((a) => a.status !== 'cancelled');
  const ids = con.map((a) => a.id as number);
  const rows = loadSkillRows(ids);
  const bundle = loadBundle(ids);
  const choDuyet = pendingMovesFor(ids);
  const daHuy = ketQuaHuyCua(ids);

  const luotCua = (a: any): LuotLichMt => {
    const scores = bundle.scores.get(a.id) ?? [];
    const ds = ((rows.get(a.id) ?? []) as any[]).filter((r) => (KY_NANG_KE_HOACH as readonly string[]).includes(r.skill));
    const kn: Partial<Record<KyNangKH, OKyNang>> = {};
    const kyNang = ds.map((r) => {
      const daDoi = (r.absence_move_count ?? 0) > 0;
      const o = oKyNangCua('ft', a, r, scores, daDoi, null, { choDuyet: choDuyet.has(`${a.id}:${r.skill}`), lichSu: !!a.lich_su, homNay: today, attemptOverride: a.deadline_override ?? null, mt0: a.kind === 'mt0' });
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
      kyVong: a.kind === 'mt0' ? null : expectationFor(a.target_at_attempt ?? null, a.attempt_no, cy.route ?? null),
      ketQuaHuy: daHuy.get(a.id) ?? null,
    };
  };

  /* PR-OV4a: số MT chỉ có lượt đã huỷ → hàng "Đã huỷ" (`huy`; `luot` vẫn null — Áp lịch / Xếp theo học viên không coi là lượt có sẵn). */
  const huyCua = (n: number) => tatCa.find((x) => x.attempt_no === n && x.status === 'cancelled' && x.kind === 'mock') ?? null;
  const so = [...new Set([...goiY.map((g) => g.attemptNo), ...tatCa.filter((a) => a.status !== 'cancelled' || a.kind === 'mock').map((a) => a.attempt_no as number)])]
    .sort((x, y) => x - y);
  const hang: HangLichMt[] = so.map((n) => {
    const g = goiY.find((x) => x.attemptNo === n);
    const a = con.find((x) => x.attempt_no === n) ?? null;
    const huy = a ? null : huyCua(n);
    return {
      attemptNo: n, studyWeek: g?.studyWeek ?? null, periodId: g?.periodId ?? null, weekStart: g?.weekStart ?? null, code: g?.code ?? null,
      existingAttemptId: a?.id ?? null, existingPeriodId: a?.planned_period_id ?? null, existingSource: (a?.plan_source ?? null) as any,
      locked: n === 0 || (g?.locked ?? (!!a && a.status === 'done')),
      luot: a ? luotCua(a) : null,
      huy: huy ? { attemptId: huy.id as number } : null,
    };
  });
  const soKeTiep = soMtKeTiep(tatCa.filter((a) => a.kind === 'mock').map((a) => ({
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
 * `pre` (PR-XLMT): dữ liệu đã đọc theo lô (hàng loạt nhiều em) — không đọc lại. `canLyDo` luôn false (G17, T7 — giữ trường cho web cũ).
 * Tuần đích đã qua không chặn: mọi nơi gọi đều đã đòi PLAN_WEEK (T4 — Quản lý xếp được tuần đã qua).
 * Dời vượt lượt sau: LUAT-NX-MT không chặn giữa các MT (chỉ MT0 trước MT1). Kỹ năng đã huỷ phần thi được chọn tuần = "đưa lại" + đặt tuần (luật 5).
 * `pre.choHuyLich` (chỉ hộp một đợt): đổi tuần được kể cả kỹ năng đã có điểm / đã thi — điểm đi theo (D3 MT cũ, PR-MTa T20 mọi lượt).
 */
function kiemDotNoi(a: any, kyNang: YeuCauKyNang[], duaLai: Set<KyNangKH> = new Set(),
  pre: {
    rows?: any[]; scores?: any[]; periods?: Map<number, any>; homNay?: string; choHuyLich?: boolean; theoLo?: boolean;
    /** PR-MT0: tuần muộn nhất của MT0 cùng lộ trình (đường theo lô — `theoLo`) — MT1 phải sau tuần này. */
    tuanMt0?: string | null;
  } = {},
): { bai: BaiXemTruoc[]; canLyDo: boolean } {
  const conn = db();
  const cheDo: CheDo = a.kind === 'mock' ? 'ft' : 'thuong';
  const rows = pre.rows ?? (loadSkillRows([a.id]).get(a.id) ?? []) as any[];
  const scores = pre.scores ?? loadBundle([a.id]).scores.get(a.id) ?? [];
  const periods = new Map<number, any>();
  for (const id of new Set(kyNang.map((k) => k.periodId))) {
    const pr = pre.periods?.get(id) ?? conn.prepare('SELECT * FROM report_periods WHERE id = ?').get(id) as any;
    if (!pr) throw notFound('Không tìm thấy tuần');
    periods.set(id, pr);
  }
  const bai: BaiXemTruoc[] = [];
  /* Vòng 1: bài giữ nguyên / bị khoá. Bài còn lại là bài DỜI — kiểm vượt và lượt lân cận ở vòng 2 (cần đủ bộ tuần mới). */
  const doi: Array<{ i: number; k: YeuCauKyNang; row: any; pr: any }> = [];
  const canLyDo = false;   // G17 (PR-MTa T7): dời lịch không còn đòi lý do — giữ trường cho web cũ, PR-MTb bỏ
  for (const k of kyNang) {
    const row = rows.find((r) => r.skill === k.skill);
    const tu = row?.week_start ?? null;
    const pr = periods.get(k.periodId);
    if (!row || (!row.required && !duaLai.has(k.skill))) {
      bai.push({ skill: k.skill, tu, den: tu, ghiChu: 'giu', cau: 'Đợt này không có kỹ năng này.' });
      continue;
    }
    const khoa = khoaCua(cheDo, row, scores);
    if (khoa && khoa !== 'đã huỷ' && !pre.choHuyLich) { bai.push({ skill: k.skill, tu, den: tu, ghiChu: 'giu', cau: khoa }); continue; }
    if (row.planned_period_id === k.periodId && row.sit_status !== 'cancelled' && row.required) { bai.push({ skill: k.skill, tu, den: tu, ghiChu: 'giu', cau: null }); continue; }
    doi.push({ i: bai.length, k, row, pr });
    bai.push({ skill: k.skill, tu, den: pr.week_start, ghiChu: 'doi', cau: null });
  }

  const tuanCuoi = doi.length ? tuanCuoiSauKhiDoi(rows, new Map(doi.map((d) => [d.k.skill, d.pr.week_start])))! : '';
  const tuanDau = doi.map((d) => String(d.pr.week_start)).sort()[0] ?? '';
  /* PR-MT0: đường theo lô kiểm "MT1 sau MT0" trên dữ liệu đã đọc; đường lẻ để `kiemVuot` tự đọc. */
  const chanMt0 = doi.length && pre.theoLo && a.kind === 'mock' && a.attempt_no === 1 && pre.tuanMt0
    ? kiemTuanMt0({ tuanMoi: pre.tuanMt0, tuanMuonNhat: null, tuanMt1: tuanDau }) : null;
  const vuot = !doi.length ? { chan: null }
    : chanMt0 ? { chan: chanMt0 }
    : pre.theoLo ? { chan: null } : kiemVuot(a.id, tuanCuoi, tuanDau);
  const checks = new Map<string, { blockers: string[]; warnings: string[] }>();
  for (const d of doi) {
    const b = bai[d.i];
    if (vuot.chan) { b.ghiChu = 'chan'; b.cau = vuot.chan; continue; }
    let c = checks.get(d.pr.week_start);
    if (!c) {
      c = checkWeekVsNeighbours({ cycleId: a.cycle_id, attemptNo: a.attempt_no, excludeAttemptId: a.id, newWeekStart: d.pr.week_start, kind: a.kind });
      checks.set(d.pr.week_start, c);
    }
    if (c.blockers.length) { b.ghiChu = 'chan'; b.cau = c.blockers.join(' '); }
    else if (c.warnings.length) { b.ghiChu = 'canh-bao'; b.cau = c.warnings.join(' '); }
  }
  return { bai, canLyDo };
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
  /** T11: xếp hàng loạt lớp thường báo GVCN một chuông cả lớp, không từng em. */
  khongBaoGvcn?: boolean;
}): { ok: true; doi: KyNangKH[] } {
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

  const rows = (loadSkillRows([i.attemptId]).get(i.attemptId) ?? []) as any[];
  return tx(() => {
    for (const k of i.kyNang) {            // bo=true: đang bắt buộc → bỏ; bo=false: đang bỏ → đưa lại
      const r = rows.find((x) => x.skill === k.skill);
      if (k.bo !== undefined && r && !!r.required === k.bo) setSkillSkip(p, i.attemptId, k.skill, k.bo, i.lyDoBo ?? undefined);
    }
    const doi = kiem.bai.filter((b) => b.ghiChu === 'doi' || b.ghiChu === 'canh-bao');
    for (const b of doi) {
      const periodId = datTuan.find((k) => k.skill === b.skill)!.periodId;
      /* PR-MTGON (luật 5): kỹ năng đã huỷ phần thi / đã bỏ khỏi đợt (vòng `bo` ở trên đã đưa lại) → đưa lại rồi đặt tuần (đè). */
      const r0 = rows.find((r) => r.skill === b.skill);
      if (r0?.sit_status === 'cancelled' || !r0?.required) {
        if (r0?.sit_status === 'cancelled') setSkillSkip(p, i.attemptId, b.skill, false);
        if (loadSkillRows([i.attemptId]).get(i.attemptId)!.find((r: any) => r.skill === b.skill)?.planned_period_id === periodId) continue;
      }
      setSkillWeek(p, i.attemptId, b.skill, periodId, { reason: i.reason ?? null, force: true, khiTao: i.khiTao, khongBaoGvcn: i.khongBaoGvcn });
    }
    return { ok: true as const, doi: doi.map((b) => b.skill) };
  });
}

const CAU_THI_LAI_TUAN_QUA = 'Thi lại: chọn tuần từ tuần này trở đi.';

/**
 * THI LẠI (T37 "ép vào đợt trùng", §5.5, Q13 — chủ sản phẩm chốt 29/09 câu 1 = A): Quản lý cho em thi lại kỹ năng ĐÃ CÓ ĐIỂM ở
 * chính đợt đó — xoá ô (RB-5 ghi lý do, lịch sử điểm giữ giá trị cũ) → "chờ thi" → tuần mới. Mọi ô của kỹ năng (W1 + W2). Một `tx`.
 */
export function thiLai(p: Principal, i: { attemptId: number; skills: string[]; periodId: number; lyDo?: string | null; force?: boolean }) {
  const a = docDot(i.attemptId);
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: a.class_id }, PLAN_MSG);
  if (a.kind !== 'mock' || a.lich_su || a.status === 'cancelled') throw badRequest('Chỉ thi lại được ở lượt Mock đang chạy.');
  if (!i.skills?.length) throw badRequest('Chưa chọn kỹ năng thi lại.');
  /* T4 (PR-MTa): Quản lý xếp được tuần đã qua — trừ thi lại: thi lại là một buổi thi thật, cần tuần từ tuần này trở đi. */
  const pr = db().prepare('SELECT week_end FROM report_periods WHERE id = ?').get(i.periodId) as any;
  if (pr && laLichSu(pr.week_end, demoToday())) throw badRequest(CAU_THI_LAI_TUAN_QUA);
  const lyDo = i.lyDo?.trim() ? `Thi lại: ${i.lyDo.trim()}` : 'Thi lại';   // T7: lý do tuỳ chọn
  /* Rà #126: thi lại chỉ cho kỹ năng ĐÃ CÓ ĐIỂM — vắng / đã huỷ đi luồng Xếp lại bài vắng / Khôi phục, không qua đây. */
  const diem = scoresOf(i.attemptId);
  for (const k of i.skills.map(chonKyNang)) {
    if (!entrySkillsOf(k as any).some((e) => diem.some((x) => x.skill === e && (x.band != null || x.raw_score != null)))) {
      throw badRequest(`${tenMon(null, k)} chưa có điểm — không thi lại. Em vắng thì dùng "Xếp lại bài vắng"; kỹ năng đã huỷ thì "Khôi phục và đặt tuần".`);
    }
  }
  return tx(() => {
    for (const k of i.skills.map(chonKyNang)) {
      for (const e of entrySkillsOf(k as any)) {
        const s = scoresOf(i.attemptId).find((x) => x.skill === e);
        if (s && (s.band != null || s.raw_score != null)) {
          saveScore(p, i.attemptId, e, { rawScore: null, criteria: [null, null, null, null], lyDo }, undefined, { thiLai: true });
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
export function huyDiem(p: Principal, i: { attemptId: number; skill: string; o?: string[]; lyDo?: string | null }) {
  const tatCa = entrySkillsOf(chonKyNang(i.skill) as any) as string[];
  const o = i.o?.length ? i.o : tatCa;
  if (o.some((e) => !tatCa.includes(e))) throw badRequest('Ô không thuộc kỹ năng này.');
  const diem = scoresOf(i.attemptId);
  const coDiem = o.filter((e) => diem.some((x) => x.skill === e && (x.band != null || x.raw_score != null)));
  if (!coDiem.length) throw badRequest(`${tenMon(null, i.skill)} chưa có điểm để huỷ.`);
  return tx(() => {
    for (const e of coDiem) saveScore(p, i.attemptId, e, { rawScore: null, criteria: [null, null, null, null], lyDo: i.lyDo?.trim() || null });
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
function kiemTuanMoi(cycleId: number | null, attemptNo: number, weeks: string[], kind?: string): { blockers: string[]; warnings: string[]; theoTuan: Map<string, { blockers: string[]; warnings: string[] }> } {
  const blockers = new Set<string>();
  const warnings = new Set<string>();
  const theoTuan = new Map<string, { blockers: string[]; warnings: string[] }>();
  for (const w of new Set(weeks)) {
    const c = cycleId === null ? { blockers: [], warnings: [] }
      : checkWeekVsNeighbours({ cycleId, attemptNo, excludeAttemptId: null, newWeekStart: w, kind });
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
  if (!dungTuan.length) throw badRequest('Cần ít nhất một kỹ năng trong đợt.');
  const periods = docTuan(dungTuan.map((k) => tuan[k]!));
  /* T1/T4 (PR-MTa): Quản lý xếp được tuần đã qua (kể cả trộn qua / tới), không chặn theo ngày em vào web. Cờ MT cũ tính sau khi đặt
   * đủ tuần, theo tuần MUỘN NHẤT (`tinhLaiMtCu`). `require_` PLAN_WEEK ở trên nên `kiemTuanXep` không bao giờ chặn ở đây. */

  return tx(() => {
    const kiem = kiemTuanMoi(cycle.id, attemptNo, dungTuan.map((k) => periods.get(tuan[k]!).week_start), 'mock');   // LUAT-NX-MT: MT ↔ MT không chặn thứ tự
    if (kiem.blockers.length) throw badRequest(kiem.blockers.join(' '));
    if (kiem.warnings.length && !i.force) throw badRequest(`${kiem.warnings.join(' ')} ${CAU_XAC_NHAN}`);

    const som = dungTuan.map((k) => periods.get(tuan[k]!)).sort((x, y) => x.week_start.localeCompare(y.week_start))[0];
    const created = createAttempt(p, { studentId: i.studentId, cycleId: cycle.id, attemptNo, periodId: som.id }) as any;
    conn.prepare(`UPDATE assessment_attempts SET plan_source = 'manual' WHERE id = ?`).run(created.id);
    for (const k of dungTuan) {
      if (tuan[k] !== som.id) setSkillWeek(p, created.id, k, tuan[k]!, { force: true, khiTao: true });
    }
    for (const k of bo) setSkillSkip(p, created.id, k, true, i.lyDoBo ?? undefined, { khiTao: true });
    tinhLaiMtCu(created.id, demoToday());
    return conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(created.id);
  });
}

// ---------------------------------------------------------------- lớp thường: lưới theo học viên × kỹ năng

export type DotThuong = { attemptId: number | null; kn: Partial<Record<KyNangKH, OKyNang>> };
/** Khoá cột của một bài lớp thường: `progress` / `final`; OV-6b2: Checkpoint n → `cp{n}`. */
const cotCua = (a: { kind: string; attempt_no: number }) => (a.kind === 'checkpoint' ? `cp${a.attempt_no}` : a.kind);

function docLopThuong(classId: number) {
  const cls = db().prepare('SELECT * FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const prog = programmeOfClass(classId);
  if (!prog || prog.scoringMode !== 'ratio') throw badRequest('Lớp này là Fast Track.');
  return { cls, prog };
}

export function luoiThuong(p: Principal, classId: number, today: string = demoToday()) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId }, PLAN_MSG);
  const { cls, prog } = docLopThuong(classId);
  const progress = classProgress(classId);
  const bo = boMonThuong(prog);
  /* K4-16, PF6: cột theo MỐC của chương trình — Pre FOU chỉ Cuối khoá. */
  const kinds: string[] = prog.checkpoints.map((c) => c.kind).filter((k) => k === 'progress' || k === 'final');

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
        WHERE a.class_id = ? AND a.kind IN ('progress', 'final', 'checkpoint') AND a.status != 'cancelled'
        ORDER BY a.attempt_no DESC`,
    )
    .all(classId) as any[];
  /* PR-MT0 (mockup ④): MT0 của em đang học lớp — ô MT số 0 cạnh Final. Không đổi đếm "chưa có lịch" (chỉ Giữa/Cuối khoá). */
  const mt0s = conn.prepare(
    `SELECT a.* FROM assessment_attempts a
       JOIN enrollments e ON e.student_id = a.student_id AND e.status = 'active' AND e.class_id = a.class_id
      WHERE a.class_id = ? AND a.kind = 'mt0' AND a.status != 'cancelled'`,
  ).all(classId) as any[];
  const attemptIds = [...attempts, ...mt0s].map((a) => a.id);
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
      kn[r.skill as KyNangKH] = oKyNangCua('thuong', a, r, scores, daDoi, daDoi ? tuanDau.get(sc.no_show_period_id as number) ?? null : null,
        { choDuyet: false, lichSu: false, homNay: today, chiTre: true });
    }
    return { attemptId: a.id, kn };
  };

  const theoEm = new Map<string, any>();
  for (const a of attempts) { const key = `${a.student_id}:${cotCua(a)}`; if (!theoEm.has(key)) theoEm.set(key, a); }
  /* OV-6b2: lớp liên tục — mỗi Checkpoint đã có của lớp một cột (số chung cả lớp, tuần học n × mỗi-n-tuần); không Progress / Final. */
  const soCp = progress.mocLap ? [...new Set(attempts.filter((a) => a.kind === 'checkpoint').map((a) => a.attempt_no as number))].sort((x, y) => x - y) : [];
  if (progress.mocLap) kinds.splice(0, kinds.length, ...soCp.map((n) => `cp${n}`));
  const homNay = demoToday();
  const ttMt0 = mt0TheoHocVien(mt0s.map((a) => a.student_id as number));
  const mt0Cua = new Map(mt0s.map((a) => {
    const scores = bundle.scores.get(a.id) ?? [];
    const kn: Partial<Record<KyNangKH, OKyNang>> = {};
    for (const r of (skillRows.get(a.id) ?? []) as any[]) {
      kn[r.skill as KyNangKH] = oKyNangCua('ft', a, r, scores, false, null, { choDuyet: false, lichSu: false, homNay, attemptOverride: a.deadline_override ?? null, mt0: true });
    }
    return [a.student_id as number, { attemptId: a.id as number, kn, khongDung: ttMt0.get(a.student_id)?.trangThai === 'khong_dung' }];
  }));
  const hang = students.map((s) => {
    const dot: Record<string, DotThuong> = {};
    for (const kind of kinds) {
      const a = theoEm.get(`${s.id}:${kind}`);
      dot[kind] = a ? dotCua(a) : { attemptId: null, kn: {} };
    }
    return { studentId: s.id as number, ten: s.full_name as string, ma: s.student_code as string, dot, mt0: mt0Cua.get(s.id) ?? null };
  });

  const gc = docGhiChu(classId, students.map((s) => ({ id: s.id as number, cycleId: null })), false);   // OV-15c (C21)
  const sExTheoEm = sExCuaHv(p, students.map((s) => s.id as number), today);
  const nhanKhoa = (n: number | null) => (n && progress.totalWeeks ? tuanKhoaCua(n, progress.totalWeeks) : null);
  const hvChuaCoLich = students.filter((s) => kinds.every((k) => !theoEm.has(`${s.id}:${k}`))).length;
  const cw = progress.currentWeek;
  const tuanCp = (n: number) => (progress.startWeekStart && progress.mocLap ? addDays(progress.startWeekStart, 7 * (n * progress.mocLap - 1)) : null);
  return {
    classId, classCode: cls.code as string, chuongTrinh: progress.programmeCode as string | null,
    khaiGiang: progress.startWeekStart, tongTuan: progress.totalWeeks,
    tuanHienTai: progress.mocLap ? (cw && cw >= 1 ? `tuần ${cw}` : null)
      : cw && progress.totalWeeks ? (cw > progress.totalWeeks ? 'sau khoá' : cw >= 1 ? tuanKhoaCua(cw, progress.totalWeeks) : null) : null,
    hvChuaCoLich,
    cot: progress.mocLap
      ? soCp.map((n) => ({ kind: `cp${n}`, nhan: nhanBai(khoaBai('checkpoint', n)), deXuat: tuanCp(n), nhanDeXuat: `tuần ${n * progress.mocLap!}` }))
      : kinds.map((kind) => (kind === 'progress'
        ? { kind, nhan: KIND_NHAN.progress, deXuat: progress.progressWeekStart, nhanDeXuat: nhanKhoa(progress.progressWeek) }
        : { kind, nhan: KIND_NHAN.final, deXuat: progress.finalWeekStart, nhanDeXuat: nhanKhoa(progress.finalWeek) })),
    /** Bộ môn của chương trình (Pre FOU `tong_hop`) — hộp kỹ năng lặp đúng bộ này. */
    boMon: bo,
    /** SV-S-EXPERT: `sEx` = lượt S Expert của em (tách khỏi ô MT). */
    hang: hang.map((h) => ({ ...h, ghiChu: gc.theoEm.get(h.studentId) ?? {}, sEx: sExTheoEm.get(h.studentId) ?? [] })),
    /** OV-15c (C21): ghi chú lớp dưới bảng. */
    ghiChuLop: gc.lop,
  };
}

/** Xếp MỚI một bài Giữa/Cuối khoá cho MỘT em: tạo bằng `planRegularTests` rồi đặt tuần từng kỹ năng — hỏng thì cuộn lại cả. */
export function xepMoiThuong(p: Principal, i: {
  classId: number; studentId: number; kind: string; tuan: Partial<Record<KyNangKH, number>>; force?: boolean;
}) {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: i.classId }, PLAN_MSG);
  const { prog } = docLopThuong(i.classId);
  if (/^cp\d+$/.test(i.kind)) throw badRequest('Checkpoint tự xếp theo lịch lớp — bấm ô Checkpoint đã có để dời tuần.');
  if (i.kind !== 'progress' && i.kind !== 'final') throw badRequest('Cần chọn Progress Test hoặc Final Test.');
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
      const kiem = kiemTuanMoi(cycle.id, nextNo, bo.map((k) => periods.get(tuan[k]).week_start), i.kind);
      if (kiem.blockers.length) throw badRequest(kiem.blockers.join(' '));
      if (kiem.warnings.length && !i.force) throw badRequest(`${kiem.warnings.join(' ')} ${CAU_XAC_NHAN}`);
    }
    const ket = planRegularTests(p, i.classId, { studentIds: [i.studentId], kinds: [i.kind as 'progress' | 'final'] });
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

/** `progress` | `final`; OV-6b2: `cp{n}` = Checkpoint n (chỉ dời lượt đã có — Checkpoint tự sinh từng lượt). */
type KindThuong = string;

/** Lớp thường: phân loại MỘT em cho xem trước — KHÔNG ghi gì. Trả kèm `attemptId` (nếu đã có bài) để lưu. */
function xetMotEmThuong(i: {
  studentId: number; ten: string; kind: KindThuong; tuan: Partial<Record<KyNangKH, number>>; periods: Map<number, any>;
  /** Bộ phải đủ khi tạo bài mới = bộ môn chương trình. */
  bo: readonly KyNangKH[];
}): { dong: DongHangLoat; attemptId: number | null } {
  const conn = db();
  const nhanDot = /^cp\d+$/.test(i.kind) ? nhanBai(khoaBai('checkpoint', Number(i.kind.slice(2)))) : KIND_NHAN[i.kind as 'progress' | 'final'];
  const co = i.bo.filter((k) => i.tuan[k]);
  const loi = (cau: string, bai: BaiXemTruoc[] = []) => ({
    dong: { studentId: i.studentId, ten: i.ten, hanhDong: 'loi' as const, bai, loi: cau }, attemptId: null as number | null,
  });

  const cycle = cycleThuong(i.studentId);
  const cp = /^cp(\d+)$/.exec(i.kind);
  const existing = !cycle ? null : cp
    ? conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND kind = 'checkpoint' AND attempt_no = ? AND status != 'cancelled'`).get(cycle.id, Number(cp[1])) as any
    : conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id = ? AND kind = ?`).get(cycle.id, i.kind) as any;

  if (!existing && cp) return loi(`Em chưa có ${nhanDot} — Checkpoint tự xếp theo lịch lớp.`);
  if (!existing) {
    /* Em chưa có bài: bài mới luôn tạo đủ dòng lịch (Q2) nên cần đủ bộ môn. */
    if (co.length < i.bo.length) return loi(`Em chưa có ${nhanDot} — ${cauThieuMon(i.bo).replace(/^C/, 'c')}`);
    const attemptNo = cycle ? ((conn.prepare('SELECT MAX(attempt_no) m FROM assessment_attempts WHERE cycle_id = ?').get(cycle.id) as any)?.m ?? 0) + 1 : 1;
    const kiem = kiemTuanMoi(cycle?.id ?? null, attemptNo, co.map((k) => i.periods.get(i.tuan[k]!).week_start), i.kind);
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
export function docFtTheoLo(studentIds: number[]) {
  const conn = db();
  /* PR-DON: mọi `IN (…)` chia lô ≤ 900 tham số (Turso) — 500 em × nhiều lượt vượt trần. Lô theo em / lộ trình nên thứ tự trong từng em giữ nguyên. */
  const cycleCua = new Map<number, any>();
  theoLo(studentIds, (lo, ph) => {
    for (const c of conn
      .prepare(`SELECT * FROM learning_cycles WHERE student_id IN (${ph}) ORDER BY (status = 'active') DESC, seq DESC`)
      .all(...lo) as any[]) if (!cycleCua.has(c.student_id)) cycleCua.set(c.student_id, c);   // cùng cách chọn với `currentCycle`
  });
  const cycleIds = [...cycleCua.values()].map((c) => c.id as number);
  const luot: any[] = [];
  theoLo(cycleIds, (lo, ph) => { luot.push(...conn.prepare(`SELECT * FROM assessment_attempts WHERE cycle_id IN (${ph}) ORDER BY attempt_no`).all(...lo) as any[]); });
  const ids = luot.map((a) => a.id as number);
  const rows = loadSkillRows(ids);
  const diem = new Map<number, any[]>();
  theoLo(ids, (lo, ph) => {
    for (const s of conn.prepare(`SELECT * FROM assessment_scores WHERE attempt_id IN (${ph})`).all(...lo) as any[]) {
      diem.set(s.attempt_id, [...(diem.get(s.attempt_id) ?? []), s]);
    }
  });
  return { cycleCua, luot, rows, diem, choDuyet: pendingMovesFor(ids) };
}

const coDiemO = (scores: any[], skill: string) => scores.some((s) => (entrySkillsOf(skill as any) as string[]).includes(s.skill)
  && ((s.band ?? null) !== null || (s.raw_score ?? null) !== null));

/**
 * Khung FT (K4-17 · T37 · M9): máy chọn VIỆC ĐÚNG cho một em qua `viecXepMt` — tạo MT kế tiếp · dời · xếp nốt · thi lại · chặn.
 * KHÔNG ghi gì. `ep` = Quản lý bấm chip riêng cho em; `thiLai` = kỹ năng Quản lý đồng ý cho thi lại (đợt đã đủ).
 * T13b (PR-MTb): đúng đợt `chon` — không tự sang đợt khác; `'moi'` = mỗi em một "MT mới" (`dotMtMoi`). `kyChon` = kỹ năng được tick
 * (mặc định cả 4): `i.tuan` đã chỉ còn kỹ năng đó; đợt tạo mới chỉ cần đủ tuần cho kỹ năng được tick.
 */
function xetMotEmFT(i: {
  studentId: number; ten: string; chon: number | 'moi'; ep: boolean; thiLai?: KyNangKH[];
  tuan: Partial<Record<KyNangKH, number>>; periods: Map<number, any>; homNay: string;
  lo: ReturnType<typeof docFtTheoLo>; kyChon?: readonly KyNangKH[];
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
      coTuan: r.planned_period_id != null,
    })),
  }));
  const viec = viecXepMt(ds, i.chon === 'moi' ? dotMtMoi(ds, so) : i.chon, so, i.ep);
  const attemptNo = viec.no;
  if (viec.loai === 'chan') return { dong: dong({ loi: viec.cau, viec: 'chan', attemptNo }), attemptId: null };

  const co = KY_NANG_KE_HOACH.filter((k) => i.tuan[k]);
  if (viec.loai === 'tao') {
    const kyChon = i.kyChon ?? KY_NANG_KE_HOACH;
    if (kyChon.some((k) => !i.tuan[k])) {
      const cho = kyChon.length === KY_NANG_KE_HOACH.length ? 'cả 4 kỹ năng' : 'kỹ năng đã chọn';
      return { dong: dong({ loi: `Em chưa có MT${attemptNo} — cần chọn tuần cho ${cho}.`, viec: 'tao', attemptNo }), attemptId: null };
    }
    /* T1/T4 (PR-MTa): Quản lý xếp được tuần đã qua — `mtCu` báo trước lượt sẽ là MT cũ (tuần muộn nhất cách ≥ 2 tuần). */
    const qua = kiemTuanXep({ ketThuc: co.map((k) => i.periods.get(i.tuan[k]!).week_end), homNay: i.homNay, quanLy: true });
    const kiem = kiemTuanMoi(cycle.id, attemptNo, co.map((k) => i.periods.get(i.tuan[k]!).week_start), 'mock');   // LUAT-NX-MT
    const bai = baiMoi(co, i.tuan, i.periods, kiem);
    if (kiem.blockers.length) return { dong: dong({ loi: kiem.blockers.join(' '), bai, viec: 'tao', attemptNo }), attemptId: null };
    return { dong: dong({ hanhDong: 'tao', bai, viec: 'tao', attemptNo, lichSu: qua.mtCu }), attemptId: null };
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
        ? { skill: k, tu, den: pr.week_start, ghiChu: 'chan', cau: CAU_THI_LAI_TUAN_QUA }
        : { skill: k, tu, den: pr.week_start, ghiChu: 'doi', cau: 'Thi lại — điểm cũ giữ trong Lịch sử.' };
    });
    const chan = bai.filter((b) => b.ghiChu === 'chan');
    if (chan.length) return { dong: dong({ loi: chan[0].cau, bai, viec: 'thi-lai', attemptNo, coDiem: viec.coDiem }), attemptId: a.id };
    return { dong: dong({ hanhDong: 'doi', bai, viec: 'thi-lai', attemptNo, canLyDo: false, coDiem: viec.coDiem }), attemptId: a.id };
  }

  /* `doi` → mọi kỹ năng đã chọn tuần; `xep-not` → CHỈ kỹ năng còn thiếu. */
  const ks = viec.loai === 'xep-not' ? viec.kyNang.filter((k) => i.tuan[k]) : co;
  if (!ks.length) return { dong: dong({ loi: 'Chưa chọn tuần cho kỹ năng còn thiếu.', viec: viec.loai, attemptNo }), attemptId: a.id };
  /* Rà #282: lượt không còn kỹ năng bắt buộc nào (mọi kỹ năng đã "Huỷ kỹ năng") → các kỹ năng đã chọn được đưa lại (luật 5). */
  const duaLai = new Set<KyNangKH>(rowsCua(a).some((r) => r.required && (KY_NANG_KE_HOACH as readonly string[]).includes(r.skill)) ? [] : ks);
  const kiem = kiemDotNoi(a, ks.map((k) => ({ skill: k, periodId: i.tuan[k]! })), duaLai,
    {
      rows: rowsCua(a), scores: diemCua(a), periods: i.periods, homNay: i.homNay, theoLo: true,
      tuanMt0: cuaEm.filter((x) => x.kind === 'mt0' && x.status !== 'cancelled')
        .flatMap((x) => rowsCua(x).filter((r) => r.required && r.sit_status !== 'cancelled' && r.week_start).map((r) => String(r.week_start))).sort().pop() ?? null,
    });
  const chan = kiem.bai.filter((b) => b.ghiChu === 'chan');
  const chung = { bai: kiem.bai, viec: viec.loai, attemptNo, canLyDo: kiem.canLyDo };
  if (chan.length) return { dong: dong({ ...chung, loi: [...new Set(chan.map((b) => b.cau))].join(' ') }), attemptId: a.id };
  return { dong: dong({ ...chung, hanhDong: kiem.bai.some((b) => b.ghiChu !== 'giu') ? 'doi' : 'giu' }), attemptId: a.id };
}

export function xepHangLoat(p: Principal, i: {
  /** `'moi'` (PR-MTb, T13b): mỗi em xếp "MT mới" của riêng em — chỉ Fast Track. */
  /** Lớp thường: `progress` | `final`; OV-6b2 lớp liên tục: `cp{n}` (Checkpoint n — chỉ dời lượt đã có, không tạo mới). */
  classId: number; attemptNo?: number | 'moi'; kind?: string; studentIds: number[];
  tuan: Partial<Record<KyNangKH, number>>; force?: boolean; xemTruoc?: boolean;
  /** PR-MTb (Q3, chỉ Fast Track; thiếu = cả 4): kỹ năng được tick. Đợt TẠO MỚI: kỹ năng bỏ tick bị bỏ khỏi đợt (`required = 0`); đợt đã có: không xếp kỹ năng đó. */
  kyNang?: KyNangKH[];
  /** PR-XLMT (khung FT): Quản lý bấm chip đợt riêng cho em (`ep`) · kỹ năng cho thi lại · lý do (dời bài tuần đã bắt đầu, thi lại). */
  dotTheoEm?: Record<string, number>; thiLai?: Record<string, KyNangKH[]>; lyDo?: string | null;
}, today: string = demoToday()): { dong: DongHangLoat[]; daLuu: number } {
  const conn = db();
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: i.classId }, PLAN_MSG);
  if (i.attemptNo !== undefined && i.attemptNo !== 'moi' && !Number.isInteger(i.attemptNo)) throw badRequest('Đợt không hợp lệ.');
  if ((i.attemptNo ? 1 : 0) + (i.kind ? 1 : 0) !== 1) throw badRequest('Cần chọn đúng một đợt để xếp.');
  const cls = conn
    .prepare(`SELECT pg.scoring_mode AS mode, c.programme_code AS ct FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code WHERE c.id = ?`)
    .get(i.classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const laThuong = cls.mode === 'ratio';
  if (i.attemptNo && laThuong) throw badRequest('Lớp này là lớp thường — chọn Progress Test hoặc Final Test.');
  if (i.kind && !laThuong) throw badRequest('Lớp này là Fast Track — chọn MT.');
  if (i.kind && i.kind !== 'progress' && i.kind !== 'final' && !/^cp[1-9]\d{0,4}$/.test(i.kind)) throw badRequest('Cần chọn Progress Test hoặc Final Test.');
  if (typeof i.attemptNo === 'number' && (i.attemptNo < 1 || i.attemptNo > MT_TOI_DA)) throw badRequest(`Tối đa MT${MT_TOI_DA} cho một lộ trình.`);
  if (i.kyNang !== undefined && !laThuong && (!Array.isArray(i.kyNang) || !i.kyNang.length)) throw badRequest('Chưa chọn kỹ năng nào.');

  const tuan: Partial<Record<KyNangKH, number>> = {};
  const bo: readonly KyNangKH[] = laThuong ? boMonThuong(programmeByCode(cls.ct)) : KY_NANG_KE_HOACH;
  /* Fast Track: chỉ kỹ năng được tick; thiếu `kyNang` = cả 4. Lớp thường bỏ qua `kyNang` (lớp thường xếp đủ bộ môn). */
  const kyChon: readonly KyNangKH[] = laThuong || !i.kyNang ? bo : bo.filter((k) => i.kyNang!.includes(k));
  for (const k of kyChon) if (i.tuan?.[k]) tuan[k] = i.tuan[k];
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
  const hv = new Map<number, { ten: string }>(
    (conn.prepare(`SELECT id, full_name FROM students WHERE id IN (${phOf(studentIds.length)})`)
      .all(...studentIds) as any[]).map((s) => [s.id, { ten: s.full_name }]),
  );

  const lo = laThuong ? null : docFtTheoLo(studentIds);
  const xet = studentIds.map((studentId) => {
    const ten = hv.get(studentId)?.ten ?? '';
    if (laThuong) return xetMotEmThuong({ studentId, ten, kind: i.kind!, tuan, periods, bo });
    const rieng = Number(i.dotTheoEm?.[studentId]) || 0;
    return xetMotEmFT({
      studentId, ten, chon: rieng || i.attemptNo!, ep: !!rieng, thiLai: (i.thiLai?.[studentId] ?? []).map(chonKyNang),
      tuan, periods, homNay: today, lo: lo!, kyChon,
    });
  });
  if (i.xemTruoc) return { dong: xet.map((x) => x.dong), daLuu: 0 };

  let daLuu = 0;
  let soEmDoi = 0;
  const ketQua = xet.map(({ dong, attemptId }) => {
    if (dong.hanhDong === 'giu' || dong.hanhDong === 'loi') return dong;
    const canhBao = [...new Set(dong.bai.filter((b) => b.ghiChu === 'canh-bao').map((b) => b.cau))];
    if (canhBao.length && !i.force) return { ...dong, hanhDong: 'loi' as const, loi: `${canhBao.join(' ')} ${CAU_XAC_NHAN}` };
    const doi = dong.bai.filter((b) => b.ghiChu !== 'giu' && b.ghiChu !== 'chan');
    try {
      /* Mỗi em một `tx` riêng (bên trong các hàm dưới): lỗi của em này không huỷ các em khác (R9b, Q1). */
      if (dong.hanhDong === 'tao') {
        if (laThuong) xepMoiThuong(p, { classId: i.classId, studentId: dong.studentId, kind: i.kind!, tuan, force: true });
        else xepMoi(p, { studentId: dong.studentId, attemptNo: dong.attemptNo, tuan, bo: bo.filter((k) => !kyChon.includes(k)), force: true });   // Q3: kỹ năng bỏ tick → bỏ khỏi đợt mới
      } else if (dong.viec === 'thi-lai') {
        const theoTuan = new Map<number, KyNangKH[]>();
        for (const b of doi) theoTuan.set(tuan[b.skill]!, [...(theoTuan.get(tuan[b.skill]!) ?? []), b.skill]);
        tx(() => { for (const [periodId, skills] of theoTuan) thiLai(p, { attemptId: attemptId!, skills, periodId, lyDo: i.lyDo ?? '', force: true }); });
      } else {
        luuDot(p, {
          attemptId: attemptId!, force: true, reason: i.lyDo?.trim() || null, khongBaoGvcn: laThuong,
          /* Kỹ năng đang bỏ khỏi đợt mà vẫn có bài dời (rà #282: lượt đã huỷ hết kỹ năng) → `bo: false` = đưa lại rồi đặt tuần. */
          kyNang: doi.map((b) => ({ skill: b.skill, periodId: tuan[b.skill]!,
            ...(lo?.rows.get(attemptId!)?.some((r: any) => r.skill === b.skill && !r.required) ? { bo: false } : {}) })),
        });
        if (laThuong) soEmDoi += 1;
      }
      daLuu += 1;
      return dong;
    } catch (e: any) {
      /* AN-5: `chanGiaoDichNeuSapHetGio` (db.ts) có thể từ chối một `tx` khi sắp hết giờ — lỗi đó cũng rơi vào đúng dòng
       * này, không làm hỏng cả lô. Người dùng bấm Lưu lại cho các dòng còn lỗi (R9b). */
      return { ...dong, hanhDong: 'loi' as const, loi: e?.message ?? 'Không lưu được.' };
    }
  });

  if (laThuong) baoGvcnDoiLichThuongLop(p, i.classId, i.kind!.replace(/^cp(\d+)$/, 'checkpoint:$1'), soEmDoi, today);   // T11: một chuông cả lớp (bài mới tạo không tính)
  writeAudit({
    actorUserId: p.userId, action: 'ke_hoach.hang_loat', entityType: 'class', entityId: i.classId,
    entityLabel: laThuong ? nhanBaiThuong(i.kind!.replace(/^cp(\d+)$/, 'checkpoint:$1')) : i.attemptNo === 'moi' ? 'MT mới' : `MT${i.attemptNo}`,
    before: null, after: { daLuu, loi: ketQua.filter((d) => d.hanhDong === 'loi').map((d) => ({ studentId: d.studentId, loi: d.loi })) },
  });
  return { dong: ketQua, daLuu };
}

// ---------------------------------------------------------------- OV-15c: ghi chú lịch thi (C21)

/** Một ghi chú hiện tại: chữ · ai · lúc (ISO). */
export type GhiChuLich = { noiDung: string; ai: string | null; luc: string };
const GHI_CHU_TOI_DA = 500;
const DOT_GHI_CHU = /^(mt\d{1,2}|progress|final|cp\d{1,2})$/;

/**
 * Ghi chú HIỆN TẠI của các em một lớp (dòng mới nhất của mỗi khoá, chữ trống = đã xoá) + ghi chú lớp — MỘT câu. FT khớp theo LỘ TRÌNH đang chạy
 * của em (MT đánh số theo lộ trình — Q12), lớp thường theo lớp. Khoá đợt = `mt4` / `progress` / `final` / `cp2` (như `khoaDot` phía web).
 */
function docGhiChu(classId: number, em: readonly { id: number; cycleId: number | null }[], ft: boolean): {
  theoEm: Map<number, Record<string, GhiChuLich>>; lop: GhiChuLich | null;
} {
  const theoEm = new Map<number, Record<string, GhiChuLich>>();
  let lop: GhiChuLich | null = null;
  const lt = new Map(em.map((e) => [e.id, e.cycleId]));
  const doc = (ids: number[], ph: string) => db().prepare(
    `SELECT g.student_id, g.cycle_id, g.class_id, g.dot, g.noi_dung, g.created_at, u.full_name AS ai
       FROM ghi_chu_lich_thi g LEFT JOIN users u ON u.id = g.created_by
      WHERE ${ids.length ? `g.student_id IN (${ph}) OR ` : ''}(g.class_id = ? AND g.student_id IS NULL)
      ORDER BY g.id`).all(...ids, classId) as any[];
  for (const r of doc(em.map((e) => e.id), em.map(() => '?').join(','))) {
    const g: GhiChuLich | null = r.noi_dung ? { noiDung: r.noi_dung, ai: r.ai ?? null, luc: r.created_at } : null;
    if (r.student_id === null) { lop = g; continue; }
    if (ft ? r.cycle_id !== lt.get(r.student_id) : r.class_id !== classId) continue;
    const m = theoEm.get(r.student_id) ?? {};
    if (g) m[r.dot] = g; else delete m[r.dot];
    theoEm.set(r.student_id, m);
  }
  return { theoEm, lop };
}

/** Khoá ghi chú của một em × đợt (hoặc cả lớp) sau khi kiểm quyền, lớp, em, đợt. */
function khoaGhiChu(p: Principal, i: { classId: number; studentId?: number | null; dot?: string | null }) {
  require_(p, PERMISSIONS.PLAN_WEEK, { classId: i.classId }, PLAN_MSG);
  const conn = db();
  const lop = conn.prepare(`SELECT c.id, pg.scoring_mode AS mode FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code WHERE c.id = ?`).get(i.classId) as any;
  if (!lop) throw notFound('Không tìm thấy lớp');
  if (!i.studentId) return { classId: i.classId, studentId: null, cycleId: null, dot: null };
  const dot = String(i.dot ?? '');
  const ft = lop.mode !== 'ratio';
  if (!DOT_GHI_CHU.test(dot) || ft !== dot.startsWith('mt')) throw badRequest('Đợt không hợp lệ.');
  const em = conn.prepare(
    `SELECT e.student_id, (SELECT cy.id FROM learning_cycles cy WHERE cy.student_id = e.student_id AND cy.status = 'active' ORDER BY cy.id DESC LIMIT 1) AS cycle_id
       FROM enrollments e WHERE e.class_id = ? AND e.student_id = ? AND e.status = 'active'`).get(i.classId, i.studentId) as any;
  if (!em) throw badRequest('Học viên không thuộc lớp này.');
  if (ft && !em.cycle_id) throw badRequest('Học viên chưa có lộ trình đang chạy.');
  return { classId: i.classId, studentId: i.studentId, cycleId: ft ? em.cycle_id as number : null, dot };
}

const DK_KHOA = `g.student_id IS ? AND g.dot IS ? AND (CASE WHEN g.student_id IS NULL OR g.cycle_id IS NULL THEN g.class_id = ? ELSE g.cycle_id = ? END)`;

type GhiChuVao = { classId: number; studentId?: number | null; dot?: string | null; noiDung: unknown };

/** Kiểm ghi chú (quyền, lớp, em, đợt, độ dài) — TRƯỚC khi ghi bất cứ gì. */
function kiemGhiChu(p: Principal, i: GhiChuVao) {
  const k = khoaGhiChu(p, i);
  const noiDung = String(i.noiDung ?? '').trim();
  if (noiDung.length > GHI_CHU_TOI_DA) throw badRequest(`Ghi chú tối đa ${GHI_CHU_TOI_DA} ký tự.`);
  return { ...k, noiDung };
}

/** POST /ke-hoach-test/ghi-chu — lưu ghi chú (chữ trống = xoá). Mỗi lần lưu THÊM một dòng (lịch sử). CHỈ ghi chú, không đụng lịch. */
export function luuGhiChu(p: Principal, i: GhiChuVao): { ghiChu: GhiChuLich | null } {
  return ghiGhiChu(p, kiemGhiChu(p, i));
}

/**
 * OV-15h2 (ý 5): lưu lịch (`/dot`, `/xep-moi`) KÈM ghi chú lịch thi trong MỘT giao dịch — ghi chú sai thì 400 trước khi đụng lịch, lỗi giữa chừng cuộn
 * lại cả hai; web không phải gửi lịch lần hai khi ghi chú lỗi. `ghi` null = chỉ lịch.
 */
export function luuLichKemGhiChu<T>(p: Principal, ghi: GhiChuVao | null, luuLich: () => T): T {
  if (!ghi) return luuLich();
  const k = kiemGhiChu(p, ghi);
  return tx(() => ({ ...(luuLich() as object), ...ghiGhiChu(p, k) }) as T);
}

function ghiGhiChu(p: Principal, k: ReturnType<typeof kiemGhiChu>): { ghiChu: GhiChuLich | null } {
  const noiDung = k.noiDung;
  const conn = db();
  const cu = conn.prepare(`SELECT g.noi_dung FROM ghi_chu_lich_thi g WHERE ${DK_KHOA} ORDER BY g.id DESC LIMIT 1`)
    .get(k.studentId, k.dot, k.classId, k.cycleId) as any;
  const luc = nowIso();
  if ((cu?.noi_dung ?? '') !== noiDung) {
    conn.prepare(`INSERT INTO ghi_chu_lich_thi (class_id, student_id, cycle_id, dot, noi_dung, created_by, created_at) VALUES (?,?,?,?,?,?,?)`)
      .run(k.classId, k.studentId, k.cycleId, k.dot, noiDung, p.userId, luc);
  }
  return { ghiChu: noiDung ? { noiDung, ai: p.fullName, luc } : null };
}

/** GET /ke-hoach-test/ghi-chu/lich-su — mọi lần lưu của một ghi chú, mới nhất trước. */
export function lichSuGhiChu(p: Principal, i: { classId: number; studentId?: number | null; dot?: string | null }): { dong: GhiChuLich[] } {
  const k = khoaGhiChu(p, i);
  return {
    dong: (db().prepare(
      `SELECT g.noi_dung, g.created_at, u.full_name AS ai FROM ghi_chu_lich_thi g LEFT JOIN users u ON u.id = g.created_by
        WHERE ${DK_KHOA} ORDER BY g.id DESC LIMIT 50`).all(k.studentId, k.dot, k.classId, k.cycleId) as any[])
      .map((r) => ({ noiDung: r.noi_dung, ai: r.ai ?? null, luc: r.created_at })),
  };
}

// ---------------------------------------------------------------- OV-15c: tìm lớp, học viên hoặc email (C18)

/** Lớp đang hoạt động trong phạm vi Kế hoạch Test (PLAN_WEEK), lọc chi nhánh — một câu, kèm GVCN và số em. */
function lopTrongPhamVi(p: Principal, branchId: number | null) {
  if (!can(p, PERMISSIONS.PLAN_WEEK, { anyScope: true })) throw forbidden(PLAN_MSG);
  return (db().prepare(
    `SELECT c.id, c.code, c.branch_id, pg.scoring_mode AS mode, br.name AS chi_nhanh,
            (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') AS so_hv,
            (SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
              WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id DESC LIMIT 1) AS gvcn
       FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code LEFT JOIN branches br ON br.id = c.branch_id
      WHERE c.status = 'active'${branchId ? ' AND c.branch_id = ?' : ''}`).all(...(branchId ? [branchId] : [])) as any[])
    .filter((r) => can(p, PERMISSIONS.PLAN_WEEK, { classId: r.id }))
    .sort((a, b) => soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }));
}

const TIM_TOI_DA = 8;
/** GET /ke-hoach-test/tim?q= — Lớp (mã, bỏ khoảng / gạch) và Học viên đang học (tên có / không dấu, email không phân biệt hoa thường). */
export function timKeHoach(p: Principal, i: { q: string; branchId: number | null }) {
  const lop = lopTrongPhamVi(p, i.branchId);
  const q = i.q.trim();
  if (!q) return { lop: [], hocVien: [] };
  const qMa = chuanHoaMaLop(q);
  const theoId = new Map(lop.map((l) => [l.id as number, l]));
  const loai = (l: any) => (l.mode === 'ratio' ? 'thuong' : 'ft') as 'ft' | 'thuong';
  const thoat = (s: string) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  /* shortcut: 60 em khớp đầu tiên của chi nhánh rồi mới lọc phạm vi lớp — đủ khi chọn chi nhánh (web luôn gửi); Quản trị không chọn chi nhánh mà tên quá
     phổ biến có thể thiếu em ở lớp mình xem, khi đó lọc lớp trong SQL. */
  const hv = theoId.size ? (db().prepare(
    `SELECT s.id, s.full_name, s.email, e.class_id FROM students s
       JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
       JOIN classes c ON c.id = e.class_id AND c.status = 'active'${i.branchId ? ' AND c.branch_id = ?' : ''}
      WHERE ${HV_DANG_HOC_SQL('s')} AND (s.normalized_name LIKE ? ESCAPE '\\' OR LOWER(s.email) LIKE ? ESCAPE '\\')
      ORDER BY s.normalized_name LIMIT 60`).all(...(i.branchId ? [i.branchId] : []), thoat(normalizeName(q)), thoat(q.toLowerCase())) as any[])
    .filter((r) => theoId.has(r.class_id)) : [];
  return {
    lop: lop.filter((l) => chuanHoaMaLop(l.code).includes(qMa)).slice(0, TIM_TOI_DA)
      .map((l) => ({ id: l.id as number, code: l.code as string, loai: loai(l), chiNhanh: (l.chi_nhanh ?? '') as string, soHv: l.so_hv as number, gvcn: (l.gvcn ?? null) as string | null })),
    hocVien: hv.slice(0, TIM_TOI_DA).map((r) => {
      const l = theoId.get(r.class_id)!;
      return { studentId: r.id as number, ten: r.full_name as string, email: (r.email ?? null) as string | null, classId: l.id as number, classCode: l.code as string, loai: loai(l) };
    }),
  };
}

// ---------------------------------------------------------------- OV-15c: xuất Excel Kế hoạch Test 13 cột (C17) + Xuất điểm Test

type SheetXuat = { ten: string; aoa: (string | number | null)[][] };

/** Lớp FT trong phạm vi để xuất: chi nhánh + lớp đang lọc (trống = mọi lớp FT); lớp ngoài phạm vi → 403. */
function lopFtXuat(p: Principal, branchId: number | null, classIds: readonly number[]) {
  const lop = lopTrongPhamVi(p, branchId).filter((l) => l.mode !== 'ratio');
  if (classIds.some((id) => !lop.some((l) => l.id === id))) throw forbidden('Có lớp nằm ngoài phạm vi bạn được xuất.');
  return classIds.length ? lop.filter((l) => classIds.includes(l.id)) : lop;
}
const tenChiNhanh = (lop: readonly any[]) => [...new Set(lop.map((l) => l.chi_nhanh).filter(Boolean))].join(', ') || 'Mọi chi nhánh';
const ngayTep = (iso: string) => `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}`;

/**
 * Lớp đã qua của từng lộ trình (theo số MT tăng dần) — em học 2 lớp trong kỳ ghi "A → B".
 * OV-15i2: có `p` → chỉ lớp trong phạm vi xem của người đó (tệp xuất không in mã lớp chi nhánh khác).
 */
export function lopTheoLoTrinh(cycleIds: readonly number[], p?: Principal): Map<number, string[]> {
  const out = new Map<number, string[]>();
  const pv = p ? classScopeSql(scopeFor(p, PERMISSIONS.ATTEMPT_VIEW)) : { sql: '1=1', params: [] };
  theoLo([...new Set(cycleIds)], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT a.cycle_id, c.code FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
        WHERE a.cycle_id IN (${ph}) AND a.kind = 'mock' AND a.status != 'cancelled' AND ${pv.sql} ORDER BY a.attempt_no, a.id`).all(...lo, ...pv.params) as any[]) {
      out.set(r.cycle_id, [...(out.get(r.cycle_id) ?? []), r.code]);
    }
  });
  return out;
}

/** Em cần Quản lý xếp lại theo lớp (K4-11, Q7) — một câu; số trên chip "Chỉ cần xếp lại" và tệp xuất của chip đó cùng tập (SL1 V3B-07 #4). */
function emCanXepLai(classIds: readonly number[]): Map<number, Set<number>> {
  const out = new Map<number, Set<number>>();
  theoLo([...classIds], (lo, ph) => {
    for (const r of db()
      .prepare(
        `SELECT DISTINCT a.class_id, a.student_id FROM attempt_skills k
           JOIN assessment_attempts a ON a.id = k.attempt_id AND a.status = 'planned' AND a.lich_su = 0 AND a.kind = 'mock'
           JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
          WHERE a.class_id IN (${ph}) AND k.required = 1 AND k.sit_status IN ('absent', 'cancelled')
            AND NOT EXISTS (SELECT 1 FROM skill_move_requests r WHERE r.attempt_id = a.id AND r.skill = k.skill AND r.status = 'pending')`,
      )
      .all(...lo) as any[]) (out.get(r.class_id) ?? out.set(r.class_id, new Set()).get(r.class_id)!).add(r.student_id);
  });
  return out;
}

/** POST /ke-hoach-test/xuat — tệp Kế hoạch Test 13 cột theo bộ lọc đang xem (chỉ Fast Track). `xemTruoc` không ghi nhật ký. */
export function xuatKeHoach(p: Principal, i: { branchId: number | null; classIds: number[]; xemTruoc: boolean;
  /** SL1 (V3B-07 #4): chip "Chỉ cần xếp lại" đang bật — tệp chỉ em cần xếp lại (trước: mọi em của lớp). */ chiXepLai?: boolean }, luc = nowIso()) {
  const lop = lopFtXuat(p, i.branchId, i.classIds);
  const conn = db();
  const em: any[] = [];
  theoLo(lop.map((l) => l.id as number), (lo, ph) => {
    em.push(...conn.prepare(
      `SELECT s.id, s.full_name, s.email, e.class_id,
              (SELECT cy.id FROM learning_cycles cy WHERE cy.student_id = s.id AND cy.status = 'active' ORDER BY cy.id DESC LIMIT 1) AS cycle_id
         FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id IN (${ph}) AND ${HV_DANG_HOC_SQL('s')}`).all(...lo) as any[]);
  });
  if (i.chiXepLai) {
    const can = emCanXepLai(lop.map((l) => l.id as number));
    em.splice(0, em.length, ...em.filter((e) => can.get(e.class_id)?.has(e.id)));
  }
  const maLop = new Map(lop.map((l) => [l.id as number, l.code as string]));
  /* OV-15h2 (ý 6): em học cùng lúc hai lớp FT = MỘT hàng; mọi lớp đang học vào cột Lớp (theo thứ tự lớp). */
  const lopDangHoc = new Map<number, string[]>();
  for (const e of em) lopDangHoc.set(e.id, [...(lopDangHoc.get(e.id) ?? []), maLop.get(e.class_id)!]);
  for (const ds of lopDangHoc.values()) ds.sort((a, b) => soSanhLop({ code: a }, { code: b }));
  const gap = new Set<number>();
  em.splice(0, em.length, ...em.filter((e) => !gap.has(e.id) && !!gap.add(e.id)));
  em.sort((a, b) => soSanhLop({ code: lopDangHoc.get(a.id)![0] }, { code: lopDangHoc.get(b.id)![0] }) || soTenVi(a.full_name, b.full_name) || a.id - b.id);
  const cycleIds = em.map((e) => e.cycle_id).filter((x): x is number => !!x);
  const luot: any[] = [];
  theoLo([...new Set(cycleIds)], (lo, ph) => {
    luot.push(...conn.prepare(
      `SELECT a.id, a.cycle_id, a.attempt_no, a.status, c.code FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id
        WHERE a.cycle_id IN (${ph}) AND a.kind = 'mock' ORDER BY a.attempt_no, a.id`).all(...lo) as any[]);
  });
  const skill = loadSkillRows(luot.filter((a) => a.status !== 'cancelled').map((a) => a.id));
  const hv: HvKeHoach[] = em.map((e) => {
    const cua = luot.filter((a) => a.cycle_id === e.cycle_id);
    const m = new Map<number, { huy: true } | { kn: KnLich[] }>();
    for (const a of cua) {
      if (a.status === 'cancelled') { if (!m.has(a.attempt_no)) m.set(a.attempt_no, { huy: true }); continue; }
      m.set(a.attempt_no, { kn: (skill.get(a.id) ?? []).map((r: any) => ({ skill: r.skill, tuan: r.week_start ?? null, sit: r.sit_status ?? null, batBuoc: r.required === 1 })) });
    }
    const daQua = cua.filter((a) => a.status !== 'cancelled').map((a) => a.code);
    const dang = lopDangHoc.get(e.id)!;
    return { email: e.email ?? null, ten: e.full_name, lop: [...daQua.filter((c) => !dang.includes(c)), ...dang], luot: m };
  });
  const bang = bangKeHoachXuat(hv);
  const chiNhanh = tenChiNhanh(lop);
  const boLoc = `Fast Track · ${lop.length === 1 ? lop[0].code : `${lop.length} lớp`}${i.chiXepLai ? ' · chỉ cần xếp lại' : ''} · ${hv.length} học viên`;
  const sheets: SheetXuat[] = [
    { ten: 'Kế hoạch Test', aoa: bang.aoa },
    { ten: 'Thông tin xuất', aoa: bangThongTinXuat({ chiNhanh, boLoc, luc: gioVn(luc), nguoi: p.fullName, ngoai: bang.ngoai }) },
  ];
  if (!i.xemTruoc) {
    writeAudit({ actorUserId: p.userId, action: 'ke_hoach.xuat_excel', entityType: 'xuat_ke_hoach', entityLabel: `${hv.length} học viên · ${boLoc}`, after: { branchId: i.branchId, classIds: i.classIds, chiXepLai: !!i.chiXepLai } });
  }
  return { sheets, tenTep: `Ke-hoach-Test_${chuTep(chiNhanh)}_${ngayTep(demoToday())}.xlsx`, dem: { hocVien: hv.length, lop: lop.length }, boLoc };
}

/** Bộ lọc Xuất điểm Test (mockup 6 khung 9): Theo tuần (mọi lớp) · Theo lớp (nhiều MT) · Lớp + khoảng tuần. */
export type BoLocXuatDiem = {
  branchId: number | null; classIds: number[]; noiDung: NoiDungXuatDiem; xemTruoc: boolean;
  mt: [number, number] | null; tuan: [string, string] | null;
};

/** POST /ke-hoach-test/xuat-diem — MỘT hàng MỘT lượt Mock (đã có tuần, chưa huỷ). Tuần của lượt = tuần SỚM NHẤT của kỹ năng phải thi (như Xuất kết quả Test). */
export function xuatDiemTest(p: Principal, f: BoLocXuatDiem, luc = nowIso()) {
  if (!f.mt && !f.tuan) throw badRequest('Chọn MT hoặc khoảng tuần.');
  if (f.mt && !f.classIds.length) throw badRequest('Theo MT thì chọn lớp.');
  const lop = lopFtXuat(p, f.branchId, f.classIds);
  const conn = db();
  const maLop = new Map(lop.map((l) => [l.id as number, l.code as string]));
  const ung: any[] = [];
  /* Theo tuần: lượt có kỹ năng trong khoảng (một câu không tương quan qua chỉ mục `planned_period_id`); theo MT: lượt của lớp đã chọn. */
  theoLo([...maLop.keys()], (lo, ph) => {
    ung.push(...conn.prepare(
      /* OV-15i2: chỉ cột `resultOf` + bảng cần (không `a.*`). */
      `SELECT a.id, a.kind, a.class_id, a.student_id, a.cycle_id, a.attempt_no, a.target_at_attempt, a.kck_at_attempt,
              st.full_name, st.email, cy.route, cy.khong_cam_ket AS cy_kck FROM assessment_attempts a
         JOIN students st ON st.id = a.student_id JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE a.class_id IN (${ph}) AND a.kind = 'mock' AND a.status != 'cancelled'
          ${f.mt ? 'AND a.attempt_no BETWEEN ? AND ?' : ''}
          ${f.tuan ? `AND a.id IN (SELECT ask.attempt_id FROM attempt_skills ask JOIN report_periods r ON r.id = ask.planned_period_id
                                    WHERE ask.required = 1 AND r.week_start BETWEEN ? AND ?)` : ''}`).all(...lo, ...(f.mt ?? []), ...(f.tuan ?? [])) as any[]);
  });
  const bundle = loadBundle(ung.map((a) => a.id));
  const tuanDau = (a: any) => (bundle.skillRows.get(a.id) ?? []).filter((r: any) => r.required && r.week_start).map((r: any) => String(r.week_start).slice(0, 10)).sort()[0] ?? null;
  const chon = ung.map((a) => ({ a, tuan: tuanDau(a) })).filter((x) => x.tuan && (!f.tuan || (x.tuan >= f.tuan[0] && x.tuan <= f.tuan[1])));
  const chuoi = lopTheoLoTrinh(chon.map((x) => x.a.cycle_id), p);
  chon.sort((x, y) => soSanhLop({ code: maLop.get(x.a.class_id)! }, { code: maLop.get(y.a.class_id)! }) || soTenVi(x.a.full_name, y.a.full_name)
    || x.a.student_id - y.a.student_id || x.a.attempt_no - y.a.attempt_no);
  const dong: DongDiem[] = chon.map(({ a, tuan }) => {
    const sc = bundle.scores.get(a.id) ?? [];
    const r = resultOf(a, sc, bundle.skips.get(a.id) ?? [], bundle.skillRows.get(a.id) ?? []);
    const o = (k: string) => sc.find((s: any) => s.skill === k);
    return {
      ten: a.full_name, email: a.email ?? null, lop: chuoi.get(a.cycle_id) ?? [maLop.get(a.class_id)!], mt: a.attempt_no, tuan,
      l: r.bands.listening, r: r.bands.reading, w1: o('writing1')?.band ?? null, w2: o('writing2')?.band ?? null, w: r.bands.writing, s: r.bands.speaking,
      ovr: r.overall, kyVong: r.expectation, danhGiaDuoc: r.evaluable,
      nhanXet: Object.fromEntries(['listening', 'reading', 'writing1', 'writing2', 'speaking'].map((k) => [k, o(k)?.comment ?? null])),
    };
  });
  const chiNhanh = tenChiNhanh(lop);
  const phamVi = `${f.classIds.length ? (lop.length === 1 ? lop[0].code : `${lop.length} lớp`) : 'Mọi lớp'}`
    + `${f.mt ? ` · MT${f.mt[0]}${f.mt[1] !== f.mt[0] ? `–MT${f.mt[1]}` : ''}` : ''}`
    + `${f.tuan ? ` · ${tuanNam(f.tuan[0])}${f.tuan[1] !== f.tuan[0] ? ` → ${tuanNam(f.tuan[1])}` : ''}` : ''}`;
  const boLoc = `${phamVi} · ${f.noiDung === 'chi-diem' ? 'Chỉ điểm' : 'Điểm + nhận xét'} · ${dong.length} lượt`;
  if (!f.xemTruoc) {
    writeAudit({ actorUserId: p.userId, action: 'ke_hoach.xuat_diem', entityType: 'xuat_ke_hoach', entityLabel: boLoc, after: { ...f, xemTruoc: undefined } });
  }
  const tenLop = f.classIds.length ? lop.map((l) => chuTep(l.code, '')).join('-') : chuTep(chiNhanh);
  const doan = f.mt ? `MT${f.mt[0]}-MT${f.mt[1]}` : `${chuTep(tuanNam(f.tuan![0]), '')}-${chuTep(tuanNam(f.tuan![1]), '')}`;
  return {
    sheets: [
      { ten: 'Điểm Test', aoa: bangXuatDiem(dong, f.noiDung) },
      { ten: 'Thông tin xuất', aoa: bangThongTinXuat({ chiNhanh, boLoc, luc: gioVn(luc), nguoi: p.fullName }) },
    ] as SheetXuat[],
    tenTep: `PISA_DiemTest_${tenLop}_${doan}_${demoToday()}.xlsx`,
    dem: { luot: dong.length, hocVien: new Set(chon.map((x) => x.a.student_id)).size }, boLoc,
  };
}
