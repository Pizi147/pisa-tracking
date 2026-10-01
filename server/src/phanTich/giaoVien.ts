/**
 * BẢNG PHÂN TÍCH GIÁO VIÊN (PR-Pb2-b, Q30-5, Q31-2, Q31-9, mockup 25) — một bảng, không phải chỉ số trong sổ. Mỗi cột ĐÚNG MỘT hàm tập trả
 * `Map<gvId, { dung: id[]; tong: id[] }>`; ô số, panel "Chấm điểm" và phép kiểm gọi cùng hàm (HOP_DONG_SO_LIEU §1). Nạp THEO LÔ cho cả chi nhánh +
 * khung + khoảng rồi gom theo người trong bộ nhớ: không câu SQL nào chạy một lần cho mỗi GV / lớp / em.
 *
 * Gán người (Q15): ô điểm → phân công ở HẠN NHẬP · kết quả, HV tiến bộ → phân công ở TUẦN THI · vi phạm → GVCN lớp vi phạm ở HẠN XỬ LÝ ·
 * Ghi kết quả PA, PA hiệu quả → người phụ trách Case. Phân công hiệu lực ở ngày d: `effective_from ≤ d ≤ effective_to` (ngày đổi: dòng mới thắng).
 */
import {
  COT_KET_QUA_GV, PERMISSIONS, baiId, khoangPtGv, kyNangPhuTrach, nhanDotNgan, oTuTap, tenMonNgan, boMonLich,
  type HangPtGv, type KhungPtGv, type OPtGv, type PhanTichGvKq,
} from '../../../shared/domain/index.ts';
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { addDays, badRequest, forbidden, notFound } from '../util.ts';
import { loadBundle, regularSkillViews, skillCells } from '../fasttrack/attempts.ts';
import { allProgrammes } from '../normal/regular.ts';
import { danhGiaMon } from '../classes/phanTichLop.ts';
import { metricSet, parseObligation } from '../worklist/metrics.ts';
import { paCoKetQua } from './hieuQuaPa.ts';

const LO = 400;
const cho = (n: number) => Array.from({ length: n }, () => '?').join(',');
const theoLo = <T>(ds: readonly T[]) => Array.from({ length: Math.ceil(ds.length / LO) }, (_, i) => ds.slice(i * LO, (i + 1) * LO));
const ngayCach = (tu: string, den: string) => Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / 86_400_000);
/** Tiến độ KHÔNG tính chấm điểm (Q20): vắng đã xác nhận, huỷ phần thi, ngoài phạm vi, chờ duyệt dời, MT lịch sử — cùng tập `scoreDebt.ts`. */
const KHONG_TINH = new Set(['absent', 'cancelled', 'skipped', 'reschedule_pending', 'lich_su']);
/** Thứ tự môn ở dòng phụ "R · W1 · W2 · GVCN …". */
const THU_TU = ['tong_hop', 'listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking'];

export type LocPtGv = { cn?: number | null; ct?: KhungPtGv; tu?: string | null; den?: string | null; thang?: string | null };
type Tap = Map<number, { dung: number[]; tong: number[] }>;
const them = (t: Tap, gv: number, id: number, dung: boolean) => {
  const x = t.get(gv) ?? { dung: [], tong: [] };
  t.set(gv, x);
  x.tong.push(id);
  if (dung) x.dung.push(id);
};

type PhanCong = { id: number; gv: number; ten: string; lop: number; skill: string | null; core: boolean; tu: string; den: string | null };
type Lop = { id: number; ma: string; ct: string | null; xong: boolean };
/** Ngữ cảnh một lần nạp: quyền, khoảng, lớp của chi nhánh + khung, MỌI phân công của các lớp đó (một câu). */
export type NguCanhPtGv = {
  cn: number; tenChiNhanh: string; khung: KhungPtGv; tu: string; den: string; cuoi: string; thang: string | null; homNay: string;
  lop: Map<number, Lop>; pc: PhanCong[];
  /** Người dạy ô `skill` (kỹ năng phân công) của lớp ở ngày `d`; `skill = null` → GVCN. */
  nguoiLuc: (lop: number, skill: string | null, d: string) => number | null;
};

