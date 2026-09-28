/** TÊN LỚP (T1, T2, L1, PF5): máy ghép `{CN} {ký hiệu} {số}`; người dùng chỉ chọn và gõ số. Một nguồn cho web + máy chủ + migrate. */
export const THU_TU_KY_HIEU = ['FT', 'FT RF', 'Pre FOU', 'FOU', 'BE', 'ELE'] as const;
export type KyHieuLop = (typeof THU_TU_KY_HIEU)[number];
/** PF6: chỉ mở "Pre FOU" ở Tạo lớp khi PR-MON (một ô Tổng hợp) có trong cùng đợt deploy. PR-MON đổi dòng này thành `true`. */
export const CHO_TAO_PRE_FOU = false;
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

/** Quản trị › Lộ trình & chương trình: hai cột CHỈ ĐỌC (K1-47). Chỉ là CHỮ HIỂN THỊ — luật kỳ vọng / lịch MT thật thuộc PR-MT;
 *  PR-MT đổi luật thì sửa luôn hằng này cho khớp. */
export const LUAT_LO_TRINH_HIEN: Record<string, { kyVong: string; lichMt: string }> = {
  LT1: { kyVong: '−1.0 · −0.5 · target', lichMt: 'Tuần 6 · 12 · 16' },
  LT2: { kyVong: '−1.0 · −0.5 · target', lichMt: 'Tuần 6 · 12 · 16' },
  RF: { kyVong: 'Mọi MT = target', lichMt: 'Tuần 4 · 8' },
};
