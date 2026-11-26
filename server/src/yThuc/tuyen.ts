/**
 * TUYEN-0 (N72 ①–④, chủ SP duyệt 26/11 — đặc tả `docs/superpowers/specs/2026-11-26-tuyen-cong-viec-yt-phoi-hop/thiet-ke.md` mục 2 C1–C4, 4.5):
 * TUYẾN việc Ý thức & Phối hợp, máy chủ DỰNG từ bảng sẵn có (C4 — không bảng bước, không ghi đôi). Một tuyến:
 *   · `vi_pham`  khoá = id lần xử lý (`discipline_measures`) · `em{id}` = tuyến "đang chờ xử lý" của em (chưa có lần xử lý)
 *   · `phoi_hop` khoá = id lượt (`assessment_attempts`) — một em × một lượt SOS (cả Báo PH kết quả Test lớp thường)
 *   · `tinh_hinh` khoá = `tinh_hinh_hoc_tap.id` (hai chiều) · `cap_bac` khoá = thẻ `sua_khai_bac` (`yeu_cau_duyet.id`)
 * Bước tương lai (○ `cho`) tính bằng luật đang dùng (người giữ mặc định, `buocTvvViec`, `hanPhanMeeting`) — KHÔNG thành việc / số / chuông (N72 ③).
 * Quyền (C3): khung bước cho ai có mặt trong tuyến (giữ / đã làm / theo dõi một việc) hoặc xem được Ý thức em; `noiDung` chỉ khi quyền đọc SẴN CÓ cho phép.
 * Theo dõi theo tuyến (C1): SUY RA khi đọc — người đã làm một bước (không phải bước cuối) theo dõi cả tuyến; "Bỏ theo dõi" ghi `tuyen_bo_theo_doi`,
 * làm thêm bước sau đó thì theo dõi lại. Không là quyền đọc, không tin "Cập nhật" mới, không chuông (N72 ①).
 * Dựng theo LÔ: mỗi loại tuyến MỘT câu (bước con đọc bằng câu con json) + vài câu chung (vai, theo dõi tay) — không N+1.
 */
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import {
  COORDINATION_KINDS, PERMISSIONS, addDaysIso, buocTvvViec, tuanLich, laViecTvvBaoPh, hanBaoPhHieuLuc, hanPhanMeeting, hanPhoiHop, hanTai, hanTheoNgay, laMeetingCx, ngayTheoGioVN, nhanLoaiXuLy, tenViec,
} from '../../../shared/domain/index.ts';
import { can, laTvvCuaEm, napTruocPhamVi, type Principal } from '../permissions.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { SU_KIEN_TAM_DUNG_SQL, khoangTuSuKien } from '../students/tamDung.ts';
import { trangThaiYThuc } from './trangThai.ts';
import { xemYThucHv } from './access.ts';
import { CHI_NHANH_EM, LY_DO_HE_THONG } from './baoPhTvv.ts';
import { luatMeeting } from '../worklist/giaoViec.ts';
import { GV_CHINH_SQL, chinhTuGv } from '../classes/lienPhongBan.ts';
import { conVaiO as giuVaiO, headCua } from '../worklist/nguoiNhan.ts';

/* LPB-0 (N73 ④, 4.7): + `chuyen_lop` khoá = id lệnh chuyển lớp (một em) · `doi_gv` khoá = id việc Nhận thông tin · Đổi GV (một lần lưu × lớp — không em). */
export const LOAI_TUYEN = ['vi_pham', 'phoi_hop', 'tinh_hinh', 'cap_bac', 'chuyen_lop', 'doi_gv'] as const;
export type LoaiTuyen = (typeof LOAI_TUYEN)[number];
export type TrangThaiBuoc = 'xong' | 'dang' | 'cho' | 'bo' | 'tam_dung';
/** Việc lưu sẵn của bước (khối giao việc N58 / panel) — loại như `LoaiGiao`. */
type ViecBuoc = { loai: 'bao_ph' | 'phoi_hop' | 'tinh_hinh' | 'meeting' | 'tra_lai' | 'xu_ly' | 'da_thuc_hien' | 'nhan_tin'; id: number };
export type BuocTuyen = {
  khoa: string; ten: string; trangThai: TrangThaiBuoc; chiTiet: string | null;
  /** Người giữ (đang / chưa tới lượt) hoặc người đã làm; null = máy (tự chốt / tự xong). `laToi`: chính người xem (web: "Bạn"). */
  nguoi: string | null; laToi: boolean;
  /** Ngày đã làm (YYYY-MM-DD) · hạn của bước đang ở. */
  ngay: string | null; han: string | null;
  /** Bước con (Meeting: Xếp lịch họp → Kết quả meeting; Báo PH của một việc Phối hợp) — khoá bước cha. `cungLuc`: các việc song song của một lượt. */
  cha: string | null; cungLuc: boolean;
  /** C3: `coNoiDung` = có nội dung VÀ người xem đọc được; `khongQuyen` = có nội dung nhưng ngoài quyền xem (web: "Không xem được nội dung"). */
  coNoiDung: boolean; khongQuyen: boolean; noiDung?: string;
  viec: ViecBuoc | null;
};
export type Tuyen = {
  loai: LoaiTuyen; khoa: string; tieuDe: string;
  /** null = tuyến của lớp (`doi_gv`) — xem `lop`. */ em: { id: number; ten: string; lop: string | null } | null;
  lop: { id: number; code: string } | null;
  /** N73 ④: người phụ trách CHÍNH của tuyến (Chuyển lớp: GVCN lớp cũ · Đổi GV: GVCN lớp; không có → Head) — chỉ đứng tên + theo dõi. */
  phuTrachChinh: string | null;
  /** Em đang Lưu trữ: chỉ xem, không bước nào sinh việc. */
  chiXem: boolean;
  buoc: BuocTuyen[];
  xong: number; tong: number; soDang: number;
  /** "Đang ở {bước} · {người}" — bước của người xem trước; nhiều bước cùng lúc không phải của người xem → "{n} bước cùng lúc". */
  dangO: { ten: string; nguoi: string | null; han: string | null } | null;
  ketThuc: boolean; ketThucLuc: string | null;
  /** TUYEN-1 (N74): tên MỘT Head của chi nhánh em (`headCua`) — chỉ tuyến "đang chờ xử lý": web xem trước bước ○ Head duyệt khi GVCN chọn cách khác mặc định. */
  head?: string | null;
};

/* ---------------------------------------------------------------- phần dùng chung */

type BuocNoi = Omit<BuocTuyen, 'laToi' | 'coNoiDung' | 'khongQuyen' | 'noiDung'> & {
  /** Người có mặt ở bước (giữ / làm / nhận) — quyền khung + "Bạn". */ ids: number[];
  /** Người ĐÃ LÀM bước (theo dõi theo tuyến, C1). */ lam: number[];
  nd: string | null;
  /** TUYEN-2 (rà #2273 P2-3): phần nội dung CHỈ người xem được Ý thức em đọc (liên hệ phụ huynh) — nối sau `nd`. */ ndEm?: string | null;
  /** Đọc nội dung bằng quyền riêng của bước (ngoài quyền xem Ý thức em): người có mặt, người theo dõi tay việc đó, TVV của em… */ docRieng?: (p: Principal) => boolean;
  /** Người giữ theo VAI cả chi nhánh (mọi BPXL / CX / Head) — bước ○ của họ KHÔNG tính là có mặt (PTA rà #2231 P2-6). */ vai?: boolean;
};
type TuyenNoi = Omit<Tuyen, 'buoc' | 'xong' | 'tong' | 'soDang' | 'dangO' | 'ketThuc' | 'ketThucLuc' | 'head' | 'lop' | 'phuTrachChinh'> & { buoc: BuocNoi[]; luc: string | null; tvv: number | null; cn: number | null;
  lop?: Tuyen['lop']; /** LPB-0: phụ trách chính (có mặt cả tuyến). */ chinh?: { id: number; ten: string } | null; /** LPB-0: khoá lô chuyển lớp (lớp nguồn × ngày ra lệnh) — Đang theo dõi một dòng mỗi lô. */ lo?: string };

const ngay10 = (s: string | null | undefined): string | null => (s ? (/^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ngayTheoGioVN(s) ?? s.slice(0, 10)) : null);
const ds = (j: string | null | undefined): any[] => (j ? (JSON.parse(j) as any[]).filter((x) => x && x.id != null) : []);
const tenGop = (ten: readonly (string | null | undefined)[]): string | null => {
  const t = [...new Set(ten.filter((x): x is string => !!x))];
  return t.length ? `${t[0]}${t.length > 1 ? ` +${t.length - 1}` : ''}` : null;
};
const buoc = (b: Partial<BuocNoi> & Pick<BuocNoi, 'khoa' | 'ten' | 'trangThai'>): BuocNoi =>
  ({ chiTiet: null, nguoi: null, ngay: null, han: null, cha: null, cungLuc: false, viec: null, ids: [], lam: [], nd: null, ...b });

/** Câu con: GVCN đang hiệu lực của lớp em đang học → `[id, tên]` (như `gvcnCuaEm`). `?2` = hôm nay. */
const GVCN_SQL = `(SELECT json_array(ta.user_id, gu.full_name) FROM enrollments e_ JOIN teacher_assignments ta ON ta.class_id = e_.class_id AND ta.is_core = 1 AND ta.status = 'active'
    AND ta.effective_from <= ?2 AND (ta.effective_to IS NULL OR ta.effective_to >= ?2) JOIN users gu ON gu.id = ta.user_id WHERE e_.student_id = s.id AND e_.status = 'active' ORDER BY e_.id DESC, ta.id LIMIT 1)`;
const LOP_SQL = `(SELECT c_.code FROM enrollments e_ JOIN classes c_ ON c_.id = e_.class_id WHERE e_.student_id = s.id AND e_.status = 'active' ORDER BY e_.id DESC LIMIT 1)`;
/** Cột chung của em (bí danh `s`). */
const EM_COT = `s.id AS sid, s.full_name AS em_ten, s.consultant_user_id AS tvv, tv.full_name AS tvv_ten, s.archived_at, ${CHI_NHANH_EM} AS cn, ${GVCN_SQL} AS gvcn, ${LOP_SQL} AS lop`;
/** Câu con json: việc Báo PH (bí danh `b`) + mọi lần ghi — điều kiện `dk` trên `b`. */
const BAO_PH_JSON = (dk: string) => `json((SELECT json_group_array(json_object('id', b.id, 'tt', b.trang_thai, 'han', b.han, 'hanChon', b.han_chon, 'pt', b.phu_trach_id, 'ptTen', bu.full_name,
    'cho', b.tra_lai_id, 'bo', b.bo_ly_do, 'boLuc', b.bo_luc, 'taoLuc', b.tao_luc, 'measure', b.measure_id, 'baoLai', b.bao_lai_cua, 'phoiHop', b.phoi_hop_id, 'nl', b.nguoi_luat,
    'dung', CASE WHEN b.trang_thai = 'mo' AND b.han_chon IS NULL THEN ${SU_KIEN_TAM_DUNG_SQL('b.student_id')} END,
    'lan', json((SELECT json_group_array(json_object('id', l.id, 'kq', l.ket_qua, 'ngay', l.ngay, 'ghiChu', l.ghi_chu, 'boi', l.ghi_boi, 'boiTen', lu.full_name, 'luc', l.ghi_luc))
      FROM viec_bao_ph_lan l LEFT JOIN users lu ON lu.id = l.ghi_boi WHERE l.viec_id = b.id))))
  FROM viec_bao_ph b LEFT JOIN users bu ON bu.id = b.phu_trach_id WHERE ${dk}))`;

/** Người giữ vai ở chi nhánh — MỘT câu mỗi request. Head: vai `manager` ở chi nhánh / toàn hệ thống; không có → Quản trị (như `ql`). */
type NguoiVai = { key: string; u: number; b: number | null; ten: string };
const nguoiVai = () => nho('tuyen:vai', () => db().prepare(`SELECT r.key, ur.user_id AS u, ur.branch_id AS b, u.full_name AS ten FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    JOIN users u ON u.id = ur.user_id WHERE r.key IN ('manager', 'system_admin', 'cx', 'scheduler', 'lead_consultant') AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL
    ORDER BY ur.created_at, ur.id`).all() as NguoiVai[]);
const vaiO = (key: string, cn: number | null): NguoiVai[] =>
  [...new Map(nguoiVai().filter((x) => x.key === key && (x.b === null || x.b === cn)).map((x) => [x.u, x])).values()];
/* VAI-0 (N74): Head lùi MỘT người (`headCua`) — cùng nguồn với Công việc / panel. */
const head = (cn: number | null): NguoiVai[] => { const h = headCua(cn); const x = h ? nguoiVai().find((y) => y.u === h) : undefined; return x ? [x] : []; };
const theoVai = (ng: NguoiVai[], nhan: string) => ({ ids: ng.map((x) => x.u), nguoi: tenGop(ng.map((x) => x.ten)) ?? nhan, vai: true });
/** Em vào Lưu trữ (`students/dongLuuTru.ts`): mã / lý do đóng hệ thống. */
const LUU_TRU = 'system_luu_tru';
const LY_DO_LUU_TRU = 'Học viên vào Lưu trữ';
const DONG_LUU_TRU = 'Đóng — em vào Lưu trữ';

