/**
 * TRANG TUTOR (TU-b, đặc tả Tutor mục 7, 8) — bảng tutor + panel một tutor, nhận xét / kết luận, thêm / sửa / xoá tutor, gộp tên gõ tay.
 * Quyền: đọc `tutor.view` (Head / CX: chỉ DÒNG có `lop_id` thuộc chi nhánh mình — lớp chụp lúc ghi, mục 12.1; CX chỉ đọc, TU12);
 * nhận xét / kết luận / xoá tutor `tutor.manage` (Head tutor, Quản trị); sửa DANH BẠ (thêm / sửa / tải / gộp) thêm Head — CHỈ chi nhánh mình (`quyenDanhBa`, TU13).
 * Ngày của buổi = ngày nghiệp vụ của lần ghi (`case_followups.observed_on` — ngày demo trên bản demo; rà #1872 C4). Nhóm chú ý = MỘT hàm (`canChuY`) cho bộ lọc, số menu và cột lý do.
 * TU2-5 (chủ SP 19/11): "Buổi" = SUM(so_buoi) (dòng gộp 2 buổi đếm 2); ba tỉ lệ + nhóm chú ý đếm theo LẦN GHI (số dòng) — dòng không trả lời không vào mẫu số;
 * người dạy là GV = dòng `tutors` có `user_id` (`loai: 'gv'`): bảng, nhận xét, kết luận như tutor, nhưng không ai sửa tên / xoá ở trang này.
 */