export function nguCanhPtGv(p: Principal, f: LocPtGv): NguCanhPtGv {
  const scope = scopeFor(p, PERMISSIONS.MEETING_VIEW);
  if (scope.none) throw forbidden('Phân tích giáo viên dành cho Quản lý và Quản trị hệ thống.');
  const cn = f.cn ?? (!scope.all && scope.branchIds.length === 1 ? scope.branchIds[0] : null);
  if (cn == null) throw badRequest('Chọn một chi nhánh.');
  if (!scope.all && !scope.branchIds.includes(cn)) throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
  const homNay = demoToday();
  const k = khoangPtGv(f, homNay);
  if ('loi' in k) throw badRequest(k.loi);
  const conn = db();
  const cb = conn.prepare(`SELECT name FROM branches WHERE id = ?`).get(cn) as any;
  if (!cb) throw notFound('Không tìm thấy chi nhánh này.');
  const khung = f.ct ?? 'ft';
  const lop = new Map<number, Lop>();
  const pc: PhanCong[] = [];
  /* Một câu: lớp của chi nhánh + khung kèm MỌI dòng phân công (kể cả đã kết thúc — gán người theo ngày). */
  for (const r of conn.prepare(
    `SELECT c.id AS lop, c.code, c.programme_code, c.status AS lop_status, ta.id, ta.user_id, u.full_name, ta.skill, ta.is_core, ta.effective_from, ta.effective_to
       FROM classes c LEFT JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.status IN ('active', 'ended')
       LEFT JOIN users u ON u.id = ta.user_id
      WHERE c.branch_id = ? AND c.is_fast_track = ?`).all(cn, khung === 'ft' ? 1 : 0) as any[]) {
    lop.set(r.lop, { id: r.lop, ma: r.code, ct: r.programme_code ?? null, xong: r.lop_status !== 'active' });
    if (r.id) pc.push({ id: r.id, gv: r.user_id, ten: r.full_name, lop: r.lop, skill: r.skill ?? null, core: !!r.is_core, tu: r.effective_from, den: r.effective_to ?? null });
  }
  const theoO = new Map<string, PhanCong[]>();
  for (const a of pc) {
    const key = `${a.lop}|${a.core ? '' : a.skill ?? ''}`;
    if (a.core || a.skill) theoO.set(key, [...(theoO.get(key) ?? []), a]);
  }
  const nguoiLuc = (l: number, skill: string | null, d: string) => {
    const ds = (theoO.get(`${l}|${skill ?? ''}`) ?? []).filter((a) => a.tu <= d && (!a.den || a.den >= d));
    return ds.length ? ds.reduce((x, y) => (y.id > x.id ? y : x)).gv : null;
  };
  return { cn, tenChiNhanh: cb.name, khung, tu: k.tu, den: k.den, cuoi: addDays(k.den, 6), thang: f.thang ?? null, homNay, lop, pc, nguoiLuc };
}

// ------------------------------------------------------------------ bài thi trong khoảng: một lần nạp cho Chấm điểm, Kết quả, HV tiến bộ

type OBai = {
  id: number; attemptId: number; classId: number; studentId: number; hocVien: string; skill: string; tuan: string; han: string | null;
  nhapDau: string | null; band: number | null; coDiem: boolean; tienDo: string; noShow: boolean; tamDung: boolean; kck: boolean; bai: string;
};
type NapBai = { o: OBai[]; attempts: Map<number, any>; bundle: ReturnType<typeof loadBundle> };

