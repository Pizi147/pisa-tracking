/**
 * VAI-0 (N74, chủ SP 26/11): NGƯỜI NHẬN VIỆC TỰ ĐỘNG — mỗi việc tự sinh về MỘT người (không giao "cả vai"). Tệp lá (chỉ import db).
 *  1. Việc xếp lịch (BPXL) có lớp → CVXL đã nhận lớp đó (`lop_xep_lich`, N77) nếu còn hoạt động + còn vai BPXL.
 *  2. Nhóm người giữ vai ĐÚNG chi nhánh (grant `branch_id = cn`; grant toàn hệ thống = lead, KHÔNG nhận) → người ít việc mở nhất; hoà → được gán sớm hơn.
 *  3. Không ai → null (nơi gọi lùi tiếp theo luật của việc: TVV của em / Head…).
 * "Ít việc mở" chỉ đếm dòng đã lưu người (`phu_trach_id` / `nguoi_luat` / `assignee_user_id`) — một câu; việc tính lúc đọc không đếm.
 */
import { db } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { LUOT_SAU_THI_SQL } from '../students/tamDung.ts';
import { CN_EM } from './hieuLuc.ts';

/** Người còn hoạt động + còn vai BPXL (bất kỳ chi nhánh) — người nhận lớp đã nghỉ / gỡ vai không hiện, lớp như chưa ai nhận. */
export const CON_VAI_BPXL = (u: string) => `EXISTS (SELECT 1 FROM user_roles ur_ JOIN roles r_ ON r_.id = ur_.role_id JOIN users u_ ON u_.id = ur_.user_id WHERE ur_.user_id = ${u}
  AND r_.key = 'scheduler' AND ur_.status = 'active' AND u_.status = 'active' AND u_.deleted_at IS NULL)`;
/** VAI-0: em (bí danh `s`) chưa có TVV CÒN HIỆU LỰC — chưa gán, hoặc TVV không còn vai TVV ở chi nhánh em (như `tvvConVai`, viecTvv.ts). */
export const KHONG_TVV_SQL = (s: string) => `(${s}.consultant_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM user_roles t_ JOIN roles tr_ ON tr_.id = t_.role_id JOIN users tu_ ON tu_.id = t_.user_id
  WHERE t_.user_id = ${s}.consultant_user_id AND tr_.key = 'consultant' AND t_.status = 'active' AND tu_.status = 'active' AND tu_.deleted_at IS NULL
    AND (t_.branch_id IS NULL OR t_.branch_id = ${CN_EM(`${s}.id`)})))`;
const HOAT_DONG = `u.status = 'active' AND u.deleted_at IS NULL AND ur.status = 'active'`;

/** Người giữ vai `vai` ĐÚNG chi nhánh `cn` (không tính grant toàn hệ thống), sắp theo lúc được gán (sớm trước). Nhớ theo request. */
export function nhomVaiCn(vai: string, cn: number): number[] {
  return nho(`nguoi-nhan:nhom:${vai}:${cn}`, () => (db().prepare(
    `SELECT ur.user_id AS u, MIN(ur.created_at) AS luc, MIN(ur.id) AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = ? AND ur.branch_id = ? AND ${HOAT_DONG} GROUP BY ur.user_id ORDER BY luc, id`,
  ).all(vai, cn) as { u: number }[]).map((r) => r.u));
}