import { db, theoLo, tx } from '../db.ts';
import { badRequest, forbidden, loi, normalizeName, notFound, nowIso } from '../util.ts';
import { can, scopeFor, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { BoChup, ghiThungRac } from '../platform/thungRac.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';
import { COT_TUTOR_TK, chuanTutor, tutorCuaGv } from '../cases/cases.ts';
import { CHU_TOI_THIEU, KN_TUTOR, PERMISSIONS, chuanSdt, knTutorCuaTopic } from '../../../shared/domain/index.ts';

export type Khoang = { tu: string; den: string };
export type KetLuan = 'on' | 'can_cai_thien' | 'ngung';
const KET_LUAN: readonly string[] = ['on', 'can_cai_thien', 'ngung'];
/** Tỉ lệ một tiêu chí: [số LẦN GHI (dòng) "Có", số lần ghi có trả lời ô đó] — dòng không trả lời (NULL) không vào mẫu. */
export type TyLe = [number, number];
/** `luc` = ngày nghiệp vụ (`case_followups.observed_on`, YYYY-MM-DD — cùng nguồn ngày với bảng / panel sau S1 #1875) của lần ghi gần nhất từng loại; `ids` = id dòng buổi gây chú ý (N56 ⑥: panel mở đúng các dòng này, mọi thời gian). */
export type ChuY = { chuanBi: number; taiLieu: number; feedbackGv: number; sao: number[]; ids: number[]; luc: Record<'chuanBi' | 'taiLieu' | 'feedbackGv' | 'sao', string> };
export type NoiDay = { id: number; ten: string } | 'online' | null;
export type SoTutor = { buoi: number; chuanBi: TyLe; taiLieu: TyLe; feedbackGv: TyLe; danhGia: number | null };
export type DongTutor = SoTutor & {
  id: number; ten: string; sdt: string | null; noiDay: NoiDay; kyNang: string[];
  ketLuan: { kl: KetLuan; luc: string } | null; chuY: string | null; thieu: ('sdt' | 'noiDay')[];
  /** N56 ⑥: ngày VN của lần ghi gần nhất thuộc loại lý do · id các dòng gây chú ý (null / [] khi không chú ý). */
  chuYNgay: string | null; chuYIds: number[];
  /** TU2-5: `gv` = dòng danh bạ của một GV (`gvId` = tài khoản); `suaDuoc` = người xem Sửa được dòng này (Head: tutor chi nhánh mình; dòng GV: không ai). */
  loai: 'gv' | 'tutor'; gvId: number | null; suaDuoc: boolean;
};

/** Phạm vi đọc: `branchIds` null = toàn hệ thống. Không có `tutor.view` → 403. */
function phamVi(p: Principal): { branchIds: number[] | null; sua: boolean; danhBa: QuyenDanhBa | null } {
  const s = scopeFor(p, PERMISSIONS.TUTOR_VIEW);
  if (s.none) throw forbidden('Bạn không có quyền xem trang Tutor.');
  return { branchIds: s.all ? null : s.branchIds, sua: coSua(p), danhBa: quyenDanhBa(p) };
}
/** Nhận xét / kết luận / xoá tutor: Head tutor + Quản trị (`tutor.manage`). */
const coSua = (p: Principal) => can(p, PERMISSIONS.TUTOR_MANAGE, { anyScope: true });
function canSua(p: Principal) {
  if (!coSua(p)) throw forbidden('Bạn không có quyền sửa danh sách tutor.');
}
/**
 * TU13 (chủ SP 19/11): ai sửa DANH BẠ tutor (thêm / sửa / tải danh sách / gộp tên gõ tay). Quản trị + Head tutor (`tutor.manage`) = mọi chi nhánh; Head (vai
 * `manager` có `tutor.view`) = CHỈ chi nhánh của grant (grant không chi nhánh = mọi). CX không có (chỉ đọc, N52). null = không sửa được.
 * Một hàm cho `luuTutor`, `taiLenTutor`, `gopTen`, `tenGoTay` và ô chọn của hộp Gộp (`chon.ts`).
 */
export type QuyenDanhBa = { tatCa: boolean; chiNhanh: number[] };
export function quyenDanhBa(p: Principal): QuyenDanhBa | null {
  if (coSua(p)) return { tatCa: true, chiNhanh: [] };
  const head = p.grants.filter((g) => g.roleKey === 'manager' && g.permissions.has(PERMISSIONS.TUTOR_VIEW));
  if (!head.length) return null;
  if (head.some((g) => g.branchId === null)) return { tatCa: true, chiNhanh: [] };
  return { tatCa: false, chiNhanh: [...new Set(head.map((g) => g.branchId as number))] };
}
export function kiemQuyenDanhBa(p: Principal): QuyenDanhBa {
  const q = quyenDanhBa(p);
  if (!q) throw forbidden('Bạn không có quyền sửa danh sách tutor.');
  return q;
}
/** Dòng `tutors` (có `user_id`, `created_by`, `updated_by`) người xem sửa được: không phải dòng GV; Head: nơi dạy = chi nhánh mình, hoặc Chỉ online do mình tạo / sửa. */
export function suaDuocTutor(q: QuyenDanhBa | null, p: Principal, r: any): boolean {
  if (!q || r.user_id != null) return false;
  if (q.tatCa) return true;
  if (r.noi_day_branch_id != null) return q.chiNhanh.includes(r.noi_day_branch_id);
  return !!r.chi_online && (r.created_by === p.userId || r.updated_by === p.userId);
}
/** Head chỉ đặt nơi dạy = chi nhánh mình hoặc Chỉ online (Thêm / Sửa / Tải danh sách). */
export function noiDayHopLe(q: QuyenDanhBa, s: { noiDayBranchId: number | null; chiOnline: 0 | 1 }): boolean {
  return q.tatCa || s.chiOnline === 1 || (s.noiDayBranchId != null && q.chiNhanh.includes(s.noiDayBranchId));
}
/** Mảnh SQL lọc buổi theo chi nhánh của lớp chụp lúc ghi (alias `b`). */
const locLop = (branchIds: number[] | null) => (branchIds
  ? { sql: ` AND b.lop_id IN (SELECT id FROM classes WHERE branch_id IN (${branchIds.map(() => '?').join(',') || 'NULL'}))`, args: branchIds }
  : { sql: '', args: [] as number[] });
/** Khoá gom tên (bỏ dấu, hoa thường, khoảng trắng) — tên gõ tay và khớp tên khi tải lên. */
export const khoaTen = (s: string) => normalizeName(String(s ?? ''));
const tron1 = (x: number | null) => (x == null ? null : Math.round(x * 10) / 10);

// ---------------------------------------------------------------- Nhóm chú ý

/**
 * Tutor có ≥ 1 buổi (MỌI thời gian) có ô "Không" hoặc đánh giá ≤ 2, ghi SAU nhận xét gần nhất về tutor đó (sửa nhận xét không dời mốc `luc`);
 * kết luận mới nhất "Ngừng hợp tác" → không vào. `branchIds` (QL): chỉ buổi lớp chi nhánh đó. Chỉ đọc buổi "xấu" (ít dòng), nhận xét qua chỉ mục.
 */
/**
 * Câu đọc buổi "xấu": WHERE viết ĐÚNG biểu thức của chỉ mục một phần `idx_followup_buoi_chu_y` (migrate `prTub`) để SQLite dùng chỉ mục, không
 * quét cả bảng buổi (phép kiểm TUB-7 soi EXPLAIN). `tutorId` (panel một tutor): chỉ đọc buổi của tutor đó.
 */
export function cauChuY(branchIds: number[] | null, tutorId?: number): { sql: string; args: number[] } {
  const l = locLop(branchIds);
  return {
    sql: `SELECT b.id, b.tutor_id, b.chuan_bi, b.tai_lieu, b.feedback_gv, b.danh_gia, b.ghi_luc,
            (SELECT f.observed_on FROM case_followups f WHERE f.id = b.followup_id) AS ngay_ghi,
            (SELECT n.ket_luan FROM tutor_nhan_xet n WHERE n.tutor_id = b.tutor_id ORDER BY n.luc DESC, n.id DESC LIMIT 1) AS kl,
            (SELECT MAX(n.luc) FROM tutor_nhan_xet n WHERE n.tutor_id = b.tutor_id) AS moc
       FROM case_followup_buoi b
      WHERE (b.chuan_bi = 0 OR b.tai_lieu = 0 OR b.feedback_gv = 0 OR b.danh_gia <= 2) AND b.tutor_id ${tutorId ? '= ?' : 'IS NOT NULL'}${l.sql}`,
    args: [...(tutorId ? [tutorId] : []), ...l.args],
  };
}
export function canChuY(conn: any, branchIds: number[] | null, tutorId?: number): Map<number, ChuY> {
  const c = cauChuY(branchIds, tutorId);
  const hang = conn.prepare(c.sql).all(...c.args) as any[];
  const m = new Map<number, ChuY>();
  for (const r of hang) {
    if (r.kl === 'ngung' || (r.moc && !(String(r.ghi_luc ?? '') > r.moc))) continue;
    const c = m.get(r.tutor_id) ?? { chuanBi: 0, taiLieu: 0, feedbackGv: 0, sao: [], ids: [], luc: { chuanBi: '', taiLieu: '', feedbackGv: '', sao: '' } };
    const ngay = String(r.ngay_ghi ?? '');
    const ghi = (k: keyof ChuY['luc']) => { if (ngay > c.luc[k]) c.luc[k] = ngay; };
    if (r.chuan_bi === 0) { c.chuanBi++; ghi('chuanBi'); }
    if (r.tai_lieu === 0) { c.taiLieu++; ghi('taiLieu'); }
    if (r.feedback_gv === 0) { c.feedbackGv++; ghi('feedbackGv'); }
    if (r.danh_gia != null && r.danh_gia <= 2) { c.sao.push(r.danh_gia); ghi('sao'); }
    c.ids.push(r.id);
    m.set(r.tutor_id, c);
  }
  return m;
}

/** Câu lý do theo loại nhiều LẦN GHI nhất ("3 lần không gửi feedback cho GV", "1 lần đánh giá 2/5") — đếm theo lần ghi (dòng), không theo số buổi. */
function loaiChinh(c: ChuY): [number, string, keyof ChuY['luc']] {
  const saoMax = Math.max(...c.sao);
  const loai: [number, string, keyof ChuY['luc']][] = [
    [c.chuanBi, 'không chuẩn bị', 'chuanBi'], [c.taiLieu, 'không xin tài liệu đúng hạn', 'taiLieu'], [c.feedbackGv, 'không gửi feedback cho GV', 'feedbackGv'],
    [c.sao.length, c.sao.every((s) => s === saoMax) ? `đánh giá ${saoMax}/5` : `đánh giá ≤ ${saoMax}/5`, 'sao'],
  ];
  return loai.reduce((a, b) => (b[0] > a[0] ? b : a));
}
export function lyDoChuY(c: ChuY): string {
  const [n, chu] = loaiChinh(c);
  return `${n} lần ${chu}`;
}
/** N56 ⑥: ngày (YYYY-MM-DD) lần ghi gần nhất của loại đứng trong câu lý do — web ghi kèm "· 02/09". */
export const ngayChuY = (c: ChuY): string | null => c.luc[loaiChinh(c)[2]] || null;

/** Số "Tutor n" trên menu — chỉ người sửa danh sách (Head tutor, Quản trị; QL không có số). */
export function demChuY(p: Principal): { n: number } {
  canSua(p);
  return { n: canChuY(db(), null).size };
}

// ---------------------------------------------------------------- Bảng + panel

function docTutors(conn: any, id?: number): any[] {
  return (conn.prepare(
    `SELECT t.id, t.sdt, t.chi_online, t.user_id, t.created_by, t.updated_by, ${COT_TUTOR_TK},
            (SELECT n.ket_luan || '|' || n.luc FROM tutor_nhan_xet n WHERE n.tutor_id = t.id ORDER BY n.luc DESC, n.id DESC LIMIT 1) AS kl
       FROM tutors t LEFT JOIN users gu ON gu.id = t.user_id${id ? ' WHERE t.id = ?' : ''}`,
  ).all(...(id ? [id] : [])) as any[]).map(chuanTutor);
}
const docChiNhanh = (conn: any) => new Map((conn.prepare('SELECT id, name FROM branches').all() as any[]).map((b) => [b.id as number, b.name as string]));

function thanhDong(r: any, cn: Map<number, string>, so: SoTutor, chuY: ChuY | undefined, p: Principal, danhBa: QuyenDanhBa | null): DongTutor {
  const [kl, luc] = r.kl ? String(r.kl).split('|') : [];
  const noiDay: NoiDay = r.chi_online ? 'online' : r.noi_day_branch_id ? { id: r.noi_day_branch_id, ten: cn.get(r.noi_day_branch_id) ?? '' } : null;
  const suaDuoc = suaDuocTutor(danhBa, p, r);
  return {
    id: r.id, ten: r.ten, sdt: r.sdt ?? null, noiDay, kyNang: String(r.ky_nang).split(',').filter(Boolean), ...so,
    ketLuan: kl ? { kl: kl as KetLuan, luc } : null, chuY: chuY ? lyDoChuY(chuY) : null,
    chuYNgay: chuY ? ngayChuY(chuY) : null, chuYIds: chuY?.ids ?? [],
    thieu: suaDuoc ? [...(r.sdt ? [] : ['sdt' as const]), ...(noiDay ? [] : ['noiDay' as const])] : [],
    loai: r.user_id != null ? 'gv' : 'tutor', gvId: r.user_id ?? null, suaDuoc,
  };
}
const SO_RONG: SoTutor = { buoi: 0, chuanBi: [0, 0], taiLieu: [0, 0], feedbackGv: [0, 0], danhGia: null };

/**
 * Bảng tutor trong khoảng. Head tutor / Quản trị: mọi tutor. QL: tutor có ≥ 1 buổi em chi nhánh mình trong khoảng (kể cả tutor nơi dạy chi nhánh khác)
 * + tutor nơi dạy = chi nhánh mình (cho "Tất cả"); số chỉ tính buổi chi nhánh mình. Lọc / tìm / phân trang ở web trên danh sách này.
 */
export function bangTutor(p: Principal, k: Khoang) {
  const { branchIds, sua, danhBa } = phamVi(p);
  const conn = db();
  const l = locLop(branchIds);
  // ponytail: đọc mọi buổi có tutor rồi lọc ngày qua case_followups (bảng buổi tutor nhỏ); nâng cấp = chỉ mục case_followups(observed_on) khi bảng lớn.
  /* TU2-5: "Buổi" = SUM(so_buoi) (dòng gộp 2 buổi đếm 2); 3 tỉ lệ đếm theo LẦN GHI (dòng) — COUNT(cột) chỉ đếm dòng có trả lời. */
  const so = new Map<number, SoTutor>((conn.prepare(
    `SELECT b.tutor_id AS id, SUM(b.so_buoi) AS buoi, SUM(b.chuan_bi = 1) AS cb, COUNT(b.chuan_bi) AS cbn, SUM(b.tai_lieu = 1) AS tl, COUNT(b.tai_lieu) AS tln,
            SUM(b.feedback_gv = 1) AS fb, COUNT(b.feedback_gv) AS fbn, AVG(b.danh_gia) AS sao
       FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
      WHERE b.tutor_id IS NOT NULL AND f.observed_on >= ? AND f.observed_on <= ?${l.sql}
      GROUP BY b.tutor_id`,
  ).all(k.tu, k.den, ...l.args) as any[]).map((r) => [r.id, {
    buoi: r.buoi, chuanBi: [r.cb ?? 0, r.cbn], taiLieu: [r.tl ?? 0, r.tln], feedbackGv: [r.fb ?? 0, r.fbn], danhGia: tron1(r.sao),
  }]));
  const cn = docChiNhanh(conn);
  const chuY = canChuY(conn, branchIds);
  const dong = docTutors(conn)
    .filter((r) => !branchIds || so.has(r.id) || chuY.has(r.id) || branchIds.includes(r.noi_day_branch_id))   // chuY: nhóm chú ý tính mọi thời gian
    .map((r) => thanhDong(r, cn, so.get(r.id) ?? SO_RONG, chuY.get(r.id), p, danhBa))
    .sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
  /* Dải "n tên gõ tay · m buổi · Gộp…": người sửa danh bạ — Head chỉ phần buổi lớp chi nhánh mình (TU13). */
  let goTay: { soTen: number; soBuoi: number } | null = null;
  if (danhBa) {
    const lg = locLop(danhBa.tatCa ? null : danhBa.chiNhanh);
    const ten = new Map<string, number>();
    for (const r of conn.prepare(`SELECT b.tutor_ten, SUM(b.so_buoi) AS n FROM case_followup_buoi b WHERE b.tutor_id IS NULL${lg.sql} GROUP BY b.tutor_ten`).all(...lg.args) as any[]) {
      ten.set(khoaTen(r.tutor_ten), (ten.get(khoaTen(r.tutor_ten)) ?? 0) + r.n);
    }
    goTay = { soTen: ten.size, soBuoi: [...ten.values()].reduce((a, b) => a + b, 0) };
  }
  return {
    dong, goTay, coSua: sua,
    /* TU13: Thêm tutor / Tải danh sách / Gộp. `chiNhanhDanhBa` = chi nhánh Head được đặt nơi dạy (null = mọi chi nhánh). */
    coDanhBa: !!danhBa, chiNhanhDanhBa: danhBa && !danhBa.tatCa ? danhBa.chiNhanh.map((id) => ({ id, ten: cn.get(id) ?? '' })) : null,
    chiNhanh: branchIds ? branchIds.map((id) => cn.get(id)).join(', ') : null,
    dsChiNhanh: [...cn].map(([id, ten]) => ({ id, ten })),
  };
}

const knCua = (topic: string | null) => {
  const ks = knTutorCuaTopic(topic);
  return ks.length === 2 && ks[0] === 'W1' ? 'W' : ks.join('/');
};
const coKhong = (v: number | null) => (v == null ? null : v === 1);
const tyLe = (ds: any[], cot: string): TyLe => [ds.filter((b) => b[cot] === 1).length, ds.filter((b) => b[cot] != null).length];
const trong24h = (luc: string) => Date.now() - new Date(luc).getTime() < 24 * 3600_000;

/**
 * Panel một tutor: đầu + 5 ô số + nhận xét (dòng thời gian) + buổi trong khoảng (QL: chỉ buổi chi nhánh mình; ngoài phạm vi → 404).
 * N56 ⑥: `ids` (dòng vào nhóm chú ý, mọi thời gian) → đọc ĐÚNG các dòng đó của tutor này thay cho khoảng — cùng một câu, cùng phạm vi chi nhánh.
 */
export function panelTutor(p: Principal, id: number, k: Khoang, ids?: number[]) {
  const { branchIds, sua, danhBa } = phamVi(p);
  const conn = db();
  const r = docTutors(conn, id)[0];
  const l = locLop(branchIds);
  if (!r || (branchIds && !branchIds.includes(r.noi_day_branch_id)
    && !conn.prepare(`SELECT 1 AS x FROM case_followup_buoi b WHERE b.tutor_id = ?${l.sql} LIMIT 1`).get(id, ...l.args))) {
    throw notFound('Không tìm thấy tutor.');
  }
  const hang = conn.prepare(
    `SELECT b.id, f.observed_on, s.full_name AS hv, c.code AS lop, u.full_name AS nguoi_ghi, sc.topic,
            b.hinh_thuc, b.chuan_bi, b.tai_lieu, b.feedback_gv, b.danh_gia, b.nhan_xet, b.nhan_xet_tutor, b.so_buoi
       FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
       JOIN sos_cases sc ON sc.id = f.case_id LEFT JOIN students s ON s.id = sc.student_id
       LEFT JOIN classes c ON c.id = b.lop_id LEFT JOIN users u ON u.id = f.observer_user_id
      WHERE b.tutor_id = ? AND ${ids ? `b.id IN (${ids.map(() => '?').join(',') || 'NULL'})` : 'f.observed_on >= ? AND f.observed_on <= ?'}${l.sql}
      ORDER BY f.observed_on DESC, f.id DESC, b.buoi_so DESC`,
  ).all(id, ...(ids ?? [k.tu, k.den]), ...l.args) as any[];
  const sao = hang.filter((b) => b.danh_gia != null);
  const so: SoTutor = {
    buoi: hang.reduce((a, b) => a + b.so_buoi, 0), chuanBi: tyLe(hang, 'chuan_bi'), taiLieu: tyLe(hang, 'tai_lieu'), feedbackGv: tyLe(hang, 'feedback_gv'),
    danhGia: sao.length ? tron1(sao.reduce((a, b) => a + b.danh_gia, 0) / sao.length) : null,
  };
  const nhanXet = (conn.prepare(
    `SELECT n.id, n.ket_luan, n.noi_dung, n.luc, n.sua_luc, n.nguoi_id, u.full_name FROM tutor_nhan_xet n LEFT JOIN users u ON u.id = n.nguoi_id
      WHERE n.tutor_id = ? ORDER BY n.luc DESC, n.id DESC`,
  ).all(id) as any[]).map((n) => ({
    id: n.id, kl: n.ket_luan as KetLuan, noiDung: n.noi_dung, luc: n.luc, suaLuc: n.sua_luc ?? null, nguoi: n.full_name ?? '',
    coSua: suaDuocNhanXet(p, n, r),                             // LUAT-34: sửa mọi lúc · R2 C9: + Head tutor / Head chi nhánh nơi dạy
    coXoa: sua && n.nguoi_id === p.userId && trong24h(n.luc),   // xoá trong 24 giờ
  }));
  return {
    tutor: thanhDong(r, docChiNhanh(conn), so, canChuY(conn, branchIds, id).get(id), p, danhBa), so, coSua: sua, coDanhBa: !!danhBa, nhanXet,
    coBuoi: sua ? !!conn.prepare('SELECT 1 AS x FROM case_followup_buoi WHERE tutor_id = ? LIMIT 1').get(id) : true,
    buoi: hang.map((b) => ({
      id: b.id, ngay: b.observed_on, hocVien: b.hv ?? '', lop: b.lop ?? null, nguoiGhi: b.nguoi_ghi ?? null, kn: knCua(b.topic), soBuoi: b.so_buoi,
      hinhThuc: b.hinh_thuc ?? null, chuanBi: coKhong(b.chuan_bi), taiLieu: coKhong(b.tai_lieu), feedbackGv: coKhong(b.feedback_gv),
      danhGia: b.danh_gia ?? null, nhanXet: b.nhan_xet, nhanXetTutor: b.nhan_xet_tutor ?? null,
    })),
  };
}

// ---------------------------------------------------------------- Thêm / sửa / xoá tutor

export type TutorVao = { ten?: unknown; sdt?: unknown; noiDay?: unknown; kyNang?: unknown };
export type TutorSach = { ten: string; sdt: string | null; noiDayBranchId: number | null; chiOnline: 0 | 1; kyNang: string };
export type LoiTutor = Partial<Record<'ten' | 'sdt' | 'noiDay' | 'kyNang', string>>;

/** Một hàm kiểm cho hộp Thêm / Sửa và từng dòng tải lên. Chỉ Tên + Kỹ năng bắt buộc (mục 13.2); SĐT (khi có) không trùng tutor khác. */
export type TraSan = { sdt: Map<string, { id: number; ten: string }>; chiNhanh: Set<number> };
export function kiemTutor(conn: any, v: TutorVao, boQuaId: number | null, tra?: TraSan): { ok: TutorSach } | { loi: LoiTutor } {
  const loi: LoiTutor = {};
  const ten = String(v.ten ?? '').trim();
  if (!ten) loi.ten = 'Nhập tên tutor.';
  else if (ten.length > 100) loi.ten = 'Tên tối đa 100 ký tự.';
  const sdt = chuanSdt(v.sdt);
  if (sdt === false) loi.sdt = 'SĐT cần 9–11 chữ số.';
  else if (sdt) {
    /* `tra` (tải lên): bảng SĐT nạp một lần — không hỏi DB từng dòng. */
    const trung = tra ? tra.sdt.get(sdt) : conn.prepare('SELECT id, ten FROM tutors WHERE sdt = ?').get(sdt) as any;
    if (trung && trung.id !== boQuaId) loi.sdt = `SĐT đã có: ${trung.ten}`;
  }
  let noiDayBranchId: number | null = null;
  const chiOnline = v.noiDay === 'online' ? 1 : 0;
  if (typeof v.noiDay === 'number') {
    if (tra ? tra.chiNhanh.has(v.noiDay) : conn.prepare('SELECT 1 AS x FROM branches WHERE id = ?').get(v.noiDay)) noiDayBranchId = v.noiDay;
    else loi.noiDay = 'Chi nhánh không có.';
  } else if (v.noiDay != null && v.noiDay !== '' && v.noiDay !== 'online') loi.noiDay = 'Nơi dạy không hợp lệ.';
  const kn = Array.isArray(v.kyNang) ? v.kyNang.map(String) : [];
  if (!kn.length) loi.kyNang = 'Chọn ít nhất một kỹ năng.';
  else if (kn.some((x) => !(KN_TUTOR as readonly string[]).includes(x))) loi.kyNang = 'Kỹ năng là L, R, W1, W2, S.';
  if (Object.keys(loi).length) return { loi };
  return { ok: { ten, sdt: sdt || null, noiDayBranchId, chiOnline, kyNang: KN_TUTOR.filter((x) => kn.includes(x)).join(',') } };
}

/** Thêm (không `id`) hoặc sửa một tutor. `trungTen`: đã có tutor khác cùng tên (bỏ dấu) — chỉ nhắc, vẫn lưu. */
export function luuTutor(p: Principal, v: TutorVao, id?: number): { id: number; trungTen: boolean } {
  const q = kiemQuyenDanhBa(p);   // TU13: Head cũng sửa được — chỉ chi nhánh mình
  const conn = db();
  const truoc = id ? conn.prepare('SELECT ten, sdt, noi_day_branch_id, chi_online, ky_nang, user_id, created_by, updated_by FROM tutors WHERE id = ?').get(id) as any : null;
  if (id && !truoc) throw notFound('Không tìm thấy tutor.');
  /* Dòng danh bạ của GV: tên / kỹ năng lấy từ tài khoản — không ai sửa ở trang Tutor (TU2-5). */
  if (truoc?.user_id != null) throw badRequest('Dòng này là tài khoản giáo viên — không sửa ở trang Tutor.');
  if (truoc && !suaDuocTutor(q, p, truoc)) throw forbidden('Tutor này không thuộc chi nhánh của bạn — bạn không sửa được.');
  const k = kiemTutor(conn, v ?? {}, id ?? null);
  if ('loi' in k) throw badRequest(Object.values(k.loi).join(' · '), { loi: k.loi });
  const t = k.ok;
  if (!noiDayHopLe(q, t)) throw forbidden('Nơi dạy chỉ chọn được chi nhánh của bạn hoặc Chỉ online.');
  const luc = nowIso();
  try {
  return tx(() => {
    let ma = id ?? 0;
    if (id) {
      conn.prepare('UPDATE tutors SET ten = ?, sdt = ?, noi_day_branch_id = ?, chi_online = ?, ky_nang = ?, updated_at = ?, updated_by = ? WHERE id = ?')
        .run(t.ten, t.sdt, t.noiDayBranchId, t.chiOnline, t.kyNang, luc, p.userId, id);
    } else {
      ma = Number(conn.prepare('INSERT INTO tutors (ten, sdt, noi_day_branch_id, chi_online, ky_nang, created_at, created_by) VALUES (?,?,?,?,?,?,?)')
        .run(t.ten, t.sdt, t.noiDayBranchId, t.chiOnline, t.kyNang, luc, p.userId).lastInsertRowid);
    }
    writeAudit({ actorUserId: p.userId, action: id ? 'tutor.sua' : 'tutor.them', entityType: 'tutor', entityId: ma, entityLabel: t.ten, before: truoc ?? undefined, after: t });
    const trungTen = (conn.prepare('SELECT COALESCE(gu.full_name, t.ten) AS ten FROM tutors t LEFT JOIN users gu ON gu.id = t.user_id WHERE t.id <> ?').all(ma) as any[]).some((r) => khoaTen(r.ten) === khoaTen(t.ten));
    return { id: ma, trungTen };
  });
  } catch (e) {
    /* Hai người lưu cùng SĐT cùng lúc: chỉ mục UNIQUE chặn người sau — báo tại ô SĐT, không 500. */
    if (t.sdt && /UNIQUE/i.test(String((e as Error)?.message))) {
      const ai = conn.prepare('SELECT ten FROM tutors WHERE sdt = ?').get(t.sdt) as any;
      throw loi(400, 'SĐT đã có: {ten}', { ten: ai?.ten ?? t.sdt }, { loi: { sdt: `SĐT đã có: ${ai?.ten ?? t.sdt}` } });
    }
    throw e;
  }
}

/**
 * Xoá tutor CHỈ khi chưa có buổi nào trỏ tới (có buổi → dùng kết luận "Ngừng hợp tác"); nhận xét của tutor xoá theo.
 * R2 C3 (rà 24/11): xoá mềm — tutor + nhận xét vào Thùng rác (N28, Khôi phục 30 ngày), web có Hoàn tác.
 */
export function xoaTutor(p: Principal, id: number): { ok: true; thungRacId: number } {
  canSua(p);
  const conn = db();
  const t = conn.prepare('SELECT ten, sdt, noi_day_branch_id, chi_online, ky_nang, user_id FROM tutors WHERE id = ?').get(id) as any;
  if (!t) throw notFound('Không tìm thấy tutor.');
  if (t.user_id != null) throw badRequest('Dòng này là tài khoản giáo viên — không xoá ở trang Tutor.');
  const chup = new BoChup(conn);
  return tx(() => {
    /* Kiểm trong giao dịch: GV vừa ghi buổi trỏ tutor này thì không xoá. */
    if (conn.prepare('SELECT 1 AS x FROM case_followup_buoi WHERE tutor_id = ? LIMIT 1').get(id)) {
      throw badRequest('Tutor đã có buổi dạy — không xoá được. Dùng kết luận "Ngừng hợp tác".');
    }
    chup.chay('DELETE FROM tutor_nhan_xet WHERE tutor_id = ?', id);
    chup.chay('DELETE FROM tutors WHERE id = ?', id);
    const thungRacId = ghiThungRac(conn, { loai: 'tutor', doiTuongId: id, nhan: `Tutor ${t.ten}`, branchId: t.noi_day_branch_id ?? null, nguoi: p.userId, chup });
    writeAudit({ actorUserId: p.userId, action: 'tutor.xoa', entityType: 'tutor', entityId: id, entityLabel: t.ten, before: t, after: { thungRacId } });
    return { ok: true as const, thungRacId };
  });
}

// ---------------------------------------------------------------- Nhận xét

function kiemNhanXet(v: any): { ketLuan: KetLuan; noiDung: string } {
  if (!KET_LUAN.includes(v?.ketLuan)) throw badRequest('Chọn Kết luận: Ổn · Cần cải thiện · Ngừng hợp tác.');
  const noiDung = String(v?.noiDung ?? '').trim();
  if (noiDung.length < CHU_TOI_THIEU) throw loi(400, 'Nhận xét cần ít nhất {n} ký tự.', { n: CHU_TOI_THIEU });   // TU2-6 (R2.6, XM-7) + B1-12: một ngưỡng N50 (6)
  if (noiDung.length > 1000) throw badRequest('Nhận xét tối đa 1000 ký tự.');
  return { ketLuan: v.ketLuan, noiDung };
}

export function ghiNhanXet(p: Principal, tutorId: number, v: unknown): { id: number } {
  canSua(p);
  const n = kiemNhanXet(v);
  const conn = db();
  const t = conn.prepare('SELECT ten FROM tutors WHERE id = ?').get(tutorId) as any;
  if (!t) throw notFound('Không tìm thấy tutor.');
  return tx(() => {
    const id = Number(conn.prepare('INSERT INTO tutor_nhan_xet (tutor_id, ket_luan, noi_dung, nguoi_id, luc) VALUES (?,?,?,?,?)')
      .run(tutorId, n.ketLuan, n.noiDung, p.userId, nowIso()).lastInsertRowid);
    writeAudit({ actorUserId: p.userId, action: 'tutor.nhan_xet', entityType: 'tutor_nhan_xet', entityId: id, entityLabel: t.ten, after: n });
    return { id };
  });
}

/**
 * Sửa / xoá (mục 3.1). LUAT-34 (L3, H28): SỬA mọi lúc (nhật ký trước → sau `tutor.nhan_xet_sua`); XOÁ giữ trong 24 giờ kể từ `luc`.
 * Sửa không dời `luc` (mốc nhóm chú ý). XOÁ: chỉ người ghi. R2 C9 (rà 24/11 — người ghi nghỉ thì kẹt): SỬA thêm người sửa được danh bạ dòng tutor đó
 * (`suaDuocTutor`: Head tutor / Quản trị mọi tutor, Head chi nhánh nơi dạy) — nhật ký giữ người sửa + trước → sau.
 */
export function suaDuocNhanXet(p: Principal, n: { nguoi_id: number | null }, tutor: any): boolean {
  return (coSua(p) && n.nguoi_id === p.userId) || suaDuocTutor(quyenDanhBa(p), p, tutor);
}
function nhanXetSuaDuoc(p: Principal, id: number, xoa: boolean): any {
  const n = db().prepare('SELECT id, tutor_id, ket_luan, noi_dung, nguoi_id, luc FROM tutor_nhan_xet WHERE id = ?').get(id) as any;
  if (!n) throw notFound('Không tìm thấy nhận xét.');
  if (xoa) {
    canSua(p);
    if (n.nguoi_id !== p.userId) throw forbidden('Chỉ người ghi xoá được nhận xét này.');
    if (!trong24h(n.luc)) throw badRequest('Quá 24 giờ — không xoá được nữa. Sửa nhận xét thay vì xoá.');
    return n;
  }
  const tutor = db().prepare('SELECT user_id, noi_day_branch_id, chi_online, created_by, updated_by FROM tutors WHERE id = ?').get(n.tutor_id);
  if (!suaDuocNhanXet(p, n, tutor)) throw forbidden('Chỉ người ghi, Head tutor hoặc Head chi nhánh của tutor sửa được nhận xét này.');
  return n;
}
export function suaNhanXet(p: Principal, id: number, v: unknown): { ok: true } {
  const cu = nhanXetSuaDuoc(p, id, false);
  const n = kiemNhanXet(v);
  tx(() => {
    db().prepare('UPDATE tutor_nhan_xet SET ket_luan = ?, noi_dung = ?, sua_luc = ? WHERE id = ?').run(n.ketLuan, n.noiDung, nowIso(), id);
    writeAudit({ actorUserId: p.userId, action: 'tutor.nhan_xet_sua', entityType: 'tutor_nhan_xet', entityId: id,
      before: { ketLuan: cu.ket_luan, noiDung: cu.noi_dung }, after: n });
  });
  return { ok: true };
}
/** R2 C3: xoá mềm — nhận xét vào Thùng rác (Khôi phục / Hoàn tác như Case, PA). Luật 24 giờ (H28) giữ. */
export function xoaNhanXet(p: Principal, id: number): { ok: true; thungRacId: number } {
  const cu = nhanXetSuaDuoc(p, id, true);
  const conn = db();
  const chup = new BoChup(conn);
  return tx(() => {
    chup.ghiGoc('tutors', cu.tutor_id);   // khôi phục so lại: tutor còn đúng (không bị xoá rồi id dùng lại)
    chup.chay('DELETE FROM tutor_nhan_xet WHERE id = ?', id);
    const ten = (conn.prepare('SELECT ten, noi_day_branch_id FROM tutors WHERE id = ?').get(cu.tutor_id) as any);
    const thungRacId = ghiThungRac(conn, { loai: 'nhan_xet_tutor', doiTuongId: id, nhan: `Nhận xét tutor ${ten?.ten ?? ''}`.trim(), branchId: ten?.noi_day_branch_id ?? null, nguoi: p.userId, chup });
    writeAudit({ actorUserId: p.userId, action: 'tutor.nhan_xet_xoa', entityType: 'tutor_nhan_xet', entityId: id,
      before: { tutorId: cu.tutor_id, ketLuan: cu.ket_luan, noiDung: cu.noi_dung, luc: cu.luc }, after: { thungRacId } });
    return { ok: true as const, thungRacId };
  });
}

// ---------------------------------------------------------------- Gộp tên gõ tay

/** Dòng buổi tên gõ tay (chưa gộp). `chiNhanh` (Head): chỉ dòng của lớp thuộc chi nhánh mình (lớp chụp lúc ghi) — TU13; null = mọi chi nhánh. */
const docGoTay = (conn: any, chiNhanh: number[] | null) => {
  const l = locLop(chiNhanh);
  return conn.prepare(
    `SELECT b.id, b.tutor_ten, b.so_buoi, f.observed_on, c.code AS lop FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
       LEFT JOIN classes c ON c.id = b.lop_id WHERE b.tutor_id IS NULL${l.sql} ORDER BY f.observed_on, f.id`,
  ).all(...l.args) as any[];
};

/** Tên gõ tay ("Tutor khác") chưa có trong danh sách, gom theo `khoaTen`: số buổi (Σ so_buoi), lớp, ngày. Head: chỉ phần lớp chi nhánh mình. */
export function tenGoTay(p: Principal) {
  const q = kiemQuyenDanhBa(p);
  const nhom = new Map<string, { khoa: string; ten: string; soBuoi: number; lop: string[]; ngay: string[] }>();
  for (const r of docGoTay(db(), q.tatCa ? null : q.chiNhanh)) {
    const khoa = khoaTen(r.tutor_ten);
    const g = nhom.get(khoa) ?? { khoa, ten: String(r.tutor_ten).trim().replace(/\s+/g, ' '), soBuoi: 0, lop: [], ngay: [] };
    g.soBuoi += r.so_buoi;
    if (r.lop && !g.lop.includes(r.lop)) g.lop.push(r.lop);
    const ng = r.observed_on;
    if (!g.ngay.includes(ng)) g.ngay.push(ng);
    nhom.set(khoa, g);
  }
  return [...nhom.values()].sort((a, b) => b.soBuoi - a.soBuoi || a.ten.localeCompare(b.ten, 'vi'));
}

export type GoiGop = { tutorId: number; buoiIds: number[] }[];
const laId = (x: unknown) => Number.isInteger(x) && (x as number) > 0;

/**
 * Gộp: mỗi tên (khoá) → một tutor có sẵn (`tutorId`) hoặc một GV (`gvId` — dòng danh bạ của GV tìm / tạo trong giao dịch, TU4); đặt `tutor_id` cho các dòng đó
 * (giữ `tutor_ten`), một giao dịch. Head chỉ gộp dòng lớp chi nhánh mình. Trả id mục nhật ký để Hoàn tác (`gvMoi`: dòng GV vừa tạo — Hoàn tác dọn nếu trống).
 */
export function gopTen(p: Principal, v: { muc?: unknown }): { nhatKyId: number; soBuoi: number } {
  const q = kiemQuyenDanhBa(p);
  const muc = Array.isArray(v?.muc) ? v.muc as any[] : [];
  /* Đúng MỘT đích mỗi tên: `tutorId` HOẶC `gvId`, số nguyên dương (chuỗi / giá trị lạ → 400, không lọt qua kiểm kiểu). */
  const motDich = (m: any) => (m?.tutorId != null) !== (m?.gvId != null) && laId(m?.tutorId ?? m?.gvId);
  if (!muc.length || muc.some((m) => typeof m?.khoa !== 'string' || !motDich(m))) throw badRequest('Chọn tutor cho ít nhất một tên.');
  const conn = db();
  const taiKhoan = new Map((conn.prepare('SELECT id, user_id FROM tutors').all() as any[]).map((r) => [r.id as number, r.user_id as number | null]));
  if (muc.some((m) => m.tutorId && !taiKhoan.has(m.tutorId))) throw badRequest('Tutor đã chọn không còn trong danh sách.');
  /* Đích là GV (`gvId`, hoặc dòng danh bạ của một GV): còn làm việc (như TU2-1 — tài khoản đã xoá / nghỉ không nhận) và Head chỉ gộp vào GV chi nhánh mình. */
  for (const m of muc) {
    const gv = m.gvId ?? taiKhoan.get(m.tutorId);
    if (gv == null) continue;
    if (!laNguoiHopLe(gv, 'giao_vien')) throw badRequest('Giáo viên đã chọn không còn làm việc — chọn tutor hoặc GV khác cho tên này.');
    if (!q.tatCa && !q.chiNhanh.some((cn) => laNguoiHopLe(gv, 'giao_vien', cn))) throw forbidden('GV này không làm việc ở chi nhánh của bạn — chọn GV chi nhánh mình, hoặc nhờ Quản trị gộp.');
  }
  return tx(() => {
    const ds = docGoTay(conn, q.tatCa ? null : q.chiNhanh);
    const gvMoi: number[] = [];
    const hoanTac = muc.map((m) => {
      const buoiIds = ds.filter((r) => khoaTen(r.tutor_ten) === m.khoa).map((r) => r.id as number);
      if (!buoiIds.length) return { tutorId: 0, buoiIds };
      let tutorId = m.tutorId as number;
      if (m.gvId) {
        const co2 = !!conn.prepare('SELECT 1 AS x FROM tutors WHERE user_id = ?').get(m.gvId);
        tutorId = tutorCuaGv(conn, p, m.gvId).id;
        if (!co2) gvMoi.push(tutorId);
      }
      theoLo(buoiIds, (lo, ph) => conn.prepare(`UPDATE case_followup_buoi SET tutor_id = ? WHERE tutor_id IS NULL AND id IN (${ph})`).run(tutorId, ...lo), 800);
      return { tutorId, buoiIds };
    }).filter((h) => h.buoiIds.length);
    writeAudit({ actorUserId: p.userId, action: 'tutor.gop_ten', entityType: 'tutor', after: { hoanTac, gvMoi } });
    const nhatKyId = (conn.prepare('SELECT last_insert_rowid() AS id').get() as any).id as number;
    const soBuoiDong = new Map<number, number>(ds.map((r) => [r.id, r.so_buoi]));   // "buổi" = Σ so_buoi của các dòng đã gộp (dòng gộp 2 buổi đếm 2)
    return { nhatKyId, soBuoi: hoanTac.reduce((a, h) => a + h.buoiIds.reduce((x, i) => x + (soBuoiDong.get(i) ?? 1), 0), 0) };
  });
}


/**
 * Hoàn tác gộp: đọc ĐÚNG mục nhật ký `tutor.gop_ten` của chính người gọi (không tin danh sách buổi web gửi) rồi đặt lại NULL các dòng của lần
 * gộp còn trỏ tutor đó (dòng đã đổi sang tutor khác giữ nguyên). Dòng danh bạ của GV do chính lần gộp tạo (`gvMoi`) còn trống thì dọn.
 */
export function hoanTacGop(p: Principal, v: { nhatKyId?: unknown }): { ok: true } {
  kiemQuyenDanhBa(p);
  if (!laId(v?.nhatKyId)) throw badRequest('Không tìm thấy lần gộp để hoàn tác.');
  const conn = db();
  const nk = conn.prepare('SELECT actor_user_id, action, after_json FROM audit_logs WHERE id = ?').get(v.nhatKyId) as any;
  if (!nk || nk.action !== 'tutor.gop_ten') throw notFound('Không tìm thấy lần gộp để hoàn tác.');
  if (nk.actor_user_id !== p.userId) throw forbidden('Chỉ người gộp hoàn tác được lần gộp này.');
  const sau = JSON.parse(nk.after_json ?? '{}');
  const ds = ((sau.hoanTac ?? []) as GoiGop).filter((h) => laId(h?.tutorId) && Array.isArray(h?.buoiIds));
  tx(() => {
    /* B-5: mỗi lần gộp hoàn tác MỘT lần — lần gộp lại cùng tên (nhật ký mới) không bị nhật ký cũ đảo nhầm. */
    if (conn.prepare(`SELECT 1 AS x FROM audit_logs WHERE entity_type = 'tutor' AND action = 'tutor.gop_hoan_tac' AND entity_id = ? LIMIT 1`).get(v.nhatKyId)) throw badRequest('Lần gộp này đã hoàn tác rồi.');
    for (const h of ds) {
      theoLo(h.buoiIds.filter(laId), (lo, ph) => conn.prepare(`UPDATE case_followup_buoi SET tutor_id = NULL WHERE tutor_id = ? AND id IN (${ph})`).run(h.tutorId, ...lo), 800);
    }
    for (const id of ((sau.gvMoi ?? []) as unknown[]).filter(laId)) {
      conn.prepare(`DELETE FROM tutors WHERE id = ? AND user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM case_followup_buoi WHERE tutor_id = ?)
          AND NOT EXISTS (SELECT 1 FROM tutor_nhan_xet WHERE tutor_id = ?)`).run(id, id, id);
    }
    writeAudit({ actorUserId: p.userId, action: 'tutor.gop_hoan_tac', entityType: 'tutor', entityId: v.nhatKyId as number, after: { hoanTac: ds } });
  });
  return { ok: true };
}

// ---------------------------------------------------------------- Xuất số buổi (TU14)

const THANG = /^\d{4}-(0[1-9]|1[0-2])$/;
const TOI_DA_THANG = 24;
const cuoiThang = (t: string) => new Date(Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5)), 0)).toISOString().slice(0, 10);   // ngày 0 của tháng sau = ngày cuối tháng này

