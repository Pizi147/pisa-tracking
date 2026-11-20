/**
 * GV-1 (N58, chủ SP 20/11 — thiết kế `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` B, B2): KHUNG GIAO VIỆC LIÊN PHÒNG BAN, phần máy chủ.
 *
 * Một việc = (loai, ref_id). Áp cho việc có dòng lưu sẵn: `bao_ph` (viec_bao_ph — Báo PH vi phạm / tình hình / Meeting của TVV) · `phoi_hop`
 * (sos_coordination_actions — Phối hợp SOS, Meeting CX, Báo PH kết quả Test của GVCN) · `tinh_hinh` (tinh_hinh_hoc_tap chiều tvv_gvcn — GVCN trả lời) ·
 * `meeting` (meeting_phan — Xếp lịch họp · Kết quả meeting). PR sau (Vận hành, Trả lại vi phạm) thêm một dòng vào `BANG` + một nhánh `docViec`.
 *
 *  · Phụ trách: `phu_trach_id` NULL = theo luật (suy khi đọc, như nay); có = người được giao — làm ĐƯỢC đúng việc đó (quyền kiểm theo việc ở nơi ghi).
 *    Đổi được: người đang phụ trách · Head / Quản trị · CX trong phạm vi. Người nhận: tài khoản đang hoạt động có vai ở chi nhánh của việc. Không lý do.
 *    Người giao tự thành người theo dõi; người phụ trách trước (một người) thành người theo dõi. Hoàn tác = bản ghi đảo (`ghi_dao`, loại `giao_viec`).
 *  · Theo dõi (`viec_theo_doi`): chỉ xem + tin "Cập nhật" (giao / đổi người · đổi hạn · có kết quả · bỏ việc). Không tin quá hạn tự động.
 *  · Lịch sử: `viec_giao_lan` (người, theo dõi, phần Meeting) + `viec_han_lan` (hạn — bảng sẵn có).
 */
import { DS_JSON, db, tx } from '../db.ts';
import { PERMISSIONS, addDaysIso, duongHoSoHocVien, hanBaoPhHieuLuc, hanPhoiHop, ngayCongBaoPhLonNhat, ngayTheoGioVN, nhanLoaiXuLy, tenViec } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { badRequest, chuTuDo, conflict, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, nguoiVaiCuaChiNhanh, quanLyCuaChiNhanh, writeAudit } from '../platform/audit.ts';
import { GhiDao, daoLai, luuGhiDao, timGhiDao } from '../platform/ghiDao.ts';
import { HV_DANG_HOC_SQL, khoangTamDung } from '../students/tamDung.ts';
import { canManageDiscipline, gvcnCuaEm } from '../yThuc/access.ts';
import { CHI_NHANH_EM, coTheGhi, coTheSuaHan as coTheSuaHanBaoPh, suaHanBaoPh } from '../yThuc/baoPhTvv.ts';
import { suaHanPhoiHop } from '../yThuc/phoiHop.ts';
import { hanHoiTinhHinh } from '../yThuc/tinhHinh.ts';
import { giuViecQl } from './viecTvv.ts';
import type { WorkItem } from './mywork.ts';

export const LOAI_GIAO = ['bao_ph', 'phoi_hop', 'tinh_hinh', 'meeting'] as const;
export type LoaiGiao = (typeof LOAI_GIAO)[number];
const BANG: Record<LoaiGiao, string> = { bao_ph: 'viec_bao_ph', phoi_hop: 'sos_coordination_actions', tinh_hinh: 'tinh_hinh_hoc_tap', meeting: 'meeting_phan' };
const NHAN_LOAI: Record<LoaiGiao, string> = { bao_ph: 'Báo PH', phoi_hop: 'Phối hợp SOS', tinh_hinh: 'Tình hình học tập', meeting: 'Meeting CX/GĐCN' };
const LOAI_GHI_DAO = 'giao_viec';
/** Vai BPXL (PR BPXL-1 thêm) — tìm theo khoá chuỗi; chưa có vai / chưa có người → TVV của em (N58). */
export const VAI_BPXL = 'scheduler';
export const PHAN_MEETING = ['xep_lich', 'ket_qua'] as const;
export type PhanMeeting = (typeof PHAN_MEETING)[number];
const TEN_PHAN: Record<PhanMeeting, string> = { xep_lich: 'Xếp lịch họp', ket_qua: 'Kết quả meeting' };

export function docLoai(v: unknown): LoaiGiao {
  const s = String(v ?? '');
  if (!(LOAI_GIAO as readonly string[]).includes(s)) throw badRequest('Loại việc không hợp lệ.');
  return s as LoaiGiao;
}

type Viec = {
  loai: LoaiGiao; id: number; row: any; studentId: number; tenEm: string; tvv: number | null; branchId: number | null; mo: boolean; tieuDe: string;
  /** Người phụ trách theo luật (có thể nhiều: QL chi nhánh / BPXL / CX). */
  macDinh: number[];
  /** Người đang phụ trách: người được giao, không có → theo luật. */
  phuTrach: number[];
};

const ten = (r: any) => r.full_name as string;
/** Head chi nhánh, không có ai → [] (Quản trị giữ ở /my-work qua `giuViecQl`). */
const ql = (branchId: number | null) => (branchId ? quanLyCuaChiNhanh(branchId) : []);

