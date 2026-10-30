/**
 * HỌC VIÊN & LỚP · "ĐANG SOS" + PANEL MỘT EM (OV-12f, đặc tả OV-12 mục 3.5 / 7.9, mockup 3 v2 + panel v3 §9).
 *
 * SL2 (9.1-4, X-22): Đang SOS = "SOS hiện tại" — CHÍNH tập `hv-sos-hien-tai` (đợt mới nhất hợp lệ, gồm SOS tạm), một em một dòng, không lọc tuần thi.
 * Lượt SOS theo tuần (số trong kỳ) ở Phân tích › Test + SOS. PA + kết quả là tình trạng HÔM NAY.
 * Phạm vi: quyền xem lượt (`attempt.view`) + Phạm vi của trang (Lớp tôi dạy · HV của tôi · Chi nhánh · Tất cả). Case: `listCases` (lọc quyền sẵn).
 */
import { db, theoLo } from '../db.ts';
import {
  ATTEMPT_KIND_SHORT, NHOM_THEO_COT, chipSosTuKetQua, PERMISSIONS, tenPaGon, outcomeLabelFor, vaiXemHocVien, chuanHoaMaLop,
  trangThaiLichThi,
  type AttemptKind, type LienHe, type NhomXuLy, type PhamVi,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { forbidden } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
import { metricSet } from '../worklist/metrics.ts';
import { latestAttempts, type AttemptEval } from '../worklist/danhGia.ts';
import { lopCuaTap } from '../worklist/chuongTrinh.ts';
import { listCases, type MappedCase } from '../cases/cases.ts';
import { chiTietCaseMo } from '../cases/caseLop.ts';
import { xuLyCaseMany } from '../cases/sosState.ts';
import { phamViTrang } from './hocVienLop.ts';
import { standingFor } from '../students/standing.ts';
import { diemTuStanding } from '../worklist/diemDong.ts';
import { sauThiCuaEm } from '../loTrinh/thiThat.ts';
import { examPlanOf } from '../fasttrack/cycles.ts';

export type CaseTomTat = {
  id: number; topic: string | null; kyNang: string | null;
  nguyenNhan: string | null; nhanXet: string | null;
  pa: { id: number; ten: string; nguoi: string | null; choXacNhan: boolean; xong: boolean }[];
  /** Kết quả PA gần nhất (tình trạng tới hôm nay) — chữ 5 mức + ngày ghi. */
  ketQua: string | null; ketQuaNgay: string | null;
  nhom: NhomXuLy; trangThai: string;
  /** `nguoi` (UI-HV-LOP, khu d): người làm việc tiếp — người của PA việc đó, việc mức Case thì người giữ Case. */
  viecTiep: { chu: string; han: string | null; loaiHan: string | null; quaHan: boolean; nguoi: string | null } | null;
  /** Lượt sinh / lặp Case — panel ghép Case với lượt SOS ("MT2"). */
  attemptId: number | null; attemptNo: number | null; done: boolean;
};
export type DongSos = {
  attemptId: number; studentId: number; ten: string; ma: string; classId: number; classCode: string; branchName: string | null; ft: boolean;
  luot: string; tuan: string; sosLevel: number; kyNang: string[];
  /** OV-15f: lượt chưa chấm đủ (SOS tạm) — tệp xuất "Tạm / Chính thức". */
  tam: boolean;
  cases: CaseTomTat[]; tvv: string | null; lienHe: LienHe;
};
export type TrangSos = { phamVi: PhamVi; rows: DongSos[] };

/** Tóm tắt Case cho bảng / panel — một nguồn (`chiTietCaseMo`, cùng luật trạng thái V4 + việc tiếp của hồ sơ lớp). */
export function tomTatCase(cases: readonly MappedCase[]): Map<number, CaseTomTat> {
  const out = new Map<number, CaseTomTat>();
  const ct = chiTietCaseMo(cases);
  const nhanXet = new Map<number, string>();
  theoLo(cases.map((c) => c.id), (lo, ph) => {
    for (const r of db().prepare(`SELECT case_id, observation FROM case_issues WHERE role = 'primary' AND case_id IN (${ph}) ORDER BY id`).all(...lo) as any[]) {
      if (r.observation && !nhanXet.has(r.case_id)) nhanXet.set(r.case_id, r.observation);
    }
  });
  const homNay = demoToday();
  const xl = xuLyCaseMany(cases.map((c) => c.id), homNay);   // OV-12d: cùng nhóm với Tổng hợp / Tổng quan
  for (const c of cases) {
    const x = ct.get(c.id);
    if (!x) continue;
    out.set(c.id, {
      id: c.id, topic: c.topic, kyNang: c.topicLabel ?? c.categoryLabel, nguyenNhan: c.primaryLabel, nhanXet: nhanXet.get(c.id) ?? null,
      pa: x.pas.map((p) => ({ id: p.id, ten: tenPaGon(p.ten), nguoi: p.nguoi, choXacNhan: p.choXacNhan, xong: p.xong })),
      ketQua: c.lastOutcome ? outcomeLabelFor(c.lastOutcome) : null, ketQuaNgay: c.lastOutcomeOn,
      nhom: NHOM_THEO_COT[xl.get(c.id)?.cot ?? 'choDuyet'], trangThai: x.trangThai.chu,
      viecTiep: x.viecTiep ? { chu: x.viecTiep.chu, han: x.viecTiep.han, loaiHan: x.viecTiep.loaiHan, quaHan: !!x.viecTiep.han && x.viecTiep.han < homNay,
        nguoi: (x.viecTiep.paId != null ? x.pas.find((p) => p.id === x.viecTiep!.paId)?.nguoi : null) ?? c.ownerName ?? null } : null,
      attemptId: c.attemptId, attemptNo: c.attemptNo, done: c.status === 'done',
    });
  }
  return out;
}

/** Tên + mã + TVV + liên hệ của các em (một câu mỗi lô). */
function thongTinEm(ids: readonly number[]): Map<number, { ten: string; ma: string; tvv: string | null; lienHe: LienHe }> {
  const out = new Map<number, { ten: string; ma: string; tvv: string | null; lienHe: LienHe }>();
  theoLo([...new Set(ids)], (lo, ph) => {
    for (const s of db().prepare(
      `SELECT s.id, s.full_name, s.student_code, s.phone, s.parent_name, s.parent_relation, s.parent_phone, u.full_name AS tvv
         FROM students s LEFT JOIN users u ON u.id = s.consultant_user_id WHERE s.id IN (${ph})`,
    ).all(...lo) as any[]) {
      out.set(s.id, {
        ten: s.full_name, ma: s.student_code ?? '', tvv: s.tvv ?? null,
        lienHe: { phone: s.phone ?? null, parentName: s.parent_name ?? null, parentRelation: s.parent_relation ?? null, parentPhone: s.parent_phone ?? null },
      });
    }
  });
  return out;
}

/** SL2: nhãn lượt + kỹ năng dưới kỳ vọng của lượt "SOS hiện tại" — một chỗ cho Đang SOS và tệp xuất. */
export const sosCuaLuot = (a: AttemptEval) => ({
  luot: a.kind === 'mock' ? `MT${a.attemptNo}` : ATTEMPT_KIND_SHORT[a.kind as AttemptKind] ?? a.kind, tuan: a.weekStart ?? '',
  sosLevel: Math.min(3, a.sosLevel ?? 1), kyNang: Object.entries(a.skills).filter(([, s]) => s.evaluable && s.under).map(([k]) => k),
});

export function dangSos(p: Principal, f: { phamVi?: string | null; branchId?: number | null; cnNho?: number | null; q?: string | null } = {}): TrangSos {
  const vai = vaiXemHocVien(p.roleKeys);
  /* Admin chỉ hai góc Tất cả · Cần làm (mockup 3 v2 §9 — Admin không làm Case): máy chủ chặn cùng giao diện. */
  if (vai === 'admin' || !can(p, PERMISSIONS.CASE_VIEW, { anyScope: true })) throw forbidden('Đang SOS dành cho người theo dõi Case.');
  const homNay = demoToday();
  /* TVV mặc định "HV của tôi", CX mọi chi nhánh — như trang TVV / CX (OV-10b). */
  const muon = f.phamVi ?? (vai === 'tvv' ? 'cua-toi' : vai === 'cx' && !f.branchId ? 'tat-ca' : null);
  const { dangDung, chiNhanh, phanCong } = phamViTrang(p, { ...f, phamVi: muon }, homNay);

  /* SL2 (9.1-4): MỘT tập — `hv-sos-hien-tai` (cùng quyền `attempt.view`) giao phạm vi trang; lớp của dòng = lớp em ĐANG học (cùng cách chia cột SOS Tổng quan). */
  const sos = metricSet(p, 'hv-sos-hien-tai', { branchId: dangDung === 'chi-nhanh' ? chiNhanh : null });
  const lop = lopCuaTap('hoc-vien', sos.ids);
  let ids = sos.ids;
  if (dangDung === 'toi') {
    const lopToi = new Set(phanCong.map((a) => a.classId));
    ids = ids.filter((id) => lopToi.has(lop.get(id)?.classId ?? -1));
  }
  if (dangDung === 'cua-toi') {
    const cuaToi = new Set((db().prepare('SELECT id FROM students WHERE consultant_user_id = ?').all(p.userId) as any[]).map((r) => r.id as number));
    ids = ids.filter((id) => cuaToi.has(id));
  }
  const em = thongTinEm(ids);
  const q = (f.q ?? '').trim().toLowerCase();
  const qMa = chuanHoaMaLop(f.q ?? '');
  if (q) ids = ids.filter((id) => (em.get(id)?.ten ?? '').toLowerCase().includes(q) || (em.get(id)?.ma ?? '').toLowerCase().includes(q)
    || (!!qMa && chuanHoaMaLop(lop.get(id)?.code ?? '').includes(qMa)));
  /* Lượt của dòng = CHÍNH lượt hàm SOS đã chọn (đợt mới nhất hợp lệ, nhớ trong request). */
  const luot = latestAttempts(ids, 'valid', homNay);
  const tam = new Set(sos.splits?.tamThoi ?? []);
  const lopIds = [...new Set(ids.map((id) => lop.get(id)?.classId).filter((x): x is number => !!x))];
  const cn = new Map<number, { branchId: number; ten: string | null }>();
  theoLo(lopIds, (lo, ph) => {
    for (const r of db().prepare(`SELECT c.id, c.branch_id, b.name FROM classes c LEFT JOIN branches b ON b.id = c.branch_id WHERE c.id IN (${ph})`).all(...lo) as any[]) {
      cn.set(r.id, { branchId: r.branch_id, ten: r.name ?? null });
    }
  });

  /* Case của các lượt: Case sinh từ lượt (`sc.attempt_id`, như Tổng hợp) + Case cũ còn mở trượt LẠI ở lượt này (mốc `repeat`). */
  const idLuot = new Set([...luot.values()].map((a) => a.attemptId));
  const lapLai = new Map<number, number[]>();
  theoLo([...idLuot], (lo, ph) => {
    for (const r of db().prepare(`SELECT case_id, attempt_id FROM case_milestones WHERE kind = 'repeat' AND attempt_id IN (${ph})`).all(...lo) as any[]) {
      lapLai.set(r.attempt_id, [...(lapLai.get(r.attempt_id) ?? []), r.case_id]);
    }
  });
  const caseLapLai = new Set([...lapLai.values()].flat());
  /* ponytail: Case lấy theo chi nhánh lớp em ĐANG học — em vừa chuyển chi nhánh thì Case của lượt ở chi nhánh cũ không hiện trong dòng (panel một em vẫn đủ). */
  const cases = [...new Set([...cn.values()].map((x) => x.branchId))]
    .flatMap((b) => listCases(p, { branchId: b }).rows)
    .filter((c) => (c.attemptId !== null && idLuot.has(c.attemptId)) || caseLapLai.has(c.id));
  const tt = tomTatCase(cases);

  const rows: DongSos[] = ids.flatMap((id) => {
    const a = luot.get(id);
    const l = lop.get(id);
    if (!a || !l?.classId) return [];
    const e = em.get(id);
    const cuaLuot = [...tt.values()].filter((c) => c.attemptId === a.attemptId || (lapLai.get(a.attemptId) ?? []).includes(c.id));
    return [{
      attemptId: a.attemptId, studentId: id, ten: e?.ten ?? '', ma: e?.ma ?? '', classId: l.classId, classCode: l.code ?? '',
      branchName: cn.get(l.classId)?.ten ?? null, ft: !!l.isFt,
      ...sosCuaLuot(a),
      tam: tam.has(id), cases: cuaLuot, tvv: e?.tvv ?? null, lienHe: e?.lienHe ?? { phone: null, parentName: null, parentRelation: null, parentPhone: null },
    }];
  }).sort((a, b) => b.sosLevel - a.sosLevel || a.ten.localeCompare(b.ten, 'vi'));
  return { phamVi: dangDung, rows };
}

/**
 * PANEL MỘT EM (mockup panel v3 §9): mọi Case của em người xem được thấy (Case còn mở trước, Case xong sau), tóm tắt cùng hàm với bảng Đang SOS.
 * Việc của người xem trên từng Case: web đọc `/my-work` (cùng nguồn Công việc) — máy chủ không dựng lần hai.
 */
export function panelMotEm(p: Principal, studentId: number) {
  if (!can(p, PERMISSIONS.STUDENT_VIEW, { studentId })) throw forbidden('Bạn không xem được học viên này.');
  const s = db().prepare(
    `SELECT s.id, s.full_name, s.student_code, c.id AS lop_id, c.code AS lop_code, c.is_fast_track
       FROM students s
       LEFT JOIN enrollments e ON e.id = (SELECT x.id FROM enrollments x WHERE x.student_id = s.id ORDER BY x.status IN ('active', 'paused') DESC, x.id DESC LIMIT 1)
       LEFT JOIN classes c ON c.id = e.class_id
      WHERE s.id = ?`,
  ).get(studentId) as any;
  if (!s) throw forbidden('Bạn không xem được học viên này.');
  const em = thongTinEm([studentId]).get(studentId)!;
  const ds = can(p, PERMISSIONS.CASE_VIEW, { studentId }) ? listCases(p, { studentId, kemTam: true }).rows : [];   // OV-13a: panel một em hiện cả Case tạm
  const tt = tomTatCase(ds);
  const cases = [...tt.values()].sort((a, b) => Number(a.done) - Number(b.done) || (b.attemptNo ?? 0) - (a.attemptNo ?? 0) || b.id - a.id);
  const st = standingFor([studentId]).get(studentId);
  const chip = st ? chipSosTuKetQua(st) : null;
  /* PANEL-RIENG (B5, mockup `.em-dau .gt`): hàng Lớp · Target · TVV · Thi — lộ trình mới nhất của em (+1 câu, 1 dòng). Lịch thi cùng hàm đầu hồ sơ (`trangThaiLichThi`). */
  const lt = db().prepare(
    `SELECT c.target_score, c.khong_cam_ket, c.exam_date, c.exam_month, c.exam_period_id, c.thi_that_ngay, pr.code AS exam_week_code, pr.week_start AS exam_week_start
       FROM learning_cycles c LEFT JOIN report_periods pr ON pr.id = c.exam_period_id
      WHERE c.student_id = ? ORDER BY (c.status = 'active') DESC, c.seq DESC LIMIT 1`,
  ).get(studentId) as any;
  const lich = lt ? trangThaiLichThi(lt, examPlanOf(lt), demoToday()) : null;
  return {
    em: { id: s.id as number, ten: s.full_name as string, ma: s.student_code as string, lop: s.lop_id ? { id: s.lop_id as number, code: s.lop_code as string, ft: !!s.is_fast_track } : null,
      tvv: em.tvv, lienHe: em.lienHe,
      target: lt ? (lt.target_score != null ? `${Number(lt.target_score).toFixed(1)}${lt.khong_cam_ket ? ' KCK' : ''}` : lt.khong_cam_ket ? 'KCK' : null) : null,
      lichThi: lich && lich.trangThai !== 'chua-co' ? lich : null },
    /* Dòng 2 đầu panel: lượt gần nhất · SOS (không mã HV — panel v3 "Đã lược bỏ"). PANEL-MC (B5): + tạm, kỹ năng hụt, số cho hộp "Vì sao SOS" (CÙNG `chipSosTuKetQua` của bảng). */
    luot: st ? { nhan: st.attemptLabel, sosLevel: st.sosLevel ?? null, tam: st.provisional, kyNang: chip?.kyNang ?? [], soLieu: chip?.soLieu ?? [] } : null,
    /* PANEL-MC (B5): dòng điểm của lượt gần nhất (`standingFor` đã gọi — 0 câu). */
    diem: st ? diemTuStanding(st) : null,
    cases,
    /* OV-13q: dòng "Đã thi · chờ kết quả · hạn …" + nút Nhập kết quả / Chọn bước tiếp / Gia hạn (cùng hàm với việc Công việc). */
    sauThi: sauThiCuaEm(p, studentId),
  };
}
