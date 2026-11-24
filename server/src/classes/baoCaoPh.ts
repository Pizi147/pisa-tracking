/**
 * BÁO CÁO PH (đặc tả `docs/superpowers/specs/2026-11-05-bao-cao-ph/de-xuat.md` mục 10–12, mockup `thiet-ke/v15/bao-cao-ph.html`).
 * Tab "Báo cáo PH" ở hồ sơ lớp: bảng em × phần của MỘT lớp × MỘT đợt; panel viết một phần; lưu từng (đợt, em, phần).
 * Đợt TÍNH KHI ĐỌC từ lịch lớp (`dsDotLop`) — không lưu sẵn. Em trong đợt = em đang học lớp lúc hạn (đợt còn mở: hôm nay), còn đang học (`HV_DANG_HOC_SQL`).
 * Turso: mở tab ≈ 6 câu (lớp đã nhớ, tiến độ, phân công, em, bản ghi đợt); mở panel ≈ 5 câu (+ điểm gốc một câu); lưu một ô = 1 ghi + 1 nhật ký.
 */
import { DS_JSON, chenNhieuDong, db, theoLoJson, tx } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { activeAt, lopDayDu, vaiTaiChiNhanh, type Principal } from '../permissions.ts';
import { coNho, nho } from '../platform/nguCanhRequest.ts';
import { kyVongCuaLuot } from '../fasttrack/attempts.ts';
import { notify, nguoiVaiCuaChiNhanh, writeAudit, writeAuditLo } from '../platform/audit.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { badRequest, chuTuDo, forbidden, notFound, nowIso, toInt } from '../util.ts';
import { classProgressMany } from './schedule.ts';
import {
  MUC_BC, RATIO_PASS_THRESHOLD, VAI_XUAT_BC, boPhanBc, docDiemSua, dotMacDinh, dotTruoc, dsDotLop, nhanDotBc, phanDu, soNgayQuaHan, tieuChiPhan, tieuChiTrong,
  type BanGhiBc, type DiemGocBc, type DotBc, type MucBc, type PhanBc, type TuyChinhDot,
} from '../../../shared/domain/index.ts';

const VAI_VIET_HO = ['manager', 'system_admin'];
/** BC-DOT-QL: ai quyết đợt nào cần báo cáo (bỏ / thêm đợt) — như quyền xuất, trừ TVV (chủ SP 06/11). */
const VAI_QUYET_DOT = ['manager', 'system_admin', 'office_admin'];

export type LopBc = Lop;
type Lop = { id: number; code: string; branch_id: number; programme_code: string | null; kind: string; is_fast_track: number; start_date: string | null;
  created_at: string; nguong_dat: number | null; status: string };

export function docLop(classId: number): Lop {
  const c = ((coNho() ? lopDayDu().get(classId) : null) ?? db().prepare('SELECT * FROM classes WHERE id = ?').get(classId)) as Lop | undefined;
  if (!c) throw notFound('Không tìm thấy lớp');
  return c;
}

/** Quyền theo vai ở chi nhánh lớp + phân công (đặc tả §7, §12): đọc = QL · QT · Admin · TVV + GV của lớp; viết = GV đúng phần (GVCN phần Chung) · QL viết hộ. */
export function quyenBc(p: Principal, c: Pick<Lop, 'id' | 'branch_id'>, homNay = demoToday()) {
  const vai = vaiTaiChiNhanh(p, [c.branch_id]);
  const pc = p.assignments.filter((a) => a.classId === c.id && activeAt(a, homNay));
  const cuaToi = new Set(pc.flatMap((a) => (a.isCore ? ['chung'] : a.skill ? [a.skill] : [])));
  return {
    xem: vai.some((v) => VAI_XUAT_BC.includes(v)) || pc.length > 0,
    vietHo: vai.some((v) => VAI_VIET_HO.includes(v)),
    /** PR b: xuất Excel — QL, Admin, TVV (chủ SP 05/11). */
    xuat: vai.some((v) => VAI_XUAT_BC.includes(v)),
    /** BC-DOT-QL: bỏ / thêm đợt — QL, Quản trị, Admin ở chi nhánh lớp (TVV, GV không). */
    quyetDot: vai.some((v) => VAI_QUYET_DOT.includes(v)),
    cuaToi,
  };
}

export const lopFt = (c: Pick<Lop, 'programme_code' | 'is_fast_track'>): boolean => (c.programme_code ?? '') === 'FT' || !!c.is_fast_track;
/** Đợt chấm theo band (FT): đợt tháng, hoặc đợt thêm của lớp FT. */
export const laDotFt = (c: Pick<Lop, 'programme_code' | 'is_fast_track'>, d: Pick<DotBc, 'loai'>): boolean => d.loai === 'thang' || (d.loai === 'them' && lopFt(c));

