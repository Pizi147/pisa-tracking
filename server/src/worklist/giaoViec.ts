/**
 * GV-1 (N58, chủ SP 20/11 — thiết kế `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` B, B2): KHUNG GIAO VIỆC LIÊN PHÒNG BAN, phần máy chủ.
 *
 * Một việc = (loai, ref_id). Áp cho việc có dòng lưu sẵn: `bao_ph` (viec_bao_ph — Báo PH vi phạm / tình hình / Meeting của TVV) · `phoi_hop`
 * (sos_coordination_actions — Phối hợp SOS, Meeting CX, Báo PH kết quả Test của GVCN) · `tinh_hinh` (tinh_hinh_hoc_tap chiều tvv_gvcn — GVCN trả lời) ·
 * `meeting` (meeting_phan — Xếp lịch họp · Kết quả meeting). PR sau (Vận hành, Trả lại vi phạm) thêm một dòng vào `BANG` / `MO` + một nhánh `docViec`.
 *
 *  · Phụ trách: `phu_trach_id` NULL = theo luật (suy khi đọc, như nay); có = người được giao — làm ĐƯỢC đúng việc đó (quyền kiểm theo việc ở nơi ghi).
 *    Ghi đè chỉ có hiệu lực khi người đó còn hoạt động + còn vai ở chi nhánh của việc: hết hiệu lực → về người theo luật (đọc: `docViec`; dữ liệu:
 *    `donGiaoHetHieuLuc` ở mọi chỗ đổi vai / xoá tài khoản / chuyển lớp — đặt NULL + lịch sử).
 *    Đổi được: người đang phụ trách · Head / Quản trị · CX trong phạm vi. Người nhận: tài khoản đang hoạt động có vai ở chi nhánh của việc. Không lý do.
 *    Người giao tự thành người theo dõi; người phụ trách trước (một người) thành người theo dõi. Hoàn tác = bản ghi đảo (`ghi_dao`, loại `giao_viec`).
 *  · Theo dõi (`viec_theo_doi`): chỉ xem + tin "Cập nhật" (giao / đổi người · đổi hạn · có kết quả · bỏ việc). Không tin quá hạn tự động.
 *    `nguon`: gvcn · tvv (mặc định theo vai — đổi GVCN / TVV thì chuyển theo) · gv_ghi · head (mặc định, không chuyển) · tay (người dùng / người giao).
 *  · Lịch sử: `viec_giao_lan` (người, theo dõi, phần Meeting) + `viec_han_lan` (hạn — bảng sẵn có). Xoá dòng việc → `donViec` (id được dùng lại).
 */
import { DS_JSON, db, tx } from '../db.ts';
import { PERMISSIONS, duongHoSoHocVien, hanBaoPhHieuLuc, hanPhoiHop, ngayCongBaoPhLonNhat, ngayTheoGioVN, nhanLoaiXuLy, tenViec } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { badRequest, chuTuDo, conflict, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, nguoiVaiCuaChiNhanh, quanLyCuaChiNhanh, writeAudit } from '../platform/audit.ts';
import { GhiDao, daoLai, luuGhiDao, timGhiDao } from '../platform/ghiDao.ts';
import { HV_DANG_HOC_SQL, LUOT_SAU_THI_SQL, khoangTamDung } from '../students/tamDung.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { canManageDiscipline, gvcnCuaEm } from '../yThuc/access.ts';
import { CHI_NHANH_EM, coTheGhi, coTheSuaHan as coTheSuaHanBaoPh, suaHanBaoPh, xuLyCon } from '../yThuc/baoPhTvv.ts';
import { suaHanPhoiHop } from '../yThuc/phoiHop.ts';
import { hanHoiTinhHinh } from '../yThuc/tinhHinh.ts';
import { giuViecQl } from './viecTvv.ts';
import type { WorkItem } from './mywork.ts';

export const LOAI_GIAO = ['bao_ph', 'phoi_hop', 'tinh_hinh', 'meeting'] as const;
export type LoaiGiao = (typeof LOAI_GIAO)[number];
const BANG: Record<LoaiGiao, string> = { bao_ph: 'viec_bao_ph', phoi_hop: 'sos_coordination_actions', tinh_hinh: 'tinh_hinh_hoc_tap', meeting: 'meeting_phan' };
/** Bảng → loại việc (bản ghi đảo xoá dòng việc → `donViec`). */
export const LOAI_CUA_BANG: Readonly<Record<string, LoaiGiao>> = Object.fromEntries(Object.entries(BANG).map(([l, b]) => [b, l as LoaiGiao]));
/** Điều kiện "việc còn mở" của từng bảng (không bí danh). */
const MO: Record<LoaiGiao, string> = { bao_ph: `trang_thai = 'mo'`, phoi_hop: `status = 'pending'`, tinh_hinh: `trang_thai = 'mo'`, meeting: `trang_thai = 'mo'` };
const NHAN_LOAI: Record<LoaiGiao, string> = { bao_ph: 'Báo PH', phoi_hop: 'Phối hợp SOS', tinh_hinh: 'Tình hình học tập', meeting: 'Meeting CX/GĐCN' };
const LOAI_GHI_DAO = 'giao_viec';
/** Vai BPXL (PR BPXL-1 thêm) — tìm theo khoá chuỗi; chưa có vai / chưa có người → TVV của em (N58). */
export const VAI_BPXL = 'scheduler';
export const PHAN_MEETING = ['xep_lich', 'ket_qua'] as const;
export type PhanMeeting = (typeof PHAN_MEETING)[number];
const TEN_PHAN: Record<PhanMeeting, string> = { xep_lich: 'Xếp lịch họp', ket_qua: 'Kết quả meeting' };
export type Nguon = 'gvcn' | 'tvv' | 'gv_ghi' | 'head' | 'tay';

/** Câu SQL: tài khoản `uid` đang hoạt động + có vai đang hiệu lực ở chi nhánh `cn` (hoặc vai toàn hệ thống). */
export const HOAT_DONG_O = (uid: string, cn: string) => `EXISTS (SELECT 1 FROM users u_ JOIN user_roles ur_ ON ur_.user_id = u_.id WHERE u_.id = ${uid}
  AND u_.status = 'active' AND u_.deleted_at IS NULL AND ur_.status = 'active' AND (ur_.branch_id IS NULL OR ur_.branch_id = ${cn}))`;
/** Câu SQL: chi nhánh HIỆN TẠI của em `sid` (lớp đang học, không có → hồ sơ) — như `CHI_NHANH_EM`, theo biểu thức id em. */
const CN_EM = (sid: string) => `COALESCE((SELECT c_.branch_id FROM enrollments e_ JOIN classes c_ ON c_.id = e_.class_id WHERE e_.student_id = ${sid} AND e_.status = 'active'
  ORDER BY e_.id DESC LIMIT 1), (SELECT s_.branch_id FROM students s_ WHERE s_.id = ${sid}))`;
/** Câu SQL: id em của một dòng việc (`v` = bí danh bảng việc). */
const SID_VIEC: Record<LoaiGiao, (v: string) => string> = {
  bao_ph: (v) => `${v}.student_id`, phoi_hop: (v) => `${v}.student_id`, tinh_hinh: (v) => `${v}.student_id`,
  meeting: (v) => `(SELECT x_.student_id FROM sos_coordination_actions x_ WHERE x_.id = ${v}.phoi_hop_id)`,
};

export function docLoai(v: unknown): LoaiGiao {
  const s = String(v ?? '');
  if (!(LOAI_GIAO as readonly string[]).includes(s)) throw badRequest('Loại việc không hợp lệ.');
  return s as LoaiGiao;
}

type Viec = {
  loai: LoaiGiao; id: number; row: any; studentId: number; tenEm: string; tvv: number | null; gvcn: number | null; branchId: number | null; mo: boolean; tieuDe: string;
  /** Người được giao CÒN hiệu lực (null = theo luật — kể cả khi người được giao đã hết vai / bị xoá). */
  pt: number | null;
  /** Người phụ trách theo luật (có thể nhiều: QL chi nhánh / BPXL / CX). */
  macDinh: number[];
  /** Người đang phụ trách: người được giao, không có → theo luật. */
  phuTrach: number[];
};

const ten = (r: any) => r.full_name as string;
/** Head chi nhánh (chi nhánh NULL → Head toàn hệ thống); không có ai → Quản trị. */
const ql = (branchId: number | null): number[] => {
  const h = quanLyCuaChiNhanh(branchId ?? 0);
  return h.length ? h : nguoiVaiCuaChiNhanh(branchId ?? 0, 'system_admin');
};
const hoatDongO = (uid: number, branchId: number | null) => (db().prepare(`SELECT ${HOAT_DONG_O('?', '?')} AS ok`).get(uid, branchId) as any).ok === 1;
/** (2) Người được giao `uid` của việc của em `studentId` còn hiệu lực (còn hoạt động + còn vai ở chi nhánh hiện tại của em) — quyền ghi theo việc ở baoPhTvv / phoiHop / tinhHinh. */
export const conHieuLuc = (uid: number, studentId: number) => (db().prepare(`SELECT ${HOAT_DONG_O('?', CN_EM('?'))} AS ok`).get(uid, studentId, studentId) as any).ok === 1;