/** Người giữ Báo PH theo luật (N2, N72 ⑤): người được giao → TVV của em → Head chi nhánh. */
function giuBaoPh(t: TuyenNoi, pt: number | null, ptTen: string | null, tvvTen: string | null, nl: number | null = null) {
  if (pt) return { ids: [pt], nguoi: ptTen, vai: false };
  if (t.tvv) return { ids: [t.tvv], nguoi: tvvTen, vai: false };
  /* VAI-0 (N76b): Lead TVV chốt lúc sinh, còn vai ở CN em. */
  if (giuVaiO(nl, 'lead_consultant', t.cn)) return { ids: [nl!], nguoi: nguoiVai().find((y) => y.u === nl)?.ten ?? null, vai: false };
  return theoVai(head(t.cn), 'Head chi nhánh');
}

/** Các bước của MỘT việc Báo PH: mỗi lần "Chưa liên hệ được" một dòng (vòng lặp, không ghi đè) + dòng trạng thái hiện tại. */
function buocBaoPh(t: TuyenNoi, b: any, o: { khoa: string; ten: string; cha?: string | null; tvvTen: string | null }): BuocNoi[] {
  const lan = ((b.lan ?? []) as any[]).filter((l) => l?.id != null).sort((x, y) => x.id - y.id);
  const viec: ViecBuoc = { loai: 'bao_ph', id: b.id };
  const giu = giuBaoPh(t, b.pt ?? null, b.ptTen ?? null, o.tvvTen, b.nl ?? null);
  const ra: BuocNoi[] = [];
  const dau = lan.filter((l) => l.kq !== 'da_bao');
  dau.forEach((l, i) => ra.push(buoc({ khoa: `${o.khoa}:l${l.id}`, ten: o.ten, trangThai: 'xong', chiTiet: `Chưa liên hệ được · lần ${i + 1}`, nguoi: l.boiTen ?? null,
    ngay: l.ngay, cha: o.cha ?? null, viec, ids: l.boi ? [l.boi] : [], nd: l.ghiChu ?? null })));
  const xong = lan.filter((l) => l.kq === 'da_bao').at(-1);
  if (b.tt === 'xong' && xong) {
    ra.push(buoc({ khoa: o.khoa, ten: o.ten, trangThai: 'xong', chiTiet: 'Đã báo PH', nguoi: xong.boiTen ?? null, ngay: xong.ngay, cha: o.cha ?? null, viec,
      ids: xong.boi ? [xong.boi] : [], lam: xong.boi ? [xong.boi] : [], nd: xong.ghiChu ?? null }));
  } else if (b.tt === 'bo') {
    ra.push(buoc({ khoa: o.khoa, ten: o.ten, trangThai: 'bo', chiTiet: b.bo === LUU_TRU ? DONG_LUU_TRU : (LY_DO_HE_THONG as Record<string, string>)[b.bo] ?? 'Đã bỏ',
      ngay: ngay10(b.boLuc), cha: o.cha ?? null, viec, ids: giu.ids, vai: giu.vai }));
  } else {
    /* `dung` qua json lồng là mảng (kiểu json giữ qua câu con) — `khoangTuSuKien` nhận chuỗi. */
    const han = hanBaoPhHieuLuc(b.han, khoangTuSuKien(b.dung == null ? null : typeof b.dung === 'string' ? b.dung : JSON.stringify(b.dung)), b.hanChon ?? null);
    ra.push(buoc({ khoa: o.khoa, ten: o.ten, trangThai: b.cho ? 'tam_dung' : 'dang', chiTiet: b.cho ? 'Chờ GV sửa' : dau.length ? `Chưa liên hệ được · lần ${dau.length + 1}` : null,
      ...giu, han: b.cho ? null : han, cha: o.cha ?? null, viec }));
  }
  /* Quyền đọc sẵn có của việc Báo PH (`xemViecBaoPh`): TVV của em, người có mặt, người theo dõi việc (`theoDoiTay`). */
  for (const x of ra) x.docRieng = (p) => x.ids.includes(p.userId) || laTvvCuaEm(p, { consultant_user_id: t.tvv, student_id: t.em!.id, em_branch: t.cn }) || theoDoiTayCua(p).has(`bao_ph:${b.id}`);
  return ra;
}
/** Báo PH chưa có việc (chưa tới lượt) — người giữ theo luật, chữ "sau khi …". */
const baoPhCho = (t: TuyenNoi, o: { khoa: string; ten: string; sau: string; cha?: string | null; tvvTen: string | null }): BuocNoi =>
  buoc({ khoa: o.khoa, ten: o.ten, trangThai: 'cho', chiTiet: o.sau, cha: o.cha ?? null, ...giuBaoPh(t, null, null, o.tvvTen) });

/* ---------------------------------------------------------------- tuyến Vi phạm (một lần xử lý) */

function dungViPham(ids: number[], homNay: string): TuyenNoi[] {
  if (!ids.length) return [];
  const rows = db().prepare(
    `SELECT m.id, m.kind, m.custom_name, m.status, m.note, m.performed_on, m.created_at, m.created_by, m.quyet_luc, m.updated_at, m.confirmed_by,
            COALESCE(m.performer_name, pu.full_name) AS thuc_ten, cu.full_name AS tao_ten, m.phu_trach_id AS pt, mpt.full_name AS pt_ten, m.han_chon, ${EM_COT},
            json((SELECT json_group_array(json_object('id', v.id, 'ten', COALESCE(NULLIF(v.ten, ''), v.description), 'ngay', v.occurred_on, 'boi', v.reported_by, 'boiTen', ru.full_name))
              FROM measure_violations mv JOIN violations v ON v.id = mv.violation_id LEFT JOIN users ru ON ru.id = v.reported_by WHERE mv.measure_id = m.id)) AS vp,
            json((SELECT json_group_array(json_object('id', y.id, 'loai', y.loai, 'tt', y.trang_thai, 'xin', y.nguoi_xin, 'xinTen', xu.full_name, 'duyet', y.nguoi_duyet, 'duyetTen', du.full_name,
                'han', y.han_duyet, 'tao', y.tao_luc, 'xuLy', y.xu_ly_luc, 'lyDo', y.ly_do, 'tuChoi', y.ly_do_tu_choi, 'dong', y.ly_do_dong))
              FROM yeu_cau_duyet y LEFT JOIN users xu ON xu.id = y.nguoi_xin LEFT JOIN users du ON du.id = y.nguoi_duyet
              WHERE y.doi_tuong_loai = 'discipline_measure' AND y.doi_tuong_id = m.id AND y.loai IN ('y_thuc', 'thu_hoi_y_thuc'))) AS the,
            ${BAO_PH_JSON('b.measure_id = m.id OR b.bao_lai_cua = m.id')} AS bp,
            json((SELECT json_group_array(json_object('id', t.id, 'tt', t.trang_thai, 'lyDo', t.ly_do, 'tra', t.nguoi_tra, 'traTen', tu.full_name, 'luc', t.tra_luc, 'han', COALESCE(t.han_chon, t.han),
                'nhan', COALESCE(t.phu_trach_id, t.nguoi_nhan), 'nhanTen', nu.full_name, 'kq', t.ket_qua, 'traLoi', t.tra_loi, 'xongBoi', t.xong_boi, 'xongTen', xb.full_name, 'xongLuc', t.xong_luc,
                'vp', t.violation_id))
              FROM vi_pham_tra_lai t LEFT JOIN users tu ON tu.id = t.nguoi_tra LEFT JOIN users nu ON nu.id = COALESCE(t.phu_trach_id, t.nguoi_nhan) LEFT JOIN users xb ON xb.id = t.xong_boi
              WHERE t.measure_id = m.id OR (t.violation_id IN (SELECT mv2.violation_id FROM measure_violations mv2 WHERE mv2.measure_id = m.id) AND t.tra_luc >= m.created_at))) AS tl
       FROM discipline_measures m JOIN students s ON s.id = m.student_id LEFT JOIN users tv ON tv.id = s.consultant_user_id
       LEFT JOIN users pu ON pu.id = m.performed_by LEFT JOIN users cu ON cu.id = m.created_by LEFT JOIN users mpt ON mpt.id = m.phu_trach_id
      WHERE m.id IN (SELECT value FROM json_each(?1)) AND m.status != 'nhap'`,
  ).all(JSON.stringify(ids), homNay) as any[];
  return rows.map((m) => {
    const gv = m.gvcn ? JSON.parse(m.gvcn) as [number, string] : null;
    const t: TuyenNoi = { loai: 'vi_pham', khoa: String(m.id), tieuDe: `Vi phạm · ${nhanLoaiXuLy(m.kind, m.custom_name)}`, em: { id: m.sid, ten: m.em_ten, lop: m.lop ?? null },
      chiXem: !!m.archived_at, buoc: [], luc: m.created_at, tvv: m.tvv ?? null, cn: m.cn ?? null };
    const giuGvcn = gv ? { ids: [gv[0]], nguoi: gv[1], vai: false } : theoVai(head(t.cn), 'Head chi nhánh');
    const vp = ds(m.vp).sort((a, b) => a.ngay.localeCompare(b.ngay) || a.id - b.id);
    const nguoiGhi = [...new Set(vp.map((v) => v.boi as number))];
    t.buoc.push(buoc({ khoa: 'ghi', ten: `GV ghi ${vp.length} vi phạm`, trangThai: 'xong', nguoi: tenGop(vp.map((v) => v.boiTen)), ngay: vp.at(-1)?.ngay ?? null, ids: nguoiGhi,
      nd: vp.map((v) => `${v.ngay} · ${v.ten}${v.boiTen ? ` · ${v.boiTen}` : ''}`).join('\n') || null }));
    const nhan = nhanLoaiXuLy(m.kind, m.custom_name);
    const the = ds(m.the).sort((a, b) => a.id - b.id);
    const de = the.filter((y) => y.loai === 'y_thuc').at(-1);
    const tao = { ids: [m.created_by], lam: [m.created_by], nguoi: m.tao_ten ?? null };
    /* Em vào Lưu trữ khi lần xử lý chờ Head / chờ thực hiện: thẻ tự đóng + lần xử lý về `thu_hoi` (`dongLuuTru`) — không phải thu hồi của người. */
    const luuTru = de?.tt === 'tu_dong' && de.dong === LY_DO_LUU_TRU;
    const xlCon = m.status !== 'thu_hoi' && m.status !== 'tu_choi';
    if (de) {
      /* Khác mặc định (N1): GVCN gửi → Head duyệt (5 ngày, quá hạn tự chốt) → Đã thực hiện (GVCN). */
      t.buoc.push(buoc({ khoa: 'xu_ly', ten: 'Xử lý vi phạm', trangThai: 'xong', chiTiet: `đề xuất ${nhan}`, ...tao, ngay: ngay10(de.tao), nd: m.note ?? null }));
      const hd = head(t.cn);
      if (de.tt === 'cho') t.buoc.push(buoc({ khoa: 'duyet', ten: 'Head duyệt', trangThai: 'dang', ...theoVai(hd, 'Head chi nhánh'), han: de.han ?? null }));
      else if (de.tt === 'tu_choi') t.buoc.push(buoc({ khoa: 'duyet', ten: 'Head duyệt', trangThai: 'bo', chiTiet: 'Từ chối', nguoi: de.duyetTen ?? null, ngay: ngay10(de.xuLy),
        ids: de.duyet ? [de.duyet] : [], lam: de.duyet ? [de.duyet] : [], nd: de.tuChoi ?? null }));
      else if (luuTru) t.buoc.push(buoc({ khoa: 'duyet', ten: 'Head duyệt', trangThai: 'bo', chiTiet: DONG_LUU_TRU, ngay: ngay10(de.xuLy) }));
      else t.buoc.push(buoc({ khoa: 'duyet', ten: 'Head duyệt', trangThai: 'xong', chiTiet: de.tt === 'tu_dong' ? 'Tự chốt theo GVCN' : 'Đã duyệt', nguoi: de.duyetTen ?? null,
        ngay: ngay10(de.xuLy), ids: de.duyet ? [de.duyet] : [], lam: de.duyet ? [de.duyet] : [] }));
      if (m.status === 'da_duyet') {
        const q = ngay10(m.quyet_luc);
        /* BAOPH-0 (N72 ⑥): việc "Đã thực hiện" giao được (`da_thuc_hien`) — người được giao thắng GVCN; hạn đặt tay thắng quyết + 4. */
        t.buoc.push(buoc({ khoa: 'thuc_hien', ten: 'Đã thực hiện', trangThai: 'dang', ...(m.pt ? { ids: [m.pt], nguoi: m.pt_ten ?? null, vai: false } : giuGvcn),
          han: m.han_chon ?? (q ? hanTheoNgay(q, hanTai('xu_ly_vi_pham', q).ngay) : null), viec: { loai: 'da_thuc_hien', id: m.id } }));
      } else if (m.status === 'cho_duyet') t.buoc.push(buoc({ khoa: 'thuc_hien', ten: 'Đã thực hiện', trangThai: 'cho', chiTiet: 'sau khi Head duyệt', ...giuGvcn }));
      else if (m.performed_on && m.status !== 'tu_choi') t.buoc.push(buoc({ khoa: 'thuc_hien', ten: 'Đã thực hiện', trangThai: 'xong', nguoi: m.thuc_ten ?? null, ngay: m.performed_on,
        ids: m.confirmed_by ? [m.confirmed_by] : [], lam: m.confirmed_by ? [m.confirmed_by] : [] }));
    } else {
      t.buoc.push(buoc({ khoa: 'xu_ly', ten: 'Xử lý vi phạm', trangThai: 'xong', chiTiet: nhan, ...tao, ngay: m.performed_on ?? ngay10(m.created_at), nd: m.note ?? null }));
    }
    /* Trả lại (N61): một dòng mỗi lần trả, theo thời gian (vòng lặp — gửi lại thì Báo PH chạy tiếp). */
    for (const r of ds(m.tl).sort((a, b) => String(a.luc).localeCompare(String(b.luc)))) {
      const ten = r.vp ? 'Vi phạm bị trả lại' : 'Lần xử lý bị trả lại';
      const ids2 = [r.tra, r.nhan, r.xongBoi].filter(Boolean) as number[];
      const nd = [`${r.traTen ?? 'TVV'} trả lại: ${r.lyDo}`, r.traLoi ? `Trả lời: ${r.traLoi}` : null].filter(Boolean).join('\n');
      const viec: ViecBuoc = { loai: 'tra_lai', id: r.id };
      /* PTA rà #2231 P2-4: lần xử lý đã thu hồi / bị từ chối → yêu cầu còn mở không phải bước đang ở (đóng theo đường sẵn có). */
      const heThongRut = r.tt === 'rut' && !r.xongBoi;
      t.buoc.push(r.tt === 'mo' && xlCon
        ? buoc({ khoa: `tl${r.id}`, ten, trangThai: 'dang', chiTiet: `${r.traTen ?? 'TVV'} trả`, nguoi: r.nhanTen ?? null, han: r.han ?? null, ids: ids2, nd, viec })
        : buoc({ khoa: `tl${r.id}`, ten, trangThai: r.tt === 'xong' ? 'xong' : 'bo', chiTiet: r.tt === 'xong' ? (r.kq === 'giu_nguyen' ? 'Giữ nguyên' : 'Đã gửi lại') : r.tt === 'mo' ? 'Lần xử lý đã đóng' : heThongRut ? 'Hệ thống rút (Lưu trữ)' : 'Đã rút',
          nguoi: r.tt === 'xong' ? r.xongTen ?? null : heThongRut ? null : r.traTen ?? null, ngay: ngay10(r.xongLuc ?? r.luc), ids: ids2, lam: r.xongBoi ? [r.xongBoi] : [], nd, viec }));
      t.buoc.at(-1)!.docRieng = (p) => ids2.includes(p.userId) || theoDoiTayCua(p).has(`tra_lai:${r.id}`);
    }
    const bp = ds(m.bp);
    const tvvTen = m.tvv_ten ?? null;
    const viecPh = bp.find((b) => b.measure === m.id);
    const truoc = t.buoc.at(-1)!.ten;
    if (viecPh) t.buoc.push(...buocBaoPh(t, viecPh, { khoa: 'bao_ph', ten: 'Báo PH', tvvTen }));
    /* TUYEN-1: khác mặc định — Báo PH chạy cùng lúc với Đã thực hiện, cùng chờ Head duyệt. */
    else if (['cho_duyet', 'da_duyet'].includes(m.status)) t.buoc.push(baoPhCho(t, { khoa: 'bao_ph', ten: 'Báo PH', sau: de && m.status === 'cho_duyet' ? 'sau khi Head duyệt' : `sau khi ${truoc.toLowerCase()}`, tvvTen }));
    /* Thu hồi (N5): thẻ chờ Head → bước đang ở; đã áp → tuyến kết thúc ✕; Báo PH đã xong → "Báo lại PH". */
    const th = the.filter((y) => y.loai === 'thu_hoi_y_thuc').at(-1);
    if (th?.tt === 'cho') {
      t.buoc.push(buoc({ khoa: 'thu_hoi', ten: 'Thu hồi · Head duyệt', trangThai: 'dang', chiTiet: `${th.xinTen ?? 'GVCN'} xin thu hồi`, ...theoVai(head(t.cn), 'Head chi nhánh'),
        han: th.han ?? null, lam: th.xin ? [th.xin] : [], nd: th.lyDo ?? null }));
      t.buoc.at(-1)!.ids.push(...(th.xin ? [th.xin] : []));
    } else if (th?.tt === 'tu_choi') {
      t.buoc.push(buoc({ khoa: 'thu_hoi', ten: 'Thu hồi · Head duyệt', trangThai: 'bo', chiTiet: 'Từ chối thu hồi', nguoi: th.duyetTen ?? null, ngay: ngay10(th.xuLy),
        ids: [th.xin, th.duyet].filter(Boolean), nd: th.tuChoi ?? null }));
    }
    if (m.status === 'thu_hoi') {
      if (luuTru && !th) t.buoc.push(buoc({ khoa: 'da_thu_hoi', ten: 'Đã đóng', trangThai: 'bo', chiTiet: DONG_LUU_TRU, ngay: ngay10(de.xuLy ?? m.updated_at) }));
      else t.buoc.push(buoc({ khoa: 'da_thu_hoi', ten: 'Đã thu hồi', trangThai: 'bo', nguoi: th?.duyetTen ?? th?.xinTen ?? null, ngay: ngay10(th?.xuLy ?? m.updated_at),
        ids: [th?.xin, th?.duyet].filter(Boolean) as number[], lam: [th?.xin, th?.duyet].filter(Boolean) as number[], nd: th?.lyDo ?? null }));
      const lai = bp.find((b) => b.baoLai === m.id);
      if (lai) t.buoc.push(...buocBaoPh(t, lai, { khoa: 'bao_lai', ten: 'Báo lại PH', tvvTen }));
    }
    /* TUYEN-1 (mockup v27 T2): khác mặc định — sau Head duyệt, "Đã thực hiện" (GVCN) và "Báo PH" (TVV) chạy CÙNG LÚC (`sinhViecBaoPh` lúc chốt, N1). */
    if (de && t.buoc.some((b) => b.khoa === 'thuc_hien')) for (const b of t.buoc) if (b.khoa === 'thuc_hien' || b.khoa === 'bao_ph' || b.khoa.startsWith('bao_ph:')) b.cungLuc = true;
    /* Nội dung lần xử lý / thẻ: quyền xem Ý thức em hoặc người có mặt ở bước (`docRieng` mặc định). */
    return t;
  });
}

