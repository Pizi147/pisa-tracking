import { db, theoLo } from '../db.ts';
import { PERMISSIONS, chuanHoaMaLop, soSanhLop, type ProgrammeCode } from '../../../shared/domain/index.ts';
import { can, classScopeSql, napTruocPhamVi, scopeFor, type Principal } from '../permissions.ts';

/**
 * KHU LƯU TRỮ (PR-LT, Q16/Q22 — chủ sản phẩm 23/09) — lớp đã kết thúc · học viên đã lưu trữ,
 * ẩn khỏi `/hoc-vien-lop` mặc định nhưng vẫn tra cứu được ở đây, chỉ xem.
 */

export type LopLuuTru = {
  id: number; code: string; ma: ProgrammeCode | null; tenChuongTrinh: string | null;
  chiNhanh: string; gvcn: string | null; soHvTungHoc: number; finishedAt: string | null;
  /** PR-LUI-b: nút "Mở lại" cuối dòng (Quản lý của lớp / Quản trị — `class.edit`). */
  coTheMoLai: boolean;
};
export type HocVienLuuTru = {
  id: number; studentCode: string; fullName: string; lopCuoi: string | null; chiNhanh: string | null; archivedAt: string;
  /** Nút "Bỏ lưu trữ" cuối dòng (chỉ Quản lý — cùng luật `archiveStudent`/`unarchiveStudent`, PLAN_WEEK). */
  coTheBoLuuTru: boolean;
  /** PR-LUI-b: nút "Học lại" (cùng luật `hocLai`: `plan.week` của học viên). */
  coTheHocLai: boolean;
  /** PR-TK: lộ trình đã đóng GẦN NHẤT của em (có bản chụp) — nút "Tổng kết" mở ngăn của lộ trình này; không có → không nút. */
  cycleIdCuoi: number | null;
};

