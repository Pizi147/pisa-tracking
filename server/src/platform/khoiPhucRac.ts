import { db } from '../db.ts';
import { conflict, forbidden } from '../util.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { dongBoTrangThaiCase } from '../cases/sosState.ts';
import { loadCase } from '../cases/cases.ts';
import { EDIT_VIOLATION_MESSAGE, canEditViolation, requireViewStudent } from '../yThuc/access.ts';
import { chotHanXuLy } from '../yThuc/trangThai.ts';
import { ownerAccess } from './attachments.ts';
import { GIU_NGAY, docMucRac, khoiPhucMuc, kiemGoc, type DuLieuRac, type MucRac } from './thungRac.ts';

/**
 * Q-RL2a — quyền + đồng bộ khi KHÔI PHỤC một mục thùng rác. Quyền như thao tác GỐC, xét theo bản ghi cha HIỆN TẠI (đã so dấu nhận diện — `kiemGoc`):
 * Case: Quản lý của học viên; PA: Quản lý trong phạm vi Case; vi phạm: người ghi · GVCN · Quản lý của học viên; tệp: quyền gỡ tệp của bản ghi chủ.
 * Danh sách "Đã xoá" (Quản trị) chỉ hiện mục người xem khôi phục được (Quản trị: mọi mục, kể cả đã khôi phục / hết hạn).
 */
const BANG_CHINH: Record<MucRac['loai'], string> = { case: 'sos_cases', pa: 'case_interventions', vi_pham: 'violations', tep: 'attachments' };
const duLieu = (m: MucRac) => JSON.parse(m.du_lieu) as DuLieuRac;
const dongGoc = (m: MucRac, bang: string) => duLieu(m).ban.find((b) => b.k === 'xoa' && b.bang === bang)?.dong[0] as any;

function kiemQuyen(p: Principal, m: MucRac): void {
  if (m.loai === 'case') {
    require_(p, PERMISSIONS.CASE_APPROVE, { studentId: dongGoc(m, 'sos_cases').student_id }, 'Chỉ Quản lý khôi phục được Case.');
  } else if (m.loai === 'pa') {
    const c = loadCase(dongGoc(m, 'case_interventions').case_id);   // Case HIỆN TẠI (đã so dấu — đúng Case lúc xoá)
    require_(p, PERMISSIONS.CASE_APPROVE, { classId: c.class_id, studentId: c.eff_student_id }, 'Chỉ Quản lý khôi phục được PA.');
  } else if (m.loai === 'vi_pham') {
    const v = dongGoc(m, 'violations');
    requireViewStudent(p, v.student_id);
    if (!canEditViolation(p, v)) throw forbidden(EDIT_VIOLATION_MESSAGE);
  } else {
    const a = dongGoc(m, 'attachments');
    const q = ownerAccess(a.owner_type, a.owner_id);
    if (q.requireRemove) q.requireRemove(p, a.uploaded_by); else q.requireEdit(p);
  }
}
/** Gốc còn đúng + có quyền (danh sách chỉ đọc — lỗi nào cũng là "không khôi phục được"). */
const coQuyen = (p: Principal, m: MucRac) => { try { kiemGoc(db(), duLieu(m)); kiemQuyen(p, m); return true; } catch { return false; } };

export function khoiPhucRac(p: Principal, id: number): { ok: true; loai: string; doiTuongId: number } {
  const m = docMucRac(id);
  if (!m.het_han_luc && !m.khoi_phuc_luc) {
    kiemGoc(db(), duLieu(m));   // trước quyền: quyền xét theo bản ghi cha — phải đúng bản ghi lúc xoá
    kiemQuyen(p, m);
    if (m.loai === 'pa') {
      if (loadCase(dongGoc(m, 'case_interventions').case_id).status === 'done') throw conflict('Case đã hoàn thành — Mở lại Case trước khi khôi phục PA.');   // cùng chặn của Xoá PA
    }
  }
  const moiId = khoiPhucMuc(p.userId, m, BANG_CHINH[m.loai], () => {
    if (m.loai === 'pa') dongBoTrangThaiCase(dongGoc(m, 'case_interventions').case_id);
    if (m.loai === 'vi_pham') chotHanXuLy([dongGoc(m, 'violations').student_id]);
  });
  return { ok: true, loai: m.loai, doiTuongId: moiId };
}

/** Quản trị › Đã xoá: mục trong `GIU_NGAY` ngày (cả đã khôi phục — lịch sử), mới trước; Quản trị thấy mọi mục, người khác chỉ mục mình khôi phục được. */
export function danhSachRac(p: Principal) {
  const moc = new Date(Date.now() - (GIU_NGAY + 1) * 86_400_000).toISOString();
  const quanTri = can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true });
  const ds = db().prepare(`SELECT t.*, u1.full_name AS ten_xoa, u2.full_name AS ten_khoi_phuc FROM thung_rac t
      LEFT JOIN users u1 ON u1.id = t.xoa_boi LEFT JOIN users u2 ON u2.id = t.khoi_phuc_boi
      WHERE t.xoa_luc >= ? ORDER BY t.id DESC`).all(moc) as (MucRac & { ten_xoa: string | null; ten_khoi_phuc: string | null })[];
  /* Lọc quyền TRƯỚC, giới hạn 300 SAU — mục của người xem không bị mục ngoài phạm vi đẩy khỏi danh sách. */
  return ds.flatMap((m) => {
    const duoc = !m.khoi_phuc_luc && !m.het_han_luc && coQuyen(p, m);
    if (!duoc && !quanTri) return [];
    return [{ id: m.id, loai: m.loai, nhan: m.nhan, hocVienId: m.hoc_vien_id, xoaBoi: m.ten_xoa, xoaLuc: m.xoa_luc,
      khoiPhucBoi: m.ten_khoi_phuc, khoiPhucLuc: m.khoi_phuc_luc, hetHanLuc: m.het_han_luc,
      xoaHanLuc: new Date(Date.parse(m.xoa_luc) + GIU_NGAY * 86_400_000).toISOString(), khoiPhucDuoc: duoc }];
  }).slice(0, 300);
}