/** Đọc một việc + người theo luật (vài câu, chỉ ở đường panel / ghi — không ở /my-work). */
export function docViec(loai: LoaiGiao, id: number): Viec {
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Việc không hợp lệ.');
  const homNay = demoToday();
  let r: any;
  if (loai === 'meeting') {
    r = db().prepare(`SELECT mp.*, x.student_id, x.kind, s.full_name, s.consultant_user_id AS tvv FROM meeting_phan mp
        JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id JOIN students s ON s.id = x.student_id WHERE mp.id = ?`).get(id);
  } else {
    r = db().prepare(`SELECT v.*, s.full_name, s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS em_branch FROM ${BANG[loai]} v JOIN students s ON s.id = v.student_id WHERE v.id = ?`).get(id);
  }
  if (!r) throw notFound('Không tìm thấy việc.');
  const branchId: number | null = loai === 'meeting' ? r.branch_id ?? null : r.em_branch ?? null;
  const tvv: number | null = r.tvv ?? null;
  const gvcn = () => gvcnCuaEm(r.student_id, homNay).gvcn;
  let macDinh: number[]; let mo: boolean; let tieuDe: string;
  if (loai === 'bao_ph') {
    const g = !tvv && r.phoi_hop_id ? gvcn() : null;   // PHOI-HOP-V2: việc sau Meeting, em chưa có TVV → GVCN
    macDinh = tvv ? [tvv] : g ? [g] : ql(branchId);
    mo = r.trang_thai === 'mo';
    tieuDe = `Báo PH · ${r.nhan} · ${ten(r)}`;
  } else if (loai === 'phoi_hop') {
    const g = gvcn();
    macDinh = g ? [g] : ql(branchId);
    mo = r.status === 'pending';
    tieuDe = `${r.kind === 'other' && r.custom_name ? r.custom_name : tenViec(r.kind, r.pb_moc ?? null)} · ${ten(r)}`;
  } else if (loai === 'tinh_hinh') {
    if (r.chieu !== 'tvv_gvcn') throw badRequest('Việc của tình hình này là Báo PH của TVV — giao ở việc Báo PH.');
    const g = gvcn();
    macDinh = g ? [g] : ql(branchId);
    mo = r.trang_thai === 'mo';
    tieuDe = `Tình hình học tập · ${ten(r)}`;
  } else {
    const vai = r.phan === 'xep_lich' ? VAI_BPXL : 'cx';
    const coVai = branchId ? nguoiVaiCuaChiNhanh(branchId, vai) : [];
    macDinh = coVai.length ? coVai : r.phan === 'xep_lich' && tvv ? [tvv] : ql(branchId);
    mo = r.trang_thai === 'mo';
    tieuDe = `${TEN_PHAN[r.phan as PhanMeeting]} · Meeting CX/GĐCN · ${ten(r)}`;
  }
  return { loai, id, row: r, studentId: r.student_id, tenEm: ten(r), tvv, branchId, mo, tieuDe, macDinh, phuTrach: r.phu_trach_id ? [r.phu_trach_id] : macDinh };
}

/** Head / Quản trị / CX có grant ở chi nhánh của việc (hoặc toàn hệ thống). */
const vaiQuanLy = (p: Principal, branchId: number | null) =>
  p.grants.some((g) => (g.roleKey === 'manager' || g.roleKey === 'system_admin' || g.roleKey === 'cx') && (g.branchId === null || g.branchId === branchId));
export const coTheDoiNguoi = (p: Principal, v: Viec) => v.phuTrach.includes(p.userId) || vaiQuanLy(p, v.branchId);
const coTheSuaTheoDoi = (p: Principal, v: Viec) => coTheDoiNguoi(p, v) || v.row.giao_boi === p.userId;
const goc = (v: Viec) => ({ consultant_user_id: v.tvv, student_id: v.studentId, phoi_hop_id: v.row.phoi_hop_id ?? null, phu_trach_id: v.row.phu_trach_id ?? null });

/** Sửa hạn = N34 ① (theo loại) + người phụ trách + người giao. */
function coTheSuaHan(p: Principal, v: Viec): boolean {
  if (!v.mo) return false;
  if (v.row.giao_boi === p.userId || v.phuTrach.includes(p.userId)) return true;
  if (v.loai === 'bao_ph') return coTheSuaHanBaoPh(p, goc(v));
  if (v.loai === 'phoi_hop') return canManageDiscipline(p, v.studentId);
  if (v.loai === 'tinh_hinh') return canManageDiscipline(p, v.studentId) || coTheGhi(p, goc(v));
  return vaiQuanLy(p, v.branchId) || coTheGhi(p, goc(v));
}

/** Người theo dõi đọc được panel (baoPhTvv `xemViecBaoPh`: chỉ xem — không SĐT phụ huynh, không nút ghi). */
export const laNguoiTheoDoi = (loai: LoaiGiao, id: number, uid: number) =>
  !!db().prepare('SELECT 1 FROM viec_theo_doi WHERE loai = ? AND ref_id = ? AND user_id = ?').get(loai, id, uid);
