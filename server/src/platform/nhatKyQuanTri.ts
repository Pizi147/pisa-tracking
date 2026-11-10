/**
 * QTV2-QUYEN — NHẬT KÝ CHUNG của Quản trị (chủ SP 11/11, spec `2026-11-11-quan-tri-v2-design.md` mục 5.8): mọi lần đổi tài khoản, quyền, cấu hình
 * trong `audit_logs`, lọc theo MỤC (tab Quản trị) · người · khoảng ngày; 50 dòng / trang. Thay 40 dòng nhật ký + 6 câu `COUNT(*)` + đọc mọi tài khoản
 * của `/admin/overview` cũ.
 * Quyền: mục tài khoản / quyền / mở sửa lịch — chỉ Quản trị hệ thống; mục cấu hình (chương trình, chi nhánh, bảng quy đổi…) — thêm vai Quản lý (xem).
 * Đọc: lọc `entity_type IN (…)` — đi chỉ mục `idx_audit_entity`, không quét cả `audit_logs`.
 */
import { db } from '../db.ts';
import { can, type Principal } from '../permissions.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { badRequest, forbidden } from '../util.ts';
import { xemDuocBangQuyDoi } from './bangQuyDoi.ts';

export const MUC_NHAT_KY = ['tai-khoan', 'quyen', 'mo-sua-lich', 'chuong-trinh', 'chi-nhanh', 'band'] as const;
export type MucNhatKy = (typeof MUC_NHAT_KY)[number];
/** `entity_type` mỗi mục ghi (kiểm trong mã: accounts / xoaTaiKhoan `users` + `user`, sysconfig `role` · `routes` · `programmes` · `branch`, moSuaLichTest `cai_dat`, bangQuyDoi). */
export const ENTITY_CUA_MUC: Record<MucNhatKy, string[]> = {
  'tai-khoan': ['users', 'user'], quyen: ['role'], 'mo-sua-lich': ['cai_dat'],
  'chuong-trinh': ['routes', 'programmes'], 'chi-nhanh': ['branch'], band: ['bang_quy_doi'],
};
const CHI_QUAN_TRI: ReadonlySet<MucNhatKy> = new Set(['tai-khoan', 'quyen', 'mo-sua-lich']);
const TRANG = 50;

/** Tên trường hay gặp trong before / after — còn lại giữ khoá gốc. */
const TEN_TRUONG: Record<string, string> = {
  name: 'Tên', fullName: 'Họ tên', email: 'Email', phone: 'Số điện thoại', title: 'Chức danh', diaChi: 'Địa chỉ', soDienThoai: 'Số điện thoại',
  status: 'Trạng thái', weeks: 'Số tuần', nguongDat: 'Đạt từ', lapMoiTuan: 'Checkpoint mỗi', lichMt: 'Lịch MT', roles: 'Vai trò', skills: 'Kỹ năng',
  granted: 'Có quyền', permission: 'Quyền', bat: 'Bật', scoring: 'Cách chấm', trangThai: 'Trạng thái', soNguoiAnhHuong: 'Số tài khoản ảnh hưởng',
};
const chu = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : typeof v === 'object' ? JSON.stringify(v) : String(v));
/** Quyền vai ghi before = 'có' / 'không' (chuỗi) — đặt cùng khoá với `after.trangThai` để so được. */
const docJson = (s: string | null): Record<string, unknown> => { try { const v = s ? JSON.parse(s) : {}; return v && typeof v === 'object' && !Array.isArray(v) ? v : { trangThai: v }; } catch { return {}; } };

export type DongNhatKy = { id: number; luc: string; nguoi: string; muc: MucNhatKy; viec: string; doiTuong: string | null; truong: { ten: string; cu: string | null; moi: string | null }[] };

