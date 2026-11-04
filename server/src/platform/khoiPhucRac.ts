import { db } from '../db.ts';
import { conflict, forbidden } from '../util.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { dongBoTrangThaiCase } from '../cases/sosState.ts';
import { cachXoaCase, loadCase, quyenXoaPa } from '../cases/cases.ts';
import { EDIT_VIOLATION_MESSAGE, canEditViolation, requireViewStudent } from '../yThuc/access.ts';
import { chotHanXuLy } from '../yThuc/trangThai.ts';
import { ownerAccess } from './attachments.ts';
import { GIU_NGAY, docMucRac, khoiPhucMuc, kiemGoc, type DuLieuRac, type MucRac } from './thungRac.ts';

/**
 * Q-RL2a — quyền + đồng bộ khi KHÔI PHỤC một mục thùng rác. Quyền như thao tác GỐC, xét theo bản ghi cha HIỆN TẠI (đã so dấu nhận diện — `kiemGoc`):
 * Case / PA: người xoá thẳng được (N37 `cachXoaCase` / `quyenXoaPa` = 'ngay' — Case hệ thống, PA quy chế: chỉ QL); vi phạm: người ghi · GVCN · Quản lý
 * của học viên; tệp: quyền gỡ tệp của bản ghi chủ.
 * Danh sách "Đã xoá" (Quản trị) chỉ hiện mục người xem khôi phục được (Quản trị: mọi mục, kể cả đã khôi phục / hết hạn).
 */
const BANG_CHINH: Record<MucRac['loai'], string> = { case: 'sos_cases', pa: 'case_interventions', ket_qua_pa: 'case_followups', vi_pham: 'violations', tep: 'attachments', hoc_vien: 'students' };
const duLieu = (m: MucRac) => JSON.parse(m.du_lieu) as DuLieuRac;
const dongGoc = (m: MucRac, bang: string) => duLieu(m).ban.find((b) => b.k === 'xoa' && b.bang === bang)?.dong[0] as any;

function kiemQuyen(p: Principal, m: MucRac): void {
  if (m.loai === 'hoc_vien') {
    /* Q-RL2b: như Xoá học viên (`CYCLE_EDIT` — Quản lý của em / Quản trị); em đã không còn nên xét theo lớp cuối / chi nhánh lúc xoá. */
    require_(p, PERMISSIONS.CYCLE_EDIT, m.class_id ? { classId: m.class_id } : { branchId: m.branch_id }, 'Chỉ Quản lý của học viên này hoặc Quản trị hệ thống mới khôi phục được học viên.');
  } else if (m.loai === 'case') {
    /* Case đã xoá: lớp lúc xoá (`m.class_id`), em + kỹ năng + nguồn từ bản chụp; PA của Case trong cùng mục. */
    const sc = dongGoc(m, 'sos_cases');
    const pas = duLieu(m).ban.filter((b) => b.k === 'xoa' && b.bang === 'case_interventions').flatMap((b) => b.dong);
    if (cachXoaCase(p, { ...sc, eff_student_id: sc.student_id ?? m.hoc_vien_id, class_id: m.class_id }, pas) !== 'ngay') {
      throw forbidden('Chỉ Quản lý hoặc người xoá được Case này mới khôi phục được.');
    }
  } else if (m.loai === 'pa') {
    const c = loadCase(dongGoc(m, 'case_interventions').case_id);   // Case HIỆN TẠI (đã so dấu — đúng Case lúc xoá)
    if (quyenXoaPa(p, dongGoc(m, 'case_interventions'), c) !== 'ngay') throw forbidden('Chỉ Quản lý hoặc người xoá được PA này mới khôi phục được.');
  } else if (m.loai === 'ket_qua_pa') {
    /* VIEC-SAU-LOGIC: như Xoá kết quả PA (`quyenXoaPa` = 'ngay') theo PA HIỆN TẠI; xoá lần GẦN NHẤT (PA đã về trước) mà PA đã ghi lần mới → không khôi phục (PA đã đi tiếp). */
    const f = dongGoc(m, 'case_followups');
    const iv = db().prepare('SELECT * FROM case_interventions WHERE id = ?').get(f.intervention_id) as any;
    if (quyenXoaPa(p, iv, loadCase(iv.case_id)) !== 'ngay') throw forbidden('Chỉ Quản lý hoặc người xoá được kết quả PA này mới khôi phục được.');
    const paDaDao = duLieu(m).ban.some((b) => b.k === 'sua' && b.bang === 'case_interventions');   // lần xoá đã đưa PA về trước lần ghi
    /* So theo lúc ghi, không theo id: id đã xoá có thể được lần ghi mới dùng lại (không AUTOINCREMENT). */
    if (paDaDao && db().prepare('SELECT 1 FROM case_followups WHERE intervention_id = ? AND created_at >= ? LIMIT 1').get(iv.id, m.xoa_luc)) {
      throw conflict('PA đã có kết quả ghi sau — không khôi phục được kết quả cũ này.');
    }
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
  }
  const moiId = khoiPhucMuc(p.userId, m, BANG_CHINH[m.loai], (conn) => {
    if (m.loai === 'pa') dongBoTrangThaiCase(dongGoc(m, 'case_interventions').case_id);
    if (m.loai === 'ket_qua_pa') dongBoTrangThaiCase(dongGoc(m, 'case_followups').case_id);   // N37: Case đã hoàn thành giữ nguyên (xoá PA không chặn Case xong)
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