/** Người theo dõi / người giao / người phụ trách / người xem được hồ sơ em / Head-CX: đọc được khối giao việc. */
function requireDoc(p: Principal, v: Viec): void {
  if (v.phuTrach.includes(p.userId) || v.row.giao_boi === p.userId || vaiQuanLy(p, v.branchId)) return;
  if (can(p, PERMISSIONS.STUDENT_VIEW, { studentId: v.studentId }) || laNguoiTheoDoi(v.loai, v.id, p.userId)) return;
  throw forbidden('Việc này ngoài phạm vi của bạn.');
}

/** Tài khoản đang hoạt động có vai (đang hiệu lực) ở chi nhánh của việc hoặc toàn hệ thống. */
function kiemNguoiNhan(uid: unknown, branchId: number | null): number {
  const id = Number(uid);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Chọn người nhận việc.');
  const ok = db().prepare(`SELECT 1 FROM users u JOIN user_roles ur ON ur.user_id = u.id WHERE u.id = ? AND u.status = 'active' AND u.deleted_at IS NULL
      AND ur.status = 'active' AND (ur.branch_id IS NULL OR ur.branch_id = ?) LIMIT 1`).get(id, branchId);
  if (!ok) throw badRequest('Người này không có tài khoản đang hoạt động ở chi nhánh của việc — chọn người khác.');
  return id;
}

// ---------------------------------------------------------------- theo dõi + tin "Cập nhật"

