import { chenNhieuDong, db, tx } from '../db.ts';
import { HV_DANG_HOC_SQL, dongHocVien } from '../students/tamDung.ts';
import {
  NORMAL_LADDER, PERMISSIONS, chuanHoaHuong, nhanHuong, nhanTiepTheo, soSanhLop, trongHaiTuanCuoi,
  type Huong, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { classProgress } from './schedule.ts';
import { standingFor } from '../students/standing.ts';
import { coTheRaLenh } from './quyenChuyenLop.ts';
import { cuoiKhoaTheoHocVien } from '../normal/cuoiKhoa.ts';

/**
 * LỘ TRÌNH TIẾP THEO (PR-LT, Q1, §3.9.1) — dự định của một em SAU lớp đang học, ghi trước khi
 * thật sự chuyển (`luatLoTrinh.ts` mới là nơi CHUYỂN thật). Chỉ áp dụng lớp thường.
 */

type LopDuKien = { id: number; code: string; ma: ProgrammeCode | null; ft: boolean };
type BanGhiLoTrinh = {
  huong: Huong; lopDuKienId: number | null; mucTieu: number | null; thangThi: string | null; ghiChu: string | null;
  /** PR-K26: hẹn xem lại của "Chưa quyết" — tuỳ chọn ở bước này, bắt buộc ở Chuyển tiếp lớp. */
  ngayXemLai: string | null;
};

function enrollmentDangHoc(studentId: number): any {
  return db()
    .prepare(
      `SELECT e.*, c.code, c.programme_code, c.is_fast_track, c.branch_id FROM enrollments e
         JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = ? AND e.status = 'active' LIMIT 1`,
    )
    .get(studentId) as any;
}

function banGhiRowToView(row: any): BanGhiLoTrinh | null {
  if (!row) return null;
  return {
    huong: row.huong as Huong, lopDuKienId: row.lop_du_kien_id ?? null,
    mucTieu: row.muc_tieu ?? null, thangThi: row.thang_thi ?? null, ghiChu: row.ghi_chu ?? null, ngayXemLai: row.ngay_xem_lai ?? null,
  };
}

/** GET /students/:id/lo-trinh-tiep (STUDENT_VIEW). */
export function layLoTrinhTiep(p: Principal, studentId: number) {
  const conn = db();
  const s = conn.prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');

  const enr = enrollmentDangHoc(studentId);
  if (!enr) return { lop: null, banGhi: null, lopDuKien: [] as LopDuKien[], coTheGhi: false, ketQua: null, cuoiKhoa: null };

  const ma = (enr.programme_code ?? null) as ProgrammeCode | null;
  const laLopThuong = !enr.is_fast_track;
  const maKe = laLopThuong ? (NORMAL_LADDER[ma as ProgrammeCode] ?? null) : null;
  const banGhi = banGhiRowToView(
    conn.prepare('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').get(studentId, enr.class_id),
  );
  const coTheGhi = laLopThuong && can(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id });

  const lopDuKien: LopDuKien[] = laLopThuong
    ? (conn
      .prepare(
        `SELECT id, code, programme_code, is_fast_track FROM classes
          WHERE branch_id = ? AND status = 'active' AND id != ?
            AND (programme_code = ? OR programme_code = ? OR is_fast_track = 1)
          ORDER BY code`,
      )
      .all(enr.branch_id, enr.class_id, maKe, ma) as any[])
      .sort((a, b) => soSanhLop({ code: a.code }, { code: b.code }))
      .map((r) => ({ id: r.id, code: r.code, ma: r.programme_code ?? null, ft: !!r.is_fast_track }))
    : [];

  return {
    lop: { id: enr.class_id, code: enr.code, ma, maKe, laLopThuong, dangHoc: true },
    banGhi, lopDuKien, coTheGhi,
    /** B9: kết quả gần nhất của em — đầu panel Lộ trình tiếp theo hiện chính + hai dòng (`ketQuaGanNhat`). */
    ketQua: standingFor([studentId]).get(studentId) ?? null,
    /** PR-LT2b (K2-26): dòng dữ kiện đầu panel — % Cuối khoá, môn trượt, hướng gợi ý (không lưu). */
    cuoiKhoa: laLopThuong ? cuoiKhoaTheoHocVien(enr.class_id, [studentId]).get(studentId) ?? null : null,
  };
}

