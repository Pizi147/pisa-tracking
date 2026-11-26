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
import { DS_JSON, db, docNho, tx } from '../db.ts';
import { PERMISSIONS, TASK_PROGRESS_LABEL, laMeetingCx, laViecTvvBaoPh, nguonBaoPh, type TaskProgress, duongHoSoHocVien, hanBaoPhHieuLuc, hanPhanMeeting, hanPhoiHop, ngayTheoGioVN, nhanLoaiXuLy, quaHanBaoPh, tenViec } from '../../../shared/domain/index.ts';
import { boVaiBpxl, can, laTvvCuaEm, laVaiThat, loadPrincipal, type Principal } from '../permissions.ts';
import { addDays, badRequest, chuTuDo, conflict, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, nguoiVaiCuaChiNhanh, quanLyCuaChiNhanh, writeAudit } from '../platform/audit.ts';
import { GhiDao, HOAN_TAC_PHUT, daoLai, luuGhiDao, timGhiDao } from '../platform/ghiDao.ts';
import { HV_DANG_HOC_SQL, LUOT_SAU_THI_SQL, SU_KIEN_TAM_DUNG_SQL, khoangTamDung, khoangTuSuKien } from '../students/tamDung.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { canManageDiscipline, gvcnCuaEm, xemLienHePh } from '../yThuc/access.ts';
import { CHI_NHANH_EM, CHO_GV_SUA, HOP_MEETING_SQL, chuHop, coTheGhi, coTheSuaHan as coTheSuaHanBaoPh, suaHanBaoPh, xuLyCon } from '../yThuc/baoPhTvv.ts';
import { suaHanPhoiHop } from '../yThuc/phoiHop.ts';
import { hanHoiTinhHinh } from '../yThuc/tinhHinh.ts';
import { giuViecQl, tvvConVai } from './viecTvv.ts';
import { trangThaiYThuc } from '../yThuc/trangThai.ts';
import type { WorkItem } from './mywork.ts';
import { VAI_GIAO_VIEC } from '../platform/timNguoi.ts';
import { CON_VAI_BPXL, KHONG_TVV_SQL, conVaiO, headCua, nguoiNhanTuDong } from './nguoiNhan.ts';
import { nhanTinHetHieuLuc } from '../classes/lienPhongBan.ts';
import { VAI_GDCN, VAI_LEAD_TVV } from '../../../shared/domain/index.ts';
import { BANG_KHUNG, CN_KHUNG, KHUNG_CO_QUYEN, KHUNG_KHONG_BPXL, LOAI_KHUNG, NHAN_KHUNG, SID_KHUNG, giaoCua, laKhung, type LoaiKhung } from './khungViec.ts';
import { docViecKhung, docViecKhungLo, type ViecKhung } from './khungDoc.ts';
import { coTheChotLoTrinh } from '../classes/quyenChuyenLop.ts';
import { quyenBanGiao, viecBanGiao } from '../classes/banGiao.ts';
import { mocNghiepVu } from '../duyet/yeuCau.ts';

/* TL-1 (N61): `tra_lai` = vi_pham_tra_lai — GV xử lý vi phạm / lần xử lý TVV trả lại (người theo luật = `nguoi_nhan`, hết vai → GVCN → Head). */
/* BAOPH-0 (N72 ⑥, 4.6 — chủ SP 26/11 "Cho mọi việc"): + `xu_ly` (Xử lý vi phạm — việc tính theo em, dòng `viec_xu_ly` id = em) · `da_thuc_hien` (discipline_measures da_duyet). */
/* LPB-0 (N73): + `nhan_tin` (viec_nhan_tin — việc BPXL "Nhận thông tin · Chuyển lớp / Đổi GV", việc của LỚP: không em, chi nhánh = `branch_id` của việc). */
/* LPB-1 (N73 ⑤): + 10 loại khung (`khungViec.ts` — việc TVV, Bàn giao, việc Head): việc tính khi đọc, bảng phụ id = đơn vị việc (mẫu `xu_ly`). */
export const LOAI_GIAO = ['bao_ph', 'phoi_hop', 'tinh_hinh', 'meeting', 'tra_lai', 'xu_ly', 'da_thuc_hien', 'nhan_tin', ...LOAI_KHUNG] as const;
export type LoaiGiao = (typeof LOAI_GIAO)[number];
/**
 * VH-1 (N59): việc Vận hành (`tasks`) dùng CHUNG người theo dõi (`viec_theo_doi`), tin "Cập nhật" (`baoTheoDoi`), dọn id (`donViec`), hết hiệu lực
 * (`donGiaoHetHieuLuc`) — KHÔNG đi đường đổi người / hạn / Hoàn tác của `LOAI_GIAO` (người phụ trách = `assignee_user_id`, không có "theo luật";
 * sửa ở `worklist/mgmttasks.ts`). Chi nhánh = `tasks.branch_id` (NULL = Toàn hệ thống: ai có vai đang hiệu lực ở đâu cũng được).
 */
export type LoaiTheoDoi = LoaiGiao | 'van_hanh';
const BANG: Record<LoaiTheoDoi, string> = { bao_ph: 'viec_bao_ph', phoi_hop: 'sos_coordination_actions', tinh_hinh: 'tinh_hinh_hoc_tap', meeting: 'meeting_phan', tra_lai: 'vi_pham_tra_lai',
  xu_ly: 'viec_xu_ly', da_thuc_hien: 'discipline_measures', nhan_tin: 'viec_nhan_tin', van_hanh: 'tasks', ...BANG_KHUNG };
/** Bảng → loại việc (bản ghi đảo xoá dòng việc → `donViec`). */
export const LOAI_CUA_BANG: Readonly<Record<string, LoaiTheoDoi>> = Object.fromEntries(Object.entries(BANG).map(([l, b]) => [b, l as LoaiTheoDoi]));
/** Câu SQL chi nhánh của việc Vận hành cho `HOAT_DONG_O` (`cn` = biểu thức chi nhánh; NULL → mọi vai đang hiệu lực). */
export const CN_VH = (cn: string) => `COALESCE(${cn}, ur_.branch_id)`;
/** Điều kiện "việc còn mở" của từng bảng (không bí danh). */
const MO: Record<LoaiGiao, string> = { bao_ph: `trang_thai = 'mo'`, phoi_hop: `status = 'pending'`, tinh_hinh: `trang_thai = 'mo'`, meeting: `trang_thai = 'mo'`, tra_lai: `trang_thai = 'mo'`,
  xu_ly: `trang_thai = 'mo'`, da_thuc_hien: `status = 'da_duyet'`, nhan_tin: `trang_thai = 'mo'`,
  ...(Object.fromEntries(LOAI_KHUNG.map((l) => [l, `trang_thai = 'mo'`])) as Record<LoaiKhung, string>) };
const NHAN_LOAI: Record<LoaiTheoDoi, string> = { bao_ph: 'Báo PH', phoi_hop: 'Phối hợp SOS', tinh_hinh: 'Tình hình học tập', meeting: 'Meeting CX/GĐCN', tra_lai: 'Vi phạm bị trả lại',
  xu_ly: 'Xử lý vi phạm', da_thuc_hien: 'Đã thực hiện', nhan_tin: 'Nhận thông tin', van_hanh: 'Vận hành', ...NHAN_KHUNG };
const LOAI_GHI_DAO = 'giao_viec';
/** Vai BPXL (PR BPXL-1 thêm) — tìm theo khoá chuỗi; chưa có vai / chưa có người → TVV của em (N58). */
export const VAI_BPXL = 'scheduler';
export const PHAN_MEETING = ['xep_lich', 'ket_qua'] as const;
export type PhanMeeting = (typeof PHAN_MEETING)[number];
const TEN_PHAN: Record<PhanMeeting, string> = { xep_lich: 'Xếp lịch họp', ket_qua: 'Kết quả meeting' };
export type Nguon = 'gvcn' | 'tvv' | 'gv_ghi' | 'head' | 'cx' | 'tay';

import { CN_EM, HOAT_DONG_O, conHieuLuc } from './hieuLuc.ts';
export { HOAT_DONG_O, conHieuLuc };   // rà #2233 P1-6: định nghĩa ở tệp lá hieuLuc.ts
/** Câu SQL: id em của một dòng việc (`v` = bí danh bảng việc). */
const SID_VIEC: Record<LoaiGiao, (v: string) => string> = {
  bao_ph: (v) => `${v}.student_id`, phoi_hop: (v) => `${v}.student_id`, tinh_hinh: (v) => `${v}.student_id`, tra_lai: (v) => `${v}.student_id`,
  xu_ly: (v) => `${v}.student_id`, da_thuc_hien: (v) => `${v}.student_id`,
  meeting: (v) => `(SELECT x_.student_id FROM sos_coordination_actions x_ WHERE x_.id = ${v}.phoi_hop_id)`,
  nhan_tin: () => 'NULL',
  ...SID_KHUNG,
};
/** Câu SQL: chi nhánh HIỆN TẠI của một dòng việc — chi nhánh em; việc của lớp (`nhan_tin`) = chi nhánh lớp. */
const CN_VIEC = (loai: LoaiGiao, v: string) => (laKhung(loai) ? CN_KHUNG(loai, v) : loai === 'nhan_tin' ? `${v}.branch_id` : CN_EM(SID_VIEC[loai](v)));
/** LPB-0 (N77): người còn hiệu lực với việc Nhận thông tin — vai ở chi nhánh lớp, hoặc còn vai BPXL bất kỳ (BPXL xếp lịch mọi chi nhánh). */
export const HL_NHAN_TIN = (u: string, cn: string) => `(${HOAT_DONG_O(u, cn)} OR ${CON_VAI_BPXL(u)})`;
/** Câu SQL "còn hoạt động + còn vai ở chi nhánh của việc" theo loại. */
const HD_VIEC = (loai: LoaiTheoDoi, u: string, cn: string) => (loai === 'nhan_tin' ? HL_NHAN_TIN(u, cn) : HOAT_DONG_O(u, loai === 'van_hanh' ? CN_VH(cn) : cn));

export function docLoai(v: unknown): LoaiGiao {
  const s = String(v ?? '');
  if (!(LOAI_GIAO as readonly string[]).includes(s)) throw badRequest('Loại việc không hợp lệ.');
  return s as LoaiGiao;
}

type Viec = {
  loai: LoaiGiao; id: number; row: any; /** null = việc của lớp (`nhan_tin`). */ studentId: number | null; tenEm: string; tvv: number | null; gvcn: number | null; branchId: number | null; mo: boolean; tieuDe: string;
  /** Người được giao CÒN hiệu lực (null = theo luật — kể cả khi người được giao đã hết vai / bị xoá). */
  pt: number | null;
  /** Người phụ trách theo luật (có thể nhiều: QL chi nhánh / BPXL / CX). */
  macDinh: number[];
  /** Người đang phụ trách: người được giao, không có → theo luật. */
  phuTrach: number[];
};

const ten = (r: any) => r.full_name as string;
/** GV-3 (PTA chốt): nhãn vai của người theo dõi — vai cao nhất LIÊN QUAN tới việc: Head · CX (vai ở chi nhánh việc / toàn hệ thống) > GVCN · TVV của em > GV ghi vi phạm > vai TVV
 * > Admin · Quản trị > GV. Không vai nào → null (web không gắn nhãn). `t.vai` = các khoá vai (group_concat) đọc cùng câu theo dõi. */
export type VaiTheoDoi = 'head' | 'cx' | 'gvcn' | 'tvv' | 'gv_ghi' | 'admin' | 'qt' | 'gv';
const vaiTheoDoi = (v: Viec, t: { user_id: number; nguon: string; vai: string | null }): VaiTheoDoi | null => {
  const k = new Set((t.vai ?? '').split(',').filter(Boolean));
  return k.has('manager') ? 'head' : k.has('cx') ? 'cx' : t.user_id === v.gvcn ? 'gvcn' : t.user_id === v.tvv ? 'tvv' : t.nguon === 'gv_ghi' ? 'gv_ghi' : k.has('consultant') ? 'tvv'
    : k.has('office_admin') ? 'admin' : k.has('system_admin') ? 'qt' : k.has('teacher') ? 'gv' : null;
};
/** Head chi nhánh (chi nhánh NULL → Head toàn hệ thống); không có ai → Quản trị. */
/* VAI-0 (N74): MỘT người — Head chi nhánh gán sớm nhất → Head toàn hệ thống → Quản trị (`headCua`). */
export const ql = (branchId: number | null): number[] => { const h = headCua(branchId); return h ? [h] : []; };
const hoatDongO = (uid: number, branchId: number | null) => (db().prepare(`SELECT ${HOAT_DONG_O('?', '?')} AS ok`).get(uid, branchId) as any).ok === 1;
/** AU-2111 P0-01: người giao (`giao_boi`; Hoàn tác: người đã đổi) chỉ có quyền theo việc khi còn hoạt động + còn vai ở chi nhánh hiện tại của em — như người được giao. */
export const laNguoiGiao = (p: Principal, v: { giao_boi?: number | null; student_id?: number | null; branch_id?: number | null; khung?: boolean }) =>
  v.giao_boi != null && v.giao_boi === p.userId && (v.student_id == null
    /* LPB-0: việc của lớp (Nhận thông tin) — còn vai ở chi nhánh lớp / còn vai BPXL. LPB-1: việc khung của lớp — còn vai ở chi nhánh lớp (không ngoại lệ BPXL). */
    ? (db().prepare(`SELECT ${v.khung ? HOAT_DONG_O('?1', '?2') : HL_NHAN_TIN('?1', '?2')} AS ok`).get(p.userId, v.branch_id ?? null) as any).ok === 1
    : nho(`gv:hieu-luc:${p.userId}:${v.student_id}`, () => conHieuLuc(p.userId, v.student_id!)));   // GET: một câu cho cả panel

/** Ngày tính hạn phần Meeting: ngày GVCN xác nhận (`performed_on`, ngày nghiệp vụ); thiếu → ngày tạo phần (giờ VN); thiếu nữa → hôm nay nghiệp vụ. */
const ngayMeeting = (ngayXacNhan: string | null | undefined, taoLuc: string | null | undefined): string =>
  (ngayXacNhan && /^\d{4}-\d{2}-\d{2}$/.test(ngayXacNhan) ? ngayXacNhan : ngayTheoGioVN(ngayXacNhan ?? taoLuc) ?? demoToday());

/** Đọc một việc + người theo luật (vài câu, chỉ ở đường panel / ghi — không ở /my-work). */
export function docViec(loai: LoaiGiao, id: number): Viec {
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Việc không hợp lệ.');
  if (loai === 'nhan_tin') return docViecNhanTin(id);
  if (laKhung(loai)) return ganKhung(loai, id, docViecKhung(loai, id));
  const homNay = demoToday();
  let r: any;
  if (loai === 'meeting') {
    r = db().prepare(`SELECT mp.*, x.student_id, x.kind, x.performed_on AS ph_ngay, s.full_name, s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS em_branch FROM meeting_phan mp
        JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id JOIN students s ON s.id = x.student_id WHERE mp.id = ?`).get(id);
  } else if (loai === 'xu_ly') {
    /* 4.6: việc tính theo em — chưa ai giao / đặt hạn thì chưa có dòng (đọc như dòng rỗng, `id` = em). */
    /* Dòng của đợt trước (`xong` / `bo`) không còn hiệu lực — đọc như chưa giao (đợt mới, `damBaoDong` làm lại dòng khi ghi). */
    r = db().prepare(`SELECT s.id AS id, s.id AS student_id, x.trang_thai, CASE WHEN x.trang_thai = 'mo' THEN x.han_chon END AS han_chon,
          CASE WHEN x.trang_thai = 'mo' THEN x.phu_trach_id END AS phu_trach_id, CASE WHEN x.trang_thai = 'mo' THEN x.giao_boi END AS giao_boi,
          CASE WHEN x.trang_thai = 'mo' THEN x.giao_luc END AS giao_luc, s.full_name, s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS em_branch
        FROM students s LEFT JOIN viec_xu_ly x ON x.id = s.id WHERE s.id = ?`).get(id);
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
    macDinh = tvv && tvvConVai(tvv, branchId) ? [tvv] : conVaiO(r.nguoi_luat, VAI_LEAD_TVV, branchId) ? [r.nguoi_luat] : ql(branchId);   // TVV hết vai = chưa có TVV   // BAOPH-0 (N72 ⑤) + VAI-0 (N76b): em chưa có TVV → Lead TVV chốt lúc sinh → Head
    mo = r.trang_thai === 'mo';
    tieuDe = `Báo PH · ${r.nhan} · ${ten(r)}`;
  } else if (loai === 'phoi_hop') {
    if (laViecTvvBaoPh(r.kind)) throw badRequest('Việc này là Báo PH của TVV — giao ở việc Báo PH.');   // BAOPH-0: dòng nguồn, không phải việc
    macDinh = gvcn ? [gvcn] : ql(branchId);
    mo = r.status === 'pending';
    tieuDe = `${r.kind === 'other' && r.custom_name ? r.custom_name : tenViec(r.kind, r.pb_moc ?? null)} · ${ten(r)}`;
  } else if (loai === 'tinh_hinh') {
    if (r.chieu !== 'tvv_gvcn') throw badRequest('Việc của tình hình này là Báo PH của TVV — giao ở việc Báo PH.');
    macDinh = gvcn ? [gvcn] : ql(branchId);
    mo = r.trang_thai === 'mo';
    tieuDe = `Tình hình học tập · ${ten(r)}`;
  } else if (loai === 'xu_ly' || loai === 'da_thuc_hien') {
    /* 4.6: người theo luật = GVCN lớp em đang học, không có → Head (N1). Việc còn khi luật Ý thức còn đòi (một nguồn với /my-work — `trangThaiYThuc`). */
    const em = trangThaiYThuc([r.student_id], homNay).get(r.student_id);
    macDinh = gvcn ? [gvcn] : ql(branchId);
    mo = loai === 'xu_ly' ? !!em && !em.tamDung && em.soBatBuoc > 0 && !em.coChoDuyet : r.status === 'da_duyet';
    r.han_luat = loai === 'xu_ly' ? em?.han ?? null : em?.daDuyet.find((x) => x.id === id)?.han ?? null;
    tieuDe = loai === 'xu_ly' ? `Xử lý vi phạm · ${ten(r)}` : `Đã thực hiện · ${nhanLoaiXuLy(r.kind, r.custom_name ?? null)} · ${ten(r)}`;
  } else if (loai === 'tra_lai') {
    /* N61: người nhận lúc trả (người ghi / GVCN); người đó hết hoạt động / hết vai ở chi nhánh em → GVCN hiện tại → Head. */
    const nn = nguoiNhanTraLai(r);
    macDinh = nn ? [nn] : ql(branchId);
    mo = r.trang_thai === 'mo';
    tieuDe = `${r.measure_id ? 'Lần xử lý' : 'Vi phạm'} bị trả lại · ${ten(r)}`;
  } else {
    const luat = luatMeeting(r.phan, r.branch_id ?? branchId, r.nguoi_luat);   // VAI-0 (N74): một người — CN của phần (`meeting_phan.branch_id`, đồng bộ khi em đổi CN)
    macDinh = luat ? [luat.u] : r.phan === 'xep_lich' && tvv ? [tvv] : ql(branchId);
    mo = r.trang_thai === 'mo';
    tieuDe = `${TEN_PHAN[r.phan as PhanMeeting]} · Meeting CX/GĐCN · ${ten(r)}`;
  }
  /* (2) người được giao hết hiệu lực (xoá / hết vai ở chi nhánh) → như NULL: việc về người theo luật, người đó không còn quyền theo việc. */
  const pt: number | null = r.phu_trach_id && hoatDongO(r.phu_trach_id, branchId) ? r.phu_trach_id : null;
  return { loai, id, row: r, studentId: r.student_id, tenEm: ten(r), tvv, gvcn, branchId, mo, tieuDe, pt, macDinh, phuTrach: pt ? [pt] : macDinh };
}

/**
 * LPB-1 (N73 ⑤): việc khung — người mặc định / còn việc / hạn luật theo CÙNG hàm với Công việc (`khungDoc.ts`). Người được giao còn hiệu lực đọc từ `giaoKhung`
 * (một câu mỗi request, chung với Công việc) — không câu theo dòng.
 */
const ganKhung = (loai: LoaiKhung, id: number, k: ViecKhung): Viec => {
  const pt: number | null = k.row.phu_trach_id && giaoCua(loai, id)?.pt === k.row.phu_trach_id ? k.row.phu_trach_id : null;
  return { loai, id, ...k, pt, phuTrach: pt ? [pt] : k.macDinh };
};
/** Rà PTA #2280 (tốc độ): nhiều việc khung cùng loại một lượt (Đang theo dõi, quét ngày) — câu theo loại, không theo dòng. */
export function docViecLo(loai: LoaiKhung, ids: readonly number[]): Map<number, Viec> {
  return new Map([...docViecKhungLo(loai, ids)].map(([id, k]) => [id, ganKhung(loai, id, k)]));
}

/**
 * LPB-0 (N73, N74, N77): việc BPXL "Nhận thông tin" — việc của LỚP. Người theo luật = người chốt lúc sinh (`nguoi_luat`); người đó hết hiệu lực → CVXL nhận lớp →
 * BPXL gán chi nhánh sớm nhất → Head (ổn định, không đếm lại việc — VAI-0 điểm 10). Hai câu.
 */
function docViecNhanTin(id: number): Viec {
  const r = db().prepare(`SELECT v.*, c.code AS lop_code, xu.full_name AS xong_ten,
      CASE WHEN v.phu_trach_id IS NOT NULL AND ${HL_NHAN_TIN('v.phu_trach_id', 'v.branch_id')} THEN v.phu_trach_id END AS pt_con
    FROM viec_nhan_tin v JOIN classes c ON c.id = v.class_id LEFT JOIN users xu ON xu.id = v.xong_boi WHERE v.id = ?`).get(id) as any;
  if (!r) throw notFound('Không tìm thấy việc.');
  const branchId: number | null = r.branch_id ?? null;
  /* Rà PTA #2266 P1-3: MỘT nguồn — cột `nguoi_luat` (chốt lúc sinh; Nhận lớp / hết vai chốt lại — `chotNguoiNhanTin`), cùng cột Công việc / Tuyến / Đang theo dõi đọc. */
  const luat = r.nguoi_luat ?? headCua(branchId);
  const macDinh = luat ? [luat] : [];
  const pt: number | null = r.pt_con ?? null;
  const tieuDe = `Nhận thông tin · ${r.loai === 'doi_gv' ? 'Đổi GV' : 'Chuyển lớp'} · ${r.lop_code}`;
  return { loai: 'nhan_tin', id, row: r, studentId: null, tenEm: r.lop_code, tvv: null, gvcn: null, branchId, mo: r.trang_thai === 'mo', tieuDe, pt, macDinh, phuTrach: pt ? [pt] : macDinh };
}

