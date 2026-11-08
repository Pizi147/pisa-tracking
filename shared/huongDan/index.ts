/**
 * HD-a — Hướng dẫn theo vai + hàm thuần (chọn vai, mục của màn đang đứng, tìm). Giao diện: `web/src/modules/huongDan/`.
 * HD-b: đủ 6 vai (phép kiểm HD-NAV đòi tài khoản mẫu cho mỗi vai).
 */
import { t, type Khoa } from '../i18n/index.ts';
import { HD_GV } from './gv.ts';
import { HD_QL } from './ql.ts';
import { HD_QT } from './qt.ts';
import { HD_TVV } from './tvv.ts';
import { HD_CX } from './cx.ts';
import { HD_ADMIN } from './admin.ts';
import { HD_HT } from './headTutor.ts';
import { boDau, type HuongDan, type ManHd, type MucHd, type TuHd, type VaiHd, type ViecHd, type ViecVaiKhac } from './kieu.ts';

export type { ChiChoToi, DichHd, HuongDan, ManHd, MucHd, NhomHd, PanelHd, PhanHd, TuHd, VaiHd, ViecHd, ViecVaiKhac } from './kieu.ts';

export const HUONG_DAN: Partial<Record<VaiHd, HuongDan>> = { gv: HD_GV, ql: HD_QL, qt: HD_QT, tvv: HD_TVV, cx: HD_CX, admin: HD_ADMIN, ht: HD_HT };

export const TEN_VAI_HD: Record<VaiHd, string> = {
  gv: t('Giáo viên'), ql: t('Quản lý'), qt: t('Quản trị hệ thống'), tvv: t('Tư vấn viên'), cx: 'CX', admin: 'Admin', ht: 'Head tutor',
};

/** Vai của tài khoản cho Hướng dẫn: vai "rộng" nhất trước (QL dạy lớp vẫn đọc hướng dẫn QL). */
export function vaiHdCua(roles: readonly string[] = []): VaiHd {
  const thu: [string, VaiHd][] = [['system_admin', 'qt'], ['manager', 'ql'], ['teacher', 'gv'], ['consultant', 'tvv'], ['cx', 'cx'], ['office_admin', 'admin'], ['head_tutor', 'ht']];
  return thu.find(([r]) => roles.includes(r))?.[1] ?? 'gv';
}

/** Vai đang có nội dung để xem: vai của mình nếu đã có, không thì Giáo viên (HD-b lấp các vai còn lại). */
export const vaiCoNoiDung = (vai: VaiHd): VaiHd => (HUONG_DAN[vai] ? vai : 'gv');
/** QL / Quản trị có "Xem vai khác" — chỉ các vai đã có nội dung. */
export const coXemVaiKhac = (vai: VaiHd) => vai === 'ql' || vai === 'qt';
export const VAI_CO_NOI_DUNG = (Object.keys(HUONG_DAN) as VaiHd[]);

/** Màn của đường dẫn: tiền tố dài nhất (`/test/diem-lop` thắng `/test`; mục kết thúc "/" là "mọi trang con"); `'/'` chỉ khớp `/`. */
export function manCuaDuong(hd: HuongDan, pathname: string): ManHd | null {
  /* AUDIT-UI B6: đường có tham số (`/cong-viec?nhom=duyet` — Hộp duyệt là tab) thuộc màn của phần đường. */
  const duong = pathname.split('?')[0];
  const p = duong.length > 1 ? duong.replace(/\/+$/, '') : duong;
  let tot: { man: ManHd; dai: number } | null = null;
  for (const man of hd.man) {
    for (const d of man.duong) {
      const khop = d === '/' ? p === '/' : d.endsWith('/') ? p.startsWith(d) : p === d || p.startsWith(`${d}/`);
      if (khop && (!tot || d.length > tot.dai)) tot = { man, dai: d.length };
    }
  }
  return tot?.man ?? null;
}

/** Mọi mục có bước (Việc hằng tuần + Theo màn + Luật và hạn). */
export const moiMuc = (hd: HuongDan): MucHd[] => [...hd.viec, ...(hd.lam ?? []).map(mucCuaViec), ...hd.man.flatMap((m) => m.muc), ...hd.luat];