type GhiVao = {
  huong: string; lopDuKienId?: number | null; mucTieu?: number | null; thangThi?: string | null; ghiChu?: string | null; ngayXemLai?: string | null;
};
/** Lớp đang học của em — đủ cho luật kiểm (chương trình, chi nhánh). */
type LopNguon = { class_id: number; programme_code: string | null; branch_id: number };
type DongGhi = {
  studentId: number; classId: number; ma: ProgrammeCode | null; huong: Huong; lopDuKienId: number | null; mucTieu: number | null;
  thangThi: string | null; ghiChu: string | null; ngayXemLai: string | null;
};
const GHI_CHU_TOI_DA = 500;

/** Lớp dự kiến theo id — MỘT câu cho cả lô. */
function docLopDuKien(ids: readonly (number | null | undefined)[]): Map<number, any> {
  const cac = [...new Set(ids.filter((x): x is number => Number.isInteger(x) && (x as number) > 0))];
  if (!cac.length) return new Map();
  return new Map((db().prepare(
    `SELECT id, programme_code, is_fast_track, branch_id FROM classes WHERE id IN (${cac.map(() => '?').join(',')})`,
  ).all(...cac) as any[]).map((r) => [r.id as number, r]));
}

/**
 * KIỂM một dòng (PR-K26) — không đọc DB: lớp dự kiến đã đọc sẵn (`lopDuKien`). `ngayCu`: ngày xem lại đang lưu — giữ nguyên thì được
 * dù đã qua (dữ liệu cũ), đổi sang ngày mới thì phải từ hôm nay trở đi. Ghi một em và ghi cả lớp dùng chung.
 */
function kiemDong(studentId: number, enr: LopNguon, input: GhiVao, lopDuKien: Map<number, any>, ngayCu: string | null): DongGhi {
  /* Form cũ đang mở còn gửi `chua_ro`/`xep_sau` → `chua_quyet`, không báo lỗi. */
  const huong = chuanHoaHuong(String(input.huong ?? ''));
  if (!huong) throw badRequest('Hướng không hợp lệ.');
  const ngayXemLai = huong === 'chua_quyet' ? (input.ngayXemLai || null) : null;
  if (ngayXemLai && !isIsoDate(ngayXemLai)) throw badRequest('Ngày xem lại không hợp lệ.');
  if (ngayXemLai && ngayXemLai !== ngayCu && ngayXemLai < demoToday()) throw badRequest('Ngày xem lại phải từ hôm nay trở đi.');
  const mucTieu = input.mucTieu ?? null;
  if (mucTieu !== null && (typeof mucTieu !== 'number' || mucTieu < 0 || mucTieu > 9)) throw badRequest('Target phải từ 0 đến 9.');
  const ghiChu = typeof input.ghiChu === 'string' ? input.ghiChu.trim() || null : null;
  if (ghiChu && ghiChu.length > GHI_CHU_TOI_DA) throw badRequest(`Ghi chú tối đa ${GHI_CHU_TOI_DA} ký tự.`);

  const lopDuKienId = input.lopDuKienId || null;
  if (lopDuKienId) {
    const lop = lopDuKien.get(lopDuKienId);
    if (!lop || lop.branch_id !== enr.branch_id) throw badRequest('Không tìm thấy lớp dự kiến.');
    const maKe = NORMAL_LADDER[(enr.programme_code ?? null) as ProgrammeCode] ?? null;
    if (huong === 'len_lop' && (lop.is_fast_track || lop.programme_code !== maKe)) throw badRequest('Lớp dự kiến phải là chương trình kế tiếp.');
    if (huong === 'hoc_lai' && (lop.is_fast_track || lop.programme_code !== enr.programme_code)) {
      throw badRequest('Lớp dự kiến phải cùng chương trình để học lại.');
    }
    if (huong === 'fast_track' && !lop.is_fast_track) throw badRequest('Lớp dự kiến phải là Fast Track.');
  }
  return {
    studentId, classId: enr.class_id, ma: (enr.programme_code ?? null) as ProgrammeCode | null, huong, lopDuKienId, mucTieu,
    thangThi: input.thangThi ?? null, ghiChu, ngayXemLai,
  };
}