/** TRONG tx: thêm người theo dõi (trùng → bỏ qua). Trả số dòng thêm. */
export function themTheoDoiDong(loai: LoaiGiao, refId: number, uids: readonly (number | null | undefined)[], nguon: 'auto' | 'tay', boi: number | null): number {
  let n = 0;
  const luc = nowIso();
  for (const uid of new Set(uids.filter((x): x is number => !!x))) {
    n += db().prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc) VALUES (?,?,?,?,?,?) ON CONFLICT(loai, ref_id, user_id) DO NOTHING`)
      .run(loai, refId, uid, nguon, boi, luc).changes;
  }
  return n;
}
const ghiLan = (loai: LoaiGiao, refId: number, truong: string, cu: unknown, moi: unknown, boi: number) =>
  db().prepare('INSERT INTO viec_giao_lan (loai, ref_id, truong, cu, moi, boi, luc) VALUES (?,?,?,?,?,?,?)')
    .run(loai, refId, truong, cu == null ? null : String(cu), moi == null ? null : String(moi), boi, nowIso());

export type SuKien = 'giao' | 'han' | 'ket_qua' | 'bo';
const NHAN_SU_KIEN: Record<SuKien, string> = { giao: 'Đổi người phụ trách', han: 'Đổi hạn', ket_qua: 'Có kết quả', bo: 'Đã bỏ việc' };

/**
 * TRONG tx của thao tác: tin "Cập nhật" cho người được giao + người theo dõi (trừ người làm). MỘT câu đọc người nhận.
 * `khoa` phân biệt lần (id nhật ký / hạn mới) — cùng lần gửi lại không thành hai tin. Trả tập người đã nhận.
 */
export function baoTheoDoi(loai: LoaiGiao, refId: number, boi: number, o: { suKien: SuKien; tieuDe: string; chiTiet?: string | null; khoa: string | number; duong?: string | null; studentId?: number | null;
  /** Người đã nhận tin riêng của luật cũ cho cùng sự kiện (N41: GVCN) — không gửi lần hai. */ boQua?: readonly (number | null)[] }): Set<number> {
  const nhan = new Set((db().prepare(`SELECT user_id AS u FROM viec_theo_doi WHERE loai = ?1 AND ref_id = ?2
      UNION SELECT phu_trach_id FROM ${BANG[loai]} WHERE id = ?2 AND phu_trach_id IS NOT NULL`).all(loai, refId) as any[]).map((r) => r.u as number));
  nhan.delete(boi);
  for (const u of o.boQua ?? []) if (u) nhan.delete(u);
  for (const uid of nhan) {
    notify({ userId: uid, kind: 'giao_viec', title: `${NHAN_SU_KIEN[o.suKien]} · ${o.tieuDe}`, body: o.chiTiet?.slice(0, 160) ?? null,
      entityType: o.studentId ? 'student' : null, entityId: o.studentId ?? null, dedupKey: `gv:${loai}:${refId}:${o.suKien}:${o.khoa}`,
      duong: o.duong ?? `/cong-viec?theo-doi=${loai}:${refId}` });
  }
  return nhan;
}

/** Thêm người theo dõi (chọn nhiều) — người phụ trách, người giao, Head / Quản trị / CX. */
export function themTheoDoi(p: Principal, loai: LoaiGiao, id: number, body: { userIds?: unknown }): KhoiGiaoViec {
  const v = docViec(loai, id);
  if (!coTheSuaTheoDoi(p, v)) throw forbidden('Chỉ người phụ trách, người giao, Head hoặc CX thêm được người theo dõi.');
  const ds = (Array.isArray(body.userIds) ? body.userIds : [body.userIds]).slice(0, 20).map((u) => kiemNguoiNhan(u, v.branchId));
  if (!ds.length) throw badRequest('Chọn người theo dõi.');
  tx(() => {
    for (const uid of ds) if (themTheoDoiDong(loai, id, [uid], 'tay', p.userId)) ghiLan(loai, id, 'theo_doi', null, uid, p.userId);
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
 * `userId` = người nhận · null = về mặc định (theo luật). `phuTrachCu` (tuỳ chọn) = `phu_trach_id` người dùng đang thấy — khác → 409.
 * Giao cho chính người theo luật (một người) = về mặc định (đổi TVV / GVCN sau đó việc theo người mới).
 */
export function doiPhuTrach(p: Principal, loai: LoaiGiao, id: number, body: { userId?: unknown; phuTrachCu?: unknown }): KhoiGiaoViec & { hoanTac: number | null } {
  const v = docViec(loai, id);
  if (!v.mo) throw badRequest('Việc đã kết thúc — không đổi người phụ trách.');
  if (!coTheDoiNguoi(p, v)) throw forbidden('Chỉ người đang phụ trách, Head, Quản trị hoặc CX của chi nhánh đổi được người phụ trách.');
  if ('phuTrachCu' in body && (body.phuTrachCu == null ? null : Number(body.phuTrachCu)) !== (v.row.phu_trach_id ?? null)) {
    throw conflict('Người phụ trách vừa được người khác đổi — mở lại việc để xem.');
  }
  const nhan = body.userId == null || body.userId === '' ? null : kiemNguoiNhan(body.userId, v.branchId);
  const moi = nhan !== null && v.macDinh.length === 1 && v.macDinh[0] === nhan ? null : nhan;
  if (moi === (v.row.phu_trach_id ?? null)) return { ...xemGiaoViec(p, loai, id), hoanTac: null };
  const bang = BANG[loai];
  const ghiDaoId = tx(() => {
    const g = new GhiDao(db());
    g.sua(bang, 'id = ?', id);
    g.theoDoi('viec_theo_doi', 'loai = ? AND ref_id = ?', [loai, id], () => {
      db().prepare(`UPDATE ${bang} SET phu_trach_id = ?, giao_boi = ?, giao_luc = ? WHERE id = ?`).run(moi, moi === null ? null : p.userId, moi === null ? null : nowIso(), id);
      if (moi !== null) {
        themTheoDoiDong(loai, id, [p.userId], 'tay', p.userId);   // người giao tự vào
        /* Người phụ trách trước (một người) theo dõi tiếp: theo luật → `auto` (đổi TVV / GVCN thì chuyển theo), người được giao trước → `tay`. */
        if (v.phuTrach.length === 1) themTheoDoiDong(loai, id, v.phuTrach, v.row.phu_trach_id ? 'tay' : 'auto', p.userId);
      }
    });
    /* Người phụ trách mới nếu đang theo dõi thì GIỮ dòng (xoá thì Hoàn tác không trả lại được) — tab Đang theo dõi bỏ việc của chính mình. */
    const gid = luuGhiDao(db(), { loai: LOAI_GHI_DAO, bang, id, nguoi: p.userId, ghi: g });
    ghiLan(loai, id, 'phu_trach', v.row.phu_trach_id ?? null, moi, p.userId);
    const aid = writeAudit({ actorUserId: p.userId, action: moi === null ? 'giao_viec.mac_dinh' : 'giao_viec.giao', entityType: bang, entityId: id,
      entityLabel: v.tieuDe, before: { phuTrach: v.row.phu_trach_id ?? null }, after: { phuTrach: moi } });
    const tenMoi = moi === null ? 'theo luật' : (db().prepare('SELECT full_name FROM users WHERE id = ?').get(moi) as any)?.full_name ?? '';
    const daBao = baoTheoDoi(loai, id, p.userId, { suKien: 'giao', tieuDe: v.tieuDe, chiTiet: `Phụ trách: ${tenMoi}`, khoa: aid, studentId: v.studentId });
    /* Người theo luật nhận lại việc khi về mặc định (không phải người theo dõi) — báo một tin. */
    if (moi === null) {
      for (const uid of v.macDinh) if (uid !== p.userId && !daBao.has(uid)) {
        notify({ userId: uid, kind: 'giao_viec', title: `Việc về lại bạn · ${v.tieuDe}`, entityType: 'student', entityId: v.studentId,
          dedupKey: `gv:${loai}:${id}:giao:${aid}`, duong: `/cong-viec?theo-doi=${loai}:${id}` });
      }
    }
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
    const sau = (db().prepare(`SELECT phu_trach_id FROM ${BANG[loai]} WHERE id = ?`).get(id) as any)?.phu_trach_id ?? null;
    ghiLan(loai, id, 'phu_trach', v.row.phu_trach_id ?? null, sau, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'giao_viec.hoan_tac', entityType: BANG[loai], entityId: id, entityLabel: v.tieuDe,
      before: { phuTrach: v.row.phu_trach_id ?? null }, after: { phuTrach: sau } });
  });
  return xemGiaoViec(p, loai, id);
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
    if (!db().prepare(`UPDATE ${BANG[loai]} SET ${cot} = ? WHERE id = ? AND ${cot} IS ?`).run(ganMoi, id, hienTai).changes) throw conflict('Hạn vừa được người khác sửa — mở lại việc để xem hạn mới.');
    /* `han_moi` NOT NULL: bỏ hạn (việc không hạn) ghi chuỗi rỗng. ponytail: '' = "không hạn" trong lịch sử; tách cột nếu cần. */
    db().prepare('INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, mac_dinh, boi, luc) VALUES (?,?,?,?,?,?,?)')
      .run(loai, id, hienTai, ganMoi ?? '', han === null ? 1 : 0, p.userId, nowIso());
    writeAudit({ actorUserId: p.userId, action: 'giao_viec.han', entityType: BANG[loai], entityId: id, entityLabel: v.tieuDe, before: { han: hienTai }, after: { han: ganMoi } });
    baoTheoDoi(loai, id, p.userId, { suKien: 'han', tieuDe: v.tieuDe, chiTiet: ganMoi ? `Hạn mới: ${ganMoi.slice(8, 10)}/${ganMoi.slice(5, 7)}` : 'Bỏ hạn', khoa: ganMoi ?? 'khong', studentId: v.studentId });
  });
  return xemGiaoViec(p, loai, id);
}

// ---------------------------------------------------------------- khối panel (Phụ trách · Hạn · Theo dõi · Lịch sử)

type Nguoi = { id: number; ten: string | null };
export type KhoiGiaoViec = {
  loai: LoaiGiao; id: number; tieuDe: string; studentId: number; mo: boolean;
  phuTrach: Nguoi[]; macDinh: Nguoi[]; duocGiao: boolean; giaoBoi: Nguoi | null; giaoLuc: string | null;
  han: string | null; hanMacDinh: string | null; hanChon: string | null; coTheSuaHan: boolean;
  theoDoi: (Nguoi & { nguon: 'auto' | 'tay' })[]; toiTheoDoi: boolean; coTheDoiNguoi: boolean; coTheSuaTheoDoi: boolean; hoanTacDuoc: boolean;
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
    loai, id, tieuDe: v.tieuDe, studentId: v.studentId, mo: v.mo,
    phuTrach: v.phuTrach.map(nguoi), macDinh: v.macDinh.map(nguoi), duocGiao: !!r.phu_trach_id,
    giaoBoi: r.giao_boi ? nguoi(r.giao_boi) : null, giaoLuc: r.giao_luc ?? null,
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
 * (TVV của em · GVCN · Head) cho ba phần (kể cả việc Báo PH Meeting của TVV, `baoPhId`). Phần hệ thống đã đóng (đưa lại Cần xử lý) → mở lại. Chạy lặp không đổi.
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
  db().prepare(`UPDATE meeting_phan SET trang_thai = 'mo' WHERE phoi_hop_id = ? AND trang_thai = 'bo'`).run(phoiHopId);
  if (!moi) return;
  const theoDoi = [em?.tvv ?? null, gvcnCuaEm(studentId, demoToday()).gvcn, ...ql(branchId)];
  for (const p of db().prepare('SELECT id FROM meeting_phan WHERE phoi_hop_id = ?').all(phoiHopId) as any[]) {
    const v = docViec('meeting', p.id);
    themTheoDoiDong('meeting', p.id, theoDoi.filter((u) => !v.macDinh.includes(u as number)), 'auto', null);
  }
  if (baoPhId) themTheoDoiDong('bao_ph', baoPhId, theoDoi.filter((u) => u !== em?.tvv), 'auto', null);
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
    db().prepare(`UPDATE meeting_phan SET trang_thai = 'xong', ngay_gio = ?, ket_qua = ?, xong_boi = ?, xong_luc = ?, nhap_ho_boi = ? WHERE id = ? AND trang_thai IN ('mo', 'xong')`)
      .run(ngayGio, ketQua, p.userId, nowIso(), nhapHo, id);
    ghiLan('meeting', id, sua ? 'sua' : 'xong', sua ? JSON.stringify({ ngayGio: v.row.ngay_gio ?? null, ketQua: v.row.ket_qua ?? null }) : null, JSON.stringify({ ngayGio, ketQua }), p.userId);
    const aid = writeAudit({ actorUserId: p.userId, action: sua ? 'meeting_phan.sua' : 'meeting_phan.xong', entityType: 'meeting_phan', entityId: id, entityLabel: v.tieuDe,
      before: sua ? { ngayGio: v.row.ngay_gio, ketQua: v.row.ket_qua } : { trangThai: v.row.trang_thai }, after: { ngayGio, ketQua, nhapHo } });
    baoTheoDoi('meeting', id, p.userId, { suKien: 'ket_qua', tieuDe: v.tieuDe, chiTiet: [ngayGio ? `Họp ${ngayGio.slice(8, 10)}/${ngayGio.slice(5, 7)}${ngayGio.slice(10)}` : null, ketQua].filter(Boolean).join(' · ') || 'Hoàn thành',
      khoa: aid, studentId: v.studentId });
  });
  return xemGiaoViec(p, 'meeting', id);
}

/** Hoàn tác Hoàn thành (về chưa xong, giữ chữ đã ghi để sửa) — cùng quyền. */
export function moLaiPhanMeeting(p: Principal, id: number): KhoiGiaoViec {
  const v = docViec('meeting', id);
  if (v.row.trang_thai !== 'xong') throw conflict('Phần này chưa hoàn thành — không có gì để hoàn tác.');
  if (!coTheLamMeeting(p, v)) throw forbidden('Bạn không hoàn tác được phần này.');
  tx(() => {
    db().prepare(`UPDATE meeting_phan SET trang_thai = 'mo', xong_boi = NULL, xong_luc = NULL, nhap_ho_boi = NULL WHERE id = ? AND trang_thai = 'xong'`).run(id);
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

// ---------------------------------------------------------------- đổi GVCN / TVV: người theo dõi `auto` của việc còn mở chuyển theo

const VIEC_MO_CUA_EM = (em: string) => `(
     (t.loai = 'bao_ph' AND t.ref_id IN (SELECT id FROM viec_bao_ph WHERE trang_thai = 'mo' AND student_id IN (${em})))
  OR (t.loai = 'phoi_hop' AND t.ref_id IN (SELECT id FROM sos_coordination_actions WHERE status = 'pending' AND student_id IN (${em})))
  OR (t.loai = 'tinh_hinh' AND t.ref_id IN (SELECT id FROM tinh_hinh_hoc_tap WHERE trang_thai = 'mo' AND student_id IN (${em})))
  OR (t.loai = 'meeting' AND t.ref_id IN (SELECT mp.id FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id WHERE mp.trang_thai = 'mo' AND x.student_id IN (${em}))))`;

/**
 * TRONG tx của nơi đổi: dòng theo dõi `auto` của người cũ (việc còn mở của các em) → người mới; người mới đã theo dõi → bỏ dòng cũ; người mới null → bỏ.
 * `em` = câu con SQL trả student_id (một em / em đang học một lớp), `thamSo` cho câu đó. Hai câu nhỏ (UPDATE OR IGNORE + DELETE phần còn lại).
 */
function chuyenTheoDoiAuto(em: string, thamSo: unknown[], cu: number, moi: number | null): void {
  const dk = `nguon = 'auto' AND user_id = ? AND id IN (SELECT t.id FROM viec_theo_doi t WHERE t.user_id = ? AND ${VIEC_MO_CUA_EM(em)})`;
  const ts = (n: number) => Array.from({ length: n }, () => thamSo).flat();
  if (moi) db().prepare(`UPDATE OR IGNORE viec_theo_doi SET user_id = ? WHERE ${dk}`).run(moi, cu, cu, ...ts(4));
  db().prepare(`DELETE FROM viec_theo_doi WHERE ${dk}`).run(cu, cu, ...ts(4));
}
/** Đổi TVV của em (`updateStudent`). */
export const chuyenTheoDoiTvv = (studentId: number, cu: number | null, moi: number | null) => { if (cu && cu !== moi) chuyenTheoDoiAuto('?', [studentId], cu, moi); };
/** Đổi GVCN của lớp (`ghiPhanCong`): em đang học lớp. */
export const chuyenTheoDoiGvcn = (classId: number, cu: number, moi: number | null) => {
  if (cu !== moi) chuyenTheoDoiAuto(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`, [classId], cu, moi);
};