/**
 * BC-DOT-QL: quyết định đợt của NHIỀU lớp — MỘT câu (`bao_cao_ph_dot`, chỉ mục theo lớp). Lớp không có dòng nào → không có trong kết quả.
 * Nơi đọc nhiều lớp gọi một lần rồi truyền vào `dotCuaLop` (không đọc từng lớp).
 */
export function docTuyChinhDot(classIds: readonly number[]): Map<number, TuyChinhDot> {
  /* LG-13: GET nhớ theo đúng danh sách lớp — việc Báo cáo PH và "Sắp tới" của `/my-work` cùng tập lớp, một câu. Kết quả chỉ đọc. */
  return nho(`tuy-chinh-dot:${classIds.join(',')}`, () => tinhTuyChinhDot(classIds));
}
function tinhTuyChinhDot(classIds: readonly number[]): Map<number, TuyChinhDot> {
  const out = new Map<number, { bo: Set<string>; them: DotBc[] }>();
  theoLoJson([...new Set(classIds)], (json) => {
    for (const r of db().prepare(`SELECT id, class_id, ma, loai, ten, mo, han FROM bao_cao_ph_dot WHERE class_id IN (${DS_JSON}) AND xoa_luc IS NULL ORDER BY id`).all(json) as any[]) {
      const o = out.get(r.class_id) ?? { bo: new Set<string>(), them: [] };
      if (r.loai === 'bo') o.bo.add(r.ma);
      else o.them.push({ ma: `them:${r.id}`, loai: 'them', mo: r.mo, han: r.han, ten: r.ten });
      out.set(r.class_id, o);
    }
  });
  return out;
}

/** Lịch lớp → mọi đợt + bộ phần. Chương trình chưa có mẫu (PET, KET, Pre FOU) → null (không có tab). */
/** `tienDo`: tiến độ lớp đã đọc theo lô (`classProgressMany`) · `tuyChinh`: quyết định đợt đã đọc theo lô (`docTuyChinhDot`) — nơi đọc nhiều lớp truyền vào, không đọc từng lớp. */
export function dotCuaLop(c: Lop, homNay = demoToday(), tienDo?: Map<number, { progressWeekStart: string | null; finalWeekStart: string | null; startWeekStart: string | null }>,
  tuyChinh?: Map<number, TuyChinhDot>): { bo: readonly PhanBc[]; ds: DotBc[]; dau: DotBc | null; daBo: DotBc[]; sapMo: DotBc[] } | null {
  const bo = boPhanBc(c.programme_code ?? c.kind);
  if (!bo) return null;
  const ft = lopFt(c);
  /* BC-PH-MOC: FT tính từ TUẦN KHAI GIẢNG (`start_period_id`, cùng nguồn "tuần n" đầu trang — Sửa lịch lớp đổi cái này); `start_date` chỉ khi chưa chọn tuần.
     Tiến độ nhớ theo request: hồ sơ lớp đã nạp → không thêm câu. */
  const pr = (tienDo ?? classProgressMany([c.id])).get(c.id) ?? null;
  return { bo, ...dsDotLop({ ft, batDau: ft ? (pr?.startWeekStart ?? c.start_date ?? c.created_at).slice(0, 10) : null,
    progress: pr?.progressWeekStart ?? null, final: pr?.finalWeekStart ?? null }, homNay, (tuyChinh ?? docTuyChinhDot([c.id])).get(c.id)) };
}

/** Chip trên tab (đặc tả §12): đợt đang mở "Tháng 11 · hạn 30/11"; đợt vừa quá hạn (≤ 7 ngày) mà lớp chưa đủ → "quá hạn n ngày". Không quyền / không mẫu → null. */
export function chipBaoCaoPh(p: Principal, classId: number): { coTab: true; dot: string | null; nhan: string | null; han: string | null; quaHan: number } | null {
  const c = docLop(classId);
  if (!quyenBc(p, c).xem) return null;
  const homNay = demoToday();
  const d = dotCuaLop(c, homNay);
  if (!d) return null;
  const khong = { coTab: true as const, dot: null, nhan: null, han: null, quaHan: 0 };
  /* RA-LOI-0711j: đợt QL thêm (BC-DOT-QL) làm `ds[0]` không còn là "đợt cần nhắc" — đợt đang mở (bất kỳ) thắng; không có thì đợt quá hạn ≤ 7 ngày
     MỚI NHẤT còn thiếu. Không có đợt thêm: đúng như cũ (một đợt, hai câu); có đợt thêm trong 7 ngày: thêm hai câu cho mỗi đợt đã đủ đứng trước. */
  const mo = d.ds.find((x) => soNgayQuaHan(x, homNay) === 0);
  if (mo) return { coTab: true, dot: mo.ma, nhan: nhanDotBc(mo, homNay), han: mo.han, quaHan: 0 };
  for (const x of d.ds) {
    const qh = soNgayQuaHan(x, homNay);
    if (qh > 7) continue;
    /* Một câu em + một câu đếm (≤ em × phần dòng) — chỉ đợt trong 7 ngày sau hạn. */
    const em = emCuaDot(classId, x, homNay);
    const du = em.length ? (db().prepare(`SELECT COUNT(*) n FROM bao_cao_ph WHERE dot = ? AND du = 1 AND student_id IN (${DS_JSON})`)
      .get(x.ma, JSON.stringify(em.map((e) => e.id))) as any).n : 0;
    if (du < em.length * d.bo.length) return { coTab: true, dot: x.ma, nhan: nhanDotBc(x, homNay), han: x.han, quaHan: qh };
  }
  return khong;
}