/** 4.6: việc Xử lý vi phạm chưa có dòng (tính theo em) — tạo dòng rỗng trước lần ghi đầu (giao / hạn). TRONG tx. */
export function damBaoDong(loai: LoaiGiao, id: number): void {
  if (laKhung(loai)) {
    /* LPB-1: như `xu_ly` — dòng đợt trước (`xong` / `bo`) làm lại, không mang người giao / hạn / theo dõi / lịch sử cũ. Bàn giao đổi GV / Bàn giao môn: dòng có sẵn. */
    if (loai === 'ban_giao_gv') return;
    const b = BANG_KHUNG[loai];
    const cuK = db().prepare(`SELECT trang_thai FROM ${b} WHERE id = ?`).get(id) as { trang_thai: string } | undefined;
    if (cuK?.trang_thai === 'mo') return;
    if (cuK) donViec(loai, [id]);
    if (loai === 'ban_giao_mon') {
      if (!cuK) throw notFound('Không tìm thấy việc.');
      db().prepare(`UPDATE viec_ban_giao_mon SET trang_thai = 'mo', han_chon = NULL, phu_trach_id = NULL, giao_boi = NULL, giao_luc = NULL, tao_luc = ?, xong_luc = NULL,
          lam_boi = NULL, lam_truong = NULL WHERE id = ?`).run(mocNghiepVu(), id);
      return;
    }
    db().prepare(`INSERT INTO ${b} (id, trang_thai, tao_luc) VALUES (?1, 'mo', ?2) ON CONFLICT(id) DO UPDATE
        SET trang_thai = 'mo', han_chon = NULL, phu_trach_id = NULL, giao_boi = NULL, giao_luc = NULL, tao_luc = ?2, xong_luc = NULL, lam_boi = NULL, lam_truong = NULL`).run(id, mocNghiepVu());   // rà #2280: mốc nghiệp vụ (đợt so với ngày nghiệp vụ ở Việc đã xong)
    return;
  }
  if (loai !== 'xu_ly') return;
  /* Dòng của đợt TRƯỚC (`xong` — đã xử lý; `bo` — em vào Lưu trữ) mà nay việc tính lại → dòng mới: không mang người giao / hạn / người theo dõi / lịch sử của đợt trước. */
  const cu = db().prepare('SELECT trang_thai FROM viec_xu_ly WHERE id = ?').get(id) as { trang_thai: string } | undefined;
  if (cu?.trang_thai === 'mo') return;
  if (cu) donViec('xu_ly', [id]);
  db().prepare(`INSERT INTO viec_xu_ly (id, student_id, trang_thai, tao_luc) VALUES (?1, ?1, 'mo', ?2) ON CONFLICT(id) DO UPDATE
      SET trang_thai = 'mo', han_chon = NULL, phu_trach_id = NULL, giao_boi = NULL, giao_luc = NULL, tao_luc = ?2`).run(id, nowIso());
}
/**
 * 4.6: TRONG tx — em vừa được xử lý (lưu xử lý / gửi đề xuất) → khối giao việc "Xử lý vi phạm" của đợt này `xong` (rà #2233 P2-1: giữ dòng để Hoàn tác xử lý trả lại
 * người được giao / hạn; đợt sau `damBaoDong` làm dòng mới). Một câu cho cả lô.
 */
export function xongViecXuLy(studentIds: readonly number[]): void {
  if (studentIds.length) db().prepare(`UPDATE viec_xu_ly SET trang_thai = 'xong' WHERE trang_thai = 'mo' AND id IN (${DS_JSON})`).run(JSON.stringify(studentIds));
}
/**
 * RA-2711: đợt hết KHÔNG qua lưu / gửi (xoá vi phạm, hết cửa sổ 3 vi phạm / 2 tuần) → dòng 'mo' còn người được giao + hạn cũ; đợt sau việc hiện ở người cũ,
 * đỏ Quá hạn ngay. Lượt quét nền (`quet:doi-qua-han`, ≤ 1 lần / 60 s): dòng 'mo' mà em không còn bắt buộc xử lý (không tạm dừng — tạm dừng giữ đợt) → `xong`,
 * đợt sau `damBaoDong` làm dòng mới. Không dòng 'mo' → một câu.
 */
export function dongXuLyHetDot(homNay: string): void {
  /* Chỉ dòng mang người được giao / hạn đặt tay (dòng trống không dính gì sang đợt sau). */
  const ids = (db().prepare(`SELECT id FROM viec_xu_ly WHERE trang_thai = 'mo' AND (phu_trach_id IS NOT NULL OR han_chon IS NOT NULL)`).all() as { id: number }[]).map((r) => r.id);
  if (!ids.length) return;
  const tt = trangThaiYThuc(ids, homNay);
  xongViecXuLy(ids.filter((id) => { const e = tt.get(id); return !e || (!e.tamDung && e.soBatBuoc === 0); }));
}

/**
 * LPB-1 (N73 ⑤): Bàn giao môn (lớp × môn) chưa có id → tạo dòng khung (một lần, chạy lặp trả cùng id) để panel mở khối Phụ trách · Hạn · Theo dõi.
 * Người đọc được phiếu bàn giao lớp nguồn (GV lớp, Head / QL, người được giao); việc phải còn ở Công việc (cùng hàm `viecBanGiao`).
 */
export function moBanGiaoMon(p: Principal, body: { lopId?: unknown; mon?: unknown }): { id: number } {
  const lop = Number(body.lopId), mon = String(body.mon ?? '').trim();
  if (!Number.isInteger(lop) || lop <= 0 || !mon) throw badRequest('Thiếu lớp hoặc môn.');
  if (!quyenBanGiao(p, { lop_nguon_id: lop }).doNguon) throw forbidden('Bàn giao của lớp này ngoài phạm vi của bạn.');
  const cu = db().prepare('SELECT id, trang_thai FROM viec_ban_giao_mon WHERE lop_id = ? AND mon = ?').get(lop, mon) as { id: number; trang_thai: string } | undefined;
  if (cu?.trang_thai === 'mo') return { id: cu.id };
  if (!viecBanGiao(null, null, lop).some((v) => v.loai === 'gvbm' && v.mon.split(',').includes(mon))) throw badRequest('Lớp không còn việc bàn giao môn này.');
  return tx(() => {
    if (cu) { damBaoDong('ban_giao_mon', cu.id); return { id: cu.id }; }
    const r = db().prepare(`INSERT INTO viec_ban_giao_mon (lop_id, mon, trang_thai, tao_luc) VALUES (?, ?, 'mo', ?) ON CONFLICT(lop_id, mon) DO NOTHING RETURNING id`).get(lop, mon, mocNghiepVu()) as { id: number } | undefined;
    return { id: r?.id ?? (db().prepare('SELECT id FROM viec_ban_giao_mon WHERE lop_id = ? AND mon = ?').get(lop, mon) as { id: number }).id };
  });
}

/** Head / Quản trị / CX có grant ở chi nhánh của việc (hoặc toàn hệ thống). */
export const vaiQuanLy = (p: Principal, branchId: number | null) =>
  p.grants.some((g) => (g.roleKey === 'manager' || g.roleKey === 'system_admin' || g.roleKey === 'cx') && (g.branchId === null || g.branchId === branchId));
/** LPB-0 (N77): lead BPXL (BPXL toàn hệ thống) — làm hộ mọi việc BPXL mọi chi nhánh. */
export const laLeadBpxl = (p: Principal) => p.grants.some((g) => g.roleKey === VAI_BPXL && g.branchId === null);
/**
 * N73 ④ (chủ SP 26/11, sửa N58): đổi người / hạn — người đang giữ · NGƯỜI ĐÃ GIAO (người đổi gần nhất; A → B → C thì A chỉ còn theo dõi) · Head · Quản trị · CX của
 * chi nhánh việc (+ lead BPXL với việc Nhận thông tin). Người theo dõi chỉ xem.
 */
export const coTheDoiNguoi = (p: Principal, v: Viec) => v.phuTrach.includes(p.userId) || vaiQuanLy(p, v.branchId) || (v.pt != null && laNguoiGiao(p, v.row))
  || (v.loai === 'nhan_tin' && laLeadBpxl(p));
const coTheSuaTheoDoi = (p: Principal, v: Viec) => coTheDoiNguoi(p, v) || laNguoiGiao(p, v.row);
const goc = (v: Viec) => ({ consultant_user_id: v.tvv, student_id: v.studentId!, em_branch: v.row.em_branch ?? null, phoi_hop_id: v.row.phoi_hop_id ?? null, phu_trach_id: v.pt, giao_boi: v.row.giao_boi ?? null });
/** Nguồn theo dõi của người theo luật: TVV / GVCN chuyển theo khi đổi người; Head giữ. */
const nguonLuat = (v: Viec, uid: number): Nguon => (uid === v.tvv ? 'tvv' : uid === v.gvcn ? 'gvcn' : 'head');

/** Sửa hạn = N34 ① (theo loại) + người phụ trách + người giao. Cùng điều kiện với máy chủ ghi hạn (`suaHanBaoPh`, `suaHanPhoiHop`, `suaHan`). */
function coTheSuaHan(p: Principal, v: Viec): boolean {
  if (!v.mo) return false;
  if (v.loai === 'bao_ph' && xuLyCon(v.row) !== 'con') return false;
  if (v.phuTrach.includes(p.userId) || laNguoiGiao(p, v.row)) return true;
  if (v.loai === 'nhan_tin' || v.studentId == null || laKhung(v.loai)) return coTheDoiNguoi(p, v);   // LPB-0 / LPB-1 (N73 ④): cùng nhóm với đổi người
  if (v.loai === 'bao_ph') return coTheSuaHanBaoPh(p, goc(v));
  if (v.loai === 'phoi_hop' || v.loai === 'xu_ly' || v.loai === 'da_thuc_hien') return canManageDiscipline(p, v.studentId);
  if (v.loai === 'tra_lai') return (v.row.nguoi_tra === p.userId && conHieuLuc(p.userId, v.studentId)) || canManageDiscipline(p, v.studentId) || vaiQuanLy(p, v.branchId);   // N61: người trả · người nhận · GVCN · Head
  return canManageDiscipline(p, v.studentId) || coTheGhi(p, goc(v)) || (v.loai === 'meeting' && vaiQuanLy(p, v.branchId));
}

/** Người theo dõi đọc được panel — chỉ khi còn hoạt động + còn vai ở chi nhánh của việc (baoPhTvv `xemViecBaoPh`: chỉ xem, không SĐT PH). */
export const laNguoiTheoDoi = (loai: LoaiTheoDoi, id: number, uid: number, branchId: number | null) =>
  !!db().prepare(`SELECT 1 FROM viec_theo_doi t WHERE t.loai = ?1 AND t.ref_id = ?2 AND t.user_id = ?3 AND ${HD_VIEC(loai, 't.user_id', '?4')}`).get(loai, id, uid, branchId);
/** Người theo dõi / người giao / người phụ trách / người xem được hồ sơ em / Head-CX: đọc được khối giao việc. */
function requireDoc(p: Principal, v: Viec): void {
  if (v.phuTrach.includes(p.userId) || vaiQuanLy(p, v.branchId) || laNguoiGiao(p, v.row)) return;
  /* RA-2511 (N63 ⑤): BPXL không đọc việc người khác (tên vi phạm, ghi chú xử lý) — việc giao / theo dõi của chính mình vẫn qua dòng trên / dưới. */
  /* LPB-0: việc của lớp (Nhận thông tin) — lead BPXL / BPXL bất kỳ (xếp lịch mọi chi nhánh, N77) / người xem được lớp. */
  /* LPB-1: việc khung — người xem được em / lớp (trừ vai BPXL — N57: không đọc bàn giao, hồ sơ); BPXL được giao / theo dõi vẫn qua dòng trên / dưới. */
  if (laKhung(v.loai) ? can(boVaiBpxl(p), PERMISSIONS.STUDENT_VIEW, v.studentId != null ? { studentId: v.studentId } : { classId: v.row.class_id })
    : v.studentId == null ? laLeadBpxl(p) || p.roleKeys.includes(VAI_BPXL) || can(p, PERMISSIONS.STUDENT_VIEW, { classId: v.row.class_id })
    : can(boVaiBpxl(p), PERMISSIONS.STUDENT_VIEW, { studentId: v.studentId })) return;
  if (laNguoiTheoDoi(v.loai, v.id, p.userId, v.branchId)) return;
  throw forbidden('Việc này ngoài phạm vi của bạn — nhờ Head chi nhánh của em.');
}

/** Tài khoản đang hoạt động có vai NHẬN được việc (`VAI_GIAO_VIEC` — cùng danh sách ô chọn) ở chi nhánh của việc hoặc toàn hệ thống. */
function kiemNguoiNhan(uid: unknown, branchId: number | null, nhanTin = false): number {
  const id = Number(uid);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Chọn người nhận việc.');
  /* RA-2711 (PTA chốt, N77): việc Nhận thông tin — BPXL mọi chi nhánh nhận / theo dõi được (cùng `HL_NHAN_TIN` của Công việc / "Nhận lớp"). */
  if (nhanTin && (db().prepare(`SELECT ${CON_VAI_BPXL('?1')} AS ok`).get(id) as any).ok === 1) return id;
  if (!hoatDongO(id, branchId) || !db().prepare(`SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND ur.status = 'active'
      AND r.key IN (SELECT value FROM json_each(?)) AND (ur.branch_id IS NULL OR ur.branch_id = ?)`).get(id, JSON.stringify(VAI_GIAO_VIEC), branchId)) {
    throw badRequest('Người này không có tài khoản đang hoạt động ở chi nhánh của việc — chọn người khác.');
  }
  return id;
}

/**
 * LPB-1 (N73 ④ ⑤, N63 ①): Chốt / Xét lại lộ trình chỉ giao cho người CÓ QUYỀN CHỐT lớp đó (`coTheChotLoTrinh` — không CX); "Xếp lịch MT" chỉ cho người
 * xếp lịch được ở lớp em (`plan.week` — Head / Quản trị / BPXL). Người khác: 400.
 */
export function khungNhanDuoc(loai: LoaiKhung, lopId: number | null, uid: number, cn: number | null = null): boolean {
  if (KHUNG_KHONG_BPXL.has(loai)) return loadPrincipal(uid).grants.some((g) => g.roleKey !== VAI_BPXL && (g.branchId === null || g.branchId === cn));   // rà #2280 [XM]
  if (!KHUNG_CO_QUYEN.has(loai)) return true;
  if (!lopId) return false;
  const q = loadPrincipal(uid);
  return loai === 'xep_lich_mt' ? can(q, PERMISSIONS.PLAN_WEEK, { classId: lopId }) : coTheChotLoTrinh(q, lopId);
}
function kiemNguoiNhanKhung(loai: LoaiKhung, v: Viec, uid: number): void {
  if (khungNhanDuoc(loai, v.row.class_id ?? null, uid, v.branchId)) return;
  if (KHUNG_KHONG_BPXL.has(loai)) throw badRequest('Việc này không giao cho BPXL (BPXL không xem hồ sơ học thuật / bàn giao của em) — chọn người khác.');
  throw badRequest(loai === 'xep_lich_mt' ? 'Người này không xếp lịch MT được ở lớp của em — chọn Head, Quản trị hoặc BPXL.'
    : 'Chốt / Xét lại lộ trình chỉ giao cho người có quyền chốt lộ trình lớp này (Head, Quản trị) — chọn người khác.');
}

/** Nhiều người nhận MỘT câu (rà 25/11, việc 4) — cùng luật `kiemNguoiNhan`, giữ thứ tự, bỏ trùng; một người sai → lỗi như `kiemNguoiNhan`. */
function kiemNguoiNhanLo(uids: readonly unknown[], branchId: number | null, nhanTin = false): number[] {
  const ids = [...new Set(uids.map(Number))];
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) throw badRequest('Chọn người nhận việc.');
  const ok = new Set((db().prepare(`SELECT CAST(j.value AS INTEGER) AS id FROM json_each(?1) j WHERE (${HOAT_DONG_O('j.value', '?2')}
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = j.value AND ur.status = 'active'
        AND r.key IN (SELECT value FROM json_each(?3)) AND (ur.branch_id IS NULL OR ur.branch_id = ?2)))${nhanTin ? ` OR ${CON_VAI_BPXL('j.value')}` : ''}`)
    .all(JSON.stringify(ids), branchId, JSON.stringify(VAI_GIAO_VIEC)) as { id: number }[]).map((r) => r.id));
  if (ids.some((id) => !ok.has(id))) throw badRequest('Người này không có tài khoản đang hoạt động ở chi nhánh của việc — chọn người khác.');
  return ids;
}

// ---------------------------------------------------------------- theo dõi + tin "Cập nhật"

/** TRONG tx: thêm người theo dõi (trùng / không hoạt động / không có vai ở chi nhánh của việc → bỏ qua). Trả số dòng thêm. */
export function themTheoDoiDong(loai: LoaiTheoDoi, refId: number, uids: readonly (number | null | undefined)[], nguon: Nguon, boi: number | null, branchId: number | null): number {
  let n = 0;
  const luc = nowIso();
  for (const uid of new Set(uids.filter((x): x is number => !!x))) {
    n += db().prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc) SELECT ?1, ?2, u.id, ?3, ?4, ?5 FROM users u
        WHERE u.id = ?6 AND ${HD_VIEC(loai, 'u.id', '?7')} ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(loai, refId, nguon, boi, luc, uid, branchId).changes;
  }
  return n;
}
export const ghiLan = (loai: LoaiTheoDoi, refId: number, truong: string, cu: unknown, moi: unknown, boi: number | null) =>
  db().prepare('INSERT INTO viec_giao_lan (loai, ref_id, truong, cu, moi, boi, luc) VALUES (?,?,?,?,?,?,?)')
    .run(loai, refId, truong, cu == null ? null : String(cu), moi == null ? null : String(moi), boi, nowIso());

/**
 * (1) TRONG tx của chỗ XOÁ dòng việc: dọn người theo dõi, lịch sử giao, lịch sử hạn, bản ghi đảo giao việc — id dòng việc được dùng lại
 * (`INTEGER PRIMARY KEY` không AUTOINCREMENT), không dọn thì việc mới thừa hưởng người theo dõi của việc cũ.
 */
export function donViec(loai: LoaiTheoDoi, ids: readonly number[]): void {
  if (!ids.length) return;
  const json = JSON.stringify(ids);
  /* LPB-1: một câu hỏi trước (việc không người theo dõi / lịch sử / mô tả / bản ghi đảo / việc con — thường gặp khi Hoàn tác xoá việc vừa sinh) → không chạy 7 câu xoá. */
  if (loai !== 'van_hanh' && !db().prepare(`SELECT 1 AS c FROM viec_theo_doi WHERE loai = ?1 AND ref_id IN (SELECT value FROM json_each(?2))
      UNION ALL SELECT 1 FROM viec_giao_lan WHERE loai = ?1 AND ref_id IN (SELECT value FROM json_each(?2))
      UNION ALL SELECT 1 FROM viec_han_lan WHERE loai = ?1 AND viec_id IN (SELECT value FROM json_each(?2))
      UNION ALL SELECT 1 FROM viec_mo_ta WHERE loai = ?1 AND ref_id IN (SELECT value FROM json_each(?2))
      UNION ALL SELECT 1 FROM ghi_dao WHERE ((loai = ?3 AND bang = ?4) OR (loai = 'bo_theo_doi' AND bang LIKE ?5)) AND doi_tuong_id IN (SELECT value FROM json_each(?2))
      UNION ALL SELECT 1 FROM tasks WHERE cha_loai = ?1 AND cha_id IN (SELECT value FROM json_each(?2)) LIMIT 1`).get(loai, json, LOAI_GHI_DAO, BANG[loai], `viec_theo_doi:${loai}:%`)) return;
  db().prepare(`DELETE FROM viec_theo_doi WHERE loai = ? AND ref_id IN (${DS_JSON})`).run(loai, json);
  db().prepare(`DELETE FROM viec_giao_lan WHERE loai = ? AND ref_id IN (${DS_JSON})`).run(loai, json);
  db().prepare(`DELETE FROM viec_han_lan WHERE loai = ? AND viec_id IN (${DS_JSON})`).run(loai, json);
  db().prepare(`DELETE FROM viec_mo_ta WHERE loai = ? AND ref_id IN (${DS_JSON})`).run(loai, json);   // VH-1b: mô tả của id cũ
  db().prepare(`DELETE FROM ghi_dao WHERE loai = ? AND bang = ? AND doi_tuong_id IN (${DS_JSON})`).run(LOAI_GHI_DAO, BANG[loai], json);
  db().prepare(`DELETE FROM ghi_dao WHERE loai = 'bo_theo_doi' AND bang LIKE ? AND doi_tuong_id IN (${DS_JSON})`).run(`viec_theo_doi:${loai}:%`, json);   // PTA rà #2166: bản chụp bỏ theo dõi của id cũ
  /* 4.6: việc con không theo id dùng lại — `cha_id` 0 (giữ `cha_loai`: không lọt lên bảng Vận hành; người được giao vẫn thấy ở Việc được giao). */
  if (loai !== 'van_hanh') db().prepare(`UPDATE tasks SET cha_id = 0 WHERE cha_loai = ? AND cha_id IN (${DS_JSON})`).run(loai, json);
  if (loai === 'van_hanh') {
    /* VH-1: việc Vận hành — lịch sử / cập nhật / liên kết / tệp của id cũ + bản lặp trỏ việc gốc cũ (id dùng lại không thừa hưởng). ponytail: dòng tệp xoá, tệp trong kho để dọn kho. */
    for (const b of ['task_history', 'task_updates', 'task_case_links', 'task_followers']) db().prepare(`DELETE FROM ${b} WHERE task_id IN (${DS_JSON})`).run(json);
    db().prepare(`DELETE FROM attachments WHERE owner_type = 'task' AND owner_id IN (${DS_JSON})`).run(json);
    db().prepare(`UPDATE tasks SET lap_goc_id = NULL WHERE lap_goc_id IN (${DS_JSON})`).run(json);
  }
}

export type SuKien = 'giao' | 'han' | 'ket_qua' | 'bo' | 'tien_do' | 'xong' | 'dung';
const NHAN_SU_KIEN: Record<SuKien, string> = { giao: 'Đổi người phụ trách', han: 'Đổi hạn', ket_qua: 'Có kết quả', bo: 'Đã bỏ việc',
  tien_do: 'Cập nhật tiến độ', xong: 'Xong', dung: 'Dừng hẳn' };   // VH-1: ba sự kiện của việc Vận hành

