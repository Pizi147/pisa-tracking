/**
 * ĐIỂM THEO LỚP (PR-DL) — luật thuần cho mã lượt ở tham số `luot`.
 * FT: `mt:<n>` (attempt_no). Lớp thường: `thuong:progress` | `thuong:final` — chỉ theo `kind`, không số lượt
 * (DL-0, chủ sản phẩm 04/10: attempt_no lớp thường đánh theo lộ trình từng em, không dùng chung cả lớp).
 */
import { ATTEMPT_KIND_SHORT } from './normal.ts';

export type MaLuot = { loai: 'mt'; so: number } | { loai: 'thuong'; kind: 'progress' | 'final' };

/** Sai dạng → null (máy chủ trả 400). Số MT dương, không số 0 đầu. */
export function docMaLuot(s: string): MaLuot | null {
  const mt = /^mt:([1-9]\d{0,5})$/.exec(s);
  if (mt) return { loai: 'mt', so: Number(mt[1]) };
  if (s === 'thuong:progress' || s === 'thuong:final') return { loai: 'thuong', kind: s.slice(7) as 'progress' | 'final' };
  return null;
}

export function vietMaLuot(m: MaLuot): string {
  return m.loai === 'mt' ? `mt:${m.so}` : `thuong:${m.kind}`;
}

export function nhanMaLuot(m: MaLuot): string {
  return m.loai === 'mt' ? `MT${m.so}` : ATTEMPT_KIND_SHORT[m.kind];
}

export type TomTatLuot = {
  ma: string; nhan: string; tuanStart: string | null; lichSu: boolean;
  duDiem: number; coLich: number; oTrong: number;
};

/**
 * Lượt mở sẵn: xếp theo tuần tăng dần, tuần NULL (lượt chưa xếp) xếp cuối; chọn lượt có tuần lớn nhất còn ô trống,
 * không có thì lượt NULL còn ô trống; mọi lượt đã đủ → lượt cuối theo thứ tự đó.
 */
export function luotMacDinh(ds: TomTatLuot[]): string | null {
  const xep = [...ds].sort((a, b) =>
    a.tuanStart === b.tuanStart ? 0 : a.tuanStart === null ? 1 : b.tuanStart === null ? -1 : a.tuanStart < b.tuanStart ? -1 : 1);
  const conTrong = xep.filter((l) => l.oTrong > 0);
  const coTuan = conTrong.filter((l) => l.tuanStart !== null);
  return (coTuan.at(-1) ?? conTrong.at(-1) ?? xep.at(-1))?.ma ?? null;
}