/**
 * `GET /tutors/xuat-buoi?tu=YYYY-MM&den=YYYY-MM` — số buổi theo NGƯỜI DẠY × THÁNG (TU14). Tháng = tháng của ngày nghiệp vụ lần kết quả (`case_followups.observed_on`,
 * cùng mốc trang đang lọc, XM-3); số = SUM(so_buoi). Quyền `tutor.view` + phạm vi người xem (Head / CX: chỉ dòng lớp chi nhánh mình — người ngoài phạm vi
 * không lộ). Tên gõ tay chưa gộp cũng có dòng "{tên} (gõ tay)" (XM-8) để tổng buổi đủ. MỘT câu số liệu + tutors + chi nhánh. Trả `{ sheets, tenTep, dem }` như các
 * đường xuất khác (web dựng .xlsx); ghi nhật ký `tutor.xuat_so_buoi`.
 */
export function xuatSoBuoi(p: Principal, tu: unknown, den: unknown) {
  const { branchIds } = phamVi(p);
  if (typeof tu !== 'string' || typeof den !== 'string' || !THANG.test(tu) || !THANG.test(den)) throw badRequest('Chọn khoảng tháng hợp lệ (YYYY-MM).');
  if (tu > den) throw badRequest('Tháng bắt đầu phải trước hoặc cùng tháng kết thúc.');
  const thang: string[] = [];
  for (let t = tu; t <= den; t = t.slice(5) === '12' ? `${Number(t.slice(0, 4)) + 1}-01` : `${t.slice(0, 4)}-${String(Number(t.slice(5)) + 1).padStart(2, '0')}`) thang.push(t);
  if (thang.length > TOI_DA_THANG) throw badRequest(`Xuất tối đa ${TOI_DA_THANG} tháng một lần.`);
  const conn = db();
  const l = locLop(branchIds);
  // ponytail: lọc ngày qua case_followups.observed_on (quét bảng buổi tutor nhỏ, như bangTutor); thêm chỉ mục case_followups(observed_on) khi bảng lớn.
  const hang = conn.prepare(
    `SELECT b.tutor_id AS id, CASE WHEN b.tutor_id IS NULL THEN b.tutor_ten END AS ten_go, substr(f.observed_on, 1, 7) AS thang, SUM(b.so_buoi) AS n
       FROM case_followup_buoi b JOIN case_followups f ON f.id = b.followup_id
      WHERE f.observed_on >= ? AND f.observed_on <= ?${l.sql} GROUP BY b.tutor_id, ten_go, thang`,
  ).all(`${tu}-01`, cuoiThang(den), ...l.args) as any[];
  const tutor = new Map((conn.prepare(`SELECT t.id, t.chi_online, t.user_id, ${COT_TUTOR_TK} FROM tutors t LEFT JOIN users gu ON gu.id = t.user_id`).all() as any[])
    .map((r) => [r.id as number, r]));   // T3: dòng GV theo tài khoản
  const cn = docChiNhanh(conn);
  type Dong = { ten: string; loai: string; noi: string; theo: Map<string, number> };
  const dong = new Map<string, Dong>();
  for (const r of hang) {
    const t = r.id ? tutor.get(r.id) : null;
    const khoa = r.id ? `t${r.id}` : `g${khoaTen(r.ten_go)}`;
    const d = dong.get(khoa) ?? (r.id
      ? { ten: t?.ten ?? '', loai: t?.user_id != null ? 'GV' : 'Tutor', noi: t?.chi_online ? 'Chỉ online' : cn.get(t?.noi_day_branch_id) ?? '', theo: new Map() }
      : { ten: `${String(r.ten_go).trim().replace(/\s+/g, ' ')} (gõ tay)`, loai: '—', noi: '', theo: new Map() });
    d.theo.set(r.thang, (d.theo.get(r.thang) ?? 0) + r.n);
    dong.set(khoa, d);
  }
  const ds = [...dong.values()].sort((x, y) => x.ten.localeCompare(y.ten, 'vi'));
  const tong = (d: Dong) => [...d.theo.values()].reduce((s, n) => s + n, 0);
  const nhanThang = (t: string) => `${t.slice(5)}/${t.slice(0, 4)}`;
  const aoa: (string | number | null)[][] = [
    ['Người dạy', 'Loại', 'Nơi dạy', ...thang.map(nhanThang), 'Tổng'],
    ...ds.map((d) => [d.ten, d.loai, d.noi, ...thang.map((t) => d.theo.get(t) ?? 0), tong(d)]),
    ['Tổng', '', '', ...thang.map((t) => ds.reduce((s, d) => s + (d.theo.get(t) ?? 0), 0)), ds.reduce((s, d) => s + tong(d), 0)],
  ];
  const dem = { nguoiDay: ds.length, buoi: ds.reduce((s, d) => s + tong(d), 0) };
  writeAudit({ actorUserId: p.userId, action: 'tutor.xuat_so_buoi', entityType: 'tutor_xuat', entityLabel: `${nhanThang(tu)} – ${nhanThang(den)} · ${dem.nguoiDay} người · ${dem.buoi} buổi`,
    after: { tu, den, ...dem } });
  return { sheets: [{ ten: 'Số buổi', aoa }], tenTep: `so-buoi-tutor-${tu}-${den}`, dem };
}
