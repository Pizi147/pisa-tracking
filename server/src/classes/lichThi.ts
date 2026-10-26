/**
 * HỌC VIÊN & LỚP › LỊCH THI (OV-15f, mockup 5 khung 1, thiết kế tổng thể mục 4 phương án D) — rà soát lịch THI THẬT khi họp:
 * chọn tháng dự kiến thi → em có tháng đó + em chưa có dự kiến → kết luận ngay trên hàng.
 *
 * LƯU: "Chốt ngày" / "Chuyển tháng" / "Đặt tháng" đi qua `updateCycle` (hàm có sẵn của cột Dự kiến thi: cùng quyền, cùng kiểm ngày, cùng hành trình học).
 * "Giữ tháng" / "Cần xác nhận" và ghi chú họp KHÔNG đổi lịch → ghi vào 5 cột `learning_cycles.lich_thi_*` (migrate `prOv15f.ts`, chỉ thêm cột NULL) — đọc chung
 * câu SELECT của danh sách; `audit_logs` chỉ còn là nhật ký. Không bước duyệt, không tạo việc ("Cần xác nhận" chỉ hiện ở dải đếm).
 * Dòng đọc Turso: MỘT câu em × lộ trình (lọc tháng ngay trong SQL — chỉ em có tháng chọn + em chưa có dự kiến).
 */
import { db, theoLo } from '../db.ts';
import {
  PERMISSIONS, chuanHoaMaLop, mondayOfDate, dsThangLichThi, ketLuanHienTai, suaLichTheoKetLuan, trangThaiLichThi, KET_LUAN_LICH_THI, laThangIso,
  type ExamPlan, type KetLuanLichThi, type KetQuaVao, type LichThi,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, forbidden, notFound, nowIso, loi } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { lopTrongPhamVi } from './classes.ts';
import { phamViTrang } from './hocVienLop.ts';
import { cycleById, examPlanOf, updateCycle } from '../fasttrack/cycles.ts';
import { chanLuuTru } from '../students/students.ts';
import { standingFor } from '../students/standing.ts';
import { diemCuaLuot } from '../fasttrack/attempts.ts';
import { listCases, type MappedCase } from '../cases/cases.ts';

const GHI_CHU_TOI_DA = 300;

export type LuuLichThi = { ketLuan: KetLuanLichThi | null; thang: string | null; ghiChu: string | null; ai: string | null; luc: string };
export type HangLichThi = {
  studentId: number; cycleId: number | null; ten: string; ma: string;
  classId: number; classCode: string; thuong: boolean; gvcn: string | null; tvv: string | null;
  target: number | null; kck: boolean; standing: KetQuaVao | null;
  duKien: ExamPlan; coNgay: boolean; thangDuKien: string | null; chuaCo: boolean;
  /** LT-SV: trạng thái lịch thi thật (`trangThaiLichThi`) — web vẽ chữ bằng `nhanLichThi`. */
  lichThi: LichThi;
  ketLuan: KetLuanLichThi | null; luu: LuuLichThi | null; coTheSua: boolean;
  /** OV-15h2 (ý 2): ai · lúc đặt ngày thi đang có ("chốt 05/10 · Lê Thu"); chỉ khi đã chốt ngày và có nhật ký. */
  chot: { luc: string; ai: string | null } | null;
  /** UI-HV-LOP (V4 khung Lịch thi — mở dưới hàng): 5 ô MT gần nhất · Test sắp tới (mã lượt + tuần) · Case đang mở (kỹ năng) · lịch sử lịch thi (mới trước, ≤ 3). */
  chiTiet: {
    kn: Record<'L' | 'R' | 'W1' | 'W2' | 'S', number | null> | null;
    sapToi: { luot: string; tuan: string } | null;
    caseMo: string[];
    lichSu: { luc: string; ai: string | null; ketLuan: string | null; ngay: string | null; ghiChu: string | null }[];
  };
};
export type TrangLichThi = { thang: string[]; rows: HangLichThi[] };

