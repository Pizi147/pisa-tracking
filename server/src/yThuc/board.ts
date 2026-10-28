import { db, theoLo } from '../db.ts';
import {
  NHOM_EM, PERMISSIONS, XU_LY_STATUS_LABEL, hanBaoPhHieuLuc, kindCuaBac, nhanLoaiXuLy,
  type NhomEm, type TrangThaiVp,
} from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { notFound } from '../util.ts';
import { requireViewClass } from './access.ts';
import { emCuaLop, trangThaiYThuc, type EmYThuc } from './trangThai.ts';
import { violationsOfStudents } from './violations.ts';
import { coTheGhi, nhanTrangThaiBaoPh } from './baoPhTvv.ts';
import { khoangTamDung } from '../students/tamDung.ts';

/**
 * TAB Ý THỨC CỦA LỚP — HAI KHUNG (mockup M6, K2-38, PR-YT4).
 *
 *   Khung trái "Xử lý": em ĐANG HỌC ở lớp, mỗi em đúng MỘT nhóm (`nhomEm`): Quá hạn › Bắt buộc xử lý › Chờ QL duyệt › Mới, chưa ghi nhận
 *   › Đã xử lý (7 ngày). Nhóm rỗng thì giao diện không vẽ.
 *   Khung phải "Vi phạm": dòng thời gian cả lớp (vi phạm + lần xử lý, mới nhất trước, có tên em). Chọn em → giao diện gọi
 *   `/students/:id/y-thuc` (thang + vi phạm của riêng em).
 *
 * Mọi nhãn, hạn, nhóm đọc từ `trangThaiYThuc()` — không đếm riêng. Vấn đề Ý thức đi theo em sang lớp mới (chủ sản phẩm 21/09).
 */

export type DongEm = {
  studentId: number; ten: string; maHv: string;
  bac: number; bacNhan: string | null;
  keTiep: { kind: string; nhan: string };
  /** Vi phạm chưa nằm trong lần xử lý nào (Mới · Đã ghi nhận · Cần xử lý · Quá hạn). */
  soMo: number; soBatBuoc: number; soMoi: number;
  han: string | null; hanXem: string | null; quaHanNgay: number | null;
  /** Nhóm Mới: số ngày từ ngày ghi vi phạm Mới cũ nhất (đổi tone khi ≥ 4 ngày). */
  moiTuoi: number | null;
  deXuat: { id: number; nhan: string; status: 'cho_duyet' | 'da_duyet'; han: string | null } | null;
  xuLyGanNhat: { id: number; nhan: string; ngay: string } | null;
  /** PR-UXF-b (VN26): Quản lý ĐÃ TỪ CHỐI đề xuất mà vi phạm còn mở của em đi kèm — em về "bắt buộc xử lý" vì lý do này, không phải vì ≥ 3 vi phạm / 2 tuần. */
  tuChoi: { id: number; nhan: string } | null;
  /**
   * UI-Y-THUC-LOP (mockup V5 `lop-y-thuc-*`, brief 22/10 mục 10) — bốn khối nghĩa của một hàng em:
   *  · `viPhamCho`: vi phạm còn chờ (Mới · Cần xử lý · Quá hạn), cũ nhất trước. Chỉ `bangYThucLop` điền (một câu cho cả lớp).
   *  · `thuHoi`: lần xử lý đang xin thu hồi (`cho`, chờ QL) hoặc lần đã thu hồi mới hơn lần xử lý gần nhất (luật 5 — giữ dòng, lịch sử).
   *  · `baoPh`: việc Báo PH mới nhất của em (TVV) — trạng thái đọc cùng tên với panel (`nhanTrangThaiBaoPh`).
   */
  viPhamCho: { id: number; ngay: string; ten: string; trangThai: TrangThaiVp }[];
  thuHoi: { id: number; nhan: string; cho: boolean } | null;
  baoPh: { id: number; nhan: string; han: string; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string; quaHan: boolean; ngayXong: string | null; coTheGhi: boolean } | null;
};

export type DongThoiGianYt =
  | { loai: 'vi-pham'; id: number; studentId: number; ten: string; ngay: string; nhom: string; category: string; mon: string | null;
      /** PR-LUI-a1: dòng chính = ô `Vi phạm` (ngắn); mô tả đầy đủ chỉ hiện khi mở dòng (`ChiTietViPham`). */
      viPham: string; trangThai: TrangThaiVp; nhanTrangThai: string; han: string | null; nguoiGhi: string | null }
  | { loai: 'xu-ly'; id: number; studentId: number; ten: string; ngay: string; nhan: string; kind: string; status: string;
      statusLabel: string; soViPham: number; nguoi: string | null; soTep: number };

