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
import { HD_BPXL } from './bpxl.ts';
import { boDau, PANEL_HD, PHIEN_BAN_HD, type HuongDan, type ManHd, type MucHd, type TinhHuongHd, type TuHd, type VaiHd, type ViecHd, type ViecVaiKhac } from './kieu.ts';
import { chenHan } from '../domain/hanMacDinh.ts';
import { KHOA_CHAM_SPEAKING } from '../domain/gopViec.ts';
import { NHOM_CV_TVV, TAB_CV, nhanTabCv } from '../domain/tongQuan.ts';

export { PANEL_HD, PHIEN_BAN_HD };
export type { ChiChoToi, DichHd, HuongDan, ManHd, MucHd, NhomHd, PanelHd, PhanHd, TinhHuongHd, TuHd, VaiHd, ViecHd, ViecVaiKhac } from './kieu.ts';

export const HUONG_DAN: Partial<Record<VaiHd, HuongDan>> = { gv: HD_GV, ql: HD_QL, qt: HD_QT, tvv: HD_TVV, cx: HD_CX, admin: HD_ADMIN, ht: HD_HT, bpxl: HD_BPXL };

export const TEN_VAI_HD: Record<VaiHd, string> = {
  gv: t('Giáo viên'), ql: t('Head'), qt: t('Quản trị hệ thống'), tvv: t('Tư vấn viên'), cx: 'CX', admin: 'Admin', ht: 'Head tutor', bpxl: 'BPXL',
};