/** Mọi ô điểm (một kỹ năng một lượt) có TUẦN THI CỦA CHÍNH Ô ĐÓ trong khoảng, ở lớp của chi nhánh + khung — `skillCells` / `regularSkillViews` như `scoreDebt.ts`. */
function napBai(p: Principal, c: NguCanhPtGv): NapBai {
  const conn = db();
  const rows: any[] = [];
  for (const lo of theoLo([...c.lop.keys()])) {
    rows.push(...conn.prepare(
      `SELECT a.*, pg.scoring_mode, cl.programme_code, rp.week_start AS period_start, rp.week_end AS period_end, rp.code AS period_code,
              cy.target_score, cy.khong_cam_ket, cy.route, s.full_name AS hv_ten, s.status AS hv_status
         FROM assessment_attempts a
         JOIN classes cl ON cl.id = a.class_id
         JOIN students s ON s.id = a.student_id
         LEFT JOIN programmes pg ON pg.code = cl.programme_code
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE a.class_id IN (${cho(lo.length)}) AND a.status != 'cancelled'
          AND (EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
                        WHERE k.attempt_id = a.id AND r2.week_start BETWEEN ? AND ?)
               OR (NOT EXISTS (SELECT 1 FROM attempt_skills k2 WHERE k2.attempt_id = a.id) AND rp.week_start BETWEEN ? AND ?))`,
    ).all(...lo, c.tu, c.den, c.tu, c.den) as any[]);
  }
  const bundle = loadBundle(rows.map((r) => r.id));
  const programmes = allProgrammes();
  const o: OBai[] = [];
  for (const a of rows) {
    const scores = bundle.scores.get(a.id) ?? [];
    const chung = (skill: string, v: { weekStart: string | null; deadline: string | null; progress: string; noShow: boolean }) => {
      if (!v.weekStart || v.weekStart < c.tu || v.weekStart > c.den) return;
      const row = scores.find((s) => s.skill === skill);
      o.push({
        id: baiId(a.id, skill), attemptId: a.id, classId: a.class_id, studentId: a.student_id, hocVien: a.hv_ten, skill, tuan: v.weekStart, han: v.deadline,
        nhapDau: row?.nhap_dau_ngay ?? null, band: row?.band ?? null,
        coDiem: (row?.band ?? null) !== null || (row?.raw_score ?? null) !== null, tienDo: v.progress, noShow: v.noShow,
        tamDung: a.hv_status === 'inactive', kck: !!a.khong_cam_ket, bai: nhanDotNgan(a.kind, a.attempt_no) ?? '',
      });
    };
    if (a.scoring_mode === 'ratio') {
      const bo = boMonLich(a.programme_code, programmes.get(a.programme_code)?.skills);
      const views = regularSkillViews(a, bundle.skillRows.get(a.id), scores, c.homNay, bo);
      for (const skill of bo) {
        const v = views.get(skill);
        if (v && v.required) chung(skill, { weekStart: v.weekStart, deadline: v.deadline, progress: v.progress, noShow: false });
      }
    } else {
      for (const x of skillCells(p, a, scores, bundle.skips.get(a.id) ?? [], c.homNay, bundle.skillRows.get(a.id))) {
        if (x.required) chung(x.skill, { weekStart: x.weekStart, deadline: x.deadline, progress: x.progress, noShow: x.noShow !== null });
      }
    }
  }
  return { o, attempts: new Map(rows.map((r) => [r.id, r])), bundle };
}

// ------------------------------------------------------------------ cột 1 · Chấm điểm (mục = ô điểm, `baiId`)

export type DongChamDiem = {
  id: number; studentId: number; hocVien: string; lop: string; bai: string; mon: string; tuan: string; han: string;
  nhapDau: string | null; tre: number | null; dung: boolean;
};
/**
 * Q13, Q20: ô có tuần thi trong khoảng, gán cho người được phân công ở HẠN NHẬP. Đúng hạn ⇔ `nhap_dau_ngay ≤ hạn` (sửa sau không tính); chưa nhập
 * mà hôm nay > hạn = trễ. Không tính: vắng / huỷ / ngoài phạm vi / chờ duyệt dời / MT lịch sử / dấu "-" / em Tạm dừng / ô chưa tới hạn chưa nhập.
 */
export function tapChamDiem(c: NguCanhPtGv, nap: NapBai): { tap: Tap; dong: Map<number, DongChamDiem & { gv: number }>; khongTinh: Map<number, number> } {
  const tap: Tap = new Map();
  const dong = new Map<number, DongChamDiem & { gv: number }>();
  const khongTinh = new Map<number, number>();
  for (const x of nap.o) {
    if (!x.han) continue;
    const l = c.lop.get(x.classId)!;
    const gv = kyNangPhuTrach(l.ct, x.skill).map((k) => c.nguoiLuc(x.classId, k, x.han!)).find((g) => g != null) ?? null;
    if (gv == null) continue;
    const boQua = KHONG_TINH.has(x.tienDo) || x.noShow || x.tamDung;
    if (boQua || (!x.nhapDau && c.homNay <= x.han)) {
      if (x.tienDo === 'absent') khongTinh.set(gv, (khongTinh.get(gv) ?? 0) + 1);
      continue;
    }
    const dung = !!x.nhapDau && x.nhapDau <= x.han;
    them(tap, gv, x.id, dung);
    dong.set(x.id, {
      id: x.id, gv, studentId: x.studentId, hocVien: x.hocVien, lop: l.ma, bai: x.bai, mon: tenMonNgan(l.ct, x.skill), tuan: x.tuan, han: x.han,
      nhapDau: x.nhapDau, dung, tre: dung ? null : ngayCach(x.han, x.nhapDau ?? c.homNay),
    });
  }
  return { tap, dong, khongTinh };
}