/** Tuyến "đang chờ xử lý" của em (chưa có lần xử lý): bắt buộc xử lý (luật 3 vi phạm / 2 tuần · yêu cầu xử lý) → GVCN · rồi Báo PH. */
function dungChoXuLy(sids: number[], homNay: string): TuyenNoi[] {
  if (!sids.length) return [];
  const tt = trangThaiYThuc(sids, homNay);
  const can = sids.filter((sid) => (tt.get(sid)?.soBatBuoc ?? 0) > 0);
  if (!can.length) return [];
  const vIds = can.flatMap((sid) => { const em = tt.get(sid)!; return em.dsViPham.filter((v) => { const x = em.viPham.get(v.id)?.t; return x !== 'da_xu_ly' && x !== 'cho_duyet'; }).map((v) => v.id); });
  const emR = db().prepare(`SELECT ${EM_COT}, xl.phu_trach_id AS xl_pt, xpu.full_name AS xl_pt_ten, xl.han_chon AS xl_han FROM students s LEFT JOIN users tv ON tv.id = s.consultant_user_id
      LEFT JOIN viec_xu_ly xl ON xl.id = s.id AND xl.trang_thai = 'mo' LEFT JOIN users xpu ON xpu.id = xl.phu_trach_id WHERE s.id IN (SELECT value FROM json_each(?1))`)
    .all(JSON.stringify(can), homNay) as any[];
  const vR = db().prepare(`SELECT v.id, v.student_id AS sid, COALESCE(NULLIF(v.ten, ''), v.description) AS ten, v.occurred_on AS ngay, v.reported_by AS boi, u.full_name AS boi_ten
      FROM violations v LEFT JOIN users u ON u.id = v.reported_by WHERE v.id IN (SELECT value FROM json_each(?))`).all(JSON.stringify(vIds)) as any[];
  return can.flatMap((sid) => {
    const e = emR.find((r) => r.sid === sid);
    if (!e) return [];
    const em = tt.get(sid)!;
    const vp = vR.filter((r) => r.sid === sid).sort((a, b) => a.ngay.localeCompare(b.ngay) || a.id - b.id);
    const gv = e.gvcn ? JSON.parse(e.gvcn) as [number, string] : null;
    const t: TuyenNoi = { loai: 'vi_pham', khoa: `em${sid}`, tieuDe: 'Vi phạm · chờ xử lý', em: { id: sid, ten: e.em_ten, lop: e.lop ?? null }, chiXem: !!e.archived_at,
      buoc: [], luc: null, tvv: e.tvv ?? null, cn: e.cn ?? null };
    t.buoc.push(buoc({ khoa: 'ghi', ten: `GV ghi ${vp.length} vi phạm`, trangThai: 'xong', nguoi: tenGop(vp.map((v) => v.boi_ten)), ngay: vp.at(-1)?.ngay ?? null,
      ids: [...new Set(vp.map((v) => v.boi as number))], nd: vp.map((v) => `${v.ngay} · ${v.ten}${v.boi_ten ? ` · ${v.boi_ten}` : ''}`).join('\n') || null }));
    /* BAOPH-0 (N72 ⑥): "Xử lý vi phạm" giao được (`viec_xu_ly`, id = em) — người được giao thắng GVCN. */
    const giu = e.xl_pt ? { ids: [e.xl_pt], nguoi: e.xl_pt_ten ?? null, vai: false } : gv ? { ids: [gv[0]], nguoi: gv[1], vai: false } : theoVai(head(t.cn), 'Head chi nhánh');
    /* PTA rà #2231 P2-5: em Lưu trữ — không bước "đang" kèm hạn, không bước sau (tuyến chỉ để xem). */
    if (t.chiXem) { t.buoc.push(buoc({ khoa: 'xu_ly', ten: 'Xử lý vi phạm', trangThai: 'bo', chiTiet: DONG_LUU_TRU, ...giu })); return [t]; }
    t.buoc.push(buoc({ khoa: 'xu_ly', ten: 'Xử lý vi phạm', trangThai: 'dang', chiTiet: nhanLoaiXuLy(em.keTiep.kind), ...giu, han: e.xl_han ?? em.han ?? null,
      viec: { loai: 'xu_ly', id: sid } }));
    t.buoc.push(baoPhCho(t, { khoa: 'bao_ph', ten: 'Báo PH', sau: 'sau khi xử lý', tvvTen: e.tvv_ten ?? null }));
    return [t];
  });
}

/* ---------------------------------------------------------------- tuyến Phối hợp SOS (em × lượt) */

const THU_TU_VIEC = (kind: string) => (laMeetingCx(kind) ? 100 : Math.max(0, (COORDINATION_KINDS as readonly string[]).indexOf(kind)));
/** Bước TVV của Meeting CHƯA xác nhận (bước tương lai) — cùng luật `phoiHop.ts dongBoViecTvv` (BAOPH-0 C8): cấu hình mốc có bước TVV và lượt không có Trao đổi gia đình. */
const coBaoPhSau = (x: any, luot: any[]) => !!buocTvvViec(x) && !(laMeetingCx(x.kind) && luot.some((y) => y.kind === 'talk_family' && y.status !== 'removed'));