/** Đọc một việc + người theo luật (vài câu, chỉ ở đường panel / ghi — không ở /my-work). */
export function docViec(loai: LoaiGiao, id: number): Viec {
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Việc không hợp lệ.');
  const homNay = demoToday();
  let r: any;
  if (loai === 'meeting') {
    r = db().prepare(`SELECT mp.*, x.student_id, x.kind, s.full_name, s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS em_branch FROM meeting_phan mp
        JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id JOIN students s ON s.id = x.student_id WHERE mp.id = ?`).get(id);
  } else if (loai === 'bao_ph') {
    r = db().prepare(`SELECT v.*, s.full_name, s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS em_branch, m.status AS xu_ly_status FROM viec_bao_ph v
        JOIN students s ON s.id = v.student_id LEFT JOIN discipline_measures m ON m.id = v.measure_id WHERE v.id = ?`).get(id);
  } else {
    r = db().prepare(`SELECT v.*, s.full_name, s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS em_branch FROM ${BANG[loai]} v JOIN students s ON s.id = v.student_id WHERE v.id = ?`).get(id);
  }
  if (!r) throw notFound('Không tìm thấy việc.');
  /* (13) chi nhánh HIỆN TẠI của em; phần Meeting em chưa có chi nhánh → ảnh chụp lúc tạo; vẫn NULL → Head toàn hệ thống / Quản trị. */
  const branchId: number | null = r.em_branch ?? (loai === 'meeting' ? r.branch_id ?? null : null);
  const tvv: number | null = r.tvv ?? null;
  const gvcn = gvcnCuaEm(r.student_id, homNay).gvcn;
  let macDinh: number[]; let mo: boolean; let tieuDe: string;
  if (loai === 'bao_ph') {
    macDinh = tvv ? [tvv] : r.phoi_hop_id && gvcn ? [gvcn] : ql(branchId);   // PHOI-HOP-V2: việc sau Meeting, em chưa có TVV → GVCN
    mo = r.trang_thai === 'mo';
    tieuDe = `Báo PH · ${r.nhan} · ${ten(r)}`;
  } else if (loai === 'phoi_hop') {
    macDinh = gvcn ? [gvcn] : ql(branchId);
    mo = r.status === 'pending';
    tieuDe = `${r.kind === 'other' && r.custom_name ? r.custom_name : tenViec(r.kind, r.pb_moc ?? null)} · ${ten(r)}`;
  } else if (loai === 'tinh_hinh') {
    if (r.chieu !== 'tvv_gvcn') throw badRequest('Việc của tình hình này là Báo PH của TVV — giao ở việc Báo PH.');
    macDinh = gvcn ? [gvcn] : ql(branchId);
    mo = r.trang_thai === 'mo';
    tieuDe = `Tình hình học tập · ${ten(r)}`;
  } else {
    const coVai = branchId ? nguoiVaiCuaChiNhanh(branchId, r.phan === 'xep_lich' ? VAI_BPXL : 'cx') : [];
    macDinh = coVai.length ? coVai : r.phan === 'xep_lich' && tvv ? [tvv] : ql(branchId);
    mo = r.trang_thai === 'mo';
    tieuDe = `${TEN_PHAN[r.phan as PhanMeeting]} · Meeting CX/GĐCN · ${ten(r)}`;
  }
  /* (2) người được giao hết hiệu lực (xoá / hết vai ở chi nhánh) → như NULL: việc về người theo luật, người đó không còn quyền theo việc. */
  const pt: number | null = r.phu_trach_id && hoatDongO(r.phu_trach_id, branchId) ? r.phu_trach_id : null;
  return { loai, id, row: r, studentId: r.student_id, tenEm: ten(r), tvv, gvcn, branchId, mo, tieuDe, pt, macDinh, phuTrach: pt ? [pt] : macDinh };
}

/** Head / Quản trị / CX có grant ở chi nhánh của việc (hoặc toàn hệ thống). */
const vaiQuanLy = (p: Principal, branchId: number | null) =>
  p.grants.some((g) => (g.roleKey === 'manager' || g.roleKey === 'system_admin' || g.roleKey === 'cx') && (g.branchId === null || g.branchId === branchId));
export const coTheDoiNguoi = (p: Principal, v: Viec) => v.phuTrach.includes(p.userId) || vaiQuanLy(p, v.branchId);
const coTheSuaTheoDoi = (p: Principal, v: Viec) => coTheDoiNguoi(p, v) || v.row.giao_boi === p.userId;
const goc = (v: Viec) => ({ consultant_user_id: v.tvv, student_id: v.studentId, phoi_hop_id: v.row.phoi_hop_id ?? null, phu_trach_id: v.pt, giao_boi: v.row.giao_boi ?? null });
/** Nguồn theo dõi của người theo luật: TVV / GVCN chuyển theo khi đổi người; Head giữ. */
const nguonLuat = (v: Viec, uid: number): Nguon => (uid === v.tvv ? 'tvv' : uid === v.gvcn ? 'gvcn' : 'head');

/** Sửa hạn = N34 ① (theo loại) + người phụ trách + người giao. Cùng điều kiện với máy chủ ghi hạn (`suaHanBaoPh`, `suaHanPhoiHop`, `suaHan`). */
function coTheSuaHan(p: Principal, v: Viec): boolean {
  if (!v.mo) return false;
  if (v.loai === 'bao_ph' && xuLyCon(v.row) !== 'con') return false;
  if (v.row.giao_boi === p.userId || v.phuTrach.includes(p.userId)) return true;
  if (v.loai === 'bao_ph') return coTheSuaHanBaoPh(p, goc(v));
  if (v.loai === 'phoi_hop') return canManageDiscipline(p, v.studentId);
  return canManageDiscipline(p, v.studentId) || coTheGhi(p, goc(v)) || (v.loai === 'meeting' && vaiQuanLy(p, v.branchId));
}

/** Người theo dõi đọc được panel — chỉ khi còn hoạt động + còn vai ở chi nhánh của việc (baoPhTvv `xemViecBaoPh`: chỉ xem, không SĐT PH). */
export const laNguoiTheoDoi = (loai: LoaiGiao, id: number, uid: number, branchId: number | null) =>
  !!db().prepare(`SELECT 1 FROM viec_theo_doi t WHERE t.loai = ? AND t.ref_id = ? AND t.user_id = ? AND ${HOAT_DONG_O('t.user_id', '?')}`).get(loai, id, uid, branchId);
/** Người theo dõi / người giao / người phụ trách / người xem được hồ sơ em / Head-CX: đọc được khối giao việc. */
function requireDoc(p: Principal, v: Viec): void {
  if (v.phuTrach.includes(p.userId) || v.row.giao_boi === p.userId || vaiQuanLy(p, v.branchId)) return;
  if (can(p, PERMISSIONS.STUDENT_VIEW, { studentId: v.studentId }) || laNguoiTheoDoi(v.loai, v.id, p.userId, v.branchId)) return;
  throw forbidden('Việc này ngoài phạm vi của bạn.');
}

/** Tài khoản đang hoạt động có vai (đang hiệu lực) ở chi nhánh của việc hoặc toàn hệ thống. */
function kiemNguoiNhan(uid: unknown, branchId: number | null): number {
  const id = Number(uid);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Chọn người nhận việc.');
  if (!hoatDongO(id, branchId)) throw badRequest('Người này không có tài khoản đang hoạt động ở chi nhánh của việc — chọn người khác.');
  return id;
}

// ---------------------------------------------------------------- theo dõi + tin "Cập nhật"

/** TRONG tx: thêm người theo dõi (trùng / không hoạt động / không có vai ở chi nhánh của việc → bỏ qua). Trả số dòng thêm. */
export function themTheoDoiDong(loai: LoaiGiao, refId: number, uids: readonly (number | null | undefined)[], nguon: Nguon, boi: number | null, branchId: number | null): number {
  let n = 0;
  const luc = nowIso();
  for (const uid of new Set(uids.filter((x): x is number => !!x))) {
    n += db().prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc) SELECT ?, ?, u.id, ?, ?, ? FROM users u
        WHERE u.id = ? AND ${HOAT_DONG_O('u.id', '?')} ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(loai, refId, nguon, boi, luc, uid, branchId).changes;
  }
  return n;
}
const ghiLan = (loai: LoaiGiao, refId: number, truong: string, cu: unknown, moi: unknown, boi: number | null) =>
  db().prepare('INSERT INTO viec_giao_lan (loai, ref_id, truong, cu, moi, boi, luc) VALUES (?,?,?,?,?,?,?)')
    .run(loai, refId, truong, cu == null ? null : String(cu), moi == null ? null : String(moi), boi, nowIso());

/**
 * (1) TRONG tx của chỗ XOÁ dòng việc: dọn người theo dõi, lịch sử giao, lịch sử hạn, bản ghi đảo giao việc — id dòng việc được dùng lại
 * (`INTEGER PRIMARY KEY` không AUTOINCREMENT), không dọn thì việc mới thừa hưởng người theo dõi của việc cũ.
 */
export function donViec(loai: LoaiGiao, ids: readonly number[]): void {
  if (!ids.length) return;
  const json = JSON.stringify(ids);
  db().prepare(`DELETE FROM viec_theo_doi WHERE loai = ? AND ref_id IN (${DS_JSON})`).run(loai, json);
  db().prepare(`DELETE FROM viec_giao_lan WHERE loai = ? AND ref_id IN (${DS_JSON})`).run(loai, json);
  db().prepare(`DELETE FROM viec_han_lan WHERE loai = ? AND viec_id IN (${DS_JSON})`).run(loai, json);
  db().prepare(`DELETE FROM ghi_dao WHERE loai = ? AND bang = ? AND doi_tuong_id IN (${DS_JSON})`).run(LOAI_GHI_DAO, BANG[loai], json);
}

export type SuKien = 'giao' | 'han' | 'ket_qua' | 'bo';
const NHAN_SU_KIEN: Record<SuKien, string> = { giao: 'Đổi người phụ trách', han: 'Đổi hạn', ket_qua: 'Có kết quả', bo: 'Đã bỏ việc' };

/**
 * TRONG tx của thao tác: tin "Cập nhật" cho người được giao + người theo dõi còn hoạt động (trừ người làm). MỘT câu đọc người nhận.
 * `khoa` phân biệt lần (id nhật ký) — cùng lần gửi lại không thành hai tin. Trả tập người đã nhận.
 */
export function baoTheoDoi(loai: LoaiGiao, refId: number, boi: number, o: { suKien: SuKien; tieuDe: string; chiTiet?: string | null; khoa: string | number; duong?: string | null; studentId?: number | null;
  /** Người đã nhận tin riêng của luật cũ cho cùng sự kiện (N41: GVCN; người gửi tình hình) — không gửi lần hai. */ boQua?: readonly (number | null)[] }): Set<number> {
  /* (F) chỉ người còn hoạt động + còn vai ở chi nhánh hiện tại của em (như `laNguoiTheoDoi`) — người đã rời chi nhánh không nhận nội dung kết quả. */
  const cn = CN_EM(SID_VIEC[loai]('v'));
  const nhan = new Set((db().prepare(`SELECT t.user_id AS u FROM viec_theo_doi t JOIN ${BANG[loai]} v ON v.id = t.ref_id WHERE t.loai = ?1 AND t.ref_id = ?2 AND ${HOAT_DONG_O('t.user_id', cn)}
      UNION SELECT v.phu_trach_id FROM ${BANG[loai]} v WHERE v.id = ?2 AND v.phu_trach_id IS NOT NULL AND ${HOAT_DONG_O('v.phu_trach_id', cn)}`).all(loai, refId) as any[])
    .map((r) => r.u as number));
  nhan.delete(boi);
  for (const u of o.boQua ?? []) if (u) nhan.delete(u);
  for (const uid of nhan) {
    notify({ userId: uid, kind: 'giao_viec', title: `${NHAN_SU_KIEN[o.suKien]} · ${o.tieuDe}`, body: o.chiTiet?.slice(0, 160) ?? null,
      entityType: o.studentId ? 'student' : null, entityId: o.studentId ?? null, dedupKey: `gv:${loai}:${refId}:${o.suKien}:${o.khoa}`,
      duong: o.duong ?? `/cong-viec?theo-doi=${loai}:${refId}` });
  }
  return nhan;
}
/** Một tin riêng (người vừa nhận / mất việc) — không gửi chính người thao tác. */
const tinRieng = (uids: readonly number[], boi: number, v: Viec, title: string, khoa: string | number) => {
  for (const uid of new Set(uids)) if (uid !== boi && hoatDongO(uid, v.branchId)) {
    notify({ userId: uid, kind: 'giao_viec', title: `${title} · ${v.tieuDe}`, entityType: 'student', entityId: v.studentId,
      dedupKey: `gv:${v.loai}:${v.id}:giao:${khoa}:${uid}`, duong: `/cong-viec?theo-doi=${v.loai}:${v.id}` });
  }
};