/**
 * TRONG tx của thao tác: tin "Cập nhật" cho người được giao + người theo dõi còn hoạt động (trừ người làm). MỘT câu đọc người nhận.
 * `khoa` phân biệt lần (id nhật ký) — cùng lần gửi lại không thành hai tin. Trả tập người đã nhận.
 */
export function baoTheoDoi(loai: LoaiTheoDoi, refId: number, boi: number, o: { suKien: SuKien; tieuDe: string; chiTiet?: string | null; khoa: string | number; duong?: string | null; studentId?: number | null;
  /** Người đã nhận tin riêng của luật cũ cho cùng sự kiện (N41: GVCN; người gửi tình hình) — không gửi lần hai. */ boQua?: readonly (number | null)[] }): Set<number> {
  /* (F) chỉ người còn hoạt động + còn vai ở chi nhánh hiện tại của em (như `laNguoiTheoDoi`) — người đã rời chi nhánh không nhận nội dung kết quả. */
  /* VH-1: việc Vận hành — chi nhánh của việc, người phụ trách = assignee_user_id. */
  const cn = loai === 'van_hanh' ? 'v.branch_id' : CN_VIEC(loai, 'v');   // LPB-0: việc của lớp — chi nhánh lớp
  const pt = loai === 'van_hanh' ? 'v.assignee_user_id' : 'v.phu_trach_id';
  const nhan = new Set((db().prepare(`SELECT t.user_id AS u FROM viec_theo_doi t JOIN ${BANG[loai]} v ON v.id = t.ref_id WHERE t.loai = ?1 AND t.ref_id = ?2 AND ${HD_VIEC(loai, 't.user_id', cn)}
      UNION SELECT ${pt} FROM ${BANG[loai]} v WHERE v.id = ?2 AND ${pt} IS NOT NULL AND ${HD_VIEC(loai, pt, cn)}`).all(loai, refId) as any[])
    .map((r) => r.u as number));
  nhan.delete(boi);
  for (const u of o.boQua ?? []) if (u) nhan.delete(u);
  for (const uid of nhan) {
    notify({ userId: uid, kind: 'giao_viec', title: `${NHAN_SU_KIEN[o.suKien]} · ${o.tieuDe}`, body: o.chiTiet?.slice(0, 160) ?? null,
      entityType: o.studentId ? 'student' : null, entityId: o.studentId ?? null, dedupKey: `gv:${loai}:${refId}:${o.suKien}:${o.khoa}`,
      duong: o.duong ?? (loai === 'van_hanh' ? `/cong-viec?viec=mgmt:${refId}` : `/cong-viec?theo-doi=${loai}:${refId}`) });
  }
  return nhan;
}
/** Một tin riêng (người vừa nhận / mất việc) — không gửi chính người thao tác. */
const tinRieng = (uids: readonly number[], boi: number, v: Viec, title: string, khoa: string | number) => {
  for (const uid of new Set(uids)) if (uid !== boi && (v.loai === 'nhan_tin' ? (db().prepare(`SELECT ${HL_NHAN_TIN('?1', '?2')} AS ok`).get(uid, v.branchId) as any).ok === 1 : hoatDongO(uid, v.branchId))) {
    notify({ userId: uid, kind: 'giao_viec', title: `${title} · ${v.tieuDe}`, entityType: v.studentId ? 'student' : null, entityId: v.studentId,
      dedupKey: `gv:${v.loai}:${v.id}:giao:${khoa}:${uid}`, duong: `/cong-viec?theo-doi=${v.loai}:${v.id}` });
  }
};

/** Rà Hoàn tác 25/11: dòng theo dõi vừa bị bỏ chụp vào `ghi_dao` (khoá theo việc + người) — Hoàn tác thêm lại đúng NGUỒN / người thêm cũ (`gvcn`, `head`…). */
const GD_BO_TD = (loai: LoaiGiao, uid: number) => ({ loai: 'bo_theo_doi', bang: `viec_theo_doi:${loai}:${uid}` });
type DongBo = { nguon: string; them_boi: number | null; luc: string; gd: number | null };
/**
 * Rà Hoàn tác 25/11 (+ PTA rà #2166 P1): với mỗi `uid`, dòng lịch sử theo dõi MỚI NHẤT của `uid` ở việc này là lần `boi` bỏ `uid`, trong `HOAN_TAC_PHUT`
 * phút → dòng theo dõi đã bỏ (để thêm lại y như cũ); không có trong Map = không phải Hoàn tác. Với `uid = boi = p`: điều kiện DUY NHẤT để người không có
 * quyền sửa theo dõi thêm lại chính mình; tự bỏ → tự thêm → Head bỏ thì dòng mới nhất là lần Head bỏ → không có.
 * Hai câu cho cả danh sách (lịch sử mới nhất từng người · bản chụp `ghi_dao`), không theo số người.
 */
function vuaBo(loai: LoaiGiao, id: number, uids: readonly number[], boi: number): Map<number, DongBo> {
  const ra = new Map<number, DongBo>();
  const moc = new Date(Date.now() - HOAN_TAC_PHUT * 60_000).toISOString();
  const ls = (db().prepare(`SELECT CAST(j.value AS INTEGER) AS uid, l.moi, l.boi, l.luc FROM json_each(?) j JOIN viec_giao_lan l ON l.id = (SELECT MAX(x.id)
      FROM viec_giao_lan x WHERE x.loai = ? AND x.ref_id = ? AND x.truong = 'theo_doi' AND (x.cu = CAST(j.value AS TEXT) OR x.moi = CAST(j.value AS TEXT)))`)
    .all(JSON.stringify(uids), loai, id) as { uid: number; moi: string | null; boi: number | null; luc: string }[])
    .filter((l) => l.moi === null && l.boi === boi && l.luc >= moc);
  if (!ls.length) return ra;
  const bang = new Map(ls.map((l) => [GD_BO_TD(loai, l.uid).bang, l]));
  const gs = db().prepare(`SELECT id, bang, du_lieu, luc FROM ghi_dao WHERE loai = 'bo_theo_doi' AND doi_tuong_id = ? AND dao_luc IS NULL AND bang IN (${DS_JSON}) ORDER BY id DESC`)
    .all(id, JSON.stringify([...bang.keys()])) as { id: number; bang: string; du_lieu: string; luc: string }[];
  for (const l of ls) {
    const g = gs.find((x) => x.bang === GD_BO_TD(loai, l.uid).bang);
    /* Bản chụp phải của CHÍNH lần bỏ này (ghi ngay sau dòng lịch sử) — lần bỏ đi đường khác (không chụp) → thêm `tay` như trước. */
    const d = g && g.luc >= l.luc ? (JSON.parse(g.du_lieu) as { truoc: any[] }[])[0]?.truoc[0] : null;
    ra.set(l.uid, d ? { nguon: d.nguon, them_boi: d.them_boi ?? null, luc: d.luc, gd: g!.id } : { nguon: 'tay', them_boi: boi, luc: nowIso(), gd: null });
  }
  return ra;
}

