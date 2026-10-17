/**
 * HỌC VIÊN & LỚP · "ĐANG SOS" THEO TUẦN THI + PANEL MỘT EM (OV-12f, đặc tả OV-12 mục 3.5 / 7.9, mockup 3 v2 + panel v3 §9).
 *
 * Đang SOS tuần X = lượt MT (Fast Track) / Progress Test (lớp thường) thi tuần X bị SOS — kể cả Case đã xong; PA + kết quả là tình trạng
 * HÔM NAY. Phân loại lượt đi qua ĐÚNG `phanLoaiCacLuot` của bảng Tổng hợp → số em tuần X = số lượt SOS ở Tổng hợp cùng tuần theo cấu tạo.
 * Lớp thường: nhãn SOS theo số môn trượt (1 → SOS 1, 2 → SOS 2, ≥ 3 → SOS 3 — chủ SP 14/10).
 * Phạm vi: quyền xem lượt (`attempt.view`) + Phạm vi của trang (Lớp tôi dạy · HV của tôi · Chi nhánh · Tất cả). Case: `listCases` (lọc quyền sẵn).
 */
import { db, theoLo } from '../db.ts';
import {
  NHOM_THEO_COT, PERMISSIONS, mondayOfDate, tenPaGon, outcomeLabelFor, tuDauKhoang, vaiXemHocVien, chuanHoaMaLop,
  type LienHe, type NhomXuLy, type PhamVi,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, forbidden } from '../util.ts';
import { can, classScopeSql, scopeFor, type Principal } from '../permissions.ts';
import { luotTrongKhoang, phanLoaiCacLuot } from '../phanTich/tongHop.ts';
import { listCases, type MappedCase } from '../cases/cases.ts';
import { chiTietCaseMo } from '../cases/caseLop.ts';
import { xuLyCaseMany } from '../cases/sosState.ts';
import { phamViTrang } from './hocVienLop.ts';
import { standingFor } from '../students/standing.ts';
import { sauThiCuaEm } from '../loTrinh/thiThat.ts';

/** "Toàn bộ" = 8 tuần gần nhất (mockup 3 v2 §3b), cùng khoảng mặc định của Tổng hợp. */
export const SO_TUAN_SOS = 8;

export type CaseTomTat = {
  id: number; topic: string | null; kyNang: string | null;
  nguyenNhan: string | null; nhanXet: string | null;
  pa: { id: number; ten: string; nguoi: string | null; choXacNhan: boolean; xong: boolean }[];
  /** Kết quả PA gần nhất (tình trạng tới hôm nay) — chữ 5 mức + ngày ghi. */
  ketQua: string | null; ketQuaNgay: string | null;
  nhom: NhomXuLy; trangThai: string;
  viecTiep: { chu: string; han: string | null; loaiHan: string | null; quaHan: boolean } | null;
  /** Lượt sinh / lặp Case — panel ghép Case với lượt SOS ("MT2"). */
  attemptId: number | null; attemptNo: number | null; done: boolean;
};
export type DongSos = {
  attemptId: number; studentId: number; ten: string; ma: string; classId: number; classCode: string; branchName: string | null; ft: boolean;
  luot: string; tuan: string; sosLevel: number; kyNang: string[];
  cases: CaseTomTat[]; tvv: string | null; lienHe: LienHe;
};
export type TrangSos = { tuan: string | null; toanBo: boolean; tuanGanNhat: string; tu: string; den: string; tuanCo: string[]; phamVi: PhamVi; rows: DongSos[] };

const LA_SOS = new Set(['sos1', 'sos2', 'sos3', 'gk-1', 'gk-2']);