export function nhatKyQuanTri(p: Principal, q: { muc?: string | null; nguoi?: number | null; tu?: string | null; den?: string | null; tiep?: number | null }) {
  const laQt = can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true });
  if (!laQt && !xemDuocBangQuyDoi(p)) throw forbidden('Chỉ Quản trị hệ thống và Quản lý xem được nhật ký cấu hình.');
  if (q.muc && !(MUC_NHAT_KY as readonly string[]).includes(q.muc)) throw badRequest('Mục nhật ký không hợp lệ.');
  const muc = q.muc as MucNhatKy | undefined;
  if (muc && CHI_QUAN_TRI.has(muc) && !laQt) throw forbidden('Chỉ Quản trị hệ thống xem được nhật ký tài khoản và quyền.');
  const ngay = /^\d{4}-\d{2}-\d{2}$/;
  if ((q.tu && !ngay.test(q.tu)) || (q.den && !ngay.test(q.den))) throw badRequest('Ngày lọc phải dạng YYYY-MM-DD.');
  const cacMuc = muc ? [muc] : MUC_NHAT_KY.filter((m) => laQt || !CHI_QUAN_TRI.has(m));
  const loai = cacMuc.flatMap((m) => ENTITY_CUA_MUC[m]);
  const mucCua = new Map(cacMuc.flatMap((m) => ENTITY_CUA_MUC[m].map((e) => [e, m] as const)));
  const where = [`a.entity_type IN (${loai.map(() => '?').join(',')})`];
  const ts: unknown[] = [...loai];
  if (q.nguoi) { where.push('a.actor_user_id = ?'); ts.push(q.nguoi); }
  if (q.tu) { where.push('a.created_at >= ?'); ts.push(q.tu); }
  if (q.den) { where.push('a.created_at < ?'); ts.push(`${q.den}T99`); }   // hết ngày `den` (ISO so chuỗi)
  if (q.tiep) { where.push('a.id < ?'); ts.push(q.tiep); }
  const rows = db().prepare(
    `SELECT a.id, a.action, a.entity_type, a.entity_label, a.before_json, a.after_json, a.created_at, u.full_name AS ten
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id WHERE ${where.join(' AND ')} ORDER BY a.id DESC LIMIT ${TRANG + 1}`,
  ).all(...ts) as any[];
  const dong: DongNhatKy[] = rows.slice(0, TRANG).map((r) => {
    const truoc = docJson(r.before_json); const sau = docJson(r.after_json);
    const truong = [...new Set([...Object.keys(truoc), ...Object.keys(sau)])].filter((k) => !k.startsWith('_') && chu(truoc[k]) !== chu(sau[k]))
      .map((k) => ({ ten: TEN_TRUONG[k] ?? k, cu: chu(truoc[k]), moi: chu(sau[k]) }));
    return { id: r.id, luc: r.created_at, nguoi: r.ten ?? 'Hệ thống', muc: mucCua.get(r.entity_type)!, viec: r.action, doiTuong: r.entity_label ?? null, truong };
  });
  /* Ô lọc "Người": ai đã từng đổi trong các mục này — chỉ trang đầu (web dùng danh sách của trang đầu). */
  const nguoi = q.tiep ? [] : db().prepare(
    `SELECT DISTINCT u.id, u.full_name AS ten FROM audit_logs a JOIN users u ON u.id = a.actor_user_id
      WHERE a.entity_type IN (${loai.map(() => '?').join(',')}) ORDER BY u.full_name`,
  ).all(...loai) as { id: number; ten: string }[];
  return { dong, tiep: rows.length > TRANG ? dong[dong.length - 1].id : null, nguoi, muc: cacMuc };
}

/** Đơn vị báo cáo (chỉ xem, tab Chi nhánh — chuyển từ `/admin/overview` cũ): một câu. */
export function donViBaoCao(p: Principal) {
  if (!can(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }) && !xemDuocBangQuyDoi(p)) throw forbidden('Chỉ Quản trị hệ thống và Quản lý xem được đơn vị báo cáo.');
  return db().prepare("SELECT id, name, kind FROM reporting_units WHERE status = 'active' ORDER BY seq").all() as { id: number; name: string; kind: string }[];
}