/** Thêm người theo dõi (chọn nhiều) — người phụ trách, người giao, Head / Quản trị / CX. */
export function themTheoDoi(p: Principal, loai: LoaiGiao, id: number, body: { userIds?: unknown }): KhoiGiaoViec {
  const v = docViec(loai, id);
  if (!v.mo) throw badRequest('Việc đã kết thúc — không thêm người theo dõi.');
  if (!coTheSuaTheoDoi(p, v)) throw forbidden('Chỉ người phụ trách, người giao, Head hoặc CX thêm được người theo dõi.');
  const ds = (Array.isArray(body.userIds) ? body.userIds : [body.userIds]).slice(0, 20).map((u) => kiemNguoiNhan(u, v.branchId));
  if (!ds.length) throw badRequest('Chọn người theo dõi.');
  tx(() => {
    for (const uid of ds) if (themTheoDoiDong(loai, id, [uid], 'tay', p.userId, v.branchId)) ghiLan(loai, id, 'theo_doi', null, uid, p.userId);
  });
  return xemGiaoViec(p, loai, id);
}

/** Bỏ một người theo dõi — tự bỏ (ai cũng được), người khác: như thêm. */
export function boTheoDoi(p: Principal, loai: LoaiGiao, id: number, uid: number): KhoiGiaoViec | { ok: true } {
  const v = docViec(loai, id);
  if (uid !== p.userId && !coTheSuaTheoDoi(p, v)) throw forbidden('Chỉ người phụ trách, người giao, Head hoặc CX bỏ được người theo dõi khác.');
  tx(() => {
    if (db().prepare('DELETE FROM viec_theo_doi WHERE loai = ? AND ref_id = ? AND user_id = ?').run(loai, id, uid).changes) ghiLan(loai, id, 'theo_doi', uid, null, p.userId);
  });
  /* Tự bỏ theo dõi mà không còn quyền xem việc → không trả khối (tránh 403 ngay sau thao tác thành công). */
  try { return xemGiaoViec(p, loai, id); } catch { return { ok: true }; }
}

// ---------------------------------------------------------------- đổi người phụ trách · về mặc định · Hoàn tác

/**
 * `userId` = người nhận · null = về mặc định (theo luật). `phuTrachCu` BẮT BUỘC = người được giao đang thấy (null = theo luật) — khác → 409; ghi có điều kiện
 * (`phu_trach_id IS cũ` + việc còn mở) → hai người đổi cùng lúc: người sau 409. Giao cho chính người theo luật (một người) = về mặc định.
 */
export function doiPhuTrach(p: Principal, loai: LoaiGiao, id: number, body: { userId?: unknown; phuTrachCu?: unknown }): KhoiGiaoViec & { hoanTac: number | null } {
  if (!('phuTrachCu' in body)) throw badRequest('Thiếu người phụ trách đang xem — mở lại việc rồi đổi.');
  const v = docViec(loai, id);
  if (!v.mo) throw badRequest('Việc đã kết thúc — không đổi người phụ trách.');
  if (!coTheDoiNguoi(p, v)) throw forbidden('Chỉ người đang phụ trách, Head, Quản trị hoặc CX của chi nhánh đổi được người phụ trách.');
  const CHAM = 'Người phụ trách vừa được người khác đổi — mở lại việc để xem.';
  if ((body.phuTrachCu == null || body.phuTrachCu === '' ? null : Number(body.phuTrachCu)) !== v.pt) throw conflict(CHAM);
  const nhan = body.userId == null || body.userId === '' ? null : kiemNguoiNhan(body.userId, v.branchId);
  const moi = nhan !== null && v.macDinh.length === 1 && v.macDinh[0] === nhan ? null : nhan;
  if (moi === v.pt && (v.row.phu_trach_id ?? null) === moi) return { ...xemGiaoViec(p, loai, id), hoanTac: null };
  const bang = BANG[loai];
  const ghiDaoId = tx(() => {
    const g = new GhiDao(db());
    g.sua(bang, 'id = ?', id);
    g.theoDoi('viec_theo_doi', 'loai = ? AND ref_id = ?', [loai, id], () => {
      if (!db().prepare(`UPDATE ${bang} SET phu_trach_id = ?, giao_boi = ?, giao_luc = ? WHERE id = ? AND phu_trach_id IS ? AND ${MO[loai]}`)
        .run(moi, moi === null ? null : p.userId, moi === null ? null : nowIso(), id, v.row.phu_trach_id ?? null).changes) throw conflict(CHAM);
      if (moi !== null) {
        /* Người phụ trách trước (một người) theo dõi tiếp: theo luật → nguồn theo vai (đổi TVV / GVCN thì chuyển theo), người được giao trước → `tay`.
           Chạy TRƯỚC dòng người giao: người theo luật tự giao đi giữ đúng nguồn của vai. */
        if (v.phuTrach.length === 1 && v.phuTrach[0] !== moi) themTheoDoiDong(loai, id, v.phuTrach, v.pt ? 'tay' : nguonLuat(v, v.phuTrach[0]), p.userId, v.branchId);
        themTheoDoiDong(loai, id, [p.userId], 'tay', p.userId, v.branchId);   // người giao tự vào
      }
    });
    /* Người phụ trách mới nếu đang theo dõi thì GIỮ dòng (xoá thì Hoàn tác không trả lại được) — tab Đang theo dõi bỏ việc của chính mình. */
    const gid = luuGhiDao(db(), { loai: LOAI_GHI_DAO, bang, id, nguoi: p.userId, ghi: g });
    ghiLan(loai, id, 'phu_trach', v.pt, moi, p.userId);
    const aid = writeAudit({ actorUserId: p.userId, action: moi === null ? 'giao_viec.mac_dinh' : 'giao_viec.giao', entityType: bang, entityId: id,
      entityLabel: v.tieuDe, before: { phuTrach: v.pt }, after: { phuTrach: moi } });
    const tenMoi = moi === null ? 'theo luật' : (db().prepare('SELECT full_name FROM users WHERE id = ?').get(moi) as any)?.full_name ?? '';
    const daBao = baoTheoDoi(loai, id, p.userId, { suKien: 'giao', tieuDe: v.tieuDe, chiTiet: `Phụ trách: ${tenMoi}`, khoa: aid, studentId: v.studentId });
    /* (10) người vừa NHẬN (theo luật khi về mặc định) và người vừa MẤT việc — mỗi người một tin, không trùng tin theo dõi, không gửi chính người làm. */
    const nhanMoi = moi === null ? v.macDinh : [];
    tinRieng(nhanMoi.filter((u) => !daBao.has(u)), p.userId, v, 'Việc về lại bạn', aid);
    tinRieng(v.phuTrach.filter((u) => u !== moi && !nhanMoi.includes(u) && !daBao.has(u)), p.userId, v, `Việc chuyển sang ${tenMoi}`, aid);
    return gid;
  });
  return { ...xemGiaoViec(p, loai, id), hoanTac: ghiDaoId };
}

/** Hoàn tác lần đổi người gần nhất (người đã đổi, hoặc người đổi được) — 409 khi sau đó đã có thay đổi. */
export function hoanTacGiao(p: Principal, loai: LoaiGiao, id: number): KhoiGiaoViec {
  const v = docViec(loai, id);
  const g = timGhiDao(db(), LOAI_GHI_DAO, BANG[loai], id);
  if (!g) throw conflict('Không có lần đổi người phụ trách nào để hoàn tác.');
  if (g.nguoi !== p.userId && !coTheDoiNguoi(p, v)) throw forbidden('Chỉ người đã đổi, Head, Quản trị hoặc CX hoàn tác được.');
  tx(() => {
    daoLai(db(), g, p.userId);
    const sau = docViec(loai, id);
    ghiLan(loai, id, 'phu_trach', v.pt, sau.pt, p.userId);
    const aid = writeAudit({ actorUserId: p.userId, action: 'giao_viec.hoan_tac', entityType: BANG[loai], entityId: id, entityLabel: v.tieuDe,
      before: { phuTrach: v.pt }, after: { phuTrach: sau.pt } });
    /* (10) người vừa mất việc (bị hoàn tác) + người nhận lại. */
    tinRieng(sau.phuTrach.filter((u) => !v.phuTrach.includes(u)), p.userId, v, 'Việc về lại bạn', aid);
    tinRieng(v.phuTrach.filter((u) => !sau.phuTrach.includes(u)), p.userId, v, 'Đã hoàn tác giao việc', aid);
  });
  return xemGiaoViec(p, loai, id);
}

/**
 * (2) Người được giao hết hiệu lực (xoá tài khoản / hết vai ở chi nhánh của việc / em chuyển chi nhánh): đặt lại NULL (việc về người theo luật) + lịch sử.
 * Gọi TRONG tx của nơi đổi: `setRoles`, xoá tài khoản (`userId`), chuyển lớp (`studentIds`). Hai câu mỗi bảng, chỉ khi có đổi.
 */
export function donGiaoHetHieuLuc(o: { userId?: number; studentIds?: readonly number[] }, boi: number | null): number {
  /* MỘT câu đọc (UNION ALL bốn bảng, mỗi vế đi chỉ mục `phu_trach_id` một phần); ghi chỉ khi có dòng. */
  const ve = LOAI_GIAO.map((loai) => {
    const sid = SID_VIEC[loai]('v');
    return `SELECT '${loai}' AS loai, v.id AS id, v.phu_trach_id AS pt FROM ${BANG[loai]} v WHERE v.${MO[loai]} AND v.phu_trach_id IS NOT NULL
        AND ${o.userId ? 'v.phu_trach_id = ?' : `${sid} IN (${DS_JSON})`} AND NOT ${HOAT_DONG_O('v.phu_trach_id', CN_EM(sid))}`;
  });
  const rows = db().prepare(ve.join(' UNION ALL ')).all(...LOAI_GIAO.map(() => o.userId ?? JSON.stringify(o.studentIds ?? []))) as { loai: LoaiGiao; id: number; pt: number }[];
  for (const loai of LOAI_GIAO) {
    const ds = rows.filter((r) => r.loai === loai);
    if (!ds.length) continue;
    db().prepare(`UPDATE ${BANG[loai]} SET phu_trach_id = NULL, giao_boi = NULL, giao_luc = NULL WHERE id IN (${DS_JSON})`).run(JSON.stringify(ds.map((r) => r.id)));
    for (const r of ds) ghiLan(loai, r.id, 'phu_trach', r.pt, null, boi);
  }
  return rows.length;
}

