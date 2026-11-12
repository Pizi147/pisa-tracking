import { db, theoLo } from '../db.ts';
import { PERMISSIONS, chuanHoaMaLop, soSanhLopLuuTru, tenRoute, type ProgrammeCode } from '../../../shared/domain/index.ts';
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
  /** Chủ SP 12/11: nhóm Fast Track (true) · Lớp thường (false) — `classes.is_fast_track`. */
  ft: boolean;
};
export type HocVienLuuTru = {
  id: number; studentCode: string; fullName: string; lopCuoi: string | null; chiNhanh: string | null; archivedAt: string;
  /** P7 (N11, k5): em Tạm dừng (giữ chỗ lớp, "Tạm dừng · Có thể quay lại") hay Kết thúc học — cả hai ở Lưu trữ. */
  trangThai: 'tam-dung' | 'ket-thuc';
  /** Lộ trình gần nhất ("LT1" · tên lộ trình Khác) — dòng phụ "MB FT 101 · FT LT1 · từ 14/09". */
  loTrinh: string | null;
  /** P7: một nút "Quay lại học" — em tạm dừng: người đổi trạng thái được (`student.edit` / `edit_more`); em kết thúc: Quản lý (`cycle.edit`, đường `hocLai`).
   * Máy chủ vẫn kiểm lúc làm (lớp cũ đã kết thúc → chỉ Quản lý chọn lớp mới). */
  coTheQuayLai: boolean;
  /** SUA-NHO-QUYEN → SUA-LUU-TRU (07/11): nút "Sửa thông tin" (trường không đụng lộ trình) cho em đã lưu trữ — cùng cổng `updateStudent` (`student.edit` / `edit_info`). */
  coTheSuaThongTin: boolean;
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
      `SELECT c.id, c.code, c.branch_id, c.is_fast_track, c.programme_code, pg.name AS programme_name, b.name AS branch_name, c.finished_at,
              (SELECT COUNT(DISTINCT student_id) FROM enrollments WHERE class_id = c.id) AS so_hv_tung_hoc,
              (SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
                WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active' ORDER BY ta.id LIMIT 1) AS gvcn
         FROM classes c JOIN branches b ON b.id = c.branch_id LEFT JOIN programmes pg ON pg.code = c.programme_code
        WHERE ${whereLop.join(' AND ')} ORDER BY c.id`,
    )
    .all(...paramsLop) as any[];
  /* T2: tìm theo mã chuẩn hoá (nhận `MB-FT 101`, `ft101`). Chủ SP 12/11: Fast Track → Lớp thường, trong nhóm số lớp lớn nhất đứng đầu (`soSanhLopLuuTru`). */
  const qMa = chuanHoaMaLop(q);
  const lop: LopLuuTru[] = lopRows
    .filter((r) => !q || (!!qMa && chuanHoaMaLop(r.code).includes(qMa)))
    .sort((a, b) => soSanhLopLuuTru(sapLop(a), sapLop(b)) || a.id - b.id)
    .map((r) => ({
    id: r.id, code: r.code, ma: (r.programme_code ?? null) as ProgrammeCode | null, tenChuongTrinh: r.programme_name ?? null,
    chiNhanh: r.branch_name, gvcn: r.gvcn ?? null, soHvTungHoc: r.so_hv_tung_hoc, finishedAt: r.finished_at ?? null,
    coTheMoLai: can(p, PERMISSIONS.CLASS_EDIT, { classId: r.id }),
    ft: !!r.is_fast_track,
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
    .prepare(`SELECT s.id, s.student_code, s.full_name, s.archived_at, s.status,
       (SELECT cy.route FROM learning_cycles cy WHERE cy.student_id = s.id ORDER BY cy.seq DESC LIMIT 1) AS route,
       (SELECT cy.route_ten FROM learning_cycles cy WHERE cy.student_id = s.id ORDER BY cy.seq DESC LIMIT 1) AS route_ten
       FROM students s WHERE ${whereHv.join(' AND ')} ORDER BY s.id`)
    .all(...paramsHv) as any[];

  let hocVien: HocVienLuuTru[] = [];
  if (archived.length) {
    const ids = archived.map((s) => s.id as number);
    // Lớp cuối (ghi danh mới nhất) của từng em — chỉ để HIỂN THỊ, không dùng để tính phạm vi. P7: theo lô (Turso ≤ 900 tham số — em Tạm dừng cũng vào Lưu trữ).
    const enrRows: any[] = [];
    theoLo(ids, (lo, ph) => {
      enrRows.push(...conn.prepare(
        `SELECT e.student_id, c.code AS class_code, c.branch_id, c.is_fast_track, b.name AS branch_name, e.started_at, e.id
           FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
          WHERE e.student_id IN (${ph}) ORDER BY e.student_id, e.started_at DESC, e.id DESC`,
      ).all(...lo) as any[]);
    });
    const lopCuoiCua = new Map<number, { code: string; branchName: string; branch_id: number; is_fast_track: number }>();
    for (const r of enrRows) if (!lopCuoiCua.has(r.student_id)) lopCuoiCua.set(r.student_id, { code: r.class_code, branchName: r.branch_name, branch_id: r.branch_id, is_fast_track: r.is_fast_track });

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
    /* Chủ SP 12/11: theo lớp học cuối (cùng thứ tự bảng lớp), trong lớp theo tên; em chưa từng học lớp nào cuối cùng. Khoá id để thứ tự ổn định. */
    const lopA = (s: any) => { const l = lopCuoiCua.get(s.id); return l ? sapLop(l) : null; };
    hocVien = archived
      .filter((s) => can(p, PERMISSIONS.STUDENT_VIEW, { studentId: s.id }))
      .sort((a, b) => {
        const x = lopA(a); const y = lopA(b);
        return (x && y ? soSanhLopLuuTru(x, y) : Number(!x) - Number(!y)) || String(a.full_name).localeCompare(String(b.full_name), 'vi') || a.id - b.id;
      })
      .map((s) => ({
        id: s.id, studentCode: s.student_code, fullName: s.full_name,
        lopCuoi: lopCuoiCua.get(s.id)?.code ?? null, chiNhanh: lopCuoiCua.get(s.id)?.branchName ?? null,
        archivedAt: s.archived_at,
        trangThai: s.status === 'inactive' ? 'tam-dung' as const : 'ket-thuc' as const,
        loTrinh: tenRoute(s),
        coTheQuayLai: s.status === 'inactive'
          ? can(p, PERMISSIONS.STUDENT_EDIT, { studentId: s.id }) || can(p, PERMISSIONS.STUDENT_EDIT_MORE, { studentId: s.id })
          : can(p, PERMISSIONS.CYCLE_EDIT, { studentId: s.id }),
        /* Chủ SP 30/10 (#729): GVCN ở Lưu trữ vẫn có nút (ẩn Liên hệ — QUYEN-LIEN-HE máy chủ chặn GV). SUA-LUU-TRU (07/11): cả em Kết thúc học — cùng cổng `updateStudent`. */
        coTheSuaThongTin: can(p, PERMISSIONS.STUDENT_EDIT, { studentId: s.id }) || can(p, PERMISSIONS.STUDENT_EDIT_INFO, { studentId: s.id }),
        cycleIdCuoi: cycleCuoi.get(s.id) ?? null,
      }));
  }

  return { lop, hocVien, phamVi: { chiNhanh: f.branchId ?? null } };
}

const sapLop = (r: { code: string; branch_id: number; is_fast_track: number }) => ({ code: r.code, branchId: r.branch_id, ft: !!r.is_fast_track });
