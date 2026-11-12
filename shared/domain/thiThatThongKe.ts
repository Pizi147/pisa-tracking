/**
 * THỐNG KÊ THI THẬT (PR-4 THI-THAT, chủ SP 05/11 — đặc tả 2C · 2E · 2F, thay luật C10) — MỘT hàm cho tab Thi thật, Phân tích GV, hồ sơ GV.
 *   Exceed / Đạt / Fail = điểm > · = · < Target overall (OVR cho Tổng; band kỹ năng cho Từng kỹ năng). Theo GV (chủ SP 12/11): band kỹ năng GV dạy so Target — > Vượt · = Đạt · < Chưa đạt (bỏ cột "KN dưới Target").
 *   KCK và em không có Target: đếm ở "HV thi", không vào Exceed / Đạt / Fail. "Không thi" đếm riêng.
 *   Thi lại một kỹ năng (#969): chỉ kỹ năng thi lần này vào Từng kỹ năng / Theo GV; OVR vẫn vào Tổng.
 *   Theo GV: mọi GV từng dạy kỹ năng cho em (tuần dạy > 0); Phân tích V2 (chủ SP 12/11, đặc tả 11): BỎ trọng số tuần dạy — mỗi em một mục, % = số em / em của dòng.
 *   W thi thật → W1 và W2 (mỗi task một dòng).
 *   KCK của báo cáo (đặc tả 5.2) = em không cam kết Target HOẶC em đã nhận WL 2 trước ngày thi (`wl2`) — chỉ gom trong báo cáo, không đổi KCK của em.
 *   "Tổng thể" = cùng cách đếm nhưng GỒM KCK (em có Target).
 * Hàm thuần, không SQL — máy chủ nạp `KqThi` + `DoanDay` (`server/src/phanTich/thiThatThongKe.ts`).
 */
export type MucThi = 'exceed' | 'dat' | 'fail';
export type KnThiThat = 'l' | 'r' | 'w' | 's';
export type KnDay = 'l' | 'r' | 'w1' | 'w2' | 's';
export const KN_DAY: readonly KnDay[] = ['l', 'r', 'w1', 'w2', 's'];

export const mucThi = (diem: number, target: number): MucThi => (diem > target ? 'exceed' : diem === target ? 'dat' : 'fail');

export type KqThi = {
  studentId: number; cycleId: number; classIdCuoi: number | null; ngay: string | null;
  l: number | null; r: number | null; w: number | null; s: number | null; ovr: number | null; target: number | null;
  kck: boolean; khongThi: boolean;
  /** Phân tích V2: em đã nhận WL 2 (bậc `wl_2` đã thực hiện, cùng lộ trình, trước ngày thi) — vào nhóm KCK của báo cáo. */ wl2?: boolean;
  /** Kỹ năng thi lần này khi em thi lại (còn lại lấy lần trước); null = thi đủ. */
  thiLai: KnThiThat[] | null;
};
/** Tuần MỘT GV dạy MỘT kỹ năng cho MỘT em trong lộ trình, tới ngày thi. */
export type DoanDay = { userId: number; kn: KnDay; tuan: number };
/**
 * Một mục của dòng GV: em (lộ trình) · mức · band · tuần GV dạy / tổng tuần em học kỹ năng · trọng số.
 * Chủ SP 12/11: `muc` = band kỹ năng GV dạy so Target (`mucThiGv`) — "Chưa đạt" đơn thuần là kỹ năng dưới Target (thay luật OVR 05/11).
 */
export type MucGv = { cycleId: number; muc: MucThi; band: number; tuan: number; tongTuan: number; w: number };
/** Mức của em ở dòng GV (chủ SP 12/11): band kỹ năng GV dạy > · = · < Target → Vượt · Đạt · Chưa đạt. */
export const mucThiGv = (band: number, target: number): MucThi => mucThi(band, target);
export type DemMuc = { exceed: number; dat: number; fail: number };
/** `exceed` · `dat` · `fail` = % trên số em của dòng (V2: không trọng số); `so` = số em từng nhóm (= số dòng panel). */
export type DongGvThi = { userId: number; kn: KnDay; hv: number; tuan: number; tb: number | null; ds: MucGv[]; so: DemMuc } & DemMuc;
export type ThongKeThiThat = {
  /** `kck` gồm WL 2. `tongThe`: Vượt · Đạt · Chưa đạt GỒM KCK (em có Target) — ô "Tổng thể". */
  tong: { thi: number; khongThi: number; kck: number; tongThe: DemMuc } & DemMuc;
  kyNang: Record<KnThiThat, { hv: number; tb: number | null } & DemMuc>;
  /** `exceed` · `dat` · `fail` = % theo trọng số (làm tròn). */
  gv: DongGvThi[];
};