/**
 * (C) TRONG tx của chỗ em đổi chi nhánh (chuyển lớp một em / cả lô, nhận lại em vào lớp): phần Meeting còn mở theo chi nhánh MỚI (lọc /my-work theo chỉ mục) ·
 * người được giao hết vai ở chi nhánh mới → về người theo luật · người theo dõi `gvcn` theo GVCN lớp mới. Ba câu cho cả tập em.
 */
export function sauDoiChiNhanhEm(studentIds: readonly number[], boi: number | null): void {
  if (!studentIds.length) return;
  const json = JSON.stringify(studentIds);
  db().prepare(`UPDATE meeting_phan SET branch_id = ${CN_EM(SID_VIEC.meeting('meeting_phan'))}
      WHERE trang_thai = 'mo' AND phoi_hop_id IN (SELECT id FROM sos_coordination_actions WHERE student_id IN (${DS_JSON}))`).run(json);
  donGiaoHetHieuLuc({ studentIds }, boi);
  theoGvcnHienTai(DS_JSON, [json]);
}

// ---------------------------------------------------------------- hạn

/**
 * Sửa / đặt hạn — `han` YYYY-MM-DD | null (về mặc định; việc không hạn → bỏ hạn), `hanCu` = hạn chọn đang thấy (409 khi khác).
 * bao_ph / phoi_hop đi đường sẵn có (`han_chon`, `viec_han_lan`, đã mở quyền người phụ trách + người giao); tinh_hinh sửa cột `han`; meeting `han_chon`.
 */
export function suaHan(p: Principal, loai: LoaiGiao, id: number, body: { han?: unknown; hanCu?: unknown }): KhoiGiaoViec {
  if (loai === 'bao_ph') { suaHanBaoPh(p, id, body); return xemGiaoViec(p, loai, id); }
  if (loai === 'phoi_hop') { suaHanPhoiHop(p, id, body); return xemGiaoViec(p, loai, id); }
  if (!('hanCu' in body)) throw badRequest('Thiếu hạn đang xem — mở lại việc rồi sửa.');
  const han = body.han == null || body.han === '' ? null : String(body.han);
  if (han !== null && !isIsoDate(han)) throw badRequest('Ngày hạn không hợp lệ.');
  const hanCu = body.hanCu == null || body.hanCu === '' ? null : String(body.hanCu);
  const v = docViec(loai, id);
  if (!v.mo) throw badRequest('Việc đã kết thúc — không sửa hạn.');
  if (!coTheSuaHan(p, v)) throw forbidden('Bạn không sửa được hạn của việc này.');
  const macDinh = loai === 'tinh_hinh' ? hanHoiTinhHinh(ngayTheoGioVN(v.row.tao_luc) ?? demoToday()) : null;
  const cot = loai === 'tinh_hinh' ? 'han' : 'han_chon';
  const hienTai: string | null = v.row[cot] ?? null;
  const ganMoi = han ?? macDinh;
  /* tinh_hinh: `hanCu` = hạn hiệu lực đang thấy; meeting: hạn chọn đang thấy. */
  if (hanCu !== hienTai) throw conflict('Hạn vừa được người khác sửa — mở lại việc để xem hạn mới.');
  if (ganMoi === hienTai) return xemGiaoViec(p, loai, id);
  tx(() => {
    if (!db().prepare(`UPDATE ${BANG[loai]} SET ${cot} = ? WHERE id = ? AND ${cot} IS ? AND ${MO[loai]}`).run(ganMoi, id, hienTai).changes) throw conflict('Hạn vừa được người khác sửa — mở lại việc để xem hạn mới.');
    /* `han_moi` NOT NULL: bỏ hạn (việc không hạn) ghi chuỗi rỗng. ponytail: '' = "không hạn" trong lịch sử; tách cột nếu cần. */
    db().prepare('INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, mac_dinh, boi, luc) VALUES (?,?,?,?,?,?,?)')
      .run(loai, id, hienTai, ganMoi ?? '', han === null ? 1 : 0, p.userId, nowIso());
    const aid = writeAudit({ actorUserId: p.userId, action: 'giao_viec.han', entityType: BANG[loai], entityId: id, entityLabel: v.tieuDe, before: { han: hienTai }, after: { han: ganMoi } });
    baoTheoDoi(loai, id, p.userId, { suKien: 'han', tieuDe: v.tieuDe, chiTiet: ganMoi ? `Hạn mới: ${ganMoi.slice(8, 10)}/${ganMoi.slice(5, 7)}` : 'Bỏ hạn', khoa: aid, studentId: v.studentId });
  });
  return xemGiaoViec(p, loai, id);
}

// ---------------------------------------------------------------- khối panel (Phụ trách · Hạn · Theo dõi · Lịch sử)

type Nguoi = { id: number; ten: string | null };
export type KhoiGiaoViec = {
  loai: LoaiGiao; id: number; tieuDe: string; studentId: number; mo: boolean; branchId: number | null;
  phuTrach: Nguoi[]; macDinh: Nguoi[]; duocGiao: boolean; giaoBoi: Nguoi | null; giaoLuc: string | null;
  han: string | null; hanMacDinh: string | null; hanChon: string | null; coTheSuaHan: boolean;
  theoDoi: (Nguoi & { nguon: Nguon })[]; toiTheoDoi: boolean; coTheDoiNguoi: boolean; coTheSuaTheoDoi: boolean; hoanTacDuoc: boolean;
  /** Mỗi lần đổi người / theo dõi / hạn / phần Meeting, cũ trước: `truong` phu_trach | theo_doi | han | xong | sua | mo_lai. */
  lichSu: { truong: string; cu: string | null; moi: string | null; cuTen: string | null; moiTen: string | null; nguoi: string | null; luc: string }[];
  /** Phần Meeting (loai meeting). */
  meeting?: { phan: PhanMeeting; ten: string; phoiHopId: number; trangThai: 'mo' | 'xong' | 'bo'; ngayGio: string | null; ketQua: string | null;
    xongBoi: string | null; xongLuc: string | null; nhapHoBoi: string | null; coTheLam: boolean };
};

function hanCua(v: Viec): { han: string | null; macDinh: string | null; chon: string | null } {
  const r = v.row;
  if (v.loai === 'bao_ph') {
    const k = khoangTamDung([v.studentId])[v.studentId];
    return { han: hanBaoPhHieuLuc(r.han, k, r.han_chon), macDinh: hanBaoPhHieuLuc(r.han, k), chon: r.han_chon ?? null };
  }
  if (v.loai === 'phoi_hop') return { han: hanPhoiHop(r.kind, r.created_at, r.han_chon, r.pb_moc ?? null), macDinh: hanPhoiHop(r.kind, r.created_at, null, r.pb_moc ?? null), chon: r.han_chon ?? null };
  if (v.loai === 'tinh_hinh') {
    const md = hanHoiTinhHinh(ngayTheoGioVN(r.tao_luc) ?? demoToday());
    return { han: r.han ?? null, macDinh: md, chon: r.han && r.han !== md ? r.han : null };
  }
  return { han: r.han_chon ?? null, macDinh: null, chon: r.han_chon ?? null };
}

/** Phần Meeting làm được: người phụ trách · Head / Quản trị / CX · TVV của em / TVV cùng chi nhánh (nhập hộ — Kết quả meeting; Xếp lịch khi chưa BPXL đã là TVV). */
const coTheLamMeeting = (p: Principal, v: Viec) =>
  v.phuTrach.includes(p.userId) || vaiQuanLy(p, v.branchId) || (v.row.phan === 'ket_qua' && coTheGhi(p, { consultant_user_id: v.tvv, student_id: v.studentId }));

export function xemGiaoViec(p: Principal, loai: LoaiGiao, id: number): KhoiGiaoViec {
  const v = docViec(loai, id);
  requireDoc(p, v);
  const r = v.row;
  const td = db().prepare(`SELECT t.user_id, t.nguon, u.full_name FROM viec_theo_doi t LEFT JOIN users u ON u.id = t.user_id WHERE t.loai = ? AND t.ref_id = ? ORDER BY t.id`).all(loai, id) as any[];
  const lan = db().prepare(
    `SELECT l.truong AS truong, l.cu AS cu, l.moi AS moi, l.luc AS luc, u.full_name AS nguoi FROM viec_giao_lan l LEFT JOIN users u ON u.id = l.boi WHERE l.loai = ?1 AND l.ref_id = ?2
     UNION ALL SELECT 'han', h.han_cu, NULLIF(h.han_moi, ''), h.luc, u.full_name FROM viec_han_lan h LEFT JOIN users u ON u.id = h.boi WHERE h.loai = ?1 AND h.viec_id = ?2
     ORDER BY 4`,
  ).all(loai, id) as any[];
  const ids = new Set<number>([...v.phuTrach, ...v.macDinh, ...(r.giao_boi ? [r.giao_boi] : []), ...(r.xong_boi ? [r.xong_boi] : []), ...(r.nhap_ho_boi ? [r.nhap_ho_boi] : []),
    ...lan.filter((l) => l.truong === 'phu_trach' || l.truong === 'theo_doi').flatMap((l) => [l.cu, l.moi]).filter(Boolean).map(Number)]);
  const tenCua = new Map<number, string>((db().prepare(`SELECT id, full_name FROM users WHERE id IN (${DS_JSON})`).all(JSON.stringify([...ids])) as any[]).map((u) => [u.id, u.full_name]));
  const nguoi = (uid: number): Nguoi => ({ id: uid, ten: tenCua.get(uid) ?? null });
  const tenSo = (s: string | null) => (s && /^\d+$/.test(s) ? tenCua.get(Number(s)) ?? null : null);
  const h = hanCua(v);
  const doiDuoc = v.mo && coTheDoiNguoi(p, v);
  const gd = v.mo && doiDuoc ? timGhiDao(db(), LOAI_GHI_DAO, BANG[loai], id) : null;
  return {
    loai, id, tieuDe: v.tieuDe, studentId: v.studentId, mo: v.mo, branchId: v.branchId,
    phuTrach: v.phuTrach.map(nguoi), macDinh: v.macDinh.map(nguoi), duocGiao: !!v.pt,
    giaoBoi: v.pt && r.giao_boi ? nguoi(r.giao_boi) : null, giaoLuc: v.pt ? r.giao_luc ?? null : null,
    han: h.han, hanMacDinh: h.macDinh, hanChon: h.chon, coTheSuaHan: coTheSuaHan(p, v),
    theoDoi: td.map((t) => ({ id: t.user_id, ten: t.full_name ?? null, nguon: t.nguon })), toiTheoDoi: td.some((t) => t.user_id === p.userId),
    coTheDoiNguoi: doiDuoc, coTheSuaTheoDoi: v.mo && coTheSuaTheoDoi(p, v), hoanTacDuoc: !!gd,
    lichSu: lan.map((l) => ({ truong: l.truong, cu: l.cu ?? null, moi: l.moi ?? null, cuTen: tenSo(l.cu), moiTen: tenSo(l.moi), nguoi: l.nguoi ?? null, luc: l.luc })),
    ...(loai === 'meeting' ? { meeting: {
      phan: r.phan, ten: TEN_PHAN[r.phan as PhanMeeting], phoiHopId: r.phoi_hop_id, trangThai: r.trang_thai, ngayGio: r.ngay_gio ?? null, ketQua: r.ket_qua ?? null,
      xongBoi: r.xong_boi ? tenCua.get(r.xong_boi) ?? null : null, xongLuc: r.xong_luc ?? null, nhapHoBoi: r.nhap_ho_boi ? tenCua.get(r.nhap_ho_boi) ?? null : null,
      coTheLam: r.trang_thai !== 'bo' && coTheLamMeeting(p, v),
    } } : {}),
  };
}