// ---------------------------------------------------------------- /my-work: việc giao cho tôi (+ phần Meeting theo luật) — MỘT câu

const VAI_MEETING = new Set([VAI_BPXL, 'cx', 'consultant', 'manager', 'system_admin']);

/**
 * Việc người khác giao cho tôi (ba bảng có `phu_trach_id = tôi`, đi chỉ mục một phần) + phần Meeting (giao cho tôi, hoặc theo luật ở chi nhánh tôi có vai
 * BPXL / CX / TVV / Head / Quản trị). MỘT câu UNION ALL. GV thuần: mọi nhánh lọc `phu_trach_id = ?` → 0 dòng khi không ai giao.
 * Nơi gọi bỏ việc trùng khoá (người được giao cũng là người theo luật).
 */
export function viecGiaoChoToi(p: Principal, o: { today: string; branchId?: number | null; studentId?: number }): WorkItem[] {
  const vai = p.grants.filter((g) => VAI_MEETING.has(g.roleKey));
  const toanBo = vai.some((g) => g.branchId === null);
  const cn = [...new Set(vai.map((g) => g.branchId).filter((b): b is number => b !== null))];
  /* Tham số theo thứ tự xuất hiện (không đánh số: nhánh Meeting / một em có hay không). */
  const thamSo: unknown[] = [p.userId, p.userId, p.userId, p.userId];
  const meetingLuat = !vai.length ? '' : toanBo ? ' OR mp.phu_trach_id IS NULL' : ` OR (mp.phu_trach_id IS NULL AND mp.branch_id IN (${DS_JSON}))`;
  if (vai.length && !toanBo) thamSo.push(JSON.stringify(cn));
  if (o.studentId) thamSo.push(o.studentId);
  const rows = db().prepare(
    `SELECT u.*, s.full_name, s.consultant_user_id AS tvv, e.class_id, c.code AS class_code, COALESCE(c.branch_id, s.branch_id) AS em_branch, g.full_name AS giao_ten FROM (
       SELECT 'bao_ph' AS loai, v.id AS id, v.student_id AS student_id, v.phu_trach_id AS phu_trach_id, v.giao_boi AS giao_boi, v.han AS han, v.han_chon AS han_chon, v.nhan AS nhan,
              v.phoi_hop_id AS ph_id, v.tinh_hinh_id AS th_id, v.bao_lai_cua AS bl, m.kind AS kind, m.custom_name AS ten, (SELECT COUNT(*) FROM viec_bao_ph_lan l WHERE l.viec_id = v.id) AS so_lan, NULL AS pb, NULL AS tao, NULL AS phan, NULL AS co_vai, NULL AS hop,
              (SELECT MAX(r.event_date) FROM journey_events r WHERE r.student_id = v.student_id AND r.event_type = 'resume' AND r.event_date >= date(v.han, '-${ngayCongBaoPhLonNhat()} day')
                 AND EXISTS (SELECT 1 FROM journey_events q WHERE q.student_id = v.student_id AND q.event_type = 'pause' AND q.event_date <= v.han AND q.event_date <= r.event_date)) AS quay_lai
         FROM viec_bao_ph v LEFT JOIN discipline_measures m ON m.id = COALESCE(v.measure_id, v.bao_lai_cua) WHERE v.phu_trach_id = ? AND v.trang_thai = 'mo'
       UNION ALL
       SELECT 'phoi_hop', x.id, x.student_id, x.phu_trach_id, x.giao_boi, NULL, x.han_chon, NULL, x.attempt_id, NULL, NULL, x.kind, x.custom_name, NULL, x.pb_moc, x.created_at, NULL, NULL, NULL, NULL
         FROM sos_coordination_actions x WHERE x.phu_trach_id = ? AND x.status = 'pending'
       UNION ALL
       SELECT 'tinh_hinh', t.id, t.student_id, t.phu_trach_id, t.giao_boi, t.han, NULL, t.noi_dung, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
         FROM tinh_hinh_hoc_tap t WHERE t.phu_trach_id = ? AND t.trang_thai = 'mo' AND t.chieu = 'tvv_gvcn'
       UNION ALL
       SELECT 'meeting', mp.id, x.student_id, mp.phu_trach_id, mp.giao_boi, NULL, mp.han_chon, NULL, mp.phoi_hop_id, NULL, NULL, x.kind, NULL, NULL, mp.branch_id, NULL, mp.phan,
              EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users uu ON uu.id = ur.user_id
                       WHERE r.key = CASE mp.phan WHEN 'xep_lich' THEN '${VAI_BPXL}' ELSE 'cx' END AND ur.status = 'active' AND uu.status = 'active' AND uu.deleted_at IS NULL
                         AND (ur.branch_id IS NULL OR ur.branch_id = mp.branch_id)),
              (SELECT y.ngay_gio FROM meeting_phan y WHERE y.phoi_hop_id = mp.phoi_hop_id AND y.phan = 'xep_lich' AND y.trang_thai = 'xong'), NULL
         FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id WHERE mp.trang_thai = 'mo' AND (mp.phu_trach_id = ?${meetingLuat})
     ) u JOIN students s ON s.id = u.student_id AND ${HV_DANG_HOC_SQL('s')}
     LEFT JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = s.id AND x.status = 'active')
     LEFT JOIN classes c ON c.id = e.class_id LEFT JOIN users g ON g.id = u.giao_boi
     ${o.studentId ? 'WHERE u.student_id = ?' : ''}`,
  ).all(...thamSo) as any[];
  const coVai = (key: string, b: number | null) => p.grants.some((g) => g.roleKey === key && (g.branchId === null || g.branchId === b));
  const giu = giuViecQl(p);
  const items: WorkItem[] = [];
  for (const r of rows) {
    const branchId: number | null = r.loai === 'meeting' ? r.pb ?? null : r.em_branch ?? null;
    if (o.branchId && branchId !== o.branchId) continue;
    if (r.loai === 'meeting' && r.phu_trach_id !== p.userId) {
      /* Theo luật (N58): Xếp lịch — BPXL chi nhánh, không có → TVV của em, không có → Head; Kết quả — CX chi nhánh, không có → Head. */
      const cua = r.co_vai ? coVai(r.phan === 'xep_lich' ? VAI_BPXL : 'cx', branchId)
        : r.phan === 'xep_lich' && r.tvv ? r.tvv === p.userId : giu(branchId);
      if (!cua) continue;
    }
    items.push(dongGiao(r, o.today, p.userId));
  }
  return items;
}