/** Em trong đợt: ghi danh lớp phủ ngày mốc (hạn, hoặc hôm nay khi đợt còn mở) + em đang học (đặc tả §4). Xếp theo tên. */
export function emCuaDot(classId: number, d: DotBc, homNay: string): { id: number; ten: string }[] {
  const moc = d.han < homNay ? d.han : homNay;
  const thay = new Set<number>();
  return (db().prepare(
    `SELECT s.id, s.full_name, substr(e.started_at, 1, 10) AS tu, substr(e.ended_at, 1, 10) AS den, ${COT_BAI_ROI('e')} AS bai
       FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND ${HV_DANG_HOC_SQL('s')} AND substr(e.started_at, 1, 10) <= ? AND e.status != 'withdrawn'
      ORDER BY s.full_name`,
  ).all(classId, moc) as any[]).filter((r) => emTrongDot(r, d, homNay) && !thay.has(r.id) && thay.add(r.id)).map((r) => ({ id: r.id, ten: r.full_name }));
}

/** N71: loại bài Progress / Final em có ở lớp của ghi danh ĐÃ RỜI (`group_concat`); ghi danh còn mở → NULL, không đọc lượt. `e` bí danh `enrollments`. */
export const COT_BAI_ROI = (e: string) => `CASE WHEN ${e}.ended_at IS NOT NULL THEN (SELECT group_concat(DISTINCT a.kind) FROM assessment_attempts a
  WHERE a.student_id = ${e}.student_id AND a.class_id = ${e}.class_id AND a.kind IN ('progress', 'final') AND a.status != 'cancelled') END`;
/**
 * Em có trong đợt: ghi danh phủ ngày mốc (hạn; đợt còn mở: hôm nay). N71 (chủ SP 25/11): em rời lớp TRONG đợt Progress / Final (Cuối khoá "Ngay hôm nay" /
 * "Từ tuần", chuyển một em) mà bài đợt đó ở lớp này → vẫn trong đợt tới khi GV lớp cũ viết xong — trước: em rơi khỏi đợt ngay ngày rời lớp.
 * `emCuaDot` và `emTheoLo` (việc GV / Admin / QL, xuất) dùng chung.
 */
export function emTrongDot(r: { tu: string | null; den: string | null; bai: string | null }, d: DotBc, homNay: string): boolean {
  const moc = d.han < homNay ? d.han : homNay;
  if (!r.tu || r.tu > moc) return false;
  if (!r.den || r.den > moc) return true;
  return (d.loai === 'progress' || d.loai === 'final') && r.den >= d.mo && (r.bai ?? '').split(',').includes(d.loai);
}

/** GV phân công đang giữ mỗi phần (người giữ lúc xem — đặc tả §10). Hai GV cùng kỹ năng: cả hai. */
function gvTheoPhan(classId: number, homNay: string): Map<string, { id: number; ten: string }[]> {
  const out = new Map<string, { id: number; ten: string }[]>();
  for (const r of db().prepare(
    `SELECT ta.skill, ta.is_core, u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
      WHERE ta.class_id = ? AND ta.status = 'active' AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?) ORDER BY ta.id`,
  ).all(classId, homNay, homNay) as any[]) {
    const k = r.is_core ? 'chung' : r.skill;
    if (!k) continue;
    const ds = out.get(k) ?? [];
    if (!ds.some((x) => x.id === r.id)) ds.push({ id: r.id, ten: r.full_name });
    out.set(k, ds);
  }
  return out;
}

const docBanGhi = (r: any): BanGhiBc => ({
  muc: r.muc ? JSON.parse(r.muc) : {}, datSan: r.dat_san ? JSON.parse(r.dat_san) : [], chu: r.chu ?? '', diemSua: r.diem_sua ?? null,
});

