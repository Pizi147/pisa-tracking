/**
 * VAI-0 (N74, chủ SP 26/11): NGƯỜI NHẬN VIỆC TỰ ĐỘNG — mỗi việc tự sinh về MỘT người (không giao "cả vai"). Tệp lá (chỉ import db).
 *  1. Việc xếp lịch (BPXL) có lớp → CVXL đã nhận lớp đó (`lop_xep_lich`, N77) nếu còn hoạt động + còn vai BPXL.
 *  2. Nhóm người giữ vai ĐÚNG chi nhánh (grant `branch_id = cn`; grant toàn hệ thống = lead, KHÔNG nhận) → người ít việc mở nhất; hoà → được gán sớm hơn.
 *  3. Không ai → null (nơi gọi lùi tiếp theo luật của việc: TVV của em / Head…).
 * "Ít việc mở" chỉ đếm dòng đã lưu người (`phu_trach_id` / `nguoi_luat` / `assignee_user_id`) — một câu; việc tính lúc đọc không đếm.
 */
import { db } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';

const HOAT_DONG = `u.status = 'active' AND u.deleted_at IS NULL AND ur.status = 'active'`;

/** Người giữ vai `vai` ĐÚNG chi nhánh `cn` (không tính grant toàn hệ thống), sắp theo lúc được gán (sớm trước). Nhớ theo request. */
export function nhomVaiCn(vai: string, cn: number): number[] {
  return nho(`nguoi-nhan:nhom:${vai}:${cn}`, () => (db().prepare(
    `SELECT ur.user_id AS u, MIN(ur.created_at) AS luc, MIN(ur.id) AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = ? AND ur.branch_id = ? AND ${HOAT_DONG} GROUP BY ur.user_id ORDER BY luc, id`,
  ).all(vai, cn) as { u: number }[]).map((r) => r.u));
}

/** Người được gán sớm nhất của nhóm (lùi lúc ĐỌC — ổn định, không đếm việc). */
export const dauNhom = (vai: string, cn: number | null): number | null => (cn ? nhomVaiCn(vai, cn)[0] ?? null : null);

/** Số việc mở mỗi người (đã lưu người) — MỘT câu cho cả nhóm. */
function soViecMo(ids: readonly number[]): Map<number, number> {
  const ds = JSON.stringify(ids);
  const rows = db().prepare(`SELECT nguoi, COUNT(*) AS n FROM (
      SELECT COALESCE(phu_trach_id, nguoi_luat) AS nguoi FROM meeting_phan WHERE trang_thai = 'mo' AND COALESCE(phu_trach_id, nguoi_luat) IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT phu_trach_id FROM viec_bao_ph WHERE trang_thai = 'mo' AND phu_trach_id IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT phu_trach_id FROM sos_coordination_actions WHERE status = 'pending' AND phu_trach_id IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT phu_trach_id FROM tinh_hinh_hoc_tap WHERE trang_thai = 'mo' AND phu_trach_id IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT assignee_user_id FROM tasks WHERE progress NOT IN ('done', 'stopped') AND assignee_user_id IN (SELECT value FROM json_each(?1))
    ) GROUP BY nguoi`).all(ds) as { nguoi: number; n: number }[];
  return new Map(rows.map((r) => [r.nguoi, r.n]));
}

/** Người ít việc mở nhất trong `ds` (đã sắp theo lúc gán — hoà lấy người đầu). */
export function itViecNhat(ds: readonly number[]): number | null {
  if (ds.length <= 1) return ds[0] ?? null;
  const n = soViecMo(ds);
  let tot = ds[0];
  for (const u of ds) if ((n.get(u) ?? 0) < (n.get(tot) ?? 0)) tot = u;
  return tot;
}

/** CVXL đã nhận lớp (N77) — còn hoạt động + còn vai BPXL ở bất kỳ chi nhánh nào (BPXL xếp lịch mọi chi nhánh). */
export function cvxlCuaLop(lopId: number | null | undefined): number | null {
  if (!lopId) return null;
  return (db().prepare(`SELECT l.user_id AS u FROM lop_xep_lich l JOIN users u ON u.id = l.user_id WHERE l.class_id = ? AND u.status = 'active' AND u.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = l.user_id AND ur.status = 'active' AND r.key = 'scheduler')`).get(lopId) as any)?.u ?? null;
}

/** N74: người nhận MỘT việc tự sinh của vai `vai` ở chi nhánh `cn` (lớp `lopId` cho việc BPXL). null = không ai — nơi gọi lùi theo luật. */
export function nguoiNhanTuDong(vai: string, cn: number | null, o: { lopId?: number | null } = {}): number | null {
  if (vai === 'scheduler') { const c = cvxlCuaLop(o.lopId); if (c) return c; }
  return cn ? itViecNhat(nhomVaiCn(vai, cn)) : null;
}