/** Thêm người theo dõi (chọn nhiều) — người phụ trách, người giao, Head / Quản trị / CX; hoặc chính mình ngay sau khi tự bỏ (`vuaBo`). Người vừa bị bỏ → thêm lại đúng dòng cũ. */
export function themTheoDoi(p: Principal, loai: LoaiGiao, id: number, body: { userIds?: unknown }): KhoiGiaoViec | { ok: true } {
  const v = docViec(loai, id);
  if (!v.mo) throw badRequest('Việc đã kết thúc — không thêm người theo dõi.');
  const tho = (Array.isArray(body.userIds) ? body.userIds : [body.userIds]).slice(0, 20);
  const tuThemLai = !coTheSuaTheoDoi(p, v);
  const chinhMinh = tho.length === 1 && Number(tho[0]) === p.userId;
  const traKhoi = () => { try { return xemGiaoViec(p, loai, id); } catch { return { ok: true as const }; } };
  /* PTA rà #2166: bấm Hoàn tác hai lần — đang theo dõi rồi thì coi như xong, không 403. */
  if (tuThemLai && chinhMinh && db().prepare('SELECT 1 FROM viec_theo_doi WHERE loai = ? AND ref_id = ? AND user_id = ?').get(loai, id, p.userId)) return traKhoi();
  const ds = tuThemLai ? (chinhMinh ? [p.userId] : []) : kiemNguoiNhanLo(tho, v.branchId, loai === 'nhan_tin');
  const bo = ds.length ? vuaBo(loai, id, ds, p.userId) : new Map<number, DongBo>();
  if (tuThemLai && !bo.has(p.userId)) throw forbidden('Chỉ người phụ trách, người giao, Head hoặc CX thêm được người theo dõi.');
  if (!ds.length) throw badRequest('Chọn người theo dõi.');
  tx(() => {
    damBaoDong(loai, id);
    /* Rà 25/11 (việc 4): MỘT câu thêm + MỘT câu lịch sử cho cả lô (trước: 2–3 câu mỗi người). Người vừa bỏ trong cửa sổ Hoàn tác về đúng nguồn cũ (`vuaBo`);
       còn lại `tay`. Người nhận đã kiểm ở trên (`kiemNguoiNhanLo`; tự thêm lại = chính mình có trong `bo`). */
    const luc = nowIso();
    const dong = ds.map((uid) => { const cu = bo.get(uid); return cu ? [uid, cu.nguon, cu.them_boi, cu.luc] : [uid, 'tay', p.userId, luc]; });
    const moi = (db().prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)
        SELECT ?1, ?2, json_extract(j.value, '$[0]'), json_extract(j.value, '$[1]'), json_extract(j.value, '$[2]'), json_extract(j.value, '$[3]') FROM json_each(?3) j WHERE true
        ON CONFLICT(loai, ref_id, user_id) DO NOTHING RETURNING user_id`).all(loai, id, JSON.stringify(dong)) as { user_id: number }[])
      .map((r) => r.user_id);
    if (moi.length) db().prepare(`INSERT INTO viec_giao_lan (loai, ref_id, truong, cu, moi, boi, luc) SELECT ?1, ?2, 'theo_doi', NULL, CAST(j.value AS TEXT), ?3, ?4 FROM json_each(?5) j`)
      .run(loai, id, p.userId, luc, JSON.stringify(moi));
    const gds = [...bo.values()].map((x) => x.gd).filter((x): x is number => x != null);
    if (gds.length) db().prepare(`UPDATE ghi_dao SET dao_luc = ?, dao_boi = ? WHERE dao_luc IS NULL AND id IN (${DS_JSON})`).run(nowIso(), p.userId, JSON.stringify(gds));
  });
  if (!tuThemLai) return xemGiaoViec(p, loai, id);
  /* Tự thêm lại mà quyền xem việc không đi theo việc theo dõi → không trả khối (như `boTheoDoi`), không báo lỗi sau khi đã lưu. */
  return traKhoi();
}

/** Bỏ một người theo dõi — tự bỏ (ai cũng được), người khác: như thêm. */
export function boTheoDoi(p: Principal, loai: LoaiGiao, id: number, uid: number): KhoiGiaoViec | { ok: true } {
  const v = docViec(loai, id);
  if (uid !== p.userId && !coTheSuaTheoDoi(p, v)) throw forbidden('Chỉ người phụ trách, người giao, Head hoặc CX bỏ được người theo dõi khác.');
  tx(() => {
    const g = new GhiDao(db());
    g.xoa('viec_theo_doi', 'loai = ? AND ref_id = ? AND user_id = ?', loai, id, uid);
    if (db().prepare('DELETE FROM viec_theo_doi WHERE loai = ? AND ref_id = ? AND user_id = ?').run(loai, id, uid).changes) {
      ghiLan(loai, id, 'theo_doi', uid, null, p.userId);
      luuGhiDao(db(), { ...GD_BO_TD(loai, uid), id, nguoi: p.userId, ghi: g });   // để Hoàn tác thêm lại đúng nguồn
    }
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
  const nhan = body.userId == null || body.userId === '' ? null : kiemNguoiNhan(body.userId, v.branchId, loai === 'nhan_tin');
  if (nhan !== null && laKhung(loai)) kiemNguoiNhanKhung(loai, v, nhan);
  const moi = nhan !== null && v.macDinh.length === 1 && v.macDinh[0] === nhan ? null : nhan;
  if (moi === v.pt && (v.row.phu_trach_id ?? null) === moi) return { ...xemGiaoViec(p, loai, id), hoanTac: null };
  const bang = BANG[loai];
  const ghiDaoId = tx(() => {
    damBaoDong(loai, id);
    const g = new GhiDao(db());
    g.sua(bang, 'id = ?', id);
    g.theoDoi('viec_theo_doi', 'loai = ? AND ref_id = ?', [loai, id], () => {
      /* Rà #2280 vòng 3: đổi người → bỏ dấu "người đã làm" của người trước (Hoàn tác ngắn không theo người cũ). */
      if (!db().prepare(`UPDATE ${bang} SET phu_trach_id = ?, giao_boi = ?, giao_luc = ?${laKhung(loai) && loai !== 'ban_giao_gv' ? ', lam_boi = NULL, lam_truong = NULL' : ''} WHERE id = ? AND phu_trach_id IS ? AND ${MO[loai]}`)
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
export function hoanTacGiao(p: Principal, loai: LoaiGiao, id: number): KhoiGiaoViec | { ok: true } {
  const v = docViec(loai, id);
  const g = timGhiDao(db(), LOAI_GHI_DAO, BANG[loai], id);
  if (!g) throw conflict('Không có lần đổi người phụ trách nào để hoàn tác.');
  if (!coTheDoiNguoi(p, v) && !laNguoiGiao(p, { giao_boi: g.nguoi, student_id: v.studentId, branch_id: v.branchId, khung: laKhung(loai) })) throw forbidden('Chỉ người đã đổi, Head, Quản trị hoặc CX hoàn tác được.');
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
  /* AU-2111 R1: đã đảo xong mà người làm không còn quyền xem khối → không trả 403 ngay sau thao tác thành công (như `boTheoDoi`). */
  try { return xemGiaoViec(p, loai, id); } catch { return { ok: true }; }
}

/**
 * (2) Người được giao hết hiệu lực (xoá tài khoản / hết vai ở chi nhánh của việc / em chuyển chi nhánh): đặt lại NULL (việc về người theo luật) + lịch sử.
 * Gọi TRONG tx của nơi đổi: `setRoles`, xoá tài khoản (`userId`), chuyển lớp (`studentIds`). Hai câu mỗi bảng, chỉ khi có đổi.
 */
export function donGiaoHetHieuLuc(o: { userId?: number; studentIds?: readonly number[] }, boi: number | null): number {
  /* MỘT câu đọc (UNION ALL bốn bảng, mỗi vế đi chỉ mục `phu_trach_id` một phần); ghi chỉ khi có dòng. */
  /* LPB-0: việc của lớp (Nhận thông tin) không theo em — chỉ vào khi xét theo người. */
  const loaiXet = LOAI_GIAO.filter((loai) => o.userId || SID_VIEC[loai]('v') !== 'NULL');   // LPB-1: việc của lớp (khung) cũng chỉ xét theo người
  const ve = loaiXet.map((loai) => {
    const sid = SID_VIEC[loai]('v');
    return `SELECT '${loai}' AS loai, v.id AS id, v.phu_trach_id AS pt FROM ${BANG[loai]} v WHERE v.${MO[loai]} AND v.phu_trach_id IS NOT NULL
        AND ${o.userId ? 'v.phu_trach_id = ?' : `${sid} IN (${DS_JSON})`} AND NOT ${HD_VIEC(loai, 'v.phu_trach_id', CN_VIEC(loai, 'v'))}`;
  });
  const rows = db().prepare(ve.join(' UNION ALL ')).all(...loaiXet.map(() => o.userId ?? JSON.stringify(o.studentIds ?? []))) as { loai: LoaiGiao; id: number; pt: number }[];
  for (const loai of LOAI_GIAO) {
    const ds = rows.filter((r) => r.loai === loai);
    if (!ds.length) continue;
    db().prepare(`UPDATE ${BANG[loai]} SET phu_trach_id = NULL, giao_boi = NULL, giao_luc = NULL WHERE id IN (${DS_JSON})`).run(JSON.stringify(ds.map((r) => r.id)));
    for (const r of ds) ghiLan(loai, r.id, 'phu_trach', r.pt, null, boi);
  }
  if (o.userId) capNhatNguoiNhanTraLai({ userId: o.userId }, boi);   // TL-1: người nhận theo luật hết vai → người kế (đổi chi nhánh em: `theoGvcnHienTai` làm)
  if (o.userId) nhanTinHetHieuLuc(o.userId);   // LPB-0 (rà PTA #2266 P1-3): người chốt việc Nhận thông tin hết vai → chốt lại theo N74 (một nguồn cho mọi nơi đọc)
  if (o.userId) khungHetQuyen(o.userId, boi);   // LPB-1: Chốt / Xét lại / Xếp lịch MT — người được giao còn vai ở chi nhánh nhưng hết quyền chốt / xếp lịch
  return rows.length + (o.userId ? vanHanhHetHieuLuc(o.userId, boi) : 0);
}

/**
 * LPB-1 (N63 ①): việc Head giao cho `userId` mà người đó (đổi vai) hết quyền chốt / xếp lịch ở lớp của việc → về người theo luật + lịch sử. Gọi ở đổi vai
 * (`donGiaoHetHieuLuc`); một câu đọc (ba chỉ mục một phần), docViec chỉ khi người đó có việc như vậy.
 */
function khungHetQuyen(userId: number, boi: number | null): void {
  /* Rà #2280: + việc TVV / Bàn giao — người nhận chỉ còn vai BPXL ở chi nhánh việc (N57). */
  const ds = db().prepare([...KHUNG_CO_QUYEN, ...KHUNG_KHONG_BPXL].map((l) => `SELECT '${l}' AS loai, id AS id FROM ${BANG_KHUNG[l]} WHERE phu_trach_id = ?1 AND trang_thai = 'mo'`).join(' UNION ALL '))
    .all(userId) as { loai: LoaiKhung; id: number }[];
  for (const r of ds) {
    let lop: number | null = null; let cn: number | null = null;
    try { const v = docViec(r.loai, r.id); lop = v.row.class_id ?? null; cn = v.branchId; } catch { /* việc không còn */ }
    if (khungNhanDuoc(r.loai, lop, userId, cn)) continue;
    db().prepare(`UPDATE ${BANG_KHUNG[r.loai]} SET phu_trach_id = NULL, giao_boi = NULL, giao_luc = NULL WHERE id = ? AND phu_trach_id = ?`).run(r.id, userId);
    ghiLan(r.loai, r.id, 'phu_trach', userId, null, boi);
  }
}

/**
 * VH-1 (N59, 9): việc Vận hành còn mở giao cho `userId` mà người đó hết hiệu lực (xoá tài khoản / hết vai ở chi nhánh của việc) → không người phụ trách
 * (Head thấy "Chưa giao") + lịch sử `task_history`. Một câu đọc (chỉ mục `idx_task_assignee`), ghi chỉ khi có dòng.
 */
function vanHanhHetHieuLuc(userId: number, boi: number | null): number {
  const ds = db().prepare(`SELECT t.id FROM tasks t WHERE t.assignee_user_id = ? AND t.progress NOT IN ('done','stopped') AND t.kind = 'branch_ops'   -- luồng Giao GV (teacher_task) giữ nguyên
      AND NOT ${HOAT_DONG_O('t.assignee_user_id', CN_VH('t.branch_id'))}`).all(userId) as { id: number }[];
  const luc = nowIso();
  for (const r of ds) {
    db().prepare('UPDATE tasks SET assignee_user_id = NULL, updated_at = ? WHERE id = ? AND assignee_user_id = ?').run(luc, r.id, userId);
    db().prepare(`INSERT INTO task_history (task_id, field, old_value, new_value, actor_user_id, created_at, reason) VALUES (?, 'assignee_user_id', ?, NULL, ?, ?, ?)`)
      .run(r.id, String(userId), boi, luc, 'Người phụ trách không còn tài khoản / vai ở chi nhánh của việc');
  }
  return ds.length;
}

/**
 * TL-1 (N61, rà #1927 (4)): người nhận THEO LUẬT của một yêu cầu trả lại — MỘT hàm cho cột `nguoi_nhan` (lúc trả + mỗi lần người giữ đổi), `docViec`,
 * `/my-work` (đọc cột) và quyền ghi (`access.ts` đọc cột). Một vi phạm: người ghi còn hoạt động + còn vai ở chi nhánh em → người ghi; không → GVCN HIỆN TẠI
 * của lớp em → Head (→ Quản trị). Cả lần xử lý: GVCN HIỆN TẠI → Head.
 */
export function nguoiNhanTraLai(r: { student_id: number; violation_id: number | null }): number | null {
  const ghi = r.violation_id ? (db().prepare('SELECT reported_by FROM violations WHERE id = ?').get(r.violation_id) as any)?.reported_by as number | undefined : undefined;
  if (ghi && conHieuLuc(ghi, r.student_id)) return ghi;
  const g = gvcnCuaEm(r.student_id, demoToday());
  if (g.gvcn) return g.gvcn;
  const cn = g.branchId ?? (db().prepare('SELECT branch_id FROM students WHERE id = ?').get(r.student_id) as any)?.branch_id ?? null;
  return ql(cn)[0] ?? null;
}

/**
 * TRONG tx của chỗ người giữ có thể đổi (đổi vai / xoá tài khoản — `{ userId }`; đổi GVCN / chuyển lớp — tập em): tính lại `nguoi_nhan` của yêu cầu còn mở,
 * đổi thì ghi lịch sử + báo người mới (khi chưa giao ai). Vài câu mỗi yêu cầu bị ảnh hưởng — chỉ ở đường ghi, không ở `/my-work`.
 */
export function capNhatNguoiNhanTraLai(o: { userId: number } | readonly number[], boi: number | null): void {
  if (Array.isArray(o) && !o.length) return;
  const rows = (Array.isArray(o)
    ? db().prepare(`SELECT t.id, t.student_id, t.violation_id, t.measure_id, t.nguoi_nhan, t.phu_trach_id, s.full_name FROM vi_pham_tra_lai t JOIN students s ON s.id = t.student_id
        WHERE t.trang_thai = 'mo' AND t.student_id IN (${DS_JSON})`).all(JSON.stringify(o))
    : db().prepare(`SELECT t.id, t.student_id, t.violation_id, t.measure_id, t.nguoi_nhan, t.phu_trach_id, s.full_name FROM vi_pham_tra_lai t JOIN students s ON s.id = t.student_id
        WHERE t.trang_thai = 'mo' AND t.nguoi_nhan = ?`).all((o as { userId: number }).userId)) as any[];
  for (const r of rows) {
    const moi = nguoiNhanTraLai(r);
    if (moi === (r.nguoi_nhan ?? null)) continue;
    db().prepare('UPDATE vi_pham_tra_lai SET nguoi_nhan = ? WHERE id = ?').run(moi, r.id);
    ghiLan('tra_lai', r.id, 'nguoi_nhan', r.nguoi_nhan, moi, boi);
    if (moi && r.phu_trach_id == null && moi !== boi) {
      notify({ userId: moi, kind: 'tra_lai_vi_pham', title: `Việc về bạn · ${r.measure_id ? 'Lần xử lý' : 'Vi phạm'} bị trả lại · ${r.full_name}`, entityType: 'student', entityId: r.student_id,
        dedupKey: `tra-lai:${r.id}:nhan:${moi}`, duong: `/cong-viec?viec=${encodeURIComponent(`yt_tra_lai:${r.id}`)}` });
    }
  }
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
  theoGvcnHienTai(studentIds);
  theoDoiVaiBaoPh({ studentIds });
}

/**
 * TD-HEAD-CX (N58 bổ sung, chủ SP 21/11): việc Báo PH sinh từ lần xử lý vi phạm (`measure_id`) — Head (vai `manager` ĐÚNG chi nhánh em) + CX (chi nhánh em
 * hoặc toàn hệ thống) theo dõi mặc định: chỉ xem + tin "Cập nhật", không thành việc. Trừ người theo luật (`nguoiGiuBaoPh`): TVV của em; em chưa có TVV → Head
 * chi nhánh em / Head toàn hệ thống là người theo luật nên không thêm — kể cả khi người đó kiêm CX (rà PTA (2)). Bí danh: `ur` `r` `u` (vai · người —
 * `NGUOI_VAI`), `v` `s` (việc · em) truyền vào.
 */
/* Nhớ theo KẾT NỐI, chỉ khi CÓ (cột không mất đi) — DB cũ đang migrate hỏi lại tới khi bước VAI-0 thêm cột; phép kiểm mở nhiều DB không lẫn nhau. */
const coCotNguoiLuatCua = new WeakSet<object>();
const coCotNguoiLuat = (): boolean => {
  const c = db() as unknown as object;
  if (coCotNguoiLuatCua.has(c)) return true;
  const co = !!db().prepare(`SELECT 1 FROM pragma_table_info('viec_bao_ph') WHERE name = 'nguoi_luat'`).get();
  if (co) coCotNguoiLuatCua.add(c);
  return co;
};
export const VAI_THEO_DOI_BAO_PH = (v: string, s: string) => {
  const cn = CN_EM(`${v}.student_id`);
  /* RA-2711 (N72 ⑤ / N76): người giữ theo luật như `nguoiGiuBaoPh` — TVV CÒN vai → Lead TVV đã chốt (còn vai ở CN em) → Head. Head theo dõi khi người giữ không
     phải Head (trước: chỉ khi em có `consultant_user_id` — em chưa TVV mà Lead TVV giữ thì Head không theo dõi; TVV hết vai thì Head vừa giữ vừa theo dõi). */
  const tvvCon = `NOT ${KHONG_TVV_SQL(s)}`;
  /* Migrate DB cũ: `theoDoiVaiBaoPh` (prGiaoViec) chạy TRƯỚC bước VAI-0 thêm cột `nguoi_luat` → chưa có cột thì chưa có Lead TVV giữ việc. */
  const leadGiu = !coCotNguoiLuat() ? '0' : `(${v}.nguoi_luat IS NOT NULL AND EXISTS (SELECT 1 FROM user_roles l_ JOIN roles lr_ ON lr_.id = l_.role_id JOIN users lu_ ON lu_.id = l_.user_id
    WHERE l_.user_id = ${v}.nguoi_luat AND lr_.key = 'lead_consultant' AND l_.status = 'active' AND lu_.status = 'active' AND lu_.deleted_at IS NULL AND l_.branch_id = ${cn}))`;
  /* PTA rà #2290 (7): việc đã GIAO cho người khác (`phu_trach_id`) → người giữ là người đó: Head theo dõi (trừ khi chính Head được giao). */
  return `ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL AND ur.user_id IS NOT ${s}.consultant_user_id AND ur.user_id IS NOT ${v}.phu_trach_id
  AND ((r.key = 'manager' AND (${v}.phu_trach_id IS NOT NULL OR ${tvvCon} OR ${leadGiu}) AND ur.branch_id = ${cn})
    OR (r.key = 'lead_consultant' AND ur.branch_id = ${cn} AND ${tvvCon})   -- VAI-0 (N76): Lead TVV chi nhánh em theo dõi (nguồn 'cx')
    OR (r.key = 'cx' AND (ur.branch_id IS NULL OR ur.branch_id = ${cn})
      AND NOT (${v}.phu_trach_id IS NULL AND NOT ${tvvCon} AND NOT ${leadGiu} AND EXISTS (SELECT 1 FROM user_roles m_ JOIN roles mr_ ON mr_.id = m_.role_id WHERE m_.user_id = ur.user_id
        AND mr_.key = 'manager' AND m_.status = 'active' AND (m_.branch_id IS NULL OR m_.branch_id = ${cn})))))`;
};
export const NGUOI_VAI = 'user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id';
/** Vai làm thay đổi người theo dõi Head / CX — đổi vai của người KHÔNG có vai này cả trước lẫn sau thì không cần đồng bộ (rà PTA (3)). */
export const VAI_THEO_DOI = new Set(['manager', 'cx', 'lead_consultant']);
/** Người đã tự bỏ / bị bỏ theo dõi việc (`boTheoDoi` ghi lịch sử) không bị thêm lại khi đồng bộ — trừ khi đã được thêm lại SAU lần bỏ (Hoàn tác, rà 25/11). */
const DA_BO_THEO_DOI = (v: string) => `NOT EXISTS (SELECT 1 FROM viec_giao_lan l_ WHERE l_.loai = 'bao_ph' AND l_.ref_id = ${v}.id AND l_.truong = 'theo_doi'
  AND l_.cu = CAST(ur.user_id AS TEXT) AND l_.moi IS NULL AND NOT EXISTS (SELECT 1 FROM viec_giao_lan l2_ WHERE l2_.loai = l_.loai AND l2_.ref_id = l_.ref_id
  AND l2_.truong = 'theo_doi' AND l2_.moi = l_.cu AND l2_.id > l_.id))`;

/** Lô đang gom (sửa cả lớp gọi `updateStudent` từng em): đổi TVV chỉ ghi id em, đồng bộ MỘT lần cuối lô (rà PTA (3)). */
let loEm: Set<number> | null = null;
export function trongLoTheoDoi<T>(fn: () => T): T {
  if (loEm) return fn();
  loEm = new Set();
  try {
    const kq = fn();
    const ids = [...loEm];
    loEm = null;
    theoDoiVaiBaoPh({ studentIds: ids });
    return kq;
  } finally { loEm = null; }
}

/**
 * TRONG tx: đồng bộ dòng `head` / `cx` TỰ ĐỘNG (`them_boi IS NULL`) của việc Báo PH vi phạm còn mở — đổi vai / tạo / duyệt / khôi phục tài khoản (`userId`),
 * em đổi chi nhánh / đổi TVV / đổi GVCN (`studentIds`), migrate (không đối số, tự lành). HAI câu cho cả tập: bỏ dòng hết điều kiện · thêm dòng còn thiếu
 * (người giữ vai đọc ngay trong câu). Dòng người dùng thêm (Head giao việc → theo dõi `nguon='head'`, `them_boi` = Head — `giao`) KHÔNG bị bỏ (rà PTA (1)).
 * Không đối số: thêm câu dọn dòng tự động của việc đã đóng quá 7 ngày (tab Đang theo dõi không tích mãi — rà PTA (4)).
 */
export function theoDoiVaiBaoPh(o: { userId?: number; studentIds?: readonly number[] } = {}): number {
  if (o.studentIds && !o.studentIds.length) return 0;
  if (o.studentIds && loEm) { for (const id of o.studentIds) loEm.add(id); return 0; }
  const ps = o.userId != null ? [o.userId] : o.studentIds ? [JSON.stringify(o.studentIds)] : [];
  /* Phạm vi đặt TRONG câu con theo chỉ mục: em → `idx_viec_bao_ph_hv` (student_id, trang_thai); người → dòng của người đó (`idx_viec_theo_doi_nguoi`) + tra id việc. */
  /* BAOPH-0 (N72 ⑤): MỌI nguồn việc TVV báo PH (vi phạm · Báo lại · Tình hình · Meeting · Trao đổi gia đình · kết quả Test) — trước chỉ việc có lần xử lý. */
  const viecMo = o.studentIds ? `SELECT id FROM viec_bao_ph WHERE student_id IN (${DS_JSON}) AND trang_thai = 'mo'`
    : `SELECT id FROM viec_bao_ph WHERE trang_thai = 'mo'`;
  const bo = db().prepare(`DELETE FROM viec_theo_doi WHERE loai = 'bao_ph' AND nguon IN ('head', 'cx') AND them_boi IS NULL
      AND ${o.userId != null ? `user_id = ? AND EXISTS (SELECT 1 FROM viec_bao_ph b_ WHERE b_.id = viec_theo_doi.ref_id AND b_.trang_thai = 'mo')` : `ref_id IN (${viecMo})`}
      AND NOT EXISTS (SELECT 1 FROM viec_bao_ph v JOIN students s ON s.id = v.student_id, ${NGUOI_VAI} WHERE v.id = viec_theo_doi.ref_id AND ur.user_id = viec_theo_doi.user_id
        AND (CASE viec_theo_doi.nguon WHEN 'head' THEN r.key = 'manager' ELSE r.key IN ('cx', 'lead_consultant') END) AND ${VAI_THEO_DOI_BAO_PH('v', 's')})`).run(...ps).changes;
  /* Một người vừa Head vừa CX → một dòng `head` (MAX). Người phụ trách hiện tại của việc không thành người theo dõi. */
  const them = db().prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)
      SELECT 'bao_ph', v.id, ur.user_id, MAX(CASE r.key WHEN 'manager' THEN 'head' ELSE 'cx' END), NULL, ? FROM viec_bao_ph v JOIN students s ON s.id = v.student_id, ${NGUOI_VAI}
       WHERE v.trang_thai = 'mo'
         AND ${o.userId != null ? 'ur.user_id = ?' : o.studentIds ? `v.student_id IN (${DS_JSON})` : '1'}
         AND ur.user_id IS NOT v.phu_trach_id AND ${VAI_THEO_DOI_BAO_PH('v', 's')} AND ${DA_BO_THEO_DOI('v')}
       GROUP BY v.id, ur.user_id
      ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(nowIso(), ...ps).changes;
  const don = o.userId == null && !o.studentIds ? db().prepare(`DELETE FROM viec_theo_doi WHERE loai = 'bao_ph' AND nguon IN ('head', 'cx') AND them_boi IS NULL
      AND ref_id IN (SELECT id FROM viec_bao_ph b_ WHERE b_.trang_thai != 'mo'
        AND COALESCE(b_.bo_luc, (SELECT MAX(l.ghi_luc) FROM viec_bao_ph_lan l WHERE l.viec_id = b_.id), b_.tao_luc) < ?)`).run(new Date(Date.now() - 7 * 86_400_000).toISOString()).changes : 0;
  return bo + them + don;
}

// ---------------------------------------------------------------- hạn

/**
 * Sửa / đặt hạn — `han` YYYY-MM-DD | null (về mặc định; việc không hạn → bỏ hạn), `hanCu` = hạn chọn đang thấy (409 khi khác).
 * bao_ph / phoi_hop đi đường sẵn có (`han_chon`, `viec_han_lan`, đã mở quyền người phụ trách + người giao); tinh_hinh sửa cột `han`; meeting `han_chon`.
 */
export function suaHan(p: Principal, loai: LoaiGiao, id: number, body: { han?: unknown; hanCu?: unknown }): KhoiGiaoViec {
  /* AU-2111 P0-01: quyền đọc khối kiểm TRƯỚC khi ghi — không còn "403 nhưng đã ghi" (quyền ghi của đường riêng rộng hơn quyền đọc khi vai đã đổi). */
  if (loai === 'bao_ph' || loai === 'phoi_hop') requireDoc(p, docViec(loai, id));
  if (loai === 'bao_ph') { suaHanBaoPh(p, id, body); return xemGiaoViec(p, loai, id); }
  if (loai === 'phoi_hop') { suaHanPhoiHop(p, id, body); return xemGiaoViec(p, loai, id); }
  if (!('hanCu' in body)) throw badRequest('Thiếu hạn đang xem — mở lại việc rồi sửa.');
  const han = body.han == null || body.han === '' ? null : String(body.han);
  if (han !== null && !isIsoDate(han)) throw badRequest('Ngày hạn không hợp lệ.');
  const hanCu = body.hanCu == null || body.hanCu === '' ? null : String(body.hanCu);
  const v = docViec(loai, id);
  requireDoc(p, v);
  if (!v.mo) throw badRequest('Việc đã kết thúc — không sửa hạn.');
  if (!coTheSuaHan(p, v)) throw forbidden('Bạn không sửa được hạn của việc này.');
  const macDinh = loai === 'tinh_hinh' ? hanHoiTinhHinh(ngayTheoGioVN(v.row.tao_luc) ?? demoToday()) : null;
  /* meeting: "Về mặc định" = `han_chon` NULL (hạn mặc định tính lại, không ghi cột) — lịch sử / tin ghi hạn HIỆU LỰC. */
  const mdMeeting = loai === 'meeting' ? hanPhanMeeting(v.row.phan, ngayMeeting(v.row.ph_ngay, v.row.tao_luc)) : null;
  const cot = loai === 'tinh_hinh' ? 'han' : 'han_chon';
  const hienTai: string | null = v.row[cot] ?? null;
  const ganMoi = han ?? macDinh;
  /* tra_lai: `han_chon` NULL = hạn mặc định (cột `han`) — lịch sử + tin ghi hạn HIỆU LỰC. */
  const hl = (x: string | null) => (loai === 'tra_lai' || loai === 'nhan_tin' ? x ?? v.row.han : loai === 'meeting' ? x ?? mdMeeting
    : loai === 'xu_ly' || loai === 'da_thuc_hien' || laKhung(loai) ? x ?? v.row.han_luat ?? null : x);
  /* tinh_hinh: `hanCu` = hạn hiệu lực đang thấy; meeting: hạn chọn đang thấy. */
  if (hanCu !== hienTai) throw conflict('Hạn vừa được người khác sửa — mở lại việc để xem hạn mới.');
  if (ganMoi === hienTai) return xemGiaoViec(p, loai, id);
  tx(() => {
    damBaoDong(loai, id);
    if (!db().prepare(`UPDATE ${BANG[loai]} SET ${cot} = ? WHERE id = ? AND ${cot} IS ? AND ${MO[loai]}`).run(ganMoi, id, hienTai).changes) throw conflict('Hạn vừa được người khác sửa — mở lại việc để xem hạn mới.');
    /* `han_moi` NOT NULL: bỏ hạn (việc không hạn) ghi chuỗi rỗng. ponytail: '' = "không hạn" trong lịch sử; tách cột nếu cần. */
    db().prepare('INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, mac_dinh, boi, luc) VALUES (?,?,?,?,?,?,?)')
      .run(loai, id, hl(hienTai), hl(ganMoi) ?? '', han === null ? 1 : 0, p.userId, nowIso());
    const aid = writeAudit({ actorUserId: p.userId, action: 'giao_viec.han', entityType: BANG[loai], entityId: id, entityLabel: v.tieuDe, before: { han: hienTai }, after: { han: ganMoi } });
    const moi = hl(ganMoi);
    baoTheoDoi(loai, id, p.userId, { suKien: 'han', tieuDe: v.tieuDe, chiTiet: moi ? `Hạn mới: ${moi.slice(8, 10)}/${moi.slice(5, 7)}` : 'Bỏ hạn', khoa: aid, studentId: v.studentId });
  });
  return xemGiaoViec(p, loai, id);
}

// ---------------------------------------------------------------- mô tả (VH-1b, N62)

const TRAN_MO_TA = 500;
/** Sửa Mô tả: người phụ trách (người được giao còn hiệu lực / người theo luật) · người giao · Head / Quản trị / CX của chi nhánh. Người theo dõi chỉ đọc. */
const coTheSuaMoTa = (p: Principal, v: Viec) => v.phuTrach.includes(p.userId) || vaiQuanLy(p, v.branchId) || laNguoiGiao(p, v.row);
/**
 * `moTa` ≤ 500 ký tự (rỗng = bỏ) · `moTaCu` BẮT BUỘC = nội dung đang thấy (null = chưa có) — khác → 409 (so-và-đổi). Lịch sử `viec_giao_lan` (truong mo_ta),
 * tin "Cập nhật" không gửi (mô tả không phải sự kiện của việc). Việc Vận hành dùng `tasks.note` (`/mgmt-tasks`), không đi đường này.
 */
export function suaMoTa(p: Principal, loai: LoaiGiao, id: number, body: { moTa?: unknown; moTaCu?: unknown }): KhoiGiaoViec {
  if (!('moTaCu' in body)) throw badRequest('Thiếu mô tả đang xem — mở lại việc rồi sửa.');
  if (!('moTa' in body)) throw badRequest('Thiếu mô tả mới (gửi chuỗi rỗng để bỏ).');
  const v = docViec(loai, id);
  /* R2 C13 (rà 24/11 — lỗi chính tả việc đã đóng): Mô tả sửa được cả khi việc đã kết thúc (lịch sử + nhật ký như thường); Hạn / Phụ trách giữ chặn. */
  if (!coTheSuaMoTa(p, v)) throw forbidden('Chỉ người phụ trách, người giao, Head, Quản trị hoặc CX sửa được mô tả.');
  const moi = chuTuDo(body.moTa, 'Mô tả', TRAN_MO_TA);
  const cuGui = body.moTaCu == null || body.moTaCu === '' ? null : String(body.moTaCu);
  const cu = (db().prepare('SELECT noi_dung FROM viec_mo_ta WHERE loai = ? AND ref_id = ?').get(loai, id) as any)?.noi_dung ?? null;
  const CHAM = 'Mô tả vừa được người khác sửa — mở lại việc để xem.';
  if (cuGui !== cu) throw conflict(CHAM);
  if (moi === cu) return xemGiaoViec(p, loai, id);
  tx(() => {
    damBaoDong(loai, id);
    const doi = moi === null
      ? db().prepare('DELETE FROM viec_mo_ta WHERE loai = ? AND ref_id = ? AND noi_dung = ?').run(loai, id, cu).changes
      : cu === null
        ? db().prepare('INSERT INTO viec_mo_ta (loai, ref_id, noi_dung, sua_boi, sua_luc) VALUES (?,?,?,?,?) ON CONFLICT(loai, ref_id) DO NOTHING').run(loai, id, moi, p.userId, nowIso()).changes
        : db().prepare('UPDATE viec_mo_ta SET noi_dung = ?, sua_boi = ?, sua_luc = ? WHERE loai = ? AND ref_id = ? AND noi_dung = ?').run(moi, p.userId, nowIso(), loai, id, cu).changes;
    if (!doi) throw conflict(CHAM);
    ghiLan(loai, id, 'mo_ta', cu, moi, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'giao_viec.mo_ta', entityType: BANG[loai], entityId: id, entityLabel: v.tieuDe, before: { moTa: cu }, after: { moTa: moi } });
  });
  return xemGiaoViec(p, loai, id);
}

// ---------------------------------------------------------------- khối panel (Phụ trách · Hạn · Theo dõi · Lịch sử)

type Nguoi = { id: number; ten: string | null };
export type KhoiGiaoViec = {
  loai: LoaiGiao; id: number; tieuDe: string; studentId: number | null; mo: boolean; branchId: number | null;
  phuTrach: Nguoi[]; macDinh: Nguoi[]; duocGiao: boolean; giaoBoi: Nguoi | null; giaoLuc: string | null;
  han: string | null; hanMacDinh: string | null; hanChon: string | null; coTheSuaHan: boolean;
  /** TL-1 / GV-2: Báo PH "Chờ GV sửa" — hạn tạm dừng, giao diện không tô quá hạn (`quaHanBaoPh`). */
  tamDung: boolean;
  /** TL-2: hạn đang có do MÁY tính lại khi hết "Chờ GV sửa" (dòng hạn cuối `mac_dinh` = 2, còn đúng hạn chọn) — không hiện như "đã chỉnh". */
  hanTinhLai: boolean;
  theoDoi: (Nguoi & { nguon: Nguon; vai: VaiTheoDoi | null })[]; toiTheoDoi: boolean; coTheDoiNguoi: boolean; coTheSuaTheoDoi: boolean; hoanTacDuoc: boolean;
  /** VH-1b (N62): Mô tả tuỳ chọn (một chỗ chung theo loai × id) — `noiDung` gửi lại làm `moTaCu` khi sửa; người theo dõi chỉ đọc. */
  moTa: { noiDung: string; suaBoi: string | null; suaLuc: string } | null; coTheSuaMoTa: boolean;
  /** Mỗi lần đổi người / theo dõi / hạn / phần Meeting, cũ trước: `truong` phu_trach | theo_doi | han | xong | sua | mo_lai. */
  lichSu: { truong: string; cu: string | null; moi: string | null; cuTen: string | null; moiTen: string | null; nguoi: string | null; luc: string }[];
  /** BAOPH-0 (N72 ⑥, 4.6): việc con (N59, một tầng) gắn việc này — tên · người · hạn · tiến độ; không chặn việc cha, không vào số việc của việc cha. */
  viecCon: { id: number; ten: string; nguoi: string | null; han: string | null; tienDo: string }[];
  /** Phần Meeting (loai meeting). */
  meeting?: { phan: PhanMeeting; ten: string; phoiHopId: number; trangThai: 'mo' | 'xong' | 'bo'; ngayGio: string | null; ketQua: string | null;
    xongBoi: string | null; xongLuc: string | null; nhapHoBoi: string | null; coTheLam: boolean };
};

function hanCua(v: Viec): { han: string | null; macDinh: string | null; chon: string | null } {
  const r = v.row;
  if (v.loai === 'nhan_tin') return { han: r.han_chon ?? r.han, macDinh: r.han, chon: r.han_chon ?? null };   // LPB-0: hạn Chủ nhật lúc sinh
  if (v.loai === 'bao_ph') {
    const k = khoangTamDung([v.studentId!])[v.studentId!];
    return { han: hanBaoPhHieuLuc(r.han, k, r.han_chon), macDinh: hanBaoPhHieuLuc(r.han, k), chon: r.han_chon ?? null };
  }
  if (v.loai === 'phoi_hop') return { han: hanPhoiHop(r.kind, r.created_at, r.han_chon, r.pb_moc ?? null), macDinh: hanPhoiHop(r.kind, r.created_at, null, r.pb_moc ?? null), chon: r.han_chon ?? null };
  if (v.loai === 'tinh_hinh') {
    const md = hanHoiTinhHinh(ngayTheoGioVN(r.tao_luc) ?? demoToday());
    return { han: r.han ?? null, macDinh: md, chon: r.han && r.han !== md ? r.han : null };
  }
  if (v.loai === 'tra_lai') return { han: r.han_chon ?? r.han, macDinh: r.han, chon: r.han_chon ?? null };
  if (v.loai === 'xu_ly' || v.loai === 'da_thuc_hien' || laKhung(v.loai)) return { han: r.han_chon ?? r.han_luat ?? null, macDinh: r.han_luat ?? null, chon: r.han_chon ?? null };
  /* meeting (chủ SP 22/11): hạn mặc định 5 / 14 ngày từ ngày GVCN xác nhận — `han_chon` chỉ khi người dùng sửa. */
  const md = hanPhanMeeting(r.phan, ngayMeeting(r.ph_ngay, r.tao_luc));
  return { han: r.han_chon ?? md, macDinh: md, chon: r.han_chon ?? null };
}

/** Phần Meeting làm được: người phụ trách · Head / Quản trị / CX · TVV của em / TVV cùng chi nhánh (nhập hộ — Kết quả meeting; Xếp lịch khi chưa BPXL đã là TVV). */
const coTheLamMeeting = (p: Principal, v: Viec) =>
  v.phuTrach.includes(p.userId) || vaiQuanLy(p, v.branchId) || (v.row.phan === 'ket_qua' && coTheGhi(p, { consultant_user_id: v.tvv, student_id: v.studentId!, em_branch: v.row.em_branch ?? null }));

export function xemGiaoViec(p: Principal, loai: LoaiGiao, id: number): KhoiGiaoViec {
  const v = docViec(loai, id);
  requireDoc(p, v);
  const r = v.row;
  /* GV-3 (PTA chốt): nhãn chip theo VAI ở chi nhánh của việc (không theo nguồn) — vai đọc TRONG cùng câu (một câu con mỗi dòng theo dõi, đi chỉ mục user_roles). */
  const td = db().prepare(`SELECT t.user_id, t.nguon, u.full_name,
      (SELECT group_concat(r.key) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = t.user_id AND ur.status = 'active' AND (ur.branch_id IS NULL OR ur.branch_id IS ?3)) AS vai
    FROM viec_theo_doi t LEFT JOIN users u ON u.id = t.user_id WHERE t.loai = ?1 AND t.ref_id = ?2 ORDER BY t.id`).all(loai, id, v.branchId) as any[];
  const mt = db().prepare('SELECT m.noi_dung, m.sua_luc, u.full_name FROM viec_mo_ta m LEFT JOIN users u ON u.id = m.sua_boi WHERE m.loai = ? AND m.ref_id = ?').get(loai, id) as any;
  const lan = db().prepare(
    `SELECT l.truong AS truong, l.cu AS cu, l.moi AS moi, l.luc AS luc, u.full_name AS nguoi FROM viec_giao_lan l LEFT JOIN users u ON u.id = l.boi WHERE l.loai = ?1 AND l.ref_id = ?2
     UNION ALL SELECT CASE h.mac_dinh WHEN 2 THEN 'han_tinh_lai' ELSE 'han' END, h.han_cu, NULLIF(h.han_moi, ''), h.luc, u.full_name FROM viec_han_lan h LEFT JOIN users u ON u.id = h.boi WHERE h.loai = ?1 AND h.viec_id = ?2
     ORDER BY 4`,
  ).all(loai, id) as any[];
  const ids = new Set<number>([...v.phuTrach, ...v.macDinh, ...(r.giao_boi ? [r.giao_boi] : []), ...(r.xong_boi ? [r.xong_boi] : []), ...(r.nhap_ho_boi ? [r.nhap_ho_boi] : []),
    ...lan.filter((l) => l.truong === 'phu_trach' || l.truong === 'theo_doi').flatMap((l) => [l.cu, l.moi]).filter(Boolean).map(Number)]);
  const tenCua = new Map<number, string>((db().prepare(`SELECT id, full_name FROM users WHERE id IN (${DS_JSON})`).all(JSON.stringify([...ids])) as any[]).map((u) => [u.id, u.full_name]));
  const nguoi = (uid: number): Nguoi => ({ id: uid, ten: tenCua.get(uid) ?? null });
  const tenSo = (s: string | null) => (s && /^\d+$/.test(s) ? tenCua.get(Number(s)) ?? null : null);
  const h = hanCua(v);
  const doiDuoc = v.mo && coTheDoiNguoi(p, v);
  /* TUYEN-1: Xử lý vi phạm — việc con chỉ của ĐỢT đang mở (dòng `viec_xu_ly` 'mo'); đợt trước / chưa có dòng → không hiện việc con cũ. */
  const con = ((loai === 'xu_ly' || laKhung(loai)) && r.trang_thai !== 'mo' ? [] : db().prepare(`SELECT t.id, t.title, t.due_date, t.progress, u.full_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_user_id
      WHERE t.cha_loai = ? AND t.cha_id = ? ORDER BY t.id`).all(loai, id) as any[]).map((t) => ({ id: t.id as number, ten: t.title as string, nguoi: t.full_name ?? null, han: t.due_date ?? null, tienDo: t.progress as string }));
  const gd = v.mo && doiDuoc ? timGhiDao(db(), LOAI_GHI_DAO, BANG[loai], id) : null;
  return {
    loai, id, tieuDe: v.tieuDe, studentId: v.studentId, mo: v.mo, branchId: v.branchId,
    phuTrach: v.phuTrach.map(nguoi), macDinh: v.macDinh.map(nguoi), duocGiao: !!v.pt,
    giaoBoi: v.pt && r.giao_boi ? nguoi(r.giao_boi) : null, giaoLuc: v.pt ? r.giao_luc ?? null : null,
    han: h.han, hanMacDinh: h.macDinh, hanChon: h.chon, coTheSuaHan: coTheSuaHan(p, v), tamDung: loai === 'bao_ph' && v.mo && !!r.tra_lai_id,
    hanTinhLai: (() => { const c = lan.filter((l) => l.truong === 'han' || l.truong === 'han_tinh_lai').at(-1); return c?.truong === 'han_tinh_lai' && c.moi === h.chon; })(),
    /* GV-3 (rà PTA): người đang phụ trách (kể cả người theo luật khi việc về mặc định) không hiện là người theo dõi việc của chính mình — dòng giữ trong bảng
       (giao đi lần nữa thì hiện lại; Hoàn tác cần dòng còn nguyên), chỉ lọc khi đọc. Tab Đang theo dõi đã bỏ việc của mình (`viecTheoDoi`). */
    theoDoi: td.filter((t) => !v.phuTrach.includes(t.user_id)).map((t) => ({ id: t.user_id, ten: t.full_name ?? null, nguon: t.nguon, vai: vaiTheoDoi(v, t) })),
    toiTheoDoi: td.some((t) => t.user_id === p.userId) && !v.phuTrach.includes(p.userId),
    coTheDoiNguoi: doiDuoc, coTheSuaTheoDoi: v.mo && coTheSuaTheoDoi(p, v), hoanTacDuoc: !!gd,
    moTa: mt ? { noiDung: mt.noi_dung, suaBoi: mt.full_name ?? null, suaLuc: mt.sua_luc } : null, coTheSuaMoTa: coTheSuaMoTa(p, v), viecCon: con,
    lichSu: lan.map((l) => ({ truong: l.truong, cu: l.cu ?? null, moi: l.moi ?? null, cuTen: l.truong === 'mo_ta' ? null : tenSo(l.cu), moiTen: l.truong === 'mo_ta' ? null : tenSo(l.moi),   /* VH-1b: mô tả "12" không phải id người */ nguoi: l.nguoi ?? null, luc: l.luc })),
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
  const moLai = db().prepare(`UPDATE meeting_phan SET trang_thai = 'mo', branch_id = ? WHERE phoi_hop_id = ? AND trang_thai = 'bo' RETURNING id`).all(branchId, phoiHopId) as { id: number }[];   // mở lại: chi nhánh hiện tại
  /* VAI-0 (N74): phần mới / mở lại chốt MỘT người nhận (lúc sinh) — ít việc mở nhất trong nhóm, không đổi khi người mới vào chi nhánh. */
  const canChot = db().prepare(`SELECT id FROM meeting_phan WHERE phoi_hop_id = ? AND trang_thai = 'mo' AND (nguoi_luat IS NULL OR id IN (SELECT value FROM json_each(?)))`)
    .all(phoiHopId, JSON.stringify(moLai.map((r) => r.id))) as { id: number }[];
  if (canChot.length) chotNguoiLuatMeeting(canChot.map((r) => r.id));
  /* N67: mở lại mà Kết quả meeting vẫn xong (giữ kết quả) → Xếp lịch họp tự xong như lúc ghi Kết quả. */
  for (const r of db().prepare(`UPDATE meeting_phan SET trang_thai = 'xong', xong_boi = NULL, xong_luc = ?2, nhap_ho_boi = NULL WHERE phoi_hop_id = ?1 AND phan = 'xep_lich' AND trang_thai = 'mo'
      AND EXISTS (SELECT 1 FROM meeting_phan k WHERE k.phoi_hop_id = ?1 AND k.phan = 'ket_qua' AND k.trang_thai = 'xong') RETURNING id`).all(phoiHopId, luc) as { id: number }[]) {
    ghiLan('meeting', r.id, 'tu_xong', null, null, null);
  }
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
  requireDoc(p, v);   // AU-2111 P0-01: TRƯỚC khi ghi (TVV của em đã đổi vai vẫn qua `coTheGhi`)
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
      /* N67 (chủ SP 24/11): Kết quả meeting xong → Xếp lịch họp chưa xong tự xong (`xong_boi` NULL = tự xong), rời Công việc / quá hạn. */
      if (v.row.phan === 'ket_qua') {
        for (const r of db().prepare(`UPDATE meeting_phan SET trang_thai = 'xong', xong_boi = NULL, xong_luc = ?, nhap_ho_boi = NULL
            WHERE phoi_hop_id = ? AND phan = 'xep_lich' AND trang_thai = 'mo' RETURNING id`).all(nowIso(), v.row.phoi_hop_id) as { id: number }[]) {
          ghiLan('meeting', r.id, 'tu_xong', null, null, p.userId);
        }
      }
    }
  });
  return xemGiaoViec(p, 'meeting', id);
}

/** Hoàn tác Hoàn thành (về chưa xong, giữ chữ đã ghi để sửa) — cùng quyền. */
export function moLaiPhanMeeting(p: Principal, id: number): KhoiGiaoViec {
  const v = docViec('meeting', id);
  requireDoc(p, v);
  if (v.row.trang_thai !== 'xong') throw conflict('Phần này chưa hoàn thành — không có gì để hoàn tác.');
  if (!coTheLamMeeting(p, v)) throw forbidden('Bạn không hoàn tác được phần này.');
  /* C-9 (N67): Kết quả meeting đã xong thì Xếp lịch họp luôn xong (tự xong) — không mở lại để khỏi hiện lại việc / quá hạn. */
  if (v.row.phan === 'xep_lich' && db().prepare(`SELECT 1 FROM meeting_phan WHERE phoi_hop_id = ? AND phan = 'ket_qua' AND trang_thai = 'xong'`).get(v.row.phoi_hop_id)) {
    throw conflict('Kết quả meeting đã xong, Xếp lịch tự xong — muốn mở lại, Hoàn tác Kết quả meeting trước.');
  }
  tx(() => {
    if (!db().prepare(`UPDATE meeting_phan SET trang_thai = 'mo', xong_boi = NULL, xong_luc = NULL, nhap_ho_boi = NULL WHERE id = ? AND trang_thai = 'xong'`).run(id).changes) {
      throw conflict('Phần này vừa được cập nhật — mở lại để xem.');
    }
    ghiLan('meeting', id, 'mo_lai', null, null, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'meeting_phan.mo_lai', entityType: 'meeting_phan', entityId: id, entityLabel: v.tieuDe, before: { trangThai: 'xong' }, after: { trangThai: 'mo' } });
    /* N67: Hoàn tác Kết quả → Xếp lịch họp đã TỰ xong theo nó về như trước; Xếp lịch người làm đã Hoàn thành / sửa (`xong_boi` có) giữ nguyên. */
    if (v.row.phan === 'ket_qua') {
      for (const r of db().prepare(`UPDATE meeting_phan SET trang_thai = 'mo', xong_luc = NULL
          WHERE phoi_hop_id = ? AND phan = 'xep_lich' AND trang_thai = 'xong' AND xong_boi IS NULL RETURNING id`).all(v.row.phoi_hop_id) as { id: number }[]) {
        ghiLan('meeting', r.id, 'tu_mo_lai', null, null, p.userId);
      }
    }
  });
  return xemGiaoViec(p, 'meeting', id);
}

/** Panel Meeting: ba phần cạnh nhau — Xếp lịch họp · Kết quả meeting (khối giao việc) + id việc Báo PH Meeting của TVV (panel Báo PH sẵn có). */
export type BoiCanhMeeting = { sos: number | null; ngay: string | null; gvcn: string | null; ghiChu: string | null;
  /** null = người xem không được thấy liên hệ PH (người theo dõi thuần). */ phuHuynh: { ten: string | null; quanHe: string | null; sdt: string | null } | null };
export function xemMeeting(p: Principal, phoiHopId: number): { phoiHopId: number; phan: KhoiGiaoViec[]; baoPhId: number | null; boiCanh: BoiCanhMeeting } {
  const ids = db().prepare(`SELECT id FROM meeting_phan WHERE phoi_hop_id = ? ORDER BY CASE phan WHEN 'xep_lich' THEN 0 ELSE 1 END`).all(phoiHopId) as any[];
  if (!ids.length) throw notFound('Meeting này chưa có phần Xếp lịch họp / Kết quả meeting.');
  const bp = db().prepare('SELECT id FROM viec_bao_ph WHERE phoi_hop_id = ?').get(phoiHopId) as { id: number } | undefined;
  /* TUYEN-2: chỉ các phần người xem ĐỌC ĐƯỢC (requireDoc từng phần, TRƯỚC khi đọc bối cảnh) — BPXL giữ Xếp lịch họp không đọc phần Kết quả meeting
     (trước: một phần 403 → cả panel 403). Phần kia hiện ở khối Tuyến (khung bước, nội dung theo quyền — C3). Không phần nào đọc được → 403 như cũ. */
  const phan: KhoiGiaoViec[] = [];
  let chan: unknown = null;
  for (const r of ids) { try { phan.push(xemGiaoViec(p, 'meeting', r.id)); } catch (e: any) { if (e?.status !== 403) throw e; chan = e; } }
  if (!phan.length) throw chan;
  /* GV-2 (mockup v22 G8a): bối cảnh đầu panel — một câu: mức SOS của lượt · ngày + GVCN xác nhận · ghi chú GVCN · PH. SĐT PH chỉ cho người LÀM được một
     phần / người đổi được việc (Head · QT · CX) / người quản lý Ý thức của em (GVCN, Head) — người theo dõi thuần không thấy. */
  const x = db().prepare(`SELECT x.performed_on, x.note, x.student_id, s.consultant_user_id AS tvv, u.full_name AS gvcn, s.parent_name, s.parent_relation, s.parent_phone,
      (SELECT MAX(c.sos_level) FROM sos_cases c WHERE c.attempt_id = x.attempt_id) AS sos
    FROM sos_coordination_actions x JOIN students s ON s.id = x.student_id LEFT JOIN users u ON u.id = x.performed_by WHERE x.id = ?`).get(phoiHopId) as any;
  /* Chủ SP 27/11 (rà #2273 P1, "Có, khi đang giữ việc"): MỘT luật với bước GVCN của Tuyến (`xemLienHePh`) — BPXL chỉ khi ĐANG GIỮ phần còn mở của em này;
     BPXL khác / theo dõi / đã giao đi / phần đã xong / GV bộ môn chỉ xem → không thấy PH, ghi chú GVCN. */
  const lienHe = xemLienHePh(p, { id: x.student_id, tvv: x.tvv ?? null, cn: phan[0].branchId },
    phan.some((g) => g.meeting?.trangThai === 'mo' && g.phuTrach.some((n) => n.id === p.userId)));
  return { phoiHopId, phan, baoPhId: bp?.id ?? null, boiCanh: {
    sos: x.sos ?? null, ngay: x.performed_on ?? null, gvcn: x.gvcn ?? null, ghiChu: lienHe ? x.note?.trim() || null : null,
    phuHuynh: lienHe ? { ten: x.parent_name ?? null, quanHe: x.parent_relation ?? null, sdt: x.parent_phone ?? null } : null,
  } };
}

// ---------------------------------------------------------------- đổi GVCN / TVV: người theo dõi mặc định của việc còn mở theo người HIỆN TẠI

/** Câu SQL: id dòng theo dõi (nguồn `nguon`) của việc còn mở của các em `em` (câu con trả student_id). */
const THEO_DOI_MO_CUA_EM = (nguon: Nguon, em: string) => `SELECT t.id FROM viec_theo_doi t WHERE t.nguon = '${nguon}' AND (
     (t.loai = 'bao_ph' AND t.ref_id IN (SELECT id FROM viec_bao_ph WHERE trang_thai = 'mo' AND student_id IN (${em})))
  OR (t.loai = 'phoi_hop' AND t.ref_id IN (SELECT id FROM sos_coordination_actions WHERE status = 'pending' AND student_id IN (${em})))
  OR (t.loai = 'tinh_hinh' AND t.ref_id IN (SELECT id FROM tinh_hinh_hoc_tap WHERE trang_thai = 'mo' AND student_id IN (${em})))
  OR (t.loai = 'tra_lai' AND t.ref_id IN (SELECT id FROM vi_pham_tra_lai WHERE trang_thai = 'mo' AND student_id IN (${em})))
  OR (t.loai = 'meeting' AND t.ref_id IN (SELECT mp.id FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id WHERE mp.trang_thai = 'mo' AND x.student_id IN (${em}))))`;
/** Câu SQL: id em của dòng theo dõi đang cập nhật (`viec_theo_doi` không bí danh). */
const SID_THEO_DOI = `(CASE viec_theo_doi.loai WHEN 'bao_ph' THEN (SELECT student_id FROM viec_bao_ph WHERE id = viec_theo_doi.ref_id)
  WHEN 'phoi_hop' THEN (SELECT student_id FROM sos_coordination_actions WHERE id = viec_theo_doi.ref_id)
  WHEN 'tinh_hinh' THEN (SELECT student_id FROM tinh_hinh_hoc_tap WHERE id = viec_theo_doi.ref_id)
  WHEN 'tra_lai' THEN (SELECT student_id FROM vi_pham_tra_lai WHERE id = viec_theo_doi.ref_id)
  ELSE (SELECT x.student_id FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id WHERE mp.id = viec_theo_doi.ref_id) END)`;
const EM_CUA_LOP_JSON = `SELECT student_id FROM enrollments WHERE class_id IN (${DS_JSON}) AND status = 'active'`;
/** Tập em (JSON) ở tham số đánh số `?1` — dùng lại ở MỌI nhánh, gắn một giá trị. */
const EM_1 = 'SELECT value FROM json_each(?1)';

/**
 * (7) TRONG tx của nơi đổi: dòng theo dõi nguồn `gvcn` của việc còn mở → GVCN HIỆN TẠI của lớp em đang học (đổi phân công, Hoàn tác phân công — tính lại sau
 * khi đảo, không nằm trong bản ghi đảo; chuyển lớp; GVCN cũ đã xoá). Lớp chưa có GVCN → giữ người cũ. GVCN mới đã theo dõi sẵn → bỏ dòng cũ. `em` = câu con student_id.
 */
export function theoGvcnHienTai(ids: readonly number[]): void {
  const ngay = demoToday();
  if (!isIsoDate(ngay) || !ids.length) return;
  /* (rà #1927 (1)) tập em là MỘT tham số JSON `?1` cho mọi nhánh của THEO_DOI_MO_CUA_EM — thêm loại việc không phải đếm lại tham số. */
  const json = JSON.stringify(ids);
  capNhatNguoiNhanTraLai(ids, null);   // TL-1: cả lần xử lý / người ghi hết vai → GVCN hiện tại
  const G = `(SELECT ta.user_id FROM enrollments e JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active'
      AND ta.effective_from <= '${ngay}' AND (ta.effective_to IS NULL OR ta.effective_to >= '${ngay}') WHERE e.student_id = ${SID_THEO_DOI} AND e.status = 'active' ORDER BY e.id DESC, ta.id LIMIT 1)`;
  const doi = db().prepare(`UPDATE OR IGNORE viec_theo_doi SET user_id = ${G} WHERE id IN (${THEO_DOI_MO_CUA_EM('gvcn', EM_1)}) AND ${G} IS NOT NULL AND ${G} != user_id`).run(json).changes;
  /* GVCN mới đã theo dõi sẵn (UPDATE OR IGNORE bỏ qua) → bỏ dòng `gvcn` của GVCN cũ. */
  const bo = db().prepare(`DELETE FROM viec_theo_doi WHERE id IN (${THEO_DOI_MO_CUA_EM('gvcn', EM_1)}) AND ${G} IS NOT NULL AND ${G} != user_id`).run(json).changes;
  /* TD-HEAD-CX (rà PTA (5)): GVCN cũ kiêm Head / CX mất dòng `gvcn` → đồng bộ lại ngay (chỉ khi có dòng đổi). */
  if (doi + bo) theoDoiVaiBaoPh({ studentIds: ids });
}
/** Đổi GVCN của lớp (`ghiPhanCong`). */
export const theoGvcnCuaLop = (classId: number) => theoGvcnCacLop([classId]);
/** Hoàn tác phân công nhiều lớp: một lượt cho mọi lớp (đọc em một câu). */
export const theoGvcnCacLop = (classIds: readonly number[]) => {
  if (classIds.length) theoGvcnHienTai((db().prepare(`${EM_CUA_LOP_JSON}`).all(JSON.stringify(classIds)) as any[]).map((r) => r.student_id as number));
};

/**
 * (7) TRONG tx của `updateStudent` (đổi / gán / bỏ TVV): dòng `tvv` của việc còn mở → TVV mới (trùng → bỏ dòng cũ; bỏ TVV → bỏ dòng); gán lần đầu → TVV theo dõi
 * hai phần Meeting đang mở của em (như lúc tạo).
 */
export function theoTvvHienTai(studentId: number): void {
  const T = `(SELECT consultant_user_id FROM students WHERE id = ${SID_THEO_DOI})`;
  const dk = `id IN (${THEO_DOI_MO_CUA_EM('tvv', EM_1)})`;   // (rà #1927 (1)) một tham số cho mọi nhánh
  const json = JSON.stringify([studentId]);
  db().prepare(`UPDATE OR IGNORE viec_theo_doi SET user_id = ${T} WHERE ${dk} AND ${T} IS NOT NULL AND ${T} != user_id`).run(json);
  db().prepare(`DELETE FROM viec_theo_doi WHERE ${dk} AND (${T} IS NULL OR ${T} != user_id)`).run(json);
  db().prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, them_boi, luc)
      SELECT 'meeting', mp.id, s.consultant_user_id, 'tvv', NULL, ? FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id JOIN students s ON s.id = x.student_id
       WHERE x.student_id = ? AND mp.trang_thai = 'mo' AND s.consultant_user_id IS NOT NULL ON CONFLICT(loai, ref_id, user_id) DO NOTHING`).run(nowIso(), studentId);
  theoDoiVaiBaoPh({ studentIds: [studentId] });   // TD-HEAD-CX: có / hết TVV → Head thôi / thành người theo luật; TVV mới trùng Head / CX → bỏ dòng
}

// ---------------------------------------------------------------- /my-work: việc giao cho tôi (+ phần Meeting theo luật) — MỘT câu

const VAI_MEETING = new Set([VAI_BPXL, 'cx', 'consultant', 'manager', 'system_admin']);
/** Phần Meeting còn là việc: hành động Meeting đã xác nhận, lượt chưa huỷ, lộ trình chưa có KQ thi thật (N46). Em thôi học: lọc `HV_DANG_HOC` ở câu ngoài. */
const MEETING_SONG = `JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id AND x.status = 'done'
       JOIN assessment_attempts a ON a.id = x.attempt_id AND a.status != 'cancelled' AND NOT ${LUOT_SAU_THI_SQL('a')}`;
/* VAI-0: cột `vai_id` của phần Meeting mang `nguoi_luat` (người chốt lúc sinh) — `luatMeeting` thay bằng người theo luật thật ngay sau câu. */
const COT_MEETING = `'meeting', mp.id, x.student_id, mp.phu_trach_id, mp.giao_boi, NULL, mp.han_chon, NULL, mp.phoi_hop_id, NULL, NULL, x.kind, NULL, (SELECT MAX(c.sos_level) FROM sos_cases c WHERE c.attempt_id = x.attempt_id), mp.branch_id, COALESCE(x.performed_on, mp.tao_luc), mp.phan, mp.nguoi_luat,
              (SELECT y.ngay_gio FROM meeting_phan y WHERE y.phoi_hop_id = mp.phoi_hop_id AND y.phan = 'xep_lich' AND y.trang_thai = 'xong'), NULL, NULL`;
/** TL-1 (N61): vi phạm / lần xử lý bị trả lại — `kind` = tên vi phạm (hoặc loại xử lý), `ten` = tên tự đặt của xử lý, `pb` = tên người trả, `tao` = lúc trả. */
/* `bl` = id người trả (cờ làm thay N64); `vai_id` = người nhận theo luật (`nguoi_nhan`, dòng "Tất cả" của Head). LEFT JOIN trong vế — không câu con theo dòng (rà #1927). */
const COT_TRA_LAI = `SELECT 'tra_lai', t.id, t.student_id, t.phu_trach_id, t.giao_boi, COALESCE(t.han_chon, t.han), t.han_chon, t.ly_do, t.violation_id, t.measure_id, t.nguoi_tra,
              COALESCE(NULLIF(tx.ten, ''), tx.description, tm.kind), tm.custom_name, NULL, tu.full_name, t.tra_luc, NULL, t.nguoi_nhan, NULL, NULL, NULL
         FROM vi_pham_tra_lai t LEFT JOIN violations tx ON tx.id = t.violation_id LEFT JOIN discipline_measures tm ON tm.id = t.measure_id LEFT JOIN users tu ON tu.id = t.nguoi_tra`;
/**
 * (B) Người giữ vai BPXL / GĐCN / CX — MỘT câu mỗi request (bộ nhớ request), chỉ khi có phần Meeting cần xét (không câu con theo từng dòng). Sắp theo lúc được gán.
 */
const nguoiGiuVai = () => nho('gv1:vai-meeting', () => {
  const m = new Map<string, { u: number; b: number | null; ten: string }[]>();
  for (const r of db().prepare(`SELECT r.key, ur.user_id AS u, ur.branch_id AS b, uu.full_name AS ten FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users uu ON uu.id = ur.user_id
      WHERE r.key IN ('${VAI_BPXL}', '${VAI_GDCN}', 'cx') AND ur.status = 'active' AND uu.status = 'active' AND uu.deleted_at IS NULL ORDER BY ur.created_at, ur.id`).all() as any[]) {
    m.set(r.key, [...(m.get(r.key) ?? []), { u: r.u, b: r.b ?? null, ten: r.ten }]);
  }
  return m;
});
/** VAI-0 (N74 / N75): vai nhận phần Meeting theo thứ tự — Xếp lịch họp: BPXL · Kết quả meeting: GĐCN → CX. */
const VAI_PHAN = (phan: string): string[] => (phan === 'xep_lich' ? [VAI_BPXL] : [VAI_GDCN, 'cx']);
export type LuatMeeting = { u: number; ten: string; vai: string };
/**
 * VAI-0 (N74): MỘT người theo luật của phần Meeting ở chi nhánh `cn` — người đã chốt lúc sinh (`nguoi_luat`) còn giữ vai (BPXL: mọi chi nhánh — N77; GĐCN / CX: đúng
 * chi nhánh hoặc toàn hệ thống) → người đó; không → người gán ĐÚNG chi nhánh sớm nhất theo thứ tự vai (grant toàn hệ thống = lead, không nhận). null = chi nhánh không ai
 * → nơi gọi lùi (Xếp lịch: TVV của em → Head; Kết quả: Head). 0 câu thêm (bộ nhớ `nguoiGiuVai`).
 */
export function luatMeeting(phan: string, cn: number | null, nguoiLuat: number | null | undefined): LuatMeeting | null {
  const m = nguoiGiuVai();
  const vai = VAI_PHAN(phan);
  /* Chưa chốt (chi nhánh chưa ai giữ vai lúc sinh) → giữ người lùi (TVV / Head), không tự nhảy sang người mới vào chi nhánh (N74). */
  if (!nguoiLuat) return null;
  for (const k of vai) {
    const x = (m.get(k) ?? []).find((y) => y.u === nguoiLuat && (k === VAI_BPXL || y.b === null || y.b === cn));
    if (x) return { u: x.u, ten: x.ten, vai: k };
  }
  /* Người đã chốt hết vai / nghỉ → người gán đúng chi nhánh sớm nhất (ổn định). */
  for (const k of vai) { const x = (m.get(k) ?? []).find((y) => y.b !== null && y.b === cn); if (x) return { u: x.u, ten: x.ten, vai: k }; }
  return null;
}
/**
 * RA-2711 (rà #2290): phần Meeting CHƯA SINH (bước ○ của Tuyến) — VAI giữ phần ở chi nhánh em theo thứ tự vai của phần (Xếp lịch: BPXL · Kết quả: GĐCN → CX) + mọi
 * người giữ vai đó (gán đúng chi nhánh). Không đoán tên: người cụ thể chọn lúc sinh theo ít việc (`chonNguoiLuat`). Không ai → null (nơi gọi lùi như cũ).
 */
const TEN_VAI_PHAN: Record<string, string> = { [VAI_BPXL]: 'BPXL', [VAI_GDCN]: 'GĐCN', cx: 'CX' };
export function vaiMeetingXemTruoc(phan: string, cn: number | null): { ids: number[]; ten: string } | null {
  if (cn == null) return null;
  const m = nguoiGiuVai();
  for (const k of VAI_PHAN(phan)) { const ds = (m.get(k) ?? []).filter((y) => y.b === cn); if (ds.length) return { ids: [...new Set(ds.map((y) => y.u))], ten: TEN_VAI_PHAN[k] ?? k }; }
  return null;
}
/** Lớp đang học của em (việc BPXL theo lớp — N77). */
const lopCuaEm = (studentId: number): number | null => (db().prepare(`SELECT e.class_id AS c FROM enrollments e WHERE e.student_id = ? AND e.status = 'active' ORDER BY e.id DESC LIMIT 1`)
  .get(studentId) as any)?.c ?? null;
/** VAI-0 (N74): chốt người nhận lúc SINH phần Meeting — Xếp lịch: CVXL của lớp em → BPXL chi nhánh ít việc nhất · Kết quả: GĐCN → CX chi nhánh ít việc nhất. */
export const chonNguoiLuat = (phan: string, cn: number | null, studentId: number): number | null =>
  phan === 'xep_lich' ? nguoiNhanTuDong(VAI_BPXL, cn, { lopId: lopCuaEm(studentId) }) : nguoiNhanTuDong(VAI_GDCN, cn) ?? nguoiNhanTuDong('cx', cn);
/** TRONG tx: chốt `nguoi_luat` cho các phần Meeting đang mở chưa có (migrate VAI-0; `ids` = chỉ các phần này). Trả số dòng ghi. */
export function chotNguoiLuatMeeting(ids?: readonly number[]): number {
  const ds = db().prepare(`SELECT mp.id, mp.phan, x.student_id AS sid, ${CHI_NHANH_EM} AS cn FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id
      JOIN students s ON s.id = x.student_id WHERE mp.trang_thai = 'mo' AND ${ids ? `mp.id IN (${DS_JSON})` : 'mp.nguoi_luat IS NULL'}`).all(...(ids ? [JSON.stringify(ids)] : [])) as any[];
  let n = 0;
  for (const r of ds) {
    const u = chonNguoiLuat(r.phan, r.cn ?? null, r.sid);
    n += db().prepare('UPDATE meeting_phan SET nguoi_luat = ? WHERE id = ? AND nguoi_luat IS NOT ?').run(u, r.id, u).changes;
  }
  return n;
}

/**
 * Việc người khác giao cho tôi (ba bảng có `phu_trach_id = tôi`, đi chỉ mục một phần) + phần Meeting (giao cho tôi; theo luật ở chi nhánh tôi có vai
 * BPXL / CX / TVV / Head / Quản trị — nhánh riêng đi chỉ mục `idx_meeting_phan_mo` theo chi nhánh, không quét). MỘT câu UNION ALL (+ một câu người giữ vai mỗi
 * request khi có phần Meeting). GV thuần: mọi nhánh lọc `phu_trach_id = ?` → 0 dòng khi không ai giao. `tatCa` (Head / QT / CX "Tất cả"): thêm phần Meeting của
 * người khác trong phạm vi, đứng tên người giữ. `studentId`: một em (dải "Việc cần làm" hồ sơ HV) — lọc ngay trong từng vế.
 * `meeting_phan.branch_id` cập nhật khi em đổi chi nhánh (`sauDoiChiNhanhEm`); người giữ / quyền theo chi nhánh hiện tại của em.
 */
/* VH-1 (PTA mục 10): `vanHanh` — thêm vế việc Vận hành còn mở giao cho tôi (chỉ mục một phần `idx_task_giao_mo`) vào CÙNG câu; không câu nào thêm. */
export function viecGiaoChoToi(p: Principal, o: { today: string; branchId?: number | null; studentId?: number; tatCa?: boolean; vanHanh?: boolean }): WorkItem[] {
  const vai = p.grants.filter((g) => VAI_MEETING.has(g.roleKey));
  const toanBo = vai.some((g) => g.branchId === null);
  const cn = [...new Set(vai.map((g) => g.branchId).filter((b): b is number => b !== null))];
  /* Tham số theo thứ tự xuất hiện (không đánh số: nhánh Meeting / một em có hay không). */
  const thamSo: unknown[] = [];
  const em = (bd: string) => (o.studentId ? ` AND ${bd}.student_id = ?` : '');
  const veToi = (sql: string, bd: string) => { thamSo.push(p.userId, ...(o.studentId ? [o.studentId] : [])); return `${sql}${em(bd)}`; };
  const ve: string[] = [
    veToi(`SELECT 'bao_ph' AS loai, v.id AS id, v.student_id AS student_id, v.phu_trach_id AS phu_trach_id, v.giao_boi AS giao_boi, v.han AS han, v.han_chon AS han_chon, v.nhan AS nhan,
              v.phoi_hop_id AS ph_id, v.tinh_hinh_id AS th_id, v.bao_lai_cua AS bl, COALESCE(m.kind, (SELECT x.kind FROM sos_coordination_actions x WHERE x.id = v.phoi_hop_id)) AS kind, m.custom_name AS ten, (SELECT COUNT(*) FROM viec_bao_ph_lan l WHERE l.viec_id = v.id) AS so_lan,
              /* TUYEN-2 (rà PTA #2273 P2-1): nguồn × đợt như /my-work theo luật (nguonBaoPh) — pb = lượt (MTn) của nguồn TVV · tao / phan = lớp NGUỒN lệnh chuyển lớp (phan khác NULL = việc Chuyển lớp). */
              (SELECT a.attempt_no FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id WHERE x.id = v.phoi_hop_id) AS pb,
              (SELECT l.lop_nguon_id FROM lenh_chuyen_lop l WHERE l.id = v.lenh_chuyen_id) AS tao,
              CASE WHEN v.lenh_chuyen_id IS NOT NULL THEN COALESCE((SELECT c.code FROM lenh_chuyen_lop l JOIN classes c ON c.id = l.lop_nguon_id WHERE l.id = v.lenh_chuyen_id), '') END AS phan,
              NULL AS vai_id, ${HOP_MEETING_SQL('v')} AS hop,
              ${SU_KIEN_TAM_DUNG_SQL('v.student_id')} AS quay_lai,   -- rà 25/11 PR 2 (N34 ③): Báo PH = sự kiện Tạm dừng / Quay lại (JSON, khoangTuSuKien); Vận hành dùng cột này cho tên HV
              v.tra_lai_id AS cho
         FROM viec_bao_ph v LEFT JOIN discipline_measures m ON m.id = COALESCE(v.measure_id, v.bao_lai_cua) WHERE v.phu_trach_id = ? AND v.trang_thai = 'mo'`, 'v'),
    /* như dòng theo luật (dongPhoiHopTheoViec · Báo PH kết quả Test) */
    veToi(`SELECT 'phoi_hop', x.id, x.student_id, x.phu_trach_id, x.giao_boi, NULL, x.han_chon, NULL, x.attempt_id, NULL, NULL, x.kind, x.custom_name, NULL, x.pb_moc, x.created_at, NULL, NULL, NULL, NULL, NULL
         FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id
        WHERE x.phu_trach_id = ? AND x.status = 'pending'
          AND x.kind != 'talk_family' AND a.status != 'cancelled' AND COALESCE(a.kind, 'mock') = 'mock' AND NOT ${LUOT_SAU_THI_SQL('a')}`, 'x'),   // BAOPH-0: nguồn TVV ở viec_bao_ph
    /* BAOPH-0 (4.6): Xử lý vi phạm · Đã thực hiện giao cho tôi (chỉ mục một phần `idx_viec_xu_ly_giao` / `idx_dm_giao`) — hạn + còn việc theo `trangThaiYThuc` ở dưới. */
    veToi(`SELECT 'xu_ly', x.id, x.student_id, x.phu_trach_id, x.giao_boi, NULL, x.han_chon, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, x.tao_luc, NULL, NULL, NULL, NULL, NULL
         FROM viec_xu_ly x WHERE x.phu_trach_id = ? AND x.trang_thai = 'mo'`, 'x'),
    veToi(`SELECT 'da_thuc_hien', m.id, m.student_id, m.phu_trach_id, m.giao_boi, NULL, m.han_chon, NULL, NULL, NULL, NULL, m.kind, m.custom_name, NULL, NULL, m.quyet_luc, NULL, NULL, NULL, NULL, NULL
         FROM discipline_measures m WHERE m.phu_trach_id = ? AND m.status = 'da_duyet'`, 'm'),
    veToi(`SELECT 'tinh_hinh', t.id, t.student_id, t.phu_trach_id, t.giao_boi, t.han, NULL, t.noi_dung, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
         FROM tinh_hinh_hoc_tap t WHERE t.phu_trach_id = ? AND t.trang_thai = 'mo' AND t.chieu = 'tvv_gvcn'`, 't'),
    /* TL-1 (N61): giao cho tôi (chỉ mục `idx_tra_lai_giao`) + người nhận theo luật là tôi, chưa giao ai (chỉ mục một phần `idx_tra_lai_nhan`) — cùng câu, 0 dòng khi không có. */
    veToi(`${COT_TRA_LAI} WHERE t.phu_trach_id = ? AND t.trang_thai = 'mo'`, 't'),
    veToi(`${COT_TRA_LAI} WHERE t.nguoi_nhan = ? AND t.phu_trach_id IS NULL AND t.trang_thai = 'mo'`, 't'),
  ];
  if (o.vanHanh) {
    /* Cột như các vế: nhan = tên việc, ph_id = việc cha, th_id = nhóm (việc con theo nhóm việc cha), kind = tiến độ, ten = tên việc cha, pb = chi nhánh,
       phan = hạng mục (VH-1b, N62; việc con theo cha), bl = lớp liên quan.
       B2-06 (AUDIT-2111): HV liên quan (`task_students` của việc / việc cha) — quay_lai = tên các em (dòng phụ; student_id giữ NULL: dòng Vận hành không là việc
       của một em ở các bộ lọc / gộp); hồ sơ HV (`studentId`):
       chỉ việc có em này. Câu con chỉ chạy trên dòng Vận hành còn mở giao cho tôi (vài dòng, chỉ mục `task_id`) — CÙNG câu, không thêm câu. */
    const hv = `FROM task_students ts WHERE ts.task_id IN (t.id, pt.id) AND ts.case_id IS NULL`;
    thamSo.push(p.userId, ...(o.studentId ? [o.studentId] : []));
    ve.push(`SELECT 'van_hanh', t.id, NULL, t.assignee_user_id, CASE WHEN t.created_by != t.assignee_user_id THEN t.created_by END, t.due_date, NULL, t.title, t.parent_task_id,
              COALESCE(pt.group_id, t.group_id), COALESCE(t.class_id, pt.class_id), t.progress, pt.title, NULL, t.branch_id, NULL, COALESCE(pt.hang_muc, t.hang_muc), NULL, NULL,
              (SELECT GROUP_CONCAT(ten, ', ') FROM (SELECT DISTINCT s.full_name AS ten FROM task_students ts JOIN students s ON s.id = ts.student_id WHERE ts.task_id IN (t.id, pt.id) AND ts.case_id IS NULL)), NULL
         FROM tasks t LEFT JOIN tasks pt ON pt.id = t.parent_task_id
        WHERE t.assignee_user_id = ? AND t.progress NOT IN ('done','stopped') AND t.kind = 'branch_ops'
          AND ${HOAT_DONG_O('t.assignee_user_id', CN_VH('t.branch_id'))}${o.studentId ? ` AND EXISTS (SELECT 1 ${hv} AND ts.student_id = ?)` : ''}`);
  }
  /* TL-1 (rà #1927): Head / Quản trị / CX "Tất cả" — việc trả lại của người khác (đứng tên người giữ), lọc phạm vi chi nhánh ở dưới. Chỉ mục một phần `idx_tra_lai_nhan` (mở). */
  const xemTatCaTraLai = !!o.tatCa && p.grants.some((g) => g.roleKey === 'manager' || g.roleKey === 'system_admin' || g.roleKey === 'cx');
  if (xemTatCaTraLai) ve.push(veToi(`${COT_TRA_LAI} WHERE t.trang_thai = 'mo' AND COALESCE(t.phu_trach_id, t.nguoi_nhan) IS NOT ?`, 't'));
  ve.push(veToi(`SELECT ${COT_MEETING} FROM meeting_phan mp ${MEETING_SONG} WHERE mp.phu_trach_id = ? AND mp.trang_thai = 'mo'`, 'x'));
  /* VAI-0 (N74 / N77): phần theo luật chốt cho tôi (`nguoi_luat`, chỉ mục `idx_meeting_phan_luat`) — kể cả chi nhánh tôi không có grant (CVXL nhận lớp chi nhánh khác). */
  ve.push(veToi(`SELECT ${COT_MEETING} FROM meeting_phan mp ${MEETING_SONG} WHERE mp.nguoi_luat = ? AND mp.phu_trach_id IS NULL AND mp.trang_thai = 'mo'`, 'x'));
  if (vai.length) {
    const loc = [`mp.trang_thai = 'mo'`, ...(toanBo ? [] : [`mp.branch_id IN (${DS_JSON})`]), o.tatCa ? '(mp.phu_trach_id IS NULL OR mp.phu_trach_id != ?)' : 'mp.phu_trach_id IS NULL'];
    if (!toanBo) thamSo.push(JSON.stringify(cn));
    if (o.tatCa) thamSo.push(p.userId);
    if (o.studentId) thamSo.push(o.studentId);
    ve.push(`SELECT ${COT_MEETING} FROM meeting_phan mp ${MEETING_SONG} WHERE ${loc.join(' AND ')}${em('x')}`);
  }
  /* LPB-0 (N73 ⑥): việc BPXL "Nhận thông tin" (việc của lớp — không ở dải một em): giao cho tôi · theo luật chốt cho tôi (còn hiệu lực) · "Tất cả" của Head / QT / CX /
     lead BPXL (lọc chi nhánh ở dưới). Chỉ mục một phần `idx_viec_nhan_tin_giao` / `idx_viec_nhan_tin_luat`; vế "Tất cả" quét việc đang mở (ít dòng). */
  if (!o.studentId) {
    const COT_NT = `SELECT 'nhan_tin', v.id, NULL, v.phu_trach_id, v.giao_boi, v.han, v.han_chon, c.code, NULL, NULL, v.class_id, v.loai, NULL,
        (SELECT COUNT(*) FROM viec_nhan_tin_dong d LEFT JOIN lenh_chuyen_lop l ON l.id = d.lenh_id LEFT JOIN students s ON s.id = l.student_id   -- RA-2711: bỏ em Lưu trữ như panel xemNhanTin
          WHERE d.viec_id = v.id AND COALESCE(d.mau, '') != 'x' AND s.archived_at IS NULL), v.branch_id, v.tao_luc, NULL, v.nguoi_luat, NULL, NULL, NULL FROM viec_nhan_tin v JOIN classes c ON c.id = v.class_id`;
    const tatCaNt = !!o.tatCa && (laLeadBpxl(p) || p.grants.some((g) => g.roleKey === 'manager' || g.roleKey === 'system_admin' || g.roleKey === 'cx'));
    ve.push(`${COT_NT} WHERE v.phu_trach_id = ? AND v.trang_thai = 'mo'`, `${COT_NT} WHERE v.nguoi_luat = ? AND v.phu_trach_id IS NULL AND v.trang_thai = 'mo'`);   // `nguoi_luat` luôn còn hiệu lực (`nhanTinHetHieuLuc`)
    thamSo.push(p.userId, p.userId);
    if (tatCaNt) { ve.push(`${COT_NT} WHERE v.trang_thai = 'mo' AND COALESCE(v.phu_trach_id, v.nguoi_luat) IS NOT ?`); thamSo.push(p.userId); }
  }
  /* TOC-DO-2511c: `docNho` — Tổng quan kèm "Của tôi" gọi hai lượt Công việc cùng câu; dòng chép vì `vai_id` gán tại chỗ. */
  const rows = docNho(
    `SELECT u.*, s.full_name, s.consultant_user_id AS tvv, e.class_id, c.code AS class_code, COALESCE(c.branch_id, s.branch_id) AS em_branch, g.full_name AS giao_ten,
            tg.ten AS nhom_ten, tg.thu_tu AS nhom_thu_tu, vc.code AS vh_lop FROM (
       ${ve.join(' UNION ALL ')}
     ) u LEFT JOIN students s ON s.id = u.student_id AND ${HV_DANG_HOC_SQL('s')}
     LEFT JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = s.id AND x.status = 'active')
     LEFT JOIN classes c ON c.id = e.class_id LEFT JOIN users g ON g.id = u.giao_boi
     LEFT JOIN task_groups tg ON u.loai = 'van_hanh' AND tg.id = u.th_id
     LEFT JOIN classes vc ON u.loai = 'van_hanh' AND vc.id = u.bl
    WHERE s.id IS NOT NULL OR u.loai IN ('van_hanh', 'nhan_tin')`, ...thamSo).map((r) => ({ ...r }));
  for (const r of rows) if (r.loai === 'meeting') r.vai_id = luatMeeting(r.phan, r.pb ?? r.em_branch ?? null, r.vai_id)?.u ?? null;   // CN của phần — như panel / Tuyến
  /* 4.6: hạn mặc định + còn việc của Xử lý vi phạm / Đã thực hiện theo luật Ý thức (một nguồn với dòng GVCN) — chỉ khi có dòng giao (thường 0, 0 câu). */
  const yt = rows.filter((r) => r.loai === 'xu_ly' || r.loai === 'da_thuc_hien');
  const emYt = yt.length ? trangThaiYThuc([...new Set(yt.map((r) => r.student_id as number))], o.today) : null;
  for (const r of yt) {
    const e = emYt!.get(r.student_id);
    r.con = r.loai === 'xu_ly' ? !!e && !e.tamDung && e.soBatBuoc > 0 && !e.coChoDuyet : true;
    r.han = r.han_chon ?? (r.loai === 'xu_ly' ? e?.han : e?.daDuyet.find((x) => x.id === r.id)?.han) ?? null;
  }
  const coVai = (key: string, b: number | null) => p.grants.some((g) => laVaiThat(g, key) && (g.branchId === null || g.branchId === b));
  const giu = giuViecQl(p);
  const items: WorkItem[] = [];
  const co = new Set<string>();
  for (const r of rows) {
    const branchId: number | null = r.loai === 'van_hanh' || r.loai === 'nhan_tin' ? r.pb ?? null : r.em_branch ?? (r.loai === 'meeting' ? r.pb ?? null : null);
    if (o.branchId && branchId !== o.branchId && !(r.loai === 'van_hanh' && branchId == null)) continue;   // VH-1: việc Toàn hệ thống giao cho tôi hiện ở mọi bộ lọc chi nhánh
    if (r.loai === 'van_hanh') { items.push(dongVanHanh(r, o.today, p.userId)); continue; }
    if (r.loai === 'nhan_tin') {
      if (!r.so_lan) continue;   // hết em / cặp (xoá học viên) — không còn gì để nhận
      const giuNt = r.phu_trach_id ?? r.vai_id ?? null;
      if (giuNt !== p.userId && !(vaiQuanLy(p, branchId) || laLeadBpxl(p))) continue;
      const it = dongViecGiao(r, o.today, giuNt, giuNt === p.userId);
      if (!co.has(it.key)) { co.add(it.key); items.push(it); }
      continue;
    }
    if (r.con === false) continue;   // 4.6: em hết bắt buộc xử lý / đã có đề xuất chờ duyệt
    let ownerId: number | null = p.userId; let mine = true;
    if (r.loai === 'meeting' && r.phu_trach_id !== p.userId) {
      /* Theo luật (N58, VAI-0 N74 một người): Xếp lịch — CVXL / BPXL chi nhánh, không có → TVV của em, không có → Head; Kết quả — GĐCN → CX chi nhánh, không có → Head. */
      mine = r.phu_trach_id == null && (r.vai_id ? r.vai_id === p.userId
        : r.phan === 'xep_lich' && r.tvv ? laTvvCuaEm(p, { consultant_user_id: r.tvv, student_id: r.student_id, em_branch: branchId ?? undefined }) : ql(branchId)[0] === p.userId);   // VAI-0: Head lùi một người   // TVV cũ (đổi chi nhánh) không giữ
      if (!mine && !o.tatCa) continue;
      ownerId = mine ? p.userId : r.phu_trach_id ?? r.vai_id ?? (r.phan === 'xep_lich' ? r.tvv : null) ?? null;
    }
    if (r.loai === 'tra_lai') {
      const giuViec = r.phu_trach_id ?? r.vai_id ?? null;
      if (giuViec !== p.userId) { if (!vaiQuanLy(p, branchId)) continue; ownerId = giuViec; mine = false; }
    }
    const it = dongViecGiao(r, o.today, ownerId, mine);
    if (co.has(it.key)) continue;
    co.add(it.key);
    items.push(it);
  }
  return items;
}

/** VH-1 (8): một dòng "Việc được giao" Vận hành — nhóm (null = Không phân loại), việc cha, người giao. `/cong-viec?viec=mgmt:<id>` mở panel cập nhật tiến độ. */
function dongVanHanh(r: any, today: string, uid: number): WorkItem {
  const nhan = TASK_PROGRESS_LABEL[r.kind as TaskProgress] ?? r.kind;
  return {
    key: `mgmt:${r.id}`, group: 'mgmt', urgency: urgencyOf(r.han, today), studentId: null, studentName: r.nhan, classId: r.bl ?? null, classCode: r.vh_lop ?? null,
    attemptId: null, attemptNo: null, caseId: null, level: null, count: null, contextLabel: r.ten ? `Việc con của: ${r.ten}` : 'Công việc quản lý',
    reason: nhan, tieuDe: r.nhan, actionLabel: 'Cập nhật', href: `/cong-viec?viec=mgmt:${r.id}`, cn: r.pb ?? null,
    ownerId: uid, owner: null, mine: true, due: r.han ?? null, statusLabel: nhan, tienDo: r.kind,
    nhomViec: r.th_id && r.nhom_ten ? { id: r.th_id, ten: r.nhom_ten, thuTu: r.nhom_thu_tu } : null, ...(r.giao_ten ? { giaoBoi: r.giao_ten } : {}),
    /* VH-1b (N62): hạng mục chính thống → web xếp dòng vào đúng mục / tab đó (`mucCuaViec`, `tabCuaViec`), mục tự hiện khi người nhận chưa có. */
    ...(r.phan ? { hangMuc: r.phan } : {}),
    /* B2-06: tên HV liên quan — dòng phụ của dòng Vận hành (`DanhSachViec`). */
    ...(r.quay_lai ? { hocVienLienQuan: String(r.quay_lai) } : {}),
  };
}

const urgencyOf = (han: string | null, today: string) => (!han ? 'normal' : han < today ? 'overdue' : han === today ? 'today' : 'normal') as WorkItem['urgency'];

/** Một dòng /my-work — khoá + nhóm + chữ như dòng theo luật cùng loại (bỏ trùng theo khoá). Dùng chung: việc giao cho tôi · "Tất cả" (việc giao cho người khác). */
export function dongViecGiao(r: any, today: string, ownerId: number | null, mine: boolean): WorkItem {
  const chung = {
    studentId: r.student_id as number, studentName: r.full_name as string, classId: r.class_id ?? null, classCode: r.class_code ?? null,
    attemptId: null, attemptNo: null, caseId: null, level: null, count: null, ownerId, owner: null, mine,
    ...(r.giao_boi && r.phu_trach_id ? { giaoBoi: r.giao_ten ?? null } : {}),
  };
  if (r.loai === 'nhan_tin') {
    /* LPB-0 (N73 ⑥): nhóm "Nhận thông tin" của BPXL — `nhan` = mã lớp, `bl` = id lớp, `kind` = loại, `so_lan` = số em / cặp, `pb` = chi nhánh lớp. */
    const ten = r.kind === 'doi_gv' ? 'Đổi GV' : 'Chuyển lớp';
    const han = r.han_chon ?? r.han;
    return { ...chung, studentId: null, studentName: `${ten} · ${r.nhan}`, classId: r.bl, classCode: r.nhan, cn: r.pb ?? null, key: `nhan_tin:${r.id}`, group: 'nhan_tin',
      urgency: urgencyOf(han, today), count: r.so_lan, contextLabel: `${ten} · ${r.so_lan} ${r.kind === 'doi_gv' ? 'cặp GV' : 'em'}`,
      reason: 'Xem thông tin để xếp lịch rồi bấm Xác nhận đã nhận', tieuDe: `Nhận thông tin · ${ten} · ${r.nhan}`, phu: ten, actionLabel: 'Xác nhận',
      href: `/cong-viec?viec=nhan_tin:${r.id}`, due: han, statusLabel: 'Chưa xác nhận', viecId: r.id };
  }
  if (r.loai === 'bao_ph') {
    const han = hanBaoPhHieuLuc(r.han, khoangTuSuKien(r.quay_lai), r.han_chon);
    const nhan = r.ph_id || r.th_id ? r.nhan : r.kind ? `${nhanLoaiXuLy(r.kind, r.ten ?? null)}${r.bl ? ' đã thu hồi' : ''}` : r.nhan;
    const meeting = r.ph_id != null && !laViecTvvBaoPh(r.kind ?? '');   // BAOPH-0: Trao đổi gia đình / kết quả Test là Báo PH thường
    const g = meeting ? null : nguonBaoPh({ phKind: r.ph_id != null ? r.kind : null, phLuot: r.pb ?? null, nhan: r.nhan, lenh: r.phan != null, lopNguon: r.tao ? { id: r.tao, code: r.phan } : null });
    return {
      ...chung, ...(g ? { gopNguon: g.gopNguon, ...(g.lop ? { classId: g.lop.id, classCode: g.lop.code } : {}) } : {}),
      key: `bao-ph:${r.id}`, group: meeting ? 'phoi_hop_tvv' : 'bao_ph_yt', urgency: r.cho ? 'normal' : urgencyOf(han, today),   /* `quaHanBaoPh`: đang chờ GV sửa không quá hạn */ contextLabel: meeting ? chuHop(r.hop) : g?.nguon ?? nhan,
      reason: meeting ? `GVCN đã xác nhận ${nhan} — báo gia đình và ghi kết quả` : 'Báo phụ huynh và ghi kết quả',
      tieuDe: meeting ? `Báo PH · Meeting CX/GĐCN · ${r.full_name}` : `Báo PH · ${nhan} · ${r.full_name}`, phu: meeting ? chuHop(r.hop) : `Báo PH · ${nhan}`,   // A3-09: "họp {ngày giờ}" như dòng CX
      actionLabel: meeting ? 'Ghi KQ' : 'Ghi báo PH', href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc', ...(meeting ? { sub: 'phoi-hop' } : {}) }),
      due: han, statusLabel: r.cho ? CHO_GV_SUA : r.so_lan ? 'Chưa liên hệ được' : 'Chưa báo', viecId: r.id, soLanThu: r.so_lan, ...(r.cho ? { choGvSua: true } : {}),
    };
  }
  if (r.loai === 'tra_lai') {
    /* TL-1 (N61): `kind` = tên vi phạm (một vi phạm) / loại xử lý (cả lần), `pb` = người trả. Quá hạn chỉ đỏ — máy không làm gì thêm. */
    const caLan = r.th_id != null;
    const ten = caLan ? (r.kind ? nhanLoaiXuLy(r.kind, r.ten ?? null) : 'Lần xử lý') : r.kind ?? 'Vi phạm';
    return { ...chung, key: `yt_tra_lai:${r.id}`, group: 'yt_tra_lai', urgency: urgencyOf(r.han, today), contextLabel: ten,
      reason: `${r.pb ?? 'TVV'} trả lại: ${r.nhan}`, tieuDe: `${caLan ? 'Lần xử lý' : 'Vi phạm'} bị trả lại · ${r.full_name}`, phu: ten,
      actionLabel: 'Xử lý', href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }), due: r.han, statusLabel: 'Chờ GV sửa', viecId: r.id,
      nguoiTra: r.pb ?? null, nguoiTraId: r.bl ?? null };   // TL-2 (mockup v22 T4a): thẻ "{tên} trả" trên dòng
  }
  if (r.loai === 'phoi_hop') {
    const han = hanPhoiHop(r.kind, r.tao, r.han_chon, r.pb ?? null);
    const tenV = r.kind === 'other' && r.ten ? r.ten : tenViec(r.kind, r.pb ?? null);
    const khoa = r.kind === 'other' ? `other:${encodeURIComponent(r.ten ?? '')}` : r.kind;
    return { ...chung, key: `phoi_hop_viec:${r.id}`, group: 'phoi_hop_sos', urgency: urgencyOf(han, today), attemptId: r.ph_id, contextLabel: null,
      reason: `${tenV} · ${r.full_name}`, tieuDe: `${tenV} · ${r.full_name}`, actionLabel: 'Xác nhận',
      href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }), due: han, statusLabel: 'Chưa làm', viecId: r.id,
      phoiHop: { kind: r.kind, khoa }, emIds: [r.student_id], emTen: [r.full_name] };
  }
  if (r.loai === 'xu_ly' || r.loai === 'da_thuc_hien') {
    /* 4.6: cùng khoá / nhóm với dòng GVCN theo luật (mywork 5b) — bỏ trùng theo khoá. */
    const xl = r.loai === 'xu_ly', nhan = xl ? null : nhanLoaiXuLy(r.kind, r.ten ?? null);
    return { ...chung, key: xl ? `yt_xu_ly:${r.student_id}` : `yt_thuc_hien:${r.id}`, group: xl ? 'yt_xu_ly' : 'yt_thuc_hien', urgency: urgencyOf(r.han, today), contextLabel: 'Ý thức',
      reason: xl ? 'Vi phạm bắt buộc xử lý' : `Head đã duyệt ${nhan}`, tieuDe: xl ? `Xử lý vi phạm · ${r.full_name}` : `Ghi "Đã thực hiện" ${nhan} · ${r.full_name}`, phu: nhan,
      actionLabel: xl ? 'Xác nhận xử lý' : 'Đã thực hiện',
      href: r.class_id ? `/hoc-vien/lop/${r.class_id}?tab=y-thuc&hv=${r.student_id}${xl ? '&mo=xu-ly' : `&mo=da-thuc-hien&xl=${r.id}`}` : duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }),
      due: r.han, statusLabel: xl ? 'Bắt buộc xử lý' : 'Đã duyệt · chờ thực hiện', viecId: r.id };
  }
  if (r.loai === 'tinh_hinh') {
    return { ...chung, key: `yt_hoi_tinh_hinh:${r.id}`, group: 'yt_hoi_tinh_hinh', urgency: urgencyOf(r.han, today), contextLabel: 'Tình hình học tập',
      reason: r.nhan, tieuDe: `Tình hình học tập · ${r.full_name}`, phu: 'Tình hình học tập', actionLabel: 'Ghi kết quả',
      href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }), due: r.han, statusLabel: 'Chờ trả lời', viecId: r.id };
  }
  const xep = r.phan === 'xep_lich';
  const han = r.han_chon ?? hanPhanMeeting(r.phan, ngayMeeting(r.tao, null));   // chủ SP 22/11: mặc định 5 / 14 ngày
  const hop = r.hop ? ` · ${chuHop(r.hop)}` : '';
  /* GV-2 (mockup v22 G8a / G8e): chip SOS của lượt (sos_cases, cột `so_lan` của vế Meeting) — BPXL / CX biết mức em. */
  const sos = r.so_lan == null ? null : Number(r.so_lan);
  return { ...chung, key: `${xep ? 'meeting_xep_lich' : 'meeting_ket_qua'}:${r.id}`, group: xep ? 'meeting_xep_lich' : 'meeting_ket_qua', urgency: urgencyOf(han, today),
    attemptId: null, contextLabel: tenViec(r.kind), level: sos ? { tone: sos >= 3 ? 'danger' : sos === 2 ? 'warn' : 'info', text: `SOS ${sos}` } : null, reason: xep ? 'Xếp lịch họp rồi bấm Hoàn thành (ngày giờ họp tuỳ chọn)' : `Ghi kết quả buổi họp rồi bấm Hoàn thành${hop}`,
    tieuDe: `${xep ? 'Xếp lịch họp CX/GĐCN' : 'Kết quả meeting CX/GĐCN'} · ${r.full_name}`, phu: xep ? null : hop.slice(3) || null, actionLabel: xep ? 'Hoàn thành' : 'Ghi KQ',
    href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc', sub: 'phoi-hop' }), due: han, statusLabel: 'Chưa xong', viecId: r.id, phoiHopId: r.ph_id };
}