const urgencyOf = (han: string | null, today: string) => (!han ? 'normal' : han < today ? 'overdue' : han === today ? 'today' : 'normal') as WorkItem['urgency'];

/** Một dòng /my-work — khoá + nhóm + chữ như dòng theo luật cùng loại (bỏ trùng theo khoá). */
function dongGiao(r: any, today: string, toi: number): WorkItem {
  const chung = {
    studentId: r.student_id as number, studentName: r.full_name as string, classId: r.class_id ?? null, classCode: r.class_code ?? null,
    attemptId: null, attemptNo: null, caseId: null, level: null, count: null, ownerId: toi as number | null, owner: null, mine: true,
    ...(r.giao_boi ? { giaoBoi: r.giao_ten ?? null } : {}),
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
    tieuDe: `${xep ? 'Xếp lịch họp' : 'Kết quả meeting'} · ${r.full_name}`, phu: xep ? null : hop.slice(3) || null, actionLabel: 'Hoàn thành',
    href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }), due: han, statusLabel: 'Chưa xong', viecId: r.id };
}

// ---------------------------------------------------------------- GET /my-work/theo-doi

export type DongTheoDoi = { loai: LoaiGiao; refId: number; tieuDe: string; studentId: number; studentName: string; classCode: string | null;
  phuTrach: string | null; han: string | null; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string; xongLuc: string | null };