function dungPhoiHop(ids: number[], homNay: string): TuyenNoi[] {
  if (!ids.length) return [];
  const rows = db().prepare(
    `SELECT x.id, x.attempt_id, x.kind, x.custom_name, x.status, x.performed_on, x.performed_by, x.note, x.created_at, x.updated_at, x.han_chon, x.pb_moc, x.phu_trach_id,
            x.remove_reason_code, x.removed_at, COALESCE(x.performer_name, pu.full_name) AS thuc_ten, ptu.full_name AS pt_ten,
            a.attempt_no, COALESCE(a.kind, 'mock') AS a_kind, (SELECT MAX(c.sos_level) FROM sos_cases c WHERE c.attempt_id = x.attempt_id) AS sos, ${EM_COT},
            json((SELECT json_group_array(json_object('id', mp.id, 'phan', mp.phan, 'tt', mp.trang_thai, 'pt', mp.phu_trach_id, 'ptTen', mpu.full_name, 'hanChon', mp.han_chon, 'tao', mp.tao_luc,
                'xongBoi', mp.xong_boi, 'xongTen', xu.full_name, 'xongLuc', mp.xong_luc, 'ngayGio', mp.ngay_gio, 'kq', mp.ket_qua, 'cn', mp.branch_id, 'nl', mp.nguoi_luat))
              FROM meeting_phan mp LEFT JOIN users mpu ON mpu.id = mp.phu_trach_id LEFT JOIN users xu ON xu.id = mp.xong_boi WHERE mp.phoi_hop_id = x.id)) AS mp,
            ${BAO_PH_JSON('b.phoi_hop_id = x.id')} AS bp, s.parent_name AS ph_ten, s.parent_relation AS ph_qh, s.parent_phone AS ph_sdt
       FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id JOIN students s ON s.id = x.student_id LEFT JOIN users tv ON tv.id = s.consultant_user_id
       LEFT JOIN users pu ON pu.id = x.performed_by LEFT JOIN users ptu ON ptu.id = x.phu_trach_id
      WHERE x.attempt_id IN (SELECT value FROM json_each(?1))`,
  ).all(JSON.stringify(ids), homNay) as any[];
  const theoLuot = new Map<number, any[]>();
  for (const r of rows) theoLuot.set(r.attempt_id, [...(theoLuot.get(r.attempt_id) ?? []), r]);
  return [...theoLuot.values()].map((luot) => {
    const r0 = luot[0];
    const gv = r0.gvcn ? JSON.parse(r0.gvcn) as [number, string] : null;
    const thuong = r0.a_kind !== 'mock';
    const t: TuyenNoi = { loai: 'phoi_hop', khoa: String(r0.attempt_id), em: { id: r0.sid, ten: r0.em_ten, lop: r0.lop ?? null }, chiXem: !!r0.archived_at,
      tieuDe: thuong ? 'Báo PH kết quả Test' : `Phối hợp SOS · MT${r0.attempt_no}${r0.sos ? ` · SOS ${r0.sos}` : ''}`, buoc: [], luc: r0.created_at, tvv: r0.tvv ?? null, cn: r0.cn ?? null };
    const giuGvcn = (x: any) => (x.phu_trach_id ? { ids: [x.phu_trach_id], nguoi: x.pt_ten ?? null, vai: false } : gv ? { ids: [gv[0]], nguoi: gv[1], vai: false }
      : theoVai(head(t.cn), 'Head chi nhánh'));
    /* Việc hệ thống bỏ (mức SOS đổi, lượt huỷ) không phải bước; việc người dùng bỏ / em vào Lưu trữ hiện ✕ (PTA rà #2231 P2-5). */
    const luuTru = (x: any) => x.status === 'removed' && x.remove_reason_code === LUU_TRU;
    const viec = luot.filter((x) => x.status !== 'removed' || luuTru(x) || !String(x.remove_reason_code ?? '').startsWith('system'))
      .sort((a, b) => THU_TU_VIEC(a.kind) - THU_TU_VIEC(b.kind) || a.id - b.id);
    const song = viec.length > 1;
    for (const x of viec) {
      const khoa = `x${x.id}`;
      const ten = x.kind === 'other' && x.custom_name ? x.custom_name : tenViec(x.kind, x.pb_moc ?? null);
      /* BAOPH-0 (N72 ⑤): Trao đổi gia đình / Báo PH kết quả Test là việc TVV (`viec_bao_ph.phoi_hop_id`) — MỘT bước Báo PH, GVCN không giữ bước nào.
         Chưa có việc TVV (lượt huỷ / sau thi thật / dữ liệu trước BAOPH-0) → như dòng nguồn. */
      const bpNguon = laViecTvvBaoPh(x.kind) ? ds(x.bp)[0] : null;
      if (bpNguon) {
        const tenBp = x.kind === 'bao_ph_tvv' ? `Báo PH · Kết quả ${r0.a_kind === 'final' ? 'Final' : 'Progress'}` : `Báo PH · ${ten}`;
        for (const b of buocBaoPh(t, bpNguon, { khoa, ten: tenBp, tvvTen: r0.tvv_ten ?? null })) t.buoc.push({ ...b, cungLuc: song });
        continue;
      }
      const lam = x.status === 'done' ? (x.performed_by ? [x.performed_by] : giuGvcn(x).ids) : [];
      const vx: ViecBuoc = { loai: 'phoi_hop', id: x.id };
      t.buoc.push(x.status === 'pending'
        ? buoc({ khoa, ten, trangThai: 'dang', ...giuGvcn(x), han: hanPhoiHop(x.kind, x.created_at, x.han_chon, x.pb_moc ?? null), cungLuc: song, viec: vx })
        : x.status === 'done'
          ? buoc({ khoa, ten, trangThai: 'xong', chiTiet: x.performed_by ? null : x.thuc_ten ?? null, nguoi: x.thuc_ten ?? null, ngay: x.performed_on, ids: lam, lam, cungLuc: song, nd: x.note ?? null, viec: vx })
          : buoc({ khoa, ten, trangThai: 'bo', chiTiet: luuTru(x) ? DONG_LUU_TRU : 'Đã bỏ', ngay: ngay10(x.removed_at), ...giuGvcn(x), cungLuc: song, viec: vx }));
      t.buoc.at(-1)!.docRieng = (p) => t.buoc.find((b) => b.khoa === khoa)!.ids.includes(p.userId) || theoDoiTayCua(p).has(`phoi_hop:${x.id}`);
      /* TUYEN-2 (mockup v27 T6, PTA chốt): bước GVCN xác nhận Meeting — nội dung = "Nội dung gửi" + Phụ huynh (tên · quan hệ · SĐT). Dòng PH: CHỈ người xem được
         Ý thức em (`xemYThucHv`) — không qua quyền riêng của bước / theo dõi tay. */
      if (laMeetingCx(x.kind) && x.status === 'done') {
        const ph = [x.ph_qh ? `${x.ph_qh.charAt(0).toUpperCase()}${x.ph_qh.slice(1)}` : null, x.ph_ten, x.ph_sdt].filter(Boolean).join(' · ');
        const b = t.buoc.at(-1)!;
        /* Rà #2273 P2-3: "Nội dung gửi" theo quyền đọc nội dung bước như cũ; dòng Phụ huynh (`ndEm`) CHỈ người xem được Ý thức em. */
        b.nd = x.note?.trim() ? `Nội dung gửi: ${x.note.trim()}` : null;
        b.ndEm = ph ? `Phụ huynh: ${ph}` : null;
      }
      const bp = ds(x.bp)[0];
      const tvvTen = r0.tvv_ten ?? null;
      const baoPh = () => {
        /* C8: việc "Báo PH Meeting" đã gộp vào Trao đổi gia đình (`system_gop_trao_doi`) không còn là bước. */
        if (bp && bp.bo === 'system_gop_trao_doi') return;
        if (bp) t.buoc.push(...buocBaoPh(t, bp, { khoa: `${khoa}:bp`, ten: 'Báo PH', cha: khoa, tvvTen }));
        else if (x.status === 'pending' && coBaoPhSau(x, luot)) t.buoc.push(baoPhCho(t, { khoa: `${khoa}:bp`, ten: 'Báo PH', sau: 'chờ GVCN xác nhận', cha: khoa, tvvTen }));
      };
      if (!laMeetingCx(x.kind)) { baoPh(); continue; }
      /* Meeting CX / GĐCN (N58 sửa C8): Xếp lịch họp → (Báo PH cũ nếu có) → Kết quả meeting — bước cuối, dưới cùng. */
      const phan = ds(x.mp);
      const ngayMt = (p: any) => (x.performed_on && /^\d{4}-\d{2}-\d{2}$/.test(x.performed_on) ? x.performed_on : ngay10(p?.tao) ?? homNay);
      for (const ph of ['xep_lich', 'ket_qua'] as const) {
        if (ph === 'ket_qua') baoPh();
        const r = phan.find((y) => y.phan === ph);
        const tenP = ph === 'xep_lich' ? 'Xếp lịch họp' : 'Kết quả meeting';
        const luat = luatMeeting(ph, r?.cn ?? t.cn, r?.nl ?? null);   // VAI-0 (N74): một người — cùng nguồn với Công việc / panel
        const giu = r?.pt ? { ids: [r.pt], nguoi: r.ptTen ?? null, vai: false } : luat ? { ids: [luat.u], nguoi: luat.ten, vai: true }
          : ph === 'xep_lich' && t.tvv ? { ids: [t.tvv], nguoi: tvvTen, vai: false } : theoVai(head(t.cn), 'Head chi nhánh');
        const kp = `${khoa}:${ph}`;
        const nd = r ? [r.ngayGio ? `Họp ${r.ngayGio}` : null, r.kq].filter(Boolean).join('\n') || null : null;
        if (!r) {
          if (x.status === 'pending') t.buoc.push(buoc({ khoa: kp, ten: tenP, trangThai: 'cho', chiTiet: 'chờ GVCN xác nhận', ...giu, cha: khoa }));
          continue;
        }
        const vm: ViecBuoc = { loai: 'meeting', id: r.id };
        t.buoc.push(r.tt === 'mo'
          ? buoc({ khoa: kp, ten: tenP, trangThai: 'dang', ...giu, han: r.hanChon ?? hanPhanMeeting(ph, ngayMt(r)), cha: khoa, nd, viec: vm })
          : r.tt === 'xong'
            ? buoc({ khoa: kp, ten: tenP, trangThai: 'xong', chiTiet: r.xongBoi ? null : 'tự xong', nguoi: r.xongTen ?? null, ngay: ngay10(r.xongLuc), cha: khoa, nd,
              ids: [...new Set([...(giu.vai ? [] : giu.ids), ...(r.xongBoi ? [r.xongBoi] : [])])], lam: r.xongBoi ? [r.xongBoi] : [], viec: vm })
            : buoc({ khoa: kp, ten: tenP, trangThai: 'bo', chiTiet: luuTru(x) ? DONG_LUU_TRU : 'GVCN đưa Meeting về Cần xử lý', ...giu, cha: khoa, viec: vm }));
        /* Đọc phần Meeting (`requireDoc` của khối giao việc): người giữ / làm phần · Head / Quản trị / CX của chi nhánh · người theo dõi phần. */
        t.buoc.at(-1)!.docRieng = (p) => t.buoc.find((b) => b.khoa === kp)!.ids.includes(p.userId) || theoDoiTayCua(p).has(`meeting:${r.id}`)
          || p.grants.some((g) => ['manager', 'system_admin', 'cx'].includes(g.roleKey) && (g.branchId === null || g.branchId === (r.cn ?? t.cn)));
      }
    }
    return t;
  });
}

/* ---------------------------------------------------------------- tuyến Tình hình học tập (hai chiều) */

function dungTinhHinh(ids: number[], homNay: string): TuyenNoi[] {
  if (!ids.length) return [];
  const rows = db().prepare(
    `SELECT t.id, t.chieu, t.noi_dung, t.nguoi_gui, gu.full_name AS gui_ten, t.tao_luc, t.han, t.tra_loi, t.tra_loi_boi, tu.full_name AS tra_ten, t.tra_loi_luc, t.trang_thai,
            t.rut_luc, t.rut_boi, t.phu_trach_id, ptu.full_name AS pt_ten, ${EM_COT}, ${BAO_PH_JSON('b.tinh_hinh_id = t.id')} AS bp
       FROM tinh_hinh_hoc_tap t JOIN students s ON s.id = t.student_id LEFT JOIN users tv ON tv.id = s.consultant_user_id LEFT JOIN users gu ON gu.id = t.nguoi_gui
       LEFT JOIN users tu ON tu.id = t.tra_loi_boi LEFT JOIN users ptu ON ptu.id = t.phu_trach_id
      WHERE t.id IN (SELECT value FROM json_each(?1))`,
  ).all(JSON.stringify(ids), homNay) as any[];
  return rows.map((r) => {
    const gv = r.gvcn ? JSON.parse(r.gvcn) as [number, string] : null;
    const tt: TuyenNoi = { loai: 'tinh_hinh', khoa: String(r.id), tieuDe: 'Tình hình học tập', em: { id: r.sid, ten: r.em_ten, lop: r.lop ?? null }, chiXem: !!r.archived_at,
      buoc: [], luc: r.tao_luc, tvv: r.tvv ?? null, cn: r.cn ?? null };
    const gvTvv = r.chieu === 'gv_tvv';
    const rut = r.trang_thai === 'rut';
    tt.buoc.push(buoc({ khoa: 'gui', ten: gvTvv ? 'GV gửi tình hình' : 'TVV hỏi tình hình', trangThai: rut ? 'bo' : 'xong', chiTiet: rut ? (r.rut_boi ? 'Đã rút' : 'Hệ thống rút (Lưu trữ)') : null, nguoi: r.gui_ten ?? null,
      ngay: ngay10(r.tao_luc), ids: [r.nguoi_gui], lam: [r.nguoi_gui], nd: r.noi_dung ?? null }));
    if (rut) return tt;
    if (gvTvv) {
      const bp = ds(r.bp)[0];
      if (bp) tt.buoc.push(...buocBaoPh(tt, bp, { khoa: 'bao_ph', ten: 'Báo PH', tvvTen: r.tvv_ten ?? null }));
      else tt.buoc.push(baoPhCho(tt, { khoa: 'bao_ph', ten: 'Báo PH', sau: 'sau khi GV gửi', tvvTen: r.tvv_ten ?? null }));
      return tt;
    }
    const giu = r.phu_trach_id ? { ids: [r.phu_trach_id], nguoi: r.pt_ten ?? null, vai: false } : gv ? { ids: [gv[0]], nguoi: gv[1], vai: false } : theoVai(head(tt.cn), 'Head chi nhánh');
    const vt: ViecBuoc = { loai: 'tinh_hinh', id: r.id };
    tt.buoc.push(r.trang_thai === 'xong'
      ? buoc({ khoa: 'tra_loi', ten: 'Tình hình học tập', trangThai: 'xong', chiTiet: 'GVCN trả lời', nguoi: r.tra_ten ?? null, ngay: ngay10(r.tra_loi_luc),
        ids: [...new Set([...giu.ids, ...(r.tra_loi_boi ? [r.tra_loi_boi] : [])])], lam: r.tra_loi_boi ? [r.tra_loi_boi] : [], nd: r.tra_loi ?? null, viec: vt })
      : buoc({ khoa: 'tra_loi', ten: 'Tình hình học tập', trangThai: 'dang', chiTiet: 'GVCN trả lời', ...giu, han: r.han ?? null, viec: vt }));
    tt.buoc.at(-1)!.docRieng = (p) => tt.buoc.at(-1)!.ids.includes(p.userId) || theoDoiTayCua(p).has(`tinh_hinh:${r.id}`);
    return tt;
  });
}