// ---------------------------------------------------------------- Meeting CX / GĐCN: hai phần độc lập (B2)

/**
 * TRONG tx (phoiHop `dongBoViecTvv`): hành động Meeting CX sang Xong → hai phần (Xếp lịch họp · Kết quả meeting) + người theo dõi mặc định
 * (TVV của em · GVCN · Head — trừ người theo luật của chính phần đó) cho ba phần (kể cả việc Báo PH Meeting của TVV, `baoPhId`, khi cấu hình có bước TVV).
 * Phần hệ thống đã đóng (đưa lại Cần xử lý) → mở lại. Chạy lặp không đổi.
 */
export function moPhanMeeting(phoiHopId: number, studentId: number, baoPhId: number | null): void {
  const luc = nowIso();
  const em = db().prepare(`SELECT s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS branch_id FROM students s WHERE s.id = ?`).get(studentId) as any;
  const branchId: number | null = em?.branch_id ?? null;
  let moi = 0;
  for (const phan of PHAN_MEETING) {
    moi += db().prepare(`INSERT INTO meeting_phan (phoi_hop_id, phan, branch_id, trang_thai, tao_luc) VALUES (?,?,?, 'mo', ?) ON CONFLICT(phoi_hop_id, phan) DO NOTHING`)
      .run(phoiHopId, phan, branchId, luc).changes;
  }
  db().prepare(`UPDATE meeting_phan SET trang_thai = 'mo', branch_id = ? WHERE phoi_hop_id = ? AND trang_thai = 'bo'`).run(branchId, phoiHopId);   // mở lại: chi nhánh hiện tại
  if (moi) theoDoiMacDinhMeeting(phoiHopId, studentId, baoPhId);
}

/** TRONG tx: người theo dõi mặc định (TVV của em · GVCN · Head — trừ người theo luật của chính phần) cho hai phần + việc Báo PH Meeting. Migrate sinh bù gọi lại. */
export function theoDoiMacDinhMeeting(phoiHopId: number, studentId: number, baoPhId: number | null): void {
  const em = db().prepare(`SELECT s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS branch_id FROM students s WHERE s.id = ?`).get(studentId) as any;
  const branchId: number | null = em?.branch_id ?? null;
  const gvcn = gvcnCuaEm(studentId, demoToday()).gvcn;
  const theoDoi: [number | null, Nguon][] = [[em?.tvv ?? null, 'tvv'], [gvcn, 'gvcn'], ...ql(branchId).map((u): [number, Nguon] => [u, 'head'])];
  const them = (loai: LoaiGiao, refId: number, boQua: readonly number[]) => {
    for (const [u, nguon] of theoDoi) if (u && !boQua.includes(u)) themTheoDoiDong(loai, refId, [u], nguon, null, branchId);
  };
  for (const p of db().prepare('SELECT id FROM meeting_phan WHERE phoi_hop_id = ?').all(phoiHopId) as any[]) them('meeting', p.id, docViec('meeting', p.id).macDinh);
  if (baoPhId) them('bao_ph', baoPhId, docViec('bao_ph', baoPhId).macDinh);
}

/** TRONG tx: Meeting không còn xác nhận (Hoàn tác / Đưa lại / Bỏ) → phần chưa xong "Đã bỏ" (hệ thống); phần đã xong giữ kết quả. */
export function dongPhanMeeting(phoiHopId: number): void {
  db().prepare(`UPDATE meeting_phan SET trang_thai = 'bo' WHERE phoi_hop_id = ? AND trang_thai = 'mo'`).run(phoiHopId);
}

const NGAY_GIO = /^(\d{4}-\d{2}-\d{2})(?: (\d{2}):(\d{2}))?$/;
/**
 * Hoàn thành một phần (ô tuỳ chọn: ngày giờ họp — Xếp lịch; kết quả — cả hai). Phần đã xong lưu lại = sửa (có lịch sử). Ai bấm mà không phải người phụ trách
 * → "nhập hộ" (Kết quả meeting do TVV nhập hộ CX). Không phần nào chờ phần nào.
 */
export function xongPhanMeeting(p: Principal, id: number, body: { ngayGio?: unknown; ketQua?: unknown }): KhoiGiaoViec {
  const v = docViec('meeting', id);
  if (v.row.trang_thai === 'bo') throw badRequest('Meeting đã đưa về Cần xử lý — phần này chỉ xem.');
  if (!coTheLamMeeting(p, v)) throw forbidden(v.row.phan === 'ket_qua' ? 'Chỉ CX, TVV của em hoặc Head ghi được kết quả meeting.' : 'Chỉ BPXL, người được giao hoặc Head xếp được lịch họp.');
  const ketQua = chuTuDo(body.ketQua, 'Kết quả', 2000);
  let ngayGio: string | null = null;
  if (v.row.phan === 'xep_lich' && body.ngayGio != null && body.ngayGio !== '') {
    const m = NGAY_GIO.exec(String(body.ngayGio).trim());
    if (!m || !isIsoDate(m[1]) || (m[2] && (Number(m[2]) > 23 || Number(m[3]) > 59))) throw badRequest('Ngày giờ họp không hợp lệ (ngày YYYY-MM-DD, giờ HH:MM).');
    ngayGio = m[0];
  }
  const sua = v.row.trang_thai === 'xong';
  const nhapHo = v.phuTrach.includes(p.userId) ? null : p.userId;
  tx(() => {
    /* So-và-đổi theo trạng thái đã đọc: hai người bấm cùng lúc → người sau 409, không ghi đè im lặng. */
    if (!db().prepare(`UPDATE meeting_phan SET trang_thai = 'xong', ngay_gio = ?, ket_qua = ?, xong_boi = ?, xong_luc = ?, nhap_ho_boi = ? WHERE id = ? AND trang_thai = ? AND xong_luc IS ?`)
      .run(ngayGio, ketQua, p.userId, nowIso(), nhapHo, id, v.row.trang_thai, v.row.xong_luc ?? null).changes) throw conflict('Phần này vừa được cập nhật — mở lại để xem.');
    ghiLan('meeting', id, sua ? 'sua' : 'xong', sua ? JSON.stringify({ ngayGio: v.row.ngay_gio ?? null, ketQua: v.row.ket_qua ?? null }) : null, JSON.stringify({ ngayGio, ketQua }), p.userId);
    const aid = writeAudit({ actorUserId: p.userId, action: sua ? 'meeting_phan.sua' : 'meeting_phan.xong', entityType: 'meeting_phan', entityId: id, entityLabel: v.tieuDe,
      before: sua ? { ngayGio: v.row.ngay_gio, ketQua: v.row.ket_qua } : { trangThai: v.row.trang_thai }, after: { ngayGio, ketQua, nhapHo } });
    if (!sua) {
      baoTheoDoi('meeting', id, p.userId, { suKien: 'ket_qua', tieuDe: v.tieuDe, chiTiet: [ngayGio ? `Họp ${ngayGio.slice(8, 10)}/${ngayGio.slice(5, 7)}${ngayGio.slice(10)}` : null, ketQua].filter(Boolean).join(' · ') || 'Hoàn thành',
        khoa: aid, studentId: v.studentId });
    }
  });
  return xemGiaoViec(p, 'meeting', id);
}

/** Hoàn tác Hoàn thành (về chưa xong, giữ chữ đã ghi để sửa) — cùng quyền. */
export function moLaiPhanMeeting(p: Principal, id: number): KhoiGiaoViec {
  const v = docViec('meeting', id);
  if (v.row.trang_thai !== 'xong') throw conflict('Phần này chưa hoàn thành — không có gì để hoàn tác.');
  if (!coTheLamMeeting(p, v)) throw forbidden('Bạn không hoàn tác được phần này.');
  tx(() => {
    if (!db().prepare(`UPDATE meeting_phan SET trang_thai = 'mo', xong_boi = NULL, xong_luc = NULL, nhap_ho_boi = NULL WHERE id = ? AND trang_thai = 'xong'`).run(id).changes) {
      throw conflict('Phần này vừa được cập nhật — mở lại để xem.');
    }
    ghiLan('meeting', id, 'mo_lai', null, null, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'meeting_phan.mo_lai', entityType: 'meeting_phan', entityId: id, entityLabel: v.tieuDe, before: { trangThai: 'xong' }, after: { trangThai: 'mo' } });
  });
  return xemGiaoViec(p, 'meeting', id);
}

/** Panel Meeting: ba phần cạnh nhau — Xếp lịch họp · Kết quả meeting (khối giao việc) + id việc Báo PH Meeting của TVV (panel Báo PH sẵn có). */
export function xemMeeting(p: Principal, phoiHopId: number): { phoiHopId: number; phan: KhoiGiaoViec[]; baoPhId: number | null } {
  const ids = db().prepare(`SELECT id FROM meeting_phan WHERE phoi_hop_id = ? ORDER BY CASE phan WHEN 'xep_lich' THEN 0 ELSE 1 END`).all(phoiHopId) as any[];
  if (!ids.length) throw notFound('Meeting này chưa có phần Xếp lịch họp / Kết quả meeting.');
  const bp = db().prepare('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?').get(phoiHopId) as { id: number } | undefined;
  return { phoiHopId, phan: ids.map((r) => xemGiaoViec(p, 'meeting', r.id)), baoPhId: bp?.id ?? null };
}