// ------------------------------------------------------------------ cột 5 · Kết quả môn (mục = ô có điểm, `baiId`) + cột 6 · HV tiến bộ

/** Q15, Q20: `danhGiaMon` (cùng luật tab Phân tích lớp), gán cho người dạy môn đó ở TUẦN THI; em KCK không tính (không kỳ vọng). */
function tapKetQua(c: NguCanhPtGv, nap: NapBai): Map<string, Tap & { lop?: Map<number, Set<number>> }> {
  const out = new Map<string, Tap>();
  const lop = new Map<string, Map<number, Set<number>>>();
  const progs = allProgrammes();
  const dat = new Map<number, boolean>();
  for (const a of nap.attempts.values()) {
    if (a.khong_cam_ket) continue;
    const prog = a.scoring_mode === 'ratio' ? progs.get(a.programme_code) ?? null : null;
    for (const m of danhGiaMon(a, nap.bundle.scores.get(a.id) ?? [], prog, a.target_score ?? null)?.mon ?? []) dat.set(baiId(a.id, m.skill), m.dat);
  }
  for (const x of nap.o) {
    const d = dat.get(x.id);
    if (d === undefined || !(COT_KET_QUA_GV[c.khung] as readonly string[]).includes(x.skill)) continue;   // ponytail: Pre FOU "Tổng hợp" không có cột
    const gv = c.nguoiLuc(x.classId, x.skill, x.tuan);
    if (gv == null) continue;
    const t = out.get(x.skill) ?? new Map();
    out.set(x.skill, t);
    them(t, gv, x.id, d);
    const lm = lop.get(x.skill) ?? new Map<number, Set<number>>();
    lop.set(x.skill, lm);
    lm.set(gv, (lm.get(gv) ?? new Set<number>()).add(x.classId));
  }
  return new Map([...out].map(([k, t]) => [k, Object.assign(t, { lop: lop.get(k) })]));
}

/** Q21 (FT): mục = ô có điểm mà em ĐÃ có điểm kỹ năng đó ở lượt MT gần nhất trước đó (bất kỳ lớp); tiến bộ ⇔ band cao hơn. W1, W2 riêng. KCK vẫn tính. */
function tapTienBo(c: NguCanhPtGv, nap: NapBai): Tap & { lop?: Map<number, Set<number>> } {
  const tap: Tap = new Map();
  const lop = new Map<number, Set<number>>();
  const coBand = nap.o.filter((x) => x.band !== null && (nap.attempts.get(x.attemptId)?.kind ?? 'mock') === 'mock');
  const em = [...new Set(coBand.map((x) => x.studentId))];
  const truoc = new Map<string, { tuan: string; id: number; band: number }[]>();
  for (const lo of theoLo(em)) {
    for (const r of db().prepare(
      `SELECT a.id, a.student_id, s.skill, s.band, COALESCE(rp.week_start, '') AS tuan
         FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.student_id IN (${cho(lo.length)}) AND COALESCE(a.kind, 'mock') = 'mock' AND a.status != 'cancelled' AND s.band IS NOT NULL`,
    ).all(...lo) as any[]) {
      const k = `${r.student_id}|${r.skill}`;
      truoc.set(k, [...(truoc.get(k) ?? []), { tuan: r.tuan, id: r.id, band: r.band }]);
    }
  }
  for (const x of coBand) {
    const tuanBai = nap.attempts.get(x.attemptId)?.period_start ?? x.tuan;
    const cu = (truoc.get(`${x.studentId}|${x.skill}`) ?? [])
      .filter((t) => t.id !== x.attemptId && (t.tuan < tuanBai || (t.tuan === tuanBai && t.id < x.attemptId)))
      .sort((a, b) => a.tuan.localeCompare(b.tuan) || a.id - b.id).pop();
    if (!cu) continue;
    const gv = c.nguoiLuc(x.classId, x.skill, x.tuan);
    if (gv == null) continue;
    them(tap, gv, x.id, x.band! > cu.band);
    lop.set(gv, (lop.get(gv) ?? new Set<number>()).add(x.classId));
  }
  return Object.assign(tap, { lop });
}

