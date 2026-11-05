/**
 * TAB "THI THẬT" (PR-4, chủ SP 05/11 — đặc tả 2C · 2E · 2F) — danh sách kết quả + thống kê Exceed / Đạt / Fail (Tổng · Từng kỹ năng · Theo GV) + panel ô số.
 * Một tập (`thiThatTrongKhoang`), một hàm tính (`thongKeThiThat`): số trên ô = số dòng panel (G7).
 * Theo GV chỉ vai có `analysis.view_teacher` hoặc CX (2E) — chặn ở máy chủ. Tuần dạy đọc theo `student_id` / `class_id` của tập (2 câu), không cả chi nhánh.
 */
import {
  PERMISSIONS, coMucThi, type MucGv, type OPtGv, kyNangThiLanNay, mucThi, thongKeThiThat, type DoanDay, type KetQuaThiThatKq, type KnDay, type KnThiThat, type ThongKeThiThat,
} from '../../../shared/domain/index.ts';
import { t } from '../../../shared/i18n/index.ts';
import { db, theoLo } from '../db.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { addDays, badRequest, forbidden } from '../util.ts';
import { mondayOf } from '../platform/week.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { ghiDanhCuaEm } from './lopLucThi.ts';
import { thiThatTrongKhoang, tongThiThat, type LocKetQuaThi, type ThiThatTho } from './ketQuaThi.ts';

/** 2E: khối Theo GV — QL, Quản trị (`analysis.view_teacher`), CX. TVV / GV không. */
export const coTheoGv = (p: Principal): boolean => !scopeFor(p, PERMISSIONS.ANALYSIS_VIEW_TEACHER).none || p.roleKeys.includes('cx');

/** Kỹ năng phân công (FT) → kỹ năng dạy; "writing" chung (dữ liệu cũ) → cả W1 và W2. */
const KN_PC: Record<string, KnDay[]> = { listening: ['l'], reading: ['r'], writing1: ['w1'], writing2: ['w2'], writing: ['w1', 'w2'], speaking: ['s'] };

/**
 * Tuần dạy (2C-7): với mỗi lộ trình có mức thi, mỗi GV × kỹ năng = số Thứ Hai phân biệt trong giao của ghi danh em (đến `ended_at`, trống → ngày thi) ×
 * phân công kỹ năng ở lớp đó (đến `effective_to`, trống → ngày thi) × lộ trình (`started_at` → ngày thi). Chỉ lớp FT. 1 câu ghi danh (nhớ chung với
 * lớp lúc thi) + 1 câu phân công theo lớp (kèm tên GV).
 */
export function tuanDay(ds: readonly ThiThatTho[]): { day: Map<number, DoanDay[]>; ten: Map<number, string> } {
  const co = ds.filter((x) => coMucThi(x.kq) && x.kq.ngay);
  const gd = ghiDanhCuaEm([...new Set(co.map((x) => x.kq.studentId))]);
  const doan = co.map((x) => {
    const ngay = x.kq.ngay!.slice(0, 10);
    const tu = x.batDau ?? '0000-00-00';
    return { x, ngay, ghi: (gd.get(x.kq.studentId) ?? []).filter((e) => e.tu <= ngay && (e.den ?? ngay) >= tu).map((e) => ({ ...e, tu: e.tu > tu ? e.tu : tu, den: e.den && e.den < ngay ? e.den : ngay })) };
  });
  const pc = new Map<number, { user: number; kn: KnDay[]; tu: string; den: string | null }[]>();
  const ten = new Map<number, string>();
  theoLo([...new Set(doan.flatMap((d) => d.ghi.map((e) => e.lop)))], (lo, ph) => {
    for (const a of db().prepare(
      `SELECT ta.user_id, ta.class_id, ta.skill, substr(ta.effective_from, 1, 10) AS tu, substr(ta.effective_to, 1, 10) AS den, u.full_name
         FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id LEFT JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id IN (${ph}) AND c.is_fast_track = 1 AND ta.status IN ('active', 'ended') AND ta.is_core = 0 AND ta.skill IS NOT NULL`,
    ).all(...lo) as any[]) {
      const kn = KN_PC[a.skill];
      if (!kn) continue;
      (pc.get(a.class_id) ?? pc.set(a.class_id, []).get(a.class_id)!).push({ user: a.user_id, kn, tu: a.tu, den: a.den ?? null });
      ten.set(a.user_id, a.full_name ?? '');
    }
  });
  const day = new Map<number, DoanDay[]>();
  for (const { x, ngay, ghi } of doan) {
    const tuan = new Map<string, Set<string>>();
    for (const e of ghi) for (const a of pc.get(e.lop) ?? []) {
      const s = [e.tu, a.tu].reduce((m, v) => (v > m ? v : m));
      const k = [e.den, a.den ?? ngay].reduce((m, v) => (v < m ? v : m));
      if (s > k) continue;
      for (const kn of a.kn) {
        const set = tuan.get(`${a.user}:${kn}`) ?? tuan.set(`${a.user}:${kn}`, new Set()).get(`${a.user}:${kn}`)!;
        for (let m = mondayOf(s), cuoi = mondayOf(k); m <= cuoi; m = addDays(m, 7)) set.add(m);
      }
    }
    day.set(x.kq.cycleId, [...tuan].map(([khoa, set]) => ({ userId: Number(khoa.split(':')[0]), kn: khoa.split(':')[1] as KnDay, tuan: set.size })));
  }
  return { day, ten };
}