// ---------------------------------------------------------------- đổi GVCN / TVV: người theo dõi mặc định của việc còn mở theo người HIỆN TẠI

/** Câu SQL: id dòng theo dõi (nguồn `nguon`) của việc còn mở của các em `em` (câu con trả student_id). */
const THEO_DOI_MO_CUA_EM = (nguon: Nguon, em: string) => `SELECT t.id FROM viec_theo_doi t WHERE t.nguon = '${nguon}' AND (
     (t.loai = 'bao_ph' AND t.ref_id IN (SELECT id FROM viec_bao_ph WHERE trang_thai = 'mo' AND student_id IN (${em})))
  OR (t.loai = 'phoi_hop' AND t.ref_id IN (SELECT id FROM sos_coordination_actions WHERE status = 'pending' AND student_id IN (${em})))
  OR (t.loai = 'tinh_hinh' AND t.ref_id IN (SELECT id FROM tinh_hinh_hoc_tap WHERE trang_thai = 'mo' AND student_id IN (${em})))
  OR (t.loai = 'meeting' AND t.ref_id IN (SELECT mp.id FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id WHERE mp.trang_thai = 'mo' AND x.student_id IN (${em}))))`;
/** Câu SQL: id em của dòng theo dõi đang cập nhật (`viec_theo_doi` không bí danh). */
const SID_THEO_DOI = `(CASE viec_theo_doi.loai WHEN 'bao_ph' THEN (SELECT student_id FROM viec_bao_ph WHERE id = viec_theo_doi.ref_id)
  WHEN 'phoi_hop' THEN (SELECT student_id FROM sos_coordination_actions WHERE id = viec_theo_doi.ref_id)
  WHEN 'tinh_hinh' THEN (SELECT student_id FROM tinh_hinh_hoc_tap WHERE id = viec_theo_doi.ref_id)
  ELSE (SELECT x.student_id FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id WHERE mp.id = viec_theo_doi.ref_id) END)`;
const EM_CUA_LOP = `SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`;

/**
 * (7) TRONG tx của nơi đổi: dòng theo dõi nguồn `gvcn` của việc còn mở → GVCN HIỆN TẠI của lớp em đang học (đổi phân công, Hoàn tác phân công — tính lại sau
 * khi đảo, không nằm trong bản ghi đảo; chuyển lớp; GVCN cũ đã xoá). Lớp chưa có GVCN → giữ người cũ. GVCN mới đã theo dõi sẵn → bỏ dòng cũ. `em` = câu con student_id.
 */
export function theoGvcnHienTai(em: string, thamSo: readonly unknown[]): void {
  const ngay = demoToday();
  if (!isIsoDate(ngay)) return;
  const G = `(SELECT ta.user_id FROM enrollments e JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active'
      AND ta.effective_from <= '${ngay}' AND (ta.effective_to IS NULL OR ta.effective_to >= '${ngay}') WHERE e.student_id = ${SID_THEO_DOI} AND e.status = 'active' ORDER BY e.id DESC, ta.id LIMIT 1)`;
  db().prepare(`UPDATE OR IGNORE viec_theo_doi SET user_id = ${G} WHERE id IN (${THEO_DOI_MO_CUA_EM('gvcn', em)}) AND ${G} IS NOT NULL AND ${G} != user_id`)
    .run(...thamSo, ...thamSo, ...thamSo, ...thamSo);
  /* GVCN mới đã theo dõi sẵn (UPDATE OR IGNORE bỏ qua) → bỏ dòng `gvcn` của GVCN cũ. */
  db().prepare(`DELETE FROM viec_theo_doi WHERE id IN (${THEO_DOI_MO_CUA_EM('gvcn', em)}) AND ${G} IS NOT NULL AND ${G} != user_id`)
    .run(...thamSo, ...thamSo, ...thamSo, ...thamSo);
}
/** Đổi GVCN của lớp (`ghiPhanCong`). */
export const theoGvcnCuaLop = (classId: number) => theoGvcnHienTai(EM_CUA_LOP, [classId]);
/** Hoàn tác phân công nhiều lớp: một lượt (2 câu) cho mọi lớp. */
export const theoGvcnCacLop = (classIds: readonly number[]) => {
  if (classIds.length) theoGvcnHienTai(`SELECT student_id FROM enrollments WHERE class_id IN (${DS_JSON}) AND status = 'active'`, [JSON.stringify(classIds)]);
};

/**
 * (7) TRONG tx của `updateStudent` (đổi / gán / bỏ TVV): dòng `tvv` của việc còn mở → TVV mới (trùng → bỏ dòng cũ; bỏ TVV → bỏ dòng); gán lần đầu → TVV theo dõi
 * hai phần Meeting đang mở của em (như lúc tạo).
 */
export function theoTvvHienTai(studentId: number): void {
  const T = `(SELECT consultant_user_id FROM students WHERE id = ${SID_THEO_DOI})`;
  const dk = `id IN (${THEO_DOI_MO_CUA_EM('tvv', '?')})`;
  db().prepare(`UPDATE OR IGNORE viec_theo_doi SET user_id = ${T} WHERE ${dk} AND ${T} IS NOT NULL AND ${T} != user_id`).run(studentId, studentId, studentId, studentId);
  db().prepare(`DELETE FROM viec_theo_doi WHERE ${dk} AND (${T} IS NULL OR ${T} != user_id)`).run(studentId, studentId, studentId, studentId);
  db().prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)
      SELECT 'meeting', mp.id, s.consultant_user_id, 'tvv', NULL, ? FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id JOIN students s ON s.id = x.student_id
       WHERE x.student_id = ? AND mp.trang_thai = 'mo' AND s.consultant_user_id IS NOT NULL ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(nowIso(), studentId);
}

// ---------------------------------------------------------------- /my-work: việc giao cho tôi (+ phần Meeting theo luật) — MỘT câu

const VAI_MEETING = new Set([VAI_BPXL, 'cx', 'consultant', 'manager', 'system_admin']);
/** Phần Meeting còn là việc: hành động Meeting đã xác nhận, lượt chưa huỷ, lộ trình chưa có KQ thi thật (N46). Em thôi học: lọc `HV_DANG_HOC` ở câu ngoài. */
const MEETING_SONG = `JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id AND x.status = 'done'
       JOIN assessment_attempts a ON a.id = x.attempt_id AND a.status != 'cancelled' AND NOT ${LUOT_SAU_THI_SQL('a')}`;
const COT_MEETING = `'meeting', mp.id, x.student_id, mp.phu_trach_id, mp.giao_boi, NULL, mp.han_chon, NULL, mp.phoi_hop_id, NULL, NULL, x.kind, NULL, NULL, mp.branch_id, NULL, mp.phan, NULL,
              (SELECT y.ngay_gio FROM meeting_phan y WHERE y.phoi_hop_id = mp.phoi_hop_id AND y.phan = 'xep_lich' AND y.trang_thai = 'xong'), NULL`;
/**
 * (B) Người giữ vai BPXL / CX theo chi nhánh — MỘT câu mỗi request (bộ nhớ request), chỉ khi có phần Meeting cần xét (không câu con theo từng dòng).
 * `vaiTai(phan, cn)` = người đầu tiên có vai ở chi nhánh `cn` (hoặc toàn hệ thống), null = chi nhánh chưa có người giữ vai đó.
 */
const nguoiGiuVai = () => nho('gv1:vai-meeting', () => {
  const m = new Map<string, { u: number; b: number | null }[]>();
  for (const r of db().prepare(`SELECT r.key, ur.user_id AS u, ur.branch_id AS b FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users uu ON uu.id = ur.user_id
      WHERE r.key IN ('${VAI_BPXL}', 'cx') AND ur.status = 'active' AND uu.status = 'active' AND uu.deleted_at IS NULL ORDER BY ur.user_id`).all() as any[]) {
    m.set(r.key, [...(m.get(r.key) ?? []), { u: r.u, b: r.b ?? null }]);
  }
  return m;
});
const vaiTai = (phan: string, cn: number | null): number | null =>
  (nguoiGiuVai().get(phan === 'xep_lich' ? VAI_BPXL : 'cx') ?? []).find((x) => x.b === null || x.b === cn)?.u ?? null;

/**
 * Việc người khác giao cho tôi (ba bảng có `phu_trach_id = tôi`, đi chỉ mục một phần) + phần Meeting (giao cho tôi; theo luật ở chi nhánh tôi có vai
 * BPXL / CX / TVV / Head / Quản trị — nhánh riêng đi chỉ mục `idx_meeting_phan_mo` theo chi nhánh, không quét). MỘT câu UNION ALL (+ một câu người giữ vai mỗi
 * request khi có phần Meeting). GV thuần: mọi nhánh lọc `phu_trach_id = ?` → 0 dòng khi không ai giao. `tatCa` (Head / QT / CX "Tất cả"): thêm phần Meeting của
 * người khác trong phạm vi, đứng tên người giữ. `studentId`: một em (dải "Việc cần làm" hồ sơ HV) — lọc ngay trong từng vế.
 * `meeting_phan.branch_id` cập nhật khi em đổi chi nhánh (`sauDoiChiNhanhEm`); người giữ / quyền theo chi nhánh hiện tại của em.
 */