// ------------------------------------------------------------------ cột 2 · Ghi kết quả PA (mục = nghĩa vụ cập nhật)

/** Cùng tập `metricSet('dung-han-cap-nhat')` (hạn trong khoảng, cùng khung) → Case → người phụ trách. Nghĩa vụ của Case không người phụ trách: không hàng. */
export function tapGhiKetQuaPa(p: Principal, c: NguCanhPtGv): { tap: Tap; khongNguoi: number } {
  const r = metricSet(p, 'dung-han-cap-nhat', { branchId: c.cn, program: c.khung, from: c.tu, to: c.cuoi });
  const dung = new Set(r.numeratorIds ?? []);
  const chu = new Map<number, number | null>();
  const iv = [...new Set(r.ids.map((id) => parseObligation(id).interventionId))];
  for (const lo of theoLo(iv)) {
    for (const x of db().prepare(
      `SELECT iv.id, sc.owner_user_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.id IN (${cho(lo.length)})`,
    ).all(...lo) as any[]) chu.set(x.id, x.owner_user_id ?? null);
  }
  const tap: Tap = new Map();
  let khongNguoi = 0;
  for (const id of r.ids) {
    const gv = chu.get(parseObligation(id).interventionId) ?? null;
    if (gv == null) khongNguoi += 1;
    else them(tap, gv, id, dung.has(id));
  }
  return { tap, khongNguoi };
}

// ------------------------------------------------------------------ cột 3 · Xử lý vi phạm (mục = vi phạm)

/**
 * Q14, Q15: vi phạm có HẠN XỬ LÝ CHỐT trong khoảng, ở lớp của chi nhánh + khung, gán cho GVCN lớp vi phạm ở hạn đó. Đúng hạn ⇔ `phan_hoi_ngay ≤ han_xu_ly`
 * (thời gian chờ QL duyệt không tính); chưa phản hồi mà hôm nay > hạn = trễ; chưa tới hạn chưa phản hồi: chưa tính.
 * ponytail: vi phạm không lớp (`class_id` NULL) không tính — dữ liệu nhập đều có lớp.
 */
export function tapXuLyViPham(c: NguCanhPtGv): Tap & { lop?: Map<number, Set<number>> } {
  const tap: Tap = new Map();
  const lop = new Map<number, Set<number>>();
  for (const lo of theoLo([...c.lop.keys()])) {
    for (const v of db().prepare(
      `SELECT id, class_id, han_xu_ly, phan_hoi_ngay FROM violations
        WHERE valid = 1 AND class_id IN (${cho(lo.length)}) AND han_xu_ly BETWEEN ? AND ?`,
    ).all(...lo, c.tu, c.cuoi) as any[]) {
      if (!v.phan_hoi_ngay && c.homNay <= v.han_xu_ly) continue;
      const gv = c.nguoiLuc(v.class_id, null, v.han_xu_ly);
      if (gv == null) continue;
      them(tap, gv, v.id, !!v.phan_hoi_ngay && v.phan_hoi_ngay <= v.han_xu_ly);
      lop.set(gv, (lop.get(gv) ?? new Set<number>()).add(v.class_id));
    }
  }
  return Object.assign(tap, { lop });
}

// ------------------------------------------------------------------ cột 4 · PA hiệu quả (FT)

/**
 * Q16 (FT): PA giáo viên tự thêm (không PA theo quy chế) có kết quả trong khoảng — CHÍNH `paCoKetQua` của Hiệu quả PA (Pb2-a), cùng chi nhánh +
 * khung + khoảng, gán cho người phụ trách Case; đúng ⇔ nhóm "success". Ô = Hiệu quả PA lọc `gv` cùng khoảng.
 */