/** Dòng Theo GV gửi web: không kèm `ds` (panel đọc riêng khi bấm). */
export type DongGvThiWeb = Omit<ThongKeThiThat['gv'][number], 'ds'> & { ten: string };
export type ThiThatTabKq = KetQuaThiThatKq & { thongKe: Omit<ThongKeThiThat, 'gv'> & { gv: DongGvThiWeb[] | null } };

/** GET /phan-tich/thi-that — danh sách (như `ket-qua-thi?loai=thi-that`) + thống kê. ≤ 6 câu: thi thật · lớp lúc thi (2) · lớp · ghi danh (chung) · phân công. */
export function thiThatTab(p: Principal, f: LocKetQuaThi): ThiThatTabKq {
  const ds = thiThatTrongKhoang(p, f);
  const gv = coTheoGv(p) ? tuanDay(ds) : null;
  const tk = thongKeThiThat(ds.map((x) => x.kq), gv?.day ?? new Map());
  const rows = ds.map((x) => x.dong);
  return {
    loai: 'thi-that', tu: f.tu, den: f.den, rows, tong: tongThiThat(rows),
    thongKe: { tong: tk.tong, kyNang: tk.kyNang, gv: gv ? tk.gv.map(({ ds: _ds, ...g }) => ({ ...g, ten: gv.ten.get(g.userId) ?? '' })) : null },
  };
}

/** Dòng panel P-TT / P-GV: em · lớp · ngày thi · L R W S · OVR · Target (+ tuần dạy / tổng ở P-GV). */
export type DongPanelTt = {
  cycleId: number; studentId: number; ten: string; classId: number | null; lop: string | null; ngay: string | null;
  l: number | null; r: number | null; w: number | null; s: number | null; ovr: number | null; target: number | null; kck: boolean;
  /** Kỹ năng thi lần này khi thi lại (ô khác lấy lại, mờ "↺"). */
  thiLai: KnThiThat[] | null;
  tuan?: { day: number; tong: number };
};
const NHAN_MUC = { hv: 'HV', exceed: 'Exceed', dat: 'Đạt', fail: 'Fail' } as const;
const NHAN_KN: Record<KnDay | KnThiThat, string> = { l: 'L', r: 'R', w: 'W', w1: 'W1', w2: 'W2', s: 'S' };

/**
 * GET /phan-tich/thi-that/o — panel một ô. `o`: `tong:<thi|exceed|dat|fail|khong-thi>` · `kn:<l|r|w|s>:<hv|exceed|dat|fail>` ·
 * `gv:<userId>:<l|r|w1|w2|s>:<hv|exceed|dat|fail>` (chỉ vai Theo GV — 403). Lọc CHÍNH tập sinh ra số.
 */