/** Kết luận + ghi chú họp đang lưu trên dòng lộ trình (các cột `lich_thi_*` + tên người ghi chú `ghi_chu_ai`); chưa có gì → null. */
export function luuTuCot(r: any): LuuLichThi | null {
  const kl = (KET_LUAN_LICH_THI as readonly string[]).includes(r?.lich_thi_ket_luan) ? (r.lich_thi_ket_luan as KetLuanLichThi) : null;
  const ghiChu: string | null = r?.lich_thi_ghi_chu || null;
  return kl || ghiChu ? { ketLuan: kl, thang: r.lich_thi_thang ?? null, ghiChu, ai: r.ghi_chu_ai ?? null, luc: r.lich_thi_ghi_chu_luc ?? '' } : null;
}
/** Cột `lich_thi_*` + người ghi chú — gắn vào câu SELECT lộ trình (`cy`) có `LEFT JOIN users gu ON gu.id = cy.lich_thi_ghi_chu_boi`. */
export const COT_LICH_THI_SQL = 'cy.lich_thi_ket_luan, cy.lich_thi_thang, cy.lich_thi_ghi_chu, cy.lich_thi_ghi_chu_luc, gu.full_name AS ghi_chu_ai';

/** Tình trạng lịch của một lộ trình + nhật ký → các trường của hàng (một nguồn cho danh sách và cho kết quả sau khi lưu). */
function tinhLich(c: any, luu: LuuLichThi | null, homNay: string, chot: { luc: string; ai: string | null } | null = null) {
  const duKien = examPlanOf(c);
  const coNgay = !!c?.exam_date;
  const thangDuKien = duKien.month;
  return {
    duKien, coNgay, thangDuKien, chuaCo: duKien.confidence === 'none', lichThi: trangThaiLichThi(c, duKien, homNay), ketLuan: ketLuanHienTai({ coNgay, thangDuKien, luu }), luu,
    chot: coNgay ? chot : null,
  };
}

/**
 * OV-15h2 (ý 2): dòng "chốt 05/10 · Lê Thu" dưới Lịch hiện tại — lần đổi lộ trình GẦN NHẤT đặt đúng ngày thi đang có (nhật ký `cycle.update`, mọi nơi sửa
 * ngày thi đều đi qua `updateCycle`). Ngày đặt không qua nhật ký (dữ liệu cũ / nhập thẳng) → không có dòng, không bịa. Một câu mỗi lô, chỉ mục `idx_audit_entity`.
 * OV-15i2 (ý 11): GIỮ nguồn `cycle.update` (sự kiện đổi ngày thi), KHÔNG đọc nhật ký kết luận Lịch thi — ngày còn đổi ở hồ sơ / Kế hoạch Test, mọi đường
 * đều ghi `cycle.update`; nhật ký kết luận chỉ có ở góc này nên sẽ sót người đặt ngày ở nơi khác.
 */