/* ---------------------------------------------------------------- tuyến Sửa cấp bậc (N70) */

function dungCapBac(ids: number[], homNay: string): TuyenNoi[] {
  if (!ids.length) return [];
  const rows = db().prepare(
    `SELECT y.id, y.trang_thai, y.nguoi_xin, xu.full_name AS xin_ten, y.nguoi_duyet, du.full_name AS duyet_ten, y.han_duyet, y.tao_luc, y.xu_ly_luc, y.ly_do, y.ly_do_tu_choi, y.du_lieu, ${EM_COT}
       FROM yeu_cau_duyet y JOIN students s ON s.id = y.doi_tuong_id LEFT JOIN users tv ON tv.id = s.consultant_user_id
       LEFT JOIN users xu ON xu.id = y.nguoi_xin LEFT JOIN users du ON du.id = y.nguoi_duyet
      WHERE y.id IN (SELECT value FROM json_each(?1)) AND y.loai = 'sua_khai_bac'`,
  ).all(JSON.stringify(ids), homNay) as any[];
  return rows.map((y) => {
    const d = JSON.parse(y.du_lieu ?? '{}') as { bacCu?: number; bac?: number };
    const t: TuyenNoi = { loai: 'cap_bac', khoa: String(y.id), tieuDe: 'Sửa cấp bậc', em: { id: y.sid, ten: y.em_ten, lop: y.lop ?? null }, chiXem: !!y.archived_at,
      buoc: [], luc: y.tao_luc, tvv: y.tvv ?? null, cn: y.cn ?? null };
    const xin = y.nguoi_xin ? [y.nguoi_xin] : [];
    t.buoc.push(buoc({ khoa: 'sua', ten: 'Sửa cấp bậc', trangThai: 'xong', chiTiet: d.bac != null ? `bậc ${d.bacCu ?? '?'} → ${d.bac}` : null, nguoi: y.xin_ten ?? null,
      ngay: ngay10(y.tao_luc), ids: xin, lam: xin, nd: y.ly_do ?? null }));
    const duyet = y.nguoi_duyet ? [y.nguoi_duyet] : [];
    t.buoc.push(y.trang_thai === 'cho'
      ? buoc({ khoa: 'duyet', ten: 'Head duyệt', trangThai: 'dang', ...theoVai(head(t.cn), 'Head chi nhánh'), han: y.han_duyet ?? null })
      : y.trang_thai === 'tu_choi'
        ? buoc({ khoa: 'duyet', ten: 'Head duyệt', trangThai: 'bo', chiTiet: 'Từ chối', nguoi: y.duyet_ten ?? null, ngay: ngay10(y.xu_ly_luc), ids: duyet, lam: duyet, nd: y.ly_do_tu_choi ?? null })
        : ['duyet', 'tu_dong'].includes(y.trang_thai)
          ? buoc({ khoa: 'duyet', ten: 'Head duyệt', trangThai: 'xong', chiTiet: y.trang_thai === 'tu_dong' ? 'Tự chốt theo GVCN' : 'Đã duyệt', nguoi: y.duyet_ten ?? null,
            ngay: ngay10(y.xu_ly_luc), ids: duyet, lam: duyet })
          : buoc({ khoa: 'duyet', ten: 'Head duyệt', trangThai: 'bo', chiTiet: 'Đã rút', ngay: ngay10(y.xu_ly_luc) }));
    return t;
  });
}

/* ---------------------------------------------------------------- LPB-0 (N73, 4.7): tuyến Chuyển lớp · Đổi GV */

/** Phụ trách chính (quy tắc chung `chinhTuGv`) — tên Head lùi lấy từ danh sách người giữ vai đã đọc (0 câu). */
const chinhTuyen = (gv: string | null, cn: number | null): { id: number; ten: string } | null => {
  const c = chinhTuGv(gv, cn);
  return c ? { id: c.id, ten: c.ten ?? nguoiVai().find((y) => y.u === c.id)?.ten ?? '' } : null;
};
/** Câu con json: việc Nhận thông tin (BPXL) theo điều kiện trên dòng `d` (viec_nhan_tin_dong). */
const NHAN_TIN_JSON = (dk: string) => `json((SELECT json_group_array(json_object('id', v.id, 'tt', v.trang_thai, 'pt', v.phu_trach_id, 'ptTen', pu.full_name, 'nl', v.nguoi_luat,
    'nlTen', nu_.full_name, 'han', COALESCE(v.han_chon, v.han), 'xongBoi', v.xong_boi, 'xongTen', xu_.full_name, 'xongLuc', v.xong_luc, 'boLuc', v.bo_luc))
  FROM viec_nhan_tin v LEFT JOIN users pu ON pu.id = v.phu_trach_id LEFT JOIN users nu_ ON nu_.id = v.nguoi_luat LEFT JOIN users xu_ ON xu_.id = v.xong_boi
  WHERE v.id IN (SELECT d.viec_id FROM viec_nhan_tin_dong d WHERE ${dk} AND COALESCE(d.mau, '') != 'x')))`;
/** Bước "Nhận thông tin (BPXL)" của một việc — một người giữ (N74). */
const buocNhanTin = (n: any, khoa: string): BuocNoi => {
  const viec: ViecBuoc = { loai: 'nhan_tin', id: n.id };
  const giu = n.pt ?? n.nl ?? null;
  if (n.tt === 'xong') return buoc({ khoa, ten: 'Nhận thông tin (BPXL)', trangThai: 'xong', chiTiet: 'Đã xác nhận', nguoi: n.xongTen ?? null, ngay: ngay10(n.xongLuc), viec, cungLuc: true,
    ids: n.xongBoi ? [n.xongBoi] : [], lam: n.xongBoi ? [n.xongBoi] : [] });
  if (n.tt === 'bo') return buoc({ khoa, ten: 'Nhận thông tin (BPXL)', trangThai: 'bo', chiTiet: 'Tự đóng', ngay: ngay10(n.boLuc), viec, cungLuc: true });
  return buoc({ khoa, ten: 'Nhận thông tin (BPXL)', trangThai: 'dang', nguoi: n.ptTen ?? n.nlTen ?? null, ids: giu ? [giu] : [], han: n.han ?? null, viec, cungLuc: true });
};

/** Chuyển lớp (khoá = lệnh): Lệnh → [Bàn giao · Báo PH · Nhận thông tin, cùng lúc] → Vào lớp mới (máy, không chờ ba việc kia). */
function dungChuyenLop(ids: number[], homNay: string): TuyenNoi[] {
  if (!ids.length) return [];
  const rows = db().prepare(
    `SELECT l.id, l.lop_nguon_id, l.lop_dich_id, l.tuan_bat_dau, l.trang_thai, l.nguoi_ra_lenh, l.ngay_ra_lenh, l.tao_luc, l.han_gvcn, l.xac_nhan_boi, l.xac_nhan_luc,
            nu.full_name AS ra_ten, xu.full_name AS xn_ten, cn.code AS nguon, cn.branch_id AS nguon_cn, cd.code AS dich, ${GV_CHINH_SQL('l.lop_nguon_id')} AS gv_nguon,
            ${EM_COT}, ${BAO_PH_JSON('b.lenh_chuyen_id = l.id')} AS bp, ${NHAN_TIN_JSON('d.lenh_id = l.id')} AS nt
       FROM lenh_chuyen_lop l JOIN students s ON s.id = l.student_id LEFT JOIN users tv ON tv.id = s.consultant_user_id LEFT JOIN users nu ON nu.id = l.nguoi_ra_lenh
       LEFT JOIN users xu ON xu.id = l.xac_nhan_boi JOIN classes cn ON cn.id = l.lop_nguon_id LEFT JOIN classes cd ON cd.id = l.lop_dich_id
      WHERE l.id IN (SELECT value FROM json_each(?1))`,
  ).all(JSON.stringify(ids), homNay) as any[];
  return rows.map((r) => {
    const chinh = chinhTuyen(r.gv_nguon, r.nguon_cn ?? null);   // N73 ④: cùng quy tắc với nơi ghi người theo dõi (lienPhongBan), đọc trong câu dựng tuyến
    const t: TuyenNoi = { loai: 'chuyen_lop', khoa: String(r.id), tieuDe: `Chuyển lớp · ${r.nguon}${r.dich ? ` → ${r.dich}` : ''}`, em: { id: r.sid, ten: r.em_ten, lop: r.lop ?? null },
      chiXem: !!r.archived_at, buoc: [], luc: r.tao_luc, tvv: r.tvv ?? null, cn: r.cn ?? null, lop: { id: r.lop_nguon_id, code: r.nguon }, chinh, lo: `${r.lop_nguon_id}:${r.ngay_ra_lenh}` };
    const huy = r.trang_thai === 'huy';
    t.buoc.push(buoc({ khoa: 'lenh', ten: 'Quyết định chuyển lớp', trangThai: huy ? 'bo' : 'xong', chiTiet: huy ? 'Đã huỷ' : null, nguoi: r.ra_ten ?? null, ngay: r.ngay_ra_lenh,
      ids: [r.nguoi_ra_lenh], lam: [r.nguoi_ra_lenh] }));
    if (r.han_gvcn && !huy) {
      const gv = chinh ? [chinh.id] : [];
      t.buoc.push(r.xac_nhan_boi
        ? buoc({ khoa: 'ban_giao', ten: 'Bàn giao', trangThai: 'xong', nguoi: r.xn_ten ?? null, ngay: ngay10(r.xac_nhan_luc), ids: [r.xac_nhan_boi], lam: [r.xac_nhan_boi], cungLuc: true })
        : buoc({ khoa: 'ban_giao', ten: 'Bàn giao', trangThai: 'dang', nguoi: chinh?.ten ?? null, ids: gv, han: r.han_gvcn, cungLuc: true }));
    }
    ds(r.bp).forEach((b, i) => t.buoc.push(...buocBaoPh(t, b, { khoa: `bao_ph:${b.id}`, ten: i ? 'Báo lại PH' : 'Báo PH', tvvTen: r.tvv_ten ?? null }).map((x) => Object.assign(x, { cungLuc: true }))));
    for (const n of ds(r.nt)) t.buoc.push(buocNhanTin(n, `nhan_tin:${n.id}`));
    if (r.lop_dich_id && !huy) {
      t.buoc.push(r.trang_thai === 'da_chuyen'
        ? buoc({ khoa: 'vao_lop', ten: 'Vào lớp mới', trangThai: 'xong', chiTiet: 'Hệ thống tự chuyển', ngay: r.tuan_bat_dau })
        : buoc({ khoa: 'vao_lop', ten: 'Vào lớp mới', trangThai: 'cho', chiTiet: `${tuanLich(r.tuan_bat_dau, homNay)} · hệ thống tự chuyển` }));
    }
    return t;
  });
}