export function chonDot(ds: readonly DotBc[], ma: string | null | undefined, homNay: string): DotBc {
  const d = ma ? ds.find((x) => x.ma === ma) : dotMacDinh(ds, homNay);
  if (!d) throw notFound('Đợt báo cáo không có ở lớp này');
  return d;
}

export function napChung(p: Principal, classId: number) {
  const c = docLop(classId);
  const q = quyenBc(p, c);
  if (!q.xem) throw forbidden('Lớp này nằm ngoài phạm vi bạn được xem.');
  const homNay = demoToday();
  const d = dotCuaLop(c, homNay);
  if (!d) throw badRequest('Chương trình của lớp chưa có mẫu báo cáo PH');
  return { c, q, homNay, ...d };
}

/** GET /classes/:id/bao-cao-ph?dot= — chọn đợt + bảng em × phần (ô: đủ / nháp / chưa viết). */
export function trangBaoCaoPh(p: Principal, classId: number, dotMa?: string | null) {
  const { c, q, homNay, bo, ds, dau, daBo, sapMo } = napChung(p, classId);
  const phanCot = (gv: Map<string, { id: number; ten: string }[]>) => bo.map((x) => ({
    khoa: x.khoa, ngan: x.ngan, ten: x.ten, gv: gv.get(x.khoa) ?? [], cuaToi: q.cuaToi.has(x.khoa),
  }));
  const dsDot = ds.map((x) => ({ ma: x.ma, nhan: nhanDotBc(x, homNay), mo: x.mo, han: x.han, them: x.loai === 'them', ten: x.ten ?? null }));
  /* BC-DOT-QL: đợt đã bỏ chỉ QL / Admin thấy (để Khôi phục); chọn đúng một đợt bỏ → không bảng, chỉ thẻ "Không báo cáo". */
  const dsBo = q.quyetDot ? daBo.map((x) => ({ ma: x.ma, nhan: nhanDotBc(x, homNay) })) : [];
  /* LG-2: đợt thêm chưa tới ngày mở — mọi người xem lớp đều thấy "sắp mở {ngày}"; QL / Admin sửa / xoá. `id` = dòng `bao_cao_ph_dot`. */
  const dsSapMo = sapMo.map((x) => ({ ma: x.ma, id: Number(x.ma.slice(5)), nhan: nhanDotBc(x, homNay), ten: x.ten ?? null, mo: x.mo, han: x.han }));
  const chungTrang = { lop: { id: c.id, ma: c.code, cn: c.branch_id, ft: lopFt(c) }, dsDot, dsBo, dsSapMo, quyetDot: q.quyetDot, vietHo: q.vietHo, xuat: q.xuat };
  const daChon = dotMa ? dsBo.find((x) => x.ma === dotMa) ?? null : null;
  const sapChon = dotMa ? dsSapMo.find((x) => x.ma === dotMa) ?? null : !ds.length ? dsSapMo[0] ?? null : null;
  if (!ds.length || daChon || sapChon) {
    return { ...chungTrang, dot: null, daBo: daChon, sapMo: daChon ? null : sapChon, dotDau: dau && !daChon && !sapChon ? nhanDotBc(dau, homNay) : null,
      phan: phanCot(new Map()), em: [] };
  }
  const d = chonDot(ds, dotMa, homNay);
  const em = emCuaDot(classId, d, homNay);
  const o = new Map<string, 'du' | 'nhap'>();
  if (em.length) {
    for (const r of db().prepare(`SELECT student_id, phan, du FROM bao_cao_ph WHERE dot = ? AND student_id IN (${DS_JSON})`)
      .all(d.ma, JSON.stringify(em.map((e) => e.id))) as any[]) o.set(`${r.student_id}:${r.phan}`, r.du ? 'du' : 'nhap');
  }
  return {
    ...chungTrang, dot: d.ma, daBo: null, sapMo: null, dotDau: null, phan: phanCot(gvTheoPhan(classId, homNay)),
    em: em.map((e) => ({ id: e.id, ten: e.ten, o: Object.fromEntries(bo.map((x) => [x.khoa, o.get(`${e.id}:${x.khoa}`) ?? null])) })),
  };
}

/**
 * ĐIỂM GỐC (đặc tả §6, §10) — MỘT câu cho cả nhóm em: FT = band của lượt Mock gần nhất có điểm trong tháng của đợt (tuần thi thuộc tháng đó);
 * lớp thường = điểm / tổng của lượt Progress / Final ở lớp này. Lượt huỷ, dấu "-" không có điểm thì bỏ.
 */
