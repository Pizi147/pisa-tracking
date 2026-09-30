import { db } from '../db.ts';
import {
  HUONG_TIEP, NORMAL_LADDER, PERMISSIONS, nhanHuong, nhanTiepTheo, soSanhLop, trongHaiTuanCuoi,
  type Huong, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
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
    mucTieu: row.muc_tieu ?? null, thangThi: row.thang_thi ?? null, ghiChu: row.ghi_chu ?? null,
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

/** PUT /students/:id/lo-trinh-tiep (STUDENT_EDIT ở lớp đang học). */
export function ghiLoTrinhTiep(p: Principal, studentId: number, input: {
  huong: string; lopDuKienId?: number | null; mucTieu?: number | null; thangThi?: string | null; ghiChu?: string | null;
}) {
  const conn = db();
  const s = conn.prepare('SELECT id FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  const enr = enrollmentDangHoc(studentId);
  if (!enr) throw badRequest('Học viên không đang học lớp nào.');
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id }, 'Bạn không có quyền ghi lộ trình tiếp theo cho học viên này.');
  if (enr.is_fast_track) throw badRequest('Lộ trình tiếp theo chỉ áp dụng cho lớp thường.');
  if (!(HUONG_TIEP as readonly string[]).includes(input.huong)) throw badRequest('Hướng không hợp lệ.');
  const mucTieu = input.mucTieu ?? null;
  if (mucTieu !== null && (mucTieu < 0 || mucTieu > 9)) throw badRequest('Mục tiêu band phải từ 0 đến 9.');

  let lopDuKienId = input.lopDuKienId ?? null;
  if (lopDuKienId) {
    const lop = conn.prepare('SELECT id, programme_code, is_fast_track, branch_id FROM classes WHERE id = ?').get(lopDuKienId) as any;
    if (!lop || lop.branch_id !== enr.branch_id) throw badRequest('Không tìm thấy lớp dự kiến.');
    const maKe = NORMAL_LADDER[(enr.programme_code ?? null) as ProgrammeCode] ?? null;
    if (input.huong === 'len_lop' && (lop.is_fast_track || lop.programme_code !== maKe)) {
      throw badRequest('Lớp dự kiến phải là chương trình kế tiếp.');
    }
    if (input.huong === 'hoc_lai' && (lop.is_fast_track || lop.programme_code !== enr.programme_code)) {
      throw badRequest('Lớp dự kiến phải cùng chương trình để học lại.');
    }
    if (input.huong === 'fast_track' && !lop.is_fast_track) throw badRequest('Lớp dự kiến phải là Fast Track.');
  } else {
    lopDuKienId = null;
  }

  const now = nowIso();
  conn
    .prepare(
      `INSERT INTO lo_trinh_tiep_theo
         (student_id, class_id, huong, lop_du_kien_id, muc_tieu, thang_thi, ghi_chu, updated_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(student_id, class_id) DO UPDATE SET
         huong = excluded.huong, lop_du_kien_id = excluded.lop_du_kien_id, muc_tieu = excluded.muc_tieu,
         thang_thi = excluded.thang_thi, ghi_chu = excluded.ghi_chu, da_ap_dung_luc = NULL,
         updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    )
    .run(studentId, enr.class_id, input.huong, lopDuKienId, mucTieu, input.thangThi ?? null, input.ghiChu ?? null,
      p.userId, now, now);

  const ma = (enr.programme_code ?? null) as ProgrammeCode | null;
  const maKe = NORMAL_LADDER[ma as ProgrammeCode] ?? null;
  addJourney({
    studentId, eventType: 'next_step', eventDate: demoToday(),
    title: `Ghi lộ trình tiếp theo: ${nhanHuong(input.huong as Huong, { ma, maKe })}`,
    createdBy: p.userId,
  });
  writeAudit({
    actorUserId: p.userId, action: 'student.next_step', entityType: 'student', entityId: studentId,
    after: { huong: input.huong, lopDuKienId, mucTieu, thangThi: input.thangThi ?? null },
  });

  return layLoTrinhTiep(p, studentId);
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
 * Số em CHƯA CÓ lộ trình tiếp theo của mỗi lớp (Q9): em `active`, không lưu trữ, không có
 * bản ghi hoặc `huong='chua_ro'`. Một câu, không quét theo từng em.
 */
export function demChuaLoTrinh(classIds: number[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!classIds.length) return out;
  const conn = db();
  const ph = classIds.map(() => '?').join(',');
  for (const r of conn
    .prepare(
      `SELECT e.class_id, COUNT(*) n FROM enrollments e
         JOIN students s ON s.id = e.student_id
         LEFT JOIN lo_trinh_tiep_theo lt ON lt.student_id = e.student_id AND lt.class_id = e.class_id
        WHERE e.class_id IN (${ph}) AND e.status = 'active'
          AND s.status = 'active' AND s.archived_at IS NULL
          AND (lt.id IS NULL OR lt.huong = 'chua_ro')
          AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop lc WHERE lc.student_id = e.student_id AND lc.trang_thai = 'cho')   -- PR-CT: em đã có lệnh không còn "chưa có hướng"
        GROUP BY e.class_id`,
    )
    .all(...classIds) as any[]) {
    out.set(r.class_id, r.n);
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
  const s = conn.prepare('SELECT status, archived_at FROM students WHERE id = ?').get(studentId) as any;
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
        .prepare('SELECT huong FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?')
        .get(studentId, current.class_id) as any;
      tiepTheo = nhanTiepTheo(banGhi ? { huong: banGhi.huong as Huong } : null, (cls?.programme_code ?? null) as ProgrammeCode | null);
      const pr = classProgress(current.class_id);
      nhacLoTrinh = trongHaiTuanCuoi(pr.currentWeek, pr.totalWeeks, pr.phase) && (!banGhi || banGhi.huong === 'chua_ro');
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