/** GHI theo lô: bản ghi + hành trình + nhật ký — ba câu cho cả lô (Turso: không N câu trong một giao dịch). Gọi trong `tx`. */
function ghiCacDong(p: Principal, dongs: readonly DongGhi[]): void {
  const now = nowIso();
  const homNay = demoToday();
  chenNhieuDong(
    `INSERT INTO lo_trinh_tiep_theo
       (student_id, class_id, huong, lop_du_kien_id, muc_tieu, thang_thi, ghi_chu, ngay_xem_lai, updated_by, created_at, updated_at)`,
    dongs.map((d) => [d.studentId, d.classId, d.huong, d.lopDuKienId, d.mucTieu, d.thangThi, d.ghiChu, d.ngayXemLai, p.userId, now, now]),
    ` ON CONFLICT(student_id, class_id) DO UPDATE SET
       huong = excluded.huong, lop_du_kien_id = excluded.lop_du_kien_id, muc_tieu = excluded.muc_tieu,
       thang_thi = excluded.thang_thi, ghi_chu = excluded.ghi_chu, ngay_xem_lai = excluded.ngay_xem_lai, da_ap_dung_luc = NULL,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
  );
  chenNhieuDong(
    'INSERT INTO journey_events (student_id, event_type, event_date, title, created_by, created_at)',
    dongs.map((d) => [d.studentId, 'next_step', homNay,
      `Ghi lộ trình tiếp theo: ${nhanHuong(d.huong, { ma: d.ma, maKe: NORMAL_LADDER[d.ma as ProgrammeCode] ?? null })}`, p.userId, now]),
  );
  chenNhieuDong(
    'INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, after_json, created_at)',
    dongs.map((d) => [p.userId, 'student.next_step', 'student', d.studentId, JSON.stringify({
      huong: d.huong, lopDuKienId: d.lopDuKienId, mucTieu: d.mucTieu, thangThi: d.thangThi, ngayXemLai: d.ngayXemLai,
    }), now]),
  );
}

/** PUT /students/:id/lo-trinh-tiep (STUDENT_EDIT ở lớp đang học). */
export function ghiLoTrinhTiep(p: Principal, studentId: number, input: GhiVao) {
  const conn = db();
  const s = conn.prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  const enr = enrollmentDangHoc(studentId);
  if (!enr) throw badRequest('Học viên không đang học lớp nào.');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id }, 'Bạn không có quyền ghi lộ trình tiếp theo cho học viên này.');
  if (enr.is_fast_track) throw badRequest('Lộ trình tiếp theo chỉ áp dụng cho lớp thường.');
  const cu = conn.prepare('SELECT ngay_xem_lai FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').get(studentId, enr.class_id) as any;
  const dong = kiemDong(studentId, enr, input, docLopDuKien([input.lopDuKienId]), cu?.ngay_xem_lai ?? null);
  tx(() => ghiCacDong(p, [dong]));
  return layLoTrinhTiep(p, studentId);
}

/** Ghi cả lớp tối đa 60 em một lần (T3 — lớp đông nhất demo 32). */
export const GHI_CA_LOP_TOI_DA = 60;

function lopThuongCua(classId: number): any {
  const cls = db().prepare('SELECT id, code, programme_code, is_fast_track, branch_id FROM classes WHERE id = ?').get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  if (cls.is_fast_track) throw badRequest('Lộ trình tiếp theo chỉ áp dụng cho lớp thường.');
  return cls;
}

/**
 * GET /classes/:id/lo-trinh-tiep (PR-K26) — bảng "Ghi lộ trình tiếp theo cả lớp": mỗi em đang học một dòng (tên, % Cuối khoá + gợi ý,
 * bản ghi hiện tại). Số câu SQL không tăng theo số em (đọc theo lô).
 */
export function layLoTrinhTiepCaLop(p: Principal, classId: number) {
  const conn = db();
  const cls = lopThuongCua(classId);
  require_(p, PERMISSIONS.STUDENT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const ma = (cls.programme_code ?? null) as ProgrammeCode | null;
  const maKe = NORMAL_LADDER[ma as ProgrammeCode] ?? null;
  const em = conn.prepare(
    `SELECT s.id, s.full_name, s.student_code FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
  ).all(classId) as any[];
  em.sort((a, b) => String(a.full_name).localeCompare(String(b.full_name), 'vi'));
  const sids = em.map((r) => r.id as number);
  const ck = sids.length ? cuoiKhoaTheoHocVien(classId, sids) : new Map();
  const banGhi = tiepTheoTheoHocVien([classId]);
  return {
    lop: { id: classId, code: cls.code as string, ma, maKe },
    coTheGhi: can(p, PERMISSIONS.STUDENT_EDIT, { classId }),
    toiDa: GHI_CA_LOP_TOI_DA,
    hocVien: em.map((r) => ({
      id: r.id as number, ten: r.full_name as string, ma: r.student_code as string,
      cuoiKhoa: ck.get(r.id) ?? null, banGhi: banGhi.get(r.id) ?? null,
    })),
  };
}

