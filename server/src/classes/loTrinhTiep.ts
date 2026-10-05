import { db, tx } from '../db.ts';
import { HV_DANG_HOC_SQL, dongHocVien } from '../students/tamDung.ts';
import {
  NORMAL_LADDER, PERMISSIONS, chuanHoaHuong, nhanHuong, nhanTiepTheo, soSanhLop, trongHaiTuanCuoi,
  type Huong, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { badRequest, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
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

/** PUT /students/:id/lo-trinh-tiep (STUDENT_EDIT ở lớp đang học). */
export function ghiLoTrinhTiep(p: Principal, studentId: number, input: GhiVao) {
  ghiMotEm(p, studentId, input);
  return layLoTrinhTiep(p, studentId);
}

/** LÕI ghi một em (PR-K26): kiểm + ghi + hành trình + nhật ký, KHÔNG đọc lại — `ghiLoTrinhTiep` và `ghiLoTrinhTiepCaLop` dùng chung. */
export function ghiMotEm(p: Principal, studentId: number, input: GhiVao): void {
  const conn = db();
  const s = conn.prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  const enr = enrollmentDangHoc(studentId);
  if (!enr) throw badRequest('Học viên không đang học lớp nào.');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id }, 'Bạn không có quyền ghi lộ trình tiếp theo cho học viên này.');
  if (enr.is_fast_track) throw badRequest('Lộ trình tiếp theo chỉ áp dụng cho lớp thường.');
  /* PR-K26: form cũ đang mở còn gửi `chua_ro`/`xep_sau` → `chua_quyet`, không báo lỗi. */
  const huong = chuanHoaHuong(String(input.huong ?? ''));
  if (!huong) throw badRequest('Hướng không hợp lệ.');
  const ngayXemLai = huong === 'chua_quyet' ? (input.ngayXemLai || null) : null;
  if (ngayXemLai && !isIsoDate(ngayXemLai)) throw badRequest('Ngày xem lại không hợp lệ.');
  const mucTieu = input.mucTieu ?? null;
  if (mucTieu !== null && (mucTieu < 0 || mucTieu > 9)) throw badRequest('Target phải từ 0 đến 9.');

  let lopDuKienId = input.lopDuKienId ?? null;
  if (lopDuKienId) {
    const lop = conn.prepare('SELECT id, programme_code, is_fast_track, branch_id FROM classes WHERE id = ?').get(lopDuKienId) as any;
    if (!lop || lop.branch_id !== enr.branch_id) throw badRequest('Không tìm thấy lớp dự kiến.');
    const maKe = NORMAL_LADDER[(enr.programme_code ?? null) as ProgrammeCode] ?? null;
    if (huong === 'len_lop' && (lop.is_fast_track || lop.programme_code !== maKe)) {
      throw badRequest('Lớp dự kiến phải là chương trình kế tiếp.');
    }
    if (huong === 'hoc_lai' && (lop.is_fast_track || lop.programme_code !== enr.programme_code)) {
      throw badRequest('Lớp dự kiến phải cùng chương trình để học lại.');
    }
    if (huong === 'fast_track' && !lop.is_fast_track) throw badRequest('Lớp dự kiến phải là Fast Track.');
  } else {
    lopDuKienId = null;
  }

  const now = nowIso();
  conn
    .prepare(
      `INSERT INTO lo_trinh_tiep_theo
         (student_id, class_id, huong, lop_du_kien_id, muc_tieu, thang_thi, ghi_chu, ngay_xem_lai, updated_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(student_id, class_id) DO UPDATE SET
         huong = excluded.huong, lop_du_kien_id = excluded.lop_du_kien_id, muc_tieu = excluded.muc_tieu,
         thang_thi = excluded.thang_thi, ghi_chu = excluded.ghi_chu, ngay_xem_lai = excluded.ngay_xem_lai, da_ap_dung_luc = NULL,
         updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    )
    .run(studentId, enr.class_id, huong, lopDuKienId, mucTieu, input.thangThi ?? null, input.ghiChu ?? null, ngayXemLai,
      p.userId, now, now);

  const ma = (enr.programme_code ?? null) as ProgrammeCode | null;
  const maKe = NORMAL_LADDER[ma as ProgrammeCode] ?? null;
  addJourney({
    studentId, eventType: 'next_step', eventDate: demoToday(),
    title: `Ghi lộ trình tiếp theo: ${nhanHuong(huong, { ma, maKe })}`,
    createdBy: p.userId,
  });
  writeAudit({
    actorUserId: p.userId, action: 'student.next_step', entityType: 'student', entityId: studentId,
    after: { huong, lopDuKienId, mucTieu, thangThi: input.thangThi ?? null, ngayXemLai },
  });
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
 * bản ghi hiện tại) + lớp dự kiến chọn được. Số câu SQL không tăng theo số em (đọc theo lô).
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
  const lopDuKien: LopDuKien[] = (conn.prepare(
    `SELECT id, code, programme_code, is_fast_track FROM classes
      WHERE branch_id = ? AND status = 'active' AND id != ? AND (programme_code = ? OR programme_code = ? OR is_fast_track = 1)`,
  ).all(cls.branch_id, classId, maKe, ma) as any[])
    .sort((a, b) => soSanhLop({ code: a.code }, { code: b.code }))
    .map((r) => ({ id: r.id, code: r.code, ma: r.programme_code ?? null, ft: !!r.is_fast_track }));
  return {
    lop: { id: classId, code: cls.code as string, ma, maKe },
    coTheGhi: can(p, PERMISSIONS.STUDENT_EDIT, { classId }),
    toiDa: GHI_CA_LOP_TOI_DA,
    lopDuKien,
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
  const ten = new Map((conn.prepare(
    `SELECT s.id, s.full_name FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND e.status = 'active' AND ${HV_DANG_HOC_SQL('s')}`,
  ).all(classId) as any[]).map((r) => [r.id as number, r.full_name as string]));
  const daCo = tiepTheoTheoHocVien([classId]);
  const thay = new Set<number>();
  for (const it of items as any[]) {
    const sid = Number(it?.studentId);
    if (!Number.isInteger(sid) || !ten.has(sid)) throw badRequest('Có học viên không đang học lớp này.', { studentId: Number.isInteger(sid) ? sid : null });
    if (thay.has(sid)) throw badRequest(`${ten.get(sid)}: trùng dòng.`, { studentId: sid });
    thay.add(sid);
  }
  tx(() => {
    for (const it of items as any[]) {
      const sid = Number(it.studentId);
      const cu = daCo.get(sid);
      const huong = chuanHoaHuong(String(it.huong ?? ''));
      const giu = cu && cu.huong === huong ? cu : null;
      try {
        ghiMotEm(p, sid, {
          huong: String(it.huong ?? ''), ghiChu: typeof it.ghiChu === 'string' ? it.ghiChu.trim() || null : null,
          lopDuKienId: giu?.lopDuKienId ?? null, mucTieu: giu?.mucTieu ?? null, thangThi: giu?.thangThi ?? null, ngayXemLai: giu?.ngayXemLai ?? null,
        });
      } catch (e: any) {
        throw badRequest(`${ten.get(sid)}: ${e?.message ?? 'không lưu được'}`, { studentId: sid });
      }
    }
  });
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