/** Đổi GV (khoá = việc Nhận thông tin · Đổi GV, một lần lưu × lớp): Lưu phân công → [Bàn giao (GV cũ) · Nhận thông tin, cùng lúc]. */
function dungDoiGv(ids: number[], homNay: string): TuyenNoi[] {
  if (!ids.length) return [];
  const rows = db().prepare(
    `SELECT v.id, v.class_id, c.code, c.branch_id AS cn, v.tao_boi, tu.full_name AS tao_ten, v.tao_luc, ${GV_CHINH_SQL('v.class_id')} AS gv, ${NHAN_TIN_JSON('d.viec_id = v.id')} AS nt,
            json((SELECT json_group_array(json_object('id', bg.id, 'tt', bg.trang_thai, 'lam', bg.nguoi_lam, 'lamTen', lu.full_name, 'han', bg.han, 'xongBoi', bg.xong_boi, 'xongTen', bx.full_name,
              'xongLuc', bg.xong_luc)) FROM ban_giao_gv bg LEFT JOIN users lu ON lu.id = bg.nguoi_lam LEFT JOIN users bx ON bx.id = bg.xong_boi
              WHERE bg.id IN (SELECT m.ban_giao_id FROM ban_giao_gv_mon m JOIN viec_nhan_tin_dong d ON d.doi_id = m.doi_id WHERE d.viec_id = v.id))) AS bg
       FROM viec_nhan_tin v JOIN classes c ON c.id = v.class_id LEFT JOIN users tu ON tu.id = v.tao_boi
      WHERE v.id IN (SELECT value FROM json_each(?1)) AND v.loai = 'doi_gv'`,
  ).all(JSON.stringify(ids), homNay) as any[];
  return rows.map((r) => {
    const chinh = chinhTuyen(r.gv, r.cn ?? null);
    const t: TuyenNoi = { loai: 'doi_gv', khoa: String(r.id), tieuDe: `Đổi GV · ${r.code}`, em: null, chiXem: false, buoc: [], luc: r.tao_luc, tvv: null, cn: r.cn ?? null,
      lop: { id: r.class_id, code: r.code }, chinh };
    t.buoc.push(buoc({ khoa: 'luu', ten: 'Lưu phân công', trangThai: 'xong', nguoi: r.tao_ten ?? null, ngay: ngay10(r.tao_luc), ids: r.tao_boi ? [r.tao_boi] : [], lam: r.tao_boi ? [r.tao_boi] : [] }));
    for (const b of ds(r.bg)) {
      const giu = b.lam ? { ids: [b.lam], nguoi: b.lamTen ?? null, vai: false } : theoVai(head(t.cn), 'Head chi nhánh');
      t.buoc.push(b.tt === 'xong'
        ? buoc({ khoa: `ban_giao:${b.id}`, ten: 'Bàn giao', trangThai: 'xong', nguoi: b.xongTen ?? null, ngay: ngay10(b.xongLuc), ids: b.xongBoi ? [b.xongBoi] : [], lam: b.xongBoi ? [b.xongBoi] : [], cungLuc: true })
        : b.tt === 'huy' ? buoc({ khoa: `ban_giao:${b.id}`, ten: 'Bàn giao', trangThai: 'bo', chiTiet: 'Đã huỷ', cungLuc: true })
          : buoc({ khoa: `ban_giao:${b.id}`, ten: 'Bàn giao', trangThai: 'dang', ...giu, han: b.han ?? null, cungLuc: true }));
    }
    for (const n of ds(r.nt)) t.buoc.push(buocNhanTin(n, `nhan_tin:${n.id}`));
    return t;
  });
}

/** Panel Nhận thông tin · Chuyển lớp (lô): chuỗi chấm từng em — một lô cho cả bảng. */
export function tuyenNhanTin(p: Principal, viecId: number): TomTuyen[] {
  const lenh = (db().prepare("SELECT lenh_id FROM viec_nhan_tin_dong WHERE viec_id = ? AND lenh_id IS NOT NULL AND COALESCE(mau, '') != 'x' ORDER BY id").all(viecId) as { lenh_id: number }[])
    .map((r) => ({ loai: 'chuyen_lop' as const, khoa: String(r.lenh_id) }));
  return dungTuyenLo(p, lenh).map(tomTat);
}

/* ---------------------------------------------------------------- quyền (C3) + xuất */

/**
 * PTA rà #2231 P1-1 (như AU-2111 P0-01): quyền THEO TUYẾN (có mặt ở bước, theo dõi việc N58, đọc nội dung riêng của bước) chỉ khi người xem CÒN vai đang hiệu lực
 * ở chi nhánh hiện tại của em (`t.cn`, hoặc vai toàn hệ thống) — như `HOAT_DONG_O` của `laNguoiTheoDoi`. `p.grants` chỉ chứa vai `active` (đọc lại mỗi request) →
 * 0 câu SQL; tài khoản khoá / xoá không có phiên. Quyền xem Ý thức em (`xemYThucHv`) đi đường quyền sẵn có, không qua cổng này.
 */
const conVaiO = (p: Principal, cn: number | null) => p.grants.some((g) => g.branchId === null || g.branchId === cn);

/** Việc người xem theo dõi tay / mặc định (N58, `viec_theo_doi`) — MỘT câu mỗi request; khoá `loai:ref_id`. Chỉ dùng sau cổng `conVaiO` của tuyến. */
const theoDoiTayCua = (p: Principal): Set<string> => nho(`tuyen:td:${p.userId}`, () => new Set((db().prepare(
  `SELECT loai || ':' || ref_id AS k FROM viec_theo_doi WHERE user_id = ? AND loai != 'van_hanh'`).all(p.userId) as { k: string }[]).map((r) => r.k)));

/** Có mặt trong tuyến: giữ / làm / nhận một bước (bước ○ giữ theo VAI cả chi nhánh không tính — P2-6) hoặc theo dõi việc N58 của tuyến; còn vai ở chi nhánh em. */
const coMat = (p: Principal, t: TuyenNoi) => conVaiO(p, t.cn)
  && (t.chinh?.id === p.userId || t.buoc.some((b) => (b.ids.includes(p.userId) && !(b.vai && b.trangThai === 'cho'))
    /* Rà PTA #2266 P2-1: theo dõi việc Nhận thông tin (cả lớp đích, nhiều em) KHÔNG cho thấy tuyến từng em — chỉ người giữ / làm bước / phụ trách chính của chính em đó. */
    || (b.viec && b.viec.loai !== 'nhan_tin' && theoDoiTayCua(p).has(`${b.viec.loai}:${b.viec.id}`))));
/** C3: khung tuyến — xem được Ý thức em (quyền sẵn có) hoặc có mặt trong tuyến (BPXL chỉ khi có mặt). */
/* LPB-0: tuyến của lớp (Đổi GV) — người xem được lớp (Head / GV lớp / BPXL) thấy khung. */
const xemKhung = (p: Principal, t: TuyenNoi) => (t.em ? xemYThucHv(p, t.em.id) : !!t.lop && (can(p, PERMISSIONS.STUDENT_VIEW, { classId: t.lop.id }) || p.roleKeys.includes('scheduler')))
  || coMat(p, t);

function xuat(p: Principal, t: TuyenNoi): Tuyen {
  const xemEm = t.em ? xemYThucHv(p, t.em.id) : false;
  const hd = conVaiO(p, t.cn);
  const buocRa: BuocTuyen[] = t.buoc.map((b) => {
    const co = !!b.nd?.trim() || !!b.ndEm;
    const nd = [b.nd?.trim() ? b.nd : null, xemEm ? b.ndEm : null].filter(Boolean).join('\n');
    const duoc = !!nd && (xemEm || (hd && (b.docRieng ? b.docRieng(p) : b.ids.includes(p.userId))));
    const { ids: _i, lam: _l, nd: _n, ndEm: _e, docRieng: _d, vai: _v, ...goc } = b;
    return { ...goc, laToi: b.ids.includes(p.userId) && (b.trangThai === 'dang' || b.trangThai === 'tam_dung' || b.trangThai === 'cho' || b.lam.includes(p.userId)),
      coNoiDung: duoc, khongQuyen: co && !duoc, ...(duoc ? { noiDung: nd! } : {}) };
  });
  const dang = t.buoc.filter((b) => b.trangThai === 'dang' || b.trangThai === 'tam_dung');
  const cuaToi = dang.find((b) => b.ids.includes(p.userId));
  const dau = cuaToi ?? (dang.length === 1 ? dang[0] : null);
  const ketThuc = !t.buoc.some((b) => b.trangThai === 'dang' || b.trangThai === 'tam_dung' || b.trangThai === 'cho');
  return {
    loai: t.loai, khoa: t.khoa, tieuDe: t.tieuDe, em: t.em, lop: t.lop ?? null, phuTrachChinh: t.chinh?.ten ?? null, chiXem: t.chiXem, buoc: buocRa,
    xong: t.buoc.filter((b) => b.trangThai === 'xong').length, tong: t.buoc.length, soDang: dang.length,
    dangO: dau ? { ten: dau.ten, nguoi: dau.nguoi, han: dau.han } : dang.length ? { ten: `${dang.length} bước cùng lúc`, nguoi: null, han: null } : null,
    ketThuc, ketThucLuc: ketThuc ? t.buoc.map((b) => b.ngay).filter((x): x is string => !!x).sort().at(-1) ?? null : null,
    ...(t.loai === 'vi_pham' && t.khoa.startsWith('em') ? { head: head(t.cn)[0]?.ten ?? null } : {}),
  };
}

/** Khoá tuyến `loai:khoa`. */
export type KhoaTuyen = { loai: LoaiTuyen; khoa: string };
export function docKhoaTuyen(loai: unknown, khoa: unknown): KhoaTuyen {
  const l = String(loai ?? '');
  const k = String(khoa ?? '');
  if (!(LOAI_TUYEN as readonly string[]).includes(l)) throw badRequest('Loại tuyến không hợp lệ.');
  if (!(/^[1-9]\d{0,9}$/.test(k) || (l === 'vi_pham' && /^em[1-9]\d{0,9}$/.test(k)))) throw badRequest('Tuyến không hợp lệ.');
  return { loai: l as LoaiTuyen, khoa: k };
}

/** Dựng theo LÔ (thứ tự kết quả theo `keys`, khoá không có dữ liệu bị bỏ) — số câu không theo số tuyến. Chưa lọc quyền. */
function dungLo(keys: readonly KhoaTuyen[]): TuyenNoi[] {
  if (!keys.length) return [];
  const homNay = demoToday();
  const so = (l: LoaiTuyen) => [...new Set(keys.filter((k) => k.loai === l && !k.khoa.startsWith('em')).map((k) => Number(k.khoa)))];
  const em = [...new Set(keys.filter((k) => k.khoa.startsWith('em')).map((k) => Number(k.khoa.slice(2))))];
  const tat = [...dungViPham(so('vi_pham'), homNay), ...dungChoXuLy(em, homNay), ...dungPhoiHop(so('phoi_hop'), homNay), ...dungTinhHinh(so('tinh_hinh'), homNay), ...dungCapBac(so('cap_bac'), homNay),
    ...dungChuyenLop(so('chuyen_lop'), homNay), ...dungDoiGv(so('doi_gv'), homNay)];   // LPB-0
  napTruocPhamVi(tat.flatMap((t) => (t.em ? [t.em.id] : [])));   // `xemYThucHv` từng em đọc bộ nhớ — không N+1
  const theo = new Map(tat.map((t) => [`${t.loai}:${t.khoa}`, t]));
  return keys.map((k) => theo.get(`${k.loai}:${k.khoa}`)).filter((t): t is TuyenNoi => !!t);
}

/** Tuyến người xem được (C3) — lô; tuyến ngoài quyền bị bỏ (đường panel: trường `tuyen` null). */
export function dungTuyenLo(p: Principal, keys: readonly KhoaTuyen[]): Tuyen[] {
  return dungLo(keys).filter((t) => xemKhung(p, t)).map((t) => xuat(p, t));
}

/**
 * `GET /tuyen/:loai/:khoa` — Đang theo dõi, Chờ duyệt mở dòng. PTA rà #2231 P2-10: không có tuyến và ngoài quyền cùng MỘT mã 404, cùng chữ
 * (không đoán được em có đang bị xử lý vi phạm / có lượt SOS hay không).
 */
export function dungTuyen(p: Principal, k: KhoaTuyen): Tuyen {
  const t = dungLo([k])[0];
  if (!t || !xemKhung(p, t)) throw notFound('Không tìm thấy tuyến việc.');
  return xuat(p, t);
}

/* ---------------------------------------------------------------- tìm tuyến của một việc (đường panel thêm trường `tuyen`) */

