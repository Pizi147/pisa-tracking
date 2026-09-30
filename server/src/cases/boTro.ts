import { db } from '../db.ts';
import { addDays, nowIso } from '../util.ts';
import { boTroGiuaKhoa, moTaBoTro, nhomBoTro } from '../../../shared/domain/index.ts';
import { classProgress } from '../classes/schedule.ts';
import { suggestCaseOwner } from './owner.ts';

/**
 * PA BỔ TRỢ GIỮA KHOÁ LỚP THƯỜNG (PR-LT2a, N1, M-03, M-05, Q-F) — phần ghi dữ liệu.
 *
 * PA Bổ trợ = `kind 'bo_tro'` + `preset = 1` + `moc_quy_che = 'den_cuoi_khoa'` — dùng lại trọn hạ tầng SOS v4 (chờ nguyên nhân, Xác nhận Case, Không cần
 * theo dõi, Báo lên, Ghi kết quả cuối). "Chưa chạy" = `UNCONFIRMED_PRESET` + `planned`: `confirmed_at`/`confirmed_by` chỉ được đặt bởi `chayPaBoTro`.
 * Trạng thái kế hoạch đọc từ thẻ `yeu_cau_duyet` loại `ke_hoach_bo_tro` — không dùng `approval_state`.
 */

/**
 * Hết Chủ nhật tuần Cuối khoá (mốc PA bổ trợ): lượt `final` cùng lộ trình (tuần đã xếp) → không có thì mốc của lớp (`classProgress`) → null
 * (không bịa hạn). `chưa có lịch` là chữ hiển thị của null.
 */
export function mocCuoiKhoa(cycleId: number | null, classId: number | null): string | null {
  if (cycleId) {
    const r = db().prepare(
      `SELECT rp.week_end FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.cycle_id = ? AND a.kind = 'final' AND a.status != 'cancelled' ORDER BY a.id DESC LIMIT 1`,
    ).get(cycleId) as any;
    if (r?.week_end) return r.week_end;
  }
  const start = classId ? classProgress(classId).finalWeekStart : null;
  return start ? addDays(start, 6) : null;
}

/**
 * PA bổ trợ CHỜ (preset=1, planned, confirmed NULL) của một Case Giữa khoá. Người dạy: FOU = GVCN (Q-F) · BE/ELE = GVBM môn (suggestCaseOwner);
 * nhóm FOU đã có người dạy (dòng trước, hoặc GVCN đã đổi lúc nộp kế hoạch) thì dùng lại người đó. `han_ke_hoach` = `han_xac_nhan` của Case (M-05).
 */
export function taoPaBoTro(conn: any, x: { caseId: number; attempt: any; skill: string; category: string; ct: string | null; han: string }): number {
  const b = boTroGiuaKhoa(x.ct);
  const nhom = nhomBoTro(x.ct, x.attempt.id, x.skill);
  const truoc = b?.chung
    ? (conn.prepare('SELECT performer_user_id p FROM case_interventions WHERE nhom_bo_tro = ? AND performer_user_id IS NOT NULL ORDER BY id LIMIT 1').get(nhom) as any)?.p ?? null
    : null;
  const gvcn = () => (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`)
    .get(x.attempt.class_id ?? 0) as any)?.user_id ?? null;
  const nguoiDay = truoc ?? (b?.chung ? gvcn() : suggestCaseOwner({ classId: x.attempt.class_id ?? null, category: x.category }));
  const info = conn.prepare(
    `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, needs_approval, preset, moc_quy_che,
                                     nhom_bo_tro, han_ke_hoach, followup_due, created_at)
     VALUES (?, 'bo_tro', ?, ?, NULL, 'planned', 0, 1, 'den_cuoi_khoa', ?, ?, ?, ?)`,
  ).run(x.caseId, moTaBoTro(x.ct, x.skill), nguoiDay, nhom, x.han, mocCuoiKhoa(x.attempt.cycle_id ?? null, x.attempt.class_id ?? null), nowIso());
  return Number(info.lastInsertRowid);
}