export function chotNgayCua(ds: readonly { id: number; exam_date: string | null }[]): Map<number, { luc: string; ai: string | null }> {
  const ngay = new Map(ds.filter((x) => x.exam_date).map((x) => [x.id, x.exam_date as string]));
  const out = new Map<number, { luc: string; ai: string | null }>();
  theoLo([...ngay.keys()], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT a.entity_id, a.created_at, u.full_name AS ai, json_extract(a.after_json, '$.exam_date') AS ngay FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE a.entity_type = 'learning_cycle' AND a.entity_id IN (${ph}) AND a.action = 'cycle.update'
          AND json_extract(a.after_json, '$.exam_date') IS NOT json_extract(a.before_json, '$.exam_date') ORDER BY a.id`).all(...lo) as any[]) {
      if (r.ngay === ngay.get(r.entity_id)) out.set(r.entity_id, { luc: r.created_at, ai: r.ai ?? null }); else out.delete(r.entity_id);
    }
  });
  return out;
}

const coTheSua = (p: Principal, studentId: number) =>
  can(p, PERMISSIONS.STUDENT_EDIT, { studentId }) || can(p, PERMISSIONS.STUDENT_EDIT_INFO, { studentId });

/**
 * GET /hoc-vien-lop/lich-thi — em đang học trong phạm vi của trang (cùng `phamViTrang`) có tháng dự kiến thi nằm trong `thang`, cộng em CHƯA có dự kiến.
 * Một em học hai lớp = một hàng (lớp đầu). Xếp theo lớp rồi tên.
 */
export function danhSachLichThi(
  p: Principal, f: { thang?: string | null; branchId?: number | null; q?: string | null; phamVi?: string | null; cnNho?: number | null } = {},
): TrangLichThi {
  const thang = dsThangLichThi(f.thang);
  const hom = demoToday();
  const { dangDung, chiNhanh, phanCong } = phamViTrang(p, f, hom);
  const lopToi = new Set(phanCong.map((a) => a.classId));
  /* Cả lớp FT lẫn lớp thường (đặc tả mục 4 "chỉ thi thật" = loại kỳ thi, không phải loại lớp); nhóm "Chưa có dự kiến" chỉ em FT (lọc ở `chon`). */
  const lops = (lopTrongPhamVi(p, chiNhanh ?? undefined) ?? []).filter((c) => dangDung !== 'toi' || lopToi.has(c.id));
  if (!lops.length) return { thang, rows: [] };
  const lop = new Map(lops.map((c) => [c.id as number, c]));
  const q = (f.q ?? '').trim();
  const ql = q.toLowerCase();
  const qMa = chuanHoaMaLop(q);
  const khop = (r: any) => !q || (!!qMa && chuanHoaMaLop(lop.get(r.class_id)?.code ?? '').includes(qMa))
    || String(r.full_name ?? '').toLowerCase().includes(ql) || String(r.normalized_name ?? '').includes(ql) || String(r.student_code ?? '').toUpperCase().includes(q.toUpperCase());

  const em: any[] = [];
  const mm = thang.length ? thang.map(() => '?').join(',') : null;
  theoLo([...lop.keys()], (lo, ph) => {
    em.push(...db().prepare(
      `SELECT e.class_id, s.id, s.full_name, s.normalized_name, s.student_code, tv.full_name AS tvv,
              cy.id AS cycle_id, cy.target_score, cy.khong_cam_ket, cy.exam_month, cy.exam_date, cy.exam_period_id, cy.thi_that_ngay,
              rp.week_start AS exam_week_start, rp.code AS exam_week_code, ${COT_LICH_THI_SQL}
         FROM enrollments e JOIN students s ON s.id = e.student_id
         LEFT JOIN users tv ON tv.id = s.consultant_user_id
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
         LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id
         LEFT JOIN users gu ON gu.id = cy.lich_thi_ghi_chu_boi
        WHERE e.class_id IN (${ph}) AND e.status = 'active' AND s.archived_at IS NULL${dangDung === 'cua-toi' ? ' AND s.consultant_user_id = ?' : ''}
          AND (cy.id IS NULL OR (cy.exam_month IS NULL AND cy.exam_date IS NULL AND cy.exam_period_id IS NULL)${mm
            ? ` OR cy.exam_month IN (${mm}) OR substr(cy.exam_date, 1, 7) IN (${mm}) OR substr(rp.week_start, 1, 7) IN (${mm})` : ''})
        ORDER BY e.id`).all(...lo, ...(dangDung === 'cua-toi' ? [p.userId] : []), ...(mm ? [...thang, ...thang, ...thang] : [])) as any[]);
  });
  const dau = new Map<number, any>();
  for (const r of em) if (!dau.has(r.id) && khop(r)) dau.set(r.id, r);
  const chon = [...dau.values()].map((r) => ({ r, lich: examPlanOf(r) }))
    .filter(({ r, lich }) => (lich.confidence === 'none' ? lop.get(r.class_id)?.scoring_mode !== 'ratio' : !!lich.month && thang.includes(lich.month)));

  const gvcn = new Map<number, string>();
  theoLo([...new Set(chon.map((x) => x.r.class_id as number))], (lo, ph) => {
    for (const g of db().prepare(
      `SELECT ta.class_id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id IN (${ph}) AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id`).all(...lo) as any[]) {
      if (!gvcn.has(g.class_id)) gvcn.set(g.class_id, g.full_name);
    }
  });
  const standing = standingFor(chon.map((x) => x.r.id as number));
  /* Quyền sửa tính MỘT lần cho mỗi LỚP (không theo từng em: `can` với `studentId` tra lớp / chi nhánh mỗi lần gọi — 2 câu mỗi em). */
  const suaDuoc = new Map<number, boolean>();
  const suaLop = (classId: number) => { if (!suaDuoc.has(classId)) suaDuoc.set(classId, can(p, PERMISSIONS.STUDENT_EDIT, { classId }) || can(p, PERMISSIONS.STUDENT_EDIT_INFO, { classId })); return suaDuoc.get(classId)!; };
  const chot = chotNgayCua(chon.filter((x) => x.r.cycle_id).map((x) => ({ id: x.r.cycle_id as number, exam_date: x.r.exam_date ?? null })));
  const chiTiet = chiTietLichThi(p, chon.map((x) => x.r), standing, hom);
  const rows: HangLichThi[] = chon.map(({ r }) => {
    const l = lop.get(r.class_id);
    return {
      studentId: r.id, cycleId: r.cycle_id ?? null, ten: r.full_name, ma: r.student_code ?? '',
      classId: r.class_id, classCode: l?.code ?? '', thuong: l?.scoring_mode === 'ratio', gvcn: gvcn.get(r.class_id) ?? null, tvv: r.tvv ?? null,
      target: r.target_score ?? null, kck: !!r.khong_cam_ket, standing: (standing.get(r.id) as KetQuaVao | undefined) ?? null,
      ...tinhLich(r, luuTuCot(r), hom, chot.get(r.cycle_id) ?? null),
      coTheSua: !!r.cycle_id && suaLop(r.class_id),
      chiTiet: chiTiet(r),
    };
  });
  rows.sort((a, b) => a.classCode.localeCompare(b.classCode, 'vi', { numeric: true }) || a.ten.localeCompare(b.ten, 'vi') || a.studentId - b.studentId);
  return { thang, rows };
}

/**
 * Phần mở dưới hàng Lịch thi (V4 `mockup-v4-hoc-vien-lop.html` khung 3) — đọc THEO LÔ cho cả trang: điểm lượt của `standing` (`diemCuaLuot`, nhớ theo request),
 * một câu lượt kế hoạch sắp tới, một câu Case đang mở, hai câu nhật ký lịch thi (`lich_thi.luu` · `cycle.update` có đổi ngày / tháng thi) — mỗi lô ≤ 900.
 */
function chiTietLichThi(p: Principal, ds: readonly any[], standing: ReturnType<typeof standingFor>, hom: string): (r: any) => HangLichThi['chiTiet'] {
  const luotSt = [...new Set(ds.map((r) => standing.get(r.id)?.attemptId).filter((x): x is number => !!x))];
  const diem = diemCuaLuot(luotSt);
  const cyc = [...new Set(ds.map((r) => r.cycle_id).filter((x): x is number => !!x))];
  const sapToi = new Map<number, { luot: string; tuan: string }>();
  const lichSu = new Map<number, HangLichThi['chiTiet']['lichSu']>();
  theoLo(cyc, (lo, ph) => {
    for (const a of db().prepare(
      `SELECT a.cycle_id, a.kind, a.attempt_no, rp.week_start FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.cycle_id IN (${ph}) AND a.status = 'planned' AND rp.week_start >= ? ORDER BY rp.week_start, a.attempt_no`).all(...lo, mondayOfDate(hom)) as any[]) {
      if (!sapToi.has(a.cycle_id)) sapToi.set(a.cycle_id, { luot: a.kind === 'mt0' ? 'MT0' : a.kind === 'final' ? 'Final' : `MT${a.attempt_no}`, tuan: a.week_start });
    }
    /* Hai câu, mỗi câu theo chỉ mục `idx_audit_entity` (entity_type, entity_id) — không OR giữa hai loại (Turso quét cả bảng nhật ký). */
    const nk = [
      ...db().prepare(
        `SELECT a.id, a.entity_id, a.action, a.created_at, u.full_name AS ai, a.after_json FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
          WHERE a.entity_type = 'lich_thi' AND a.entity_id IN (${ph}) AND a.action = 'lich_thi.luu'`).all(...lo) as any[],
      ...db().prepare(
        `SELECT a.id, a.entity_id, a.action, a.created_at, u.full_name AS ai, a.after_json FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
          WHERE a.entity_type = 'learning_cycle' AND a.entity_id IN (${ph}) AND a.action = 'cycle.update'
            AND (json_extract(a.after_json, '$.exam_date') IS NOT json_extract(a.before_json, '$.exam_date')
              OR json_extract(a.after_json, '$.exam_month') IS NOT json_extract(a.before_json, '$.exam_month'))`).all(...lo) as any[],
    ].sort((x, y) => y.id - x.id);
    for (const x of nk) {
      const ls = lichSu.get(x.entity_id) ?? [];
      if (ls.length >= 3) continue;
      const sau = (() => { try { return JSON.parse(x.after_json ?? 'null') ?? {}; } catch { return {}; } })();
      ls.push(x.action === 'lich_thi.luu'
        ? { luc: x.created_at, ai: x.ai ?? null, ketLuan: sau.ketLuan ?? null, ngay: null, ghiChu: sau.ghiChu ?? null }
        : { luc: x.created_at, ai: x.ai ?? null, ketLuan: null, ngay: sau.exam_date ?? sau.exam_month ?? null, ghiChu: null });
      lichSu.set(x.entity_id, ls);
    }
  });
  /* "Case mở" CÙNG nguồn với hàng HV / `chiTietCaseMo` (`listCases` của người xem, status ≠ done, không Case tạm) — không câu SQL riêng. */
  const caseMo = new Map<number, string[]>();
  const ids = [...new Set(ds.map((r) => r.id as number))];
  const mo: MappedCase[] = [];
  for (let k = 0; k < ids.length; k += 500) mo.push(...listCases(p, { studentIds: ids.slice(k, k + 500) }).rows);   // lô 500 như `xuatDanhSach` (trần tham số Turso)
  for (const c of mo) {
    if (c.status === 'done' || c.studentId === null || !c.topic) continue;
    caseMo.set(c.studentId, [...new Set([...(caseMo.get(c.studentId) ?? []), c.topic])]);
  }
  return (r) => {
    const st = standing.get(r.id);
    const band = (k: string) => diem.get(st?.attemptId as number)?.find((x) => x.skill === k)?.band ?? null;
    return {
      kn: st?.attemptId && st.mode === 'ielts_band' ? { L: band('listening'), R: band('reading'), W1: band('writing1'), W2: band('writing2'), S: band('speaking') } : null,
      sapToi: sapToi.get(r.cycle_id) ?? null, caseMo: caseMo.get(r.id) ?? [], lichSu: lichSu.get(r.cycle_id) ?? [],
    };
  };
}

/**
 * PUT /hoc-vien-lop/lich-thi/:cycleId — lưu MỘT kết luận và / hoặc ghi chú họp. Lỗi lịch (ngày sai, ngoài cận năm) do `updateCycle` báo 400;
 * lịch ghi xong mới ghi 5 cột `lich_thi_*` + nhật ký (lỗi giữa chừng → lưu lại là xong, ghi đè cùng giá trị). Trả hàng đã cập nhật để web đổi tại chỗ.
 */
export function luuLichThi(
  p: Principal, cycleId: number,
  i: { ketLuan?: unknown; ngay?: unknown; thang?: unknown; ghiChu?: unknown },
): { duKien: ExamPlan; coNgay: boolean; thangDuKien: string | null; chuaCo: boolean; lichThi: LichThi; ketLuan: KetLuanLichThi | null; luu: LuuLichThi | null; chot: HangLichThi['chot'] } {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  chanLuuTru(p, cycleId);
  if (!coTheSua(p, c.student_id)) throw forbidden('Bạn không có quyền sửa dự kiến thi của em này.');
  const doc = () => db().prepare(`SELECT cy.*, ${COT_LICH_THI_SQL} FROM learning_cycles cy LEFT JOIN users gu ON gu.id = cy.lich_thi_ghi_chu_boi WHERE cy.id = ?`).get(cycleId) as any;
  const cu = luuTuCot(doc());
  const ghiChu = i.ghiChu === undefined ? undefined : String(i.ghiChu ?? '').trim();
  if (ghiChu !== undefined && ghiChu.length > GHI_CHU_TOI_DA) throw loi(400, 'Ghi chú tối đa {GHI_CHU_TOI_DA} ký tự.', { GHI_CHU_TOI_DA });
  const ketLuan = i.ketLuan === undefined || i.ketLuan === null ? null : String(i.ketLuan);
  if (ketLuan !== null && !(KET_LUAN_LICH_THI as readonly string[]).includes(ketLuan)) throw badRequest('Kết luận không hợp lệ.');
  if (ketLuan === null && ghiChu === undefined) throw badRequest('Chọn kết luận hoặc ghi chú.');
  const homNay = demoToday();
  const truoc = tinhLich(c, cu, homNay);
  let thangGhi: string | null = cu?.thang ?? null;
  if (ketLuan) {
    const s = suaLichTheoKetLuan({
      ketLuan: ketLuan as KetLuanLichThi, ngay: typeof i.ngay === 'string' ? i.ngay : null, thang: typeof i.thang === 'string' ? i.thang : null,
      coNgay: truoc.coNgay, thangDuKien: truoc.thangDuKien,
    });
    if ('loi' in s) throw badRequest(s.loi);
    if (s.examDate !== undefined) updateCycle(p, cycleId, { examDate: s.examDate });
    /* Tháng ghi cùng kết luận: tháng hiện tại (giữ / cần xác nhận) hoặc tháng mới (chuyển / chốt) — chỉ "giữ" và "cần xác nhận" còn hiệu lực theo tháng. */
    thangGhi = ketLuan === 'chuyen-thang' && laThangIso(i.thang) ? i.thang : truoc.thangDuKien;
  }
  const moi = {
    ketLuan: (ketLuan as KetLuanLichThi | null) ?? cu?.ketLuan ?? null, thang: thangGhi,
    ghiChu: ghiChu === undefined ? cu?.ghiChu ?? null : ghiChu || null,
  };
  const luc = nowIso();
  const doiGhiChu = ghiChu === undefined ? 0 : 1;
  db().prepare(
    `UPDATE learning_cycles SET lich_thi_ket_luan = ?, lich_thi_thang = ?, lich_thi_ghi_chu = ?,
            lich_thi_ghi_chu_boi = CASE WHEN ? = 1 THEN ? ELSE lich_thi_ghi_chu_boi END, lich_thi_ghi_chu_luc = CASE WHEN ? = 1 THEN ? ELSE lich_thi_ghi_chu_luc END WHERE id = ?`,
  ).run(moi.ketLuan, moi.thang, moi.ghiChu, doiGhiChu, p.userId, doiGhiChu, luc, cycleId);
  const st = db().prepare('SELECT student_code FROM students WHERE id = ?').get(c.student_id) as any;
  writeAudit({
    actorUserId: p.userId, action: 'lich_thi.luu', entityType: 'lich_thi', entityId: cycleId,
    entityLabel: `${st?.student_code ?? ''} · ${moi.ketLuan ?? 'ghi chú'}`, before: cu ? { ketLuan: cu.ketLuan, thang: cu.thang, ghiChu: cu.ghiChu } : null, after: moi,
  });
  const sau = doc();
  return tinhLich(sau, luuTuCot(sau), homNay, chotNgayCua([{ id: cycleId, exam_date: sau.exam_date ?? null }]).get(cycleId) ?? null);
}
