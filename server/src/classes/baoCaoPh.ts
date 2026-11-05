/**
 * BÁO CÁO PH (đặc tả `docs/superpowers/specs/2026-11-05-bao-cao-ph/de-xuat.md` mục 10–12, mockup `thiet-ke/v15/bao-cao-ph.html`).
 * Tab "Báo cáo PH" ở hồ sơ lớp: bảng em × phần của MỘT lớp × MỘT đợt; panel viết một phần; lưu từng (đợt, em, phần).
 * Đợt TÍNH KHI ĐỌC từ lịch lớp (`dsDotLop`) — không lưu sẵn. Em trong đợt = em đang học lớp lúc hạn (đợt còn mở: hôm nay), còn đang học (`HV_DANG_HOC_SQL`).
 * Turso: mở tab ≈ 6 câu (lớp đã nhớ, tiến độ, phân công, em, bản ghi đợt); mở panel ≈ 5 câu (+ điểm gốc một câu); lưu một ô = 1 ghi + 1 nhật ký.
 */
import { DS_JSON, db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { activeAt, lopDayDu, vaiTaiChiNhanh, type Principal } from '../permissions.ts';
import { coNho } from '../platform/nguCanhRequest.ts';
import { kyVongCuaLuot } from '../fasttrack/attempts.ts';
import { writeAudit } from '../platform/audit.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { badRequest, chuTuDo, forbidden, notFound, nowIso, toInt } from '../util.ts';
import { classProgressMany } from './schedule.ts';
import {
  MUC_BC, RATIO_PASS_THRESHOLD, boPhanBc, docMaDot, dotMacDinh, dotTruoc, dsDotLop, loiDiemSua, nhanDotBc, phanDu, soNgayQuaHan, tieuChiPhan,
  type BanGhiBc, type DiemGocBc, type DotBc, type MucBc, type PhanBc,
} from '../../../shared/domain/index.ts';

const VAI_XEM = ['manager', 'system_admin', 'office_admin', 'consultant'];
const VAI_VIET_HO = ['manager', 'system_admin'];

export type LopBc = Lop;
type Lop = { id: number; code: string; branch_id: number; programme_code: string | null; kind: string; is_fast_track: number; start_date: string | null;
  created_at: string; nguong_dat: number | null; status: string };

function docLop(classId: number): Lop {
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
    xem: vai.some((v) => VAI_XEM.includes(v)) || pc.length > 0,
    vietHo: vai.some((v) => VAI_VIET_HO.includes(v)),
    /** PR b: xuất Excel — QL, Admin, TVV (chủ SP 05/11). */
    xuat: vai.some((v) => VAI_XEM.includes(v)),
    cuaToi,
  };
}

/** Lịch lớp → mọi đợt + bộ phần. Chương trình chưa có mẫu (PET, KET, Pre FOU) → null (không có tab). */
export function dotCuaLop(c: Lop, homNay = demoToday()): { bo: readonly PhanBc[]; ds: DotBc[]; dau: DotBc | null } | null {
  const bo = boPhanBc(c.programme_code ?? c.kind);
  if (!bo) return null;
  const ft = (c.programme_code ?? '') === 'FT' || !!c.is_fast_track;
  const pr = ft ? null : classProgressMany([c.id]).get(c.id) ?? null;
  return { bo, ...dsDotLop({ ft, batDau: ft ? (c.start_date ?? pr?.startWeekStart ?? c.created_at).slice(0, 10) : null,
    progress: pr?.progressWeekStart ?? null, final: pr?.finalWeekStart ?? null }, homNay) };
}