/** GET /hoc-vien-lop/luu-tru — cùng phạm vi lớp với `/hoc-vien-lop` chính (ATTEMPT_VIEW); HV theo đúng luật STUDENT_VIEW. */
export function danhSachLuuTru(p: Principal, f: { branchId?: number | null; q?: string | null } = {}): {
  lop: LopLuuTru[]; hocVien: HocVienLuuTru[]; phamVi: { chiNhanh: number | null };
} {
  const conn = db();
  const q = (f.q ?? '').trim();

  // ---------------------------------------------------------------- lớp đã kết thúc
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  const cs = classScopeSql(scope);
  const whereLop: string[] = [cs.sql, `c.status = 'finished'`];
  const paramsLop: unknown[] = [...cs.params];
  if (f.branchId) { whereLop.push('c.branch_id = ?'); paramsLop.push(f.branchId); }

  const lopRows = scope.none ? [] : conn
    .prepare(
      `SELECT c.id, c.code, c.branch_id, c.programme_code, pg.name AS programme_name, b.name AS branch_name, c.finished_at,
              (SELECT COUNT(DISTINCT student_id) FROM enrollments WHERE class_id = c.id) AS so_hv_tung_hoc,
              (SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
                WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id LIMIT 1) AS gvcn
         FROM classes c JOIN branches b ON b.id = c.branch_id LEFT JOIN programmes pg ON pg.code = c.programme_code
        WHERE ${whereLop.join(' AND ')} ORDER BY c.finished_at DESC, c.code`,
    )
    .all(...paramsLop) as any[];
  /* T2: tìm theo mã chuẩn hoá (nhận `MB-FT 101`, `ft101`); cùng ngày kết thúc thì xếp lớp theo số tự nhiên (K2-08). */
  const qMa = chuanHoaMaLop(q);
  const lop: LopLuuTru[] = lopRows
    .filter((r) => !q || (!!qMa && chuanHoaMaLop(r.code).includes(qMa)))
    .sort((a, b) => String(b.finished_at ?? '').slice(0, 10).localeCompare(String(a.finished_at ?? '').slice(0, 10)) || soSanhLop({ code: a.code, branchId: a.branch_id }, { code: b.code, branchId: b.branch_id }))
    .map((r) => ({
    id: r.id, code: r.code, ma: (r.programme_code ?? null) as ProgrammeCode | null, tenChuongTrinh: r.programme_name ?? null,
    chiNhanh: r.branch_name, gvcn: r.gvcn ?? null, soHvTungHoc: r.so_hv_tung_hoc, finishedAt: r.finished_at ?? null,
    coTheMoLai: can(p, PERMISSIONS.CLASS_EDIT, { classId: r.id }),
  }));

  // ---------------------------------------------------------------- học viên đã lưu trữ
  const whereHv: string[] = [`s.archived_at IS NOT NULL`];
  const paramsHv: unknown[] = [];
  if (f.branchId) {
    whereHv.push(`(s.branch_id = ? OR EXISTS (SELECT 1 FROM enrollments e2 JOIN classes c2 ON c2.id = e2.class_id
      WHERE e2.student_id = s.id AND c2.branch_id = ?))`);
    paramsHv.push(f.branchId, f.branchId);
  }
  if (q) {
    whereHv.push('(s.full_name LIKE ? OR s.normalized_name LIKE ? OR s.student_code LIKE ?)');
    paramsHv.push(`%${q}%`, `%${q.toLowerCase()}%`, `%${q.toUpperCase()}%`);
  }
  const archived = conn
    .prepare(`SELECT s.id, s.student_code, s.full_name, s.archived_at FROM students s WHERE ${whereHv.join(' AND ')} ORDER BY s.archived_at DESC`)
    .all(...paramsHv) as any[];

  let hocVien: HocVienLuuTru[] = [];
  if (archived.length) {
    const ids = archived.map((s) => s.id as number);
    const ph = ids.map(() => '?').join(',');
    // Lớp cuối (ghi danh mới nhất) của từng em — chỉ để HIỂN THỊ, không dùng để tính phạm vi.
    const enrRows = conn
      .prepare(
        `SELECT e.student_id, c.code AS class_code, b.name AS branch_name, e.started_at, e.id
           FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
          WHERE e.student_id IN (${ph}) ORDER BY e.student_id, e.started_at DESC, e.id DESC`,
      )
      .all(...ids) as any[];
    const lopCuoiCua = new Map<number, { code: string; branchName: string }>();
    for (const r of enrRows) if (!lopCuoiCua.has(r.student_id)) lopCuoiCua.set(r.student_id, { code: r.class_code, branchName: r.branch_name });

    /*
     * PHẠM VI ĐÚNG LUẬT `can(STUDENT_VIEW, {studentId})` (không viết lại `grantCovers` — nạp trước
     * chi nhánh/lớp của cả lô bằng `napTruocPhamVi` rồi gọi thẳng `can()`, để trong một request GET
     * (`chayTrongRequest`, PR-TD) đây vẫn là công đã nạp một lần, không N+1 dù gọi theo từng em).
     */
    const cycleCuoi = new Map<number, number>();
    theoLo(ids, (lo, ph2) => {
      for (const r of conn.prepare(`SELECT student_id, cycle_id FROM ban_chup_lo_trinh WHERE student_id IN (${ph2}) ORDER BY id`).all(...lo) as any[]) cycleCuoi.set(r.student_id, r.cycle_id);
    });
    napTruocPhamVi(ids);
    hocVien = archived
      .filter((s) => can(p, PERMISSIONS.STUDENT_VIEW, { studentId: s.id }))
      .map((s) => ({
        id: s.id, studentCode: s.student_code, fullName: s.full_name,
        lopCuoi: lopCuoiCua.get(s.id)?.code ?? null, chiNhanh: lopCuoiCua.get(s.id)?.branchName ?? null,
        archivedAt: s.archived_at,
        coTheBoLuuTru: can(p, PERMISSIONS.PLAN_WEEK, { studentId: s.id }),
        coTheHocLai: can(p, PERMISSIONS.PLAN_WEEK, { studentId: s.id }),
        cycleIdCuoi: cycleCuoi.get(s.id) ?? null,
      }));
  }

  return { lop, hocVien, phamVi: { chiNhanh: f.branchId ?? null } };
}