const mot = (x: number) => Math.round(x * 10) / 10;
const pt = (a: number, b: number) => (b > 0 ? Math.round((100 * a) / b) : 0);
/** Em vào Exceed / Đạt / Fail: thi, có Target, không KCK. */
export const coMucThi = (k: KqThi): boolean => !k.khongThi && !k.kck && !k.wl2 && k.target !== null;
/** KCK của báo cáo (gồm WL 2). */
export const laKckBaoCao = (k: KqThi): boolean => k.kck || !!k.wl2;
/** Kỹ năng thi lần này (thi lại → chỉ kỹ năng đó). */
export const kyNangThiLanNay = (k: KqThi, kn: KnThiThat): boolean => !k.thiLai || k.thiLai.includes(kn);
const knThi = (kn: KnDay): KnThiThat => (kn === 'w1' || kn === 'w2' ? 'w' : kn);

export function thongKeThiThat(kq: readonly KqThi[], day: ReadonlyMap<number, readonly DoanDay[]>): ThongKeThiThat {
  const thi = kq.filter((k) => !k.khongThi);
  const coMuc = thi.filter(coMucThi);
  const dem = (ds: MucThi[]): DemMuc => ({ exceed: ds.filter((m) => m === 'exceed').length, dat: ds.filter((m) => m === 'dat').length, fail: ds.filter((m) => m === 'fail').length });
  const tong = {
    thi: thi.length, khongThi: kq.length - thi.length, kck: thi.filter(laKckBaoCao).length,
    ...dem(coMuc.filter((k) => k.ovr !== null).map((k) => mucThi(k.ovr!, k.target!))),
    tongThe: dem(thi.filter((k) => k.target !== null && k.ovr !== null).map((k) => mucThi(k.ovr!, k.target!))),
  };
  const kyNang = Object.fromEntries((['l', 'r', 'w', 's'] as const).map((kn) => {
    const ds = coMuc.filter((k) => k[kn] !== null && kyNangThiLanNay(k, kn));
    return [kn, { hv: ds.length, tb: ds.length ? mot(ds.reduce((a, k) => a + k[kn]!, 0) / ds.length) : null, ...dem(ds.map((k) => mucThi(k[kn]!, k.target!))) }];
  })) as ThongKeThiThat['kyNang'];

  const theoGv = new Map<string, { userId: number; kn: KnDay; ds: MucGv[] }>();
  for (const k of coMuc.filter((x) => x.ovr !== null)) {
    const doan = day.get(k.cycleId) ?? [];
    for (const kn of KN_DAY) {
      const band = k[knThi(kn)];
      if (band === null || !kyNangThiLanNay(k, knThi(kn))) continue;
      const cua = doan.filter((x) => x.kn === kn && x.tuan > 0);
      const tongTuan = cua.reduce((a, x) => a + x.tuan, 0);
      if (!tongTuan) continue;   // không phân công kỹ năng → không chia 0, em không vào Theo GV
      const gop = new Map<number, number>();
      for (const x of cua) gop.set(x.userId, (gop.get(x.userId) ?? 0) + x.tuan);
      for (const [userId, tuan] of gop) {
        const khoa = `${userId}:${kn}`;
        (theoGv.get(khoa) ?? theoGv.set(khoa, { userId, kn, ds: [] }).get(khoa)!).ds
          .push({ cycleId: k.cycleId, muc: mucThiGv(band, k.target!), band, tuan, tongTuan, w: 1 });   // V2: không trọng số
      }
    }
  }
  const tl = (ds: MucGv[], m: MucThi) => ds.filter((x) => x.muc === m).reduce((a, x) => a + x.w, 0);
  const sw = (ds: MucGv[]) => ds.reduce((a, x) => a + x.w, 0);
  const gv: DongGvThi[] = [...theoGv.values()].map(({ userId, kn, ds }) => ({
    userId, kn, hv: ds.length, tuan: ds.reduce((a, x) => a + x.tuan, 0), tb: mot(ds.reduce((a, x) => a + x.w * x.band, 0) / sw(ds)), ds, so: dem(ds.map((x) => x.muc)),
    exceed: pt(tl(ds, 'exceed'), sw(ds)), dat: pt(tl(ds, 'dat'), sw(ds)), fail: pt(tl(ds, 'fail'), sw(ds)),
  }));
  /* GV có Fail (trọng số, mọi kỹ năng) cao nhất trước; trong một GV: L R W1 W2 S. */
  const failGv = new Map<number, number>();
  for (const u of new Set(gv.map((g) => g.userId))) {
    const ds = gv.filter((g) => g.userId === u).flatMap((g) => g.ds);
    failGv.set(u, tl(ds, 'fail') / sw(ds));
  }
  gv.sort((a, b) => failGv.get(b.userId)! - failGv.get(a.userId)! || a.userId - b.userId || KN_DAY.indexOf(a.kn) - KN_DAY.indexOf(b.kn));
  return { tong, kyNang, gv };
}

/** GET /phan-tich/thi-that — `thongKe.gv` không kèm `ds` (panel đọc riêng khi bấm); null = vai không xem Theo GV (TVV, GV — 2E). */
export type DongGvThiWeb = Omit<DongGvThi, 'ds'> & { ten: string };
export type ThongKeThiThatWeb = Omit<ThongKeThiThat, 'gv'> & { gv: DongGvThiWeb[] | null };