/**
 * B2-13 (TURSO-5, AUDIT-2111): dọn dòng theo dõi của việc ĐÃ ĐÓNG quá `NGAY_GIU_THEO_DOI` ngày — tab "Đang theo dõi" đọc mọi dòng theo dõi của người xem
 * (`idx_viec_theo_doi_nguoi`) rồi mới bỏ việc đóng > 7 ngày, nên không dọn thì dòng duyệt tăng mãi. "Đóng lúc" = cùng cột `viecTheoDoi` dùng; việc còn mở /
 * không rõ lúc đóng (NULL) giữ nguyên. Một câu đọc mỗi ngày (+1 câu xoá khi có dòng) — lượt quét ngày `quetLopTrong`.
 * ponytail: việc mở lại sau > 30 ngày mất người theo dõi thêm tay (theo dõi theo luật Head / CX tự thêm lại khi đồng bộ) — thêm cột "đóng lúc" chung nếu cần giữ.
 */
/**
 * LPB-1 (N73 ⑤): việc khung tính khi đọc — việc HẾT (đã chốt ngày thi, chọn bước tiếp, đủ hồ sơ, xác nhận bàn giao, chốt lộ trình…) thì dòng bảng phụ còn 'mo'
 * → đóng `xong` (người theo dõi nhận tin "Xong", việc mở lại sau đó là đợt mới — `damBaoDong`). Lượt quét ngày (`quetLopTrong`); docViec mỗi dòng đang mở
 * (bảng phụ chỉ có dòng khi có người giao / hạn / theo dõi — vài dòng). Bàn giao đổi GV có vòng đời riêng (`ban_giao_gv.trang_thai`).
 * ponytail: việc hết rồi mở lại TRONG NGÀY (trước lượt quét) giữ người giao cũ — quét theo sự kiện ở từng đường ghi nếu cần chặt hơn.
 */