export function diemGoc(c: Lop, d: DotBc, phanKhoa: string, emIds: readonly number[]): Map<number, DiemGocBc> {
  const out = new Map<number, DiemGocBc>();
  if (!emIds.length || phanKhoa === 'chung') return out;
  const ft = laDotFt(c, d);
  /* BC-DOT-QL: đợt thêm bất chợt = lượt gần nhất CÓ ĐIỂM, tuần thi ≤ hạn (FT: Mock; lớp thường: Progress / Final của lớp này; lượt chưa gắn tuần: tính). */
  const them = d.loai === 'them';
  const trongHan = '(pr.week_start IS NULL OR pr.week_start <= ?)';
  const rows = db().prepare(
    `SELECT a.student_id, a.kind, a.attempt_no, a.target_at_attempt, a.created_at, COALESCE(a.route_at_attempt, cy.route) AS route, pr.week_start, sc.band, sc.raw_score, sc.raw_total
       FROM assessment_attempts a JOIN assessment_scores sc ON sc.attempt_id = a.id AND sc.skill = ?
       LEFT JOIN learning_cycles cy ON cy.id = a.cycle_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
      WHERE a.student_id IN (${DS_JSON}) AND a.status != 'cancelled'
        AND ${ft ? `a.kind = 'mock' AND sc.band IS NOT NULL AND ${them ? trongHan : 'pr.year = ? AND pr.month = ?'}`
          : `${them ? "a.kind IN ('progress', 'final')" : 'a.kind = ?'} AND a.class_id = ? AND sc.raw_score IS NOT NULL${them ? ` AND ${trongHan}` : ''}`}
      ORDER BY pr.week_start DESC, a.attempt_no DESC, a.id DESC`,
  ).all(phanKhoa, JSON.stringify(emIds), ...(ft ? (them ? [d.han] : [Number(d.mo.slice(0, 4)), Number(d.mo.slice(5, 7))]) : them ? [c.id, d.han] : [d.loai, c.id])) as any[];
  const nguong = c.nguong_dat || RATIO_PASS_THRESHOLD;
  for (const r of rows) {
    if (out.has(r.student_id)) continue;   // mới nhất trước
    out.set(r.student_id, ft
      ? { so: r.band, tong: null, kyVong: kyVongCuaLuot(r), nguong: null, luot: `MT${r.attempt_no}`, tuan: r.week_start ?? null }
      : { so: r.raw_score, tong: r.raw_total ?? null, kyVong: null, nguong, luot: r.kind === 'progress' ? 'Progress' : 'Final', tuan: r.week_start ?? null });
  }
  return out;
}

/** GET /classes/:id/bao-cao-ph/phan?dot=&phan= — panel một phần: em, bản ghi đợt này, mức đợt trước (đặt sẵn), điểm gốc, người sửa cuối. */
export function phanBaoCaoPh(p: Principal, classId: number, dotMa: string | null | undefined, phanKhoa: string) {
  const { c, q, homNay, bo, ds } = napChung(p, classId);
  const ph = bo.find((x) => x.khoa === phanKhoa);
  if (!ph) throw badRequest('Phần báo cáo không hợp lệ');
  const d = chonDot(ds, dotMa, homNay);
  const truoc = dotTruoc(d, ds);
  const em = emCuaDot(classId, d, homNay);
  const ids = JSON.stringify(em.map((e) => e.id));
  const bg = new Map<string, any>();
  if (em.length) {
    for (const r of db().prepare(
      `SELECT b.*, u.full_name AS sua_ten FROM bao_cao_ph b LEFT JOIN users u ON u.id = b.sua_boi
        WHERE b.phan = ? AND b.dot IN (?, ?) AND b.student_id IN (${DS_JSON})`,
    ).all(phanKhoa, d.ma, truoc?.ma ?? '', ids) as any[]) bg.set(`${r.dot}:${r.student_id}`, r);
  }
  const goc = ph.coDiem ? diemGoc(c, d, phanKhoa, em.map((e) => e.id)) : new Map();
  return {
    lop: { id: c.id, ma: c.code }, dot: { ma: d.ma, nhan: nhanDotBc(d, homNay), han: d.han }, dotTruoc: truoc ? nhanDotBc(truoc, homNay) : null,
    phan: ph.khoa, viet: q.cuaToi.has(ph.khoa), vietHo: q.vietHo, ft: laDotFt(c, d),
    em: em.map((e) => {
      const r = bg.get(`${d.ma}:${e.id}`);
      const t = truoc && bg.get(`${truoc.ma}:${e.id}`);
      return {
        id: e.id, ten: e.ten, banGhi: r ? docBanGhi(r) : null, du: !!r?.du,
        mucTruoc: t ? docBanGhi(t).muc : null, goc: goc.get(e.id) ?? null,
        sua: r ? { ten: r.sua_ten ?? null, luc: r.sua_luc } : null,
      };
    }),
  };
}