export type BangYThucLop = {
  classId: number; classCode: string; homNay: string;
  canManage: boolean; canRecord: boolean;
  nhom: Record<NhomEm, DongEm[]>;
  dongThoiGian: DongThoiGianYt[];
  /** UI-Y-THUC-LOP: em không còn việc Ý thức nào (nhóm rỗng) nhưng TVV chưa báo PH xong — hàng "Chờ TVV báo PH". */
  choBaoPh: DongEm[];
};

const DONG_THOI_GIAN_TOI_DA = 150;
const ngayCach = (tu: string, den: string) => Math.round((Date.parse(`${den}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / 86_400_000);

export function dongEm(em: EmYThuc, ten: string, maHv: string, homNay: string): DongEm {
  const viPham = [...em.viPham.entries()];
  const moiNgay = em.dsViPham.filter((v) => { const t = em.viPham.get(v.id); return t?.t === 'moi' || t?.lyDoQuaHan === 'xem'; })
    .map((v) => v.reportedOn).sort()[0] ?? null;
  const xong = em.xuLy.filter((m) => m.status === 'done' && m.performedOn).sort((a, b) => (b.performedOn ?? '').localeCompare(a.performedOn ?? ''))[0];
  const dangMo = new Set(viPham.filter(([, t]) => t.t !== 'da_xu_ly').map(([id]) => id));
  const thuHoi = em.thuHoi.slice().sort((a, b) => (b.quyetLuc ?? b.createdAt).localeCompare(a.quyetLuc ?? a.createdAt))[0];
  const tuChoi = em.xuLy.filter((m) => m.status === 'tu_choi' && m.violationIds.some((id) => dangMo.has(id)))
    .sort((a, b) => (b.quyetLuc ?? b.createdAt).localeCompare(a.quyetLuc ?? a.createdAt))[0];
  return {
    studentId: em.studentId, ten, maHv, bac: em.bac, bacNhan: em.bac > 0 ? nhanLoaiXuLy(kindCuaBac(em.bac)) : null,
    keTiep: { kind: em.keTiep.kind, nhan: nhanLoaiXuLy(em.keTiep.kind) },
    soMo: viPham.filter(([, t]) => t.t === 'moi' || t.t === 'da_ghi_nhan' || t.t === 'can_xu_ly' || t.t === 'qua_han').length,
    soBatBuoc: em.soBatBuoc, soMoi: em.soMoi, han: em.han, hanXem: em.hanXem,
    quaHanNgay: Math.max(0, ...viPham.map(([, t]) => t.quaHanNgay ?? 0)) || null,
    moiTuoi: moiNgay ? ngayCach(moiNgay, homNay) : null,
    deXuat: em.deXuat ? { id: em.deXuat.id, nhan: nhanLoaiXuLy(em.deXuat.kind, em.deXuat.customName), status: em.deXuat.status, han: em.deXuat.han } : null,
    xuLyGanNhat: xong ? { id: xong.id, nhan: nhanLoaiXuLy(xong.kind, xong.customName), ngay: xong.performedOn! } : null,
    tuChoi: tuChoi ? { id: tuChoi.id, nhan: nhanLoaiXuLy(tuChoi.kind, tuChoi.customName) } : null,
    viPhamCho: [],
    thuHoi: thuHoi && (!xong || (thuHoi.quyetLuc ?? thuHoi.createdAt).slice(0, 10) >= xong.performedOn!)
      ? { id: thuHoi.id, nhan: nhanLoaiXuLy(thuHoi.kind, thuHoi.customName), cho: false } : null,
    baoPh: null,
  };
}

/**
 * Dòng thời gian trộn (vi phạm + lần xử lý, mới nhất trước) của các em — dùng chung tab lớp (cả lớp) và tab HV (một em).
 * `chiTrongChuoi`: chỉ vi phạm / lần xử lý thuộc chuỗi thang hiện tại của em (phạm vi mặc định của tab HV).
 */
export function dongThoiGian(emIds: readonly number[], trang: Map<number, EmYThuc>, o: { gioiHan?: number; chiTrongChuoi?: boolean } = {}): DongThoiGianYt[] {
  if (!emIds.length) return [];
  const conn = db();
  const ten = new Map<number, string>();
  for (let i = 0; i < emIds.length; i += 400) {
    const lo = emIds.slice(i, i + 400);
    for (const r of conn.prepare(`SELECT id, full_name FROM students WHERE id IN (${lo.map(() => '?').join(',')})`).all(...lo) as any[]) ten.set(r.id, r.full_name);
  }
  const trongChuoi = (sid: number, cycleId: number | null) => {
    if (!o.chiTrongChuoi) return true;
    const em = trang.get(sid);
    return !em || !em.chuoi.length || (cycleId != null && em.chuoi.includes(cycleId));
  };
  const out: DongThoiGianYt[] = [];
  for (const v of violationsOfStudents(emIds)) {
    if (!trongChuoi(v.studentId, v.cycleId)) continue;
    out.push({
      loai: 'vi-pham', id: v.id, studentId: v.studentId, ten: v.studentName, ngay: v.occurredOn, nhom: v.categoryLabel, category: v.category,
      mon: v.skillLabel, viPham: v.ten, trangThai: v.trangThai, nhanTrangThai: v.nhanTrangThai, han: v.han, nguoiGhi: v.reportedByName,
    });
  }
  /* LUAT-5: lần "Đã thu hồi" vẫn hiện (giữ dòng + lịch sử) — chỉ ở đây, không vào số nào. */
  const xuLy = emIds.flatMap((sid) => { const em = trang.get(sid); return [...(em?.xuLy ?? []), ...(em?.thuHoi ?? [])].filter((m) => trongChuoi(sid, m.cycleId)).map((m) => ({ sid, m })); });
  const phu = new Map<number, { nguoi: string | null; soTep: number }>();
  const mIds = xuLy.map((x) => x.m.id);
  for (let i = 0; i < mIds.length; i += 400) {
    const lo = mIds.slice(i, i + 400);
    for (const r of conn.prepare(
      `SELECT m.id, COALESCE(m.performer_name, pu.full_name) AS nguoi,
              (SELECT COUNT(*) FROM attachments a WHERE a.owner_type = 'discipline_measure' AND a.owner_id = m.id) AS so_tep
         FROM discipline_measures m LEFT JOIN users pu ON pu.id = m.performed_by WHERE m.id IN (${lo.map(() => '?').join(',')})`,
    ).all(...lo) as any[]) phu.set(r.id, { nguoi: r.nguoi ?? null, soTep: r.so_tep });
  }
  for (const { sid, m } of xuLy) {
    out.push({
      loai: 'xu-ly', id: m.id, studentId: sid, ten: ten.get(sid) ?? '', ngay: (m.performedOn ?? m.quyetLuc ?? m.createdAt).slice(0, 10),
      nhan: nhanLoaiXuLy(m.kind, m.customName), kind: m.kind, status: m.status,
      statusLabel: (XU_LY_STATUS_LABEL as Record<string, string>)[m.status] ?? m.status,
      soViPham: m.violationIds.length, nguoi: phu.get(m.id)?.nguoi ?? null, soTep: phu.get(m.id)?.soTep ?? 0,
    });
  }
  out.sort((a, b) => b.ngay.localeCompare(a.ngay) || (a.loai === b.loai ? b.id - a.id : a.loai === 'xu-ly' ? -1 : 1));
  return o.gioiHan ? out.slice(0, o.gioiHan) : out;
}

export function bangYThucLop(p: Principal, classId: number, homNay = demoToday()): BangYThucLop {
  const cls = db().prepare('SELECT id, code FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  requireViewClass(p, classId);
  const ids = emCuaLop(classId);
  const trang = trangThaiYThuc(ids, homNay);
  const info = new Map<number, { ten: string; ma: string }>();
  for (let i = 0; i < ids.length; i += 400) {
    const lo = ids.slice(i, i + 400);
    for (const r of db().prepare(`SELECT id, full_name, student_code FROM students WHERE id IN (${lo.map(() => '?').join(',')})`).all(...lo) as any[]) {
      info.set(r.id, { ten: r.full_name, ma: r.student_code });
    }
  }
  const nhom = Object.fromEntries(NHOM_EM.map((k) => [k, [] as DongEm[]])) as Record<NhomEm, DongEm[]>;
  const baoPh = baoPhMoiNhat(p, ids, homNay);
  const choBaoPh: DongEm[] = [];
  const dongCuaEm = new Map<number, DongEm>();
  for (const id of ids) {
    const em = trang.get(id)!;
    const bp = baoPh.get(id) ?? null;
    if (!em.nhom && bp?.trangThai !== 'mo') continue;
    const dong = { ...dongEm(em, info.get(id)?.ten ?? '', info.get(id)?.ma ?? '', homNay), baoPh: bp };
    dongCuaEm.set(id, dong);
    (em.nhom ? nhom[em.nhom] : choBaoPh).push(dong);
  }
  /* Vi phạm còn chờ của các em có hàng — một lần đọc (cùng cửa trạng thái với dòng thời gian). */
  const vps = violationsOfStudents([...dongCuaEm.keys()]);
  for (const v of vps.sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id - b.id)) {
    if (v.trangThai === 'moi' || v.trangThai === 'can_xu_ly' || v.trangThai === 'qua_han') {
      dongCuaEm.get(v.studentId)?.viPhamCho.push({ id: v.id, ngay: v.occurredOn, ten: v.ten, trangThai: v.trangThai });
    }
  }
  /* Luật 5: lần xử lý đang xin thu hồi (thẻ chờ QL) — lần đó vẫn tính tới khi QL duyệt. */
  const mIds = [...dongCuaEm.values()].flatMap((x) => [x.xuLyGanNhat?.id, x.deXuat?.id]).filter((x): x is number => !!x);
  const dangXin = new Set<number>();
  theoLo(mIds, (lo, ph) => {
    for (const r of db().prepare(`SELECT doi_tuong_id FROM yeu_cau_duyet WHERE loai = 'thu_hoi_y_thuc' AND trang_thai = 'cho' AND doi_tuong_id IN (${ph})`).all(...lo) as any[]) dangXin.add(r.doi_tuong_id);
  });
  for (const x of dongCuaEm.values()) {
    const m = x.xuLyGanNhat && dangXin.has(x.xuLyGanNhat.id) ? x.xuLyGanNhat : x.deXuat && dangXin.has(x.deXuat.id) ? x.deXuat : null;
    if (m) x.thuHoi = { id: m.id, nhan: m.nhan, cho: true };
  }
  const theoHan = (a: DongEm, b: DongEm) => (a.han ?? a.hanXem ?? a.deXuat?.han ?? '9').localeCompare(b.han ?? b.hanXem ?? b.deXuat?.han ?? '9')
    || a.ten.localeCompare(b.ten, 'vi');
  for (const k of NHOM_EM) nhom[k].sort(k === 'da_xu_ly' ? (a, b) => (b.xuLyGanNhat?.ngay ?? '').localeCompare(a.xuLyGanNhat?.ngay ?? '') : theoHan);
  return {
    classId, classCode: cls.code, homNay,
    canManage: can(p, PERMISSIONS.DISCIPLINE_MANAGE, { classId }),
    canRecord: can(p, PERMISSIONS.VIOLATION_RECORD, { classId }),
    nhom,
    dongThoiGian: dongThoiGian(ids, trang, { gioiHan: DONG_THOI_GIAN_TOI_DA }),
    choBaoPh: choBaoPh.sort((a, b) => (a.baoPh?.han ?? '').localeCompare(b.baoPh?.han ?? '') || a.ten.localeCompare(b.ten, 'vi')),
  };
}

/** Việc Báo PH MỚI NHẤT của mỗi em (một câu cho cả lớp) — hạn hiệu lực trừ ngày tạm dừng như panel TVV. */
function baoPhMoiNhat(p: Principal, ids: readonly number[], homNay: string): Map<number, NonNullable<DongEm['baoPh']>> {
  const out = new Map<number, NonNullable<DongEm['baoPh']>>();
  const khoang = khoangTamDung(ids);
  theoLo(ids, (lo, ph) => {
    for (const r of db().prepare(
      `SELECT v.id, v.student_id, v.nhan, v.han, v.trang_thai, s.consultant_user_id, m.kind AS m_kind, m.custom_name AS m_custom,
              (SELECT COUNT(*) FROM viec_bao_ph_lan l WHERE l.viec_id = v.id) AS so_lan,
              (SELECT l.ngay FROM viec_bao_ph_lan l WHERE l.viec_id = v.id AND l.ket_qua = 'da_bao' ORDER BY l.id DESC LIMIT 1) AS ngay_xong
         FROM viec_bao_ph v JOIN students s ON s.id = v.student_id LEFT JOIN discipline_measures m ON m.id = v.measure_id
        WHERE v.id IN (SELECT MAX(id) FROM viec_bao_ph WHERE student_id IN (${ph}) GROUP BY student_id)`,
    ).all(...lo) as any[]) {
      const han = hanBaoPhHieuLuc(r.han, khoang[r.student_id]);
      out.set(r.student_id, {
        id: r.id, nhan: r.m_kind ? nhanLoaiXuLy(r.m_kind, r.m_custom ?? null) : r.nhan, han, trangThai: r.trang_thai,
        nhanTrangThai: nhanTrangThaiBaoPh(r.trang_thai, r.so_lan > 0), quaHan: r.trang_thai === 'mo' && han < homNay, ngayXong: r.ngay_xong ?? null,
        coTheGhi: r.trang_thai === 'mo' && coTheGhi(p, { consultant_user_id: r.consultant_user_id ?? null, student_id: r.student_id }),
      });
    }
  });
  return out;
}
