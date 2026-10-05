/**
 * ĐIỂM THEO LỚP (PR-DL) — luật thuần cho mã lượt ở tham số `luot`.
 * FT: `mt:<n>` (attempt_no). Lớp thường: `thuong:progress` | `thuong:final` — chỉ theo `kind`, không số lượt
 * (DL-0, chủ sản phẩm 04/10: attempt_no lớp thường đánh theo lộ trình từng em, không dùng chung cả lớp).
 */
import { ATTEMPT_KIND_SHORT } from './normal.ts';
import { tuanLich } from './hienThiNgay.ts';
import { mondayOfDate } from './week.ts';

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
 * Lượt mở sẵn (DL-6b): trong các lượt còn ô trống, ưu tiên (1) tuần lớn nhất ≤ tuần chứa `homNay` (bài đã qua / đang thi);
 * (2) không có → tuần tương lai gần nhất; (3) không có → lượt chưa xếp tuần (NULL); mọi lượt đủ → lượt cuối theo tuần (NULL cuối).
 */
export function luotMacDinh(ds: TomTatLuot[], homNay: string): string | null {
  const xep = [...ds].sort((a, b) =>
    a.tuanStart === b.tuanStart ? 0 : a.tuanStart === null ? 1 : b.tuanStart === null ? -1 : a.tuanStart < b.tuanStart ? -1 : 1);
  const thuHai = mondayOfDate(homNay);
  const conTrong = xep.filter((l) => l.oTrong > 0);
  const daToi = conTrong.filter((l) => l.tuanStart !== null && l.tuanStart <= thuHai).at(-1);
  const tuongLai = conTrong.find((l) => l.tuanStart !== null && l.tuanStart > thuHai);
  return (daToi ?? tuongLai ?? conTrong.at(-1) ?? xep.at(-1))?.ma ?? null;
}

/** Dòng nhỏ dưới nút lượt (DL-5): "W3 JUL · 5/8 đủ điểm"; lượt chưa xếp tuần → chỉ số đủ; không ai có lịch → "chưa ai có lịch". */
export function dongPhuLuot(l: TomTatLuot): string {
  if (!l.coLich) return 'chưa ai có lịch';
  const dem = `${l.duDiem}/${l.coLich} đủ điểm`;
  return l.tuanStart ? `${tuanLich(l.tuanStart)} · ${dem}` : dem;
}

/**
 * "CHỈ Ô CÒN TRỐNG" (DL-5) — cùng nghĩa ô trống với số đếm máy chủ (G6): ô bắt buộc, chưa huỷ, chưa điểm, không mang dấu "-".
 * Không xét quyền sửa của người xem — khớp chip "MT2 còn 3 ô trống".
 */
export const oTrongLuotFt = (c: { required: boolean; progress: string; band: number | null; noShow?: unknown }) =>
  c.required && c.progress !== 'cancelled' && c.band === null && !c.noShow;

/** Lớp thường: "-" chỉ tính là xong khi dấu nằm đúng tuần thi hiện tại của môn; môn đã dời sang tuần sau vẫn là ô trống. */
export const hangThuongConTrong = (r: {
  skillSchedule: { skill: string; progress: string; noShow: boolean; movedFrom: string | null; periodCode: string | null }[];
  result: { skills: { skill: string; score: number | null }[] };
}) => r.skillSchedule.some((s) => s.progress !== 'cancelled' && s.progress !== 'skipped' && !(s.noShow && s.movedFrom === s.periodCode)
  && (r.result.skills.find((k) => k.skill === s.skill)?.score ?? null) === null);

/**
 * HỘP HỎI ĐỔI LƯỢT (PR-DL) — luật thuần cho `DiemTheoLop`. `hoi` = lượt muốn sang khi còn ô đang lưu; `cho` = đã bấm "Đợi rồi
 * chuyển"; `chan` = hộp đang nói "n ô chưa lưu…" (không còn đích chờ). Chỉ tự chuyển khi đã bấm "Đợi rồi chuyển"; lưu hỏng thì
 * bỏ đích, để "Lưu lại" về sau không tự nhảy sang lượt cũ. `sang` = lượt cần chuyển ngay (hoặc null).
 */
export type HoiDoiLuot = { hoi: string | null; cho: boolean; chan: boolean };
export const HOI_DOI_LUOT_RONG: HoiDoiLuot = { hoi: null, cho: false, chan: false };
export function yeuCauDoiLuot(ma: string, dangLuu: boolean, soLoi: number): { h: HoiDoiLuot; sang: string | null } {
  if (dangLuu) return { h: { hoi: ma, cho: false, chan: false }, sang: null };
  if (soLoi) return { h: { hoi: null, cho: false, chan: true }, sang: null };
  return { h: HOI_DOI_LUOT_RONG, sang: ma };
}
export function buocHoiDoiLuot(h: HoiDoiLuot, dangLuu: boolean, soLoi: number): { h: HoiDoiLuot; sang: string | null } {
  if (h.hoi && !dangLuu) {
    if (soLoi) return { h: { hoi: null, cho: false, chan: true }, sang: null };
    return { h: HOI_DOI_LUOT_RONG, sang: h.cho ? h.hoi : null };
  }
  if (h.chan && !soLoi) return { h: HOI_DOI_LUOT_RONG, sang: null };
  return { h, sang: null };
}