/** PUT /classes/:id/bao-cao-ph — lưu MỘT (đợt, em, phần): mức, đặt sẵn, ô chữ, điểm sửa tay. Sửa sau hạn được (không khoá cứng); đợt chưa mở thì chặn. */
export function luuBaoCaoPh(p: Principal, classId: number, body: any) {
  const c = docLop(classId);
  const homNay = demoToday();
  const d0 = dotCuaLop(c, homNay);
  if (!d0) throw badRequest('Chương trình của lớp chưa có mẫu báo cáo PH');
  const d = d0.ds.find((x) => x.ma === String(body?.dot ?? ''));
  if (!d) throw badRequest('Đợt báo cáo chưa mở hoặc không có ở lớp này');
  const ph = d0.bo.find((x) => x.khoa === body?.phan);
  if (!ph) throw badRequest('Phần báo cáo không hợp lệ');
  const q = quyenBc(p, c, homNay);
  if (!q.cuaToi.has(ph.khoa) && !q.vietHo) throw forbidden('Bạn không được phân công viết phần này.');
  const sid = toInt(body?.studentId);
  const emDot = emCuaDot(classId, d, homNay);
  if (!sid || !emDot.some((e) => e.id === sid)) throw badRequest('Học viên không có trong đợt báo cáo này');

  const khoaTc = new Set(tieuChiPhan(ph).map((x) => x.khoa));
  const muc: Record<string, MucBc> = {};
  for (const [k, v] of Object.entries(body?.muc && typeof body.muc === 'object' ? body.muc : {})) {
    if (!khoaTc.has(k) || !(MUC_BC as readonly unknown[]).includes(v)) throw badRequest('Mức tiêu chí không hợp lệ');
    muc[k] = v as MucBc;
  }
  const datSan = (Array.isArray(body?.datSan) ? body.datSan : []).filter((k: unknown): k is string => typeof k === 'string' && k in muc);
  const chu = chuTuDo(body?.chu, ph.khoa === 'chung' ? 'Nhận xét chung' : 'Đề xuất cải thiện', 4000) ?? '';
  let diemSua: number | string | null = null;
  if (body?.diemSua != null && String(body.diemSua).trim() !== '') {
    if (!ph.coDiem) throw badRequest('Phần này không có ô điểm');
    if (typeof body.diemSua !== 'number' && typeof body.diemSua !== 'string') throw badRequest('Điểm không hợp lệ');
    const ft = laDotFt(c, d);
    const tong = ft ? null : diemGoc(c, d, ph.khoa, [sid]).get(sid)?.tong ?? null;
    if (!ft && tong == null) throw badRequest('Chưa có điểm bài để sửa');
    /* BCPH-PDF: FT sửa được thành CHỮ tự do ("6.5 - 7.0", như mẫu PDF); chữ số vẫn kiểm band / tổng. */
    const r = docDiemSua(body.diemSua, ft, tong);
    if (r.loi) throw badRequest(r.loi);
    diemSua = r.gt;
  }
  const b: BanGhiBc = { muc, datSan, chu, diemSua };
  const du = phanDu(ph, b) ? 1 : 0;
  const luc = nowIso();
  db().prepare(
    `INSERT INTO bao_cao_ph (class_id, dot, student_id, phan, muc, dat_san, chu, diem_sua, du, sua_boi, sua_luc)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT (dot, student_id, phan) DO UPDATE SET class_id = excluded.class_id, muc = excluded.muc, dat_san = excluded.dat_san, chu = excluded.chu,
       diem_sua = excluded.diem_sua, du = excluded.du, sua_boi = excluded.sua_boi, sua_luc = excluded.sua_luc`,
  ).run(classId, d.ma, sid, ph.khoa, JSON.stringify(muc), JSON.stringify(datSan), chu, diemSua, du, p.userId, luc);
  writeAudit({ actorUserId: p.userId, action: 'bao_cao_ph.luu', entityType: 'student', entityId: sid, entityLabel: c.code,
    after: { dot: d.ma, phan: ph.khoa, du: !!du, vietHo: !q.cuaToi.has(ph.khoa) } });
  if (du) baoAdminLopDu(c, d, d0.bo, emDot, homNay);
  return { du: !!du, suaLuc: luc };
}

/**
 * POST /classes/:id/bao-cao-ph/dat-nhanh { dot, phan, muc, o: { [em]: tiêu chí[] }, hoanTac?, moi? } — BAO-PH-DAT-NHANH (chủ SP 15/11).
 * Đặt: điền `muc` vào đúng các ô hộp đã cho xem là TRỐNG (`tieuChiTrong`); ô đã có mức lúc lưu (người khác vừa chấm) bỏ qua — không đè. Ô chữ, điểm giữ.
 * Hoàn tác (`hoanTac`): trả về trống đúng các ô đó nếu còn đúng mức vừa đặt (ai sửa sau thì giữ); em `moi` (chưa có bản ghi trước khi đặt) còn rỗng thì xoá dòng.
 * Quyền như lưu một ô (GV đúng phần / QL viết hộ), kiểm từng em có trong đợt. MỘT giao dịch, MỘT câu ghi nhiều dòng + MỘT câu nhật ký nhiều dòng.
 * Turso: lớp (nhớ) + đợt (tiến độ, tuỳ chỉnh) + em + MỘT câu bản ghi (đợt này + đợt trước, phần này) ≈ 6 câu, ≤ 3 × em dòng; + 2 câu khi lớp vừa đủ.
 */
