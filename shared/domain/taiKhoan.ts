import { ROLES } from './people.ts';
import { chuanTieuDe } from './nhapHocVien.ts';

/** QUẢN TRỊ › TÀI KHOẢN — lọc/nhóm/phân loại ở trình duyệt (PR-BC, L3). Không đổi `/admin/accounts`. */
export type TaiKhoanLoc = { id: number; code: string; fullName: string; email: string | null; skills: string[];
  roles: { role: string; branchCode: string | null }[]; extra: unknown[];
  /** SUA-NHO-QUYEN: có ít nhất một phân công dạy đang hiệu lực (`teacher_assignments.status = 'active'`). */
  dangDay?: boolean };
/** chiNhanh: 'tat-ca' | 'toan-he-thong' | mã chi nhánh; vai: 'tat-ca' | Role; kyNang: 'tat-ca' | 'L'|'R'|'W'|'S';
 *  phanLoai: null | 'chua-vai' | 'chua-email' | 'chua-ky-nang' */
export type BoLocTaiKhoan = { chiNhanh: string; vai: string; kyNang: string; q: string; phanLoai: string | null };
export const BO_LOC_TAI_KHOAN_TRONG: BoLocTaiKhoan = { chiNhanh: 'tat-ca', vai: 'tat-ca', kyNang: 'tat-ca', q: '', phanLoai: null };
export const KY_NANG_TAI_KHOAN = ['L', 'R', 'W', 'S'] as const;
export const PHAN_LOAI_TAI_KHOAN = ['chua-vai', 'chua-email', 'chua-ky-nang'] as const;

const cnKhop = (cn: string, g: { branchCode: string | null }) =>
  cn === 'tat-ca' || (cn === 'toan-he-thong' ? g.branchCode === null : g.branchCode === cn);

function thuocPhanLoai(u: TaiKhoanLoc, pl: string): boolean {
  /* OV-11b (QT-10d): "Chưa có kỹ năng" chỉ đếm người dạy — chủ SP 30/10: vai Giáo viên HOẶC đang được phân công dạy (kể cả QL không vai GV). */
  return pl === 'chua-vai' ? u.roles.length === 0 : pl === 'chua-email' ? !u.email
    : pl === 'chua-ky-nang' ? u.skills.length === 0 && (u.roles.some((g) => g.role === 'teacher') || !!u.dangDay) : true;
}

export function locTaiKhoan<T extends TaiKhoanLoc>(rows: T[], loc: BoLocTaiKhoan): T[] {
  const q = chuanTieuDe(loc.q);
  return rows.filter((u) => {
    /* CÙNG một lần cấp vai phải khớp cả vai lẫn chi nhánh: "GV ở BC + QL ở MB" không phải "GV Monbay". */
    if ((loc.chiNhanh !== 'tat-ca' || loc.vai !== 'tat-ca')
      && !u.roles.some((g) => (loc.vai === 'tat-ca' || g.role === loc.vai) && cnKhop(loc.chiNhanh, g))) return false;
    if (loc.kyNang !== 'tat-ca' && !u.skills.includes(loc.kyNang)) return false;
    if (loc.phanLoai && !thuocPhanLoai(u, loc.phanLoai)) return false;
    if (q && !chuanTieuDe(`${u.fullName} ${u.code} ${u.email ?? ''}`).includes(q)) return false;
    return true;
  });
}

/**
 * Nhóm theo chi nhánh/vai — người có vai ở 2 chi nhánh nằm ở CẢ 2 nhóm; không vai → "Chưa có vai trò".
 * `loc` (nếu có): chỉ xét lần cấp vai khớp bộ lọc vai/chi nhánh đang chọn — đang lọc "Giáo viên" thì vai QL ở BC không kéo người vào nhóm BC.
 * Thứ tự nhóm: chi nhánh theo thứ tự `tenChiNhanh`, rồi "Toàn hệ thống", cuối cùng "Chưa có vai trò".
 */
export function nhomTaiKhoan<T extends TaiKhoanLoc>(rows: T[], theo: 'chi-nhanh' | 'vai', tenChiNhanh: Map<string, string>,
  tenVai: (r: string) => string = (r) => r, loc: BoLocTaiKhoan = BO_LOC_TAI_KHOAN_TRONG): { key: string; nhan: string; rows: T[] }[] {
  const nhom = new Map<string, { key: string; nhan: string; rows: T[] }>();
  const them = (key: string, nhan: string, u: T) => {
    const g = nhom.get(key) ?? nhom.set(key, { key, nhan, rows: [] }).get(key)!;
    if (!g.rows.includes(u)) g.rows.push(u);
  };
  for (const u of rows) {
    if (!u.roles.length) { them('chua-vai', 'Chưa có vai trò', u); continue; }
    for (const g of u.roles) {
      if (!((loc.vai === 'tat-ca' || g.role === loc.vai) && cnKhop(loc.chiNhanh, g))) continue;
      if (theo === 'vai') them(g.role, tenVai(g.role), u);
      else if (g.branchCode === null) them('toan-he-thong', 'Toàn hệ thống', u);
      else them(g.branchCode, tenChiNhanh.get(g.branchCode) ?? g.branchCode, u);
    }
  }
  const thuTu = theo === 'vai' ? [...ROLES] as string[] : [...tenChiNhanh.keys(), 'toan-he-thong'];
  const hang = (k: string) => (k === 'chua-vai' ? Infinity : thuTu.indexOf(k) === -1 ? thuTu.length : thuTu.indexOf(k));
  return [...nhom.values()].sort((x, y) => hang(x.key) - hang(y.key));
}

export function phanLoaiTaiKhoan(rows: TaiKhoanLoc[]): Record<(typeof PHAN_LOAI_TAI_KHOAN)[number], number> {
  return Object.fromEntries(PHAN_LOAI_TAI_KHOAN.map((k) => [k, rows.filter((u) => thuocPhanLoai(u, k)).length])) as Record<(typeof PHAN_LOAI_TAI_KHOAN)[number], number>;
}

/** J10: cột "Quyền cấp riêng" chỉ hiện khi có ít nhất một người được cấp riêng. */
export const coQuyenCapRieng = (rows: TaiKhoanLoc[]): boolean => rows.some((u) => u.extra.length > 0);

/** `?cn=MB&vai=teacher&kn=L&q=..&loai=chua-email` — giá trị lạ về mặc định, không ném. */
export function docBoLocTaiKhoan(qs: URLSearchParams): BoLocTaiKhoan {
  const vai = qs.get('vai') ?? '';
  const kn = qs.get('kn') ?? '';
  const loai = qs.get('loai') ?? '';
  return {
    chiNhanh: (qs.get('cn') ?? '').slice(0, 20) || 'tat-ca',
    vai: (ROLES as readonly string[]).includes(vai) ? vai : 'tat-ca',
    kyNang: (KY_NANG_TAI_KHOAN as readonly string[]).includes(kn) ? kn : 'tat-ca',
    q: (qs.get('q') ?? '').slice(0, 100),
    phanLoai: (PHAN_LOAI_TAI_KHOAN as readonly string[]).includes(loai) ? loai : null,
  };
}

export function ghiBoLocTaiKhoan(loc: BoLocTaiKhoan): Record<string, string | null> {
  return {
    cn: loc.chiNhanh === 'tat-ca' ? null : loc.chiNhanh, vai: loc.vai === 'tat-ca' ? null : loc.vai,
    kn: loc.kyNang === 'tat-ca' ? null : loc.kyNang, q: loc.q || null, loai: loc.phanLoai,
  };
}