/**
 * Tab "Đang theo dõi" (chỉ gọi khi mở tab, không vào /my-work, không số đếm): việc tôi theo dõi còn mở + vừa xong 7 ngày, chia theo loại, quá hạn trước.
 * MỘT câu (chỉ mục `idx_viec_theo_doi_nguoi`), tên người phụ trách đọc cùng câu.
 * ponytail: dòng theo dõi của việc đã xong lâu vẫn được đọc rồi lọc ở mã (đọc tăng theo số việc từng theo dõi); dọn / chỉ mục theo ngày nếu đo thấy nặng.
 */
export function viecTheoDoi(p: Principal): { nhom: { loai: LoaiGiao; ten: string; mo: DongTheoDoi[]; vuaXong: DongTheoDoi[] }[] } {
  const today = demoToday();
  const tu = addDaysIso(today, -7);
  const rows = db().prepare(
    `SELECT t.loai, t.ref_id,
            COALESCE(b.student_id, x.student_id, th.student_id, mx.student_id) AS sid,
            b.trang_thai AS b_tt, b.han AS b_han, b.han_chon AS b_hc, b.nhan AS b_nhan, b.bo_luc AS b_bo, b.phoi_hop_id AS b_ph,
            (SELECT MAX(l.ghi_luc) FROM viec_bao_ph_lan l WHERE l.viec_id = b.id) AS b_xong,
            x.status AS x_tt, x.kind AS x_kind, x.custom_name AS x_ten, x.created_at AS x_tao, x.han_chon AS x_hc, x.pb_moc AS x_pb, x.updated_at AS x_luc,
            th.trang_thai AS th_tt, th.han AS th_han, COALESCE(th.tra_loi_luc, th.rut_luc) AS th_luc,
            mp.trang_thai AS mp_tt, mp.phan AS mp_phan, mp.han_chon AS mp_hc, mp.xong_luc AS mp_luc,
            COALESCE(b.phu_trach_id, x.phu_trach_id, th.phu_trach_id, mp.phu_trach_id) AS pt, pu.full_name AS pt_ten,
            s.full_name, s.consultant_user_id AS tvv, tv.full_name AS tvv_ten, c.code AS class_code,
            (SELECT u2.full_name FROM teacher_assignments ta JOIN users u2 ON u2.id = ta.user_id WHERE ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active'
               AND ta.effective_from <= ?2 AND (ta.effective_to IS NULL OR ta.effective_to >= ?2) ORDER BY ta.id LIMIT 1) AS gvcn_ten
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
      WHERE t.user_id = ?1`,
  ).all(p.userId, today) as any[];
  const theoLoai = new Map<LoaiGiao, { mo: DongTheoDoi[]; vuaXong: DongTheoDoi[] }>();
  for (const r of rows) {
    const loai = r.loai as LoaiGiao;
    let tt: 'mo' | 'xong' | 'bo'; let han: string | null; let luc: string | null; let tieuDe: string; let nhan: string; let ptLuat: string | null;
    if (loai === 'bao_ph') {
      tt = r.b_tt; han = tt === 'mo' ? hanBaoPhHieuLuc(r.b_han, [], r.b_hc) : r.b_hc ?? r.b_han; luc = tt === 'bo' ? r.b_bo : r.b_xong;
      tieuDe = r.b_ph ? `Báo PH · Meeting CX/GĐCN · ${r.full_name}` : `Báo PH · ${r.b_nhan} · ${r.full_name}`;
      nhan = tt === 'xong' ? 'Đã báo PH' : tt === 'bo' ? 'Đã bỏ' : 'Chưa báo'; ptLuat = r.tvv_ten ?? 'Head chi nhánh';
    } else if (loai === 'phoi_hop') {
      tt = r.x_tt === 'pending' ? 'mo' : r.x_tt === 'done' ? 'xong' : 'bo'; han = hanPhoiHop(r.x_kind, r.x_tao, r.x_hc, r.x_pb ?? null); luc = r.x_luc;
      tieuDe = `${r.x_kind === 'other' && r.x_ten ? r.x_ten : tenViec(r.x_kind, r.x_pb ?? null)} · ${r.full_name}`;
      nhan = tt === 'xong' ? 'Xong' : tt === 'bo' ? 'Đã bỏ' : 'Chưa làm'; ptLuat = r.gvcn_ten ?? 'Head chi nhánh';
    } else if (loai === 'tinh_hinh') {
      tt = r.th_tt === 'mo' ? 'mo' : r.th_tt === 'xong' ? 'xong' : 'bo'; han = r.th_han; luc = r.th_luc;
      tieuDe = `Tình hình học tập · ${r.full_name}`; nhan = tt === 'xong' ? 'Đã trả lời' : tt === 'bo' ? 'Đã rút' : 'Chờ trả lời'; ptLuat = r.gvcn_ten ?? 'Head chi nhánh';
    } else {
      tt = r.mp_tt; han = r.mp_hc ?? null; luc = r.mp_luc;
      tieuDe = `${TEN_PHAN[r.mp_phan as PhanMeeting]} · Meeting CX/GĐCN · ${r.full_name}`; nhan = tt === 'xong' ? 'Hoàn thành' : tt === 'bo' ? 'Đã bỏ' : 'Chưa xong';
      ptLuat = r.mp_phan === 'xep_lich' ? 'BPXL chi nhánh' : 'CX chi nhánh';
    }
    if (r.pt === p.userId) continue;   // việc giao cho chính tôi nằm ở "Của tôi"
    if (tt !== 'mo' && (!luc || (ngayTheoGioVN(luc) ?? luc.slice(0, 10)) < tu)) continue;
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