export function oThiThat(p: Principal, f: LocKetQuaThi & { o: string }): { n: number; tieuDe: string; rows: DongPanelTt[]; bangLuot: true; kieu: 'thi-that'; knNhan: string | null } {
  const m = /^(?:tong:(thi|exceed|dat|fail|khong-thi)|kn:([lrws]):(hv|exceed|dat|fail)|gv:(\d+):(l|r|w1|w2|s):(hv|exceed|dat|fail))$/.exec(f.o);
  if (!m) throw badRequest('Số này không có trong Thi thật — có thể bộ lọc vừa đổi.');
  if (m[4] && !coTheoGv(p)) throw forbidden('Theo GV dành cho Quản lý, Quản trị và CX.');
  const ds = thiThatTrongKhoang(p, f, { boQuyen: true });
  const dong = (x: ThiThatTho, tuan?: DongPanelTt['tuan']): DongPanelTt => ({
    cycleId: x.kq.cycleId, studentId: x.kq.studentId, ten: x.dong.ten, classId: x.dong.classId, lop: x.dong.lop, ngay: x.dong.ngayThi,
    l: x.kq.l, r: x.kq.r, w: x.kq.w, s: x.kq.s, ovr: x.kq.ovr, target: x.kq.target, kck: x.kq.kck, thiLai: x.kq.thiLai, ...(tuan ? { tuan } : {}),
  });
  let rows: DongPanelTt[];
  let nhan: string;
  let knNhan: string | null = null;
  if (m[1]) {
    const o = m[1];
    rows = ds.filter((x) => (o === 'khong-thi' ? x.kq.khongThi : o === 'thi' ? !x.kq.khongThi : coMucThi(x.kq) && x.kq.ovr !== null && mucThi(x.kq.ovr, x.kq.target!) === o)).map((x) => dong(x));
    nhan = o === 'khong-thi' ? t('Không thi') : o === 'thi' ? t('HV thi') : NHAN_MUC[o as 'exceed'];
  } else if (m[2]) {
    const kn = m[2] as KnThiThat;
    rows = ds.filter((x) => coMucThi(x.kq) && x.kq[kn] !== null && kyNangThiLanNay(x.kq, kn) && (m[3] === 'hv' || mucThi(x.kq[kn]!, x.kq.target!) === m[3])).map((x) => dong(x));
    nhan = `${NHAN_MUC[m[3] as 'hv']} · ${NHAN_KN[kn]}`;
    knNhan = NHAN_KN[kn];
  } else {
    const user = Number(m[4]), kn = m[5] as KnDay;
    const g = thongKeThiThat(ds.map((x) => x.kq), tuanDay(ds).day).gv.find((x) => x.userId === user && x.kn === kn);
    const theoId = new Map(ds.map((x) => [x.kq.cycleId, x]));
    rows = (g?.ds ?? []).filter((x) => m[6] === 'hv' || x.muc === m[6]).map((x) => dong(theoId.get(x.cycleId)!, { day: x.tuan, tong: x.tongTuan }));
    nhan = `${NHAN_MUC[m[6] as 'hv']} · ${NHAN_KN[kn]}`;
    knNhan = NHAN_KN[kn];
  }
  return { n: rows.length, tieuDe: t('{nhan} · {n} HV', { nhan, n: rows.length }), rows, bangLuot: true, kieu: 'thi-that', knNhan };
}

/** Kỹ năng dạy → khoá kỹ năng của Phân tích GV / hồ sơ GV (`COT_KET_QUA_GV.ft`). */
export const SKILL_KN: Record<KnDay, string> = { l: 'listening', r: 'reading', w1: 'writing1', w2: 'writing2', s: 'speaking' };
/** Một mục thi thật gán cho MỘT GV: em × kỹ năng GV dạy (W1 / W2 riêng), mức so Target overall, trọng số tuần. */
export type MucThiGv = MucGv & { kn: KnDay; x: ThiThatTho };

/**
 * 2F (thay C10): thi thật của MỘT chi nhánh (lớp lúc thi thuộc chi nhánh, khoảng ngày thi [tu, den]) → mục của từng GV — CÙNG `thongKeThiThat` với tab
 * Thi thật. Không kiểm quyền (Phân tích GV / hồ sơ GV đã kiểm phần giáo viên). Nhớ theo request: bảng + hồ sơ cùng chi nhánh đọc một lần.
 */
export function mucThiTheoGv(cn: number, tu: string, den: string): Map<number, MucThiGv[]> {
  return nho(`thi-that-gv:${cn}:${tu}:${den}`, () => {
    const ds = thiThatTrongKhoang(null, { branchId: cn, tu, den }, { boQuyen: true });
    const theoId = new Map(ds.map((x) => [x.kq.cycleId, x]));
    const out = new Map<number, MucThiGv[]>();
    for (const g of thongKeThiThat(ds.map((x) => x.kq), tuanDay(ds).day).gv)
      for (const m of g.ds) (out.get(g.userId) ?? out.set(g.userId, []).get(g.userId)!).push({ ...m, kn: g.kn, x: theoId.get(m.cycleId)! });
    return out;
  });
}
/** Ô GV: mục Đạt Target trở lên (Exceed + Đạt) / mọi mục; `pt` = % theo tuần dạy (số to). */
export const oThiGv = (ds: readonly MucGv[]): OPtGv => {
  if (!ds.length) return { k: 'rong' };
  const sw = ds.reduce((a, m) => a + m.w, 0);
  const qua = ds.filter((m) => m.muc !== 'fail');
  return { k: 'so', dung: qua.length, tong: ds.length, pt: Math.round((100 * qua.reduce((a, m) => a + m.w, 0)) / sw) };
};
