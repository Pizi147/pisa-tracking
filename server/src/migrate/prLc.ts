/**
 * PR-LC (LCa, kế hoạch 2026-10-07 mục 6): quyết định Cuối khoá `cho` ra TRƯỚC PR-LCa chưa kéo Lộ trình tiếp theo + MT0 theo (L1, L5).
 * Đồng bộ bằng ĐÚNG `dongBoTuLenh` của `raLenh` (không luật thứ hai) — chỉ em còn lệch: chưa có LTT, Hướng khác, Lên FT khác Target, hoặc
 * Lên FT chưa có MT0. Lần hai không còn em lệch → không ghi gì (Hành trình chỉ khi đổi hướng, MT0 `UNIQUE (cycle_id, attempt_no)`).
 * Một giao dịch (savepoint trong migrate) mỗi lớp; `chenNhieuDong` / `theoLo` trong `dongBoTuLenh` tự chia lô ≤ 900 tham số.
 * Lộ trình FT đã thi hành mà không có điểm đầu vào (L1 cũ): CHỈ đếm, không sửa (không biết MT0 có thật không) — QL đặt tay ở hồ sơ HV.
 */
import { tx } from '../db.ts';
import { dongBoTuLenh } from '../classes/loTrinhTiep.ts';
import { coMt0, type Huong, type ProgrammeCode } from '../../../shared/domain/index.ts';
import type { Principal } from '../permissions.ts';

export function migratePrLc(conn: any, applied: string[]) {
  const lech = (conn.prepare(
    `SELECT l.student_id, l.lop_nguon_id, l.lop_dich_id, l.huong, l.muc_tieu, l.nguoi_ra_lenh, c.programme_code, t.huong AS huong_cu, t.muc_tieu AS muc_tieu_cu,
            EXISTS (SELECT 1 FROM learning_cycles cy WHERE cy.student_id = l.student_id AND cy.status = 'active' AND cy.route IS NULL) AS co_khoa,
            EXISTS (SELECT 1 FROM learning_cycles cy JOIN assessment_attempts a ON a.cycle_id = cy.id AND a.kind = 'mt0' AND a.status <> 'cancelled'
                     WHERE cy.student_id = l.student_id AND cy.status = 'active' AND cy.route IS NULL) AS co_mt0
       FROM lenh_chuyen_lop l JOIN classes c ON c.id = l.lop_nguon_id AND c.is_fast_track = 0
       LEFT JOIN lo_trinh_tiep_theo t ON t.student_id = l.student_id AND t.class_id = l.lop_nguon_id
      WHERE l.trang_thai = 'cho' AND l.boi_canh = 'cuoi-khoa'`,
  ).all() as any[]).filter((r) => r.huong_cu !== r.huong || (r.huong === 'fast_track' && (
    /* muc_tieu của lệnh KCK đã là NULL (raLenh) — đúng giá trị LTT phải có. */
    (r.muc_tieu_cu ?? null) !== (r.muc_tieu ?? null) || (coMt0(r.programme_code, r.huong) && r.co_khoa && !r.co_mt0))));

  /* Nhóm theo lớp nguồn, rồi theo người ra lệnh (Hành trình / nhật ký ghi đúng người quyết). */
  const theoLop = new Map<number, Map<number, any[]>>();
  for (const r of lech) {
    const lop = theoLop.get(r.lop_nguon_id) ?? new Map<number, any[]>();
    lop.set(r.nguoi_ra_lenh, [...(lop.get(r.nguoi_ra_lenh) ?? []), r]);
    theoLop.set(r.lop_nguon_id, lop);
  }
  for (const [classId, theoNguoi] of theoLop) {
    tx(() => {
      for (const [userId, rs] of theoNguoi) {
        dongBoTuLenh({ userId } as Principal, rs.map((r) => ({
          studentId: r.student_id, classId, ma: (r.programme_code ?? null) as ProgrammeCode | null, huong: r.huong as Huong,
          lopDuKienId: r.lop_dich_id ?? null, mucTieu: r.muc_tieu ?? null, huongCu: (r.huong_cu ?? null) as Huong | null,
          cuLaQl: false,   // LTT trước PR-LCa do GVCN ghi (ra lệnh từ PR-LCa đã tự đồng bộ)
        })));
      }
    });
  }
  if (lech.length) applied.push(`PR-LC: đồng bộ Lộ trình tiếp theo theo ${lech.length} quyết định chuyển lớp đang chờ`);
}

/** Lộ trình FT đã thi hành mà không có điểm đầu vào (L1 cũ) — chỉ đếm; `migrate/run.ts` in ra (bộ kiểm gọi `migrate()` không in). */
export function demFtChuaDauVao(conn: any): number {
  return (conn.prepare(
    `SELECT COUNT(*) AS n FROM learning_cycles cy WHERE cy.route IS NOT NULL AND cy.baseline_attempt_id IS NULL AND cy.baseline_score IS NULL
        AND EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = cy.student_id AND e.end_kind = 'sang_ft' AND e.ended_at = cy.started_at)`,
  ).get() as any).n as number;
}