/** Khoá tuyến của một việc có dòng lưu (khối giao việc / panel) — MỘT câu; không thuộc tuyến nào → null. */
export function khoaCuaViec(loai: ViecBuoc['loai'], id: number): KhoaTuyen | null {
  if (loai === 'xu_ly') return { loai: 'vi_pham', khoa: `em${id}` };   // BAOPH-0: id việc = id em
  if (loai === 'da_thuc_hien') return { loai: 'vi_pham', khoa: String(id) };
  const sql: Record<Exclude<typeof loai, 'xu_ly' | 'da_thuc_hien'>, string> = {
    /* LPB-0: Báo PH · Chuyển lớp → tuyến của lệnh (việc gộp Kết quả Final giữ tuyến Phối hợp). */
    bao_ph: `SELECT CASE WHEN measure_id IS NOT NULL OR bao_lai_cua IS NOT NULL THEN 'vi_pham' WHEN phoi_hop_id IS NOT NULL THEN 'phoi_hop' WHEN tinh_hinh_id IS NOT NULL THEN 'tinh_hinh'
          WHEN lenh_chuyen_id IS NOT NULL THEN 'chuyen_lop' END AS l,
        COALESCE(measure_id, bao_lai_cua, (SELECT x.attempt_id FROM sos_coordination_actions x WHERE x.id = viec_bao_ph.phoi_hop_id), tinh_hinh_id, lenh_chuyen_id) AS k FROM viec_bao_ph WHERE id = ?`,
    /* LPB-0: Nhận thông tin · Đổi GV = một tuyến (khoá = id việc); · Chuyển lớp gom nhiều em (mỗi em một tuyến — panel đọc `tuyenNhanTin`). */
    nhan_tin: `SELECT CASE WHEN loai = 'doi_gv' THEN 'doi_gv' END AS l, id AS k FROM viec_nhan_tin WHERE id = ?`,
    phoi_hop: `SELECT 'phoi_hop' AS l, attempt_id AS k FROM sos_coordination_actions WHERE id = ?`,
    meeting: `SELECT 'phoi_hop' AS l, x.attempt_id AS k FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id WHERE mp.id = ?`,
    tinh_hinh: `SELECT 'tinh_hinh' AS l, id AS k FROM tinh_hinh_hoc_tap WHERE id = ?`,
    /* Trả lại một vi phạm → lần xử lý MỚI NHẤT chứa vi phạm đó (Báo PH đang mở — chỉ khi đó mới trả được). */
    tra_lai: `SELECT 'vi_pham' AS l, COALESCE(t.measure_id, ${XL_CUA_VI_PHAM('t.violation_id')}) AS k FROM vi_pham_tra_lai t WHERE t.id = ?`,
  };
  const r = db().prepare(sql[loai]).get(id) as { l: LoaiTuyen | null; k: number | null } | undefined;
  return r?.l && r.k ? { loai: r.l, khoa: String(r.k) } : null;
}
/** Câu con: lần xử lý mới nhất (không nháp) chứa vi phạm `v` — tuyến của yêu cầu trả lại một vi phạm. */
const XL_CUA_VI_PHAM = (v: string) => `(SELECT MAX(mv.measure_id) FROM measure_violations mv JOIN discipline_measures m_ ON m_.id = mv.measure_id
  WHERE mv.violation_id = ${v} AND m_.status != 'nhap')`;

/** Trường `tuyen` của đường panel — tuyến ngoài quyền → null (không lộ khung). `k` đã biết (panel đọc sẵn) thì 0 câu tìm khoá (P2-9). */
export const tuyenTheoKhoa = (p: Principal, k: KhoaTuyen | null): Tuyen | null => (k ? dungTuyenLo(p, [k])[0] ?? null : null);
export const tuyenCuaViec = (p: Principal, loai: ViecBuoc['loai'], id: number): Tuyen | null => tuyenTheoKhoa(p, khoaCuaViec(loai, id));
/** Khoá tuyến từ panel Báo PH đã đọc (`xemViecBaoPh`): lần xử lý / báo lại / tình hình đọc thẳng; việc sau Phối hợp cần lượt → một câu. */
export function khoaBaoPh(v: { id: number; measureId: number | null; tinhHinhId: number | null; phoiHopId: number | null; boiCanh?: { xuLyId?: number | null }; chuyenLop?: { lenhId: number } | null }): KhoaTuyen | null {
  const xl = v.measureId ?? v.boiCanh?.xuLyId ?? null;
  if (xl) return { loai: 'vi_pham', khoa: String(xl) };
  if (v.tinhHinhId) return { loai: 'tinh_hinh', khoa: String(v.tinhHinhId) };
  if (!v.phoiHopId && v.chuyenLop) return { loai: 'chuyen_lop', khoa: String(v.chuyenLop.lenhId) };   // LPB-0
  return v.phoiHopId ? khoaCuaViec('phoi_hop', v.phoiHopId) : null;
}

/** Chuỗi chấm (bảng nhiều em, hồ sơ): tóm tắt một tuyến — cùng hàm dựng, không câu riêng. */
export type TomTuyen = Pick<Tuyen, 'loai' | 'khoa' | 'tieuDe' | 'xong' | 'tong' | 'soDang' | 'dangO' | 'ketThuc'> & { em: number | null; chuoi: TrangThaiBuoc[] };
export const tomTat = (t: Tuyen): TomTuyen => ({ loai: t.loai, khoa: t.khoa, tieuDe: t.tieuDe, em: t.em?.id ?? null, xong: t.xong, tong: t.tong, soDang: t.soDang, dangO: t.dangO,
  ketThuc: t.ketThuc, chuoi: t.buoc.map((b) => b.trangThai) });

/**
 * Hồ sơ HV › Ý thức & Phối hợp (+ panel Xử lý vi phạm): tuyến "đang chờ xử lý" đầy đủ + chuỗi chấm mọi tuyến của em (lần xử lý, lượt Phối hợp, tình hình,
 * sửa cấp bậc). MỘT câu tìm khoá + câu dựng theo loại.
 */
export function tuyenCuaEm(p: Principal, sid: number): { tuyen: Tuyen | null; chuoiTuyen: TomTuyen[] } {
  const keys = (db().prepare(`SELECT 'vi_pham' AS l, id AS k FROM discipline_measures WHERE student_id = ?1 AND status != 'nhap'
      UNION ALL SELECT DISTINCT 'phoi_hop', attempt_id FROM sos_coordination_actions WHERE student_id = ?1
      UNION ALL SELECT 'tinh_hinh', id FROM tinh_hinh_hoc_tap WHERE student_id = ?1
      UNION ALL SELECT 'cap_bac', id FROM yeu_cau_duyet WHERE loai = 'sua_khai_bac' AND doi_tuong_id = ?1`).all(sid) as { l: LoaiTuyen; k: number }[])
    .map((r) => ({ loai: r.l, khoa: String(r.k) }));
  const ra = dungTuyenLo(p, [{ loai: 'vi_pham', khoa: `em${sid}` }, ...keys]);
  const cho = ra.find((t) => t.khoa === `em${sid}`) ?? null;
  return { tuyen: cho, chuoiTuyen: ra.map(tomTat) };
}

/** Bảng nhiều em (Phối hợp SOS lớp / em): chuỗi chấm theo lượt — một lô cho cả bảng. */
export const chuoiPhoiHop = (p: Principal, attemptIds: readonly number[]): Record<number, TomTuyen> =>
  Object.fromEntries(dungTuyenLo(p, [...new Set(attemptIds)].map((id) => ({ loai: 'phoi_hop' as const, khoa: String(id) }))).map((t) => [Number(t.khoa), tomTat(t)]));

/* ---------------------------------------------------------------- theo dõi theo tuyến (C1) */

const NGAY_BUOC = 60;
/**
 * MỘT câu: (a) bước người xem đã làm — cột người làm của bảng nguồn (chỉ mục người làm; hai nhánh `yeu_cau_duyet` đi chỉ mục một phần theo `loai`), `luc` = mốc
 * hành động của CHÍNH người đó (PTA rà #2231 P1-2: không `updated_at` — người khác làm bước sau không làm tuyến đã bỏ hiện lại) · (b) việc N58 người xem theo
 * dõi — chỉ việc còn mở hoặc đóng trong 7 ngày (P2-8). `?1` người · `?2` mốc 60 ngày · `?3` mốc 7 ngày.
 * ponytail: bước làm quá 60 ngày mà tuyến còn mở thì rơi khỏi tab (người theo dõi việc N58 vẫn thấy) — nới cửa sổ nếu chủ SP cần.
 */
export const SQL_TUYEN_THEO_DOI = `SELECT 'vi_pham' AS l, m.id AS k, m.created_at AS luc, 'lam' AS nguon, NULL AS viec FROM discipline_measures m
       WHERE m.created_by = ?1 AND m.status != 'nhap' AND m.created_at >= ?2
     UNION ALL SELECT 'vi_pham', y.doi_tuong_id, y.xu_ly_luc, 'lam', NULL FROM yeu_cau_duyet y
       WHERE y.nguoi_duyet = ?1 AND y.loai IN ('y_thuc', 'thu_hoi_y_thuc') AND y.doi_tuong_loai = 'discipline_measure' AND COALESCE(y.xu_ly_luc, y.tao_luc) >= ?2
     UNION ALL SELECT 'vi_pham', y.doi_tuong_id, y.tao_luc, 'lam', NULL FROM yeu_cau_duyet y
       WHERE y.loai = 'thu_hoi_y_thuc' AND y.nguoi_xin = ?1 AND COALESCE(y.xu_ly_luc, y.tao_luc) >= ?2
     UNION ALL SELECT 'vi_pham', COALESCE(t.measure_id, ${XL_CUA_VI_PHAM('t.violation_id')}), t.xong_luc, 'lam', NULL
       FROM vi_pham_tra_lai t WHERE t.xong_boi = ?1 AND t.xong_luc >= ?2
     UNION ALL SELECT 'phoi_hop', x.attempt_id, x.performed_on, 'lam', NULL FROM sos_coordination_actions x WHERE x.performed_by = ?1 AND x.status = 'done' AND x.performed_on >= ?2
     UNION ALL SELECT 'phoi_hop', x.attempt_id, mp.xong_luc, 'lam', NULL FROM meeting_phan mp JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id
       WHERE mp.xong_boi = ?1 AND mp.xong_luc >= ?2
     UNION ALL SELECT 'tinh_hinh', t.id, t.tao_luc, 'lam', NULL FROM tinh_hinh_hoc_tap t WHERE t.nguoi_gui = ?1 AND t.tao_luc >= ?2
     UNION ALL SELECT 'cap_bac', y.id, y.tao_luc, 'lam', NULL FROM yeu_cau_duyet y WHERE y.loai = 'sua_khai_bac' AND y.nguoi_xin = ?1 AND COALESCE(y.xu_ly_luc, y.tao_luc) >= ?2
     UNION ALL SELECT 'cap_bac', y.id, y.xu_ly_luc, 'lam', NULL FROM yeu_cau_duyet y WHERE y.nguoi_duyet = ?1 AND y.loai = 'sua_khai_bac' AND COALESCE(y.xu_ly_luc, y.tao_luc) >= ?2
     UNION ALL SELECT CASE WHEN b.measure_id IS NOT NULL OR b.bao_lai_cua IS NOT NULL THEN 'vi_pham' WHEN b.phoi_hop_id IS NOT NULL THEN 'phoi_hop'
           WHEN b.tinh_hinh_id IS NOT NULL THEN 'tinh_hinh' ELSE 'chuyen_lop' END,
         COALESCE(b.measure_id, b.bao_lai_cua, (SELECT x.attempt_id FROM sos_coordination_actions x WHERE x.id = b.phoi_hop_id), b.tinh_hinh_id, b.lenh_chuyen_id), t.luc, t.nguon, 'bao_ph:' || b.id
       FROM viec_theo_doi t JOIN viec_bao_ph b ON b.id = t.ref_id WHERE t.user_id = ?1 AND t.loai = 'bao_ph'
         AND (b.trang_thai = 'mo' OR COALESCE(b.bo_luc, (SELECT MAX(l.ghi_luc) FROM viec_bao_ph_lan l WHERE l.viec_id = b.id), b.tao_luc) >= ?3)
     UNION ALL SELECT 'phoi_hop', x.attempt_id, t.luc, t.nguon, 'phoi_hop:' || x.id FROM viec_theo_doi t JOIN sos_coordination_actions x ON x.id = t.ref_id
       WHERE t.user_id = ?1 AND t.loai = 'phoi_hop' AND (x.status = 'pending' OR x.updated_at >= ?3)
     UNION ALL SELECT 'phoi_hop', x.attempt_id, t.luc, t.nguon, 'meeting:' || mp.id FROM viec_theo_doi t JOIN meeting_phan mp ON mp.id = t.ref_id
         JOIN sos_coordination_actions x ON x.id = mp.phoi_hop_id WHERE t.user_id = ?1 AND t.loai = 'meeting' AND (mp.trang_thai = 'mo' OR mp.xong_luc >= ?3)
     UNION ALL SELECT 'tinh_hinh', th.id, t.luc, t.nguon, 'tinh_hinh:' || th.id FROM viec_theo_doi t JOIN tinh_hinh_hoc_tap th ON th.id = t.ref_id
       WHERE t.user_id = ?1 AND t.loai = 'tinh_hinh' AND (th.trang_thai = 'mo' OR COALESCE(th.tra_loi_luc, th.rut_luc) >= ?3)
     UNION ALL SELECT 'vi_pham', COALESCE(tl.measure_id, ${XL_CUA_VI_PHAM('tl.violation_id')}), t.luc, t.nguon, 'tra_lai:' || tl.id
       FROM viec_theo_doi t JOIN vi_pham_tra_lai tl ON tl.id = t.ref_id WHERE t.user_id = ?1 AND t.loai = 'tra_lai' AND (tl.trang_thai = 'mo' OR tl.xong_luc >= ?3)
     UNION ALL SELECT 'vi_pham', 'em' || xl.id, t.luc, t.nguon, 'xu_ly:' || xl.id FROM viec_theo_doi t JOIN viec_xu_ly xl ON xl.id = t.ref_id
       WHERE t.user_id = ?1 AND t.loai = 'xu_ly' AND xl.trang_thai = 'mo'
     UNION ALL SELECT 'vi_pham', m.id, t.luc, t.nguon, 'da_thuc_hien:' || m.id FROM viec_theo_doi t JOIN discipline_measures m ON m.id = t.ref_id
       WHERE t.user_id = ?1 AND t.loai = 'da_thuc_hien' AND (m.status = 'da_duyet' OR COALESCE(m.updated_at, m.created_at) >= ?3)
     /* LPB-0 (N73 ④, 4.7): BPXL đã xác nhận · người theo dõi việc Nhận thông tin — người ra lệnh / người lưu phân công / phụ trách chính (GVCN lớp → Head) là người
        theo dõi mặc định của việc đó (đi vế viec_theo_doi, không thêm vế; tối đa 20 vế UNION — Turso). */
     UNION ALL SELECT CASE v.loai WHEN 'doi_gv' THEN 'doi_gv' ELSE 'chuyen_lop' END, CASE v.loai WHEN 'doi_gv' THEN v.id ELSE d.lenh_id END, v.xong_luc, 'lam', NULL
       FROM viec_nhan_tin v JOIN viec_nhan_tin_dong d ON d.viec_id = v.id AND COALESCE(d.mau, '') != 'x' WHERE v.xong_boi = ?1 AND v.xong_luc >= ?2
     UNION ALL SELECT CASE v.loai WHEN 'doi_gv' THEN 'doi_gv' ELSE 'chuyen_lop' END, CASE v.loai WHEN 'doi_gv' THEN v.id ELSE d.lenh_id END, t.luc, t.nguon, 'nhan_tin:' || v.id
       FROM viec_theo_doi t JOIN viec_nhan_tin v ON v.id = t.ref_id JOIN viec_nhan_tin_dong d ON d.viec_id = v.id AND COALESCE(d.mau, '') != 'x'
       WHERE t.user_id = ?1 AND t.loai = 'nhan_tin' AND (v.trang_thai = 'mo' OR COALESCE(v.xong_luc, v.bo_luc) >= ?3)`;