export function dongKhungHetViec(): number {
  const ds = db().prepare(LOAI_KHUNG.filter((l) => l !== 'ban_giao_gv').map((l) => `SELECT '${l}' AS loai, id AS id FROM ${BANG_KHUNG[l]} WHERE trang_thai = 'mo'`).join(' UNION ALL '))
    .all() as { loai: LoaiKhung; id: number }[];
  let n = 0;
  const lo = new Map<string, Viec>();
  const loi = new Set<string>();
  for (const l of LOAI_KHUNG) {
    const ids = ds.filter((r) => r.loai === l).map((r) => r.id);
    /* Rà #2280: một loại lỗi không chặn loại khác (dòng của loại lỗi giữ nguyên, lượt sau thử lại). */
    try { if (ids.length) for (const [id, v] of docViecLo(l, ids)) lo.set(`${l}:${id}`, v); } catch (e) { loi.add(l); console.error('[khung] đọc', l, e); }
  }
  for (const r of ds) {
    if (loi.has(r.loai)) continue;
    const v = lo.get(`${r.loai}:${r.id}`) ?? null;   // không có = đơn vị việc đã xoá
    if (v?.mo) continue;
    try {
      tx(() => {
        if (!db().prepare(`UPDATE ${BANG_KHUNG[r.loai]} SET trang_thai = 'xong', xong_luc = ? WHERE id = ? AND trang_thai = 'mo'`).run(mocNghiepVu(), r.id).changes) return;
        n++;
        if (v) baoTheoDoi(r.loai, r.id, 0, { suKien: 'xong', tieuDe: v.tieuDe, khoa: nowIso().slice(0, 10), studentId: v.studentId });
      });
    } catch (e) { console.error('[khung] đóng', r.loai, r.id, e); }
  }
  return n;
}

