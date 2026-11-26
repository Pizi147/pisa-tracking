/**
 * VAI-0 (N77, chủ SP 26/11): "cho tất cả các CVXL được tự chủ động gán mình vào một lớp để xếp, và phụ trách tất cả các CV liên quan đến lớp đó, lớp nào chưa gán,
 * thì giao cho người ít việc nhất trong cùng CN" — MỘT lớp MỘT CVXL (`lop_xep_lich`).
 *  · Tự nhận / nhận lại lớp người khác (không khoá): BPXL bất kỳ chi nhánh (BPXL xếp lịch mọi chi nhánh). Bỏ nhận: chính người đang nhận.
 *  · Gán / đổi / bỏ hộ: Head / GĐCN / Quản trị của lớp (`class.assign`) hoặc lead BPXL (BPXL toàn hệ thống). Người được gán phải có vai BPXL.
 *  · Việc BPXL đang mở của lớp chưa ai chuyển tay (phần Xếp lịch họp của em đang học lớp, `phu_trach_id` NULL) chuyển theo người mới (`nguoi_luat`); bỏ nhận → chốt lại
 *    theo N74. Người cũ nhận một tin "Cập nhật". Hoàn tác (người đã đổi hoặc người đổi được, 15 phút) trả đúng từng dòng.
 */
import { db, tx } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { badRequest, conflict, forbidden, notFound } from '../util.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { GhiDao, HOAN_TAC_PHUT, daoLai, luuGhiDao, timGhiDao } from '../platform/ghiDao.ts';
import { chotNguoiLuatMeeting } from '../worklist/giaoViec.ts';
import { CON_VAI_BPXL } from '../worklist/nguoiNhan.ts';
import { chotNguoiNhanTin } from './lienPhongBan.ts';

const LOAI = 'xep_lich_lop';
/** Ai xem được người nhận lớp: ai xem / xếp được lịch lớp (BPXL mọi chi nhánh — N77). */
export const xemDuocXepLich = (p: Principal, classId: number) => can(p, PERMISSIONS.ATTEMPT_VIEW, { classId }) || can(p, PERMISSIONS.PLAN_WEEK, { classId });
export type XepLichLop = { userId: number; ten: string } | null;

const laBpxl = (uid: number) => !!db().prepare(`SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
    WHERE ur.user_id = ? AND r.key = 'scheduler' AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL`).get(uid);
const laLeadBpxl = (p: Principal) => p.grants.some((g) => g.roleKey === 'scheduler' && g.branchId === null);
const coVaiBpxl = (p: Principal) => p.grants.some((g) => g.roleKey === 'scheduler');
/** Gán / đổi người khác cho lớp: Head / GĐCN / Quản trị của lớp hoặc lead BPXL. */
export const ganHoDuoc = (p: Principal, classId: number) => laLeadBpxl(p) || can(p, PERMISSIONS.CLASS_ASSIGN, { classId });

export function xemXepLich(classId: number): XepLichLop {
  const r = db().prepare(`SELECT l.user_id, u.full_name FROM lop_xep_lich l JOIN users u ON u.id = l.user_id WHERE l.class_id = ? AND ${CON_VAI_BPXL('l.user_id')}`).get(classId) as any;
  return r ? { userId: r.user_id, ten: r.full_name } : null;
}

/** Phần Xếp lịch họp đang mở theo luật (chưa chuyển tay) của em đang học lớp — chuyển theo CVXL của lớp. */
const PHAN_CUA_LOP = `SELECT mp.id FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id
   JOIN enrollments e ON e.student_id = x.student_id AND e.status = 'active' AND e.class_id = ?
  WHERE mp.phan = 'xep_lich' AND mp.trang_thai = 'mo' AND mp.phu_trach_id IS NULL`;