export function tapPaHieuQua(c: NguCanhPtGv): Tap {
  const tap: Tap = new Map();
  for (const r of paCoKetQua({ branchIds: [c.cn], ct: c.khung, tu: c.tu, den: c.den })) {
    if (!r.quyChe && r.chuCase != null) them(tap, r.chuCase, r.id, r.group === 'success');
  }
  return tap;
}

// ------------------------------------------------------------------ bảng

export function phanTichGiaoVien(p: Principal, f: LocPtGv): PhanTichGvKq {
  const c = nguCanhPtGv(p, f);
  const conn = db();
  /* Hàng: người có phân công ở lớp của khung trong khoảng. Lớp đã kết thúc (dòng phân công không đóng ngày) chỉ tính khi còn bài trong khoảng. */
  const nap = napBai(p, c);
  const lopCoBai = new Set(nap.o.map((x) => x.classId));
  const trongKhoang = c.pc.filter((a) => a.tu <= c.cuoi && (!a.den || a.den >= c.tu) && (!c.lop.get(a.lop)!.xong || lopCoBai.has(a.lop)));
  const nguoi = new Map<number, string>();
  for (const a of trongKhoang) nguoi.set(a.gv, a.ten);
  const cham = tapChamDiem(c, nap).tap;
  const ghi = tapGhiKetQuaPa(p, c).tap;
  const vp = tapXuLyViPham(c);
  const kq = tapKetQua(c, nap);
  const ft = c.khung === 'ft';
  const tb = ft ? tapTienBo(c, nap) : null;
  const pa = ft ? tapPaHieuQua(c) : null;

  /* Đang dạy (Q17): phân công hiệu lực ở min(cuối khoảng, hôm nay) + học viên đang học của các lớp đó — một câu theo lô. */
  const ngayDay = c.cuoi < c.homNay ? c.cuoi : c.homNay;
  const lopDay = new Map<number, Set<number>>();
  for (const a of c.pc) if (!c.lop.get(a.lop)!.xong && a.tu <= ngayDay && (!a.den || a.den >= ngayDay)) lopDay.set(a.gv, (lopDay.get(a.gv) ?? new Set<number>()).add(a.lop));
  const hvLop = new Map<number, Set<number>>();
  for (const lo of theoLo([...new Set([...lopDay.values()].flatMap((s) => [...s]))])) {
    for (const r of conn.prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${cho(lo.length)}) AND e.status = 'active' AND s.archived_at IS NULL`).all(...lo) as any[]) {
      hvLop.set(r.class_id, (hvLop.get(r.class_id) ?? new Set<number>()).add(r.student_id));
    }
  }

  const hang: HangPtGv[] = [];
  for (const [id, ten] of nguoi) {
    const cua = trongKhoang.filter((a) => a.gv === id);
    const mon = [...new Set(cua.filter((a) => !a.core && a.skill).map((a) => a.skill!))];
    const lopCn = [...new Set(cua.filter((a) => a.core).map((a) => c.lop.get(a.lop)!.ma))].sort((x, y) => x.localeCompare(y, 'vi'));
    const nhanMon = [...new Set(mon.sort((x, y) => THU_TU.indexOf(x) - THU_TU.indexOf(y))
      .map((k) => tenMonNgan(c.lop.get(cua.find((a) => a.skill === k)!.lop)!.ct, k)))];
    const day = lopDay.get(id) ?? new Set<number>();
    const coMon = mon.length > 0;
    const vpO = oTuTap(lopCn.length > 0, vp.get(id));
    const vpLop = [...(vp.lop?.get(id) ?? [])];
    const ketQua: HangPtGv['ketQua'] = {};
    for (const k of COT_KET_QUA_GV[c.khung]) {
      const t = kq.get(k);
      const o: OPtGv & { lop?: number[] } = oTuTap(mon.includes(k), t?.get(id));
      if (o.k === 'so') o.lop = [...(t?.lop?.get(id) ?? [])];
      ketQua[k] = o;
    }
    const h: HangPtGv = {
      id, ten,
      phu: [...nhanMon, ...(lopCn.length ? [`GVCN ${lopCn.join(', ')}`] : [])].join(' · '),
      dangDay: { lop: day.size, hv: new Set([...day].flatMap((l) => [...(hvLop.get(l) ?? [])])).size },
      chamDiem: oTuTap(coMon, cham.get(id)),
      ghiKetQuaPa: oTuTap(true, ghi.get(id)),
      xuLyViPham: vpO.k === 'so' ? { ...vpO, lopGvcn: vpLop } : vpO,
      ketQua,
    };
    if (ft) {
      h.paHieuQua = oTuTap(true, pa!.get(id));
      const t = oTuTap(coMon, tb!.get(id));
      h.tienBo = t.k === 'so' ? { ...t, lop: [...(tb!.lop?.get(id) ?? [])] } : t;
    }
    hang.push(h);
  }
  hang.sort((a, b) => a.ten.localeCompare(b.ten, 'vi') || a.id - b.id);
  return { cn: c.cn, tenChiNhanh: c.tenChiNhanh, khung: c.khung, tu: c.tu, den: c.den, thang: c.thang, homNay: c.homNay, hang };
}

/**
 * PANEL "Chấm điểm" của một GV (mockup 25 màn C): ĐÚNG các ô tạo nên số ở bảng (cùng `tapChamDiem`). Trễ trước, rồi lớp, rồi tên.
 * "Sửa sau": ô có lần sửa ghi lý do (RB-5) trong nhật ký — ngày sửa lấy từ nhật ký. ponytail: ngày nhật ký là giờ máy, không phải ngày nghiệp vụ.
 */
export function oChamDiemGv(p: Principal, f: LocPtGv & { gv: number }): {
  ten: string; tenChiNhanh: string; khung: KhungPtGv; tu: string; den: string; n: number; tre: number; khongTinhVang: number;
  rows: (DongChamDiem & { sua: string | null })[];
} {
  const c = nguCanhPtGv(p, f);
  const r = tapChamDiem(c, napBai(p, c));
  const rows = [...r.dong.values()].filter((d) => d.gv === f.gv);
  const conn = db();
  const ten = (conn.prepare(`SELECT full_name FROM users WHERE id = ?`).get(f.gv) as any)?.full_name;
  if (!ten) throw notFound('Không tìm thấy giáo viên này.');
  /* Lần sửa có lý do: FT ghi theo lượt + nhãn kỹ năng, lớp thường theo dòng điểm — một câu mỗi lô. */
  const sua = new Map<number, string>();
  const attemptIds = [...new Set(rows.map((d) => Math.floor(d.id / 10)))];
  for (const lo of theoLo(attemptIds)) {
    for (const x of conn.prepare(
      `SELECT al.entity_id AS a, al.entity_label AS k, MAX(al.created_at) AS luc FROM audit_logs al
        WHERE al.entity_type = 'assessment_attempt' AND al.entity_id IN (${cho(lo.length)}) AND al.action IN ('score.edit', 'score.override')
          AND al.after_json LIKE '%"lyDo"%' GROUP BY al.entity_id, al.entity_label
       UNION ALL
       SELECT sc.attempt_id, sc.skill, MAX(al.created_at) FROM audit_logs al JOIN assessment_scores sc ON sc.id = al.entity_id
        WHERE al.entity_type = 'assessment_score' AND sc.attempt_id IN (${cho(lo.length)}) AND al.action IN ('regular.score', 'regular.score.override')
          AND al.after_json LIKE '%"lyDo"%' GROUP BY sc.attempt_id, sc.skill`,
    ).all(...lo, ...lo) as any[]) sua.set(baiId(x.a, x.k), String(x.luc).slice(0, 10));
  }
  const out = rows.map((d) => ({ ...d, sua: sua.get(d.id) ?? null }))
    .sort((a, b) => Number(a.dung) - Number(b.dung) || a.lop.localeCompare(b.lop, 'vi') || a.hocVien.localeCompare(b.hocVien, 'vi') || a.id - b.id);
  return {
    ten, tenChiNhanh: c.tenChiNhanh, khung: c.khung, tu: c.tu, den: c.den, n: out.filter((d) => d.dung).length, tre: out.filter((d) => !d.dung).length,
    khongTinhVang: r.khongTinh.get(f.gv) ?? 0, rows: out,
  };
}