export function datNhanhBaoCaoPh(p: Principal, classId: number, body: any) {
  const c = docLop(classId);
  const homNay = demoToday();
  const d0 = dotCuaLop(c, homNay);
  if (!d0) throw badRequest('Chương trình của lớp chưa có mẫu báo cáo PH');
  const d = d0.ds.find((x) => x.ma === String(body?.dot ?? ''));
  if (!d) throw badRequest('Đợt báo cáo chưa mở hoặc không có ở lớp này');
  const ph = d0.bo.find((x) => x.khoa === body?.phan);
  if (!ph) throw badRequest('Phần báo cáo không hợp lệ');
  const q = quyenBc(p, c, homNay);
  if (!q.cuaToi.has(ph.khoa) && !q.vietHo) throw forbidden('Bạn không được phân công viết phần này.');
  const muc = body?.muc as MucBc;
  if (!(MUC_BC as readonly unknown[]).includes(muc)) throw badRequest('Mức tiêu chí không hợp lệ');
  const khoaTc = new Set(tieuChiPhan(ph).map((x) => x.khoa));
  const o = new Map<number, string[]>();
  for (const [k, v] of Object.entries(body?.o && typeof body.o === 'object' ? body.o : {})) {
    const sid = toInt(k);
    if (!sid || !Array.isArray(v) || !v.length || v.some((x) => !khoaTc.has(x))) throw badRequest('Danh sách ô không hợp lệ');
    o.set(sid, [...new Set(v as string[])]);
  }
  if (!o.size) throw badRequest('Chưa có ô nào để đặt');
  if (o.size > 500) throw badRequest('Quá nhiều học viên một lần');
  const hoanTac = body?.hoanTac === true;
  const moi = new Set((Array.isArray(body?.moi) ? body.moi : []).map(toInt));

  const emDot = new Map(emCuaDot(classId, d, homNay).map((e) => [e.id, e]));
  const truoc = hoanTac ? null : dotTruoc(d, d0.ds);
  const ids = [...o.keys()].filter((sid) => emDot.has(sid));
  const bg = new Map<string, any>();
  if (ids.length) {
    for (const r of db().prepare(`SELECT dot, student_id, muc, dat_san, chu, diem_sua FROM bao_cao_ph WHERE phan = ? AND dot IN (?, ?) AND student_id IN (${DS_JSON})`)
      .all(ph.khoa, d.ma, truoc?.ma ?? '', JSON.stringify(ids)) as any[]) bg.set(`${r.dot}:${r.student_id}`, r);
  }
  const luc = nowIso();
  const ghi: unknown[][] = [];
  const xoa: number[] = [];
  const ket: { studentId: number; khoa: string[]; o: 'du' | 'nhap' | null; moi: boolean }[] = [];
  const loi: { studentId: number; lyDo: string }[] = [];
  let boQua = 0, thieuChu = 0;
  for (const [sid, ds] of o) {
    if (!emDot.has(sid)) { loi.push({ studentId: sid, lyDo: 'Học viên không có trong đợt báo cáo này' }); continue; }
    const r = bg.get(`${d.ma}:${sid}`);
    /* Chưa có bản ghi: mức đợt trước = đặt sẵn (như panel viết `formDau`). */
    const rt = truoc && bg.get(`${truoc.ma}:${sid}`);
    const mt = rt ? docBanGhi(rt).muc : {};
    const b: BanGhiBc = r ? docBanGhi(r) : { muc: { ...mt }, datSan: Object.keys(mt), chu: '', diemSua: null };
    let doi: string[];
    if (hoanTac) {
      doi = ds.filter((k) => b.muc[k] === muc && !b.datSan.includes(k));
      for (const k of doi) delete b.muc[k];
    } else {
      const trong = new Set(tieuChiTrong(ph, b, null));
      doi = ds.filter((k) => trong.has(k));
      for (const k of doi) b.muc[k] = muc;
    }
    boQua += ds.length - doi.length;
    if (!doi.length) continue;
    const du = phanDu(ph, b);
    if (!du && !b.chu.trim()) thieuChu++;
    /* Hoàn tác em vừa có dòng mới: chỉ còn mức đặt sẵn, không chữ, không điểm → xoá dòng (như trước khi đặt). */
    if (hoanTac && moi.has(sid) && r && !b.chu.trim() && b.diemSua == null && Object.keys(b.muc).every((k) => b.datSan.includes(k))) {
      xoa.push(sid); ket.push({ studentId: sid, khoa: doi, o: null, moi: false }); continue;
    }
    ghi.push([classId, d.ma, sid, ph.khoa, JSON.stringify(b.muc), JSON.stringify(b.datSan), b.chu, b.diemSua, du ? 1 : 0, p.userId, luc]);
    ket.push({ studentId: sid, khoa: doi, o: du ? 'du' : 'nhap', moi: !r });
  }
  if (ghi.length || xoa.length) {
    tx(() => {
      chenNhieuDong('INSERT INTO bao_cao_ph (class_id, dot, student_id, phan, muc, dat_san, chu, diem_sua, du, sua_boi, sua_luc)', ghi,
        ` ON CONFLICT (dot, student_id, phan) DO UPDATE SET class_id = excluded.class_id, muc = excluded.muc, dat_san = excluded.dat_san,
          du = excluded.du, sua_boi = excluded.sua_boi, sua_luc = excluded.sua_luc`);
      if (xoa.length) db().prepare(`DELETE FROM bao_cao_ph WHERE dot = ? AND phan = ? AND student_id IN (${DS_JSON})`).run(d.ma, ph.khoa, JSON.stringify(xoa));
      writeAuditLo(ket.map((k) => ({ actorUserId: p.userId, action: hoanTac ? 'bao_cao_ph.hoan_dat_nhanh' : 'bao_cao_ph.dat_nhanh', entityType: 'student', entityId: k.studentId,
        entityLabel: c.code, after: { dot: d.ma, phan: ph.khoa, muc, o: k.khoa, du: k.o === 'du', vietHo: !q.cuaToi.has(ph.khoa) } })));
    });
    if (ket.some((k) => k.o === 'du')) baoAdminLopDu(c, d, d0.bo, [...emDot.values()], homNay);
  }
  return { o: ket, soO: ket.reduce((n, k) => n + k.khoa.length, 0), boQua, loi, thieuChu, suaLuc: luc };
}