/** Dòng việc mở còn là việc (không theo lượt đã huỷ / lượt sau thi thật — N46): bí danh lượt `pa` (LEFT JOIN, NULL = việc không theo lượt). */
const CON_VIEC = (pa: string) => `(${pa}.id IS NULL OR (${pa}.status != 'cancelled' AND NOT ${LUOT_SAU_THI_SQL(pa)}))`;
/** Số việc mở mỗi người (đã lưu người) — MỘT câu cho cả nhóm; dòng "mở" đã chết (lượt huỷ, sau thi thật) không tính. */
function soViecMo(ids: readonly number[]): Map<number, number> {
  const ds = JSON.stringify(ids);
  const MP = `FROM meeting_phan mp JOIN sos_coordination_actions mx ON mx.id = mp.phoi_hop_id LEFT JOIN assessment_attempts pa ON pa.id = mx.attempt_id WHERE mp.trang_thai = 'mo' AND ${CON_VIEC('pa')}`;
  const VIEC_TVV = `FROM viec_bao_ph v LEFT JOIN sos_coordination_actions bx ON bx.id = v.phoi_hop_id LEFT JOIN assessment_attempts pa ON pa.id = bx.attempt_id WHERE v.trang_thai = 'mo' AND ${CON_VIEC('pa')}`;
  const rows = db().prepare(`SELECT nguoi, COUNT(*) AS n FROM (
      SELECT mp.phu_trach_id AS nguoi ${MP} AND mp.phu_trach_id IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT mp.nguoi_luat ${MP} AND mp.phu_trach_id IS NULL AND mp.nguoi_luat IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT v.phu_trach_id ${VIEC_TVV} AND v.phu_trach_id IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT v.nguoi_luat ${VIEC_TVV} AND v.phu_trach_id IS NULL AND v.nguoi_luat IN (SELECT value FROM json_each(?1))
        AND EXISTS (SELECT 1 FROM students s WHERE s.id = v.student_id AND ${KHONG_TVV_SQL('s')})   -- chỉ việc Lead TVV đang giữ thật (em chưa có TVV)
      UNION ALL SELECT x.phu_trach_id FROM sos_coordination_actions x LEFT JOIN assessment_attempts pa ON pa.id = x.attempt_id
        WHERE x.status = 'pending' AND ${CON_VIEC('pa')} AND x.phu_trach_id IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT phu_trach_id FROM tinh_hinh_hoc_tap WHERE trang_thai = 'mo' AND phu_trach_id IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT assignee_user_id FROM tasks WHERE progress NOT IN ('done', 'stopped') AND assignee_user_id IN (SELECT value FROM json_each(?1))
      UNION ALL SELECT COALESCE(phu_trach_id, nguoi_luat) FROM viec_nhan_tin WHERE trang_thai = 'mo' AND COALESCE(phu_trach_id, nguoi_luat) IN (SELECT value FROM json_each(?1))   -- LPB-0
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

/**
 * Rà PTA #2266 (N74): chọn LẦN LƯỢT cho một lô việc sinh cùng lúc — đếm việc mở MỘT lần (`soViecMo`), mỗi lần chọn người ít việc nhất rồi cộng dần (hoà → gán sớm hơn).
 * Trả hàm chọn: gọi một lần mỗi việc của lô. Nhóm ≤ 1 người: 0 câu.
 */
export function chonLanLuot(ds: readonly number[]): () => number | null {
  if (ds.length <= 1) return () => ds[0] ?? null;
  const n = soViecMo(ds);
  return () => {
    let tot = ds[0];
    for (const u of ds) if ((n.get(u) ?? 0) < (n.get(tot) ?? 0)) tot = u;
    n.set(tot, (n.get(tot) ?? 0) + 1);
    return tot;
  };
}

/** CVXL đã nhận lớp (N77) — còn hoạt động + còn vai BPXL ở bất kỳ chi nhánh nào (BPXL xếp lịch mọi chi nhánh). */
export function cvxlCuaLop(lopId: number | null | undefined): number | null {
  if (!lopId) return null;
  return (db().prepare(`SELECT l.user_id AS u FROM lop_xep_lich l JOIN users u ON u.id = l.user_id WHERE l.class_id = ? AND u.status = 'active' AND u.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = l.user_id AND ur.status = 'active' AND r.key = 'scheduler')`).get(lopId) as any)?.u ?? null;
}

/** Người giữ vai Head / Quản trị / Lead TVV / GĐCN (mọi chi nhánh) — MỘT câu mỗi request; sắp theo lúc được gán. Kiểm "còn hiệu lực" lúc đọc, Head lùi một người. */
const giuVai = () => nho('nguoi-nhan:giu-vai', () => db().prepare(`SELECT r.key AS k, ur.user_id AS u, ur.branch_id AS b FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    JOIN users u ON u.id = ur.user_id WHERE r.key IN ('manager', 'system_admin', 'lead_consultant', 'branch_director') AND ${HOAT_DONG} ORDER BY ur.created_at, ur.id`).all() as { k: string; u: number; b: number | null }[]);
/** `u` còn giữ vai `vai` gán ĐÚNG chi nhánh `cn`. */
export const conVaiO = (u: number | null | undefined, vai: string, cn: number | null | undefined): boolean => !!u && !!cn && giuVai().some((x) => x.u === u && x.k === vai && x.b === cn);
/** PTA 28/11 (a): Head + GĐCN gán ĐÚNG chi nhánh `cn` (mọi người, như theo dõi Báo PH) — 0 câu (cùng tập `giuVai`). */
export const headGdcnO = (cn: number | null | undefined): { u: number; k: string }[] =>
  (cn ? giuVai().filter((x) => (x.k === 'manager' || x.k === 'branch_director') && x.b === cn).filter((x, i, a) => a.findIndex((y) => y.u === x.u) === i) : []);
/** N74: Head lùi MỘT người — Head gán chi nhánh sớm nhất → Head toàn hệ thống sớm nhất → Quản trị sớm nhất (như `ql` cũ nhưng một người). */
export function headCua(cn: number | null | undefined): number | null {
  const ds = giuVai();
  return (cn ? ds.find((x) => x.k === 'manager' && x.b === cn) : undefined)?.u ?? ds.find((x) => x.k === 'manager' && x.b === null)?.u ?? ds.find((x) => x.k === 'system_admin')?.u ?? null;
}

/** N74: người nhận MỘT việc tự sinh của vai `vai` ở chi nhánh `cn` (lớp `lopId` cho việc BPXL). null = không ai — nơi gọi lùi theo luật. */
export function nguoiNhanTuDong(vai: string, cn: number | null, o: { lopId?: number | null } = {}): number | null {
  if (vai === 'scheduler') { const c = cvxlCuaLop(o.lopId); if (c) return c; }
  return cn ? itViecNhat(nhomVaiCn(vai, cn)) : null;
}