/** Tóm tắt Case cho bảng / panel — một nguồn (`chiTietCaseMo`, cùng luật trạng thái V4 + việc tiếp của hồ sơ lớp). */
function tomTatCase(cases: readonly MappedCase[]): Map<number, CaseTomTat> {
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
      viecTiep: x.viecTiep ? { chu: x.viecTiep.chu, han: x.viecTiep.han, loaiHan: x.viecTiep.loaiHan, quaHan: !!x.viecTiep.han && x.viecTiep.han < homNay } : null,
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

export function dangSos(p: Principal, f: { tuan?: string | null; phamVi?: string | null; branchId?: number | null; cnNho?: number | null; q?: string | null } = {}): TrangSos {
  const vai = vaiXemHocVien(p.roleKeys);
  /* Admin chỉ hai góc Tất cả · Cần làm (mockup 3 v2 §9 — Admin không làm Case): máy chủ chặn cùng giao diện. */
  if (vai === 'admin' || !can(p, PERMISSIONS.CASE_VIEW, { anyScope: true })) throw forbidden('Đang SOS dành cho người theo dõi Case.');
  const homNay = demoToday();
  const tu = tuDauKhoang(homNay, SO_TUAN_SOS);
  const den = mondayOfDate(homNay);
  /* TVV mặc định "HV của tôi", CX mọi chi nhánh — như trang TVV / CX (OV-10b). */
  const muon = f.phamVi ?? (vai === 'tvv' ? 'cua-toi' : vai === 'cx' && !f.branchId ? 'tat-ca' : null);
  const { dangDung, chiNhanh, phanCong } = phamViTrang(p, { ...f, phamVi: muon }, homNay);

  const cs = classScopeSql(scopeFor(p, PERMISSIONS.ATTEMPT_VIEW));
  const where = [cs.sql, `a.status != 'cancelled'`, `a.kind IN ('mock', 'progress')`, 'rp.week_start >= ?', 'rp.week_start <= ?'];
  const args: unknown[] = [...cs.params, tu, den];
  if (dangDung === 'chi-nhanh' && chiNhanh) { where.push('c.branch_id = ?'); args.push(chiNhanh); }
  if (dangDung === 'toi') {
    const lop = [...new Set(phanCong.map((a) => a.classId))];
    where.push(lop.length ? `c.id IN (${lop.map(() => '?').join(',')})` : '1=0'); args.push(...lop);
  }
  if (dangDung === 'cua-toi') { where.push('a.student_id IN (SELECT id FROM students WHERE consultant_user_id = ?)'); args.push(p.userId); }
  const luot = luotTrongKhoang(where.join(' AND '), args);
  const pl = phanLoaiCacLuot(luot);

  /*
   * OV-14b (rà UX 17/10): mặc định Toàn bộ 8 tuần — một tuần ẩn em SOS các tuần khác. `tuanGanNhat` = tuần thi gần nhất ĐÃ QUA có lượt đã chấm
   * (không có thì tuần này) — đích của nút ‹ / bỏ "Toàn bộ". Định nghĩa SOS theo tuần thi giữ nguyên (chủ SP 14/10).
   */
  const daCham = luot.filter((a) => pl.has(a.id));
  const toanBo = !f.tuan || f.tuan === 'tat-ca';
  if (f.tuan && !toanBo && !/^\d{4}-\d{2}-\d{2}$/.test(f.tuan)) throw badRequest('Tuần thi không hợp lệ.');
  const tuanGanNhat = daCham.reduce<string | null>((m, a) => (a.week_start < den && (!m || a.week_start > m) ? a.week_start : m), null) ?? den;
  const tuan = toanBo ? null : mondayOfDate(f.tuan!);

  const sosLuot = daCham.filter((a) => LA_SOS.has(pl.get(a.id)!.loai));
  const tuanCo = [...new Set(sosLuot.map((a) => a.week_start as string))].sort().reverse();
  const em = thongTinEm(sosLuot.map((a) => a.student_id));
  const q = (f.q ?? '').trim().toLowerCase();
  const qMa = chuanHoaMaLop(f.q ?? '');
  const chon = sosLuot.filter((a) => (toanBo || a.week_start === tuan) && (!q || (em.get(a.student_id)?.ten ?? '').toLowerCase().includes(q)
    || (em.get(a.student_id)?.ma ?? '').toLowerCase().includes(q) || (!!qMa && chuanHoaMaLop(a.class_code ?? '').includes(qMa))));

  /* Case của các lượt: Case sinh từ lượt (`sc.attempt_id`, như Tổng hợp) + Case cũ còn mở trượt LẠI ở lượt này (mốc `repeat`). */
  const idLuot = new Set(chon.map((a) => a.id as number));
  const lapLai = new Map<number, number[]>();
  theoLo([...idLuot], (lo, ph) => {
    for (const r of db().prepare(`SELECT case_id, attempt_id FROM case_milestones WHERE kind = 'repeat' AND attempt_id IN (${ph})`).all(...lo) as any[]) {
      lapLai.set(r.attempt_id, [...(lapLai.get(r.attempt_id) ?? []), r.case_id]);
    }
  });
  const caseLapLai = new Set([...lapLai.values()].flat());
  const cases = [...new Set(chon.map((a) => a.branch_id as number))]
    .flatMap((b) => listCases(p, { branchId: b }).rows)
    .filter((c) => (c.attemptId !== null && idLuot.has(c.attemptId)) || caseLapLai.has(c.id));
  const tt = tomTatCase(cases);

  const rows: DongSos[] = chon.map((a) => {
    const x = pl.get(a.id)!;
    const ft = !!a.is_fast_track;
    const e = em.get(a.student_id);
    const cuaLuot = [...tt.values()].filter((c) => c.attemptId === a.id || (lapLai.get(a.id) ?? []).includes(c.id));
    return {
      attemptId: a.id, studentId: a.student_id, ten: e?.ten ?? '', ma: e?.ma ?? '', classId: a.class_id, classCode: a.class_code, branchName: a.branch_name ?? null, ft,
      luot: ft ? `MT${a.attempt_no}` : 'Progress', tuan: a.week_start,
      /* Lớp thường: SOS theo số môn trượt (chủ SP 14/10). */
      sosLevel: ft ? x.sosLevel ?? 1 : Math.min(3, x.kyNangDuoi.length),
      kyNang: x.kyNangDuoi, cases: cuaLuot, tvv: e?.tvv ?? null, lienHe: e?.lienHe ?? { phone: null, parentName: null, parentRelation: null, parentPhone: null },
    };
  }).sort((a, b) => (a.tuan === b.tuan ? a.ten.localeCompare(b.ten, 'vi') : a.tuan < b.tuan ? 1 : -1));
  return { tuan, toanBo, tuanGanNhat, tu, den, tuanCo, phamVi: dangDung, rows };
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
  return {
    em: { id: s.id as number, ten: s.full_name as string, ma: s.student_code as string, lop: s.lop_id ? { id: s.lop_id as number, code: s.lop_code as string, ft: !!s.is_fast_track } : null,
      tvv: em.tvv, lienHe: em.lienHe },
    /* Dòng 2 đầu panel: lượt gần nhất · SOS (không mã HV — panel v3 "Đã lược bỏ"). */
    luot: st ? { nhan: st.attemptLabel, sosLevel: st.sosLevel ?? null } : null,
    cases,
    /* OV-13q: dòng "Đã thi · chờ kết quả · hạn …" + nút Nhập kết quả / Chọn bước tiếp / Gia hạn (cùng hàm với việc Công việc). */
    sauThi: sauThiCuaEm(p, studentId),
  };
}