/** Vai của tài khoản cho Hướng dẫn: vai "rộng" nhất trước (QL dạy lớp vẫn đọc hướng dẫn QL). */
export function vaiHdCua(roles: readonly string[] = []): VaiHd {
  const thu: [string, VaiHd][] = [['system_admin', 'qt'], ['manager', 'ql'], ['teacher', 'gv'], ['consultant', 'tvv'], ['cx', 'cx'], ['office_admin', 'admin'], ['scheduler', 'bpxl'], ['head_tutor', 'ht']];
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
export function timHd(hd: HuongDan, q: string, chu: (k: Khoa) => string, manId?: string | null): { viec: ViecHd[]; muc: MucHd[]; tinhHuong: TinhHuongHd[]; vaiKhac: ViecVaiKhac[] } | null {
  const so = boSo(q);
  const soKhongDau = boSo(q, true);
  if (!so || !soKhongDau) return null;
  const co = (...xs: (Khoa | undefined)[]) => so(xs.filter((x): x is Khoa => !!x).map((x) => chu(x)).join(' '));
  const dongNghia = (tu?: string[]) => !!tu?.some((x) => soKhongDau(x));
  if (!hd.lam) return { viec: [], muc: moiMuc(locHd(hd, q, chu)), tinhHuong: [], vaiKhac: [] };
  return {
    viec: hd.lam.filter((v) => co(v.ten, v.loiChinh.chu, ...v.buoc, v.khiCo, v.xong, v.sai, v.sau, ...(v.khongDuoc ?? [])) || dongNghia(v.tuKhac)),
    muc: (manTheoId(hd, manId)?.muc ?? []).filter((m) => !m.viec && co(m.ten, ...m.buoc)),
    tinhHuong: (hd.tinhHuong ?? []).filter((x) => co(x.ten, ...(x.may ?? []), x.ban, ...(x.ai ?? [])) || dongNghia(x.tuKhac)),
    vaiKhac: (hd.vaiKhac ?? []).filter((v) => co(v.ten) || dongNghia(v.tuKhac)),
  };
}

/* ================================================================ HD3-1 (đặc tả `2026-11-13-overhaul-v6/15-huong-dan-v3.md`) */

/** Mã chèn hạn `{han:ma}` (15 mục 4.4) — hàm ở `domain/hanMacDinh.ts` (câu gợi ý nhóm việc của máy chủ dùng chung). */
export { chenHan };

/**
 * Loại dòng việc trên web (khớp `viecWeb` của thẻ) = nhóm máy chủ; HD3-2 tách các dòng cùng nhóm mà là việc khác nhau (15 mục 8.1 "đơn vị một thẻ = tên
 * dòng việc"): Chấm Speaking chung · Chọn PA (`chonPa`) · Bàn giao đổi GV (`ban_giao_gv:`) · Nhập điểm MT cũ (`missing_data` `lich-su:`) · Chốt ngày thi
 * (`missing_data` `chot-ngay-thi:`, HD3-3).
 */
export const MA_VIEC_TACH = ['cham_speaking', 'chon_pa', 'ban_giao_gv', 'mt_cu', 'chot_ngay_thi'] as const;
export function maViec(it: { group: string; key: string; chonPa?: boolean }): string {
  if (it.key === KHOA_CHAM_SPEAKING) return 'cham_speaking';
  if (it.group === 'xac_nhan_pa' && it.chonPa) return 'chon_pa';
  if (it.group === 'ban_giao' && it.key.startsWith('ban_giao_gv:')) return 'ban_giao_gv';
  if (it.group === 'missing_data' && it.key.startsWith('lich-su:')) return 'mt_cu';
  if (it.group === 'missing_data' && it.key.startsWith('chot-ngay-thi:')) return 'chot_ngay_thi';
  return it.group;
}

/** Nhóm cũ (HD-V2) → tab: dùng tới khi thẻ khai `tab` (HD3-2 … HD3-5). */
const TAB_CU: Record<string, string> = { diem: 'cham-diem', case: 'case-hoc-thuat', hv: 'hv', lich: 'khac', duyet: 'duyet', khac: 'khac' };
export const tabCuaThe = (v: ViecHd): string => v.tab ?? (v.chiS ? 'cham-cheo' : TAB_CU[v.nhom]);
/** Thứ tự nhóm của Tôi muốn…: Chờ bạn duyệt · tab Công việc (GV rồi TVV) · Học viên & lớp · Khác (đặc tả 15 mục 4.6). */
export const THU_TAB_HD: readonly string[] = ['duyet', ...TAB_CV, ...NHOM_CV_TVV, 'hv', 'khac'];
export const tenTabHd = (k: string, hd?: HuongDan): string => (hd?.tenTab?.[k] ? t(hd.tenTab[k]!) : k === 'duyet' ? t('Chờ bạn duyệt') : k === 'hv' ? t('Học viên & lớp') : k === 'khac' ? t('Khác')
  : nhanTabCv(k, (NHOM_CV_TVV as readonly string[]).includes(k)));

/**
 * Thẻ của DÒNG VIỆC đang mở (tầng 1). Thẻ viết MỘT lần theo người giữ việc (15 mục 4.5): việc của mình → tìm ở vai mình trước; việc của người
 * khác (QL làm thay, CX chỉ xem) → tìm ở vai khác trước. `vai` = vai có thẻ (dải "Việc của {vai}").
 */
export function theCuaViec(vaiXem: VaiHd, ma: string, mine: boolean): { the: ViecHd; vai: VaiHd } | null {
  const thu = (Object.keys(HUONG_DAN) as VaiHd[]).filter((v) => v !== 'qt');
  const ds = mine ? [vaiXem, ...thu.filter((v) => v !== vaiXem)] : [...thu.filter((v) => v !== vaiXem), vaiXem];
  for (const vai of ds) {
    const the = HUONG_DAN[vai]?.lam?.find((v) => v.viecWeb?.includes(ma));
    if (the) return { the, vai };
  }
  return null;
}

/** "Có gì mới" của phiên bản `PHIEN_BAN_HD` — ≤ 5 dòng, chung mọi vai; `the` = id thẻ mở khi bấm (không có: dòng chữ). */
export const CO_GI_MOI: { chu: Khoa; the?: string }[] = [
  { chu: 'Đang mở một việc, bấm "?" là thấy thẻ của đúng việc đó.' },
  { chu: 'Mỗi thẻ việc trả lời: khi nào có, làm gì, hạn, làm sai thì sửa ở đâu.' },
  { chu: 'Tab <b>Trường hợp</b>: tra khi em vắng, chuyển lớp, lưu lỗi…' },
  { chu: '<b>Tuần của tôi</b> thành bộ lọc nhịp ở tab <b>Tôi muốn…</b>.' },
  { chu: 'ⓘ ở dòng <b>Quy chế</b> mở thẻ việc của panel đang làm.' },
];