const NGAY_GIU_THEO_DOI = 30;
export function donTheoDoiCu(homNay: string): number {
  const moc = addDays(homNay, -NGAY_GIU_THEO_DOI);
  /* Đọc id trước, chỉ ghi khi có dòng cần dọn — câu ghi (cả DELETE 0 dòng) làm request đó bỏ nhớ bảng tham chiếu (`coGhiTrongRequest`, +3 câu). */
  const ids = (db().prepare(`SELECT t.id FROM viec_theo_doi t
      LEFT JOIN viec_bao_ph b ON t.loai = 'bao_ph' AND b.id = t.ref_id
      LEFT JOIN sos_coordination_actions x ON t.loai = 'phoi_hop' AND x.id = t.ref_id
      LEFT JOIN tinh_hinh_hoc_tap th ON t.loai = 'tinh_hinh' AND th.id = t.ref_id
      LEFT JOIN meeting_phan mp ON t.loai = 'meeting' AND mp.id = t.ref_id
      LEFT JOIN vi_pham_tra_lai tl ON t.loai = 'tra_lai' AND tl.id = t.ref_id
      LEFT JOIN tasks vh ON t.loai = 'van_hanh' AND vh.id = t.ref_id
      LEFT JOIN viec_nhan_tin nt ON t.loai = 'nhan_tin' AND nt.id = t.ref_id
     WHERE (b.trang_thai != 'mo' AND COALESCE(b.bo_luc, (SELECT MAX(l.ghi_luc) FROM viec_bao_ph_lan l WHERE l.viec_id = b.id)) < ?1)
        OR (nt.trang_thai != 'mo' AND COALESCE(nt.xong_luc, nt.bo_luc) < ?1)
        OR (x.status != 'pending' AND x.updated_at < ?1)
        OR (th.trang_thai != 'mo' AND COALESCE(th.tra_loi_luc, th.rut_luc) < ?1)
        OR (mp.trang_thai != 'mo' AND mp.xong_luc < ?1)
        OR (tl.trang_thai != 'mo' AND tl.xong_luc < ?1)
        OR (vh.progress IN ('done', 'stopped') AND vh.updated_at < ?1)
        ${LOAI_KHUNG.map((l) => `OR (t.loai = '${l}' AND EXISTS (SELECT 1 FROM ${BANG_KHUNG[l]} k_ WHERE k_.id = t.ref_id AND k_.trang_thai != 'mo' AND k_.xong_luc < ?1))`).join(' ')}`)
    .all(moc) as { id: number }[]).map((r) => r.id);   // LPB-1: việc khung đã xong / bỏ (`xong_luc`)
  return ids.length ? db().prepare(`DELETE FROM viec_theo_doi WHERE id IN (SELECT value FROM json_each(?1))`).run(JSON.stringify(ids)).changes : 0;
}