/**
 * LG-3 (chủ SP 14/11, lời 16 ý 3): lần lưu làm lớp × đợt ĐỦ (mọi em đủ mọi phần) → MỘT tin "Cập nhật" cho Admin (`office_admin`) chi nhánh lớp, trỏ tab
 * Báo cáo PH đúng đợt — cùng lúc việc "Xuất báo cáo PH" xuất hiện. `dedup_key` theo lớp × đợt: lưu lại / đủ lại không tạo tin mới.
 * Turso: chỉ khi lần lưu là "đủ" — một câu đếm (≤ em × phần) + một câu người nhận + một ghi mỗi Admin khi lớp vừa đủ.
 */
function baoAdminLopDu(c: Lop, d: DotBc, bo: readonly PhanBc[], em: readonly { id: number }[], homNay: string) {
  const n = (db().prepare(`SELECT COUNT(*) n FROM bao_cao_ph WHERE dot = ? AND du = 1 AND student_id IN (SELECT value FROM json_each(?))
      AND phan IN (SELECT value FROM json_each(?))`).get(d.ma, JSON.stringify(em.map((e) => e.id)), JSON.stringify(bo.map((x) => x.khoa))) as any).n;
  if (n < em.length * bo.length) return;
  const nhan = nhanDotBc(d, homNay);
  for (const userId of nguoiVaiCuaChiNhanh(c.branch_id, 'office_admin')) {
    notify({ userId, kind: 'bc_ph_du', title: `Báo cáo PH đủ · ${c.code}`, body: `${nhan} · ${em.length} em`, entityType: 'class', entityId: c.id,
      dedupKey: `bc_ph_du:${c.id}:${d.ma}`, duong: `/hoc-vien/lop/${c.id}?tab=bao-cao-ph&dot=${encodeURIComponent(d.ma)}` });
  }
}

/** GET /bao-cao-ph/lop?branchId= — lớp cùng chi nhánh người xem quyết được đợt (hộp "Áp thêm lớp" của BC-DOT-QL). Một câu (`lopDayDu`, nhớ theo request). */
export function lopChoQuyetDot(p: Principal, branchId: number): { id: number; ma: string; ft: boolean; ct: string }[] {
  return [...lopDayDu().values() as Iterable<Lop>].filter((c) => c.branch_id === branchId && c.status === 'active' && boPhanBc(c.programme_code ?? c.kind) && quyenBc(p, c).quyetDot)
    .sort((a, b) => a.code.localeCompare(b.code)).map((c) => ({ id: c.id, ma: c.code, ft: lopFt(c), ct: c.programme_code ?? c.kind }));
}
