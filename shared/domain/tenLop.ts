/** TÊN LỚP (T1, T2, L1, PF5): máy ghép `{CN} {ký hiệu} {số}`; người dùng chỉ chọn và gõ số. Một nguồn cho web + máy chủ + migrate. */
import { lichMtMacDinh } from './lichMt.ts';
export const THU_TU_KY_HIEU = ['FT', 'FT RF', 'Pre FOU', 'FOU', 'BE', 'ELE'] as const;
export type KyHieuLop = (typeof THU_TU_KY_HIEU)[number];
/** PF6: chỉ mở "Pre FOU" ở Tạo lớp khi PR-MON (một ô Tổng hợp) có trong cùng đợt deploy. PR-MON đổi dòng này thành `true`. */
export const CHO_TAO_PRE_FOU = true;
export const MAU_SO_LOP = /^\d{1,4}[A-Za-z]?$/;

export function kyHieuLop(chuongTrinh: string | null, loTrinh: string | null): KyHieuLop | null {
  const c = (chuongTrinh ?? '').trim().toUpperCase();
  if (c === 'FT') return loTrinh === 'RF' ? 'FT RF' : 'FT';
  if (c === 'PREFOU') return 'Pre FOU';
  if (c === 'FOU' || c === 'FOUND') return 'FOU';
  if (c === 'BE' || c === 'ELE') return c;
  return null;
}
export function kiemSoLop(so: string): string | null {
  const s = so.trim();
  if (!s) return 'Chưa gõ số lớp';
  return MAU_SO_LOP.test(s) ? null : 'Chỉ gõ số (1–4 chữ số), có thể thêm một chữ cái cuối, ví dụ 101A';
}
/** Lọc khi gõ: bỏ chữ trước số, giữ ≤ 4 chữ số + chữ cái ĐẦU TIÊN sau số; gõ tiếp sau chữ cái bị bỏ ("ft12a3" → "12A"). */
export function locSoLop(go: string): string {
  const m = go.replace(/[^0-9A-Za-z]/g, '').replace(/^[A-Za-z]+/, '').match(/^(\d{1,4})\d*([A-Za-z])?/);
  return m ? m[1] + (m[2]?.toUpperCase() ?? '') : '';
}
export function ghepMaLop(maCn: string, chuongTrinh: string, loTrinh: string | null, so: string): string {
  const kh = kyHieuLop(chuongTrinh, loTrinh);
  if (!kh) throw new Error('chương trình không có ký hiệu tên lớp');
  return `${maCn.trim().toUpperCase()} ${kh} ${so.trim().toUpperCase()}`;
}
export const chuanHoaMaLop = (s: string) => s.toLowerCase().replace(/[\s-]/g, '');
/** = chuanHoaMaLop viết bằng SQL — phải khớp chỉ mục ux_classes_ma_chuan trong schema.sql. */
export const khoaMaLopSql = (cot = 'code') => `lower(replace(replace(${cot}, '-', ''), ' ', ''))`;

/** Phần sau tiền tố chi nhánh: "FT RF 12" → { kh: 'FT RF', so: '12' } — nhận '-' và khoảng trắng tuỳ ý (tên cũ).
 *  Mã chi nhánh chỉ gồm chữ in hoa + số (initBanChinh kiểm `^[A-Z0-9]+$`) nên đưa thẳng vào RegExp được. */
function tachDuoi(code: string, maCn: string): { kh: KyHieuLop; so: string } | 'khong-tien-to' | 'khong-theo-mau' {
  const m = new RegExp(`^${maCn}[\\s-]+(.+)$`, 'i').exec(code.trim());
  if (!m) return 'khong-tien-to';
  const d = /^(FT[\s-]*RF|FT|PRE[\s-]*FOU|FOUND|FOU|BE|ELE)[\s-]*(\d{1,4}[A-Za-z]?)$/i.exec(m[1].trim());
  if (!d) return 'khong-theo-mau';
  const t = d[1].toUpperCase().replace(/[\s-]/g, '');
  const kh: KyHieuLop = t === 'FTRF' ? 'FT RF' : t === 'PREFOU' ? 'Pre FOU' : t === 'FOUND' ? 'FOU' : (t as KyHieuLop);
  return { kh, so: d[2].toUpperCase() };
}
export function tachSoLop(code: string, maCn: string): string | null {
  const r = tachDuoi(code, maCn);
  return typeof r === 'string' ? null : r.so;
}
export type LopSapXep = { code: string; branchId?: number | null };
/** Chỉ để SẮP XẾP hiển thị — đọc ký hiệu từ tên là được ở đây (không dùng kết quả này cho luật, K2-24). */
export function soSanhLop(a: LopSapXep, b: LopSapXep): number {
  if ((a.branchId ?? 0) !== (b.branchId ?? 0)) return (a.branchId ?? 0) - (b.branchId ?? 0);
  const khoa = (x: LopSapXep) => {
    const cn = x.code.trim().split(/[\s-]+/)[0] ?? '';
    const r = tachDuoi(x.code, cn);
    return typeof r === 'string'
      ? { cn, bac: 99, so: Number.MAX_SAFE_INTEGER, chu: x.code }
      : { cn, bac: THU_TU_KY_HIEU.indexOf(r.kh), so: parseInt(r.so, 10), chu: r.so.replace(/^\d+/, '') };
  };
  const x = khoa(a); const y = khoa(b);
  return x.cn.localeCompare(y.cn) || x.bac - y.bac || x.so - y.so || x.chu.localeCompare(y.chu) || a.code.localeCompare(b.code);
}
export type DoiTenCu = { moi: string } | { loi: 'khong-tien-to' | 'khong-theo-mau' | 'lech-chuong-trinh' };
/** T2: ký hiệu trên tên phải KHỚP cột chương trình/lộ trình — lệch thì không đoán, đưa vào danh sách hỏi chủ sản phẩm. */
export function tenMoiChoLopCu(l: { code: string; branchCode: string; programmeCode: string | null; route: string | null }): DoiTenCu {
  const r = tachDuoi(l.code, l.branchCode);
  if (typeof r === 'string') return { loi: r };
  if (r.kh !== kyHieuLop(l.programmeCode, l.route)) return { loi: 'lech-chuong-trinh' };
  return { moi: `${l.branchCode.toUpperCase()} ${r.kh} ${r.so}` };
}