/** `userId` = người nhận (null = bỏ nhận) · `cu` = người đang thấy (null = chưa ai) — khác → 409. */
/** VAI-1 (mockup v29 V2a): hộp gán hộ — mọi BPXL đang hoạt động (BPXL xếp lịch mọi chi nhánh), kèm mã chi nhánh gán ("" = toàn hệ thống). */
export function dsBpxl(): { id: number; ten: string; chiNhanh: string }[] {
  return (db().prepare(`SELECT u.id, u.full_name AS ten, COALESCE(GROUP_CONCAT(b.code, ', '), '') AS cn FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      JOIN users u ON u.id = ur.user_id LEFT JOIN branches b ON b.id = ur.branch_id
     WHERE r.key = 'scheduler' AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL
     GROUP BY u.id ORDER BY u.full_name, u.id`).all() as any[]).map((r) => ({ id: r.id, ten: r.ten, chiNhanh: r.cn }));
}

export function ganXepLich(p: Principal, classId: number, body: { userId?: unknown; cu?: unknown }): { xepLich: XepLichLop; hoanTac: number | null; soViec?: number } {
  if (!Number.isInteger(classId) || classId <= 0) throw badRequest('Lớp không hợp lệ.');
  const lop = db().prepare(`SELECT id, code, status FROM classes WHERE id = ?`).get(classId) as any;
  if (!lop) throw notFound('Không tìm thấy lớp.');
  if (!('cu' in body)) throw badRequest('Thiếu người đang nhận lớp — mở lại rồi thử lại.');
  const moi = body.userId == null || body.userId === '' ? null : Number(body.userId);
  const cu = body.cu == null || body.cu === '' ? null : Number(body.cu);
  if (moi !== null && (!Number.isInteger(moi) || moi <= 0)) throw badRequest('Người nhận không hợp lệ.');
  const hienTai = xemXepLich(classId);
  if ((hienTai?.userId ?? null) !== cu) throw conflict('Lớp vừa được người khác nhận — mở lại để xem.');
  if (moi === cu) return { xepLich: hienTai, hoanTac: null };
  const tuLam = moi === p.userId ? coVaiBpxl(p) : moi === null && cu === p.userId;
  if (!tuLam && !ganHoDuoc(p, classId)) throw forbidden('Chỉ BPXL tự nhận lớp; Head, GĐCN, Quản trị hoặc lead BPXL gán hộ được.');
  if (moi !== null && !laBpxl(moi)) throw badRequest('Người được gán không có vai BPXL đang hoạt động.');
  if (moi !== null && lop.status !== 'active') throw badRequest('Lớp đã kết thúc — không nhận lớp mới.');
  return tx(() => {
    if ((xemXepLich(classId)?.userId ?? null) !== cu) throw conflict('Lớp vừa được người khác nhận — mở lại để xem.');   // đọc lại trong giao dịch
    const tho = db().prepare('SELECT user_id FROM lop_xep_lich WHERE class_id = ?').get(classId) as { user_id: number } | undefined;   // kể cả người đã mất vai
    const g = new GhiDao(db());
    const phan = (db().prepare(PHAN_CUA_LOP).all(classId) as { id: number }[]).map((r) => r.id);
    if (phan.length) g.sua('meeting_phan', `id IN (${phan.map(() => '?').join(',')})`, ...phan);
    /* LPB-0 (rà PTA #2266 P1-2, N77): việc BPXL Nhận thông tin đang mở của lớp, chưa ai chuyển tay → người mới (bỏ nhận → chốt lại theo N74); Hoàn tác trả lại. */
    const nt = (db().prepare(`SELECT id FROM viec_nhan_tin WHERE class_id = ? AND trang_thai = 'mo' AND phu_trach_id IS NULL`).all(classId) as { id: number }[]).map((r) => r.id);
    if (nt.length) g.sua('viec_nhan_tin', `id IN (${nt.map(() => '?').join(',')})`, ...nt);
    const luc = new Date().toISOString();
    if (moi === null) {
      g.xoa('lop_xep_lich', 'class_id = ?', classId);
      db().prepare('DELETE FROM lop_xep_lich WHERE class_id = ?').run(classId);
    } else if (tho) {
      /* Có dòng: người đang nhận (`cu`) hoặc người cũ đã nghỉ / gỡ vai BPXL (ẩn, `cu` = null) — ghi đè đúng dòng đã đọc (rà PTA: không kẹt lớp). */
      g.sua('lop_xep_lich', 'class_id = ?', classId);
      if (!db().prepare('UPDATE lop_xep_lich SET user_id = ?, gan_boi = ?, gan_luc = ? WHERE class_id = ? AND user_id = ?').run(moi, p.userId, luc, classId, tho.user_id).changes) {
        throw conflict('Lớp vừa được người khác nhận — mở lại để xem.');
      }
    } else {
      g.theoDoi('lop_xep_lich', 'class_id = ?', [classId], () =>
        db().prepare('INSERT INTO lop_xep_lich (class_id, user_id, gan_boi, gan_luc) VALUES (?, ?, ?, ?) ON CONFLICT(class_id) DO NOTHING').run(classId, moi, p.userId, luc));
      if (xemXepLich(classId)?.userId !== moi) throw conflict('Lớp vừa được người khác nhận — mở lại để xem.');
    }
    if (phan.length) {
      if (moi !== null) db().prepare(`UPDATE meeting_phan SET nguoi_luat = ? WHERE id IN (${phan.map(() => '?').join(',')})`).run(moi, ...phan);
      else chotNguoiLuatMeeting(phan);
    }
    if (nt.length) chotNguoiNhanTin(nt, moi);
    g.boKhongDoi('meeting_phan');
    g.boKhongDoi('viec_nhan_tin');
    const gid = luuGhiDao(db(), { loai: LOAI, bang: 'classes', id: classId, nguoi: p.userId, ghi: g });
    const aid = writeAudit({ actorUserId: p.userId, action: moi === null ? 'xep_lich_lop.bo' : 'xep_lich_lop.nhan', entityType: 'classes', entityId: classId, entityLabel: lop.code,
      before: { cvxl: cu }, after: { cvxl: moi, soViec: phan.length + nt.length } });
    if (cu && cu !== p.userId && cu !== moi) {
      notify({ userId: cu, kind: 'cap_nhat', title: `Lớp ${lop.code}: ${moi ? 'người khác đã nhận xếp lịch' : 'đã bỏ bạn khỏi xếp lịch'}`,
        body: phan.length + nt.length ? `${phan.length + nt.length} việc xếp lịch đang mở đã chuyển.` : null, entityType: 'classes', entityId: classId, dedupKey: `xep-lich-lop:${aid}` });
    }
    if (moi && moi !== p.userId) {
      notify({ userId: moi, kind: 'cap_nhat', title: `Bạn được gán xếp lịch lớp ${lop.code}`, body: null, entityType: 'classes', entityId: classId, dedupKey: `xep-lich-lop:${aid}:moi` });
    }
    return { xepLich: xemXepLich(classId), hoanTac: gid, soViec: phan.length };   // VAI-1: toast "n việc Xếp lịch họp chuyển theo"
  });
}

/** Hoàn tác lần nhận / đổi / bỏ gần nhất (trong `HOAN_TAC_PHUT` phút) — người đã đổi hoặc người gán hộ được; 409 khi sau đó đã đổi tiếp. */
export function hoanTacXepLich(p: Principal, classId: number): { xepLich: XepLichLop } {
  const g = timGhiDao(db(), LOAI, 'classes', classId);
  if (!g) throw conflict('Không có lần nhận lớp nào để hoàn tác.');
  if (Date.now() - Date.parse(g.luc) > HOAN_TAC_PHUT * 60_000) throw conflict('Quá thời gian hoàn tác — nhận / gán lại trực tiếp.');
  if (g.nguoi !== p.userId && !ganHoDuoc(p, classId)) throw forbidden('Chỉ người đã đổi, Head, GĐCN, Quản trị hoặc lead BPXL hoàn tác được.');
  tx(() => {
    daoLai(db(), g, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'xep_lich_lop.hoan_tac', entityType: 'classes', entityId: classId, entityLabel: null, before: null, after: xemXepLich(classId) });
  });
  return { xepLich: xemXepLich(classId) };
}