const tuCua = (s: string) => s.replace(/<\/?b>/g, '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/**
 * Bộ so của ô tìm: mỗi từ gõ phải là ĐẦU một từ trong chữ ("han" không khớp "nhận"); gõ không dấu thì so không dấu, gõ có dấu thì so đúng dấu
 * ("hạn" không ra "hàng"). `khongDau` = luôn so không dấu (từ đồng nghĩa). Chữ rỗng → null.
 */
function boSo(q: string, khongDau = false) {
  const go = tuCua(q);
  if (!go.length) return null;
  const coDau = !khongDau && go.some((w) => boDau(w) !== w);
  const chuan = (s: string) => (coDau ? s : boDau(s));
  const can = go.map(chuan);
  return (chu: string) => { const ds = tuCua(chu).map(chuan); return can.every((w) => ds.some((d) => d.startsWith(w))); };
}

/**
 * Lọc cả 4 phần theo chữ đang hiện (`chu` = `t` của trang). Chữ rỗng → giữ nguyên. Màn giữ khi tên màn hoặc một mục khớp.
 */
export function locHd(hd: HuongDan, q: string, chu: (k: Khoa) => string): HuongDan {
  const so = boSo(q);
  if (!so) return hd;
  const co = (...xs: (Khoa | undefined)[]) => so(xs.filter((x): x is Khoa => !!x).map((x) => chu(x)).join(' '));
  const khopMuc = (m: MucHd) => co(m.ten, m.khi, ...m.buoc);
  return {
    ...hd,
    viec: hd.viec.filter(khopMuc),
    man: hd.man.flatMap((m) => (co(m.ten) ? [m] : m.muc.some(khopMuc) ? [{ ...m, muc: m.muc.filter(khopMuc) }] : [])),
    luat: hd.luat.filter(khopMuc),
    tu: hd.tu.filter((x: TuHd) => co(x.ten, x.nghia)),
  };
}

/* ================================================================ HD-V2 */

export const manTheoId = (hd: HuongDan, id: string | null | undefined): ManHd | null => hd.man.find((m) => m.id === id) ?? null;
/** Mục của panel đang mở (`KhungPanel hd=…`). */
export const manCuaPanel = (hd: HuongDan, p: string | null | undefined): ManHd | null => (p ? hd.man.find((m) => m.panel === p) ?? null : null);

/** Một việc dạng mục (trang Hướng dẫn, vai cũ): "khi" = đường lối chính. */
export const mucCuaViec = (v: ViecHd): MucHd => ({ id: v.id, ten: v.ten, khi: v.loiChinh.chu, buoc: v.buoc, chi: v.loiChinh.chi });

/** Bỏ việc chỉ GVCN / chỉ GV Speaking khi người xem không phải (đặc tả 3.6); `tuan` bỏ theo. QL xem vai GV: truyền cả hai true. */
export function locVai(hd: HuongDan, co: { gvcn: boolean; s: boolean }): HuongDan {
  if (!hd.lam) return hd;
  const lam = hd.lam.filter((v) => (!v.chiGvcn || co.gvcn) && (!v.chiS || co.s));
  const con = new Set(lam.map((v) => v.id));
  return { ...hd, lam, tuan: hd.tuan?.map((n) => ({ ...n, viec: n.viec.filter((i) => con.has(i)) })).filter((n) => n.viec.length) };
}

/** Một dòng "Việc làm ở đây": `viec` có = việc của Tôi muốn…; `tat` = màn này là lối tắt (hiện ô Lối chính). */
export type DongHd = { muc: MucHd; viec?: ViecHd; tat: boolean };
/**
 * "Việc làm ở đây" của màn `manId` (đặc tả 9.5): việc có lối chính hoặc lối tắt ở màn này (thứ tự `lam`; bước riêng của màn nếu màn khai
 * `muc.viec`), rồi mục riêng của màn. Vai cũ (không `lam`): đúng `muc` của màn.
 */
export function viecOManNay(hd: HuongDan, manId: string): DongHd[] {
  const man = manTheoId(hd, manId);
  if (!man) return [];
  const rieng = new Map(man.muc.filter((m) => m.viec).map((m) => [m.viec!, m]));
  const cuaViec = (hd.lam ?? []).filter((v) => v.loiChinh.man === manId || v.loiTat?.includes(manId))
    .map((v): DongHd => ({ viec: v, tat: v.loiChinh.man !== manId, muc: { ...mucCuaViec(v), ...rieng.get(v.id) } }));
  /* Panel (Case đang mở): việc làm NGAY trong panel lên trước, lối tắt sau (mockup v14 B). Màn: giữ thứ tự `lam` (mockup A). */
  if (man.panel) cuaViec.sort((x, y) => Number(x.tat) - Number(y.tat));
  return [...cuaViec, ...man.muc.filter((m) => !m.viec).map((muc): DongHd => ({ muc, tat: false }))];
}

/**
 * Ô tìm của panel (đặc tả 3.2 + 10.2): việc của vai (tên, lối chính, bước, từ đồng nghĩa) + mục riêng của màn đang đứng + việc vai khác.
 * Vai cũ (không `lam`): mọi mục khớp như trước. Chữ rỗng → null.
 */
export function timHd(hd: HuongDan, q: string, chu: (k: Khoa) => string, manId?: string | null): { viec: ViecHd[]; muc: MucHd[]; vaiKhac: ViecVaiKhac[] } | null {
  const so = boSo(q);
  const soKhongDau = boSo(q, true);
  if (!so || !soKhongDau) return null;
  const co = (...xs: (Khoa | undefined)[]) => so(xs.filter((x): x is Khoa => !!x).map((x) => chu(x)).join(' '));
  const dongNghia = (tu?: string[]) => !!tu?.some((x) => soKhongDau(x));
  if (!hd.lam) return { viec: [], muc: moiMuc(locHd(hd, q, chu)), vaiKhac: [] };
  return {
    viec: hd.lam.filter((v) => co(v.ten, v.loiChinh.chu, ...v.buoc) || dongNghia(v.tuKhac)),
    muc: (manTheoId(hd, manId)?.muc ?? []).filter((m) => !m.viec && co(m.ten, ...m.buoc)),
    vaiKhac: (hd.vaiKhac ?? []).filter((v) => co(v.ten) || dongNghia(v.tuKhac)),
  };
}