/** Quản trị › Lộ trình & chương trình: hai cột CHỈ ĐỌC (K1-47). Chỉ là CHỮ HIỂN THỊ — lịch MT một nguồn: lichMt.ts (K1-49). */
const lichMtHien = (route: string) => 'Tuần ' + lichMtMacDinh(route).join(' · ');
export const LUAT_LO_TRINH_HIEN: Record<string, { kyVong: string; lichMt: string }> = {
  LT1: { kyVong: '−1.0 · −0.5 · Target', lichMt: lichMtHien('LT1') },
  LT2: { kyVong: '−1.0 · −0.5 · Target', lichMt: lichMtHien('LT2') },
  RF: { kyVong: 'Mọi MT = Target', lichMt: lichMtHien('RF') },
};

// ==================================================================== PR-QU (C): tạo nhiều lớp một lần

/** Tối đa bấy nhiêu dòng một lần "Tạo n lớp" (G5). */
export const TOI_DA_DONG_TAO_LOP = 30;
export type TruongDongTaoLop = 'so' | 'chuongTrinh' | 'loTrinh' | 'tuan' | 'slots' | 'branchId';
/** Lỗi của MỘT dòng lưới tạo lớp; `truong` trống = lỗi cả dòng. `dong` đếm từ 1 như người dùng thấy. */
export type LoiDong = { dong: number; truong?: TruongDongTaoLop; loi: string };

const tachSo = (s: string) => /^(\d{1,4})[A-Za-z]?$/.exec(s.trim());

/**
 * Số tiếp theo cho (chi nhánh, chương trình, lộ trình): lớn nhất trong các mã đã có cùng tiền tố (`tienTo` = phần trước số, ví dụ
 * "MB FT", "MB FT RF", "MB Pre FOU") và các số đang soạn ở lưới, cộng 1. Giữ độ rộng số 0 đứng đầu ("03" → "04"); chữ cái cuối bỏ qua.
 */
export function goiYSoTiep(daCo: string[], dangSoan: string[], tienTo: string): string {
  const goc = chuanHoaMaLop(tienTo);
  const so: string[] = [];
  for (const ma of daCo) {
    const k = chuanHoaMaLop(ma);
    if (!k.startsWith(goc)) continue;
    const m = tachSo(k.slice(goc.length));
    if (m) so.push(m[1]);
  }
  for (const s of dangSoan) { const m = tachSo(s); if (m) so.push(m[1]); }
  if (!so.length) return '01';
  const rong = Math.max(...so.map((x) => x.length));
  const lon = Math.max(...so.map((x) => parseInt(x, 10)));
  return String(Math.min(lon + 1, 9999)).padStart(rong, '0');
}

/** "+ Thêm n dòng giống dòng trên": chép mọi ô (chi nhánh, chương trình, lộ trình, tuần, GV), số tự tăng từ số của dòng gốc. */
export function themDongGiong<T extends { so: string }>(dong: T, n: number, dangSoan: string[] = []): T[] {
  const ra: T[] = [];
  const da = [...dangSoan, dong.so];
  for (let i = 0; i < Math.max(0, Math.floor(n)); i += 1) {
    const so = goiYSoTiep([], da, '');
    da.push(so);
    ra.push({ ...dong, so });
  }
  return ra;
}

/** Gom lỗi theo dòng → ô, để lưới gắn đúng lỗi vào đúng ô; lỗi không có `truong` vào `chung`. Mỗi ô giữ lỗi ĐẦU TIÊN. */
export function gopLoiTheoDong(loi: readonly LoiDong[]): Record<number, Partial<Record<TruongDongTaoLop | 'chung', string>>> {
  const ra: Record<number, Partial<Record<TruongDongTaoLop | 'chung', string>>> = {};
  for (const l of loi) {
    const o = (ra[l.dong] ??= {});
    const k = l.truong ?? 'chung';
    o[k] ??= l.loi;
  }
  return ra;
}
