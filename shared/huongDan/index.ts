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
import type { HuongDan, ManHd, MucHd, TuHd, VaiHd } from './kieu.ts';

export type { ChiChoToi, HuongDan, ManHd, MucHd, PhanHd, TuHd, VaiHd } from './kieu.ts';

export const HUONG_DAN: Partial<Record<VaiHd, HuongDan>> = { gv: HD_GV, ql: HD_QL, qt: HD_QT, tvv: HD_TVV, cx: HD_CX, admin: HD_ADMIN };

export const TEN_VAI_HD: Record<VaiHd, string> = {
  gv: t('Giáo viên'), ql: t('Quản lý'), qt: t('Quản trị hệ thống'), tvv: t('Tư vấn viên'), cx: 'CX', admin: 'Admin',
};

/** Vai của tài khoản cho Hướng dẫn: vai "rộng" nhất trước (QL dạy lớp vẫn đọc hướng dẫn QL). */
export function vaiHdCua(roles: readonly string[] = []): VaiHd {
  const thu: [string, VaiHd][] = [['system_admin', 'qt'], ['manager', 'ql'], ['teacher', 'gv'], ['consultant', 'tvv'], ['cx', 'cx'], ['office_admin', 'admin']];
  return thu.find(([r]) => roles.includes(r))?.[1] ?? 'gv';
}

/** Vai đang có nội dung để xem: vai của mình nếu đã có, không thì Giáo viên (HD-b lấp các vai còn lại). */
export const vaiCoNoiDung = (vai: VaiHd): VaiHd => (HUONG_DAN[vai] ? vai : 'gv');
/** QL / Quản trị có "Xem vai khác" — chỉ các vai đã có nội dung. */
export const coXemVaiKhac = (vai: VaiHd) => vai === 'ql' || vai === 'qt';
export const VAI_CO_NOI_DUNG = (Object.keys(HUONG_DAN) as VaiHd[]);

/** Màn của đường dẫn: tiền tố dài nhất (`/test/diem-lop` thắng `/test`; mục kết thúc "/" là "mọi trang con"); `'/'` chỉ khớp `/`. */
export function manCuaDuong(hd: HuongDan, pathname: string): ManHd | null {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
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
export const moiMuc = (hd: HuongDan): MucHd[] => [...hd.viec, ...hd.man.flatMap((m) => m.muc), ...hd.luat];

/** Bỏ dấu: "han" tìm ra "hạn", "de xuat" ra "Đề xuất". */
export const boDau = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const tuCua = (s: string) => s.replace(/<\/?b>/g, '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/**
 * Lọc cả 4 phần theo chữ đang hiện (`chu` = `t` của trang). Mỗi từ gõ phải là ĐẦU một từ trong mục ("han" không khớp "nhận");
 * gõ không dấu thì so không dấu, gõ có dấu thì so đúng dấu ("hạn" không ra "hàng"). Chữ rỗng → giữ nguyên. Màn giữ khi tên màn hoặc một mục khớp.
 */
export function locHd(hd: HuongDan, q: string, chu: (k: Khoa) => string): HuongDan {
  const go = tuCua(q);
  if (!go.length) return hd;
  const coDau = go.some((w) => boDau(w) !== w);
  const chuan = (s: string) => (coDau ? s : boDau(s));
  const can = go.map(chuan);
  const co = (...xs: (Khoa | undefined)[]) => {
    const ds = tuCua(xs.filter((x): x is Khoa => !!x).map((x) => chu(x)).join(' ')).map(chuan);
    return can.every((w) => ds.some((d) => d.startsWith(w)));
  };
  const khopMuc = (m: MucHd) => co(m.ten, m.khi, ...m.buoc);
  return {
    viec: hd.viec.filter(khopMuc),
    man: hd.man.flatMap((m) => (co(m.ten) ? [m] : m.muc.some(khopMuc) ? [{ ...m, muc: m.muc.filter(khopMuc) }] : [])),
    luat: hd.luat.filter(khopMuc),
    tu: hd.tu.filter((x: TuHd) => co(x.ten, x.nghia)),
  };
}