/** Chip trên tab (đặc tả §12): đợt đang mở "Tháng 11 · hạn 30/11"; đợt vừa quá hạn (≤ 7 ngày) mà lớp chưa đủ → "quá hạn n ngày". Không quyền / không mẫu → null. */
export function chipBaoCaoPh(p: Principal, classId: number): { coTab: true; dot: string | null; nhan: string | null; han: string | null; quaHan: number } | null {
  const c = docLop(classId);
  if (!quyenBc(p, c).xem) return null;
  const homNay = demoToday();
  const d = dotCuaLop(c, homNay);
  if (!d) return null;
  const moi = d.ds[0];
  if (!moi) return { coTab: true, dot: null, nhan: null, han: null, quaHan: 0 };
  const qh = soNgayQuaHan(moi, homNay);
  if (qh === 0) return { coTab: true, dot: moi.ma, nhan: nhanDotBc(moi, homNay), han: moi.han, quaHan: 0 };
  if (qh > 7) return { coTab: true, dot: null, nhan: null, han: null, quaHan: 0 };
  /* Một câu đếm (≤ em × phần dòng) — chỉ trong 7 ngày sau hạn của đợt mới nhất. */
  const em = emCuaDot(classId, moi, homNay);
  const du = em.length ? (db().prepare(`SELECT COUNT(*) n FROM bao_cao_ph WHERE dot = ? AND du = 1 AND student_id IN (${DS_JSON})`)
    .get(moi.ma, JSON.stringify(em.map((e) => e.id))) as any).n : 0;
  return du >= em.length * d.bo.length ? { coTab: true, dot: null, nhan: null, han: null, quaHan: 0 }
    : { coTab: true, dot: moi.ma, nhan: nhanDotBc(moi, homNay), han: moi.han, quaHan: qh };
}