// ---------------------------------------------------------------- GET /my-work/theo-doi

export type DongTheoDoi = { loai: LoaiTheoDoi; refId: number; tieuDe: string; studentId: number | null; studentName: string | null; classCode: string | null;
  phuTrach: string | null; han: string | null; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string; xongLuc: string | null };

/**
 * Tab "Đang theo dõi" (chỉ gọi khi mở tab, không vào /my-work, không số đếm): việc tôi theo dõi còn mở + xong trong 7 ngày (lọc TRONG câu), chia theo loại,
 * quá hạn trước. MỘT câu (chỉ mục `idx_viec_theo_doi_nguoi`), tên người phụ trách đọc cùng câu. Việc mà tôi đang là người phụ trách (giao cho tôi, hoặc theo luật)
 * không vào tab này (đã ở "Của tôi").
 * ponytail: chỉ mục theo người đọc mọi dòng theo dõi của tôi rồi bỏ việc đã đóng > 7 ngày trong câu — dòng đọc tăng theo số việc từng theo dõi; dọn định kỳ
 * dòng theo dõi của việc đóng lâu nếu đo bản chính thấy nặng.
 */
export function viecTheoDoi(p: Principal): { nhom: { loai: LoaiTheoDoi; ten: string; mo: DongTheoDoi[]; vuaXong: DongTheoDoi[] }[] } {
  const today = demoToday();
  const tu = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const rows = db().prepare(
    `SELECT t.loai, t.ref_id,
            COALESCE(b.student_id, x.student_id, th.student_id, mx.student_id, tl.student_id) AS sid,
            bx.kind AS b_ph_kind, b.trang_thai AS b_tt, b.han AS b_han, b.han_chon AS b_hc, b.nhan AS b_nhan, b.bo_luc AS b_bo, b.phoi_hop_id AS b_ph, b.tra_lai_id AS b_cho,
            CASE WHEN b.trang_thai = 'mo' AND b.han_chon IS NULL THEN ${SU_KIEN_TAM_DUNG_SQL('b.student_id')} END AS b_dung,   -- R1-L2: hạn như panel (Tạm dừng → Quay lại)
            tl.trang_thai AS tl_tt, COALESCE(tl.han_chon, tl.han) AS tl_han, tl.xong_luc AS tl_luc, tl.measure_id AS tl_xl, tl.nguoi_nhan AS tl_nhan, nn.full_name AS tl_nhan_ten,
            (SELECT MAX(l.ghi_luc) FROM viec_bao_ph_lan l WHERE l.viec_id = b.id) AS b_xong,
            x.status AS x_tt, x.kind AS x_kind, x.custom_name AS x_ten, x.created_at AS x_tao, x.han_chon AS x_hc, x.pb_moc AS x_pb, x.updated_at AS x_luc,
            th.trang_thai AS th_tt, th.han AS th_han, COALESCE(th.tra_loi_luc, th.rut_luc) AS th_luc,
            mp.trang_thai AS mp_tt, mp.phan AS mp_phan, mp.nguoi_luat AS mp_nl, mp.branch_id AS mp_cn, mp.han_chon AS mp_hc, mp.xong_luc AS mp_luc, COALESCE(mx.performed_on, mp.tao_luc) AS mp_ngay,
            vh.title AS vh_ten, vh.progress AS vh_tt, vh.due_date AS vh_han, vh.updated_at AS vh_luc,
            nt.trang_thai AS nt_tt, COALESCE(nt.han_chon, nt.han) AS nt_han, COALESCE(nt.xong_luc, nt.bo_luc) AS nt_luc, nt.loai AS nt_loai, nt.nguoi_luat AS nt_nl,
            CASE WHEN nt.id IS NOT NULL THEN (SELECT nc.code FROM classes nc WHERE nc.id = nt.class_id) END AS nt_lop,
            CASE WHEN nt.id IS NOT NULL THEN (SELECT nlu.full_name FROM users nlu WHERE nlu.id = nt.nguoi_luat) END AS nt_nl_ten,
            COALESCE(b.phu_trach_id, x.phu_trach_id, th.phu_trach_id, mp.phu_trach_id, tl.phu_trach_id, vh.assignee_user_id, nt.phu_trach_id) AS pt, pu.full_name AS pt_ten,
            s.id AS student_id, s.full_name, s.consultant_user_id AS tvv, tv.full_name AS tvv_ten, c.code AS class_code, COALESCE(c.branch_id, s.branch_id) AS em_branch, g.user_id AS gvcn_id, gu.full_name AS gvcn_ten
       FROM viec_theo_doi t
       LEFT JOIN viec_bao_ph b ON t.loai = 'bao_ph' AND b.id = t.ref_id
       LEFT JOIN sos_coordination_actions bx ON bx.id = b.phoi_hop_id
       LEFT JOIN sos_coordination_actions x ON t.loai = 'phoi_hop' AND x.id = t.ref_id
       LEFT JOIN tinh_hinh_hoc_tap th ON t.loai = 'tinh_hinh' AND th.id = t.ref_id
       LEFT JOIN meeting_phan mp ON t.loai = 'meeting' AND mp.id = t.ref_id
       LEFT JOIN sos_coordination_actions mx ON mx.id = mp.phoi_hop_id
       LEFT JOIN vi_pham_tra_lai tl ON t.loai = 'tra_lai' AND tl.id = t.ref_id
       LEFT JOIN users nn ON nn.id = tl.nguoi_nhan
       LEFT JOIN tasks vh ON t.loai = 'van_hanh' AND vh.id = t.ref_id AND vh.kind = 'branch_ops'   -- Giao GV theo lớp (teacher_task) không phải việc Vận hành
       LEFT JOIN viec_nhan_tin nt ON t.loai = 'nhan_tin' AND nt.id = t.ref_id   -- LPB-0: việc của lớp (lớp / người theo luật đọc bằng câu con chỉ cho dòng này)
       LEFT JOIN students s ON s.id = COALESCE(b.student_id, x.student_id, th.student_id, mx.student_id, tl.student_id)
       LEFT JOIN users tv ON tv.id = s.consultant_user_id
       LEFT JOIN users pu ON pu.id = COALESCE(b.phu_trach_id, x.phu_trach_id, th.phu_trach_id, mp.phu_trach_id, tl.phu_trach_id, vh.assignee_user_id, nt.phu_trach_id)
       LEFT JOIN enrollments e ON e.id = (SELECT MAX(z.id) FROM enrollments z WHERE z.student_id = s.id AND z.status = 'active')
       LEFT JOIN classes c ON c.id = e.class_id
       LEFT JOIN teacher_assignments g ON g.id = (SELECT ta.id FROM teacher_assignments ta WHERE ta.class_id = e.class_id AND ta.is_core = 1 AND ta.status = 'active'
               AND ta.effective_from <= ?2 AND (ta.effective_to IS NULL OR ta.effective_to >= ?2) ORDER BY ta.id LIMIT 1)
       LEFT JOIN users gu ON gu.id = g.user_id
      WHERE t.user_id = ?1 AND (s.id IS NOT NULL OR vh.id IS NOT NULL OR nt.id IS NOT NULL OR t.loai IN (${LOAI_KHUNG.map((l) => `'${l}'`).join(', ')}))
        /* TD-HEAD-CX (rà PTA (4)): điều kiện CHỈ trên t → SQLite xét ở vòng ngoài cùng — Báo PH đã đóng quá 7 ngày bị bỏ trước ~10 phép nối / tra. */
        AND (t.loai != 'bao_ph' OR EXISTS (SELECT 1 FROM viec_bao_ph b_ WHERE b_.id = t.ref_id
          AND (b_.trang_thai = 'mo' OR COALESCE(b_.bo_luc, (SELECT MAX(l.ghi_luc) FROM viec_bao_ph_lan l WHERE l.viec_id = b_.id)) >= ?3)))
        AND (CASE WHEN t.loai IN (${LOAI_KHUNG.map((l) => `'${l}'`).join(', ')}) THEN 1   -- LPB-1: việc khung — phạm vi + trạng thái đọc ở docViec (dưới)
          WHEN t.loai = 'nhan_tin' THEN ${HL_NHAN_TIN('t.user_id', 'nt.branch_id')}
          ELSE ${HOAT_DONG_O('t.user_id', `CASE WHEN t.loai = 'van_hanh' THEN ${CN_VH('vh.branch_id')} ELSE COALESCE(c.branch_id, s.branch_id) END`)} END) AND (   -- (F) người đã rời chi nhánh của việc không thấy
           (t.loai = 'nhan_tin' AND (nt.trang_thai = 'mo' OR COALESCE(nt.xong_luc, nt.bo_luc) >= ?3)) OR
           t.loai IN (${LOAI_KHUNG.map((l) => `'${l}'`).join(', ')}) OR

           (t.loai = 'bao_ph' AND (b.trang_thai = 'mo' OR COALESCE(b.bo_luc, (SELECT MAX(l.ghi_luc) FROM viec_bao_ph_lan l WHERE l.viec_id = b.id)) >= ?3))
        OR (t.loai = 'phoi_hop' AND (x.status = 'pending' OR x.updated_at >= ?3))
        OR (t.loai = 'tinh_hinh' AND (th.trang_thai = 'mo' OR COALESCE(th.tra_loi_luc, th.rut_luc) >= ?3))
        OR (t.loai = 'meeting' AND (mp.trang_thai = 'mo' OR mp.xong_luc >= ?3))
        OR (t.loai = 'tra_lai' AND (tl.trang_thai = 'mo' OR tl.xong_luc >= ?3))
        OR (t.loai = 'van_hanh' AND (vh.progress NOT IN ('done','stopped') OR vh.updated_at >= ?3)))`,
  ).all(p.userId, today, tu) as any[];
  const giu = giuViecQl(p);
  const coVai = (key: string, b: number | null) => p.grants.some((g) => laVaiThat(g, key) && (g.branchId === null || g.branchId === b));
  /* Rà PTA #2280 (tốc độ): việc khung đọc theo LOẠI một lượt (`docViecLo`). */
  const khung = new Map<string, Viec>();
  for (const l of LOAI_KHUNG) {
    const ids = rows.filter((r) => r.loai === l).map((r) => r.ref_id as number);
    if (ids.length) for (const [id, v] of docViecLo(l, ids)) khung.set(`${l}:${id}`, v);
  }
  const theoLoai = new Map<LoaiTheoDoi, { mo: DongTheoDoi[]; vuaXong: DongTheoDoi[] }>();
  const theoVai: [DongTheoDoi, number[]][] = [];
  for (const r of rows) {
    if (r.loai === 'meeting') { const l = luatMeeting(r.mp_phan, r.mp_cn ?? r.em_branch ?? null, r.mp_nl); r.mp_vai = l?.u ?? null; r.mp_vai_key = l?.vai ?? null; }
    const loai = r.loai as LoaiTheoDoi;
    if (laKhung(loai)) {
      /* LPB-1 (N73 ⑤): việc khung — CÙNG `docViec` với panel (người mặc định, còn việc, hạn). Vài câu mỗi dòng (người theo dõi việc khung thường ít). */
      const v = khung.get(`${loai}:${r.ref_id}`);
      if (!v) continue;
      if (!p.grants.some((g) => g.branchId === null || g.branchId === v.branchId)) continue;   // (F) người đã rời chi nhánh của việc không thấy
      if (v.phuTrach.includes(p.userId)) continue;   // (11) việc của tôi nằm ở "Của tôi"
      const tt: 'mo' | 'xong' | 'bo' = v.mo ? 'mo' : v.row.trang_thai === 'bo' || v.row.trang_thai === 'huy' ? 'bo' : 'xong';
      const luc: string | null = tt === 'mo' ? null : v.row.xong_luc ?? nowIso();
      if (tt !== 'mo' && luc! < tu) continue;
      const han = hanCua(v).han;
      const d: DongTheoDoi = { loai, refId: r.ref_id, tieuDe: v.tieuDe, studentId: v.studentId, studentName: v.studentId ? v.tenEm : null, classCode: v.studentId ? null : v.tenEm,
        phuTrach: null, han, quaHan: tt === 'mo' && !!han && han < today, trangThai: tt, nhanTrangThai: tt === 'mo' ? 'Chưa xong' : tt === 'bo' ? 'Đã bỏ' : 'Xong', xongLuc: luc };
      if (v.phuTrach.length) theoVai.push([d, v.phuTrach]);
      const g = theoLoai.get(loai) ?? theoLoai.set(loai, { mo: [], vuaXong: [] }).get(loai)!;
      (tt === 'mo' ? g.mo : g.vuaXong).push(d);
      continue;
    }
    let ptIds: number[] | null = null;   // GV-2 ([XM 4]): người theo luật theo VAI → tên người (đầu + "+n"); chỉ ghi vai khi chi nhánh chưa có ai
    let tt: 'mo' | 'xong' | 'bo'; let han: string | null; let luc: string | null; let tieuDe: string; let nhan: string; let ptLuat: string | null; let luatLaToi: boolean;
    if (loai === 'nhan_tin') {
      /* LPB-0: việc của lớp — người theo luật chốt lúc sinh (một người). */
      tt = r.nt_tt; han = r.nt_han; luc = r.nt_luc; r.class_code = r.nt_lop; r.full_name = null;
      tieuDe = `Nhận thông tin · ${r.nt_loai === 'doi_gv' ? 'Đổi GV' : 'Chuyển lớp'} · ${r.nt_lop}`; nhan = tt === 'xong' ? 'Đã xác nhận' : tt === 'bo' ? 'Đã đóng' : 'Chưa xác nhận';
      ptLuat = r.nt_nl_ten ?? 'BPXL chi nhánh'; luatLaToi = r.nt_nl === p.userId;
    } else if (loai === 'bao_ph') {
      tt = r.b_tt; han = tt === 'mo' ? hanBaoPhHieuLuc(r.b_han, khoangTuSuKien(r.b_dung), r.b_hc) : r.b_hc ?? r.b_han; luc = tt === 'bo' ? r.b_bo : r.b_xong;
      tieuDe = r.b_ph && laMeetingCx(r.b_ph_kind ?? '') ? `Báo PH · Meeting CX/GĐCN · ${r.full_name}` : `Báo PH · ${r.b_nhan} · ${r.full_name}`;
      /* BAOPH-0 (N72 ⑤): em chưa có TVV → Head ở mọi nguồn (Meeting thôi về GVCN). */
      nhan = tt === 'xong' ? 'Đã báo PH' : tt === 'bo' ? 'Đã bỏ' : r.b_cho ? CHO_GV_SUA : 'Chưa báo'; ptLuat = r.tvv_ten ?? 'Head chi nhánh';
      luatLaToi = r.tvv ? laTvvCuaEm(p, { consultant_user_id: r.tvv, student_id: r.student_id, em_branch: r.em_branch ?? undefined }) : giu(r.em_branch);
    } else if (loai === 'phoi_hop') {
      tt = r.x_tt === 'pending' ? 'mo' : r.x_tt === 'done' ? 'xong' : 'bo'; han = hanPhoiHop(r.x_kind, r.x_tao, r.x_hc, r.x_pb ?? null); luc = r.x_luc;
      tieuDe = `${r.x_kind === 'other' && r.x_ten ? r.x_ten : tenViec(r.x_kind, r.x_pb ?? null)} · ${r.full_name}`;
      nhan = tt === 'xong' ? 'Xong' : tt === 'bo' ? 'Đã bỏ' : 'Chưa làm'; ptLuat = r.gvcn_ten ?? 'Head chi nhánh';
      luatLaToi = r.gvcn_id ? r.gvcn_id === p.userId : giu(r.em_branch);
    } else if (loai === 'tinh_hinh') {
      tt = r.th_tt === 'mo' ? 'mo' : r.th_tt === 'xong' ? 'xong' : 'bo'; han = r.th_han; luc = r.th_luc;
      tieuDe = `Tình hình học tập · ${r.full_name}`; nhan = tt === 'xong' ? 'Đã trả lời' : tt === 'bo' ? 'Đã rút' : 'Chờ trả lời'; ptLuat = r.gvcn_ten ?? 'Head chi nhánh';
      luatLaToi = r.gvcn_id ? r.gvcn_id === p.userId : giu(r.em_branch);
    } else if (loai === 'van_hanh') {
      tt = r.vh_tt === 'done' ? 'xong' : r.vh_tt === 'stopped' ? 'bo' : 'mo'; han = r.vh_han ?? null; luc = r.vh_luc ?? null;
      tieuDe = r.vh_ten; nhan = TASK_PROGRESS_LABEL[r.vh_tt as TaskProgress] ?? r.vh_tt; ptLuat = 'Chưa giao'; luatLaToi = false;
    } else if (loai === 'tra_lai') {
      /* `nguoi_nhan` giữ đúng người theo luật (`capNhatNguoiNhanTraLai` ở mọi chỗ người giữ đổi). */
      tt = r.tl_tt === 'mo' ? 'mo' : r.tl_tt === 'xong' ? 'xong' : 'bo'; han = r.tl_han; luc = r.tl_luc;
      tieuDe = `${r.tl_xl ? 'Lần xử lý' : 'Vi phạm'} bị trả lại · ${r.full_name}`; nhan = tt === 'xong' ? 'GV đã xử lý' : tt === 'bo' ? 'Đã rút' : CHO_GV_SUA;
      ptLuat = r.tl_nhan_ten ?? r.gvcn_ten ?? 'Head chi nhánh'; luatLaToi = r.tl_nhan === p.userId;
    } else {
      tt = r.mp_tt; han = r.mp_hc ?? (r.mp_phan ? hanPhanMeeting(r.mp_phan, ngayMeeting(r.mp_ngay, null)) : null); luc = r.mp_luc;
      tieuDe = `${TEN_PHAN[r.mp_phan as PhanMeeting]} · Meeting CX/GĐCN · ${r.full_name}`; nhan = tt === 'xong' ? 'Hoàn thành' : tt === 'bo' ? 'Đã bỏ' : 'Chưa xong';
      ptLuat = r.mp_phan === 'xep_lich' ? (r.mp_vai ? 'BPXL chi nhánh' : r.tvv_ten ?? 'Head chi nhánh') : r.mp_vai ? (r.mp_vai_key === VAI_GDCN ? 'GĐCN chi nhánh' : 'CX chi nhánh') : 'Head chi nhánh';
      if (r.mp_vai) ptIds = [r.mp_vai];
      luatLaToi = r.mp_vai ? r.mp_vai === p.userId : r.mp_phan === 'xep_lich' && r.tvv ? laTvvCuaEm(p, { consultant_user_id: r.tvv, student_id: r.student_id, em_branch: r.em_branch ?? undefined }) : ql(r.mp_cn ?? r.em_branch ?? null)[0] === p.userId;
    }
    /* (11) việc tôi đang phụ trách (giao cho tôi / theo luật) nằm ở "Của tôi" — không lặp ở đây. */
    if (r.pt ? r.pt === p.userId : luatLaToi) continue;
    if (!r.pt && ptLuat === 'Head chi nhánh') ptIds = nho(`gv2:ql:${r.em_branch ?? 0}`, () => ql(r.em_branch ?? null));
    const d: DongTheoDoi = { loai, refId: r.ref_id, tieuDe, studentId: r.sid, studentName: r.full_name, classCode: r.class_code ?? null,
      phuTrach: r.pt ? r.pt_ten ?? null : ptLuat, han, quaHan: tt === 'mo' && (loai === 'bao_ph' ? quaHanBaoPh(han, today, r.b_cho) : !!han && han < today), trangThai: tt, nhanTrangThai: nhan, xongLuc: tt === 'mo' ? null : luc };
    if (!r.pt && ptIds?.length) theoVai.push([d, ptIds]);
    const g = theoLoai.get(loai) ?? theoLoai.set(loai, { mo: [], vuaXong: [] }).get(loai)!;
    (tt === 'mo' ? g.mo : g.vuaXong).push(d);
  }
  /* Tên người theo vai: MỘT câu cho cả tab (chỉ khi có dòng theo luật theo vai). */
  if (theoVai.length) {
    const ten = new Map<number, string>((db().prepare(`SELECT id, full_name FROM users WHERE id IN (${DS_JSON})`).all(JSON.stringify([...new Set(theoVai.flatMap(([, ids]) => ids))])) as any[]).map((u) => [u.id, u.full_name]));
    for (const [d, ids] of theoVai) if (ten.has(ids[0])) d.phuTrach = `${ten.get(ids[0])}${ids.length > 1 ? ` +${ids.length - 1}` : ''}`;
  }
  const xep = (a: DongTheoDoi, b: DongTheoDoi) => Number(b.quaHan) - Number(a.quaHan) || (a.han ?? '9999').localeCompare(b.han ?? '9999');
  return { nhom: ([...LOAI_GIAO, 'van_hanh'] as LoaiTheoDoi[]).filter((l) => theoLoai.has(l)).map((l) => {
    const g = theoLoai.get(l)!;
    return { loai: l, ten: NHAN_LOAI[l], mo: g.mo.sort(xep), vuaXong: g.vuaXong.sort((a, b) => (b.xongLuc ?? '').localeCompare(a.xongLuc ?? '')) };
  }) };
}

