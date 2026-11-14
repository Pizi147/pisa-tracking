/**
 * HỌC VIÊN & LỚP › LỊCH THI (OV-15f, mockup 5 khung 1, thiết kế tổng thể mục 4 phương án D) — rà soát lịch THI THẬT khi họp:
 * chọn tháng dự kiến thi → em có tháng đó + em chưa có dự kiến → kết luận ngay trên hàng.
 *
 * LƯU: "Chốt ngày" / "Chuyển tháng" / "Đặt tháng" đi qua `updateCycle` (hàm có sẵn của cột Dự kiến thi: cùng quyền, cùng kiểm ngày, cùng hành trình học).
 * "Giữ tháng" / "Cần xác nhận" và ghi chú họp KHÔNG đổi lịch → ghi vào 5 cột `learning_cycles.lich_thi_*` (migrate `prOv15f.ts`, chỉ thêm cột NULL) — đọc chung
 * câu SELECT của danh sách; `audit_logs` chỉ còn là nhật ký. Không bước duyệt, không tạo việc ("Cần xác nhận" chỉ hiện ở dải đếm).
 * Dòng đọc Turso: MỘT câu em × lộ trình (lọc tháng ngay trong SQL — chỉ em có tháng chọn + em chưa có dự kiến).
 */
import { DS_JSON, db, theoLo, theoLoJson } from '../db.ts';
import {
  PERMISSIONS, chuanHoaMaLop, mondayOfDate, dsThangLichThi, ketLuanHienTai, suaLichTheoKetLuan, trangThaiLichThi, KET_LUAN_LICH_THI, laThangIso,
  trangThaiSauThi, ketQuaThiThat, buocLichThi,
  type ExamPlan, type KetLuanLichThi, type KetQuaVao, type LichThi, type TrangThaiSauThi, type BuocLichThi,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, forbidden, notFound, nowIso, loi } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { lopTrongPhamVi } from './classes.ts';
import { phamViTrang } from './hocVienLop.ts';
import { cycleById, examPlanOf, updateCycle } from '../fasttrack/cycles.ts';
import { standingFor } from '../students/standing.ts';
import { diemCuaLuot } from '../fasttrack/attempts.ts';
import { luotTheoLoTrinh, luotTruocCoOverall } from '../fasttrack/overallLuot.ts';
import { cotSauThi } from '../loTrinh/cotSauThi.ts';
import { listCases, type MappedCase } from '../cases/cases.ts';

const GHI_CHU_TOI_DA = 300;