/** Em trong đợt: ghi danh lớp phủ ngày mốc (hạn, hoặc hôm nay khi đợt còn mở) + em đang học (đặc tả §4). Xếp theo tên. */
export function emCuaDot(classId: number, d: DotBc, homNay: string): { id: number; ten: string }[] {
  const moc = d.han < homNay ? d.han : homNay;
  return (db().prepare(
    `SELECT DISTINCT s.id, s.full_name FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.class_id = ? AND ${HV_DANG_HOC_SQL('s')} AND substr(e.started_at, 1, 10) <= ?
        AND (e.ended_at IS NULL OR substr(e.ended_at, 1, 10) > ?) AND e.status != 'withdrawn'
      ORDER BY s.full_name`,
  ).all(classId, moc, moc) as any[]).map((r) => ({ id: r.id, ten: r.full_name }));
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

function chonDot(ds: readonly DotBc[], ma: string | null | undefined, homNay: string): DotBc {
  const d = ma ? ds.find((x) => x.ma === ma) : dotMacDinh(ds, homNay);
  if (!d) throw notFound('Đợt báo cáo không có ở lớp này');
  return d;
}

function napChung(p: Principal, classId: number) {
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
  const { c, q, homNay, bo, ds, dau } = napChung(p, classId);
  const phanCot = (gv: Map<string, { id: number; ten: string }[]>) => bo.map((x) => ({
    khoa: x.khoa, ngan: x.ngan, ten: x.ten, gv: gv.get(x.khoa) ?? [], cuaToi: q.cuaToi.has(x.khoa),
  }));
  const dsDot = ds.map((x) => ({ ma: x.ma, nhan: nhanDotBc(x, homNay), mo: x.mo, han: x.han }));
  if (!ds.length) {
    return { lop: { id: c.id, ma: c.code }, dsDot, dot: null, dotDau: dau ? nhanDotBc(dau, homNay) : null, phan: phanCot(new Map()), em: [], vietHo: q.vietHo, xuat: q.xuat };
  }
  const d = chonDot(ds, dotMa, homNay);
  const em = emCuaDot(classId, d, homNay);
  const o = new Map<string, 'du' | 'nhap'>();
  if (em.length) {
    for (const r of db().prepare(`SELECT student_id, phan, du FROM bao_cao_ph WHERE dot = ? AND student_id IN (${DS_JSON})`)
      .all(d.ma, JSON.stringify(em.map((e) => e.id))) as any[]) o.set(`${r.student_id}:${r.phan}`, r.du ? 'du' : 'nhap');
  }
  return {
    lop: { id: c.id, ma: c.code }, dsDot, dot: d.ma, dotDau: null, phan: phanCot(gvTheoPhan(classId, homNay)),
    em: em.map((e) => ({ id: e.id, ten: e.ten, o: Object.fromEntries(bo.map((x) => [x.khoa, o.get(`${e.id}:${x.khoa}`) ?? null])) })),
    vietHo: q.vietHo, xuat: q.xuat,
  };
}

/**
 * ĐIỂM GỐC (đặc tả §6, §10) — MỘT câu cho cả nhóm em: FT = band của lượt Mock gần nhất có điểm trong tháng của đợt (tuần thi thuộc tháng đó);
 * lớp thường = điểm / tổng của lượt Progress / Final ở lớp này. Lượt huỷ, dấu "-" không có điểm thì bỏ.
 */
export function diemGoc(c: Lop, d: DotBc, phanKhoa: string, emIds: readonly number[]): Map<number, DiemGocBc> {
  const out = new Map<number, DiemGocBc>();
  if (!emIds.length || phanKhoa === 'chung') return out;
  const ft = d.loai === 'thang';
  const rows = db().prepare(
    `SELECT a.student_id, a.kind, a.attempt_no, a.target_at_attempt, cy.route, pr.week_start, sc.band, sc.raw_score, sc.raw_total
       FROM assessment_attempts a JOIN assessment_scores sc ON sc.attempt_id = a.id AND sc.skill = ?
       LEFT JOIN learning_cycles cy ON cy.id = a.cycle_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
      WHERE a.student_id IN (${DS_JSON}) AND a.status != 'cancelled'
        AND ${ft ? `a.kind = 'mock' AND sc.band IS NOT NULL AND pr.year = ? AND pr.month = ?` : `a.kind = ? AND a.class_id = ? AND sc.raw_score IS NOT NULL`}
      ORDER BY pr.week_start DESC, a.attempt_no DESC, a.id DESC`,
  ).all(phanKhoa, JSON.stringify(emIds), ...(ft ? [Number(d.mo.slice(0, 4)), Number(d.mo.slice(5, 7))] : [d.loai, c.id])) as any[];
  const nguong = c.nguong_dat || RATIO_PASS_THRESHOLD;
  for (const r of rows) {
    if (out.has(r.student_id)) continue;   // mới nhất trước
    out.set(r.student_id, ft
      ? { so: r.band, tong: null, kyVong: kyVongCuaLuot(r), nguong: null, luot: `MT${r.attempt_no}`, tuan: r.week_start ?? null }
      : { so: r.raw_score, tong: r.raw_total ?? null, kyVong: null, nguong, luot: d.loai === 'progress' ? 'Progress' : 'Final', tuan: r.week_start ?? null });
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
    phan: ph.khoa, viet: q.cuaToi.has(ph.khoa), vietHo: q.vietHo,
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
  const dm = docMaDot(String(body?.dot ?? ''));
  const d = dm && d0.ds.find((x) => x.ma === dm.ma);
  if (!d) throw badRequest('Đợt báo cáo chưa mở hoặc không có ở lớp này');
  const ph = d0.bo.find((x) => x.khoa === body?.phan);
  if (!ph) throw badRequest('Phần báo cáo không hợp lệ');
  const q = quyenBc(p, c, homNay);
  if (!q.cuaToi.has(ph.khoa) && !q.vietHo) throw forbidden('Bạn không được phân công viết phần này.');
  const sid = toInt(body?.studentId);
  if (!sid || !emCuaDot(classId, d, homNay).some((e) => e.id === sid)) throw badRequest('Học viên không có trong đợt báo cáo này');

  const khoaTc = new Set(tieuChiPhan(ph).map((x) => x.khoa));
  const muc: Record<string, MucBc> = {};
  for (const [k, v] of Object.entries(body?.muc && typeof body.muc === 'object' ? body.muc : {})) {
    if (!khoaTc.has(k) || !(MUC_BC as readonly unknown[]).includes(v)) throw badRequest('Mức tiêu chí không hợp lệ');
    muc[k] = v as MucBc;
  }
  const datSan = (Array.isArray(body?.datSan) ? body.datSan : []).filter((k: unknown): k is string => typeof k === 'string' && k in muc);
  const chu = chuTuDo(body?.chu, ph.khoa === 'chung' ? 'Nhận xét chung' : 'Đề xuất cải thiện', 4000) ?? '';
  let diemSua: number | null = null;
  if (body?.diemSua != null && body.diemSua !== '') {
    if (!ph.coDiem) throw badRequest('Phần này không có ô điểm');
    diemSua = Number(body.diemSua);
    const tong = d.loai === 'thang' ? null : diemGoc(c, d, ph.khoa, [sid]).get(sid)?.tong ?? null;
    if (d.loai !== 'thang' && tong == null) throw badRequest('Chưa có điểm bài để sửa');
    const l = loiDiemSua(diemSua, tong);
    if (l) throw badRequest(l);
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
  return { du: !!du, suaLuc: luc };
}