type TheoDoiTho = { k: KhoaTuyen; lam: string | null; tay: string | null; viec: string[] };
function tuyenTheoDoi(p: Principal): TheoDoiTho[] {
  /* Cột thời gian nơi ghi giờ thật, nơi ghi ngày nghiệp vụ — lấy mốc sớm hơn của hai (bản chính hai mốc trùng). */
  const goc = [demoToday(), new Date().toISOString().slice(0, 10)].sort()[0];
  const rows = db().prepare(SQL_TUYEN_THEO_DOI).all(p.userId, addDaysIso(goc, -NGAY_BUOC), addDaysIso(goc, -7)) as { l: LoaiTuyen; k: number | string | null; luc: string | null; nguon: string; viec: string | null }[];
  const gom = new Map<string, TheoDoiTho>();
  const moi = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);
  for (const r of rows) {
    if (r.k == null) continue;
    const key = `${r.l}:${r.k}`;
    const g = gom.get(key) ?? gom.set(key, { k: { loai: r.l, khoa: String(r.k) }, lam: null, tay: null, viec: [] }).get(key)!;
    /* Theo dõi tay (`tay`) thêm SAU lần bỏ theo dõi tuyến thì hiện lại; theo dõi mặc định (`gvcn`, `head`…) theo việc mới sinh thì không (đặc tả 4.5). */
    if (r.nguon === 'lam') g.lam = moi(g.lam, r.luc);
    else { if (r.nguon === 'tay') g.tay = moi(g.tay, r.luc); if (r.viec) g.viec.push(r.viec); }
  }
  return [...gom.values()];
}

/** Bảng "đã bỏ theo dõi tuyến" (migrate `prTuyen0`, `schema.sql`). */
export const BANG_BO_THEO_DOI_TUYEN = `CREATE TABLE IF NOT EXISTS tuyen_bo_theo_doi (
  loai TEXT NOT NULL, khoa TEXT NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id), luc TEXT NOT NULL,
  PRIMARY KEY (user_id, loai, khoa)
)`;
/** Lần bỏ theo dõi của người xem. P2-7: DB chưa migrate (chưa có bảng) → như chưa bỏ, đường đọc không 500. */
function lanBo(p: Principal): Map<string, string> {
  try {
    return new Map((db().prepare(`SELECT loai || ':' || khoa AS k, luc FROM tuyen_bo_theo_doi WHERE user_id = ?`).all(p.userId) as { k: string; luc: string }[]).map((r) => [r.k, r.luc]));
  } catch (e) {
    if (/no such table/i.test(String((e as Error)?.message))) return new Map();
    throw e;
  }
}

export type DongTheoDoiTuyen = {
  loai: LoaiTuyen; khoa: string; tieuDe: string; studentId: number | null; studentName: string | null; classCode: string | null;
  /** "Đang ở {bước} · {người}" hoặc "Xong {ngày}". */ nhan: string; han: string | null; quaHan: boolean; ketThuc: boolean; ketThucLuc: string | null;
  chuoi: TrangThaiBuoc[];
  /** Việc N58 của tuyến mà người xem đang theo dõi (`loai:refId`) — gom vào dòng tuyến; web bỏ các dòng này khỏi `nhom`. */ viec: string[];
  /** LPB-0 (4.7): Chuyển lớp — MỘT dòng mỗi lô (lớp nguồn × ngày ra lệnh): khoá các tuyến em (mở ra chuỗi chấm từng em). */ khoaLo?: string[];
  lo?: string; chuaBaoPh?: boolean;
};

/** LPB-0 (4.7): gom tuyến Chuyển lớp cùng lô thành một dòng "Chuyển lớp · {lớp cũ} · n em · còn k em chưa báo PH" — danh sách không dài theo số em. */
function gopLo(ra: DongTheoDoiTuyen[]): DongTheoDoiTuyen[] {
  const lo = new Map<string, DongTheoDoiTuyen[]>();
  const out: DongTheoDoiTuyen[] = [];
  for (const d of ra) {
    if (d.loai !== 'chuyen_lop' || !d.lo) { out.push(d); continue; }
    (lo.get(d.lo) ?? lo.set(d.lo, []).get(d.lo)!).push(d);
  }
  for (const ds of lo.values()) {
    if (ds.length === 1) { out.push(ds[0]); continue; }
    const conBao = ds.filter((d) => d.chuaBaoPh).length;
    const ketThuc = ds.every((d) => d.ketThuc);
    const han = ds.map((d) => d.han).filter((h): h is string => !!h).sort()[0] ?? null;
    out.push({ ...ds[0], tieuDe: `${ds[0].tieuDe.split(' → ')[0]} · ${ds.length} em`, studentId: null, studentName: null,
      nhan: ketThuc ? ds[0].nhan : conBao ? `còn ${conBao} em chưa báo PH` : `${ds.filter((d) => !d.ketThuc).length} em đang chuyển`,
      han, quaHan: ds.some((d) => d.quaHan), ketThuc, ketThucLuc: ketThuc ? ds.map((d) => d.ketThucLuc ?? '').sort().at(-1) || null : null,
      chuoi: ds.flatMap((d) => d.chuoi), viec: ds.flatMap((d) => d.viec), khoaLo: ds.map((d) => d.khoa) });
  }
  return out;
}

/**
 * Tab Đang theo dõi (N72 ①): MỘT dòng một tuyến — tuyến còn mở hoặc xong trong 7 ngày; bỏ tuyến mà người xem đang giữ bước đang ở (đã ở "Của tôi").
 * Theo dõi khi đã làm một bước lúc tuyến CÒN MỞ (P2-3 — người làm bước kết thúc tuyến không theo dõi). Tuyến đã "Bỏ theo dõi" lọc TRƯỚC khi dựng (P2-8);
 * `an` = khoá việc N58 của các tuyến đó — đường lọc khỏi `nhom` (P1-3). Theo dõi suy ra không là quyền đọc: ngoài quyền (C3) thì bỏ.
 */
export function theoDoiTuyen(p: Principal): { tuyen: DongTheoDoiTuyen[]; an: Set<string> } {
  const an = new Set<string>();
  const ds0 = tuyenTheoDoi(p);
  if (!ds0.length) return { tuyen: [], an };
  const bo = lanBo(p);
  const con = ds0.filter((d) => {
    const boLuc = bo.get(`${d.k.loai}:${d.k.khoa}`);
    /* "Bỏ theo dõi" thắng cho tới khi CHÍNH người đó làm thêm bước / theo dõi tay sau lần bỏ. */
    if (!boLuc || (d.lam && d.lam > boLuc) || (d.tay && d.tay > boLuc)) return true;
    for (const v of d.viec) an.add(v);
    return false;
  });
  const theo = new Map(con.map((d) => [`${d.k.loai}:${d.k.khoa}`, d]));
  const homNay = demoToday();
  const tu = addDaysIso(homNay, -7);   // ngày bước (ngày nghiệp vụ) — như "Vừa xong 7 ngày"
  const ra: DongTheoDoiTuyen[] = [];
  for (const t of dungLo(con.map((d) => d.k))) {
    const d = theo.get(`${t.loai}:${t.khoa}`)!;
    if (!xemKhung(p, t)) continue;
    const x = xuat(p, t);
    const lam = t.buoc.filter((b) => b.lam.includes(p.userId));
    const lamKhiMo = !!d.lam && lam.length > 0 && (!x.ketThuc || lam.some((b) => (b.ngay ?? '') < (x.ketThucLuc ?? '')));
    if (!lamKhiMo && !d.viec.length) continue;
    if (x.ketThuc ? (x.ketThucLuc ?? '') < tu : t.buoc.some((b) => (b.trangThai === 'dang' || b.trangThai === 'tam_dung') && b.ids.includes(p.userId))) continue;
    const dang = t.buoc.filter((b) => b.trangThai === 'dang');
    const han = dang.map((b) => b.han).filter((h): h is string => !!h).sort()[0] ?? null;
    ra.push({ loai: t.loai, khoa: t.khoa, tieuDe: t.tieuDe, studentId: t.em?.id ?? null, studentName: t.em?.ten ?? null, classCode: t.em?.lop ?? t.lop?.code ?? null,
      nhan: x.ketThuc ? `Xong${x.ketThucLuc ? ` ${x.ketThucLuc.slice(8, 10)}/${x.ketThucLuc.slice(5, 7)}/${x.ketThucLuc.slice(0, 4)}` : ''}`
        : x.dangO ? `Đang ở ${x.dangO.ten}${x.dangO.nguoi ? ` · ${x.dangO.nguoi}` : ''}` : 'Đang ở —',
      han, quaHan: !!han && han < homNay, ketThuc: x.ketThuc, ketThucLuc: x.ketThucLuc, chuoi: x.buoc.map((b) => b.trangThai), viec: d.viec,
      ...(t.lo ? { lo: t.lo, chuaBaoPh: t.buoc.some((b) => b.khoa.startsWith('bao_ph:') && (b.trangThai === 'dang' || b.trangThai === 'tam_dung')) } : {}) });
  }
  return { an, tuyen: gopLo(ra).sort((a, b) => Number(a.ketThuc) - Number(b.ketThuc) || Number(b.quaHan) - Number(a.quaHan) || (a.han ?? '9999').localeCompare(b.han ?? '9999')) };
}

/** `GET /my-work/theo-doi` (P1-3): `nhom` (việc N58) bỏ việc thuộc tuyến đã "Bỏ theo dõi" + `tuyen` một dòng một tuyến. */
export function voiTuyen<D extends { loai: string; refId: number }, N extends { mo: D[]; vuaXong: D[] }>(p: Principal, v: { nhom: N[] }): { nhom: N[]; tuyen: DongTheoDoiTuyen[] } {
  const { tuyen, an } = theoDoiTuyen(p);
  if (!an.size) return { nhom: v.nhom, tuyen };
  const giu = (d: D) => !an.has(`${d.loai}:${d.refId}`);
  return { tuyen, nhom: v.nhom.map((g) => ({ ...g, mo: g.mo.filter(giu), vuaXong: g.vuaXong.filter(giu) })).filter((g) => g.mo.length || g.vuaXong.length) };
}

/** "Bỏ theo dõi" cả tuyến (chính mình) — tuyến sinh việc mới sau đó không tự thêm lại; làm thêm bước / theo dõi tay thì hiện lại. Hoàn tác = `theoDoiLaiTuyen`. */
export function boTheoDoiTuyen(p: Principal, k: KhoaTuyen): { ok: true } {
  dungTuyen(p, k);   // 404 như xem
  db().prepare(`INSERT INTO tuyen_bo_theo_doi (loai, khoa, user_id, luc) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, loai, khoa) DO UPDATE SET luc = excluded.luc`)
    .run(k.loai, k.khoa, p.userId, nowIso());
  return { ok: true };
}
export function theoDoiLaiTuyen(p: Principal, k: KhoaTuyen): { ok: true } {
  db().prepare('DELETE FROM tuyen_bo_theo_doi WHERE user_id = ? AND loai = ? AND khoa = ?').run(p.userId, k.loai, k.khoa);
  return { ok: true };
}
