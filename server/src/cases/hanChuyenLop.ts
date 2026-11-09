/**
 * EM CHUYỂN LỚP — ĐẶT LẠI HẠN VIỆC TUYẾN CASE (chủ SP 10/11, spec sổ nghĩa vụ 1.2 b): "GV lớp cũ chịu việc nếu quá hạn thì tính quá hạn, sang GV mới reset lại hạn
 * theo luật và để GV mới làm, còn nếu GV cũ chưa làm mà chưa đến hạn thì thôi không tính, nhưng sang GV mới cũng reset lại hạn".
 * Gọi ngay sau khi Case đổi chủ vì chuyển lớp (ba đường: `doiChuTheoLopMoi` K8, lộ trình `luatLoTrinh`, cuối khoá `cuoiKhoa`). Việc còn mở của Case
 * (cùng điều kiện đặt lại hạn `viecCaseQuaHan`) → hạn MỚI theo luật của loại việc tính từ ngày chuyển:
 *   Xác nhận / Mô tả Case, Xác nhận PA — `hanXacNhan(ngày, mức SOS)` · Thêm PA — `planDueDate(ngày, mức gấp)` · Kết quả PA — `hanKyGhiKetQua(ngày)`.
 * Mỗi việc một dòng `viec_han_lan` (loai `chuyen_lop:<cột>`, hạn cũ → mới, `nguoi_cu`, `ngay`) — sổ nghĩa vụ dựng dòng "GV cũ" từ đây (quá hạn lúc chuyển → Chưa làm,
 * chưa tới hạn → không tính `chuyen-lop`). Mini Test không đặt lại (người giữ là GVCN lớp đang học — đi theo em).
 */
import { db } from '../db.ts';
import { nowIso } from '../util.ts';
import { hanKyGhiKetQua, planDueDate, urgencyFromSos } from '../../../shared/domain/index.ts';
import { hanXacNhan } from '../../../shared/domain/sosV4.ts';
import { viecCaseQuaHan } from '../migrate/prResetHanCase.ts';

const COT = {
  'reset_case:han_xac_nhan': ['sos_cases', 'han_xac_nhan', 'chuyen_lop:han_xac_nhan'],
  'reset_case:han_them_pa': ['sos_cases', 'han_them_pa', 'chuyen_lop:han_them_pa'],
  'reset_case:action_due': ['case_interventions', 'action_due', 'chuyen_lop:action_due'],
} as const;

export function datLaiHanKhiChuyenLop(ds: readonly { caseId: number; nguoiCu: number | null }[], ngay: string, boi: number | null, luc = nowIso()): number {
  if (!ds.length) return 0;
  const conn = db();
  const cu = new Map(ds.map((x) => [x.caseId, x.nguoiCu]));
  const ca = new Map((conn.prepare(`SELECT sc.id, sc.sos_level, sc.urgency, COALESCE(cl.is_fast_track, 1) AS ft FROM sos_cases sc
      LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id LEFT JOIN classes cl ON cl.id = a.class_id WHERE sc.id IN (SELECT value FROM json_each(?))`)
    .all(JSON.stringify([...cu.keys()])) as any[]).map((r) => [r.id as number, r]));
  const paCua = new Map((conn.prepare(`SELECT id, case_id FROM case_interventions WHERE case_id IN (SELECT value FROM json_each(?))`)
    .all(JSON.stringify([...cu.keys()])) as any[]).map((r) => [r.id as number, r.case_id as number]));
  const ghi = conn.prepare(`INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, mac_dinh, boi, luc, nguoi_cu, ngay) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`);
  let n = 0;
  for (const v of viecCaseQuaHan(conn, ngay, [...cu.keys()])) {
    if (!(v.loai in COT)) continue;
    const [bang, cot, loai] = COT[v.loai as keyof typeof COT];
    const caseId = v.loai === 'reset_case:action_due' ? paCua.get(v.id)! : v.id;
    const c = ca.get(caseId);
    const moi = v.loai === 'reset_case:han_xac_nhan' ? hanXacNhan(ngay, { sosLevel: c?.sos_level ?? null, urgency: c?.urgency ?? null, thuong: c ? !c.ft : false })
      : v.loai === 'reset_case:han_them_pa' ? planDueDate(ngay, c?.urgency ?? urgencyFromSos(c?.sos_level ?? null))
      : hanKyGhiKetQua(ngay);
    if (moi === v.han) continue;
    conn.prepare(`UPDATE ${bang} SET ${cot} = ? WHERE id = ?`).run(moi, v.id);
    ghi.run(loai, v.id, v.han, moi, boi, luc, cu.get(caseId) ?? null, ngay);
    n += 1;
  }
  return n;
}
