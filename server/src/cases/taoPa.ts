import { THAM_SO_TOI_DA, theoLo } from '../db.ts';
import { badRequest, nowIso } from '../util.ts';
import { coNguoiDay, coSoBuoi, kiemSoBuoiPa, soBuoiTu } from '../../../shared/domain/index.ts';

/**
 * PR-PA (§8): MỘT hàm tạo PA cho mọi đường (tay, quy chế SOS, bổ trợ Giữa khoá, bổ trợ miễn phí, Tutor kỳ vọng) — một bộ cột cố định,
 * cùng luật: Số buổi chỉ với loại có số buổi (loại khác → NULL), 1–60; người = tài khoản HOẶC tên (không cả hai); Tự học không người.
 * Nơi gọi giữ nguyên giá trị cột của đường mình; trường bỏ trống = NULL (cờ = 0).
 */
export type DongPa = {
  caseId: number; kind: string; description: string | null; status: string;
  soBuoi?: number | null;
  performerUserId?: number | null; performerName?: string | null; recordedBy?: number | null;
  plannedDate?: string | null; startedDate?: string | null; completedDate?: string | null;
  followupDue?: string | null; actionDue?: string | null; cycleStartedOn?: string | null;
  needsApproval?: boolean; approvalState?: string | null; approvalDue?: string | null; rescheduleTarget?: string | null;
  preset?: boolean; confirmedBy?: number | null; confirmedAt?: string | null;
  mocQuyChe?: string | null; nhomBoTro?: string | null; hanKeHoach?: string | null;
  idempotencyKey?: string | null; createdAt?: string;
};

const COT = ['case_id', 'kind', 'description', 'so_buoi', 'performer_user_id', 'performer_name', 'recorded_by', 'status',
  'planned_date', 'started_date', 'completed_date', 'followup_due', 'action_due', 'cycle_no', 'cycle_started_on',
  'needs_approval', 'approval_state', 'approval_due', 'reschedule_target', 'preset', 'confirmed_by', 'confirmed_at',
  'moc_quy_che', 'nhom_bo_tro', 'han_ke_hoach', 'idempotency_key', 'created_at'];

function giaTri(x: DongPa, luc: string): unknown[] {
  const ten = (x.performerName ?? '').trim() || null;
  if (x.performerUserId && ten) throw badRequest('Người dạy: chọn tài khoản hoặc ghi tên, không cả hai.');
  const loi = coSoBuoi(x.kind) ? kiemSoBuoiPa(x.soBuoi) : null;
  if (loi) throw badRequest(`Số buổi: ${loi}.`);
  const nguoi = coNguoiDay(x.kind);
  return [x.caseId, x.kind, x.description, coSoBuoi(x.kind) ? soBuoiTu(x.soBuoi) : null,
    nguoi ? x.performerUserId ?? null : null, nguoi ? ten : null, x.recordedBy ?? null, x.status,
    x.plannedDate ?? null, x.startedDate ?? null, x.completedDate ?? null, x.followupDue ?? null, x.actionDue ?? null, 1, x.cycleStartedOn ?? null,
    x.needsApproval ? 1 : 0, x.approvalState ?? null, x.approvalDue ?? null, x.rescheduleTarget ?? null,
    x.preset ? 1 : 0, x.confirmedBy ?? null, x.confirmedAt ?? null,
    x.mocQuyChe ?? null, x.nhomBoTro ?? null, x.hanKeHoach ?? null, x.idempotencyKey ?? null, x.createdAt ?? luc];
}

/** Chèn THEO LÔ (≤ 900 tham số mỗi câu). Kiểm MỌI dòng trước khi ghi — một dòng sai thì không dòng nào được ghi. Trả id theo thứ tự `dong`. */
export function chenPa(conn: any, dong: readonly DongPa[]): number[] {
  const luc = nowIso();
  const rows = dong.map((x) => giaTri(x, luc));
  const ids: number[] = [];
  const mot = `(${COT.map(() => '?').join(',')})`;
  theoLo(rows, (lo) => {
    /* Rowid tự tăng theo thứ tự VALUES; RETURNING không hứa thứ tự → sắp lại. */
    const r = (conn.prepare(`INSERT INTO case_interventions (${COT.join(', ')}) VALUES ${lo.map(() => mot).join(',')} RETURNING id`)
      .all(...lo.flat()) as any[]).map((x) => Number(x.id)).sort((a, b) => a - b);
    ids.push(...r);
  }, Math.floor(THAM_SO_TOI_DA / COT.length));
  return ids;
}