export function viecGiaoChoToi(p: Principal, o: { today: string; branchId?: number | null; studentId?: number; tatCa?: boolean }): WorkItem[] {
  const vai = p.grants.filter((g) => VAI_MEETING.has(g.roleKey));
  const toanBo = vai.some((g) => g.branchId === null);
  const cn = [...new Set(vai.map((g) => g.branchId).filter((b): b is number => b !== null))];
  /* Tham số theo thứ tự xuất hiện (không đánh số: nhánh Meeting / một em có hay không). */
  const thamSo: unknown[] = [];
  const em = (bd: string) => (o.studentId ? ` AND ${bd}.student_id = ?` : '');
  const veToi = (sql: string, bd: string) => { thamSo.push(p.userId, ...(o.studentId ? [o.studentId] : [])); return `${sql}${em(bd)}`; };
  const ve: string[] = [
    veToi(`SELECT 'bao_ph' AS loai, v.id AS id, v.student_id AS student_id, v.phu_trach_id AS phu_trach_id, v.giao_boi AS giao_boi, v.han AS han, v.han_chon AS han_chon, v.nhan AS nhan,
              v.phoi_hop_id AS ph_id, v.tinh_hinh_id AS th_id, v.bao_lai_cua AS bl, m.kind AS kind, m.custom_name AS ten, (SELECT COUNT(*) FROM viec_bao_ph_lan l WHERE l.viec_id = v.id) AS so_lan,
              NULL AS pb, NULL AS tao, NULL AS phan, NULL AS vai_id, NULL AS hop,
              (SELECT MAX(r.event_date) FROM journey_events r WHERE r.student_id = v.student_id AND r.event_type = 'resume' AND r.event_date >= date(v.han, '-${ngayCongBaoPhLonNhat()} day')
                 AND EXISTS (SELECT 1 FROM journey_events q WHERE q.student_id = v.student_id AND q.event_type = 'pause' AND q.event_date <= v.han AND q.event_date <= r.event_date)) AS quay_lai
         FROM viec_bao_ph v LEFT JOIN discipline_measures m ON m.id = COALESCE(v.measure_id, v.bao_lai_cua) WHERE v.phu_trach_id = ? AND v.trang_thai = 'mo'`, 'v'),
    /* như dòng theo luật (dongPhoiHopTheoViec · Báo PH kết quả Test) */
    veToi(`SELECT 'phoi_hop', x.id, x.student_id, x.phu_trach_id, x.giao_boi, NULL, x.han_chon, NULL, x.attempt_id, NULL, NULL, x.kind, x.custom_name, NULL, x.pb_moc, x.created_at, NULL, NULL, NULL, NULL
         FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id
        WHERE x.phu_trach_id = ? AND x.status = 'pending'
          AND (x.kind = 'bao_ph_tvv' OR (a.status != 'cancelled' AND COALESCE(a.kind, 'mock') = 'mock' AND NOT ${LUOT_SAU_THI_SQL('a')}))`, 'x'),
    veToi(`SELECT 'tinh_hinh', t.id, t.student_id, t.phu_trach_id, t.giao_boi, t.han, NULL, t.noi_dung, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
         FROM tinh_hinh_hoc_tap t WHERE t.phu_trach_id = ? AND t.trang_thai = 'mo' AND t.chieu = 'tvv_gvcn'`, 't'),
  ];
  ve.push(veToi(`SELECT ${COT_MEETING} FROM meeting_phan mp ${MEETING_SONG} WHERE mp.phu_trach_id = ? AND mp.trang_thai = 'mo'`, 'x'));
  if (vai.length) {
    const loc = [`mp.trang_thai = 'mo'`, ...(toanBo ? [] : [`mp.branch_id IN (${DS_JSON})`]), o.tatCa ? '(mp.phu_trach_id IS NULL OR mp.phu_trach_id != ?)' : 'mp.phu_trach_id IS NULL'];
    if (!toanBo) thamSo.push(JSON.stringify(cn));
    if (o.tatCa) thamSo.push(p.userId);
    if (o.studentId) thamSo.push(o.studentId);
    ve.push(`SELECT ${COT_MEETING} FROM meeting_phan mp ${MEETING_SONG} WHERE ${loc.join(' AND ')}${em('x')}`);
  }
  const rows = db().prepare(
    `SELECT u.*, s.full_name, s.consultant_user_id AS tvv, e.class_id, c.code AS class_code, COALESCE(c.branch_id, s.branch_id) AS em_branch, g.full_name AS giao_ten FROM (
       ${ve.join(' UNION ALL ')}
     ) u JOIN students s ON s.id = u.student_id AND ${HV_DANG_HOC_SQL('s')}
     LEFT JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = s.id AND x.status = 'active')
     LEFT JOIN classes c ON c.id = e.class_id LEFT JOIN users g ON g.id = u.giao_boi`,
  ).all(...thamSo) as any[];
  for (const r of rows) if (r.loai === 'meeting') r.vai_id = vaiTai(r.phan, r.em_branch ?? r.pb ?? null);
  const coVai = (key: string, b: number | null) => p.grants.some((g) => g.roleKey === key && (g.branchId === null || g.branchId === b));
  const giu = giuViecQl(p);
  const items: WorkItem[] = [];
  const co = new Set<string>();
  for (const r of rows) {
    const branchId: number | null = r.em_branch ?? (r.loai === 'meeting' ? r.pb ?? null : null);
    if (o.branchId && branchId !== o.branchId) continue;
    let ownerId: number | null = p.userId; let mine = true;
    if (r.loai === 'meeting' && r.phu_trach_id !== p.userId) {
      /* Theo luật (N58): Xếp lịch — BPXL chi nhánh, không có → TVV của em, không có → Head; Kết quả — CX chi nhánh, không có → Head. */
      mine = r.phu_trach_id == null && (r.vai_id ? coVai(r.phan === 'xep_lich' ? VAI_BPXL : 'cx', branchId)
        : r.phan === 'xep_lich' && r.tvv ? r.tvv === p.userId : giu(branchId));
      if (!mine && !o.tatCa) continue;
      ownerId = mine ? p.userId : r.phu_trach_id ?? r.vai_id ?? (r.phan === 'xep_lich' ? r.tvv : null) ?? null;
    }
    const it = dongViecGiao(r, o.today, ownerId, mine);
    if (co.has(it.key)) continue;
    co.add(it.key);
    items.push(it);
  }
  return items;
}

const urgencyOf = (han: string | null, today: string) => (!han ? 'normal' : han < today ? 'overdue' : han === today ? 'today' : 'normal') as WorkItem['urgency'];

/** Một dòng /my-work — khoá + nhóm + chữ như dòng theo luật cùng loại (bỏ trùng theo khoá). Dùng chung: việc giao cho tôi · "Tất cả" (việc giao cho người khác). */
export function dongViecGiao(r: any, today: string, ownerId: number | null, mine: boolean): WorkItem {
  const chung = {
    studentId: r.student_id as number, studentName: r.full_name as string, classId: r.class_id ?? null, classCode: r.class_code ?? null,
    attemptId: null, attemptNo: null, caseId: null, level: null, count: null, ownerId, owner: null, mine,
    ...(r.giao_boi && r.phu_trach_id ? { giaoBoi: r.giao_ten ?? null } : {}),
  };
  if (r.loai === 'bao_ph') {
    const han = hanBaoPhHieuLuc(r.han, r.quay_lai ? [{ tu: r.han, den: r.quay_lai }] : [], r.han_chon);
    const nhan = r.ph_id || r.th_id ? r.nhan : r.kind ? `${nhanLoaiXuLy(r.kind, r.ten ?? null)}${r.bl ? ' đã thu hồi' : ''}` : r.nhan;
    const meeting = r.ph_id != null;
    return {
      ...chung, key: `bao-ph:${r.id}`, group: meeting ? 'phoi_hop_tvv' : 'bao_ph_yt', urgency: urgencyOf(han, today), contextLabel: meeting ? null : nhan,
      reason: meeting ? `GVCN đã xác nhận ${nhan} — báo gia đình và ghi kết quả` : 'Báo phụ huynh và ghi kết quả',
      tieuDe: meeting ? `Báo PH · Meeting CX/GĐCN · ${r.full_name}` : `Báo PH · ${nhan} · ${r.full_name}`, phu: meeting ? null : `Báo PH · ${nhan}`,
      actionLabel: meeting ? 'Ghi KQ' : 'Ghi báo PH', href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc', ...(meeting ? { sub: 'phoi-hop' } : {}) }),
      due: han, statusLabel: r.so_lan ? 'Chưa liên hệ được' : 'Chưa báo', viecId: r.id, soLanThu: r.so_lan,
    };
  }
  if (r.loai === 'phoi_hop') {
    const han = hanPhoiHop(r.kind, r.tao, r.han_chon, r.pb ?? null);
    const tenV = r.kind === 'other' && r.ten ? r.ten : tenViec(r.kind, r.pb ?? null);
    if (r.kind === 'bao_ph_tvv') {
      return { ...chung, key: `baoph:${r.id}`, group: 'phoi_hop', urgency: urgencyOf(han, today), attemptId: r.ph_id, contextLabel: null,
        reason: 'Nhờ TVV báo phụ huynh (4 nội dung), xong thì đánh dấu đã làm.', tieuDe: `Báo PH kết quả Test · ${r.full_name}`, phu: null,
        actionLabel: 'Mở Phối hợp SOS', href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }), due: han, statusLabel: 'Chưa làm' };
    }
    const khoa = r.kind === 'other' ? `other:${encodeURIComponent(r.ten ?? '')}` : r.kind;
    return { ...chung, key: `phoi_hop_viec:${r.id}`, group: 'phoi_hop_sos', urgency: urgencyOf(han, today), attemptId: r.ph_id, contextLabel: null,
      reason: `${tenV} · ${r.full_name}`, tieuDe: `${tenV} · ${r.full_name}`, actionLabel: 'Xác nhận',
      href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }), due: han, statusLabel: 'Chưa làm', viecId: r.id,
      phoiHop: { kind: r.kind, khoa }, emIds: [r.student_id], emTen: [r.full_name] };
  }
  if (r.loai === 'tinh_hinh') {
    return { ...chung, key: `yt_hoi_tinh_hinh:${r.id}`, group: 'yt_hoi_tinh_hinh', urgency: urgencyOf(r.han, today), contextLabel: 'Tình hình học tập',
      reason: r.nhan, tieuDe: `Tình hình học tập · ${r.full_name}`, phu: 'Tình hình học tập', actionLabel: 'Ghi kết quả',
      href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }), due: r.han, statusLabel: 'Chờ trả lời', viecId: r.id };
  }
  const xep = r.phan === 'xep_lich';
  const han = r.han_chon ?? null;
  const hop = r.hop ? ` · họp ${r.hop.slice(8, 10)}/${r.hop.slice(5, 7)}${r.hop.slice(10)}` : '';
  return { ...chung, key: `${xep ? 'meeting_xep_lich' : 'meeting_ket_qua'}:${r.id}`, group: xep ? 'meeting_xep_lich' : 'meeting_ket_qua', urgency: urgencyOf(han, today),
    attemptId: null, contextLabel: tenViec(r.kind), reason: xep ? 'Xếp lịch họp rồi bấm Hoàn thành (ngày giờ họp tuỳ chọn)' : `Ghi kết quả buổi họp rồi bấm Hoàn thành${hop}`,
    tieuDe: `${xep ? 'Xếp lịch họp' : 'Kết quả meeting'} · ${r.full_name}`, phu: xep ? null : hop.slice(3) || null, actionLabel: xep ? 'Hoàn thành' : 'Ghi KQ',
    href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }), due: han, statusLabel: 'Chưa xong', viecId: r.id, phoiHopId: r.ph_id };
}