/**
 * PUT /classes/:id/lo-trinh-tiep (PR-K26) — ghi nhiều em trong MỘT giao dịch: một dòng sai thì không lưu dòng nào, lỗi nêu tên em và
 * `details.studentId` để web chỉ đúng dòng. Cùng quyền với ghi một em (STUDENT_EDIT theo lớp). Dòng giữ nguyên HƯỚNG đã lưu thì giữ cả
 * chi tiết đã lưu (lớp dự kiến, Target, tháng thi, ngày xem lại) — bảng chỉ sửa hướng + ghi chú, không được xoá mất chi tiết.
 */
export function ghiLoTrinhTiepCaLop(p: Principal, classId: number, body: { items?: unknown }): { daLuu: number } {
  const conn = db();
  lopThuongCua(classId);
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId }, 'Bạn không có quyền ghi lộ trình tiếp theo cho lớp này.');
  const items = body?.items;
  if (!Array.isArray(items) || !items.length) throw badRequest('Chưa có em nào để lưu.');
  if (items.length > GHI_CA_LOP_TOI_DA) throw badRequest(`Mỗi lần lưu tối đa ${GHI_CA_LOP_TOI_DA} em.`);
  const em = new Map((conn.prepare(
    `SELECT s.id, s.full_name, e.class_id, c.programme_code, c.branch_id FROM enrollments e
       JOIN students s ON s.id = e.student_id JOIN classes c ON c.id = e.class_id
      WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
  ).all(classId) as any[]).map((r) => [r.id as number, r]));
  const daCo = tiepTheoTheoHocVien([classId]);
  const thay = new Set<number>();
  for (const it of items as any[]) {
    const sid = Number(it?.studentId);
    if (!Number.isInteger(sid) || !em.has(sid)) throw badRequest('Có học viên không đang học lớp này.', { studentId: Number.isInteger(sid) ? sid : null });
    if (thay.has(sid)) throw badRequest(`${em.get(sid).full_name}: trùng dòng.`, { studentId: sid });
    thay.add(sid);
  }
  /* Dòng giữ nguyên hướng đã lưu thì giữ chi tiết đã lưu (bảng không có ô lớp dự kiến, Target, ngày xem lại). */
  const vao = (items as any[]).map((it) => {
    const sid = Number(it.studentId);
    const cu = daCo.get(sid);
    const giu = cu && cu.huong === chuanHoaHuong(String(it.huong ?? '')) ? cu : null;
    const input: GhiVao = {
      huong: String(it.huong ?? ''), ghiChu: typeof it.ghiChu === 'string' ? it.ghiChu : null,
      lopDuKienId: giu?.lopDuKienId ?? null, mucTieu: giu?.mucTieu ?? null, thangThi: giu?.thangThi ?? null, ngayXemLai: giu?.ngayXemLai ?? null,
    };
    return { sid, cu, input };
  });
  const lopDuKien = docLopDuKien(vao.map((v) => v.input.lopDuKienId));
  /* Kiểm HẾT trước khi ghi: một dòng sai → 400 có tên em + `studentId`, không câu ghi nào chạy. */
  const dongs = vao.map(({ sid, cu, input }) => {
    try { return kiemDong(sid, em.get(sid), input, lopDuKien, cu?.ngayXemLai ?? null); }
    catch (e: any) { throw badRequest(`${em.get(sid).full_name}: ${e.message}`, { studentId: sid }); }
  });
  tx(() => ghiCacDong(p, dongs));
  return { daLuu: items.length };
}

/** Đọc theo lô: bản ghi Lộ trình tiếp theo của mọi em CÒN ĐANG HỌC các lớp `classIds` — một câu. */
export function tiepTheoTheoHocVien(classIds: number[]): Map<number, BanGhiLoTrinh> {
  const out = new Map<number, BanGhiLoTrinh>();
  if (!classIds.length) return out;
  const conn = db();
  const ph = classIds.map(() => '?').join(',');
  for (const r of conn
    .prepare(`SELECT * FROM lo_trinh_tiep_theo WHERE class_id IN (${ph})`)
    .all(...classIds) as any[]) {
    out.set(r.student_id, banGhiRowToView(r)!);
  }
  return out;
}

/**
 * Khối `lopHoc` ở cuối `studentProfile` (Task 3, `profile.ts`) — dòng dưới tên, nhắc chưa có
 * lộ trình, và cờ quyền của mọi nút ⋮ Hồ sơ HV liên quan tới lớp học (Q2, Q22).
 */
export function lopHocCua(p: Principal, studentId: number, current: any): {
  tiepTheo: string | null; nhacLoTrinh: boolean; chiXem: boolean;
  quyen: {
    ghiLoTrinhTiep: boolean; chuyenLop: boolean; deXuatChuyenLop: boolean; tamDung: boolean; quayLai: boolean;
    ketThuc: boolean; luuTru: boolean; boLuuTru: boolean;
  };
} {
  const conn = db();
  const s = dongHocVien(studentId);
  const chiXem = !!s?.archived_at;
  if (chiXem) {
    return {
      tiepTheo: null, nhacLoTrinh: false, chiXem: true,
      quyen: {
        ghiLoTrinhTiep: false, chuyenLop: false, deXuatChuyenLop: false, tamDung: false, quayLai: false, ketThuc: false, luuTru: false,
        boLuuTru: can(p, PERMISSIONS.PLAN_WEEK, { studentId }),
      },
    };
  }

  let tiepTheo: string | null = null;
  let nhacLoTrinh = false;
  let laLopThuong = false;
  if (current) {
    const cls = conn.prepare('SELECT programme_code, is_fast_track FROM classes WHERE id = ?').get(current.class_id) as any;
    laLopThuong = !cls?.is_fast_track;
    if (laLopThuong) {
      const banGhi = conn
        .prepare('SELECT huong, ngay_xem_lai FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?')
        .get(studentId, current.class_id) as any;
      tiepTheo = nhanTiepTheo(banGhi ? { huong: banGhi.huong as Huong } : null, (cls?.programme_code ?? null) as ProgrammeCode | null);
      const pr = classProgress(current.class_id);
      /* PR-K26: "Chưa quyết" KHÔNG hẹn ngày vẫn được nhắc (như `chua_ro` cũ); có hẹn ngày thì không (như `xep_sau` cũ). */
      nhacLoTrinh = trongHaiTuanCuoi(pr.currentWeek, pr.totalWeeks, pr.phase) && (!banGhi || (banGhi.huong === 'chua_quyet' && !banGhi.ngay_xem_lai));
    }
  }

  const coTheChuyenLop = !!current && can(p, PERMISSIONS.STUDENT_EDIT, { classId: current.class_id });
  return {
    tiepTheo, nhacLoTrinh, chiXem: false,
    quyen: {
      ghiLoTrinhTiep: laLopThuong && coTheChuyenLop,
      /* PR-CT: Quản lý ra lệnh (`Chuyển lớp…`); GVCN đề xuất (`Đề xuất chuyển lớp…`). */
      chuyenLop: !!current && coTheRaLenh(p, current.class_id),
      deXuatChuyenLop: coTheChuyenLop && !coTheRaLenh(p, current.class_id),
      tamDung: can(p, PERMISSIONS.STUDENT_EDIT, { studentId }),
      quayLai: can(p, PERMISSIONS.STUDENT_EDIT, { studentId }),
      ketThuc: can(p, PERMISSIONS.STUDENT_EDIT, { studentId }),
      luuTru: can(p, PERMISSIONS.PLAN_WEEK, { studentId }) && s?.status === 'finished',
      boLuuTru: false,
    },
  };
}