/** KQ thi thật đã ghi: Overall (điểm lộ trình cũ có `outcome_score`), đạt Target (null = không Target), "Không thi". */
export type KqThiThatHang = {
  ovr: number | null; dat: boolean | null; khongThi: boolean;
  /** GD-13b (lời 40): 4 ô thi thật (null = dữ liệu cũ chỉ có Overall) + ngày có KQ (mốc Hành trình — chỉ khi chưa chọn bước tiếp) — cột đã có trong câu, 0 câu thêm. */
  kn: { L: number | null; R: number | null; W: number | null; S: number | null } | null; ngayKq: string | null;
};
export type LuuLichThi = { ketLuan: KetLuanLichThi | null; thang: string | null; ghiChu: string | null; ai: string | null; luc: string };
export type HangLichThi = {
  studentId: number; cycleId: number | null; ten: string; ma: string;
  classId: number; classCode: string; thuong: boolean; gvcn: string | null; tvv: string | null;
  target: number | null; kck: boolean; standing: KetQuaVao | null;
  duKien: ExamPlan; coNgay: boolean; thangDuKien: string | null; chuaCo: boolean;
  /** LT-SV: trạng thái lịch thi thật (`trangThaiLichThi`) — web vẽ chữ bằng `nhanLichThi`. */
  lichThi: LichThi;
  ketLuan: KetLuanLichThi | null; luu: LuuLichThi | null; coTheSua: boolean;
  /** LICH-THI-UI: bước của em (`buocLichThi` — trước thi gộp sau thi) + trạng thái sau thi (`trangThaiSauThi`, cùng luật Công việc) + KQ thi thật + bước tiếp đã chọn. */
  buoc: BuocLichThi; sauThi: TrangThaiSauThi; kq: KqThiThatHang | null; buocTiep: string | null;
  /** OV-15h2 (ý 2): ai · lúc đặt ngày thi đang có ("chốt 05/10 · Lê Thu"); chỉ khi đã chốt ngày và có nhật ký. */
  chot: { luc: string; ai: string | null } | null;
  /**
   * Dải mở hàng (LICH-THI-UI bản 3, như HV & Lớp): 5 ô MT gần nhất + ô so MT trước (`truoc`: điểm cùng kỹ năng của lượt trước, null = không có lượt trước) · Test sắp tới (mã lượt + tuần) ·
   * Case đang mở (id để mở panel Case, kỹ năng, mức SOS, số PA) · lịch sử lịch thi (mới trước, ≤ 3).
   */
  chiTiet: {
    kn: Record<'L' | 'R' | 'W1' | 'W2' | 'S', number | null> | null;
    /** Tuần thi của lượt MT gần nhất (thứ Hai) — tiêu đề khối "MT2 · W4 AUG". */
    mtTuan: string | null;
    truoc: { nhan: string; ovr: number | null; kn: Record<'L' | 'R' | 'W1' | 'W2' | 'S', number | null> } | null;
    sapToi: { luot: string; tuan: string } | null;
    caseMo: { id: number; kyNang: string | null; sos: number | null; soPa: number }[];
    lichSu: DongLichSu[];
    /** GD-13b: tổng số dòng lịch sử ("Lịch sử · n") — đếm từ chính hai câu nhật ký đã đọc, 0 câu thêm. */
    soLichSu: number;
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
  const lichThi = trangThaiLichThi(c, duKien, homNay);
  const sauThi = trangThaiSauThi(c ?? {}, homNay);
  const coNgay = !!c?.exam_date;
  const thangDuKien = duKien.month;
  return {
    duKien, coNgay, thangDuKien, chuaCo: duKien.confidence === 'none', lichThi, ketLuan: ketLuanHienTai({ coNgay, thangDuKien, luu }), luu,
    chot: coNgay ? chot : null,
    buoc: buocLichThi(lichThi, sauThi.giaiDoan), sauThi, kq: kqThiThatCua(c), buocTiep: c?.buoc_tiep ?? null,
  };
}

/** KQ thi thật của lộ trình: 4 ô thi thật (đủ → Overall + so Target) hoặc `outcome_score` cũ; chưa có → null. */
function kqThiThatCua(c: any): KqThiThatHang | null {
  if (!c) return null;
  if (c.thi_that_khong_thi) return { ovr: null, dat: null, khongThi: true, kn: null, ngayKq: c.ngay_kq ?? null };
  const d = [c.thi_that_l, c.thi_that_r, c.thi_that_w, c.thi_that_s].map((x) => (x === null || x === undefined ? null : Number(x)));
  let ovr: number | null = null; let dat: boolean | null = null;
  try {
    const k = ketQuaThiThat({ l: d[0], r: d[1], w: d[2], s: d[3], khongThi: false }, c.target_score ?? null);
    ovr = k.ovr; dat = k.ketLuan === 'reached' ? true : k.ketLuan === 'not_reached' ? false : null;
  } catch { /* điểm hỏng trong dữ liệu cũ → coi như chưa có */ }
  if (ovr === null && c.outcome_score != null) { ovr = Number(c.outcome_score); dat = c.outcome === 'reached' ? true : c.outcome === 'not_reached' ? false : null; }
  const kn = d.every((x) => x !== null) ? { L: d[0], R: d[1], W: d[2], S: d[3] } : null;
  return ovr === null ? null : { ovr, dat, khongThi: false, kn, ngayKq: c.ngay_kq ?? null };
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
              cy.id AS cycle_id, cy.target_score, cy.khong_cam_ket, cy.exam_period_id,
              rp.week_start AS exam_week_start, rp.code AS exam_week_code, ${cotSauThi('cy', 'rp')}, ${COT_LICH_THI_SQL}
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

export type DongLichSu = { luc: string; ai: string | null; ketLuan: string | null; ngay: string | null; ghiChu: string | null; kq?: string | null };
/**
 * Lịch sử lịch thi của các lộ trình (đổi tháng / ngày · kết luận + ghi chú · ghi KQ thi thật; mới trước, tối đa `gioiHan` dòng mỗi lộ trình) — theo lô. Hai câu, mỗi câu theo chỉ mục `idx_audit_entity` (entity_type, entity_id) —
 * không OR giữa hai loại (Turso quét cả bảng nhật ký). Dùng cho dải mở hàng (3 dòng) và "Xem toàn bộ" (một lộ trình, khi bấm).
 */
export function lichSuLichThi(cyc: readonly number[], gioiHan: number, dem?: Map<number, number>): Map<number, DongLichSu[]> {
  const out = new Map<number, DongLichSu[]>();
  theoLo([...cyc], (lo, ph) => {
    const nk = [
      ...db().prepare(
        `SELECT a.id, a.entity_id, a.action, a.created_at, u.full_name AS ai, a.after_json FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
          WHERE a.entity_type = 'lich_thi' AND a.entity_id IN (${ph}) AND a.action = 'lich_thi.luu'`).all(...lo) as any[],
      ...db().prepare(
        `SELECT a.id, a.entity_id, a.action, a.created_at, u.full_name AS ai, a.after_json FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
          WHERE a.entity_type = 'learning_cycle' AND a.entity_id IN (${ph})
            AND ((a.action = 'cycle.update' AND (json_extract(a.after_json, '$.exam_date') IS NOT json_extract(a.before_json, '$.exam_date')
              OR json_extract(a.after_json, '$.exam_month') IS NOT json_extract(a.before_json, '$.exam_month')))
              OR a.action = 'cycle.thi_that')`).all(...lo) as any[],   /* GD-13b: + ghi KQ thi thật (cùng câu, cùng chỉ mục) */
    ].sort((x, y) => y.id - x.id);
    for (const x of nk) {
      const ls = out.get(x.entity_id) ?? [];
      const sau = (() => { try { return JSON.parse(x.after_json ?? 'null') ?? {}; } catch { return {}; } })();
      if (x.action === 'lich_thi.luu' && sau.boLich) continue;   // Hoàn tác đặt tháng: dòng `cycle.update` (tháng → trống) đã nói "bỏ tháng thi"
      dem?.set(x.entity_id, (dem.get(x.entity_id) ?? 0) + 1);
      if (ls.length >= gioiHan) continue;
      if (x.action === 'lich_thi.luu') {
        ls.push({ luc: x.created_at, ai: x.ai ?? null, ketLuan: sau.ketLuan ?? null, ngay: null, ghiChu: sau.ghiChu ?? null });
      } else if (x.action === 'cycle.thi_that') {
        const kq = sau.khongThi ? 'Không thi' : sau.ovr != null ? Number(sau.ovr).toFixed(1) : null;
        ls.push({ luc: x.created_at, ai: x.ai ?? null, ketLuan: 'ghi-kq', ngay: null, ghiChu: null, kq });
      } else {
        const moc = sau.exam_date ?? sau.exam_month ?? null;
        ls.push({ luc: x.created_at, ai: x.ai ?? null, ketLuan: moc ? null : 'bo-lich', ngay: moc, ghiChu: null });
      }
      out.set(x.entity_id, ls);
    }
  });
  return out;
}

/**
 * Phần mở dưới hàng Lịch thi (V4 `mockup-v4-hoc-vien-lop.html` khung 3) — đọc THEO LÔ cho cả trang: điểm lượt của `standing` (`diemCuaLuot`, nhớ theo request),
 * một câu lượt kế hoạch sắp tới, một câu Case đang mở, hai câu nhật ký lịch thi (`lich_thi.luu` · `cycle.update` có đổi ngày / tháng thi) — mỗi lô ≤ 900.
 */
function chiTietLichThi(p: Principal, ds: readonly any[], standing: ReturnType<typeof standingFor>, hom: string): (r: any) => HangLichThi['chiTiet'] {
  const luotSt = [...new Set(ds.map((r) => standing.get(r.id)?.attemptId).filter((x): x is number => !!x))];
  /* "So MT trước" (↑ ↓ =): lượt có Overall liền trước của lượt MT gần nhất — CÙNG hàm Xu hướng của hàng HV (`luotTruocCoOverall`); chỉ em có MT ≥ 1 và Overall đủ. */
  const theoCy = luotTheoLoTrinh(ds.filter((r) => { const s = standing.get(r.id); return s?.mode === 'ielts_band' && s.overall != null && (s.attemptNo ?? 0) > 0 && s.cycleId; }).map((r) => standing.get(r.id)!.cycleId as number));
  const luotTruoc = new Map<number, ReturnType<typeof luotTruocCoOverall>>();
  for (const r of ds) { const s = standing.get(r.id); if (s?.cycleId && theoCy.has(s.cycleId) && s.attemptNo != null) luotTruoc.set(r.id, luotTruocCoOverall(theoCy.get(s.cycleId), s.attemptNo)); }
  const diem = diemCuaLuot([...luotSt, ...[...luotTruoc.values()].map((x) => x?.attemptId).filter((x): x is number => !!x)]);
  const cyc = [...new Set(ds.map((r) => r.cycle_id).filter((x): x is number => !!x))];
  const sapToi = new Map<number, { luot: string; tuan: string }>();
  theoLo(cyc, (lo, ph) => {
    for (const a of db().prepare(
      `SELECT a.cycle_id, a.kind, a.attempt_no, rp.week_start FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.cycle_id IN (${ph}) AND a.status = 'planned' AND rp.week_start >= ? ORDER BY rp.week_start, a.attempt_no`).all(...lo, mondayOfDate(hom)) as any[]) {
      if (!sapToi.has(a.cycle_id)) sapToi.set(a.cycle_id, { luot: a.kind === 'mt0' ? 'MT0' : a.kind === 'final' ? 'Final' : `MT${a.attempt_no}`, tuan: a.week_start });
    }
  });
  const demLs = new Map<number, number>();
  const lichSu = lichSuLichThi(cyc, 3, demLs);
  /* "Case mở" CÙNG nguồn với hàng HV / `chiTietCaseMo` (`listCases` của người xem, status ≠ done, không Case tạm) — không câu SQL riêng. */
  const caseMo = new Map<number, { id: number; kyNang: string | null; sos: number | null; soPa: number }[]>();
  const ids = [...new Set(ds.map((r) => r.id as number))];
  const mo: MappedCase[] = [];
  for (let k = 0; k < ids.length; k += 500) mo.push(...listCases(p, { studentIds: ids.slice(k, k + 500) }).rows);   // lô 500 như `xuatDanhSach` (trần tham số Turso)
  const dangMo = mo.filter((c) => c.status !== 'done' && c.studentId !== null && !c.tam);
  /* Số PA mỗi Case đang mở: MỘT câu đếm theo lô (PA chưa huỷ — cùng điều kiện `chiTietCaseMo`, không dựng cả chi tiết Case). */
  const soPa = new Map<number, number>();
  theoLoJson(dangMo.map((c) => c.id), (json) => {
    for (const x of db().prepare(`SELECT case_id, COUNT(*) AS n FROM case_interventions WHERE case_id IN (${DS_JSON}) AND status != 'cancelled' GROUP BY case_id`).all(json) as any[]) soPa.set(x.case_id, x.n);
  });
  for (const c of dangMo) caseMo.set(c.studentId!, [...(caseMo.get(c.studentId!) ?? []), { id: c.id, kyNang: c.topicLabel ?? c.topic, sos: c.sosLevel, soPa: soPa.get(c.id) ?? 0 }]);
  return (r) => {
    const st = standing.get(r.id);
    const bandCua = (id: number | null | undefined) => (k: string) => (id ? diem.get(id)?.find((x) => x.skill === k)?.band ?? null : null);
    const kn5 = (id: number | null | undefined) => { const b = bandCua(id); return { L: b('listening'), R: b('reading'), W1: b('writing1'), W2: b('writing2'), S: b('speaking') }; };
    const tr = luotTruoc.get(r.id);
    return {
      kn: st?.attemptId && st.mode === 'ielts_band' ? kn5(st.attemptId) : null,
      mtTuan: st?.attemptWeekStart ?? null,
      truoc: tr ? { nhan: `MT${tr.mt}`, ovr: tr.ovr, kn: kn5(tr.attemptId) } : null,
      sapToi: sapToi.get(r.cycle_id) ?? null, caseMo: caseMo.get(r.id) ?? [], lichSu: lichSu.get(r.cycle_id) ?? [],
      soLichSu: demLs.get(r.cycle_id) ?? 0,
    };
  };
}

/** GET /hoc-vien-lop/lich-thi/:cycleId/lich-su — "Xem toàn bộ" của dải mở hàng (chỉ khi bấm): tối đa 50 dòng, cùng nguồn 3 dòng của danh sách, cùng quyền xem em. */
export function lichSuLichThiMotEm(p: Principal, cycleId: number): DongLichSu[] {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  if (!can(p, PERMISSIONS.STUDENT_VIEW, { studentId: c.student_id })) throw forbidden('Bạn không có quyền xem em này.');
  return lichSuLichThi([cycleId], 50).get(cycleId) ?? [];
}

/**
 * PUT /hoc-vien-lop/lich-thi/:cycleId — lưu MỘT kết luận và / hoặc ghi chú họp. Lỗi lịch (ngày sai, ngoài cận năm) do `updateCycle` báo 400;
 * lịch ghi xong mới ghi 5 cột `lich_thi_*` + nhật ký (lỗi giữa chừng → lưu lại là xong, ghi đè cùng giá trị). Trả hàng đã cập nhật để web đổi tại chỗ.
 */
export function luuLichThi(
  p: Principal, cycleId: number,
  i: { ketLuan?: unknown; ngay?: unknown; thang?: unknown; ghiChu?: unknown; boLich?: unknown },
): Pick<HangLichThi, 'duKien' | 'coNgay' | 'thangDuKien' | 'chuaCo' | 'lichThi' | 'ketLuan' | 'luu' | 'chot' | 'buoc' | 'sauThi' | 'kq' | 'buocTiep'> {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  if (!coTheSua(p, c.student_id)) throw forbidden('Bạn không có quyền sửa dự kiến thi của em này.');
  const doc = () => db().prepare(`SELECT cy.*, rp.week_start AS exam_week_start, ${cotSauThi('cy', 'rp')}, ${COT_LICH_THI_SQL} FROM learning_cycles cy
      LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id LEFT JOIN users gu ON gu.id = cy.lich_thi_ghi_chu_boi WHERE cy.id = ?`).get(cycleId) as any;
  const cu = luuTuCot(doc());
  const ghiChu = i.ghiChu === undefined ? undefined : String(i.ghiChu ?? '').trim();
  if (ghiChu !== undefined && ghiChu.length > GHI_CHU_TOI_DA) throw loi(400, 'Ghi chú tối đa {GHI_CHU_TOI_DA} ký tự.', { GHI_CHU_TOI_DA });
  const ketLuan = i.ketLuan === undefined || i.ketLuan === null ? null : String(i.ketLuan);
  if (ketLuan !== null && !(KET_LUAN_LICH_THI as readonly string[]).includes(ketLuan)) throw badRequest('Kết luận không hợp lệ.');
  /* LICH-THI-UI (XM-2): Hoàn tác một lần ĐẶT tháng đầu tiên = xoá lịch về "chưa có" (các lần khác hoàn tác bằng PUT lại giá trị cũ); có nhật ký. */
  const boLich = i.boLich === true && ketLuan === null;
  if (ketLuan === null && ghiChu === undefined && !boLich) throw badRequest('Chọn kết luận hoặc ghi chú.');
  const homNay = demoToday();
  const truoc = tinhLich(c, cu, homNay);
  let thangGhi: string | null = cu?.thang ?? null;
  if (boLich) { updateCycle(p, cycleId, { examDate: null }); thangGhi = null; }
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
    ketLuan: boLich ? null : (ketLuan as KetLuanLichThi | null) ?? cu?.ketLuan ?? null, thang: thangGhi,
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
    entityLabel: `${st?.student_code ?? ''} · ${moi.ketLuan ?? (boLich ? 'bỏ lịch' : 'ghi chú')}`, before: cu ? { ketLuan: cu.ketLuan, thang: cu.thang, ghiChu: cu.ghiChu } : null, after: boLich ? { ...moi, boLich: true } : moi,
  });
  const sau = doc();
  return tinhLich(sau, luuTuCot(sau), homNay, chotNgayCua([{ id: cycleId, exam_date: sau.exam_date ?? null }]).get(cycleId) ?? null);
}