// ---------------------------------------------------------------- GET /my-work/theo-doi

export type DongTheoDoi = { loai: LoaiGiao; refId: number; tieuDe: string; studentId: number; studentName: string; classCode: string | null;
  phuTrach: string | null; han: string | null; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string; xongLuc: string | null };

/**
 * Tab "Đang theo dõi" (chỉ gọi khi mở tab, không vào /my-work, không số đếm): việc tôi theo dõi còn mở + xong trong 7 ngày (lọc TRONG câu), chia theo loại,
 * quá hạn trước. MỘT câu (chỉ mục `idx_viec_theo_doi_nguoi`), tên người phụ trách đọc cùng câu. Việc mà tôi đang là người phụ trách (giao cho tôi, hoặc theo luật)
 * không vào tab này (đã ở "Của tôi").
 * ponytail: chỉ mục theo người đọc mọi dòng theo dõi của tôi rồi bỏ việc đã đóng > 7 ngày trong câu — dòng đọc tăng theo số việc từng theo dõi; dọn định kỳ
 * dòng theo dõi của việc đóng lâu nếu đo bản chính thấy nặng.
 */
export function viecTheoDoi(p: Principal): { nhom: { loai: LoaiGiao; ten: string; mo: DongTheoDoi[]; vuaXong: DongTheoDoi[] }[] } {
  const today = demoToday();
  const tu = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const rows = db().prepare(
    `SELECT t.loai, t.ref_id,
            COALESCE(b.student_id, x.student_id, th.student_id, mx.student_id) AS sid,
            b.trang_thai AS b_tt, b.han AS b_han, b.han_chon AS b_hc, b.nhan AS b_nhan, b.bo_luc AS b_bo, b.phoi_hop_id AS b_ph,
            (SELECT MAX(l.ghi_luc) FROM viec_bao_ph_lan l WHERE l.viec_id = b.id) AS b_xong,
            x.status AS x_tt, x.kind AS x_kind, x.custom_name AS x_ten, x.created_at AS x_tao, x.han_chon AS x_hc, x.pb_moc AS x_pb, x.updated_at AS x_luc,
            th.trang_thai AS th_tt, th.han AS th_han, COALESCE(th.tra_loi_luc, th.rut_luc) AS th_luc,
            mp.trang_thai AS mp_tt, mp.phan AS mp_phan, mp.han_chon AS mp_hc, mp.xong_luc AS mp_luc,
            COALESCE(b.phu_trach_id, x.phu_trach_id, th.phu_trach_id, mp.phu_trach_id) AS pt, pu.full_name AS pt_ten,
            s.full_name, s.consultant_user_id AS tvv, tv.full_name AS tvv_ten, c.code AS class_code, COALESCE(c.branch_id, s.branch_id) AS em_branch, g.user_id AS gvcn_id, gu.full_name AS gvcn_ten
       FROM viec_theo_doi t
       LEFT JOIN viec_bao_ph b ON t.loai = 'bao_ph' AND b.id = t.ref_id
       LEFT JOIN sos_coordination_actions x ON t.loai = 'phoi_hop' AND x.id = t.ref_id
       LEFT JOIN tinh_hinh_hoc_tap th ON t.loai = 'tinh_hinh' AND th.id = t.ref_id
       LEFT JOIN meeting_phan mp ON t.loai = 'meeting' AND mp.id = t.ref_id
       LEFT JOIN sos_coordination_actions mx ON mx.id = mp.phoi_hop_id
       JOIN students s ON s.id = COALESCE(b.student_id, x.student_id, th.student_id, mx.student_id)
       LEFT JOIN users tv ON tv.id = s.consultant_user_id
       LEFT JOIN users pu ON pu.id = COALESCE(b.phu_trach_id, x.phu_trach_id, th.phu_trach_id, mp.phu_trach_id)
       LEFT JOIN enrollments e ON e.id = (SELECT MAX(z.id) FROM enrollments z WHERE z.student_id = s.id AND z.status = 'active')
       LEFT JOIN classes c ON c.id = e.class_id
       LEFT JOIN teacher_assignments g ON g.id = (SELECT ta.id FROM teacher_assignments ta WHERE ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active'
               AND ta.effective_from <= ?2 AND (ta.effective_to IS NULL OR ta.effective_to >= ?2) ORDER BY ta.id LIMIT 1)
       LEFT JOIN users gu ON gu.id = g.user_id
      WHERE t.user_id = ?1 AND ${HOAT_DONG_O('t.user_id', 'COALESCE(c.branch_id, s.branch_id)')} AND (   -- (F) người đã rời chi nhánh của việc không thấy

           (t.loai = 'bao_ph' AND (b.trang_thai = 'mo' OR COALESCE(b.bo_luc, (SELECT MAX(l.ghi_luc) FROM viec_bao_ph_lan l WHERE l.viec_id = b.id)) >= ?3))
        OR (t.loai = 'phoi_hop' AND (x.status = 'pending' OR x.updated_at >= ?3))
        OR (t.loai = 'tinh_hinh' AND (th.trang_thai = 'mo' OR COALESCE(th.tra_loi_luc, th.rut_luc) >= ?3))
        OR (t.loai = 'meeting' AND (mp.trang_thai = 'mo' OR mp.xong_luc >= ?3)))`,
  ).all(p.userId, today, tu) as any[];
  const giu = giuViecQl(p);
  const coVai = (key: string, b: number | null) => p.grants.some((g) => g.roleKey === key && (g.branchId === null || g.branchId === b));
  const theoLoai = new Map<LoaiGiao, { mo: DongTheoDoi[]; vuaXong: DongTheoDoi[] }>();
  for (const r of rows) {
    if (r.loai === 'meeting') r.mp_vai = vaiTai(r.mp_phan, r.em_branch ?? null);
    const loai = r.loai as LoaiGiao;
    let tt: 'mo' | 'xong' | 'bo'; let han: string | null; let luc: string | null; let tieuDe: string; let nhan: string; let ptLuat: string | null; let luatLaToi: boolean;
    if (loai === 'bao_ph') {
      tt = r.b_tt; han = tt === 'mo' ? hanBaoPhHieuLuc(r.b_han, [], r.b_hc) : r.b_hc ?? r.b_han; luc = tt === 'bo' ? r.b_bo : r.b_xong;
      tieuDe = r.b_ph ? `Báo PH · Meeting CX/GĐCN · ${r.full_name}` : `Báo PH · ${r.b_nhan} · ${r.full_name}`;
      nhan = tt === 'xong' ? 'Đã báo PH' : tt === 'bo' ? 'Đã bỏ' : 'Chưa báo'; ptLuat = r.tvv_ten ?? (r.b_ph && r.gvcn_ten ? r.gvcn_ten : 'Head chi nhánh');
      luatLaToi = r.tvv ? r.tvv === p.userId : r.b_ph && r.gvcn_id ? r.gvcn_id === p.userId : giu(r.em_branch);
    } else if (loai === 'phoi_hop') {
      tt = r.x_tt === 'pending' ? 'mo' : r.x_tt === 'done' ? 'xong' : 'bo'; han = hanPhoiHop(r.x_kind, r.x_tao, r.x_hc, r.x_pb ?? null); luc = r.x_luc;
      tieuDe = `${r.x_kind === 'other' && r.x_ten ? r.x_ten : tenViec(r.x_kind, r.x_pb ?? null)} · ${r.full_name}`;
      nhan = tt === 'xong' ? 'Xong' : tt === 'bo' ? 'Đã bỏ' : 'Chưa làm'; ptLuat = r.gvcn_ten ?? 'Head chi nhánh';
      luatLaToi = r.gvcn_id ? r.gvcn_id === p.userId : giu(r.em_branch);
    } else if (loai === 'tinh_hinh') {
      tt = r.th_tt === 'mo' ? 'mo' : r.th_tt === 'xong' ? 'xong' : 'bo'; han = r.th_han; luc = r.th_luc;
      tieuDe = `Tình hình học tập · ${r.full_name}`; nhan = tt === 'xong' ? 'Đã trả lời' : tt === 'bo' ? 'Đã rút' : 'Chờ trả lời'; ptLuat = r.gvcn_ten ?? 'Head chi nhánh';
      luatLaToi = r.gvcn_id ? r.gvcn_id === p.userId : giu(r.em_branch);
    } else {
      tt = r.mp_tt; han = r.mp_hc ?? null; luc = r.mp_luc;
      tieuDe = `${TEN_PHAN[r.mp_phan as PhanMeeting]} · Meeting CX/GĐCN · ${r.full_name}`; nhan = tt === 'xong' ? 'Hoàn thành' : tt === 'bo' ? 'Đã bỏ' : 'Chưa xong';
      ptLuat = r.mp_phan === 'xep_lich' ? (r.mp_vai ? 'BPXL chi nhánh' : r.tvv_ten ?? 'Head chi nhánh') : r.mp_vai ? 'CX chi nhánh' : 'Head chi nhánh';
      luatLaToi = r.mp_vai ? coVai(r.mp_phan === 'xep_lich' ? VAI_BPXL : 'cx', r.em_branch) : r.mp_phan === 'xep_lich' && r.tvv ? r.tvv === p.userId : giu(r.em_branch);
    }
    /* (11) việc tôi đang phụ trách (giao cho tôi / theo luật) nằm ở "Của tôi" — không lặp ở đây. */
    if (r.pt ? r.pt === p.userId : luatLaToi) continue;
    const d: DongTheoDoi = { loai, refId: r.ref_id, tieuDe, studentId: r.sid, studentName: r.full_name, classCode: r.class_code ?? null,
      phuTrach: r.pt ? r.pt_ten ?? null : ptLuat, han, quaHan: tt === 'mo' && !!han && han < today, trangThai: tt, nhanTrangThai: nhan, xongLuc: tt === 'mo' ? null : luc };
    const g = theoLoai.get(loai) ?? theoLoai.set(loai, { mo: [], vuaXong: [] }).get(loai)!;
    (tt === 'mo' ? g.mo : g.vuaXong).push(d);
  }
  const xep = (a: DongTheoDoi, b: DongTheoDoi) => Number(b.quaHan) - Number(a.quaHan) || (a.han ?? '9999').localeCompare(b.han ?? '9999');
  return { nhom: LOAI_GIAO.filter((l) => theoLoai.has(l)).map((l) => {
    const g = theoLoai.get(l)!;
    return { loai: l, ten: NHAN_LOAI[l], mo: g.mo.sort(xep), vuaXong: g.vuaXong.sort((a, b) => (b.xongLuc ?? '').localeCompare(a.xongLuc ?? '')) };
  }) };
}

